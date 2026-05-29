package com.springboot.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.postDTO;
import com.springboot.project.service.IboardService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/group/board")
public class boardViewController {

    @Autowired
    private IboardService iboardService;

    /**
     * 📋 1. 게시판 전체 목록 페이지
     */
    @GetMapping("/list")
    public String boardList(
            @RequestParam("wsId") Long wsId,
            @RequestParam(value = "type", defaultValue = "FREE") String type,
            Model model) {
        
        // 데이터가 없어도 정상 작동하도록 리스트 바인딩
        List<postDTO> boardList = iboardService.getDashboardLatest(wsId, type); 
        
        model.addAttribute("boardList", boardList);
        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", type);
        
        return "workspace/boardList"; 
    }

    /**
     * ✏️ 2. [신규 추가] 게시글 작성 폼 페이지 이동
     * 주소: /group/board/write?wsId=45&type=FREE
     */
 // boardViewController.java
    @GetMapping("/write")
    public String boardWriteForm(
            @RequestParam("wsId") Long wsId,
            @RequestParam("type") String type,
            @RequestParam(value="projId", required=false) Long projId, // 💡 projId 추가
            Model model) {
        
        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", type);
        model.addAttribute("projId", projId); // 뷰로 전달
        
        return "workspace/boardWrite"; 
    }

    /**
     * 📄 3. 게시글 상세 조회 페이지
     */
    @GetMapping("/detail")
    public String boardDetail(@RequestParam("postId") int postId, @RequestParam("wsId") Long wsId, Model model) {
        postDTO post = iboardService.getPostDetail(postId);
        List<Map<String, Object>> replyList = iboardService.getReplyList(postId);
        
        // 💡 추가: 파일 목록 가져오기
        List<Map<String, Object>> fileList = iboardService.getFileList(postId); 
        
        model.addAttribute("post", post);
        model.addAttribute("replyList", replyList);
        model.addAttribute("fileList", fileList); // JSP로 전달
        
        return "workspace/boardDetail";
    }
    @PostMapping("/register")
    public String boardRegister(
            @RequestParam("wsId") Long wsId,
            @RequestParam("boardType") String boardType,
            @RequestParam(value="projId", required=false) Long projId, // 프로젝트에서 오면 값이 있음
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            HttpSession session) {
        
        com.springboot.project.dto.usersDto loginUser = (com.springboot.project.dto.usersDto) session.getAttribute("user");
        if (loginUser == null) return "redirect:/login";

        postDTO post = new postDTO();
        post.setWsId(wsId);
        post.setBoardType(boardType);
        post.setTitle(title);
        post.setContent(content);
        post.setUserId(loginUser.getUSER_ID());
        
        // 프로젝트용이면 projId 세팅
        if (projId != null) {
            post.setProjId(projId);
        }
        
        boolean isSuccess = iboardService.registerPost(post);
        
        if (isSuccess) {
            // [분기 처리] 
            if (projId != null) {
                // 프로젝트 대시보드로 이동
                return "redirect:/group/project/main?wsId=" + wsId + "&projId=" + projId;
            } else {
                // 기존 워크스페이스 게시판 목록으로 이동
                return "redirect:/group/board/list?wsId=" + wsId + "&type=" + boardType;
            }
        } else {
            return "redirect:/group/board/write?wsId=" + wsId + "&type=" + boardType + (projId != null ? "&projId=" + projId : "") + "&error=failed";
        }
    }
    
    /**
     * ✏️ 4. 게시글 수정 폼 페이지 이동 (기존 getPostDetail 규격인 int에 맞춤)
     */
 // boardViewController.java 내 boardModifyForm 메서드 수정
 // [수정 폼 이동]
    @GetMapping("/modifyForm")
    public String boardModifyForm(@RequestParam("postId") int postId, @RequestParam("wsId") Long wsId, Model model) {
        postDTO post = iboardService.getPostDetail(postId);
        List<Map<String, Object>> fileList = iboardService.getFileList(postId); // 💡 기존 파일 목록 로드
        
        model.addAttribute("post", post);
        model.addAttribute("fileList", fileList); // JSP에서 보여주기 위해 전달
        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", post.getBoardType());
        
        return "workspace/boardModify"; 
    }

    // [수정 처리]
    @PostMapping("/modify")
    public String boardModify(
            @RequestParam("postId") Long postId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("boardType") String boardType,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        
        // 1. 게시글 수정
        postDTO post = new postDTO();
        post.setPostId(postId);
        post.setTitle(title);
        post.setContent(content);
        iboardService.modifyPost(post);
        
        // 2. 새로운 파일 추가 (있을 경우에만)
        if (files != null) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String savedName = iboardService.saveFile(file);
                    
                    Map<String, Object> fileMap = new HashMap<>();
                    fileMap.put("postId", postId);
                    fileMap.put("fileName", savedName);
                    fileMap.put("originalName", file.getOriginalFilename());
                    fileMap.put("fileSize", file.getSize());
                    
                    iboardService.insertFile(fileMap); // 💡 서비스 계층 통해 DB 저장
                }
            }
        }
        
        return "redirect:/group/board/detail?postId=" + postId + "&wsId=" + wsId;
    }

    /**
     * 🗑️ 6. 게시글 삭제 처리 (서비스의 deletePost(Long) 규격에 맞춤)
     */
    @GetMapping("/delete")
    public String boardDelete(
            @RequestParam("postId") Long postId, // 👈 서비스단에 맞게 Long으로 수집
            @RequestParam("wsId") Long wsId,
            @RequestParam("boardType") String boardType) {
        
        boolean isDeleted = iboardService.deletePost(postId);
        
        if (isDeleted) {
            return "redirect:/group/board/list?wsId=" + wsId + "&type=" + boardType;
        } else {
            return "redirect:/group/board/detail?postId=" + postId + "&wsId=" + wsId + "&error=delete_failed";
        }
    }
}