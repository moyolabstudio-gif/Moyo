package com.springboot.project.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IcsDAO;
import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryDTO;
import com.springboot.project.service.IcsService;

@Service // 이 어노테이션이 있어야 Spring이 "아, 서비스구나" 하고 인식합니다.
public class IcsServiceImpl implements IcsService {

    @Autowired
    private IcsDAO icsDAO; // 여기서 DAO를 불러와야 합니다.

    @Override
    public List<csInquiryDTO> getCategoryList() {
        return icsDAO.getCategoryList(); // 쿼리 실행!
    }
    
 // IcsServiceImpl.java
    @Override
    @Transactional
    public void registerInquiry(csInquiryDTO inquiry) {
        // 1. 이미 진행 중인 상담이 있는지 확인 (USER_ID 202번 기준)
        csDTO existingLog = icsDAO.findActiveLogByUserId(inquiry.getSenderId()); 
        
        Long targetCsId;
        
        if (existingLog == null) {
            // 2. 상담이 없으면 새로 생성
            csDTO newLog = new csDTO();
            newLog.setUserId(inquiry.getSenderId());
            icsDAO.insertCsLog(newLog); // 여기서 생성된 ID가 newLog.csId에 담김
            targetCsId = newLog.getCsId();
        } else {
            // 3. 상담이 있으면 기존 ID 사용
            targetCsId = existingLog.getCsId();
        }
        
        // 4. 메시지 저장
        inquiry.setCsId(targetCsId);
        icsDAO.insertCsMessage(inquiry);
    }
    
    @Override
    public List<csInquiryDTO> getMessagesByUserId(Long userId) {
        csDTO log = icsDAO.findActiveLogByUserId(userId);
        if(log == null) return new ArrayList<>();
        return icsDAO.findMessagesByCsId(log.getCsId());
    }
}