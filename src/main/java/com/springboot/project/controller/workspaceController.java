package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IworkspaceService;
import com.springboot.project.service.fileUploadService;

import jakarta.servlet.http.HttpSession;


@Controller
@RequestMapping("/workspace")
public class workspaceController {

    @Autowired
    private IworkspaceService workspaceService; 
    @Autowired
    private fileUploadService fileUploadService;
    @Autowired
    private IprojectService projectService;
    
    @Autowired
    private com.springboot.project.dao.IusersDao usersDao; // 유저 검색용

    @Autowired
    private com.springboot.project.dao.IworkspaceDAO workspaceDAO; // 멤버 초대 및 삭제 연동용
   
    @PostMapping("/api/create")
    @ResponseBody
    public Map<String, Object> createWorkspace(
            @RequestParam("wsName") String wsName,
            @RequestParam(value = "wsDescription", required = false) String wsDescription,
            @RequestParam(value = "wsImage", required = false) MultipartFile wsImage,
            HttpSession session) {
        
        usersDto user = (usersDto) session.getAttribute("user");
        Map<String, Object> response = new HashMap<>();
        
        if (user == null) {
            response.put("status", "fail");
            return response;
        }

        workspaceDTO dto = new workspaceDTO();
        dto.setWsName(wsName);
        dto.setWsDescription(wsDescription);
        
        if (wsImage != null && !wsImage.isEmpty()) {
            String savedPath = fileUploadService.upload(wsImage); 
            dto.setWsImagePath(savedPath);
        }

        Long generatedId = workspaceService.createWorkspace(dto, user.getUserId());
        
        session.setAttribute("currentWsId", generatedId);
        
        response.put("status", "success");
        response.put("wsId", generatedId);
        response.put("redirectUrl", "/workspace/main?wsId=" + generatedId);
        
        return response; 
    }
    
    @GetMapping("/create")
    public String workspaceCreatePage() {
        return "workspace/workspaceCreate";
    }

    @GetMapping("/main")
    public String workspaceMainPage(@RequestParam("wsId") Long wsId, HttpSession session, Model model) {
        session.setAttribute("currentWsId", wsId);
        
        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        model.addAttribute("workspace", workspace);
        
        List<projectRequestDTO> projectList = projectService.getProjectsByWsId(wsId);
        model.addAttribute("projectList", projectList);

        List<Map<String, Object>> memberList = workspaceService.getWorkspaceMembers(wsId);
        model.addAttribute("memberList", memberList);

     // 기존 코드들...
        model.addAttribute("memberList", workspaceService.getWorkspaceMembers(wsId));

        // 💡 이벤트 데이터 조회 및 추가
        List<Map<String, Object>> eventList = workspaceService.getEventsByWsId(wsId);
        model.addAttribute("eventList", eventList);

        return "workspace/workspaceMain";
    }

    @GetMapping("/list")
    public String workspaceList(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");
        
        if (user != null) {
            System.out.println("현재 로그인 유저 ID: " + user.getUserId());
            List<workspaceDTO> wsList = workspaceService.getWorkspaceList(user.getUserId());
            model.addAttribute("wsList", wsList);
        }
        return "workspace/workspaceList";
    }

    @GetMapping("/settings")
    public String workspaceSettings(@RequestParam("wsId") Long wsId, Model model) {
        model.addAttribute("workspace", workspaceService.getWorkspaceDetail(wsId));
        return "workspace/workspaceSettings";
    }

    // ⚙️ 1. 그룹 정보 수정 반영 완벽 구현 (껍데기 걷어내고 실제 파일 업로드 및 DAO 연동)
    @PostMapping("/api/update")
    @ResponseBody
    public String updateWorkspace(@ModelAttribute workspaceDTO dto, @RequestParam(value="wsImage", required=false) MultipartFile file) {
        try {
            // 새롭게 팬더 사진을 업로드 한 경우에만 파일 저장 서비스 실행
            if (file != null && !file.isEmpty()) {
                String savedPath = fileUploadService.upload(file);
                dto.setWsImagePath(savedPath);
            } else {
                // 새로운 이미지 선택을 안 했다면, 기존 DB에 저장되어 있던 이미지 경로를 그대로 유지시킵니다.
                workspaceDTO currentData = workspaceService.getWorkspaceDetail(dto.getWsId());
                if(currentData != null) {
                    dto.setWsImagePath(currentData.getWsImagePath());
                }
            }
            
            // XML에 이전에 추가했던 <update id="updateWorkspace"> 실행
            int result = workspaceDAO.updateWorkspace(dto);
            return result > 0 ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }

    // ❌ 2. 그룹 폐쇄 및 완전 삭제 API 신규 조립
    @PostMapping("/api/delete")
    @ResponseBody
    public String deleteWorkspace(@RequestParam("wsId") Long wsId) {
        try {
            // 1. 데이터 무결성을 위해 소속 멤버 정보(WS_MEMBERS) 선삭제
            workspaceDAO.deleteWorkspaceAllMembers(wsId);
            
            // 2. 워크스페이스 본체(WORKSPACES) 영구 삭제
            int result = workspaceDAO.deleteWorkspace(wsId);
            return result > 0 ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }

    @GetMapping("/api/search-member")
    @ResponseBody
    public List<usersDto> searchMember(@RequestParam("email") String email) {
        System.out.println("검색 요청 이메일: " + email);
        if (email == null || email.length() < 2) return new ArrayList<>();
        
        List<usersDto> list = usersDao.searchUsersByEmail(email);
        System.out.println("검색된 유저 수: " + list.size());
        return list;
    }

    @PostMapping("/api/invite-member")
    @ResponseBody
    public String inviteMember(@RequestParam("wsId") Long wsId, @RequestParam("userId") Long userId) {
        try {
            workspaceDAO.insertWorkspaceMember(wsId, userId, "MEMBER");
            return "success";
        } catch (Exception e) {
            e.printStackTrace();
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
        
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            System.out.println("세션 만료 또는 유저 정보 없음");
            return "fail";
        }
        
        Long oldAdminId = user.getUserId();
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
        
        result.put("status", status);
        return result;
    }

    @GetMapping("/invitations")
    public String invitationsPage(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "redirect:/login";

        List<Map<String, Object>> inviteList = workspaceService.getPendingInvitations(user.getUserId());
        model.addAttribute("inviteList", inviteList);

        return "workspace/invitations";
    }

    @GetMapping("/api/invitations")
    @ResponseBody
    public List<Map<String, Object>> getInvitationsApi(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return new ArrayList<>();
        
        return workspaceService.getPendingInvitations(user.getUserId());
    }

    @PostMapping("/api/invitation/process")
    @ResponseBody
    public Map<String, Object> processInvite(@RequestBody Map<String, Object> params, HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        
        Long inviteId = Long.parseLong(params.get("inviteId").toString());
        String status = params.get("status").toString();

        boolean success = workspaceService.processInvitation(inviteId, status, user.getUserId());
        result.put("success", success);
        return result;
    }
    
    @PostMapping("/api/leave")
    @ResponseBody
    public String leaveWorkspace(@RequestParam("wsId") Long wsId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "LOGIN_REQUIRED";

        boolean success = workspaceService.removeMember(wsId, user.getUserId());
        return success ? "SUCCESS" : "FAIL";
    }
 // 1. 오늘의 일정 로딩 (기존)
    @GetMapping("/api/{wsId}/today-events")
    @ResponseBody
    public List<Map<String, Object>> getTodayEvents(@PathVariable("wsId") Long wsId) {
        // IworkspaceService에 getTodayEvents 메서드가 있어야 합니다.
        return workspaceService.getTodayEvents(wsId);
    }

 // 2. 진행 중인 투표 로딩
    @GetMapping("/api/workspace/{wsId}/active-poll")
    @ResponseBody
    public Map<String, Object> getActivePoll(@PathVariable("wsId") Long wsId) {
        Map<String, Object> data = workspaceService.getActivePoll(wsId);
        return (data != null) ? data : new HashMap<>(); // null이면 빈 Map 반환
    }

    // 3. 투표 반영
    @PostMapping("/api/workspace/vote")
    @ResponseBody
    public String vote(@RequestBody Map<String, Object> params) {
        workspaceService.processVote(params);
        return "success";
    }
    @PostMapping("/api/poll/create")
    @ResponseBody
    public String createPoll(@RequestBody Map<String, Object> params) {
        workspaceService.createPoll(params);
        return "success";
    }
    @GetMapping("/api/members")
    @ResponseBody
    public List<Map<String, Object>> getWorkspaceMembers(@RequestParam("wsId") Long wsId) {
        return workspaceService.getWorkspaceMembers(wsId);
    }
}