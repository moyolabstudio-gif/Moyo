package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.contentFileDTO;
import com.springboot.project.dto.contentFileFolderDTO;

@Mapper
public interface IcontentFileTrashDAO {
    List<contentFileDTO> selectTrashFiles(@Param("scopeType") String scopeType,
            @Param("ownerUserId") Long ownerUserId, @Param("wsId") Long wsId,
            @Param("projId") Long projId, @Param("userId") Long userId);
    List<contentFileFolderDTO> selectTrashFolders(@Param("scopeType") String scopeType,
            @Param("ownerUserId") Long ownerUserId, @Param("wsId") Long wsId,
            @Param("projId") Long projId, @Param("userId") Long userId);
    int trashFile(@Param("id") Long id, @Param("userId") Long userId);
    int restoreFile(@Param("id") Long id, @Param("userId") Long userId,
            @Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId);
    int trashFolderTree(@Param("id") Long id, @Param("userId") Long userId);
    int trashFilesInFolderTree(@Param("id") Long id, @Param("userId") Long userId);
    int restoreFolderTree(@Param("id") Long id, @Param("userId") Long userId,
            @Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId);
    int restoreFilesInFolderTree(@Param("id") Long id, @Param("userId") Long userId,
            @Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId);
    List<contentFileDTO> selectFilesForPermanentDelete(@Param("fileIds") List<Long> fileIds,
            @Param("userId") Long userId, @Param("scopeType") String scopeType,
            @Param("ownerUserId") Long ownerUserId, @Param("wsId") Long wsId,
            @Param("projId") Long projId);
    List<contentFileDTO> selectFilesInFolderTreeForPermanentDelete(@Param("folderId") Long folderId,
            @Param("userId") Long userId, @Param("scopeType") String scopeType,
            @Param("ownerUserId") Long ownerUserId, @Param("wsId") Long wsId,
            @Param("projId") Long projId);
    int deleteRecordItemsByFileIds(@Param("fileIds") List<Long> fileIds);
    int deleteFilesByIds(@Param("fileIds") List<Long> fileIds, @Param("userId") Long userId,
            @Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId);
    int deleteFolderTree(@Param("id") Long id, @Param("userId") Long userId,
            @Param("scopeType") String scopeType, @Param("ownerUserId") Long ownerUserId,
            @Param("wsId") Long wsId, @Param("projId") Long projId);
    int hideRecordItems(@Param("fileIds") List<Long> fileIds);
    int restoreRecordItems(@Param("fileIds") List<Long> fileIds);
    List<contentFileDTO> selectExpiredFiles();
    List<Long> selectExpiredRootFolders();
}
