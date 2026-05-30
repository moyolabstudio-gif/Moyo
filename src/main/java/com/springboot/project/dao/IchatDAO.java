package com.springboot.project.dao;

import com.springboot.project.dto.chatRoomDTO;
import com.springboot.project.dto.chatMsgDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper // 📌 Spring Boot가 MyBatis 매퍼로 인식하도록 꼭 붙여주세요!
public interface IchatDAO {
    
    // 1. 내가 참여 중인 채팅방 목록 가져오기
    List<chatRoomDTO> getMyChatRooms(int userId);
    
    // 2. 새로운 채팅방 마스터 생성하기
    int createChatRoom(chatRoomDTO room);
    
    // 3. 채팅방 참여 멤버 매핑 테이블에 저장하기
    // 파라미터가 2개 이상일 때는 XML에서 인식할 수 있도록 @Param을 붙여주는 것이 안전합니다.
    int insertChatMember(@Param("roomId") int roomId, @Param("userId") int userId);
    
    // 4. 특정 방의 과거 메시지 내역 불러오기
    List<chatMsgDTO> getMessageList(int roomId);
    
    // 5. 실시간으로 보낸 메시지 DB에 저장하기
    int insertMessage(chatMsgDTO msg);
}