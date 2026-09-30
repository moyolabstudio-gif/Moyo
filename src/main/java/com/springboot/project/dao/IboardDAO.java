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
    int incrementPostViewCount(@Param("postId") int postId);

    // 댓글
    List<Map<String, Object>> selectReplyList(int postId);
    Map<String, Object> selectReplyById(@Param("replyId") Long replyId);
    int updateReply(Map<String, Object> replyData);
    int softDeleteReply(@Param("replyId") int replyId, @Param("deletedBy") Long deletedBy);
    int insertReply(Map<String, Object> replyData);

    // 캘린더

    // 게시판 권한
    String selectWorkspaceBoardRole(@Param("wsId") Long wsId, @Param("userId") Long userId);
    String selectProjectBoardRole(@Param("projId") Long projId, @Param("userId") Long userId);

    // 신고
    int countReportByUser(@Param("contentType") String contentType,
                          @Param("contentId") Long contentId,
                          @Param("reporterId") Long reporterId);

    Long selectNextReportId();

    int insertReport(@Param("reportId") Long reportId,
                     @Param("contentType") String contentType,
                     @Param("contentId") Long contentId,
                     @Param("reporterId") Long reporterId,
                     @Param("reason") String reason,
                     @Param("detail") String detail);

    Map<String, Object> selectReportTargetContext(@Param("contentType") String contentType,
                                                   @Param("contentId") Long contentId);

    List<Long> selectBoardReportManagerUserIds(@Param("wsId") Long wsId,
                                                @Param("projId") Long projId);

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


    // 게시판 채널 관리
    List<Map<String, Object>> selectBoardChannels(@Param("wsId") Long wsId, @Param("projId") Long projId, @Param("includeInactive") boolean includeInactive);
    Map<String, Object> selectBoardChannel(@Param("channelId") Long channelId);
    int countGeneralChannels(@Param("wsId") Long wsId, @Param("projId") Long projId);
    int countActiveGeneralChannels(@Param("wsId") Long wsId, @Param("projId") Long projId);
    int countChannelName(@Param("wsId") Long wsId, @Param("projId") Long projId, @Param("channelName") String channelName, @Param("excludeChannelId") Long excludeChannelId);
    int insertBoardChannel(Map<String, Object> channel);
    int updateBoardChannelName(@Param("channelId") Long channelId, @Param("channelName") String channelName, @Param("updatedBy") Long updatedBy);
    int updateBoardChannelActive(@Param("channelId") Long channelId, @Param("activeYn") String activeYn, @Param("updatedBy") Long updatedBy);
    int updateBoardChannelSort(@Param("channelId") Long channelId, @Param("sortOrder") int sortOrder, @Param("updatedBy") Long updatedBy);
    int countPostsByChannel(@Param("channelId") Long channelId);
    int movePostsToChannel(@Param("fromChannelId") Long fromChannelId, @Param("toChannelId") Long toChannelId);
    int softDeleteBoardChannel(@Param("channelId") Long channelId, @Param("deletedBy") Long deletedBy);
    int insertDefaultNoticeChannel(Map<String, Object> channel);
    int insertDefaultGeneralChannel(Map<String, Object> channel);

    List<postDTO> selectPostsByChannel(@Param("channelId") Long channelId, @Param("offset") int offset, @Param("size") int size, @Param("searchType") String searchType, @Param("keyword") String keyword);
    int countPostsByChannelFiltered(@Param("channelId") Long channelId, @Param("searchType") String searchType, @Param("keyword") String keyword);
    List<Long> selectBoardNoticeRecipientUserIds(@Param("wsId") Long wsId, @Param("projId") Long projId, @Param("excludeUserId") Long excludeUserId);

    // 게시글 수정/삭제
    int updatePost(postDTO postData);
    int softDeletePost(@Param("postId") Long postId, @Param("deletedBy") Long deletedBy);
}
