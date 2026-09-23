package com.springboot.project.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.IlogStatsDAO;
import com.springboot.project.dto.logDailyStatDTO;
import com.springboot.project.dto.logGroupStatDTO;
import com.springboot.project.dto.logHeatmapCellDTO;
import com.springboot.project.dto.logHourlyActiveDTO;
import com.springboot.project.dto.logMenuStatDTO;
import com.springboot.project.dto.logSummaryDTO;
import com.springboot.project.service.IlogStatsService;

@Service
public class LogStatsServiceImpl implements IlogStatsService {

    private static final int MAX_RANGE_DAYS = 90;
    private static final int DEFAULT_MENU_LIMIT = 12;

    @Autowired
    private IlogStatsDAO logStatsDAO;

    @Override
    public logSummaryDTO getSummary(int rangeDays) {
        LocalDateTime from = fromOf(rangeDays);
        LocalDateTime to = toOf();

        logSummaryDTO summary = new logSummaryDTO();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        summary.setTodayActiveUsers(logStatsDAO.getActiveUserCount(todayStart, toOf()));

        List<logDailyStatDTO> daily = logStatsDAO.getDailyActiveUsers(from, to);
        if (daily == null || daily.isEmpty()) {
            summary.setAvgDailyActiveUsers(0L);
        } else {
            long sum = 0L;
            for (logDailyStatDTO d : daily) sum += d.getActiveUsers() == null ? 0L : d.getActiveUsers();
            summary.setAvgDailyActiveUsers(Math.round(sum / (double) daily.size()));
        }

        List<logMenuStatDTO> topMenu = logStatsDAO.getMenuRanking(from, to, 1);
        if (topMenu != null && !topMenu.isEmpty()) {
            summary.setTopMenuLabel(topMenu.get(0).getLabel());
            summary.setTopMenuCount(topMenu.get(0).getCount());
        } else {
            summary.setTopMenuLabel("-");
            summary.setTopMenuCount(0L);
        }

        List<logHourlyActiveDTO> hourly = logStatsDAO.getHourlyActiveUsers(from, to);
        logHourlyActiveDTO peak = null;
        if (hourly != null) {
            for (logHourlyActiveDTO h : hourly) {
                long views = h.getPageViews() == null ? 0L : h.getPageViews();
                long peakViews = peak == null || peak.getPageViews() == null ? -1L : peak.getPageViews();
                if (peak == null || views > peakViews) peak = h;
            }
        }
        if (peak != null) {
            summary.setPeakHourLabel(peak.getHour() + "시");
            summary.setPeakHourCount(peak.getPageViews());
        } else {
            summary.setPeakHourLabel("-");
            summary.setPeakHourCount(0L);
        }

        return summary;
    }

    @Override
    public List<logMenuStatDTO> getMenuRanking(int rangeDays, int limit) {
        int safeLimit = limit <= 0 || limit > 50 ? DEFAULT_MENU_LIMIT : limit;
        List<logMenuStatDTO> list = logStatsDAO.getMenuRanking(fromOf(rangeDays), toOf(), safeLimit);
        return list == null ? Collections.emptyList() : list;
    }

    @Override
    public List<logDailyStatDTO> getDailyActiveUsers(int rangeDays) {
        List<logDailyStatDTO> list = logStatsDAO.getDailyActiveUsers(fromOf(rangeDays), toOf());
        return list == null ? Collections.emptyList() : list;
    }

    @Override
    public List<logHourlyActiveDTO> getHourlyActiveUsers(int rangeDays) {
        List<logHourlyActiveDTO> list = logStatsDAO.getHourlyActiveUsers(fromOf(rangeDays), toOf());
        return list == null ? Collections.emptyList() : list;
    }

    @Override
    public List<logHeatmapCellDTO> getHeatmap(int rangeDays) {
        List<logHeatmapCellDTO> list = logStatsDAO.getHeatmap(fromOf(rangeDays), toOf());
        return list == null ? Collections.emptyList() : list;
    }

    @Override
    public List<logGroupStatDTO> getDeviceStats(int rangeDays) {
        List<logGroupStatDTO> list = logStatsDAO.getDeviceStats(fromOf(rangeDays), toOf());
        return list == null ? Collections.emptyList() : list;
    }

    private LocalDateTime fromOf(int rangeDays) {
        int safeDays = rangeDays <= 0 || rangeDays > MAX_RANGE_DAYS ? 7 : rangeDays;
        return LocalDateTime.now().minusDays(safeDays - 1L).with(LocalTime.MIN);
    }

    private LocalDateTime toOf() {
        return LocalDateTime.now();
    }
}
