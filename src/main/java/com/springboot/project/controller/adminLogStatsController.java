package com.springboot.project.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.logDailyStatDTO;
import com.springboot.project.dto.logGroupStatDTO;
import com.springboot.project.dto.logHeatmapCellDTO;
import com.springboot.project.dto.logHourlyActiveDTO;
import com.springboot.project.dto.logMenuStatDTO;
import com.springboot.project.dto.logSummaryDTO;
import com.springboot.project.service.IlogStatsService;

@Controller
@RequestMapping("/admin/logs")
@PreAuthorize("hasRole('ADMIN')")
public class adminLogStatsController {

    @Autowired
    private IlogStatsService logStatsService;

    @GetMapping({"", "/"})
    public String logStatisticsPage() {
        return "admin/logStatistics";
    }

    @GetMapping("/summary")
    @ResponseBody
    public logSummaryDTO getSummary(@RequestParam(value = "range", defaultValue = "7") int range) {
        return logStatsService.getSummary(range);
    }

    @GetMapping("/menu-ranking")
    @ResponseBody
    public List<logMenuStatDTO> getMenuRanking(@RequestParam(value = "range", defaultValue = "7") int range,
            @RequestParam(value = "limit", defaultValue = "12") int limit) {
        return logStatsService.getMenuRanking(range, limit);
    }

    @GetMapping("/daily-active")
    @ResponseBody
    public List<logDailyStatDTO> getDailyActiveUsers(@RequestParam(value = "range", defaultValue = "7") int range) {
        return logStatsService.getDailyActiveUsers(range);
    }

    @GetMapping("/hourly-active")
    @ResponseBody
    public List<logHourlyActiveDTO> getHourlyActiveUsers(@RequestParam(value = "range", defaultValue = "7") int range) {
        return logStatsService.getHourlyActiveUsers(range);
    }

    @GetMapping("/heatmap")
    @ResponseBody
    public List<logHeatmapCellDTO> getHeatmap(@RequestParam(value = "range", defaultValue = "7") int range) {
        return logStatsService.getHeatmap(range);
    }

    @GetMapping("/device-dist")
    @ResponseBody
    public List<logGroupStatDTO> getDeviceStats(@RequestParam(value = "range", defaultValue = "7") int range) {
        return logStatsService.getDeviceStats(range);
    }
}
