package com.springboot.project.service.impl;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IcalendarResponseDAO;
import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.projectPeriodPlanDTO;
import com.springboot.project.dto.projectPlanFeatureDTO;
import com.springboot.project.dto.projectPlanCalendarPrefDTO;
import com.springboot.project.dto.projectTimePlanDTO;
import com.springboot.project.dto.projectWeeklyPlanDTO;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IcontentRecordService;
import com.springboot.project.service.ProjectPolicy;

@Service
public class projectServiceImpl implements IprojectService {

    private String normalizeProjectPosition(String position) {
        String safePosition = position == null ? null : position.trim();
        if (safePosition != null && safePosition.length() > 100) {
            safePosition = safePosition.substring(0, 100);
        }
        return (safePosition == null || safePosition.isEmpty()) ? null : safePosition;
    }

    private String memberPosition(projectRequestDTO dto, Long userId) {
        if (dto == null || dto.getMemberPositions() == null || userId == null) {
            return null;
        }
        return normalizeProjectPosition(dto.getMemberPositions().get(String.valueOf(userId)));
    }

    private Object projectMemberValue(Map<String, Object> member, String key) {
        if (member == null || key == null) return null;
        if (member.containsKey(key)) return member.get(key);
        for (Map.Entry<String, Object> entry : member.entrySet()) {
            if (entry.getKey() != null && key.equalsIgnoreCase(entry.getKey())) return entry.getValue();
        }
        return null;
    }

    private Long projectMemberUserId(Map<String, Object> member) {
        Object value = projectMemberValue(member, "USER_ID");
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        try { return Long.valueOf(String.valueOf(value)); }
        catch (Exception e) { return null; }
    }

    private String projectMemberRole(Map<String, Object> member) {
        Object value = projectMemberValue(member, "PROJ_ROLE");
        return value == null ? "MEMBER" : String.valueOf(value).trim().toUpperCase();
    }

    private Map<String, Object> findProjectMember(List<Map<String, Object>> members, Long userId) {
        if (members == null || userId == null) return null;
        for (Map<String, Object> member : members) {
            if (userId.equals(projectMemberUserId(member))) return member;
        }
        return null;
    }

    private boolean canManageProjectMembers(projectRequestDTO project, List<Map<String, Object>> members, Long requesterId) {
        if (project == null || requesterId == null) return false;
        if (requesterId.equals(project.getLeaderId())) return true;
        Map<String, Object> requester = findProjectMember(members, requesterId);
        return requester != null && "ADMIN".equals(projectMemberRole(requester));
    }

    private boolean projectMemberChangesAvailable(projectRequestDTO project) {
        if (project == null || !"GROUP".equalsIgnoreCase(project.getProjScope())) return false;
        return project.getDeleteRequestedAt() == null
                && !"DELETE_PENDING".equalsIgnoreCase(project.getStatus());
    }

    private String normalizeTaskTime(String time, String slot, String fallback) {
        String value = time == null ? "" : time.trim();

        if (value.matches("^\\d{2}:\\d{2}$")) {
            return value;
        }

        if (value.matches("^\\d{2}:\\d{2}:\\d{2}$")) {
            return value.substring(0, 5);
        }

        String normalizedSlot = slot == null ? "" : slot.trim().toUpperCase();
        if ("AM".equals(normalizedSlot)) return "09:00";
        if ("PM".equals(normalizedSlot)) return "18:00";

        return fallback;
    }

    private String toTaskTimeSlot(String time, String fallbackSlot) {
        String normalized = normalizeTaskTime(time, fallbackSlot, "09:00");
        try {
            int hour = Integer.parseInt(normalized.substring(0, 2));
            return hour < 12 ? "AM" : "PM";
        } catch (Exception e) {
            return fallbackSlot;
        }
    }

    private String normalizeTaskSlotFlag(String slot, String fallbackSlot) {
        String value = slot == null ? "" : slot.trim().toUpperCase();

        if ("TIME".equals(value)) return "TIME";
        if ("NONE".equals(value)) return "NONE";
        if ("AM".equals(value)) return "AM";
        if ("PM".equals(value)) return "PM";

        return fallbackSlot;
    }

    @Autowired
    private IprojectDAO projectDao;

    @Autowired
    private IcalendarResponseDAO calendarDao;

    @Autowired
    private IcontentRecordService contentRecordService; 

 // projectServiceImpl.java의 insertProject 메서드 수정
    @Override
    @Transactional
    public void insertProject(projectRequestDTO dto, Long userId) {
        String scope = dto.getProjScope() == null ? "GROUP" : dto.getProjScope().trim().toUpperCase();
        if (!"PERSONAL".equals(scope) && !"GROUP".equals(scope)) {
            scope = "GROUP";
        }

        String category = dto.getProjCategory();
        if (category == null || category.isBlank()) {
            category = dto.getProjType();
        }
        category = ProjectPolicy.normalizeType(category);

        // 생성/설정 모두 동일한 canonical type/icon 정책을 사용한다.
        dto.setProjCategoryDetail(null);
        dto.setProjCategory(category);
        dto.setProjType(category);
        dto.setProjIcon(ProjectPolicy.normalizeIcon(dto.getProjIcon(), category));
        dto.setAccessScope(ProjectPolicy.normalizeAccessScope(dto.getAccessScope(), scope));

        if ("PERSONAL".equals(scope)) {
            // 개인 프로젝트는 그룹에 소속되지 않으므로 WS_ID가 없어야 합니다.
            dto.setWsId(null);
            dto.setLeaderId(userId);
            dto.setMemberIds(List.of());
            dto.setAdminIds(List.of());
            dto.setMemberPositions(Map.of());
        } else {
            // 그룹 프로젝트에서만 WS_ID를 필수로 검사합니다.
            if (dto.getWsId() == null) {
                throw new IllegalArgumentException("그룹 정보가 없습니다.");
            }
            if (dto.getLeaderId() == null) {
                dto.setLeaderId(userId);
            }
        }

        dto.setProjScope(scope);

        projectDao.insertProject(dto);

        projectDao.insertProjectMember(dto.getProjId(), dto.getLeaderId(), "ADMIN", memberPosition(dto, dto.getLeaderId()));

        if (dto.getAdminIds() != null) {
            for (Long adminId : dto.getAdminIds()) {
                if (adminId != null && !adminId.equals(dto.getLeaderId())
                        && projectDao.checkMemberExists(dto.getProjId(), adminId) == 0) {
                    projectDao.insertProjectMember(dto.getProjId(), adminId, "ADMIN", memberPosition(dto, adminId));
                }
            }
        }

        if (dto.getMemberIds() != null) {
            for (Long memberId : dto.getMemberIds()) {
                if (memberId != null && !memberId.equals(dto.getLeaderId())
                        && projectDao.checkMemberExists(dto.getProjId(), memberId) == 0) {
                    projectDao.insertProjectMember(dto.getProjId(), memberId, "MEMBER", memberPosition(dto, memberId));
                }
            }
        }

        boolean periodEnabled = "Y".equalsIgnoreCase(dto.getPeriodEnabledYn())
                && dto.getStartDate() != null && !dto.getStartDate().isBlank()
                && dto.getEndDate() != null && !dto.getEndDate().isBlank();

        dto.setPeriodEnabledYn(periodEnabled ? "Y" : "N");
        if (periodEnabled) {
            projectDao.insertProjectEvent(dto);
        } else {
            dto.setStartDate(null);
            dto.setEndDate(null);
        }

        replaceProjectLinks(dto.getProjId(), dto.getLinks());
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
                projectDao.insertProjectMember(projId, userId, "MEMBER", null);
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

    @Override
    public Map<String, Object> getProjectMemberProfile(
            Long projId,
            Long targetUserId,
            Long viewerUserId) {
        return projectDao.getProjectMemberProfile(projId, targetUserId, viewerUserId);
    }

    
    @Override
    public boolean updateProjectMemberPosition(Long projId, Long userId, String projPosition) {
        return projectDao.updateProjectMemberPosition(projId, userId, projPosition) > 0;
    }


    @Override
    @Transactional
    public boolean updateProjectMemberSetting(Long projId, Long userId, String projPosition, String projRole) {
        String safeRole = projRole == null ? "MEMBER" : projRole.trim().toUpperCase();

        if (!"MEMBER".equals(safeRole) && !"ADMIN".equals(safeRole) && !"LEADER".equals(safeRole)) {
            return false;
        }

        int positionResult = projectDao.updateProjectMemberPosition(projId, userId, projPosition);

        String dbRole = "LEADER".equals(safeRole) ? "ADMIN" : safeRole;
        int roleResult = projectDao.updateProjectMemberRole(projId, userId, dbRole);

        int leaderResult = 1;
        if ("LEADER".equals(safeRole)) {
            leaderResult = projectDao.updateProjectLeader(projId, userId);
        }

        return positionResult > 0 && roleResult > 0 && leaderResult > 0;
    }



    @Override
    @Transactional
    public boolean removeProjectMember(Long projId, Long userId) {
        projectRequestDTO project = projectDao.selectProjectById(projId);

        if (project == null || project.getLeaderId() == null) {
            return false;
        }

        if (project.getLeaderId().equals(userId)) {
            return false;
        }

        // 삭제 대상이 맡고 있던 업무는 현재 팀장에게 이관합니다.
        projectDao.reassignMemberTasksToLeader(projId, userId, project.getLeaderId());

        return projectDao.deleteProjectMember(projId, userId) > 0;
    }

    @Override
    @Transactional
    public String updateProjectMembers(Long projId, Long requesterId, List<Map<String, Object>> changes) {
        if (projId == null || requesterId == null || changes == null || changes.isEmpty()) {
            return "invalid_request";
        }
        if (changes.size() > 100) return "too_many_changes";

        projectRequestDTO project = projectDao.selectProjectById(projId);
        if (project == null) return "project_not_found";
        if (!projectMemberChangesAvailable(project)) return "project_unavailable";

        List<Map<String, Object>> members = projectDao.getProjectMembers(projId);
        if (!canManageProjectMembers(project, members, requesterId)) return "forbidden";

        List<Map<String, Object>> normalized = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>();

        for (Map<String, Object> change : changes) {
            if (change == null || change.get("userId") == null) return "invalid_request";

            Long targetUserId;
            try { targetUserId = Long.valueOf(String.valueOf(change.get("userId"))); }
            catch (Exception e) { return "invalid_request"; }

            if (!seen.add(targetUserId)) return "duplicate_member";
            Map<String, Object> target = findProjectMember(members, targetUserId);
            if (target == null) return "member_not_found";

            boolean hasRole = change.containsKey("role");
            String role = !hasRole || change.get("role") == null
                    ? null
                    : String.valueOf(change.get("role")).trim().toUpperCase();
            if (hasRole) {
                if (!"ADMIN".equals(role) && !"MEMBER".equals(role)) return "invalid_role";
                if (project.getLeaderId() != null && project.getLeaderId().equals(targetUserId)) {
                    return "leader_role_locked";
                }
                if (requesterId.equals(targetUserId)) return "self_role_locked";
            }

            boolean hasPosition = change.containsKey("position");
            String position = !hasPosition || change.get("position") == null
                    ? null
                    : normalizeProjectPosition(String.valueOf(change.get("position")));

            Map<String, Object> item = new HashMap<>();
            item.put("userId", targetUserId);
            item.put("hasRole", hasRole);
            item.put("role", role);
            item.put("hasPosition", hasPosition);
            item.put("position", position);
            normalized.add(item);
        }

        for (Map<String, Object> item : normalized) {
            Long targetUserId = (Long) item.get("userId");
            if (Boolean.TRUE.equals(item.get("hasRole"))
                    && projectDao.updateProjectMemberRole(projId, targetUserId, (String) item.get("role")) < 1) {
                throw new IllegalStateException("PROJECT_MEMBER_ROLE_UPDATE_FAILED");
            }
            if (Boolean.TRUE.equals(item.get("hasPosition"))
                    && projectDao.updateProjectMemberPosition(projId, targetUserId, (String) item.get("position")) < 1) {
                throw new IllegalStateException("PROJECT_MEMBER_POSITION_UPDATE_FAILED");
            }
        }
        return "success";
    }

    @Override
    @Transactional
    public String removeProjectMembers(Long projId, Long requesterId, List<Long> userIds) {
        if (projId == null || requesterId == null || userIds == null || userIds.isEmpty()) {
            return "invalid_request";
        }
        if (userIds.size() > 100) return "too_many_members";

        projectRequestDTO project = projectDao.selectProjectById(projId);
        if (project == null) return "project_not_found";
        if (!projectMemberChangesAvailable(project)) return "project_unavailable";

        List<Map<String, Object>> members = projectDao.getProjectMembers(projId);
        if (!canManageProjectMembers(project, members, requesterId)) return "forbidden";

        boolean requesterIsLeader = project.getLeaderId() != null && project.getLeaderId().equals(requesterId);
        Set<Long> uniqueIds = new LinkedHashSet<>();

        for (Long targetUserId : userIds) {
            if (targetUserId == null || !uniqueIds.add(targetUserId)) return "invalid_request";
            if (requesterId.equals(targetUserId)) return "self_remove_locked";
            if (project.getLeaderId() != null && project.getLeaderId().equals(targetUserId)) {
                return "leader_protected";
            }

            Map<String, Object> target = findProjectMember(members, targetUserId);
            if (target == null) return "member_not_found";
            if (!requesterIsLeader && "ADMIN".equals(projectMemberRole(target))) return "forbidden";
        }

        for (Long targetUserId : uniqueIds) {
            projectDao.reassignMemberTasksToLeader(projId, targetUserId, project.getLeaderId());
            if (projectDao.deleteProjectMember(projId, targetUserId) < 1) {
                throw new IllegalStateException("PROJECT_MEMBER_REMOVE_FAILED");
            }
        }
        return "success";
    }



// 5. [기존 유지] 워크스페이스별 프로젝트 목록
    @Override
    public List<projectRequestDTO> getProjectsByWsId(Long wsId) {
        return projectDao.selectProjectsByWsId(wsId);
    }

    @Override
    public List<Map<String, Object>> getProjectListByWorkspaceId(Long wsId, Long viewerUserId) {
        return projectDao.selectProjectListByWorkspaceId(wsId, viewerUserId);
    }

    @Override
    public List<Map<String, Object>> getPersonalProjects(Long userId) {
        return projectDao.selectPersonalProjects(userId);
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
            summary.put("DELAYED_CNT", 0);
        }
        return summary;
    }
    @Override
    public List<Map<String, Object>> getProjectTasks(Long projId) {
        List<Map<String, Object>> tasks = projectDao.getProjectTasks(projId);
        List<Map<String, Object>> assigneeRows = projectDao.getProjectTaskAssignees(projId);
        attachTaskAssignees(tasks, assigneeRows);
        return tasks;
    }

    @Override
    public Map<String, Object> getProjectMemberTasks(Long projId, Long userId) {
        List<Map<String, Object>> tasks = projectDao.getProjectMemberTasks(projId, userId);
        if (tasks == null) {
            tasks = new ArrayList<>();
        }

        int todo = 0;
        int inProgress = 0;
        int done = 0;
        int delayed = 0;

        for (Map<String, Object> task : tasks) {
            String status = String.valueOf(task.getOrDefault("STATUS", "")).toUpperCase();
            if ("TODO".equals(status)) todo++;
            else if ("IN_PROGRESS".equals(status)) inProgress++;
            else if ("DONE".equals(status)) done++;

            if ("Y".equalsIgnoreCase(String.valueOf(task.get("DELAYED_YN")))) {
                delayed++;
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("TOTAL", tasks.size());
        summary.put("TODO_CNT", todo);
        summary.put("IN_PROGRESS_CNT", inProgress);
        summary.put("DONE_CNT", done);
        summary.put("DELAYED_CNT", delayed);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("tasks", tasks);
        return result;
    }

    @Override
    public Map<String, Object> getProjectMemberContributions(Long projId, Long userId, Long viewerUserId) {
        Map<String, Object> counts = projectDao.getProjectMemberContributionCounts(projId, userId, viewerUserId);
        if (counts == null) {
            counts = new HashMap<>();
        }

        List<Map<String, Object>> notes = projectDao.getProjectMemberRecentNotes(projId, userId, viewerUserId);
        List<Map<String, Object>> photos = projectDao.getProjectMemberRecentPhotos(projId, userId, viewerUserId);
        List<Map<String, Object>> files = projectDao.getProjectMemberRecentFiles(projId, userId, viewerUserId);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", counts);
        result.put("notes", notes == null ? new ArrayList<>() : notes);
        result.put("photos", photos == null ? new ArrayList<>() : photos);
        result.put("files", files == null ? new ArrayList<>() : files);
        return result;
    }

    @Override
    public List<Map<String, Object>> getProjectMemberRecentActivities(Long projId, Long userId, Long viewerUserId) {
        List<Map<String, Object>> rows = projectDao.getProjectMemberRecentActivities(projId, userId, viewerUserId);
        return rows == null ? new ArrayList<>() : rows;
    }

    private void attachTaskAssignees(List<Map<String, Object>> tasks, List<Map<String, Object>> assigneeRows) {
        Map<Long, List<Map<String, Object>>> assigneesByTaskId = new HashMap<>();

        if (assigneeRows != null) {
            for (Map<String, Object> row : assigneeRows) {
                Long taskId = toLong(row.get("TASK_ID"));
                if (taskId == null) {
                    continue;
                }

                Map<String, Object> assignee = new HashMap<>();
                assignee.put("userId", row.get("USER_ID"));
                assignee.put("name", row.get("USER_NAME"));
                assignee.put("email", row.get("USER_EMAIL"));
                assignee.put("profileImagePath", row.get("PROFILE_IMAGE_PATH"));
                assignee.put("projectRole", row.get("PROJECT_ROLE"));
                assignee.put("projectPosition", row.get("PROJECT_POSITION"));
                assignee.put("assignedAt", row.get("ASSIGNED_AT"));

                assigneesByTaskId.computeIfAbsent(taskId, key -> new ArrayList<>()).add(assignee);
            }
        }

        if (tasks == null) {
            return;
        }

        for (Map<String, Object> task : tasks) {
            Long taskId = toLong(task.get("TASK_ID"));
            List<Map<String, Object>> assignees = taskId == null
                    ? new ArrayList<>()
                    : assigneesByTaskId.getOrDefault(taskId, new ArrayList<>());
            task.put("assignees", assignees);
        }
    }

    private Long toLong(Object value) {
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
    @Override
    @Transactional
    public Long addTask(Long projId, List<Long> assigneeIds, Long createdBy, String title, String startDate, String endDate, String status, String startTime, String endTime, String startTimeSlot, String endTimeSlot, Integer sortOrder, String recordEnabledYn, String recordVisibility) {
        List<Long> normalizedAssigneeIds = normalizeAssigneeIds(assigneeIds);
        Long primaryAssigneeId = normalizedAssigneeIds.isEmpty() ? null : normalizedAssigneeIds.get(0);

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("projId", projId);
        // ASSIGNEE_ID는 구버전 화면 호환용 대표 담당자입니다. 원본은 연결 테이블입니다.
        paramMap.put("userId", primaryAssigneeId);
        paramMap.put("createdBy", createdBy);
        paramMap.put("title", title);
        paramMap.put("description", null);
        paramMap.put("calendarVisibleYn", "Y");
        paramMap.put("startDate", startDate);
        paramMap.put("endDate", endDate);
        paramMap.put("status", status);
        String normalizedStartTimeSlot = normalizeTaskSlotFlag(startTimeSlot, "NONE");
        String normalizedEndTimeSlot = normalizeTaskSlotFlag(endTimeSlot, "NONE");
        String normalizedStartTime = normalizeTaskTime(startTime, normalizedStartTimeSlot, "09:00");
        String normalizedEndTime = normalizeTaskTime(endTime, normalizedEndTimeSlot, "18:00");

        paramMap.put("startTime", normalizedStartTime);
        paramMap.put("endTime", normalizedEndTime);
        paramMap.put("startTimeSlot", normalizedStartTimeSlot);
        paramMap.put("endTimeSlot", normalizedEndTimeSlot);
        paramMap.put("sortOrder", sortOrder);
        paramMap.put("recordEnabledYn", "Y".equalsIgnoreCase(String.valueOf(recordEnabledYn)) ? "Y" : "N");
        paramMap.put("recordVisibility", Set.of("ASSIGNEE", "ASSIGNEE_MANAGER").contains(String.valueOf(recordVisibility).trim().toUpperCase()) ? "ASSIGNEE" : "PROJECT");
        if (projectDao.insertTask(paramMap) <= 0) {
            return null;
        }

        Long taskId = (Long) paramMap.get("taskId");
        if (taskId == null) {
            return null;
        }
        if (!normalizedAssigneeIds.isEmpty()) {
            projectDao.insertTaskAssignees(taskId, normalizedAssigneeIds, createdBy);
        }
        return taskId;
    }
    private List<Long> normalizeAssigneeIds(List<Long> assigneeIds) {
        if (assigneeIds == null || assigneeIds.isEmpty()) {
            return new ArrayList<>();
        }
        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>();
        for (Long userId : assigneeIds) {
            if (userId != null) {
                uniqueIds.add(userId);
            }
        }
        return new ArrayList<>(uniqueIds);
    }

    @Override
    public projectRequestDTO getProjectById(Long projId) {
        // DAO에 해당 쿼리가 없다면 selectProjectsByWsId 처럼 
        // projId로 단일 건을 조회하는 쿼리를 추가하거나 기존 것을 활용하세요.
        return projectDao.selectProjectById(projId); 
    }

    @Override
    public List<Map<String, Object>> getProjectLinks(Long projId) {
        return projectDao.selectProjectLinks(projId);
    }
    @Override
    public boolean addProjectSchedule(
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
            String endTimeSlot) {

        Map<String, Object> paramMap = new HashMap<>();

        paramMap.put("projId", projId);
        paramMap.put("wsId", wsId);
        paramMap.put("userId", userId);
        paramMap.put("title", title);
        paramMap.put("startDate", startDate);
        paramMap.put("endDate", endDate);
        paramMap.put("status", status == null || status.isEmpty() ? "TODO" : status);
        paramMap.put("color", color == null || color.isEmpty() ? "#4A90E2" : color);

        String normalizedStartTimeSlot = normalizeTaskSlotFlag(startTimeSlot, "NONE");
        String normalizedEndTimeSlot = normalizeTaskSlotFlag(endTimeSlot, "NONE");
        String normalizedStartTime = normalizeTaskTime(startTime, normalizedStartTimeSlot, "09:00");
        String normalizedEndTime = normalizeTaskTime(endTime, normalizedEndTimeSlot, "18:00");

        paramMap.put("startTime", normalizedStartTime);
        paramMap.put("endTime", normalizedEndTime);
        paramMap.put("startTimeSlot", normalizedStartTimeSlot);
        paramMap.put("endTimeSlot", normalizedEndTimeSlot);

        return projectDao.insertProjectSchedule(paramMap) > 0;
    }
    @Override
    public Map<String, Object> getProjectScheduleDetail(Long scheduleId) {
        return projectDao.getProjectScheduleDetail(scheduleId);
    }

    @Override
    @Transactional
    public boolean updateProjectSchedule(
            Long scheduleId,
            String title,
            String startDate,
            String endDate,
            String status,
            String color,
            String startTime,
            String endTime,
            String startTimeSlot,
            String endTimeSlot) {

        Map<String, Object> paramMap = new HashMap<>();

        paramMap.put("scheduleId", scheduleId);
        paramMap.put("title", title);
        paramMap.put("startDate", startDate);
        paramMap.put("endDate", endDate);
        paramMap.put("status", status == null || status.isEmpty() ? "TODO" : status);
        paramMap.put("color", color == null || color.isEmpty() ? "#4A90E2" : color);

        String normalizedStartTimeSlot = normalizeTaskSlotFlag(startTimeSlot, "NONE");
        String normalizedEndTimeSlot = normalizeTaskSlotFlag(endTimeSlot, "NONE");
        String normalizedStartTime = normalizeTaskTime(startTime, normalizedStartTimeSlot, "09:00");
        String normalizedEndTime = normalizeTaskTime(endTime, normalizedEndTimeSlot, "18:00");

        paramMap.put("startTime", normalizedStartTime);
        paramMap.put("endTime", normalizedEndTime);
        paramMap.put("startTimeSlot", normalizedStartTimeSlot);
        paramMap.put("endTimeSlot", normalizedEndTimeSlot);

        return projectDao.updateProjectSchedule(paramMap) > 0;
    }

    @Override
    @Transactional
    public boolean deleteProjectSchedule(Long scheduleId) {
        return projectDao.deleteProjectSchedule(scheduleId) > 0;
    }
    @Override
    public Map<String, Object> getTaskDetail(Long taskId) {
        Map<String, Object> task = projectDao.getTaskDetail(taskId);
        if (task == null) {
            return null;
        }
        List<Map<String, Object>> singleTask = new ArrayList<>();
        singleTask.add(task);
        attachTaskAssignees(singleTask, projectDao.getTaskAssignees(taskId));
        return task;
    }
 // projectServiceImpl.java
    @Override
    @Transactional
    public boolean updateTask(Long taskId, String title, String startDate, String endDate, String status, List<Long> assigneeIds, Long assignedBy, String startTime, String endTime, String startTimeSlot, String endTimeSlot, Integer sortOrder, String recordEnabledYn, String recordVisibility) {
        List<Long> normalizedAssigneeIds = normalizeAssigneeIds(assigneeIds);
        Long primaryAssigneeId = normalizedAssigneeIds.isEmpty() ? null : normalizedAssigneeIds.get(0);

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("taskId", taskId);
        paramMap.put("title", title);
        paramMap.put("description", null);
        paramMap.put("calendarVisibleYn", null);
        paramMap.put("startDate", startDate);
        paramMap.put("endDate", endDate);
        paramMap.put("status", status);
        paramMap.put("userId", primaryAssigneeId);
        paramMap.put("replaceAssignee", true);
        String normalizedStartTimeSlot = normalizeTaskSlotFlag(startTimeSlot, "NONE");
        String normalizedEndTimeSlot = normalizeTaskSlotFlag(endTimeSlot, "NONE");
        String normalizedStartTime = normalizeTaskTime(startTime, normalizedStartTimeSlot, "09:00");
        String normalizedEndTime = normalizeTaskTime(endTime, normalizedEndTimeSlot, "18:00");

        paramMap.put("startTime", normalizedStartTime);
        paramMap.put("endTime", normalizedEndTime);
        paramMap.put("startTimeSlot", normalizedStartTimeSlot);
        paramMap.put("endTimeSlot", normalizedEndTimeSlot);
        paramMap.put("sortOrder", sortOrder);
        paramMap.put("recordEnabledYn", "Y".equalsIgnoreCase(String.valueOf(recordEnabledYn)) ? "Y" : "N");
        paramMap.put("recordVisibility", Set.of("ASSIGNEE", "ASSIGNEE_MANAGER").contains(String.valueOf(recordVisibility).trim().toUpperCase()) ? "ASSIGNEE" : "PROJECT");

        if (projectDao.updateTask(paramMap) <= 0) {
            return false;
        }

        projectDao.deleteTaskAssignees(taskId);
        if (!normalizedAssigneeIds.isEmpty()) {
            projectDao.insertTaskAssignees(taskId, normalizedAssigneeIds, assignedBy);
        }
        return true;
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
        String normalizedType = ProjectPolicy.normalizeType(
                dto.getProjType() == null || dto.getProjType().isBlank()
                        ? dto.getProjCategory()
                        : dto.getProjType());
        dto.setProjType(normalizedType);
        dto.setProjCategory(normalizedType);
        dto.setProjIcon(ProjectPolicy.normalizeIcon(dto.getProjIcon(), normalizedType));
        dto.setAccessScope(ProjectPolicy.normalizeAccessScope(dto.getAccessScope(), dto.getProjScope()));

        boolean periodEnabled = "Y".equalsIgnoreCase(dto.getPeriodEnabledYn())
                && dto.getStartDate() != null && !dto.getStartDate().isBlank()
                && dto.getEndDate() != null && !dto.getEndDate().isBlank();
        dto.setPeriodEnabledYn(periodEnabled ? "Y" : "N");
        if (!periodEnabled) {
            dto.setStartDate(null);
            dto.setEndDate(null);
        }

        int result1 = projectDao.updateProject(dto);

        if (periodEnabled) {
            if (projectDao.countProjectEvent(dto.getProjId()) > 0) {
                projectDao.updateProjectEvent(dto);
            } else {
                projectDao.insertProjectEvent(dto);
            }
        } else {
            projectDao.deleteProjectEvent(dto.getProjId());
        }

        replaceProjectLinks(dto.getProjId(), dto.getLinks());
        return result1 > 0;
    }

    private void replaceProjectLinks(Long projId, List<Map<String, Object>> links) {
        projectDao.deleteProjectLinks(projId);
        if (links == null || links.isEmpty()) return;

        int sortOrder = 0;
        for (Map<String, Object> link : links) {
            String linkName = trimProjectLinkValue(link.get("linkName"), 50);
            String linkUrl = normalizeProjectLinkUrl(
                    trimProjectLinkValue(link.get("linkUrl"), 500));

            if (linkName == null && linkUrl == null) continue;
            if (linkName == null || linkUrl == null) {
                throw new IllegalArgumentException("링크 이름과 주소를 모두 입력해주세요.");
            }

            Map<String, Object> params = new HashMap<>();
            params.put("projId", projId);
            params.put("linkName", linkName);
            params.put("linkUrl", linkUrl);
            params.put("sortOrder", sortOrder++);
            projectDao.insertProjectLink(params);
        }
    }

    private String trimProjectLinkValue(Object value, int maxLength) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) return null;
        return text.length() > maxLength ? text.substring(0, maxLength) : text;
    }

    private String normalizeProjectLinkUrl(String url) {
        if (url == null) return null;
        String value = url;
        if (!value.matches("(?i)^https?://.*")) {
            value = "https://" + value;
        }
        if (!value.matches("(?i)^https?://[^\\s]+$")) {
            throw new IllegalArgumentException("올바른 외부 링크 주소가 아닙니다.");
        }
        return value;
    }

    @Override
    @Transactional
    public boolean requestProjectDeletion(Long projId, Long userId) {
        projectRequestDTO project = projectDao.selectProjectById(projId);
        if (project == null || project.getLeaderId() == null
                || !project.getLeaderId().equals(userId)) {
            return false;
        }

        String status = project.getStatus();
        if ("DELETE_PENDING".equalsIgnoreCase(status)) {
            return true;
        }
        if (status != null && !"ACTIVE".equalsIgnoreCase(status)) {
            return false;
        }

        return projectDao.requestProjectDeletion(projId) > 0;
    }

    @Override
    @Transactional
    public boolean cancelProjectDeletion(Long projId, Long userId) {
        projectRequestDTO project = projectDao.selectProjectById(projId);
        if (project == null || project.getLeaderId() == null
                || !project.getLeaderId().equals(userId)) {
            return false;
        }

        if (!"DELETE_PENDING".equalsIgnoreCase(project.getStatus())) {
            return false;
        }

        return projectDao.cancelProjectDeletion(projId) > 0;
    }

    @Override
    public boolean updateTaskStatus(Long taskId, String status) {


        int result =
            projectDao.updateTaskStatus(taskId, status);


        return result > 0;
    }
    @Override
    public List<Map<String, Object>> getProjectSchedules(Long projId) {
        return projectDao.selectProjectSchedules(projId, null, null);
    }

    @Override
    public List<Map<String, Object>> getProjectSchedules(Long projId, String startDate, String endDate) {
        return projectDao.selectProjectSchedules(projId, startDate, endDate);
    }
    

    private void normalizePlanRecordSetting(projectPeriodPlanDTO dto) {
        if (dto == null) return;
        if (dto.getRecordEnabledYn() != null && !dto.getRecordEnabledYn().isBlank()) {
            dto.setRecordEnabledYn("Y".equalsIgnoreCase(dto.getRecordEnabledYn()) ? "Y" : "N");
        } else {
            dto.setRecordEnabledYn(null);
        }
        if (dto.getRecordVisibility() != null && !dto.getRecordVisibility().isBlank()) {
            dto.setRecordVisibility("MANAGER".equalsIgnoreCase(dto.getRecordVisibility()) ? "MANAGER" : "PROJECT");
        } else {
            dto.setRecordVisibility(null);
        }
    }

    private void normalizePlanRecordSetting(projectTimePlanDTO dto) {
        if (dto == null) return;
        if (dto.getRecordEnabledYn() != null && !dto.getRecordEnabledYn().isBlank()) {
            dto.setRecordEnabledYn("Y".equalsIgnoreCase(dto.getRecordEnabledYn()) ? "Y" : "N");
        } else {
            dto.setRecordEnabledYn(null);
        }
        if (dto.getRecordVisibility() != null && !dto.getRecordVisibility().isBlank()) {
            dto.setRecordVisibility("MANAGER".equalsIgnoreCase(dto.getRecordVisibility()) ? "MANAGER" : "PROJECT");
        } else {
            dto.setRecordVisibility(null);
        }
    }

    private void normalizePlanRecordSetting(projectWeeklyPlanDTO dto) {
        if (dto == null) return;
        if (dto.getRecordEnabledYn() != null && !dto.getRecordEnabledYn().isBlank()) {
            dto.setRecordEnabledYn("Y".equalsIgnoreCase(dto.getRecordEnabledYn()) ? "Y" : "N");
        } else {
            dto.setRecordEnabledYn(null);
        }
        if (dto.getRecordVisibility() != null && !dto.getRecordVisibility().isBlank()) {
            dto.setRecordVisibility("MANAGER".equalsIgnoreCase(dto.getRecordVisibility()) ? "MANAGER" : "PROJECT");
        } else {
            dto.setRecordVisibility(null);
        }
    }

    @Override
    public List<projectPeriodPlanDTO> getProjectPeriodPlans(Long projId, String startDate, String endDate) {
        List<projectPeriodPlanDTO> items = projectDao.selectProjectPeriodPlans(projId, startDate, endDate);
        for (projectPeriodPlanDTO item : items) {
            item.setEditorUserIds(projectDao.selectProjectPlanEditorUserIds(item.getProjId(), "PERIOD_PLAN", item.getPeriodPlanId()));
        }
        return items;
    }

    @Override
    public projectPeriodPlanDTO getProjectPeriodPlan(Long periodPlanId) {
        projectPeriodPlanDTO item = projectDao.selectProjectPeriodPlanById(periodPlanId);
        if (item != null) item.setEditorUserIds(projectDao.selectProjectPlanEditorUserIds(item.getProjId(), "PERIOD_PLAN", item.getPeriodPlanId()));
        return item;
    }

    @Override
    @Transactional
    public projectPeriodPlanDTO addProjectPeriodPlan(projectPeriodPlanDTO dto) {
        normalizePlanRecordSetting(dto);
        if (dto.getSortOrder() == null || dto.getSortOrder() < 1) {
            dto.setSortOrder(projectDao.selectNextProjectPeriodPlanSortOrder(dto.getProjId()));
        } else {
            projectDao.shiftProjectPeriodPlanSortOrdersForInsert(dto.getProjId(), dto.getSortOrder());
        }
        projectDao.insertProjectPeriodPlan(dto);
        if (dto.getDraftKey() != null && !dto.getDraftKey().isBlank()) {
            contentRecordService.activateDraft(dto.getDraftKey().trim(), "PERIOD_PLAN", dto.getPeriodPlanId(), dto.getCreatedBy());
        }
        return projectDao.selectProjectPeriodPlanById(dto.getPeriodPlanId());
    }

    @Override
    public boolean updateProjectPeriodPlan(projectPeriodPlanDTO dto) {
        normalizePlanRecordSetting(dto);
        return projectDao.updateProjectPeriodPlan(dto) > 0;
    }

    @Override
    @Transactional
    public boolean deleteProjectPeriodPlan(Long periodPlanId, Long projId) {
        projectPeriodPlanDTO current = projectDao.selectProjectPeriodPlanById(periodPlanId);
        if (current == null || !projId.equals(current.getProjId())) {
            return false;
        }
        projectDao.deleteProjectPlanEditors(projId, "PERIOD_PLAN", periodPlanId);
        int deleted = projectDao.deleteProjectPeriodPlan(periodPlanId, projId);
        if (deleted > 0) {
            projectDao.compactProjectPeriodPlanSortOrdersAfterDelete(projId, current.getSortOrder());
        }
        return deleted > 0;
    }

    @Override
    public int countTasksOutsidePeriodPlanRange(Long periodPlanId, String startDate, String endDate) {
        return 0;
    }

    @Override
    @Transactional
    public boolean reorderProjectPeriodPlans(Long projId, List<Long> periodPlanIds) {
        if (periodPlanIds == null) return false;
        List<projectPeriodPlanDTO> current = projectDao.selectProjectPeriodPlans(projId, null, null);
        if (current.size() != periodPlanIds.size()) return false;
        java.util.Set<Long> expected = new java.util.HashSet<>();
        for (projectPeriodPlanDTO periodPlan : current) expected.add(periodPlan.getPeriodPlanId());
        if (periodPlanIds.stream().anyMatch(id -> id == null || !expected.remove(id)) || !expected.isEmpty()) {
            return false;
        }
        for (int i = 0; i < periodPlanIds.size(); i++) {
            projectDao.updateProjectPeriodPlanSortOrder(periodPlanIds.get(i), projId, i + 1);
        }
        return true;
    }

    @Override
    public List<projectTimePlanDTO> getProjectTimePlans(
            Long projId, String startDate, String endDate, Long taskId) {
        List<projectTimePlanDTO> items = projectDao.selectProjectTimePlans(projId, startDate, endDate, taskId);
        for (projectTimePlanDTO item : items) {
            item.setEditorUserIds(projectDao.selectProjectPlanEditorUserIds(item.getProjId(), "TIME_PLAN", item.getTimePlanId()));
        }
        return items;
    }

    @Override
    public projectTimePlanDTO getProjectTimePlan(Long timePlanId) {
        projectTimePlanDTO item = projectDao.selectProjectTimePlanById(timePlanId);
        if (item != null) item.setEditorUserIds(projectDao.selectProjectPlanEditorUserIds(item.getProjId(), "TIME_PLAN", item.getTimePlanId()));
        return item;
    }

    @Override
    @Transactional
    public projectTimePlanDTO addProjectTimePlan(projectTimePlanDTO dto) {
        normalizePlanRecordSetting(dto);
        if (dto.getSortOrder() == null || dto.getSortOrder() < 1) {
            dto.setSortOrder(projectDao.selectNextProjectTimePlanSortOrder(dto.getProjId(), dto.getStartDate()));
        } else {
            projectDao.shiftProjectTimePlanSortOrdersForInsert(
                    dto.getProjId(), dto.getStartDate(), dto.getSortOrder());
        }
        if (projectDao.insertProjectTimePlan(dto) <= 0) {
            throw new IllegalStateException("시간별 계획 등록에 실패했습니다.");
        }
        if (dto.getDraftKey() != null && !dto.getDraftKey().isBlank()) {
            contentRecordService.activateDraft(
                    dto.getDraftKey().trim(),
                    "TIME_PLAN",
                    dto.getTimePlanId(),
                    dto.getCreatedBy()
            );
        }
        return projectDao.selectProjectTimePlanById(dto.getTimePlanId());
    }

    @Override
    public boolean updateProjectTimePlan(projectTimePlanDTO dto) {
        normalizePlanRecordSetting(dto);
        return projectDao.updateProjectTimePlan(dto) > 0;
    }

    @Override
    @Transactional
    public boolean deleteProjectTimePlan(Long timePlanId, Long projId) {
        projectTimePlanDTO current = projectDao.selectProjectTimePlanById(timePlanId);
        if (current == null || !projId.equals(current.getProjId())) return false;
        projectDao.deleteProjectPlanEditors(projId, "TIME_PLAN", timePlanId);
        int deleted = projectDao.deleteProjectTimePlan(timePlanId, projId);
        if (deleted > 0) {
            projectDao.compactProjectTimePlanSortOrdersAfterDelete(
                    projId, current.getStartDate(), current.getSortOrder());
        }
        return deleted > 0;
    }

    @Override
    @Transactional
    public boolean reorderProjectTimePlans(Long projId, String planDate, List<Long> timePlanIds) {
        if (timePlanIds == null || planDate == null || planDate.isBlank()) return false;
        List<projectTimePlanDTO> current = projectDao.selectProjectTimePlans(projId, planDate, planDate, null);
        if (current.size() != timePlanIds.size()) return false;
        java.util.Set<Long> expected = new java.util.HashSet<>();
        for (projectTimePlanDTO plan : current) expected.add(plan.getTimePlanId());
        if (timePlanIds.stream().anyMatch(id -> id == null || !expected.remove(id)) || !expected.isEmpty()) {
            return false;
        }
        for (int i = 0; i < timePlanIds.size(); i++) {
            projectDao.updateProjectTimePlanSortOrder(timePlanIds.get(i), projId, i + 1);
        }
        return true;
    }

    @Override
    public List<projectWeeklyPlanDTO> getProjectWeeklyPlans(
            Long projId, Integer dayOfWeek, String activeYn, Long taskId) {
        List<projectWeeklyPlanDTO> items = projectDao.selectProjectWeeklyPlans(projId, dayOfWeek, activeYn, taskId);
        for (projectWeeklyPlanDTO item : items) {
            item.setEditorUserIds(projectDao.selectProjectPlanEditorUserIds(item.getProjId(), "WEEKLY_PLAN", item.getWeeklyPlanId()));
        }
        return items;
    }

    @Override
    public projectWeeklyPlanDTO getProjectWeeklyPlan(Long weeklyPlanId) {
        projectWeeklyPlanDTO item = projectDao.selectProjectWeeklyPlanById(weeklyPlanId);
        if (item != null) item.setEditorUserIds(projectDao.selectProjectPlanEditorUserIds(item.getProjId(), "WEEKLY_PLAN", item.getWeeklyPlanId()));
        return item;
    }

    @Override
    @Transactional
    public projectWeeklyPlanDTO addProjectWeeklyPlan(projectWeeklyPlanDTO dto) {
        normalizePlanRecordSetting(dto);
        if (dto.getSortOrder() == null || dto.getSortOrder() < 1) {
            dto.setSortOrder(projectDao.selectNextProjectWeeklyPlanSortOrder(dto.getProjId(), dto.getDayOfWeek()));
        } else {
            projectDao.shiftProjectWeeklyPlanSortOrdersForInsert(
                    dto.getProjId(), dto.getDayOfWeek(), dto.getSortOrder());
        }
        if (projectDao.insertProjectWeeklyPlan(dto) <= 0) {
            throw new IllegalStateException("주간 계획 등록에 실패했습니다.");
        }
        if (dto.getDraftKey() != null && !dto.getDraftKey().isBlank()) {
            contentRecordService.activateDraft(
                    dto.getDraftKey().trim(),
                    "WEEKLY_PLAN",
                    dto.getWeeklyPlanId(),
                    dto.getCreatedBy()
            );
        }
        return projectDao.selectProjectWeeklyPlanById(dto.getWeeklyPlanId());
    }

    @Override
    public boolean updateProjectWeeklyPlan(projectWeeklyPlanDTO dto) {
        normalizePlanRecordSetting(dto);
        return projectDao.updateProjectWeeklyPlan(dto) > 0;
    }

    @Override
    @Transactional
    public boolean deleteProjectWeeklyPlan(Long weeklyPlanId, Long projId) {
        projectWeeklyPlanDTO current = projectDao.selectProjectWeeklyPlanById(weeklyPlanId);
        if (current == null || !projId.equals(current.getProjId())) return false;
        projectDao.deleteProjectPlanEditors(projId, "WEEKLY_PLAN", weeklyPlanId);
        int deleted = projectDao.deleteProjectWeeklyPlan(weeklyPlanId, projId);
        if (deleted > 0) {
            projectDao.compactProjectWeeklyPlanSortOrdersAfterDelete(
                    projId, current.getDayOfWeek(), current.getSortOrder());
        }
        return deleted > 0;
    }

    @Override
    @Transactional
    public boolean reorderProjectWeeklyPlans(Long projId, Integer dayOfWeek, List<Long> weeklyPlanIds) {
        if (weeklyPlanIds == null || dayOfWeek == null) return false;
        List<projectWeeklyPlanDTO> current = projectDao.selectProjectWeeklyPlans(projId, dayOfWeek, null, null);
        if (current.size() != weeklyPlanIds.size()) return false;
        java.util.Set<Long> expected = new java.util.HashSet<>();
        for (projectWeeklyPlanDTO plan : current) expected.add(plan.getWeeklyPlanId());
        if (weeklyPlanIds.stream().anyMatch(id -> id == null || !expected.remove(id)) || !expected.isEmpty()) {
            return false;
        }
        for (int i = 0; i < weeklyPlanIds.size(); i++) {
            projectDao.updateProjectWeeklyPlanSortOrder(weeklyPlanIds.get(i), projId, i + 1);
        }
        return true;
    }

    @Override
    public List<Long> getProjectPlanEditorUserIds(Long projId, String planType, Long planId) {
        if (projId == null || planId == null || planType == null) return List.of();
        return projectDao.selectProjectPlanEditorUserIds(projId, planType.trim().toUpperCase(), planId);
    }

    @Override
    public boolean isProjectPlanEditor(Long projId, String planType, Long planId, Long userId) {
        if (projId == null || planId == null || userId == null || planType == null) return false;
        return projectDao.countProjectPlanEditor(projId, planType.trim().toUpperCase(), planId, userId) > 0;
    }

    @Override
    @Transactional
    public void replaceProjectPlanEditors(Long projId, String planType, Long planId, List<Long> userIds, Long grantedBy) {
        if (projId == null || planId == null || planType == null) return;
        String normalizedType = planType.trim().toUpperCase();
        projectDao.deleteProjectPlanEditors(projId, normalizedType, planId);
        if (userIds == null || userIds.isEmpty()) return;
        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>(userIds);
        for (Long userId : uniqueIds) {
            if (userId == null) continue;
            if (projectDao.countProjectMemberForPlanPermission(projId, userId) <= 0) continue;
            projectDao.insertProjectPlanEditor(projId, normalizedType, planId, userId, grantedBy);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public projectPlanFeatureDTO getProjectPlanFeature(Long projId) {
        return projectDao.selectProjectPlanFeature(projId);
    }

    @Override
    @Transactional
    public projectPlanFeatureDTO getOrCreateProjectPlanFeature(Long projId) {
        projectPlanFeatureDTO current = projectDao.selectProjectPlanFeature(projId);
        if (current == null) {
            projectDao.insertDefaultProjectPlanFeature(projId);
            current = projectDao.selectProjectPlanFeature(projId);
        }
        return current;
    }

    @Override
    @Transactional
    public projectPlanFeatureDTO updateProjectPlanFeature(projectPlanFeatureDTO dto) {
        if (dto == null || dto.getProjId() == null) {
            throw new IllegalArgumentException("프로젝트 ID가 필요합니다.");
        }
        projectDao.insertDefaultProjectPlanFeature(dto.getProjId());
        projectDao.updateProjectPlanFeature(dto);
        return projectDao.selectProjectPlanFeature(dto.getProjId());
    }


    @Override
    @Transactional
    public projectPlanFeatureDTO removeProjectPlanFeature(Long projId, String type) {
        if (projId == null) throw new IllegalArgumentException("프로젝트 ID가 필요합니다.");
        String normalizedType = type == null ? "" : type.trim().toUpperCase();
        projectDao.insertDefaultProjectPlanFeature(projId);
        switch (normalizedType) {
            case "GANTT" -> projectDao.deleteAllProjectPeriodPlans(projId);
            case "TIME_SCHEDULE" -> projectDao.deleteAllProjectTimePlans(projId);
            case "WEEKLY" -> projectDao.deleteAllProjectWeeklyPlans(projId);
            default -> throw new IllegalArgumentException("계획표 유형이 올바르지 않습니다.");
        }
        projectDao.disableProjectPlanFeature(projId, normalizedType);
        return projectDao.selectProjectPlanFeature(projId);
    }


    @Override
    public projectPlanCalendarPrefDTO getProjectPlanCalendarPref(Long userId, Long projId) {
        projectPlanCalendarPrefDTO dto = projectDao.selectProjectPlanCalendarPref(userId, projId);
        if (dto == null) {
            dto = new projectPlanCalendarPrefDTO();
            dto.setUserId(userId); dto.setProjId(projId);
            dto.setShowPeriodYn("Y"); dto.setShowTimeYn("Y"); dto.setShowWeeklyYn("Y");
        }
        return dto;
    }

    @Override
    @Transactional
    public projectPlanCalendarPrefDTO saveProjectPlanCalendarPref(projectPlanCalendarPrefDTO dto) {
        projectDao.mergeProjectPlanCalendarPref(dto);
        return getProjectPlanCalendarPref(dto.getUserId(), dto.getProjId());
    }

    private Object mapValue(Map<String, Object> map, String key) {
        if (map == null) return null;
        if (map.containsKey(key)) return map.get(key);
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (entry.getKey() != null && key.equalsIgnoreCase(entry.getKey())) return entry.getValue();
        }
        return null;
    }

    private String textValue(Map<String, Object> map, String key) {
        Object value = mapValue(map, key);
        return value == null ? "" : String.valueOf(value);
    }

    private Long longValue(Map<String, Object> map, String key) { return toLongValue(mapValue(map, key)); }
    private Long toLongValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try { return Long.valueOf(String.valueOf(value)); } catch (Exception e) { return null; }
    }
    private Integer intValue(Map<String, Object> map, String key) {
        Object value = mapValue(map, key);
        if (value instanceof Number) return ((Number) value).intValue();
        try { return value == null ? null : Integer.valueOf(String.valueOf(value)); } catch (Exception e) { return null; }
    }
}
