<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>새 그룹 만들기 - MOYO</title>
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

        .workspace-image-summary {
            display:grid;
            grid-template-columns:96px minmax(0,1fr);
            gap:14px;
            align-items:center;
            width:100%;
            padding:12px 14px;
            border:1px solid #e3eaf2;
            border-radius:16px;
            background:#fbfdff;
        }
        .workspace-image-preview {
            width:96px;
            height:96px;
            overflow:hidden;
            border:1px solid #dbe6f1;
            border-radius:18px;
            background:linear-gradient(135deg,#eef6ff,#f4fffc);
            display:flex;
            align-items:center;
            justify-content:center;
        }
        .workspace-image-preview img { width:100%; height:100%; object-fit:cover; display:block; }
        .workspace-image-preview img[hidden], .workspace-image-preview span[hidden] { display:none!important; }
        .workspace-image-preview #workspaceDefaultMascot {
            width:66%;
            height:66%;
            object-fit:contain;
            object-position:center;
            padding:0;
            margin:0;
            box-sizing:border-box;
            background:transparent;
            transform:translateY(-3px);
            flex:0 0 auto;
        }
        .workspace-image-preview span { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#4a90e2; font-size:32px; font-weight:900; }
        .workspace-image-copy strong { display:block; margin-bottom:7px; font-size:13px; color:#334155; }
        .workspace-image-copy p { margin:9px 0 0; color:#8491a3; font-size:11px; line-height:1.45; }
        .workspace-image-modal-viewport {
            position:relative;
            width:250px;
            height:250px;
            margin:-2px auto 17px;
            overflow:hidden;
            border:5px solid #fff;
            border-radius:28px;
            background:#fff;
            box-shadow:0 14px 34px rgba(48,75,130,.18),0 0 0 1px #dce6f1;
            cursor:grab;
            touch-action:none;
        }
        .workspace-image-modal-viewport.is-dragging { cursor:grabbing; }
        .workspace-image-modal-viewport img { position:absolute; left:50%; top:50%; width:auto; height:auto; max-width:none; user-select:none; pointer-events:none; transform-origin:center; }

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
            min-height:40px;
            padding:0 18px;
            border-radius:12px;
            border:1px solid #cfdbea;
            background:#fff;
            color:#315b9c;
            font-family:inherit;
            font-size:13px;
            font-weight:700;
            line-height:1;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            transition:border-color .18s ease, background .18s ease, transform .18s ease, box-shadow .18s ease;
        }
        .create-btn:hover {
            border-color:#9eb8e9;
            background:#f6f9ff;
        }
        .create-btn.primary {
            border:0;
            color:#fff;
            background:linear-gradient(90deg,#39cdb5 0%,#4a90e2 54%,#6b5cf6 100%);
            box-shadow:0 8px 18px rgba(74,144,226,.22);
        }
        .create-btn.primary:hover {
            background:linear-gradient(90deg,#32c4ad 0%,#4288db 54%,#6252ed 100%);
            box-shadow:0 10px 22px rgba(74,144,226,.28);
            transform:translateY(-1px);
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
    
.profile-account-editor {
    display:grid;
    grid-template-columns:112px minmax(0,1fr);
    align-items:center;
    gap:18px;
    margin:18px 0;
    padding:16px;
    border:1px solid #e3eaf2;
    border-radius:16px;
    background:#fbfdff;
}
.profile-account-preview {
    position:relative;
    width:112px;
    height:112px;
    overflow:hidden;
    border-radius:50%;
    border:1px solid #dbe6f1;
    background:linear-gradient(135deg,#4A90E2,#39CDB5);
}
.profile-account-preview img {
    width:100%; height:100%; object-fit:cover; display:block;
}
.profile-account-fallback {
    width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:34px; font-weight:900;
}
.profile-account-preview img[hidden],
.profile-account-fallback[hidden] { display:none !important; }
.profile-account-copy strong { display:block; margin-bottom:7px; font-size:13px; color:#334155; }
.profile-account-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.profile-account-button {
    display:inline-flex; align-items:center; justify-content:center; min-height:34px; padding:0 12px;
    border:1px solid #dbe4ee; border-radius:9px; background:#fff;
    color:#475569; font-size:12px; font-weight:700; cursor:pointer;
}
.profile-account-button:hover { border-color:#9ec5f3; color:#2563eb; background:#f8fbff; }
.profile-account-button.is-primary { color:#2563eb; border-color:#bfd9f6; background:#f6faff; }
.profile-account-hint { margin:9px 0 0; color:#8491a3; font-size:11px; line-height:1.45; }
.profile-account-editor.is-disabled { opacity:.52; }
.profile-account-editor.is-disabled .profile-account-actions { pointer-events:none; }

.signup-profile-modal[hidden] { display: none !important; }
.signup-profile-modal {
    position: fixed; inset: 0; z-index: 3000; padding: 24px;
    display: flex; align-items: center; justify-content: center;
}
.signup-profile-modal-backdrop {
    position: absolute; inset: 0;
    background: rgba(15, 23, 42, .34);
    backdrop-filter: blur(6px);
}
.signup-profile-modal-dialog {
    position: relative;
    width: min(420px, calc(100vw - 32px));
    padding: 22px 24px 24px;
    border: 1px solid rgba(219, 229, 242, .95);
    border-radius: 28px;
    background: #fff;
    box-shadow: 0 30px 70px rgba(32, 52, 92, .24);
}
.signup-profile-modal-head {
    margin-bottom: 14px;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
}
.signup-profile-modal-kicker {
    display: block; margin-bottom: 5px;
    color: #3d66ff; font-size: 12px; font-weight: 800; letter-spacing: .08em;
}
.signup-profile-modal-head h3 {
    margin: 0; color: #111827; font-size: 21px; font-weight: 850; letter-spacing: -.04em;
}
.signup-profile-modal-close {
    width: 34px; height: 34px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid #e3ebf7; border-radius: 50%;
    color: #6b7890; background: #f8fbff;
    font-family: inherit; font-size: 22px; line-height: 1; cursor: pointer;
}
.signup-profile-crop-viewport {
    position: relative;
    width: 174px; height: 174px;
    margin: -2px auto 17px;
    overflow: hidden;
    border: 5px solid #fff; border-radius: 50%;
    background: #fff;
    box-shadow: 0 14px 34px rgba(48, 75, 130, .18), 0 0 0 1px #dce6f1;
    cursor: grab; touch-action: none;
}
.signup-profile-crop-viewport.is-dragging { cursor: grabbing; }
.signup-profile-crop-viewport img {
    position: absolute; left: 50%; top: 50%;
    width: auto; height: auto; max-width: none;
    user-select: none; pointer-events: none; transform-origin: center;
}
.signup-profile-crop-control { margin-top: 2px; }
.signup-profile-crop-head {
    margin-bottom: 6px;
    display: flex; align-items: center; justify-content: space-between;
    color: #111827; font-size: 13px; font-weight: 800;
}
.signup-profile-crop-head output { color: #3d66ff; font-size: 12px; font-weight: 800; }
.signup-profile-crop-control input[type="range"] {
    width: 100%; height: 4px; border-radius: 999px;
    background: linear-gradient(90deg, #54c8c7, #5860f4);
    accent-color: #4c73ff;
}
.signup-profile-modal-hint {
    margin: 10px 0 0; color: #8d9aae;
    font-size: 12px; line-height: 1.55; text-align: center;
}
.signup-profile-modal-actions {
    margin-top: 16px;
    display: grid; grid-template-columns: 1fr 92px; gap: 8px;
}
.signup-secondary-button,
.signup-primary-button {
    border: 0; font-family: inherit; cursor: pointer;
}
.signup-secondary-button {
    min-height: 52px; padding: 0 13px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid #d7e0f0; border-radius: 14px;
    color: #315dd4; background: #f8faff;
    font-size: 12px; font-weight: 800; text-decoration: none; white-space: nowrap;
}
.signup-secondary-button:hover { border-color: #9cb3ec; background: #f2f6ff; }
.signup-primary-button {
    width: 100%; height: 53px; border-radius: 14px;
    color: #fff;
    background: linear-gradient(100deg, #54c9c8 0%, #4388ef 52%, #5b55ec 100%);
    box-shadow: 0 13px 28px rgba(74, 100, 224, .22);
    font-size: 15px; font-weight: 900;
}
.signup-primary-button:hover { transform: translateY(-1px); }
.signup-profile-modal-actions .signup-secondary-button,
.signup-profile-modal-actions .signup-primary-button {
    height: 42px; min-height: 42px; padding: 0 12px;
    border-radius: 14px; font-size: 12px; box-shadow: none;
}
.signup-profile-modal-actions .signup-secondary-button,
.signup-profile-modal-actions .signup-profile-apply { width: 100%; }
body.profile-crop-open { overflow: hidden; }
@media(max-width:640px) {
    .signup-profile-modal { align-items: flex-end; padding: 14px; }
    .signup-profile-modal-dialog { width: 100%; padding: 22px 18px 18px; border-radius: 24px; }
    .signup-profile-crop-viewport { width: 150px; height: 150px; margin-top: 0; }
    .signup-profile-modal-actions { grid-template-columns: 1fr; }
    .signup-profile-modal-actions .signup-secondary-button,
    .signup-profile-modal-actions .signup-primary-button { width: 100%; }
}

.join-type-options { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:9px; }
.join-type-option { position:relative; cursor:pointer; }
.join-type-option input { position:absolute; opacity:0; pointer-events:none; }
.join-type-card {
    display:block; min-height:100px; padding:13px 13px 12px;
    border:1px solid #dfe6ee; border-radius:13px; background:#fff;
    transition:border-color .18s ease, box-shadow .18s ease, background .18s ease, transform .18s ease;
}
.join-type-card strong { display:block; margin-bottom:5px; color:#1f2937; font-size:14px; font-weight:800; line-height:1.35; }
.join-type-card small { display:block; color:#7b8798; font-size:11px; line-height:1.48; word-break:keep-all; }
.join-type-option:hover .join-type-card { border-color:#c8d7e8; background:#fbfdff; transform:translateY(-1px); }
.join-type-option input:checked + .join-type-card {
    border-color:#8fb9ee;
    background:linear-gradient(135deg, rgba(57,205,181,.07), rgba(74,144,226,.06) 58%, rgba(117,99,255,.05));
    box-shadow:0 5px 15px rgba(74,144,226,.10), inset 0 0 0 1px rgba(74,144,226,.10);
}
.join-type-option input:focus-visible + .join-type-card { outline:2px solid #4A90E2; outline-offset:2px; }
.join-type-badge {
    display:inline-flex; align-items:center; min-height:19px; margin-bottom:6px; padding:0 7px;
    border-radius:999px; background:#f2f5fb; color:#63738a; font-size:10px; font-weight:800;
}
.join-type-option input:checked + .join-type-card .join-type-badge {
    background:rgba(74,144,226,.10); color:#3978c7;
}
@media (min-width:641px) and (max-height:820px) {
    .join-type-card { min-height:92px; padding:11px 12px 10px; }
    .join-type-card strong { margin-bottom:4px; }
    .join-type-badge { margin-bottom:5px; }
}
@media (max-width:720px) { .join-type-options { grid-template-columns:1fr; } .join-type-card { min-height:auto; } }

    
/* 그룹 기본 아바타: 개인 기본 아바타와 같은 MOYO 그라데이션, 그룹은 둥근 사각형 */
.workspace-image-preview #workspaceImagePlaceholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #fff;
    background: linear-gradient(135deg, #7edfd5 0%, #6fa8e8 52%, #9488ef 100%);
    font-size: 31px;
    font-weight: 800;
    line-height: 1;
    text-transform: uppercase;
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
            <h2>새 그룹 만들기</h2>
            <p class="create-desc">그룹 정보를 입력한 다음, 이 그룹에서 사용할 프로필을 선택합니다.</p>

            <div class="form-group">
                <label for="wsName">그룹 이름 *</label>
                <input type="text" id="wsName" maxlength="60" placeholder="그룹 이름을 입력하세요">
            </div>
            <div class="form-group">
                <label for="wsDesc">그룹 소개</label>
                <textarea id="wsDesc" rows="3" maxlength="300" placeholder="그룹을 소개해주세요"></textarea>
            </div>
            <div class="form-group">
                <label for="wsType">그룹 유형 *</label>
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
                <span class="field-title">가입 방식 *</span>
                <div class="join-type-options" role="radiogroup" aria-label="그룹 가입 방식">
                    <label class="join-type-option">
                        <input type="radio" name="joinType" value="OPEN" checked>
                        <span class="join-type-card">
                            <span class="join-type-badge">자유 가입</span>
                            <strong>누구나 바로 참여</strong>
                            <small>공개된 그룹을 확인한 사용자가 승인 없이 바로 참여할 수 있어요.</small>
                        </span>
                    </label>
                    <label class="join-type-option">
                        <input type="radio" name="joinType" value="APPROVAL">
                        <span class="join-type-card">
                            <span class="join-type-badge">승인제</span>
                            <strong>승인 후 참여</strong>
                            <small>사용자의 참여 요청을 그룹장 또는 그룹 관리자가 승인해야 참여해요.</small>
                        </span>
                    </label>
                    <label class="join-type-option">
                        <input type="radio" name="joinType" value="INVITE_ONLY">
                        <span class="join-type-card">
                            <span class="join-type-badge">초대 전용</span>
                            <strong>초대받은 사용자만 참여</strong>
                            <small>그룹장이나 그룹 관리자의 초대로만 참여해요.</small>
                        </span>
                    </label>
                </div>
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
                <div class="workspace-image-summary">
                    <div class="workspace-image-preview" aria-label="그룹 대표 이미지 미리보기">
                        <img id="workspacePreviewImage" hidden alt="그룹 대표 이미지">
                        <img id="workspaceDefaultMascot" src="${pageContext.request.contextPath}/brand/moyo_mark.png" alt="" aria-hidden="true">
                        <span id="workspaceImagePlaceholder" hidden></span>
                    </div>
                    <div class="workspace-image-copy">
                        <strong>그룹 대표 이미지</strong>
                        <div class="profile-account-actions">
                            <label id="workspaceImageSelectLabel" for="wsImage" class="profile-account-button is-primary">이미지 선택</label>
                            <input type="file" id="wsImage" accept="image/png,image/jpeg,image/webp" hidden>
                            <button type="button" id="workspaceImageAdjustButton" class="profile-account-button" hidden>이미지 조정</button>
                            <button type="button" id="workspaceImageDefaultButton" class="profile-account-button">기본 이미지</button>
                        </div>
                        <p>이미지를 선택한 뒤 둥근 사각형 영역 안에서 위치와 크기를 조정할 수 있어요.</p>
                    </div>
                </div>
            </div>
            <div class="create-actions">
                <button type="button" id="btnNext" class="create-btn primary">다음</button>
            </div>
        </section>

        <section id="profileStep" class="create-panel" hidden>
            <span class="create-step-label">2 / 2</span>
            <h2>그룹에서 사용할 프로필</h2>
            <p class="create-desc">계정 프로필을 그대로 사용하거나, 이 그룹에서 사용할 별도 프로필을 만들 수 있어요.</p>

            <div class="profile-choice">
                <label>
                    <input type="radio" name="profileMode" value="Y" checked>
                    <span>
                        <strong>계정 프로필 그대로 사용</strong>
                        <small>계정의 표시 이름과 프로필 이미지를 그대로 사용합니다.</small>
                    </span>
                </label>
                <label>
                    <input type="radio" name="profileMode" value="N">
                    <span>
                        <strong>그룹 전용 프로필 사용</strong>
                        <small>이 그룹에서 사용할 이름과 프로필 이미지를 따로 설정합니다.</small>
                    </span>
                </label>
            </div>

            <div id="profileAccountEditor" class="profile-account-editor">
                <div class="profile-account-preview" aria-label="그룹 프로필 이미지 미리보기">
                    <img id="groupProfilePreviewImage" hidden alt="그룹 프로필 이미지">
                    <span id="groupProfileFallback" class="profile-account-fallback"></span>
                </div>
                <div class="profile-account-copy">
                    <strong>프로필 이미지</strong>
                    <div class="profile-account-actions">
                        <label id="groupProfileSelectLabel" for="createProfileImageInput" class="profile-account-button is-primary">사진 선택</label>
                        <input type="file" id="createProfileImageInput" accept="image/png,image/jpeg,image/webp" hidden>
                        <button type="button" id="groupProfileAdjustButton" class="profile-account-button" hidden>사진 조정</button>
                        <button type="button" id="groupProfileDefaultButton" class="profile-account-button">기본 아바타</button>
                    </div>
                    <p class="profile-account-hint">계정 프로필과 같은 방식으로 사진을 선택한 뒤 원형 안에서 위치와 크기를 조정할 수 있어요.</p>
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
                    <label for="profileContactEmail">이메일 *</label>
                    <input type="text" id="profileContactEmail" maxlength="100"
                           value="<c:out value='${accountEmail}'/>">
                    <small class="form-help">그룹 내 연락에 사용되며 그룹 멤버에게 표시됩니다.</small>
                </div>
                <div class="form-group full">
                    <label for="profilePhoneNumber">연락처 <small>(선택)</small></label>
                    <input type="tel" id="profilePhoneNumber" maxlength="30" placeholder="예: 010-0000-0000">
                </div>
                <div class="form-group full">
                    <label class="check-row">
                        <input type="checkbox" id="profileShowPhone">
                        그룹 멤버에게 연락처 공개
                    </label>
                </div>
            </div>

            <div class="create-actions">
                <button type="button" id="btnBack" class="create-btn">이전</button>
                <button type="button" id="btnCreate" class="create-btn primary">그룹 생성</button>
            </div>
        </section>
    </div>
</div>

<div id="workspaceImageCropModal" class="signup-profile-modal" hidden role="dialog" aria-modal="true" aria-labelledby="workspaceImageCropTitle">
    <div class="signup-profile-modal-backdrop" data-workspace-image-close></div>
    <div class="signup-profile-modal-dialog">
        <div class="signup-profile-modal-head">
            <div>
                <span class="signup-profile-modal-kicker">그룹 이미지 조정</span>
                <h3 id="workspaceImageCropTitle">영역 안에 이미지를 맞춰주세요</h3>
            </div>
            <button type="button" class="signup-profile-modal-close" data-workspace-image-close aria-label="닫기">×</button>
        </div>
        <div id="workspaceImageCropViewport" class="workspace-image-modal-viewport">
            <img id="workspaceImageCropImage" alt="그룹 이미지 조정 미리보기">
        </div>
        <div class="signup-profile-crop-control">
            <div class="signup-profile-crop-head">
                <span>이미지 크기</span>
                <output id="workspaceImageScaleValue">115%</output>
            </div>
            <input id="workspaceImageScale" type="range" min="70" max="200" step="1" value="115">
        </div>
        <p class="signup-profile-modal-hint">드래그로 위치를 맞추고 크기를 조정하세요.</p>
        <div class="signup-profile-modal-actions signup-profile-modal-actions--simple">
            <label for="wsImage" class="signup-secondary-button">이미지 다시 선택</label>
            <button type="button" id="workspaceImageApplyButton" class="signup-primary-button signup-profile-apply">적용</button>
        </div>
    </div>
</div>

<div id="groupProfileCropModal" class="signup-profile-modal" hidden role="dialog" aria-modal="true" aria-labelledby="groupProfileCropTitle">
    <div class="signup-profile-modal-backdrop" data-group-profile-close></div>
    <div class="signup-profile-modal-dialog">
        <div class="signup-profile-modal-head">
            <div>
                <span class="signup-profile-modal-kicker">프로필 사진 조정</span>
                <h3 id="groupProfileCropTitle">원형 안에 사진을 맞춰주세요</h3>
            </div>
            <button type="button" class="signup-profile-modal-close" data-group-profile-close aria-label="닫기">×</button>
        </div>
        <div id="groupProfileCropViewport" class="signup-profile-crop-viewport">
            <img id="groupProfileCropImage" alt="프로필 사진 조정 미리보기">
        </div>
        <div class="signup-profile-crop-control">
            <div class="signup-profile-crop-head">
                <span>사진 크기</span>
                <output id="groupProfileScaleValue">115%</output>
            </div>
            <input id="groupProfileScale" type="range" min="70" max="200" step="1" value="115">
        </div>
        <p class="signup-profile-modal-hint">드래그로 위치를 맞추고 크기를 조정하세요.</p>
        <div class="signup-profile-modal-actions signup-profile-modal-actions--simple">
            <label for="createProfileImageInput" class="signup-secondary-button">사진 다시 선택</label>
            <button type="button" id="groupProfileApplyButton" class="signup-primary-button signup-profile-apply">적용</button>
        </div>
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



function createWorkspaceImageEditor() {
    const fileInput = document.getElementById('wsImage');
    const previewImage = document.getElementById('workspacePreviewImage');
    const placeholder = document.getElementById('workspaceImagePlaceholder');
    const defaultMascot = document.getElementById('workspaceDefaultMascot');
    const selectLabel = document.getElementById('workspaceImageSelectLabel');
    const adjustButton = document.getElementById('workspaceImageAdjustButton');
    const defaultButton = document.getElementById('workspaceImageDefaultButton');
    const modal = document.getElementById('workspaceImageCropModal');
    const viewport = document.getElementById('workspaceImageCropViewport');
    const image = document.getElementById('workspaceImageCropImage');
    const scaleRange = document.getElementById('workspaceImageScale');
    const scaleValue = document.getElementById('workspaceImageScaleValue');
    const applyButton = document.getElementById('workspaceImageApplyButton');

    let sourceUrl = '', committedBlob = null, committedPreviewUrl = '';
    let scale = 1.15, offsetX = 0, offsetY = 0, baseWidth = 0, baseHeight = 0;
    let dragging = false, lastX = 0, lastY = 0;

    function calculateBaseSize() {
        const size = viewport.clientWidth || 250;
        if (!image.naturalWidth || !image.naturalHeight) return;
        const ratio = image.naturalWidth / image.naturalHeight;
        if (ratio >= 1) { baseHeight = size; baseWidth = size * ratio; }
        else { baseWidth = size; baseHeight = size / ratio; }
        image.style.width = baseWidth + 'px'; image.style.height = baseHeight + 'px';
    }
    function render() { image.style.transform = 'translate(-50%, -50%) translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')'; }
    function open(reset) {
        if (!sourceUrl) return;
        if (reset) { scale = 1.15; offsetX = 0; offsetY = 0; scaleRange.value = '115'; }
        scaleValue.textContent = Math.round(scale * 100) + '%';
        image.onload = function(){ calculateBaseSize(); render(); };
        image.src = sourceUrl;
        if (image.complete && image.naturalWidth) { calculateBaseSize(); render(); }
        modal.hidden = false; document.body.classList.add('profile-crop-open');
    }
    function close(){ modal.hidden = true; document.body.classList.remove('profile-crop-open'); }
    function reset(){
        committedBlob = null; fileInput.value = '';
        if (sourceUrl.startsWith('blob:')) URL.revokeObjectURL(sourceUrl); sourceUrl = '';
        if (committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl); committedPreviewUrl = '';
        previewImage.hidden = true; previewImage.removeAttribute('src');
        adjustButton.hidden = true; selectLabel.textContent = '이미지 선택';
        syncWorkspaceFallback();
    }
    async function createBlob(){
        if (!image.naturalWidth) return null;
        const size = viewport.clientWidth || 250;
        const drawWidth = baseWidth * scale, drawHeight = baseHeight * scale;
        const drawX = (size - drawWidth) / 2 + offsetX, drawY = (size - drawHeight) / 2 + offsetY;
        const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
        const ctx = canvas.getContext('2d'); const ratio = 600 / size; ctx.scale(ratio, ratio);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }
    fileInput.addEventListener('change', function(){
        const file = fileInput.files && fileInput.files[0]; if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.'); fileInput.value=''; return; }
        if (sourceUrl.startsWith('blob:')) URL.revokeObjectURL(sourceUrl);
        sourceUrl = URL.createObjectURL(file); open(true);
    });
    adjustButton.addEventListener('click', () => open(false));
    defaultButton.addEventListener('click', reset);
    const workspaceNameInput = document.getElementById('wsName');
    function syncWorkspaceFallback(){
        const name = (workspaceNameInput?.value || '').trim();
        const hasName = name.length > 0;
        placeholder.textContent = hasName ? Array.from(name)[0].toUpperCase() : '';
        placeholder.hidden = !hasName;
        if (defaultMascot) defaultMascot.hidden = hasName;
    }
    workspaceNameInput?.addEventListener('input', syncWorkspaceFallback);
    syncWorkspaceFallback();
    document.querySelectorAll('[data-workspace-image-close]').forEach(el => el.addEventListener('click', close));
    scaleRange.addEventListener('input', function(){ scale = Number(scaleRange.value || 115)/100; scaleValue.textContent = scaleRange.value + '%'; render(); });
    viewport.addEventListener('pointerdown', function(e){ dragging=true; viewport.classList.add('is-dragging'); lastX=e.clientX; lastY=e.clientY; viewport.setPointerCapture?.(e.pointerId); });
    viewport.addEventListener('pointermove', function(e){ if(!dragging)return; offsetX += e.clientX-lastX; offsetY += e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; render(); });
    function end(e){ dragging=false; viewport.classList.remove('is-dragging'); if(e?.pointerId!==undefined&&viewport.hasPointerCapture?.(e.pointerId)) viewport.releasePointerCapture(e.pointerId); }
    viewport.addEventListener('pointerup', end); viewport.addEventListener('pointercancel', end);
    applyButton.addEventListener('click', async function(){
        const blob = await createBlob(); if(!blob)return; committedBlob=blob;
        if(committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl); committedPreviewUrl=URL.createObjectURL(blob);
        previewImage.src=committedPreviewUrl; previewImage.hidden=false; placeholder.hidden=true; if(defaultMascot) defaultMascot.hidden=true;
        adjustButton.hidden=false; selectLabel.textContent='이미지 다시 선택'; close();
    });
    return { getBlob(){ return Promise.resolve(committedBlob); } };
}

function createAccountStyleProfileEditor() {
    const fileInput = document.getElementById('createProfileImageInput');
    const previewImage = document.getElementById('groupProfilePreviewImage');
    const fallback = document.getElementById('groupProfileFallback');
    const selectLabel = document.getElementById('groupProfileSelectLabel');
    const adjustButton = document.getElementById('groupProfileAdjustButton');
    const defaultButton = document.getElementById('groupProfileDefaultButton');
    const modal = document.getElementById('groupProfileCropModal');
    const cropViewport = document.getElementById('groupProfileCropViewport');
    const cropImage = document.getElementById('groupProfileCropImage');
    const scaleRange = document.getElementById('groupProfileScale');
    const scaleValue = document.getElementById('groupProfileScaleValue');
    const applyButton = document.getElementById('groupProfileApplyButton');

    let mode = 'custom';
    let fallbackText = '?';
    let sourceUrl = '';
    let committedBlob = null;
    let committedPreviewUrl = '';
    let scale = 1.15;
    let offsetX = 0;
    let offsetY = 0;
    let baseWidth = 0;
    let baseHeight = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function updateFallback() {
        fallback.textContent = fallbackText || '?';
        if (!committedPreviewUrl) {
            fallback.hidden = false;
            previewImage.hidden = true;
        }
    }

    function calculateBaseSize() {
        const size = cropViewport.clientWidth || 320;
        if (!cropImage.naturalWidth || !cropImage.naturalHeight) return;
        const ratio = cropImage.naturalWidth / cropImage.naturalHeight;
        if (ratio >= 1) {
            baseHeight = size;
            baseWidth = size * ratio;
        } else {
            baseWidth = size;
            baseHeight = size / ratio;
        }
        cropImage.style.width = baseWidth + 'px';
        cropImage.style.height = baseHeight + 'px';
    }

    function renderCrop() {
        cropImage.style.transform = 'translate(-50%, -50%) translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')';
    }

    function openModal(reset) {
        if (!sourceUrl || mode !== 'custom') return;
        if (reset) {
            scale = 1.15;
            offsetX = 0;
            offsetY = 0;
            scaleRange.value = '115';
        }
        scaleValue.textContent = Math.round(scale * 100) + '%';
        cropImage.onload = function() {
            calculateBaseSize();
            renderCrop();
        };
        cropImage.src = sourceUrl;
        if (cropImage.complete && cropImage.naturalWidth) {
            calculateBaseSize();
            renderCrop();
        }
        modal.hidden = false;
        document.body.classList.add('profile-crop-open');
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove('profile-crop-open');
    }

    function resetToAvatar() {
        committedBlob = null;
        sourceUrl = '';
        fileInput.value = '';
        if (committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl);
        committedPreviewUrl = '';
        previewImage.removeAttribute('src');
        previewImage.hidden = true;
        fallback.hidden = false;
        adjustButton.hidden = true;
        selectLabel.textContent = '사진 선택';
        updateFallback();
    }

    async function createBlob() {
        if (!cropImage.naturalWidth) return null;
        const viewSize = cropViewport.clientWidth || 320;
        const drawWidth = baseWidth * scale;
        const drawHeight = baseHeight * scale;
        const drawX = (viewSize - drawWidth) / 2 + offsetX;
        const drawY = (viewSize - drawHeight) / 2 + offsetY;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const ratio = 512 / viewSize;
        ctx.scale(ratio, ratio);
        // 계정 프로필 생성과 동일하게 투명 이미지의 빈 영역은 흰색으로 저장한다.
        ctx.clearRect(0, 0, viewSize, viewSize);
        ctx.drawImage(cropImage, drawX, drawY, drawWidth, drawHeight);
        return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }

    fileInput.addEventListener('change', function() {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
            alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.');
            fileInput.value = '';
            return;
        }
        if (sourceUrl && sourceUrl.startsWith('blob:')) URL.revokeObjectURL(sourceUrl);
        sourceUrl = URL.createObjectURL(file);
        openModal(true);
    });

    adjustButton.addEventListener('click', function() { openModal(false); });
    defaultButton.addEventListener('click', resetToAvatar);
    document.querySelectorAll('[data-group-profile-close]').forEach(el => el.addEventListener('click', closeModal));

    scaleRange.addEventListener('input', function() {
        scale = Number(scaleRange.value || 115) / 100;
        scaleValue.textContent = scaleRange.value + '%';
        renderCrop();
    });

    cropViewport.addEventListener('pointerdown', function(event) {
        dragging = true;
        cropViewport.classList.add('is-dragging');
        lastX = event.clientX;
        lastY = event.clientY;
        cropViewport.setPointerCapture?.(event.pointerId);
    });
    cropViewport.addEventListener('pointermove', function(event) {
        if (!dragging) return;
        offsetX += event.clientX - lastX;
        offsetY += event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        renderCrop();
    });
    function endDrag(event) {
        dragging = false;
        cropViewport.classList.remove('is-dragging');
        if (event?.pointerId !== undefined && cropViewport.hasPointerCapture?.(event.pointerId)) {
            cropViewport.releasePointerCapture(event.pointerId);
        }
    }
    cropViewport.addEventListener('pointerup', endDrag);
    cropViewport.addEventListener('pointercancel', endDrag);

    applyButton.addEventListener('click', async function() {
        const blob = await createBlob();
        if (!blob) return;
        committedBlob = blob;
        if (committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl);
        committedPreviewUrl = URL.createObjectURL(blob);
        previewImage.src = committedPreviewUrl;
        previewImage.hidden = false;
        fallback.hidden = true;
        adjustButton.hidden = false;
        selectLabel.textContent = '사진 다시 선택';
        closeModal();
    });

    return {
        setMode(nextMode, text) {
            mode = nextMode === 'account' ? 'account' : 'custom';
            fallbackText = text || '?';
            document.getElementById('profileAccountEditor').classList.toggle('is-disabled', mode === 'account');
            updateFallback();
        },
        setFallbackText(text) {
            fallbackText = text || '?';
            updateFallback();
        },
        getBlob() { return Promise.resolve(committedBlob); }
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
    const workspaceImageEditor = createWorkspaceImageEditor();
    const cropper = createAccountStyleProfileEditor();

    // 계정 기본 프로필 이미지가 없으면 이름 첫 글자 아바타를 사용한다.
    document.getElementById('groupProfileFallback').textContent =
        accountName ? accountName.substring(0, 1) : '?';
    document.getElementById('profileDisplayName').value = accountName;
    document.getElementById('profileContactEmail').value = accountEmail;


    function syncProfileMode() {
        const useAccount = $('input[name="profileMode"]:checked').val() === 'Y';
        const avatarText = accountName ? accountName.substring(0, 1) : '?';

        $('#profileDisplayName').prop('readonly', useAccount);
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
            alert('그룹 이름을 입력해주세요.');
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
            alert('그룹 이메일을 입력해주세요.');
            $('#profileContactEmail').focus();
            return;
        }
        if (useAccount === 'N' && !displayName) {
            alert('그룹 표시 이름을 입력해주세요.');
            $('#profileDisplayName').focus();
            return;
        }

        const formData = new FormData();
        formData.append('wsName', $('#wsName').val().trim());
        formData.append('wsDescription', $('#wsDesc').val().trim());
        formData.append('wsType', $('#wsType').val());
        formData.append('joinType', $('input[name="joinType"]:checked').val() || 'OPEN');
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

        const workspaceBlob = await workspaceImageEditor.getBlob();
        if (workspaceBlob) {
            formData.append('wsImage', workspaceBlob, 'workspace_image.png');
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
                alert(res.message || '그룹 생성에 실패했습니다.');
            },
            error: function() {
                alert('그룹 생성 중 서버 오류가 발생했습니다.');
            },
            complete: function() {
                button.disabled = false;
                button.textContent = '그룹 생성';
            }
        });
    });
})();
</script>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
