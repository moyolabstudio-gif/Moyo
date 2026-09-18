package com.springboot.project.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class csInquiryAttachmentDTO {
    private Long attachmentId;
    private Long msgId;
    private String originalName;
    private String storedName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
}
