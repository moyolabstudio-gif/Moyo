package com.springboot.project.config;

import java.sql.PreparedStatement;
import java.sql.Types;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class HttpAccessLogWriter {

    private final JdbcTemplate jdbcTemplate;

    public HttpAccessLogWriter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void write(
        String requestId,
        String httpMethod,
        String requestUri,
        String queryString,
        Long userId,
        String clientIp,
        String sessionId,
        String userAgent,
        String referer,
        String accessType,
        int statusCode,
        long executionTimeMs
    ) {
        String sql = """
            INSERT INTO HTTP_ACCESS_LOG (
                LOG_ID,
                REQUEST_ID,
                HTTP_METHOD,
                REQUEST_URI,
                QUERY_STRING,
                USER_ID,
                CLIENT_IP,
                SESSION_ID,
                USER_AGENT,
                REFERER,
                ACCESS_TYPE,
                STATUS_CODE,
                EXECUTION_TIME_MS
            ) VALUES (
                SEQ_HTTP_ACCESS_LOG.NEXTVAL,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            """;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql);

            ps.setString(1, requestId);
            ps.setString(2, httpMethod);
            ps.setString(3, requestUri);
            ps.setString(4, queryString);

            if (userId == null) {
                ps.setNull(5, Types.NUMERIC);
            }
            else {
                ps.setLong(5, userId);
            }

            ps.setString(6, clientIp);
            ps.setString(7, sessionId);
            ps.setString(8, userAgent);
            ps.setString(9, referer);
            ps.setString(10, accessType);
            ps.setInt(11, statusCode);
            ps.setLong(12, executionTimeMs);

            return ps;
        });
    }
}