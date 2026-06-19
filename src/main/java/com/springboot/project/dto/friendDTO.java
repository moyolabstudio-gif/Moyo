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
    private String relationStatus;
    private String direction;

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
    public String getRelationStatus() { return relationStatus; }
    public void setRelationStatus(String relationStatus) { this.relationStatus = relationStatus; }
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
}
