package com.springboot.project.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.csInquiryAttachmentDTO;

@Service
public class InquiryAttachmentStorageService {

    public static final long MAX_FILE_BYTES = 10L * 1024L * 1024L;
    public static final int MAX_FILE_COUNT = 5;

    private final Path uploadDir;
    private final UploadSecurityService uploadSecurityService;

    public InquiryAttachmentStorageService(
            @Value("${moyo.upload.inquiry-dir:C:/uploads/inquiry/}") String inquiryUploadDir,
            UploadSecurityService uploadSecurityService) {
        this.uploadDir = Paths.get(inquiryUploadDir).toAbsolutePath().normalize();
        this.uploadSecurityService = uploadSecurityService;
    }

    public csInquiryAttachmentDTO store(MultipartFile file) {
        uploadSecurityService.validateAttachment(file, MAX_FILE_BYTES);

        String originalName = uploadSecurityService.safeOriginalName(file.getOriginalFilename());
        String extension = uploadSecurityService.safeExtension(originalName);
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path destination = uploadDir.resolve(storedName).normalize();

        if (!destination.startsWith(uploadDir)) {
            throw new IllegalArgumentException("허용되지 않은 첨부파일 경로입니다.");
        }

        try {
            Files.createDirectories(uploadDir);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("첨부파일 저장에 실패했습니다.", e);
        }

        csInquiryAttachmentDTO dto = new csInquiryAttachmentDTO();
        dto.setOriginalName(originalName);
        dto.setStoredName(storedName);
        dto.setContentType(file.getContentType() == null || file.getContentType().isBlank()
                ? "application/octet-stream" : file.getContentType());
        dto.setFileSize(file.getSize());
        return dto;
    }

    public Resource load(String storedName) {
        if (storedName == null || storedName.isBlank() || storedName.contains("/") || storedName.contains("\\")
                || storedName.contains("..")) {
            throw new IllegalArgumentException("올바르지 않은 첨부파일 경로입니다.");
        }

        Path target = uploadDir.resolve(storedName).normalize();
        if (!target.startsWith(uploadDir) || !Files.isRegularFile(target)) {
            throw new IllegalArgumentException("첨부파일을 찾을 수 없습니다.");
        }
        return new FileSystemResource(target);
    }

    public void deleteQuietly(String storedName) {
        if (storedName == null || storedName.isBlank()) return;
        try {
            Path target = uploadDir.resolve(storedName).normalize();
            if (target.startsWith(uploadDir)) Files.deleteIfExists(target);
        } catch (Exception ignored) {
        }
    }
}
