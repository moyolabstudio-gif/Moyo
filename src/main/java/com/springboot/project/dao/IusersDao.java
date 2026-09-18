package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;

@Mapper
public interface IusersDao {
    List<usersDto> findAll();
    void insertUser(usersDto user);
    usersDto findAuthByEmail(@Param("email") String email);
    String findPasswordHashByUserId(@Param("userId") Long userId);
    void updateUser(usersDto user);
    void upsertNotificationSettings(usersDto user);
    List<usersDto> searchUsersByEmail(@Param("email") String email);
    void insertWorkspaceMember(@Param("wsId") Long wsId, @Param("userId") Long userId, @Param("role") String role);
    usersDto findByEmail(@Param("email") String email);
    usersDto findById(@Param("userId") Long userId);
    void clearCurrentProfileImages(@Param("userId") Long userId);
    void insertProfileImageHistory(usersDto user);
    List<Map<String, Object>> findProfileImageHistory(@Param("userId") Long userId);
    Map<String, Object> findProfileImageHistoryById(@Param("userId") Long userId, @Param("profileImageId") Long profileImageId);
    void markProfileImageCurrent(@Param("userId") Long userId, @Param("profileImageId") Long profileImageId);
    void updatePassword(@Param("userId") Long userId, @Param("pwdHash") String pwdHash);
    void resetPasswordAndBumpSecurityVersion(@Param("userId") Long userId, @Param("pwdHash") String pwdHash);
    Long findSecurityVersionByUserId(@Param("userId") Long userId);
    void insertPasswordHistory(@Param("userId") Long userId, @Param("pwdHash") String pwdHash);
    List<String> findRecentPasswordHashes(@Param("userId") Long userId);
    void deleteExpiredPasswordHistory(@Param("userId") Long userId);
    void clearExpiredLoginLock(@Param("userId") Long userId);
    int countActiveLoginLock(@Param("userId") Long userId);
    void recordLoginFailure(@Param("userId") Long userId,
                            @Param("maxFailures") int maxFailures,
                            @Param("lockMinutes") int lockMinutes);
    void resetLoginFailures(@Param("userId") Long userId);
    void requestWithdrawal(@Param("userId") Long userId);
    void cancelWithdrawal(@Param("userId") Long userId);
    int countCancelableWithdrawal(@Param("userId") Long userId);
    int countOwnedWorkspacesForWithdrawal(@Param("userId") Long userId);
    int countLedGroupProjectsForWithdrawal(@Param("userId") Long userId);
    List<Long> findExpiredWithdrawalUserIds();
    List<String> findWithdrawalProfileImagePaths(@Param("userId") Long userId);
    List<Long> findWithdrawalPrivateNoteIds(@Param("userId") Long userId);
    List<Long> findWithdrawalPersonalPhotoPostIds(@Param("userId") Long userId);
    List<String> findWithdrawalPersonalContentFilePaths(@Param("userId") Long userId);
    void deleteWithdrawalPersonalContentFiles(@Param("userId") Long userId);
    void deleteWithdrawalPersonalPhotoAlbums(@Param("userId") Long userId);
    void deleteWithdrawalPersonalNoteFolders(@Param("userId") Long userId);
    void deleteWithdrawalPersonalFileFolders(@Param("userId") Long userId);
    void deleteWithdrawalPersonalEventShares(@Param("userId") Long userId);
    void deleteWithdrawalPersonalEventReactions(@Param("userId") Long userId);
    void deleteWithdrawalPersonalEventDependencies(@Param("userId") Long userId);
    void deleteWithdrawalPersonalEvents(@Param("userId") Long userId);
    void deleteWithdrawalProfileImages(@Param("userId") Long userId);
    void deleteWithdrawalNotificationSettings(@Param("userId") Long userId);
    void deleteWithdrawalFriendRelations(@Param("userId") Long userId);
    void deleteWithdrawalPasswordHistory(@Param("userId") Long userId);
    void deleteWithdrawalWorkspaceInvitations(@Param("userId") Long userId);
    void deleteWithdrawalWorkspaceJoinRequests(@Param("userId") Long userId);
    void deleteWithdrawalTargetedShares(@Param("userId") Long userId);
    void deleteWithdrawalWorkspaceMemberships(@Param("userId") Long userId);
    void deleteWithdrawalProjectMemberships(@Param("userId") Long userId);
    int finalizeWithdrawalAccount(@Param("userId") Long userId, @Param("pwdHash") String pwdHash);
    List<workspaceDTO> findWorkspacesByUserId(Long userId);
    List<Map<String, Object>> findProfileLinks(@Param("userId") Long userId);
    void deleteProfileLinks(@Param("userId") Long userId);
    void insertProfileLink(Map<String, Object> link);
    
    //알람용 유저 아이디 가져오기
    List<Long> getAllUserIds();
}
