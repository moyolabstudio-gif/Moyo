package com.springboot.project.service;

import java.util.List;

import com.springboot.project.dto.projectRequestDTO;

public interface IprojectService {
    // 프로젝트를 생성하고, 생성한 유저를 팀장으로 등록하는 표준 메서드
    void insertProject(projectRequestDTO dto, Long userId);
    List<projectRequestDTO> getProjectsByWsId(Long wsId);
}