package com.springboot.project.dto;

import java.time.LocalDateTime;

public class contentFileDTO {
    private Long contentFileId;
    private Long folderId;
    private Long originalFolderId;
    private String scopeType;
    private Long ownerUserId;
    private Long wsId;
    private Long projId;
    private String originalName;
    private String displayName;
    private String storedName;
    private String filePath;
    private String fileExt;
    private String mimeType;
    private Long fileSize;
    private String description;
    private Long createdBy;
    private String creatorName;
    private String creatorProfileImagePath;
    private String creatorProfileAvatarType;
    private LocalDateTime createdAt;
    private Long updatedBy;
    private LocalDateTime updatedAt;
    private LocalDateTime lastAccessedAt;
    private String sharedYn;
    private String deletedYn;
    private Long deletedBy;
    private LocalDateTime deletedAt;

    public Long getContentFileId(){return contentFileId;}
    public void setContentFileId(Long v){contentFileId=v;}
    public Long getFolderId(){return folderId;}
    public void setFolderId(Long v){folderId=v;}
    public Long getOriginalFolderId(){return originalFolderId;}
    public void setOriginalFolderId(Long v){originalFolderId=v;}
    public String getScopeType(){return scopeType;}
    public void setScopeType(String v){scopeType=v;}
    public Long getOwnerUserId(){return ownerUserId;}
    public void setOwnerUserId(Long v){ownerUserId=v;}
    public Long getWsId(){return wsId;}
    public void setWsId(Long v){wsId=v;}
    public Long getProjId(){return projId;}
    public void setProjId(Long v){projId=v;}
    public String getOriginalName(){return originalName;}
    public void setOriginalName(String v){originalName=v;}
    public String getDisplayName(){return displayName;}
    public void setDisplayName(String v){displayName=v;}
    public String getStoredName(){return storedName;}
    public void setStoredName(String v){storedName=v;}
    public String getFilePath(){return filePath;}
    public void setFilePath(String v){filePath=v;}
    public String getFileExt(){return fileExt;}
    public void setFileExt(String v){fileExt=v;}
    public String getMimeType(){return mimeType;}
    public void setMimeType(String v){mimeType=v;}
    public Long getFileSize(){return fileSize;}
    public void setFileSize(Long v){fileSize=v;}
    public String getDescription(){return description;}
    public void setDescription(String v){description=v;}
    public Long getCreatedBy(){return createdBy;}
    public void setCreatedBy(Long v){createdBy=v;}
    public String getCreatorName(){return creatorName;}
    public void setCreatorName(String v){creatorName=v;}
    public String getCreatorProfileImagePath(){return creatorProfileImagePath;}
    public void setCreatorProfileImagePath(String v){creatorProfileImagePath=v;}
    public String getCreatorProfileAvatarType(){return creatorProfileAvatarType;}
    public void setCreatorProfileAvatarType(String v){creatorProfileAvatarType=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public Long getUpdatedBy(){return updatedBy;}
    public void setUpdatedBy(Long v){updatedBy=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;}
    public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
    public LocalDateTime getLastAccessedAt(){return lastAccessedAt;}
    public void setLastAccessedAt(LocalDateTime v){lastAccessedAt=v;}
    public String getSharedYn(){return sharedYn;}
    public void setSharedYn(String v){sharedYn=v;}
    public String getDeletedYn(){return deletedYn;}
    public void setDeletedYn(String v){deletedYn=v;}
    public Long getDeletedBy(){return deletedBy;}
    public void setDeletedBy(Long v){deletedBy=v;}
    public LocalDateTime getDeletedAt(){return deletedAt;}
    public void setDeletedAt(LocalDateTime v){deletedAt=v;}
}
