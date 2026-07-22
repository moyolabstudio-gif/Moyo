package com.springboot.project.service.impl;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.springboot.project.dao.IcalendarResponseDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.service.IcalendarResponseService;
import com.springboot.project.service.IcontentShareService;
import com.springboot.project.util.LunarUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class calendarResponseServiceImpl implements IcalendarResponseService {
    
    private final IcalendarResponseDAO calendarDao;
    private final IcontentShareService contentShareService;
    private final IuserNoticeDAO userNoticeDAO;
    
    // 공공데이터포털 인증키 (기존과 동일)
    private final String SERVICE_KEY = "29022db18fa77c8865fb004f0087d36ea659013b96e1d9467b4faa4847ba6e94";

 // calendarResponseServiceImpl.java 수정

    private void ensureCalendarEventTypeColumn() {
        try {
            calendarDao.ensureCalendarEventTypeColumn();
        } catch (Exception e) {
            System.err.println("EVENT_TYPE 컬럼 확인/생성 중 오류: " + e.getMessage());
        }
    }

    private void ensureCalendarAttendeeTable() {
        try {
            calendarDao.ensureCalendarAttendeeTable();
        } catch (Exception e) {
            System.err.println("EVENT_ATTENDEES 테이블 확인/생성 중 오류: " + e.getMessage());
        }
    }

    private Set<Long> syncEventAttendees(Long eventId, List<Long> attendeeUserIds) {
        Set<Long> added = new LinkedHashSet<>();
        if (eventId == null) return added;
        ensureCalendarAttendeeTable();

        Set<Long> before = new LinkedHashSet<>();
        try {
            List<Long> oldIds = calendarDao.selectEventAttendeeIds(eventId);
            if (oldIds != null) before.addAll(oldIds);
        } catch (Exception e) {
            // 테이블이 방금 생성된 경우 조회 실패가 나도 저장 흐름은 유지한다.
        }

        calendarDao.deleteEventAttendees(eventId);
        Set<Long> unique = new LinkedHashSet<>();
        if (attendeeUserIds != null) {
            for (Long userId : attendeeUserIds) {
                if (userId != null) unique.add(userId);
            }
        }
        for (Long userId : unique) {
            calendarDao.insertEventAttendee(eventId, userId);
            if (!before.contains(userId)) added.add(userId);
        }
        return added;
    }

    private void syncCalendarShareRequests(calendarResponseDTO dto, Long actorUserId) {
        if (dto == null || dto.getId() == null || actorUserId == null) return;
        List<Map<String, Object>> targets = dto.getShareTargets();
        if (targets == null || targets.isEmpty()) return;
        for (Map<String, Object> target : targets) {
            String targetType = normalizeShareTargetType(target == null ? null : target.get("targetType"));
            Long targetId = longOrNull(target == null ? null : target.get("targetId"));
            if (targetType.isBlank() || targetId == null) continue;
            contentShareDTO share = new contentShareDTO();
            share.setContentType("CALENDAR");
            share.setContentId(dto.getId());
            share.setTargetType(targetType);
            share.setTargetId(targetId);
            share.setPermissionType(normalizeSharePermission(target.get("permissionType")));
            contentShareService.saveShare(share, actorUserId, "PERMISSION");
        }
    }

    private void sendCalendarAttendeeNotices(calendarResponseDTO dto, Set<Long> addedAttendeeIds, Long actorUserId) {
        if (dto == null || addedAttendeeIds == null || addedAttendeeIds.isEmpty()) return;
        Set<Long> directShareUsers = directUserShareTargetIds(dto.getShareTargets());
        String title = dto.getTitle() == null || dto.getTitle().isBlank() ? "새 일정" : dto.getTitle().trim();
        for (Long attendeeId : addedAttendeeIds) {
            if (attendeeId == null || attendeeId.equals(actorUserId) || directShareUsers.contains(attendeeId)) continue;
            userNoticeDAO.insertCalendarAttendeeAlarm(
                    attendeeId,
                    actorUserId,
                    "일정 참석자로 추가되었습니다: " + title,
                    "새 일정에 참석자로 추가되었습니다. 캘린더에서 일정을 확인해 주세요.",
                    dto.getId(),
                    "/calendar?viewEventId=" + dto.getId()
            );
        }
    }

    private Set<Long> directUserShareTargetIds(List<Map<String, Object>> targets) {
        Set<Long> result = new LinkedHashSet<>();
        if (targets == null) return result;
        for (Map<String, Object> target : targets) {
            String targetType = normalizeShareTargetType(target == null ? null : target.get("targetType"));
            Long targetId = longOrNull(target == null ? null : target.get("targetId"));
            if ("USER".equals(targetType) && targetId != null) result.add(targetId);
        }
        return result;
    }

    private String normalizeShareTargetType(Object value) {
        String type = value == null ? "" : String.valueOf(value).trim().toUpperCase();
        if ("FRIEND".equals(type)) return "USER";
        if ("WORKSPACE".equals(type)) return "WS";
        if ("PROJECT".equals(type)) return "PROJ";
        return Set.of("USER", "WS", "PROJ").contains(type) ? type : "";
    }

    private String normalizeSharePermission(Object value) {
        String permission = value == null ? "VIEW" : String.valueOf(value).trim().toUpperCase();
        return "EDIT".equals(permission) ? "EDIT" : "VIEW";
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> shareTargetsFromParams(Map<String, Object> params) {
        Object raw = params == null ? null : params.get("shareTargets");
        if (!(raw instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                result.add((Map<String, Object>) map);
            }
        }
        return result;
    }

    @Override
    public List<calendarResponseDTO> getMonthlyCalendar(Long userId, Long projId, Long wsId, List<String> types, String startDate, String endDate) {
        ensureCalendarDetailColumns();
        // 1. DB에서 해당 기간의 일정 가져오기 (음력은 날짜 상관없이 가져오도록 XML에서 처리됨)
        List<calendarResponseDTO> eventList = calendarDao.getMonthlyEvents(userId, wsId, projId, types, startDate, endDate);

        // 2. 현재 화면에서 보고 있는 '연도' 추출 (예: "2027-06-01" -> 2027)
        int viewYear = Integer.parseInt(startDate.substring(0, 4));

        for (calendarResponseDTO event : eventList) {
            // 음력 설정이 'Y'인 일정만 처리
            if ("Y".equalsIgnoreCase(event.getIsLunar())) {
                if (event.getLunarMonth() != null && event.getLunarDay() != null) {
                    try {
                        // 음력 일정은 DB에 저장된 시작/종료 양력 날짜의 기간 길이를 보존해서
                        // 현재 조회 연도의 음력 시작일 기준으로 다시 펼친다.
                        // 예) 음력 6/16~6/18 저장 → 다음 해에도 6/16부터 3일짜리 일정으로 표시
                        long lunarDurationDays = calculateInclusiveDurationDays(event.getStartDt(), event.getEndDt());
                        String solarStartDate = LunarUtil.convertLunarToSolar(viewYear, event.getLunarMonth(), event.getLunarDay());
                        String solarEndDate = addDays(solarStartDate, lunarDurationDays);

                        event.setStartDt(solarStartDate + " 00:00:00");
                        event.setEndDt(solarEndDate + " 23:59:59");
                        event.setAllDay("Y"); // 음력 일정은 종일 일정으로 처리

                        System.out.println("음력 변환 완료: " + event.getTitle() + " -> " + solarStartDate + " ~ " + solarEndDate);
                    } catch (Exception e) {
                        System.err.println("음력 변환 중 오류 발생 (ID: " + event.getId() + "): " + e.getMessage());
                    }
                }
            }
        }
        
        return eventList;
    }

    private long calculateInclusiveDurationDays(String startDt, String endDt) {
        try {
            LocalDate start = parseDateOnly(startDt);
            LocalDate end = parseDateOnly(endDt);
            if (start == null || end == null || end.isBefore(start)) return 0L;
            return java.time.temporal.ChronoUnit.DAYS.between(start, end);
        } catch (Exception e) {
            return 0L;
        }
    }

    private LocalDate parseDateOnly(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim().replace('T', ' ');
        if (normalized.length() < 10) return null;
        return LocalDate.parse(normalized.substring(0, 10));
    }

    private String addDays(String yyyyMmDd, long days) {
        return LocalDate.parse(yyyyMmDd).plusDays(Math.max(0L, days)).toString();
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
        normalizeCalendarEvent(dto);

        if ("Y".equals(dto.getIsRecurring())) {
            String recurGroupId = java.util.UUID.randomUUID().toString();
            dto.setRecurGroupId(recurGroupId);
        }

        applyLunarOriginalDate(dto);
        ensureCalendarDetailColumns();
        
        calendarDao.registerEvent(dto);
        Set<Long> addedAttendees = syncEventAttendees(dto.getId(), dto.getAttendeeUserIds());
        syncCalendarShareRequests(dto, dto.getUserId());
        sendCalendarAttendeeNotices(dto, addedAttendees, dto.getUserId());
    }
    
 // 1. 인터페이스 규격에 맞춰 파라미터를 Map으로 변경 (@Override 에러 해결)

    private void normalizeCalendarEvent(calendarResponseDTO dto) {
        if (dto == null) return;
        String itemType = dto.getItemType() == null ? "PRIVATE" : dto.getItemType().trim().toUpperCase();
        dto.setItemType(itemType);

        String eventType = dto.getEventType() == null || dto.getEventType().isBlank() ? "NONE" : dto.getEventType().trim().toUpperCase();
        dto.setEventType(eventType);

        if (!"PRIVATE".equals(itemType)) {
            dto.setVisibilityType("PRIVATE");
            dto.setIsPrivate("Y");
        } else {
            String visibility = dto.getVisibilityType() == null ? "PRIVATE" : dto.getVisibilityType().trim().toUpperCase();
            dto.setVisibilityType(visibility);
            dto.setIsPrivate("MOYO".equals(visibility) ? "N" : "Y");
        }

        if (dto.getAllDay() == null || dto.getAllDay().isBlank()) dto.setAllDay("N");
        dto.setTimezone("Y".equals(dto.getAllDay()) ? "Asia/Seoul" : normalizeTimezoneId(dto.getTimezone()));
        dto.setStartDt(normalizeDateTimeForDb(dto.getStartDt(), "Y".equals(dto.getAllDay()) ? "00:00" : "09:00"));
        dto.setEndDt(normalizeDateTimeForDb(dto.getEndDt(), "Y".equals(dto.getAllDay()) ? "23:59" : "10:00"));
        if (dto.getIsRecurring() == null || dto.getIsRecurring().isBlank()) dto.setIsRecurring("N");
        if (dto.getIsLunar() == null || dto.getIsLunar().isBlank()) dto.setIsLunar("N");
        if (dto.getReminderMinutes() == null) {
            dto.setReminderYn("N");
        } else {
            dto.setReminderYn("Y");
        }
        if (dto.getRecurInterval() <= 0) dto.setRecurInterval(1);
        if (dto.getColor() == null || dto.getColor().isBlank()) dto.setColor(defaultEventColor(eventType, itemType));
    }


    private void applyLunarOriginalDate(calendarResponseDTO dto) {
        if (dto == null || !"Y".equalsIgnoreCase(dto.getIsLunar())) {
            if (dto != null) {
                dto.setLunarMonth(null);
                dto.setLunarDay(null);
            }
            return;
        }
        if (dto.getLunarMonth() != null && dto.getLunarDay() != null) return;
        try {
            String[] dateParts = dto.getStartDt().split("T")[0].split("-");
            dto.setLunarMonth(Integer.parseInt(dateParts[1]));
            dto.setLunarDay(Integer.parseInt(dateParts[2]));
        } catch (Exception e) {
            System.err.println("음력 원본 날짜 추출 중 오류: " + e.getMessage());
        }
    }

    private void applyLunarOriginalDate(Map<String, Object> params) {
        if (params == null) return;
        if (!"Y".equals(String.valueOf(params.get("isLunar")))) {
            params.put("lunarMonth", null);
            params.put("lunarDay", null);
            return;
        }
        if (params.get("lunarMonth") != null && params.get("lunarDay") != null) return;
        try {
            String startDt = String.valueOf(params.get("startDt"));
            String[] dateParts = startDt.split("T")[0].split("-");
            params.put("lunarMonth", Integer.parseInt(dateParts[1]));
            params.put("lunarDay", Integer.parseInt(dateParts[2]));
        } catch (Exception e) {
            System.err.println("음력 원본 날짜 추출 중 오류: " + e.getMessage());
        }
    }

    private String normalizeTimezoneId(String timezone) {
        if (timezone == null || timezone.isBlank()) return "Asia/Seoul";
        String value = timezone.trim();
        try {
            ZoneId.of(value);
            return value;
        } catch (Exception ignored) {
            return "Asia/Seoul";
        }
    }

    private String normalizeDateTimeForDb(String value, String fallbackTime) {
        if (value == null || value.isBlank()) return value;
        String trimmed = value.trim().replace(' ', 'T');
        if (trimmed.length() == 10) return trimmed + "T" + fallbackTime;

        boolean hasOffset = trimmed.endsWith("Z") || trimmed.matches(".*[+-]\\d{2}:?\\d{2}$");
        if (hasOffset) {
            try {
                String offsetValue = trimmed.matches(".*[+-]\\d{4}$")
                        ? trimmed.substring(0, trimmed.length() - 5) + trimmed.substring(trimmed.length() - 5, trimmed.length() - 2) + ":" + trimmed.substring(trimmed.length() - 2)
                        : trimmed;
                return OffsetDateTime.parse(offsetValue)
                        .atZoneSameInstant(ZoneId.of("Asia/Seoul"))
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
            } catch (Exception ignored) {
                // 프론트에서 이미 로컬 datetime으로 조합해 보내는 값은 아래 기존 처리로 정리한다.
            }
        }

        if (trimmed.length() >= 16) return trimmed.substring(0, 16);
        return trimmed;
    }

    private void normalizeDateTimeMap(Map<String, Object> params) {
        if (params == null) return;
        String allDay = String.valueOf(params.getOrDefault("allDay", "N"));
        params.put("timezone", "Y".equals(allDay) ? "Asia/Seoul" : normalizeTimezoneId(String.valueOf(params.getOrDefault("timezone", "Asia/Seoul"))));
        Object start = params.get("startDt");
        Object end = params.get("endDt");
        if (start instanceof String) {
            params.put("startDt", normalizeDateTimeForDb((String) start, "Y".equals(allDay) ? "00:00" : "09:00"));
        }
        if (end instanceof String) {
            params.put("endDt", normalizeDateTimeForDb((String) end, "Y".equals(allDay) ? "23:59" : "10:00"));
        }
        String itemType = defaultString(params.get("itemType"), "PRIVATE").toUpperCase();
        String eventType = defaultString(params.get("eventType"), "NONE").toUpperCase();
        params.put("eventType", eventType);
        if (stringOrNull(params.get("color")) == null) {
            params.put("color", defaultEventColor(eventType, itemType));
        }
    }

    private String defaultEventColor(String eventType, String itemType) {
        if ("WS".equals(itemType)) return "#4fd2c2";
        if ("PROJ".equals(itemType)) return "#8b5cf6";
        if ("DEADLINE".equals(eventType)) return "#ff6572";
        if ("MEETING".equals(eventType)) return "#4fd2c2";
        if ("TASK".equals(eventType)) return "#8b5cf6";
        if ("BIRTHDAY".equals(eventType) || "ANNIVERSARY".equals(eventType)) return "#f7c948";
        return "#3f7cff";
    }

    @Override
    @Transactional
    public boolean deleteEvent(Map<String, Object> params) {
        String scope = String.valueOf(params.getOrDefault("deleteScope", "ONE")).toUpperCase();
        String deleteSeries = String.valueOf(params.getOrDefault("deleteSeries", "N")).toUpperCase();
        Object recurGroupId = params.get("recurGroupId");
        boolean recurring = recurGroupId != null && !String.valueOf(recurGroupId).isBlank() && !"undefined".equals(String.valueOf(recurGroupId));

        if ("ALL".equals(scope) || "Y".equals(deleteSeries)) {
            params.put("deleteSeries", "Y");
            List<Long> eventIds = calendarDao.selectEventIdsForDelete(params);
            cleanupEventDeleteDependencies(eventIds);
            return calendarDao.deleteEvent(params) > 0;
        }

        if (recurring && "FUTURE".equals(scope)) {
            String occurrenceDate = String.valueOf(params.getOrDefault("occurrenceDate", ""));
            if (occurrenceDate.isBlank()) throw new IllegalArgumentException("삭제 기준 날짜가 없습니다.");
            return calendarDao.endRecurringEventsBefore(params) > 0;
        }

        if (recurring && "ONE".equals(scope)) {
            String occurrenceDate = String.valueOf(params.getOrDefault("occurrenceDate", ""));
            if (occurrenceDate.isBlank()) throw new IllegalArgumentException("삭제할 반복 일정 날짜가 없습니다.");
            return calendarDao.insertEventException(params) > 0;
        }

        params.put("deleteSeries", "N");
        List<Long> eventIds = calendarDao.selectEventIdsForDelete(params);
        cleanupEventDeleteDependencies(eventIds);
        return calendarDao.deleteEvent(params) > 0;
    }

    private void cleanupEventDeleteDependencies(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) return;
        ensureCalendarAttendeeTable();
        try {
            calendarDao.deleteEventAttendeesByEventIds(eventIds);
        } catch (Exception e) {
            System.err.println("일정 참석자 삭제 중 오류: " + e.getMessage());
        }
        try {
            calendarDao.deleteEventExceptionsByEventIds(eventIds);
        } catch (Exception e) {
            System.err.println("반복 일정 예외 삭제 중 오류: " + e.getMessage());
        }
        for (Long eventId : eventIds) {
            try {
                contentShareService.removeContentShares("CALENDAR", eventId);
            } catch (Exception e) {
                System.err.println("일정 공유 요청 삭제 중 오류(EVENT_ID=" + eventId + "): " + e.getMessage());
            }
        }
    }
    
    @Override
    public boolean updateEventDate(Map<String, Object> params) {
        normalizeDateTimeMap(params);
        // DAO를 호출하여 업데이트 실행 (리턴 타입 int를 boolean으로 변환)
        return calendarDao.updateEventDate(params) > 0;
    }
    @Override
    @Transactional
    public boolean updateEventAll(Map<String, Object> params) {
        normalizeDateTimeMap(params);
        applyLunarOriginalDate(params);
        ensureCalendarDetailColumns();

        String scope = String.valueOf(params.getOrDefault("updateScope", "ONE")).toUpperCase();
        String recurGroupId = stringOrBlank(params.get("recurGroupId"));
        boolean recurring = !recurGroupId.isBlank() && !"undefined".equalsIgnoreCase(recurGroupId);

        if (!recurring) {
            boolean updated = calendarDao.updateEventAll(params) > 0;
            if (updated) {
                Long eventId = longOrNull(params.get("id"));
                calendarResponseDTO noticeDto = mapToCalendarDto(params);
                Set<Long> addedAttendees = syncEventAttendees(eventId, attendeeIdsFromParams(params));
                syncCalendarShareRequests(noticeDto, longOrNull(params.get("userId")));
                sendCalendarAttendeeNotices(noticeDto, addedAttendees, longOrNull(params.get("userId")));
            }
            return updated;
        }

        if ("ALL".equals(scope)) {
            boolean updated = calendarDao.updateRecurringEvents(params) > 0;
            if (updated) {
                Long eventId = longOrNull(params.get("id"));
                calendarResponseDTO noticeDto = mapToCalendarDto(params);
                Set<Long> addedAttendees = syncEventAttendees(eventId, attendeeIdsFromParams(params));
                syncCalendarShareRequests(noticeDto, longOrNull(params.get("userId")));
                sendCalendarAttendeeNotices(noticeDto, addedAttendees, longOrNull(params.get("userId")));
            }
            return updated;
        }

        if ("FUTURE".equals(scope)) {
            String occurrenceDate = stringOrBlank(params.get("occurrenceDate"));
            if (occurrenceDate.isBlank()) throw new IllegalArgumentException("수정 기준 날짜가 없습니다.");

            int ended = calendarDao.endRecurringEventsBefore(params);
            calendarResponseDTO nextSeries = mapToCalendarDto(params);
            nextSeries.setId(null);
            nextSeries.setRecurGroupId(null);
            nextSeries.setIsRecurring("Y");
            normalizeCalendarEvent(nextSeries);
            if ("Y".equals(nextSeries.getIsRecurring())) {
                nextSeries.setRecurGroupId(java.util.UUID.randomUUID().toString());
            }
            applyLunarOriginalDate(nextSeries);
            calendarDao.registerEvent(nextSeries);
            Set<Long> addedAttendees = syncEventAttendees(nextSeries.getId(), attendeeIdsFromParams(params));
            syncCalendarShareRequests(nextSeries, longOrNull(params.get("userId")));
            sendCalendarAttendeeNotices(nextSeries, addedAttendees, longOrNull(params.get("userId")));
            return ended > 0;
        }

        if ("ONE".equals(scope)) {
            String occurrenceDate = stringOrBlank(params.get("occurrenceDate"));
            if (occurrenceDate.isBlank()) throw new IllegalArgumentException("수정할 반복 일정 날짜가 없습니다.");

            params.put("eventId", params.get("originalEventId") != null ? params.get("originalEventId") : params.get("id"));
            calendarDao.insertEventException(params);

            calendarResponseDTO singleEvent = mapToCalendarDto(params);
            singleEvent.setId(null);
            singleEvent.setIsRecurring("N");
            singleEvent.setRecurType(null);
            singleEvent.setRecurInterval(1);
            singleEvent.setUntilDt(null);
            singleEvent.setRecurDays(null);
            singleEvent.setRecurGroupId(null);
            normalizeCalendarEvent(singleEvent);
            applyLunarOriginalDate(singleEvent);
            calendarDao.registerEvent(singleEvent);
            Set<Long> addedAttendees = syncEventAttendees(singleEvent.getId(), attendeeIdsFromParams(params));
            syncCalendarShareRequests(singleEvent, longOrNull(params.get("userId")));
            sendCalendarAttendeeNotices(singleEvent, addedAttendees, longOrNull(params.get("userId")));
            return true;
        }

        return calendarDao.updateEventAll(params) > 0;
    }

    @Override
    @Transactional
    public boolean updateRecurringEvents(Map<String, Object> params) {
        normalizeDateTimeMap(params);
        applyLunarOriginalDate(params);
        ensureCalendarDetailColumns();
        return calendarDao.updateRecurringEvents(params) > 0;
    }

    private List<Long> attendeeIdsFromParams(Map<String, Object> params) {
        Object raw = params == null ? null : params.get("attendeeUserIds");
        List<Long> result = new ArrayList<>();
        if (raw instanceof Iterable<?>) {
            for (Object item : (Iterable<?>) raw) {
                Long parsed = longOrNull(item);
                if (parsed != null) result.add(parsed);
            }
        } else {
            Long parsed = longOrNull(raw);
            if (parsed != null) result.add(parsed);
        }
        return result;
    }

    private calendarResponseDTO mapToCalendarDto(Map<String, Object> params) {
        calendarResponseDTO dto = new calendarResponseDTO();
        dto.setId(longOrNull(params.get("id")));
        dto.setShareTargets(shareTargetsFromParams(params));
        dto.setTitle(stringOrBlank(params.get("title")));
        dto.setStartDt(stringOrBlank(params.get("startDt")));
        dto.setEndDt(stringOrBlank(params.get("endDt")));
        dto.setItemType(defaultString(params.get("itemType"), "PRIVATE"));
        dto.setUserId(longOrNull(params.get("userId")));
        dto.setProjId(longOrNull(params.get("projId")));
        dto.setWsId(longOrNull(params.get("wsId")));
        dto.setColor(stringOrNull(params.get("color")));
        dto.setVisibilityType(defaultString(params.get("visibilityType"), "PRIVATE"));
        dto.setIsPrivate(defaultString(params.get("isPrivate"), "Y"));
        dto.setEventType(defaultString(params.get("eventType"), "NONE"));
        dto.setLocationText(stringOrNull(params.get("locationText")));
        dto.setLocationAddress(stringOrNull(params.get("locationAddress")));
        dto.setLocationLat(doubleOrNull(params.get("locationLat")));
        dto.setLocationLng(doubleOrNull(params.get("locationLng")));
        dto.setLocationPlaceId(stringOrNull(params.get("locationPlaceId")));
        dto.setDescriptionText(stringOrNull(params.get("descriptionText")));
        dto.setReminderYn(defaultString(params.get("reminderYn"), integerOrNull(params.get("reminderMinutes")) == null ? "N" : "Y"));
        dto.setReminderMinutes(integerOrNull(params.get("reminderMinutes")));
        dto.setAllDay(defaultString(params.get("allDay"), "N"));
        dto.setTimezone(defaultString(params.get("timezone"), "Asia/Seoul"));
        dto.setIsRecurring(defaultString(params.get("isRecurring"), "N"));
        dto.setRecurType(stringOrNull(params.get("recurType")));
        dto.setRecurInterval(intOrDefault(params.get("recurInterval"), 1));
        dto.setUntilDt(stringOrNull(params.get("untilDt")));
        dto.setRecurDays(stringOrNull(params.get("recurDays")));
        dto.setRecurGroupId(stringOrNull(params.get("recurGroupId")));
        dto.setIsLunar(defaultString(params.get("isLunar"), "N"));
        dto.setLunarMonth(integerOrNull(params.get("lunarMonth")));
        dto.setLunarDay(integerOrNull(params.get("lunarDay")));
        return dto;
    }

    private String stringOrBlank(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String stringOrNull(Object value) {
        String text = stringOrBlank(value);
        return text.isBlank() || "null".equalsIgnoreCase(text) || "undefined".equalsIgnoreCase(text) ? null : text;
    }

    private String defaultString(Object value, String fallback) {
        String text = stringOrNull(value);
        return text == null ? fallback : text;
    }

    private Long longOrNull(Object value) {
        String text = stringOrNull(value);
        if (text == null) return null;
        try { return Long.parseLong(text); } catch (Exception e) { return null; }
    }

    private Integer integerOrNull(Object value) {
        String text = stringOrNull(value);
        if (text == null) return null;
        try { return Integer.parseInt(text); } catch (Exception e) { return null; }
    }

    private int intOrDefault(Object value, int fallback) {
        Integer parsed = integerOrNull(value);
        return parsed == null || parsed <= 0 ? fallback : parsed;
    }

    private Double doubleOrNull(Object value) {
        String text = stringOrNull(value);
        if (text == null) return null;
        try { return Double.parseDouble(text); } catch (Exception e) { return null; }
    }



    @Override
    public List<calendarResponseDTO> getProfilePublicEvents(Long profileUserId, int limit) {
        ensureCalendarDetailColumns();
        ensureCalendarEventTypeColumn();
        if (profileUserId == null) return List.of();
        int safeLimit = limit <= 0 ? 5 : Math.min(limit, 20);
        return calendarDao.selectProfilePublicEvents(profileUserId, safeLimit);
    }

    @Override
    public int countProfilePublicEvents(Long profileUserId) {
        ensureCalendarDetailColumns();
        ensureCalendarEventTypeColumn();
        if (profileUserId == null) return 0;
        return calendarDao.countProfilePublicEvents(profileUserId);
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
    
    @Override
    public String checkUserRole(Long wsId, Long userId) {
        if (wsId == null || userId == null) return "NONE";

        // 1. 기존 DAO 메서드를 사용해 유저가 소속된 워크스페이스 리스트를 가져옵니다.
        List<Map<String, Object>> workspaces = calendarDao.selectUserWorkspaces(userId);

        if (workspaces != null) {
            for (Map<String, Object> ws : workspaces) {
                // 2. DB에서 넘어온 wsId 값을 안전하게 추출 (오라클 등 DB 특성에 따른 타입 방어)
                Object currentWsIdObj = ws.get("wsId") != null ? ws.get("wsId") : ws.get("WS_ID");
                
                if (currentWsIdObj != null) {
                    Long currentWsId = ((Number) currentWsIdObj).longValue();
                    
                    // 3. 사용자가 요청한 wsId와 일치하는 공간을 찾았다면 해당 공간의 Role을 반환
                    if (currentWsId.equals(wsId)) {
                        String role = (String) (ws.get("wsRole") != null ? ws.get("wsRole") : ws.get("WS_ROLE"));
                        return role != null ? role.toUpperCase() : "MEMBER"; 
                    }
                }
            }
        }
        return "NONE"; // 소속되어 있지 않은 경우
    }
    private void ensureCalendarDetailColumns() {
        ensureCalendarEventTypeColumn();
        try {
            calendarDao.ensureCalendarDetailColumns();
        } catch (Exception e) {
            System.err.println("일정 상세 컬럼 확인/생성 중 오류: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> getEventDetailForView(Long eventId, Long userId) {
        if (eventId == null || userId == null) return null;
        ensureCalendarDetailColumns();
        ensureCalendarAttendeeTable();
        Map<String, Object> detail = calendarDao.selectEventDetailForView(eventId, userId);
        if (detail != null) {
            detail.put("attendees", calendarDao.selectEventAttendeesForView(eventId));
        }
        return detail;
    }

    @Override
    public boolean canEditEvent(Long eventId, Long userId) {
        if (eventId == null || userId == null) return false;
        ensureCalendarDetailColumns();
        return calendarDao.countEventEditPermission(eventId, userId) > 0;
    }

}