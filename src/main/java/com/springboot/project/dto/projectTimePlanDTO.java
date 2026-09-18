package com.springboot.project.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/** 시작·종료 일시를 기준으로 구성하는 프로젝트 시간별 계획 데이터. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class projectTimePlanDTO {
    private Long timePlanId;
    private Long projId;
    private Long taskId;
    private String title;
    private String description;
    private String startDate;
    private String startTime;
    private String endDate;
    private String endTime;
    private String allDayYn;
    private String color;
    private Integer sortOrder;
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
