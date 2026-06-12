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
    Map<String, Object> getPost(Long postId);
    Map<String, Object> getPost(Long postId, Long userId);
    List<Map<String, Object>> getPostPhotos(Long postId);
    Long createPost(String scopeType, Long scopeId, Long albumId, String title,
                    String description, List<MultipartFile> files, Long userId);
    boolean updatePost(Long postId, Long albumId, String title, String description);
    boolean movePostAlbum(Long postId, Long albumId);
    boolean deletePost(Long postId);

    Map<String, Object> getPhoto(Long photoId);
    boolean deletePhoto(Long photoId);
}
