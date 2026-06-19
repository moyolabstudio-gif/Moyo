package com.springboot.project.controller;

import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IcontentShareService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/share/api")
public class contentShareController {

    @Autowired
    private IcontentShareService contentShareService;

    @GetMapping("/targets")
    public Map<String, Object> targets(@RequestParam("contentType") String contentType,
                                       @RequestParam("contentId") Long contentId,
                                       @RequestParam(value = "keyword", required = false) String keyword,
                                       HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        try {
            result.putAll(contentShareService.getTargets(contentType, contentId, user.getUserId(), keyword));
            result.put("success", true);
            return result;
        } catch (RuntimeException e) {
            return fail(e.getMessage());
        }
    }

    @PostMapping("/save")
    public Map<String, Object> save(@RequestParam("contentType") String contentType,
                                    @RequestParam("contentId") Long contentId,
                                    @RequestParam("targetType") String targetType,
                                    @RequestParam("targetId") Long targetId,
                                    @RequestParam(value = "permissionType", defaultValue = "VIEW") String permissionType,
                                    HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        try {
            contentShareDTO share = new contentShareDTO();
            share.setContentType(contentType);
            share.setContentId(contentId);
            share.setTargetType(targetType);
            share.setTargetId(targetId);
            share.setPermissionType(permissionType);
            Map<String, Object> result = new HashMap<>();
            result.put("success", contentShareService.saveShare(share, user.getUserId()));
            return result;
        } catch (RuntimeException e) {
            return fail(e.getMessage());
        }
    }

    @PostMapping("/delete")
    public Map<String, Object> delete(@RequestParam("shareId") Long shareId, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        Map<String, Object> result = new HashMap<>();
        result.put("success", contentShareService.removeShare(shareId, user.getUserId()));
        if (!(Boolean) result.get("success")) result.put("message", "공유를 해제하지 못했습니다.");
        return result;
    }

    private usersDto getLoginUser(HttpSession session) {
        Object value = session == null ? null : session.getAttribute("user");
        return value instanceof usersDto ? (usersDto) value : null;
    }

    private Map<String, Object> fail(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", message == null ? "요청을 처리하지 못했습니다." : message);
        return result;
    }
}
