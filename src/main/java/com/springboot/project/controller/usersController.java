package com.springboot.project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.UserService;

import jakarta.servlet.http.HttpSession;

@Controller
public class usersController {	
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
	public String join(usersDto user, HttpSession session) {
		userService.registerUser(user);
		session.setAttribute("user", user);
		return "redirect:/users/step2";
	}
	
	@GetMapping("/users/step2")
		public String step2() {		
			return "users/joinForm2";
		}

	
	@GetMapping("/users/loginForm")
	public String loginForm() {
		return "users/loginForm";
	}
	
	@PostMapping("/users/completeJoin")
	public String completeJoin(usersDto user, HttpSession session) {
		usersDto currentUser = (usersDto) session.getAttribute("user");
		
		if (currentUser != null) {
			currentUser.setUserName(user.getUserName());
			currentUser.setStatus(user.getStatus());
			
			usersDto fullUserInfo = userService.completeJoinProcess(currentUser);
			
			session.setAttribute("user", fullUserInfo);
			return "redirect:/calendar";
		}
		return "redirect:/";
	}
	
	@PostMapping("/users/login")
	public String login(usersDto user, HttpSession session) {
		usersDto loginUser = userService.login(user);
		
		if (loginUser != null) {
			session.setAttribute("user", loginUser);
			return "redirect:/calendar";
		}
		return "redirect:/loginForm?error";
	}
	
	@GetMapping("/users/logout")
	public String logout(HttpSession session) {
		session.invalidate();
		return "redirect:/";
	}
}
