package com.springboot.project.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IworkspaceDAO;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WorkspaceDeletionScheduler {

    private final IworkspaceDAO workspaceDAO;

    /**
     * 삭제 신청 후 30일이 지난 그룹을 매일 새벽 3시 30분에 물리 삭제한다.
     * 기존 그룹 삭제 순서와 동일하게 멤버 관계를 먼저 제거한다.
     */
    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void deleteExpiredWorkspaces() {
        List<Long> workspaceIds = workspaceDAO.selectExpiredWorkspaceDeletionIds();
        for (Long wsId : workspaceIds) {
            workspaceDAO.deleteWorkspaceAllMembers(wsId);
            workspaceDAO.deleteWorkspace(wsId);
        }
    }
}
