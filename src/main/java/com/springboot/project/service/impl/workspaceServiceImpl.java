package com.springboot.project.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.IworkspaceService;

@Service
public class workspaceServiceImpl implements IworkspaceService {

    @Autowired
    private IworkspaceDAO workspaceDao;
    
    @Autowired
    private IusersDao usersDao;
    
    @Override
    @Transactional
    public Long createWorkspace(workspaceDTO dto, Long userId, Map<String, Object> profile,
                                List<Map<String, Object>> links) {
        String inviteCode = java.util.UUID.randomUUID().toString().substring(0, 8);
        dto.setInviteCode(inviteCode);
        dto.setOwnerId(userId);

        workspaceDao.insertWorkspace(dto);
        workspaceDao.insertWorkspaceMember(dto.getWsId(), userId, "ADMIN");

        Map<String, Object> profileParams =
                buildWorkspaceProfileParams(dto.getWsId(), userId, profile);
        workspaceDao.insertWorkspaceMemberProfile(profileParams);
        replaceWorkspaceLinks(dto.getWsId(), links);

        return dto.getWsId();
    }

    public List<workspaceDTO> getWorkspaceList(Long userId) {
        return workspaceDao.selectWorkspaceList(userId);
    }
    @Override
    public workspaceDTO getWorkspaceDetail(Long wsId) {
        return workspaceDao.selectWorkspaceDetail(wsId);
    }

    @Override
    public List<Map<String, Object>> getWorkspaceLinks(Long wsId) {
        return workspaceDao.selectWorkspaceLinks(wsId);
    }

    @Override
    @Transactional
    public boolean updateWorkspace(workspaceDTO dto, List<Map<String, Object>> links) {
        int updated = workspaceDao.updateWorkspace(dto);
        if (updated < 1) return false;
        replaceWorkspaceLinks(dto.getWsId(), links);
        return true;
    }

    private void replaceWorkspaceLinks(Long wsId, List<Map<String, Object>> links) {
        workspaceDao.deleteWorkspaceLinks(wsId);
        if (links == null || links.isEmpty()) return;

        int order = 0;
        for (Map<String, Object> link : links) {
            String name = trimToNull(link.get("linkName"), 50);
            String url = normalizeExternalUrl(trimToNull(link.get("linkUrl"), 500));
            if (name == null || url == null) continue;

            Map<String, Object> params = new HashMap<>();
            params.put("wsId", wsId);
            params.put("linkName", name);
            params.put("linkUrl", url);
            params.put("sortOrder", order++);
            workspaceDao.insertWorkspaceLink(params);
        }
    }

    private String normalizeExternalUrl(String url) {
        if (url == null) return null;
        String value = url.trim();
        if (value.isEmpty()) return null;
        if (!value.matches("(?i)^https?://.*")) {
            value = "https://" + value;
        }
        if (!value.matches("(?i)^https?://[^\\s]+$")) {
            throw new IllegalArgumentException("올바른 외부 링크 주소가 아닙니다.");
        }
        return value;
    }
    
    @Override
    public List<Map<String, Object>> getWorkspaceMembers(Long wsId) {
        return workspaceDao.selectWorkspaceMembers(wsId);
    }

    @Override
    public Map<String, Object> getWorkspaceMemberProfile(Long wsId, Long targetUserId, Long viewerUserId) {
        if (workspaceDao.isWorkspaceMember(wsId, viewerUserId) < 1) {
            return null;
        }
        return workspaceDao.selectWorkspaceMemberProfile(wsId, targetUserId, viewerUserId);
    }

    @Override
    @Transactional
    public boolean saveMyWorkspaceProfile(Long wsId, Long userId, Map<String, Object> profile) {
        if (workspaceDao.isWorkspaceMember(wsId, userId) < 1) return false;

        String useAccount = String.valueOf(profile.getOrDefault("useAccountProfile", "Y"));
        String showPhone = String.valueOf(profile.getOrDefault("showPhone", "N"));
        if (!"Y".equals(useAccount) && !"N".equals(useAccount)) useAccount = "Y";
        if (!"Y".equals(showPhone) && !"N".equals(showPhone)) showPhone = "N";

        Map<String, Object> params = new HashMap<>();
        params.put("wsId", wsId);
        params.put("userId", userId);
        params.put("useAccountProfile", useAccount);
        params.put("displayName", trimToNull(profile.get("displayName"), 50));
        params.put("profileImagePath", trimToNull(profile.get("profileImagePath"), 500));
        params.put("contactEmail", trimToNull(profile.get("contactEmail"), 100));
        params.put("positionName", trimToNull(profile.get("positionName"), 50));
        params.put("phoneNumber", trimToNull(profile.get("phoneNumber"), 30));
        params.put("showPhone", showPhone);
        int updated = workspaceDao.updateWorkspaceMemberProfile(params);
        if (updated > 0) return true;

        try {
            return workspaceDao.insertWorkspaceMemberProfile(params) > 0;
        } catch (org.springframework.dao.DuplicateKeyException duplicate) {
            // 동시 요청으로 다른 트랜잭션이 먼저 생성한 경우 한 번 더 UPDATE
            return workspaceDao.updateWorkspaceMemberProfile(params) > 0;
        }
    }

    private Map<String, Object> buildWorkspaceProfileParams(
            Long wsId,
            Long userId,
            Map<String, Object> profile) {

        Map<String, Object> source =
                profile != null ? profile : java.util.Collections.emptyMap();

        String useAccount =
                String.valueOf(source.getOrDefault("useAccountProfile", "Y"));
        String showPhone =
                String.valueOf(source.getOrDefault("showPhone", "N"));

        if (!"Y".equals(useAccount) && !"N".equals(useAccount)) {
            useAccount = "Y";
        }
        if (!"Y".equals(showPhone) && !"N".equals(showPhone)) {
            showPhone = "N";
        }

        String displayName = trimToNull(source.get("displayName"), 50);
        if ("N".equals(useAccount) && displayName == null) {
            throw new IllegalArgumentException("워크스페이스 표시 이름이 필요합니다.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("wsId", wsId);
        params.put("userId", userId);
        params.put("useAccountProfile", useAccount);
        params.put("displayName", displayName);
        params.put("profileImagePath", trimToNull(source.get("profileImagePath"), 500));
        params.put("contactEmail", trimToNull(source.get("contactEmail"), 100));
        params.put("positionName", trimToNull(source.get("positionName"), 50));
        params.put("phoneNumber", trimToNull(source.get("phoneNumber"), 30));
        params.put("showPhone", showPhone);
        return params;
    }

    private String trimToNull(Object value, int maxLength) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) return null;
        return text.length() > maxLength ? text.substring(0, maxLength) : text;
    }
    

    
    @Override
    @Transactional
    public String inviteUserByEmail(Long wsId, Long inviterId, String inviteeEmail) {
        if (wsId == null || inviterId == null || inviteeEmail == null) {
            return "INVALID_REQUEST";
        }

        String normalizedEmail = inviteeEmail.trim().toLowerCase();
        if (normalizedEmail.isEmpty()) {
            return "INVALID_REQUEST";
        }

        usersDto invitee = usersDao.findByEmail(normalizedEmail);
        if (invitee == null) {
            return "NOT_FOUND";
        }

        if (inviterId.equals(invitee.getUserId())) {
            return "SELF_INVITE";
        }

        if (workspaceDao.isWorkspaceMember(wsId, invitee.getUserId()) > 0) {
            return "ALREADY_MEMBER";
        }

        int exists = workspaceDao.checkInvitationExists(wsId, invitee.getUserId());
        if (exists > 0) {
            return "ALREADY_EXISTS";
        }

        int inserted = workspaceDao.insertInvitation(
                wsId, inviterId, invitee.getUserId());

        return inserted > 0 ? "SUCCESS" : "ERROR";
    }
    
    @Override
    public List<Map<String, Object>> getPendingInvitations(Long userId) {
        return workspaceDao.selectPendingInvitations(userId);
    }
    
    @Override
    @Transactional
    public boolean processInvitation(Long inviteId,
                                     String status,
                                     Long userId,
                                     Map<String, Object> profile) {
        Map<String, Object> inviteInfo = workspaceDao.selectInvitationById(inviteId);
        if (inviteInfo == null) return false;

        Object inviteeValue = inviteInfo.get("INVITEE_ID");
        if (inviteeValue == null || !userId.equals(Long.valueOf(inviteeValue.toString()))) {
            return false;
        }

        if (!"ACCEPTED".equals(status) && !"REJECTED".equals(status)) {
            return false;
        }

        int updated = workspaceDao.updateInvitationStatus(inviteId, status);
        if (updated < 1) return false;

        if ("ACCEPTED".equals(status)) {
            Long wsId = Long.valueOf(inviteInfo.get("WS_ID").toString());
            if (workspaceDao.isWorkspaceMember(wsId, userId) < 1) {
                workspaceDao.insertWorkspaceMember(wsId, userId, "MEMBER");
            }

            Map<String, Object> profileParams =
                    buildWorkspaceProfileParams(wsId, userId, profile);
            int profileUpdated = workspaceDao.updateWorkspaceMemberProfile(profileParams);
            if (profileUpdated < 1) {
                try {
                    workspaceDao.insertWorkspaceMemberProfile(profileParams);
                } catch (org.springframework.dao.DuplicateKeyException duplicate) {
                    workspaceDao.updateWorkspaceMemberProfile(profileParams);
                }
            }
        }

        return true;
    }

    @Override
    @Transactional // 중요: 하나라도 실패하면 전체 롤백
    public boolean removeMember(Long wsId, Long userId) {
        // 해당 워크스페이스에서 특정 멤버 삭제
        return workspaceDao.deleteWorkspaceMember(wsId, userId) > 0;
    }

    @Override
    @Transactional
    public boolean transferAdmin(Long wsId, Long currentAdminId, Long newAdminId) {
        try {
            // 1. 기존 그룹장은 관리자 권한을 유지
            workspaceDao.updateMemberRole(wsId, currentAdminId, "ADMIN");
            
            // 2. 새로운 그룹장의 역할을 'ADMIN'으로 변경
            workspaceDao.updateMemberRole(wsId, newAdminId, "ADMIN");
            
            // 3. WORKSPACES 테이블의 OWNER_ID도 새로운 그룹장로 변경
            workspaceDao.updateWorkspaceOwner(wsId, newAdminId);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false; 
        }
    }

    @Override
    public Map<String, Object> getCommunitySummary(Long wsId) {
        Map<String, Object> summary = workspaceDao.selectCommunitySummary(wsId);
        return summary != null ? summary : new java.util.HashMap<>();
    }

    @Override
    public List<Map<String, Object>> getRecentCommunityActivities(Long wsId) {
        List<Map<String, Object>> activities = workspaceDao.selectRecentCommunityActivities(wsId);
        return activities != null ? activities : new java.util.ArrayList<>();
    }

    @Override
    public List<Map<String, Object>> getEventsByWsId(Long wsId) {
        // 예시: workspaceDao에 해당 기능을 구현하거나 
        // 이미 존재하는 calendarDao를 활용하여 워크스페이스 ID로 이벤트를 조회합니다.
        return workspaceDao.selectEventsByWsId(wsId);
    }
 // 1. 오늘의 일정 가져오기
    @Override
    public List<Map<String, Object>> getTodayEvents(Long wsId) {
        // DAO에서 날짜가 오늘인 일정만 가져오는 쿼리 실행
        return workspaceDao.selectTodayEvents(wsId);
    }

    // 2. 진행 중인 투표 가져오기
    @Override
    public Map<String, Object> getActivePoll(Long wsId) {
        Map<String, Object> poll = workspaceDao.selectActivePoll(wsId);
        
        // 데이터가 없으면 빈 맵을 반환 (JSON 응답이 {}가 됨)
        if (poll == null) {
            return new java.util.HashMap<>(); 
        }
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("pollId", ((Number) poll.get("POLL_ID")).longValue());
        result.put("question", poll.get("QUESTION"));
        
        // 옵션 조회
        List<Map<String, Object>> options = workspaceDao.selectPollOptions((Long)result.get("pollId"));
        // 옵션이 없을 경우를 대비해 빈 리스트라도 넣어줌
        result.put("options", options != null ? options : new java.util.ArrayList<>());
        
        return result;
    }
    // 3. 투표 반영하기
    @Override
    @Transactional
    public void processVote(Map<String, Object> params) {
        // 투표 이력을 저장하기만 하면 됩니다.
        // 데이터가 insert 될 때마다 위의 selectPollOptions 쿼리가 자동으로 최신 투표수를 계산합니다.
        workspaceDao.insertVote(params);
    }
    @Override
    @Transactional
    public void createPoll(Map<String, Object> params) {
        workspaceDao.insertPoll(params); // 이제 정상적으로 IworkspaceDAO를 탐색함
        Long pollId = ((Number) params.get("pollId")).longValue();
        
        List<String> options = (List<String>) params.get("options");
        for (String text : options) {
            Map<String, Object> option = new HashMap<>();
            option.put("pollId", pollId);
            option.put("text", text);
            option.put("count", 0);
            workspaceDao.insertPollOption(option);
        }
    }
}