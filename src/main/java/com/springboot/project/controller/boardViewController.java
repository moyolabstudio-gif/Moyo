package com.springboot.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/group/board")
public class boardViewController {

    @Autowired
    private IboardService iboardService;


    private Long currentUserId(HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        return loginUser != null ? loginUser.getUserId() : null;
    }

    private boolean canManagePin(Long wsId, Long projId, HttpSession session) {
        Long userId = currentUserId(session);
        return iboardService.canManageBoardPin(wsId, projId, userId);
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

    // 1. 게시판 목록
    @GetMapping("/list")
    public String boardList(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "type", defaultValue = "FREE") String type,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "searchType", defaultValue = "all") String searchType,
            @RequestParam(value = "keyword", required = false) String keyword,
            Model model,
            HttpSession session) {

        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 5), 50);
        keyword = keyword == null ? "" : keyword.trim();

        if (wsId != null) {
            int totalCount = iboardService.getBoardListCount(wsId, type, searchType, keyword);
            int totalPages = (int) Math.ceil((double) totalCount / size);
            if (totalPages > 0 && page > totalPages) page = totalPages;

            List<postDTO> boardList = iboardService.getBoardList(wsId, type, page, size, searchType, keyword);
            model.addAttribute("boardList", boardList);
            addPagingModel(model, page, size, totalCount);
        } else {
            addPagingModel(model, page, size, 0);
        }

        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", type);
        model.addAttribute("canManageBoard", canManagePin(wsId, null, session));
        model.addAttribute("searchType", searchType);
        model.addAttribute("keyword", keyword);

        return "board/boardList";
    }

    // 2. 작성 폼 이동
    @GetMapping("/write")
    public String boardWriteForm(
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "type", defaultValue = "FREE") String type,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model,
            HttpSession session) {

        boolean canManageBoard = canManagePin(wsId, projId, session);
        if ("NOTICE".equalsIgnoreCase(type) && !canManageBoard) {
            return "redirect:/group/board/list?wsId=" + wsId
                    + (projId != null ? "&projId=" + projId : "")
                    + "&type=NOTICE&error=notice_forbidden";
        }

        model.addAttribute("wsId", wsId);
        model.addAttribute("boardType", type);
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
        List<Map<String, Object>> replyList = iboardService.getReplyList(postId);
        List<Map<String, Object>> fileList = iboardService.getFileList(postId);

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
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "isPinned", defaultValue = "N") String isPinned,
            @RequestParam(value = "pinStartDt", required = false) String pinStartDt,
            @RequestParam(value = "pinEndDt", required = false) String pinEndDt,
            HttpSession session) {

        com.springboot.project.dto.usersDto loginUser = (com.springboot.project.dto.usersDto) session.getAttribute("user");
        if (loginUser == null) return "redirect:/login";

        postDTO post = new postDTO();
        post.setWsId(wsId);
        post.setBoardType(boardType);
        post.setTitle(title);
        post.setContent(content);
        post.setUserId(loginUser.getUSER_ID());
        if (projId != null) post.setProjId(projId);

        boolean canManage = iboardService.canManageBoardPin(wsId, projId, loginUser.getUserId());
        if ("NOTICE".equalsIgnoreCase(boardType) && !canManage) {
            return "redirect:/group/board/list?wsId=" + wsId
                    + (projId != null ? "&projId=" + projId : "")
                    + "&type=NOTICE&error=notice_forbidden";
        }

        if (canManage && "Y".equalsIgnoreCase(isPinned)) {
            post.setIsPinned("Y");
            post.setPinStartDt(pinStartDt);
            post.setPinEndDt(pinEndDt);
        } else {
            post.setIsPinned("N");
            post.setPinStartDt(null);
            post.setPinEndDt(null);
        }

        boolean isSuccess = iboardService.registerPost(post);

        if (isSuccess) {
            if (projId != null) {
                return "redirect:/project/board/list?projId=" + projId + "&type=" + boardType + "&wsId=" + wsId;
            } else {
                return "redirect:/group/board/list?wsId=" + wsId + "&type=" + boardType;
            }
        }
        return "redirect:/group/board/write?wsId=" + wsId + "&type=" + boardType + "&error=failed";
    }

    @GetMapping("/modifyForm")
    public String boardModifyForm(
            @RequestParam("postId") int postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model,
            HttpSession session) {
        postDTO post = iboardService.getPostDetail(postId);
        List<Map<String, Object>> fileList = iboardService.getFileList(postId);
        model.addAttribute("post", post);
        model.addAttribute("fileList", fileList);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", post.getBoardType());
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
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        postDTO post = new postDTO();
        post.setPostId(postId);
        post.setWsId(wsId);
        post.setProjId(projId);
        post.setBoardType(boardType);
        post.setTitle(title);
        post.setContent(content);

        boolean canManage = canManagePin(wsId, projId, session);
        if (canManage && "Y".equalsIgnoreCase(isPinned)) {
            post.setIsPinned("Y");
            post.setPinStartDt(pinStartDt);
            post.setPinEndDt(pinEndDt);
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
                fileMap.put("originalName", file.getOriginalFilename());
                fileMap.put("fileSize", file.getSize());

                iboardService.insertFile(fileMap);
            }
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


    @GetMapping("/delete")
    public String boardDelete(
            @RequestParam("postId") Long postId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("boardType") String boardType) {

        boolean success = iboardService.deletePost(postId);

        if (!success) {
            return "redirect:/group/board/detail?postId=" + postId
                    + "&wsId=" + wsId
                    + (projId != null ? "&projId=" + projId : "")
                    + "&error=deleteFailed";
        }

        if (projId != null) {
            return "redirect:/project/board/list?projId=" + projId
                    + "&type=" + boardType
                    + "&wsId=" + wsId;
        }

        return "redirect:/group/board/list?wsId=" + wsId
                + "&type=" + boardType;
    }
}
