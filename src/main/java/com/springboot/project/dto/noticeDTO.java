package com.springboot.project.dto;

import java.util.Date;

import lombok.Data;

@Data
public class noticeDTO {
    private Long noticeId;       // 시퀀스 번호
    private Long userId;         // 작성자 (관리자)
    private String title;        // 제목
    private String content;      // 본문 (HTML 가능)
    private Integer viewCount;   // 조회수
    private String isPinned;     // 고정 여부 ('Y', 'N')
    private Date regDt;          // 작성일
    private Date updDt;          // 수정일
    private String isPush;       // 추가: 'Y' or 'N'
}