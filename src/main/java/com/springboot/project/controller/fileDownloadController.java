package com.springboot.project.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.springboot.project.service.IboardService;

import jakarta.servlet.http.HttpServletResponse;

@Controller
public class fileDownloadController {
	
	@Autowired 
    private IboardService iboardService;
	
	@GetMapping("/download")
	public void downloadFile(@RequestParam("fileId") String fileId, HttpServletResponse response) throws Exception {
	    
	    // 1. DB에서 파일 정보 조회
	    Map<String, Object> fileInfo = iboardService.getFileInfo(fileId); // 이 메서드 추가 필요
	    
	    if (fileInfo == null) {
	        response.sendError(404, "파일 정보를 찾을 수 없습니다.");
	        return;
	    }

	    String savedFileName = (String) fileInfo.get("FILE_NAME");
	    String originalName = (String) fileInfo.get("FILE_ORIGINAL_NAME");
	    String uploadPath = "C:/MoyoLab.Studio/upload/";
	    File file = new File(uploadPath + savedFileName);

	    if (!file.exists()) {
	        response.sendError(404, "실제 파일이 서버에 존재하지 않습니다.");
	        return;
	    }
        // 2. 다운로드 응답 헤더 설정
        response.setContentType("application/download");
        response.setContentLength((int) file.length());
        String encodedName = URLEncoder.encode(originalName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-Disposition", "attachment;filename=\"" + encodedName + "\"");

        // 3. 파일 스트림 전송
        try (FileInputStream fis = new FileInputStream(file);
             OutputStream os = response.getOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = fis.read(buffer)) > 0) {
                os.write(buffer, 0, len);
            }
        }
    }
}