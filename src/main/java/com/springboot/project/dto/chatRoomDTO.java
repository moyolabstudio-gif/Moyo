package com.springboot.project.dto;

import java.util.Date;
import java.util.List;

public class chatRoomDTO {
    private int roomId;          // ROOM_ID
    private String roomName;     // ROOM_NAME
    private Date createDate;     // CREATE_DATE
    
    private List<Integer> userIds; 
    private List<String> userNames;

    public chatRoomDTO() {}

    // Getter / Setter
    public int getRoomId() { return roomId; }
    public void setRoomId(int roomId) { this.roomId = roomId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public Date getCreateDate() { return createDate; }
    public void setCreateDate(Date createDate) { this.createDate = createDate; }

    public List<Integer> getUserIds() { return userIds; }
    public void setUserIds(List<Integer> userIds) { this.userIds = userIds; }

    public List<String> getUserNames() { return userNames; }
    public void setUserNames(List<String> userNames) { this.userNames = userNames; }
}