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
    // 요청 URL: /project/board/list
    @GetMapping("/board/list")
    public String getBoardListPage(@RequestParam("projId") Long projId, 
                                   @RequestParam("type") String type, 
                                   Model model) {
        model.addAttribute("projId", projId);
        model.addAttribute("boardType", type);
        return "workspace/boardList"; 
    }

    // 2. [데이터 API] 자바스크립트 fetch가 여기로 데이터를 가져옴
    // 요청 URL: /project/api/board-list
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