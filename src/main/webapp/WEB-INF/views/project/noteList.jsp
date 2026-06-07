<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>노트</title>
    <style>
        body { margin:0; background:#f6f8fa; color:#2d3339; font-family:'Pretendard', sans-serif; }
        .note-page { max-width:1280px; margin:34px auto 72px; padding:0 24px; box-sizing:border-box; }
        .top-link { display:inline-flex; align-items:center; gap:6px; margin-bottom:20px; text-decoration:none; color:#667085; font-size:14px; font-weight:700; }
        .top-link:hover { color:#4A90E2; }

        .note-hero {
            position:relative; display:flex; justify-content:space-between; align-items:center; gap:22px;
            padding:30px 34px; margin-bottom:28px;
            background:radial-gradient(circle at 92% 18%, rgba(85,221,191,.20), transparent 28%), radial-gradient(circle at 6% 100%, rgba(74,144,226,.12), transparent 32%), #fff;
            border:1px solid #e4ebf2; border-radius:24px; box-shadow:0 10px 30px rgba(32,48,64,.045); overflow:hidden;
        }
        .note-hero::before { content:''; position:absolute; left:0; top:28px; bottom:28px; width:5px; border-radius:0 999px 999px 0; background:linear-gradient(180deg,#4A90E2,#55DDBF); }
        .note-hero-title { position:relative; z-index:1; }
        .note-hero-title h2 { margin:0; font-size:32px; line-height:1.2; letter-spacing:-.05em; color:#111827; }
        .note-hero-title p { margin:10px 0 0; color:#6b7280; font-size:14px; line-height:1.5; }
        .write-btn {
            position:relative; z-index:1; display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 22px;
            background:linear-gradient(135deg,#4A90E2 0%,#39CDB5 100%); color:#fff; text-decoration:none; border-radius:999px; font-weight:900; font-size:14px;
            box-shadow:0 10px 22px rgba(57,205,181,.24); white-space:nowrap; transition:transform .18s ease, filter .18s ease;
        }
        .write-btn:hover { transform:translateY(-1px); filter:brightness(.98); }

        .board-shell {
            padding:22px; background:#eef5f8; border:1px solid #dfeaf1; border-radius:26px;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.72); overflow-x:auto; overflow-y:hidden;
        }
        .board-shell::-webkit-scrollbar { height:10px; }
        .board-shell::-webkit-scrollbar-thumb { background:#c9d8e4; border-radius:999px; }
        .board-shell::-webkit-scrollbar-track { background:transparent; }
        .note-board {
            display:grid;
            grid-auto-flow:column;
            grid-auto-columns:minmax(320px, 360px);
            gap:18px;
            min-height:360px;
            align-items:start;
            min-width:max-content;
            padding-bottom:6px;
        }
        .author-column {
            width:100%; min-width:320px; min-height:100%; display:flex; flex-direction:column; gap:14px;
            background:rgba(255,255,255,.78); border:1px solid rgba(222,232,240,.95);
            border-radius:22px; padding:14px; box-sizing:border-box;
        }
        .author-header {
            position:relative; z-index:2; display:flex; align-items:center; gap:10px; padding:12px 13px;
            background:rgba(255,255,255,.94); border:1px solid #e7eef5; border-radius:17px;
            box-shadow:0 5px 14px rgba(32,48,64,.045); backdrop-filter:blur(8px);
        }
        .author-avatar {
            display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%;
            background:linear-gradient(135deg,#4A90E2 0%,#39CDB5 100%); color:#fff; font-size:13px; font-weight:900; flex-shrink:0;
        }
        .author-info { min-width:0; flex:1; }
        .author-name { margin:0; color:#111827; font-size:16px; font-weight:900; letter-spacing:-.03em; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .author-label { margin-top:2px; color:#8a96a3; font-size:11px; font-weight:700; }

        .note-list { display:flex; flex-direction:column; gap:10px; }

        /* 기본 상태에서는 첫 번째 노트만 전체 표시 */
        .author-column.collapsed .note-list .note-card:nth-of-type(n+2) { display:none; }

        /* 더보기 상태에서는 노트 목록 전체가 이 영역에서 스크롤됨 */
        .author-column.expanded .note-list { overflow: visible; max-height: none; padding-right: 0; }
        .author-column.expanded .note-list::-webkit-scrollbar { width:6px; }
        .author-column.expanded .note-list::-webkit-scrollbar-thumb { background:#c8d6e2; border-radius:999px; }
        .author-column.expanded .note-list::-webkit-scrollbar-track { background:transparent; }

        .note-card {
            position:relative; display:block; padding:18px 18px 16px; background:#fff; border:1px solid #e6edf4; border-radius:18px;
            color:inherit; text-decoration:none; box-shadow:0 8px 20px rgba(32,48,64,.052);
            transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease; overflow:hidden;
        }
        .note-card::before {
            content:''; position:absolute; left:0; top:18px; bottom:18px; width:4px; border-radius:0 999px 999px 0;
            background:linear-gradient(180deg,#4A90E2,#55DDBF);
        }
        .note-card:hover { transform:translateY(-2px); border-color:#d7e8f7; box-shadow:0 12px 24px rgba(74,144,226,.09); }
        .note-card.active { border-color:#8edff0; background:#fbfeff; box-shadow:0 12px 26px rgba(57,205,181,.10); }

        .note-card-top {
            display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px;
            cursor:pointer;
        }
        .note-main-info { min-width:0; flex:1; }
        .note-title-row { display:flex; align-items:center; gap:8px; min-width:0; }
        .note-title { margin:0; color:#111827; font-size:15px; font-weight:900; line-height:1.35; letter-spacing:-.03em; word-break:break-word; }
        .note-date {
            color:#8a96a3;
            font-size:11px;
            font-weight:900;
            white-space:nowrap;
            line-height:1;
            text-align:right;
            flex-shrink:0;
            padding-top:3px;
        }

        .note-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
        .note-chip { display:inline-flex; align-items:center; height:23px; padding:0 8px; border-radius:999px; background:#f8fafc; border:1px solid #eef2f6; color:#667085; font-size:11px; font-weight:900; }
        .note-chip.file { background:#f5fffb; border-color:#d7f3ec; color:#0E9F8B; }
        .note-chip.memo { background:#f7f3ff; border-color:#e7dcff; color:#7c3aed; }

        .note-preview { display:flex; flex-direction:column; gap:9px; }
        .preview-block { padding:11px; background:#fafbfc; border:1px solid #eef2f6; border-radius:13px; }
        .preview-label { margin-bottom:6px; color:#4A90E2; font-size:11px; font-weight:900; }
        .preview-text { color:#3f4650; font-size:12.5px; line-height:1.56; white-space:pre-wrap; word-break:break-word; max-height:78px; overflow:hidden; }

        .note-image-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px; margin-top:10px; }
        .note-image-link { display:block; position:relative; aspect-ratio:1 / 1; border-radius:10px; overflow:hidden; border:1px solid #eef2f6; background:#f3f6f9; }
        .note-image-link img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .18s ease; }
        .note-image-link:hover img { transform:scale(1.04); }
        .note-image-more { display:flex; align-items:center; justify-content:center; aspect-ratio:1 / 1; border-radius:10px; background:#eef7ff; border:1px solid #dcebf8; color:#4A90E2; font-size:12px; font-weight:900; }

        .note-card-footer { display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-top:12px; }
        .detail-link-text { color:#9aa4af; font-size:12px; font-weight:800; text-decoration:none; }
        .detail-link-text:hover { color:#4A90E2; }

        /* 더보기 상태에서는 모든 카드가 제목/날짜만 보이다가, 클릭한 카드만 활성화되어 메모 표시 */
        .author-column.expanded .note-card {
            padding:14px 15px 14px 17px;
            border-radius:14px;
            box-shadow:0 4px 12px rgba(32,48,64,.035);
        }
        .author-column.expanded .note-card::before {
            top:14px;
            bottom:14px;
            width:3px;
        }
        .author-column.expanded .note-card .note-card-top {
            margin-bottom:0;
            align-items:flex-start;
        }
        .author-column.expanded .note-card .note-title {
            font-size:13px;
            line-height:1.35;
            display:-webkit-box;
            -webkit-line-clamp:2;
            -webkit-box-orient:vertical;
            overflow:hidden;
        }
        .author-column.expanded .note-card .note-date { font-size:10px; line-height:1; }

        .author-column.expanded .note-card .note-chips,
        .author-column.expanded .note-card .note-preview,
        .author-column.expanded .note-card .note-image-grid,
        .author-column.expanded .note-card .note-card-footer {
            display:none;
        }

        .author-column.expanded .note-card.active {
            padding:18px 18px 16px;
            border-radius:18px;
        }
        .author-column.expanded .note-card.active::before {
            top:18px;
            bottom:18px;
            width:4px;
        }
        .author-column.expanded .note-card.active .note-card-top {
            margin-bottom:12px;
            align-items:flex-start;
        }
        .author-column.expanded .note-card.active .note-title {
            font-size:15px;
            line-height:1.35;
            display:block;
            overflow:visible;
        }
        .author-column.expanded .note-card.active .note-date {
            font-size:11px;
            line-height:1;
        }
        .author-column.expanded .note-card.active .note-chips,
        .author-column.expanded .note-card.active .note-preview,
        .author-column.expanded .note-card.active .note-image-grid,
        .author-column.expanded .note-card.active .note-card-footer {
            display:flex;
        }
        .author-column.expanded .note-card.active .note-image-grid {
            display:grid;
        }


        .author-column.expanded .note-card.active .note-image-grid {
            margin-top: 10px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .author-column.expanded .note-card.active .note-image-link {
            max-height: 78px;
        }

        .author-column.expanded .note-card.active .note-image-link img {
            object-fit: cover;
        }

        .author-more-btn {
            display:none; align-items:center; justify-content:center; width:100%; min-height:38px;
            border:1px solid #dcebf8; background:#fff; color:#4A90E2; border-radius:999px;
            font-size:13px; font-weight:900; cursor:pointer; font-family:inherit;
            box-shadow:0 5px 12px rgba(74,144,226,.06);
        }
        .author-column.has-more .author-more-btn { display:flex; }
        .author-more-btn:hover { background:#f7fbff; }

        .empty-card {
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
            background:linear-gradient(180deg,#ffffff 0%, #f8fbff 100%); border:1px dashed #cfdbe7; border-radius:22px;
            padding:64px 28px; text-align:center; color:#8a96a3;
        }
        .empty-card::before {
            content:'📝'; display:flex; align-items:center; justify-content:center;
            width:56px; height:56px; border-radius:18px; background:#eef6ff; color:#4A90E2; font-size:26px;
            box-shadow:inset 0 0 0 1px #dce9f8;
        }
        .empty-card strong { display:block; margin-bottom:0; color:#243041; font-size:18px; }
        .empty-card p { margin:0; font-size:13px; line-height:1.6; }
        .empty-card .empty-write-link {
            display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:0 18px; margin-top:6px;
            border-radius:999px; text-decoration:none; color:#fff; font-size:13px; font-weight:900;
            background:linear-gradient(135deg,#4A90E2 0%,#39CDB5 100%); box-shadow:0 8px 18px rgba(57,205,181,.18);
        }
        .empty-card .empty-write-link:hover { transform:translateY(-1px); }

        .pinned-note-section {
            margin-bottom:22px; padding:18px; background:#fff; border:1px solid #e3eaf2; border-radius:22px;
            box-shadow:0 8px 24px rgba(32,48,64,.04);
        }
        .pinned-note-header { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:14px; }
        .pinned-note-title { margin:0; color:#111827; font-size:17px; font-weight:900; letter-spacing:-.03em; }
        .pinned-note-count { color:#7b8496; font-size:12px; font-weight:800; }
        .pinned-note-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .pinned-note-card { position:relative; padding:15px 16px; border:1px solid #dfe5ff; border-radius:16px; background:#fafbff; }
        .pinned-note-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .pinned-note-card-title-row { display:flex; align-items:center; gap:7px; min-width:0; }
        .pinned-note-card-title { margin:0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#1f2937; font-size:14px; font-weight:900; }
        .pinned-note-card-meta { margin-top:8px; color:#7b8496; font-size:11px; font-weight:700; }
        .pinned-note-card-preview { margin-top:10px; color:#5f6b78; font-size:12px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; white-space:pre-wrap; }
        .pinned-note-image-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-top:10px; }
        .pinned-note-image { position:relative; display:block; aspect-ratio:16/9; overflow:hidden; border:1px solid #e6ebf2; border-radius:10px; background:#eef2f6; z-index:2; }
        .pinned-note-image img { display:block; width:100%; height:100%; object-fit:cover; }
        .pinned-note-image-more { display:flex; align-items:center; justify-content:center; aspect-ratio:16/9; border:1px solid #dce7f4; border-radius:10px; background:#eef6ff; color:#4A90E2; font-size:11px; font-weight:900; z-index:2; }
        .pinned-note-card-link { position:absolute; inset:0; border-radius:16px; }
        .pinned-note-card .note-pin-btn { position:relative; z-index:2; }
        .pinned-note-empty { padding:18px; border:1px dashed #d7e2ec; border-radius:14px; color:#8a96a3; font-size:13px; text-align:center; background:#fbfdff; }

        @media(max-width:1100px) {
            .note-board { grid-auto-columns:minmax(300px, 320px); }
        }
        @media(max-width:760px) {
            .note-page { padding:0 16px; }
            .note-hero { flex-direction:column; align-items:flex-start; padding:26px 22px; }
            .write-btn { width:100%; }
            .board-shell { padding:14px; border-radius:22px; }
            .note-board { display:flex; flex-direction:column; min-width:0; }
            .author-column { min-width:0; padding:12px; }
            .note-card-top { flex-direction:column; gap:8px; }
            .note-date { text-align:left; padding-top:0; }
            .note-title-row { flex-wrap:wrap; }
            .pinned-note-grid { grid-template-columns:1fr; }
        }

        .note-pin-btn {
            display:inline-flex; align-items:center; justify-content:center; height:28px; flex-shrink:0;
            border:1px solid #e2e8f0; background:#f8fafc; color:#a0a8b3; border-radius:999px; padding:0 10px;
            font-size:11px; font-weight:800; cursor:pointer; opacity:.82;
        }
        .note-pin-btn:hover { border-color:#b7c5d6; color:#667085; background:#fff; opacity:1; }
        .note-pin-btn.is-pinned { background:#eef1ff; border-color:#7f8fff; color:#4457d6; opacity:1; box-shadow:0 3px 9px rgba(79,99,217,.10); }
        .note-pin-guide { margin-top: 8px; color: #7b8496; font-size: 13px; }
    </style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <jsp:useBean id="now" class="java.util.Date" />

    <main class="note-page">
        <a href="/project/main?projId=${projId}&wsId=${wsId}" class="top-link">⬅ 프로젝트로 돌아가기</a>

        <section class="note-hero">
            <div class="note-hero-title">
                <h2>노트</h2>
                <p>필요한 노트를 프로젝트별 최대 3개까지 고정해 메인에서 바로 확인할 수 있습니다.</p>
                <div class="note-pin-guide">고정한 노트가 없을 때는 최신 노트 3개가 표시됩니다.</div>
            </div>

            <a href="/project/note/write?wsId=${wsId}&projId=${projId}" class="write-btn">+ 노트 작성</a>
        </section>

        <c:if test="${not empty noteList}">
            <c:set var="pinnedCount" value="0" />
            <c:forEach var="note" items="${noteList}">
                <c:if test="${note.pinned}">
                    <c:set var="pinnedCount" value="${pinnedCount + 1}" />
                </c:if>
            </c:forEach>

            <section class="pinned-note-section">
                <div class="pinned-note-header">
                    <h3 class="pinned-note-title">📌 내가 고정한 노트</h3>
                    <span class="pinned-note-count">${pinnedCount} / 3</span>
                </div>

                <c:choose>
                    <c:when test="${pinnedCount gt 0}">
                        <div class="pinned-note-grid">
                            <c:forEach var="note" items="${noteList}">
                                <c:if test="${note.pinned}">
                                    <article class="pinned-note-card" data-note-id="${note.noteId}">
                                        <a class="pinned-note-card-link" href="/project/note/detail?noteId=${note.noteId}&wsId=${wsId}&projId=${projId}" aria-label="${note.noteTitle} 자세히 보기"></a>
                                        <div class="pinned-note-card-top">
                                            <div>
                                                <div class="pinned-note-card-title-row">
                                                    <h4 class="pinned-note-card-title">${note.noteTitle}</h4>
                                                </div>
                                                <div class="pinned-note-card-meta">${note.userName}</div>
                                            </div>
                                            <button type="button"
                                                    class="note-pin-btn is-pinned"
                                                    data-note-id="${note.noteId}"
                                                    data-pinned="true">📌 고정됨</button>
                                        </div>
                                        <div class="pinned-note-card-preview">${empty note.memo ? '작성된 메모가 없습니다.' : note.memo}</div>

                                        <c:if test="${not empty note.fileList}">
                                            <div class="pinned-note-image-grid">
                                                <c:set var="pinnedImageCount" value="0" />
                                                <c:forEach var="file" items="${note.fileList}">
                                                    <c:set var="isImageFile" value="${file.fileExt eq 'jpg' or file.fileExt eq 'jpeg' or file.fileExt eq 'png' or file.fileExt eq 'gif' or file.fileExt eq 'webp' or file.fileExt eq 'bmp' or file.fileExt eq 'JPG' or file.fileExt eq 'JPEG' or file.fileExt eq 'PNG' or file.fileExt eq 'GIF' or file.fileExt eq 'WEBP' or file.fileExt eq 'BMP'}" />
                                                    <c:if test="${isImageFile}">
                                                        <c:choose>
                                                            <c:when test="${pinnedImageCount lt 3}">
                                                                <a class="pinned-note-image" href="/project/note/view?fileId=${file.fileId}" target="_blank" rel="noopener">
                                                                    <img src="/project/note/view?fileId=${file.fileId}" alt="${file.originFileName}">
                                                                </a>
                                                            </c:when>
                                                            <c:when test="${pinnedImageCount eq 3}">
                                                                <span class="pinned-note-image-more">+ 더 있음</span>
                                                            </c:when>
                                                        </c:choose>
                                                        <c:set var="pinnedImageCount" value="${pinnedImageCount + 1}" />
                                                    </c:if>
                                                </c:forEach>
                                            </div>
                                        </c:if>
                                    </article>
                                </c:if>
                            </c:forEach>
                        </div>
                    </c:when>
                    <c:otherwise>
                        <div class="pinned-note-empty">고정한 노트가 없습니다. 아래 목록에서 필요한 노트를 최대 3개까지 고정할 수 있습니다.</div>
                    </c:otherwise>
                </c:choose>
            </section>
        </c:if>

        <c:choose>
            <c:when test="${not empty noteList}">
                <div class="board-shell">
                    <div class="note-board">
                        <c:set var="currentUserName" value="__INIT__" />

                        <c:forEach var="note" items="${noteList}" varStatus="status">
                            <c:if test="${currentUserName ne note.userName}">
                                <c:if test="${not status.first}">
                                    </div>
                                    <button type="button" class="author-more-btn">더보기</button>
                                </section>
                                </c:if>

                                <section class="author-column collapsed" data-author="${note.userName}">
                                    <div class="author-header">
                                        <span class="author-avatar">${note.userName.substring(0, 1)}</span>
                                        <div class="author-info">
                                            <h3 class="author-name">${note.userName}</h3>
                                            <div class="author-label">노트</div>
                                        </div>
                                    </div>

                                    <div class="note-list">

                                <c:set var="currentUserName" value="${note.userName}" />
                            </c:if>

                            <fmt:formatDate var="todayKey" value="${now}" pattern="yyyyMMdd" />
                            <fmt:formatDate var="noteDayKey" value="${note.regDt}" pattern="yyyyMMdd" />
                            <c:choose>
                                <c:when test="${todayKey eq noteDayKey}">
                                    <fmt:formatDate var="noteDateText" value="${note.regDt}" pattern="HH:mm" />
                                </c:when>
                                <c:otherwise>
                                    <fmt:formatDate var="noteDateText" value="${note.regDt}" pattern="MM/dd" />
                                </c:otherwise>
                            </c:choose>

                            <article class="note-card" data-note-id="${note.noteId}">
                                <div class="note-card-top">
                                    <div class="note-main-info">
                                        <div class="note-title-row">
                                            <h4 class="note-title">${note.noteTitle}</h4>
                                            <button type="button"
                                                    class="note-pin-btn ${note.pinned ? 'is-pinned' : ''}"
                                                    data-note-id="${note.noteId}"
                                                    data-pinned="${note.pinned}">
                                                ${note.pinned ? '📌 고정됨' : '📍 미고정'}
                                            </button>
                                        </div>
                                    </div>
                                    <div class="note-date">${noteDateText}</div>
                                </div>

                                <div class="note-chips">
                                    <c:if test="${not empty note.fileList}">
                                        <span class="note-chip file">첨부 ${note.fileList.size()}개</span>
                                    </c:if>
                                </div>

                                <div class="note-preview">
                                    <c:choose>
                                        <c:when test="${not empty note.memo}">
                                            <div class="preview-block">
                                                <div class="preview-label">메모</div>
                                                <div class="preview-text">${note.memo}</div>
                                            </div>
                                        </c:when>
                                        <c:otherwise>
                                            <div class="preview-block">
                                                <div class="preview-label">메모</div>
                                                <div class="preview-text">작성된 메모가 없습니다.</div>
                                            </div>
                                        </c:otherwise>
                                    </c:choose>
                                </div>

                                <c:if test="${not empty note.fileList}">
                                    <div class="note-image-grid">
                                        <c:forEach var="file" items="${note.fileList}" varStatus="fileStatus">
                                            <c:if test="${file.fileExt eq 'jpg' or file.fileExt eq 'jpeg' or file.fileExt eq 'png' or file.fileExt eq 'gif' or file.fileExt eq 'webp' or file.fileExt eq 'JPG' or file.fileExt eq 'JPEG' or file.fileExt eq 'PNG' or file.fileExt eq 'GIF' or file.fileExt eq 'WEBP'}">
                                                <c:choose>
                                                    <c:when test="${fileStatus.index lt 3}">
                                                        <span class="note-image-link">
                                                            <img src="/project/note/view?fileId=${file.fileId}" alt="${file.originFileName}">
                                                        </span>
                                                    </c:when>
                                                    <c:when test="${fileStatus.index eq 3}">
                                                        <span class="note-image-more">+ 더 있음</span>
                                                    </c:when>
                                                </c:choose>
                                            </c:if>
                                        </c:forEach>
                                    </div>
                                </c:if>

                                <div class="note-card-footer">
                                    <a class="detail-link-text" href="/project/note/detail?noteId=${note.noteId}&wsId=${wsId}&projId=${projId}">자세히 보기 →</a>
                                </div>
                            </article>

                            <c:if test="${status.last}">
                                    </div>
                                    <button type="button" class="author-more-btn">더보기</button>
                                </section>
                            </c:if>
                        </c:forEach>
                    </div>
                </div>
            </c:when>

            <c:otherwise>
                <div class="empty-card">
                    <strong>아직 작성된 노트가 없습니다.</strong>
                    <p>회의 기록, 메모, 첨부파일을 첫 노트로 남기고<br>프로젝트 메인에서 바로 확인해보세요.</p>
                    <a href="/project/note/write?wsId=${wsId}&projId=${projId}" class="empty-write-link">+ 첫 노트 작성</a>
                </div>
            </c:otherwise>
        </c:choose>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const stateKey = 'moyo-note-list-state-${projId}';

            function saveViewState() {
                const expandedAuthors = [];
                const activeNotes = {};

                document.querySelectorAll('.author-column.expanded').forEach(function(column) {
                    const author = column.dataset.author || '';
                    expandedAuthors.push(author);
                    const activeCard = column.querySelector('.note-card.active');
                    if (activeCard) activeNotes[author] = activeCard.dataset.noteId || '';
                });

                sessionStorage.setItem(stateKey, JSON.stringify({ expandedAuthors, activeNotes }));
            }

            function restoreViewState() {
                const raw = sessionStorage.getItem(stateKey);
                if (!raw) return;
                sessionStorage.removeItem(stateKey);

                try {
                    const state = JSON.parse(raw);
                    document.querySelectorAll('.author-column').forEach(function(column) {
                        const author = column.dataset.author || '';
                        if (!state.expandedAuthors || !state.expandedAuthors.includes(author)) return;

                        const cards = Array.from(column.querySelectorAll('.note-card'));
                        const moreBtn = column.querySelector('.author-more-btn');
                        column.classList.remove('collapsed');
                        column.classList.add('expanded');
                        cards.forEach(function(card) { card.classList.remove('active'); });

                        const activeId = state.activeNotes ? state.activeNotes[author] : '';
                        const activeCard = cards.find(function(card) { return card.dataset.noteId === String(activeId); }) || cards[0];
                        if (activeCard) activeCard.classList.add('active');
                        if (moreBtn) moreBtn.textContent = '간단히 보기';
                    });
                } catch (error) {
                    console.warn('노트 목록 상태 복원 실패:', error);
                }
            }

            function getPinnedGrid() {
                const section = document.querySelector('.pinned-note-section');
                if (!section) return null;

                let grid = section.querySelector('.pinned-note-grid');
                if (!grid) {
                    const empty = section.querySelector('.pinned-note-empty');
                    if (empty) empty.remove();
                    grid = document.createElement('div');
                    grid.className = 'pinned-note-grid';
                    section.appendChild(grid);
                }
                return grid;
            }

            function updatePinnedCount() {
                const section = document.querySelector('.pinned-note-section');
                if (!section) return;

                const count = section.querySelectorAll('.pinned-note-card').length;
                const countEl = section.querySelector('.pinned-note-count');
                if (countEl) countEl.textContent = count + ' / 3';

                const grid = section.querySelector('.pinned-note-grid');
                if (count === 0) {
                    if (grid) grid.remove();
                    if (!section.querySelector('.pinned-note-empty')) {
                        const empty = document.createElement('div');
                        empty.className = 'pinned-note-empty';
                        empty.textContent = '고정한 노트가 없습니다. 아래 목록에서 필요한 노트를 최대 3개까지 고정할 수 있습니다.';
                        section.appendChild(empty);
                    }
                }
            }

            function createPinnedCard(noteId) {
                const sourceCard = document.querySelector('.note-card[data-note-id="' + CSS.escape(String(noteId)) + '"]');
                if (!sourceCard) return null;

                const column = sourceCard.closest('.author-column');
                const title = sourceCard.querySelector('.note-title')?.textContent?.trim() || '노트';
                const author = column?.querySelector('.author-name')?.textContent?.trim() || '작성자';
                const preview = sourceCard.querySelector('.preview-text')?.textContent?.trim() || '작성된 메모가 없습니다.';
                const detailHref = sourceCard.querySelector('.detail-link-text')?.getAttribute('href') || '#';

                const article = document.createElement('article');
                article.className = 'pinned-note-card';
                article.dataset.noteId = String(noteId);

                const link = document.createElement('a');
                link.className = 'pinned-note-card-link';
                link.href = detailHref;
                link.setAttribute('aria-label', title + ' 자세히 보기');
                article.appendChild(link);

                const top = document.createElement('div');
                top.className = 'pinned-note-card-top';
                top.innerHTML = '<div><div class="pinned-note-card-title-row"><h4 class="pinned-note-card-title"></h4></div><div class="pinned-note-card-meta"></div></div>';
                top.querySelector('.pinned-note-card-title').textContent = title;
                top.querySelector('.pinned-note-card-meta').textContent = author;

                const pinButton = document.createElement('button');
                pinButton.type = 'button';
                pinButton.className = 'note-pin-btn is-pinned';
                pinButton.dataset.noteId = String(noteId);
                pinButton.dataset.pinned = 'true';
                pinButton.textContent = '📌 고정됨';
                top.appendChild(pinButton);
                article.appendChild(top);

                const previewEl = document.createElement('div');
                previewEl.className = 'pinned-note-card-preview';
                previewEl.textContent = preview;
                article.appendChild(previewEl);

                const sourceImages = Array.from(sourceCard.querySelectorAll('.note-image-link')).slice(0, 3);
                if (sourceImages.length > 0) {
                    const imageGrid = document.createElement('div');
                    imageGrid.className = 'pinned-note-image-grid';
                    sourceImages.forEach(function(sourceImage) {
                        const img = sourceImage.querySelector('img');
                        if (!img) return;
                        const imageLink = document.createElement('a');
                        imageLink.className = 'pinned-note-image';
                        imageLink.href = img.src;
                        imageLink.target = '_blank';
                        imageLink.rel = 'noopener';
                        const clone = img.cloneNode(true);
                        imageLink.appendChild(clone);
                        imageGrid.appendChild(imageLink);
                    });
                    article.appendChild(imageGrid);
                }

                return article;
            }

            function syncPinButtons(noteId, pinned) {
                document.querySelectorAll('.note-pin-btn[data-note-id="' + CSS.escape(String(noteId)) + '"]').forEach(function(pinButton) {
                    pinButton.dataset.pinned = String(pinned);
                    pinButton.classList.toggle('is-pinned', pinned);
                    pinButton.textContent = pinned ? '📌 고정됨' : '📍 미고정';
                    pinButton.disabled = false;
                });
            }

            function applyPinState(noteId, pinned) {
                const section = document.querySelector('.pinned-note-section');
                if (!section) return;

                if (pinned) {
                    if (!section.querySelector('.pinned-note-card[data-note-id="' + CSS.escape(String(noteId)) + '"]')) {
                        const card = createPinnedCard(noteId);
                        const grid = getPinnedGrid();
                        if (card && grid) grid.appendChild(card);
                    }
                } else {
                    const pinnedCard = section.querySelector('.pinned-note-card[data-note-id="' + CSS.escape(String(noteId)) + '"]');
                    if (pinnedCard) pinnedCard.remove();
                }

                syncPinButtons(noteId, pinned);
                updatePinnedCount();
            }

            document.addEventListener('click', async function(event) {
                const button = event.target.closest('.note-pin-btn');
                if (!button) return;

                event.preventDefault();
                event.stopPropagation();
                if (button.disabled) return;

                const noteId = button.dataset.noteId;
                const pinned = button.dataset.pinned === 'true';
                const endpoint = pinned ? '/project/note/api/unpin' : '/project/note/api/pin';
                const body = new URLSearchParams({ noteId: noteId, projId: '${projId}' });

                document.querySelectorAll('.note-pin-btn[data-note-id="' + CSS.escape(String(noteId)) + '"]').forEach(function(item) {
                    item.disabled = true;
                });

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        body: body.toString()
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        throw new Error(result.message || '노트 고정 상태를 변경하지 못했습니다.');
                    }

                    applyPinState(noteId, !pinned);
                    saveViewState();
                } catch (error) {
                    console.error(error);
                    syncPinButtons(noteId, pinned);
                    alert(error.message || '노트 고정 상태를 변경하지 못했습니다.');
                }
            });

            document.querySelectorAll('.author-column').forEach(function(column) {
                const cards = Array.from(column.querySelectorAll('.note-card'));
                const moreBtn = column.querySelector('.author-more-btn');

                if (!moreBtn || cards.length <= 1) return;

                column.classList.add('has-more');
                moreBtn.textContent = '더보기 (' + (cards.length - 1) + '개)';

                cards.forEach(function(card) {
                    const top = card.querySelector('.note-card-top');
                    if (!top) return;

                    top.addEventListener('click', function(event) {
                        if (event.target.closest('.note-pin-btn')) return;
                        if (!column.classList.contains('expanded')) return;

                        cards.forEach(function(item) { item.classList.remove('active'); });
                        card.classList.add('active');
                    });
                });

                moreBtn.addEventListener('click', function() {
                    const isCollapsed = column.classList.contains('collapsed');

                    if (isCollapsed) {
                        column.classList.remove('collapsed');
                        column.classList.add('expanded');
                        cards.forEach(function(card) { card.classList.remove('active'); });
                        cards[0].classList.add('active');
                        moreBtn.textContent = '간단히 보기';
                    } else {
                        column.classList.add('collapsed');
                        column.classList.remove('expanded');
                        cards.forEach(function(card) { card.classList.remove('active'); });
                        moreBtn.textContent = '더보기 (' + (cards.length - 1) + '개)';
                    }
                });
            });

            restoreViewState();
        });
    </script>
</body>
</html>
