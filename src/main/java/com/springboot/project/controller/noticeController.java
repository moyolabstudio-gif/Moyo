package com.springboot.project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import com.springboot.project.dto.noticeDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.noticeService;

import jakarta.servlet.http.HttpSession;

@Controller
public class noticeController {

    @Autowired
    private noticeService noticeService; 

    @GetMapping("/common/noticeList")
    public String notificationList(Model model) {	
        model.addAttribute("noticeList", noticeService.getNoticeList());
        return "common/noticeList"; 
    }
    
    @GetMapping("/admin/notice/writeForm")
    public String writeForm() {
        return "admin/noticeWrite"; 
    }

    @PostMapping("/admin/notice/save")
    public String saveNotice(noticeDTO notice, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        
        if (user != null) {
            // 객체에 ID값 직접 주입
            notice.setUserId(user.getUserId()); 
            System.out.println("디버깅: 세팅된 userId = " + notice.getUserId());
        } else {
            System.out.println("경고: 세션에 유저 정보가 없습니다!");
            return "redirect:/users/loginForm"; // 로그인 안 되어 있으면 로그인으로 돌려보내기
        }
        
        // 여기서 notice 객체의 userId를 한 번 더 체크하고 서비스 호출
        if (notice.getUserId() == null) {
            throw new RuntimeException("userId가 null이라서 공지를 등록할 수 없습니다.");
        }
        
        noticeService.writeNotice(notice);
        return "redirect:/common/noticeList";
    }
    
}