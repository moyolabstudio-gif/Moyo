package com.springboot.project.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.springboot.project.dto.postDTO;
import com.springboot.project.service.IboardService;

@Controller
@RequestMapping("/project")
public class projectBoardController {

    @Autowired
    private IboardService iboardService;

    // 1. [페이지 이동] 더보기 버튼 누르면 여기로 옴
    // 해결책: wsId가 필수가 아니도록 (required = false) 설정
    @GetMapping("/board/list")
    public String getBoardListPage(@RequestParam("projId") Long projId, 
                                   @RequestParam(value = "type", required = false) String type, // 필수 제거
                                   @RequestParam(value = "wsId", required = false) Long wsId,
                                   Model model) {

        if (type == null || type.isEmpty()) {
            type = "FREE";
        }

        List<postDTO> boardList = iboardService.getListByProject(projId, type);

        model.addAttribute("boardList", boardList);
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", type);
        model.addAttribute("wsId", wsId);

        
        return "board/boardList";
    }

    // 2. [데이터 API]
    @GetMapping("/api/board-list")
    @ResponseBody
    public List<postDTO> getBoardListApi(@RequestParam("projId") Long projId, 
                                         @RequestParam("boardType") String boardType) {
        return iboardService.getListByProject(projId, boardType);
    }

    // 3. 글쓰기 API
    @PostMapping("/api/write")
    @ResponseBody
    public Map<String, String> write(@RequestBody postDTO post) {
        return Map.of("status", iboardService.registerPost(post) ? "SUCCESS" : "FAIL");
    }

    // 4. 삭제 API
    @DeleteMapping("/api/delete/{postId}")
    @ResponseBody
    public Map<String, String> delete(@PathVariable Long postId) {
        return Map.of("status", iboardService.deletePost(postId) ? "SUCCESS" : "FAIL");
    }
}