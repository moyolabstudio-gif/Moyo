package com.springboot.project.service;

import java.util.List;
import java.util.Map;
import com.springboot.project.dto.calendarResponseDTO;

public interface IcalendarResponseService {
    // 캘린더 전체 일정 조회 (일반일정 + 공휴일)
    List<calendarResponseDTO> getMonthlyCalendar(Long userId, Long projId, Long wsId, List<String> types, String startDate, String endDate);

    // 공공데이터 API를 호출하여 DB에 공휴일 데이터 적재
    void fetchAndSaveHolidays(String year);
    
    // 일정 등록 (내부에서 반복 일정일 경우 UUID 생성 및 루프 처리)
    void registerEvent(calendarResponseDTO dto);

    // 💡 변경: 단일 삭제 및 반복 일정 전체 삭제를 위해 Map으로 파라미터 변경
    // params 구성: eventId, recurGroupId, deleteSeries('Y'/'N'), userId 등
    boolean deleteEvent(Map<String, Object> params);
    
    // 드래그 앤 드롭 등 날짜만 수정 시
    boolean updateEventDate(Map<String, Object> params);
    
    // 일정 상세 수정 (일반수정 및 반복 일정 전체 수정 대응)
    // params 구성: updateOption('ALL'/'ONE'), title, startDt, endDt, color, recurGroupId 등
    boolean updateEventAll(Map<String, Object> params);

    // 💡 추가: 반복 일정 그룹 전체 수정을 명시적으로 처리하고 싶을 때 (선택사항)
    boolean updateRecurringEvents(Map<String, Object> params);

    List<Map<String, Object>> getSharedEvents(Long userId);
    
    boolean leaveProject(Long projId, Long userId);
    
    List<Map<String, Object>> getWorkspacesByUserId(long userId); 
    
    List<Map<String, Object>> getProjectsByUserId(long userId);
    String checkUserRole(Long wsId, Long userId);

    List<calendarResponseDTO> getProfilePublicEvents(Long profileUserId, int limit);

    int countProfilePublicEvents(Long profileUserId);

    Map<String, Object> getEventDetailForView(Long eventId, Long userId);

    boolean canEditEvent(Long eventId, Long userId);
}