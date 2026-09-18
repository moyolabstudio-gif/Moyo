package com.springboot.project.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.service.IcalendarResponseService;
import com.springboot.project.service.IcontentFileService;
import com.springboot.project.service.IprojectService;
import com.springboot.project.service.IworkspaceService;

import jakarta.servlet.http.HttpSession;

@Controller
public class contentFileViewController {
    private final IcontentFileService service;
    private final IprojectService projectService;
    private final IworkspaceService workspaceService;
    private final IcalendarResponseService calendarResponseService;

    public contentFileViewController(
            IcontentFileService service,
            IprojectService projectService,
            IworkspaceService workspaceService,
            IcalendarResponseService calendarResponseService) {
        this.service = service;
        this.projectService = projectService;
        this.workspaceService = workspaceService;
        this.calendarResponseService = calendarResponseService;
    }

    @GetMapping("/files")
    public String personalFiles(Model model, HttpSession session) {
        Long userId = userId(session);
        service.getFiles("PERSONAL", null, null, userId);

        model.addAttribute("scopeType", "PERSONAL");
        model.addAttribute("wsId", null);
        model.addAttribute("projId", null);
        model.addAttribute("workspace", null);
        model.addAttribute("projectDetail", null);
        model.addAttribute("personalProjects", accessibleProjects(userId, null, true));
        model.addAttribute("personalRoot", true);
        model.addAttribute("pageTitle", "내 자료실");
        model.addAttribute("contentType", "FILE");
        return "common/contentExplorer";
    }

    @GetMapping("/group/files")
    public String groupFiles(@RequestParam("wsId") Long wsId, Model model, HttpSession session) {
        Long userId = userId(session);
        service.getFiles("GROUP", wsId, null, userId);

        workspaceDTO workspace = workspaceService.getWorkspaceDetail(wsId);
        model.addAttribute("scopeType", "GROUP");
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", null);
        model.addAttribute("workspace", workspace);
        model.addAttribute("projectDetail", null);
        model.addAttribute("groupProjects", accessibleProjects(userId, wsId, false));
        model.addAttribute("pageTitle", "그룹 자료실");
        model.addAttribute("contentType", "FILE");
        return "common/contentExplorer";
    }

    @GetMapping("/project/files")
    public String projectFiles(
            @RequestParam("projId") Long projId,
            @RequestParam(value = "wsId", required = false) Long wsId,
            Model model,
            HttpSession session) {
        Long userId = userId(session);
        service.getFiles("PROJECT", null, projId, userId);

        projectRequestDTO project = projectService.getProjectById(projId);
        if (project == null) {
            throw new IllegalArgumentException("프로젝트를 찾을 수 없습니다.");
        }

        Long effectiveWsId = project.getWsId() != null ? project.getWsId() : wsId;
        workspaceDTO workspace = effectiveWsId == null
                ? null
                : workspaceService.getWorkspaceDetail(effectiveWsId);

        model.addAttribute("scopeType", "PROJECT");
        model.addAttribute("wsId", effectiveWsId);
        model.addAttribute("projId", projId);
        model.addAttribute("workspace", workspace);
        model.addAttribute("projectDetail", project);
        model.addAttribute("pageTitle", "프로젝트 자료실");
        model.addAttribute("contentType", "FILE");
        return "common/contentExplorer";
    }

    private List<Map<String, Object>> accessibleProjects(Long userId, Long targetWsId, boolean personalOnly) {
        List<Map<String, Object>> projects = calendarResponseService.getProjectsByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        if (projects == null) return result;

        for (Map<String, Object> project : projects) {
            Long projectWsId = number(project, "wsId", "WS_ID");
            String projectScope = text(project, "projScope", "PROJ_SCOPE");

            if (personalOnly) {
                if (projectWsId == null || "PERSONAL".equalsIgnoreCase(projectScope)) {
                    result.add(project);
                }
            } else if (targetWsId != null && targetWsId.equals(projectWsId)) {
                result.add(project);
            }
        }
        return result;
    }

    private Long number(Map<String, Object> source, String... keys) {
        for (String key : keys) {
            Object value = source.get(key);
            if (value instanceof Number number) return number.longValue();
            if (value != null) {
                try {
                    return Long.valueOf(String.valueOf(value));
                } catch (NumberFormatException ignored) {
                    // 다음 키 확인
                }
            }
        }
        return null;
    }

    private String text(Map<String, Object> source, String... keys) {
        for (String key : keys) {
            Object value = source.get(key);
            if (value != null) return String.valueOf(value);
        }
        return "";
    }

    private Long userId(HttpSession session) {
        Object id = session.getAttribute("loginUserId");
        if (id == null) id = session.getAttribute("userId");
        if (id == null && session.getAttribute("user") instanceof com.springboot.project.dto.usersDto user) {
            id = user.getUserId();
        }
        if (id == null) throw new SecurityException("로그인이 필요합니다.");
        return Long.valueOf(String.valueOf(id));
    }
}
