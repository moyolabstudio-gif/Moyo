package com.springboot.project.service.impl;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IboardDAO;
import com.springboot.project.dto.postDTO;
import com.springboot.project.service.IboardService;

@Service
public class boardServiceImpl implements IboardService {

    @Autowired
    private IboardDAO iboardDAO;

    @Override
    public List<postDTO> getDashboardLatest(Long wsId, String boardType) {
        return iboardDAO.selectDashboardLatestPosts(wsId, boardType);
    }

    @Override
    public boolean registerPost(postDTO postDto) {
        return iboardDAO.insertPost(postDto) > 0;
    }
    @Override
    @Transactional
    public void registerPostWithFiles(postDTO post, List<Map<String, Object>> fileList) {
        // 1. 게시글 저장
        iboardDAO.insertPost(post);
        
        // 2. 파일 목록 저장
        if (fileList != null && !fileList.isEmpty()) {
            for (Map<String, Object> fileMap : fileList) {
                fileMap.put("postId", post.getPostId());
                insertFile(fileMap); // 💡 새로 만든 insertFile 서비스 메서드 호출로 통일
            }
        }
    }

    // 서비스 인터페이스와 구현체에 이미 있는 insertFile을 활용합니다.
    @Override
    public void insertFile(Map<String, Object> fileMap) {
        iboardDAO.insertFile(fileMap);
    }

    @Override
    public List<Map<String, Object>> getFileList(int postId) {
        return iboardDAO.selectFileList(postId);
    }
    
    @Override
    public Map<String, Object> getFileInfo(String fileId) {
        return iboardDAO.selectFileById(fileId);
    }
    // 💡 기존 로직 신뢰성 유지 (int 규격 그대로 유지)
    @Override
    public postDTO getPostDetail(int postId) {
        return iboardDAO.selectPostDetail(postId);
    }

    // 💡 기존 로직 신뢰성 유지 (int 규격 그대로 유지)
    @Override
    public List<Map<String, Object>> getReplyList(int postId) {
        return iboardDAO.selectReplyList(postId);
    }
    @Override
    public boolean modifyReply(Map<String, Object> replyData) {
        // 성공 시 1행 업데이트되므로 0보다 크면 true 반환
        return iboardDAO.updateReply(replyData) > 0;
    }

    // 💬 댓글 삭제 비즈니스 구현
    @Override
    public boolean removeReply(int replyId) {
        // 성공 시 1행 삭제되므로 0보다 크면 true 반환
        return iboardDAO.deleteReply(replyId) > 0;
    }

    @Override
    public boolean registerReply(Map<String, Object> replyData) {
        return iboardDAO.insertReply(replyData) > 0;
    }
    
    @Override
    public List<Map<String, Object>> selectWorkspaceCalendar(Long wsId) {
        return iboardDAO.selectWorkspaceCalendar(wsId);
    }
    
    @Override
    public boolean modifyPost(postDTO postData) {
        return iboardDAO.updatePost(postData) > 0;
    }
    
    // 🚀 수정 포인트: 인터페이스 스펙 및 DTO ID 타입에 맞춰 Long으로 최종 일치
    @Override
    public boolean deletePost(Long postId) {
        return iboardDAO.deletePost(postId) > 0;
    }
    @Override
    public boolean deleteFile(int fileId) {
        // 1. DB에서 파일 정보 조회
        Map<String, Object> fileInfo = iboardDAO.selectFileById(String.valueOf(fileId));
        if (fileInfo == null) return false;

        // 2. 서버의 실제 물리 파일 삭제
        String filePath = "C:/MoyoLab.Studio/upload/" + fileInfo.get("FILE_NAME");
        File file = new File(filePath);
        if (file.exists()) {
            file.delete();
        }

        // 3. DB 삭제
        return iboardDAO.deleteFile(fileId) > 0;
    }
    @Override
    public String saveFile(MultipartFile file) {
        try {
            String uploadPath = "C:/MoyoLab.Studio/upload/";
            File folder = new File(uploadPath);
            if (!folder.exists()) folder.mkdirs();

            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String savedFileName = UUID.randomUUID().toString() + extension;

            File targetFile = new File(uploadPath + savedFileName);
            file.transferTo(targetFile);

            return savedFileName;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패: " + e.getMessage());
        }
    }
    @Override
    public List<postDTO> getListByProject(Long projId, String boardType) {
        return iboardDAO.selectPostsByProject(projId, boardType);
    }
    
}