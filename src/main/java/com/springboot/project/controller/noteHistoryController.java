package com.springboot.project.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.noteVersionDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.InoteService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/notes")
public class noteHistoryController {
    private final InoteService noteService;

    public noteHistoryController(InoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/{noteId}/versions")
    public ResponseEntity<?> versions(@PathVariable("noteId") Long noteId, HttpSession session) {
        Long userId = userId(session);
        if (userId == null) return unauthorized();
        return ResponseEntity.ok(noteService.getNoteVersions(noteId, userId));
    }

    @PostMapping("/{noteId}/versions/{noteVersionId}/restore")
    public ResponseEntity<?> restore(@PathVariable("noteId") Long noteId,
                                     @PathVariable("noteVersionId") Long noteVersionId,
                                     HttpSession session) {
        Long userId = userId(session);
        if (userId == null) return unauthorized();
        noteVersionDTO restored = noteService.restoreNoteVersion(noteId, noteVersionId, userId);
        return ResponseEntity.ok(Map.of(
                "noteId", noteId,
                "noteVersionId", restored.getNoteVersionId(),
                "noteTitle", restored.getNoteTitle() == null ? "" : restored.getNoteTitle(),
                "noteContent", restored.getNoteContent() == null ? "" : restored.getNoteContent(),
                "changeType", restored.getChangeType() == null ? "RESTORE" : restored.getChangeType()
        ));
    }

    private Long userId(HttpSession session) {
        Object value = session == null ? null : session.getAttribute("user");
        return value instanceof usersDto user ? user.getUserId() : null;
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
    }
}
