package com.springboot.project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class calendarPageController {

    @GetMapping("/calendar")
    public String goCalendarPage() {
        return "calendar"; 
    }
}
