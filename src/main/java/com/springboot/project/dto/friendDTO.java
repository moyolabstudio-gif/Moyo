package com.springboot.project.dto;

import java.util.Date;

public class friendDTO {
    private Long friendId;
    private Long requesterId;
    private Long addresseeId;
    private String status;
    private Date requestedAt;
    private Date respondedAt;
    private Date updatedAt;

    private Long userId;
    private String userName;
    private String email;
    private String profileImagePath;
    private String profileOriginalImagePath;
    private Double profileCropScale;
    private Double profileCropX;
    private Double profileCropY;
    private String profileAvatarType;
    private String relationStatus;
    private String direction;

    // 공통 친구/프로필 모달 호환용 별칭 getter
    public Long getId() { return userId; }
    public String getName() { return userName; }
    public String getDisplayName() { return userName; }
    public String getProfile() { return profileImagePath; }
    public String getProfileUrl() { return profileImagePath; }
    public String getProfileImageUrl() { return profileImagePath; }
    public String getCroppedImagePath() { return profileImagePath; }
    public String getProfileOriginal() { return profileOriginalImagePath; }
    public String getOriginalImagePath() { return profileOriginalImagePath; }
    public Double getCropScale() { return profileCropScale; }
    public Double getCropX() { return profileCropX; }
    public Double getCropY() { return profileCropY; }
    public String getAvatarType() { return profileAvatarType; }

    public Long getFriendId() { return friendId; }
    public void setFriendId(Long friendId) { this.friendId = friendId; }
    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }
    public Long getAddresseeId() { return addresseeId; }
    public void setAddresseeId(Long addresseeId) { this.addresseeId = addresseeId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Date getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Date requestedAt) { this.requestedAt = requestedAt; }
    public Date getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Date respondedAt) { this.respondedAt = respondedAt; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
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
    public String getRelationStatus() { return relationStatus; }
    public void setRelationStatus(String relationStatus) { this.relationStatus = relationStatus; }
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
}
