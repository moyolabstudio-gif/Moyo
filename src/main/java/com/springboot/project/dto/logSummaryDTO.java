package com.springboot.project.dto;

import lombok.Data;

@Data
public class logSummaryDTO {
    private Long todayActiveUsers;
    private Long avgDailyActiveUsers;
    private String topMenuLabel;
    private Long topMenuCount;
    private String peakHourLabel;
    private Long peakHourCount;
}
