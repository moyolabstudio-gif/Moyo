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

import jakarta.servlet.http.HttpSession;

@ControllerAdvice
public class globalControllerAdvice {

    @Autowired
    private IworkspaceDAO workspaceDAO;

    @Autowired
    private IprojectDAO projectDAO;

    @ModelAttribute("userWorkspaces")
    public List<workspaceDTO> getUserWorkspaces(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            return Collections.emptyList();
        }

        List<workspaceDTO> workspaces = workspaceDAO.selectWorkspaceList(user.getUserId());
        return workspaces == null ? Collections.emptyList() : workspaces;
    }

    @ModelAttribute("sidebarProjects")
    public Map<Long, List<projectRequestDTO>> getSidebarProjects(HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            return Collections.emptyMap();
        }

        List<workspaceDTO> workspaces = workspaceDAO.selectWorkspaceList(user.getUserId());
        if (workspaces == null || workspaces.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, List<projectRequestDTO>> result = new LinkedHashMap<>();
        for (workspaceDTO workspace : workspaces) {
            List<projectRequestDTO> projects = projectDAO.selectProjectsByWsId(workspace.getWsId());
            result.put(workspace.getWsId(), projects == null ? Collections.emptyList() : projects);
        }
        return result;
    }
}
