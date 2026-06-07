package com.springboot.project.controller;

import java.io.File;
import java.io.IOException;
import java.util.UUID;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IpollService;

@RestController
public class pollController {

    @Autowired
    private IpollService pollService;

    @GetMapping("/api/polls/active")
    public Map<String, Object> getActivePoll(@RequestParam("scope") String scope,
                                             @RequestParam("wsId") Long wsId,
                                             @RequestParam(value = "projId", required = false) Long projId,
                                             HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Long userId = loginUser != null ? loginUser.getUserId() : null;

        Map<String, Object> data = pollService.getActivePoll(scope, wsId, projId, userId);
        return data != null ? data : new HashMap<>();
    }



    @GetMapping("/api/polls/detail")
    public Map<String, Object> getPoll(@RequestParam("pollId") Long pollId,
                                       HttpSession session) {
        usersDto loginUser = (usersDto) session.getAttribute("user");
        Long userId = loginUser != null ? loginUser.getUserId() : null;

        Map<String, Object> data = pollService.getPoll(pollId, userId);
        return data != null ? data : new HashMap<>();
    }

    @GetMapping("/api/polls/list")
    public List<Map<String, Object>> getPollList(@RequestParam("scope") String scope,
                                                 @RequestParam("wsId") Long wsId,
                                                 @RequestParam(value = "projId", required = false) Long projId) {
        return pollService.getPollList(scope, wsId, projId);
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

        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            result.put("success", false);
            result.put("message", "IMAGE_ONLY");
            return result;
        }

        String originalName = image.getOriginalFilename();
        String extension = "";

        if (originalName != null && originalName.lastIndexOf('.') >= 0) {
            extension = originalName.substring(originalName.lastIndexOf('.'));
        }

        String savedName = UUID.randomUUID().toString().replace("-", "") + extension;
        String uploadDir = "C:/MoyoLab.Studio/upload/polls/";
        File directory = new File(uploadDir);

        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("투표 이미지 저장 폴더를 만들 수 없습니다.");
        }

        image.transferTo(new File(directory, savedName));

        result.put("success", true);
        result.put("imagePath", "/upload/polls/" + savedName);
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

        Long pollId = pollService.createPoll(params);

        result.put("success", true);
        result.put("pollId", pollId);
        return result;
    }
}
