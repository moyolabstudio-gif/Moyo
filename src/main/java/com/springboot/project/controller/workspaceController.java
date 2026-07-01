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
import com.springboot.project.service.IcontentShareService;
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
    private IcontentShareService contentShareService;
    
    @Autowired
    private com.springboot.project.dao.IusersDao usersDao; // 유저 검색용

    @Autowired
    private com.springboot.project.dao.IworkspaceDAO workspaceDAO; // 멤버 초대 및 삭제 연동용
   
    @PostMapping("/api/create")
    @ResponseBody
    public Map<String, Object> createWorkspace(
            @RequestParam("wsName") String wsName,
            @RequestParam(value = "wsDescription", required = false) String wsDescription,
            @RequestParam(value = "wsType", defaultValue = "COMMUNITY") String wsType,
            @RequestParam(value = "linkName", required = false) List<String> linkNames,
            @RequestParam(value = "linkUrl", required = false) List<String> linkUrls,
            @RequestParam(value = "wsImage", required = false) MultipartFile wsImage,
            @RequestParam(value = "useAccountProfile", defaultValue = "Y") String useAccountProfile,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "positionName", required = false) String positionName,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "showPhone", defaultValue = "N") String showPhone,
            HttpSession session) {

        usersDto user = (usersDto) session.getAttribute("user");
        Map<String, Object> response = new HashMap<>();

        if (user == null) {
            response.put("status", "fail");
            response.put("message", "로그인이 필요합니다.");
            return response;
        }

        if ("N".equals(useAccountProfile)
                && (displayName == null || displayName.trim().isEmpty())) {
            response.put("status", "fail");
            response.put("message", "그룹 표시 이름을 입력해주세요.");
            return response;
        }

        workspaceDTO dto = new workspaceDTO();
        dto.setWsName(wsName);
        dto.setWsDescription(wsDescription);
        dto.setWsType(wsType);

        if (wsImage != null && !wsImage.isEmpty()) {
            String savedPath = fileUploadService.upload(wsImage);
            dto.setWsImagePath(savedPath);
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("useAccountProfile", useAccountProfile);
        profile.put("displayName", displayName);
        profile.put("contactEmail", contactEmail);
        profile.put("positionName", positionName);
        profile.put("phoneNumber", phoneNumber);
        if (profileImage != null && !profileImage.isEmpty()) {
            profile.put("profileImagePath", fileUploadService.upload(profileImage));
        }
        profile.put("showPhone", showPhone);

        try {
            Long generatedId = workspaceService.createWorkspace(
                    dto, user.getUserId(), profile, buildWorkspaceLinks(linkNames, linkUrls));

            session.setAttribute("currentWsId", generatedId);
            response.put("status", "success");
            response.put("wsId", generatedId);
            response.put("redirectUrl", "/workspace/main?wsId=" + generatedId);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("status", "fail");
            response.put("message", "그룹 생성 중 오류가 발생했습니다.");
        }

        return response;
    }

    @GetMapping("/create")
    public String workspaceCreatePage(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");

        if (user == null) {
            return "redirect:/login";
        }

        model.addAttribute("accountDisplayName",
                user.getUSER_NAME() == null ? "" : user.getUSER_NAME());
        model.addAttribute("accountEmail",
                user.getEMAIL() == null ? "" : user.getEMAIL());

        return "workspace/workspaceCreate";
    }

    @GetMapping("/main")
    public String workspaceMainPage(@RequestParam("wsId") Long wsId, HttpSession session, Model model) {
        session.setAttribute("currentWsId", wsId);
        
        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        model.addAttribute("workspace", workspace);
        model.addAttribute("workspaceLinks", workspaceService.getWorkspaceLinks(wsId));
        
        List<projectRequestDTO> projectList = projectService.getProjectsByWsId(wsId);
        model.addAttribute("projectList", projectList);
        model.addAttribute("projectOverview", projectService.getProjectListByWorkspaceId(wsId));

        List<Map<String, Object>> memberList = workspaceService.getWorkspaceMembers(wsId);
        model.addAttribute("memberList", memberList);

        usersDto loginUser = (usersDto) session.getAttribute("user");
        boolean isWorkspaceAdmin = loginUser != null
                && workspaceDAO.isWorkspaceAdmin(wsId, loginUser.getUserId()) > 0;
        model.addAttribute("isWorkspaceAdmin", isWorkspaceAdmin);
        model.addAttribute("currentUserIsOwner",
                loginUser != null
                && workspace.getOwnerId() != null
                && workspace.getOwnerId().equals(loginUser.getUserId()));

        List<Map<String, Object>> eventList = workspaceService.getEventsByWsId(wsId);
        model.addAttribute("eventList", eventList);
        model.addAttribute("communitySummary", workspaceService.getCommunitySummary(wsId));
        model.addAttribute("recentActivities", workspaceService.getRecentCommunityActivities(wsId));

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
    public String workspaceSettings(@RequestParam("wsId") Long wsId,
                                    HttpSession session,
                                    Model model) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        if (workspaceDAO.isWorkspaceAdmin(wsId, loginUser.getUserId()) < 1) {
            return "redirect:/workspace/main?wsId=" + wsId;
        }

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        model.addAttribute("workspace", workspace);
        model.addAttribute("workspaceLinks", workspaceService.getWorkspaceLinks(wsId));
        model.addAttribute("memberList", workspaceService.getWorkspaceMembers(wsId));
        model.addAttribute("currentUserId", loginUser.getUserId());
        model.addAttribute("currentUserIsOwner",
                workspace != null
                && workspace.getOwnerId() != null
                && workspace.getOwnerId().equals(loginUser.getUserId()));
        return "workspace/workspaceSettings";
    }

    @GetMapping("/settings/members")
    public String workspaceMemberSettings(
            @RequestParam("wsId") Long wsId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }

        if (workspaceDAO.isWorkspaceAdmin(wsId, loginUser.getUserId()) < 1) {
            return "redirect:/workspace/main?wsId=" + wsId;
        }

        return "redirect:/workspace/settings?wsId=" + wsId + "&tab=members";
    }

    // ⚙️ 1. 그룹 정보 수정 반영 완벽 구현 (껍데기 걷어내고 실제 파일 업로드 및 DAO 연동)
    @PostMapping("/api/update")
    @ResponseBody
    public String updateWorkspace(
            @ModelAttribute workspaceDTO dto,
            @RequestParam(value="wsImage", required=false) MultipartFile file,
            @RequestParam(value = "linkName", required = false) List<String> linkNames,
            @RequestParam(value = "linkUrl", required = false) List<String> linkUrls,
            HttpSession session) {
        try {
            usersDto loginUser = (usersDto) session.getAttribute("user");
            if (loginUser == null) return "login_required";
            if (workspaceDAO.isWorkspaceAdmin(dto.getWsId(), loginUser.getUserId()) < 1) {
                return "forbidden";
            }

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
            boolean result = workspaceService.updateWorkspace(
                    dto, buildWorkspaceLinks(linkNames, linkUrls));
            return result ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }


    private List<Map<String, Object>> buildWorkspaceLinks(
            List<String> linkNames,
            List<String> linkUrls) {

        List<Map<String, Object>> links = new ArrayList<>();
        if (linkNames == null || linkUrls == null) return links;

        int size = Math.min(linkNames.size(), linkUrls.size());
        for (int i = 0; i < size; i++) {
            String name = linkNames.get(i) == null ? "" : linkNames.get(i).trim();
            String url = linkUrls.get(i) == null ? "" : linkUrls.get(i).trim();
            if (name.isEmpty() && url.isEmpty()) continue;

            Map<String, Object> link = new HashMap<>();
            link.put("linkName", name);
            link.put("linkUrl", url);
            links.add(link);
        }
        return links;
    }

    // ❌ 2. 그룹 폐쇄 및 완전 삭제 API 신규 조립
    @PostMapping("/api/delete")
    @ResponseBody
    public String deleteWorkspace(
            @RequestParam("wsId") Long wsId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return "fail";

        if (workspace.getOwnerId() == null
                || !workspace.getOwnerId().equals(loginUser.getUserId())) {
            return "owner_only";
        }

        try {
            workspaceDAO.deleteWorkspaceAllMembers(wsId);
            int result = workspaceDAO.deleteWorkspace(wsId);
            return result > 0 ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }

    @GetMapping("/api/search-member")
    @ResponseBody
    public List<Map<String, Object>> searchMember(
            @RequestParam("email") String email,
            @RequestParam(value = "wsId", required = false) Long wsId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        List<Map<String, Object>> result = new ArrayList<>();

        // wsId가 빠진 요청도 400으로 터지지 않게 막고, 프론트에서 빈 결과로 처리한다.
        if (loginUser == null || wsId == null
                || email == null || email.trim().length() < 2) {
            return result;
        }

        List<usersDto> users = usersDao.searchUsersByEmail(email.trim());

        for (usersDto candidate : users) {
            if (candidate == null || candidate.getUserId() == null) continue;

            String memberStatus;
            if (loginUser.getUserId().equals(candidate.getUserId())) {
                memberStatus = "SELF";
            } else if (workspaceDAO.isWorkspaceMember(wsId, candidate.getUserId()) > 0) {
                memberStatus = "ALREADY_MEMBER";
            } else if (workspaceDAO.checkInvitationExists(wsId, candidate.getUserId()) > 0) {
                memberStatus = "PENDING";
            } else {
                memberStatus = "AVAILABLE";
            }

            Map<String, Object> item = new HashMap<>();
            item.put("userId", candidate.getUserId());
            item.put("userName", candidate.getUserName());
            item.put("email", candidate.getEmail());
            item.put("profileImagePath", candidate.getProfileImagePath());
            item.put("memberStatus", memberStatus);
            result.add(item);
        }

        return result;
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
    


    @PostMapping("/api/update-member-position")
    @ResponseBody
    public String updateWorkspaceMemberPosition(
            @RequestParam("wsId") Long wsId,
            @RequestParam("userId") Long targetUserId,
            @RequestParam(value = "positionName", required = false) String positionName,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";

        // 팀장과 관리자 모두 그룹 역할을 부여·수정할 수 있다.
        if (workspaceDAO.isWorkspaceAdmin(wsId, loginUser.getUserId()) < 1) {
            return "forbidden";
        }

        if (workspaceDAO.isWorkspaceMember(wsId, targetUserId) < 1) {
            return "member_not_found";
        }

        String normalizedPosition = positionName == null
                ? null
                : positionName.trim();

        if (normalizedPosition != null && normalizedPosition.length() > 50) {
            normalizedPosition = normalizedPosition.substring(0, 50);
        }
        if (normalizedPosition != null && normalizedPosition.isEmpty()) {
            normalizedPosition = null;
        }

        int updated = workspaceDAO.updateMemberPosition(
                wsId, targetUserId, normalizedPosition);

        return updated > 0 ? "success" : "fail";
    }

    @PostMapping("/api/update-member-role")
    @ResponseBody
    public String updateWorkspaceMemberRole(
            @RequestParam("wsId") Long wsId,
            @RequestParam("userId") Long targetUserId,
            @RequestParam("role") String role,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (workspaceDAO.isWorkspaceAdmin(wsId, loginUser.getUserId()) < 1) {
            return "forbidden";
        }

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return "fail";

        // 팀장(OWNER_ID)은 설정 화면에서 강등할 수 없다.
        if (workspace.getOwnerId() != null
                && workspace.getOwnerId().equals(targetUserId)) {
            return "owner_role_locked";
        }

        if (!"ADMIN".equals(role) && !"MEMBER".equals(role)) {
            return "invalid_role";
        }

        if (workspaceDAO.isWorkspaceMember(wsId, targetUserId) < 1) {
            return "member_not_found";
        }

        int updated = workspaceDAO.updateMemberRole(wsId, targetUserId, role);
        return updated > 0 ? "success" : "fail";
    }

    @PostMapping("/api/remove-member")
    @ResponseBody
    public String removeMember(@RequestParam("wsId") Long wsId,
                               @RequestParam("userId") Long userId,
                               HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (loginUser.getUserId().equals(userId)) return "fail";
        if (workspaceDAO.isWorkspaceAdmin(wsId, loginUser.getUserId()) < 1) return "forbidden";

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
        if (oldAdminId.equals(newAdminId)) return "fail";

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null
                || workspace.getOwnerId() == null
                || !workspace.getOwnerId().equals(oldAdminId)) {
            return "owner_only";
        }

        if (workspaceDAO.isWorkspaceMember(wsId, newAdminId) < 1) return "fail";
        System.out.println("위임 시작: WS=" + wsId + ", From=" + oldAdminId + ", To=" + newAdminId);
        boolean success = workspaceService.transferAdmin(wsId, oldAdminId, newAdminId);
        
        return success ? "success" : "fail";
    }
    
    @PostMapping("/api/invite")
    @ResponseBody
    public Map<String, Object> inviteMember(
            @RequestBody Map<String, Object> params,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");

        if (user == null) {
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        try {
            Object wsIdValue = params.get("wsId");
            Object emailValue = params.get("email");

            if (wsIdValue == null || emailValue == null) {
                result.put("status", "INVALID_REQUEST");
                return result;
            }

            Long wsId = Long.valueOf(String.valueOf(wsIdValue));
            String email = String.valueOf(emailValue).trim();

            String status = workspaceService.inviteUserByEmail(
                    wsId, user.getUserId(), email);

            result.put("status", status);
            return result;

        } catch (Exception e) {
            e.printStackTrace();
            result.put("status", "ERROR");
            result.put("message", e.getClass().getSimpleName());
            return result;
        }
    }

    @GetMapping("/invitations")
    public String invitationsPage(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "redirect:/login";

        // 초대함은 더 이상 독립 화면으로 사용하지 않는다.
        // 그룹 초대도 통합 요청함(/requests)의 한 요청 타입으로 처리한다.
        return "redirect:/requests";
    }

    @GetMapping("/api/invitations")
    @ResponseBody
    public List<Map<String, Object>> getInvitationsApi(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return new ArrayList<>();
        
        return workspaceService.getPendingInvitations(user.getUserId());
    }

    @PostMapping(value = "/api/invitation/process", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public Map<String, Object> processInvite(
            @RequestParam("inviteId") Long inviteId,
            @RequestParam("status") String status,
            @RequestParam(value = "useAccountProfile", defaultValue = "Y") String useAccountProfile,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "positionName", required = false) String positionName,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "showPhone", defaultValue = "N") String showPhone,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");

        if (user == null) {
            result.put("success", false);
            result.put("message", "LOGIN_REQUIRED");
            return result;
        }

        Map<String, Object> inviteInfo = workspaceDAO.selectInvitationById(inviteId);
        if (inviteInfo == null) {
            result.put("success", false);
            result.put("message", "INVITATION_NOT_FOUND");
            return result;
        }

        Object inviteeValue = inviteInfo.get("INVITEE_ID");
        if (inviteeValue == null
                || !user.getUserId().equals(Long.valueOf(inviteeValue.toString()))) {
            result.put("success", false);
            result.put("message", "FORBIDDEN");
            return result;
        }

        Map<String, Object> profile = null;
        if ("ACCEPTED".equals(status)) {
            if ("N".equals(useAccountProfile)
                    && (displayName == null || displayName.trim().isEmpty())) {
                result.put("success", false);
                result.put("message", "DISPLAY_NAME_REQUIRED");
                return result;
            }

            profile = new HashMap<>();
            profile.put("useAccountProfile", useAccountProfile);
            profile.put("displayName", displayName);
            profile.put("contactEmail", contactEmail);
            profile.put("positionName", positionName);
            profile.put("phoneNumber", phoneNumber);
            profile.put("showPhone", showPhone);

            if (profileImage != null && !profileImage.isEmpty()) {
                profile.put("profileImagePath", fileUploadService.upload(profileImage));
            }
        }

        try {
            boolean success = workspaceService.processInvitation(
                    inviteId, status, user.getUserId(), profile);

            result.put("success", success);
            result.put("status", status);

            if (success && "ACCEPTED".equals(status)) {
                Long wsId = Long.valueOf(inviteInfo.get("WS_ID").toString());
                session.setAttribute("currentWsId", wsId);
                result.put("wsId", wsId);
                result.put("redirectUrl", "/workspace/main?wsId=" + wsId);
            }
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "PROCESS_FAILED");
        }

        return result;
    }

    @PostMapping("/api/leave")
    @ResponseBody
    public String leaveWorkspace(@RequestParam("wsId") Long wsId, HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "LOGIN_REQUIRED";
        if (workspaceDAO.isWorkspaceAdmin(wsId, user.getUserId()) > 0) return "ADMIN_TRANSFER_REQUIRED";

        boolean success = workspaceService.removeMember(wsId, user.getUserId());
        return success ? "SUCCESS" : "FAIL";
    }

    @GetMapping("/api/{wsId}/community-summary")
    @ResponseBody
    public Map<String, Object> getCommunitySummary(@PathVariable("wsId") Long wsId) {
        return workspaceService.getCommunitySummary(wsId);
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

    @GetMapping("/api/{wsId}/members/{userId}/profile")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getMemberProfile(
            @PathVariable("wsId") Long wsId,
            @PathVariable("userId") Long targetUserId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return org.springframework.http.ResponseEntity.status(401).body(Map.of("message", "LOGIN_REQUIRED"));
        }
        Map<String, Object> profile =
                workspaceService.getWorkspaceMemberProfile(wsId, targetUserId, loginUser.getUserId());
        if (profile == null) {
            return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "FORBIDDEN"));
        }
        return org.springframework.http.ResponseEntity.ok(profile);
    }

    @PostMapping(value = "/api/{wsId}/members/me/profile",
                 consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public org.springframework.http.ResponseEntity<Map<String, Object>> saveMyMemberProfile(
            @PathVariable("wsId") Long wsId,
            @RequestParam(value = "useAccountProfile", defaultValue = "Y") String useAccountProfile,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "positionName", required = false) String positionName,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "showPhone", defaultValue = "N") String showPhone,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return org.springframework.http.ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("useAccountProfile", useAccountProfile);
        profile.put("displayName", displayName);
        profile.put("contactEmail", contactEmail);
        profile.put("positionName", positionName);
        profile.put("phoneNumber", phoneNumber);
        profile.put("showPhone", showPhone);

        if (profileImage != null && !profileImage.isEmpty()) {
            profile.put("profileImagePath", fileUploadService.upload(profileImage));
        }

        try {
            boolean success = workspaceService.saveMyWorkspaceProfile(
                    wsId, loginUser.getUserId(), profile);
            if (!success) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "프로필을 저장하지 못했습니다."));
            }
            return org.springframework.http.ResponseEntity.ok(Map.of("success", true));
        } catch (org.springframework.dao.DataAccessException e) {
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "프로필 저장 중 DB 오류가 발생했습니다."));
        }
    }

    @GetMapping("/api/members")
    @ResponseBody
    public List<Map<String, Object>> getWorkspaceMembers(@RequestParam("wsId") Long wsId) {
        return workspaceService.getWorkspaceMembers(wsId);
    }
}