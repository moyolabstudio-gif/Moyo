package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.projectRequestDTO;

@Mapper
public interface IprojectDAO {

    // 1. 프로젝트 기본 CRUD
    int insertProject(projectRequestDTO dto);
    List<projectRequestDTO> selectProjectsByWsId(Long wsId);
    List<Map<String, Object>> selectProjectListByWorkspaceId(@Param("wsId") Long wsId);
    projectRequestDTO selectProjectById(Long projId);
    // 2. 프로젝트 멤버 할당
    int insertProjectMember(@Param("projId") Long projId, 
                            @Param("userId") Long userId, 
                            @Param("role") String role,
                            @Param("projPosition") String projPosition);

    // 3. 워크스페이스 멤버 중 이 프로젝트에 아직 참여하지 않은 사람 목록
    List<Map<String, Object>> getAssignableMembers(@Param("wsId") Long wsId, @Param("projId") Long projId);
    
    // 4. 현재 프로젝트에 참여 중인 멤버 목록 조회
    List<Map<String, Object>> getProjectMembers(Long projId);
    Map<String, Object> getProjectMemberProfile(
            @Param("projId") Long projId,
            @Param("targetUserId") Long targetUserId,
            @Param("viewerUserId") Long viewerUserId);
    int updateProjectMemberPosition(@Param("projId") Long projId,
                                    @Param("userId") Long userId,
                                    @Param("projPosition") String projPosition);
    int updateProjectMemberRole(@Param("projId") Long projId,
                                @Param("userId") Long userId,
                                @Param("projRole") String projRole);
    int updateProjectLeader(@Param("projId") Long projId,
                            @Param("userId") Long userId);
    int checkMemberExists(@Param("projId") Long projId, @Param("userId") Long userId);
    int reassignMemberTasksToLeader(@Param("projId") Long projId,
                                    @Param("userId") Long userId,
                                    @Param("leaderId") Long leaderId);
    int deleteProjectMember(@Param("projId") Long projId, @Param("userId") Long userId);

    // 💡 [핵심 추가] 캘린더 로직을 건드리지 않고 프로젝트 생성 시 이벤트를 직접 등록
    int insertProjectEvent(projectRequestDTO dto);
    Map<String, Object> getProjectTaskSummary(@Param("projId") Long projId);
    List<Map<String, Object>> getProjectTasks(@Param("projId") Long projId);
    int insertTask(Map<String, Object> paramMap);
    Map<String, Object> getTaskDetail(@Param("taskId") Long taskId);
    int updateTask(Map<String, Object> params);
    int updateTaskStatus(
            @Param("taskId") Long taskId,
            @Param("status") String status);
    int deleteTask(long taskId);
 // 프로젝트 수정
    int updateProject(projectRequestDTO dto);
    int updateProjectEvent(projectRequestDTO dto);

    List<Map<String, Object>> selectProjectLinks(@Param("projId") Long projId);
    int deleteProjectLinks(@Param("projId") Long projId);
    int insertProjectLink(Map<String, Object> params);
    // 프로젝트 삭제
    int deleteProject(Long projId);
    List<Map<String, Object>> selectProjectSchedules(Long projId);
    int insertProjectSchedule(Map<String, Object> paramMap);
    Map<String, Object> getProjectScheduleDetail(@Param("scheduleId") Long scheduleId);
    int updateProjectSchedule(Map<String, Object> paramMap);
    int deleteProjectSchedule(@Param("scheduleId") Long scheduleId);
    
}