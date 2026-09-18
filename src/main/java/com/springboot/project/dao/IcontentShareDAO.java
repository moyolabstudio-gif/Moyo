package com.springboot.project.dao;

import com.springboot.project.dto.contentShareDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface IcontentShareDAO {


    int countNativeScopeReadPermission(@Param("contentType") String contentType,
                                       @Param("contentId") Long contentId,
                                       @Param("userId") Long userId);

    int countNativeScopeManagerPermission(@Param("contentType") String contentType,
                                          @Param("contentId") Long contentId,
                                          @Param("userId") Long userId);

    int countRestrictedAccessMarker(@Param("contentType") String contentType,
                                    @Param("contentId") Long contentId);

    int mergeRestrictedAccessMarker(@Param("contentType") String contentType,
                                    @Param("contentId") Long contentId,
                                    @Param("ownerId") Long ownerId);

    int deleteRestrictedAccessMarker(@Param("contentType") String contentType,
                                     @Param("contentId") Long contentId,
                                     @Param("ownerId") Long ownerId);

    int countContentEditPermission(@Param("contentType") String contentType,
                                   @Param("contentId") Long contentId,
                                   @Param("userId") Long userId);

    int countNativeContentMember(@Param("contentType") String contentType,
                                 @Param("contentId") Long contentId,
                                 @Param("targetUserId") Long targetUserId);

    List<Map<String, Object>> selectNativeContentMemberTargets(@Param("contentType") String contentType,
                                                                @Param("contentId") Long contentId,
                                                                @Param("keyword") String keyword);

    int countManagePermission(@Param("contentType") String contentType,
                              @Param("contentId") Long contentId,
                              @Param("userId") Long userId);

    int countReadPermission(@Param("contentType") String contentType,
                            @Param("contentId") Long contentId,
                            @Param("userId") Long userId);

    Long selectContentOwnerId(@Param("contentType") String contentType,
                              @Param("contentId") Long contentId);

    Long selectCollectedSourceUserId(@Param("contentType") String contentType,
                                     @Param("contentId") Long contentId);

    int countFriendShareScopePermission(@Param("contentType") String contentType,
                                        @Param("contentId") Long contentId,
                                        @Param("userId") Long userId);

    int countMoyoFeedSharePermission(@Param("contentType") String contentType,
                                     @Param("contentId") Long contentId,
                                     @Param("userId") Long userId);

    List<contentShareDTO> selectShares(@Param("contentType") String contentType,
                                       @Param("contentId") Long contentId);

    List<contentShareDTO> selectSharesForUser(@Param("contentType") String contentType,
                                              @Param("contentId") Long contentId,
                                              @Param("userId") Long userId);

    List<Map<String, Object>> selectFriendShareOwners(@Param("contentType") String contentType,
                                                       @Param("userId") Long userId);

    int ensureContentShareContentConstraint();

    int mergeShare(contentShareDTO share);

    int mergeMemberPermissionShare(contentShareDTO share);



    int deleteShare(@Param("shareId") Long shareId,
                    @Param("userId") Long userId);

    contentShareDTO selectShareById(@Param("shareId") Long shareId);

    List<contentShareDTO> selectReceivedShareRequests(@Param("userId") Long userId);

    List<contentShareDTO> selectSentShareRequests(@Param("userId") Long userId);

    int countPendingShareRequests(@Param("userId") Long userId);

    int updateShareStatus(@Param("shareId") Long shareId,
                          @Param("status") String status,
                          @Param("userId") Long userId);

    int countShareResponderPermission(@Param("shareId") Long shareId,
                                      @Param("userId") Long userId);

    int deleteSharesByContent(@Param("contentType") String contentType,
                              @Param("contentId") Long contentId);

    List<Map<String, Object>> selectUserTargets(@Param("userId") Long userId,
                                                 @Param("keyword") String keyword);

    int countAcceptedFriend(@Param("userId") Long userId,
                            @Param("friendUserId") Long friendUserId);

    List<Map<String, Object>> selectWorkspaceTargets(@Param("userId") Long userId);

    List<Map<String, Object>> selectProjectTargets(@Param("userId") Long userId);
}
