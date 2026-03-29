package com.springboot.project.dto;

import lombok.Data;

@Data // Getter, Setter, toString 등 자동 생성
public class UsersDto {
    private Long userId;
    private String email;
    private String pwdHash;
    private String userName;
    private String status;
}