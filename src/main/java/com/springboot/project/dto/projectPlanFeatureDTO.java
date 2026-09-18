package com.springboot.project.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/** 프로젝트별 계획 기능 생성 상태와 시간별 계획 표시 범위. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class projectPlanFeatureDTO {
    private Long projId;
    private String periodEnabledYn;
    private String timeEnabledYn;
    private String weeklyEnabledYn;
    private String timeRangeStartDate;
    private String timeRangeEndDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
