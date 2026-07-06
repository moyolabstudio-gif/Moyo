<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>노트 수정</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="/css/note.css?v=note-ckeditor-media-table-v41">
<link rel="stylesheet" href="/css/commonFolderModal.css?v=common-folder-modal-final-v15">
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    <script src="/js/commonCkeditor.js?v=moyo-editor-media-preview-v3"></script>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonRichContent.css?v=rich-content-v4-20260619">
    <link rel="stylesheet" href="/css/commonShareModal.css?v=note-share-edit-inline-v1">
</head>
<body class="note-page-body">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<c:choose>
    <c:when test="${scope eq 'PROJECT' or scope eq 'PROJ' or (empty scope and not empty projId)}"><c:set var="noteScopeClass" value="note-scope-project" /></c:when>
    <c:when test="${scope eq 'WORKSPACE' or scope eq 'WS' or (empty scope and not empty wsId)}"><c:set var="noteScopeClass" value="note-scope-workspace" /></c:when>
    <c:when test="${not empty note.userId and note.userId ne sessionScope.user.userId}"><c:set var="noteScopeClass" value="note-scope-friend" /></c:when>
    <c:otherwise><c:set var="noteScopeClass" value="note-scope-private" /></c:otherwise>
</c:choose>

<main class="note-editor-wrap ${noteScopeClass}">
    <c:set var="notePathWorkspaceName" value="" />
    <c:set var="notePathProjectName" value="" />
    <c:forEach var="workspaceItem" items="${noteWorkspaceList}">
        <c:if test="${workspaceItem.wsId eq wsId}">
            <c:set var="notePathWorkspaceName" value="${workspaceItem.wsName}" />
        </c:if>
    </c:forEach>
    <c:forEach var="projectItem" items="${noteProjectList}">
        <c:if test="${projectItem.projId eq projId}">
            <c:set var="notePathProjectName" value="${projectItem.projName}" />
            <c:if test="${empty notePathWorkspaceName}">
                <c:set var="notePathWorkspaceName" value="${projectItem.wsName}" />
            </c:if>
        </c:if>
    </c:forEach>
    <c:set var="notePathScopeDisplay" value="개인 노트" />
    <c:choose>
        <c:when test="${note.scopeType eq 'PROJ' or scope eq 'PROJ' or scope eq 'PROJECT' or (empty scope and not empty projId)}">
            <c:choose>
                <c:when test="${not empty note.projectName}"><c:set var="notePathScopeDisplay" value="${note.projectName} · 프로젝트" /></c:when>
                <c:when test="${not empty notePathProjectName}"><c:set var="notePathScopeDisplay" value="${notePathProjectName} · 프로젝트" /></c:when>
                <c:otherwise><c:set var="notePathScopeDisplay" value="프로젝트" /></c:otherwise>
            </c:choose>
        </c:when>
        <c:when test="${note.scopeType eq 'WS' or scope eq 'WS' or scope eq 'WORKSPACE' or (empty scope and not empty wsId)}">
            <c:choose>
                <c:when test="${not empty note.workspaceName}"><c:set var="notePathScopeDisplay" value="${note.workspaceName} · 그룹" /></c:when>
                <c:when test="${not empty notePathWorkspaceName}"><c:set var="notePathScopeDisplay" value="${notePathWorkspaceName} · 그룹" /></c:when>
                <c:otherwise><c:set var="notePathScopeDisplay" value="그룹" /></c:otherwise>
            </c:choose>
        </c:when>
        <c:when test="${not empty note.userId and note.userId ne sessionScope.user.userId}">
            <c:choose>
                <c:when test="${not empty note.userName}"><c:set var="notePathScopeDisplay" value="${note.userName} · 노트" /></c:when>
                <c:otherwise><c:set var="notePathScopeDisplay" value="친구 노트" /></c:otherwise>
            </c:choose>
        </c:when>
    </c:choose>
    <c:set var="currentFolderName" value="폴더 선택" />
    <c:forEach var="folder" items="${folderList}">
        <c:if test="${not empty note.folderId and note.folderId eq folder.folderId}">
            <c:set var="currentFolderName" value="${folder.folderName}" />
        </c:if>
    </c:forEach>
    <div class="note-topbar">
        <div class="note-edit-topbar-left">
            <a href="/note/detail?noteId=${note.noteId}&${scopeQuery}" class="note-back-link">← 상세로 돌아가기</a>
        </div>
        <div class="note-topbar-actions note-topbar-actions-main"></div>
    </div>


    <form action="/note/modify" method="post" enctype="multipart/form-data" id="noteForm" class="note-editor-shell" data-note-id="${note.noteId}" data-draft-key="note-draft-edit-${note.noteId}">
        <input type="hidden" name="scope" value="${scope}">
        <c:if test="${not empty wsId}"><input type="hidden" name="wsId" value="${wsId}"></c:if>
        <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
        <input type="hidden" name="noteId" value="${note.noteId}">
        <input type="hidden" id="noteRedirectTo" name="redirectTo" value="">
        <textarea id="doneContent" name="doneContent" hidden><c:out value="${note.memo}" /></textarea>
        <input type="hidden" name="nextContent" value="">
        <input type="hidden" name="issueContent" value="">
        <input type="hidden" name="changeLog" value="">

        <section class="note-doc-body">
            <div class="note-write-head note-edit-head note-edit-header-refine">
                <input type="hidden" id="noteCategory" name="category" value="GENERAL">
                <input type="hidden" id="noteIcon" name="icon" value="${empty note.icon ? '📝' : note.icon}">
                <div class="note-title-row note-edit-title-row">
                    <button type="button" id="noteIconButton" class="note-title-icon-button" aria-label="노트 아이콘 선택" title="아이콘 선택" aria-expanded="false" data-current-icon="${empty note.icon ? '📝' : note.icon}">${empty note.icon ? '📝' : note.icon}</button>
                    <input type="text" id="noteTitle" name="noteTitle" class="note-doc-title-input" value="${note.noteTitle}" placeholder="제목 없음" required autofocus>
                    <div class="note-write-title-actions note-edit-title-actions">
                        <span id="draftStatus" class="note-save-status note-save-status-inline">수정 중</span>
                        <button type="submit" form="noteForm" class="note-doc-save-btn note-write-submit-top">수정 완료</button>
                    </div>
                </div>
                <div id="noteIconMenu" class="note-icon-menu" hidden aria-label="노트 아이콘 선택">
                    <button type="button" class="note-icon-picker" data-icon="📝">📝</button>
                    <button type="button" class="note-icon-picker" data-icon="📌">📌</button>
                    <button type="button" class="note-icon-picker" data-icon="⭐">⭐</button>
                    <button type="button" class="note-icon-picker" data-icon="💡">💡</button>
                    <button type="button" class="note-icon-picker" data-icon="✅">✅</button>
                    <button type="button" class="note-icon-picker" data-icon="🐞">🐞</button>
                    <button type="button" class="note-icon-picker" data-icon="🚀">🚀</button>
                    <button type="button" class="note-icon-picker" data-icon="🔥">🔥</button>
                    <button type="button" class="note-icon-picker" data-icon="📚">📚</button>
                    <button type="button" class="note-icon-picker" data-icon="🎯">🎯</button>
                    <button type="button" class="note-icon-picker" data-icon="🧩">🧩</button>
                    <button type="button" class="note-icon-picker" data-icon="📷">📷</button>
                    <button type="button" class="note-icon-picker" data-icon="🎨">🎨</button>
                    <button type="button" class="note-icon-picker" data-icon="📎">📎</button>
                    <button type="button" class="note-icon-picker" data-icon="🔒">🔒</button>
                    <button type="button" class="note-icon-picker" data-icon="🌱">🌱</button>
                    <button type="button" class="note-icon-picker" data-icon="☕">☕</button>
                </div>
            </div>
            <div class="note-write-meta-panel note-write-meta-line note-edit-meta-refine note-edit-meta-compact note-edit-meta-with-actions" aria-label="노트 위치와 공유 설정">
                <div class="note-edit-meta-main">
                    <div class="note-edit-meta-left">
                        <div class="note-meta-text note-meta-scope">
                            <span class="note-scope-dot" aria-hidden="true"></span>
                            <span class="note-meta-value"><c:out value="${notePathScopeDisplay}" /></span>
                        </div>
                        <div class="note-meta-text note-meta-folder note-folder-picker-field">
                            <span class="note-path-separator" aria-hidden="true">/</span>
                            <select id="noteFolder" name="folderId" class="note-folder-select note-meta-select note-folder-native-select" aria-label="폴더 선택">
                                <option value="">미분류</option>
                                <c:forEach var="folder" items="${folderList}">
                                    <option value="${folder.folderId}" data-depth="${empty folder.depth ? 0 : folder.depth}" <c:if test="${note.folderId eq folder.folderId}">selected</c:if>>${folder.folderName}</option>
                                </c:forEach>
                            </select>
                            <button type="button" id="noteFolderPickerButton" class="note-folder-picker-trigger" aria-haspopup="dialog" aria-expanded="false">
                                <span id="noteFolderPickerLabel">미분류</span>
                                <i class="fa-solid fa-angle-down" aria-hidden="true"></i>
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>


            <div class="note-editor-primary-row note-editor-template-only note-editor-template-actions-row">
                <div class="note-template-section">
                    <div class="note-template-main">
                        <span class="note-editor-tool-label">⚡ 템플릿</span>
                        <div class="note-template-row" aria-label="템플릿">
                            <button type="button" class="note-template-btn" data-template="meeting">회의록</button>
                            <button type="button" class="note-template-btn" data-template="checklist">체크리스트</button>
                            <button type="button" class="note-template-btn" data-template="issue">오류 정리</button>
                            <span id="customTemplateButtons" class="note-custom-template-buttons"></span>
                            <button type="button" id="saveAsTemplateButton" class="note-template-save-btn">+ 내 템플릿</button>
                        </div>
                    </div>
                    <div class="note-template-actions note-edit-meta-actions" aria-label="공유와 권한 설정">
                            <button type="button" id="openNoteEditShareModal" class="note-meta-text note-meta-share"
                                    data-share-content-type="NOTE" data-share-content-id="${note.noteId}">
                                <span class="note-meta-icon note-meta-icon--moyo" aria-hidden="true"><img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt=""></span>
                                <span class="note-meta-value">공유</span>
                                <span id="noteEditShareCount" class="note-share-count" hidden>0</span>
                            </button>
                            <button type="button" id="openNoteEditPermissionModal" class="note-meta-text note-meta-permission"
                                    data-share-content-type="NOTE" data-share-content-id="${note.noteId}" data-share-mode="PERMISSION">
                                <span class="note-meta-icon" aria-hidden="true">👤</span>
                                <span class="note-meta-value">권한</span>
                                <span id="noteEditPermissionCount" class="note-share-count" hidden>0</span>
                            </button>
                        </div>
                </div>
            </div>

            <div id="templateSaveDialog" class="note-template-dialog" hidden>
                <div class="note-template-dialog-backdrop" data-template-dialog-close></div>
                <section class="note-template-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="templateSaveDialogTitle">
                    <div class="note-template-dialog-head">
                        <h3 id="templateSaveDialogTitle">내 템플릿 저장</h3>
                        <button type="button" class="note-template-dialog-close" data-template-dialog-close aria-label="닫기">×</button>
                    </div>
                    <p>현재 본문을 내 템플릿으로 저장합니다.</p>
                    <label for="templateNameInput">템플릿 이름</label>
                    <input type="text" id="templateNameInput" maxlength="30" placeholder="예: 주간 회의록">
                    <div class="note-template-dialog-actions">
                        <button type="button" class="note-soft-btn" data-template-dialog-close>취소</button>
                        <button type="button" id="confirmTemplateSave" class="note-gradient-btn">저장</button>
                    </div>
                </section>
            </div>

            <div class="note-editor-canvas">
                <textarea id="memo" name="memo" class="note-doc-textarea"><c:out value="${note.memo}" /></textarea>
            </div>

            <details class="note-attach-panel">
                <summary class="note-attach-summary">
                    <span>첨부파일</span>
                    <small>기존 파일 확인 또는 새 파일 추가</small>
                </summary>
                <c:if test="${not empty note.fileList}">
                    <div class="note-existing-files">
                        <c:forEach var="file" items="${note.fileList}">
                            <div class="note-existing-file">
                                <a class="note-file-row" href="/note/download?fileId=${file.fileId}">
                                    <span class="note-file-name">📎 ${file.originFileName}</span>
                                    <span class="note-file-size">${file.fileSize} bytes</span>
                                </a>
                                <button type="button" class="note-file-remove existing-file-delete-btn" data-file-id="${file.fileId}">삭제</button>
                            </div>
                        </c:forEach>
                    </div>
                </c:if>
                <div class="note-drop-zone" id="dropZone">
                    <strong>추가할 파일을 끌어다 놓거나 클릭해서 선택하세요</strong>
                    <span>기존 파일은 유지되고, 선택한 파일이 새로 추가됩니다.</span>
                    <input type="file" id="files" name="files" class="note-file-input" multiple>
                </div>
                <div id="selectedFileList" class="note-selected-files"></div>
            </details>
        </section>
    </form>
</main>

<div id="noteEditShareHiddenFields" hidden></div>

    <div id="noteEditWorkspaceTargetSource" hidden>
        <c:forEach var="workspace" items="${noteWorkspaceList}">
            <div data-ws-id="${workspace.wsId}"
                 data-ws-name="${workspace.wsName}"
                 data-ws-image-path="${workspace.wsImagePath}"></div>
        </c:forEach>
    </div>
    <div id="noteEditProjectTargetSource" hidden>
        <c:forEach var="project" items="${noteProjectList}">
            <div data-proj-id="${project.projId}"
                 data-proj-name="${project.projName}"
                 data-ws-id="${project.wsId}"
                 data-ws-name="${project.wsName}"></div>
        </c:forEach>
    </div>
    <div id="noteEditWorkspaceMemberSource" hidden>
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
    <div id="noteEditProjectMemberSource" hidden>
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
    <div id="noteEditShareInitialSource" hidden>
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

    <div id="noteEditShareModal" class="note-write-share-modal moyo-share-modal note-edit-share-modal" data-current-user-id="${sessionScope.user.userId}" hidden>
        <div class="note-write-share-backdrop" data-note-share-close></div>
        <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="noteEditShareModalTitle">
            <div class="note-write-share-modal-head">
                <div>
                    <h3 id="noteEditShareModalTitle">공유하기</h3>
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
                <select id="noteEditShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
                <input type="text" id="noteEditShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
            </div>
            <div class="note-write-share-body note-write-share-body-simple">
                <div>
                    <div class="note-write-share-subtitle">공유 대상</div>
                    <div id="noteEditShareCandidates" class="note-write-share-list"></div>
                </div>
                <div>
                    <div class="note-write-share-subtitle">공유 목록 <span id="noteEditShareModalCount" class="note-share-modal-count" hidden>0</span></div>
                    <div id="noteEditShareSelected" class="note-write-share-selected"></div>
                </div>
            </div>
            <div class="note-write-share-modal-actions">
                <div>
                    <button type="button" class="note-soft-btn" data-note-share-close>취소</button>
                    <button type="button" id="applyNoteEditShareModal" class="note-gradient-btn">적용</button>
                </div>
            </div>
        </section>
    </div>


<script src="/js/commonShareModal.js?v=note-share-edit-inline-v1"></script>
<script>
(function () {
    function initNoteEditShare() {
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') return;
        if (!document.getElementById('noteEditShareModal')) return;
        window.MoyoShareModal.init({
            contentType: 'NOTE',
            contentId: document.getElementById('openNoteEditShareModal')?.dataset.shareContentId || '',
            persist: true,
            reloadOnPersist: true,
            bodyOpenClass: 'note-share-modal-open',
            currentUserId: document.getElementById('noteEditShareModal')?.dataset.currentUserId || document.body?.dataset.userId || '',
            ids: {
                openButton: 'openNoteEditShareModal',
                permissionButton: 'openNoteEditPermissionModal',
                modal: 'noteEditShareModal',
                keyword: 'noteEditShareKeyword',
                applyButton: 'applyNoteEditShareModal',
                title: 'noteEditShareModalTitle',
                context: 'noteEditShareContext',
                candidates: 'noteEditShareCandidates',
                selected: 'noteEditShareSelected',
                hiddenFields: 'noteEditShareHiddenFields',
                count: 'noteEditShareCount',
                permissionCount: 'noteEditPermissionCount',
                modalCount: 'noteEditShareModalCount',
                initialSharesSource: 'noteEditShareInitialSource',
                workspaceMemberSource: 'noteEditWorkspaceMemberSource',
                projectMemberSource: 'noteEditProjectMemberSource',
                workspaceTargetSource: 'noteEditWorkspaceTargetSource',
                projectTargetSource: 'noteEditProjectTargetSource'
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNoteEditShare, { once: true });
    else initNoteEditShare();
})();
</script>

<script src="/js/commonFolderModal.js?v=common-folder-modal-v13"></script>
<script src="/js/noteFolderAdapter.js?v=note-folder-adapter-v10"></script>
<script src="/js/noteEditor.js?v=note-editor-folder-common-v10"></script>
</body>
</html>
