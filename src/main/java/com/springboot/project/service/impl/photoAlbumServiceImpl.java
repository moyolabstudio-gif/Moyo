package com.springboot.project.service.impl;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.project.dao.IcontentRecordItemDAO;
import com.springboot.project.dao.IphotoAlbumDAO;
import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.service.IcontentReactionService;
import com.springboot.project.service.IphotoAlbumService;


@Service
public class photoAlbumServiceImpl implements IphotoAlbumService {

    private final Path photoRoot;
    private static final long MAX_FILE_SIZE = 10L * 1024L * 1024L;
    private static final int MAX_UPLOAD_COUNT = 10;
    private static final int MAX_IMAGE_DIMENSION = 12000;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");

    private final IphotoAlbumDAO photoAlbumDAO;
    private final IcontentReactionService contentReactionService;
    private final IcontentRecordItemDAO contentRecordItemDAO;
    private final IprojectDAO projectDAO;
    private final ObjectMapper objectMapper;

    public photoAlbumServiceImpl(IphotoAlbumDAO photoAlbumDAO,
                                 IcontentReactionService contentReactionService,
                                 IcontentRecordItemDAO contentRecordItemDAO,
                                 IprojectDAO projectDAO,
                                 ObjectMapper objectMapper,
                                 @Value("${moyo.upload.photo-dir:C:/uploads/photos/}") String photoUploadDir) {
        this.photoAlbumDAO = photoAlbumDAO;
        this.contentReactionService = contentReactionService;
        this.contentRecordItemDAO = contentRecordItemDAO;
        this.projectDAO = projectDAO;
        this.objectMapper = objectMapper;
        this.photoRoot = Path.of(photoUploadDir).toAbsolutePath().normalize();
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
    public Long createAlbum(String scopeType, Long scopeId, Long parentAlbumId, String name, String description, Long userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("scopeType", normalizeScopeType(scopeType));
        params.put("scopeId", scopeId);
        params.put("parentAlbumId", validateParentAlbum(scopeType, scopeId, parentAlbumId));
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
    public boolean moveAlbum(Long albumId, Long parentAlbumId) {
        Map<String, Object> album = photoAlbumDAO.selectAlbum(albumId);
        if (album == null) return false;
        if (parentAlbumId != null && albumId.equals(parentAlbumId)) {
            throw new IllegalArgumentException("앨범을 자기 자신 안으로 이동할 수 없습니다.");
        }
        Long checkedParent = validateParentAlbum(
                String.valueOf(mapValue(album, "scopeType", "SCOPE_TYPE")),
                numberToLong(mapValue(album, "scopeId", "SCOPE_ID")), parentAlbumId);
        if (checkedParent != null && photoAlbumDAO.countAlbumDescendant(albumId, checkedParent) > 0) {
            throw new IllegalArgumentException("앨범을 자신의 하위 앨범 안으로 이동할 수 없습니다.");
        }
        return photoAlbumDAO.updateAlbumParent(albumId, checkedParent) > 0;
    }

    @Override
    @Transactional
    public boolean deleteAlbum(Long albumId) {
        Map<String, Object> album = photoAlbumDAO.selectAlbum(albumId);
        if (album == null) return false;
        Long parentAlbumId = numberToLong(mapValue(album, "parentAlbumId", "PARENT_ALBUM_ID"));
        photoAlbumDAO.promoteChildAlbums(albumId, parentAlbumId);
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
    public List<Map<String, Object>> getFriendSharedPosts(Long userId, Long ownerId) {
        if (userId == null || ownerId == null) return List.of();
        return photoAlbumDAO.selectFriendSharedPosts(userId, ownerId);
    }

    @Override
    public List<Map<String, Object>> getProfilePublicPosts(Long profileUserId, Long viewerUserId) {
        if (profileUserId == null) return List.of();
        return photoAlbumDAO.selectProfilePublicPosts(profileUserId, viewerUserId);
    }

    @Override
    public int countProfilePublicPosts(Long profileUserId) {
        if (profileUserId == null) return 0;
        return photoAlbumDAO.countProfilePublicPosts(profileUserId);
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
    public Map<String, Object> getTrashPost(Long postId, Long userId) {
        if (postId == null || userId == null) return null;
        purgeExpiredTrashPosts();
        return photoAlbumDAO.selectTrashPost(postId, userId);
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
        long selectedCount = files.stream().filter(file -> file != null && !file.isEmpty()).count();
        if (selectedCount > MAX_UPLOAD_COUNT) {
            throw new IllegalArgumentException("사진은 한 번에 최대 10장까지 업로드할 수 있습니다.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("scopeType", normalizeScopeType(scopeType));
        params.put("scopeId", scopeId);
        params.put("albumId", albumId);
        params.put("title", cleanOptional(title, 150));
        params.put("description", cleanOptional(description, 1000));
        params.put("visibilityType", normalizeVisibilityType(scopeType, scopeId, visibilityType));
        params.put("createdBy", userId);
        photoAlbumDAO.insertPost(params);
        Long postId = ((Number) params.get("postId")).longValue();

        List<Path> savedPaths = new ArrayList<>();
        try {
            Files.createDirectories(photoRoot);
            int sortOrder = 0;
            Long firstPhotoId = null;
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                validateImage(file);
                String originalName = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
                String storedName = UUID.randomUUID().toString().replace("-", "") + extensionOf(originalName);
                Path destination = photoRoot.resolve(storedName).normalize();
                if (!destination.startsWith(photoRoot)) throw new IllegalArgumentException("잘못된 파일명입니다.");

                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
                savedPaths.add(destination);
                savePhotoSidecars(storedName, rawFileAt(rawFiles, sortOrder), editMetaAt(editMetas, sortOrder), file, savedPaths);

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
            Files.createDirectories(photoRoot);

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
                Path destination = photoRoot.resolve(storedName).normalize();
                if (!destination.startsWith(photoRoot)) throw new IllegalArgumentException("잘못된 파일명입니다.");

                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
                savedPaths.add(destination);
                savePhotoSidecars(storedName, rawFileAt(rawFiles, sortOrder), editMetaAt(editMetas, sortOrder), file, savedPaths);

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
        Long scopeId = numberToLong(mapValue(post, "scopeId", "SCOPE_ID"));
        String normalized = normalizeVisibilityType(scopeType, scopeId, visibilityType);
        return photoAlbumDAO.updatePostVisibility(postId, normalized) > 0;
    }




    @Override
    @Transactional
    public List<Map<String, Object>> getTrashPosts(String scopeType, Long scopeId, Long userId) {
        if (scopeType == null || scopeId == null || userId == null) return List.of();
        purgeExpiredTrashPosts();
        return photoAlbumDAO.selectTrashPosts(scopeType, scopeId, userId);
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
            contentRecordItemDAO.updatePhotoItemsDeletedByPostId(postId, "Y");
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
            contentRecordItemDAO.updatePhotoItemsDeletedByPostId(postId, "N");
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

        String sourceScopeType = stringValue(mapValue(source, "scopeType", "SCOPE_TYPE"));
        String sourceVisibilityType = stringValue(mapValue(source, "visibilityType", "VISIBILITY_TYPE"));
        if (!"PERSONAL".equalsIgnoreCase(sourceScopeType)
                || !"FRIENDS".equalsIgnoreCase(sourceVisibilityType)) {
            throw new IllegalArgumentException("MOYO 공개된 사진만 담을 수 있습니다.");
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
            Files.createDirectories(photoRoot);
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

            final String collectMessage = "담아가요 :)";
            boolean alreadyLeft = getPostComments(sourcePostId, userId).stream().anyMatch(comment ->
                    userId.equals(numberToLong(mapValue(comment, "userId", "USER_ID")))
                            && collectMessage.equals(stringValue(mapValue(comment, "commentContent", "COMMENT_CONTENT")).trim())
            );
            if (!alreadyLeft) {
                createPostComment(sourcePostId, null, collectMessage, userId);
            }
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
        Path source = photoRoot.resolve(sourceName).normalize();
        if (!source.startsWith(photoRoot) || !Files.exists(source)) {
            throw new IllegalArgumentException("원본 사진 파일을 찾을 수 없습니다.");
        }
        String copiedName = UUID.randomUUID().toString().replace("-", "") + extensionOf(sourceName);
        Path destination = photoRoot.resolve(copiedName).normalize();
        if (!destination.startsWith(photoRoot)) throw new IllegalArgumentException("잘못된 파일명입니다.");
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
    public Path getPhotoPath(Long photoId, boolean raw) {
        Map<String, Object> photo = photoAlbumDAO.selectPhoto(photoId);
        if (photo == null) throw new IllegalArgumentException("사진을 찾을 수 없습니다.");
        String publicPath = stringValue(mapValue(photo, "filePath", "FILE_PATH"));
        String storedName = storedNameFromPublicPath(publicPath);
        if (storedName == null) throw new SecurityException("잘못된 사진 경로입니다.");
        Path path = raw ? rawPathFor(storedName) : photoRoot.resolve(storedName).normalize();
        if (!path.startsWith(photoRoot)) throw new SecurityException("허용되지 않은 사진 경로입니다.");
        if (!Files.isRegularFile(path)) throw new IllegalArgumentException("실제 사진 파일을 찾을 수 없습니다.");
        return path;
    }

    @Override
    public Map<String, Object> updatePhotoMetadata(Long photoId, Map<String, Object> metadata) {
        Map<String, Object> photo = photoAlbumDAO.selectPhoto(photoId);
        if (photo == null) return null;
        String filePath = stringValue(mapValue(photo, "filePath", "FILE_PATH"));
        String storedName = storedNameFromPublicPath(filePath);
        if (storedName == null) throw new IllegalArgumentException("사진 파일 정보를 찾을 수 없습니다.");

        Path metaPath = metaPathFor(storedName).normalize();
        if (!metaPath.startsWith(photoRoot)) throw new IllegalArgumentException("잘못된 사진 경로입니다.");
        Map<String, Object> meta = readPhotoMeta(metaPath);

        Map<String, Object> captureInput = metadata == null ? Map.of() : asMap(metadata.get("capture"));
        Map<String, Object> capture = childMap(meta, "capture");
        putCleanString(capture, "takenAt", captureInput.get("takenAt"), 40);
        if (captureInput.get("takenAt") != null && !String.valueOf(captureInput.get("takenAt")).isBlank()) {
            capture.put("takenAtSource", "MANUAL");
        }
        putCleanString(capture, "locationName", captureInput.get("locationName"), 200);
        putNullableNumber(capture, "latitude", captureInput.get("latitude"));
        putNullableNumber(capture, "longitude", captureInput.get("longitude"));
        if (!capture.isEmpty()) meta.put("capture", capture); else meta.remove("capture");

        Object peopleValue = metadata == null ? null : metadata.get("people");
        if (peopleValue instanceof List<?> list) {
            List<Map<String, Object>> people = new ArrayList<>();
            for (Object item : list) {
                Map<String, Object> source = asMap(item);
                if (source.isEmpty()) continue;
                String id = cleanMetaText(source.get("id"), 30);
                if (id == null) id = cleanMetaText(source.get("userId"), 30);
                if (id == null) continue;
                Map<String, Object> person = new HashMap<>();
                person.put("id", id);
                putCleanString(person, "name", source.get("name"), 100);
                putCleanString(person, "email", source.get("email"), 200);
                putCleanString(person, "profile", source.get("profile"), 500);
                people.add(person);
                if (people.size() >= 30) break;
            }
            if (people.isEmpty()) meta.remove("people"); else meta.put("people", people);
        }

        try {
            Files.createDirectories(photoRoot);
            Files.writeString(metaPath, objectMapper.writeValueAsString(meta), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("사진 정보를 저장하지 못했습니다.", e);
        }

        Map<String, Object> updated = new HashMap<>(photo);
        updated.put("editMeta", toJson(meta));
        updated.put("EDIT_META", toJson(meta));
        return updated;
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

            Long photoId = numberToLong(mapValue(photo, "photoId", "PHOTO_ID"));
            if (photoId != null) {
                String mediaUrl = "/photo/media/" + photoId;
                photo.put("filePath", mediaUrl);
                photo.put("FILE_PATH", mediaUrl);
            }

            Path raw = rawPathFor(storedName);
            if (photoId != null && Files.isRegularFile(raw)) {
                String rawUrl = "/photo/media/" + photoId + "/raw";
                photo.put("rawFilePath", rawUrl);
                photo.put("RAW_FILE_PATH", rawUrl);
            }

            // 상세 조회는 저장된 메타데이터를 읽기만 한다.
            // EXIF 추출/sidecar 갱신은 업로드 또는 명시적 수정 시점에서만 수행한다.
            Map<String, Object> meta = readPhotoMeta(metaPathFor(storedName));
            if (!meta.isEmpty()) {
                String json = toJson(meta);
                photo.put("editMeta", json);
                photo.put("EDIT_META", json);
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

    private void savePhotoSidecars(String displayStoredName, MultipartFile rawFile, String editMeta,
                                   MultipartFile displayFile, List<Path> savedPaths) throws IOException {
        if (displayStoredName == null || displayStoredName.isBlank()) return;
        if (rawFile != null && !rawFile.isEmpty()) {
            validateImage(rawFile);
            Path rawDestination = rawPathFor(displayStoredName, rawFile.getOriginalFilename()).normalize();
            if (!rawDestination.startsWith(photoRoot)) throw new IllegalArgumentException("잘못된 파일명입니다.");
            Files.copy(rawFile.getInputStream(), rawDestination, StandardCopyOption.REPLACE_EXISTING);
            if (savedPaths != null) savedPaths.add(rawDestination);
        }

        Map<String, Object> meta = parsePhotoMeta(editMeta);
        MultipartFile metadataSource = rawFile != null && !rawFile.isEmpty() ? rawFile : displayFile;
        Map<String, Object> detectedCapture = extractCaptureMetadata(metadataSource);
        if (!detectedCapture.isEmpty()) {
            Map<String, Object> capture = childMap(meta, "capture");
            detectedCapture.forEach((key, value) -> {
                Object current = capture.get(key);
                if (current == null || String.valueOf(current).isBlank()) capture.put(key, value);
            });
            meta.put("capture", capture);
        }

        if (!meta.isEmpty()) {
            Path metaDestination = metaPathFor(displayStoredName).normalize();
            if (!metaDestination.startsWith(photoRoot)) throw new IllegalArgumentException("잘못된 파일명입니다.");
            Files.writeString(metaDestination, objectMapper.writeValueAsString(meta), StandardCharsets.UTF_8);
            if (savedPaths != null) savedPaths.add(metaDestination);
        }
    }

    private Map<String, Object> parsePhotoMeta(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            Map<String, Object> value = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            return value == null ? new HashMap<>() : new HashMap<>(value);
        } catch (Exception ignored) {
            return new HashMap<>();
        }
    }

    private Map<String, Object> readPhotoMeta(Path metaPath) {
        if (metaPath == null || !Files.exists(metaPath)) return new HashMap<>();
        try {
            return parsePhotoMeta(Files.readString(metaPath, StandardCharsets.UTF_8));
        } catch (IOException ignored) {
            return new HashMap<>();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> map)) return new HashMap<>();
        Map<String, Object> result = new HashMap<>();
        map.forEach((key, item) -> {
            if (key != null) result.put(String.valueOf(key), item);
        });
        return result;
    }

    private Map<String, Object> childMap(Map<String, Object> parent, String key) {
        Map<String, Object> child = asMap(parent.get(key));
        return child.isEmpty() ? new HashMap<>() : child;
    }

    private void putCleanString(Map<String, Object> target, String key, Object value, int maxLength) {
        String cleaned = cleanMetaText(value, maxLength);
        if (cleaned == null) target.remove(key); else target.put(key, cleaned);
    }

    private String cleanMetaText(Object value, int maxLength) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) return null;
        return text.length() <= maxLength ? text : text.substring(0, maxLength);
    }

    private void putNullableNumber(Map<String, Object> target, String key, Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            target.remove(key);
            return;
        }
        try {
            target.put(key, Double.valueOf(String.valueOf(value)));
        } catch (NumberFormatException ignored) { }
    }

    private Map<String, Object> extractCaptureMetadata(MultipartFile file) {
        if (file == null || file.isEmpty()) return Map.of();
        try (InputStream input = file.getInputStream()) {
            return extractCaptureMetadata(input);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private Map<String, Object> extractCaptureMetadata(Path file) {
        if (file == null || !Files.exists(file) || !file.normalize().startsWith(photoRoot)) return Map.of();
        try (InputStream input = Files.newInputStream(file)) {
            return extractCaptureMetadata(input);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private Map<String, Object> extractCaptureMetadata(InputStream input) {
        if (input == null) return Map.of();
        try {
            byte[] bytes = input.readAllBytes();
            return readJpegExifCapture(bytes);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    /**
     * JPEG APP1/EXIF에서 촬영일(DateTimeOriginal)과 GPS만 최소한으로 읽는다.
     * 외부 EXIF 라이브러리에 의존하지 않으며, 형식이 없거나 손상된 경우 빈 Map을 반환한다.
     */
    private Map<String, Object> readJpegExifCapture(byte[] bytes) {
        if (bytes == null || bytes.length < 12 || (bytes[0] & 0xFF) != 0xFF || (bytes[1] & 0xFF) != 0xD8) {
            return Map.of();
        }

        int pos = 2;
        while (pos + 4 <= bytes.length) {
            if ((bytes[pos] & 0xFF) != 0xFF) {
                pos++;
                continue;
            }
            int marker = bytes[pos + 1] & 0xFF;
            pos += 2;
            if (marker == 0xD9 || marker == 0xDA) break;
            if (marker == 0x01 || (marker >= 0xD0 && marker <= 0xD7)) continue;
            if (pos + 2 > bytes.length) break;

            int segmentLength = readUnsignedShort(bytes, pos, false);
            if (segmentLength < 2 || pos + segmentLength > bytes.length) break;
            int segmentStart = pos + 2;
            int payloadLength = segmentLength - 2;

            if (marker == 0xE1 && payloadLength >= 8
                    && matchesAscii(bytes, segmentStart, "Exif\0\0")) {
                try {
                    return readTiffCapture(bytes, segmentStart + 6, payloadLength - 6);
                } catch (RuntimeException ignored) {
                    return Map.of();
                }
            }
            pos += segmentLength;
        }
        return Map.of();
    }

    private Map<String, Object> readTiffCapture(byte[] bytes, int tiffStart, int tiffLength) {
        if (tiffLength < 8 || tiffStart < 0 || tiffStart + tiffLength > bytes.length) return Map.of();
        boolean littleEndian;
        int b0 = bytes[tiffStart] & 0xFF;
        int b1 = bytes[tiffStart + 1] & 0xFF;
        if (b0 == 'I' && b1 == 'I') littleEndian = true;
        else if (b0 == 'M' && b1 == 'M') littleEndian = false;
        else return Map.of();
        if (readUnsignedShort(bytes, tiffStart + 2, littleEndian) != 42) return Map.of();

        long ifd0Offset = readUnsignedInt(bytes, tiffStart + 4, littleEndian);
        int ifd0 = safeTiffOffset(tiffStart, tiffLength, ifd0Offset, 2);
        if (ifd0 < 0) return Map.of();

        long exifIfdOffset = findIfdLongValue(bytes, tiffStart, tiffLength, ifd0, littleEndian, 0x8769);
        long gpsIfdOffset = findIfdLongValue(bytes, tiffStart, tiffLength, ifd0, littleEndian, 0x8825);
        Map<String, Object> capture = new HashMap<>();

        if (exifIfdOffset >= 0) {
            int exifIfd = safeTiffOffset(tiffStart, tiffLength, exifIfdOffset, 2);
            String original = exifIfd < 0 ? null
                    : findIfdAsciiValue(bytes, tiffStart, tiffLength, exifIfd, littleEndian, 0x9003);
            String takenAt = normalizeExifDateTime(original);
            if (takenAt != null) {
                capture.put("takenAt", takenAt);
                capture.put("takenAtSource", "EXIF");
            }
        }

        if (gpsIfdOffset >= 0) {
            int gpsIfd = safeTiffOffset(tiffStart, tiffLength, gpsIfdOffset, 2);
            if (gpsIfd >= 0) {
                String latRef = findIfdAsciiValue(bytes, tiffStart, tiffLength, gpsIfd, littleEndian, 0x0001);
                double[] latDms = findIfdRationalArray(bytes, tiffStart, tiffLength, gpsIfd, littleEndian, 0x0002, 3);
                String lonRef = findIfdAsciiValue(bytes, tiffStart, tiffLength, gpsIfd, littleEndian, 0x0003);
                double[] lonDms = findIfdRationalArray(bytes, tiffStart, tiffLength, gpsIfd, littleEndian, 0x0004, 3);
                Double latitude = dmsToDecimal(latDms, latRef);
                Double longitude = dmsToDecimal(lonDms, lonRef);
                if (latitude != null && longitude != null) {
                    capture.put("latitude", latitude);
                    capture.put("longitude", longitude);
                    capture.put("locationSource", "EXIF");
                }
            }
        }
        return capture;
    }

    private long findIfdLongValue(byte[] bytes, int tiffStart, int tiffLength, int ifdOffset,
                                  boolean littleEndian, int wantedTag) {
        int count = readUnsignedShort(bytes, ifdOffset, littleEndian);
        int entriesStart = ifdOffset + 2;
        for (int i = 0; i < count; i++) {
            int entry = entriesStart + i * 12;
            if (!withinTiff(tiffStart, tiffLength, entry, 12)) break;
            if (readUnsignedShort(bytes, entry, littleEndian) != wantedTag) continue;
            int type = readUnsignedShort(bytes, entry + 2, littleEndian);
            long itemCount = readUnsignedInt(bytes, entry + 4, littleEndian);
            if ((type == 3 || type == 4) && itemCount >= 1) {
                return type == 3
                        ? readUnsignedShort(bytes, entry + 8, littleEndian)
                        : readUnsignedInt(bytes, entry + 8, littleEndian);
            }
        }
        return -1;
    }

    private String findIfdAsciiValue(byte[] bytes, int tiffStart, int tiffLength, int ifdOffset,
                                     boolean littleEndian, int wantedTag) {
        int count = readUnsignedShort(bytes, ifdOffset, littleEndian);
        int entriesStart = ifdOffset + 2;
        for (int i = 0; i < count; i++) {
            int entry = entriesStart + i * 12;
            if (!withinTiff(tiffStart, tiffLength, entry, 12)) break;
            if (readUnsignedShort(bytes, entry, littleEndian) != wantedTag) continue;
            int type = readUnsignedShort(bytes, entry + 2, littleEndian);
            long itemCount = readUnsignedInt(bytes, entry + 4, littleEndian);
            if (type != 2 || itemCount <= 0 || itemCount > 4096) return null;
            int valuePos = valuePosition(bytes, tiffStart, tiffLength, entry, littleEndian, type, itemCount);
            if (valuePos < 0) return null;
            int length = (int) itemCount;
            if (!withinTiff(tiffStart, tiffLength, valuePos, length)) return null;
            int end = valuePos;
            int max = valuePos + length;
            while (end < max && bytes[end] != 0) end++;
            return new String(bytes, valuePos, end - valuePos, StandardCharsets.US_ASCII).trim();
        }
        return null;
    }

    private double[] findIfdRationalArray(byte[] bytes, int tiffStart, int tiffLength, int ifdOffset,
                                          boolean littleEndian, int wantedTag, int expectedCount) {
        int count = readUnsignedShort(bytes, ifdOffset, littleEndian);
        int entriesStart = ifdOffset + 2;
        for (int i = 0; i < count; i++) {
            int entry = entriesStart + i * 12;
            if (!withinTiff(tiffStart, tiffLength, entry, 12)) break;
            if (readUnsignedShort(bytes, entry, littleEndian) != wantedTag) continue;
            int type = readUnsignedShort(bytes, entry + 2, littleEndian);
            long itemCount = readUnsignedInt(bytes, entry + 4, littleEndian);
            if (type != 5 || itemCount < expectedCount || itemCount > 16) return null;
            int valuePos = valuePosition(bytes, tiffStart, tiffLength, entry, littleEndian, type, itemCount);
            int byteCount = Math.toIntExact(itemCount * 8L);
            if (valuePos < 0 || !withinTiff(tiffStart, tiffLength, valuePos, byteCount)) return null;
            double[] values = new double[expectedCount];
            for (int j = 0; j < expectedCount; j++) {
                long numerator = readUnsignedInt(bytes, valuePos + j * 8, littleEndian);
                long denominator = readUnsignedInt(bytes, valuePos + j * 8 + 4, littleEndian);
                if (denominator == 0) return null;
                values[j] = (double) numerator / (double) denominator;
            }
            return values;
        }
        return null;
    }

    private int valuePosition(byte[] bytes, int tiffStart, int tiffLength, int entry,
                              boolean littleEndian, int type, long itemCount) {
        int typeSize = switch (type) {
            case 1, 2, 7 -> 1;
            case 3 -> 2;
            case 4, 9 -> 4;
            case 5, 10 -> 8;
            default -> 0;
        };
        if (typeSize == 0 || itemCount > Integer.MAX_VALUE / typeSize) return -1;
        long total = itemCount * typeSize;
        if (total <= 4) return entry + 8;
        long offset = readUnsignedInt(bytes, entry + 8, littleEndian);
        return safeTiffOffset(tiffStart, tiffLength, offset, (int) total);
    }

    private int safeTiffOffset(int tiffStart, int tiffLength, long relativeOffset, int needed) {
        if (relativeOffset < 0 || relativeOffset > Integer.MAX_VALUE) return -1;
        long absolute = (long) tiffStart + relativeOffset;
        if (absolute < tiffStart || absolute + needed > (long) tiffStart + tiffLength) return -1;
        return (int) absolute;
    }

    private boolean withinTiff(int tiffStart, int tiffLength, int absolute, int needed) {
        return absolute >= tiffStart && needed >= 0
                && (long) absolute + needed <= (long) tiffStart + tiffLength;
    }

    private int readUnsignedShort(byte[] bytes, int offset, boolean littleEndian) {
        if (offset < 0 || offset + 2 > bytes.length) throw new IllegalArgumentException("잘못된 EXIF 데이터입니다.");
        int a = bytes[offset] & 0xFF;
        int b = bytes[offset + 1] & 0xFF;
        return littleEndian ? (a | (b << 8)) : ((a << 8) | b);
    }

    private long readUnsignedInt(byte[] bytes, int offset, boolean littleEndian) {
        if (offset < 0 || offset + 4 > bytes.length) throw new IllegalArgumentException("잘못된 EXIF 데이터입니다.");
        long a = bytes[offset] & 0xFFL;
        long b = bytes[offset + 1] & 0xFFL;
        long c = bytes[offset + 2] & 0xFFL;
        long d = bytes[offset + 3] & 0xFFL;
        return littleEndian ? (a | (b << 8) | (c << 16) | (d << 24))
                : ((a << 24) | (b << 16) | (c << 8) | d);
    }

    private boolean matchesAscii(byte[] bytes, int offset, String value) {
        byte[] expected = value.getBytes(StandardCharsets.ISO_8859_1);
        if (offset < 0 || offset + expected.length > bytes.length) return false;
        for (int i = 0; i < expected.length; i++) {
            if (bytes[offset + i] != expected[i]) return false;
        }
        return true;
    }

    private String normalizeExifDateTime(String value) {
        if (value == null) return null;
        String text = value.trim();
        if (!text.matches("\\d{4}:\\d{2}:\\d{2} \\d{2}:\\d{2}:\\d{2}")) return null;
        return text.substring(0, 4) + "-" + text.substring(5, 7) + "-" + text.substring(8, 10)
                + "T" + text.substring(11);
    }

    private Double dmsToDecimal(double[] dms, String ref) {
        if (dms == null || dms.length < 3) return null;
        double value = dms[0] + dms[1] / 60.0 + dms[2] / 3600.0;
        String direction = ref == null ? "" : ref.trim().toUpperCase(Locale.ROOT);
        if ("S".equals(direction) || "W".equals(direction)) value = -value;
        if (!Double.isFinite(value)) return null;
        return value;
    }

    private String toJson(Map<String, Object> value) {
        try { return objectMapper.writeValueAsString(value == null ? Map.of() : value); }
        catch (Exception ignored) { return "{}"; }
    }

    private void copyPhotoSidecars(String sourcePublicPath, String copiedStoredName, List<Path> copiedPaths) throws IOException {
        String sourceStoredName = storedNameFromPublicPath(sourcePublicPath);
        if (sourceStoredName == null || copiedStoredName == null || copiedStoredName.isBlank()) return;
        Path sourceRaw = rawPathFor(sourceStoredName);
        if (Files.exists(sourceRaw)) {
            Path targetRaw = rawPathFor(copiedStoredName, sourceRaw.getFileName().toString()).normalize();
            if (targetRaw.startsWith(photoRoot)) {
                Files.copy(sourceRaw, targetRaw, StandardCopyOption.REPLACE_EXISTING);
                if (copiedPaths != null) copiedPaths.add(targetRaw);
            }
        }
        Path sourceMeta = metaPathFor(sourceStoredName);
        if (Files.exists(sourceMeta)) {
            Path targetMeta = metaPathFor(copiedStoredName).normalize();
            if (targetMeta.startsWith(photoRoot)) {
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
        Path legacy = photoRoot.resolve("raw_" + displayStoredName).normalize();
        if (Files.exists(legacy)) return legacy;
        String base = baseName(displayStoredName);
        try (var stream = Files.newDirectoryStream(photoRoot, "raw_" + base + ".*")) {
            for (Path candidate : stream) {
                if (candidate.normalize().startsWith(photoRoot)) return candidate.normalize();
            }
        } catch (IOException ignored) { }
        return legacy;
    }

    private Path rawPathFor(String displayStoredName, String originalName) {
        return photoRoot.resolve("raw_" + baseName(displayStoredName) + extensionOf(originalName == null ? displayStoredName : originalName)).normalize();
    }

    private String baseName(String name) {
        String value = name == null ? "photo" : name;
        int dot = value.lastIndexOf('.');
        return dot > 0 ? value.substring(0, dot) : value;
    }

    private Path metaPathFor(String displayStoredName) {
        return photoRoot.resolve("meta_" + displayStoredName + ".json").normalize();
    }

    private void refreshAlbumCover(Long albumId) {
        Long next = photoAlbumDAO.selectFirstAlbumPhotoId(albumId);
        photoAlbumDAO.updateAlbumCover(albumId, next);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("빈 사진 파일은 업로드할 수 없습니다.");
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("사진 한 장은 최대 10MB까지 업로드할 수 있습니다.");

        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().trim();
        int dot = originalName.lastIndexOf('.');
        String extension = dot >= 0 && dot < originalName.length() - 1
                ? originalName.substring(dot + 1).toLowerCase(Locale.ROOT)
                : "";
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension) || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("JPG, PNG, GIF, WEBP 형식의 사진만 업로드할 수 있습니다.");
        }

        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(12);
            if (!matchesImageSignature(header, extension)) {
                throw new IllegalArgumentException("파일 내용과 사진 형식이 일치하지 않습니다.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("사진 파일을 확인할 수 없습니다.");
        }

        if ("webp".equals(extension)) {
            try (InputStream input = file.getInputStream()) {
                int[] dimensions = readWebpDimensions(input.readNBytes(30));
                if (dimensions == null) throw new IllegalArgumentException("손상되었거나 읽을 수 없는 WEBP 사진입니다.");
                if (dimensions[0] > MAX_IMAGE_DIMENSION || dimensions[1] > MAX_IMAGE_DIMENSION) {
                    throw new IllegalArgumentException("사진 가로와 세로는 각각 12,000px 이하여야 합니다.");
                }
            } catch (IOException e) {
                throw new IllegalArgumentException("사진 파일을 확인할 수 없습니다.");
            }
        } else {
            try (InputStream input = file.getInputStream()) {
                BufferedImage image = ImageIO.read(input);
                if (image == null) throw new IllegalArgumentException("손상되었거나 읽을 수 없는 사진입니다.");
                if (image.getWidth() > MAX_IMAGE_DIMENSION || image.getHeight() > MAX_IMAGE_DIMENSION) {
                    throw new IllegalArgumentException("사진 가로와 세로는 각각 12,000px 이하여야 합니다.");
                }
            } catch (IOException e) {
                throw new IllegalArgumentException("사진 파일을 확인할 수 없습니다.");
            }
        }
    }

    private int[] readWebpDimensions(byte[] bytes) {
        if (bytes == null || bytes.length < 25) return null;
        String chunk = new String(bytes, 12, 4, StandardCharsets.US_ASCII);
        if ("VP8X".equals(chunk) && bytes.length >= 30) {
            int width = 1 + ((bytes[24] & 0xFF) | ((bytes[25] & 0xFF) << 8) | ((bytes[26] & 0xFF) << 16));
            int height = 1 + ((bytes[27] & 0xFF) | ((bytes[28] & 0xFF) << 8) | ((bytes[29] & 0xFF) << 16));
            return new int[] { width, height };
        }
        if ("VP8L".equals(chunk) && bytes.length >= 25 && (bytes[20] & 0xFF) == 0x2F) {
            int width = 1 + ((bytes[21] & 0xFF) | ((bytes[22] & 0x3F) << 8));
            int height = 1 + (((bytes[22] & 0xC0) >> 6) | ((bytes[23] & 0xFF) << 2) | ((bytes[24] & 0x0F) << 10));
            return new int[] { width, height };
        }
        if ("VP8 ".equals(chunk) && bytes.length >= 30
                && (bytes[23] & 0xFF) == 0x9D && (bytes[24] & 0xFF) == 0x01 && (bytes[25] & 0xFF) == 0x2A) {
            int width = ((bytes[26] & 0xFF) | ((bytes[27] & 0xFF) << 8)) & 0x3FFF;
            int height = ((bytes[28] & 0xFF) | ((bytes[29] & 0xFF) << 8)) & 0x3FFF;
            return width > 0 && height > 0 ? new int[] { width, height } : null;
        }
        return null;
    }

    private boolean matchesImageSignature(byte[] header, String extension) {
        if (header == null) return false;
        if (("jpg".equals(extension) || "jpeg".equals(extension))) {
            return header.length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
        }
        if ("png".equals(extension)) {
            return header.length >= 8 && (header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                    && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A;
        }
        if ("gif".equals(extension)) {
            return header.length >= 6 && header[0] == 'G' && header[1] == 'I' && header[2] == 'F'
                    && header[3] == '8' && (header[4] == '7' || header[4] == '9') && header[5] == 'a';
        }
        if ("webp".equals(extension)) {
            return header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
        }
        return false;
    }


    private String normalizeVisibilityType(String scopeType, Long scopeId, String visibilityType) {
        String normalizedScope = normalizeScopeType(scopeType);
        if ("WORKSPACE".equals(normalizedScope)) return "WORKSPACE";
        if ("PROJECT".equals(normalizedScope) && !isPersonalProject(scopeId)) return "PROJECT";
        String normalized = visibilityType == null ? "PRIVATE" : visibilityType.trim().toUpperCase();
        if (!List.of("PRIVATE", "FRIENDS").contains(normalized)) return "PRIVATE";
        return normalized;
    }

    private boolean isPersonalProject(Long projId) {
        if (projId == null) return false;
        projectRequestDTO project = projectDAO.selectProjectById(projId);
        return project != null && project.getWsId() == null;
    }

    private String normalizeScopeType(String scopeType) {
        String normalized = scopeType == null ? "" : scopeType.trim().toUpperCase();
        if (!List.of("PERSONAL", "WORKSPACE", "PROJECT").contains(normalized)) {
            throw new IllegalArgumentException("지원하지 않는 공간 유형입니다.");
        }
        return normalized;
    }

    private Long validateParentAlbum(String scopeType, Long scopeId, Long parentAlbumId) {
        if (parentAlbumId == null) return null;
        Map<String, Object> parent = photoAlbumDAO.selectAlbum(parentAlbumId);
        if (parent == null) throw new IllegalArgumentException("상위 앨범을 찾을 수 없습니다.");
        String normalizedScope = normalizeScopeType(scopeType);
        String parentScope = String.valueOf(mapValue(parent, "scopeType", "SCOPE_TYPE"));
        Long parentScopeId = numberToLong(mapValue(parent, "scopeId", "SCOPE_ID"));
        if (!normalizedScope.equalsIgnoreCase(parentScope) || !java.util.Objects.equals(scopeId, parentScopeId)) {
            throw new IllegalArgumentException("같은 사진 공간의 앨범 아래로만 이동할 수 있습니다.");
        }
        return parentAlbumId;
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
        return extension.matches("\\.(jpg|jpeg|png|gif|webp|bmp)") ? extension : ".jpg";
    }

    private void deletePhysicalFile(String publicPath) {
        if (publicPath == null || !publicPath.startsWith("/uploads/photos/")) return;
        deletePathQuietly(photoRoot.resolve(publicPath.substring("/uploads/photos/".length())).normalize());
    }

    private void deletePathQuietly(Path path) {
        try { if (path.startsWith(photoRoot)) Files.deleteIfExists(path); }
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
