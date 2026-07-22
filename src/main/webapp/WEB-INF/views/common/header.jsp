<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>

<link rel="icon" type="image/png" href="${pageContext.request.contextPath}/brand/moyo_logo.png?v=moyo-logo-clear">

<link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoModal.css">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonJoinProfile.css?v=common-join-profile-v2">

<link rel="stylesheet" href="${pageContext.request.contextPath}/css/appSidebar.css?v=header-profile-safe-20260706">

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
    .moyo-header.moyo-header-guest {
        border-bottom:1px solid rgba(231,238,246,.92);
        box-shadow:0 8px 22px rgba(24,40,72,.035);
    }
    .moyo-header.moyo-header-guest .moyo-header-inner {
        width:min(1320px, calc(100% - 56px));
        margin:0 auto;
        padding:0;
    }
    .moyo-header.moyo-header-guest .moyo-logo-img {
        height:46px;
        max-width:126px;
    }
    .moyo-header.moyo-header-guest .guest-menu {
        gap:12px;
    }
    .moyo-header.moyo-header-guest .guest-menu a {
        min-height:40px;
        padding:0 17px;
        border-radius:13px;
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
    .moyo-main-nav { display:flex; align-items:center; gap:18px; min-width:0; }
    .nav-menu { display:flex; align-items:center; gap:6px; }
    .moyo-nav-link {
        position:relative; display:inline-flex; align-items:center; justify-content:center; gap:7px;
        min-height:36px; padding:0 12px; border-radius:999px;
        color:#344054; text-decoration:none; font-size:13px; font-weight:850;
        border:1px solid transparent;
        white-space:nowrap;
        transition:background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease;
    }
    .moyo-nav-link:hover {
        background:#f7fbff;
        color:#2878d0;
        border-color:#e2eefc;
    }
    .moyo-nav-link.is-active {
        background:linear-gradient(180deg, #f7fbff 0%, #eef7ff 100%);
        color:#2563eb;
        border-color:#cfe3ff;
        box-shadow:0 2px 8px rgba(74, 144, 226, .08), inset 0 1px 0 rgba(255,255,255,.88);
        font-weight:900;
    }
    .moyo-nav-link.is-active:hover {
        background:linear-gradient(180deg, #f4faff 0%, #eaf4ff 100%);
        color:#1d4ed8;
        border-color:#bfdbfe;
    }
    .moyo-nav-link.is-active .moyo-nav-icon {
        transform:none;
        filter:saturate(1.08);
    }
    .moyo-nav-icon { font-size:15px; line-height:1; transition:transform .18s ease, filter .18s ease; }
    .user-status {
        display:flex; align-items:center; gap:14px; padding-left:18px; border-left:1px solid #e7ecf2;
    }
    .user-link {
        display:flex; align-items:center; gap:9px; min-width:0;
        min-height:38px; padding:0 8px 0 4px; border-radius:999px;
        color:#243041; text-decoration:none; transition:background .18s ease, color .18s ease;
    }
    .user-link:hover { background:#f4f8ff; color:#2878d0; }
    .moyo-header .user-avatar {
        width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        overflow:hidden;
        background:linear-gradient(135deg, #397BE8 0%, #4A90E2 45%, #39CDB5 100%) !important;
        background-color:transparent !important;
        color:#fff; font-size:14px; font-weight:900; flex-shrink:0;
        box-shadow:0 4px 12px rgba(57,145,216,.24);
    }
    .moyo-header .user-avatar img,
    .moyo-header .user-avatar .user-avatar-image {
        display:block !important;
        width:100% !important;
        height:100% !important;
        min-width:100% !important;
        min-height:100% !important;
        max-width:none !important;
        max-height:none !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
        border-radius:50% !important;
        background:transparent !important;
        box-shadow:none !important;
        object-fit:cover !important;
        object-position:center !important;
        transform:none !important;
        filter:none !important;
    }
    .moyo-header .user-avatar .user-avatar-fallback {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:100%;
        height:100%;
    }
    /* 업로드 프로필은 투명 PNG 자체를 표시하고, 기본 아바타 배경은 사용하지 않는다. */
    .moyo-header .user-avatar.has-profile:not(.no-image) {
        background:none !important;
        background-color:transparent !important;
        box-shadow:none;
    }
    .moyo-header .user-avatar.has-profile.no-image {
        background:linear-gradient(135deg, #397BE8 0%, #4A90E2 45%, #39CDB5 100%) !important;
        box-shadow:0 4px 12px rgba(57,145,216,.24);
    }

    /* 페이지별 CSS가 헤더 프로필 크기/여백/배경을 덮어쓰지 못하도록 공통 규칙을 고정한다. */
    .moyo-header .user-status .user-link .user-avatar {
        width:32px !important;
        height:32px !important;
        min-width:32px !important;
        min-height:32px !important;
        max-width:32px !important;
        max-height:32px !important;
        margin:0 !important;
        padding:0 !important;
        border-radius:50% !important;
        overflow:hidden !important;
        flex:0 0 32px !important;
        box-sizing:border-box !important;
    }
    .moyo-header .user-status .user-link .user-avatar.is-uploaded-profile:not(.no-image) {
        background:transparent !important;
        box-shadow:none !important;
    }
    .moyo-header .user-status .user-link .user-avatar.is-default-profile,
    .moyo-header .user-status .user-link .user-avatar.no-image {
        background:linear-gradient(135deg, #397BE8 0%, #4A90E2 45%, #39CDB5 100%) !important;
        box-shadow:0 4px 12px rgba(57,145,216,.24) !important;
    }

    .moyo-header .user-avatar.has-profile .user-avatar-fallback { display:none; }
    .moyo-header .user-avatar.has-profile.no-image .user-avatar-fallback { display:inline-flex; }
    .user-name { max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:900; }
    .logout-link {
        display:inline-flex; align-items:center; justify-content:center;
        min-height:34px; padding:0 4px; color:#9aa4b2; font-size:12px; font-weight:800; text-decoration:none; white-space:nowrap;
    }
    .logout-link:hover { color:#e5484d; }
    .guest-menu { display:flex; align-items:center; gap:10px; }
    .guest-menu a {
        display:inline-flex; align-items:center; justify-content:center;
        min-height:40px; padding:0 16px; border-radius:12px;
        color:#344054; text-decoration:none; font-weight:800;
        transition:all .18s ease;
    }
    .guest-menu a:hover { background:#f5f9ff; color:#2878d0; }
    .guest-menu .join-link {
        border:0;
        color:#fff;
        background:linear-gradient(135deg,#24c0c8,#4b67e4);
        box-shadow:0 10px 20px rgba(67,104,222,.22);
    }
    .guest-menu .join-link:hover {
        color:#fff;
        background:linear-gradient(135deg,#24c0c8,#4b67e4);
        transform:translateY(-1px);
        box-shadow:0 12px 24px rgba(67,104,222,.26);
    }
    #alarmBadge {
        display:none; position:absolute; top:5px; right:3px; min-width:14px; height:14px;
        padding:0 4px; border-radius:999px; background:#FF4D4F; color:#fff;
        font-size:9px; font-weight:900; line-height:14px; text-align:center;
        box-shadow:0 0 0 2px #fff; transform:translate(50%, -30%);
        pointer-events:none;
    }
    #alarmDropdown.moyo-alarm-dropdown {
        display:none;
        position:absolute;
        top:42px;
        right:2px;
        width:332px;
        padding:0;
        overflow:hidden;
        border:1px solid #e7edf6;
        border-radius:14px;
        background:#fff;
        box-shadow:0 18px 42px rgba(15,23,42,.15);
        z-index:2200;
        color:#273142;
        cursor:default;
    }
    #alarmDropdown.moyo-alarm-dropdown::before {
        content:"";
        position:absolute;
        top:-7px;
        right:16px;
        width:14px;
        height:14px;
        background:#fff;
        border-left:1px solid #e7edf6;
        border-top:1px solid #e7edf6;
        transform:rotate(45deg);
    }
    .moyo-alarm-head {
        position:relative;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:13px 15px 11px;
        border-bottom:1px solid #eef3f8;
    }
    .moyo-alarm-title {
        font-size:13px;
        font-weight:900;
        color:#172033;
    }
    .moyo-alarm-title-icon { display:none; }
    .moyo-alarm-summary {
        color:#6f7d91;
        font-size:11px;
        font-weight:800;
        white-space:nowrap;
    }
    .moyo-alarm-list {
        list-style:none;
        padding:6px 7px;
        margin:0;
        max-height:340px;
        overflow-y:auto;
    }
    .moyo-alarm-list::-webkit-scrollbar { width:8px; }
    .moyo-alarm-list::-webkit-scrollbar-thumb { background:#dbe5f1; border-radius:999px; }
    .moyo-alarm-empty {
        padding:26px 12px;
        text-align:center;
        color:#8b96a6;
        font-size:13px;
        font-weight:800;
    }
    .moyo-alarm-section-label {
        padding:8px 8px 5px;
        color:#8a96a8;
        font-size:10px;
        font-weight:900;
    }
    .moyo-alarm-request-card {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:9px 9px;
        border:1px solid #e7eef7;
        border-radius:12px;
        background:#fff;
    }
    .moyo-alarm-request-card + .moyo-alarm-request-card { margin-top:6px; }
    .moyo-alarm-request-main { min-width:0; flex:1; }
    .moyo-alarm-request-title {
        display:flex;
        align-items:center;
        gap:6px;
        min-width:0;
        margin-bottom:3px;
        color:#263247;
        font-size:12px;
        font-weight:800;
    }
    .moyo-alarm-request-type {
        flex:0 0 auto;
        display:inline-flex;
        align-items:center;
        height:19px;
        padding:0 6px;
        border-radius:999px;
        background:#f1f6ff;
        color:#4a7fea;
        font-size:10px;
        font-weight:800;
    }
    .moyo-alarm-request-name {
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        font-weight:800;
    }
    .moyo-alarm-request-desc {
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        color:#8a96a8;
        font-size:11px;
        font-weight:600;
    }
    .moyo-alarm-actions {
        display:flex;
        align-items:center;
        gap:5px;
        flex:0 0 auto;
    }
    .moyo-alarm-action-btn {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        height:28px;
        padding:0 10px;
        border-radius:999px;
        border:1px solid #e0e8f2;
        background:#fff;
        color:#66748a;
        font-size:11px;
        font-weight:800;
        cursor:pointer;
    }
    .moyo-alarm-action-btn:hover { background:#f7faff; }
    .moyo-alarm-action-btn.is-primary {
        min-width:52px;
        border-color:transparent;
        background:linear-gradient(135deg,#57d5df 0%,#5b7cff 60%,#8b6cff 100%);
        color:#fff;
        box-shadow:0 6px 14px rgba(77,124,255,.22);
    }
    .moyo-alarm-action-btn.is-primary:hover {
        filter:brightness(.98);
        box-shadow:0 7px 16px rgba(77,124,255,.26);
    }
    .moyo-alarm-action-btn:disabled { opacity:.55; cursor:default; box-shadow:none; }
    .moyo-alarm-more {
        margin:6px 0 2px;
        padding:0 7px;
    }
    .moyo-alarm-more a {
        display:flex;
        align-items:center;
        justify-content:center;
        height:34px;
        border-radius:10px;
        background:#f7faff;
        color:#397be8;
        text-decoration:none;
        font-size:12px;
        font-weight:900;
    }
    .moyo-alarm-item {
        display:flex;
        align-items:center;
        gap:8px;
        min-height:42px;
        padding:8px 9px;
        border-radius:11px;
        color:#334155;
        cursor:pointer;
    }
    .moyo-alarm-item:hover { background:#f7fbff; }
    .moyo-alarm-item + .moyo-alarm-item { margin-top:3px; }
    .moyo-alarm-item-icon {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        flex:0 0 27px;
        width:27px;
        height:27px;
        border-radius:10px;
        background:#eef5ff;
        color:#397be8;
        font-size:13px;
    }
    .moyo-alarm-item-main {
        min-width:0;
        flex:1;
        display:flex;
        flex-direction:column;
        gap:2px;
    }
    .moyo-alarm-item-title {
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        color:#233044;
        font-size:12px;
        font-weight:900;
        line-height:1.25;
    }
    .moyo-alarm-item-desc {
        color:#6f7d91;
        font-size:11px;
        font-weight:800;
        line-height:1.2;
    }
    .moyo-alarm-foot {
        display:flex;
        align-items:center;
        justify-content:center;
        padding:7px;
        border-top:1px solid #eef3f8;
        background:#fff;
    }
    .moyo-alarm-foot-link {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:100%;
        height:34px;
        border-radius:10px;
        color:#397be8;
        text-decoration:none;
        font-size:12px;
        font-weight:900;
    }
    .moyo-alarm-foot-link:hover { background:#eef6ff; color:#286bcb; }
    @media(max-width:1180px) {
        .nav-menu { gap:4px; }
        .moyo-main-nav { gap:12px; }
        .moyo-nav-link { padding:0 9px; }
        .user-status { gap:10px; padding-left:14px; }
    }
    @media(max-width:980px) {
        .moyo-header-location { display:none; }
        .moyo-header-inner { padding-right:12px; }
        .moyo-header.moyo-header-guest .moyo-header-inner {
            width:calc(100% - 40px);
            padding:0;
        }
    }
    @media(max-width:720px) {
        .moyo-logo-img { height:40px; max-width:98px; }
        .moyo-nav-link .moyo-nav-label { display:none; }
        .user-name, .logout-link { display:none; }
        .user-status { padding-left:12px; gap:10px; }
        .moyo-header.moyo-header-guest .moyo-header-inner { width:calc(100% - 28px); }
        .moyo-header.moyo-header-guest .guest-menu { gap:6px; }
        .moyo-header.moyo-header-guest .guest-menu a {
            min-height:36px;
            padding:0 11px;
            border-radius:11px;
            font-size:13px;
        }
        .moyo-header.moyo-header-guest .moyo-logo-img { height:41px; max-width:106px; }
    }

.moyo-alarm-approved-action{
    display:inline-flex;
    align-items:center;
    margin-top:6px;
    color:#2f72e8;
    font-size:12px;
    font-weight:800;
    line-height:1.25;
}
.moyo-alarm-approved-action::after{
    content:' →';
    margin-left:2px;
}
.moyo-alarm-item:hover .moyo-alarm-approved-action{
    text-decoration:underline;
}
/* 승인 알림 문구가 길어도 알림 모달 가로 스크롤이 생기지 않도록 정리 */
#alarmDropdown.moyo-alarm-dropdown{
    width:360px;
    max-width:calc(100vw - 24px);
}
#alarmDropdown .moyo-alarm-list{
    overflow-x:hidden;
}
#alarmDropdown .moyo-alarm-item{
    align-items:flex-start;
}
#alarmDropdown .moyo-alarm-item-main{
    width:0;
    max-width:100%;
    overflow:hidden;
}
#alarmDropdown .moyo-alarm-item-title,
#alarmDropdown .moyo-alarm-item-desc{
    overflow:visible;
    text-overflow:clip;
    white-space:normal;
    overflow-wrap:anywhere;
    word-break:keep-all;
}
#alarmDropdown .moyo-alarm-approved-action{
    max-width:100%;
    white-space:normal;
    overflow-wrap:anywhere;
}


.moyo-alarm-approved-actions{
    display:flex;
    align-items:center;
    gap:12px;
    margin-top:7px;
    flex-wrap:wrap;
}
.moyo-alarm-abandon-action{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:24px;
    padding:0 9px;
    border:1px solid #dbe4ef;
    border-radius:8px;
    background:#fff;
    color:#74839a;
    font:inherit;
    font-size:11px;
    font-weight:800;
    line-height:1;
    cursor:pointer;
    appearance:none;
    -webkit-appearance:none;
    box-sizing:border-box;
    transition:border-color .16s ease, background-color .16s ease, color .16s ease;
}
.moyo-alarm-abandon-action:hover{
    border-color:#efb8bf;
    background:#fff7f8;
    color:#dc5360;
    text-decoration:none;
}
.moyo-alarm-abandon-action:focus-visible{
    outline:none;
    border-color:#e99ca6;
    box-shadow:0 0 0 3px rgba(220,83,96,.12);
}
.moyo-alarm-abandon-action:disabled{
    opacity:.55;
    cursor:default;
}

</style>

<header class="moyo-header ${empty sessionScope.user ? 'moyo-header-guest' : 'moyo-header-app'}">
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
                    <img src="${pageContext.request.contextPath}/brand/moyo_logo.png?v=moyo-logo-clear" alt="MOYO" class="moyo-logo-img"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                    <span class="moyo-logo-text-fallback">MOYO</span>
                </a>
            </div>

            <c:if test="${not empty sessionScope.user}">
                <div class="moyo-header-location">모이면 더 쉬워지는 일정과 기록</div>
            </c:if>
        </div>

        <nav class="moyo-main-nav">
            <c:choose>
                <c:when test="${not empty sessionScope.user}">
                    <div class="nav-menu">
                        <a href="/calendar" class="moyo-nav-link" data-nav-key="calendar">
                            <span class="moyo-nav-icon">📅</span>
                            <span class="moyo-nav-label">캘린더</span>
                        </a>
                        <a href="${pageContext.request.contextPath}/note/list?scope=PRIVATE" class="moyo-nav-link" data-nav-key="note">
                            <span class="moyo-nav-icon">📝</span>
                            <span class="moyo-nav-label">노트</span>
                        </a>
                        <a href="${pageContext.request.contextPath}/photo-album?scopeType=PERSONAL&amp;scopeId=${sessionScope.user.userId}" class="moyo-nav-link" data-nav-key="photo">
                            <span class="moyo-nav-icon">📷</span>
                            <span class="moyo-nav-label">사진</span>
                        </a>
                        <div class="moyo-nav-link" id="alarmContainer" data-nav-key="alarm" style="cursor:pointer;"
                             data-account-name="<c:out value='${sessionScope.user.userName}'/>"
                             data-account-email="<c:out value='${sessionScope.user.EMAIL}'/>">
                            <span class="moyo-nav-icon">🔔</span>
                            <span class="moyo-nav-label">알림</span>
                            <span id="alarmBadge">0</span>

                            <div id="alarmDropdown" class="moyo-alarm-dropdown">
                                <div class="moyo-alarm-head">
                                    <div class="moyo-alarm-title">
                                        <span class="moyo-alarm-title-icon">🔔</span>
                                        <span>알림</span>
                                    </div>
                                    <span id="alarmSummary" class="moyo-alarm-summary">새로운 소식 없음</span>
                                </div>
                                <ul id="alarmList" class="moyo-alarm-list"></ul>
                                <div class="moyo-alarm-foot">
                                    <a href="${pageContext.request.contextPath}/requests" class="moyo-alarm-foot-link">요청함으로 이동</a>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div class="user-status">
                        <c:set var="headerProfileImage" value="${sessionScope.user.profileImagePath}" />
                        <c:if test="${empty headerProfileImage}"><c:set var="headerProfileImage" value="${sessionScope.user.PROFILE_IMAGE_PATH}" /></c:if>
                        <c:set var="headerUserName" value="${empty sessionScope.user.userName ? '사용자' : sessionScope.user.userName}" />
                        <c:set var="headerProfileInitial" value="${fn:substring(headerUserName,0,1)}" />
                        <c:if test="${not empty headerProfileImage and not fn:startsWith(headerProfileImage, 'http') and not fn:startsWith(headerProfileImage, '/')}">
                            <c:set var="headerProfileImage" value="/${headerProfileImage}" />
                        </c:if>
                        <a href="/users/mypage" class="user-link" aria-label="내 정보로 이동">
                            <span class="user-avatar ${not empty headerProfileImage ? 'has-profile is-uploaded-profile' : 'is-default-profile'}">
                                <c:if test="${not empty headerProfileImage}">
                                    <c:choose>
                                        <c:when test="${fn:startsWith(headerProfileImage, 'http')}">
                                            <img class="user-avatar-image" src="${headerProfileImage}" alt="${headerUserName}" onerror="this.parentElement.classList.add('no-image'); this.parentElement.classList.remove('is-uploaded-profile'); this.parentElement.classList.add('is-default-profile'); this.remove();">
                                        </c:when>
                                        <c:otherwise>
                                            <img class="user-avatar-image" src="${pageContext.request.contextPath}${headerProfileImage}" alt="${headerUserName}" onerror="this.parentElement.classList.add('no-image'); this.parentElement.classList.remove('is-uploaded-profile'); this.parentElement.classList.add('is-default-profile'); this.remove();">
                                        </c:otherwise>
                                    </c:choose>
                                </c:if>
                                <span class="user-avatar-fallback"><c:out value="${headerProfileInitial}" /></span>
                            </span>
                            <span class="user-name"><c:out value="${headerUserName}" /></span>
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
<jsp:include page="/WEB-INF/views/common/commonJoinProfile.jsp" />

<jsp:include page="/WEB-INF/views/common/appSidebar.jsp" />

<c:if test="${not empty sessionScope.user}">
    <script src="${pageContext.request.contextPath}/js/appSidebar.js?v=header-profile-safe-20260706"></script>
</c:if>

<script>
(function() {
    const isLogin = '${not empty sessionScope.user}' === 'true';
    if (!isLogin) return;

    const path = window.location.pathname || '';
    let activeKey = '';

    if (path === '/calendar' || path.indexOf('/calendar') === 0) {
        activeKey = 'calendar';
    } else if (path.indexOf('/note') === 0) {
        activeKey = 'note';
    } else if (path.indexOf('/photo') === 0 || path.indexOf('/photo-album') === 0) {
        activeKey = 'photo';
    } else if (path.indexOf('/requests') === 0 || path.indexOf('/alarms') === 0) {
        activeKey = 'alarm';
    }

    if (activeKey) {
        const activeNav = document.querySelector('.moyo-nav-link[data-nav-key="' + activeKey + '"]');
        if (activeNav) activeNav.classList.add('is-active');
    }
})();
</script>
<script>
(function() {
    const isLogin = '${not empty sessionScope.user}' === 'true';
    if (!isLogin) return;

    const contextPath = '${pageContext.request.contextPath}';
    const requestPageUrl = contextPath + '/requests';
    const alarmListUrl = contextPath + '/api/alarm/list';
    const alarmReadUrl = contextPath + '/api/alarm/read';
    const requestCountUrl = contextPath + '/requests/api/count';
    const requestPendingUrl = contextPath + '/requests/api/pending';
    const shareRespondBaseUrl = contextPath + '/share/api/requests/';
    const inviteProcessUrl = contextPath + '/workspace/api/invitation/process';

    function qs(selector) {
        return document.querySelector(selector);
    }

    function normalizeAlarmList(res) {
        return Array.isArray(res) ? res : [];
    }

    function normalizePendingList(res) {
        return res && Array.isArray(res.items) ? res.items : [];
    }

    function getUnreadCount(alarms) {
        return normalizeAlarmList(alarms).filter(function(item) {
            return item && (item.isRead === 'N' || item.IS_READ === 'N');
        }).length;
    }

    function getRequestCount(res) {
        const count = res && res.count != null ? Number(res.count) : 0;
        return Number.isFinite(count) ? count : 0;
    }

    function setAlarmBadge(count) {
        const badge = qs('#alarmBadge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    function setAlarmSummary(alarmCount, requestCount) {
        const summary = qs('#alarmSummary');
        if (!summary) return;

        const totalCount = alarmCount + requestCount;
        let text = '새로운 소식 없음';
        if (totalCount > 0) {
            const parts = [];
            if (requestCount > 0) parts.push('요청 ' + requestCount + '건');
            if (alarmCount > 0) parts.push('읽지 않은 알림 ' + alarmCount + '건');
            text = parts.join(' · ');
        }
        summary.textContent = text;
    }

    function fetchJson(url, options) {
        return fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}))
            .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            });
    }

    function postForm(url, data) {
        const body = data instanceof FormData ? data : new URLSearchParams(data || {});
        return fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: body
        }).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const contentType = res.headers.get('content-type') || '';
            return contentType.indexOf('application/json') >= 0 ? res.json() : res.text();
        });
    }

    function updateAlarmCount() {
        Promise.allSettled([
            fetchJson(alarmListUrl),
            fetchJson(requestCountUrl)
        ]).then(function(results) {
            const alarms = results[0].status === 'fulfilled' ? normalizeAlarmList(results[0].value) : [];
            const requestInfo = results[1].status === 'fulfilled' ? results[1].value : { count: 0 };
            const unreadCount = getUnreadCount(alarms);
            const requestCount = getRequestCount(requestInfo);
            setAlarmBadge(unreadCount + requestCount);
        });
    }

    function clickAlarm(alarmId, targetUrl) {
        if (!alarmId) {
            if (targetUrl) window.location.href = targetUrl;
            return;
        }

        postForm(alarmReadUrl, { alarmId: alarmId })
            .then(function() {
                if (targetUrl) window.location.href = targetUrl;
                else loadAlarmDropdown(true);
            })
            .catch(function() {
                alert('알림을 여는 중 문제가 발생했습니다.');
            });
    }

    function getShareTypeName(contentType, item) {
        if (contentType === 'PHOTO') return '사진 공유';
        if (contentType === 'NOTE') return '노트 공유';
        if (contentType === 'CALENDAR') {
            return item && item.calendarAttendeeYn === 'Y' ? '일정 참석 · 공유' : '일정 공유';
        }
        if (contentType === 'BOARD') return '게시글 공유';
        return '공유 요청';
    }

    function getPendingTitle(item) {
        if (!item) return '새 요청';
        return item.title || item.contentTitle || item.wsName || item.targetName || '새 요청';
    }

    function getPendingDescription(item) {
        if (!item) return '';
        if (item.requestType === 'GROUP_INVITE') {
            return (item.requesterName || '누군가') + '님이 초대했습니다.';
        }
        if (item.requestType === 'GROUP_JOIN_REQUEST') {
            return (item.requesterName || '누군가') + '님이 그룹 참여를 요청했습니다.';
        }
        const requester = item.requesterName || '누군가';
        if (item.contentType === 'CALENDAR') {
            if (item.calendarAttendeeYn === 'Y' && item.permissionType === 'EDIT') {
                return requester + '님이 참석자로 추가하고 편집 권한 공유 요청을 보냈습니다.';
            }
            if (item.calendarAttendeeYn === 'Y') {
                return requester + '님이 참석자로 추가하고 공유 요청을 보냈습니다.';
            }
            if (item.permissionType === 'EDIT') {
                return requester + '님이 편집 권한이 포함된 공유 요청을 보냈습니다.';
            }
        }
        return requester + '님이 공유 요청을 보냈습니다.';
    }

    function disableCardButtons(card, disabled) {
        card.querySelectorAll('button').forEach(function(btn) {
            btn.disabled = disabled;
        });
    }

    function removeCardAndRefresh(card) {
        card.style.transition = 'opacity .16s ease, transform .16s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-4px)';
        setTimeout(function() {
            card.remove();
            loadAlarmDropdown(true);
            updateAlarmCount();
        }, 170);
    }

    function isSuccessResponse(res) {
        return res === 'success' || res === true || (res && (res.success === true || res.success === 'true'));
    }

    function processShareAction(card, shareId, status) {
        disableCardButtons(card, true);
        postForm(shareRespondBaseUrl + encodeURIComponent(shareId) + '/respond', { status: status })
            .then(function(res) {
                if (!isSuccessResponse(res)) {
                    alert(res && res.message ? res.message : '요청 처리 중 오류가 발생했습니다.');
                    disableCardButtons(card, false);
                    return;
                }
                removeCardAndRefresh(card);
            })
            .catch(function() {
                alert('서버 통신 중 오류가 발생했습니다.');
                disableCardButtons(card, false);
            });
    }

    function processInviteAction(card, inviteId, status, wsName, wsId) {
        // 그룹 초대 수락은 그룹에서 사용할 프로필을 먼저 설정해야 한다.
        // 헤더 알림에서 바로 계정 프로필로 가입시키지 않고 요청함의 프로필 설정 모달로 이동한다.
        if (status === 'ACCEPTED') {
            window.openGroupInviteProfileModal(inviteId, wsName || '그룹', wsId, function() {
                removeCardAndRefresh(card);
            });
            return;
        }

        const formData = new FormData();
        formData.append('inviteId', inviteId);
        formData.append('status', status);

        disableCardButtons(card, true);
        postForm(inviteProcessUrl, formData)
            .then(function(res) {
                if (!isSuccessResponse(res)) {
                    alert(res && res.message ? res.message : '요청 처리 중 오류가 발생했습니다.');
                    disableCardButtons(card, false);
                    return;
                }
                removeCardAndRefresh(card);
            })
            .catch(function() {
                alert('서버 통신 중 오류가 발생했습니다.');
                disableCardButtons(card, false);
            });
    }

    function processGroupJoinRequestAction(card, requestId, status) {
        let rejectionReason = '';
        if (status === 'REJECTED') {
            const entered = window.prompt(
                '거절 사유를 입력할 수 있습니다. (선택)\n입력하지 않고 확인하면 기본 안내만 전달됩니다.',
                ''
            );
            if (entered === null) return;
            rejectionReason = entered.trim();
            if (rejectionReason.length > 300) {
                alert('거절 사유는 300자까지 입력할 수 있습니다.');
                return;
            }
        }

        disableCardButtons(card, true);
        postForm(contextPath + '/workspace/api/join-request/respond', {
            requestId: requestId,
            status: status,
            rejectionReason: rejectionReason
        }).then(function(res) {
            if (!isSuccessResponse(res)) {
                alert(res && res.message ? res.message : '참여 요청 처리 중 오류가 발생했습니다.');
                disableCardButtons(card, false);
                return;
            }
            removeCardAndRefresh(card);
        }).catch(function() {
            alert('서버 통신 중 오류가 발생했습니다.');
            disableCardButtons(card, false);
        });
    }

    function makePendingRequestItem(item) {
        const isInvite = item.requestType === 'GROUP_INVITE';
        const isJoinRequest = item.requestType === 'GROUP_JOIN_REQUEST';
        const typeLabel = isInvite ? '그룹 초대'
                : (isJoinRequest ? '그룹 참여 요청' : getShareTypeName(item.contentType, item));
        const id = item.id || item.shareId || item.inviteId || item.requestId;
        const li = document.createElement('li');
        li.className = 'moyo-alarm-request-card';

        const main = document.createElement('div');
        main.className = 'moyo-alarm-request-main';
        const title = document.createElement('div');
        title.className = 'moyo-alarm-request-title';
        const type = document.createElement('span');
        type.className = 'moyo-alarm-request-type';
        type.textContent = typeLabel;
        const name = document.createElement('span');
        name.className = 'moyo-alarm-request-name';
        name.textContent = getPendingTitle(item);
        const desc = document.createElement('div');
        desc.className = 'moyo-alarm-request-desc';
        desc.textContent = getPendingDescription(item);
        title.append(type, name);
        main.append(title, desc);

        const actions = document.createElement('div');
        actions.className = 'moyo-alarm-actions';
        const accept = document.createElement('button');
        accept.type = 'button';
        accept.className = 'moyo-alarm-action-btn is-primary';
        accept.textContent = isJoinRequest ? '승인' : '수락';
        const reject = document.createElement('button');
        reject.type = 'button';
        reject.className = 'moyo-alarm-action-btn';
        reject.textContent = '거절';

        accept.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (isInvite) processInviteAction(li, id, 'ACCEPTED', getPendingTitle(item), item.wsId || item.ws_id || item.workspaceId || item.workspace_id || item.targetId || item.target_id);
            else if (isJoinRequest) processGroupJoinRequestAction(li, id, 'APPROVED');
            else processShareAction(li, id, 'ACCEPTED');
        });
        reject.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (isInvite) processInviteAction(li, id, 'REJECTED', getPendingTitle(item), item.wsId || item.ws_id || item.workspaceId || item.workspace_id || item.targetId || item.target_id);
            else if (isJoinRequest) processGroupJoinRequestAction(li, id, 'REJECTED');
            else processShareAction(li, id, 'REJECTED');
        });

        actions.append(accept, reject);
        li.append(main, actions);
        return li;
    }

    function getAlarmMeta(item) {
        const alertType = String(item.alertType || item.alert_type || 'NOTICE').toUpperCase();
        const targetType = String(item.targetType || item.target_type || '').toUpperCase();
        if (alertType === 'CALENDAR_REMINDER') return { icon: '📅', label: '일정 알림' };
        if (alertType === 'CALENDAR_ATTENDEE' || targetType === 'CALENDAR') return { icon: '📅', label: '일정 알림' };
        if (alertType === 'COMMENT') return { icon: '💬', label: '댓글 알림' };
        if (alertType === 'LIKE') return { icon: '♥', label: '좋아요 알림' };
        if (alertType === 'SHARE') return { icon: '🔗', label: '공유 알림' };
        return { icon: '📣', label: '공지 알림' };
    }

    function getAlarmTargetUrl(item) {
        const directUrl = item.linkUrl || item.link_url;
        if (directUrl) return directUrl;
        const alertType = String(item.alertType || item.alert_type || 'NOTICE').toUpperCase();
        const targetType = String(item.targetType || item.target_type || '').toUpperCase();
        const targetId = item.targetId || item.target_id;
        const noticeId = item.noticeId || item.notice_id;
        if ((alertType === 'CALENDAR_REMINDER' || alertType === 'CALENDAR_ATTENDEE' || targetType === 'CALENDAR') && targetId) {
            return contextPath + '/calendar/event/detail?eventId=' + encodeURIComponent(targetId);
        }
        if (noticeId) return contextPath + '/common/noticeList?openId=' + encodeURIComponent(noticeId);
        return '';
    }

    function makeAlarmItem(item) {
        const alarmId = item.alarmId || item.alarm_id;
        const title = item.title || '새 알림';
        const content = item.content || item.CONTENT || '';
        const meta = getAlarmMeta(item);
        const targetUrl = getAlarmTargetUrl(item);
        const li = document.createElement('li');
        li.className = 'moyo-alarm-item';
        li.title = meta.label;

        const icon = document.createElement('span');
        icon.className = 'moyo-alarm-item-icon';
        icon.textContent = meta.icon;

        const main = document.createElement('span');
        main.className = 'moyo-alarm-item-main';
        const titleEl = document.createElement('span');
        titleEl.className = 'moyo-alarm-item-title';
        titleEl.textContent = title;
        const desc = document.createElement('span');
        desc.className = 'moyo-alarm-item-desc';
        desc.textContent = content || meta.label;
        main.append(titleEl, desc);

        const alertTypeUpper = String(item.alertType || item.alert_type || '').toUpperCase();
        if (alertTypeUpper === 'GROUP_JOIN_APPROVED') {
            const actions = document.createElement('span');
            actions.className = 'moyo-alarm-approved-actions';

            const action = document.createElement('span');
            action.className = 'moyo-alarm-approved-action';
            action.textContent = '프로필 설정하고 참여';

            const abandon = document.createElement('button');
            abandon.type = 'button';
            abandon.className = 'moyo-alarm-abandon-action';
            abandon.textContent = '참여 포기';
            abandon.addEventListener('click', async function(e) {
                e.stopPropagation();

                const match = String(targetUrl || '').match(/[?&]approvedJoinRequestId=(\d+)/);
                const requestId = match ? match[1] : null;
                if (!requestId) {
                    alert('승인된 참여 요청 정보를 확인할 수 없습니다.');
                    return;
                }

                if (!confirm('그룹 참여를 포기할까요?\n승인된 참여 요청이 취소되며, 다시 참여하려면 새로 요청해야 합니다.')) {
                    return;
                }

                abandon.disabled = true;
                try {
                    const response = await postForm(
                        contextPath + '/workspace/api/join-request/abandon',
                        { requestId: requestId }
                    );
                    if (!response || !(response.success === true || response.success === 'true')) {
                        throw new Error(response && response.status ? response.status : 'FAILED');
                    }

                    if (typeof window.refreshHeaderNotifications === 'function') {
                        await window.refreshHeaderNotifications();
                    } else {
                        loadAlarmDropdown();
                    }
                } catch (error) {
                    alert('참여 포기 처리 중 오류가 발생했습니다.');
                    abandon.disabled = false;
                }
            });

            actions.append(action, abandon);
            main.appendChild(actions);
        }

        li.append(icon, main);

        li.addEventListener('click', function(e) {
            e.stopPropagation();
            const alertType = String(item.alertType || item.alert_type || '').toUpperCase();
            if (alertType === 'GROUP_JOIN_APPROVED') {
                const match = String(targetUrl || '').match(/[?&]approvedJoinRequestId=(\d+)/);
                const requestId = match ? match[1] : null;
                const wsId = item.targetId || item.target_id || null;
                if (requestId && typeof window.openApprovedJoinProfileModal === 'function') {
                    if (alarmId) {
                        postForm(alarmReadUrl, { alarmId: alarmId }).catch(function(){});
                    }
                    hideDropdown();
                    window.openApprovedJoinProfileModal(requestId, title.replace(/\s*참여 요청 승인\s*$/, ''), wsId);
                    return;
                }
            }
            clickAlarm(alarmId, targetUrl);
        });
        return li;
    }

    function renderAlarmDropdown(alarms, pendingRequests) {
        alarms = normalizeAlarmList(alarms);
        pendingRequests = normalizePendingList({ items: pendingRequests });

        const unreadCount = getUnreadCount(alarms);
        const requestCount = pendingRequests.length;
        const list = qs('#alarmList');
        if (!list) return;
        list.innerHTML = '';
        setAlarmSummary(unreadCount, requestCount);
        setAlarmBadge(unreadCount + requestCount);

        if (requestCount > 0) {
            const section = document.createElement('li');
            section.className = 'moyo-alarm-section-label';
            section.textContent = '요청';
            list.appendChild(section);
            pendingRequests.slice(0, 4).forEach(function(item) {
                list.appendChild(makePendingRequestItem(item));
            });
            if (requestCount > 4) {
                const more = document.createElement('li');
                more.className = 'moyo-alarm-more';
                const link = document.createElement('a');
                link.href = requestPageUrl;
                link.textContent = '남은 요청 ' + (requestCount - 4) + '건 보기';
                more.appendChild(link);
                list.appendChild(more);
            }
        }

        if (alarms.length > 0) {
            alarms.forEach(function(item) {
                list.appendChild(makeAlarmItem(item));
            });
        }

        if (requestCount === 0 && alarms.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'moyo-alarm-empty';
            empty.textContent = '새로운 알림이 없습니다.';
            list.appendChild(empty);
        }
    }

    function showDropdown() {
        const dropdown = qs('#alarmDropdown');
        if (dropdown) dropdown.style.display = 'block';
    }

    function hideDropdown() {
        const dropdown = qs('#alarmDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }

    function isDropdownVisible() {
        const dropdown = qs('#alarmDropdown');
        return dropdown && dropdown.style.display !== 'none' && window.getComputedStyle(dropdown).display !== 'none';
    }

    function loadAlarmDropdown() {
        Promise.allSettled([
            fetchJson(alarmListUrl),
            fetchJson(requestPendingUrl)
        ]).then(function(results) {
            const alarms = results[0].status === 'fulfilled' ? normalizeAlarmList(results[0].value) : [];
            const pendingRequests = results[1].status === 'fulfilled' ? normalizePendingList(results[1].value) : [];
            renderAlarmDropdown(alarms, pendingRequests);
            showDropdown();
        });
    }

    window.refreshHeaderNotifications = function() {
        return Promise.allSettled([
            fetchJson(alarmListUrl),
            fetchJson(requestPendingUrl)
        ]).then(function(results) {
            const alarms = results[0].status === 'fulfilled'
                ? normalizeAlarmList(results[0].value)
                : [];
            const pendingRequests = results[1].status === 'fulfilled'
                ? normalizePendingList(results[1].value)
                : [];

            renderAlarmDropdown(alarms, pendingRequests);
            showDropdown();
        });
    };

    function initAlarm() {
        const container = qs('#alarmContainer');
        const dropdown = qs('#alarmDropdown');
        if (!container || !dropdown) return;

        updateAlarmCount();
        setInterval(updateAlarmCount, 30000);

        container.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isDropdownVisible()) {
                hideDropdown();
            } else {
                loadAlarmDropdown();
            }
        });

        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('#alarmContainer')) hideDropdown();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAlarm);
    } else {
        initAlarm();
    }
})();
</script>
<c:if test="${not empty sessionScope.user}">
    <script src="${pageContext.request.contextPath}/js/commonProfileUtils.js?v=profile-utils-v1"></script>
    <script src="${pageContext.request.contextPath}/js/commonJoinProfile.js?v=common-join-profile-refactor-v1"></script>
</c:if>
