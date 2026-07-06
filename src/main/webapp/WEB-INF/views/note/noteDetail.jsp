<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${note.noteTitle}</title>
    <link rel="stylesheet" href="/css/moyoUi.css?v=moyo-ui-scope-20260617">
    <link rel="stylesheet" href="/css/note.css?v=note-toolbar-boundary-v40">
    <link rel="stylesheet" href="/css/commonFolderModal.css?v=common-folder-modal-final-v15">
    <link rel="stylesheet" href="/css/commonShareModal.css?v=note-share-edit-inline-v1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonRichContent.css?v=rich-content-v3">
</head>
<body class="note-page-body">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<c:choose>
    <c:when test="${scope eq 'PROJECT' or scope eq 'PROJ' or (empty scope and not empty projId)}"><c:set var="noteScopeClass" value="note-scope-project" /></c:when>
    <c:when test="${scope eq 'WORKSPACE' or scope eq 'WS' or (empty scope and not empty wsId)}"><c:set var="noteScopeClass" value="note-scope-workspace" /></c:when>
    <c:when test="${not empty note.userId and note.userId ne sessionScope.user.userId}"><c:set var="noteScopeClass" value="note-scope-friend" /></c:when>
    <c:otherwise><c:set var="noteScopeClass" value="note-scope-private" /></c:otherwise>
</c:choose>

<c:set var="detailFolderName" value="미분류" />
<c:if test="${not empty note.folderName}"><c:set var="detailFolderName" value="${note.folderName}" /></c:if>
<c:set var="detailIcon" value="📄" />
<c:if test="${not empty note.icon}"><c:set var="detailIcon" value="${note.icon}" /></c:if>
<c:set var="isDefaultDocIcon" value="${empty note.icon or note.icon eq '📄'}" />
<c:set var="detailScopeDisplay" value="개인 노트" />
<c:set var="detailSpaceDisplay" value="" />
<c:choose>
    <c:when test="${note.scopeType eq 'PROJ' or scope eq 'PROJ' or scope eq 'PROJECT'}">
        <c:choose>
            <c:when test="${not empty note.projectName}"><c:set var="detailScopeDisplay" value="${note.projectName} · 프로젝트" /></c:when>
            <c:otherwise><c:set var="detailScopeDisplay" value="프로젝트" /></c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${note.scopeType eq 'WS' or scope eq 'WS' or scope eq 'WORKSPACE'}">
        <c:choose>
            <c:when test="${not empty note.workspaceName}"><c:set var="detailScopeDisplay" value="${note.workspaceName} · 그룹" /></c:when>
            <c:otherwise><c:set var="detailScopeDisplay" value="그룹" /></c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${not empty note.userName and note.userId ne sessionScope.user.userId}">
        <c:set var="detailScopeDisplay" value="${note.userName} · 노트" />
    </c:when>
</c:choose>

<main class="note-detail-wrap ${noteScopeClass}">
    <div class="note-topbar note-detail-topbar">
        <div class="note-edit-topbar-left">
            <a href="/note/list?${scopeQuery}" class="note-back-link">← 노트 목록</a>
        </div>
    </div>

    <article class="note-detail-shell note-detail-final-shell">
        <section class="note-detail-body note-detail-final-body">
            <div class="note-detail-headline note-detail-final-headline">
                <div class="note-detail-title-block">
                    <h1 class="note-detail-title note-detail-final-title">
                        <c:if test="${not isDefaultDocIcon}">
                            <span class="note-detail-title-icon" aria-hidden="true"><c:out value="${detailIcon}" /></span>
                        </c:if>
                        <span class="note-detail-title-text"><c:out value="${note.noteTitle}" /></span>
                    </h1>
                </div>
                <div class="note-topbar-actions-main note-detail-title-actions" aria-label="노트 수정 삭제">
                    <c:if test="${canEdit}">
                        <a href="/note/edit?noteId=${note.noteId}&${scopeQuery}" class="note-top-action-link note-top-edit-link">
                            <span aria-hidden="true">✎</span>
                            <span>수정</span>
                        </a>
                    </c:if>
                    <c:if test="${canDelete}">
                        <form action="/note/delete" method="post" class="note-top-delete-form" onsubmit="return confirm('이 노트를 삭제할까요?');">
                            <input type="hidden" name="noteId" value="${note.noteId}">
                            <input type="hidden" name="scope" value="${scope}">
                            <c:if test="${not empty wsId}"><input type="hidden" name="wsId" value="${wsId}"></c:if>
                            <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                            <button type="submit" class="note-top-action-link note-top-delete-btn">
                                <span aria-hidden="true">🗑</span>
                                <span>삭제</span>
                            </button>
                        </form>
                    </c:if>
                </div>
            </div>

            <div class="note-write-meta-panel note-write-meta-line note-detail-meta-line note-detail-meta-final" aria-label="노트 정보와 작업">
                <div class="note-detail-path-row">
                    <span class="note-meta-text note-meta-scope note-path-scope">
                        <span class="note-meta-value"><c:out value="${detailScopeDisplay}" /></span>
                    </span>
                    <span class="note-path-separator" aria-hidden="true">/</span>
                    <c:choose>
                        <c:when test="${canDelete}">
                            <button type="button"
                                    class="note-detail-folder-trigger"
                                    id="noteDetailFolderMoveBtn"
                                    title="폴더 위치 변경"
                                    data-note-id="${note.noteId}"
                                    data-folder-id="${empty note.folderId ? '' : note.folderId}"
                                    data-scope="${empty note.scopeType ? scope : note.scopeType}"
                                    data-ws-id="${empty note.wsId ? wsId : note.wsId}"
                                    data-proj-id="${empty note.projId ? projId : note.projId}">
                                <span class="note-meta-value" id="noteDetailFolderName"><c:out value="${detailFolderName}" /></span>
                                <span class="note-detail-folder-trigger-icon" aria-hidden="true">⌄</span>
                            </button>
                        </c:when>
                        <c:otherwise>
                            <span class="note-meta-text note-meta-folder">
                                <span class="note-meta-value" id="noteDetailFolderName"><c:out value="${detailFolderName}" /></span>
                            </span>
                        </c:otherwise>
                    </c:choose>
                </div>

                <div class="note-detail-info-action-row">
                    <div class="note-detail-audit-info" aria-label="작성 수정 정보">
                        <c:if test="${not empty note.userName}">
                            <span class="note-meta-text note-detail-author">
                                <span class="note-meta-label">작성자</span>
                                <span class="note-meta-value"><c:out value="${note.userName}" /></span>
                            </span>
                        </c:if>
                        <span class="note-meta-text note-detail-date">
                            <span class="note-meta-label">작성</span>
                            <span class="note-meta-value"><fmt:formatDate value="${note.regDt}" pattern="yyyy.MM.dd HH:mm" /></span>
                        </span>
                        <c:if test="${not empty note.updDt}">
                            <span class="note-meta-text note-detail-date note-detail-updated-info">
                                <span class="note-meta-label">최근 수정</span>
                                <span class="note-meta-value">
                                    <c:choose>
                                        <c:when test="${not empty note.updatedByName and note.updatedBy ne note.userId}">
                                            <span class="note-detail-updated-user"><c:out value="${note.updatedByName}" /></span>
                                            <span class="note-meta-dot" aria-hidden="true">·</span>
                                            <fmt:formatDate value="${note.updDt}" pattern="yyyy.MM.dd HH:mm" />
                                        </c:when>
                                        <c:otherwise>
                                            <fmt:formatDate value="${note.updDt}" pattern="yyyy.MM.dd HH:mm" />
                                        </c:otherwise>
                                    </c:choose>
                                </span>
                            </span>
                        </c:if>
                    </div>

                    <div class="note-detail-all-actions" aria-label="공유 권한 인쇄 중요">
                        <c:if test="${canManageShare}">
                            <div class="note-detail-share-actions">
                                <button type="button" id="openNoteDetailShareModal" class="note-meta-text note-detail-action-btn note-meta-share note-share-open-btn"
                                        data-share-content-type="NOTE" data-share-content-id="${note.noteId}">
                                    <span class="note-meta-icon note-meta-icon--moyo" aria-hidden="true"><img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt=""></span>
                                    <span class="note-meta-value">공유</span>
                                    <span id="noteDetailShareCount" class="note-share-count" hidden>0</span>
                                </button>
                                <button type="button" id="openNoteDetailPermissionModal" class="note-meta-text note-detail-action-btn note-meta-share note-share-open-btn note-detail-permission-btn"
                                        data-share-content-type="NOTE" data-share-content-id="${note.noteId}" data-share-mode="PERMISSION">
                                    <span class="note-meta-icon" aria-hidden="true">♟</span>
                                    <span class="note-meta-value">권한</span>
                                    <span id="noteDetailPermissionCount" class="note-share-count" hidden>0</span>
                                </button>
                            </div>
                            <span class="note-detail-action-divider" aria-hidden="true"></span>
                        </c:if>

                        <div class="note-detail-utility-actions" aria-label="인쇄 중요">
                            <button type="button" id="noteDetailPrintBtn" class="note-top-action-link note-top-print-btn">
                                <span aria-hidden="true">🖨</span>
                                <span>인쇄</span>
                            </button>
                            <button type="button"
                                    id="noteDetailPinBtn"
                                    class="note-top-action-link note-top-pin-btn ${note.pinned ? 'is-pinned' : ''}"
                                    data-note-id="${note.noteId}"
                                    data-pinned="${note.pinned}">
                                <span class="note-pin-icon" aria-hidden="true">${note.pinned ? '★' : '☆'}</span>
                                <span class="note-pin-label">중요</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="note-detail-paper">
                <div class="note-detail-content-wrap">
                    <div class="note-content-box moyo-rich-content ${empty note.memo ? 'note-content-empty' : ''}">
                        <c:choose>
                            <c:when test="${empty note.memo}">작성된 본문이 없습니다.</c:when>
                            <c:otherwise><c:out value="${note.memo}" escapeXml="false" /></c:otherwise>
                        </c:choose>
                    </div>
                </div>
            </div>

            <details class="note-attach-panel note-detail-attach-compact" <c:if test="${not empty note.fileList}">open</c:if>>
                <summary class="note-attach-summary">
                    <span>첨부파일</span>
                    <small>
                        <c:choose>
                            <c:when test="${not empty note.fileList}">${fn:length(note.fileList)}개</c:when>
                            <c:otherwise>첨부된 파일이 없습니다</c:otherwise>
                        </c:choose>
                    </small>
                </summary>
                <c:if test="${not empty note.fileList}">
                    <div class="note-attachment-grid note-detail-attachment-grid">
                        <c:forEach var="file" items="${note.fileList}">
                            <c:set var="isImageFile" value="${file.fileExt eq 'jpg' or file.fileExt eq 'jpeg' or file.fileExt eq 'png' or file.fileExt eq 'gif' or file.fileExt eq 'webp' or file.fileExt eq 'bmp' or file.fileExt eq 'JPG' or file.fileExt eq 'JPEG' or file.fileExt eq 'PNG' or file.fileExt eq 'GIF' or file.fileExt eq 'WEBP' or file.fileExt eq 'BMP'}" />
                            <div class="note-attachment-card">
                                <c:choose>
                                    <c:when test="${isImageFile}">
                                        <a class="note-attachment-preview" href="/note/view?fileId=${file.fileId}" target="_blank" rel="noopener" title="${file.originFileName}">
                                            <img src="/note/view?fileId=${file.fileId}" alt="${file.originFileName}">
                                        </a>
                                    </c:when>
                                    <c:otherwise>
                                        <a class="note-attachment-preview note-attachment-file-icon" href="/note/download?fileId=${file.fileId}" title="${file.originFileName}">
                                            <span>📎</span>
                                        </a>
                                    </c:otherwise>
                                </c:choose>
                                <a class="note-attachment-info" href="/note/download?fileId=${file.fileId}" title="${file.originFileName}">
                                    <span class="note-file-name"><c:out value="${file.originFileName}" /></span>
                                    <span class="note-file-meta">
                                        <c:if test="${not empty file.fileExt}"><span class="note-file-ext">${fn:toUpperCase(file.fileExt)}</span><span aria-hidden="true">·</span></c:if>
                                        <span class="note-file-size">
                                            <c:choose>
                                                <c:when test="${file.fileSize lt 1024}">${file.fileSize} B</c:when>
                                                <c:when test="${file.fileSize lt 1048576}"><fmt:formatNumber value="${file.fileSize / 1024}" maxFractionDigits="0"/> KB</c:when>
                                                <c:otherwise><fmt:formatNumber value="${file.fileSize / 1048576}" maxFractionDigits="1"/> MB</c:otherwise>
                                            </c:choose>
                                        </span>
                                    </span>
                                </a>
                            </div>
                        </c:forEach>
                    </div>
                </c:if>
            </details>
        </section>
    </article>
    <section class="note-reply-section">
        <h2 class="note-reply-title">💬 피드백 ${fn:length(replyList)}</h2>
        <form class="note-reply-form" action="/note/reply/add" method="post">
            <input type="hidden" name="noteId" value="${note.noteId}">
            <input type="hidden" name="scope" value="${scope}">
            <c:if test="${not empty wsId}"><input type="hidden" name="wsId" value="${wsId}"></c:if>
            <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
            <textarea name="replyContent" class="note-reply-input" placeholder="확인한 내용이나 의견을 남겨주세요." required></textarea>
            <button type="submit" class="note-reply-submit-btn">등록</button>
        </form>

        <div class="note-reply-list">
            <c:choose>
                <c:when test="${not empty replyList}">
                    <c:forEach var="reply" items="${replyList}">
                        <div class="note-reply-item" id="reply-${reply.replyId}">
                            <div class="note-reply-main">
                                <div class="note-reply-view" id="reply-view-${reply.replyId}">
                                    <div class="note-reply-head">
                                        <div class="note-reply-meta">
                                            <span class="note-reply-author"><c:out value="${reply.userName}" /></span>
                                            <span class="note-reply-date">
                                                <fmt:formatDate value="${reply.regDt}" pattern="yyyy.MM.dd HH:mm" />
                                                <c:if test="${not empty reply.updDt}"> · 수정 <fmt:formatDate value="${reply.updDt}" pattern="yyyy.MM.dd HH:mm" /></c:if>
                                            </span>
                                        </div>
                                        <c:if test="${reply.userId eq loginUserId}">
                                            <div class="note-reply-actions" id="reply-actions-${reply.replyId}">
                                                <button type="button" class="note-reply-edit" onclick="toggleReplyEdit('${reply.replyId}', true)">수정</button>
                                                <span class="note-reply-action-divider">·</span>
                                                <form action="/note/reply/delete" method="post" onsubmit="return confirm('피드백을 삭제할까요?');" style="margin:0;">
                                                    <input type="hidden" name="replyId" value="${reply.replyId}">
                                                    <input type="hidden" name="noteId" value="${note.noteId}">
                                                    <input type="hidden" name="scope" value="${scope}">
                                                    <c:if test="${not empty wsId}"><input type="hidden" name="wsId" value="${wsId}"></c:if>
                                                    <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                                                    <button type="submit" class="note-reply-delete">삭제</button>
                                                </form>
                                            </div>
                                        </c:if>
                                    </div>
                                    <div class="note-reply-content"><c:out value="${reply.replyContent}" /></div>
                                </div>
                                <c:if test="${reply.userId eq loginUserId}">
                                    <form id="reply-edit-${reply.replyId}" class="note-reply-edit-form" action="/note/reply/update" method="post">
                                        <input type="hidden" name="replyId" value="${reply.replyId}">
                                        <input type="hidden" name="noteId" value="${note.noteId}">
                                        <input type="hidden" name="scope" value="${scope}">
                                        <c:if test="${not empty wsId}"><input type="hidden" name="wsId" value="${wsId}"></c:if>
                                        <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                                        <textarea name="replyContent" class="note-reply-edit-input" required><c:out value="${reply.replyContent}" /></textarea>
                                        <div class="note-reply-edit-actions">
                                            <button type="button" class="note-reply-cancel" onclick="toggleReplyEdit('${reply.replyId}', false)">취소</button>
                                            <button type="submit" class="note-reply-save">저장</button>
                                        </div>
                                    </form>
                                </c:if>
                            </div>
                        </div>
                    </c:forEach>
                </c:when>
                <c:otherwise>
                    <div class="note-reply-empty-compact">
                        <span class="note-reply-empty-icon" aria-hidden="true">💬</span>
                        <span>아직 등록된 피드백이 없습니다.</span>
                    </div>
                </c:otherwise>
            </c:choose>
        </div>
    </section>
</main>


<section id="notePrintDocument" class="note-print-document" aria-label="노트 인쇄 문서">
    <div class="note-print-page">
        <header class="note-print-header">
            <h1 class="note-print-title">
                <c:if test="${not isDefaultDocIcon}"><span class="note-print-title-icon" aria-hidden="true"><c:out value="${detailIcon}" /></span></c:if>
                <span><c:out value="${note.noteTitle}" /></span>
            </h1>
            <div class="note-print-meta">
                <span><c:out value="${detailScopeDisplay}" /></span>
                <c:if test="${not empty detailSpaceDisplay}"><span><c:out value="${detailSpaceDisplay}" /></span></c:if>
                <span><c:out value="${detailFolderName}" /></span>
                <c:if test="${not empty note.userName}"><span>작성자 <c:out value="${note.userName}" /></span></c:if>
                <span>작성 <fmt:formatDate value="${note.regDt}" pattern="yyyy.MM.dd HH:mm" /></span>
                <c:if test="${not empty note.updDt}">
                    <span>
                        최근 수정
                        <c:if test="${not empty note.updatedByName and note.updatedBy ne note.userId}"> <c:out value="${note.updatedByName}" /></c:if>
                        <fmt:formatDate value="${note.updDt}" pattern="yyyy.MM.dd HH:mm" />
                    </span>
                </c:if>
            </div>
        </header>

        <main class="note-print-content moyo-rich-content">
            <c:choose>
                <c:when test="${empty note.memo}">작성된 본문이 없습니다.</c:when>
                <c:otherwise><c:out value="${note.memo}" escapeXml="false" /></c:otherwise>
            </c:choose>
        </main>

        <c:if test="${not empty note.fileList}">
            <section class="note-print-attachments">
                <h2>첨부파일</h2>
                <ul>
                    <c:forEach var="file" items="${note.fileList}">
                        <li>
                            <c:out value="${file.originFileName}" />
                            <span>
                                <c:if test="${not empty file.fileExt}">${fn:toUpperCase(file.fileExt)} · </c:if>
                                <c:choose>
                                    <c:when test="${file.fileSize lt 1024}">${file.fileSize} B</c:when>
                                    <c:when test="${file.fileSize lt 1048576}"><fmt:formatNumber value="${file.fileSize / 1024}" maxFractionDigits="0"/> KB</c:when>
                                    <c:otherwise><fmt:formatNumber value="${file.fileSize / 1048576}" maxFractionDigits="1"/> MB</c:otherwise>
                                </c:choose>
                            </span>
                        </li>
                    </c:forEach>
                </ul>
            </section>
        </c:if>
    </div>
</section>

<c:if test="${param.authError eq 'edit'}"><script>alert('노트 수정은 작성자만 할 수 있습니다.');</script></c:if>
<c:if test="${param.authError eq 'delete'}"><script>alert('이 노트를 삭제할 권한이 없습니다.');</script></c:if>
<c:if test="${param.authError eq 'file'}"><script>alert('첨부파일 수정은 노트 작성자만 할 수 있습니다.');</script></c:if>


<c:if test="${canManageShare}">
    <div id="noteDetailShareHiddenFields" hidden></div>

    <div id="noteDetailWorkspaceTargetSource" hidden>
        <c:forEach var="workspace" items="${noteWorkspaceList}">
            <div data-ws-id="${workspace.wsId}"
                 data-ws-name="${workspace.wsName}"
                 data-ws-image-path="${workspace.wsImagePath}"></div>
        </c:forEach>
    </div>
    <div id="noteDetailProjectTargetSource" hidden>
        <c:forEach var="project" items="${noteProjectList}">
            <div data-proj-id="${project.projId}"
                 data-proj-name="${project.projName}"
                 data-ws-id="${project.wsId}"
                 data-ws-name="${project.wsName}"></div>
        </c:forEach>
    </div>
    <div id="noteDetailWorkspaceMemberSource" hidden>
        <c:forEach var="member" items="${noteWorkspaceMemberList}">
            <div data-user-id="${member.userId}"
                 data-user-name="${member.userName}"
                 data-email="${member.email}"
                 data-profile-image-path="${member.profileImagePath}"
                 data-ws-id="${member.wsId}"
                 data-ws-name="${member.wsName}"
                 data-role-name="${member.roleName}"></div>
        </c:forEach>
    </div>
    <div id="noteDetailProjectMemberSource" hidden>
        <c:forEach var="member" items="${noteProjectMemberList}">
            <div data-user-id="${member.userId}"
                 data-user-name="${member.userName}"
                 data-email="${member.email}"
                 data-profile-image-path="${member.profileImagePath}"
                 data-ws-id="${member.wsId}"
                 data-ws-name="${member.wsName}"
                 data-proj-id="${member.projId}"
                 data-proj-name="${member.projName}"
                 data-role-name="${member.roleName}"></div>
        </c:forEach>
    </div>
    <div id="noteDetailShareInitialSource" hidden>
        <c:forEach var="share" items="${noteShareList}">
            <div data-share-id="${share.shareId}"
                 data-target-type="${share.targetType}"
                 data-target-id="${share.targetId}"
                 data-permission-type="${share.permissionType}"
                 data-share-status="${share.shareStatus}"
                 data-target-name="${fn:escapeXml(share.targetName)}"
                 data-target-subtext="${fn:escapeXml(share.targetSubtext)}"></div>
        </c:forEach>
    </div>

    <div id="noteDetailShareModal" class="note-write-share-modal moyo-share-modal note-detail-share-modal" data-current-user-id="${sessionScope.user.userId}" hidden>
        <div class="note-write-share-backdrop" data-note-share-close></div>
        <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="noteDetailShareModalTitle">
            <div class="note-write-share-modal-head">
                <div>
                    <h3 id="noteDetailShareModalTitle">공유하기</h3>
                    <p>공유는 보기 범위만 정하고, 편집은 권한에서 따로 지정합니다.</p>
                </div>
                <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
            </div>
            <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
                <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
                <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">워크스페이스</button>
                <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
            </div>
            <div class="note-write-share-toolbar">
                <select id="noteDetailShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
                <input type="text" id="noteDetailShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
            </div>
            <div class="note-write-share-body note-write-share-body-simple">
                <div>
                    <div class="note-write-share-subtitle">공유 대상</div>
                    <div id="noteDetailShareCandidates" class="note-write-share-list"></div>
                </div>
                <div>
                    <div class="note-write-share-subtitle">공유 목록 <span id="noteDetailShareModalCount" class="note-share-modal-count" hidden>0</span></div>
                    <div id="noteDetailShareSelected" class="note-write-share-selected"></div>
                </div>
            </div>
            <div class="note-write-share-modal-actions">
                <div>
                    <button type="button" class="note-soft-btn" data-note-share-close>취소</button>
                    <button type="button" id="applyNoteDetailShareModal" class="note-gradient-btn">적용</button>
                </div>
            </div>
        </section>
    </div>
</c:if>


<c:if test="${canDelete}">
<div class="nl-modal-backdrop common-folder-modal note-detail-folder-modal" id="noteDetailMoveModal" hidden>
    <section class="nl-move-modal" role="dialog" aria-modal="true" aria-labelledby="noteDetailMoveModalTitle">
        <div class="nl-modal-head">
            <div>
                <h2 id="noteDetailMoveModalTitle">폴더 이동</h2>
                <p id="noteDetailMoveModalDescription">노트가 저장될 위치를 선택합니다.</p>
            </div>
            <div class="nl-modal-head-actions">
                <button type="button" class="nl-modal-folder-create" id="noteDetailModalFolderCreate">
                    <span aria-hidden="true">＋</span> 새 폴더
                </button>
                <button type="button" class="nl-modal-close" id="noteDetailMoveModalClose" aria-label="닫기">×</button>
            </div>
        </div>
        <div class="nl-folder-choice-list" id="noteDetailMoveFolderList"></div>
    </section>
</div>
</c:if>

<script src="/js/commonShareModal.js?v=note-share-edit-inline-v1"></script>
<script>
(function () {
    function initNoteDetailShare() {
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') return;
        if (!document.getElementById('noteDetailShareModal')) return;
        window.MoyoShareModal.init({
            contentType: 'NOTE',
            contentId: document.getElementById('openNoteDetailShareModal')?.dataset.shareContentId || '',
            persist: true,
            reloadOnPersist: true,
            bodyOpenClass: 'note-share-modal-open',
            currentUserId: document.getElementById('noteDetailShareModal')?.dataset.currentUserId || document.body?.dataset.userId || '',
            ids: {
                openButton: 'openNoteDetailShareModal',
                permissionButton: 'openNoteDetailPermissionModal',
                modal: 'noteDetailShareModal',
                keyword: 'noteDetailShareKeyword',
                applyButton: 'applyNoteDetailShareModal',
                title: 'noteDetailShareModalTitle',
                context: 'noteDetailShareContext',
                candidates: 'noteDetailShareCandidates',
                selected: 'noteDetailShareSelected',
                hiddenFields: 'noteDetailShareHiddenFields',
                count: 'noteDetailShareCount',
                permissionCount: 'noteDetailPermissionCount',
                modalCount: 'noteDetailShareModalCount',
                initialSharesSource: 'noteDetailShareInitialSource',
                workspaceMemberSource: 'noteDetailWorkspaceMemberSource',
                projectMemberSource: 'noteDetailProjectMemberSource',
                workspaceTargetSource: 'noteDetailWorkspaceTargetSource',
                projectTargetSource: 'noteDetailProjectTargetSource'
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNoteDetailShare, { once: true });
    else initNoteDetailShare();
})();
</script>
<script>

function loadExternalScript(src) {
    return new Promise(function (resolve, reject) {
        const existing = document.querySelector('script[src="' + src + '"]');
        if (existing) {
            if (existing.dataset.loaded === 'true') resolve();
            else existing.addEventListener('load', resolve, { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.loaded = 'false';
        script.onload = function () {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = function () { reject(new Error('script load failed: ' + src)); };
        document.head.appendChild(script);
    });
}

async function ensurePdfLibraries() {
    if (!window.html2canvas) {
        await loadExternalScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
        await loadExternalScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
    }
}

function getSafePdfFileName() {
    const rawTitle = document.querySelector('.note-detail-title-text')?.textContent || 'note';
    return rawTitle.replace(/[\/:*?"<>|]/g, '_').trim() || 'note';
}

async function printNoteAsPdf(button) {
    const source = document.querySelector('#notePrintDocument .note-print-page');
    if (!source) {
        alert('인쇄할 노트 내용을 찾지 못했습니다.');
        return;
    }

    const originalText = button ? button.querySelector('span:last-child')?.textContent : '';
    if (button) {
        button.disabled = true;
        const label = button.querySelector('span:last-child');
        if (label) label.textContent = 'PDF 생성 중';
    }

    let stage = null;
    try {
        await ensurePdfLibraries();

        stage = document.createElement('div');
        stage.className = 'note-pdf-export-stage';
        const page = source.cloneNode(true);
        stage.appendChild(page);
        document.body.appendChild(stage);

        const canvas = await window.html2canvas(page, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: page.scrollWidth,
            windowHeight: page.scrollHeight
        });

        const jsPDF = window.jspdf.jsPDF;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const imgWidth = pageWidth;
        let imgHeight = canvas.height * imgWidth / canvas.width;
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        // html2canvas 픽셀 환산 과정에서 A4 1장 높이가 0.x~1mm 정도 초과되어
        // 빈 2페이지가 생기는 경우가 있어, 1mm 이하는 1페이지로 보정한다.
        const pageOverflowTolerance = 1.5;
        if (imgHeight <= pageHeight + pageOverflowTolerance) {
            imgHeight = pageHeight;
        }

        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > pageOverflowTolerance) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.className = 'note-pdf-print-frame';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = function () {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                window.open(blobUrl, '_blank');
            }
            setTimeout(function () {
                iframe.remove();
                URL.revokeObjectURL(blobUrl);
            }, 60000);
        };
    } catch (e) {
        console.error(e);
        alert('PDF 인쇄 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
        if (stage) stage.remove();
        if (button) {
            button.disabled = false;
            const label = button.querySelector('span:last-child');
            if (label) label.textContent = originalText || '인쇄';
        }
    }
}


function getMoyoMediaEmbedUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = String(rawUrl).trim();
    if (!url) return '';
    if (url.indexOf('//') === 0) url = window.location.protocol + url;
    if (!/^https?:\/\//i.test(url)) return '';

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
        let videoId = '';

        if (host === 'youtu.be') {
            videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
        } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
            if (parsed.pathname.indexOf('/embed/') === 0) {
                videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
            } else if (parsed.pathname.indexOf('/shorts/') === 0) {
                videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
            } else {
                videoId = parsed.searchParams.get('v') || '';
            }
        }

        if (videoId) {
            const embed = new URL('https://www.youtube.com/embed/' + encodeURIComponent(videoId));
            const start = parsed.searchParams.get('start') || parsed.searchParams.get('t');
            if (start) {
                const seconds = /^\d+$/.test(start) ? start : start.replace(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/, function (_, h, m, sec) {
                    return String((Number(h || 0) * 3600) + (Number(m || 0) * 60) + Number(sec || 0));
                });
                if (/^\d+$/.test(seconds)) embed.searchParams.set('start', seconds);
            }
            embed.searchParams.set('rel', '0');
            return embed.toString();
        }

        if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
            const id = parsed.pathname.split('/').filter(Boolean).find(function (part) { return /^\d+$/.test(part); });
            if (id) return 'https://player.vimeo.com/video/' + encodeURIComponent(id);
        }
    } catch (e) {
        return '';
    }
    return '';
}

function createMoyoMediaFrame(embedUrl, sourceUrl) {
    const figure = document.createElement('figure');
    figure.className = 'media moyo-media-embed';
    if (sourceUrl) figure.dataset.oembedUrl = sourceUrl;

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = '노트 영상';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.setAttribute('allowfullscreen', 'allowfullscreen');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('frameborder', '0');

    figure.appendChild(iframe);
    return figure;
}

function normalizeNoteMediaEmbeds(root) {
    if (!root) return;

    root.querySelectorAll('oembed[url]').forEach(function (oembed) {
        const sourceUrl = oembed.getAttribute('url') || '';
        const embedUrl = getMoyoMediaEmbedUrl(sourceUrl);
        if (!embedUrl) return;
        const media = createMoyoMediaFrame(embedUrl, sourceUrl);
        const wrapper = oembed.closest('figure.media') || oembed;
        wrapper.replaceWith(media);
    });

    root.querySelectorAll('[data-oembed-url]').forEach(function (node) {
        if (node.querySelector('iframe')) return;
        const sourceUrl = node.getAttribute('data-oembed-url') || '';
        const embedUrl = getMoyoMediaEmbedUrl(sourceUrl);
        if (!embedUrl) return;
        node.replaceWith(createMoyoMediaFrame(embedUrl, sourceUrl));
    });

    root.querySelectorAll('iframe').forEach(function (iframe) {
        const sourceUrl = iframe.getAttribute('src') || iframe.closest('[data-oembed-url]')?.getAttribute('data-oembed-url') || '';
        const embedUrl = getMoyoMediaEmbedUrl(sourceUrl);
        if (embedUrl && iframe.getAttribute('src') !== embedUrl) iframe.setAttribute('src', embedUrl);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', 'allowfullscreen');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('frameborder', '0');
        if (!iframe.closest('figure.media')) {
            const figure = document.createElement('figure');
            figure.className = 'media moyo-media-embed';
            iframe.parentNode.insertBefore(figure, iframe);
            figure.appendChild(iframe);
        } else {
            iframe.closest('figure.media').classList.add('moyo-media-embed');
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const contentBox = document.querySelector('.note-detail-wrap .note-content-box.moyo-rich-content');
    if (!contentBox) return;

    normalizeNoteMediaEmbeds(contentBox);

    const isBlankNode = function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return !node.textContent.replace(/\u00a0/g, ' ').trim();
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return false;

        const clone = node.cloneNode(true);
        clone.querySelectorAll('br').forEach(function (br) { br.remove(); });
        return !clone.textContent.replace(/\u00a0/g, ' ').trim()
            && !clone.querySelector('img, video, audio, iframe, table, hr');
    };

    while (contentBox.firstChild && isBlankNode(contentBox.firstChild)) {
        contentBox.removeChild(contentBox.firstChild);
    }
    const printBtn = document.getElementById('noteDetailPrintBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function () {
            printNoteAsPdf(printBtn);
        });
    }

    const pinBtn = document.getElementById('noteDetailPinBtn');
    if (pinBtn) {
        pinBtn.addEventListener('click', function () {
            const noteId = pinBtn.dataset.noteId;
            const pinned = pinBtn.dataset.pinned === 'true';
            const url = pinned ? '/note/api/unpin' : '/note/api/pin';
            pinBtn.disabled = true;

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: 'noteId=' + encodeURIComponent(noteId)
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.success !== true) {
                    alert(data && data.message ? data.message : '중요 표시 처리에 실패했습니다.');
                    return;
                }
                const nextPinned = !pinned;
                pinBtn.dataset.pinned = String(nextPinned);
                pinBtn.classList.toggle('is-pinned', nextPinned);
                const icon = pinBtn.querySelector('.note-pin-icon');
                if (icon) icon.textContent = nextPinned ? '★' : '☆';
            })
            .catch(function () {
                alert('중요 표시 처리 중 오류가 발생했습니다.');
            })
            .finally(function () {
                pinBtn.disabled = false;
            });
        });

    }

    initNoteDetailFolderMove();

});

function initNoteDetailFolderMove() {
    const moveButton = document.getElementById('noteDetailFolderMoveBtn');
    const modal = document.getElementById('noteDetailMoveModal');
    const closeButton = document.getElementById('noteDetailMoveModalClose');
    const folderList = document.getElementById('noteDetailMoveFolderList');
    const createButton = document.getElementById('noteDetailModalFolderCreate');
    const folderNameNode = document.getElementById('noteDetailFolderName');
    if (!moveButton || !modal || !folderList) return;

    const state = {
        noteId: moveButton.dataset.noteId || '',
        folderId: moveButton.dataset.folderId || '',
        scope: moveButton.dataset.scope || 'PRIVATE',
        wsId: moveButton.dataset.wsId || '',
        projId: moveButton.dataset.projId || ''
    };
    if (state.scope === 'PROJECT') state.scope = 'PROJ';
    if (state.scope === 'WORKSPACE') state.scope = 'WS';

    const post = function (url, params) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams(params)
        }).then(function (res) { return res.json(); })
          .then(function (result) {
              if (!result || result.success !== true) throw new Error(result && result.message ? result.message : '요청을 처리하지 못했습니다.');
              return result;
          });
    };

    const folderRequestParams = function () {
        const params = new URLSearchParams({ scope: state.scope });
        if (state.wsId) params.set('wsId', state.wsId);
        if (state.projId) params.set('projId', state.projId);
        return params;
    };

    const escapeHtml = function (value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const promptFolderName = function (message, initialValue) {
        const value = window.prompt(message, initialValue || '');
        if (value == null) return null;
        const name = value.trim();
        if (!name) {
            window.alert('폴더 이름을 입력해 주세요.');
            return null;
        }
        if (name.length > 100) {
            window.alert('폴더 이름은 100자 이하로 입력해 주세요.');
            return null;
        }
        return name;
    };

    const renderChoice = function (id, name, depth) {
        const folderId = id == null ? '' : String(id);
        const isCurrent = folderId === String(state.folderId || '');
        const row = document.createElement('div');
        row.className = 'nl-folder-choice-row' + (isCurrent ? ' is-current' : '');
        row.dataset.folderId = folderId;
        row.dataset.folderName = name || '미분류';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'nl-folder-choice';
        button.dataset.folderId = folderId;
        button.disabled = isCurrent;
        button.innerHTML = '<span class="nl-folder-choice-main" style="--folder-depth:' + Math.max(0, Number(depth || 0)) + '">'
            + '<span class="nl-folder-choice-icon" aria-hidden="true">' + (id == null ? '▢' : '■') + '</span>'
            + '<span class="nl-folder-choice-name">' + escapeHtml(name || '미분류') + '</span>'
            + '</span>'
            + (isCurrent ? '<em class="nl-folder-choice-badge">현재 위치</em>' : '');
        row.appendChild(button);

        if (id != null) {
            const actions = document.createElement('div');
            actions.className = 'nl-modal-folder-actions';
            actions.innerHTML = '<button type="button" data-detail-folder-rename title="폴더 이름 수정" aria-label="폴더 이름 수정">✎</button>'
                + '<button type="button" data-detail-folder-delete title="폴더 삭제" aria-label="폴더 삭제">🗑</button>';
            row.appendChild(actions);
        }
        folderList.appendChild(row);
    };

    const loadFolders = function () {
        folderList.innerHTML = '<div class="nl-folder-choice-empty">폴더 목록을 불러오는 중입니다.</div>';
        return fetch('/note/api/folders?' + folderRequestParams().toString())
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (!result || result.success !== true) throw new Error(result && result.message ? result.message : '폴더 목록을 불러오지 못했습니다.');
                folderList.innerHTML = '';
                renderChoice(null, '미분류', 0);
                (result.folders || []).forEach(function (folder) {
                    renderChoice(folder.folderId, folder.folderName, folder.depth || 0);
                });
            });
    };

    const openModal = function () {
        loadFolders()
            .then(function () {
                modal.hidden = false;
                document.body.classList.add('nl-modal-open');
            })
            .catch(function (error) { window.alert(error.message || '폴더 목록을 불러오지 못했습니다.'); });
    };

    const closeModal = function () {
        modal.hidden = true;
        document.body.classList.remove('nl-modal-open');
    };

    moveButton.addEventListener('click', openModal);
    if (closeButton) closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', function (event) { if (event.target === modal) closeModal(); });

    if (createButton) createButton.addEventListener('click', function () {
        const folderName = promptFolderName('새 폴더 이름을 입력해 주세요.');
        if (!folderName) return;
        const params = { scope: state.scope, folderName: folderName };
        if (state.wsId) params.wsId = state.wsId;
        if (state.projId) params.projId = state.projId;
        post('/note/api/folder/create', params)
            .then(loadFolders)
            .catch(function (error) { window.alert(error.message || '폴더를 만들지 못했습니다.'); });
    });

    folderList.addEventListener('click', function (event) {
        const row = event.target.closest('.nl-folder-choice-row');
        if (!row) return;

        const renameButton = event.target.closest('[data-detail-folder-rename]');
        const deleteButton = event.target.closest('[data-detail-folder-delete]');
        if (renameButton || deleteButton) {
            event.preventDefault();
            event.stopPropagation();
            const folderId = row.dataset.folderId || '';
            const currentName = row.dataset.folderName || '';
            if (!folderId) return;
            if (renameButton) {
                const folderName = promptFolderName('수정할 폴더 이름을 입력해 주세요.', currentName);
                if (!folderName || folderName === currentName) return;
                post('/note/api/folder/rename', { folderId: folderId, folderName: folderName })
                    .then(loadFolders)
                    .catch(function (error) { window.alert(error.message || '폴더 이름을 수정하지 못했습니다.'); });
            }
            if (deleteButton) {
                if (!window.confirm("'" + currentName + "' 폴더를 삭제할까요?\n하위 폴더나 노트가 있으면 삭제할 수 없습니다.")) return;
                post('/note/api/folder/delete', { folderId: folderId })
                    .then(loadFolders)
                    .catch(function (error) { window.alert(error.message || '폴더를 삭제하지 못했습니다.'); });
            }
            return;
        }

        const choice = event.target.closest('.nl-folder-choice');
        if (!choice || choice.disabled) return;
        choice.disabled = true;
        post('/note/api/folder/move-note', { noteId: state.noteId, folderId: choice.dataset.folderId || '' })
            .then(function () {
                state.folderId = choice.dataset.folderId || '';
                if (folderNameNode) folderNameNode.textContent = row.dataset.folderName || '미분류';
                closeModal();
            })
            .catch(function (error) {
                window.alert(error.message || '폴더를 이동하지 못했습니다.');
                choice.disabled = false;
            });
    });
}

function toggleReplyEdit(replyId, editing) {
    const item = document.getElementById('reply-' + replyId);
    const view = document.getElementById('reply-view-' + replyId);
    const form = document.getElementById('reply-edit-' + replyId);
    const actions = document.getElementById('reply-actions-' + replyId);
    if (!view || !form) return;

    if (item) item.classList.toggle('is-editing', editing);
    view.style.display = editing ? 'none' : '';
    form.style.display = editing ? 'flex' : 'none';
    if (actions) actions.style.display = editing ? 'none' : '';

    if (editing) {
        const input = form.querySelector('textarea');
        if (input) input.focus();
    }
}
</script>

</body>
</html>
