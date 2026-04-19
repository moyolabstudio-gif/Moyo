package com.springboot.project.dao;

import java.util.List;
import com.springboot.project.dto.workspaceDTO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface IworkspaceDAO {
    void insertWorkspace(workspaceDTO dto);
    
    // [추가] 서비스가 호출하는 메서드와 이름을 정확히 맞추세요.
    List<workspaceDTO> selectWorkspaceList(Long userId);
    workspaceDTO selectWorkspaceDetail(Long wsId);
}