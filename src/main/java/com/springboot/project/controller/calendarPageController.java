package com.springboot.project.controller;

import org.springframework.stereotype.Controller;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IcalendarResponseService;

import lombok.RequiredArgsConstructor;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpSession;

@Controller
@RequiredArgsConstructor
public class calendarPageController {

    private final IcalendarResponseService calendarService;

    @GetMapping("/calendar")
    public String goCalendarPage(
            HttpSession session,
            @RequestParam(value = "wsId", required = false) Long wsId,
            Model model) {

        if (session.getAttribute("user") == null) {
            return "redirect:/users/loginForm";
        }

        if (wsId != null) {
            model.addAttribute("targetWsId", wsId);
        }

        return "calendar/calendar";
    }

    @GetMapping("/calendar/event/form")
    public String goCalendarEventForm(
            HttpSession session,
            @RequestParam(value = "mode", required = false) String mode,
            @RequestParam(value = "eventId", required = false) Long eventId,
            @RequestParam(value = "id", required = false) Long id) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        Long targetEventId = eventId != null ? eventId : id;
        if ("edit".equalsIgnoreCase(mode) && targetEventId != null
                && !calendarService.canEditEvent(targetEventId, loginUser.getUserId())) {
            return "redirect:/calendar?viewEventId=" + targetEventId;
        }

        return "calendar/calendarEventForm";
    }

    @GetMapping("/calendar/event/detail")
    public String goCalendarEventDetail(
            HttpSession session,
            @RequestParam(value = "eventId", required = false) Long eventId,
            @RequestParam(value = "id", required = false) Long id) {
        if (session.getAttribute("user") == null) {
            return "redirect:/users/loginForm";
        }
        Long targetEventId = eventId != null ? eventId : id;
        return targetEventId != null
                ? "redirect:/calendar?viewEventId=" + targetEventId
                : "redirect:/calendar";
    }
}
