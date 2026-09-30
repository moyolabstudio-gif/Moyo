package com.springboot.project.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.springboot.project.dto.postDTO;
import com.springboot.project.service.IboardService;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.service.BoardAuthorizationService;
import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/project")
public class projectBoardController {

    @Autowired
    private IboardService iboardService;

    @Autowired
    private IprojectService projectService;

    @Autowired
    private IprojectAuthorizationService projectAuthorizationService;

    @Autowired
    private BoardAuthorizationService boardAuthorizationService;


    private Long currentUserId(HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        return loginUser != null ? loginUser.getUserId() : null;
    }

    private boolean canManagePin(Long wsId, Long projId, HttpSession session) {
        Long userId = currentUserId(session);
        return iboardService.canManageBoardPin(wsId, projId, userId);
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

    private Map<String, Object> resolveChannel(Long wsId, Long projId, Long channelId, String legacyType, Long userId) {
        iboardService.ensureDefaultChannels(wsId, projId, userId);
        if (channelId != null) {
            Map<String, Object> channel = iboardService.getBoardChannel(channelId);
            if (channel != null && projId.equals(mapLong(channel, "PROJ_ID"))) return channel;
            return null;
        }
        String wanted = "NOTICE".equalsIgnoreCase(legacyType) ? "NOTICE" : "GENERAL";
        for (Map<String, Object> channel : iboardService.getBoardChannels(wsId, projId, false)) {
            if (wanted.equalsIgnoreCase(mapString(channel, "CHANNEL_TYPE"))) return channel;
        }
        return null;
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

    // 게시판 목록 페이지
    @GetMapping("/board/list")
    public String getBoardListPage(@RequestParam("projId") Long projId,
                                   @RequestParam(value = "type", required = false) String type,
                                   @RequestParam(value = "wsId", required = false) Long wsId,
                                   @RequestParam(value = "channelId", required = false) Long channelId,
                                   @RequestParam(value = "page", defaultValue = "1") int page,
                                   @RequestParam(value = "size", defaultValue = "10") int size,
                                   @RequestParam(value = "searchType", defaultValue = "all") String searchType,
                                   @RequestParam(value = "keyword", required = false) String keyword,
                                   Model model,
                                   HttpSession session) {

        projectRequestDTO project = getAccessibleProject(projId, wsId, session);
        if (project == null) {
            return currentUserId(session) == null ? "redirect:/login" : "redirect:/project/list";
        }
        wsId = project.getWsId();

        if (type == null || type.isEmpty()) {
            type = "FREE";
        }

        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 5), 50);
        keyword = keyword == null ? "" : keyword.trim();

        Long viewerUserId = currentUserId(session);
        boolean projectReadOnly = viewerUserId != null
                && projectAuthorizationService.isProjectReadOnly(projId, viewerUserId);
        boolean canManageBoard = !projectReadOnly && canManagePin(wsId, projId, session);
        Map<String, Object> currentChannel = resolveChannel(wsId, projId, channelId, type, viewerUserId);
        if (currentChannel == null) return "redirect:/project/list";
        if (!canManageBoard && "N".equalsIgnoreCase(mapString(currentChannel, "ACTIVE_YN"))) {
            return "redirect:/project/board/list?projId=" + projId + "&wsId=" + wsId;
        }
        channelId = mapLong(currentChannel, "CHANNEL_ID");
        type = "NOTICE".equalsIgnoreCase(mapString(currentChannel, "CHANNEL_TYPE")) ? "NOTICE" : "FREE";

        int totalCount = iboardService.getBoardListByChannelCount(channelId, searchType, keyword);
        int totalPages = (int) Math.ceil((double) totalCount / size);
        if (totalPages > 0 && page > totalPages) page = totalPages;
        List<postDTO> boardList = iboardService.getBoardListByChannel(channelId, page, size, searchType, keyword);

        model.addAttribute("boardList", boardList);
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", type);
        model.addAttribute("channelId", channelId);
        model.addAttribute("currentChannel", currentChannel);
        model.addAttribute("currentChannelName", mapString(currentChannel, "CHANNEL_NAME"));
        model.addAttribute("boardChannels", iboardService.getBoardChannels(wsId, projId, false));
        model.addAttribute("manageChannels", canManageBoard ? iboardService.getBoardChannels(wsId, projId, true) : List.of());
        model.addAttribute("wsId", wsId);
        model.addAttribute("searchType", searchType);
        model.addAttribute("keyword", keyword);
        model.addAttribute("projectReadOnly", projectReadOnly);
        model.addAttribute("canManageBoard", canManageBoard);
        model.addAttribute("reportWaitingCount", canManageBoard ? iboardService.getWaitingReportCount(wsId, projId) : 0);
        addPagingModel(model, page, size, totalCount);

        return "board/boardList";
    }

    // 데이터 API는 기존 방식 유지
    @GetMapping("/api/board-list")
    @ResponseBody
    public List<postDTO> getBoardListApi(@RequestParam("projId") Long projId,
                                         @RequestParam("boardType") String boardType,
                                         HttpSession session) {
        if (getAccessibleProject(projId, null, session) == null) {
            return List.of();
        }
        return iboardService.getListByProject(projId, boardType);
    }

    @PostMapping("/api/write")
    @ResponseBody
    public Map<String, String> write(@RequestBody postDTO post, HttpSession session) {
        if (post == null || getAccessibleProject(post.getProjId(), post.getWsId(), session) == null) {
            return Map.of("status", "NO_PERMISSION");
        }
        Long userId = currentUserId(session);
        if (!projectAuthorizationService.canModifyProjectContent(post.getProjId(), userId)) {
            return Map.of("status", "READ_ONLY");
        }
        if (post.getChannelId() != null) {
            Map<String, Object> channel = iboardService.getBoardChannel(post.getChannelId());
            if (channel == null || !post.getProjId().equals(mapLong(channel, "PROJ_ID"))) return Map.of("status", "INVALID_CHANNEL");
            post.setBoardType("NOTICE".equalsIgnoreCase(mapString(channel, "CHANNEL_TYPE")) ? "NOTICE" : "FREE");
        }
        boolean canManage = boardAuthorizationService.canManageBoard(post.getWsId(), post.getProjId(), userId);
        if ("NOTICE".equalsIgnoreCase(post.getBoardType()) && !canManage) {
            return Map.of("status", "NO_PERMISSION");
        }
        post.setUserId(userId);
        boolean isNotice = "NOTICE".equalsIgnoreCase(post.getBoardType());
        if (!canManage || !isNotice || !"Y".equalsIgnoreCase(post.getIsPinned())) {
            post.setIsPinned("N");
            post.setPinStartDt(null);
            post.setPinEndDt(null);
        }
        post.setNotifyMembers(canManage && isNotice && "Y".equalsIgnoreCase(post.getNotifyMembers()) ? "Y" : "N");
        boolean success = iboardService.registerPost(post);
        if (success && "NOTICE".equalsIgnoreCase(post.getBoardType()) && "Y".equalsIgnoreCase(post.getNotifyMembers())) {
            iboardService.sendBoardNoticeNotification(post, userId, false);
        }
        return Map.of("status", success ? "SUCCESS" : "FAIL");
    }

    @DeleteMapping("/api/delete/{postId}")
    @ResponseBody
    public Map<String, String> delete(@PathVariable("postId") Long postId, HttpSession session) {
        Long userId = currentUserId(session);
        if (userId == null) return Map.of("status", "LOGIN_REQUIRED");
        postDTO post = iboardService.getPostDetail(postId.intValue());
        if (post != null && post.getProjId() != null
                && !projectAuthorizationService.canModifyProjectContent(post.getProjId(), userId)) {
            return Map.of("status", "READ_ONLY");
        }
        if (!boardAuthorizationService.canDeletePost(postId, userId)) return Map.of("status", "NO_PERMISSION");
        return Map.of("status", iboardService.deletePost(postId, userId) ? "SUCCESS" : "FAIL");
    }

    private projectRequestDTO getAccessibleProject(Long projId, Long requestedWsId, HttpSession session) {
        Long userId = currentUserId(session);
        if (projId == null || userId == null) return null;
        return projectAuthorizationService.getAccessibleProject(projId, requestedWsId, userId);
    }
}
