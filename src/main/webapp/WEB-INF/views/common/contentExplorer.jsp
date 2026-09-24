<%@ page contentType="text/html; charset=UTF-8" %><%@ taglib prefix="c" uri="jakarta.tags.core" %><%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="isPhotoExplorer" value="${contentType eq 'PHOTO'}"/>
<c:set var="isNoteExplorer" value="${contentType eq 'NOTE'}"/>
<c:set var="containerLabel" value="${isPhotoExplorer ? '앨범' : (isNoteExplorer ? '라이브러리' : '폴더')}"/>
<c:set var="itemLabel" value="${isPhotoExplorer ? '사진' : (isNoteExplorer ? '노트' : '파일')}"/>
<c:set var="newContainerLabel" value="${isPhotoExplorer ? '새 앨범' : (isNoteExplorer ? '새 라이브러리' : '새 폴더')}"/>
<c:set var="createItemLabel" value="${isPhotoExplorer ? '사진 올리기' : (isNoteExplorer ? '노트 만들기' : '파일 올리기')}"/>
<!DOCTYPE html><html lang="ko"><head>    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pageTitle}</title><link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=primary-gradient-135-v1-20260910"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentExplorer.css?v=explorer-resize-fold-v1-20260919"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=primary-gradient-135-v1-20260910"><c:choose><c:when test="${isPhotoExplorer}"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/photoContentExplorer.css?v=20260810-album-layer-clean-1"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPhotoPostDetail.css?v=20260809-fit-atomic"></c:when><c:when test="${isNoteExplorer}"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentCard.css?v=note-card-common-v2"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonCkeditor.css?v=moyo-ckeditor-common-v2"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonNoteModal.css?v=20260822-toolbar-fix-5"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonNoteHistoryModal.css?v=common-note-history-v2"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/noteContentExplorer.css?v=20260810-regression-cleanup-1"><script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script><script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script></c:when><c:otherwise><link rel="stylesheet" href="${pageContext.request.contextPath}/css/fileContentExplorer.css?v=common-list-20260810-2"></c:otherwise></c:choose><link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonFolderModal.css"><c:if test="${isPhotoExplorer}"><c:if test="${not empty wsId}"><link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberProfile.css?v=20260808-photo-group-profile"></c:if></c:if></head>
<body data-context-path="${pageContext.request.contextPath}" data-current-user-id="${sessionScope.user.userId}"><jsp:include page="/WEB-INF/views/common/header.jsp" />
<main class="file-explorer" data-content-type="${contentType}" data-scope="${scopeType}" data-scope-id="${scopeId}" data-ws-id="${wsId}" data-proj-id="${projId}" data-project-name="<c:out value='${not empty projectDetail ? projectDetail.projName : ""}'/>" data-context="${pageContext.request.contextPath}" data-personal-root="${personalRoot}" data-current-user-id="${sessionScope.user.userId}">
 <header class="file-explorer__header">
  <div class="file-explorer__title-wrap">
   <span class="file-explorer__title-icon" aria-hidden="true">
    <c:choose>
     <c:when test="${isPhotoExplorer}"><i class="fa-regular fa-images"></i></c:when>
     <c:when test="${isNoteExplorer}"><i class="fa-regular fa-note-sticky"></i></c:when>
     <c:otherwise><i class="fa-regular fa-folder-open"></i></c:otherwise>
    </c:choose>
   </span>
   <div><h1>${pageTitle}</h1><p><c:choose><c:when test="${isPhotoExplorer}">앨범으로 나누고, 필요한 사진을 빠르게 찾아보세요.</c:when><c:when test="${isNoteExplorer}">라이브러리로 나누고, 필요한 노트를 빠르게 찾아보세요.</c:when><c:otherwise>폴더로 나누고, 필요한 자료를 빠르게 찾아보세요.</c:otherwise></c:choose></p></div>
  </div>
  <div class="file-explorer__header-actions">
   <button type="button" class="moyo-btn moyo-btn--ghost" data-action="new-folder"><i class="fa-solid fa-plus" aria-hidden="true"></i> ${newContainerLabel}</button>
   <button type="button" class="moyo-btn moyo-btn--primary" data-action="upload"><span aria-hidden="true">↑</span> ${createItemLabel}</button>
  </div>
 </header>
 <section class="file-explorer__shell">
  <aside class="file-tree-panel">
   <div class="file-tree-context">
    <c:choose>
     <c:when test="${not empty workspace}">
      <div class="file-tree-context__avatar${empty workspace.wsImagePath ? ' is-default' : ' has-image'}" aria-hidden="true">
       <c:if test="${not empty workspace.wsImagePath}">
        <img src="<c:out value='${workspace.wsImagePath}'/>" alt="" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
       </c:if>
       <span class="file-tree-context__fallback" ${not empty workspace.wsImagePath ? 'hidden' : ''}><c:out value="${fn:toUpperCase(fn:substring(workspace.wsName, 0, 1))}"/></span>
      </div>
      <div class="file-tree-context__text">
       <strong title="<c:out value='${workspace.wsName}'/>"><c:out value="${workspace.wsName}"/></strong>
       <span title="<c:out value='${not empty projectDetail ? projectDetail.projName : pageTitle}'/>"><c:out value="${not empty projectDetail ? projectDetail.projName : pageTitle}"/></span>
      </div>
     </c:when>
     <c:otherwise>
      <c:choose>
       <c:when test="${personalRoot}">
        <div class="file-tree-context__avatar is-personal${empty sessionScope.user.profileImagePath ? ' is-default' : ' has-image'}" aria-hidden="true">
         <c:if test="${not empty sessionScope.user.profileImagePath}">
          <img src="<c:out value='${sessionScope.user.profileImagePath}'/>" alt="" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
         </c:if>
         <span class="file-tree-context__fallback" ${not empty sessionScope.user.profileImagePath ? 'hidden' : ''}><c:out value="${fn:toUpperCase(fn:substring(sessionScope.user.userName, 0, 1))}"/></span>
        </div>
        <div class="file-tree-context__text"><strong><c:out value="${sessionScope.user.userName}"/></strong><span>내 ${itemLabel}</span></div>
       </c:when>
       <c:otherwise>
        <div class="file-tree-context__avatar is-personal" aria-hidden="true"><i class="fa-regular fa-folder-open"></i></div>
        <div class="file-tree-context__text"><strong>개인 프로젝트</strong><span><c:out value="${projectDetail.projName}"/></span></div>
       </c:otherwise>
      </c:choose>
     </c:otherwise>
    </c:choose>
   </div>
   <nav class="file-tree-navigation" aria-label="${itemLabel} 탐색">
    <div class="file-tree-quick">
     <button type="button" class="file-tree-nav-row file-tree-recent" data-tree-recent="true"><i class="fa-regular fa-clock" aria-hidden="true"></i><span>최근 ${itemLabel}</span></button>
     <c:if test="${personalRoot and (isPhotoExplorer or isNoteExplorer)}">
      <div class="file-tree-collection-group" data-tree-collection-group>
       <button type="button" class="file-tree-nav-row file-tree-collection" data-tree-collection-toggle aria-expanded="true">
        <i class="fa-solid fa-layer-group" aria-hidden="true"></i><span>모아보기</span><i class="fa-solid fa-chevron-down file-tree-collection__chevron" aria-hidden="true"></i>
       </button>
       <div class="file-tree-collection-children" data-tree-collection-children>
        <button type="button" class="file-tree-nav-row file-tree-collection-child" data-tree-collection-type="LIKED"><i class="fa-regular fa-heart" aria-hidden="true"></i><span>좋아요</span></button>
        <button type="button" class="file-tree-nav-row file-tree-collection-child" data-tree-collection-type="MOYO"><img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" aria-hidden="true"><span>MOYO 공개</span></button>
       </div>
      </div>
     </c:if>
    </div>

    <section class="file-tree-section file-tree-section--owned">
     <div class="file-tree-section__title"><c:choose><c:when test="${scopeType eq 'GROUP'}">그룹</c:when><c:when test="${scopeType eq 'PROJECT'}">프로젝트</c:when><c:otherwise>개인</c:otherwise></c:choose></div>
     <button type="button" class="file-tree-nav-row file-tree-root" data-tree-root="true">
      <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
      <span><c:choose><c:when test="${scopeType eq 'PROJECT'}"><c:out value="${projectDetail.projName}"/></c:when><c:when test="${isPhotoExplorer and scopeType eq 'GROUP'}">그룹 사진</c:when><c:when test="${isPhotoExplorer}">내 사진</c:when><c:when test="${scopeType eq 'GROUP'}">그룹 ${containerLabel}</c:when><c:otherwise>내 ${containerLabel}</c:otherwise></c:choose></span>
     </button>
     <div id="fileFolderTree" class="file-tree"></div>
    </section>

    <c:if test="${personalRoot}">
     <section id="fileFriendShareSection" class="file-tree-section file-tree-section--friend" hidden>
      <div class="file-tree-section__title">친구</div>
      <div id="fileFriendShareTree" class="file-friend-share-tree"></div>
     </section>
    </c:if>

    <c:if test="${personalRoot or scopeType eq 'GROUP'}">
     <c:set var="scopeProjects" value="${personalRoot ? personalProjects : groupProjects}"/>
     <c:if test="${not empty scopeProjects}">
      <section class="file-tree-section file-project-tree" aria-label="프로젝트 폴더">
       <div class="file-tree-section__title file-project-tree__title">프로젝트</div>
       <c:forEach var="project" items="${scopeProjects}">
        <div class="file-project-node" data-project-node="${project.projId}">
         <button type="button" class="file-project-row file-tree-nav-row" data-project-id="${project.projId}" data-project-name="<c:out value='${project.projName}'/>" data-project-ws-id="${personalRoot ? '' : wsId}">
          <i class="fa-solid fa-chevron-right file-project-row__chevron" aria-hidden="true"></i>
          <i class="fa-solid fa-folder-closed file-project-row__icon" aria-hidden="true"></i>
          <span class="file-project-row__name"><c:out value="${project.projName}"/></span>
         </button>
         <div class="file-project-children" data-project-children="${project.projId}"></div>
        </div>
       </c:forEach>
      </section>
     </c:if>
    </c:if>
   </nav>
   <div class="file-tree-trash-wrap"><button type="button" class="file-tree-trash" data-tree-trash="true"><svg class="file-tree-trash__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6.5 7l.8 13h9.4l.8-13"/><path d="M10 11v5M14 11v5"/></svg><span>휴지통</span></button></div>
   <div class="file-tree-resizer" data-tree-resizer role="separator" aria-orientation="vertical" aria-label="폴더 영역 너비 조절" tabindex="0"></div>
  </aside>
  <section class="file-browser-panel">
   <div class="file-browser-toolbar">
    <div class="file-browser-location file-browser-location--toolbar">
     <button type="button" id="fileFolderBackButton" class="file-folder-back" aria-label="이전 폴더로 이동" title="이전 폴더로 이동" hidden>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
     </button>
     <nav id="fileBreadcrumb" class="file-breadcrumb" aria-label="현재 경로"></nav>
     <span id="fileBrowserCount" class="file-breadcrumb-count">0개 항목</span>
    </div>
    <div class="file-browser-actions">
     <div class="file-search" role="search">
      <span class="file-search__icon" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
      <input id="fileSearchInput" type="search" aria-label="콘텐츠 검색" autocomplete="off" placeholder="<c:choose><c:when test="${isPhotoExplorer}">어떤 사진을 찾고 있나요?</c:when><c:when test="${isNoteExplorer}">노트에서 찾아볼까요?</c:when><c:otherwise>이 폴더에서 뭐 찾을까요?</c:otherwise></c:choose>">
      <button type="button" id="fileSearchClear" class="file-search__clear" aria-label="검색어 지우기" title="검색어 지우기" hidden><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
     </div>
     <div class="file-sort-control" data-sort-control>
      <button type="button" id="fileSortButton" class="file-sort-button" aria-haspopup="menu" aria-expanded="false">
       <span id="fileSortLabel">이름순</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div id="fileSortMenu" class="file-sort-menu" role="menu" hidden></div>
     </div><button type="button" class="view-toggle is-active" data-view="grid">▦</button><button type="button" class="view-toggle" data-view="list">☰</button>
    </div>
   </div>
   <c:if test="${personalRoot and (isPhotoExplorer or isNoteExplorer)}">
   </c:if>
   <c:if test="${not isPhotoExplorer and not isNoteExplorer}">
    <div id="fileDropZone" class="file-drop-zone"><span>${itemLabel}을 여기에 놓거나</span><button type="button" data-action="upload">${itemLabel} 선택</button></div>
   </c:if>
   <div id="fileSelectionCanvas" class="file-selection-canvas" aria-hidden="true"></div>
   <div id="fileBrowserGrid" class="file-browser-grid" aria-live="polite"></div>
   <div id="fileBrowserEmpty" class="file-browser-empty" hidden>
    <div class="file-browser-empty__icon" aria-hidden="true">
     <c:choose>
      <c:when test="${isPhotoExplorer}"><i class="fa-regular fa-images"></i></c:when>
      <c:when test="${isNoteExplorer}"><i class="fa-regular fa-note-sticky"></i></c:when>
      <c:otherwise><svg viewBox="0 0 24 24"><path d="M3.5 7.5h6l1.7 2H20.5v8.8a2.2 2.2 0 0 1-2.2 2.2H5.7a2.2 2.2 0 0 1-2.2-2.2V7.5Z"/><path d="M3.5 7.5V5.7a2.2 2.2 0 0 1 2.2-2.2h4.2l1.8 2h6.6a2.2 2.2 0 0 1 2.2 2.2v1.8"/></svg></c:otherwise>
     </c:choose>
    </div>
    <strong>아직 등록된 ${itemLabel}이 없습니다.</strong><span>${newContainerLabel}을 만들거나 ${createItemLabel}를 이용해 시작해보세요.</span>
   </div>
   <div id="fileBrowserStatus" class="file-browser-status" aria-live="polite">
    <span id="fileWorkMessage" class="file-browser-status__message">${itemLabel}을 선택하거나 ${containerLabel}으로 끌어 이동할 수 있습니다.</span>
    <div class="file-work-actions" id="fileWorkActions" hidden>
     <button type="button" data-batch-action="download"><i class="fa-solid fa-download" aria-hidden="true"></i><span>다운로드</span></button>
     <c:if test="${personalRoot}"><button type="button" id="fileBatchShareButton" data-batch-action="share" hidden><i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span>친구 공유</span></button></c:if>
     <button type="button" id="contentBatchMoyoButton" data-batch-action="moyo" hidden><img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" aria-hidden="true"><span>MOYO 공개</span></button>
     <button type="button" data-batch-action="move"><i class="fa-solid fa-arrow-right-arrow-left" aria-hidden="true"></i><span>이동</span></button>
     <button type="button" data-batch-action="trash" class="danger"><i class="fa-regular fa-trash-can" aria-hidden="true"></i><span>휴지통으로 이동</span></button>
    </div>
    <div class="file-trash-actions" id="fileTrashActions" hidden><button type="button" data-batch-action="restore">복원</button><button type="button" data-batch-action="permanent" class="danger">영구 삭제</button></div>
   </div>
  </section>
 </section>
 <c:if test="${not isPhotoExplorer and not isNoteExplorer}">
  <input id="contentFileInput" type="file" multiple hidden>
 </c:if>
 <div id="fileContextMenu" class="file-context-menu" hidden>
  <button data-command="open">열기</button>
  <button data-command="download">다운로드</button>
  <c:if test="${personalRoot}"><button data-command="share" hidden>친구 공유</button></c:if>
  <button data-command="moyo" hidden>MOYO 공개</button>
  <button data-command="rename">이름 바꾸기</button>
  <button data-command="move">이동</button>
  <hr><button data-command="delete" class="danger">휴지통으로 이동</button>
 </div>
 <dialog id="fileNameDialog" class="moyo-dialog" aria-labelledby="fileNameDialogTitle">
  <form method="dialog">
   <div class="moyo-dialog__header">
    <h2 id="fileNameDialogTitle">새 폴더</h2>
    <button type="button" class="moyo-dialog__close" data-file-dialog-close aria-label="닫기">
     <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
   </div>
   <div class="moyo-dialog__divider" aria-hidden="true"></div>
   <label class="moyo-dialog__field">
    <input id="fileNameInput" maxlength="120" autocomplete="off" aria-label="새 이름">
   </label>
   <div class="moyo-dialog__actions">
    <button id="fileNameConfirm" class="moyo-dialog__confirm" value="default">확인</button>
   </div>
  </form>
 </dialog>
</main>
<c:if test="${isNoteExplorer}"><%@ include file="commonNoteModal.jspf" %></c:if>
<c:if test="${isPhotoExplorer}"><%@ include file="commonPhotoPostDetail.jspf" %><%@ include file="commonPeopleModal.jspf" %><c:if test="${not empty wsId}"><jsp:include page="/WEB-INF/views/common/commonMemberProfile.jsp"><jsp:param name="profileScope" value="group"/><jsp:param name="scopeId" value="${wsId}"/><jsp:param name="ownerLabel" value="그룹장"/><jsp:param name="adminLabel" value="관리자"/><jsp:param name="memberLabel" value="멤버"/></jsp:include></c:if></c:if>
<script src="${pageContext.request.contextPath}/js/commonFolderModal.js"></script><script src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=20260811-scope-mode-fix-1"></script><c:choose><c:when test="${isPhotoExplorer}"><script src="${pageContext.request.contextPath}/js/friendPeopleAdapter.js?v=20260807-photo-together-people"></script><c:if test="${not empty wsId}"><script>var WORKSPACE_CONFIG={wsId:'<c:out value="${wsId}"/>',contextPath:'<c:out value="${pageContext.request.contextPath}"/>',currentUserId:Number('<c:out value="${sessionScope.user.userId}"/>'||0),isAdmin:${isWorkspaceAdmin ? 'true' : 'false'},isOwner:${isWorkspaceOwner ? 'true' : 'false'},isMember:true};</script><script src="${pageContext.request.contextPath}/js/commonMemberProfile.js?v=20260808-photo-group-profile"></script></c:if><script src="${pageContext.request.contextPath}/js/commonPhotoPostDetail.js?v=20260822-group-project-profile-3"></script><script src="${pageContext.request.contextPath}/js/photoExplorerAdapter.js?v=20260810-collection-sync-2"></script></c:when><c:when test="${isNoteExplorer}"><script src="${pageContext.request.contextPath}/js/commonCkeditor.js?v=20260907-image-guard-1"></script><script src="${pageContext.request.contextPath}/js/common/commonNoteHistoryModal.js?v=common-note-history-v2"></script><script src="${pageContext.request.contextPath}/js/common/commonNoteModal.js?v=20260811-info-state-fix-1"></script><script src="${pageContext.request.contextPath}/js/commonContentCard.js?v=20260906-global-path-fix-65"></script><script src="${pageContext.request.contextPath}/js/noteExplorerAdapter.js?v=20260907-note-card-friend-send-fix-1"></script></c:when><c:otherwise><script src="${pageContext.request.contextPath}/js/contentFileExplorerAdapter.js?v=20260810-sort-popover-1"></script></c:otherwise></c:choose><script src="${pageContext.request.contextPath}/js/common/commonContentExplorer.js?v=explorer-resize-fold-v1-20260919"></script></body></html>
