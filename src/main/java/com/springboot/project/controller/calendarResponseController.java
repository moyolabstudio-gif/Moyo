package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<calendarResponseDTO>> getMonthlyEvents(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "wsId", required = false) Long wsId, // 👈 wsId 추가 (필수 아님 설정)
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        // 💡 서비스 호출 시 wsId를 포함하여 4개의 인자를 전달합니다.
        List<calendarResponseDTO> list = calendarService.getMonthlyCalendar(projId, wsId, startDate, endDate);
        return ResponseEntity.ok(list);
    }

    // 2. 공휴일 수동 업데이트 API
    @GetMapping("/init-holidays")
    public ResponseEntity<String> initHolidays(@RequestParam("year") String year) {
        calendarService.fetchAndSaveHolidays(year);
        return ResponseEntity.ok(year + "년 공휴일 데이터 세팅 요청 완료");
    }
    
    // 3. 일정 등록 API
    @PostMapping("/register")
    @ResponseBody
    public String registerEvent(@RequestBody calendarResponseDTO dto, HttpSession session) {
        // 1. 세션에서 로그인한 유저 정보 가져오기
    	usersDto loginUser = (usersDto) session.getAttribute("user");

    	if (loginUser != null) {
    	    // 로그인한 사용자의 실제 ID를 세팅
    	    dto.setUserId(loginUser.getUserId());
    	    System.out.println("로그인 유저 ID 확인: " + loginUser.getUserId());
    	} else {
    	    // 로그인이 안 되어 있을 경우의 예외 처리 (인프라 보안 정책 같은 개념)
    	    return "로그인이 필요합니다."; 
    	}
    	

        calendarService.registerEvent(dto);
        return "일정이 등록되었습니다.";
    }
    
 // 팀 공유 일정 조회 (로그인한 유저 기준)
    @GetMapping("/shared-events")
    public List<Map<String, Object>> getSharedEvents(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return new ArrayList<>();

        return calendarService.getSharedEvents(user.getUserId());
    }
    
    @DeleteMapping("/delete/{eventId}")
    public ResponseEntity<String> deleteEvent(@PathVariable("eventId") int eventId) { // 👈 ("eventId") 추가
        if (calendarService.deleteEvent(eventId)) {
            return ResponseEntity.ok("삭제 성공");
        } else {
            return ResponseEntity.status(500).body("삭제 실패");
        }
    }
    @PostMapping("/update-date")
    public ResponseEntity<String> updateEventDate(@RequestBody Map<String, Object> params) {
        // 프론트에서 보낸 id, startDt, endDt를 받음
        boolean isUpdated = calendarService.updateEventDate(params);
        return isUpdated ? ResponseEntity.ok("Success") : ResponseEntity.status(500).body("Fail");
    }
    @PostMapping("/update-all")
    public ResponseEntity<String> updateEventAll(@RequestBody Map<String, Object> params) {
        boolean isUpdated = calendarService.updateEventAll(params); // 새로 만들어야 함
        return isUpdated ? ResponseEntity.ok("Success") : ResponseEntity.status(500).body("Fail");
    }
    
    // 프로젝트 나가기
    @PostMapping("/leave")
    public String leaveProject(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "로그인이 필요합니다.";

        boolean isLeaved = calendarService.leaveProject(projId, user.getUserId());
        return isLeaved ? "SUCCESS" : "FAIL";
    }
}