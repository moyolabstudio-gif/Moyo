(function () {
    'use strict';

    const state = {
        post: null,
        photos: [],
        comments: [],
        commentsLoaded: false,
        index: 0,
        loading: false,
        mode: 'SOCIAL',
        viewerInfoOpen: false,
        zoom: 1,
        viewerZoomMode: 'fit',
        viewerUiTimer: null,
        viewerUiHidden: false,
        viewerPanX: 0,
        viewerPanY: 0,
        viewerDragging: false,
        viewerPanelMode: 'info',
        viewerEditingField: '',
        viewerEditingAll: false,
        viewerEditPeople: [],
        viewerPeopleExpanded: false,
        viewerDragStartX: 0,
        viewerDragStartY: 0,
        viewerDragOriginX: 0,
        viewerDragOriginY: 0,
        albumPostIds: [],
        albumPostIndex: -1,
        viewerAlbumPath: '',
        viewerAlbumPathPostId: 0,
        contextAuthor: null,
        viewerRestrictedAccess: false,
        viewerAccessModeLoaded: false,
        viewerAccessModeLoading: false
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
        return `${getContextPath()}/brand/moyo-mascot-icon.png`;
    }

    function moyoMarkPath() {
        return `${getContextPath()}/brand/moyo_mark.png`;
    }

    function svgIcon(name) {
        const icons = {
            heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
            comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5A8.48 8.48 0 0 1 21 11v.5Z"/></svg>',
            share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.7 6.8-4.4"/><path d="m8.6 13.3 6.8 4.4"/></svg>',
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
            restore: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>',
            download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
            info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/></svg>',
            minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
            plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
            reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>',
            up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
            down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
            zoom: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
            note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>',
            lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
            user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
            users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
            calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 11h18"/></svg>',
            image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>',
            imageEdit: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="15" height="14" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 16 4-4 3 3 2-2"/><path d="M14.5 19.5 20 14a1.77 1.77 0 0 1 2.5 2.5L17 22l-3 1Z"/></svg>',
            crop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/></svg>',
            clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
        };
        return icons[name] || '';
    }

    function normalizeVisibility(value) {
        return String(value || '').trim().toUpperCase();
    }

    function isMoyoPublic(post) {
        return normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE')) === 'FRIENDS';
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
        const id = Number(userId || 0);
        if (!id) return '';
        const url = contextualProfileHref(id);
        const scopedAttr = contextualProfileDataAttr(id);
        return `href="${esc(url || '#')}"${scopedAttr} class="${esc(extraClass || 'photo-runtime-profile-link')}" aria-label="${esc(name || '사용자')} 프로필 보기"`;
    }




    function photoScopePolicyContext() {
        const explorer = document.querySelector('.file-explorer');
        const scope = String(explorer?.dataset?.scope || normalizePostScope(state.post) || 'PERSONAL').trim().toUpperCase();
        const wsId = String(explorer?.dataset?.wsId || '').trim();
        const projId = String(explorer?.dataset?.projId || '').trim();
        const groupPolicy = scope === 'GROUP' || scope === 'WORKSPACE' || scope === 'WS'
            || ((scope === 'PROJECT' || scope === 'PROJ') && !!wsId);
        return {
            scope,
            wsId,
            projId,
            policy: groupPolicy ? 'GROUP' : 'PERSONAL',
            peopleLabel: groupPolicy ? '멤버' : '친구',
            togetherLabel: groupPolicy ? '함께 찍은 멤버' : '함께 찍은 친구'
        };
    }

    function usesGroupProfilePolicy() {
        return photoScopePolicyContext().policy === 'GROUP';
    }

    function contextualAuthorName(post) {
        return String(state.contextAuthor?.name || authorName(post) || '작성자').trim();
    }

    function contextualAuthorProfile(post) {
        // 그룹/그룹 프로젝트에서는 게시물에 저장된 계정 프로필로 fallback 하지 않는다.
        // 그룹 프로젝트는 상위 그룹 멤버 프로필 정책을 그대로 사용한다.
        if (usesGroupProfilePolicy()) {
            return String(state.contextAuthor?.profile || '').trim();
        }
        return state.contextAuthor?.profile || profileImageOf(post) || '';
    }

    async function loadContextAuthorProfile(post) {
        const context = photoScopePolicyContext();
        const ownerId = postOwnerId(post);
        if (context.policy !== 'GROUP' || !ownerId) return null;

        // 그룹 프로젝트도 프로젝트 전용 프로필이 아니라 '상위 그룹 멤버 프로필'을 사용한다.
        // 따라서 wsId가 있으면 그룹/프로젝트 구분 없이 workspace member profile API를 우선한다.
        let url = '';
        if (context.wsId) {
            url = `${getContextPath()}/workspace/api/${encodeURIComponent(context.wsId)}/members/${encodeURIComponent(ownerId)}/profile`;
        } else if ((context.scope === 'PROJECT' || context.scope === 'PROJ') && context.projId) {
            // 예외적으로 wsId가 화면 컨텍스트에 없는 경우에만 프로젝트 API를 fallback으로 사용한다.
            url = `${getContextPath()}/project/api/member-profile?projId=${encodeURIComponent(context.projId)}&userId=${encodeURIComponent(ownerId)}`;
        }
        if (!url) return null;

        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) return null;
        const data = await response.json().catch(() => null);
        if (!data) return null;

        const isGroupProject = context.scope === 'PROJECT' || context.scope === 'PROJ';
        // 그룹 프로젝트에서는 계정(개인) 프로필로 해석된 PROFILE_IMAGE_PATH를 쓰지 않는다.
        // 상위 그룹에 저장된 전용 프로필 원본(CUSTOM_*)을 직접 사용하고,
        // 전용 이미지가 없으면 개인 사진 대신 기본 아바타로 표시한다.
        const resolvedName = isGroupProject
            ? pick(data, 'customDisplayName', 'CUSTOM_DISPLAY_NAME', 'displayName', 'DISPLAY_NAME', 'userName', 'USER_NAME')
            : pick(data, 'displayName', 'DISPLAY_NAME', 'userName', 'USER_NAME', 'accountName', 'ACCOUNT_NAME');
        const resolvedProfile = isGroupProject
            ? pick(data, 'customProfileImagePath', 'CUSTOM_PROFILE_IMAGE_PATH')
            : pick(data, 'profileImagePath', 'PROFILE_IMAGE_PATH');

        return {
            id: ownerId,
            name: String(resolvedName || authorName(post) || '작성자').trim(),
            profile: String(resolvedProfile || '').trim()
        };
    }

    function contextualProfileHref(userId) {
        const id = Number(userId || 0);
        if (!id) return '';
        return usesGroupProfilePolicy() ? '#' : profileUrl(id);
    }

    function contextualProfileDataAttr(userId) {
        const id = Number(userId || 0);
        return usesGroupProfilePolicy() && id ? ` data-photo-workspace-profile-user-id="${esc(id)}"` : '';
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

    function postPermission(post, ...keys) {
        for (const key of keys) {
            if (post && Object.prototype.hasOwnProperty.call(post, key)) {
                const value = post[key];
                return value === true || value === 1 || value === '1' || String(value || '').toUpperCase() === 'Y' || String(value || '').toLowerCase() === 'true';
            }
        }
        return null;
    }

    function canEditPost(post) {
        const flagged = postPermission(post, 'canEdit', 'CAN_EDIT');
        if (flagged != null) return flagged;
        return !!post && postOwnerId(post) === getCurrentUserId();
    }

    function canMovePost(post) {
        const flagged = postPermission(post, 'canMoveAlbum', 'CAN_MOVE_ALBUM');
        if (flagged != null) return flagged;
        const currentUserId = getCurrentUserId();
        return !!post && !!currentUserId && (postOwnerId(post) === currentUserId || isAdminUser());
    }

    function canDeletePost(post) {
        const flagged = postPermission(post, 'canDelete', 'CAN_DELETE');
        if (flagged != null) return flagged;
        const currentUserId = getCurrentUserId();
        return !!post && !!currentUserId && (postOwnerId(post) === currentUserId || isAdminUser());
    }

    function canRestorePost(post) {
        const flagged = postPermission(post, 'canRestore', 'CAN_RESTORE');
        return flagged != null ? flagged : canDeletePost(post);
    }

    function canPermanentDeletePost(post) {
        const flagged = postPermission(post, 'canPermanentDelete', 'CAN_PERMANENT_DELETE');
        return flagged != null ? flagged : canDeletePost(post);
    }
    function canToggleVisibility(post) {
        const flagged = postPermission(post, 'canToggleVisibility', 'CAN_TOGGLE_VISIBILITY');
        if (flagged != null) return flagged;
        return photoScopePolicyContext().policy === 'PERSONAL' && postOwnerId(post) === getCurrentUserId();
    }

    function canSharePost(post) {
        const flagged = postPermission(post, 'canShare', 'CAN_SHARE');
        if (flagged != null) return flagged;
        return photoScopePolicyContext().policy === 'PERSONAL' && postOwnerId(post) === getCurrentUserId();
    }

    function hasPhotoAlbumHost() {
        return !!document.getElementById('photoAlbumPage');
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
    async function openStandaloneMoveAlbumModal(post) {
        if (!canMovePost(post)) return toast('사진 위치 변경 권한이 없습니다.', true);
        if (!window.CommonFolderModal || typeof window.CommonFolderModal.openSelect !== 'function') {
            return toast('공통 이동 모달을 불러오지 못했습니다. 페이지를 새로고침해주세요.', true);
        }

        let albums;
        try {
            albums = await loadStandaloneMoveAlbums(post);
        } catch (error) {
            return toast(error.message || '앨범 목록을 불러오지 못했습니다.', true);
        }

        let select = document.getElementById('photoViewerMoveAlbumSelect');
        if (!select) {
            select = document.createElement('select');
            select.id = 'photoViewerMoveAlbumSelect';
            select.setAttribute('aria-hidden', 'true');
            select.tabIndex = -1;
            select.style.position = 'fixed';
            select.style.width = '1px';
            select.style.height = '1px';
            select.style.opacity = '0';
            select.style.pointerEvents = 'none';
            document.body.appendChild(select);
        }

        const currentAlbumId = Number(pick(post, 'albumId', 'ALBUM_ID') || 0) || null;
        select.innerHTML = '';

        const rootOption = document.createElement('option');
        rootOption.value = '';
        rootOption.textContent = albumApiScopeType(post) === 'PERSONAL' ? '내 사진' : '사진';
        rootOption.dataset.depth = '0';
        rootOption.dataset.root = 'true';
        if (currentAlbumId == null) rootOption.dataset.disabled = 'true';
        select.appendChild(rootOption);

        (Array.isArray(albums) ? albums : []).forEach(album => {
            const albumId = albumIdOf(album);
            if (albumId == null) return;
            const option = document.createElement('option');
            option.value = String(albumId);
            option.textContent = albumNameOf(album);
            option.dataset.depth = '0';
            if (Number(albumId) === Number(currentAlbumId)) option.dataset.disabled = 'true';
            select.appendChild(option);
        });
        select.value = currentAlbumId == null ? '' : String(currentAlbumId);

        window.CommonFolderModal.openSelect({
            selectElement: select,
            adapter: {},
            context: {
                scopeType: albumApiScopeType(post),
                scopeId: albumApiScopeId(post)
            },
            title: '사진 위치 변경',
            description: '사진을 저장할 위치를 선택하세요.',
            confirmLabel: '이동',
            canManage: false,
            showManageActions: false,
            instantSelect: false,
            showCurrent: true,
            showCloseButton: true,
            unclassifiedLabel: albumApiScopeType(post) === 'PERSONAL' ? '내 사진' : '사진',
            unclassifiedDescription: '현재 사진 루트에 보관',
            folderDescription: '이 위치로 변경',
            itemDescription: ({ folderId, isCurrent }) => {
                if (isCurrent) return '현재 위치';
                if (!folderId) return '현재 사진 루트에 보관';
                return '이 위치로 변경';
            },
            onConfirm: async ({ folderId, folderName }) => {
                const nextAlbumId = folderId ? Number(folderId) : null;
                const postId = postIdOf(post);
                const response = await fetch(`${getContextPath()}/api/photo-posts/${postId}/album`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ albumId: nextAlbumId })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || data.success === false) throw new Error(data.message || '사진 위치 변경을 처리하지 못했습니다.');

                if (state.post && postIdOf(state.post) === postId) {
                    state.post.albumId = nextAlbumId;
                    state.post.ALBUM_ID = nextAlbumId;
                    state.post.albumName = nextAlbumId ? folderName : '';
                    state.post.ALBUM_NAME = nextAlbumId ? folderName : '';
                    state.viewerEditingField = '';
                    render();
                    renderViewerWorkspace();
                }
                document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', {
                    detail: { postId, albumId: nextAlbumId, albumName: nextAlbumId ? folderName : '' }
                }));
                toast(nextAlbumId ? '사진 위치를 변경했습니다.' : '사진 루트로 이동했습니다.');
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
        if (!isPostOwner(post)) return 'FEED';
        return photoScopePolicyContext().policy === 'GROUP' ? 'MEMBER_PERMISSION' : 'PERMISSION';
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

    async function openStandaloneShareModal(post, forcedMode, forcedActionKind) {
        const postId = postIdOf(post);
        if (!postId) return toast('공유할 사진 정보를 찾지 못했습니다.', true);
        if (!window.CommonPeopleModal || typeof window.CommonPeopleModal.init !== 'function') {
            return toast('공유 모달을 불러오지 못했습니다. 페이지를 새로고침해주세요.', true);
        }
        try {
            const shareMode = String(forcedMode || shareModeForPost(post) || 'PERMISSION').toUpperCase();
            const actionKind = String(forcedActionKind || 'SHARE').toUpperCase();
            const data = actionKind === 'SEND'
                ? { shares: [] }
                : await request(`/share/api/targets?contentType=PHOTO&contentId=${encodeURIComponent(postId)}&shareMode=${encodeURIComponent(shareMode)}`);
            let mount = document.getElementById('photoRuntimeShareMount');
            if (!mount) {
                mount = document.createElement('div');
                mount.id = 'photoRuntimeShareMount';
                document.body.appendChild(mount);
            }
            const uid = `photoRuntimeShare${postId}_${Date.now()}`;
            mount.innerHTML = shareModalMarkup(uid, Array.isArray(data.shares) ? data.shares : [], shareMode, post);
            const openButton = document.getElementById(`${uid}Open`);
            const scopeContext = photoScopePolicyContext();
            const shareApi = window.CommonPeopleModal.init({
                contentType: 'PHOTO',
                contentId: postId,
                scopeType: scopeContext.scope,
                wsId: scopeContext.wsId,
                projId: scopeContext.projId,
                contentIds: [postId],
                shareMode: String(shareMode || 'PERMISSION').toUpperCase(),
                friendOnly: shareMode !== 'MEMBER_PERMISSION',
                actionKind,
                persist: true,
                reloadOnPersist: false,
                bodyOpenClass: 'note-share-modal-open',
                currentUserId: String(getCurrentUserId() || ''),
                ownerUserId: String(postOwnerId(post) || ''),
                blockedUserIds: [
                    String(postOwnerId(post) || ''),
                    String(pick(post, 'collectedSourceUserId', 'COLLECTED_SOURCE_USER_ID') || '')
                ].filter(Boolean),
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
                onSubmit: actionKind === 'SEND' ? async ({ targets }) => {
                    const targetUserIds = (targets || []).map((item) => Number(item.id)).filter((id) => Number.isFinite(id) && id > 0);
                    if (!targetUserIds.length) throw new Error('보낼 친구를 선택해 주세요.');
                    const result = await request(`/api/photo-posts/${encodeURIComponent(postId)}/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetUserIds })
                    });
                    toast(`${Number(result.sentCount || targetUserIds.length)}명에게 보냈습니다.`);
                } : null,
                onPersistSuccess: (result) => {
                    if (result && result.mode === 'SHARE_RELEASE') toast(shareMode === 'MEMBER_PERMISSION' ? '권한 요청을 취소했습니다.' : '공유를 해지했습니다.');
                    else toast(shareMode === 'MEMBER_PERMISSION' ? '편집 권한 요청을 보냈습니다.' : '공유 요청을 보냈습니다.');
                }
            });
            elevateShareModal(uid);
            setTimeout(() => {
                if (shareApi && typeof shareApi.openShare === 'function') {
                    shareApi.openShare();
                } else if (openButton) {
                    openButton.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
                }
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
            return toast('내가 올린 사진은 이미 내 사진에 있습니다.', true);
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
            toast(!collected ? '내 사진에 담았습니다.' : '담아가기를 취소했습니다.');
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
            if (!canDeletePost(post)) return toast('삭제 권한이 없습니다.', true);
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

        if (action === 'restore') {
            if (!canRestorePost(post)) return toast('복원 권한이 없습니다.', true);
            try {
                await request(`/api/photo-posts/${postId}/restore`, { method: 'POST' });
                document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId, restored: true } }));
                removeCurrentPostCard(postId);
                close();
                toast('사진을 복원했습니다.');
            } catch (error) {
                toast(error.message || '사진을 복원하지 못했습니다.', true);
            }
            return;
        }

        if (action === 'permanent') {
            if (!canPermanentDeletePost(post)) return toast('영구 삭제 권한이 없습니다.', true);
            if (!confirm('사진을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
            try {
                await request(`/api/photo-posts/${postId}/permanent`, { method: 'DELETE' });
                document.dispatchEvent(new CustomEvent('moyo:photo-post-deleted', { detail: { postId, permanent: true } }));
                removeCurrentPostCard(postId);
                close();
                toast('사진을 영구 삭제했습니다.');
            } catch (error) {
                toast(error.message || '사진을 영구 삭제하지 못했습니다.', true);
            }
            return;
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
        const commentInput = box.querySelector('#photoRuntimeCommentInput');
        if (commentInput) {
            commentInput.addEventListener('input', function () {
                autosizeInput(commentInput);
                renderMentionList();
            });
        }
        box.dataset.photoCommonBound = '1';
    }

    function clearViewerUiTimer() {
        if (state.viewerUiTimer) {
            clearTimeout(state.viewerUiTimer);
            state.viewerUiTimer = null;
        }
    }

    function setViewerUiHidden(hidden) {
        const n = runtimeNodes();
        state.viewerUiHidden = !!hidden;
        if (n.box) n.box.classList.toggle('is-viewer-ui-hidden', state.mode === 'VIEWER' && state.viewerUiHidden);
    }

    function scheduleViewerUiHide() {
        clearViewerUiTimer();
        if (state.mode !== 'VIEWER' || state.viewerInfoOpen) return setViewerUiHidden(false);
        state.viewerUiTimer = setTimeout(() => setViewerUiHidden(true), 1800);
    }

    function wakeViewerUi() {
        if (state.mode !== 'VIEWER') return;
        setViewerUiHidden(false);
        scheduleViewerUiHide();
    }

    function ensureViewerUi(box) {
        if (!box) return;
        const media = box.querySelector('.photo-runtime-media');
        if (media && !media.querySelector('[data-photo-viewer-actions]')) {
            media.insertAdjacentHTML('afterbegin', `
                <div class="photo-runtime-viewer-actions" data-photo-viewer-actions aria-label="사진 반응 및 정보">
                    <button type="button" data-photo-viewer-like aria-label="좋아요" aria-pressed="false" title="좋아요">${svgIcon('heart')}<strong data-photo-viewer-like-count>0</strong></button>
                    <button type="button" data-photo-viewer-comment aria-label="댓글 보기" title="댓글">${svgIcon('comment')}<strong data-photo-viewer-comment-count>0</strong></button>
                    <button type="button" data-photo-viewer-info aria-label="사진 정보 보기" aria-expanded="false" title="정보">${svgIcon('info')}</button>
                    <button type="button" data-photo-viewer-edit aria-label="사진 수정" title="사진 수정" hidden>${svgIcon('crop')}</button>
                    <button type="button" data-photo-viewer-share aria-label="사진 공유" title="공유">${svgIcon('share')}</button>
                    <button type="button" data-photo-viewer-collect aria-label="내 사진에 담기" title="담기">${svgIcon('bookmark')}</button>
                    <button type="button" data-photo-viewer-trash aria-label="휴지통으로 이동" title="휴지통으로 이동" hidden>${svgIcon('trash')}</button>
                    <button type="button" data-photo-viewer-restore aria-label="사진 복원" title="복원" hidden>${svgIcon('restore')}</button>
                    <button type="button" data-photo-common-close data-photo-viewer-close aria-label="사진 상세 닫기" title="닫기">${svgIcon('close')}</button>
                </div>`);
        }
        bindViewerGestures(media);
        if (media && !media.querySelector('[data-photo-viewer-zoom-status]')) {
            media.insertAdjacentHTML('beforeend', `
                <button type="button" class="photo-runtime-viewer-zoom-status" data-photo-viewer-zoom-status aria-label="확대 상태 전환" title="화면 맞춤과 100% 전환">
                    ${svgIcon('zoom')}<strong data-photo-viewer-zoom-label>100%</strong>
                </button>`);
        }
        media?.querySelectorAll('[data-photo-viewer-post-nav]').forEach(node => node.remove());
        if (media && !media.querySelector('[data-photo-viewer-summary]')) {
            media.insertAdjacentHTML('beforeend', `
                <section class="photo-runtime-viewer-summary" data-photo-viewer-summary aria-label="사진 기본 정보">
                    <div class="photo-runtime-viewer-summary-content">
                        <div class="photo-runtime-viewer-summary-title-row">
                            <p class="photo-runtime-viewer-summary-title" data-photo-viewer-summary-description>제목 없음</p>
                            <span class="photo-runtime-viewer-summary-moyo" data-photo-viewer-summary-moyo title="MOYO 공개" aria-label="MOYO 공개" hidden>
                                <img src="${esc(moyoMascotPath())}" alt="" aria-hidden="true">
                            </span>
                        </div>
                        <div class="photo-runtime-viewer-summary-meta">
                            <a class="photo-runtime-viewer-summary-author" data-photo-viewer-summary-author href="#" aria-label="작성자 프로필 보기">
                                <span class="photo-runtime-viewer-summary-avatar" data-photo-viewer-summary-avatar></span>
                                <strong data-photo-viewer-summary-name>작성자</strong>
                            </a>
                            <span class="photo-runtime-viewer-summary-divider" aria-hidden="true">·</span>
                            <time data-photo-viewer-summary-date></time>
                        </div>
                        <div class="photo-runtime-viewer-summary-visibility" data-photo-viewer-summary-visibility hidden></div>
                    </div>
                </section>`);
        }
        const side = box.querySelector('.photo-runtime-side');
        if (side && !side.querySelector('[data-photo-viewer-workspace]')) {
            side.insertAdjacentHTML('afterbegin', `
                <section class="photo-runtime-viewer-workspace" data-photo-viewer-workspace aria-label="사진 정보 및 수정">
                    <header class="photo-runtime-viewer-workspace-head">
                        <h2>정보</h2>
                        <div class="photo-runtime-viewer-workspace-head-actions">
                            <button type="button" class="photo-runtime-viewer-workspace-edit" data-photo-viewer-edit-all aria-label="사진 정보 수정" title="사진 정보 수정">${svgIcon('edit')}</button>
                            <button type="button" class="photo-runtime-viewer-workspace-close" data-photo-viewer-side-close aria-label="정보 닫기" title="정보 닫기">${svgIcon('next')}</button>
                        </div>
                    </header>
                    <div class="photo-runtime-viewer-workspace-body" data-photo-viewer-workspace-body></div>
                </section>`);
        }
        // 서버 마크업이나 이전 렌더에서 워크스페이스가 이미 존재해도 닫기 액션을 보장한다.
        const workspace = side && side.querySelector('[data-photo-viewer-workspace]');
        const workspaceHead = workspace && workspace.querySelector('.photo-runtime-viewer-workspace-head');
        if (workspaceHead && !workspaceHead.querySelector('.photo-runtime-viewer-workspace-head-actions')) {
            const close = workspaceHead.querySelector('[data-photo-viewer-side-close]');
            if (close) close.remove();
            workspaceHead.insertAdjacentHTML('beforeend', `
                <div class="photo-runtime-viewer-workspace-head-actions">
                    <button type="button" class="photo-runtime-viewer-workspace-edit" data-photo-viewer-edit-all aria-label="사진 정보 수정" title="사진 정보 수정">${svgIcon('edit')}</button>
                    <button type="button" class="photo-runtime-viewer-workspace-close" data-photo-viewer-side-close aria-label="정보 닫기" title="정보 닫기">${svgIcon('next')}</button>
                </div>`);
        }
    }


    function viewerScopeLabel(post) {
        const scope = normalizePostScope(post);
        if (scope === 'WORKSPACE' || scope === 'WS') return '그룹';
        if (scope === 'PROJECT' || scope === 'PROJ') return '프로젝트';
        return '개인';
    }

    function viewerScopeName(post) {
        return pick(post, 'scopeName', 'SCOPE_NAME', 'workspaceName', 'WORKSPACE_NAME', 'projectName', 'PROJECT_NAME', 'groupName', 'GROUP_NAME') || viewerScopeLabel(post);
    }

    function viewerVisibilityText(post) {
        const scope = normalizePostScope(post);
        const policy = photoScopePolicyContext();
        if (scope === 'WORKSPACE' || scope === 'WS') return '그룹';
        if ((scope === 'PROJECT' || scope === 'PROJ') && policy.policy === 'GROUP') return '프로젝트';
        const value = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        if (value === 'FRIENDS') return 'MOYO 공개';
        return '비공개';
    }

    function viewerAlbumRootParts(post) {
        const label = viewerScopeLabel(post);
        const name = String(viewerScopeName(post) || '').trim();
        if (label === '개인') return ['개인', '내 사진'];
        if (label === '그룹') {
            const parts = ['그룹'];
            if (name && name !== label) parts.push(name);
            parts.push('사진');
            return parts;
        }
        const parts = ['프로젝트'];
        if (name && name !== label) parts.push(name);
        parts.push('사진');
        return parts;
    }

    function viewerAlbumPathText(post) {
        const postId = postIdOf(post);
        if (postId && state.viewerAlbumPathPostId === postId && state.viewerAlbumPath) return state.viewerAlbumPath;
        const parts = viewerAlbumRootParts(post);
        const albumName = String(pick(post, 'albumName', 'ALBUM_NAME') || '').trim();
        if (albumName && !isUnclassifiedAlbumName(albumName)) parts.push(albumName);
        return parts.join(' > ');
    }

    async function refreshViewerAlbumPath(post) {
        const postId = postIdOf(post);
        if (!postId) return;
        const rootParts = viewerAlbumRootParts(post);
        const currentAlbumId = Number(pick(post, 'albumId', 'ALBUM_ID') || 0) || null;
        if (!currentAlbumId) {
            state.viewerAlbumPath = rootParts.join(' > ');
            state.viewerAlbumPathPostId = postId;
            if (state.mode === 'VIEWER' && state.viewerInfoOpen && state.viewerPanelMode !== 'comments') renderViewerWorkspace();
            return;
        }
        try {
            const albums = await loadStandaloneMoveAlbums(post);
            const byId = new Map();
            (albums || []).forEach(album => {
                const id = albumIdOf(album);
                if (id != null) byId.set(Number(id), album);
            });
            const chain = [];
            const visited = new Set();
            let cursor = currentAlbumId;
            while (cursor != null && byId.has(Number(cursor)) && !visited.has(Number(cursor))) {
                visited.add(Number(cursor));
                const album = byId.get(Number(cursor));
                chain.push(albumNameOf(album));
                const parent = Number(pick(album, 'parentAlbumId', 'PARENT_ALBUM_ID') || 0) || null;
                cursor = parent;
            }
            chain.reverse();
            if (!chain.length) {
                const fallback = String(pick(post, 'albumName', 'ALBUM_NAME') || '').trim();
                if (fallback && !isUnclassifiedAlbumName(fallback)) chain.push(fallback);
            }
            state.viewerAlbumPath = rootParts.concat(chain).join(' > ');
            state.viewerAlbumPathPostId = postId;
            if (state.mode === 'VIEWER' && state.viewerInfoOpen && state.viewerPanelMode !== 'comments') renderViewerWorkspace();
        } catch (e) {
            state.viewerAlbumPath = viewerAlbumPathText(post);
            state.viewerAlbumPathPostId = postId;
        }
    }

    function viewerAlbumPathMarkup(pathText) {
        const parts = String(pathText || '').split('>').map(value => value.trim()).filter(Boolean);
        if (!parts.length) return '';
        return `<div class="photo-runtime-viewer-breadcrumb">${parts.map((part, index) => `${index ? '<span class="photo-runtime-viewer-breadcrumb-sep" aria-hidden="true">›</span>' : ''}<span class="photo-runtime-viewer-breadcrumb-part${index === parts.length - 1 ? ' is-current' : ''}">${esc(part)}</span>`).join('')}</div>`;
    }

    function viewerFileSizeText(value) {
        const size = Number(value || 0);
        if (!Number.isFinite(size) || size <= 0) return '';
        if (size < 1024) return `${Math.round(size)} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10240 ? 1 : 0)} KB`;
        if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
        return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    function viewerPhotoMeta(photo) {
        const raw = pick(photo, 'editMeta', 'EDIT_META', 'photoEditMeta', 'PHOTO_EDIT_META');
        if (!raw) return {};
        if (typeof raw === 'object') return raw;
        try {
            const parsed = JSON.parse(String(raw));
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function viewerCaptureMeta(photo) {
        const meta = viewerPhotoMeta(photo);
        const capture = meta && meta.capture && typeof meta.capture === 'object' ? meta.capture : {};
        return {
            takenAt: String(capture.takenAt || '').trim(),
            locationName: String(capture.locationName || '').trim(),
            latitude: capture.latitude == null || capture.latitude === '' ? null : Number(capture.latitude),
            longitude: capture.longitude == null || capture.longitude === '' ? null : Number(capture.longitude),
            takenAtSource: String(capture.takenAtSource || '').trim(),
            locationSource: String(capture.locationSource || '').trim()
        };
    }

    function viewerPeopleMeta(photo) {
        const meta = viewerPhotoMeta(photo);
        const source = Array.isArray(meta && meta.people) ? meta.people : [];
        return source.map(item => ({
            id: String(item && (item.id ?? item.userId ?? '') || '').trim(),
            name: String(item && (item.name ?? item.userName ?? '') || '사용자').trim(),
            email: String(item && (item.email ?? '') || '').trim(),
            profile: String(item && (item.profile ?? item.profileImagePath ?? '') || '').trim()
        })).filter(item => item.id);
    }

    function viewerTakenAtText(capture) {
        const value = String(capture && capture.takenAt || '').trim();
        if (!value) return '촬영일 정보 없음';
        return value.replace('T', ' ').slice(0, 16);
    }

    function viewerTakenAtInputValue(capture) {
        const value = String(capture && capture.takenAt || '').trim();
        if (!value) return '';
        const normalized = value.replace(' ', 'T');
        return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
    }

    function viewerCaptureLocationText(capture) {
        const name = String(capture && capture.locationName || '').trim();
        if (name) return name;
        const lat = Number(capture && capture.latitude);
        const lng = Number(capture && capture.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        return '촬영 위치 정보 없음';
    }

    function viewerPeopleSummary(people) {
        const list = Array.isArray(people) ? people : [];
        const context = photoScopePolicyContext();
        if (!list.length) return `${context.togetherLabel} 없음`;
        if (list.length === 1) return list[0].name || `${context.peopleLabel} 1명`;
        return `${list[0].name || context.peopleLabel} 외 ${list.length - 1}명`;
    }

    function viewerPersonAvatarMarkup(person, className, linked) {
        const item = person || {};
        const name = String(item.name || '사용자').trim() || '사용자';
        const profile = item.profile ? resolveAssetPath(item.profile) : '';
        const initial = Array.from(name)[0] || '모';
        const extra = className ? ` ${esc(className)}` : '';
        const avatar = profile
            ? `<span class="photo-runtime-viewer-person-avatar${extra}"><img src="${esc(profile)}" alt="${esc(name)}"></span>`
            : `<span class="photo-runtime-viewer-person-avatar is-fallback${extra}" aria-hidden="true">${esc(initial)}</span>`;
        const href = contextualProfileHref(item.id);
        const dataAttr = contextualProfileDataAttr(item.id);
        return linked !== false && href
            ? `<a class="photo-runtime-viewer-person-profile-link" href="${esc(href)}"${dataAttr} title="${esc(name)} 프로필 보기" aria-label="${esc(name)} 프로필 보기">${avatar}</a>`
            : avatar;
    }

    function viewerPeopleStackMarkup(people, limit) {
        const list = Array.isArray(people) ? people : [];
        const max = Number(limit) > 0 ? Number(limit) : 3;
        const visible = list.slice(0, max);
        const remain = Math.max(0, list.length - visible.length);
        if (!visible.length) {
            return '<span class="photo-runtime-viewer-people-empty-avatar" aria-hidden="true">' + svgIcon('users') + '</span>';
        }
        return `<span class="photo-runtime-viewer-people-stack">${visible.map(person => viewerPersonAvatarMarkup(person, '', true)).join('')}${remain ? `<span class="photo-runtime-viewer-people-more-avatar">+${remain}</span>` : ''}</span>`;
    }

    function viewerPeopleListMarkup(people) {
        const list = Array.isArray(people) ? people : [];
        if (!list.length) return '';
        return `<div class="photo-runtime-viewer-people-list" data-photo-viewer-people-list${state.viewerPeopleExpanded ? '' : ' hidden'}>${list.map(person => {
            const name = String(person && person.name || '사용자').trim() || '사용자';
            const email = String(person && person.email || '').trim();
            const href = contextualProfileHref(person && person.id);
            const dataAttr = contextualProfileDataAttr(person && person.id);
            const content = `${viewerPersonAvatarMarkup(person, 'is-list', false)}<span class="photo-runtime-viewer-people-list-copy"><strong>${esc(name)}</strong>${email ? `<small>${esc(email)}</small>` : ''}</span>`;
            return href
                ? `<a class="photo-runtime-viewer-people-list-item" href="${esc(href)}"${dataAttr} title="${esc(name)} 프로필 보기">${content}</a>`
                : `<div class="photo-runtime-viewer-people-list-item">${content}</div>`;
        }).join('')}</div>`;
    }

    function viewerPeopleOverviewMarkup(people, editable) {
        const list = Array.isArray(people) ? people : [];
        const hasPeople = list.length > 0;
        const summary = viewerPeopleSummary(list);
        const actionText = editable ? (hasPeople ? '변경' : '선택') : '';
        const firstHref = hasPeople ? contextualProfileHref(list[0].id) : '';
        const firstDataAttr = hasPeople ? contextualProfileDataAttr(list[0].id) : '';
        const summaryMarkup = hasPeople && firstHref
            ? `<a class="photo-runtime-viewer-people-summary-link" href="${esc(firstHref)}"${firstDataAttr} title="${esc(list[0].name || '사용자')} 프로필 보기">${esc(summary)}</a>`
            : `<strong${hasPeople ? '' : ' class="is-empty"'}>${esc(summary)}</strong>`;
        return `<div class="photo-runtime-viewer-people-block${editable ? ' is-editable' : ''}">
            <div class="photo-runtime-viewer-people-overview">
                <div class="photo-runtime-viewer-people-primary">
                    ${viewerPeopleStackMarkup(list, 3)}
                    <span class="photo-runtime-viewer-people-copy">
                        ${summaryMarkup}
                        ${list.length > 1 ? `<button type="button" class="photo-runtime-viewer-people-more" data-photo-viewer-people-more aria-expanded="${state.viewerPeopleExpanded ? 'true' : 'false'}">${state.viewerPeopleExpanded ? '접기' : '전체 보기'}<span aria-hidden="true">${state.viewerPeopleExpanded ? '⌃' : '⌄'}</span></button>` : ''}
                    </span>
                </div>
                ${editable ? `<button type="button" class="photo-runtime-viewer-people-change" data-photo-viewer-edit-people>${actionText}</button>` : ''}
            </div>
            ${viewerPeopleListMarkup(list)}
        </div>`;
    }



    function setViewerLegacySideHidden(side, hidden) {
        if (!side) return;
        const workspace = side.querySelector('[data-photo-viewer-workspace]');
        Array.from(side.children).forEach(child => {
            if (child === workspace) return;
            if (hidden) {
                if (!child.hasAttribute('data-photo-viewer-legacy-hidden')) {
                    child.setAttribute('data-photo-viewer-legacy-hidden', child.hidden ? 'hidden' : 'visible');
                }
                child.hidden = true;
                child.setAttribute('aria-hidden', 'true');
                child.style.setProperty('display', 'none', 'important');
                return;
            }
            if (!child.hasAttribute('data-photo-viewer-legacy-hidden')) return;
            const previous = child.getAttribute('data-photo-viewer-legacy-hidden');
            child.hidden = previous === 'hidden';
            child.removeAttribute('data-photo-viewer-legacy-hidden');
            child.removeAttribute('aria-hidden');
            child.style.removeProperty('display');
        });
    }

    function viewerManagementMarkup(post) {
        const trashMode = isTrashPost(post);
        const actions = [];
        if (trashMode) {
            if (canPermanentDeletePost(post)) actions.push(`<button type="button" class="photo-runtime-viewer-manage-button is-danger" data-photo-viewer-manage-action="permanent">${svgIcon('trash')}<span>영구 삭제</span></button>`);
        } else {
            if (canMovePost(post) && !canEditPost(post)) actions.push(`<button type="button" class="photo-runtime-viewer-manage-button" data-photo-viewer-manage-action="move">${svgIcon('folder')}<span>위치 변경</span></button>`);
        }
        if (!actions.length) return '';
        return `<section class="photo-runtime-viewer-field is-management"><div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('more')}</span><span>관리</span></div><div class="photo-runtime-viewer-manage-actions">${actions.join('')}</div></section>`;
    }


    function usesGroupAccessPolicy(post) {
        return photoScopePolicyContext().policy === 'GROUP';
    }

    async function loadViewerAccessMode(force) {
        const post = state.post || {};
        const postId = postIdOf(post);
        if (!postId || !usesGroupAccessPolicy(post)) {
            state.viewerRestrictedAccess = false;
            state.viewerAccessModeLoaded = true;
            return false;
        }
        if (state.viewerAccessModeLoading) return state.viewerRestrictedAccess;
        if (state.viewerAccessModeLoaded && !force) return state.viewerRestrictedAccess;
        state.viewerAccessModeLoading = true;
        try {
            const data = await request(`/share/api/access-mode?contentType=PHOTO&contentId=${encodeURIComponent(postId)}`);
            state.viewerRestrictedAccess = data?.restricted === true || String(data?.restricted || '').toUpperCase() === 'TRUE';
            state.viewerAccessModeLoaded = true;
            return state.viewerRestrictedAccess;
        } finally {
            state.viewerAccessModeLoading = false;
        }
    }

    async function updateViewerAccessMode(mode) {
        const post = state.post || {};
        const postId = postIdOf(post);
        if (!postId || !usesGroupAccessPolicy(post)) return;
        const restricted = String(mode || '').toUpperCase() === 'RESTRICTED';
        if (state.viewerAccessModeLoading || (state.viewerAccessModeLoaded && restricted === state.viewerRestrictedAccess)) return;
        state.viewerAccessModeLoading = true;
        renderViewerWorkspace();
        try {
            const body = new URLSearchParams({
                contentType: 'PHOTO',
                contentId: String(postId),
                mode: restricted ? 'RESTRICTED' : 'SCOPE'
            });
            const response = await fetch(`${getContextPath()}/share/api/access-mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: body.toString(),
                credentials: 'same-origin'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) throw new Error(data.message || '공개 범위를 변경하지 못했습니다.');
            state.viewerRestrictedAccess = data.restricted === true || String(data.restricted || '').toUpperCase() === 'TRUE';
            state.viewerAccessModeLoaded = true;
            document.dispatchEvent(new CustomEvent('moyo:content-access-changed', {
                detail: { contentType: 'PHOTO', contentId: postId, restricted: state.viewerRestrictedAccess }
            }));
            toast(state.viewerRestrictedAccess ? '비밀글로 변경했습니다.' : '전체 공개로 변경했습니다.');
        } catch (error) {
            toast(error.message || '공개 범위를 변경하지 못했습니다.', true);
        } finally {
            state.viewerAccessModeLoading = false;
            renderViewerWorkspace();
        }
    }

    function viewerGroupAccessMarkup() {
        if (!usesGroupAccessPolicy(state.post || {})) return '';
        const restricted = state.viewerRestrictedAccess === true;
        const disabled = state.viewerAccessModeLoading ? ' disabled' : '';
        return `<section class="photo-runtime-viewer-field is-scope-visibility">
            <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${restricted ? svgIcon('lock') : svgIcon('users')}</span><span>공개 범위</span></div>
            <div class="photo-runtime-viewer-access-range" role="radiogroup" aria-label="공개 범위">
                <button type="button" class="photo-runtime-viewer-access-option ${restricted ? '' : 'is-selected'}" data-photo-viewer-access-mode="SCOPE" aria-pressed="${restricted ? 'false' : 'true'}"${disabled}><span>전체 공개</span></button>
                <button type="button" class="photo-runtime-viewer-access-option ${restricted ? 'is-selected' : ''}" data-photo-viewer-access-mode="RESTRICTED" aria-pressed="${restricted ? 'true' : 'false'}"${disabled}><span>비밀글</span></button>
            </div>
            <small class="photo-runtime-viewer-access-help">${restricted
                ? '작성자·편집 가능한 멤버와 그룹장/팀장/관리자만 확인할 수 있습니다.'
                : '현재 그룹/프로젝트 멤버가 확인할 수 있습니다.'}</small>
            <button type="button" class="photo-runtime-viewer-secondary-action photo-runtime-viewer-permission-manage" data-photo-viewer-member-permission>권한 멤버 관리</button>
        </section>`;
    }

    function renderViewerWorkspace() {
        const n = runtimeNodes();
        const workspace = n.box && n.box.querySelector('[data-photo-viewer-workspace]');
        const headTitle = workspace && workspace.querySelector('.photo-runtime-viewer-workspace-head h2');
        const body = workspace && workspace.querySelector('[data-photo-viewer-workspace-body]');
        if (!body || state.mode !== 'VIEWER') return;
        const commentMode = state.viewerPanelMode === 'comments';
        workspace.classList.toggle('is-comments-mode', commentMode);
        workspace.classList.toggle('is-edit-mode', !commentMode && state.viewerEditingAll);
        body.classList.toggle('is-comments-mode', commentMode);
        const side = workspace.closest('.photo-runtime-side');
        if (side) {
            side.classList.toggle('is-viewer-comments-mode', commentMode);
            setViewerLegacySideHidden(side, true);
        }
        if (headTitle) headTitle.textContent = commentMode ? '댓글' : (state.viewerEditingAll ? '정보 수정' : '정보');
        const closeButton = workspace.querySelector('[data-photo-viewer-side-close]');
        if (closeButton) {
            closeButton.setAttribute('aria-label', commentMode ? '댓글 닫기' : '정보 닫기');
            closeButton.setAttribute('title', commentMode ? '댓글 닫기' : '정보 닫기');
        }
        const editAll = workspace.querySelector('[data-photo-viewer-edit-all]');
        if (editAll) {
            editAll.hidden = commentMode || state.viewerEditingAll || !canEditPost(state.post || {});
        }
        if (commentMode) {
            renderViewerCommentsWorkspace(body);
            return;
        }
        if (state.viewerEditingAll) {
            renderViewerInfoEditWorkspace(body);
            return;
        }

        const post = state.post || {};
        const photo = state.photos[state.index] || {};
        const description = pick(post, 'description', 'DESCRIPTION') || '';
        const albumPath = viewerAlbumPathText(post);
        const created = pick(post, 'createdAt', 'CREATED_AT', 'regDate', 'REG_DATE') || '';
        const updated = pick(post, 'updatedAt', 'UPDATED_AT', 'modifiedAt', 'MODIFIED_AT') || '';
        const originalName = pick(photo, 'originalName', 'ORIGINAL_NAME', 'fileName', 'FILE_NAME') || '원본 파일';
        const runtimeImage = n.image;
        const width = pick(photo, 'width', 'WIDTH', 'imageWidth', 'IMAGE_WIDTH') || (runtimeImage && runtimeImage.naturalWidth) || '';
        const height = pick(photo, 'height', 'HEIGHT', 'imageHeight', 'IMAGE_HEIGHT') || (runtimeImage && runtimeImage.naturalHeight) || '';
        const size = viewerFileSizeText(pick(photo, 'fileSize', 'FILE_SIZE'));
        const visibilityType = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        const postScope = normalizePostScope(post);
        const scopeVisibility = postScope === 'WORKSPACE' || postScope === 'WS' || ((postScope === 'PROJECT' || postScope === 'PROJ') && photoScopePolicyContext().policy === 'GROUP');
        const visibility = viewerVisibilityText(post);
        const visibilityClass = visibilityType === 'PRIVATE' && !scopeVisibility ? 'is-private' : 'is-public';
        const visibilityMarkup = visibilityType === 'FRIENDS'
            ? `<div class="photo-runtime-viewer-visibility is-public is-moyo-public"><img src="${esc(moyoMarkPath())}" alt="" aria-hidden="true"><strong>MOYO 공개</strong><span class="photo-runtime-viewer-moyo-badge">MOYO</span></div>`
            : `<div class="photo-runtime-viewer-visibility ${visibilityClass}"><span class="photo-runtime-viewer-visibility-dot" aria-hidden="true"></span><strong>${esc(visibility)}</strong></div>`;
        const capture = viewerCaptureMeta(photo);
        const people = viewerPeopleMeta(photo);
        const hasCaptureLocation = Boolean(capture.locationName) || (Number.isFinite(capture.latitude) && Number.isFinite(capture.longitude));
        const hasTakenAt = Boolean(capture.takenAt);
        body.innerHTML = `
            <section class="photo-runtime-viewer-field is-description">
                <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('note')}</span><span>사진 내용</span></div>
                <p>${description ? esc(description) : '<span class="is-empty">사진 내용 없음</span>'}</p>
            </section>
            <section class="photo-runtime-viewer-field is-visibility">
                <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${visibilityType === 'FRIENDS' || scopeVisibility ? svgIcon('eye') : svgIcon('lock')}</span><span>공개 상태</span></div>
                ${visibilityMarkup}
            </section>
            <section class="photo-runtime-viewer-field">
                <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('folder')}</span><span>사진 위치</span></div>
                <div class="photo-runtime-viewer-location is-path" title="${esc(albumPath)}">
                    ${viewerAlbumPathMarkup(albumPath)}
                </div>
            </section>
            <section class="photo-runtime-viewer-field">
                <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${viewerTogetherIcon()}</span><span>${esc(photoScopePolicyContext().togetherLabel)}</span></div>
                ${viewerPeopleOverviewMarkup(people, false)}
            </section>
            ${hasCaptureLocation ? `<section class="photo-runtime-viewer-field">
                <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('pin')}</span><span>촬영 위치</span></div>
                <p>${esc(viewerCaptureLocationText(capture))}${capture.locationSource === 'EXIF' ? '<small class="photo-runtime-viewer-meta-source">사진 위치 정보</small>' : ''}</p>
            </section>` : ''}
            ${hasTakenAt ? `<section class="photo-runtime-viewer-field">
                <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('calendar')}</span><span>촬영일</span></div>
                <p>${esc(viewerTakenAtText(capture))}${capture.takenAtSource === 'EXIF' ? '<small class="photo-runtime-viewer-meta-source">사진 촬영 정보</small>' : ''}</p>
            </section>` : ''}
            <section class="photo-runtime-viewer-field is-file">
                <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('image')}</span><span>파일 정보</span></div>
                <dl class="photo-runtime-viewer-file-meta">
                    <div><dt>파일명</dt><dd title="${esc(originalName)}">${esc(originalName)}</dd></div>
                    ${width && height ? `<div><dt>해상도</dt><dd>${esc(width)} × ${esc(height)}</dd></div>` : ''}
                    ${size ? `<div><dt>용량</dt><dd>${esc(size)}</dd></div>` : ''}
                </dl>
                <button type="button" class="photo-runtime-viewer-download" data-photo-viewer-download>${svgIcon('download')}<span>원본 다운로드</span></button>
            </section>
            ${updated && updated !== created ? `<section class="photo-runtime-viewer-field is-updated"><div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('clock')}</span><span>마지막 수정</span></div><p>${esc(updated)}</p></section>` : ''}
            ${viewerManagementMarkup(post)}
        `;
    }

    function renderViewerInfoEditWorkspace(body) {
        if (!body) return;
        const post = state.post || {};
        const photo = state.photos[state.index] || {};
        const capture = viewerCaptureMeta(photo);
        const people = state.viewerEditPeople.length ? state.viewerEditPeople : viewerPeopleMeta(photo);
        state.viewerEditPeople = people.slice();
        const canVisibility = canToggleVisibility(post);
        const groupAccess = usesGroupAccessPolicy(post);
        if (groupAccess && !state.viewerAccessModeLoaded && !state.viewerAccessModeLoading) {
            loadViewerAccessMode(false).then(() => { if (state.viewerEditingAll) renderViewerWorkspace(); }).catch(() => {});
        }
        const currentVisibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        const description = pick(post, 'description', 'DESCRIPTION') || '';
        const albumPath = viewerAlbumPathText(post);
        const hasCaptureLocation = Boolean(capture.locationName) || (Number.isFinite(capture.latitude) && Number.isFinite(capture.longitude));
        const hasTakenAt = Boolean(capture.takenAt);
        body.innerHTML = `
            <form class="photo-runtime-viewer-info-edit" data-photo-viewer-info-edit-form>
                <section class="photo-runtime-viewer-field">
                    <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('note')}</span><span>사진 내용</span></div>
                    <textarea name="description" maxlength="2000" rows="5" data-photo-viewer-info-description>${esc(description)}</textarea>
                </section>
                ${groupAccess ? viewerGroupAccessMarkup() : ''}
                ${canVisibility ? `<section class="photo-runtime-viewer-field is-moyo-visibility"><div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('eye')}</span><span>공개 상태</span></div><label class="photo-runtime-viewer-moyo-check"><input type="checkbox" name="moyoPublic" data-photo-viewer-info-visibility${currentVisibility === 'FRIENDS' ? ' checked' : ''}><img src="${esc(moyoMarkPath())}" alt="" aria-hidden="true"><span class="photo-runtime-viewer-moyo-check-copy"><strong>MOYO 공개 <span class="photo-runtime-viewer-moyo-badge">MOYO</span></strong><small>체크하면 친구들의 MOYO 피드에도 함께 표시됩니다.</small></span></label></section>` : ''}
                <section class="photo-runtime-viewer-field">
                    <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('folder')}</span><span>사진 위치</span></div>
                    <div class="photo-runtime-viewer-edit-inline-row">
                        <div class="photo-runtime-viewer-location is-path" title="${esc(albumPath)}">${viewerAlbumPathMarkup(albumPath)}</div>
                        <button type="button" class="photo-runtime-viewer-secondary-action" data-photo-viewer-edit-album>위치 변경</button>
                    </div>
                </section>
                <section class="photo-runtime-viewer-field">
                    <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${viewerTogetherIcon()}</span><span>${esc(photoScopePolicyContext().togetherLabel)}</span></div>
                    ${viewerPeopleOverviewMarkup(people, true)}
                </section>
                ${hasCaptureLocation ? `<section class="photo-runtime-viewer-field">
                    <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('pin')}</span><span>촬영 위치</span></div>
                    <input type="text" name="locationName" maxlength="200" data-photo-viewer-info-location placeholder="장소를 입력하세요" value="${esc(capture.locationName)}">
                    ${Number.isFinite(capture.latitude) && Number.isFinite(capture.longitude) ? `<small class="photo-runtime-viewer-capture-hint">사진 GPS ${esc(capture.latitude.toFixed(5))}, ${esc(capture.longitude.toFixed(5))}</small>` : ''}
                </section>` : ''}
                ${hasTakenAt ? `<section class="photo-runtime-viewer-field">
                    <div class="photo-runtime-viewer-field-head"><span class="photo-runtime-viewer-field-icon" aria-hidden="true">${svgIcon('calendar')}</span><span>촬영일</span></div>
                    <input type="datetime-local" name="takenAt" data-photo-viewer-info-taken-at value="${esc(viewerTakenAtInputValue(capture))}">
                    ${capture.takenAtSource === 'EXIF' ? '<small class="photo-runtime-viewer-capture-hint">사진 촬영 정보에서 가져왔습니다.</small>' : ''}
                </section>` : ''}
                <div class="photo-runtime-viewer-info-edit-actions">
                    <button type="button" data-photo-viewer-edit-all-cancel>취소</button>
                    <button type="submit" class="primary">저장</button>
                </div>
            </form>`;
    }

    function normalizeViewerPerson(source) {
        source = source || {};
        const raw = source.raw || source;
        const profile = String(source.profile || source.profileImagePath || raw.profileImage || raw.profileImagePath || raw.PROFILE_IMAGE_PATH || '').trim();
        const profileOriginal = String(source.profileOriginal || source.profileOriginalImagePath || raw.profileOriginal || raw.profileOriginalImagePath || raw.PROFILE_ORIGINAL_IMAGE_PATH || '').trim();
        return {
            id: String(source.id || raw.userId || raw.USER_ID || '').trim(),
            name: String(source.name || raw.name || raw.displayName || raw.DISPLAY_NAME || raw.userName || raw.USER_NAME || '사용자').trim(),
            email: String(source.email || raw.email || raw.EMAIL || '').trim(),
            profile,
            profileOriginal,
            profileCropScale: source.profileCropScale ?? raw.profileCropScale ?? raw.PROFILE_CROP_SCALE ?? '',
            profileCropX: source.profileCropX ?? raw.profileCropX ?? raw.PROFILE_CROP_X ?? '',
            profileCropY: source.profileCropY ?? raw.profileCropY ?? raw.PROFILE_CROP_Y ?? '',
            profileAvatarType: String(source.profileAvatarType || raw.profileAvatarType || raw.PROFILE_AVATAR_TYPE || (profile || profileOriginal ? 'IMAGE' : 'DEFAULT')).trim().toUpperCase(),
            useAccountProfile: String(source.useAccountProfile || raw.useAccountProfile || raw.USE_ACCOUNT_PROFILE || '').trim().toUpperCase(),
            raw
        };
    }

    function viewerTogetherIcon() {
        return photoScopePolicyContext().policy === 'GROUP' ? svgIcon('users') : svgIcon('user');
    }

    function viewerPeopleContext() {
        const explorer = document.querySelector('.file-explorer');
        const policy = photoScopePolicyContext();
        return {
            scope: policy.scope,
            policy: policy.policy,
            peopleLabel: policy.peopleLabel,
            togetherLabel: policy.togetherLabel,
            wsId: String(explorer?.dataset?.wsId || '').trim(),
            projId: String(explorer?.dataset?.projId || '').trim(),
            currentUserId: String(explorer?.dataset?.currentUserId || document.body?.dataset?.currentUserId || '').trim()
        };
    }

    async function loadViewerSelectablePeople() {
        const context = viewerPeopleContext();
        const base = getContextPath();
        let source = [];
        let label = '친구';

        if (context.policy === 'GROUP' && context.scope === 'PROJECT' && context.projId) {
            label = '멤버';
            const response = await fetch(`${base}/project/api/members?projId=${encodeURIComponent(context.projId)}`, {
                credentials: 'same-origin', headers: { Accept: 'application/json' }
            });
            if (!response.ok) throw new Error('프로젝트 멤버 목록을 불러오지 못했습니다.');
            source = await response.json().catch(() => []);
        } else if (context.policy === 'GROUP' && context.wsId) {
            label = '멤버';
            const response = await fetch(`${base}/workspace/api/members?wsId=${encodeURIComponent(context.wsId)}`, {
                credentials: 'same-origin', headers: { Accept: 'application/json' }
            });
            if (!response.ok) throw new Error('그룹 멤버 목록을 불러오지 못했습니다.');
            source = await response.json().catch(() => []);
        } else {
            if (!window.CommonFriendAdapter || typeof window.CommonFriendAdapter.fetchList !== 'function') {
                throw new Error('친구 목록 어댑터를 불러오지 못했습니다.');
            }
            source = await window.CommonFriendAdapter.fetchList(base);
        }

        const rows = Array.isArray(source) ? source : (Array.isArray(source?.members) ? source.members : []);
        const people = rows
            .map(normalizeViewerPerson)
            .filter(person => person.id && person.id !== context.currentUserId);
        return { people, label };
    }

    function openViewerScopedPersonProfile(person) {
        const userId = Number(person && person.id || 0);
        if (!userId) return;
        const context = viewerPeopleContext();
        if (context.policy === 'GROUP') {
            if (typeof window.openWorkspaceMemberProfile === 'function') {
                window.openWorkspaceMemberProfile(userId);
                return;
            }
            toast('그룹 멤버 프로필을 불러오지 못했습니다.', true);
            return;
        }
        window.location.href = `${getContextPath()}/users/profile?userId=${encodeURIComponent(userId)}`;
    }

    async function openViewerPeopleSelector() {
        if (!window.CommonPeopleModal || typeof window.CommonPeopleModal.open !== 'function') {
            toast('공통 친구/멤버 선택 모달을 불러오지 못했습니다.', true);
            return;
        }
        try {
            const result = await loadViewerSelectablePeople();
            window.CommonPeopleModal.open({
                title: photoScopePolicyContext().togetherLabel,
                description: `사진에 함께 나온 ${result.label}를 선택하세요.`,
                mode: 'SELECT_MULTIPLE',
                people: result.people,
                selectedIds: state.viewerEditPeople.map(person => person.id),
                selectedPeople: state.viewerEditPeople,
                confirmText: '선택 완료',
                searchPlaceholder: `${result.label} 이름 또는 이메일 검색`,
                emptyText: `선택할 ${result.label}가 없습니다.`,
                emptySubText: `${result.label} 목록을 확인해주세요.`,
                keepOpenOnProfile: true,
                onProfile: openViewerScopedPersonProfile,
                onSelect(selected) {
                    state.viewerEditPeople = (Array.isArray(selected) ? selected : []).map(normalizeViewerPerson).filter(person => person.id);
                    state.viewerPeopleExpanded = false;
                    renderViewerWorkspace();
                }
            });
        } catch (error) {
            toast(error.message || '친구/멤버 목록을 불러오지 못했습니다.', true);
        }
    }

    async function saveViewerInfoEdit(form) {
        const post = state.post || {};
        const photo = state.photos[state.index] || {};
        const postId = postIdOf(post);
        const photoId = Number(pick(photo, 'photoId', 'PHOTO_ID') || 0);
        if (!form || !postId || !photoId) return;
        const description = String(form.querySelector('[data-photo-viewer-info-description]')?.value || '').trim();
        const locationName = String(form.querySelector('[data-photo-viewer-info-location]')?.value || '').trim();
        const takenAtInput = String(form.querySelector('[data-photo-viewer-info-taken-at]')?.value || '').trim();
        const capture = viewerCaptureMeta(photo);
        const visibilityInput = form.querySelector('[data-photo-viewer-info-visibility]');
        const submit = form.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            const albumId = pick(post, 'albumId', 'ALBUM_ID') || null;
            await request(`/api/photo-posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ albumId, title: '', description })
            });
            post.description = description;
            post.DESCRIPTION = description;

            if (visibilityInput && canToggleVisibility(post)) {
                const nextVisibility = visibilityInput.checked ? 'FRIENDS' : 'PRIVATE';
                const visibilityResult = await request(`/api/photo-posts/${postId}/visibility`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visibilityType: nextVisibility })
                });
                if (visibilityResult && visibilityResult.post) state.post = visibilityResult.post;
                else { post.visibilityType = nextVisibility; post.VISIBILITY_TYPE = nextVisibility; }
            }

            const metadataResult = await request(`/api/photo-posts/${postId}/photos/${photoId}/metadata`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    capture: {
                        takenAt: takenAtInput ? `${takenAtInput}:00` : '',
                        locationName,
                        latitude: capture.latitude,
                        longitude: capture.longitude
                    },
                    people: state.viewerEditPeople
                })
            });
            if (metadataResult && metadataResult.photo) {
                state.photos[state.index] = Object.assign({}, photo, metadataResult.photo);
            }
            state.viewerEditingAll = false;
            state.viewerEditPeople = [];
            render();
            renderViewerWorkspace();
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId, refresh: true } }));
            toast('사진 정보를 수정했습니다.');
        } catch (error) {
            toast(error.message || '사진 정보를 수정하지 못했습니다.', true);
        } finally {
            if (submit) submit.disabled = false;
        }
    }

    function renderViewerCommentsWorkspace(body) {
        if (!body) return;
        const count = activeCommentCount();
        body.innerHTML = `
            <section class="photo-runtime-viewer-comments" aria-label="댓글 ${count}개">
                <div class="photo-runtime-comment-list" data-photo-viewer-comments></div>
                <form class="photo-runtime-comment-form photo-runtime-viewer-comment-form" data-photo-common-comment-form>
                    <div class="photo-runtime-reply-target" data-photo-viewer-reply-target hidden></div>
                    <input type="hidden" data-photo-viewer-parent-comment-id value="">
                    <div class="photo-runtime-viewer-comment-composer">
                        <textarea data-photo-viewer-comment-input maxlength="500" rows="1" placeholder="댓글을 입력하세요."></textarea>
                        <button type="submit">등록</button>
                    </div>
                    <div class="photo-runtime-mention-list" data-photo-viewer-mention-list hidden></div>
                </form>
            </section>`;
        const input = body.querySelector('[data-photo-viewer-comment-input]');
        if (input) {
            input.addEventListener('input', function () {
                autosizeInput(input);
                renderMentionList();
            });
        }
        renderComments();
        autosizeInput(input);
    }

    async function openViewerComments() {
        const n = ensure();
        state.viewerPanelMode = 'comments';
        state.viewerEditingAll = false;
        state.viewerEditPeople = [];
        state.viewerInfoOpen = true;
        applyDetailMode(n.box);
        renderViewerWorkspace();
        clearViewerUiTimer();
        setViewerUiHidden(false);
        if (!state.commentsLoaded) {
            const list = n.box && n.box.querySelector('[data-photo-viewer-comments]');
            if (list) list.innerHTML = '<div class="photo-runtime-comment-empty">댓글을 불러오는 중입니다.</div>';
            try {
                await loadComments(postIdOf(state.post));
                state.commentsLoaded = true;
            } catch (error) {
                state.comments = [];
                toast(error.message || '댓글을 불러오지 못했습니다.', true);
            }
            renderViewerWorkspace();
        }
        requestAnimationFrame(() => {
            const active = runtimeNodes();
            if (active.input) active.input.focus({ preventScroll: true });
        });
    }

    async function beginViewerFieldEdit(field) {
        const n = runtimeNodes();
        const body = n.box && n.box.querySelector('[data-photo-viewer-workspace-body]');
        const post = state.post || {};
        if (!body) return;
        if (field === 'description' && !canEditPost(post)) return;
        if (field === 'album' && !canMovePost(post)) return;
        if (field === 'visibility' && !canToggleVisibility(post)) return;
        if (field === 'album') {
            state.viewerEditingField = '';
            return openStandaloneMoveAlbumModal(post);
        }
        state.viewerEditingField = field;
        const section = body.querySelector(`[data-photo-viewer-field=\"${field === 'album' ? 'location' : field}\"]`);
        if (!section) return;
        if (field === 'description') {
            const value = pick(post, 'description', 'DESCRIPTION') || '';
            section.innerHTML = `<div class=\"photo-runtime-viewer-field-head\"><span>사진 내용 수정</span></div><textarea data-photo-viewer-edit-input maxlength=\"2000\">${esc(value)}</textarea><div class=\"photo-runtime-viewer-edit-actions\"><button type=\"button\" data-photo-viewer-edit-cancel>취소</button><button type=\"button\" class=\"primary\" data-photo-viewer-edit-save=\"description\">저장</button></div>`;
            section.querySelector('textarea')?.focus();
            return;
        }
        if (field === 'visibility') {
            const current = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
            const checked = current === 'FRIENDS';
            section.innerHTML = `<div class=\"photo-runtime-viewer-field-head\"><span>공개 상태 수정</span></div><label class=\"photo-runtime-viewer-moyo-check\"><input type=\"checkbox\" data-photo-viewer-edit-input${checked ? ' checked' : ''}><img src=\"${esc(moyoMarkPath())}\" alt=\"\" aria-hidden=\"true\"><span class=\"photo-runtime-viewer-moyo-check-copy\"><strong>MOYO 공개 <span class=\"photo-runtime-viewer-moyo-badge\">MOYO</span></strong><small>체크하면 친구들의 MOYO 피드에도 함께 표시됩니다.</small></span></label><div class=\"photo-runtime-viewer-edit-actions\"><button type=\"button\" data-photo-viewer-edit-cancel>취소</button><button type=\"button\" class=\"primary\" data-photo-viewer-edit-save=\"visibility\">저장</button></div>`;
            return;
        }
    }

    async function saveViewerField(field) {
        const n = runtimeNodes();
        const body = n.box && n.box.querySelector('[data-photo-viewer-workspace-body]');
        const input = body && body.querySelector('[data-photo-viewer-edit-input]');
        const postId = postIdOf(state.post);
        if (!input || !postId) return;
        try {
            if (field === 'visibility') {
                const nextVisibility = input.checked ? 'FRIENDS' : 'PRIVATE';
                const result = await request(`/api/photo-posts/${postId}/visibility`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibilityType: nextVisibility }) });
                if (result && result.post) state.post = result.post;
                else { state.post.visibilityType = nextVisibility; state.post.VISIBILITY_TYPE = nextVisibility; }
            } else {
                const description = input.value.trim();
                const albumId = pick(state.post, 'albumId', 'ALBUM_ID') || null;
                await request(`/api/photo-posts/${postId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ albumId, title: '', description }) });
                state.post.description = description; state.post.DESCRIPTION = description;
            }
            state.viewerEditingField = '';
            render();
            renderViewerWorkspace();
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId } }));
            toast('수정했습니다.');
        } catch (error) {
            toast(error.message || '수정하지 못했습니다.', true);
        }
    }

    function resetViewerPan() {
        state.viewerPanX = 0;
        state.viewerPanY = 0;
        state.viewerDragging = false;
    }

    function bindViewerGestures(media) {
        if (!media || media.dataset.photoViewerGestureBound === '1') return;
        media.dataset.photoViewerGestureBound = '1';

        media.addEventListener('pointerenter', () => {
            wakeViewerUi();
        });

        media.addEventListener('wheel', event => {
            if (state.mode !== 'VIEWER' || !state.post) return;
            event.preventDefault();
            wakeViewerUi();
            const direction = event.deltaY < 0 ? 'in' : 'out';
            changeViewerZoom(direction);
        }, { passive: false });

        media.addEventListener('dblclick', event => {
            if (state.mode !== 'VIEWER' || event.target.closest('button, a, input, textarea')) return;
            event.preventDefault();
            changeViewerZoom(state.viewerZoomMode === 'fit' ? 'actual' : 'fit');
        });

        media.addEventListener('pointerdown', event => {
            const image = event.target.closest('#photoRuntimeImage');
            if (state.mode !== 'VIEWER' || !image || Number(state.zoom || 1) <= 1.001) return;
            event.preventDefault();
            state.viewerDragging = true;
            state.viewerDragStartX = event.clientX;
            state.viewerDragStartY = event.clientY;
            state.viewerDragOriginX = Number(state.viewerPanX || 0);
            state.viewerDragOriginY = Number(state.viewerPanY || 0);
            image.classList.add('is-dragging');
            image.setPointerCapture?.(event.pointerId);
        });

        media.addEventListener('pointermove', event => {
            // VIEWER 컨트롤은 사진 위에서 포인터가 움직이면 항상 다시 표시한다.
            // 확대 드래그 여부와 UI 재표시는 서로 독립적으로 동작해야 한다.
            wakeViewerUi();

            if (!state.viewerDragging) return;
            state.viewerPanX = state.viewerDragOriginX + (event.clientX - state.viewerDragStartX);
            state.viewerPanY = state.viewerDragOriginY + (event.clientY - state.viewerDragStartY);
            syncViewerZoom();
        });

        const stopDrag = event => {
            if (!state.viewerDragging) return;
            state.viewerDragging = false;
            const image = media.querySelector('#photoRuntimeImage');
            image?.classList.remove('is-dragging');
            try { image?.releasePointerCapture?.(event.pointerId); } catch (_) {}
        };
        media.addEventListener('pointerup', stopDrag);
        media.addEventListener('pointercancel', stopDrag);
    }

    function applyDetailMode(box) {
        if (!box) return;
        const viewer = state.mode === 'VIEWER';
        box.classList.toggle('is-viewer-mode', viewer);
        box.classList.toggle('is-social-mode', !viewer);
        box.classList.toggle('is-viewer-info-open', viewer && state.viewerInfoOpen);
        box.classList.toggle('is-viewer-ui-hidden', viewer && state.viewerUiHidden);
        const infoButton = box.querySelector('[data-photo-viewer-info]');
        if (infoButton) infoButton.setAttribute('aria-expanded', String(viewer && state.viewerInfoOpen && state.viewerPanelMode === 'info'));
        const commentButton = box.querySelector('[data-photo-viewer-comment]');
        if (commentButton) commentButton.setAttribute('aria-expanded', String(viewer && state.viewerInfoOpen && state.viewerPanelMode === 'comments'));
        syncAlbumPostNavigation(box);
        if (viewer) {
            if (state.viewerZoomMode === 'fit') resetViewerPan();
            // 숨겨진 상태에서는 크기를 계산하지 않는다.
            // 열린 VIEWER는 한 프레임에서만 fit을 확정해 단계적으로 튀는 현상을 막는다.
            if (!box.hasAttribute('hidden')) requestAnimationFrame(syncViewerZoom);
        }
    }

    function syncAlbumPostNavigation(box) {
        if (!box) return;
        box.querySelectorAll('[data-photo-viewer-post-nav]').forEach(node => node.remove());
    }
    function viewerFitMetrics() {
        const n = runtimeNodes();
        const image = n.image;
        const media = image && image.closest('.photo-runtime-media');
        if (!image || !media || !image.naturalWidth || !image.naturalHeight) {
            return { ratio: 1, width: 1, height: 1 };
        }

        const viewport = window.visualViewport;
        const viewportWidth = Math.max(1, Math.floor(viewport ? viewport.width : window.innerWidth));
        const viewportHeight = Math.max(1, Math.floor(viewport ? viewport.height : window.innerHeight));
        const mediaRect = media.getBoundingClientRect();
        const mediaStyle = window.getComputedStyle(media);
        const paddingX = (parseFloat(mediaStyle.paddingLeft) || 0) + (parseFloat(mediaStyle.paddingRight) || 0);
        const paddingY = (parseFloat(mediaStyle.paddingTop) || 0) + (parseFloat(mediaStyle.paddingBottom) || 0);
        const stageWidth = Math.max(1, mediaRect.width || media.clientWidth || viewportWidth);
        const stageHeight = Math.max(1, mediaRect.height || media.clientHeight || viewportHeight);
        // 상단 툴바/하단 갤러리와 이미지 가장자리가 맞닿지 않도록 최소 안전 여백을 둔다.
        const availableWidth = Math.max(1, stageWidth - paddingX - 16);
        const availableHeight = Math.max(1, stageHeight - paddingY - 20);

        // VIEWER fit is viewport-based, not original-size-based.
        // Small images are enlarged and every photo uses the same full-height stage.
        const ratio = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);

        return {
            ratio,
            width: Math.max(1, Math.floor(image.naturalWidth * ratio)),
            height: Math.max(1, Math.floor(image.naturalHeight * ratio))
        };
    }

    function viewerFitRatio() {
        return viewerFitMetrics().ratio;
    }

    function syncViewerZoom() {
        const n = runtimeNodes();
        if (!n.image || !n.box || n.box.hasAttribute('hidden')) return;
        const media = n.image.closest('.photo-runtime-media');
        if (!media || media.getBoundingClientRect().width < 2 || media.getBoundingClientRect().height < 2) return;
        const mode = state.viewerZoomMode || 'fit';
        const fitMetrics = viewerFitMetrics();
        const fitRatio = fitMetrics.ratio;
        n.image.style.setProperty('--photo-viewer-fit-width', `${fitMetrics.width}px`);
        n.image.style.setProperty('--photo-viewer-fit-height', `${fitMetrics.height}px`);
        let zoom = Math.min(4, Math.max(0.25, Number(state.zoom || 1)));
        if (mode === 'fit') zoom = 1;
        if (mode === 'actual') zoom = fitRatio > 0 ? Math.min(8, 1 / fitRatio) : 1;
        state.zoom = zoom;
        n.image.style.transform = `translate3d(${Number(state.viewerPanX || 0)}px, ${Number(state.viewerPanY || 0)}px, 0) scale(${zoom})`;
        n.image.classList.toggle('is-zoomed', zoom > 1.001);
        n.image.classList.toggle('is-fit-mode', mode === 'fit');
        n.image.classList.toggle('is-actual-mode', mode === 'actual');
        const label = n.box && n.box.querySelector('[data-photo-viewer-zoom-label]');
        if (label) label.textContent = mode === 'fit' ? '맞춤' : `${Math.round(fitRatio * zoom * 100)}%`;
        if (mode === 'fit') { media.scrollLeft = 0; media.scrollTop = 0; }
    }

    function changeViewerZoom(action) {
        if (state.mode !== 'VIEWER') return;
        const fitRatio = viewerFitRatio();
        if (action === 'fit' || action === 'reset') {
            state.viewerZoomMode = 'fit';
            state.zoom = 1;
            resetViewerPan();
        } else if (action === 'actual') {
            state.viewerZoomMode = 'actual';
            state.zoom = fitRatio > 0 ? Math.min(8, 1 / fitRatio) : 1;
        } else {
            if (state.viewerZoomMode === 'fit') state.zoom = 1;
            if (state.viewerZoomMode === 'actual') state.zoom = fitRatio > 0 ? Math.min(8, 1 / fitRatio) : 1;
            state.viewerZoomMode = 'custom';
            const step = 0.25;
            state.zoom = action === 'in' ? Math.min(8, state.zoom + step) : Math.max(0.25, state.zoom - step);
        }
        if (state.zoom <= 1.001) resetViewerPan();
        syncViewerZoom();
    }

    async function downloadCurrentViewerPhoto() {
        const photo = state.photos[state.index] || {};
        const path = pick(photo, 'filePath', 'FILE_PATH') || pick(state.post, 'coverPath', 'COVER_PATH');
        if (!path) return toast('다운로드할 사진이 없습니다.', true);
        try {
            const response = await fetch(resolveAssetPath(path), { credentials: 'include' });
            if (!response.ok) throw new Error('사진 파일을 다운로드하지 못했습니다.');
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const originalName = pick(photo, 'originalName', 'ORIGINAL_NAME', 'fileName', 'FILE_NAME');
            link.href = objectUrl;
            link.download = String(originalName || String(path).split('/').pop().split('?')[0] || `photo-${postIdOf(state.post)}-${state.index + 1}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch (error) {
            toast(error.message || '사진을 다운로드하지 못했습니다.', true);
        }
    }

    function ensure() {
        let box = document.getElementById('photoRuntimeLightbox');
        if (!box) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="photoRuntimeLightbox" class="photo-runtime-lightbox photo-runtime-lightbox--common" aria-hidden="true">
                    <button type="button" class="photo-runtime-close photo-runtime-back" data-photo-common-close aria-label="뒤로가기">${svgIcon('prev')}</button>
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
                                        <button type="button" data-photo-common-action="move">${svgIcon('folder')}<span>위치 변경</span></button>
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
                                    <button type="button" class="photo-runtime-share" data-photo-common-share aria-label="사진 공유" title="공유">${svgIcon('share')}</button>
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
        ensureViewerUi(box);
        applyDetailMode(box);
        bindBoxEvents(box);
        return runtimeNodes();
    }

    function runtimeNodes() {
        const box = document.getElementById('photoRuntimeLightbox');
        return {
            box,
            side: box ? box.querySelector('.photo-runtime-side') : null,
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
            friendSend: box ? box.querySelector('[data-photo-common-friend-send]') : null,
            collect: box ? box.querySelector('[data-photo-common-collect]') : null,
            like: box ? box.querySelector('[data-photo-common-like]') : null,
            likeCount: document.getElementById('photoRuntimeLikeCount'),
            commentCount: document.getElementById('photoRuntimeCommentCount'),
            visibilityBadge: document.getElementById('photoRuntimeVisibilityBadge'),
            comments: state.mode === 'VIEWER' && state.viewerPanelMode === 'comments' ? (box ? box.querySelector('[data-photo-viewer-comments]') : null) : document.getElementById('photoRuntimeComments'),
            form: state.mode === 'VIEWER' && state.viewerPanelMode === 'comments' ? (box ? box.querySelector('.photo-runtime-viewer-comment-form') : null) : document.getElementById('photoRuntimeCommentForm'),
            input: state.mode === 'VIEWER' && state.viewerPanelMode === 'comments' ? (box ? box.querySelector('[data-photo-viewer-comment-input]') : null) : document.getElementById('photoRuntimeCommentInput'),
            mentionList: state.mode === 'VIEWER' && state.viewerPanelMode === 'comments' ? (box ? box.querySelector('[data-photo-viewer-mention-list]') : null) : document.getElementById('photoRuntimeMentionList'),
            replyTarget: state.mode === 'VIEWER' && state.viewerPanelMode === 'comments' ? (box ? box.querySelector('[data-photo-viewer-reply-target]') : null) : document.getElementById('photoRuntimeReplyTarget'),
            parentCommentId: state.mode === 'VIEWER' && state.viewerPanelMode === 'comments' ? (box ? box.querySelector('[data-photo-viewer-parent-comment-id]') : null) : document.getElementById('photoRuntimeParentCommentId'),
            viewerSummary: box ? box.querySelector('[data-photo-viewer-summary]') : null,
            viewerSummaryAuthor: box ? box.querySelector('[data-photo-viewer-summary-author]') : null,
            viewerSummaryAvatar: box ? box.querySelector('[data-photo-viewer-summary-avatar]') : null,
            viewerSummaryName: box ? box.querySelector('[data-photo-viewer-summary-name]') : null,
            viewerSummaryDescription: box ? box.querySelector('[data-photo-viewer-summary-description]') : null,
            viewerSummaryMoyo: box ? box.querySelector('[data-photo-viewer-summary-moyo]') : null,
            viewerSummaryVisibility: box ? box.querySelector('[data-photo-viewer-summary-visibility]') : null,
            viewerSummaryLike: box ? box.querySelector('[data-photo-viewer-summary-like]') : null,
            viewerSummaryComment: box ? box.querySelector('[data-photo-viewer-summary-comment]') : null,
            viewerSummaryDate: box ? box.querySelector('[data-photo-viewer-summary-date]') : null,
            viewerLike: box ? box.querySelector('[data-photo-viewer-like]') : null,
            viewerLikeCount: box ? box.querySelector('[data-photo-viewer-like-count]') : null,
            viewerComment: box ? box.querySelector('[data-photo-viewer-comment]') : null,
            viewerCommentCount: box ? box.querySelector('[data-photo-viewer-comment-count]') : null,
            viewerEdit: box ? box.querySelector('[data-photo-viewer-edit]') : null,
            viewerShare: box ? box.querySelector('[data-photo-viewer-share]') : null,
            viewerFriendSend: box ? box.querySelector('[data-photo-viewer-friend-send]') : null,
            viewerCollect: box ? box.querySelector('[data-photo-viewer-collect]') : null,
            viewerTrash: box ? box.querySelector('[data-photo-viewer-trash]') : null,
            viewerRestore: box ? box.querySelector('[data-photo-viewer-restore]') : null,
            prev: box ? box.querySelector('[data-photo-common-prev]') : null,
            next: box ? box.querySelector('[data-photo-common-next]') : null
        };
    }

    function openBox() {
        const n = ensure();
        n.box.classList.add('is-viewer-preparing');
        n.box.removeAttribute('hidden');
        n.box.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('photo-detail-open');
        document.body.classList.add('photo-lightbox-open', 'photo-detail-open');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        state.viewerUiHidden = false;
        applyDetailMode(n.box);

        // 실제 viewport 레이아웃이 잡힌 다음 fit을 한 번만 확정하고
        // 패널 전체를 같은 프레임에 보여준다.
        requestAnimationFrame(() => {
            syncViewerZoom();
            requestAnimationFrame(() => {
                n.box.classList.remove('is-viewer-preparing');
                scheduleViewerUiHide();
            });
        });
    }

    function close() {
        const n = ensure();
        clearViewerUiTimer();
        n.box.setAttribute('aria-hidden', 'true');
        n.box.setAttribute('hidden', '');
        n.box.classList.remove('is-viewer-preparing');
        document.documentElement.classList.remove('photo-detail-open');
        document.body.classList.remove('photo-lightbox-open', 'photo-detail-open');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        setViewerLegacySideHidden(n.box && n.box.querySelector('.photo-runtime-side'), false);
        state.post = null;
        state.photos = [];
        state.comments = [];
        state.commentsLoaded = false;
        state.index = 0;
        state.viewerInfoOpen = false;
        state.viewerPanelMode = 'info';
        state.commentsLoaded = false;
        state.viewerEditingField = '';
        state.viewerEditingAll = false;
        state.viewerEditPeople = [];
        state.viewerAlbumPath = '';
        state.viewerAlbumPathPostId = 0;
        state.viewerUiHidden = false;
        state.zoom = 1;
        state.viewerZoomMode = 'fit';
        resetViewerPan();
        if (n.image) {
            n.image.onload = null;
            n.image.onerror = null;
            n.image.removeAttribute('src');
            n.image.classList.remove('is-loaded', 'is-zoomed', 'is-fit-mode', 'is-actual-mode');
            n.image.style.removeProperty('--photo-viewer-fit-width');
            n.image.style.removeProperty('--photo-viewer-fit-height');
            n.image.style.removeProperty('transform');
        }
        cancelReply();
    }

    function move(delta) {
        if (!state.photos.length) return;
        state.index = (state.index + delta + state.photos.length) % state.photos.length;
        state.zoom = 1;
        state.viewerZoomMode = 'fit';
        resetViewerPan();
        render();
        syncViewerZoom();
    }

    function activeCommentCount(comments) {
        return (Array.isArray(comments || state.comments) ? (comments || state.comments) : []).filter(comment => String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() !== 'Y').length;
    }

    function syncCommentCount(count) {
        const value = Math.max(0, Number(count !== undefined ? count : activeCommentCount()) || 0);
        const n = runtimeNodes();
        if (n.commentCount) n.commentCount.textContent = String(value);
        if (n.viewerSummaryComment) n.viewerSummaryComment.textContent = String(value);
        if (n.viewerCommentCount) n.viewerCommentCount.textContent = String(value);
        if (state.post) {
            state.post.commentCount = value;
            state.post.COMMENT_COUNT = value;
            state.post.commentsCount = value;
            state.post.COMMENTS_COUNT = value;
        }
        return value;
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
        const avatarFallback = deleted ? '·' : (String(name).trim().charAt(0).toUpperCase() || 'M');
        const avatarCore = profile && !deleted
            ? `<span class="photo-runtime-comment-avatar has-image" data-avatar-fallback="${esc(avatarFallback)}"><img src="${esc(resolveAssetPath(profile))}" alt="${esc(name)}" onerror="const host=this.parentElement;if(host){host.classList.remove('has-image');host.textContent=host.dataset.avatarFallback||'M';}"></span>`
            : `<span class="photo-runtime-comment-avatar">${esc(avatarFallback)}</span>`;
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
        if (state.commentsLoaded) syncCommentCount(activeCommentCount(comments));
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
        const canEdit = canEditPost(post);
        const canMove = canMovePost(post);
        const canDelete = canDeletePost(post);
        const canRestore = canRestorePost(post);
        const canPermanent = canPermanentDeletePost(post);
        const canManage = canEdit || canMove || canDelete || canRestore || canPermanent;
        const canVisibility = canToggleVisibility(post);
        const groupAccess = usesGroupAccessPolicy(post);
        if (groupAccess && !state.viewerAccessModeLoaded && !state.viewerAccessModeLoading) {
            loadViewerAccessMode(false).then(() => { if (state.viewerEditingAll) renderViewerWorkspace(); }).catch(() => {});
        }
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
        if (n.share) n.share.hidden = trashMode || !canSharePost(post);
        if (n.friendSend) n.friendSend.hidden = trashMode || !isMoyoPublic(post);
        if (n.collect) {
            const ownerId = postOwnerId(post);
            const currentUserId = getCurrentUserId();
            const collectedCopy = isCollectedCopyPost(post);
            const collected = isCollectedPost(post) || collectedCopy;
            const showCollect = !trashMode && isMoyoPublic(post) && !!ownerId && !!currentUserId && Number(ownerId) !== Number(currentUserId);
            n.collect.hidden = !showCollect;
            n.collect.classList.toggle('is-collected', collected);
            n.collect.classList.toggle('is-collected-copy', collectedCopy);
            n.collect.setAttribute('aria-label', collected ? '담아가기 취소' : '담아가기');
            n.collect.setAttribute('title', collected ? '담아가기 취소' : '담아가기');
        }
        if (state.mode === 'VIEWER') {
            if (n.stats) n.stats.hidden = true;
            if (n.commentSection) n.commentSection.hidden = true;
            if (n.form) n.form.hidden = true;

            const ownerId = postOwnerId(post);
            const currentUserId = getCurrentUserId();
            const collectedCopy = isCollectedCopyPost(post);
            const collected = isCollectedPost(post) || collectedCopy;
            const moyoPublic = isMoyoPublic(post);
            const canCollect = !trashMode && moyoPublic && !!ownerId && !!currentUserId && Number(ownerId) !== Number(currentUserId);

            if (n.viewerEdit) n.viewerEdit.hidden = trashMode || !canEdit;
            if (n.viewerShare) n.viewerShare.hidden = trashMode || !canSharePost(post);
            if (n.viewerFriendSend) n.viewerFriendSend.hidden = trashMode || !moyoPublic;
            if (n.viewerTrash) n.viewerTrash.hidden = trashMode || !canDelete;
            if (n.viewerRestore) n.viewerRestore.hidden = !trashMode || !canRestore;
            if (n.viewerCollect) {
                n.viewerCollect.hidden = !canCollect;
                n.viewerCollect.classList.toggle('is-collected', collected);
                n.viewerCollect.setAttribute('aria-label', collected ? '담기 취소' : '내 사진에 담기');
                n.viewerCollect.setAttribute('title', collected ? '담기 취소' : '담기');
            }
        }
        if (n.menu) {
            const setHidden = (selector, hidden) => { const item = n.menu.querySelector(selector); if (item) item.hidden = hidden; };
            setHidden('[data-photo-common-action="edit"]', trashMode || !canEdit);
            setHidden('[data-photo-common-action="visibility"]', trashMode || !canVisibility);
            setHidden('[data-photo-common-action="move"]', trashMode || !canMove);
            setHidden('[data-photo-common-action="delete"]', trashMode || !canDelete);
            setHidden('[data-photo-common-action="restore"]', !trashMode || !canRestore || !hasActionHost);
            setHidden('[data-photo-common-action="permanent"]', !trashMode || !canPermanent || !hasActionHost);
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
        const creator = contextualAuthorName(post);
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
                n.image.onload = () => {
                    n.image.classList.add('is-loaded');
                    if (state.mode === 'VIEWER') {
                        requestAnimationFrame(syncViewerZoom);
                        // Natural dimensions are only guaranteed after load; refresh the info workspace
                        // so resolution is shown even when the API payload omits width/height.
                        if (state.viewerInfoOpen && state.viewerPanelMode !== 'comments') renderViewerWorkspace();
                    }
                };
                n.image.classList.remove('is-loaded');
                n.image.src = resolvedImage;
                if (n.image.complete && n.image.naturalWidth) n.image.onload();
            } else if (resolvedImage) {
                n.image.classList.add('is-loaded');
                if (state.mode === 'VIEWER') requestAnimationFrame(syncViewerZoom);
            } else if (!resolvedImage) {
                n.image.removeAttribute('src');
                n.image.classList.remove('is-loaded');
            }
        }
        if (n.authorLink) {
            const ownerId = postOwnerId(post);
            const ownerUrl = contextualProfileHref(ownerId);
            if (ownerUrl) {
                n.authorLink.href = ownerUrl;
                if (usesGroupProfilePolicy()) n.authorLink.dataset.photoWorkspaceProfileUserId = String(ownerId);
                else delete n.authorLink.dataset.photoWorkspaceProfileUserId;
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
        renderAvatar(n.avatar, creator, contextualAuthorProfile(post));
        renderDescription(n, desc);
        if (n.viewerSummary) n.viewerSummary.hidden = state.mode !== 'VIEWER';
        if (n.viewerSummaryName) n.viewerSummaryName.textContent = creator;
        if (n.viewerSummaryAvatar) renderAvatar(n.viewerSummaryAvatar, creator, contextualAuthorProfile(post));
        if (n.viewerSummaryAuthor) {
            const summaryOwnerId = postOwnerId(post);
            const summaryProfileUrl = contextualProfileHref(summaryOwnerId);
            if (summaryProfileUrl) {
                n.viewerSummaryAuthor.href = summaryProfileUrl;
                if (usesGroupProfilePolicy()) n.viewerSummaryAuthor.dataset.photoWorkspaceProfileUserId = String(summaryOwnerId);
                else delete n.viewerSummaryAuthor.dataset.photoWorkspaceProfileUserId;
                n.viewerSummaryAuthor.setAttribute('aria-label', `${creator} 프로필 보기`);
                n.viewerSummaryAuthor.classList.remove('is-disabled');
            } else {
                n.viewerSummaryAuthor.removeAttribute('href');
                n.viewerSummaryAuthor.removeAttribute('aria-label');
                n.viewerSummaryAuthor.classList.add('is-disabled');
            }
        }
        if (n.viewerSummaryDescription) {
            n.viewerSummaryDescription.textContent = desc || '제목 없음';
            n.viewerSummaryDescription.hidden = false;
        }
        if (n.viewerSummaryMoyo) {
            n.viewerSummaryMoyo.hidden = !(state.mode === 'VIEWER' && isMoyoPublic(post));
        }
        if (n.viewerSummaryVisibility) {
            n.viewerSummaryVisibility.innerHTML = '';
            n.viewerSummaryVisibility.hidden = true;
        }
        if (n.viewerSummaryDate) {
            n.viewerSummaryDate.textContent = created;
            n.viewerSummaryDate.hidden = !created;
        }
        if (n.viewerSummaryLike) n.viewerSummaryLike.textContent = String(likeCount);
        if (n.viewerLike) {
            n.viewerLike.classList.toggle('liked', liked);
            n.viewerLike.setAttribute('aria-pressed', String(liked));
        }
        if (n.viewerLikeCount) n.viewerLikeCount.textContent = String(likeCount);
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
        if (state.mode === 'VIEWER') {
            const viewerCommentCount = state.commentsLoaded
                ? activeCommentCount(state.comments)
                : Number(pick(post, 'commentCount', 'COMMENT_COUNT', 'commentsCount', 'COMMENTS_COUNT') || 0);
            syncCommentCount(viewerCommentCount);
        }
        applyDetailMode(n.box);
        if (state.mode === 'VIEWER') renderViewerWorkspace();
        syncViewerZoom();
    }
    async function loadComments(postId) {
        const comments = await request(`/api/photo-posts/${postId}/comments`);
        state.comments = Array.isArray(comments) ? comments : [];
        state.commentsLoaded = true;
        syncCommentCount(activeCommentCount(state.comments));
    }

    async function open(postId, options = {}) {
        const id = Number(postId);
        if (!id) return toast('사진 정보를 찾지 못했습니다.', true);
        // 사진 상세는 진입점과 관계없이 VIEWER 하나로 통일한다.
        // 프로필/메인/탐색기/기록에서 동일한 상세 UI와 권한 메뉴를 사용한다.
        state.mode = 'VIEWER';
        const requestedAlbumPostIds = Array.isArray(options && options.albumPostIds)
            ? options.albumPostIds.map(Number).filter(Boolean)
            : [];
        state.albumPostIds = Array.from(new Set(requestedAlbumPostIds));
        state.albumPostIndex = state.albumPostIds.indexOf(id);
        clearViewerUiTimer();
        state.viewerInfoOpen = false;
        state.viewerPanelMode = 'info';
        state.viewerEditingField = '';
        state.viewerEditingAll = false;
        state.viewerEditPeople = [];
        state.contextAuthor = null;
        state.viewerUiHidden = false;
        state.zoom = 1;
        state.viewerZoomMode = 'fit';
        resetViewerPan();
        const openingNodes = ensure();
        // 이전 상세의 이미지를 먼저 비우되, 새 상세 데이터와 첫 이미지가 준비되기 전에는
        // VIEWER를 열지 않는다. 빈 패널 -> 메타 -> 이미지 순으로 붙는 현상을 방지한다.
        if (openingNodes.image) {
            openingNodes.image.onload = null;
            openingNodes.image.removeAttribute('src');
            openingNodes.image.classList.remove('is-loaded', 'is-zoomed', 'is-fit-mode', 'is-actual-mode');
            openingNodes.image.style.removeProperty('--photo-viewer-fit-width');
            openingNodes.image.style.removeProperty('--photo-viewer-fit-height');
            openingNodes.image.style.removeProperty('transform');
        }
        state.loading = true;
        try {
            const data = await request(`/api/photo-posts/${id}`);
            const detail = normalizeDetail(data, id);
            state.post = detail.post;

            const [contextAuthor] = await Promise.all([
                loadContextAuthorProfile(detail.post).catch(() => null),
                preloadImage(firstPhotoPath(detail))
            ]);
            state.contextAuthor = contextAuthor;

            // VIEWER에서는 댓글 패널을 열 때 loadComments()가 호출된다.
            state.comments = [];
            state.commentsLoaded = false;
            state.post = detail.post;
            state.photos = detail.photos;
            state.index = 0;
            cancelReply();

            // hidden 상태에서 텍스트/메타/이미지 src를 모두 구성한 뒤 한 번에 연다.
            render();
            openBox();
            if (state.mode === 'VIEWER') refreshViewerAlbumPath(state.post);
        } catch (error) {
            console.error('[MOYO][photo] detail load failed', error);
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
            state.commentsLoaded = true;
            const commentCount = syncCommentCount(activeCommentCount(state.comments));
            cancelReply();
            render();
            syncCommentCount(commentCount);
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId, commentCount } }));
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
            state.commentsLoaded = true;
            const commentCount = syncCommentCount(activeCommentCount(state.comments));
            render();
            syncCommentCount(commentCount);
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', { detail: { postId, commentCount } }));
        } catch (error) {
            toast(error.message || '댓글을 삭제하지 못했습니다.', true);
        }
    }

    function handleBoxClick(event) {
        const n = ensure();
        if (event.target === n.box || event.target.closest('[data-photo-common-close]')) return close();
        if (event.target.closest('[data-photo-viewer-side-close]')) {
            state.viewerEditingAll = false;
            state.viewerEditPeople = [];
            state.viewerInfoOpen = false;
            applyDetailMode(n.box);
            return;
        }
        const viewerEditAll = event.target.closest('[data-photo-viewer-edit-all]');
        if (viewerEditAll) {
            state.viewerEditingAll = true;
            state.viewerPeopleExpanded = false;
            state.viewerEditPeople = viewerPeopleMeta(state.photos[state.index] || {});
            return renderViewerWorkspace();
        }
        if (event.target.closest('[data-photo-viewer-edit-all-cancel]')) {
            state.viewerEditingAll = false;
            state.viewerPeopleExpanded = false;
            state.viewerEditPeople = [];
            return renderViewerWorkspace();
        }
        if (event.target.closest('[data-photo-viewer-edit-album]')) return openStandaloneMoveAlbumModal(state.post || {});
        if (event.target.closest('[data-photo-viewer-people-more]')) {
            state.viewerPeopleExpanded = !state.viewerPeopleExpanded;
            return renderViewerWorkspace();
        }
        if (event.target.closest('[data-photo-viewer-edit-people]')) return openViewerPeopleSelector();
        const accessModeButton = event.target.closest('[data-photo-viewer-access-mode]');
        if (accessModeButton) return updateViewerAccessMode(accessModeButton.dataset.photoViewerAccessMode || 'SCOPE');
        if (event.target.closest('[data-photo-viewer-member-permission]')) {
            return openStandaloneShareModal(state.post || {}, 'MEMBER_PERMISSION', 'SHARE');
        }

        const viewerEditField = event.target.closest('[data-photo-viewer-edit-field]');
        if (viewerEditField) return beginViewerFieldEdit(viewerEditField.dataset.photoViewerEditField || '');
        if (event.target.closest('[data-photo-viewer-edit-cancel]')) { state.viewerEditingField = ''; renderViewerWorkspace(); return; }
        const viewerEditSave = event.target.closest('[data-photo-viewer-edit-save]');
        if (viewerEditSave) return saveViewerField(viewerEditSave.dataset.photoViewerEditSave || '');
        const viewerManageAction = event.target.closest('[data-photo-viewer-manage-action]');
        if (viewerManageAction) return actionEvent(viewerManageAction.dataset.photoViewerManageAction || '');
        if (event.target.closest('[data-photo-viewer-download]')) return downloadCurrentViewerPhoto();
        if (event.target.closest('[data-photo-viewer-edit]')) {
            if (!canEditPost(state.post || {})) return;
            return handleStandaloneAction('edit');
        }
        const viewerInfo = event.target.closest('[data-photo-viewer-info]');
        if (viewerInfo) {
            const closeCurrent = state.viewerInfoOpen && state.viewerPanelMode === 'info';
            state.viewerPanelMode = 'info';
            state.viewerEditingAll = false;
            state.viewerEditPeople = [];
            state.viewerInfoOpen = !closeCurrent;
            if (state.viewerInfoOpen) renderViewerWorkspace();
            applyDetailMode(n.box);
            if (state.viewerInfoOpen) { clearViewerUiTimer(); setViewerUiHidden(false); }
            else scheduleViewerUiHide();
            return;
        }
        const viewerZoomStatus = event.target.closest('[data-photo-viewer-zoom-status]');
        if (viewerZoomStatus) return changeViewerZoom(state.viewerZoomMode === 'fit' ? 'actual' : 'fit');
        const viewerZoom = event.target.closest('[data-photo-viewer-zoom]');
        if (viewerZoom) return changeViewerZoom(viewerZoom.dataset.photoViewerZoom || 'reset');
        const viewerLike = event.target.closest('[data-photo-viewer-like]');
        if (viewerLike) return toggleLike(postIdOf(state.post));
        if (event.target.closest('[data-photo-viewer-share]')) {
            if (!canSharePost(state.post)) return;
            return openStandaloneShareModal(state.post, shareModeForPost(state.post));
        }
        if (event.target.closest('[data-photo-viewer-trash]')) return actionEvent('delete');
        if (event.target.closest('[data-photo-viewer-restore]')) return actionEvent('restore');
        if (event.target.closest('[data-photo-viewer-friend-send]')) {
            if (!isMoyoPublic(state.post)) return;
            return openStandaloneShareModal(state.post, 'FEED', 'SEND');
        }
        if (event.target.closest('[data-photo-viewer-collect]')) {
            if (!isMoyoPublic(state.post)) return;
            return handleStandaloneCollect(state.post);
        }
        if (event.target.closest('[data-photo-viewer-comment]')) {
            if (state.viewerInfoOpen && state.viewerPanelMode === 'comments') {
                state.viewerInfoOpen = false;
                applyDetailMode(n.box);
                scheduleViewerUiHide();
                return;
            }
            openViewerComments();
            return;
        }
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
        const friendSend = event.target.closest('[data-photo-common-friend-send]');
        if (friendSend) { event.preventDefault(); return openStandaloneShareModal(state.post, 'FEED', 'SEND'); }
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
        const infoForm = event.target.closest('[data-photo-viewer-info-edit-form]');
        if (infoForm) {
            event.preventDefault();
            return saveViewerInfoEdit(infoForm);
        }
        const form = event.target.closest('[data-photo-common-comment-form]');
        if (!form) return;
        event.preventDefault();
        createComment(form);
    });





    document.addEventListener('click', event => {
        const link = event.target.closest && event.target.closest('[data-photo-workspace-profile-user-id]');
        if (!link) return;
        const userId = Number(link.dataset.photoWorkspaceProfileUserId || 0);
        if (!userId) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof window.openWorkspaceMemberProfile === 'function') {
            window.openWorkspaceMemberProfile(userId);
        } else {
            toast('그룹 멤버 프로필을 불러오지 못했습니다.', true);
        }
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
            const key = event.key || ({ 37: 'ArrowLeft', 39: 'ArrowRight' })[event.keyCode];
            if (key === 'Escape') close();
            if (key === 'ArrowLeft') {
                event.preventDefault();
                move(-1);
            }
            if (key === 'ArrowRight') {
                event.preventDefault();
                move(1);
            }
            if (state.mode === 'VIEWER' && (key === '+' || key === '=')) changeViewerZoom('in');
            if (state.mode === 'VIEWER' && event.key === '-') changeViewerZoom('out');
            if (state.mode === 'VIEWER' && event.key === '0') changeViewerZoom('fit');
            if (state.mode === 'VIEWER' && event.key === '1') changeViewerZoom('actual');
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

    async function openStandaloneFriendSendByPostId(postId) {
        const id = Number(postId);
        if (!id) return toast('보낼 사진 정보를 찾지 못했습니다.', true);
        try {
            const data = await request(`/api/photo-posts/${id}`);
            const detail = normalizeDetail(data, id);
            const post = detail.post || { postId: id, POST_ID: id };
            if (!isMoyoPublic(post)) return toast('MOYO 공개 사진만 친구에게 보낼 수 있습니다.', true);
            return openStandaloneShareModal(post, 'FEED', 'SEND');
        } catch (error) {
            toast(error.message || '친구에게 보내기 정보를 불러오지 못했습니다.', true);
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
            if (detail.collectedByMe !== undefined) {
                const collectButton = card.querySelector('[data-profile-photo-collect]');
                if (collectButton) {
                    const collected = Number(detail.collectedByMe || 0) === 1;
                    collectButton.classList.toggle('is-collected', collected);
                    collectButton.setAttribute('aria-pressed', collected ? 'true' : 'false');
                    collectButton.setAttribute('aria-label', collected ? '담기 취소' : '담기');
                    collectButton.setAttribute('title', collected ? '담기 취소' : '담기');
                    const icon = collectButton.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-solid', collected);
                        icon.classList.toggle('fa-regular', !collected);
                    }
                }
            }
        });
    }

    async function toggleProfileCollect(postId, button) {
        const id = Number(postId);
        if (!id) return toast('담아갈 사진 정보를 찾지 못했습니다.', true);
        if (button) button.disabled = true;
        try {
            const data = await request(`/api/photo-posts/${id}`);
            const detail = normalizeDetail(data, id);
            const post = detail.post || {};
            if (isPostOwner(post)) return toast('내가 올린 사진은 이미 내 사진에 있습니다.', true);
            const collected = isCollectedPost(post) || isCollectedCopyPost(post);
            await request(`/api/photo-posts/${id}/collect`, {
                method: collected ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: collected ? undefined : JSON.stringify({ albumId: null })
            });
            const nextCollected = !collected;
            updateProfilePhotoCard({ postId: id, collectedByMe: nextCollected ? 1 : 0 });
            document.dispatchEvent(new CustomEvent('moyo:photo-post-updated', {
                detail: { postId: id, collectedByMe: nextCollected ? 1 : 0 }
            }));
            toast(nextCollected ? '내 사진에 담았습니다.' : '담아가기를 취소했습니다.');
        } catch (error) {
            toast(error.message || '담아가기를 처리하지 못했습니다.', true);
        } finally {
            if (button) button.disabled = false;
        }
    }

    document.addEventListener('click', event => {
        const like = event.target.closest && event.target.closest('[data-profile-photo-like]');
        const share = event.target.closest && event.target.closest('[data-profile-photo-share]');
        const friendSend = event.target.closest && event.target.closest('[data-profile-photo-friend-send]');
        const comment = event.target.closest && event.target.closest('[data-profile-photo-comment]');
        const collect = event.target.closest && event.target.closest('[data-profile-photo-collect]');
        const action = like || share || friendSend || comment || collect;
        if (!action) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (like) return toggleLike(like.dataset.profilePhotoLike);
        if (share) return openStandaloneShareByPostId(share.dataset.profilePhotoShare);
        if (friendSend) return openStandaloneFriendSendByPostId(friendSend.dataset.profilePhotoFriendSend);
        if (comment) return open(comment.dataset.profilePhotoComment);
        if (collect) return toggleProfileCollect(collect.dataset.profilePhotoCollect, collect);
    }, true);

    document.addEventListener('moyo:photo-post-updated', event => updateProfilePhotoCard(event.detail || {}));




window.MoyoPhotoPostDetail = { open, close, refresh: render, toggleLike, share: openStandaloneShareByPostId };
})();
