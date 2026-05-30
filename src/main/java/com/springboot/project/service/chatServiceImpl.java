package com.springboot.project.service;

import com.springboot.project.dao.IchatDAO;
import com.springboot.project.dto.chatRoomDTO;
import com.springboot.project.dto.chatMsgDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service // 📌 스프링이 서비스 빈(Bean)으로 인식하여 컨트롤러에 주입할 수 있게 합니다.
public class chatServiceImpl implements IchatService {

    @Autowired
    private IchatDAO chatDAO;

    @Override
    public List<chatRoomDTO> getMyChatRooms(int userId) {
        return chatDAO.getMyChatRooms(userId);
    }

    @Override
    @Transactional // 📌 방 생성과 멤버 초대를 하나의 트랜잭션으로 묶어 에러 발생 시 자동 롤백시킵니다.
    public int makeNewChatRoom(String roomName, List<Integer> invitedUserIds, int creatorId) {
        
        // ① 새로운 방 객체 생성 후 마스터 테이블(CHAT_ROOMS)에 인서트
        chatRoomDTO newRoom = new chatRoomDTO();
        newRoom.setRoomName(roomName);
        
        // MyBatis의 selectKey 덕분에 쿼리 실행 직후 자동으로 newRoom 객체에 새 ROOM_ID가 주입됩니다.
        chatDAO.createChatRoom(newRoom); 
        int generatedRoomId = newRoom.getRoomId();

        // ② 방을 개설한 본인(나)을 채팅방 멤버 매핑 테이블(CHAT_MEMBERS)에 1순위로 등록
        chatDAO.insertChatMember(generatedRoomId, creatorId);

        // ③ 초대한 친구 유저 ID 리스트를 반복문 돌리며 매핑 테이블에 연달아 인서트
        if (invitedUserIds != null) {
            for (int memberUserId : invitedUserIds) {
                if (memberUserId != creatorId) { // 혹시 모를 본인 중복 등록 방지
                    chatDAO.insertChatMember(generatedRoomId, memberUserId);
                }
            }
        }
        
        // 생성 완료 후 컨트롤러가 다음 페이지 이동이나 소켓 처리를 할 수 있도록 방 번호를 반환합니다.
        return generatedRoomId; 
    }

    @Override
    public List<chatMsgDTO> getMessages(int roomId) {
        return chatDAO.getMessageList(roomId);
    }

    @Override
    public int saveMessage(chatMsgDTO msg) {
        return chatDAO.insertMessage(msg);
    }
}