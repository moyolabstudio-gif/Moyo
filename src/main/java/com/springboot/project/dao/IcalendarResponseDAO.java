package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.calendarResponseDTO;

@Mapper
public interface IcalendarResponseDAO {
    List<calendarResponseDTO> getMonthlyCalendar(
        @Param("projId") Long projId,
        @Param("startDate") String startDate,
        @Param("endDate") String endDate
    );
    
 // 공휴일 정보 저장
    int insertHoliday(calendarResponseDTO holiday);
    
    // 중복 저장 방지를 위해 해당 날짜에 데이터가 있는지 확인
    int checkHolidayExists(String hldDate);
    
    void registerEvent(calendarResponseDTO dto);
}