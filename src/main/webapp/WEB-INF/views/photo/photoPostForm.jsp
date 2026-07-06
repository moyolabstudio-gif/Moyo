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
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/photoAlbum.css?v=70">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/photoPostForm.css?v=71-form-final">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonShareModal.css?v=common-share-stable-v40">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPhotoAlbumModal.css?v=4">
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
                <a class="photo-form-top-link" href="${pageContext.request.contextPath}${backUrl}"><i class="fa-solid fa-arrow-left"></i> 사진첩</a>
                <div class="photo-form-title-row">
                    <h1 id="photoFormTitle"><c:out value="${photoScopeTitle}" /> 사진 <c:out value="${photoActionTitle}" /></h1>
                    <p id="photoFormHeroDescription">${formMode eq 'edit' ? '사진을 확인하고 편집하면서 설명과 앨범 정보를 정리합니다.' : '큰 화면에서 사진을 확인하면서 설명과 앨범, 공유 범위를 정리합니다.'}</p>
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
                        <div class="photo-editor-tools">
                            <button type="button" data-editor-action="rotate-left"><i class="fa-solid fa-rotate-left"></i> 왼쪽</button>
                            <button type="button" data-editor-action="rotate-right"><i class="fa-solid fa-rotate-right"></i> 오른쪽</button>
                            <button type="button" data-editor-action="square"><i class="fa-solid fa-crop-simple"></i> 정사각형</button>
                            <button type="button" data-editor-action="original"><i class="fa-solid fa-expand"></i> 원본</button>
                            <button type="button" data-editor-action="reset"><i class="fa-solid fa-arrow-rotate-left"></i> 초기화</button>
                        </div>
                        <div class="photo-editor-filters" aria-label="사진 필터">
                            <button type="button" data-editor-action="filter-none">원본</button>
                            <button type="button" data-editor-action="filter-vivid">선명</button>
                            <button type="button" data-editor-action="filter-warm">따뜻</button>
                            <button type="button" data-editor-action="filter-cool">차갑</button>
                            <button type="button" data-editor-action="filter-mono">흑백</button>
                        </div>
                    </div>
                    <div class="photo-form-preview-grid" id="photoFormPreviewGrid"></div>
                    <div class="photo-editor-underbar" id="photoEditorUnderbar" hidden>
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
                    <span>설명</span>
                    <textarea id="photoFormDescription" maxlength="1000" rows="6" placeholder="사진 설명을 남겨보세요."></textarea>
                    <small class="photo-field-count"><span id="photoFormDescriptionCount">0</span>/1000</small>
                </label>

                <div class="photo-field photo-visibility-field photo-feed-public-field" id="photoFormVisibilityField">
                    <span id="photoFormVisibilityLabel" class="photo-feed-public-title">피드 공개 <span class="post-visibility-chip photo-feed-public-title-chip">MOYO</span></span>
                    <select id="photoFormVisibility"></select>
                    <label class="photo-moyo-public-check" id="photoFormMoyoBox">
                        <input type="checkbox" id="photoFormMoyoPublic">
                        <img class="photo-moyo-public-mascot" src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" aria-hidden="true" onerror="this.style.display='none';">
                        <span class="photo-feed-public-copy">
                            <strong><span class="photo-feed-public-text">MOYO 공개</span></strong>
                            <small>체크하면 친구들의 MOYO 피드에도 함께 표시됩니다.</small>
                        </span>
                    </label>
                    <small id="photoFormVisibilityGuide">수정 화면에서는 피드 공개 여부를 표시만 합니다.</small>
                </div>

                <div class="photo-field photo-field--album">
                    <span>앨범</span>
                    <input type="hidden" id="photoFormAlbum" value="${selectedAlbumId}">
                    <button type="button" id="openPhotoAlbumModal" class="photo-album-select-button">
                        <span class="photo-album-button-copy"><i class="fa-regular fa-folder-open" aria-hidden="true"></i><span id="photoFormAlbumLabel">앨범 없이 등록</span></span>
                        <span class="photo-album-button-badge" id="photoFormAlbumCount">0</span>
                    </button>
                    <small>앨범을 선택하거나 새 앨범을 만들 수 있습니다.</small>
                </div>

                <div class="photo-field photo-share-field">
                    <span>공유</span>
                    <div class="photo-share-actions" aria-label="사진 공유 설정">
                        <button type="button" id="openPhotoPostShareModal" class="photo-share-link-button">
                            <i class="fa-solid fa-link" aria-hidden="true"></i>
                            <span>공유 대상</span>
                            <span id="photoPostShareCount" class="note-share-count" hidden>0</span>
                        </button>
                    </div>
                    <small>친구, 그룹, 프로젝트를 선택해 이 사진을 함께 볼 수 있습니다.</small>
                    <div id="photoPostShareHiddenFields" hidden></div>
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
<div id="photoPostShareInitialSource" hidden>
    <c:forEach var="share" items="${photoShareList}">
        <div data-share-id="${share.shareId}"
             data-target-type="${share.targetType}"
             data-target-id="${share.targetId}"
             data-target-name="${share.targetName}"
             data-target-subtext="${share.targetSubtext}"
             data-permission-type="${share.permissionType}"></div>
    </c:forEach>
</div>

<div id="photoPostShareModal" class="note-write-share-modal moyo-share-modal photo-post-share-modal" data-current-user-id="${currentUserId}" hidden>
    <div class="note-write-share-backdrop" data-note-share-close></div>
    <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="photoPostShareModalTitle">
        <div class="note-write-share-modal-head">
            <div>
                <h3 id="photoPostShareModalTitle">공유하기</h3>
                <p>사진 공유는 보기 권한만 전달합니다.</p>
            </div>
            <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
        </div>
        <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
            <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
            <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">그룹</button>
            <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
        </div>
        <div class="note-write-share-toolbar">
            <select id="photoPostShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
            <input type="text" id="photoPostShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
        </div>
        <div class="note-write-share-body note-write-share-body-simple">
            <div>
                <div class="note-write-share-subtitle">공유 대상</div>
                <div id="photoPostShareCandidates" class="note-write-share-list"></div>
            </div>
            <div>
                <div class="note-write-share-subtitle">공유 목록 <span id="photoPostShareModalCount" class="note-share-modal-count" hidden>0</span></div>
                <div id="photoPostShareSelected" class="note-write-share-selected"></div>
            </div>
        </div>
        <div class="note-write-share-modal-actions">
            <div>
                <button type="button" class="note-soft-btn" data-note-share-close>취소</button>
                <button type="button" id="applyPhotoPostShareModal" class="note-gradient-btn">적용</button>
            </div>
        </div>
    </section>
</div>


<div id="commonPhotoAlbumModal" class="moyo-album-modal" data-current-user-id="${currentUserId}" hidden>
    <div class="moyo-album-backdrop" data-album-modal-close></div>
    <section class="moyo-album-panel" role="dialog" aria-modal="true" aria-labelledby="commonPhotoAlbumModalTitle">
        <div class="moyo-album-head">
            <div>
                <h3 id="commonPhotoAlbumModalTitle">앨범 선택</h3>
                <p>사진을 담을 앨범을 선택하거나 새 앨범을 만들 수 있습니다.</p>
            </div>
            <button type="button" class="moyo-album-close" data-album-modal-close aria-label="닫기">×</button>
        </div>
        <div class="moyo-album-toolbar">
            <input type="text" class="moyo-album-search" data-album-search placeholder="앨범 이름 검색">
            <button type="button" class="moyo-album-create-toggle" data-album-create-toggle><i class="fa-solid fa-plus" aria-hidden="true"></i> 새 앨범</button>
        </div>
        <div class="moyo-album-create-panel" data-album-create-panel hidden>
            <div class="moyo-album-create-row">
                <input type="text" data-album-create-name maxlength="100" placeholder="새 앨범 이름">
                <button type="button" data-album-create-submit>만들기</button>
                <button type="button" data-album-create-cancel>취소</button>
            </div>
        </div>
        <div class="moyo-album-body">
            <div class="moyo-album-subtitle">앨범 목록 <span class="moyo-album-count" data-album-count>0</span></div>
            <div class="moyo-album-list" data-album-list></div>
        </div>
        <div class="moyo-album-foot">
            <div class="moyo-album-selected-summary">선택: <strong data-album-selected-text>앨범 없이 등록</strong></div>
            <div class="moyo-album-actions">
                <button type="button" class="moyo-album-soft-btn" data-album-modal-close>취소</button>
                <button type="button" class="moyo-album-gradient-btn" data-album-apply>적용</button>
            </div>
        </div>
    </section>
</div>

<div id="photoToast" class="photo-toast"></div>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="${pageContext.request.contextPath}/js/commonShareModal.js?v=common-share-stable-v40"></script>
<script src="${pageContext.request.contextPath}/js/commonPhotoAlbumModal.js?v=4-target-scope"></script>
<script src="${pageContext.request.contextPath}/js/photoPostForm.js?v=100-form-restore"></script>
</body>
</html>
