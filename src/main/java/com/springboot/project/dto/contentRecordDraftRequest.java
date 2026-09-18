package com.springboot.project.dto;

public class contentRecordDraftRequest {
    private String draftKey;
    private String contextType;
    private Long contextId;

    public String getDraftKey() { return draftKey; }
    public void setDraftKey(String draftKey) { this.draftKey = draftKey; }
    public String getContextType() { return contextType; }
    public void setContextType(String contextType) { this.contextType = contextType; }
    public Long getContextId() { return contextId; }
    public void setContextId(Long contextId) { this.contextId = contextId; }
}
