<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoModal.css">

<link rel="stylesheet" href="${pageContext.request.contextPath}/css/appSidebar.css">

<style>
    .moyo-header {
        width:100%; height:70px; background:rgba(255,255,255,.96); border-bottom:1px solid #e9eef4;
        display:flex; align-items:center; box-sizing:border-box;
        position:fixed; top:0; left:0; right:0; z-index:1200;
        backdrop-filter:blur(14px);
    }
    .moyo-header-inner {
        width:100%; padding:0 18px 0 12px; margin:0;
        display:flex; align-items:center; justify-content:space-between; gap:22px; box-sizing:border-box;
    }
    .moyo-header-left { display:flex; align-items:center; gap:13px; min-width:0; height:100%; }
    .moyo-logo { display:flex; align-items:center; justify-content:center; flex-shrink:0; height:100%; }
    .moyo-logo a { display:inline-flex; align-items:center; justify-content:center; height:100%; text-decoration:none; line-height:1; }
    .moyo-logo-img { display:block; height:42px; width:auto; max-width:116px; object-fit:contain; transform:translateY(1px); }
    .moyo-logo-text-fallback { display:none; color:#4A90E2; font-size:26px; font-weight:900; }
    .moyo-header-location {
        display:flex; align-items:center; min-width:0; min-height:28px;
        padding-left:14px; border-left:1px solid #e7ecf2;
        color:#536174; font-size:12px; font-weight:800; line-height:1;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        transform:translateY(1px);
    }
    .moyo-main-nav { display:flex; align-items:center; gap:24px; min-width:0; }
    .nav-menu { display:flex; align-items:center; gap:30px; }
    .moyo-nav-link {
        position:relative; display:inline-flex; align-items:center; gap:7px;
        color:#344054; text-decoration:none; font-size:13px; font-weight:800;
        white-space:nowrap; transition:color .18s ease;
    }
    .moyo-nav-link:hover { color:#2878d0; }
    .moyo-nav-icon { font-size:15px; line-height:1; }
    .user-status {
        display:flex; align-items:center; gap:24px; padding-left:24px; border-left:1px solid #e7ecf2;
    }
    .user-link {
        display:flex; align-items:center; gap:9px; min-width:0;
        color:#243041; text-decoration:none; transition:color .18s ease;
    }
    .user-link:hover { color:#2878d0; }
    .moyo-header .user-avatar {
        width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background:linear-gradient(135deg, #397BE8 0%, #4A90E2 45%, #39CDB5 100%) !important;
        background-color:transparent !important;
        color:#fff; font-size:14px; font-weight:900; flex-shrink:0;
        box-shadow:0 4px 12px rgba(57,145,216,.24);
    }
    .user-name { max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:900; }
    .logout-link {
        display:inline-flex; align-items:center; justify-content:center;
        margin-left:4px; color:#8a94a3; font-size:12px; font-weight:800; text-decoration:none; white-space:nowrap;
    }
    .logout-link:hover { color:#e5484d; }
    .guest-menu { display:flex; align-items:center; gap:8px; }
    .guest-menu a { display:inline-flex; align-items:center; min-height:38px; padding:0 14px; border-radius:10px; color:#344054; text-decoration:none; font-weight:800; }
    .guest-menu a:hover { background:#f5f9ff; color:#2878d0; }
    .guest-menu .join-link { background:#4A90E2; color:#fff; }
    .guest-menu .join-link:hover { background:#357dcc; color:#fff; }
    #inviteCountBadge {
        display:none; position:absolute; top:-10px; right:-13px; min-width:16px; height:16px;
        padding:0 4px; border-radius:999px; background:#FF4D4F; color:#fff;
        font-size:10px; font-weight:900; line-height:16px; text-align:center;
        box-shadow:0 0 0 2px #fff;
    }
    @media(max-width:980px) {
        .moyo-header-location { display:none; }
        .moyo-header-inner { padding-right:12px; }
    }
    @media(max-width:720px) {
        .moyo-logo-img { height:40px; max-width:98px; }
        .moyo-nav-link .moyo-nav-label { display:none; }
        .user-name, .logout-link { display:none; }
        .user-status { padding-left:12px; gap:10px; }
    }
</style>

<header class="moyo-header">
    <div class="moyo-header-inner">
        <div class="moyo-header-left">
            <c:if test="${not empty sessionScope.user}">
                <button type="button"
                        id="moyoAppSidebarToggle"
                        class="moyo-app-sidebar-toggle-btn"
                        aria-label="공간 메뉴 접기"
                        aria-expanded="true">
                    <span class="moyo-app-sidebar-toggle-icon">☰</span>
                </button>
            </c:if>

            <div class="moyo-logo">
                <a href="/">
                    <img src="/brand/moyo_logo.png" alt="MOYO" class="moyo-logo-img"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                    <span class="moyo-logo-text-fallback">MOYO</span>
                </a>
            </div>

            <c:if test="${not empty sessionScope.user}">
                <div class="moyo-header-location">일정부터 협업까지, 우리 모두의 공간을 한곳에</div>
            </c:if>
        </div>

        <nav class="moyo-main-nav">
            <c:choose>
                <c:when test="${not empty sessionScope.user}">
                    <div class="nav-menu">
                        <a href="/calendar" class="moyo-nav-link">
                            <span class="moyo-nav-icon">📅</span>
                            <span class="moyo-nav-label">내 캘린더</span>
                        </a>
                        <a href="/workspace/invitations" class="moyo-nav-link">
                            <span class="moyo-nav-icon">🔔</span>
                            <span class="moyo-nav-label">알림</span>
                            <span id="inviteCountBadge">0</span>
                        </a>
                    </div>
                    <div class="user-status">
                        <a href="/users/mypage" class="user-link" aria-label="내 정보로 이동">
                            <span class="user-avatar">${sessionScope.user.userName.substring(0,1)}</span>
                            <span class="user-name">${sessionScope.user.userName}</span>
                        </a>
                        <a href="/users/logout" class="logout-link">로그아웃</a>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="guest-menu">
                        <a href="/users/loginForm">로그인</a>
                        <a href="/users/joinForm" class="join-link">회원가입</a>
                    </div>
                </c:otherwise>
            </c:choose>
        </nav>
    </div>
</header>

<jsp:include page="/WEB-INF/views/common/appSidebar.jsp" />

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="${pageContext.request.contextPath}/js/appSidebar.js"></script>
<script>
    function updateInviteBadge() {
        $.get('/workspace/api/invitations', function(data) {
            const badge = $('#inviteCountBadge');
            if (data && data.length > 0) {
                badge.text(data.length).show();
            } else {
                badge.hide();
            }
        });
    }

    $(document).ready(function() {
        if ('${not empty sessionScope.user}' === 'true') {
            updateInviteBadge();
            setInterval(updateInviteBadge, 30000);
        }
    });
</script>
