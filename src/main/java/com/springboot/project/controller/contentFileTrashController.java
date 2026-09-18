package com.springboot.project.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.contentFileTrashService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/file-trash")
public class contentFileTrashController {
    private final contentFileTrashService service;

    public contentFileTrashController(contentFileTrashService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session) {
        return ResponseEntity.ok(service.list(scopeType, wsId, projId, userId(session)));
    }

    @PostMapping("/move")
    public ResponseEntity<?> move(@RequestBody BatchRequest request, HttpSession session) {
        service.moveToTrash(request.scopeType(), request.wsId(), request.projId(), request.fileIds(), request.folderIds(), userId(session));
        return ResponseEntity.ok(Map.of("moved", true));
    }

    @PostMapping("/restore")
    public ResponseEntity<?> restore(@RequestBody BatchRequest request, HttpSession session) {
        service.restore(request.scopeType(), request.wsId(), request.projId(), request.fileIds(), request.folderIds(), userId(session));
        return ResponseEntity.ok(Map.of("restored", true));
    }

    @DeleteMapping("/permanent")
    public ResponseEntity<?> permanent(@RequestBody BatchRequest request, HttpSession session) {
        service.deletePermanently(request.scopeType(), request.wsId(), request.projId(), request.fileIds(), request.folderIds(), userId(session));
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    private Long userId(HttpSession session) {
        Object value = session.getAttribute("loginUserId");
        if (value == null) value = session.getAttribute("userId");
        if (value == null && session.getAttribute("user") instanceof usersDto user) value = user.getUserId();
        if (value == null) throw new SecurityException("로그인이 필요합니다.");
        return Long.valueOf(String.valueOf(value));
    }

    public record BatchRequest(String scopeType, Long wsId, Long projId, List<Long> fileIds, List<Long> folderIds) {}
}
