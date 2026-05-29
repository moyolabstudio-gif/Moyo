<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>내 그룹 목록 - MOYO</title>
    <style>
        .container { width: 90%; max-width: 1100px; margin: 40px auto; }
        .header-area { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .btn-create { background: #4A90E2; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; }
        
        .ws-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
        .ws-card { border: 1px solid #edf0f2; border-radius: 24px; padding: 30px; background: #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; text-align: center; }
        
        /* 핵심: 원형 이미지 스타일 */
        .ws-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 20px; background-color: #eee; border: 1px solid #ddd; }
        
        .ws-name { font-size: 1.25em; font-weight: 700; margin-bottom: 8px; }
        .ws-desc { font-size: 0.9em; color: #888; margin-bottom: 25px; height: 3.6em; overflow: hidden; }
        .btn-enter { width: 100%; background: #f0f7ff; color: #4A90E2; padding: 14px; border-radius: 14px; text-decoration: none; font-weight: 700; }
    </style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <div class="container">
        <div class="header-area">
            <h2>나의 워크스페이스</h2>
            <a href="/workspace/create" class="btn-create">+ 새 팀 만들기</a>
        </div>
        <div class="ws-grid">
            <c:forEach var="ws" items="${wsList}">
                <div class="ws-card">
                    <img src="${ws.wsImagePath}" 
                         onerror="this.onerror=null; this.src='/images/default-ws.png';" 
                         class="ws-img">
                    <div class="ws-name">${ws.wsName}</div>
                    <div class="ws-desc">${ws.wsDescription}</div>
                    <a href="/workspace/main?wsId=${ws.wsId}" class="btn-enter">입장하기</a>
                </div>
            </c:forEach>
        </div>
    </div>
</body>
</html>