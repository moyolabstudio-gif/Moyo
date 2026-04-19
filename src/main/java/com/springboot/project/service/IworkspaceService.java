package com.springboot.project.service;

import java.util.List;

import com.springboot.project.dto.workspaceDTO;

public interface IworkspaceService {
    // 워크스페이스 생성 및 생성된 ID 반환
    Long createWorkspace(workspaceDTO dto, Long userId);
    List<workspaceDTO> getWorkspaceList(Long userId);
    workspaceDTO getWorkspaceDetail(Long wsId);
}