package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import com.springboot.project.dto.workspaceDTO;

public interface IworkspaceService {
    Long createWorkspace(workspaceDTO dto, Long userId);
    List<workspaceDTO> getWorkspaceList(Long userId);
    workspaceDTO getWorkspaceDetail(Long wsId);
    List<Map<String, Object>> getWorkspaceMembers(Long wsId);
    boolean removeMember(Long wsId, Long userId); 
    boolean transferAdmin(Long wsId, Long oldAdminId, Long newAdminId);
    String inviteUserByEmail(Long wsId, Long inviterId, String inviteeEmail);
    List<Map<String, Object>> getPendingInvitations(Long userId);
    boolean processInvitation(Long inviteId, String status, Long userId);
    
}