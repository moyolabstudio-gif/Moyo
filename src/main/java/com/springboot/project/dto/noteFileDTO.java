package com.springboot.project.dto;

import java.util.Date;

public class noteFileDTO {

    private Long fileId;
    private Long noteId;

    private String originFileName;
    private String storedFileName;
    private String filePath;
    private Long fileSize;
    private String fileExt;

    private Date regDt;

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public String getOriginFileName() {
        return originFileName;
    }

    public void setOriginFileName(String originFileName) {
        this.originFileName = originFileName;
    }

    public String getStoredFileName() {
        return storedFileName;
    }

    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileExt() {
        return fileExt;
    }

    public void setFileExt(String fileExt) {
        this.fileExt = fileExt;
    }


    public boolean isImageFile() {
        String ext = fileExt;
        if ((ext == null || ext.isBlank()) && originFileName != null) {
            int dot = originFileName.lastIndexOf('.');
            if (dot >= 0 && dot < originFileName.length() - 1) {
                ext = originFileName.substring(dot + 1);
            }
        }
        if (ext == null) return false;
        String normalized = ext.trim().toLowerCase();
        if (normalized.startsWith(".")) normalized = normalized.substring(1);
        return normalized.equals("jpg") || normalized.equals("jpeg")
                || normalized.equals("png") || normalized.equals("gif")
                || normalized.equals("webp") || normalized.equals("bmp");
    }

    public Date getRegDt() {
        return regDt;
    }

    public void setRegDt(Date regDt) {
        this.regDt = regDt;
    }

    @Override
    public String toString() {
        return "WorkNoteFileDTO{" +
                "fileId=" + fileId +
                ", noteId=" + noteId +
                ", originFileName='" + originFileName + '\'' +
                ", storedFileName='" + storedFileName + '\'' +
                ", filePath='" + filePath + '\'' +
                ", fileSize=" + fileSize +
                ", fileExt='" + fileExt + '\'' +
                '}';
    }
}
