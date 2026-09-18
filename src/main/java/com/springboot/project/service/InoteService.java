package com.springboot.project.service;

import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import com.springboot.project.dto.noteVersionDTO;

import java.util.List;
import java.util.Map;

public interface InoteService {

    List<noteDTO> getNoteList(String scopeType, Long wsId, Long projId, Long userId, String keyword);

    List<noteDTO> getNoteListPage(String scopeType, Long wsId, Long projId, Long userId, String keyword,
                                  boolean importantOnly, Long friendUserId, Long folderId, int offset, int limit);

    List<noteDTO> getMainNoteList(String scopeType, Long wsId, Long projId, Long userId, int limit);

    List<noteDTO> getProfilePublicNotes(Long profileUserId, Long viewerUserId, int limit);

    int countProfilePublicNotes(Long profileUserId);

    boolean pinNote(Long userId, Long noteId);

    boolean unpinNote(Long userId, Long noteId);

    boolean canDeleteNote(Long noteId, Long userId);

    noteDTO getNoteDetail(Long noteId, Long userId);

    boolean registerNote(noteDTO note);

    void registerNoteWithFiles(noteDTO note, List<noteFileDTO> fileList);

    boolean modifyNote(noteDTO note);

    boolean autosaveNote(noteDTO note);

    List<noteVersionDTO> getNoteVersions(Long noteId, Long userId);

    noteVersionDTO restoreNoteVersion(Long noteId, Long noteVersionId, Long userId);

    void recordCurrentNoteVersion(Long noteId, Long changedBy, String changeType, Long restoredFromVersionId);

    boolean removeNote(Long noteId);

    boolean removeNoteForAccountWithdrawal(Long noteId);

    boolean moveNoteToTrash(Long noteId, Long userId);

    boolean restoreNoteFromTrash(Long noteId, Long userId);

    boolean canPermanentlyDeleteNote(Long noteId, Long userId);

    int purgeExpiredTrashNotes();

    boolean registerNoteFile(noteFileDTO file);

    List<noteFileDTO> getNoteFileList(Long noteId);

    noteFileDTO getNoteFile(Long fileId);

    boolean removeNoteFile(Long fileId);

    boolean removeNoteFilesByNoteId(Long noteId);

    boolean isMoyoPublicNote(Long noteId);

    boolean updateMoyoPublic(Long noteId, Long userId, boolean moyoPublic);

    int recordNoteView(Long noteId);

    Map<String, Object> getNoteReactionStatus(Long noteId, Long userId);

    Map<String, Object> toggleNoteLike(Long noteId, Long userId);

    List<noteReplyDTO> getNoteReplyList(Long noteId);

    List<noteReplyDTO> getNoteReplyList(Long noteId, Long currentUserId);

    boolean canReplyToNoteReply(Long noteId, Long replyId);

    boolean toggleNoteReplyLike(Long replyId, Long userId);

    boolean registerNoteReply(noteReplyDTO reply);

    boolean modifyNoteReply(noteReplyDTO reply);

    boolean removeNoteReply(Long replyId, Long userId);
}
