package com.springboot.project.controller;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@ControllerAdvice
public class globalControllerAdvice {

    @Autowired
    private IworkspaceDAO workspaceDAO;

    @Autowired
    private IprojectDAO projectDAO;

    @ModelAttribute("userWorkspaces")
    public List<workspaceDTO> getUserWorkspaces(HttpSession session, HttpServletRequest request) {
        if (request.getDispatcherType() == DispatcherType.ERROR) {
            return Collections.emptyList();
        }
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            return Collections.emptyList();
        }

        List<workspaceDTO> workspaces = workspaceDAO.selectWorkspaceList(user.getUserId());
        return workspaces == null ? Collections.emptyList() : workspaces;
    }

    @ModelAttribute("sidebarPersonalProjects")
    public List<projectRequestDTO> getSidebarPersonalProjects(HttpSession session, HttpServletRequest request) {
        if (request.getDispatcherType() == DispatcherType.ERROR) {
            return Collections.emptyList();
        }
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            return Collections.emptyList();
        }

        List<projectRequestDTO> projects = projectDAO.selectSidebarPersonalActiveProjects(user.getUserId());
        return projects == null ? Collections.emptyList() : projects;
    }

    @ModelAttribute("sidebarProjects")
    public Map<Long, List<projectRequestDTO>> getSidebarProjects(HttpSession session, HttpServletRequest request) {
        if (request.getDispatcherType() == DispatcherType.ERROR) {
            return Collections.emptyMap();
        }
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            return Collections.emptyMap();
        }

        List<projectRequestDTO> projects = projectDAO.selectSidebarActiveProjectsForUser(user.getUserId());
        if (projects == null || projects.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, List<projectRequestDTO>> result = new LinkedHashMap<>();
        for (projectRequestDTO project : projects) {
            if (project == null || project.getWsId() == null) continue;
            result.computeIfAbsent(project.getWsId(), key -> new java.util.ArrayList<>()).add(project);
        }
        return result;
    }
}
