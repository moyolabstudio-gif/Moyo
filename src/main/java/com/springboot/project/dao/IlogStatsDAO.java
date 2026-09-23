package com.springboot.project.dao;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.logDailyStatDTO;
import com.springboot.project.dto.logGroupStatDTO;
import com.springboot.project.dto.logHeatmapCellDTO;
import com.springboot.project.dto.logHourlyActiveDTO;
import com.springboot.project.dto.logMenuStatDTO;

@Mapper
public interface IlogStatsDAO {

    long getActiveUserCount(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<logMenuStatDTO> getMenuRanking(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
            @Param("limit") int limit);

    List<logDailyStatDTO> getDailyActiveUsers(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<logHourlyActiveDTO> getHourlyActiveUsers(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<logHeatmapCellDTO> getHeatmap(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<logGroupStatDTO> getDeviceStats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
