package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.util.UserProfileValidator;

@Service
public class UserService {
    @Autowired
    private IusersDao usersDao;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private LoginFailureService loginFailureService;

    @Value("${moyo.security.login.max-failures:5}")
    private int maxLoginFailures;

    @Value("${moyo.security.login.lock-minutes:15}")
    private int loginLockMinutes;

    public List<usersDto> getAllUsers() {
        return usersDao.findAll();
    }

    @Transactional
    public void registerUser(usersDto user) {
        user.setUserName(UserProfileValidator.normalizeRequiredName(user.getUserName()));
        user.setBirthDate(UserProfileValidator.normalizeOptionalBirthDate(user.getBirthDate()));
        user.setBirthCalendarType(UserProfileValidator.normalizeBirthCalendarType(user.getBirthCalendarType()));

        String rawPassword = user.getPwdHash() == null ? "" : user.getPwdHash().trim();
        if (rawPassword.isEmpty()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }
        validatePasswordPolicy(rawPassword);
        user.setPwdHash(passwordEncoder.encode(rawPassword));

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

    @Transactional
    public usersDto login(usersDto user) {
        if (user == null) return null;

        String email = user.getEmail() == null ? "" : user.getEmail().trim();
        String rawPassword = user.getPwdHash() == null ? "" : user.getPwdHash().trim();
        if (email.isEmpty() || rawPassword.isEmpty()) return null;

        usersDto authUser = usersDao.findAuthByEmail(email);
        if (authUser == null || authUser.getPwdHash() == null) return null;

        Long userId = authUser.getUserId();

        // 잠금 시간이 지난 계정은 실패 횟수와 임시 잠금을 자동 초기화한다.
        loginFailureService.clearExpiredLoginLock(userId);

        // 임시 잠금 중에는 비밀번호 해시 비교 자체를 하지 않는다.
        if (loginFailureService.countActiveLoginLock(userId) > 0) {
            throw new LoginTemporarilyBlockedException();
        }

        String storedPassword = authUser.getPwdHash();
        if (!passwordMatches(rawPassword, storedPassword)) {
            loginFailureService.recordLoginFailure(userId, maxLoginFailures, loginLockMinutes);

            if (loginFailureService.countActiveLoginLock(userId) > 0) {
                throw new LoginTemporarilyBlockedException();
            }
            return null;
        }

        // 정상 비밀번호 입력 시 이전 실패 기록을 즉시 초기화한다.
        loginFailureService.resetLoginFailures(userId);

        // 기존 평문 계정은 비밀번호 검증 성공 시 BCrypt로 자동 마이그레이션한다.
        if (!isBcryptHash(storedPassword)) {
            usersDao.updatePassword(userId, passwordEncoder.encode(rawPassword));
        }

        usersDto loginUser = usersDao.findById(userId);
        if (loginUser == null) return null;

        String status = loginUser.getStatus() == null
                ? ""
                : loginUser.getStatus().trim().toUpperCase();

        // 로그인은 ACTIVE만 허용한다. 알 수 없는 신규 상태도 기본 차단한다.
        if (!"ACTIVE".equals(status)) {
            if ("WITHDRAW_PENDING".equals(status)
                    && usersDao.countCancelableWithdrawal(loginUser.getUserId()) < 1) {
                throw new AccountStatusLoginException(loginUser.getUserId(), "WITHDRAW_EXPIRED");
            }
            throw new AccountStatusLoginException(loginUser.getUserId(), status.isEmpty() ? "UNKNOWN" : status);
        }

        return loginUser;
    }

    public usersDto findById(Long userId) {
        if (userId == null) {
            return null;
        }
        return usersDao.findById(userId);
    }

    @Transactional
    public void updateProfile(usersDto user) {
        if (user.getUserName() != null) {
            user.setUserName(UserProfileValidator.normalizeRequiredName(user.getUserName()));
        }
        if (user.getBirthDate() != null) {
            String normalizedBirthDate = UserProfileValidator.normalizeOptionalBirthDate(user.getBirthDate());
            user.setBirthDate(normalizedBirthDate == null ? "" : normalizedBirthDate);
        }
        if (user.getBirthCalendarType() != null) {
            user.setBirthCalendarType(UserProfileValidator.normalizeBirthCalendarType(user.getBirthCalendarType()));
        }

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
     * BCrypt 계정과 이전 평문 계정을 모두 검증한다.
     * 이전 평문 계정은 비밀번호 확인에 성공한 시점에 BCrypt로 자동 변환한다.
     */
    private boolean matchesCurrentPassword(Long userId, String currentPassword) {
        if (userId == null) return false;

        String current = currentPassword == null ? "" : currentPassword.trim();
        if (current.isEmpty()) return false;

        String storedPassword = usersDao.findPasswordHashByUserId(userId);
        if (storedPassword == null || !passwordMatches(current, storedPassword)) return false;

        if (!isBcryptHash(storedPassword)) {
            usersDao.updatePassword(userId, passwordEncoder.encode(current));
        }
        return true;
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) return false;
        if (isBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        // 3단계 전환 기간에만 기존 평문 계정 호환용으로 사용한다.
        return rawPassword.equals(storedPassword);
    }

    private boolean isBcryptHash(String value) {
        return value != null
                && (value.startsWith("$2a$")
                    || value.startsWith("$2b$")
                    || value.startsWith("$2y$"));
    }

    /**
     * MOYO 공통 비밀번호 정책.
     * 회원가입/마이페이지 변경/비밀번호 재설정에서 모두 같은 규칙을 사용한다.
     */
    public void validatePasswordPolicy(String rawPassword) {
        String password = rawPassword == null ? "" : rawPassword.trim();
        if (password.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 8자리 이상 입력해주세요.");
        }
        if (password.length() > 72) {
            throw new IllegalArgumentException("비밀번호는 72자리 이하로 입력해주세요.");
        }
        if (!password.matches(".*[A-Za-z].*")) {
            throw new IllegalArgumentException("비밀번호에 영문을 1자 이상 포함해주세요.");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("비밀번호에 숫자를 1자 이상 포함해주세요.");
        }
        if (!password.matches(".*[^A-Za-z0-9\\s].*")) {
            throw new IllegalArgumentException("비밀번호에 특수문자를 1자 이상 포함해주세요.");
        }
    }

    private boolean isRecentlyUsedPassword(Long userId, String rawPassword, String currentStoredPassword) {
        if (currentStoredPassword != null && passwordMatches(rawPassword, currentStoredPassword)) {
            return true;
        }

        List<String> recentHashes = usersDao.findRecentPasswordHashes(userId);
        if (recentHashes == null) return false;
        for (String previousHash : recentHashes) {
            if (previousHash != null && passwordEncoder.matches(rawPassword, previousHash)) {
                return true;
            }
        }
        return false;
    }

    private void saveCurrentPasswordToHistory(Long userId, String storedPassword) {
        if (userId == null || storedPassword == null || storedPassword.isBlank()) return;

        // 과거 평문 계정이 남아 있어도 비밀번호 이력에는 평문을 절대 저장하지 않는다.
        String historyHash = isBcryptHash(storedPassword)
                ? storedPassword
                : passwordEncoder.encode(storedPassword);
        usersDao.insertPasswordHistory(userId, historyHash);
        usersDao.deleteExpiredPasswordHistory(userId);
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
        validatePasswordPolicy(next);
        if (!next.equals(confirm)) {
            throw new IllegalArgumentException("새 비밀번호 확인이 일치하지 않습니다.");
        }

        String storedPassword = usersDao.findPasswordHashByUserId(userId);
        if (storedPassword == null || !passwordMatches(current, storedPassword)) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        if (isRecentlyUsedPassword(userId, next, storedPassword)) {
            throw new IllegalArgumentException("최근 30일 이내 사용한 비밀번호는 다시 사용할 수 없습니다.");
        }

        saveCurrentPasswordToHistory(userId, storedPassword);
        usersDao.updatePassword(userId, passwordEncoder.encode(next));
    }



    @Transactional
    public void resetPassword(Long userId, String newPassword, String confirmPassword) {
        if (userId == null) {
            throw new IllegalArgumentException("재설정할 계정을 확인할 수 없습니다.");
        }

        String next = newPassword == null ? "" : newPassword.trim();
        String confirm = confirmPassword == null ? "" : confirmPassword.trim();

        validatePasswordPolicy(next);
        if (!next.equals(confirm)) {
            throw new IllegalArgumentException("새 비밀번호 확인이 일치하지 않습니다.");
        }

        String storedPassword = usersDao.findPasswordHashByUserId(userId);
        if (storedPassword == null) {
            throw new IllegalArgumentException("재설정할 계정을 확인할 수 없습니다.");
        }
        if (isRecentlyUsedPassword(userId, next, storedPassword)) {
            throw new IllegalArgumentException("최근 30일 이내 사용한 비밀번호는 다시 사용할 수 없습니다.");
        }

        saveCurrentPasswordToHistory(userId, storedPassword);
        usersDao.resetPasswordAndBumpSecurityVersion(userId, passwordEncoder.encode(next));
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
        if (usersDao.countOwnedWorkspacesForWithdrawal(userId) > 0) {
            throw new IllegalArgumentException("그룹장을 다른 멤버에게 위임한 뒤 회원 탈퇴를 신청해주세요.");
        }
        if (usersDao.countLedGroupProjectsForWithdrawal(userId) > 0) {
            throw new IllegalArgumentException("그룹 프로젝트의 팀장을 다른 멤버에게 위임한 뒤 회원 탈퇴를 신청해주세요.");
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
        return usersDao.findById(user.getUserId());
    }

    public List<workspaceDTO> getWorkspacesByUserId(Long userId) {
        return usersDao.findWorkspacesByUserId(userId);
    }
}
