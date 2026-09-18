package com.springboot.project.service;

import org.springframework.stereotype.Service;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.workspaceDTO;

@Service
public class WorkspaceAuthorizationService {

    private final IworkspaceDAO workspaceDAO;

    public WorkspaceAuthorizationService(IworkspaceDAO workspaceDAO) {
        this.workspaceDAO = workspaceDAO;
    }

    public workspaceDTO getWorkspace(Long wsId) {
        if (wsId == null) return null;
        return workspaceDAO.selectWorkspaceDetail(wsId);
    }

    public boolean isMember(Long wsId, Long userId) {
        return wsId != null && userId != null
                && workspaceDAO.isWorkspaceMember(wsId, userId) > 0;
    }

    public boolean isOwner(Long wsId, Long userId) {
        if (wsId == null || userId == null) return false;
        workspaceDTO workspace = workspaceDAO.selectWorkspaceDetail(wsId);
        return workspace != null
                && workspace.getOwnerId() != null
                && workspace.getOwnerId().equals(userId);
    }

    /** WS_MEMBERS.WS_ROLE 기준 관리자. OWNER 여부는 포함하지 않는다. */
    public boolean hasAdminRole(Long wsId, Long userId) {
        return wsId != null && userId != null
                && workspaceDAO.isWorkspaceAdmin(wsId, userId) > 0;
    }

    /** 그룹 운영 권한: WORKSPACES.OWNER_ID 또는 WS_ROLE=ADMIN. */
    public boolean canManage(Long wsId, Long userId) {
        return isOwner(wsId, userId) || hasAdminRole(wsId, userId);
    }
}
