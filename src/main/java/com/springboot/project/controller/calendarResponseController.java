package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody; // 추가 필요
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.dto.usersDto; // 추가 필요
import com.springboot.project.service.IcalendarResponseService;

import jakarta.servlet.http.HttpSession; // 추가 필요
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class calendarResponseController {

    private final IcalendarResponseService calendarService;

    // 1. 달력 데이터 조회 API (파라미터 4개로 업데이트)
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
        // 💡 핵심 보수: 파라미터로 안 넘어오면 세션에서 강제로 주입 (방어 코드)
        usersDto loginUser = (usersDto) session.getAttribute("user");
        
        if (userId == null && loginUser != null) {
            userId = loginUser.getUserId();
            System.out.println("DEBUG: 파라미터에 userId가 없어 세션에서 주입함 -> " + userId);
        }
        
        // 이래도 null이면 조회가 안 되므로 로그 출력
        if (userId == null) {
        	System.out.println("DEBUG: 세션이 없어서 테스트용 ID 1을 강제 할당합니다.");
            // userId = 1L; // 💡 세션 잡히기 전까지는 이렇게 해서 화면에 나오는지 먼저 보세요!
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
    
 // 3. 일정 등록 API 보정
    @PostMapping("/register")
    @ResponseBody
    public String registerEvent(@RequestBody calendarResponseDTO dto, HttpSession session) {
        // 세션 키값이 "user"가 맞는지 확인이 필요합니다.
        usersDto loginUser = (usersDto) session.getAttribute("user");

        // 디버깅 로그: 어떤 데이터가 들어오는지 확인 (DTO에 toString()이 구현되어 있어야 함)
        System.out.println("DEBUG: 등록 요청 데이터 -> " + dto.toString());

        if (loginUser != null) {
            dto.setUserId(loginUser.getUserId());
            try {
                calendarService.registerEvent(dto);
                return "SUCCESS";
            } catch (Exception e) {
                e.printStackTrace();
                return "FAIL: SERVER_ERROR";
            }
        } else {
            // 💡 팁: 개발 단계에서는 강제 주입을 통해 로직을 먼저 검증해보세요.
            // dto.setUserId(1L); 
            // calendarService.registerEvent(dto);
            // return "SUCCESS (FORCED)";
            
            System.out.println("DEBUG: 세션 없음 - 등록 실패");
            return "FAIL: LOGIN_REQUIRED"; 
        }
    }
    
 // 팀 공유 일정 조회 (로그인한 유저 기준)
    @GetMapping("/shared-events")
    public List<Map<String, Object>> getSharedEvents(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user"); // "user" -> "loginUser"
        if (user == null) return new ArrayList<>();
        return calendarService.getSharedEvents(user.getUserId());
    }
    
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteEvent(
            @RequestParam("eventId") int eventId,
            @RequestParam(value = "recurGroupId", required = false) String recurGroupId,
            @RequestParam(value = "deleteSeries", defaultValue = "N") String deleteSeries,
            HttpSession session) {
        
        // 1번 포인트: 컨트롤러가 요청을 받았는지 확인
        System.out.println("===> [컨트롤러 진입] eventId: " + eventId + ", deleteSeries: " + deleteSeries);
        
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            System.out.println("===> [인증 실패] 세션에 유저 정보 없음");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        // 서비스에 보낼 파라미터 조립
        Map<String, Object> params = new HashMap<>();
        params.put("eventId", eventId);
        params.put("recurGroupId", recurGroupId);
        params.put("deleteSeries", deleteSeries);
        params.put("userId", loginUser.getUserId());

        // 2번 포인트: 서비스 호출 직전 데이터 확인
        System.out.println("===> [서비스 호출 직전] params: " + params);

        if (calendarService.deleteEvent(params)) {
            return ResponseEntity.ok("삭제 성공");
        } else {
            // 3번 포인트: 서비스에서 false를 리턴한 경우
            System.out.println("===> [삭제 실패] 서비스에서 false 반환됨");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
        }
    }
    @PostMapping("/update-date")
    public ResponseEntity<String> updateEventDate(@RequestBody Map<String, Object> params) {
        // 프론트에서 보낸 id, startDt, endDt를 받음
        boolean isUpdated = calendarService.updateEventDate(params);
        return isUpdated ? ResponseEntity.ok("Success") : ResponseEntity.status(500).body("Fail");
    }
    @PostMapping("/update-all")
    public ResponseEntity<String> updateEventAll(@RequestBody Map<String, Object> params, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Fail: Login required");

        // 💡 보안을 위해 세션의 userId를 params에 강제 주입
        params.put("userId", loginUser.getUserId());

        boolean isUpdated = calendarService.updateEventAll(params);
        return isUpdated ? ResponseEntity.ok("Success") : ResponseEntity.status(500).body("Fail");
    }
    
    // 프로젝트 나가기
    @PostMapping("/leave")
    public String leaveProject(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user"); // "user" -> "loginUser"
        if (user == null) return "로그인이 필요합니다.";

        boolean isLeaved = calendarService.leaveProject(projId, user.getUserId());
        return isLeaved ? "SUCCESS" : "FAIL";
    }
    
 // CalendarResponseController.java

    @GetMapping("/user-spaces")
    public ResponseEntity<?> getUserSpaces(HttpSession session) {
        // 💡 어제 usersController와 맞춘 세션 키값 "user" 사용
        usersDto loginUser = (usersDto) session.getAttribute("user");
        
        if (loginUser == null) {
            // 세션이 없으면 401 에러 반환
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        try {
            Map<String, Object> spaces = new HashMap<>();
            // 💡 DAO(Mapper)까지 연결된 서비스 메서드 호출
            spaces.put("workspaces", calendarService.getWorkspacesByUserId(loginUser.getUserId()));
            spaces.put("projects", calendarService.getProjectsByUserId(loginUser.getUserId()));
            
            return ResponseEntity.ok(spaces);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("데이터 로드 실패");
        }
    }
}