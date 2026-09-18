package com.springboot.project.dto;

import lombok.Data;

@Data
public class projectPlanCalendarPrefDTO {
    private Long userId;
    private Long projId;
    private String showPeriodYn;
    private String showTimeYn;
    private String showWeeklyYn;
}
