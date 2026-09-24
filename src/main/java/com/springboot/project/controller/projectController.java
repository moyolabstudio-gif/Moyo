package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.Locale;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.postDTO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.projectPeriodPlanDTO;
import com.springboot.project.dto.projectPlanFeatureDTO;
import com.springboot.project.dto.projectPlanCalendarPrefDTO;
import com.springboot.project.dto.projectTimePlanDTO;
import com.springboot.project.dto.projectWeeklyPlanDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.service.IworkspaceService;
import com.springboot.project.service.IfriendService;
import com.springboot.project.service.InoteService;
import com.springboot.project.service.CollaborationActivityService;
import com.springboot.project.service.ProjectPolicy;
import com.springboot.project.service.ProjectTypeCatalog;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/project")
public class projectController {

    private final IprojectService projectService;
    private final IprojectAuthorizationService projectAuthorizationService;
    private final IworkspaceService workspaceService;
    private final IfriendService friendService;
    private final IworkspaceDAO workspaceDAO;
    private final InoteService noteService;
    private final CollaborationActivityService collaborationActivityService;
    private final ObjectMapper objectMapper;

    public projectController(IprojectService projectService,
                             IprojectAuthorizationService projectAuthorizationService,
                             IworkspaceService workspaceService,
                             IfriendService friendService,
                             IworkspaceDAO workspaceDAO,
                             InoteService noteService,
                             CollaborationActivityService collaborationActivityService,
                             ObjectMapper objectMapper) {
        this.projectService = projectService;
        this.projectAuthorizationService = projectAuthorizationService;
        this.workspaceService = workspaceService;
        this.friendService = friendService;
        this.workspaceDAO = workspaceDAO;
        this.noteService = noteService;
        this.collaborationActivityService = collaborationActivityService;
        this.objectMapper = objectMapper;
    }

    private Set<Long> visibleContactUserIds(Long viewerUserId) {
        Set<Long> visible = new java.util.HashSet<>();
        if (viewerUserId == null) return visible;
        visible.add(viewerUserId);
        try {
            for (com.springboot.project.dto.friendDTO friend : friendService.getFriends(viewerUserId, null)) {
                if (friend != null && friend.getUserId() != null) visible.add(friend.getUserId());
            }
        } catch (Exception ignored) { }
        return visible;
    }

    private void redactPrivateMemberContacts(List<Map<String, Object>> members, Long viewerUserId) {
        if (members == null || members.isEmpty()) return;
        Set<Long> visible = visibleContactUserIds(viewerUserId);
        for (Map<String, Object> member : members) {
            if (member == null) continue;
            Object raw = member.get("USER_ID");
            Long targetId = null;
            if (raw instanceof Number) targetId = ((Number) raw).longValue();
            else if (raw != null) {
                try { targetId = Long.valueOf(String.valueOf(raw)); } catch (Exception ignored) { }
            }
            if (targetId == null || !visible.contains(targetId)) {
                member.remove("EMAIL");
                member.remove("email");
                member.remove("CUSTOM_CONTACT_EMAIL");
                member.remove("customContactEmail");
            }
        }
    }

    @GetMapping("/create")
    public String showCreatePage(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "scope", required = false) String requestedScope,
            HttpSession session,
            Model model) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        List<workspaceDTO> workspaceList = workspaceService.getWorkspaceList(loginUser.getUserId());
        boolean hasWorkspace = wsId != null && workspaceList.stream()
                .anyMatch(workspace -> wsId.equals(workspace.getWsId()));

        if (wsId != null && !hasWorkspace) {
            return "redirect:/project/manage";
        }

        String scope = requestedScope == null ? "" : requestedScope.trim().toUpperCase();
        boolean personalEntry = "PERSONAL".equals(scope);
        boolean groupEntry = wsId != null;

        workspaceDTO selectedWorkspace = groupEntry
                ? workspaceService.getWorkspaceDetail(wsId)
                : null;

        boolean isWorkspaceOwner = selectedWorkspace != null
                && selectedWorkspace.getOwnerId() != null
                && selectedWorkspace.getOwnerId().equals(loginUser.getUserId());

        boolean isWorkspaceAdmin = groupEntry
                && workspaceDAO.isWorkspaceAdmin(wsId, loginUser.getUserId()) > 0;

        boolean canCreateGroupProject = !groupEntry
                || isWorkspaceOwner
                || isWorkspaceAdmin;

        if (!personalEntry && !"GROUP".equals(scope) && !scope.isEmpty()) {
            return "redirect:/project/create";
        }

        String initialScope = personalEntry ? "PERSONAL" : "GROUP";
        boolean scopeFixed = personalEntry || groupEntry;

        if (groupEntry) {
            session.setAttribute("currentWsId", wsId);
        }

        model.addAttribute("wsId", wsId);
        model.addAttribute("workspaceList", workspaceList);
        model.addAttribute("initialScope", initialScope);
        model.addAttribute("scopeFixed", scopeFixed);
        model.addAttribute("personalEntry", personalEntry);
        model.addAttribute("groupEntry", groupEntry);
        model.addAttribute("workspace", selectedWorkspace);
        model.addAttribute("isWorkspaceOwner", isWorkspaceOwner);
        model.addAttribute("isWorkspaceAdmin", isWorkspaceAdmin);
        model.addAttribute("canCreateGroupProject", canCreateGroupProject);
        addProjectFormCatalog(model);
        return "project/projectCreate";
    }



    @GetMapping("/manage")
    public String projectManagePage(HttpSession session, Model model) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        List<Map<String, Object>> projects = projectService.getPersonalProjects(loginUser.getUserId());
        model.addAttribute("projects", projects);
        model.addAttribute("listMode", "PERSONAL");
        model.addAttribute("personalMode", true);
        return "project/projectList";
    }

    @GetMapping("/list")
    public String projectListPage(@RequestParam(value = "wsId", required = false) Long wsId,
                                  HttpSession session,
                                  Model model) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        if (wsId == null || !projectAuthorizationService.isWorkspaceMember(wsId, loginUser.getUserId())) {
            return "redirect:/project/manage";
        }

        session.setAttribute("currentWsId", wsId);
        model.addAttribute("wsId", wsId);
        model.addAttribute("workspace", workspaceService.getWorkspaceDetail(wsId));
        model.addAttribute("projects", projectService.getProjectListByWorkspaceId(wsId, loginUser.getUserId()));
        model.addAttribute("canCreateGroupProject",
                projectAuthorizationService.canCreateGroupProject(wsId, loginUser.getUserId()));
        model.addAttribute("listMode", "GROUP");
        model.addAttribute("personalMode", false);
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
            String scope = dto.getProjScope() == null
                    ? "GROUP"
                    : dto.getProjScope().trim().toUpperCase();

            if (!"PERSONAL".equals(scope) && !"GROUP".equals(scope)) {
                response.put("status", "fail");
                response.put("message", "올바르지 않은 프로젝트 범위입니다.");
                return response;
            }

            dto.setProjScope(scope);

            if ("GROUP".equals(scope) && dto.getWsId() == null) {
                dto.setWsId((Long) session.getAttribute("currentWsId"));
            }

            if ("PERSONAL".equals(scope)) {
                dto.setWsId(null);
            }

            if ("GROUP".equals(scope)) {
                if (dto.getWsId() == null) {
                    response.put("status", "fail");
                    response.put("message", "그룹 정보가 없습니다.");
                    return response;
                }

                if (!projectAuthorizationService.canCreateGroupProject(
                        dto.getWsId(), loginUser.getUserId())) {
                    response.put("status", "fail");
                    response.put("message", "그룹 프로젝트는 그룹장 또는 관리자만 만들 수 있어요.");
                    return response;
                }
            }

            projectService.insertProject(dto, loginUser.getUserId());

            projectRequestDTO createdProject = projectService.getProjectById(dto.getProjId());
            if (createdProject == null) {
                response.put("status", "error");
                response.put("message", "생성된 프로젝트 정보를 불러오지 못했습니다.");
                return response;
            }

            Long createdWsId = createdProject.getWsId();
            String createdScope = createdProject.getProjScope() == null
                    ? (createdWsId == null ? "PERSONAL" : "GROUP")
                    : createdProject.getProjScope().trim().toUpperCase();

            response.put("status", "success");
            response.put("projId", createdProject.getProjId());
            response.put("projScope", createdScope);

            String redirectUrl = "/project/main?projId=" + createdProject.getProjId();
            if ("GROUP".equals(createdScope) && createdWsId != null) {
                redirectUrl += "&wsId=" + createdWsId;
            }
            response.put("redirectUrl", redirectUrl);
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
                                  @RequestParam(value = "wsId", required = false) Long wsId,
                                  Model model,
                                  HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        projectRequestDTO projectDetail = projectAuthorizationService.getAccessibleProject(projId, wsId, loginUser.getUserId());
        if (projectDetail == null) {
            return wsId == null
                    ? "redirect:/project/manage"
                    : "redirect:/project/list?wsId=" + wsId;
        }
        wsId = projectDetail.getWsId();
        // 2. 기존 로직
        List<Map<String, Object>> projectMemberList = projectService.getProjectMembers(projId);
        redactPrivateMemberContacts(projectMemberList, loginUser.getUserId());
        Map<String, Object> taskSummary = projectService.getProjectTaskSummary(projId);
        
        // 3. 모델에 추가
        model.addAttribute("projectDetail", projectDetail);
        if (wsId != null) {
            model.addAttribute("projectWorkspace", workspaceService.getWorkspaceDetail(wsId));
        }
        model.addAttribute("projectLinks", projectService.getProjectLinks(projId));
        model.addAttribute("projId", projId);
        model.addAttribute("wsId", wsId);
        boolean projectReadOnly =
                projectAuthorizationService.isDeletePending(projectDetail)
                || projectAuthorizationService.isProjectReadOnly(projId, loginUser.getUserId());
        boolean canManageProject =
                !projectReadOnly && projectAuthorizationService.canManageProject(projId, loginUser.getUserId());

        boolean isProjectLeader = projectDetail.getLeaderId() != null
                && projectDetail.getLeaderId().equals(loginUser.getUserId());
        String currentProjectRole = isProjectLeader ? "LEADER" : "GROUP_MEMBER";

        if (projectMemberList != null) {
            for (Map<String, Object> member : projectMemberList) {
                Long memberUserId = toLong(member.get("USER_ID"));
                if (!loginUser.getUserId().equals(memberUserId)) {
                    continue;
                }

                // 팀장은 PROJ_MEMBERS에 ADMIN으로 저장되어 있어도 화면 역할은 LEADER가 우선이다.
                if (!isProjectLeader) {
                    Object roleValue = member.get("PROJ_ROLE");
                    currentProjectRole = roleValue == null || String.valueOf(roleValue).isBlank()
                            ? "MEMBER"
                            : String.valueOf(roleValue).trim().toUpperCase();
                }
                break;
            }
        }

        model.addAttribute("projectMemberList", projectMemberList);
        if (projectReadOnly) {
            currentProjectRole = "READ_ONLY";
        }

        model.addAttribute("taskSummary", taskSummary);
        model.addAttribute("canManageProject", canManageProject);
        model.addAttribute("projectReadOnly", projectReadOnly);
        model.addAttribute("currentProjectRole", currentProjectRole);

        // 메인 조회는 읽기 동작이다. 설정 row가 없더라도 여기서 DB를 생성하지 않는다.
        projectPlanFeatureDTO planFeature = projectService.getProjectPlanFeature(projId);
        model.addAttribute("projectPlanFeature", planFeature);
        model.addAttribute("hasGanttPlan", planFeature != null && "Y".equals(planFeature.getPeriodEnabledYn()));
        model.addAttribute("hasTimePlan", planFeature != null && "Y".equals(planFeature.getTimeEnabledYn()));
        model.addAttribute("hasWeeklyPlan", planFeature != null && "Y".equals(planFeature.getWeeklyEnabledYn()));

        List<com.springboot.project.dto.noteDTO> mainNoteSummaries = noteService.getNoteListPage(
                "PROJ", wsId, projId, loginUser.getUserId(), null, false, null, null, 0, 3);
        List<com.springboot.project.dto.noteDTO> profilePublicNotes = new java.util.ArrayList<>();
        if (mainNoteSummaries != null) {
            for (com.springboot.project.dto.noteDTO summary : mainNoteSummaries) {
                if (summary == null || summary.getNoteId() == null) continue;
                com.springboot.project.dto.noteDTO detail = noteService.getNoteDetail(summary.getNoteId(), loginUser.getUserId());
                if (detail == null) continue;
                if (detail.getPreviewContent() == null || detail.getPreviewContent().isBlank()) {
                    detail.setPreviewContent(summary.getPreviewContent());
                }
                if (detail.getUserName() == null || detail.getUserName().isBlank()) {
                    detail.setUserName(summary.getUserName());
                }
                if (detail.getProfileImagePath() == null || detail.getProfileImagePath().isBlank()) {
                    detail.setProfileImagePath(summary.getProfileImagePath());
                }
                profilePublicNotes.add(detail);
            }
        }
        model.addAttribute("profilePublicNotes", profilePublicNotes);
        model.addAttribute("displayName", loginUser.getUserName());
        
        return "project/projectMain";
    }

    @GetMapping("/settings")
    public String projectSettingsPage(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            Model model,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        projectRequestDTO projectDetail =
                projectAuthorizationService.getAccessibleProject(projId, wsId, loginUser.getUserId());

        if (projectDetail == null) {
            return wsId == null
                    ? "redirect:/project/manage"
                    : "redirect:/project/list?wsId=" + wsId;
        }

        wsId = projectDetail.getWsId();

        List<Map<String, Object>> projectMemberList =
                projectService.getProjectMembers(projId);
        redactPrivateMemberContacts(projectMemberList, loginUser.getUserId());

        boolean isProjectLeader = projectDetail.getLeaderId() != null
                && projectDetail.getLeaderId().equals(loginUser.getUserId());

        boolean canManageProject =
                projectAuthorizationService.canManageProject(projId, loginUser.getUserId());

        boolean groupProject =
                "GROUP".equalsIgnoreCase(projectDetail.getProjScope());

        String normalizedProjectType = ProjectPolicy.normalizeType(
                projectDetail.getProjCategory() == null || projectDetail.getProjCategory().isBlank()
                        ? projectDetail.getProjType()
                        : projectDetail.getProjCategory());
        projectDetail.setProjType(normalizedProjectType);
        projectDetail.setProjCategory(normalizedProjectType);
        projectDetail.setProjIcon(ProjectPolicy.normalizeIcon(projectDetail.getProjIcon(), normalizedProjectType));
        projectDetail.setAccessScope(ProjectPolicy.normalizeAccessScope(projectDetail.getAccessScope(), projectDetail.getProjScope()));

        // 설정의 date input은 yyyy-MM-dd 형식만 허용한다.
        // 기존/과거 데이터가 Timestamp 형태(yyyy-MM-dd HH:mm:ss)나 ISO datetime으로
        // 조회되더라도 생성 당시 기간이 설정 화면에서 비어 보이지 않도록 date-only로 정규화한다.
        String settingsStartDate = normalizeProjectSettingsDate(projectDetail.getStartDate());
        String settingsEndDate = normalizeProjectSettingsDate(projectDetail.getEndDate());
        projectDetail.setStartDate(settingsStartDate);
        projectDetail.setEndDate(settingsEndDate);
        projectDetail.setPeriodEnabledYn(
                settingsStartDate != null && settingsEndDate != null ? "Y" : "N");
        String currentProjectRole = isProjectLeader
                ? "LEADER"
                : (groupProject ? "GROUP_MEMBER" : "OWNER");

        if (projectMemberList != null) {
            for (Map<String, Object> member : projectMemberList) {
                Long memberUserId = toLong(member.get("USER_ID"));
                if (!loginUser.getUserId().equals(memberUserId)) {
                    continue;
                }

                // 개인/그룹 프로젝트 모두 팀장 표시는 PROJ_MEMBERS의 ADMIN 값보다 우선한다.
                if (!isProjectLeader) {
                    Object roleValue = member.get("PROJ_ROLE");
                    if (roleValue != null
                            && !String.valueOf(roleValue).isBlank()) {
                        currentProjectRole =
                                String.valueOf(roleValue).trim().toUpperCase();
                    }
                }
                break;
            }
        }

        boolean readOnlyProjectSettings = !canManageProject
                || "DELETE_PENDING".equalsIgnoreCase(projectDetail.getStatus());

        model.addAttribute("projectDetail", projectDetail);
        model.addAttribute("projectSettingsStartDate", settingsStartDate == null ? "" : settingsStartDate);
        model.addAttribute("projectSettingsEndDate", settingsEndDate == null ? "" : settingsEndDate);
        if (groupProject && wsId != null) {
            model.addAttribute("projectWorkspace", workspaceService.getWorkspaceDetail(wsId));
        }
        model.addAttribute(
                "projectLinks",
                projectService.getProjectLinks(projId));
        model.addAttribute("projId", projId);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projectMemberList", projectMemberList);
        model.addAttribute("canManageProject", canManageProject);
        model.addAttribute(
                "readOnlyProjectSettings",
                readOnlyProjectSettings);
        model.addAttribute("isProjectLeader", isProjectLeader);
        model.addAttribute("currentProjectRole", currentProjectRole);
        model.addAttribute("groupProject", groupProject);
        model.addAttribute("currentUserId", loginUser.getUserId());
        addProjectFormCatalog(model);

        return "project/projectSettings";
    }

    /**
     * 프로젝트 설정 화면의 input[type=date]에 안전하게 주입할 yyyy-MM-dd 값으로 정규화한다.
     * 생성/기존 데이터가 yyyy-MM-dd, yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd HH:mm:ss 형태로
     * 섞여 있어도 앞의 date-only 값만 사용한다. 유효하지 않은 값은 null로 처리한다.
     */
    private String normalizeProjectSettingsDate(String rawDate) {
        if (rawDate == null) return null;
        String value = rawDate.trim();
        if (value.isEmpty()) return null;
        if (value.length() >= 10) {
            String dateOnly = value.substring(0, 10);
            if (dateOnly.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return dateOnly;
            }
        }
        return value.matches("\\d{4}-\\d{2}-\\d{2}") ? value : null;
    }


 // 1. 초대 가능한 멤버 목록 조회 (GET)
    @GetMapping("/api/assignable-members")
    @ResponseBody
    public List<Map<String, Object>> getAssignableMembers(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        projectRequestDTO project = loginUser == null ? null
                : projectAuthorizationService.getAccessibleProject(projId, wsId, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())
                || !"GROUP".equalsIgnoreCase(project.getProjScope())
                || projectAuthorizationService.isDeletePending(project)) {
            return List.of();
        }
        List<Map<String, Object>> members = projectService.getAssignableMembers(project.getWsId(), projId);
        redactPrivateMemberContacts(members, loginUser.getUserId());
        return members;
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

        projectRequestDTO project =
                projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        if (!"GROUP".equalsIgnoreCase(project.getProjScope())) {
            return "GROUP_PROJECT_ONLY";
        }
        if (projectAuthorizationService.isDeletePending(project)) {
            return "PROJECT_UNAVAILABLE";
        }
        if (userIds == null || userIds.isEmpty()) {
            return "INVALID_MEMBER";
        }
        for (Long targetUserId : userIds) {
            if (!projectAuthorizationService.canAssignUserToProject(projId, targetUserId)) {
                return "INVALID_MEMBER";
            }
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
        if (!"GROUP".equalsIgnoreCase(project.getProjScope())) {
            return "GROUP_PROJECT_ONLY";
        }
        if (projectAuthorizationService.isDeletePending(project)) {
            return "PROJECT_UNAVAILABLE";
        }

        // 팀장 권한 위임은 현재 팀장만 가능하다.
        if (!projectAuthorizationService.isProjectLeader(projId, loginUser.getUserId())) {
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

        if (result) {
            collaborationActivityService.record(
                    "PROJECT", project.getWsId(), projId, loginUser.getUserId(),
                    "MEMBER_LEADER_TRANSFER", "MEMBER", String.valueOf(newLeaderId),
                    project.getProjName(), "프로젝트 팀장을 위임했어요.", "/project/api/transfer-leader");
        }
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

        String result = projectService.removeProjectMembers(
                projId, loginUser.getUserId(), List.of(userId));
        return switch (result) {
            case "success" -> "SUCCESS";
            case "leader_protected" -> "CANNOT_REMOVE_LEADER";
            case "self_remove_locked" -> "SELF_REMOVE_LOCKED";
            case "forbidden" -> "NO_PERMISSION";
            case "project_unavailable" -> "PROJECT_UNAVAILABLE";
            case "member_not_found" -> "MEMBER_NOT_FOUND";
            default -> "FAIL";
        };
    }
@GetMapping("/api/tasks")
    @ResponseBody
    public List<Map<String, Object>> getTasks(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return List.of();
        }
        return projectService.getProjectTasks(projId);
    }
@GetMapping("/api/task-indicators")
    @ResponseBody
    public List<Map<String, Object>> getTaskIndicators(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return List.of();
        }
        return collaborationActivityService.taskIndicators(projId, loginUser.getUserId());
    }
    
    @PostMapping("/api/task-read")
    @ResponseBody
    public Map<String, Object> markTaskRead(@RequestParam("taskId") Long taskId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || taskId == null) return Map.of("success", false);
        Map<String, Object> task = projectService.getTaskDetail(taskId);
        Long projId = task == null ? null : toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        if (projId == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return Map.of("success", false);
        }
        collaborationActivityService.markTaskRead(projId, taskId, loginUser.getUserId());
        return Map.of("success", true);
    }

    @GetMapping("/api/task-record-unread-items")
    @ResponseBody
    public List<Long> getTaskRecordUnreadItems(@RequestParam("taskId") Long taskId,
                                                @RequestParam("recordType") String recordType,
                                                HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || taskId == null) return List.of();
        Map<String, Object> task = projectService.getTaskDetail(taskId);
        Long projId = task == null ? null : toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        if (projId == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return List.of();
        }
        return collaborationActivityService.unreadTaskRecordItemIds(projId, taskId, loginUser.getUserId(), recordType);
    }

    @PostMapping("/api/task-record-read")
    @ResponseBody
    public Map<String, Object> markTaskRecordRead(@RequestParam("taskId") Long taskId,
                                                   @RequestParam("recordType") String recordType,
                                                   HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || taskId == null) return Map.of("success", false);
        Map<String, Object> task = projectService.getTaskDetail(taskId);
        Long projId = task == null ? null : toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        if (projId == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return Map.of("success", false);
        }
        collaborationActivityService.markTaskRecordRead(projId, taskId, loginUser.getUserId(), recordType);
        return Map.of("success", true);
    }

    @PostMapping("/api/task-record-item-read")
    @ResponseBody
    public Map<String, Object> markTaskRecordItemRead(@RequestParam("taskId") Long taskId,
                                                       @RequestParam("recordItemId") Long recordItemId,
                                                       HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || taskId == null || recordItemId == null) return Map.of("success", false);
        Map<String, Object> task = projectService.getTaskDetail(taskId);
        Long projId = task == null ? null : toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        if (projId == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return Map.of("success", false);
        }
        boolean success = collaborationActivityService.markTaskRecordItemRead(
                projId, taskId, loginUser.getUserId(), recordItemId);
        return Map.of("success", success);
    }

    @PostMapping("/api/add-task")
    @ResponseBody
    public String addTask(
        @RequestParam("projId") Long projId,
        @RequestParam("title") String title,
        @RequestParam(value = "startDate", required = false) String startDate,
        @RequestParam(value = "endDate", required = false) String endDate,
        @RequestParam(value = "status", defaultValue = "TODO") String status,
        @RequestParam(value = "useTime", defaultValue = "N") String useTime,
        @RequestParam(value = "startTime", required = false) String startTime,
        @RequestParam(value = "endTime", required = false) String endTime,
        @RequestParam(value = "startTimeSlot", defaultValue = "AM") String startTimeSlot,
        @RequestParam(value = "endTimeSlot", defaultValue = "PM") String endTimeSlot,
        @RequestParam(value = "assigneeIds", required = false) List<Long> assigneeIds,
        @RequestParam(value = "assignedUserId", required = false) Long assignedUserId,
        @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
        @RequestParam(value = "recordEnabledYn", defaultValue = "N") String recordEnabledYn,
        @RequestParam(value = "recordVisibility", defaultValue = "PROJECT") String recordVisibility,
        HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");

        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canModifyProjectContent(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        // 프로젝트 참여 멤버만 업무를 생성할 수 있다. READ_ONLY 사용자는 조회만 가능하다.
        // 전체 업무 수정/삭제 권한은 기존 관리자 권한 정책을 그대로 유지한다.
        String taskValidation = validateTaskInput(project, title, startDate, endDate, status, useTime, startTime, endTime);
        if (taskValidation != null) {
            return taskValidation;
        }
        List<Long> normalizedAssigneeIds = normalizeTaskAssigneeIds(assigneeIds, assignedUserId);
        if (normalizedAssigneeIds.isEmpty()) {
            normalizedAssigneeIds.add(loginUser.getUserId());
        }
        if (!areActiveProjectMembers(projId, normalizedAssigneeIds)) {
            return "INVALID_ASSIGNEE";
        }

        boolean taskUseTime = "Y".equalsIgnoreCase(String.valueOf(useTime));
        startTimeSlot = taskUseTime ? "TIME" : "NONE";
        endTimeSlot = taskUseTime ? "TIME" : "NONE";
        if (!taskUseTime) {
            startTime = null;
            endTime = null;
        }

        Long taskId = projectService.addTask(
            projId,
            normalizedAssigneeIds,
            loginUser.getUserId(),
            title.trim(),
            startDate,
            endDate,
            status.trim().toUpperCase(),
            startTime,
            endTime,
            startTimeSlot,
            endTimeSlot,
            sortOrder,
            recordEnabledYn,
            recordVisibility
        );

        if (taskId == null) {
            return "FAIL";
        }

        recordTaskActivity(
                project,
                loginUser.getUserId(),
                "TASK_CREATE",
                taskId,
                title.trim(),
                "새 업무를 등록했어요.",
                "/project/api/add-task"
        );
        return "SUCCESS";
    }
    @PostMapping("/api/add-schedule")
    @ResponseBody
    public String addProjectSchedule(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "wsId", required = false) Long wsId,
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
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        projectRequestDTO scheduleProject = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (scheduleProject == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        String validation = validateScheduleInput(
                scheduleProject, title, startDate, endDate, status, useTime, startTime, endTime, color);
        if (validation != null) {
            return validation;
        }

        boolean scheduleUseTime = "Y".equalsIgnoreCase(useTime);
        String startTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        String endTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        if (!scheduleUseTime) {
            startTime = null;
            endTime = null;
        }

        boolean result = projectService.addProjectSchedule(
                projId,
                scheduleProject.getWsId(),
                loginUser.getUserId(),
                title.trim(),
                startDate,
                endDate,
                status.trim().toUpperCase(),
                color.trim(),
                startTime,
                endTime,
                startTimeSlot,
                endTimeSlot
        );

        return result ? "SUCCESS" : "INSERT_FAIL";
    }

    @GetMapping("/api/schedule-detail")
    @ResponseBody
    public Map<String, Object> getProjectScheduleDetail(
            @RequestParam("scheduleId") Long scheduleId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> schedule = projectService.getProjectScheduleDetail(scheduleId);
        Long projId = schedule == null ? null : toLong(getMapValueIgnoreCase(schedule, "PROJ_ID"));
        if (loginUser == null || projId == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return Map.of();
        }
        return schedule;
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
            @RequestParam(value = "color", defaultValue = "#4A90E2") String color,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        Map<String, Object> currentSchedule = projectService.getProjectScheduleDetail(scheduleId);
        if (currentSchedule == null) {
            return "SCHEDULE_NOT_FOUND";
        }

        Long projId = toLong(getMapValueIgnoreCase(currentSchedule, "PROJ_ID"));
        projectRequestDTO scheduleProject = projId == null
                ? null
                : projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (scheduleProject == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        String validation = validateScheduleInput(
                scheduleProject, title, startDate, endDate, status, useTime, startTime, endTime, color);
        if (validation != null) {
            return validation;
        }

        boolean scheduleUseTime = "Y".equalsIgnoreCase(useTime);
        String startTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        String endTimeSlot = scheduleUseTime ? "TIME" : "NONE";
        if (!scheduleUseTime) {
            startTime = null;
            endTime = null;
        }

        boolean result = projectService.updateProjectSchedule(
                scheduleId,
                title.trim(),
                startDate,
                endDate,
                status.trim().toUpperCase(),
                color.trim(),
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
            @RequestParam("scheduleId") Long scheduleId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        Map<String, Object> schedule = projectService.getProjectScheduleDetail(scheduleId);
        if (schedule == null) {
            return "SCHEDULE_NOT_FOUND";
        }

        Long projId = toLong(getMapValueIgnoreCase(schedule, "PROJ_ID"));
        projectRequestDTO scheduleProject = projId == null
                ? null
                : projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (scheduleProject == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        boolean result = projectService.deleteProjectSchedule(scheduleId);
        return result ? "SUCCESS" : "FAIL";
    }

    @GetMapping("/api/task-detail")
    @ResponseBody
    public Map<String, Object> getTaskDetail(@RequestParam("taskId") Long taskId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> task = projectService.getTaskDetail(taskId);
        Long projId = task == null ? null : toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        if (loginUser == null || projId == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return Map.of();
        }
        return task;
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
            @RequestParam(value = "assigneeIds", required = false) List<Long> assigneeIds,
            @RequestParam(value = "assignedUserId", required = false) Long assignedUserId,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "recordEnabledYn", defaultValue = "N") String recordEnabledYn,
            @RequestParam(value = "recordVisibility", defaultValue = "PROJECT") String recordVisibility,
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

        if (!projectAuthorizationService.canModifyProjectContent(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        boolean isAdmin = projectAuthorizationService.canManageProject(projId, loginUser.getUserId());

        if (!isAdmin) {
            return "NO_PERMISSION";
        }
        projectRequestDTO taskProject = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (taskProject == null) {
            return "NO_PERMISSION";
        }
        String taskValidation = validateTaskInput(taskProject, title, startDate, endDate, status, useTime, startTime, endTime);
        if (taskValidation != null) {
            return taskValidation;
        }
        List<Long> normalizedAssigneeIds = normalizeTaskAssigneeIds(assigneeIds, assignedUserId);
        // 구버전 화면이 담당자 값을 전혀 보내지 않은 경우 기존 대표 담당자를 유지합니다.
        if (normalizedAssigneeIds.isEmpty() && currentTaskUserId != null) {
            normalizedAssigneeIds.add(currentTaskUserId);
        }
        if (normalizedAssigneeIds.isEmpty()) {
            normalizedAssigneeIds.add(loginUser.getUserId());
        }
        if (!areActiveProjectMembers(projId, normalizedAssigneeIds)) {
            return "INVALID_ASSIGNEE";
        }

        boolean taskUseTime = "Y".equalsIgnoreCase(String.valueOf(useTime));
        startTimeSlot = taskUseTime ? "TIME" : "NONE";
        endTimeSlot = taskUseTime ? "TIME" : "NONE";
        if (!taskUseTime) {
            startTime = null;
            endTime = null;
        }

        boolean assigneeChanged = !taskAssigneeIds(task).equals(new LinkedHashSet<>(normalizedAssigneeIds));
        boolean statusChanged = !sameText(getMapValueIgnoreCase(task, "STATUS"), status);
        boolean contentChanged = taskContentChanged(
                task,
                title,
                startDate,
                endDate,
                taskUseTime ? "Y" : "N",
                startTime,
                endTime,
                sortOrder,
                recordEnabledYn,
                recordVisibility
        );

        boolean result = projectService.updateTask(
                taskId,
                title.trim(),
                startDate,
                endDate,
                status.trim().toUpperCase(),
                normalizedAssigneeIds,
                loginUser.getUserId(),
                startTime,
                endTime,
                startTimeSlot,
                endTimeSlot,
                sortOrder,
                recordEnabledYn,
                recordVisibility
        );

        if (!result) {
            return "FAIL";
        }

        if (assigneeChanged || statusChanged || contentChanged) {
            String activityType;
            String detail;

            if (assigneeChanged && !statusChanged && !contentChanged) {
                activityType = "TASK_ASSIGNEE";
                detail = "업무 담당자를 변경했어요.";
            } else if (statusChanged && !assigneeChanged && !contentChanged) {
                activityType = "TASK_STATUS";
                detail = "업무 상태를 " + taskStatusLabel(status) + "으로 변경했어요.";
            } else {
                activityType = "TASK_UPDATE";
                if (assigneeChanged && statusChanged) {
                    detail = "업무 내용, 담당자와 상태를 수정했어요.";
                } else if (assigneeChanged) {
                    detail = "업무 내용과 담당자를 수정했어요.";
                } else if (statusChanged) {
                    detail = "업무 내용과 상태를 수정했어요.";
                } else {
                    detail = "업무 내용을 수정했어요.";
                }
            }

            recordTaskActivity(
                    taskProject,
                    loginUser.getUserId(),
                    activityType,
                    taskId,
                    title.trim(),
                    detail,
                    "/project/api/update-task"
            );
        }

        return "SUCCESS";
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
        projectRequestDTO project = projId == null ? null : projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null
                || !projectAuthorizationService.canModifyProjectContent(projId, loginUser.getUserId())
                || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        String taskTitle = textValue(getMapValueIgnoreCase(task, "TITLE"));
        boolean isDeleted = projectService.deleteTask(taskId);
        if (!isDeleted) {
            return "FAIL";
        }

        recordTaskActivity(
                project,
                loginUser.getUserId(),
                "TASK_DELETE",
                taskId,
                taskTitle,
                "업무를 삭제했어요.",
                "/project/api/delete-task"
        );
        return "SUCCESS";
    }
    @PostMapping("/api/update-task-status")
    @ResponseBody
    public String updateTaskStatus(
            @RequestParam("taskId") Long taskId,
            @RequestParam("status") String status,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }
        Map<String, Object> task = projectService.getTaskDetail(taskId);
        Long projId = task == null ? null : toLong(getMapValueIgnoreCase(task, "PROJ_ID"));
        projectRequestDTO project = projId == null ? null : projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canModifyProjectContent(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        if (!projectAuthorizationService.canManageProject(projId, loginUser.getUserId())
                && !isTaskAssignee(task, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        if (!isValidTaskStatus(status)) {
            return "INVALID_STATUS";
        }

        String normalizedStatus = status.trim().toUpperCase();
        String previousStatus = textValue(getMapValueIgnoreCase(task, "STATUS")).toUpperCase();
        boolean result = projectService.updateTaskStatus(taskId, normalizedStatus);

        if (!result) {
            return "FAIL";
        }

        if (!previousStatus.equals(normalizedStatus)) {
            recordTaskActivity(
                    project,
                    loginUser.getUserId(),
                    "TASK_STATUS",
                    taskId,
                    textValue(getMapValueIgnoreCase(task, "TITLE")),
                    "업무 상태를 " + taskStatusLabel(normalizedStatus) + "으로 변경했어요.",
                    "/project/api/update-task-status"
            );
        }

        return "SUCCESS";
    }
    private void recordProjectPlanActivity(projectRequestDTO project,
                                           Long actorUserId,
                                           String activityType,
                                           String targetType,
                                           Long targetId,
                                           String title,
                                           String detail) {
        if (project == null || actorUserId == null || targetId == null) return;
        collaborationActivityService.record(
                "PROJECT",
                project.getWsId(),
                project.getProjId(),
                actorUserId,
                activityType,
                targetType,
                String.valueOf(targetId),
                title,
                detail,
                "/project/api/" + targetType.toLowerCase(Locale.ROOT).replace('_', '-')
        );
    }

    private void recordTaskActivity(projectRequestDTO project,
                                    Long actorUserId,
                                    String activityType,
                                    Long taskId,
                                    String title,
                                    String detail,
                                    String requestUri) {
        if (project == null || actorUserId == null || taskId == null) {
            return;
        }
        collaborationActivityService.record(
                "PROJECT",
                project.getWsId(),
                project.getProjId(),
                actorUserId,
                activityType,
                "TASK",
                String.valueOf(taskId),
                title,
                detail,
                requestUri
        );
    }

    private LinkedHashSet<Long> taskAssigneeIds(Map<String, Object> task) {
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        if (task == null) return ids;

        Object assigneesValue = task.get("assignees");
        if (assigneesValue instanceof List<?> assignees) {
            for (Object value : assignees) {
                if (!(value instanceof Map<?, ?> assignee)) continue;
                Long userId = toLong(assignee.get("userId"));
                if (userId != null) ids.add(userId);
            }
        }

        if (ids.isEmpty()) {
            Long legacyUserId = toLong(getMapValueIgnoreCase(task, "USER_ID"));
            if (legacyUserId != null) ids.add(legacyUserId);
        }
        return ids;
    }

    private boolean taskContentChanged(Map<String, Object> task,
                                       String title,
                                       String startDate,
                                       String endDate,
                                       String useTime,
                                       String startTime,
                                       String endTime,
                                       Integer sortOrder,
                                       String recordEnabledYn,
                                       String recordVisibility) {
        if (!sameText(getMapValueIgnoreCase(task, "TITLE"), title)) return true;
        if (!sameText(getMapValueIgnoreCase(task, "START_DATE"), startDate)) return true;
        if (!sameText(getMapValueIgnoreCase(task, "END_DATE"), endDate)) return true;
        if (!sameText(getMapValueIgnoreCase(task, "USE_TIME"), useTime)) return true;

        if ("Y".equalsIgnoreCase(textValue(useTime))) {
            if (!sameText(getMapValueIgnoreCase(task, "START_TIME"), startTime)) return true;
            if (!sameText(getMapValueIgnoreCase(task, "END_TIME"), endTime)) return true;
        }

        if (!sameText(getMapValueIgnoreCase(task, "RECORD_ENABLED_YN"), recordEnabledYn)) return true;
        if (!sameText(getMapValueIgnoreCase(task, "RECORD_VISIBILITY"), recordVisibility)) return true;

        if (sortOrder != null) {
            Long oldSortOrder = toLong(getMapValueIgnoreCase(task, "SORT_ORDER"));
            if (oldSortOrder == null || oldSortOrder.longValue() != sortOrder.longValue()) return true;
        }
        return false;
    }

    private boolean sameText(Object left, Object right) {
        return textValue(left).equalsIgnoreCase(textValue(right));
    }

    private String textValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String taskStatusLabel(String status) {
        String normalized = textValue(status).toUpperCase();
        return switch (normalized) {
            case "TODO" -> "할 일";
            case "IN_PROGRESS" -> "진행 중";
            case "DONE" -> "완료";
            case "DELAYED" -> "지연";
            default -> normalized.isBlank() ? "변경된 상태" : normalized;
        };
    }

    private List<Long> normalizeTaskAssigneeIds(List<Long> assigneeIds, Long legacyAssignedUserId) {
        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>();
        if (assigneeIds != null) {
            for (Long userId : assigneeIds) {
                if (userId != null) uniqueIds.add(userId);
            }
        }
        if (uniqueIds.isEmpty() && legacyAssignedUserId != null) {
            uniqueIds.add(legacyAssignedUserId);
        }
        return new ArrayList<>(uniqueIds);
    }

    private boolean areActiveProjectMembers(Long projId, List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return true;
        for (Long userId : userIds) {
            if (!isActiveProjectMember(projId, userId)) return false;
        }
        return true;
    }

    private boolean isActiveProjectMember(Long projId, Long userId) {
        if (projId == null || userId == null) return false;
        return projectService.getProjectMembers(projId).stream().anyMatch(member -> {
            Long memberUserId = toLong(getMapValueIgnoreCase(member, "USER_ID"));
            Object statusValue = getMapValueIgnoreCase(member, "STATUS");
            String status = statusValue == null ? "ACTIVE" : String.valueOf(statusValue).toUpperCase();
            return userId.equals(memberUserId) && !"LEFT".equals(status) && !"REMOVED".equals(status);
        });
    }



    private String validateTaskInput(projectRequestDTO project, String title, String startDate, String endDate,
                                     String status, String useTime, String startTime, String endTime) {
        if (project == null) return "PROJECT_NOT_FOUND";
        if (title == null || title.trim().isEmpty()) return "TITLE_REQUIRED";
        if (!isValidTaskStatus(status)) return "INVALID_STATUS";
        if (startDate == null || startDate.isBlank() || endDate == null || endDate.isBlank()) return "DATE_REQUIRED";

        try {
            java.time.LocalDate start = java.time.LocalDate.parse(startDate);
            java.time.LocalDate end = java.time.LocalDate.parse(endDate);
            if (end.isBefore(start)) return "INVALID_DATE_RANGE";

            // 과거 작업은 프로젝트 시작일 이전 날짜로도 소급 등록할 수 있다.
            // 프로젝트 종료일 이후만 막아 일정 범위의 상한은 유지한다.
            if (project.getEndDate() != null && !project.getEndDate().isBlank()
                    && end.isAfter(java.time.LocalDate.parse(project.getEndDate()))) {
                return "OUTSIDE_PROJECT_RANGE";
            }

            if ("Y".equalsIgnoreCase(useTime)) {
                if (startTime == null || startTime.isBlank() || endTime == null || endTime.isBlank()) {
                    return "TIME_REQUIRED";
                }
                java.time.LocalTime parsedStartTime = java.time.LocalTime.parse(startTime);
                java.time.LocalTime parsedEndTime = java.time.LocalTime.parse(endTime);
                if (start.equals(end) && !parsedEndTime.isAfter(parsedStartTime)) {
                    return "INVALID_TIME_RANGE";
                }
            }
        } catch (java.time.format.DateTimeParseException e) {
            return "INVALID_DATE_FORMAT";
        }
        return null;
    }

    private String validateScheduleInput(projectRequestDTO project, String title, String startDate, String endDate,
                                         String status, String useTime, String startTime, String endTime, String color) {
        if (project == null) return "PROJECT_NOT_FOUND";
        if (title == null || title.trim().isEmpty()) return "TITLE_REQUIRED";
        if (!isValidScheduleStatus(status)) return "INVALID_STATUS";
        if (startDate == null || startDate.isBlank() || endDate == null || endDate.isBlank()) return "DATE_REQUIRED";
        if (color == null || !color.trim().matches("^#[0-9A-Fa-f]{6}$")) return "INVALID_COLOR";

        try {
            java.time.LocalDate start = java.time.LocalDate.parse(startDate);
            java.time.LocalDate end = java.time.LocalDate.parse(endDate);
            if (end.isBefore(start)) return "INVALID_DATE_RANGE";

            // 과거 작업은 프로젝트 시작일 이전 날짜로도 소급 등록할 수 있다.
            // 프로젝트 종료일 이후만 막아 일정 범위의 상한은 유지한다.
            if (project.getEndDate() != null && !project.getEndDate().isBlank()
                    && end.isAfter(java.time.LocalDate.parse(project.getEndDate()))) {
                return "OUTSIDE_PROJECT_RANGE";
            }

            if ("Y".equalsIgnoreCase(useTime)) {
                if (startTime == null || startTime.isBlank() || endTime == null || endTime.isBlank()) {
                    return "TIME_REQUIRED";
                }
                java.time.LocalTime parsedStartTime = java.time.LocalTime.parse(startTime);
                java.time.LocalTime parsedEndTime = java.time.LocalTime.parse(endTime);
                if (start.equals(end) && !parsedEndTime.isAfter(parsedStartTime)) {
                    return "INVALID_TIME_RANGE";
                }
            }
        } catch (java.time.format.DateTimeParseException e) {
            return "INVALID_DATE_FORMAT";
        }
        return null;
    }

    private boolean isValidScheduleStatus(String status) {
        if (status == null) return false;
        String normalized = status.trim().toUpperCase();
        return "TODO".equals(normalized)
                || "IN_PROGRESS".equals(normalized)
                || "DONE".equals(normalized);
    }

    private boolean isValidTaskStatus(String status) {
        if (status == null) return false;
        String normalized = status.trim().toUpperCase();
        return "TODO".equals(normalized)
                || "IN_PROGRESS".equals(normalized)
                || "DONE".equals(normalized);
    }

    @PostMapping("/api/request-delete")
    @ResponseBody
    public String requestProjectDeletion(
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) {
            return "NOT_FOUND";
        }
        if (!projectAuthorizationService.isProjectLeader(projId, loginUser.getUserId())) {
            return "LEADER_ONLY";
        }
        if ("DELETE_PENDING".equalsIgnoreCase(project.getStatus())) {
            return "ALREADY_PENDING";
        }

        return projectService.requestProjectDeletion(projId, loginUser.getUserId())
                ? "SUCCESS"
                : "FAIL";
    }

    @PostMapping("/api/cancel-delete")
    @ResponseBody
    public String cancelProjectDeletion(
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) {
            return "NOT_FOUND";
        }
        if (!projectAuthorizationService.isProjectLeader(projId, loginUser.getUserId())) {
            return "LEADER_ONLY";
        }
        if (!"DELETE_PENDING".equalsIgnoreCase(project.getStatus())) {
            return "NOT_PENDING";
        }

        return projectService.cancelProjectDeletion(projId, loginUser.getUserId())
                ? "SUCCESS"
                : "FAIL";
    }

@PostMapping("/api/update-project")
    @ResponseBody
    public String updateProject(@RequestBody projectRequestDTO dto, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "LOGIN_FAIL";
        }
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(dto.getProjId(), dto.getWsId(), loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(dto.getProjId(), loginUser.getUserId())) {
            return "NO_PERMISSION";
        }
        dto.setWsId(project.getWsId());
        dto.setProjScope(project.getProjScope());
        // 기간을 새로 지정하는 경우 PROJECT_PERIOD 이벤트가 없으면 insertProjectEvent가 실행된다.
        // 이때 이벤트 USER_ID에 사용할 팀장 ID가 update payload에는 없으므로 기존 프로젝트에서 복원한다.
        dto.setLeaderId(project.getLeaderId());
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

        if (projectAuthorizationService.getAccessibleProject(
                projId, null, loginUser.getUserId()) == null) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }

        Map<String, Object> profile = projectService.getProjectMemberProfile(
                projId, targetUserId, loginUser.getUserId());

        if (profile == null || profile.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "NOT_FOUND"));
        }

        // 멤버 설정 탭을 제거했으므로 멤버 프로필이 사람 상세 + 운영의 진입점이다.
        // 본인은 자신의 담당을, 프로젝트 운영자는 대상 멤버의 담당/권한을 관리할 수 있다.
        profile.put("CAN_EDIT_PROJECT_ROLE",
                targetUserId.equals(loginUser.getUserId())
                        || projectAuthorizationService.canManageProject(projId, loginUser.getUserId()));

        return ResponseEntity.ok(profile);
    }

    @GetMapping("/api/member-profile/tasks")
    @ResponseBody
    public ResponseEntity<?> getProjectMemberProfileTasks(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long targetUserId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        }

        if (projectAuthorizationService.getAccessibleProject(
                projId, null, loginUser.getUserId()) == null) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }

        Map<String, Object> profile = projectService.getProjectMemberProfile(
                projId, targetUserId, loginUser.getUserId());
        if (profile == null || profile.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "NOT_FOUND"));
        }

        return ResponseEntity.ok(projectService.getProjectMemberTasks(projId, targetUserId));
    }

    @GetMapping("/api/member-profile/contributions")
    @ResponseBody
    public ResponseEntity<?> getProjectMemberProfileContributions(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long targetUserId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        }

        if (projectAuthorizationService.getAccessibleProject(
                projId, null, loginUser.getUserId()) == null) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }

        Map<String, Object> profile = projectService.getProjectMemberProfile(
                projId, targetUserId, loginUser.getUserId());
        if (profile == null || profile.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "NOT_FOUND"));
        }

        return ResponseEntity.ok(projectService.getProjectMemberContributions(projId, targetUserId, loginUser.getUserId()));
    }

    @GetMapping("/api/member-profile/activities")
    @ResponseBody
    public ResponseEntity<?> getProjectMemberProfileActivities(
            @RequestParam("projId") Long projId,
            @RequestParam("userId") Long targetUserId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        }

        if (projectAuthorizationService.getAccessibleProject(
                projId, null, loginUser.getUserId()) == null) {
            return ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }

        Map<String, Object> profile = projectService.getProjectMemberProfile(
                projId, targetUserId, loginUser.getUserId());
        if (profile == null || profile.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "NOT_FOUND"));
        }

        return ResponseEntity.ok(projectService.getProjectMemberRecentActivities(
                projId, targetUserId, loginUser.getUserId()));
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

        projectRequestDTO accessibleProject = projectAuthorizationService.getAccessibleProject(
                projId, null, loginUser.getUserId());
        if (accessibleProject == null) {
            return "NO_PERMISSION";
        }
        if (projectAuthorizationService.isDeletePending(accessibleProject)) {
            return "PROJECT_UNAVAILABLE";
        }

        // 프로필 모달 저장 API도 본인 프로젝트 직책 수정만 허용한다.
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
    public List<Map<String, Object>> getProjectMembersApi(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return List.of();
        }
        List<Map<String, Object>> members = projectService.getProjectMembers(projId);
        redactPrivateMemberContacts(members, loginUser.getUserId());
        return members;
    }
    
    
    @PostMapping("/api/update-members")
    @ResponseBody
    public String updateProjectMembers(
            @RequestParam("projId") Long projId,
            @RequestParam("changes") String changesJson,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (projId == null || changesJson == null || changesJson.isBlank()) return "invalid_request";

        try {
            List<Map<String, Object>> changes = objectMapper.readValue(
                    changesJson, new TypeReference<List<Map<String, Object>>>() {});
            return projectService.updateProjectMembers(projId, loginUser.getUserId(), changes);
        } catch (Exception e) {
            return "invalid_request";
        }
    }

    @PostMapping("/api/remove-members")
    @ResponseBody
    public String removeProjectMembers(
            @RequestParam("projId") Long projId,
            @RequestParam("userIds") String userIdsText,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (projId == null || userIdsText == null || userIdsText.isBlank()) return "invalid_request";

        try {
            List<Long> userIds = new ArrayList<>();
            for (String token : userIdsText.split(",")) {
                String value = token == null ? "" : token.trim();
                if (!value.isEmpty()) userIds.add(Long.valueOf(value));
            }
            return projectService.removeProjectMembers(projId, loginUser.getUserId(), userIds);
        } catch (Exception e) {
            return "invalid_request";
        }
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

        if (!projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
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

        if ("LEADER".equals(safeRole)) {
            if (projectAuthorizationService.isDeletePending(project)) return "PROJECT_UNAVAILABLE";
            boolean result = projectService.updateProjectMemberSetting(projId, userId, safePosition, safeRole);
            return result ? "SUCCESS" : "FAIL";
        }

        Map<String, Object> change = new HashMap<>();
        change.put("userId", userId);
        change.put("role", safeRole);
        change.put("position", safePosition);
        String result = projectService.updateProjectMembers(
                projId, loginUser.getUserId(), List.of(change));
        return "success".equals(result) ? "SUCCESS" : result.toUpperCase();
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

        if (!projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return "NO_PERMISSION";
        }

        String safePosition = projPosition == null ? null : projPosition.trim();
        if (safePosition != null && safePosition.length() > 100) {
            safePosition = safePosition.substring(0, 100);
        }

        boolean result = projectService.updateProjectMemberPosition(projId, userId, safePosition);
        return result ? "SUCCESS" : "FAIL";
    }



    @GetMapping("/api/plan-features")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectPlanFeature(
            @RequestParam("projId") Long projId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "LOGIN_REQUIRED"));
        if (projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", "FORBIDDEN"));
        }
        projectPlanFeatureDTO feature = projectService.getProjectPlanFeature(projId);
        if (feature == null) {
            feature = new projectPlanFeatureDTO();
            feature.setProjId(projId);
            feature.setPeriodEnabledYn("N");
            feature.setTimeEnabledYn("N");
            feature.setWeeklyEnabledYn("N");
        }
        return ResponseEntity.ok(Map.of("status", "OK", "feature", feature));
    }

    @PutMapping("/api/plan-features")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateProjectPlanFeature(
            @RequestBody projectPlanFeatureDTO feature, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "LOGIN_REQUIRED"));
        if (feature == null || feature.getProjId() == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID_REQUEST", "message", "프로젝트 ID가 필요합니다."));
        }
        if (!projectAuthorizationService.canManageProject(feature.getProjId(), loginUser.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", "FORBIDDEN"));
        }
        normalizePlanFeatureYn(feature);
        if ("Y".equalsIgnoreCase(feature.getPeriodEnabledYn())) {
            projectRequestDTO project = projectService.getProjectById(feature.getProjId());
            if (project == null || project.getStartDate() == null || project.getStartDate().isBlank()
                    || project.getEndDate() == null || project.getEndDate().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "PROJECT_PERIOD_REQUIRED",
                        "message", "기간별 계획을 사용하려면 프로젝트 기간을 먼저 설정해 주세요."));
            }
        }
        String rangeError = validateTimePlanFeatureRange(feature);
        if (rangeError != null) return ResponseEntity.badRequest().body(Map.of("status", "INVALID_RANGE", "message", rangeError));
        projectPlanFeatureDTO saved = projectService.updateProjectPlanFeature(feature);
        return ResponseEntity.ok(Map.of("status", "OK", "feature", saved));
    }

    @DeleteMapping("/api/plan-features/{type}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> removeProjectPlanFeature(
            @PathVariable("type") String type,
            @RequestParam("projId") Long projId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "LOGIN_REQUIRED"));
        if (!projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", "FORBIDDEN"));
        }
        try {
            projectPlanFeatureDTO saved = projectService.removeProjectPlanFeature(projId, type);
            return ResponseEntity.ok(Map.of("status", "OK", "feature", saved));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID_TYPE", "message", error.getMessage()));
        }
    }

    private void normalizePlanFeatureYn(projectPlanFeatureDTO feature) {
        feature.setPeriodEnabledYn(normalizeOptionalYn(feature.getPeriodEnabledYn()));
        feature.setTimeEnabledYn(normalizeOptionalYn(feature.getTimeEnabledYn()));
        feature.setWeeklyEnabledYn(normalizeOptionalYn(feature.getWeeklyEnabledYn()));
    }

    private String normalizeOptionalYn(String value) {
        if (value == null || value.isBlank()) return null;
        return "Y".equalsIgnoreCase(value) ? "Y" : "N";
    }

    private String validateTimePlanFeatureRange(projectPlanFeatureDTO feature) {
        if (feature.getTimeRangeStartDate() == null && feature.getTimeRangeEndDate() == null) return null;
        if (feature.getTimeRangeStartDate() == null || feature.getTimeRangeEndDate() == null) return "시작일과 종료일을 모두 입력해주세요.";
        try {
            LocalDate start = LocalDate.parse(feature.getTimeRangeStartDate());
            LocalDate end = LocalDate.parse(feature.getTimeRangeEndDate());
            if (start.isAfter(end)) return "종료일은 시작일보다 빠를 수 없습니다.";
            if (java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1 > 28) return "시간별 계획표는 최대 28일까지 선택할 수 있습니다.";
            projectRequestDTO project = projectService.getProjectById(feature.getProjId());
            if (project != null && project.getStartDate() != null && project.getEndDate() != null) {
                LocalDate projectStart = LocalDate.parse(project.getStartDate().substring(0, 10));
                LocalDate projectEnd = LocalDate.parse(project.getEndDate().substring(0, 10));
                if (start.isBefore(projectStart) || end.isAfter(projectEnd)) return "프로젝트 기간 안에서 선택해주세요.";
            }
        } catch (DateTimeParseException ex) {
            return "날짜 형식이 올바르지 않습니다.";
        }
        return null;
    }

    @GetMapping("/api/period-plans")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectPeriodPlans(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null) return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "프로젝트 조회 권한이 없습니다.", null);
        try {
            if (startDate != null && !startDate.isBlank()) LocalDate.parse(startDate);
            if (endDate != null && !endDate.isBlank()) LocalDate.parse(endDate);
        } catch (DateTimeParseException e) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_DATE_FORMAT", "날짜 형식이 올바르지 않습니다.", null);
        }
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "기간별 계획 목록을 조회했습니다.",
                projectService.getProjectPeriodPlans(projId, startDate, endDate));
    }

    @GetMapping("/api/period-plans/{periodPlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectPeriodPlan(
            @PathVariable("periodPlanId") Long periodPlanId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectPeriodPlanDTO phase = projectService.getProjectPeriodPlan(periodPlanId);
        if (phase == null) return phaseError(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND", "기간별 계획을 찾을 수 없습니다.", null);
        if (projectAuthorizationService.getAccessibleProject(phase.getProjId(), null, loginUser.getUserId()) == null) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "기간별 계획 조회 권한이 없습니다.", null);
        }
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "기간별 계획을 조회했습니다.", phase);
    }

    @PostMapping("/api/period-plans")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addProjectPeriodPlan(
            @RequestBody projectPeriodPlanDTO phase,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        if (phase == null || phase.getProjId() == null) {
            return phaseError(HttpStatus.BAD_REQUEST, "PROJECT_REQUIRED", "프로젝트 정보가 필요합니다.", "projId");
        }
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(phase.getProjId(), null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(phase.getProjId(), loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "기간별 계획 등록 권한이 없습니다.", null);
        }
        String validation = validatePeriodPlanInput(project, phase);
        if (validation != null) return phaseValidationError(validation);
        phase.setPeriodPlanId(null);
        phase.setTitle(phase.getTitle().trim());
        phase.setDescription(normalizeNullableText(phase.getDescription()));
        phase.setColor(phase.getColor().trim().toUpperCase());
        phase.setCreatedBy(loginUser.getUserId());
        projectPeriodPlanDTO created = projectService.addProjectPeriodPlan(phase);
        projectService.replaceProjectPlanEditors(
                created.getProjId(), "PERIOD_PLAN", created.getPeriodPlanId(),
                phase.getEditorUserIds(), loginUser.getUserId());
        created.setEditorUserIds(projectService.getProjectPlanEditorUserIds(
                created.getProjId(), "PERIOD_PLAN", created.getPeriodPlanId()));
        recordProjectPlanActivity(project, loginUser.getUserId(), "PERIOD_PLAN_CREATE",
                "PERIOD_PLAN", created.getPeriodPlanId(), created.getTitle(), "기간별 계획을 등록했어요.");
        return phaseSuccess(HttpStatus.CREATED, "SUCCESS", "기간별 계획이 등록되었습니다.", created);
    }

    @PutMapping("/api/period-plans/{periodPlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateProjectPeriodPlan(
            @PathVariable("periodPlanId") Long periodPlanId,
            @RequestBody projectPeriodPlanDTO request,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectPeriodPlanDTO current = projectService.getProjectPeriodPlan(periodPlanId);
        if (current == null) return phaseError(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND", "기간별 계획을 찾을 수 없습니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(current.getProjId(), null, loginUser.getUserId());
        boolean canManagePlan = project != null && projectAuthorizationService.canManageProject(current.getProjId(), loginUser.getUserId());
        boolean delegatedEditor = project != null
                && projectAuthorizationService.canModifyProjectContent(current.getProjId(), loginUser.getUserId())
                && projectService.isProjectPlanEditor(
                        current.getProjId(), "PERIOD_PLAN", periodPlanId, loginUser.getUserId());
        if (project == null || (!canManagePlan && !delegatedEditor)) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "기간별 계획 수정 권한이 없습니다.", null);
        }
        request.setPeriodPlanId(periodPlanId);
        request.setProjId(current.getProjId());
        if (request.getRecordEnabledYn() == null || request.getRecordEnabledYn().isBlank()) {
            request.setRecordEnabledYn(current.getRecordEnabledYn());
        }
        if (request.getRecordVisibility() == null || request.getRecordVisibility().isBlank()) {
            request.setRecordVisibility(current.getRecordVisibility());
        }
        if (request.getEditorUserIds() == null) {
            request.setEditorUserIds(current.getEditorUserIds());
        }
        String validation = validatePeriodPlanInput(project, request);
        if (validation != null) return phaseValidationError(validation);
        request.setTitle(request.getTitle().trim());
        request.setDescription(normalizeNullableText(request.getDescription()));
        request.setColor(request.getColor().trim().toUpperCase());
        boolean updated = projectService.updateProjectPeriodPlan(request);
        if (!updated) return phaseError(HttpStatus.CONFLICT, "UPDATE_FAILED", "기간별 계획을 수정하지 못했습니다.", null);
        if (canManagePlan) {
            projectService.replaceProjectPlanEditors(
                    current.getProjId(), "PERIOD_PLAN", periodPlanId,
                    request.getEditorUserIds(), loginUser.getUserId());
        }
        projectPeriodPlanDTO updatedPhase = projectService.getProjectPeriodPlan(periodPlanId);
        recordProjectPlanActivity(project, loginUser.getUserId(), "PERIOD_PLAN_UPDATE",
                "PERIOD_PLAN", periodPlanId, updatedPhase == null ? request.getTitle() : updatedPhase.getTitle(), "기간별 계획을 수정했어요.");
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "기간별 계획이 수정되었습니다.", updatedPhase);
    }

    @DeleteMapping("/api/period-plans/{periodPlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteProjectPeriodPlan(
            @PathVariable("periodPlanId") Long periodPlanId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectPeriodPlanDTO current = projectService.getProjectPeriodPlan(periodPlanId);
        if (current == null) return phaseError(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND", "기간별 계획을 찾을 수 없습니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(current.getProjId(), null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(current.getProjId(), loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "기간별 계획 삭제 권한이 없습니다.", null);
        }
        boolean deleted = projectService.deleteProjectPeriodPlan(periodPlanId, current.getProjId());
        if (!deleted) return phaseError(HttpStatus.CONFLICT, "DELETE_FAILED", "기간별 계획을 삭제하지 못했습니다.", null);
        recordProjectPlanActivity(project, loginUser.getUserId(), "PERIOD_PLAN_DELETE",
                "PERIOD_PLAN", periodPlanId, current.getTitle(), "기간별 계획을 삭제했어요.");
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "기간별 계획이 삭제되었습니다.", null);
    }

    @PatchMapping("/api/period-plans/order")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reorderProjectPeriodPlans(
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        Long projId = toLong(body == null ? null : body.get("projId"));
        if (projId == null) return phaseError(HttpStatus.BAD_REQUEST, "PROJECT_REQUIRED", "프로젝트 정보가 필요합니다.", "projId");
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "기간별 계획 정렬 권한이 없습니다.", null);
        }
        Object rawIds = body.get("periodPlanIds");
        if (!(rawIds instanceof List<?> rawList)) {
            return phaseError(HttpStatus.BAD_REQUEST, "PERIOD_PLAN_IDS_REQUIRED", "정렬할 기간별 계획 목록이 필요합니다.", "periodPlanIds");
        }
        List<Long> periodPlanIds = new ArrayList<>();
        for (Object rawId : rawList) {
            Long id = toLong(rawId);
            if (id == null) return phaseError(HttpStatus.BAD_REQUEST, "INVALID_PHASE_ID", "기간별 계획 ID가 올바르지 않습니다.", "periodPlanIds");
            periodPlanIds.add(id);
        }
        boolean reordered = projectService.reorderProjectPeriodPlans(projId, periodPlanIds);
        if (!reordered) return phaseError(HttpStatus.BAD_REQUEST, "INVALID_PHASE_ORDER", "프로젝트의 전체 기간별 계획을 중복 없이 전달해주세요.", "periodPlanIds");
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "기간별 계획 순서가 변경되었습니다.", projectService.getProjectPeriodPlans(projId, null, null));
    }

    @GetMapping("/api/time-plans")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectTimePlans(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "taskId", required = false) Long taskId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null) return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "시간별 계획 조회 권한이 없습니다.", null);
        String rangeError = validateOptionalDateRange(startDate, endDate);
        if (rangeError != null) return timePlanValidationError(rangeError);
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "시간별 계획 목록을 조회했습니다.",
                projectService.getProjectTimePlans(projId, startDate, endDate, taskId));
    }

    @GetMapping("/api/time-plans/{timePlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectTimePlan(
            @PathVariable("timePlanId") Long timePlanId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectTimePlanDTO plan = projectService.getProjectTimePlan(timePlanId);
        if (plan == null) return phaseError(HttpStatus.NOT_FOUND, "TIME_PLAN_NOT_FOUND", "시간별 계획을 찾을 수 없습니다.", null);
        if (projectAuthorizationService.getAccessibleProject(plan.getProjId(), null, loginUser.getUserId()) == null) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "시간별 계획 조회 권한이 없습니다.", null);
        }
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "시간별 계획을 조회했습니다.", plan);
    }

    @PostMapping("/api/time-plans")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addProjectTimePlan(
            @RequestBody projectTimePlanDTO plan,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        if (plan == null || plan.getProjId() == null) {
            return phaseError(HttpStatus.BAD_REQUEST, "PROJECT_REQUIRED", "프로젝트 정보가 필요합니다.", "projId");
        }
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(plan.getProjId(), null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(plan.getProjId(), loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "시간별 계획 등록 권한이 없습니다.", null);
        }
        normalizeTimePlanMidnightBoundary(plan);
        String validation = validateTimePlanInput(project, plan);
        if (validation != null) return timePlanValidationError(validation);
        normalizeTimePlan(plan);
        plan.setTimePlanId(null);
        plan.setCreatedBy(loginUser.getUserId());
        projectTimePlanDTO created = projectService.addProjectTimePlan(plan);
        projectService.replaceProjectPlanEditors(
                created.getProjId(), "TIME_PLAN", created.getTimePlanId(),
                plan.getEditorUserIds(), loginUser.getUserId());
        created.setEditorUserIds(projectService.getProjectPlanEditorUserIds(
                created.getProjId(), "TIME_PLAN", created.getTimePlanId()));
        recordProjectPlanActivity(project, loginUser.getUserId(), "TIME_PLAN_CREATE",
                "TIME_PLAN", created.getTimePlanId(), created.getTitle(), "시간별 계획을 등록했어요.");
        return phaseSuccess(HttpStatus.CREATED, "SUCCESS", "시간별 계획이 등록되었습니다.", created);
    }

    @PutMapping("/api/time-plans/{timePlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateProjectTimePlan(
            @PathVariable("timePlanId") Long timePlanId,
            @RequestBody projectTimePlanDTO request,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectTimePlanDTO current = projectService.getProjectTimePlan(timePlanId);
        if (current == null) return phaseError(HttpStatus.NOT_FOUND, "TIME_PLAN_NOT_FOUND", "시간별 계획을 찾을 수 없습니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(current.getProjId(), null, loginUser.getUserId());
        boolean canManagePlan = project != null && projectAuthorizationService.canManageProject(current.getProjId(), loginUser.getUserId());
        boolean delegatedEditor = project != null
                && projectAuthorizationService.canModifyProjectContent(current.getProjId(), loginUser.getUserId())
                && projectService.isProjectPlanEditor(
                        current.getProjId(), "TIME_PLAN", timePlanId, loginUser.getUserId());
        if (project == null || (!canManagePlan && !delegatedEditor)) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "시간별 계획 수정 권한이 없습니다.", null);
        }
        request.setTimePlanId(timePlanId);
        request.setProjId(current.getProjId());
        if (request.getRecordEnabledYn() == null || request.getRecordEnabledYn().isBlank()) {
            request.setRecordEnabledYn(current.getRecordEnabledYn());
        }
        if (request.getRecordVisibility() == null || request.getRecordVisibility().isBlank()) {
            request.setRecordVisibility(current.getRecordVisibility());
        }
        if (request.getEditorUserIds() == null) {
            request.setEditorUserIds(current.getEditorUserIds());
        }
        if (request.getSortOrder() == null) {
            request.setSortOrder(current.getSortOrder());
        }
        normalizeTimePlanMidnightBoundary(request);
        String validation = validateTimePlanInput(project, request);
        if (validation != null) return timePlanValidationError(validation);
        normalizeTimePlan(request);
        if (!projectService.updateProjectTimePlan(request)) {
            return phaseError(HttpStatus.CONFLICT, "UPDATE_FAILED", "시간별 계획을 수정하지 못했습니다.", null);
        }
        if (canManagePlan) {
            projectService.replaceProjectPlanEditors(
                    current.getProjId(), "TIME_PLAN", timePlanId,
                    request.getEditorUserIds(), loginUser.getUserId());
        }
        projectTimePlanDTO updatedTimePlan = projectService.getProjectTimePlan(timePlanId);
        recordProjectPlanActivity(project, loginUser.getUserId(), "TIME_PLAN_UPDATE",
                "TIME_PLAN", timePlanId, updatedTimePlan == null ? request.getTitle() : updatedTimePlan.getTitle(), "시간별 계획을 수정했어요.");
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "시간별 계획이 수정되었습니다.",
                updatedTimePlan);
    }

    @DeleteMapping("/api/time-plans/{timePlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteProjectTimePlan(
            @PathVariable("timePlanId") Long timePlanId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectTimePlanDTO current = projectService.getProjectTimePlan(timePlanId);
        if (current == null) return phaseError(HttpStatus.NOT_FOUND, "TIME_PLAN_NOT_FOUND", "시간별 계획을 찾을 수 없습니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(current.getProjId(), null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(current.getProjId(), loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "시간별 계획 삭제 권한이 없습니다.", null);
        }
        if (!projectService.deleteProjectTimePlan(timePlanId, current.getProjId())) {
            return phaseError(HttpStatus.CONFLICT, "DELETE_FAILED", "시간별 계획을 삭제하지 못했습니다.", null);
        }
        recordProjectPlanActivity(project, loginUser.getUserId(), "TIME_PLAN_DELETE",
                "TIME_PLAN", timePlanId, current.getTitle(), "시간별 계획을 삭제했어요.");
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "시간별 계획이 삭제되었습니다.", null);
    }

    @PatchMapping("/api/time-plans/order")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reorderProjectTimePlans(
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        Long projId = toLong(body == null ? null : body.get("projId"));
        String planDate = body == null || body.get("planDate") == null ? null : String.valueOf(body.get("planDate"));
        if (projId == null) return phaseError(HttpStatus.BAD_REQUEST, "PROJECT_REQUIRED", "프로젝트 정보가 필요합니다.", "projId");
        if (!isValidIsoDate(planDate)) return phaseError(HttpStatus.BAD_REQUEST, "INVALID_DATE_FORMAT", "날짜 형식이 올바르지 않습니다.", "planDate");
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "시간별 계획 정렬 권한이 없습니다.", null);
        }
        Object rawIds = body.get("timePlanIds");
        if (!(rawIds instanceof List<?> rawList)) {
            return phaseError(HttpStatus.BAD_REQUEST, "TIME_PLAN_IDS_REQUIRED", "정렬할 시간별 계획 목록이 필요합니다.", "timePlanIds");
        }
        List<Long> ids = new ArrayList<>();
        for (Object rawId : rawList) {
            Long id = toLong(rawId);
            if (id == null) return phaseError(HttpStatus.BAD_REQUEST, "INVALID_TIME_PLAN_ID", "시간별 계획 ID가 올바르지 않습니다.", "timePlanIds");
            ids.add(id);
        }
        if (!projectService.reorderProjectTimePlans(projId, planDate, ids)) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_TIME_PLAN_ORDER", "해당 날짜의 전체 시간별 계획을 중복 없이 전달해주세요.", "timePlanIds");
        }
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "시간별 계획 순서가 변경되었습니다.",
                projectService.getProjectTimePlans(projId, planDate, planDate, null));
    }

    @GetMapping("/api/weekly-plans")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectWeeklyPlans(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "dayOfWeek", required = false) Integer dayOfWeek,
            @RequestParam(value = "activeYn", required = false) String activeYn,
            @RequestParam(value = "taskId", required = false) Long taskId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        if (dayOfWeek != null && (dayOfWeek < 1 || dayOfWeek > 7)) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_DAY_OF_WEEK", "요일 값이 올바르지 않습니다.", "dayOfWeek");
        }
        String normalizedActiveYn = normalizeYn(activeYn, true);
        if (activeYn != null && normalizedActiveYn == null) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_ACTIVE_YN", "활성 여부가 올바르지 않습니다.", "activeYn");
        }
        if (projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "주간 계획 조회 권한이 없습니다.", null);
        }
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "주간 계획 목록을 조회했습니다.",
                projectService.getProjectWeeklyPlans(projId, dayOfWeek, normalizedActiveYn, taskId));
    }

    @GetMapping("/api/weekly-plans/{weeklyPlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectWeeklyPlan(
            @PathVariable("weeklyPlanId") Long weeklyPlanId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectWeeklyPlanDTO plan = projectService.getProjectWeeklyPlan(weeklyPlanId);
        if (plan == null) return phaseError(HttpStatus.NOT_FOUND, "WEEKLY_PLAN_NOT_FOUND", "주간 계획을 찾을 수 없습니다.", null);
        if (projectAuthorizationService.getAccessibleProject(plan.getProjId(), null, loginUser.getUserId()) == null) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "주간 계획 조회 권한이 없습니다.", null);
        }
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "주간 계획을 조회했습니다.", plan);
    }

    @PostMapping("/api/weekly-plans")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addProjectWeeklyPlan(
            @RequestBody projectWeeklyPlanDTO plan,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        if (plan == null || plan.getProjId() == null) {
            return phaseError(HttpStatus.BAD_REQUEST, "PROJECT_REQUIRED", "프로젝트 정보가 필요합니다.", "projId");
        }
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(plan.getProjId(), null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(plan.getProjId(), loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "주간 계획 등록 권한이 없습니다.", null);
        }
        String validation = validateWeeklyPlanInput(project, plan);
        if (validation != null) return weeklyPlanValidationError(validation);
        normalizeWeeklyPlan(plan, project);
        plan.setWeeklyPlanId(null);
        plan.setCreatedBy(loginUser.getUserId());
        projectWeeklyPlanDTO created = projectService.addProjectWeeklyPlan(plan);
        projectService.replaceProjectPlanEditors(
                created.getProjId(), "WEEKLY_PLAN", created.getWeeklyPlanId(),
                plan.getEditorUserIds(), loginUser.getUserId());
        created.setEditorUserIds(projectService.getProjectPlanEditorUserIds(
                created.getProjId(), "WEEKLY_PLAN", created.getWeeklyPlanId()));
        recordProjectPlanActivity(project, loginUser.getUserId(), "WEEKLY_PLAN_CREATE",
                "WEEKLY_PLAN", created.getWeeklyPlanId(), created.getTitle(), "주간 계획을 등록했어요.");
        return phaseSuccess(HttpStatus.CREATED, "SUCCESS", "주간 계획이 등록되었습니다.", created);
    }

    @PutMapping("/api/weekly-plans/{weeklyPlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateProjectWeeklyPlan(
            @PathVariable("weeklyPlanId") Long weeklyPlanId,
            @RequestBody projectWeeklyPlanDTO request,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectWeeklyPlanDTO current = projectService.getProjectWeeklyPlan(weeklyPlanId);
        if (current == null) return phaseError(HttpStatus.NOT_FOUND, "WEEKLY_PLAN_NOT_FOUND", "주간 계획을 찾을 수 없습니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(current.getProjId(), null, loginUser.getUserId());
        boolean canManagePlan = project != null && projectAuthorizationService.canManageProject(current.getProjId(), loginUser.getUserId());
        boolean delegatedEditor = project != null
                && projectAuthorizationService.canModifyProjectContent(current.getProjId(), loginUser.getUserId())
                && projectService.isProjectPlanEditor(
                        current.getProjId(), "WEEKLY_PLAN", weeklyPlanId, loginUser.getUserId());
        if (project == null || (!canManagePlan && !delegatedEditor)) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "주간 계획 수정 권한이 없습니다.", null);
        }
        request.setWeeklyPlanId(weeklyPlanId);
        request.setProjId(current.getProjId());
        if (request.getRecordEnabledYn() == null || request.getRecordEnabledYn().isBlank()) {
            request.setRecordEnabledYn(current.getRecordEnabledYn());
        }
        if (request.getRecordVisibility() == null || request.getRecordVisibility().isBlank()) {
            request.setRecordVisibility(current.getRecordVisibility());
        }
        if (request.getEditorUserIds() == null) {
            request.setEditorUserIds(current.getEditorUserIds());
        }
        String validation = validateWeeklyPlanInput(project, request);
        if (validation != null) return weeklyPlanValidationError(validation);
        normalizeWeeklyPlan(request, project);
        if (!projectService.updateProjectWeeklyPlan(request)) {
            return phaseError(HttpStatus.CONFLICT, "UPDATE_FAILED", "주간 계획을 수정하지 못했습니다.", null);
        }
        if (canManagePlan) {
            projectService.replaceProjectPlanEditors(
                    current.getProjId(), "WEEKLY_PLAN", weeklyPlanId,
                    request.getEditorUserIds(), loginUser.getUserId());
        }
        projectWeeklyPlanDTO updatedWeeklyPlan = projectService.getProjectWeeklyPlan(weeklyPlanId);
        recordProjectPlanActivity(project, loginUser.getUserId(), "WEEKLY_PLAN_UPDATE",
                "WEEKLY_PLAN", weeklyPlanId, updatedWeeklyPlan == null ? request.getTitle() : updatedWeeklyPlan.getTitle(), "주간 계획을 수정했어요.");
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "주간 계획이 수정되었습니다.",
                updatedWeeklyPlan);
    }

    @DeleteMapping("/api/weekly-plans/{weeklyPlanId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteProjectWeeklyPlan(
            @PathVariable("weeklyPlanId") Long weeklyPlanId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        projectWeeklyPlanDTO current = projectService.getProjectWeeklyPlan(weeklyPlanId);
        if (current == null) return phaseError(HttpStatus.NOT_FOUND, "WEEKLY_PLAN_NOT_FOUND", "주간 계획을 찾을 수 없습니다.", null);
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(current.getProjId(), null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(current.getProjId(), loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "주간 계획 삭제 권한이 없습니다.", null);
        }
        if (!projectService.deleteProjectWeeklyPlan(weeklyPlanId, current.getProjId())) {
            return phaseError(HttpStatus.CONFLICT, "DELETE_FAILED", "주간 계획을 삭제하지 못했습니다.", null);
        }
        recordProjectPlanActivity(project, loginUser.getUserId(), "WEEKLY_PLAN_DELETE",
                "WEEKLY_PLAN", weeklyPlanId, current.getTitle(), "주간 계획을 삭제했어요.");
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "주간 계획이 삭제되었습니다.", null);
    }

    @PatchMapping("/api/weekly-plans/order")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reorderProjectWeeklyPlans(
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        Long projId = toLong(body == null ? null : body.get("projId"));
        Integer dayOfWeek = toInteger(body == null ? null : body.get("dayOfWeek"));
        if (projId == null) return phaseError(HttpStatus.BAD_REQUEST, "PROJECT_REQUIRED", "프로젝트 정보가 필요합니다.", "projId");
        if (dayOfWeek == null || dayOfWeek < 1 || dayOfWeek > 7) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_DAY_OF_WEEK", "요일 값이 올바르지 않습니다.", "dayOfWeek");
        }
        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null || !projectAuthorizationService.canManageProject(projId, loginUser.getUserId())) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "주간 계획 정렬 권한이 없습니다.", null);
        }
        Object rawIds = body.get("weeklyPlanIds");
        if (!(rawIds instanceof List<?> rawList)) {
            return phaseError(HttpStatus.BAD_REQUEST, "WEEKLY_PLAN_IDS_REQUIRED", "정렬할 주간 계획 목록이 필요합니다.", "weeklyPlanIds");
        }
        List<Long> ids = new ArrayList<>();
        for (Object rawId : rawList) {
            Long id = toLong(rawId);
            if (id == null) return phaseError(HttpStatus.BAD_REQUEST, "INVALID_WEEKLY_PLAN_ID", "주간 계획 ID가 올바르지 않습니다.", "weeklyPlanIds");
            ids.add(id);
        }
        if (!projectService.reorderProjectWeeklyPlans(projId, dayOfWeek, ids)) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_WEEKLY_PLAN_ORDER", "해당 요일의 전체 주간 계획을 중복 없이 전달해주세요.", "weeklyPlanIds");
        }
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "주간 계획 순서가 변경되었습니다.",
                projectService.getProjectWeeklyPlans(projId, dayOfWeek, null, null));
    }

    /**
     * 큰 프로젝트 달력 전용 통합 조회.
     * 저장은 각 원본 API가 담당하며, 이 API는 화면 표시용 데이터만 평탄화한다.
     */
    @GetMapping("/api/plan-calendar-prefs")
    @ResponseBody
    public ResponseEntity<?> getPlanCalendarPrefs(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        if (projectAuthorizationService.getAccessibleProject(projId, null, user.getUserId()) == null)
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "프로젝트 접근 권한이 없습니다.", null);
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "달력 표시 설정을 조회했습니다.",
                projectService.getProjectPlanCalendarPref(user.getUserId(), projId));
    }

    @PutMapping("/api/plan-calendar-prefs")
    @ResponseBody
    public ResponseEntity<?> savePlanCalendarPrefs(@RequestBody projectPlanCalendarPrefDTO dto, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        if (dto == null || dto.getProjId() == null) return phaseError(HttpStatus.BAD_REQUEST, "PROJ_ID_REQUIRED", "프로젝트 ID가 필요합니다.", "projId");
        if (projectAuthorizationService.getAccessibleProject(dto.getProjId(), null, user.getUserId()) == null)
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "프로젝트 접근 권한이 없습니다.", null);
        dto.setUserId(user.getUserId());
        dto.setShowPeriodYn(normalizeYn(dto.getShowPeriodYn(), false));
        dto.setShowTimeYn(normalizeYn(dto.getShowTimeYn(), false));
        dto.setShowWeeklyYn(normalizeYn(dto.getShowWeeklyYn(), false));
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "달력 표시 설정을 저장했습니다.", projectService.saveProjectPlanCalendarPref(dto));
    }

    @GetMapping("/api/calendar-items")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProjectCalendarItems(
            @RequestParam("projId") Long projId,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "include", required = false) String include,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return phaseError(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "로그인이 필요합니다.", null);
        }

        projectRequestDTO project = projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId());
        if (project == null) {
            return phaseError(HttpStatus.FORBIDDEN, "NO_PERMISSION", "프로젝트 달력 조회 권한이 없습니다.", null);
        }

        LocalDate rangeStart;
        LocalDate rangeEnd;
        try {
            rangeStart = LocalDate.parse(startDate);
            rangeEnd = LocalDate.parse(endDate);
        } catch (Exception e) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_DATE_FORMAT", "날짜 형식이 올바르지 않습니다.", "startDate");
        }
        if (rangeEnd.isBefore(rangeStart)) {
            return phaseError(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE", "종료일은 시작일보다 빠를 수 없습니다.", "endDate");
        }

        boolean hasProjectPeriod = project.getStartDate() != null && !project.getStartDate().isBlank()
                && project.getEndDate() != null && !project.getEndDate().isBlank();

        Set<String> includes;
        if (include == null || include.isBlank()) {
            projectPlanCalendarPrefDTO pref = projectService.getProjectPlanCalendarPref(loginUser.getUserId(), projId);
            includes = new LinkedHashSet<>(Set.of("TASK", "SCHEDULE"));
            if (hasProjectPeriod) includes.add("PROJECT_PERIOD");
            if ("Y".equalsIgnoreCase(pref.getShowPeriodYn())) includes.add("PHASE");
            if ("Y".equalsIgnoreCase(pref.getShowTimeYn())) includes.add("TIME_PLAN");
            if ("Y".equalsIgnoreCase(pref.getShowWeeklyYn())) includes.add("WEEKLY_PLAN");
        } else {
            includes = normalizeCalendarIncludes(include);
            if (includes == null) return phaseError(HttpStatus.BAD_REQUEST, "INVALID_INCLUDE", "조회 유형이 올바르지 않습니다.", "include");
        }

        List<Map<String, Object>> items = new ArrayList<>();

        // 대체 모드는 현재 조회 월이 아니라 프로젝트 전체 계획 데이터 존재 여부로 판정한다.
        // 특정 월에 단계/마일스톤이 없더라도 프로젝트가 다시 DEFAULT로 흔들리지 않게 한다.
        List<projectPeriodPlanDTO> allPhases = projectService.getProjectPeriodPlans(projId, null, null);
        boolean ganttReplacementActive = !allPhases.isEmpty();
        String projectRangeMode = ganttReplacementActive ? "GANTT" : "DEFAULT";

        List<projectPeriodPlanDTO> phases = projectService.getProjectPeriodPlans(projId, startDate, endDate);

        // 기본 프로젝트 기간은 간트 대체 데이터가 전혀 없을 때만 달력 항목으로 노출한다.
        if (hasProjectPeriod
                && "DEFAULT".equals(projectRangeMode)
                && includes.contains("PROJECT_PERIOD")
                && overlapsCalendarRange(project.getStartDate(), project.getEndDate(), rangeStart, rangeEnd)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", "PROJECT_PERIOD:" + projId);
            item.put("entityId", projId);
            item.put("type", "PROJECT_PERIOD");
            item.put("title", project.getProjName());
            item.put("start", project.getStartDate());
            item.put("end", project.getEndDate());
            item.put("allDay", true);
            item.put("color", "#7A5CFF");
            item.put("status", project.getStatus());
            item.put("projectType", ProjectPolicy.normalizeType(project.getProjType()));
            item.put("projectIcon", ProjectPolicy.normalizeIcon(project.getProjIcon(), project.getProjType()));
            items.add(item);
        }

        if (includes.contains("PHASE")) {
            for (projectPeriodPlanDTO phase : phases) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", "PHASE:" + phase.getPeriodPlanId());
                item.put("entityId", phase.getPeriodPlanId());
                item.put("type", "PHASE");
                item.put("title", phase.getTitle());
                item.put("start", phase.getStartDate());
                item.put("end", phase.getEndDate());
                item.put("allDay", true);
                item.put("color", phase.getColor());
                item.put("sortOrder", phase.getSortOrder());
                item.put("display", "background");
                item.put("background", true);
                items.add(item);
            }
        }

        if (includes.contains("TASK")) {
            for (Map<String, Object> task : projectService.getProjectTasks(projId)) {
                String taskStart = mapString(task, "START_DATE");
                String taskEnd = mapString(task, "END_DATE");
                if (!overlapsCalendarRange(taskStart, taskEnd, rangeStart, rangeEnd)) continue;

                boolean useTime = "Y".equalsIgnoreCase(mapString(task, "USE_TIME"));
                Map<String, Object> item = new LinkedHashMap<>();
                Long taskId = toLong(task.get("TASK_ID"));
                item.put("id", "TASK:" + taskId);
                item.put("entityId", taskId);
                item.put("type", "TASK");
                item.put("title", mapString(task, "TITLE"));
                item.put("start", calendarDateTime(taskStart, mapString(task, "START_TIME"), useTime));
                item.put("end", calendarDateTime(taskEnd, mapString(task, "END_TIME"), useTime));
                item.put("allDay", !useTime);
                item.put("color", "#7A5CFF");
                item.put("status", mapString(task, "STATUS"));
                item.put("assignedUserId", toLong(task.get("USER_ID")));
                item.put("assignedUserName", mapString(task, "USER_NAME"));
                item.put("assignedUserProfileImage", mapString(task, "PROFILE_IMAGE_PATH"));
                item.put("assignedUserRole", mapString(task, "ASSIGNEE_ROLE"));
                item.put("calendarVisible", "Y".equalsIgnoreCase(mapString(task, "CALENDAR_VISIBLE_YN")));
                item.put("delayed", "Y".equalsIgnoreCase(mapString(task, "DELAYED_YN")));
                item.put("sortOrder", task.get("SORT_ORDER"));
                items.add(item);
            }
        }

        if (includes.contains("TIME_PLAN")) {
            for (projectTimePlanDTO plan : projectService.getProjectTimePlans(projId, startDate, endDate, null)) {
                boolean allDay = "Y".equalsIgnoreCase(plan.getAllDayYn());
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", "TIME_PLAN:" + plan.getTimePlanId());
                item.put("entityId", plan.getTimePlanId());
                item.put("type", "TIME_PLAN");
                item.put("taskId", plan.getTaskId());
                item.put("title", plan.getTitle());
                item.put("start", calendarDateTime(plan.getStartDate(), plan.getStartTime(), !allDay));
                item.put("end", calendarDateTime(plan.getEndDate(), plan.getEndTime(), !allDay));
                item.put("allDay", allDay);
                item.put("color", plan.getColor());
                item.put("description", plan.getDescription());
                items.add(item);
            }
        }

        if (includes.contains("WEEKLY_PLAN")) {
            for (projectWeeklyPlanDTO plan : projectService.getProjectWeeklyPlans(projId, null, "Y", null)) {
                LocalDate repeatStart = safeDate(plan.getRepeatStartDate(), rangeStart);
                LocalDate repeatEnd = safeDate(plan.getRepeatEndDate(), rangeEnd);
                LocalDate cursor = repeatStart.isAfter(rangeStart) ? repeatStart : rangeStart;
                LocalDate last = repeatEnd.isBefore(rangeEnd) ? repeatEnd : rangeEnd;
                while (!cursor.isAfter(last)) {
                    if (plan.getDayOfWeek() != null && plan.getDayOfWeek() == cursor.getDayOfWeek().getValue()) {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("id", "WEEKLY_PLAN:" + plan.getWeeklyPlanId() + ":" + cursor);
                        item.put("entityId", plan.getWeeklyPlanId());
                        item.put("type", "WEEKLY_PLAN");
                        item.put("title", plan.getTitle());
                        item.put("start", calendarDateTime(cursor.toString(), plan.getStartTime(), true));
                        LocalDate weeklyEndDate = resolveWeeklyPlanEndDate(
                                cursor,
                                plan.getStartTime(),
                                plan.getEndTime()
                        );
                        item.put("end", calendarDateTime(weeklyEndDate.toString(), plan.getEndTime(), true));
                        item.put("allDay", false);
                        item.put("color", plan.getColor());
                        item.put("description", plan.getDescription());
                        item.put("recurring", true);
                        items.add(item);
                    }
                    cursor = cursor.plusDays(1);
                }
            }
        }

        if (includes.contains("SCHEDULE")) {
            for (Map<String, Object> schedule : projectService.getProjectSchedules(projId, startDate, endDate)) {
                String scheduleStart = mapString(schedule, "START_DATE");
                String scheduleEnd = mapString(schedule, "END_DATE");
                boolean useTime = "Y".equalsIgnoreCase(mapString(schedule, "USE_TIME"));
                Long scheduleId = toLong(schedule.get("EVENT_ID"));
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", "SCHEDULE:" + scheduleId);
                item.put("entityId", scheduleId);
                item.put("type", "SCHEDULE");
                item.put("title", mapString(schedule, "TITLE"));
                item.put("start", calendarDateTime(scheduleStart, mapString(schedule, "START_TIME"), useTime));
                item.put("end", calendarDateTime(scheduleEnd, mapString(schedule, "END_TIME"), useTime));
                item.put("allDay", !useTime);
                item.put("color", mapString(schedule, "COLOR"));
                item.put("status", mapString(schedule, "STATUS"));
                items.add(item);
            }
        }

        items.sort((left, right) -> {
            String leftStart = String.valueOf(left.getOrDefault("start", ""));
            String rightStart = String.valueOf(right.getOrDefault("start", ""));
            int compared = leftStart.compareTo(rightStart);
            if (compared != 0) return compared;
            return String.valueOf(left.getOrDefault("id", ""))
                    .compareTo(String.valueOf(right.getOrDefault("id", "")));
        });

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("projId", projId);
        data.put("startDate", startDate);
        data.put("endDate", endDate);
        data.put("projectRangeMode", projectRangeMode);
        data.put("ganttReplacementActive", ganttReplacementActive);
        data.put("rangeSource", ganttReplacementActive ? "PROJECT_PERIOD_PLAN" : (hasProjectPeriod ? "PROJECT_PERIOD" : "NONE"));
        data.put("projectPeriodVisible", hasProjectPeriod && !ganttReplacementActive);
        Map<String, Object> projectPeriod = new LinkedHashMap<>();
        projectPeriod.put("enabled", hasProjectPeriod);
        projectPeriod.put("startDate", project.getStartDate());
        projectPeriod.put("endDate", project.getEndDate());
        data.put("projectPeriod", projectPeriod);
        data.put("projectType", ProjectPolicy.normalizeType(project.getProjType()));
        data.put("projectIcon", ProjectPolicy.normalizeIcon(project.getProjIcon(), project.getProjType()));
        data.put("phaseCount", allPhases.size());
        data.put("includes", includes);
        data.put("itemCount", items.size());
        data.put("items", items);
        return phaseSuccess(HttpStatus.OK, "SUCCESS", "프로젝트 달력 항목을 조회했습니다.", data);
    }

    private Set<String> normalizeCalendarIncludes(String include) {
        Set<String> allowed = Set.of("PROJECT_PERIOD", "PHASE", "TASK", "WEEKLY_PLAN", "TIME_PLAN", "SCHEDULE");
        if (include == null || include.isBlank()) return new LinkedHashSet<>(allowed);
        Set<String> result = new LinkedHashSet<>();
        for (String raw : include.split(",")) {
            String value = raw == null ? "" : raw.trim().toUpperCase();
            if (value.isEmpty() || !allowed.contains(value)) return null;
            result.add(value);
        }
        return result;
    }

    private boolean overlapsCalendarRange(String itemStart, String itemEnd, LocalDate rangeStart, LocalDate rangeEnd) {
        if (itemStart == null || itemStart.isBlank()) return false;
        try {
            LocalDate start = LocalDate.parse(itemStart);
            LocalDate end = (itemEnd == null || itemEnd.isBlank()) ? start : LocalDate.parse(itemEnd);
            return !end.isBefore(rangeStart) && !start.isAfter(rangeEnd);
        } catch (Exception e) {
            return false;
        }
    }

    private LocalDate resolveWeeklyPlanEndDate(LocalDate startDate, String startTime, String endTime) {
        if (startDate == null) return null;
        if (startTime == null || startTime.isBlank() || endTime == null || endTime.isBlank()) {
            return startDate;
        }
        try {
            LocalTime start = LocalTime.parse(startTime.trim());
            LocalTime end = LocalTime.parse(endTime.trim());
            return end.isBefore(start) ? startDate.plusDays(1) : startDate;
        } catch (DateTimeParseException e) {
            return startDate;
        }
    }

    private String calendarDateTime(String date, String time, boolean useTime) {
        if (date == null) return null;
        return useTime && time != null && !time.isBlank() ? date + "T" + time : date;
    }

    private String mapString(Map<String, Object> source, String key) {
        if (source == null || key == null) return null;
        Object value = source.get(key);
        return value == null ? null : String.valueOf(value);
    }


    @GetMapping("/api/schedules")
    @ResponseBody
    public List<Map<String, Object>> getProjectSchedules(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || projectAuthorizationService.getAccessibleProject(projId, null, loginUser.getUserId()) == null) {
            return List.of();
        }
        return projectService.getProjectSchedules(projId, startDate, endDate);
    }

    private String validatePeriodPlanInput(projectRequestDTO project, projectPeriodPlanDTO phase) {
        if (project == null) return "PROJECT_NOT_FOUND";
        if (phase.getTitle() == null || phase.getTitle().trim().isEmpty()) return "TITLE_REQUIRED";
        if (phase.getTitle().trim().length() > 120) return "TITLE_TOO_LONG";
        if (phase.getDescription() != null && phase.getDescription().trim().length() > 1000) return "DESCRIPTION_TOO_LONG";
        if (phase.getStartDate() == null || phase.getStartDate().isBlank()
                || phase.getEndDate() == null || phase.getEndDate().isBlank()) return "DATE_REQUIRED";
        LocalDate start;
        LocalDate end;
        try {
            start = LocalDate.parse(phase.getStartDate());
            end = LocalDate.parse(phase.getEndDate());
        } catch (DateTimeParseException e) {
            return "INVALID_DATE_FORMAT";
        }
        if (end.isBefore(start)) return "INVALID_DATE_RANGE";
        try {
            LocalDate projectStart = LocalDate.parse(project.getStartDate());
            LocalDate projectEnd = LocalDate.parse(project.getEndDate());
            if (start.isBefore(projectStart) || end.isAfter(projectEnd)) return "OUTSIDE_PROJECT_RANGE";
        } catch (Exception e) {
            return "INVALID_PROJECT_RANGE";
        }
        String color = phase.getColor() == null || phase.getColor().isBlank() ? "#7A5CFF" : phase.getColor().trim().toUpperCase();
        if (!color.matches("^#[0-9A-F]{6}$")) return "INVALID_COLOR";
        phase.setColor(color);
        if (phase.getSortOrder() != null && phase.getSortOrder() < 1) return "INVALID_SORT_ORDER";
        return null;
    }

    private String validateOptionalDateRange(String startDate, String endDate) {
        if ((startDate == null || startDate.isBlank()) && (endDate == null || endDate.isBlank())) return null;
        if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) return "INVALID_DATE_FORMAT";
        if (LocalDate.parse(endDate).isBefore(LocalDate.parse(startDate))) return "INVALID_DATE_RANGE";
        return null;
    }

    private boolean isValidIsoDate(String value) {
        if (value == null || value.isBlank()) return false;
        try { LocalDate.parse(value.trim()); return true; }
        catch (DateTimeParseException e) { return false; }
    }

    private void normalizeTimePlanMidnightBoundary(projectTimePlanDTO plan) {
        if (plan == null || plan.getEndDate() == null || plan.getEndTime() == null) return;
        String endTime = plan.getEndTime().trim();
        if (!"24:00".equals(endTime)) return;
        try {
            LocalDate endDate = LocalDate.parse(plan.getEndDate().trim());
            plan.setEndDate(endDate.plusDays(1).toString());
            plan.setEndTime("00:00");
        } catch (DateTimeParseException ignored) {
            // 기존 검증 단계에서 날짜 형식 오류로 처리한다.
        }
    }

    private String validateTimePlanInput(projectRequestDTO project, projectTimePlanDTO plan) {
        if (project == null) return "PROJECT_NOT_FOUND";
        if (plan == null) return "INVALID_REQUEST";
        if (plan.getTitle() == null || plan.getTitle().trim().isEmpty()) return "TITLE_REQUIRED";
        if (plan.getTitle().trim().length() > 120) return "TITLE_TOO_LONG";
        if (plan.getDescription() != null && plan.getDescription().trim().length() > 1000) return "DESCRIPTION_TOO_LONG";
        if (!isValidIsoDate(plan.getStartDate()) || !isValidIsoDate(plan.getEndDate())) return "INVALID_DATE_FORMAT";
        String allDayYn = normalizeYn(plan.getAllDayYn(), false);
        if (allDayYn == null) return "INVALID_ALL_DAY";
        try {
            LocalDate startDate = LocalDate.parse(plan.getStartDate().trim());
            LocalDate endDate = LocalDate.parse(plan.getEndDate().trim());
            LocalDate projectStart = LocalDate.parse(project.getStartDate());
            LocalDate projectEnd = LocalDate.parse(project.getEndDate());
            if (endDate.isBefore(startDate)) return "INVALID_DATE_RANGE";
            if (startDate.isBefore(projectStart) || endDate.isAfter(projectEnd)) return "OUTSIDE_PROJECT_RANGE";
            if ("N".equals(allDayYn)) {
                if (plan.getStartTime() == null || plan.getStartTime().isBlank()
                        || plan.getEndTime() == null || plan.getEndTime().isBlank()) return "TIME_REQUIRED";
                LocalTime startTime = LocalTime.parse(plan.getStartTime().trim());
                LocalTime endTime = LocalTime.parse(plan.getEndTime().trim());
                java.time.LocalDateTime startAt = java.time.LocalDateTime.of(startDate, startTime);
                java.time.LocalDateTime endAt = java.time.LocalDateTime.of(endDate, endTime);
                if (!endAt.isAfter(startAt)) return "INVALID_TIME_RANGE";
                // 그리드 드래그만 15분 단위로 스냅한다.
                // 공통 모달에서 직접 입력한 시간은 1분 단위까지 허용한다.
                if (startTime.getSecond() != 0 || endTime.getSecond() != 0) return "INVALID_TIME_FORMAT";
            }
        } catch (DateTimeParseException e) { return "INVALID_TIME_FORMAT"; }
        catch (Exception e) { return "INVALID_PROJECT_RANGE"; }
        String color = plan.getColor() == null || plan.getColor().isBlank() ? "#7A5CFF" : plan.getColor().trim().toUpperCase();
        if (!color.matches("^#[0-9A-F]{6}$")) return "INVALID_COLOR";
        if (plan.getSortOrder() != null && plan.getSortOrder() < 1) return "INVALID_SORT_ORDER";
        return null;
    }

    private void normalizeTimePlan(projectTimePlanDTO plan) {
        plan.setTitle(plan.getTitle().trim());
        plan.setDescription(normalizeNullableText(plan.getDescription()));
        plan.setStartDate(plan.getStartDate().trim());
        plan.setEndDate(plan.getEndDate().trim());
        plan.setAllDayYn(normalizeYn(plan.getAllDayYn(), false));
        if ("Y".equals(plan.getAllDayYn())) {
            plan.setStartTime(null);
            plan.setEndTime(null);
        } else {
            plan.setStartTime(LocalTime.parse(plan.getStartTime().trim()).toString());
            plan.setEndTime(LocalTime.parse(plan.getEndTime().trim()).toString());
        }
        plan.setColor(plan.getColor() == null || plan.getColor().isBlank() ? "#7A5CFF" : plan.getColor().trim().toUpperCase());
    }

    private ResponseEntity<Map<String, Object>> timePlanValidationError(String code) {
        String message = switch (code) {
            case "TITLE_REQUIRED" -> "시간별 계획 제목을 입력해주세요.";
            case "TITLE_TOO_LONG" -> "제목은 120자 이내로 입력해주세요.";
            case "DESCRIPTION_TOO_LONG" -> "설명은 1000자 이내로 입력해주세요.";
            case "INVALID_DATE_FORMAT" -> "날짜는 YYYY-MM-DD 형식으로 입력해주세요.";
            case "INVALID_DATE_RANGE" -> "종료일은 시작일보다 빠를 수 없습니다.";
            case "OUTSIDE_PROJECT_RANGE" -> "프로젝트 기간 안에서 날짜를 선택해주세요.";
            case "INVALID_PROJECT_RANGE" -> "프로젝트 기간 정보가 올바르지 않습니다.";
            case "INVALID_ALL_DAY" -> "종일 여부가 올바르지 않습니다.";
            case "TIME_REQUIRED" -> "시작 시간과 종료 시간을 입력해주세요.";
            case "INVALID_TIME_FORMAT" -> "시간은 HH:mm 형식으로 입력해주세요.";
            case "INVALID_TIME_RANGE" -> "종료 일시는 시작 일시보다 늦어야 합니다.";
            case "INVALID_COLOR" -> "색상 형식이 올바르지 않습니다.";
            case "INVALID_SORT_ORDER" -> "정렬 순서가 올바르지 않습니다.";
            default -> "시간별 계획 입력값이 올바르지 않습니다.";
        };
        return phaseError(HttpStatus.BAD_REQUEST, code, message, null);
    }

    private String validateWeeklyPlanInput(projectRequestDTO project, projectWeeklyPlanDTO plan) {
        if (project == null) return "PROJECT_NOT_FOUND";
        if (plan == null) return "INVALID_REQUEST";
        if (plan.getTitle() == null || plan.getTitle().trim().isEmpty()) return "TITLE_REQUIRED";
        if (plan.getTitle().trim().length() > 120) return "TITLE_TOO_LONG";
        if (plan.getDescription() != null && plan.getDescription().trim().length() > 1000) return "DESCRIPTION_TOO_LONG";
        if (plan.getDayOfWeek() == null || plan.getDayOfWeek() < 1 || plan.getDayOfWeek() > 7) return "INVALID_DAY_OF_WEEK";
        if (plan.getStartTime() == null || plan.getStartTime().isBlank()
                || plan.getEndTime() == null || plan.getEndTime().isBlank()) return "TIME_REQUIRED";
        try {
            LocalTime start = LocalTime.parse(plan.getStartTime().trim());
            LocalTime end = LocalTime.parse(plan.getEndTime().trim());
            // 종료 시간이 시작 시간보다 이르면 다음 날 종료로 처리한다.
            // 같은 시간은 24시간 계획과 구분할 수 없으므로 허용하지 않는다.
            if (end.equals(start)) return "INVALID_TIME_RANGE";
        } catch (DateTimeParseException e) { return "INVALID_TIME_FORMAT"; }
        String startDate = plan.getRepeatStartDate();
        String endDate = plan.getRepeatEndDate();
        if (startDate != null && !startDate.isBlank() && !isValidIsoDate(startDate)) return "INVALID_REPEAT_START_DATE";
        if (endDate != null && !endDate.isBlank() && !isValidIsoDate(endDate)) return "INVALID_REPEAT_END_DATE";
        try {
            LocalDate projectStart = LocalDate.parse(project.getStartDate());
            LocalDate projectEnd = LocalDate.parse(project.getEndDate());
            LocalDate repeatStart = startDate == null || startDate.isBlank() ? projectStart : LocalDate.parse(startDate);
            LocalDate repeatEnd = endDate == null || endDate.isBlank() ? projectEnd : LocalDate.parse(endDate);
            if (repeatEnd.isBefore(repeatStart)) return "INVALID_REPEAT_RANGE";
            if (repeatStart.isBefore(projectStart) || repeatEnd.isAfter(projectEnd)) return "OUTSIDE_PROJECT_RANGE";
        } catch (Exception e) { return "INVALID_PROJECT_RANGE"; }
        if (normalizeYn(plan.getActiveYn(), false) == null) return "INVALID_ACTIVE_YN";
        String color = plan.getColor() == null || plan.getColor().isBlank() ? "#7A5CFF" : plan.getColor().trim().toUpperCase();
        if (!color.matches("^#[0-9A-F]{6}$")) return "INVALID_COLOR";
        if (plan.getSortOrder() != null && plan.getSortOrder() < 1) return "INVALID_SORT_ORDER";
        return null;
    }

    private void normalizeWeeklyPlan(projectWeeklyPlanDTO plan, projectRequestDTO project) {
        plan.setTitle(plan.getTitle().trim());
        plan.setDescription(normalizeNullableText(plan.getDescription()));
        plan.setStartTime(LocalTime.parse(plan.getStartTime().trim()).toString());
        plan.setEndTime(LocalTime.parse(plan.getEndTime().trim()).toString());
        plan.setColor(plan.getColor() == null || plan.getColor().isBlank() ? "#7A5CFF" : plan.getColor().trim().toUpperCase());
        plan.setActiveYn(normalizeYn(plan.getActiveYn(), false));
        plan.setRepeatStartDate(plan.getRepeatStartDate() == null || plan.getRepeatStartDate().isBlank()
                ? project.getStartDate() : plan.getRepeatStartDate().trim());
        plan.setRepeatEndDate(plan.getRepeatEndDate() == null || plan.getRepeatEndDate().isBlank()
                ? project.getEndDate() : plan.getRepeatEndDate().trim());
    }

    private ResponseEntity<Map<String, Object>> weeklyPlanValidationError(String code) {
        String message = switch (code) {
            case "TITLE_REQUIRED" -> "주간 계획 제목을 입력해주세요.";
            case "TITLE_TOO_LONG" -> "제목은 120자 이내로 입력해주세요.";
            case "DESCRIPTION_TOO_LONG" -> "설명은 1000자 이내로 입력해주세요.";
            case "INVALID_DAY_OF_WEEK" -> "요일 값은 1부터 7까지 입력해야 합니다.";
            case "TIME_REQUIRED" -> "시작 시간과 종료 시간을 입력해주세요.";
            case "INVALID_TIME_FORMAT" -> "시간은 HH:mm 형식으로 입력해주세요.";
            case "INVALID_TIME_RANGE" -> "시작 시간과 종료 시간은 같을 수 없습니다.";
            case "INVALID_TIME_INTERVAL" -> "시간은 15분 단위로 입력해주세요.";
            case "INVALID_REPEAT_START_DATE", "INVALID_REPEAT_END_DATE" -> "반복 기간은 YYYY-MM-DD 형식으로 입력해주세요.";
            case "INVALID_REPEAT_RANGE" -> "반복 종료일은 시작일보다 빠를 수 없습니다.";
            case "OUTSIDE_PROJECT_RANGE" -> "반복 기간은 프로젝트 기간 안에서 설정해주세요.";
            case "INVALID_PROJECT_RANGE" -> "프로젝트 기간 정보가 올바르지 않습니다.";
            case "INVALID_ACTIVE_YN" -> "활성 여부가 올바르지 않습니다.";
            case "INVALID_COLOR" -> "색상 형식이 올바르지 않습니다.";
            case "INVALID_SORT_ORDER" -> "정렬 순서가 올바르지 않습니다.";
            default -> "주간 계획 입력값이 올바르지 않습니다.";
        };
        return phaseError(HttpStatus.BAD_REQUEST, code, message, null);
    }

    private String normalizeYn(String value, boolean nullable) {
        if (value == null || value.isBlank()) return nullable ? null : "Y";
        String normalized = value.trim().toUpperCase();
        return "Y".equals(normalized) || "N".equals(normalized) ? normalized : null;
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String normalizeNullableText(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private ResponseEntity<Map<String, Object>> phaseValidationError(String code) {
        String message = switch (code) {
            case "TITLE_REQUIRED" -> "단계명을 입력해주세요.";
            case "TITLE_TOO_LONG" -> "단계명은 120자 이내로 입력해주세요.";
            case "DESCRIPTION_TOO_LONG" -> "설명은 1000자 이내로 입력해주세요.";
            case "DATE_REQUIRED" -> "시작일과 종료일을 입력해주세요.";
            case "INVALID_DATE_FORMAT" -> "날짜 형식이 올바르지 않습니다.";
            case "INVALID_DATE_RANGE" -> "종료일은 시작일보다 빠를 수 없습니다.";
            case "OUTSIDE_PROJECT_RANGE" -> "단계 기간은 프로젝트 기간 안에 있어야 합니다.";
            case "INVALID_PROJECT_RANGE" -> "프로젝트 기간 정보가 올바르지 않습니다.";
            case "INVALID_STATUS" -> "단계 상태값이 올바르지 않습니다.";
            case "INVALID_COLOR" -> "색상은 #RRGGBB 형식이어야 합니다.";
            case "INVALID_PROGRESS" -> "진행률은 0부터 100 사이여야 합니다.";
            case "INVALID_SORT_ORDER" -> "정렬 순서가 올바르지 않습니다.";
            default -> "단계 입력값을 확인해주세요.";
        };
        String field = switch (code) {
            case "TITLE_REQUIRED", "TITLE_TOO_LONG" -> "title";
            case "DESCRIPTION_TOO_LONG" -> "description";
            case "DATE_REQUIRED", "INVALID_DATE_FORMAT", "INVALID_DATE_RANGE", "OUTSIDE_PROJECT_RANGE" -> "startDate";
            case "INVALID_STATUS" -> "status";
            case "INVALID_COLOR" -> "color";
            case "INVALID_PROGRESS" -> "progress";
            case "INVALID_SORT_ORDER" -> "sortOrder";
            default -> null;
        };
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return phaseError(status, code, message, field);
    }

    private ResponseEntity<Map<String, Object>> phaseSuccess(HttpStatus status, String code, String message, Object data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("code", code);
        body.put("message", message);
        body.put("data", data);
        return ResponseEntity.status(status).body(body);
    }

    private ResponseEntity<Map<String, Object>> phaseError(HttpStatus status, String code, String message, String field) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("code", code);
        body.put("message", message);
        if (field != null) body.put("field", field);
        return ResponseEntity.status(status).body(body);
    }

    private ResponseEntity<Map<String, Object>> phaseErrorWithData(
            HttpStatus status, String code, String message, Map<String, Object> data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("code", code);
        body.put("message", message);
        body.put("data", data);
        return ResponseEntity.status(status).body(body);
    }


    private boolean isTaskAssignee(Map<String, Object> task, Long userId) {
        if (task == null || userId == null) {
            return false;
        }

        Object assigneeValue = getMapValueIgnoreCase(task, "assignees");
        if (assigneeValue instanceof List<?>) {
            List<?> assignees = (List<?>) assigneeValue;
            for (Object assigneeValueItem : assignees) {
                if (!(assigneeValueItem instanceof Map<?, ?>)) {
                    continue;
                }
                Map<?, ?> assignee = (Map<?, ?>) assigneeValueItem;
                Object assigneeUserId = null;
                for (Map.Entry<?, ?> entry : assignee.entrySet()) {
                    if (entry.getKey() != null && "userId".equalsIgnoreCase(String.valueOf(entry.getKey()))) {
                        assigneeUserId = entry.getValue();
                        break;
                    }
                }
                if (userId.equals(toLong(assigneeUserId))) {
                    return true;
                }
            }
            if (!assignees.isEmpty()) {
                return false;
            }
        }

        // 연결 테이블 이전 데이터에 대한 호환 처리입니다.
        Long legacyAssigneeId = toLong(getMapValueIgnoreCase(task, "USER_ID"));
        return userId.equals(legacyAssigneeId);
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


private Integer toInteger(Object value, Integer defaultValue) {
    if (value == null) return defaultValue;
    try {
        if (value instanceof Number) return ((Number) value).intValue();
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? defaultValue : Integer.valueOf(text);
    } catch (Exception e) {
        return defaultValue;
    }
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


    private LocalDate safeDate(String value, LocalDate fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (java.time.format.DateTimeParseException e) {
            return fallback;
        }
    }

    private void addProjectFormCatalog(Model model) {
        Map<String, Map<String, Object>> typeGroupMap = new LinkedHashMap<>();
        for (ProjectTypeCatalog.TypeDefinition type : ProjectTypeCatalog.types()) {
            Map<String, Object> group = typeGroupMap.computeIfAbsent(type.groupCode(), key -> {
                Map<String, Object> value = new LinkedHashMap<>();
                value.put("code", type.groupCode());
                value.put("label", type.groupLabel());
                value.put("types", new ArrayList<Map<String, Object>>());
                return value;
            });
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> types = (List<Map<String, Object>>) group.get("types");
            Map<String, Object> option = new LinkedHashMap<>();
            option.put("code", type.code());
            option.put("label", type.label());
            option.put("description", type.description());
            option.put("defaultIcon", type.defaultIcon());
            option.put("recommendedIcons", String.join(",", type.recommendedIcons()));
            types.add(option);
        }

        List<Map<String, Object>> projectIconOptions = new ArrayList<>();
        for (ProjectTypeCatalog.IconDefinition icon : ProjectTypeCatalog.icons()) {
            Map<String, Object> option = new LinkedHashMap<>();
            option.put("key", icon.key());
            option.put("label", icon.label());
            projectIconOptions.add(option);
        }

        model.addAttribute("projectTypeGroups", new ArrayList<>(typeGroupMap.values()));
        model.addAttribute("projectIconOptions", projectIconOptions);
    }


}
