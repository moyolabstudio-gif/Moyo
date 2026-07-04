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
    private String shareStatus;
    private Long respondedBy;
    private Date respondedAt;
    private String contentTitle;
    private String requesterName;
    private String requesterEmail;
    private String targetName;
    private String targetSubtext;
    private Integer contentCount;
    private String shareIds;
    private String releaseableYn;
    private String calendarStartDt;
    private String calendarEndDt;
    private String calendarLocationText;
    private String calendarLocationAddress;
    private String calendarAttendeeYn;

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
    public String getShareStatus() { return shareStatus; }
    public void setShareStatus(String shareStatus) { this.shareStatus = shareStatus; }
    public Long getRespondedBy() { return respondedBy; }
    public void setRespondedBy(Long respondedBy) { this.respondedBy = respondedBy; }
    public Date getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Date respondedAt) { this.respondedAt = respondedAt; }
    public String getContentTitle() { return contentTitle; }
    public void setContentTitle(String contentTitle) { this.contentTitle = contentTitle; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }
    public String getTargetSubtext() { return targetSubtext; }
    public void setTargetSubtext(String targetSubtext) { this.targetSubtext = targetSubtext; }
    public Integer getContentCount() { return contentCount; }
    public void setContentCount(Integer contentCount) { this.contentCount = contentCount; }
    public String getShareIds() { return shareIds; }
    public void setShareIds(String shareIds) { this.shareIds = shareIds; }
    public String getReleaseableYn() { return releaseableYn; }
    public void setReleaseableYn(String releaseableYn) { this.releaseableYn = releaseableYn; }
    public String getCalendarStartDt() { return calendarStartDt; }
    public void setCalendarStartDt(String calendarStartDt) { this.calendarStartDt = calendarStartDt; }
    public String getCalendarEndDt() { return calendarEndDt; }
    public void setCalendarEndDt(String calendarEndDt) { this.calendarEndDt = calendarEndDt; }
    public String getCalendarLocationText() { return calendarLocationText; }
    public void setCalendarLocationText(String calendarLocationText) { this.calendarLocationText = calendarLocationText; }
    public String getCalendarLocationAddress() { return calendarLocationAddress; }
    public void setCalendarLocationAddress(String calendarLocationAddress) { this.calendarLocationAddress = calendarLocationAddress; }
    public String getCalendarAttendeeYn() { return calendarAttendeeYn; }
    public void setCalendarAttendeeYn(String calendarAttendeeYn) { this.calendarAttendeeYn = calendarAttendeeYn; }
}
