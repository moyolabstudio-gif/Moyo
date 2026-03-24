package com.springboot.project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class UsersController {	
	@RequestMapping("/")
	public String root() {
		return "home";
	}
}
