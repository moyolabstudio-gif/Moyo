package com.springboot.project.service;

import java.io.File;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class fileUploadService {

    // 파일을 저장할 서버 내 실제 경로 (예: C:/upload/ 또는 /home/ubuntu/upload/)
    private final String uploadDir = "C:/uploads/workspace/"; 

    public String upload(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        try {
            // 경로 문자열
            String path = "C:/uploads/workspace/";
            File directory = new File(path);
            
            // 폴더가 없으면 무조건 생성 시도
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                if (!created) {
                    System.out.println("폴더 생성 실패! 권한을 확인하세요.");
                }
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File dest = new File(directory, fileName);
            
            file.transferTo(dest);
            
            return "/uploads/workspace/" + fileName;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}