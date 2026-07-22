package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface IphotoAlbumService {
    List<Map<String, Object>> getAlbums(String scopeType, Long scopeId);
    Map<String, Object> getAlbum(Long albumId);
    Long createAlbum(String scopeType, Long scopeId, String name, String description, Long userId);
    boolean updateAlbum(Long albumId, String name, String description);
    boolean deleteAlbum(Long albumId);

    List<Map<String, Object>> getPosts(String scopeType, Long scopeId, Long albumId, Long userId);
    List<Map<String, Object>> getRecentPosts(String scopeType, Long scopeId, int limit, Long userId);
    List<Map<String, Object>> getProfilePublicPosts(Long profileUserId, Long viewerUserId);
    int countProfilePublicPosts(Long profileUserId);
    Map<String, Object> getPost(Long postId);
    Map<String, Object> getPost(Long postId, Long userId);
    List<Map<String, Object>> getPostPhotos(Long postId);
    Long createPost(String scopeType, Long scopeId, Long albumId, String title,
                    String description, String visibilityType, List<MultipartFile> files,
                    List<MultipartFile> rawFiles, List<String> editMetas, Long userId);
    boolean updatePost(Long postId, Long albumId, String title, String description);
    boolean updatePostWithPhotos(Long postId, Long albumId, String title, String description,
                                 List<MultipartFile> files, List<MultipartFile> rawFiles,
                                 List<String> editMetas, Long userId);
    boolean movePostAlbum(Long postId, Long albumId);
    boolean updatePostVisibility(Long postId, String visibilityType);
    List<Map<String, Object>> getTrashPosts(Long userId);
    boolean movePostToTrash(Long postId, Long userId);
    boolean restorePostFromTrash(Long postId, Long userId);
    boolean canPermanentlyDeletePost(Long postId, Long userId);
    boolean permanentlyDeletePost(Long postId, Long userId);
    int purgeExpiredTrashPosts();
    Long collectPost(Long sourcePostId, Long targetAlbumId, Long userId);
    boolean cancelCollectPost(Long sourcePostId, Long userId);
    boolean deletePost(Long postId);

    Map<String, Object> getPhoto(Long photoId);
    boolean deletePhoto(Long photoId);

    List<Map<String, Object>> getPostComments(Long postId, Long userId);
    Long createPostComment(Long postId, Long parentCommentId, String content, Long userId);
    boolean updatePostComment(Long postId, Long commentId, String content, Long userId);
    boolean deletePostComment(Long postId, Long commentId, Long userId, boolean canManage);
}

