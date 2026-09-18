package com.springboot.project.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.contentRecordDraftRequest;
import com.springboot.project.dto.contentRecordTargetDTO;
import com.springboot.project.service.IcontentRecordService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/content-record-drafts")
public class contentRecordDraftController {

    private final IcontentRecordService contentRecordService;

    public contentRecordDraftController(IcontentRecordService contentRecordService) {
        this.contentRecordService = contentRecordService;
    }

    @PostMapping
    public ResponseEntity<?> ensureDraft(
            @RequestBody contentRecordDraftRequest request,
            HttpSession session) {
        Long userId = requireUserId(session);
        try {
            return ResponseEntity.ok(contentRecordService.ensureDraft(request, userId));
        } catch (SecurityException e) {
            return error(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/{draftKey}")
    public ResponseEntity<?> getDraft(
            @PathVariable("draftKey") String draftKey,
            HttpSession session) {
        Long userId = requireUserId(session);
        try {
            return ResponseEntity.ok(contentRecordService.getOwnedDraft(draftKey, userId));
        } catch (SecurityException e) {
            return error(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            return error(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @DeleteMapping("/{draftKey}")
    public ResponseEntity<?> abandonDraft(
            @PathVariable("draftKey") String draftKey,
            HttpSession session) {
        Long userId = requireUserId(session);
        try {
            boolean abandoned = contentRecordService.abandonDraft(draftKey, userId);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", abandoned);
            response.put("draftKey", draftKey);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return error(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            return error(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized() {
        return error(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }

    private Long requireUserId(HttpSession session) {
        usersDto user = session == null ? null : (usersDto) session.getAttribute("user");
        if (user == null || user.getUserId() == null) {
            throw new UnauthorizedException();
        }
        return user.getUserId();
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }

    private static class UnauthorizedException extends RuntimeException {
        private static final long serialVersionUID = 1L;
    }
}
