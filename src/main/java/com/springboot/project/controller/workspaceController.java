package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
import com.springboot.project.dto.workspaceUpdateRequest;
import com.springboot.project.dto.workspaceUpdateResult;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IworkspaceService;
import com.springboot.project.service.WorkspaceAuthorizationService;
import com.springboot.project.service.EmailVerificationService;
import com.springboot.project.service.InoteService;
import com.springboot.project.service.IcontentShareService;
import com.springboot.project.service.fileUploadService;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpSession;


@Controller
@RequestMapping("/workspace")
public class workspaceController {

    private static final int WORKSPACE_NAME_MAX_LENGTH = 60;
    private static final int WORKSPACE_DESCRIPTION_MAX_LENGTH = 300;
    private static final Set<String> ALLOWED_WORKSPACE_TYPES = Set.of(
            "ORGANIZATION", "TEAM", "STUDY", "COMMUNITY", "CLUB", "LIFE", "ETC");
    private static final Set<String> ALLOWED_JOIN_TYPES = Set.of(
            "OPEN", "APPROVAL", "INVITE_ONLY");

    @Autowired
    private IworkspaceService workspaceService; 
    @Autowired
    private fileUploadService fileUploadService;
    @Autowired
    private IprojectService projectService;
    @Autowired
    private IcontentShareService contentShareService;
    @Autowired
    private InoteService noteService;
    
    @Autowired
    private com.springboot.project.dao.IusersDao usersDao; // 유저 검색용

    @Autowired
    private com.springboot.project.dao.IworkspaceDAO workspaceDAO; // 멤버 초대 및 삭제 연동용
    @Autowired
    private WorkspaceAuthorizationService workspaceAuthorizationService;
    @Autowired
    private EmailVerificationService emailVerificationService;
    @Autowired
    private ObjectMapper objectMapper;
   
    @PostMapping("/api/create")
    @ResponseBody
    public Map<String, Object> createWorkspace(
            @RequestParam("wsName") String wsName,
            @RequestParam(value = "wsDescription", required = false) String wsDescription,
            @RequestParam(value = "wsType", defaultValue = "COMMUNITY") String wsType,
            @RequestParam(value = "joinType", defaultValue = "OPEN") String joinType,
            @RequestParam(value = "linkName", required = false) List<String> linkNames,
            @RequestParam(value = "linkUrl", required = false) List<String> linkUrls,
            @RequestParam(value = "wsImage", required = false) MultipartFile wsImage,
            @RequestParam(value = "useAccountProfile", defaultValue = "Y") String useAccountProfile,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "positionName", required = false) String positionName,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "showEmail", defaultValue = "Y") String showEmail,
            @RequestParam(value = "showPhone", defaultValue = "Y") String showPhone,
            @RequestParam(value = "showBirth", defaultValue = "Y") String showBirth,
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

        String normalizedJoinType = joinType == null
                ? "OPEN"
                : joinType.trim().toUpperCase();
        if (!"OPEN".equals(normalizedJoinType)
                && !"APPROVAL".equals(normalizedJoinType)
                && !"INVITE_ONLY".equals(normalizedJoinType)) {
            response.put("status", "fail");
            response.put("message", "올바른 그룹 가입 방식을 선택해주세요.");
            return response;
        }
        dto.setJoinType(normalizedJoinType);

        if (wsImage != null && !wsImage.isEmpty()) {
            String savedPath = fileUploadService.upload(wsImage);
            dto.setWsImagePath(savedPath);
        }

        String normalizedProfileMode = "N".equalsIgnoreCase(useAccountProfile) ? "N" : "Y";

        // 계정 프로필 사용은 화면에서 넘어온 임시값에 의존하지 않고
        // 로그인 세션의 계정 정보를 기준으로 저장한다.
        if ("Y".equals(normalizedProfileMode)) {
            displayName = user.getUSER_NAME();
            contactEmail = user.getEMAIL();
            profileImage = null;
        } else {
            String normalizedContactEmail = contactEmail == null
                    ? ""
                    : contactEmail.trim().toLowerCase();
            String normalizedAccountEmail = user.getEMAIL() == null
                    ? ""
                    : user.getEMAIL().trim().toLowerCase();

            // 계정 이메일과 다른 주소는 실제 인증된 경우에만 그룹 프로필에 반영한다.
            // 미인증 주소는 그룹 생성 자체를 막지 않고 저장/공개 대상에서 제외한다.
            if (normalizedContactEmail.isEmpty()) {
                contactEmail = null;
                showEmail = "N";
            } else if (!normalizedContactEmail.equals(normalizedAccountEmail)
                    && !emailVerificationService.isVerified(normalizedContactEmail, session)) {
                contactEmail = null;
                showEmail = "N";
            }
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("useAccountProfile", normalizedProfileMode);
        profile.put("displayName", displayName);
        profile.put("contactEmail", contactEmail);
        profile.put("positionName", positionName);
        profile.put("phoneNumber", phoneNumber);
        if ("N".equals(normalizedProfileMode)
                && profileImage != null && !profileImage.isEmpty()) {
            profile.put("profileImagePath", fileUploadService.upload(profileImage));
        }
        profile.put("showEmail", showEmail);
        profile.put("showPhone", showPhone);
        profile.put("showBirth", showBirth);

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
        model.addAttribute("accountBirthDate",
                user.getBirthDate() == null ? "" : user.getBirthDate());
        model.addAttribute("accountBirthCalendarType",
                user.getBirthCalendarType() == null ? "SOLAR" : user.getBirthCalendarType());

        return "workspace/workspaceCreate";
    }

    @GetMapping("/main")
    public String workspaceMainPage(@RequestParam("wsId") Long wsId, HttpSession session, Model model) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) {
            return "redirect:/users/mypage";
        }

        boolean isMember = workspaceAuthorizationService.isMember(wsId, loginUser.getUserId());
        if (!isMember && "INVITE_ONLY".equalsIgnoreCase(workspace.getJoinType())) {
            return "redirect:/users/mypage?groupAccess=inviteOnly";
        }

        model.addAttribute("workspace", workspace);
        model.addAttribute("workspaceLinks", workspaceService.getWorkspaceLinks(wsId));
        model.addAttribute("isWorkspaceMember", isMember);

        if (!isMember) {
            model.addAttribute("memberCount", workspaceService.getWorkspaceMembers(wsId).size());
            model.addAttribute("joinRequestStatus",
                    workspaceService.getJoinRequestStatus(wsId, loginUser.getUserId()));
            return "workspace/workspaceMain";
        }

        session.setAttribute("currentWsId", wsId);
        
        List<projectRequestDTO> projectList = projectService.getProjectsByWsId(wsId);
        model.addAttribute("projectList", projectList);
        model.addAttribute("projectOverview", projectService.getProjectListByWorkspaceId(wsId, loginUser.getUserId()));

        List<Map<String, Object>> memberList = workspaceService.getWorkspaceMembers(wsId);
        model.addAttribute("memberList", memberList);

        boolean isWorkspaceAdmin = workspaceAuthorizationService.canManage(wsId, loginUser.getUserId());
        model.addAttribute("isWorkspaceAdmin", isWorkspaceAdmin);
        model.addAttribute("currentUserIsOwner",
                workspaceAuthorizationService.isOwner(wsId, loginUser.getUserId()));

        List<Map<String, Object>> eventList = workspaceService.getEventsByWsId(wsId);
        model.addAttribute("eventList", eventList);
        model.addAttribute("communitySummary", workspaceService.getCommunitySummary(wsId));
        model.addAttribute("recentActivities", workspaceService.getRecentCommunityActivities(wsId));

        List<com.springboot.project.dto.noteDTO> mainNoteSummaries = noteService.getNoteListPage(
                "WS", wsId, null, loginUser.getUserId(), null, false, null, null, 0, 3);
        List<com.springboot.project.dto.noteDTO> profilePublicNotes = new java.util.ArrayList<>();
        if (mainNoteSummaries != null) {
            for (com.springboot.project.dto.noteDTO summary : mainNoteSummaries) {
                if (summary == null || summary.getNoteId() == null) continue;
                com.springboot.project.dto.noteDTO detail = noteService.getNoteDetail(summary.getNoteId(), loginUser.getUserId());
                if (detail == null) continue;
                if (detail.getPreviewContent() == null || detail.getPreviewContent().isBlank()) {
                    detail.setPreviewContent(summary.getPreviewContent());
                }
                if (detail.getUserName() == null || detail.getUserName().isBlank()) {
                    detail.setUserName(summary.getUserName());
                }
                if (detail.getProfileImagePath() == null || detail.getProfileImagePath().isBlank()) {
                    detail.setProfileImagePath(summary.getProfileImagePath());
                }
                profilePublicNotes.add(detail);
            }
        }
        model.addAttribute("profilePublicNotes", profilePublicNotes);
        model.addAttribute("displayName", loginUser.getUserName());

        return "workspace/workspaceMain";
    }



    @GetMapping("/list")
    public String workspaceList(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");

        if (user != null) {
            // 공통 사이드바에서 이미 조회한 동일 그룹 목록을 본문에서도 재사용한다.
            // globalControllerAdvice의 userWorkspaces와 같은 selectWorkspaceList 결과이므로
            // 그룹 목록 페이지 진입 시 동일 SQL이 두 번 실행되는 것을 막는다.
            Object userWorkspaces = model.asMap().get("userWorkspaces");
            if (userWorkspaces instanceof List<?>) {
                model.addAttribute("wsList", userWorkspaces);
            } else {
                model.addAttribute("wsList", Collections.emptyList());
            }
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

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) {
            return "redirect:/workspace/list";
        }

        boolean isOwner = workspaceAuthorizationService.isOwner(
                wsId, loginUser.getUserId());
        // 그룹장은 OWNER_ID 기준으로, 관리자는 ADMIN 역할 기준으로 허용한다.
        if (!workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            return "redirect:/workspace/main?wsId=" + wsId;
        }

        // 삭제 예정 그룹은 그룹장만 설정에 들어와 삭제 신청을 취소할 수 있다.
        if ("DELETE_PENDING".equalsIgnoreCase(workspace.getStatus()) && !isOwner) {
            return "redirect:/workspace/main?wsId=" + wsId
                    + "&settingsBlocked=deletePending";
        }

        model.addAttribute("workspace", workspace);
        model.addAttribute("workspaceLinks", workspaceService.getWorkspaceLinks(wsId));
        model.addAttribute("memberList", workspaceService.getWorkspaceMembers(wsId));
        model.addAttribute("pendingInvitationList", workspaceService.getPendingInvitationsByWorkspace(wsId));
        model.addAttribute("currentUserId", loginUser.getUserId());
        model.addAttribute("currentUserIsOwner", isOwner);
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

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) {
            return "redirect:/workspace/list";
        }

        if (!workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            return "redirect:/workspace/main?wsId=" + wsId;
        }
        if ("DELETE_PENDING".equalsIgnoreCase(workspace.getStatus())) {
            return "redirect:/workspace/main?wsId=" + wsId
                    + "&settingsBlocked=deletePending";
        }

        return "redirect:/workspace/settings?wsId=" + wsId + "&tab=members";
    }

    // 그룹 정보 수정
    @PostMapping("/api/update")
    @ResponseBody
    public Map<String, Object> updateWorkspace(
            @ModelAttribute workspaceDTO dto,
            @RequestParam(value="wsImage", required=false) MultipartFile file,
            @RequestParam(value="wsImageOriginal", required=false) MultipartFile originalFile,
            @RequestParam(value="wsImageCropScale", required=false) Double wsImageCropScale,
            @RequestParam(value="wsImageCropX", required=false) Double wsImageCropX,
            @RequestParam(value="wsImageCropY", required=false) Double wsImageCropY,
            @RequestParam(value = "removeWorkspaceImage", required = false, defaultValue = "N") String removeWorkspaceImage,
            @RequestParam(value = "linkName", required = false) List<String> linkNames,
            @RequestParam(value = "linkUrl", required = false) List<String> linkUrls,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return workspaceUpdateResult.fail(
                    "LOGIN_REQUIRED",
                    "로그인이 만료되었습니다. 다시 로그인해 주세요.")
                    .toMap();
        }

        workspaceUpdateRequest request = new workspaceUpdateRequest();
        request.setWsId(dto.getWsId());
        request.setWsName(dto.getWsName());
        request.setWsDescription(dto.getWsDescription());
        request.setWsType(dto.getWsType());
        request.setJoinType(dto.getJoinType());
        request.setWsImage(file);
        request.setWsImageOriginal(originalFile);
        request.setWsImageCropScale(wsImageCropScale);
        request.setWsImageCropX(wsImageCropX);
        request.setWsImageCropY(wsImageCropY);
        request.setResetWorkspaceImage("Y".equalsIgnoreCase(removeWorkspaceImage));
        request.setLinkNames(linkNames);
        request.setLinkUrls(linkUrls);

        workspaceUpdateResult result = workspaceService.updateWorkspaceProfile(
                request, loginUser.getUserId());
        return result.toMap();
    }

    private List<Map<String, Object>> buildWorkspaceLinks(
            List<String> linkNames,
            List<String> linkUrls) {

        List<Map<String, Object>> links = new ArrayList<>();
        if (linkNames == null || linkUrls == null) return links;

        int size = Math.min(linkNames.size(), linkUrls.size());
        for (int i = 0; i < size; i++) {
            String name = normalizeSingleLine(linkNames.get(i));
            String url = normalizeUrlValue(linkUrls.get(i));
            if (name.isEmpty() && url.isEmpty()) continue;

            Map<String, Object> link = new HashMap<>();
            link.put("linkName", name);
            link.put("linkUrl", url);
            links.add(link);
        }
        return links;
    }

    /**
     * 한 줄 입력값의 앞뒤 공백과 연속 공백을 정리한다.
     * NBSP/제로폭 공백도 일반 공백으로 취급한다.
     */
    private String normalizeSingleLine(String value) {
        if (value == null) return "";

        return value
                .replace('\u00A0', ' ')
                .replaceAll("[\u200B\uFEFF]", "")
                .trim()
                .replaceAll("\\s+", " ");
    }

    /**
     * 여러 줄 소개는 줄바꿈을 보존하되 각 줄의 불필요한 공백과
     * 맨 앞/뒤의 빈 줄을 제거한다. 결과가 비면 NULL로 통일한다.
     */
    private String normalizeMultiline(String value) {
        if (value == null) return null;

        String normalized = value
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replace('\u00A0', ' ')
                .replaceAll("[\u200B\uFEFF]", "");

        String[] lines = normalized.split("\n", -1);
        int start = 0;
        int end = lines.length;

        while (start < end && lines[start].trim().isEmpty()) start++;
        while (end > start && lines[end - 1].trim().isEmpty()) end--;
        if (start == end) return null;

        StringBuilder result = new StringBuilder();
        for (int i = start; i < end; i++) {
            if (i > start) result.append('\n');
            result.append(lines[i].trim());
        }

        String text = result.toString();
        return text.isEmpty() ? null : text;
    }

    /** URL은 내부 문자열을 임의 변경하지 않고 주변 공백과 숨은 문자만 제거한다. */
    private String normalizeUrlValue(String value) {
        if (value == null) return "";

        return value
                .replace('\u00A0', ' ')
                .replaceAll("[\u200B\uFEFF]", "")
                .trim();
    }

    // 그룹 삭제 신청: 30일 동안 복구할 수 있으며 즉시 물리 삭제하지 않는다.
    @PostMapping("/api/delete")
    @ResponseBody
    public String requestWorkspaceDeletion(
            @RequestParam("wsId") Long wsId,
            @RequestParam("workspaceName") String workspaceName,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return "not_found";
        if (workspace.getOwnerId() == null
                || !workspace.getOwnerId().equals(loginUser.getUserId())) {
            return "owner_only";
        }
        if (workspaceName == null
                || !workspace.getWsName().equals(workspaceName.trim())) {
            return "name_mismatch";
        }
        if ("DELETE_PENDING".equals(workspace.getStatus())) {
            return "already_pending";
        }

        int result = workspaceDAO.requestWorkspaceDeletion(wsId, loginUser.getUserId());
        if (result > 0) {
            workspaceDAO.cascadeWorkspaceProjectDeletion(wsId, loginUser.getUserId());
            return "success";
        }
        return "fail";
    }

    @PostMapping("/api/delete/cancel")
    @ResponseBody
    public String cancelWorkspaceDeletion(
            @RequestParam("wsId") Long wsId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return "not_found";
        if (workspace.getOwnerId() == null
                || !workspace.getOwnerId().equals(loginUser.getUserId())) {
            return "owner_only";
        }

        workspaceDAO.cancelWorkspaceProjectDeletionCascade(wsId, loginUser.getUserId());

        int result = workspaceDAO.cancelWorkspaceDeletion(wsId, loginUser.getUserId());
        return result > 0 ? "success" : "fail";
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
        if (!workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            return result;
        }

        List<usersDto> users = usersDao.searchUsersByEmail(email.trim());

        for (usersDto candidate : users) {
            if (candidate == null || candidate.getUserId() == null) continue;

            String memberStatus;
            if (loginUser.getUserId().equals(candidate.getUserId())) {
                memberStatus = "SELF";
            } else if (workspaceAuthorizationService.isMember(wsId, candidate.getUserId())) {
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
    public String inviteMemberLegacy(@RequestParam("wsId") Long wsId,
                                     @RequestParam("userId") Long userId,
                                     HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (wsId == null || userId == null) return "invalid_request";
        if (!workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            return "forbidden";
        }
        // 과거 API는 초대 수락 없이 WS_MEMBERS에 바로 추가했다.
        // 그룹 초대는 /api/invite -> 요청함 수락 흐름으로만 처리한다.
        return "legacy_disabled";
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
        if (!workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            return "forbidden";
        }

        if (!workspaceAuthorizationService.isMember(wsId, targetUserId)) {
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
        if (!workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            return "forbidden";
        }
        if (loginUser.getUserId().equals(targetUserId)) {
            return "self_role_locked";
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

        if (!workspaceAuthorizationService.isMember(wsId, targetUserId)) {
            return "member_not_found";
        }

        int updated = workspaceDAO.updateMemberRole(wsId, targetUserId, role);
        return updated > 0 ? "success" : "fail";
    }

    @PostMapping("/api/update-members")
    @ResponseBody
    public String updateWorkspaceMembers(
            @RequestParam("wsId") Long wsId,
            @RequestParam("changes") String changesJson,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (wsId == null || changesJson == null || changesJson.isBlank()) return "invalid_request";

        try {
            List<Map<String, Object>> changes = objectMapper.readValue(
                    changesJson, new TypeReference<List<Map<String, Object>>>() {});
            return workspaceService.updateWorkspaceMembers(wsId, loginUser.getUserId(), changes);
        } catch (Exception e) {
            return "invalid_request";
        }
    }

    @PostMapping("/api/remove-members")
    @ResponseBody
    public String removeWorkspaceMembers(
            @RequestParam("wsId") Long wsId,
            @RequestParam("userIds") String userIdsText,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (wsId == null || userIdsText == null || userIdsText.isBlank()) return "invalid_request";

        try {
            List<Long> userIds = new ArrayList<>();
            for (String token : userIdsText.split(",")) {
                String value = token == null ? "" : token.trim();
                if (!value.isEmpty()) userIds.add(Long.valueOf(value));
            }
            return workspaceService.removeWorkspaceMembers(wsId, loginUser.getUserId(), userIds);
        } catch (Exception e) {
            return "invalid_request";
        }
    }

    @PostMapping("/api/remove-member")
    @ResponseBody
    public String removeMember(@RequestParam("wsId") Long wsId,
                               @RequestParam("userId") Long userId,
                               HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return "login_required";
        if (wsId == null || userId == null) return "fail";
        if (loginUser.getUserId().equals(userId)) return "fail";
        if (!workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            return "forbidden";
        }

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return "fail";

        // 그룹장은 어떤 관리자도 내보낼 수 없다.
        if (workspace.getOwnerId() != null
                && workspace.getOwnerId().equals(userId)) {
            return "owner_protected";
        }

        Map<String, Object> targetProfile =
                workspaceService.getWorkspaceMemberProfile(
                        wsId,
                        userId,
                        loginUser.getUserId()
                );

        if (targetProfile == null || targetProfile.isEmpty()) {
            return "member_not_found";
        }

        boolean requesterIsOwner = workspaceAuthorizationService.isOwner(
                wsId, loginUser.getUserId());

        String targetRole = String.valueOf(
                targetProfile.getOrDefault("WS_ROLE", "")
        ).toUpperCase();

        // 일반 관리자는 일반 멤버만 내보낼 수 있다.
        if (!requesterIsOwner && !"MEMBER".equals(targetRole)) {
            return "forbidden";
        }

        // 활성 그룹 프로젝트의 팀장은 먼저 프로젝트 팀장을 위임해야 한다.
        if (workspaceDAO.countLedActiveWorkspaceProjects(wsId, userId) > 0) {
            return "project_leader_transfer_required";
        }

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
        if (workspace == null || !workspaceAuthorizationService.isOwner(wsId, oldAdminId)) {
            return "owner_only";
        }
        if (!"ACTIVE".equalsIgnoreCase(workspace.getStatus())) {
            return "unavailable";
        }
        if (!workspaceAuthorizationService.isMember(wsId, newAdminId)) {
            return "member_not_found";
        }

        System.out.println("위임 시작: WS=" + wsId + ", From=" + oldAdminId + ", To=" + newAdminId);
        try {
            boolean success = workspaceService.transferAdmin(wsId, oldAdminId, newAdminId);
            return success ? "success" : "conflict";
        } catch (RuntimeException e) {
            System.err.println("그룹장 위임 실패: " + e.getMessage());
            return "fail";
        }
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

            if (!workspaceAuthorizationService.canManage(wsId, user.getUserId())) {
                result.put("status", "FORBIDDEN");
                return result;
            }

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

    @GetMapping("/api/membership")
    @ResponseBody
    public Map<String, Object> getWorkspaceMembership(
            @RequestParam("wsId") Long wsId,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            result.put("member", false);
            return result;
        }

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) {
            result.put("success", false);
            result.put("status", "NOT_FOUND");
            result.put("member", false);
            return result;
        }

        boolean member = workspaceAuthorizationService.isMember(wsId, user.getUserId());
        if (!member && "INVITE_ONLY".equalsIgnoreCase(workspace.getJoinType())) {
            // 초대 전용 그룹은 비멤버에게 존재와 가입 상태를 노출하지 않습니다.
            result.put("success", false);
            result.put("status", "NOT_VISIBLE");
            result.put("member", false);
            return result;
        }

        String joinRequestStatus = member ? null : workspaceService.getJoinRequestStatus(wsId, user.getUserId());
        result.put("success", true);
        result.put("status", member ? "MEMBER" : "NOT_MEMBER");
        result.put("member", member);
        result.put("joinRequestStatus", joinRequestStatus);
        return result;
    }

    @PostMapping("/api/join-request")
    @ResponseBody
    public Map<String, Object> requestJoinWorkspace(
            @RequestParam("wsId") Long wsId,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        try {
            String status = workspaceService.requestJoinWorkspace(wsId, user.getUserId());
            result.put("status", status);
            result.put("success", "SUCCESS".equals(status) || "ALREADY_PENDING".equals(status));
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("status", "ERROR");
        }
        return result;
    }

    @PostMapping("/api/join-request/respond")
    @ResponseBody
    public Map<String, Object> respondJoinWorkspaceRequest(
            @RequestParam("requestId") Long requestId,
            @RequestParam("status") String status,
            @RequestParam(value = "rejectionReason", required = false) String rejectionReason,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            response.put("success", false);
            response.put("message", "LOGIN_REQUIRED");
            return response;
        }

        String result = workspaceService.respondJoinRequest(requestId, status, user.getUserId(), rejectionReason);
        response.put("success", "SUCCESS".equals(result));
        response.put("message", result);
        return response;
    }

    @PostMapping(value = "/api/join-request/complete", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public Map<String, Object> completeApprovedJoinRequest(
            @RequestParam("requestId") Long requestId,
            @RequestParam(value = "useAccountProfile", defaultValue = "Y") String useAccountProfile,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "positionName", required = false) String positionName,
            @RequestParam(value = "introText", required = false) String introText,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "showEmail", defaultValue = "Y") String showEmail,
            @RequestParam(value = "showPhone", defaultValue = "Y") String showPhone,
            @RequestParam(value = "showBirth", defaultValue = "Y") String showBirth,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "profileImageOriginal", required = false) MultipartFile profileImageOriginal,
            @RequestParam(value = "profileImageCropScale", required = false) Double profileImageCropScale,
            @RequestParam(value = "profileImageCropX", required = false) Double profileImageCropX,
            @RequestParam(value = "profileImageCropY", required = false) Double profileImageCropY,
            @RequestParam(value = "removeProfileImage", defaultValue = "N") String removeProfileImage,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        String profileMode = "N".equalsIgnoreCase(useAccountProfile) ? "N" : "Y";
        if ("N".equals(profileMode) && (displayName == null || displayName.trim().isEmpty())) {
            result.put("success", false);
            result.put("status", "DISPLAY_NAME_REQUIRED");
            return result;
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("useAccountProfile", profileMode);
        if ("Y".equals(profileMode)) {
            profile.put("displayName", user.getUSER_NAME());
            profile.put("contactEmail", user.getEMAIL());
        } else {
            profile.put("displayName", displayName);
            profile.put("contactEmail", contactEmail);
            if (profileImage != null && !profileImage.isEmpty()) {
                profile.put("profileImagePath", fileUploadService.upload(profileImage));
            }
        }
        profile.put("positionName", positionName);
        profile.put("introText", introText);
        profile.put("phoneNumber", phoneNumber);
        profile.put("showEmail", showEmail);
        profile.put("showPhone", showPhone);
        profile.put("showBirth", showBirth);

        try {
            String status = workspaceService.completeApprovedJoinRequest(requestId, user.getUserId(), profile);
            result.put("status", status);
            result.put("success", "SUCCESS".equals(status) || "ALREADY_MEMBER".equals(status));

            if ("SUCCESS".equals(status) || "ALREADY_MEMBER".equals(status)) {
                Map<String, Object> request = workspaceDAO.selectJoinRequestById(requestId);
                Object wsValue = request == null ? null
                        : (request.get("WSID") != null ? request.get("WSID")
                        : (request.get("WS_ID") != null ? request.get("WS_ID") : request.get("wsId")));
                if (wsValue != null) {
                    Long wsId = Long.valueOf(String.valueOf(wsValue));
                    session.setAttribute("currentWsId", wsId);
                    result.put("wsId", wsId);
                    result.put("redirectUrl", "/workspace/main?wsId=" + wsId);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("status", "ERROR");
        }
        return result;
    }

    @PostMapping("/api/join-request/abandon")
    @ResponseBody
    public Map<String, Object> abandonApprovedJoinRequest(
            @RequestParam("requestId") Long requestId,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        try {
            String status = workspaceService.abandonApprovedJoinRequest(requestId, user.getUserId());
            result.put("status", status);
            result.put("success", "SUCCESS".equals(status));
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("status", "ERROR");
        }
        return result;
    }

    @PostMapping("/api/join-request/cancel")
    @ResponseBody
    public Map<String, Object> cancelJoinWorkspaceRequest(
            @RequestParam("wsId") Long wsId,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        try {
            String status = workspaceService.cancelJoinRequest(wsId, user.getUserId());
            result.put("status", status);
            result.put("success", "SUCCESS".equals(status));
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("status", "ERROR");
        }
        return result;
    }

    @PostMapping(value = "/api/join-open", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public Map<String, Object> joinOpenWorkspace(
            @RequestParam("wsId") Long wsId,
            @RequestParam(value = "useAccountProfile", defaultValue = "Y") String useAccountProfile,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "positionName", required = false) String positionName,
            @RequestParam(value = "introText", required = false) String introText,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "showEmail", defaultValue = "Y") String showEmail,
            @RequestParam(value = "showPhone", defaultValue = "Y") String showPhone,
            @RequestParam(value = "showBirth", defaultValue = "Y") String showBirth,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        String profileMode = "N".equalsIgnoreCase(useAccountProfile) ? "N" : "Y";
        if ("N".equals(profileMode) && (displayName == null || displayName.trim().isEmpty())) {
            result.put("success", false);
            result.put("status", "DISPLAY_NAME_REQUIRED");
            return result;
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("useAccountProfile", profileMode);
        if ("Y".equals(profileMode)) {
            profile.put("displayName", user.getUSER_NAME());
            profile.put("contactEmail", user.getEMAIL());
        } else {
            profile.put("displayName", displayName);
            profile.put("contactEmail", contactEmail);
            if (profileImage != null && !profileImage.isEmpty()) {
                profile.put("profileImagePath", fileUploadService.upload(profileImage));
            }
        }
        profile.put("positionName", positionName);
        profile.put("introText", introText);
        profile.put("phoneNumber", phoneNumber);
        profile.put("showEmail", showEmail);
        profile.put("showPhone", showPhone);
        profile.put("showBirth", showBirth);

        try {
            String status = workspaceService.joinOpenWorkspace(wsId, user.getUserId(), profile);
            result.put("status", status);
            result.put("success", "SUCCESS".equals(status) || "ALREADY_MEMBER".equals(status));
            if ("SUCCESS".equals(status) || "ALREADY_MEMBER".equals(status)) {
                session.setAttribute("currentWsId", wsId);
                result.put("wsId", wsId);
                result.put("redirectUrl", "/workspace/main?wsId=" + wsId);
            }
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("status", "ERROR");
        }
        return result;
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

    @PostMapping("/api/invitations/{inviteId}/cancel")
    @ResponseBody
    public Map<String, Object> cancelInvitation(
            @PathVariable("inviteId") Long inviteId,
            HttpSession session) {

        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        Map<String, Object> inviteInfo = workspaceDAO.selectInvitationById(inviteId);
        if (inviteInfo == null) {
            result.put("success", false);
            result.put("status", "NOT_FOUND");
            return result;
        }

        Long wsId = Long.valueOf(String.valueOf(inviteInfo.get("WS_ID")));
        if (!workspaceAuthorizationService.canManage(wsId, user.getUserId())) {
            result.put("success", false);
            result.put("status", "FORBIDDEN");
            return result;
        }

        String inviteStatus = String.valueOf(inviteInfo.getOrDefault("STATUS", ""));
        if (!"PENDING".equalsIgnoreCase(inviteStatus)) {
            result.put("success", false);
            result.put("status", "ALREADY_PROCESSED");
            return result;
        }

        boolean success = workspaceService.cancelInvitation(inviteId, wsId);
        result.put("success", success);
        result.put("status", success ? "CANCELLED" : "ALREADY_PROCESSED");
        return result;
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
            @RequestParam(value = "introText", required = false) String introText,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "showEmail", defaultValue = "Y") String showEmail,
            @RequestParam(value = "showPhone", defaultValue = "Y") String showPhone,
            @RequestParam(value = "showBirth", defaultValue = "Y") String showBirth,
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

        String normalizedInviteStatus = status == null ? "" : status.trim().toUpperCase();

        Map<String, Object> profile = null;
        if ("ACCEPTED".equals(normalizedInviteStatus)) {
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
            profile.put("introText", introText);
            profile.put("phoneNumber", phoneNumber);
            profile.put("showEmail", showEmail);
            profile.put("showPhone", showPhone);
            profile.put("showBirth", showBirth);

            if (profileImage != null && !profileImage.isEmpty()) {
                profile.put("profileImagePath", fileUploadService.upload(profileImage));
            }
        }

        try {
            boolean success = workspaceService.processInvitation(
                    inviteId, normalizedInviteStatus, user.getUserId(), profile);

            result.put("success", success);
            result.put("status", normalizedInviteStatus);

            if (success && "ACCEPTED".equals(normalizedInviteStatus)) {
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
        if (wsId == null) return "FAIL";

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        if (workspace == null) return "NOT_FOUND";
        if (!workspaceAuthorizationService.isMember(wsId, user.getUserId())) return "NOT_MEMBER";

        // 그룹장만 직접 탈퇴할 수 없다. ADMIN 역할 멤버는 일반 멤버와 동일하게 탈퇴 가능하다.
        if (workspaceAuthorizationService.isOwner(wsId, user.getUserId())) {
            return "OWNER_TRANSFER_REQUIRED";
        }

        String workspaceStatus = workspace.getStatus() == null
                ? "ACTIVE"
                : workspace.getStatus().trim().toUpperCase();
        if (!"ACTIVE".equals(workspaceStatus) && !"DELETE_PENDING".equals(workspaceStatus)) {
            return "WORKSPACE_NOT_ACTIVE";
        }

        // 활성 그룹 프로젝트의 팀장은 프로젝트 팀장을 먼저 위임해야 한다.
        if (workspaceDAO.countLedActiveWorkspaceProjects(wsId, user.getUserId()) > 0) {
            return "PROJECT_LEADER_TRANSFER_REQUIRED";
        }

        boolean success = workspaceService.removeMember(wsId, user.getUserId());
        return success ? "SUCCESS" : "NOT_MEMBER";
    }

    @GetMapping("/api/{wsId}/community-summary")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getCommunitySummary(
            @PathVariable("wsId") Long wsId,
            HttpSession session) {
        org.springframework.http.ResponseEntity<?> denied = authorizeWorkspaceMember(wsId, session);
        if (denied != null) return denied;
        return org.springframework.http.ResponseEntity.ok(workspaceService.getCommunitySummary(wsId));
    }

 // 1. 오늘의 일정 로딩 (기존)
    @GetMapping("/api/{wsId}/today-events")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getTodayEvents(
            @PathVariable("wsId") Long wsId,
            HttpSession session) {
        org.springframework.http.ResponseEntity<?> denied = authorizeWorkspaceMember(wsId, session);
        if (denied != null) return denied;
        return org.springframework.http.ResponseEntity.ok(workspaceService.getTodayEvents(wsId));
    }

 // 2. 진행 중인 투표 로딩
    @GetMapping("/api/workspace/{wsId}/active-poll")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getActivePoll(
            @PathVariable("wsId") Long wsId,
            HttpSession session) {
        org.springframework.http.ResponseEntity<?> denied = authorizeWorkspaceMember(wsId, session);
        if (denied != null) return denied;
        Map<String, Object> data = workspaceService.getActivePoll(wsId);
        return org.springframework.http.ResponseEntity.ok(data != null ? data : new HashMap<>());
    }

    // 3. 투표 반영
    @PostMapping("/api/workspace/vote")
    @ResponseBody
    public String voteLegacy() {
        // 신규 투표는 /api/polls/* 경로만 사용한다.
        return "legacy_disabled";
    }
    @PostMapping("/api/poll/create")
    @ResponseBody
    public String createPollLegacy() {
        // 구형 투표 생성 경로로 권한 검증을 우회하지 못하도록 차단한다.
        return "legacy_disabled";
    }

    @GetMapping("/api/saved-member-profile")
    @ResponseBody
    public Map<String, Object> getSavedMemberProfile(
            @RequestParam("wsId") Long wsId,
            HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");

        if (user == null) {
            result.put("success", false);
            result.put("status", "LOGIN_REQUIRED");
            return result;
        }

        Map<String, Object> profile =
                workspaceService.getSavedWorkspaceMemberProfile(
                        wsId,
                        user.getUserId()
                );

        result.put("success", true);
        result.put("hasSavedProfile", profile != null && !profile.isEmpty());
        result.put("profile", profile);
        return result;
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

    @GetMapping("/api/{wsId}/members/{userId}/activity-profile/contributions")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getWorkspaceMemberActivityContributions(
            @PathVariable("wsId") Long wsId,
            @PathVariable("userId") Long targetUserId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return org.springframework.http.ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        }
        Map<String, Object> profile = workspaceService.getWorkspaceMemberProfile(wsId, targetUserId, loginUser.getUserId());
        if (profile == null || profile.isEmpty()) {
            return org.springframework.http.ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }
        return org.springframework.http.ResponseEntity.ok(
                workspaceService.getWorkspaceMemberContributions(wsId, targetUserId, loginUser.getUserId()));
    }

    @GetMapping("/api/{wsId}/members/{userId}/activity-profile/activities")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getWorkspaceMemberActivityRecent(
            @PathVariable("wsId") Long wsId,
            @PathVariable("userId") Long targetUserId,
            HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return org.springframework.http.ResponseEntity.status(401).body(Map.of("status", "LOGIN_REQUIRED"));
        }
        Map<String, Object> profile = workspaceService.getWorkspaceMemberProfile(wsId, targetUserId, loginUser.getUserId());
        if (profile == null || profile.isEmpty()) {
            return org.springframework.http.ResponseEntity.status(403).body(Map.of("status", "FORBIDDEN"));
        }
        return org.springframework.http.ResponseEntity.ok(
                workspaceService.getWorkspaceMemberRecentActivities(wsId, targetUserId, loginUser.getUserId()));
    }

    @PostMapping(value = "/api/{wsId}/members/me/profile",
                 consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public org.springframework.http.ResponseEntity<Map<String, Object>> saveMyMemberProfile(
            @PathVariable("wsId") Long wsId,
            @RequestParam(value = "useAccountProfile", defaultValue = "Y") String useAccountProfile,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "introText", required = false) String introText,
            @RequestParam(value = "positionName", required = false) String positionName,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "showEmail", defaultValue = "Y") String showEmail,
            @RequestParam(value = "showPhone", defaultValue = "Y") String showPhone,
            @RequestParam(value = "showBirth", defaultValue = "Y") String showBirth,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "profileImageOriginal", required = false) MultipartFile profileImageOriginal,
            @RequestParam(value = "profileImageCropScale", required = false) Double profileImageCropScale,
            @RequestParam(value = "profileImageCropX", required = false) Double profileImageCropX,
            @RequestParam(value = "profileImageCropY", required = false) Double profileImageCropY,
            @RequestParam(value = "removeProfileImage", defaultValue = "N") String removeProfileImage,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return org.springframework.http.ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        if (wsId == null || !workspaceAuthorizationService.isMember(wsId, loginUser.getUserId())) {
            return org.springframework.http.ResponseEntity.status(403)
                    .body(Map.of("success", false, "message", "그룹 멤버만 프로필을 수정할 수 있습니다."));
        }

        String uploadedPath = null;
        String uploadedOriginalPath = null;
        try {
            if (profileImage != null && !profileImage.isEmpty()) {
                String contentType = profileImage.getContentType();
                if (profileImage.getSize() > 5L * 1024L * 1024L) {
                    return org.springframework.http.ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "프로필 이미지는 5MB 이하만 사용할 수 있습니다."));
                }
                if (contentType == null || !(contentType.equalsIgnoreCase("image/png")
                        || contentType.equalsIgnoreCase("image/jpeg")
                        || contentType.equalsIgnoreCase("image/webp"))) {
                    return org.springframework.http.ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "PNG, JPG, WEBP 이미지만 사용할 수 있습니다."));
                }
                uploadedPath = fileUploadService.upload(profileImage);
                if (uploadedPath == null || uploadedPath.isBlank()) {
                    return org.springframework.http.ResponseEntity.internalServerError()
                            .body(Map.of("success", false, "message", "프로필 이미지를 저장하지 못했습니다."));
                }
            }

            if (profileImageOriginal != null && !profileImageOriginal.isEmpty()) {
                if (profileImageOriginal.getSize() > 5L * 1024L * 1024L) {
                    if (uploadedPath != null) fileUploadService.deleteManagedFile(uploadedPath);
                    return org.springframework.http.ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "프로필 이미지 원본은 5MB 이하만 사용할 수 있습니다."));
                }
                String originalContentType = profileImageOriginal.getContentType();
                if (originalContentType == null || !(originalContentType.equalsIgnoreCase("image/png")
                        || originalContentType.equalsIgnoreCase("image/jpeg")
                        || originalContentType.equalsIgnoreCase("image/webp"))) {
                    if (uploadedPath != null) fileUploadService.deleteManagedFile(uploadedPath);
                    return org.springframework.http.ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "PNG, JPG, WEBP 이미지만 사용할 수 있습니다."));
                }
                uploadedOriginalPath = fileUploadService.upload(profileImageOriginal);
                if (uploadedOriginalPath == null || uploadedOriginalPath.isBlank()) {
                    if (uploadedPath != null) fileUploadService.deleteManagedFile(uploadedPath);
                    return org.springframework.http.ResponseEntity.internalServerError()
                            .body(Map.of("success", false, "message", "프로필 이미지 원본을 저장하지 못했습니다."));
                }
            }

            Map<String, Object> profile = new HashMap<>();
            profile.put("useAccountProfile", useAccountProfile);
            profile.put("displayName", displayName);
            profile.put("contactEmail", contactEmail);
            profile.put("introText", introText);
            profile.put("positionName", positionName);
            profile.put("phoneNumber", phoneNumber);
            profile.put("showEmail", showEmail);
            profile.put("showPhone", showPhone);
            profile.put("showBirth", showBirth);
            profile.put("profileImagePath", uploadedPath);
            profile.put("profileImageOriginalPath", uploadedOriginalPath);
            profile.put("profileImageCropScale", profileImageCropScale);
            profile.put("profileImageCropX", profileImageCropX);
            profile.put("profileImageCropY", profileImageCropY);
            profile.put(
                    "removeProfileImage",
                    "Y".equalsIgnoreCase(removeProfileImage) ? "Y" : "N"
            );

            boolean success = workspaceService.saveMyWorkspaceProfile(
                    wsId, loginUser.getUserId(), profile);
            if (!success) {
                if (uploadedPath != null) fileUploadService.deleteManagedFile(uploadedPath);
                if (uploadedOriginalPath != null) fileUploadService.deleteManagedFile(uploadedOriginalPath);
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "프로필을 저장하지 못했습니다."));
            }
            return org.springframework.http.ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            if (uploadedPath != null) fileUploadService.deleteManagedFile(uploadedPath);
            if (uploadedOriginalPath != null) fileUploadService.deleteManagedFile(uploadedOriginalPath);
            String message = e.getMessage();
            if (message == null || message.isBlank()) {
                message = "입력값을 확인해 주세요.";
            }
            return org.springframework.http.ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", message));
        } catch (Exception e) {
            e.printStackTrace();
            if (uploadedPath != null) fileUploadService.deleteManagedFile(uploadedPath);
            if (uploadedOriginalPath != null) fileUploadService.deleteManagedFile(uploadedOriginalPath);
            return org.springframework.http.ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "프로필 저장 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/api/members")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getWorkspaceMembers(
            @RequestParam("wsId") Long wsId, HttpSession session) {
        org.springframework.http.ResponseEntity<?> denied = authorizeWorkspaceMember(wsId, session);
        if (denied != null) return denied;

        usersDto loginUser = (usersDto) session.getAttribute("user");
        List<Map<String, Object>> members = workspaceService.getWorkspaceMembers(wsId);

        // 일반 멤버용 목록 API에서는 계정 식별용 이메일을 노출하지 않는다.
        // 공개 여부에 따른 이메일/연락처/생일은 공통 프로필 상세 API에서만 반환한다.
        // 그룹장/관리자는 멤버 관리 화면의 계정 식별 목적으로 이메일을 유지한다.
        if (loginUser == null || !workspaceAuthorizationService.canManage(wsId, loginUser.getUserId())) {
            for (Map<String, Object> member : members) {
                if (member == null) continue;
                member.remove("EMAIL");
                member.remove("email");
                member.remove("CUSTOM_CONTACT_EMAIL");
                member.remove("customContactEmail");
            }
        }

        return org.springframework.http.ResponseEntity.ok(members);
    }

    @GetMapping("/api/member-leave-activities")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> getWorkspaceMemberLeaveActivities(
            @RequestParam("wsId") Long wsId, HttpSession session) {
        org.springframework.http.ResponseEntity<?> denied = authorizeWorkspaceMember(wsId, session);
        if (denied != null) return denied;
        return org.springframework.http.ResponseEntity.ok(
                workspaceService.getWorkspaceMemberLeaveActivities(wsId));
    }
    private org.springframework.http.ResponseEntity<?> authorizeWorkspaceMember(Long wsId, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return org.springframework.http.ResponseEntity.status(401).body(Map.of("message", "LOGIN_REQUIRED"));
        }
        if (wsId == null || !workspaceAuthorizationService.isMember(wsId, loginUser.getUserId())) {
            return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "WORKSPACE_MEMBER_REQUIRED"));
        }
        return null;
    }

}