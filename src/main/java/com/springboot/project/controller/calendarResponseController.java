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

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class calendarResponseController {

    private final IcalendarResponseService calendarService;

    // 1. 달력 데이터 조회 API
    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyEvents(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "types") List<String> types,
            @RequestParam(value = "startDate") String startDate,
            @RequestParam(value = "endDate") String endDate,
            HttpSession session
        ) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        
        if (userId == null && loginUser != null) {
            userId = loginUser.getUserId();
        }

        List<calendarResponseDTO> list = calendarService.getMonthlyCalendar(userId, projId, wsId, types, startDate, endDate);
        return ResponseEntity.ok(list);
    }

    // 2. 공휴일 수동 업데이트 API
    @GetMapping("/init-holidays")
    public ResponseEntity<String> initHolidays(@RequestParam("year") String year) {
        calendarService.fetchAndSaveHolidays(year);
        return ResponseEntity.ok(year + "년 공휴일 데이터 세팅 요청 완료");
    }
    
    // 3. 일정 등록 API (권한 검증 포함)
    @PostMapping("/register")
    @ResponseBody
    public String registerEvent(@RequestBody calendarResponseDTO dto, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");

        if (loginUser != null) {
            dto.setUserId(loginUser.getUserId());
            
            // WS 일정일 경우 관리자 권한 체크
            if ("WS".equals(dto.getItemType())) {
                String role = calendarService.checkUserRole(dto.getWsId(), loginUser.getUserId());
                if (!"ADMIN".equals(role)) {
                    return "FAIL: NO_ADMIN_PRIVILEGE";
                }
            }

            try {
                calendarService.registerEvent(dto);
                return "SUCCESS";
            } catch (Exception e) {
                e.printStackTrace();
                return "FAIL: SERVER_ERROR";
            }
        }
        return "FAIL: LOGIN_REQUIRED"; 
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
            HttpSession session) {
        
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");

        // 💡 로그 추가: 무엇이 넘어오는지 확인
        System.out.println("삭제 요청 - eventId: " + eventId + ", recurGroupId: " + recurGroupId + ", deleteSeries: " + deleteSeries);

        Map<String, Object> params = new HashMap<>();
        params.put("eventId", eventId);
        // null 체크 후 put
        params.put("recurGroupId", (recurGroupId != null && !recurGroupId.equals("undefined")) ? recurGroupId : null);
        params.put("deleteSeries", deleteSeries);
        params.put("userId", loginUser.getUserId());

        try {
            if (calendarService.deleteEvent(params)) {
                return ResponseEntity.ok("삭제 성공");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
            }
        } catch (Exception e) {
            e.printStackTrace(); // 💡 여기서 찍히는 로그를 알려주세요!
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 에러 발생");
        }
    }

    // 6. 날짜 수정
    @PostMapping("/update-date")
    public ResponseEntity<String> updateEventDate(@RequestBody Map<String, Object> params) {
        boolean isUpdated = calendarService.updateEventDate(params);
        return isUpdated ? ResponseEntity.ok("Success") : ResponseEntity.status(500).body("Fail");
    }

    // 7. 일정 수정 API (권한 검증 포함)
    @PostMapping("/update-all")
    public ResponseEntity<String> updateEventAll(@RequestBody Map<String, Object> params, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Fail: Login required");

        params.put("userId", loginUser.getUserId());
        
        String itemType = (String) params.get("itemType");
        if ("WS".equals(itemType)) {
            Object wsIdObj = params.get("wsId");
            Long wsId = (wsIdObj instanceof Number) ? ((Number) wsIdObj).longValue() : null;
            
            if (wsId != null) {
                String role = calendarService.checkUserRole(wsId, loginUser.getUserId());
                if (!"ADMIN".equals(role)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Fail: No Admin Privilege");
                }
            }
        }

        boolean isUpdated = calendarService.updateEventAll(params);
        return isUpdated ? ResponseEntity.ok("Success") : ResponseEntity.status(500).body("Fail");
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
}