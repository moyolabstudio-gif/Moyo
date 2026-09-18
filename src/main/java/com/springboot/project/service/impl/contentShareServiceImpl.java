package com.springboot.project.service.impl;

import com.springboot.project.dao.IcontentShareDAO;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.service.IcontentShareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class contentShareServiceImpl implements IcontentShareService {

    @Value("${moyo.schema.runtime-ddl-enabled:false}")
    private boolean runtimeDdlEnabled;
    private static final Set<String> CONTENT_TYPES = Set.of("NOTE", "PHOTO", "CALENDAR", "ALBUM", "BOARD", "EVENT", "POLL", "FILE");
    private static final Set<String> TARGET_TYPES = Set.of("USER", "WS", "PROJ");
    private static final Set<String> FRIEND_SHARE_CONTENT_TYPES = Set.of("NOTE", "PHOTO", "FILE");
    private static final Set<String> PERMISSIONS = Set.of("VIEW", "EDIT");
    private static final Set<String> RESPONSE_STATUS = Set.of("ACCEPTED", "REJECTED");

    @Autowired
    private IcontentShareDAO contentShareDAO;

    @Override
    public boolean canManage(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        return contentShareDAO.countManagePermission(normalizeContentType(contentType), contentId, userId) > 0;
    }

    @Override
    public boolean canRead(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        String normalized = normalizeContentType(contentType);
        if (canManage(normalized, contentId, userId)) return true; // 작성자

        boolean nativeScopeMember = contentShareDAO.countNativeScopeReadPermission(normalized, contentId, userId) > 0;
        boolean restricted = contentShareDAO.countRestrictedAccessMarker(normalized, contentId) > 0;

        // 그룹/그룹 프로젝트 비밀글은 기존 VIEW 공유보다 비밀글 정책을 우선한다.
        // 비밀글: 작성자 + 수락된 명시 EDIT 대상 + 그룹장·팀장·관리자만 열람 가능.
        if (nativeScopeMember && restricted) {
            if (contentShareDAO.countContentEditPermission(normalized, contentId, userId) > 0) return true;
            return contentShareDAO.countNativeScopeManagerPermission(normalized, contentId, userId) > 0;
        }

        // 개인/개인 프로젝트 공유와 비제한 콘텐츠의 명시 VIEW/EDIT 권한.
        if (contentShareDAO.countReadPermission(normalized, contentId, userId) > 0) return true;

        // 그룹/그룹 프로젝트 전체 공개는 현재 공간 멤버 전체가 읽는다.
        return nativeScopeMember;
    }

    @Override
    public boolean canEdit(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        // 관리자 역할 자체는 EDIT 권한이 아니다. 작성자 또는 명시 EDIT 대상만 편집 가능.
        return contentShareDAO.countContentEditPermission(normalizeContentType(contentType), contentId, userId) > 0;
    }

    @Override
    public boolean isRestrictedAccess(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        String normalized = normalizeContentType(contentType);
        if (!canManage(normalized, contentId, userId)) throw new IllegalStateException("공개 범위를 확인할 권한이 없습니다.");
        return contentShareDAO.countRestrictedAccessMarker(normalized, contentId) > 0;
    }

    @Override
    @Transactional
    public boolean updateRestrictedAccess(String contentType, Long contentId, boolean restricted, Long userId) {
        if (contentId == null || userId == null) return false;
        String normalized = normalizeContentType(contentType);
        if (!FRIEND_SHARE_CONTENT_TYPES.contains(normalized) || !canManage(normalized, contentId, userId)) {
            throw new IllegalStateException("작성자만 공개 범위를 변경할 수 있습니다.");
        }
        if (contentShareDAO.countNativeScopeReadPermission(normalized, contentId, userId) <= 0) {
            throw new IllegalStateException("그룹 또는 그룹 프로젝트 콘텐츠에서만 비밀글을 설정할 수 있습니다.");
        }
        Long ownerId = contentShareDAO.selectContentOwnerId(normalized, contentId);
        if (ownerId == null || !ownerId.equals(userId)) throw new IllegalStateException("작성자만 공개 범위를 변경할 수 있습니다.");
        if (restricted) {
            contentShareDAO.mergeRestrictedAccessMarker(normalized, contentId, ownerId);
        } else {
            contentShareDAO.deleteRestrictedAccessMarker(normalized, contentId, ownerId);
        }
        return true;
    }

    @Override
    public List<contentShareDTO> getShares(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return List.of();
        String normalizedContentType = normalizeContentType(contentType);
        if (!canManage(normalizedContentType, contentId, userId)) return List.of();
        return contentShareDAO.selectShares(normalizedContentType, contentId);
    }

    @Override
    public List<Map<String, Object>> getFriendShareOwners(String contentType, Long userId) {
        if (userId == null) return List.of();
        String normalizedContentType = normalizeContentType(contentType);
        if (!FRIEND_SHARE_CONTENT_TYPES.contains(normalizedContentType)) return List.of();
        return contentShareDAO.selectFriendShareOwners(normalizedContentType, userId);
    }

    @Override
    public Map<String, Object> getTargets(String contentType, Long contentId, Long userId, String keyword, String shareMode) {
        String normalizedContentType = normalizeContentType(contentType);
        boolean feedMode = isFeedShareMode(shareMode);
        boolean memberPermissionMode = isMemberPermissionMode(shareMode);
        boolean manageable = canManage(normalizedContentType, contentId, userId);
        boolean friendShareScope = canUseFriendShare(normalizedContentType, contentId, userId);
        boolean feedShareable = feedMode && canSendMoyoFeedShare(normalizedContentType, contentId, userId);
        boolean readable = canRead(normalizedContentType, contentId, userId);

        if (memberPermissionMode) {
            if (!FRIEND_SHARE_CONTENT_TYPES.contains(normalizedContentType) || !manageable) {
                throw new IllegalStateException("멤버 권한을 관리할 권한이 없습니다.");
            }
            Map<String, Object> result = new HashMap<>();
            String searchKeyword = keyword == null || keyword.trim().isEmpty() ? null : keyword.trim();
            result.put("users", contentShareDAO.selectNativeContentMemberTargets(normalizedContentType, contentId, searchKeyword));
            result.put("workspaces", List.of());
            result.put("projects", List.of());
            result.put("blockedUserIds", List.of());
            result.put("shares", contentShareDAO.selectShares(normalizedContentType, contentId));
            result.put("shareMode", "MEMBER_PERMISSION");
            result.put("readonlyShare", false);
            result.put("restrictedAccess", contentShareDAO.countRestrictedAccessMarker(normalizedContentType, contentId) > 0);
            return result;
        }
        if ((!manageable || !friendShareScope) && !feedShareable && !readable) {
            throw new IllegalStateException("개인 또는 개인 프로젝트 콘텐츠만 친구에게 공유할 수 있습니다.");
        }

        Map<String, Object> result = new HashMap<>();
        String searchKeyword = keyword == null || keyword.trim().isEmpty() ? null : keyword.trim();
        if ((manageable && friendShareScope) || feedShareable) {
            List<Map<String, Object>> userTargets = contentShareDAO.selectUserTargets(userId, searchKeyword);
            Long collectedSourceUserId = contentShareDAO.selectCollectedSourceUserId(normalizedContentType, contentId);
            if (collectedSourceUserId != null) {
                result.put("blockedUserIds", List.of(collectedSourceUserId));
            } else {
                result.put("blockedUserIds", List.of());
            }
            result.put("users", userTargets);
            if (FRIEND_SHARE_CONTENT_TYPES.contains(normalizedContentType)) {
                result.put("workspaces", List.of());
                result.put("projects", List.of());
            } else {
                result.put("workspaces", contentShareDAO.selectWorkspaceTargets(userId));
                result.put("projects", contentShareDAO.selectProjectTargets(userId));
            }
        } else {
            result.put("users", List.of());
            result.put("workspaces", List.of());
            result.put("projects", List.of());
            result.put("blockedUserIds", List.of());
        }

        List<contentShareDTO> shares = manageable
                ? contentShareDAO.selectShares(normalizedContentType, contentId)
                : contentShareDAO.selectSharesForUser(normalizedContentType, contentId, userId);
        if (feedShareable && !manageable) {
            shares = shares.stream()
                    .filter(item -> item != null && userId.equals(item.getSharedBy()))
                    .toList();
        }
        result.put("shares", shares);
        result.put("shareMode", feedMode ? "FEED" : "PERMISSION");
        result.put("readonlyShare", !manageable && !feedShareable);
        return result;
    }

    @Override
    @Transactional
    public boolean saveShare(contentShareDTO share, Long userId, String shareMode) {
        if (share == null || share.getContentId() == null || share.getTargetId() == null || userId == null) return false;
        String contentType = normalizeContentType(share.getContentType());
        String targetType = normalizeTargetType(share.getTargetType());
        String permission = normalizePermission(share.getPermissionType());
        boolean feedMode = isFeedShareMode(shareMode);
        boolean memberPermissionMode = isMemberPermissionMode(shareMode);
        boolean manageable = canManage(contentType, share.getContentId(), userId);
        boolean friendShareScope = canUseFriendShare(contentType, share.getContentId(), userId);
        boolean feedShareable = feedMode && canSendMoyoFeedShare(contentType, share.getContentId(), userId);

        if (memberPermissionMode) {
            permission = "EDIT"; // 그룹/그룹 프로젝트의 멤버 지정은 공동 작성자(편집 가능) 지정이다.
            if (!FRIEND_SHARE_CONTENT_TYPES.contains(contentType) || !manageable) {
                throw new IllegalStateException("멤버 권한을 관리할 권한이 없습니다.");
            }
            if (!"USER".equals(targetType)) {
                throw new IllegalArgumentException("멤버 권한은 사용자 단위로만 설정할 수 있습니다.");
            }
            if (contentShareDAO.countNativeContentMember(contentType, share.getContentId(), share.getTargetId()) <= 0) {
                throw new IllegalArgumentException("현재 그룹 또는 프로젝트 멤버만 권한을 설정할 수 있습니다.");
            }
            Long ownerId = contentShareDAO.selectContentOwnerId(contentType, share.getContentId());
            if (ownerId == null) throw new IllegalStateException("콘텐츠를 찾을 수 없습니다.");
            if (ownerId.equals(share.getTargetId()) || userId.equals(share.getTargetId())) {
                throw new IllegalArgumentException("작성자 본인은 별도 권한 설정이 필요하지 않습니다.");
            }
            share.setContentType(contentType);
            share.setTargetType("USER");
            share.setPermissionType(permission);
            share.setOwnerId(ownerId);
            share.setSharedBy(userId);
            share.setActiveYn("Y");
            // 권한 멤버 지정도 개인 공유와 동일하게 요청/수락 흐름을 탄다.
            // 수락 전에는 접근/편집 권한이 발생하지 않는다.
            share.setShareStatus("PENDING");
            return contentShareDAO.mergeMemberPermissionShare(share) > 0;
        }
        if ((!manageable || !friendShareScope) && !feedShareable) {
            throw new IllegalStateException("개인 또는 개인 프로젝트 콘텐츠만 친구에게 공유할 수 있습니다.");
        }
        if (FRIEND_SHARE_CONTENT_TYPES.contains(contentType) && !"USER".equals(targetType)) {
            throw new IllegalArgumentException("노트·사진·자료실 공유 대상은 친구만 선택할 수 있습니다.");
        }
        if (feedShareable) permission = "VIEW";

        Long ownerId = contentShareDAO.selectContentOwnerId(contentType, share.getContentId());
        if (ownerId == null) throw new IllegalStateException("공유할 콘텐츠를 찾을 수 없습니다.");
        Long collectedSourceUserId = contentShareDAO.selectCollectedSourceUserId(contentType, share.getContentId());
        if ("USER".equals(targetType)
                && collectedSourceUserId != null
                && collectedSourceUserId.equals(share.getTargetId())) {
            throw new IllegalArgumentException("담아온 원본의 작성자에게는 다시 공유할 수 없습니다.");
        }
        if ("USER".equals(targetType) && ownerId.equals(share.getTargetId())) {
            throw new IllegalArgumentException("작성자 본인에게는 공유할 수 없습니다.");
        }
        if ("USER".equals(targetType) && userId.equals(share.getTargetId())) {
            throw new IllegalArgumentException("본인에게는 보낼 수 없습니다.");
        }

        if (runtimeDdlEnabled && "CALENDAR".equals(contentType)) {
            contentShareDAO.ensureContentShareContentConstraint();
        }

        share.setContentType(contentType);
        share.setTargetType(targetType);
        share.setPermissionType(permission);
        share.setOwnerId(ownerId);
        share.setSharedBy(userId);
        share.setActiveYn("Y");
        share.setShareStatus("PENDING");
        return contentShareDAO.mergeShare(share) > 0;
    }


    @Override
    @Transactional
    public int saveSharesBulk(String contentType, List<Long> contentIds, List<String> targetTypes, List<Long> targetIds, List<String> permissionTypes, Long userId, String shareMode) {
        String normalizedContentType = normalizeContentType(contentType);
        if (userId == null) return 0;
        if (contentIds == null || contentIds.isEmpty()) throw new IllegalArgumentException("공유할 콘텐츠를 선택해 주세요.");
        if (targetTypes == null || targetIds == null || targetTypes.isEmpty() || targetIds.isEmpty()) {
            throw new IllegalArgumentException("공유할 대상을 선택해 주세요.");
        }
        if (targetTypes.size() != targetIds.size()) {
            throw new IllegalArgumentException("공유 대상 정보가 올바르지 않습니다.");
        }

        List<Long> cleanContentIds = contentIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        if (cleanContentIds.isEmpty()) throw new IllegalArgumentException("공유할 콘텐츠를 선택해 주세요.");

        Date bulkCreatedAt = new Date();
        int saved = 0;
        for (Long contentId : cleanContentIds) {
            for (int i = 0; i < targetIds.size(); i++) {
                Long targetId = targetIds.get(i);
                if (targetId == null || targetId <= 0) continue;
                String targetType = i < targetTypes.size() ? targetTypes.get(i) : "USER";
                String permission = permissionTypes != null && i < permissionTypes.size() ? permissionTypes.get(i) : "VIEW";
                contentShareDTO share = new contentShareDTO();
                share.setContentType(normalizedContentType);
                share.setContentId(contentId);
                share.setTargetType(targetType);
                share.setTargetId(targetId);
                share.setPermissionType(permission);
                share.setCreatedAt(bulkCreatedAt);
                if (saveShare(share, userId, shareMode)) saved++;
            }
        }
        return saved;
    }

    @Override
    public boolean removeShare(Long shareId, Long userId) {
        return shareId != null && userId != null && contentShareDAO.deleteShare(shareId, userId) > 0;
    }


    @Override
    public List<contentShareDTO> getReceivedShareRequests(Long userId) {
        return userId == null ? List.of() : contentShareDAO.selectReceivedShareRequests(userId);
    }

    @Override
    public List<contentShareDTO> getSentShareRequests(Long userId) {
        return userId == null ? List.of() : contentShareDAO.selectSentShareRequests(userId);
    }

    @Override
    public int countPendingShareRequests(Long userId) {
        return userId == null ? 0 : contentShareDAO.countPendingShareRequests(userId);
    }

    @Override
    @Transactional
    public boolean respondShareRequest(Long shareId, String status, Long userId) {
        if (shareId == null || userId == null) return false;
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!RESPONSE_STATUS.contains(normalizedStatus)) {
            throw new IllegalArgumentException("지원하지 않는 요청 처리 상태입니다.");
        }
        if (contentShareDAO.countShareResponderPermission(shareId, userId) <= 0) {
            throw new IllegalStateException("공유 요청을 처리할 권한이 없습니다.");
        }
        return contentShareDAO.updateShareStatus(shareId, normalizedStatus, userId) > 0;
    }

    @Override
    @Transactional
    public boolean cancelOrLeaveShare(Long shareId, Long userId) {
        if (shareId == null || userId == null) return false;
        contentShareDTO share = contentShareDAO.selectShareById(shareId);
        if (share == null || !"Y".equalsIgnoreCase(share.getActiveYn())) return false;
        boolean requester = userId.equals(share.getOwnerId()) || userId.equals(share.getSharedBy());
        boolean responder = contentShareDAO.countShareResponderPermission(shareId, userId) > 0;
        if (!requester && !responder) throw new IllegalStateException("공유를 해지할 권한이 없습니다.");
        String status = requester ? "CANCELED" : "REJECTED";
        return contentShareDAO.updateShareStatus(shareId, status, userId) > 0;
    }

    @Override
    public void removeContentShares(String contentType, Long contentId) {
        if (contentId == null) return;
        String normalized = normalizeContentType(contentType);
        contentShareDAO.deleteSharesByContent(normalized, contentId);
    }


    private boolean isFeedShareMode(String shareMode) {
        return "FEED".equalsIgnoreCase(String.valueOf(shareMode == null ? "" : shareMode).trim());
    }

    private boolean isMemberPermissionMode(String shareMode) {
        return "MEMBER_PERMISSION".equalsIgnoreCase(String.valueOf(shareMode == null ? "" : shareMode).trim());
    }


    private boolean canUseFriendShare(String contentType, Long contentId, Long userId) {
        if (!FRIEND_SHARE_CONTENT_TYPES.contains(contentType)) return true;
        if (contentId == null || userId == null) return false;
        return contentShareDAO.countFriendShareScopePermission(contentType, contentId, userId) > 0;
    }

    private boolean canSendMoyoFeedShare(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        return contentShareDAO.countMoyoFeedSharePermission(normalizeContentType(contentType), contentId, userId) > 0;
    }

    private Long targetUserId(Map<String, Object> target) {
        if (target == null || target.isEmpty()) return null;
        Object raw = target.get("USER_ID");
        if (raw == null) raw = target.get("userId");
        if (raw == null) raw = target.get("ID");
        if (raw == null) raw = target.get("id");
        if (raw instanceof Number number) return number.longValue();
        if (raw == null) return null;
        try {
            return Long.valueOf(String.valueOf(raw).trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String normalizeContentType(String value) {
        String normalized = value == null ? "NOTE" : value.trim().toUpperCase(Locale.ROOT);
        if (!CONTENT_TYPES.contains(normalized)) throw new IllegalArgumentException("지원하지 않는 콘텐츠 유형입니다.");
        return normalized;
    }

    private String normalizeTargetType(String value) {
        String normalized = value == null ? "USER" : value.trim().toUpperCase(Locale.ROOT);
        if (!TARGET_TYPES.contains(normalized)) throw new IllegalArgumentException("지원하지 않는 공유 대상입니다.");
        return normalized;
    }

    private String normalizePermission(String value) {
        String normalized = value == null ? "VIEW" : value.trim().toUpperCase(Locale.ROOT);
        if (!PERMISSIONS.contains(normalized)) throw new IllegalArgumentException("지원하지 않는 공유 권한입니다.");
        return normalized;
    }
}
