package com.springboot.project.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.springboot.project.dao.IcalendarResponseDAO;
import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.service.IcalendarResponseService;
import com.springboot.project.util.LunarUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class calendarResponseServiceImpl implements IcalendarResponseService {
    
    private final IcalendarResponseDAO calendarDao;
    
    // 공공데이터포털 인증키 (기존과 동일)
    private final String SERVICE_KEY = "29022db18fa77c8865fb004f0087d36ea659013b96e1d9467b4faa4847ba6e94";

 // calendarResponseServiceImpl.java 수정

    @Override
    public List<calendarResponseDTO> getMonthlyCalendar(Long userId, Long projId, Long wsId, List<String> types, String startDate, String endDate) {
        // 1. DB에서 해당 기간의 일정 가져오기 (음력은 날짜 상관없이 가져오도록 XML에서 처리됨)
        List<calendarResponseDTO> eventList = calendarDao.getMonthlyEvents(userId, wsId, projId, types, startDate, endDate);

        // 2. 현재 화면에서 보고 있는 '연도' 추출 (예: "2027-06-01" -> 2027)
        int viewYear = Integer.parseInt(startDate.substring(0, 4));

        for (calendarResponseDTO event : eventList) {
            // 음력 설정이 'Y'인 일정만 처리
            if ("Y".equalsIgnoreCase(event.getIsLunar())) {
                if (event.getLunarMonth() != null && event.getLunarDay() != null) {
                    try {
                        // ⭐ 수정된 LunarUtil을 사용하여 현재 연도(viewYear)의 양력 날짜 계산
                        String solarDate = LunarUtil.convertLunarToSolar(viewYear, event.getLunarMonth(), event.getLunarDay());
                        
                        // FullCalendar 렌더링을 위해 DTO의 시작/종료 날짜를 계산된 양력 날짜로 업데이트
                        event.setStartDt(solarDate + " 00:00:00"); 
                        event.setEndDt(solarDate + " 23:59:59");
                        event.setAllDay("Y"); // 음력 일정은 통상 하루 종일로 처리
                        
                        // 디버깅용 로그 (정상 범위인지 확인)
                        System.out.println("음력 변환 완료: " + event.getTitle() + " -> " + solarDate);
                    } catch (Exception e) {
                        System.err.println("음력 변환 중 오류 발생 (ID: " + event.getId() + "): " + e.getMessage());
                    }
                }
            }
        }
        
        return eventList;
    }
    @Override
    public void fetchAndSaveHolidays(String year) {
        RestTemplate restTemplate = new RestTemplate();
        
        for (int month = 1; month <= 12; month++) {
            String monthStr = String.format("%02d", month);
            String url = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo"
                    + "?serviceKey=" + SERVICE_KEY
                    + "&solYear=" + year
                    + "&solMonth=" + monthStr
                    + "&_type=json";

            try {
                // 1. API 호출
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                
                // 2. 계층별 데이터 추출 (response -> body -> items -> item)
                Map<String, Object> resMap = (Map<String, Object>) response.get("response");
                Map<String, Object> body = (Map<String, Object>) resMap.get("body");
                
                // 해당 월에 공휴일이 없으면 넘어감
                if (body == null || (int) body.get("totalCount") == 0) continue;

                Map<String, Object> itemsMap = (Map<String, Object>) body.get("items");
                Object itemObj = itemsMap.get("item");

                // 3. 공휴일 데이터가 1개인 경우 Map, 여러 개인 경우 List로 들어옴
                if (itemObj instanceof List) {
                    List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemObj;
                    for (Map<String, Object> item : itemList) {
                        saveToDb(item);
                    }
                } else if (itemObj instanceof Map) {
                    saveToDb((Map<String, Object>) itemObj);
                }

            } catch (Exception e) {
                System.out.println(month + "월 데이터 처리 중 오류: " + e.getMessage());
            }
        }
    }

    // DB 저장용 private 메서드 (구현체 하단에 추가)
    private void saveToDb(Map<String, Object> item) {
        String locdate = String.valueOf(item.get("locdate")); // 20260301 형식
        String dateName = (String) item.get("dateName");     // 삼일절 등

        // 중복 체크 후 저장 (이미 DB에 있으면 넣지 않음)
        if (calendarDao.checkHolidayExists(locdate) == 0) {
            calendarResponseDTO dto = new calendarResponseDTO();
            dto.setStartDt(locdate); 
            dto.setTitle(dateName);
            
            calendarDao.insertHoliday(dto);
            System.out.println("저장 완료: " + locdate + " - " + dateName);
        }
    }
    @Override
    @Transactional
    public void registerEvent(calendarResponseDTO dto) {
        if ("Y".equals(dto.getIsRecurring())) {
            String recurGroupId = java.util.UUID.randomUUID().toString();
            dto.setRecurGroupId(recurGroupId);
        }

        if ("Y".equals(dto.getIsLunar())) {
            try {
                // startDt: "2026-06-16T09:00" -> 2026, 06, 16 추출
                String[] dateParts = dto.getStartDt().split("T")[0].split("-");
                int m = Integer.parseInt(dateParts[1]); // 사용자가 선택한 월 (6)
                int d = Integer.parseInt(dateParts[2]); // 사용자가 선택한 일 (16)

                // ⭐ 중요: LunarUtil을 쓰지 않고 바로 세팅합니다.
                // 화면에서 고른 숫자 그 자체가 음력 생일이니까요!
                dto.setLunarMonth(m);
                dto.setLunarDay(d);
                
                System.out.println("음력 일정 저장 (입력값 그대로): " + m + "월 " + d + "일");
            } catch (Exception e) {
                System.err.println("음력 정보 추출 중 오류: " + e.getMessage());
            }
        }
        
        calendarDao.registerEvent(dto);
    }
    
 // 1. 인터페이스 규격에 맞춰 파라미터를 Map으로 변경 (@Override 에러 해결)
    @Override
    @Transactional
    public boolean deleteEvent(Map<String, Object> params) {
        boolean isDeleted = false;
        try {
            // [체크] Map 안에 데이터가 정확한 키로 들어있는지 다시 확인
            System.out.println("===> 서비스 실행 - Map 내부: " + params.toString());
            
            // 💡 DAO 호출
            int result = calendarDao.deleteEvent(params); 

            if (result > 0) isDeleted = true;
        } catch (Exception e) {
            // 🔥 여기서 터지는 에러 메시지를 확인해야 합니다!
            System.err.println("===> 에러 상세: " + e.getMessage());
            e.printStackTrace();
        }
        return isDeleted;
    }
    
    @Override
    public boolean updateEventDate(Map<String, Object> params) {
        // DAO를 호출하여 업데이트 실행 (리턴 타입 int를 boolean으로 변환)
        return calendarDao.updateEventDate(params) > 0;
    }
    @Override
    @Transactional
    public boolean updateEventAll(Map<String, Object> params) {
        // 음력 체크 여부 확인
        if ("Y".equals(params.get("isLunar"))) {
            String startDt = (String) params.get("startDt"); // "2026-06-16T09:00"
            String[] dateParts = startDt.split("T")[0].split("-");
            
            // 화면 숫자를 그대로 음력 월/일로 세팅
            params.put("lunarMonth", Integer.parseInt(dateParts[1]));
            params.put("lunarDay", Integer.parseInt(dateParts[2]));
        }
        return calendarDao.updateEventAll(params) > 0;
    }

    @Override
    @Transactional
    public boolean updateRecurringEvents(Map<String, Object> params) {
        // 반복 수정 시에도 동일하게 처리
        if ("Y".equals(params.get("isLunar"))) {
            String startDt = (String) params.get("startDt");
            String[] dateParts = startDt.split("T")[0].split("-");
            
            params.put("lunarMonth", Integer.parseInt(dateParts[1]));
            params.put("lunarDay", Integer.parseInt(dateParts[2]));
        }
        return calendarDao.updateRecurringEvents(params) > 0;
    }


    @Override
    public List<Map<String, Object>> getSharedEvents(Long userId) {
        // DAO를 호출하여 팀 공유 일정을 가져옵니다.
        return calendarDao.getSharedEvents(userId);
    }

    @Override
    @Transactional
    public boolean leaveProject(Long projId, Long userId) {
        // 프로젝트 멤버 테이블에서 삭제
        int result = calendarDao.leaveProject(projId, userId);
        return result > 0;
    }
    
    @Override
    public List<Map<String, Object>> getWorkspacesByUserId(long userId) { // int -> long
        return calendarDao.selectUserWorkspaces(userId);
    }

    @Override
    public List<Map<String, Object>> getProjectsByUserId(long userId) { // int -> long
        return calendarDao.selectUserProjects(userId);
    }
}