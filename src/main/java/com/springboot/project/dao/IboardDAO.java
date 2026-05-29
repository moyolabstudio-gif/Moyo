package com.springboot.project.dao;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param; // 🚀 @Param 인식 확인
import com.springboot.project.dto.postDTO;

@Mapper
public interface IboardDAO {

    // 📢 1. 대시보드 위젯용 최신글 추출 (@Param 바인딩 완벽 정렬)
    List<postDTO> selectDashboardLatestPosts(@Param("wsId") Long wsId, @Param("boardType") String boardType);
    
    // 📝 2. 게시글 등록
    int insertPost(postDTO postDto);
    void insertFile(Map<String, Object> fileMap);
    List<Map<String, Object>> selectFileList(int postId);
    Map<String, Object> selectFileById(String fileId);
    int deleteFile(int fileId);
    postDTO selectPostDetail(int postId);
    
    // 💬 4. 특정 게시글에 달린 댓글 리스트 조회 (⚠️ 누락됐던 것 복원 완료!)
    List<Map<String, Object>> selectReplyList(int postId);
    
 // 🔄 댓글 수정 (영향받은 행 수 반환을 위해 int 처리)
    int updateReply(Map<String, Object> replyData);

    // 🗑️ 댓글 삭제 (영향받은 행 수 반환을 위해 int 처리)
    int deleteReply(int replyId);
    
    // 💬 5. 댓글 등록 처리 (⚠️ 누락됐던 것 복원 완료!)
    int insertReply(Map<String, Object> replyData);
    
    // 📅 6. 캘린더 이벤트 조회
    List<Map<String, Object>> selectWorkspaceCalendar(Long wsId);
    
    // 🔄 7. 게시글 수정
    int updatePost(postDTO postData);
    
    // 🗑️ 8. 게시글 삭제 (Long 규격 통일)
    int deletePost(Long postId); 
}