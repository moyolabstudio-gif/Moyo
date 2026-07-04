package com.springboot.project.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IcalendarResponseDAO;
import com.springboot.project.dao.IuserNoticeDAO;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CalendarEventReminderScheduler {

    private static final DateTimeFormatter DB_START_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter ALARM_TEXT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd a hh:mm", Locale.KOREAN);

    private final IcalendarResponseDAO calendarDao;
    private final IuserNoticeDAO userNoticeDAO;

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void createCalendarReminderAlarms() {
        ensureColumns();

        List<Map<String, Object>> reminderCandidates = calendarDao.selectDueCalendarReminders();
        if (reminderCandidates == null || reminderCandidates.isEmpty()) return;

        for (Map<String, Object> event : reminderCandidates) {
            Long eventId = longValue(event.get("eventId"));
            Long ownerId = longValue(event.get("ownerId"));
            Integer reminderMinutes = intValue(event.get("reminderMinutes"));
            if (eventId == null || ownerId == null || reminderMinutes == null) continue;

            ZoneId zoneId = zoneIdOf(stringValue(event.get("timezone")));
            ZonedDateTime eventStart = eventStartAtZone(event.get("startDt"), zoneId);
            if (eventStart == null) continue;

            ZonedDateTime now = ZonedDateTime.now(zoneId);
            ZonedDateTime reminderTime = eventStart.minusMinutes(reminderMinutes.longValue());

            if (reminderTime.isAfter(now)) continue;
            if (eventStart.isBefore(now.minusHours(1))) continue;

            String title = stringValue(event.get("title"));
            if (title.isBlank()) title = "일정";

            String content = eventStart.format(ALARM_TEXT_FORMAT)
                    + " 시작 · "
                    + reminderLabel(reminderMinutes)
                    + " 알림";

            Map<String, Object> params = new HashMap<>();
            params.put("eventId", eventId);
            params.put("ownerId", ownerId);
            params.put("title", title);
            params.put("content", content);
            params.put("linkUrl", "/calendar?viewEventId=" + eventId);
            calendarDao.insertCalendarReminderAlarms(params);
            calendarDao.markCalendarReminderSent(eventId);
        }
    }

    private void ensureColumns() {
        try {
            calendarDao.ensureCalendarReminderColumns();
        } catch (Exception e) {
            System.err.println("캘린더 알림 컬럼 확인 중 오류: " + e.getMessage());
        }
        try {
            userNoticeDAO.ensureUserNoticeCommonColumns();
        } catch (Exception e) {
            System.err.println("공통 사용자 알림 컬럼 확인 중 오류: " + e.getMessage());
        }
    }

    private ZoneId zoneIdOf(String timezone) {
        if (timezone == null || timezone.isBlank()) return ZoneId.of("Asia/Seoul");
        try {
            return ZoneId.of(timezone.trim());
        } catch (Exception e) {
            return ZoneId.of("Asia/Seoul");
        }
    }

    private ZonedDateTime eventStartAtZone(Object startDt, ZoneId zoneId) {
        String value = stringValue(startDt);
        if (value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value, DB_START_FORMAT).atZone(zoneId);
        } catch (Exception e) {
            return null;
        }
    }

    private String reminderLabel(Integer minutes) {
        if (minutes == null) return "알림";
        if (minutes == 0) return "시작 시간";
        if (minutes == 60) return "1시간 전";
        if (minutes == 1440) return "하루 전";
        return minutes + "분 전";
    }

    private Long longValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    private Integer intValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
