package com.springboot.project.dto;

import java.time.LocalDateTime;

public class noteVersionDTO {
    private Long noteVersionId;
    private Long noteId;
    private Integer versionNo;
    private String noteTitle;
    private String noteContent;
    private Long changedBy;
    private String changedByName;
    private LocalDateTime changedAt;
    private String changeType;
    private Long restoredFromVersionId;

    public Long getNoteVersionId() { return noteVersionId; }
    public void setNoteVersionId(Long noteVersionId) { this.noteVersionId = noteVersionId; }
    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }
    public Integer getVersionNo() { return versionNo; }
    public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
    public String getNoteTitle() { return noteTitle; }
    public void setNoteTitle(String noteTitle) { this.noteTitle = noteTitle; }
    public String getNoteContent() { return noteContent; }
    public void setNoteContent(String noteContent) { this.noteContent = noteContent; }
    public Long getChangedBy() { return changedBy; }
    public void setChangedBy(Long changedBy) { this.changedBy = changedBy; }
    public String getChangedByName() { return changedByName; }
    public void setChangedByName(String changedByName) { this.changedByName = changedByName; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
    public String getChangeType() { return changeType; }
    public void setChangeType(String changeType) { this.changeType = changeType; }
    public Long getRestoredFromVersionId() { return restoredFromVersionId; }
    public void setRestoredFromVersionId(Long restoredFromVersionId) { this.restoredFromVersionId = restoredFromVersionId; }
}
