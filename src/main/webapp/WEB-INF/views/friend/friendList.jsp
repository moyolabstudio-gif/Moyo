<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MOYO - 친구</title>
    <link rel="stylesheet" href="/css/friend.css?v=friend-footer-bottom-v1">
</head>
<body class="friend-page-body moyo-app-sidebar-enabled">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="friend-wrap">
    <section class="friend-hero">
        <div class="friend-hero-copy">
            <span class="friend-eyebrow">MOYO FRIEND</span>
            <div class="friend-title-row">
                <h1>친구</h1>
                <div class="friend-hero-stats" aria-label="친구 현황">
                    <span class="friend-mini-stat">친구 <strong id="friendTotalCount">0</strong></span>
                    <span class="friend-mini-stat">대기 요청 <strong id="friendHeroPendingCount"><c:out value="${pendingFriendCount}" default="0" /></strong></span>
                </div>
            </div>
            <p>공유할 친구를 추가하고 요청을 관리합니다.</p>
        </div>
    </section>

    <section class="friend-stack">
        <article class="friend-card friend-search-card">
            <div class="friend-card-head">
                <div>
                    <span class="friend-card-label">친구 추가</span>
                    <h2>친구 찾기</h2>
                    <p>이름 또는 이메일로 검색해 친구 요청을 보냅니다.</p>
                </div>
            </div>
            <div class="friend-search-row">
                <input type="text" id="friendSearchInput" placeholder="이름 또는 이메일 검색">
                <button type="button" id="friendSearchButton">검색</button>
            </div>
            <div id="friendSearchResult" class="friend-list friend-result-list"></div>
        </article>

        <article class="friend-card friend-list-card">
            <div class="friend-card-head">
                <div>
                    <span class="friend-card-label">공유 대상</span>
                    <h2>친구 목록</h2>
                    <p>노트, 사진, 일정 공유 대상에 표시되는 사용자입니다.</p>
                </div>
                <button type="button" class="friend-refresh-btn" data-friend-refresh>새로고침</button>
            </div>
            <div id="friendList" class="friend-list friend-primary-list"></div>
        </article>

        <article class="friend-card friend-request-card">
            <div class="friend-card-head">
                <div>
                    <span class="friend-card-label">요청 관리</span>
                    <h2>친구 요청</h2>
                    <p>받은 요청과 보낸 요청을 확인합니다.</p>
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
                <div id="friendReceivedList" class="friend-list"></div>
            </div>
            <div class="friend-request-panel" data-friend-request-panel="sent" role="tabpanel">
                <div id="friendSentList" class="friend-list"></div>
            </div>
        </article>
    </section>
</main>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script src="/js/friend.js?v=friend-v7"></script>
</body>
</html>
