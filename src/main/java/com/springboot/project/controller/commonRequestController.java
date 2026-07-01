package com.springboot.project.controller;

import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.service.IcontentShareService;
import com.springboot.project.service.IworkspaceService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class commonRequestController {

    @Autowired
    private IworkspaceService workspaceService;

    @Autowired
    private IcontentShareService contentShareService;

    @GetMapping("/requests")
    public String requestsPage(HttpSession session, Model model) {
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) return "redirect:/login";

        List<Map<String, Object>> inviteList = workspaceService.getPendingInvitations(user.getUserId());
        int shareRequestCount = contentShareService.countPendingShareRequests(user.getUserId());
        int inviteRequestCount = inviteList == null ? 0 : inviteList.size();

        model.addAttribute("inviteList", inviteList);
        model.addAttribute("receivedShareRequests", contentShareService.getReceivedShareRequests(user.getUserId()));
        model.addAttribute("sentShareRequests", contentShareService.getSentShareRequests(user.getUserId()));
        model.addAttribute("shareRequestCount", shareRequestCount);
        model.addAttribute("inviteRequestCount", inviteRequestCount);
        model.addAttribute("totalPendingRequestCount", shareRequestCount + inviteRequestCount);
        model.addAttribute("accountDisplayName", user.getUSER_NAME() == null ? "" : user.getUSER_NAME());
        model.addAttribute("accountEmail", user.getEMAIL() == null ? "" : user.getEMAIL());

        return "common/requests";
    }


    @GetMapping("/requests/api/pending")
    @ResponseBody
    public Map<String, Object> pendingRequests(HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("success", true);
            result.put("items", new ArrayList<>());
            result.put("count", 0);
            return result;
        }

        List<Map<String, Object>> items = new ArrayList<>();

        List<contentShareDTO> shareRequests = contentShareService.getReceivedShareRequests(user.getUserId());
        if (shareRequests != null) {
            for (contentShareDTO share : shareRequests) {
                String status = share.getShareStatus();
                if (!"PENDING".equals(status)) continue;

                Map<String, Object> item = new HashMap<>();
                item.put("requestType", "SHARE");
                item.put("id", share.getShareId());
                item.put("shareId", share.getShareId());
                item.put("contentType", share.getContentType());
                item.put("title", share.getContentTitle());
                item.put("contentTitle", share.getContentTitle());
                item.put("requesterName", share.getRequesterName());
                item.put("targetName", share.getTargetName());
                item.put("targetType", share.getTargetType());
                item.put("permissionType", share.getPermissionType());
                item.put("createdAt", share.getCreatedAt());
                items.add(item);
            }
        }

        List<Map<String, Object>> invites = workspaceService.getPendingInvitations(user.getUserId());
        if (invites != null) {
            for (Map<String, Object> invite : invites) {
                Map<String, Object> item = new HashMap<>();
                item.put("requestType", "GROUP_INVITE");
                item.put("id", value(invite, "inviteId", "INVITE_ID"));
                item.put("inviteId", value(invite, "inviteId", "INVITE_ID"));
                item.put("title", stringValue(invite, "wsName", "WS_NAME"));
                item.put("wsName", stringValue(invite, "wsName", "WS_NAME"));
                item.put("requesterName", stringValue(invite, "inviterName", "INVITER_NAME"));
                item.put("createdAt", value(invite, "sentAt", "SENT_AT"));
                items.add(item);
            }
        }

        result.put("success", true);
        result.put("items", items);
        result.put("count", items.size());
        return result;
    }

    private Object value(Map<String, Object> map, String... keys) {
        if (map == null || keys == null) return null;
        for (String key : keys) {
            if (map.containsKey(key)) return map.get(key);
        }
        return null;
    }

    private String stringValue(Map<String, Object> map, String... keys) {
        Object v = value(map, keys);
        return v == null ? "" : String.valueOf(v);
    }

    @GetMapping("/requests/api/count")
    @ResponseBody
    public Map<String, Object> requestCount(HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        usersDto user = (usersDto) session.getAttribute("user");
        if (user == null) {
            result.put("count", 0);
            result.put("shareCount", 0);
            result.put("inviteCount", 0);
            return result;
        }

        int shareCount = contentShareService.countPendingShareRequests(user.getUserId());
        List<Map<String, Object>> invites = workspaceService.getPendingInvitations(user.getUserId());
        int inviteCount = invites == null ? 0 : invites.size();

        result.put("count", shareCount + inviteCount);
        result.put("shareCount", shareCount);
        result.put("inviteCount", inviteCount);
        return result;
    }

}
