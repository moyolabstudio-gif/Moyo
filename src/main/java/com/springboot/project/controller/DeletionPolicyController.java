package com.springboot.project.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.CollaborationActivityService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IworkspaceService;
import com.springboot.project.service.ProjectFinalDeletionService;
import com.springboot.project.service.WorkspaceAuthorizationService;
import com.springboot.project.service.WorkspaceFinalDeletionService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping
public class DeletionPolicyController {

    private final IprojectService projectService;
    private final IprojectAuthorizationService projectAuthorizationService;
    private final ProjectFinalDeletionService projectFinalDeletionService;
    private final IworkspaceService workspaceService;
    private final IworkspaceDAO workspaceDAO;
    private final WorkspaceAuthorizationService workspaceAuthorizationService;
    private final WorkspaceFinalDeletionService workspaceFinalDeletionService;
    private final CollaborationActivityService collaborationActivityService;

    public DeletionPolicyController(
            IprojectService projectService,
            IprojectAuthorizationService projectAuthorizationService,
            ProjectFinalDeletionService projectFinalDeletionService,
            IworkspaceService workspaceService,
            IworkspaceDAO workspaceDAO,
            WorkspaceAuthorizationService workspaceAuthorizationService,
            WorkspaceFinalDeletionService workspaceFinalDeletionService,
            CollaborationActivityService collaborationActivityService) {
        this.projectService = projectService;
        this.projectAuthorizationService = projectAuthorizationService;
        this.projectFinalDeletionService = projectFinalDeletionService;
        this.workspaceService = workspaceService;
        this.workspaceDAO = workspaceDAO;
        this.workspaceAuthorizationService = workspaceAuthorizationService;
        this.workspaceFinalDeletionService = workspaceFinalDeletionService;
        this.collaborationActivityService = collaborationActivityService;
    }

    /**
     * GROUP 프로젝트:
     * - 팀장 외 활성 참여자가 없으면 즉시 삭제
     * - 다른 참여자가 있으면 기존 30일 삭제 예정
     * PERSONAL 프로젝트는 기존 삭제 예정 정책을 유지한다.
     */
    @PostMapping("/project/api/delete-policy")
    public String deleteProjectByPolicy(
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = currentUser(session);
        if (loginUser == null) return "LOGIN_FAIL";

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) return "NOT_FOUND";
        if (!projectAuthorizationService.isProjectLeader(projId, loginUser.getUserId())) {
            return "LEADER_ONLY";
        }
        if ("DELETE_PENDING".equalsIgnoreCase(project.getStatus())) {
            return "ALREADY_PENDING";
        }

        boolean groupProject = "GROUP".equalsIgnoreCase(project.getProjScope())
                || project.getWsId() != null;

        if (groupProject && isLeaderOnlyProject(project)) {
            String title = project.getProjName();
            Long wsId = project.getWsId();
            projectFinalDeletionService.deleteProjectImmediately(projId);
            collaborationActivityService.record(
                    "PROJECT", wsId, projId, loginUser.getUserId(),
                    "PROJECT_DELETE_IMMEDIATE", "PROJECT", String.valueOf(projId),
                    title, "참여자가 팀장 한 명뿐인 프로젝트를 즉시 삭제했어요.",
                    "/project/api/delete-policy");
            return "DELETED";
        }

        return projectService.requestProjectDeletion(projId, loginUser.getUserId())
                ? "PENDING"
                : "FAIL";
    }

    /**
     * 그룹:
     * - 그룹장 외 활성 멤버가 없으면 즉시 삭제
     * - 다른 멤버가 있으면 기존 30일 삭제 예정
     */
    @PostMapping("/workspace/api/delete-policy")
    public String deleteWorkspaceByPolicy(
            @RequestParam("wsId") Long wsId,
            @RequestParam("workspaceName") String workspaceName,
            HttpSession session) {

        usersDto loginUser = currentUser(session);
        if (loginUser == null) return "login_required";

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return "not_found";
        if (!workspaceAuthorizationService.isOwner(wsId, loginUser.getUserId())) {
            return "owner_only";
        }
        if (workspaceName == null || !workspace.getWsName().equals(workspaceName.trim())) {
            return "name_mismatch";
        }
        if ("DELETE_PENDING".equalsIgnoreCase(workspace.getStatus())) {
            return "already_pending";
        }

        if (isOwnerOnlyWorkspace(workspace)) {
            String title = workspace.getWsName();
            workspaceFinalDeletionService.deleteWorkspaceImmediately(wsId);
            collaborationActivityService.record(
                    "WORKSPACE", wsId, null, loginUser.getUserId(),
                    "GROUP_DELETE_IMMEDIATE", "GROUP", String.valueOf(wsId),
                    title, "그룹장 한 명뿐인 그룹을 즉시 삭제했어요.",
                    "/workspace/api/delete-policy");
            return "deleted";
        }

        int result = workspaceDAO.requestWorkspaceDeletion(wsId, loginUser.getUserId());
        if (result > 0) {
            workspaceDAO.cascadeWorkspaceProjectDeletion(wsId, loginUser.getUserId());
            return "pending";
        }
        return "fail";
    }

    private boolean isLeaderOnlyProject(projectRequestDTO project) {
        if (project == null || project.getLeaderId() == null) return false;
        Set<Long> activeUsers = new HashSet<>();
        activeUsers.add(project.getLeaderId());
        addMemberIds(activeUsers, projectService.getProjectMembers(project.getProjId()));
        return activeUsers.size() == 1 && activeUsers.contains(project.getLeaderId());
    }

    private boolean isOwnerOnlyWorkspace(workspaceDTO workspace) {
        if (workspace == null || workspace.getOwnerId() == null) return false;
        Set<Long> activeUsers = new HashSet<>();
        activeUsers.add(workspace.getOwnerId());
        addMemberIds(activeUsers, workspaceService.getWorkspaceMembers(workspace.getWsId()));
        return activeUsers.size() == 1 && activeUsers.contains(workspace.getOwnerId());
    }

    private void addMemberIds(Set<Long> target, List<Map<String, Object>> rows) {
        if (target == null || rows == null) return;
        for (Map<String, Object> row : rows) {
            Long userId = toLong(value(row, "USER_ID", "userId"));
            if (userId != null) target.add(userId);
        }
    }

    private Object value(Map<String, Object> row, String... keys) {
        if (row == null || keys == null) return null;
        for (String key : keys) {
            if (row.containsKey(key)) return row.get(key);
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key)) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        try {
            return Long.valueOf(String.valueOf(value).trim());
        } catch (Exception e) {
            return null;
        }
    }

    private usersDto currentUser(HttpSession session) {
        Object value = session == null ? null : session.getAttribute("user");
        return value instanceof usersDto user ? user : null;
    }
}
