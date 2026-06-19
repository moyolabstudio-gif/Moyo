<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>노트 목록</title>
    <link rel="stylesheet" href="/css/moyoUi.css?v=moyo-ui-scope-20260617">
    <link rel="stylesheet" href="/css/note.css?v=note-list-simple-20260619">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonRichContent.css?v=rich-content-v3">
    <style>
        .note-simple-list-wrap {
            width: min(860px, calc(100% - 72px));
            max-width: 860px;
            margin: 26px auto 76px;
        }
        .note-list-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 18px;
            border-bottom: 1px solid #e7edf5;
        }
        .note-list-title-block h1 {
            margin: 0;
            color: #172033;
            font-size: 42px;
            font-weight: 800;
            letter-spacing: -.055em;
            line-height: 1.15;
        }
        .note-list-title-block p {
            margin: 8px 0 0;
            color: #8a95a5;
            font-size: 13px;
        }
        .note-list-action-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }
        .note-list-search {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 16px 0 14px;
        }
        .note-list-search input {
            flex: 1;
            height: 38px;
            border: 1px solid #dbe5f4;
            border-radius: 12px;
            padding: 0 13px;
            color: #344054;
            background: #fff;
        }
        .note-list-search button {
            height: 38px;
            padding: 0 15px;
            border: 1px solid #dbe5f4;
            border-radius: 12px;
            background: #fff;
            color: #344054;
            font-weight: 700;
            cursor: pointer;
        }
        .note-list-card-wrap {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .note-list-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            min-height: 76px;
            padding: 14px 16px;
            border: 1px solid #e2e9f3;
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 10px 26px rgba(15,23,42,.025);
            text-decoration: none;
            color: inherit;
        }
        .note-list-card:hover {
            border-color: #cfe0ff;
            box-shadow: 0 14px 32px rgba(79,125,247,.08);
        }
        .note-list-card-main {
            min-width: 0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .note-list-card-icon {
            flex: 0 0 auto;
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #98a2b3;
            font-size: 16px;
            line-height: 1;
        }
        .note-list-card-title {
            margin: 0;
            color: #172033;
            font-size: 16px;
            font-weight: 800;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .note-list-card-meta {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
            margin-top: 6px;
            color: #8a95a5;
            font-size: 12px;
        }
        .note-list-card-preview {
            margin-top: 7px;
            color: #667085;
            font-size: 13px;
            line-height: 1.35;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
        }
        .note-list-card-side {
            flex: 0 0 auto;
            color: #667085;
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
        }
        .note-list-empty {
            min-height: 220px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: 1px dashed #dbe5f4;
            border-radius: 18px;
            background: #fff;
            color: #8a95a5;
            text-align: center;
        }
        @media (max-width: 760px) {
            .note-simple-list-wrap { width: calc(100% - 28px); margin-top: 22px; }
            .note-list-head { align-items: stretch; flex-direction: column; }
            .note-list-title-block h1 { font-size: 32px; }
            .note-list-search { flex-direction: column; align-items: stretch; }
            .note-list-card { align-items: flex-start; flex-direction: column; }
            .note-list-card-side { align-self: flex-end; }
        }
    </style>
</head>
<body class="note-page-body">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<c:choose>
    <c:when test="${scope eq 'PROJECT' or scope eq 'PROJ' or (empty scope and not empty projId)}"><c:set var="noteScopeClass" value="note-scope-project" /></c:when>
    <c:when test="${scope eq 'WORKSPACE' or scope eq 'WS' or (empty scope and not empty wsId)}"><c:set var="noteScopeClass" value="note-scope-workspace" /></c:when>
    <c:otherwise><c:set var="noteScopeClass" value="note-scope-private" /></c:otherwise>
</c:choose>

<main class="note-simple-list-wrap ${noteScopeClass}">
    <div class="note-topbar">
        <div class="note-edit-topbar-left">
            <a href="/" class="note-back-link">← 홈</a>
        </div>
        <div class="note-topbar-actions note-topbar-actions-main">
            <a href="/note/write?${scopeQuery}" class="note-gradient-btn">+ 새 노트</a>
        </div>
    </div>

    <section class="note-list-head">
        <div class="note-list-title-block">
            <h1>노트 목록</h1>
            <p>${scopeLabel}에서 접근 가능한 노트를 임시 목록으로 표시합니다.</p>
        </div>
        <div class="note-list-action-row">
            <a href="/note/write?${scopeQuery}" class="note-soft-btn">작성페이지로 이동</a>
        </div>
    </section>

    <form class="note-list-search" method="get" action="/note/list">
        <input type="hidden" name="scope" value="${scope}">
        <c:if test="${not empty wsId}"><input type="hidden" name="wsId" value="${wsId}"></c:if>
        <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
        <input type="text" name="keyword" value="${keyword}" placeholder="노트 제목 또는 내용을 검색하세요">
        <button type="submit">검색</button>
    </form>

    <c:choose>
        <c:when test="${empty noteList}">
            <div class="note-list-empty">
                <strong>아직 노트가 없습니다.</strong>
                <span>새 노트를 작성하면 여기서 상세 페이지로 이동할 수 있습니다.</span>
                <a href="/note/write?${scopeQuery}" class="note-gradient-btn">새 노트 작성</a>
            </div>
        </c:when>
        <c:otherwise>
            <div class="note-list-card-wrap">
                <c:forEach var="note" items="${noteList}">
                    <a class="note-list-card" href="/note/detail?noteId=${note.noteId}&${scopeQuery}">
                        <div class="note-list-card-main">
                            <span class="note-list-card-icon" aria-hidden="true">
                                <c:choose>
                                    <c:when test="${not empty note.icon}">${note.icon}</c:when>
                                    <c:otherwise>▣</c:otherwise>
                                </c:choose>
                            </span>
                            <div style="min-width:0;">
                                <h2 class="note-list-card-title"><c:out value="${empty note.noteTitle ? '제목 없음' : note.noteTitle}" /></h2>
                                <div class="note-list-card-meta">
                                    <span><c:out value="${empty note.folderName ? '미분류' : note.folderName}" /></span>
                                    <span>·</span>
                                    <span><c:out value="${empty note.userName ? '작성자' : note.userName}" /></span>
                                    <span>·</span>
                                    <span><fmt:formatDate value="${note.regDt}" pattern="yyyy.MM.dd HH:mm" /></span>
                                    <c:if test="${note.attachmentCount gt 0}">
                                        <span>·</span>
                                        <span>첨부 ${note.attachmentCount}</span>
                                    </c:if>
                                </div>
                                <div class="note-list-card-preview"><c:out value="${note.previewText}" /></div>
                            </div>
                        </div>
                        <span class="note-list-card-side">상세 보기 →</span>
                    </a>
                </c:forEach>
            </div>
        </c:otherwise>
    </c:choose>
</main>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
