package com.springboot.project.service;

import com.springboot.project.dto.contentShareDTO;

import java.util.List;
import java.util.Map;

public interface IcontentShareService {
    boolean canManage(String contentType, Long contentId, Long userId);
    List<contentShareDTO> getShares(String contentType, Long contentId, Long userId);
    Map<String, Object> getTargets(String contentType, Long contentId, Long userId, String keyword);
    boolean saveShare(contentShareDTO share, Long userId);
    boolean removeShare(Long shareId, Long userId);
    void removeContentShares(String contentType, Long contentId);
}
