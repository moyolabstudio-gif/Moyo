package com.springboot.project.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.springboot.project.dto.postDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IboardService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.service.WorkspaceAuthorizationService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Controller
public class fileDownloadController {

    private final Path boardUploadRoot;

    private final IboardService boardService;
    private final WorkspaceAuthorizationService workspaceAuthorizationService;
    private final IprojectAuthorizationService projectAuthorizationService;

    public fileDownloadController(IboardService boardService,
                                  WorkspaceAuthorizationService workspaceAuthorizationService,
                                  IprojectAuthorizationService projectAuthorizationService,
                                  @Value("${moyo.upload.board-dir:C:/uploads/board/}") String boardUploadDir) {
        this.boardService = boardService;
        this.workspaceAuthorizationService = workspaceAuthorizationService;
        this.projectAuthorizationService = projectAuthorizationService;
        this.boardUploadRoot = Paths.get(boardUploadDir).toAbsolutePath().normalize();
    }

    @GetMapping("/download")
    public void downloadFile(@RequestParam("fileId") String fileId,
                             HttpSession session,
                             HttpServletResponse response) throws Exception {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        Map<String, Object> fileInfo = boardService.getFileInfo(fileId);
        if (fileInfo == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "파일 정보를 찾을 수 없습니다.");
            return;
        }

        Long postId = toLong(fileInfo.get("POST_ID"));
        if (postId == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "파일의 게시글 정보를 찾을 수 없습니다.");
            return;
        }

        postDTO post = boardService.getPostDetail(postId.intValue());
        if (post == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "게시글을 찾을 수 없습니다.");
            return;
        }

        Long userId = loginUser.getUserId();
        boolean allowed;
        if (post.getProjId() != null) {
            allowed = projectAuthorizationService.canAccessProject(post.getProjId(), post.getWsId(), userId);
        } else if (post.getWsId() != null) {
            allowed = workspaceAuthorizationService.isMember(post.getWsId(), userId);
        } else {
            allowed = post.getUserId() != null && post.getUserId().equals(userId);
        }

        if (!allowed) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "이 파일에 접근할 권한이 없습니다.");
            return;
        }

        String savedFileName = stringValue(fileInfo.get("FILE_NAME"));
        String originalName = stringValue(fileInfo.get("FILE_ORIGINAL_NAME"));
        Path filePath;
        try {
            filePath = resolveBoardAttachment(savedFileName);
        } catch (SecurityException e) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "허용되지 않은 파일 경로입니다.");
            return;
        }
        if (!Files.isRegularFile(filePath)) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "실제 파일이 서버에 존재하지 않습니다.");
            return;
        }

        response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setContentLengthLong(Files.size(filePath));
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Cache-Control", "private, no-store");

        String downloadName = originalName == null || originalName.isBlank() ? savedFileName : originalName;
        String encodedName = URLEncoder.encode(downloadName, StandardCharsets.UTF_8).replace("+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encodedName);

        try (FileInputStream fis = new FileInputStream(filePath.toFile());
             OutputStream os = response.getOutputStream()) {
            fis.transferTo(os);
        }
    }

    private Path resolveBoardAttachment(String savedFileName) {
        if (savedFileName == null || savedFileName.isBlank()
                || savedFileName.contains("..")
                || savedFileName.contains("/")
                || savedFileName.contains("\\")) {
            throw new SecurityException("잘못된 파일 경로입니다.");
        }
        Path resolved = boardUploadRoot.resolve(savedFileName).normalize();
        if (!resolved.startsWith(boardUploadRoot)) {
            throw new SecurityException("허용되지 않은 파일 경로입니다.");
        }
        return resolved;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value == null) return null;
        try { return Long.valueOf(String.valueOf(value)); }
        catch (NumberFormatException e) { return null; }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
