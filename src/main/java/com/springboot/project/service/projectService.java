package com.springboot.project.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IprojectDAO; // DAO 인터페이스
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.projectRequestDTO;

@Service
public class projectService implements IprojectService {

    @Autowired
    private IprojectDAO projectDao;

    @Autowired
    private IworkspaceDAO workspaceDao; // 방금 만든 부품 주입!

 // projectService.java 수정
    @Override
    @Transactional
    public void insertProject(projectRequestDTO dto, Long userId) {
        // 1. 새 워크스페이스를 만드는 로직(workspaceDao.insertWorkspace)을 과감히 삭제!
        
        // 2. 컨트롤러에서 넘겨받은 wsId가 dto에 이미 들어있어야 함
        // (만약 wsId가 null이라면 에러가 납니다)
        
        // 3. 바로 프로젝트 생성
        projectDao.insertProject(dto);

        // 4. 프로젝트 멤버(본인) 등록 (필요시)
        Map<String, Object> params = new HashMap<>();
        params.put("projId", dto.getProjId());
        params.put("userId", userId);
        params.put("role", "OWNER");
        projectDao.insertProjectMember(params);
    }
    @Override
    public List<projectRequestDTO> getProjectsByWsId(Long wsId) {
        return projectDao.selectProjectsByWsId(wsId);
    }
}