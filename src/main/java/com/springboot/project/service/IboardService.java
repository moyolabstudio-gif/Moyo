package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.postDTO;

public interface IboardService {
    // 대시보드 위젯용 최신글 5개 추출
    List<postDTO> getDashboardLatest(Long wsId, String boardType);

    // 워크스페이스 게시판 목록
    List<postDTO> getBoardList(Long wsId, String boardType);
    List<postDTO> getBoardList(Long wsId, String boardType, int page, int size, String searchType, String keyword);
    int getBoardListCount(Long wsId, String boardType, String searchType, String keyword);

    // 프로젝트 게시판 목록
    List<postDTO> getListByProject(Long projId, String boardType);
    List<postDTO> getListByProject(Long projId, String boardType, int page, int size, String searchType, String keyword);
    int getProjectBoardListCount(Long projId, String boardType, String searchType, String keyword);

    // 게시글 등록
    boolean registerPost(postDTO postDto);
    void registerPostWithFiles(postDTO post, List<Map<String, Object>> fileList);

    // 파일 목록 조회
    List<Map<String, Object>> getFileList(int postId);
    Map<String, Object> getFileInfo(String fileId);
    boolean deleteFile(int fileId);

    // 게시글 상세 조회
    postDTO getPostDetail(int postId);

    // 댓글
    List<Map<String, Object>> getReplyList(int postId);
    boolean registerReply(Map<String, Object> replyData);
    boolean modifyReply(Map<String, Object> replyData);
    boolean removeReply(int replyId);

    List<Map<String, Object>> selectWorkspaceCalendar(Long wsId);
    boolean canManageBoardPin(Long wsId, Long projId, Long userId);
    Map<String, Object> reportContent(String contentType, Long contentId, Long reporterId, String reason, String detail);
    List<Map<String, Object>> getReportList(Long wsId, Long projId, String status, String contentType, String keyword, int page, int size);
    int getReportListCount(Long wsId, Long projId, String status, String contentType, String keyword);
    Map<String, Object> getReportById(Long reportId);
    boolean updateReportStatus(Long reportId, String status, Long procUserId);
    boolean deleteReportedContent(Long reportId, Long procUserId);
    boolean modifyPost(postDTO postData);
    boolean deletePost(Long postId);
    String saveFile(MultipartFile file);
    void insertFile(Map<String, Object> fileMap);
}
