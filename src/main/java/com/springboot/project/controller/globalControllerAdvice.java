package com.springboot.project.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import com.springboot.project.dao.IworkspaceDAO; // 본인의 DAO 인터페이스 임포트
import com.springboot.project.dto.workspaceDTO;  // 본인의 DTO 임포트
import com.springboot.project.dto.usersDto;      // 세션 유저 DTO 임포트
import jakarta.servlet.http.HttpSession;

@ControllerAdvice
public class globalControllerAdvice {

    @Autowired
    private IworkspaceDAO workspaceDAO; // 여기에 IworkspaceDAO를 주입받습니다.

    @ModelAttribute("userWorkspaces")
    public List<workspaceDTO> getUserWorkspaces(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        
        // 로그인한 유저가 있을 때만 목록을 조회합니다.
        if (user != null) {
            // IworkspaceDAO에 정의된 메서드 호출
            return workspaceDAO.selectWorkspaceList(user.getUserId()); 
        }
        return null;
    }
}