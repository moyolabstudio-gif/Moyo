<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="<%= request.getContextPath() %>/css/chat.css?v=4">

<style>
    /* CSS 로딩 실패 시에도 채팅 include 영역이 본문에 풀리지 않도록 최소 보호 */
    #chat-floating-btn.chat-btn-floating {
        position: fixed;
        right: 30px;
        bottom: 96px;
        z-index: 9999;
    }
    #chat-main-modal.chat-modal,
    #mini-chat-window.chat-modal {
        display: none;
        position: fixed;
        right: 30px;
        bottom: 171px;
        z-index: 9999;
    }
</style>

<div id="chat-floating-btn" class="chat-btn-floating" onclick="toggleChatWindow()">
    <span style="font-size: 26px; color: white;">💬</span>
</div>

<div id="chat-main-modal" class="chat-modal">
    <div class="chat-header">
        <strong class="chat-header-title">💬 MOYO 톡</strong>
        <button onclick="closeChatModals()" style="background:none; border:none; color:white; font-size:22px; cursor:pointer; opacity:0.8;">&times;</button>
    </div>

    <div class="chat-tab-area">
        <button id="tab-room-btn" class="chat-tab-btn active" onclick="switchTab('room')">💬 채팅방</button>
        <button id="tab-friend-btn" class="chat-tab-btn" onclick="switchTab('friend')">👥 친구 초대</button>
    </div>
    
    <div id="room-list-view" class="chat-list-view">
        <div style="text-align: center; color: #657786; font-size: 13px; margin-top: 20px;">채팅방을 불러오는 중...</div>
    </div>

    <div id="friend-list-view" class="chat-list-view" style="display: none;">
        <div id="member-list-area" style="flex: 1; gap: 12px; display: flex; flex-direction: column;">
            <div style="text-align: center; color: #657786; font-size: 13px; margin-top: 20px;">친구 목록을 불러오는 중...</div>
        </div>
        <div class="chat-input-box">
            <input type="text" id="newRoomNameInput" class="chat-input-field" placeholder="생성할 채팅방 이름을 입력하세요...">
            <button onclick="submitCreateRoom()" class="chat-send-btn">채팅방 개설하기</button>
        </div>
    </div>
</div>

<div id="mini-chat-window" class="chat-modal">
    <div class="chat-header">
        <button onclick="backToMainModal()" style="background:none; border:none; color:white; font-size:18px; cursor:pointer; font-weight:bold;">◀</button>
        <strong id="active-room-name" class="chat-header-title">💬 실시간 대화</strong>
        <button onclick="closeChatModals()" style="background:none; border:none; color:white; font-size:22px; cursor:pointer; opacity:0.8;">&times;</button>
    </div>

    <input type="hidden" id="roomId" value="0">
    <input type="hidden" id="userId" value="${not empty sessionScope.user.userId ? sessionScope.user.userId : (not empty sessionScope.loginUserId ? sessionScope.loginUserId : sessionScope.user.getUSER_ID())}">
    <input type="hidden" id="userName" value="${not empty sessionScope.user.userName ? sessionScope.user.userName : (not empty sessionScope.loginUserName ? sessionScope.loginUserName : sessionScope.user.getUSER_NAME())}">

    <div id="chatMessageArea" class="chat-list-view" style="background: #f5f8fa;">
        <div style="align-self: center; background: #e1e8ed; color: #657786; padding: 4px 12px; border-radius: 20px; font-size: 11px;">대화 데이터 정렬 중...</div>
    </div>

    <div class="chat-input-box">
        <input type="text" id="miniMessageInput" class="chat-input-field" placeholder="메시지를 남겨보세요..." onkeypress="if(event.keyCode==13) sendMiniMessage()">
        <button onclick="sendMiniMessage()" class="chat-send-btn">보내기</button>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>

<script>
    let miniStompClient = null;

    // 💬 버튼 제어 스위치
    function toggleChatWindow() {
        const currentUserId = document.getElementById('userId').value;
    
        if (!currentUserId || currentUserId.trim() === "" || currentUserId === "0") {
            alert("실시간 채팅은 로그인 후 이용하실 수 있습니다.");
            location.href = "/users/loginForm"; 
            return;
        }

        const mainModal = document.getElementById('chat-main-modal');
        const chatWin = document.getElementById('mini-chat-window');

        if (mainModal.style.display === 'none' && chatWin.style.display === 'none') {
            mainModal.style.display = 'flex';
            switchTab('room'); // 기본 첫 탭은 내 채팅방 리스트 노출
        } else {
            closeChatModals();
        }
    } 

    // 모든 창 끄기
    function closeChatModals() {
        document.getElementById('chat-main-modal').style.display = 'none';
        document.getElementById('mini-chat-window').style.display = 'none';
    }

    // 대화창에서 다시 목록 목록 메인으로 돌아가기 기능
    function backToMainModal() {
        document.getElementById('mini-chat-window').style.display = 'none';
        document.getElementById('chat-main-modal').style.display = 'flex';
        switchTab('room');
    }

    // 🌟 카톡형 탭 뷰 토글 제어기
    function switchTab(tabName) {
        const roomView = document.getElementById('room-list-view');
        const friendView = document.getElementById('friend-list-view');
        const roomBtn = document.getElementById('tab-room-btn');
        const friendBtn = document.getElementById('tab-friend-btn');
    
        if(tabName === 'room') {
            roomView.style.display = 'flex';
            friendView.style.display = 'none';
            
            // 클래스만 교체!
            roomBtn.className = "chat-tab-btn active";
            friendBtn.className = "chat-tab-btn inactive";
            loadMyChatRooms();
        } else {
            roomView.style.display = 'none';
            friendView.style.display = 'flex';
            
            // 클래스만 교체!
            friendBtn.className = "chat-tab-btn active";
            roomBtn.className = "chat-tab-btn inactive";
            loadUserList();
        }
    }
    // 📋 [비동기] 로그인한 유저가 속한 오라클 채팅방 목록 연동
    function loadMyChatRooms() {
        const area = document.getElementById('room-list-view');
        area.innerHTML = '<div style="text-align: center; color: #657786; font-size: 12px; margin-top: 20px;">내 채팅방 불러오는 중...</div>';

        // 📌 백엔드에 추가할 API 주소 매핑 조준!
        fetch('/chat/api/myRooms')
        .then(res => res.json())
        .then(rooms => {
            area.innerHTML = '';
            if(!rooms || rooms.length === 0) {
                area.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px; margin-top: 40px;">참여 중인 대화방이 없습니다.<br>오른쪽 탭에서 방을 만들어보세요!</div>';
                return;
            }

            rooms.forEach(r => {
                const item = document.createElement('div');
                item.style.cssText = "padding: 12px 15px; background: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: background 0.1s;";
                item.onmouseover = () => item.style.background = "#f5f8fa";
                item.onmouseout = () => item.style.background = "#ffffff";
                
                // 클릭하면 해당 방 번호 세팅해서 즉시 입장 시키기
                item.onclick = () => clickEnterExistRoom(r.roomId, r.roomName);

                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; font-size: 13px; color: #1c1e21;">💬 \${r.roomName}</span>
                        <span style="font-size: 11px; color: #a1a8ae;">ID: #\${r.roomId}</span>
                    </div>
                `;
                area.appendChild(item);
            });
        })
        .catch(() => {
            area.innerHTML = '<div style="text-align: center; color: #ff4d4f; font-size: 12px; margin-top: 20px;">채팅방 목록 로딩 실패</div>';
        });
    }

    // 🚪 기존 생성된 방을 더블클릭/클릭하여 들어가는 실행기
    function clickEnterExistRoom(roomId, roomName) {
        document.getElementById('roomId').value = roomId;
        document.getElementById('active-room-name').innerText = "💬 " + roomName;
        
        document.getElementById('chat-main-modal').style.display = 'none';
        document.getElementById('mini-chat-window').style.display = 'flex';
        
        // 소켓 가동 및 과거 대역 내역 렌더
        connectChat();
    }

    // 👥 회원조회 API 연동
    function loadUserList() {
        fetch('/users/api/list') 
        .then(res => { if(!res.ok) throw new Error(); return res.json(); })
        .then(users => {
            const area = document.getElementById('member-list-area');
            area.innerHTML = '';
            const myId = document.getElementById('userId').value;
            let hasFriends = false;

            users.forEach(u => {
                if(String(u.userId) === String(myId)) return;
                hasFriends = true;

                const label = document.createElement('label');
                label.style.cssText = "display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; cursor: pointer; font-size: 13px; color: #1c1e21;";
                label.innerHTML = `
                    <input type="checkbox" name="invitedUsers" value="\${u.userId}" style="width:16px; height:16px;">
                    <span style="font-weight: 500;">\${u.userName}</span>
                    <span style="color: #657786; font-size: 12px;">(\${u.email})</span>
                `;
                area.appendChild(label);
            });
            if(!hasFriends) area.innerHTML = `<div style="text-align: center; color: #657786; font-size: 12px; mt: 30px;">초대할 유저가 없습니다.</div>`;
        })
        .catch(() => {
            document.getElementById('member-list-area').innerHTML = `<div style="text-align: center; color: #ff4d4f; font-size: 12px;">유저 목록 호출 실패</div>`;
        });
    }

    // 🚀 방 생성 처리
    function submitCreateRoom() {
        const roomNameInput = document.getElementById('newRoomNameInput');
        const roomName = roomNameInput.value.trim();
        if(!roomName) return alert('방 이름을 입력해 주세요.');
        
        const checkboxes = document.querySelectorAll('input[name="invitedUsers"]:checked');
        const invitedUsers = [];
        checkboxes.forEach(cb => invitedUsers.push(parseInt(cb.value)));
        
        if(invitedUsers.length === 0) return alert('초대할 유저를 선택해 주세요.');

        const params = new URLSearchParams();
        params.append("roomName", roomName);
        invitedUsers.forEach(id => params.append("invitedUsers", id));

        fetch('/chat/createRoom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        })
        .then(res => res.text())
        .then(result => {
            if (result === "FAIL_LOGIN") {
                alert("로그인 세션 만료");
                location.href = "/users/loginForm";
            } else if (result === "FAIL_ERROR") {
                alert("서버단 생성 에러");
            } else {
                const newRoomId = parseInt(result);
                document.getElementById('roomId').value = newRoomId;
                document.getElementById('active-room-name').innerText = "💬 " + roomName;
                roomNameInput.value = '';

                document.getElementById('chat-main-modal').style.display = 'none';
                document.getElementById('mini-chat-window').style.display = 'flex';
                
                connectChat();
            }
        })
        .catch(err => alert("통신 오류 발생"));
    }

    // 🌐 웹소켓 가동 및 방 구독 신청
    function connectChat() {
        const roomId = document.getElementById('roomId').value;
        const area = document.getElementById('chatMessageArea');
        area.innerHTML = `<div style="align-self: center; background: #e1e8ed; color: #657786; padding: 4px 12px; border-radius: 20px; font-size: 11px;">연결 중...</div>`;

        miniStompClient = Stomp.over(new SockJS('/ws-stomp'));
        miniStompClient.debug = null;

        miniStompClient.connect({}, function () {
            area.innerHTML = '';
            
            // 1. 새 방 번호 전용 주소 구독
            miniStompClient.subscribe('/sub/chat/room/' + roomId, function (res) { 
                receiveMiniMessage(JSON.parse(res.body)); 
            });
            
            // 2. 입장 완료 브로드캐스트 전송
            miniStompClient.send("/pub/chat/message", {}, JSON.stringify({
                type:'ENTER', 
                roomId: roomId, 
                senderId: document.getElementById('userId').value, 
                senderName: document.getElementById('userName').value, 
                message: ''
            }));
        }, function (error) {
            area.innerHTML = `<div style="align-self: center; background: #ffccd5; color: #ff4d4f; padding: 4px 12px; border-radius: 20px; font-size: 11px;">연결 실패</div>`;
        });
    }

    function sendMiniMessage() {
        const input = document.getElementById('miniMessageInput');
        if(input.value.trim() === "" || !miniStompClient) return;
        
        miniStompClient.send("/pub/chat/message", {}, JSON.stringify({
            type: 'TALK', 
            roomId: document.getElementById('roomId').value, 
            senderId: document.getElementById('userId').value, 
            senderName: document.getElementById('userName').value, 
            message: input.value
        }));
        input.value = '';
    }


    
 // 🌐 [통합 및 수정] 웹소켓 가동 및 과거 대화 내역 로딩 결합
    function connectChat() {
        const roomId = document.getElementById('roomId').value;
        const area = document.getElementById('chatMessageArea');
        area.innerHTML = `<div style="align-self: center; background: #e1e8ed; color: #657786; padding: 4px 12px; border-radius: 20px; font-size: 11px;">연결 중...</div>`;

        // 기존 연결이 남아있다면 안전하게 끊고 새로 연결
        if (miniStompClient !== null) {
            try { miniStompClient.disconnect(); } catch(e) {}
        }

        miniStompClient = Stomp.over(new SockJS('/ws-stomp'));
        miniStompClient.debug = null;

        miniStompClient.connect({}, function () {
            // 1. 백엔드 API로부터 과거 대화 내역(JSON 리스트)을 받아옵니다.
            fetch('/chat/api/messages/' + roomId)
            .then(res => res.json())
            .then(messages => {
                area.innerHTML = ''; // 로딩 메시지 비우기
                
                // 기존에 저장되어 있던 과거 메시지 출력
                if(messages && messages.length > 0) {
                    messages.forEach(msg => {
                        receiveMiniMessage(msg);
                    });
                    
                    // 과거 내역 로딩 구분선
                    const divider = document.createElement('div');
                    divider.style.cssText = "align-self: center; color: #a1a8ae; font-size: 10px; margin: 10px 0; border-bottom: 1px dashed #e1e8ed; width: 100%; text-align: center; line-height: 0.1em;";
                    divider.innerHTML = `<span style="background:#f5f8fa; padding:0 10px;">여기까지 읽으셨습니다</span>`;
                    area.appendChild(divider);
                }
                
                // 2. 실시간 새 메시지 구독 설정 (입장문 도배를 막기 위해 ENTER 메시지는 송신하지 않음)
                miniStompClient.subscribe('/sub/chat/room/' + roomId, function (res) { 
                    receiveMiniMessage(JSON.parse(res.body)); 
                });
                
                // 스크롤 최하단 이동
                area.scrollTop = area.scrollHeight;
            })
            .catch(err => {
                console.error("과거 메시지 로딩 실패:", err);
                area.innerHTML = '<div style="text-align: center; color: red; font-size: 11px;">과거 메시지를 불러오지 못했습니다.</div>';
            });

        }, function (error) {
            area.innerHTML = `<div style="align-self: center; background: #ffccd5; color: #ff4d4f; padding: 4px 12px; border-radius: 20px; font-size: 11px;">연결 실패</div>`;
        });
    }

 // 📩 [컬럼명 매핑 최종 저격] 메시지 화면 렌더링 함수
function receiveMiniMessage(data) {
    console.log("받은 데이터:", data);
    const area = document.getElementById('chatMessageArea');
    const myId = document.getElementById('userId').value;
    
    const senderId = data.senderId || data.sender_id || data.SENDER_ID;
    const senderName = data.senderName || data.sendername || data.SENDERNAME || "알수없음";
    const message = data.content || data.CONTENT || data.message || data.MESSAGE; 
    const type = data.type || data.TYPE || 'TALK';
    
    // 시간 계산
    const rawDate = data.send_date || data.SEND_DATE || data.sendDate;
    let displayTime = "";
    
    const dateObj = rawDate ? new Date(rawDate) : new Date();
    
    if(!isNaN(dateObj.getTime())) {
        displayTime = dateObj.getHours().toString().padStart(2, '0') + ":" + 
                      dateObj.getMinutes().toString().padStart(2, '0');
    }
    
    if (!message && type !== 'ENTER' && type !== 'LEAVE') return;
    
    const isMe = String(senderId) === String(myId);
    const msgDiv = document.createElement('div');
    
    // 템플릿 리터럴(`) 대신 + 연산자 사용
    if (type === 'ENTER' || type === 'LEAVE') {
        msgDiv.style.cssText = "align-self: center; background: #e1e8ed; color: #657786; padding: 4px 12px; border-radius: 20px; font-size: 11px; margin: 4px 0;";
        msgDiv.innerText = message || "입장/퇴장";
    } else if (isMe) {
        msgDiv.style.cssText = "align-self: flex-end; display: flex; align-items: flex-end; gap: 5px; max-width: 75%; margin-bottom: 2px;";
        msgDiv.innerHTML = '<span style="font-size: 10px; color: #a1a8ae;">' + displayTime + '</span>' +
                           '<div style="background: #4A90E2; color: #ffffff; padding: 8px 12px; border-radius: 12px 12px 0px 12px; font-size: 13px; word-break: break-all; text-align: left;">' + message + '</div>';
    } else {
        msgDiv.style.cssText = "align-self: flex-start; max-width: 75%; display: flex; flex-direction: column; margin-bottom: 2px;";
        msgDiv.innerHTML = '<span style="font-size: 10px; color: #657786; margin: 0 0 3px 3px; font-weight: 500;">' + senderName + '</span>' +
                           '<div style="display: flex; align-items: flex-end; gap: 5px;">' +
                           '<div style="background: #ffffff; color: #1c1e21; padding: 8px 12px; border-radius: 12px 12px 12px 0px; font-size: 13px; word-break: break-all; border: 1px solid #e1e8ed;">' + message + '</div>' +
                           '<span style="font-size: 10px; color: #a1a8ae;">' + displayTime + '</span>' +
                           '</div>';
    }
    
    area.appendChild(msgDiv);
    area.scrollTop = area.scrollHeight; 
}
</script>