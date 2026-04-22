package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

    // 1. 달력 데이터 조회 API
    @GetMapping("/monthly")
    public ResponseEntity<List<calendarResponseDTO>> getMonthlyEvents(
            @RequestParam("projId") Long projId,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        List<calendarResponseDTO> list = calendarService.getMonthlyCalendar(projId, startDate, endDate);
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

    // 프로젝트 나가기
    @PostMapping("/leave")
    public String leaveProject(@RequestParam("projId") Long projId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "로그인이 필요합니다.";

        boolean isLeaved = calendarService.leaveProject(projId, user.getUserId());
        return isLeaved ? "SUCCESS" : "FAIL";
    }
}