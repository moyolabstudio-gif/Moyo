package com.springboot.project.service.impl;

import com.springboot.project.dao.IfriendDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.friendDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IfriendService;
import com.springboot.project.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class friendServiceImpl implements IfriendService {
    @Autowired
    private IfriendDAO friendDAO;

    @Autowired
    private IuserNoticeDAO userNoticeDAO;

    @Autowired
    private UserService userService;

    @Override
    public List<friendDTO> searchUsers(Long userId, String keyword) {
        return friendDAO.searchUsers(userId, normalizeKeyword(keyword));
    }

    @Override
    public List<friendDTO> getFriends(Long userId, String keyword) {
        return friendDAO.selectFriends(userId, normalizeKeyword(keyword));
    }

    @Override
    public List<friendDTO> getReceivedRequests(Long userId) {
        return friendDAO.selectReceivedRequests(userId);
    }

    @Override
    public List<friendDTO> getSentRequests(Long userId) {
        return friendDAO.selectSentRequests(userId);
    }

    @Override
    public List<friendDTO> getRecommendations(Long userId) {
        return userId == null ? List.of() : friendDAO.selectRecommendations(userId);
    }

    @Override
    public int getPendingReceivedCount(Long userId) {
        return userId == null ? 0 : friendDAO.countPendingReceived(userId);
    }

    @Override
    public friendDTO getRelation(Long userId, Long targetUserId) {
        if (userId == null || targetUserId == null || userId.equals(targetUserId)) return null;
        return friendDAO.selectRelation(userId, targetUserId);
    }

    @Override
    @Transactional
    public Map<String, Object> requestFriend(Long userId, Long targetUserId) {
        if (userId == null || targetUserId == null) return fail("대상을 찾을 수 없습니다.");
        if (userId.equals(targetUserId)) return fail("본인에게는 친구 요청을 보낼 수 없습니다.");

        usersDto targetUser = userService.findById(targetUserId);
        String targetStatus = targetUser == null ? null : targetUser.getStatus();
        if (targetUser == null || targetStatus == null || !"ACTIVE".equalsIgnoreCase(targetStatus.trim())) {
            return fail("친구 요청을 보낼 수 없는 사용자입니다.");
        }

        friendDTO relation = friendDAO.selectRelation(userId, targetUserId);
        if (relation != null) {
            String status = relation.getStatus() == null ? "" : relation.getStatus();
            String direction = relation.getDirection() == null ? "" : relation.getDirection();
            if ("ACCEPTED".equals(status)) return fail("이미 친구입니다.");
            if ("PENDING".equals(status) && "SENT".equals(direction)) return fail("이미 친구 요청을 보냈습니다.");
            if ("PENDING".equals(status) && "RECEIVED".equals(direction)) return fail("상대가 보낸 친구 요청이 있습니다. 받은 요청에서 수락하세요.");
            if ("BLOCKED".equals(status)) return fail("친구 요청을 보낼 수 없는 상태입니다.");
        }

        return result(friendDAO.insertRequest(userId, targetUserId) > 0, "친구 요청을 보냈습니다.");
    }

    @Override
    @Transactional
    public Map<String, Object> acceptRequest(Long userId, Long friendId) {
        if (userId == null || friendId == null) return fail("요청 정보를 확인할 수 없습니다.");

        friendDTO pendingRequest = null;
        List<friendDTO> pendingRequests = friendDAO.selectReceivedRequests(userId);
        if (pendingRequests != null) {
            for (friendDTO request : pendingRequests) {
                if (request != null && friendId.equals(request.getFriendId())) {
                    pendingRequest = request;
                    break;
                }
            }
        }

        int updated = friendDAO.acceptRequest(friendId, userId);
        if (updated < 1) return fail("요청을 처리하지 못했습니다.");

        if (pendingRequest != null && pendingRequest.getRequesterId() != null) {
            usersDto accepter = userService.findById(userId);
            String accepterName = accepter == null || accepter.getUSER_NAME() == null || accepter.getUSER_NAME().trim().isEmpty()
                    ? "상대방"
                    : accepter.getUSER_NAME().trim();
            userNoticeDAO.insertContentSendAlarm(
                    pendingRequest.getRequesterId(),
                    "FRIEND_ACCEPTED",
                    "USER",
                    userId,
                    "친구 요청이 수락되었습니다.",
                    accepterName + "님과 친구가 되었습니다.",
                    "/users/profile?userId=" + userId
            );
        }

        return result(true, "친구 요청을 수락했습니다.");
    }

    @Override
    @Transactional
    public Map<String, Object> rejectRequest(Long userId, Long friendId) {
        return result(userId != null && friendId != null && friendDAO.rejectRequest(friendId, userId) > 0, "친구 요청을 거절했습니다.");
    }

    @Override
    @Transactional
    public Map<String, Object> cancelRequest(Long userId, Long friendId) {
        return result(userId != null && friendId != null && friendDAO.cancelRequest(friendId, userId) > 0, "친구 요청을 취소했습니다.");
    }

    @Override
    @Transactional
    public Map<String, Object> deleteFriend(Long userId, Long friendId) {
        return result(userId != null && friendId != null && friendDAO.deleteFriend(friendId, userId) > 0, "친구를 삭제했습니다.");
    }

    private String normalizeKeyword(String keyword) {
        String value = keyword == null ? "" : keyword.trim();
        return value.isEmpty() ? null : value;
    }

    private Map<String, Object> result(boolean success, String successMessage) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", success);
        map.put("message", success ? successMessage : "요청을 처리하지 못했습니다.");
        return map;
    }

    private Map<String, Object> fail(String message) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("message", message);
        return map;
    }
}
