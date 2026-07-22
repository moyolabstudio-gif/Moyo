<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%-- commonJoinProfile v2: header 공통 컴포넌트 사용 --%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>요청함 - MOYO</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<style>
        * { box-sizing:border-box; }
        .container { max-width:800px; margin:50px auto; padding:20px; }
        .invite-card {
            display:flex; justify-content:space-between; align-items:center; gap:20px;
            padding:20px; border:1px solid #e7ebf0; border-radius:14px; margin-bottom:15px;
            box-shadow:0 5px 14px rgba(15,23,42,.04); background:#fff;
        }
        .invite-info h3 { margin:0 0 5px; color:#222; }
        .invite-info p { margin:0; color:#667085; font-size:14px; }
        .btn-group { display:flex; gap:8px; }
        .btn {
            min-height:36px; padding:0 15px; border-radius:9px;
            cursor:pointer; border:1px solid #dfe6ee; font-weight:700; background:#fff;
        }
        .btn-accept { border:0; background:linear-gradient(135deg,#4A90E2,#39CDB5); color:#fff; }
        .btn-reject { color:#667085; }
        .empty-msg { text-align:center; color:#999; margin-top:50px; }
        .request-summary { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:18px; }
        .request-summary h2 { margin:0; color:#172033; }
        .request-subtitle { margin:6px 0 0; color:#667085; font-size:13px; }
        .request-counts { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:7px; }
        .request-tabs { display:flex; gap:8px; margin:18px 0 12px; }
        .request-tab { padding:8px 13px; border:1px solid #dfe7f1; border-radius:999px; background:#fff; color:#64748b; font-weight:800; cursor:pointer; }
        .request-tab.is-active { border-color:#7eb3f2; background:#f4f9ff; color:#2878d0; }
        .request-panel { display:none; }
        .request-panel.is-active { display:block; }
        .request-title-line { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px; }
        .request-title-line h3 { margin:0; }
        .request-type-badge { display:inline-flex; align-items:center; min-height:24px; padding:0 9px; border-radius:999px; background:#eef6ff; color:#2878d0; font-size:11px; font-weight:900; }
        .request-section-title { margin:28px 0 12px; font-size:16px; color:#253247; }
        .request-card { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:18px 20px; border:1px solid #e7ebf0; border-radius:14px; margin-bottom:12px; box-shadow:0 5px 14px rgba(15,23,42,.04); background:#fff; }
        .request-card.is-pending { border-color:#cfe3ff; background:#fbfdff; }
        .request-info h3 { margin:0 0 6px; color:#222; font-size:16px; }
        .request-info p { margin:0 0 4px; color:#667085; font-size:13px; line-height:1.45; }
        .request-meta { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
        .request-chip { display:inline-flex; align-items:center; min-height:24px; padding:0 9px; border-radius:999px; background:#f1f5f9; color:#64748b; font-size:11px; font-weight:800; }
        .request-chip.is-pending { background:#fff7e6; color:#b7791f; }
        .request-chip.is-accepted { background:#ecfdf5; color:#168257; }
        .request-chip.is-rejected, .request-chip.is-canceled { background:#fef2f2; color:#d14343; }

        .request-detail-lines { display:grid; gap:5px; margin-top:10px; color:#526173; font-size:12px; }
        .request-detail-line { display:flex; gap:8px; align-items:flex-start; line-height:1.45; }
        .request-detail-label { flex:0 0 auto; min-width:34px; color:#8491a3; font-weight:900; }
        .request-detail-value { min-width:0; color:#475569; }
        .request-guide { margin-top:9px !important; color:#718096 !important; font-size:12px !important; }
        .request-chip.is-attendee { background:#eefcf7; color:#168257; }
        .request-chip.is-edit { background:#eef6ff; color:#2878d0; }

        .profile-overlay {
            display:none; position:fixed; inset:0; z-index:3000;
            background:rgba(15,23,42,.46);
        }
        .profile-modal {
            display:none; position:fixed; z-index:3001; left:50%; top:50%;
            width:560px; max-width:calc(100vw - 28px); max-height:calc(100vh - 36px);
            overflow:auto; transform:translate(-50%,-50%);
            padding:25px; border-radius:20px; background:#fff;
            box-shadow:0 26px 70px rgba(15,23,42,.22);
        }
        .profile-modal-head { display:flex; justify-content:space-between; gap:16px; margin-bottom:18px; }
        .profile-modal-head h3 { margin:4px 0 0; font-size:21px; }
        .profile-modal-head small { color:#4a90e2; font-weight:800; }
        .profile-close { border:0; background:transparent; color:#94a3b8; font-size:25px; cursor:pointer; }
        .profile-choice { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; }
        .profile-choice label {
            display:flex; align-items:flex-start; gap:9px; padding:14px;
            border:1px solid #dfe7ef; border-radius:13px; cursor:pointer;
        }
        .profile-choice label:has(input:checked) { border-color:#6ca6e9; background:#f5f9ff; }
        .profile-choice input { margin-top:2px; accent-color:#4a90e2; }
        .profile-choice strong { display:block; margin-bottom:3px; font-size:13px; }
        .profile-choice span span { display:block; color:#7b8798; font-size:11px; line-height:1.4; }
        .profile-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:13px; margin-top:17px; }
        .profile-fields.is-disabled { opacity:.45; pointer-events:none; }
        .profile-field { min-width:0; }
        .profile-field.full { grid-column:1/-1; }
        .profile-field label { display:block; margin-bottom:6px; color:#475569; font-size:12px; font-weight:800; }
        .profile-field input,.profile-field textarea {
            width:100%; border:1px solid #dfe7ef; border-radius:10px;
            padding:10px 11px; outline:none; font:13px inherit;
        }
        .profile-field textarea { min-height:86px; resize:vertical; }
        .profile-check { display:flex !important; align-items:center; gap:8px; font-weight:500 !important; }
        .profile-check input { width:auto; accent-color:#4a90e2; }
        .profile-actions {
            display:flex; justify-content:flex-end; gap:8px;
            margin-top:20px; padding-top:16px; border-top:1px solid #edf2f6;
        }
        @media(max-width:600px) {
            .invite-card { align-items:flex-start; flex-direction:column; }
            .profile-choice,.profile-fields { grid-template-columns:1fr; }
            .profile-field.full { grid-column:auto; }
        }
    
.profile-image-editor {
    display:flex; align-items:center; gap:18px; margin:18px 0;
    padding:15px; border:1px solid #e3eaf2; border-radius:15px; background:#fbfdff;
}
.profile-image-viewport {
    position:relative; width:112px; height:112px; flex:0 0 112px;
    overflow:hidden; border-radius:50%; border:1px solid #dbe6f1;
    background:linear-gradient(135deg,#4A90E2,#39CDB5);
    touch-action:none; cursor:grab;
}
.profile-image-viewport:active { cursor:grabbing; }
.profile-image-viewport img {
    position:absolute; left:50%; top:50%; min-width:100%; min-height:100%;
    width:auto; height:auto; max-width:none; user-select:none; pointer-events:none;
    transform-origin:center;
}
.profile-image-placeholder {
    width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:34px; font-weight:900;
}
.profile-image-tools { flex:1; min-width:0; }
.profile-image-tools strong { display:block; margin-bottom:7px; font-size:13px; color:#334155; }
.profile-image-tools small { display:block; margin:7px 0 11px; color:#8491a3; font-size:11px; }
.profile-image-tools input[type="range"] { width:100%; accent-color:#4A90E2; }
.profile-image-button {
    display:inline-flex; align-items:center; min-height:34px; padding:0 12px;
    border:1px solid #dbe4ee; border-radius:9px; background:#fff;
    color:#475569; font-size:12px; font-weight:700; cursor:pointer;
}


/* MOYO 공지사항 페이지 계열 요청함 */
html, body { min-height:100%; }
body { margin:0; background:linear-gradient(115deg, rgba(220,251,247,.72) 0%, rgba(255,255,255,.96) 46%, rgba(228,238,255,.88) 100%); color:#172033; }
.container.request-page { width:min(980px, calc(100% - 48px)); max-width:none; margin:0 auto; padding:62px 0 88px; }
.request-summary { min-height:112px; margin:0 0 24px; align-items:flex-end; }
.request-eyebrow { display:inline-flex; align-items:center; gap:8px; margin-bottom:10px; color:#1672dc; font-size:12px; font-weight:900; }
.request-eyebrow::before { content:""; width:4px; height:18px; border-radius:999px; background:linear-gradient(180deg,#39cdb5,#4a7ff0); }
.request-summary h2 { margin:0; font-size:34px; line-height:1.16; letter-spacing:-1.4px; color:#16243a; }
.request-subtitle { margin-top:10px; font-size:14px; color:#5f7088; font-weight:600; }
.request-counts { align-self:center; }
.request-counts .request-chip { min-height:30px; padding:0 12px; background:rgba(255,255,255,.78); border:1px solid #dce8f6; box-shadow:0 5px 16px rgba(56,94,137,.06); }
.request-counts .request-chip.is-pending { background:#fff7e8; border-color:#ffe3aa; color:#b26b00; }
.request-tabs { margin:0; padding:16px 18px 0; border:1px solid #d8e4f2; border-bottom:0; border-radius:22px 22px 0 0; background:rgba(255,255,255,.94); gap:6px; }
.request-tab { min-height:38px; padding:0 16px; border-color:transparent; background:transparent; }
.request-tab:hover { background:#f5f9ff; color:#2878d0; }
.request-tab.is-active { border-color:#acd0fb; background:#f5f9ff; box-shadow:0 3px 10px rgba(74,144,226,.08); }
.request-panel { min-height:280px; padding:22px 18px 26px; border:1px solid #d8e4f2; border-top:0; border-radius:0 0 22px 22px; background:rgba(255,255,255,.94); box-shadow:0 22px 48px rgba(62,91,130,.10); }
.request-section-title { margin:0 4px 16px; font-size:16px; }
.request-card { margin:0 0 10px; padding:17px 18px; border-color:#e3ebf5; border-radius:15px; box-shadow:none; background:#fff; transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.request-card:hover { border-color:#c9ddf5; box-shadow:0 9px 22px rgba(54,87,128,.08); transform:translateY(-1px); }
.request-card.is-pending { border-color:#cfe4ff; background:linear-gradient(110deg,#fbfeff,#f7fbff); }
.request-type-badge { background:#eef6ff; color:#2878d0; }
.request-type-badge.is-group { background:#eafaf6; color:#13846f; }
.btn { min-height:38px; border-radius:10px; }
.btn-accept { background:linear-gradient(135deg,#39cdb5,#4a7ff0); box-shadow:0 6px 14px rgba(66,143,214,.18); }
.empty-msg { display:flex; align-items:center; justify-content:center; min-height:190px; margin:0; color:#8795a8; }
@media(max-width:760px) {
  .container.request-page { width:min(100% - 28px,980px); padding-top:38px; }
  .request-summary { align-items:flex-start; flex-direction:column; min-height:auto; }
  .request-summary h2 { font-size:29px; }
  .request-counts { align-self:flex-start; justify-content:flex-start; }
  .request-card { align-items:flex-start; flex-direction:column; }
  .btn-group { width:100%; justify-content:flex-end; }
}

.request-tab-count { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; margin-left:5px; padding:0 6px; border-radius:999px; background:#ff5b67; color:#fff; font-size:10px; font-weight:900; }
.notification-list { display:grid; gap:10px; }
.notification-card { position:relative; display:flex; align-items:flex-start; gap:14px; width:100%; padding:17px 18px; border:1px solid #e3ebf5; border-radius:15px; background:#fff; color:inherit; text-align:left; text-decoration:none; cursor:pointer; transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.notification-card:hover { border-color:#c9ddf5; box-shadow:0 9px 22px rgba(54,87,128,.08); transform:translateY(-1px); }
.notification-card.is-unread { border-color:#cfe4ff; background:linear-gradient(110deg,#fbfeff,#f5faff); }
.notification-card.is-unread::after { content:""; position:absolute; top:16px; right:16px; width:7px; height:7px; border-radius:50%; background:#3b82f6; box-shadow:0 0 0 4px rgba(59,130,246,.10); }
.notification-icon { flex:0 0 40px; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:12px; background:#eef6ff; color:#6b8cf5; }
.notification-icon svg { width:20px; height:20px; display:block; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.notification-icon.is-notice { background:#fff6e8; }
.notification-icon.is-calendar { background:#edf8f5; }
.notification-icon.is-activity { background:#f2efff; }
.notification-main { min-width:0; flex:1; }
.notification-head { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding-right:20px; }
.notification-title { margin:0; color:#1d2a3d; font-size:15px; font-weight:900; line-height:1.35; }
.notification-type { display:inline-flex; align-items:center; min-height:23px; padding:0 8px; border-radius:999px; background:#eef6ff; color:#2878d0; font-size:10px; font-weight:900; }
.notification-content { display:-webkit-box; overflow:hidden; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin:6px 0 0; color:#64748b; font-size:13px; line-height:1.55; }
.notification-meta { display:flex; align-items:center; flex-wrap:wrap; gap:7px; margin-top:9px; color:#91a0b3; font-size:11px; font-weight:700; }
.notification-read-state { color:#6f8096; }
.notification-card.is-unread .notification-read-state { color:#2878d0; }
@media(max-width:760px) {
  .request-tabs { overflow-x:auto; padding-bottom:2px; }
  .request-tab { flex:0 0 auto; }
  .notification-card { padding:15px; }
}

    
/* Request type icons: shared across received, sent and completed tabs */
.request-card {
  display:grid;
  grid-template-columns:44px minmax(0,1fr) auto;
  align-items:center;
}
.request-card-icon {
  width:40px;
  height:40px;
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#eef6ff;
  color:#6b8cf5;
  align-self:start;
}
.request-card-icon svg {
  width:20px;
  height:20px;
  display:block;
  fill:none;
  stroke:currentColor;
  stroke-width:1.8;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.request-card-icon.is-photo { background:#fff6e8; color:#e89a45; }
.request-card-icon.is-note { background:#f2efff; color:#8068d8; }
.request-card-icon.is-calendar { background:#edf8f5; color:#35a98f; }
.request-card-icon.is-group { background:#eaf8f7; color:#2aaea5; }
.request-card > .btn-group { justify-self:end; }
/* Final alignment refinements */
.request-card > .btn-group {
  align-self:center;
  justify-self:end;
}
.request-meta {
  column-gap:10px;
  row-gap:6px;
}
.request-detail-label {
  font-weight:700;
}
@media (max-width:760px) {
  .request-card { grid-template-columns:40px minmax(0,1fr); }
  .request-card > .btn-group {
    grid-column:1 / -1;
    align-self:auto;
    justify-self:stretch;
    width:100%;
  }
}


.notification-approved-action{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    align-self:flex-start;
    min-height:34px;
    margin-top:10px;
    padding:0 15px;
    border-radius:11px;
    background:linear-gradient(135deg,#39cdb5 0%,#4a90e2 52%,#6b5df6 100%);
    color:#fff;
    font-size:13px;
    font-weight:800;
    line-height:1;
    box-shadow:0 7px 16px rgba(67,141,232,.16);
}
.notification-card:hover .notification-approved-action{
    transform:translateY(-1px);
    box-shadow:0 9px 20px rgba(67,141,232,.22);
}

.notification-approved-actions{
    display:flex;
    align-items:center;
    gap:10px;
    margin-top:10px;
    flex-wrap:wrap;
}
.notification-approved-actions .notification-approved-action{
    margin-top:0;
}
.notification-abandon-action{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:34px;
    padding:0 14px;
    border:1px solid #dce5f2;
    border-radius:11px;
    background:#fff;
    color:#68788f;
    font-size:13px;
    font-weight:800;
    cursor:pointer;
    box-sizing:border-box;
    user-select:none;
}
.notification-abandon-action:focus-visible{
    outline:none;
    box-shadow:0 0 0 3px rgba(223,83,96,.14);
}
.notification-abandon-action:hover{
    border-color:#f0b8be;
    color:#df5360;
    background:#fff8f8;
}
.notification-type.is-join-cancelled{
    background:#f3f5f8;
    color:#6d7b90;
}
</style>
</head>
<body
    data-account-name="<c:out value='${accountDisplayName}'/>"
    data-account-email="<c:out value='${accountEmail}'/>">
<jsp:include page="../common/header.jsp" />

<div class="container request-page">
    <div class="request-summary">
        <div>
            <span class="request-eyebrow">MOYO 안내</span>
            <h2>요청함</h2>
            <p class="request-subtitle">그룹 초대·참여 요청과 사진/노트/일정 공유 요청을 한 곳에서 확인합니다.</p>
        </div>
        <div class="request-counts">
            <span class="request-chip is-pending">전체 대기 ${totalPendingRequestCount}</span>
            <span class="request-chip">초대 ${inviteRequestCount}</span>
            <span class="request-chip">참여 요청 ${joinRequestCount}</span>
            <span class="request-chip">공유 ${shareRequestCount}</span>
        </div>
    </div>

    <div class="request-tabs" role="tablist" aria-label="요청함 탭">
        <button type="button" class="request-tab is-active" data-request-tab="received">받은 요청</button>
        <button type="button" class="request-tab" data-request-tab="sent">보낸 요청</button>
        <button type="button" class="request-tab" data-request-tab="done">완료됨</button>
        <button type="button" class="request-tab" data-request-tab="notifications">전체 알림 <c:if test="${unreadNoticeCount > 0}"><span class="request-tab-count">${unreadNoticeCount}</span></c:if></button>
    </div>

    <section class="request-panel is-active" data-request-panel="received">
        <h3 class="request-section-title">받은 요청</h3>

        <c:set var="hasReceivedPending" value="${false}" />
        <c:forEach var="share" items="${receivedShareRequests}">
            <c:if test="${share.shareStatus == 'PENDING'}">
                <c:set var="hasReceivedPending" value="${true}" />
                <div class="request-card is-pending" id="share-request-${share.shareId}">
                    <span class="request-card-icon <c:choose><c:when test="${share.contentType == 'PHOTO'}">is-photo</c:when><c:when test="${share.contentType == 'NOTE'}">is-note</c:when><c:when test="${share.contentType == 'CALENDAR'}">is-calendar</c:when></c:choose>" aria-hidden="true">
                        <c:choose>
                            <c:when test="${share.contentType == 'PHOTO'}">
                                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 4.5-4.5 3 3 2-2L19 17"/></svg>
                            </c:when>
                            <c:when test="${share.contentType == 'NOTE'}">
                                <svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4"/><path d="M9 11h6M9 15h6"/></svg>
                            </c:when>
                            <c:otherwise>
                                <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
                            </c:otherwise>
                        </c:choose>
                    </span>
                    <div class="request-info">
                        <div class="request-title-line">
                            <span class="request-type-badge">
                                <c:choose>
                                    <c:when test="${share.contentType == 'PHOTO'}">사진 공유 요청</c:when>
                                    <c:when test="${share.contentType == 'NOTE'}">노트 공유 요청</c:when>
                                    <c:when test="${share.contentType == 'CALENDAR' && share.calendarAttendeeYn == 'Y'}">일정 참석 · 공유 요청</c:when>
                                    <c:when test="${share.contentType == 'CALENDAR'}">일정 공유 요청</c:when>
                                    <c:otherwise>${share.contentType} 공유 요청</c:otherwise>
                                </c:choose>
                            </span>
                            <h3><c:out value="${share.contentTitle}"/></h3>
                        </div>
                        <p>
                            <c:choose>
                                <c:when test="${share.contentType == 'CALENDAR' && share.calendarAttendeeYn == 'Y' && share.permissionType == 'EDIT'}">
                                    <strong><c:out value="${share.requesterName}"/></strong>님이 이 일정에 참석자로 추가하고, 편집 권한이 포함된 공유 요청을 보냈습니다.
                                </c:when>
                                <c:when test="${share.contentType == 'CALENDAR' && share.calendarAttendeeYn == 'Y'}">
                                    <strong><c:out value="${share.requesterName}"/></strong>님이 이 일정에 참석자로 추가하고, 공유 요청을 보냈습니다.
                                </c:when>
                                <c:when test="${share.contentType == 'CALENDAR' && share.permissionType == 'EDIT'}">
                                    <strong><c:out value="${share.requesterName}"/></strong>님이 편집 권한이 포함된 일정 공유 요청을 보냈습니다.
                                </c:when>
                                <c:otherwise>
                                    <strong><c:out value="${share.requesterName}"/></strong>님이 공유 요청을 보냈습니다.
                                </c:otherwise>
                            </c:choose>
                        </p>
                        <c:if test="${share.contentType == 'CALENDAR'}">
                            <div class="request-detail-lines">
                                <div class="request-detail-line">
                                    <span class="request-detail-label">일시</span>
                                    <span class="request-detail-value">
                                        <c:choose>
                                            <c:when test="${not empty share.calendarStartDt}">
                                                <c:out value="${share.calendarStartDt}"/>
                                                <c:if test="${not empty share.calendarEndDt}"> - <c:out value="${share.calendarEndDt}"/></c:if>
                                            </c:when>
                                            <c:otherwise>일시 정보 없음</c:otherwise>
                                        </c:choose>
                                    </span>
                                </div>
                                <div class="request-detail-line">
                                    <span class="request-detail-label">장소</span>
                                    <span class="request-detail-value">
                                        <c:choose>
                                            <c:when test="${not empty share.calendarLocationText}"><c:out value="${share.calendarLocationText}"/></c:when>
                                            <c:when test="${not empty share.calendarLocationAddress}"><c:out value="${share.calendarLocationAddress}"/></c:when>
                                            <c:otherwise>장소 없음</c:otherwise>
                                        </c:choose>
                                    </span>
                                </div>
                            </div>
                        </c:if>
                        <div class="request-meta">
                            <c:if test="${share.calendarAttendeeYn == 'Y'}"><span class="request-chip is-attendee">참석자</span></c:if>
                            <span class="request-chip">
                                <c:choose>
                                    <c:when test="${share.targetType == 'USER'}">친구</c:when>
                                    <c:when test="${share.targetType == 'WS'}">그룹</c:when>
                                    <c:when test="${share.targetType == 'PROJ'}">프로젝트</c:when>
                                    <c:otherwise><c:out value="${share.targetType}"/></c:otherwise>
                                </c:choose>
                            </span>
                            <c:if test="${share.permissionType == 'EDIT'}"><span class="request-chip is-edit">편집 가능</span></c:if>
                            <span class="request-chip is-pending">수락 대기</span>
                        </div>
                        <c:if test="${share.contentType == 'CALENDAR'}">
                            <p class="request-guide">
                                <c:choose>
                                    <c:when test="${share.permissionType == 'EDIT'}">공유 요청을 수락하면 이 일정을 편집할 수 있습니다.</c:when>
                                    <c:otherwise>공유 요청을 수락하면 이 일정을 내 캘린더에서 확인할 수 있습니다.</c:otherwise>
                                </c:choose>
                            </p>
                        </c:if>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-accept" onclick="respondShareRequest(${share.shareId}, 'ACCEPTED')">수락</button>
                        <button type="button" class="btn btn-reject" onclick="respondShareRequest(${share.shareId}, 'REJECTED')">거절</button>
                    </div>
                </div>
            </c:if>
        </c:forEach>

        <c:forEach var="joinRequest" items="${joinRequestList}">
            <c:set var="hasReceivedPending" value="${true}" />
            <div class="request-card is-pending" id="join-request-${joinRequest.requestId}">
                <span class="request-card-icon is-group" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                        <circle cx="9" cy="8" r="3"/>
                        <circle cx="17" cy="9" r="2"/>
                        <path d="M3 19c.7-3.3 3-5 6-5s5.3 1.7 6 5"/>
                        <path d="M14.5 15c2.6.2 4.3 1.5 5 4"/>
                    </svg>
                </span>
                <div class="request-info">
                    <div class="request-title-line">
                        <span class="request-type-badge is-group">그룹 참여 요청</span>
                        <h3><c:out value="${joinRequest.wsName}"/></h3>
                    </div>
                    <p>
                        <strong><c:out value="${joinRequest.requesterName}"/></strong>님이
                        그룹 참여를 요청했습니다.
                    </p>
                    <c:if test="${not empty joinRequest.REQUESTER_EMAIL}">
                        <p><c:out value="${joinRequest.requesterEmail}"/></p>
                    </c:if>
                    <div class="request-meta">
                        <span class="request-chip">그룹</span>
                        <span class="request-chip is-pending">승인 대기</span>
                        <c:if test="${not empty joinRequest.REQUESTED_AT}">
                            <span class="request-chip"><c:out value="${joinRequest.requestedAt}"/></span>
                        </c:if>
                    </div>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-accept"
                            onclick="respondJoinRequest(${joinRequest.requestId}, 'APPROVED')">승인</button>
                    <button type="button" class="btn btn-reject"
                            onclick="respondJoinRequest(${joinRequest.requestId}, 'REJECTED')">거절</button>
                </div>
            </div>
        </c:forEach>

        <c:forEach var="invite" items="${inviteList}">
            <c:set var="hasReceivedPending" value="${true}" />
            <div class="request-card is-pending" id="invite-${invite.INVITE_ID}">
                <span class="request-card-icon is-group" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 19c.7-3.3 3-5 6-5s5.3 1.7 6 5"/><path d="M14.5 15c2.6.2 4.3 1.5 5 4"/></svg>
                </span>
                <div class="request-info">
                    <div class="request-title-line">
                        <span class="request-type-badge">그룹 초대</span>
                        <h3><c:out value="${invite.WS_NAME}"/></h3>
                    </div>
                    <p><strong><c:out value="${invite.INVITER_NAME}"/></strong>님이 그룹에 초대했습니다.</p>
                    <div class="request-meta">
                        <span class="request-chip">그룹</span>
                        <span class="request-chip is-pending">대기중</span>
                        <span class="request-chip"><c:out value="${invite.SENT_AT}"/></span>
                    </div>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-accept" onclick="openAcceptProfile(${invite.INVITE_ID}, '<c:out value="${fn:escapeXml(invite.WS_NAME)}"/>', ${invite.WS_ID})">수락</button>
                    <button type="button" class="btn btn-reject" onclick="rejectInvite(${invite.INVITE_ID})">거절</button>
                </div>
            </div>
        </c:forEach>

        <c:if test="${not hasReceivedPending}">
            <p class="empty-msg">처리할 받은 요청이 없습니다.</p>
        </c:if>
    </section>

    <section class="request-panel" data-request-panel="sent">
        <h3 class="request-section-title">보낸 요청</h3>
        <c:set var="hasSent" value="${false}" />
        <c:forEach var="share" items="${sentShareRequests}">
            <c:if test="${share.shareStatus == 'PENDING' || share.shareStatus == 'ACCEPTED'}">
                <c:set var="hasSent" value="${true}" />
                <div class="request-card" id="sent-share-${share.shareId}">
                    <span class="request-card-icon <c:choose><c:when test="${share.contentType == 'PHOTO'}">is-photo</c:when><c:when test="${share.contentType == 'NOTE'}">is-note</c:when><c:when test="${share.contentType == 'CALENDAR'}">is-calendar</c:when></c:choose>" aria-hidden="true">
                        <c:choose>
                            <c:when test="${share.contentType == 'PHOTO'}">
                                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 4.5-4.5 3 3 2-2L19 17"/></svg>
                            </c:when>
                            <c:when test="${share.contentType == 'NOTE'}">
                                <svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4"/><path d="M9 11h6M9 15h6"/></svg>
                            </c:when>
                            <c:otherwise>
                                <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
                            </c:otherwise>
                        </c:choose>
                    </span>
                    <div class="request-info">
                        <div class="request-title-line">
                            <span class="request-type-badge">
                                <c:choose>
                                    <c:when test="${share.contentType == 'PHOTO'}">사진 공유</c:when>
                                    <c:when test="${share.contentType == 'NOTE'}">노트 공유</c:when>
                                    <c:when test="${share.contentType == 'CALENDAR'}">일정 공유</c:when>
                                    <c:otherwise>${share.contentType} 공유</c:otherwise>
                                </c:choose>
                            </span>
                            <h3><c:out value="${share.contentTitle}"/></h3>
                        </div>
                        <p>
                            <strong><c:out value="${share.targetName}"/></strong>에게
                            <c:choose>
                                <c:when test="${share.contentType == 'CALENDAR' && share.calendarAttendeeYn == 'Y' && share.permissionType == 'EDIT'}">참석자 추가와 편집 권한이 포함된 공유 요청을 보냈습니다.</c:when>
                                <c:when test="${share.contentType == 'CALENDAR' && share.calendarAttendeeYn == 'Y'}">참석자 추가와 공유 요청을 보냈습니다.</c:when>
                                <c:when test="${share.permissionType == 'EDIT'}">편집 권한이 포함된 공유 요청을 보냈습니다.</c:when>
                                <c:otherwise>공유 요청을 보냈습니다.</c:otherwise>
                            </c:choose>
                        </p>
                        <c:if test="${share.contentType == 'CALENDAR'}">
                            <div class="request-detail-lines">
                                <div class="request-detail-line"><span class="request-detail-label">일시</span><span class="request-detail-value"><c:out value="${empty share.calendarStartDt ? '일시 정보 없음' : share.calendarStartDt}"/><c:if test="${not empty share.calendarEndDt}"> - <c:out value="${share.calendarEndDt}"/></c:if></span></div>
                                <div class="request-detail-line"><span class="request-detail-label">장소</span><span class="request-detail-value"><c:choose><c:when test="${not empty share.calendarLocationText}"><c:out value="${share.calendarLocationText}"/></c:when><c:when test="${not empty share.calendarLocationAddress}"><c:out value="${share.calendarLocationAddress}"/></c:when><c:otherwise>장소 없음</c:otherwise></c:choose></span></div>
                            </div>
                        </c:if>
                        <div class="request-meta">
                            <c:if test="${share.calendarAttendeeYn == 'Y'}"><span class="request-chip is-attendee">참석자</span></c:if>
                            <span class="request-chip"><c:choose><c:when test="${share.targetType == 'USER'}">친구</c:when><c:when test="${share.targetType == 'WS'}">그룹</c:when><c:when test="${share.targetType == 'PROJ'}">프로젝트</c:when><c:otherwise><c:out value="${share.targetType}"/></c:otherwise></c:choose></span>
                            <c:if test="${share.permissionType == 'EDIT'}"><span class="request-chip is-edit">편집 가능</span></c:if>
                            <c:choose>
                                <c:when test="${share.shareStatus == 'PENDING'}"><span class="request-chip is-pending">대기중</span></c:when>
                                <c:when test="${share.shareStatus == 'ACCEPTED'}"><span class="request-chip is-accepted">공유됨</span></c:when>
                                <c:otherwise><span class="request-chip is-rejected"><c:out value="${share.shareStatus}"/></span></c:otherwise>
                            </c:choose>
                        </div>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-reject" onclick="releaseShareRequest(${share.shareId})">회수</button>
                    </div>
                </div>
            </c:if>
        </c:forEach>
        <c:if test="${not hasSent}">
            <p class="empty-msg">보낸 요청이 없습니다.</p>
        </c:if>
    </section>

    <section class="request-panel" data-request-panel="done">
        <h3 class="request-section-title">완료됨</h3>
        <c:set var="hasDone" value="${false}" />
        <c:forEach var="share" items="${receivedShareRequests}">
            <c:if test="${share.shareStatus != 'PENDING'}">
                <c:set var="hasDone" value="${true}" />
                <div class="request-card" id="done-share-${share.shareId}">
                    <span class="request-card-icon <c:choose><c:when test="${share.contentType == 'PHOTO'}">is-photo</c:when><c:when test="${share.contentType == 'NOTE'}">is-note</c:when><c:when test="${share.contentType == 'CALENDAR'}">is-calendar</c:when></c:choose>" aria-hidden="true">
                        <c:choose>
                            <c:when test="${share.contentType == 'PHOTO'}">
                                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 4.5-4.5 3 3 2-2L19 17"/></svg>
                            </c:when>
                            <c:when test="${share.contentType == 'NOTE'}">
                                <svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4"/><path d="M9 11h6M9 15h6"/></svg>
                            </c:when>
                            <c:otherwise>
                                <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
                            </c:otherwise>
                        </c:choose>
                    </span>
                    <div class="request-info">
                        <div class="request-title-line">
                            <span class="request-type-badge">
                                <c:choose>
                                    <c:when test="${share.contentType == 'PHOTO'}">사진 공유</c:when>
                                    <c:when test="${share.contentType == 'NOTE'}">노트 공유</c:when>
                                    <c:when test="${share.contentType == 'CALENDAR'}">일정 공유</c:when>
                                    <c:otherwise>${share.contentType} 공유</c:otherwise>
                                </c:choose>
                            </span>
                            <h3><c:out value="${share.contentTitle}"/></h3>
                        </div>
                        <p>
                            <c:choose>
                                <c:when test="${share.contentType == 'CALENDAR' && share.calendarAttendeeYn == 'Y' && share.permissionType == 'EDIT'}"><strong><c:out value="${share.requesterName}"/></strong>님의 참석자 추가와 편집 권한 공유 요청입니다.</c:when>
                                <c:when test="${share.contentType == 'CALENDAR' && share.calendarAttendeeYn == 'Y'}"><strong><c:out value="${share.requesterName}"/></strong>님의 참석자 추가와 공유 요청입니다.</c:when>
                                <c:when test="${share.permissionType == 'EDIT'}"><strong><c:out value="${share.requesterName}"/></strong>님의 편집 권한 공유 요청입니다.</c:when>
                                <c:otherwise><strong><c:out value="${share.requesterName}"/></strong>님의 공유 요청입니다.</c:otherwise>
                            </c:choose>
                        </p>
                        <c:if test="${share.contentType == 'CALENDAR'}">
                            <div class="request-detail-lines">
                                <div class="request-detail-line"><span class="request-detail-label">일시</span><span class="request-detail-value"><c:out value="${empty share.calendarStartDt ? '일시 정보 없음' : share.calendarStartDt}"/><c:if test="${not empty share.calendarEndDt}"> - <c:out value="${share.calendarEndDt}"/></c:if></span></div>
                                <div class="request-detail-line"><span class="request-detail-label">장소</span><span class="request-detail-value"><c:choose><c:when test="${not empty share.calendarLocationText}"><c:out value="${share.calendarLocationText}"/></c:when><c:when test="${not empty share.calendarLocationAddress}"><c:out value="${share.calendarLocationAddress}"/></c:when><c:otherwise>장소 없음</c:otherwise></c:choose></span></div>
                            </div>
                        </c:if>
                        <div class="request-meta">
                            <c:if test="${share.calendarAttendeeYn == 'Y'}"><span class="request-chip is-attendee">참석자</span></c:if>
                            <span class="request-chip"><c:choose><c:when test="${share.targetType == 'USER'}">친구</c:when><c:when test="${share.targetType == 'WS'}">그룹</c:when><c:when test="${share.targetType == 'PROJ'}">프로젝트</c:when><c:otherwise><c:out value="${share.targetType}"/></c:otherwise></c:choose></span>
                            <c:if test="${share.permissionType == 'EDIT'}"><span class="request-chip is-edit">편집 가능</span></c:if>
                            <c:choose>
                                <c:when test="${share.shareStatus == 'ACCEPTED'}"><span class="request-chip is-accepted">공유됨</span></c:when>
                                <c:when test="${share.shareStatus == 'REJECTED'}"><span class="request-chip is-rejected">거절됨</span></c:when>
                                <c:when test="${share.shareStatus == 'CANCELED'}"><span class="request-chip is-canceled">회수됨</span></c:when>
                                <c:otherwise><span class="request-chip"><c:out value="${share.shareStatus}"/></span></c:otherwise>
                            </c:choose>
                        </div>
                    </div>
                    <div class="btn-group">
                        <c:if test="${share.shareStatus == 'ACCEPTED'}">
                            <button type="button" class="btn btn-reject" onclick="releaseShareRequest(${share.shareId})">공유 해지</button>
                        </c:if>
                    </div>
                </div>
            </c:if>
        </c:forEach>

        <c:forEach var="invite" items="${invitationHistory}">
            <c:set var="hasDone" value="${true}" />
            <div class="request-card" id="done-invite-${invite.INVITE_ID}">
                <span class="request-card-icon is-group" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 19c.7-3.3 3-5 6-5s5.3 1.7 6 5"/><path d="M14.5 15c2.6.2 4.3 1.5 5 4"/></svg>
                </span>
                <div class="request-info">
                    <div class="request-title-line">
                        <span class="request-type-badge is-group">그룹 초대</span>
                        <h3><c:out value="${invite.WS_NAME}"/></h3>
                    </div>
                    <p><strong><c:out value="${invite.INVITER_NAME}"/></strong>님이 보낸 그룹 초대입니다.</p>
                    <div class="request-meta">
                        <span class="request-chip">그룹</span>
                        <c:choose>
                            <c:when test="${invite.STATUS == 'ACCEPTED'}"><span class="request-chip is-accepted">참여 완료</span></c:when>
                            <c:when test="${invite.STATUS == 'REJECTED'}"><span class="request-chip is-rejected">거절됨</span></c:when>
                            <c:otherwise><span class="request-chip"><c:out value="${invite.STATUS}"/></span></c:otherwise>
                        </c:choose>
                        <c:if test="${not empty invite.SENT_AT}"><span class="request-chip"><c:out value="${invite.SENT_AT}"/></span></c:if>
                    </div>
                </div>
            </div>
        </c:forEach>

        <c:if test="${not hasDone}">
            <p class="empty-msg">완료된 요청이 없습니다.</p>
        </c:if>
    </section>

    <section class="request-panel" data-request-panel="notifications">
        <h3 class="request-section-title">전체 알림</h3>
        <c:choose>
            <c:when test="${empty allNotices}">
                <p class="empty-msg">아직 도착한 알림이 없습니다.</p>
            </c:when>
            <c:otherwise>
                <div class="notification-list">
                    <c:forEach var="notice" items="${allNotices}">
                        <c:set var="noticeLink" value="${notice.linkUrl}" />
                        <c:if test="${empty noticeLink && notice.targetType == 'CALENDAR' && not empty notice.targetId}">
                            <c:set var="noticeLink" value="/calendar?eventId=${notice.targetId}" />
                        </c:if>
                        <c:choose>
                            <c:when test="${notice.alertType == 'NOTICE'}"><c:set var="noticeIconClass" value="is-notice"/></c:when>
                            <c:when test="${notice.targetType == 'CALENDAR' || notice.alertType == 'CALENDAR_ATTENDEE'}"><c:set var="noticeIconClass" value="is-calendar"/></c:when>
                            <c:otherwise><c:set var="noticeIconClass" value="is-activity"/></c:otherwise>
                        </c:choose>
                        <button type="button"
                                class="notification-card ${notice.isRead == 'N' ? 'is-unread' : ''}"
                                data-notification-id="${notice.alarmId}"
                                data-notification-link="<c:out value='${noticeLink}'/>"
                                data-alert-type="<c:out value='${notice.alertType}'/>"
                                data-target-id="<c:out value='${notice.targetId}'/>"
                                data-target-type="<c:out value='${notice.targetType}'/>"
                                data-notification-title="<c:out value='${notice.title}'/>"
                                aria-label="<c:out value='${notice.title}'/>">
                            <span class="notification-icon ${noticeIconClass}">
                                <c:choose>
                                    <c:when test="${notice.alertType == 'NOTICE'}">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M4 13.5v-3a2 2 0 0 1 2-2h2.5L16 5v14l-7.5-3.5H6a2 2 0 0 1-2-2Z"/>
                                            <path d="M8 15.5 9.5 20h3L11 16.7"/>
                                            <path d="M19 9a4 4 0 0 1 0 6"/>
                                        </svg>
                                    </c:when>
                                    <c:when test="${notice.targetType == 'CALENDAR' || notice.alertType == 'CALENDAR_ATTENDEE'}">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <rect x="3.5" y="5.5" width="17" height="15" rx="2.5"/>
                                            <path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17"/>
                                            <path d="M8 13h2M14 13h2M8 16.5h2M14 16.5h2"/>
                                        </svg>
                                    </c:when>
                                    <c:otherwise>
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/>
                                            <path d="M10 21h4"/>
                                        </svg>
                                    </c:otherwise>
                                </c:choose>
                            </span>
                            <span class="notification-main">
                                <span class="notification-head">
                                    <strong class="notification-title"><c:out value="${notice.title}"/></strong>
                                    <span class="notification-type">
                                        <c:choose>
                                            <c:when test="${notice.alertType == 'NOTICE'}">공지 알림</c:when>
                                            <c:when test="${notice.targetType == 'CALENDAR' || notice.alertType == 'CALENDAR_ATTENDEE'}">일정 알림</c:when>
                                            <c:otherwise>활동 알림</c:otherwise>
                                        </c:choose>
                                    </span>
                                </span>
                                <c:if test="${not empty notice.content}">
                                    <span class="notification-content" data-notification-content><c:out value="${notice.content}"/></span>
                                </c:if>
                                <span class="notification-meta">
                                    <span class="notification-read-state">${notice.isRead == 'N' ? '새 알림' : '읽음'}</span>
                                    <span>·</span>
                                    <span><fmt:formatDate value="${notice.regDt}" pattern="yyyy.MM.dd HH:mm"/></span>
                                </span>
                                <c:if test="${notice.alertType == 'GROUP_JOIN_APPROVED'}">
                                    <span class="notification-approved-actions">
                                        <span class="notification-approved-action">프로필 설정하고 참여</span>
                                        <span class="notification-abandon-action"
                                              role="button"
                                              tabindex="0"
                                              onclick="event.stopPropagation(); abandonApprovedJoinFromCard(this)"
                                              onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); event.stopPropagation(); abandonApprovedJoinFromCard(this); }">
                                            참여 포기
                                        </span>
                                    </span>
                                </c:if>
                            </span>
                        </button>
                    </c:forEach>
                </div>
            </c:otherwise>
        </c:choose>
    </section>
</div>

<script>
document.addEventListener('click', function(e) {
    const tab = e.target.closest('[data-request-tab]');
    if (!tab) return;
    const key = tab.getAttribute('data-request-tab');
    document.querySelectorAll('[data-request-tab]').forEach(el => el.classList.toggle('is-active', el === tab));
    document.querySelectorAll('[data-request-panel]').forEach(panel => {
        panel.classList.toggle('is-active', panel.getAttribute('data-request-panel') === key);
    });
});

document.addEventListener('click', async function(e) {
    const card = e.target.closest('[data-notification-id]');
    if (!card) return;

    const alarmId = card.getAttribute('data-notification-id');
    const link = card.getAttribute('data-notification-link') || '';
    const contextPath = '${pageContext.request.contextPath}';

    if (card.classList.contains('is-unread') && alarmId) {
        try {
            const body = new URLSearchParams();
            body.set('alarmId', alarmId);
            await fetch(contextPath + '/api/alarm/read', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
                body: body.toString()
            });
            card.classList.remove('is-unread');
            const state = card.querySelector('.notification-read-state');
            if (state) state.textContent = '읽음';
        } catch (error) {
            console.error('알림 읽음 처리 실패', error);
        }
    }

    const alertType = (card.getAttribute('data-alert-type') || '').toUpperCase();

    if (alertType === 'GROUP_JOIN_APPROVED') {
        const match = link.match(/[?&]approvedJoinRequestId=(\d+)/);
        const requestId = match ? match[1] : null;
        const wsId = card.getAttribute('data-target-id') || '';
        const title = card.getAttribute('data-notification-title') || '그룹';

        if (!requestId) {
            alert('승인된 참여 요청 정보를 확인할 수 없습니다.');
            return;
        }

        openApprovedJoinProfile(
            requestId,
            title.replace(/\s*참여 요청 승인\s*$/, ''),
            wsId
        );
        return;
    }

    if (link) {
        const target = /^(https?:)?\/\//i.test(link)
            ? link
            : (link.startsWith(contextPath) ? link : contextPath + (link.startsWith('/') ? link : '/' + link));
        window.location.href = target;
    }
});

document.querySelectorAll('[data-notification-content]').forEach(function(el) {
    const parser = document.createElement('textarea');
    parser.innerHTML = el.textContent || '';
    const holder = document.createElement('div');
    holder.innerHTML = parser.value;
    el.textContent = (holder.textContent || holder.innerText || '').trim();
});
</script>

<script>
function openAcceptProfile(inviteId, workspaceName, workspaceId) {
    if (typeof window.openJoinProfileModal !== "function") {
        alert("참여 프로필 화면을 불러오지 못했습니다. 페이지를 새로고침해주세요.");
        return;
    }

    return window.openJoinProfileModal({
        mode: "invite",
        invitationId: inviteId,
        workspaceName: workspaceName,
        workspaceId: workspaceId || null,
        onSuccess: function () {
            window.location.reload();
        }
    });
}

function openApprovedJoinProfile(requestId, workspaceName, workspaceId) {
    if (typeof window.openJoinProfileModal !== "function") {
        alert("참여 프로필 화면을 불러오지 못했습니다. 페이지를 새로고침해주세요.");
        return;
    }

    return window.openJoinProfileModal({
        mode: "approved",
        requestId: requestId,
        workspaceName: workspaceName || "그룹",
        workspaceId: workspaceId || null,
        onSuccess: function () {
            window.location.reload();
        }
    });
}

async function abandonApprovedJoinFromCard(button) {
    const card = button.closest('[data-notification-id]');
    if (!card) return;

    const link = card.getAttribute('data-notification-link') || '';
    const match = link.match(/[?&]approvedJoinRequestId=(\d+)/);
    const requestId = match ? match[1] : null;

    if (!requestId) {
        alert('승인된 참여 요청 정보를 확인할 수 없습니다.');
        return;
    }

    if (!confirm('그룹 참여를 포기할까요?\n승인된 참여 요청이 취소되며, 다시 참여하려면 새로 요청해야 합니다.')) {
        return;
    }

    button.disabled = true;

    try {
        const body = new URLSearchParams();
        body.set('requestId', requestId);

        const response = await fetch(
            '${pageContext.request.contextPath}/workspace/api/join-request/abandon',
            {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
                credentials: 'same-origin',
                body: body.toString()
            }
        );
        const data = await response.json();

        if (!response.ok || !data || data.success !== true) {
            throw new Error(data && data.status ? data.status : 'FAILED');
        }

        window.location.reload();
    } catch (error) {
        alert('참여 포기 처리 중 오류가 발생했습니다.');
        button.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get("inviteId");
    const approvedJoinRequestId = params.get("approvedJoinRequestId");

    if (approvedJoinRequestId) {
        const approvedCard = document.querySelector(
            '[data-notification-link*="approvedJoinRequestId='
            + approvedJoinRequestId + '"]'
        );
        const workspaceId = approvedCard
            ? approvedCard.getAttribute("data-target-id")
            : "";
        const title = approvedCard
            ? approvedCard.getAttribute("data-notification-title")
            : "그룹";

        openApprovedJoinProfile(
            approvedJoinRequestId,
            (title || "그룹").replace(/\s*참여 요청 승인\s*$/, ""),
            workspaceId
        );
        params.delete("approvedJoinRequestId");
    } else if (inviteId) {
        const inviteCard = document.getElementById("invite-" + inviteId);
        const acceptButton = inviteCard
            ? inviteCard.querySelector(".btn-accept")
            : null;

        if (acceptButton) acceptButton.click();
        params.delete("inviteId");
    } else {
        return;
    }

    const query = params.toString();
    const cleanUrl =
        window.location.pathname
        + (query ? "?" + query : "")
        + window.location.hash;

    window.history.replaceState({}, document.title, cleanUrl);
});

function respondJoinRequest(requestId, status) {
    if (!requestId) {
        alert('참여 요청 정보를 확인할 수 없습니다.');
        return;
    }

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
    } else if (!confirm('이 참여 요청을 승인하시겠습니까?')) {
        return;
    }

    const formData = new FormData();
    formData.append('requestId', requestId);
    formData.append('status', status);
    formData.append('rejectionReason', rejectionReason);

    $.ajax({
        url: '/workspace/api/join-request/respond',
        type: 'POST',
        processData: false,
        contentType: false,
        data: formData,
        success: function(res) {
            if (!res || !(res.success === true || res.success === 'true')) {
                alert((res && res.message) ? res.message : '참여 요청 처리 중 오류가 발생했습니다.');
                return;
            }

            $('#join-request-' + requestId).fadeOut(220, function() {
                $(this).remove();
                if ($('[data-request-panel="received"] .request-card.is-pending').length === 0) {
                    $('[data-request-panel="received"]').append(
                        '<p class="empty-msg">처리할 받은 요청이 없습니다.</p>'
                    );
                }
            });

            if (typeof window.refreshHeaderNotifications === 'function') {
                window.refreshHeaderNotifications();
            }
        },
        error: function(xhr) {
            const message = xhr.responseJSON && xhr.responseJSON.message
                ? xhr.responseJSON.message
                : '서버 통신 중 오류가 발생했습니다.';
            alert(message);
        }
    });
}

function respondShareRequest(shareId, status) {
    const message = status === 'ACCEPTED' ? '공유 요청을 수락하시겠습니까?' : '공유 요청을 거절하시겠습니까?';
    if (!confirm(message)) return;
    $.post('/share/api/requests/' + shareId + '/respond', { status: status }, function(res) {
        if (!res || !(res.success === true || res.success === 'true')) {
            alert((res && res.message) ? res.message : '처리 중 오류가 발생했습니다.');
            return;
        }
        location.reload();
    }).fail(function() {
        alert('서버 통신 중 오류가 발생했습니다.');
    });
}

function releaseShareRequest(shareId) {
    if (!confirm('공유를 해지하시겠습니까?')) return;
    $.post('/share/api/requests/' + shareId + '/release', function(res) {
        if (!res || !(res.success === true || res.success === 'true')) {
            alert((res && res.message) ? res.message : '처리 중 오류가 발생했습니다.');
            return;
        }
        location.reload();
    }).fail(function() {
        alert('서버 통신 중 오류가 발생했습니다.');
    });
}

function rejectInvite(inviteId) {
    if (!confirm('초대를 거절하시겠습니까?')) return;
    const formData = new FormData();
    formData.append('inviteId', inviteId);
    formData.append('status', 'REJECTED');

    $.ajax({
        url: '/workspace/api/invitation/process',
        type: 'POST',
        processData: false,
        contentType: false,
        data: formData,
        success: function(res) {
            if (!(res.success === true || res.success === 'true')) {
                alert('처리 중 오류가 발생했습니다.');
                return;
            }
            $('#invite-' + inviteId).fadeOut(300, function() {
                $(this).remove();
                if ($('.invite-card').length === 0) {
                    $('.container').append('<p class="empty-msg">새로운 초대가 없습니다.</p>');
                }
            });
            if (typeof updateInviteBadge === 'function') updateInviteBadge();
        },
        error: function() {
            alert('서버 통신 중 오류가 발생했습니다.');
        }
    });
}
</script>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
