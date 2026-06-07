package com.springboot.project.service;

import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;

import java.util.List;

public interface InoteService {

    List<noteDTO> getNoteList(Long wsId, Long projId, Long userId);

    List<noteDTO> getMainNoteList(Long wsId, Long projId, Long userId, int limit);

    boolean pinNote(Long userId, Long projId, Long noteId);

    boolean unpinNote(Long userId, Long projId, Long noteId);

    boolean canDeleteNote(Long noteId, Long userId);

    noteDTO getNoteDetail(Long noteId);

    boolean registerNote(noteDTO note);

    void registerNoteWithFiles(noteDTO note, List<noteFileDTO> fileList);

    boolean modifyNote(noteDTO note);

    boolean removeNote(Long noteId);

    boolean registerNoteFile(noteFileDTO file);

    List<noteFileDTO> getNoteFileList(Long noteId);

    noteFileDTO getNoteFile(Long fileId);

    boolean removeNoteFile(Long fileId);

    boolean removeNoteFilesByNoteId(Long noteId);

    List<noteReplyDTO> getNoteReplyList(Long noteId);

    boolean registerNoteReply(noteReplyDTO reply);

    boolean removeNoteReply(Long replyId, Long userId);
}

