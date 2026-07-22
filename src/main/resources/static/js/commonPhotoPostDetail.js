(function () {
    'use strict';

    const state = {
        post: null,
        photos: [],
        comments: [],
        index: 0,
        loading: false
    };

    function pick(obj, ...keys) {
        for (const key of keys) {
            if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
        }
        return null;
    }

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
    }

    function getContextSource() {
        return document.getElementById('photoAlbumPage') || document.querySelector('.profile-shell') || document.body;
    }

    function getContextPath() {
        const source = getContextSource();
        return source && source.dataset ? (source.dataset.contextPath || '') : '';
    }

    function getCurrentUserId() {
        const source = getContextSource();
        const raw = source && source.dataset ? (source.dataset.currentUserId || source.dataset.profileOwnerId || '') : '';
        const value = Number(raw);
        return Number.isFinite(value) ? value : 0;
    }

    function resolveAssetPath(path) {
        const value = String(path || '').trim();
        if (!value) return '';
        if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
        const contextPath = getContextPath();
        if (value.startsWith('/')) return `${contextPath}${value}`;
        return `${contextPath}/${value.replace(/^\/+/, '')}`;
    }

    function moyoMascotPath() {
        return `${getContextPath()}/brand/moyo_mark.png?v=moyo-mark-v34`;
    }

    function svgIcon(name) {
        const icons = {
            heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
            comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5A8.48 8.48 0 0 1 21 11v.5Z"/></svg>',
            send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>',
            more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
            close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
            prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
            next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
            bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>',
            edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
            eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
            eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a20.28 20.28 0 0 1 5.06-5.94"/><path d="M10.58 10.58a2 2 0 0 0 2.84 2.84"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/></svg>',
            folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4"/></svg>',
            trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
            restore: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>'
        };
        return icons[name] || '';
    }

    function normalizeVisibility(value) {
        return String(value || '').trim().toUpperCase();
    }

    function normalizeScope(post) {
        return normalizeVisibility(pick(post, 'scopeType', 'SCOPE_TYPE', 'itemType', 'ITEM_TYPE'));
    }

    function profileImageOf(post) {
        return pick(post,
            'creatorProfileImagePath', 'CREATOR_PROFILE_IMAGE_PATH',
            'creatorProfileImage', 'CREATOR_PROFILE_IMAGE',
            'profileImagePath', 'PROFILE_IMAGE_PATH',
            'profilePath', 'PROFILE_PATH',
            'userProfileImagePath', 'USER_PROFILE_IMAGE_PATH',
            'authorProfileImagePath', 'AUTHOR_PROFILE_IMAGE_PATH'
        );
    }

    function authorName(post) {
        return pick(post, 'creatorName', 'CREATOR_NAME', 'userName', 'USER_NAME', 'authorName', 'AUTHOR_NAME') || '작성자';
    }

    function postIdOf(post) {
        return Number(pick(post, 'postId', 'POST_ID') || 0);
    }

    function postOwnerId(post) {
        return Number(pick(post, 'createdBy', 'CREATED_BY', 'userId', 'USER_ID') || 0);
    }

    function profileUrl(userId) {
        const id = Number(userId || 0);
        return id ? `${getContextPath()}/users/profile?userId=${encodeURIComponent(String(id))}` : '';
    }

    function profileLinkAttrs(userId, name, extraClass) {
        const url = profileUrl(userId);
        if (!url) return '';
        return `href="${esc(url)}" class="${esc(extraClass || 'photo-runtime-profile-link')}" aria-label="${esc(name || '사용자')} 프로필 보기"`;
    }


    function normalizePostScope(post) {
        return normalizeVisibility(pick(post, 'scopeType', 'SCOPE_TYPE', 'itemType', 'ITEM_TYPE'));
    }

    function isAdminUser() {
        const source = getContextSource();
        const raw = source && source.dataset ? (source.dataset.admin || source.dataset.isAdmin || '') : '';
        return raw === 'true' || raw === '1' || raw === 'Y';
    }

    function isTrashPost(post) {
        return normalizeVisibility(pick(post, 'deletedYn', 'DELETED_YN')) === 'Y';
    }

    function canManagePost(post) {
        const currentUserId = getCurrentUserId();
        return !!post && !!currentUserId && (postOwnerId(post) === currentUserId || isAdminUser());
    }

    function canToggleVisibility(post) {
        return normalizePostScope(post) === 'PERSONAL' && postOwnerId(post) === getCurrentUserId();
    }

    function hasPhotoAlbumHost() {
        return !!document.getElementById('photoAlbumPage');
    }

    function photoAlbumUrl(post) {
        const scope = normalizePostScope(post) || 'PERSONAL';
        const scopeId = pick(post, 'scopeId', 'SCOPE_ID', 'wsId', 'WS_ID', 'workspaceId', 'WORKSPACE_ID', 'projId', 'PROJ_ID', 'projectId', 'PROJECT_ID') || getCurrentUserId();
        const params = new URLSearchParams();
        params.set('scopeType', scope === 'WS' ? 'WORKSPACE' : (scope === 'PROJ' ? 'PROJECT' : scope));
        params.set('scopeId', String(scopeId || getCurrentUserId() || ''));
        params.set('postId', String(postIdOf(post) || ''));
        return `${getContextPath()}/photo-album?${params.toString()}`;
    }


    function albumApiScopeType(post) {
        const raw = normalizePostScope(post);
        if (raw === 'WS') return 'WORKSPACE';
        if (raw === 'PROJ') return 'PROJECT';
        return ['PERSONAL', 'WORKSPACE', 'PROJECT'].includes(raw) ? raw : '';
    }

    function albumApiScopeId(post) {
        const raw = pick(post, 'scopeId', 'SCOPE_ID', 'wsId', 'WS_ID', 'workspaceId', 'WORKSPACE_ID', 'projId', 'PROJ_ID', 'projectId', 'PROJECT_ID');
        const value = Number(raw || 0);
        if (value) return value;
        return albumApiScopeType(post) === 'PERSONAL' ? (postOwnerId(post) || getCurrentUserId()) : 0;
    }

    function albumIdOf(album) {
        const value = Number(pick(album, 'albumId', 'ALBUM_ID') || 0);
        return value || null;
    }

    function albumNameOf(album) {
        return pick(album, 'albumName', 'ALBUM_NAME', 'name', 'NAME') || '앨범';
    }

    async function loadStandaloneMoveAlbums(post) {
        const scopeType = albumApiScopeType(post);
        const scopeId = albumApiScopeId(post);
        if (!scopeType || !scopeId) throw new Error('앨범을 불러올 공간 정보를 찾지 못했습니다.');
        const response = await fetch(`${getContextPath()}/api/photo-albums?scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(scopeId)}`, {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });
        const data = await response.json().catch(() => ([]));
        if (!response.ok) throw new Error((data && data.message) || '앨범 목록을 불러오지 못했습니다.');
        return Array.isArray(data) ? data : [];
    }

    function closeStandaloneMoveAlbumModal() {
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        if (modal) modal.remove();
        const runtimeOpen = document.getElementById('photoRuntimeLightbox')?.getAttribute('aria-hidden') === 'false';
        if (runtimeOpen) document.body.style.overflow = 'hidden';
    }

    function renderStandaloneMoveAlbumModal(post, albums) {
        const postId = postIdOf(post);
        const currentAlbumId = Number(pick(post, 'albumId', 'ALBUM_ID') || 0) || null;
        const options = [{ id: null, name: '미분류', description: '앨범 없이 보관' }]
            .concat((albums || []).map(album => ({
                id: albumIdOf(album),
                name: albumNameOf(album),
                description: pick(album, 'albumDescription', 'ALBUM_DESCRIPTION') || '이 앨범으로 이동'
            })))
            .map(option => {
                const value = option.id == null ? '' : String(option.id);
                const checked = option.id == null ? currentAlbumId == null : Number(option.id) === Number(currentAlbumId);
                return `<label class="photo-common-move-option${checked ? ' selected' : ''}">
                    <input type="radio" name="photoCommonMoveAlbum" value="${esc(value)}" ${checked ? 'checked' : ''}>
                    <span class="photo-common-move-icon">${svgIcon('folder')}</span>
                    <span class="photo-common-move-text"><strong>${esc(option.name)}</strong><small>${esc(option.description)}</small></span>
                    <span class="photo-common-move-check">✓</span>
                </label>`;
            }).join('');

        const existing = document.getElementById('photoCommonMoveAlbumModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div id="photoCommonMoveAlbumModal" class="photo-common-move-backdrop" role="dialog" aria-modal="true" aria-labelledby="photoCommonMoveAlbumTitle" data-post-id="${esc(postId)}">
                <div class="photo-common-move-modal">
                    <header class="photo-common-move-header">
                        <div>
                            <h2 id="photoCommonMoveAlbumTitle">앨범으로 이동</h2>
                            <p>이 사진 묶음 전체를 다른 앨범으로 옮깁니다.</p>
                        </div>
                        <button type="button" class="photo-common-move-close" data-photo-common-move-close aria-label="닫기">${svgIcon('close')}</button>
                    </header>
                    <div class="photo-common-move-list">${options}</div>
                    <footer class="photo-common-move-footer">
                        <button type="button" class="photo-common-move-cancel" data-photo-common-move-close>취소</button>
                        <button type="button" class="photo-common-move-submit" data-photo-common-move-submit>이동</button>
                    </footer>
                </div>
            </div>`);
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        document.body.style.overflow = 'hidden';
        modal.addEventListener('click', handleStandaloneMoveAlbumClick);
    }

    async function handleStandaloneMoveAlbumClick(event) {
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        if (!modal) return;
        if (event.target === modal || event.target.closest('[data-photo-common-move-close]')) {
            event.preventDefault();
            return closeStandaloneMoveAlbumModal();
        }
        const option = event.target.closest('.photo-common-move-option');
        if (option) {
            const input = option.querySelector('input[name="photoCommonMoveAlbum"]');
            if (input) {
                input.checked = true;
                modal.querySelectorAll('.photo-common-move-option').forEach(item => {
                    const itemInput = item.querySelector('input[name="photoCommonMoveAlbum"]');
                    item.classList.toggle('selected', !!itemInput && itemInput.checked);
                });
            }
            return;
        }
        const submit = event.target.closest('[data-photo-common-move-submit]');
        if (!submit) return;
        event.preventDefault();
        const postId = Number(modal.dataset.postId || 0);
        const selected = modal.querySelector('input[name="photoCommonMoveAlbum"]:checked');
        const nextAlbumId = selected && selected.value ? Number(selected.value) : null;
        submit.disabled = true;
        try {
            const response = await fetch(`${getContextPath()}/api/photo-posts/${postId}/album`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ albumId: nextAlbumId })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) throw new Error(data.message || '앨범 이동을 처리하지 못했습니다.');
            const label = selected ? selected.closest('.photo-common-move-option')?.querySelector('strong')?.textContent : '';
            if (state.post && postIdOf(state.post) === postId) {
                state.post.albumId = nextAlbumId;
                state.post.ALBUM_ID = nextAlbumId;
                state.post.albumName = nextAlbumId ? label : '';
                state.post.ALBUM_NAME = nextAlbumId ? label : '';
                render();
            }
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId, albumId: nextAlbumId, albumName: label || '' } }));
            closeStandaloneMoveAlbumModal();
            toast('앨범을 이동했습니다.');
        } catch (error) {
            toast(error.message || '앨범 이동을 처리하지 못했습니다.', true);
        } finally {
            submit.disabled = false;
        }
    }

    async function openStandaloneMoveAlbumModal(post) {
        if (!canManagePost(post)) return toast('앨범 이동 권한이 없습니다.', true);
        if (!window.MoyoPhotoAlbumMoveModal || typeof window.MoyoPhotoAlbumMoveModal.open !== 'function') {
            return toast('앨범 이동 모달을 불러오지 못했습니다. 페이지를 새로고침해주세요.', true);
        }
        return window.MoyoPhotoAlbumMoveModal.open({
            post,
            count: 1,
            currentAlbumId: Number(pick(post, 'albumId', 'ALBUM_ID') || 0) || null,
            loadAlbums: () => loadStandaloneMoveAlbums(post),
            move: async (nextAlbumId) => {
                const postId = postIdOf(post);
                const response = await fetch(`${getContextPath()}/api/photo-posts/${postId}/album`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ albumId: nextAlbumId })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || data.success === false) throw new Error(data.message || '앨범 이동을 처리하지 못했습니다.');
            },
            onMoved: async ({ albumId, albumName }) => {
                if (state.post && postIdOf(state.post) === postIdOf(post)) {
                    state.post.albumId = albumId;
                    state.post.ALBUM_ID = albumId;
                    state.post.albumName = albumId ? albumName : '';
                    state.post.ALBUM_NAME = albumId ? albumName : '';
                    render();
                }
                document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', {
                    detail: { postId: postIdOf(post), albumId, albumName: albumName || '' }
                }));
            }
        });
    }

    function removeCurrentPostCard(postId) {
        const id = String(postId || '');
        if (!id) return;
        document.querySelectorAll(`[data-open-photo-post-detail="${CSS.escape(id)}"], [data-post-id="${CSS.escape(id)}"]`).forEach(node => {
            const card = node.closest('.profile-photo-card, .photo-card, article, li');
            if (card) card.remove();
        });
    }

    function isCollectedPost(post) {
        return Number(pick(post, 'collectedByMe', 'COLLECTED_BY_ME') || 0) === 1;
    }

    function isCollectedCopyPost(post) {
        return Number(pick(post, 'isCollectedCopy', 'IS_COLLECTED_COPY') || 0) === 1 || !!pick(post, 'collectedSourcePostId', 'COLLECTED_SOURCE_POST_ID');
    }


    function isPostOwner(post) {
        const me = getCurrentUserId();
        return !!me && Number(postOwnerId(post)) === Number(me);
    }

    function shareModeForPost(post) {
        return isPostOwner(post) ? 'PERMISSION' : 'FEED';
    }

    function shareInitialRow(share) {
        return `<div data-share-id="${esc(pick(share, 'shareId', 'SHARE_ID') || '')}"
            data-owner-id="${esc(pick(share, 'ownerId', 'OWNER_ID') || '')}"
            data-shared-by="${esc(pick(share, 'sharedBy', 'SHARED_BY') || '')}"
            data-target-type="${esc(pick(share, 'targetType', 'TARGET_TYPE') || '')}"
            data-target-id="${esc(pick(share, 'targetId', 'TARGET_ID') || '')}"
            data-target-name="${esc(pick(share, 'targetName', 'TARGET_NAME') || '')}"
            data-target-subtext="${esc(pick(share, 'targetSubtext', 'TARGET_SUBTEXT') || '')}"
            data-permission-type="${esc(pick(share, 'permissionType', 'PERMISSION_TYPE') || 'VIEW')}"
            data-share-status="${esc(pick(share, 'shareStatus', 'SHARE_STATUS') || 'ACCEPTED')}"></div>`;
    }

    function shareModalMarkup(uid, shares, shareMode, post) {
        const mode = String(shareMode || 'PERMISSION').toUpperCase();
        const ownerId = String(postOwnerId(post) || '');
        return `
            <button type="button" id="${esc(uid)}Open" hidden>공유 열기</button>
            <button type="button" id="${esc(uid)}PermissionDummy" hidden>권한</button>
            <div id="${esc(uid)}HiddenFields" hidden></div>
            <div id="${esc(uid)}InitialSource" hidden>${(shares || []).map(shareInitialRow).join('')}</div>
            <div id="${esc(uid)}Modal" class="note-write-share-modal moyo-share-modal photo-post-share-modal photo-post-share-modal--over-detail" data-current-user-id="${esc(String(getCurrentUserId() || ''))}" data-owner-user-id="${esc(ownerId)}" data-share-mode-type="${esc(mode)}" hidden>
                <div class="note-write-share-backdrop" data-note-share-close></div>
                <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="${esc(uid)}Title">
                    <div class="note-write-share-modal-head">
                        <div>
                            <h3 id="${esc(uid)}Title">공유</h3>
                            <p>${mode === 'FEED' ? '받는 대상에게 MOYO 피드 게시물을 보냅니다.' : '받는 대상을 선택해 공유 요청을 보냅니다.'}</p>
                        </div>
                        <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
                    </div>
                    <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
                        <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
                        <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">그룹</button>
                        <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
                    </div>
                    <div class="note-write-share-toolbar">
                        <select id="${esc(uid)}Context" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
                        <input type="text" id="${esc(uid)}Keyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
                    </div>
                    <div class="note-write-share-body note-write-share-body-simple note-write-share-body-feed">
                        <div>
                            <div class="note-write-share-subtitle">받는 대상</div>
                            <div id="${esc(uid)}Candidates" class="note-write-share-list"></div>
                        </div>
                        <div hidden>
                            <div class="note-write-share-subtitle" hidden><span id="${esc(uid)}ModalCount" class="note-share-modal-count" hidden>0</span></div>
                            <div id="${esc(uid)}Selected" class="note-write-share-selected" hidden></div>
                        </div>
                    </div>
                    <div class="note-write-share-modal-actions">
                        <div>
                            <button type="button" class="note-soft-btn" data-note-share-close>취소</button>
                            <button type="button" id="${esc(uid)}Apply" class="note-gradient-btn">보내기</button>
                        </div>
                    </div>
                </section>
            </div>`;
    }

    function elevateShareModal(uid) {
        const modal = document.getElementById(`${uid}Modal`);
        if (!modal) return;
        modal.classList.add('photo-post-share-modal--over-detail');
        modal.style.setProperty('z-index', '2147483647', 'important');
    }

    async function openStandaloneShareModal(post) {
        const postId = postIdOf(post);
        if (!postId) return toast('공유할 사진 정보를 찾지 못했습니다.', true);
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') {
            return toast('공유 모달을 불러오지 못했습니다. 페이지를 새로고침해주세요.', true);
        }
        try {
            const shareMode = shareModeForPost(post);
            const data = await request(`/share/api/targets?contentType=PHOTO&contentId=${encodeURIComponent(postId)}&shareMode=${encodeURIComponent(shareMode)}`);
            let mount = document.getElementById('photoRuntimeShareMount');
            if (!mount) {
                mount = document.createElement('div');
                mount.id = 'photoRuntimeShareMount';
                document.body.appendChild(mount);
            }
            const uid = `photoRuntimeShare${postId}_${Date.now()}`;
            mount.innerHTML = shareModalMarkup(uid, Array.isArray(data.shares) ? data.shares : [], shareMode, post);
            const openButton = document.getElementById(`${uid}Open`);
            window.MoyoShareModal.init({
                contentType: 'PHOTO',
                contentId: postId,
                contentIds: [postId],
                shareMode: String(shareMode || 'PERMISSION').toUpperCase(),
                persist: true,
                reloadOnPersist: false,
                bodyOpenClass: 'note-share-modal-open',
                currentUserId: String(getCurrentUserId() || ''),
                ownerUserId: String(postOwnerId(post) || ''),
                blockedUserIds: [String(postOwnerId(post) || '')].filter(Boolean),
                ids: {
                    openButton: `${uid}Open`,
                    permissionButton: `${uid}PermissionDummy`,
                    modal: `${uid}Modal`,
                    keyword: `${uid}Keyword`,
                    applyButton: `${uid}Apply`,
                    title: `${uid}Title`,
                    context: `${uid}Context`,
                    candidates: `${uid}Candidates`,
                    selected: `${uid}Selected`,
                    hiddenFields: `${uid}HiddenFields`,
                    modalCount: `${uid}ModalCount`,
                    initialSharesSource: `${uid}InitialSource`,
                    workspaceMemberSource: 'photoAlbumWorkspaceMemberSource',
                    projectMemberSource: 'photoAlbumProjectMemberSource',
                    workspaceTargetSource: 'photoAlbumWorkspaceTargetSource',
                    projectTargetSource: 'photoAlbumProjectTargetSource'
                },
                onPersistSuccess: (result) => {
                    if (result && result.mode === 'SHARE_RELEASE') toast('공유를 해지했습니다.');
                    else if (String(shareMode || '').toUpperCase() === 'FEED') toast('게시물을 보냈습니다.');
                    else toast('공유 요청을 보냈습니다.');
                }
            });
            elevateShareModal(uid);
            setTimeout(() => {
                if (!openButton) return;
                openButton.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
                elevateShareModal(uid);
            }, 0);
        } catch (error) {
            toast(error.message || '공유 상태를 불러오지 못했습니다.', true);
        }
    }

    function firstPhotoPath(detail) {
        const post = detail && detail.post ? detail.post : {};
        const photos = Array.isArray(detail && detail.photos) ? detail.photos : [];
        const photo = photos[0] || {};
        return pick(photo, 'filePath', 'FILE_PATH') || pick(post, 'coverPath', 'COVER_PATH') || '';
    }

    function preloadImage(path) {
        const resolved = resolveAssetPath(path);
        if (!resolved) return Promise.resolve();
        return new Promise(resolve => {
            const img = new Image();
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                resolve();
            };
            img.onload = finish;
            img.onerror = finish;
            img.src = resolved;
            setTimeout(finish, 700);
        });
    }

    function collectedSourceName(post) {
        return pick(post, 'collectedSourceCreatorName', 'COLLECTED_SOURCE_CREATOR_NAME') || '';
    }

    function isUnclassifiedAlbumName(name) {
        const value = String(name || '').trim();
        return !value || value === '미분류' || value === '앨범 없음';
    }

    function actionEvent(action, extra) {
        const detail = Object.assign({ action, postId: postIdOf(state.post), post: state.post, photos: state.photos }, extra || {});
        if (hasPhotoAlbumHost()) {
            document.dispatchEvent(new CustomEvent('moyo:photo-detail-action', { detail }));
            return;
        }
        handleStandaloneAction(action);
    }

    function setCollectedState(post, collected) {
        if (!post) return;
        post.collectedByMe = collected ? 1 : 0;
        post.COLLECTED_BY_ME = collected ? 1 : 0;
    }

    async function handleStandaloneCollect(post) {
        const postId = postIdOf(post);
        if (!postId) return toast('담아갈 사진 정보를 찾지 못했습니다.', true);
        const ownerId = postOwnerId(post);
        const currentUserId = getCurrentUserId();
        if (!ownerId || !currentUserId || Number(ownerId) === Number(currentUserId)) {
            return toast('내가 올린 사진은 이미 내 사진첩에 있습니다.', true);
        }
        const collected = isCollectedPost(post) || isCollectedCopyPost(post);
        const n = runtimeNodes();
        if (n.collect) n.collect.disabled = true;
        try {
            const result = await request(`/api/photo-posts/${postId}/collect`, {
                method: collected ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: collected ? undefined : JSON.stringify({ albumId: null })
            });
            setCollectedState(post, !collected);
            if (Array.isArray(result && result.comments)) {
                state.comments = result.comments;
            }
            render();
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', {
                detail: { postId, collectedByMe: !collected ? 1 : 0 }
            }));
            toast(!collected ? '내 사진첩에 담았습니다.' : '담아가기를 취소했습니다.');
        } catch (error) {
            toast(error.message || '담아가기를 처리하지 못했습니다.', true);
        } finally {
            if (n.collect) n.collect.disabled = false;
        }
    }

    async function handleStandaloneAction(action) {
        const post = state.post || {};
        const postId = postIdOf(post);
        if (!postId) return toast('사진 정보를 찾지 못했습니다.', true);

        if (action === 'edit') {
            window.location.href = `${getContextPath()}/photo-post/edit/${postId}`;
            return;
        }

        if (action === 'move') {
            return openStandaloneMoveAlbumModal(post);
        }

        if (action === 'visibility') {
            if (!canToggleVisibility(post)) return toast('내 개인 사진만 공개 여부를 변경할 수 있습니다.', true);
            const currentVisibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
            const nextVisibility = currentVisibility === 'FRIENDS' ? 'PRIVATE' : 'FRIENDS';
            try {
                const result = await request(`/api/photo-posts/${postId}/visibility`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visibilityType: nextVisibility })
                });
                const updatedPost = result && result.post ? result.post : { visibilityType: nextVisibility, VISIBILITY_TYPE: nextVisibility };
                Object.assign(state.post, updatedPost);
                render();
                document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId, visibilityType: nextVisibility } }));
                toast(nextVisibility === 'FRIENDS' ? 'MOYO 피드에 공개했습니다.' : '나만 보기로 전환했습니다.');
            } catch (error) {
                toast(error.message || '공개 설정을 변경하지 못했습니다.', true);
            }
            return;
        }

        if (action === 'delete') {
            if (!canManagePost(post)) return toast('삭제 권한이 없습니다.', true);
            if (!confirm('사진을 휴지통으로 이동할까요?')) return;
            try {
                await request(`/api/photo-posts/${postId}`, { method: 'DELETE' });
                document.dispatchEvent(new CustomEvent('moyo:photo-post-deleted', { detail: { postId } }));
                removeCurrentPostCard(postId);
                close();
                toast('사진을 휴지통으로 이동했습니다.');
            } catch (error) {
                toast(error.message || '사진을 삭제하지 못했습니다.', true);
            }
            return;
        }

        if (action === 'share') {
            return openStandaloneShareModal(post);
        }

        if (action === 'collect') {
            return handleStandaloneCollect(post);
        }

        if (action === 'restore' || action === 'permanent') {
            window.location.href = photoAlbumUrl(post);
        }
    }

    function albumMetaMarkup(post) {
        const albumName = pick(post, 'albumName', 'ALBUM_NAME');
        const currentUserId = getCurrentUserId();
        const ownerId = postOwnerId(post);
        // 앨범은 작성자 개인 정리 정보이므로 작성자 본인에게만 노출한다.
        if (!currentUserId || !ownerId || Number(currentUserId) !== Number(ownerId)) return '';
        if (!albumName || isUnclassifiedAlbumName(albumName)) return '';
        return `<span class="photo-runtime-album-chip">${svgIcon('folder')}<span>${esc(albumName)}</span></span>`;
    }

    function detailVisibilityChip(type, label, iconMarkup, title) {
        return `<span class="photo-detail-visibility-chip photo-detail-visibility-chip--${esc(type)}"${title ? ` title="${esc(title)}"` : ''}>${iconMarkup ? `<span class="photo-detail-visibility-chip__mark">${iconMarkup}</span>` : ''}<span class="photo-detail-visibility-chip__text">${esc(label)}</span></span>`;
    }

    function visibilityBadgeMarkup(post) {
        const visibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        const scope = normalizeScope(post);
        if (visibility === 'FRIENDS') {
            const mark = `<img src="${esc(moyoMascotPath())}" alt="" loading="lazy">`;
            return detailVisibilityChip('moyo', 'MOYO 공개', mark, 'MOYO 공개');
        }
        if (visibility === 'SELECTED') return detailVisibilityChip('selected', '선택 친구', '', '선택 친구');
        if (scope === 'WORKSPACE' || visibility === 'WORKSPACE' || visibility === 'WS') return detailVisibilityChip('workspace', '그룹', '', '그룹');
        if (scope === 'PROJECT' || visibility === 'PROJECT' || visibility === 'PROJ') return detailVisibilityChip('project', '프로젝트', '', '프로젝트');
        return detailVisibilityChip('private', '비공개', '', '비공개');
    }

    function apiUrl(url) {
        const value = String(url || '');
        if (/^(https?:)?\/\//i.test(value)) return value;
        const contextPath = getContextPath();
        if (!contextPath || !value.startsWith('/')) return value;
        return `${contextPath}${value}`;
    }

    async function request(url, options) {
        const fetchOptions = Object.assign({ credentials: 'include', cache: 'no-store' }, options || {});
        fetchOptions.headers = Object.assign({ 'X-Requested-With': 'XMLHttpRequest' }, fetchOptions.headers || {});
        const response = await fetch(apiUrl(url), fetchOptions);
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || body.error || '요청을 처리하지 못했습니다.');
        return body;
    }

    let toastTimer;
    function toast(message, error) {
        let node = document.getElementById('photoCommonDetailToast');
        if (!node) {
            node = document.createElement('div');
            node.id = 'photoCommonDetailToast';
            node.className = 'photo-common-detail-toast';
            document.body.appendChild(node);
        }
        node.textContent = message || '';
        node.classList.toggle('is-error', !!error);
        node.classList.add('is-show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => node.classList.remove('is-show'), 2400);
    }

    function normalizeDetail(data, requestedPostId) {
        const post = data && data.post ? data.post : {};
        let photos = Array.isArray(data && data.photos) ? data.photos.filter(Boolean) : [];
        const coverPath = pick(post, 'coverPath', 'COVER_PATH');
        if (!photos.length && coverPath) photos = [{ postId: requestedPostId, POST_ID: requestedPostId, filePath: coverPath, FILE_PATH: coverPath }];
        return { post, photos };
    }

    function renderAvatar(node, name, imagePath) {
        if (!node) return;
        const initial = String(name || 'M').trim().charAt(0).toUpperCase() || 'M';
        const resolved = resolveAssetPath(imagePath);
        node.classList.toggle('has-image', !!resolved);
        node.innerHTML = resolved
            ? `<img src="${esc(resolved)}" alt="${esc(name || '프로필')}" onerror="this.closest('.photo-runtime-avatar,.photo-runtime-comment-avatar,.mention-avatar').classList.remove('has-image');this.remove();">`
            : esc(initial);
    }

    function bindBoxEvents(box) {
        if (!box || box.dataset.photoCommonBound === '1') return;
        box.addEventListener('click', handleBoxClick);
        box.dataset.photoCommonBound = '1';
    }

    function ensure() {
        let box = document.getElementById('photoRuntimeLightbox');
        if (!box) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="photoRuntimeLightbox" class="photo-runtime-lightbox photo-runtime-lightbox--common" aria-hidden="true">
                    <button type="button" class="photo-runtime-close" data-photo-common-close aria-label="닫기">${svgIcon('close')}</button>
                    <button type="button" class="photo-runtime-nav photo-runtime-prev" data-photo-common-prev aria-label="이전 사진">${svgIcon('prev')}</button>
                    <div class="photo-runtime-panel" role="dialog" aria-modal="true" aria-label="사진 상세">
                        <section class="photo-runtime-media">
                            <img id="photoRuntimeImage" alt="">
                            <div id="photoRuntimeGallery" class="photo-runtime-gallery" hidden>
                                <span id="photoRuntimePhotoCount" class="photo-runtime-gallery-count">1/1</span>
                                <div id="photoRuntimeDots" class="photo-runtime-gallery-dots" aria-label="사진 순서"></div>
                            </div>
                        </section>
                        <aside class="photo-runtime-side">
                            <header class="photo-runtime-author">
                                <a id="photoRuntimeAuthorLink" class="photo-runtime-author-main photo-runtime-profile-link" href="#" aria-label="작성자 프로필 보기">
                                    <span id="photoRuntimeAvatar" class="photo-runtime-avatar"></span>
                                    <span class="photo-runtime-author-text">
                                        <strong id="photoRuntimeCreator"></strong>
                                        <small id="photoRuntimeMeta"></small>
                                    </span>
                                </a>
                                <div class="photo-runtime-menu-wrap" data-photo-common-manage hidden>
                                    <button type="button" class="photo-runtime-menu-button" data-photo-common-menu-toggle aria-label="사진 관리 메뉴" aria-expanded="false">${svgIcon('more')}</button>
                                    <div class="photo-runtime-menu" data-photo-common-menu hidden>
                                        <button type="button" data-photo-common-action="edit">${svgIcon('edit')}<span>수정</span></button>
                                        <button type="button" data-photo-common-action="visibility">${svgIcon('eye')}<span>MOYO 공개</span></button>
                                        <button type="button" data-photo-common-action="move">${svgIcon('folder')}<span>앨범 이동</span></button>
                                        <button type="button" class="danger" data-photo-common-action="delete">${svgIcon('trash')}<span>휴지통으로 이동</span></button>
                                        <button type="button" data-photo-common-action="restore">${svgIcon('restore')}<span>복원</span></button>
                                        <button type="button" class="danger" data-photo-common-action="permanent">${svgIcon('trash')}<span>영구 삭제</span></button>
                                    </div>
                                </div>
                            </header>
                            <section class="photo-runtime-stats">
                                <button type="button" class="photo-runtime-like" data-photo-common-like aria-pressed="false" aria-label="좋아요">${svgIcon('heart')}<strong id="photoRuntimeLikeCount">0</strong></button>
                                <span class="photo-runtime-comment-stat" aria-label="댓글">${svgIcon('comment')}<strong id="photoRuntimeCommentCount">0</strong></span>
                                <span class="photo-runtime-action-pair">
                                    <button type="button" class="photo-runtime-share" data-photo-common-share aria-label="사진 공유" title="공유">${svgIcon('send')}</button>
                                    <button type="button" class="photo-runtime-collect" data-photo-common-collect aria-label="담아가기" title="담아가기">${svgIcon('bookmark')}</button>
                                    <span id="photoRuntimeCollectedSource" class="photo-collected-source-runtime" hidden></span>
                                </span>
                                <span id="photoRuntimeVisibilityBadge" class="photo-runtime-visibility-badge" hidden></span>
                            </section>
                            <section id="photoRuntimeDescription" class="photo-runtime-description" hidden>
                                <p id="photoRuntimeTitle"></p>
                            </section>
                            <div class="photo-runtime-detail-meta" data-runtime-detail-meta hidden>
                                <small id="photoRuntimeAlbum" hidden></small>
                            </div>
                            <section class="photo-runtime-comments" aria-label="댓글">
                                <div class="photo-runtime-comment-title">댓글</div>
                                <div id="photoRuntimeComments" class="photo-runtime-comment-list"></div>
                            </section>
                            <form id="photoRuntimeCommentForm" class="photo-runtime-comment-form" data-photo-common-comment-form>
                                <div id="photoRuntimeReplyTarget" class="photo-runtime-reply-target" hidden></div>
                                <input type="hidden" id="photoRuntimeParentCommentId" value="">
                                <textarea id="photoRuntimeCommentInput" maxlength="500" rows="1" placeholder="댓글을 입력하세요."></textarea>
                                <div id="photoRuntimeMentionList" class="photo-runtime-mention-list" hidden></div>
                                <button type="submit">등록</button>
                            </form>
                        </aside>
                    </div>
                    <button type="button" class="photo-runtime-nav photo-runtime-next" data-photo-common-next aria-label="다음 사진">${svgIcon('next')}</button>
                </div>`);
            box = document.getElementById('photoRuntimeLightbox');
        }
        bindBoxEvents(box);
        return runtimeNodes();
    }

    function runtimeNodes() {
        const box = document.getElementById('photoRuntimeLightbox');
        return {
            box,
            image: document.getElementById('photoRuntimeImage'),
            gallery: document.getElementById('photoRuntimeGallery'),
            count: document.getElementById('photoRuntimePhotoCount'),
            dots: document.getElementById('photoRuntimeDots'),
            authorLink: document.getElementById('photoRuntimeAuthorLink'),
            avatar: document.getElementById('photoRuntimeAvatar'),
            creator: document.getElementById('photoRuntimeCreator'),
            meta: document.getElementById('photoRuntimeMeta'),
            descWrap: document.getElementById('photoRuntimeDescription'),
            desc: document.getElementById('photoRuntimeTitle'),
            detailMeta: box ? box.querySelector('[data-runtime-detail-meta]') : null,
            album: document.getElementById('photoRuntimeAlbum'),
            collectedSource: document.getElementById('photoRuntimeCollectedSource'),
            stats: box ? box.querySelector('.photo-runtime-stats') : null,
            commentSection: box ? box.querySelector('.photo-runtime-comments') : null,
            manage: box ? box.querySelector('[data-photo-common-manage]') : null,
            menuToggle: box ? box.querySelector('[data-photo-common-menu-toggle]') : null,
            menu: box ? box.querySelector('[data-photo-common-menu]') : null,
            share: box ? box.querySelector('[data-photo-common-share]') : null,
            collect: box ? box.querySelector('[data-photo-common-collect]') : null,
            like: box ? box.querySelector('[data-photo-common-like]') : null,
            likeCount: document.getElementById('photoRuntimeLikeCount'),
            commentCount: document.getElementById('photoRuntimeCommentCount'),
            visibilityBadge: document.getElementById('photoRuntimeVisibilityBadge'),
            comments: document.getElementById('photoRuntimeComments'),
            form: document.getElementById('photoRuntimeCommentForm'),
            input: document.getElementById('photoRuntimeCommentInput'),
            mentionList: document.getElementById('photoRuntimeMentionList'),
            replyTarget: document.getElementById('photoRuntimeReplyTarget'),
            parentCommentId: document.getElementById('photoRuntimeParentCommentId'),
            prev: box ? box.querySelector('[data-photo-common-prev]') : null,
            next: box ? box.querySelector('[data-photo-common-next]') : null
        };
    }

    function openBox() {
        const n = ensure();
        n.box.removeAttribute('hidden');
        n.box.setAttribute('aria-hidden', 'false');
        document.body.classList.add('photo-lightbox-open', 'photo-detail-open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        const n = ensure();
        n.box.setAttribute('aria-hidden', 'true');
        n.box.setAttribute('hidden', '');
        document.body.classList.remove('photo-lightbox-open', 'photo-detail-open');
        document.body.style.overflow = '';
        state.post = null;
        state.photos = [];
        state.comments = [];
        state.index = 0;
        cancelReply();
    }

    function move(delta) {
        if (!state.photos.length) return;
        state.index = (state.index + delta + state.photos.length) % state.photos.length;
        render();
    }

    function activeCommentCount(comments) {
        return (Array.isArray(comments || state.comments) ? (comments || state.comments) : []).filter(comment => String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() !== 'Y').length;
    }

    function buildCommentTree(comments) {
        const source = Array.isArray(comments) ? comments : [];
        const byId = new Map();
        const roots = [];
        source.forEach(comment => {
            const id = Number(pick(comment, 'commentId', 'COMMENT_ID'));
            if (!id) return;
            comment.children = [];
            comment.replyToName = '';
            comment.REPLY_TO_NAME = '';
            byId.set(id, comment);
        });
        function rootOf(comment) {
            let current = comment;
            const visited = new Set();
            while (current) {
                const currentId = Number(pick(current, 'commentId', 'COMMENT_ID'));
                const parentId = Number(pick(current, 'parentCommentId', 'PARENT_COMMENT_ID'));
                if (!parentId || !byId.has(parentId) || visited.has(currentId)) return current;
                visited.add(currentId);
                current = byId.get(parentId);
            }
            return comment;
        }
        source.forEach(comment => {
            const id = Number(pick(comment, 'commentId', 'COMMENT_ID'));
            if (!id) return;
            const parentId = Number(pick(comment, 'parentCommentId', 'PARENT_COMMENT_ID'));
            if (parentId && byId.has(parentId)) {
                const parent = byId.get(parentId);
                const root = rootOf(parent);
                const parentName = pick(parent, 'userName', 'USER_NAME') || '사용자';
                comment.replyToName = parentName;
                comment.REPLY_TO_NAME = parentName;
                root.children.push(comment);
            } else {
                roots.push(comment);
            }
        });
        return roots;
    }

    function mentionText(name) {
        const value = String(name || '').trim();
        return value ? `@${value}` : '';
    }

    function formatCommentContent(content) {
        const text = String(content || '');
        const match = text.match(/^(@[^\s]+)(\s+)([\s\S]*)$/);
        if (!match) return esc(text);
        return `<span class="photo-runtime-comment-mention">${esc(match[1])}</span>${esc(match[2])}${esc(match[3])}`;
    }

    function findComment(commentId) {
        return (state.comments || []).find(comment => Number(pick(comment, 'commentId', 'COMMENT_ID')) === Number(commentId)) || null;
    }

    function renderCommentItem(comment, depth, rootCommentId) {
        const commentId = Number(pick(comment, 'commentId', 'COMMENT_ID'));
        const rootId = rootCommentId || commentId;
        const userId = Number(pick(comment, 'userId', 'USER_ID'));
        const currentUserId = getCurrentUserId();
        const name = pick(comment, 'userName', 'USER_NAME') || '사용자';
        const content = pick(comment, 'commentContent', 'COMMENT_CONTENT') || '';
        const replyToName = pick(comment, 'replyToName', 'REPLY_TO_NAME') || '';
        const created = pick(comment, 'createdAt', 'CREATED_AT') || '';
        const profile = pick(comment, 'profileImagePath', 'PROFILE_IMAGE_PATH', 'creatorProfileImagePath', 'CREATOR_PROFILE_IMAGE_PATH');
        const deleted = String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() === 'Y';
        const liked = Number(pick(comment, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(comment, 'likeCount', 'LIKE_COUNT') || 0);
        const canEdit = !deleted && userId === currentUserId;
        const canManage = !deleted && (userId === currentUserId || postOwnerId(state.post) === currentUserId || isAdminUser());
        const avatarCore = profile && !deleted
            ? `<span class="photo-runtime-comment-avatar has-image"><img src="${esc(resolveAssetPath(profile))}" alt="${esc(name)}"></span>`
            : `<span class="photo-runtime-comment-avatar">${deleted ? '·' : esc(String(name).trim().charAt(0).toUpperCase() || 'M')}</span>`;
        const avatar = !deleted && userId
            ? `<a ${profileLinkAttrs(userId, name, 'photo-runtime-comment-profile photo-runtime-comment-profile--avatar')}>${avatarCore}</a>`
            : avatarCore;
        const nameMarkup = !deleted && userId
            ? `<a ${profileLinkAttrs(userId, name, 'photo-runtime-comment-profile photo-runtime-comment-profile--name')}>${esc(name)}</a>`
            : `<strong>${deleted ? '삭제된 댓글' : esc(name)}</strong>`;
        const children = depth === 0 && Array.isArray(comment.children) && comment.children.length
            ? `<div class="photo-runtime-comment-children">${comment.children.map(child => renderCommentItem(child, 1, rootId)).join('')}</div>`
            : '';
        const mention = !deleted && depth > 0 && replyToName && !String(content || '').trim().startsWith('@')
            ? `<span class="photo-runtime-comment-mention">${esc(mentionText(replyToName))}</span> `
            : '';
        const body = deleted ? '삭제된 댓글입니다.' : content;
        return `<article class="photo-runtime-comment-item ${depth > 0 ? 'is-reply' : ''} ${deleted ? 'is-deleted' : ''}">
            ${avatar}
            <div class="photo-runtime-comment-main">
                <div class="photo-runtime-comment-body">
                    <div class="photo-runtime-comment-head">${nameMarkup}<small>${esc(created)}</small></div>
                    <p>${mention}${formatCommentContent(body)}</p>
                    <div class="photo-runtime-comment-tools">
                        ${!deleted ? `<button type="button" class="photo-runtime-comment-like${liked ? ' liked' : ''}" data-photo-common-like-comment="${commentId}" aria-pressed="${liked}" aria-label="댓글 좋아요">${svgIcon('heart')}<span>${likeCount}</span></button>` : ''}
                        ${!deleted ? `<button type="button" data-photo-common-reply-comment="${rootId}" data-photo-common-reply-name="${esc(name)}">답글</button>` : ''}
                        ${canEdit ? `<button type="button" class="photo-runtime-comment-edit" data-photo-common-edit-comment="${commentId}" aria-label="댓글 수정">수정</button>` : ''}
                        ${canManage ? `<button type="button" class="photo-runtime-comment-delete" data-photo-common-delete-comment="${commentId}" aria-label="댓글 삭제">삭제</button>` : ''}
                    </div>
                </div>
                ${children}
            </div>
        </article>`;
    }

    function renderComments() {
        const n = ensure();
        const comments = Array.isArray(state.comments) ? state.comments : [];
        if (n.commentCount) n.commentCount.textContent = String(activeCommentCount(comments));
        if (!n.comments) return;
        if (!comments.length) {
            n.comments.innerHTML = '<div class="photo-runtime-comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div>';
            return;
        }
        n.comments.innerHTML = buildCommentTree(comments).map(comment => renderCommentItem(comment, 0)).join('');
    }

    function renderDots(n, total) {
        if (!n.gallery || !n.dots || !n.count) return;
        n.box.classList.toggle('is-single-photo', total <= 1);
        n.box.classList.toggle('has-multiple-photos', total > 1);
        if (total <= 1) {
            n.gallery.hidden = true;
            n.dots.innerHTML = '';
            return;
        }
        n.gallery.hidden = false;
        n.count.textContent = `${state.index + 1}/${total}`;
        n.dots.innerHTML = state.photos.map((_, index) => `<button type="button" class="photo-runtime-gallery-dot${index === state.index ? ' active' : ''}" data-photo-common-dot="${index}" aria-label="${index + 1}번째 사진" aria-current="${index === state.index ? 'true' : 'false'}"></button>`).join('');
    }

    function renderDescription(n, desc) {
        if (!n.descWrap || !n.desc) return;
        const normalized = String(desc || '').trim();
        n.desc.textContent = normalized;
        n.descWrap.hidden = !normalized;
        n.desc.classList.remove('is-collapsed', 'is-expanded');
        const oldToggle = n.descWrap.querySelector('[data-photo-common-desc-toggle]');
        if (oldToggle) oldToggle.remove();
        if (!normalized) return;
        const isLong = normalized.split('\n').length > 5 || normalized.replace(/\s+/g, ' ').length > 170;
        const expanded = !!state.descExpanded;
        n.desc.classList.toggle('is-collapsed', isLong && !expanded);
        n.desc.classList.toggle('is-expanded', isLong && expanded);
        if (isLong) {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'photo-runtime-desc-toggle';
            toggle.dataset.photoCommonDescToggle = '1';
            toggle.textContent = expanded ? '접기' : '더보기';
            n.descWrap.appendChild(toggle);
        }
    }

    function syncActionButtons(n, post) {
        const trashMode = isTrashPost(post);
        const hasActionHost = hasPhotoAlbumHost();
        const canManage = canManagePost(post);
        const canVisibility = canToggleVisibility(post);
        const visibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        if (n.manage) {
            n.manage.hidden = !canManage;
            if (!canManage && n.menu) n.menu.hidden = true;
        }
        if (n.menu) n.menu.hidden = true;
        if (n.menuToggle) n.menuToggle.setAttribute('aria-expanded', 'false');
        if (n.stats) n.stats.hidden = trashMode;
        if (n.commentSection) n.commentSection.hidden = trashMode;
        if (n.form) n.form.hidden = trashMode;
        if (n.share) n.share.hidden = trashMode;
        if (n.collect) {
            const ownerId = postOwnerId(post);
            const currentUserId = getCurrentUserId();
            const collectedCopy = isCollectedCopyPost(post);
            const collected = isCollectedPost(post) || collectedCopy;
            const showCollect = !trashMode && !!ownerId && !!currentUserId && Number(ownerId) !== Number(currentUserId);
            n.collect.hidden = !showCollect;
            n.collect.classList.toggle('is-collected', collected);
            n.collect.classList.toggle('is-collected-copy', collectedCopy);
            n.collect.setAttribute('aria-label', collected ? '담아가기 취소' : '담아가기');
            n.collect.setAttribute('title', collected ? '담아가기 취소' : '담아가기');
        }
        if (n.menu) {
            const setHidden = (selector, hidden) => { const item = n.menu.querySelector(selector); if (item) item.hidden = hidden; };
            setHidden('[data-photo-common-action="edit"]', trashMode || !canManage);
            setHidden('[data-photo-common-action="visibility"]', trashMode || !canVisibility);
            setHidden('[data-photo-common-action="move"]', trashMode || !canManage);
            setHidden('[data-photo-common-action="delete"]', trashMode || !canManage);
            setHidden('[data-photo-common-action="restore"]', !trashMode || !canManage || !hasActionHost);
            setHidden('[data-photo-common-action="permanent"]', !trashMode || !canManage || !hasActionHost);
            const visibilityButton = n.menu.querySelector('[data-photo-common-action="visibility"]');
            if (visibilityButton) {
                const span = visibilityButton.querySelector('span');
                if (span) span.textContent = visibility === 'FRIENDS' ? '비공개 전환' : 'MOYO 공개';
            }
        }
    }

    function render() {
        const n = ensure();
        const post = state.post || {};
        const photo = state.photos[state.index] || {};
        const imagePath = pick(photo, 'filePath', 'FILE_PATH') || pick(post, 'coverPath', 'COVER_PATH');
        const desc = pick(post, 'description', 'DESCRIPTION') || '';
        const creator = authorName(post);
        const created = pick(post, 'createdAt', 'CREATED_AT') || '';
        const sourceName = collectedSourceName(post);
        const sourceMetaText = isCollectedCopyPost(post) ? (sourceName ? `원본 ${sourceName}` : '원본 사진') : '';
        const liked = Number(pick(post, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(post, 'likeCount', 'LIKE_COUNT') || 0);
        const total = state.photos.length || 1;

        if (n.image) {
            const resolvedImage = resolveAssetPath(imagePath);
            const currentSrc = n.image.getAttribute('src') || '';
            if (resolvedImage && currentSrc !== resolvedImage) {
                // open() preloads this image before render(). Do not remove is-loaded here;
                // otherwise the dark media background flashes before the modal is visible.
                n.image.onload = null;
                n.image.classList.add('is-loaded');
                n.image.src = resolvedImage;
            } else if (resolvedImage) {
                n.image.classList.add('is-loaded');
            } else if (!resolvedImage) {
                n.image.removeAttribute('src');
                n.image.classList.remove('is-loaded');
            }
        }
        if (n.authorLink) {
            const ownerUrl = profileUrl(postOwnerId(post));
            if (ownerUrl) {
                n.authorLink.href = ownerUrl;
                n.authorLink.setAttribute('aria-label', `${creator} 프로필 보기`);
                n.authorLink.classList.remove('is-disabled');
            } else {
                n.authorLink.removeAttribute('href');
                n.authorLink.removeAttribute('aria-label');
                n.authorLink.classList.add('is-disabled');
            }
        }
        if (n.creator) n.creator.textContent = creator;
        if (n.meta) {
            n.meta.textContent = [created, sourceMetaText].filter(Boolean).join(' · ');
            n.meta.hidden = !n.meta.textContent;
        }
        renderAvatar(n.avatar, creator, profileImageOf(post));
        renderDescription(n, desc);
        if (n.collectedSource) {
            n.collectedSource.textContent = '';
            n.collectedSource.hidden = true;
        }
        const metaMarkup = albumMetaMarkup(post);
        if (n.album) {
            n.album.innerHTML = metaMarkup;
            n.album.hidden = !metaMarkup;
        }
        if (n.detailMeta) n.detailMeta.hidden = !metaMarkup;
        if (n.like) {
            n.like.dataset.photoCommonLike = String(postIdOf(post));
            n.like.classList.toggle('liked', liked);
            n.like.setAttribute('aria-pressed', String(liked));
        }
        if (n.likeCount) n.likeCount.textContent = String(likeCount);
        if (n.visibilityBadge) {
            n.visibilityBadge.innerHTML = visibilityBadgeMarkup(post);
            n.visibilityBadge.hidden = false;
        }
        if (n.prev) n.prev.hidden = total < 2;
        if (n.next) n.next.hidden = total < 2;
        syncActionButtons(n, post);
        renderDots(n, total);
        renderComments();
    }

    function renderLoading() {
        const n = ensure();
        if (n.image) {
            n.image.classList.remove('is-loaded');
            n.image.removeAttribute('src');
        }
        if (n.creator) n.creator.textContent = '불러오는 중';
        if (n.meta) n.meta.textContent = '';
        renderAvatar(n.avatar, 'M', '');
        if (n.descWrap) n.descWrap.hidden = true;
        if (n.likeCount) n.likeCount.textContent = '0';
        if (n.commentCount) n.commentCount.textContent = '0';
        if (n.visibilityBadge) n.visibilityBadge.hidden = true;
        if (n.comments) n.comments.innerHTML = '<div class="photo-runtime-comment-empty">사진을 불러오는 중입니다.</div>';
        if (n.gallery) n.gallery.hidden = true;
        if (n.prev) n.prev.hidden = true;
        if (n.next) n.next.hidden = true;
    }

    async function loadComments(postId) {
        const comments = await request(`/api/photo-posts/${postId}/comments`);
        state.comments = Array.isArray(comments) ? comments : [];
    }

    async function open(postId) {
        const id = Number(postId);
        if (!id) return toast('사진 정보를 찾지 못했습니다.', true);
        state.loading = true;
        try {
            const data = await request(`/api/photo-posts/${id}`);
            const detail = normalizeDetail(data, id);
            await Promise.all([
                preloadImage(firstPhotoPath(detail)),
                loadComments(id).catch(() => { state.comments = []; })
            ]);
            state.post = detail.post;
            state.photos = detail.photos;
            state.index = 0;
            cancelReply();
            render();
            openBox();
        } catch (error) {
            toast(error.message || '사진 상세를 열지 못했습니다.', true);
        } finally {
            state.loading = false;
        }
    }

    async function toggleLike(postId) {
        const id = Number(postId);
        if (!id) return;
        try {
            const result = await request('/api/reactions/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentType: 'PHOTO_POST', contentId: id, reactionType: 'LIKE', currentUserId: getCurrentUserId() })
            });
            const liked = !!result.liked;
            const likeCount = Number(result.likeCount || 0);
            if (state.post && postIdOf(state.post) === id) {
                state.post.likedByMe = liked ? 1 : 0;
                state.post.LIKED_BY_ME = liked ? 1 : 0;
                state.post.likeCount = likeCount;
                state.post.LIKE_COUNT = likeCount;
                render();
            }
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId: id, liked, likeCount } }));
        } catch (error) {
            toast(error.message || '좋아요를 처리하지 못했습니다.', true);
        }
    }

    async function toggleCommentLike(commentId) {
        const id = Number(commentId);
        const postId = postIdOf(state.post);
        if (!id || !postId) return;
        try {
            const result = await request('/api/reactions/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentType: 'PHOTO_COMMENT', contentId: id, reactionType: 'LIKE', currentUserId: getCurrentUserId() })
            });
            const comment = findComment(id);
            if (comment) {
                comment.likedByMe = result.liked ? 1 : 0;
                comment.LIKED_BY_ME = result.liked ? 1 : 0;
                comment.likeCount = Number(result.likeCount || 0);
                comment.LIKE_COUNT = Number(result.likeCount || 0);
                renderComments();
            }
        } catch (error) {
            toast(error.message || '댓글 좋아요를 처리하지 못했습니다.', true);
        }
    }

    function mentionUsers() {
        const users = new Map();
        const add = (id, name, profile, label) => {
            const clean = String(name || '').trim();
            if (!clean) return;
            const key = String(id || clean);
            if (!users.has(key)) users.set(key, { id: key, name: clean, profile: profile || '', label: label || '' });
        };
        if (state.post) add(postOwnerId(state.post), authorName(state.post), profileImageOf(state.post), '작성자');
        (state.comments || []).forEach(comment => {
            if (String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() === 'Y') return;
            add(pick(comment, 'userId', 'USER_ID'), pick(comment, 'userName', 'USER_NAME'), pick(comment, 'profileImagePath', 'PROFILE_IMAGE_PATH'), '댓글');
        });
        return Array.from(users.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }

    function currentMentionQuery(input) {
        if (!input) return null;
        const value = input.value || '';
        const caret = input.selectionStart == null ? value.length : input.selectionStart;
        const before = value.slice(0, caret);
        const match = before.match(/(^|\s)@([^@\s]*)$/);
        if (!match) return null;
        const start = before.length - match[2].length - 1;
        return { start, end: caret, keyword: match[2] || '' };
    }

    function autosizeInput(input) {
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = Math.min(Math.max(input.scrollHeight, 44), 104) + 'px';
    }

    function closeMentionList() {
        const n = ensure();
        if (!n.mentionList) return;
        n.mentionList.hidden = true;
        n.mentionList.innerHTML = '';
    }

    function renderMentionList() {
        const n = ensure();
        if (!n.mentionList || !n.input) return;
        const query = currentMentionQuery(n.input);
        if (!query) return closeMentionList();
        const keyword = query.keyword.trim().toLowerCase();
        const candidates = mentionUsers().filter(user => !keyword || user.name.toLowerCase().includes(keyword) || mentionText(user.name).toLowerCase().includes('@' + keyword)).slice(0, 8);
        if (!candidates.length) {
            n.mentionList.innerHTML = '<div class="photo-runtime-mention-option" aria-disabled="true"><span class="mention-avatar">?</span><strong>일치하는 사용자가 없습니다</strong></div>';
            n.mentionList.hidden = false;
            return;
        }
        n.mentionList.innerHTML = candidates.map((user, index) => {
            const src = resolveAssetPath(user.profile);
            const avatar = src ? `<span class="mention-avatar has-image"><img src="${esc(src)}" alt="${esc(user.name)}"></span>` : `<span class="mention-avatar">${esc(String(user.name).charAt(0) || '?')}</span>`;
            return `<button type="button" class="photo-runtime-mention-option${index === 0 ? ' active' : ''}" data-photo-common-mention-user="${esc(user.name)}">${avatar}<strong>${esc(mentionText(user.name))}</strong>${user.label ? `<small>${esc(user.label)}</small>` : ''}</button>`;
        }).join('');
        n.mentionList.hidden = false;
    }

    function applyMention(name) {
        const n = ensure();
        const query = currentMentionQuery(n.input);
        const mention = mentionText(name);
        if (!query || !mention) return;
        const value = n.input.value || '';
        n.input.value = `${value.slice(0, query.start)}${mention} ${value.slice(query.end)}`;
        const caret = query.start + mention.length + 1;
        n.input.focus();
        n.input.setSelectionRange(caret, caret);
        autosizeInput(n.input);
        closeMentionList();
    }

    function focusReply(parentCommentId, name) {
        const n = ensure();
        const replyName = String(name || '').trim();
        if (n.parentCommentId) n.parentCommentId.value = parentCommentId ? String(parentCommentId) : '';
        if (n.input) {
            n.input.dataset.replyMention = replyName;
            n.input.placeholder = replyName ? `${mentionText(replyName)} 답글을 입력하세요.` : '답글을 입력하세요.';
            n.input.focus();
            autosizeInput(n.input);
        }
        if (n.replyTarget) {
            n.replyTarget.hidden = false;
            n.replyTarget.innerHTML = `<span>${esc(mentionText(replyName) || '댓글')}에게 답글 작성 중</span><button type="button" data-photo-common-reply-cancel>취소</button>`;
        }
    }

    function cancelReply() {
        const n = runtimeNodes();
        closeMentionList();
        if (n.parentCommentId) n.parentCommentId.value = '';
        if (n.replyTarget) {
            n.replyTarget.hidden = true;
            n.replyTarget.innerHTML = '';
        }
        if (n.input) {
            delete n.input.dataset.replyMention;
            delete n.input.dataset.editCommentId;
            n.input.placeholder = '댓글을 입력하세요.';
            n.input.value = '';
            autosizeInput(n.input);
        }
    }

    function focusEditComment(commentId) {
        const n = ensure();
        const comment = findComment(commentId);
        if (!comment || !n.input) return;
        const userId = Number(pick(comment, 'userId', 'USER_ID'));
        if (userId !== getCurrentUserId()) return toast('내 댓글만 수정할 수 있습니다.', true);
        if (n.parentCommentId) n.parentCommentId.value = '';
        n.input.dataset.editCommentId = String(commentId);
        delete n.input.dataset.replyMention;
        n.input.value = pick(comment, 'commentContent', 'COMMENT_CONTENT') || '';
        n.input.placeholder = '댓글을 수정하세요.';
        if (n.replyTarget) {
            n.replyTarget.hidden = false;
            n.replyTarget.innerHTML = `<span>댓글 수정 중</span><button type="button" data-photo-common-edit-cancel>취소</button>`;
        }
        n.input.focus();
        autosizeInput(n.input);
        closeMentionList();
    }

    async function createComment(form) {
        const postId = postIdOf(state.post);
        const n = ensure();
        let content = n.input ? n.input.value.trim() : '';
        const editingCommentId = n.input && n.input.dataset.editCommentId ? Number(n.input.dataset.editCommentId) : null;
        const parentCommentId = n.parentCommentId && n.parentCommentId.value ? Number(n.parentCommentId.value) : null;
        const replyMention = n.input && n.input.dataset.replyMention ? mentionText(n.input.dataset.replyMention) : '';
        if (replyMention && !content.startsWith('@')) content = `${replyMention} ${content}`.trim();
        if (!postId || !content) return toast(editingCommentId ? '수정할 내용을 입력해주세요.' : '댓글을 입력해주세요.', true);
        const button = form.querySelector('button[type="submit"]');
        if (button) button.disabled = true;
        try {
            const result = editingCommentId
                ? await request(`/api/photo-posts/${postId}/comments/${editingCommentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                })
                : await request(`/api/photo-posts/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, parentCommentId })
                });
            state.comments = Array.isArray(result.comments) ? result.comments : [];
            cancelReply();
            render();
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId, commentCount: activeCommentCount() } }));
        } catch (error) {
            toast(error.message || '댓글을 등록하지 못했습니다.', true);
        } finally {
            if (button) button.disabled = false;
        }
    }

    async function deleteComment(commentId) {
        const postId = postIdOf(state.post);
        if (!postId || !commentId) return;
        if (!confirm('댓글을 삭제할까요?')) return;
        try {
            const result = await request(`/api/photo-posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
            state.comments = Array.isArray(result.comments) ? result.comments : [];
            render();
        } catch (error) {
            toast(error.message || '댓글을 삭제하지 못했습니다.', true);
        }
    }

    function handleBoxClick(event) {
        const n = ensure();
        if (event.target === n.box || event.target.closest('[data-photo-common-close]')) return close();
        const menuToggle = event.target.closest('[data-photo-common-menu-toggle]');
        if (menuToggle) {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !!(n.menu && n.menu.hidden);
            if (n.menu) n.menu.hidden = !willOpen;
            menuToggle.setAttribute('aria-expanded', String(willOpen));
            return;
        }
        if (!event.target.closest('[data-photo-common-manage]') && n.menu) n.menu.hidden = true;
        const action = event.target.closest('[data-photo-common-action]');
        if (action) {
            event.preventDefault();
            if (n.menu) n.menu.hidden = true;
            actionEvent(action.dataset.photoCommonAction || '');
            return;
        }
        const descToggle = event.target.closest('[data-photo-common-desc-toggle]');
        if (descToggle) {
            event.preventDefault();
            state.descExpanded = !state.descExpanded;
            return render();
        }
        const share = event.target.closest('[data-photo-common-share]');
        if (share) { event.preventDefault(); return actionEvent('share'); }
        const collect = event.target.closest('[data-photo-common-collect]');
        if (collect) { event.preventDefault(); return actionEvent('collect'); }
        if (event.target.closest('[data-photo-common-prev]')) return move(-1);
        if (event.target.closest('[data-photo-common-next]')) return move(1);
        const dot = event.target.closest('[data-photo-common-dot]');
        if (dot) { state.index = Number(dot.dataset.photoCommonDot || 0); return render(); }
        const like = event.target.closest('[data-photo-common-like]');
        if (like) { event.preventDefault(); return toggleLike(like.dataset.photoCommonLike); }
        const commentLike = event.target.closest('[data-photo-common-like-comment]');
        if (commentLike) { event.preventDefault(); return toggleCommentLike(commentLike.dataset.photoCommonLikeComment); }
        const reply = event.target.closest('[data-photo-common-reply-comment]');
        if (reply) return focusReply(reply.dataset.photoCommonReplyComment, reply.dataset.photoCommonReplyName || '');
        const cancel = event.target.closest('[data-photo-common-reply-cancel]');
        if (cancel) return cancelReply();
        const editCancel = event.target.closest('[data-photo-common-edit-cancel]');
        if (editCancel) return cancelReply();
        const mention = event.target.closest('[data-photo-common-mention-user]');
        if (mention) return applyMention(mention.dataset.photoCommonMentionUser || '');
        const edit = event.target.closest('[data-photo-common-edit-comment]');
        if (edit) return focusEditComment(edit.dataset.photoCommonEditComment);
        const del = event.target.closest('[data-photo-common-delete-comment]');
        if (del) return deleteComment(del.dataset.photoCommonDeleteComment);
    }

    document.addEventListener('submit', event => {
        const form = event.target.closest('[data-photo-common-comment-form]');
        if (!form) return;
        event.preventDefault();
        createComment(form);
    });

    document.addEventListener('input', event => {
        const input = event.target.closest && event.target.closest('#photoRuntimeCommentInput');
        if (!input) return;
        autosizeInput(input);
        renderMentionList();
    });

    document.addEventListener('keydown', event => {
        const box = document.getElementById('photoRuntimeLightbox');
        const isOpen = box && box.getAttribute('aria-hidden') === 'false';
        if (isOpen) {
            const n = runtimeNodes();
            if (event.target === n.input) {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    n.form && n.form.requestSubmit();
                    return;
                }
            }
            if (event.key === 'Escape') close();
            if (event.key === 'ArrowLeft') move(-1);
            if (event.key === 'ArrowRight') move(1);
            return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const opener = event.target.closest && event.target.closest('[data-open-photo-post-detail]');
        if (!opener) return;
        event.preventDefault();
        open(opener.dataset.openPhotoPostDetail || opener.dataset.postId);
    });

    document.addEventListener('click', event => {
        const opener = event.target.closest('[data-open-photo-post-detail]');
        if (!opener) return;
        event.preventDefault();
        event.stopPropagation();
        open(opener.dataset.openPhotoPostDetail || opener.dataset.postId);
    });



    async function openStandaloneShareByPostId(postId) {
        const id = Number(postId);
        if (!id) return toast('공유할 사진 정보를 찾지 못했습니다.', true);
        try {
            const data = await request(`/api/photo-posts/${id}`);
            const detail = normalizeDetail(data, id);
            return openStandaloneShareModal(detail.post || { postId: id, POST_ID: id });
        } catch (error) {
            toast(error.message || '공유 상태를 불러오지 못했습니다.', true);
        }
    }

    function updateProfilePhotoCard(detail) {
        const postId = String(detail && detail.postId || '');
        if (!postId) return;
        const escaped = window.CSS && CSS.escape ? CSS.escape(postId) : postId.replace(/"/g, '\\"');
        document.querySelectorAll(`.profile-photo-card[data-post-id="${escaped}"]`).forEach(card => {
            if (detail.likeCount !== undefined) {
                const likeButton = card.querySelector('[data-profile-photo-like]');
                const likeCount = card.querySelector('[data-profile-photo-like-count]');
                if (likeButton) likeButton.classList.toggle('is-liked', !!detail.liked);
                if (likeCount) likeCount.textContent = String(Number(detail.likeCount || 0));
            }
            if (detail.commentCount !== undefined) {
                const commentCount = card.querySelector('[data-profile-photo-comment-count]');
                if (commentCount) commentCount.textContent = String(Number(detail.commentCount || 0));
            }
        });
    }

    document.addEventListener('click', event => {
        const like = event.target.closest && event.target.closest('[data-profile-photo-like]');
        const share = event.target.closest && event.target.closest('[data-profile-photo-share]');
        const comment = event.target.closest && event.target.closest('[data-profile-photo-comment]');
        const action = like || share || comment;
        if (!action) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (like) return toggleLike(like.dataset.profilePhotoLike);
        if (share) return openStandaloneShareByPostId(share.dataset.profilePhotoShare);
        if (comment) return open(comment.dataset.profilePhotoComment);
    }, true);

    document.addEventListener('moyo:photo-post-updated', event => updateProfilePhotoCard(event.detail || {}));




    const albumMoveState = {
        post: null,
        albums: [],
        currentAlbumId: null,
        selectedAlbumId: null,
        count: 1,
        loading: false,
        editingAlbumId: null,
        options: {}
    };

    function numberOrNull(value) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : null;
    }

    function albumDescriptionOf(album) {
        return pick(album, 'albumDescription', 'ALBUM_DESCRIPTION', 'description', 'DESCRIPTION') || '';
    }

    function albumMoveScopeType() {
        return albumApiScopeType(albumMoveState.post);
    }

    function albumMoveScopeId() {
        return albumApiScopeId(albumMoveState.post);
    }

    function closePhotoAlbumMoveModal() {
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        if (modal) modal.remove();
        albumMoveState.post = null;
        albumMoveState.albums = [];
        albumMoveState.options = {};
        albumMoveState.editingAlbumId = null;
        const runtimeOpen = document.getElementById('photoRuntimeLightbox')?.getAttribute('aria-hidden') === 'false';
        const photoAlbumOpen = document.getElementById('postLightbox') && !document.getElementById('postLightbox').hidden;
        document.body.style.overflow = runtimeOpen || photoAlbumOpen ? 'hidden' : '';
    }

    function albumMoveMessage() {
        const count = Number(albumMoveState.count || 1);
        return count > 1 ? `선택한 ${count}개 사진을 다른 앨범으로 옮깁니다.` : '이 사진을 다른 앨범으로 옮깁니다.';
    }

    function albumMoveOptionsHtml() {
        const currentAlbumId = albumMoveState.currentAlbumId;
        const selectedAlbumId = albumMoveState.selectedAlbumId;
        const items = [{ id: null, name: '미분류', description: '앨범 없이 보관' }]
            .concat((albumMoveState.albums || []).map(album => ({
                id: albumIdOf(album),
                name: albumNameOf(album),
                description: albumDescriptionOf(album) || '이 앨범으로 이동',
                raw: album
            })));

        return items.map(option => {
            const id = numberOrNull(option.id);
            const value = id == null ? '' : String(id);
            const checked = id == null ? selectedAlbumId == null : Number(id) === Number(selectedAlbumId);
            const editable = id != null;
            const editing = editable && Number(albumMoveState.editingAlbumId || 0) === Number(id);
            const title = editing
                ? `<span class="photo-common-move-inline-edit"><input type="text" value="${esc(option.name)}" maxlength="100" data-photo-common-album-edit-input aria-label="앨범 이름"><button type="button" data-photo-common-album-edit-save="${esc(id)}">저장</button><button type="button" data-photo-common-album-edit-cancel>취소</button></span>`
                : `<span class="photo-common-move-title-row"><strong>${esc(option.name)}</strong>${editable ? `<span class="photo-common-move-manage"><button type="button" data-photo-common-album-edit="${esc(id)}" aria-label="앨범 이름 수정">${svgIcon('edit')}</button><button type="button" data-photo-common-album-delete="${esc(id)}" aria-label="앨범 삭제">${svgIcon('trash')}</button></span>` : ''}</span>`;
            return `<label class="photo-common-move-option${checked ? ' selected' : ''}${editing ? ' is-editing' : ''}${editable ? ' has-manage' : ''}">
                <input type="radio" name="photoCommonMoveAlbum" value="${esc(value)}" ${checked ? 'checked' : ''}>
                <span class="photo-common-move-icon">${svgIcon('folder')}</span>
                <span class="photo-common-move-text">${title}<small>${esc(option.description)}</small></span>
                <span class="photo-common-move-check">✓</span>
            </label>`;
        }).join('');
    }

    function renderPhotoAlbumMoveModal() {
        let modal = document.getElementById('photoCommonMoveAlbumModal');
        const body = `
            <div class="photo-common-move-modal">
                <header class="photo-common-move-header">
                    <div>
                        <h2 id="photoCommonMoveAlbumTitle">앨범으로 이동</h2>
                        <p>${esc(albumMoveMessage())}</p>
                    </div>
                    <button type="button" class="photo-common-move-close" data-photo-common-move-close aria-label="닫기">${svgIcon('close')}</button>
                </header>
                <div class="photo-common-move-tools">
                    <button type="button" class="photo-common-move-create-open" data-photo-common-album-create-open>${svgIcon('folder')} 새 앨범 만들기</button>
                    <div class="photo-common-move-create-panel" data-photo-common-album-create-panel hidden>
                        <input type="text" maxlength="100" placeholder="새 앨범 이름" data-photo-common-album-create-input aria-label="새 앨범 이름">
                        <button type="button" class="photo-common-move-mini-cancel" data-photo-common-album-create-cancel>취소</button>
                        <button type="button" class="photo-common-move-mini-submit" data-photo-common-album-create-submit>생성</button>
                    </div>
                </div>
                <div class="photo-common-move-list">${albumMoveOptionsHtml()}</div>
                <footer class="photo-common-move-footer">
                    <button type="button" class="photo-common-move-cancel" data-photo-common-move-close>취소</button>
                    <button type="button" class="photo-common-move-submit" data-photo-common-move-submit>이동</button>
                </footer>
            </div>`;
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `<div id="photoCommonMoveAlbumModal" class="photo-common-move-backdrop" role="dialog" aria-modal="true" aria-labelledby="photoCommonMoveAlbumTitle"></div>`);
            modal = document.getElementById('photoCommonMoveAlbumModal');
            modal.addEventListener('click', handlePhotoAlbumMoveModalClick);
        }
        modal.innerHTML = body;
        modal.style.setProperty('z-index', '2147483647', 'important');
        document.body.style.overflow = 'hidden';
    }

    async function reloadPhotoAlbumMoveAlbums(selectAlbumId) {
        const loader = albumMoveState.options && albumMoveState.options.loadAlbums;
        const albums = typeof loader === 'function' ? await loader(albumMoveState.post) : await loadStandaloneMoveAlbums(albumMoveState.post);
        albumMoveState.albums = Array.isArray(albums) ? albums : [];
        if (selectAlbumId !== undefined) albumMoveState.selectedAlbumId = numberOrNull(selectAlbumId);
        renderPhotoAlbumMoveModal();
    }

    async function createMoveAlbum() {
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        const input = modal && modal.querySelector('[data-photo-common-album-create-input]');
        const name = (input ? input.value : '').trim();
        if (!name) { if (input) input.focus(); return toast('앨범 이름을 입력해주세요.', true); }
        const scopeType = albumMoveScopeType();
        const scopeId = albumMoveScopeId();
        if (!scopeType || !scopeId) return toast('앨범을 만들 공간 정보를 찾지 못했습니다.', true);
        const button = modal && modal.querySelector('[data-photo-common-album-create-submit]');
        if (button) button.disabled = true;
        try {
            const result = await request('/api/photo-albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scopeType, scopeId, albumName: name, albumDescription: '' })
            });
            const newAlbumId = numberOrNull(pick(result, 'albumId', 'ALBUM_ID'));
            await reloadPhotoAlbumMoveAlbums(newAlbumId);
            toast('새 앨범을 만들고 선택했습니다.');
        } catch (error) {
            toast(error.message || '앨범을 만들지 못했습니다.', true);
        } finally {
            if (button) button.disabled = false;
        }
    }

    async function saveMoveAlbumName(albumId) {
        const id = numberOrNull(albumId);
        const album = (albumMoveState.albums || []).find(item => Number(albumIdOf(item)) === Number(id));
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        const input = modal && modal.querySelector('[data-photo-common-album-edit-input]');
        const name = (input ? input.value : '').trim();
        if (!id || !album) return;
        if (!name) { if (input) input.focus(); return toast('앨범 이름을 입력해주세요.', true); }
        try {
            await request(`/api/photo-albums/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ albumName: name, albumDescription: albumDescriptionOf(album) })
            });
            albumMoveState.editingAlbumId = null;
            await reloadPhotoAlbumMoveAlbums(albumMoveState.selectedAlbumId);
            toast('앨범 이름을 수정했습니다.');
        } catch (error) {
            toast(error.message || '앨범 이름을 수정하지 못했습니다.', true);
        }
    }

    async function deleteMoveAlbum(albumId) {
        const id = numberOrNull(albumId);
        const album = (albumMoveState.albums || []).find(item => Number(albumIdOf(item)) === Number(id));
        if (!id || !album) return;
        if (!confirm(`'${albumNameOf(album)}' 앨범을 삭제할까요?\n사진은 삭제되지 않고 앨범 없이 남습니다.`)) return;
        try {
            await request(`/api/photo-albums/${id}`, { method: 'DELETE' });
            if (Number(albumMoveState.selectedAlbumId || 0) === Number(id)) albumMoveState.selectedAlbumId = null;
            await reloadPhotoAlbumMoveAlbums(albumMoveState.selectedAlbumId);
            toast('앨범을 삭제했습니다.');
        } catch (error) {
            toast(error.message || '앨범을 삭제하지 못했습니다.', true);
        }
    }

    async function submitPhotoAlbumMove() {
        if (albumMoveState.loading) return;
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        const selected = modal && modal.querySelector('input[name="photoCommonMoveAlbum"]:checked');
        const nextAlbumId = selected && selected.value ? Number(selected.value) : null;
        if (nextAlbumId === albumMoveState.currentAlbumId) {
            closePhotoAlbumMoveModal();
            return toast('현재 선택된 앨범입니다.');
        }
        const submit = modal && modal.querySelector('[data-photo-common-move-submit]');
        albumMoveState.loading = true;
        if (submit) submit.disabled = true;
        try {
            const mover = albumMoveState.options && albumMoveState.options.move;
            if (typeof mover === 'function') await mover(nextAlbumId);
            else {
                const postId = postIdOf(albumMoveState.post);
                await request(`/api/photo-posts/${postId}/album`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ albumId: nextAlbumId })
                });
            }
            const label = selected ? selected.closest('.photo-common-move-option')?.querySelector('strong')?.textContent || '' : '';
            const onMoved = albumMoveState.options && albumMoveState.options.onMoved;
            if (typeof onMoved === 'function') await onMoved({ albumId: nextAlbumId, albumName: label });
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId: postIdOf(albumMoveState.post), albumId: nextAlbumId, albumName: label || '' } }));
            closePhotoAlbumMoveModal();
            toast(nextAlbumId ? '선택한 앨범으로 이동했습니다.' : '앨범에서 꺼냈습니다.');
        } catch (error) {
            toast(error.message || '앨범 이동을 처리하지 못했습니다.', true);
        } finally {
            albumMoveState.loading = false;
            if (submit) submit.disabled = false;
        }
    }

    function handlePhotoAlbumMoveModalClick(event) {
        const modal = document.getElementById('photoCommonMoveAlbumModal');
        if (!modal) return;
        if (event.target === modal || event.target.closest('[data-photo-common-move-close]')) {
            event.preventDefault();
            return closePhotoAlbumMoveModal();
        }
        const createOpen = event.target.closest('[data-photo-common-album-create-open]');
        if (createOpen) {
            event.preventDefault();
            const panel = modal.querySelector('[data-photo-common-album-create-panel]');
            if (panel) panel.hidden = false;
            const input = modal.querySelector('[data-photo-common-album-create-input]');
            if (input) setTimeout(() => input.focus(), 0);
            return;
        }
        if (event.target.closest('[data-photo-common-album-create-cancel]')) {
            event.preventDefault();
            const panel = modal.querySelector('[data-photo-common-album-create-panel]');
            if (panel) panel.hidden = true;
            return;
        }
        if (event.target.closest('[data-photo-common-album-create-submit]')) {
            event.preventDefault();
            return createMoveAlbum();
        }
        const editButton = event.target.closest('[data-photo-common-album-edit]');
        if (editButton) {
            event.preventDefault();
            event.stopPropagation();
            albumMoveState.editingAlbumId = numberOrNull(editButton.dataset.photoCommonAlbumEdit);
            return renderPhotoAlbumMoveModal();
        }
        const editSave = event.target.closest('[data-photo-common-album-edit-save]');
        if (editSave) {
            event.preventDefault();
            event.stopPropagation();
            return saveMoveAlbumName(editSave.dataset.photoCommonAlbumEditSave);
        }
        if (event.target.closest('[data-photo-common-album-edit-cancel]')) {
            event.preventDefault();
            event.stopPropagation();
            albumMoveState.editingAlbumId = null;
            return renderPhotoAlbumMoveModal();
        }
        const deleteButton = event.target.closest('[data-photo-common-album-delete]');
        if (deleteButton) {
            event.preventDefault();
            event.stopPropagation();
            return deleteMoveAlbum(deleteButton.dataset.photoCommonAlbumDelete);
        }
        const option = event.target.closest('.photo-common-move-option');
        if (option && !event.target.closest('.photo-common-move-inline-edit')) {
            const input = option.querySelector('input[name="photoCommonMoveAlbum"]');
            if (input) {
                input.checked = true;
                albumMoveState.selectedAlbumId = input.value ? Number(input.value) : null;
                modal.querySelectorAll('.photo-common-move-option').forEach(item => {
                    const radio = item.querySelector('input[name="photoCommonMoveAlbum"]');
                    item.classList.toggle('selected', !!radio && radio.checked);
                });
            }
            return;
        }
        if (event.target.closest('[data-photo-common-move-submit]')) {
            event.preventDefault();
            return submitPhotoAlbumMove();
        }
    }

    async function openPhotoAlbumMoveModal(options = {}) {
        const post = options.post || state.post;
        if (!post) return toast('사진 정보를 찾지 못했습니다.', true);
        const scopeType = albumApiScopeType(post);
        const scopeId = albumApiScopeId(post);
        if (!scopeType || !scopeId) return toast('앨범 이동할 수 없는 사진입니다.', true);
        albumMoveState.post = post;
        albumMoveState.options = options || {};
        albumMoveState.count = Number(options.count || 1);
        albumMoveState.currentAlbumId = numberOrNull(options.currentAlbumId !== undefined ? options.currentAlbumId : pick(post, 'albumId', 'ALBUM_ID'));
        albumMoveState.selectedAlbumId = albumMoveState.currentAlbumId;
        albumMoveState.editingAlbumId = null;
        albumMoveState.loading = false;
        try {
            const loader = options.loadAlbums;
            const albums = typeof loader === 'function' ? await loader(post) : await loadStandaloneMoveAlbums(post);
            albumMoveState.albums = Array.isArray(albums) ? albums : [];
            renderPhotoAlbumMoveModal();
        } catch (error) {
            toast(error.message || '앨범 목록을 불러오지 못했습니다.', true);
        }
    }

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (document.getElementById('photoCommonMoveAlbumModal')) {
            event.preventDefault();
            closePhotoAlbumMoveModal();
        }
    });

    window.MoyoPhotoAlbumMoveModal = { open: openPhotoAlbumMoveModal, close: closePhotoAlbumMoveModal };

    window.MoyoPhotoPostDetail = { open, close, refresh: render, toggleLike, share: openStandaloneShareByPostId };
})();
