package com.springboot.project.dto;

import java.util.Date;

public class chatMsgDTO {
    private int crMsgId;       // CR_MSG_ID
    private int roomId;        // ROOM_ID
    private int senderId;      // SENDER_ID
    private String senderName; // 화면 표시용 이름
    private String content;    // CONTENT
    private Date sendDate;     // SEND_DATE

    public chatMsgDTO() {}

    // Getter / Setter
    public int getCrMsgId() { return crMsgId; }
    public void setCrMsgId(int crMsgId) { this.crMsgId = crMsgId; }

    public int getRoomId() { return roomId; }
    public void setRoomId(int roomId) { this.roomId = roomId; }

    public int getSenderId() { return senderId; }
    public void setSenderId(int senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Date getSendDate() { return sendDate; }
    public void setSendDate(Date sendDate) { this.sendDate = sendDate; }
}