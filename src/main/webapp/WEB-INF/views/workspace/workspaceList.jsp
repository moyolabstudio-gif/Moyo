<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>그룹 - MOYO</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceList.css">
</head>
<body class="moyo-app-sidebar-enabled workspace-list-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="workspace-list-page">
        <section class="workspace-list-hero" aria-labelledby="workspaceListTitle">
            <div class="workspace-list-hero-copy">
                <h1 id="workspaceListTitle">그룹</h1>
                <p>함께하는 그룹과 프로젝트를 한곳에서 확인하고 이동해요.</p>
            </div>
            <a href="${pageContext.request.contextPath}/workspace/create"
               class="workspace-create-btn">
                <span aria-hidden="true">＋</span>
                새 그룹 만들기
            </a>
        </section>

        <section class="workspace-list-section" aria-labelledby="myWorkspaceTitle">
            <div class="workspace-list-section-head">
                <div>
                    <div class="workspace-list-section-title-row">
                        <h2 id="myWorkspaceTitle">내 그룹</h2>
                        <span class="workspace-list-count"><c:out value="${empty wsList ? 0 : wsList.size()}" /></span>
                    </div>
                    <p>현재 참여하고 있는 그룹입니다.</p>
                </div>
            </div>

            <c:choose>
                <c:when test="${not empty wsList}">
                    <div class="workspace-card-grid">
                        <c:forEach var="ws" items="${wsList}">
                            <article class="workspace-card">
                                <a href="${pageContext.request.contextPath}/workspace/main?wsId=${ws.wsId}"
                                   class="workspace-card-main"
                                   aria-label="<c:out value='${ws.wsName}'/> 그룹 홈으로 이동">
                                    <span class="workspace-card-image">
                                        <c:choose>
                                            <c:when test="${not empty ws.wsImagePath}">
                                                <img src="${pageContext.request.contextPath}${ws.wsImagePath}"
                                                     alt=""
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                <span class="workspace-card-fallback"><c:choose><c:when test="${not empty ws.wsName}"><c:out value="${fn:toUpperCase(fn:substring(fn:trim(ws.wsName), 0, 1))}" /></c:when><c:otherwise>G</c:otherwise></c:choose></span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="workspace-card-fallback show"><c:choose><c:when test="${not empty ws.wsName}"><c:out value="${fn:toUpperCase(fn:substring(fn:trim(ws.wsName), 0, 1))}" /></c:when><c:otherwise>G</c:otherwise></c:choose></span>
                                            </c:otherwise>
                                        </c:choose>
                                    </span>

                                    <span class="workspace-card-content">
                                        <span class="workspace-card-type">
                                            <c:choose>
                                                <c:when test="${ws.wsType eq 'ORGANIZATION'}">회사 · 조직</c:when>
                                                <c:when test="${ws.wsType eq 'TEAM'}">팀 · 협업</c:when>
                                                <c:when test="${ws.wsType eq 'STUDY'}">스터디 · 연구</c:when>
                                                <c:when test="${ws.wsType eq 'CLUB'}">동아리 · 취미</c:when>
                                                <c:when test="${ws.wsType eq 'LIFE'}">가족 · 생활</c:when>
                                                <c:when test="${ws.wsType eq 'ETC'}">기타</c:when>
                                                <c:otherwise>모임 · 커뮤니티</c:otherwise>
                                            </c:choose>
                                        </span>
                                        <strong class="workspace-card-name"><c:out value="${ws.wsName}" /></strong>
                                        <span class="workspace-card-description">
                                            <c:choose>
                                                <c:when test="${not empty ws.wsDescription}"><c:out value="${ws.wsDescription}" /></c:when>
                                                <c:otherwise>그룹 소개가 아직 등록되지 않았습니다.</c:otherwise>
                                            </c:choose>
                                        </span>
                                    </span>
                                </a>

                                <div class="workspace-card-footer">
                                    <a href="${pageContext.request.contextPath}/workspace/main?wsId=${ws.wsId}"
                                       class="workspace-enter-btn">입장</a>
                                </div>
                            </article>
                        </c:forEach>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="workspace-list-empty">
                        <div class="workspace-list-empty-mark" aria-hidden="true">👥</div>
                        <strong>아직 참여 중인 그룹이 없습니다.</strong>
                        <p>새 그룹을 만들면 멤버와 프로젝트를 함께 관리할 수 있어요.</p>
                        <a href="${pageContext.request.contextPath}/workspace/create">새 그룹 만들기</a>
                    </div>
                </c:otherwise>
            </c:choose>
        </section>


    </main>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
