package com.springboot.project.service;

import java.util.List;
import com.springboot.project.dto.userNoticeDTO;

public interface userNoticeService {
    List<userNoticeDTO> getMyNotices(Long userId);
    void markAsRead(Long alarmId);
}