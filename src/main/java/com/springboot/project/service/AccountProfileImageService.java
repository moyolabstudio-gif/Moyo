package com.springboot.project.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AccountProfileImageService {
    private final Path uploadDir;
    private static final long MAX_ORIGINAL_SIZE = 8L * 1024L * 1024L;
    private static final long MAX_CROPPED_SIZE = 5L * 1024L * 1024L;

    private final UploadSecurityService uploadSecurityService;

    public AccountProfileImageService(
            UploadSecurityService uploadSecurityService,
            @Value("${moyo.upload.user-dir:C:/uploads/users/}") String uploadDir) {
        this.uploadSecurityService = uploadSecurityService;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String saveOriginalImage(String dataUrl) throws IOException {
        return saveImage(dataUrl, "original", MAX_ORIGINAL_SIZE);
    }

    public String saveCroppedImage(String dataUrl) throws IOException {
        return saveImage(dataUrl, "profile", MAX_CROPPED_SIZE);
    }

    /**
     * DB에 저장된 /uploads/users/... 공개 경로의 실제 파일을 안전하게 삭제한다.
     * 허용된 사용자 프로필 업로드 디렉터리 밖의 경로는 절대 삭제하지 않는다.
     */
    public void deleteStoredImageQuietly(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) return;
        try {
            String normalized = publicPath.replace('\\', '/').trim();
            String prefix = "/uploads/users/";
            if (!normalized.startsWith(prefix)) return;
            String fileName = normalized.substring(prefix.length());
            if (fileName.isBlank() || fileName.contains("/") || fileName.contains("..")) return;
            Path target = uploadDir.resolve(fileName).normalize();
            if (!target.startsWith(uploadDir)) return;
            Files.deleteIfExists(target);
        } catch (Exception ignored) {
            // 파일 삭제 실패 때문에 계정 익명화 트랜잭션 전체를 막지 않는다.
        }
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

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(dataUrl.substring(commaIndex + 1));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("올바르지 않은 이미지 데이터입니다.");
        }
        uploadSecurityService.validateImageBytes(bytes, extension, maxSize);

        Files.createDirectories(uploadDir);
        String safePrefix = prefix == null || prefix.trim().isEmpty() ? "profile" : prefix.trim();
        String fileName = safePrefix + "_" + UUID.randomUUID() + extension;
        Files.write(uploadDir.resolve(fileName), bytes,
                StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);

        return "/uploads/users/" + fileName;
    }
}
