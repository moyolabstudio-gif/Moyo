package com.springboot.project.dto;

import lombok.Data;

@Data
public class usersDto {
    private Long userId;
    private String email;    
    private String pwdHash;
    private String userName;
    private String status;


    public Long getUSER_ID() { return this.userId; }
    public String getUSER_NAME() { return this.userName; }
    public String getEMAIL() { return this.email; }
}