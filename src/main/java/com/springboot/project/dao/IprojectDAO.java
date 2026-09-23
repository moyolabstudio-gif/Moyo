package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.projectPeriodPlanDTO;
import com.springboot.project.dto.projectPlanFeatureDTO;
import com.springboot.project.dto.projectPlanCalendarPrefDTO;
import com.springboot.project.dto.projectTimePlanDTO;
import com.springboot.project.dto.projectWeeklyPlanDTO;

@Mapper
public interface IprojectDAO {

    // 1. 프로젝트 기본 CRUD
    int insertProject(projectRequestDTO dto);
    List<projectRequestDTO> selectProjectsByWsId(Long wsId);
    List<projectRequestDTO> selectSidebarActiveProjectsByWsId(Long wsId);
    List<projectRequestDTO> selectSidebarActiveProjectsForUser(@Param("userId") Long userId);
    List<projectRequestDTO> selectSidebarPersonalActiveProjects(@Param("userId") Long userId);
    List<Map<String, Object>> selectProjectListByWorkspaceId(@Param("wsId") Long wsId, @Param("viewerUserId") Long viewerUserId);
    List<Map<String, Object>> selectPersonalProjects(@Param("userId") Long userId);
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
    int countProjectEvent(@Param("projId") Long projId);
    int deleteProjectEvent(@Param("projId") Long projId);
    Map<String, Object> getProjectTaskSummary(@Param("projId") Long projId);
    List<Map<String, Object>> getProjectTasks(@Param("projId") Long projId);
    List<Map<String, Object>> getProjectMemberTasks(@Param("projId") Long projId, @Param("userId") Long userId);
    Map<String, Object> getProjectMemberContributionCounts(@Param("projId") Long projId, @Param("userId") Long userId, @Param("viewerUserId") Long viewerUserId);
    List<Map<String, Object>> getProjectMemberRecentNotes(@Param("projId") Long projId, @Param("userId") Long userId, @Param("viewerUserId") Long viewerUserId);
    List<Map<String, Object>> getProjectMemberRecentPhotos(@Param("projId") Long projId, @Param("userId") Long userId, @Param("viewerUserId") Long viewerUserId);
    List<Map<String, Object>> getProjectMemberRecentFiles(@Param("projId") Long projId, @Param("userId") Long userId, @Param("viewerUserId") Long viewerUserId);
    List<Map<String, Object>> getProjectMemberRecentActivities(@Param("projId") Long projId, @Param("userId") Long userId, @Param("viewerUserId") Long viewerUserId);

    void ensureProjectActivityHistory();
    int insertProjectActivityHistory(
            @Param("projId") Long projId,
            @Param("actorUserId") Long actorUserId,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId,
            @Param("actionType") String actionType,
            @Param("title") String title,
            @Param("detail") String detail);
    List<Map<String, Object>> selectProjectActivityHistory(
            @Param("projId") Long projId,
            @Param("targetType") String targetType,
            @Param("limit") int limit);
    List<Map<String, Object>> getProjectTaskAssignees(@Param("projId") Long projId);
    List<Map<String, Object>> getTaskAssignees(@Param("taskId") Long taskId);
    int insertTask(Map<String, Object> paramMap);
    int deleteTaskAssignees(@Param("taskId") Long taskId);
    int deleteTask(@Param("taskId") Long taskId);
    int insertTaskAssignees(@Param("taskId") Long taskId,
                            @Param("assigneeIds") List<Long> assigneeIds,
                            @Param("assignedBy") Long assignedBy);
    Map<String, Object> getTaskDetail(@Param("taskId") Long taskId);
    int updateTask(Map<String, Object> params);
    int updateTaskStatus(
            @Param("taskId") Long taskId,
            @Param("status") String status);

 // 프로젝트 수정
    int updateProject(projectRequestDTO dto);
    int updateProjectEvent(projectRequestDTO dto);

    List<Map<String, Object>> selectProjectLinks(@Param("projId") Long projId);
    int deleteProjectLinks(@Param("projId") Long projId);
    int insertProjectLink(Map<String, Object> params);
    // 프로젝트 삭제 신청/취소
    int requestProjectDeletion(@Param("projId") Long projId);
    int cancelProjectDeletion(@Param("projId") Long projId);

    // 20-24~20-27 최종 삭제
    List<Long> selectExpiredProjectDeletionIds();
    int deleteProjectTargetShares(@Param("projId") Long projId);
    int deleteProjectContentReactions(@Param("projId") Long projId);

    // 기록/탐색기/업무/계획 등 PROJECTS를 직접 참조하는 자식 데이터 정리
    int deleteProjectRecordLinksForFinalDelete(@Param("projId") Long projId);
    int deleteProjectRecordLocationsForFinalDelete(@Param("projId") Long projId);
    int deleteProjectRecordItemsForFinalDelete(@Param("projId") Long projId);
    int deleteProjectRecordTargetsForFinalDelete(@Param("projId") Long projId);
    int deleteProjectPlanSharesForFinalDelete(@Param("projId") Long projId);
    int deleteProjectTaskAssigneesForFinalDelete(@Param("projId") Long projId);
    int deleteProjectTasksForFinalDelete(@Param("projId") Long projId);
    int deleteProjectPlanCalendarPrefsForFinalDelete(@Param("projId") Long projId);
    int deleteProjectPlanFeaturesForFinalDelete(@Param("projId") Long projId);
    int deleteProjectContentFileRecentAccessForFinalDelete(@Param("projId") Long projId);
    int deleteProjectContentFilesForFinalDelete(@Param("projId") Long projId);
    int deleteProjectContentFileFoldersForFinalDelete(@Param("projId") Long projId);
    int deleteProjectNativeNotes(@Param("projId") Long projId);
    int deleteProjectNoteFolders(@Param("projId") Long projId);
    int deleteProjectPhotoPosts(@Param("projId") Long projId);
    int deleteProjectPhotoAlbums(@Param("projId") Long projId);
    int deleteProjectBoardPosts(@Param("projId") Long projId);
    int deleteProjectPolls(@Param("projId") Long projId);
    int deleteProjectWorkReports(@Param("projId") Long projId);
    int deleteProjectEvents(@Param("projId") Long projId);
    int deleteProjectLinksForFinalDelete(@Param("projId") Long projId);
    int deleteProjectMembersForFinalDelete(@Param("projId") Long projId);
    int deleteProjectRow(@Param("projId") Long projId);
    int deleteProjectRowForWorkspaceFinalDelete(@Param("projId") Long projId);
List<Map<String, Object>> selectProjectSchedules(@Param("projId") Long projId,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate);
    int insertProjectSchedule(Map<String, Object> paramMap);
    Map<String, Object> getProjectScheduleDetail(@Param("scheduleId") Long scheduleId);
    int updateProjectSchedule(Map<String, Object> paramMap);
    int deleteProjectSchedule(@Param("scheduleId") Long scheduleId);
    


    // 프로젝트 기간별 계획
    List<projectPeriodPlanDTO> selectProjectPeriodPlans(
            @Param("projId") Long projId,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate);
    projectPeriodPlanDTO selectProjectPeriodPlanById(@Param("periodPlanId") Long periodPlanId);
    int insertProjectPeriodPlan(projectPeriodPlanDTO dto);
    int updateProjectPeriodPlan(projectPeriodPlanDTO dto);
    int updateProjectPeriodPlanSortOrder(
            @Param("periodPlanId") Long periodPlanId,
            @Param("projId") Long projId,
            @Param("sortOrder") Integer sortOrder);
    int shiftProjectPeriodPlanSortOrdersForInsert(
            @Param("projId") Long projId,
            @Param("fromSortOrder") Integer fromSortOrder);
    int compactProjectPeriodPlanSortOrdersAfterDelete(
            @Param("projId") Long projId,
            @Param("deletedSortOrder") Integer deletedSortOrder);
    int selectNextProjectPeriodPlanSortOrder(@Param("projId") Long projId);
    int countProjectPeriodPlans(@Param("projId") Long projId);
    int deleteProjectPeriodPlan(
            @Param("periodPlanId") Long periodPlanId,
            @Param("projId") Long projId);

    // 프로젝트 시간별 계획: 특정 날짜 기준
    List<projectTimePlanDTO> selectProjectTimePlans(
            @Param("projId") Long projId,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate,
            @Param("taskId") Long taskId);
    projectTimePlanDTO selectProjectTimePlanById(@Param("timePlanId") Long timePlanId);
    int insertProjectTimePlan(projectTimePlanDTO dto);
    int updateProjectTimePlan(projectTimePlanDTO dto);
    int updateProjectTimePlanSortOrder(
            @Param("timePlanId") Long timePlanId,
            @Param("projId") Long projId,
            @Param("sortOrder") Integer sortOrder);
    int shiftProjectTimePlanSortOrdersForInsert(
            @Param("projId") Long projId,
            @Param("startDate") String startDate,
            @Param("fromSortOrder") Integer fromSortOrder);
    int compactProjectTimePlanSortOrdersAfterDelete(
            @Param("projId") Long projId,
            @Param("startDate") String startDate,
            @Param("deletedSortOrder") Integer deletedSortOrder);
    int selectNextProjectTimePlanSortOrder(
            @Param("projId") Long projId,
            @Param("startDate") String startDate);
    int deleteProjectTimePlan(
            @Param("timePlanId") Long timePlanId,
            @Param("projId") Long projId);

    // 프로젝트 주간 계획: 요일 기준 반복
    List<projectWeeklyPlanDTO> selectProjectWeeklyPlans(
            @Param("projId") Long projId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("activeYn") String activeYn,
            @Param("taskId") Long taskId);
    projectWeeklyPlanDTO selectProjectWeeklyPlanById(@Param("weeklyPlanId") Long weeklyPlanId);
    int insertProjectWeeklyPlan(projectWeeklyPlanDTO dto);
    int updateProjectWeeklyPlan(projectWeeklyPlanDTO dto);
    int updateProjectWeeklyPlanSortOrder(
            @Param("weeklyPlanId") Long weeklyPlanId,
            @Param("projId") Long projId,
            @Param("sortOrder") Integer sortOrder);
    int shiftProjectWeeklyPlanSortOrdersForInsert(
            @Param("projId") Long projId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("fromSortOrder") Integer fromSortOrder);
    int compactProjectWeeklyPlanSortOrdersAfterDelete(
            @Param("projId") Long projId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("deletedSortOrder") Integer deletedSortOrder);
    int selectNextProjectWeeklyPlanSortOrder(
            @Param("projId") Long projId,
            @Param("dayOfWeek") Integer dayOfWeek);
    int deleteProjectWeeklyPlan(
            @Param("weeklyPlanId") Long weeklyPlanId,
            @Param("projId") Long projId);


    // 프로젝트 계획 별도 편집 권한
    List<Long> selectProjectPlanEditorUserIds(
            @Param("projId") Long projId,
            @Param("planType") String planType,
            @Param("planId") Long planId);
    int countProjectPlanEditor(
            @Param("projId") Long projId,
            @Param("planType") String planType,
            @Param("planId") Long planId,
            @Param("userId") Long userId);
    int deleteProjectPlanEditors(
            @Param("projId") Long projId,
            @Param("planType") String planType,
            @Param("planId") Long planId);
    int insertProjectPlanEditor(
            @Param("projId") Long projId,
            @Param("planType") String planType,
            @Param("planId") Long planId,
            @Param("userId") Long userId,
            @Param("grantedBy") Long grantedBy);
    int countProjectMemberForPlanPermission(
            @Param("projId") Long projId,
            @Param("userId") Long userId);

    projectPlanFeatureDTO selectProjectPlanFeature(@Param("projId") Long projId);
    int insertDefaultProjectPlanFeature(@Param("projId") Long projId);
    int updateProjectPlanFeature(projectPlanFeatureDTO dto);
    int deleteAllProjectPeriodPlans(@Param("projId") Long projId);
    int deleteAllProjectTimePlans(@Param("projId") Long projId);
    int deleteAllProjectWeeklyPlans(@Param("projId") Long projId);
    int disableProjectPlanFeature(@Param("projId") Long projId, @Param("type") String type);

    projectPlanCalendarPrefDTO selectProjectPlanCalendarPref(@Param("userId") Long userId, @Param("projId") Long projId);
    int mergeProjectPlanCalendarPref(projectPlanCalendarPrefDTO dto);

}