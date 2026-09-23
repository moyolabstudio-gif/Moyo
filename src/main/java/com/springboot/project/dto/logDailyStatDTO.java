package com.springboot.project.dto;

import lombok.Data;

@Data
public class logDailyStatDTO {
    private String logDate;
    private Long activeUsers;
    private Long pageViews;
}
