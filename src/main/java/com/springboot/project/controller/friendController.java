package com.springboot.project.controller;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IfriendService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/friends")
public class friendController {
    @Autowired
    private IfriendService friendService;

    @GetMapping("")
    public String friendPage(HttpSession session, Model model) {
        usersDto user = getLoginUser(session);
        if (user == null) return "redirect:/users/loginForm";
        model.addAttribute("pendingFriendCount", friendService.getPendingReceivedCount(user.getUserId()));
        return "friend/friendList";
    }

    @GetMapping("/api/search")
    @ResponseBody
    public Map<String, Object> search(@RequestParam(value = "keyword", required = false) String keyword, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        Map<String, Object> result = ok();
        result.put("users", friendService.searchUsers(user.getUserId(), keyword));
        return result;
    }

    @GetMapping("/api/list")
    @ResponseBody
    public Map<String, Object> list(@RequestParam(value = "keyword", required = false) String keyword, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        Map<String, Object> result = ok();
        result.put("friends", friendService.getFriends(user.getUserId(), keyword));
        return result;
    }

    @GetMapping("/api/requests")
    @ResponseBody
    public Map<String, Object> requests(HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        Map<String, Object> result = ok();
        result.put("received", friendService.getReceivedRequests(user.getUserId()));
        result.put("sent", friendService.getSentRequests(user.getUserId()));
        result.put("pendingCount", friendService.getPendingReceivedCount(user.getUserId()));
        return result;
    }

    @GetMapping("/api/count")
    @ResponseBody
    public Map<String, Object> count(HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        Map<String, Object> result = ok();
        result.put("pendingCount", friendService.getPendingReceivedCount(user.getUserId()));
        return result;
    }

    @PostMapping("/api/request")
    @ResponseBody
    public Map<String, Object> request(@RequestParam("targetUserId") Long targetUserId, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        return friendService.requestFriend(user.getUserId(), targetUserId);
    }

    @PostMapping("/api/accept")
    @ResponseBody
    public Map<String, Object> accept(@RequestParam("friendId") Long friendId, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        return friendService.acceptRequest(user.getUserId(), friendId);
    }

    @PostMapping("/api/reject")
    @ResponseBody
    public Map<String, Object> reject(@RequestParam("friendId") Long friendId, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        return friendService.rejectRequest(user.getUserId(), friendId);
    }

    @PostMapping("/api/cancel")
    @ResponseBody
    public Map<String, Object> cancel(@RequestParam("friendId") Long friendId, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        return friendService.cancelRequest(user.getUserId(), friendId);
    }

    @PostMapping("/api/delete")
    @ResponseBody
    public Map<String, Object> delete(@RequestParam("friendId") Long friendId, HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return fail("로그인이 필요합니다.");
        return friendService.deleteFriend(user.getUserId(), friendId);
    }

    private usersDto getLoginUser(HttpSession session) {
        Object value = session == null ? null : session.getAttribute("user");
        return value instanceof usersDto ? (usersDto) value : null;
    }

    private Map<String, Object> ok() {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }

    private Map<String, Object> fail(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", message);
        return result;
    }
}
