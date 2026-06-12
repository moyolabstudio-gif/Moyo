package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import com.springboot.project.dto.projectRequestDTO;

public interface IprojectService {
    // 프로젝트를 생성하고, 생성한 유저를 팀장으로 등록하는 표준 메서드
    void insertProject(projectRequestDTO dto, Long userId);
    List<projectRequestDTO> getProjectsByWsId(Long wsId);
    List<Map<String, Object>> getProjectListByWorkspaceId(Long wsId);
 // 프로젝트에 할당 가능한 멤버 목록 가져오기
    List<Map<String, Object>> getAssignableMembers(Long wsId, Long projId);
    
    // 프로젝트 멤버 추가 (여러 명을 한꺼번에 추가할 수 있도록 List로 처리)
    boolean addProjectMembers(Long projId, List<Long> userIds);
    boolean removeProjectMember(Long projId, Long userId);
    
    // 현재 프로젝트 멤버 목록 가져오기
    List<Map<String, Object>> getProjectMembers(Long projId);
    Map<String, Object> getProjectMemberProfile(Long projId, Long targetUserId, Long viewerUserId);
    boolean updateProjectMemberPosition(Long projId, Long userId, String projPosition);
    boolean updateProjectMemberSetting(Long projId, Long userId, String projPosition, String projRole);
    Map<String, Object> getProjectTaskSummary(Long projId);
    List<Map<String, Object>> getProjectTasks(Long projId);
    boolean addTask(
            Long projId,
            Long wsId,
            Long userId,
            String title,
            String startDate,
            String endDate,
            String status,
            String startTime,
            String endTime,
            String startTimeSlot,
            String endTimeSlot
    );
    projectRequestDTO getProjectById(Long projId);
    List<Map<String, Object>> getProjectLinks(Long projId);
    Map<String, Object> getTaskDetail(Long taskId);
 // IprojectService.java
    boolean updateTask(Long taskId, String title, String startDate, String endDate, String status, Long userId, String startTime, String endTime, String startTimeSlot, String endTimeSlot);
    boolean deleteTask(Long taskId);
    boolean updateProject(projectRequestDTO dto);
    boolean deleteProject(Long projId, Long userId);
    boolean updateTaskStatus(Long taskId, String status);
    List<Map<String, Object>> getProjectSchedules(Long projId);
    boolean addProjectSchedule(
            Long projId,
            Long wsId,
            Long userId,
            String title,
            String startDate,
            String endDate,
            String status,
            String color,
            String startTime,
            String endTime,
            String startTimeSlot,
            String endTimeSlot
    );
    Map<String, Object> getProjectScheduleDetail(Long scheduleId);

    boolean updateProjectSchedule(
            Long scheduleId,
            String title,
            String startDate,
            String endDate,
            String status,
            String color,
            String startTime,
            String endTime,
            String startTimeSlot,
            String endTimeSlot
    );

    boolean deleteProjectSchedule(Long scheduleId);
}
