package com.springboot.project.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.service.WorkspaceFinalDeletionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkspaceDeletionScheduler {

    private final IworkspaceDAO workspaceDAO;
    private final WorkspaceFinalDeletionService finalDeletionService;

    /**
     * 매일 새벽 3시 30분에 삭제 예정일이 지난 그룹을 최종 삭제한다.
     * 그룹별 REQUIRES_NEW 트랜잭션으로 처리하여
     * 한 그룹 실패가 다른 그룹 삭제까지 막지 않도록 한다.
     */
    @Scheduled(cron = "0 30 3 * * *")
    public void deleteExpiredWorkspaces() {
        List<Long> workspaceIds =
                workspaceDAO.selectExpiredWorkspaceDeletionIds();

        for (Long wsId : workspaceIds) {
            try {
                finalDeletionService.deleteExpiredWorkspace(wsId);
                log.info("그룹 최종 삭제 완료. wsId={}", wsId);
            } catch (Exception e) {
                log.error(
                        "그룹 최종 삭제 실패. 롤백 처리됨. wsId={}",
                        wsId,
                        e);
            }
        }
    }
}
