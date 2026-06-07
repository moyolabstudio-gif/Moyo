package com.springboot.project.controller;

import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.springboot.project.dto.usersDto;

@Controller
@RequestMapping("/project/work")
public class workPageController {

    /*
     * 업무 전체 페이지
     * /project/work/list?wsId=1&projId=42
     */
    @GetMapping("/list")
    public String workList(
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            Model model,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);

        return "project/workList";
    }
}
