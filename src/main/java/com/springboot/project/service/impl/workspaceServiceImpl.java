package com.springboot.project.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Set;
import java.io.InputStream;
import java.awt.image.BufferedImage;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import javax.imageio.ImageIO;

import org.springframework.web.multipart.MultipartFile;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.dto.workspaceUpdateRequest;
import com.springboot.project.dto.workspaceUpdateResult;
import com.springboot.project.service.fileUploadService;
import com.springboot.project.service.IworkspaceService;

@Service
public class workspaceServiceImpl implements IworkspaceService {

    @Autowired
    private IworkspaceDAO workspaceDao;
    
    @Autowired
    private IusersDao usersDao;

    @Autowired
    private fileUploadService fileUploadService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private static final int WORKSPACE_NAME_MAX_LENGTH = 60;
    private static final int WORKSPACE_DESCRIPTION_MAX_LENGTH = 300;
    private static final int WORKSPACE_LINK_MAX_COUNT = 5;
    private static final long WORKSPACE_IMAGE_MAX_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES = Set.of(
            "image/png", "image/jpeg", "image/webp");
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(
            "png", "jpg", "jpeg", "webp");
    private static final Set<String> ALLOWED_WORKSPACE_TYPES = Set.of(
            "ORGANIZATION", "TEAM", "STUDY", "COMMUNITY", "CLUB", "LIFE", "ETC");
    private static final Set<String> ALLOWED_JOIN_TYPES = Set.of(
            "OPEN", "APPROVAL", "INVITE_ONLY");
    
    @Override
    @Transactional
    public Long createWorkspace(workspaceDTO dto, Long userId, Map<String, Object> profile,
                                List<Map<String, Object>> links) {
        String inviteCode = java.util.UUID.randomUUID().toString().substring(0, 8);
        dto.setInviteCode(inviteCode);
        dto.setOwnerId(userId);

        workspaceDao.insertWorkspace(dto);
        workspaceDao.insertWorkspaceMember(dto.getWsId(), userId, "ADMIN");

        Map<String, Object> profileParams =
                buildWorkspaceProfileParams(dto.getWsId(), userId, profile);
        workspaceDao.insertWorkspaceMemberProfile(profileParams);
        replaceWorkspaceLinks(dto.getWsId(), links);

        return dto.getWsId();
    }

    public List<workspaceDTO> getWorkspaceList(Long userId) {
        return workspaceDao.selectWorkspaceList(userId);
    }
    @Override
    public workspaceDTO getWorkspaceDetail(Long wsId) {
        return workspaceDao.selectWorkspaceDetail(wsId);
    }

    @Override
    public List<Map<String, Object>> getWorkspaceLinks(Long wsId) {
        return workspaceDao.selectWorkspaceLinks(wsId);
    }

    @Override
    @Transactional
    public boolean updateWorkspace(workspaceDTO dto, List<Map<String, Object>> links) {
        int updated = workspaceDao.updateWorkspace(dto);
        if (updated < 1) return false;
        replaceWorkspaceLinks(dto.getWsId(), links);
        return true;
    }

    @Override
    public workspaceUpdateResult updateWorkspaceProfile(
            workspaceUpdateRequest request, Long userId) {

        if (userId == null) {
            return workspaceUpdateResult.fail(
                    "LOGIN_REQUIRED", "로그인이 만료되었습니다. 다시 로그인해 주세요.");
        }
        if (request == null || request.getWsId() == null) {
            return workspaceUpdateResult.fail(
                    "INVALID_WS_ID", "그룹 정보를 확인할 수 없습니다.");
        }

        workspaceDTO currentData =
                workspaceDao.selectWorkspaceDetail(request.getWsId());
        if (currentData == null) {
            return workspaceUpdateResult.fail(
                    "NOT_FOUND", "그룹 정보를 찾을 수 없습니다.");
        }

        boolean isOwner = currentData.getOwnerId() != null
                && currentData.getOwnerId().equals(userId);
        boolean isAdmin = workspaceDao.isWorkspaceAdmin(
                request.getWsId(), userId) > 0;

        // 그룹장은 OWNER_ID로, 관리자는 ADMIN 역할로 수정 권한을 확인한다.
        if (!isOwner && !isAdmin) {
            return workspaceUpdateResult.fail(
                    "FORBIDDEN", "그룹 정보를 수정할 권한이 없습니다.");
        }

        // 삭제 대기 중에는 그룹 정보를 바꿀 수 없다.
        if ("DELETE_PENDING".equalsIgnoreCase(currentData.getStatus())) {
            return workspaceUpdateResult.fail(
                    "WORKSPACE_DELETE_PENDING",
                    "삭제 대기 중인 그룹은 정보를 수정할 수 없습니다.");
        }
        if (currentData.getStatus() != null
                && !"ACTIVE".equalsIgnoreCase(currentData.getStatus())) {
            return workspaceUpdateResult.fail(
                    "WORKSPACE_UNAVAILABLE",
                    "현재 상태에서는 그룹 정보를 수정할 수 없습니다.");
        }

        String normalizedName = normalizeSingleLine(request.getWsName());
        if (normalizedName.isEmpty()) {
            return workspaceUpdateResult.fail(
                    "INVALID_NAME", "그룹 이름을 입력해 주세요.");
        }
        if (normalizedName.length() > WORKSPACE_NAME_MAX_LENGTH) {
            return workspaceUpdateResult.fail(
                    "NAME_TOO_LONG", "그룹 이름은 60자 이하로 입력해 주세요.");
        }

        String normalizedDescription = normalizeMultiline(request.getWsDescription());
        if (normalizedDescription != null
                && normalizedDescription.length() > WORKSPACE_DESCRIPTION_MAX_LENGTH) {
            return workspaceUpdateResult.fail(
                    "DESCRIPTION_TOO_LONG", "그룹 소개는 300자 이하로 입력해 주세요.");
        }

        String normalizedType = normalizeSingleLine(request.getWsType()).toUpperCase();
        if (!ALLOWED_WORKSPACE_TYPES.contains(normalizedType)) {
            return workspaceUpdateResult.fail(
                    "INVALID_WORKSPACE_TYPE", "올바른 그룹 유형을 선택해 주세요.");
        }

        String normalizedJoinType = normalizeSingleLine(request.getJoinType()).toUpperCase();
        if (!ALLOWED_JOIN_TYPES.contains(normalizedJoinType)) {
            return workspaceUpdateResult.fail(
                    "INVALID_JOIN_TYPE", "올바른 가입 방식을 선택해 주세요.");
        }

        List<Map<String, Object>> links;
        try {
            links = buildValidatedWorkspaceLinks(
                    request.getLinkNames(), request.getLinkUrls());
        } catch (IllegalArgumentException e) {
            return workspaceUpdateResult.fail("INVALID_LINK_PAIR", e.getMessage());
        }

        String previousImagePath = currentData.getWsImagePath();
        String previousOriginalPath = currentData.getWsImageOriginalPath();
        String newlyUploadedPath = null;
        String newlyUploadedOriginalPath = null;
        try {
            boolean hasCroppedImage = request.getWsImage() != null
                    && !request.getWsImage().isEmpty();
            boolean hasOriginalImage = request.getWsImageOriginal() != null
                    && !request.getWsImageOriginal().isEmpty();

            workspaceUpdateResult croppedValidation = validateWorkspaceImage(
                    request.getWsImage(), "그룹 이미지");
            if (croppedValidation != null) {
                return croppedValidation;
            }
            workspaceUpdateResult originalValidation = validateWorkspaceImage(
                    request.getWsImageOriginal(), "그룹 이미지 원본");
            if (originalValidation != null) {
                return originalValidation;
            }

            if (hasCroppedImage) {
                newlyUploadedPath = fileUploadService.upload(request.getWsImage());
                if (newlyUploadedPath == null || newlyUploadedPath.isBlank()) {
                    return workspaceUpdateResult.fail(
                            "IMAGE_UPLOAD_FAILED", "그룹 이미지를 저장하지 못했습니다.");
                }
            }
            if (hasOriginalImage) {
                newlyUploadedOriginalPath = fileUploadService.upload(request.getWsImageOriginal());
                if (newlyUploadedOriginalPath == null || newlyUploadedOriginalPath.isBlank()) {
                    if (newlyUploadedPath != null) {
                        fileUploadService.deleteManagedFile(newlyUploadedPath);
                    }
                    return workspaceUpdateResult.fail(
                            "IMAGE_UPLOAD_FAILED", "그룹 이미지 원본을 저장하지 못했습니다.");
                }
            }

            workspaceDTO dto = new workspaceDTO();
            dto.setWsId(request.getWsId());
            dto.setWsName(normalizedName);
            dto.setWsDescription(normalizedDescription);
            dto.setWsType(normalizedType);
            dto.setJoinType(normalizedJoinType);

            if (newlyUploadedPath != null) {
                dto.setWsImagePath(newlyUploadedPath);
                dto.setWsImageOriginalPath(
                        newlyUploadedOriginalPath != null
                                ? newlyUploadedOriginalPath
                                : previousOriginalPath);
                dto.setWsImageCropScale(request.getWsImageCropScale());
                dto.setWsImageCropX(request.getWsImageCropX());
                dto.setWsImageCropY(request.getWsImageCropY());
                dto.setRemoveWorkspaceImage("N");
            } else if (request.isResetWorkspaceImage()) {
                dto.setWsImagePath(null);
                dto.setWsImageOriginalPath(null);
                dto.setWsImageCropScale(null);
                dto.setWsImageCropX(null);
                dto.setWsImageCropY(null);
                dto.setRemoveWorkspaceImage("Y");
            } else {
                dto.setWsImagePath(previousImagePath);
                dto.setWsImageOriginalPath(previousOriginalPath);
                dto.setWsImageCropScale(currentData.getWsImageCropScale());
                dto.setWsImageCropX(currentData.getWsImageCropX());
                dto.setWsImageCropY(currentData.getWsImageCropY());
                dto.setRemoveWorkspaceImage("N");
            }

            final workspaceDTO updateDto = dto;
            boolean saved = persistWorkspaceProfileAndLinks(updateDto, links);
            if (!saved) {
                safeDeleteManagedFile(newlyUploadedPath);
                safeDeleteManagedFile(newlyUploadedOriginalPath);
                return workspaceUpdateResult.fail(
                        "UPDATE_FAILED", "그룹 정보 수정에 실패했습니다.");
            }

            // DB 커밋이 끝난 뒤 이전 파일을 정리한다.
            // 파일 삭제 실패는 이미 완료된 DB 저장 결과를 실패로 뒤집지 않는다.
            boolean imageChanged = newlyUploadedPath != null
                    || request.isResetWorkspaceImage();
            if (imageChanged
                    && previousImagePath != null
                    && !previousImagePath.equals(dto.getWsImagePath())) {
                safeDeleteManagedFile(previousImagePath);
            }
            if ((newlyUploadedOriginalPath != null || request.isResetWorkspaceImage())
                    && previousOriginalPath != null
                    && !previousOriginalPath.equals(dto.getWsImageOriginalPath())) {
                safeDeleteManagedFile(previousOriginalPath);
            }

            return workspaceUpdateResult.success("그룹 정보가 수정되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();

            // 업로드는 DB 트랜잭션 밖의 파일 시스템 작업이므로,
            // DB 저장 실패 시 이번 요청에서 만든 파일을 직접 회수한다.
            safeDeleteManagedFile(newlyUploadedPath);
            safeDeleteManagedFile(newlyUploadedOriginalPath);

            return workspaceUpdateResult.fail(
                    "INTERNAL_ERROR", "그룹 정보 수정 중 오류가 발생했습니다.");
        }
    }

    /**
     * 그룹 기본 정보와 외부 링크 교체를 하나의 DB 트랜잭션으로 처리한다.
     * 링크 삭제 또는 재등록 중 예외가 발생하면 그룹 정보 수정까지 함께 롤백된다.
     */
    private boolean persistWorkspaceProfileAndLinks(
            workspaceDTO dto,
            List<Map<String, Object>> links) {

        TransactionTemplate transactionTemplate =
                new TransactionTemplate(transactionManager);

        Boolean saved = transactionTemplate.execute(status -> {
            int updated = workspaceDao.updateWorkspace(dto);
            if (updated < 1) {
                status.setRollbackOnly();
                return false;
            }

            // 기존 링크 삭제와 새 링크 입력도 같은 트랜잭션에 포함된다.
            replaceWorkspaceLinks(dto.getWsId(), links);
            return true;
        });

        return Boolean.TRUE.equals(saved);
    }

    /**
     * 파일 시스템 정리는 DB 트랜잭션 대상이 아니므로 실패를 별도로 흡수한다.
     * 저장 실패 시 신규 파일 회수, 저장 성공 시 이전 파일 정리에 공통 사용한다.
     */
    private void safeDeleteManagedFile(String path) {
        if (path == null || path.isBlank()) {
            return;
        }

        try {
            fileUploadService.deleteManagedFile(path);
        } catch (Exception cleanupError) {
            cleanupError.printStackTrace();
        }
    }

    private workspaceUpdateResult validateWorkspaceImage(
            MultipartFile file, String label) {
        if (file == null || file.isEmpty()) return null;

        if (file.getSize() > WORKSPACE_IMAGE_MAX_BYTES) {
            return workspaceUpdateResult.fail(
                    "IMAGE_TOO_LARGE",
                    label + "는 10MB 이하의 파일만 업로드할 수 있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null
                || !ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return workspaceUpdateResult.fail(
                    "INVALID_IMAGE_TYPE",
                    label + "는 PNG, JPG, WEBP 형식만 사용할 수 있습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = extractLowercaseExtension(originalFilename);
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            return workspaceUpdateResult.fail(
                    "INVALID_IMAGE_EXTENSION",
                    label + "의 파일 확장자를 확인해 주세요. PNG, JPG, WEBP만 허용됩니다.");
        }

        try {
            byte[] header = new byte[12];
            int headerLength;
            try (InputStream input = file.getInputStream()) {
                headerLength = input.read(header);
            }

            boolean png = isPng(header, headerLength);
            boolean jpeg = isJpeg(header, headerLength);
            boolean webp = isWebp(header, headerLength);

            if (!png && !jpeg && !webp) {
                return workspaceUpdateResult.fail(
                        "INVALID_IMAGE_CONTENT",
                        label + "가 실제 이미지 파일인지 확인해 주세요.");
            }

            if (("image/png".equalsIgnoreCase(contentType) && !png)
                    || ("image/jpeg".equalsIgnoreCase(contentType) && !jpeg)
                    || ("image/webp".equalsIgnoreCase(contentType) && !webp)) {
                return workspaceUpdateResult.fail(
                        "IMAGE_TYPE_MISMATCH",
                        label + "의 파일 형식과 실제 내용이 일치하지 않습니다.");
            }

            // 표준 ImageIO가 지원하는 PNG/JPEG는 실제 디코딩까지 확인한다.
            if (!webp) {
                BufferedImage decoded;
                try (InputStream input = file.getInputStream()) {
                    decoded = ImageIO.read(input);
                }
                if (decoded == null || decoded.getWidth() < 1 || decoded.getHeight() < 1) {
                    return workspaceUpdateResult.fail(
                            "INVALID_IMAGE_CONTENT",
                            label + "를 읽을 수 없습니다. 다른 이미지 파일을 선택해 주세요.");
                }
            }
        } catch (Exception e) {
            return workspaceUpdateResult.fail(
                    "INVALID_IMAGE_CONTENT",
                    label + "를 확인하는 중 오류가 발생했습니다.");
        }

        return null;
    }

    private String extractLowercaseExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase();
    }

    private boolean isPng(byte[] header, int length) {
        return length >= 8
                && (header[0] & 0xff) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4e
                && header[3] == 0x47
                && header[4] == 0x0d
                && header[5] == 0x0a
                && header[6] == 0x1a
                && header[7] == 0x0a;
    }

    private boolean isJpeg(byte[] header, int length) {
        return length >= 3
                && (header[0] & 0xff) == 0xff
                && (header[1] & 0xff) == 0xd8
                && (header[2] & 0xff) == 0xff;
    }

    private boolean isWebp(byte[] header, int length) {
        return length >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P';
    }

    private List<Map<String, Object>> buildValidatedWorkspaceLinks(
            List<String> linkNames, List<String> linkUrls) {
        if (linkNames == null && linkUrls == null) {
            return new ArrayList<>();
        }
        if (linkNames == null || linkUrls == null
                || linkNames.size() != linkUrls.size()) {
            throw new IllegalArgumentException(
                    "링크 이름과 주소를 모두 입력해 주세요.");
        }

        List<Map<String, Object>> links = new ArrayList<>();
        Set<String> normalizedUrls = new HashSet<>();

        for (int i = 0; i < linkNames.size(); i++) {
            String name = normalizeSingleLine(linkNames.get(i));
            String rawUrl = normalizeUrlValue(linkUrls.get(i));

            // 이름과 URL이 모두 비어 있는 행은 저장 대상에서 제외한다.
            if (name.isEmpty() && rawUrl.isEmpty()) {
                continue;
            }
            if (name.isEmpty() || rawUrl.isEmpty()) {
                throw new IllegalArgumentException(
                        "링크 이름과 주소를 모두 입력해 주세요.");
            }
            if (name.length() > 50) {
                throw new IllegalArgumentException(
                        "링크 이름은 50자 이하로 입력해 주세요.");
            }
            if (rawUrl.length() > 500) {
                throw new IllegalArgumentException(
                        "링크 주소는 500자 이하로 입력해 주세요.");
            }

            String normalizedUrl = normalizeExternalUrl(rawUrl);
            String duplicateKey = normalizedUrl.toLowerCase();
            if (!normalizedUrls.add(duplicateKey)) {
                throw new IllegalArgumentException(
                        "같은 링크 주소는 중복해서 등록할 수 없어요.");
            }

            Map<String, Object> link = new HashMap<>();
            link.put("linkName", name);
            link.put("linkUrl", normalizedUrl);
            links.add(link);

            if (links.size() > WORKSPACE_LINK_MAX_COUNT) {
                throw new IllegalArgumentException(
                        "외부 링크는 최대 5개까지 등록할 수 있어요.");
            }
        }
        return links;
    }

    private String normalizeSingleLine(String value) {
        if (value == null) return "";
        return value
                .replace('\u00A0', ' ')
                .replaceAll("[\u200B\uFEFF]", "")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String normalizeMultiline(String value) {
        if (value == null) return null;
        String normalized = value
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replace('\u00A0', ' ')
                .replaceAll("[\u200B\uFEFF]", "")
                .replaceAll("[\\p{Cc}&&[^\\n\\t]]", "");

        String[] lines = normalized.split("\n", -1);
        int start = 0;
        int end = lines.length;
        while (start < end && lines[start].trim().isEmpty()) start++;
        while (end > start && lines[end - 1].trim().isEmpty()) end--;
        if (start == end) return null;

        StringBuilder result = new StringBuilder();
        for (int i = start; i < end; i++) {
            if (i > start) result.append('\n');
            result.append(lines[i].trim());
        }
        String text = result.toString();
        return text.isEmpty() ? null : text;
    }

    private String normalizeUrlValue(String value) {
        if (value == null) return "";
        return value
                .replace('\u00A0', ' ')
                .replaceAll("[\u200B\uFEFF]", "")
                .trim();
    }

    private void replaceWorkspaceLinks(Long wsId, List<Map<String, Object>> links) {
        workspaceDao.deleteWorkspaceLinks(wsId);
        if (links == null || links.isEmpty()) {
            return;
        }

        if (links.size() > WORKSPACE_LINK_MAX_COUNT) {
            throw new IllegalArgumentException(
                    "외부 링크는 최대 5개까지 등록할 수 있어요.");
        }

        Set<String> normalizedUrls = new HashSet<>();
        int order = 0;

        for (Map<String, Object> link : links) {
            String name = normalizeSingleLine(
                    link.get("linkName") == null ? "" : String.valueOf(link.get("linkName")));
            String rawUrl = normalizeUrlValue(
                    link.get("linkUrl") == null ? "" : String.valueOf(link.get("linkUrl")));

            if (name.isEmpty() && rawUrl.isEmpty()) {
                continue;
            }
            if (name.isEmpty() || rawUrl.isEmpty()) {
                throw new IllegalArgumentException(
                        "링크 이름과 주소를 모두 입력해 주세요.");
            }
            if (name.length() > 50 || rawUrl.length() > 500) {
                throw new IllegalArgumentException(
                        "링크 이름 또는 주소의 최대 길이를 확인해 주세요.");
            }

            String normalizedUrl = normalizeExternalUrl(rawUrl);
            if (!normalizedUrls.add(normalizedUrl.toLowerCase())) {
                throw new IllegalArgumentException(
                        "같은 링크 주소는 중복해서 등록할 수 없어요.");
            }

            Map<String, Object> params = new HashMap<>();
            params.put("wsId", wsId);
            params.put("linkName", name);
            params.put("linkUrl", normalizedUrl);
            params.put("sortOrder", order++);
            workspaceDao.insertWorkspaceLink(params);
        }
    }

    private String normalizeExternalUrl(String url) {
        if (url == null) {
            throw new IllegalArgumentException("링크 주소를 입력해 주세요.");
        }

        String value = url.trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("링크 주소를 입력해 주세요.");
        }

        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();

            if (scheme == null
                    || (!"http".equalsIgnoreCase(scheme)
                    && !"https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException(
                        "링크 주소는 http:// 또는 https://로 시작해야 해요.");
            }

            // javascript:, data:, file: 등은 위 스킴 검사에서 차단된다.
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new IllegalArgumentException(
                        "올바른 외부 링크 주소를 입력해 주세요.");
            }

            URI normalized = new URI(
                    scheme.toLowerCase(),
                    uri.getUserInfo(),
                    uri.getHost().toLowerCase(),
                    uri.getPort(),
                    uri.getPath(),
                    uri.getQuery(),
                    uri.getFragment())
                    .normalize();

            return normalized.toASCIIString();
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException(
                    "올바른 외부 링크 주소를 입력해 주세요.");
        }
    }
    
    @Override
    public List<Map<String, Object>> getWorkspaceMembers(Long wsId) {
        return workspaceDao.selectWorkspaceMembers(wsId);
    }

    @Override
    public Map<String, Object> getWorkspaceMemberProfile(Long wsId, Long targetUserId, Long viewerUserId) {
        if (workspaceDao.isWorkspaceMember(wsId, viewerUserId) < 1) {
            return null;
        }
        return workspaceDao.selectWorkspaceMemberProfile(wsId, targetUserId, viewerUserId);
    }

    @Override
    public Map<String, Object> getSavedWorkspaceMemberProfile(
            Long wsId,
            Long userId) {
        if (wsId == null || userId == null) {
            return java.util.Collections.emptyMap();
        }
        Map<String, Object> saved =
                workspaceDao.selectSavedWorkspaceMemberProfile(wsId, userId);
        return saved == null
                ? java.util.Collections.emptyMap()
                : saved;
    }

    @Override
    @Transactional
    public boolean saveMyWorkspaceProfile(Long wsId, Long userId, Map<String, Object> profile) {
        if (wsId == null || userId == null || profile == null) return false;
        if (workspaceDao.selectWorkspaceDetail(wsId) == null) return false;
        if (workspaceDao.isWorkspaceMember(wsId, userId) < 1) return false;

        String useAccount = "N".equalsIgnoreCase(
                String.valueOf(profile.getOrDefault("useAccountProfile", "Y"))) ? "N" : "Y";
        String displayName = trimToNull(profile.get("displayName"), 50);
        String contactEmail = trimToNull(profile.get("contactEmail"), 100);
        String positionName = trimToNull(profile.get("positionName"), 50);
        String phoneNumber = trimToNull(profile.get("phoneNumber"), 30);
        String profileImagePath = trimToNull(profile.get("profileImagePath"), 500);
        String profileImageOriginalPath =
                trimToNull(profile.get("profileImageOriginalPath"), 500);
        Double profileImageCropScale = toNullableDouble(
                profile.get("profileImageCropScale"));
        Double profileImageCropX = toNullableDouble(
                profile.get("profileImageCropX"));
        Double profileImageCropY = toNullableDouble(
                profile.get("profileImageCropY"));
        String showPhone = "Y".equalsIgnoreCase(
                String.valueOf(profile.getOrDefault("showPhone", "N"))) ? "Y" : "N";
        String showBirth = "N".equalsIgnoreCase(
                String.valueOf(profile.getOrDefault("showBirth", "Y"))) ? "N" : "Y";
        String removeProfileImage = "Y".equalsIgnoreCase(
                String.valueOf(profile.getOrDefault("removeProfileImage", "N")))
                ? "Y"
                : "N";

        validateMaxLength(profile.get("displayName"), 50, "그룹 표시 이름");
        validateMaxLength(profile.get("contactEmail"), 100, "그룹 이메일");
        validateMaxLength(profile.get("positionName"), 50, "그룹에서의 역할");
        validateMaxLength(profile.get("phoneNumber"), 30, "전화번호");
        validateProfileCropValue(profileImageCropScale, 0.1D, 5D, "이미지 확대값");
        validateProfileCropValue(profileImageCropX, -2000D, 2000D, "이미지 가로 위치");
        validateProfileCropValue(profileImageCropY, -2000D, 2000D, "이미지 세로 위치");

        if ("Y".equals(removeProfileImage)) {
            profileImagePath = null;
            profileImageOriginalPath = null;
            profileImageCropScale = 1D;
            profileImageCropX = 0D;
            profileImageCropY = 0D;
        }

        if ("N".equals(useAccount) && displayName == null) {
            throw new IllegalArgumentException("그룹 표시 이름을 입력해 주세요.");
        }
        if (contactEmail == null
                || !contactEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("올바른 그룹 이메일을 입력해 주세요.");
        }
        if (phoneNumber != null && !phoneNumber.matches("^[0-9+()\\-\\s]{7,30}$")) {
            throw new IllegalArgumentException("전화번호 형식을 확인해 주세요.");
        }
        if (phoneNumber == null) showPhone = "N";

        Map<String, Object> params = new HashMap<>();
        params.put("wsId", wsId);
        params.put("userId", userId);
        params.put("useAccountProfile", useAccount);
        // 계정 모드에서도 기존 그룹 전용 값은 보존해 다시 전용 모드로 전환할 수 있다.
        params.put("displayName", displayName);
        params.put("profileImagePath", profileImagePath);
        params.put("profileImageOriginalPath", profileImageOriginalPath);
        params.put("profileImageCropScale", profileImageCropScale);
        params.put("profileImageCropX", profileImageCropX);
        params.put("profileImageCropY", profileImageCropY);
        params.put("removeProfileImage", removeProfileImage);
        params.put("contactEmail", contactEmail);
        params.put("positionName", positionName);
        params.put("phoneNumber", phoneNumber);
        params.put("showPhone", showPhone);
        params.put("showBirth", showBirth);

        int updated = workspaceDao.updateWorkspaceMemberProfile(params);
        if (updated > 0) return true;

        try {
            return workspaceDao.insertWorkspaceMemberProfile(params) > 0;
        } catch (org.springframework.dao.DuplicateKeyException duplicate) {
            return workspaceDao.updateWorkspaceMemberProfile(params) > 0;
        }
    }


    private void validateMaxLength(Object value, int maxLength, String label) {
        if (value == null) return;
        String text = String.valueOf(value).trim();
        if (text.length() > maxLength) {
            throw new IllegalArgumentException(
                    label + "은(는) " + maxLength + "자 이하로 입력해 주세요.");
        }
    }

    private void validateProfileCropValue(
            Double value,
            double minimum,
            double maximum,
            String label) {
        if (value == null) return;
        if (!Double.isFinite(value) || value < minimum || value > maximum) {
            throw new IllegalArgumentException(label + "이(가) 올바르지 않습니다.");
        }
    }

    private Double toNullableDouble(Object value) {
        if (value == null) return null;
        try {
            double number = Double.parseDouble(String.valueOf(value));
            return Double.isFinite(number) ? number : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, Object> buildWorkspaceProfileParams(
            Long wsId,
            Long userId,
            Map<String, Object> profile) {

        Map<String, Object> source =
                profile != null ? profile : java.util.Collections.emptyMap();

        String useAccount =
                String.valueOf(source.getOrDefault("useAccountProfile", "Y"));
        String showPhone =
                String.valueOf(source.getOrDefault("showPhone", "N"));
        String showBirth =
                String.valueOf(source.getOrDefault("showBirth", "Y"));

        if (!"Y".equals(useAccount) && !"N".equals(useAccount)) {
            useAccount = "Y";
        }
        if (!"Y".equals(showPhone) && !"N".equals(showPhone)) {
            showPhone = "N";
        }
        if (!"Y".equals(showBirth) && !"N".equals(showBirth)) {
            showBirth = "Y";
        }

        String displayName = trimToNull(source.get("displayName"), 50);
        if ("N".equals(useAccount) && displayName == null) {
            throw new IllegalArgumentException("워크스페이스 표시 이름이 필요합니다.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("wsId", wsId);
        params.put("userId", userId);
        params.put("useAccountProfile", useAccount);
        params.put("displayName", displayName);
        params.put("profileImagePath",
                trimToNull(source.get("profileImagePath"), 500));
        params.put("profileImageOriginalPath",
                trimToNull(source.get("profileImageOriginalPath"), 500));
        params.put("profileImageCropScale",
                toNullableDouble(source.get("profileImageCropScale")));
        params.put("profileImageCropX",
                toNullableDouble(source.get("profileImageCropX")));
        params.put("profileImageCropY",
                toNullableDouble(source.get("profileImageCropY")));

        String removeProfileImage = "Y".equalsIgnoreCase(
                String.valueOf(
                        source.getOrDefault("removeProfileImage", "N")
                )
        ) ? "Y" : "N";
        params.put("removeProfileImage", removeProfileImage);

        params.put("contactEmail", trimToNull(source.get("contactEmail"), 100));
        params.put("positionName", trimToNull(source.get("positionName"), 50));
        params.put("phoneNumber", trimToNull(source.get("phoneNumber"), 30));
        params.put("showPhone", showPhone);
        params.put("showBirth", showBirth);
        return params;
    }

    private String trimToNull(Object value, int maxLength) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) return null;
        return text.length() > maxLength ? text.substring(0, maxLength) : text;
    }
    

    
    @Override
    @Transactional
    public String inviteUserByEmail(Long wsId, Long inviterId, String inviteeEmail) {
        if (wsId == null || inviterId == null || inviteeEmail == null) {
            return "INVALID_REQUEST";
        }

        String normalizedEmail = inviteeEmail.trim().toLowerCase();
        if (normalizedEmail.isEmpty()) {
            return "INVALID_REQUEST";
        }

        usersDto invitee = usersDao.findByEmail(normalizedEmail);
        if (invitee == null) {
            return "NOT_FOUND";
        }

        if (inviterId.equals(invitee.getUserId())) {
            return "SELF_INVITE";
        }

        if (workspaceDao.isWorkspaceMember(wsId, invitee.getUserId()) > 0) {
            return "ALREADY_MEMBER";
        }

        int exists = workspaceDao.checkInvitationExists(wsId, invitee.getUserId());
        if (exists > 0) {
            return "ALREADY_EXISTS";
        }

        int inserted = workspaceDao.insertInvitation(
                wsId, inviterId, invitee.getUserId());

        return inserted > 0 ? "SUCCESS" : "ERROR";
    }
    
    private void upsertWorkspaceMemberProfile(
            Map<String, Object> profileParams) {
        if (profileParams == null) {
            throw new IllegalArgumentException("프로필 정보가 없습니다.");
        }

        profileParams.putIfAbsent("removeProfileImage", "N");
        profileParams.putIfAbsent("profileImageOriginalPath", null);
        profileParams.putIfAbsent("profileImageCropScale", null);
        profileParams.putIfAbsent("profileImageCropX", null);
        profileParams.putIfAbsent("profileImageCropY", null);

        int updated = workspaceDao.updateWorkspaceMemberProfile(profileParams);
        if (updated > 0) return;
        try {
            workspaceDao.insertWorkspaceMemberProfile(profileParams);
        } catch (org.springframework.dao.DuplicateKeyException duplicate) {
            workspaceDao.updateWorkspaceMemberProfile(profileParams);
        }
    }

    @Override
    @Transactional
    public String joinOpenWorkspace(Long wsId, Long userId, Map<String, Object> profile) {
        if (wsId == null || userId == null) return "INVALID_REQUEST";

        workspaceDTO workspace = workspaceDao.selectWorkspaceDetail(wsId);
        if (workspace == null) return "NOT_FOUND";
        if (!"ACTIVE".equalsIgnoreCase(workspace.getStatus())) return "UNAVAILABLE";
        if (!"OPEN".equalsIgnoreCase(workspace.getJoinType())) return "NOT_OPEN";
        if (workspaceDao.isWorkspaceMember(wsId, userId) > 0) return "ALREADY_MEMBER";

        Map<String, Object> profileParams = buildWorkspaceProfileParams(wsId, userId, profile);
        workspaceDao.insertWorkspaceMember(wsId, userId, "MEMBER");
        upsertWorkspaceMemberProfile(profileParams);
        return "SUCCESS";
    }

    @Override
    @Transactional
    public String requestJoinWorkspace(Long wsId, Long userId) {
        if (wsId == null || userId == null) return "INVALID_REQUEST";

        workspaceDTO workspace = workspaceDao.selectWorkspaceDetail(wsId);
        if (workspace == null) return "NOT_FOUND";
        if (!"ACTIVE".equalsIgnoreCase(workspace.getStatus())) return "UNAVAILABLE";
        if (!"APPROVAL".equalsIgnoreCase(workspace.getJoinType())) return "NOT_APPROVAL";
        if (workspaceDao.isWorkspaceMember(wsId, userId) > 0) return "ALREADY_MEMBER";
        if (workspaceDao.countPendingJoinRequest(wsId, userId) > 0) return "ALREADY_PENDING";

        int inserted = workspaceDao.insertJoinRequest(wsId, userId);
        if (inserted < 1) return "ERROR";
        workspaceDao.insertJoinRequestNotices(wsId, userId);
        return "SUCCESS";
    }

    @Override
    @Transactional
    public String cancelJoinRequest(Long wsId, Long userId) {
        if (wsId == null || userId == null) return "INVALID_REQUEST";
        if (workspaceDao.isWorkspaceMember(wsId, userId) > 0) return "ALREADY_MEMBER";
        int updated = workspaceDao.cancelJoinRequest(wsId, userId);
        return updated > 0 ? "SUCCESS" : "NOT_PENDING";
    }

    @Override
    public String getJoinRequestStatus(Long wsId, Long userId) {
        if (wsId == null || userId == null) return null;
        return workspaceDao.selectJoinRequestStatus(wsId, userId);
    }

    @Override
    public List<Map<String, Object>> getPendingJoinRequestsForAdmin(Long userId) {
        if (userId == null) return java.util.Collections.emptyList();
        return workspaceDao.selectPendingJoinRequestsForAdmin(userId);
    }

    @Override
    @Transactional
    public String respondJoinRequest(Long requestId, String status, Long reviewerId, String rejectionReason) {
        if (requestId == null || reviewerId == null || status == null) {
            return "INVALID_REQUEST";
        }

        String normalizedStatus = status.trim().toUpperCase();
        if (!"APPROVED".equals(normalizedStatus) && !"REJECTED".equals(normalizedStatus)) {
            return "INVALID_STATUS";
        }

        Map<String, Object> request = workspaceDao.selectJoinRequestById(requestId);
        if (request == null) return "NOT_FOUND";
        if (!"PENDING".equalsIgnoreCase(String.valueOf(request.get("STATUS") != null ? request.get("STATUS") : request.get("status")))) {
            return "ALREADY_PROCESSED";
        }

        Object wsValue = request.get("WSID") != null ? request.get("WSID")
                : (request.get("WS_ID") != null ? request.get("WS_ID") : request.get("wsId"));
        if (wsValue == null) return "NOT_FOUND";
        Long wsId = Long.valueOf(String.valueOf(wsValue));
        if (workspaceDao.isWorkspaceAdmin(wsId, reviewerId) < 1) return "FORBIDDEN";

        String normalizedReason = null;
        if ("REJECTED".equals(normalizedStatus) && rejectionReason != null) {
            normalizedReason = rejectionReason.trim();
            if (normalizedReason.isEmpty()) {
                normalizedReason = null;
            } else if (normalizedReason.length() > 300) {
                normalizedReason = normalizedReason.substring(0, 300);
            }
        }

        int updated = workspaceDao.updateJoinRequestStatus(requestId, normalizedStatus, reviewerId);
        if (updated < 1) return "ALREADY_PROCESSED";

        // 승인 또는 거절이 끝난 요청은 그룹장·관리자의 처리 대기 알림에서 제거합니다.
        workspaceDao.deleteJoinRequestManagerNotices(requestId);

        // 같은 사용자·그룹의 참여 생명주기 알림은 최신 상태 1건만 유지합니다.
        workspaceDao.deleteJoinRequestResultNotices(requestId);
        workspaceDao.insertJoinRequestResultNotice(requestId, normalizedStatus, normalizedReason);
        return "SUCCESS";
    }

    @Override
    @Transactional
    public String completeApprovedJoinRequest(Long requestId, Long userId, Map<String, Object> profile) {
        if (requestId == null || userId == null) return "INVALID_REQUEST";

        Map<String, Object> request = workspaceDao.selectJoinRequestById(requestId);
        if (request == null) return "NOT_FOUND";

        Object requesterValue = request.get("REQUESTERID") != null ? request.get("REQUESTERID")
                : (request.get("REQUESTER_ID") != null ? request.get("REQUESTER_ID") : request.get("requesterId"));
        if (requesterValue == null || !userId.equals(Long.valueOf(String.valueOf(requesterValue)))) {
            return "FORBIDDEN";
        }

        Object statusValue = request.get("STATUS") != null ? request.get("STATUS") : request.get("status");
        if (!"APPROVED".equalsIgnoreCase(String.valueOf(statusValue))) {
            return "NOT_APPROVED";
        }

        Object wsValue = request.get("WSID") != null ? request.get("WSID")
                : (request.get("WS_ID") != null ? request.get("WS_ID") : request.get("wsId"));
        if (wsValue == null) return "NOT_FOUND";
        Long wsId = Long.valueOf(String.valueOf(wsValue));

        workspaceDTO workspace = workspaceDao.selectWorkspaceDetail(wsId);
        if (workspace == null) return "NOT_FOUND";
        if (!"ACTIVE".equalsIgnoreCase(workspace.getStatus())) return "UNAVAILABLE";

        if (workspaceDao.isWorkspaceMember(wsId, userId) > 0) {
            workspaceDao.completeApprovedJoinRequest(requestId, userId);
            workspaceDao.deleteJoinRequestResultNotices(requestId);
            workspaceDao.insertJoinCompletedNotice(requestId);
            return "ALREADY_MEMBER";
        }

        Map<String, Object> profileParams = buildWorkspaceProfileParams(wsId, userId, profile);
        workspaceDao.insertWorkspaceMember(wsId, userId, "MEMBER");
        upsertWorkspaceMemberProfile(profileParams);

        int completed = workspaceDao.completeApprovedJoinRequest(requestId, userId);
        if (completed < 1) {
            throw new IllegalStateException("JOIN_REQUEST_COMPLETE_FAILED");
        }
        workspaceDao.deleteJoinRequestResultNotices(requestId);
        workspaceDao.insertJoinCompletedNotice(requestId);
        return "SUCCESS";
    }

    @Override
    @Transactional
    public String abandonApprovedJoinRequest(Long requestId, Long userId) {
        if (requestId == null || userId == null) return "INVALID_REQUEST";

        Map<String, Object> request = workspaceDao.selectJoinRequestById(requestId);
        if (request == null) return "NOT_FOUND";

        Object requesterValue = request.get("REQUESTERID") != null ? request.get("REQUESTERID")
                : (request.get("REQUESTER_ID") != null ? request.get("REQUESTER_ID") : request.get("requesterId"));
        if (requesterValue == null || !userId.equals(Long.valueOf(String.valueOf(requesterValue)))) {
            return "FORBIDDEN";
        }

        Object statusValue = request.get("STATUS") != null ? request.get("STATUS") : request.get("status");
        if (!"APPROVED".equalsIgnoreCase(String.valueOf(statusValue))) {
            return "NOT_APPROVED";
        }

        Object wsValue = request.get("WSID") != null ? request.get("WSID")
                : (request.get("WS_ID") != null ? request.get("WS_ID") : request.get("wsId"));
        if (wsValue == null) return "NOT_FOUND";
        Long wsId = Long.valueOf(String.valueOf(wsValue));

        if (workspaceDao.isWorkspaceMember(wsId, userId) > 0) {
            return "ALREADY_MEMBER";
        }

        int updated = workspaceDao.abandonApprovedJoinRequest(requestId, userId);
        if (updated < 1) return "ALREADY_PROCESSED";

        // 승인 알림을 포함한 같은 그룹의 이전 참여 결과를 제거하고,
        // 요청함 전체 알림에 참여 포기 이력 1건만 남깁니다.
        workspaceDao.deleteJoinRequestResultNotices(requestId);
        workspaceDao.insertJoinAbandonedNotice(requestId);
        return "SUCCESS";
    }

    @Override
    public List<Map<String, Object>> getPendingInvitations(Long userId) {
        return workspaceDao.selectPendingInvitations(userId);
    }
    
    @Override
    @Transactional
    public boolean processInvitation(Long inviteId,
                                     String status,
                                     Long userId,
                                     Map<String, Object> profile) {
        Map<String, Object> inviteInfo = workspaceDao.selectInvitationById(inviteId);
        if (inviteInfo == null) return false;

        Object inviteeValue = inviteInfo.get("INVITEE_ID");
        if (inviteeValue == null || !userId.equals(Long.valueOf(inviteeValue.toString()))) {
            return false;
        }

        if (!"ACCEPTED".equals(status) && !"REJECTED".equals(status)) {
            return false;
        }

        int updated = workspaceDao.updateInvitationStatus(inviteId, status);
        if (updated < 1) return false;

        if ("ACCEPTED".equals(status)) {
            Long wsId = Long.valueOf(inviteInfo.get("WS_ID").toString());
            if (workspaceDao.isWorkspaceMember(wsId, userId) < 1) {
                workspaceDao.insertWorkspaceMember(wsId, userId, "MEMBER");
            }

            Map<String, Object> profileParams =
                    buildWorkspaceProfileParams(wsId, userId, profile);
            upsertWorkspaceMemberProfile(profileParams);
        }

        return true;
    }

    @Override
    @Transactional // 중요: 하나라도 실패하면 전체 롤백
    public boolean removeMember(Long wsId, Long userId) {
        // 해당 워크스페이스에서 특정 멤버 삭제
        return workspaceDao.deleteWorkspaceMember(wsId, userId) > 0;
    }

    @Override
    @Transactional
    public boolean transferAdmin(Long wsId, Long currentAdminId, Long newAdminId) {
        try {
            // 1. 기존 그룹장은 관리자 권한을 유지
            workspaceDao.updateMemberRole(wsId, currentAdminId, "ADMIN");
            
            // 2. 새로운 그룹장의 역할을 'ADMIN'으로 변경
            workspaceDao.updateMemberRole(wsId, newAdminId, "ADMIN");
            
            // 3. WORKSPACES 테이블의 OWNER_ID도 새로운 그룹장로 변경
            workspaceDao.updateWorkspaceOwner(wsId, newAdminId);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false; 
        }
    }

    @Override
    public Map<String, Object> getCommunitySummary(Long wsId) {
        Map<String, Object> summary = workspaceDao.selectCommunitySummary(wsId);
        return summary != null ? summary : new java.util.HashMap<>();
    }

    @Override
    public List<Map<String, Object>> getRecentCommunityActivities(Long wsId) {
        List<Map<String, Object>> activities = workspaceDao.selectRecentCommunityActivities(wsId);
        return activities != null ? activities : new java.util.ArrayList<>();
    }

    @Override
    public List<Map<String, Object>> getEventsByWsId(Long wsId) {
        // 예시: workspaceDao에 해당 기능을 구현하거나 
        // 이미 존재하는 calendarDao를 활용하여 워크스페이스 ID로 이벤트를 조회합니다.
        return workspaceDao.selectEventsByWsId(wsId);
    }
 // 1. 오늘의 일정 가져오기
    @Override
    public List<Map<String, Object>> getTodayEvents(Long wsId) {
        // DAO에서 날짜가 오늘인 일정만 가져오는 쿼리 실행
        return workspaceDao.selectTodayEvents(wsId);
    }

    // 2. 진행 중인 투표 가져오기
    @Override
    public Map<String, Object> getActivePoll(Long wsId) {
        Map<String, Object> poll = workspaceDao.selectActivePoll(wsId);
        
        // 데이터가 없으면 빈 맵을 반환 (JSON 응답이 {}가 됨)
        if (poll == null) {
            return new java.util.HashMap<>(); 
        }
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("pollId", ((Number) poll.get("POLL_ID")).longValue());
        result.put("question", poll.get("QUESTION"));
        
        // 옵션 조회
        List<Map<String, Object>> options = workspaceDao.selectPollOptions((Long)result.get("pollId"));
        // 옵션이 없을 경우를 대비해 빈 리스트라도 넣어줌
        result.put("options", options != null ? options : new java.util.ArrayList<>());
        
        return result;
    }
    // 3. 투표 반영하기
    @Override
    @Transactional
    public void processVote(Map<String, Object> params) {
        // 투표 이력을 저장하기만 하면 됩니다.
        // 데이터가 insert 될 때마다 위의 selectPollOptions 쿼리가 자동으로 최신 투표수를 계산합니다.
        workspaceDao.insertVote(params);
    }
    @Override
    @Transactional
    public void createPoll(Map<String, Object> params) {
        workspaceDao.insertPoll(params); // 이제 정상적으로 IworkspaceDAO를 탐색함
        Long pollId = ((Number) params.get("pollId")).longValue();
        
        List<String> options = (List<String>) params.get("options");
        for (String text : options) {
            Map<String, Object> option = new HashMap<>();
            option.put("pollId", pollId);
            option.put("text", text);
            option.put("count", 0);
            workspaceDao.insertPollOption(option);
        }
    }
}