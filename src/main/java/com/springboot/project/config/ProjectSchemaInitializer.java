package com.springboot.project.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Adds project-policy columns without requiring a destructive migration. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ProjectSchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public ProjectSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("PROJECTS", "PROJ_ICON",
                "ALTER TABLE PROJECTS ADD (PROJ_ICON VARCHAR2(40))");
        addColumnIfMissing("PROJECTS", "ACCESS_SCOPE",
                "ALTER TABLE PROJECTS ADD (ACCESS_SCOPE VARCHAR2(30))");

        // Legacy group projects were readable by every workspace member.
        // Preserve that behavior for existing rows; newly created projects are
        // explicitly normalized to PARTICIPANTS by ProjectPolicy.
        jdbcTemplate.update("""
                UPDATE PROJECTS
                   SET ACCESS_SCOPE = CASE
                       WHEN NVL(UPPER(PROJ_SCOPE), CASE WHEN WS_ID IS NULL THEN 'PERSONAL' ELSE 'GROUP' END) = 'PERSONAL'
                           THEN 'OWNER_ONLY'
                       ELSE 'WORKSPACE_READ'
                   END
                 WHERE ACCESS_SCOPE IS NULL
                """);

        // Normalize legacy project type codes to the new canonical taxonomy without
        // collapsing known old values to ETC.
        jdbcTemplate.update("""
                UPDATE PROJECTS
                   SET PROJ_TYPE = CASE UPPER(NVL(PROJ_CATEGORY, PROJ_TYPE))
                       WHEN 'PLANNING' THEN 'WORK'
                       WHEN 'EXAM' THEN 'STUDY'
                       WHEN 'MEETING' THEN 'EVENT'
                       WHEN 'RECORD' THEN 'CONTENT'
                       ELSE UPPER(NVL(PROJ_CATEGORY, PROJ_TYPE))
                   END,
                       PROJ_CATEGORY = CASE UPPER(NVL(PROJ_CATEGORY, PROJ_TYPE))
                       WHEN 'PLANNING' THEN 'WORK'
                       WHEN 'EXAM' THEN 'STUDY'
                       WHEN 'MEETING' THEN 'EVENT'
                       WHEN 'RECORD' THEN 'CONTENT'
                       ELSE UPPER(NVL(PROJ_CATEGORY, PROJ_TYPE))
                   END
                 WHERE UPPER(NVL(PROJ_CATEGORY, PROJ_TYPE)) IN ('PLANNING', 'EXAM', 'MEETING', 'RECORD')
                """);

        // Give legacy rows a useful default icon derived from the canonical type.
        jdbcTemplate.update("""
                UPDATE PROJECTS
                   SET PROJ_ICON = CASE UPPER(NVL(PROJ_CATEGORY, PROJ_TYPE))
                       WHEN 'WORK' THEN 'briefcase'
                       WHEN 'STUDY' THEN 'book-open'
                       WHEN 'TRAVEL' THEN 'plane'
                       WHEN 'EVENT' THEN 'calendar-star'
                       WHEN 'DEVELOPMENT' THEN 'code'
                       WHEN 'DESIGN' THEN 'pen-tool'
                       WHEN 'MUSIC' THEN 'music-note'
                       WHEN 'ART' THEN 'palette'
                       WHEN 'CONTENT' THEN 'video'
                       WHEN 'EXERCISE' THEN 'dumbbell'
                       WHEN 'HOBBY' THEN 'sparkles'
                       WHEN 'LIFE' THEN 'target'
                       ELSE 'shapes'
                   END
                 WHERE PROJ_ICON IS NULL
                """);
    }

    private void addColumnIfMissing(String table, String column, String ddl) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM USER_TAB_COLUMNS WHERE TABLE_NAME=? AND COLUMN_NAME=?",
                Integer.class,
                table,
                column);
        if (count != null && count == 0) {
            jdbcTemplate.execute(ddl);
        }
    }
}
