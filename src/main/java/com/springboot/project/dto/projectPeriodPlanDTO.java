package com.springboot.project.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** 프로젝트 기간별 계획 데이터. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class projectPeriodPlanDTO {
    private Long periodPlanId;
    private Long projId;
    private String title;
    private String description;
    private String startDate;
    private String endDate;
    private String color;
    private Integer sortOrder;
    /** 이 계획을 수정할 수 있도록 별도 지정한 프로젝트 멤버 ID 목록. */
    private List<Long> editorUserIds;
    private Long createdBy;
    /** 등록 전 공통 기록 임시 대상 키. DB 컬럼이 아니라 저장 시 대상 확정에만 사용한다. */
    private String draftKey;
    private String recordEnabledYn;
    private String recordVisibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** 기존 프런트 전환 전까지 사용하는 응답 호환 필드. */
    @JsonProperty("phaseId")
    public Long getLegacyPhaseId() {
        return periodPlanId;
    }
}
