package com.springboot.project.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.springboot.project.dto.userNoticeDTO;

@Mapper
public interface IuserNoticeDAO {
    // 1. 기존 메서드
    void insertAlarm(@Param("userId") Long userId, @Param("noticeId") Long noticeId);
    
    // 2. 목록 조회
    List<userNoticeDTO> selectMyNotices(@Param("userId") Long userId);
    
    // 3. ★ 읽음 처리 추가 (이게 필요합니다!)
    void updateAlarmRead(@Param("alarmId") Long alarmId);
}