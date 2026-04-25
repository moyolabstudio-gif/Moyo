package com.springboot.project.controller;

import java.util.ArrayList;
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
    
    @Autowired
    private com.springboot.project.dao.IusersDao usersDao; // 유저 검색용

    @Autowired
    private com.springboot.project.dao.IworkspaceDAO workspaceDAO; // 멤버 초대용 (이름 확인!)
   
    @PostMapping("/api/create")
    @ResponseBody
    public Map<String, Object> createWorkspace(@RequestBody workspaceDTO dto, HttpSession session) {
        
        // 1. 세션에서 로그인 유저 ID 가져오기 (7년 차의 감각: 세션 만료 체크 포함)
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "fail");
            return error;
        }
        
        // 2. 서비스 호출 (이제 내부에서 멤버 등록까지 완벽히 처리됨!)
        Long generatedId = workspaceService.createWorkspace(dto, user.getUserId());
        
        // 3. 세션 업데이트 (현재 워크스페이스 ID 저장)
        session.setAttribute("currentWsId", generatedId);
        
        // 4. 응답 데이터 구성 (이동할 URL을 포함해서 보냄)
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("wsId", generatedId);
        // [수정 포인트] 프로젝트 생성 페이지가 아니라 워크스페이스 메인으로!
        response.put("redirectUrl", "/workspace/main?wsId=" + generatedId);
        
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
        session.setAttribute("currentWsId", wsId);
        
        // 1. 워크스페이스 정보
        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        model.addAttribute("workspace", workspace);
        
        // 2. 프로젝트 목록
        List<projectRequestDTO> projectList = projectService.getProjectsByWsId(wsId);
        model.addAttribute("projectList", projectList);

        // 3. [추가] 멤버 목록 조회
        List<Map<String, Object>> memberList = workspaceService.getWorkspaceMembers(wsId);
        model.addAttribute("memberList", memberList);

        return "workspace/workspaceMain"; 
    }
    @GetMapping("/list")
    public String workspaceList(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");
        
        if (user != null) {
            System.out.println("현재 로그인 유저 ID: " + user.getUserId()); // 이 ID가 DB의 WS_MEMBERS에 있는 ID와 일치해야 함
            List<workspaceDTO> wsList = workspaceService.getWorkspaceList(user.getUserId());
            model.addAttribute("wsList", wsList);
        }
        return "workspace/workspaceList";
    }
    
    @GetMapping("/api/search-member")
    @ResponseBody
    public List<usersDto> searchMember(@RequestParam("email") String email) {
        System.out.println("검색 요청 이메일: " + email); // 로그 추가
        if (email == null || email.length() < 2) return new ArrayList<>();
        
        List<usersDto> list = usersDao.searchUsersByEmail(email);
        System.out.println("검색된 유저 수: " + list.size()); // 결과 수 확인
        return list;
    }

    @PostMapping("/api/invite-member")
    @ResponseBody
    public String inviteMember(@RequestParam("wsId") Long wsId, @RequestParam("userId") Long userId) {
        try {
            // 위에서 주입받은 workspaceDAO를 사용합니다. (대문자 DAO 주의)
            workspaceDAO.insertWorkspaceMember(wsId, userId, "MEMBER");
            return "success";
        } catch (Exception e) {
            e.printStackTrace(); // 에러 로그를 콘솔에 남겨야 추적이 쉽습니다.
            return "fail";
        }
    }
    
    @PostMapping("/api/remove-member")
    @ResponseBody
    public String removeMember(@RequestParam("wsId") Long wsId, @RequestParam("userId") Long userId) {
        boolean isRemoved = workspaceService.removeMember(wsId, userId);
        return isRemoved ? "success" : "fail";
    }
    
    @PostMapping("/api/transfer-admin")
    @ResponseBody
    public String transferAdmin(@RequestParam("wsId") Long wsId, 
                                @RequestParam("newAdminId") Long newAdminId,
                                HttpSession session) {
        
        // 1. 세션에서 유저 정보 추출 (workspaceList 메서드와 동일한 타입으로)
        usersDto user = (usersDto) session.getAttribute("user");
        
        if (user == null) {
            System.out.println("세션 만료 또는 유저 정보 없음");
            return "fail";
        }
        
        Long oldAdminId = user.getUserId();
        
        // 2. 서비스 호출
        System.out.println("위임 시작: WS=" + wsId + ", From=" + oldAdminId + ", To=" + newAdminId);
        boolean success = workspaceService.transferAdmin(wsId, oldAdminId, newAdminId);
        
        return success ? "success" : "fail";
    }
    
    @PostMapping("/api/invite")
    @ResponseBody
    public Map<String, Object> inviteMember(@RequestBody Map<String, String> params, HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        
        Long wsId = Long.parseLong(params.get("wsId"));
        String email = params.get("email");

        String status = workspaceService.inviteUserByEmail(wsId, user.getUserId(), email);
        
        result.put("status", status); // SUCCESS, NOT_FOUND, ALREADY_EXISTS
        return result;
    }
 // 1. 초대함 '화면'을 보여주는 메서드 (JSP 이동)
    @GetMapping("/invitations") // 브라우저 주소: /workspace/invitations
    public String invitationsPage(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "redirect:/login";

        List<Map<String, Object>> inviteList = workspaceService.getPendingInvitations(user.getUserId());
        model.addAttribute("inviteList", inviteList);

        return "workspace/invitations"; // views/workspace/invitations.jsp를 찾음
    }

    // 2. 헤더의 '배지 숫자'만 가져오는 메서드 (데이터 전송)
    @GetMapping("/api/invitations") // 자바스크립트 호출 주소: /workspace/api/invitations
    @ResponseBody // 중요: 페이지 이동이 아니라 데이터를 보낸다는 선언
    public List<Map<String, Object>> getInvitationsApi(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return new ArrayList<>();
        
        return workspaceService.getPendingInvitations(user.getUserId());
    }

    // 수락/거절 처리 API
    @PostMapping("/api/invitation/process")
    @ResponseBody
    public Map<String, Object> processInvite(@RequestBody Map<String, Object> params, HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        
        Long inviteId = Long.parseLong(params.get("inviteId").toString());
        String status = params.get("status").toString(); // "ACCEPTED" 또는 "REJECTED"

        boolean success = workspaceService.processInvitation(inviteId, status, user.getUserId());
        result.put("success", success);
        return result;
    }
    
    @PostMapping("/api/leave") // 이제 실제 호출 주소는 /workspace/api/leave 가 됩니다.
    @ResponseBody
    public String leaveWorkspace(@RequestParam("wsId") Long wsId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "LOGIN_REQUIRED";

        boolean success = workspaceService.removeMember(wsId, user.getUserId());
        return success ? "SUCCESS" : "FAIL";
    }
}
