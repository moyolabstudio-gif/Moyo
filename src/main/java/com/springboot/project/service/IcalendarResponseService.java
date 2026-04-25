package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import com.springboot.project.dto.calendarResponseDTO;

public interface IcalendarResponseService {
    // 캘린더 전체 일정 조회 (일반일정 + 공휴일)
    List<calendarResponseDTO> getMonthlyCalendar(Long projId, String startDate, String endDate);

    // 공공데이터 API를 호출하여 DB에 공휴일 데이터 적재 (초기 세팅용)
    void fetchAndSaveHolidays(String year);
    
    void registerEvent(calendarResponseDTO dto);
    List<Map<String, Object>> getSharedEvents(Long userId);
    boolean leaveProject(Long projId, Long userId);
}