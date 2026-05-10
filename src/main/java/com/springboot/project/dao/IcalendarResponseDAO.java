package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.calendarResponseDTO;

@Mapper
public interface IcalendarResponseDAO {
	List<calendarResponseDTO> getMonthlyEvents(
	        @Param("userId") Long userId,
	        @Param("wsId") Long wsId,
	        @Param("projId") Long projId,
	        @Param("types") List<String> types,
	        @Param("startDate") String startDate,
	        @Param("endDate") String endDate
	    );
    
 // 공휴일 정보 저장
    int insertHoliday(calendarResponseDTO holiday);
    
    // 중복 저장 방지를 위해 해당 날짜에 데이터가 있는지 확인
    int checkHolidayExists(String hldDate);
    
    void registerEvent(calendarResponseDTO dto);
    int deleteEvent(Map<String, Object> params);
    int deleteEventWithOption(Map<String, Object> params);
    String getRecurGroupStartDate(String recurGroupId);
    int updateEventDate(Map<String, Object> params);
    int updateEventAll(Map<String, Object> params);
    int updateRecurringEvents(Map<String, Object> params);
    List<Map<String, Object>> getSharedEvents(@Param("userId") Long userId);
    
    int leaveProject(@Param("projId") Long projId, @Param("userId") Long userId);
    List<Map<String, Object>> selectUserWorkspaces(long userId); // int -> long
    List<Map<String, Object>> selectUserProjects(long userId);
}