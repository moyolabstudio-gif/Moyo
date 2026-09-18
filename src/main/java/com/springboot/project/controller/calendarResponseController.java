package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IcalendarResponseService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.util.LunarUtil;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class calendarResponseController {

    private final IcalendarResponseService calendarService;
    private final IprojectAuthorizationService projectAuthorizationService;

    // 1. 달력 데이터 조회 API
    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyEvents(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "friendId", required = false) Long friendId,
            @RequestParam(value = "types", required = false) List<String> types,
            @RequestParam(value = "startDate") String startDate,
            @RequestParam(value = "endDate") String endDate,
            HttpSession session
        ) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
        }

        // 달력 조회 권한은 요청 파라미터 userId가 아니라 로그인 세션 사용자로만 판단한다.
        // 클라이언트가 임의의 userId를 넘겨 다른 사용자의 개인/공유 달력을 조회하는 것을 방지한다.
        userId = loginUser.getUserId();

        List<calendarResponseDTO> list = calendarService.getMonthlyCalendar(
                userId, scope, friendId, projId, wsId, types, startDate, endDate);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/friend-birthdays")
    public ResponseEntity<?> getFriendBirthdays(
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            HttpSession session
        ) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            return ResponseEntity.ok(calendarService.getFriendBirthdays(loginUser.getUserId(), year, month));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


    @GetMapping("/group-member-birthdays")
    public ResponseEntity<?> getGroupMemberBirthdays(
            @RequestParam("wsId") Long wsId,
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            HttpSession session
        ) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            return ResponseEntity.ok(calendarService.getWorkspaceMemberBirthdays(loginUser.getUserId(), wsId, year, month));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/project-task-summary")
    public ResponseEntity<?> getProjectTaskSummary(
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session
        ) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(calendarService.getProjectTaskSummary(loginUser.getUserId(), projId));
    }

    // 2. 공휴일 수동 업데이트 API
    @PostMapping("/init-holidays")
    public ResponseEntity<String> initHolidays(@RequestParam("year") String year, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        if (!"ADMIN".equalsIgnoreCase(loginUser.getUserRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자만 공휴일 데이터를 갱신할 수 있습니다.");
        }
        String normalizedYear = year == null ? "" : year.trim();
        if (!normalizedYear.matches("\\d{4}")) {
            return ResponseEntity.badRequest().body("연도는 4자리 숫자로 입력해 주세요.");
        }
        int yearNumber = Integer.parseInt(normalizedYear);
        if (yearNumber < 2000 || yearNumber > 2100) {
            return ResponseEntity.badRequest().body("지원하는 연도 범위를 벗어났습니다.");
        }
        calendarService.fetchAndSaveHolidays(normalizedYear);
        return ResponseEntity.ok(normalizedYear + "년 공휴일 데이터 세팅 요청 완료");
    }
    
    // 3. 일정 등록 API (권한 검증 포함)
    @PostMapping("/register")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> registerEvent(@RequestBody calendarResponseDTO dto, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> result = new HashMap<>();

        if (loginUser == null) {
            result.put("success", false);
            result.put("message", "로그인이 필요합니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
        }

        dto.setUserId(loginUser.getUserId());

        if ("WS".equals(dto.getItemType())) {
            String role = calendarService.checkUserRole(dto.getWsId(), loginUser.getUserId());
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "그룹 일정 등록 권한이 없습니다.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
            }
        }

        if ("PROJ".equals(dto.getItemType())) {
            if (dto.getProjId() == null || !projectAuthorizationService.isProjectAdmin(dto.getProjId(), loginUser.getUserId())) {
                result.put("success", false);
                result.put("message", "프로젝트 일정 등록 권한이 없습니다.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
            }
        }

        try {
            calendarService.registerEvent(dto);
            result.put("success", true);
            result.put("eventId", dto.getId());
            result.put("message", "SUCCESS");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "일정 저장 중 서버 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    
    // 4. 팀 공유 일정 조회
    @GetMapping("/shared-events")
    public List<Map<String, Object>> getSharedEvents(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return new ArrayList<>();
        return calendarService.getSharedEvents(user.getUserId());
    }
    
    // 5. 일정 삭제 API
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteEvent(
            @RequestParam("eventId") int eventId,
            @RequestParam(value = "recurGroupId", required = false) String recurGroupId,
            @RequestParam(value = "deleteSeries", defaultValue = "N") String deleteSeries,
            @RequestParam(value = "deleteScope", defaultValue = "ONE") String deleteScope,
            @RequestParam(value = "occurrenceDate", required = false) String occurrenceDate,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");

        Map<String, Object> params = new HashMap<>();
        params.put("eventId", eventId);
        params.put("recurGroupId", (recurGroupId != null && !recurGroupId.equals("undefined") && !recurGroupId.isBlank()) ? recurGroupId : null);
        params.put("deleteSeries", deleteSeries);
        params.put("deleteScope", deleteScope);
        params.put("occurrenceDate", occurrenceDate);
        params.put("userId", loginUser.getUserId());

        if (!calendarService.canEditEvent((long) eventId, loginUser.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("일정을 삭제할 권한이 없습니다.");
        }

        try {
            if (calendarService.deleteEvent(params)) {
                if ("ONE".equalsIgnoreCase(deleteScope) && params.get("recurGroupId") != null) return ResponseEntity.ok("선택한 반복 일정만 삭제했습니다.");
                if ("FUTURE".equalsIgnoreCase(deleteScope)) return ResponseEntity.ok("선택한 날짜 이후 반복 일정을 삭제했습니다.");
                if ("ALL".equalsIgnoreCase(deleteScope) || "Y".equalsIgnoreCase(deleteSeries)) return ResponseEntity.ok("반복 일정 전체를 삭제했습니다.");
                return ResponseEntity.ok("삭제되었습니다.");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 에러 발생");
        }
    }

    // 6. 날짜 수정
    @PostMapping("/update-date")
    public ResponseEntity<String> updateEventDate(
            @RequestBody Map<String, Object> params,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Fail: Login required");
        }

        Long eventId = toLong(params.get("id"));
        if (eventId == null) {
            return ResponseEntity.badRequest().body("Fail: Invalid event id");
        }

        if (!calendarService.canEditEvent(eventId, loginUser.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Fail: No edit permission");
        }

        params.put("userId", loginUser.getUserId());

        boolean isUpdated = calendarService.updateEventDate(params);
        return isUpdated
                ? ResponseEntity.ok("Success")
                : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Fail");
    }

    // 7. 일정 수정 API (권한 검증 포함)
    @PostMapping("/update-all")
    public ResponseEntity<String> updateEventAll(
            @RequestBody Map<String, Object> params,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Fail: Login required");
        }

        Long eventId = toLong(params.get("id"));
        if (eventId == null) {
            return ResponseEntity.badRequest().body("Fail: Invalid event id");
        }

        if (!calendarService.canEditEvent(eventId, loginUser.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Fail: No edit permission");
        }

        params.put("userId", loginUser.getUserId());

        boolean isUpdated = calendarService.updateEventAll(params);
        return isUpdated
                ? ResponseEntity.ok("Success")
                : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Fail");
    }
    
    // 8. 프로젝트 나가기
    @PostMapping("/leave")
    public String leaveProject(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "로그인이 필요합니다.";
        boolean isLeaved = calendarService.leaveProject(projId, user.getUserId());
        return isLeaved ? "SUCCESS" : "FAIL";
    }
    
    // 9. 사용자 공간 조회
    @GetMapping("/user-spaces")
    public ResponseEntity<?> getUserSpaces(HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");

        try {
            Map<String, Object> spaces = new HashMap<>();
            spaces.put("workspaces", calendarService.getWorkspacesByUserId(loginUser.getUserId()));
            spaces.put("projects", calendarService.getProjectsByUserId(loginUser.getUserId()));
            return ResponseEntity.ok(spaces);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("데이터 로드 실패");
        }
    }
    // 10. 음력 날짜를 양력 표시 날짜로 변환
    @GetMapping("/lunar-to-solar")
    public ResponseEntity<Map<String, Object>> convertLunarToSolar(
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            @RequestParam("day") int day) {
        Map<String, Object> result = new HashMap<>();
        try {
            String solarDate = LunarUtil.convertLunarToSolar(year, month, day);
            result.put("success", true);
            result.put("solarDate", solarDate);
            result.put("year", year);
            result.put("month", month);
            result.put("day", day);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "음력 날짜를 양력으로 변환하지 못했습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }

    // 11. 일정 상세 조회 API
    @GetMapping("/detail")
    public ResponseEntity<?> getEventDetail(
            @RequestParam("eventId") Long eventId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        Map<String, Object> detail = calendarService.getEventDetailForView(eventId, loginUser.getUserId());
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("일정을 볼 권한이 없습니다.");
        }
        return ResponseEntity.ok(detail);
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();

        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

}