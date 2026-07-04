package com.springboot.project.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.springboot.project.service.IphotoAlbumService;

@Component
public class PhotoTrashCleanupScheduler {

    private final IphotoAlbumService photoAlbumService;

    public PhotoTrashCleanupScheduler(IphotoAlbumService photoAlbumService) {
        this.photoAlbumService = photoAlbumService;
    }

    /**
     * 사진 휴지통 보관 기간은 30일이다.
     * 매일 새벽 3시에 30일이 지난 휴지통 사진을 영구 삭제한다.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void purgeExpiredPhotoTrashPosts() {
        photoAlbumService.purgeExpiredTrashPosts();
    }
}
