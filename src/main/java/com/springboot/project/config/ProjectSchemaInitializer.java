package com.springboot.project.config;

import com.springboot.project.service.ProjectTypeCatalog;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/** Adds/migrates project-policy columns and constraints without destructive data loss. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ProjectSchemaInitializer implements ApplicationRunner {

    private static final String PROJECT_CATEGORY_CONSTRAINT = "CK_PROJECT_CATEGORY";

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
        // explicitly normalized by ProjectPolicy.
        jdbcTemplate.update("""
                UPDATE PROJECTS
                   SET ACCESS_SCOPE = CASE
                       WHEN NVL(UPPER(PROJ_SCOPE), CASE WHEN WS_ID IS NULL THEN 'PERSONAL' ELSE 'GROUP' END) = 'PERSONAL'
                           THEN 'OWNER_ONLY'
                       ELSE 'WORKSPACE_READ'
                   END
                 WHERE ACCESS_SCOPE IS NULL
                """);

        /*
         * PROJ_CATEGORY used to have a narrower CHECK constraint than the current
         * ProjectTypeCatalog. Create/settings now persist the same canonical type
         * code to PROJ_TYPE and PROJ_CATEGORY, so the DB constraint must follow the
         * catalog instead of keeping a stale hard-coded list.
         *
         * Do data normalization before recreating the constraint so old rows never
         * block application startup.
         */
        normalizeLegacyProjectCategories();
        ensureProjectCategoryConstraint();

        // Give rows without an explicit icon the current catalog default.
        backfillProjectIcons();
    }

    private void normalizeLegacyProjectCategories() {
        String canonicalCodes = canonicalTypeSqlList();

        // Preserve a valid PROJ_TYPE first. Only known obsolete aliases are mapped;
        // any unknown historical value falls back to ETC instead of violating the DB.
        String sql = """
                UPDATE PROJECTS
                   SET PROJ_CATEGORY = CASE
                       WHEN UPPER(TRIM(PROJ_TYPE)) IN (%s)
                           THEN UPPER(TRIM(PROJ_TYPE))
                       WHEN UPPER(TRIM(PROJ_CATEGORY)) = 'CONTENT'
                           THEN 'RECORD'
                       WHEN UPPER(TRIM(PROJ_CATEGORY)) = 'ART'
                           THEN 'DESIGN'
                       ELSE 'ETC'
                   END
                 WHERE PROJ_CATEGORY IS NOT NULL
                   AND UPPER(TRIM(PROJ_CATEGORY)) NOT IN (%s)
                """.formatted(canonicalCodes, canonicalCodes);
        jdbcTemplate.update(sql);

        // If a legacy/blank PROJ_TYPE remains, recover it from the now-normalized
        // category. Canonical values such as PLANNING/EXAM/MEETING/RECORD must NOT
        // be collapsed to another type.
        String syncTypeSql = """
                UPDATE PROJECTS
                   SET PROJ_TYPE = UPPER(TRIM(PROJ_CATEGORY))
                 WHERE PROJ_CATEGORY IS NOT NULL
                   AND UPPER(TRIM(PROJ_CATEGORY)) IN (%s)
                   AND (PROJ_TYPE IS NULL OR UPPER(TRIM(PROJ_TYPE)) NOT IN (%s))
                """.formatted(canonicalCodes, canonicalCodes);
        jdbcTemplate.update(syncTypeSql);
    }

    private void ensureProjectCategoryConstraint() {
        String currentCondition = findProjectCategoryConstraintCondition();

        List<String> canonicalCodes = ProjectTypeCatalog.types().stream()
                .map(ProjectTypeCatalog.TypeDefinition::code)
                .toList();

        boolean hasAllCanonicalValues = currentCondition != null
                && canonicalCodes.stream()
                        .allMatch(code -> currentCondition.contains("'" + code + "'"));

        if (hasAllCanonicalValues) {
            return;
        }

        if (currentCondition != null) {
            jdbcTemplate.execute("ALTER TABLE PROJECTS DROP CONSTRAINT " + PROJECT_CATEGORY_CONSTRAINT);
        }

        jdbcTemplate.execute(
                "ALTER TABLE PROJECTS ADD CONSTRAINT " + PROJECT_CATEGORY_CONSTRAINT
                        + " CHECK (PROJ_CATEGORY IN (" + canonicalTypeSqlList() + "))");
    }

    private String findProjectCategoryConstraintCondition() {
        try {
            return jdbcTemplate.queryForObject("""
                    SELECT SEARCH_CONDITION_VC
                      FROM USER_CONSTRAINTS
                     WHERE TABLE_NAME = 'PROJECTS'
                       AND CONSTRAINT_NAME = ?
                       AND CONSTRAINT_TYPE = 'C'
                    """, String.class, PROJECT_CATEGORY_CONSTRAINT);
        } catch (EmptyResultDataAccessException ignored) {
            return null;
        }
    }

    private void backfillProjectIcons() {
        StringBuilder caseSql = new StringBuilder("CASE UPPER(NVL(PROJ_CATEGORY, PROJ_TYPE)) ");
        for (ProjectTypeCatalog.TypeDefinition type : ProjectTypeCatalog.types()) {
            caseSql.append("WHEN '")
                    .append(type.code().replace("'", "''"))
                    .append("' THEN '")
                    .append(type.defaultIcon().replace("'", "''"))
                    .append("' ");
        }
        caseSql.append("ELSE 'shapes' END");

        jdbcTemplate.update(
                "UPDATE PROJECTS SET PROJ_ICON = " + caseSql + " WHERE PROJ_ICON IS NULL");
    }

    private String canonicalTypeSqlList() {
        return ProjectTypeCatalog.types().stream()
                .map(ProjectTypeCatalog.TypeDefinition::code)
                .map(code -> "'" + code.replace("'", "''") + "'")
                .collect(Collectors.joining(", "));
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
