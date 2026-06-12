package com.springboot.project.service;

import java.util.Map;

public interface IcontentReactionService {
    Map<String, Object> toggle(String contentType, Long contentId, Long userId, String reactionType);
    Map<String, Object> getStatus(String contentType, Long contentId, Long userId, String reactionType);
    boolean deleteByContent(String contentType, Long contentId);
}
