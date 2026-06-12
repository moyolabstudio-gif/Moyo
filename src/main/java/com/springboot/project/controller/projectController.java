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
import com.springboot.project.service.IworkspaceService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/project")
@RequiredArgsConstructor
public class projectController {

    private final IprojectService projectService;
    private final IworkspaceService workspaceService;

    @GetMapping("/create")
    public String showCreatePage(@RequestParam("wsId") Long wsId, Model model) {
        model.addAttribute("wsId", wsId); 
        return "project/projectCreate";
    }


    @GetMapping("/list")
    public String projectListPage(@RequestParam("wsId") Long wsId,
                                  HttpSession session,
                                  Model model) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        session.setAttribute("currentWsId", wsId);
        model.addAttribute("workspace", workspaceService.getWorkspaceDetail(wsId));
        model.addAttribute("projects", projectService.getProjectListByWorkspaceId(wsId));
        return "project/projectList";
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
            dto.setWsId(dto.getWsId() != null ? dto.getWsId() : (Long) session.getAttribute("currentWsId"));
            projectService.insertProject(dto, loginUser.getUserId());
            response.put("status", "success");
            response.put("projId", dto.getProjId());
            response.put("redirectUrl",
                    "/project/main?projId=" + dto.getProjId()
                    + "&wsId=" + dto.getWsId());
        } catch (Exception e) {
            e.printStackTrace();
            response.put("status", "error");
            response.put("message", e.getMessage() == null
                    ? "프로젝트 생성 중 서버 오류가 발생했습니다."
                    : e.getMessage());
        }
        return response;
    }

 // projectController.java 수정본

    @GetMapping("/main")
    public String projectMainPage(@RequestParam("projId") Long projId,
                                  @RequestParam("wsId") Long wsId,
                                  Model model,
                                  HttpSession session) {
        
        // 1. [추가] 프로젝트 상세 정보 조회 (제목, 설명 등 가져오기)
        projectRequestDTO projectDetail = projectService.getProjectById(projId); 
        
        System.out.println("START_DATE = " + projectDetail.getStartDate());
        System.out.println("END_DATE = " + projectDetail.getEndDate());
        // 2. 기존 로직
        List<Map<String, Object>> projectMemberList = projectService.getProjectMembers(projId);
        Map<String, Object> taskSummary = projectService.getProjectTaskSummary(projId);
        
        // 3. 모델에 추가
        model.addAttribute("projectDetail", projectDetail); 
        model.addAttribute("projectLinks", projectService.getProjectLinks(projId));
        model.addAttribute("projId", projId);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projectMemberList", projectMemberList);
        model.addAttribute("taskSummary", taskSummary);
        
        return "project/projectMain";
    }

    @GetMapping("/settings")
    public String projectSettingsPage(
            @RequestParam("projId") Long projId,
            @RequestParam("wsId") Long wsId,
            Model model,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        projectRequestDTO projectDetail = projectService.getProjectById(projId);
        List<Map<String, Object>> projectMemberList = projectService.getProjectMembers(projId);

        model.addAttribute("projectDetail", projectDetail);
        model.addAttribute("projectLinks", projectService.getProjectLinks(projId));
        model.addAttribute("projId", projId);
        model.addAttribute("wsId", wsId);
        boolean isProjectLeader = projectDetail != null
                && projectDetail.getLeaderId() != null
                && projectDetail.getLeaderId().equals(loginUser.getUserId());

        model.addAttribute("projectMemberList", projectMemberList);
        model.addAttribute("canManageProject", isProjectAdmin(projId, loginUser.getUserId()));
        model.addAttribute("isProjectLeader", isProjectLeader);
        model.addAttribute("currentUserId", loginUser.getUserId());

        return "project/projectSettings";
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
            @RequestParam("userIds") List<Long> userIds,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        if (!isProjectAdmin(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        boolean isAdded = projectService.addProjectMembers(projId, userIds);

        if (isAdded) {
            return "SUCCESS";
        } else {
            return "ALREADY_EXISTS";
        }
    }


    @PostMapping("/api/transfer-leader")
    @ResponseBody
    public String transferProjectLeader(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long newLeaderId,
            @RequestParam(value = "projPosition", required = false) String projPosition,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) {
            return "PROJECT_NOT_FOUND";
        }

        // 팀장 권한 위임은 현재 팀장만 가능하다.
        if (project.getLeaderId() == null
                || !project.getLeaderId().equals(loginUser.getUserId())) {
            return "LEADER_ONLY";
        }

        if (project.getLeaderId().equals(newLeaderId)) {
            return "SAME_LEADER";
        }

        boolean targetExists = projectService.getProjectMembers(projId)
                .stream()
                .anyMatch(member -> {
                    Object value = member.get("USER_ID");
                    return value != null
                            && Long.valueOf(String.valueOf(value)).equals(newLeaderId);
                });

        if (!targetExists) {
            return "MEMBER_NOT_FOUND";
        }

        String safePosition = projPosition == null ? null : projPosition.trim();
        if (safePosition != null && safePosition.length() > 100) {
            safePosition = safePosition.substring(0, 100);
        }

        boolean result = projectService.updateProjectMemberSetting(
                projId,
                newLeaderId,
                safePosition,
                "LEADER"
        );

        return result ? "SUCCESS" : "FAIL";
    }

    @PostMapping("/api/remove-member")
    @ResponseBody
    public String removeMember(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long userId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        if (!isProjectAdmin(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project != null && project.getLeaderId() != null && project.getLeaderId().equals(userId)) {
            return "CANNOT_REMOVE_LEADER";
        }

        boolean result = projectService.removeProjectMember(projId, userId);
        return result ? "SUCCESS" : "FAIL";
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
        @RequestParam(value = "startDate", required = false) String startDate,
        @RequestParam(value = "endDate", required = false) String endDate,
        @RequestParam(value = "status", defaultValue = "TODO") String status,
        @RequestParam(value = "useTime", defaultValue = "N") String useTime,
        @RequestParam(value = "startTime", required = false) String startTime,
        @RequestParam(value = "endTime", required = false) String endTime,
        @RequestParam(value = "startTimeSlot", defaultValue = "AM") String startTimeSlot,
        @RequestParam(value = "endTimeSlot", defaultValue = "PM") String endTimeSlot,
        @RequestParam(value = "assignedUserId", required = false) Long assignedUserId,
        @RequestParam(value = "loginUserId", required = false) Long loginUserId,
        HttpSession session) {

        usersDto loginUser = getLoginUserFromSessionOrRequest(session, loginUserId);

        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        Long taskUserId = loginUser.getUserId();

        // 관리자만 다른 멤버에게 업무를 지정할 수 있습니다.
        if (assignedUserId != null && isProjectAdmin(projId, loginUser.getUserId())) {
            taskUserId = assignedUserId;
        }

        boolean taskUseTime = "Y".equalsIgnoreCase(String.valueOf(useTime));
        startTimeSlot = taskUseTime ? "TIME" : "NONE";
        endTimeSlot = taskUseTime ? "TIME" : "NONE";
        if (!taskUseTime) {
            startTime = null;
            endTime = null;
        }

        boolean result = projectService.addTask(
            projId,
            wsId,
            taskUserId,
            title,
            startDate,
            endDate,
            status,
            startTime,
            endTime,
            startTimeSlot,
            endTimeSlot
        );

        return result ? "SUCCESS" : "FAIL";
    }
    @PostMapping("/api/add-schedule")
    @ResponseBody
    public String addProjectSchedule(
            @RequestParam("projId") Long projId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("title") String title,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "status", defaultValue = "TODO") String status,
            @RequestParam(value = "useTime", defaultValue = "N") String useTime,
            @RequestParam(value = "startTime", required = false) String startTime,
            @RequestParam(value = "endTime", required = false) String endTime,
            @RequestParam(value = "color", defaultValue = "#4A90E2") String color,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");

        System.out.println("==== 프로젝트 일정 추가 요청 ====");
        System.out.println("loginUser = " + loginUser);
        System.out.println("projId = " + projId);
        System.out.println("wsId = " + wsId);
        System.out.println("title = " + title);
        System.out.println("startDate = " + startDate);
        System.out.println("endDate = " + endDate);
        System.out.println("status = " + status);
        System.out.println("color = " + color);

        if (loginUser == null) {
            System.out.println("일정 추가 실패: 로그인 유저 없음");
            return "LOGIN_FAIL";
        }

        boolean scheduleUseTime = "Y".equalsIgnoreCase(String.valueOf(useTime));
        String startTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        String endTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        if (!scheduleUseTime) {
            startTime = null;
            endTime = null;
        }

        boolean result = projectService.addProjectSchedule(
                projId,
                wsId,
                loginUser.getUserId(),
                title,
                startDate,
                endDate,
                status,
                color,
                startTime,
                endTime,
                startTimeSlot,
                endTimeSlot
        );

        System.out.println("일정 추가 결과 = " + result);

        return result ? "SUCCESS" : "INSERT_FAIL";
    }
    @GetMapping("/api/schedule-detail")
    @ResponseBody
    public Map<String, Object> getProjectScheduleDetail(
            @RequestParam("scheduleId") Long scheduleId) {

        return projectService.getProjectScheduleDetail(scheduleId);
    }

    @PostMapping("/api/update-schedule")
    @ResponseBody
    public String updateProjectSchedule(
            @RequestParam("scheduleId") Long scheduleId,
            @RequestParam("title") String title,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "status", defaultValue = "TODO") String status,
            @RequestParam(value = "useTime", defaultValue = "N") String useTime,
            @RequestParam(value = "startTime", required = false) String startTime,
            @RequestParam(value = "endTime", required = false) String endTime,
            @RequestParam(value = "color", defaultValue = "#4A90E2") String color) {

        boolean scheduleUseTime = "Y".equalsIgnoreCase(String.valueOf(useTime));
        String startTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        String endTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        if (!scheduleUseTime) {
            startTime = null;
            endTime = null;
        }

        boolean result = projectService.updateProjectSchedule(
                scheduleId,
                title,
                startDate,
                endDate,
                status,
                color,
                startTime,
                endTime,
                startTimeSlot,
                endTimeSlot
        );

        return result ? "SUCCESS" : "FAIL";
    }

    @PostMapping("/api/delete-schedule")
    @ResponseBody
    public String deleteProjectSchedule(
            @RequestParam("scheduleId") Long scheduleId) {

        boolean result = projectService.deleteProjectSchedule(scheduleId);

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
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "status", defaultValue = "TODO") String status,
            @RequestParam(value = "useTime", defaultValue = "N") String useTime,
            @RequestParam(value = "startTime", required = false) String startTime,
            @RequestParam(value = "endTime", required = false) String endTime,
            @RequestParam(value = "startTimeSlot", defaultValue = "AM") String startTimeSlot,
            @RequestParam(value = "endTimeSlot", defaultValue = "PM") String endTimeSlot,
            @RequestParam(value = "assignedUserId", required = false) Long assignedUserId,
            @RequestParam(value = "loginUserId", required = false) Long loginUserId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        Map<String, Object> task = projectService.getTaskDetail(taskId);
        if (task == null) {
            return "FAIL";
        }

        Long projId = toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        Long currentTaskUserId = toLong(getMapValueIgnoreCase(task, "USER_ID"));

        boolean isAdmin = isProjectAdmin(projId, loginUser.getUserId());
        boolean isOwner = currentTaskUserId != null && currentTaskUserId.equals(loginUser.getUserId());

        if (!isAdmin && !isOwner) {
            return "NO_PERMISSION";
        }

        Long taskUserId;

        // 담당자 select는 관리자/팀장에게만 보이지만,
        // 서버에서도 관리자만 다른 사람으로 변경할 수 있게 처리합니다.
        if (isAdmin && assignedUserId != null) {
            taskUserId = assignedUserId;
        } else if (currentTaskUserId != null) {
            taskUserId = currentTaskUserId;
        } else {
            taskUserId = loginUser.getUserId();
        }

        boolean taskUseTime = "Y".equalsIgnoreCase(String.valueOf(useTime));
        startTimeSlot = taskUseTime ? "TIME" : "NONE";
        endTimeSlot = taskUseTime ? "TIME" : "NONE";
        if (!taskUseTime) {
            startTime = null;
            endTime = null;
        }

        boolean result = projectService.updateTask(
                taskId,
                title,
                startDate,
                endDate,
                status,
                taskUserId,
                startTime,
                endTime,
                startTimeSlot,
                endTimeSlot
        );

        return result ? "SUCCESS" : "FAIL";
    }
 // ProjectController.java
    @PostMapping("/api/delete-task")
    @ResponseBody
    public String deleteTask(@RequestParam("taskId") long taskId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        Map<String, Object> task = projectService.getTaskDetail(taskId);
        if (task == null) {
            return "FAIL";
        }

        Long projId = toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        Long currentTaskUserId = toLong(getMapValueIgnoreCase(task, "USER_ID"));

        boolean isAdmin = isProjectAdmin(projId, loginUser.getUserId());
        boolean isOwner = currentTaskUserId != null && currentTaskUserId.equals(loginUser.getUserId());

        if (!isAdmin && !isOwner) {
            return "NO_PERMISSION";
        }

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
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null
                || project.getLeaderId() == null
                || !project.getLeaderId().equals(loginUser.getUserId())) {
            return "LEADER_ONLY";
        }

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
 // 프로젝트 멤버 조회 API (추가)

    @GetMapping("/api/member-profile")
    @ResponseBody
    public ResponseEntity<?> getProjectMemberProfile(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long targetUserId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        }

        Map<String, Object> profile = projectService.getProjectMemberProfile(
                projId, targetUserId, loginUser.getUserId());

        if (profile == null || profile.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "NOT_FOUND"));
        }

        // 프로필 모달에서는 본인의 프로젝트 역할만 수정한다.
        // 다른 멤버의 권한/역할 수정은 프로젝트 설정 > 멤버 관리에서 처리한다.
        profile.put("CAN_EDIT_PROJECT_ROLE",
                targetUserId.equals(loginUser.getUserId()));

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/api/member-profile/position")
    @ResponseBody
    public String updateProjectMemberProfilePosition(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long targetUserId,
            @RequestParam(value = "projPosition", required = false) String projPosition,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "LOGIN_REQUIRED";

        // 프로필 모달 저장 API도 본인 역할 수정만 허용한다.
        if (!targetUserId.equals(loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        String safePosition = projPosition == null ? null : projPosition.trim();
        if (safePosition != null && safePosition.length() > 100) {
            safePosition = safePosition.substring(0, 100);
        }
        if (safePosition != null && safePosition.isEmpty()) {
            safePosition = null;
        }

        return projectService.updateProjectMemberPosition(
                projId, targetUserId, safePosition) ? "SUCCESS" : "FAIL";
    }

    @GetMapping("/api/members")
    @ResponseBody
    public List<Map<String, Object>> getProjectMembersApi(@RequestParam("projId") Long projId) {
        return projectService.getProjectMembers(projId);
    }
    
    
    @PostMapping("/api/update-member-setting")
    @ResponseBody
    public String updateProjectMemberSetting(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "projPosition", required = false) String projPosition,
            @RequestParam(value = "projRole", defaultValue = "MEMBER") String projRole,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        if (!isProjectAdmin(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        String safeRole = projRole == null ? "MEMBER" : projRole.trim().toUpperCase();
        if (!"MEMBER".equals(safeRole) && !"ADMIN".equals(safeRole) && !"LEADER".equals(safeRole)) {
            return "INVALID_ROLE";
        }

        projectRequestDTO project = projectService.getProjectById(projId);
        boolean currentUserIsLeader = project != null
                && project.getLeaderId() != null
                && project.getLeaderId().equals(loginUser.getUserId());

        if ("LEADER".equals(safeRole) && !currentUserIsLeader) {
            return "LEADER_ONLY";
        }

        if (project != null
                && project.getLeaderId() != null
                && project.getLeaderId().equals(userId)
                && !"LEADER".equals(safeRole)) {
            return "LEADER_ROLE_LOCKED";
        }

        String safePosition = projPosition == null ? null : projPosition.trim();
        if (safePosition != null && safePosition.length() > 100) {
            safePosition = safePosition.substring(0, 100);
        }

        boolean result = projectService.updateProjectMemberSetting(projId, userId, safePosition, safeRole);
        return result ? "SUCCESS" : "FAIL";
    }


@PostMapping("/api/update-member-position")
    @ResponseBody
    public String updateProjectMemberPosition(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "projPosition", required = false) String projPosition,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        if (!isProjectAdmin(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        String safePosition = projPosition == null ? null : projPosition.trim();
        if (safePosition != null && safePosition.length() > 100) {
            safePosition = safePosition.substring(0, 100);
        }

        boolean result = projectService.updateProjectMemberPosition(projId, userId, safePosition);
        return result ? "SUCCESS" : "FAIL";
    }

@GetMapping("/api/schedules")
    @ResponseBody
    public List<Map<String, Object>> getProjectSchedules(@RequestParam("projId") Long projId) {
        return projectService.getProjectSchedules(projId);
    }


    private boolean isProjectAdmin(Long projId, Long userId) {
        if (projId == null || userId == null) {
            return false;
        }

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project != null && project.getLeaderId() != null && userId.equals(project.getLeaderId())) {
            return true;
        }

        List<Map<String, Object>> members = projectService.getProjectMembers(projId);

        if (members == null) {
            return false;
        }

        for (Map<String, Object> member : members) {
            Long memberUserId = toLong(member.get("USER_ID"));
            String role = String.valueOf(member.get("PROJ_ROLE"));

            if (userId.equals(memberUserId)
                    && ("ADMIN".equalsIgnoreCase(role)
                        || "LEADER".equalsIgnoreCase(role)
                        || "OWNER".equalsIgnoreCase(role)
                        || "PM".equalsIgnoreCase(role))) {
                return true;
            }
        }

        return false;
    }

    
    private Object getMapValueIgnoreCase(Map<String, Object> map, String key) {
        if (map == null || key == null) {
            return null;
        }

        if (map.containsKey(key)) {
            return map.get(key);
        }

        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (entry.getKey() != null && key.equalsIgnoreCase(entry.getKey())) {
                return entry.getValue();
            }
        }

        return null;
    }


private Long toLong(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number) {
            return ((Number) value).longValue();
        }

        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    private usersDto getLoginUserFromSessionOrRequest(HttpSession session, Long loginUserId) {
        usersDto loginUser = (usersDto) session.getAttribute("user");

        if (loginUser != null) {
            return loginUser;
        }

        if (loginUserId == null) {
            return null;
        }

        usersDto fallbackUser = new usersDto();
        fallbackUser.setUserId(loginUserId);
        return fallbackUser;
    }


}
