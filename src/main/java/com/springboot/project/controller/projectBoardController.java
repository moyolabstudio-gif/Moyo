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
import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/project")
public class projectBoardController {

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
                                   @RequestParam(value = "page", defaultValue = "1") int page,
                                   @RequestParam(value = "size", defaultValue = "10") int size,
                                   @RequestParam(value = "searchType", defaultValue = "all") String searchType,
                                   @RequestParam(value = "keyword", required = false) String keyword,
                                   Model model,
                                   HttpSession session) {

        if (type == null || type.isEmpty()) {
            type = "FREE";
        }

        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 5), 50);
        keyword = keyword == null ? "" : keyword.trim();

        int totalCount = iboardService.getProjectBoardListCount(projId, type, searchType, keyword);
        int totalPages = (int) Math.ceil((double) totalCount / size);
        if (totalPages > 0 && page > totalPages) page = totalPages;

        List<postDTO> boardList = iboardService.getListByProject(projId, type, page, size, searchType, keyword);

        model.addAttribute("boardList", boardList);
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", type);
        model.addAttribute("wsId", wsId);
        model.addAttribute("searchType", searchType);
        model.addAttribute("keyword", keyword);
        model.addAttribute("canManageBoard", canManagePin(wsId, projId, session));
        addPagingModel(model, page, size, totalCount);

        return "board/boardList";
    }

    // 데이터 API는 기존 방식 유지
    @GetMapping("/api/board-list")
    @ResponseBody
    public List<postDTO> getBoardListApi(@RequestParam("projId") Long projId,
                                         @RequestParam("boardType") String boardType) {
        return iboardService.getListByProject(projId, boardType);
    }

    @PostMapping("/api/write")
    @ResponseBody
    public Map<String, String> write(@RequestBody postDTO post) {
        return Map.of("status", iboardService.registerPost(post) ? "SUCCESS" : "FAIL");
    }

    @DeleteMapping("/api/delete/{postId}")
    @ResponseBody
    public Map<String, String> delete(@PathVariable Long postId) {
        return Map.of("status", iboardService.deletePost(postId) ? "SUCCESS" : "FAIL");
    }
}
