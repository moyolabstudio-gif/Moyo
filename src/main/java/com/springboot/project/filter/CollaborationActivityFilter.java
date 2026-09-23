package com.springboot.project.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.CollaborationActivityService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CollaborationActivityFilter extends OncePerRequestFilter {

    private static final Pattern JSON_NUMBER = Pattern.compile("\\\"%s\\\"\\s*:\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern JSON_TEXT = Pattern.compile("\\\"%s\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"", Pattern.CASE_INSENSITIVE);
    private final CollaborationActivityService activityService;

    public CollaborationActivityFilter(CollaborationActivityService activityService) {
        this.activityService = activityService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        if (!("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method))) return true;
        String uri = request.getRequestURI();
        if (uri == null) return true;
        if (uri.contains("/collaboration-activity") || uri.contains("/login") || uri.contains("/logout") || uri.contains("/auth/")) return true;
        String lower = uri.toLowerCase(Locale.ROOT);
        // 기록 항목은 성공한 저장 결과를 알고 있는 contentRecordItemController에서 직접 기록한다.
        if (lower.contains("/api/content-records")) return true;
        // 좋아요/조회/다운로드/권한확인/읽음처리 같은 비편집 액션은 최근활동에서 제외한다.
        return lower.contains("/reaction") || lower.contains("/like") || lower.contains("/view-count")
                || lower.contains("/download") || lower.contains("/access") || lower.contains("/permission")
                || lower.contains("/task-read") || lower.contains("/record-read") || lower.contains("/item-read")
                || lower.contains("/api/polls/vote");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        boolean json = request.getContentType() != null && request.getContentType().toLowerCase(Locale.ROOT).contains("application/json");
        HttpServletRequest effective = json ? new ContentCachingRequestWrapper(request) : request;
        try {
            filterChain.doFilter(effective, response);
        } finally {
            if (response.getStatus() >= 200 && response.getStatus() < 400) {
                record(effective);
            }
        }
    }

    private void record(HttpServletRequest request) {
        Object sessionUser = request.getSession(false) == null ? null : request.getSession(false).getAttribute("user");
        if (!(sessionUser instanceof usersDto user) || user.getUserId() == null) return;

        String body = bodyOf(request);
        String uri = request.getRequestURI();
        Long projId = firstLong(request, body, "projId", "projectId");
        Long wsId = firstLong(request, body, "wsId", "workspaceId");
        String requestedScope = firstText(request, body, "scopeType", "scope", "targetScope").toUpperCase(Locale.ROOT);
        Long scopeId = firstLong(request, body, "scopeId", "targetScopeId");
        if (projId == null && scopeId != null && ("PROJECT".equals(requestedScope) || "PROJ".equals(requestedScope))) projId = scopeId;
        if (wsId == null && scopeId != null && ("WORKSPACE".equals(requestedScope) || "WS".equals(requestedScope) || "GROUP".equals(requestedScope))) wsId = scopeId;
        if (projId == null) projId = pathNumber(uri, "/project/");
        if (wsId == null && projId == null) wsId = pathNumber(uri, "/workspace/");
        if (projId == null) projId = firstQueryNumber(request.getHeader("Referer"), "projId", "projectId");
        if (wsId == null) wsId = firstQueryNumber(request.getHeader("Referer"), "wsId", "workspaceId");

        ActivityDescriptor d = describe(request, body);
        if (d == null) return;
        if (projId == null && wsId == null) {
            Map<String, Object> resolved = activityService.resolveTargetScope(d.targetType, d.targetId);
            projId = mapLong(resolved, "PROJ_ID", "projId");
            wsId = mapLong(resolved, "WS_ID", "wsId");
        }
        if (projId == null && wsId == null) return;

        String scope = projId != null ? "PROJECT" : "WORKSPACE";
        try {
            activityService.record(scope, wsId, projId, user.getUserId(), d.activityType, d.targetType,
                    d.targetId, d.title, d.detail, uri);
        } catch (Exception ignored) {
            // 활동 로그 실패가 본 기능 저장을 실패시키면 안 된다.
        }
    }

    private ActivityDescriptor describe(HttpServletRequest request, String body) {
        String uri = request.getRequestURI().toLowerCase(Locale.ROOT);
        String method = request.getMethod();
        String status = firstText(request, body, "status", "taskStatus");
        String title = firstText(request, body, "title", "noteTitle", "question", "name", "projName", "wsName");
        String targetId = firstTargetId(request, body, "taskId", "noteId", "postId", "photoId", "pollId", "fileId", "contentFileId", "eventId", "scheduleId", "planId", "periodPlanId", "timePlanId", "weeklyPlanId", "userId");
        if (targetId.isBlank()) {
            Long pathId = lastPathNumber(request.getRequestURI());
            if (pathId != null) targetId = String.valueOf(pathId);
        }

        if (uri.contains("/project/api/period-plans")
                || uri.contains("/project/api/time-plans")
                || uri.contains("/project/api/weekly-plans")) {
            return null;
        }

        if (uri.contains("task")) {
            /*
             * TASK는 projectController에서 성공 결과가 확정된 뒤 직접 기록한다.
             * 생성 시 실제 TASK_ID 확보, 삭제 전 scope/title 보존, 담당자 변경 판별이 필요하므로
             * 요청 문자열만 보는 공통 필터에서 기록하면 누락/중복이 발생한다.
             */
            return null;
        }

        /*
         * 탐색기에서의 위치 이동/이름 변경은 내용 수정과 의미가 다르다.
         * 최근활동에서도 사용자가 무엇을 했는지 바로 읽히도록 별도 activity type/detail로 분리한다.
         * 폴더/앨범 자체 조작은 콘텐츠 ID와 식별 체계가 달라 여기서 억지로 NOTE/PHOTO로 기록하지 않는다.
         */
        if (uri.contains("/api/folder/move-note")) {
            return new ActivityDescriptor("NOTE_MOVE", "NOTE", targetId, title, "노트를 이동했어요.");
        }
        if (uri.contains("/api/folder/")) return null;
        if (uri.contains("/api/photo-albums/")) return null;

        if (uri.contains("note") && hasPathSegment(uri, "rename")) {
            return new ActivityDescriptor("NOTE_RENAME", "NOTE", targetId, title, "노트 이름을 변경했어요.");
        }
        if (uri.contains("photo-posts") && hasPathSegment(uri, "album")) {
            return new ActivityDescriptor("PHOTO_MOVE", "PHOTO", targetId, title, "사진을 이동했어요.");
        }
        if ((uri.contains("/api/files") || uri.contains("/api/file-explorer")) && hasPathSegment(uri, "move")) {
            return new ActivityDescriptor("FILE_MOVE", "FILE", targetId, title, "자료를 이동했어요.");
        }
        if ((uri.contains("/api/files") || uri.contains("/api/file-explorer")) && hasPathSegment(uri, "name")) {
            return new ActivityDescriptor("FILE_RENAME", "FILE", targetId, title, "자료 이름을 변경했어요.");
        }
        if (uri.contains("member") || uri.contains("invite") || uri.contains("assign")) {
            if ("DELETE".equals(method) || uri.contains("remove") || uri.contains("kick") || uri.contains("leave")) return new ActivityDescriptor("MEMBER_REMOVE", "MEMBER", targetId, title, "멤버 구성이 변경됐어요.");
            if (uri.contains("role") || uri.contains("position") || uri.contains("setting")) return new ActivityDescriptor("MEMBER_UPDATE", "MEMBER", targetId, title, "멤버 권한 또는 역할을 변경했어요.");
            return new ActivityDescriptor("MEMBER_ADD", "MEMBER", targetId, title, "멤버 구성이 변경됐어요.");
        }
        if (uri.contains("reply") || uri.contains("comment")) {
            String parentType = uri.contains("photo") ? "PHOTO" : (uri.contains("note") ? "NOTE" : "BOARD");
            String detail = ("DELETE".equals(method) || uri.contains("delete")) ? "댓글을 삭제했어요."
                    : (("PUT".equals(method) || "PATCH".equals(method) || uri.contains("modify") || uri.contains("update"))
                        ? "댓글을 수정했어요." : "댓글을 남겼어요.");
            return new ActivityDescriptor("COMMENT_" + (detail.contains("삭제") ? "DELETE" : (detail.contains("수정") ? "UPDATE" : "CREATE")),
                    parentType, targetId, title, detail);
        }
        if (uri.contains("note")) return generic(method, uri, "NOTE", targetId, title, "노트");
        if (uri.contains("photo") || uri.contains("album")) return generic(method, uri, "PHOTO", targetId, title, "사진");
        if (uri.contains("file") || uri.contains("resource")) return generic(method, uri, "FILE", targetId, title, "자료");
        if (uri.contains("poll")) return generic(method, uri, "POLL", targetId, title, "투표");
        if (uri.contains("board")) return generic(method, uri, "BOARD", targetId, title, "게시글");
        if (uri.contains("plan")) return generic(method, uri, "PLAN", targetId, title, "계획");
        if (uri.contains("calendar") || uri.contains("event") || uri.contains("schedule")) return generic(method, uri, "SCHEDULE", targetId, title, "일정");
        if (uri.contains("project")) return new ActivityDescriptor("PROJECT_UPDATE", "PROJECT", targetId, title, "프로젝트 정보를 변경했어요.");
        if (uri.contains("workspace") || uri.contains("group")) return new ActivityDescriptor("GROUP_UPDATE", "GROUP", targetId, title, "그룹 정보를 변경했어요.");
        return null;
    }

    private ActivityDescriptor generic(String method, String uri, String targetType, String targetId, String title, String label) {
        if (uri.contains("permanent-delete") || uri.contains("permanentdelete"))
            return new ActivityDescriptor(targetType + "_DELETE", targetType, targetId, title, label + "을(를) 영구 삭제했어요.");
        if (uri.contains("restore"))
            return new ActivityDescriptor(targetType + "_RESTORE", targetType, targetId, title, label + "을(를) 복원했어요.");
        if (uri.contains("trash"))
            return new ActivityDescriptor(targetType + "_TRASH", targetType, targetId, title, label + "을(를) 휴지통으로 이동했어요.");
        if ("DELETE".equals(method) || uri.contains("delete")) return new ActivityDescriptor(targetType + "_DELETE", targetType, targetId, title, label + "을(를) 삭제했어요.");
        if ("POST".equals(method) && (uri.contains("create") || uri.contains("write") || uri.contains("upload") || uri.contains("add") || targetId.isBlank()))
            return new ActivityDescriptor(targetType + "_CREATE", targetType, targetId, title, label + "을(를) 등록했어요.");
        return new ActivityDescriptor(targetType + "_UPDATE", targetType, targetId, title, label + "을(를) 수정했어요.");
    }

    private String bodyOf(HttpServletRequest request) {
        if (!(request instanceof ContentCachingRequestWrapper wrapper)) return "";
        byte[] bytes = wrapper.getContentAsByteArray();
        return bytes.length == 0 ? "" : new String(bytes, StandardCharsets.UTF_8);
    }


    private boolean hasPathSegment(String uri, String segment) {
        if (uri == null || uri.isBlank() || segment == null || segment.isBlank()) return false;
        String normalized = uri.toLowerCase(Locale.ROOT);
        String token = "/" + segment.toLowerCase(Locale.ROOT);
        int index = normalized.indexOf(token);
        while (index >= 0) {
            int end = index + token.length();
            if (end == normalized.length() || normalized.charAt(end) == '/' || normalized.charAt(end) == '?' || normalized.charAt(end) == '#') {
                return true;
            }
            index = normalized.indexOf(token, index + 1);
        }
        return false;
    }

    private Long lastPathNumber(String uri) {
        if (uri == null || uri.isBlank()) return null;
        Matcher matcher = Pattern.compile("/(\\d+)(?:/[^/]*)?/?$").matcher(uri);
        Long last = null;
        while (matcher.find()) last = parseLong(matcher.group(1));
        if (last != null) return last;
        Matcher any = Pattern.compile("/(\\d+)(?=/|$)").matcher(uri);
        while (any.find()) last = parseLong(any.group(1));
        return last;
    }

    private String firstTargetId(HttpServletRequest request, String body, String... keys) {
        for (String key : keys) {
            String p = request.getParameter(key);
            if (p != null && !p.isBlank()) return p.trim();

            Matcher textMatcher = Pattern.compile(String.format(JSON_TEXT.pattern(), Pattern.quote(key)), Pattern.CASE_INSENSITIVE).matcher(body);
            if (textMatcher.find() && !textMatcher.group(1).isBlank()) return textMatcher.group(1).trim();

            Matcher numberMatcher = Pattern.compile(String.format(JSON_NUMBER.pattern(), Pattern.quote(key)), Pattern.CASE_INSENSITIVE).matcher(body);
            if (numberMatcher.find()) return numberMatcher.group(1);
        }
        return "";
    }
    private Long firstLong(HttpServletRequest request, String body, String... keys) {
        for (String key : keys) {
            String p = request.getParameter(key);
            Long parsed = parseLong(p);
            if (parsed != null) return parsed;
            Matcher m = Pattern.compile(String.format(JSON_NUMBER.pattern(), Pattern.quote(key)), Pattern.CASE_INSENSITIVE).matcher(body);
            if (m.find()) return parseLong(m.group(1));
        }
        return null;
    }

    private String firstText(HttpServletRequest request, String body, String... keys) {
        for (String key : keys) {
            String p = request.getParameter(key);
            if (p != null && !p.isBlank()) return p.trim();
            Matcher m = Pattern.compile(String.format(JSON_TEXT.pattern(), Pattern.quote(key)), Pattern.CASE_INSENSITIVE).matcher(body);
            if (m.find() && !m.group(1).isBlank()) return m.group(1).trim();
        }
        return "";
    }

    private Long pathNumber(String uri, String token) {
        int index = uri == null ? -1 : uri.toLowerCase(Locale.ROOT).indexOf(token);
        if (index < 0) return null;
        String rest = uri.substring(index + token.length());
        Matcher m = Pattern.compile("^(\\d+)").matcher(rest);
        return m.find() ? parseLong(m.group(1)) : null;
    }

    private Long firstQueryNumber(String url, String... keys) {
        for (String key : keys) {
            Long value = queryNumber(url, key);
            if (value != null) return value;
        }
        return null;
    }

    private Long mapLong(Map<String, Object> row, String... keys) {
        if (row == null || row.isEmpty()) return null;
        for (String key : keys) {
            Object value = row.get(key);
            if (value == null) {
                for (Map.Entry<String, Object> entry : row.entrySet()) {
                    if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key)) { value = entry.getValue(); break; }
                }
            }
            if (value != null) {
                Long parsed = parseLong(String.valueOf(value));
                if (parsed != null) return parsed;
            }
        }
        return null;
    }

    private Long queryNumber(String url, String key) {
        if (url == null || url.isBlank()) return null;
        Matcher m = Pattern.compile("(?:[?&])" + Pattern.quote(key) + "=(\\d+)", Pattern.CASE_INSENSITIVE).matcher(url);
        return m.find() ? parseLong(m.group(1)) : null;
    }

    private Long parseLong(String value) {
        if (value == null || value.isBlank()) return null;
        try { return Long.valueOf(value.trim()); } catch (Exception e) { return null; }
    }

    private String taskStatusLabel(String status) {
        return switch (status == null ? "" : status.trim().toUpperCase(Locale.ROOT)) {
            case "TODO" -> "할 일";
            case "IN_PROGRESS", "DOING" -> "진행 중";
            case "DONE", "COMPLETE", "COMPLETED" -> "완료";
            default -> status == null || status.isBlank() ? "새 상태" : status;
        };
    }

    private record ActivityDescriptor(String activityType, String targetType, String targetId, String title, String detail) {}
}
