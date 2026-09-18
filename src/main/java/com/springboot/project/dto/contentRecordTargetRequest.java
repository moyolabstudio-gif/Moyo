package com.springboot.project.dto;

public class contentRecordTargetRequest {
    private String targetType;
    private Long targetId;
    private String contextType;
    private Long contextId;
    private String draftKey;

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getContextType() { return contextType; }
    public void setContextType(String contextType) { this.contextType = contextType; }
    public Long getContextId() { return contextId; }
    public void setContextId(Long contextId) { this.contextId = contextId; }
    public String getDraftKey() { return draftKey; }
    public void setDraftKey(String draftKey) { this.draftKey = draftKey; }

    public contentRecordDraftRequest toDraftRequest() {
        contentRecordDraftRequest request = new contentRecordDraftRequest();
        request.setContextType(contextType);
        request.setContextId(contextId);
        request.setDraftKey(draftKey);
        return request;
    }
}
