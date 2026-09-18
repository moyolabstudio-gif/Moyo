package com.springboot.project.service.impl;

import java.nio.file.Path;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import com.springboot.project.dao.IcontentFileDAO;
import com.springboot.project.dao.IcontentRecordDAO;
import com.springboot.project.dao.IcontentRecordItemDAO;
import com.springboot.project.dto.contentFileDTO;
import com.springboot.project.dto.contentRecordItemDTO;
import com.springboot.project.dto.contentRecordTargetDTO;
import com.springboot.project.service.*;

@Service
public class contentFileServiceImpl implements IcontentFileService {
    private static final int MAX_FILES_PER_UPLOAD = 10;
    private static final long MAX_FILE_BYTES = 20L * 1024 * 1024;
    private static final long MAX_RECORD_FILE_BYTES = 100L * 1024 * 1024;
    private final IcontentFileDAO fileDAO;
    private final IcontentRecordDAO recordDAO;
    private final IcontentRecordItemDAO itemDAO;
    private final IcontentRecordService recordService;
    private final IcontentShareService contentShareService;
    private final WorkspaceAuthorizationService workspaceAuthorizationService;
    private final IprojectAuthorizationService projectAuthorizationService;
    private final contentFileStorageService storage;
    public contentFileServiceImpl(IcontentFileDAO fileDAO,IcontentRecordDAO recordDAO,IcontentRecordItemDAO itemDAO,
                                  IcontentRecordService recordService,IcontentShareService contentShareService,
                                  WorkspaceAuthorizationService workspaceAuthorizationService,
                                  IprojectAuthorizationService projectAuthorizationService,
                                  contentFileStorageService storage) {
        this.fileDAO=fileDAO;
        this.recordDAO=recordDAO;
        this.itemDAO=itemDAO;
        this.recordService=recordService;
        this.contentShareService=contentShareService;
        this.workspaceAuthorizationService=workspaceAuthorizationService;
        this.projectAuthorizationService=projectAuthorizationService;
        this.storage=storage;
    }
    @Override @Transactional
    public contentFileDTO upload(MultipartFile multipart,String scopeType,Long wsId,Long projId,String description,Long userId) {
        requireUser(userId);
        FileScope scope=validateStandaloneScope(scopeType,wsId,projId,userId);
        return saveFile(multipart,scope,description,userId);
    }
    @Override @Transactional
    public List<contentRecordItemDTO> uploadToRecord(Long targetId,List<MultipartFile> files,List<String> originalNames,Long userId) {
        contentRecordTargetDTO target=requireEditable(targetId,userId);
        if(files==null||files.stream().noneMatch(f->f!=null&&!f.isEmpty())) throw new IllegalArgumentException("업로드할 파일을 선택하세요.");
        List<MultipartFile> selected=files.stream().filter(f->f!=null&&!f.isEmpty()).toList();
        if(selected.size()>MAX_FILES_PER_UPLOAD) throw new IllegalArgumentException("한 번에 최대 10개 파일까지 업로드할 수 있습니다.");
        long batchBytes=0L;
        for(MultipartFile multipart:selected) {
            if(multipart.getSize()>MAX_FILE_BYTES) throw new IllegalArgumentException("파일당 최대 크기는 20MB입니다: "+multipart.getOriginalFilename());
            batchBytes=Math.addExact(batchBytes,multipart.getSize());
        }
        long currentBytes=Optional.ofNullable(itemDAO.sumActiveFileSize(targetId)).orElse(0L);
        if(currentBytes+batchBytes>MAX_RECORD_FILE_BYTES) throw new IllegalArgumentException("이 기록에는 파일을 최대 100MB까지 첨부할 수 있습니다.");
        FileScope scope=scopeFromTarget(target,userId);
        Long recordFolderId=itemDAO.selectRecordFileFolderId(targetId);
        if(recordFolderId==null) recordFolderId=recordService.ensureFileFolder(targetId,userId);
        itemDAO.moveRecordFilesToFolder(targetId,recordFolderId,userId);
        List<contentRecordItemDTO> result=new ArrayList<>();
        for(int index=0;index<selected.size();index++) {
            MultipartFile multipart=selected.get(index);
            String originalName=originalNames!=null&&index<originalNames.size()?originalNames.get(index):null;
            contentFileDTO saved=saveFile(multipart,scope,null,userId,originalName,recordFolderId);
            result.add(connectExisting(targetId,saved.getContentFileId(),userId));
        }
        return result;
    }
    @Override @Transactional
    public contentRecordItemDTO connectExisting(Long targetId,Long fileId,Long userId) {
        contentRecordTargetDTO target=requireEditable(targetId,userId);
        contentFileDTO file=requireOwned(fileId,userId);
        assertScopeCompatible(target,file);
        if(fileDAO.countActiveReferences(fileId)>0) throw new IllegalArgumentException("이미 다른 기록에 연결된 파일입니다.");
        contentRecordItemDTO item=new contentRecordItemDTO();
        item.setRecordTargetId(targetId);
        item.setRecordType("FILE");
        item.setContentId(fileId);
        item.setTitle(file.getOriginalName());
        item.setSortOrder(itemDAO.countByType(targetId,"FILE")+1);
        item.setCreatedBy(userId);
        itemDAO.insertItem(item);
        return withDownloadUrl(itemDAO.selectItem(targetId,item.getRecordItemId(),userId));
    }
    @Override @Transactional
    public void removeFromRecord(Long targetId,Long recordItemId,Long userId) {
        recordService.getDeletableTarget(targetId,userId);
        contentRecordItemDTO current=itemDAO.selectItem(targetId,recordItemId,userId);
        if(current==null||!"FILE".equalsIgnoreCase(current.getRecordType())||current.getContentId()==null) throw new IllegalArgumentException("삭제할 파일을 찾을 수 없습니다.");
        contentFileDTO file=fileDAO.selectById(current.getContentId());
        if(file==null) throw new IllegalArgumentException("삭제할 파일을 찾을 수 없습니다.");
        if(itemDAO.softDeleteFileItem(targetId,recordItemId)<=0) throw new IllegalArgumentException("삭제할 파일을 찾을 수 없습니다.");
        if(fileDAO.countActiveReferences(file.getContentFileId())>0) throw new IllegalStateException("다른 기록에서 사용 중인 파일은 삭제할 수 없습니다.");
        if(fileDAO.softDeleteById(file.getContentFileId(),userId)<=0) throw new IllegalArgumentException("삭제할 파일을 찾을 수 없습니다.");
        schedulePhysicalDelete(file);
    }
    @Override public List<contentFileDTO> getOwnedFiles(Long userId) {
        requireUser(userId);
        return fileDAO.selectOwned(userId);
    }
    @Override
    public Map<String, Object> getFilePage(
            String scopeType,
            Long wsId,
            Long projId,
            String keyword,
            String fileType,
            String sort,
            int page,
            int size,
            Long userId) {

        FileScope scope = validateStandaloneScope(scopeType, wsId, projId, userId);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 5), 50);
        String safeKeyword = keyword == null ? "" : keyword.trim();
        String safeFileType = fileType == null ? "ALL" : fileType.trim().toUpperCase(Locale.ROOT);
        String safeSort = sort == null ? "LATEST" : sort.trim().toUpperCase(Locale.ROOT);

        int totalCount = fileDAO.countPage(
                scope.scopeType,
                scope.ownerUserId,
                scope.wsId,
                scope.projId,
                safeKeyword,
                safeFileType,
                userId);

        int totalPages = Math.max(1, (int) Math.ceil(totalCount / (double) safeSize));
        safePage = Math.min(safePage, totalPages);

        List<contentFileDTO> items = fileDAO.selectPage(
                scope.scopeType,
                scope.ownerUserId,
                scope.wsId,
                scope.projId,
                safeKeyword,
                safeFileType,
                safeSort,
                (safePage - 1) * safeSize,
                safeSize,
                userId);

        long totalBytes = Optional.ofNullable(fileDAO.sumPageBytes(
                scope.scopeType,
                scope.ownerUserId,
                scope.wsId,
                scope.projId,
                safeKeyword,
                safeFileType,
                userId)).orElse(0L);

        boolean canManage = fileDAO.countCanManage(
                scope.scopeType,
                scope.wsId,
                scope.projId,
                userId) > 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("totalCount", totalCount);
        result.put("totalPages", totalPages);
        result.put("totalBytes", totalBytes);
        result.put("canManage", canManage);
        return result;
    }
    @Override public List<contentFileDTO> getFiles(String scopeType,Long wsId,Long projId,Long userId) {
        FileScope scope=validateStandaloneScope(scopeType,wsId,projId,userId);
        return fileDAO.selectByScope(scope.scopeType,scope.ownerUserId,scope.wsId,scope.projId,userId);
    }
    @Override public List<contentFileDTO> getDashboardLatestFiles(String scopeType,Long wsId,Long projId,int limit,Long userId) {
        FileScope scope=validateStandaloneScope(scopeType,wsId,projId,userId);
        int safeLimit=Math.min(Math.max(limit,1),10);
        return fileDAO.selectLatestByScope(scope.scopeType,scope.ownerUserId,scope.wsId,scope.projId,safeLimit,userId);
    }
    @Override public contentFileDTO getAccessibleFile(Long fileId,Long userId) {
        requireUser(userId);
        contentFileDTO file=fileDAO.selectById(fileId);
        if(file==null) throw new IllegalArgumentException("파일을 찾을 수 없습니다.");
        List<Long> recordTargetIds=fileDAO.selectActiveTargetIds(fileId);
        if(recordTargetIds!=null&&!recordTargetIds.isEmpty()) {
            for(Long targetId:recordTargetIds) {
                try {
                    recordService.getViewableTarget(targetId,userId);
                    return file;
                } catch(RuntimeException ignored) {
                }
            }
            throw new SecurityException("이 기록 파일에 접근할 권한이 없습니다.");
        }
        if(contentShareService.canRead("FILE",fileId,userId)) return file;

        // 그룹/그룹 프로젝트 파일은 CONTENT_SHARES의 공개 범위 정책을 최종 기준으로 삼는다.
        // 비밀 파일이 일반 멤버의 단순 scope 소속 여부로 다시 허용되는 우회를 막는다.
        String scopeType = String.valueOf(file.getScopeType()).toUpperCase(Locale.ROOT);
        if ("GROUP".equals(scopeType) || "PROJECT".equals(scopeType)) {
            throw new SecurityException("파일을 볼 권한이 없습니다.");
        }

        if(canViewScope(file,userId)) return file;
        throw new SecurityException("파일을 볼 권한이 없습니다.");
    }
    @Override public contentFileDTO getMovableFile(Long fileId,Long userId) {
        requireUser(userId);
        contentFileDTO file=fileDAO.selectById(fileId);
        if(file==null) throw new IllegalArgumentException("파일을 찾을 수 없습니다.");
        if(contentShareService.canEdit("FILE",fileId,userId)) return file;
        if(Objects.equals(file.getCreatedBy(),userId)) return file;
        String scope=String.valueOf(file.getScopeType()).toUpperCase(Locale.ROOT);
        if("GROUP".equals(scope) && workspaceAuthorizationService.canManage(file.getWsId(),userId)) return file;
        if("PROJECT".equals(scope) && projectAuthorizationService.canManageProject(file.getProjId(),userId)) return file;
        throw new SecurityException("파일을 이동할 권한이 없습니다.");
    }

    @Override public Path getAccessiblePath(Long fileId,Long userId) {
        contentFileDTO file=getAccessibleFile(fileId,userId);
        Path path=storage.resolve(file.getFilePath());
        if(!java.nio.file.Files.isRegularFile(path)) throw new IllegalArgumentException("실제 파일을 찾을 수 없습니다.");
        return path;
    }
    @Override @Transactional
    public contentFileDTO rename(Long fileId,String name,Long userId) {
        contentFileDTO file=requireEditableFile(fileId,userId);
        String originalName=buildRenamedFileName(file,name);
        if(fileDAO.updateMetadata(fileId,originalName,file.getDescription(),userId)<=0) throw new IllegalArgumentException("이름을 변경할 파일을 찾을 수 없습니다.");
        return fileDAO.selectById(fileId);
    }
    @Override
    @Transactional
    public contentFileDTO updateMetadata(
            Long fileId,
            String name,
            String description,
            Long userId) {

        contentFileDTO file = requireEditableFile(fileId, userId);
        String originalName = buildRenamedFileName(file, name);
        String cleanDescription = clean(description, 2000);

        if (fileDAO.updateMetadata(fileId, originalName, cleanDescription, userId) <= 0) {
            throw new IllegalArgumentException("수정할 파일을 찾을 수 없습니다.");
        }
        return fileDAO.selectById(fileId);
    }
    @Override @Transactional
    public void deleteStandalone(Long fileId,Long userId) {
        contentFileDTO file=requireDeletableFile(fileId,userId);
        if(fileDAO.countActiveReferences(fileId)>0) throw new IllegalStateException("기록에 연결된 파일은 먼저 기록에서 제거하세요.");
        if(fileDAO.softDeleteById(fileId,userId)<=0) throw new IllegalArgumentException("삭제할 파일을 찾을 수 없습니다.");
        schedulePhysicalDelete(file);
    }
    private contentFileDTO saveFile(MultipartFile multipart,FileScope scope,String description,Long userId) {
        return saveFile(multipart,scope,description,userId,null,null);
    }
    private contentFileDTO saveFile(MultipartFile multipart,FileScope scope,String description,Long userId,String originalName) {
        return saveFile(multipart,scope,description,userId,originalName,null);
    }
    private contentFileDTO saveFile(MultipartFile multipart,FileScope scope,String description,Long userId,String originalName,Long folderId) {
        var stored=storage.store(multipart,originalName);
        registerRollbackDelete(stored.relativePath());
        try {
            contentFileDTO dto=new contentFileDTO();
            dto.setScopeType(scope.scopeType);
            dto.setOwnerUserId(scope.ownerUserId);
            dto.setWsId(scope.wsId);
            dto.setProjId(scope.projId);
            dto.setFolderId(folderId);
            dto.setOriginalName(stored.originalName());
            dto.setStoredName(stored.storedName());
            dto.setFilePath(stored.relativePath());
            dto.setFileExt(stored.extension());
            dto.setMimeType(stored.contentType());
            dto.setFileSize(stored.size());
            dto.setDescription(clean(description,2000));
            dto.setCreatedBy(userId);
            fileDAO.insert(dto);
            return fileDAO.selectById(dto.getContentFileId());
        } catch(RuntimeException e) {
            storage.deleteQuietly(stored.relativePath());
            throw e;
        }
    }
    private FileScope validateStandaloneScope(String raw,Long wsId,Long projId,Long userId) {
        String scope=String.valueOf(raw==null?"PERSONAL":raw).trim().toUpperCase(Locale.ROOT);
        if("PERSONAL".equals(scope)) return new FileScope("PERSONAL",userId,null,null);
        if("GROUP".equals(scope)) {
            if(!workspaceAuthorizationService.isMember(wsId,userId)) throw new SecurityException("해당 그룹의 파일을 등록할 권한이 없습니다.");
            return new FileScope("GROUP",null,wsId,null);
        }
        if("PROJECT".equals(scope)) {
            if(!projectAuthorizationService.canAccessProject(projId,wsId,userId)) throw new SecurityException("해당 프로젝트의 파일을 등록할 권한이 없습니다.");
            return new FileScope("PROJECT",null,null,projId);
        }
        throw new IllegalArgumentException("파일 범위가 올바르지 않습니다.");
    }
    private FileScope scopeFromTarget(contentRecordTargetDTO target,Long userId) {
        String scope=String.valueOf(target.getScopeType()).toUpperCase(Locale.ROOT);
        if("PERSONAL".equals(scope)) return new FileScope("PERSONAL",target.getOwnerUserId()!=null?target.getOwnerUserId():userId,null,null);
        if("GROUP".equals(scope)) return new FileScope("GROUP",null,target.getWsId(),null);
        if(Set.of("PERSONAL_PROJECT","GROUP_PROJECT","PROJECT").contains(scope)) return new FileScope("PROJECT",null,null,target.getProjId());
        throw new IllegalStateException("기록 대상의 파일 범위를 확인할 수 없습니다.");
    }
    private void assertScopeCompatible(contentRecordTargetDTO target,contentFileDTO file) {
        FileScope expected=scopeFromTarget(target,file.getCreatedBy());
        if(!Objects.equals(expected.scopeType,file.getScopeType())||!Objects.equals(expected.ownerUserId,file.getOwnerUserId()) ||!Objects.equals(expected.wsId,file.getWsId())||!Objects.equals(expected.projId,file.getProjId())) throw new IllegalArgumentException("파일 범위와 기록 대상 범위가 일치하지 않습니다.");
    }
    private boolean canViewScope(contentFileDTO file,Long userId) {
        if(Objects.equals(file.getCreatedBy(),userId)) return true;
        String scope=String.valueOf(file.getScopeType()).toUpperCase(Locale.ROOT);
        if("PERSONAL".equals(scope)) return Objects.equals(file.getOwnerUserId(),userId);
        if("GROUP".equals(scope)) return workspaceAuthorizationService.isMember(file.getWsId(),userId);
        if("PROJECT".equals(scope)) return projectAuthorizationService.canAccessProject(file.getProjId(),file.getWsId(),userId);
        return false;
    }
    private contentFileDTO requireEditableFile(Long id, Long userId) {
        requireUser(userId);
        contentFileDTO file=fileDAO.selectById(id);
        if(file==null) throw new IllegalArgumentException("파일을 찾을 수 없습니다.");
        if(contentShareService.canEdit("FILE", id, userId)) return file;
        throw new SecurityException("파일을 편집할 권한이 없습니다.");
    }

    private contentFileDTO requireDeletableFile(Long id, Long userId) {
        requireUser(userId);
        contentFileDTO file=fileDAO.selectById(id);
        if(file==null) throw new IllegalArgumentException("파일을 찾을 수 없습니다.");
        if(Objects.equals(file.getCreatedBy(),userId)) return file;
        String scopeType=String.valueOf(file.getScopeType()).toUpperCase(Locale.ROOT);
        if("GROUP".equals(scopeType) && workspaceAuthorizationService.canManage(file.getWsId(),userId)) return file;
        if("PROJECT".equals(scopeType) && projectAuthorizationService.canManageProject(file.getProjId(),userId)) return file;
        throw new SecurityException("파일을 삭제할 권한이 없습니다.");
    }

    private contentFileDTO requireOwned(Long id,Long userId) {
        requireUser(userId);
        contentFileDTO file=fileDAO.selectById(id);
        if(file==null) throw new IllegalArgumentException("파일을 찾을 수 없습니다.");
        if(!Objects.equals(file.getCreatedBy(),userId)) throw new SecurityException("파일을 관리할 권한이 없습니다.");
        return file;
    }
    private contentRecordTargetDTO requireEditable(Long targetId,Long userId) {
        if(targetId==null) throw new IllegalArgumentException("기록 대상이 필요합니다.");
        contentRecordTargetDTO target=recordService.getEditableTarget(targetId,userId);
        if(!Set.of("DRAFT","ACTIVE").contains(String.valueOf(target.getTargetStatus()).toUpperCase(Locale.ROOT))) throw new IllegalStateException("파일을 추가할 수 없는 기록입니다.");
        return target;
    }
    private contentRecordItemDTO withDownloadUrl(contentRecordItemDTO item) {
        if(item!=null&&item.getContentId()!=null) item.setFileDownloadUrl("/api/files/"+item.getContentId()+"/download");
        return item;
    }
    private void registerRollbackDelete(String path) {
        if(!TransactionSynchronizationManager.isSynchronizationActive()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){ @Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED) storage.deleteQuietly(path);} });
    }
    private void schedulePhysicalDelete(contentFileDTO file) {
        Runnable action=()->storage.deleteQuietly(file.getFilePath());
        if(TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){action.run();}});
        else action.run();
    }
    private String buildRenamedFileName(contentFileDTO file,String rawName) {
        String name=String.valueOf(rawName==null?"":rawName).trim();
        if(name.isBlank()) throw new IllegalArgumentException("파일 이름을 입력하세요.");
        if(name.length()>180) throw new IllegalArgumentException("파일 이름은 180자 이내로 입력하세요.");
        boolean invalid=name.equals(".")||name.equals("..")||name.chars().anyMatch(Character::isISOControl);
        for(char ch:new char[]{'\\','/',':','*','?','"','<','>','|'}) if(name.indexOf(ch)>=0) invalid=true;
        if(invalid) throw new IllegalArgumentException("파일 이름에 사용할 수 없는 문자가 포함되어 있습니다.");
        String ext=String.valueOf(file.getFileExt()==null?"":file.getFileExt()).trim().replaceFirst("^\\.","");
        if(ext.isBlank()) {
            String current=String.valueOf(file.getOriginalName()==null?"":file.getOriginalName());
            int dot=current.lastIndexOf('.');
            if(dot>0&&dot<current.length()-1) ext=current.substring(dot+1);
        }
        if(!ext.isBlank()&&name.toLowerCase(Locale.ROOT).endsWith("."+ext.toLowerCase(Locale.ROOT))) name=name.substring(0,name.length()-ext.length()-1).trim();
        if(name.isBlank()) throw new IllegalArgumentException("파일 이름을 입력하세요.");
        return ext.isBlank()?name:name+"."+ext;
    }
    private String clean(String value,int max) {
        if(value==null||value.isBlank())return null;
        String v=value.trim();
        if(v.length()>max)throw new IllegalArgumentException("설명은 "+max+"자 이내로 입력하세요.");
        return v;
    }
    private void requireUser(Long userId) {
        if(userId==null) throw new SecurityException("로그인이 필요합니다.");
    }
    private record FileScope(String scopeType,Long ownerUserId,Long wsId,Long projId) {
    }
}
