package com.springboot.project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.springboot.project.dto.noticeDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.noticeService;


@Controller
public class noticeController {

    @Autowired
    private noticeService noticeService; 

    @GetMapping("/common/noticeList")
    public String notificationList(Model model) {	
        model.addAttribute("noticeList", noticeService.getNoticeList());
        return "common/noticeList"; 
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/notice/writeForm")
    public String writeForm() {
        return "admin/noticeWrite"; 
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/notice/save")
    public String saveNotice(noticeDTO notice, Authentication authentication) {
        Object principal = authentication == null ? null : authentication.getPrincipal();
        if (!(principal instanceof usersDto user)) {
            throw new IllegalStateException("관리자 인증 정보를 확인할 수 없습니다.");
        }

        // 공지 작성자는 요청값이 아니라 현재 인증된 관리자 ID로 강제한다.
        notice.setUserId(user.getUserId());
        noticeService.writeNotice(notice);
        return "redirect:/common/noticeList";
    }
 // 수정 페이지 진입
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/notice/noticeEdit")
    public String noticeEdit(@RequestParam("noticeId") Long noticeId, Model model) {
        model.addAttribute("notice", noticeService.getNoticeById(noticeId));
        return "admin/noticeEdit"; // 파일명이 noticeEdit.jsp 라고 하셨죠!
    }

    // 수정 처리
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/notice/noticeUpdate")
    public String noticeUpdate(noticeDTO notice) {
        noticeService.updateNotice(notice);
        return "redirect:/common/noticeList";
    }

    // 삭제 처리
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/notice/delete")
    public String deleteNotice(@RequestParam("noticeId") Long noticeId) {
        noticeService.deleteNotice(noticeId);
        return "redirect:/common/noticeList";
    }
}