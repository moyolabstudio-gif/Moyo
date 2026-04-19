package com.springboot.project.dto;

import lombok.Data;

@Data
public class projectRequestDTO {
	private Long projId;   
    private String projName;
    private String projDesc;
    private Long wsId;
}
