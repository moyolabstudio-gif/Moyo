package com.springboot.project.controller;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.postDTO;
import com.springboot.project.service.IboardService;
import com.springboot.project.service.IcontentReactionService;
import com.springboot.project.service.IphotoAlbumService;
import com.springboot.project.service.IprojectService;

@RestController
@RequestMapping("/api/reactions")
public class contentReactionController {

    private final IcontentReactionService contentReactionService;
    private final IphotoAlbumService photoAlbumService;
    private final IworkspaceDAO workspaceDAO;
    private final IprojectService projectService;
    private final IboardService boardService;

    public contentReactionController(IcontentReactionService contentReactionService,
                                     IphotoAlbumService photoAlbumService,
                                     IworkspaceDAO workspaceDAO,
                                     IprojectService projectService,
                                     IboardService boardService) {
        this.contentReactionService = contentReactionService;
        this.photoAlbumService = photoAlbumService;
        this.workspaceDAO = workspaceDAO;
        this.projectService = projectService;
        this.boardService = boardService;
    }

    @PostMapping("/toggle")
    public ResponseEntity<?> toggle(@RequestBody Map<String, Object> body, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        String contentType = string(body.get("contentType")).toUpperCase();
        Long contentId = toLong(body.get("contentId"));
        String reactionType = string(body.get("reactionType"));

        ResponseEntity<?> denied = authorizeContent(contentType, contentId, user.getUserId());
        if (denied != null) return denied;

        try {
            return ResponseEntity.ok(contentReactionService.toggle(
                    contentType, contentId, user.getUserId(), reactionType));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> status(@RequestParam("contentType") String contentType,
                                    @RequestParam("contentId") Long contentId,
                                    @RequestParam(value = "reactionType", defaultValue = "LIKE") String reactionType,
                                    HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        String normalizedContentType = string(contentType).toUpperCase();
        ResponseEntity<?> denied = authorizeContent(normalizedContentType, contentId, user.getUserId());
        if (denied != null) return denied;

        try {
            return ResponseEntity.ok(contentReactionService.getStatus(
                    normalizedContentType, contentId, user.getUserId(), reactionType));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    private ResponseEntity<?> authorizeContent(String contentType, Long contentId, Long userId) {
        if (contentId == null) return error(HttpStatus.BAD_REQUEST, "콘텐츠 정보가 올바르지 않습니다.");

        if ("PHOTO_POST".equals(contentType)) {
            Map<String, Object> post = photoAlbumService.getPost(contentId);
            if (post == null) return error(HttpStatus.NOT_FOUND, "사진 게시물을 찾을 수 없습니다.");

            String scopeType = string(value(post, "scopeType", "SCOPE_TYPE")).toUpperCase();
            Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
            return canAccess(scopeType, scopeId, userId)
                    ? null
                    : error(HttpStatus.FORBIDDEN, "이 사진 게시물에 접근할 권한이 없습니다.");
        }

        if ("BOARD".equals(contentType) || "NOTICE".equals(contentType)) {
            postDTO boardPost = boardService.getPostDetail(contentId.intValue());
            if (boardPost == null) return error(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다.");

            Long projId = boardPost.getProjId();
            Long wsId = boardPost.getWsId();
            boolean accessible = projId != null ? isProjectMember(projId, userId) : canAccess("WORKSPACE", wsId, userId);
            return accessible
                    ? null
                    : error(HttpStatus.FORBIDDEN, "이 게시글에 접근할 권한이 없습니다.");
        }

        return error(HttpStatus.BAD_REQUEST, "아직 연결되지 않은 콘텐츠 유형입니다.");
    }

    private boolean canAccess(String scopeType, Long scopeId, Long userId) {
        if (scopeId == null || userId == null) return false;
        return switch (scopeType) {
            case "PERSONAL" -> scopeId.equals(userId);
            case "WORKSPACE" -> workspaceDAO.isWorkspaceMember(scopeId, userId) > 0;
            case "PROJECT" -> isProjectMember(scopeId, userId);
            default -> false;
        };
    }

    private boolean isProjectMember(Long projId, Long userId) {
        List<Map<String, Object>> members = projectService.getProjectMembers(projId);
        if (members == null) return false;
        return members.stream().anyMatch(member ->
                userId.equals(toLong(value(member, "userId", "USER_ID"))));
    }

    private usersDto loginUser(HttpSession session) {
        return (usersDto) session.getAttribute("user");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("status", "ERROR", "message", message));
    }

    private Object value(Map<String, Object> map, String camelKey, String upperKey) {
        if (map == null) return null;
        Object result = map.get(camelKey);
        return result != null ? result : map.get(upperKey);
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        try { return value == null ? null : Long.valueOf(value.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private String string(Object value) {
        return value == null ? "" : value.toString().trim();
    }
}
