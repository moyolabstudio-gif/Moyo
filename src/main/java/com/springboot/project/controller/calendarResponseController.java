package com.springboot.project.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.service.IcalendarResponseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class calendarResponseController {

    private final IcalendarResponseService calendarService;

    // 1. 달력 데이터 조회 API
    // 프론트엔드 호출 예시: /api/calendar/monthly?projId=1&startDate=2026-03-01&endDate=2026-03-31
    @GetMapping("/monthly")
    public ResponseEntity<List<calendarResponseDTO>> getMonthlyEvents(
            @RequestParam("projId") Long projId,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        List<calendarResponseDTO> list = calendarService.getMonthlyCalendar(projId, startDate, endDate);
        return ResponseEntity.ok(list);
    }

    // 2. 공휴일 수동 업데이트 API (최초 1회 또는 연 단위 호출)
    // 호출 예시: /api/calendar/init-holidays?year=2026
    @GetMapping("/init-holidays")
    public ResponseEntity<String> initHolidays(@RequestParam("year") String year) {
        calendarService.fetchAndSaveHolidays(year);
        return ResponseEntity.ok(year + "년 공휴일 데이터 세팅 요청 완료 (서버 콘솔을 확인하세요)");
    }
}