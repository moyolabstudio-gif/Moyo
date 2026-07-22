package com.springboot.project.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class fileUploadService {

    private final String publicPrefix;
    private final Path uploadDir;

    public fileUploadService(
            @Value("${moyo.upload.workspace-dir:C:/uploads/workspace/}") String workspaceUploadDir,
            @Value("${moyo.upload.workspace-public-prefix:/uploads/workspace/}") String workspacePublicPrefix) {

        this.uploadDir = Paths.get(workspaceUploadDir)
                .toAbsolutePath()
                .normalize();
        this.publicPrefix = normalizePublicPrefix(workspacePublicPrefix);
    }

    public String upload(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        try {
            Files.createDirectories(uploadDir);

            String extension = resolveExtension(file);
            String fileName = UUID.randomUUID().toString().replace("-", "") + extension;
            Path destination = uploadDir.resolve(fileName).normalize();

            if (!destination.startsWith(uploadDir)) {
                throw new IOException("허용되지 않은 업로드 경로입니다.");
            }

            Files.copy(file.getInputStream(), destination,
                    StandardCopyOption.REPLACE_EXISTING);

            return publicPrefix + fileName;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * MOYO가 직접 관리하는 그룹 이미지 경로만 삭제한다.
     * 외부 URL, 기본 이미지, 다른 업로드 영역은 삭제하지 않는다.
     */
    public boolean deleteManagedFile(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) return false;

        String normalizedPublicPath = publicPath.trim().replace('\\', '/');
        if (!normalizedPublicPath.startsWith(publicPrefix)) return false;

        String fileName = normalizedPublicPath.substring(publicPrefix.length());
        if (fileName.isBlank() || fileName.contains("/") || fileName.contains("..")) {
            return false;
        }

        try {
            Path target = uploadDir.resolve(fileName).normalize();
            if (!target.startsWith(uploadDir)) return false;
            return Files.deleteIfExists(target);
        } catch (Exception e) {
            // 파일 정리는 DB 저장 결과를 되돌릴 이유가 아니므로 로그만 남긴다.
            e.printStackTrace();
            return false;
        }
    }

    private String normalizePublicPrefix(String prefix) {
        String normalized = prefix == null ? "" : prefix.trim().replace('\\', '/');
        if (normalized.isEmpty()) normalized = "/uploads/workspace/";
        if (!normalized.startsWith("/")) normalized = "/" + normalized;
        if (!normalized.endsWith("/")) normalized = normalized + "/";
        return normalized;
    }

    private String resolveExtension(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null) {
            switch (contentType.toLowerCase(Locale.ROOT)) {
                case "image/png":
                    return ".png";
                case "image/jpeg":
                case "image/jpg":
                    return ".jpg";
                case "image/webp":
                    return ".webp";
                default:
                    break;
            }
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return ".bin";
        }

        String safeName = new File(originalName).getName();
        int dotIndex = safeName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == safeName.length() - 1) {
            return ".bin";
        }

        String extension = safeName.substring(dotIndex).toLowerCase(Locale.ROOT);
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : ".bin";
    }
}
