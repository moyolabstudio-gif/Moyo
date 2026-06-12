package com.springboot.project.dao;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.springboot.project.dto.postDTO;

@Mapper
public interface IboardDAO {

    // 대시보드 위젯용 최신글
    List<postDTO> selectDashboardLatestPosts(@Param("wsId") Long wsId, @Param("boardType") String boardType);

    // 워크스페이스 게시판 목록 / 개수
    List<postDTO> selectBoardList(@Param("wsId") Long wsId,
                                  @Param("boardType") String boardType,
                                  @Param("offset") int offset,
                                  @Param("size") int size,
                                  @Param("searchType") String searchType,
                                  @Param("keyword") String keyword);

    int countBoardList(@Param("wsId") Long wsId,
                       @Param("boardType") String boardType,
                       @Param("searchType") String searchType,
                       @Param("keyword") String keyword);

    // 프로젝트 게시판 목록 / 개수
    List<postDTO> selectPostsByProject(@Param("projId") Long projId,
                                        @Param("boardType") String boardType,
                                        @Param("offset") int offset,
                                        @Param("size") int size,
                                        @Param("searchType") String searchType,
                                        @Param("keyword") String keyword);

    int countPostsByProject(@Param("projId") Long projId,
                            @Param("boardType") String boardType,
                            @Param("searchType") String searchType,
                            @Param("keyword") String keyword);

    // 게시글 등록
    int insertPost(postDTO postDto);
    void insertFile(Map<String, Object> fileMap);
    List<Map<String, Object>> selectFileList(int postId);
    Map<String, Object> selectFileById(String fileId);
    int deleteFile(int fileId);
    postDTO selectPostDetail(int postId);

    // 댓글
    List<Map<String, Object>> selectReplyList(int postId);
    int updateReply(Map<String, Object> replyData);
    int deleteReply(int replyId);
    int insertReply(Map<String, Object> replyData);

    // 캘린더
    List<Map<String, Object>> selectWorkspaceCalendar(Long wsId);

    // 게시판 권한
    String selectWorkspaceBoardRole(@Param("wsId") Long wsId, @Param("userId") Long userId);
    String selectProjectBoardRole(@Param("projId") Long projId, @Param("userId") Long userId);

    // 신고
    int countReportByUser(@Param("contentType") String contentType,
                          @Param("contentId") Long contentId,
                          @Param("reporterId") Long reporterId);

    int insertReport(@Param("contentType") String contentType,
                     @Param("contentId") Long contentId,
                     @Param("reporterId") Long reporterId,
                     @Param("reason") String reason,
                     @Param("detail") String detail);

    // 신고 관리
    List<Map<String, Object>> selectReportList(@Param("wsId") Long wsId,
                                               @Param("projId") Long projId,
                                               @Param("status") String status,
                                               @Param("contentType") String contentType,
                                               @Param("keyword") String keyword,
                                               @Param("offset") int offset,
                                               @Param("size") int size);

    int countReportList(@Param("wsId") Long wsId,
                        @Param("projId") Long projId,
                        @Param("status") String status,
                        @Param("contentType") String contentType,
                        @Param("keyword") String keyword);

    Map<String, Object> selectReportById(@Param("reportId") Long reportId);

    int updateReportStatus(@Param("reportId") Long reportId,
                           @Param("status") String status,
                           @Param("procUserId") Long procUserId);

    // 게시글 수정/삭제
    int updatePost(postDTO postData);
    int deletePost(Long postId);
}
