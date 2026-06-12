package com.springboot.project.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class AccountProfileImageService {
    private static final Path UPLOAD_DIR = Paths.get("C:/uploads/users");

    public String saveCroppedImage(String dataUrl) throws IOException {
        if (dataUrl == null || dataUrl.trim().isEmpty()) {
            return null;
        }

        int commaIndex = dataUrl.indexOf(',');
        if (!dataUrl.startsWith("data:image/") || commaIndex < 0) {
            throw new IllegalArgumentException("올바른 이미지 형식이 아닙니다.");
        }

        String header = dataUrl.substring(0, commaIndex).toLowerCase();
        String extension = header.contains("image/png") ? ".png" : ".jpg";
        byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(commaIndex + 1));

        if (bytes.length > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("프로필 이미지가 너무 큽니다.");
        }

        Files.createDirectories(UPLOAD_DIR);
        String fileName = UUID.randomUUID() + extension;
        Files.write(UPLOAD_DIR.resolve(fileName), bytes,
                StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);

        return "/uploads/users/" + fileName;
    }
}
