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
				<span>
					<strong>${sessionScope.user.userName}</strong>님 환영합니다!
					<span> (플랜 : 이후 구독 정보 추가)</span>
				</span>
				<a href="/calendar" >내 캘린더</a>
				<a href="/users/logout">로그아웃 </a>
			</c:when>
			<c:otherwise>
				<a href="/users/loginForm">로그인 </a>
				<a href="/users/joinForm">회원가입 </a>
			</c:otherwise>	
		</c:choose>
	</nav>
</header>
</body>
</html>