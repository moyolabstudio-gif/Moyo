package com.springboot.project.controller;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dao.IfriendDAO;
import com.springboot.project.dao.InoteFolderDAO;
import com.springboot.project.dao.IcontentRecordDAO;
import com.springboot.project.dao.IcontentRecordItemDAO;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.dto.friendDTO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.IcontentShareService;
import com.springboot.project.service.IcontentRecordService;
import com.springboot.project.service.IphotoAlbumService;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IworkspaceService;

@Controller
public class photoAlbumController {

    @Value("${moyo.schema.runtime-ddl-enabled:false}")
    private boolean runtimeDdlEnabled;

    private static final ObjectMapper PHOTO_EDIT_META_MAPPER = new ObjectMapper();

    private final IphotoAlbumService photoAlbumService;
    private final IworkspaceService workspaceService;
    private final IworkspaceDAO workspaceDAO;
    private final IuserNoticeDAO userNoticeDAO;
    private final IfriendDAO friendDAO;
    private final IprojectService projectService;
    private final InoteFolderDAO noteFolderDAO;
    private final IcontentShareService contentShareService;
    private final IcontentRecordDAO contentRecordDAO;
    private final IcontentRecordItemDAO contentRecordItemDAO;
    private final IcontentRecordService contentRecordService;

    public photoAlbumController(IphotoAlbumService photoAlbumService,
                                IworkspaceService workspaceService,
                                IworkspaceDAO workspaceDAO,
                                IuserNoticeDAO userNoticeDAO,
                                IfriendDAO friendDAO,
                                IprojectService projectService,
                                InoteFolderDAO noteFolderDAO,
                                IcontentShareService contentShareService,
                                IcontentRecordDAO contentRecordDAO,
                                IcontentRecordItemDAO contentRecordItemDAO,
                                IcontentRecordService contentRecordService) {
        this.photoAlbumService = photoAlbumService;
        this.workspaceService = workspaceService;
        this.workspaceDAO = workspaceDAO;
        this.userNoticeDAO = userNoticeDAO;
        this.friendDAO = friendDAO;
        this.projectService = projectService;
        this.noteFolderDAO = noteFolderDAO;
        this.contentShareService = contentShareService;
        this.contentRecordDAO = contentRecordDAO;
        this.contentRecordItemDAO = contentRecordItemDAO;
        this.contentRecordService = contentRecordService;
    }

    @GetMapping({"/photo/media/{photoId}", "/photo/media/{photoId}/raw"})
    public ResponseEntity<?> photoMedia(@PathVariable("photoId") Long photoId,
                                        HttpServletRequest request,
                                        HttpSession session) throws Exception {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        Map<String, Object> photo = photoAlbumService.getPhoto(photoId);
        if (photo == null) return error(HttpStatus.NOT_FOUND, "사진을 찾을 수 없습니다.");
        Long postId = toLong(value(photo, "postId", "POST_ID"));
        if (postId == null) return error(HttpStatus.NOT_FOUND, "사진 게시물을 찾을 수 없습니다.");

        Map<String, Object> post = photoAlbumService.getPost(postId);
        boolean trashPost = false;
        if (post == null) {
            post = photoAlbumService.getTrashPost(postId, user.getUserId());
            trashPost = post != null;
        }
        ResponseEntity<?> denied = trashPost ? authorizePostDelete(post, session) : authorizePost(post, session);
        if (denied != null) return denied;

        boolean raw = request.getRequestURI() != null && request.getRequestURI().endsWith("/raw");
        Path path = photoAlbumService.getPhotoPath(photoId, raw);
        String contentType = Files.probeContentType(path);
        if (contentType == null || contentType.isBlank()) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

        String originalName = string(value(photo, "originalName", "ORIGINAL_NAME"));
        if (originalName == null || originalName.isBlank()) originalName = path.getFileName().toString();
        ContentDisposition disposition = (raw ? ContentDisposition.attachment() : ContentDisposition.inline())
                .filename(originalName, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(Files.size(path))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(new InputStreamResource(Files.newInputStream(path)));
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

        String explorerScopeType = "WORKSPACE".equals(normalizedType) ? "GROUP" : normalizedType;
        projectRequestDTO projectDetail = "PROJECT".equals(normalizedType)
                ? projectService.getProjectById(scopeId) : null;
        Long wsId = "WORKSPACE".equals(normalizedType)
                ? scopeId
                : (projectDetail == null ? null : projectDetail.getWsId());
        workspaceDTO workspace = wsId == null ? null : workspaceService.getWorkspaceDetail(wsId);

        List<Map<String, Object>> accessibleProjects = normalizeProjectRows(noteFolderDAO.selectAccessibleProjects(user.getUserId()));
        List<Map<String, Object>> personalProjects = new ArrayList<>();
        List<Map<String, Object>> groupProjects = new ArrayList<>();
        for (Map<String, Object> project : accessibleProjects) {
            Long projectWsId = toLong(project.get("wsId"));
            if (projectWsId == null) personalProjects.add(project);
            if (wsId != null && wsId.equals(projectWsId)) groupProjects.add(project);
        }

        model.addAttribute("contentType", "PHOTO");
        model.addAttribute("scopeType", explorerScopeType);
        model.addAttribute("scopeId", scopeId);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", "PROJECT".equals(normalizedType) ? scopeId : null);
        model.addAttribute("workspace", workspace);
        model.addAttribute("projectDetail", projectDetail);
        model.addAttribute("personalRoot", "PERSONAL".equals(normalizedType));
        model.addAttribute("personalProjects", personalProjects);
        model.addAttribute("groupProjects", groupProjects);
        model.addAttribute("pageTitle", switch (normalizedType) {
            case "WORKSPACE" -> "그룹 사진";
            case "PROJECT" -> "프로젝트 사진";
            default -> "내 사진";
        });
        model.addAttribute("currentUserId", user.getUserId());
        model.addAttribute("isScopeAdmin", canManageScope(normalizedType, scopeId, user.getUserId()));
        model.addAttribute("isWorkspaceOwner", wsId != null && isWorkspaceOwner(wsId, user.getUserId()));
        model.addAttribute("isWorkspaceAdmin", wsId != null && workspaceDAO.isWorkspaceAdmin(wsId, user.getUserId()) > 0);
        return "common/contentExplorer";
    }

    @GetMapping("/photo-post/write")
    public String writePostPage(@RequestParam("scopeType") String scopeType,
                                @RequestParam("scopeId") Long scopeId,
                                @RequestParam(value = "albumId", required = false) Long albumId,
                                @RequestParam(value = "moyoPublic", required = false, defaultValue = "false") boolean moyoPublic,
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

        model.addAttribute("formMode", "write");
        model.addAttribute("scopeType", normalizedType);
        model.addAttribute("scopeId", scopeId);
        model.addAttribute("scopeName", viewData.scopeName());
        model.addAttribute("scopeLabel", viewData.scopeLabel());
        model.addAttribute("scopeDescription", viewData.description());
        model.addAttribute("backUrl", "/photo-album?scopeType=" + normalizedType + "&scopeId=" + scopeId);
        model.addAttribute("selectedAlbumId", albumId);
        model.addAttribute("defaultMoyoPublic", moyoPublic);
        model.addAttribute("currentUserId", user.getUserId());
        addPhotoShareModel(model, user.getUserId());
        model.addAttribute("photoShareList", List.of());
        return "photo/photoPostForm";
    }

    @GetMapping("/photo-post/detail")
    public String detailPostPage(@RequestParam("postId") Long postId,
                                 HttpSession session) {
        return redirectToPostDetail(postId, session);
    }

    @GetMapping("/photo-post/detail/{postId}")
    public String detailPostPath(@PathVariable("postId") Long postId,
                                 HttpSession session) {
        return redirectToPostDetail(postId, session);
    }

    private String redirectToPostDetail(Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return "redirect:/login";
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return "redirect:/";

        String scopeType = normalizeScopeType(string(value(post, "scopeType", "SCOPE_TYPE")));
        Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        if (scopeId == null) return "redirect:/";

        // 친구의 MOYO 공개 사진은 게시물 조회 권한은 있지만, 친구의 개인 사진첩 페이지 자체에는 접근할 수 없다.
        // 그래서 상세 URL은 현재 사용자의 개인 사진첩으로 열고 postId만 넘겨서 라이트박스를 띄운다.
        if ("PERSONAL".equals(scopeType) && !scopeId.equals(user.getUserId())) {
            scopeId = user.getUserId();
        }

        return "redirect:/photo-album?scopeType=" + scopeType + "&scopeId=" + scopeId + "&postId=" + postId;
    }

    @GetMapping("/photo-post/edit/{postId}")
    public String editPostPage(@PathVariable("postId") Long postId,
                               HttpSession session,
                               Model model) {
        usersDto user = loginUser(session);
        if (user == null) return "redirect:/login";

        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePostEditor(post, session);
        if (denied != null) return "redirect:/";

        String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        ScopeViewData viewData = resolveViewData(normalizeScopeType(scopeType), scopeId, user);
        if (viewData == null) return "redirect:/";

        model.addAttribute("formMode", "edit");
        model.addAttribute("postId", postId);
        model.addAttribute("scopeType", normalizeScopeType(scopeType));
        model.addAttribute("scopeId", scopeId);
        model.addAttribute("scopeName", viewData.scopeName());
        model.addAttribute("scopeLabel", viewData.scopeLabel());
        model.addAttribute("scopeDescription", viewData.description());
        model.addAttribute("backUrl", "/photo-album?scopeType=" + normalizeScopeType(scopeType) + "&scopeId=" + scopeId + "&postId=" + postId);
        model.addAttribute("currentUserId", user.getUserId());
        addPhotoShareModel(model, user.getUserId());
        model.addAttribute("photoShareList", contentShareService.getShares("PHOTO", postId, user.getUserId()));
        return "photo/photoPostForm";
    }

    @GetMapping("/api/photo-albums")
    @ResponseBody
    public ResponseEntity<?> albums(@RequestParam("scopeType") String scopeType,
                                    @RequestParam("scopeId") Long scopeId,
                                    HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        ResponseEntity<?> denied = authorizeScope(scopeType, scopeId, session);
        if (denied != null) return denied;
        return ResponseEntity.ok(
                filterViewableRecordAlbums(
                        photoAlbumService.getAlbums(scopeType, scopeId),
                        user.getUserId()
                )
        );
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
                    scopeType, scopeId, toLong(body.get("parentAlbumId")), string(body.get("albumName")),
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
        return ResponseEntity.ok(Map.of("album", album, "posts", filterViewableRecordPosts(photoAlbumService.getPosts(
                string(value(album, "scopeType", "SCOPE_TYPE")),
                toLong(value(album, "scopeId", "SCOPE_ID")), albumId, user.getUserId()), user.getUserId())));
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


    @PutMapping("/api/photo-albums/{albumId}/parent")
    @ResponseBody
    public ResponseEntity<?> moveAlbum(@PathVariable("albumId") Long albumId,
                                       @RequestBody Map<String, Object> body,
                                       HttpSession session) {
        Map<String, Object> album = photoAlbumService.getAlbum(albumId);
        ResponseEntity<?> denied = authorizeAlbumManager(album, session);
        if (denied != null) return denied;
        try {
            boolean success = photoAlbumService.moveAlbum(albumId, toLong(body.get("parentAlbumId")));
            return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/api/photo-albums/{albumId}")
    @ResponseBody
    public ResponseEntity<?> deleteAlbum(@PathVariable("albumId") Long albumId, HttpSession session) {
        Map<String, Object> album = photoAlbumService.getAlbum(albumId);
        ResponseEntity<?> denied = authorizeAlbumDelete(album, session);
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
        return ResponseEntity.ok(filterViewableRecordPosts(photoAlbumService.getPosts(scopeType, scopeId, albumId, user.getUserId()), user.getUserId()));
    }

    @GetMapping("/api/photo-posts/friend-shares")
    @ResponseBody
    public ResponseEntity<?> friendSharedPosts(@RequestParam("ownerId") Long ownerId,
                                               HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        if (ownerId == null || ownerId <= 0) return error(HttpStatus.BAD_REQUEST, "공유자를 선택해 주세요.");
        return ResponseEntity.ok(Map.of(
                "items",
                filterViewableRecordPosts(photoAlbumService.getFriendSharedPosts(user.getUserId(), ownerId), user.getUserId())
        ));
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
        return ResponseEntity.ok(filterViewableRecordPosts(
                photoAlbumService.getRecentPosts(scopeType, scopeId, limit, user.getUserId()),
                user.getUserId()));
    }

    @GetMapping("/api/photo-posts/trash")
    @ResponseBody
    public ResponseEntity<?> trashPosts(@RequestParam("scopeType") String scopeType,
                                        @RequestParam("scopeId") Long scopeId,
                                        HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        String normalizedType;
        try { normalizedType = normalizeScopeType(scopeType); }
        catch (IllegalArgumentException e) { return error(HttpStatus.BAD_REQUEST, e.getMessage()); }
        ResponseEntity<?> denied = authorizeScope(normalizedType, scopeId, session);
        if (denied != null) return denied;
        List<Map<String, Object>> posts = photoAlbumService.getTrashPosts(normalizedType, scopeId, user.getUserId());
        posts.forEach(post -> addPhotoPermissionFlags(post, user.getUserId()));
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/api/photo-posts/{postId}")
    @ResponseBody
    public ResponseEntity<?> post(@PathVariable("postId") Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        boolean trashPost = false;
        if (post == null) {
            post = photoAlbumService.getTrashPost(postId, user.getUserId());
            trashPost = post != null;
        }
        ResponseEntity<?> denied = trashPost ? authorizePostDelete(post, session) : authorizePost(post, session);
        if (denied != null) return denied;
        addPhotoPermissionFlags(post, user.getUserId());
        List<Map<String, Object>> photos = photoAlbumService.getPostPhotos(postId);
        applySecurePhotoMediaPaths(post, photos);
        return ResponseEntity.ok(Map.of("post", post, "photos", photos));
    }

    @PostMapping("/api/photo-posts")
    @ResponseBody
    public ResponseEntity<?> createPost(@RequestParam("scopeType") String scopeType,
                                        @RequestParam("scopeId") Long scopeId,
                                        @RequestParam(value = "albumId", required = false) Long albumId,
                                        @RequestParam(value = "title", required = false) String title,
                                        @RequestParam(value = "description", required = false) String description,
                                        @RequestParam(value = "visibilityType", required = false) String visibilityType,
                                        @RequestParam(value = "shareTargetType", required = false) List<String> shareTargetTypes,
                                        @RequestParam(value = "shareTargetId", required = false) List<Long> shareTargetIds,
                                        @RequestParam(value = "sharePermissionType", required = false) List<String> sharePermissionTypes,
                                        @RequestPart("files") List<MultipartFile> files,
                                        @RequestPart(value = "rawFiles", required = false) List<MultipartFile> rawFiles,
                                        HttpServletRequest request,
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
            Long recordTargetId = contentRecordDAO.selectRecordTargetIdByPhotoAlbumId(albumId);
            if (recordTargetId != null) {
                try { contentRecordService.getEditableTarget(recordTargetId, user.getUserId()); }
                catch (SecurityException e) { return error(HttpStatus.FORBIDDEN, "이 기록에 사진을 추가할 권한이 없습니다."); }
                long currentSize = java.util.Optional.ofNullable(contentRecordItemDAO.sumActivePhotoSize(recordTargetId)).orElse(0L);
                long incomingSize = files == null ? 0L : files.stream()
                        .filter(file -> file != null && !file.isEmpty())
                        .mapToLong(MultipartFile::getSize)
                        .sum();
                if (currentSize + incomingSize > 100L * 1024L * 1024L) {
                    return error(HttpStatus.BAD_REQUEST, "이 기록에는 사진을 총 100MB까지 업로드할 수 있습니다.");
                }
            }
        }
        try {
            Long postId = photoAlbumService.createPost(scopeType, scopeId, albumId, title, description, visibilityType, files, rawFiles, normalizeEditMetas(request), user.getUserId());
            savePendingPhotoShares(postId, shareTargetTypes, shareTargetIds, sharePermissionTypes, user.getUserId());
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
        ResponseEntity<?> denied = authorizePostEditor(post, session);
        if (denied != null) return denied;
        Long albumId = toLong(body.get("albumId"));
        if (!albumBelongsToPostScope(albumId, post)) {
            return error(HttpStatus.BAD_REQUEST, "현재 공간의 앨범만 선택할 수 있습니다.");
        }
        boolean success = photoAlbumService.updatePost(postId, albumId, string(body.get("title")), string(body.get("description")));
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    @PostMapping("/api/photo-posts/{postId}/edit")
    @ResponseBody
    public ResponseEntity<?> updatePostWithPhotos(@PathVariable("postId") Long postId,
                                                  @RequestParam(value = "albumId", required = false) String albumIdValue,
                                                  @RequestParam(value = "title", required = false) String title,
                                                  @RequestParam(value = "description", required = false) String description,
                                                  @RequestParam(value = "visibilityType", required = false) String visibilityType,
                                                  @RequestPart(value = "files", required = false) List<MultipartFile> files,
                                                  @RequestPart(value = "rawFiles", required = false) List<MultipartFile> rawFiles,
                                                  HttpServletRequest request,
                                                  HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePostEditor(post, session);
        if (denied != null) return denied;

        Long albumId = toLong(albumIdValue);
        if (albumIdValue != null && !albumIdValue.isBlank() && albumId == null) {
            return error(HttpStatus.BAD_REQUEST, "앨범 정보가 올바르지 않습니다.");
        }
        if (!albumBelongsToPostScope(albumId, post)) {
            return error(HttpStatus.BAD_REQUEST, "현재 공간의 앨범만 선택할 수 있습니다.");
        }
        try {
            boolean success = photoAlbumService.updatePostWithPhotos(postId, albumId, title, description, files, rawFiles, normalizeEditMetas(request), user.getUserId());
            if (success && "PERSONAL".equalsIgnoreCase(string(value(post, "scopeType", "SCOPE_TYPE")))) {
                String normalizedVisibility = visibilityType == null ? null : visibilityType.trim().toUpperCase();
                if ("FRIENDS".equals(normalizedVisibility) || "PRIVATE".equals(normalizedVisibility)) {
                    photoAlbumService.updatePostVisibility(postId, normalizedVisibility);
                }
            }
            return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
        } catch (RuntimeException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/api/photo-posts/{postId}/photos/{photoId}/metadata")
    @ResponseBody
    public ResponseEntity<?> updatePhotoMetadata(@PathVariable("postId") Long postId,
                                                 @PathVariable("photoId") Long photoId,
                                                 @RequestBody Map<String, Object> body,
                                                 HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePostEditor(post, session);
        if (denied != null) return denied;

        Map<String, Object> photo = photoAlbumService.getPhoto(photoId);
        if (photo == null || !postId.equals(toLong(value(photo, "postId", "POST_ID")))) {
            return error(HttpStatus.NOT_FOUND, "사진 정보를 찾을 수 없습니다.");
        }
        try {
            Map<String, Object> updated = photoAlbumService.updatePhotoMetadata(photoId, body == null ? Map.of() : body);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "photo", updated == null ? Map.of() : updated));
        } catch (RuntimeException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/api/photo-posts/{postId}/album")
    @ResponseBody
    public ResponseEntity<?> movePostAlbum(@PathVariable("postId") Long postId,
                                           @RequestBody Map<String, Object> body,
                                           HttpSession session) {
        Map<String, Object> post = photoAlbumService.getPost(postId);
        ResponseEntity<?> denied = authorizePostMover(post, session);
        if (denied != null) return denied;

        Long albumId = toLong(body.get("albumId"));
        if (!albumBelongsToPostScope(albumId, post)) {
            return error(HttpStatus.BAD_REQUEST, "현재 공간의 앨범으로만 이동할 수 있습니다.");
        }

        boolean success = photoAlbumService.movePostAlbum(postId, albumId);
        int recordLinkedCount = 0;
        if (success) {
            recordLinkedCount = contentRecordItemDAO.countActiveItemsByContent("PHOTO", postId);
            if (recordLinkedCount > 0) {
                // 앨범 위치와 기록 연결은 별개다. 이동해도 기록 항목 연결은 유지한다.
                contentRecordItemDAO.touchActiveItemsByContent("PHOTO", postId);
            }
        }
        return ResponseEntity.ok(Map.of(
                "status", success ? "SUCCESS" : "FAIL",
                "recordLinkedCount", recordLinkedCount,
                "recordLinkPreserved", success));
    }

    @PutMapping("/api/photo-posts/{postId}/visibility")
    @ResponseBody
    public ResponseEntity<?> updatePostVisibility(@PathVariable("postId") Long postId,
                                                  @RequestBody Map<String, Object> body,
                                                  HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;

        String postScopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long creatorId = toLong(value(post, "createdBy", "CREATED_BY"));
        Long postScopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        if (!canUsePhotoFriendShareScope(postScopeType, postScopeId)) {
            return error(HttpStatus.BAD_REQUEST, "개인 영역의 사진만 MOYO 공개 여부를 변경할 수 있습니다.");
        }
        if (!user.getUserId().equals(creatorId)) {
            return error(HttpStatus.FORBIDDEN, "작성자만 공개 여부를 변경할 수 있습니다.");
        }

        String visibilityType = string(body.get("visibilityType"));
        String normalized = visibilityType == null ? "PRIVATE" : visibilityType.trim().toUpperCase();
        if (!"PRIVATE".equals(normalized) && !"FRIENDS".equals(normalized)) {
            return error(HttpStatus.BAD_REQUEST, "지원하지 않는 공개 설정입니다.");
        }

        boolean success = photoAlbumService.updatePostVisibility(postId, normalized);
        Map<String, Object> updatedPost = success ? photoAlbumService.getPost(postId, user.getUserId()) : post;
        addPhotoPermissionFlags(updatedPost, user.getUserId());
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL", "post", updatedPost));
    }


    @PostMapping("/api/photo-posts/{postId}/send")
    @ResponseBody
    public ResponseEntity<?> sendPublicPostToFriends(@PathVariable("postId") Long postId,
                                                     @RequestBody(required = false) Map<String, Object> body,
                                                     HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;

        String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        String visibilityType = string(value(post, "visibilityType", "VISIBILITY_TYPE"));
        Long sendScopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        if (!canUsePhotoFriendShareScope(scopeType, sendScopeId) || !"FRIENDS".equalsIgnoreCase(visibilityType)) {
            return error(HttpStatus.BAD_REQUEST, "MOYO 공개 사진만 친구에게 보낼 수 있습니다.");
        }

        Object rawIds = body == null ? null : body.get("targetUserIds");
        if (!(rawIds instanceof List<?> rawList) || rawList.isEmpty()) {
            return error(HttpStatus.BAD_REQUEST, "보낼 친구를 선택해 주세요.");
        }

        List<Long> targetUserIds = new ArrayList<>();
        for (Object rawId : rawList) {
            Long targetUserId = toLong(rawId);
            if (targetUserId == null || targetUserId.equals(user.getUserId()) || targetUserIds.contains(targetUserId)) continue;
            targetUserIds.add(targetUserId);
            if (targetUserIds.size() >= 100) break;
        }
        if (targetUserIds.isEmpty()) {
            return error(HttpStatus.BAD_REQUEST, "보낼 친구를 선택해 주세요.");
        }

        if (runtimeDdlEnabled) {
            try {
                userNoticeDAO.ensureUserNoticeCommonColumns();
            } catch (Exception ignored) {
                // local 개발 DB의 호환 컬럼 보정 실패는 기존 흐름대로 무시합니다.
            }
        }

        String senderName = user.getUserName() == null || user.getUserName().isBlank() ? "친구" : user.getUserName().trim();
        String description = string(value(post, "description", "DESCRIPTION"));
        String content = description == null || description.isBlank()
                ? "MOYO 공개 사진을 확인해보세요."
                : description.trim();
        if (content.length() > 500) content = content.substring(0, 500);
        Long creatorId = toLong(value(post, "createdBy", "CREATED_BY"));
        String linkUrl = creatorId == null
                ? "/photo-post/detail/" + postId
                : "/users/profile?userId=" + creatorId + "&openPhotoId=" + postId;

        int sentCount = 0;
        for (Long targetUserId : targetUserIds) {
            friendDTO relation = friendDAO.selectRelation(user.getUserId(), targetUserId);
            if (relation == null || !"ACCEPTED".equalsIgnoreCase(relation.getStatus())) continue;
            userNoticeDAO.insertPhotoSendAlarm(
                    targetUserId,
                    postId,
                    senderName + "님이 사진을 보냈습니다.",
                    content,
                    linkUrl
            );
            sentCount++;
        }

        if (sentCount == 0) {
            return error(HttpStatus.BAD_REQUEST, "보낼 수 있는 친구를 찾지 못했습니다.");
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "sentCount", sentCount));
    }


    @PostMapping("/api/photo-posts/{postId}/collect")
    @ResponseBody
    public ResponseEntity<?> collectPost(@PathVariable("postId") Long postId,
                                         @RequestBody(required = false) Map<String, Object> body,
                                         HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;

        Long creatorId = toLong(value(post, "userId", "USER_ID"));
        if (creatorId == null) {
            return error(HttpStatus.BAD_REQUEST, "작성자 정보를 확인할 수 없습니다.");
        }
        if (user.getUserId().equals(creatorId)) {
            return error(HttpStatus.BAD_REQUEST, "내가 올린 사진은 이미 내 사진첩에 있습니다.");
        }

        String collectScopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        String collectVisibilityType = string(value(post, "visibilityType", "VISIBILITY_TYPE"));
        Long collectScopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        if (!canUsePhotoFriendShareScope(collectScopeType, collectScopeId)
                || !"FRIENDS".equalsIgnoreCase(collectVisibilityType)) {
            return error(HttpStatus.BAD_REQUEST, "MOYO 공개된 사진만 담을 수 있습니다.");
        }

        Long albumId = body == null ? null : toLong(body.get("albumId"));
        if (albumId != null) {
            Map<String, Object> album = photoAlbumService.getAlbum(albumId);
            if (album == null
                    || !"PERSONAL".equalsIgnoreCase(string(value(album, "scopeType", "SCOPE_TYPE")))
                    || !user.getUserId().equals(toLong(value(album, "scopeId", "SCOPE_ID")))) {
                return error(HttpStatus.BAD_REQUEST, "내 개인 앨범으로만 담아갈 수 있습니다.");
            }
        }

        try {
            Long collectedPostId = photoAlbumService.collectPost(postId, albumId, user.getUserId());
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "postId", collectedPostId,
                    "comments", photoAlbumService.getPostComments(postId, user.getUserId())
            ));
        } catch (RuntimeException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/api/photo-posts/{postId}/collect")
    @ResponseBody
    public ResponseEntity<?> cancelCollectPost(@PathVariable("postId") Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");

        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;

        Long creatorId = toLong(value(post, "userId", "USER_ID"));
        if (creatorId != null && user.getUserId().equals(creatorId)) {
            return error(HttpStatus.BAD_REQUEST, "내가 올린 사진은 담아가기 대상이 아닙니다.");
        }

        boolean success = photoAlbumService.cancelCollectPost(postId, user.getUserId());
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }


    @DeleteMapping("/api/photo-posts/{postId}")
    @ResponseBody
    public ResponseEntity<?> deletePost(@PathVariable("postId") Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePostDelete(post, session);
        if (denied != null) return denied;
        boolean success = photoAlbumService.movePostToTrash(postId, user.getUserId());
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    @PostMapping("/api/photo-posts/{postId}/restore")
    @ResponseBody
    public ResponseEntity<?> restorePost(@PathVariable("postId") Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getTrashPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePostDelete(post, session);
        if (denied != null) return denied;
        boolean success = photoAlbumService.restorePostFromTrash(postId, user.getUserId());
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    @DeleteMapping("/api/photo-posts/{postId}/permanent")
    @ResponseBody
    public ResponseEntity<?> permanentlyDeletePost(@PathVariable("postId") Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getTrashPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePostDelete(post, session);
        if (denied != null) return denied;
        if (!photoAlbumService.canPermanentlyDeletePost(postId, user.getUserId())) {
            return error(HttpStatus.FORBIDDEN, "영구 삭제할 권한이 없습니다.");
        }
        boolean success = photoAlbumService.permanentlyDeletePost(postId, user.getUserId());
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }


    @GetMapping("/api/photo-posts/{postId}/comments")
    @ResponseBody
    public ResponseEntity<?> postComments(@PathVariable("postId") Long postId, HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        return ResponseEntity.ok(photoAlbumService.getPostComments(postId, user.getUserId()));
    }

    @PostMapping("/api/photo-posts/{postId}/comments")
    @ResponseBody
    public ResponseEntity<?> createPostComment(@PathVariable("postId") Long postId,
                                               @RequestBody Map<String, Object> body,
                                               HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        try {
            Long parentCommentId = toLong(body.get("parentCommentId"));
            Long commentId = photoAlbumService.createPostComment(postId, parentCommentId, string(body.get("content")), user.getUserId());
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "commentId", commentId,
                    "comments", photoAlbumService.getPostComments(postId, user.getUserId())
            ));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/api/photo-posts/{postId}/comments/{commentId}")
    @ResponseBody
    public ResponseEntity<?> updatePostComment(@PathVariable("postId") Long postId,
                                               @PathVariable("commentId") Long commentId,
                                               @RequestBody Map<String, Object> body,
                                               HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        try {
            boolean success = photoAlbumService.updatePostComment(postId, commentId, string(body.get("content")), user.getUserId());
            return ResponseEntity.ok(Map.of(
                    "status", success ? "SUCCESS" : "FAIL",
                    "comments", photoAlbumService.getPostComments(postId, user.getUserId())
            ));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/api/photo-posts/{postId}/comments/{commentId}")
    @ResponseBody
    public ResponseEntity<?> deletePostComment(@PathVariable("postId") Long postId,
                                               @PathVariable("commentId") Long commentId,
                                               HttpSession session) {
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Map<String, Object> post = photoAlbumService.getPost(postId, user.getUserId());
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        boolean isCreator = user.getUserId().equals(toLong(value(post, "createdBy", "CREATED_BY")));
        boolean isAdmin = canManageScope(scopeType, scopeId, user.getUserId());
        boolean success = photoAlbumService.deletePostComment(postId, commentId, user.getUserId(), isCreator || isAdmin);
        return ResponseEntity.ok(Map.of(
                "status", success ? "SUCCESS" : "FAIL",
                "comments", photoAlbumService.getPostComments(postId, user.getUserId())
        ));
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


    private void savePendingPhotoShares(Long postId, List<String> targetTypes, List<Long> targetIds,
                                        List<String> permissionTypes, Long userId) {
        if (postId == null || targetTypes == null || targetIds == null || userId == null) return;
        int size = Math.min(targetTypes.size(), targetIds.size());
        for (int i = 0; i < size; i++) {
            String targetType = targetTypes.get(i);
            Long targetId = targetIds.get(i);
            if (targetType == null || targetId == null) continue;
            contentShareDTO share = new contentShareDTO();
            share.setContentType("PHOTO");
            share.setContentId(postId);
            share.setTargetType(targetType);
            share.setTargetId(targetId);
            share.setPermissionType("VIEW");
            contentShareService.saveShare(share, userId);
        }
    }

    private void addPhotoShareModel(Model model, Long userId) {
        List<Map<String, Object>> workspaceList = normalizeWorkspaceRows(noteFolderDAO.selectAccessibleWorkspaces(userId));
        List<Map<String, Object>> projectList = normalizeProjectRows(noteFolderDAO.selectAccessibleProjects(userId));
        List<Map<String, Object>> workspaceMemberList = normalizeWorkspaceMemberRows(noteFolderDAO.selectShareWorkspaceMembers(userId));
        List<Map<String, Object>> projectMemberList = normalizeProjectMemberRows(noteFolderDAO.selectShareProjectMembers(userId));
        model.addAttribute("photoWorkspaceList", workspaceList);
        model.addAttribute("photoProjectList", projectList);
        model.addAttribute("photoWorkspaceMemberList", workspaceMemberList);
        model.addAttribute("photoProjectMemberList", projectMemberList);
    }

    private List<Map<String, Object>> normalizeWorkspaceRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("wsImagePath", firstMapValue(row, "wsImagePath", "WS_IMAGE_PATH", "WSIMAGEPATH"));
            item.put("canManage", firstMapValue(row, "canManage", "CAN_MANAGE", "CANMANAGE"));
            if (item.get("wsId") != null) result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> normalizeProjectRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("projId", firstMapValue(row, "projId", "PROJ_ID", "PROJID"));
            item.put("projName", firstMapValue(row, "projName", "PROJ_NAME", "PROJNAME"));
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("canManage", firstMapValue(row, "canManage", "CAN_MANAGE", "CANMANAGE"));
            if (item.get("projId") != null) result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> normalizeWorkspaceMemberRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("userId", firstMapValue(row, "userId", "USER_ID", "USERID"));
            item.put("userName", firstMapValue(row, "userName", "USER_NAME", "USERNAME"));
            item.put("email", firstMapValue(row, "email", "EMAIL"));
            item.put("profileImagePath", firstMapValue(row, "profileImagePath", "PROFILE_IMAGE_PATH", "PROFILEIMAGEPATH"));
            item.put("roleName", firstMapValue(row, "roleName", "ROLE_NAME", "ROLENAME", "WS_ROLE"));
            if (item.get("wsId") != null && item.get("userId") != null) result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> normalizeProjectMemberRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("projId", firstMapValue(row, "projId", "PROJ_ID", "PROJID"));
            item.put("projName", firstMapValue(row, "projName", "PROJ_NAME", "PROJNAME"));
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("userId", firstMapValue(row, "userId", "USER_ID", "USERID"));
            item.put("userName", firstMapValue(row, "userName", "USER_NAME", "USERNAME"));
            item.put("email", firstMapValue(row, "email", "EMAIL"));
            item.put("profileImagePath", firstMapValue(row, "profileImagePath", "PROFILE_IMAGE_PATH", "PROFILEIMAGEPATH"));
            item.put("roleName", firstMapValue(row, "roleName", "ROLE_NAME", "ROLENAME", "PROJ_ROLE"));
            if (item.get("projId") != null && item.get("userId") != null) result.add(item);
        }
        return result;
    }

    private Object firstMapValue(Map<String, Object> row, String... keys) {
        if (row == null) return null;
        for (String key : keys) {
            if (row.containsKey(key) && row.get(key) != null) return row.get(key);
        }
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (entry.getKey() == null || entry.getValue() == null) continue;
            String normalized = entry.getKey().replace("_", "").toLowerCase(Locale.ROOT);
            for (String key : keys) {
                if (normalized.equals(key.replace("_", "").toLowerCase(Locale.ROOT))) return entry.getValue();
            }
        }
        return null;
    }

    private void addPhotoPermissionFlags(Map<String, Object> post, Long userId) {
        if (post == null || userId == null) return;
        String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        Long ownerId = toLong(firstMapValue(post, "createdBy", "CREATED_BY", "userId", "USER_ID"));
        Long postId = toLong(value(post, "postId", "POST_ID"));
        boolean isCreator = userId.equals(ownerId);
        boolean isScopeManager = canManageScope(scopeType, scopeId, userId);
        boolean deleted = "Y".equalsIgnoreCase(string(value(post, "deletedYn", "DELETED_YN")));
        String normalizedScope;
        try { normalizedScope = normalizeScopeType(scopeType); }
        catch (IllegalArgumentException e) { normalizedScope = ""; }

        boolean canEdit = !deleted && postId != null && contentShareService.canEdit("PHOTO", postId, userId);
        boolean canMoveAlbum = !deleted && (isCreator || isScopeManager);
        boolean canDelete = isCreator || isScopeManager;
        boolean canToggleVisibility = !deleted && isCreator && canUsePhotoFriendShareScope(normalizedScope, scopeId);
        // 개인 영역은 친구 공유, 그룹/그룹 프로젝트는 현재 멤버 접근·편집 권한 관리로 같은 버튼을 사용한다.
        boolean canShare = !deleted && isCreator;

        post.put("canManage", canEdit || canMoveAlbum || canDelete);
        post.put("canEdit", !deleted && canEdit);
        post.put("canDelete", !deleted && canDelete);
        post.put("canMoveAlbum", canMoveAlbum);
        post.put("canRestore", deleted && canDelete);
        post.put("canPermanentDelete", deleted && canDelete);
        post.put("canToggleVisibility", canToggleVisibility);
        post.put("canShare", canShare);
    }

    private List<Map<String, Object>> filterViewableRecordAlbums(List<Map<String, Object>> albums, Long userId) {
        if (albums == null || albums.isEmpty()) return albums;
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> album : albums) {
            Long albumId = toLong(value(album, "albumId", "ALBUM_ID"));
            Long targetId = albumId == null ? null : contentRecordDAO.selectRecordTargetIdByPhotoAlbumId(albumId);
            if (targetId == null || canViewRecordTarget(targetId, userId)) result.add(album);
        }
        return result;
    }

    private List<Map<String, Object>> filterViewableRecordPosts(List<Map<String, Object>> posts, Long userId) {
        if (posts == null || posts.isEmpty()) return posts;
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> post : posts) {
            Long postId = toLong(value(post, "postId", "POST_ID"));
            if (postId == null) continue;
            Long targetId = contentRecordDAO.selectRecordTargetIdByPhotoPostId(postId);
            if (targetId != null) {
                if (canViewRecordTarget(targetId, userId)) result.add(post);
                continue;
            }
            if (contentShareService.canRead("PHOTO", postId, userId)) {
                result.add(post);
                continue;
            }
            String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
            String visibilityType = string(value(post, "visibilityType", "VISIBILITY_TYPE"));
            Long ownerId = toLong(value(post, "createdBy", "CREATED_BY"));
            // 개인 사진의 FRIENDS는 MOYO 공개이며 ACCEPTED 친구에게만 노출한다.
            if ("PERSONAL".equalsIgnoreCase(scopeType)
                    && "FRIENDS".equalsIgnoreCase(visibilityType)
                    && isAcceptedFriend(ownerId, userId)) {
                result.add(post);
            }
        }
        return result;
    }


    private boolean canViewRecordTarget(Long recordTargetId, Long userId) {
        try { contentRecordService.getViewableTarget(recordTargetId, userId); return true; }
        catch (RuntimeException e) { return false; }
    }

    private ResponseEntity<?> authorizeRecordTarget(Long recordTargetId, Long userId, String action) {
        if (recordTargetId == null) return null;
        try {
            if ("EDIT".equals(action)) contentRecordService.getEditableTarget(recordTargetId, userId);
            else if ("DELETE".equals(action)) contentRecordService.getDeletableTarget(recordTargetId, userId);
            else contentRecordService.getViewableTarget(recordTargetId, userId);
            return null;
        } catch (SecurityException e) {
            return error(HttpStatus.FORBIDDEN, "이 기록 사진에 접근할 권한이 없습니다.");
        }
    }

    private ResponseEntity<?> authorizePost(Map<String, Object> post, HttpSession session) {
        if (post == null) return error(HttpStatus.NOT_FOUND, "사진 게시물을 찾을 수 없습니다.");
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Long linkedTargetId = contentRecordDAO.selectRecordTargetIdByPhotoPostId(toLong(value(post, "postId", "POST_ID")));
        if (linkedTargetId != null) return authorizeRecordTarget(linkedTargetId, user.getUserId(), "VIEW");
        String postScopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long postScopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        Long postId = toLong(value(post, "postId", "POST_ID"));
        if (contentShareService.canRead("PHOTO", postId, user.getUserId())) return null;
        String visibilityType = string(value(post, "visibilityType", "VISIBILITY_TYPE"));
        Long ownerId = toLong(value(post, "createdBy", "CREATED_BY"));
        // 개인 사진의 FRIENDS는 MOYO 공개이며 ACCEPTED 친구에게만 노출한다.
        // 특정 사용자 직접 공유는 위 contentShareService.canRead(...)에서 별도로 허용한다.
        String creatorStatus = string(value(post, "creatorStatus", "CREATOR_STATUS"));
        if ("PERSONAL".equalsIgnoreCase(postScopeType)
                && "FRIENDS".equalsIgnoreCase(visibilityType)
                && "ACTIVE".equalsIgnoreCase(creatorStatus)
                && isAcceptedFriend(ownerId, user.getUserId())) {
            return null;
        }
        return error(HttpStatus.FORBIDDEN, "이 사진에 접근할 권한이 없습니다.");
    }

    private ResponseEntity<?> authorizePostEditor(Map<String, Object> post, HttpSession session) {
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        usersDto user = loginUser(session);
        Long linkedTargetId = contentRecordDAO.selectRecordTargetIdByPhotoPostId(toLong(value(post, "postId", "POST_ID")));
        if (linkedTargetId != null) return authorizeRecordTarget(linkedTargetId, user.getUserId(), "EDIT");
        Long postId = toLong(value(post, "postId", "POST_ID"));
        return postId != null && contentShareService.canEdit("PHOTO", postId, user.getUserId())
                ? null : error(HttpStatus.FORBIDDEN, "사진을 편집할 권한이 없습니다.");
    }

    private ResponseEntity<?> authorizePostMover(Map<String, Object> post, HttpSession session) {
        ResponseEntity<?> denied = authorizePost(post, session);
        if (denied != null) return denied;
        usersDto user = loginUser(session);
        Long linkedTargetId = contentRecordDAO.selectRecordTargetIdByPhotoPostId(toLong(value(post, "postId", "POST_ID")));
        if (linkedTargetId != null) return authorizeRecordTarget(linkedTargetId, user.getUserId(), "EDIT");
        String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        boolean isCreator = user.getUserId().equals(toLong(value(post, "createdBy", "CREATED_BY")));
        boolean isAdmin = canManageScope(scopeType, scopeId, user.getUserId());
        return isCreator || isAdmin ? null : error(HttpStatus.FORBIDDEN, "사진을 이동할 권한이 없습니다.");
    }

    private ResponseEntity<?> authorizePostDelete(Map<String, Object> post, HttpSession session) {
        if (post == null) return error(HttpStatus.NOT_FOUND, "사진 게시물을 찾을 수 없습니다.");
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Long linkedTargetId = contentRecordDAO.selectRecordTargetIdByPhotoPostId(toLong(value(post, "postId", "POST_ID")));
        if (linkedTargetId != null) return authorizeRecordTarget(linkedTargetId, user.getUserId(), "DELETE");
        String scopeType = string(value(post, "scopeType", "SCOPE_TYPE"));
        Long scopeId = toLong(value(post, "scopeId", "SCOPE_ID"));
        boolean isCreator = user.getUserId().equals(toLong(value(post, "createdBy", "CREATED_BY")));
        boolean isAdmin = canManageScope(scopeType, scopeId, user.getUserId());
        return isCreator || isAdmin ? null : error(HttpStatus.FORBIDDEN, "사진을 삭제할 권한이 없습니다.");
    }

    private ResponseEntity<?> authorizeAlbum(Map<String, Object> album, HttpSession session) {
        if (album == null) return error(HttpStatus.NOT_FOUND, "앨범을 찾을 수 없습니다.");
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Long linkedTargetId = contentRecordDAO.selectRecordTargetIdByPhotoAlbumId(toLong(value(album, "albumId", "ALBUM_ID")));
        if (linkedTargetId != null) return authorizeRecordTarget(linkedTargetId, user.getUserId(), "VIEW");
        return authorizeScope(string(value(album, "scopeType", "SCOPE_TYPE")),
                toLong(value(album, "scopeId", "SCOPE_ID")), session);
    }

    private ResponseEntity<?> authorizeAlbumDelete(Map<String, Object> album, HttpSession session) {
        if (album == null) return error(HttpStatus.NOT_FOUND, "앨범을 찾을 수 없습니다.");
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Long linkedTargetId = contentRecordDAO.selectRecordTargetIdByPhotoAlbumId(toLong(value(album, "albumId", "ALBUM_ID")));
        if (linkedTargetId != null) return authorizeRecordTarget(linkedTargetId, user.getUserId(), "DELETE");
        return authorizeAlbumManager(album, session);
    }

    private ResponseEntity<?> authorizeAlbumManager(Map<String, Object> album, HttpSession session) {
        if (album == null) return error(HttpStatus.NOT_FOUND, "앨범을 찾을 수 없습니다.");
        usersDto user = loginUser(session);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Long linkedTargetId = contentRecordDAO.selectRecordTargetIdByPhotoAlbumId(toLong(value(album, "albumId", "ALBUM_ID")));
        if (linkedTargetId != null) return authorizeRecordTarget(linkedTargetId, user.getUserId(), "EDIT");

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

    private boolean isAcceptedFriend(Long ownerId, Long userId) {
        if (ownerId == null || userId == null || ownerId.equals(userId)) return false;
        friendDTO relation = friendDAO.selectRelation(userId, ownerId);
        return relation != null && "ACCEPTED".equalsIgnoreCase(relation.getStatus());
    }

    private boolean canUsePhotoFriendShareScope(String scopeType, Long scopeId) {
        String type;
        try { type = normalizeScopeType(scopeType); }
        catch (IllegalArgumentException e) { return false; }
        if ("PERSONAL".equals(type)) return true;
        if (!"PROJECT".equals(type) || scopeId == null) return false;
        projectRequestDTO project = projectService.getProjectById(scopeId);
        return project != null && project.getWsId() == null;
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
        if (projId == null || userId == null) return false;

        // 개인 프로젝트는 별도의 멤버 행이 없을 수 있으므로 프로젝트 소유자도 접근 주체로 인정한다.
        projectRequestDTO project = projectService.getProjectById(projId);
        if (project != null && userId.equals(project.getLeaderId())) return true;

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
                    user.getUserName() + "의 공간", "개인 사진첩",
                    "MOYO 피드와 최근, 개인, 친구, 그룹, 프로젝트 사진을 한 곳에서 모아 관리합니다.", "/");
            case "WORKSPACE" -> workspaceViewData(scopeId);
            case "PROJECT" -> projectViewData(scopeId);
            default -> null;
        };
    }

    private ScopeViewData workspaceViewData(Long wsId) {
        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return null;
        return new ScopeViewData(workspace.getWsName(), "그룹 사진첩",
                "그룹 구성원이 함께 볼 사진과 활동 기록을 앨범으로 정리하고 확인하세요.",
                "/workspace/main?wsId=" + wsId);
    }

    private ScopeViewData projectViewData(Long projId) {
        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) return null;
        return new ScopeViewData(project.getProjName(), "프로젝트 사진첩",
                "프로젝트 진행 과정과 결과물을 사진으로 남기고 팀원과 함께 관리하세요.",
                "/project/main?projId=" + projId + "&wsId=" + project.getWsId());
    }

    private List<String> normalizeEditMetas(HttpServletRequest request) {
        if (request == null) return List.of();

        // 가장 안전한 경로: JSON 문자열을 Base64로 받아 콤마/따옴표/중괄호가
        // Spring 파라미터 바인딩 과정에서 잘리는 문제를 원천 차단한다.
        List<String> encodedValues = collectDecodedBase64Values(request, "editMetaB64");
        if (!encodedValues.isEmpty()) return encodedValues;

        List<String> values = new ArrayList<>();
        collectRequestValues(request, values, "editMetas");
        if (values.isEmpty()) collectRequestValues(request, values, "editMeta");
        if (values.isEmpty()) collectRequestValues(request, values, "photoEditMetas");
        if (values.isEmpty()) collectRequestValues(request, values, "photoEditMeta");

        if (values.size() == 1 && values.get(0).trim().startsWith("[")) {
            List<String> flattened = flattenEditMetaArray(values.get(0));
            if (!flattened.isEmpty()) return flattened;
        }
        return values;
    }

    private List<String> collectDecodedBase64Values(HttpServletRequest request, String name) {
        List<String> values = new ArrayList<>();
        String[] found = request.getParameterValues(name);
        if (found == null) return values;
        for (String value : found) {
            if (value == null || value.isBlank()) continue;
            try {
                String decoded = new String(Base64.getDecoder().decode(value.trim()), StandardCharsets.UTF_8);
                if (!decoded.isBlank()) values.add(decoded);
            } catch (IllegalArgumentException ignored) {
                // 잘못된 값은 무시하고 기존 fallback 파라미터로 넘어간다.
            }
        }
        return values;
    }

    private void collectRequestValues(HttpServletRequest request, List<String> values, String name) {
        String[] found = request.getParameterValues(name);
        if (found == null) return;
        for (String value : found) {
            if (value != null && !value.isBlank()) values.add(value);
        }
    }

    private List<String> flattenEditMetaArray(String json) {
        try {
            List<Object> items = PHOTO_EDIT_META_MAPPER.readValue(json, new TypeReference<List<Object>>() {});
            List<String> result = new ArrayList<>();
            for (Object item : items) {
                if (item == null) continue;
                result.add(PHOTO_EDIT_META_MAPPER.writeValueAsString(item));
            }
            return result;
        } catch (JsonProcessingException e) {
            return List.of();
        }
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


    private void applySecurePhotoMediaPaths(Map<String, Object> post, List<Map<String, Object>> photos) {
        Long firstPhotoId = null;
        if (photos != null) {
            for (Map<String, Object> photo : photos) {
                if (photo == null) continue;
                Long photoId = toLong(value(photo, "photoId", "PHOTO_ID"));
                if (photoId == null) continue;
                if (firstPhotoId == null) firstPhotoId = photoId;
                String mediaPath = "/photo/media/" + photoId;
                photo.put("FILE_PATH", mediaPath);
                photo.put("filePath", mediaPath);
            }
        }

        if (post == null) return;
        Long coverPhotoId = toLong(value(post, "coverPhotoId", "COVER_PHOTO_ID"));
        if (coverPhotoId == null) coverPhotoId = firstPhotoId;
        if (coverPhotoId == null) return;
        String coverMediaPath = "/photo/media/" + coverPhotoId;
        post.put("COVER_PATH", coverMediaPath);
        post.put("coverPath", coverMediaPath);
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
