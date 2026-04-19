package com.springboot.project.dto;

import lombok.Data;

@Data
public class workspaceDTO {
    private Long wsId;         // 워크스페이스 고유 ID
    private String wsName;     // 팀 이름
    private String inviteCode; // 초대 코드
    private Long ownerId;      // 생성자(유저) ID
}