package com.springboot.project.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface IcontentReactionDAO {
    int countUserReaction(@Param("contentType") String contentType,
                          @Param("contentId") Long contentId,
                          @Param("userId") Long userId,
                          @Param("reactionType") String reactionType);

    int insertReaction(@Param("contentType") String contentType,
                       @Param("contentId") Long contentId,
                       @Param("userId") Long userId,
                       @Param("reactionType") String reactionType);

    int deleteReaction(@Param("contentType") String contentType,
                       @Param("contentId") Long contentId,
                       @Param("userId") Long userId,
                       @Param("reactionType") String reactionType);

    int deleteByContent(@Param("contentType") String contentType,
                        @Param("contentId") Long contentId);

    int countReactions(@Param("contentType") String contentType,
                       @Param("contentId") Long contentId,
                       @Param("reactionType") String reactionType);
}
