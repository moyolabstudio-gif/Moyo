package com.springboot.project.service;

import com.springboot.project.dto.friendDTO;

import java.util.List;
import java.util.Map;

public interface IfriendService {
    List<friendDTO> searchUsers(Long userId, String keyword);
    List<friendDTO> getFriends(Long userId, String keyword);
    List<friendDTO> getReceivedRequests(Long userId);
    List<friendDTO> getSentRequests(Long userId);
    int getPendingReceivedCount(Long userId);
    Map<String, Object> requestFriend(Long userId, Long targetUserId);
    Map<String, Object> acceptRequest(Long userId, Long friendId);
    Map<String, Object> rejectRequest(Long userId, Long friendId);
    Map<String, Object> cancelRequest(Long userId, Long friendId);
    Map<String, Object> deleteFriend(Long userId, Long friendId);
}
