<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
<title>MOYO | 관리자 센터</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/adminShell.css?v=admin-center-v1">
</head>
<body class="moyo-admin-shell">
<%@ include file="../common/header.jsp"%>

<aside class="admin-shell-sidebar" aria-label="관리자 메뉴">
    <div class="admin-shell-brand">
        <small>MOYO ADMIN</small>
        <strong>관리자 센터</strong>
    </div>
    <nav class="admin-shell-nav">
        <a href="${pageContext.request.contextPath}/admin" class="is-active"><i class="fa-solid fa-chart-pie"></i><span>대시보드</span></a>
        <a href="${pageContext.request.contextPath}/admin#users"><i class="fa-regular fa-user"></i><span>사용자 관리</span></a>
        <a href="${pageContext.request.contextPath}/admin/inquiries"><i class="fa-regular fa-comments"></i><span>문의 관리</span></a>
        <a href="${pageContext.request.contextPath}/common/noticeList"><i class="fa-regular fa-rectangle-list"></i><span>공지사항 관리</span></a>
        <span class="is-disabled"><i class="fa-solid fa-triangle-exclamation"></i><span>신고·제재 관리</span><span class="admin-shell-badge">준비중</span></span>
        <span class="is-disabled"><i class="fa-solid fa-sliders"></i><span>서비스 운영</span><span class="admin-shell-badge">준비중</span></span>
        <a href="${pageContext.request.contextPath}/admin/logs"><i class="fa-solid fa-chart-line"></i><span>로그·통계</span></a>
        <div class="admin-shell-exit">
            <a href="${pageContext.request.contextPath}/"><i class="fa-solid fa-arrow-left"></i><span>MOYO로 돌아가기</span></a>
        </div>
    </nav>
</aside>

<main class="admin-shell-main">
    <section class="admin-shell-hero">
        <div>
            <p class="admin-shell-kicker">MOYO 관리자</p>
            <h1>관리자 센터</h1>
            <p>사용자와 문의, 공지사항 등 서비스 운영 기능을 한곳에서 관리합니다.</p>
        </div>
    </section>

    <section class="admin-shell-summary" aria-label="관리 요약">
        <div class="admin-shell-card"><span>전체 사용자</span><strong>${userList.size()}명</strong></div>
        <div class="admin-shell-card"><span>문의 관리</span><strong>문의함</strong></div>
        <div class="admin-shell-card"><span>공지사항</span><strong>운영</strong></div>
    </section>

    <section id="users" class="admin-shell-panel">
        <div class="admin-shell-panel-head">
            <div><h2>사용자 관리</h2><p>가입 사용자 정보와 상담 이력을 확인합니다.</p></div>
        </div>
        <div class="admin-shell-table-wrap">
            <table class="admin-shell-table">
                <thead><tr><th>ID</th><th>이메일</th><th>이름</th><th>권한</th><th>상태</th><th>관리</th></tr></thead>
                <tbody>
                <c:forEach var="u" items="${userList}">
                    <tr>
                        <td>${u.USER_ID}</td><td>${u.EMAIL}</td><td>${u.USER_NAME}</td><td>${u.userRole}</td><td>${u.status}</td>
                        <td>
                            <button class="admin-shell-btn" onclick="editUser('${u.EMAIL}')">수정</button>
                            <button class="admin-shell-btn is-danger" onclick="deleteUser('${u.EMAIL}')">차단</button>
                            <button class="admin-shell-btn is-primary" onclick="showUserDetail('${u.USER_ID}', '${u.USER_NAME}', '${u.EMAIL}')">상세보기</button>
                        </td>
                    </tr>
                </c:forEach>
                </tbody>
            </table>
        </div>
    </section>

    <section id="detail-section" class="admin-shell-detail" style="display:none;">
        <h3 id="detail-title">사용자 상세 정보</h3>
        <div class="admin-shell-detail-grid">
            <div class="admin-shell-detail-box">
                <h4>기본 정보</h4>
                <p><strong>이름:</strong> <span id="detail-name"></span></p>
                <p><strong>이메일:</strong> <span id="detail-email"></span></p>
            </div>
            <div class="admin-shell-detail-box">
                <h4>상담 이력</h4>
                <div id="cs-history-list"></div>
            </div>
        </div>
    </section>
</main>

<script>
function escapeAdminHtml(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function showUserDetail(userId, userName, email) {
    const detailSection = document.getElementById('detail-section');
    detailSection.style.display = 'block';
    document.getElementById('detail-title').innerText = '관리 대상: ' + userName;
    document.getElementById('detail-name').innerText = userName;
    document.getElementById('detail-email').innerText = email;
    fetch('${pageContext.request.contextPath}/admin/getCsHistory?userId=' + encodeURIComponent(userId))
        .then(res => res.json()).then(data => {
            const listDiv = document.getElementById('cs-history-list');
            if (!data.length) { listDiv.innerHTML = '<p style="color:#8b96a6;">등록된 상담 기록이 없습니다.</p>'; }
            else {
                let html = '<table class="admin-shell-table"><thead><tr><th>번호</th><th>상태</th><th>참조키</th></tr></thead><tbody>';
                data.forEach(item => { html += '<tr><td>' + escapeAdminHtml(item.csId) + '</td><td>' + escapeAdminHtml(item.csStatus) + '</td><td>' + escapeAdminHtml(item.extKey) + '</td></tr>'; });
                html += '</tbody></table>'; listDiv.innerHTML = html;
            }
            detailSection.scrollIntoView({behavior:'smooth', block:'start'});
        }).catch(err => console.error('로드 실패:', err));
}
function editUser(email) { console.log('edit user', email); }
function deleteUser(email) { console.log('block user', email); }
</script>
</body>
</html>
