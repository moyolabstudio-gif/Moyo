package com.springboot.project.dto;

import lombok.Data;

@Data
public class logHourlyActiveDTO {
    private Integer hour;
    private Long activeUsers;
    private Long pageViews;
}
