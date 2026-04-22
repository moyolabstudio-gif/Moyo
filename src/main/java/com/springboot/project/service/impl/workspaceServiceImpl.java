package com.springboot.project.service.impl;

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
}