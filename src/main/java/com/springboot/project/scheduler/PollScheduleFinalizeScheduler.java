package com.springboot.project.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.springboot.project.service.IpollService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PollScheduleFinalizeScheduler {

    private final IpollService pollService;

    @Scheduled(cron = "15 * * * * *", zone = "Asia/Seoul")
    public void finalizeExpiredSchedulePolls() {
        pollService.finalizeExpiredSchedulePolls();
        pollService.finalizeExpiredRegularPolls();
    }
}
