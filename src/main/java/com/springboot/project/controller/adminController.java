package com.springboot.project.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dao.IcsDAO;
import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.usersDto;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/admin")
public class adminController {

    @Autowired
    private IusersDao usersDao; // 사용자 목록 조회를 위해

    @Autowired
    private IcsDAO csDAO; 
    
    @GetMapping("/main")
    public String adminMain(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");
        
        // 권한 체크 
        if (user == null || !"ADMIN".equals(user.getUserRole())) {
            return "redirect:/"; // 권한 없으면 홈으로
        }
        
        // 전체 사용자 목록 가져오기
        List<usersDto> allUsers = usersDao.findAll();
        model.addAttribute("userList", allUsers);
        
        return "admin/adminMain"; // WEB-INF/views/admin/adminMain.jsp
    }
    
    @GetMapping("/getCsHistory")
    @ResponseBody // 중요: 페이지 이동이 아니라 JSON 데이터를 반환함
    public List<csDTO> getCsHistory(@RequestParam("userId") Long userId) {
        // 특정 유저의 상담 기록만 가져오는 서비스/DAO 메서드 호출
        List<csDTO> history = csDAO.findCsByUserId(userId);
        return history;
    }
}