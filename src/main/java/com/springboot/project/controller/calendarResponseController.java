package com.springboot.project.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody; // 추가 필요
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<String> registerEvent(@RequestBody calendarResponseDTO dto, HttpSession session) {
        // 1. 세션에서 로그인한 유저 정보 가져오기
        usersDto loginUser = (usersDto) session.getAttribute("user");
        
        if (loginUser == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        // 2. DTO에 사용자 ID와 프로젝트 ID 세팅
        dto.setUserId(loginUser.getUserId());
        dto.setProjId(2L); 
        
        // 3. 서비스 호출하여 저장
        calendarService.registerEvent(dto);
        
        return ResponseEntity.ok("일정이 성공적으로 등록되었습니다.");
    }
}