package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import com.springboot.project.dto.projectRequestDTO;

public interface IprojectService {
    // 프로젝트를 생성하고, 생성한 유저를 팀장으로 등록하는 표준 메서드
    void insertProject(projectRequestDTO dto, Long userId);
    List<projectRequestDTO> getProjectsByWsId(Long wsId);
 // 프로젝트에 할당 가능한 멤버 목록 가져오기
    List<Map<String, Object>> getAssignableMembers(Long wsId, Long projId);
    
    // 프로젝트 멤버 추가 (여러 명을 한꺼번에 추가할 수 있도록 List로 처리)
    boolean addProjectMembers(Long projId, List<Long> userIds);
    
    // 현재 프로젝트 멤버 목록 가져오기
    List<Map<String, Object>> getProjectMembers(Long projId);
}