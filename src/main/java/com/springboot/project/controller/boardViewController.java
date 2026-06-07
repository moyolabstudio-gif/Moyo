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

    // 1. 게시판 목록
    @GetMapping("/list")
    public String boardList(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "type", defaultValue = "FREE") String type,
            Model model) {
        
        // wsId가 없으면 목록을 못 가져오므로 null 체크
        if(wsId != null) {
            List<postDTO> boardList = iboardService.getDashboardLatest(wsId, type);
            model.addAttribute("boardList", boardList);
        }
        
        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", type);
        
        return "board/boardList";
    }

    // 2. 작성 폼 이동 (wsId 필수 제거)
    @GetMapping("/write")
    public String boardWriteForm(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "type", defaultValue = "FREE") String type,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model) {
        
        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", type);
        model.addAttribute("projId", projId);
        
        return "board/boardWrite";
    }

    // 3. 상세 조회
    @GetMapping("/detail")
    public String boardDetail(@RequestParam("postId") int postId,
                              @RequestParam(value = "wsId", required = false) Long wsId,
                              @RequestParam(value = "projId", required = false) Long projId,
                              Model model) {
        postDTO post = iboardService.getPostDetail(postId);
        List<Map<String, Object>> replyList = iboardService.getReplyList(postId);
        List<Map<String, Object>> fileList = iboardService.getFileList(postId);
        
        model.addAttribute("post", post);
        model.addAttribute("replyList", replyList);
        model.addAttribute("fileList", fileList);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        
        return "board/boardDetail";
    }

    // 4. 게시글 등록
    @PostMapping("/register")
    public String boardRegister(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam("boardType") String boardType,
            @RequestParam(value = "projId", required = false) Long projId,
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
        if (projId != null) post.setProjId(projId);
        
        boolean isSuccess = iboardService.registerPost(post);
        
        if (isSuccess) {
            if (projId != null) {
                return "redirect:/project/main?projId=" + projId + "&wsId=" + wsId;
            } else {
                return "redirect:/group/board/list?wsId=" + wsId + "&type=" + boardType;
            }
        }
        return "redirect:/group/board/write?wsId=" + wsId + "&type=" + boardType + "&error=failed";
    }

    // 5. 수정 폼 및 수정 처리 등 나머지 메서드들도 동일하게 @RequestParam에 required = false 적용 권장
    @GetMapping("/modifyForm")
    public String boardModifyForm(
            @RequestParam("postId") int postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model) {
        postDTO post = iboardService.getPostDetail(postId);
        List<Map<String, Object>> fileList = iboardService.getFileList(postId);
        model.addAttribute("post", post);
        model.addAttribute("fileList", fileList);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", post.getBoardType());
        return "board/boardModify";
    }
    @PostMapping("/modify")
    public String boardModify(
            @RequestParam("postId") Long postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("boardType") String boardType,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {

        postDTO post = new postDTO();
        post.setPostId(postId);
        post.setWsId(wsId);
        post.setProjId(projId);
        post.setBoardType(boardType);
        post.setTitle(title);
        post.setContent(content);

        boolean success = iboardService.modifyPost(post);

        if (!success) {
            return "redirect:/group/board/modifyForm?postId=" + postId
                    + "&wsId=" + wsId
                    + (projId != null ? "&projId=" + projId : "")
                    + "&error=failed";
        }

        if (files != null) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;

                String savedName = iboardService.saveFile(file);

                Map<String, Object> fileMap = new HashMap<>();
                fileMap.put("postId", postId);
                fileMap.put("fileName", savedName);
                fileMap.put("originalName", file.getOriginalFilename());
                fileMap.put("fileSize", file.getSize());

                iboardService.insertFile(fileMap);
            }
        }

        return "redirect:/group/board/detail?postId=" + postId
                + "&wsId=" + wsId
                + (projId != null ? "&projId=" + projId : "");
    }
    @GetMapping("/delete")
    public String boardDelete(
            @RequestParam("postId") Long postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("boardType") String boardType) {

        boolean success = iboardService.deletePost(postId);

        if (!success) {
            return "redirect:/group/board/detail?postId=" + postId
                    + "&wsId=" + wsId
                    + (projId != null ? "&projId=" + projId : "")
                    + "&error=deleteFailed";
        }

        if (projId != null) {
            return "redirect:/project/board/list?projId=" + projId
                    + "&type=" + boardType
                    + "&wsId=" + wsId;
        }

        return "redirect:/group/board/list?wsId=" + wsId
                + "&type=" + boardType;
    }
}