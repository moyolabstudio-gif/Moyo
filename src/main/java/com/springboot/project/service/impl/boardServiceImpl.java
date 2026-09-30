package com.springboot.project.service.impl;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IboardDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.postDTO;
import com.springboot.project.service.IboardService;
import com.springboot.project.service.ContentInputSecurityService;
import com.springboot.project.service.UploadSecurityService;

@Service
public class boardServiceImpl implements IboardService {

    @Autowired
    private IboardDAO iboardDAO;

    @Autowired
    private IuserNoticeDAO userNoticeDAO;

    @Autowired
    private ContentInputSecurityService contentInputSecurityService;

    @Autowired
    private UploadSecurityService uploadSecurityService;

    @Value("${moyo.upload.board-dir:C:/uploads/board/}")
    private String boardUploadDir;

    private Path boardUploadRoot() {
        return Path.of(boardUploadDir).toAbsolutePath().normalize();
    }

    private static final Pattern SCRIPT_BLOCK_PATTERN = Pattern.compile("(?is)<\\s*(script|style|iframe|object|embed|form|input|button|meta|link)[^>]*>.*?<\\s*/\\s*\\1\\s*>");
    private static final Pattern DANGEROUS_SINGLE_TAG_PATTERN = Pattern.compile("(?is)<\\s*(script|style|iframe|object|embed|form|input|button|meta|link)[^>]*>");
    private static final Pattern EVENT_ATTRIBUTE_PATTERN = Pattern.compile("(?i)\\s+on[a-z0-9_-]+\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)");
    private static final Pattern STYLE_ATTRIBUTE_PATTERN = Pattern.compile("(?i)\\s+style\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)");
    private static final Pattern JAVASCRIPT_URL_PATTERN = Pattern.compile("(?i)(href|src)\\s*=\\s*(\"|')?\\s*javascript:[^\"'\\s>]*(\"|')?");

    private String stripStyleQuotes(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String sanitizeInlineStyle(String style) {
        if (style == null || style.isBlank()) return "";
        StringBuilder safe = new StringBuilder();
        String[] rules = style.split(";");
        for (String rule : rules) {
            int idx = rule.indexOf(':');
            if (idx < 1) continue;
            String prop = rule.substring(0, idx).trim().toLowerCase();
            String value = rule.substring(idx + 1).trim();
            String lowerValue = value.toLowerCase();

            boolean allowed = List.of(
                    "color", "background-color", "text-align", "font-size",
                    "width", "height", "border", "border-color", "border-style", "border-width",
                    "vertical-align", "padding", "margin-left", "margin-right"
            ).contains(prop);

            if (!allowed) continue;
            if (lowerValue.contains("javascript:") || lowerValue.contains("expression(") || lowerValue.contains("url(")) continue;

            if (safe.length() > 0) safe.append("; ");
            safe.append(prop).append(": ").append(value.replace("\"", "").replace("'", ""));
        }
        return safe.toString();
    }

    private String sanitizeStyleAttributes(String html) {
        Matcher matcher = STYLE_ATTRIBUTE_PATTERN.matcher(html);
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String safeStyle = sanitizeInlineStyle(stripStyleQuotes(matcher.group(1)));
            String replacement = safeStyle.isBlank() ? "" : " style=\"" + Matcher.quoteReplacement(safeStyle) + "\"";
            matcher.appendReplacement(result, replacement);
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private String sanitizeBoardHtml(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }

        String clean = html;
        clean = SCRIPT_BLOCK_PATTERN.matcher(clean).replaceAll("");
        clean = DANGEROUS_SINGLE_TAG_PATTERN.matcher(clean).replaceAll("");
        clean = EVENT_ATTRIBUTE_PATTERN.matcher(clean).replaceAll("");
        clean = sanitizeStyleAttributes(clean);
        clean = JAVASCRIPT_URL_PATTERN.matcher(clean).replaceAll("$1=\"#\"");
        clean = clean.replaceAll("(?i)<\\s*a([^>]*)target\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "<a$1");
        clean = clean.replaceAll("(?i)<\\s*a([^>]*)>", "<a$1 target=\"_blank\" rel=\"noopener noreferrer\">");
        return clean.trim();
    }

    private void sanitizePostContent(postDTO post) {
        if (post != null) {
            post.setTitle(contentInputSecurityService.singleLine(post.getTitle(), 200, true));
            post.setContent(contentInputSecurityService.richHtml(post.getContent()));
        }
    }

    private int calcOffset(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        return (safePage - 1) * safeSize;
    }

    @Override
    public List<postDTO> getDashboardLatest(Long wsId, String boardType) {
        return iboardDAO.selectDashboardLatestPosts(wsId, boardType);
    }

    @Override
    public List<postDTO> getBoardList(Long wsId, String boardType) {
        return getBoardList(wsId, boardType, 1, 1000, null, null);
    }

    @Override
    public List<postDTO> getBoardList(Long wsId, String boardType, int page, int size, String searchType, String keyword) {
        return iboardDAO.selectBoardList(wsId, boardType, calcOffset(page, size), size, searchType, keyword);
    }

    @Override
    public int getBoardListCount(Long wsId, String boardType, String searchType, String keyword) {
        return iboardDAO.countBoardList(wsId, boardType, searchType, keyword);
    }

    @Override
    public List<postDTO> getListByProject(Long projId, String boardType) {
        return getListByProject(projId, boardType, 1, 1000, null, null);
    }

    @Override
    public List<postDTO> getListByProject(Long projId, String boardType, int page, int size, String searchType, String keyword) {
        return iboardDAO.selectPostsByProject(projId, boardType, calcOffset(page, size), size, searchType, keyword);
    }

    @Override
    public int getProjectBoardListCount(Long projId, String boardType, String searchType, String keyword) {
        return iboardDAO.countPostsByProject(projId, boardType, searchType, keyword);
    }

    private String normalizeChannelName(String channelName) {
        if (channelName == null) return "";
        String safe = contentInputSecurityService.singleLine(channelName, 20, true);
        return safe == null ? "" : safe.trim();
    }

    private Long channelLong(Map<String, Object> row, String key) {
        if (row == null) return null;
        Object value = row.get(key);
        if (value == null) value = row.get(key.toLowerCase());
        if (value instanceof Number n) return n.longValue();
        if (value == null) return null;
        try { return Long.valueOf(String.valueOf(value)); } catch (NumberFormatException e) { return null; }
    }

    private String channelString(Map<String, Object> row, String key) {
        if (row == null) return null;
        Object value = row.get(key);
        if (value == null) value = row.get(key.toLowerCase());
        return value == null ? null : String.valueOf(value);
    }

    private boolean sameScope(Map<String, Object> channel, Long wsId, Long projId) {
        if (channel == null) return false;
        Long channelWsId = channelLong(channel, "WS_ID");
        Long channelProjId = channelLong(channel, "PROJ_ID");
        if (projId != null) return projId.equals(channelProjId);
        return channelProjId == null && wsId != null && wsId.equals(channelWsId);
    }

    @Override
    @Transactional
    public void ensureDefaultChannels(Long wsId, Long projId, Long userId) {
        if (userId == null || (wsId == null && projId == null)) return;
        List<Map<String, Object>> channels = iboardDAO.selectBoardChannels(wsId, projId, true);
        boolean hasNotice = channels.stream().anyMatch(c -> "NOTICE".equalsIgnoreCase(channelString(c, "CHANNEL_TYPE")));
        boolean hasGeneral = channels.stream().anyMatch(c -> "GENERAL".equalsIgnoreCase(channelString(c, "CHANNEL_TYPE")));
        Map<String, Object> base = new java.util.HashMap<>();
        base.put("wsId", wsId);
        base.put("projId", projId);
        base.put("scopeType", projId != null ? "PROJECT" : "GROUP");
        base.put("createdBy", userId);
        if (!hasNotice) iboardDAO.insertDefaultNoticeChannel(base);
        if (!hasGeneral) iboardDAO.insertDefaultGeneralChannel(base);
    }

    @Override
    public List<Map<String, Object>> getBoardChannels(Long wsId, Long projId, boolean includeInactive) {
        return iboardDAO.selectBoardChannels(wsId, projId, includeInactive);
    }

    @Override
    public Map<String, Object> getBoardChannel(Long channelId) {
        return channelId == null ? null : iboardDAO.selectBoardChannel(channelId);
    }

    @Override
    @Transactional
    public Map<String, Object> createBoardChannel(Long wsId, Long projId, String channelName, Long userId) {
        String name = normalizeChannelName(channelName);
        if (name.isBlank()) return Map.of("status", "INVALID_NAME", "message", "게시판 이름을 입력해주세요.");
        if (iboardDAO.countGeneralChannels(wsId, projId) >= 5) {
            return Map.of("status", "LIMIT", "message", "일반 게시판은 최대 5개까지 만들 수 있습니다.");
        }
        if (iboardDAO.countChannelName(wsId, projId, name, null) > 0) {
            return Map.of("status", "DUPLICATE", "message", "같은 이름의 게시판이 이미 있습니다.");
        }
        Map<String, Object> channel = new java.util.HashMap<>();
        channel.put("wsId", wsId);
        channel.put("projId", projId);
        channel.put("scopeType", projId != null ? "PROJECT" : "GROUP");
        channel.put("channelName", name);
        channel.put("createdBy", userId);
        iboardDAO.insertBoardChannel(channel);
        return Map.of("status", "SUCCESS", "channelId", channel.get("channelId"), "channelName", name);
    }

    @Override
    @Transactional
    public Map<String, Object> renameBoardChannel(Long channelId, String channelName, Long userId) {
        Map<String, Object> channel = iboardDAO.selectBoardChannel(channelId);
        if (channel == null) return Map.of("status", "NOT_FOUND");
        if ("NOTICE".equalsIgnoreCase(channelString(channel, "CHANNEL_TYPE"))) {
            return Map.of("status", "SYSTEM_CHANNEL", "message", "공지 게시판 이름은 변경할 수 없습니다.");
        }
        String name = normalizeChannelName(channelName);
        if (name.isBlank()) return Map.of("status", "INVALID_NAME", "message", "게시판 이름을 입력해주세요.");
        Long wsId = channelLong(channel, "WS_ID");
        Long projId = channelLong(channel, "PROJ_ID");
        if (iboardDAO.countChannelName(wsId, projId, name, channelId) > 0) {
            return Map.of("status", "DUPLICATE", "message", "같은 이름의 게시판이 이미 있습니다.");
        }
        return Map.of("status", iboardDAO.updateBoardChannelName(channelId, name, userId) > 0 ? "SUCCESS" : "FAIL");
    }

    @Override
    @Transactional
    public Map<String, Object> setBoardChannelActive(Long channelId, boolean active, Long userId) {
        Map<String, Object> channel = iboardDAO.selectBoardChannel(channelId);
        if (channel == null) return Map.of("status", "NOT_FOUND");
        if ("NOTICE".equalsIgnoreCase(channelString(channel, "CHANNEL_TYPE"))) {
            return Map.of("status", "SYSTEM_CHANNEL", "message", "공지 게시판은 숨길 수 없습니다.");
        }
        if (!active) {
            Long wsId = channelLong(channel, "WS_ID");
            Long projId = channelLong(channel, "PROJ_ID");
            if (iboardDAO.countActiveGeneralChannels(wsId, projId) <= 1) {
                return Map.of("status", "LAST_VISIBLE", "message", "최소 1개의 일반 게시판은 표시되어야 합니다.");
            }
        }
        return Map.of("status", iboardDAO.updateBoardChannelActive(channelId, active ? "Y" : "N", userId) > 0 ? "SUCCESS" : "FAIL");
    }

    @Override
    @Transactional
    public Map<String, Object> reorderBoardChannels(Long wsId, Long projId, List<Long> channelIds, Long userId) {
        if (channelIds == null) return Map.of("status", "FAIL");
        int order = 1;
        for (Long channelId : channelIds) {
            Map<String, Object> channel = iboardDAO.selectBoardChannel(channelId);
            if (channel == null || !sameScope(channel, wsId, projId)) return Map.of("status", "INVALID_SCOPE");
            if ("NOTICE".equalsIgnoreCase(channelString(channel, "CHANNEL_TYPE"))) continue;
            iboardDAO.updateBoardChannelSort(channelId, order++, userId);
        }
        return Map.of("status", "SUCCESS");
    }

    @Override
    @Transactional
    public Map<String, Object> deleteBoardChannel(Long channelId, Long moveToChannelId, Long userId) {
        Map<String, Object> channel = iboardDAO.selectBoardChannel(channelId);
        if (channel == null) return Map.of("status", "NOT_FOUND");
        if ("NOTICE".equalsIgnoreCase(channelString(channel, "CHANNEL_TYPE"))) {
            return Map.of("status", "SYSTEM_CHANNEL", "message", "공지 게시판은 삭제할 수 없습니다.");
        }
        Long scopeWsId = channelLong(channel, "WS_ID");
        Long scopeProjId = channelLong(channel, "PROJ_ID");
        if (iboardDAO.countGeneralChannels(scopeWsId, scopeProjId) <= 1) {
            return Map.of("status", "LAST_GENERAL", "message", "최소 1개의 일반 게시판은 유지해야 합니다.");
        }
        int postCount = iboardDAO.countPostsByChannel(channelId);
        if (postCount > 0) {
            if (moveToChannelId == null || channelId.equals(moveToChannelId)) {
                return Map.of("status", "MOVE_REQUIRED", "postCount", postCount, "message", "게시글을 이동할 게시판을 선택해주세요.");
            }
            Map<String, Object> target = iboardDAO.selectBoardChannel(moveToChannelId);
            if (target == null
                    || !sameScope(target, channelLong(channel, "WS_ID"), channelLong(channel, "PROJ_ID"))
                    || !"GENERAL".equalsIgnoreCase(channelString(target, "CHANNEL_TYPE"))
                    || "N".equalsIgnoreCase(channelString(target, "ACTIVE_YN"))) {
                return Map.of("status", "INVALID_TARGET", "message", "이동할 게시판이 올바르지 않습니다.");
            }
            iboardDAO.movePostsToChannel(channelId, moveToChannelId);
        }
        int deleted = iboardDAO.softDeleteBoardChannel(channelId, userId);
        return Map.of("status", deleted > 0 ? "SUCCESS" : "FAIL", "movedPosts", postCount);
    }

    @Override
    public List<postDTO> getBoardListByChannel(Long channelId, int page, int size, String searchType, String keyword) {
        return iboardDAO.selectPostsByChannel(channelId, calcOffset(page, size), size, searchType, keyword);
    }

    @Override
    public int getBoardListByChannelCount(Long channelId, String searchType, String keyword) {
        return iboardDAO.countPostsByChannelFiltered(channelId, searchType, keyword);
    }

    @Override
    public boolean registerPost(postDTO postDto) {
        sanitizePostContent(postDto);
        return iboardDAO.insertPost(postDto) > 0;
    }

    @Override
    @Transactional
    public void sendBoardNoticeNotification(postDTO post, Long actorUserId, boolean resend) {
        if (post == null || post.getPostId() == null || actorUserId == null) return;
        if (!"NOTICE".equalsIgnoreCase(post.getBoardType())) return;

        List<Long> recipients = iboardDAO.selectBoardNoticeRecipientUserIds(post.getWsId(), post.getProjId(), actorUserId);
        if (recipients == null || recipients.isEmpty()) return;

        String safeTitle = post.getTitle() == null || post.getTitle().isBlank() ? "공지" : post.getTitle().trim();
        String alertType = resend ? "BOARD_NOTICE_UPDATED" : "BOARD_NOTICE_CREATED";
        String title = resend ? "공지 내용이 변경되었습니다." : "새 공지가 등록되었습니다.";
        String content = "‘" + safeTitle + "’ 공지를 확인해 주세요.";
        StringBuilder link = new StringBuilder("/group/board/detail?postId=").append(post.getPostId());
        if (post.getWsId() != null) link.append("&wsId=").append(post.getWsId());
        if (post.getProjId() != null) link.append("&projId=").append(post.getProjId());

        for (Long recipientId : recipients) {
            if (recipientId == null || recipientId.equals(actorUserId)) continue;
            userNoticeDAO.insertContentSendAlarm(
                    recipientId,
                    alertType,
                    "BOARD",
                    post.getPostId(),
                    title,
                    content,
                    link.toString()
            );
        }
    }


    @Override
    @Transactional
    public void registerPostWithFiles(postDTO post, List<Map<String, Object>> fileList) {
        sanitizePostContent(post);
        iboardDAO.insertPost(post);
        if (fileList != null && !fileList.isEmpty()) {
            for (Map<String, Object> fileMap : fileList) {
                fileMap.put("postId", post.getPostId());
                insertFile(fileMap);
            }
        }
    }

    @Override
    public void insertFile(Map<String, Object> fileMap) {
        iboardDAO.insertFile(fileMap);
    }

    @Override
    public List<Map<String, Object>> getFileList(int postId) {
        return iboardDAO.selectFileList(postId);
    }

    @Override
    public Map<String, Object> getFileInfo(String fileId) {
        return iboardDAO.selectFileById(fileId);
    }

    @Override
    public postDTO getPostDetail(int postId) {
        return iboardDAO.selectPostDetail(postId);
    }

    @Override
    public boolean increasePostViewCount(int postId) {
        return iboardDAO.incrementPostViewCount(postId) > 0;
    }

    @Override
    public List<Map<String, Object>> getReplyList(int postId) {
        return iboardDAO.selectReplyList(postId);
    }

    @Override
    public Map<String, Object> getReplyDetail(Long replyId) {
        if (replyId == null) return null;
        return iboardDAO.selectReplyById(replyId);
    }

    @Override
    public boolean modifyReply(Map<String, Object> replyData) {
        sanitizeReplyContent(replyData);
        return iboardDAO.updateReply(replyData) > 0;
    }

    @Override
    public boolean removeReply(int replyId, Long deletedBy) {
        if (deletedBy == null) return false;
        return iboardDAO.softDeleteReply(replyId, deletedBy) > 0;
    }

    @Override
    public boolean registerReply(Map<String, Object> replyData) {
        sanitizeReplyContent(replyData);
        return iboardDAO.insertReply(replyData) > 0;
    }

    @Override
    public boolean canManageBoardPin(Long wsId, Long projId, Long userId) {
        if (userId == null) return false;

        String role = null;
        if (projId != null) {
            role = iboardDAO.selectProjectBoardRole(projId, userId);
        }

        if ((role == null || role.isBlank()) && wsId != null) {
            role = iboardDAO.selectWorkspaceBoardRole(wsId, userId);
        }

        if (role == null) return false;
        String normalized = role.toUpperCase();
        return "OWNER".equals(normalized)
                || "LEADER".equals(normalized)
                || "ADMIN".equals(normalized)
                || "PM".equals(normalized);
    }

    private void notifyReportManagers(Long reportId, String contentType, Long contentId, Long reporterId) {
        try {
            Map<String, Object> context = iboardDAO.selectReportTargetContext(contentType, contentId);
            if (context == null) return;

            Long wsId = channelLong(context, "WS_ID");
            Long projId = channelLong(context, "PROJ_ID");
            String targetTitle = channelString(context, "TITLE");

            List<Long> managers = iboardDAO.selectBoardReportManagerUserIds(wsId, projId);
            if (managers == null || managers.isEmpty()) return;

            String safeTitle = targetTitle == null || targetTitle.isBlank() ? "게시판 콘텐츠" : targetTitle.trim();
            StringBuilder link = new StringBuilder("/group/board/reports?wsId=").append(wsId);
            if (projId != null) link.append("&projId=").append(projId);
            link.append("&status=WAITING&openReportId=").append(reportId);

            for (Long managerId : managers) {
                if (managerId == null || managerId.equals(reporterId)) continue;
                userNoticeDAO.insertContentSendAlarm(
                        managerId,
                        "BOARD_REPORT",
                        "BOARD_REPORT",
                        reportId,
                        "새 신고가 접수되었습니다.",
                        "‘" + safeTitle + "’에 대한 신고가 접수되었습니다.",
                        link.toString()
                );
            }
        } catch (Exception e) {
            // 신고 저장 자체는 유지하고 관리자 알림 실패만 별도로 기록한다.
            System.err.println("게시판 신고 관리자 알림 생성 실패: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> reportContent(String contentType, Long contentId, Long reporterId, String reason, String detail) {
        if (reporterId == null) {
            return Map.of("status", "LOGIN_REQUIRED", "message", "로그인이 필요합니다.");
        }

        String safeType = contentType == null ? "BOARD" : contentType.trim().toUpperCase();
        if (!List.of("BOARD", "NOTICE", "FILE", "REPLY").contains(safeType)) {
            return Map.of("status", "FAIL", "message", "신고 대상이 올바르지 않습니다.");
        }

        if (contentId == null) {
            return Map.of("status", "FAIL", "message", "신고 대상 ID가 없습니다.");
        }

        String safeReason = reason == null ? "ETC" : reason.trim().toUpperCase();
        if (!List.of("SPAM", "ABUSE", "INAPPROPRIATE", "PRIVACY", "ETC").contains(safeReason)) {
            return Map.of("status", "FAIL", "message", "신고 사유가 올바르지 않습니다.");
        }

        String safeDetail = detail == null ? "" : detail.trim();
        if (safeDetail.length() > 300) {
            return Map.of("status", "FAIL", "message", "상세 내용은 300자 이내로 입력해 주세요.");
        }

        int exists = iboardDAO.countReportByUser(safeType, contentId, reporterId);
        if (exists > 0) {
            return Map.of("status", "DUPLICATE", "message", "이미 신고한 항목입니다.");
        }

        Long reportId = iboardDAO.selectNextReportId();
        if (reportId == null) {
            return Map.of("status", "FAIL", "message", "신고 번호를 생성하지 못했습니다.");
        }
        int inserted = iboardDAO.insertReport(reportId, safeType, contentId, reporterId, safeReason, safeDetail);
        if (inserted > 0) {
            notifyReportManagers(reportId, safeType, contentId, reporterId);
        }
        return Map.of("status", inserted > 0 ? "SUCCESS" : "FAIL");
    }



    private String normalizeReportFilter(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String normalizeReportStatus(String status) {
        if (status == null || status.isBlank()) {
            return "WAITING";
        }
        String safeStatus = status.trim().toUpperCase();
        if (!List.of("WAITING", "CHECKING", "RESOLVED", "REJECTED").contains(safeStatus)) {
            return "WAITING";
        }
        return safeStatus;
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) return null;
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Override
    public List<Map<String, Object>> getReportList(Long wsId, Long projId, String status, String contentType, String keyword, int page, int size) {
        return iboardDAO.selectReportList(wsId, projId, normalizeReportFilter(status), normalizeReportFilter(contentType), normalizeKeyword(keyword), calcOffset(page, size), size);
    }

    @Override
    public int getReportListCount(Long wsId, Long projId, String status, String contentType, String keyword) {
        return iboardDAO.countReportList(wsId, projId, normalizeReportFilter(status), normalizeReportFilter(contentType), normalizeKeyword(keyword));
    }

    @Override
    public int getWaitingReportCount(Long wsId, Long projId) {
        return iboardDAO.countReportList(wsId, projId, "WAITING", null, null);
    }

    @Override
    public Map<String, Object> getReportById(Long reportId) {
        return iboardDAO.selectReportById(reportId);
    }

    @Override
    @Transactional
    public boolean updateReportStatus(Long reportId, String status, Long procUserId) {
        if (reportId == null || procUserId == null) return false;
        String normalizedStatus = normalizeReportStatus(status);
        boolean updated = iboardDAO.updateReportStatus(reportId, normalizedStatus, procUserId) > 0;
        if (updated) {
            userNoticeDAO.updateBoardReportAlarmReadState(reportId, "WAITING".equals(normalizedStatus) ? "N" : "Y");
        }
        return updated;
    }

    @Override
    @Transactional
    public boolean deleteReportedContent(Long reportId, Long procUserId) {
        if (reportId == null || procUserId == null) return false;

        Map<String, Object> report = iboardDAO.selectReportById(reportId);
        if (report == null) return false;

        String contentType = String.valueOf(report.get("CONTENT_TYPE"));
        Object contentIdRaw = report.get("CONTENT_ID");
        if (contentIdRaw == null) return false;

        boolean deleted;
        if ("REPLY".equalsIgnoreCase(contentType)) {
            deleted = iboardDAO.softDeleteReply(Long.valueOf(String.valueOf(contentIdRaw)).intValue(), procUserId) > 0;
        } else {
            deleted = iboardDAO.softDeletePost(Long.valueOf(String.valueOf(contentIdRaw)), procUserId) > 0;
        }

        if (deleted) {
            iboardDAO.updateReportStatus(reportId, "RESOLVED", procUserId);
            userNoticeDAO.updateBoardReportAlarmReadState(reportId, "Y");
        }
        return deleted;
    }


    @Override
    public boolean modifyPost(postDTO postData) {
        sanitizePostContent(postData);
        return iboardDAO.updatePost(postData) > 0;
    }

    @Override
    public boolean deletePost(Long postId, Long deletedBy) {
        if (postId == null || deletedBy == null) return false;
        return iboardDAO.softDeletePost(postId, deletedBy) > 0;
    }

    @Override
    public boolean deleteFile(int fileId) {
        Map<String, Object> fileInfo = iboardDAO.selectFileById(String.valueOf(fileId));
        if (fileInfo == null) return false;

        Path filePath = boardUploadRoot().resolve(String.valueOf(fileInfo.get("FILE_NAME"))).normalize();
        if (!filePath.startsWith(boardUploadRoot())) return false;
        File file = filePath.toFile();
        if (file.exists()) {
            file.delete();
        }

        return iboardDAO.deleteFile(fileId) > 0;
    }

    @Override
    public String saveFile(MultipartFile file) {
        final long maxBytes = 20L * 1024L * 1024L;
        uploadSecurityService.validateAttachment(file, maxBytes);

        try {
            Path uploadRoot = boardUploadRoot();
            Files.createDirectories(uploadRoot);

            String originalFileName = uploadSecurityService.safeOriginalName(file.getOriginalFilename());
            String extension = "." + uploadSecurityService.safeExtension(originalFileName);
            String savedFileName = UUID.randomUUID().toString().replace("-", "") + extension;

            Path targetFile = uploadRoot.resolve(savedFileName).normalize();
            if (!targetFile.startsWith(uploadRoot)) {
                throw new SecurityException("허용되지 않은 업로드 경로입니다.");
            }
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            return savedFileName;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장에 실패했습니다.", e);
        }
    }
    private void sanitizeReplyContent(Map<String, Object> replyData) {
        if (replyData == null) throw new IllegalArgumentException("댓글 내용을 확인해주세요.");
        String content = replyData.get("content") == null ? "" : String.valueOf(replyData.get("content"));
        replyData.put("content", contentInputSecurityService.multiLine(content, 2000, true));
    }

}
