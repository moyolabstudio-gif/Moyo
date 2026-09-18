package com.springboot.project.service;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.contentFileDTO;
import com.springboot.project.dto.contentRecordItemDTO;

public interface IcontentFileService {

    contentFileDTO upload(
            MultipartFile file,
            String scopeType,
            Long wsId,
            Long projId,
            String description,
            Long userId);

    List<contentRecordItemDTO> uploadToRecord(
            Long recordTargetId,
            List<MultipartFile> files,
            List<String> originalNames,
            Long userId);

    contentRecordItemDTO connectExisting(
            Long recordTargetId,
            Long contentFileId,
            Long userId);

    void removeFromRecord(
            Long recordTargetId,
            Long recordItemId,
            Long userId);

    List<contentFileDTO> getOwnedFiles(Long userId);

    List<contentFileDTO> getFiles(
            String scopeType,
            Long wsId,
            Long projId,
            Long userId);

    List<contentFileDTO> getDashboardLatestFiles(
            String scopeType,
            Long wsId,
            Long projId,
            int limit,
            Long userId);

    Map<String, Object> getFilePage(
            String scopeType,
            Long wsId,
            Long projId,
            String keyword,
            String fileType,
            String sort,
            int page,
            int size,
            Long userId);

    contentFileDTO getAccessibleFile(
            Long contentFileId,
            Long userId);

    contentFileDTO getMovableFile(
            Long contentFileId,
            Long userId);

    Path getAccessiblePath(
            Long contentFileId,
            Long userId);

    contentFileDTO rename(
            Long contentFileId,
            String name,
            Long userId);

    contentFileDTO updateMetadata(
            Long contentFileId,
            String name,
            String description,
            Long userId);

    void deleteStandalone(
            Long contentFileId,
            Long userId);
}
