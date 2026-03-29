package com.springboot.project.dto;

import lombok.Data;

@Data

public class calendarResponseDTO {
    private Long id;
    private String title;
    private String startDt;
    private String endDt;
    private String itemType; // 'EVENT' (일반 일정) 또는 'HOLIDAY' (공휴일)
}

