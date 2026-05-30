package com.springboot.project.dto;

import lombok.Data;

@Data
public class chatMessageDTO {

    public enum MessageType {
        ENTER, TALK, LEAVE
    }

    private MessageType type;    // 메시지 타입 (ENTER, TALK, LEAVE)
    private Long roomId;         // 📌 오라클 CHAT_ROOMS.ROOM_ID (NUMBER)와 매핑
    private Long senderId;       // 보낸 사람 고유 ID (USERS.USER_ID)
    private String senderName;   // 보낸 사람 이름 (USERS.USER_NAME)
    private String message;      // 메시지 내용
    private String sendTime;     // 보낸 시간
}