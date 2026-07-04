package com.springboot.project.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
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
        return enrichPhotoSidecars(photoAlbumDAO.selectPostPhotos(postId));
    }

    @Override
    @Transactional
    public Long createPost(String scopeType, Long scopeId, Long albumId, String title,
                           String description, String visibilityType, List<MultipartFile> files,
                           List<MultipartFile> rawFiles, List<String> editMetas, Long userId) {
        if (files == null || files.stream().noneMatch(file -> file != null && !file.isEmpty())) {
            throw new IllegalArgumentException("공유할 사진을 한 장 이상 선택해주세요.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("scopeType", normalizeScopeType(scopeType));
        params.put("scopeId", scopeId);
        params.put("albumId", albumId);
        params.put("title", cleanOptional(title, 150));
        params.put("description", cleanOptional(description, 1000));
        params.put("visibilityType", normalizeVisibilityType(scopeType, visibilityType));
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
                savePhotoSidecars(storedName, rawFileAt(rawFiles, sortOrder), editMetaAt(editMetas, sortOrder), savedPaths);

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
    public boolean updatePostWithPhotos(Long postId, Long albumId, String title, String description,
                                        List<MultipartFile> files, List<MultipartFile> rawFiles,
                                        List<String> editMetas, Long userId) {
        if (files == null || files.stream().noneMatch(file -> file != null && !file.isEmpty())) {
            throw new IllegalArgumentException("사진을 한 장 이상 남겨주세요.");
        }

        Map<String, Object> before = photoAlbumDAO.selectPost(postId, null);
        if (before == null) return false;
        Long previousAlbumId = numberToLong(mapValue(before, "albumId", "ALBUM_ID"));
        List<Map<String, Object>> oldPhotos = photoAlbumDAO.selectPostPhotos(postId);
        List<Path> savedPaths = new ArrayList<>();

        try {
            Files.createDirectories(PHOTO_ROOT);

            Map<String, Object> params = new HashMap<>();
            params.put("postId", postId);
            params.put("albumId", albumId);
            params.put("title", cleanOptional(title, 150));
            params.put("description", cleanOptional(description, 1000));
            int updated = photoAlbumDAO.updatePost(params);
            if (updated <= 0) return false;

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
                savePhotoSidecars(storedName, rawFileAt(rawFiles, sortOrder), editMetaAt(editMetas, sortOrder), savedPaths);

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

            for (Map<String, Object> photo : oldPhotos) {
                Long photoId = numberToLong(mapValue(photo, "photoId", "PHOTO_ID"));
                if (photoId != null) {
                    photoAlbumDAO.clearAlbumCover(photoId);
                    photoAlbumDAO.deletePhoto(photoId);
                }
            }
            oldPhotos.forEach(photo -> deletePhotoFileAndSidecars(stringValue(mapValue(photo, "filePath", "FILE_PATH"))));

            refreshMovedAlbumCovers(previousAlbumId, albumId);
            if (albumId != null && firstPhotoId != null) photoAlbumDAO.updateAlbumCover(albumId, firstPhotoId);
            return true;
        } catch (IOException | RuntimeException e) {
            savedPaths.forEach(this::deletePathQuietly);
            throw new IllegalStateException(e instanceof IllegalArgumentException ? e.getMessage() : "사진 수정에 실패했습니다.", e);
        }
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
    public boolean updatePostVisibility(Long postId, String visibilityType) {
        Map<String, Object> post = photoAlbumDAO.selectPost(postId, null);
        if (post == null) return false;
        String scopeType = stringValue(mapValue(post, "scopeType", "SCOPE_TYPE"));
        String normalized = normalizeVisibilityType(scopeType, visibilityType);
        return photoAlbumDAO.updatePostVisibility(postId, normalized) > 0;
    }




    @Override
    @Transactional
    public List<Map<String, Object>> getTrashPosts(Long userId) {
        if (userId == null) return List.of();
        purgeExpiredTrashPosts();
        return photoAlbumDAO.selectTrashPosts(userId);
    }

    @Override
    @Transactional
    public boolean movePostToTrash(Long postId, Long userId) {
        if (postId == null || userId == null) return false;
        Map<String, Object> before = photoAlbumDAO.selectPost(postId, userId);
        if (before == null) return false;
        Long albumId = numberToLong(mapValue(before, "albumId", "ALBUM_ID"));
        List<Map<String, Object>> photos = photoAlbumDAO.selectPostPhotos(postId);
        for (Map<String, Object> photo : photos) {
            Long photoId = numberToLong(mapValue(photo, "photoId", "PHOTO_ID"));
            if (photoId != null) photoAlbumDAO.clearAlbumCover(photoId);
        }
        int updated = photoAlbumDAO.movePostToTrash(postId, userId);
        if (updated > 0) {
            photoAlbumDAO.updatePhotoAlbumByPost(postId, null);
            if (albumId != null) refreshAlbumCover(albumId);
        }
        return updated > 0;
    }

    @Override
    @Transactional
    public boolean restorePostFromTrash(Long postId, Long userId) {
        if (postId == null || userId == null) return false;
        purgeExpiredTrashPosts();
        Map<String, Object> before = photoAlbumDAO.selectTrashPost(postId, userId);
        if (before == null) return false;
        Long restoreAlbumId = numberToLong(mapValue(before, "originalAlbumId", "ORIGINAL_ALBUM_ID"));
        int updated = photoAlbumDAO.restorePostFromTrash(postId, userId);
        if (updated > 0) {
            Map<String, Object> restored = photoAlbumDAO.selectPost(postId, userId);
            Long albumId = numberToLong(mapValue(restored, "albumId", "ALBUM_ID"));
            photoAlbumDAO.updatePhotoAlbumByPost(postId, albumId);
            if (albumId != null) refreshAlbumCover(albumId);
            else if (restoreAlbumId != null) refreshAlbumCover(restoreAlbumId);
        }
        return updated > 0;
    }

    @Override
    public boolean canPermanentlyDeletePost(Long postId, Long userId) {
        if (postId == null || userId == null) return false;
        purgeExpiredTrashPosts();
        return photoAlbumDAO.countTrashOwner(postId, userId) > 0;
    }

    @Override
    @Transactional
    public boolean permanentlyDeletePost(Long postId, Long userId) {
        if (!canPermanentlyDeletePost(postId, userId)) return false;
        return deletePost(postId);
    }

    @Override
    @Transactional
    public int purgeExpiredTrashPosts() {
        return photoAlbumDAO.deleteExpiredTrashPosts();
    }


    @Override
    @Transactional
    public Long collectPost(Long sourcePostId, Long targetAlbumId, Long userId) {
        Map<String, Object> source = photoAlbumDAO.selectPost(sourcePostId, userId);
        if (source == null) {
            throw new IllegalArgumentException("담아갈 사진을 찾을 수 없습니다.");
        }

        Long creatorId = numberToLong(mapValue(source, "userId", "USER_ID"));
        if (creatorId == null) {
            throw new IllegalArgumentException("작성자 정보를 확인할 수 없습니다.");
        }
        if (creatorId.equals(userId)) {
            throw new IllegalArgumentException("내가 올린 사진은 이미 내 사진첩에 있습니다.");
        }
        if (photoAlbumDAO.countPostCollect(sourcePostId, userId) > 0) {
            throw new IllegalArgumentException("이미 담아간 사진입니다.");
        }

        if (targetAlbumId != null) {
            Map<String, Object> album = photoAlbumDAO.selectAlbum(targetAlbumId);
            if (album == null
                    || !"PERSONAL".equalsIgnoreCase(stringValue(mapValue(album, "scopeType", "SCOPE_TYPE")))
                    || !userId.equals(numberToLong(mapValue(album, "scopeId", "SCOPE_ID")))) {
                throw new IllegalArgumentException("내 개인 앨범으로만 담아갈 수 있습니다.");
            }
        }

        List<Map<String, Object>> sourcePhotos = photoAlbumDAO.selectPostPhotos(sourcePostId);
        if (sourcePhotos == null || sourcePhotos.isEmpty()) {
            throw new IllegalArgumentException("담아갈 사진이 없습니다.");
        }

        Map<String, Object> post = new HashMap<>();
        post.put("scopeType", "PERSONAL");
        post.put("scopeId", userId);
        post.put("albumId", targetAlbumId);
        post.put("title", cleanOptional(stringValue(mapValue(source, "title", "TITLE")), 150));
        post.put("description", cleanOptional(stringValue(mapValue(source, "description", "DESCRIPTION")), 1000));
        post.put("visibilityType", "PRIVATE");
        post.put("createdBy", userId);
        photoAlbumDAO.insertPost(post);
        Long newPostId = ((Number) post.get("postId")).longValue();

        List<Path> copiedPaths = new ArrayList<>();
        try {
            Files.createDirectories(PHOTO_ROOT);
            int sortOrder = 0;
            Long firstPhotoId = null;
            for (Map<String, Object> sourcePhoto : sourcePhotos) {
                String publicPath = stringValue(mapValue(sourcePhoto, "filePath", "FILE_PATH"));
                Path copied = copyPhotoFile(publicPath);
                copiedPaths.add(copied);
                copyPhotoSidecars(publicPath, copied.getFileName().toString(), copiedPaths);

                String originalName = stringValue(mapValue(sourcePhoto, "originalName", "ORIGINAL_NAME"));
                Map<String, Object> photo = new HashMap<>();
                photo.put("postId", newPostId);
                photo.put("albumId", targetAlbumId);
                photo.put("filePath", "/uploads/photos/" + copied.getFileName().toString());
                photo.put("originalName", originalName == null || originalName.isBlank() ? copied.getFileName().toString() : originalName);
                photo.put("fileSize", Files.size(copied));
                photo.put("mimeType", stringValue(mapValue(sourcePhoto, "mimeType", "MIME_TYPE")));
                photo.put("uploadedBy", userId);
                photo.put("sortOrder", sortOrder++);
                photoAlbumDAO.insertPhoto(photo);
                if (firstPhotoId == null) firstPhotoId = ((Number) photo.get("photoId")).longValue();
            }
            if (targetAlbumId != null && firstPhotoId != null) {
                Map<String, Object> album = photoAlbumDAO.selectAlbum(targetAlbumId);
                if (album != null && mapValue(album, "coverPhotoId", "COVER_PHOTO_ID") == null) {
                    photoAlbumDAO.updateAlbumCover(targetAlbumId, firstPhotoId);
                }
            }
            photoAlbumDAO.insertPostCollect(sourcePostId, userId);
            photoAlbumDAO.insertCollectedPostLink(newPostId, sourcePostId, userId);
            return newPostId;
        } catch (IOException | RuntimeException e) {
            copiedPaths.forEach(this::deletePathQuietly);
            photoAlbumDAO.deletePost(newPostId);
            throw new IllegalStateException(e instanceof IllegalArgumentException ? e.getMessage() : "사진 담아가기에 실패했습니다.", e);
        }
    }

    @Override
    @Transactional
    public boolean cancelCollectPost(Long sourcePostId, Long userId) {
        if (sourcePostId == null || userId == null) return false;

        Long collectedPostId = photoAlbumDAO.selectCollectedPostIdBySource(sourcePostId, userId);
        if (collectedPostId != null) {
            return deletePost(collectedPostId);
        }

        return photoAlbumDAO.deletePostCollect(sourcePostId, userId) > 0;
    }

    private Path copyPhotoFile(String publicPath) throws IOException {
        if (publicPath == null || !publicPath.startsWith("/uploads/photos/")) {
            throw new IllegalArgumentException("원본 사진 경로가 올바르지 않습니다.");
        }
        String sourceName = publicPath.substring("/uploads/photos/".length());
        Path source = PHOTO_ROOT.resolve(sourceName).normalize();
        if (!source.startsWith(PHOTO_ROOT) || !Files.exists(source)) {
            throw new IllegalArgumentException("원본 사진 파일을 찾을 수 없습니다.");
        }
        String copiedName = UUID.randomUUID().toString().replace("-", "") + extensionOf(sourceName);
        Path destination = PHOTO_ROOT.resolve(copiedName).normalize();
        if (!destination.startsWith(PHOTO_ROOT)) throw new IllegalArgumentException("잘못된 파일명입니다.");
        Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
        return destination;
    }

    @Override
    @Transactional
    public boolean deletePost(Long postId) {
        Map<String, Object> post = photoAlbumDAO.selectPost(postId, null);
        if (post == null) post = photoAlbumDAO.selectTrashPost(postId, null);
        if (post == null) return false;
        Long albumId = numberToLong(mapValue(post, "albumId", "ALBUM_ID"));
        Long postOwnerId = numberToLong(mapValue(post, "userId", "USER_ID"));
        Long collectedSourcePostId = postOwnerId == null ? null : photoAlbumDAO.selectCollectedSourcePostId(postId, postOwnerId);
        List<Map<String, Object>> photos = photoAlbumDAO.selectPostPhotos(postId);
        for (Map<String, Object> photo : photos) {
            Long photoId = numberToLong(mapValue(photo, "photoId", "PHOTO_ID"));
            if (photoId != null) photoAlbumDAO.clearAlbumCover(photoId);
        }
        contentReactionService.deleteByContent("PHOTO_POST", postId);
        photoAlbumDAO.deleteCollectedPostLink(postId);
        int deleted = photoAlbumDAO.deletePost(postId);
        if (deleted > 0) {
            if (collectedSourcePostId != null && postOwnerId != null) {
                photoAlbumDAO.deletePostCollect(collectedSourcePostId, postOwnerId);
            }
            photos.forEach(photo -> deletePhotoFileAndSidecars(stringValue(mapValue(photo, "filePath", "FILE_PATH"))));
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
            deletePhotoFileAndSidecars(stringValue(mapValue(photo, "filePath", "FILE_PATH")));
            if (albumId != null) refreshAlbumCover(albumId);
        }
        return deleted > 0;
    }


    @Override
    public List<Map<String, Object>> getPostComments(Long postId, Long userId) {
        return photoAlbumDAO.selectPostComments(postId, userId);
    }

    @Override
    @Transactional
    public Long createPostComment(Long postId, Long parentCommentId, String content, Long userId) {
        if (parentCommentId != null
                && photoAlbumDAO.countActivePostComment(postId, parentCommentId) <= 0) {
            throw new IllegalArgumentException("답글을 달 댓글을 찾을 수 없습니다.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("postId", postId);
        params.put("parentCommentId", parentCommentId);
        params.put("userId", userId);
        params.put("content", cleanRequired(content, 500, "댓글"));
        photoAlbumDAO.insertPostComment(params);
        return ((Number) params.get("commentId")).longValue();
    }

    @Override
    @Transactional
    public boolean updatePostComment(Long postId, Long commentId, String content, Long userId) {
        return photoAlbumDAO.updatePostComment(commentId, postId, userId, cleanRequired(content, 500, "댓글")) > 0;
    }

    @Override
    @Transactional
    public boolean deletePostComment(Long postId, Long commentId, Long userId, boolean canManage) {
        return photoAlbumDAO.deletePostComment(commentId, postId, userId, canManage ? 1 : 0) > 0;
    }



    private List<Map<String, Object>> enrichPhotoSidecars(List<Map<String, Object>> photos) {
        if (photos == null || photos.isEmpty()) return photos;
        photos.forEach(photo -> {
            String filePath = stringValue(mapValue(photo, "filePath", "FILE_PATH"));
            String storedName = storedNameFromPublicPath(filePath);
            if (storedName == null) return;
            Path raw = rawPathFor(storedName);
            if (Files.exists(raw)) {
                photo.put("rawFilePath", "/uploads/photos/" + raw.getFileName().toString());
                photo.put("RAW_FILE_PATH", "/uploads/photos/" + raw.getFileName().toString());
            }
            Path meta = metaPathFor(storedName);
            if (Files.exists(meta)) {
                try {
                    String json = Files.readString(meta, StandardCharsets.UTF_8);
                    photo.put("editMeta", json);
                    photo.put("EDIT_META", json);
                } catch (IOException ignored) { }
            }
        });
        return photos;
    }

    private MultipartFile rawFileAt(List<MultipartFile> rawFiles, int index) {
        if (rawFiles == null || index < 0 || index >= rawFiles.size()) return null;
        MultipartFile file = rawFiles.get(index);
        return file == null || file.isEmpty() ? null : file;
    }

    private String editMetaAt(List<String> editMetas, int index) {
        if (editMetas == null || index < 0 || index >= editMetas.size()) return null;
        String value = editMetas.get(index);
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void savePhotoSidecars(String displayStoredName, MultipartFile rawFile, String editMeta, List<Path> savedPaths) throws IOException {
        if (displayStoredName == null || displayStoredName.isBlank()) return;
        if (rawFile != null && !rawFile.isEmpty()) {
            validateImage(rawFile);
            Path rawDestination = rawPathFor(displayStoredName, rawFile.getOriginalFilename()).normalize();
            if (!rawDestination.startsWith(PHOTO_ROOT)) throw new IllegalArgumentException("잘못된 파일명입니다.");
            Files.copy(rawFile.getInputStream(), rawDestination, StandardCopyOption.REPLACE_EXISTING);
            if (savedPaths != null) savedPaths.add(rawDestination);
        }
        if (editMeta != null && !editMeta.isBlank()) {
            Path metaDestination = metaPathFor(displayStoredName).normalize();
            if (!metaDestination.startsWith(PHOTO_ROOT)) throw new IllegalArgumentException("잘못된 파일명입니다.");
            Files.writeString(metaDestination, editMeta, StandardCharsets.UTF_8);
            if (savedPaths != null) savedPaths.add(metaDestination);
        }
    }

    private void copyPhotoSidecars(String sourcePublicPath, String copiedStoredName, List<Path> copiedPaths) throws IOException {
        String sourceStoredName = storedNameFromPublicPath(sourcePublicPath);
        if (sourceStoredName == null || copiedStoredName == null || copiedStoredName.isBlank()) return;
        Path sourceRaw = rawPathFor(sourceStoredName);
        if (Files.exists(sourceRaw)) {
            Path targetRaw = rawPathFor(copiedStoredName, sourceRaw.getFileName().toString()).normalize();
            if (targetRaw.startsWith(PHOTO_ROOT)) {
                Files.copy(sourceRaw, targetRaw, StandardCopyOption.REPLACE_EXISTING);
                if (copiedPaths != null) copiedPaths.add(targetRaw);
            }
        }
        Path sourceMeta = metaPathFor(sourceStoredName);
        if (Files.exists(sourceMeta)) {
            Path targetMeta = metaPathFor(copiedStoredName).normalize();
            if (targetMeta.startsWith(PHOTO_ROOT)) {
                Files.copy(sourceMeta, targetMeta, StandardCopyOption.REPLACE_EXISTING);
                if (copiedPaths != null) copiedPaths.add(targetMeta);
            }
        }
    }

    private void deletePhotoFileAndSidecars(String publicPath) {
        String storedName = storedNameFromPublicPath(publicPath);
        if (storedName != null) {
            deletePathQuietly(rawPathFor(storedName));
            deletePathQuietly(metaPathFor(storedName));
        }
        deletePhysicalFile(publicPath);
    }

    private String storedNameFromPublicPath(String publicPath) {
        if (publicPath == null || !publicPath.startsWith("/uploads/photos/")) return null;
        String storedName = publicPath.substring("/uploads/photos/".length());
        return storedName.contains("..") || storedName.contains("/") || storedName.contains("\\") ? null : storedName;
    }

    private Path rawPathFor(String displayStoredName) {
        Path legacy = PHOTO_ROOT.resolve("raw_" + displayStoredName).normalize();
        if (Files.exists(legacy)) return legacy;
        String base = baseName(displayStoredName);
        try (var stream = Files.newDirectoryStream(PHOTO_ROOT, "raw_" + base + ".*")) {
            for (Path candidate : stream) {
                if (candidate.normalize().startsWith(PHOTO_ROOT)) return candidate.normalize();
            }
        } catch (IOException ignored) { }
        return legacy;
    }

    private Path rawPathFor(String displayStoredName, String originalName) {
        return PHOTO_ROOT.resolve("raw_" + baseName(displayStoredName) + extensionOf(originalName == null ? displayStoredName : originalName)).normalize();
    }

    private String baseName(String name) {
        String value = name == null ? "photo" : name;
        int dot = value.lastIndexOf('.');
        return dot > 0 ? value.substring(0, dot) : value;
    }

    private Path metaPathFor(String displayStoredName) {
        return PHOTO_ROOT.resolve("meta_" + displayStoredName + ".json").normalize();
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


    private String normalizeVisibilityType(String scopeType, String visibilityType) {
        String normalizedScope = normalizeScopeType(scopeType);
        if ("WORKSPACE".equals(normalizedScope)) return "WORKSPACE";
        if ("PROJECT".equals(normalizedScope)) return "PROJECT";
        String normalized = visibilityType == null ? "PRIVATE" : visibilityType.trim().toUpperCase();
        if (!List.of("PRIVATE", "FRIENDS").contains(normalized)) return "PRIVATE";
        return normalized;
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
