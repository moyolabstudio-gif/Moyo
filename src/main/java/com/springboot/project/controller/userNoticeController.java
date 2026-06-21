package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.userNoticeDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.userNoticeService;

import jakarta.servlet.http.HttpSession;

@Controller
public class userNoticeController {

    @Autowired
    private userNoticeService userNoticeService;

    // 1. 알림 목록을 가져오는 GET 메서드 추가! (이게 없어서 404가 났던 거예요)
    @GetMapping("/api/alarm/list")
    @ResponseBody
    public List<userNoticeDTO> getAlarmList(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return new ArrayList<>();
        return userNoticeService.getMyNotices(user.getUserId());
    }

    // 2. 읽음 처리 POST 메서드
    @PostMapping("/api/alarm/read")
    @ResponseBody
    public String readAlarm(@RequestParam("alarmId") Long alarmId) {
        userNoticeService.markAsRead(alarmId);
        return "success";
    }
}