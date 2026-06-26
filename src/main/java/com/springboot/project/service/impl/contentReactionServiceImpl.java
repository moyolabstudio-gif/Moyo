package com.springboot.project.service.impl;

import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IcontentReactionDAO;
import com.springboot.project.service.IcontentReactionService;

@Service
public class contentReactionServiceImpl implements IcontentReactionService {

    private static final Set<String> CONTENT_TYPES = Set.of("PHOTO_POST", "PHOTO_COMMENT", "NOTE", "BOARD", "NOTICE");
    private static final Set<String> REACTION_TYPES = Set.of("LIKE", "HELPFUL", "CHECK");

    private final IcontentReactionDAO contentReactionDAO;

    public contentReactionServiceImpl(IcontentReactionDAO contentReactionDAO) {
        this.contentReactionDAO = contentReactionDAO;
    }

    @Override
    @Transactional
    public Map<String, Object> toggle(String contentType, Long contentId, Long userId, String reactionType) {
        String normalizedContentType = normalizeContentType(contentType);
        String normalizedReactionType = normalizeReactionType(reactionType);
        requireIds(contentId, userId);

        boolean reacted = contentReactionDAO.countUserReaction(
                normalizedContentType, contentId, userId, normalizedReactionType) > 0;

        if (reacted) {
            contentReactionDAO.deleteReaction(normalizedContentType, contentId, userId, normalizedReactionType);
        } else {
            contentReactionDAO.insertReaction(normalizedContentType, contentId, userId, normalizedReactionType);
        }

        return Map.of(
                "reacted", !reacted,
                "liked", "LIKE".equals(normalizedReactionType) && !reacted,
                "reactionCount", contentReactionDAO.countReactions(
                        normalizedContentType, contentId, normalizedReactionType),
                "likeCount", contentReactionDAO.countReactions(
                        normalizedContentType, contentId, normalizedReactionType)
        );
    }

    @Override
    public Map<String, Object> getStatus(String contentType, Long contentId, Long userId, String reactionType) {
        String normalizedContentType = normalizeContentType(contentType);
        String normalizedReactionType = normalizeReactionType(reactionType);
        requireIds(contentId, userId);
        boolean reacted = contentReactionDAO.countUserReaction(
                normalizedContentType, contentId, userId, normalizedReactionType) > 0;
        int count = contentReactionDAO.countReactions(normalizedContentType, contentId, normalizedReactionType);
        return Map.of("reacted", reacted, "liked", "LIKE".equals(normalizedReactionType) && reacted,
                "reactionCount", count, "likeCount", count);
    }

    @Override
    @Transactional
    public boolean deleteByContent(String contentType, Long contentId) {
        if (contentId == null) return false;
        return contentReactionDAO.deleteByContent(normalizeContentType(contentType), contentId) >= 0;
    }

    private String normalizeContentType(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        if (!CONTENT_TYPES.contains(normalized)) throw new IllegalArgumentException("지원하지 않는 콘텐츠 유형입니다.");
        return normalized;
    }

    private String normalizeReactionType(String value) {
        String normalized = value == null ? "LIKE" : value.trim().toUpperCase();
        if (!REACTION_TYPES.contains(normalized)) throw new IllegalArgumentException("지원하지 않는 반응 유형입니다.");
        return normalized;
    }

    private void requireIds(Long contentId, Long userId) {
        if (contentId == null || userId == null) throw new IllegalArgumentException("잘못된 반응 요청입니다.");
    }
}
