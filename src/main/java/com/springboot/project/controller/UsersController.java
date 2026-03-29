package com.springboot.project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.springboot.project.dto.UsersDto;
import com.springboot.project.service.UserService;

@Controller
public class UsersController {	
	@Autowired
	private UserService userService;
	
	@RequestMapping("/")
	public String root() {
		return "home";
	}
	
	@RequestMapping("/users/joinForm")
	public String join() {
		return "users/joinForm";
	}
	
	@PostMapping("/users/join")
	public String join(UsersDto user) {
		userService.registerUser(user);
		return "redirect:/";
	}
}
