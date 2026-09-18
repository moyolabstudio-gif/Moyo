package com.springboot.project.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class csInquiryDTO {
    private Long csId;
    private Long msgId;
    private Long senderId;
    private String senderType;
    private Long categoryId;
    private String title;
    private String content;
    private String categoryName;
    private LocalDateTime createdAt;
    private List<csInquiryAttachmentDTO> attachments;
}
