<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO - ${scopeName} 사진첩</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoModal.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/photoAlbum.css?v=display-file-output-final-1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonShareModal.css?v=246">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonFriendPickerModal.css?v=14">
</head>
<body class="note-list-page">
<jsp:include page="/WEB-INF/views/common/header.jsp" />
<main id="photoAlbumPage" class="photo-ui-shell" data-scope-type="${scopeType}" data-scope-id="${scopeId}" data-current-user-id="${currentUserId}" data-current-user-name="<c:out value='${sessionScope.user.userName}'/>" data-admin="${isScopeAdmin}" data-context-path="${pageContext.request.contextPath}">
    <div id="photoAlbumContent">
        <section id="photoTopArea" class="photo-ui-page-header" aria-label="사진첩 상단">
            <div id="photoHero" class="photo-ui-hero">
                <div>
                    <h1 id="photoHeroTitle">사진첩</h1>
                    <p id="photoHeroDescription"><c:out value="${scopeDescription}"/></p>
                </div>
                <a id="openPostModalButton" class="photo-ui-create-button" href="${pageContext.request.contextPath}/photo-post/write?scopeType=${scopeType}&amp;scopeId=${scopeId}">
                    <span aria-hidden="true">＋</span> 사진 올리기
                </a>
            </div>

            <div id="photoTopToolbar" class="photo-ui-toolbar" aria-label="사진첩 도구">
                <nav id="photoViewTabs" class="photo-ui-scope-tabs" role="tablist" aria-label="사진첩 범위">
                    <button type="button" class="photo-ui-scope-tab active is-active" data-view="posts" data-photo-tab="moyo" aria-label="MOYO 피드">MOYO</button>
                    <button type="button" class="photo-ui-scope-tab" data-view="posts" data-photo-tab="recent">최근</button>
                    <button type="button" class="photo-ui-scope-tab" data-view="posts" data-photo-tab="personal">개인</button>
                    <button type="button" class="photo-ui-scope-tab" data-view="posts" data-photo-tab="friend">친구</button>
                    <button type="button" class="photo-ui-scope-tab" data-view="posts" data-photo-tab="workspace">그룹</button>
                    <button type="button" class="photo-ui-scope-tab" data-view="posts" data-photo-tab="project">프로젝트</button>
                </nav>
                <button type="button" class="photo-ui-important-filter" data-like-filter="true" aria-pressed="false" aria-label="좋아요한 사진만 보기" title="현재 범위에서 좋아요한 사진만 보기"><i class="fa-regular fa-heart" aria-hidden="true"></i></button>
                <button type="button" class="photo-ui-trash-button" data-view="posts" data-photo-tab="trash" aria-label="사진 휴지통" title="휴지통"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
                <label id="photoSearchBox" class="photo-ui-search">
                    <span class="photo-ui-search-icon" aria-hidden="true">⌕</span>
                    <input id="postSearchInput" type="search" placeholder="사진 검색" aria-label="사진 검색">
                </label>
            </div>
        </section>

        <section id="photoFriendTargetPanel" class="photo-ui-space-picker photo-ui-space-picker-friend" hidden aria-label="친구 선택">
            <div class="photo-ui-space-picker-head">
                <div class="photo-ui-space-picker-title">
                    <strong>친구</strong>
                    <span>공유받은 사진을 친구별로 먼저 확인합니다.</span>
                </div>
            </div>
            <div class="photo-ui-horizontal-scroller photo-ui-friend-scroller" data-horizontal-scroller>
                <button type="button" class="photo-ui-scroll-button is-prev" data-scroll-prev aria-label="이전 친구">
                    <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <div class="photo-ui-scroll-viewport" data-scroll-viewport>
                    <div id="photoFriendTargetList" class="photo-ui-space-options photo-ui-friend-options">
                        <button type="button" class="photo-ui-space-option photo-ui-friend-option photo-ui-space-option-all active is-selected" data-photo-friend-target="ALL">
                            <span class="photo-ui-space-avatar photo-ui-friend-avatar photo-ui-friend-avatar-all" aria-hidden="true"><i class="fa-solid fa-users"></i></span>
                            <span class="photo-ui-friend-name-wrap">
                                <span class="photo-ui-space-name">전체 친구</span>
                                <small>공유받은 전체 사진</small>
                            </span>
                        </button>
                    </div>
                </div>
                <button type="button" class="photo-ui-scroll-button is-next" data-scroll-next aria-label="다음 친구">
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
            </div>
        </section>

        <section id="photoWorkspaceTargetPanel" class="photo-ui-space-picker photo-ui-space-picker-ws" hidden aria-label="그룹 선택">
            <div class="photo-ui-space-picker-head"><div class="photo-ui-space-picker-title"><strong>그룹</strong><span>사진을 확인할 그룹을 선택하세요.</span></div></div>
            <div class="photo-ui-horizontal-scroller photo-ui-workspace-scroller" data-horizontal-scroller>
                <button type="button" class="photo-ui-scroll-button is-prev" data-scroll-prev aria-label="이전 그룹"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                <div class="photo-ui-scroll-viewport" data-scroll-viewport><div id="photoWorkspaceTargetList" class="photo-ui-space-options"></div></div>
                <button type="button" class="photo-ui-scroll-button is-next" data-scroll-next aria-label="다음 그룹"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
            </div>
        </section>

        <div id="photoProjectTargetPanel" hidden aria-label="프로젝트 선택">
            <div class="photo-ui-space-picker photo-ui-space-picker-ws photo-ui-project-group-picker">
                <div class="photo-ui-space-picker-head">
                    <div class="photo-ui-space-picker-title">
                        <strong>그룹</strong>
                        <span>프로젝트를 확인할 그룹을 선택하세요.</span>
                    </div>
                </div>
                <div class="photo-ui-horizontal-scroller photo-ui-workspace-scroller" data-horizontal-scroller>
                    <button type="button" class="photo-ui-scroll-button is-prev" data-scroll-prev aria-label="이전 그룹"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                    <div class="photo-ui-scroll-viewport" data-scroll-viewport>
                        <div id="photoProjectWorkspaceTargetList" class="photo-ui-space-options"></div>
                    </div>
                    <button type="button" class="photo-ui-scroll-button is-next" data-scroll-next aria-label="다음 그룹"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                </div>
            </div>

            <div class="photo-ui-space-picker photo-ui-space-picker-project">
                <div class="photo-ui-space-picker-head">
                    <div class="photo-ui-space-picker-title">
                        <strong>프로젝트</strong>
                        <span>선택한 그룹의 프로젝트입니다.</span>
                    </div>
                </div>
                <div class="photo-ui-horizontal-scroller photo-ui-project-scroller" data-horizontal-scroller>
                    <button type="button" class="photo-ui-scroll-button is-prev" data-scroll-prev aria-label="이전 프로젝트"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                    <div class="photo-ui-scroll-viewport" data-scroll-viewport>
                        <div id="photoProjectTargetList" class="photo-ui-space-options photo-ui-project-options"></div>
                    </div>
                    <button type="button" class="photo-ui-scroll-button is-next" data-scroll-next aria-label="다음 프로젝트"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                </div>
            </div>
        </div>

        <section id="photoAlbumStrip" class="photo-ui-folder-explorer" aria-label="앨범" hidden>
            <div class="photo-ui-folder-head">
                <div>
                    <strong>앨범</strong>
                    <span>선택한 사진을 앨범별로 확인합니다.</span>
                </div>
            </div>
            <div class="photo-ui-horizontal-scroller photo-ui-folder-scroller" data-horizontal-scroller>
                <button type="button" class="photo-ui-scroll-button is-prev" data-scroll-prev aria-label="이전 앨범"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                <div class="photo-ui-scroll-viewport" data-scroll-viewport><div id="photoAlbumChips" class="photo-ui-folder-list">
                    <button type="button" class="photo-ui-folder-item active is-selected" data-album-filter="ALL"><i class="fa-regular fa-folder-open"></i><span>전체</span></button>
                    <button type="button" class="photo-ui-folder-item" data-album-filter="NONE"><i class="fa-regular fa-folder"></i><span>미분류</span></button>
                    <span id="photoAlbumChipList"></span>
                    <button type="button" id="openAlbumModalButton" class="photo-ui-folder-item photo-ui-folder-add-chip" title="새 앨범" aria-label="새 앨범">
                        <i class="fa-solid fa-folder-plus" aria-hidden="true"></i>
                    </button>
                </div></div>
                <button type="button" class="photo-ui-scroll-button is-next" data-scroll-next aria-label="다음 앨범"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
            </div>
        </section>

        <section id="postsView" class="photo-content-view">
            <div class="photo-toolbar photo-main-toolbar">
                <select id="photoVisibilityFilter" class="photo-filter-select" aria-label="공개 범위 필터">
                    <option value="ALL">전체 상태</option>
                    <option value="PRIVATE">나만 보기</option>
                    <option value="FRIENDS">MOYO 공개</option>
                    <option value="SELECTED">선택 공유</option>
                    <option value="WORKSPACE">그룹 공개</option>
                    <option value="PROJECT">프로젝트 공개</option>
                </select>
                <select id="photoOwnerFilter" class="photo-filter-select" aria-label="사진 작성자 필터" hidden>
                    <option value="ALL">전체 사진</option>
                    <option value="ME">내가 올린 사진</option>
                </select>
                <div id="photoFriendChips" class="moyo-friend-chips photo-friend-filter" role="group" aria-label="MOYO 최근 업로드 필터">
                    <button type="button" class="moyo-friend-chip active" data-moyo-friend="ALL">최근</button>
                </div>
                <div class="photo-toolbar-right-cluster" id="photoToolbarRightCluster" aria-label="사진 보기 필터">
                    <button type="button" class="moyo-my-feed-button" id="moyoMyFeedButton"><span class="moyo-mine-label">내 사진</span></button>
                    <div class="moyo-friend-actions" aria-label="MOYO 피드 보기 전환">
                        <button type="button" class="moyo-friend-find-button" id="openMoyoFriendPickerButton"><i class="fa-solid fa-list-ul"></i> 친구 목록</button>
                    </div>
                    <div class="photo-layout-toggle" role="group" aria-label="사진첩 보기 방식">
                        <button type="button" class="active" id="photoGridModeButton" data-photo-layout="grid"><i class="fa-solid fa-table-cells-large"></i> 정리</button>
                        <button type="button" id="photoFeedModeButton" data-photo-layout="feed"><i class="fa-regular fa-rectangle-list"></i> 피드</button>
                    </div>
                    <select id="photoSortSelect" class="photo-filter-select" aria-label="정렬">
                        <option value="LATEST">최신순</option>
                        <option value="POPULAR">인기순</option>
                    </select>
                    <button type="button" class="photo-inline-button photo-share-button" id="openPhotoShareButton" hidden><i class="fa-regular fa-paper-plane"></i> 선택 친구 공유</button>
                    <button type="button" class="photo-select-mode-button" id="photoSelectModeButton"><i class="fa-regular fa-square-check" aria-hidden="true"></i><span>선택</span></button>
                </div>
                <div class="photo-bulk-bar" id="photoBulkBar" hidden aria-label="사진 선택 작업">
                    <label class="photo-bulk-select-all"><input type="checkbox" id="photoSelectAll"><span>전체 선택</span></label>
                    <strong class="photo-bulk-count" id="photoSelectedCount">0개 선택됨</strong>
                    <div class="photo-bulk-actions">
                        <button type="button" id="photoBulkMove" data-photo-bulk-move-drop disabled><i class="fa-regular fa-folder-open" aria-hidden="true"></i> 앨범 이동</button>
                        <button type="button" id="photoBulkShare" data-photo-bulk-share-drop disabled><i class="fa-regular fa-paper-plane" aria-hidden="true"></i> 공유</button>
                        <button type="button" class="is-danger" id="photoBulkTrash" data-photo-bulk-trash-drop disabled><i class="fa-regular fa-trash-can" aria-hidden="true"></i> 휴지통 이동</button>
                    </div>
                </div>
                <div class="photo-trash-bulk-actions" id="photoTrashBulkActions" hidden aria-label="휴지통 전체 작업">
                    <span class="photo-trash-retention-guide"><i class="fa-regular fa-clock"></i> 휴지통 사진은 30일 후 자동 영구 삭제됩니다.</span>
                    <button type="button" class="photo-inline-button photo-trash-restore-all" id="restoreAllTrashButton"><i class="fa-solid fa-rotate-left"></i> 전체 복원</button>
                    <button type="button" class="photo-inline-button photo-trash-permanent-all" id="permanentlyDeleteAllTrashButton"><i class="fa-regular fa-trash-can"></i> 전체 영구 삭제</button>
                </div>
                <span id="postCountText" class="photo-count-text"></span>
            </div>
            <div id="postGrid" class="post-grid"></div>
        </section>

        <section id="albumDetailView" class="photo-content-view" hidden>
            <button class="photo-back-button" id="backToAlbumsButton"><i class="fa-solid fa-arrow-left"></i> 앨범 목록</button>
            <div class="album-detail-title-row">
                <div class="album-detail-info"><h2 id="detailAlbumName"></h2><p id="detailAlbumDescription"></p><span id="detailAlbumMeta"></span></div>
                <div class="album-detail-actions">
                    <button class="photo-secondary-button" id="editAlbumButton"><i class="fa-regular fa-pen-to-square"></i> 수정</button>
                    <a class="photo-primary-button" id="shareToAlbumButton" href="#"><i class="fa-solid fa-plus"></i> 사진 올리기</a>
                </div>
            </div>
            <div id="albumPostGrid" class="post-grid"></div>
        </section>
    </div>
</main>

<div class="photo-modal-backdrop" id="postModal" hidden>
    <div class="photo-modal photo-post-modal">
        <div class="photo-modal-header"><h2>사진 올리기</h2><button class="photo-icon-button" data-close="postModal"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="photo-modal-body">
            <div class="photo-field">
                <span>사진 <em>*</em></span>
                <input id="postFilesInput" class="photo-file-input" type="file" accept="image/*" multiple>
                <div id="photoDropZone" class="photo-drop-zone" tabindex="0" role="button" aria-controls="postFilesInput">
                    <div class="photo-drop-icon"><i class="fa-regular fa-images"></i></div>
                    <strong>사진을 여기로 끌어다 놓으세요</strong>
                    <p>또는 클릭해서 사진을 선택하세요</p>
                    <small>JPG, PNG, GIF, WEBP · 여러 장 선택 가능</small>
                </div>
                <div class="photo-file-summary"><span id="selectedFileCount">선택된 사진 없음</span><button type="button" id="clearSelectedFilesButton" hidden>전체 지우기</button></div>
            </div>
            <div id="postPreview" class="post-preview"></div>
            <div class="photo-field photo-visibility-field"><span>공개 설정</span><select id="postVisibilitySelect"></select><label class="photo-moyo-public-check" id="postMoyoPublicBox"><input type="checkbox" id="postMoyoPublicCheckbox"><span><strong>MOYO 공개</strong><small>내 MOYO 피드와 친구들의 피드에 함께 표시됩니다.</small></span></label><small id="postVisibilityGuide">현재 공간 기준으로 사진을 공개합니다.</small></div>
            <label class="photo-field"><span>설명</span><textarea id="postDescriptionInput" maxlength="1000" rows="4" placeholder="사진에 대한 설명을 남겨보세요."></textarea></label>
            <label class="photo-field"><span>앨범</span><select id="postAlbumSelect"><option value="">앨범 없이 올리기</option></select><small>나중에 앨범으로 옮길 수 있습니다.</small></label>
        </div>
        <div class="photo-modal-footer"><button class="photo-secondary-button" data-close="postModal">취소</button><button class="photo-primary-button" id="savePostButton">올리기</button></div>
    </div>
</div>

<div class="photo-modal-backdrop" id="albumModal" hidden>
    <div class="photo-modal">
        <div class="photo-modal-header"><h2 id="albumModalTitle">새 앨범</h2><button class="photo-icon-button" data-close="albumModal"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="photo-modal-body"><label class="photo-field"><span>앨범 이름 <em>*</em></span><input id="albumNameInput" maxlength="100"></label><label class="photo-field"><span>설명</span><textarea id="albumDescriptionInput" maxlength="500" rows="4"></textarea></label></div>
        <div class="photo-modal-footer"><button class="photo-danger-link" id="deleteAlbumButton" hidden>앨범 삭제</button><div><button class="photo-secondary-button" data-close="albumModal">취소</button><button class="photo-primary-button" id="saveAlbumButton">저장</button></div></div>
    </div>
</div>


<div id="photoAlbumWorkspaceTargetSource" hidden>
    <c:forEach var="workspace" items="${photoWorkspaceList}">
        <div data-ws-id="${workspace.wsId}"
             data-ws-name="${workspace.wsName}"
             data-ws-image-path="${workspace.wsImagePath}"></div>
    </c:forEach>
</div>
<div id="photoAlbumProjectTargetSource" hidden>
    <c:forEach var="project" items="${photoProjectList}">
        <div data-proj-id="${project.projId}"
             data-proj-name="${project.projName}"
             data-ws-id="${project.wsId}"
             data-ws-name="${project.wsName}"></div>
    </c:forEach>
</div>
<div id="photoAlbumWorkspaceMemberSource" hidden>
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
<div id="photoAlbumProjectMemberSource" hidden>
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
<div id="photoAlbumShareMount"></div>

<div class="photo-lightbox" id="postLightbox" hidden>
    <button type="button" class="lightbox-close" id="closeLightboxButton"><i class="fa-solid fa-xmark"></i></button>
    <button type="button" class="lightbox-nav lightbox-prev" id="lightboxPrevButton"><i class="fa-solid fa-chevron-left"></i></button>
    <figure><img id="lightboxImage" alt="확대 사진"><figcaption><strong id="lightboxTitle"></strong><span id="lightboxDescription"></span><small id="lightboxMeta"></small></figcaption></figure>
    <div class="lightbox-actions">
        <button class="lightbox-like" id="likePostButton" type="button" aria-pressed="false"><i class="fa-regular fa-heart"></i> <span>좋아요</span> <strong id="lightboxLikeCount">0</strong></button>
        <button type="button" class="lightbox-share" id="sharePostButton"><i class="fa-regular fa-paper-plane"></i> 공유</button>
        <button type="button" class="lightbox-edit" id="editPostButton"><i class="fa-regular fa-pen-to-square"></i> 수정</button>
        <button type="button" class="lightbox-move" id="movePostButton"><i class="fa-regular fa-folder-open"></i> 앨범 이동</button>
        <button type="button" class="lightbox-delete" id="deletePostButton"><i class="fa-regular fa-trash-can"></i> 휴지통으로 이동</button>
    </div>
    <button type="button" class="lightbox-nav lightbox-next" id="lightboxNextButton"><i class="fa-solid fa-chevron-right"></i></button>
</div>

<div class="photo-modal-backdrop" id="editPostModal" hidden>
    <div class="photo-modal photo-edit-post-modal">
        <div class="photo-modal-header"><h2>사진 정보 수정</h2><button class="photo-icon-button" data-close="editPostModal"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="photo-modal-body">
            <label class="photo-field"><span>설명</span><textarea id="editPostDescriptionInput" maxlength="1000" rows="5" placeholder="사진에 대한 설명을 남겨보세요."></textarea><small><span id="editPostDescriptionCount">0</span>/1000</small></label>
        </div>
        <div class="photo-modal-footer"><button class="photo-secondary-button" data-close="editPostModal">취소</button><button class="photo-primary-button" id="saveEditPostButton">저장</button></div>
    </div>
</div>

<div class="photo-modal-backdrop" id="moveAlbumModal" hidden>
    <div class="photo-modal photo-move-modal">
        <div class="photo-modal-header"><h2>앨범으로 이동</h2><button type="button" class="photo-icon-button" data-close="moveAlbumModal"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="photo-modal-body">
            <div class="move-album-toolbar">
                <p class="move-album-guide">이 사진 묶음 전체를 현재 공간의 다른 앨범으로 옮깁니다.</p>
                <button type="button" class="move-new-album-button" id="openMoveAlbumCreateButton"><i class="fa-solid fa-plus"></i> 새 앨범</button>
            </div>
            <div class="move-album-create" id="moveAlbumCreatePanel" hidden>
                <label for="moveNewAlbumName">새 앨범 이름</label>
                <div class="move-album-create-row">
                    <input type="text" id="moveNewAlbumName" maxlength="100" placeholder="앨범 이름을 입력하세요">
                    <button type="button" class="photo-secondary-button" id="cancelMoveAlbumCreateButton">취소</button>
                    <button type="button" class="photo-primary-button" id="createMoveAlbumButton">생성</button>
                </div>
            </div>
            <div class="move-album-create move-album-edit" id="moveAlbumEditPanel" hidden>
                <label for="moveEditAlbumName">앨범 이름 수정</label>
                <div class="move-album-create-row">
                    <input type="text" id="moveEditAlbumName" maxlength="100" placeholder="앨범 이름을 입력하세요">
                    <button type="button" class="photo-secondary-button" id="cancelMoveAlbumEditButton">취소</button>
                    <button type="button" class="photo-primary-button" id="saveMoveAlbumEditButton">저장</button>
                </div>
            </div>
            <div id="moveAlbumList" class="move-album-list"></div>
        </div>
        <div class="photo-modal-footer"><button type="button" class="photo-secondary-button" data-close="moveAlbumModal">취소</button><button type="button" class="photo-primary-button" id="confirmMoveAlbumButton">이동</button></div>
    </div>
</div>
<jsp:include page="/WEB-INF/views/common/commonFriendPickerModal.jspf" />
<div id="photoToast" class="photo-toast"></div>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="${pageContext.request.contextPath}/js/commonShareModal.js?v=20260626-photo-bulk-share"></script>
<script src="${pageContext.request.contextPath}/js/commonFriendPickerModal.js?v=14"></script>
<script src="${pageContext.request.contextPath}/js/photoAlbum.js?v=scope-upload-click-fix-1"></script>
</body>
</html>
