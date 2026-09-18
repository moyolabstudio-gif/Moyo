package com.springboot.project.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.contentFileFolderService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/file-folders")
public class contentFileFolderController {

    private final contentFileFolderService contentFileFolderService;

    public contentFileFolderController(
            contentFileFolderService contentFileFolderService) {
        this.contentFileFolderService = contentFileFolderService;
    }

    @GetMapping("/tree")
    public ResponseEntity<?> getFolderTree(
            @RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileFolderService.tree(
                        scopeType,
                        wsId,
                        projId,
                        getLoginUserId(session)));
    }

    @GetMapping
    public ResponseEntity<?> getChildFolders(
            @RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "parentFolderId", required = false) Long parentFolderId,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileFolderService.children(
                        scopeType,
                        wsId,
                        projId,
                        parentFolderId,
                        getLoginUserId(session)));
    }

    @PostMapping
    public ResponseEntity<?> createFolder(
            @RequestBody Map<String, Object> request,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileFolderService.create(
                        getString(request, "scopeType"),
                        getLong(request, "wsId"),
                        getLong(request, "projId"),
                        getLong(request, "parentFolderId"),
                        getString(request, "name"),
                        getLoginUserId(session)));
    }

    @PatchMapping("/{id}/name")
    public ResponseEntity<?> renameFolder(
            @PathVariable("id") Long folderId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileFolderService.rename(
                        folderId,
                        getString(request, "name"),
                        getLoginUserId(session)));
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<?> moveFolder(
            @PathVariable("id") Long folderId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileFolderService.move(
                        folderId,
                        getLong(request, "parentFolderId"),
                        getLoginUserId(session)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFolder(
            @PathVariable("id") Long folderId,
            HttpSession session) {

        contentFileFolderService.delete(
                folderId,
                getLoginUserId(session));

        return ResponseEntity.ok(Map.of("deleted", true));
    }

    private String getString(Map<String, Object> request, String key) {
        if (request == null || request.get(key) == null) {
            return null;
        }

        return String.valueOf(request.get(key));
    }

    private Long getLong(Map<String, Object> request, String key) {
        if (request == null || request.get(key) == null) {
            return null;
        }

        try {
            return Long.valueOf(String.valueOf(request.get(key)));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Long getLoginUserId(HttpSession session) {
        Object userId = session.getAttribute("loginUserId");

        if (userId == null) {
            userId = session.getAttribute("userId");
        }

        if (userId == null && session.getAttribute("user") instanceof usersDto user) {
            userId = user.getUserId();
        }

        if (userId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        return Long.valueOf(String.valueOf(userId));
    }
}
