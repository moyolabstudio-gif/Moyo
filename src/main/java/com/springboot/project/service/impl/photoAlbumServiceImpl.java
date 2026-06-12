package com.springboot.project.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IphotoAlbumDAO;
import com.springboot.project.service.IphotoAlbumService;
import com.springboot.project.service.IcontentReactionService;

@Service
public class photoAlbumServiceImpl implements IphotoAlbumService {

    private static final Path PHOTO_ROOT = Paths.get("C:/uploads/photos");
    private static final long MAX_FILE_SIZE = 20L * 1024L * 1024L;

    private final IphotoAlbumDAO photoAlbumDAO;
    private final IcontentReactionService contentReactionService;

    public photoAlbumServiceImpl(IphotoAlbumDAO photoAlbumDAO,
                                 IcontentReactionService contentReactionService) {
        this.photoAlbumDAO = photoAlbumDAO;
        this.contentReactionService = contentReactionService;
    }

    @Override
    public List<Map<String, Object>> getAlbums(String scopeType, Long scopeId) {
        return photoAlbumDAO.selectAlbums(normalizeScopeType(scopeType), scopeId);
    }

    @Override
    public Map<String, Object> getAlbum(Long albumId) {
        return photoAlbumDAO.selectAlbum(albumId);
    }

    @Override
    @Transactional
    public Long createAlbum(String scopeType, Long scopeId, String name, String description, Long userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("scopeType", normalizeScopeType(scopeType));
        params.put("scopeId", scopeId);
        params.put("albumName", cleanRequired(name, 100, "앨범 이름"));
        params.put("albumDescription", cleanOptional(description, 500));
        params.put("createdBy", userId);
        photoAlbumDAO.insertAlbum(params);
        return ((Number) params.get("albumId")).longValue();
    }

    @Override
    @Transactional
    public boolean updateAlbum(Long albumId, String name, String description) {
        Map<String, Object> params = new HashMap<>();
        params.put("albumId", albumId);
        params.put("albumName", cleanRequired(name, 100, "앨범 이름"));
        params.put("albumDescription", cleanOptional(description, 500));
        return photoAlbumDAO.updateAlbum(params) > 0;
    }

    @Override
    @Transactional
    public boolean deleteAlbum(Long albumId) {
        // 앨범은 분류 수단이다. 삭제해도 게시물과 사진은 삭제하지 않고 '앨범 없음'으로 남긴다.
        return photoAlbumDAO.deleteAlbum(albumId) > 0;
    }

    @Override
    public List<Map<String, Object>> getPosts(String scopeType, Long scopeId, Long albumId, Long userId) {
        return photoAlbumDAO.selectPosts(normalizeScopeType(scopeType), scopeId, albumId, userId);
    }

    @Override
    public List<Map<String, Object>> getRecentPosts(String scopeType, Long scopeId, int limit, Long userId) {
        return photoAlbumDAO.selectRecentPosts(normalizeScopeType(scopeType), scopeId, Math.max(1, Math.min(limit, 12)), userId);
    }

    @Override
    public Map<String, Object> getPost(Long postId) {
        return photoAlbumDAO.selectPost(postId, null);
    }

    @Override
    public Map<String, Object> getPost(Long postId, Long userId) {
        return photoAlbumDAO.selectPost(postId, userId);
    }

    @Override
    public List<Map<String, Object>> getPostPhotos(Long postId) {
        return photoAlbumDAO.selectPostPhotos(postId);
    }

    @Override
    @Transactional
    public Long createPost(String scopeType, Long scopeId, Long albumId, String title,
                           String description, List<MultipartFile> files, Long userId) {
        if (files == null || files.stream().noneMatch(file -> file != null && !file.isEmpty())) {
            throw new IllegalArgumentException("공유할 사진을 한 장 이상 선택해주세요.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("scopeType", normalizeScopeType(scopeType));
        params.put("scopeId", scopeId);
        params.put("albumId", albumId);
        params.put("title", cleanOptional(title, 150));
        params.put("description", cleanOptional(description, 1000));
        params.put("createdBy", userId);
        photoAlbumDAO.insertPost(params);
        Long postId = ((Number) params.get("postId")).longValue();

        List<Path> savedPaths = new ArrayList<>();
        try {
            Files.createDirectories(PHOTO_ROOT);
            int sortOrder = 0;
            Long firstPhotoId = null;
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                validateImage(file);

                String originalName = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
                String storedName = UUID.randomUUID().toString().replace("-", "") + extensionOf(originalName);
                Path destination = PHOTO_ROOT.resolve(storedName).normalize();
                if (!destination.startsWith(PHOTO_ROOT)) throw new IllegalArgumentException("잘못된 파일명입니다.");

                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
                savedPaths.add(destination);

                Map<String, Object> photo = new HashMap<>();
                photo.put("postId", postId);
                photo.put("albumId", albumId);
                photo.put("filePath", "/uploads/photos/" + storedName);
                photo.put("originalName", originalName);
                photo.put("fileSize", file.getSize());
                photo.put("mimeType", file.getContentType());
                photo.put("uploadedBy", userId);
                photo.put("sortOrder", sortOrder++);
                photoAlbumDAO.insertPhoto(photo);
                if (firstPhotoId == null) firstPhotoId = ((Number) photo.get("photoId")).longValue();
            }

            if (albumId != null && firstPhotoId != null) {
                Map<String, Object> album = photoAlbumDAO.selectAlbum(albumId);
                if (album != null && mapValue(album, "coverPhotoId", "COVER_PHOTO_ID") == null) {
                    photoAlbumDAO.updateAlbumCover(albumId, firstPhotoId);
                }
            }
            return postId;
        } catch (IOException | RuntimeException e) {
            savedPaths.forEach(this::deletePathQuietly);
            throw new IllegalStateException(e instanceof IllegalArgumentException ? e.getMessage() : "사진 공유에 실패했습니다.", e);
        }
    }

    @Override
    @Transactional
    public boolean updatePost(Long postId, Long albumId, String title, String description) {
        Map<String, Object> before = photoAlbumDAO.selectPost(postId, null);
        if (before == null) return false;
        Long previousAlbumId = numberToLong(mapValue(before, "albumId", "ALBUM_ID"));

        Map<String, Object> params = new HashMap<>();
        params.put("postId", postId);
        params.put("albumId", albumId);
        params.put("title", cleanOptional(title, 150));
        params.put("description", cleanOptional(description, 1000));
        int updated = photoAlbumDAO.updatePost(params);
        if (updated > 0) {
            photoAlbumDAO.updatePhotoAlbumByPost(postId, albumId);
            refreshMovedAlbumCovers(previousAlbumId, albumId);
        }
        return updated > 0;
    }

    @Override
    @Transactional
    public boolean movePostAlbum(Long postId, Long albumId) {
        Map<String, Object> before = photoAlbumDAO.selectPost(postId, null);
        if (before == null) return false;
        Long previousAlbumId = numberToLong(mapValue(before, "albumId", "ALBUM_ID"));
        int updated = photoAlbumDAO.updatePostAlbum(postId, albumId);
        if (updated > 0) {
            photoAlbumDAO.updatePhotoAlbumByPost(postId, albumId);
            refreshMovedAlbumCovers(previousAlbumId, albumId);
        }
        return updated > 0;
    }

    private void refreshMovedAlbumCovers(Long previousAlbumId, Long nextAlbumId) {
        if (previousAlbumId != null) refreshAlbumCover(previousAlbumId);
        if (nextAlbumId != null && !nextAlbumId.equals(previousAlbumId)) refreshAlbumCover(nextAlbumId);
    }

    @Override
    @Transactional
    public boolean deletePost(Long postId) {
        Map<String, Object> post = photoAlbumDAO.selectPost(postId, null);
        Long albumId = numberToLong(mapValue(post, "albumId", "ALBUM_ID"));
        List<Map<String, Object>> photos = photoAlbumDAO.selectPostPhotos(postId);
        for (Map<String, Object> photo : photos) {
            Long photoId = numberToLong(mapValue(photo, "photoId", "PHOTO_ID"));
            if (photoId != null) photoAlbumDAO.clearAlbumCover(photoId);
        }
        contentReactionService.deleteByContent("PHOTO_POST", postId);
        int deleted = photoAlbumDAO.deletePost(postId);
        if (deleted > 0) {
            photos.forEach(photo -> deletePhysicalFile(stringValue(mapValue(photo, "filePath", "FILE_PATH"))));
            if (albumId != null) refreshAlbumCover(albumId);
        }
        return deleted > 0;
    }

    @Override
    public Map<String, Object> getPhoto(Long photoId) {
        return photoAlbumDAO.selectPhoto(photoId);
    }

    @Override
    @Transactional
    public boolean deletePhoto(Long photoId) {
        Map<String, Object> photo = photoAlbumDAO.selectPhoto(photoId);
        if (photo == null) return false;
        Long albumId = numberToLong(mapValue(photo, "albumId", "ALBUM_ID"));
        photoAlbumDAO.clearAlbumCover(photoId);
        int deleted = photoAlbumDAO.deletePhoto(photoId);
        if (deleted > 0) {
            deletePhysicalFile(stringValue(mapValue(photo, "filePath", "FILE_PATH")));
            if (albumId != null) refreshAlbumCover(albumId);
        }
        return deleted > 0;
    }

    private void refreshAlbumCover(Long albumId) {
        Long next = photoAlbumDAO.selectFirstAlbumPhotoId(albumId);
        photoAlbumDAO.updateAlbumCover(albumId, next);
    }

    private void validateImage(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("사진 한 장은 20MB 이하만 업로드할 수 있습니다.");
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }
    }

    private String normalizeScopeType(String scopeType) {
        String normalized = scopeType == null ? "" : scopeType.trim().toUpperCase();
        if (!List.of("PERSONAL", "WORKSPACE", "PROJECT").contains(normalized)) {
            throw new IllegalArgumentException("지원하지 않는 공간 유형입니다.");
        }
        return normalized;
    }

    private String cleanRequired(String value, int maxLength, String label) {
        String cleaned = value == null ? "" : value.trim();
        if (cleaned.isEmpty()) throw new IllegalArgumentException(label + "을 입력해주세요.");
        return cleaned.length() > maxLength ? cleaned.substring(0, maxLength) : cleaned;
    }

    private String cleanOptional(String value, int maxLength) {
        String cleaned = value == null ? "" : value.trim();
        if (cleaned.isEmpty()) return null;
        return cleaned.length() > maxLength ? cleaned.substring(0, maxLength) : cleaned;
    }

    private String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return ".jpg";
        String extension = name.substring(dot).toLowerCase();
        return extension.matches("\\.(jpg|jpeg|png|gif|webp|bmp|heic|heif)") ? extension : ".jpg";
    }

    private void deletePhysicalFile(String publicPath) {
        if (publicPath == null || !publicPath.startsWith("/uploads/photos/")) return;
        deletePathQuietly(PHOTO_ROOT.resolve(publicPath.substring("/uploads/photos/".length())).normalize());
    }

    private void deletePathQuietly(Path path) {
        try { if (path.startsWith(PHOTO_ROOT)) Files.deleteIfExists(path); }
        catch (IOException ignored) { }
    }

    private Object mapValue(Map<String, Object> map, String camelKey, String upperKey) {
        if (map == null) return null;
        Object value = map.get(camelKey);
        return value != null ? value : map.get(upperKey);
    }

    private Long numberToLong(Object value) {
        return value instanceof Number ? ((Number) value).longValue() : null;
    }

    private String stringValue(Object value) {
        return value == null ? null : value.toString();
    }
}
