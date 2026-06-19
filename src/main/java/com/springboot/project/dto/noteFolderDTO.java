package com.springboot.project.dto;

import java.util.Date;

public class noteFolderDTO {
    private Long folderId;
    private Long parentFolderId;
    private Long ownerUserId;
    private Long wsId;
    private Long projId;
    private String scopeType;
    private String folderName;
    private Integer sortOrder;
    private Integer depth;
    private String folderPath;
    private Date regDt;
    private Date updDt;
    public Long getFolderId(){return folderId;} public void setFolderId(Long v){folderId=v;}
    public Long getParentFolderId(){return parentFolderId;} public void setParentFolderId(Long v){parentFolderId=v;}
    public Long getOwnerUserId(){return ownerUserId;} public void setOwnerUserId(Long v){ownerUserId=v;}
    public Long getWsId(){return wsId;} public void setWsId(Long v){wsId=v;}
    public Long getProjId(){return projId;} public void setProjId(Long v){projId=v;}
    public String getScopeType(){return scopeType;} public void setScopeType(String v){scopeType=v;}
    public String getFolderName(){return folderName;} public void setFolderName(String v){folderName=v;}
    public Integer getSortOrder(){return sortOrder;} public void setSortOrder(Integer v){sortOrder=v;}
    public Integer getDepth(){return depth;} public void setDepth(Integer v){depth=v;}
    public String getFolderPath(){return folderPath;} public void setFolderPath(String v){folderPath=v;}
    public Date getRegDt(){return regDt;} public void setRegDt(Date v){regDt=v;}
    public Date getUpdDt(){return updDt;} public void setUpdDt(Date v){updDt=v;}
}
