package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.userNoticeDTO;

@Mapper
public interface IuserNoticeDAO {
    void ensureUserNoticeCommonColumns();

    void insertAlarm(@Param("userId") Long userId, @Param("noticeId") Long noticeId);

    void insertCalendarAttendeeAlarm(@Param("userId") Long userId,
                                     @Param("actorUserId") Long actorUserId,
                                     @Param("title") String title,
                                     @Param("content") String content,
                                     @Param("targetId") Long targetId,
                                     @Param("linkUrl") String linkUrl);

    void insertPhotoSendAlarm(@Param("userId") Long userId,
                              @Param("targetId") Long targetId,
                              @Param("title") String title,
                              @Param("content") String content,
                              @Param("linkUrl") String linkUrl);

    void insertContentSendAlarm(@Param("userId") Long userId,
                                @Param("alertType") String alertType,
                                @Param("targetType") String targetType,
                                @Param("targetId") Long targetId,
                                @Param("title") String title,
                                @Param("content") String content,
                                @Param("linkUrl") String linkUrl);

    List<userNoticeDTO> selectMyNotices(@Param("userId") Long userId);

    int updateAlarmRead(@Param("alarmId") Long alarmId, @Param("userId") Long userId);
}
