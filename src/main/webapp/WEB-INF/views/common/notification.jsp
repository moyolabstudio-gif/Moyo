<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <title>알림함</title>
</head>
<body>
    <h1>내 알림 목록</h1>
    <table border="1">
        <tr>
            <th>번호</th>
            <th>공지 제목</th>
            <th>읽음 여부</th>
            <th>받은 날짜</th>
        </tr>
        <c:forEach var="n" items="${myNotices}">
            <tr>
                <td>${n.alarmId}</td>
                <td>${n.title}</td> <td>${n.isRead}</td>
                <td>${n.regDt}</td>
            </tr>
        </c:forEach>
    </table>
</body>
</html>