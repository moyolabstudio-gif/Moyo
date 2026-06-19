package com.springboot.project.dao;

import com.springboot.project.dto.friendDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface IfriendDAO {
    List<friendDTO> searchUsers(@Param("userId") Long userId, @Param("keyword") String keyword);
    List<friendDTO> selectFriends(@Param("userId") Long userId, @Param("keyword") String keyword);
    List<friendDTO> selectReceivedRequests(@Param("userId") Long userId);
    List<friendDTO> selectSentRequests(@Param("userId") Long userId);
    int countPendingReceived(@Param("userId") Long userId);
    friendDTO selectRelation(@Param("userId") Long userId, @Param("targetUserId") Long targetUserId);
    int insertRequest(@Param("requesterId") Long requesterId, @Param("addresseeId") Long addresseeId);
    int acceptRequest(@Param("friendId") Long friendId, @Param("userId") Long userId);
    int rejectRequest(@Param("friendId") Long friendId, @Param("userId") Long userId);
    int cancelRequest(@Param("friendId") Long friendId, @Param("userId") Long userId);
    int deleteFriend(@Param("friendId") Long friendId, @Param("userId") Long userId);
}
