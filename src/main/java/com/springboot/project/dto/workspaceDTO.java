package com.springboot.project.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class workspaceDTO {
    private Long wsId;         // 워크스페이스 고유 ID
    private String wsName;     // 팀 이름
    private String inviteCode; // 초대 코드
    private Long ownerId;      // 생성자(유저) ID
    
    private String wsImagePath;
    private String wsImageOriginalPath;
    private Double wsImageCropScale;
    private Double wsImageCropX;
    private Double wsImageCropY;
    /** Mapper 제어용. DB 컬럼이 아님. */
    private String removeWorkspaceImage;
    private String wsDescription;
    private String wsType;       // ORGANIZATION/TEAM/STUDY/COMMUNITY/CLUB/LIFE/ETC
    private String joinType;     // OPEN/APPROVAL/INVITE_ONLY
    private Long memberCount;     // 그룹 멤버 수
    private String currentUserRole; // 현재 로그인 사용자의 그룹 역할(OWNER/ADMIN/MEMBER)

    private String status;                    // ACTIVE/DELETE_PENDING
    private LocalDateTime deleteRequestedAt; // 삭제 신청일
    private LocalDateTime deleteDeadlineAt;  // 최종 삭제 예정일
    private String deleteDeadlineDate;
    
}