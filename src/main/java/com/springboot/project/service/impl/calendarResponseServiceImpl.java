package com.springboot.project.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.springboot.project.dao.IcalendarResponseDAO;
import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.service.IcalendarResponseService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class calendarResponseServiceImpl implements IcalendarResponseService {

    private final IcalendarResponseDAO calendarDao;
    
    // 공공데이터포털에서 발급받은 'Decoding' 인증키를 넣으세요.
    private final String SERVICE_KEY = "29022db18fa77c8865fb004f0087d36ea659013b96e1d9467b4faa4847ba6e94";

    @Override
    public List<calendarResponseDTO> getMonthlyCalendar(Long projId, String startDate, String endDate) {
        return calendarDao.getMonthlyCalendar(projId, startDate, endDate);
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
    public void registerEvent(calendarResponseDTO dto) {
        // [보안 점검] 이 유저가 해당 프로젝트의 멤버인지 확인하는 로직 추가 가능
        // SELECT COUNT(*) FROM PROJ_MEMBERS WHERE PROJ_ID = ? AND USER_ID = ?
        
        calendarDao.registerEvent(dto);
    }
}