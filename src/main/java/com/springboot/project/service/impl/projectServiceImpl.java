package com.springboot.project.service.impl;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.service.IprojectService;

@Service
public class projectServiceImpl implements IprojectService {

    @Autowired
    private IprojectDAO projectDao;

    // 1. [기존 유지 및 보강] 프로젝트 생성 및 본인 등록
    @Override
    @Transactional
    public void insertProject(projectRequestDTO dto, Long userId) {
        // 프로젝트 테이블에 INSERT
        projectDao.insertProject(dto);

        // 프로젝트 멤버 테이블에 생성자(나) 등록
        // XML에서 파라미터 이름을 #{projId}, #{userId}, #{role}로 맞췄으므로 명확하게 전달
        projectDao.insertProjectMember(dto.getProjId(), userId, "OWNER");
    }

    // 2. [추가] 프로젝트에 할당 가능한(아직 미참여) 워크스페이스 멤버 조회
    @Override
    public List<Map<String, Object>> getAssignableMembers(Long wsId, Long projId) {
        return projectDao.getAssignableMembers(wsId, projId);
    }

    // 3. [추가] 여러 명을 한 번에 프로젝트 멤버로 추가
    @Override
    @Transactional
    public boolean addProjectMembers(Long projId, List<Long> userIds) {
        int insertCount = 0;
        
        for (Long userId : userIds) {
            // 1. 중복 체크
            int exists = projectDao.checkMemberExists(projId, userId);
            
            // 2. 없을 때만 추가
            if (exists == 0) {
                projectDao.insertProjectMember(projId, userId, "MEMBER");
                insertCount++;
            }
        }
        
        // 한 명이라도 새로 추가되었다면 true, 모두 중복이거나 추가된 게 없으면 false
        return insertCount > 0;
    }

    // 4. [추가] 현재 이 프로젝트에 참여 중인 멤버 조회
    @Override
    public List<Map<String, Object>> getProjectMembers(Long projId) {
        return projectDao.getProjectMembers(projId);
    }

    // 5. [기존 유지] 워크스페이스별 프로젝트 목록
    @Override
    public List<projectRequestDTO> getProjectsByWsId(Long wsId) {
        return projectDao.selectProjectsByWsId(wsId);
    }
}