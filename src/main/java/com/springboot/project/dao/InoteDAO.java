package com.springboot.project.dao;

import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface InoteDAO {

    List<noteDTO> selectNoteList(Map<String, Object> paramMap);

    List<noteDTO> selectMainNoteList(Map<String, Object> paramMap);

    List<noteDTO> selectProfilePublicNotes(Map<String, Object> paramMap);

    int countProfilePublicNotes(@Param("profileUserId") Long profileUserId);

    int countPinnedNotes(@Param("userId") Long userId, @Param("pinScopeKey") String pinScopeKey);

    Integer selectNextPinOrder(@Param("userId") Long userId, @Param("pinScopeKey") String pinScopeKey);

    int insertNotePin(@Param("userId") Long userId,
                      @Param("pinScopeKey") String pinScopeKey,
                      @Param("noteId") Long noteId,
                      @Param("pinOrder") Integer pinOrder);

    int deleteNotePin(@Param("userId") Long userId, @Param("noteId") Long noteId);

    int deleteNotePinsByNoteId(@Param("noteId") Long noteId);

    int countNoteDeletePermission(@Param("noteId") Long noteId, @Param("userId") Long userId);

    noteDTO selectNoteDetail(@Param("noteId") Long noteId, @Param("userId") Long userId);

    int insertNote(noteDTO note);

    int updateNote(noteDTO note);

    int deleteNote(@Param("noteId") Long noteId);

    int moveNoteToTrash(@Param("noteId") Long noteId, @Param("userId") Long userId);

    int restoreNoteFromTrash(@Param("noteId") Long noteId, @Param("userId") Long userId);

    int countTrashOwner(@Param("noteId") Long noteId, @Param("userId") Long userId);

    List<Long> selectExpiredTrashNoteIds();

    int insertNoteFile(noteFileDTO file);

    List<noteFileDTO> selectNoteFileList(@Param("noteId") Long noteId);

    noteFileDTO selectNoteFile(@Param("fileId") Long fileId);

    int deleteNoteFile(@Param("fileId") Long fileId);

    int deleteNoteFilesByNoteId(@Param("noteId") Long noteId);

    int countMoyoPublicNote(@Param("noteId") Long noteId);

    int incrementNoteViewCount(@Param("noteId") Long noteId);

    int selectNoteViewCount(@Param("noteId") Long noteId);

    int countNoteLike(@Param("noteId") Long noteId, @Param("userId") Long userId);

    int countAllNoteLikes(@Param("noteId") Long noteId);

    int insertNoteLike(@Param("noteId") Long noteId, @Param("userId") Long userId);

    int deleteNoteLike(@Param("noteId") Long noteId, @Param("userId") Long userId);

    List<noteReplyDTO> selectNoteReplyList(@Param("noteId") Long noteId,
                                               @Param("currentUserId") Long currentUserId);

    int countRootNoteReply(@Param("noteId") Long noteId, @Param("replyId") Long replyId);

    int countNoteReplyLike(@Param("replyId") Long replyId, @Param("userId") Long userId);

    int insertNoteReplyLike(@Param("replyId") Long replyId, @Param("userId") Long userId);

    int deleteNoteReplyLike(@Param("replyId") Long replyId, @Param("userId") Long userId);

    int insertNoteReply(noteReplyDTO reply);

    int updateNoteReply(noteReplyDTO reply);

    int deleteNoteReplyReactionsForOwnedThread(@Param("replyId") Long replyId,
                                                  @Param("userId") Long userId);

    int deleteNoteReply(@Param("replyId") Long replyId, @Param("userId") Long userId);

    int deleteNoteReplyReactionsByNoteId(@Param("noteId") Long noteId);

    int deleteNoteRepliesByNoteId(@Param("noteId") Long noteId);
}
