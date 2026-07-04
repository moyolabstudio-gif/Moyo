<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<link rel="icon" type="image/png" href="${pageContext.request.contextPath}/brand/moyo_logo.png">

<link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoModal.css">

<link rel="stylesheet" href="${pageContext.request.contextPath}/css/appSidebar.css?v=poll-layout-shell-v3">

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
    .moyo-main-nav { display:flex; align-items:center; gap:20px; min-width:0; }
    .nav-menu { display:flex; align-items:center; gap:22px; }
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
        display:none; position:absolute; top:-10px; right:-13px; min-width:16px; height:16px;
        padding:0 4px; border-radius:999px; background:#FF4D4F; color:#fff;
        font-size:10px; font-weight:900; line-height:16px; text-align:center;
        box-shadow:0 0 0 2px #fff;
    }
    #alarmDropdown.moyo-alarm-dropdown {
        display:none;
        position:absolute;
        top:38px;
        right:-18px;
        width:360px;
        padding:0;
        overflow:hidden;
        border:1px solid #e7edf6;
        border-radius:14px;
        background:#fff;
        box-shadow:0 14px 34px rgba(15,23,42,.12);
        z-index:2200;
        color:#273142;
        cursor:default;
    }
    #alarmDropdown.moyo-alarm-dropdown::before {
        content:"";
        position:absolute;
        top:-7px;
        right:34px;
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
        padding:14px 16px 12px;
        border-bottom:1px solid #eef3f8;
    }
    .moyo-alarm-title {
        font-size:13px;
        font-weight:900;
        color:#172033;
    }
    .moyo-alarm-title-icon { display:none; }
    .moyo-alarm-summary {
        color:#8a96a8;
        font-size:11px;
        font-weight:800;
        white-space:nowrap;
    }
    .moyo-alarm-list {
        list-style:none;
        padding:8px;
        margin:0;
        max-height:390px;
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
        padding:8px 8px 6px;
        color:#8a96a8;
        font-size:11px;
        font-weight:900;
    }
    .moyo-alarm-request-card {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:10px 10px;
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
        margin:8px 0 2px;
        padding:0 8px;
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
        gap:9px;
        min-height:44px;
        padding:9px 10px;
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
        flex:0 0 28px;
        width:28px;
        height:28px;
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
        color:#8a96a8;
        font-size:11px;
        font-weight:800;
        line-height:1.2;
    }
    .moyo-alarm-foot {
        display:flex;
        align-items:center;
        justify-content:center;
        padding:8px;
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
        .nav-menu { gap:16px; }
        .moyo-main-nav { gap:14px; }
        .user-status { gap:14px; padding-left:16px; }
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
                        <a href="${pageContext.request.contextPath}/note/list?scope=PRIVATE" class="moyo-nav-link">
                            <span class="moyo-nav-icon">📝</span>
                            <span class="moyo-nav-label">노트</span>
                        </a>
                        <a href="${pageContext.request.contextPath}/photo-album?scopeType=PERSONAL&amp;scopeId=${sessionScope.user.userId}" class="moyo-nav-link">
                            <span class="moyo-nav-icon">🖼️</span>
                            <span class="moyo-nav-label">사진</span>
                        </a>
                        <div class="moyo-nav-link" id="alarmContainer" style="cursor:pointer;"
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
                        
                        <a href="/common/noticeList" class="moyo-nav-link">
                            <span class="moyo-nav-icon">⚠️</span>
                            <span class="moyo-nav-label">공지</span>
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
(function() {
    const isLogin = '${not empty sessionScope.user}' === 'true';
    const requestPageUrl = '${pageContext.request.contextPath}/requests';

    function normalizeAlarmList(res) {
        return Array.isArray(res) ? res : [];
    }

    function normalizePendingList(res) {
        return res && Array.isArray(res.items) ? res.items : [];
    }

    function getUnreadCount(alarms) {
        return alarms.filter(item => item && item.isRead === 'N').length;
    }

    function getRequestCount(res) {
        return res && res.count ? Number(res.count) : 0;
    }

    function setAlarmBadge(count) {
        const $badge = $('#alarmBadge');
        if (count > 0) {
            $badge.text(count > 99 ? '99+' : count).show();
        } else {
            $badge.hide();
        }
    }

    function setAlarmSummary(alarmCount, requestCount) {
        const totalCount = alarmCount + requestCount;
        let text = '새로운 소식 없음';
        if (totalCount > 0) {
            const parts = [];
            if (requestCount > 0) parts.push('요청 ' + requestCount + '건');
            if (alarmCount > 0) parts.push('읽지 않은 알림 ' + alarmCount + '건');
            text = parts.join(' · ');
        }
        $('#alarmSummary').text(text);
    }

    function updateAlarmCount() {
        $.when(
            $.get('/api/alarm/list'),
            $.get('/requests/api/count')
        ).done(function(alarmRes, requestRes) {
            const alarms = normalizeAlarmList(alarmRes[0]);
            const unreadCount = getUnreadCount(alarms);
            const requestCount = getRequestCount(requestRes[0]);
            setAlarmBadge(unreadCount + requestCount);
        }).fail(function() {
            $.get('/api/alarm/list', function(data) {
                setAlarmBadge(getUnreadCount(normalizeAlarmList(data)));
            });
        });
    }

    function clickAlarm(alarmId, targetUrl) {
        $.ajax({
            url: '/api/alarm/read',
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            data: $.param({ alarmId: alarmId }),
            success: function() {
                if (targetUrl) location.href = targetUrl;
                else loadAlarmDropdown(true);
            },
            error: function(xhr) {
                alert(xhr.responseText || '알림을 여는 중 문제가 발생했습니다.');
            }
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

    function processShareAction($card, shareId, status) {
        const $buttons = $card.find('button');
        $buttons.prop('disabled', true);
        $.post('/share/api/requests/' + shareId + '/respond', { status: status }, function(res) {
            if (!res || !(res.success === true || res.success === 'true')) {
                alert((res && res.message) ? res.message : '요청 처리 중 오류가 발생했습니다.');
                $buttons.prop('disabled', false);
                return;
            }
            $card.slideUp(160, function() {
                $(this).remove();
                loadAlarmDropdown(true);
                updateAlarmCount();
            });
        }).fail(function() {
            alert('서버 통신 중 오류가 발생했습니다.');
            $buttons.prop('disabled', false);
        });
    }

    function processInviteAction($card, inviteId, status) {
        const $buttons = $card.find('button');
        const formData = new FormData();
        const $container = $('#alarmContainer');
        formData.append('inviteId', inviteId);
        formData.append('status', status);
        formData.append('useAccountProfile', 'Y');
        formData.append('displayName', $container.data('account-name') || '');
        formData.append('contactEmail', $container.data('account-email') || '');
        formData.append('showPhone', 'N');

        $buttons.prop('disabled', true);
        $.ajax({
            url: '/workspace/api/invitation/process',
            type: 'POST',
            processData: false,
            contentType: false,
            data: formData,
            success: function(res) {
                if (!res || !(res.success === true || res.success === 'true')) {
                    alert((res && res.message) ? res.message : '요청 처리 중 오류가 발생했습니다.');
                    $buttons.prop('disabled', false);
                    return;
                }
                $card.slideUp(160, function() {
                    $(this).remove();
                    loadAlarmDropdown(true);
                    updateAlarmCount();
                });
            },
            error: function() {
                alert('서버 통신 중 오류가 발생했습니다.');
                $buttons.prop('disabled', false);
            }
        });
    }

    function makePendingRequestItem(item) {
        const isInvite = item.requestType === 'GROUP_INVITE';
        const typeLabel = isInvite ? '그룹 초대' : getShareTypeName(item.contentType, item);
        const id = item.id || item.shareId || item.inviteId;
        const $li = $('<li class="moyo-alarm-request-card">');
        const $main = $('<div class="moyo-alarm-request-main">');
        const $title = $('<div class="moyo-alarm-request-title">');
        $('<span class="moyo-alarm-request-type">').text(typeLabel).appendTo($title);
        $('<span class="moyo-alarm-request-name">').text(getPendingTitle(item)).appendTo($title);
        $('<div class="moyo-alarm-request-desc">').text(getPendingDescription(item)).appendTo($main);
        $main.prepend($title);

        const $actions = $('<div class="moyo-alarm-actions">');
        const $accept = $('<button type="button" class="moyo-alarm-action-btn is-primary">수락</button>');
        const $reject = $('<button type="button" class="moyo-alarm-action-btn">거절</button>');
        $accept.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (isInvite) processInviteAction($li, id, 'ACCEPTED');
            else processShareAction($li, id, 'ACCEPTED');
        });
        $reject.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (isInvite) processInviteAction($li, id, 'REJECTED');
            else processShareAction($li, id, 'REJECTED');
        });
        $actions.append($accept, $reject);
        $li.append($main, $actions);
        return $li;
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
        const noticeId = item.notice_id || item.noticeId;
        if ((alertType === 'CALENDAR_REMINDER' || alertType === 'CALENDAR_ATTENDEE' || targetType === 'CALENDAR') && targetId) {
            return '/calendar/event/detail?eventId=' + encodeURIComponent(targetId);
        }
        if (noticeId) return '/common/noticeList?openId=' + encodeURIComponent(noticeId);
        return '';
    }

    function makeAlarmItem(item) {
        const alarmId = item.alarm_id || item.alarmId;
        const title = item.title || '새 알림';
        const content = item.content || item.CONTENT || '';
        const meta = getAlarmMeta(item);
        const targetUrl = getAlarmTargetUrl(item);
        const $li = $('<li class="moyo-alarm-item">');
        $('<span class="moyo-alarm-item-icon">').text(meta.icon).appendTo($li);
        $li.append(
            '<span class="moyo-alarm-item-main">' +
                '<span class="moyo-alarm-item-title"></span>' +
                '<span class="moyo-alarm-item-desc"></span>' +
            '</span>'
        );
        $li.find('.moyo-alarm-item-title').text(title);
        $li.find('.moyo-alarm-item-desc').text(content ? content : meta.label);
        $li.attr('title', meta.label);
        $li.on('click', function(e) {
            e.stopPropagation();
            clickAlarm(alarmId, targetUrl);
        });
        return $li;
    }

    function renderAlarmDropdown(alarms, pendingRequests) {
        const unreadCount = getUnreadCount(alarms);
        const requestCount = pendingRequests.length;
        const $list = $('#alarmList');
        $list.empty();
        setAlarmSummary(unreadCount, requestCount);
        setAlarmBadge(unreadCount + requestCount);

        if (requestCount > 0) {
            $list.append('<li class="moyo-alarm-section-label">요청</li>');
            pendingRequests.slice(0, 4).forEach(function(item) {
                $list.append(makePendingRequestItem(item));
            });
            if (requestCount > 4) {
                $list.append('<li class="moyo-alarm-more"><a href="' + requestPageUrl + '">남은 요청 ' + (requestCount - 4) + '건 보기</a></li>');
            }
        }

        if (alarms && alarms.length > 0) {
            $list.append('<li class="moyo-alarm-section-label">알림</li>');
            alarms.forEach(function(item) {
                $list.append(makeAlarmItem(item));
            });
        }

        if (requestCount === 0 && (!alarms || alarms.length === 0)) {
            $list.append('<li class="moyo-alarm-empty">새로운 알림이 없습니다.</li>');
        }
    }

    function loadAlarmDropdown(keepOpen) {
        $.when(
            $.get('/api/alarm/list'),
            $.get('/requests/api/pending')
        ).done(function(alarmRes, requestRes) {
            const alarms = normalizeAlarmList(alarmRes[0]);
            const pendingRequests = normalizePendingList(requestRes[0]);
            renderAlarmDropdown(alarms, pendingRequests);
            $('#alarmDropdown').show();
        }).fail(function() {
            $.get('/api/alarm/list', function(data) {
                const alarms = normalizeAlarmList(data);
                renderAlarmDropdown(alarms, []);
                $('#alarmDropdown').show();
            });
        });
    }

    $(document).ready(function() {
        if (isLogin) {
            updateAlarmCount();
            setInterval(updateAlarmCount, 30000);
        }

        $('#alarmContainer').on('click', function(e) {
            e.stopPropagation();
            const $dropdown = $('#alarmDropdown');
            if ($dropdown.is(':visible')) {
                $dropdown.hide();
            } else {
                loadAlarmDropdown();
            }
        });

        $('#alarmDropdown').on('click', function(e) {
            e.stopPropagation();
        });

        $(document).on('click', function(e) {
            if (!$(e.target).closest('#alarmContainer').length) {
                $('#alarmDropdown').hide();
            }
        });
    });
})();
</script>
