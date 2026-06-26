package com.springboot.project.service;

import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;

import java.util.List;
import java.util.Map;

public interface InoteService {

    List<noteDTO> getNoteList(String scopeType, Long wsId, Long projId, Long userId, String keyword);

    List<noteDTO> getNoteListPage(String scopeType, Long wsId, Long projId, Long userId, String keyword,
                                  boolean importantOnly, Long friendUserId, Long folderId, int offset, int limit);

    List<noteDTO> getMainNoteList(String scopeType, Long wsId, Long projId, Long userId, int limit);

    boolean pinNote(Long userId, Long noteId);

    boolean unpinNote(Long userId, Long noteId);

    boolean canDeleteNote(Long noteId, Long userId);

    noteDTO getNoteDetail(Long noteId, Long userId);

    boolean registerNote(noteDTO note);

    void registerNoteWithFiles(noteDTO note, List<noteFileDTO> fileList);

    boolean modifyNote(noteDTO note);

    boolean removeNote(Long noteId);

    boolean moveNoteToTrash(Long noteId, Long userId);

    boolean restoreNoteFromTrash(Long noteId, Long userId);

    boolean canPermanentlyDeleteNote(Long noteId, Long userId);

    boolean registerNoteFile(noteFileDTO file);

    List<noteFileDTO> getNoteFileList(Long noteId);

    noteFileDTO getNoteFile(Long fileId);

    boolean removeNoteFile(Long fileId);

    boolean removeNoteFilesByNoteId(Long noteId);

    List<noteReplyDTO> getNoteReplyList(Long noteId);

    boolean registerNoteReply(noteReplyDTO reply);

    boolean modifyNoteReply(noteReplyDTO reply);

    boolean removeNoteReply(Long replyId, Long userId);
}
