package com.springboot.project.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.springboot.project.service.contentFileTrashService;

@Component
public class ContentFileTrashCleanupScheduler {
    private final contentFileTrashService service;
    public ContentFileTrashCleanupScheduler(contentFileTrashService service) { this.service = service; }
    @Scheduled(cron = "0 20 4 * * *", zone = "Asia/Seoul")
    public void purgeExpiredTrash() { service.purgeExpired(); }
}
