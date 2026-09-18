package com.springboot.project.dto;

public class contentRecordPermissionDTO {
    private Long recordTargetId;
    private String targetStatus;
    private String targetType;
    private Long targetId;
    private String ownerYn;
    private String canViewYn;
    private String canEditYn;
    private String canDeleteYn;
    private String permissionSource;

    public Long getRecordTargetId() { return recordTargetId; }
    public void setRecordTargetId(Long recordTargetId) { this.recordTargetId = recordTargetId; }
    public String getTargetStatus() { return targetStatus; }
    public void setTargetStatus(String targetStatus) { this.targetStatus = targetStatus; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getOwnerYn() { return ownerYn; }
    public void setOwnerYn(String ownerYn) { this.ownerYn = ownerYn; }
    public String getCanViewYn() { return canViewYn; }
    public void setCanViewYn(String canViewYn) { this.canViewYn = canViewYn; }
    public String getCanEditYn() { return canEditYn; }
    public void setCanEditYn(String canEditYn) { this.canEditYn = canEditYn; }
    public String getCanDeleteYn() { return canDeleteYn; }
    public void setCanDeleteYn(String canDeleteYn) { this.canDeleteYn = canDeleteYn; }
    public String getPermissionSource() { return permissionSource; }
    public void setPermissionSource(String permissionSource) { this.permissionSource = permissionSource; }

    public boolean canView() { return "Y".equalsIgnoreCase(canViewYn); }
    public boolean canEdit() { return "Y".equalsIgnoreCase(canEditYn); }
    public boolean canDelete() { return "Y".equalsIgnoreCase(canDeleteYn); }
}
