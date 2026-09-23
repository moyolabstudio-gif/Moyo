(() => {
    'use strict';

    const root = document.querySelector('.file-explorer');
    if (!root) return;

    const contextPath = root.dataset.context || '';
    const explorerAdapter = window.MoyoContentExplorerAdapter || {};
    const endpoints = explorerAdapter.endpoints || {};
    const labels = explorerAdapter.labels || {};
    const endpoint = (name, fallback) => endpoints[name] || fallback;
    const label = (name, fallback) => labels[name] || fallback;
    const baseScope = {
        scopeType: root.dataset.scope,
        wsId: toNumber(root.dataset.wsId),
        projId: toNumber(root.dataset.projId),
        projectName: root.dataset.projectName || '',
        scopeId: toNumber(root.dataset.scopeId)
    };

    const state = {
        folderId: null,
        folders: [],
        files: [],
        path: [],
        view: 'grid',
        selected: null,
        keyword: '',
        sort: 'NAME_ASC',
        renderedItems: [],
        currentFolderItems: [],
        currentFileItems: [],
        selection: new Set(),
        lastSelectedKey: null,
        trashMode: false,
        recentMode: false,
        friendShareMode: false,
        collectionMode: false,
        collectionType: 'LIKED',
        friendOwnerId: null,
        friendOwnerName: '',
        friendShareOwners: [],
        navigationHistory: [],
        draggingSelection: false,
        suppressBlankClick: false,
        activeScope: { ...baseScope },
        collapsedFolders: new Set()
    };

    const $ = selector => root.querySelector(selector);
    const tree = $('#fileFolderTree');
    const grid = $('#fileBrowserGrid');
    const panel = root.querySelector('.file-browser-panel');
    const toolbar = root.querySelector('.file-browser-toolbar');
    const statusBar = $('#fileBrowserStatus');
    const empty = $('#fileBrowserEmpty');
    const breadcrumb = $('#fileBreadcrumb');
    const folderBackButton = $('#fileFolderBackButton');
    const contextMenu = $('#fileContextMenu');
    const fileInput = $('#contentFileInput');
    const dropZone = $('#fileDropZone');
    const searchInput = $('#fileSearchInput');
    const searchClear = $('#fileSearchClear');
    const sortButton = $('#fileSortButton');
    const sortLabel = $('#fileSortLabel');
    const sortMenu = $('#fileSortMenu');
    const workMessage = $('#fileWorkMessage');
    const workActions = $('#fileWorkActions');
    const trashActions = $('#fileTrashActions');
    const batchShareButton = $('#fileBatchShareButton');
    const batchMoyoButton = $('#contentBatchMoyoButton');
    const batchSendButton = $('#contentBatchSendButton');
    if (batchShareButton) {
        const icon = batchShareButton.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-share-nodes';
    }
    const personalRoot = String(root.dataset.personalRoot || '').toLowerCase() === 'true';
    const currentUserId = toNumber(root.dataset.currentUserId);
    const contentType = String(root.dataset.contentType || 'FILE').toUpperCase();
    const friendShareSection = $('#fileFriendShareSection');
    const explorerShell = root.querySelector('.file-explorer__shell');
    const treePanel = root.querySelector('.file-tree-panel');
    const treeResizer = root.querySelector('[data-tree-resizer]');
    const TREE_WIDTH_KEY = 'moyo.contentExplorer.treeWidth';
    const TREE_MIN_WIDTH = 180;
    const TREE_MAX_WIDTH = 360;

    function clampTreeWidth(value) {
        const shellWidth = explorerShell?.clientWidth || window.innerWidth;
        const responsiveMax = Math.max(TREE_MIN_WIDTH, Math.min(TREE_MAX_WIDTH, shellWidth - 520));
        return Math.max(TREE_MIN_WIDTH, Math.min(Number(value) || 230, responsiveMax));
    }

    function applyTreeWidth(value, persist = false) {
        if (!explorerShell || window.matchMedia('(max-width: 900px)').matches) return;
        const width = clampTreeWidth(value);
        root.style.setProperty('--file-tree-width', width + 'px');
        if (persist) {
            try { localStorage.setItem(TREE_WIDTH_KEY, String(Math.round(width))); } catch (_) {}
        }
    }

    function initTreeResizer() {
        if (!treeResizer || !treePanel || !explorerShell) return;
        let saved = null;
        try { saved = Number(localStorage.getItem(TREE_WIDTH_KEY)); } catch (_) {}
        applyTreeWidth(Number.isFinite(saved) && saved ? saved : 230);

        let startX = 0;
        let startWidth = 0;
        const finish = () => {
            if (!root.classList.contains('is-tree-resizing')) return;
            root.classList.remove('is-tree-resizing');
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            const width = parseFloat(getComputedStyle(root).getPropertyValue('--file-tree-width'));
            if (Number.isFinite(width)) applyTreeWidth(width, true);
        };

        treeResizer.addEventListener('pointerdown', event => {
            if (event.button !== 0 || window.matchMedia('(max-width: 900px)').matches) return;
            event.preventDefault();
            startX = event.clientX;
            startWidth = treePanel.getBoundingClientRect().width;
            root.classList.add('is-tree-resizing');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            treeResizer.setPointerCapture?.(event.pointerId);
        });
        treeResizer.addEventListener('pointermove', event => {
            if (!root.classList.contains('is-tree-resizing')) return;
            applyTreeWidth(startWidth + (event.clientX - startX));
        });
        treeResizer.addEventListener('pointerup', finish);
        treeResizer.addEventListener('pointercancel', finish);
        treeResizer.addEventListener('keydown', event => {
            if (window.matchMedia('(max-width: 900px)').matches) return;
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const current = treePanel.getBoundingClientRect().width;
            applyTreeWidth(current + (event.key === 'ArrowRight' ? 16 : -16), true);
        });
        window.addEventListener('resize', () => {
            if (window.matchMedia('(max-width: 900px)').matches) {
                root.style.removeProperty('--file-tree-width');
                return;
            }
            let width = treePanel.getBoundingClientRect().width;
            if (!width) { try { width = Number(localStorage.getItem(TREE_WIDTH_KEY)) || 230; } catch (_) { width = 230; } }
            applyTreeWidth(width);
        });
    }

    initTreeResizer();

    function rawValue(item, ...keys) {
        const raw = item?.raw || item || {};
        for (const key of keys) if (raw[key] != null) return raw[key];
        return null;
    }

    function isMoyoPublicItem(item) {
        if (contentType === 'PHOTO') {
            return String(rawValue(item, 'visibilityType', 'VISIBILITY_TYPE') || '').toUpperCase() === 'FRIENDS'
                || String(rawValue(item, 'moyoPublicYn', 'MOYO_PUBLIC_YN') || '').toUpperCase() === 'Y';
        }
        if (contentType === 'NOTE') {
            return String(rawValue(item, 'moyoPublicYn', 'MOYO_PUBLIC_YN', 'moyoPublic', 'MOYO_PUBLIC') || '').toUpperCase() === 'Y'
                || rawValue(item, 'moyoPublic', 'MOYO_PUBLIC') === true;
        }
        return false;
    }

    function isOwnedItem(item) {
        const ownerId = Number(rawValue(item, 'userId', 'USER_ID', 'creatorId', 'CREATOR_ID', 'createdBy', 'CREATED_BY', 'ownerUserId', 'OWNER_USER_ID'));
        return Number.isFinite(ownerId) && Number.isFinite(Number(currentUserId)) && ownerId === Number(currentUserId);
    }

    function canManageMoyo(item) {
        if (!personalRoot || state.trashMode || state.friendShareMode || !item || item.kind !== 'file') return false;
        return (contentType === 'PHOTO' || contentType === 'NOTE') && isOwnedItem(item);
    }

    const friendShareTree = $('#fileFriendShareTree');


    const defaultSortOptions = [
        { value: 'NAME_ASC', label: '이름순' },
        { value: 'LATEST', label: '최신순' },
        { value: 'OLDEST', label: '오래된순' }
    ];
    const sortOptions = Array.isArray(explorerAdapter.sortOptions) && explorerAdapter.sortOptions.length
        ? explorerAdapter.sortOptions
        : defaultSortOptions;

    function sortOption(value) {
        return sortOptions.find(option => option.value === value) || sortOptions[0] || defaultSortOptions[0];
    }

    function closeSortMenu() {
        if (!sortMenu || !sortButton) return;
        sortMenu.hidden = true;
        sortButton.setAttribute('aria-expanded', 'false');
        root.classList.remove('is-sort-menu-open');
    }

    function openSortMenu() {
        if (!sortMenu || !sortButton) return;
        hideMenu();
        sortMenu.hidden = false;
        sortButton.setAttribute('aria-expanded', 'true');
        root.classList.add('is-sort-menu-open');
    }

    function renderSortMenu() {
        if (!sortMenu || !sortLabel) return;
        const active = sortOption(state.sort);
        if (!sortOptions.some(option => option.value === state.sort)) state.sort = active.value;
        sortLabel.textContent = active.label;
        sortMenu.innerHTML = sortOptions.map(option => {
            const selected = option.value === state.sort;
            return `<button type="button" class="file-sort-option${selected ? ' is-active' : ''}" data-sort-value="${escapeHtml(option.value)}" role="menuitemradio" aria-checked="${selected ? 'true' : 'false'}"><span>${escapeHtml(option.label)}</span>${selected ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : ''}</button>`;
        }).join('');
    }

    function compareText(a, b) {
        return String(a || '').localeCompare(String(b || ''), 'ko', { numeric: true, sensitivity: 'base' });
    }

    function compareDate(a, b) {
        const av = String(a || '');
        const bv = String(b || '');
        return av.localeCompare(bv);
    }

    function defaultSortContainers(rows, sort) {
        const copy = Array.isArray(rows) ? [...rows] : [];
        const nameOf = row => rawValue(row, 'folderName', 'FOLDER_NAME', 'albumName', 'ALBUM_NAME', 'name', 'NAME') || '';
        const dateOf = row => rawValue(row, 'updatedAt', 'UPDATED_AT', 'updDt', 'UPD_DT', 'createdAt', 'CREATED_AT', 'regDt', 'REG_DT') || '';
        if (sort === 'LATEST') return copy.sort((a, b) => compareDate(dateOf(b), dateOf(a)) || compareText(nameOf(a), nameOf(b)));
        if (sort === 'OLDEST') return copy.sort((a, b) => compareDate(dateOf(a), dateOf(b)) || compareText(nameOf(a), nameOf(b)));
        return copy.sort((a, b) => compareText(nameOf(a), nameOf(b)));
    }

    function applySort(rows, kind) {
        const copy = Array.isArray(rows) ? [...rows] : [];
        const sorter = kind === 'container' ? explorerAdapter.sortContainers : explorerAdapter.sortItems;
        if (typeof sorter === 'function') return sorter(copy, state.sort, { rawValue, compareText, compareDate }) || copy;
        return kind === 'container' ? defaultSortContainers(copy, state.sort) : copy;
    }

    function toNumber(value) {
        return value && value !== 'null' ? Number(value) : null;
    }

    function escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = value ?? '';
        return element.innerHTML;
    }

    function scopeParams() {
        const scope = state.activeScope;
        if (typeof explorerAdapter.scopeParams === 'function') {
            return explorerAdapter.scopeParams(scope, { toNumber });
        }
        return { scopeType: scope.scopeType, wsId: scope.wsId, projId: scope.projId };
    }

    function isBaseScope() {
        return state.activeScope.scopeType === baseScope.scopeType
            && state.activeScope.wsId === baseScope.wsId
            && state.activeScope.projId === baseScope.projId;
    }

    async function api(url, options = {}) {
        const response = await fetch(contextPath + url, {
            credentials: 'same-origin',
            headers: {
                ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                ...(options.headers || {})
            },
            ...options
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || data.error || '처리하지 못했습니다.');
        return data;
    }

    function query(params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') searchParams.set(key, value);
        });
        return searchParams.toString();
    }

    const initialFileId = contentType === 'FILE'
        ? Number(new URLSearchParams(window.location.search).get('fileId') || 0)
        : 0;

    async function revealInitialFile() {
        if (!initialFileId) return;
        try {
            const file = await api('/api/files/' + encodeURIComponent(initialFileId));
            const scopeType = String(file.scopeType || '').toUpperCase();
            const scopeMatches = scopeType === String(baseScope.scopeType || '').toUpperCase()
                && (scopeType !== 'GROUP' || Number(file.wsId) === Number(baseScope.wsId))
                && (scopeType !== 'PROJECT' || Number(file.projId) === Number(baseScope.projId))
                && (scopeType !== 'PERSONAL' || Number(file.ownerUserId) === Number(baseScope.ownerUserId));
            if (!scopeMatches) return;

            const targetFolderId = file.folderId == null ? null : Number(file.folderId);
            if (state.folderId !== targetFolderId) {
                await openFolder(targetFolderId, { fromHistory: true });
            }

            const card = grid.querySelector('.file-item[data-kind="file"][data-id="' + initialFileId + '"]');
            if (!card) return;
            state.selection.clear();
            state.selection.add(itemKey('file', initialFileId));
            syncSelectionClasses();
            card.scrollIntoView({ block: 'center', behavior: 'smooth' });
            card.focus({ preventScroll: true });
        } catch (error) {
            console.warn('자료실 파일 바로가기를 열지 못했습니다.', error);
        }
    }

    async function load() {
        await Promise.all([loadTree(), loadFriendShareOwners(), loadItems()]);
        renderBreadcrumb();
        await revealInitialFile();
    }

    async function loadFriendShareOwners() {
        if (!friendShareSection || baseScope.scopeType !== 'PERSONAL') return;
        const friendShareOwnersEndpoint = endpoint('friendShareOwners', null);
        if (!friendShareOwnersEndpoint) {
            state.friendShareOwners = [];
            renderFriendShareTree();
            return;
        }
        try {
            const data = await api(friendShareOwnersEndpoint);
            state.friendShareOwners = data.items || [];
        } catch (error) {
            state.friendShareOwners = [];
            console.warn(`${explorerAdapter.labels?.item || '콘텐츠'} 친구 공유 목록을 불러오지 못했습니다.`, error);
        }
        renderFriendShareTree();
    }

    function renderFriendShareTree() {
        if (!friendShareSection || !friendShareTree) return;
        friendShareSection.hidden = state.friendShareOwners.length === 0;
        friendShareTree.innerHTML = state.friendShareOwners.map(owner => {
            const ownerId = Number(owner.ownerId);
            const active = state.friendShareMode && state.friendOwnerId === ownerId;
            return `<button type="button" class="file-tree-nav-row file-friend-share-row ${active ? 'is-active' : ''}" data-friend-owner-id="${ownerId}" data-friend-owner-name="${escapeHtml(owner.ownerName || '친구')}"><i class="fa-regular fa-folder" aria-hidden="true"></i><span>${escapeHtml(owner.ownerName || '친구')}</span></button>`;
        }).join('');
    }

    async function loadTree() {
        if (typeof explorerAdapter.loadContainers === 'function') {
            state.folders = await explorerAdapter.loadContainers({ api, query, scope: { ...state.activeScope }, scopeParams: scopeParams() });
        } else {
            state.folders = await api(endpoint('containerTree', '/api/file-folders/tree') + '?' + query(scopeParams()));
        }
        renderTree();
    }

    async function loadItems() {
        if (state.collectionMode) {
            if (typeof explorerAdapter.loadCollectionItems === 'function') {
                const result = await explorerAdapter.loadCollectionItems({
                    api, query, scope: { ...state.activeScope }, keyword: state.keyword, sort: state.sort,
                    collectionType: state.collectionType
                });
                state.files = result?.items || result?.files || [];
                renderItems([], state.files);
                return;
            }
            state.files = [];
            renderItems([], state.files);
            return;
        }
        if (state.friendShareMode) {
            if (typeof explorerAdapter.loadFriendShareItems === 'function') {
                const result = await explorerAdapter.loadFriendShareItems({
                    api, query,
                    ownerId: state.friendOwnerId,
                    ownerName: state.friendOwnerName,
                    keyword: state.keyword,
                    sort: state.sort
                });
                const folders = result?.containers || result?.folders || [];
                state.files = result?.items || result?.files || [];
                renderItems(folders, state.files);
                return;
            }
            const friendShareItemsEndpoint = endpoint('friendShareItems', null);
            if (!friendShareItemsEndpoint) {
                state.files = [];
                renderItems([], state.files);
                return;
            }
            const separator = friendShareItemsEndpoint.includes('?') ? '&' : '?';
            const page = await api(friendShareItemsEndpoint + separator + query({ ownerId: state.friendOwnerId }));
            state.files = page.items || [];
            renderItems([], state.files);
            return;
        }
        if (typeof explorerAdapter.loadItems === 'function') {
            const result = await explorerAdapter.loadItems({
                api, query, scope: { ...state.activeScope }, scopeParams: scopeParams(),
                containerId: state.folderId, keyword: state.keyword, sort: state.sort,
                trashMode: state.trashMode, recentMode: state.recentMode
            });
            const folders = result?.containers || result?.folders || [];
            state.files = result?.items || result?.files || [];
            renderItems(folders, state.files);
            return;
        }
        if (state.recentMode) {
            const page = await api(endpoint('recentItems', '/api/files/recent') + '?' + query(scopeParams()));
            state.files = page.items || [];
            renderItems([], state.files);
            return;
        }
        if (state.trashMode) {
            const trash = await api(endpoint('trashItems', '/api/file-trash') + '?' + query(scopeParams()));
            state.files = trash.files || [];
            renderItems(trash.folders || [], state.files);
            return;
        }
        const folders = await api(endpoint('containers', endpoint('createContainer', '/api/file-folders')) + '?' + query({
            ...scopeParams(),
            parentFolderId: state.folderId
        }));
        const page = await api(endpoint('items', '/api/files/items') + '?' + query({
            ...scopeParams(),
            folderId: state.folderId,
            keyword: state.keyword,
            sort: state.sort,
            size: 50,
            page: 1
        }));
        state.files = page.items || [];
        renderItems(folders, state.files);
    }



    function renderTree() {
        const rootButton = $('[data-tree-root]');
        rootButton?.classList.toggle('is-active', !state.trashMode && !state.recentMode && !state.friendShareMode && !state.collectionMode && state.folderId === null && isBaseScope());
        $('[data-tree-recent]')?.classList.toggle('is-active', state.recentMode);
        const collectionToggle = $('[data-tree-collection-toggle]');
        collectionToggle?.classList.toggle('is-active', state.collectionMode);
        document.querySelectorAll('[data-tree-collection-type]').forEach(button => {
            const active = state.collectionMode && button.dataset.treeCollectionType === state.collectionType;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-current', active ? 'page' : 'false');
        });
        renderFriendShareTree();

        const children = parentId => state.folders.filter(folder =>
            (folder.parentFolderId ?? null) === (parentId ?? null)
        );
        const draw = (parentId, depth = 0) => children(parentId).map(folder => {
            const active = !state.trashMode && !state.recentMode && !state.friendShareMode && !state.collectionMode && state.folderId === folder.folderId;
            const childRows = children(folder.folderId);
            const hasChildren = childRows.length > 0;
            const collapsed = hasChildren && state.collapsedFolders.has(Number(folder.folderId));
            return `
            <div class="file-tree-node${collapsed ? ' is-collapsed' : ''}" data-tree-node="${folder.folderId}">
                <div class="file-tree-row-wrap ${active ? 'is-active' : ''}">
                    ${hasChildren ? `<button class="file-tree-row__toggle" type="button" data-tree-toggle="${folder.folderId}" aria-expanded="${collapsed ? 'false' : 'true'}" aria-label="${escapeHtml(folder.folderName)} 하위 폴더 ${collapsed ? '펼치기' : '접기'}"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>` : '<span class="file-tree-row__toggle-spacer" aria-hidden="true"></span>'}
                    <button class="file-tree-row ${active ? 'is-active' : ''}"
                            type="button"
                            data-tree-id="${folder.folderId}"
                            style="--tree-depth:${depth}">
                        <span class="file-tree-row__icon" aria-hidden="true">▰</span>
                        <span class="file-tree-row__name" data-folder-full-name="${escapeHtml(folder.folderName)}">${escapeHtml(folder.folderName)}</span>
                    </button>
                    <button class="file-tree-row__more"
                            type="button"
                            data-tree-more="${folder.folderId}"
                            aria-label="${escapeHtml(folder.folderName)} 폴더 메뉴">⋯</button>
                </div>
                ${hasChildren ? `<div class="file-tree-node__children" data-tree-children-for="${folder.folderId}" ${collapsed ? 'hidden' : ''}>${draw(folder.folderId, depth + 1)}</div>` : ''}
            </div>`;
        }).join('');
        if (isBaseScope()) {
            tree.innerHTML = draw(null);
        } else {
            tree.innerHTML = '';
        }

        root.querySelectorAll('[data-project-node]').forEach(node => {
            const projectId = Number(node.dataset.projectNode);
            const projectOpen = state.activeScope.scopeType === 'PROJECT' && state.activeScope.projId === projectId;
            const projectRootActive = projectOpen && state.folderId === null && !state.trashMode && !state.recentMode && !state.friendShareMode;
            const row = node.querySelector('[data-project-id]');
            const childrenBox = node.querySelector('[data-project-children]');
            row?.classList.toggle('is-active', projectRootActive);
            node.classList.toggle('is-open', projectOpen);
            if (childrenBox) childrenBox.innerHTML = projectOpen ? draw(null, 1) : '';
        });
    }

    function fileIcon(file) {
        const fileName = String(file?.originalName || file?.fileName || file?.name || '');
        const extension = String(file?.fileExt || fileName.split('.').pop() || '')
            .replace(/^\./, '')
            .toLowerCase();
        const mimeType = String(file?.contentType || file?.mimeType || '').toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic', 'heif'].includes(extension)
                || mimeType.startsWith('image/')) return '🖼️';
        if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'flac', 'wma'].includes(extension)
                || mimeType.startsWith('audio/')) return '🎵';
        if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'm4v'].includes(extension)
                || mimeType.startsWith('video/')) return '🎬';
        if (extension === 'pdf' || mimeType === 'application/pdf') return '📕';
        if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) return '📊';
        if (['ppt', 'pptx', 'odp'].includes(extension)) return '📙';
        if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2'].includes(extension)) return '🗜️';
        if (['doc', 'docx', 'hwp', 'hwpx', 'txt', 'rtf', 'odt'].includes(extension)) return '📄';
        if (['js', 'ts', 'java', 'jsp', 'html', 'css', 'scss', 'sql', 'xml', 'json', 'yml', 'yaml', 'py', 'c', 'cpp', 'cs', 'php', 'sh'].includes(extension)) return '🧾';
        return '📄';
    }

    function profileImageUrl(path) {
        const value = String(path || '').trim();
        if (!value) return '';
        if (/^(https?:|data:|blob:)/i.test(value)) return value;
        if (value.startsWith('/')) return contextPath + value;
        return contextPath + '/' + value.replace(/^\/+/, '');
    }

    function avatarInitial(name) {
        return Array.from(String(name || '모').trim())[0]?.toUpperCase() || '모';
    }

    function avatarMarkup(person, sizeClass = '') {
        const name = person.creatorName || '사용자';
        const avatarType = String(person.creatorProfileAvatarType || 'DEFAULT').trim().toUpperCase();
        const imageUrl = avatarType === 'IMAGE'
            ? profileImageUrl(person.creatorProfileImagePath)
            : '';
        const initial = escapeHtml(avatarInitial(name));
        const size = sizeClass ? ` ${sizeClass}` : '';

        if (imageUrl) {
            return `<span class="file-user-avatar${size} has-image" data-fallback-initial="${initial}">
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" loading="lazy">
                <span class="file-user-avatar__initial">${initial}</span>
            </span>`;
        }
        return `<span class="file-user-avatar${size}"><span class="file-user-avatar__initial">${initial}</span></span>`;
    }

    function uploaderMarkup(file) {
        return `<span class="file-uploader-cell">
            ${avatarMarkup(file, 'is-small')}
            <span>${escapeHtml(file.creatorName || '알 수 없음')}</span>
        </span>`;
    }

    /**
     * FILE / PHOTO / NOTE 공통 리스트 행 골격.
     * 어댑터는 각 슬롯 안의 콘텐츠만 전달하고, 좌표/높이/간격/메뉴 위치는 공통에서 소유한다.
     */
    function renderListRow({ kind, id, draggable = true, classes = '', ariaLabel = '', preview = '', name = '', uploader = '', date = '', specific = '', status = '', download = '', menu = '' }) {
        const rowClasses = ['file-item', 'explorer-list-row', classes].filter(Boolean).join(' ');
        const aria = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
        const menuMarkup = menu || '<button class="file-item__menu" type="button" data-more="1" aria-label="더보기"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button>';
        return `<article class="${rowClasses}" data-kind="${escapeHtml(kind)}" data-id="${escapeHtml(id)}" tabindex="0" aria-selected="false"${aria} draggable="${Boolean(draggable)}">
            <div class="explorer-list-slot explorer-list-slot--preview">${preview}</div>
            <div class="explorer-list-slot explorer-list-slot--name">${name}</div>
            <div class="explorer-list-slot explorer-list-slot--uploader">${uploader}</div>
            <span class="explorer-list-slot explorer-list-slot--date">${date}</span>
            <span class="explorer-list-slot explorer-list-slot--specific">${specific}</span>
            <span class="explorer-list-slot explorer-list-slot--status">${status}</span>
            <span class="explorer-list-slot explorer-list-slot--download">${download}</span>
            <div class="file-item__actions explorer-list-slot explorer-list-slot--menu">${menuMarkup}</div>
        </article>`;
    }

    function renderItems(folders, files) {
        const sortedFolders = applySort(folders, 'container');
        const sortedFiles = applySort(files, 'item');
        state.currentFolderItems = sortedFolders;
        state.currentFileItems = sortedFiles;
        const containerItems = typeof explorerAdapter.mapContainers === 'function'
            ? explorerAdapter.mapContainers(sortedFolders, { formatDate, formatSize })
            : sortedFolders.map(folder => ({
                kind: 'folder', id: folder.folderId, name: folder.folderName,
                count: `${(folder.childFolderCount || 0) + (folder.fileCount || 0)}개 항목`, raw: folder
            }));
        const contentItems = typeof explorerAdapter.mapItems === 'function'
            ? explorerAdapter.mapItems(sortedFiles, { formatDate, formatSize })
            : sortedFiles.map(file => ({
                kind: 'file', id: file.contentFileId,
                name: file.displayName || file.originalName || '파일',
                uploader: file.creatorName || '알 수 없음',
                uploadedAt: formatDate(file.createdAt || file.updatedAt),
                fileSize: formatSize(file.fileSize), raw: file
            }));
        const items = [...containerItems, ...contentItems];

        state.renderedItems = items;
        state.selection.clear();
        state.lastSelectedKey = null;

        $('#fileBrowserCount').textContent = `${items.length}개 항목`;
        const emptyTitle = empty?.querySelector('strong');
        const emptyText = empty?.querySelector('span');
        if (emptyTitle && emptyText) {
            if (state.collectionMode) {
                const itemName = contentType === 'PHOTO' ? '사진' : '노트';
                if (state.collectionType === 'MOYO') {
                    emptyTitle.textContent = `MOYO에 공개한 ${itemName}이 없습니다.`;
                    emptyText.textContent = `공개한 ${itemName}을 한곳에서 모아볼 수 있습니다.`;
                } else {
                    emptyTitle.textContent = `좋아요한 ${itemName}이 없습니다.`;
                    emptyText.textContent = `좋아요한 ${itemName}을 한곳에서 모아볼 수 있습니다.`;
                }
            } else if (state.friendShareMode) {
                const sharedLabel = contentType === 'PHOTO' ? '사진' : (contentType === 'NOTE' ? '노트' : '파일');
                emptyTitle.textContent = `공유받은 ${sharedLabel}이 없습니다.`;
                emptyText.textContent = '수락된 친구 공유 콘텐츠가 이곳에 표시됩니다.';
            } else if (state.recentMode) {
                emptyTitle.textContent = '최근 사용한 파일이 없습니다.';
                emptyText.textContent = '파일을 열거나 다운로드하면 이곳에 표시됩니다.';
            } else if (contentType === 'PHOTO') {
                emptyTitle.textContent = '이 앨범이 비어 있습니다.';
                emptyText.textContent = '새 앨범을 만들거나 사진을 올려보세요.';
            } else if (contentType === 'NOTE') {
                emptyTitle.textContent = '이 라이브러리가 비어 있습니다.';
                emptyText.textContent = '새 라이브러리를 만들거나 노트를 작성해보세요.';
            } else {
                emptyTitle.textContent = '이 폴더가 비어 있습니다.';
                emptyText.textContent = '새 폴더를 만들거나 파일을 올려보세요.';
            }
        }
        empty.hidden = items.length > 0;
        grid.hidden = items.length === 0;
        grid.innerHTML = items.map(item => {
            if (typeof explorerAdapter.renderCard === 'function') {
                return explorerAdapter.renderCard(item, {
                    trashMode: state.trashMode,
                    view: state.view,
                    escapeHtml,
                    fileIcon,
                    uploaderMarkup,
                    renderListRow
                });
            }
            return renderListRow({
                kind: item.kind,
                id: item.id,
                draggable: !state.trashMode,
                preview: item.kind === 'folder'
                    ? '<span class="file-item__icon is-folder"><span class="file-folder-mark" aria-hidden="true"></span></span>'
                    : `<span class="file-item__icon">${fileIcon(item.raw)}</span>`,
                name: `<span class="file-item__name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>`,
                uploader: item.kind === 'file' ? `<span class="file-item__uploader">${uploaderMarkup(item.raw)}</span>` : '',
                date: `<span class="file-item__date">${item.kind === 'file' ? escapeHtml(item.uploadedAt) : ''}</span>`,
                specific: `<span class="file-item__size">${item.kind === 'folder' ? `<span class="file-item__count">${escapeHtml(item.count)}</span>` : escapeHtml(item.fileSize)}</span>`,
                status: `<span class="file-item__status">${item.kind === 'file' && String(item.raw?.sharedYn || item.raw?.SHARED_YN || '').toUpperCase() === 'Y' ? `<button type="button" class="file-item__share-status" data-explorer-share-open data-content-id="${escapeHtml(item.id)}" title="친구 공유 관리" aria-label="친구 공유 관리"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button>` : ''}</span>`,
                download: item.kind === 'file' ? '<button class="file-item__download" type="button" data-download="1" aria-label="다운로드"><i class="fa-solid fa-download" aria-hidden="true"></i></button>' : ''
            });
        }).join('');
        attachAvatarFallbacks(grid);
        if (typeof explorerAdapter.afterRender === 'function') {
            explorerAdapter.afterRender({
                grid,
                items: [...items],
                view: state.view,
                trashMode: state.trashMode
            });
        }
        updateStatusLine();
        updateWorkbar();
    }

    function attachAvatarFallbacks(scope) {
        scope.querySelectorAll('.file-user-avatar.has-image img').forEach(image => {
            image.addEventListener('error', () => {
                image.closest('.file-user-avatar')?.classList.remove('has-image');
                image.remove();
            }, { once: true });
        });
    }

    function formatSize(bytes = 0) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }

    function formatDate(value) {
        if (!value) return '';

        const rawValue = String(value).trim();
        const normalizedValue = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(rawValue)
            ? `${rawValue}+09:00`
            : rawValue;
        const date = new Date(normalizedValue);

        if (Number.isNaN(date.getTime())) {
            return rawValue.replace('T', ' ').slice(0, 16).replaceAll('-', '.');
        }

        const parts = new Intl.DateTimeFormat('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).formatToParts(date);
        const part = type => parts.find(item => item.type === type)?.value || '';

        return `${part('year')}.${part('month')}.${part('day')} ${part('hour')}:${part('minute')}`;
    }

    function itemKey(kind, id) {
        return `${kind}:${id}`;
    }

    function selectedPayload() {
        const fileIds = [];
        const folderIds = [];

        state.selection.forEach(key => {
            const separatorIndex = key.indexOf(':');
            if (separatorIndex < 0) return;

            const kind = key.slice(0, separatorIndex);
            const id = Number(key.slice(separatorIndex + 1));
            if (!Number.isFinite(id)) return;

            if (kind === 'file') fileIds.push(id);
            if (kind === 'folder') folderIds.push(id);
        });

        return {
            fileIds: [...new Set(fileIds)],
            folderIds: [...new Set(folderIds)]
        };
    }

    function selectionPayloadForMove() {
        return { ...selectedPayload(), ...scopeParams(), folderId: null };
    }

    function isSelectedCard(card) {
        return state.selection.has(itemKey(card.dataset.kind, Number(card.dataset.id)));
    }

    async function moveSelection(targetFolderId) {
        if (state.trashMode || !state.selection.size) return;
        if (typeof explorerAdapter.moveSelection === 'function') {
            await explorerAdapter.moveSelection({ api, selected: selectedPayload(), targetContainerId: targetFolderId, scope: { ...state.activeScope } });
            await Promise.all([loadTree(), loadItems()]);
            renderBreadcrumb();
            return;
        }
        const payload = selectionPayloadForMove();
        payload.folderId = targetFolderId == null ? null : Number(targetFolderId);

        if (payload.folderIds.some(id => id === payload.folderId)) {
            throw new Error('선택한 폴더 안으로 같은 폴더를 이동할 수 없습니다.');
        }

        await api(endpoint('moveItems', '/api/files/move'), {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
        await Promise.all([loadTree(), loadItems()]);
        renderBreadcrumb();
    }

    function clearDropTargets() {
        root.querySelectorAll('.is-drop-target, .is-drop-forbidden').forEach(element => {
            element.classList.remove('is-drop-target', 'is-drop-forbidden');
            element.removeAttribute('data-drop-label');
        });
        grid.querySelectorAll('.is-drag-source').forEach(element => element.classList.remove('is-drag-source'));
    }

    function dropFolderId(target) {
        if (!target) return undefined;
        const treeRoot = target.closest('[data-tree-root]');
        if (treeRoot) return null;
        const treeRow = target.closest('[data-tree-id]');
        if (treeRow) return Number(treeRow.dataset.treeId);
        const card = target.closest('.file-item[data-kind="folder"]');
        if (card) return Number(card.dataset.id);
        return undefined;
    }

    function markDropTarget(target, targetFolderId) {
        clearDropTargets();
        const row = target?.closest('[data-tree-root], [data-tree-id], .file-item[data-kind="folder"]');
        if (!row) return false;

        const selectedFolderIds = selectedPayload().folderIds || [];
        const forbidden = targetFolderId != null && selectedFolderIds.includes(Number(targetFolderId));
        row.classList.add(forbidden ? 'is-drop-forbidden' : 'is-drop-target');
        row.dataset.dropLabel = forbidden ? '이동할 수 없음' : '여기에 놓기';
        grid.querySelectorAll('.file-item.is-selected').forEach(card => card.classList.add('is-drag-source'));
        return !forbidden;
    }

    function beginRectangleSelection(event) {
        if (event.button !== 0 || !panel) return;
        if (event.target.closest('.file-item, button, input, select, textarea, a, [contenteditable="true"], .file-browser-toolbar, .file-browser-status, .file-drop-zone')) return;

        const panelRect = panel.getBoundingClientRect();
        const toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : panelRect.top;
        const statusTop = statusBar ? statusBar.getBoundingClientRect().top : panelRect.bottom;
        const canvasRect = {
            left: panelRect.left,
            top: Math.max(panelRect.top, toolbarBottom),
            right: panelRect.right,
            bottom: Math.min(panelRect.bottom, statusTop)
        };
        if (event.clientX < canvasRect.left || event.clientX > canvasRect.right
            || event.clientY < canvasRect.top || event.clientY > canvasRect.bottom) return;

        event.preventDefault();
        clearNativeTextSelection();

        const additive = event.ctrlKey || event.metaKey;
        if (!additive && state.selection.size) {
            clearSelection();
        }

        const startX = Math.max(canvasRect.left, Math.min(canvasRect.right, event.clientX));
        const startY = Math.max(canvasRect.top, Math.min(canvasRect.bottom, event.clientY));
        let moved = false;
        const originalSelection = additive ? new Set(state.selection) : new Set();
        const box = document.createElement('div');
        box.className = 'file-selection-box file-selection-box--viewport';
        Object.assign(box.style, {
            position: 'fixed',
            left: `${startX}px`,
            top: `${startY}px`,
            width: '0px',
            height: '0px',
            zIndex: '2147483000',
            pointerEvents: 'none',
            display: 'block'
        });
        document.body.appendChild(box);
        state.draggingSelection = true;

        const update = moveEvent => {
            const currentX = Math.max(canvasRect.left, Math.min(canvasRect.right, moveEvent.clientX));
            const currentY = Math.max(canvasRect.top, Math.min(canvasRect.bottom, moveEvent.clientY));
            if (Math.abs(currentX - startX) > 3 || Math.abs(currentY - startY) > 3) moved = true;

            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const right = Math.max(startX, currentX);
            const bottom = Math.max(startY, currentY);
            Object.assign(box.style, {
                left: `${left}px`,
                top: `${top}px`,
                width: `${Math.max(1, right - left)}px`,
                height: `${Math.max(1, bottom - top)}px`
            });

            state.selection = new Set(originalSelection);
            grid.querySelectorAll('.file-item').forEach(card => {
                const rect = card.getBoundingClientRect();
                const intersects = rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom;
                if (intersects) state.selection.add(itemKey(card.dataset.kind, Number(card.dataset.id)));
            });
            syncSelectionClasses();
        };

        const finish = () => {
            state.draggingSelection = false;
            state.suppressBlankClick = moved;
            box.remove();
            document.removeEventListener('pointermove', update);
            document.removeEventListener('pointerup', finish);
            document.removeEventListener('pointercancel', finish);
            clearNativeTextSelection();
        };

        document.addEventListener('pointermove', update);
        document.addEventListener('pointerup', finish, { once: true });
        document.addEventListener('pointercancel', finish, { once: true });
    }

    function isMemberPermissionScope() {
        if (state.trashMode || state.friendShareMode) return false;
        const scopeType = String(state.activeScope.scopeType || '').toUpperCase();
        const wsId = Number(root.dataset.wsId || state.activeScope.wsId || 0);
        return scopeType === 'GROUP'
            || scopeType === 'WORKSPACE'
            || scopeType === 'WS'
            || ((scopeType === 'PROJECT' || scopeType === 'PROJ') && wsId > 0);
    }

    function isPersonalShareScope() {
        if (state.trashMode || state.friendShareMode) return false;
        const scopeType = String(state.activeScope.scopeType || '').toUpperCase();
        const wsId = Number(root.dataset.wsId || state.activeScope.wsId || 0);
        return scopeType === 'PERSONAL'
            || ((scopeType === 'PROJECT' || scopeType === 'PROJ') && wsId <= 0);
    }

    function ownerIdOfItem(item) {
        return Number(item?.createdBy ?? item?.userId ?? item?.ownerUserId ?? item?.ownerId ?? item?.raw?.createdBy ?? item?.raw?.ownerUserId ?? 0);
    }

    function canManageMemberPermission(item) {
        return !!item && ownerIdOfItem(item) > 0 && ownerIdOfItem(item) === Number(currentUserId || 0);
    }

    function canManageGroupAccess(item) {
        return isMemberPermissionScope() && canManageMemberPermission(item);
    }

    async function getGroupAccessMode(contentId) {
        const params = new URLSearchParams({ contentType, contentId: String(contentId) });
        const response = await fetch(contextPath + '/share/api/access-mode?' + params.toString(), { credentials: 'same-origin' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) throw new Error(data.message || '공개 범위를 불러오지 못했습니다.');
        return data.restricted === true || String(data.restricted || '').toUpperCase() === 'TRUE';
    }

    async function setGroupAccessMode(contentId, restricted) {
        const body = new URLSearchParams({
            contentType,
            contentId: String(contentId),
            mode: restricted ? 'RESTRICTED' : 'SCOPE'
        });
        const response = await fetch(contextPath + '/share/api/access-mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: body.toString(),
            credentials: 'same-origin'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) throw new Error(data.message || '공개 범위를 변경하지 못했습니다.');
        return data;
    }

    function canShareCurrentSelection() {
        const payload = selectedPayload();
        if (payload.folderIds.length > 0 || payload.fileIds.length === 0) return false;
        if (isPersonalShareScope()) return true;
        if (!isMemberPermissionScope() || payload.fileIds.length !== 1) return false;
        const selectedItems = state.renderedItems.filter(item => state.selection.has(itemKey(item.kind, item.id)));
        return selectedItems.length === 1 && selectedItems[0]?.kind === 'file' && canManageMemberPermission(selectedItems[0]);
    }

    function updateWorkbar() {
        const hasSelection = state.selection.size > 0;
        const showWorkActions = !state.trashMode && hasSelection;
        const showTrashActions = state.trashMode && hasSelection;

        workActions.hidden = !showWorkActions;
        trashActions.hidden = !showTrashActions;
        workActions.classList.toggle('is-visible', showWorkActions);
        trashActions.classList.toggle('is-visible', showTrashActions);
        if (batchShareButton) {
            batchShareButton.hidden = !canShareCurrentSelection();
            const labelNode = batchShareButton.querySelector('span');
            if (labelNode) labelNode.textContent = isMemberPermissionScope() ? '권한 멤버' : '친구 공유';
        }

        const selectedItems = state.renderedItems.filter(item => state.selection.has(itemKey(item.kind, item.id)));
        const singleFile = selectedItems.length === 1 && selectedItems[0]?.kind === 'file' ? selectedItems[0] : null;
        if (batchMoyoButton) {
            const manageableItems = selectedItems.filter(item => item?.kind === 'file' && canManageMoyo(item));
            const visible = selectedItems.length > 0 && manageableItems.length === selectedItems.length;
            batchMoyoButton.hidden = !visible;
            if (visible) {
                const allPublic = manageableItems.every(isMoyoPublicItem);
                const labelNode = batchMoyoButton.querySelector('span');
                if (labelNode) labelNode.textContent = allPublic ? 'MOYO 공개 해제' : 'MOYO 공개';
                batchMoyoButton.dataset.nextPublic = String(!allPublic);
            } else {
                delete batchMoyoButton.dataset.nextPublic;
            }
        }
        if (batchSendButton) {
            const visible = Boolean(singleFile && (contentType === 'PHOTO' || contentType === 'NOTE') && isMoyoPublicItem(singleFile));
            batchSendButton.hidden = !visible;
            if (visible) batchSendButton.dataset.contentId = String(singleFile.id);
        }

        const batchDownload = workActions?.querySelector('[data-batch-action="download"]');
        if (batchDownload) batchDownload.hidden = contentType === 'NOTE';
    }

    function clearNativeTextSelection() {
        const selection = window.getSelection?.();
        if (selection && selection.rangeCount) selection.removeAllRanges();
    }


    function batchShareMarkup() {
        return `<div id="contentExplorerShareMount">
            <button type="button" id="contentExplorerShareOpen" hidden>공유 열기</button>
            <button type="button" id="contentExplorerSharePermission" hidden>권한</button>
            <div id="contentExplorerShareHiddenFields" hidden></div>
            <div id="contentExplorerShareInitialSource" hidden></div>
            <div id="contentExplorerShareModal" class="note-write-share-modal moyo-share-modal content-explorer-share-modal" data-current-user-id="${escapeHtml(String(currentUserId || ''))}" data-owner-user-id="${escapeHtml(String(currentUserId || ''))}" data-share-mode-type="PERMISSION" hidden>
                <div class="note-write-share-backdrop" data-note-share-close></div>
                <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="contentExplorerShareTitle">
                    <div class="note-write-share-modal-head">
                        <div><h3 id="contentExplorerShareTitle">친구에게 공유</h3><p>선택한 항목의 공유 요청을 보낼 친구를 선택합니다.</p></div>
                        <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
                    </div>
                    <div class="note-write-share-toolbar">
                        <select id="contentExplorerShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
                        <input type="text" id="contentExplorerShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
                    </div>
                    <div class="note-write-share-body note-write-share-body-simple">
                        <div><div class="note-write-share-subtitle">공유 대상</div><div id="contentExplorerShareCandidates" class="note-write-share-list"></div></div>
                        <div><div class="note-write-share-subtitle">선택한 친구 <span id="contentExplorerShareModalCount" class="note-share-modal-count" hidden>0</span></div><div id="contentExplorerShareSelected" class="note-write-share-selected"></div></div>
                    </div>
                    <div class="note-write-share-modal-actions"><div><button type="button" class="note-soft-btn" data-note-share-close>취소</button><button type="button" id="contentExplorerShareApply" class="note-gradient-btn">보내기</button></div></div>
                </section>
            </div>
        </div>`;
    }

    function openSingleShareModal(contentId) {
        const normalizedId = Number(contentId);
        if (!Number.isFinite(normalizedId) || normalizedId <= 0) throw new Error('공유할 항목을 찾지 못했습니다.');
        if (!window.CommonPeopleModal || typeof window.CommonPeopleModal.init !== 'function') throw new Error('공유 모달을 불러오지 못했습니다.');

        const previous = document.getElementById('contentExplorerShareMount');
        if (previous) previous.remove();
        document.body.insertAdjacentHTML('beforeend', batchShareMarkup());

        const contentType = String(root.dataset.contentType || 'FILE').toUpperCase();
        const memberMode = isMemberPermissionScope();
        const modalApi = window.CommonPeopleModal.init({
            contentType,
            contentId: normalizedId,
            contentIds: [normalizedId],
            shareMode: memberMode ? 'MEMBER_PERMISSION' : 'PERMISSION',
            scopeType: String(state.activeScope.scopeType || ''),
            wsId: Number(root.dataset.wsId || state.activeScope.wsId || 0) || null,
            projId: Number(root.dataset.projId || state.activeScope.projId || 0) || null,
            persist: true,
            reloadOnPersist: false,
            enablePermission: ['NOTE','PHOTO','FILE'].includes(contentType),
            friendOnly: !memberMode,
            currentUserId: String(currentUserId || ''),
            bodyOpenClass: 'note-share-modal-open',
            ids: {
                openButton: 'contentExplorerShareOpen', permissionButton: 'contentExplorerSharePermission', modal: 'contentExplorerShareModal',
                keyword: 'contentExplorerShareKeyword', applyButton: 'contentExplorerShareApply', title: 'contentExplorerShareTitle',
                context: 'contentExplorerShareContext', candidates: 'contentExplorerShareCandidates', selected: 'contentExplorerShareSelected',
                hiddenFields: 'contentExplorerShareHiddenFields', count: 'contentExplorerShareCount', modalCount: 'contentExplorerShareModalCount',
                initialSharesSource: 'contentExplorerShareInitialSource'
            },
            onPersistSuccess() {
                loadItems().catch(() => {});
            }
        });

        if (modalApi && typeof modalApi.openShare === 'function') modalApi.openShare();
        else document.getElementById('contentExplorerShareOpen')?.click();
    }

    function openSingleFriendSendModal(contentId) {
        const normalizedId = Number(contentId);
        if (!Number.isFinite(normalizedId) || normalizedId <= 0) throw new Error('보낼 항목을 찾지 못했습니다.');
        if (!window.CommonPeopleModal || typeof window.CommonPeopleModal.init !== 'function') throw new Error('친구 선택 모달을 불러오지 못했습니다.');

        const previous = document.getElementById('contentExplorerShareMount');
        if (previous) previous.remove();
        document.body.insertAdjacentHTML('beforeend', batchShareMarkup());

        const contentType = String(root.dataset.contentType || 'FILE').toUpperCase();
        const sendUrl = contentType === 'PHOTO'
            ? `/api/photo-posts/${encodeURIComponent(normalizedId)}/send`
            : contentType === 'NOTE'
                ? `/note/api/${encodeURIComponent(normalizedId)}/send`
                : null;
        if (!sendUrl) throw new Error('이 콘텐츠는 친구에게 보내기를 지원하지 않습니다.');

        const modalApi = window.CommonPeopleModal.init({
            contentType,
            contentId: normalizedId,
            contentIds: [normalizedId],
            shareMode: 'PERMISSION',
            friendOnly: true,
            actionKind: 'SEND',
            persist: true,
            reloadOnPersist: false,
            enablePermission: false,
            currentUserId: String(currentUserId || ''),
            ownerUserId: String(currentUserId || ''),
            blockedUserIds: [String(currentUserId || '')].filter(Boolean),
            bodyOpenClass: 'note-share-modal-open',
            ids: {
                openButton: 'contentExplorerShareOpen', permissionButton: 'contentExplorerSharePermission', modal: 'contentExplorerShareModal',
                keyword: 'contentExplorerShareKeyword', applyButton: 'contentExplorerShareApply', title: 'contentExplorerShareTitle',
                context: 'contentExplorerShareContext', candidates: 'contentExplorerShareCandidates', selected: 'contentExplorerShareSelected',
                hiddenFields: 'contentExplorerShareHiddenFields', count: 'contentExplorerShareCount', modalCount: 'contentExplorerShareModalCount',
                initialSharesSource: 'contentExplorerShareInitialSource'
            },
            onSubmit: async ({ targets }) => {
                const targetUserIds = (targets || []).map(item => Number(item.id)).filter(id => Number.isFinite(id) && id > 0);
                if (!targetUserIds.length) throw new Error('보낼 친구를 선택해 주세요.');
                const result = await api(sendUrl, { method: 'POST', body: JSON.stringify({ targetUserIds }) });
                alert(`${Number(result.sentCount || targetUserIds.length)}명에게 보냈습니다.`);
            }
        });

        if (modalApi && typeof modalApi.openShare === 'function') modalApi.openShare();
        else document.getElementById('contentExplorerShareOpen')?.click();
    }

    function openBatchShareModal(payload) {
        if (!canShareCurrentSelection()) throw new Error('개인 또는 개인 프로젝트의 사진·파일·노트만 친구에게 공유할 수 있습니다.');
        if (!window.CommonPeopleModal || typeof window.CommonPeopleModal.init !== 'function') throw new Error('공유 모달을 불러오지 못했습니다.');
        const previous = document.getElementById('contentExplorerShareMount');
        if (previous) previous.remove();
        document.body.insertAdjacentHTML('beforeend', batchShareMarkup());
        const contentIds = [...new Set(payload.fileIds.map(Number).filter(Number.isFinite))];
        const contentType = String(root.dataset.contentType || 'FILE').toUpperCase();
        window.CommonPeopleModal.init({
            contentType,
            contentId: contentIds[0],
            contentIds,
            shareMode: 'PERMISSION',
            persist: true,
            reloadOnPersist: false,
            enablePermission: false,
            currentUserId: String(currentUserId || ''),
            ownerUserId: String(currentUserId || ''),
            blockedUserIds: [String(currentUserId || '')].filter(Boolean),
            bodyOpenClass: 'note-share-modal-open',
            ids: {
                openButton: 'contentExplorerShareOpen', permissionButton: 'contentExplorerSharePermission', modal: 'contentExplorerShareModal',
                keyword: 'contentExplorerShareKeyword', applyButton: 'contentExplorerShareApply', title: 'contentExplorerShareTitle',
                context: 'contentExplorerShareContext', candidates: 'contentExplorerShareCandidates', selected: 'contentExplorerShareSelected',
                hiddenFields: 'contentExplorerShareHiddenFields', count: 'contentExplorerShareCount', modalCount: 'contentExplorerShareModalCount',
                initialSharesSource: 'contentExplorerShareInitialSource'
            },
            onPersistSuccess() {
                state.selection.clear();
                state.lastSelectedKey = null;
                syncSelectionClasses();
            }
        });
        document.getElementById('contentExplorerShareOpen')?.click();
    }

    async function downloadSelectedItems() {
        const payload = { ...selectedPayload(), ...scopeParams() };
        if (!payload.fileIds.length && !payload.folderIds.length) return;

        const response = await fetch(contextPath + endpoint('downloadBatch', '/api/files/download-batch'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            let message = '선택한 항목을 다운로드하지 못했습니다.';
            try {
                const data = await response.json();
                message = data.message || data.error || message;
            } catch (_) {
                const text = await response.text();
                if (text) message = text;
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') || '';
        const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
        const plain = disposition.match(/filename=\"?([^\";]+)\"?/i)?.[1];
        const fileName = encoded ? decodeURIComponent(encoded) : (plain || 'MOYO_자료실.zip');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    async function runBatchAction(action) {
        const payload = { ...selectedPayload(), ...scopeParams() };
        if (action === 'share') {
            openBatchShareModal(payload);
            return;
        }
        if (!payload.fileIds.length && !payload.folderIds.length) return;

        if (action === 'trash') {
            const count = payload.fileIds.length + payload.folderIds.length;
            if (!confirm(`선택한 ${count}개 항목을 휴지통으로 이동할까요?`)) return;
        } else if (action === 'permanent') {
            if (!confirm('선택한 항목을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
        }

        if (typeof explorerAdapter.batchAction === 'function') {
            await explorerAdapter.batchAction({ action, payload, api, trashMode: state.trashMode });
            await load();
            return;
        }
        if (action === 'download') {
            await downloadSelectedItems();
            return;
        }

        const deletingCurrentFolder = action === 'trash'
            && state.folderId !== null
            && payload.folderIds.some(folderId => Number(folderId) === Number(state.folderId));
        const currentFolder = deletingCurrentFolder
            ? state.folders.find(folder => Number(folder.folderId) === Number(state.folderId))
            : null;
        const fallbackFolderId = currentFolder?.parentFolderId == null
            ? null
            : Number(currentFolder.parentFolderId);

        if (action === 'trash') {
            await api(endpoint('trashMove', '/api/file-trash/move'), { method: 'POST', body: JSON.stringify(payload) });
        } else if (action === 'restore') {
            await api(endpoint('trashRestore', '/api/file-trash/restore'), { method: 'POST', body: JSON.stringify(payload) });
        } else if (action === 'permanent') {
            await api(endpoint('trashPermanent', '/api/file-trash/permanent'), { method: 'DELETE', body: JSON.stringify(payload) });
        }

        if (deletingCurrentFolder) {
            state.folderId = fallbackFolderId;
            state.selected = null;
            state.selection.clear();
            state.lastSelectedKey = null;
        }
        await load();
    }

    function updateStatusLine() {
        const selectedItems = state.renderedItems.filter(item =>
            state.selection.has(itemKey(item.kind, item.id))
        );

        if (!selectedItems.length) {
            workMessage.textContent = state.trashMode
                ? '휴지통의 항목은 30일 후 자동으로 영구 삭제됩니다.'
                : '파일을 선택하거나 폴더로 끌어 이동할 수 있습니다.';
            return;
        }

        const selectedFiles = selectedItems.filter(item => item.kind === 'file');
        const selectedFolders = selectedItems.filter(item => item.kind === 'folder');
        const selectedBytes = selectedFiles.reduce((sum, item) =>
            sum + Number(item.raw?.fileSize || 0), 0
        );

        let label = selectedFolders.length === selectedItems.length
            ? `${selectedFolders.length}개 폴더 선택됨`
            : `${selectedItems.length}개 항목 선택됨`;

        if (selectedBytes > 0) label += ` · ${formatSize(selectedBytes)}`;
        workMessage.textContent = label;
    }

    function syncSelectionClasses() {
        grid.querySelectorAll('.file-item').forEach(card => {
            const key = itemKey(card.dataset.kind, Number(card.dataset.id));
            const selected = state.selection.has(key);
            card.classList.toggle('is-selected', selected);
            card.setAttribute('aria-selected', String(selected));
        });
        updateStatusLine();
        updateWorkbar();
    }

    function selectCard(card, event = {}) {
        const key = itemKey(card.dataset.kind, Number(card.dataset.id));
        const additive = Boolean(event.ctrlKey || event.metaKey);
        if (event.shiftKey && state.lastSelectedKey) {
            const keys = state.renderedItems.map(item => itemKey(item.kind, item.id));
            const from = keys.indexOf(state.lastSelectedKey);
            const to = keys.indexOf(key);
            if (from >= 0 && to >= 0) {
                if (!additive) state.selection.clear();
                const [min, max] = from < to ? [from, to] : [to, from];
                keys.slice(min, max + 1).forEach(value => state.selection.add(value));
            }
        } else if (!additive) {
            state.selection.clear();
            state.selection.add(key);
        } else if (state.selection.has(key)) {
            state.selection.delete(key);
        } else {
            state.selection.add(key);
        }
        state.lastSelectedKey = key;
        clearNativeTextSelection();
        syncSelectionClasses();
    }

    function clearSelection() {
        if (!state.selection.size) return;
        state.selection.clear();
        state.lastSelectedKey = null;
        syncSelectionClasses();
    }

    function renderBreadcrumb() {
        if (state.collectionMode) {
            breadcrumb.innerHTML = `<span>모아보기</span><span>›</span><span>${state.collectionType === 'MOYO' ? 'MOYO 공개' : '좋아요'}</span>`;
            if (folderBackButton) folderBackButton.hidden = true;
            return;
        }
        if (state.recentMode) {
            breadcrumb.innerHTML = '<span>최근 파일</span>';
            if (folderBackButton) folderBackButton.hidden = true;
            return;
        }
        if (state.friendShareMode) {
            breadcrumb.innerHTML = `<span>친구</span><span>›</span><span>${escapeHtml(state.friendOwnerName || '친구')}</span>`;
            if (folderBackButton) folderBackButton.hidden = true;
            return;
        }
        const rootLabel = typeof explorerAdapter.rootLabel === 'function'
            ? explorerAdapter.rootLabel(state.activeScope)
            : (state.activeScope.scopeType === 'PROJECT' ? (state.activeScope.projectName || '프로젝트') : state.activeScope.scopeType === 'GROUP' ? '그룹 폴더' : '내 폴더');
        const rootTitle = escapeHtml(rootLabel);
        const rootCrumb = state.activeScope.scopeType === 'PROJECT'
            ? `<button data-project-crumb="true" title="${rootTitle}">${rootTitle}</button>`
            : `<button data-crumb="" title="${rootTitle}">${rootTitle}</button>`;
        breadcrumb.innerHTML = rootCrumb + state.path.map((folder, index) => {
            const folderName = escapeHtml(folder.folderName);
            return `
            <span>›</span>
            <button data-crumb="${folder.folderId}" data-index="${index}" title="${folderName}">${folderName}</button>
        `;
        }).join('');
        folderBackButton.hidden = state.navigationHistory.length === 0;
    }

    function currentLocation() {
        return { folderId: state.folderId, trashMode: state.trashMode, recentMode: state.recentMode, friendShareMode: state.friendShareMode, friendOwnerId: state.friendOwnerId, friendOwnerName: state.friendOwnerName, collectionMode: state.collectionMode, collectionType: state.collectionType, activeScope: { ...state.activeScope } };
    }

    async function switchScope(nextScope, options = {}) {
        if (!options.fromHistory) state.navigationHistory.push(currentLocation());
        state.activeScope = { ...nextScope };
        state.folderId = null;
        state.path = [];
        state.trashMode = false;
        state.recentMode = false;
        state.friendShareMode = false;
        state.collectionMode = false;
        state.selected = null;
        state.selection.clear();
        root.classList.remove('is-trash-mode');
        await load();
    }

    async function openProject(projectRow, options = {}) {
        state.recentMode = false;
        state.friendShareMode = false;
        state.collectionMode = false;
        const projectId = Number(projectRow.dataset.projectId);
        const projectName = projectRow.dataset.projectName
            || projectRow.querySelector('.file-project-row__name')?.textContent?.trim()
            || root.dataset.projectName
            || '프로젝트';
        const projectWsId = toNumber(projectRow.dataset.projectWsId);
        const alreadyOpen = state.activeScope.scopeType === 'PROJECT' && state.activeScope.projId === projectId;
        if (alreadyOpen) {
            return switchScope({ ...baseScope }, options);
        }
        return switchScope({ scopeType: 'PROJECT', wsId: projectWsId, projId: projectId, projectName }, options);
    }

    async function openFolder(id, options = {}) {
        state.recentMode = false;
        state.friendShareMode = false;
        state.collectionMode = false;
        const nextId = id == null ? null : Number(id);
        if (!options.fromHistory && (state.trashMode || state.folderId !== nextId)) {
            state.navigationHistory.push(currentLocation());
        }
        state.trashMode = false;
        root.classList.remove('is-trash-mode');
        state.folderId = nextId;
        state.path = buildPath(id);
        state.selected = null;
        hideMenu();
        await loadItems();
        renderTree();
        renderBreadcrumb();
    }

    function buildPath(id) {
        const path = [];
        let current = state.folders.find(folder => folder.folderId === id);
        while (current) {
            path.unshift(current);
            current = state.folders.find(folder => folder.folderId === current.parentFolderId);
        }
        return path;
    }

    function selectedItem(kind, id) {
        const normalizedId = Number(id);
        const rendered = (state.renderedItems || []).find(item =>
            item.kind === kind && Number(item.id) === normalizedId
        );
        if (rendered) return rendered;

        return kind === 'folder'
            ? state.folders.find(folder => Number(folder.folderId) === normalizedId)
            : state.files.find(file =>
                Number(file.contentFileId ?? file.noteId ?? file.photoId ?? file.id) === normalizedId
            );
    }

    function showMenu(event, kind, id) {
        state.selected = { kind, id, data: selectedItem(kind, id) };

        const isPhotoExplorer = contentType === 'PHOTO';
        const isNoteExplorer = contentType === 'NOTE';
        const isContainer = kind === 'folder';
        const openCommand = contextMenu.querySelector('[data-command="open"]');
        const downloadCommand = contextMenu.querySelector('[data-command="download"]');
        const shareCommand = contextMenu.querySelector('[data-command="share"]');
        const moyoCommand = contextMenu.querySelector('[data-command="moyo"]');
        const sendCommand = contextMenu.querySelector('[data-command="friend-send"]');
        const renameCommand = contextMenu.querySelector('[data-command="rename"]');
        const moveCommand = contextMenu.querySelector('[data-command="move"]');
        const deleteCommand = contextMenu.querySelector('[data-command="delete"]');
        const divider = contextMenu.querySelector('hr');

        if (state.trashMode) {
            if (openCommand) openCommand.hidden = true;
            if (downloadCommand) downloadCommand.hidden = true;
            if (shareCommand) shareCommand.hidden = true;
            if (moyoCommand) moyoCommand.hidden = true;
            if (sendCommand) sendCommand.hidden = true;
            if (moveCommand) moveCommand.hidden = true;

            if (renameCommand) {
                renameCommand.hidden = false;
                renameCommand.textContent = '복원';
            }
            if (deleteCommand) {
                deleteCommand.hidden = false;
                deleteCommand.textContent = '영구 삭제';
            }
            if (divider) divider.hidden = false;
        } else {
            if (openCommand) openCommand.hidden = !(isContainer || isPhotoExplorer || isNoteExplorer || contentType === 'FILE');
            if (downloadCommand) {
                downloadCommand.hidden = isNoteExplorer || (isPhotoExplorer && isContainer);
            }
            const selectedData = state.selected?.data;
            if (shareCommand) {
                const canOpenShare = !isContainer && (
                    isPersonalShareScope()
                    || (isMemberPermissionScope() && canManageMemberPermission(selectedData))
                );
                shareCommand.hidden = !canOpenShare;
                if (canOpenShare) shareCommand.textContent = isMemberPermissionScope() ? '권한 멤버' : '친구 공유';
            }

            const canGroupAccess = !isContainer && canManageGroupAccess(selectedData);
            const canMoyo = !isContainer && canManageMoyo(selectedData);
            const publicNow = !isContainer && isMoyoPublicItem(selectedData);
            if (moyoCommand) {
                moyoCommand.hidden = !(canMoyo || canGroupAccess);
                moyoCommand.textContent = canGroupAccess ? '공개 범위 설정' : (publicNow ? 'MOYO 공개 해제' : 'MOYO 공개');
            }
            if (sendCommand) sendCommand.hidden = isContainer || !(isPhotoExplorer || isNoteExplorer) || !publicNow;
            if (moveCommand) moveCommand.hidden = false;

            if (renameCommand) {
                renameCommand.hidden = isPhotoExplorer && !isContainer;
                renameCommand.textContent = isNoteExplorer && !isContainer
                    ? '제목 바꾸기'
                    : '이름 바꾸기';
            }
            if (deleteCommand) {
                deleteCommand.hidden = false;
                deleteCommand.textContent = '휴지통으로 이동';
            }
            if (divider) divider.hidden = false;
        }

        root.querySelectorAll('.is-context-menu-source').forEach(item => item.classList.remove('is-context-menu-source'));
        const source = event.target.closest('.file-item, .file-tree-row-wrap, .file-tree-row');
        source?.classList.add('is-context-menu-source');
        root.classList.add('is-context-menu-open');

        contextMenu.style.left = `${Math.min(event.clientX, innerWidth - 180)}px`;
        contextMenu.style.top = `${Math.min(event.clientY, innerHeight - 230)}px`;
        contextMenu.hidden = false;
    }

    function hideMenu() {
        contextMenu.hidden = true;
        root.classList.remove('is-context-menu-open');
        root.querySelectorAll('.is-context-menu-source').forEach(item => item.classList.remove('is-context-menu-source'));
    }

    function blockExplorerInteractionWhileMenuOpen(event) {
        if (contextMenu.hidden || contextMenu.contains(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
    }

    root.addEventListener('wheel', blockExplorerInteractionWhileMenuOpen, { passive: false, capture: true });
    root.addEventListener('touchmove', blockExplorerInteractionWhileMenuOpen, { passive: false, capture: true });


    function nameDialog(title, value = '') {
        return new Promise(resolve => {
            const dialog = $('#fileNameDialog');
            const nameInput = $('#fileNameInput');
            const closeButton = dialog.querySelector('[data-file-dialog-close]');

            $('#fileNameDialogTitle').textContent = title;
            nameInput.value = value;
            dialog.returnValue = '';

            const closeWithoutSaving = () => dialog.close('cancel');
            const closeOnBackdrop = event => {
                if (event.target === dialog) closeWithoutSaving();
            };

            closeButton?.addEventListener('click', closeWithoutSaving, { once: true });
            dialog.addEventListener('click', closeOnBackdrop);
            dialog.onclose = () => {
                dialog.removeEventListener('click', closeOnBackdrop);
                resolve(dialog.returnValue === 'default' ? nameInput.value.trim() : null);
            };

            dialog.showModal();
            setTimeout(() => {
                nameInput.focus();
                nameInput.select();
            }, 0);
        });
    }


    function moveTargetSelect() {
        let select = document.getElementById('fileMoveTargetSelect');
        if (!select) {
            select = document.createElement('select');
            select.id = 'fileMoveTargetSelect';
            select.hidden = true;
            select.setAttribute('aria-hidden', 'true');
            root.appendChild(select);
        }

        const selectedFolders = new Set(selectedPayload().folderIds.map(Number));
        const excluded = new Set(selectedFolders);
        let changed = true;
        while (changed) {
            changed = false;
            state.folders.forEach(folder => {
                const parentId = folder.parentFolderId == null ? null : Number(folder.parentFolderId);
                if (parentId != null && excluded.has(parentId) && !excluded.has(Number(folder.folderId))) {
                    excluded.add(Number(folder.folderId));
                    changed = true;
                }
            });
        }

        select.innerHTML = '';
        const rootOption = document.createElement('option');
        rootOption.value = '';
        rootOption.textContent = '전체 파일';
        rootOption.dataset.depth = '0';
        rootOption.dataset.parentId = '';
        rootOption.dataset.root = 'true';
        select.appendChild(rootOption);

        const appendChildren = (parentId, depth) => {
            state.folders
                .filter(folder => (folder.parentFolderId == null ? null : Number(folder.parentFolderId)) === parentId)
                .forEach(folder => {
                    const folderId = Number(folder.folderId);
                    if (excluded.has(folderId)) return;
                    const option = document.createElement('option');
                    option.value = String(folderId);
                    option.textContent = `${'　'.repeat(depth)}${folder.folderName}`;
                    option.dataset.depth = String(depth);
                    option.dataset.parentId = parentId == null ? '' : String(parentId);
                    select.appendChild(option);
                    appendChildren(folderId, depth + 1);
                });
        };
        appendChildren(null, 0);
        select.value = state.folderId == null ? '' : String(state.folderId);
        Array.from(select.options).forEach(option => {
            const value = String(option.value || '');
            option.dataset.disabled = value !== '' && value === String(state.folderId == null ? '' : state.folderId) ? 'true' : 'false';
        });
        return select;
    }

    function openMoveFolderModal({ ensureContextSelection = true } = {}) {
        if (state.trashMode || !window.CommonFolderModal) return;

        if (ensureContextSelection) {
            if (!state.selected) return;
            const selectedKey = itemKey(state.selected.kind, state.selected.id);
            if (!state.selection.has(selectedKey)) {
                state.selection.clear();
                state.selection.add(selectedKey);
                syncSelectionClasses();
            }
        }

        if (!state.selection.size) return;

        const select = moveTargetSelect();
        window.CommonFolderModal.openSelect({
            selectElement: select,
            adapter: {
                create: async (context, payload) => {
                    const parentFolderId = payload.parentFolderId === '' ? null : Number(payload.parentFolderId);
                    const created = await api(endpoint('createContainer', '/api/file-folders'), {
                        method: 'POST',
                        body: JSON.stringify({ ...scopeParams(), parentFolderId, name: payload.folderName })
                    });
                    await loadTree();
                    return {
                        folderId: created.folderId,
                        folderName: created.folderName || payload.folderName,
                        depth: payload.depth
                    };
                },
                rename: async (context, payload) => {
                    await api(`/api/file-folders/${Number(payload.folderId)}/name`, {
                        method: 'PATCH',
                        body: JSON.stringify({ name: payload.folderName })
                    });
                    await loadTree();
                },
                remove: async (context, payload) => {
                    await api(endpoint('trashMove', '/api/file-trash/move'), {
                        method: 'POST',
                        body: JSON.stringify({ fileIds: [], folderIds: [Number(payload.folderId)] })
                    });
                    await loadTree();
                }
            },
            context: scopeParams(),
            title: '이동',
            description: '이동할 대상 폴더를 선택하세요.',
            confirmLabel: '이동',
            canManage: true,
            showManageActions: true,
            instantSelect: false,
            showCurrent: true,
            unclassifiedLabel: '전체 파일',
            unclassifiedDescription: '자료실 최상위로 이동',
            folderDescription: '이 폴더로 이동',
            treeMode: true,
            showCloseButton: true,
            requestFolderName: async ({ initialValue }) => nameDialog(initialValue ? '이름 바꾸기' : '새 폴더', initialValue),
            onConfirm: async ({ folderId }) => {
                const targetFolderId = folderId === '' ? null : Number(folderId);
                if ((state.folderId ?? null) === targetFolderId) {
                    throw new Error('현재 폴더와 다른 폴더를 선택해 주세요.');
                }
                await moveSelection(targetFolderId);
            }
        });
    }

    async function createFolder() {
        const name = await nameDialog(label('newContainerTitle', '새 폴더'));
        if (!name) return;
        if (typeof explorerAdapter.createContainer === 'function') {
            await explorerAdapter.createContainer({ api, name, parentContainerId: state.folderId, scope: { ...state.activeScope }, scopeParams: scopeParams() });
            await load();
            return;
        }
        await api(endpoint('createContainer', '/api/file-folders'), {
            method: 'POST',
            body: JSON.stringify({ ...scopeParams(), parentFolderId: state.folderId, name })
        });
        await load();
    }

    async function renameSelected() {
        const selected = state.selected;
        if (!selected) return;

        const selectedData = selected.data || {};
        const oldName = selected.kind === 'folder'
            ? (selectedData.name || selectedData.folderName || '')
            : (selectedData.name || selectedData.displayName || selectedData.originalName || selectedData.noteTitle || '');

        const dialogTitle = contentType === 'NOTE' && selected.kind !== 'folder'
            ? '제목 바꾸기'
            : '이름 바꾸기';
        const name = await nameDialog(dialogTitle, oldName);
        if (!name) return;

        if (typeof explorerAdapter.renameSelected === 'function') {
            await explorerAdapter.renameSelected({ api, selected, name });
            if (selected.kind !== 'folder') {
                document.dispatchEvent(new CustomEvent('moyo:content-metadata-updated', {
                    detail: { contentType, contentId: Number(selected.id) || selected.id, reason: 'rename', source: 'explorer' }
                }));
            }
            await load();
            return;
        }

        if (selected.kind === 'folder') {
            await api(`/api/file-folders/${selected.id}/name`, {
                method: 'PATCH',
                body: JSON.stringify({ name })
            });
        } else {
            await api(`/api/files/${selected.id}/name`, {
                method: 'PATCH',
                body: JSON.stringify({ name })
            });
            document.dispatchEvent(new CustomEvent('moyo:content-metadata-updated', {
                detail: { contentType: 'FILE', contentId: Number(selected.id) || selected.id, reason: 'rename', source: 'explorer' }
            }));
        }
        await load();
    }

    async function deleteSelected() {
        const selected = state.selected;
        if (!selected) return;
        state.selection.clear();
        state.selection.add(itemKey(selected.kind, selected.id));
        syncSelectionClasses();
        await runBatchAction(state.trashMode ? 'permanent' : 'trash');
    }

    async function setMoyoPublic(contentId, nextPublic) {
        const id = Number(contentId);
        if (!Number.isFinite(id) || id <= 0) throw new Error('콘텐츠를 찾지 못했습니다.');
        if (contentType === 'PHOTO') {
            await api(`/api/photo-posts/${id}/visibility`, {
                method: 'PUT',
                body: JSON.stringify({ visibilityType: nextPublic ? 'FRIENDS' : 'PRIVATE' })
            });
        } else if (contentType === 'NOTE') {
            await api(`/note/api/${id}/moyo-public`, {
                method: 'POST',
                body: JSON.stringify({ moyoPublic: Boolean(nextPublic) })
            });
        } else {
            throw new Error('이 콘텐츠는 MOYO 공개 설정을 지원하지 않습니다.');
        }
    }

    async function toggleMoyoPublic(contentId, nextPublic) {
        await setMoyoPublic(contentId, nextPublic);
        await loadItems();
    }

    async function upload(files) {
        if (typeof explorerAdapter.uploadItems === 'function') {
            await explorerAdapter.uploadItems({ files, containerId: state.folderId, scope: { ...state.activeScope }, scopeParams: scopeParams(), contextPath, api });
            await loadItems();
            return;
        }
        if (!files?.length) return;
        const formData = new FormData();
        [...files].forEach(file => formData.append('files', file));
        Object.entries({ ...scopeParams(), folderId: state.folderId }).forEach(([key, value]) => {
            if (value != null) formData.append(key, value);
        });
        await api(endpoint('uploadItems', '/api/files/batch'), { method: 'POST', body: formData });
        await loadItems();
    }

    // Show the full folder name only when the tree label is actually truncated.
    root.addEventListener('mouseover', event => {
        const name = event.target.closest('.file-tree-row__name[data-folder-full-name]');
        if (!name || !root.contains(name)) return;
        const truncated = name.scrollWidth > name.clientWidth + 1;
        if (truncated) name.setAttribute('title', name.dataset.folderFullName || name.textContent.trim());
        else name.removeAttribute('title');
    });

    root.addEventListener('mouseout', event => {
        const name = event.target.closest('.file-tree-row__name[data-folder-full-name]');
        if (!name || !root.contains(name)) return;
        name.removeAttribute('title');
    });

    root.addEventListener('click', async event => {
        const friendSend = event.target.closest('[data-explorer-friend-send]');
        if (friendSend) {
            event.preventDefault();
            event.stopPropagation();
            try {
                openSingleFriendSendModal(friendSend.dataset.contentId || friendSend.closest('[data-id]')?.dataset.id);
            } catch (error) {
                alert(error?.message || '친구에게 보내기를 열지 못했습니다.');
            }
            return;
        }

        const shareOpen = event.target.closest('[data-explorer-share-open]');
        if (shareOpen) {
            event.preventDefault();
            event.stopPropagation();
            try {
                openSingleShareModal(shareOpen.dataset.contentId || shareOpen.closest('[data-id]')?.dataset.id);
            } catch (error) {
                alert(error?.message || '공유 모달을 열지 못했습니다.');
            }
            return;
        }

        const action = event.target.closest('[data-action]');
        if (action) {
            if (action.dataset.action === 'new-folder') await createFolder();
            if (action.dataset.action === 'upload') {
                if (typeof explorerAdapter.openUpload === 'function') {
                    const activeContainer = state.folderId == null
                        ? null
                        : state.folders.find(folder => Number(folder.folderId ?? folder.id) === Number(state.folderId));
                    const containerName = activeContainer
                        ? String(activeContainer.folderName || activeContainer.name || '').trim()
                        : '';
                    explorerAdapter.openUpload({
                        containerId: state.folderId,
                        containerName,
                        scope: { ...state.activeScope },
                        contextPath
                    });
                }
                else fileInput?.click();
            }
            return;
        }

        if (event.target.closest('#fileFolderBackButton')) {
            const previous = state.navigationHistory.pop();
            if (!previous) return;
            if (previous.activeScope) state.activeScope = { ...previous.activeScope };
            await loadTree();
            if (previous.trashMode) {
                state.recentMode = false;
            state.friendShareMode = false;
            state.collectionMode = false;
            state.friendOwnerId = null;
            state.friendOwnerName = '';
            state.trashMode = true;
                state.folderId = null;
                state.path = [];
                root.classList.add('is-trash-mode');
                renderTree();
                renderBreadcrumb();
                return loadItems();
            }
            return openFolder(previous.folderId, { fromHistory: true });
        }

        if (event.target.closest('[data-tree-root]')) {
            const needsHistory = state.recentMode || state.trashMode || state.folderId !== null || !isBaseScope();
            if (needsHistory) state.navigationHistory.push(currentLocation());
            state.activeScope = { ...baseScope };
            state.recentMode = false;
            state.friendShareMode = false;
            state.collectionMode = false;
            state.friendOwnerId = null;
            state.friendOwnerName = '';
            state.trashMode = false;
            state.folderId = null;
            state.path = [];
            state.keyword = '';
            if (searchInput) searchInput.value = '';
            root.classList.remove('is-trash-mode');
            return load();
        }
        const collectionToggle = event.target.closest('[data-tree-collection-toggle]');
        if (collectionToggle) {
            const group = collectionToggle.closest('[data-tree-collection-group]');
            const collapsed = group?.classList.toggle('is-collapsed');
            collectionToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            return;
        }
        const collectionChild = event.target.closest('[data-tree-collection-type]');
        if (collectionChild) {
            state.collectionMode = true;
            state.collectionType = collectionChild.dataset.treeCollectionType === 'MOYO' ? 'MOYO' : 'LIKED';
            state.recentMode = false;
            state.friendShareMode = false;
            state.friendOwnerId = null;
            state.friendOwnerName = '';
            state.trashMode = false;
            state.folderId = null;
            state.path = [];
            state.activeScope = { ...baseScope };
            root.classList.remove('is-trash-mode');
            collectionChild.closest('[data-tree-collection-group]')?.classList.remove('is-collapsed');
            $('[data-tree-collection-toggle]')?.setAttribute('aria-expanded', 'true');
            renderTree();
            renderBreadcrumb();
            return loadItems();
        }

        if (event.target.closest('[data-tree-recent]')) {
            state.collectionMode = false;
            state.recentMode = true;
            state.friendShareMode = false;
            state.collectionMode = false;
            state.friendOwnerId = null;
            state.friendOwnerName = '';
            state.trashMode = false;
            state.folderId = null;
            state.path = [];
            root.classList.remove('is-trash-mode');
            renderTree();
            renderBreadcrumb();
            return loadItems();
        }

        const friendOwnerRow = event.target.closest('[data-friend-owner-id]');
        if (friendOwnerRow) {
            state.recentMode = false;
            state.trashMode = false;
            state.collectionMode = false;
            state.friendShareMode = true;
            state.friendOwnerId = Number(friendOwnerRow.dataset.friendOwnerId);
            state.friendOwnerName = friendOwnerRow.dataset.friendOwnerName || '친구';
            state.folderId = null;
            state.path = [];
            state.activeScope = { ...baseScope };
            root.classList.remove('is-trash-mode');
            renderTree();
            renderBreadcrumb();
            return loadItems();
        }

        const projectRow = event.target.closest('[data-project-id]');
        if (projectRow) return openProject(projectRow);

        const treeToggle = event.target.closest('[data-tree-toggle]');
        if (treeToggle) {
            event.preventDefault();
            event.stopPropagation();
            const folderId = Number(treeToggle.dataset.treeToggle);
            if (state.collapsedFolders.has(folderId)) state.collapsedFolders.delete(folderId);
            else state.collapsedFolders.add(folderId);
            renderTree();
            return;
        }

        const treeMore = event.target.closest('[data-tree-more]');
        if (treeMore) {
            event.preventDefault();
            event.stopPropagation();
            return showMenu(event, 'folder', Number(treeMore.dataset.treeMore));
        }
        if (event.target.closest('[data-tree-trash]')) {
            if (!state.trashMode) state.navigationHistory.push(currentLocation());
            state.collectionMode = false;
            state.recentMode = false;
            state.trashMode = true;
            state.folderId = null;
            state.path = [];
            root.classList.add('is-trash-mode');
            renderTree();
            renderBreadcrumb();
            return loadItems();
        }

        const treeRow = event.target.closest('[data-tree-id]');
        if (treeRow) return openFolder(Number(treeRow.dataset.treeId));

        if (event.target.closest('[data-project-crumb]')) return openFolder(null);

        const crumb = event.target.closest('[data-crumb]');
        if (crumb) return openFolder(crumb.dataset.crumb ? Number(crumb.dataset.crumb) : null);

        const card = event.target.closest('.file-item');
        if (!card) {
            if (state.suppressBlankClick) {
                state.suppressBlankClick = false;
                return;
            }
            if (event.target.closest('#fileBrowserGrid')) clearSelection();
            return;
        }

        const kind = card.dataset.kind;
        const id = Number(card.dataset.id);

        if (event.target.closest('[data-download]')) {
            event.preventDefault();
            event.stopPropagation();
            if (kind === 'folder') {
                const previousSelection = new Set(state.selection);
                state.selection.clear();
                state.selection.add(itemKey('folder', id));
                try {
                    await downloadSelectedItems();
                } finally {
                    state.selection.clear();
                    previousSelection.forEach(key => state.selection.add(key));
                    syncSelectionClasses();
                    updateStatusLine();
                    updateWorkbar();
                }
                return;
            }
            return openFileDownload(id);
        }

        selectCard(card, event);

        if (event.target.closest('[data-more]')) {
            event.preventDefault();
            event.stopPropagation();
            showMenu(event, kind, id);
        }
    });


    panel.addEventListener('pointerdown', beginRectangleSelection);
    grid.addEventListener('mouseup', clearNativeTextSelection);

    async function openFileDownload(id) {
        if (typeof explorerAdapter.downloadItem === 'function') {
            await explorerAdapter.downloadItem({ id, api, contextPath, scope: { ...state.activeScope } });
            return;
        }
        try {
            await api(`/api/files/${id}/access`, { method: 'POST' });
        } catch (_) {
            // 다운로드 API에서도 접근 기록을 남기므로 기록 실패가 다운로드를 막지는 않는다.
        }
        window.location = contextPath + `/api/files/${id}/download`;
    }

    async function openExplorerItem(id) {
        if (typeof explorerAdapter.openItem === 'function') {
            await explorerAdapter.openItem({ id, api, contextPath, scope: { ...state.activeScope } });
            return;
        }
        await openFileDownload(id);
    }

    grid.addEventListener('dblclick', event => {
        const card = event.target.closest('.file-item');
        if (!card || event.target.closest('[data-more], [data-download]')) return;
        event.preventDefault();
        event.stopPropagation();
        const kind = card.dataset.kind;
        const id = Number(card.dataset.id);
        if (kind === 'folder') {
            openFolder(id);
        } else {
            openExplorerItem(id);
        }
    });

    grid.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        const card = event.target.closest('.file-item');
        if (!card) return;
        event.preventDefault();
        const kind = card.dataset.kind;
        const id = Number(card.dataset.id);
        if (kind === 'folder') {
            openFolder(id);
        } else {
            openExplorerItem(id);
        }
    });

    function createSelectionDragPreview() {
        const preview = document.createElement('div');
        preview.setAttribute('aria-hidden', 'true');
        preview.style.cssText = [
            'position:fixed',
            'left:-9999px',
            'top:-9999px',
            'z-index:2147483647',
            'display:inline-flex',
            'align-items:center',
            'gap:6px',
            'min-height:28px',
            'padding:0 10px',
            'border:1px solid rgba(135,151,181,.38)',
            'border-radius:8px',
            'background:rgba(255,255,255,.94)',
            'box-shadow:0 4px 12px rgba(37,55,92,.12)',
            'color:#53627a',
            'font-size:12px',
            'font-weight:700',
            'white-space:nowrap',
            'pointer-events:none',
            'backdrop-filter:blur(6px)'
        ].join(';');
        preview.innerHTML = `<i class="fa-solid fa-arrow-right-arrow-left" aria-hidden="true" style="font-size:11px;color:#71819a"></i><span>${state.selection.size}개 항목 이동 중</span>`;
        document.body.appendChild(preview);
        return preview;
    }

    grid.addEventListener('dragstart', event => {
        const card = event.target.closest('.file-item');
        if (!card || state.trashMode) return event.preventDefault();
        if (!isSelectedCard(card)) selectCard(card, {});
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-moyo-file-selection', JSON.stringify(selectedPayload()));
        event.dataTransfer.setData('text/plain', `${state.selection.size}개 항목`);

        const preview = createSelectionDragPreview();
        event.dataTransfer.setDragImage(preview, 18, 19);
        setTimeout(() => preview.remove(), 0);

        requestAnimationFrame(() => {
            grid.querySelectorAll('.file-item.is-selected').forEach(item => item.classList.add('is-drag-source'));
        });
    });

    root.addEventListener('dragover', event => {
        if (!event.dataTransfer.types.includes('application/x-moyo-file-selection')) return;
        const targetFolderId = dropFolderId(event.target);
        if (targetFolderId === undefined) {
            clearDropTargets();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const allowed = markDropTarget(event.target, targetFolderId);
        event.dataTransfer.dropEffect = allowed ? 'move' : 'none';
    });

    root.addEventListener('drop', event => {
        if (!event.dataTransfer.types.includes('application/x-moyo-file-selection')) return;
        const targetFolderId = dropFolderId(event.target);
        if (targetFolderId === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        const selectedFolderIds = selectedPayload().folderIds || [];
        if (targetFolderId != null && selectedFolderIds.includes(Number(targetFolderId))) {
            clearDropTargets();
            return;
        }
        clearDropTargets();
        moveSelection(targetFolderId).catch(error => alert(error.message));
    });

    root.addEventListener('dragend', clearDropTargets);

    contextMenu.addEventListener('click', async event => {
        const command = event.target.dataset.command;
        if (!command) return;
        hideMenu();
        if (command === 'open') {
            if (state.selected.kind === 'folder') {
                await openFolder(state.selected.id);
            } else if (typeof explorerAdapter.openItem === 'function') {
                await explorerAdapter.openItem({ id: state.selected.id, contextPath, scope: { ...state.activeScope } });
            } else {
                await openFileDownload(state.selected.id);
            }
            return;
        }
        if (command === 'moyo') {
            const selectedData = state.selected?.data;
            if (canManageGroupAccess(selectedData)) {
                const restricted = await getGroupAccessMode(state.selected.id);
                const nextRestricted = !restricted;
                const message = nextRestricted
                    ? '이 항목을 비밀글로 변경할까요?\n작성자·수락된 권한 멤버와 팀장/관리자만 볼 수 있습니다.'
                    : '이 항목을 전체 공개로 변경할까요?\n현재 그룹/프로젝트 멤버가 볼 수 있습니다.';
                if (!confirm(message)) return;
                await setGroupAccessMode(state.selected.id, nextRestricted);
                await loadItems();
                return;
            }
            if (!canManageMoyo(selectedData)) return;
            await toggleMoyoPublic(state.selected.id, !isMoyoPublicItem(selectedData));
            return;
        }
        if (command === 'friend-send') {
            if (state.selected?.kind !== 'file' || !isMoyoPublicItem(state.selected.data)) return;
            openSingleFriendSendModal(state.selected.id);
            return;
        }
        if (command === 'rename') {
            if (state.trashMode) {
                state.selection.clear();
                state.selection.add(itemKey(state.selected.kind, state.selected.id));
                syncSelectionClasses();
                await runBatchAction('restore');
            } else {
                await renameSelected();
            }
        }
        if (command === 'share') {
            if (state.selected.kind !== 'file') return;
            const selectedData = state.selected.data || selectedItem('file', state.selected.id);
            if (!isPersonalShareScope() && !(isMemberPermissionScope() && canManageMemberPermission(selectedData))) return;
            const previousSelection = new Set(state.selection);
            const previousLastSelectedKey = state.lastSelectedKey;
            state.selection.clear();
            state.selection.add(itemKey('file', state.selected.id));
            state.lastSelectedKey = itemKey('file', state.selected.id);
            syncSelectionClasses();
            updateStatusLine();
            updateWorkbar();
            try {
                if (isMemberPermissionScope()) openSingleShareModal(state.selected.id);
                else openBatchShareModal({ ...selectedPayload(), ...scopeParams() });
            } catch (error) {
                state.selection.clear();
                previousSelection.forEach(key => state.selection.add(key));
                state.lastSelectedKey = previousLastSelectedKey;
                syncSelectionClasses();
                updateStatusLine();
                updateWorkbar();
                throw error;
            }
            return;
        }
        if (command === 'download') {
            if (state.selected.kind === 'folder') {
                const previousSelection = new Set(state.selection);
                state.selection.clear();
                state.selection.add(itemKey('folder', state.selected.id));
                try {
                    await downloadSelectedItems();
                } finally {
                    state.selection.clear();
                    previousSelection.forEach(key => state.selection.add(key));
                    syncSelectionClasses();
                    updateStatusLine();
                    updateWorkbar();
                }
            } else {
                openFileDownload(state.selected.id);
            }
        }
        if (command === 'delete') {
            if (state.trashMode) {
                state.selection.clear();
                state.selection.add(itemKey(state.selected.kind, state.selected.id));
                syncSelectionClasses();
                await runBatchAction('permanent');
            } else {
                await deleteSelected();
            }
        }
        if (command === 'move') openMoveFolderModal();
    });

    root.addEventListener('click', event => {
        const batch = event.target.closest('[data-batch-action]');
        if (!batch) return;
        const action = batch.dataset.batchAction;
        if (action === 'moyo') {
            const selectedItems = state.renderedItems.filter(item => state.selection.has(itemKey(item.kind, item.id)));
            const manageableItems = selectedItems.filter(item => item?.kind === 'file' && canManageMoyo(item));
            if (!selectedItems.length || manageableItems.length !== selectedItems.length) return;

            const nextPublic = manageableItems.some(item => !isMoyoPublicItem(item));
            const count = manageableItems.length;
            const confirmMessage = nextPublic
                ? `선택한 ${count}개 항목을 MOYO에 공개할까요?`
                : `선택한 ${count}개 항목의 MOYO 공개를 해제할까요?`;
            if (!confirm(confirmMessage)) return;

            batch.disabled = true;
            Promise.all(manageableItems.map(item => setMoyoPublic(item.id, nextPublic)))
                .then(() => loadItems())
                .catch(error => alert(error.message))
                .finally(() => { batch.disabled = false; });
            return;
        }
        if (action === 'friend-send') {
            const selectedItems = state.renderedItems.filter(item => state.selection.has(itemKey(item.kind, item.id)));
            const item = selectedItems.length === 1 ? selectedItems[0] : null;
            if (item && item.kind === 'file' && isMoyoPublicItem(item)) {
                try { openSingleFriendSendModal(item.id); } catch (error) { alert(error.message); }
            }
            return;
        }
        if (action === 'move') {
            openMoveFolderModal({ ensureContextSelection: false });
            return;
        }
        runBatchAction(action).catch(error => alert(error.message));
    });

    let contentMetadataRefreshTimer = null;
    document.addEventListener('moyo:content-metadata-updated', event => {
        const detail = event.detail || {};
        const changedType = String(detail.contentType || '').toUpperCase();
        if (!changedType || changedType !== contentType) return;
        if (detail.source === 'explorer') return;
        clearTimeout(contentMetadataRefreshTimer);
        contentMetadataRefreshTimer = setTimeout(() => {
            loadItems().catch(error => console.warn('연결 콘텐츠 변경 후 탐색기 갱신 실패', error));
        }, 180);
    });

    document.addEventListener('moyo:note-deleted', event => {
        if (contentType !== 'NOTE') return;
        const deletedId = Number(event.detail?.noteId || 0);
        if (!deletedId) return;
        state.selection.delete(itemKey('file', deletedId));
        if (state.selected?.kind === 'file' && Number(state.selected.id) === deletedId) state.selected = null;
        loadItems().catch(error => console.warn('노트 삭제 후 탐색기 갱신 실패', error));
    });

    document.addEventListener('moyo:explorer-collection-state-changed', event => {
        const detail = event.detail || {};
        if (!state.collectionMode) return;
        if (String(detail.contentType || '').toUpperCase() !== contentType) return;

        const shouldDisappear =
            (state.collectionType === 'LIKED' && detail.liked === false) ||
            (state.collectionType === 'MOYO' && detail.moyoPublic === false);
        if (!shouldDisappear) return;

        loadItems().catch(error => console.warn('모아보기 목록 갱신 실패', error));
    });

    if (fileInput) {
        fileInput.addEventListener('change', () => upload(fileInput.files).finally(() => {
            fileInput.value = '';
        }));
    }

    const syncSearchClear = () => {
        if (searchClear) searchClear.hidden = !searchInput?.value;
    };

    let searchTimer;
    searchInput.addEventListener('input', event => {
        syncSearchClear();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.keyword = event.target.value.trim();
            loadItems();
        }, 250);
    });

    searchClear?.addEventListener('click', () => {
        clearTimeout(searchTimer);
        if (!searchInput.value) return;
        searchInput.value = '';
        state.keyword = '';
        syncSearchClear();
        searchInput.focus();
        loadItems();
    });
    syncSearchClear();

    renderSortMenu();
    sortButton?.addEventListener('click', event => {
        event.stopPropagation();
        if (sortMenu?.hidden) openSortMenu();
        else closeSortMenu();
    });
    sortMenu?.addEventListener('click', event => {
        const option = event.target.closest('[data-sort-value]');
        if (!option) return;
        event.stopPropagation();
        const nextSort = option.dataset.sortValue;
        if (!nextSort || nextSort === state.sort) { closeSortMenu(); return; }
        state.sort = nextSort;
        renderSortMenu();
        closeSortMenu();
        loadItems();
    });

    root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
        const nextView = button.dataset.view;
        if (!nextView || nextView === state.view) return;
        state.view = nextView;
        grid.classList.toggle('is-list', state.view === 'list');
        root.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('is-active', item === button));
        // 카드와 리스트 DOM은 역할이 다르므로 현재 데이터만 다시 렌더링한다. 네트워크 재조회는 하지 않는다.
        renderItems(state.currentFolderItems, state.currentFileItems);
    }));

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') { closeSortMenu(); clearSelection(); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
            event.preventDefault();
            state.renderedItems.forEach(item => state.selection.add(itemKey(item.kind, item.id)));
            syncSelectionClasses();
        }
        if (event.key === 'Delete' && state.selection.size) {
            const active = document.activeElement;
            const isEditing = /INPUT|TEXTAREA|SELECT/.test(active?.tagName || '')
                || active?.isContentEditable
                || Boolean(active?.closest?.('[contenteditable="true"], [role="dialog"]'));
            if (isEditing) return;
            event.preventDefault();
            runBatchAction(state.trashMode ? 'permanent' : 'trash').catch(error => alert(error.message));
        }
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('#fileContextMenu') && !event.target.closest('[data-more]')) hideMenu();
        if (!event.target.closest('[data-sort-control]')) closeSortMenu();
    });

    const externalDropEnabled = Boolean((dropZone && fileInput) || explorerAdapter.supportsExternalDrop);
    if (externalDropEnabled) {
        ['dragenter', 'dragover'].forEach(type => root.addEventListener(type, event => {
            if (event.dataTransfer.types.includes('application/x-moyo-file-selection')) return;
            if (!event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            dropZone?.classList.add('is-dragging');
        }));
        ['dragleave', 'drop'].forEach(type => root.addEventListener(type, event => {
            if (event.dataTransfer.types.includes('application/x-moyo-file-selection')) return;
            if (type === 'drop' && !event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            dropZone?.classList.remove('is-dragging');
            if (type === 'drop' && event.dataTransfer.files?.length) {
                upload(event.dataTransfer.files).catch(error => alert(error.message));
            }
        }));
    }

    load().catch(error => alert(error.message));
})();
