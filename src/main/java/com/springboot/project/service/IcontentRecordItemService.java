package com.springboot.project.service;

import java.util.List;
import com.springboot.project.dto.contentRecordItemDTO;

public interface IcontentRecordItemService {
    contentRecordItemDTO connectContent(Long recordTargetId, String recordType, Long contentId, String title, Long userId);
    contentRecordItemDTO createNote(Long recordTargetId, contentRecordItemDTO item, Long userId);
    contentRecordItemDTO updateNote(Long recordTargetId, Long recordItemId, contentRecordItemDTO item, Long userId);
    void deletePhoto(Long recordTargetId, Long recordItemId, Long userId);
    void deleteNote(Long recordTargetId, Long recordItemId, Long userId);
    void reorderNotes(Long recordTargetId, List<Long> recordItemIds, Long userId);
    contentRecordItemDTO createLink(Long recordTargetId, contentRecordItemDTO item, Long userId);
    contentRecordItemDTO updateLink(Long recordTargetId, Long recordItemId, contentRecordItemDTO item, Long userId);
    void deleteLink(Long recordTargetId, Long recordItemId, Long userId);
    contentRecordItemDTO createLocation(Long recordTargetId, contentRecordItemDTO item, Long userId);
    contentRecordItemDTO updateLocation(Long recordTargetId, Long recordItemId, contentRecordItemDTO item, Long userId);
    void deleteLocation(Long recordTargetId, Long recordItemId, Long userId);
    contentRecordItemDTO setPrimaryLocation(Long recordTargetId, Long recordItemId, Long userId);
    List<contentRecordItemDTO> getItems(Long recordTargetId, Long userId);
}
