package com.springboot.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IprojectService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/project")
@RequiredArgsConstructor
public class projectController {

    private final IprojectService projectService;

    @GetMapping("/create")
    public String showCreatePage(@RequestParam("wsId") Long wsId, Model model) {
        model.addAttribute("wsId", wsId); 
        return "project/projectCreate";
    }

    @PostMapping("/api/create")
    @ResponseBody
    public Map<String, Object> createProject(@RequestBody projectRequestDTO dto, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = (usersDto) session.getAttribute("user");
        
        if (loginUser == null) {
            response.put("status", "fail");
            response.put("message", "로그인이 필요합니다.");
            return response;
        }

        try {
            projectService.insertProject(dto, loginUser.getUserId());
            response.put("status", "success");
            // 만약 여기서 에러가 나면 dto.getProjId()를 dto.getProjectId()로 바꿔보거나
            // DTO에 @Getter가 있는지 확인해야 합니다.
            response.put("redirectUrl", "/project/main?projId=" + dto.getProjId());
        } catch (Exception e) {
            e.printStackTrace(); // 에러 원인을 콘솔에 찍어줍니다.
            response.put("status", "error");
        }
        return response;
    }

 // projectController.java 수정
    @GetMapping("/main")
    public String projectMainPage(@RequestParam("projId") Long projId, 
                                 @RequestParam("wsId") Long wsId, 
                                 Model model) {
        
        // 현재 프로젝트에 속한 멤버 리스트 조회 (Service 호출)
        List<Map<String, Object>> projectMemberList = projectService.getProjectMembers(projId);
        
        model.addAttribute("projId", projId);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projectMemberList", projectMemberList); // 이 이름으로 JSP에서 사용
        
        return "project/projectMain";
    }
 // 1. 초대 가능한 멤버 목록 조회 (GET)
    @GetMapping("/api/assignable-members")
    @ResponseBody
    public List<Map<String, Object>> getAssignableMembers(
            @RequestParam("wsId") Long wsId, 
            @RequestParam("projId") Long projId) {
        
        // 조차 시에는 userIds가 필요 없으므로 wsId와 projId만 넘깁니다.
        return projectService.getAssignableMembers(wsId, projId);
    }

    // 2. 선택한 멤버 프로젝트에 추가 (POST)
    @PostMapping("/api/add-members")
    @ResponseBody
    public String addMembers(
            @RequestParam("projId") Long projId, 
            @RequestParam("userIds") List<Long> userIds) {
        
        boolean isAdded = projectService.addProjectMembers(projId, userIds);
        
        if (isAdded) {
            return "SUCCESS";
        } else {
            return "ALREADY_EXISTS";
        }
    }
}