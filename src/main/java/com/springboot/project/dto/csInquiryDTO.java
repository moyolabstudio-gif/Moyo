package com.springboot.project.dto;

import lombok.Data;

@Data
public class csInquiryDTO {
    // 1. 세션 연결용
    private Long csId;          // CS_LOGS와 연결
    
    // 2. 메시지 정보
    private Long senderId;      // 누가 보냈나?
    private Long categoryId;    // 무슨 내용인가?
    private String title;       // 이번에 추가하신 TITLE
    private String content;     // 메시지 본문
    
    // 3. 편의 정보
    private String categoryName; // 리스트 출력용 (JOIN 결과값)
}