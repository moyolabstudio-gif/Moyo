package com.springboot.project.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/** 요일과 시간을 기준으로 매주 반복되는 프로젝트 주간 계획 데이터. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class projectWeeklyPlanDTO {
    private Long weeklyPlanId;
    private Long projId;
    private Long taskId;
    private String title;
    private String description;
    private Integer dayOfWeek;
    private String startTime;
    private String endTime;
    private String color;
    private Integer sortOrder;
    private String repeatStartDate;
    private String repeatEndDate;
    private String activeYn;
    private String draftKey;
    private String recordEnabledYn;
    private String recordVisibility;
    /** 이 계획을 수정할 수 있도록 별도 지정한 프로젝트 멤버 ID 목록. */
    private List<Long> editorUserIds;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 화면 표시용 연결 업무 정보
    private String taskTitle;
    private String taskStatus;
    private Long assignedUserId;
    private String assignedUserName;
    private Long phaseId;
    private String phaseTitle;
}
