package com.springboot.project.service;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.workspaceDTO;

@Service
public class workspaceService implements IworkspaceService {

    @Autowired
    private IworkspaceDAO workspaceDao;

    @Override
    @Transactional
    public Long createWorkspace(workspaceDTO dto, Long userId) {
        // 1. 초대 코드 생성 (랜덤 8자리)
        String code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        dto.setInviteCode(code);
        
        // 2. 소유자 설정
        dto.setOwnerId(userId);
        
        // 3. DAO 호출하여 저장
        workspaceDao.insertWorkspace(dto);
        
        // 4. 생성된 wsId 반환 (MyBatis의 selectKey 사용 가정)
        return dto.getWsId();
    }
    public List<workspaceDTO> getWorkspaceList(Long userId) {
        return workspaceDao.selectWorkspaceList(userId);
    }
    @Override
    public workspaceDTO getWorkspaceDetail(Long wsId) {
        return workspaceDao.selectWorkspaceDetail(wsId);
    }
}