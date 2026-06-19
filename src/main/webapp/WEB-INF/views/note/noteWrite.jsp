<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>노트 작성</title>
    <link rel="stylesheet" href="/css/moyoUi.css?v=moyo-ui-scope-20260617">
    <link rel="stylesheet" href="/css/note.css?v=note-write-edit-unify-v1-20260619">
    <link rel="stylesheet" href="/css/commonShareModal.css?v=common-share-v12">
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    <script src="/js/commonCkeditor.js?v=moyo-editor-v1"></script>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonRichContent.css?v=rich-content-v3">
</head>
<body class="note-page-body">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<c:choose>
    <c:when test="${scope eq 'PROJECT' or scope eq 'PROJ' or (empty scope and not empty projId)}"><c:set var="noteScopeClass" value="note-scope-project" /></c:when>
    <c:when test="${scope eq 'WORKSPACE' or scope eq 'WS' or (empty scope and not empty wsId)}"><c:set var="noteScopeClass" value="note-scope-workspace" /></c:when>
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
    <c:set var="currentFolderName" value="폴더 선택" />
    <c:forEach var="folder" items="${folderList}">
        <c:if test="${not empty selectedFolderId and selectedFolderId eq folder.folderId}">
            <c:set var="currentFolderName" value="${folder.folderName}" />
        </c:if>
    </c:forEach>

    <div class="note-topbar">
        <div class="note-edit-topbar-left">
            <a href="/note/list?${scopeQuery}" class="note-back-link">← 노트 목록</a>
        </div>
        <div class="note-topbar-actions note-topbar-actions-main"></div>
    </div>


    <form action="/note/add" method="post" enctype="multipart/form-data" id="noteForm" class="note-editor-shell" data-draft-key="note-draft-${scope}-${wsId}-${projId}">
        <input type="hidden" id="noteScopeInput" name="scope" value="${scope}">
        <input type="hidden" id="noteWsIdInput" name="wsId" value="${wsId}">
        <input type="hidden" id="noteProjIdInput" name="projId" value="${projId}">
        <input type="hidden" id="noteEntryScope" value="${scope}">
        <input type="hidden" id="doneContent" name="doneContent" value="">
        <input type="hidden" name="nextContent" value="">
        <input type="hidden" name="issueContent" value="">
        <input type="hidden" id="noteRedirectTo" name="redirectTo" value="">
        <input type="hidden" name="changeLog" value="">

        <section class="note-doc-body">
            <div class="note-write-head note-edit-head">
                <input type="hidden" id="noteIcon" name="icon" value="📝">
                <div class="note-title-row note-edit-title-row">
                    <button type="button" id="noteIconButton" class="note-title-icon-button" aria-label="노트 아이콘 선택" title="아이콘 선택" aria-expanded="false" data-current-icon="📝">📝</button>
                    <input type="text" id="noteTitle" name="noteTitle" class="note-doc-title-input" placeholder="제목 없음" required autofocus>
                    <div class="note-write-title-actions note-edit-title-actions">
                        <span id="draftStatus" class="note-save-status note-save-status-inline">작성 중</span>
                        <button type="submit" class="note-doc-save-btn note-write-submit-top">작성 완료</button>
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
                            <span class="note-meta-value"><c:out value="${empty scopeLabel ? '개인 노트' : scopeLabel}" /></span>
                        </div>
                        <label class="note-meta-text note-meta-folder" for="noteFolder">
                            <span class="note-meta-icon" aria-hidden="true">📁</span>
                            <select id="noteFolder" name="folderId" class="note-folder-select note-meta-select" aria-label="폴더 선택">
                                <option value="">미분류</option>
                                <c:forEach var="folder" items="${folderList}">
                                    <option value="${folder.folderId}" <c:if test="${selectedFolderId eq folder.folderId}">selected</c:if>>${folder.folderName}</option>
                                </c:forEach>
                            </select>
                        </label>
                        <div class="note-edit-meta-actions" aria-label="공유와 권한 설정">
                            <button type="button" id="openNoteWriteShareModal" class="note-meta-text note-meta-share">
                                <span class="note-meta-icon" aria-hidden="true">🔗</span>
                                <span class="note-meta-value">공유</span>
                                <span id="noteWriteShareCount" class="note-share-count" hidden>0</span>
                            </button>
                            <button type="button" id="openNoteWritePermissionModal" class="note-meta-text note-meta-permission">
                                <span class="note-meta-icon" aria-hidden="true">👤</span>
                                <span class="note-meta-value">권한</span>
                                <span id="noteWritePermissionCount" class="note-share-count" hidden>0</span>
                            </button>
                        </div>
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


            <div id="noteWriteShareHiddenFields"></div>

            <div id="noteWriteWorkspaceTargetSource" hidden>
                <c:forEach var="workspace" items="${noteWorkspaceList}">
                    <div data-ws-id="${workspace.wsId}"
                         data-ws-name="${workspace.wsName}"
                         data-ws-image-path="${workspace.wsImagePath}"></div>
                </c:forEach>
            </div>
            <div id="noteWriteProjectTargetSource" hidden>
                <c:forEach var="project" items="${noteProjectList}">
                    <div data-proj-id="${project.projId}"
                         data-proj-name="${project.projName}"
                         data-ws-id="${project.wsId}"
                         data-ws-name="${project.wsName}"></div>
                </c:forEach>
            </div>

            <div id="noteWriteWorkspaceMemberSource" hidden>
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
            <div id="noteWriteProjectMemberSource" hidden>
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

            <div id="noteWriteShareModal" class="note-write-share-modal" data-current-user-id="${sessionScope.user.userId}" hidden>
                <div class="note-write-share-backdrop" data-note-share-close></div>
                <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="noteWriteShareModalTitle">
                    <div class="note-write-share-modal-head">
                        <div>
                            <h3 id="noteWriteShareModalTitle">공유하기</h3>
                            <p>공유 범위를 추가하고 보기/편집 권한을 지정합니다.</p>
                        </div>
                        <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
                    </div>

                    <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
                        <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
                        <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">워크스페이스</button>
                        <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
                    </div>

                    <div class="note-write-share-toolbar">
                        <select id="noteWriteShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
                        <input type="text" id="noteWriteShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
                    </div>

                    <div class="note-write-share-body note-write-share-body-simple">
                        <div>
                            <div class="note-write-share-subtitle">공유 대상</div>
                            <div id="noteWriteShareCandidates" class="note-write-share-list"></div>
                        </div>
                        <div>
                            <div class="note-write-share-subtitle">공유 목록 <span id="noteWriteShareModalCount" class="note-share-modal-count" hidden>0</span></div>
                            <div id="noteWriteShareSelected" class="note-write-share-selected"></div>
                        </div>
                    </div>

                    <div class="note-write-share-modal-actions">
                        
                        <div>
                            <button type="button" class="note-soft-btn" data-note-share-close>취소</button>
                            <button type="button" id="applyNoteWriteShareModal" class="note-gradient-btn">적용</button>
                        </div>
                    </div>
                </section>
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
                            <button type="button" id="saveAsTemplateButton" class="note-template-save-btn">+ 저장</button>
                        </div>
                    </div>
                </div>
            </div>


            <div class="note-editor-canvas">
                <textarea id="memo" name="memo" class="note-doc-textarea"></textarea>
            </div>

            <details class="note-attach-panel">
                <summary class="note-attach-summary">
                    <span>첨부파일</span>
                    <small>필요할 때만 파일을 추가하세요</small>
                </summary>
                <div class="note-drop-zone" id="dropZone">
                    <strong>파일을 끌어다 놓거나 클릭해서 선택하세요</strong>
                    <span>이미지, 문서, 압축파일을 여러 개 첨부할 수 있습니다.</span>
                    <input type="file" id="files" name="files" class="note-file-input" multiple>
                </div>
                <div id="selectedFileList" class="note-selected-files"></div>
            </details>
        </section>
    </form>
</main>

<script src="/js/noteEditor.js?v=note-write-edit-unify-v1-20260619"></script>
<script src="/js/commonShareModal.js?v=common-share-v12"></script>
<script>
(function () {
    function initNoteWriteShare() {
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') return;
        if (!document.getElementById('noteWriteShareModal')) return;
        window.MoyoShareModal.init({
            contentType: 'NOTE',
            bodyOpenClass: 'note-share-modal-open',
            currentUserId: document.getElementById('noteWriteShareModal')?.dataset.currentUserId || document.body?.dataset.userId || document.getElementById('userId')?.value || ''
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNoteWriteShare, { once: true });
    else initNoteWriteShare();
})();
</script>

<script>
(function(){
    const iconButton = document.getElementById('noteIconButton');
    const iconInput = document.getElementById('noteIcon');
    const iconMenu = document.getElementById('noteIconMenu');

    function openIconMenu(){
        if (!iconMenu || !iconButton) return;
        iconMenu.hidden = false;
        iconMenu.classList.add('is-open');
        iconMenu.style.display = 'grid';
        iconButton.setAttribute('aria-expanded', 'true');
    }

    function closeIconMenu(){
        if (!iconMenu || !iconButton) return;
        iconMenu.classList.remove('is-open');
        iconMenu.hidden = true;
        iconMenu.style.display = '';
        iconButton.setAttribute('aria-expanded', 'false');
    }

    function toggleIconMenu(e){
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!iconMenu) return;
        if (iconMenu.hidden || !iconMenu.classList.contains('is-open')) openIconMenu();
        else closeIconMenu();
    }

    if (iconButton && iconInput && iconMenu) {
        iconButton.addEventListener('click', toggleIconMenu);
        iconButton.addEventListener('mousedown', function(e){ e.stopPropagation(); });

        iconMenu.querySelectorAll('.note-icon-picker').forEach(function(btn){
            btn.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                const icon = btn.getAttribute('data-icon') || btn.textContent.trim() || '📝';
                iconInput.value = icon;
                iconButton.dataset.currentIcon = icon;
                iconButton.classList.remove('note-doc-icon-render');
                iconButton.textContent = icon;
                closeIconMenu();
            });
        });

        document.addEventListener('click', function(e){
            if (!iconMenu.hidden && !iconMenu.contains(e.target) && e.target !== iconButton) {
                closeIconMenu();
            }
        });

        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape') closeIconMenu();
        });
    }
})();
</script>

</body>
</html>
