package com.springboot.project.dto;

import java.util.Date;

public class contentShareDTO {
    private Long shareId;
    private String contentType;
    private Long contentId;
    private Long ownerId;
    private String targetType;
    private Long targetId;
    private String permissionType;
    private Long sharedBy;
    private Date createdAt;
    private Date expiresAt;
    private String activeYn;
    private String targetName;
    private String targetSubtext;

    public Long getShareId() { return shareId; }
    public void setShareId(Long shareId) { this.shareId = shareId; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getContentId() { return contentId; }
    public void setContentId(Long contentId) { this.contentId = contentId; }
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getPermissionType() { return permissionType; }
    public void setPermissionType(String permissionType) { this.permissionType = permissionType; }
    public Long getSharedBy() { return sharedBy; }
    public void setSharedBy(Long sharedBy) { this.sharedBy = sharedBy; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public Date getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Date expiresAt) { this.expiresAt = expiresAt; }
    public String getActiveYn() { return activeYn; }
    public void setActiveYn(String activeYn) { this.activeYn = activeYn; }
    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }
    public String getTargetSubtext() { return targetSubtext; }
    public void setTargetSubtext(String targetSubtext) { this.targetSubtext = targetSubtext; }
}
