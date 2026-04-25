<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MOYO</title>
</head>
<body>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script>
	function updateInviteBadge() {
	    $.get("/workspace/api/invitations", function(data) {
	        const badge = $("#inviteCountBadge");
	        
	        // [수정] 강제 "1" 대신 실제 데이터 개수를 체크합니다.
	        if (data && data.length > 0) {
	            badge.text(data.length).show(); 
	        } else {
	            badge.hide(); // 데이터가 0개면 여기서 숨겨집니다.
	        }
	    });
	}
	$(document).ready(function() {
	    if ("${not empty sessionScope.user}" === "true") {
	        updateInviteBadge(); // 페이지 로드 시 즉시 실행
	        setInterval(updateInviteBadge, 30000); // 30초마다 갱신
	    }
	});
</script>

<header style="display: flex; justify-content: space-between; align-items: center; padding: 10px 50px; background: #fff; border-bottom: 1px solid #eee;">
    <div class="logo">
        <a href="/" style="font-size: 24px; font-weight: bold; text-decoration: none; color: #4A90E2;">MOYO</a>
    </div>
    
    <nav style="display: flex; align-items: center; gap: 20px;">
        <c:choose>
            <c:when test="${not empty sessionScope.user}">
                <div class="nav-item-group" style="display: flex; gap: 15px; border-right: 1px solid #ddd; padding-right: 20px;">
                    <a href="/workspace/list" style="text-decoration: none; color: #333;">워크스페이스</a>
                    <a href="/workspace/create" style="text-decoration: none; color: #4A90E2; font-weight: bold;">[+] 새 팀</a>
                </div>
                
				<a href="/calendar" style="text-decoration: none; color: #333;">내 캘린더</a>

				<div class="notification-area" style="position: relative; cursor: pointer;">
					<a href="/workspace/invitations" class="nav-link" style="position: relative; text-decoration: none; color: #333;">
					    초대함
					    <span id="inviteCountBadge" style="
					        display: none; 
					        position: absolute; 
					        top: -10px; 
					        right: -15px; 
					        background: #FF4D4F; 
					        color: white; 
					        font-size: 11px; 
					        padding: 2px 6px; 
					        border-radius: 10px; 
					        font-weight: bold;
					        line-height: 1;">0</span>
					</a>
				</div>

                <div class="user-status" style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
                    <span style="background: #4A90E2; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">
                        ${sessionScope.user.userName.substring(0,1)}
                    </span>
                    <a href="/users/mypage" style="font-weight: bold; color: #333; text-decoration: none; cursor: pointer;">
                         ${sessionScope.user.userName} 님
                    </a>
                    <a href="/users/logout" style="font-size: 12px; color: #999; text-decoration: none; border: 1px solid #ddd; padding: 2px 8px; border-radius: 4px;">로그아웃</a>
                </div>
            </c:when>
            <c:otherwise>
                <div class="guest-menu" style="display: flex; gap: 15px;">
                    <a href="/users/loginForm" style="text-decoration: none; color: #333;">로그인</a>
                    <a href="/users/joinForm" style="text-decoration: none; color: #4A90E2; font-weight: bold;">회원가입</a>
                </div>
            </c:otherwise>   
        </c:choose>
    </nav>
</header>
