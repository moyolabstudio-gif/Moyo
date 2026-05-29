package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.io.File;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.postDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IboardService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/board/file") // 경로를 명확하게 분리 (예: /api/board/file)
public class boardFileApiController {

    @Autowired
    private IboardService iboardService;

    @PostMapping("/{wsId}/write") 
    public ResponseEntity<?> writePostWithFiles(
            @PathVariable("wsId") Long wsId,
            @RequestPart("post") postDTO post,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        // 1. 세션 체크
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "FAIL", "message", "로그인 필요"));
        }

        // 2. DTO 설정
        post.setWsId(wsId);
        post.setUserId(loginUser.getUSER_ID());

        // 3. 파일 처리
        List<Map<String, Object>> fileList = new ArrayList<>();
        if (files != null) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                
                String savedName = saveFileToDisk(file);
                
                Map<String, Object> fileMap = new HashMap<>();
                fileMap.put("fileName", savedName);
                fileMap.put("originalName", file.getOriginalFilename());
                fileMap.put("fileSize", file.getSize());
                fileList.add(fileMap);
            }
        }

        // 4. 서비스 호출 (게시글 + 파일 동시 저장)
        iboardService.registerPostWithFiles(post, fileList);

        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    // 파일 물리적 저장 로직 (컨트롤러 내부 보조 메서드)
    private String saveFileToDisk(MultipartFile file) {
        try {
            String uploadPath = "C:/MoyoLab.Studio/upload/";
            File folder = new File(uploadPath);
            if (!folder.exists()) folder.mkdirs();

            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String savedFileName = UUID.randomUUID().toString() + extension;

            file.transferTo(new File(uploadPath + savedFileName));
            return savedFileName;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패");
        }
    }
   
}