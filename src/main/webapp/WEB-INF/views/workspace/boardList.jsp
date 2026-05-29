<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>📋 게시판 목록</title>
    <style>
        .list-container { max-width: 900px; margin: 40px auto; padding: 0 20px; font-family: sans-serif; }
        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .list-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .list-table th, .list-table td { border-bottom: 1px solid #eef0f2; padding: 14px; text-align: left; font-size: 14px; }
        .list-table th { background-color: #f8f9fa; color: #555; font-weight: 600; }
        .back-btn { text-decoration: none; color: #666; font-size: 14px; }
        .write-btn { padding: 10px 18px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; }
    </style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <div class="list-container">
        <a href="/workspace/main?wsId=${wsId}" class="back-btn">⬅️ 대시보드로 돌아가기</a>
        
		<div class="list-header">
		    <h2>
		        <c:choose>
		            <c:when test="${boardType eq 'NOTICE'}">📋 그룹 공지사항</c:when>
		            <c:when test="${boardType eq 'FILE'}">📁 자료실</c:when>
		            <c:otherwise>💬 자유 토크 피드</c:otherwise>
		        </c:choose>
		    </h2>
		    <a href="/group/board/write?wsId=${wsId}&type=${boardType}" class="write-btn">✏️ 글쓰기</a>
		</div>
        
		<table class="list-table">
		    <thead>
		        <tr>
		            <th style="width: 80px;">번호</th>
		            <th>제목</th>
		            <th style="width: 120px;">작성자</th>
		            <th style="width: 120px;">등록일</th>
		            <%-- 자료실일 때만 컬럼 하나 추가 --%>
		            <c:if test="${boardType eq 'FILE'}">
		                <th style="width: 100px;">파일</th>
		            </c:if>
		        </tr>
		    </thead>
		    <tbody>
		        <c:choose>
		            <c:when test="${not empty boardList}">
		                <c:forEach var="post" items="${boardList}">
		                    <tr>
		                        <td>${post.postId}</td>
		                        <td><a href="/group/board/detail?postId=${post.postId}&wsId=${wsId}" style="text-decoration:none; color:#333; font-weight: 500;">${post.title}</a></td>
		                        <td>${post.writerName}</td>
		                        <td>${post.regDt}</td>
		                        <%-- 자료실일 때만 파일 데이터 셀 추가 --%>
								<c:if test="${boardType eq 'FILE'}">
								    <td>
										<c:if test="${post.hasFile}">
										    <a href="/download?path=${post.filePath}">📎 ${post.fileName}</a>
										</c:if>
										<c:if test="${not post.hasFile}">-</c:if>
								</c:if>
		                    </tr>
		                </c:forEach>
		            </c:when>
		            <c:otherwise>
		                <%-- 자료실일 경우 colspan을 5로 늘려줘야 깨지지 않습니다 --%>
		                <tr>
		                    <td colspan="${boardType eq 'FILE' ? 5 : 4}" style="text-align:center; color:#999; padding:40px 0;">
		                        등록된 게시글이 없습니다.
		                    </td>
		                </tr>
		            </c:otherwise>
		        </c:choose>
		    </tbody>
		</table>
    </div>
</body>
</html>