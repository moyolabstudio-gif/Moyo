package com.springboot.project.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.service.AccountFinalWithdrawalService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountWithdrawalScheduler {

    private final IusersDao usersDao;
    private final AccountFinalWithdrawalService finalWithdrawalService;

    /**
     * 매일 새벽 3시 15분(한국시간), 탈퇴 유예 30일이 지난 계정을 최종 처리한다.
     * 계정별 REQUIRES_NEW 트랜잭션으로 한 계정 실패가 다른 계정 처리까지 막지 않는다.
     */
    @Scheduled(cron = "0 15 3 * * *", zone = "Asia/Seoul")
    public void finalizeExpiredWithdrawals() {
        List<Long> userIds = usersDao.findExpiredWithdrawalUserIds();
        if (userIds == null || userIds.isEmpty()) return;

        for (Long userId : userIds) {
            try {
                finalWithdrawalService.finalizeExpiredWithdrawal(userId);
                log.info("회원 최종 탈퇴 완료. userId={}", userId);
            } catch (Exception e) {
                log.error("회원 최종 탈퇴 실패. 롤백 처리됨. userId={}", userId, e);
            }
        }
    }
}
