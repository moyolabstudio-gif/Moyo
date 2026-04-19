<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>워크스페이스</title>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
	<div class="container">
	    <h2>🚀 ${workspace.wsName} 작업 공간</h2>
	    <hr>
	    
	    <div class="header-area">
	        <h3>프로젝트 목록</h3>
	        <a href="/project/create?wsId=${workspace.wsId}" class="btn-create">[+] 새 프로젝트 추가</a>
	    </div>

	    <div class="project-grid">
	        <c:choose>
	            <c:when test="${not empty projectList}">
	                <c:forEach var="project" items="${projectList}">
	                    <div class="project-card">
	                        <h4>${project.projName}</h4>
	                        <p>ID: ${project.projId}</p>
	                        <a href="/project/main?projId=${project.projId}" class="btn-enter">작업실 입장</a>
	                    </div>
	                </c:forEach>
	            </c:when>
	            <c:otherwise>
	                <p>아직 등록된 프로젝트가 없습니다. 첫 프로젝트를 시작해 보세요!</p>
	            </c:otherwise>
	        </c:choose>
	    </div>
	</div>
</body>
</html>