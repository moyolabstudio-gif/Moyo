package com.springboot.project.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.springboot.project.service.InoteService;

@Component
public class NoteTrashCleanupScheduler {

    private final InoteService noteService;

    public NoteTrashCleanupScheduler(InoteService noteService) {
        this.noteService = noteService;
    }

    /**
     * 노트 휴지통 보관 기간은 30일이다.
     * 매일 새벽 3시 10분에 30일이 지난 휴지통 노트를 영구 삭제한다.
     */
    @Scheduled(cron = "0 10 3 * * *")
    public void purgeExpiredNoteTrashItems() {
        noteService.purgeExpiredTrashNotes();
    }
}
