package com.springboot.project.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.contentRecordTargetDTO;
import com.springboot.project.dto.contentRecordScopeDTO;

@Mapper
public interface IcontentRecordDAO {
    contentRecordTargetDTO selectById(@Param("recordTargetId") Long recordTargetId);
    contentRecordTargetDTO selectByDraftKey(@Param("draftKey") String draftKey);
    contentRecordTargetDTO selectByTarget(
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId);
    int insertDraft(contentRecordTargetDTO target);
    int touchDraft(
            @Param("recordTargetId") Long recordTargetId,
            @Param("userId") Long userId);
    int abandonDraft(
            @Param("draftKey") String draftKey,
            @Param("userId") Long userId);
    int activateDraft(
            @Param("draftKey") String draftKey,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId,
            @Param("userId") Long userId);
    contentRecordScopeDTO selectProjectScope(@Param("projId") Long projId);
    int countEventViewPermission(@Param("eventId") Long eventId, @Param("userId") Long userId);
    int countEventEditPermission(@Param("eventId") Long eventId, @Param("userId") Long userId);
    int countEventDeletePermission(@Param("eventId") Long eventId, @Param("userId") Long userId);
    int enableProjectPlanRecord(@Param("targetType") String targetType, @Param("targetId") Long targetId);
    int countProjectTargetViewPermission(@Param("targetType") String targetType, @Param("targetId") Long targetId, @Param("userId") Long userId);
    int countProjectTargetEditPermission(@Param("targetType") String targetType, @Param("targetId") Long targetId, @Param("userId") Long userId);
    int countProjectTargetDeletePermission(@Param("targetType") String targetType, @Param("targetId") Long targetId, @Param("userId") Long userId);
    int countWorkspaceMember(@Param("wsId") Long wsId, @Param("userId") Long userId);
    int countProjectAccessibleMember(@Param("projId") Long projId, @Param("userId") Long userId);
    String selectRecordTargetTitle(@Param("recordTargetId") Long recordTargetId);
    Long selectNextNoteFolderId();
    Long selectRecordNoteTypeFolderId(@Param("recordTargetId") Long recordTargetId);
    int insertRecordNoteTypeFolder(
            @Param("folderId") Long folderId,
            @Param("recordTargetId") Long recordTargetId,
            @Param("userId") Long userId);
    int insertRecordNoteFolder(
            @Param("folderId") Long folderId,
            @Param("parentFolderId") Long parentFolderId,
            @Param("recordTargetId") Long recordTargetId,
            @Param("userId") Long userId);
    int updateRecordNoteFolderStructure(
            @Param("recordTargetId") Long recordTargetId,
            @Param("parentFolderId") Long parentFolderId);
    int updateNoteFolderIdIfEmpty(
            @Param("recordTargetId") Long recordTargetId,
            @Param("noteFolderId") Long noteFolderId,
            @Param("userId") Long userId);
    int deleteRecordNoteFolderIfEmpty(@Param("folderId") Long folderId);
    Long selectRecordTargetIdByPhotoAlbumId(@Param("photoAlbumId") Long photoAlbumId);
    Long selectRecordTargetIdByPhotoPostId(@Param("postId") Long postId);
    int updatePhotoAlbumIdIfEmpty(
            @Param("recordTargetId") Long recordTargetId,
            @Param("photoAlbumId") Long photoAlbumId,
            @Param("userId") Long userId);
    int updateFileFolderId(
            @Param("recordTargetId") Long recordTargetId,
            @Param("fileFolderId") Long fileFolderId,
            @Param("userId") Long userId);
    int deleteExpiredAbandonedDrafts();
}
