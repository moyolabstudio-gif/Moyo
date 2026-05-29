package com.springboot.project.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.postDTO;

public interface IboardService {
    // 대시보드 위젯용 최신글 5개 추출
    List<postDTO> getDashboardLatest(Long wsId, String boardType);
    
    // 게시글 등록
    boolean registerPost(postDTO postDto);
    void registerPostWithFiles(postDTO post, List<Map<String, Object>> fileList);

    // 파일 목록 조회 (상세 페이지용)
    List<Map<String, Object>> getFileList(int postId);
    Map<String, Object> getFileInfo(String fileId);
    boolean deleteFile(int fileId);
    // 게시글 상세 조회
    postDTO getPostDetail(int postId);
    
    List<Map<String, Object>> getReplyList(int postId);
    boolean registerReply(Map<String, Object> replyData);
    
    // 💬 댓글 수정 및 삭제 명세 추가
    boolean modifyReply(Map<String, Object> replyData);
    boolean removeReply(int replyId);
    
    List<Map<String, Object>> selectWorkspaceCalendar(Long wsId);
    boolean modifyPost(postDTO postData);
    boolean deletePost(Long postId); // 👈 여기만 Long으로!
    String saveFile(MultipartFile file); // 추가
    void insertFile(Map<String, Object> fileMap); // DB 저장용 추가
    
}