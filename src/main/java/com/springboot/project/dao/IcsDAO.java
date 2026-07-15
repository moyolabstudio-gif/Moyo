package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryDTO;


@Mapper // MyBatis가 이 인터페이스를 매퍼로 인식하게 해줍니다.
public interface IcsDAO {

    // 1. 전체 상담 기록 조회 (대시보드용)
    public List<csDTO> findAllCsLogs();

    // 2. 특정 사용자의 상담 기록만 조회 (하단 상세 정보용)
    // 파라미터로 넘기는 userId가 XML의 #{userId}와 연결됩니다.
    public List<csDTO> findCsByUserId(Long userId);
    
    // 3. (나중에 필요하다면) 상담 상태 변경 (OPEN -> CLOSED 등)
    // public int updateCsStatus(Long csId, String status);
    
    
    // 기존 인터페이스에 아래 내용을 추가
    // 4. 문의 로그 생성 (CS_LOGS 테이블에 insert)
    public void insertCsLog(csDTO log);
    
    // 5. 문의 메시지/답변 저장 (CS_MESSAGES 테이블에 insert)
    public void insertCsMessage(csInquiryDTO msg);
    
    // 6. 특정 상담의 모든 대화 내역 조회 (CS_MESSAGES 상세 조회를 위해)
    public List<csInquiryDTO> findMessagesByCsId(Long csId);
    
    public List<csInquiryDTO> getCategoryList();
    
    public Long getLastInsertedCsId();
    
 // IcsDAO.java
    public csDTO findActiveLogByUserId(Long userId);
    

}