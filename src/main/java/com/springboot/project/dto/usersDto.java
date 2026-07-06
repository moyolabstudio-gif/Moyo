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
    private String profileOriginalImagePath;
    private Double profileCropScale;
    private Double profileCropX;
    private Double profileCropY;
    private String profileAvatarType;
    private String birthDate;
    private String birthCalendarType;
    private String birthPublicYn;

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
    public String getProfileOriginalImagePath() { return profileOriginalImagePath; }
    public void setProfileOriginalImagePath(String profileOriginalImagePath) { this.profileOriginalImagePath = profileOriginalImagePath; }
    public Double getProfileCropScale() { return profileCropScale; }
    public void setProfileCropScale(Double profileCropScale) { this.profileCropScale = profileCropScale; }
    public Double getProfileCropX() { return profileCropX; }
    public void setProfileCropX(Double profileCropX) { this.profileCropX = profileCropX; }
    public Double getProfileCropY() { return profileCropY; }
    public void setProfileCropY(Double profileCropY) { this.profileCropY = profileCropY; }
    public String getProfileAvatarType() { return profileAvatarType; }
    public void setProfileAvatarType(String profileAvatarType) { this.profileAvatarType = profileAvatarType; }
    public String getBirthDate() { return birthDate; }
    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
    public String getBirthCalendarType() { return birthCalendarType; }
    public void setBirthCalendarType(String birthCalendarType) { this.birthCalendarType = birthCalendarType; }
    public String getBirthPublicYn() { return birthPublicYn; }
    public void setBirthPublicYn(String birthPublicYn) { this.birthPublicYn = birthPublicYn; }

    // 기존 JSP/Map 호환용
    @JsonIgnore
    public Long getUSER_ID() { return userId; }

    @JsonIgnore
    public String getUSER_NAME() { return userName; }

    @JsonIgnore
    public String getEMAIL() { return email; }

    @JsonIgnore
    public String getPROFILE_IMAGE_PATH() { return profileImagePath; }

    @JsonIgnore
    public String getPROFILE_ORIGINAL_IMAGE_PATH() { return profileOriginalImagePath; }

    @JsonIgnore
    public Double getPROFILE_CROP_SCALE() { return profileCropScale; }

    @JsonIgnore
    public Double getPROFILE_CROP_X() { return profileCropX; }

    @JsonIgnore
    public Double getPROFILE_CROP_Y() { return profileCropY; }

    @JsonIgnore
    public String getPROFILE_AVATAR_TYPE() { return profileAvatarType; }

    @JsonIgnore
    public String getBIRTH_DATE() { return birthDate; }

    @JsonIgnore
    public String getBIRTH_CALENDAR_TYPE() { return birthCalendarType; }

    @JsonIgnore
    public String getBIRTH_PUBLIC_YN() { return birthPublicYn; }
}
