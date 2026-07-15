package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model; // Model import 추가
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryDTO;
import com.springboot.project.service.IcsService;

@Controller
public class commonPageController {

    @Autowired
    private IcsService csService; // 카테고리 조회를 위해 필요

    @GetMapping("/common/privacyPolicy")
    public String privacyPolicy() {
        return "common/privacyPolicy";
    }

    // 추가된 부분: 문의하기 페이지
    @GetMapping("/common/inquiry")
    public String inquiryForm(Model model) {
        // DB에서 카테고리 목록을 가져와서 model에 담아 JSP로 전달
        model.addAttribute("categoryList", csService.getCategoryList());
        return "common/inquiry";
    }
    
    @PostMapping("/common/inquiry/send")
    @ResponseBody 
    public String sendInquiry(@RequestBody csInquiryDTO inquiry) {
        try {
            csService.registerInquiry(inquiry);
            return "success"; // 성공 시 문자열 반환
        } catch (Exception e) {
            e.printStackTrace();
            return "fail"; // 실패 시 실패 문자열 반환
        }
    }
    
 // commonPageController.java
    @GetMapping("/common/inquiry/messages")
    @ResponseBody
    public List<csInquiryDTO> getMessages(@RequestParam("userId") Long userId) { // ("userId") 추가!
        return csService.getMessagesByUserId(userId);
    }
}