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
                        <div class="moyo-nav-link" id="alarmContainer" style="cursor:pointer;">
                            <span class="moyo-nav-icon">🔔</span>
                            <span class="moyo-nav-label">알림</span>
                            <span id="alarmBadge">0</span>

                            <div id="alarmDropdown" style="display:none; position:absolute; top:40px; right:0; width:300px; background:#fff; border:1px solid #e9eef4; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); z-index:1000; padding:10px;">
                                <div style="font-weight:900; padding:10px; border-bottom:1px solid #eee;">새로운 알림</div>
                                <ul id="alarmList" style="list-style:none; padding:0; margin:0; max-height:300px; overflow-y:auto;">
                                    </ul>
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
    // 2. 알림 배지 업데이트 함수
    function updateAlarmCount() {
        $.get('/api/alarm/list', function(data) {
            const unreadCount = data.filter(item => item.isRead === 'N').length;
            const $badge = $('#alarmBadge');
            
            if (unreadCount > 0) {
                $badge.text(unreadCount).show();
            } else {
                $badge.hide();
            }
        });
    }

    // 3. 페이지 로드 시 실행
    $(document).ready(function() {
        if ('${not empty sessionScope.user}' === 'true') {
                     updateAlarmCount();
            
            setInterval(function() {
         
                updateAlarmCount();
            }, 30000);
        }
    });
    
    // 4. 알림창 토글 및 기타 기능들
function clickAlarm(alarmId, noticeId) {
    console.log("보내는 ID:", alarmId);

    $.ajax({
        url: '/api/alarm/read',
        type: 'POST',
        // 서버에 폼 데이터로 보내겠다고 명시
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        // 데이터를 문자열 쿼리 형태로 확실하게 변환
        data: $.param({ alarmId: alarmId }),
        success: function(response) {
            console.log("읽음 처리 성공:", response);
            location.href = '/common/noticeList?openId=' + noticeId;
        },
        error: function(xhr, status, error) {
            console.error("400 에러 발생:", xhr.responseText);
        }
    });
}

$('#alarmContainer').on('click', function(e) {
    e.stopPropagation(); 
    const $dropdown = $('#alarmDropdown');
    
    if ($dropdown.is(':visible')) {
        $dropdown.hide();
    } else {
        $.get('/api/alarm/list', function(data) {
            console.log("받아온 데이터:", data); // 여기서 item.alarm_id 값이 보이는지 확인하세요!
            const $list = $('#alarmList');
            $list.empty();
            
            if (!data || data.length === 0) {
                $list.append('<li style="padding:15px; text-align:center; color:#999;">새로운 알림이 없습니다.</li>');
            } else {
                data.forEach(item => {
                
                	    // 모든 키를 콘솔에 출력해서 눈으로 직접 확인하세요!
                	    console.log("객체 키 확인:", Object.keys(item)); 
                	    
                	    // 이 중에서 숫자가 들어있는 키를 찾으세요.
                	    // 만약 alarmId로 되어있다면 아래를 item.alarmId로 바꾸면 바로 해결됩니다.
                	    const alarmId = item.alarm_id || item.alarmId; 
                	    const noticeId = item.notice_id || item.noticeId;
                	    const title = item.title;

                	    console.log("최종 확인된 ID:", alarmId);
                	    
               
                    const $li = $('<li>').css({
                        'padding': '15px',
                        'cursor': 'pointer',
                        'border-bottom': '1px solid #eee',
                        'color': '#333'
                    }).html('<b>' + title + '</b>');

                    $li.on('click', function() {
                        // 이제 여기서 올바른 alarmId를 넘겨주게 됩니다.
                        clickAlarm(alarmId, noticeId);
                    });

                    $list.append($li);
                });
            }
            $dropdown.show();
        });
    }
});
    $(document).click(function(e) {
        if (!$(e.target).closest('#alarmContainer').length) {
            $('#alarmDropdown').hide();
        }
    });
</script>
