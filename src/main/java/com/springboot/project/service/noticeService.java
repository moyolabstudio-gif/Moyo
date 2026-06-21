package com.springboot.project.service;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.InoticeDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.noticeDTO;

@Service
public class noticeService {

    @Autowired
    private InoticeDAO noticeDAO; 
    
    // 알림 기능을 위해 추가
    @Autowired
    private IusersDao userDAO; // 사용자 정보 가져오는 DAO
    
    @Autowired
    private IuserNoticeDAO userNoticeDAO; // 알림 저장하는 DAO

    public List<noticeDTO> getNoticeList() {
        return noticeDAO.selectNoticeList();
    }

    public void writeNotice(noticeDTO notice) {
        // 1. 공지사항 저장
        noticeDAO.insertNotice(notice);
        
        // 2. ★ 중요: 방금 저장된 NOTICE_ID를 가져와야 함 (MyBatis useGeneratedKeys 설정 필요)
        // 만약 이게 어렵다면, 별도 조회 쿼리를 써야 합니다.
        
        // 3. 알림 발송 로직
        if ("Y".equals(notice.getIsPush())) {
            List<Long> allUserIds = userDAO.getAllUserIds(); 
            for (Long userId : allUserIds) {
                userNoticeDAO.insertAlarm(userId, notice.getNoticeId());
            }
        }
    }
    
    
    // 유저별 알림 목록 조회 메서드 추가
        public List<com.springboot.project.dto.userNoticeDTO> getMyNotices(Long userId) {
        return userNoticeDAO.selectMyNotices(userId);
    }
}