package com.springboot.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class postDTO {
    private Long postId;
    private Long wsId;
    private Long projId;
    private Long userId;
    private String writerName; // JOIN을 통해 가져올 작성자 이름
    private String boardType;  // 'NOTICE', 'FREE'
    private String title;
    private String content;    // 상세조회 시 사용
    private int viewCount;
    private String isPinned;   // 'Y', 'N'
    private String pinStartDt;  // 상단 고정 시작일(YYYY-MM-DD)
    private String pinEndDt;    // 상단 고정 종료일(YYYY-MM-DD)
    private String regDt;      // 화면에 이쁘게 뿌리기 위한 문자열 날짜
    private int replyCount;    // 대시보드용 댓글 수 카운트
    private int likeCount;     // 공통 좋아요 수
    private int fileCount;     // 첨부파일 개수
 // 추가: 첨부파일 관련 정보
    private String fileName;    // 파일 원본 이름
    private String filePath;    // 파일 저장 경로
    private boolean hasFile;    // 파일 존재 여부 (리스트에서 아이콘 표시용)
}