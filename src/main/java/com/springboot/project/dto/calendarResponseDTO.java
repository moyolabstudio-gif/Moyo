package com.springboot.project.dto;

import lombok.Data;

@Data

public class calendarResponseDTO {
    private Long id;
    private String title;
    private String startDt;
    private String endDt;
    private String itemType; // 'EVENT' (일반 일정) 또는 'HOLIDAY' (공휴일)
    private Long userId; // 추가: 어떤 회원의 일정인지 구분
    private Long projId;
}

