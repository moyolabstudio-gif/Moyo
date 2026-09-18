<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>그룹 - MOYO</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=avatar-policy-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceList.css?v=dead-css-cleanup-v1-20260911">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonScopeList.css?v=css-structure-v1-20260910">
</head>
<body class="moyo-app-sidebar-enabled workspace-list-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="workspace-list-page moyo-scope-list moyo-scope-list--workspace">
        <section class="workspace-list-hero moyo-scope-list__hero" aria-labelledby="workspaceListTitle">
            <div class="workspace-list-hero-copy moyo-scope-list__hero-copy">
                <span class="workspace-list-eyebrow moyo-scope-list__eyebrow">MOYO GROUP</span>
                <h1 id="workspaceListTitle">그룹</h1>
                <p>함께하는 그룹과 프로젝트를 한곳에서 확인하고 이동해요.</p>
            </div>
            <a href="${pageContext.request.contextPath}/workspace/create"
               class="workspace-create-btn moyo-scope-list__primary-action">
                <span aria-hidden="true">＋</span>
                새 그룹 만들기
            </a>
        </section>

        <section class="workspace-list-section moyo-scope-list__section" aria-labelledby="myWorkspaceTitle">
            <div class="workspace-list-section-head moyo-scope-list__section-head">
                <div>
                    <span class="workspace-list-label">내 활동 공간</span>
                    <div class="workspace-list-section-title-row">
                        <h2 id="myWorkspaceTitle">내 그룹</h2>
                        <span class="workspace-list-count moyo-scope-list__count"><c:out value="${empty wsList ? 0 : wsList.size()}" /></span>
                    </div>
                    <p>현재 참여하고 있는 그룹입니다.</p>
                </div>
            </div>

            <c:choose>
                <c:when test="${not empty wsList}">
                    <div class="workspace-card-grid moyo-scope-list__grid">
                        <c:forEach var="ws" items="${wsList}">
                            <c:set var="cardName" value="${fn:trim(ws.wsName)}" />
                            <c:set var="cardDescription" value="${fn:trim(ws.wsDescription)}" />
                            <c:set var="cardType" value="${fn:toUpperCase(fn:trim(ws.wsType))}" />
                            <c:set var="cardImagePath" value="${fn:trim(ws.wsImagePath)}" />
                            <c:set var="cardDeadline" value="${fn:trim(ws.deleteDeadlineDate)}" />
                            <c:set var="cardRole" value="${fn:toUpperCase(fn:trim(ws.currentUserRole))}" />
                            <c:set var="cardMemberCount" value="${empty ws.memberCount ? 0 : ws.memberCount}" />
                            <c:set var="cardInitial" value="${empty cardName ? 'G' : fn:toUpperCase(fn:substring(cardName, 0, 1))}" />
                            <c:set var="cardDisplayName" value="${empty cardName ? '이름 없는 그룹' : cardName}" />
                            <c:url var="cardDetailUrl" value="/workspace/main">
                                <c:param name="wsId" value="${ws.wsId}" />
                            </c:url>
                            <article class="workspace-card moyo-scope-list-card">
                                <a href="${fn:escapeXml(cardDetailUrl)}"
                                   class="workspace-card-main"
                                   aria-label="<c:out value='${cardDisplayName}'/> 그룹 홈으로 이동">
                                    <span class="workspace-card-image" aria-hidden="true">
                                        <c:if test="${not empty cardImagePath}">
                                            <c:url var="cardImageUrl" value="${cardImagePath}" />
                                            <img src="${fn:escapeXml(cardImageUrl)}"
                                                 alt=""
                                                 decoding="async"
                                                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.classList.add('show');">
                                        </c:if>
                                        <span class="workspace-card-fallback${empty cardImagePath ? ' show' : ''}"><c:out value="${cardInitial}" /></span>
                                    </span>

                                    <span class="workspace-card-content">
                                        <span class="workspace-card-status-line moyo-scope-list-card__meta">
                                            <span class="workspace-card-type moyo-scope-list-card__badge">
                                                <c:choose>
                                                    <c:when test="${cardType eq 'ORGANIZATION'}">회사 · 조직</c:when>
                                                    <c:when test="${cardType eq 'TEAM'}">팀 · 협업</c:when>
                                                    <c:when test="${cardType eq 'STUDY'}">스터디 · 연구</c:when>
                                                    <c:when test="${cardType eq 'CLUB'}">동아리 · 취미</c:when>
                                                    <c:when test="${cardType eq 'LIFE'}">가족 · 생활</c:when>
                                                    <c:when test="${cardType eq 'ETC'}">기타</c:when>
                                                    <c:when test="${cardType eq 'COMMUNITY'}">모임 · 커뮤니티</c:when>
                                                    <c:otherwise>기타</c:otherwise>
                                                </c:choose>
                                            </span>
                                            <span class="workspace-card-user-meta">
                                                <span class="workspace-card-member-count">멤버 <c:out value="${cardMemberCount}" /></span>
                                                <c:if test="${cardRole eq 'OWNER' or cardRole eq 'ADMIN'}">
                                                    <span class="workspace-card-role workspace-card-role-${fn:toLowerCase(cardRole)}">
                                                        <c:choose>
                                                            <c:when test="${cardRole eq 'OWNER'}">그룹장</c:when>
                                                            <c:otherwise>관리자</c:otherwise>
                                                        </c:choose>
                                                    </span>
                                                </c:if>
                                            </span>
                                        </span>
                                        <strong class="workspace-card-name moyo-scope-list-card__title" title="${fn:escapeXml(cardDisplayName)}"><c:out value="${cardDisplayName}" /></strong>
                                        <span class="workspace-card-description moyo-scope-list-card__description">
                                            <c:choose>
                                                <c:when test="${not empty cardDescription}"><c:out value="${cardDescription}" /></c:when>
                                                <c:otherwise>그룹 소개가 아직 등록되지 않았습니다.</c:otherwise>
                                            </c:choose>
                                        </span>
                                    </span>
                                </a>

                                <div class="workspace-card-footer">
                                        <c:if test="${fn:toUpperCase(fn:trim(ws.status)) eq 'DELETE_PENDING'}">
                                            <span class="workspace-card-delete-pending">
                                                <span class="workspace-card-delete-badge">삭제 예정</span>
                                                <span class="workspace-card-delete-date">
                                                    <c:choose>
                                                        <c:when test="${not empty cardDeadline}">
                                                            예정일 <time datetime="${fn:escapeXml(cardDeadline)}"><c:out value="${cardDeadline}" /></time>
                                                        </c:when>
                                                        <c:otherwise>예정일 미정</c:otherwise>
                                                    </c:choose>
                                                </span>
                                            </span>
                                        </c:if>
                                    <a href="${fn:escapeXml(cardDetailUrl)}"
                                       class="workspace-enter-btn moyo-scope-list-card__action" aria-label="${fn:escapeXml(cardDisplayName)} 그룹 입장">입장</a>
                                </div>
                            </article>
                        </c:forEach>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="workspace-list-empty moyo-scope-list__empty">
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
