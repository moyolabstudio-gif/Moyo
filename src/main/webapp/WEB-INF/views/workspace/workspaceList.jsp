<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>내 워크스페이스 목록 - MOYO</title>
    <style>
        .container { width: 80%; margin: 50px auto; }
        .ws-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .ws-table th, .ws-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .ws-table th { background-color: #f4f4f4; }
        .btn-enter { background-color: #007bff; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; }
        .header-area { display: flex; justify-content: space-between; align-items: center; }
    </style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="container">
        <div class="header-area">
            <h2>내 워크스페이스 목록</h2>
            <a href="/workspace/create" style="text-decoration: none; font-weight: bold; color: blue;">[+] 새 팀 만들기</a>
        </div>

        <table class="ws-table">
            <thead>
                <tr>
                    <th>팀 ID</th>
                    <th>팀 이름</th>
                    <th>초대 코드</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                <c:choose>
                    <c:when test="${not empty wsList}">
                        <c:forEach var="ws" items="${wsList}">
                            <tr>
                                <td>${ws.wsId}</td>
                                <td>
                                    <strong>${ws.wsName}</strong>
                                </td>
                                <td><code>${ws.inviteCode}</code></td>
                                <td>
                                    <a href="/workspace/main?wsId=${ws.wsId}" class="btn-enter">입장하기</a>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 50px;">
                                참여 중인 워크스페이스가 없습니다. <br>
                                <a href="/workspace/create">첫 번째 팀을 만들어보세요!</a>
                            </td>
                        </tr>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>
</body>
</html>