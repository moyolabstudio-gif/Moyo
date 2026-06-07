package com.springboot.project.service.impl;

import com.springboot.project.dao.InoteDAO;
import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import com.springboot.project.service.InoteService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class noteServiceImpl implements InoteService {

    @Autowired
    private InoteDAO inoteDAO;

    @Override
    public List<noteDTO> getNoteList(Long wsId, Long projId, Long userId) {
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("wsId", wsId);
        paramMap.put("projId", projId);
        paramMap.put("userId", userId);

        List<noteDTO> noteList = inoteDAO.selectNoteList(paramMap);

        if (noteList != null) {
            for (noteDTO note : noteList) {
                note.setFileList(inoteDAO.selectNoteFileList(note.getNoteId()));
            }
        }

        return noteList;
    }

    @Override
    public List<noteDTO> getMainNoteList(Long wsId, Long projId, Long userId, int limit) {
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("wsId", wsId);
        paramMap.put("projId", projId);
        paramMap.put("userId", userId);
        paramMap.put("limit", Math.min(Math.max(limit, 1), 3));

        List<noteDTO> noteList = inoteDAO.selectMainNoteList(paramMap);
        if (noteList != null) {
            for (noteDTO note : noteList) {
                note.setFileList(inoteDAO.selectNoteFileList(note.getNoteId()));
            }
        }
        return noteList;
    }

    @Override
    @Transactional
    public boolean pinNote(Long userId, Long projId, Long noteId) {
        if (inoteDAO.countPinnedNotes(userId, projId) >= 3) {
            throw new IllegalStateException("프로젝트별로 노트는 최대 3개까지 고정할 수 있습니다.");
        }
        Integer pinOrder = inoteDAO.selectNextPinOrder(userId, projId);
        if (pinOrder == null) pinOrder = 1;
        return inoteDAO.insertNotePin(userId, projId, noteId, pinOrder) > 0;
    }

    @Override
    public boolean unpinNote(Long userId, Long projId, Long noteId) {
        return inoteDAO.deleteNotePin(userId, projId, noteId) > 0;
    }


    @Override
    public boolean canDeleteNote(Long noteId, Long userId) {
        if (noteId == null || userId == null) return false;
        return inoteDAO.countNoteDeletePermission(noteId, userId) > 0;
    }

    @Override
    public noteDTO getNoteDetail(Long noteId) {
        noteDTO note = inoteDAO.selectNoteDetail(noteId);

        if (note != null) {
            note.setFileList(inoteDAO.selectNoteFileList(noteId));
        }

        return note;
    }

    @Override
    public boolean registerNote(noteDTO note) {
        return inoteDAO.insertNote(note) > 0;
    }

    @Override
    @Transactional
    public void registerNoteWithFiles(noteDTO note, List<noteFileDTO> fileList) {
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
    public boolean removeNoteReply(Long replyId, Long userId) {
        return inoteDAO.deleteNoteReply(replyId, userId) > 0;
    }
}

