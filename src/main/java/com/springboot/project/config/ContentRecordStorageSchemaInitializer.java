package com.springboot.project.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ContentRecordStorageSchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public ContentRecordStorageSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM USER_TAB_COLUMNS WHERE TABLE_NAME='CONTENT_RECORD_TARGETS' AND COLUMN_NAME='FILE_FOLDER_ID'",
                Integer.class);
        if (count != null && count == 0) {
            jdbcTemplate.execute("ALTER TABLE CONTENT_RECORD_TARGETS ADD (FILE_FOLDER_ID NUMBER)");
        }
    }
}
