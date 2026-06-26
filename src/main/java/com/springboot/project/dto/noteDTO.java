package com.springboot.project.dto;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class noteDTO {

    private Long noteId;
    private Long wsId;
    private Long projId;
    private Long userId;
    private String scopeType;

    private String noteTitle;

    private String doneContent;
    private String nextContent;
    private String issueContent;
    private String changeLog;
    private String memo;
    private String previewContent;
    private String category;
    private String icon;
    private Long folderId;
    private String folderName;
    private String folderPath;
    private String workspaceName;
    private String projectName;

    // 목록에서 같은 노트가 친구/워크스페이스/프로젝트 경로로 동시에 보일 때 표시할 공유 출처
    private String shareScopeTypes;
    private String shareScopeNames;

    private Date regDt;
    private Date updDt;
    private Long updatedBy;

    // 화면 표시용
    private String userName;
    private String profileImagePath;
    private String updatedByName;

    // 로그인 사용자 기준 고정 여부/순서
    private boolean pinned;
    private Integer pinOrder;

    // 로그인 사용자 기준 권한
    private boolean canManage;
    private boolean canEdit;
    private boolean canManageSpace;
    private boolean ownedByMe;

    // 목록 미리보기용 첨부/피드백 정보
    private Integer attachmentCount;
    private Integer feedbackCount;
    private Integer tableCount;
    private Integer imageCount;
    private Integer videoCount;
    private String firstAttachmentName;
    private Long previewImageFileId;

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

    public String getScopeType() {
        return scopeType;
    }

    public void setScopeType(String scopeType) {
        this.scopeType = scopeType;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCategoryLabel() {
        if (category == null) return "일반";
        return switch (category.toUpperCase()) {
            case "MEETING" -> "회의";
            case "TASK" -> "업무";
            case "ISSUE" -> "오류/이슈";
            case "REFERENCE" -> "자료";
            default -> "일반";
        };
    }

    public String getPreviewContent() {
        return previewContent;
    }

    public void setPreviewContent(String previewContent) {
        this.previewContent = previewContent;
    }

    public String getPreviewText() {
        if (previewContent == null || previewContent.isBlank()) {
            return "내용이 비어있는 노트입니다.";
        }
        return previewContent;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }
    public String getFolderName() { return folderName; }
    public void setFolderName(String folderName) { this.folderName = folderName; }
    public String getWorkspaceName(){return workspaceName;} public void setWorkspaceName(String v){workspaceName=v;}
    public String getProjectName(){return projectName;} public void setProjectName(String v){projectName=v;}

    public String getShareScopeTypes() { return shareScopeTypes; }
    public void setShareScopeTypes(String shareScopeTypes) { this.shareScopeTypes = shareScopeTypes; }
    public String getShareScopeNames() { return shareScopeNames; }
    public void setShareScopeNames(String shareScopeNames) { this.shareScopeNames = shareScopeNames; }

    public List<ShareScopeBadge> getShareScopeBadges() {
        List<ShareScopeBadge> badges = new ArrayList<>();
        if (shareScopeTypes == null || shareScopeTypes.isBlank()) {
            String fallbackType = scopeType == null ? "PRIVATE" : scopeType;
            String fallbackName = switch (fallbackType.toUpperCase()) {
                case "WS" -> workspaceName == null || workspaceName.isBlank() ? "워크스페이스" : workspaceName;
                case "PROJ" -> projectName == null || projectName.isBlank() ? "프로젝트" : projectName;
                default -> "개인";
            };
            badges.add(new ShareScopeBadge(fallbackType, fallbackName));
            return badges;
        }

        String[] types = shareScopeTypes.split("\\|");
        String[] names = shareScopeNames == null ? new String[0] : shareScopeNames.split("\\|", -1);
        for (int i = 0; i < types.length; i++) {
            String type = types[i] == null ? "" : types[i].trim();
            if (type.isBlank()) continue;
            String name = i < names.length ? names[i].trim() : "";
            badges.add(new ShareScopeBadge(type, name));
        }
        return badges;
    }

    public static class ShareScopeBadge {
        private final String type;
        private final String name;

        public ShareScopeBadge(String type, String name) {
            this.type = type == null ? "PRIVATE" : type.toUpperCase();
            this.name = name == null || name.isBlank() ? defaultName(this.type) : name;
        }

        public String getType() { return type; }
        public String getName() { return name; }
        public String getLabel() { return defaultName(type); }
        public String getCssClass() {
            return switch (type) {
                case "WS" -> "ws";
                case "PROJ" -> "proj";
                default -> "private";
            };
        }

        private static String defaultName(String type) {
            return switch (type) {
                case "WS" -> "워크스페이스";
                case "PROJ" -> "프로젝트";
                default -> "개인";
            };
        }
    }

    public String getFolderPath() { return folderPath; }
    public void setFolderPath(String folderPath) { this.folderPath = folderPath; }

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


    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public String getUpdatedByName() {
        return updatedByName;
    }

    public void setUpdatedByName(String updatedByName) {
        this.updatedByName = updatedByName;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getProfileImagePath() {
        return profileImagePath;
    }

    public void setProfileImagePath(String profileImagePath) {
        this.profileImagePath = profileImagePath;
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

    public boolean isCanManage() {
        return canManage;
    }

    public void setCanManage(boolean canManage) {
        this.canManage = canManage;
    }

    public boolean isCanEdit() {
        return canEdit;
    }

    public void setCanEdit(boolean canEdit) {
        this.canEdit = canEdit;
    }

    public boolean isCanManageSpace() {
        return canManageSpace;
    }

    public void setCanManageSpace(boolean canManageSpace) {
        this.canManageSpace = canManageSpace;
    }

    public boolean isOwnedByMe() {
        return ownedByMe;
    }

    public void setOwnedByMe(boolean ownedByMe) {
        this.ownedByMe = ownedByMe;
    }


    public Integer getAttachmentCount() {
        if (attachmentCount != null) return attachmentCount;
        return fileList == null ? 0 : fileList.size();
    }

    public void setAttachmentCount(Integer attachmentCount) {
        this.attachmentCount = attachmentCount;
    }

    public Integer getFeedbackCount() {
        return feedbackCount == null ? 0 : feedbackCount;
    }

    public void setFeedbackCount(Integer feedbackCount) {
        this.feedbackCount = feedbackCount;
    }

    public int getTableCount() {
        return tableCount == null ? 0 : tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public int getImageCount() {
        return imageCount == null ? 0 : imageCount;
    }

    public void setImageCount(Integer imageCount) {
        this.imageCount = imageCount;
    }

    public int getVideoCount() {
        return videoCount == null ? 0 : videoCount;
    }

    public void setVideoCount(Integer videoCount) {
        this.videoCount = videoCount;
    }

    public String getFirstAttachmentName() {
        if (firstAttachmentName != null && !firstAttachmentName.isBlank()) return firstAttachmentName;
        if (fileList == null || fileList.isEmpty()) return null;
        return fileList.get(0).getOriginFileName();
    }

    public void setFirstAttachmentName(String firstAttachmentName) {
        this.firstAttachmentName = firstAttachmentName;
    }

    public Long getPreviewImageFileId() {
        if (previewImageFileId != null) return previewImageFileId;
        if (fileList == null) return null;
        for (noteFileDTO file : fileList) {
            if (file != null && file.isImageFile()) return file.getFileId();
        }
        return null;
    }

    public void setPreviewImageFileId(Long previewImageFileId) {
        this.previewImageFileId = previewImageFileId;
    }

    /**
     * 목록 미리보기 이미지는 첨부 이미지 우선으로 사용합니다.
     * data:image;base64 인라인 이미지를 그대로 data attribute에 싣으면
     * HTML 응답이 비정상적으로 커지고, src 앞에 따옴표가 섞일 때
     * /note/"data:image... 형태의 404까지 발생합니다.
     */
    public String getPreviewImageUrl() {
        Long imageFileId = getPreviewImageFileId();
        if (imageFileId != null) return "/note/view?fileId=" + imageFileId;

        String inlineImage = extractFirstImageUrl(memo);
        if (inlineImage == null || inlineImage.isBlank()) return null;

        String lower = inlineImage.toLowerCase();
        if (lower.startsWith("data:image/")) return null;

        return inlineImage;
    }

    private String extractFirstImageUrl(String html) {
        if (html == null || html.isBlank()) return null;

        int limit = Math.min(html.length(), 5000);
        String source = html.substring(0, limit);

        Pattern quoted = Pattern.compile("(?is)<img\\b[^>]*?\\bsrc\\s*=\\s*([\"'])\\s*(.*?)\\s*\\1");
        Matcher quotedMatcher = quoted.matcher(source);
        if (quotedMatcher.find()) return decodeBasicHtmlEntities(quotedMatcher.group(2)).trim();

        Pattern unquoted = Pattern.compile("(?is)<img\\b[^>]*?\\bsrc\\s*=\\s*([^\\s>]+)");
        Matcher unquotedMatcher = unquoted.matcher(source);
        return unquotedMatcher.find() ? decodeBasicHtmlEntities(unquotedMatcher.group(1)).trim() : null;
    }

    private String decodeBasicHtmlEntities(String value) {
        if (value == null) return null;
        return value
                .replace("&quot;", "\"")
                .replace("&#34;", "\"")
                .replace("&#x22;", "\"")
                .replace("&#X22;", "\"")
                .replace("&apos;", "'")
                .replace("&#39;", "'")
                .replace("&#x27;", "'")
                .replace("&#X27;", "'")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
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
                ", scopeType='" + scopeType + '\'' +
                ", noteTitle='" + noteTitle + '\'' +
                ", regDt=" + regDt +
                ", updDt=" + updDt +
                ", userName='" + userName + '\'' +
                '}';
    }
}
