package com.springboot.project.dto;

import java.time.LocalDateTime;
public class contentFileFolderDTO {
    private Long folderId,parentFolderId,originalParentFolderId,ownerUserId,wsId,projId,createdBy,updatedBy,deletedBy;
    private String scopeType,folderName,deletedYn;
    private Integer sortOrder,childFolderCount,fileCount;
    private LocalDateTime createdAt,updatedAt,deletedAt;
    public Long getFolderId(){return folderId;} public void setFolderId(Long v){folderId=v;}
    public Long getParentFolderId(){return parentFolderId;} public void setParentFolderId(Long v){parentFolderId=v;}
    public Long getOriginalParentFolderId(){return originalParentFolderId;} public void setOriginalParentFolderId(Long v){originalParentFolderId=v;}
    public Long getOwnerUserId(){return ownerUserId;} public void setOwnerUserId(Long v){ownerUserId=v;}
    public Long getWsId(){return wsId;} public void setWsId(Long v){wsId=v;}
    public Long getProjId(){return projId;} public void setProjId(Long v){projId=v;}
    public Long getCreatedBy(){return createdBy;} public void setCreatedBy(Long v){createdBy=v;}
    public Long getUpdatedBy(){return updatedBy;} public void setUpdatedBy(Long v){updatedBy=v;}
    public Long getDeletedBy(){return deletedBy;} public void setDeletedBy(Long v){deletedBy=v;}
    public String getScopeType(){return scopeType;} public void setScopeType(String v){scopeType=v;}
    public String getFolderName(){return folderName;} public void setFolderName(String v){folderName=v;}
    public String getDeletedYn(){return deletedYn;} public void setDeletedYn(String v){deletedYn=v;}
    public Integer getSortOrder(){return sortOrder;} public void setSortOrder(Integer v){sortOrder=v;}
    public Integer getChildFolderCount(){return childFolderCount;} public void setChildFolderCount(Integer v){childFolderCount=v;}
    public Integer getFileCount(){return fileCount;} public void setFileCount(Integer v){fileCount=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
    public LocalDateTime getDeletedAt(){return deletedAt;} public void setDeletedAt(LocalDateTime v){deletedAt=v;}
}
