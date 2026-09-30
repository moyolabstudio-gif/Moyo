package com.springboot.project.controller;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.postDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IboardService;
import com.springboot.project.service.BoardAuthorizationService;
import com.springboot.project.service.UploadSecurityService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/group/board")
public class boardViewController {

    @Autowired
    private IboardService iboardService;

    @Autowired
    private BoardAuthorizationService boardAuthorizationService;

    @Autowired
    private UploadSecurityService uploadSecurityService;


    private Long currentUserId(HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        return loginUser != null ? loginUser.getUserId() : null;
    }

    private boolean canManagePin(Long wsId, Long projId, HttpSession session) {
        Long userId = currentUserId(session);
        return boardAuthorizationService.canManageBoard(wsId, projId, userId);
    }



    private Long toLongValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean canManageReport(Map<String, Object> report, HttpSession session) {
        if (report == null) return false;
        Long reportWsId = toLongValue(report.get("WS_ID"));
        Long reportProjId = toLongValue(report.get("PROJ_ID"));
        return canManagePin(reportWsId, reportProjId, session);
    }

    private String mapString(Map<String, Object> row, String key) {
        if (row == null) return null;
        Object value = row.get(key);
        if (value == null) value = row.get(key.toLowerCase());
        return value == null ? null : String.valueOf(value);
    }

    private Long mapLong(Map<String, Object> row, String key) {
        if (row == null) return null;
        Object value = row.get(key);
        if (value == null) value = row.get(key.toLowerCase());
        if (value instanceof Number n) return n.longValue();
        try { return value == null ? null : Long.valueOf(String.valueOf(value)); } catch (NumberFormatException e) { return null; }
    }


    private void decorateBoardAttachmentDisplay(List<Map<String, Object>> fileList) {
        if (fileList == null || fileList.isEmpty()) return;

        for (Map<String, Object> file : fileList) {
            if (file == null) continue;

            String originalName = mapString(file, "FILE_ORIGINAL_NAME");
            String storedName = mapString(file, "FILE_NAME");
            String sourceName = (originalName != null && !originalName.isBlank()) ? originalName : storedName;

            // 사용자가 업로드한 원본 파일명을 그대로 표시한다.
            // FILE_NAME은 서버 저장용 이름이므로 원본명이 없는 레거시 데이터에서만 fallback으로 사용한다.
            file.put("DISPLAY_NAME", sourceName);
            file.put("DISPLAY_SIZE", formatAttachmentSize(file.get("FILE_SIZE") != null ? file.get("FILE_SIZE") : file.get("file_size")));
        }
    }

    private String formatAttachmentSize(Object rawSize) {
        if (rawSize == null) return "";
        long bytes;
        try {
            bytes = rawSize instanceof Number n ? n.longValue() : Long.parseLong(String.valueOf(rawSize));
        } catch (NumberFormatException e) {
            return "";
        }

        if (bytes < 1024) return bytes + " B";
        double kb = bytes / 1024d;
        if (kb < 1024) return String.format(java.util.Locale.ROOT, kb >= 100 ? "%.0f KB" : "%.1f KB", kb);
        double mb = kb / 1024d;
        return String.format(java.util.Locale.ROOT, mb >= 100 ? "%.0f MB" : "%.1f MB", mb);
    }

    private boolean channelMatchesScope(Map<String, Object> channel, Long wsId, Long projId) {
        if (channel == null) return false;
        Long cWsId = mapLong(channel, "WS_ID");
        Long cProjId = mapLong(channel, "PROJ_ID");
        return projId != null ? projId.equals(cProjId) : cProjId == null && wsId != null && wsId.equals(cWsId);
    }

    private Map<String, Object> resolveChannel(Long wsId, Long projId, Long channelId, String legacyType, Long userId) {
        iboardService.ensureDefaultChannels(wsId, projId, userId);
        if (channelId != null) {
            Map<String, Object> channel = iboardService.getBoardChannel(channelId);
            return channelMatchesScope(channel, wsId, projId) ? channel : null;
        }
        String wanted = "NOTICE".equalsIgnoreCase(legacyType) ? "NOTICE" : "GENERAL";
        for (Map<String, Object> channel : iboardService.getBoardChannels(wsId, projId, false)) {
            if (wanted.equalsIgnoreCase(mapString(channel, "CHANNEL_TYPE"))) return channel;
        }
        return null;
    }

    private String reportRedirectUrl(Long wsId, Long projId, String status, String contentType, String keyword, int page) {
        StringBuilder url = new StringBuilder("redirect:/group/board/reports?wsId=").append(wsId);
        if (projId != null) url.append("&projId=").append(projId);
        if (status != null && !status.isBlank()) url.append("&status=").append(status);
        if (contentType != null && !contentType.isBlank()) url.append("&contentType=").append(contentType);
        if (keyword != null && !keyword.isBlank()) {
            url.append("&keyword=").append(URLEncoder.encode(keyword, StandardCharsets.UTF_8));
        }
        url.append("&page=").append(Math.max(page, 1));
        return url.toString();
    }

    private void addPagingModel(Model model, int page, int size, int totalCount) {
        int totalPages = (int) Math.ceil((double) totalCount / size);
        if (totalPages < 1) totalPages = 1;

        int blockSize = 5;
        int startPage = ((page - 1) / blockSize) * blockSize + 1;
        int endPage = Math.min(startPage + blockSize - 1, totalPages);

        model.addAttribute("page", page);
        model.addAttribute("size", size);
        model.addAttribute("totalCount", totalCount);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("startPage", startPage);
        model.addAttribute("endPage", endPage);
        model.addAttribute("hasPrev", page > 1);
        model.addAttribute("hasNext", page < totalPages);
    }

    private String redirectLegacyFileBoard(Long wsId, Long projId) {
        if (projId != null) {
            return "redirect:/project/files?projId=" + projId
                    + (wsId != null ? "&wsId=" + wsId : "");
        }
        return "redirect:/group/files?wsId=" + wsId;
    }

    // 1. 게시판 목록
    @GetMapping("/list")
    public String boardList(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "channelId", required = false) Long channelId,
            @RequestParam(value = "type", defaultValue = "FREE") String type,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "searchType", defaultValue = "all") String searchType,
            @RequestParam(value = "keyword", required = false) String keyword,
            Model model,
            HttpSession session) {

        if ("FILE".equalsIgnoreCase(type)) {
            return redirectLegacyFileBoard(wsId, projId);
        }
        Long userId = currentUserId(session);
        if (userId == null) return "redirect:/users/loginForm";
        if (!boardAuthorizationService.canAccessBoard(wsId, projId, userId)) return "redirect:/?authError=board";
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 5), 50);
        keyword = keyword == null ? "" : keyword.trim();

        boolean canManageBoard = canManagePin(wsId, projId, session);
        Map<String, Object> currentChannel = resolveChannel(wsId, projId, channelId, type, userId);
        if (currentChannel == null) return "redirect:/?authError=board";
        if (!canManageBoard && "N".equalsIgnoreCase(mapString(currentChannel, "ACTIVE_YN"))) {
            if (projId != null) {
                return "redirect:/project/board/list?projId=" + projId + "&wsId=" + wsId;
            }
            return "redirect:/group/board/list?wsId=" + wsId;
        }
        channelId = mapLong(currentChannel, "CHANNEL_ID");
        type = "NOTICE".equalsIgnoreCase(mapString(currentChannel, "CHANNEL_TYPE")) ? "NOTICE" : "FREE";

        int totalCount = iboardService.getBoardListByChannelCount(channelId, searchType, keyword);
        int totalPages = (int) Math.ceil((double) totalCount / size);
        if (totalPages > 0 && page > totalPages) page = totalPages;
        List<postDTO> boardList = iboardService.getBoardListByChannel(channelId, page, size, searchType, keyword);
        model.addAttribute("boardList", boardList);
        addPagingModel(model, page, size, totalCount);

        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", type);
        model.addAttribute("channelId", channelId);
        model.addAttribute("currentChannel", currentChannel);
        model.addAttribute("currentChannelName", mapString(currentChannel, "CHANNEL_NAME"));
        model.addAttribute("boardChannels", iboardService.getBoardChannels(wsId, projId, false));
        model.addAttribute("manageChannels", canManageBoard ? iboardService.getBoardChannels(wsId, projId, true) : List.of());
        model.addAttribute("canManageBoard", canManageBoard);
        model.addAttribute("reportWaitingCount", canManageBoard ? iboardService.getWaitingReportCount(wsId, projId) : 0);
        model.addAttribute("searchType", searchType);
        model.addAttribute("keyword", keyword);

        return "board/boardList";
    }

    // 2. 작성 폼 이동
    @GetMapping("/write")
    public String boardWriteForm(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "type", defaultValue = "FREE") String type,
            @RequestParam(value = "channelId", required = false) Long channelId,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model,
            HttpSession session) {

        if ("FILE".equalsIgnoreCase(type)) {
            return redirectLegacyFileBoard(wsId, projId);
        }
        Long userId = currentUserId(session);
        if (userId == null) return "redirect:/users/loginForm";
        if (!boardAuthorizationService.canAccessBoard(wsId, projId, userId)) return "redirect:/?authError=board";

        boolean canManageBoard = boardAuthorizationService.canManageBoard(wsId, projId, userId);
        Map<String, Object> currentChannel = resolveChannel(wsId, projId, channelId, type, userId);
        if (currentChannel == null) return "redirect:/?authError=board";
        channelId = mapLong(currentChannel, "CHANNEL_ID");
        type = "NOTICE".equalsIgnoreCase(mapString(currentChannel, "CHANNEL_TYPE")) ? "NOTICE" : "FREE";
        if ("NOTICE".equalsIgnoreCase(type) && !canManageBoard) {
            if (projId != null) {
                return "redirect:/project/board/list?projId=" + projId + "&wsId=" + wsId
                        + "&type=NOTICE&error=notice_forbidden";
            }
            return "redirect:/group/board/list?wsId=" + wsId + "&type=NOTICE&error=notice_forbidden";
        }

        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", type);
        model.addAttribute("channelId", channelId);
        model.addAttribute("currentChannelName", mapString(currentChannel, "CHANNEL_NAME"));
        model.addAttribute("boardChannels", iboardService.getBoardChannels(wsId, projId, false));
        model.addAttribute("projId", projId);
        model.addAttribute("canManageBoard", canManageBoard);

        return "board/boardWrite";
    }

    // 3. 상세 조회
    @GetMapping("/detail")
    public String boardDetail(@RequestParam("postId") int postId,
                              @RequestParam(value = "wsId", required = false) Long wsId,
                              @RequestParam(value = "projId", required = false) Long projId,
                              Model model,
                              HttpSession session) {
        postDTO post = iboardService.getPostDetail(postId);
        Long userId = currentUserId(session);
        if (userId == null) return "redirect:/users/loginForm";
        if (post == null || !boardAuthorizationService.canViewPost((long) postId, userId)) return "redirect:/?authError=board";
        if (post != null && "FILE".equalsIgnoreCase(post.getBoardType())) {
            return redirectLegacyFileBoard(post.getWsId() != null ? post.getWsId() : wsId, projId);
        }

        // 같은 브라우저 세션에서는 동일 게시글 조회수를 1회만 집계한다.
        // 새로고침/상세 내부 재요청으로 VIEW_COUNT가 반복 증가하는 것을 방지한다.
        synchronized (session) {
            @SuppressWarnings("unchecked")
            Set<Integer> viewedPostIds = (Set<Integer>) session.getAttribute("moyoBoardViewedPostIds");
            if (viewedPostIds == null) {
                viewedPostIds = new HashSet<>();
            }
            if (!viewedPostIds.contains(postId) && iboardService.increasePostViewCount(postId)) {
                viewedPostIds.add(postId);
                session.setAttribute("moyoBoardViewedPostIds", viewedPostIds);
                post = iboardService.getPostDetail(postId);
            }
        }

        List<Map<String, Object>> replyList = iboardService.getReplyList(postId);
        List<Map<String, Object>> fileList = iboardService.getFileList(postId);
        decorateBoardAttachmentDisplay(fileList);

        model.addAttribute("post", post);
        model.addAttribute("replyList", replyList);
        model.addAttribute("fileList", fileList);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("canManageBoard", canManagePin(post != null ? post.getWsId() : wsId, projId, session));

        return "board/boardDetail";
    }

    // 4. 게시글 등록
    @PostMapping("/register")
    public String boardRegister(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam("boardType") String boardType,
            @RequestParam(value = "channelId", required = false) Long channelId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "isPinned", defaultValue = "N") String isPinned,
            @RequestParam(value = "pinStartDt", required = false) String pinStartDt,
            @RequestParam(value = "pinEndDt", required = false) String pinEndDt,
            @RequestParam(value = "notifyMembers", defaultValue = "N") String notifyMembers,
            HttpSession session) {

        com.springboot.project.dto.usersDto loginUser = (com.springboot.project.dto.usersDto) session.getAttribute("user");
        if (loginUser == null) return "redirect:/users/loginForm";
        if (!boardAuthorizationService.canAccessBoard(wsId, projId, loginUser.getUserId())) return "redirect:/?authError=board";
        if ("FILE".equalsIgnoreCase(boardType)) {
            return redirectLegacyFileBoard(wsId, projId);
        }
        Map<String, Object> currentChannel = resolveChannel(wsId, projId, channelId, boardType, loginUser.getUserId());
        if (currentChannel == null) return "redirect:/?authError=board";
        channelId = mapLong(currentChannel, "CHANNEL_ID");
        boardType = "NOTICE".equalsIgnoreCase(mapString(currentChannel, "CHANNEL_TYPE")) ? "NOTICE" : "FREE";
        if ("NOTICE".equalsIgnoreCase(boardType) && !boardAuthorizationService.canManageBoard(wsId, projId, loginUser.getUserId())) {
            if (projId != null) {
                return "redirect:/project/board/list?projId=" + projId + "&wsId=" + wsId + "&channelId=" + channelId;
            }
            return "redirect:/group/board/list?wsId=" + wsId + "&channelId=" + channelId;
        }

        postDTO post = new postDTO();
        post.setWsId(wsId);
        post.setBoardType(boardType);
        post.setChannelId(channelId);
        post.setTitle(title);
        post.setContent(content);
        post.setUserId(loginUser.getUSER_ID());
        if (projId != null) post.setProjId(projId);

        boolean canManage = boardAuthorizationService.canManageBoard(wsId, projId, loginUser.getUserId());
        if ("NOTICE".equalsIgnoreCase(boardType) && !canManage) {
            if (projId != null) {
                return "redirect:/project/board/list?projId=" + projId + "&wsId=" + wsId
                        + "&type=NOTICE&error=notice_forbidden";
            }
            return "redirect:/group/board/list?wsId=" + wsId + "&type=NOTICE&error=notice_forbidden";
        }

        boolean isNotice = "NOTICE".equalsIgnoreCase(boardType);
        if (canManage && isNotice && "Y".equalsIgnoreCase(isPinned)) {
            post.setIsPinned("Y");
            post.setPinStartDt(pinStartDt);
            post.setPinEndDt(pinEndDt);
        } else {
            post.setIsPinned("N");
            post.setPinStartDt(null);
            post.setPinEndDt(null);
        }
        post.setNotifyMembers(canManage && isNotice && "Y".equalsIgnoreCase(notifyMembers) ? "Y" : "N");

        boolean isSuccess = iboardService.registerPost(post);

        if (isSuccess) {
            if ("NOTICE".equalsIgnoreCase(post.getBoardType()) && "Y".equalsIgnoreCase(post.getNotifyMembers())) {
                iboardService.sendBoardNoticeNotification(post, loginUser.getUserId(), false);
            }
            if (projId != null) {
                return "redirect:/project/board/list?projId=" + projId + "&type=" + boardType + "&wsId=" + wsId + "&channelId=" + channelId;
            } else {
                return "redirect:/group/board/list?wsId=" + wsId + "&type=" + boardType + "&channelId=" + channelId;
            }
        }
        return "redirect:/group/board/write?wsId=" + wsId
                + (projId != null ? "&projId=" + projId : "")
                + "&type=" + boardType + "&channelId=" + channelId + "&error=failed";
    }

    @GetMapping("/modifyForm")
    public String boardModifyForm(
            @RequestParam("postId") int postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model,
            HttpSession session) {
        postDTO post = iboardService.getPostDetail(postId);
        Long userId = currentUserId(session);
        if (userId == null) return "redirect:/users/loginForm";
        if (post == null || !boardAuthorizationService.canEditPost((long) postId, userId)) return "redirect:/?authError=board-edit";
        if (post != null && "FILE".equalsIgnoreCase(post.getBoardType())) {
            return redirectLegacyFileBoard(post.getWsId() != null ? post.getWsId() : wsId, post.getProjId());
        }
        wsId = post.getWsId();
        projId = post.getProjId();
        List<Map<String, Object>> fileList = iboardService.getFileList(postId);
        model.addAttribute("post", post);
        model.addAttribute("fileList", fileList);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", post.getBoardType());
        Map<String, Object> currentChannel = post.getChannelId() != null ? iboardService.getBoardChannel(post.getChannelId()) : null;
        model.addAttribute("currentChannelName", currentChannel != null ? mapString(currentChannel, "CHANNEL_NAME") : ("NOTICE".equalsIgnoreCase(post.getBoardType()) ? "공지" : "자유게시판"));
        model.addAttribute("canManageBoard", canManagePin(post.getWsId(), projId, session));
        return "board/boardModify";
    }

    @PostMapping("/modify")
    public String boardModify(
            @RequestParam("postId") Long postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("boardType") String boardType,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "isPinned", defaultValue = "N") String isPinned,
            @RequestParam(value = "pinStartDt", required = false) String pinStartDt,
            @RequestParam(value = "pinEndDt", required = false) String pinEndDt,
            @RequestParam(value = "resendNotification", defaultValue = "N") String resendNotification,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        Long userId = currentUserId(session);
        if (userId == null) return "redirect:/users/loginForm";
        postDTO existingPost = iboardService.getPostDetail(postId.intValue());
        if (existingPost == null || !boardAuthorizationService.canEditPost(postId, userId)) return "redirect:/?authError=board-edit";
        wsId = existingPost.getWsId();
        projId = existingPost.getProjId();
        boardType = existingPost.getBoardType();
        if ("FILE".equalsIgnoreCase(boardType)) {
            return redirectLegacyFileBoard(wsId, projId);
        }

        postDTO post = new postDTO();
        post.setPostId(postId);
        post.setWsId(wsId);
        post.setProjId(projId);
        post.setBoardType(boardType);
        post.setTitle(title);
        post.setContent(content);

        boolean canManage = boardAuthorizationService.canManageBoard(wsId, projId, userId);
        boolean isNotice = "NOTICE".equalsIgnoreCase(boardType);
        if (canManage && isNotice) {
            if ("Y".equalsIgnoreCase(isPinned)) {
                post.setIsPinned("Y");
                post.setPinStartDt(pinStartDt);
                post.setPinEndDt(pinEndDt);
            } else {
                post.setIsPinned("N");
                post.setPinStartDt(null);
                post.setPinEndDt(null);
            }
        } else if (!canManage && isNotice) {
            // 내용 수정 권한만 가진 사용자는 관리자 전용 공지 설정을 변경할 수 없다.
            post.setIsPinned(existingPost.getIsPinned());
            post.setPinStartDt(existingPost.getPinStartDt());
            post.setPinEndDt(existingPost.getPinEndDt());
        } else {
            post.setIsPinned("N");
            post.setPinStartDt(null);
            post.setPinEndDt(null);
        }

        boolean success = iboardService.modifyPost(post);

        if (!success) {
            return "redirect:/group/board/modifyForm?postId=" + postId
                    + "&wsId=" + wsId
                    + (projId != null ? "&projId=" + projId : "")
                    + "&error=failed";
        }

        if (files != null) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;

                String savedName = iboardService.saveFile(file);

                Map<String, Object> fileMap = new HashMap<>();
                fileMap.put("postId", postId);
                fileMap.put("fileName", savedName);
                fileMap.put("originalName", uploadSecurityService.safeOriginalName(file.getOriginalFilename()));
                fileMap.put("fileSize", file.getSize());

                iboardService.insertFile(fileMap);
            }
        }

        if (canManage && isNotice && "Y".equalsIgnoreCase(resendNotification)) {
            iboardService.sendBoardNoticeNotification(post, userId, true);
        }

        return "redirect:/group/board/detail?postId=" + postId
                + "&wsId=" + wsId
                + (projId != null ? "&projId=" + projId : "");
    }



    @GetMapping("/reports")
    public String boardReportManage(
            @RequestParam("wsId") Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "status", defaultValue = "WAITING") String status,
            @RequestParam(value = "contentType", defaultValue = "ALL") String contentType,
            @RequestParam(value = "keyword", defaultValue = "") String keyword,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Model model,
            HttpSession session) {

        if (!canManagePin(wsId, projId, session)) {
            return projId != null
                    ? "redirect:/project/main?projId=" + projId + "&wsId=" + wsId
                    : "redirect:/workspace/main?wsId=" + wsId;
        }

        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 5), 50);

        int totalCount = iboardService.getReportListCount(wsId, projId, status, contentType, keyword);
        int totalPages = (int) Math.ceil((double) totalCount / size);
        if (totalPages > 0 && page > totalPages) page = totalPages;

        List<Map<String, Object>> reportList = iboardService.getReportList(wsId, projId, status, contentType, keyword, page, size);

        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("status", status);
        model.addAttribute("contentType", contentType);
        model.addAttribute("keyword", keyword);
        model.addAttribute("reportList", reportList);
        addPagingModel(model, page, size, totalCount);

        return "board/boardReportManage";
    }

    @PostMapping("/reports/status")
    public String updateBoardReportStatus(
            @RequestParam("reportId") Long reportId,
            @RequestParam("status") String newStatus,
            @RequestParam("wsId") Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "filterStatus", defaultValue = "WAITING") String filterStatus,
            @RequestParam(value = "contentType", defaultValue = "ALL") String contentType,
            @RequestParam(value = "keyword", defaultValue = "") String keyword,
            @RequestParam(value = "page", defaultValue = "1") int page,
            HttpSession session) {

        Long userId = currentUserId(session);
        Map<String, Object> report = iboardService.getReportById(reportId);
        if (userId == null || !canManageReport(report, session)) {
            return "redirect:/workspace/main?wsId=" + wsId;
        }

        iboardService.updateReportStatus(reportId, newStatus, userId);
        return reportRedirectUrl(wsId, projId, filterStatus, contentType, keyword, page);
    }

    @PostMapping("/reports/delete-content")
    public String deleteReportedContent(
            @RequestParam("reportId") Long reportId,
            @RequestParam("wsId") Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "filterStatus", defaultValue = "WAITING") String filterStatus,
            @RequestParam(value = "contentType", defaultValue = "ALL") String contentType,
            @RequestParam(value = "keyword", defaultValue = "") String keyword,
            @RequestParam(value = "page", defaultValue = "1") int page,
            HttpSession session) {

        Long userId = currentUserId(session);
        Map<String, Object> report = iboardService.getReportById(reportId);
        if (userId == null || !canManageReport(report, session)) {
            return "redirect:/workspace/main?wsId=" + wsId;
        }

        iboardService.deleteReportedContent(reportId, userId);
        return reportRedirectUrl(wsId, projId, filterStatus, contentType, keyword, page);
    }


    @PostMapping("/delete")
    public String boardDelete(
            @RequestParam("postId") Long postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("boardType") String boardType,
            HttpSession session) {

        Long userId = currentUserId(session);
        if (userId == null) return "redirect:/users/loginForm";
        postDTO existingPost = iboardService.getPostDetail(postId.intValue());
        if (existingPost == null || !boardAuthorizationService.canDeletePost(postId, userId)) return "redirect:/?authError=board-delete";
        wsId = existingPost.getWsId();
        projId = existingPost.getProjId();
        boardType = existingPost.getBoardType();

        boolean success = iboardService.deletePost(postId, userId);

        if (!success) {
            return "redirect:/group/board/detail?postId=" + postId
                    + "&wsId=" + wsId
                    + (projId != null ? "&projId=" + projId : "")
                    + "&error=deleteFailed";
        }

        if (projId != null) {
            return "redirect:/project/board/list?projId=" + projId
                    + "&type=" + boardType
                    + "&wsId=" + wsId
                    + (existingPost.getChannelId() != null ? "&channelId=" + existingPost.getChannelId() : "");
        }

        return "redirect:/group/board/list?wsId=" + wsId
                + "&type=" + boardType
                + (existingPost.getChannelId() != null ? "&channelId=" + existingPost.getChannelId() : "");
    }
}
