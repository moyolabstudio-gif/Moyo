package com.springboot.project.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class AccountProfileImageService {
    private static final Path UPLOAD_DIR = Paths.get("C:/uploads/users");
    private static final long MAX_ORIGINAL_SIZE = 8L * 1024L * 1024L;
    private static final long MAX_CROPPED_SIZE = 5L * 1024L * 1024L;

    public String saveOriginalImage(String dataUrl) throws IOException {
        return saveImage(dataUrl, "original", MAX_ORIGINAL_SIZE);
    }

    public String saveCroppedImage(String dataUrl) throws IOException {
        return saveImage(dataUrl, "profile", MAX_CROPPED_SIZE);
    }

    private String saveImage(String dataUrl, String prefix, long maxSize) throws IOException {
        if (dataUrl == null || dataUrl.trim().isEmpty()) {
            return null;
        }

        int commaIndex = dataUrl.indexOf(',');
        if (!dataUrl.startsWith("data:image/") || commaIndex < 0) {
            throw new IllegalArgumentException("올바른 이미지 형식이 아닙니다.");
        }

        String header = dataUrl.substring(0, commaIndex).toLowerCase(Locale.ROOT);
        String extension;
        if (header.contains("image/png")) {
            extension = ".png";
        } else if (header.contains("image/webp")) {
            extension = ".webp";
        } else if (header.contains("image/jpeg") || header.contains("image/jpg")) {
            extension = ".jpg";
        } else {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식입니다.");
        }

        byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(commaIndex + 1));
        if (bytes.length > maxSize) {
            throw new IllegalArgumentException("프로필 이미지가 너무 큽니다.");
        }

        Files.createDirectories(UPLOAD_DIR);
        String safePrefix = prefix == null || prefix.trim().isEmpty() ? "profile" : prefix.trim();
        String fileName = safePrefix + "_" + UUID.randomUUID() + extension;
        Files.write(UPLOAD_DIR.resolve(fileName), bytes,
                StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);

        return "/uploads/users/" + fileName;
    }
}
