package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;

@Service
public class UserService {
    @Autowired
    private IusersDao usersDao;

    public List<usersDto> getAllUsers() {
        return usersDao.findAll();
    }

    @Transactional
    public void registerUser(usersDto user) {
        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("ACTIVE");
        }
        if (user.getUserRole() == null || user.getUserRole().trim().isEmpty()) {
            user.setUserRole("USER");
        }
        if (user.getBirthCalendarType() == null || user.getBirthCalendarType().trim().isEmpty()) {
            user.setBirthCalendarType("SOLAR");
        }
        if (user.getBirthPublicYn() == null || user.getBirthPublicYn().trim().isEmpty()) {
            user.setBirthPublicYn("Y");
        }
        if (user.getProfileAvatarType() == null || user.getProfileAvatarType().trim().isEmpty()) {
            user.setProfileAvatarType(user.getProfileImagePath() == null ? "DEFAULT" : "IMAGE");
        }
        usersDao.insertUser(user);
        usersDao.upsertNotificationSettings(user);
        if ("IMAGE".equals(user.getProfileAvatarType()) && user.getProfileImagePath() != null) {
            usersDao.clearCurrentProfileImages(user.getUserId());
            usersDao.insertProfileImageHistory(user);
        }
    }

    public boolean isEmailDuplicated(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return usersDao.findByEmail(email.trim()) != null;
    }

    public usersDto login(usersDto user) {
        return usersDao.login(user);
    }

    public usersDto findById(Long userId) {
        if (userId == null) {
            return null;
        }
        return usersDao.findById(userId);
    }

    @Transactional
    public void updateProfile(usersDto user) {
        usersDao.updateUser(user);
        usersDao.upsertNotificationSettings(user);
        if ("IMAGE".equals(user.getProfileAvatarType()) && user.getProfileImagePath() != null) {
            usersDao.clearCurrentProfileImages(user.getUserId());
            usersDao.insertProfileImageHistory(user);
        } else if ("DEFAULT".equals(user.getProfileAvatarType())) {
            usersDao.clearCurrentProfileImages(user.getUserId());
        }
    }

    public List<Map<String, Object>> getProfileImageHistory(Long userId) {
        return usersDao.findProfileImageHistory(userId);
    }

    public List<Map<String, Object>> getProfileLinks(Long userId) {
        if (userId == null) {
            return java.util.Collections.emptyList();
        }
        return usersDao.findProfileLinks(userId);
    }

    @Transactional
    public void replaceProfileLinks(Long userId, List<Map<String, Object>> links) {
        if (userId == null) {
            throw new IllegalArgumentException("사용자 정보를 확인할 수 없습니다.");
        }
        usersDao.deleteProfileLinks(userId);
        if (links == null) return;

        int sortOrder = 0;
        for (Map<String, Object> link : links) {
            if (link == null) continue;
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("userId", userId);
            params.put("linkName", link.get("linkName"));
            params.put("linkUrl", link.get("linkUrl"));
            params.put("sortOrder", sortOrder++);
            usersDao.insertProfileLink(params);
        }
    }

    @Transactional
    public void restoreProfileImage(usersDto user, Long profileImageId) {
        if (user == null || user.getUserId() == null || profileImageId == null) {
            throw new IllegalArgumentException("복원할 프로필 사진을 찾을 수 없습니다.");
        }
        Map<String, Object> history = usersDao.findProfileImageHistoryById(user.getUserId(), profileImageId);
        if (history == null) {
            throw new IllegalArgumentException("복원할 프로필 사진을 찾을 수 없습니다.");
        }
        user.setProfileAvatarType("IMAGE");
        user.setProfileImagePath(asString(firstMapValue(history, "profileImagePath", "PROFILEIMAGEPATH", "CROPPED_IMAGE_PATH")));
        user.setProfileOriginalImagePath(asString(firstMapValue(history, "profileOriginalImagePath", "PROFILEORIGINALIMAGEPATH", "ORIGINAL_IMAGE_PATH")));
        user.setProfileCropScale(asDouble(firstMapValue(history, "profileCropScale", "PROFILECROPSCALE", "CROP_SCALE")));
        user.setProfileCropX(asDouble(firstMapValue(history, "profileCropX", "PROFILECROPX", "CROP_X")));
        user.setProfileCropY(asDouble(firstMapValue(history, "profileCropY", "PROFILECROPY", "CROP_Y")));
        usersDao.updateUser(user);
        usersDao.clearCurrentProfileImages(user.getUserId());
        usersDao.markProfileImageCurrent(user.getUserId(), profileImageId);
    }

    private Object firstMapValue(Map<String, Object> map, String... keys) {
        if (map == null || keys == null) return null;
        for (String key : keys) {
            if (map.containsKey(key)) return map.get(key);
        }
        return null;
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Double asDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }


    /**
     * 현재 비밀번호 검증은 로그인과 같은 DAO/login 조건을 그대로 사용한다.
     * 계정 설정에서 별도 COUNT 쿼리로 직접 비교하면 로그인은 되는데
     * 비밀번호 변경/탈퇴에서 불일치가 나는 상황이 생길 수 있다.
     */
    private boolean matchesCurrentPassword(Long userId, String currentPassword) {
        if (userId == null) return false;

        String current = currentPassword == null ? "" : currentPassword.trim();
        if (current.isEmpty()) return false;

        usersDto storedUser = usersDao.findById(userId);
        if (storedUser == null || storedUser.getEmail() == null) return false;

        usersDto loginProbe = new usersDto();
        loginProbe.setEmail(storedUser.getEmail());
        loginProbe.setPwdHash(current);

        usersDto matchedUser = usersDao.login(loginProbe);
        return matchedUser != null && userId.equals(matchedUser.getUserId());
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        String current = currentPassword == null ? "" : currentPassword.trim();
        String next = newPassword == null ? "" : newPassword.trim();
        String confirm = confirmPassword == null ? "" : confirmPassword.trim();

        if (current.isEmpty()) {
            throw new IllegalArgumentException("현재 비밀번호를 입력해주세요.");
        }
        if (next.length() < 4) {
            throw new IllegalArgumentException("새 비밀번호는 4자리 이상 입력해주세요.");
        }
        if (!next.equals(confirm)) {
            throw new IllegalArgumentException("새 비밀번호 확인이 일치하지 않습니다.");
        }
        if (current.equals(next)) {
            throw new IllegalArgumentException("현재 비밀번호와 다른 비밀번호를 입력해주세요.");
        }
        if (!matchesCurrentPassword(userId, current)) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        usersDao.updatePassword(userId, next);
    }



    @Transactional
    public void requestWithdrawal(Long userId, String currentPassword) {
        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        String current = currentPassword == null ? "" : currentPassword.trim();
        if (current.isEmpty()) {
            throw new IllegalArgumentException("현재 비밀번호를 입력해주세요.");
        }
        if (!matchesCurrentPassword(userId, current)) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        usersDao.requestWithdrawal(userId);
    }

    @Transactional
    public void cancelWithdrawal(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (usersDao.countCancelableWithdrawal(userId) < 1) {
            throw new IllegalArgumentException("복구 가능한 탈퇴 대기 계정이 아닙니다.");
        }
        usersDao.cancelWithdrawal(userId);
    }

    public usersDto completeJoinProcess(usersDto user) {
        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("ACTIVE");
        }
        usersDao.updateUser(user);
        return usersDao.login(user);
    }

    public List<workspaceDTO> getWorkspacesByUserId(Long userId) {
        return usersDao.findWorkspacesByUserId(userId);
    }
}
