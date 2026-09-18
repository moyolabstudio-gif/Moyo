<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO - 사진 ${formMode eq 'edit' ? '수정' : '등록'}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/photoPostForm.css?v=88-cleanup-final">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=20260810-inline-share-state-popover-2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonFolderModal.css?v=common-folder-modal-final-v15">
</head>
<body class="photo-post-form-body">
<jsp:include page="/WEB-INF/views/common/header.jsp" />
<main class="photo-page photo-post-form-page"
      data-context-path="${pageContext.request.contextPath}"
      data-mode="${formMode}"
      data-post-id="${postId}"
      data-scope-type="${scopeType}"
      data-scope-id="${scopeId}"
      data-selected-album-id="${selectedAlbumId}"
      data-default-moyo-public="${defaultMoyoPublic}"
      data-back-url="${backUrl}"
      data-entry-target="${entryTarget}"
      data-current-user-id="${currentUserId}">
    <c:set var="photoScopeTitle" value="개인" />
    <c:if test="${scopeType eq 'WORKSPACE'}"><c:set var="photoScopeTitle" value="그룹" /></c:if>
    <c:if test="${scopeType eq 'PROJECT'}"><c:set var="photoScopeTitle" value="프로젝트" /></c:if>
    <c:set var="photoActionTitle" value="등록" />
    <c:if test="${formMode eq 'edit'}"><c:set var="photoActionTitle" value="수정" /></c:if>
    <div class="photo-shell photo-form-shell">
        <header class="photo-form-hero">
            <div class="photo-form-hero-copy">
                <span class="photo-form-title-icon" aria-hidden="true">
                    <i class="fa-regular fa-images"></i>
                </span>
                <div class="photo-form-title-row">
                    <h1 id="photoFormTitle"><c:out value="${photoScopeTitle}" /> 사진 <c:out value="${photoActionTitle}" /></h1>
                    <p id="photoFormHeroDescription">${formMode eq 'edit' ? '사진을 확인하고 편집하면서 사진 내용과 함께한 사람, 사진 위치를 정리합니다.' : '큰 화면에서 사진을 확인하면서 사진 내용과 함께한 사람, 사진 위치를 정리합니다.'}</p>
                </div>
            </div>
            <div class="photo-form-hero-actions" aria-label="사진 등록 액션">
                <button type="button" class="photo-primary-button" id="photoFormSubmit">${formMode eq 'edit' ? '수정 완료' : '등록 완료'}</button>
            </div>
        </header>

        <section class="photo-form-card">
            <div class="photo-form-main">
                <div class="photo-form-preview" id="photoFormPreview">
                    <input id="photoFormFiles" class="photo-file-input" type="file" accept="image/*" multiple>
                    <button type="button" class="photo-form-drop" id="photoFormDrop" aria-controls="photoFormFiles">
                        <i class="fa-regular fa-images"></i>
                        <strong>사진을 선택하거나 끌어다 놓으세요</strong>
                        <span>JPG, PNG, GIF, WEBP · 최대 10장 선택 가능</span>
                    </button>
                    <div class="photo-editor-toolbar" id="photoEditorToolbar" hidden>
                        <div class="photo-editor-control-group photo-editor-control-group--basic">
                            <span class="photo-editor-control-label">기본 편집</span>
                            <div class="photo-editor-tools">
                                <button type="button" data-editor-action="rotate-left"><i class="fa-solid fa-rotate-left"></i> 왼쪽</button>
                                <button type="button" data-editor-action="rotate-right"><i class="fa-solid fa-rotate-right"></i> 오른쪽</button>
                                <button type="button" data-editor-action="flip-horizontal" title="좌우 반전"><i class="fa-solid fa-left-right"></i> 좌우 반전</button>
                                <button type="button" data-editor-action="square"><i class="fa-solid fa-crop-simple"></i> 정사각형</button>
                                <button type="button" data-editor-action="original"><i class="fa-solid fa-expand"></i> 원본 비율</button>
                                <button type="button" data-editor-action="reset"><i class="fa-solid fa-arrow-rotate-left"></i> 초기화</button>
                            </div>
                        </div>
                        <div class="photo-editor-control-group photo-editor-control-group--filters">
                            <span class="photo-editor-control-label">필터</span>
                            <div class="photo-editor-filters" aria-label="사진 필터">
                                <button type="button" data-editor-action="filter-none">필터 없음</button>
                                <button type="button" data-editor-action="filter-vivid">선명</button>
                                <button type="button" data-editor-action="filter-warm">따뜻</button>
                                <button type="button" data-editor-action="filter-cool">차갑</button>
                                <button type="button" data-editor-action="filter-mono">흑백</button>
                            </div>
                        </div>
                    </div>
                    <div class="photo-form-preview-grid" id="photoFormPreviewGrid"></div>
                    <div class="photo-editor-underbar" id="photoEditorUnderbar" hidden>
                        <div class="photo-editor-control-group photo-editor-control-group--adjust">
                            <span class="photo-editor-control-label">위치 · 크기</span>
                            <div class="photo-editor-adjust-row" aria-label="사진 위치와 크기 조절">
                                <label class="photo-editor-range photo-editor-range--pan" for="photoEditorOffsetX">
                                    <span>좌우</span>
                                    <input type="range" id="photoEditorOffsetX" min="-50" max="50" step="1" value="0">
                                </label>
                                <label class="photo-editor-range photo-editor-range--zoom" for="photoEditorZoom">
                                    <span>크기</span>
                                    <input type="range" id="photoEditorZoom" min="100" max="220" step="5" value="100">
                                    <output id="photoEditorZoomValue">100%</output>
                                </label>
                                <label class="photo-editor-range photo-editor-range--pan" for="photoEditorOffsetY">
                                    <span>상하</span>
                                    <input type="range" id="photoEditorOffsetY" min="-50" max="50" step="1" value="0">
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="photo-editor-footer" id="photoEditorFooter" hidden>
                        <div class="photo-editor-thumb-row">
                            <div class="photo-editor-nav" id="photoEditorNav"><span id="photoEditorCounter">1 / 1</span></div>
                            <div class="photo-editor-thumbs" id="photoEditorThumbs" aria-label="사진 순서"></div>
                        </div>
                        <div class="photo-editor-guide"><span>썸네일을 드래그해서 사진 순서를 바꿀 수 있어요.</span></div>
                    </div>
                </div>
            </div>
            <aside class="photo-form-side" aria-label="사진 작성 정보">
                <label class="photo-field photo-field--description">
                    <span class="photo-form-info-head">
                        <span class="photo-form-info-icon" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg></span>
                        <span>사진 내용</span>
                    </span>
                    <textarea id="photoFormDescription" maxlength="1000" rows="6" placeholder="사진 내용을 남겨보세요."></textarea>
                    <small class="photo-field-count"><span id="photoFormDescriptionCount">0</span>/1000</small>
                </label>

                <div class="photo-field photo-field--together">
                    <span class="photo-form-info-head">
                        <span class="photo-form-info-icon" id="photoFormTogetherIcon" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span>
                        <span id="photoFormTogetherTitle">함께 찍은 친구</span>
                    </span>
                    <div class="photo-info-select-button photo-together-select-button">
                        <span class="photo-info-select-main">
                            <span class="photo-together-avatar-stack" id="photoTogetherAvatarStack" aria-hidden="true"></span>
                            <span class="photo-together-copy">
                                <span id="photoTogetherSummary">함께 찍은 사람을 선택하세요</span>
                                <button type="button"
                                        id="photoTogetherViewAll"
                                        class="photo-together-view-all"
                                        aria-expanded="false"
                                        hidden>
                                    전체 보기 <span aria-hidden="true">⌄</span>
                                </button>
                            </span>
                        </span>
                        <button type="button"
                                id="openPhotoTogetherPeople"
                                class="photo-info-select-action photo-info-select-action-button">선택</button>
                    </div>
                    <div id="photoTogetherExpandedList"
                         class="photo-together-expanded-list"
                         hidden></div>
                    <small id="photoTogetherGuide">사진에 함께 나온 친구를 선택할 수 있습니다.</small>
                </div>

                <div class="photo-field photo-field--location">
                    <span class="photo-form-info-head">
                        <span class="photo-form-info-icon" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4"/></svg></span>
                        <span>사진 위치</span>
                    </span>
                    <select id="photoFormAlbum" class="photo-form-backing-select" aria-hidden="true" tabindex="-1" hidden><option value="">내 사진</option></select>
                    <button type="button" id="openPhotoAlbumModal" class="photo-info-select-button photo-location-select-button">
                        <span class="photo-location-path" id="photoFormAlbumPath" title="개인 > 내 사진">
                            <span class="photo-location-path-part is-current">개인</span>
                            <span class="photo-location-path-sep" aria-hidden="true">›</span>
                            <span class="photo-location-path-part is-current">내 사진</span>
                        </span>
                        <span class="photo-info-select-action">변경</span>
                    </button>
                    <span id="photoFormAlbumLabel" class="photo-form-legacy-hidden" hidden aria-hidden="true">앨범 없이 등록</span>
                    <span id="photoFormAlbumCount" class="photo-form-legacy-hidden" hidden aria-hidden="true">0</span>
                    <small>사진이 저장될 위치입니다.</small>
                </div>

                <div class="photo-field photo-visibility-field photo-feed-public-field" id="photoFormVisibilityField">
                    <span class="photo-form-info-head">
                        <span class="photo-form-info-icon" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg></span>
                        <span id="photoFormVisibilityLabel">공개 상태</span>
                    </span>
                    <select id="photoFormVisibility"></select>
                    <label class="photo-moyo-public-check" id="photoFormMoyoBox">
                        <input type="checkbox" id="photoFormMoyoPublic">
                        <img class="photo-moyo-public-mascot"
                             src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34"
                             alt=""
                             aria-hidden="true">
                        <span class="photo-feed-public-copy">
                            <strong><span class="photo-feed-public-text">MOYO 공개</span></strong>
                            <small>체크하면 친구들의 MOYO 피드에도 함께 표시됩니다.</small>
                        </span>
                    </label>
                    <small id="photoFormVisibilityGuide">개인 사진의 MOYO 공개 여부를 설정합니다.</small>
                </div>
            </aside>
        </section>
    </div>
</main>


<div id="photoPostWorkspaceTargetSource" hidden>
    <c:forEach var="workspace" items="${photoWorkspaceList}">
        <div data-ws-id="${workspace.wsId}"
             data-ws-name="${workspace.wsName}"
             data-ws-image-path="${workspace.wsImagePath}"></div>
    </c:forEach>
</div>
<div id="photoPostProjectTargetSource" hidden>
    <c:forEach var="project" items="${photoProjectList}">
        <div data-proj-id="${project.projId}"
             data-proj-name="${project.projName}"
             data-ws-id="${project.wsId}"
             data-ws-name="${project.wsName}"></div>
    </c:forEach>
</div>
<div id="photoPostWorkspaceMemberSource" hidden>
    <c:forEach var="member" items="${photoWorkspaceMemberList}">
        <div data-user-id="${member.userId}"
             data-user-name="${member.userName}"
             data-email="${member.email}"
             data-profile-image-path="${member.profileImagePath}"
             data-ws-id="${member.wsId}"
             data-ws-name="${member.wsName}"
             data-role-name="${member.roleName}"></div>
    </c:forEach>
</div>
<div id="photoPostProjectMemberSource" hidden>
    <c:forEach var="member" items="${photoProjectMemberList}">
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
<div id="photoToast" class="photo-toast"></div>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="${pageContext.request.contextPath}/js/friendPeopleAdapter.js?v=20260807-photo-together-people"></script>
<script src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=20260810-share-status-tdz-fix"></script>
<script src="${pageContext.request.contextPath}/js/commonFolderModal.js?v=common-folder-modal-v13"></script>
<script src="${pageContext.request.contextPath}/js/photoPostForm.js?v=88-cleanup-final"></script>
</body>
</html>
