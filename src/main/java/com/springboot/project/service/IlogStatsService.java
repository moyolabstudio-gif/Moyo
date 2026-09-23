package com.springboot.project.service;

import java.util.List;

import com.springboot.project.dto.logDailyStatDTO;
import com.springboot.project.dto.logGroupStatDTO;
import com.springboot.project.dto.logHeatmapCellDTO;
import com.springboot.project.dto.logHourlyActiveDTO;
import com.springboot.project.dto.logMenuStatDTO;
import com.springboot.project.dto.logSummaryDTO;

public interface IlogStatsService {

    logSummaryDTO getSummary(int rangeDays);

    List<logMenuStatDTO> getMenuRanking(int rangeDays, int limit);

    List<logDailyStatDTO> getDailyActiveUsers(int rangeDays);

    List<logHourlyActiveDTO> getHourlyActiveUsers(int rangeDays);

    List<logHeatmapCellDTO> getHeatmap(int rangeDays);

    List<logGroupStatDTO> getDeviceStats(int rangeDays);
}
