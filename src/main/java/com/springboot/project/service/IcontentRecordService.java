package com.springboot.project.service;

import com.springboot.project.dto.contentRecordDraftRequest;
import com.springboot.project.dto.contentRecordPermissionDTO;
import com.springboot.project.dto.contentRecordTargetDTO;
import com.springboot.project.dto.contentRecordTargetRequest;

public interface IcontentRecordService {
    contentRecordTargetDTO ensureDraft(contentRecordDraftRequest request, Long userId);
    contentRecordTargetDTO ensureTarget(contentRecordTargetRequest request, Long userId);
    contentRecordTargetDTO getTarget(String targetType, Long targetId, Long userId);
    contentRecordTargetDTO getOwnedDraft(String draftKey, Long userId);
    contentRecordTargetDTO getOwnedTarget(Long recordTargetId, Long userId);
    contentRecordTargetDTO getViewableTarget(Long recordTargetId, Long userId);
    contentRecordTargetDTO getEditableTarget(Long recordTargetId, Long userId);
    contentRecordTargetDTO getDeletableTarget(Long recordTargetId, Long userId);
    contentRecordPermissionDTO getPermission(Long recordTargetId, Long userId);
    Long ensureNoteFolder(Long recordTargetId, Long userId);
    Long ensurePhotoAlbum(Long recordTargetId, String albumName, Long userId);
    Long ensureFileFolder(Long recordTargetId, Long userId);
    boolean abandonDraft(String draftKey, Long userId);

    /** 실제 일정·계획·작업 저장 트랜잭션 안에서 호출한다. */
    contentRecordTargetDTO activateDraft(String draftKey, String targetType, Long targetId, Long userId);
}
