package com.springboot.project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class pollPageController {

    @GetMapping("/poll/list")
    public String pollList() {
        return "poll/pollList";
    }
}
