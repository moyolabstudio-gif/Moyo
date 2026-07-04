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

    List<noteReplyDTO> selectNoteReplyList(@Param("noteId") Long noteId);

    int insertNoteReply(noteReplyDTO reply);

    int updateNoteReply(noteReplyDTO reply);

    int deleteNoteReply(@Param("replyId") Long replyId, @Param("userId") Long userId);

    int deleteNoteRepliesByNoteId(@Param("noteId") Long noteId);
}
