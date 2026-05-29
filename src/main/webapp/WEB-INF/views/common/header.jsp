<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<header style="width: 100%; background: #fff; border-bottom: 1px solid #eef0f2; height: 70px; display: flex; justify-content: center; align-items: center;">
    <div style="width: 100%; max-width: 1400px; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; margin: 0 auto;">
        
        <div class="logo">
            <a href="/" style="font-size: 26px; font-weight: 800; text-decoration: none; color: #4A90E2; letter-spacing: -1px;">MOYO</a>
        </div>
        
        <nav style="display: flex; align-items: center; gap: 40px;">
            <c:choose>
                <c:when test="${not empty sessionScope.user}">
                    
                    <div class="my-workspaces" style="display: flex; gap: 12px; border-right: 1px solid #eee; padding-right: 30px;">
                        <c:forEach var="ws" items="${userWorkspaces}">
                            <a href="/workspace/main?wsId=${ws.wsId}" style="text-decoration: none;" title="${ws.wsName}">
                                <img src="${not empty ws.wsImagePath ? ws.wsImagePath : '/images/default-ws.png'}" 
                                     onerror="this.onerror=null; this.src='/images/default-ws.png';"
                                     style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; display: block;">
                            </a>
                        </c:forEach>
                        <a href="/workspace/list" style="width: 35px; height: 35px; background: #f8f9fa; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; color: #999; border: 1px dashed #ddd;">+</a>
                    </div>

                    <div class="nav-menu" style="display: flex; gap: 25px; font-size: 14px; font-weight: 500;">
                        <a href="/calendar" style="text-decoration: none; color: #333;">내 캘린더</a>
                        <a href="/workspace/invitations" style="position: relative; text-decoration: none; color: #333;">
                            초대함
                            <span id="inviteCountBadge" style="display: none; position: absolute; top: -10px; right: -15px; background: #FF4D4F; color: white; font-size: 10px; padding: 1px 5px; border-radius: 10px; font-weight: bold;">0</span>
                        </a>
                    </div>

                    <div class="user-status" style="display: flex; align-items: center; gap: 15px; margin-left: 10px; padding-left: 25px; border-left: 1px solid #eee;">
                        <a href="/users/mypage" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #333;">
                            <span style="background: #4A90E2; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">
                                ${sessionScope.user.userName.substring(0,1)}
                            </span>
                            <span style="font-weight: 600;">${sessionScope.user.userName}</span>
                        </a>
                        <a href="/users/logout" style="font-size: 12px; color: #888; text-decoration: none; background: #f4f4f4; padding: 4px 12px; border-radius: 20px;">로그아웃</a>
                    </div>
                </c:when>
                
                <c:otherwise>
                    <div class="guest-menu" style="display: flex; gap: 25px; font-weight: 500;">
                        <a href="/users/loginForm" style="text-decoration: none; color: #333;">로그인</a>
                        <a href="/users/joinForm" style="text-decoration: none; color: #4A90E2; font-weight: bold;">회원가입</a>
                    </div>
                </c:otherwise>   
            </c:choose>
        </nav>
    </div>
</header>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script>
    function updateInviteBadge() {
        $.get("/workspace/api/invitations", function(data) {
            const badge = $("#inviteCountBadge");
            if (data && data.length > 0) {
                badge.text(data.length).show(); 
            } else {
                badge.hide(); 
            }
        });
    }

    $(document).ready(function() {
        if ("${not empty sessionScope.user}" === "true") {
            updateInviteBadge();
            setInterval(updateInviteBadge, 30000);
        }
    });
</script>