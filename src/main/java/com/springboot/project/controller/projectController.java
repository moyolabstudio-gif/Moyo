package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.postDTO;
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
            response.put("redirectUrl",
            	    "/project/main?projId=" + dto.getProjId()
            	    + "&wsId=" + dto.getWsId());
        } catch (Exception e) {
            e.printStackTrace(); // 에러 원인을 콘솔에 찍어줍니다.
            response.put("status", "error");
        }
        return response;
    }

 // projectController.java 수정본

    @GetMapping("/main")
    public String projectMainPage(@RequestParam("projId") Long projId, 
                                  @RequestParam("wsId") Long wsId, 
                                  Model model) {
        
        // 1. [추가] 프로젝트 상세 정보 조회 (제목, 설명 등 가져오기)
        projectRequestDTO projectDetail = projectService.getProjectById(projId); 
        
        System.out.println("START_DATE = " + projectDetail.getStartDate());
        System.out.println("END_DATE = " + projectDetail.getEndDate());
        // 2. 기존 로직
        List<Map<String, Object>> projectMemberList = projectService.getProjectMembers(projId);
        Map<String, Object> taskSummary = projectService.getProjectTaskSummary(projId);
        
        // 3. 모델에 추가
        model.addAttribute("projectDetail", projectDetail); 
        model.addAttribute("projId", projId);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projectMemberList", projectMemberList);
        model.addAttribute("taskSummary", taskSummary);
        
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
    @GetMapping("/api/tasks")
    @ResponseBody
    public List<Map<String, Object>> getTasks(@RequestParam("projId") Long projId) {
        return projectService.getProjectTasks(projId);
    }
    
    @PostMapping("/api/add-task")
    @ResponseBody
    public String addTask(
        @RequestParam("projId") Long projId,
        @RequestParam("wsId") Long wsId,
        @RequestParam("title") String title,
        @RequestParam("startDate") String startDate, // 추가
        @RequestParam("endDate") String endDate,
        @RequestParam("status") String status,
        HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");

        boolean result = projectService.addTask(
            projId,
            wsId,
            loginUser.getUserId(),
            title,
            startDate,
            endDate,
            status
        );

        return result ? "SUCCESS" : "FAIL";
    }
    @GetMapping("/api/task-detail")
    @ResponseBody
    public Map<String, Object> getTaskDetail(@RequestParam("taskId") Long taskId) {
        return projectService.getTaskDetail(taskId); // 서비스에서 DB 조회 쿼리 실행
    }
    @PostMapping("/api/update-task")
    @ResponseBody
    public String updateTask(
            @RequestParam("taskId") Long taskId,
            @RequestParam("title") String title,
            @RequestParam("startDate") String startDate, // 추가
            @RequestParam("endDate") String endDate,
            @RequestParam("status") String status) {

        // 서비스의 updateTask 메서드도 startDate를 받도록 수정해야 합니다.
        boolean result = projectService.updateTask(taskId, title, startDate, endDate, status);
        return result ? "SUCCESS" : "FAIL";
    }
 // ProjectController.java
    @PostMapping("/api/delete-task")
    @ResponseBody
    public String deleteTask(@RequestParam("taskId") long taskId) {
        boolean isDeleted = projectService.deleteTask(taskId);
        return isDeleted ? "SUCCESS" : "FAIL";
    }
    @PostMapping("/api/update-task-status")
    @ResponseBody
    public String updateTaskStatus(
            @RequestParam("taskId") Long taskId,
            @RequestParam("status") String status) {

        System.out.println("컨트롤러 진입");

        boolean result =
            projectService.updateTaskStatus(taskId, status);

        return result ? "SUCCESS" : "FAIL";
    }
    @PostMapping("/api/delete-project")
    @ResponseBody
    public String deleteProject(@RequestParam("projId") Long projId, HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "FAIL";

        boolean isDeleted = projectService.deleteProject(projId, loginUser.getUserId());
        return isDeleted ? "SUCCESS" : "FAIL";
    }

    @PostMapping("/api/update-project")
    @ResponseBody
    public String updateProject(@RequestBody projectRequestDTO dto, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        
        // 여기서도 dto의 리더 ID와 loginUser를 비교하는 로직을 넣으면 더 완벽합니다.
        boolean isUpdated = projectService.updateProject(dto);
        return isUpdated ? "SUCCESS" : "FAIL";
    }

}