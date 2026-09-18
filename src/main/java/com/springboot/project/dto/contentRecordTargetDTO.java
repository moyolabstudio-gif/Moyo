package com.springboot.project.dto;

import java.time.LocalDateTime;

public class contentRecordTargetDTO {
    private Long recordTargetId;
    private String draftKey;
    private String targetStatus;
    private String targetType;
    private Long targetId;
    private String scopeType;
    private Long ownerUserId;
    private Long wsId;
    private Long projId;
    private Long noteFolderId;
    private Long photoAlbumId;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;

    public Long getRecordTargetId() { return recordTargetId; }
    public void setRecordTargetId(Long recordTargetId) { this.recordTargetId = recordTargetId; }
    public String getDraftKey() { return draftKey; }
    public void setDraftKey(String draftKey) { this.draftKey = draftKey; }
    public String getTargetStatus() { return targetStatus; }
    public void setTargetStatus(String targetStatus) { this.targetStatus = targetStatus; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getScopeType() { return scopeType; }
    public void setScopeType(String scopeType) { this.scopeType = scopeType; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }
    public Long getWsId() { return wsId; }
    public void setWsId(Long wsId) { this.wsId = wsId; }
    public Long getProjId() { return projId; }
    public void setProjId(Long projId) { this.projId = projId; }
    public Long getNoteFolderId() { return noteFolderId; }
    public void setNoteFolderId(Long noteFolderId) { this.noteFolderId = noteFolderId; }
    public Long getPhotoAlbumId() { return photoAlbumId; }
    public void setPhotoAlbumId(Long photoAlbumId) { this.photoAlbumId = photoAlbumId; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
