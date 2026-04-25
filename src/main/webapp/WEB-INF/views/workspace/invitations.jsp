<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <title>초대함 - MOYO</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        .container { max-width: 800px; margin: 50px auto; padding: 20px; }
        .invite-card { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 20px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .invite-info h3 { margin: 0 0 5px 0; color: #333; }
        .invite-info p { margin: 0; color: #666; font-size: 14px; }
        .btn-group { display: flex; gap: 10px; }
        .btn { padding: 8px 16px; border-radius: 4px; cursor: pointer; border: none; font-weight: bold; }
        .btn-accept { background: #4A90E2; color: white; }
        .btn-reject { background: #eee; color: #666; }
        .empty-msg { text-align: center; color: #999; margin-top: 50px; }
    </style>
</head>
<body>
    <jsp:include page="../common/header.jsp" />

    <div class="container">
        <h2>📩 나에게 온 초대</h2>
        <hr>
        
        <c:if test="${empty inviteList}">
            <p class="empty-msg">새로운 초대가 없습니다.</p>
        </c:if>

        <c:forEach var="invite" items="${inviteList}">
            <div class="invite-card" id="invite-${invite.INVITE_ID}">
                <div class="invite-info">
                    <h3>${invite.WS_NAME}</h3>
                    <p><strong>${invite.INVITER_NAME}</strong>님이 당신을 팀원으로 초대했습니다.</p>
                    <small style="color: #ccc;">${invite.SENT_AT}</small>
                </div>
                <div class="btn-group">
                    <button class="btn btn-accept" onclick="respondInvite(${invite.INVITE_ID}, 'ACCEPTED')">수락</button>
                    <button class="btn btn-reject" onclick="respondInvite(${invite.INVITE_ID}, 'REJECTED')">거절</button>
                </div>
            </div>
        </c:forEach>
    </div>

    <script>
		function respondInvite(inviteId, status) {
		    if(!confirm(status === 'ACCEPTED' ? "초대를 수락하시겠습니까?" : "초대를 거절하시겠습니까?")) return;

		    $.ajax({
		        url: '/workspace/api/invitation/process',
		        type: 'POST',
		        contentType: 'application/json',
		        data: JSON.stringify({
		            inviteId: inviteId,
		            status: status
		        }),
		        success: function(res) {
		            // 서버 응답값이 true 또는 "true"인 경우 모두 체크
		            if(res.success === true || res.success === "true") {
		                alert(status === 'ACCEPTED' ? "워크스페이스에 합류했습니다!" : "초대를 거절했습니다.");
		                
		                // [수정] ID 선택자를 더 확실하게 지정
		                // inviteId가 숫자인 경우 문자열로 인식되도록 처리
		                var targetCard = $('#invite-' + inviteId);
		                
		                if (targetCard.length > 0) {
		                    targetCard.fadeOut(400, function() {
		                        $(this).remove();
		                        
		                        // 남은 카드가 없는지 다시 확인
		                        if($('.invite-card').length === 0) {
		                            $('.container').append('<p class="empty-msg">새로운 초대가 없습니다.</p>');
		                        }
		                    });
		                } else {
		                    // 카드를 못 찾을 경우 강제 새로고침 (안전장치)
		                    location.reload();
		                }

		                // 헤더 배지 업데이트
		                if(typeof updateInviteBadge === 'function') {
		                    updateInviteBadge();
		                }
		            } else {
		                alert("처리 중 오류가 발생했습니다.");
		            }
		        },
		        error: function(err) {
		            console.error("에러 발생:", err);
		            alert("서버 통신 중 오류가 발생했습니다.");
		        }
		    });
		}
    </script>
</body>
</html>