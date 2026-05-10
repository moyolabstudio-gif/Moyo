package com.springboot.project.dto;

import lombok.Data;

@Data

public class calendarResponseDTO {
    private Long id;
    private String title;
    private String startDt;
    private String endDt;
    private String itemType; 
    private Long userId; 
    private Long projId;
    private Long wsId;    
    private String color; 
    
    private String allDay;
    
    private String isRecurring;     // 'Y' 또는 'N'
    private String recurType;        // 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
    private int recurInterval;       // 반복 간격 (기본값 1)
    private String untilDt;
    private String recurGroupId;     // 반복 일정을 하나로 묶는 UUID
    
    private String isLunar;      // IS_LUNAR
    private Integer lunarMonth;  // LUNAR_MONTH
    private Integer lunarDay;    // LUNAR_DAY
    // FullCalendar RRule 연동을 위한 추가 필드 (선택사항)
    private String recurFreq;        // 프론트에서 넘어오는 빈도수 (DAILY 등)
}