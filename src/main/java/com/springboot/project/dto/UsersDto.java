package com.springboot.project.dto;

import lombok.Data;

@Data
public class UsersDto {
    private Long userId;
    private String email;
    private String pwdHash;
    private String userName;
    private String status;
}