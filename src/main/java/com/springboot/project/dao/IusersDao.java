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
    usersDto login(usersDto user);
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
    int countByUserIdAndPassword(@Param("userId") Long userId, @Param("pwdHash") String pwdHash);
    void updatePassword(@Param("userId") Long userId, @Param("pwdHash") String pwdHash);
    void requestWithdrawal(@Param("userId") Long userId);
    void cancelWithdrawal(@Param("userId") Long userId);
    int countCancelableWithdrawal(@Param("userId") Long userId);
    List<workspaceDTO> findWorkspacesByUserId(Long userId);
    List<Map<String, Object>> findProfileLinks(@Param("userId") Long userId);
    void deleteProfileLinks(@Param("userId") Long userId);
    void insertProfileLink(Map<String, Object> link);
    
    //알람용 유저 아이디 가져오기
    List<Long> getAllUserIds();
}
