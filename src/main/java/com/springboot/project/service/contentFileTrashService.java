package com.springboot.project.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IcontentFileDAO;
import com.springboot.project.dao.IcontentFileFolderDAO;
import com.springboot.project.dao.IcontentFileTrashDAO;
import com.springboot.project.dao.IcontentRecordDAO;
import com.springboot.project.dto.contentFileDTO;
import com.springboot.project.dto.contentFileFolderDTO;

@Service
public class contentFileTrashService {
    private final IcontentFileTrashDAO trashDAO;
    private final IcontentRecordDAO recordDAO;
    private final IcontentFileDAO fileDAO;
    private final IcontentFileFolderDAO folderDAO;
    private final contentFileStorageService storage;

    public contentFileTrashService(IcontentFileTrashDAO trashDAO,
            IcontentRecordDAO recordDAO,
            IcontentFileDAO fileDAO,
            IcontentFileFolderDAO folderDAO,
            contentFileStorageService storage) {
        this.trashDAO = trashDAO;
        this.recordDAO = recordDAO;
        this.fileDAO = fileDAO;
        this.folderDAO = folderDAO;
        this.storage = storage;
    }

    public Map<String, Object> list(String scopeType, Long wsId, Long projId, Long userId) {
        Scope scope = scope(scopeType, wsId, projId, userId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("folders", trashDAO.selectTrashFolders(scope.type(), scope.owner(), scope.ws(), scope.proj(), userId));
        result.put("files", trashDAO.selectTrashFiles(scope.type(), scope.owner(), scope.ws(), scope.proj(), userId));
        return result;
    }

    @Transactional
    public void moveToTrash(String scopeType, Long wsId, Long projId, List<Long> fileIds, List<Long> folderIds, Long userId) {
        Scope scope = scope(scopeType, wsId, projId, userId);
        List<Long> hiddenFileIds = new ArrayList<>();
        for (Long fileId : safe(fileIds)) {
            requireFileManage(fileId, userId, scope);
            if (trashDAO.trashFile(fileId, userId) > 0) hiddenFileIds.add(fileId);
        }
        for (Long folderId : safe(folderIds)) {
            requireFolderManage(folderId, userId, scope);
            trashDAO.trashFilesInFolderTree(folderId, userId);
            trashDAO.trashFolderTree(folderId, userId);
            List<contentFileDTO> files = trashDAO.selectFilesInFolderTreeForPermanentDelete(folderId, userId, scope.type(), scope.owner(), scope.ws(), scope.proj());
            files.forEach(file -> hiddenFileIds.add(file.getContentFileId()));
        }
        if (!hiddenFileIds.isEmpty()) trashDAO.hideRecordItems(hiddenFileIds);
    }

    @Transactional
    public void restore(String scopeType, Long wsId, Long projId, List<Long> fileIds, List<Long> folderIds, Long userId) {
        Scope scope = scope(scopeType, wsId, projId, userId);
        List<Long> restoredFileIds = new ArrayList<>();
        for (Long fileId : safe(fileIds)) {
            if (trashDAO.restoreFile(fileId, userId, scope.type(), scope.owner(), scope.ws(), scope.proj()) > 0) restoredFileIds.add(fileId);
        }
        for (Long folderId : safe(folderIds)) {
            List<contentFileDTO> files = trashDAO.selectFilesInFolderTreeForPermanentDelete(folderId, userId, scope.type(), scope.owner(), scope.ws(), scope.proj());
            trashDAO.restoreFolderTree(folderId, userId, scope.type(), scope.owner(), scope.ws(), scope.proj());
            trashDAO.restoreFilesInFolderTree(folderId, userId, scope.type(), scope.owner(), scope.ws(), scope.proj());
            files.forEach(file -> restoredFileIds.add(file.getContentFileId()));
        }
        if (!restoredFileIds.isEmpty()) trashDAO.restoreRecordItems(restoredFileIds);
    }

    @Transactional
    public void deletePermanently(String scopeType, Long wsId, Long projId, List<Long> fileIds, List<Long> folderIds, Long userId) {
        Scope scope = scope(scopeType, wsId, projId, userId);
        List<Long> directFileIds = safe(fileIds);
        List<contentFileDTO> targets = directFileIds.isEmpty() ? new ArrayList<>() : new ArrayList<>(trashDAO.selectFilesForPermanentDelete(directFileIds, userId, scope.type(), scope.owner(), scope.ws(), scope.proj()));
        for (Long folderId : safe(folderIds)) {
            targets.addAll(trashDAO.selectFilesInFolderTreeForPermanentDelete(folderId, userId, scope.type(), scope.owner(), scope.ws(), scope.proj()));
        }
        List<Long> ids = targets.stream().map(contentFileDTO::getContentFileId).filter(Objects::nonNull).distinct().toList();
        if (!ids.isEmpty()) {
            trashDAO.deleteRecordItemsByFileIds(ids);
            trashDAO.deleteFilesByIds(ids, userId, scope.type(), scope.owner(), scope.ws(), scope.proj());
        }
        for (Long folderId : safe(folderIds)) trashDAO.deleteFolderTree(folderId, userId, scope.type(), scope.owner(), scope.ws(), scope.proj());
        targets.forEach(file -> storage.deleteQuietly(file.getFilePath()));
    }

    @Transactional
    public void purgeExpired() {
        List<contentFileDTO> expiredFiles = trashDAO.selectExpiredFiles();
        Map<Long, List<Long>> byUser = new LinkedHashMap<>();
        for (contentFileDTO file : expiredFiles) {
            byUser.computeIfAbsent(file.getDeletedBy(), key -> new ArrayList<>()).add(file.getContentFileId());
        }
        for (Map.Entry<Long, List<Long>> entry : byUser.entrySet()) {
            List<contentFileDTO> targets = trashDAO.selectFilesForPermanentDelete(entry.getValue(), entry.getKey(), null, null, null, null);
            List<Long> ids = targets.stream().map(contentFileDTO::getContentFileId).filter(Objects::nonNull).distinct().toList();
            if (!ids.isEmpty()) {
                trashDAO.deleteRecordItemsByFileIds(ids);
                trashDAO.deleteFilesByIds(ids, entry.getKey(), null, null, null, null);
                targets.forEach(file -> storage.deleteQuietly(file.getFilePath()));
            }
        }
        for (Long folderId : trashDAO.selectExpiredRootFolders()) {
            List<contentFileDTO> files = trashDAO.selectFilesInFolderTreeForPermanentDelete(folderId, null, null, null, null, null);
            List<Long> ids = files.stream().map(contentFileDTO::getContentFileId).toList();
            if (!ids.isEmpty()) {
                trashDAO.deleteRecordItemsByFileIds(ids);
                trashDAO.deleteFilesByIds(ids, null, null, null, null, null);
                files.forEach(file -> storage.deleteQuietly(file.getFilePath()));
            }
            trashDAO.deleteFolderTree(folderId, null, null, null, null, null);
        }
    }


    private void requireFileManage(Long fileId, Long userId, Scope scope) {
        contentFileDTO file = fileDAO.selectById(fileId);
        if (file == null) throw new IllegalArgumentException("파일을 찾을 수 없습니다.");
        requireSameScope(file.getScopeType(), file.getOwnerUserId(), file.getWsId(), file.getProjId(), scope);
        if (Objects.equals(file.getCreatedBy(), userId)) return;
        if (fileDAO.countCanManage(file.getScopeType(), file.getWsId(), file.getProjId(), userId) > 0) return;
        throw new SecurityException("파일을 휴지통으로 이동할 권한이 없습니다.");
    }

    private void requireFolderManage(Long folderId, Long userId, Scope scope) {
        contentFileFolderDTO folder = folderDAO.selectById(folderId);
        if (folder == null) throw new IllegalArgumentException("폴더를 찾을 수 없습니다.");
        requireSameScope(folder.getScopeType(), folder.getOwnerUserId(), folder.getWsId(), folder.getProjId(), scope);

        // 개인 자료실은 본인만 접근하므로 폴더 전체를 관리할 수 있다.
        if ("PERSONAL".equalsIgnoreCase(folder.getScopeType())) return;

        // 그룹장·관리자, 프로젝트 관리자는 다른 멤버의 자료가 포함돼도 정리할 수 있다.
        if (fileDAO.countCanManage(folder.getScopeType(), folder.getWsId(), folder.getProjId(), userId) > 0) return;

        // 공용 폴더 자체는 모든 멤버가 관리할 수 있지만, 하위 전체에 타인 자료가
        // 하나라도 있으면 일반 멤버가 폴더째 삭제하지 못하도록 막는다.
        if (folderDAO.countForeignFilesInTree(folderId, userId) > 0) {
            throw new SecurityException("다른 멤버가 등록한 자료가 포함된 폴더는 삭제할 수 없습니다.");
        }
    }

    private void requireSameScope(String type, Long owner, Long ws, Long proj, Scope scope) {
        boolean same = Objects.equals(type, scope.type())
                && Objects.equals(owner, scope.owner())
                && Objects.equals(ws, scope.ws())
                && Objects.equals(proj, scope.proj());
        if (!same) throw new SecurityException("다른 자료실의 항목은 현재 휴지통에서 처리할 수 없습니다.");
    }

    private Scope scope(String raw, Long wsId, Long projId, Long userId) {
        requireUser(userId);
        String type = String.valueOf(raw).trim().toUpperCase(Locale.ROOT);
        if ("PERSONAL".equals(type)) return new Scope(type, userId, null, null);
        if ("GROUP".equals(type) && wsId != null && recordDAO.countWorkspaceMember(wsId, userId) > 0)
            return new Scope(type, null, wsId, null);
        if ("PROJECT".equals(type) && projId != null && recordDAO.countProjectAccessibleMember(projId, userId) > 0)
            return new Scope(type, null, null, projId);
        throw new SecurityException("휴지통 접근 권한이 없습니다.");
    }

    private static <T> List<T> safe(List<T> values) {
        return values == null ? List.of() : values.stream().filter(Objects::nonNull).distinct().toList();
    }

    private void requireUser(Long userId) {
        if (userId == null) throw new SecurityException("로그인이 필요합니다.");
    }

    private record Scope(String type, Long owner, Long ws, Long proj) {}
}
