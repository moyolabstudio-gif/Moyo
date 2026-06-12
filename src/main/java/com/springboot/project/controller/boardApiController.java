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
import com.springboot.project.service.IboardService;

@RestController
@RequestMapping("/api/workspace")
public class boardApiController {

    @Autowired
    private IboardService iboardService;

    /**
     * 📢 대시보드 진입 시 공지사항 및 자유게시판 최신글 5개를 비동기로 반환하는 API
     * 브라우저 호출 주소: /api/workspace/{wsId}/dashboard-widgets
     */
    @GetMapping("/{wsId}/dashboard-widgets")
    public ResponseEntity<Map<String, Object>> getDashboardWidgets(@PathVariable("wsId") Long wsId) {
        Map<String, Object> response = new HashMap<>();
        
        // 윤재 님이 기존에 가지고 계시던 서비스 메서드 호출
        List<postDTO> notices = iboardService.getDashboardLatest(wsId, "NOTICE");
        List<postDTO> freeBoards = iboardService.getDashboardLatest(wsId, "FREE");
        List<postDTO> fileBoards = iboardService.getDashboardLatest(wsId, "FILE");
        
        // JS 프론트엔드가 요구하는 key 값(notices, freeBoards) 그대로 조립
        response.put("notices", notices);
        response.put("freeBoards", freeBoards);
        response.put("fileBoards", fileBoards); // 👈 이 부분을 꼭 추가하세요!
        
        return ResponseEntity.ok(response);
    }

    /**
     * 💬 댓글 등록 API (기존 유지)
     */
    @PostMapping("/{wsId}/board/reply")
    public ResponseEntity<Map<String, Object>> registerReply(
            @PathVariable("wsId") Long wsId,  // 💡 여기 괄호 안에 이름을 명시해야 합니다!
            @RequestBody Map<String, Object> replyData) {
        
        System.out.println("DEBUG - 받은 데이터: " + replyData);
        
        try {
            boolean isSuccess = iboardService.registerReply(replyData);
            
            Map<String, Object> response = new HashMap<>();
            if(isSuccess) {
                response.put("status", "SUCCESS");
            } else {
                response.put("status", "FAIL");
            }
            return ResponseEntity.ok(response);
            
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
    public ResponseEntity<?> modifyReply(@RequestBody Map<String, Object> replyData) {
        // 내부적으로 쿼리: UPDATE BOARD_REPLIES SET CONTENT = #{content} WHERE REPLY_ID = #{replyId} 호출
        boolean success = iboardService.modifyReply(replyData); 
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }

    // 2. 댓글 삭제 API
    @DeleteMapping("/{wsId}/board/reply/{replyId}")
    public ResponseEntity<?> removeReply(@PathVariable("replyId") int replyId) {
        // 내부적으로 쿼리: DELETE FROM BOARD_REPLIES WHERE REPLY_ID = #{replyId} 호출
        boolean success = iboardService.removeReply(replyId);
        return ResponseEntity.ok(Map.of("status", success ? "SUCCESS" : "FAIL"));
    }
    @GetMapping("/{wsId}/board/{postId}/replies")
    public ResponseEntity<List<Map<String, Object>>> getReplies(
            @PathVariable("postId") int postId) { // int 타입으로 변경
        
        // 인터페이스에 있는 getReplyList를 호출합니다.
        List<Map<String, Object>> replies = iboardService.getReplyList(postId);
        
        return ResponseEntity.ok(replies);
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
        if (uploadFile.getSize() > maxSize) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "이미지는 5MB 이하만 업로드할 수 있습니다."));
            return ResponseEntity.badRequest().body(response);
        }

        String originalFileName = uploadFile.getOriginalFilename();
        String extension = getSafeImageExtension(originalFileName);
        String contentType = uploadFile.getContentType();

        if (extension == null || contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "jpg, jpeg, png, gif, webp 이미지만 업로드할 수 있습니다."));
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String uploadPath = "C:/MoyoLab.Studio/upload/editor/";
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

    @GetMapping("/{wsId}/calendar-events")
    public ResponseEntity<List<Map<String, Object>>> getCalendarEvents(@PathVariable("wsId") Long wsId) {
        try {
            List<Map<String, Object>> list = iboardService.selectWorkspaceCalendar(wsId);
            return ResponseEntity.ok(list != null ? list : new ArrayList<>());
        } catch (Exception e) {
            e.printStackTrace(); // 🚨 이 로그를 서버 콘솔에서 확인하세요!
            return ResponseEntity.status(500).build();
        }
    }
    @PostMapping("/{wsId}/board/write")
    public ResponseEntity<?> writePost(
            @PathVariable("wsId") Long wsId,
            @RequestPart("post") postDTO post,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");

        if (loginUser == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "FAIL");
            response.put("message", "로그인이 필요합니다.");
            return ResponseEntity.status(401).body(response);
        }

        post.setWsId(wsId);
        post.setUserId(loginUser.getUserId());

        boolean canManage = iboardService.canManageBoardPin(wsId, post.getProjId(), loginUser.getUserId());
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
                fileMap.put("originalName", file.getOriginalFilename());
                fileMap.put("fileSize", file.getSize());
                fileList.add(fileMap);
            }
        }

        iboardService.registerPostWithFiles(post, fileList);

        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }
   

    @DeleteMapping("/{wsId}/board/file/{fileId}") // 👈 중괄호 위치 확인!
    public ResponseEntity<String> deleteFile(
            @PathVariable("wsId") Long wsId,
            @PathVariable("fileId") int fileId) {
        
        System.out.println("🔥 컨트롤러 도달! fileId: " + fileId); // 👈 로그 추가
        boolean isDeleted = iboardService.deleteFile(fileId);
        return ResponseEntity.ok(isDeleted ? "SUCCESS" : "FAIL");
    }
    @GetMapping("/api/board-list")
    public ResponseEntity<List<postDTO>> getBoardList(
            @RequestParam("projId") Long projId, 
            @RequestParam("boardType") String boardType) {
        
        // 워크스페이스 방식과 별개로 프로젝트 ID(projId) 기준 서비스 호출
        List<postDTO> list = iboardService.getListByProject(projId, boardType);
        return ResponseEntity.ok(list != null ? list : new ArrayList<>());
    }
    
    /**
     * 🚀 대시보드용 프로젝트 게시판 위젯 데이터 통합 조회
     * 호출 주소: /api/workspace/project/{projId}/dashboard-widgets
     */
    @GetMapping("/project/{projId}/dashboard-widgets")
    public ResponseEntity<Map<String, List<postDTO>>> getProjectDashboardWidgets(@PathVariable("projId") Long projId) {
        Map<String, List<postDTO>> response = new HashMap<>();
        
        // 각각의 최신글 5개씩 조회
        response.put("notice", iboardService.getListByProject(projId, "NOTICE"));
        response.put("free", iboardService.getListByProject(projId, "FREE"));
        response.put("file", iboardService.getListByProject(projId, "FILE"));
        
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
        return iboardService.canManageBoardPin(wsId, projId, userId);
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

}
