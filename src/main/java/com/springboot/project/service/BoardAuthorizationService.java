package com.springboot.project.service;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.springboot.project.dao.IboardDAO;
import com.springboot.project.dto.postDTO;

@Service
public class BoardAuthorizationService {

    private final IboardDAO boardDAO;
    private final WorkspaceAuthorizationService workspaceAuthorizationService;
    private final IprojectAuthorizationService projectAuthorizationService;

    public BoardAuthorizationService(
            IboardDAO boardDAO,
            WorkspaceAuthorizationService workspaceAuthorizationService,
            IprojectAuthorizationService projectAuthorizationService) {
        this.boardDAO = boardDAO;
        this.workspaceAuthorizationService = workspaceAuthorizationService;
        this.projectAuthorizationService = projectAuthorizationService;
    }

    public boolean canAccessBoard(Long wsId, Long projId, Long userId) {
        if (userId == null) return false;
        if (projId != null) {
            return projectAuthorizationService.canAccessProject(projId, wsId, userId);
        }
        return workspaceAuthorizationService.isMember(wsId, userId);
    }

    public boolean canManageBoard(Long wsId, Long projId, Long userId) {
        if (userId == null) return false;
        if (projId != null) return projectAuthorizationService.canManageProject(projId, userId);
        return workspaceAuthorizationService.canManage(wsId, userId);
    }

    public postDTO getPost(Long postId) {
        if (postId == null) return null;
        return boardDAO.selectPostDetail(postId.intValue());
    }

    public boolean canViewPost(Long postId, Long userId) {
        postDTO post = getPost(postId);
        return post != null && canAccessBoard(post.getWsId(), post.getProjId(), userId);
    }

    public boolean canEditPost(Long postId, Long userId) {
        postDTO post = getPost(postId);
        if (post == null || userId == null || !canAccessBoard(post.getWsId(), post.getProjId(), userId)) return false;
        // 게시글 본문 수정은 작성자에게만 허용한다.
        // 그룹장/관리자는 관리 권한으로 삭제할 수 있지만 타인의 글 내용을 대신 수정하지 않는다.
        return userId.equals(post.getUserId());
    }

    public boolean canDeletePost(Long postId, Long userId) {
        postDTO post = getPost(postId);
        if (post == null || userId == null || !canAccessBoard(post.getWsId(), post.getProjId(), userId)) return false;
        return userId.equals(post.getUserId()) || canManageBoard(post.getWsId(), post.getProjId(), userId);
    }

    public boolean canEditReply(Long replyId, Long userId) {
        Map<String, Object> reply = boardDAO.selectReplyById(replyId);
        if (reply == null || userId == null) return false;
        Long postId = longValue(reply, "POST_ID", "postId");
        Long ownerId = longValue(reply, "USER_ID", "userId");
        return userId.equals(ownerId) && canViewPost(postId, userId);
    }

    public boolean canDeleteReply(Long replyId, Long userId) {
        Map<String, Object> reply = boardDAO.selectReplyById(replyId);
        if (reply == null || userId == null) return false;
        Long postId = longValue(reply, "POST_ID", "postId");
        Long ownerId = longValue(reply, "USER_ID", "userId");
        postDTO post = getPost(postId);
        if (post == null || !canAccessBoard(post.getWsId(), post.getProjId(), userId)) return false;
        return userId.equals(ownerId) || canManageBoard(post.getWsId(), post.getProjId(), userId);
    }

    public boolean canViewAttachment(String fileId, Long userId) {
        Map<String, Object> file = boardDAO.selectFileById(fileId);
        if (file == null) return false;
        return canViewPost(longValue(file, "POST_ID", "postId"), userId);
    }

    public boolean canDeleteAttachment(String fileId, Long userId) {
        Map<String, Object> file = boardDAO.selectFileById(fileId);
        if (file == null) return false;
        return canEditPost(longValue(file, "POST_ID", "postId"), userId);
    }

    public boolean canReportContent(Long wsId, String contentType, Long contentId, Long userId) {
        if (contentId == null || userId == null) return false;
        String type = contentType == null ? "BOARD" : contentType.trim().toUpperCase();
        Long postId;
        if ("REPLY".equals(type)) {
            Map<String, Object> reply = boardDAO.selectReplyById(contentId);
            postId = reply == null ? null : longValue(reply, "POST_ID", "postId");
        } else if ("FILE".equals(type)) {
            Map<String, Object> file = boardDAO.selectFileById(String.valueOf(contentId));
            postId = file == null ? null : longValue(file, "POST_ID", "postId");
        } else {
            postId = contentId;
        }
        postDTO post = getPost(postId);
        if (post == null || !canAccessBoard(post.getWsId(), post.getProjId(), userId)) return false;
        if (wsId == null) return true;
        return wsId.equals(post.getWsId());
    }

    private Long longValue(Map<String, Object> row, String... keys) {
        if (row == null) return null;
        for (String key : keys) {
            Object value = row.get(key);
            if (value instanceof Number n) return n.longValue();
            if (value != null) {
                try { return Long.valueOf(String.valueOf(value)); } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }
}
