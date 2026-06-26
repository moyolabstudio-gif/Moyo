(function () {
    'use strict';
    const page = document.querySelector('.photo-page');
    if (!page) return;

    const scopeType = String(page.dataset.scopeType || '').toUpperCase();
    const scopeId = Number(page.dataset.scopeId);
    const contextPath = page.dataset.contextPath || '';
    const currentUserId = Number(page.dataset.currentUserId);
    const currentUserName = (page.dataset.currentUserName || '').trim();
    const isAdmin = page.dataset.admin === 'true';
    const state = { posts: [], albums: [], album: null, albumPosts: [], activePost: null, photos: [], photoIndex: 0, activeComments: [], runtimeDescExpanded: false, editingAlbum: false, selectedAlbumId: null, selectedFiles: [], previewUrls: [], moveAlbumId: null, editingMoveAlbumId: null, activeTab: 'moyo', activeAlbumFilter: 'ALL', activeMoyoFriendId: 'ALL', activeMoyoFriend: null, layoutMode: localStorage.getItem('moyoPhotoLayoutMode') || 'grid', friendTargets: [], friendTargetsLoaded: false, friendTargetsLoading: false, selectedFriendTargetId: 'ALL', selectedWorkspaceTargetId: 'ALL', selectedProjectWorkspaceTargetId: 'ALL', selectedProjectTargetId: 'ALL', activeOwnerFilter: 'ALL', likedOnly: false };
    const $ = id => document.getElementById(id);
    const el = {
        postsView: $('postsView'), albumsView: $('albumsView'), albumDetailView: $('albumDetailView'), postGrid: $('postGrid'), albumGrid: $('albumGrid'), albumPostGrid: $('albumPostGrid'),
        postCountText: $('postCountText'), albumCountText: $('albumCountText'), postSearchInput: $('postSearchInput'), photoHeroEyebrow: $('photoHeroEyebrow'), photoHeroTitle: $('photoHeroTitle'), photoHeroDescription: $('photoHeroDescription'), photoMoyoIntro: $('photoMoyoIntro'), openMoyoPostButton: $('openMoyoPostButton'), albumSearchInput: $('albumSearchInput'), photoVisibilityFilter: $('photoVisibilityFilter'), photoOwnerFilter: $('photoOwnerFilter'), photoFriendChips: $('photoFriendChips'), moyoFeedResetButton: $('moyoFeedResetButton'), moyoMyFeedButton: $('moyoMyFeedButton'), openMoyoFriendPickerButton: $('openMoyoFriendPickerButton'), photoSortSelect: $('photoSortSelect'), openAlbumsViewButton: $('openAlbumsViewButton'), photoAlbumStrip: $('photoAlbumStrip'), photoAlbumChips: $('photoAlbumChips'), photoAlbumChipList: $('photoAlbumChipList'), photoFriendTargetPanel: $('photoFriendTargetPanel'), photoFriendTargetList: $('photoFriendTargetList'), photoWorkspaceTargetPanel: $('photoWorkspaceTargetPanel'), photoWorkspaceTargetList: $('photoWorkspaceTargetList'), photoProjectTargetPanel: $('photoProjectTargetPanel'), photoProjectWorkspaceTargetList: $('photoProjectWorkspaceTargetList'), photoProjectTargetList: $('photoProjectTargetList'), photoGridModeButton: $('photoGridModeButton'), photoFeedModeButton: $('photoFeedModeButton'), photoTrashBulkActions: $('photoTrashBulkActions'), restoreAllTrashButton: $('restoreAllTrashButton'), permanentlyDeleteAllTrashButton: $('permanentlyDeleteAllTrashButton'), likeFilterButton: document.querySelector('[data-like-filter]'),
        openPostModalButton: $('openPostModalButton'), openAlbumModalButton: $('openAlbumModalButton'), postModal: $('postModal'), albumModal: $('albumModal'),
        postFilesInput: $('postFilesInput'), photoDropZone: $('photoDropZone'), selectedFileCount: $('selectedFileCount'), clearSelectedFilesButton: $('clearSelectedFilesButton'), postPreview: $('postPreview'), postTitleInput: $('postTitleInput'), postVisibilitySelect: $('postVisibilitySelect'), postMoyoPublicBox: $('postMoyoPublicBox'), postMoyoPublicCheckbox: $('postMoyoPublicCheckbox'), postVisibilityGuide: $('postVisibilityGuide'), postDescriptionInput: $('postDescriptionInput'), postAlbumSelect: $('postAlbumSelect'), savePostButton: $('savePostButton'),
        albumModalTitle: $('albumModalTitle'), albumNameInput: $('albumNameInput'), albumDescriptionInput: $('albumDescriptionInput'), saveAlbumButton: $('saveAlbumButton'), deleteAlbumButton: $('deleteAlbumButton'),
        backToAlbumsButton: $('backToAlbumsButton'), detailAlbumName: $('detailAlbumName'), detailAlbumDescription: $('detailAlbumDescription'), detailAlbumMeta: $('detailAlbumMeta'), editAlbumButton: $('editAlbumButton'), shareToAlbumButton: $('shareToAlbumButton'),
        lightbox: $('postLightbox'), lightboxImage: $('lightboxImage'), lightboxTitle: $('lightboxTitle'), lightboxDescription: $('lightboxDescription'), lightboxMeta: $('lightboxMeta'), lightboxPrevButton: $('lightboxPrevButton'), lightboxNextButton: $('lightboxNextButton'), closeLightboxButton: $('closeLightboxButton'), deletePostButton: $('deletePostButton'), sharePostButton: $('sharePostButton'), releasePostShareButton: $('releasePostShareButton'), editPostButton: $('editPostButton'), movePostButton: $('movePostButton'), likePostButton: $('likePostButton'), lightboxLikeCount: $('lightboxLikeCount'), editPostModal: $('editPostModal'), editPostTitleInput: $('editPostTitleInput'), editPostDescriptionInput: $('editPostDescriptionInput'), editPostDescriptionCount: $('editPostDescriptionCount'), saveEditPostButton: $('saveEditPostButton'), moveAlbumModal: $('moveAlbumModal'), moveAlbumList: $('moveAlbumList'), confirmMoveAlbumButton: $('confirmMoveAlbumButton'), openMoveAlbumCreateButton: $('openMoveAlbumCreateButton'), moveAlbumCreatePanel: $('moveAlbumCreatePanel'), moveNewAlbumName: $('moveNewAlbumName'), cancelMoveAlbumCreateButton: $('cancelMoveAlbumCreateButton'), createMoveAlbumButton: $('createMoveAlbumButton'), moveAlbumEditPanel: $('moveAlbumEditPanel'), moveEditAlbumName: $('moveEditAlbumName'), cancelMoveAlbumEditButton: $('cancelMoveAlbumEditButton'), saveMoveAlbumEditButton: $('saveMoveAlbumEditButton'), toast: $('photoToast')
    };

    function pick(obj, ...keys) { for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key]; return null; }
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
    async function request(url, options) {
        const fetchOptions = Object.assign({ credentials: 'include', cache: 'no-store' }, options || {});
        fetchOptions.headers = Object.assign({ 'X-Requested-With': 'XMLHttpRequest' }, fetchOptions.headers || {});
        const r = await fetch(url, fetchOptions);
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.message || body.error || '요청을 처리하지 못했습니다.');
        return body;
    }
    let toastTimer;
    function toast(message, error) {
        clearTimeout(toastTimer);
        if (!el.toast) {
            el.toast = document.getElementById('photoToast');
        }
        if (!el.toast) {
            console[error ? 'error' : 'log'](message || '');
            return;
        }
        el.toast.textContent = message || '';
        el.toast.classList.toggle('error', !!error);
        el.toast.classList.add('show');
        toastTimer = setTimeout(() => {
            if (el.toast) el.toast.classList.remove('show');
        }, 2500);
    }
    function openModal(modal) { if (!modal) return; modal.hidden = false; modal.removeAttribute('hidden'); modal.classList.add('is-open'); modal.style.removeProperty('display'); document.body.style.overflow = 'hidden'; }
    function closeModal(modal) { if (!modal) return; modal.hidden = true; modal.setAttribute('hidden', ''); modal.classList.remove('is-open'); modal.classList.remove('photo-modal-backdrop--over-runtime'); modal.style.removeProperty('z-index'); const runtimeBox = document.getElementById('photoRuntimeLightbox'); if (modal.id === 'moveAlbumModal' && runtimeBox) runtimeBox.style.removeProperty('z-index'); const modalOpen = Array.from(document.querySelectorAll('.photo-modal-backdrop')).some(item => !item.hidden); const runtimeOpen = runtimeBox && runtimeBox.getAttribute('aria-hidden') === 'false'; const lightboxOpen = runtimeOpen || (el.lightbox && !el.lightbox.hidden); document.body.style.overflow = modalOpen || lightboxOpen ? 'hidden' : ''; }
    function bind(target, eventName, handler) { if (target) target.addEventListener(eventName, handler); }
    function setText(target, value) { if (target) target.textContent = value == null ? '' : String(value); }
    function setHTML(target, value) { if (target) target.innerHTML = value == null ? '' : String(value); }
    function setHidden(target, value) { if (target) target.hidden = !!value; }
    function toggleClass(target, className, value) { if (target && target.classList) target.classList.toggle(className, !!value); }

    function uniqueBy(list, keyFn) {
        const map = new Map();
        (Array.isArray(list) ? list : []).forEach(item => {
            const key = keyFn(item);
            if (key !== undefined && key !== null && key !== '') map.set(String(key), item);
        });
        return Array.from(map.values());
    }

    async function requestArrayOptional(url) {
        try {
            const data = await request(url);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn('[photoAlbum] optional load failed:', url, error);
            return [];
        }
    }

    function postsUrl(type, id) {
        return `/api/photo-posts?scopeType=${encodeURIComponent(type)}&scopeId=${encodeURIComponent(id)}`;
    }

    function albumsUrl(type, id) {
        return `/api/photo-albums?scopeType=${encodeURIComponent(type)}&scopeId=${encodeURIComponent(id)}`;
    }

    function selectedWorkspaceTargetsForLoad() {
        const all = collectWorkspaceTargets();
        if (state.selectedWorkspaceTargetId && state.selectedWorkspaceTargetId !== 'ALL') {
            return all.filter(item => String(item.id) === String(state.selectedWorkspaceTargetId));
        }
        return all;
    }

    function selectedProjectTargetsForLoad() {
        let projects = collectProjectTargets();
        if (state.selectedProjectWorkspaceTargetId && state.selectedProjectWorkspaceTargetId !== 'ALL') {
            projects = projects.filter(item => String(item.wsId) === String(state.selectedProjectWorkspaceTargetId));
        }
        if (state.selectedProjectTargetId && state.selectedProjectTargetId !== 'ALL') {
            projects = projects.filter(item => String(item.id) === String(state.selectedProjectTargetId));
        }
        return projects;
    }

    async function loadPostsForActiveTab() {
        if (state.activeTab === 'trash') {
            return requestArrayOptional('/api/photo-posts/trash');
        }
        const basePersonal = requestArrayOptional(postsUrl(scopeType, scopeId));
        if (state.activeTab === 'workspace') {
            const targets = selectedWorkspaceTargetsForLoad();
            const loaded = await Promise.all(targets.map(item => requestArrayOptional(postsUrl('WORKSPACE', item.id))));
            return uniqueBy(loaded.flat(), post => pick(post, 'postId', 'POST_ID'));
        }
        if (state.activeTab === 'project') {
            const targets = selectedProjectTargetsForLoad();
            const loaded = await Promise.all(targets.map(item => requestArrayOptional(postsUrl('PROJECT', item.id))));
            return uniqueBy(loaded.flat(), post => pick(post, 'postId', 'POST_ID'));
        }
        if (state.activeTab === 'recent') {
            const workspaces = collectWorkspaceTargets();
            const projects = collectProjectTargets();
            const loaded = await Promise.all([
                basePersonal,
                ...workspaces.map(item => requestArrayOptional(postsUrl('WORKSPACE', item.id))),
                ...projects.map(item => requestArrayOptional(postsUrl('PROJECT', item.id)))
            ]);
            return uniqueBy(loaded.flat(), post => pick(post, 'postId', 'POST_ID'));
        }
        return basePersonal;
    }

    async function loadAlbumsForActiveTab() {
        if (state.activeTab === 'workspace') {
            const targets = selectedWorkspaceTargetsForLoad();
            const loaded = await Promise.all(targets.map(item => requestArrayOptional(albumsUrl('WORKSPACE', item.id))));
            return uniqueBy(loaded.flat(), album => pick(album, 'albumId', 'ALBUM_ID'));
        }
        if (state.activeTab === 'project') {
            const targets = selectedProjectTargetsForLoad();
            const loaded = await Promise.all(targets.map(item => requestArrayOptional(albumsUrl('PROJECT', item.id))));
            return uniqueBy(loaded.flat(), album => pick(album, 'albumId', 'ALBUM_ID'));
        }
        if (state.activeTab === 'personal') {
            return requestArrayOptional(albumsUrl(scopeType, scopeId));
        }
        return [];
    }

    async function loadAll() {
        try {
            const [posts, albums] = await Promise.all([loadPostsForActiveTab(), loadAlbumsForActiveTab()]);
            state.posts = posts;
            state.albums = albums;
            if (state.activeAlbumFilter !== 'ALL' && state.activeAlbumFilter !== 'NONE') {
                const hasAlbum = state.albums.some(album => String(pick(album, 'albumId', 'ALBUM_ID')) === String(state.activeAlbumFilter));
                if (!hasAlbum) state.activeAlbumFilter = 'ALL';
            }
            refreshPosts(); renderAlbums(); renderAlbumChips(); fillAlbumSelect(); syncTrashBulkActions();
        } catch (e) { toast(e.message, true); }
    }

    function parseCreatedDate(value) {
        if (!value) return null;
        const normalized = String(value).trim().replace(/\./g, '-').replace(' ', 'T');
        const date = new Date(normalized);
        if (!Number.isNaN(date.getTime())) return date;
        const match = String(value).match(/(\d{4})[-./](\d{1,2})/);
        return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : null;
    }

    function monthGroup(post) {
        const raw = pick(post, 'createdAt', 'CREATED_AT');
        const date = parseCreatedDate(raw);
        if (!date) return { key: 'unknown', label: '날짜 미상' };
        return {
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`
        };
    }


    function visibilityLabel(post) {
        const value = String(pick(post, 'visibilityType', 'VISIBILITY_TYPE') || '').toUpperCase();
        if (value === 'FRIENDS') return 'MOYO 공개';
        if (value === 'SELECTED') return '선택 친구';
        if (value === 'WS' || value === 'WORKSPACE') return '그룹 공개';
        if (value === 'PROJ' || value === 'PROJECT') return '프로젝트 공개';
        if (scopeType === 'WORKSPACE') return '그룹 공개';
        if (scopeType === 'PROJECT') return '프로젝트 공개';
        return '나만 보기';
    }

    function moyoMascotPath() {
        return `${contextPath}/brand/moyo_feed_mark.png`;
    }

    function visibilityBadgeMarkup(post) {
        const visibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        const postScope = normalizePostScope(post);
        if (visibility === 'FRIENDS') {
            return `<span class="post-visibility-chip post-visibility-chip--moyo" title="MOYO 공개"><img src="${esc(moyoMascotPath())}" alt="MOYO"><span>MOYO 공개</span></span>`;
        }
        if (visibility === 'SELECTED') {
            return '<span class="post-visibility-chip post-visibility-chip--selected"><i class="fa-regular fa-user"></i><span>선택 친구</span></span>';
        }
        if (postScope === 'WORKSPACE' || visibility === 'WORKSPACE' || visibility === 'WS') {
            return '<span class="post-visibility-chip post-visibility-chip--workspace"><i class="fa-regular fa-building"></i><span>그룹 공개</span></span>';
        }
        if (postScope === 'PROJECT' || visibility === 'PROJECT' || visibility === 'PROJ') {
            return '<span class="post-visibility-chip post-visibility-chip--project"><i class="fa-regular fa-flag"></i><span>프로젝트 공개</span></span>';
        }
        return '<span class="post-visibility-chip post-visibility-chip--private"><i class="fa-solid fa-lock"></i><span>나만 보기</span></span>';
    }

    function tabLabel(tab) {
        return ({ moyo: 'MOYO', recent: '최근', liked: '좋아요', personal: '개인', friend: '친구', workspace: '그룹', project: '프로젝트', trash: '휴지통' })[tab] || 'MOYO';
    }

    function tabEmptyMessage(tab) {
        if (tab === 'moyo') {
            if (state.activeMoyoFriendId && state.activeMoyoFriendId !== 'ALL') {
                const name = state.activeMoyoFriend && state.activeMoyoFriend.name ? state.activeMoyoFriend.name : '선택한 친구';
                return { title: `${name}님의 MOYO 피드에 사진이 없습니다.`, message: '다른 친구를 선택하거나 최근 피드로 돌아가보세요.' };
            }
            return { title: '아직 MOYO 피드에 사진이 없습니다.', message: '사진을 올릴 때 MOYO 공개를 체크하면 내 MOYO 피드와 친구들의 피드에 함께 표시됩니다.' };
        }
        if (tab === 'friend') return { title: '친구에게 공유한 사진이 없습니다.', message: '선택 친구 공유로 지정한 사진을 이곳에서 관리합니다.' };
        if (tab === 'liked') return { title: '좋아요한 사진이 없습니다.', message: '마음에 드는 사진은 좋아요로 모아볼 수 있습니다.' };
        if (tab === 'trash') return { title: '휴지통이 비어 있습니다.', message: '휴지통으로 이동한 사진이 이곳에 표시됩니다.' };
        if (tab === 'workspace') return { title: '그룹 사진이 없습니다.', message: '그룹 활동 기록은 그룹 공개 사진으로 모아볼 수 있습니다.' };
        if (tab === 'project') return { title: '프로젝트 사진이 없습니다.', message: '진행 과정과 결과물 사진은 프로젝트별로 모아볼 수 있습니다.' };
        if (tab === 'personal') return { title: '개인 사진이 없습니다.', message: '나만 보기 사진을 개인 영역에서 정리합니다.' };
        return { title: '아직 사진이 없습니다.', message: '앨범을 만들지 않아도 먼저 사진을 올릴 수 있습니다.' };
    }


    const heroConfig = {
        moyo: {
            eyebrow: 'MOYO 피드',
            title: 'MOYO 피드',
            description: '친구들이 MOYO 공개로 올린 사진을 한곳에서 모아보세요.',
            button: '<i class="fa-solid fa-plus"></i> MOYO 공개',
            search: 'MOYO 피드 검색'
        },
        recent: {
            eyebrow: '최근 사진',
            title: '최근 사진',
            description: '내가 볼 수 있는 사진을 최신순으로 확인하세요.',
            button: '<i class="fa-solid fa-plus"></i> 사진 올리기',
            search: '사진 검색'
        },
        personal: {
            eyebrow: '개인 사진',
            title: '개인 사진',
            description: '나만 보거나 MOYO에 공개할 내 사진을 관리하세요.',
            button: '<i class="fa-solid fa-plus"></i> 사진 올리기',
            search: '개인 사진 검색'
        },
        friend: {
            eyebrow: '친구 공개',
            title: '친구 공개',
            description: '친구에게 공개했거나 선택 공유한 내 사진을 관리하세요.',
            button: '<i class="fa-solid fa-plus"></i> 사진 올리기',
            search: '친구 공개 사진 검색'
        },
        workspace: {
            eyebrow: '그룹 사진',
            title: '그룹 사진',
            description: '그룹에서 함께 사용하는 사진을 앨범으로 정리하세요.',
            button: '<i class="fa-solid fa-plus"></i> 사진 올리기',
            search: '그룹 사진 검색'
        },
        project: {
            eyebrow: '프로젝트 사진',
            title: '프로젝트 사진',
            description: '프로젝트 진행 과정과 결과 사진을 모아 관리하세요.',
            button: '<i class="fa-solid fa-plus"></i> 사진 올리기',
            search: '프로젝트 사진 검색'
        },
        liked: {
            eyebrow: '좋아요',
            title: '좋아요',
            description: '내가 좋아요한 사진을 모아보세요.',
            button: '<i class="fa-solid fa-plus"></i> 사진 올리기',
            search: '좋아요 사진 검색'
        }
    };

    function currentHeroConfig() {
        return heroConfig[state.activeTab] || heroConfig.moyo;
    }

    function updateHero() {
        const config = currentHeroConfig();
        if (el.photoHeroEyebrow) el.photoHeroEyebrow.textContent = config.eyebrow;
        if (el.photoHeroTitle) el.photoHeroTitle.textContent = config.title;
        if (el.photoHeroDescription) el.photoHeroDescription.textContent = config.description;
        if (el.openPostModalButton) {
            el.openPostModalButton.innerHTML = config.button;
            el.openPostModalButton.setAttribute('href', postWriteUrl());
        }
        if (el.postSearchInput) el.postSearchInput.placeholder = config.search;
    }

    function normalizeVisibility(value) {
        const normalized = String(value || '').toUpperCase();
        if (normalized === 'WS') return 'WORKSPACE';
        if (normalized === 'PROJ') return 'PROJECT';
        return normalized;
    }


    function postOwnerId(post) {
        return Number(pick(post, 'userId', 'USER_ID') || 0);
    }

    function isMyPersonalPost(post) {
        return normalizePostScope(post) === 'PERSONAL' && postOwnerId(post) === currentUserId;
    }

    function isMoyoFeedPost(post) {
        const visibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        return normalizePostScope(post) === 'PERSONAL' && visibility === 'FRIENDS';
    }

    function isMoyoPublicPost(post) {
        const visibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        return normalizePostScope(post) === 'PERSONAL' && ['FRIENDS', 'PUBLIC', 'MOYO', 'GLOBAL'].includes(visibility);
    }

    function isSharedToMe(post) {
        return Number(pick(post, 'isSharedToMe', 'IS_SHARED_TO_ME') || 0) === 1;
    }

    function receivedShareId(post) {
        return Number(pick(post, 'receivedShareId', 'RECEIVED_SHARE_ID') || 0);
    }

    function canReleaseReceivedShare(post) {
        return isSharedToMe(post) && receivedShareId(post) > 0;
    }

    function sharedTargetTypes(post) {
        return String(pick(post, 'shareTargetTypes', 'SHARE_TARGET_TYPES') || '').toUpperCase();
    }

    function isSharedByMeToFriend(post) {
        if (!isMyPersonalPost(post)) return false;
        if (Number(pick(post, 'isSharedByMe', 'IS_SHARED_BY_ME') || 0) === 1) return true;
        if (sharedTargetUserIds(post).length > 0) return true;
        return sharedTargetTypes(post).split(',').map(v => v.trim()).includes('USER');
    }

    function isMyFriendSharedPost(post) {
        const visibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        return isSharedByMeToFriend(post) || (isMyPersonalPost(post) && visibility === 'SELECTED') || isSharedToMe(post);
    }

    function isMyPrivatePost(post) {
        return isMyPersonalPost(post);
    }

    function friendChipAvatar(name, imagePath) {
        const src = resolveAssetPath(imagePath);
        const initial = String(name || '?').trim().charAt(0) || '?';
        if (src) return `<span class="moyo-friend-avatar has-image"><img src="${esc(src)}" alt="${esc(name || '프로필')}" loading="lazy" onerror="this.closest('.moyo-friend-avatar').classList.remove('has-image');this.remove();"></span>`;
        return `<span class="moyo-friend-avatar">${esc(initial)}</span>`;
    }

    function moyoFriendChip(id, label, imagePath, extraClass, count) {
        const className = extraClass || '';
        const avatar = id === 'ALL'
            ? '<span class="moyo-friend-avatar moyo-friend-avatar--all"><i class="fa-solid fa-clock"></i></span>'
            : friendChipAvatar(label, imagePath);
        return `<button type="button" class="moyo-friend-chip ${className}" data-moyo-friend="${esc(id)}" title="${esc(label)}">${avatar}<span class="moyo-friend-name">${esc(label)}</span></button>`;
    }

    function collectMoyoFeedFriends(posts) {
        const friends = new Map();
        (posts || []).forEach(post => {
            if (!isMoyoFeedPost(post)) return;
            const ownerId = postOwnerId(post);
            if (!ownerId) return;
            const key = String(ownerId);
            const name = pick(post, 'creatorName', 'CREATOR_NAME') || '친구';
            const profile = profileImageOf(post);
            const createdDate = parseCreatedDate(pick(post, 'createdAt', 'CREATED_AT'));
            const createdTime = createdDate ? createdDate.getTime() : 0;
            const prev = friends.get(key);
            friends.set(key, {
                id: key,
                name,
                profile: profile || (prev && prev.profile) || '',
                subtitle: key === String(currentUserId) ? '내 MOYO 공개 사진' : 'MOYO 공개 사진',
                latest: Math.max(prev ? prev.latest : 0, createdTime),
                count: (prev ? prev.count : 0) + 1
            });
        });
        return friends;
    }

    function syncFriendFilter(posts) {
        if (!el.photoFriendChips) return;

        const friends = collectMoyoFeedFriends(posts);
        const activeId = String(state.activeMoyoFriendId || 'ALL');
        const myId = String(currentUserId || '');
        const totalCount = Array.from(friends.values()).reduce((sum, friend) => sum + Number(friend.count || 0), 0);
        const mine = myId ? friends.get(myId) : null;
        const mineCount = Number(mine ? mine.count || 0 : 0);
        const chips = [];
        const used = new Set(['ALL']);

        // 왼쪽 묶음: 최근 업로드 흐름 + 최근 올린 사람들
        chips.push(moyoFriendChip('ALL', '최근', '', `moyo-friend-chip--recent${activeId === 'ALL' ? ' active' : ''}`, totalCount));

        const recentPeople = Array.from(friends.values())
            .filter(friend => friend && friend.id && friend.id !== 'ALL' && String(friend.id) !== myId)
            .sort((a, b) => {
                const latestGap = Number(b.latest || 0) - Number(a.latest || 0);
                if (latestGap) return latestGap;
                const countGap = Number(b.count || 0) - Number(a.count || 0);
                if (countGap) return countGap;
                return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
            })
            .slice(0, 6);

        recentPeople.forEach(friend => {
            const id = String(friend.id);
            used.add(id);
            const className = `moyo-friend-chip--person${activeId === id ? ' active' : ''}`;
            chips.push(moyoFriendChip(id, friend.name || '친구', friend.profile || '', className, friend.count || 0));
        });

        if (activeId !== 'ALL' && activeId !== 'ME' && !used.has(activeId)) {
            const selected = state.activeMoyoFriend || {};
            chips.push(moyoFriendChip(activeId, selected.name || '선택 친구', selected.profile || '', 'moyo-friend-chip--selected active', Number(selected.count || 0)));
        }

        setHTML(el.photoFriendChips, chips.join(''));

        // 오른쪽 묶음: 내 사진 / 친구 목록
        // 전체 최신 피드는 왼쪽의 '최근' 칩이 담당한다.
        if (el.moyoMyFeedButton) {
            el.moyoMyFeedButton.dataset.moyoFriend = 'ME';
            el.moyoMyFeedButton.classList.toggle('active', activeId === 'ME');
            const label = el.moyoMyFeedButton.querySelector('.moyo-mine-label');
            if (label) label.textContent = '내 사진';
        }
    }



    function ensureFriendPickerModal() {
        if (window.CommonFriendPickerModal && typeof window.CommonFriendPickerModal.open === 'function') return true;

        let modal = document.getElementById('commonFriendPickerModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="common-friend-picker-backdrop" id="commonFriendPickerModal" hidden>
                    <div class="common-friend-picker" role="dialog" aria-modal="true" aria-labelledby="commonFriendPickerTitle">
                        <div class="common-friend-picker-header">
                            <div><h2 id="commonFriendPickerTitle">친구 목록</h2><p id="commonFriendPickerDescription">친구를 클릭하면 해당 친구의 MOYO 피드로 이동합니다.</p></div>
                            <button type="button" class="common-friend-picker-close" id="commonFriendPickerCloseButton" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <label class="common-friend-picker-search"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="commonFriendPickerSearchInput" autocomplete="off" placeholder="친구 이름 또는 이메일 검색"></label>
                        <div class="common-friend-picker-body" id="commonFriendPickerList" role="listbox" aria-label="친구 목록"></div>
                        <div class="common-friend-picker-footer">
                            <div class="common-friend-picker-footer-left"><span id="commonFriendPickerSummary">선택 없음</span><a href="#" id="commonFriendPickerManageLink" hidden>친구 관리로 이동</a></div>
                            <div class="common-friend-picker-actions"><button type="button" class="common-friend-picker-secondary" id="commonFriendPickerCancelButton">취소</button><button type="button" class="common-friend-picker-primary" id="commonFriendPickerConfirmButton">확인</button></div>
                        </div>
                    </div>
                </div>`);
            modal = document.getElementById('commonFriendPickerModal');
        }

        const nodes = {
            title: document.getElementById('commonFriendPickerTitle'),
            description: document.getElementById('commonFriendPickerDescription'),
            search: document.getElementById('commonFriendPickerSearchInput'),
            list: document.getElementById('commonFriendPickerList'),
            summary: document.getElementById('commonFriendPickerSummary'),
            confirm: document.getElementById('commonFriendPickerConfirmButton'),
            manage: document.getElementById('commonFriendPickerManageLink'),
            cancel: document.getElementById('commonFriendPickerCancelButton'),
            close: document.getElementById('commonFriendPickerCloseButton')
        };
        if (!modal || !nodes.title || !nodes.search || !nodes.list || !nodes.confirm || modal.dataset.photoFallbackBound === '1') {
            return !!(window.CommonFriendPickerModal && typeof window.CommonFriendPickerModal.open === 'function');
        }
        modal.dataset.photoFallbackBound = '1';

        const pickerState = { friends: [], filtered: [], selected: new Set(), mode: 'single', onSelect: null, emptyText: '표시할 친구가 없습니다.', emptySubText: '친구 이름이나 이메일로 다시 검색해보세요.', loading: false, instantSelect: false };
        const normalize = friend => ({
            id: String(pick(friend, 'id', 'userId', 'USER_ID') || '').trim(),
            name: String(pick(friend, 'name', 'userName', 'USER_NAME') || '친구').trim(),
            email: String(pick(friend, 'email', 'EMAIL') || '').trim(),
            profile: String(pick(friend, 'profile', 'profileImage', 'profileImagePath', 'PROFILE_IMAGE_PATH') || '').trim(),
            subtitle: String(pick(friend, 'subtitle', 'description', 'email', 'EMAIL') || '').trim(),
            count: Number(pick(friend, 'count', 'photoCount', 'PHOTO_COUNT') || 0),
            countLabel: String(pick(friend, 'countLabel', 'COUNT_LABEL') || '').trim(),
            type: String(pick(friend, 'type', 'TYPE') || '').trim(),
            avatarIcon: String(pick(friend, 'avatarIcon', 'AVATAR_ICON') || '').trim(),
            raw: friend
        });
        const avatar = friend => friend.avatarIcon
            ? `<span class="common-friend-picker-avatar common-friend-picker-avatar--icon"><i class="${esc(friend.avatarIcon)}"></i></span>`
            : (friend.profile
                ? `<span class="common-friend-picker-avatar has-image"><img src="${esc(friend.profile)}" alt="${esc(friend.name)}" loading="lazy" onerror="this.closest('.common-friend-picker-avatar').classList.remove('has-image');this.remove();"></span>`
                : `<span class="common-friend-picker-avatar">${esc((friend.name || '?').charAt(0))}</span>`);
        const updateSummary = () => {
            if (pickerState.instantSelect) {
                nodes.summary.textContent = '';
                nodes.confirm.disabled = true;
                return;
            }
            const count = pickerState.selected.size;
            nodes.summary.textContent = count ? `선택 ${count}명` : '선택 없음';
            nodes.confirm.disabled = !count || pickerState.loading;
        };
        const render = () => {
            if (pickerState.loading) {
                nodes.list.innerHTML = `<div class="common-friend-picker-empty"><i class="fa-solid fa-spinner fa-spin"></i><strong>${esc(pickerState.emptyText)}</strong><span>${esc(pickerState.emptySubText)}</span></div>`;
                updateSummary();
                return;
            }
            if (!pickerState.filtered.length) {
                nodes.list.innerHTML = `<div class="common-friend-picker-empty"><i class="fa-regular fa-face-smile"></i><strong>${esc(pickerState.emptyText)}</strong><span>${esc(pickerState.emptySubText)}</span></div>`;
                updateSummary();
                return;
            }
            nodes.list.innerHTML = pickerState.filtered.map(friend => {
                const selected = pickerState.selected.has(friend.id);
                const meta = friend.email || friend.subtitle || '';
                const countLabel = friend.countLabel || `사진 ${Number(friend.count || 0)}개`;
                const typeClass = friend.type ? ` common-friend-picker-row--${friend.type}` : '';
                return `<button type="button" class="common-friend-picker-row${typeClass}${selected ? ' selected' : ''}" data-friend-id="${esc(friend.id)}" role="option" aria-selected="${selected}">${avatar(friend)}<span class="common-friend-picker-info"><strong>${esc(friend.name)}</strong>${meta ? `<small>${esc(meta)}</small>` : ''}</span>${pickerState.instantSelect ? `<span class="common-friend-picker-count">${esc(countLabel)}</span>` : '<span class="common-friend-picker-check"><i class="fa-solid fa-check"></i></span>'}</button>`;
            }).join('');
            updateSummary();
        };
        const applySearch = () => {
            const keyword = String(nodes.search.value || '').trim().toLowerCase();
            pickerState.filtered = keyword ? pickerState.friends.filter(friend => [friend.name, friend.email, friend.subtitle].join(' ').toLowerCase().includes(keyword)) : pickerState.friends.slice();
            render();
        };
        const close = () => { modal.hidden = true; document.body.style.overflow = ''; };
        nodes.search.addEventListener('input', applySearch);
        nodes.list.addEventListener('click', event => {
            const button = event.target.closest('[data-friend-id]');
            if (!button) return;
            const id = String(button.dataset.friendId || '');
            if (!id) return;
            if (pickerState.instantSelect && pickerState.mode === 'single') {
                const friend = pickerState.friends.find(item => item.id === id);
                if (!friend) return;
                close();
                if (typeof pickerState.onSelect === 'function') pickerState.onSelect(friend);
                return;
            }
            if (pickerState.mode === 'single') pickerState.selected = new Set([id]);
            else if (pickerState.selected.has(id)) pickerState.selected.delete(id);
            else pickerState.selected.add(id);
            render();
        });
        nodes.confirm.addEventListener('click', () => {
            const selected = pickerState.friends.filter(friend => pickerState.selected.has(friend.id));
            if (!selected.length) return;
            close();
            if (typeof pickerState.onSelect === 'function') pickerState.onSelect(pickerState.mode === 'multiple' ? selected : selected[0]);
        });
        [nodes.cancel, nodes.close].filter(Boolean).forEach(button => button.addEventListener('click', close));
        modal.addEventListener('click', event => { if (event.target === modal) close(); });

        window.CommonFriendPickerModal = {
            open(options) {
                const opts = options || {};
                pickerState.mode = opts.mode === 'multiple' ? 'multiple' : 'single';
                pickerState.onSelect = opts.onSelect || null;
                pickerState.loading = !!opts.loading;
                pickerState.instantSelect = !!opts.instantSelect;
                modal.classList.toggle('instant-select', pickerState.instantSelect);
                pickerState.emptyText = pickerState.loading ? (opts.loadingText || '불러오는 중입니다.') : (opts.emptyText || '표시할 친구가 없습니다.');
                pickerState.emptySubText = opts.emptySubText || '친구 이름이나 이메일로 다시 검색해보세요.';
                pickerState.friends = (opts.friends || []).map(normalize).filter(friend => friend.id);
                pickerState.filtered = pickerState.friends.slice();
                pickerState.selected = new Set((opts.selectedIds || []).map(String));
                nodes.title.textContent = opts.title || '친구 선택';
                nodes.description.textContent = opts.description || '친구를 검색하고 선택하세요.';
                nodes.confirm.textContent = opts.confirmText || '확인';
                if (nodes.confirm) nodes.confirm.hidden = pickerState.instantSelect;
                if (nodes.cancel) nodes.cancel.hidden = pickerState.instantSelect;
                if (nodes.manage) {
                    nodes.manage.hidden = !opts.manageHref;
                    nodes.manage.href = opts.manageHref || '#';
                    nodes.manage.textContent = opts.manageText || '친구 관리로 이동';
                }
                nodes.search.value = '';
                nodes.search.placeholder = opts.searchPlaceholder || '친구 이름 또는 이메일 검색';
                nodes.search.disabled = pickerState.loading;
                modal.hidden = false;
                document.body.style.overflow = 'hidden';
                render();
                setTimeout(() => { if (!nodes.search.disabled) nodes.search.focus(); }, 30);
            },
            close
        };
        return true;
    }

    function normalizePickerFriend(friend, feedFriends) {
        const id = String(pick(friend, 'id', 'userId', 'USER_ID', 'friendUserId', 'FRIEND_USER_ID') || '').trim();
        if (!id || id === String(currentUserId)) return null;
        const feed = feedFriends && feedFriends.get(id);
        const name = String(pick(friend, 'name', 'userName', 'USER_NAME') || (feed && feed.name) || '친구').trim();
        const email = String(pick(friend, 'email', 'EMAIL') || '').trim();
        const profile = resolveAssetPath(String(pick(friend, 'profile', 'profileImage', 'profileImagePath', 'PROFILE_IMAGE_PATH') || (feed && feed.profile) || '').trim());
        const count = feed ? Number(feed.count || 0) : 0;
        const latest = feed ? Number(feed.latest || 0) : 0;
        return {
            id,
            name,
            email,
            profile,
            count,
            latest,
            type: 'friend',
            subtitle: email || '친구',
            countLabel: count ? `사진 ${count}개` : '사진 0개'
        };
    }


    function targetInitial(name) {
        return String(name || '?').trim().charAt(0) || '?';
    }

    function collectWorkspaceTargets() {
        return Array.from(document.querySelectorAll('#photoAlbumWorkspaceTargetSource [data-ws-id]')).map(node => ({
            id: String(node.dataset.wsId || '').trim(),
            name: String(node.dataset.wsName || '그룹').trim(),
            image: String(node.dataset.wsImagePath || '').trim()
        })).filter(item => item.id);
    }

    function collectProjectTargets() {
        return Array.from(document.querySelectorAll('#photoAlbumProjectTargetSource [data-proj-id]')).map(node => ({
            id: String(node.dataset.projId || '').trim(),
            name: String(node.dataset.projName || '프로젝트').trim(),
            wsId: String(node.dataset.wsId || '').trim(),
            wsName: String(node.dataset.wsName || '그룹').trim()
        })).filter(item => item.id);
    }

    function targetAvatarMarkup(item, type) {
        const src = resolveAssetPath(item && item.image);
        const initial = esc(targetInitial(item && item.name));
        if (type === 'project') return `<span class="nl-project-inline-avatar" aria-hidden="true">${initial}</span>`;
        if (src) return `<span class="nl-space-avatar has-image"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.closest('.nl-space-avatar').classList.remove('has-image');this.remove();"><span class="nl-space-avatar-fallback" aria-hidden="true">${initial}</span></span>`;
        return `<span class="nl-space-avatar"><span class="nl-space-avatar-fallback" aria-hidden="true">${initial}</span></span>`;
    }

    function targetCardMarkup(type, id, name, sub, active, item) {
        const projectClass = type === 'project' ? ' nl-project-option' : '';
        const selectedClass = active ? ' active is-selected' : '';
        const nameWrap = type === 'project' ? 'nl-project-name-wrap' : 'nl-space-name-wrap';
        return `<button type="button" class="photo-target-card nl-space-option${projectClass}${selectedClass}" data-photo-${type}-target="${esc(id)}">${targetAvatarMarkup(item || { name }, type)}<span class="${nameWrap}"><span class="nl-space-name">${esc(name)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`;
    }

    function selectedProjectWorkspaceName() {
        if (state.selectedProjectWorkspaceTargetId === 'ALL') return '전체 그룹';
        const ws = collectWorkspaceTargets().find(item => String(item.id) === String(state.selectedProjectWorkspaceTargetId));
        return ws ? ws.name : '선택 그룹';
    }

    function renderFriendTargetPanel() {
        if (!el.photoFriendTargetList) return;
        if (state.friendTargetsLoading) {
            setHTML(el.photoFriendTargetList, '<div class="photo-target-loading"><i class="fa-solid fa-spinner fa-spin"></i> 친구 목록을 불러오는 중입니다.</div>');
            return;
        }
        const items = [`<button type="button" class="photo-target-card nl-space-option nl-space-option-all${state.selectedFriendTargetId === 'ALL' ? ' active is-selected' : ''}" data-photo-friend-target="ALL"><span class="nl-space-avatar nl-space-avatar-all"><i class="fa-solid fa-users"></i></span><span class="nl-space-name">전체 친구</span></button>`];
        state.friendTargets.forEach(friend => {
            items.push(targetCardMarkup('friend', friend.id, friend.name || '친구', friend.email || friend.subtitle || '친구', String(state.selectedFriendTargetId) === String(friend.id), { name: friend.name, image: friend.profile }));
        });
        if (!state.friendTargets.length && state.friendTargetsLoaded) {
            items.push('<div class="photo-target-empty">표시할 친구가 없습니다.</div>');
        }
        setHTML(el.photoFriendTargetList, items.join(''));
        bindPhotoHorizontalScrollers(el.photoFriendTargetPanel);
    }

    async function ensureFriendTargets() {
        if (state.friendTargetsLoaded || state.friendTargetsLoading) return;
        state.friendTargetsLoading = true;
        renderFriendTargetPanel();
        try {
            state.friendTargets = await loadFriendPickerList();
            state.friendTargetsLoaded = true;
        } catch (error) {
            state.friendTargets = [];
            state.friendTargetsLoaded = true;
            toast(error.message || '친구 목록을 불러오지 못했습니다.', true);
        } finally {
            state.friendTargetsLoading = false;
            renderFriendTargetPanel();
        }
    }

    function renderWorkspaceTargetPanel() {
        if (!el.photoWorkspaceTargetList) return;
        const workspaces = collectWorkspaceTargets();
        const items = [`<button type="button" class="photo-target-card nl-space-option nl-space-option-all${state.selectedWorkspaceTargetId === 'ALL' ? ' active is-selected' : ''}" data-photo-workspace-target="ALL"><span class="nl-space-avatar nl-space-avatar-all"><i class="fa-solid fa-layer-group"></i></span><span class="nl-space-name">전체 그룹</span></button>`];
        workspaces.forEach(ws => items.push(targetCardMarkup('workspace', ws.id, ws.name, '그룹 사진', String(state.selectedWorkspaceTargetId) === String(ws.id), ws)));
        if (!workspaces.length) items.push('<div class="photo-target-empty">참여 중인 그룹이 없습니다.</div>');
        setHTML(el.photoWorkspaceTargetList, items.join(''));
        bindPhotoHorizontalScrollers(el.photoWorkspaceTargetPanel);
    }

    function renderProjectTargetPanel() {
        if (!el.photoProjectWorkspaceTargetList || !el.photoProjectTargetList) return;
        const workspaces = collectWorkspaceTargets();
        const projects = collectProjectTargets();
        const wsItems = [`<button type="button" class="photo-target-card nl-space-option nl-space-option-all${state.selectedProjectWorkspaceTargetId === 'ALL' ? ' active is-selected' : ''}" data-photo-project-workspace-target="ALL"><span class="nl-space-avatar nl-space-avatar-all"><i class="fa-solid fa-layer-group"></i></span><span class="nl-space-name">전체 그룹</span></button>`];
        workspaces.forEach(ws => wsItems.push(targetCardMarkup('project-workspace', ws.id, ws.name, '', String(state.selectedProjectWorkspaceTargetId) === String(ws.id), ws)));
        setHTML(el.photoProjectWorkspaceTargetList, wsItems.join(''));
        bindPhotoHorizontalScrollers(el.photoProjectTargetPanel);

        const filtered = state.selectedProjectWorkspaceTargetId === 'ALL' ? projects : projects.filter(project => String(project.wsId) === String(state.selectedProjectWorkspaceTargetId));
        if (state.selectedProjectTargetId !== 'ALL' && !filtered.some(project => String(project.id) === String(state.selectedProjectTargetId))) {
            state.selectedProjectTargetId = 'ALL';
        }
        const projectItems = [`<button type="button" class="photo-target-card nl-space-option nl-project-option nl-space-option-all${state.selectedProjectTargetId === 'ALL' ? ' active is-selected' : ''}" data-photo-project-target="ALL"><span class="nl-project-inline-avatar" aria-hidden="true"><i class="fa-solid fa-diagram-project"></i></span><span class="nl-space-name">전체 프로젝트</span></button>`];
        filtered.forEach(project => projectItems.push(targetCardMarkup('project', project.id, project.name, project.wsName || '프로젝트', String(state.selectedProjectTargetId) === String(project.id), project)));
        if (!filtered.length) projectItems.push('<div class="photo-target-empty">선택한 그룹에 프로젝트가 없습니다.</div>');
        setHTML(el.photoProjectTargetList, projectItems.join(''));
        bindPhotoHorizontalScrollers(el.photoProjectTargetPanel);
    }

    function renderTargetPanels() {
        setHidden(el.photoFriendTargetPanel, state.activeTab !== 'friend');
        setHidden(el.photoWorkspaceTargetPanel, state.activeTab !== 'workspace');
        setHidden(el.photoProjectTargetPanel, state.activeTab !== 'project');
        if (state.activeTab === 'friend') {
            renderFriendTargetPanel();
            ensureFriendTargets();
        }
        if (state.activeTab === 'workspace') renderWorkspaceTargetPanel();
        if (state.activeTab === 'project') renderProjectTargetPanel();
    }

    function sharedTargetUserIds(post) {
        return String(pick(post, 'shareTargetUserIds', 'SHARE_TARGET_USER_IDS') || '').split(',').map(v => v.trim()).filter(Boolean);
    }

    function postScopeId(post) {
        return String(pick(post, 'scopeId', 'SCOPE_ID', 'wsId', 'WS_ID', 'workspaceId', 'WORKSPACE_ID', 'projId', 'PROJ_ID', 'projectId', 'PROJECT_ID') || '').trim();
    }

    function projectWorkspaceId(projectId) {
        const project = collectProjectTargets().find(item => String(item.id) === String(projectId));
        return project ? String(project.wsId || '') : '';
    }

    async function loadFriendPickerList() {
        const feedFriends = collectMoyoFeedFriends(state.posts);
        const url = `${contextPath}/friends/api/list`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
            throw new Error(data.message || '친구 목록을 불러오지 못했습니다.');
        }
        const apiFriends = Array.isArray(data.friends) ? data.friends : [];
        return apiFriends
            .map(friend => normalizePickerFriend(friend, feedFriends))
            .filter(Boolean)
            .sort((a, b) => {
                const latestGap = Number(b.latest || 0) - Number(a.latest || 0);
                if (latestGap) return latestGap;
                const countGap = Number(b.count || 0) - Number(a.count || 0);
                if (countGap) return countGap;
                return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
            });
    }

    function friendPickerOptions(friends, loading, errorMessage) {
        const items = loading || errorMessage ? [] : (friends || []);
        const activeId = String(state.activeMoyoFriendId || 'ALL');
        const selectedIds = activeId !== 'ALL' && activeId !== 'ME' ? [activeId] : [];
        return {
            mode: 'single',
            title: '친구 목록',
            description: '친구를 클릭하면 해당 친구의 MOYO 피드로 이동합니다.',
            searchPlaceholder: '친구 이름 또는 이메일 검색',
            confirmText: '보기',
            instantSelect: true,
            emptyText: errorMessage || '등록된 친구가 없습니다.',
            emptySubText: errorMessage ? '잠시 후 다시 시도하거나 친구 관리 페이지를 확인해주세요.' : '친구를 추가하면 이곳에서 친구 피드를 골라볼 수 있습니다.',
            loadingText: '친구 목록을 불러오는 중입니다.',
            manageHref: `${contextPath}/friends`,
            manageText: '친구 관리로 이동',
            loading: !!loading,
            friends: items,
            selectedIds,
            onSelect(item) {
                if (!item) return;
                const id = String(item.id || '').trim();
                if (!id) return;
                state.activeMoyoFriendId = id;
                state.activeMoyoFriend = { id, name: item.name || '친구', profile: item.profile || '', count: item.count || 0 };
                syncFriendFilter(state.posts);
                refreshPosts();
            }
        };
    }

    async function openMoyoFriendPicker() {
        if (!ensureFriendPickerModal()) {
            toast('친구 선택 모달을 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.', true);
            return;
        }

        window.CommonFriendPickerModal.open(friendPickerOptions([], true));
        try {
            const friends = await loadFriendPickerList();
            window.CommonFriendPickerModal.open(friendPickerOptions(friends, false));
        } catch (error) {
            window.CommonFriendPickerModal.open(friendPickerOptions([], false, error.message));
        }
    }

    function normalizePostScope(post) {
        const raw = String(pick(post, 'scopeType', 'SCOPE_TYPE') || scopeType || '').toUpperCase();
        if (raw === 'WS') return 'WORKSPACE';
        if (raw === 'PROJ') return 'PROJECT';
        return raw;
    }

    function applyPostFilters(posts) {
        const q = (el.postSearchInput && el.postSearchInput.value || '').trim().toLowerCase();
        const visibility = el.photoVisibilityFilter ? el.photoVisibilityFilter.value : 'ALL';
        let list = Array.isArray(posts) ? posts.slice() : [];

        if (q) {
            list = list.filter(p => [pick(p,'title','TITLE'), pick(p,'description','DESCRIPTION'), pick(p,'creatorName','CREATOR_NAME'), pick(p,'albumName','ALBUM_NAME')].join(' ').toLowerCase().includes(q));
        }
        if (state.activeTab !== 'trash' && visibility && visibility !== 'ALL') {
            list = list.filter(p => normalizeVisibility(pick(p, 'visibilityType', 'VISIBILITY_TYPE')) === visibility || (visibility === 'WORKSPACE' && normalizePostScope(p) === 'WORKSPACE') || (visibility === 'PROJECT' && normalizePostScope(p) === 'PROJECT'));
        }

        if (state.activeTab === 'moyo') {
            const friendId = state.activeMoyoFriendId || 'ALL';
            list = list.filter(p => isMoyoFeedPost(p));
            if (friendId === 'ME') list = list.filter(p => String(postOwnerId(p)) === String(currentUserId));
            else if (friendId && friendId !== 'ALL') list = list.filter(p => String(postOwnerId(p)) === String(friendId));
        } else if (state.activeTab === 'workspace') {
            list = list.filter(p => normalizePostScope(p) === 'WORKSPACE' || normalizeVisibility(pick(p, 'visibilityType', 'VISIBILITY_TYPE')) === 'WORKSPACE' || sharedTargetTypes(p).includes('WS'));
            if (state.selectedWorkspaceTargetId && state.selectedWorkspaceTargetId !== 'ALL') {
                list = list.filter(p => postScopeId(p) === String(state.selectedWorkspaceTargetId));
            }
        } else if (state.activeTab === 'project') {
            list = list.filter(p => normalizePostScope(p) === 'PROJECT' || normalizeVisibility(pick(p, 'visibilityType', 'VISIBILITY_TYPE')) === 'PROJECT' || sharedTargetTypes(p).includes('PROJ'));
            if (state.selectedProjectWorkspaceTargetId && state.selectedProjectWorkspaceTargetId !== 'ALL') {
                list = list.filter(p => projectWorkspaceId(postScopeId(p)) === String(state.selectedProjectWorkspaceTargetId));
            }
            if (state.selectedProjectTargetId && state.selectedProjectTargetId !== 'ALL') {
                list = list.filter(p => postScopeId(p) === String(state.selectedProjectTargetId));
            }
        } else if (state.activeTab === 'personal') {
            list = list.filter(p => isMyPrivatePost(p) || !normalizePostScope(p));
        } else if (state.activeTab === 'friend') {
            list = list.filter(p => isMyFriendSharedPost(p));
            if (state.selectedFriendTargetId && state.selectedFriendTargetId !== 'ALL') {
                const targetId = String(state.selectedFriendTargetId);
                list = list.filter(p => {
                    const ownerId = String(postOwnerId(p));
                    if (ownerId === targetId && isSharedToMe(p)) return true;
                    if (ownerId === String(currentUserId) && sharedTargetUserIds(p).includes(targetId)) return true;
                    return false;
                });
            }
        }

        if (state.likedOnly) {
            list = list.filter(p => Number(pick(p, 'likedByMe', 'LIKED_BY_ME') || 0) === 1);
        }

        if (['workspace', 'project'].includes(state.activeTab) && state.activeOwnerFilter === 'ME') {
            list = list.filter(p => String(postOwnerId(p)) === String(currentUserId));
        }

        if (['personal', 'workspace', 'project'].includes(state.activeTab) && state.activeAlbumFilter && state.activeAlbumFilter !== 'ALL') {
            if (state.activeAlbumFilter === 'NONE') {
                list = list.filter(p => !pick(p, 'albumId', 'ALBUM_ID'));
            } else {
                list = list.filter(p => Number(pick(p, 'albumId', 'ALBUM_ID') || 0) === Number(state.activeAlbumFilter));
            }
        }

        if (el.photoSortSelect && el.photoSortSelect.value === 'POPULAR') {
            list.sort((a, b) => Number(pick(b, 'likeCount', 'LIKE_COUNT') || 0) - Number(pick(a, 'likeCount', 'LIKE_COUNT') || 0));
        } else {
            list.sort((a, b) => {
                const bt = parseCreatedDate(pick(b, 'createdAt', 'CREATED_AT'))?.getTime() || 0;
                const at = parseCreatedDate(pick(a, 'createdAt', 'CREATED_AT'))?.getTime() || 0;
                return bt - at;
            });
        }
        return list;
    }

    function effectiveLayoutMode() {
        return state.activeTab === 'moyo' ? 'feed' : (state.activeTab === 'trash' ? 'grid' : (state.layoutMode === 'feed' ? 'feed' : 'grid'));
    }

    function updateLayoutMode() {
        const mode = effectiveLayoutMode();
        page.dataset.photoLayout = mode;
        document.body.dataset.photoLayout = mode;
        if (el.postGrid) el.postGrid.dataset.photoLayout = mode;
        if (el.albumPostGrid) el.albumPostGrid.dataset.photoLayout = mode;
        [el.photoGridModeButton, el.photoFeedModeButton].forEach(button => {
            if (!button) return;
            const active = button.dataset.photoLayout === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }


    function photoCountLabel(count) {
        const n = Number(count || 0);
        const suffix = state.likedOnly ? '좋아요 사진' : '사진';
        if (state.activeTab === 'friend') return `친구 ${suffix} ${n}개`;
        if (state.activeTab === 'workspace') return `그룹 ${suffix} ${n}개`;
        if (state.activeTab === 'project') return `프로젝트 ${suffix} ${n}개`;
        if (state.activeTab === 'trash') return `휴지통 사진 ${n}개`;
        if (state.activeTab === 'moyo') return state.likedOnly ? `MOYO 좋아요 사진 ${n}개` : `사진 ${n}개`;
        return `${suffix} ${n}개`;
    }

    function setLayoutMode(mode, persist) {
        state.layoutMode = mode === 'feed' ? 'feed' : 'grid';
        if (persist) localStorage.setItem('moyoPhotoLayoutMode', state.layoutMode);
        updateLayoutMode();
        refreshPosts();
    }

    function refreshPosts() {
        updateLayoutMode();
        renderPosts(applyPostFilters(state.posts), el.postGrid, !!(el.postSearchInput && el.postSearchInput.value.trim()));
    }

    function updateScopeGuide() {
        document.body.dataset.photoTab = state.activeTab;
        page.dataset.photoTab = state.activeTab;
        document.body.dataset.photoLikedOnly = state.likedOnly ? 'true' : 'false';
        page.dataset.photoLikedOnly = state.likedOnly ? 'true' : 'false';
        if (el.likeFilterButton) {
            el.likeFilterButton.classList.toggle('is-filter-active', !!state.likedOnly);
            el.likeFilterButton.setAttribute('aria-pressed', String(!!state.likedOnly));
            const icon = el.likeFilterButton.querySelector('i');
            if (icon) icon.className = `${state.likedOnly ? 'fa-solid' : 'fa-regular'} fa-heart`;
        }
        const moyoMode = state.activeTab === 'moyo';
        updateHero();
        renderTargetPanels();
        const albumMode = ['personal', 'workspace', 'project'].includes(state.activeTab);
        if (el.photoAlbumStrip) el.photoAlbumStrip.hidden = !albumMode;
        if (!albumMode) state.activeAlbumFilter = 'ALL';
        renderAlbumChips();
        if (el.photoMoyoIntro) el.photoMoyoIntro.hidden = true;
        const toolbar = document.querySelector('.photo-main-toolbar');
        if (toolbar) toolbar.dataset.toolbarMode = moyoMode ? 'moyo' : 'manage';
        if (el.photoFriendChips) el.photoFriendChips.hidden = !moyoMode;
        if (el.moyoMyFeedButton) el.moyoMyFeedButton.hidden = !moyoMode;
        if (el.openMoyoFriendPickerButton) el.openMoyoFriendPickerButton.hidden = !moyoMode;
        if (el.postCountText) {
            el.postCountText.hidden = moyoMode;
            if (moyoMode) el.postCountText.textContent = '';
        }
        if (el.photoVisibilityFilter) {
            const targetTab = ['friend', 'workspace', 'project', 'trash'].includes(state.activeTab);
            el.photoVisibilityFilter.hidden = targetTab;
            const optionText = {
                recent: { ALL: '전체 범위', PRIVATE: '내 사진', FRIENDS: 'MOYO 공개', SELECTED: '친구 공유', WORKSPACE: '그룹 사진', PROJECT: '프로젝트 사진' },
                personal: { ALL: '전체 상태', PRIVATE: '나만 보기', FRIENDS: 'MOYO 공개', SELECTED: '선택 공유', WORKSPACE: '그룹 공개', PROJECT: '프로젝트 공개' },
                trash: { ALL: '전체', PRIVATE: '나만 보기', FRIENDS: 'MOYO 공개', SELECTED: '선택 공유', WORKSPACE: '그룹 사진', PROJECT: '프로젝트 사진' }
            }[state.activeTab] || { ALL: '전체 상태', PRIVATE: '나만 보기', FRIENDS: 'MOYO 공개', SELECTED: '선택 공유', WORKSPACE: '그룹 공개', PROJECT: '프로젝트 공개' };
            Array.from(el.photoVisibilityFilter.options).forEach(option => {
                const value = option.value;
                option.textContent = optionText[value] || option.textContent;
                option.hidden = targetTab || (state.activeTab === 'moyo');
            });
            if (targetTab || state.activeTab === 'moyo') el.photoVisibilityFilter.value = 'ALL';
            if (el.photoVisibilityFilter.selectedOptions[0] && el.photoVisibilityFilter.selectedOptions[0].hidden) el.photoVisibilityFilter.value = 'ALL';
        }
        if (el.photoOwnerFilter) {
            const showOwnerFilter = ['workspace', 'project'].includes(state.activeTab);
            el.photoOwnerFilter.hidden = !showOwnerFilter;
            if (!showOwnerFilter) {
                state.activeOwnerFilter = 'ALL';
                el.photoOwnerFilter.value = 'ALL';
            } else {
                el.photoOwnerFilter.value = state.activeOwnerFilter || 'ALL';
            }
        }
    }

    function resolveAssetPath(path) {
        const value = String(path || '').trim();
        if (!value) return '';
        if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/')) return value;
        return `${contextPath}/${value.replace(/^\/+/, '')}`;
    }

    function profileImageOf(post) {
        return pick(post,
            'creatorProfileImagePath', 'CREATOR_PROFILE_IMAGE_PATH',
            'creatorProfileImage', 'CREATOR_PROFILE_IMAGE',
            'profileImagePath', 'PROFILE_IMAGE_PATH',
            'profilePath', 'PROFILE_PATH'
        );
    }

    function avatarMarkup(name, imagePath) {
        const src = resolveAssetPath(imagePath);
        const initial = String(name || '?').trim().charAt(0) || '?';
        if (src) return `<span class="post-author-avatar has-image"><img src="${esc(src)}" alt="${esc(name || '프로필')}" loading="lazy" onerror="this.closest('.post-author-avatar').classList.remove('has-image');this.remove();"></span>`;
        return `<span class="post-author-avatar">${esc(initial)}</span>`;
    }

    function scopeLabel(post) {
        const postScope = normalizePostScope(post);
        const scopeName = pick(post, 'scopeName', 'SCOPE_NAME', 'workspaceName', 'WS_NAME', 'projectName', 'PROJ_NAME');
        if (postScope === 'WORKSPACE') return scopeName || '그룹 사진';
        if (postScope === 'PROJECT') return scopeName || '프로젝트 사진';
        if (state.activeTab === 'moyo') return visibilityLabel(post);
        return '개인 사진';
    }

    function postCardType(post) {
        const canManage = canManagePost(post);
        if (state.activeTab === 'moyo') return 'feed';
        if (normalizePostScope(post) === 'WORKSPACE' || normalizePostScope(post) === 'PROJECT') return 'space';
        return canManage ? 'manage' : 'feed';
    }

    function photoGridSourceMeta(post) {
        const postScope = normalizePostScope(post);
        if (postScope === 'WORKSPACE') return { key: 'workspace', label: '그룹', icon: 'fa-regular fa-building' };
        if (postScope === 'PROJECT') return { key: 'project', label: '프로젝트', icon: 'fa-regular fa-folder' };
        if (isSharedToMe(post) || isSharedByMeToFriend(post) || normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE')) === 'SELECTED') {
            return { key: 'friend', label: '친구', icon: 'fa-regular fa-face-smile' };
        }
        return { key: 'personal', label: '개인', icon: 'fa-regular fa-user' };
    }

    function photoGridSourceChipMarkup(post) {
        const source = photoGridSourceMeta(post);
        return `<span class="post-grid-source-chip post-grid-source-chip--${source.key}"><i class="${source.icon}"></i><span>${esc(source.label)}</span></span>`;
    }


    function photoGridScopeName(post) {
        const postScope = normalizePostScope(post);
        if (postScope !== 'WORKSPACE' && postScope !== 'PROJECT') return '';

        const explicitScopeName = pick(post, 'scopeName', 'SCOPE_NAME');
        const workspaceName = pick(post,
            'workspaceName', 'WORKSPACE_NAME', 'wsName', 'WS_NAME',
            'groupName', 'GROUP_NAME', 'spaceName', 'SPACE_NAME'
        );
        const projectName = pick(post,
            'projectName', 'PROJECT_NAME', 'projName', 'PROJ_NAME'
        );

        if (postScope === 'WORKSPACE') {
            const id = postScopeId(post);
            const target = collectWorkspaceTargets().find(item => String(item.id) === String(id));
            return explicitScopeName || workspaceName || (target && target.name) || '그룹';
        }

        const projectId = postScopeId(post);
        const targetProject = collectProjectTargets().find(item => String(item.id) === String(projectId));
        const resolvedProjectName = projectName || explicitScopeName || (targetProject && targetProject.name) || '프로젝트';
        const resolvedWorkspaceName = workspaceName || (targetProject && targetProject.wsName) || '';
        return resolvedWorkspaceName ? `${resolvedWorkspaceName} · ${resolvedProjectName}` : resolvedProjectName;
    }


    function isUnclassifiedAlbumName(name) {
        const text = String(name || '').trim();
        return !text || text === '미분류' || text === '미분류 앨범' || /^unclassified$/i.test(text);
    }

    function workspaceInfoForPost(post) {
        const postScope = normalizePostScope(post);
        const projectId = postScope === 'PROJECT' ? postScopeId(post) : '';
        const targetProject = projectId ? collectProjectTargets().find(item => String(item.id) === String(projectId)) : null;
        const explicitWsId = pick(post,
            'workspaceId', 'WORKSPACE_ID', 'wsId', 'WS_ID',
            'groupId', 'GROUP_ID', 'spaceId', 'SPACE_ID'
        );
        const wsId = String(explicitWsId || (targetProject && targetProject.wsId) || (postScope === 'WORKSPACE' ? postScopeId(post) : '') || '').trim();
        const targetWorkspace = wsId ? collectWorkspaceTargets().find(item => String(item.id) === String(wsId)) : null;
        const name = String(pick(post,
            'workspaceName', 'WORKSPACE_NAME', 'wsName', 'WS_NAME',
            'groupName', 'GROUP_NAME', 'spaceName', 'SPACE_NAME'
        ) || (targetProject && targetProject.wsName) || (targetWorkspace && targetWorkspace.name) || '').trim();
        const image = String(pick(post,
            'workspaceImagePath', 'WORKSPACE_IMAGE_PATH', 'wsImagePath', 'WS_IMAGE_PATH',
            'workspaceProfileImagePath', 'WORKSPACE_PROFILE_IMAGE_PATH',
            'groupImagePath', 'GROUP_IMAGE_PATH', 'groupProfileImagePath', 'GROUP_PROFILE_IMAGE_PATH'
        ) || (targetWorkspace && targetWorkspace.image) || '').trim();
        return { id: wsId, name: name || '그룹', image };
    }

    function projectInfoForPost(post) {
        const projectId = normalizePostScope(post) === 'PROJECT' ? postScopeId(post) : '';
        const targetProject = projectId ? collectProjectTargets().find(item => String(item.id) === String(projectId)) : null;
        const name = String(pick(post,
            'projectName', 'PROJECT_NAME', 'projName', 'PROJ_NAME'
        ) || (targetProject && targetProject.name) || pick(post, 'scopeName', 'SCOPE_NAME') || '').trim();
        return { id: projectId, name: name || '프로젝트' };
    }

    function runtimeScopeAvatarMarkup(info, fallbackIcon) {
        const name = String(info && info.name || '').trim();
        const initial = esc(targetInitial(name));
        const src = resolveAssetPath(info && info.image);
        if (src) return `<span class="photo-runtime-scope-avatar has-image"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.closest('.photo-runtime-scope-avatar').classList.remove('has-image');this.remove();"><span>${initial}</span></span>`;
        if (fallbackIcon) return `<span class="photo-runtime-scope-avatar"><i class="${esc(fallbackIcon)}"></i><span>${initial}</span></span>`;
        return `<span class="photo-runtime-scope-avatar"><span>${initial}</span></span>`;
    }

    function runtimeDetailScopeTagMarkup(post) {
        const postScope = normalizePostScope(post);
        if (postScope !== 'WORKSPACE' && postScope !== 'PROJECT') return '';
        const workspace = workspaceInfoForPost(post);
        const tags = [];
        tags.push(`<span class="photo-runtime-scope-tag photo-runtime-scope-tag--workspace" title="${esc(workspace.name)}">${runtimeScopeAvatarMarkup(workspace, 'fa-solid fa-layer-group')}<span>${esc(workspace.name)}</span></span>`);
        if (postScope === 'PROJECT') {
            const project = projectInfoForPost(post);
            tags.push(`<span class="photo-runtime-scope-tag photo-runtime-scope-tag--project" title="${esc(project.name)}"><i class="fa-solid fa-diagram-project"></i><span>${esc(project.name)}</span></span>`);
        }
        return tags.join('');
    }

    function photoGridSharedBadgeMarkup(post) {
        const source = photoGridSourceMeta(post);
        const shared = isSharedToMe(post) || isSharedByMeToFriend(post) || !!sharedTargetTypes(post) || isMoyoPublicPost(post);
        if (shared) {
            return `<span class="post-photo-status-badge post-photo-status-badge--shared"><i class="fa-regular fa-paper-plane"></i><span>공유됨</span></span>`;
        }
        if (source.key === 'personal') {
            return `<span class="post-photo-status-badge post-photo-status-badge--unshared"><i class="fa-regular fa-eye-slash"></i><span>공유 없음</span></span>`;
        }
        return '';
    }

    function photoGridCollectedBadgeMarkup(post) {
        if (!isCollectedPost(post)) return '';
        return `<span class="post-photo-status-badge post-photo-status-badge--collected" title="담아온 사진" aria-label="담아온 사진"><i class="fa-solid fa-bookmark"></i><span>담아옴</span></span>`;
    }


    function sameManageScope(post) {
        const postScope = normalizePostScope(post);
        if (postScope === 'PERSONAL') return false;
        if (postScope !== scopeType) return false;
        const postScopeId = Number(pick(post,
            'scopeId', 'SCOPE_ID',
            'wsId', 'WS_ID', 'workspaceId', 'WORKSPACE_ID',
            'projId', 'PROJ_ID', 'projectId', 'PROJECT_ID'
        ) || 0);
        return !postScopeId || postScopeId === scopeId;
    }

    function canManagePost(post) {
        if (isPostOwner(post)) return true;
        return !!isAdmin && sameManageScope(post);
    }

    function currentTabSupportsAlbumMove() {
        return ['personal', 'workspace', 'project'].includes(state.activeTab);
    }

    function postAlbumScopeType(post) {
        const type = normalizePostScope(post);
        return ['PERSONAL', 'WORKSPACE', 'PROJECT'].includes(type) ? type : '';
    }

    function postAlbumScopeIdNumber(post) {
        const id = Number(postScopeId(post) || 0);
        if (id) return id;
        if (postAlbumScopeType(post) === 'PERSONAL') return postOwnerId(post) || currentUserId;
        return 0;
    }

    function albumScopeType(album) {
        const raw = String(pick(album, 'scopeType', 'SCOPE_TYPE') || '').toUpperCase();
        if (raw === 'WS') return 'WORKSPACE';
        if (raw === 'PROJ') return 'PROJECT';
        return raw;
    }

    function albumScopeIdNumber(album) {
        return Number(pick(album, 'scopeId', 'SCOPE_ID', 'wsId', 'WS_ID', 'workspaceId', 'WORKSPACE_ID', 'projId', 'PROJ_ID', 'projectId', 'PROJECT_ID') || 0);
    }

    function albumBelongsToActivePostScope(album, post = state.activePost) {
        if (!album || !post) return false;
        const targetType = postAlbumScopeType(post);
        const targetId = postAlbumScopeIdNumber(post);
        return !!targetType && !!targetId && albumScopeType(album) === targetType && albumScopeIdNumber(album) === targetId;
    }

    function moveAlbumsForPost(post = state.activePost) {
        if (!post) return [];
        return (state.albums || []).filter(album => albumBelongsToActivePostScope(album, post));
    }

    function canMovePostAlbum(post) {
        if (!post || !canManagePost(post) || !currentTabSupportsAlbumMove()) return false;
        const targetType = postAlbumScopeType(post);
        const targetId = postAlbumScopeIdNumber(post);
        return !!targetType && !!targetId;
    }

    function isPostOwner(post) {
        return postOwnerId(post) === currentUserId;
    }

    function isMoyoFeedShareablePost(post) {
        const visibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        // v243: PERSONAL + MOYO 공개 피드는 원본 게시물 보내기 허용.
        // FRIENDS는 사진첩 내부 라벨상 'MOYO 공개'로 사용 중이므로 피드 공유 대상에 포함한다.
        // 단, 그룹/프로젝트 맥락 콘텐츠와 직접 공유받은 콘텐츠는 재공유하지 않는다.
        return normalizePostScope(post) === 'PERSONAL'
            && ['FRIENDS', 'PUBLIC', 'MOYO', 'GLOBAL'].includes(visibility)
            && !isSharedToMe(post);
    }

    function shareModeForPost(post) {
        return isPostOwner(post) ? 'PERMISSION' : 'FEED';
    }

    function canSharePost(post) {
        if (isPostOwner(post)) return true;
        return ['moyo', 'friend'].includes(state.activeTab) && isMoyoFeedShareablePost(post);
    }

    function isCollectedPost(post) {
        return Number(pick(post, 'collectedByMe', 'COLLECTED_BY_ME') || 0) === 1;
    }

    function collectedSourcePostId(post) {
        return Number(pick(post, 'collectedSourcePostId', 'COLLECTED_SOURCE_POST_ID') || 0);
    }

    function canCollectPost(post) {
        const id = Number(pick(post, 'postId', 'POST_ID'));
        const ownerId = postOwnerId(post);
        return !!id && !!ownerId && Number(ownerId) !== Number(currentUserId) && !isCollectedCopyPost(post);
    }

    function collectActionMarkup(post) {
        const id = Number(pick(post, 'postId', 'POST_ID'));
        if (!id) return '';

        // 내가 담아온 복사본: 북마크를 항상 표시하고 원본자 표기와 같은 조건으로 움직인다.
        if (isCollectedCopyPost(post)) {
            return `<button type="button" class="post-collect-button is-collected is-collected-copy" data-collect-post-id="${id}" aria-label="담아가기 취소" title="담아가기 취소"><i class="fa-solid fa-bookmark"></i></button>`;
        }

        // 원본 게시글은 이미 담아온 상태라면 북마크를 숨긴다. 복사본 쪽에만 담아온 표시가 남아야 헷갈리지 않는다.
        if (!canCollectPost(post) || isCollectedPost(post)) return '';

        return `<button type="button" class="post-collect-button" data-collect-post-id="${id}" aria-label="담아가기" title="담아가기"><i class="fa-regular fa-bookmark"></i></button>`;
    }

    function markPostCollected(postId) {
        const targetId = Number(postId);
        if (!targetId) return;
        const apply = (post) => {
            if (!post || Number(pick(post, 'postId', 'POST_ID')) !== targetId) return;
            post.collectedByMe = 1;
            post.COLLECTED_BY_ME = 1;
        };
        state.posts.forEach(apply);
        state.albumPosts.forEach(apply);
        if (state.activePost) apply(state.activePost);
    }

    function markPostUncollected(postId) {
        const targetId = Number(postId);
        if (!targetId) return;
        const apply = (post) => {
            if (!post || Number(pick(post, 'postId', 'POST_ID')) !== targetId) return;
            post.collectedByMe = 0;
            post.COLLECTED_BY_ME = 0;
        };
        state.posts.forEach(apply);
        state.albumPosts.forEach(apply);
        if (state.activePost) apply(state.activePost);
    }

    function canOpenSharePanel(post) {
        return canSharePost(post) || canReleaseReceivedShare(post);
    }

    function canTogglePostVisibility(post) {
        return normalizePostScope(post) === 'PERSONAL' && postOwnerId(post) === currentUserId;
    }


    function isTrashPost(post) {
        if (!post) return state.activeTab === 'trash';
        const rawStatus = String(pick(post, 'postStatus', 'POST_STATUS', 'status', 'STATUS', 'deleteStatus', 'DELETE_STATUS', 'trashStatus', 'TRASH_STATUS') || '').toUpperCase();
        const trashedFlag = Number(pick(post, 'trashed', 'TRASHED', 'isTrashed', 'IS_TRASHED', 'deletedYn', 'DELETED_YN') || 0) === 1;
        const deletedYn = String(pick(post, 'deletedYn', 'DELETED_YN', 'isDeleted', 'IS_DELETED') || '').toUpperCase() === 'Y';
        const hasTrashedAt = !!pick(post, 'trashedAt', 'TRASHED_AT', 'deletedAt', 'DELETED_AT');
        return state.activeTab === 'trash' || rawStatus === 'TRASHED' || rawStatus === 'TRASH' || trashedFlag || deletedYn || hasTrashedAt;
    }

    function postListMenuMarkup(post) {
        const id = Number(pick(post, 'postId', 'POST_ID'));
        const canManage = canManagePost(post);
        const trashMode = isTrashPost(post);
        if (trashMode) {
            if (!id || !canManage) return '<span class="post-list-menu-placeholder" aria-hidden="true"></span>';
            return `<div class="post-list-menu-wrap post-list-menu-wrap--trash">
            <button type="button" class="post-list-menu-button" data-post-menu-toggle="${id}" aria-label="휴지통 사진 관리 메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis"></i></button>
            <div class="post-list-menu" data-post-menu="${id}" hidden>
                <button type="button" data-post-menu-action="restore" data-post-id="${id}"><i class="fa-solid fa-rotate-left"></i><span>복원</span></button>
                <button type="button" class="danger" data-post-menu-action="permanent" data-post-id="${id}"><i class="fa-regular fa-trash-can"></i><span>영구 삭제</span></button>
            </div>
        </div>`;
        }
        const canMoveAlbum = canMovePostAlbum(post);
        const canToggleVisibility = canTogglePostVisibility(post);
        if (!id || (!canManage && !canMoveAlbum && !canToggleVisibility)) return '<span class="post-list-menu-placeholder" aria-hidden="true"></span>';
        const currentVisibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        const isPublic = currentVisibility === 'FRIENDS';
        const visibilityText = isPublic ? '비공개 전환' : 'MOYO 공개';
        const visibilityIcon = isPublic ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
        return `<div class="post-list-menu-wrap">
            <button type="button" class="post-list-menu-button" data-post-menu-toggle="${id}" aria-label="사진 관리 메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis"></i></button>
            <div class="post-list-menu" data-post-menu="${id}" hidden>
                ${canToggleVisibility ? `<button type="button" data-post-menu-action="visibility" data-post-id="${id}"><i class="${visibilityIcon}"></i><span>${visibilityText}</span></button>` : ''}
                ${canManage ? `<button type="button" data-post-menu-action="edit" data-post-id="${id}"><i class="fa-regular fa-pen-to-square"></i><span>수정</span></button>` : ''}
                ${canMoveAlbum ? `<button type="button" data-post-menu-action="move" data-post-id="${id}"><i class="fa-regular fa-folder-open"></i><span>앨범 이동</span></button>` : ''}
                ${canManage ? `<button type="button" class="danger" data-post-menu-action="delete" data-post-id="${id}"><i class="fa-regular fa-trash-can"></i><span>휴지통으로 이동</span></button>` : ''}
            </div>
        </div>`;
    }

    function postCardMarkup(post) {
        const id = Number(pick(post, 'postId', 'POST_ID'));
        const cover = pick(post, 'coverPath', 'COVER_PATH');
        const count = Number(pick(post, 'photoCount', 'PHOTO_COUNT') || 0);
        const desc = pick(post, 'description', 'DESCRIPTION');
        const creator = pick(post, 'creatorName', 'CREATOR_NAME') || '작성자';
        const liked = Number(pick(post, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(post, 'likeCount', 'LIKE_COUNT') || 0);
        const commentCount = Number(pick(post, 'commentCount', 'COMMENT_COUNT') || 0);
        const type = postCardType(post);
        const source = photoGridSourceMeta(post);
        const altText = desc || `${source.label} 사진`;
        const menuMarkup = postListMenuMarkup(post);
        const recentSourceMarkup = state.activeTab === 'recent' ? photoGridSourceChipMarkup(post) : '';
        const countMarkup = count > 1 ? `<span class="post-count"><i class="fa-regular fa-images"></i> ${count}</span>` : '';
        const moyoMarkup = isMoyoPublicPost(post)
            ? `<span class="post-grid-moyo-chip" title="MOYO 공개" aria-label="MOYO 공개"><img src="${esc(moyoMascotPath())}" alt=""></span>`
            : '';
        const created = pick(post, 'createdAt', 'CREATED_AT') || '';
        const sourceName = collectedSourceName(post);
        const displayCreator = isCollectedCopyPost(post) ? (currentUserName || pick(post, 'collectorName', 'COLLECTOR_NAME', 'savedByName', 'SAVED_BY_NAME') || creator) : creator;
        const originMarkup = isCollectedCopyPost(post)
            ? `<span class="post-photo-origin">${esc(sourceName ? `원본 ${sourceName}` : '원본 사진')}</span>`
            : '';
        const canShare = canOpenSharePanel(post);
        const shareTitle = canSharePost(post) ? '공유' : '공유 관리';
        const shareActionMarkup = canShare ? `<button type="button" class="post-share-button" data-share-post-id="${id}" aria-label="${esc(shareTitle)}" title="${esc(shareTitle)}"><i class="fa-regular fa-paper-plane"></i></button>` : '';
        const collectAction = collectActionMarkup(post);
        return `<article class="post-card post-card--${type} post-card--layout-grid post-card--photo-only post-photo-source--${source.key}${isMoyoPublicPost(post) ? ' is-moyo-public' : ''}${isCollectedPost(post) ? ' is-collected-post' : ''}${isCollectedCopyPost(post) ? ' is-collected-copy-post' : ''}${state.activeTab === 'trash' ? ' is-trash-post' : ''}" data-post-id="${id}" tabindex="0" aria-label="${esc(`${displayCreator}님의 ${source.label} 사진`)}">
            <div class="post-cover post-photo-cover">
                <img src="${esc(cover)}" alt="${esc(altText)}" loading="lazy">
                <div class="post-photo-top">
                    <span class="post-photo-top-left${recentSourceMarkup ? ' has-source-chip' : ''}${countMarkup ? ' has-count-chip' : ''}">${recentSourceMarkup}${countMarkup}</span>
                    <span class="post-photo-top-right">${menuMarkup}</span>
                </div>
                <div class="post-photo-hover">
                    <div class="post-photo-hover-main">
                        <div class="post-photo-hover-meta">
                            <span class="post-photo-name-line"><strong>${esc(displayCreator)}</strong>${photoGridScopeName(post) ? `<span class="post-photo-scope-name">${esc(photoGridScopeName(post))}</span>` : ''}</span>
                            <span class="post-photo-date-origin"><span class="post-photo-date">${esc(created)}</span>${originMarkup}</span>
                        </div>
                        <div class="post-photo-hover-actions" aria-label="사진 반응과 작업">
                            <button type="button" class="post-like-button${liked ? ' liked' : ''}" data-like-post-id="${id}" aria-pressed="${liked}" aria-label="좋아요"><i class="${liked ? 'fa-solid' : 'fa-regular'} fa-heart"></i><span>${likeCount}</span></button>
                            <span class="post-comment-count" aria-label="댓글 ${commentCount}개"><i class="fa-regular fa-comment"></i><span>${commentCount}</span></span>
                            ${shareActionMarkup}
                            ${collectAction}
                        </div>
                    </div>
                </div>
                ${moyoMarkup ? `<span class="post-photo-bottom-moyo post-photo-bottom-moyo--always">${moyoMarkup}</span>` : ''}
            </div>
        </article>`;
    }



    function moyoFeedReactionMarkup(post) {
        const id = Number(pick(post, 'postId', 'POST_ID'));
        const liked = Number(pick(post, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(post, 'likeCount', 'LIKE_COUNT') || 0);
        const commentCount = Number(pick(post, 'commentCount', 'COMMENT_COUNT') || 0);
        const canShare = canOpenSharePanel(post);
        const shareTitle = canSharePost(post) ? '공유' : '공유 관리';
        const shareMarkup = canShare ? `<button type="button" class="post-share-button" data-share-post-id="${id}" aria-label="${esc(shareTitle)}" title="${esc(shareTitle)}"><i class="fa-regular fa-paper-plane"></i></button>` : '';
        const collectMarkup = collectActionMarkup(post);
        return `<span class="post-reactions"><span class="post-reactions-left"><button type="button" class="post-like-button${liked ? ' liked' : ''}" data-like-post-id="${id}" aria-pressed="${liked}" aria-label="좋아요"><i class="${liked ? 'fa-solid' : 'fa-regular'} fa-heart"></i><span>${likeCount}</span></button><span class="post-comment-count" aria-label="댓글 ${commentCount}개"><i class="fa-regular fa-comment"></i>${commentCount}</span>${shareMarkup}${collectMarkup}</span></span>`;
    }

    function moyoFeedCardMarkup(post) {
        const id = Number(pick(post, 'postId', 'POST_ID'));
        const cover = pick(post, 'coverPath', 'COVER_PATH');
        const count = Number(pick(post, 'photoCount', 'PHOTO_COUNT') || 0);
        const desc = (pick(post, 'description', 'DESCRIPTION') || '').trim().replace(/\s+/g, ' ');
        const creator = pick(post, 'creatorName', 'CREATOR_NAME') || '작성자';
        const descLimit = 116;
        const hasLongDesc = desc.length > descLimit;
        const displayDesc = hasLongDesc ? desc.slice(0, descLimit).trimEnd() : desc;
        const descMarkup = desc ? `<div class="moyo-feed-desc-wrap"><p class="moyo-feed-desc"><strong class="moyo-feed-caption-author">${esc(creator)}</strong> ${esc(displayDesc)}${hasLongDesc ? '…' : ''}${hasLongDesc ? ` <button type="button" class="moyo-feed-more" data-open-post-detail="${id}">더보기</button>` : ''}</p></div>` : '';
        const created = pick(post, 'createdAt', 'CREATED_AT') || '';
        const sourceMeta = collectedSourceBadgeMarkup(post, 'feed-head');
        // 개인/친구/그룹/프로젝트 라벨은 최근 탭에서 피드형으로 볼 때만 표시한다.
        // MOYO 탭에서는 이미 피드 맥락이 명확하므로 프로필 라인을 라벨로 복잡하게 만들지 않는다.
        const sourceChip = state.activeTab === 'recent' ? photoGridSourceChipMarkup(post) : '';
        const altText = desc || 'MOYO 공개 사진';
        const moyoLogo = moyoMascotPath();
        const moyoMascot = isMoyoPublicPost(post) ? `<span class="post-moyo-mascot" title="MOYO 공개"><img src="${esc(moyoLogo)}" alt="MOYO"></span>` : '';
        return `<article class="post-card post-card--friend-feed post-card--layout-feed moyo-feed-card moyo-feed-card--clean${desc ? ' has-desc' : ' no-desc'}${hasLongDesc ? ' has-long-desc' : ''}" data-post-id="${id}" tabindex="0">
            <div class="post-card-head post-friend-head moyo-feed-head">
                <div class="post-author-line">${avatarMarkup(creator, profileImageOf(post))}<span><strong>${esc(creator)}</strong><small>${esc(created)}${sourceChip}</small></span></div>
                <div class="post-card-head-actions">${sourceMeta}${postListMenuMarkup(post)}</div>
            </div>
            <div class="moyo-feed-media"><img src="${esc(cover)}" alt="${esc(altText)}" loading="lazy">${count > 1 ? `<span class="post-count"><i class="fa-regular fa-images"></i> ${count}</span>` : ''}</div>
            <div class="moyo-feed-bottom">
                <div class="moyo-feed-action-row"><div class="moyo-feed-actions">${moyoFeedReactionMarkup(post)}</div>${moyoMascot ? `<div class="moyo-feed-mascot-slot">${moyoMascot}</div>` : '<div class="moyo-feed-mascot-slot" aria-hidden="true"></div>'}</div>
                ${descMarkup}
            </div>
        </article>`;
    }

    function moyoFeedEmptyMarkup(isSearch) {
        if (isSearch) {
            return '<div class="photo-empty photo-search-empty"><i class="fa-solid fa-magnifying-glass"></i><h3>검색 결과가 없습니다.</h3><p>다른 제목이나 설명으로 다시 검색해보세요.</p></div>';
        }
        const selectedFriendId = state.activeMoyoFriendId && state.activeMoyoFriendId !== 'ALL' && state.activeMoyoFriendId !== 'ME' ? String(state.activeMoyoFriendId) : '';
        if (selectedFriendId) {
            const friendName = state.activeMoyoFriend && state.activeMoyoFriend.name ? state.activeMoyoFriend.name : '선택한 친구';
            return `<div class="photo-empty photo-moyo-empty photo-moyo-empty--friend"><span class="photo-empty-moyo-logo">MOYO</span><h3>${esc(friendName)}님의 MOYO 피드에 사진이 없습니다.</h3><p>다른 친구를 선택하거나 최근 피드로 돌아가보세요.</p><div class="photo-empty-actions"><button class="photo-primary-button photo-primary-button--ghost" data-moyo-friend="ALL">최근 보기</button><button class="photo-primary-button" data-action="open-moyo-friend-picker">친구 선택</button></div></div>`;
        }
        return '<div class="photo-empty photo-moyo-empty"><span class="photo-empty-moyo-logo">MOYO</span><h3>아직 MOYO 피드에 사진이 없습니다.</h3><p>사진을 올릴 때 MOYO 공개를 체크하면 내 MOYO 피드와 친구들의 피드에 함께 표시됩니다.</p><button class="photo-primary-button" data-action="open-post">MOYO 공개</button></div>';
    }

    function trashPostIds() {
        if (state.activeTab !== 'trash') return [];
        return (Array.isArray(state.posts) ? state.posts : [])
            .map(post => Number(pick(post, 'postId', 'POST_ID')))
            .filter(id => Number.isFinite(id) && id > 0);
    }

    function syncTrashBulkActions() {
        const ids = trashPostIds();
        const show = state.activeTab === 'trash' && ids.length > 0;
        if (el.photoTrashBulkActions) el.photoTrashBulkActions.hidden = !show;
        if (el.restoreAllTrashButton) {
            el.restoreAllTrashButton.disabled = !show;
            el.restoreAllTrashButton.innerHTML = '<i class="fa-solid fa-rotate-left"></i> 전체 복원';
        }
        if (el.permanentlyDeleteAllTrashButton) {
            el.permanentlyDeleteAllTrashButton.disabled = !show;
            el.permanentlyDeleteAllTrashButton.innerHTML = '<i class="fa-regular fa-trash-can"></i> 전체 영구 삭제';
        }
    }

    function renderPosts(posts, target, isSearch) {
        const list = Array.isArray(posts) ? posts : [];
        if (!target) return;
        if (target === el.postGrid) {
            syncFriendFilter(state.posts);
            const useFeedView = effectiveLayoutMode() === 'feed';
            if (state.activeTab === 'moyo') {
                if (el.postCountText) { el.postCountText.hidden = true; el.postCountText.textContent = ''; }
                if (!list.length) {
                    setHTML(target, moyoFeedEmptyMarkup(!!isSearch));
                    return;
                }
                const grouped = new Map();
                list.forEach(post => {
                    const group = monthGroup(post);
                    if (!grouped.has(group.key)) grouped.set(group.key, { label: group.label, posts: [] });
                    grouped.get(group.key).posts.push(post);
                });
                setHTML(target, Array.from(grouped.values()).map(group => `
                    <section class="photo-month-group moyo-feed-month-group">
                        <div class="photo-month-heading"><h3>${esc(group.label)}</h3><span>${group.posts.length}개 사진</span></div>
                        <div class="photo-month-grid moyo-feed-grid">${group.posts.map(moyoFeedCardMarkup).join('')}</div>
                    </section>
                `).join(''));
                return;
            }
            setText(el.postCountText, photoCountLabel(list.length));
            if (useFeedView && list.length) {
                const grouped = new Map();
                list.forEach(post => {
                    const group = monthGroup(post);
                    if (!grouped.has(group.key)) grouped.set(group.key, { label: group.label, posts: [] });
                    grouped.get(group.key).posts.push(post);
                });
                setHTML(target, Array.from(grouped.values()).map(group => `
                    <section class="photo-month-group moyo-feed-month-group photo-feed-reuse-moyo" data-photo-tab="moyo">
                        <div class="photo-month-heading"><h3>${esc(group.label)}</h3></div>
                        <div class="photo-month-grid moyo-feed-grid">${group.posts.map(moyoFeedCardMarkup).join('')}</div>
                    </section>
                `).join(''));
                return;
            }
        }
        if (!list.length) {
            const empty = tabEmptyMessage(state.activeTab);
            setHTML(target, isSearch
                ? '<div class="photo-empty photo-search-empty"><i class="fa-solid fa-magnifying-glass"></i><h3>검색 결과가 없습니다.</h3><p>다른 제목이나 설명으로 다시 검색해보세요.</p></div>'
                : `<div class="photo-empty"><i class="${state.activeTab === 'trash' ? 'fa-regular fa-trash-can' : 'fa-regular fa-images'}"></i><h3>${esc(empty.title)}</h3><p>${esc(empty.message)}</p>${state.activeTab === 'trash' ? '' : '<button class="photo-primary-button" data-action="open-post">첫 사진 올리기</button>'}</div>`);
            return;
        }

        const grouped = new Map();
        list.forEach(post => {
            const group = monthGroup(post);
            if (!grouped.has(group.key)) grouped.set(group.key, { label: group.label, posts: [] });
            grouped.get(group.key).posts.push(post);
        });

        setHTML(target, Array.from(grouped.values()).map(group => `
            <section class="photo-month-group">
                <div class="photo-month-heading"><h3>${esc(group.label)}</h3><span>${group.posts.length}개 사진</span></div>
                <div class="photo-month-grid">${group.posts.map(postCardMarkup).join('')}</div>
            </section>
        `).join(''));
    }


    function renderAlbumChips() {
        if (!el.photoAlbumChipList || !el.photoAlbumChips) return;
        const current = String(state.activeAlbumFilter || 'ALL');
        setHTML(el.photoAlbumChipList, state.albums.map(album => {
            const id = Number(pick(album, 'albumId', 'ALBUM_ID'));
            const name = pick(album, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범';
            return `<button type="button" class="photo-album-chip nl-folder-item" data-album-filter="${id}"><i class="fa-solid fa-folder"></i> ${esc(name)}</button>`;
        }).join(''));
        el.photoAlbumChips.querySelectorAll('[data-album-filter]').forEach(button => {
            const selected = String(button.dataset.albumFilter) === current;
            button.classList.toggle('active', selected);
            button.classList.toggle('is-selected', selected);
        });
        bindPhotoHorizontalScrollers(el.photoAlbumStrip);
    }


    function updatePhotoScrollButtons(scroller) {
        if (!scroller) return;
        const viewport = scroller.querySelector('[data-scroll-viewport]') || scroller.querySelector('.nl-scroll-viewport');
        const prev = scroller.querySelector('[data-scroll-prev]');
        const next = scroller.querySelector('[data-scroll-next]');
        if (!viewport) return;
        const canScroll = viewport.scrollWidth > viewport.clientWidth + 2;
        if (prev) prev.disabled = !canScroll || viewport.scrollLeft <= 2;
        if (next) next.disabled = !canScroll || viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 2;
    }

    function bindPhotoHorizontalScrollers(root) {
        const base = root || document;
        base.querySelectorAll('[data-horizontal-scroller]').forEach(scroller => {
            if (scroller.dataset.photoScrollerBound === 'true') {
                updatePhotoScrollButtons(scroller);
                return;
            }
            scroller.dataset.photoScrollerBound = 'true';
            const viewport = scroller.querySelector('[data-scroll-viewport]') || scroller.querySelector('.nl-scroll-viewport');
            if (!viewport) return;
            scroller.addEventListener('click', event => {
                const prev = event.target.closest('[data-scroll-prev]');
                const next = event.target.closest('[data-scroll-next]');
                if (!prev && !next) return;
                event.preventDefault();
                const step = Math.max(220, Math.floor(viewport.clientWidth * 0.72));
                viewport.scrollBy({ left: next ? step : -step, behavior: 'smooth' });
                window.setTimeout(() => updatePhotoScrollButtons(scroller), 260);
            });
            viewport.addEventListener('scroll', () => updatePhotoScrollButtons(scroller), { passive: true });
            window.addEventListener('resize', () => updatePhotoScrollButtons(scroller));
            updatePhotoScrollButtons(scroller);
        });
    }

    function renderAlbums() {
        if (!el.albumGrid && !el.albumCountText) return;
        const q = (el.albumSearchInput ? el.albumSearchInput.value : '').trim().toLowerCase();
        const list = state.albums.filter(a => String(pick(a, 'albumName', 'ALBUM_NAME') || '').toLowerCase().includes(q));
        setText(el.albumCountText, `앨범 ${list.length}개`);
        if (!el.albumGrid) return;
        if (!list.length) {
            setHTML(el.albumGrid, '<div class="photo-empty"><i class="fa-regular fa-folder-open"></i><h3>아직 앨범이 없습니다.</h3><p>워크숍이나 프로젝트처럼 계속 모아볼 사진만 앨범으로 정리하세요.</p><button class="photo-secondary-button" data-action="open-album">새 앨범</button></div>');
            return;
        }
        setHTML(el.albumGrid, list.map(a => {
            const id = Number(pick(a, 'albumId', 'ALBUM_ID'));
            const cover = pick(a, 'coverPath', 'COVER_PATH');
            const count = Number(pick(a, 'photoCount', 'PHOTO_COUNT') || 0);
            return `<article class="album-card" data-album-id="${id}" tabindex="0"><div class="album-cover">${cover ? `<img src="${esc(cover)}" alt="">` : '<i class="fa-regular fa-images"></i>'}</div><div><h3>${esc(pick(a,'albumName','ALBUM_NAME'))}</h3><p>${count}장 · ${Number(pick(a,'postCount','POST_COUNT') || 0)}개 묶음</p></div></article>`;
        }).join(''));
    }

    function fillAlbumSelect() {
        if (!el.postAlbumSelect) return;
        setHTML(el.postAlbumSelect, '<option value="">앨범 없이 올리기</option>' + state.albums.map(a => `<option value="${Number(pick(a,'albumId','ALBUM_ID'))}">${esc(pick(a,'albumName','ALBUM_NAME'))}</option>`).join(''));
    }

    function switchView(name, tab) {
        if (tab && tab !== 'liked') state.activeTab = tab;
        document.querySelectorAll('.photo-view-tabs button').forEach(b => {
            if (b.dataset.likeFilter) return;
            b.classList.toggle('active', b.dataset.view === name && (!b.dataset.photoTab || b.dataset.photoTab === state.activeTab));
        });
        updateLayoutMode();
        setHidden(el.postsView, name !== 'posts'); setHidden(el.albumsView, name !== 'albums'); setHidden(el.albumDetailView, true);
        updateScopeGuide();
        syncTrashBulkActions();
        if (name === 'posts') loadAll();
    }

    function fillVisibilitySelect() {
        if (!el.postVisibilitySelect) return;
        if (scopeType === 'WORKSPACE') {
            setHTML(el.postVisibilitySelect, '<option value="WORKSPACE">그룹 공개</option>');
            el.postVisibilitySelect.hidden = false;
            setText(el.postVisibilityGuide, '현재 그룹 구성원이 함께 볼 수 있습니다.');
            if (el.postMoyoPublicBox) el.postMoyoPublicBox.hidden = true;
            if (el.postMoyoPublicCheckbox) el.postMoyoPublicCheckbox.checked = false;
            return;
        }
        if (scopeType === 'PROJECT') {
            setHTML(el.postVisibilitySelect, '<option value="PROJECT">프로젝트 공개</option>');
            el.postVisibilitySelect.hidden = false;
            setText(el.postVisibilityGuide, '현재 프로젝트 팀원이 함께 볼 수 있습니다.');
            if (el.postMoyoPublicBox) el.postMoyoPublicBox.hidden = true;
            if (el.postMoyoPublicCheckbox) el.postMoyoPublicCheckbox.checked = false;
            return;
        }
        setHTML(el.postVisibilitySelect, '<option value="PRIVATE">나만 보기</option>');
        el.postVisibilitySelect.hidden = true;
        if (el.postMoyoPublicBox) el.postMoyoPublicBox.hidden = false;
        if (el.postMoyoPublicCheckbox) el.postMoyoPublicCheckbox.checked = state.activeTab === 'moyo';
        setText(el.postVisibilityGuide, 'MOYO 공개를 체크하면 친구들이 MOYO 피드에서 볼 수 있습니다. 선택 친구 공유는 업로드 후 공통 공유 모달에서 지정합니다.');
    }

    function resetSelectedFiles() {
        state.previewUrls.forEach(url => URL.revokeObjectURL(url));
        state.previewUrls = [];
        state.selectedFiles = [];
        el.postFilesInput.value = '';
        renderSelectedFiles();
    }

    function postWriteUrl(albumId) {
        let nextScopeType = scopeType;
        let nextScopeId = String(scopeId);
        const params = new URLSearchParams();
        params.set('entryTab', state.activeTab || 'personal');
        if (state.activeTab === 'workspace' && state.selectedWorkspaceTargetId && state.selectedWorkspaceTargetId !== 'ALL') {
            nextScopeType = 'WORKSPACE';
            nextScopeId = String(state.selectedWorkspaceTargetId);
        } else if (state.activeTab === 'project' && state.selectedProjectTargetId && state.selectedProjectTargetId !== 'ALL') {
            nextScopeType = 'PROJECT';
            nextScopeId = String(state.selectedProjectTargetId);
        } else {
            nextScopeType = 'PERSONAL';
            nextScopeId = String(currentUserId || scopeId || 0);
        }
        params.set('scopeType', nextScopeType);
        params.set('scopeId', nextScopeId);
        if (albumId) params.set('albumId', String(albumId));
        if (state.activeTab === 'moyo') params.set('moyoPublic', 'true');
        if (state.activeTab === 'friend' && state.selectedFriendTargetId && state.selectedFriendTargetId !== 'ALL') {
            params.set('targetType', 'USER');
            params.set('targetId', String(state.selectedFriendTargetId));
        }
        if (state.activeTab === 'workspace' && (!state.selectedWorkspaceTargetId || state.selectedWorkspaceTargetId === 'ALL')) params.set('targetStep', 'workspace');
        if (state.activeTab === 'project') {
            if (state.selectedProjectWorkspaceTargetId && state.selectedProjectWorkspaceTargetId !== 'ALL') params.set('workspaceId', String(state.selectedProjectWorkspaceTargetId));
            if (!state.selectedProjectTargetId || state.selectedProjectTargetId === 'ALL') params.set('targetStep', 'project');
        }
        return `${contextPath}/photo-post/write?${params.toString()}`;
    }

    function showPostModal(albumId) {
        window.location.href = postWriteUrl(albumId);
    }

    function fileKey(file) {
        return [file.name, file.size, file.lastModified].join(':');
    }

    function addSelectedFiles(files) {
        const imageFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
        if (!imageFiles.length) {
            toast('이미지 파일만 올릴 수 있습니다.', true);
            return;
        }
        const existing = new Set(state.selectedFiles.map(fileKey));
        imageFiles.forEach(file => {
            const key = fileKey(file);
            if (!existing.has(key)) {
                state.selectedFiles.push(file);
                existing.add(key);
            }
        });
        renderSelectedFiles();
    }

    function renderSelectedFiles() {
        if (!el.postPreview && !el.selectedFileCount && !el.photoDropZone) return;
        state.previewUrls.forEach(url => URL.revokeObjectURL(url));
        state.previewUrls = [];
        const count = state.selectedFiles.length;
        setText(el.selectedFileCount, count ? `사진 ${count}장 선택됨` : '선택된 사진 없음');
        setHidden(el.clearSelectedFilesButton, count === 0);
        toggleClass(el.photoDropZone, 'has-files', count > 0);
        setHTML(el.postPreview, state.selectedFiles.map((file, index) => {
            const url = URL.createObjectURL(file);
            state.previewUrls.push(url);
            return `<div class="preview-item"><img src="${url}" alt="선택한 사진 ${index + 1}"><button type="button" class="preview-remove" data-remove-file="${index}" aria-label="사진 제거"><i class="fa-solid fa-xmark"></i></button></div>`;
        }).join(''));
    }

    async function savePost() {
        if (!state.selectedFiles.length) return toast('올릴 사진을 선택해주세요.', true);
        const fd = new FormData();
        fd.append('scopeType', scopeType);
        fd.append('scopeId', scopeId);
        fd.append('title', '');
        fd.append('description', el.postDescriptionInput.value.trim());
        const visibilityValue = (scopeType === 'PERSONAL' && el.postMoyoPublicCheckbox && el.postMoyoPublicCheckbox.checked) ? 'FRIENDS' : (el.postVisibilitySelect ? el.postVisibilitySelect.value : '');
        if (visibilityValue) fd.append('visibilityType', visibilityValue);
        if (el.postAlbumSelect.value) fd.append('albumId', el.postAlbumSelect.value);
        state.selectedFiles.forEach(f => fd.append('files', f));
        el.savePostButton.disabled = true;
        try { await request('/api/photo-posts', { method: 'POST', body: fd }); closeModal(el.postModal); toast('사진을 올렸습니다.'); await loadAll(); switchView(state.selectedAlbumId ? 'albums' : 'posts'); if (state.selectedAlbumId) await openAlbum(state.selectedAlbumId); }
        catch (e) { toast(e.message, true); } finally { el.savePostButton.disabled = false; }
    }

    function showAlbumModal(editing) {
        state.editingAlbum = editing; el.albumModalTitle.textContent = editing ? '앨범 수정' : '새 앨범'; el.albumNameInput.value = editing ? pick(state.album,'albumName','ALBUM_NAME') || '' : ''; el.albumDescriptionInput.value = editing ? pick(state.album,'albumDescription','ALBUM_DESCRIPTION') || '' : ''; el.deleteAlbumButton.hidden = !editing; openModal(el.albumModal);
    }
    async function saveAlbum() {
        const name = el.albumNameInput.value.trim(); if (!name) return toast('앨범 이름을 입력해주세요.', true);
        const payload = { scopeType, scopeId, albumName: name, albumDescription: el.albumDescriptionInput.value.trim() };
        try { if (state.editingAlbum) await request(`/api/photo-albums/${pick(state.album,'albumId','ALBUM_ID')}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); else await request('/api/photo-albums',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); closeModal(el.albumModal); toast(state.editingAlbum ? '앨범을 수정했습니다.' : '앨범을 만들었습니다.'); await loadAll(); if (state.editingAlbum) await openAlbum(pick(state.album,'albumId','ALBUM_ID')); }
        catch(e){ toast(e.message,true); }
    }
    async function deleteAlbum() {
        if (!confirm('앨범만 삭제할까요? 앨범 안의 사진은 삭제되지 않고 최근 사진에 남습니다.')) return;
        try { await request(`/api/photo-albums/${pick(state.album,'albumId','ALBUM_ID')}`,{method:'DELETE'}); closeModal(el.albumModal); toast('앨범을 삭제했습니다. 사진은 그대로 유지됩니다.'); await loadAll(); switchView('albums'); }
        catch(e){ toast(e.message,true); }
    }
    async function openAlbum(id) {
        try { const data = await request(`/api/photo-albums/${id}`); state.album = data.album; state.albumPosts = data.posts || []; el.postsView.hidden = true; el.albumsView.hidden = true; el.albumDetailView.hidden = false; el.detailAlbumName.textContent = pick(state.album,'albumName','ALBUM_NAME') || '앨범'; el.detailAlbumDescription.textContent = pick(state.album,'albumDescription','ALBUM_DESCRIPTION') || '앨범 설명이 없습니다.'; el.detailAlbumMeta.textContent = `${Number(pick(state.album,'photoCount','PHOTO_COUNT') || 0)}장 · ${Number(pick(state.album,'postCount','POST_COUNT') || 0)}개 묶음`; renderPosts(state.albumPosts, el.albumPostGrid); }
        catch(e){ toast(e.message,true); }
    }


    function ensureRuntimeLightboxPatchStyle() {
        // Runtime 상세 스타일은 photoAlbum.css의 정리 섹션에서 관리한다.
    }

    function runtimeLightboxNodes() {
        ensureRuntimeLightboxPatchStyle();
        let box = document.getElementById('photoRuntimeLightbox');
        if (!box) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="photoRuntimeLightbox" class="photo-runtime-lightbox" aria-hidden="true">
                    <button type="button" class="photo-runtime-close" data-runtime-close aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
                    <button type="button" class="photo-runtime-nav photo-runtime-prev" data-runtime-prev aria-label="이전 사진"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="photo-runtime-panel" role="dialog" aria-modal="true" aria-label="사진 상세">
                        <section class="photo-runtime-media">
                            <img id="photoRuntimeImage" alt="확대 사진">
                            <div id="photoRuntimeGallery" class="photo-runtime-gallery" hidden>
                                <span id="photoRuntimePhotoCount" class="photo-runtime-gallery-count">1/1</span>
                                <div id="photoRuntimeDots" class="photo-runtime-gallery-dots" aria-label="사진 순서"></div>
                            </div>
                        </section>
                        <aside class="photo-runtime-side">
                            <header class="photo-runtime-author">
                                <div class="photo-runtime-author-main">
                                    <span id="photoRuntimeAvatar" class="photo-runtime-avatar"></span>
                                    <span class="photo-runtime-author-text">
                                        <strong id="photoRuntimeCreator"></strong>
                                        <small id="photoRuntimeMeta"></small>
                                    </span>
                                </div>
                                <div class="photo-runtime-menu-wrap" data-runtime-manage hidden>
                                    <button type="button" class="photo-runtime-menu-button" data-runtime-menu-toggle aria-label="사진 관리 메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis"></i></button>
                                    <div class="photo-runtime-menu" data-runtime-menu hidden>
                                        <button type="button" data-runtime-edit><i class="fa-regular fa-pen-to-square"></i><span>수정</span></button>
                                        <button type="button" data-runtime-visibility><i class="fa-regular fa-eye"></i><span>MOYO 공개</span></button>
                                        <button type="button" data-runtime-move><i class="fa-regular fa-folder-open"></i><span>앨범 이동</span></button>
                                        <button type="button" class="danger" data-runtime-delete><i class="fa-regular fa-trash-can"></i><span>휴지통으로 이동</span></button>
                                        <button type="button" data-runtime-restore><i class="fa-solid fa-rotate-left"></i><span>복원</span></button>
                                        <button type="button" class="danger" data-runtime-permanent><i class="fa-regular fa-trash-can"></i><span>영구 삭제</span></button>
                                    </div>
                                </div>
                            </header>
                            <section class="photo-runtime-description">
                                <p id="photoRuntimeTitle"></p>
                            </section>
                            <div class="photo-runtime-detail-meta" data-runtime-detail-meta hidden>
                                <small id="photoRuntimeAlbum" hidden></small>
                            </div>
                            <section class="photo-runtime-stats">
                                <button type="button" class="photo-runtime-like" data-runtime-like aria-pressed="false" aria-label="좋아요"><i class="fa-regular fa-heart"></i><strong id="photoRuntimeLikeCount">0</strong></button>
                                <span class="photo-runtime-comment-stat" aria-label="댓글"><i class="fa-regular fa-comment"></i><strong id="photoRuntimeCommentCount">0</strong></span>
                                <span class="photo-runtime-action-pair">
                                    <button type="button" class="photo-runtime-share" data-runtime-share aria-label="사진 공유" title="공유"><i class="fa-regular fa-paper-plane"></i></button>
                                    <button type="button" class="photo-runtime-collect" data-runtime-collect aria-label="담아가기" title="담아가기"><i class="fa-regular fa-bookmark"></i></button>
                                    <span id="photoRuntimeCollectedSource" class="photo-collected-source-runtime" hidden></span>
                                </span>
                                <span id="photoRuntimeVisibilityBadge" class="photo-runtime-visibility-badge" hidden></span>
                            </section>
                            <section class="photo-runtime-comments" aria-label="댓글">
                                <div class="photo-runtime-comment-title">댓글</div>
                                <div id="photoRuntimeComments" class="photo-runtime-comment-list"></div>
                            </section>
                            <form id="photoRuntimeCommentForm" class="photo-runtime-comment-form">
                                <div id="photoRuntimeReplyTarget" class="photo-runtime-reply-target" hidden></div>
                                <input type="hidden" id="photoRuntimeParentCommentId" value="">
                                <textarea id="photoRuntimeCommentInput" maxlength="500" rows="1" placeholder="댓글을 입력하세요."></textarea>
                                <div id="photoRuntimeMentionList" class="photo-runtime-mention-list" hidden></div>
                                <button type="submit" aria-label="댓글 등록">등록</button>
                            </form>

                        </aside>
                    </div>
                    <button type="button" class="photo-runtime-nav photo-runtime-next" data-runtime-next aria-label="다음 사진"><i class="fa-solid fa-chevron-right"></i></button>
                </div>`);
            box = document.getElementById('photoRuntimeLightbox');
            box.addEventListener('click', event => {
                if (event.target === box || event.target.closest('[data-runtime-close]')) return hideRuntimeLightbox();
                const menuToggle = event.target.closest('[data-runtime-menu-toggle]');
                if (menuToggle) {
                    event.preventDefault();
                    event.stopPropagation();
                    return toggleRuntimeManageMenu();
                }
                if (!event.target.closest('[data-runtime-manage]')) closeRuntimeManageMenu();
                if (event.target.closest('[data-runtime-prev]')) return movePhoto(-1);
                if (event.target.closest('[data-runtime-next]')) return movePhoto(1);
                const photoDot = event.target.closest('[data-runtime-photo-dot]');
                if (photoDot) {
                    const nextIndex = Number(photoDot.dataset.runtimePhotoDot);
                    if (Number.isFinite(nextIndex)) {
                        state.photoIndex = nextIndex;
                        return renderRuntimeLightbox();
                    }
                }
                if (event.target.closest('[data-runtime-like]')) {
                    if (state.activePost) return togglePostLike(Number(pick(state.activePost, 'postId', 'POST_ID')));
                }
                const descToggle = event.target.closest('[data-runtime-desc-toggle]');
                if (descToggle) {
                    event.preventDefault();
                    state.runtimeDescExpanded = !state.runtimeDescExpanded;
                    return renderRuntimeLightbox();
                }
                const mentionOption = event.target.closest('[data-runtime-mention-user]');
                if (mentionOption) return applyRuntimeMention(mentionOption.dataset.runtimeMentionUser || '');
                const likeCommentButton = event.target.closest('[data-runtime-like-comment]');
                if (likeCommentButton) return toggleRuntimeCommentLike(Number(likeCommentButton.dataset.runtimeLikeComment));
                const editCommentButton = event.target.closest('[data-runtime-edit-comment]');
                if (editCommentButton) return focusRuntimeCommentEdit(Number(editCommentButton.dataset.runtimeEditComment));
                const deleteCommentButton = event.target.closest('[data-runtime-delete-comment]');
                if (deleteCommentButton) return deleteRuntimeComment(Number(deleteCommentButton.dataset.runtimeDeleteComment));
                const replyButton = event.target.closest('[data-runtime-reply-comment]');
                if (replyButton) return focusRuntimeReply(Number(replyButton.dataset.runtimeReplyComment), replyButton.dataset.runtimeReplyName || '');
                const cancelEditButton = event.target.closest('[data-runtime-edit-cancel]');
                if (cancelEditButton) return cancelRuntimeCommentEdit();
                const cancelReplyButton = event.target.closest('[data-runtime-reply-cancel]');
                if (cancelReplyButton) return cancelRuntimeReply();
                if (event.target.closest('[data-runtime-collect]')) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeRuntimeManageMenu();
                    if (state.activePost) return collectPost(Number(pick(state.activePost, 'postId', 'POST_ID')));
                }
                if (event.target.closest('[data-runtime-share]')) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeRuntimeManageMenu();
                    return openActivePostShareModal();
                }
                if (event.target.closest('[data-runtime-edit]')) { closeRuntimeManageMenu(); return showEditPostModal(); }
                if (event.target.closest('[data-runtime-visibility]')) { closeRuntimeManageMenu(); return toggleRuntimePostVisibility(); }
                if (event.target.closest('[data-runtime-move]')) { closeRuntimeManageMenu(); return showMoveAlbumModal({ useRuntimeLayer: false, forceNormalModal: true }); }
                if (event.target.closest('[data-runtime-delete]')) { closeRuntimeManageMenu(); return deletePost(); }
                if (event.target.closest('[data-runtime-restore]')) { closeRuntimeManageMenu(); return restoreActivePost(); }
                if (event.target.closest('[data-runtime-permanent]')) { closeRuntimeManageMenu(); return permanentlyDeleteActivePost(); }
            });
            box.addEventListener('submit', event => {
                if (!event.target.closest('#photoRuntimeCommentForm')) return;
                event.preventDefault();
                createRuntimeComment();
            });
            const input = document.getElementById('photoRuntimeCommentInput');
            if (input && input.dataset.mentionBound !== '1') {
                input.dataset.mentionBound = '1';
                input.addEventListener('input', () => {
                    autosizeRuntimeCommentInput(input);
                    renderRuntimeMentionList();
                });
                input.addEventListener('click', renderRuntimeMentionList);
                input.addEventListener('keydown', event => {
                    const nodes = runtimeLightboxNodes();
                    const opened = nodes.mentionList && !nodes.mentionList.hidden;
                    if (event.key === 'ArrowDown' && opened) { event.preventDefault(); return moveRuntimeMentionActive(1); }
                    if (event.key === 'ArrowUp' && opened) { event.preventDefault(); return moveRuntimeMentionActive(-1); }
                    if (event.key === 'Escape') return closeRuntimeMentionList();
                    if (event.key === 'Tab' && opened) {
                        const active = nodes.mentionList.querySelector('.photo-runtime-mention-option.active[data-runtime-mention-user]');
                        if (active) {
                            event.preventDefault();
                            return applyRuntimeMention(active.dataset.runtimeMentionUser || '');
                        }
                    }
                    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey && !event.isComposing) {
                        const active = opened ? nodes.mentionList.querySelector('.photo-runtime-mention-option.active[data-runtime-mention-user]') : null;
                        event.preventDefault();
                        if (active) return applyRuntimeMention(active.dataset.runtimeMentionUser || '');
                        return createRuntimeComment();
                    }
                });
                autosizeRuntimeCommentInput(input);
            }
        }
        return {
            box,
            image: document.getElementById('photoRuntimeImage'),
            gallery: document.getElementById('photoRuntimeGallery'),
            photoCount: document.getElementById('photoRuntimePhotoCount'),
            dots: document.getElementById('photoRuntimeDots'),
            title: document.getElementById('photoRuntimeTitle'),
            meta: document.getElementById('photoRuntimeMeta'),
            collectedSource: document.getElementById('photoRuntimeCollectedSource'),
            detailMeta: box.querySelector('[data-runtime-detail-meta]'),
            album: document.getElementById('photoRuntimeAlbum'),
            creator: document.getElementById('photoRuntimeCreator'),
            avatar: document.getElementById('photoRuntimeAvatar'),
            visibilityBadge: document.getElementById('photoRuntimeVisibilityBadge'),
            prev: box.querySelector('[data-runtime-prev]'),
            next: box.querySelector('[data-runtime-next]'),
            like: box.querySelector('[data-runtime-like]'),
            likeCount: document.getElementById('photoRuntimeLikeCount'),
            commentCount: document.getElementById('photoRuntimeCommentCount'),
            stats: box.querySelector('.photo-runtime-stats'),
            commentSection: box.querySelector('.photo-runtime-comments'),
            comments: document.getElementById('photoRuntimeComments'),
            commentForm: document.getElementById('photoRuntimeCommentForm'),
            commentInput: document.getElementById('photoRuntimeCommentInput'),
            mentionList: document.getElementById('photoRuntimeMentionList'),
            replyTarget: document.getElementById('photoRuntimeReplyTarget'),
            parentCommentId: document.getElementById('photoRuntimeParentCommentId'),
            manage: box.querySelector('[data-runtime-manage]'),
            menuToggle: box.querySelector('[data-runtime-menu-toggle]'),
            menu: box.querySelector('[data-runtime-menu]'),
            collect: box.querySelector('[data-runtime-collect]'),
            share: box.querySelector('[data-runtime-share]'),
            edit: box.querySelector('[data-runtime-edit]'),
            visibility: box.querySelector('[data-runtime-visibility]'),
            move: box.querySelector('[data-runtime-move]'),
            del: box.querySelector('[data-runtime-delete]'),
            restore: box.querySelector('[data-runtime-restore]'),
            permanent: box.querySelector('[data-runtime-permanent]')
        };
    }

    function closeRuntimeManageMenu() {
        const nodes = runtimeLightboxNodes();
        if (nodes.menu) nodes.menu.hidden = true;
        if (nodes.menuToggle) nodes.menuToggle.setAttribute('aria-expanded', 'false');
    }

    function toggleRuntimeManageMenu() {
        const nodes = runtimeLightboxNodes();
        if (!nodes.menu || !nodes.menuToggle) return;
        const willOpen = !!nodes.menu.hidden;
        nodes.menu.hidden = !willOpen;
        nodes.menuToggle.setAttribute('aria-expanded', String(willOpen));
    }

    function applyRuntimeLightboxStyle(box) {
        if (!box) return;
        box.removeAttribute('hidden');
        box.removeAttribute('style');
        box.style.setProperty('display', 'grid', 'important');
        box.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function styleRuntimeLightboxChildren(nodes) {
        if (!nodes || !nodes.box) return;
        nodes.box.dataset.runtimeStyled = '1';
    }

    function postDisplayName(post) {
        return pick(post, 'creatorName', 'CREATOR_NAME') || '작성자';
    }


    function isCollectedCopyPost(post) {
        return Number(pick(post, 'isCollectedCopy', 'IS_COLLECTED_COPY') || 0) === 1
            || !!pick(post, 'collectedSourcePostId', 'COLLECTED_SOURCE_POST_ID');
    }

    function collectedSourceName(post) {
        return pick(post, 'collectedSourceCreatorName', 'COLLECTED_SOURCE_CREATOR_NAME') || '';
    }

    function collectedSourceBadgeMarkup(post, variant) {
        if (!isCollectedCopyPost(post)) return '';
        const sourceName = collectedSourceName(post);
        const label = sourceName ? `원본 ${sourceName}` : '원본 사진';
        return `<span class="photo-collected-source-badge${variant ? ` photo-collected-source-badge--${variant}` : ''}" title="${esc(label)}"><span>${esc(label)}</span></span>`;
    }

    function renderRuntimeAvatar(target, name, imagePath) {
        if (!target) return;
        const resolved = imagePath ? resolveAssetPath(imagePath) : '';
        if (resolved) {
            target.innerHTML = `<img src="${esc(resolved)}" alt="">`;
        } else {
            target.textContent = String(name || 'M').trim().charAt(0).toUpperCase() || 'M';
        }
    }

    function hideRuntimeLightbox() {
        closeRuntimeManageMenu();
        closeRuntimeMentionList();
        hideRuntimeMoveAlbumLayer();
        const box = document.getElementById('photoRuntimeLightbox');
        if (!box) return;
        box.setAttribute('hidden', '');
        box.setAttribute('aria-hidden', 'true');
        box.style.setProperty('display', 'none', 'important');
        document.body.style.overflow = '';
    }

    function updatePostCommentCount(postId, count) {
        const apply = post => {
            if (Number(pick(post, 'postId', 'POST_ID')) !== Number(postId)) return;
            post.commentCount = count;
            post.COMMENT_COUNT = count;
        };
        state.posts.forEach(apply);
        state.albumPosts.forEach(apply);
        if (state.activePost) apply(state.activePost);
    }

    function activeCommentCount(comments) {
        return (Array.isArray(comments) ? comments : []).filter(comment => String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() !== 'Y').length;
    }

    function buildCommentTree(comments) {
        const source = Array.isArray(comments) ? comments : [];
        const byId = new Map();
        const roots = [];
        source.forEach(comment => {
            const commentId = Number(pick(comment, 'commentId', 'COMMENT_ID'));
            if (!commentId) return;
            comment.children = [];
            comment.replyToName = '';
            comment.REPLY_TO_NAME = '';
            byId.set(commentId, comment);
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
            const commentId = Number(pick(comment, 'commentId', 'COMMENT_ID'));
            if (!commentId) return;
            const parentId = Number(pick(comment, 'parentCommentId', 'PARENT_COMMENT_ID'));
            if (parentId && byId.has(parentId)) {
                const parent = byId.get(parentId);
                const root = rootOf(parent);
                const rootId = Number(pick(root, 'commentId', 'COMMENT_ID'));
                const parentName = pick(parent, 'userName', 'USER_NAME') || '사용자';
                comment.replyToName = parentName;
                comment.REPLY_TO_NAME = comment.replyToName;
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

    function findRuntimeComment(commentId) {
        return (state.activeComments || []).find(comment => Number(pick(comment, 'commentId', 'COMMENT_ID')) === Number(commentId)) || null;
    }

    function renderRuntimeCommentItem(comment, depth, rootCommentId) {
        const commentId = Number(pick(comment, 'commentId', 'COMMENT_ID'));
        const rootId = rootCommentId || commentId;
        const userId = Number(pick(comment, 'userId', 'USER_ID'));
        const name = pick(comment, 'userName', 'USER_NAME') || '사용자';
        const content = pick(comment, 'commentContent', 'COMMENT_CONTENT') || '';
        const replyToName = pick(comment, 'replyToName', 'REPLY_TO_NAME') || '';
        const created = pick(comment, 'createdAt', 'CREATED_AT') || '';
        const profile = pick(comment, 'profileImagePath', 'PROFILE_IMAGE_PATH');
        const deleted = String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() === 'Y';
        const liked = Number(pick(comment, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(comment, 'likeCount', 'LIKE_COUNT') || 0);
        const canManageComment = !deleted && (userId === currentUserId || Number(pick(state.activePost, 'createdBy', 'CREATED_BY')) === currentUserId || isAdmin);
        const canEdit = !deleted && userId === currentUserId;
        const canDelete = canManageComment;
        const canReply = !deleted;
        const canLike = !deleted;
        const avatar = profile && !deleted
            ? `<span class="photo-runtime-comment-avatar"><img src="${esc(resolveAssetPath(profile))}" alt=""></span>`
            : `<span class="photo-runtime-comment-avatar">${deleted ? '·' : esc(String(name).trim().charAt(0).toUpperCase() || 'M')}</span>`;
        const children = depth === 0 && Array.isArray(comment.children) && comment.children.length
            ? `<div class="photo-runtime-comment-children">${comment.children.map(child => renderRuntimeCommentItem(child, 1, rootId)).join('')}</div>`
            : '';
        const mention = !deleted && depth > 0 && replyToName && !String(content || '').trim().startsWith('@') ? `<span class="photo-runtime-comment-mention">${esc(mentionText(replyToName))}</span> ` : '';
        const contentHtml = formatCommentContent(content);
        return `<article class="photo-runtime-comment-item ${depth > 0 ? 'is-reply' : ''} ${deleted ? 'is-deleted' : ''}">
            ${avatar}
            <div class="photo-runtime-comment-main">
                <div class="photo-runtime-comment-body">
                    <div class="photo-runtime-comment-head"><strong>${deleted ? '삭제된 댓글' : esc(name)}</strong><small>${esc(created)}</small></div>
                    <p>${mention}${contentHtml}</p>
                    <div class="photo-runtime-comment-tools">
                        ${canLike ? `<button type="button" class="photo-runtime-comment-like${liked ? ' liked' : ''}" data-runtime-like-comment="${commentId}" aria-pressed="${liked}" aria-label="댓글 좋아요"><i class="${liked ? 'fa-solid' : 'fa-regular'} fa-heart"></i><span>${likeCount}</span></button>` : ''}
                        ${canReply ? `<button type="button" data-runtime-reply-comment="${rootId}" data-runtime-reply-name="${esc(name)}" data-runtime-reply-mention="${esc(name)}">답글</button>` : ''}
                        ${canEdit ? `<button type="button" class="photo-runtime-comment-edit" data-runtime-edit-comment="${commentId}" aria-label="댓글 수정">수정</button>` : ''}
                        ${canDelete ? `<button type="button" class="photo-runtime-comment-delete" data-runtime-delete-comment="${commentId}" aria-label="댓글 삭제">삭제</button>` : ''}
                    </div>
                </div>
                ${children}
            </div>
        </article>`;
    }

    function renderRuntimeComments() {
        const nodes = runtimeLightboxNodes();
        const comments = Array.isArray(state.activeComments) ? state.activeComments : [];
        if (nodes.commentCount) nodes.commentCount.textContent = String(activeCommentCount(comments));
        if (!nodes.comments) return;
        if (!comments.length) {
            nodes.comments.innerHTML = '<div class="photo-runtime-comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div>';
            return;
        }
        nodes.comments.innerHTML = buildCommentTree(comments).map(comment => renderRuntimeCommentItem(comment, 0)).join('');
    }


    function runtimeMentionUsers() {
        const users = new Map();
        const add = (id, name, profile, label) => {
            const cleanName = String(name || '').trim();
            if (!cleanName) return;
            const key = String(id || cleanName);
            if (!users.has(key)) users.set(key, { id: key, name: cleanName, profile: profile || '', label: label || '' });
        };
        if (state.activePost) {
            add(pick(state.activePost, 'createdBy', 'CREATED_BY'), postDisplayName(state.activePost), profileImageOf(state.activePost), '작성자');
        }
        (state.activeComments || []).forEach(comment => {
            const deleted = String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() === 'Y';
            if (deleted) return;
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

    function autosizeRuntimeCommentInput(input) {
        if (!input) return;
        input.style.height = 'auto';
        const minHeight = 44;
        const maxHeight = 104;
        input.style.height = Math.min(Math.max(input.scrollHeight, minHeight), maxHeight) + 'px';
    }

    function renderRuntimeMentionList() {
        const nodes = runtimeLightboxNodes();
        if (!nodes.mentionList || !nodes.commentInput) return;
        if (nodes.commentInput.dataset.editCommentId) {
            closeRuntimeMentionList();
            return;
        }
        const query = currentMentionQuery(nodes.commentInput);
        if (!query) {
            closeRuntimeMentionList();
            return;
        }
        const keyword = query.keyword.trim().toLowerCase();
        const candidates = runtimeMentionUsers()
            .filter(user => !keyword || user.name.toLowerCase().includes(keyword) || mentionText(user.name).toLowerCase().includes('@' + keyword))
            .slice(0, 8);
        if (!candidates.length) {
            nodes.mentionList.innerHTML = '<div class="photo-runtime-mention-option" aria-disabled="true"><span class="mention-avatar">?</span><strong>일치하는 사용자가 없습니다</strong></div>';
            nodes.mentionList.hidden = false;
            return;
        }
        nodes.mentionList.innerHTML = candidates.map((user, index) => {
            const src = resolveAssetPath(user.profile);
            const avatar = src
                ? `<span class="mention-avatar"><img src="${esc(src)}" alt=""></span>`
                : `<span class="mention-avatar">${esc(String(user.name).charAt(0) || '?')}</span>`;
            return `<button type="button" class="photo-runtime-mention-option${index === 0 ? ' active' : ''}" data-runtime-mention-user="${esc(user.name)}">${avatar}<strong>${esc(mentionText(user.name))}</strong>${user.label ? `<small>${esc(user.label)}</small>` : ''}</button>`;
        }).join('');
        nodes.mentionList.hidden = false;
    }

    function closeRuntimeMentionList() {
        const nodes = runtimeLightboxNodes();
        if (!nodes.mentionList) return;
        nodes.mentionList.hidden = true;
        nodes.mentionList.innerHTML = '';
    }

    function applyRuntimeMention(name) {
        const nodes = runtimeLightboxNodes();
        if (!nodes.commentInput) return;
        const query = currentMentionQuery(nodes.commentInput);
        const mention = mentionText(name);
        if (!query || !mention) return;
        const value = nodes.commentInput.value || '';
        const nextValue = `${value.slice(0, query.start)}${mention} ${value.slice(query.end)}`;
        nodes.commentInput.value = nextValue;
        const caret = query.start + mention.length + 1;
        nodes.commentInput.focus();
        nodes.commentInput.setSelectionRange(caret, caret);
        autosizeRuntimeCommentInput(nodes.commentInput);
        closeRuntimeMentionList();
    }

    function moveRuntimeMentionActive(step) {
        const nodes = runtimeLightboxNodes();
        if (!nodes.mentionList || nodes.mentionList.hidden) return false;
        const options = Array.from(nodes.mentionList.querySelectorAll('[data-runtime-mention-user]'));
        if (!options.length) return false;
        let current = options.findIndex(option => option.classList.contains('active'));
        if (current < 0) current = 0;
        const next = (current + step + options.length) % options.length;
        options.forEach((option, index) => option.classList.toggle('active', index === next));
        options[next].scrollIntoView({ block: 'nearest' });
        return true;
    }

    function updateRuntimeCommentLikeState(commentId, liked, likeCount) {
        const apply = comment => {
            if (Number(pick(comment, 'commentId', 'COMMENT_ID')) !== Number(commentId)) return;
            comment.likedByMe = liked ? 1 : 0;
            comment.LIKED_BY_ME = liked ? 1 : 0;
            comment.likeCount = likeCount;
            comment.LIKE_COUNT = likeCount;
        };
        (state.activeComments || []).forEach(apply);
    }

    async function toggleRuntimeCommentLike(commentId) {
        if (!commentId) return;
        try {
            const result = await request('/api/reactions/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentType: 'PHOTO_COMMENT', contentId: commentId, reactionType: 'LIKE', currentUserId })
            });
            updateRuntimeCommentLikeState(commentId, !!result.liked, Number(result.likeCount || 0));
            renderRuntimeComments();
        } catch (e) {
            toast(e.message || '댓글 좋아요를 처리하지 못했습니다.', true);
        }
    }

    function focusRuntimeCommentEdit(commentId) {
        const nodes = runtimeLightboxNodes();
        const comment = findRuntimeComment(commentId);
        if (!comment || !nodes.commentInput) return;
        const deleted = String(pick(comment, 'deletedYn', 'DELETED_YN') || 'N').toUpperCase() === 'Y';
        const userId = Number(pick(comment, 'userId', 'USER_ID'));
        if (deleted || userId !== currentUserId) return toast('내 댓글만 수정할 수 있습니다.', true);
        if (nodes.parentCommentId) nodes.parentCommentId.value = '';
        nodes.commentInput.dataset.editCommentId = String(commentId);
        delete nodes.commentInput.dataset.replyMention;
        nodes.commentInput.value = pick(comment, 'commentContent', 'COMMENT_CONTENT') || '';
        nodes.commentInput.placeholder = '댓글을 수정하세요.';
        if (nodes.replyTarget) {
            nodes.replyTarget.hidden = false;
            nodes.replyTarget.innerHTML = `<span>댓글 수정 중</span><button type="button" data-runtime-edit-cancel>취소</button>`;
        }
        nodes.commentInput.focus();
        autosizeRuntimeCommentInput(nodes.commentInput);
        closeRuntimeMentionList();
    }

    function cancelRuntimeCommentEdit() {
        const nodes = runtimeLightboxNodes();
        closeRuntimeMentionList();
        if (nodes.commentInput) {
            delete nodes.commentInput.dataset.editCommentId;
            nodes.commentInput.value = '';
            autosizeRuntimeCommentInput(nodes.commentInput);
            nodes.commentInput.placeholder = '댓글을 입력하세요.';
        }
        if (nodes.replyTarget) {
            nodes.replyTarget.hidden = true;
            nodes.replyTarget.innerHTML = '';
        }
    }

    function focusRuntimeReply(parentCommentId, name) {
        const nodes = runtimeLightboxNodes();
        if (!nodes.parentCommentId || !nodes.commentInput) return;
        const replyName = String(name || '').trim();
        delete nodes.commentInput.dataset.editCommentId;
        nodes.parentCommentId.value = parentCommentId ? String(parentCommentId) : '';
        nodes.commentInput.dataset.replyMention = replyName;
        if (nodes.replyTarget) {
            nodes.replyTarget.hidden = false;
            nodes.replyTarget.innerHTML = `<span>${esc(mentionText(replyName) || '댓글')}에게 답글 작성 중</span><button type="button" data-runtime-reply-cancel>취소</button>`;
        }
        nodes.commentInput.placeholder = replyName ? `${mentionText(replyName)} 답글을 입력하세요.` : '답글을 입력하세요.';
        nodes.commentInput.focus();
        autosizeRuntimeCommentInput(nodes.commentInput);
        renderRuntimeMentionList();
    }

    function cancelRuntimeReply() {
        const nodes = runtimeLightboxNodes();
        closeRuntimeMentionList();
        if (nodes.parentCommentId) nodes.parentCommentId.value = '';
        if (nodes.replyTarget) {
            nodes.replyTarget.hidden = true;
            nodes.replyTarget.innerHTML = '';
        }
        if (nodes.commentInput) { nodes.commentInput.placeholder = '댓글을 입력하세요.'; delete nodes.commentInput.dataset.replyMention; }
    }

    async function loadRuntimeComments(postId) {
        const nodes = runtimeLightboxNodes();
        if (nodes.comments) nodes.comments.innerHTML = '<div class="photo-runtime-comment-empty">댓글을 불러오는 중입니다.</div>';
        try {
            const comments = await request(`/api/photo-posts/${postId}/comments`);
            state.activeComments = Array.isArray(comments) ? comments : [];
            updatePostCommentCount(postId, activeCommentCount(state.activeComments));
            renderRuntimeComments();
            refreshPosts();
        } catch (e) {
            state.activeComments = [];
            if (nodes.comments) nodes.comments.innerHTML = `<div class="photo-runtime-comment-empty">${esc(e.message || '댓글을 불러오지 못했습니다.')}</div>`;
        }
    }

    async function createRuntimeComment() {
        if (!state.activePost) return;
        const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
        const nodes = runtimeLightboxNodes();
        let content = nodes.commentInput ? nodes.commentInput.value.trim() : '';
        const editingCommentId = nodes.commentInput && nodes.commentInput.dataset.editCommentId ? Number(nodes.commentInput.dataset.editCommentId) : null;
        const parentCommentId = nodes.parentCommentId && nodes.parentCommentId.value ? Number(nodes.parentCommentId.value) : null;
        const replyMention = nodes.commentInput && nodes.commentInput.dataset.replyMention ? mentionText(nodes.commentInput.dataset.replyMention) : '';
        if (replyMention && !content.startsWith('@')) content = `${replyMention} ${content}`.trim();
        if (!content) return toast(editingCommentId ? '수정할 내용을 입력해주세요.' : '댓글을 입력해주세요.', true);
        const submitButton = nodes.commentForm ? nodes.commentForm.querySelector('button[type="submit"]') : null;
        if (submitButton) submitButton.disabled = true;
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
            state.activeComments = Array.isArray(result.comments) ? result.comments : [];
            updatePostCommentCount(postId, activeCommentCount(state.activeComments));
            if (nodes.commentInput) { nodes.commentInput.value = ''; autosizeRuntimeCommentInput(nodes.commentInput); }
            if (editingCommentId) cancelRuntimeCommentEdit();
            else cancelRuntimeReply();
            renderRuntimeComments();
            refreshPosts();
        } catch (e) {
            toast(e.message || (editingCommentId ? '댓글을 수정하지 못했습니다.' : '댓글을 등록하지 못했습니다.'), true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    }

    async function deleteRuntimeComment(commentId) {
        if (!state.activePost || !commentId) return;
        if (!confirm('댓글을 삭제할까요?')) return;
        const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
        try {
            const result = await request(`/api/photo-posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
            state.activeComments = Array.isArray(result.comments) ? result.comments : [];
            updatePostCommentCount(postId, activeCommentCount(state.activeComments));
            renderRuntimeComments();
            refreshPosts();
        } catch (e) {
            toast(e.message || '댓글을 삭제하지 못했습니다.', true);
        }
    }

    function renderRuntimeDescription(nodes, description) {
        if (!nodes || !nodes.title) return;
        const wrap = nodes.title.closest('.photo-runtime-description');
        const oldToggle = wrap ? wrap.querySelector('[data-runtime-desc-toggle]') : null;
        if (oldToggle) oldToggle.remove();

        const normalized = String(description || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
        const hasDescription = normalized.length > 0;
        if (wrap) wrap.hidden = !hasDescription;
        nodes.title.textContent = hasDescription ? normalized : '';
        nodes.title.classList.remove('is-collapsed', 'is-expanded');
        if (!hasDescription) return;

        const lines = normalized.split('\n');
        const plainLength = normalized.replace(/\s+/g, ' ').length;
        const isLong = lines.length > 5 || plainLength > 170;
        const expanded = !!state.runtimeDescExpanded;
        nodes.title.classList.toggle('is-collapsed', isLong && !expanded);
        nodes.title.classList.toggle('is-expanded', isLong && expanded);

        if (isLong && wrap) {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'photo-runtime-desc-toggle';
            toggle.dataset.runtimeDescToggle = '1';
            toggle.textContent = expanded ? '접기' : '더보기';
            wrap.appendChild(toggle);
        }
    }


    function renderRuntimeGallery(nodes) {
        if (!nodes || !nodes.gallery || !nodes.dots || !nodes.photoCount) return;
        const total = Array.isArray(state.photos) ? state.photos.length : 0;
        const singlePhoto = total <= 1;
        if (nodes.box) {
            nodes.box.classList.toggle('is-single-photo', singlePhoto);
            nodes.box.classList.toggle('has-multiple-photos', !singlePhoto);
        }
        if (total <= 1) {
            nodes.gallery.hidden = true;
            nodes.dots.innerHTML = '';
            nodes.photoCount.textContent = '';
            return;
        }
        const active = Math.max(0, Math.min(state.photoIndex || 0, total - 1));
        nodes.gallery.hidden = false;
        nodes.photoCount.textContent = `${active + 1}/${total}`;
        nodes.dots.innerHTML = Array.from({ length: total }, (_, index) => {
            const selected = index === active;
            return `<button type="button" class="photo-runtime-gallery-dot${selected ? ' active' : ''}" data-runtime-photo-dot="${index}" aria-label="${index + 1}번째 사진" aria-current="${selected ? 'true' : 'false'}"></button>`;
        }).join('');
    }

    function renderRuntimeLightbox() {
        if (!state.activePost) return false;
        const photo = state.photos[state.photoIndex] || {};
        const fallbackPath = pick(state.activePost, 'coverPath', 'COVER_PATH');
        const imagePath = pick(photo, 'filePath', 'FILE_PATH') || fallbackPath;
        if (!imagePath) return false;
        const nodes = runtimeLightboxNodes();
        styleRuntimeLightboxChildren(nodes);
        const desc = pick(state.activePost, 'description', 'DESCRIPTION') || '';
        const albumName = pick(state.activePost, 'albumName', 'ALBUM_NAME');
        const creatorName = postDisplayName(state.activePost);
        const createdAt = pick(state.activePost, 'createdAt', 'CREATED_AT') || '';
        const liked = Number(pick(state.activePost, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(state.activePost, 'likeCount', 'LIKE_COUNT') || 0);
        const commentCount = Number(pick(state.activePost, 'commentCount', 'COMMENT_COUNT') || 0);
        const canManage = canManagePost(state.activePost);
        const canMoveAlbum = canMovePostAlbum(state.activePost);
        const canToggleVisibility = normalizePostScope(state.activePost) === 'PERSONAL' && postOwnerId(state.activePost) === currentUserId;
        const currentVisibility = normalizeVisibility(pick(state.activePost, 'visibilityType', 'VISIBILITY_TYPE'));
        const isPublic = currentVisibility === 'FRIENDS';
        if (nodes.image) nodes.image.src = resolveAssetPath(imagePath);
        renderRuntimeDescription(nodes, desc);
        const runtimeSourceName = collectedSourceName(state.activePost);
        const runtimeSourceLabel = runtimeSourceName ? `원본 ${runtimeSourceName}` : '원본 사진';
        if (nodes.creator) {
            nodes.creator.textContent = creatorName;
        }
        if (nodes.meta) {
            const sourceMetaText = isCollectedCopyPost(state.activePost) ? runtimeSourceLabel : '';
            nodes.meta.textContent = [createdAt, sourceMetaText].filter(Boolean).join(' · ');
            nodes.meta.hidden = !nodes.meta.textContent;
        }
        if (nodes.collectedSource) {
            // 원본 표시는 액션 라인에 두면 공개 상태 배지가 밀려서 날짜 메타 라인으로 이동한다.
            nodes.collectedSource.textContent = '';
            nodes.collectedSource.hidden = true;
        }
        const scopeTagMarkup = state.activeTab !== 'moyo' ? runtimeDetailScopeTagMarkup(state.activePost) : '';
        const showAlbumName = !!albumName && state.activeTab !== 'moyo' && !isUnclassifiedAlbumName(albumName);
        const albumChipMarkup = showAlbumName ? `<span class="photo-runtime-album-chip"><i class="fa-solid fa-folder"></i><span>${esc(albumName)}</span></span>` : '';
        const detailMetaMarkup = `${scopeTagMarkup}${albumChipMarkup}`;
        if (nodes.album) {
            if (detailMetaMarkup) {
                nodes.album.innerHTML = detailMetaMarkup;
                nodes.album.hidden = false;
            } else {
                nodes.album.innerHTML = '';
                nodes.album.hidden = true;
            }
        }
        if (nodes.detailMeta) {
            nodes.detailMeta.hidden = !detailMetaMarkup;
        }
        if (nodes.visibilityBadge) {
            nodes.visibilityBadge.innerHTML = visibilityBadgeMarkup(state.activePost);
            nodes.visibilityBadge.hidden = false;
        }
        renderRuntimeAvatar(nodes.avatar, creatorName, profileImageOf(state.activePost));
        if (nodes.commentCount) nodes.commentCount.textContent = String(commentCount);
        if (nodes.prev) nodes.prev.hidden = state.photos.length < 2;
        if (nodes.next) nodes.next.hidden = state.photos.length < 2;
        renderRuntimeGallery(nodes);
        if (nodes.like) {
            nodes.like.classList.toggle('liked', liked);
            nodes.like.setAttribute('aria-pressed', String(liked));
            nodes.like.style.removeProperty('background');
            const icon = nodes.like.querySelector('i');
            if (icon) icon.className = `${liked ? 'fa-solid' : 'fa-regular'} fa-heart`;
        }
        if (nodes.likeCount) nodes.likeCount.textContent = String(likeCount);
        const trashMode = isTrashPost(state.activePost);
        if (nodes.manage) {
            nodes.manage.hidden = trashMode ? !canManage : !canManage;
            if (!canManage) closeRuntimeManageMenu();
        }
        if (nodes.menu) nodes.menu.hidden = true;
        if (nodes.menuToggle) nodes.menuToggle.setAttribute('aria-expanded', 'false');
        if (nodes.stats) nodes.stats.hidden = trashMode;
        if (nodes.commentSection) nodes.commentSection.hidden = trashMode;
        if (nodes.commentForm) nodes.commentForm.hidden = trashMode;
        if (nodes.collect) {
            const collectedCopy = isCollectedCopyPost(state.activePost);
            const collected = isCollectedPost(state.activePost) || collectedCopy;
            const ownerId = postOwnerId(state.activePost);
            const showCollect = collectedCopy || (!!state.activePost && !!ownerId && Number(ownerId) !== Number(currentUserId) && !isCollectedPost(state.activePost));
            nodes.collect.hidden = !showCollect;
            nodes.collect.disabled = false;
            nodes.collect.classList.toggle('is-collected', collected);
            nodes.collect.classList.toggle('is-collected-copy', collectedCopy);
            nodes.collect.setAttribute('aria-label', collected ? '담아가기 취소' : '담아가기');
            nodes.collect.setAttribute('title', collected ? '담아가기 취소' : '담아가기');
            const icon = nodes.collect.querySelector('i');
            if (icon) icon.className = collected ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
        }
        if (nodes.share) nodes.share.hidden = trashMode || !canOpenSharePanel(state.activePost);
        if (nodes.releaseShare) nodes.releaseShare.hidden = true;
        if (nodes.edit) nodes.edit.hidden = trashMode || !canManage;
        if (nodes.visibility) {
            nodes.visibility.hidden = trashMode || !canToggleVisibility;
            const icon = nodes.visibility.querySelector('i');
            const text = nodes.visibility.querySelector('span');
            if (icon) icon.className = isPublic ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
            if (text) text.textContent = isPublic ? '비공개 전환' : 'MOYO 공개';
        }
        if (nodes.move) nodes.move.hidden = trashMode || !canMoveAlbum;
        if (nodes.del) nodes.del.hidden = trashMode || !canManage;
        if (nodes.restore) nodes.restore.hidden = !trashMode || !canManage;
        if (nodes.permanent) nodes.permanent.hidden = !trashMode || !canManage;
        renderRuntimeComments();
        applyRuntimeLightboxStyle(nodes.box);
        document.body.style.overflow = 'hidden';
        return true;
    }

    function normalizePostDetailResponse(data, requestedPostId) {
        const post = data && data.post ? data.post : {};
        let photos = Array.isArray(data && data.photos) ? data.photos.filter(Boolean) : [];
        const coverPath = pick(post, 'coverPath', 'COVER_PATH');
        if (!photos.length && coverPath) {
            photos = [{
                postId: pick(post, 'postId', 'POST_ID') || requestedPostId,
                POST_ID: pick(post, 'postId', 'POST_ID') || requestedPostId,
                filePath: coverPath,
                FILE_PATH: coverPath
            }];
        }
        return { post, photos };
    }

    function showLightbox() {
        if (!el.lightbox) return;
        el.lightbox.hidden = false;
        el.lightbox.removeAttribute('hidden');
        el.lightbox.style.display = 'grid';
        document.body.style.overflow = 'hidden';
    }

    function hideLightbox() {
        if (!el.lightbox) return;
        el.lightbox.hidden = true;
        el.lightbox.setAttribute('hidden', '');
        el.lightbox.style.display = '';
        document.body.style.overflow = '';
    }

    async function openPost(id) {
        const postId = Number(id);
        if (!postId) return toast('사진 정보를 찾지 못했습니다.', true);
        try {
            const data = await request(`/api/photo-posts/${postId}`);
            const detail = normalizePostDetailResponse(data, postId);
            state.activePost = detail.post;
            state.photos = detail.photos;
            state.photoIndex = 0;
            state.runtimeDescExpanded = false;
            if (!renderRuntimeLightbox()) return toast('표시할 사진을 찾지 못했습니다.', true);
            await loadRuntimeComments(postId);
        } catch(e) {
            toast(e.message || '사진 상세를 열지 못했습니다.', true);
        }
    }

    function renderLightbox() {
        if (!state.activePost) return false;
        const photo = state.photos[state.photoIndex] || {};
        const fallbackPath = pick(state.activePost, 'coverPath', 'COVER_PATH');
        const imagePath = pick(photo, 'filePath', 'FILE_PATH') || fallbackPath;
        if (!imagePath) return false;

        const lightboxDesc = pick(state.activePost, 'description', 'DESCRIPTION') || '';
        const albumName = pick(state.activePost, 'albumName', 'ALBUM_NAME');
        const creatorName = pick(state.activePost, 'creatorName', 'CREATOR_NAME') || '';
        const createdAt = pick(state.activePost, 'createdAt', 'CREATED_AT') || '';
        const liked = Number(pick(state.activePost, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(state.activePost, 'likeCount', 'LIKE_COUNT') || 0);
        const canManage = canManagePost(state.activePost);
        const canMoveAlbum = canMovePostAlbum(state.activePost);
        const canToggleVisibility = normalizePostScope(state.activePost) === 'PERSONAL' && postOwnerId(state.activePost) === currentUserId;
        const currentVisibility = normalizeVisibility(pick(state.activePost, 'visibilityType', 'VISIBILITY_TYPE'));
        const isPublic = currentVisibility === 'FRIENDS';

        if (el.lightboxImage) el.lightboxImage.src = resolveAssetPath(imagePath);
        if (el.lightboxTitle) el.lightboxTitle.textContent = lightboxDesc;
        if (el.lightboxDescription) el.lightboxDescription.textContent = '';
        if (el.lightboxMeta) {
            const sourceName = collectedSourceName(state.activePost);
            const sourceText = isCollectedCopyPost(state.activePost) ? ` · ${sourceName ? `원본 ${sourceName}` : '원본 사진'}` : '';
            el.lightboxMeta.textContent = `${creatorName}${creatorName && createdAt ? ' · ' : ''}${createdAt}${albumName ? ` · ${albumName}` : ' · 앨범 없음'}${sourceText}`;
        }
        if (el.lightboxPrevButton) el.lightboxPrevButton.hidden = state.photos.length < 2;
        if (el.lightboxNextButton) el.lightboxNextButton.hidden = state.photos.length < 2;
        if (el.likePostButton) {
            el.likePostButton.classList.toggle('liked', liked);
            el.likePostButton.setAttribute('aria-pressed', String(liked));
            const icon = el.likePostButton.querySelector('i');
            if (icon) icon.className = `${liked ? 'fa-solid' : 'fa-regular'} fa-heart`;
        }
        if (el.lightboxLikeCount) el.lightboxLikeCount.textContent = String(likeCount);
        if (el.deletePostButton) { el.deletePostButton.hidden = state.activeTab === 'trash' || !canManage; el.deletePostButton.innerHTML = '<i class="fa-regular fa-trash-can"></i> 휴지통으로 이동'; }
        if (el.sharePostButton) el.sharePostButton.hidden = state.activeTab === 'trash' || !canOpenSharePanel(state.activePost);
        if (el.releasePostShareButton) el.releasePostShareButton.hidden = true;
        if (el.editPostButton) el.editPostButton.hidden = state.activeTab === 'trash' || !canManage;
        if (el.movePostButton) el.movePostButton.hidden = state.activeTab === 'trash' || !canMoveAlbum;
        return true;
    }
    function movePhoto(step){ if (!state.photos.length) return; state.photoIndex = (state.photoIndex + step + state.photos.length) % state.photos.length; if (document.getElementById('photoRuntimeLightbox') && document.getElementById('photoRuntimeLightbox').getAttribute('aria-hidden') === 'false') renderRuntimeLightbox(); else renderLightbox(); }

    async function releaseReceivedShareById(shareId) {
        const id = Number(shareId);
        if (!id) return toast('해지할 공유 정보를 찾지 못했습니다.', true);
        if (!confirm('공유를 해지하시겠습니까?')) return;
        try {
            const body = new URLSearchParams({ shareId: String(id) });
            const result = await request('/share/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body
            });
            if (result && result.success === false) throw new Error(result.message || '공유를 해지하지 못했습니다.');
            toast('공유를 해지했습니다.');
            document.querySelectorAll('.photo-share-release-only').forEach(node => node.remove());
            hideRuntimeLightbox();
            hideLightbox();
            await loadAll();
        } catch (error) {
            toast(error.message || '공유를 해지하지 못했습니다.', true);
        }
    }

    function releaseReceivedShareFromActivePost() {
        return releaseReceivedShareById(receivedShareId(state.activePost));
    }

    async function openActivePostShareModal() {
        if (!state.activePost) return toast('공유할 사진을 찾지 못했습니다.', true);
        const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
        if (!postId) return toast('공유할 사진 정보를 찾지 못했습니다.', true);
        if (!canOpenSharePanel(state.activePost)) return toast('공유할 수 없는 사진입니다.', true);
        if (canReleaseReceivedShare(state.activePost) && !canSharePost(state.activePost)) {
            return mountReceivedShareReleaseModal(state.activePost);
        }
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') {
            return toast('공유 모달을 불러오지 못했습니다. 페이지를 새로고침해주세요.', true);
        }
        try {
            const shareMode = shareModeForPost(state.activePost);
            const data = await request(`/share/api/targets?contentType=PHOTO&contentId=${encodeURIComponent(postId)}&shareMode=${encodeURIComponent(shareMode)}`);
            mountPhotoShareModal(postId, Array.isArray(data.shares) ? data.shares : [], shareMode, state.activePost);
        } catch (error) {
            toast(error.message || '공유 상태를 불러오지 못했습니다.', true);
        }
    }

    async function openPostShareModalById(postId) {
        const id = Number(postId);
        if (!id) return toast('공유할 사진 정보를 찾지 못했습니다.', true);
        try {
            let post = findPostById(id);
            if (!post) {
                const data = await request(`/api/photo-posts/${id}`);
                const detail = normalizePostDetailResponse(data, id);
                post = detail.post;
            }
            if (!post) return toast('공유할 사진 정보를 찾지 못했습니다.', true);
            if (!canOpenSharePanel(post)) return toast('공유할 수 없는 사진입니다.', true);
            state.activePost = post;
            return openActivePostShareModal();
        } catch (error) {
            toast(error.message || '공유할 사진 정보를 불러오지 못했습니다.', true);
        }
    }

    function elevatePhotoShareModal(uid) {
        const modal = document.getElementById(`${uid}Modal`);
        if (!modal) return;
        modal.classList.add('photo-post-share-modal--over-detail');
        modal.style.setProperty('z-index', '2147483647', 'important');
    }

    function mountReceivedShareReleaseModal(post) {
        const shareId = receivedShareId(post);
        if (!shareId) return toast('해지할 공유 정보를 찾지 못했습니다.', true);
        let mount = document.getElementById('photoAlbumShareMount');
        if (!mount) {
            mount = document.createElement('div');
            mount.id = 'photoAlbumShareMount';
            document.body.appendChild(mount);
        }
        const uid = `photoAlbumRelease${shareId}_${Date.now()}`;
        const creator = pick(post, 'creatorName', 'CREATOR_NAME') || '작성자';
        mount.innerHTML = `
            <div id="${esc(uid)}Modal" class="note-write-share-modal moyo-share-modal photo-post-share-modal photo-share-release-only">
                <div class="note-write-share-backdrop" data-photo-release-close></div>
                <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="${esc(uid)}Title">
                    <div class="note-write-share-modal-head">
                        <div><h3 id="${esc(uid)}Title">공유</h3><p>공유받은 사진입니다.</p></div>
                        <button type="button" class="note-write-share-close" data-photo-release-close aria-label="닫기">×</button>
                    </div>
                    <div class="photo-share-release-panel">
                        <div class="photo-share-release-icon"><i class="fa-regular fa-paper-plane"></i></div>
                        <strong>${esc(creator)}님에게 공유받은 사진입니다.</strong>
                        <p>이 공유를 해지하면 내 사진 목록에서 더 이상 보이지 않습니다.</p>
                    </div>
                    <div class="note-write-share-modal-actions">
                        <div><button type="button" id="${esc(uid)}Release" class="note-gradient-btn photo-share-release-apply">공유 해지</button></div>
                    </div>
                </section>
            </div>`;
        const modal = document.getElementById(`${uid}Modal`);
        const close = () => { if (modal) modal.remove(); };
        modal?.querySelectorAll('[data-photo-release-close]').forEach(node => node.addEventListener('click', close));
        const button = document.getElementById(`${uid}Release`);
        button?.addEventListener('click', () => releaseReceivedShareById(shareId));
        modal?.classList.add('photo-post-share-modal--over-detail');
        modal?.style.setProperty('z-index', '2147483647', 'important');
    }

    function mountPhotoShareModal(postId, shares, shareMode, post) {
        let mount = document.getElementById('photoAlbumShareMount');
        if (!mount) {
            mount = document.createElement('div');
            mount.id = 'photoAlbumShareMount';
            document.body.appendChild(mount);
        }
        const uid = `photoAlbumShare${postId}_${Date.now()}`;
        mount.innerHTML = photoShareModalMarkup(uid, shares || [], shareMode, post || state.activePost);
        const openButton = document.getElementById(`${uid}Open`);
        window.MoyoShareModal.init({
            contentType: 'PHOTO',
            contentId: postId,
            shareMode: String(shareMode || 'PERMISSION').toUpperCase(),
            persist: true,
            reloadOnPersist: false,
            bodyOpenClass: 'note-share-modal-open',
            currentUserId: String(currentUserId || ''),
            ownerUserId: String(postOwnerId(post || state.activePost) || ''),
            blockedUserIds: [String(postOwnerId(post || state.activePost) || '')].filter(Boolean),
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
                if (result && result.mode === 'SHARE_RELEASE') {
                    toast('공유를 해지했습니다.');
                } else if (String(shareMode || '').toUpperCase() === 'FEED') {
                    toast('게시물을 보냈습니다.');
                } else {
                    toast('공유 요청을 보냈습니다.');
                }
            }
        });
        elevatePhotoShareModal(uid);
        setTimeout(() => {
            if (!openButton) return;
            openButton.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
            elevatePhotoShareModal(uid);
        }, 0);
    }

    function photoShareModalMarkup(uid, shares, shareMode, post) {
        return `
            <button type="button" id="${esc(uid)}Open" hidden>공유 열기</button>
            <button type="button" id="${esc(uid)}PermissionDummy" hidden>권한</button>
            <div id="${esc(uid)}HiddenFields" hidden></div>
            <div id="${esc(uid)}InitialSource" hidden>${(shares || []).map(photoShareInitialRow).join('')}</div>
            <div id="${esc(uid)}Modal" class="note-write-share-modal moyo-share-modal photo-post-share-modal" data-current-user-id="${esc(currentUserId || '')}" data-owner-user-id="${esc(postOwnerId(post) || '')}" data-share-mode-type="${esc(String(shareMode || 'PERMISSION').toUpperCase())}" hidden>
                <div class="note-write-share-backdrop" data-note-share-close></div>
                <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="${esc(uid)}Title">
                    <div class="note-write-share-modal-head">
                        <div>
                            <h3 id="${esc(uid)}Title">공유</h3>
                            <p>${String(shareMode || '').toUpperCase() === 'FEED' ? '받는 사람에게 MOYO 피드 게시물을 보냅니다.' : '받는 사람을 선택해 공유 요청을 보냅니다.'}</p>
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
                            <div class="note-write-share-subtitle">받는 사람</div>
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

    function photoShareInitialRow(share) {
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


    function updatePostLikeState(postId, liked, likeCount) {
        const apply = post => {
            if (Number(pick(post, 'postId', 'POST_ID')) !== Number(postId)) return;
            post.likedByMe = liked ? 1 : 0;
            post.LIKED_BY_ME = liked ? 1 : 0;
            post.likeCount = likeCount;
            post.LIKE_COUNT = likeCount;
        };
        state.posts.forEach(apply);
        state.albumPosts.forEach(apply);
        if (state.activePost) apply(state.activePost);
    }

    async function togglePostLike(postId) {
        try {
            const result = await request('/api/reactions/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentType: 'PHOTO_POST', contentId: postId, reactionType: 'LIKE', currentUserId }) });
            const liked = !!result.liked;
            const likeCount = Number(result.likeCount || 0);
            updatePostLikeState(postId, liked, likeCount);
            refreshPosts();
            if (state.album && !el.albumDetailView.hidden) renderPosts(state.albumPosts, el.albumPostGrid);
            if (state.activePost && Number(pick(state.activePost,'postId','POST_ID')) === Number(postId)) {
                const runtimeBox = document.getElementById('photoRuntimeLightbox');
                if (runtimeBox && runtimeBox.getAttribute('aria-hidden') === 'false') renderRuntimeLightbox();
                else renderLightbox();
            }
        } catch (e) {
            toast(e.message, true);
        }
    }

    async function collectPost(postId) {
        const id = Number(postId);
        if (!id) return toast('담아갈 사진 정보를 찾지 못했습니다.', true);
        const post = findPostById(id) || (state.activePost && Number(pick(state.activePost, 'postId', 'POST_ID')) === id ? state.activePost : null);
        if (post && isCollectedCopyPost(post)) {
            const sourceId = collectedSourcePostId(post);
            if (!sourceId) return toast('원본 사진 정보를 찾지 못했습니다.', true);
            return cancelCollectPost(sourceId);
        }
        if (post && isCollectedPost(post)) return cancelCollectPost(id);
        if (post && !canCollectPost(post)) return toast('내가 올린 사진은 이미 내 사진첩에 있습니다.', true);
        try {
            document.querySelectorAll(`[data-collect-post-id=\"${id}\"], [data-runtime-collect]`).forEach(button => button.disabled = true);
            const result = await request(`/api/photo-posts/${id}/collect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ albumId: null })
            });
            markPostCollected(id);
            toast('내 개인 사진첩에 담았습니다.');
            if (state.activePost && Number(pick(state.activePost, 'postId', 'POST_ID')) === id) {
                const runtimeBox = document.getElementById('photoRuntimeLightbox');
                if (runtimeBox && runtimeBox.getAttribute('aria-hidden') === 'false') renderRuntimeLightbox();
                else renderLightbox();
            }
            renderPosts(state.posts, el.postGrid);
            if (state.album && !el.albumDetailView.hidden) renderPosts(state.albumPosts, el.albumPostGrid);
            if (scopeType === 'PERSONAL' && Number(scopeId) === Number(currentUserId)) {
                await loadAll();
            }
            return result;
        } catch (e) {
            toast(e.message || '사진을 담아가지 못했습니다.', true);
        } finally {
            document.querySelectorAll(`[data-collect-post-id=\"${id}\"], [data-runtime-collect]`).forEach(button => {
                button.disabled = false;
            });
        }
    }

    async function cancelCollectPost(postId) {
        const id = Number(postId);
        if (!id) return toast('담아가기 정보를 찾지 못했습니다.', true);
        try {
            document.querySelectorAll(`[data-collect-post-id=\"${id}\"], [data-runtime-collect]`).forEach(button => button.disabled = true);
            const result = await request(`/api/photo-posts/${id}/collect`, { method: 'DELETE' });
            markPostUncollected(id);
            toast('담아가기를 취소했습니다.');
            if (state.activePost && Number(pick(state.activePost, 'postId', 'POST_ID')) === id) {
                const runtimeBox = document.getElementById('photoRuntimeLightbox');
                if (runtimeBox && runtimeBox.getAttribute('aria-hidden') === 'false') renderRuntimeLightbox();
                else renderLightbox();
            }
            renderPosts(state.posts, el.postGrid);
            if (state.album && !el.albumDetailView.hidden) renderPosts(state.albumPosts, el.albumPostGrid);
            if (scopeType === 'PERSONAL' && Number(scopeId) === Number(currentUserId)) {
                await loadAll();
            }
            return result;
        } catch (e) {
            toast(e.message || '담아가기를 취소하지 못했습니다.', true);
        } finally {
            document.querySelectorAll(`[data-collect-post-id=\"${id}\"], [data-runtime-collect]`).forEach(button => button.disabled = false);
        }
    }

    function showEditPostModal() {
        if (!state.activePost) return;
        const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
        if (!postId) return;
        window.location.href = `${contextPath}/photo-post/edit/${postId}`;
    }

    function applyPostPatch(postId, patch) {
        const id = Number(postId);
        const apply = post => {
            if (Number(pick(post, 'postId', 'POST_ID')) !== id) return;
            Object.assign(post, patch || {});
        };
        state.posts.forEach(apply);
        state.albumPosts.forEach(apply);
        if (state.activePost && Number(pick(state.activePost, 'postId', 'POST_ID')) === id) {
            Object.assign(state.activePost, patch || {});
        }
    }


    function findPostById(postId) {
        const id = Number(postId);
        return state.posts.find(post => Number(pick(post, 'postId', 'POST_ID')) === id)
            || state.albumPosts.find(post => Number(pick(post, 'postId', 'POST_ID')) === id)
            || (state.activePost && Number(pick(state.activePost, 'postId', 'POST_ID')) === id ? state.activePost : null);
    }

    function closePostListMenus(exceptId) {
        document.querySelectorAll('[data-post-menu]').forEach(menu => {
            if (exceptId && String(menu.dataset.postMenu) === String(exceptId)) return;
            menu.hidden = true;
        });
        document.querySelectorAll('[data-post-menu-toggle]').forEach(button => {
            if (exceptId && String(button.dataset.postMenuToggle) === String(exceptId)) return;
            button.setAttribute('aria-expanded', 'false');
        });
    }

    function togglePostListMenu(postId) {
        const id = String(postId || '');
        const menu = document.querySelector(`[data-post-menu="${CSS.escape(id)}"]`);
        const button = document.querySelector(`[data-post-menu-toggle="${CSS.escape(id)}"]`);
        if (!menu || !button) return;
        const willOpen = menu.hidden;
        closePostListMenus(willOpen ? id : null);
        menu.hidden = !willOpen;
        button.setAttribute('aria-expanded', String(willOpen));
    }

    async function openPostForListAction(postId, action) {
        const id = Number(postId);
        if (!id) return toast('사진 정보를 찾지 못했습니다.', true);

        // 리스트 메뉴 액션은 상세 모달을 거치지 않고 바로 실행한다.
        if (action === 'edit') {
            window.location.href = `${contextPath}/photo-post/edit/${id}`;
            return;
        }

        try {
            let post = findPostById(id);
            if (!post) {
                const data = await request(`/api/photo-posts/${id}`);
                const detail = normalizePostDetailResponse(data, id);
                post = detail.post;
            }
            if (!post) return toast('사진 정보를 찾지 못했습니다.', true);
            state.activePost = post;

            if (action === 'move') return showMoveAlbumModal({ useRuntimeLayer: false, forceNormalModal: true });
            if (action === 'delete') return deletePost();
            if (action === 'restore') return restoreActivePost();
            if (action === 'permanent') return permanentlyDeleteActivePost();
        } catch (e) {
            toast(e.message || '사진 정보를 불러오지 못했습니다.', true);
        }
    }

    async function togglePostVisibilityById(postId) {
        const post = findPostById(postId);
        if (!post) return toast('사진 정보를 찾지 못했습니다.', true);
        const id = Number(pick(post, 'postId', 'POST_ID'));
        if (!id) return toast('사진 정보를 찾지 못했습니다.', true);
        if (normalizePostScope(post) !== 'PERSONAL' || postOwnerId(post) !== currentUserId) {
            return toast('내 개인 사진만 공개 여부를 변경할 수 있습니다.', true);
        }
        const currentVisibility = normalizeVisibility(pick(post, 'visibilityType', 'VISIBILITY_TYPE'));
        const nextVisibility = currentVisibility === 'FRIENDS' ? 'PRIVATE' : 'FRIENDS';
        try {
            const result = await request(`/api/photo-posts/${id}/visibility`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibilityType: nextVisibility })
            });
            const updatedPost = result && result.post ? result.post : { visibilityType: nextVisibility, VISIBILITY_TYPE: nextVisibility };
            applyPostPatch(id, updatedPost);
            refreshPosts();
            if (state.album && !el.albumDetailView.hidden) renderPosts(state.albumPosts, el.albumPostGrid);
            if (state.activePost && Number(pick(state.activePost, 'postId', 'POST_ID')) === id) renderRuntimeLightbox();
            toast(nextVisibility === 'FRIENDS' ? 'MOYO 피드에 공개했습니다.' : '나만 보기로 전환했습니다.');
        } catch (e) {
            toast(e.message || '공개 설정을 변경하지 못했습니다.', true);
        }
    }

    async function toggleRuntimePostVisibility() {
        if (!state.activePost) return;
        const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
        if (!postId) return toast('사진 정보를 찾지 못했습니다.', true);
        if (normalizePostScope(state.activePost) !== 'PERSONAL' || postOwnerId(state.activePost) !== currentUserId) {
            return toast('내 개인 사진만 공개 여부를 변경할 수 있습니다.', true);
        }
        const currentVisibility = normalizeVisibility(pick(state.activePost, 'visibilityType', 'VISIBILITY_TYPE'));
        const nextVisibility = currentVisibility === 'FRIENDS' ? 'PRIVATE' : 'FRIENDS';
        try {
            const result = await request(`/api/photo-posts/${postId}/visibility`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibilityType: nextVisibility })
            });
            const updatedPost = result && result.post ? result.post : { visibilityType: nextVisibility, VISIBILITY_TYPE: nextVisibility };
            applyPostPatch(postId, updatedPost);
            refreshPosts();
            if (state.album && !el.albumDetailView.hidden) renderPosts(state.albumPosts, el.albumPostGrid);
            renderRuntimeLightbox();
            toast(nextVisibility === 'FRIENDS' ? 'MOYO 피드에 공개했습니다.' : '나만 보기로 전환했습니다.');
        } catch (e) {
            toast(e.message || '공개 설정을 변경하지 못했습니다.', true);
        }
    }

    async function saveEditedPost() {
        if (!state.activePost) return;
        const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
        const albumIdValue = pick(state.activePost, 'albumId', 'ALBUM_ID');
        const albumId = albumIdValue == null || albumIdValue === '' ? null : Number(albumIdValue);
        el.saveEditPostButton.disabled = true;
        try {
            await request(`/api/photo-posts/${postId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    albumId,
                    title: el.editPostTitleInput.value.trim(),
                    description: el.editPostDescriptionInput.value.trim()
                })
            });
            const data = await request(`/api/photo-posts/${postId}`);
            state.activePost = data.post;
            state.photos = data.photos || state.photos;
            renderLightbox();
            closeModal(el.editPostModal);
            toast('게시물 내용을 수정했습니다.');
            const openedAlbumId = state.album ? Number(pick(state.album, 'albumId', 'ALBUM_ID')) : null;
            await loadAll();
            if (openedAlbumId && !el.albumDetailView.hidden) await openAlbum(openedAlbumId);
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.saveEditPostButton.disabled = false;
        }
    }

    function runtimeMoveAlbumLayer() {
        const nodes = runtimeLightboxNodes();
        if (!nodes.box) return null;
        let layer = document.getElementById('photoRuntimeMoveAlbumLayer');
        if (!layer) {
            nodes.box.insertAdjacentHTML('beforeend', `
                <div id="photoRuntimeMoveAlbumLayer" class="photo-runtime-move-layer" hidden>
                    <div class="photo-runtime-move-card" role="dialog" aria-modal="true" aria-label="앨범으로 이동">
                        <div class="photo-runtime-move-head">
                            <div><strong>앨범으로 이동</strong><small>이 사진 묶음을 다른 앨범으로 옮깁니다.</small></div>
                            <button type="button" class="photo-runtime-move-close" data-runtime-move-close aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div id="photoRuntimeMoveAlbumList" class="photo-runtime-move-list"></div>
                        <div class="photo-runtime-move-actions">
                            <button type="button" class="photo-secondary-button" data-runtime-move-close>취소</button>
                            <button type="button" class="photo-primary-button" id="photoRuntimeMoveConfirm">이동</button>
                        </div>
                    </div>
                </div>`);
            layer = document.getElementById('photoRuntimeMoveAlbumLayer');
            layer.addEventListener('click', event => {
                if (event.target === layer || event.target.closest('[data-runtime-move-close]')) return hideRuntimeMoveAlbumLayer();
                const option = event.target.closest('[data-runtime-move-album]');
                if (option) {
                    const raw = option.dataset.runtimeMoveAlbum;
                    state.moveAlbumId = raw ? Number(raw) : null;
                    renderRuntimeMoveAlbumOptions(state.moveAlbumId);
                    return;
                }
                if (event.target.closest('#photoRuntimeMoveConfirm')) return movePostAlbumFromRuntimeLayer();
            });
        }
        return layer;
    }

    function renderRuntimeMoveAlbumOptions(selectedAlbumId) {
        const list = document.getElementById('photoRuntimeMoveAlbumList');
        if (!list) return;
        const current = selectedAlbumId == null ? null : Number(selectedAlbumId);
        const albums = [{ id: null, name: '앨범 없음', description: '최근 사진에만 표시됩니다.' }].concat(
            moveAlbumsForPost(state.activePost).map(album => ({
                id: Number(pick(album, 'albumId', 'ALBUM_ID')),
                name: pick(album, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범',
                description: `${Number(pick(album, 'photoCount', 'PHOTO_COUNT') || 0)}장 · ${Number(pick(album, 'postCount', 'POST_COUNT') || 0)}개 묶음`
            }))
        );
        list.innerHTML = albums.map(album => {
            const selected = album.id === current;
            const value = album.id == null ? '' : String(album.id);
            return `<button type="button" class="photo-runtime-move-option${selected ? ' selected' : ''}" data-runtime-move-album="${esc(value)}">
                <span class="photo-runtime-move-icon"><i class="${album.id == null ? 'fa-regular fa-folder-open' : 'fa-solid fa-folder'}"></i></span>
                <span class="photo-runtime-move-text"><strong>${esc(album.name)}</strong><small>${esc(album.description)}</small></span>
                <span class="photo-runtime-move-check"><i class="fa-solid fa-check"></i></span>
            </button>`;
        }).join('');
    }

    function showRuntimeMoveAlbumLayer() {
        if (!state.activePost) return;
        const layer = runtimeMoveAlbumLayer();
        if (!layer) return toast('앨범 이동 창을 열지 못했습니다.', true);
        const currentAlbumId = Number(pick(state.activePost, 'albumId', 'ALBUM_ID')) || null;
        state.moveAlbumId = currentAlbumId;
        renderRuntimeMoveAlbumOptions(currentAlbumId);
        layer.hidden = false;
        layer.classList.add('is-open');
    }

    function hideRuntimeMoveAlbumLayer() {
        const layer = document.getElementById('photoRuntimeMoveAlbumLayer');
        if (!layer) return;
        layer.hidden = true;
        layer.classList.remove('is-open');
    }

    async function movePostAlbumFromRuntimeLayer() {
        if (!state.activePost) return;
        const nextAlbumId = state.moveAlbumId == null ? null : Number(state.moveAlbumId);
        const currentAlbumId = Number(pick(state.activePost, 'albumId', 'ALBUM_ID')) || null;
        if (nextAlbumId === currentAlbumId) {
            hideRuntimeMoveAlbumLayer();
            return toast('현재 선택된 앨범입니다.');
        }
        const confirmButton = document.getElementById('photoRuntimeMoveConfirm');
        if (confirmButton) confirmButton.disabled = true;
        try {
            const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
            await request(`/api/photo-posts/${postId}/album`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ albumId: nextAlbumId })
            });
            hideRuntimeMoveAlbumLayer();
            toast(nextAlbumId ? '선택한 앨범으로 이동했습니다.' : '앨범에서 꺼냈습니다.');
            const data = await request(`/api/photo-posts/${postId}`);
            const detail = normalizePostDetailResponse(data, postId);
            state.activePost = detail.post;
            state.photos = detail.photos;
            renderRuntimeLightbox();
            await loadAll();
        } catch (e) {
            toast(e.message || '앨범 이동에 실패했습니다.', true);
        } finally {
            if (confirmButton) confirmButton.disabled = false;
        }
    }

    function renderMoveAlbumOptions(selectedAlbumId) {
        if (!el.moveAlbumList) return;
        const options = [{ id: null, name: '앨범 없음', description: '최근 사진에만 표시됩니다.' }].concat(
            moveAlbumsForPost(state.activePost).map(album => ({
                id: Number(pick(album, 'albumId', 'ALBUM_ID')),
                name: pick(album, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범',
                albumDescription: pick(album, 'albumDescription', 'ALBUM_DESCRIPTION') || '',
                createdBy: Number(pick(album, 'createdBy', 'CREATED_BY')),
                description: `${Number(pick(album, 'photoCount', 'PHOTO_COUNT') || 0)}장 · ${Number(pick(album, 'postCount', 'POST_COUNT') || 0)}개 묶음`
            }))
        );
        setHTML(el.moveAlbumList, options.map(option => {
            const checked = option.id === selectedAlbumId;
            const value = option.id == null ? '' : String(option.id);
            const canEditAlbum = option.id != null && (isAdmin || option.createdBy === currentUserId);
            const editing = option.id != null && Number(state.editingMoveAlbumId) === Number(option.id);
            const titleContent = editing
                ? `<span class="move-album-inline-edit"><input type="text" class="move-album-inline-input" data-inline-album-name value="${esc(option.name)}" maxlength="100" aria-label="앨범 이름"><button type="button" class="move-album-inline-save" data-save-inline-album="${option.id}">저장</button><button type="button" class="move-album-inline-cancel" data-cancel-inline-album>취소</button></span>`
                : `<span class="move-album-title-row"><strong>${esc(option.name)}</strong>${canEditAlbum ? `<button type="button" class="move-album-edit-button" data-edit-album-id="${option.id}" aria-label="${esc(option.name)} 이름 수정"><i class="fa-regular fa-pen-to-square"></i></button>` : ''}</span>`;
            return `<div class="move-album-option${checked ? ' selected' : ''}${canEditAlbum ? ' has-edit-button' : ''}${editing ? ' is-editing' : ''}" data-album-option><input type="radio" name="moveAlbum" value="${value}" ${checked ? 'checked' : ''}><span class="move-album-icon"><i class="${option.id == null ? 'fa-regular fa-folder-open' : 'fa-solid fa-folder'}"></i></span><span class="move-album-text">${titleContent}<small>${esc(option.description)}</small></span><span class="move-album-check"><i class="fa-solid fa-check"></i></span></div>`;
        }).join(''));
    }

    function closeMoveAlbumCreate() {
        el.moveAlbumCreatePanel.hidden = true;
        el.moveNewAlbumName.value = '';
        el.openMoveAlbumCreateButton.hidden = false;
    }

    function closeMoveAlbumEdit() {
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        const selectedAlbumId = selected && selected.value ? Number(selected.value) : null;
        state.editingMoveAlbumId = null;
        if (el.moveAlbumEditPanel) el.moveAlbumEditPanel.hidden = true;
        if (el.moveEditAlbumName) el.moveEditAlbumName.value = '';
        renderMoveAlbumOptions(selectedAlbumId);
    }

    function showMoveAlbumEdit(albumId) {
        const album = state.albums.find(item => Number(pick(item, 'albumId', 'ALBUM_ID')) === Number(albumId));
        if (!album) return toast('앨범 정보를 찾을 수 없습니다.', true);
        const creatorId = Number(pick(album, 'createdBy', 'CREATED_BY'));
        if (!isAdmin && creatorId !== currentUserId) return toast('앨범 이름을 수정할 권한이 없습니다.', true);
        closeMoveAlbumCreate();
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        const selectedAlbumId = selected && selected.value ? Number(selected.value) : null;
        state.editingMoveAlbumId = Number(albumId);
        renderMoveAlbumOptions(selectedAlbumId);
        setTimeout(() => {
            const input = el.moveAlbumList.querySelector('[data-inline-album-name]');
            if (input) { input.focus(); input.select(); }
        }, 0);
    }

    async function saveMoveAlbumName() {
        const albumId = state.editingMoveAlbumId;
        const inlineInput = el.moveAlbumList.querySelector('[data-inline-album-name]');
        const albumName = (inlineInput ? inlineInput.value : el.moveEditAlbumName.value).trim();
        if (!albumId) return;
        if (!albumName) {
            el.moveEditAlbumName.focus();
            return toast('앨범 이름을 입력해주세요.', true);
        }
        const album = state.albums.find(item => Number(pick(item, 'albumId', 'ALBUM_ID')) === Number(albumId));
        if (!album) return toast('앨범 정보를 찾을 수 없습니다.', true);
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        const selectedAlbumId = selected && selected.value ? Number(selected.value) : null;
        el.saveMoveAlbumEditButton.disabled = true;
        try {
            await request(`/api/photo-albums/${albumId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    scopeType,
                    scopeId,
                    albumName,
                    albumDescription: pick(album, 'albumDescription', 'ALBUM_DESCRIPTION') || ''
                })
            });
            state.albums = await request(`/api/photo-albums?scopeType=${encodeURIComponent(scopeType)}&scopeId=${scopeId}`);
            renderAlbums();
            renderAlbumChips();
            fillAlbumSelect();
            state.editingMoveAlbumId = null;
            renderMoveAlbumOptions(selectedAlbumId);
            toast('앨범 이름을 수정했습니다.');
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.saveMoveAlbumEditButton.disabled = false;
        }
    }


    function ensureMoveAlbumModalDom() {
        let modal = document.getElementById('moveAlbumModal');
        if (modal) return modal;
        document.body.insertAdjacentHTML('beforeend', `
            <div id="moveAlbumModal" class="photo-modal-backdrop" hidden aria-hidden="true">
                <div class="photo-modal photo-move-modal" role="dialog" aria-modal="true" aria-labelledby="moveAlbumModalTitle">
                    <div class="photo-modal-header">
                        <h2 id="moveAlbumModalTitle">앨범으로 이동</h2>
                        <button type="button" class="photo-icon-button" data-close="moveAlbumModal" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="photo-modal-body">
                        <div class="move-album-toolbar">
                            <p class="move-album-guide">이 사진 묶음 전체를 현재 공간의 다른 앨범으로 옮깁니다.</p>
                            <button type="button" class="move-new-album-button" id="openMoveAlbumCreateButton"><i class="fa-solid fa-plus"></i> 새 앨범</button>
                        </div>
                        <div id="moveAlbumCreatePanel" class="move-album-create" hidden>
                            <label for="moveNewAlbumName">새 앨범 이름</label>
                            <div class="move-album-create-row">
                                <input type="text" id="moveNewAlbumName" maxlength="100" autocomplete="off" placeholder="앨범 이름">
                                <button type="button" class="photo-secondary-button" id="cancelMoveAlbumCreateButton">취소</button>
                                <button type="button" class="photo-primary-button" id="createMoveAlbumButton">생성</button>
                            </div>
                        </div>
                        <div id="moveAlbumEditPanel" class="move-album-create move-album-edit" hidden>
                            <label for="moveEditAlbumName">앨범 이름 수정</label>
                            <div class="move-album-create-row">
                                <input type="text" id="moveEditAlbumName" maxlength="100" autocomplete="off" placeholder="앨범 이름">
                                <button type="button" class="photo-secondary-button" id="cancelMoveAlbumEditButton">취소</button>
                                <button type="button" class="photo-primary-button" id="saveMoveAlbumEditButton">저장</button>
                            </div>
                        </div>
                        <div id="moveAlbumList" class="move-album-list" tabindex="-1"></div>
                    </div>
                    <div class="photo-modal-footer">
                        <button type="button" class="photo-secondary-button" data-close="moveAlbumModal">취소</button>
                        <button type="button" class="photo-primary-button" id="confirmMoveAlbumButton">이동</button>
                    </div>
                </div>
            </div>`);
        return document.getElementById('moveAlbumModal');
    }

    function refreshMoveAlbumModalRefs() {
        ensureMoveAlbumModalDom();
        el.moveAlbumModal = document.getElementById('moveAlbumModal') || el.moveAlbumModal;
        el.moveAlbumList = document.getElementById('moveAlbumList') || el.moveAlbumList;
        el.confirmMoveAlbumButton = document.getElementById('confirmMoveAlbumButton') || el.confirmMoveAlbumButton;
        el.openMoveAlbumCreateButton = document.getElementById('openMoveAlbumCreateButton') || el.openMoveAlbumCreateButton;
        el.moveAlbumCreatePanel = document.getElementById('moveAlbumCreatePanel') || el.moveAlbumCreatePanel;
        el.moveNewAlbumName = document.getElementById('moveNewAlbumName') || el.moveNewAlbumName;
        el.cancelMoveAlbumCreateButton = document.getElementById('cancelMoveAlbumCreateButton') || el.cancelMoveAlbumCreateButton;
        el.createMoveAlbumButton = document.getElementById('createMoveAlbumButton') || el.createMoveAlbumButton;
        el.moveAlbumEditPanel = document.getElementById('moveAlbumEditPanel') || el.moveAlbumEditPanel;
        el.moveEditAlbumName = document.getElementById('moveEditAlbumName') || el.moveEditAlbumName;
        el.cancelMoveAlbumEditButton = document.getElementById('cancelMoveAlbumEditButton') || el.cancelMoveAlbumEditButton;
        el.saveMoveAlbumEditButton = document.getElementById('saveMoveAlbumEditButton') || el.saveMoveAlbumEditButton;
        return !!(el.moveAlbumModal && el.moveAlbumList);
    }

    function showMoveAlbumModal(options = {}) {
        if (!state.activePost) return toast('사진 정보를 찾지 못했습니다.', true);
        if (!canMovePostAlbum(state.activePost)) return toast('개인/그룹/프로젝트 사진에서만 앨범 이동을 사용할 수 있습니다.', true);
        const modalOptions = typeof options === 'boolean' ? { useRuntimeLayer: options } : (options || {});
        const runtimeBox = document.getElementById('photoRuntimeLightbox');
        const runtimeOpen = runtimeBox && runtimeBox.getAttribute('aria-hidden') === 'false';

        // 앨범 이동은 리스트/상세 모두 같은 일반 모달을 사용한다.
        // 런타임 상세 안에서 열 때만 z-index를 올려 위에 덮는다.
        refreshMoveAlbumModalRefs();
        if (!el.moveAlbumModal || !el.moveAlbumList) return toast('앨범 이동 모달을 찾지 못했습니다.', true);

        const currentAlbumId = Number(pick(state.activePost, 'albumId', 'ALBUM_ID')) || null;
        state.moveAlbumId = currentAlbumId;
        state.editingMoveAlbumId = null;
        if (el.moveAlbumCreatePanel) el.moveAlbumCreatePanel.hidden = true;
        if (el.moveNewAlbumName) el.moveNewAlbumName.value = '';
        if (el.openMoveAlbumCreateButton) el.openMoveAlbumCreateButton.hidden = false;
        if (el.moveAlbumEditPanel) el.moveAlbumEditPanel.hidden = true;
        if (el.moveEditAlbumName) el.moveEditAlbumName.value = '';
        renderMoveAlbumOptions(currentAlbumId);

        document.body.appendChild(el.moveAlbumModal);
        el.moveAlbumModal.classList.toggle('photo-modal-backdrop--over-runtime', !!runtimeOpen);
        if (runtimeOpen) {
            el.moveAlbumModal.style.setProperty('z-index', '2147483647', 'important');
        } else {
            el.moveAlbumModal.style.removeProperty('z-index');
        }
        openModal(el.moveAlbumModal);
        if (el.moveAlbumList) el.moveAlbumList.focus && el.moveAlbumList.focus();
    }

    async function createAlbumFromMoveModal() {
        const albumName = el.moveNewAlbumName.value.trim();
        if (!albumName) {
            el.moveNewAlbumName.focus();
            return toast('앨범 이름을 입력해주세요.', true);
        }
        el.createMoveAlbumButton.disabled = true;
        try {
            const targetScopeType = postAlbumScopeType(state.activePost);
            const targetScopeId = postAlbumScopeIdNumber(state.activePost);
            if (!targetScopeType || !targetScopeId) return toast('앨범을 만들 공간 정보를 찾지 못했습니다.', true);
            const result = await request('/api/photo-albums', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({scopeType: targetScopeType, scopeId: targetScopeId, albumName, albumDescription: ''})
            });
            const newAlbumId = Number(pick(result, 'albumId', 'ALBUM_ID'));
            const refreshedAlbums = await requestArrayOptional(albumsUrl(targetScopeType, targetScopeId));
            const otherAlbums = (state.albums || []).filter(album => !albumBelongsToActivePostScope(album, state.activePost));
            state.albums = uniqueBy(otherAlbums.concat(refreshedAlbums), album => pick(album, 'albumId', 'ALBUM_ID'));
            renderAlbums();
            renderAlbumChips();
            fillAlbumSelect();
            renderMoveAlbumOptions(newAlbumId);
            closeMoveAlbumCreate();
            toast('새 앨범을 만들고 선택했습니다.');
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.createMoveAlbumButton.disabled = false;
        }
    }

    async function movePostAlbum() {
        if (!state.activePost) return;
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        if (!selected) return toast('이동할 앨범을 선택해주세요.', true);
        const nextAlbumId = selected.value ? Number(selected.value) : null;
        const currentAlbumId = Number(pick(state.activePost, 'albumId', 'ALBUM_ID')) || null;
        if (nextAlbumId === currentAlbumId) {
            closeModal(el.moveAlbumModal);
            return toast('현재 선택된 앨범입니다.');
        }
        el.confirmMoveAlbumButton.disabled = true;
        const openedAlbumId = state.album ? Number(pick(state.album, 'albumId', 'ALBUM_ID')) : null;
        try {
            await request(`/api/photo-posts/${pick(state.activePost,'postId','POST_ID')}/album`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({albumId: nextAlbumId})
            });
            closeModal(el.moveAlbumModal);
            hideRuntimeLightbox();
            if (el.lightbox) el.lightbox.hidden = true;
            document.body.style.overflow = '';
            toast(nextAlbumId ? '선택한 앨범으로 이동했습니다.' : '앨범에서 꺼냈습니다.');
            await loadAll();
            if (openedAlbumId && !el.albumDetailView.hidden) await openAlbum(openedAlbumId);
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.confirmMoveAlbumButton.disabled = false;
        }
    }

    async function restoreAllTrashPosts(){
        const ids = trashPostIds();
        if (!ids.length) return toast('복원할 사진이 없습니다.');
        if(!confirm(`휴지통의 사진 ${ids.length}개를 모두 복원할까요?`)) return;
        if (el.restoreAllTrashButton) el.restoreAllTrashButton.disabled = true;
        if (el.permanentlyDeleteAllTrashButton) el.permanentlyDeleteAllTrashButton.disabled = true;
        try{
            const results = await Promise.allSettled(ids.map(id => request(`/api/photo-posts/${id}/restore`,{method:'POST'})));
            const success = results.filter(result => result.status === 'fulfilled').length;
            const failed = ids.length - success;
            toast(failed ? `${success}개 복원, ${failed}개 실패했습니다.` : `사진 ${success}개를 복원했습니다.`, !!failed);
            await loadAll();
        }catch(e){
            toast(e.message || '전체 복원을 처리하지 못했습니다.', true);
        }finally{
            syncTrashBulkActions();
        }
    }

    async function permanentlyDeleteAllTrashPosts(){
        const ids = trashPostIds();
        if (!ids.length) return toast('영구 삭제할 사진이 없습니다.');
        if(!confirm(`휴지통의 사진 ${ids.length}개를 모두 영구 삭제할까요?\n영구 삭제하면 복원할 수 없습니다.`)) return;
        if (el.restoreAllTrashButton) el.restoreAllTrashButton.disabled = true;
        if (el.permanentlyDeleteAllTrashButton) el.permanentlyDeleteAllTrashButton.disabled = true;
        try{
            const results = await Promise.allSettled(ids.map(id => request(`/api/photo-posts/${id}/permanent`,{method:'DELETE'})));
            const success = results.filter(result => result.status === 'fulfilled').length;
            const failed = ids.length - success;
            toast(failed ? `${success}개 영구 삭제, ${failed}개 실패했습니다.` : `사진 ${success}개를 영구 삭제했습니다.`, !!failed);
            await loadAll();
        }catch(e){
            toast(e.message || '전체 영구 삭제를 처리하지 못했습니다.', true);
        }finally{
            syncTrashBulkActions();
        }
    }

    async function deletePost(){
        if (!state.activePost) return;
        if(!confirm('이 사진을 휴지통으로 이동할까요?')) return;
        try{
            await request(`/api/photo-posts/${pick(state.activePost,'postId','POST_ID')}`,{method:'DELETE'});
            if (el.lightbox) el.lightbox.hidden=true;
            hideRuntimeLightbox();
            document.body.style.overflow='';
            toast('사진을 휴지통으로 이동했습니다.');
            await loadAll();
        }catch(e){toast(e.message,true);}
    }

    async function restoreActivePost(){
        if (!state.activePost) return;
        const postId = Number(pick(state.activePost,'postId','POST_ID'));
        if (!postId) return toast('복원할 사진을 찾지 못했습니다.', true);
        try{
            await request(`/api/photo-posts/${postId}/restore`,{method:'POST'});
            if (el.lightbox) el.lightbox.hidden=true;
            hideRuntimeLightbox();
            document.body.style.overflow='';
            toast('사진을 복원했습니다.');
            await loadAll();
        }catch(e){toast(e.message || '사진을 복원하지 못했습니다.', true);}
    }

    async function permanentlyDeleteActivePost(){
        if (!state.activePost) return;
        const postId = Number(pick(state.activePost,'postId','POST_ID'));
        if (!postId) return toast('삭제할 사진을 찾지 못했습니다.', true);
        if(!confirm('영구 삭제하면 복원할 수 없습니다. 정말 삭제할까요?')) return;
        try{
            await request(`/api/photo-posts/${postId}/permanent`,{method:'DELETE'});
            if (el.lightbox) el.lightbox.hidden=true;
            hideRuntimeLightbox();
            document.body.style.overflow='';
            toast('사진을 영구 삭제했습니다.');
            await loadAll();
        }catch(e){toast(e.message || '사진을 영구 삭제하지 못했습니다.', true);}
    }

    document.querySelectorAll('.photo-view-tabs button').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.likeFilter) {
            state.likedOnly = !state.likedOnly;
            updateScopeGuide();
            refreshPosts();
            return;
        }
        switchView(b.dataset.view, b.dataset.photoTab || state.activeTab);
    }));
    if (el.openAlbumsViewButton) el.openAlbumsViewButton.addEventListener('click', () => switchView('albums'));
    if (el.photoAlbumChips) el.photoAlbumChips.addEventListener('click', e => {
        const button = e.target.closest('[data-album-filter]');
        if (!button) return;
        state.activeAlbumFilter = button.dataset.albumFilter || 'ALL';
        renderAlbumChips();
        refreshPosts();
    });
    if (el.photoFriendTargetList) el.photoFriendTargetList.addEventListener('click', e => {
        const button = e.target.closest('[data-photo-friend-target]');
        if (!button) return;
        state.selectedFriendTargetId = String(button.dataset.photoFriendTarget || 'ALL');
        renderFriendTargetPanel();
        updateHero();
        refreshPosts();
    });
    if (el.photoWorkspaceTargetList) el.photoWorkspaceTargetList.addEventListener('click', e => {
        const button = e.target.closest('[data-photo-workspace-target]');
        if (!button) return;
        state.selectedWorkspaceTargetId = String(button.dataset.photoWorkspaceTarget || 'ALL');
        renderWorkspaceTargetPanel();
        updateHero();
        loadAll();
    });
    if (el.photoProjectWorkspaceTargetList) el.photoProjectWorkspaceTargetList.addEventListener('click', e => {
        const button = e.target.closest('[data-photo-project-workspace-target]');
        if (!button) return;
        state.selectedProjectWorkspaceTargetId = String(button.dataset.photoProjectWorkspaceTarget || 'ALL');
        state.selectedProjectTargetId = 'ALL';
        renderProjectTargetPanel();
        updateHero();
        loadAll();
    });
    if (el.photoProjectTargetList) el.photoProjectTargetList.addEventListener('click', e => {
        const button = e.target.closest('[data-photo-project-target]');
        if (!button) return;
        state.selectedProjectTargetId = String(button.dataset.photoProjectTarget || 'ALL');
        renderProjectTargetPanel();
        updateHero();
        loadAll();
    });
    if (el.photoVisibilityFilter) el.photoVisibilityFilter.addEventListener('change', refreshPosts);
    if (el.photoOwnerFilter) el.photoOwnerFilter.addEventListener('change', () => {
        state.activeOwnerFilter = el.photoOwnerFilter.value || 'ALL';
        refreshPosts();
    });
    if (el.photoSortSelect) el.photoSortSelect.addEventListener('change', refreshPosts);
    function applyMoyoFriendFilter(id) {
        state.activeMoyoFriendId = String(id || 'ALL');
        if (state.activeMoyoFriendId === 'ALL' || state.activeMoyoFriendId === 'ME') state.activeMoyoFriend = null;
        syncFriendFilter(state.posts);
        refreshPosts();
    }

    if (el.photoFriendChips) el.photoFriendChips.addEventListener('click', e => {
        const button = e.target.closest('[data-moyo-friend]');
        if (!button) return;
        applyMoyoFriendFilter(button.dataset.moyoFriend || 'ALL');
    });
    if (el.moyoMyFeedButton) el.moyoMyFeedButton.addEventListener('click', e => {
        e.preventDefault();
        applyMoyoFriendFilter('ME');
    });
    if (el.openMoyoFriendPickerButton) el.openMoyoFriendPickerButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openMoyoFriendPicker();
    });
    document.addEventListener('click', e => {
        const button = e.target.closest && e.target.closest('#openMoyoFriendPickerButton, [data-action="open-moyo-friend-picker"]');
        if (!button) return;
        e.preventDefault();
        e.stopPropagation();
        openMoyoFriendPicker();
    });
    
    document.addEventListener('click', e => {
        if (e.target.closest && e.target.closest('[data-post-menu], [data-post-menu-toggle]')) return;
        closePostListMenus();
    });

    const openPhotoShareButton = $('openPhotoShareButton');
    if (openPhotoShareButton) openPhotoShareButton.addEventListener('click', () => toast('선택 친구 공유는 사진 업로드 후 상세에서 공통 공유 모달로 연결합니다.')); 
    if (el.photoGridModeButton) el.photoGridModeButton.addEventListener('click', () => setLayoutMode('grid', true));
    if (el.photoFeedModeButton) el.photoFeedModeButton.addEventListener('click', () => setLayoutMode('feed', true));
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { const modal = $(b.dataset.close); if (modal) closeModal(modal); }));
    const on = (target, eventName, handler) => {
        if (!target || typeof target.addEventListener !== 'function') return;
        target.addEventListener(eventName, handler);
    };

    on(el.openPostModalButton, 'click', e => { e.preventDefault(); showPostModal(); });
    on(el.openMoyoPostButton, 'click', e => { e.preventDefault(); showPostModal(); });
    on(el.openAlbumModalButton, 'click', () => showAlbumModal(false));
    on(el.postFilesInput, 'change', e => addSelectedFiles(e.target.files));
    on(el.savePostButton, 'click', savePost);
    on(el.saveAlbumButton, 'click', saveAlbum);
    on(el.deleteAlbumButton, 'click', deleteAlbum);
    on(el.editAlbumButton, 'click', () => showAlbumModal(true));
    on(el.shareToAlbumButton, 'click', e => { e.preventDefault(); showPostModal(pick(state.album, 'albumId', 'ALBUM_ID')); });
    on(el.backToAlbumsButton, 'click', () => switchView('albums'));

    on(el.photoDropZone, 'click', () => {
        if (el.postFilesInput) el.postFilesInput.click();
    });
    on(el.photoDropZone, 'keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (el.postFilesInput) el.postFilesInput.click();
        }
    });
    ['dragenter', 'dragover'].forEach(type => on(el.photoDropZone, type, e => {
        e.preventDefault();
        e.stopPropagation();
        el.photoDropZone.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach(type => on(el.photoDropZone, type, e => {
        e.preventDefault();
        e.stopPropagation();
        el.photoDropZone.classList.remove('is-dragover');
    }));
    on(el.photoDropZone, 'drop', e => addSelectedFiles(e.dataTransfer.files));
    on(el.clearSelectedFilesButton, 'click', resetSelectedFiles);
    on(el.postPreview, 'click', e => {
        const button = e.target.closest('[data-remove-file]');
        if (!button) return;
        state.selectedFiles.splice(Number(button.dataset.removeFile), 1);
        renderSelectedFiles();
    });

    on(el.postSearchInput, 'input', refreshPosts);
    on(el.albumSearchInput, 'input', renderAlbums);
    [el.postGrid, el.albumPostGrid].filter(Boolean).forEach(grid => on(grid, 'click', e => {
        const menuToggle = e.target.closest('[data-post-menu-toggle]');
        if (menuToggle) {
            e.preventDefault();
            e.stopPropagation();
            return togglePostListMenu(menuToggle.dataset.postMenuToggle);
        }
        const menuAction = e.target.closest('[data-post-menu-action]');
        if (menuAction) {
            e.preventDefault();
            e.stopPropagation();
            closePostListMenus();
            const postId = Number(menuAction.dataset.postId);
            const action = menuAction.dataset.postMenuAction;
            if (action === 'share') return openPostShareModalById(postId);
            if (action === 'visibility') return togglePostVisibilityById(postId);
            if (action === 'edit' || action === 'move' || action === 'delete' || action === 'restore' || action === 'permanent') return openPostForListAction(postId, action);
            return;
        }
        const moreButton = e.target.closest('[data-open-post-detail]');
        if (moreButton) {
            e.preventDefault();
            e.stopPropagation();
            return openPost(Number(moreButton.dataset.openPostDetail));
        }
        const likeButton = e.target.closest('[data-like-post-id]');
        if (likeButton) {
            e.preventDefault();
            e.stopPropagation();
            return togglePostLike(Number(likeButton.dataset.likePostId));
        }
        const releaseButton = e.target.closest('[data-release-share-id]');
        if (releaseButton) {
            e.preventDefault();
            e.stopPropagation();
            closeAllPostMenus();
            return releaseReceivedShareById(Number(releaseButton.dataset.releaseShareId));
        }
        const collectButton = e.target.closest('[data-collect-post-id]');
        if (collectButton) {
            e.preventDefault();
            e.stopPropagation();
            return collectPost(Number(collectButton.dataset.collectPostId));
        }
        const shareButton = e.target.closest('[data-share-post-id]');
        if (shareButton) {
            e.preventDefault();
            e.stopPropagation();
            return openPostShareModalById(Number(shareButton.dataset.sharePostId));
        }
        const friendButton = e.target.closest('[data-moyo-friend]');
        if (friendButton) {
            e.preventDefault();
            e.stopPropagation();
            state.activeMoyoFriendId = friendButton.dataset.moyoFriend || 'ALL';
            if (state.activeMoyoFriendId === 'ALL' || state.activeMoyoFriendId === 'ME') state.activeMoyoFriend = null;
            syncFriendFilter(state.posts);
            refreshPosts();
            return;
        }
        const action = e.target.closest('[data-action="open-post"]');
        if (action) return showPostModal();
        const card = e.target.closest('[data-post-id]');
        if (card) openPost(Number(card.dataset.postId));
    }));
    [el.postGrid, el.albumPostGrid].filter(Boolean).forEach(grid => on(grid, 'keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('[data-post-id]');
        if (!card) return;
        e.preventDefault();
        openPost(Number(card.dataset.postId));
    }));
    on(el.albumGrid, 'click', e => {
        const action = e.target.closest('[data-action="open-album"]');
        if (action) return showAlbumModal(false);
        const card = e.target.closest('[data-album-id]');
        if (card) openAlbum(Number(card.dataset.albumId));
    });

    on(el.closeLightboxButton, 'click', hideLightbox);
    on(el.lightboxPrevButton, 'click', () => movePhoto(-1));
    on(el.lightboxNextButton, 'click', () => movePhoto(1));
    on(el.sharePostButton, 'click', event => {
        event.preventDefault();
        event.stopPropagation();
        openActivePostShareModal();
    });
    on(el.releasePostShareButton, 'click', event => {
        event.preventDefault();
        event.stopPropagation();
        releaseReceivedShareFromActivePost();
    });
    on(el.movePostButton, 'click', showMoveAlbumModal);
    on(el.confirmMoveAlbumButton, 'click', movePostAlbum);
    on(el.openMoveAlbumCreateButton, 'click', () => {
        closeMoveAlbumEdit();
        if (el.moveAlbumCreatePanel) el.moveAlbumCreatePanel.hidden = false;
        if (el.openMoveAlbumCreateButton) el.openMoveAlbumCreateButton.hidden = true;
        setTimeout(() => {
            if (el.moveNewAlbumName) el.moveNewAlbumName.focus();
        }, 0);
    });
    on(el.cancelMoveAlbumCreateButton, 'click', closeMoveAlbumCreate);
    on(el.createMoveAlbumButton, 'click', createAlbumFromMoveModal);
    on(el.cancelMoveAlbumEditButton, 'click', closeMoveAlbumEdit);
    on(el.saveMoveAlbumEditButton, 'click', saveMoveAlbumName);
    on(el.moveNewAlbumName, 'keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            createAlbumFromMoveModal();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMoveAlbumCreate();
        }
    });
    on(el.moveEditAlbumName, 'keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveMoveAlbumName();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMoveAlbumEdit();
        }
    });
    on(el.moveAlbumList, 'click', e => {
        const editButton = e.target.closest('[data-edit-album-id]');
        if (editButton) {
            e.preventDefault();
            e.stopPropagation();
            showMoveAlbumEdit(Number(editButton.dataset.editAlbumId));
            return;
        }
        const saveButton = e.target.closest('[data-save-inline-album]');
        if (saveButton) {
            e.preventDefault();
            e.stopPropagation();
            saveMoveAlbumName();
            return;
        }
        const cancelButton = e.target.closest('[data-cancel-inline-album]');
        if (cancelButton) {
            e.preventDefault();
            e.stopPropagation();
            closeMoveAlbumEdit();
            return;
        }
        if (e.target.closest('.move-album-inline-edit')) return;
        const option = e.target.closest('[data-album-option]');
        if (!option) return;
        const radio = option.querySelector('input[name="moveAlbum"]');
        if (!radio) return;
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
    });
    on(el.moveAlbumList, 'keydown', e => {
        if (!e.target.matches('[data-inline-album-name]')) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            saveMoveAlbumName();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeMoveAlbumEdit();
        }
    });
    on(el.moveAlbumList, 'change', () => {
        if (!el.moveAlbumList) return;
        el.moveAlbumList.querySelectorAll('.move-album-option').forEach(option => {
            const input = option.querySelector('input');
            option.classList.toggle('selected', !!input && input.checked);
        });
    });
    on(el.editPostButton, 'click', showEditPostModal);
    on(el.saveEditPostButton, 'click', saveEditedPost);
    on(el.editPostDescriptionInput, 'input', () => {
        if (el.editPostDescriptionCount && el.editPostDescriptionInput) {
            el.editPostDescriptionCount.textContent = String(el.editPostDescriptionInput.value.length);
        }
    });
    on(el.likePostButton, 'click', () => {
        if (state.activePost) togglePostLike(Number(pick(state.activePost, 'postId', 'POST_ID')));
    });
    on(el.deletePostButton, 'click', deletePost);
    on(el.restoreAllTrashButton, 'click', restoreAllTrashPosts);
    on(el.permanentlyDeleteAllTrashButton, 'click', permanentlyDeleteAllTrashPosts);


    // v202: 앨범 이동 모달은 DOM 생성/이동 시점에 따라 초기 바인딩이 빗나갈 수 있어
    // document capture 위임으로 한 번 더 고정한다. 기존 기능은 그대로 두고 이동 모달 내부 클릭만 먼저 처리한다.
    function refreshMoveAlbumRefsForAction() {
        refreshMoveAlbumModalRefs();
        el.cancelMoveAlbumCreateButton = document.getElementById('cancelMoveAlbumCreateButton') || el.cancelMoveAlbumCreateButton;
        el.createMoveAlbumButton = document.getElementById('createMoveAlbumButton') || el.createMoveAlbumButton;
        el.cancelMoveAlbumEditButton = document.getElementById('cancelMoveAlbumEditButton') || el.cancelMoveAlbumEditButton;
        el.saveMoveAlbumEditButton = document.getElementById('saveMoveAlbumEditButton') || el.saveMoveAlbumEditButton;
        return !!el.moveAlbumModal;
    }

    document.addEventListener('click', event => {
        const modal = document.getElementById('moveAlbumModal');
        if (!modal || modal.hidden || !modal.contains(event.target)) return;

        const closeButton = event.target.closest('[data-close="moveAlbumModal"]');
        const newAlbumButton = event.target.closest('#openMoveAlbumCreateButton');
        const cancelCreateButton = event.target.closest('#cancelMoveAlbumCreateButton');
        const createButton = event.target.closest('#createMoveAlbumButton');
        const cancelEditButton = event.target.closest('#cancelMoveAlbumEditButton');
        const saveEditButton = event.target.closest('#saveMoveAlbumEditButton');
        const confirmButton = event.target.closest('#confirmMoveAlbumButton');
        const editAlbumButton = event.target.closest('[data-edit-album-id]');
        const saveInlineButton = event.target.closest('[data-save-inline-album]');
        const cancelInlineButton = event.target.closest('[data-cancel-inline-album]');
        const albumOption = event.target.closest('[data-album-option]');

        if (!(closeButton || newAlbumButton || cancelCreateButton || createButton || cancelEditButton || saveEditButton || confirmButton || editAlbumButton || saveInlineButton || cancelInlineButton || albumOption || event.target === modal)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        refreshMoveAlbumRefsForAction();

        if (event.target === modal || closeButton) return closeModal(modal);
        if (newAlbumButton) {
            closeMoveAlbumEdit();
            if (el.moveAlbumCreatePanel) el.moveAlbumCreatePanel.hidden = false;
            if (el.openMoveAlbumCreateButton) el.openMoveAlbumCreateButton.hidden = true;
            setTimeout(() => { if (el.moveNewAlbumName) el.moveNewAlbumName.focus(); }, 0);
            return;
        }
        if (cancelCreateButton) return closeMoveAlbumCreate();
        if (createButton) return createAlbumFromMoveModal();
        if (cancelEditButton || cancelInlineButton) return closeMoveAlbumEdit();
        if (saveEditButton || saveInlineButton) return saveMoveAlbumName();
        if (confirmButton) return movePostAlbum();
        if (editAlbumButton) return showMoveAlbumEdit(Number(editAlbumButton.dataset.editAlbumId));
        if (albumOption && !event.target.closest('.move-album-inline-edit')) {
            const radio = albumOption.querySelector('input[name="moveAlbum"]');
            if (!radio) return;
            radio.checked = true;
            if (el.moveAlbumList) {
                el.moveAlbumList.querySelectorAll('.move-album-option').forEach(option => {
                    const input = option.querySelector('input[name="moveAlbum"]');
                    option.classList.toggle('selected', !!input && input.checked);
                });
            }
        }
    }, true);

    document.addEventListener('keydown',e=>{
        if (el.editPostModal && !el.editPostModal.hidden) {
            if (e.key === 'Escape') closeModal(el.editPostModal);
            return;
        }
        if (el.moveAlbumModal && !el.moveAlbumModal.hidden) {
            if (e.key === 'Escape') closeModal(el.moveAlbumModal);
            return;
        }
        const runtimeBox = document.getElementById('photoRuntimeLightbox');
        if(runtimeBox && runtimeBox.getAttribute('aria-hidden') === 'false'){
            if(e.key==='Escape') hideRuntimeLightbox();
            if(e.key==='ArrowLeft')movePhoto(-1);
            if(e.key==='ArrowRight')movePhoto(1);
            return;
        }
        if(el.lightbox && !el.lightbox.hidden){
            if(e.key==='Escape') hideLightbox();
            if(e.key==='ArrowLeft')movePhoto(-1);
            if(e.key==='ArrowRight')movePhoto(1);
        }
    });
    ensureMoveAlbumModalDom();
    refreshMoveAlbumModalRefs();

    const initialPostId = Number(new URLSearchParams(location.search).get('postId'));
    const initialAlbumId = Number(new URLSearchParams(location.search).get('albumId'));
    fillVisibilitySelect();
    updateLayoutMode();
    updateScopeGuide();
    loadAll().then(function () { if (initialPostId) openPost(initialPostId); else if (initialAlbumId) openAlbum(initialAlbumId); });
})();
