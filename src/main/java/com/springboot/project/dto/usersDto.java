package com.springboot.project.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class usersDto {
    private Long userId;
    private String email;
    private String pwdHash;
    private String userName;
    private String status;
    private String userRole;
    private String profileImagePath;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPwdHash() { return pwdHash; }
    public void setPwdHash(String pwdHash) { this.pwdHash = pwdHash; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    public String getProfileImagePath() { return profileImagePath; }
    public void setProfileImagePath(String profileImagePath) { this.profileImagePath = profileImagePath; }

    // 기존 JSP/Map 호환용
    @JsonIgnore
    public Long getUSER_ID() { return userId; }

    @JsonIgnore
    public String getUSER_NAME() { return userName; }

    @JsonIgnore
    public String getEMAIL() { return email; }
}
