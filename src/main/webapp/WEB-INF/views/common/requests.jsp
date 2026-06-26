<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
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

    </style>
</head>
<body
    data-account-name="<c:out value='${accountDisplayName}'/>"
    data-account-email="<c:out value='${accountEmail}'/>">
<jsp:include page="../common/header.jsp" />

<div class="container request-page">
    <div class="request-summary">
        <div>
            <h2>요청함</h2>
            <p class="request-subtitle">그룹 초대와 사진/노트 공유 요청을 한 곳에서 확인합니다.</p>
        </div>
        <div class="request-counts">
            <span class="request-chip is-pending">전체 대기 ${totalPendingRequestCount}</span>
            <span class="request-chip">초대 ${inviteRequestCount}</span>
            <span class="request-chip">공유 ${shareRequestCount}</span>
        </div>
    </div>

    <div class="request-tabs" role="tablist" aria-label="요청함 탭">
        <button type="button" class="request-tab is-active" data-request-tab="received">받은 요청</button>
        <button type="button" class="request-tab" data-request-tab="sent">보낸 요청</button>
        <button type="button" class="request-tab" data-request-tab="done">완료됨</button>
    </div>

    <section class="request-panel is-active" data-request-panel="received">
        <h3 class="request-section-title">받은 요청</h3>

        <c:set var="hasReceivedPending" value="${false}" />
        <c:forEach var="share" items="${receivedShareRequests}">
            <c:if test="${share.shareStatus == 'PENDING'}">
                <c:set var="hasReceivedPending" value="${true}" />
                <div class="request-card is-pending" id="share-request-${share.shareId}">
                    <div class="request-info">
                        <div class="request-title-line">
                            <span class="request-type-badge">
                                <c:choose>
                                    <c:when test="${share.contentType == 'PHOTO'}">사진 공유</c:when>
                                    <c:when test="${share.contentType == 'NOTE'}">노트 공유</c:when>
                                    <c:otherwise>${share.contentType} 공유</c:otherwise>
                                </c:choose>
                            </span>
                            <h3><c:out value="${share.contentTitle}"/></h3>
                        </div>
                        <p><strong><c:out value="${share.requesterName}"/></strong>님이 <strong><c:out value="${share.targetName}"/></strong>에게 공유 요청을 보냈습니다.</p>
                        <div class="request-meta">
                            <span class="request-chip"><c:out value="${share.targetType}"/></span>
                            <span class="request-chip">${share.permissionType == 'EDIT' ? '편집 가능' : '보기'}</span>
                            <span class="request-chip is-pending">대기중</span>
                        </div>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-accept" onclick="respondShareRequest(${share.shareId}, 'ACCEPTED')">수락</button>
                        <button type="button" class="btn btn-reject" onclick="respondShareRequest(${share.shareId}, 'REJECTED')">거절</button>
                    </div>
                </div>
            </c:if>
        </c:forEach>

        <c:forEach var="invite" items="${inviteList}">
            <c:set var="hasReceivedPending" value="${true}" />
            <div class="request-card is-pending" id="invite-${invite.INVITE_ID}">
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
                    <button type="button" class="btn btn-accept" onclick="openAcceptProfile(${invite.INVITE_ID}, '${invite.WS_NAME}')">수락</button>
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
                    <div class="request-info">
                        <div class="request-title-line">
                            <span class="request-type-badge">
                                <c:choose>
                                    <c:when test="${share.contentType == 'PHOTO'}">사진 공유</c:when>
                                    <c:when test="${share.contentType == 'NOTE'}">노트 공유</c:when>
                                    <c:otherwise>${share.contentType} 공유</c:otherwise>
                                </c:choose>
                            </span>
                            <h3><c:out value="${share.contentTitle}"/></h3>
                        </div>
                        <p><strong><c:out value="${share.targetName}"/></strong>에게 공유 요청을 보냈습니다.</p>
                        <div class="request-meta">
                            <span class="request-chip"><c:out value="${share.targetType}"/></span>
                            <span class="request-chip">${share.permissionType == 'EDIT' ? '편집 가능' : '보기'}</span>
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
                    <div class="request-info">
                        <div class="request-title-line">
                            <span class="request-type-badge">
                                <c:choose>
                                    <c:when test="${share.contentType == 'PHOTO'}">사진 공유</c:when>
                                    <c:when test="${share.contentType == 'NOTE'}">노트 공유</c:when>
                                    <c:otherwise>${share.contentType} 공유</c:otherwise>
                                </c:choose>
                            </span>
                            <h3><c:out value="${share.contentTitle}"/></h3>
                        </div>
                        <p><strong><c:out value="${share.requesterName}"/></strong>님의 공유 요청입니다.</p>
                        <div class="request-meta">
                            <span class="request-chip"><c:out value="${share.targetType}"/></span>
                            <span class="request-chip">${share.permissionType == 'EDIT' ? '편집 가능' : '보기'}</span>
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
        <c:if test="${not hasDone}">
            <p class="empty-msg">완료된 요청이 없습니다.</p>
        </c:if>
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
</script>

<div id="profileOverlay" class="profile-overlay" onclick="closeAcceptProfile()"></div>
<div id="profileModal" class="profile-modal" role="dialog" aria-modal="true">
    <div class="profile-modal-head">
        <div>
            <small>참여 전 프로필 설정</small>
            <h3 id="profileModalTitle">그룹 프로필 선택</h3>
        </div>
        <button type="button" class="profile-close" onclick="closeAcceptProfile()">&times;</button>
    </div>

    <div class="profile-choice">
        <label>
            <input type="radio" name="inviteProfileMode" value="Y" checked>
            <span>
                <strong>계정 이름과 기본 이미지 사용</strong>
                <span>이름과 이미지만 계정 정보를 사용합니다.</span>
            </span>
        </label>
        <label>
            <input type="radio" name="inviteProfileMode" value="N">
            <span>
                <strong>전용 프로필 만들기</strong>
                <span>이 그룹에서만 사용할 이름과 이미지를 설정합니다.</span>
            </span>
        </label>
    </div>

    <div class="profile-image-editor">
        <div id="inviteProfileViewport" class="profile-image-viewport">
            <div id="inviteProfilePlaceholder" class="profile-image-placeholder"></div>
            <img id="inviteProfileCropImage" hidden alt="">
        </div>
        <div class="profile-image-tools">
            <strong>프로필 이미지</strong>
            <label for="inviteProfileImageInput" class="profile-image-button">이미지 선택</label>
            <input type="file" id="inviteProfileImageInput" accept="image/*" hidden>
            <small>전용 프로필 선택 시 드래그와 확대 기능을 사용할 수 있습니다.</small>
            <input type="range" id="inviteProfileZoom" min="1" max="4" step="0.05" value="1">
        </div>
    </div>

    <div id="inviteProfileFields" class="profile-fields">
        <div class="profile-field">
            <label for="inviteDisplayName">표시 이름 *</label>
            <input type="text" id="inviteDisplayName" maxlength="50"
                   value="<c:out value='${accountDisplayName}'/>">
        </div>
        <div class="profile-field">
            <label for="invitePositionName">직책 또는 담당 분야</label>
            <input type="text" id="invitePositionName" maxlength="50" placeholder="예: 디자이너">
        </div>
        <div class="profile-field full">
            <label for="inviteContactEmail">그룹 이메일 *</label>
            <input type="text" id="inviteContactEmail" maxlength="100"
                   value="<c:out value='${accountEmail}'/>">
        </div>
        <div class="profile-field full">
            <label for="invitePhoneNumber">연락처 (선택)</label>
            <input type="tel" id="invitePhoneNumber" maxlength="30" placeholder="예: 010-0000-0000">
        </div>
        <div class="profile-field full">
            <label class="profile-check">
                <input type="checkbox" id="inviteShowPhone">
                다른 그룹 멤버에게 연락처 공개
            </label>
        </div>
    </div>

    <div class="profile-actions">
        <button type="button" class="btn" onclick="closeAcceptProfile()">취소</button>
        <button type="button" id="btnFinalAccept" class="btn btn-accept" onclick="acceptInviteWithProfile()">참여하기</button>
    </div>
</div>

<script>

function createProfileCropper(config) {
    const fileInput = document.getElementById(config.fileInputId);
    const viewport = document.getElementById(config.viewportId);
    const image = document.getElementById(config.imageId);
    const placeholder = document.getElementById(config.placeholderId);
    const zoom = document.getElementById(config.zoomId);

    const state = {
        localFile: null,
        localUrl: '',
        externalSrc: '',
        mode: 'custom',
        fallbackText: '?',
        x: 0,
        y: 0,
        scale: 1,
        baseWidth: 0,
        baseHeight: 0,
        dragging: false,
        startPointerX: 0,
        startPointerY: 0,
        startX: 0,
        startY: 0
    };

    function revokeLocalUrl() {
        if (state.localUrl) {
            URL.revokeObjectURL(state.localUrl);
            state.localUrl = '';
        }
    }

    function calculateBaseSize() {
        const viewSize = viewport.clientWidth || 112;
        if (!image.naturalWidth || !image.naturalHeight) return;

        const imageRatio = image.naturalWidth / image.naturalHeight;

        // 확대값 1에서는 원형 영역을 빈 공간 없이 정확히 채우는 cover 기준.
        // 가로 사진은 높이를, 세로 사진은 너비를 원형 크기에 맞춘다.
        if (imageRatio >= 1) {
            state.baseHeight = viewSize;
            state.baseWidth = viewSize * imageRatio;
        } else {
            state.baseWidth = viewSize;
            state.baseHeight = viewSize / imageRatio;
        }

        image.style.width = state.baseWidth + 'px';
        image.style.height = state.baseHeight + 'px';
        image.style.minWidth = '0';
        image.style.minHeight = '0';
        image.style.maxWidth = 'none';
        image.style.maxHeight = 'none';
        image.style.objectFit = 'cover';
    }

    function render() {
        if (image.hidden) return;
        image.style.transform =
            'translate(-50%, -50%) translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')';
    }

    function showPlaceholder() {
        image.hidden = true;
        placeholder.hidden = false;
        placeholder.textContent = state.fallbackText || '?';
        viewport.classList.remove('has-image');
        viewport.style.cursor = 'default';
    }

    function showImage(src, resetPosition) {
        if (!src) {
            showPlaceholder();
            return;
        }

        if (resetPosition) {
            state.x = 0;
            state.y = 0;
            state.scale = 1;
            if (zoom) zoom.value = '1';
        }

        const applyReady = function() {
            calculateBaseSize();
            image.hidden = false;
            placeholder.hidden = true;
            viewport.classList.add('has-image');
            viewport.style.cursor = state.mode === 'custom' ? 'grab' : 'default';
            requestAnimationFrame(render);
        };

        image.onload = applyReady;
        image.src = src;

        if (image.complete && image.naturalWidth) {
            applyReady();
        }
    }

    function refreshDisplay() {
        if (state.mode === 'account') {
            showPlaceholder();
            return;
        }
        if (state.localUrl) {
            showImage(state.localUrl, false);
            return;
        }
        if (state.externalSrc) {
            showImage(state.externalSrc, false);
            return;
        }
        showPlaceholder();
    }

    function setMode(mode, fallbackText) {
        state.mode = mode === 'account' ? 'account' : 'custom';
        if (fallbackText !== undefined) state.fallbackText = fallbackText || '?';
        if (fileInput) fileInput.disabled = state.mode === 'account';
        if (zoom) zoom.disabled = state.mode === 'account';
        refreshDisplay();
    }

    function setFallbackText(text) {
        state.fallbackText = text || '?';
        if (state.mode === 'account' || (!state.localUrl && !state.externalSrc)) {
            showPlaceholder();
        }
    }

    function setExistingImage(src) {
        state.externalSrc = src || '';
        if (!state.localUrl) refreshDisplay();
    }

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;

            revokeLocalUrl();
            state.localFile = file;
            state.localUrl = URL.createObjectURL(file);
            state.x = 0;
            state.y = 0;
            state.scale = 1;
            if (zoom) zoom.value = '1';
            showImage(state.localUrl, true);
        });
    }

    if (zoom) {
        zoom.addEventListener('input', function() {
            state.scale = Number(zoom.value || '1');
            render();
        });
    }

    function onPointerMove(e) {
        if (!state.dragging || state.mode !== 'custom') return;
        state.x = state.startX + (e.clientX - state.startPointerX);
        state.y = state.startY + (e.clientY - state.startPointerY);
        render();
    }

    function endDrag() {
        state.dragging = false;
        if (!image.hidden && state.mode === 'custom') viewport.style.cursor = 'grab';
    }

    viewport.addEventListener('pointerdown', function(e) {
        if (state.mode !== 'custom' || image.hidden) return;
        e.preventDefault();
        state.dragging = true;
        state.startPointerX = e.clientX;
        state.startPointerY = e.clientY;
        state.startX = state.x;
        state.startY = state.y;
        viewport.style.cursor = 'grabbing';
        if (viewport.setPointerCapture) {
            try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
        }
    });

    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endDrag);

    async function getBlob() {
        if (image.hidden || !image.naturalWidth) return null;

        const outputSize = 512;
        const viewSize = viewport.clientWidth || 112;
        const drawWidth = state.baseWidth * state.scale;
        const drawHeight = state.baseHeight * state.scale;
        const drawX = (viewSize - drawWidth) / 2 + state.x;
        const drawY = (viewSize - drawHeight) / 2 + state.y;

        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        const ratio = outputSize / viewSize;
        ctx.scale(ratio, ratio);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        return await new Promise(function(resolve) {
            canvas.toBlob(resolve, 'image/jpeg', 0.92);
        });
    }

    return {
        getBlob: getBlob,
        setMode: setMode,
        setFallbackText: setFallbackText,
        setExistingImage: setExistingImage
    };
}

let selectedInviteId = null;
const accountName = document.body.dataset.accountName || '';
const accountEmail = document.body.dataset.accountEmail || '';
const inviteCropper = createProfileCropper({
    fileInputId: 'inviteProfileImageInput',
    viewportId: 'inviteProfileViewport',
    imageId: 'inviteProfileCropImage',
    placeholderId: 'inviteProfilePlaceholder',
    zoomId: 'inviteProfileZoom'
});

document.getElementById('inviteProfilePlaceholder').textContent =
    accountName ? accountName.substring(0, 1) : '?';
document.getElementById('inviteDisplayName').value = accountName;
document.getElementById('inviteContactEmail').value = accountEmail;

function syncInviteProfileMode() {
    const useAccount = $('input[name="inviteProfileMode"]:checked').val() === 'Y';
    const avatarText = accountName ? accountName.substring(0, 1) : '?';

    $('#inviteDisplayName').prop('readonly', useAccount);
    document.querySelector('.profile-image-editor').style.opacity = useAccount ? '.55' : '1';
    inviteCropper.setMode(useAccount ? 'account' : 'custom', avatarText);

    if (useAccount) {
        $('#inviteDisplayName').val(accountName);
    } else if (!$('#inviteDisplayName').val().trim()) {
        $('#inviteDisplayName').val(accountName);
    }
}

$('input[name="inviteProfileMode"]').on('change', syncInviteProfileMode);
$('#inviteDisplayName').on('input', function() {
    const value = $(this).val().trim();
    inviteCropper.setFallbackText(value ? value.substring(0, 1) : (accountName ? accountName.substring(0, 1) : '?'));
});
syncInviteProfileMode();

function openAcceptProfile(inviteId, wsName) {
    selectedInviteId = inviteId;
    document.getElementById('profileModalTitle').textContent = wsName + ' 참여 프로필';
    document.getElementById('profileOverlay').style.display = 'block';
    document.getElementById('profileModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAcceptProfile() {
    selectedInviteId = null;
    document.getElementById('profileOverlay').style.display = 'none';
    document.getElementById('profileModal').style.display = 'none';
    document.body.style.overflow = '';
}

async function acceptInviteWithProfile() {
    if (!selectedInviteId) return;

    const useAccount = $('input[name="inviteProfileMode"]:checked').val();
    const displayName = $('#inviteDisplayName').val().trim();
    const contactEmail = $('#inviteContactEmail').val().trim();

    if (!contactEmail) {
        alert('그룹 이메일을 입력해주세요.');
        $('#inviteContactEmail').focus();
        return;
    }
    if (useAccount === 'N' && !displayName) {
        alert('그룹 표시 이름을 입력해주세요.');
        $('#inviteDisplayName').focus();
        return;
    }

    const formData = new FormData();
    formData.append('inviteId', selectedInviteId);
    formData.append('status', 'ACCEPTED');
    formData.append('useAccountProfile', useAccount);
    formData.append('displayName', displayName);
    formData.append('contactEmail', contactEmail);
    formData.append('positionName', $('#invitePositionName').val().trim());
    formData.append('phoneNumber', $('#invitePhoneNumber').val().trim());
    formData.append('showPhone', $('#inviteShowPhone').is(':checked') ? 'Y' : 'N');

    if (useAccount === 'N') {
        const blob = await inviteCropper.getBlob();
        if (blob) formData.append('profileImage', blob, 'workspace_profile.jpg');
    }

    const button = document.getElementById('btnFinalAccept');
    button.disabled = true;
    button.textContent = '참여 중...';

    $.ajax({
        url: '/workspace/api/invitation/process',
        type: 'POST',
        processData: false,
        contentType: false,
        data: formData,
        success: function(res) {
            if (res.success === true || res.success === 'true') {
                location.href = res.redirectUrl || ('/workspace/main?wsId=' + res.wsId);
                return;
            }
            alert(res.message === 'DISPLAY_NAME_REQUIRED'
                ? '그룹 표시 이름을 입력해주세요.'
                : '초대 수락 중 오류가 발생했습니다.');
        },
        error: function() {
            alert('서버 통신 중 오류가 발생했습니다.');
        },
        complete: function() {
            button.disabled = false;
            button.textContent = '참여하기';
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
