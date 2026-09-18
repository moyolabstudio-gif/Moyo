package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.dto.workspaceUpdateRequest;
import com.springboot.project.dto.workspaceUpdateResult;

public interface IworkspaceService {
    Long createWorkspace(workspaceDTO dto, Long userId, Map<String, Object> profile,
                         List<Map<String, Object>> links);
    List<workspaceDTO> getWorkspaceList(Long userId);
    workspaceDTO getWorkspaceDetail(Long wsId);
    List<Map<String, Object>> getWorkspaceLinks(Long wsId);
    boolean updateWorkspace(workspaceDTO dto, List<Map<String, Object>> links);
    workspaceUpdateResult updateWorkspaceProfile(workspaceUpdateRequest request, Long userId);
    List<Map<String, Object>> getWorkspaceMembers(Long wsId);
    List<Map<String, Object>> getWorkspaceMemberLeaveActivities(Long wsId);
    Map<String, Object> getWorkspaceMemberProfile(Long wsId, Long targetUserId, Long viewerUserId);
    Map<String, Object> getSavedWorkspaceMemberProfile(Long wsId, Long userId);
    Map<String, Object> getWorkspaceMemberContributions(Long wsId, Long userId, Long viewerUserId);
    List<Map<String, Object>> getWorkspaceMemberRecentActivities(Long wsId, Long userId, Long viewerUserId);
    boolean saveMyWorkspaceProfile(Long wsId, Long userId, Map<String, Object> profile);
    boolean removeMember(Long wsId, Long userId); 
    String updateWorkspaceMembers(Long wsId, Long requesterId, List<Map<String, Object>> changes);
    String removeWorkspaceMembers(Long wsId, Long requesterId, List<Long> userIds);
    boolean transferAdmin(Long wsId, Long oldAdminId, Long newAdminId);
    String inviteUserByEmail(Long wsId, Long inviterId, String inviteeEmail);
    List<Map<String, Object>> getPendingInvitations(Long userId);
    List<Map<String, Object>> getPendingInvitationsByWorkspace(Long wsId);
    int countPendingInvitations(Long userId);
    boolean cancelInvitation(Long inviteId, Long wsId);
    boolean processInvitation(Long inviteId, String status, Long userId, Map<String, Object> profile);
    String joinOpenWorkspace(Long wsId, Long userId, Map<String, Object> profile);
    String requestJoinWorkspace(Long wsId, Long userId);
    String cancelJoinRequest(Long wsId, Long userId);
    String getJoinRequestStatus(Long wsId, Long userId);
    List<Map<String, Object>> getPendingJoinRequestsForAdmin(Long userId);
    int countPendingJoinRequestsForAdmin(Long userId);
    String respondJoinRequest(Long requestId, String status, Long reviewerId, String rejectionReason);
    String completeApprovedJoinRequest(Long requestId, Long userId, Map<String, Object> profile);
    String abandonApprovedJoinRequest(Long requestId, Long userId);
    List<Map<String, Object>> getEventsByWsId(Long wsId);
    Map<String, Object> getCommunitySummary(Long wsId);
    List<Map<String, Object>> getRecentCommunityActivities(Long wsId);
    List<Map<String, Object>> getTodayEvents(Long wsId);
    Map<String, Object> getActivePoll(Long wsId);
}