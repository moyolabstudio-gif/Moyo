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
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/photoAlbum.css?v=27">
</head>
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp" />
<main class="photo-page" data-scope-type="${scopeType}" data-scope-id="${scopeId}" data-current-user-id="${currentUserId}" data-admin="${isScopeAdmin}">
    <div class="photo-shell">
        <nav class="photo-breadcrumb"><a href="${pageContext.request.contextPath}${backUrl}"><i class="fa-solid fa-arrow-left"></i> <c:out value="${scopeName}"/></a><span>/</span><strong>사진첩</strong></nav>
        <header class="photo-page-header">
            <div class="photo-heading-group">
                <div><span class="photo-eyebrow"><c:out value="${scopeLabel}"/></span><h1>사진첩</h1><p>사진은 가볍게 공유하고, 필요한 순간만 앨범으로 모아보세요.</p></div>
            </div>
            <div class="photo-header-actions"><button class="photo-secondary-button" id="openAlbumModalButton"><i class="fa-regular fa-folder-open"></i> 새 앨범</button><button class="photo-primary-button" id="openPostModalButton"><i class="fa-solid fa-plus"></i> 사진 공유</button></div>
        </header>

        <div class="photo-view-tabs" role="tablist">
            <button class="active" data-view="posts">최근 공유</button>
            <button data-view="albums">앨범</button>
        </div>

        <section id="postsView" class="photo-content-view">
            <div class="photo-toolbar"><label class="photo-search"><i class="fa-solid fa-magnifying-glass"></i><input id="postSearchInput" type="search" placeholder="제목, 설명, 작성자 검색"></label><span id="postCountText" class="photo-count-text"></span></div>
            <div id="postGrid" class="post-grid"></div>
        </section>

        <section id="albumsView" class="photo-content-view" hidden>
            <div class="photo-toolbar"><label class="photo-search"><i class="fa-solid fa-magnifying-glass"></i><input id="albumSearchInput" type="search" placeholder="앨범 이름 검색"></label><span id="albumCountText" class="photo-count-text"></span></div>
            <div id="albumGrid" class="album-grid"></div>
        </section>

        <section id="albumDetailView" class="photo-content-view" hidden>
            <button class="photo-back-button" id="backToAlbumsButton"><i class="fa-solid fa-arrow-left"></i> 앨범 목록</button>
            <div class="album-detail-title-row">
                <div class="album-detail-info"><h2 id="detailAlbumName"></h2><p id="detailAlbumDescription"></p><span id="detailAlbumMeta"></span></div>
                <div class="album-detail-actions">
                    <button class="photo-secondary-button" id="editAlbumButton"><i class="fa-regular fa-pen-to-square"></i> 수정</button>
                    <button class="photo-primary-button" id="shareToAlbumButton"><i class="fa-solid fa-plus"></i> 사진 공유</button>
                </div>
            </div>
            <div id="albumPostGrid" class="post-grid"></div>
        </section>
    </div>
</main>

<div class="photo-modal-backdrop" id="postModal" hidden>
    <div class="photo-modal photo-post-modal">
        <div class="photo-modal-header"><h2>사진 공유</h2><button class="photo-icon-button" data-close="postModal"><i class="fa-solid fa-xmark"></i></button></div>
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
            <label class="photo-field"><span>제목</span><input id="postTitleInput" maxlength="150" placeholder="예: 오늘 팀 회의"></label>
            <label class="photo-field"><span>설명</span><textarea id="postDescriptionInput" maxlength="1000" rows="4" placeholder="사진에 대한 설명을 남겨보세요."></textarea></label>
            <label class="photo-field"><span>앨범</span><select id="postAlbumSelect"><option value="">앨범 없이 공유</option></select><small>나중에 앨범으로 옮길 수 있습니다.</small></label>
        </div>
        <div class="photo-modal-footer"><button class="photo-secondary-button" data-close="postModal">취소</button><button class="photo-primary-button" id="savePostButton">공유</button></div>
    </div>
</div>

<div class="photo-modal-backdrop" id="albumModal" hidden>
    <div class="photo-modal">
        <div class="photo-modal-header"><h2 id="albumModalTitle">새 앨범</h2><button class="photo-icon-button" data-close="albumModal"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="photo-modal-body"><label class="photo-field"><span>앨범 이름 <em>*</em></span><input id="albumNameInput" maxlength="100"></label><label class="photo-field"><span>설명</span><textarea id="albumDescriptionInput" maxlength="500" rows="4"></textarea></label></div>
        <div class="photo-modal-footer"><button class="photo-danger-link" id="deleteAlbumButton" hidden>앨범 삭제</button><div><button class="photo-secondary-button" data-close="albumModal">취소</button><button class="photo-primary-button" id="saveAlbumButton">저장</button></div></div>
    </div>
</div>

<div class="photo-lightbox" id="postLightbox" hidden>
    <button class="lightbox-close" id="closeLightboxButton"><i class="fa-solid fa-xmark"></i></button>
    <button class="lightbox-nav lightbox-prev" id="lightboxPrevButton"><i class="fa-solid fa-chevron-left"></i></button>
    <figure><img id="lightboxImage" alt="확대 사진"><figcaption><strong id="lightboxTitle"></strong><span id="lightboxDescription"></span><small id="lightboxMeta"></small></figcaption></figure>
    <div class="lightbox-actions">
        <button class="lightbox-like" id="likePostButton" type="button" aria-pressed="false"><i class="fa-regular fa-heart"></i> <span>좋아요</span> <strong id="lightboxLikeCount">0</strong></button>
        <button class="lightbox-edit" id="editPostButton"><i class="fa-regular fa-pen-to-square"></i> 수정</button>
        <button class="lightbox-move" id="movePostButton"><i class="fa-regular fa-folder-open"></i> 앨범 이동</button>
        <button class="lightbox-delete" id="deletePostButton"><i class="fa-regular fa-trash-can"></i> 삭제</button>
    </div>
    <button class="lightbox-nav lightbox-next" id="lightboxNextButton"><i class="fa-solid fa-chevron-right"></i></button>
</div>

<div class="photo-modal-backdrop" id="editPostModal" hidden>
    <div class="photo-modal photo-edit-post-modal">
        <div class="photo-modal-header"><h2>사진 정보 수정</h2><button class="photo-icon-button" data-close="editPostModal"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="photo-modal-body">
            <label class="photo-field"><span>제목</span><input id="editPostTitleInput" maxlength="150" placeholder="게시물 제목을 입력하세요"></label>
            <label class="photo-field"><span>설명</span><textarea id="editPostDescriptionInput" maxlength="1000" rows="5" placeholder="사진에 대한 설명을 남겨보세요."></textarea><small><span id="editPostDescriptionCount">0</span>/1000</small></label>
        </div>
        <div class="photo-modal-footer"><button class="photo-secondary-button" data-close="editPostModal">취소</button><button class="photo-primary-button" id="saveEditPostButton">저장</button></div>
    </div>
</div>

<div class="photo-modal-backdrop" id="moveAlbumModal" hidden>
    <div class="photo-modal photo-move-modal">
        <div class="photo-modal-header"><h2>앨범으로 이동</h2><button class="photo-icon-button" data-close="moveAlbumModal"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="photo-modal-body">
            <div class="move-album-toolbar">
                <p class="move-album-guide">이 사진 공유 전체를 현재 공간의 다른 앨범으로 옮깁니다.</p>
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
        <div class="photo-modal-footer"><button class="photo-secondary-button" data-close="moveAlbumModal">취소</button><button class="photo-primary-button" id="confirmMoveAlbumButton">이동</button></div>
    </div>
</div>
<div id="photoToast" class="photo-toast"></div>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="${pageContext.request.contextPath}/js/photoAlbum.js?v=29"></script>
</body>
</html>
