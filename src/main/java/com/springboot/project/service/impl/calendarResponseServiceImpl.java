package com.springboot.project.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.springboot.project.dao.IcalendarResponseDAO;
import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.service.IcalendarResponseService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class calendarResponseServiceImpl implements IcalendarResponseService {
    
    private final IcalendarResponseDAO calendarDao;
    
    // 공공데이터포털 인증키 (기존과 동일)
    private final String SERVICE_KEY = "29022db18fa77c8865fb004f0087d36ea659013b96e1d9467b4faa4847ba6e94";

    // [수정된 메서드] 파라미터에 userId를 추가하고 고정값을 제거합니다.
    @Override
    public List<calendarResponseDTO> getMonthlyCalendar(Long userId, Long projId, Long wsId, List<String> types, String startDate, String endDate) {
        
        return calendarDao.getMonthlyEvents(userId, wsId, projId, types, startDate, endDate);
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
            
            // 💡 여기서 dto.getAllDay() 값이 'Y'인지 체크해보세요.
            // 만약 프론트에서 반복 설정 시 allDay 체크값을 안 보냈다면 여기서 N으로 바뀔 수 있습니다.
            System.out.println("반복일정 등록 - allDay 여부: " + dto.getAllDay());
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
    public boolean updateEventAll(Map<String, Object> params) {
        // 제목, 시작일, 종료일, ID가 포함된 맵을 DAO로 전달
        return calendarDao.updateEventAll(params) > 0;
    }
    @Override
    @Transactional
    public boolean updateRecurringEvents(Map<String, Object> params) {
        // params에 recurGroupId가 반드시 포함되어야 함
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