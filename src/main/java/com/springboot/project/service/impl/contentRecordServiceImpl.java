package com.springboot.project.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IcontentFileFolderDAO;
import com.springboot.project.dao.IcontentRecordDAO;
import com.springboot.project.dao.IcontentRecordItemDAO;
import com.springboot.project.dto.contentFileFolderDTO;
import com.springboot.project.dto.contentRecordDraftRequest;
import com.springboot.project.dto.contentRecordPermissionDTO;
import com.springboot.project.dto.contentRecordScopeDTO;
import com.springboot.project.dto.contentRecordTargetDTO;
import com.springboot.project.dto.contentRecordTargetRequest;
import com.springboot.project.service.IcontentRecordService;
import com.springboot.project.service.IphotoAlbumService;

@Service
public class contentRecordServiceImpl implements IcontentRecordService {

    private static final Set<String> TARGET_TYPES = Set.of(
            "EVENT", "PERIOD_PLAN", "TIME_PLAN", "WEEKLY_PLAN", "TASK");

    private final IcontentRecordDAO contentRecordDAO;
    private final IcontentRecordItemDAO contentRecordItemDAO;
    private final IphotoAlbumService photoAlbumService;
    private final IcontentFileFolderDAO contentFileFolderDAO;

    public contentRecordServiceImpl(IcontentRecordDAO contentRecordDAO,
                                    IcontentRecordItemDAO contentRecordItemDAO,
                                    IphotoAlbumService photoAlbumService,
                                    IcontentFileFolderDAO contentFileFolderDAO) {
        this.contentRecordDAO = contentRecordDAO;
        this.contentRecordItemDAO = contentRecordItemDAO;
        this.photoAlbumService = photoAlbumService;
        this.contentFileFolderDAO = contentFileFolderDAO;
    }

    @Override
    @Transactional
    public contentRecordTargetDTO ensureTarget(contentRecordTargetRequest request, Long userId) {
        if (request == null || request.getTargetId() == null) {
            throw new IllegalArgumentException("원본 대상 정보가 필요합니다.");
        }
        String targetType = normalizeTargetType(request.getTargetType());
        if (Set.of("PERIOD_PLAN", "TIME_PLAN", "WEEKLY_PLAN").contains(targetType)) {
            contentRecordDAO.enableProjectPlanRecord(targetType, request.getTargetId());
        }
        contentRecordTargetDTO existing = contentRecordDAO.selectByTarget(targetType, request.getTargetId());
        if (existing != null) {
            getViewableTarget(existing.getRecordTargetId(), userId);
            return existing;
        }

        contentRecordTargetDTO draft = ensureDraft(request.toDraftRequest(), userId);
        try {
            return activateDraft(draft.getDraftKey(), targetType, request.getTargetId(), userId);
        } catch (IllegalStateException duplicate) {
            contentRecordTargetDTO concurrent = contentRecordDAO.selectByTarget(targetType, request.getTargetId());
            if (concurrent == null) throw duplicate;
            getViewableTarget(concurrent.getRecordTargetId(), userId);
            return concurrent;
        }
    }

    @Override
    public contentRecordTargetDTO getTarget(String targetType, Long targetId, Long userId) {
        if (targetId == null) throw new IllegalArgumentException("원본 대상 ID가 필요합니다.");
        contentRecordTargetDTO target = contentRecordDAO.selectByTarget(normalizeTargetType(targetType), targetId);
        if (target == null) throw new IllegalArgumentException("공통 기록 대상을 찾을 수 없습니다.");
        return getViewableTarget(target.getRecordTargetId(), userId);
    }

    @Override
    @Transactional
    public contentRecordTargetDTO ensureDraft(contentRecordDraftRequest request, Long userId) {
        if (request == null || userId == null) {
            throw new IllegalArgumentException("임시 기록 대상 정보가 필요합니다.");
        }

        String suppliedDraftKey = trimToNull(request.getDraftKey());
        if (suppliedDraftKey != null) {
            contentRecordTargetDTO existing = getOwnedDraft(suppliedDraftKey, userId);
            contentRecordDAO.touchDraft(existing.getRecordTargetId(), userId);
            return contentRecordDAO.selectByDraftKey(suppliedDraftKey);
        }

        contentRecordScopeDTO resolvedScope = resolveScope(request, userId);
        contentRecordTargetDTO draft = new contentRecordTargetDTO();
        draft.setDraftKey(UUID.randomUUID().toString());
        draft.setTargetStatus("DRAFT");
        draft.setScopeType(resolvedScope.getScopeType());
        draft.setOwnerUserId(resolvedScope.getOwnerUserId());
        draft.setWsId(resolvedScope.getWsId());
        draft.setProjId(resolvedScope.getProjId());
        draft.setCreatedBy(userId);

        if (contentRecordDAO.insertDraft(draft) != 1) {
            throw new IllegalStateException("임시 기록 대상을 생성하지 못했습니다.");
        }
        return contentRecordDAO.selectByDraftKey(draft.getDraftKey());
    }

    /**
     * 기존 호출 호환용이다. DRAFT는 작성자만, ACTIVE는 원본 대상의 수정 권한을 확인한다.
     */
    @Override
    public contentRecordTargetDTO getOwnedTarget(Long recordTargetId, Long userId) {
        contentRecordTargetDTO target = requireTarget(recordTargetId, userId);
        if ("DRAFT".equals(target.getTargetStatus())) {
            requireDraftOwner(target, userId);
            return target;
        }
        return getEditableTarget(recordTargetId, userId);
    }

    @Override
    public contentRecordTargetDTO getViewableTarget(Long recordTargetId, Long userId) {
        contentRecordTargetDTO target = requireTarget(recordTargetId, userId);
        if ("DRAFT".equals(target.getTargetStatus())) {
            requireDraftOwner(target, userId);
            return target;
        }
        contentRecordPermissionDTO permission = resolvePermission(target, userId);
        if (!permission.canView()) {
            throw new SecurityException("원본 일정의 조회 권한이 없습니다.");
        }
        return target;
    }

    @Override
    public contentRecordTargetDTO getEditableTarget(Long recordTargetId, Long userId) {
        contentRecordTargetDTO target = requireTarget(recordTargetId, userId);
        if ("DRAFT".equals(target.getTargetStatus())) {
            requireDraftOwner(target, userId);
            return target;
        }
        contentRecordPermissionDTO permission = resolvePermission(target, userId);
        if (!permission.canEdit()) {
            throw new SecurityException("원본 일정의 수정 권한이 없습니다.");
        }
        return target;
    }

    @Override
    public contentRecordTargetDTO getDeletableTarget(Long recordTargetId, Long userId) {
        contentRecordTargetDTO target = requireTarget(recordTargetId, userId);
        if ("DRAFT".equals(target.getTargetStatus())) {
            requireDraftOwner(target, userId);
            return target;
        }
        contentRecordPermissionDTO permission = resolvePermission(target, userId);
        if (!permission.canDelete()) {
            throw new SecurityException("원본 일정의 삭제 권한이 없습니다.");
        }
        return target;
    }

    @Override
    public contentRecordPermissionDTO getPermission(Long recordTargetId, Long userId) {
        contentRecordTargetDTO target = requireTarget(recordTargetId, userId);
        return resolvePermission(target, userId);
    }

    @Override
    @Transactional
    public Long ensureNoteFolder(Long recordTargetId, Long userId) {
        contentRecordTargetDTO target = getEditableTarget(recordTargetId, userId);
        if (target.getNoteFolderId() != null) {
            // 자동 폴더는 최초 저장 위치일 뿐이다. 탐색기에서 사용자가 옮기거나 이름을 바꾼 뒤에는
            // 기록 저장이 해당 폴더를 원래 위치/이름으로 되돌리지 않는다.
            return target.getNoteFolderId();
        }

        Long parentFolderId = contentRecordDAO.selectRecordNoteTypeFolderId(recordTargetId);
        if (parentFolderId == null) {
            Long candidate = contentRecordDAO.selectNextNoteFolderId();
            if (candidate == null || contentRecordDAO.insertRecordNoteTypeFolder(candidate, recordTargetId, userId) <= 0) {
                throw new IllegalStateException("기록 유형 노트 폴더를 생성할 수 없습니다.");
            }
            parentFolderId = contentRecordDAO.selectRecordNoteTypeFolderId(recordTargetId);
            if (parentFolderId == null) parentFolderId = candidate;
        }

        Long folderId = contentRecordDAO.selectNextNoteFolderId();
        if (folderId == null || contentRecordDAO.insertRecordNoteFolder(folderId, parentFolderId, recordTargetId, userId) <= 0) {
            throw new IllegalStateException("기록 노트 폴더를 생성할 수 없습니다.");
        }
        if (contentRecordDAO.updateNoteFolderIdIfEmpty(recordTargetId, folderId, userId) > 0) return folderId;

        contentRecordDAO.deleteRecordNoteFolderIfEmpty(folderId);
        contentRecordTargetDTO refreshed = contentRecordDAO.selectById(recordTargetId);
        if (refreshed == null || refreshed.getNoteFolderId() == null) {
            throw new IllegalStateException("기록 노트 폴더 연결에 실패했습니다.");
        }
        return refreshed.getNoteFolderId();
    }

    @Override
    @Transactional
    public Long ensurePhotoAlbum(Long recordTargetId, String albumName, Long userId) {
        contentRecordTargetDTO target = getEditableTarget(recordTargetId, userId);
        if (target.getPhotoAlbumId() != null) {
            // 기록 연결은 앨범 위치와 독립적이다. 사용자가 탐색기에서 앨범을 이동/수정해도
            // 이후 기록 저장이 앨범을 자동 경로로 되돌리지 않는다.
            return target.getPhotoAlbumId();
        }

        RecordFolderNames names = resolveRecordFolderNames(target, albumName);
        PhotoScope scope = resolvePhotoScope(target);
        Long parentAlbumId = findPhotoAlbum(scope, null, names.typeName());
        if (parentAlbumId == null) {
            parentAlbumId = photoAlbumService.createAlbum(scope.type(), scope.id(), null, names.typeName(), "기록 유형", userId);
        }
        Long createdAlbumId = photoAlbumService.createAlbum(
                scope.type(), scope.id(), parentAlbumId, names.targetName(),
                "CONTENT_RECORD_TARGET:" + recordTargetId, userId);

        if (contentRecordDAO.updatePhotoAlbumIdIfEmpty(recordTargetId, createdAlbumId, userId) == 1) return createdAlbumId;
        contentRecordTargetDTO concurrent = contentRecordDAO.selectById(recordTargetId);
        Long existingAlbumId = concurrent == null ? null : concurrent.getPhotoAlbumId();
        if (existingAlbumId == null) throw new IllegalStateException("기록 사진 앨범을 연결하지 못했습니다.");
        photoAlbumService.deleteAlbum(createdAlbumId);
        return existingAlbumId;
    }

    @Override
    @Transactional
    public Long ensureFileFolder(Long recordTargetId, Long userId) {
        contentRecordTargetDTO target = getEditableTarget(recordTargetId, userId);
        FileFolderScope scope = resolveFileFolderScope(target, userId);

        // 파일은 개별 항목이 탐색기에서 다른 폴더로 이동될 수 있으므로, 현재 파일의 FOLDER_ID를
        // 기록의 기본 저장 폴더로 역추적하지 않는다. 기본 저장 폴더 ID를 대상에 별도로 고정한다.
        Long pinnedFolderId = target.getFileFolderId();
        if (pinnedFolderId != null && contentFileFolderDAO.selectById(pinnedFolderId) != null) {
            return pinnedFolderId;
        }

        RecordFolderNames names = resolveRecordFolderNames(target, null);
        Long parentFolderId = findFileFolder(scope, null, names.typeName());
        if (parentFolderId == null) parentFolderId = createFileFolder(scope, null, names.typeName(), userId);

        // 기존 데이터 마이그레이션: 예전 자동 폴더가 아직 원래 경로/이름에 남아 있을 때만 재사용한다.
        Long legacyFolderId = contentRecordItemDAO.selectRecordFileFolderId(recordTargetId);
        if (legacyFolderId != null) {
            contentFileFolderDTO legacy = contentFileFolderDAO.selectById(legacyFolderId);
            if (legacy != null
                    && java.util.Objects.equals(parentFolderId, legacy.getParentFolderId())
                    && names.targetName().equals(legacy.getFolderName())) {
                contentRecordDAO.updateFileFolderId(recordTargetId, legacyFolderId, userId);
                return legacyFolderId;
            }
        }

        Long folderId = findFileFolder(scope, parentFolderId, names.targetName());
        if (folderId == null) folderId = createFileFolder(scope, parentFolderId, names.targetName(), userId);
        contentRecordDAO.updateFileFolderId(recordTargetId, folderId, userId);
        return folderId;
    }

    @Override
    public contentRecordTargetDTO getOwnedDraft(String draftKey, Long userId) {
        String normalizedKey = trimToNull(draftKey);
        if (normalizedKey == null || userId == null) {
            throw new IllegalArgumentException("임시 기록 키가 필요합니다.");
        }

        contentRecordTargetDTO target = contentRecordDAO.selectByDraftKey(normalizedKey);
        if (target == null) {
            throw new IllegalArgumentException("임시 기록 대상을 찾을 수 없습니다.");
        }
        requireDraftOwner(target, userId);
        if (!"DRAFT".equals(target.getTargetStatus())) {
            throw new IllegalStateException("수정할 수 없는 임시 기록 상태입니다.");
        }
        return target;
    }

    @Override
    @Transactional
    public boolean abandonDraft(String draftKey, Long userId) {
        getOwnedDraft(draftKey, userId);
        return contentRecordDAO.abandonDraft(draftKey, userId) == 1;
    }

    @Override
    @Transactional
    public contentRecordTargetDTO activateDraft(String draftKey, String targetType, Long targetId, Long userId) {
        getOwnedDraft(draftKey, userId);
        String normalizedTargetType = normalizeTargetType(targetType);
        if (targetId == null) {
            throw new IllegalArgumentException("저장된 대상 ID가 필요합니다.");
        }

        contentRecordTargetDTO duplicate = contentRecordDAO.selectByTarget(normalizedTargetType, targetId);
        if (duplicate != null) {
            throw new IllegalStateException("이미 기록 대상이 연결되어 있습니다.");
        }

        if (contentRecordDAO.activateDraft(draftKey, normalizedTargetType, targetId, userId) != 1) {
            throw new IllegalStateException("임시 기록 대상을 확정하지 못했습니다.");
        }

        contentRecordTargetDTO activated = contentRecordDAO.selectByDraftKey(draftKey);
        // 원본 저장과 같은 트랜잭션 안에서 실제 원본 권한까지 확인한다. 실패하면 활성화도 롤백된다.
        getEditableTarget(activated.getRecordTargetId(), userId);
        normalizeActivatedStorage(activated, userId);
        return contentRecordDAO.selectById(activated.getRecordTargetId());
    }

    /**
     * DRAFT 상태에서 먼저 만들어진 노트/사진/파일 저장소를 실제 원본 유형/제목 기준으로 정규화한다.
     * 일정·계획 저장 전에 기록을 남겨도 저장 후에는 [기록] / 임시 기록 경로가 남지 않게 한다.
     */
    private void normalizeActivatedStorage(contentRecordTargetDTO target, Long userId) {
        if (target == null || target.getRecordTargetId() == null) return;
        Long recordTargetId = target.getRecordTargetId();

        // DRAFT -> ACTIVE 확정 시에만 임시 자동 경로를 실제 원본 유형/제목으로 1회 정규화한다.
        // 그 이후 탐색기에서 사용자가 이동/이름 변경한 위치는 존중한다.
        if (target.getNoteFolderId() != null) {
            Long parentFolderId = contentRecordDAO.selectRecordNoteTypeFolderId(recordTargetId);
            if (parentFolderId == null) {
                Long candidate = contentRecordDAO.selectNextNoteFolderId();
                if (candidate == null || contentRecordDAO.insertRecordNoteTypeFolder(candidate, recordTargetId, userId) <= 0) {
                    throw new IllegalStateException("기록 유형 노트 폴더를 생성할 수 없습니다.");
                }
                parentFolderId = contentRecordDAO.selectRecordNoteTypeFolderId(recordTargetId);
                if (parentFolderId == null) parentFolderId = candidate;
            }
            contentRecordDAO.updateRecordNoteFolderStructure(recordTargetId, parentFolderId);
        }

        if (target.getPhotoAlbumId() != null) {
            RecordFolderNames names = resolveRecordFolderNames(target, null);
            PhotoScope scope = resolvePhotoScope(target);
            Long parentAlbumId = findPhotoAlbum(scope, null, names.typeName());
            if (parentAlbumId == null) {
                parentAlbumId = photoAlbumService.createAlbum(scope.type(), scope.id(), null, names.typeName(), "기록 유형", userId);
            }
            photoAlbumService.updateAlbum(target.getPhotoAlbumId(), names.targetName(), "CONTENT_RECORD_TARGET:" + recordTargetId);
            photoAlbumService.moveAlbum(target.getPhotoAlbumId(), parentAlbumId);
        }

        if (target.getFileFolderId() != null || contentRecordItemDAO.selectRecordFileFolderId(recordTargetId) != null) {
            normalizeFileFolderOnActivation(target, userId);
        }
    }

    private void normalizeFileFolderOnActivation(contentRecordTargetDTO target, Long userId) {
        Long recordTargetId = target.getRecordTargetId();
        RecordFolderNames names = resolveRecordFolderNames(target, null);
        FileFolderScope scope = resolveFileFolderScope(target, userId);
        Long parentFolderId = findFileFolder(scope, null, names.typeName());
        if (parentFolderId == null) parentFolderId = createFileFolder(scope, null, names.typeName(), userId);

        Long folderId = target.getFileFolderId();
        if (folderId == null) folderId = contentRecordItemDAO.selectRecordFileFolderId(recordTargetId);
        if (folderId != null && contentFileFolderDAO.selectById(folderId) != null) {
            contentFileFolderDAO.updateName(folderId, names.targetName(), userId);
            contentFileFolderDAO.move(folderId, parentFolderId, userId);
            contentRecordDAO.updateFileFolderId(recordTargetId, folderId, userId);
            return;
        }

        Long created = findFileFolder(scope, parentFolderId, names.targetName());
        if (created == null) created = createFileFolder(scope, parentFolderId, names.targetName(), userId);
        contentRecordDAO.updateFileFolderId(recordTargetId, created, userId);
    }

    private contentRecordPermissionDTO resolvePermission(contentRecordTargetDTO target, Long userId) {
        contentRecordPermissionDTO result = new contentRecordPermissionDTO();
        result.setRecordTargetId(target.getRecordTargetId());
        result.setTargetStatus(target.getTargetStatus());
        result.setTargetType(target.getTargetType());
        result.setTargetId(target.getTargetId());

        if ("DRAFT".equals(target.getTargetStatus())) {
            boolean owner = userId.equals(target.getCreatedBy());
            result.setOwnerYn(yn(owner));
            result.setCanViewYn(yn(owner));
            result.setCanEditYn(yn(owner));
            result.setCanDeleteYn(yn(owner));
            result.setPermissionSource("DRAFT_OWNER");
            return result;
        }

        if (!"ACTIVE".equals(target.getTargetStatus())) {
            result.setOwnerYn("N");
            result.setCanViewYn("N");
            result.setCanEditYn("N");
            result.setCanDeleteYn("N");
            result.setPermissionSource("TARGET_INACTIVE");
            return result;
        }

        String targetType = normalizeTargetType(target.getTargetType());
        boolean canView;
        boolean canEdit;
        boolean canDelete;

        if ("EVENT".equals(targetType)) {
            canView = contentRecordDAO.countEventViewPermission(target.getTargetId(), userId) > 0;
            canEdit = contentRecordDAO.countEventEditPermission(target.getTargetId(), userId) > 0;
            canDelete = contentRecordDAO.countEventDeletePermission(target.getTargetId(), userId) > 0;
            result.setPermissionSource("EVENT_PERMISSION");
        } else {
            canView = contentRecordDAO.countProjectTargetViewPermission(targetType, target.getTargetId(), userId) > 0;
            canEdit = contentRecordDAO.countProjectTargetEditPermission(targetType, target.getTargetId(), userId) > 0;
            canDelete = contentRecordDAO.countProjectTargetDeletePermission(targetType, target.getTargetId(), userId) > 0;
            result.setPermissionSource("PROJECT_PERMISSION");
        }

        result.setOwnerYn(yn(userId.equals(target.getCreatedBy())));
        result.setCanViewYn(yn(canView));
        result.setCanEditYn(yn(canEdit));
        result.setCanDeleteYn(yn(canDelete));
        return result;
    }

    private contentRecordTargetDTO requireTarget(Long recordTargetId, Long userId) {
        if (recordTargetId == null || userId == null) {
            throw new IllegalArgumentException("기록 대상이 필요합니다.");
        }
        contentRecordTargetDTO target = contentRecordDAO.selectById(recordTargetId);
        if (target == null) {
            throw new IllegalArgumentException("기록 대상을 찾을 수 없습니다.");
        }
        return target;
    }

    private void requireDraftOwner(contentRecordTargetDTO target, Long userId) {
        if (!userId.equals(target.getCreatedBy())) {
            throw new SecurityException("임시 기록 대상에 접근할 수 없습니다.");
        }
    }

    private contentRecordScopeDTO resolveScope(contentRecordDraftRequest request, Long userId) {
        String contextType = normalizeContextType(request.getContextType());
        Long contextId = request.getContextId();

        return switch (contextType) {
            case "PERSONAL" -> {
                if (contextId != null && !userId.equals(contextId)) {
                    throw new SecurityException("다른 사용자의 개인 기록을 만들 수 없습니다.");
                }
                contentRecordScopeDTO scope = new contentRecordScopeDTO();
                scope.setScopeType("PERSONAL");
                scope.setOwnerUserId(userId);
                yield scope;
            }
            case "GROUP" -> {
                requireNotNull(contextId, "그룹 ID가 필요합니다.");
                if (contentRecordDAO.countWorkspaceMember(contextId, userId) < 1) {
                    throw new SecurityException("해당 그룹의 기록을 만들 권한이 없습니다.");
                }
                contentRecordScopeDTO scope = new contentRecordScopeDTO();
                scope.setScopeType("GROUP");
                scope.setWsId(contextId);
                yield scope;
            }
            case "PROJECT" -> {
                requireNotNull(contextId, "프로젝트 ID가 필요합니다.");
                contentRecordScopeDTO scope = contentRecordDAO.selectProjectScope(contextId);
                if (scope == null) {
                    throw new IllegalArgumentException("프로젝트를 찾을 수 없습니다.");
                }
                if (contentRecordDAO.countProjectAccessibleMember(contextId, userId) < 1) {
                    throw new SecurityException("해당 프로젝트의 기록을 만들 권한이 없습니다.");
                }
                yield scope;
            }
            default -> throw new IllegalArgumentException("지원하지 않는 기록 저장 위치입니다.");
        };
    }

    private String normalizeContextType(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) throw new IllegalArgumentException("기록 저장 위치가 필요합니다.");
        normalized = normalized.toUpperCase(Locale.ROOT);
        if (!Set.of("PERSONAL", "GROUP", "PROJECT").contains(normalized)) {
            throw new IllegalArgumentException("지원하지 않는 기록 저장 위치입니다.");
        }
        return normalized;
    }

    private String normalizeTargetType(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) throw new IllegalArgumentException("대상 유형이 필요합니다.");
        normalized = normalized.toUpperCase(Locale.ROOT);
        if (!TARGET_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("지원하지 않는 기록 대상입니다.");
        }
        return normalized;
    }


    private RecordFolderNames resolveRecordFolderNames(contentRecordTargetDTO target, String fallbackName) {
        String typeName = switch (String.valueOf(target.getTargetType()).toUpperCase(Locale.ROOT)) {
            case "EVENT" -> "일정";
            case "PERIOD_PLAN" -> "기간 계획";
            case "TIME_PLAN" -> "시간 계획";
            case "WEEKLY_PLAN" -> "주간 계획";
            case "TASK" -> "작업 보드";
            default -> "기록";
        };
        String targetName = trimToNull(contentRecordDAO.selectRecordTargetTitle(target.getRecordTargetId()));
        if (targetName == null) targetName = cleanLegacyRecordName(fallbackName);
        if (targetName == null) targetName = "임시 기록";
        if (targetName.length() > 100) targetName = targetName.substring(0, 100);
        return new RecordFolderNames(typeName, targetName);
    }

    private String cleanLegacyRecordName(String value) {
        String name = trimToNull(value);
        if (name == null) return null;
        return name.replaceFirst("^\\[(일정|기간 계획|시간 계획|주간 계획|작업 보드|기록)\\]\\s*", "").trim();
    }

    private PhotoScope resolvePhotoScope(contentRecordTargetDTO target) {
        if (target.getProjId() != null) return new PhotoScope("PROJECT", target.getProjId());
        if (target.getWsId() != null) return new PhotoScope("GROUP", target.getWsId());
        Long ownerId = target.getOwnerUserId() != null ? target.getOwnerUserId() : target.getCreatedBy();
        if (ownerId == null) throw new IllegalStateException("사진 앨범의 저장 범위를 확인할 수 없습니다.");
        return new PhotoScope("PERSONAL", ownerId);
    }

    private Long findPhotoAlbum(PhotoScope scope, Long parentId, String name) {
        List<Map<String, Object>> albums = photoAlbumService.getAlbums(scope.type(), scope.id());
        for (Map<String, Object> album : albums) {
            Long albumId = numberToLong(mapValue(album, "albumId", "ALBUM_ID"));
            Long parentAlbumId = numberToLong(mapValue(album, "parentAlbumId", "PARENT_ALBUM_ID"));
            String albumName = String.valueOf(mapValue(album, "albumName", "ALBUM_NAME"));
            if (java.util.Objects.equals(parentId, parentAlbumId) && name.equals(albumName)) return albumId;
        }
        return null;
    }

    private FileFolderScope resolveFileFolderScope(contentRecordTargetDTO target, Long userId) {
        if (target.getProjId() != null) return new FileFolderScope("PROJECT", null, null, target.getProjId());
        if (target.getWsId() != null) return new FileFolderScope("GROUP", null, target.getWsId(), null);
        Long ownerId = target.getOwnerUserId() != null ? target.getOwnerUserId() : userId;
        return new FileFolderScope("PERSONAL", ownerId, null, null);
    }

    private Long findFileFolder(FileFolderScope scope, Long parentId, String name) {
        for (contentFileFolderDTO folder : contentFileFolderDAO.selectChildren(
                scope.type(), scope.ownerUserId(), scope.wsId(), scope.projId(), parentId)) {
            if (name.equals(folder.getFolderName())) return folder.getFolderId();
        }
        return null;
    }

    private Long createFileFolder(FileFolderScope scope, Long parentId, String name, Long userId) {
        contentFileFolderDTO folder = new contentFileFolderDTO();
        folder.setScopeType(scope.type());
        folder.setOwnerUserId(scope.ownerUserId());
        folder.setWsId(scope.wsId());
        folder.setProjId(scope.projId());
        folder.setParentFolderId(parentId);
        folder.setFolderName(name);
        folder.setCreatedBy(userId);
        if (contentFileFolderDAO.insert(folder) <= 0 || folder.getFolderId() == null) {
            throw new IllegalStateException("기록 자료실 폴더를 생성할 수 없습니다.");
        }
        return folder.getFolderId();
    }

    private Object mapValue(Map<String, Object> map, String camel, String upper) {
        if (map == null) return null;
        Object value = map.get(camel);
        return value != null ? value : map.get(upper);
    }

    private Long numberToLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value == null) return null;
        try { return Long.valueOf(String.valueOf(value)); } catch (NumberFormatException e) { return null; }
    }

    private record RecordFolderNames(String typeName, String targetName) {}
    private record PhotoScope(String type, Long id) {}
    private record FileFolderScope(String type, Long ownerUserId, Long wsId, Long projId) {}

    private String yn(boolean value) { return value ? "Y" : "N"; }
    private void requireNotNull(Object value, String message) { if (value == null) throw new IllegalArgumentException(message); }
    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
