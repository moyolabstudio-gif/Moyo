package com.springboot.project.dto;

import lombok.Data;

@Data
public class logHeatmapCellDTO {
    private Integer weekday;
    private Integer hour;
    private Long count;
}
