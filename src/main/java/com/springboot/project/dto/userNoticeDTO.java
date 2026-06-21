package com.springboot.project.dto;

import java.util.Date;

import lombok.Data; 

@Data 
public class userNoticeDTO {
    private Long alarmId;
    private Long userId;
    private Long noticeId;
    private String isRead;
    private Date regDt;

    private String title; 
    
}