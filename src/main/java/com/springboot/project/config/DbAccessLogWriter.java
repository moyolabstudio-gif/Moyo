package com.springboot.project.config;

import java.io.StringReader;
import java.sql.PreparedStatement;
import java.sql.Types;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DbAccessLogWriter {

    private final JdbcTemplate jdbcTemplate;

    public DbAccessLogWriter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void write(
        String requestId,
        String httpMethod,
        String requestUri,
        String queryString,

        Long userId,
        String clientIp,

        String sqlId,
        String sqlType,
        String sqlText,

        long executionTimeMs,
        String resultStatus,
        String errorMessage,
        
        String serverName
    ) {
        String sql = """
            INSERT INTO DB_ACCESS_LOG (
                LOG_ID, REQUEST_ID, HTTP_METHOD, REQUEST_URI, QUERY_STRING,
                USER_ID, CLIENT_IP,
                SQL_ID, SQL_TYPE, SQL_TEXT,
                EXECUTION_TIME_MS, RESULT_STATUS, ERROR_MESSAGE,
                SERVER_NAME
            ) VALUES (
                SEQ_DB_ACCESS_LOG.NEXTVAL,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?
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
            ps.setString(7, sqlId);
            ps.setString(8, sqlType);

            if (sqlText == null) {
                ps.setNull(9, Types.CLOB);
            }
            else {
                ps.setCharacterStream(9, new StringReader(sqlText));
            }

            ps.setLong(10, executionTimeMs);
            ps.setString(11, resultStatus);
            ps.setString(12, errorMessage);
            ps.setString(13, serverName);

            return ps;
        });
    }
}