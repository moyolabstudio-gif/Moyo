package com.springboot.project.controller;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IcontentFileExplorerDAO;
import com.springboot.project.dao.IcontentFileFolderDAO;
import com.springboot.project.dao.IcontentRecordDAO;
import com.springboot.project.dto.contentFileDTO;
import com.springboot.project.dto.contentFileFolderDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IcontentFileService;
import com.springboot.project.service.contentFileFolderService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/file-explorer")
public class contentFileExplorerController {

    private final IcontentFileExplorerDAO contentFileExplorerDAO;
    private final IcontentFileFolderDAO contentFileFolderDAO;
    private final IcontentRecordDAO contentRecordDAO;
    private final IcontentFileService contentFileService;
    private final contentFileFolderService contentFileFolderService;

    public contentFileExplorerController(
            IcontentFileExplorerDAO contentFileExplorerDAO,
            IcontentFileFolderDAO contentFileFolderDAO,
            IcontentRecordDAO contentRecordDAO,
            IcontentFileService contentFileService,
            contentFileFolderService contentFileFolderService) {
        this.contentFileExplorerDAO = contentFileExplorerDAO;
        this.contentFileFolderDAO = contentFileFolderDAO;
        this.contentRecordDAO = contentRecordDAO;
        this.contentFileService = contentFileService;
        this.contentFileFolderService = contentFileFolderService;
    }

    @GetMapping("/items")
    public ResponseEntity<?> getItems(
            @RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "sort", defaultValue = "NAME_ASC") String sort,
            HttpSession session) {

        Long userId = getLoginUserId(session);
        FileScope scope = resolveScope(scopeType, wsId, projId, userId);

        validateFolder(folderId, scope);

        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        return ResponseEntity.ok(Map.of(
                "items",
                contentFileExplorerDAO.selectFiles(
                        scope.type(),
                        scope.ownerUserId(),
                        scope.wsId(),
                        scope.projId(),
                        folderId,
                        normalizedKeyword,
                        sort,
                        userId)));
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentFiles(
            @RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session) {
        Long userId = getLoginUserId(session);
        FileScope scope = resolveScope(scopeType, wsId, projId, userId);
        return ResponseEntity.ok(Map.of("items", contentFileExplorerDAO.selectRecentFiles(
                userId, scope.type(), scope.ownerUserId(), scope.wsId(), scope.projId())));
    }

    @GetMapping("/friend-shares/owners")
    public ResponseEntity<?> getFriendShareOwners(HttpSession session) {
        Long userId = getLoginUserId(session);
        return ResponseEntity.ok(Map.of("items", contentFileExplorerDAO.selectFriendShareOwners(userId)));
    }

    @GetMapping("/friend-shares/files")
    public ResponseEntity<?> getFriendSharedFiles(
            @RequestParam("ownerId") Long ownerId,
            HttpSession session) {
        Long userId = getLoginUserId(session);
        return ResponseEntity.ok(Map.of("items", contentFileExplorerDAO.selectFriendSharedFiles(userId, ownerId)));
    }

    @PostMapping("/files/{id}/access")
    public ResponseEntity<?> touchAccess(@PathVariable("id") Long contentFileId, HttpSession session) {
        Long userId = getLoginUserId(session);
        contentFileService.getAccessibleFile(contentFileId, userId);
        contentFileExplorerDAO.touchRecentAccess(contentFileId, userId);
        return ResponseEntity.ok(Map.of("recorded", true));
    }

    @PostMapping(value = "/batch", consumes = "multipart/form-data")
    @Transactional
    public ResponseEntity<?> uploadFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            HttpSession session) {

        Long userId = getLoginUserId(session);
        FileScope scope = resolveScope(scopeType, wsId, projId, userId);

        validateFolder(folderId, scope);

        List<contentFileDTO> savedFiles = new java.util.ArrayList<>();

        for (MultipartFile multipartFile : files) {
            contentFileDTO savedFile = contentFileService.upload(
                    multipartFile,
                    scope.type(),
                    scope.wsId(),
                    scope.projId(),
                    null,
                    userId);

            contentFileExplorerDAO.updateFolder(
                    savedFile.getContentFileId(),
                    folderId,
                    userId);
            savedFile.setFolderId(folderId);
            savedFiles.add(savedFile);
        }

        return ResponseEntity.ok(savedFiles);
    }

    @PatchMapping("/files/{id}/move")
    @Transactional
    public ResponseEntity<?> moveFile(
            @PathVariable("id") Long contentFileId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {

        Long userId = getLoginUserId(session);
        Long folderId = toLong(request.get("folderId"));

        contentFileDTO file = contentFileService.getAccessibleFile(contentFileId, userId);
        FileScope scope = resolveScope(
                file.getScopeType(),
                file.getWsId(),
                file.getProjId(),
                userId);

        validateFolder(folderId, scope);
        contentFileExplorerDAO.updateFolder(contentFileId, folderId, userId);

        return ResponseEntity.ok(Map.of("moved", true));
    }


    @PatchMapping("/move")
    @Transactional
    public ResponseEntity<?> moveItems(
            @RequestBody Map<String, Object> request,
            HttpSession session) {

        Long userId = getLoginUserId(session);
        Long targetFolderId = toLong(request.get("folderId"));
        List<Long> fileIds = toLongList(request.get("fileIds"));
        List<Long> folderIds = toLongList(request.get("folderIds"));

        FileScope targetScope = resolveScope(
                String.valueOf(request.get("scopeType")),
                toLong(request.get("wsId")),
                toLong(request.get("projId")),
                userId);
        validateFolder(targetFolderId, targetScope);

        for (Long contentFileId : fileIds) {
            contentFileDTO file = contentFileService.getAccessibleFile(contentFileId, userId);
            FileScope fileScope = resolveScope(file.getScopeType(), file.getWsId(), file.getProjId(), userId);
            if (!sameScope(fileScope, targetScope)) {
                throw new SecurityException("다른 자료실의 파일은 이동할 수 없습니다.");
            }
            contentFileExplorerDAO.updateFolder(contentFileId, targetFolderId, userId);
        }

        for (Long folderId : folderIds) {
            contentFileFolderDTO folder = contentFileFolderDAO.selectById(folderId);
            if (folder == null) {
                throw new IllegalArgumentException("이동할 폴더를 찾을 수 없습니다.");
            }
            FileScope folderScope = resolveScope(folder.getScopeType(), folder.getWsId(), folder.getProjId(), userId);
            if (!sameScope(folderScope, targetScope)) {
                throw new SecurityException("다른 자료실의 폴더는 이동할 수 없습니다.");
            }
            contentFileFolderService.move(folderId, targetFolderId, userId);
        }

        return ResponseEntity.ok(Map.of(
                "moved", true,
                "fileCount", fileIds.size(),
                "folderCount", folderIds.size()));
    }

    private void validateFolder(Long folderId, FileScope scope) {
        if (folderId == null) {
            return;
        }

        contentFileFolderDTO folder = contentFileFolderDAO.selectById(folderId);

        boolean sameScope = folder != null
                && Objects.equals(folder.getScopeType(), scope.type())
                && Objects.equals(folder.getOwnerUserId(), scope.ownerUserId())
                && Objects.equals(folder.getWsId(), scope.wsId())
                && Objects.equals(folder.getProjId(), scope.projId());

        if (!sameScope) {
            throw new SecurityException("다른 자료실의 폴더입니다.");
        }
    }

    private FileScope resolveScope(
            String rawScopeType,
            Long wsId,
            Long projId,
            Long userId) {

        String scopeType = String.valueOf(rawScopeType)
                .trim()
                .toUpperCase(Locale.ROOT);

        if ("PERSONAL".equals(scopeType)) {
            return new FileScope(scopeType, userId, null, null);
        }

        if ("GROUP".equals(scopeType)
                && wsId != null
                && contentRecordDAO.countWorkspaceMember(wsId, userId) > 0) {
            return new FileScope(scopeType, null, wsId, null);
        }

        if ("PROJECT".equals(scopeType)
                && projId != null
                && contentRecordDAO.countProjectAccessibleMember(projId, userId) > 0) {
            return new FileScope(scopeType, null, null, projId);
        }

        throw new SecurityException("자료실 접근 권한이 없습니다.");
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


    private boolean sameScope(FileScope left, FileScope right) {
        return Objects.equals(left.type(), right.type())
                && Objects.equals(left.ownerUserId(), right.ownerUserId())
                && Objects.equals(left.wsId(), right.wsId())
                && Objects.equals(left.projId(), right.projId());
    }

    private List<Long> toLongList(Object value) {
        if (!(value instanceof List<?> values)) {
            return List.of();
        }
        return values.stream()
                .map(this::toLong)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private record FileScope(
            String type,
            Long ownerUserId,
            Long wsId,
            Long projId) {
    }
}
