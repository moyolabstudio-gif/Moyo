package com.springboot.project.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IusersDao;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountFinalWithdrawalService {

    private final IusersDao usersDao;
    private final InoteService noteService;
    private final IphotoAlbumService photoAlbumService;
    private final contentFileStorageService contentFileStorageService;
    private final AccountProfileImageService accountProfileImageService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 30일 유예가 끝난 회원 한 명을 독립 트랜잭션으로 최종 탈퇴 처리한다.
     *
     * 개인 영역 데이터는 삭제하고, 그룹/프로젝트 등 공동 기록은 유지한 채
     * USERS 행만 '탈퇴한 사용자'로 익명화하여 기존 FK와 공동 기록을 보존한다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finalizeExpiredWithdrawal(Long userId) {
        if (userId == null) return;

        // 1) 개인 노트: 첨부 실제 파일까지 함께 삭제한다.
        List<Long> noteIds = usersDao.findWithdrawalPrivateNoteIds(userId);
        if (noteIds != null) {
            for (Long noteId : noteIds) {
                if (noteId != null) noteService.removeNoteForAccountWithdrawal(noteId);
            }
        }
        usersDao.deleteWithdrawalPersonalNoteFolders(userId);

        // 2) 개인 사진: 기존 사진 삭제 서비스를 사용해 원본/메타 sidecar까지 정리한다.
        List<Long> photoPostIds = usersDao.findWithdrawalPersonalPhotoPostIds(userId);
        if (photoPostIds != null) {
            for (Long postId : photoPostIds) {
                if (postId != null) photoAlbumService.deletePost(postId);
            }
        }
        usersDao.deleteWithdrawalPersonalPhotoAlbums(userId);

        // 3) 개인 일정과 연결 정보 삭제.
        usersDao.deleteWithdrawalPersonalEventShares(userId);
        usersDao.deleteWithdrawalPersonalEventReactions(userId);
        usersDao.deleteWithdrawalPersonalEventDependencies(userId);
        usersDao.deleteWithdrawalPersonalEvents(userId);

        // 4) 개인 자료실 파일: 실제 파일을 먼저 제거하고 DB/FOLDER를 정리한다.
        List<String> contentFilePaths = usersDao.findWithdrawalPersonalContentFilePaths(userId);
        if (contentFilePaths != null) {
            for (String filePath : contentFilePaths) {
                contentFileStorageService.deleteQuietly(filePath);
            }
        }
        usersDao.deleteWithdrawalPersonalContentFiles(userId);
        usersDao.deleteWithdrawalPersonalFileFolders(userId);

        // 5) 개인 관계/설정. 공동 기록의 작성자 이력은 지우지 않고 익명 USERS를 참조하게 둔다.
        usersDao.deleteWithdrawalTargetedShares(userId);
        usersDao.deleteWithdrawalFriendRelations(userId);
        usersDao.deleteWithdrawalWorkspaceInvitations(userId);
        usersDao.deleteWithdrawalWorkspaceJoinRequests(userId);
        usersDao.deleteWithdrawalProjectMemberships(userId);
        usersDao.deleteWithdrawalWorkspaceMemberships(userId);
        usersDao.deleteWithdrawalNotificationSettings(userId);
        usersDao.deleteProfileLinks(userId);
        usersDao.deleteWithdrawalPasswordHistory(userId);

        // 6) 프로필 이미지 파일과 이력 제거.
        List<String> profilePaths = usersDao.findWithdrawalProfileImagePaths(userId);
        if (profilePaths != null) {
            for (String path : profilePaths) {
                accountProfileImageService.deleteStoredImageQuietly(path);
            }
        }
        usersDao.deleteWithdrawalProfileImages(userId);

        // 7) USERS 행은 FK 보존을 위해 남기되 식별 가능 정보와 인증 수단을 제거한다.
        String unusablePasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
        int finalized = usersDao.finalizeWithdrawalAccount(userId, unusablePasswordHash);
        if (finalized != 1) {
            throw new IllegalStateException("탈퇴 유예 상태가 변경되어 최종 처리를 중단합니다. userId=" + userId);
        }
    }
}
