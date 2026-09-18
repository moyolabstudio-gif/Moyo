package com.springboot.project.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.contentFileDTO;
import com.springboot.project.dto.contentFileFolderDTO;
import com.springboot.project.dao.IcontentFileExplorerDAO;
import com.springboot.project.dao.IcontentFileFolderDAO;
import com.springboot.project.dao.IcontentRecordDAO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IcontentFileService;
import com.springboot.project.service.contentFileFolderService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/files")
public class contentFileController {

    private final IcontentFileService contentFileService;
    private final IcontentFileExplorerDAO contentFileExplorerDAO;
    private final IcontentFileFolderDAO contentFileFolderDAO;
    private final IcontentRecordDAO contentRecordDAO;
    private final contentFileFolderService contentFileFolderService;

    public contentFileController(
            IcontentFileService contentFileService,
            IcontentFileExplorerDAO contentFileExplorerDAO,
            IcontentFileFolderDAO contentFileFolderDAO,
            IcontentRecordDAO contentRecordDAO,
            contentFileFolderService contentFileFolderService) {
        this.contentFileService = contentFileService;
        this.contentFileExplorerDAO = contentFileExplorerDAO;
        this.contentFileFolderDAO = contentFileFolderDAO;
        this.contentRecordDAO = contentRecordDAO;
        this.contentFileFolderService = contentFileFolderService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "scopeType", defaultValue = "PERSONAL") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "description", required = false) String description,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileService.upload(
                        file,
                        scopeType,
                        wsId,
                        projId,
                        description,
                        getLoginUserId(session)));
    }

    @PostMapping(value = "/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> uploadBatch(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "description", required = false) String description,
            HttpSession session) {

        Long userId = getLoginUserId(session);
        FileScope scope = resolveScope(scopeType, wsId, projId, userId);
        validateFolder(folderId, scope);

        List<contentFileDTO> savedFiles = new ArrayList<>();
        if (files != null) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                contentFileDTO savedFile = contentFileService.upload(
                        file, scope.type(), scope.wsId(), scope.projId(), description, userId);
                contentFileExplorerDAO.updateFolder(savedFile.getContentFileId(), folderId, userId);
                savedFile.setFolderId(folderId);
                savedFiles.add(savedFile);
            }
        }
        return ResponseEntity.ok(savedFiles);
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(value = "scopeType", defaultValue = "PERSONAL") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileService.getFiles(
                        scopeType,
                        wsId,
                        projId,
                        getLoginUserId(session)));
    }

    @GetMapping("/page")
    public ResponseEntity<?> page(
            @RequestParam("scopeType") String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fileType", defaultValue = "ALL") String fileType,
            @RequestParam(value = "sort", defaultValue = "LATEST") String sort,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            HttpSession session) {

        return ResponseEntity.ok(
                contentFileService.getFilePage(
                        scopeType,
                        wsId,
                        projId,
                        keyword,
                        fileType,
                        sort,
                        page,
                        size,
                        getLoginUserId(session)));
    }

    @GetMapping("/owned")
    public ResponseEntity<?> owned(HttpSession session) {
        return ResponseEntity.ok(
                contentFileService.getOwnedFiles(getLoginUserId(session)));
    }

    @GetMapping("/items")
    public ResponseEntity<?> explorerItems(
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
        return ResponseEntity.ok(Map.of("items", contentFileExplorerDAO.selectFiles(
                scope.type(), scope.ownerUserId(), scope.wsId(), scope.projId(),
                folderId, normalizedKeyword, sort, userId)));
    }

    @GetMapping("/recent")
    public ResponseEntity<?> recent(
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
    public ResponseEntity<?> friendShareOwners(HttpSession session) {
        return ResponseEntity.ok(Map.of("items",
                contentFileExplorerDAO.selectFriendShareOwners(getLoginUserId(session))));
    }

    @GetMapping("/friend-shares/files")
    public ResponseEntity<?> friendSharedFiles(
            @RequestParam("ownerId") Long ownerId,
            HttpSession session) {
        return ResponseEntity.ok(Map.of("items",
                contentFileExplorerDAO.selectFriendSharedFiles(getLoginUserId(session), ownerId)));
    }

    @PostMapping("/{contentFileId}/access")
    public ResponseEntity<?> touchAccess(
            @PathVariable("contentFileId") Long contentFileId,
            HttpSession session) {
        Long userId = getLoginUserId(session);
        contentFileService.getAccessibleFile(contentFileId, userId);
        contentFileExplorerDAO.touchRecentAccess(contentFileId, userId);
        return ResponseEntity.ok(Map.of("recorded", true));
    }

    @PatchMapping("/{contentFileId}/move")
    @Transactional
    public ResponseEntity<?> moveFile(
            @PathVariable("contentFileId") Long contentFileId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        Long userId = getLoginUserId(session);
        Long folderId = toLong(request.get("folderId"));
        contentFileDTO file = contentFileService.getAccessibleFile(contentFileId, userId);
        FileScope scope = resolveScope(file.getScopeType(), file.getWsId(), file.getProjId(), userId);
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
                toLong(request.get("projId")), userId);
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
                "moved", true, "fileCount", fileIds.size(), "folderCount", folderIds.size()));
    }

    @GetMapping("/{contentFileId}")
    public ResponseEntity<?> metadata(
            @PathVariable("contentFileId") Long contentFileId,
            HttpSession session) {

        Long userId = getLoginUserId(session);
        contentFileDTO file = contentFileService.getAccessibleFile(contentFileId, userId);
        contentFileExplorerDAO.touchRecentAccess(contentFileId, userId);
        return ResponseEntity.ok(file);
    }

    @GetMapping("/{contentFileId}/download")
    public ResponseEntity<InputStreamResource> download(
            @PathVariable("contentFileId") Long contentFileId,
            HttpSession session) throws Exception {

        Long userId = getLoginUserId(session);
        contentFileDTO file = contentFileService.getAccessibleFile(contentFileId, userId);
        contentFileExplorerDAO.touchRecentAccess(contentFileId, userId);
        Path path = contentFileService.getAccessiblePath(contentFileId, userId);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(file.getOriginalName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(Files.size(path))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(new InputStreamResource(Files.newInputStream(path)));
    }

    @PostMapping("/download-batch")
    public ResponseEntity<byte[]> downloadBatch(
            @RequestBody Map<String, Object> request,
            HttpSession session) throws IOException {

        Long userId = getLoginUserId(session);
        List<Long> fileIds = toLongList(request.get("fileIds"));
        List<Long> folderIds = toLongList(request.get("folderIds"));
        if (fileIds.isEmpty() && folderIds.isEmpty()) {
            throw new IllegalArgumentException("다운로드할 항목을 선택해 주세요.");
        }

        FileScope scope = resolveScope(
                String.valueOf(request.getOrDefault("scopeType", "PERSONAL")),
                toLong(request.get("wsId")),
                toLong(request.get("projId")),
                userId);

        List<contentFileFolderDTO> tree = contentFileFolderDAO.selectTree(
                scope.type(), scope.ownerUserId(), scope.wsId(), scope.projId());
        Map<Long, contentFileFolderDTO> foldersById = new HashMap<>();
        Map<Long, List<contentFileFolderDTO>> childrenByParent = new HashMap<>();
        for (contentFileFolderDTO folder : tree) {
            foldersById.put(folder.getFolderId(), folder);
            childrenByParent.computeIfAbsent(folder.getParentFolderId(), key -> new ArrayList<>()).add(folder);
        }

        for (Long folderId : folderIds) {
            contentFileFolderDTO folder = foldersById.get(folderId);
            if (folder == null) {
                throw new IllegalArgumentException("다운로드할 폴더를 찾을 수 없습니다.");
            }
            FileScope folderScope = resolveScope(folder.getScopeType(), folder.getWsId(), folder.getProjId(), userId);
            if (!sameScope(folderScope, scope)) {
                throw new SecurityException("다른 자료실의 폴더는 다운로드할 수 없습니다.");
            }
        }

        Set<Long> writtenFileIds = new HashSet<>();
        Set<String> writtenEntries = new LinkedHashSet<>();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            for (Long fileId : fileIds) {
                addFileToZip(zip, fileId, "", userId, writtenFileIds, writtenEntries);
            }
            for (Long folderId : folderIds) {
                contentFileFolderDTO folder = foldersById.get(folderId);
                addFolderToZip(zip, folder, "", scope, childrenByParent, userId, writtenFileIds, writtenEntries);
            }
        }

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("MOYO_선택자료.zip", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .contentLength(output.size())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(output.toByteArray());
    }

    @PatchMapping("/{contentFileId}/name")
    public ResponseEntity<?> rename(
            @PathVariable("contentFileId") Long contentFileId,
            @RequestBody(required = false) Map<String, Object> body,
            HttpSession session) {

        String name = body == null
                ? null
                : String.valueOf(body.getOrDefault("name", ""));

        return ResponseEntity.ok(
                contentFileService.rename(
                        contentFileId,
                        name,
                        getLoginUserId(session)));
    }

    @PatchMapping("/{contentFileId}")
    public ResponseEntity<?> update(
            @PathVariable("contentFileId") Long contentFileId,
            @RequestBody(required = false) Map<String, Object> body,
            HttpSession session) {

        String name = body == null
                ? null
                : String.valueOf(body.getOrDefault("name", ""));

        String description = body == null || body.get("description") == null
                ? null
                : String.valueOf(body.get("description"));

        return ResponseEntity.ok(
                contentFileService.updateMetadata(
                        contentFileId,
                        name,
                        description,
                        getLoginUserId(session)));
    }

    @DeleteMapping("/{contentFileId}")
    public ResponseEntity<?> delete(
            @PathVariable("contentFileId") Long contentFileId,
            HttpSession session) {

        contentFileService.deleteStandalone(
                contentFileId,
                getLoginUserId(session));

        return ResponseEntity.ok(
                Map.of(
                        "deleted", true,
                        "contentFileId", contentFileId));
    }

    private void addFolderToZip(
            ZipOutputStream zip,
            contentFileFolderDTO folder,
            String parentPath,
            FileScope scope,
            Map<Long, List<contentFileFolderDTO>> childrenByParent,
            Long userId,
            Set<Long> writtenFileIds,
            Set<String> writtenEntries) throws IOException {

        String folderName = safeZipName(folder.getFolderName(), "폴더");
        String folderPath = uniqueZipPath(parentPath + folderName + "/", writtenEntries);
        zip.putNextEntry(new ZipEntry(folderPath));
        zip.closeEntry();

        List<contentFileDTO> files = contentFileExplorerDAO.selectFiles(
                scope.type(), scope.ownerUserId(), scope.wsId(), scope.projId(),
                folder.getFolderId(), "", "NAME_ASC", userId);
        for (contentFileDTO file : files) {
            addFileToZip(zip, file.getContentFileId(), folderPath, userId, writtenFileIds, writtenEntries);
        }
        for (contentFileFolderDTO child : childrenByParent.getOrDefault(folder.getFolderId(), List.of())) {
            addFolderToZip(zip, child, folderPath, scope, childrenByParent, userId, writtenFileIds, writtenEntries);
        }
    }

    private void addFileToZip(
            ZipOutputStream zip,
            Long contentFileId,
            String parentPath,
            Long userId,
            Set<Long> writtenFileIds,
            Set<String> writtenEntries) throws IOException {

        if (!writtenFileIds.add(contentFileId)) {
            return;
        }
        contentFileDTO file = contentFileService.getAccessibleFile(contentFileId, userId);
        Path path = contentFileService.getAccessiblePath(contentFileId, userId);
        String originalName = file.getDisplayName();
        if (originalName == null || originalName.isBlank()) {
            originalName = file.getOriginalName();
        }
        String entryName = uniqueZipPath(parentPath + safeZipName(originalName, "파일"), writtenEntries);
        zip.putNextEntry(new ZipEntry(entryName));
        Files.copy(path, zip);
        zip.closeEntry();
        contentFileExplorerDAO.touchRecentAccess(contentFileId, userId);
    }

    private String uniqueZipPath(String requestedPath, Set<String> writtenEntries) {
        String candidate = requestedPath;
        boolean directory = candidate.endsWith("/");
        String base = directory ? candidate.substring(0, candidate.length() - 1) : candidate;
        String extension = "";
        if (!directory) {
            int slash = base.lastIndexOf('/');
            int dot = base.lastIndexOf('.');
            if (dot > slash) {
                extension = base.substring(dot);
                base = base.substring(0, dot);
            }
        }
        int sequence = 2;
        while (!writtenEntries.add(candidate)) {
            candidate = base + " (" + sequence++ + ")" + extension + (directory ? "/" : "");
        }
        return candidate;
    }

    private String safeZipName(String value, String fallback) {
        String name = value == null ? "" : value.trim();
        if (name.isEmpty()) {
            name = fallback;
        }
        return name.replace('\\', '_').replace('/', '_').replace("..", "_");
    }

    private void validateFolder(Long folderId, FileScope scope) {
        if (folderId == null) {
            return;
        }
        contentFileFolderDTO folder = contentFileFolderDAO.selectById(folderId);
        boolean valid = folder != null
                && Objects.equals(folder.getScopeType(), scope.type())
                && Objects.equals(folder.getOwnerUserId(), scope.ownerUserId())
                && Objects.equals(folder.getWsId(), scope.wsId())
                && Objects.equals(folder.getProjId(), scope.projId());
        if (!valid) {
            throw new SecurityException("다른 자료실의 폴더입니다.");
        }
    }

    private FileScope resolveScope(String rawScopeType, Long wsId, Long projId, Long userId) {
        String scopeType = String.valueOf(rawScopeType).trim().toUpperCase(Locale.ROOT);
        if ("PERSONAL".equals(scopeType)) {
            return new FileScope(scopeType, userId, null, null);
        }
        if ("GROUP".equals(scopeType) && wsId != null
                && contentRecordDAO.countWorkspaceMember(wsId, userId) > 0) {
            return new FileScope(scopeType, null, wsId, null);
        }
        if ("PROJECT".equals(scopeType) && projId != null
                && contentRecordDAO.countProjectAccessibleMember(projId, userId) > 0) {
            return new FileScope(scopeType, null, null, projId);
        }
        throw new SecurityException("자료실 접근 권한이 없습니다.");
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
        return values.stream().map(this::toLong).filter(Objects::nonNull).distinct().toList();
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

    private record FileScope(String type, Long ownerUserId, Long wsId, Long projId) { }

    private MediaType resolveMediaType(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }

        try {
            return MediaType.parseMediaType(mimeType);
        } catch (IllegalArgumentException e) {
            return MediaType.APPLICATION_OCTET_STREAM;
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
