package com.springboot.project.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryAttachmentDTO;
import com.springboot.project.dto.csInquiryDTO;

public interface IcsService {
    List<csInquiryDTO> getCategoryList();

    Long registerInquiry(csInquiryDTO inquiry, Long userId);

    Long registerInquiry(csInquiryDTO inquiry, Long userId, List<MultipartFile> attachments);

    List<csDTO> getInquiryList(Long userId);

    List<csInquiryDTO> getMessages(Long userId, Long csId);

    List<csDTO> getAdminInquiryList();

    List<csInquiryDTO> getAdminMessages(Long csId);

    void replyInquiry(Long csId, Long adminUserId, String content);

    void replyInquiry(Long csId, Long adminUserId, String content, List<MultipartFile> attachments);

    void updateInquiryStatus(Long csId, String status);

    csInquiryAttachmentDTO getUserAttachment(Long userId, Long attachmentId);

    csInquiryAttachmentDTO getAdminAttachment(Long attachmentId);
}
