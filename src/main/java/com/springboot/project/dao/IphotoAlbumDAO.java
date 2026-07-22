package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface IphotoAlbumDAO {
    List<Map<String, Object>> selectAlbums(@Param("scopeType") String scopeType,
                                           @Param("scopeId") Long scopeId);
    Map<String, Object> selectAlbum(@Param("albumId") Long albumId);
    int insertAlbum(Map<String, Object> params);
    int updateAlbum(Map<String, Object> params);
    int deleteAlbum(@Param("albumId") Long albumId);

    List<Map<String, Object>> selectPosts(@Param("scopeType") String scopeType,
                                          @Param("scopeId") Long scopeId,
                                          @Param("albumId") Long albumId,
                                          @Param("userId") Long userId);
    List<Map<String, Object>> selectRecentPosts(@Param("scopeType") String scopeType,
                                                @Param("scopeId") Long scopeId,
                                                @Param("limit") int limit,
                                                @Param("userId") Long userId);
    List<Map<String, Object>> selectProfilePublicPosts(@Param("profileUserId") Long profileUserId,
                                                       @Param("userId") Long userId);
    int countProfilePublicPosts(@Param("profileUserId") Long profileUserId);
    Map<String, Object> selectPost(@Param("postId") Long postId, @Param("userId") Long userId);
    List<Map<String, Object>> selectPostPhotos(@Param("postId") Long postId);
    int insertPost(Map<String, Object> params);
    int updatePost(Map<String, Object> params);
    int updatePostAlbum(@Param("postId") Long postId, @Param("albumId") Long albumId);
    int updatePostVisibility(@Param("postId") Long postId, @Param("visibilityType") String visibilityType);
    int updatePhotoAlbumByPost(@Param("postId") Long postId, @Param("albumId") Long albumId);
    List<Map<String, Object>> selectTrashPosts(@Param("userId") Long userId);
    Map<String, Object> selectTrashPost(@Param("postId") Long postId, @Param("userId") Long userId);
    int movePostToTrash(@Param("postId") Long postId, @Param("userId") Long userId);
    int restorePostFromTrash(@Param("postId") Long postId, @Param("userId") Long userId);
    int countTrashOwner(@Param("postId") Long postId, @Param("userId") Long userId);
    int deletePost(@Param("postId") Long postId);
    int deleteExpiredTrashPosts();
    int countPostCollect(@Param("postId") Long postId, @Param("userId") Long userId);
    int insertPostCollect(@Param("postId") Long postId, @Param("userId") Long userId);
    int insertCollectedPostLink(@Param("collectedPostId") Long collectedPostId,
                                @Param("sourcePostId") Long sourcePostId,
                                @Param("userId") Long userId);
    Long selectCollectedSourcePostId(@Param("collectedPostId") Long collectedPostId,
                                     @Param("userId") Long userId);
    Long selectCollectedPostIdBySource(@Param("sourcePostId") Long sourcePostId,
                                      @Param("userId") Long userId);
    int deletePostCollect(@Param("postId") Long postId, @Param("userId") Long userId);
    int deleteCollectedPostLink(@Param("collectedPostId") Long collectedPostId);

    int insertPhoto(Map<String, Object> params);
    Map<String, Object> selectPhoto(@Param("photoId") Long photoId);
    int deletePhoto(@Param("photoId") Long photoId);

    int updateAlbumCover(@Param("albumId") Long albumId,
                         @Param("coverPhotoId") Long coverPhotoId);
    int clearAlbumCover(@Param("photoId") Long photoId);
    Long selectFirstAlbumPhotoId(@Param("albumId") Long albumId);

    List<Map<String, Object>> selectPostComments(@Param("postId") Long postId,
                                            @Param("userId") Long userId);
    int countActivePostComment(@Param("postId") Long postId, @Param("commentId") Long commentId);
    int insertPostComment(Map<String, Object> params);
    int updatePostComment(@Param("commentId") Long commentId,
                          @Param("postId") Long postId,
                          @Param("userId") Long userId,
                          @Param("content") String content);
    int deletePostComment(@Param("commentId") Long commentId,
                          @Param("postId") Long postId,
                          @Param("userId") Long userId,
                          @Param("canManage") int canManage);
}

