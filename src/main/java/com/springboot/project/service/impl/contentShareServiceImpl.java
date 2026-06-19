package com.springboot.project.service.impl;

import com.springboot.project.dao.IcontentShareDAO;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.service.IcontentShareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class contentShareServiceImpl implements IcontentShareService {
    private static final Set<String> CONTENT_TYPES = Set.of("NOTE", "PHOTO", "ALBUM", "BOARD", "EVENT", "POLL", "FILE");
    private static final Set<String> TARGET_TYPES = Set.of("USER", "WS", "PROJ");
    private static final Set<String> PERMISSIONS = Set.of("VIEW", "EDIT");

    @Autowired
    private IcontentShareDAO contentShareDAO;

    @Override
    public boolean canManage(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        return contentShareDAO.countManagePermission(normalizeContentType(contentType), contentId, userId) > 0;
    }

    @Override
    public List<contentShareDTO> getShares(String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return List.of();
        String normalizedContentType = normalizeContentType(contentType);
        if (!canManage(normalizedContentType, contentId, userId)) return List.of();
        return contentShareDAO.selectShares(normalizedContentType, contentId);
    }

    @Override
    public Map<String, Object> getTargets(String contentType, Long contentId, Long userId, String keyword) {
        if (!canManage(contentType, contentId, userId)) throw new IllegalStateException("공유를 관리할 권한이 없습니다.");
        Map<String, Object> result = new HashMap<>();
        String searchKeyword = keyword == null || keyword.trim().isEmpty() ? null : keyword.trim();
        result.put("users", contentShareDAO.selectUserTargets(userId, searchKeyword));
        result.put("workspaces", contentShareDAO.selectWorkspaceTargets(userId));
        result.put("projects", contentShareDAO.selectProjectTargets(userId));
        result.put("shares", contentShareDAO.selectShares(normalizeContentType(contentType), contentId));
        return result;
    }

    @Override
    @Transactional
    public boolean saveShare(contentShareDTO share, Long userId) {
        if (share == null || share.getContentId() == null || share.getTargetId() == null || userId == null) return false;
        String contentType = normalizeContentType(share.getContentType());
        String targetType = normalizeTargetType(share.getTargetType());
        String permission = normalizePermission(share.getPermissionType());
        if (!canManage(contentType, share.getContentId(), userId)) throw new IllegalStateException("공유를 관리할 권한이 없습니다.");

        Long ownerId = contentShareDAO.selectContentOwnerId(contentType, share.getContentId());
        if (ownerId == null) throw new IllegalStateException("공유할 콘텐츠를 찾을 수 없습니다.");
        if ("USER".equals(targetType) && ownerId.equals(share.getTargetId())) {
            throw new IllegalArgumentException("작성자 본인에게는 공유할 수 없습니다.");
        }

        share.setContentType(contentType);
        share.setTargetType(targetType);
        share.setPermissionType(permission);
        share.setOwnerId(ownerId);
        share.setSharedBy(userId);
        share.setActiveYn("Y");
        return contentShareDAO.mergeShare(share) > 0;
    }

    @Override
    public boolean removeShare(Long shareId, Long userId) {
        return shareId != null && userId != null && contentShareDAO.deleteShare(shareId, userId) > 0;
    }

    @Override
    public void removeContentShares(String contentType, Long contentId) {
        if (contentId != null) contentShareDAO.deleteSharesByContent(normalizeContentType(contentType), contentId);
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
