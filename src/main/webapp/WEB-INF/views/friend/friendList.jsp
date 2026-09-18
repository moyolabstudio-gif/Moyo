<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MOYO - 친구</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=stage3-list-ui">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/friend.css?v=20260907cm1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=202608081545-unified-people-shell">
</head>
<body class="friend-page-body moyo-app-sidebar-enabled">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="friend-wrap">
    <section class="friend-hero">
        <div class="friend-hero-copy">
            <span class="friend-eyebrow">MOYO FRIEND</span>
            <div class="friend-title-row">
                <div>
                    <h1>친구</h1>
                    <p>친구를 찾고 요청과 개인 공유 대상을 관리합니다.</p>
                </div>
                <div class="friend-hero-actions">
                    <button type="button" class="friend-primary-action" id="openFriendAddModalButton">
                        <span aria-hidden="true">＋</span> 친구 찾기
                    </button>
                </div>
            </div>
        </div>
    </section>

    <section class="friend-dashboard">
        <div class="friend-main-column">
            <article class="friend-card friend-list-card">
                <div class="friend-card-head friend-card-head-inline">
                    <div>
                        <span class="friend-card-label">내 관계</span>
                        <div class="friend-section-title-row">
                            <h2>친구 목록</h2>
                            <span class="friend-section-count" aria-label="친구 수"><strong id="friendTotalCount">0</strong></span>
                        </div>
                        <p>노트, 사진, 일정의 개인 공유 대상입니다.</p>
                    </div>
                    <button type="button" class="friend-refresh-btn" data-friend-refresh aria-label="친구 목록 새로고침">새로고침</button>
                </div>
                <div id="friendList" class="friend-list friend-primary-list"></div>
            </article>

            <article class="friend-card friend-recommend-card">
                <div class="friend-card-head friend-card-head-inline">
                    <div>
                        <span class="friend-card-label">공통 친구 추천</span>
                        <h2>알 수도 있는 사람</h2>
                        <p>공통 친구를 기준으로 추천합니다.</p>
                    </div>
                </div>
                <div id="friendRecommendationList" class="friend-recommend-grid"></div>
            </article>
        </div>

        <aside class="friend-side-column">
            <article class="friend-card friend-request-card">
                <div class="friend-card-head">
                    <div>
                        <span class="friend-card-label">요청 관리</span>
                        <h2>친구 요청</h2>
                        <p>받은 요청과 보낸 요청을 한 곳에서 확인합니다.</p>
                    </div>
                </div>

                <div class="friend-request-tabs" role="tablist" aria-label="친구 요청 탭">
                    <button type="button" class="active" data-friend-request-tab="received" role="tab" aria-selected="true">
                        받은 요청 <span id="friendPendingBadge" class="friend-count-badge"><c:out value="${pendingFriendCount}" default="0" /></span>
                    </button>
                    <button type="button" data-friend-request-tab="sent" role="tab" aria-selected="false">
                        보낸 요청 <span id="friendSentBadge" class="friend-count-badge">0</span>
                    </button>
                </div>

                <div class="friend-request-panel active" data-friend-request-panel="received" role="tabpanel">
                    <div id="friendReceivedList" class="friend-list friend-request-list"></div>
                </div>
                <div class="friend-request-panel" data-friend-request-panel="sent" role="tabpanel">
                    <div id="friendSentList" class="friend-list friend-request-list"></div>
                </div>
            </article>
        </aside>
    </section>
</main>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<%@ include file="../common/commonPeopleModal.jspf" %>

<script src="${pageContext.request.contextPath}/js/commonProfileUtils.js?v=friend-dashboard-v2"></script>
<script src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=202608081545-unified-people-shell"></script>
<script>window.MOYO_CONTEXT_PATH = '${pageContext.request.contextPath}';</script>
<script src="${pageContext.request.contextPath}/js/friendPeopleAdapter.js?v=friend-common-add-modal-v2"></script>
<script src="${pageContext.request.contextPath}/js/friend.js?v=friend-dashboard-v2"></script>
</body>
</html>
