package com.springboot.project.controller;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
            @RequestParam("upload") MultipartFile uploadFile) {
        
        Map<String, Object> response = new HashMap<>();
        
        if (uploadFile.isEmpty()) {
            response.put("uploaded", false);
            Map<String, String> error = new HashMap<>();
            error.put("message", "파일이 비어있습니다.");
            response.put("error", error);
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 1. 파일이 저장될 물리적인 서버 디렉토리 설정 (예: C:/MoyoLab.Studio/upload/)
            String uploadPath = "C:/MoyoLab.Studio/upload/";
            File folder = new File(uploadPath);
            if (!folder.exists()) {
                folder.mkdirs(); // 폴더가 없으면 자동 생성하여 안정성 확보
            }

            // 2. 파일명 중복 방지를 위해 UUID 결합
            String originalFileName = uploadFile.getOriginalFilename();
            String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String savedFileName = UUID.randomUUID().toString() + extension;

            // 3. 파일 물리 저장 실행
            File targetFile = new File(uploadPath + savedFileName);
            uploadFile.transferTo(targetFile);

            // 4. CKEditor 5 스펙에 맞춤 응답 JSON 포맷 구성
            // 💡 주의: 이 저장된 이미지를 외부 브라우저가 정적 리소스로 다운로드하려면 
            // WebMvcConfigurer 설정에서 "/upload/**" 경로를 ResourceHandler에 등록해 주어야 로드가 완벽해집니다!
            response.put("uploaded", true);
            response.put("url", "/upload/" + savedFileName); // 브라우저가 접근할 이미지 가상 경로

        } catch (IOException e) {
            response.put("uploaded", false);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 저장 중 오류 발생");
            response.put("error", error);
            return ResponseEntity.status(500).body(response);
        }

        return ResponseEntity.ok(response);
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
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        post.setWsId(wsId);
        List<Map<String, Object>> fileList = new ArrayList<>(); // 💡 리스트 생성 누락 보완
        
        if (files != null) {
            for (MultipartFile file : files) {
                String savedName = iboardService.saveFile(file); // 서비스 공통 메서드 호출
                
                Map<String, Object> fileMap = new HashMap<>();
                fileMap.put("fileName", savedName);
                fileMap.put("originalName", file.getOriginalFilename());
                fileMap.put("fileSize", file.getSize());
                fileList.add(fileMap); // 💡 리스트에 담기
            }
        }
        
        // 서비스 호출
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
    
}