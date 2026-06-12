package com.springboot.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.UserService;
import com.springboot.project.service.AccountProfileImageService;

import jakarta.servlet.http.HttpSession;

@Controller
public class usersController {	
	@Autowired
	private UserService userService;

	@Autowired
	private AccountProfileImageService accountProfileImageService;

	@RequestMapping("/")
	public String root() {
		return "home";
	}
	
	@RequestMapping("/users/joinForm")
	public String join() {
		return "users/joinForm";
	}
	

	@GetMapping("/users/check-email")
	@ResponseBody
	public Map<String, Object> checkEmail(@RequestParam("email") String email) {
		Map<String, Object> result = new HashMap<>();

		String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
		boolean duplicated = !normalizedEmail.isEmpty()
				&& userService.isEmailDuplicated(normalizedEmail);

		result.put("duplicated", duplicated);
		result.put("available", !normalizedEmail.isEmpty() && !duplicated);
		return result;
	}

	@PostMapping("/users/join")
	public String join(usersDto user, HttpSession session) {
		String email = user.getEmail() == null ? "" : user.getEmail().trim();
		String password = user.getPwdHash() == null ? "" : user.getPwdHash().trim();

		if (email.isEmpty() || password.isEmpty()) {
			return "redirect:/users/joinForm?error=required";
		}
		if (userService.isEmailDuplicated(email)) {
			return "redirect:/users/joinForm?error=duplicate";
		}

		user.setEmail(email);
		user.setPwdHash(password);
		session.setAttribute("pendingJoinUser", user);
		return "redirect:/users/step2";
	}

	@GetMapping("/users/step2")
	public String step2(HttpSession session) {
		if (session.getAttribute("pendingJoinUser") == null) {
			return "redirect:/users/joinForm";
		}
		return "users/joinForm2";
	}

	@PostMapping("/users/completeJoin")
	public String completeJoin(
			@org.springframework.web.bind.annotation.RequestParam("userName") String userName,
			@org.springframework.web.bind.annotation.RequestParam(value = "profileImageData", required = false) String profileImageData,
			HttpSession session) {
		usersDto pendingUser = (usersDto) session.getAttribute("pendingJoinUser");
		if (pendingUser == null) {
			return "redirect:/users/joinForm";
		}

		String trimmedName = userName == null ? "" : userName.trim();
		if (trimmedName.isEmpty()) {
			return "redirect:/users/step2?error=name";
		}

		try {
			pendingUser.setUserName(trimmedName);
			pendingUser.setStatus("ACTIVE");
			pendingUser.setUserRole("USER");
			pendingUser.setProfileImagePath(accountProfileImageService.saveCroppedImage(profileImageData));
			userService.registerUser(pendingUser);

			usersDto fullUserInfo = userService.login(pendingUser);
			session.removeAttribute("pendingJoinUser");
			session.setAttribute("user", fullUserInfo);
			return "redirect:/calendar";
		} catch (IllegalArgumentException e) {
			return "redirect:/users/step2?error=image";
		} catch (java.io.IOException e) {
			return "redirect:/users/step2?error=save";
		}
	}

	@GetMapping("/users/loginForm")
	public String loginForm() {
		return "users/loginForm";
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
	
	@GetMapping("/users/mypage")
	public String myPage(HttpSession session, Model model) {
	    usersDto user = (usersDto) session.getAttribute("user");
	    if (user == null) return "redirect:/users/loginForm";

	    // 2. 리스트 선언부 수정 (W -> w)
	    List<workspaceDTO> wsList = userService.getWorkspacesByUserId(user.getUserId());
	    
	    model.addAttribute("wsList", wsList);
	    return "users/myPage";
	}
	
	@PostMapping("/users/updateProfile")
	@ResponseBody
	public Map<String, Object> updateProfile(@RequestBody usersDto updateDto, HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");

	    if (currentUser != null) {
	        // 1. 세션에 있는 ID를 DTO에 세팅 (보안상 중요)
	        updateDto.setUserId(currentUser.getUserId());
	        
	        // 2. 서비스 호출 (DB 수정)
	        userService.updateProfile(updateDto);
	        
	        // 3. 세션 갱신 (변경된 이름 반영)
	        currentUser.setUserName(updateDto.getUserName());
	        session.setAttribute("user", currentUser); 
	        
	        map.put("status", "success");
	    } else {
	        map.put("status", "fail");
	    }
	    return map;
	}

	@PostMapping("/users/withdraw")
	@ResponseBody
	public Map<String, Object> withdraw(HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");

	    if (currentUser != null) {
	        // 1. 상태값 변경 (Soft Delete)
	        currentUser.setStatus("QUIT");
	        
	        // 2. 서비스 호출
	        userService.updateProfile(currentUser);
	        
	        // 3. 세션 종료 (로그아웃 처리)
	        session.invalidate();
	        
	        map.put("status", "success");
	    } else {
	        map.put("status", "fail");
	    }
	    return map;
	}
	
	
	// 예시: UserController에 추가할 가짜/진짜 유저 API 리스트업
	@GetMapping("/users/api/list")
	@ResponseBody
	public List<usersDto> getUserApiList() {
	    // DB 매퍼를 이용해 내 정보를 제외한(또는 전체) 유저 리스트를 가져와 JSON 배열로 반환합니다.
	    return userService.getAllUsers(); 
	}
}
