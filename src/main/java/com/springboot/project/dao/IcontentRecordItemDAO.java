package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.springboot.project.dto.contentRecordItemDTO;

@Mapper
public interface IcontentRecordItemDAO {
    int insertItem(contentRecordItemDTO item);
    int insertNoteContent(contentRecordItemDTO item);
    int updateNoteContent(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId, @Param("title") String title, @Param("content") String content, @Param("userId") Long userId);
    int updateItemTitle(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId, @Param("title") String title);
    int softDeleteNoteContent(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId, @Param("userId") Long userId);
    int softDeleteNoteItem(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId);
    int updateNoteSortOrder(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId, @Param("sortOrder") int sortOrder);
    int insertLink(contentRecordItemDTO item);
    int updateLink(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId,
            @Param("title") String title, @Param("linkUrl") String linkUrl, @Param("description") String description);
    int updateLinkItemMetadata(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId,
            @Param("title") String title);
    int softDeleteLinkItem(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId);
    int countActiveLinkByUrl(@Param("recordTargetId") Long recordTargetId, @Param("linkUrl") String linkUrl,
            @Param("excludeRecordItemId") Long excludeRecordItemId);
    int insertLocation(contentRecordItemDTO item);
    int updateLocation(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId,
            @Param("locationText") String locationText, @Param("locationAddress") String locationAddress,
            @Param("locationLat") Double locationLat, @Param("locationLng") Double locationLng,
            @Param("locationPlaceId") String locationPlaceId, @Param("memo") String memo,
            @Param("locationDescription") String locationDescription);
    int updateLocationItemMetadata(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId,
            @Param("title") String title);
    int softDeleteLocationItem(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId);
    int softDeleteFileItem(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId);
    int countActiveFileInTarget(@Param("recordTargetId") Long recordTargetId, @Param("contentFileId") Long contentFileId);
    int countActiveLocations(@Param("recordTargetId") Long recordTargetId);
    int clearPrimaryLocation(@Param("recordTargetId") Long recordTargetId);
    int setPrimaryLocation(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId);
    Long selectFirstActiveLocationId(@Param("recordTargetId") Long recordTargetId);
    int countPrimaryLocation(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId);
    List<contentRecordItemDTO> selectItems(@Param("recordTargetId") Long recordTargetId, @Param("userId") Long userId);
    contentRecordItemDTO selectItem(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId, @Param("userId") Long userId);
    int countByType(@Param("recordTargetId") Long recordTargetId, @Param("recordType") String recordType);
    Long selectRecordFileFolderId(@Param("recordTargetId") Long recordTargetId);
    int moveRecordFilesToFolder(@Param("recordTargetId") Long recordTargetId, @Param("folderId") Long folderId, @Param("userId") Long userId);
    Long sumActiveFileSize(@Param("recordTargetId") Long recordTargetId);
    Long sumActivePhotoSize(@Param("recordTargetId") Long recordTargetId);
    int softDelete(@Param("recordItemId") Long recordItemId, @Param("userId") Long userId);
    int softDeletePhotoItem(@Param("recordTargetId") Long recordTargetId, @Param("recordItemId") Long recordItemId);
    int updatePhotoItemsDeletedByPostId(@Param("postId") Long postId, @Param("deletedYn") String deletedYn);
    int softDeleteByTargetAndType(@Param("recordTargetId") Long recordTargetId, @Param("recordType") String recordType);
}
