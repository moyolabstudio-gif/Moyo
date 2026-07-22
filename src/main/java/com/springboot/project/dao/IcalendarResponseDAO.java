package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.calendarResponseDTO;

@Mapper
public interface IcalendarResponseDAO {
    void ensureCalendarEventTypeColumn();
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
    List<Long> selectEventIdsForDelete(Map<String, Object> params);
    int deleteEvent(Map<String, Object> params);
    int deleteEventAttendeesByEventIds(@Param("eventIds") List<Long> eventIds);
    int deleteEventExceptionsByEventIds(@Param("eventIds") List<Long> eventIds);
    int insertEventException(Map<String, Object> params);
    int endRecurringEventsBefore(Map<String, Object> params);
    int deleteEventWithOption(Map<String, Object> params);
    String getRecurGroupStartDate(String recurGroupId);
    int updateEventDate(Map<String, Object> params);
    int updateEventAll(Map<String, Object> params);
    int updateRecurringEvents(Map<String, Object> params);
    List<Map<String, Object>> getSharedEvents(@Param("userId") Long userId);
    List<calendarResponseDTO> selectProfilePublicEvents(@Param("profileUserId") Long profileUserId, @Param("limit") int limit);
    int countProfilePublicEvents(@Param("profileUserId") Long profileUserId);
    
    int leaveProject(@Param("projId") Long projId, @Param("userId") Long userId);
    List<Map<String, Object>> selectUserWorkspaces(long userId); // int -> long
    List<Map<String, Object>> selectUserProjects(long userId);
    String checkUserRole(Long wsId, Long userId);

    void ensureCalendarDetailColumns();

    Map<String, Object> selectEventDetailForView(@Param("eventId") Long eventId, @Param("userId") Long userId);

    int countEventEditPermission(@Param("eventId") Long eventId, @Param("userId") Long userId);

    void ensureCalendarAttendeeTable();

    List<Long> selectEventAttendeeIds(@Param("eventId") Long eventId);

    void deleteEventAttendees(@Param("eventId") Long eventId);

    int insertEventAttendee(@Param("eventId") Long eventId, @Param("userId") Long userId);

    List<Map<String, Object>> selectEventAttendeesForView(@Param("eventId") Long eventId);

    void ensureCalendarReminderColumns();
    List<Map<String, Object>> selectDueCalendarReminders();
    int insertCalendarReminderAlarms(Map<String, Object> params);
    int markCalendarReminderSent(@Param("eventId") Long eventId);
}
