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
        if (category == null || category.isBlank()) {
            category = "ETC";
        }
        category = category.trim().toUpperCase();

        String categoryDetail = dto.getProjCategoryDetail();
        if ("ETC".equals(category)) {
            categoryDetail = categoryDetail == null ? "" : categoryDetail.trim();
            if (categoryDetail.isEmpty()) {
                throw new IllegalArgumentException("기타 카테고리명을 입력해주세요.");
            }
            if (categoryDetail.length() > 30) {
                throw new IllegalArgumentException("기타 카테고리명은 30자 이내로 입력해주세요.");
            }
            dto.setProjCategoryDetail(categoryDetail);
        } else {
            dto.setProjCategoryDetail(null);
        }

        if (dto.getWsId() == null) {
            throw new IllegalArgumentException("워크스페이스 정보가 없습니다.");
        }

        if ("PERSONAL".equals(scope)) {
            dto.setLeaderId(userId);
            dto.setMemberIds(List.of(userId));
            dto.setAdminIds(List.of());
        } else if (dto.getLeaderId() == null) {
            dto.setLeaderId(userId);
        }

        dto.setProjScope(scope);
        dto.setProjCategory(category);
        dto.setProjType(category); // 기존 PROJ_TYPE 사용 코드와의 호환

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

        projectDao.insertProjectEvent(dto);
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


// 5. [기존 유지] 워크스페이스별 프로젝트 목록
    @Override
    public List<projectRequestDTO> getProjectsByWsId(Long wsId) {
        return projectDao.selectProjectsByWsId(wsId);
    }

    @Override
    public List<Map<String, Object>> getProjectListByWorkspaceId(Long wsId) {
        return projectDao.selectProjectListByWorkspaceId(wsId);
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
        // DAO에서 전체 리스트를 조회하여 반환
        return projectDao.getProjectTasks(projId);
    }
    @Override
    @Transactional
    public boolean addTask(Long projId, Long wsId, Long userId, String title, String startDate, String endDate, String status, String startTime, String endTime, String startTimeSlot, String endTimeSlot) {
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("projId", projId);
        paramMap.put("wsId", wsId);
        paramMap.put("userId", userId);
        paramMap.put("title", title);
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

        return projectDao.insertTask(paramMap) > 0;
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
        return projectDao.getTaskDetail(taskId);
    }
 // projectServiceImpl.java
    @Override
    @Transactional
    public boolean updateTask(Long taskId, String title, String startDate, String endDate, String status, Long userId, String startTime, String endTime, String startTimeSlot, String endTimeSlot) {
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("taskId", taskId);
        paramMap.put("title", title);
        paramMap.put("startDate", startDate);
        paramMap.put("endDate", endDate);
        paramMap.put("status", status);
        paramMap.put("userId", userId);
        String normalizedStartTimeSlot = normalizeTaskSlotFlag(startTimeSlot, "NONE");
        String normalizedEndTimeSlot = normalizeTaskSlotFlag(endTimeSlot, "NONE");
        String normalizedStartTime = normalizeTaskTime(startTime, normalizedStartTimeSlot, "09:00");
        String normalizedEndTime = normalizeTaskTime(endTime, normalizedEndTimeSlot, "18:00");

        paramMap.put("startTime", normalizedStartTime);
        paramMap.put("endTime", normalizedEndTime);
        paramMap.put("startTimeSlot", normalizedStartTimeSlot);
        paramMap.put("endTimeSlot", normalizedEndTimeSlot);

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
    @Override
    public List<Map<String, Object>> getProjectSchedules(Long projId) {
        return projectDao.selectProjectSchedules(projId);
    }
    
}