package com.springboot.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IworkspaceService;

import jakarta.servlet.http.HttpSession;


@Controller
@RequestMapping("/workspace")
public class workspaceController {

    // [추가] 7년 차의 감각으로 부품을 조립합니다. 
    // 서비스를 컨트롤러에 연결(주입)해야 사용할 수 있습니다.
    @Autowired
    private IworkspaceService workspaceService; 
    
    @Autowired
    private IprojectService projectService;
    
    @PostMapping("/api/create")
    @ResponseBody
    public Map<String, Object> createWorkspace(@RequestBody workspaceDTO dto, HttpSession session) {
        
        // 1. 서비스 호출 (이제 빨간 줄이 사라집니다!)
        // [주의] 서비스 인터페이스에 정의된 메서드명이 insertWorkspace인지 createWorkspace인지 확인하세요.
        // 아까 인터페이스에는 createWorkspace로 만들었으니 이름을 맞춰야 합니다.
        Long generatedId = workspaceService.createWorkspace(dto, 1L); // 1L은 임시 유저 ID
        
        // 2. 세션 저장
        session.setAttribute("currentWsId", generatedId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("wsId", generatedId);
        return response; 
    }
    
 // [추가] 워크스페이스 생성 페이지로 가는 라우팅
    @GetMapping("/create")
    public String workspaceCreatePage() {
        return "workspace/workspaceCreate"; // jsp 경로: /WEB-INF/views/workspace/workspaceCreate.jsp
    }

    // [추가] 워크스페이스 생성 후 이동할 메인 페이지 (여기에 프로젝트 생성 버튼이 있겠죠?)
    @GetMapping("/main")
    public String workspaceMainPage(@RequestParam("wsId") Long wsId, HttpSession session, Model model) {
        // 1. 현재 접속 중인 워크스페이스 ID 고정
        session.setAttribute("currentWsId", wsId);
        
        // 2. 워크스페이스 정보 (팀 이름 등)
        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        model.addAttribute("workspace", workspace);
        
        // 3. [추가] 해당 워크스페이스의 프로젝트 목록
        List<projectRequestDTO> projectList = projectService.getProjectsByWsId(wsId);
        model.addAttribute("projectList", projectList);

        return "workspace/workspaceMain"; 
    }
    @GetMapping("/list")
    public String workspaceList(HttpSession session, Model model) {
        // 세션에서 로그인한 유저 정보 가져오기 (실제 유저 ID 사용)
        usersDto user = (usersDto) session.getAttribute("user");
        
        // 유저가 로그인 상태일 때만 조회
        if (user != null) {
            List<workspaceDTO> wsList = workspaceService.getWorkspaceList(user.getUserId());
            model.addAttribute("wsList", wsList);
        }
        
        return "workspace/workspaceList";
    }
}
