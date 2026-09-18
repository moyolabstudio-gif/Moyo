package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.dao.IworkspaceDAO;

@Service
public class projectAuthorizationServiceImpl implements IprojectAuthorizationService {

    private final IprojectService projectService;
    private final IworkspaceService workspaceService;
    private final IworkspaceDAO workspaceDAO;

    public projectAuthorizationServiceImpl(IprojectService projectService,
                                           IworkspaceService workspaceService,
                                           IworkspaceDAO workspaceDAO) {
        this.projectService = projectService;
        this.workspaceService = workspaceService;
        this.workspaceDAO = workspaceDAO;
    }

    @Override
    public projectRequestDTO getAccessibleProject(Long projId, Long requestedWsId, Long userId) {
        if (projId == null || userId == null) return null;

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) return null;

        String scope = project.getProjScope() == null
                ? "GROUP"
                : project.getProjScope().trim().toUpperCase();

        if ("PERSONAL".equals(scope)) {
            if (project.getWsId() != null) return null;
            // 개인 프로젝트는 소유자 1인 프로젝트다.
            // 잔존 PROJ_MEMBERS 데이터가 있어도 다른 사용자가 접근하지 못하도록
            // 프로젝트 소유자(leader)만 허용한다.
            return project.getLeaderId() != null && project.getLeaderId().equals(userId)
                    ? project
                    : null;
        }

        if (!"GROUP".equals(scope) || project.getWsId() == null) return null;
        if (requestedWsId != null && !project.getWsId().equals(requestedWsId)) return null;

        return isWorkspaceMember(project.getWsId(), userId) ? project : null;
    }

    @Override
    public boolean canAccessProject(Long projId, Long requestedWsId, Long userId) {
        return getAccessibleProject(projId, requestedWsId, userId) != null;
    }

    @Override
    public boolean isWorkspaceMember(Long wsId, Long userId) {
        if (wsId == null || userId == null) return false;
        List<workspaceDTO> workspaces = workspaceService.getWorkspaceList(userId);
        if (workspaces == null) return false;
        return workspaces.stream().anyMatch(workspace ->
                workspace != null && wsId.equals(workspace.getWsId()));
    }

    @Override
    public boolean isProjectMemberOrLeader(projectRequestDTO project, Long userId) {
        if (project == null || userId == null) return false;
        if (project.getLeaderId() != null && project.getLeaderId().equals(userId)) return true;

        List<Map<String, Object>> members = projectService.getProjectMembers(project.getProjId());
        if (members == null) return false;
        return members.stream().anyMatch(member ->
                userId.equals(toLong(getMapValueIgnoreCase(member, "USER_ID"))));
    }

    @Override
    public boolean isProjectLeader(Long projId, Long userId) {
        if (projId == null || userId == null) return false;
        projectRequestDTO project = getAccessibleProject(projId, null, userId);
        return project != null
                && project.getLeaderId() != null
                && project.getLeaderId().equals(userId);
    }

    @Override
    public boolean canManageProject(Long projId, Long userId) {
        if (projId == null || userId == null) return false;

        // 프로젝트 자체에 접근할 수 없는 사용자는 PROJ_MEMBERS에 과거 권한이
        // 남아 있어도 관리 권한을 사용할 수 없다.
        projectRequestDTO project = getAccessibleProject(projId, null, userId);
        if (project == null) return false;
        if (userId.equals(project.getLeaderId())) return true;

        List<Map<String, Object>> members = projectService.getProjectMembers(projId);
        if (members == null) return false;

        for (Map<String, Object> member : members) {
            Long memberUserId = toLong(getMapValueIgnoreCase(member, "USER_ID"));
            Object roleValue = getMapValueIgnoreCase(member, "PROJ_ROLE");
            String role = roleValue == null ? "" : String.valueOf(roleValue).trim();
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

    @Override
    public boolean isProjectAdmin(Long projId, Long userId) {
        return canManageProject(projId, userId);
    }

    @Override
    public boolean canCreateGroupProject(Long wsId, Long userId) {
        if (wsId == null || userId == null || !isWorkspaceMember(wsId, userId)) return false;

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace != null && userId.equals(workspace.getOwnerId())) return true;

        return workspaceDAO.isWorkspaceAdmin(wsId, userId) > 0;
    }

    @Override
    public boolean canAssignUserToProject(Long projId, Long targetUserId) {
        if (projId == null || targetUserId == null) return false;
        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null || !"GROUP".equalsIgnoreCase(project.getProjScope()) || project.getWsId() == null) {
            return false;
        }
        return isWorkspaceMember(project.getWsId(), targetUserId);
    }

    @Override
    public boolean isDeletePending(projectRequestDTO project) {
        if (project == null) return false;
        if (project.getDeleteRequestedAt() != null) return true;
        return "DELETE_PENDING".equalsIgnoreCase(project.getStatus());
    }

    @Override
    public boolean canManageAssignedItem(Long projId, Long assignedUserId, Long userId) {
        if (userId == null) return false;
        return isProjectAdmin(projId, userId)
                || (assignedUserId != null && assignedUserId.equals(userId));
    }

    private Object getMapValueIgnoreCase(Map<String, Object> map, String key) {
        if (map == null || key == null) return null;
        if (map.containsKey(key)) return map.get(key);
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (entry.getKey() != null && key.equalsIgnoreCase(entry.getKey())) return entry.getValue();
        }
        return null;
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        try {
            String text = String.valueOf(value).trim();
            return text.isEmpty() ? null : Long.valueOf(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
