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
    private String writerProfileImagePath; // 그룹/프로젝트 전용 프로필 우선, 없으면 계정 프로필
    private String writerProfileAvatarType; // IMAGE / DEFAULT
    private String boardType;  // compatibility: NOTICE / FREE
    private Long channelId;    // BOARD_CHANNELS.CHANNEL_ID
    private String channelName;
    private String channelType;
    private String title;
    private String content;    // 상세조회 시 사용
    private int viewCount;
    private String isPinned;   // 'Y', 'N'
    private String pinStartDt;  // 상단 고정 시작일(YYYY-MM-DD)
    private String pinEndDt;    // 상단 고정 종료일(YYYY-MM-DD)
    private String notifyMembers; // 공지 등록 시 멤버 알림 발송 여부(Y/N, 요청용)
    private String regDt;      // 화면에 이쁘게 뿌리기 위한 문자열 날짜
    private int replyCount;    // 대시보드용 댓글 수 카운트
    private int likeCount;     // 공통 좋아요 수
    private int fileCount;     // 첨부 영역으로 올린 전체 파일 개수
    private int imageCount;    // 에디터 본문에 삽입한 이미지 개수
    private int drawingCount;  // 본문 SVG/Canvas 등 그림 요소
    private int videoCount;    // 에디터 본문에 삽입한 영상 개수
    private int linkCount;     // 본문 링크 개수
    private int documentCount; // 목록 메타의 파일 개수(첨부 영역 기준)
    private boolean hasFile;   // 파일 존재 여부
}