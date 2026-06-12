<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>새 워크스페이스 생성 - MOYO</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<style>
        * { box-sizing: border-box; }
        body { background: #f7f9fc; color: #111827; }
        body:has(.create-wrap) { overflow-x: hidden; }
        .create-wrap {
            width: min(700px, calc(100% - 32px));
            margin: 22px auto 24px;
            font-family: 'Pretendard', sans-serif;
        }
        .create-card {
            padding: 24px 26px 18px;
            border: 1px solid #e5ebf2;
            border-radius: 22px;
            background: #fff;
            box-shadow: 0 14px 34px rgba(15,23,42,.06);
        }
        .create-step-label {
            color: #4a90e2;
            font-size: 12px;
            font-weight: 800;
        }
        .create-card h2 { margin: 4px 0 7px; font-size: 24px; }
        .create-desc { margin: 0 0 18px; color: #7b8798; font-size: 12px; }
        .create-panel[hidden] { display: none !important; }
        .form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
        .form-group { min-width: 0; margin-bottom: 14px; }
        .form-group.full { grid-column: 1/-1; }
        .form-group > label, .field-title {
            display: block; margin-bottom: 7px; color: #374151;
            font-size: 12px; font-weight: 800;
        }
        input[type="text"], input[type="tel"], textarea, select {
            width: 100%;
            border: 1px solid #dbe4ee;
            border-radius: 11px;
            padding: 9px 12px;
            font: 12px inherit;
            outline: none;
            background: #fff;
        }
        input:focus, textarea:focus, select:focus {
            border-color: #72a8e8;
            box-shadow: 0 0 0 3px rgba(74,144,226,.1);
        }
        textarea {
            resize: none;
            height: 78px;
            min-height: 78px;
            max-height: 78px;
            line-height: 1.55;
        }
        select.form-control {
            height: 38px;
            appearance: none;
            -webkit-appearance: none;
            padding-right: 38px;
            color: #334155;
            font-weight: 700;
            cursor: pointer;
            background-image:
                linear-gradient(45deg, transparent 50%, #94a3b8 50%),
                linear-gradient(135deg, #94a3b8 50%, transparent 50%);
            background-position:
                calc(100% - 20px) 50%,
                calc(100% - 14px) 50%;
            background-size: 6px 6px, 6px 6px;
            background-repeat: no-repeat;
        }
        .upload-box {
            display:flex;
            align-items:center;
            gap:14px;
            width:100%;
            padding:13px 14px;
            border:1px solid #e3eaf2;
            border-radius:14px;
            background:#fbfdff;
        }
        #preview {
            width: 66px;
            height: 66px;
            display:none;
            object-fit:cover;
            border:1px solid #dbe4ee;
            border-radius:16px;
            background:#fff;
            flex:0 0 66px;
        }
        .file-btn {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            height:36px;
            padding:0 13px;
            border:1px solid #dbe4ee;
            border-radius:10px;
            background:#fff;
            color:#334155;
            cursor:pointer;
            font-size:12px;
            font-weight:800;
            white-space:nowrap;
        }
        .file-btn:hover {
            border-color:#9ec5f3;
            color:#2563eb;
            background:#f8fbff;
        }
        .upload-guide {
            margin:0;
            color:#94a3b8;
            font-size:11px;
            line-height:1.45;
        }
        .upload-controls {
            display:flex;
            flex-direction:column;
            align-items:flex-start;
            gap:6px;
            min-width:0;
        }

        .workspace-image-editor {
            display:grid;
            grid-template-columns: 96px minmax(0, 1fr);
            gap:14px;
            align-items:center;
            width:100%;
            padding:12px 14px;
            border:1px solid #e3eaf2;
            border-radius:16px;
            background:#fbfdff;
        }
        .workspace-image-viewport {
            position:relative;
            width:96px;
            height:96px;
            overflow:hidden;
            border-radius:18px;
            border:1px solid #dbe6f1;
            background:linear-gradient(135deg,#eef6ff,#f4fffc);
            touch-action:none;
            cursor:grab;
        }
        .workspace-image-viewport:active { cursor:grabbing; }
        .workspace-image-viewport img {
            position:absolute;
            left:50%;
            top:50%;
            min-width:100%;
            min-height:100%;
            width:auto;
            height:auto;
            max-width:none;
            user-select:none;
            pointer-events:none;
            transform-origin:center;
        }
        .workspace-image-placeholder {
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#4a90e2;
            font-size:32px;
            font-weight:900;
        }
        .workspace-image-tools {
            min-width:0;
            display:flex;
            flex-direction:column;
            align-items:flex-start;
            gap:7px;
        }
        .workspace-image-tools input[type="range"] {
            width:100%;
            accent-color:#4A90E2;
        }
        .workspace-image-help {
            margin:0;
            color:#8491a3;
            font-size:10px;
            line-height:1.35;
        }
        .workspace-image-actions {
            display:flex;
            align-items:center;
            gap:7px;
        }

        .profile-choice {
            display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:20px;
        }
        .profile-choice label {
            display:flex; gap:10px; align-items:flex-start; padding:15px;
            border:1px solid #dfe7ef; border-radius:14px; cursor:pointer; background:#fff;
        }
        .profile-choice label:has(input:checked) {
            border-color:#6aa5ea; background:#f5f9ff; box-shadow:0 0 0 3px rgba(74,144,226,.08);
        }
        .profile-choice strong { display:block; margin-bottom:4px; font-size:13px; }
        .profile-choice small { color:#7b8798; font-size:11px; line-height:1.45; }
        .profile-choice input { margin-top:2px; accent-color:#4a90e2; }
        .profile-fields.is-disabled { opacity:.48; pointer-events:none; }
        .check-row { display:flex; align-items:center; gap:8px; font-size:12px; color:#475569; }
        .check-row input { accent-color:#4a90e2; }
        .workspace-link-list { display:flex; flex-direction:column; gap:9px; }
        .workspace-link-row {
            display:grid;
            grid-template-columns: 150px minmax(0,1fr) 34px;
            gap:7px;
            align-items:center;
        }
        .workspace-link-remove {
            width:34px;
            height:34px;
            border:1px solid #e0e7ef;
            border-radius:9px;
            background:#fff;
            color:#94a3b8;
            cursor:pointer;
        }
        .workspace-link-add {
            display:inline-flex;
            align-items:center;
            width:max-content;
            margin-top:9px;
            border:0;
            background:transparent;
            color:#3f83d5;
            font:700 12px inherit;
            cursor:pointer;
        }
        .workspace-link-help { margin:7px 0 0; color:#94a3b8; font-size:11px; }

        .create-actions {
            display:flex; justify-content:flex-end; gap:9px; margin-top:14px;
            padding-top:14px; border-top:1px solid #eef2f6;
        }
        .create-btn {
            min-height:38px; padding:0 17px; border-radius:11px;
            border:1px solid #dbe4ee; background:#fff; color:#475569;
            font:700 13px inherit; cursor:pointer;
        }
        .create-btn.primary {
            border:0; color:#fff;
            background:linear-gradient(135deg,#4A90E2,#39CDB5);
            box-shadow:0 8px 18px rgba(57,205,181,.2);
        }

        @media (min-width: 641px) and (max-height: 820px) {
            .create-wrap { margin-top: 18px; margin-bottom: 18px; }
            .create-card { padding: 22px 26px 16px; }
            .create-card h2 { font-size: 23px; }
            .create-desc { margin-bottom: 15px; }
            .form-group { margin-bottom: 12px; }
            textarea { height: 72px; min-height: 72px; max-height: 72px; }
            .workspace-image-editor { grid-template-columns: 88px minmax(0, 1fr); padding: 11px 14px; }
            .workspace-image-viewport { width:88px; height:88px; border-radius:16px; }
            .workspace-image-help { margin-bottom: -1px; }
            .create-actions { margin-top: 12px; padding-top: 12px; }
        }

        @media(max-width:640px) {
            .create-card { padding:22px 18px 18px; }
            .form-grid,.profile-choice { grid-template-columns:1fr; }
            .workspace-image-editor { grid-template-columns:1fr; }
            .workspace-image-viewport { width:100%; aspect-ratio:1 / 1; height:auto; max-height:220px; }
            .form-group.full { grid-column:auto; }
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
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<div class="create-wrap"
     data-account-name="<c:out value='${accountDisplayName}'/>"
     data-account-email="<c:out value='${accountEmail}'/>">
    <div class="create-card">
        <section id="workspaceStep" class="create-panel">
            <span class="create-step-label">1 / 2</span>
            <h2>새 워크스페이스 만들기</h2>
            <p class="create-desc">워크스페이스 정보를 입력한 다음, 이 공간에서 사용할 프로필을 선택합니다.</p>

            <div class="form-group">
                <label for="wsName">워크스페이스 이름 *</label>
                <input type="text" id="wsName" maxlength="60" placeholder="워크스페이스 이름을 입력하세요">
            </div>
            <div class="form-group">
                <label for="wsDesc">워크스페이스 소개</label>
                <textarea id="wsDesc" rows="3" maxlength="300" placeholder="워크스페이스를 소개해주세요"></textarea>
            </div>
            <div class="form-group">
                <label for="wsType">워크스페이스 유형 *</label>
                <select id="wsType" class="form-control">
                    <option value="ORGANIZATION">회사 · 조직</option>
                    <option value="TEAM">팀 · 프로젝트</option>
                    <option value="STUDY">스터디 · 연구</option>
                    <option value="COMMUNITY" selected>모임 · 커뮤니티</option>
                    <option value="CLUB">동아리 · 취미</option>
                    <option value="LIFE">가족 · 생활</option>
                    <option value="ETC">기타</option>
                </select>
            </div>

            <div class="form-group">
                <span class="field-title">외부 링크</span>
                <div id="workspaceLinkList" class="workspace-link-list">
                    <div class="workspace-link-row">
                        <input type="text" class="workspace-link-name" maxlength="50" placeholder="링크 이름">
                        <input type="text" class="workspace-link-url" maxlength="500" placeholder="https://...">
                        <button type="button" class="workspace-link-remove" onclick="removeWorkspaceLink(this)" aria-label="링크 삭제">×</button>
                    </div>
                </div>
                <button type="button" class="workspace-link-add" onclick="addWorkspaceLink()">+ 링크 추가</button>
                <p class="workspace-link-help">홈페이지, Git, Notion 등 원하는 이름과 주소를 자유롭게 등록할 수 있습니다.</p>
            </div>
            <div class="form-group">
                <span class="field-title">대표 이미지</span>
                <div class="workspace-image-editor">
                    <div id="workspaceImageViewport" class="workspace-image-viewport">
                        <div id="workspaceImagePlaceholder" class="workspace-image-placeholder">M</div>
                        <img id="workspaceCropImage" hidden alt="대표 이미지 미리보기">
                    </div>
                    <div class="workspace-image-tools">
                        <div class="workspace-image-actions">
                            <label for="wsImage" class="file-btn">이미지 선택</label>
                            <input type="file" id="wsImage" accept="image/*" hidden>
                        </div>
                        <p class="workspace-image-help">이미지를 등록한 뒤 미리보기 영역을 드래그해서 위치를 맞추고, 아래 조절바로 확대/축소할 수 있습니다.</p>
                        <input type="range" id="workspaceImageZoom" min="1" max="4" step="0.05" value="1" disabled>
                    </div>
                </div>
            </div>
            <div class="create-actions">
                <button type="button" id="btnNext" class="create-btn primary">다음</button>
            </div>
        </section>

        <section id="profileStep" class="create-panel" hidden>
            <span class="create-step-label">2 / 2</span>
            <h2>생성자 프로필 선택</h2>
            <p class="create-desc">이름과 이미지는 계정 정보를 사용할 수 있고, 이메일·직책·연락처는 워크스페이스에 맞게 설정할 수 있습니다.</p>

            <div class="profile-choice">
                <label>
                    <input type="radio" name="profileMode" value="Y" checked>
                    <span>
                        <strong>계정 이름과 기본 이미지 사용</strong>
                        <small>표시 이름과 이미지만 계정 정보를 사용합니다.</small>
                    </span>
                </label>
                <label>
                    <input type="radio" name="profileMode" value="N">
                    <span>
                        <strong>워크스페이스 전용 프로필 만들기</strong>
                        <small>표시 이름과 프로필 이미지도 이 공간에 맞게 설정합니다.</small>
                    </span>
                </label>
            </div>

            <div class="profile-image-editor">
                <div id="createProfileViewport" class="profile-image-viewport">
                    <div id="createProfilePlaceholder" class="profile-image-placeholder"></div>
                    <img id="createProfileCropImage" hidden alt="">
                </div>
                <div class="profile-image-tools">
                    <strong>프로필 이미지</strong>
                    <label for="createProfileImageInput" class="profile-image-button">이미지 선택</label>
                    <input type="file" id="createProfileImageInput" accept="image/*" hidden>
                    <small>전용 프로필 선택 시 이미지를 드래그해 위치를 맞추고 확대할 수 있습니다.</small>
                    <input type="range" id="createProfileZoom" min="1" max="4" step="0.05" value="1">
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="profileDisplayName">표시 이름 *</label>
                    <input type="text" id="profileDisplayName" maxlength="50"
                           value="<c:out value='${accountDisplayName}'/>">
                </div>
                <div class="form-group">
                    <label for="profilePositionName">직책 또는 담당 분야</label>
                    <input type="text" id="profilePositionName" maxlength="50" placeholder="예: 백엔드 개발자">
                </div>
                <div class="form-group full">
                    <label for="profileContactEmail">워크스페이스 이메일 *</label>
                    <input type="text" id="profileContactEmail" maxlength="100"
                           value="<c:out value='${accountEmail}'/>">
                </div>
                <div class="form-group full">
                    <label for="profilePhoneNumber">연락처 <small>(선택)</small></label>
                    <input type="tel" id="profilePhoneNumber" maxlength="30" placeholder="예: 010-0000-0000">
                </div>
                <div class="form-group full">
                    <label class="check-row">
                        <input type="checkbox" id="profileShowPhone">
                        다른 워크스페이스 멤버에게 연락처 공개
                    </label>
                </div>
            </div>

            <div class="create-actions">
                <button type="button" id="btnBack" class="create-btn">이전</button>
                <button type="button" id="btnCreate" class="create-btn primary">워크스페이스 생성</button>
            </div>
        </section>
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
        const viewWidth = viewport.clientWidth || 112;
        const viewHeight = viewport.clientHeight || viewWidth;
        if (!image.naturalWidth || !image.naturalHeight) return;

        const imageRatio = image.naturalWidth / image.naturalHeight;
        const viewRatio = viewWidth / viewHeight;

        // 확대값 1에서는 미리보기 영역을 빈 공간 없이 정확히 채우는 cover 기준.
        if (imageRatio >= viewRatio) {
            state.baseHeight = viewHeight;
            state.baseWidth = viewHeight * imageRatio;
        } else {
            state.baseWidth = viewWidth;
            state.baseHeight = viewWidth / imageRatio;
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

        const outputWidth = config.outputWidth || 512;
        const outputHeight = config.outputHeight || outputWidth;
        const viewWidth = viewport.clientWidth || 112;
        const viewHeight = viewport.clientHeight || viewWidth;
        const drawWidth = state.baseWidth * state.scale;
        const drawHeight = state.baseHeight * state.scale;
        const drawX = (viewWidth - drawWidth) / 2 + state.x;
        const drawY = (viewHeight - drawHeight) / 2 + state.y;

        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');
        const ratioX = outputWidth / viewWidth;
        const ratioY = outputHeight / viewHeight;
        ctx.scale(ratioX, ratioY);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        return await new Promise(function(resolve) {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    return {
        getBlob: getBlob,
        setMode: setMode,
        setFallbackText: setFallbackText,
        setExistingImage: setExistingImage
    };
}


function addWorkspaceLink(name, url) {
    const list = document.getElementById('workspaceLinkList');
    const row = document.createElement('div');
    row.className = 'workspace-link-row';
    row.innerHTML =
        '<input type="text" class="workspace-link-name" maxlength="50" placeholder="링크 이름">' +
        '<input type="text" class="workspace-link-url" maxlength="500" placeholder="https://...">' +
        '<button type="button" class="workspace-link-remove" onclick="removeWorkspaceLink(this)" aria-label="링크 삭제">×</button>';
    row.querySelector('.workspace-link-name').value = name || '';
    row.querySelector('.workspace-link-url').value = url || '';
    list.appendChild(row);
}

function removeWorkspaceLink(button) {
    const list = document.getElementById('workspaceLinkList');
    const rows = list.querySelectorAll('.workspace-link-row');
    if (rows.length === 1) {
        rows[0].querySelectorAll('input').forEach(function(input) { input.value = ''; });
        return;
    }
    button.closest('.workspace-link-row').remove();
}

(function() {
    const workspaceStep = document.getElementById('workspaceStep');
    const profileStep = document.getElementById('profileStep');
    const createWrap = document.querySelector('.create-wrap');
    const accountName = createWrap.dataset.accountName || '';
    const accountEmail = createWrap.dataset.accountEmail || '';
    const workspaceImageCropper = createProfileCropper({
        fileInputId: 'wsImage',
        viewportId: 'workspaceImageViewport',
        imageId: 'workspaceCropImage',
        placeholderId: 'workspaceImagePlaceholder',
        zoomId: 'workspaceImageZoom',
        outputWidth: 600,
        outputHeight: 600
    });
    const cropper = createProfileCropper({
        fileInputId: 'createProfileImageInput',
        viewportId: 'createProfileViewport',
        imageId: 'createProfileCropImage',
        placeholderId: 'createProfilePlaceholder',
        zoomId: 'createProfileZoom'
    });

    // 계정 기본 프로필 이미지가 없으면 이름 첫 글자 아바타를 사용한다.
    document.getElementById('createProfilePlaceholder').textContent =
        accountName ? accountName.substring(0, 1) : '?';
    document.getElementById('profileDisplayName').value = accountName;
    document.getElementById('profileContactEmail').value = accountEmail;

    workspaceImageCropper.setMode('custom', 'M');

    function syncProfileMode() {
        const useAccount = $('input[name="profileMode"]:checked').val() === 'Y';
        const avatarText = accountName ? accountName.substring(0, 1) : '?';

        $('#profileDisplayName').prop('readonly', useAccount);
        document.querySelector('.profile-image-editor').style.opacity = useAccount ? '.55' : '1';
        cropper.setMode(useAccount ? 'account' : 'custom', avatarText);

        if (useAccount) {
            $('#profileDisplayName').val(accountName);
        } else if (!$('#profileDisplayName').val().trim()) {
            $('#profileDisplayName').val(accountName);
        }
    }

    $('input[name="profileMode"]').on('change', syncProfileMode);
    $('#profileDisplayName').on('input', function() {
        const value = $(this).val().trim();
        cropper.setFallbackText(value ? value.substring(0, 1) : (accountName ? accountName.substring(0, 1) : '?'));
    });
    syncProfileMode();

    $('#btnNext').on('click', function() {
        if (!$('#wsName').val().trim()) {
            alert('워크스페이스 이름을 입력해주세요.');
            $('#wsName').focus();
            return;
        }
        workspaceStep.hidden = true;
        profileStep.hidden = false;
    });

    $('#btnBack').on('click', function() {
        profileStep.hidden = true;
        workspaceStep.hidden = false;
    });

    $('#btnCreate').on('click', async function() {
        const useAccount = $('input[name="profileMode"]:checked').val();
        const displayName = $('#profileDisplayName').val().trim();
        const contactEmail = $('#profileContactEmail').val().trim();

        if (!contactEmail) {
            alert('워크스페이스 이메일을 입력해주세요.');
            $('#profileContactEmail').focus();
            return;
        }
        if (useAccount === 'N' && !displayName) {
            alert('워크스페이스 표시 이름을 입력해주세요.');
            $('#profileDisplayName').focus();
            return;
        }

        const formData = new FormData();
        formData.append('wsName', $('#wsName').val().trim());
        formData.append('wsDescription', $('#wsDesc').val().trim());
        formData.append('wsType', $('#wsType').val());
        document.querySelectorAll('#workspaceLinkList .workspace-link-row').forEach(function(row) {
            const name = row.querySelector('.workspace-link-name').value.trim();
            const url = row.querySelector('.workspace-link-url').value.trim();
            if (!name && !url) return;
            formData.append('linkName', name);
            formData.append('linkUrl', url);
        });
        formData.append('useAccountProfile', useAccount);
        formData.append('displayName', displayName);
        formData.append('contactEmail', contactEmail);
        formData.append('positionName', $('#profilePositionName').val().trim());
        formData.append('phoneNumber', $('#profilePhoneNumber').val().trim());
        formData.append('showPhone', $('#profileShowPhone').is(':checked') ? 'Y' : 'N');

        const workspaceImage = $('#wsImage')[0].files[0];
        if (workspaceImage) {
            const workspaceBlob = await workspaceImageCropper.getBlob();
            formData.append('wsImage', workspaceBlob || workspaceImage, 'workspace_image.png');
        }

        if (useAccount === 'N') {
            const blob = await cropper.getBlob();
            if (blob) formData.append('profileImage', blob, 'workspace_profile.jpg');
        }

        const button = this;
        button.disabled = true;
        button.textContent = '생성 중...';

        $.ajax({
            url: '/workspace/api/create',
            type: 'POST',
            processData: false,
            contentType: false,
            data: formData,
            success: function(res) {
                if (res.status === 'success') {
                    location.href = res.redirectUrl || ('/workspace/main?wsId=' + res.wsId);
                    return;
                }
                alert(res.message || '워크스페이스 생성에 실패했습니다.');
            },
            error: function() {
                alert('워크스페이스 생성 중 서버 오류가 발생했습니다.');
            },
            complete: function() {
                button.disabled = false;
                button.textContent = '워크스페이스 생성';
            }
        });
    });
})();
</script>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
