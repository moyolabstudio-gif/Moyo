package com.springboot.project.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.springboot.project.dto.contentFileDTO;

@Mapper
public interface IcontentFileDAO {
    int insert(contentFileDTO file);
    contentFileDTO selectById(@Param("contentFileId") Long contentFileId);
    List<contentFileDTO> selectOwned(@Param("userId") Long userId);
    List<contentFileDTO> selectByScope(@Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId, @Param("wsId") Long wsId, @Param("projId") Long projId, @Param("userId") Long userId);
    List<contentFileDTO> selectLatestByScope(@Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId, @Param("wsId") Long wsId, @Param("projId") Long projId, @Param("limit") int limit, @Param("userId") Long userId);
    List<contentFileDTO> selectPage(@Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId, @Param("keyword") String keyword,
            @Param("fileType") String fileType, @Param("sort") String sort, @Param("offset") int offset, @Param("size") int size, @Param("userId") Long userId);
    int countPage(@Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId, @Param("keyword") String keyword, @Param("fileType") String fileType, @Param("userId") Long userId);
    Long sumPageBytes(@Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId, @Param("keyword") String keyword, @Param("fileType") String fileType, @Param("userId") Long userId);
    int countCanManage(@Param("scopeType") String scopeType, @Param("wsId") Long wsId, @Param("projId") Long projId, @Param("userId") Long userId);
    List<Long> selectActiveTargetIds(@Param("contentFileId") Long contentFileId);
    int countActiveReferences(@Param("contentFileId") Long contentFileId);
    int countDirectFileShare(@Param("contentFileId") Long contentFileId, @Param("userId") Long userId);
    int updateMetadata(@Param("contentFileId") Long contentFileId, @Param("originalName") String originalName, @Param("description") String description, @Param("userId") Long userId);
    int updateOriginalNameOwned(@Param("contentFileId") Long contentFileId, @Param("originalName") String originalName, @Param("userId") Long userId);
    int softDeleteOwned(@Param("contentFileId") Long contentFileId, @Param("userId") Long userId);
    int softDeleteById(@Param("contentFileId") Long contentFileId, @Param("userId") Long userId);
}
