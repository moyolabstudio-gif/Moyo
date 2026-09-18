package com.springboot.project.dto;

import java.time.LocalDateTime;

import lombok.Data;

/** 프로젝트 간트와 달력에서 사용하는 단일 목표 지점. */
@Data
public class projectMilestoneDTO {
    private Long milestoneId;
    private Long projId;
    private Long phaseId;
    private String phaseTitle;

    private String title;
    private String description;
    private String targetDate;       // yyyy-MM-dd
    private String color;            // nullable: 단계 색상 또는 프로젝트 기본색 상속
    private String effectiveColor;   // 조회용 최종 색상
    private String status;           // PLANNED / ACHIEVED / DELAYED / CANCELLED

    private Long assignedUserId;
    private String assignedUserName;
    private Integer sortOrder;

    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
