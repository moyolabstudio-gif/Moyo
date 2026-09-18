package com.springboot.project.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class csDTO {
    private Long csId;
    private Long userId;
    private String extKey;
    private String csStatus;

    private String userName;
    private String email;

    // 문의 목록 표시용
    private Long categoryId;
    private String categoryName;
    private String title;
    private String lastContent;
    private Long lastSenderId;
    private String lastSenderType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getCS_ID() { return this.csId; }
    public String getEXT_KEY() { return this.extKey; }
    public String getCS_STATUS() { return this.csStatus; }
    public String getUSER_NAME() { return this.userName; }
    public String getEMAIL() { return this.email; }
}
