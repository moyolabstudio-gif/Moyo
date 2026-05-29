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
    public Long createWorkspace(workspaceDTO dto, Long userId) {
        // 1. 초대 코드 자동 생성 (예: UUID 앞 8자리)
        String inviteCode = java.util.UUID.randomUUID().toString().substring(0, 8);
        dto.setInviteCode(inviteCode);
        dto.setOwnerId(userId);

        // 2. 워크스페이스 생성
        workspaceDao.insertWorkspace(dto);
        
        // 3. [아까 목록 안 뜨던 문제 해결] 생성한 사람을 바로 멤버로 등록
        workspaceDao.insertWorkspaceMember(dto.getWsId(), userId, "ADMIN");

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
    public List<Map<String, Object>> getWorkspaceMembers(Long wsId) {
        return workspaceDao.selectWorkspaceMembers(wsId);
    }
    

    
    @Override
    @Transactional
    public String inviteUserByEmail(Long wsId, Long inviterId, String inviteeEmail) {
        usersDto invitee = usersDao.findByEmail(inviteeEmail); 
        
        // 1. 여기서 터졌을 겁니다. null 체크 추가!
        if (invitee == null) {
            return "NOT_FOUND"; 
        }

        // 2. 이제 안전하게 getUserId() 호출 가능
        int exists = workspaceDao.checkInvitationExists(wsId, invitee.getUserId());
        if (exists > 0) {
            return "ALREADY_EXISTS";
        }

        workspaceDao.insertInvitation(wsId, inviterId, invitee.getUserId());
        return "SUCCESS";
    }
    
    @Override
    public List<Map<String, Object>> getPendingInvitations(Long userId) {
        return workspaceDao.selectPendingInvitations(userId);
    }
    
    @Override
    @Transactional
    public boolean processInvitation(Long inviteId, String status, Long userId) {
        try {
            // 1. 초대장 상태 업데이트 (ACCEPTED 또는 REJECTED)
            // workspaceDao.updateInvitationStatus 메서드가 필요합니다.
            int res = workspaceDao.updateInvitationStatus(inviteId, status);
            
            if (res > 0 && "ACCEPTED".equals(status)) {
                // 2. 수락인 경우, 해당 워크스페이스 ID를 가져와서 멤버로 추가
                // 초대장 정보에서 wsId를 먼저 알아내야 합니다.
                Map<String, Object> inviteInfo = workspaceDao.selectInvitationById(inviteId);
                Long wsId = Long.parseLong(inviteInfo.get("WS_ID").toString());
                
                // 3. 워크스페이스 멤버로 정식 등록 (기존에 만든 insertWorkspaceMember 활용)
                workspaceDao.insertWorkspaceMember(wsId, userId, "MEMBER");
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
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
            // 1. 기존 관리자(나)의 역할을 'MEMBER'로 변경
            workspaceDao.updateMemberRole(wsId, currentAdminId, "MEMBER");
            
            // 2. 새로운 관리자의 역할을 'ADMIN'으로 변경
            workspaceDao.updateMemberRole(wsId, newAdminId, "ADMIN");
            
            // 3. WORKSPACES 테이블의 OWNER_ID도 새로운 관리자로 변경
            workspaceDao.updateWorkspaceOwner(wsId, newAdminId);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false; 
        }
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