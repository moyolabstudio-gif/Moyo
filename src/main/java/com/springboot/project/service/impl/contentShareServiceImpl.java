package com.springboot.project.service.impl;

import com.springboot.project.dao.IcontentShareDAO;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.service.IcontentShareService;
import org.springframework.beans.factory.annotation.Autowired;
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
    private static final Set<String> CONTENT_TYPES = Set.of("NOTE", "PHOTO", "CALENDAR", "ALBUM", "BOARD", "EVENT", "POLL", "FILE");
    private static final Set<String> TARGET_TYPES = Set.of("USER", "WS", "PROJ");
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
        return contentShareDAO.countReadPermission(normalizeContentType(contentType), contentId, userId) > 0;
    }

    @Override
    public List<contentShareDTO> getShares(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return List.of();
        String normalizedContentType = normalizeContentType(contentType);
        if (!canManage(normalizedContentType, contentId, userId)) return List.of();
        return contentShareDAO.selectShares(normalizedContentType, contentId);
    }

    @Override
    public Map<String, Object> getTargets(String contentType, Long contentId, Long userId, String keyword, String shareMode) {
        String normalizedContentType = normalizeContentType(contentType);
        boolean feedMode = isFeedShareMode(shareMode);
        boolean manageable = canManage(normalizedContentType, contentId, userId);
        boolean feedShareable = feedMode && canSendMoyoFeedShare(normalizedContentType, contentId, userId);
        boolean readable = canRead(normalizedContentType, contentId, userId);
        if (!manageable && !feedShareable && !readable) throw new IllegalStateException("공유할 권한이 없습니다.");

        Map<String, Object> result = new HashMap<>();
        String searchKeyword = keyword == null || keyword.trim().isEmpty() ? null : keyword.trim();
        if (manageable || feedShareable) {
            result.put("users", contentShareDAO.selectUserTargets(userId, searchKeyword));
            result.put("workspaces", contentShareDAO.selectWorkspaceTargets(userId));
            result.put("projects", contentShareDAO.selectProjectTargets(userId));
        } else {
            result.put("users", List.of());
            result.put("workspaces", List.of());
            result.put("projects", List.of());
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
        boolean manageable = canManage(contentType, share.getContentId(), userId);
        boolean feedShareable = feedMode && canSendMoyoFeedShare(contentType, share.getContentId(), userId);
        if (!manageable && !feedShareable) throw new IllegalStateException("공유할 권한이 없습니다.");

        Long ownerId = contentShareDAO.selectContentOwnerId(contentType, share.getContentId());
        if (ownerId == null) throw new IllegalStateException("공유할 콘텐츠를 찾을 수 없습니다.");
        if ("USER".equals(targetType) && ownerId.equals(share.getTargetId())) {
            throw new IllegalArgumentException("작성자 본인에게는 공유할 수 없습니다.");
        }
        if ("USER".equals(targetType) && userId.equals(share.getTargetId())) {
            throw new IllegalArgumentException("본인에게는 보낼 수 없습니다.");
        }

        if ("CALENDAR".equals(contentType)) {
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
        if (contentId != null) contentShareDAO.deleteSharesByContent(normalizeContentType(contentType), contentId);
    }


    private boolean isFeedShareMode(String shareMode) {
        return "FEED".equalsIgnoreCase(String.valueOf(shareMode == null ? "" : shareMode).trim());
    }

    private boolean canSendMoyoFeedShare(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        return contentShareDAO.countMoyoFeedSharePermission(normalizeContentType(contentType), contentId, userId) > 0;
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
