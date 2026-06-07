package com.springboot.project.dto;

import java.util.Date;
import java.util.List;

public class noteDTO {

    private Long noteId;
    private Long wsId;
    private Long projId;
    private Long userId;

    private String noteTitle;

    private String doneContent;
    private String nextContent;
    private String issueContent;
    private String changeLog;
    private String memo;

    private Date regDt;
    private Date updDt;

    // 화면 표시용
    private String userName;

    // 로그인 사용자 기준 고정 여부/순서
    private boolean pinned;
    private Integer pinOrder;

    // 첨부파일 목록
    private List<noteFileDTO> fileList;

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public Long getWsId() {
        return wsId;
    }

    public void setWsId(Long wsId) {
        this.wsId = wsId;
    }

    public Long getProjId() {
        return projId;
    }

    public void setProjId(Long projId) {
        this.projId = projId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getNoteTitle() {
        return noteTitle;
    }

    public void setNoteTitle(String noteTitle) {
        this.noteTitle = noteTitle;
    }

    public String getDoneContent() {
        return doneContent;
    }

    public void setDoneContent(String doneContent) {
        this.doneContent = doneContent;
    }

    public String getNextContent() {
        return nextContent;
    }

    public void setNextContent(String nextContent) {
        this.nextContent = nextContent;
    }

    public String getIssueContent() {
        return issueContent;
    }

    public void setIssueContent(String issueContent) {
        this.issueContent = issueContent;
    }

    public String getChangeLog() {
        return changeLog;
    }

    public void setChangeLog(String changeLog) {
        this.changeLog = changeLog;
    }

    public String getMemo() {
        return memo;
    }

    public void setMemo(String memo) {
        this.memo = memo;
    }

    public Date getRegDt() {
        return regDt;
    }

    public void setRegDt(Date regDt) {
        this.regDt = regDt;
    }

    public Date getUpdDt() {
        return updDt;
    }

    public void setUpdDt(Date updDt) {
        this.updDt = updDt;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public Integer getPinOrder() {
        return pinOrder;
    }

    public void setPinOrder(Integer pinOrder) {
        this.pinOrder = pinOrder;
    }

    public List<noteFileDTO> getFileList() {
        return fileList;
    }

    public void setFileList(List<noteFileDTO> fileList) {
        this.fileList = fileList;
    }

    @Override
    public String toString() {
        return "WorkNoteDTO{" +
                "noteId=" + noteId +
                ", wsId=" + wsId +
                ", projId=" + projId +
                ", userId=" + userId +
                ", noteTitle='" + noteTitle + '\'' +
                ", regDt=" + regDt +
                ", updDt=" + updDt +
                ", userName='" + userName + '\'' +
                '}';
    }
}
