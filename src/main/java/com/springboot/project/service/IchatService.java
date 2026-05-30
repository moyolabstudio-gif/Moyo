package com.springboot.project.service;

import com.springboot.project.dto.chatRoomDTO;
import com.springboot.project.dto.chatMsgDTO;
import java.util.List;

public interface IchatService {
    
    // 1. 내가 참여 중인 채팅방 목록 가져오기
    List<chatRoomDTO> getMyChatRooms(int userId);
    
    // 2. 새로운 채팅방 개설 및 멤버 일괄 초대 (🔑 트랜잭션 핵심)
    int makeNewChatRoom(String roomName, List<Integer> invitedUserIds, int creatorId);
    
    // 3. 특정 방의 과거 대화 내역 가져오기
    List<chatMsgDTO> getMessages(int roomId);
    
    // 4. 실시간 전송된 메시지 DB에 저장하기
    int saveMessage(chatMsgDTO msg);
}