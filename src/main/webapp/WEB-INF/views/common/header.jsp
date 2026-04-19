<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MOYO</title>
</head>
<body>
<header>
	<div>
		<a href="/">MOYO</a>
	</div>
	
	<nav>
	    <c:choose>
	        <c:when test="${not empty sessionScope.user}">
	            <div class="nav-item-group">
	                <strong>워크스페이스</strong>
	                <a href="/workspace/list">팀 목록</a>
	                <a href="/workspace/create" style="color: blue;">[+] 새 팀 만들기</a>
	            </div>
	            
	            <a href="/calendar">내 캘린더</a>
	            <a href="/users/logout">로그아웃</a>
	        </c:when>
			<c:otherwise>
			    <a href="/users/loginForm">로그인</a>
			    <a href="/users/joinForm">회원가입</a>
			</c:otherwise>   
	    </c:choose>
	</nav>
</header>
</body>
</html>