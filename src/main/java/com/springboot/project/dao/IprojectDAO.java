package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.projectRequestDTO;

@Mapper
public interface IprojectDAO {

    // 1. 프로젝트 기본 CRUD (기존 유지)
    int insertProject(projectRequestDTO dto);
    List<projectRequestDTO> selectProjectsByWsId(Long wsId);

    // 2. 프로젝트 멤버 할당 (기존 Map 방식보다 파라미터를 명시하는 게 XML 작성 시 편합니다)
    int insertProjectMember(@Param("projId") Long projId, 
                            @Param("userId") Long userId, 
                            @Param("role") String role);

    // 3. [핵심 추가] 워크스페이스 멤버 중 이 프로젝트에 아직 참여하지 않은 사람 목록
    List<Map<String, Object>> getAssignableMembers(@Param("wsId") Long wsId, @Param("projId") Long projId);
    
    // 4. [추가 권장] 현재 프로젝트에 참여 중인 멤버 목록 조회
    List<Map<String, Object>> getProjectMembers(Long projId);
    int checkMemberExists(@Param("projId") Long projId, @Param("userId") Long userId);
}