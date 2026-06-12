package com.springboot.project.service.impl;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IboardDAO;
import com.springboot.project.dto.postDTO;
import com.springboot.project.service.IboardService;

@Service
public class boardServiceImpl implements IboardService {

    @Autowired
    private IboardDAO iboardDAO;


    private static final Pattern SCRIPT_BLOCK_PATTERN = Pattern.compile("(?is)<\\s*(script|style|iframe|object|embed|form|input|button|meta|link)[^>]*>.*?<\\s*/\\s*\\1\\s*>");
    private static final Pattern DANGEROUS_SINGLE_TAG_PATTERN = Pattern.compile("(?is)<\\s*(script|style|iframe|object|embed|form|input|button|meta|link)[^>]*>");
    private static final Pattern EVENT_ATTRIBUTE_PATTERN = Pattern.compile("(?i)\\s+on[a-z0-9_-]+\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)");
    private static final Pattern STYLE_ATTRIBUTE_PATTERN = Pattern.compile("(?i)\\s+style\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)");
    private static final Pattern JAVASCRIPT_URL_PATTERN = Pattern.compile("(?i)(href|src)\\s*=\\s*(\"|')?\\s*javascript:[^\"'\\s>]*(\"|')?");
    private static final Pattern BASE64_IMAGE_PATTERN = Pattern.compile("(?i)src\\s*=\\s*(\"|')\\s*data:image/[^\"']*(\"|')");

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
        clean = BASE64_IMAGE_PATTERN.matcher(clean).replaceAll("src=\"\"");
        clean = clean.replaceAll("(?i)<\\s*a([^>]*)target\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "<a$1");
        clean = clean.replaceAll("(?i)<\\s*a([^>]*)>", "<a$1 target=\"_blank\" rel=\"noopener noreferrer\">");
        return clean.trim();
    }

    private void sanitizePostContent(postDTO post) {
        if (post != null) {
            post.setContent(sanitizeBoardHtml(post.getContent()));
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

    @Override
    public boolean registerPost(postDTO postDto) {
        sanitizePostContent(postDto);
        return iboardDAO.insertPost(postDto) > 0;
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
    public List<Map<String, Object>> getReplyList(int postId) {
        return iboardDAO.selectReplyList(postId);
    }

    @Override
    public boolean modifyReply(Map<String, Object> replyData) {
        return iboardDAO.updateReply(replyData) > 0;
    }

    @Override
    public boolean removeReply(int replyId) {
        return iboardDAO.deleteReply(replyId) > 0;
    }

    @Override
    public boolean registerReply(Map<String, Object> replyData) {
        return iboardDAO.insertReply(replyData) > 0;
    }

    @Override
    public List<Map<String, Object>> selectWorkspaceCalendar(Long wsId) {
        return iboardDAO.selectWorkspaceCalendar(wsId);
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

        String safeReason = reason == null ? "ETC" : reason.trim();
        String safeDetail = detail == null ? "" : detail.trim();

        int exists = iboardDAO.countReportByUser(safeType, contentId, reporterId);
        if (exists > 0) {
            return Map.of("status", "DUPLICATE", "message", "이미 신고한 항목입니다.");
        }

        int inserted = iboardDAO.insertReport(safeType, contentId, reporterId, safeReason, safeDetail);
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
    public Map<String, Object> getReportById(Long reportId) {
        return iboardDAO.selectReportById(reportId);
    }

    @Override
    public boolean updateReportStatus(Long reportId, String status, Long procUserId) {
        if (reportId == null || procUserId == null) return false;
        return iboardDAO.updateReportStatus(reportId, normalizeReportStatus(status), procUserId) > 0;
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
            deleted = iboardDAO.deleteReply(Long.valueOf(String.valueOf(contentIdRaw)).intValue()) > 0;
        } else {
            deleted = iboardDAO.deletePost(Long.valueOf(String.valueOf(contentIdRaw))) > 0;
        }

        if (deleted) {
            iboardDAO.updateReportStatus(reportId, "RESOLVED", procUserId);
        }
        return deleted;
    }


    @Override
    public boolean modifyPost(postDTO postData) {
        sanitizePostContent(postData);
        return iboardDAO.updatePost(postData) > 0;
    }

    @Override
    public boolean deletePost(Long postId) {
        return iboardDAO.deletePost(postId) > 0;
    }

    @Override
    public boolean deleteFile(int fileId) {
        Map<String, Object> fileInfo = iboardDAO.selectFileById(String.valueOf(fileId));
        if (fileInfo == null) return false;

        String filePath = "C:/MoyoLab.Studio/upload/" + fileInfo.get("FILE_NAME");
        File file = new File(filePath);
        if (file.exists()) {
            file.delete();
        }

        return iboardDAO.deleteFile(fileId) > 0;
    }

    @Override
    public String saveFile(MultipartFile file) {
        try {
            String uploadPath = "C:/MoyoLab.Studio/upload/";
            File folder = new File(uploadPath);
            if (!folder.exists()) folder.mkdirs();

            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String savedFileName = UUID.randomUUID().toString() + extension;

            File targetFile = new File(uploadPath + savedFileName);
            file.transferTo(targetFile);

            return savedFileName;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패: " + e.getMessage());
        }
    }
}
