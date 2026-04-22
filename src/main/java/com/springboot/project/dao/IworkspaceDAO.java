package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param; // @Param을 위해 필수!

import com.springboot.project.dto.workspaceDTO;

@Mapper
public interface IworkspaceDAO {
    void insertWorkspace(workspaceDTO dto);
    List<workspaceDTO> selectWorkspaceList(Long userId);
    workspaceDTO selectWorkspaceDetail(Long wsId);

    // [추가] 이 녀석이 없어서 컨트롤러에서 빨간 줄이 떴을 겁니다.
    void insertWorkspaceMember(
        @Param("wsId") Long wsId, 
        @Param("userId") Long userId, 
        @Param("role") String role
    );
    List<Map<String, Object>> selectWorkspaceMembers(Long wsId);
 // IworkspaceDAO.java
    int deleteWorkspaceMember(@Param("wsId") Long wsId, @Param("userId") Long userId);
    int updateMemberRole(@Param("wsId") Long wsId, @Param("userId") Long userId, @Param("role") String role);
    int updateWorkspaceOwner(@Param("wsId") Long wsId, @Param("ownerId") Long ownerId);
    
 // 중복 초대 및 멤버 확인
    int checkInvitationExists(@Param("wsId") Long wsId, @Param("inviteeId") Long inviteeId);

    // 초대장 테이블에 데이터 삽입
    int insertInvitation(@Param("wsId") Long wsId, 
                         @Param("inviterId") Long inviterId, 
                         @Param("inviteeId") Long inviteeId);
                         
    // 내게 온 초대 목록 조회 (알림용)
    List<Map<String, Object>> selectPendingInvitations(@Param("userId") Long userId);
    
    int updateInvitationStatus(@Param("inviteId") Long inviteId, @Param("status") String status);
    Map<String, Object> selectInvitationById(Long inviteId);
    
    
    
}