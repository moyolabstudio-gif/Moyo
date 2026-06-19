package com.springboot.project.dao;

import com.springboot.project.dto.contentShareDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface IcontentShareDAO {
    int countManagePermission(@Param("contentType") String contentType,
                              @Param("contentId") Long contentId,
                              @Param("userId") Long userId);

    Long selectContentOwnerId(@Param("contentType") String contentType,
                              @Param("contentId") Long contentId);

    List<contentShareDTO> selectShares(@Param("contentType") String contentType,
                                       @Param("contentId") Long contentId);

    int mergeShare(contentShareDTO share);

    int deleteShare(@Param("shareId") Long shareId,
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
