<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MOYO 채팅 푸터</title>
</head>
<body>

<div id="chat-floating-btn" onclick="toggleChatWindow()" style="position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: #4A90E2; border-radius: 50%; box-shadow: 0 4px 15px rgba(74,144,226,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 9999; transition: transform 0.2s;">
    <span style="font-size: 26px; color: white;">💬</span>
</div>

<div id="mini-chat-window" style="position: fixed; bottom: 105px; right: 30px; width: 350px; height: 480px; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); display: none; flex-direction: column; z-index: 9999; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border: 1px solid #e1e8ed;">
    
    <div style="background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); padding: 15px; display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: -0.5px;">💬 MOYO 실시간 대화</strong>
        <button onclick="toggleChatWindow()" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #ffffff; opacity: 0.8; line-height: 1;">&times;</button>
    </div>

    <div style="display: none;">
        <input type="number" id="roomId" value="1">
        <input type="number" id="userId" value="${sessionScope.user.userId}">
        <input type="text" id="userName" value="${sessionScope.user.userName}">
    </div>
    <div id="chatMessageArea" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f5f8fa;">
        <div style="align-self: center; background: #e1e8ed; color: #657786; padding: 4px 12px; border-radius: 20px; font-size: 11px;">우측 상단 [연결] 버튼을 눌러주세요.</div>
    </div>

    <div style="background: #ffffff; padding: 12px; display: flex; gap: 8px; border-top: 1px solid #eee; align-items: center;">
        <input type="text" id="miniMessageInput" style="flex: 1; border: 1px solid #e1e8ed; padding: 8px 12px; border-radius: 6px; font-size: 13px; outline: none; background: #fafafa;" placeholder="팀원에게 메시지를 남겨보세요..." onkeypress="if(event.keyCode==13) sendMiniMessage()">
        <button onclick="sendMiniMessage()" style="background: #4A90E2; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background 0.2s;">보내기</button>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>

<script>
    let miniStompClient = null;

    // 💬 버튼 클릭 시 미니창 토글 및 자동 연결 처리
    function toggleChatWindow() {
            // 📌 1. 현재 로그인한 유저 ID가 있는지 먼저 체크
            const currentUserId = document.getElementById('userId').value;
        
            if (!currentUserId || currentUserId.trim() === "") {
                alert("실시간 채팅은 로그인 후 이용하실 수 있습니다.");
                location.href = "/users/loginForm"; // 로그인 페이지로 유도
                return;
            }

            // 📌 2. 로그인된 상태라면 정상적으로 대화창 열기
            const chatWin = document.getElementById('mini-chat-window');
            if (chatWin.style.display === 'none' || chatWin.style.display === '') {
                chatWin.style.display = 'flex';
                if (!miniStompClient) {
                    connectChat(); // 소켓 연결 및 과거 내역 로딩
                }
            } else {
                chatWin.style.display = 'none';
            }
        } 
    function connectChat() {
        const roomId = document.getElementById('roomId').value;
        const area = document.getElementById('chatMessageArea');
        area.innerHTML = `<div style="align-self: center; background: #e1e8ed; color: #657786; padding: 4px 12px; border-radius: 20px; font-size: 11px;">서버 연결 중...</div>`;

        // 안전한 cdnjs/jsdelivr 기반 SockJS-STOMP 표준 객체 생성 순정 코딩
        miniStompClient = Stomp.over(new SockJS('/ws-stomp'));
        
        // 콘솔에 지저분하게 출력되는 웹소켓 프레임 로그 비활성화
        miniStompClient.debug = null; 

        miniStompClient.connect({}, function () {
            area.innerHTML = '';
            
            // 1. 해당 채팅방 주소 구독 신청
            miniStompClient.subscribe('/sub/chat/room/' + roomId, function (res) { 
                receiveMiniMessage(JSON.parse(res.body)); 
            });
            
            // 2. 컨트롤러로 입장 알림(ENTER) 전송
            miniStompClient.send("/pub/chat/message", {}, JSON.stringify({
                type:'ENTER', 
                roomId: roomId, 
                senderId: document.getElementById('userId').value, 
                senderName: document.getElementById('userName').value, 
                message: ''
            }));
        }, function (error) {
            area.innerHTML = `<div style="align-self: center; background: #ffccd5; color: #ff4d4f; padding: 4px 12px; border-radius: 20px; font-size: 11px;">연결 실패: 페이지를 새로고침 하세요.</div>`;
        });
    }

    function sendMiniMessage() {
        const input = document.getElementById('miniMessageInput');
        if(input.value.trim() === "" || !miniStompClient) return;
        
        // 컨트롤러로 대화 내용(TALK) 전송 -> 서버에서 받아서 오라클 DB 저장 후 브로드캐스팅 진행
        miniStompClient.send("/pub/chat/message", {}, JSON.stringify({
            type: 'TALK', 
            roomId: document.getElementById('roomId').value, 
            senderId: document.getElementById('userId').value, 
            senderName: document.getElementById('userName').value, 
            message: input.value
        }));
        input.value = '';
    }

    function receiveMiniMessage(data) {
        const area = document.getElementById('chatMessageArea');
        const isMe = String(data.senderId) === String(document.getElementById('userId.value') || document.getElementById('userId').value);
        const msgDiv = document.createElement('div');
        
        if (data.type === 'ENTER' || data.type === 'LEAVE') {
            msgDiv.style.cssText = "align-self: center; background: #e1e8ed; color: #657786; padding: 4px 12px; border-radius: 20px; font-size: 11px; margin: 4px 0;";
            msgDiv.innerText = data.message;
        } else if (isMe) {
            // 내가 보낸 대화 스타일링
            msgDiv.style.cssText = "align-self: flex-end; max-width: 75%; margin-bottom: 2px;";
            msgDiv.innerHTML = `<div style="background: #4A90E2; color: #ffffff; padding: 8px 12px; border-radius: 12px 12px 0px 12px; font-size: 13px; word-break: break-all; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: left;">\${data.message}</div>`;
        } else {
            // 상대방이 보낸 대화 스타일링
            msgDiv.style.cssText = "align-self: flex-start; max-width: 75%; display: flex; flex-direction: column; margin-bottom: 2px;";
            msgDiv.innerHTML = `
                <span style="font-size: 10px; color: #657786; margin: 0 0 3px 3px; font-weight: 500;">\${data.senderName}</span>
                <div style="background: #ffffff; color: #1c1e21; padding: 8px 12px; border-radius: 12px 12px 12px 0px; font-size: 13px; word-break: break-all; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">\${data.message}</div>
            `;
        }
        area.appendChild(msgDiv);
        area.scrollTop = area.scrollHeight; // 최신 대화로 스크롤 포커싱
    }
</script>
</body>
</html>