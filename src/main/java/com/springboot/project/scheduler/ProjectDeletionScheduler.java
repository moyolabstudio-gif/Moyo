package com.springboot.project.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.service.ProjectFinalDeletionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectDeletionScheduler {

    private final IprojectDAO projectDAO;
    private final ProjectFinalDeletionService finalDeletionService;

    /**
     * 매일 새벽 3시 40분에 삭제 예정일이 지난 프로젝트를 최종 삭제한다.
     * 각 프로젝트는 REQUIRES_NEW 트랜잭션으로 처리하므로,
     * 한 프로젝트 실패가 다른 프로젝트 삭제까지 롤백시키지 않는다.
     */
    @Scheduled(cron = "0 40 3 * * *")
    public void deleteExpiredProjects() {
        List<Long> projectIds = projectDAO.selectExpiredProjectDeletionIds();

        for (Long projId : projectIds) {
            try {
                finalDeletionService.deleteExpiredProject(projId);
                log.info("프로젝트 최종 삭제 완료. projId={}", projId);
            } catch (Exception e) {
                log.error("프로젝트 최종 삭제 실패. 롤백 처리됨. projId={}", projId, e);
            }
        }
    }
}
