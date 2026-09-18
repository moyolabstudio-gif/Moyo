package com.springboot.project.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IcsDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryAttachmentDTO;
import com.springboot.project.dto.csInquiryDTO;
import com.springboot.project.service.IcsService;
import com.springboot.project.service.InquiryAttachmentStorageService;

@Service
public class IcsServiceImpl implements IcsService {

    @Autowired
    private IcsDAO icsDAO;

    @Autowired
    private IuserNoticeDAO userNoticeDAO;

    @Autowired
    private InquiryAttachmentStorageService attachmentStorageService;

    @Override
    public List<csInquiryDTO> getCategoryList() {
        return icsDAO.getCategoryList();
    }

    @Override
    public Long registerInquiry(csInquiryDTO inquiry, Long userId) {
        return registerInquiry(inquiry, userId, Collections.emptyList());
    }

    @Override
    @Transactional
    public Long registerInquiry(csInquiryDTO inquiry, Long userId, List<MultipartFile> attachments) {
        List<String> storedFiles = new ArrayList<>();
        try {
            if (inquiry == null) throw new IllegalArgumentException("문의 정보가 없습니다.");
            if (userId == null) throw new IllegalArgumentException("로그인 사용자가 없습니다.");
            if (inquiry.getContent() == null || inquiry.getContent().trim().isEmpty()) {
                throw new IllegalArgumentException("문의 내용을 입력해 주세요.");
            }

            inquiry.setSenderId(userId);
            inquiry.setSenderType("USER");
            Long targetCsId = inquiry.getCsId();

            if (targetCsId == null) {
                if (inquiry.getCategoryId() == null) throw new IllegalArgumentException("문의 유형을 선택해 주세요.");
                if (inquiry.getTitle() == null || inquiry.getTitle().trim().isEmpty()) {
                    throw new IllegalArgumentException("문의 제목을 입력해 주세요.");
                }

                csDTO newLog = new csDTO();
                newLog.setUserId(userId);
                icsDAO.insertCsLog(newLog);
                targetCsId = newLog.getCsId();
            } else {
                csDTO ownedLog = icsDAO.findCsByIdAndUserId(targetCsId, userId);
                if (ownedLog == null) throw new IllegalArgumentException("확인할 수 없는 문의입니다.");
                if (!"OPEN".equalsIgnoreCase(ownedLog.getCsStatus())) {
                    throw new IllegalStateException("종료된 문의에는 메시지를 추가할 수 없습니다.");
                }

                List<csInquiryDTO> existingMessages = icsDAO.findMessagesByCsId(targetCsId);
                if (existingMessages != null && !existingMessages.isEmpty()) {
                    csInquiryDTO first = existingMessages.get(0);
                    inquiry.setCategoryId(first.getCategoryId());
                    inquiry.setTitle(first.getTitle());
                }
            }

            inquiry.setCsId(targetCsId);
            inquiry.setContent(inquiry.getContent().trim());
            icsDAO.insertCsMessage(inquiry);
            saveAttachments(inquiry.getMsgId(), attachments, storedFiles);
            return targetCsId;
        } catch (RuntimeException e) {
            cleanupStoredFiles(storedFiles);
            throw e;
        }
    }

    @Override
    public List<csDTO> getInquiryList(Long userId) {
        if (userId == null) return Collections.emptyList();
        List<csDTO> list = icsDAO.findInquiryListByUserId(userId);
        return list == null ? Collections.emptyList() : list;
    }

    @Override
    public List<csInquiryDTO> getMessages(Long userId, Long csId) {
        if (userId == null) return Collections.emptyList();
        Long targetCsId = csId;
        if (targetCsId == null) {
            List<csDTO> inquiries = icsDAO.findInquiryListByUserId(userId);
            if (inquiries == null || inquiries.isEmpty()) return Collections.emptyList();
            targetCsId = inquiries.get(0).getCsId();
        }
        if (icsDAO.findCsByIdAndUserId(targetCsId, userId) == null) return Collections.emptyList();
        return withAttachments(icsDAO.findMessagesByCsId(targetCsId));
    }

    @Override
    public List<csDTO> getAdminInquiryList() {
        List<csDTO> list = icsDAO.findAdminInquiryList();
        return list == null ? Collections.emptyList() : list;
    }

    @Override
    public List<csInquiryDTO> getAdminMessages(Long csId) {
        if (csId == null || icsDAO.findCsById(csId) == null) return Collections.emptyList();
        return withAttachments(icsDAO.findMessagesByCsId(csId));
    }

    @Override
    public void replyInquiry(Long csId, Long adminUserId, String content) {
        replyInquiry(csId, adminUserId, content, Collections.emptyList());
    }

    @Override
    @Transactional
    public void replyInquiry(Long csId, Long adminUserId, String content, List<MultipartFile> attachments) {
        List<String> storedFiles = new ArrayList<>();
        try {
            if (csId == null) throw new IllegalArgumentException("문의 번호가 없습니다.");
            if (adminUserId == null) throw new IllegalArgumentException("관리자 정보가 없습니다.");
            if (content == null || content.trim().isEmpty()) throw new IllegalArgumentException("답변 내용을 입력해 주세요.");

            csDTO log = icsDAO.findCsById(csId);
            if (log == null) throw new IllegalArgumentException("존재하지 않는 문의입니다.");
            if (!"OPEN".equalsIgnoreCase(log.getCsStatus())) {
                throw new IllegalStateException("종료된 문의에는 답변할 수 없습니다.");
            }

            List<csInquiryDTO> messages = icsDAO.findMessagesByCsId(csId);
            if (messages == null || messages.isEmpty()) throw new IllegalStateException("문의 메시지가 없습니다.");

            csInquiryDTO first = messages.get(0);
            csInquiryDTO reply = new csInquiryDTO();
            reply.setCsId(csId);
            reply.setSenderId(adminUserId);
            reply.setSenderType("ADMIN");
            reply.setCategoryId(first.getCategoryId());
            reply.setTitle(first.getTitle());
            reply.setContent(content.trim());
            icsDAO.insertCsMessage(reply);
            saveAttachments(reply.getMsgId(), attachments, storedFiles);

            userNoticeDAO.insertContentSendAlarm(
                    log.getUserId(),
                    "INQUIRY_ANSWER",
                    "INQUIRY",
                    csId,
                    "문의에 답변이 등록되었습니다.",
                    first.getTitle() == null || first.getTitle().trim().isEmpty()
                            ? "등록하신 문의에 MOYO 운영팀의 답변이 도착했습니다."
                            : "‘" + first.getTitle().trim() + "’ 문의에 MOYO 운영팀의 답변이 도착했습니다.",
                    "/common/inquiry?csId=" + csId
            );
        } catch (RuntimeException e) {
            cleanupStoredFiles(storedFiles);
            throw e;
        }
    }

    @Override
    @Transactional
    public void updateInquiryStatus(Long csId, String status) {
        if (csId == null) throw new IllegalArgumentException("문의 번호가 없습니다.");
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!"OPEN".equals(normalized) && !"CLOSED".equals(normalized)) {
            throw new IllegalArgumentException("지원하지 않는 문의 상태입니다.");
        }
        if (icsDAO.findCsById(csId) == null) throw new IllegalArgumentException("존재하지 않는 문의입니다.");
        icsDAO.updateCsStatus(csId, normalized);
    }

    @Override
    public csInquiryAttachmentDTO getUserAttachment(Long userId, Long attachmentId) {
        if (userId == null || attachmentId == null) return null;
        return icsDAO.findAttachmentByIdAndUserId(attachmentId, userId);
    }

    @Override
    public csInquiryAttachmentDTO getAdminAttachment(Long attachmentId) {
        if (attachmentId == null) return null;
        return icsDAO.findAttachmentById(attachmentId);
    }

    private List<csInquiryDTO> withAttachments(List<csInquiryDTO> messages) {
        if (messages == null || messages.isEmpty()) return Collections.emptyList();
        for (csInquiryDTO message : messages) {
            List<csInquiryAttachmentDTO> attachments = message.getMsgId() == null
                    ? Collections.emptyList()
                    : icsDAO.findAttachmentsByMsgId(message.getMsgId());
            message.setAttachments(attachments == null ? Collections.emptyList() : attachments);
        }
        return messages;
    }

    private void saveAttachments(Long msgId, List<MultipartFile> files, List<String> storedFiles) {
        if (files == null || files.isEmpty()) return;
        List<MultipartFile> actualFiles = files.stream().filter(f -> f != null && !f.isEmpty()).toList();
        if (actualFiles.size() > InquiryAttachmentStorageService.MAX_FILE_COUNT) {
            throw new IllegalArgumentException("첨부파일은 메시지당 최대 5개까지 등록할 수 있습니다.");
        }

        for (MultipartFile file : actualFiles) {
            csInquiryAttachmentDTO attachment = attachmentStorageService.store(file);
            attachment.setMsgId(msgId);
            storedFiles.add(attachment.getStoredName());
            icsDAO.insertAttachment(attachment);
        }
    }

    private void cleanupStoredFiles(List<String> storedFiles) {
        for (String storedName : storedFiles) attachmentStorageService.deleteQuietly(storedName);
    }
}
