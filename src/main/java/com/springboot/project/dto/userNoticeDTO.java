package com.springboot.project.dto;

import java.util.Date;

import lombok.Data;

@Data
public class userNoticeDTO {
    private Long alarmId;
    private Long userId;
    private Long noticeId;
    private String alertType;
    private String targetType;
    private Long targetId;
    private String title;
    private String content;
    private String linkUrl;
    private String isRead;
    private Date regDt;
}
