package com.springboot.project.config.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class SecurityAuditLogger {

    private static final Logger audit = LoggerFactory.getLogger(SecurityAuditLogger.class);

    public void success(String event, Long userId, HttpServletRequest request) {
        write("SUCCESS", event, userId, request, null);
    }

    public void failure(String event, Long userId, HttpServletRequest request, String reason) {
        write("FAILURE", event, userId, request, reason);
    }

    public void denied(String event, Long userId, HttpServletRequest request, String reason) {
        write("DENIED", event, userId, request, reason);
    }

    private void write(
            String result,
            String event,
            Long userId,
            HttpServletRequest request,
            String reason) {

        String ip = request == null || request.getRemoteAddr() == null
                ? "-"
                : request.getRemoteAddr();

        String method = request == null || request.getMethod() == null
                ? "-"
                : request.getMethod();

        String uri = request == null || request.getRequestURI() == null
                ? "-"
                : request.getRequestURI();

        String safeEvent = token(event);
        String safeReason = token(reason);

        audit.info(
                "result={} event={} userId={} ip={} method={} uri={} reason={}",
                result,
                safeEvent,
                userId == null ? "-" : userId,
                ip,
                method,
                uri,
                safeReason
        );
    }

    private String token(String value) {
        if (value == null || value.isBlank()) return "-";
        String normalized = value.replaceAll("[\\r\\n\\t]", "_");
        return normalized.length() > 80 ? normalized.substring(0, 80) : normalized;
    }
}
