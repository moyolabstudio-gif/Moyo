package com.springboot.project.service;

import com.springboot.project.dto.contentShareDTO;

import java.util.List;
import java.util.Map;

public interface IcontentShareService {
    boolean canManage(String contentType, Long contentId, Long userId);
    boolean canRead(String contentType, Long contentId, Long userId);
    List<contentShareDTO> getShares(String contentType, Long contentId, Long userId);

    Map<String, Object> getTargets(String contentType, Long contentId, Long userId, String keyword, String shareMode);
    default Map<String, Object> getTargets(String contentType, Long contentId, Long userId, String keyword) {
        return getTargets(contentType, contentId, userId, keyword, null);
    }

    boolean saveShare(contentShareDTO share, Long userId, String shareMode);
    int saveSharesBulk(String contentType, java.util.List<Long> contentIds, java.util.List<String> targetTypes, java.util.List<Long> targetIds, java.util.List<String> permissionTypes, Long userId, String shareMode);
    default boolean saveShare(contentShareDTO share, Long userId) {
        return saveShare(share, userId, null);
    }

    boolean removeShare(Long shareId, Long userId);
    List<contentShareDTO> getReceivedShareRequests(Long userId);
    List<contentShareDTO> getSentShareRequests(Long userId);
    int countPendingShareRequests(Long userId);
    boolean respondShareRequest(Long shareId, String status, Long userId);
    boolean cancelOrLeaveShare(Long shareId, Long userId);
    void removeContentShares(String contentType, Long contentId);
}
