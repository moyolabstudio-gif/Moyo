package com.springboot.project.config;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.springboot.project.dto.usersDto;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.net.InetAddress;
import java.net.UnknownHostException;

import jakarta.servlet.http.HttpSession;

@Component
public class RequestMdcFilter extends OncePerRequestFilter {

    private final HttpAccessLogWriter httpAccessLogWriter;

    public RequestMdcFilter(HttpAccessLogWriter httpAccessLogWriter) {
        this.httpAccessLogWriter = httpAccessLogWriter;
    }
    private String getSessionId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        return session.getId();
    }
    private String getAccessType(HttpServletRequest request) {
        String uri = request.getRequestURI();

        if (uri == null || uri.isBlank()) {
            return "OTHER";
        }

        if (uri.startsWith("/css/")
            || uri.startsWith("/js/")
            || uri.startsWith("/images/")
            || uri.startsWith("/img/")
            || uri.startsWith("/brand/")
            || uri.startsWith("/fonts/")
            || uri.endsWith(".css")
            || uri.endsWith(".js")
            || uri.endsWith(".png")
            || uri.endsWith(".jpg")
            || uri.endsWith(".jpeg")
            || uri.endsWith(".gif")
            || uri.endsWith(".svg")
            || uri.endsWith(".ico")
            || uri.endsWith(".ttf")
            || uri.endsWith(".woff")
            || uri.endsWith(".woff2")
        ) {
            return "STATIC";
        }

        if (uri.startsWith("/api/")) {
            return "API";
        }

        if ("GET".equalsIgnoreCase(request.getMethod())) {
            return "PAGE";
        }

        return "OTHER";
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();

        String sessionId = getSessionId(request);
        String userAgent = request.getHeader("User-Agent");
        String referer = request.getHeader("Referer");
        String accessType = getAccessType(request);

        try {
            MDC.put("requestId", requestId);
            MDC.put("requestMethod", request.getMethod());
            MDC.put("requestUri", request.getRequestURI());
            MDC.put("clientIp", getClientIp(request));

            filterChain.doFilter(request, response);

        } finally {
            long executionTimeMs = System.currentTimeMillis() - startTime;

            try {
                Long userId = getCurrentUserId();

                httpAccessLogWriter.write(
                    requestId,
                    request.getMethod(),
                    request.getRequestURI(),
                    request.getQueryString(),
                    userId,
                    getClientIp(request),
                    sessionId,
                    userAgent,
                    referer,
                    accessType,
                    response.getStatus(),
                    executionTimeMs
                );
            }
            catch (Exception e) {
                System.err.println(
                    "HTTP_ACCESS_LOG 저장 실패: "
                    + e.getMessage()
                );
            }

            MDC.remove("requestId");
            MDC.remove("requestMethod");
            MDC.remove("requestUri");
            MDC.remove("clientIp");
        }
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof usersDto user) {
            return user.getUserId();
        }

        return null;
    }

    private String getClientIp(HttpServletRequest request) {

        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }

        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        if (ip != null && ip.startsWith("::ffff:")) {
            ip = ip.substring(7);
        }

        if ("::1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
            return "127.0.0.1";
        }

        return ip;
    }
}