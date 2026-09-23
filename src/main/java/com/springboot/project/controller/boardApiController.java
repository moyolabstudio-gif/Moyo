package com.springboot.project.controller;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Locale;
import java.util.Set;
import jakarta.servlet.http.HttpSession;
import com.springboot.project.dto.usersDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.postDTO;
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.service.IboardService;
import com.springboot.project.service.IcontentFileService;
import com.springboot.project.service.BoardAuthorizationService;
import com.springboot.project.service.UploadSecurityService;

@RestController
@RequestMapping("/api/workspace")
public class boardApiController {

    @Autowired
    private IboardService iboardService;

    @Autowired
    private IworkspaceDAO workspaceDAO;

    @Autowired
    private IcontentFileService contentFileService;

    @Autowired
    private BoardAuthorizationService boardAuthorizationService;
    
    @Autowired
    private UploadSecurityService uploadSecurityService;


    @Value("${moyo.upload.board-editor-dir:C:/uploads/editor/}")
    private String boardEditorUploadDir;

    /**
     * 📢 대시보드 진입 시 공지사항 및 자유게시판 최신글 3개를 비동기로 반환하는 API
     * 브라우저 호출 주소: /api/workspace/{wsId}/dashboard-widgets
     */
    @GetMapping("/{wsId}/dashboard-widgets")
    public ResponseEntity<Map<String, Object>> getDashboardWidgets(
            @PathVariable("wsId") Long wsId,
            HttpSession session) {
        ResponseEntity<Map<String, Object>> denied = authorizeWorkspaceMember(wsId, session);
        if (denied != null) return denied;

        Map<String, Object> response = new HashMap<>();
        Long userId = ((usersDto) session.getAttribute("user")).getUserId();

        // 한 게시판/자료실 조회 오류가 대시보드 전체를 500으로 만들지 않도록 각각 격리한다.
        try {
            List<postDTO> notices = iboardService.getDashboardLatest(wsId, "NOTICE");
            response.put("notices", notices == null ? List.of() : notices);
        } catch (Exception e) {
            System.err.println("[그룹 메인] 공지 위젯 조회 실패 wsId=" + wsId + " : " + e.getMessage());
            response.put("notices", List.of());
        }

        try {
            List<postDTO> freeBoards = iboardService.getDashboardLatest(wsId, "FREE");
            response.put("freeBoards", freeBoards == null ? List.of() : freeBoards);
        } catch (Exception e) {
            System.err.println("[그룹 메인] 자유피드 위젯 조회 실패 wsId=" + wsId + " : " + e.getMessage());
            response.put("freeBoards", List.of());
        }

        try {
            var files = contentFileService.getDashboardLatestFiles("GROUP", wsId, null, 3, userId);
            response.put("files", files == null ? List.of() : files);
        } catch (Exception e) {
            System.err.println("[그룹 메인] 자료실 위젯 조회 실패 wsId=" + wsId + " : " + e.getMessage());
            response.put("files", List.of());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 💬 댓글 등록 API (기존 유지)
     */
    @PostMapping("/{wsId}/board/reply")
    public ResponseEntity<Map<String, Object>> registerReply(
            @PathVariable("wsId") Long wsId,
            @RequestBody Map<String, Object> replyData,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        }
        Long postId = toLongValue(replyData.get("postId"));
        if (!boardAuthorizationService.canViewPost(postId, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }
        postDTO targetPost = boardAuthorizationService.getPost(postId);
        if (targetPost == null || targetPost.getWsId() == null || !targetPost.getWsId().equals(wsId)) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }
        replyData.put("userId", loginUser.getUserId());

        try {
            boolean isSuccess = iboardService.registerReply(replyData);
            
            Map<String, Object> response = new HashMap<>();
            if(isSuccess) {
                response.put("status", "SUCCESS");
            } else {
                response.put("status", "FAIL");
            }
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID_INPUT", "message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("에러 발생 원인: " + e.getMessage());
            e.printStackTrace(); 
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
 // 1. 댓글 수정 API
    @PutMapping("/{wsId}/board/reply/modify")
    public ResponseEntity<?> modifyReply(@PathVariable("wsId") Long wsId,
                                         @RequestBody Map<String, Object> replyData,
                                         HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        Long replyId = toLongValue(replyData.get("replyId"));
        if (!boardAuthorizationService.canEditReply(replyId, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }
        try {
            boolean success = iboardService.modifyReply(replyData);
            return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID_INPUT", "message", e.getMessage()));
        }
    }

    // 2. 댓글 삭제 API
    @DeleteMapping("/{wsId}/board/reply/{replyId}")
    public ResponseEntity<?> removeReply(@PathVariable("wsId") Long wsId,
                                         @PathVariable("replyId") int replyId,
                                         HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        if (!boardAuthorizationService.canDeleteReply((long) replyId, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }
        boolean success = iboardService.removeReply(replyId);
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }
    @GetMapping("/{wsId}/board/{postId}/replies")
    public ResponseEntity<List<Map<String, Object>>> getReplies(
            @PathVariable("wsId") Long wsId,
            @PathVariable("postId") int postId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(401).build();
        if (!boardAuthorizationService.canViewPost((long) postId, loginUser.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(iboardService.getReplyList(postId));
    }
    @PostMapping("/board/image-upload")
    public ResponseEntity<Map<String, Object>> uploadEditorImage(
            @RequestParam("upload") MultipartFile uploadFile,
            HttpSession session) {

        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = (usersDto) session.getAttribute("user");

        if (loginUser == null) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "로그인이 필요합니다."));
            return ResponseEntity.status(401).body(response);
        }

        if (uploadFile == null || uploadFile.isEmpty()) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "업로드할 이미지가 없습니다."));
            return ResponseEntity.badRequest().body(response);
        }

        final long maxSize = 5L * 1024L * 1024L;
        final String extension;
        try {
            uploadSecurityService.validateImage(uploadFile, maxSize, true);
            extension = "." + uploadSecurityService.safeExtension(uploadFile.getOriginalFilename());
        } catch (IllegalArgumentException e) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", e.getMessage()));
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String uploadPath = boardEditorUploadDir;
            File folder = new File(uploadPath);
            if (!folder.exists() && !folder.mkdirs()) {
                throw new IOException("업로드 폴더를 생성할 수 없습니다.");
            }

            String savedFileName = UUID.randomUUID().toString().replace("-", "") + extension;
            File targetFile = new File(folder, savedFileName);
            uploadFile.transferTo(targetFile);

            response.put("uploaded", true);
            response.put("url", "/upload/editor/" + savedFileName);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "이미지 저장 중 오류가 발생했습니다."));
            return ResponseEntity.status(500).body(response);
        }
    }

    private String getSafeImageExtension(String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            return null;
        }
        String extension = originalFileName.substring(originalFileName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        Set<String> allowed = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");
        return allowed.contains(extension) ? extension : null;
    }

    @PostMapping("/{wsId}/board/report")
    public ResponseEntity<Map<String, Object>> reportBoardContent(
            @PathVariable("wsId") Long wsId,
            @RequestBody Map<String, Object> reportData,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED", "message", "로그인이 필요합니다."));
        }

        String contentType = String.valueOf(reportData.getOrDefault("contentType", "BOARD"));
        Long contentId = null;
        Object rawContentId = reportData.get("contentId");
        if (rawContentId instanceof Number) {
            contentId = ((Number) rawContentId).longValue();
        } else if (rawContentId != null && !String.valueOf(rawContentId).isBlank()) {
            contentId = Long.parseLong(String.valueOf(rawContentId));
        }

        String reason = String.valueOf(reportData.getOrDefault("reason", "ETC"));
        String detail = String.valueOf(reportData.getOrDefault("detail", ""));

        if (!boardAuthorizationService.canReportContent(wsId, contentType, contentId, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN", "message", "신고 대상에 접근할 권한이 없습니다."));
        }

        Map<String, Object> result = iboardService.reportContent(contentType, contentId, loginUser.getUserId(), reason, detail);
        String status = String.valueOf(result.get("status"));

        if ("LOGIN_REQUIRED".equals(status)) {
            return ResponseEntity.status(401).body(result);
        }
        if ("FAIL".equals(status)) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{wsId}/board/write")
    public ResponseEntity<?> writePost(
            @PathVariable("wsId") Long wsId,
            @RequestPart("post") postDTO post,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");

        if (post != null && "FILE".equalsIgnoreCase(post.getBoardType())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "LEGACY_FILE_BOARD_DISABLED",
                    "message", "자료실은 공통 파일 시스템을 사용합니다."));
        }

        if (loginUser == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "FAIL");
            response.put("message", "로그인이 필요합니다.");
            return ResponseEntity.status(401).body(response);
        }

        post.setWsId(wsId);
        post.setUserId(loginUser.getUserId());
        if (!boardAuthorizationService.canAccessBoard(wsId, post.getProjId(), loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN", "message", "게시판에 접근할 권한이 없습니다."));
        }

        boolean canManage = boardAuthorizationService.canManageBoard(wsId, post.getProjId(), loginUser.getUserId());
        if ("NOTICE".equalsIgnoreCase(post.getBoardType()) && !canManage) {
            return ResponseEntity.status(403).body(Map.of(
                    "status", "FORBIDDEN",
                    "message", "공지사항은 그룹장 또는 관리자만 작성할 수 있습니다."));
        }
        if (!canManage || !"Y".equalsIgnoreCase(post.getIsPinned())) {
            post.setIsPinned("N");
            post.setPinStartDt(null);
            post.setPinEndDt(null);
        } else {
            post.setIsPinned("Y");
        }

        System.out.println("글 등록 wsId = " + wsId);
        System.out.println("글 등록 projId = " + post.getProjId());
        System.out.println("글 등록 userId = " + post.getUserId());
        System.out.println("글 등록 boardType = " + post.getBoardType());

        List<Map<String, Object>> fileList = new ArrayList<>();

        if (files != null) {
            for (MultipartFile file : files) {
                String savedName = iboardService.saveFile(file);

                Map<String, Object> fileMap = new HashMap<>();
                fileMap.put("fileName", savedName);
                fileMap.put("originalName", uploadSecurityService.safeOriginalName(file.getOriginalFilename()));
                fileMap.put("fileSize", file.getSize());
                fileList.add(fileMap);
            }
        }

        iboardService.registerPostWithFiles(post, fileList);

        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }
   

    @DeleteMapping("/{wsId}/board/file/{fileId}")
    public ResponseEntity<String> deleteFile(
            @PathVariable("wsId") Long wsId,
            @PathVariable("fileId") int fileId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(401).body("LOGIN_REQUIRED");
        if (!boardAuthorizationService.canDeleteAttachment(String.valueOf(fileId), loginUser.getUserId())) {
            return ResponseEntity.status(403).body("FORBIDDEN");
        }
        boolean isDeleted = iboardService.deleteFile(fileId);
        return ResponseEntity.ok(isDeleted ? "SUCCESS" : "FAIL");
    }
    @GetMapping("/api/board-list")
    public ResponseEntity<List<postDTO>> getBoardList(
            @RequestParam("projId") Long projId,
            @RequestParam("boardType") String boardType,
            HttpSession session) {
        if ("FILE".equalsIgnoreCase(boardType)) {
            return ResponseEntity.badRequest().body(new ArrayList<>());
        }
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(401).build();
        if (!boardAuthorizationService.canAccessBoard(null, projId, loginUser.getUserId())) {
            return ResponseEntity.status(403).build();
        }

        // 워크스페이스 방식과 별개로 프로젝트 ID(projId) 기준 서비스 호출
        List<postDTO> list = iboardService.getListByProject(projId, boardType);
        return ResponseEntity.ok(list != null ? list : new ArrayList<>());
    }
    
    /**
     * 🚀 대시보드용 프로젝트 게시판 위젯 데이터 통합 조회
     * 호출 주소: /api/workspace/project/{projId}/dashboard-widgets
     */
    @GetMapping("/project/{projId}/dashboard-widgets")
    public ResponseEntity<Map<String, Object>> getProjectDashboardWidgets(
            @PathVariable("projId") Long projId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "LOGIN_REQUIRED"));
        }
        if (!boardAuthorizationService.canAccessBoard(null, projId, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("message", "FORBIDDEN"));
        }

        Map<String, Object> response = new HashMap<>();

        // 한 위젯의 조회 실패가 공지/자유피드/자료실 전체를 500으로 만들지 않게 각각 격리한다.
        try {
            List<postDTO> notices = iboardService.getListByProject(projId, "NOTICE");
            response.put("notice", notices == null ? List.of() : notices);
        } catch (Exception e) {
            System.err.println("[프로젝트 메인] 공지 위젯 조회 실패 projId=" + projId + " : " + e.getMessage());
            response.put("notice", List.of());
        }

        try {
            List<postDTO> freeBoards = iboardService.getListByProject(projId, "FREE");
            response.put("free", freeBoards == null ? List.of() : freeBoards);
        } catch (Exception e) {
            System.err.println("[프로젝트 메인] 자유피드 위젯 조회 실패 projId=" + projId + " : " + e.getMessage());
            response.put("free", List.of());
        }

        try {
            var files = contentFileService.getDashboardLatestFiles(
                    "PROJECT", null, projId, 3, loginUser.getUserId());
            response.put("files", files == null ? List.of() : files);
        } catch (Exception e) {
            System.err.println("[프로젝트 메인] 자료실 위젯 조회 실패 projId=" + projId + " : " + e.getMessage());
            response.put("files", List.of());
        }

        return ResponseEntity.ok(response);
    }

    private Long toLongValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean canManageReport(Map<String, Object> report, Long userId) {
        if (report == null || userId == null) return false;
        Long wsId = toLongValue(report.get("WS_ID"));
        Long projId = toLongValue(report.get("PROJ_ID"));
        return boardAuthorizationService.canManageBoard(wsId, projId, userId);
    }

    @PutMapping("/{wsId}/board/reports/{reportId}/status")
    public ResponseEntity<Map<String, Object>> updateReportStatusApi(
            @PathVariable("wsId") Long wsId,
            @PathVariable("reportId") Long reportId,
            @RequestBody Map<String, Object> body,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED", "message", "로그인이 필요합니다."));
        }

        Map<String, Object> report = iboardService.getReportById(reportId);
        if (!canManageReport(report, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN", "message", "신고를 처리할 권한이 없습니다."));
        }

        String newStatus = String.valueOf(body.getOrDefault("status", "WAITING"));
        boolean success = iboardService.updateReportStatus(reportId, newStatus, loginUser.getUserId());
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    @DeleteMapping("/{wsId}/board/reports/{reportId}/content")
    public ResponseEntity<Map<String, Object>> deleteReportedContentApi(
            @PathVariable("wsId") Long wsId,
            @PathVariable("reportId") Long reportId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED", "message", "로그인이 필요합니다."));
        }

        Map<String, Object> report = iboardService.getReportById(reportId);
        if (!canManageReport(report, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN", "message", "신고를 처리할 권한이 없습니다."));
        }

        boolean success = iboardService.deleteReportedContent(reportId, loginUser.getUserId());
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    private ResponseEntity<Map<String, Object>> authorizeWorkspaceMember(Long wsId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "LOGIN_REQUIRED"));
        }
        if (wsId == null || workspaceDAO.isWorkspaceMember(wsId, loginUser.getUserId()) < 1) {
            return ResponseEntity.status(403).body(Map.of("message", "WORKSPACE_MEMBER_REQUIRED"));
        }
        return null;
    }

    private ResponseEntity<List<Map<String, Object>>> authorizeWorkspaceMemberList(Long wsId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(401).build();
        if (wsId == null || workspaceDAO.isWorkspaceMember(wsId, loginUser.getUserId()) < 1) {
            return ResponseEntity.status(403).build();
        }
        return null;
    }

}
