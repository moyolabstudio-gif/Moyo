package com.springboot.project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IprojectAuthorizationService;

import jakarta.servlet.http.HttpSession;

@Controller
public class pollPageController {

    private final IprojectAuthorizationService projectAuthorizationService;

    public pollPageController(IprojectAuthorizationService projectAuthorizationService) {
        this.projectAuthorizationService = projectAuthorizationService;
    }

    @GetMapping("/poll/list")
    public String pollList(@RequestParam(value = "scope", required = false) String scope,
                           @RequestParam(value = "projId", required = false) Long projId,
                           Model model,
                           HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        boolean projectReadOnly = user != null
                && "PROJECT".equalsIgnoreCase(scope)
                && projId != null
                && projectAuthorizationService.isProjectReadOnly(projId, user.getUserId());
        model.addAttribute("projectReadOnly", projectReadOnly);
        return "poll/pollList";
    }
}
