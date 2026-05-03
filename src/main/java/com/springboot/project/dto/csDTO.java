package com.springboot.project.dto;

import lombok.Data;

@Data
public class csDTO {
    private Long csId;      // CS_ID
    private Long userId;    // USER_ID
    private String extKey;  // EXT_KEY
    private String csStatus; // CS_STATUS
    
    // 조인해서 가져올 경우를 대비한 필드 (userName, email 등)
    private String userName;
    private String email;

    // 기존 프로젝트 규칙(대문자 Getter)이 필요하다면 추가
    public Long getCS_ID() { return this.csId; }
    public String getEXT_KEY() { return this.extKey; }
    public String getCS_STATUS() { return this.csStatus; }
    public String getUSER_NAME() { return this.userName; }
    public String getEMAIL() { return this.email; }
}