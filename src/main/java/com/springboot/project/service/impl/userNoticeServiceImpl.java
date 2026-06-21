package com.springboot.project.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.userNoticeDTO;
import com.springboot.project.service.userNoticeService;

@Service
public class userNoticeServiceImpl implements userNoticeService {

    @Autowired
    private IuserNoticeDAO userNoticeDAO;

    @Override
    public List<userNoticeDTO> getMyNotices(Long userId) {
        return userNoticeDAO.selectMyNotices(userId);
    }

    @Override
    public void markAsRead(Long alarmId) {
        userNoticeDAO.updateAlarmRead(alarmId);
    }
}