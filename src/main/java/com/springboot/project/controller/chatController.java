package com.springboot.project.controller;

import com.springboot.project.dto.chatRoomDTO;
import com.springboot.project.dto.chatMsgDTO;
import com.springboot.project.dto.usersDto; // 🌟 내 유저 DTO 임포트 확인!
import com.springboot.project.service.IchatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.List;

@Controller
@RequestMapping("/chat")
public class chatController {

    @Autowired
    private IchatService chatService;

    /**
     * 세션에서 안전하게 로그인한 사용자의 ID(Integer)를 추출하는 공통 메서드
     */
    private Integer getLoginUserIdFromSession(HttpSession session) {
        // 1. 세션에 "user" 객체가 들어있는 경우 처리
        if (session.getAttribute("user") != null) {
            usersDto user = (usersDto) session.getAttribute("user");
            if (user.getUserId() != null) {
                return user.getUserId().intValue(); // 🌟 Long을 Integer로 캐스팅하여 반환
            }
        }
        
        // 2. 만약 "loginUserId"로 직접 들어있을 경우의 예외 처리
        if (session.getAttribute("loginUserId") != null) {
            Object val = session.getAttribute("loginUserId");
            if (val instanceof Long) return ((Long) val).intValue();
            if (val instanceof Integer) return (Integer) val;
        }
        
        return null;
    }

    /**
     * 1. 내가 참여 중인 채팅방 목록 페이지 이동
     */
    @GetMapping("/roomList")
    public String chatRoomList(HttpSession session, Model model) {
        Integer loginUserId = getLoginUserIdFromSession(session); // 🌟 안전한 검증으로 교체
        if (loginUserId == null) {
            return "redirect:/login"; 
        }

        List<chatRoomDTO> rooms = chatService.getMyChatRooms(loginUserId);
        model.addAttribute("rooms", rooms);
        
        return "chat/roomList"; 
    }

    /**
     * 2. 새로운 채팅방 개설 (비동기 AJAX)
     */
    @PostMapping("/createRoom")
    @ResponseBody
    public String createRoom(
            @RequestParam("roomName") String roomName,
            @RequestParam(value = "invitedUsers", required = false) List<Integer> invitedUsers,
            HttpSession session) {
        
        Integer loginUserId = getLoginUserIdFromSession(session); // 🌟 안전한 검증으로 교체
        if (loginUserId == null) {
            System.out.println("[CHAT DEBUG] 방 생성 실패: 세션에 로그인 유저 정보가 없습니다.");
            return "FAIL_LOGIN";
        }

        try {
            int newRoomId = chatService.makeNewChatRoom(roomName, invitedUsers, loginUserId);
            return String.valueOf(newRoomId); 
        } catch (Exception e) {
            e.printStackTrace();
            return "FAIL_ERROR";
        }
    }

    /**
     * 3. 특정 채팅방 입장 (과거 대화 내역 로딩)
     */
    @GetMapping("/room/{roomId}")
    public String enterRoom(@PathVariable("roomId") int roomId, Model model, HttpSession session) {
        Integer loginUserId = getLoginUserIdFromSession(session); // 🌟 안전한 검증으로 교체
        if (loginUserId == null) {
            return "redirect:/login";
        }

        List<chatMsgDTO> messages = chatService.getMessages(roomId);
        
        model.addAttribute("roomId", roomId);
        model.addAttribute("messages", messages);
        model.addAttribute("loginUserId", loginUserId); 

        return "chat/roomDetail"; 
    }
    
    /**
     * 🌟 [내 참여 채팅방 리스트 JSON 반환용 API 주소]
     */
    @GetMapping("/api/myRooms")
    @ResponseBody
    public List<chatRoomDTO> getMyRoomsApi(HttpSession session) {
        Integer loginUserId = getLoginUserIdFromSession(session); 
        if (loginUserId == null) return null;

        return chatService.getMyChatRooms(loginUserId); // 서비스단 쿼리 메서드 호출
    }
    
    /**
     * 🌟 [추가] 특정 채팅방의 과거 대화 내역을 JSON 데이터로 반환 (AJAX용)
     */
    @GetMapping("/api/messages/{roomId}")
    @ResponseBody
    public List<chatMsgDTO> getRoomMessagesApi(@PathVariable("roomId") int roomId, HttpSession session) {
        Integer loginUserId = getLoginUserIdFromSession(session); 
        if (loginUserId == null) return null;

        // 해당 방의 과거 메시지 리스트 리턴
        return chatService.getMessages(roomId); 
    }
    
}