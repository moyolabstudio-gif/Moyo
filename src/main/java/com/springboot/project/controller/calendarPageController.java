package com.springboot.project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpSession;

@Controller
public class calendarPageController {

    @GetMapping("/calendar")
    public String goCalendarPage(
            HttpSession session,
            @RequestParam(value = "wsId", required = false) Long wsId,
            Model model) {
        
        // 1. 세션 방어 코드 보존
        if(session.getAttribute("user") == null) {
            return "redirect:/users/loginForm";
        }
        
        // 2. 대시보드 유입 시 파라미터 전달 브릿지 역할 추가
        if(wsId != null) {
            model.addAttribute("targetWsId", wsId);
        }
        
        return "calendar"; 
    }
}