package com.springboot.project.config;

import java.util.List;
import java.util.Properties;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Plugin;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.springboot.project.dto.usersDto;

import jakarta.servlet.http.HttpServletRequest;

@Intercepts({
    @Signature(
        type = Executor.class,
        method = "update",
        args = {
            MappedStatement.class,
            Object.class
        }
    ),
    @Signature(
        type = Executor.class,
        method = "query",
        args = {
            MappedStatement.class,
            Object.class,
            RowBounds.class,
            ResultHandler.class
        }
    )
})

public class DbAccessLogInterceptor implements Interceptor {

    private final DbAccessLogWriter logWriter;

    public DbAccessLogInterceptor(DbAccessLogWriter logWriter) {
        this.logWriter = logWriter;
    }

    @Override
    public Object intercept(Invocation invocation) throws Throwable {

        long start = System.currentTimeMillis();

        MappedStatement mappedStatement = (MappedStatement) invocation.getArgs()[0];

        Object parameter = invocation.getArgs()[1];

        BoundSql boundSql = mappedStatement.getBoundSql(parameter);

        String sql = normalizeSql(boundSql.getSql());

        String sqlId = mappedStatement.getId();

        String sqlType = mappedStatement.getSqlCommandType().name();

        try {
            Object result = invocation.proceed();

            long executionTime = System.currentTimeMillis() - start;

            writeLog(
                mappedStatement,
                sql,
                sqlId,
                sqlType,
                executionTime,
                "SUCCESS",
                null
            );

            return result;

        }
        catch (Throwable e) {
            long executionTime = System.currentTimeMillis() - start;

            writeLog(
                mappedStatement,
                sql,
                sqlId,
                sqlType,
                executionTime,
                "FAIL",
                e.getMessage()
            );

            throw e;
        }
    }

    private void writeLog(
        MappedStatement mappedStatement,
        String sql,
        String sqlId,
        String sqlType,
        long executionTime,
        String resultStatus,
        String errorMessage
    ) {
        try {
            RequestAttributes attributes = RequestContextHolder.getRequestAttributes();

            HttpServletRequest request = null;

            if (attributes instanceof ServletRequestAttributes servletAttributes) {
                request = servletAttributes.getRequest();
            }

            String requestId = MDC.get("requestId");
            String method = MDC.get("requestMethod");
            String uri = MDC.get("requestUri");
            String clientIp = MDC.get("clientIp");

            String queryString = null;

            if (request != null) {
                queryString = request.getQueryString();
            }

            Long userId = getCurrentUserId();

            String serverName =
                    System.getProperty("HOSTNAME");

            if (serverName == null || serverName.isBlank()) {
                serverName = "LOCAL";
            }

            logWriter.write(
                requestId,
                method,
                uri,
                queryString,

                userId,
                clientIp,

                sqlId,
                sqlType,
                sql,

                executionTime,
                resultStatus,
                truncate(errorMessage, 2000),

                serverName
            );
        }
        catch (Exception logException) {
            /*
             * 로그 저장 실패 때문에
             * 원래 DB 업무가 실패하면 안 된다.
             */
            System.err.println(
                "DB_ACCESS_LOG 저장 실패: " + logException.getMessage()
            );
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

        Object details = authentication.getDetails();

        if (details instanceof Long userId) {
            return userId;
        }

        return null;
    }

    private String normalizeSql(String sql) {

        if (sql == null) {
            return null;
        }

        return sql.replaceAll("\\s+", " ").trim();
    }

    private String truncate(String value, int maxLength) {

        if (value == null) {
            return null;
        }

        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength);
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // 현재 사용하지 않음
    }
}