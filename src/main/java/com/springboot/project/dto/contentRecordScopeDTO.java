package com.springboot.project.dto;

public class contentRecordScopeDTO {
    private String scopeType;
    private Long ownerUserId;
    private Long wsId;
    private Long projId;
    private Long leaderId;

    public String getScopeType() { return scopeType; }
    public void setScopeType(String scopeType) { this.scopeType = scopeType; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }
    public Long getWsId() { return wsId; }
    public void setWsId(Long wsId) { this.wsId = wsId; }
    public Long getProjId() { return projId; }
    public void setProjId(Long projId) { this.projId = projId; }
    public Long getLeaderId() { return leaderId; }
    public void setLeaderId(Long leaderId) { this.leaderId = leaderId; }
}
