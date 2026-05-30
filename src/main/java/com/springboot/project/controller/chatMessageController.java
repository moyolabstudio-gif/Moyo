package com.springboot.project.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import com.springboot.project.dto.chatMessageDTO;
import com.springboot.project.dto.chatMsgDTO; // 📌 DB용 DTO 임포트 추가
import com.springboot.project.service.IchatService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class chatMessageController { // 💡 클래스 이름만 중복 안 되게 변경!

    private final SimpMessageSendingOperations messagingTemplate;
    
    // 💡 오라클 DB에 채팅을 실시간 저장하기 위해 서비스단 주입 (Lombok이 생성자 자동 주입해 줌)
    private final IchatService chatService; 

    @MessageMapping("/chat/message")
    public void message(chatMessageDTO message) {
        
        // 1. 사용자가 채팅방에 처음 들어왔을 때
        if (chatMessageDTO.MessageType.ENTER.equals(message.getType())) {
            message.setMessage(message.getSenderName() + "님이 입장하셨습니다.");
        }
        
        // 2. 🔑 일반 대화(TALK)일 때 오라클 DB에 저장하는 로직 추가!
        else if (chatMessageDTO.MessageType.TALK.equals(message.getType())) {
            chatMsgDTO dbMessage = new chatMsgDTO();
            dbMessage.setRoomId(message.getRoomId().intValue());     // Long -> int 변환
            dbMessage.setSenderId(message.getSenderId().intValue()); // Long -> int 변환
            dbMessage.setContent(message.getMessage());
            
            chatService.saveMessage(dbMessage); // 오라클 CHAT_MSGS 테이블에 INSERT
        }
        
        // 3. 구독자들에게 실시간 전달
        messagingTemplate.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }
}