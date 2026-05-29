package com.springboot.project.dto;

import java.util.List;
import lombok.Data;

@Data
public class projectRequestDTO {
    private Long projId;   
    private String projName;
    private String projDesc;
    private String projType;    
    private Long wsId;
    private Long leaderId;      
    private List<Long> memberIds;
    private String startDate; 
    private String endDate;

    // 💡 클래스 중괄호 { } 내부로 이동 완료!
    public calendarResponseDTO toEventDTO() {
        if (startDate == null || endDate == null) {
            return null;
        }

        calendarResponseDTO event = new calendarResponseDTO();
        event.setTitle(this.projName + " 시작");
        event.setStartDt(this.startDate + "T00:00");
        event.setEndDt(this.endDate + "T23:59");
        event.setProjId(this.projId);
        event.setWsId(this.wsId);
        event.setUserId(this.leaderId);
        event.setItemType("PROJ");
        event.setColor("#3788d8");

        return event;
    }
}