package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.projectPeriodPlanDTO;
import com.springboot.project.dto.projectPlanFeatureDTO;
import com.springboot.project.dto.projectPlanCalendarPrefDTO;
import com.springboot.project.dto.projectTimePlanDTO;
import com.springboot.project.dto.projectWeeklyPlanDTO;

public interface IprojectService {
    // 프로젝트를 생성하고, 생성한 유저를 팀장으로 등록하는 표준 메서드
    void insertProject(projectRequestDTO dto, Long userId);
    List<projectRequestDTO> getProjectsByWsId(Long wsId);
    List<Map<String, Object>> getProjectListByWorkspaceId(Long wsId);
    List<Map<String, Object>> getPersonalProjects(Long userId);
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
    Map<String, Object> getProjectMemberTasks(Long projId, Long userId);
    Map<String, Object> getProjectMemberContributions(Long projId, Long userId, Long viewerUserId);
    List<Map<String, Object>> getProjectMemberRecentActivities(Long projId, Long userId, Long viewerUserId);
    boolean addTask(
            Long projId,
            List<Long> assigneeIds,
            Long createdBy,
            String title,
            String startDate,
            String endDate,
            String status,
            String startTime,
            String endTime,
            String startTimeSlot,
            String endTimeSlot,
            Integer sortOrder,
            String recordEnabledYn,
            String recordVisibility
    );
    projectRequestDTO getProjectById(Long projId);
    List<Map<String, Object>> getProjectLinks(Long projId);
    Map<String, Object> getTaskDetail(Long taskId);
 // IprojectService.java
    boolean updateTask(Long taskId, String title, String startDate, String endDate, String status, List<Long> assigneeIds, Long assignedBy, String startTime, String endTime, String startTimeSlot, String endTimeSlot, Integer sortOrder, String recordEnabledYn, String recordVisibility);
    boolean deleteTask(Long taskId);
    boolean updateProject(projectRequestDTO dto);
    boolean requestProjectDeletion(Long projId, Long userId);
    boolean cancelProjectDeletion(Long projId, Long userId);
boolean updateTaskStatus(Long taskId, String status);
    List<Map<String, Object>> getProjectSchedules(Long projId);
    List<Map<String, Object>> getProjectSchedules(Long projId, String startDate, String endDate);
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

    // 프로젝트 기간별 계획
    List<projectPeriodPlanDTO> getProjectPeriodPlans(Long projId, String startDate, String endDate);
    projectPeriodPlanDTO getProjectPeriodPlan(Long periodPlanId);
    projectPeriodPlanDTO addProjectPeriodPlan(projectPeriodPlanDTO dto);
    boolean updateProjectPeriodPlan(projectPeriodPlanDTO dto);
    boolean deleteProjectPeriodPlan(Long periodPlanId, Long projId);
    boolean reorderProjectPeriodPlans(Long projId, List<Long> periodPlanIds);
    int countTasksOutsidePeriodPlanRange(Long periodPlanId, String startDate, String endDate);

    // 프로젝트 시간별 계획: 시작·종료 일시 기준
    List<projectTimePlanDTO> getProjectTimePlans(Long projId, String startDate, String endDate, Long taskId);
    projectTimePlanDTO getProjectTimePlan(Long timePlanId);
    projectTimePlanDTO addProjectTimePlan(projectTimePlanDTO dto);
    boolean updateProjectTimePlan(projectTimePlanDTO dto);
    boolean deleteProjectTimePlan(Long timePlanId, Long projId);
    boolean reorderProjectTimePlans(Long projId, String planDate, List<Long> timePlanIds);

    // 프로젝트 주간 계획: 요일 기준 반복
    List<projectWeeklyPlanDTO> getProjectWeeklyPlans(Long projId, Integer dayOfWeek, String activeYn, Long taskId);
    projectWeeklyPlanDTO getProjectWeeklyPlan(Long weeklyPlanId);
    projectWeeklyPlanDTO addProjectWeeklyPlan(projectWeeklyPlanDTO dto);
    boolean updateProjectWeeklyPlan(projectWeeklyPlanDTO dto);
    boolean deleteProjectWeeklyPlan(Long weeklyPlanId, Long projId);
    boolean reorderProjectWeeklyPlans(Long projId, Integer dayOfWeek, List<Long> weeklyPlanIds);


    // 프로젝트 계획 별도 편집 권한
    List<Long> getProjectPlanEditorUserIds(Long projId, String planType, Long planId);
    boolean isProjectPlanEditor(Long projId, String planType, Long planId, Long userId);
    void replaceProjectPlanEditors(Long projId, String planType, Long planId, List<Long> userIds, Long grantedBy);

    projectPlanFeatureDTO getOrCreateProjectPlanFeature(Long projId);
    projectPlanFeatureDTO updateProjectPlanFeature(projectPlanFeatureDTO dto);
    projectPlanFeatureDTO removeProjectPlanFeature(Long projId, String type);

    projectPlanCalendarPrefDTO getProjectPlanCalendarPref(Long userId, Long projId);
    projectPlanCalendarPrefDTO saveProjectPlanCalendarPref(projectPlanCalendarPrefDTO dto);

}
