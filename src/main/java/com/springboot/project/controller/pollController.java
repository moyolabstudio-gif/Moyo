package com.springboot.project.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.usersDto;
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.service.IpollService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.service.UploadSecurityService;

@RestController
public class pollController {

    @Autowired
    private IpollService pollService;

    @Autowired
    private IworkspaceDAO workspaceDAO;

    @Autowired
    private IprojectAuthorizationService projectAuthorizationService;

    @Autowired
    private UploadSecurityService uploadSecurityService;


    @Value("${moyo.upload.poll-dir:C:/uploads/polls/}")
    private String pollUploadDir;

    @GetMapping("/api/polls/active")
    public Map<String, Object> getActivePoll(@RequestParam("scope") String scope,
                                             @RequestParam("wsId") Long wsId,
                                             @RequestParam(value = "projId", required = false) Long projId,
                                             HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) return Map.of("message", "LOGIN_REQUIRED");
        Long userId = loginUser.getUserId();
        if (!hasRequestedScopeAccess(scope, wsId, projId, userId)) {
            return Map.of("message", "POLL_SCOPE_ACCESS_DENIED");
        }

        Map<String, Object> data = pollService.getActivePoll(scope, wsId, projId, userId);
        return data != null ? data : new HashMap<>();
    }



    @GetMapping("/api/polls/detail")
    public ResponseEntity<?> getPoll(@RequestParam("pollId") Long pollId,
                                     HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "LOGIN_REQUIRED"));
        }

        Map<String, Object> data = pollService.getPoll(pollId, loginUser.getUserId());
        if (data == null || data.isEmpty()) return ResponseEntity.ok(new HashMap<>());
        if (!hasPollScopeAccess(data, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("message", "POLL_SCOPE_ACCESS_DENIED"));
        }
        return ResponseEntity.ok(data);
    }

    @GetMapping("/api/polls/list")
    public ResponseEntity<?> getPollList(@RequestParam("scope") String scope,
                                         @RequestParam("wsId") Long wsId,
                                         @RequestParam(value = "projId", required = false) Long projId,
                                         HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "LOGIN_REQUIRED"));
        }
        if (!hasRequestedScopeAccess(scope, wsId, projId, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("message", "POLL_SCOPE_ACCESS_DENIED"));
        }
        return ResponseEntity.ok(pollService.getPollList(scope, wsId, projId));
    }

    @PostMapping("/api/polls/vote")
    public Map<String, Object> vote(@RequestBody Map<String, Object> params,
                                    HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> result = new HashMap<>();

        if (loginUser == null) {
            result.put("success", false);
            result.put("message", "LOGIN_REQUIRED");
            return result;
        }

        Long pollId = toLong(params.get("pollId"));
        Map<String, Object> poll = pollId == null ? null : pollService.getPoll(pollId, loginUser.getUserId());
        if (poll == null || poll.isEmpty()) {
            result.put("success", false);
            result.put("message", "POLL_NOT_FOUND");
            return result;
        }
        if (!hasPollScopeWriteAccess(poll, loginUser.getUserId())) {
            result.put("success", false);
            result.put("message", "POLL_SCOPE_ACCESS_DENIED");
            return result;
        }

        try {
            params.put("userId", loginUser.getUserId());
            pollService.vote(params);
            result.put("success", true);
        } catch (IllegalStateException | IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }

        return result;
    }


    @PostMapping(value = "/api/polls/option-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadPollOptionImage(
            @RequestPart("image") MultipartFile image,
            HttpSession session) throws IOException {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> result = new HashMap<>();

        if (loginUser == null) {
            result.put("success", false);
            result.put("message", "LOGIN_REQUIRED");
            return result;
        }

        if (image == null || image.isEmpty()) {
            result.put("success", false);
            result.put("message", "EMPTY_FILE");
            return result;
        }

        final String extension;
        try {
            uploadSecurityService.validateImage(image, 10L * 1024L * 1024L, true);
            extension = "." + uploadSecurityService.safeExtension(image.getOriginalFilename());
        } catch (IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            return result;
        }

        String savedName = UUID.randomUUID().toString().replace("-", "") + extension;
        String uploadDir = pollUploadDir;
        File directory = new File(uploadDir);

        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("투표 이미지 저장 폴더를 만들 수 없습니다.");
        }

        image.transferTo(new File(directory, savedName));

        result.put("success", true);
        result.put("imagePath", "/upload/polls/" + savedName);
        return result;
    }


    @PostMapping(value = "/api/polls/option-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadPollOptionMedia(
            @RequestPart("media") MultipartFile media,
            HttpSession session) throws IOException {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> result = new HashMap<>();

        if (loginUser == null) {
            result.put("success", false);
            result.put("message", "LOGIN_REQUIRED");
            return result;
        }
        if (media == null || media.isEmpty()) {
            result.put("success", false);
            result.put("message", "EMPTY_FILE");
            return result;
        }

        String originalName = uploadSecurityService.safeOriginalName(media.getOriginalFilename());
        String mediaExtension = uploadSecurityService.safeExtension(originalName);
        boolean video = java.util.Set.of("mp4", "webm", "mov", "mkv").contains(mediaExtension);
        long maxBytes = video ? 500L * 1024L * 1024L : 100L * 1024L * 1024L;
        try {
            uploadSecurityService.validateAudioVideo(media, maxBytes);
        } catch (IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            return result;
        }
        String extension = "." + mediaExtension;

        String mediaFolder = video ? "video" : "audio";
        String savedName = UUID.randomUUID().toString().replace("-", "") + extension;
        String uploadDir = Path.of(pollUploadDir, mediaFolder).toString() + File.separator;
        File directory = new File(uploadDir);

        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("투표 미디어 저장 폴더를 만들 수 없습니다.");
        }

        media.transferTo(new File(directory, savedName));

        result.put("success", true);
        result.put("mediaType", video ? "VIDEO" : "AUDIO");
        result.put("mediaPath", "/upload/polls/" + mediaFolder + "/" + savedName);
        return result;
    }

    @PostMapping("/api/polls/update")
    public Map<String, Object> updatePoll(@RequestBody Map<String, Object> params,
                                          HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> result = new HashMap<>();

        if (loginUser == null) {
            result.put("success", false);
            result.put("message", "LOGIN_REQUIRED");
            return result;
        }

        Long pollId = toLong(params.get("pollId"));
        Map<String, Object> poll = pollId == null ? null : pollService.getPoll(pollId, loginUser.getUserId());
        if (poll == null || poll.isEmpty() || !hasPollScopeWriteAccess(poll, loginUser.getUserId())) {
            result.put("success", false);
            result.put("message", "POLL_SCOPE_ACCESS_DENIED");
            return result;
        }

        try {
            params.put("userId", loginUser.getUserId());
            pollService.updatePoll(params);
            result.put("success", true);
        } catch (IllegalStateException | IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }

        return result;
    }

    @PostMapping("/api/polls/extend")
    public Map<String, Object> extendPoll(@RequestBody Map<String, Object> params, HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> result = new HashMap<>();
        if (loginUser == null) { result.put("success", false); result.put("message", "LOGIN_REQUIRED"); return result; }

        Long pollId = toLong(params.get("pollId"));
        Map<String, Object> poll = pollId == null ? null : pollService.getPoll(pollId, loginUser.getUserId());
        if (poll == null || poll.isEmpty() || !hasPollScopeWriteAccess(poll, loginUser.getUserId())) {
            result.put("success", false);
            result.put("message", "POLL_SCOPE_ACCESS_DENIED");
            return result;
        }

        try {
            params.put("userId", loginUser.getUserId());
            pollService.extendPoll(params);
            result.put("success", true);
        } catch (IllegalStateException | IllegalArgumentException e) {
            result.put("success", false); result.put("message", e.getMessage());
        }
        return result;
    }

    @PostMapping("/api/polls/delete")
    public Map<String, Object> deletePoll(@RequestBody Map<String, Object> params,
                                          HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Map<String, Object> result = new HashMap<>();

        if (loginUser == null) {
            result.put("success", false);
            result.put("message", "LOGIN_REQUIRED");
            return result;
        }

        try {
            Object pollIdValue = params.get("pollId");
            Long pollId = pollIdValue instanceof Number
                    ? ((Number) pollIdValue).longValue()
                    : Long.valueOf(String.valueOf(pollIdValue));

            Map<String, Object> poll = pollService.getPoll(pollId, loginUser.getUserId());
            if (poll == null || poll.isEmpty() || !hasPollScopeWriteAccess(poll, loginUser.getUserId())) {
                result.put("success", false);
                result.put("message", "POLL_SCOPE_ACCESS_DENIED");
                return result;
            }

            pollService.deletePoll(pollId, loginUser.getUserId());
            result.put("success", true);
        } catch (IllegalStateException | IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }

        return result;
    }

    @PostMapping("/api/polls/create")
    public Map<String, Object> createPoll(@RequestBody Map<String, Object> params,
                                          HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");

        Map<String, Object> result = new HashMap<>();

        if (loginUser == null) {
            result.put("success", false);
            result.put("message", "LOGIN_REQUIRED");
            return result;
        }

        params.put("userId", loginUser.getUserId());

        String scope = mapString(params, "scope", "SCOPE");
        Long wsId = mapLong(params, "wsId", "WS_ID");
        Long projId = mapLong(params, "projId", "PROJ_ID");
        if (!hasRequestedScopeWriteAccess(scope, wsId, projId, loginUser.getUserId())) {
            result.put("success", false);
            result.put("message", "READ_ONLY");
            return result;
        }

        try {
            Long pollId = pollService.createPoll(params);
            result.put("success", true);
            result.put("pollId", pollId);
        } catch (IllegalArgumentException | IllegalStateException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (RuntimeException e) {
            result.put("success", false);
            result.put("message", "투표 생성 중 오류가 발생했습니다. 서버 로그를 확인해주세요.");
        }
        return result;
    }
    private boolean hasRequestedScopeAccess(String scope, Long wsId, Long projId, Long userId) {
        if (userId == null) return false;

        String normalizedScope = scope == null ? "" : scope.trim().toUpperCase();
        if ("PROJECT".equals(normalizedScope)) {
            return projId != null && projectAuthorizationService.canAccessProject(projId, wsId, userId);
        }
        if ("WORKSPACE".equals(normalizedScope)) {
            return wsId != null && workspaceDAO.isWorkspaceMember(wsId, userId) > 0;
        }
        return false;
    }

    private boolean hasRequestedScopeWriteAccess(String scope, Long wsId, Long projId, Long userId) {
        if (!hasRequestedScopeAccess(scope, wsId, projId, userId)) return false;
        String normalizedScope = scope == null ? "" : scope.trim().toUpperCase();
        return !"PROJECT".equals(normalizedScope)
                || projectAuthorizationService.canModifyProjectContent(projId, userId);
    }

    private boolean hasPollScopeAccess(Map<String, Object> poll, Long userId) {
        if (poll == null || poll.isEmpty() || userId == null) return false;
        String scope = mapString(poll, "scope", "SCOPE", "scopeType", "SCOPE_TYPE");
        Long wsId = mapLong(poll, "wsId", "WS_ID");
        Long projId = mapLong(poll, "projId", "PROJ_ID");

        // 과거 데이터는 scope가 비어 있어도 projId/wsId로 스코프를 복원한다.
        if (scope == null || scope.isBlank()) {
            if (projId != null) scope = "PROJECT";
            else if (wsId != null) scope = "WORKSPACE";
        }
        return hasRequestedScopeAccess(scope, wsId, projId, userId);
    }

    private boolean hasPollScopeWriteAccess(Map<String, Object> poll, Long userId) {
        if (poll == null || poll.isEmpty() || userId == null) return false;
        String scope = mapString(poll, "scope", "SCOPE", "scopeType", "SCOPE_TYPE");
        Long wsId = mapLong(poll, "wsId", "WS_ID");
        Long projId = mapLong(poll, "projId", "PROJ_ID");
        if (scope == null || scope.isBlank()) {
            if (projId != null) scope = "PROJECT";
            else if (wsId != null) scope = "WORKSPACE";
        }
        return hasRequestedScopeWriteAccess(scope, wsId, projId, userId);
    }

    private Object mapValue(Map<String, Object> map, String... keys) {
        if (map == null) return null;
        for (String key : keys) {
            if (map.containsKey(key) && map.get(key) != null) return map.get(key);
        }
        return null;
    }

    private Long mapLong(Map<String, Object> map, String... keys) {
        return toLong(mapValue(map, keys));
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value == null || String.valueOf(value).isBlank()) return null;
        try { return Long.valueOf(String.valueOf(value)); }
        catch (NumberFormatException e) { return null; }
    }

    private String mapString(Map<String, Object> map, String... keys) {
        Object value = mapValue(map, keys);
        return value == null ? null : String.valueOf(value);
    }

}
