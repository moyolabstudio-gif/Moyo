<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>문의하기 | MOYO</title>
    <link rel="stylesheet" href="/css/moyo-home.css">
 <style>
    /* 전체 배경을 MOYO 느낌으로 */
    .moyo-chat-page { background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%); min-height: 100vh; padding: 40px; }
    
    /* 던파의 상단 영역을 MOYO 카드 스타일로 */
    .moyo-chat-header { 
        max-width: 800px; margin: 0 auto 20px; padding: 40px; 
        background: linear-gradient(135deg, #397BE8, #8B6CFF);
        border-radius: var(--moyo-radius-xl); color: white;
    }
    
    /* 대화창 전체 박스 */
    .moyo-chat-container { 
        max-width: 800px; 
        margin: 0 auto; 
        background: white; 
        border-radius: var(--moyo-radius-lg); 
        border: 1px solid var(--moyo-line);
        box-shadow: var(--moyo-shadow); 
        height: 600px; 
        display: flex;          /* 부모가 Flex */
        flex-direction: column; /* 세로로 쌓기 */
        overflow: hidden; 
    }
    
    #chat-messages {
        flex: 1;                /* 남은 공간 차지 */
        overflow-y: auto;       /* 스크롤 활성화 */
        display: flex; 
        flex-direction: column;
        min-height: 0;          /* 중요: 자식 요소 높이 계산 문제 해결 */
        padding: 20px;
    }
    
    /* 말풍선 스타일 */
/* 말풍선 스타일 수정 */
    .chat-bubble { 
        padding: 16px 20px; 
        border-radius: 20px; 
        margin: 10px; 
        max-width: 70%; 
        font-weight: 700; 
    }
    
    /* 봇 말풍선: 연한 배경에 진한 글자 */
    .bot-bubble { 
        background: #F1F7FF; 
        color: #333333; /* 여기를 진한 회색으로 변경 */
        align-self: flex-start; 
        border-bottom-left-radius: 4px; 
    }
    
    /* 사용자 말풍선: 파란 배경에 흰 글자 */
    .user-bubble { 
        background: #397BE8; 
        color: #fff; /* 여기는 흰색 유지 */
        align-self: flex-end; 
        border-bottom-right-radius: 4px; 
    }
    
    /* 하단 입력창 */
    .moyo-chat-input-box { border-top: 1px solid var(--moyo-line); padding: 20px; display: flex; gap: 10px; }
    .moyo-chat-input { flex: 1; padding: 14px; border-radius: 14px; border: 1px solid var(--moyo-line); }
</style>
</head>
<body>
<div class="moyo-chat-page">
    <div class="moyo-chat-header">
        <h1>무엇을 도와드릴까요?</h1>
        <p>MOYO 고객센터입니다. 궁금하신 점을 말씀해 주세요.</p>
    </div>

    <div class="moyo-chat-container" id="main-chat-container">
        <div id="chat-messages" style="padding: 20px; display: flex; flex-direction: column; overflow-y: auto; flex: 1;">
            </div>
       
        <div class="moyo-chat-input-box">
            <input type="text" class="moyo-chat-input" placeholder="메시지를 입력하세요...">
            <button class="moyo-home-btn primary">전송</button>
        </div>
    </div>
</div>

<script>
// 1. 페이지 로딩 시 실행
document.addEventListener("DOMContentLoaded", function() {
    loadChatMessages();
});

// 2. 메시지 로드 함수
async function loadChatMessages() {
    try {
        const response = await fetch('/common/inquiry/messages?userId=202');
        const messages = await response.json(); 

        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = ""; 

        messages.forEach(msg => {
            const bubble = document.createElement('div');
            const className = (msg.senderId == 202) ? 'user-bubble' : 'bot-bubble';
            bubble.classList.add('chat-bubble', className);
            bubble.textContent = msg.content; 
            chatMessages.appendChild(bubble);
        });
        
        const chatContainer = document.querySelector('.moyo-chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (e) {
        console.error("대화 내역 로드 실패:", e);
    }
}

// 3. 전송 버튼 이벤트
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('.primary').addEventListener('click', async function() {
        const input = document.querySelector('.moyo-chat-input');
        const content = input.value.trim();
        
        if (content === "") return;

        try {
            const response = await fetch('/common/inquiry/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: content,
                    categoryId: 1, 
                    senderId: 202, 
                    title: "문의"
                })
            });

            if (response.ok) {
                const chatMessages = document.getElementById('chat-messages');
                const bubble = document.createElement('div');
                bubble.classList.add('chat-bubble', 'user-bubble');
                bubble.textContent = content; 
                chatMessages.appendChild(bubble);
                
                input.value = '';
                const chatContainer = document.querySelector('.moyo-chat-container');
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                alert("전송 실패.");
            }
        } catch (error) {
            console.error("통신 오류:", error);
        }
    }); // 클릭 이벤트 닫기
}); // DOMContentLoaded 닫기
</script>

</body>
</html>