package com.springboot.project.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class projectRequestDTO {
    private Long projId;   
    private String projName;
    private String projDesc;
    private String projType;
    private String projScope;
    private String projCategory;
    private String projCategoryDetail;
    private String projIcon;             // semantic icon key (e.g. plane, code, book-open)
    private String accessScope;          // OWNER_ONLY / PARTICIPANTS / WORKSPACE_READ
    private Long wsId;
    private Long leaderId;      
    private List<Long> memberIds;
    private List<Long> adminIds;
    private List<Map<String, Object>> links;
    private Map<String, String> memberPositions;
    private String startDate; 
    private String endDate;
    private String periodEnabledYn;      // Y when both start/end dates exist
    private Integer taskTotal;
    private Integer taskDone;
    private Integer progressPercent;      // null when there are no tasks
    private String status;                       // ACTIVE / DELETE_PENDING
    private LocalDateTime deleteRequestedAt;    // 삭제 신청 시각
    private LocalDateTime deleteDeadlineAt;     // 최종 삭제 예정 시각
    private String deleteDeadlineDate;              // yyyy-MM-dd 화면 표시용

    // 💡 클래스 중괄호 { } 내부로 이동 완료!
    public calendarResponseDTO toEventDTO() {
        if (startDate == null || endDate == null) {
            return null;
        }

        calendarResponseDTO event = new calendarResponseDTO();
        event.setTitle(this.projName);
        event.setStartDt(this.startDate + "T00:00");
        event.setEndDt(this.endDate + "T23:59");
        event.setProjId(this.projId);
        event.setWsId(this.wsId);
        event.setUserId(this.leaderId);
        event.setItemType("PROJ");
        event.setColor("#8b63f6");
        event.setEventType("PROJECT_PERIOD");
        event.setIsPrivate("Y");

        return event;
    }
}