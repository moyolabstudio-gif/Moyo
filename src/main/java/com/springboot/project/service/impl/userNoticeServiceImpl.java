package com.springboot.project.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.userNoticeDTO;
import com.springboot.project.service.userNoticeService;

@Service
public class userNoticeServiceImpl implements userNoticeService {

    @Value("${moyo.schema.runtime-ddl-enabled:false}")
    private boolean runtimeDdlEnabled;

    @Autowired
    private IuserNoticeDAO userNoticeDAO;

    @Override
    public List<userNoticeDTO> getMyNotices(Long userId) {
        ensureUserNoticeCommonColumns();
        return userNoticeDAO.selectMyNotices(userId);
    }

    @Override
    public void markAsRead(Long alarmId, Long userId) {
        if (alarmId == null || userId == null) return;
        ensureUserNoticeCommonColumns();
        userNoticeDAO.updateAlarmRead(alarmId, userId);
    }

    private void ensureUserNoticeCommonColumns() {
        if (!runtimeDdlEnabled) return;
        try {
            userNoticeDAO.ensureUserNoticeCommonColumns();
        } catch (Exception e) {
            System.err.println("공통 사용자 알림 컬럼 확인 중 오류: " + e.getMessage());
        }
    }
}