package com.springboot.project.service.impl;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IcalendarResponseDAO;
import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.service.IprojectService;

@Service
public class projectServiceImpl implements IprojectService {

    @Autowired
    private IprojectDAO projectDao;

    @Autowired
    private IcalendarResponseDAO calendarDao; 

 // projectServiceImpl.java의 insertProject 메서드 수정
    @Override
    @Transactional
    public void insertProject(projectRequestDTO dto, Long userId) {
        // 1. 프로젝트 생성
        projectDao.insertProject(dto); 
        
        // 2. 프로젝트 멤버 추가
        projectDao.insertProjectMember(dto.getProjId(), dto.getLeaderId(), "ADMIN");
        if(dto.getMemberIds() != null) { 
            for(Long memberId : dto.getMemberIds()) {  
                if(!memberId.equals(dto.getLeaderId())) { 
                    projectDao.insertProjectMember(dto.getProjId(), memberId, "MEMBER"); 
                } 
            } 
        }

        // 3. 💡 핵심 수정: 캘린더 변환 로직 제거하고 직접 호출
        // 이렇게 하면 날짜 값이 dto에 있는 그대로 전달됩니다.
        projectDao.insertProjectEvent(dto);
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
    
    @Override
    public Map<String, Object> getProjectTaskSummary(Long projId) {
        Map<String, Object> summary = projectDao.getProjectTaskSummary(projId);
        
        // 데이터가 아예 없을 경우를 대비해 0으로 초기화된 기본 맵 반환
        if (summary == null) {
            summary = new HashMap<>();
            summary.put("TOTAL", 0);
            summary.put("TODO_CNT", 0);
            summary.put("IN_PROGRESS_CNT", 0);
            summary.put("DONE_CNT", 0);
        }
        return summary;
    }
    @Override
    public List<Map<String, Object>> getProjectTasks(Long projId) {
        // DAO에서 전체 리스트를 조회하여 반환
        return projectDao.getProjectTasks(projId);
    }
    @Override
    public boolean addTask(
    Long projId,
    Long wsId,
    Long userId,
    String title,
    String startDate,
    String endDate,
    String status) {

    Map<String, Object> paramMap = new HashMap<>();

    paramMap.put("projId", projId);
    paramMap.put("wsId", wsId);
    paramMap.put("userId", userId);

    paramMap.put("title", title);
    paramMap.put("startDate", startDate); // 추가
    paramMap.put("endDate", endDate);
    paramMap.put("status", status);

    return projectDao.insertTask(paramMap) > 0;


    }
    @Override
    public projectRequestDTO getProjectById(Long projId) {
        // DAO에 해당 쿼리가 없다면 selectProjectsByWsId 처럼 
        // projId로 단일 건을 조회하는 쿼리를 추가하거나 기존 것을 활용하세요.
        return projectDao.selectProjectById(projId); 
    }
    @Override
    public Map<String, Object> getTaskDetail(Long taskId) {
        return projectDao.getTaskDetail(taskId);
    }
 // projectServiceImpl.java
    @Override
    @Transactional
    public boolean updateTask(Long taskId, String title, String startDate, String endDate, String status) {
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("taskId", taskId);
        paramMap.put("title", title);
        paramMap.put("startDate", startDate); // 추가
        paramMap.put("endDate", endDate);
        paramMap.put("status", status);
        
        return projectDao.updateTask(paramMap) > 0;
    }
    @Override
    @Transactional
    public boolean deleteTask(Long taskId) {
        // DAO의 deleteTask를 호출하여 결과를 반환
        return projectDao.deleteTask(taskId) > 0;
    }
    @Override
    @Transactional
    public boolean updateProject(projectRequestDTO dto) {

        int result1 = projectDao.updateProject(dto);

        int result2 = 0;
        if (dto.getStartDate() != null && dto.getEndDate() != null) {
            result2 = projectDao.updateProjectEvent(dto);
        }

        return result1 > 0;
    }
    @Override
    public boolean deleteProject(Long projId, Long userId) {
        // 1. 프로젝트 정보 조회 (리더 ID 확인용)
        projectRequestDTO project = projectDao.selectProjectById(projId);
        
        // 2. 권한 확인: 로그인한 유저가 프로젝트 리더인지 확인
        if (project != null && project.getLeaderId().equals(userId)) {
            // 3. 삭제 수행
            return projectDao.deleteProject(projId) > 0;
        }
        return false; // 권한이 없거나 프로젝트가 없음
    }
    @Override
    public boolean updateTaskStatus(Long taskId, String status) {

        System.out.println("==== updateTaskStatus 호출 ====");
        System.out.println("taskId = " + taskId);
        System.out.println("status = " + status);

        int result =
            projectDao.updateTaskStatus(taskId, status);

        System.out.println("result = " + result);

        return result > 0;
    }
}