package com.springboot.project.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/** 그룹 프로필 수정 결과. 컨트롤러는 HTTP 응답 변환만 담당한다. */
public class workspaceUpdateResult {
    private final boolean success;
    private final String code;
    private final String message;

    private workspaceUpdateResult(boolean success, String code, String message) {
        this.success = success;
        this.code = code;
        this.message = message;
    }

    public static workspaceUpdateResult success(String message) {
        return new workspaceUpdateResult(true, "SUCCESS", message);
    }

    public static workspaceUpdateResult fail(String code, String message) {
        return new workspaceUpdateResult(false, code, message);
    }

    public boolean isSuccess() { return success; }
    public String getCode() { return code; }
    public String getMessage() { return message; }

    public Map<String, Object> toMap() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", success);
        response.put("code", code);
        response.put("message", message);
        return response;
    }
}
