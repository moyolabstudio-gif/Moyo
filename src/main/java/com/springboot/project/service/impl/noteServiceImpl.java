package com.springboot.project.service.impl;

import com.springboot.project.dao.InoteDAO;
import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import com.springboot.project.service.InoteService;
import com.springboot.project.service.IcontentShareService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class noteServiceImpl implements InoteService {

    @Autowired
    private InoteDAO inoteDAO;

    @Autowired
    private IcontentShareService contentShareService;

    @Override
    public List<noteDTO> getNoteList(String scopeType, Long wsId, Long projId, Long userId, String keyword) {
        Map<String, Object> paramMap = createScopeParam(scopeType, wsId, projId, userId);
        paramMap.put("keyword", keyword == null || keyword.trim().isEmpty() ? null : keyword.trim());
        List<noteDTO> noteList = inoteDAO.selectNoteList(paramMap);
        attachEmptyFileList(noteList);
        return noteList;
    }

    @Override
    public List<noteDTO> getMainNoteList(String scopeType, Long wsId, Long projId, Long userId, int limit) {
        Map<String, Object> paramMap = createScopeParam(scopeType, wsId, projId, userId);
        paramMap.put("limit", Math.min(Math.max(limit, 1), 3));
        List<noteDTO> noteList = inoteDAO.selectMainNoteList(paramMap);
        attachEmptyFileList(noteList);
        return noteList;
    }

    @Override
    @Transactional
    public boolean pinNote(Long userId, Long noteId) {
        noteDTO note = inoteDAO.selectNoteDetail(noteId, userId);
        if (note == null) throw new IllegalStateException("노트를 찾을 수 없습니다.");
        String pinScopeKey = buildPinScopeKey(note);
        Integer pinOrder = inoteDAO.selectNextPinOrder(userId, pinScopeKey);
        if (pinOrder == null) pinOrder = 1;
        return inoteDAO.insertNotePin(userId, pinScopeKey, noteId, pinOrder) > 0;
    }

    @Override
    public boolean unpinNote(Long userId, Long noteId) {
        return inoteDAO.deleteNotePin(userId, noteId) > 0;
    }

    @Override
    public boolean canDeleteNote(Long noteId, Long userId) {
        if (noteId == null || userId == null) return false;
        return inoteDAO.countNoteDeletePermission(noteId, userId) > 0;
    }

    @Override
    public noteDTO getNoteDetail(Long noteId, Long userId) {
        noteDTO note = inoteDAO.selectNoteDetail(noteId, userId);
        if (note != null) note.setFileList(inoteDAO.selectNoteFileList(noteId));
        return note;
    }

    @Override
    public boolean registerNote(noteDTO note) {
        normalizeNote(note);
        return inoteDAO.insertNote(note) > 0;
    }

    @Override
    @Transactional
    public void registerNoteWithFiles(noteDTO note, List<noteFileDTO> fileList) {
        normalizeNote(note);
        inoteDAO.insertNote(note);
        if (fileList != null && !fileList.isEmpty()) {
            for (noteFileDTO file : fileList) {
                file.setNoteId(note.getNoteId());
                inoteDAO.insertNoteFile(file);
            }
        }
    }

    @Override
    public boolean modifyNote(noteDTO note) {
        return inoteDAO.updateNote(note) > 0;
    }

    @Override
    @Transactional
    public boolean removeNote(Long noteId) {
        contentShareService.removeContentShares("NOTE", noteId);
        inoteDAO.deleteNotePinsByNoteId(noteId);
        inoteDAO.deleteNoteRepliesByNoteId(noteId);
        inoteDAO.deleteNoteFilesByNoteId(noteId);
        return inoteDAO.deleteNote(noteId) > 0;
    }

    @Override
    public boolean registerNoteFile(noteFileDTO file) {
        return inoteDAO.insertNoteFile(file) > 0;
    }

    @Override
    public List<noteFileDTO> getNoteFileList(Long noteId) {
        return inoteDAO.selectNoteFileList(noteId);
    }

    @Override
    public noteFileDTO getNoteFile(Long fileId) {
        return inoteDAO.selectNoteFile(fileId);
    }

    @Override
    public boolean removeNoteFile(Long fileId) {
        return inoteDAO.deleteNoteFile(fileId) > 0;
    }

    @Override
    public boolean removeNoteFilesByNoteId(Long noteId) {
        return inoteDAO.deleteNoteFilesByNoteId(noteId) > 0;
    }

    @Override
    public List<noteReplyDTO> getNoteReplyList(Long noteId) {
        return inoteDAO.selectNoteReplyList(noteId);
    }

    @Override
    public boolean registerNoteReply(noteReplyDTO reply) {
        return inoteDAO.insertNoteReply(reply) > 0;
    }

    @Override
    public boolean modifyNoteReply(noteReplyDTO reply) {
        if (reply == null || reply.getReplyId() == null || reply.getNoteId() == null || reply.getUserId() == null) return false;
        String content = reply.getReplyContent() == null ? "" : reply.getReplyContent().trim();
        if (content.isEmpty()) return false;
        reply.setReplyContent(content);
        return inoteDAO.updateNoteReply(reply) > 0;
    }

    @Override
    public boolean removeNoteReply(Long replyId, Long userId) {
        return inoteDAO.deleteNoteReply(replyId, userId) > 0;
    }

    private Map<String, Object> createScopeParam(String scopeType, Long wsId, Long projId, Long userId) {
        String normalizedScope = normalizeScope(scopeType);
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("scopeType", normalizedScope);
        paramMap.put("wsId", wsId);
        paramMap.put("projId", projId);
        paramMap.put("userId", userId);
        paramMap.put("pinScopeKey", buildPinScopeKey(normalizedScope, wsId, projId, userId));
        return paramMap;
    }

    private void attachEmptyFileList(List<noteDTO> noteList) {
        if (noteList == null) return;
        for (noteDTO note : noteList) {
            if (note != null && note.getFileList() == null) {
                note.setFileList(Collections.emptyList());
            }
        }
    }

    private void attachFiles(List<noteDTO> noteList) {
        if (noteList == null) return;
        for (noteDTO note : noteList) {
            List<noteFileDTO> files = inoteDAO.selectNoteFileList(note.getNoteId());
            note.setFileList(files);
            note.setAttachmentCount(files == null ? 0 : files.size());

            if (files == null || files.isEmpty()) continue;
            note.setFirstAttachmentName(files.get(0).getOriginFileName());
            for (noteFileDTO file : files) {
                if (file != null && file.isImageFile()) {
                    note.setPreviewImageFileId(file.getFileId());
                    break;
                }
            }
        }
    }

    private void normalizeNote(noteDTO note) {
        note.setScopeType(normalizeScope(note.getScopeType()));
        if ("PRIVATE".equals(note.getScopeType())) {
            note.setWsId(null);
            note.setProjId(null);
        } else if ("WS".equals(note.getScopeType())) {
            note.setProjId(null);
        }
    }

    private String normalizeScope(String scopeType) {
        if (scopeType == null || scopeType.isBlank()) return "PRIVATE";
        String value = scopeType.trim().toUpperCase();
        if ("PROJECT".equals(value)) return "PROJ";
        if ("WORKSPACE".equals(value)) return "WS";
        if (!"ALL".equals(value) && !"PRIVATE".equals(value) && !"WS".equals(value) && !"PROJ".equals(value)) return "PRIVATE";
        return value;
    }

    private String buildPinScopeKey(noteDTO note) {
        return buildPinScopeKey(note.getScopeType(), note.getWsId(), note.getProjId(), note.getUserId());
    }

    private String buildPinScopeKey(String scopeType, Long wsId, Long projId, Long userId) {
        String scope = normalizeScope(scopeType);
        if ("ALL".equals(scope)) return "ALL:" + userId;
        if ("PROJ".equals(scope)) return "PROJ:" + wsId + ":" + projId;
        if ("WS".equals(scope)) return "WS:" + wsId;
        return "PRIVATE:" + userId;
    }
}
