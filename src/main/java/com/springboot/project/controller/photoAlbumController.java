package com.springboot.project.controller;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.IphotoAlbumService;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IworkspaceService;

@Controller
public class photoAlbumController {

    private final IphotoAlbumService photoAlbumService;
    private final IworkspaceService workspaceService;
    private final IworkspaceDAO workspaceDAO;
    private final IprojectService projectService;

    public photoAlbumController(IphotoAlbumService photoAlbumService,
                                IworkspaceService workspaceService,
                                IworkspaceDAO workspaceDAO,
                                IprojectService projectService) {
        this.photoAlbumService = photoAlbumService;
        this.workspaceService = workspaceService;
        this.workspaceDAO = workspaceDAO;
        this.projectService = projectService;
    }

    @GetMapping("/photo-album")
    public String page(@RequestParam("scopeType") String scopeType,
                       @RequestParam("scopeId") Long scopeId,
                       HttpSession session,
                       Model model) {
        usersDto user = loginUser(session);
        if (user == null) return "redirect:/login";

        String normalizedType;
        try {
            normalizedType = normalizeScopeType(scopeType);
        } catch (IllegalArgumentException e) {
            return "redirect:/";
        }
        if (!canAccess(normalizedType, scopeId, user.getUserId())) return "redirect:/";

        ScopeViewData viewData = resolveViewData(normalizedType, scopeId, user);
        if (viewData == null) return "redirect:/";

        model.addAttribute("scopeType", normalizedType);
        model.addAttribute("scopeId", scopeId);
        model.addAttribute("scopeName", viewData.scopeName());
        model.addAttribute("scopeLabel", viewData.scopeLabel());
        model.addAttribute("scopeDescription", viewData.description());
        model.addAttribute("backUrl", viewData.backUrl());
        model.addAttribute("currentUserId", user.getUserId());
        model.addAttribute("isScopeAdmin", canManageScope(normalizedType, scopeId, user.getUserId()));
        return "photo/photoAlbum";
    }

    @GetMapping("/api/photo-albums")
    @ResponseBody
    public ResponseEntity<?> albums(@RequestParam("scopeType") String scopeType,
                                    @RequestParam("scopeId") Long scopeId,
                                    HttpSession session) {
        ResponseEntity<?> denied = authorizeScope(scopeType, scopeId, session);
        if (denied != null) return denied;
        return ResponseEntity.ok(photoAlbumService.getAlbums(scopeType, scopeId));
    }

    @PostMapping("/api/photo-albums")
    @ResponseBody
    public ResponseEntity<?> createAlbum(@RequestBody Map<String, Object> body, HttpSession session) {
        usersDto user = loginUser(session);
        String scopeType = string(body.get("scopeType"));
        Long scopeId = toLong(body.get("scopeId"));
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        ResponseEntity<?> denied = authorizeScope(scopeType, scopeId, session);
        if (denied != null) return denied;

        try {
            Long albumId = photoAlbumService.createAlbum(
                    scopeType, scopeId, string(body.get("albumName")),
                    string(body.get("albumDescription")), user.getUserId());
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "albumId", albumId));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/api/photo-albums/{albumId}")
    @ResponseBody
    public ResponseEntity<?> album(@PathVariable("albumId") Long albumId, HttpSession session) {
        Map<String, Object> album = photoAlbumService.getAlbum(albumId);
        ResponseEntity<?> denied = authorizeAlbum(album, session);
        if (denied != null) return denied;
        usersDto user = loginUser(session);
        return ResponseEntity.ok(Map.of("album", album, "posts", photoAlbumService.getPosts(
                string(value(album, "scopeType", "SCOPE_TYPE")),
                toLong(value(album, "scopeId", "SCOPE_ID")), albumId, user.getUserId())));
    }

    @PutMapping("/api/photo-albums/{albumId}")
    @ResponseBody
    public ResponseEntity<?> updateAlbum(@PathVariable("albumId") Long albumId,
                                         @RequestBody Map<String, Object> body,
                                         HttpSession session) {
        Map<String, Object> album = photoAlbumService.getAlbum(albumId);
        ResponseEntity<?> denied = authorizeAlbumManager(album, session);
        if (denied != null) return denied;
        try {
            boolean success = photoAlbumService.updateAlbum(albumId,
                    string(body.get("albumName")), string(body.get("albumDescription")));
            return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/api/photo-albums/{albumId}")
    @ResponseBody
    public ResponseEntity<?> deleteAlbum(@PathVariable("albumId") Long albumId, HttpSession session) {
        Map<String, Object> album = photoAlbumService.getAlbum(albumId);
        ResponseEntity<?> denied = authorizeAlbumManager(album, session);
        if (denied != null) return denied;
        return ResponseEntity.ok(Map.of("status", photoAlbumService.deleteAlbum(albumId) ? "SUCCESS" : "FAIL"));
    }


    @GetMapping("/api/photo-posts")
    @ResponseBody
    public ResponseEntity<?> posts(@RequestParam("scopeType") String scopeType,
                                   @RequestParam("scopeId") Long scopeId,
                                   @RequestParam(value = "albumId", required = false) Long albumId,
                                   HttpSession session) {
        ResponseEntity<?> denied = authorizeScope(scopeType, scopeId, session);
        if (denied != null) return denied;
        usersDto user = loginUser(session);
        return ResponseEntity.ok(photoAlbumService.getPosts(scopeType, scopeId, albumId, user.getUserId()));
    }

    @GetMapping("/api/photo-posts/recent")
    @ResponseBody
    public ResponseEntity<?> recentPosts(@RequestParam("scopeType") String scopeType,
                                         @RequestParam("scopeId") Long scopeId,
                                         @RequestParam(value = "limit", defaultValue = "3") int limit,
                                         HttpSession session) {
        ResponseEntity<?> denied = authorizeScope(scopeType, scopeId, session);
        if (denied != null) return denied;
        usersDto user = loginUser(session);
        return ResponseEntity.ok(photoAlbumService.getRecentPosts(scopeType, scopeId, limit, user.getUserId()));
    }

    @GetMapping("/api/photo-posts/{postId}")
    @ResponseBody
    public ResponseEntity<?> post(@PathVariable("postId") Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        return ResponseEntity.ok(Map.of("post", post, "photos", photoAlbumService.getPostPhotos(postId)));
    }

    @PostMapping("/api/photo-posts")
    @ResponseBody
    public ResponseEntity<?> createPost(@RequestParam("scopeType") String scopeType,
                                        @RequestParam("scopeId") Long scopeId,
                                        @RequestParam(value = "albumId", required = false) Long albumId,
                                        @RequestParam(value = "title", required = false) String title,
                                        @RequestParam(value = "description", required = false) String description,
                                        @RequestPart("files") List<MultipartFile> files,
                                        HttpSession session) {
        ResponseEntity<?> denied = authorizeScope(scopeType, scopeId, session);
        if (denied != null) return denied;
        usersDto user = loginUser(session);
        if (albumId != null) {
            Map<String, Object> album = photoAlbumService.getAlbum(albumId);
            if (album == null || !normalizeScopeType(scopeType).equals(string(value(album, "scopeType", "SCOPE_TYPE")))
                    || !scopeId.equals(toLong(value(album, "scopeId", "SCOPE_ID")))) {
                return error(HttpStatus.BAD_REQUEST, "현재 공간의 앨범만 선택할 수 있습니다.");
            }
        }
        try {
            Long postId = photoAlbumService.createPost(scopeType, scopeId, albumId, title, description, files, user.getUserId());
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "postId", postId));
        } catch (RuntimeException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/api/photo-posts/{postId}")
    @ResponseBody
    public ResponseEntity<?> updatePost(@PathVariable("postId") Long postId,
                                        @RequestBody Map<String, Object> body,
                                        HttpSession session) {
        Map<String, Object> post = photoAlbumService.getPost(postId);
        ResponseEntity<?> denied = authorizePostManager(post, session);
        if (denied != null) return denied;
        Long albumId = toLong(body.get("albumId"));
        if (!albumBelongsToPostScope(albumId, post)) {
            return error(HttpStatus.BAD_REQUEST, "현재 공간의 앨범만 선택할 수 있습니다.");
        }
        boolean success = photoAlbumService.updatePost(postId, albumId, string(body.get("title")), string(body.get("description")));
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    @PutMapping("/api/photo-posts/{postId}/album")
    @ResponseBody
    public ResponseEntity<?> movePostAlbum(@PathVariable("postId") Long postId,
                                           @RequestBody Map<String, Object> body,
                                           HttpSession session) {
        Map<String, Object> post = photoAlbumService.getPost(postId);
        ResponseEntity<?> denied = authorizePostManager(post, session);
        if (denied != null) return denied;

        Long albumId = toLong(body.get("albumId"));
        if (!albumBelongsToPostScope(albumId, post)) {
            return error(HttpStatus.BAD_REQUEST, "현재 공간의 앨범으로만 이동할 수 있습니다.");
        }

        boolean success = photoAlbumService.movePostAlbum(postId, albumId);
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    @DeleteMapping("/api/photo-posts/{postId}")
    @ResponseBody
    public ResponseEntity<?> deletePost(@PathVariable("postId") Long postId, HttpSession session) {
        Map<String, Object> post = photoAlbumService.getPost(postId);
        ResponseEntity<?> denied = authorizePostManager(post, session);
        if (denied != null) return denied;
        return ResponseEntity.ok(Map.of("status", photoAlbumService.deletePost(postId) ? "SUCCESS" : "FAIL"));
    }

    @DeleteMapping("/api/photos/{photoId}")
    @ResponseBody
    public ResponseEntity<?> deletePhoto(@PathVariable("photoId") Long photoId, HttpSession session) {
        Map<String, Object> photo = photoAlbumService.getPhoto(photoId);
        if (photo == null) return error(HttpStatus.NOT_FOUND, "사진을 찾을 수 없습니다.");

        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        String scopeType = string(value(photo, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(photo, "scopeId", "SCOPE_ID"));
        if (!canAccess(scopeType, scopeId, user.getUserId())) {
            return error(HttpStatus.FORBIDDEN, "이 사진에 접근할 권한이 없습니다.");
        }

        boolean isUploader = user.getUserId().equals(toLong(value(photo, "uploadedBy", "UPLOADED_BY")));
        boolean isAdmin = canManageScope(scopeType, scopeId, user.getUserId());
        if (!isUploader && !isAdmin) {
            return error(HttpStatus.FORBIDDEN, "본인이 올린 사진 또는 공간 관리자만 삭제할 수 있습니다.");
        }
        return ResponseEntity.ok(Map.of("status", photoAlbumService.deletePhoto(photoId) ? "SUCCESS" : "FAIL"));
    }


    private boolean albumBelongsToPostScope(Long albumId, Map<String, Object> post) {
        if (albumId == null) return true;
        if (post == null) return false;
        Map<String, Object> album = photoAlbumService.getAlbum(albumId);
        if (album == null) return false;
        try {
            String postScopeType = normalizeScopeType(string(value(post, "scopeType", "SCOPE_TYPE")));
            String albumScopeType = normalizeScopeType(string(value(album, "scopeType", "SCOPE_TYPE")));
            Long postScopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
            Long albumScopeId = toLong(value(album, "scopeId", "SCOPE_ID"));
            return postScopeType.equals(albumScopeType) && postScopeId != null && postScopeId.equals(albumScopeId);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private ResponseEntity<?> authorizePost(Map<String, Object> post, HttpSession session) {
        if (post == null) return error(HttpStatus.NOT_FOUND, "사진 게시물을 찾을 수 없습니다.");
        return authorizeScope(string(value(post, "scopeType", "SCOPE_TYPE")),
                toLong(value(post, "scopeId", "SCOPE_ID")), session);
    }

    private ResponseEntity<?> authorizePostManager(Map<String, Object> post, HttpSession session) {
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        usersDto user = loginUser(session);
        String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        boolean isCreator = user.getUserId().equals(toLong(value(post, "createdBy", "CREATED_BY")));
        boolean isAdmin = canManageScope(scopeType, scopeId, user.getUserId());
        return isCreator || isAdmin ? null : error(HttpStatus.FORBIDDEN, "작성자 또는 공간 관리자만 수정할 수 있습니다.");
    }

    private ResponseEntity<?> authorizeAlbum(Map<String, Object> album, HttpSession session) {
        if (album == null) return error(HttpStatus.NOT_FOUND, "앨범을 찾을 수 없습니다.");
        return authorizeScope(string(value(album, "scopeType", "SCOPE_TYPE")),
                toLong(value(album, "scopeId", "SCOPE_ID")), session);
    }

    private ResponseEntity<?> authorizeAlbumManager(Map<String, Object> album, HttpSession session) {
        if (album == null) return error(HttpStatus.NOT_FOUND, "앨범을 찾을 수 없습니다.");
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        String scopeType = string(value(album, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(album, "scopeId", "SCOPE_ID"));
        if (!canAccess(scopeType, scopeId, user.getUserId())) {
            return error(HttpStatus.FORBIDDEN, "이 앨범에 접근할 권한이 없습니다.");
        }
        boolean isCreator = user.getUserId().equals(toLong(value(album, "createdBy", "CREATED_BY")));
        boolean isAdmin = canManageScope(scopeType, scopeId, user.getUserId());
        return isCreator || isAdmin ? null : error(HttpStatus.FORBIDDEN, "앨범 생성자 또는 공간 관리자만 수정할 수 있습니다.");
    }

    private ResponseEntity<?> authorizeScope(String scopeType, Long scopeId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        String normalized;
        try {
            normalized = normalizeScopeType(scopeType);
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return canAccess(normalized, scopeId, user.getUserId())
                ? null : error(HttpStatus.FORBIDDEN, "이 공간의 사진첩을 이용할 권한이 없습니다.");
    }

    private boolean canAccess(String scopeType, Long scopeId, Long userId) {
        if (scopeId == null || userId == null) return false;
        String type;
        try { type = normalizeScopeType(scopeType); }
        catch (IllegalArgumentException e) { return false; }

        return switch (type) {
            case "PERSONAL" -> scopeId.equals(userId);
            case "WORKSPACE" -> workspaceDAO.isWorkspaceMember(scopeId, userId) > 0;
            case "PROJECT" -> isProjectMember(scopeId, userId);
            default -> false;
        };
    }

    private boolean canManageScope(String scopeType, Long scopeId, Long userId) {
        if (scopeId == null || userId == null) return false;
        String type;
        try { type = normalizeScopeType(scopeType); }
        catch (IllegalArgumentException e) { return false; }

        return switch (type) {
            case "PERSONAL" -> scopeId.equals(userId);
            case "WORKSPACE" -> isWorkspaceOwner(scopeId, userId)
                    || workspaceDAO.isWorkspaceAdmin(scopeId, userId) > 0;
            case "PROJECT" -> isProjectAdmin(scopeId, userId);
            default -> false;
        };
    }


    private boolean isWorkspaceOwner(Long wsId, Long userId) {
        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        return workspace != null && userId.equals(workspace.getOwnerId());
    }

    private boolean isProjectMember(Long projId, Long userId) {
        List<Map<String, Object>> members = projectService.getProjectMembers(projId);
        if (members == null) return false;
        return members.stream().anyMatch(member -> userId.equals(toLong(value(member, "userId", "USER_ID"))));
    }

    private boolean isProjectAdmin(Long projId, Long userId) {
        projectRequestDTO project = projectService.getProjectById(projId);
        if (project != null && userId.equals(project.getLeaderId())) return true;
        List<Map<String, Object>> members = projectService.getProjectMembers(projId);
        if (members == null) return false;
        return members.stream().anyMatch(member -> {
            Long memberId = toLong(value(member, "userId", "USER_ID"));
            String role = string(value(member, "projRole", "PROJ_ROLE"));
            return userId.equals(memberId) && List.of("ADMIN", "LEADER", "OWNER", "PM").contains(role.toUpperCase());
        });
    }

    private ScopeViewData resolveViewData(String scopeType, Long scopeId, usersDto user) {
        return switch (scopeType) {
            case "PERSONAL" -> new ScopeViewData(
                    user.getUserName() + "의 공간", "PERSONAL ALBUM",
                    "나만의 순간을 앨범별로 모아보세요.", "/");
            case "WORKSPACE" -> workspaceViewData(scopeId);
            case "PROJECT" -> projectViewData(scopeId);
            default -> null;
        };
    }

    private ScopeViewData workspaceViewData(Long wsId) {
        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return null;
        return new ScopeViewData(workspace.getWsName(), "WORKSPACE ALBUM",
                "워크스페이스의 순간을 앨범별로 모아 공유하세요.",
                "/workspace/main?wsId=" + wsId);
    }

    private ScopeViewData projectViewData(Long projId) {
        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) return null;
        return new ScopeViewData(project.getProjName(), "PROJECT ALBUM",
                "프로젝트 진행 과정과 결과를 사진으로 공유하세요.",
                "/project/main?projId=" + projId + "&wsId=" + project.getWsId());
    }

    private String normalizeScopeType(String scopeType) {
        String normalized = scopeType == null ? "" : scopeType.trim().toUpperCase();
        if (!List.of("PERSONAL", "WORKSPACE", "PROJECT").contains(normalized)) {
            throw new IllegalArgumentException("지원하지 않는 공간 유형입니다.");
        }
        return normalized;
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
        if (value instanceof Number) return ((Number) value).longValue();
        try { return value == null ? null : Long.valueOf(value.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private String string(Object value) {
        return value == null ? "" : value.toString();
    }

    private record ScopeViewData(String scopeName, String scopeLabel, String description, String backUrl) {}
}
