package com.springboot.project.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CollaborationActivityService {

    private static final Logger log = LoggerFactory.getLogger(CollaborationActivityService.class);
    private final JdbcTemplate jdbcTemplate;
    private final AtomicBoolean schemaReady = new AtomicBoolean(false);
    private final AtomicBoolean readSchemaReady = new AtomicBoolean(false);
    private final AtomicBoolean recordItemReadSchemaReady = new AtomicBoolean(false);

    public CollaborationActivityService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String scopeType, Long wsId, Long projId, Long actorUserId,
                       String activityType, String targetType, String targetId,
                       String targetTitle, String detail, String requestUri) {
        if (actorUserId == null) return;
        String normalizedScope = upper(scopeType);
        if (!"WORKSPACE".equals(normalizedScope) && !"PROJECT".equals(normalizedScope)) return;
        if ("WORKSPACE".equals(normalizedScope) && wsId == null) return;
        if ("PROJECT".equals(normalizedScope) && projId == null) return;

        try {
            ensureSchema();
        } catch (Exception e) {
            // 과거 패치에서 테이블/시퀀스 중 일부만 만들어진 경우에도 기록을 계속 시도한다.
            if (!activityTableExists() || !activitySequenceExists()) {
                log.warn("[최근활동] 스키마 준비 실패 - 기록 생략: {}", e.getMessage());
                return;
            }
        }
        Map<String, Object> actor = loadActor(normalizedScope, wsId, projId, actorUserId);
        try {
            jdbcTemplate.update(
            "INSERT INTO COLLAB_ACTIVITY_LOG (ACTIVITY_ID, SCOPE_TYPE, WS_ID, PROJ_ID, ACTOR_USER_ID, ACTOR_NAME, ACTOR_PROFILE_PATH, ACTIVITY_TYPE, TARGET_TYPE, TARGET_ID, TARGET_TITLE, DETAIL, REQUEST_URI, CREATED_AT) " +
            "VALUES (SEQ_COLLAB_ACTIVITY_LOG.NEXTVAL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATE)",
            normalizedScope, wsId, projId, actorUserId,
            safe(actor.get("ACTOR_NAME"), "멤버"), safe(actor.get("PROFILE_IMAGE_PATH"), null),
            trim(activityType, 50), trim(targetType, 30), trim(targetId, 120),
            trim(targetTitle, 500), trim(detail, 1000), trim(requestUri, 1000)
            );
        } catch (Exception e) {
            // 본 기능은 살리되, 원인을 서버 로그에서 확인할 수 있게 남긴다.
            log.warn("[최근활동] 로그 저장 실패 scope={} wsId={} projId={} type={} target={}: {}",
                    normalizedScope, wsId, projId, activityType, targetId, e.getMessage());
        }
    }


    /**
     * 기록(노트/사진/파일/링크/장소) 변경을 원본 협업 대상의 최근활동으로 남긴다.
     * CONTENT_RECORD_TARGETS가 scope/원본 target을 알고 있으므로 공통 필터에서 URI를 추측하지 않는다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordContentRecordChange(Long recordTargetId, Long actorUserId,
                                          String activityType, String recordLabel, String actionLabel,
                                          String requestUri) {
        if (recordTargetId == null || actorUserId == null) return;
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT TARGET_TYPE, TARGET_ID, SCOPE_TYPE, WS_ID, PROJ_ID, TARGET_STATUS " +
                    "FROM CONTENT_RECORD_TARGETS WHERE RECORD_TARGET_ID=?", recordTargetId);
            if (rows.isEmpty()) return;
            Map<String, Object> row = rows.get(0);
            String status = upper(safe(row.get("TARGET_STATUS"), ""));
            if (!"ACTIVE".equals(status)) return; // 임시 기록은 최근활동에 노출하지 않는다.

            String rawTargetType = upper(safe(row.get("TARGET_TYPE"), ""));
            Long targetId = toLong(row.get("TARGET_ID"));
            Long wsId = toLong(row.get("WS_ID"));
            Long projId = toLong(row.get("PROJ_ID"));
            if (targetId == null || (wsId == null && projId == null)) return;

            String activityTargetType = switch (rawTargetType) {
                case "EVENT", "SCHEDULE" -> "SCHEDULE";
                case "PERIOD_PLAN", "TIME_PLAN", "WEEKLY_PLAN", "PLAN" -> "PLAN";
                default -> rawTargetType;
            };
            String scope = projId != null ? "PROJECT" : "WORKSPACE";
            String title = loadRecordTargetTitle(rawTargetType, targetId);
            String label = (recordLabel == null || recordLabel.isBlank()) ? "기록" : recordLabel.trim();
            String action = (actionLabel == null || actionLabel.isBlank()) ? "변경했어요." : actionLabel.trim();
            record(scope, wsId, projId, actorUserId, activityType, activityTargetType,
                    String.valueOf(targetId), title, label + " " + action, requestUri);
        } catch (Exception e) {
            log.warn("[최근활동] 기록 변경 로그 저장 실패 recordTargetId={}: {}", recordTargetId, e.getMessage());
        }
    }

    private String loadRecordTargetTitle(String targetType, Long targetId) {
        if (targetId == null) return "기록";
        try {
            String sql = switch (upper(targetType)) {
                case "TASK" -> "SELECT TITLE FROM PROJECT_TASKS WHERE TASK_ID=?";
                case "EVENT", "SCHEDULE" -> "SELECT TITLE FROM EVENTS WHERE EVENT_ID=?";
                case "PERIOD_PLAN" -> "SELECT TITLE FROM PROJECT_PERIOD_PLANS WHERE PERIOD_PLAN_ID=?";
                case "TIME_PLAN" -> "SELECT TITLE FROM PROJECT_TIME_PLANS WHERE TIME_PLAN_ID=?";
                case "WEEKLY_PLAN" -> "SELECT TITLE FROM PROJECT_WEEKLY_PLANS WHERE WEEKLY_PLAN_ID=?";
                default -> null;
            };
            if (sql == null) return "기록";
            List<String> rows = jdbcTemplate.query(sql, (rs, n) -> rs.getString(1), targetId);
            return rows.isEmpty() || rows.get(0) == null || rows.get(0).isBlank() ? "기록" : rows.get(0);
        } catch (Exception ignored) {
            return "기록";
        }
    }

    public List<Map<String, Object>> recent(String scopeType, Long wsId, Long projId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        String scope = upper(scopeType);

        if (!"WORKSPACE".equals(scope) && !"PROJECT".equals(scope)) {
            return List.of();
        }

        Long scopeId = "PROJECT".equals(scope) ? projId : wsId;
        if (scopeId == null) {
            return List.of();
        }

        /*
         * 최근활동의 단일 기준 데이터는 COLLAB_ACTIVITY_LOG다.
         *
         * PROJECT_TASKS / PROJECT_*_PLANS / 게시판 / 노트 / 사진 / 투표 등
         * 원본 테이블의 UPDATED_AT을 다시 조합하지 않는다.
         * 원본 기능에서 발생한 의미 있는 변경은 record(...)를 통해
         * COLLAB_ACTIVITY_LOG에 1건으로 적재하고, 이 조회는 그 로그만 반환한다.
         */
        try {
            ensureSchema();
        } catch (Exception e) {
            log.warn("[최근활동] COLLAB_ACTIVITY_LOG 준비 실패 scope={} id={}: {}",
                    scope, scopeId, e.getMessage());
            return List.of();
        }

        String sql;
        Object[] args;
        if ("PROJECT".equals(scope)) {
            sql = "SELECT * FROM (" +
                    "SELECT ACTIVITY_ID AS \"activityId\", SCOPE_TYPE AS \"scopeType\", WS_ID AS \"wsId\", PROJ_ID AS \"projId\", " +
                    "ACTOR_USER_ID AS \"userId\", ACTOR_NAME AS \"writerName\", ACTOR_PROFILE_PATH AS \"writerProfile\", " +
                    "ACTIVITY_TYPE AS \"activityType\", TARGET_TYPE AS \"targetType\", TARGET_ID AS \"targetId\", " +
                    "TARGET_TITLE AS \"title\", DETAIL AS \"detail\", " +
                    "TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS \"regDt\" " +
                    "FROM COLLAB_ACTIVITY_LOG " +
                    "WHERE SCOPE_TYPE = 'PROJECT' AND PROJ_ID = ? AND CREATED_AT >= SYSDATE - 3 " +
                    "ORDER BY CREATED_AT DESC, ACTIVITY_ID DESC" +
                    ") WHERE ROWNUM <= ?";
            args = new Object[] { scopeId, safeLimit };
        } else {
            sql = "SELECT * FROM (" +
                    "SELECT ACTIVITY_ID AS \"activityId\", SCOPE_TYPE AS \"scopeType\", WS_ID AS \"wsId\", PROJ_ID AS \"projId\", " +
                    "ACTOR_USER_ID AS \"userId\", ACTOR_NAME AS \"writerName\", ACTOR_PROFILE_PATH AS \"writerProfile\", " +
                    "ACTIVITY_TYPE AS \"activityType\", TARGET_TYPE AS \"targetType\", TARGET_ID AS \"targetId\", " +
                    "TARGET_TITLE AS \"title\", DETAIL AS \"detail\", " +
                    "TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS \"regDt\" " +
                    "FROM COLLAB_ACTIVITY_LOG " +
                    "WHERE WS_ID = ? AND SCOPE_TYPE IN ('WORKSPACE','PROJECT') AND CREATED_AT >= SYSDATE - 3 " +
                    "ORDER BY CREATED_AT DESC, ACTIVITY_ID DESC" +
                    ") WHERE ROWNUM <= ?";
            args = new Object[] { scopeId, safeLimit };
        }

        try {
            return jdbcTemplate.queryForList(sql, args);
        } catch (Exception e) {
            log.warn("[최근활동] COLLAB_ACTIVITY_LOG 조회 실패 scope={} id={}: {}",
                    scope, scopeId, e.getMessage());
            return List.of();
        }
    }

    private boolean activityTableExists() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME = 'COLLAB_ACTIVITY_LOG'", Integer.class);
            return count != null && count > 0;
        } catch (Exception ignored) {
            return false;
        }
    }


    public Map<String, Object> resolveTargetScope(String targetType, String targetId) {
        Long id = parseLong(targetId);
        if (id == null) return Map.of();
        String type = upper(targetType);
        try {
            return switch (type) {
                case "TASK" -> scopeRow("SELECT t.PROJ_ID AS PROJ_ID, p.WS_ID AS WS_ID FROM PROJECT_TASKS t JOIN PROJECTS p ON p.PROJ_ID=t.PROJ_ID WHERE t.TASK_ID=?", id);
                case "NOTE" -> scopeRow("SELECT PROJ_ID, WS_ID FROM NOTES WHERE NOTE_ID=?", id);
                case "FILE" -> scopeRow("SELECT PROJ_ID, WS_ID FROM CONTENT_FILES WHERE CONTENT_FILE_ID=?", id);
                case "POLL" -> scopeRow("SELECT PROJ_ID, WS_ID FROM POLLS WHERE POLL_ID=?", id);
                case "BOARD" -> scopeRow("SELECT PROJ_ID, WS_ID FROM BOARD_POSTS WHERE POST_ID=?", id);
                case "SCHEDULE" -> scopeRow("SELECT PROJ_ID, WS_ID FROM EVENTS WHERE EVENT_ID=?", id);
                case "PHOTO" -> resolvePhotoScope(id);
                case "PLAN" -> resolvePlanScope(id);
                default -> Map.of();
            };
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private Map<String, Object> resolvePhotoScope(Long id) {
        Map<String, Object> row = scopeRow("SELECT PROJ_ID, WS_ID FROM PHOTO_POSTS WHERE POST_ID=?", id);
        if (!row.isEmpty()) return row;
        return scopeRow("SELECT pp.PROJ_ID AS PROJ_ID, pp.WS_ID AS WS_ID FROM PHOTOS p JOIN PHOTO_POSTS pp ON pp.POST_ID=p.POST_ID WHERE p.PHOTO_ID=?", id);
    }

    private Map<String, Object> resolvePlanScope(Long id) {
        String[] sqls = {
            "SELECT p.PROJ_ID AS PROJ_ID, pr.WS_ID AS WS_ID FROM PROJECT_PERIOD_PLANS p JOIN PROJECTS pr ON pr.PROJ_ID=p.PROJ_ID WHERE p.PERIOD_PLAN_ID=?",
            "SELECT p.PROJ_ID AS PROJ_ID, pr.WS_ID AS WS_ID FROM PROJECT_TIME_PLANS p JOIN PROJECTS pr ON pr.PROJ_ID=p.PROJ_ID WHERE p.TIME_PLAN_ID=?",
            "SELECT p.PROJ_ID AS PROJ_ID, pr.WS_ID AS WS_ID FROM PROJECT_WEEKLY_PLANS p JOIN PROJECTS pr ON pr.PROJ_ID=p.PROJ_ID WHERE p.WEEKLY_PLAN_ID=?"
        };
        for (String sql : sqls) {
            Map<String, Object> row = scopeRow(sql, id);
            if (!row.isEmpty()) return row;
        }
        return Map.of();
    }

    private Map<String, Object> scopeRow(String sql, Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, id);
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    private Long parseLong(String value) {
        if (value == null || value.isBlank()) return null;
        try { return Long.valueOf(value.trim()); } catch (Exception e) { return null; }
    }

    private Map<String, Object> loadActor(String scopeType, Long wsId, Long projId, Long userId) {
        try {
            if ("PROJECT".equals(scopeType)) {
                return jdbcTemplate.queryForMap(
                    "SELECT CASE WHEN p.WS_ID IS NOT NULL AND NVL(wp.USE_ACCOUNT_PROFILE,'Y')='N' THEN NVL(wp.DISPLAY_NAME,u.USER_NAME) ELSE u.USER_NAME END AS ACTOR_NAME, " +
                    "CASE WHEN p.WS_ID IS NOT NULL AND NVL(wp.USE_ACCOUNT_PROFILE,'Y')='N' THEN wp.PROFILE_IMAGE_PATH ELSE u.PROFILE_IMAGE_PATH END AS PROFILE_IMAGE_PATH " +
                    "FROM USERS u CROSS JOIN PROJECTS p LEFT JOIN WS_MEMBER_PROFILES wp ON wp.WS_ID=p.WS_ID AND wp.USER_ID=u.USER_ID " +
                    "WHERE p.PROJ_ID=? AND u.USER_ID=?",
                    projId, userId
                );
            }
            return jdbcTemplate.queryForMap(
                "SELECT CASE WHEN NVL(wp.USE_ACCOUNT_PROFILE,'Y')='N' THEN NVL(wp.DISPLAY_NAME,u.USER_NAME) ELSE u.USER_NAME END AS ACTOR_NAME, " +
                "CASE WHEN NVL(wp.USE_ACCOUNT_PROFILE,'Y')='N' THEN wp.PROFILE_IMAGE_PATH ELSE u.PROFILE_IMAGE_PATH END AS PROFILE_IMAGE_PATH " +
                "FROM USERS u LEFT JOIN WS_MEMBER_PROFILES wp ON wp.WS_ID=? AND wp.USER_ID=u.USER_ID WHERE u.USER_ID=?",
                wsId, userId
            );
        } catch (Exception ignored) {
            try {
                return jdbcTemplate.queryForMap("SELECT USER_NAME AS ACTOR_NAME, PROFILE_IMAGE_PATH FROM USERS WHERE USER_ID=?", userId);
            } catch (Exception ignoredAgain) {
                return Map.of("ACTOR_NAME", "멤버");
            }
        }
    }
    public List<Map<String, Object>> taskIndicators(Long projId, Long userId) {
        if (projId == null || userId == null) return List.of();

        try {
            ensureSchema();
            ensureReadSchema();
            ensureReadBaselines(projId, userId);
            ensureRecordItemReadSchema();
        } catch (Exception e) {
            log.warn("[진행보드] 미확인 상태 준비 실패 projId={} userId={}: {}", projId, userId, e.getMessage());
            return List.of();
        }

        List<Map<String, Object>> tasks = jdbcTemplate.queryForList(
                "SELECT TASK_ID AS \"taskId\" FROM PROJECT_TASKS WHERE PROJ_ID=? ORDER BY TASK_ID", projId);

        Map<Long, Integer> taskUnread = new java.util.HashMap<>();
        String taskUnreadSql =
                "SELECT TO_NUMBER(a.TARGET_ID) AS TASK_ID, COUNT(*) AS CNT " +
                "FROM COLLAB_ACTIVITY_LOG a JOIN COLLAB_ACTIVITY_READ r " +
                "ON r.USER_ID=? AND r.PROJ_ID=? AND r.TASK_ID=TO_NUMBER(a.TARGET_ID) AND r.READ_KIND='TASK' " +
                "WHERE a.SCOPE_TYPE='PROJECT' AND a.PROJ_ID=? AND a.TARGET_TYPE='TASK' " +
                "AND REGEXP_LIKE(a.TARGET_ID,'^[0-9]+$') AND a.ACTOR_USER_ID<>? " +
                "AND a.ACTIVITY_ID>NVL(r.LAST_READ_ACTIVITY_ID,0) " +
                "GROUP BY TO_NUMBER(a.TARGET_ID)";
        for (Map<String, Object> row : jdbcTemplate.queryForList(taskUnreadSql, userId, projId, projId, userId)) {
            Long taskId = toLong(row.get("TASK_ID"));
            if (taskId != null) taskUnread.put(taskId, toInt(row.get("CNT")));
        }

        Map<Long, Map<String, Integer>> recordUnread = new java.util.HashMap<>();
        String recordUnreadSql =
                "SELECT rt.TARGET_ID AS TASK_ID, i.RECORD_TYPE AS RECORD_TYPE, COUNT(*) AS CNT " +
                "FROM CONTENT_RECORD_TARGETS rt " +
                "JOIN CONTENT_RECORD_ITEMS i ON i.RECORD_TARGET_ID=rt.RECORD_TARGET_ID " +
                "LEFT JOIN NOTES n ON i.RECORD_TYPE='NOTE' AND n.NOTE_ID=i.CONTENT_ID " +
                "LEFT JOIN CONTENT_FILES f ON i.RECORD_TYPE='FILE' AND f.CONTENT_FILE_ID=i.CONTENT_ID " +
                "LEFT JOIN PHOTO_POSTS pp ON i.RECORD_TYPE='PHOTO' AND pp.POST_ID=i.CONTENT_ID " +
                "JOIN COLLAB_ACTIVITY_READ r ON r.USER_ID=? AND r.PROJ_ID=? AND r.TASK_ID=rt.TARGET_ID AND r.READ_KIND=i.RECORD_TYPE " +
                "LEFT JOIN COLLAB_RECORD_ITEM_READ ir ON ir.USER_ID=r.USER_ID AND ir.PROJ_ID=r.PROJ_ID AND ir.TASK_ID=rt.TARGET_ID AND ir.RECORD_ITEM_ID=i.RECORD_ITEM_ID " +
                "WHERE rt.TARGET_TYPE='TASK' AND rt.PROJ_ID=? AND rt.TARGET_STATUS='ACTIVE' AND NVL(i.DELETED_YN,'N')='N' " +
                "AND i.RECORD_TYPE IN ('NOTE','PHOTO','FILE','LINK','LOCATION') " +
                "AND (CASE WHEN i.RECORD_TYPE='NOTE' THEN NVL(n.UPD_DT,n.REG_DT) " +
                "          WHEN i.RECORD_TYPE='FILE' THEN NVL(f.UPDATED_AT,i.CREATED_AT) " +
                "          WHEN i.RECORD_TYPE='PHOTO' THEN NVL(pp.UPDATED_AT,NVL(i.UPDATED_AT,i.CREATED_AT)) " +
                "          ELSE NVL(i.UPDATED_AT,i.CREATED_AT) END) > GREATEST(r.LAST_READ_AT, NVL(ir.LAST_READ_AT, r.LAST_READ_AT)) " +
                "AND NVL(CASE WHEN i.RECORD_TYPE='NOTE' THEN NVL(n.UPDATED_BY,i.CREATED_BY) " +
                "             WHEN i.RECORD_TYPE='FILE' THEN NVL(f.UPDATED_BY,i.CREATED_BY) " +
                "             WHEN i.RECORD_TYPE='PHOTO' THEN NVL(pp.CREATED_BY,i.CREATED_BY) " +
                "             ELSE i.CREATED_BY END,-1) <> ? " +
                "GROUP BY rt.TARGET_ID, i.RECORD_TYPE";
        for (Map<String, Object> row : jdbcTemplate.queryForList(recordUnreadSql, userId, projId, projId, userId)) {
            Long taskId = toLong(row.get("TASK_ID"));
            String type = upper(safe(row.get("RECORD_TYPE"), ""));
            if (taskId == null || type.isEmpty()) continue;
            recordUnread.computeIfAbsent(taskId, k -> new java.util.HashMap<>()).put(type, toInt(row.get("CNT")));
        }

        java.util.ArrayList<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Map<String, Object> task : tasks) {
            Long taskId = toLong(task.get("taskId"));
            if (taskId == null) continue;
            Map<String, Integer> record = recordUnread.getOrDefault(taskId, Map.of());
            java.util.LinkedHashMap<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("taskId", taskId);
            row.put("unreadTaskCount", taskUnread.getOrDefault(taskId, 0));
            row.put("unreadNoteCount", record.getOrDefault("NOTE", 0));
            row.put("unreadPhotoCount", record.getOrDefault("PHOTO", 0));
            row.put("unreadFileCount", record.getOrDefault("FILE", 0));
            row.put("unreadLinkCount", record.getOrDefault("LINK", 0));
            row.put("unreadLocationCount", record.getOrDefault("LOCATION", 0));
            result.add(row);
        }
        return result;
    }

    public void markTaskRead(Long projId, Long taskId, Long userId) {
        if (projId == null || taskId == null || userId == null) return;
        ensureReadSchema();
        ensureReadBaselines(projId, userId);
        Long maxId = jdbcTemplate.queryForObject(
                "SELECT NVL(MAX(ACTIVITY_ID),0) FROM COLLAB_ACTIVITY_LOG WHERE SCOPE_TYPE='PROJECT' AND PROJ_ID=? AND TARGET_TYPE='TASK' AND TARGET_ID=?",
                Long.class, projId, String.valueOf(taskId));
        jdbcTemplate.update(
                "UPDATE COLLAB_ACTIVITY_READ SET LAST_READ_ACTIVITY_ID=?, LAST_READ_AT=SYSDATE WHERE USER_ID=? AND PROJ_ID=? AND TASK_ID=? AND READ_KIND='TASK'",
                maxId == null ? 0L : maxId, userId, projId, taskId);
    }

    public void markTaskRecordRead(Long projId, Long taskId, Long userId, String recordType) {
        if (projId == null || taskId == null || userId == null) return;
        String type = upper(recordType);
        if (!isRecordReadKind(type)) return;
        ensureReadSchema();
        ensureReadBaselines(projId, userId);
        jdbcTemplate.update(
                "UPDATE COLLAB_ACTIVITY_READ SET LAST_READ_AT=SYSDATE WHERE USER_ID=? AND PROJ_ID=? AND TASK_ID=? AND READ_KIND=?",
                userId, projId, taskId, type);
    }

    public List<Long> unreadTaskRecordItemIds(Long projId, Long taskId, Long userId, String recordType) {
        if (projId == null || taskId == null || userId == null) return List.of();
        String type = upper(recordType);
        if (!isRecordReadKind(type)) return List.of();
        ensureReadSchema();
        ensureReadBaselines(projId, userId);
        ensureRecordItemReadSchema();

        String sql =
                "SELECT i.RECORD_ITEM_ID FROM CONTENT_RECORD_TARGETS rt " +
                "JOIN CONTENT_RECORD_ITEMS i ON i.RECORD_TARGET_ID=rt.RECORD_TARGET_ID " +
                "LEFT JOIN NOTES n ON i.RECORD_TYPE='NOTE' AND n.NOTE_ID=i.CONTENT_ID " +
                "LEFT JOIN CONTENT_FILES f ON i.RECORD_TYPE='FILE' AND f.CONTENT_FILE_ID=i.CONTENT_ID " +
                "LEFT JOIN PHOTO_POSTS pp ON i.RECORD_TYPE='PHOTO' AND pp.POST_ID=i.CONTENT_ID " +
                "JOIN COLLAB_ACTIVITY_READ r ON r.USER_ID=? AND r.PROJ_ID=? AND r.TASK_ID=rt.TARGET_ID AND r.READ_KIND=i.RECORD_TYPE " +
                "LEFT JOIN COLLAB_RECORD_ITEM_READ ir ON ir.USER_ID=r.USER_ID AND ir.PROJ_ID=r.PROJ_ID AND ir.TASK_ID=rt.TARGET_ID AND ir.RECORD_ITEM_ID=i.RECORD_ITEM_ID " +
                "WHERE rt.TARGET_TYPE='TASK' AND rt.PROJ_ID=? AND rt.TARGET_ID=? AND rt.TARGET_STATUS='ACTIVE' " +
                "AND NVL(i.DELETED_YN,'N')='N' AND i.RECORD_TYPE=? " +
                "AND (CASE WHEN i.RECORD_TYPE='NOTE' THEN NVL(n.UPD_DT,n.REG_DT) " +
                "          WHEN i.RECORD_TYPE='FILE' THEN NVL(f.UPDATED_AT,i.CREATED_AT) " +
                "          WHEN i.RECORD_TYPE='PHOTO' THEN NVL(pp.UPDATED_AT,NVL(i.UPDATED_AT,i.CREATED_AT)) " +
                "          ELSE NVL(i.UPDATED_AT,i.CREATED_AT) END) > GREATEST(r.LAST_READ_AT, NVL(ir.LAST_READ_AT, r.LAST_READ_AT)) " +
                "AND NVL(CASE WHEN i.RECORD_TYPE='NOTE' THEN NVL(n.UPDATED_BY,i.CREATED_BY) " +
                "             WHEN i.RECORD_TYPE='FILE' THEN NVL(f.UPDATED_BY,i.CREATED_BY) " +
                "             WHEN i.RECORD_TYPE='PHOTO' THEN NVL(pp.CREATED_BY,i.CREATED_BY) " +
                "             ELSE i.CREATED_BY END,-1) <> ? ORDER BY i.RECORD_ITEM_ID";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong(1),
                userId, projId, projId, taskId, type, userId);
    }

    public boolean markTaskRecordItemRead(Long projId, Long taskId, Long userId, Long recordItemId) {
        if (projId == null || taskId == null || userId == null || recordItemId == null) return false;
        ensureReadSchema();
        ensureReadBaselines(projId, userId);
        ensureRecordItemReadSchema();
        Integer valid = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CONTENT_RECORD_TARGETS rt JOIN CONTENT_RECORD_ITEMS i ON i.RECORD_TARGET_ID=rt.RECORD_TARGET_ID " +
                "WHERE rt.TARGET_TYPE='TASK' AND rt.PROJ_ID=? AND rt.TARGET_ID=? AND rt.TARGET_STATUS='ACTIVE' " +
                "AND NVL(i.DELETED_YN,'N')='N' AND i.RECORD_ITEM_ID=?",
                Integer.class, projId, taskId, recordItemId);
        if (valid == null || valid == 0) return false;
        jdbcTemplate.update(
                "MERGE INTO COLLAB_RECORD_ITEM_READ r USING (SELECT ? USER_ID, ? PROJ_ID, ? TASK_ID, ? RECORD_ITEM_ID FROM DUAL) s " +
                "ON (r.USER_ID=s.USER_ID AND r.PROJ_ID=s.PROJ_ID AND r.TASK_ID=s.TASK_ID AND r.RECORD_ITEM_ID=s.RECORD_ITEM_ID) " +
                "WHEN MATCHED THEN UPDATE SET r.LAST_READ_AT=SYSDATE " +
                "WHEN NOT MATCHED THEN INSERT (USER_ID,PROJ_ID,TASK_ID,RECORD_ITEM_ID,LAST_READ_AT) " +
                "VALUES (s.USER_ID,s.PROJ_ID,s.TASK_ID,s.RECORD_ITEM_ID,SYSDATE)",
                userId, projId, taskId, recordItemId);
        return true;
    }

    private boolean recordItemReadTableExists() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME='COLLAB_RECORD_ITEM_READ'", Integer.class);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void ensureRecordItemReadSchema() {
        if (recordItemReadSchemaReady.get() && recordItemReadTableExists()) return;
        synchronized (recordItemReadSchemaReady) {
            if (!recordItemReadTableExists()) {
                try {
                    jdbcTemplate.execute(
                            "CREATE TABLE COLLAB_RECORD_ITEM_READ (" +
                            "USER_ID NUMBER(20) NOT NULL, PROJ_ID NUMBER(20) NOT NULL, TASK_ID NUMBER(20) NOT NULL, " +
                            "RECORD_ITEM_ID NUMBER(20) NOT NULL, LAST_READ_AT DATE DEFAULT SYSDATE NOT NULL, " +
                            "CONSTRAINT PK_COLLAB_RECORD_ITEM_READ PRIMARY KEY (USER_ID, PROJ_ID, TASK_ID, RECORD_ITEM_ID))");
                    try {
                        jdbcTemplate.execute(
                                "CREATE INDEX IX_COLLAB_RECORD_ITEM_READ_01 ON COLLAB_RECORD_ITEM_READ (PROJ_ID, TASK_ID, USER_ID)");
                    } catch (Exception ignore) {}
                } catch (Exception e) {
                    if (!recordItemReadTableExists()) throw e;
                }
            }
            recordItemReadSchemaReady.set(true);
        }
    }

    private boolean readTableExists() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME='COLLAB_ACTIVITY_READ'", Integer.class);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void ensureReadSchema() {
        if (readSchemaReady.get() && readTableExists()) return;
        synchronized (readSchemaReady) {
            if (!readTableExists()) {
                try {
                    jdbcTemplate.execute(
                            "CREATE TABLE COLLAB_ACTIVITY_READ (" +
                            "USER_ID NUMBER(20) NOT NULL, PROJ_ID NUMBER(20) NOT NULL, TASK_ID NUMBER(20) NOT NULL, " +
                            "READ_KIND VARCHAR2(20) NOT NULL, LAST_READ_ACTIVITY_ID NUMBER(20) DEFAULT 0 NOT NULL, " +
                            "LAST_READ_AT DATE DEFAULT SYSDATE NOT NULL, " +
                            "CONSTRAINT PK_COLLAB_ACTIVITY_READ PRIMARY KEY (USER_ID, PROJ_ID, TASK_ID, READ_KIND))");
                } catch (Exception e) {
                    if (!readTableExists()) throw e;
                }
            }
            readSchemaReady.set(true);
        }
    }

    private void ensureReadBaselines(Long projId, Long userId) {
        if (projId == null || userId == null) return;
        ensureReadSchema();

        /*
         * V2 미확인 시스템 최초 진입 시점:
         * - 기존 업무/기록은 "이미 확인한 상태"로 기준선을 한 번만 잡는다.
         * - 이후 생성되는 새 업무는 LAST_READ_ACTIVITY_ID=0 으로 시작한다.
         *   따라서 다른 멤버의 TASK_CREATE 자체가 미확인으로 잡힌다.
         *
         * TASK_ID=0 / READ_KIND='INIT_V2' 행이 프로젝트-사용자별 초기화 마커다.
         */
        Integer initialized = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM COLLAB_ACTIVITY_READ " +
                "WHERE USER_ID=? AND PROJ_ID=? AND TASK_ID=0 AND READ_KIND='INIT_V2'",
                Integer.class, userId, projId
        );

        if (initialized == null || initialized == 0) {
            // 이전 실험 버전의 잘못된 baseline 행은 버리고 현재 상태를 새 기준선으로 잡는다.
            jdbcTemplate.update(
                    "DELETE FROM COLLAB_ACTIVITY_READ WHERE USER_ID=? AND PROJ_ID=?",
                    userId, projId
            );

            String initialTaskMerge =
                    "MERGE INTO COLLAB_ACTIVITY_READ r USING (" +
                    " SELECT ? USER_ID, ? PROJ_ID, t.TASK_ID, " +
                    "        NVL((SELECT MAX(a.ACTIVITY_ID) FROM COLLAB_ACTIVITY_LOG a " +
                    "             WHERE a.SCOPE_TYPE='PROJECT' AND a.PROJ_ID=? AND a.TARGET_TYPE='TASK' " +
                    "               AND a.TARGET_ID=TO_CHAR(t.TASK_ID)),0) LAST_ID " +
                    " FROM PROJECT_TASKS t WHERE t.PROJ_ID=?" +
                    ") s ON (r.USER_ID=s.USER_ID AND r.PROJ_ID=s.PROJ_ID AND r.TASK_ID=s.TASK_ID AND r.READ_KIND='TASK') " +
                    "WHEN NOT MATCHED THEN INSERT " +
                    "(USER_ID,PROJ_ID,TASK_ID,READ_KIND,LAST_READ_ACTIVITY_ID,LAST_READ_AT) " +
                    "VALUES (s.USER_ID,s.PROJ_ID,s.TASK_ID,'TASK',s.LAST_ID,SYSDATE)";
            jdbcTemplate.update(initialTaskMerge, userId, projId, projId, projId);

            for (String kind : new String[]{"NOTE","PHOTO","FILE","LINK","LOCATION"}) {
                String initialRecordMerge =
                        "MERGE INTO COLLAB_ACTIVITY_READ r USING (" +
                        " SELECT ? USER_ID, ? PROJ_ID, t.TASK_ID FROM PROJECT_TASKS t WHERE t.PROJ_ID=?" +
                        ") s ON (r.USER_ID=s.USER_ID AND r.PROJ_ID=s.PROJ_ID AND r.TASK_ID=s.TASK_ID AND r.READ_KIND=?) " +
                        "WHEN NOT MATCHED THEN INSERT " +
                        "(USER_ID,PROJ_ID,TASK_ID,READ_KIND,LAST_READ_ACTIVITY_ID,LAST_READ_AT) " +
                        "VALUES (s.USER_ID,s.PROJ_ID,s.TASK_ID,?,0,SYSDATE)";
                jdbcTemplate.update(initialRecordMerge, userId, projId, projId, kind, kind);
            }

            jdbcTemplate.update(
                    "INSERT INTO COLLAB_ACTIVITY_READ " +
                    "(USER_ID,PROJ_ID,TASK_ID,READ_KIND,LAST_READ_ACTIVITY_ID,LAST_READ_AT) " +
                    "VALUES (?,?,0,'INIT_V2',0,SYSDATE)",
                    userId, projId
            );
            return;
        }

        /*
         * V2 초기화 이후 새로 생긴 업무:
         * TASK baseline을 0으로 시작해야 TASK_CREATE부터 미확인이다.
         */
        String newTaskMerge =
                "MERGE INTO COLLAB_ACTIVITY_READ r USING (" +
                " SELECT ? USER_ID, ? PROJ_ID, t.TASK_ID FROM PROJECT_TASKS t WHERE t.PROJ_ID=?" +
                ") s ON (r.USER_ID=s.USER_ID AND r.PROJ_ID=s.PROJ_ID AND r.TASK_ID=s.TASK_ID AND r.READ_KIND='TASK') " +
                "WHEN NOT MATCHED THEN INSERT " +
                "(USER_ID,PROJ_ID,TASK_ID,READ_KIND,LAST_READ_ACTIVITY_ID,LAST_READ_AT) " +
                "VALUES (s.USER_ID,s.PROJ_ID,s.TASK_ID,'TASK',0,DATE '1970-01-01')";
        jdbcTemplate.update(newTaskMerge, userId, projId, projId);

        for (String kind : new String[]{"NOTE","PHOTO","FILE","LINK","LOCATION"}) {
            String newRecordMerge =
                    "MERGE INTO COLLAB_ACTIVITY_READ r USING (" +
                    " SELECT ? USER_ID, ? PROJ_ID, t.TASK_ID FROM PROJECT_TASKS t WHERE t.PROJ_ID=?" +
                    ") s ON (r.USER_ID=s.USER_ID AND r.PROJ_ID=s.PROJ_ID AND r.TASK_ID=s.TASK_ID AND r.READ_KIND=?) " +
                    "WHEN NOT MATCHED THEN INSERT " +
                    "(USER_ID,PROJ_ID,TASK_ID,READ_KIND,LAST_READ_ACTIVITY_ID,LAST_READ_AT) " +
                    "VALUES (s.USER_ID,s.PROJ_ID,s.TASK_ID,?,0,DATE '1970-01-01')";
            jdbcTemplate.update(newRecordMerge, userId, projId, projId, kind, kind);
        }
    }

    private boolean isRecordReadKind(String type) {
        return "NOTE".equals(type) || "PHOTO".equals(type) || "FILE".equals(type)
                || "LINK".equals(type) || "LOCATION".equals(type);
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.longValue();
        try { return Long.parseLong(String.valueOf(value)); } catch (Exception e) { return null; }
    }

    private int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception e) { return 0; }
    }

    private boolean activitySequenceExists() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM USER_SEQUENCES WHERE SEQUENCE_NAME = 'SEQ_COLLAB_ACTIVITY_LOG'", Integer.class);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void ensureSchema() {
        if (schemaReady.get() && activityTableExists() && activitySequenceExists()) return;
        synchronized (schemaReady) {
            if (activityTableExists() && activitySequenceExists()) {
                schemaReady.set(true);
                return;
            }

            if (!activityTableExists()) {
                try {
                    jdbcTemplate.execute("CREATE TABLE COLLAB_ACTIVITY_LOG (" +
                            "ACTIVITY_ID NUMBER(20) NOT NULL, SCOPE_TYPE VARCHAR2(20) NOT NULL, WS_ID NUMBER(20), PROJ_ID NUMBER(20), " +
                            "ACTOR_USER_ID NUMBER(20) NOT NULL, ACTOR_NAME VARCHAR2(200), ACTOR_PROFILE_PATH VARCHAR2(1000), " +
                            "ACTIVITY_TYPE VARCHAR2(50) NOT NULL, TARGET_TYPE VARCHAR2(30), TARGET_ID VARCHAR2(120), TARGET_TITLE VARCHAR2(500), " +
                            "DETAIL VARCHAR2(1000), REQUEST_URI VARCHAR2(1000), CREATED_AT DATE DEFAULT SYSDATE NOT NULL, " +
                            "CONSTRAINT PK_COLLAB_ACTIVITY_LOG PRIMARY KEY (ACTIVITY_ID))");
                } catch (Exception e) {
                    // 동시 생성/기존 객체면 다시 존재 여부로 판단한다.
                    if (!activityTableExists()) throw e;
                }
            }

            if (!activitySequenceExists()) {
                try {
                    jdbcTemplate.execute("CREATE SEQUENCE SEQ_COLLAB_ACTIVITY_LOG START WITH 1 INCREMENT BY 1 NOCACHE");
                } catch (Exception e) {
                    if (!activitySequenceExists()) throw e;
                }
            }

            if (!activityTableExists() || !activitySequenceExists()) {
                throw new IllegalStateException("COLLAB_ACTIVITY_LOG schema is not ready");
            }
            schemaReady.set(true);
        }
    }

    private String upper(String value) { return value == null ? "" : value.trim().toUpperCase(); }
    private String trim(String value, int max) {
        if (value == null) return null;
        String s = value.trim();
        return s.length() <= max ? s : s.substring(0, max);
    }
    private String safe(Object value, String fallback) {
        if (value == null) return fallback;
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? fallback : s;
    }
}
