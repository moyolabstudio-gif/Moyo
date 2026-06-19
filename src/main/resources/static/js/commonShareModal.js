(function () {
    const DEFAULT_IDS = {
        openButton: 'openNoteWriteShareModal',
        modal: 'noteWriteShareModal',
        keyword: 'noteWriteShareKeyword',
        applyButton: 'applyNoteWriteShareModal',
        title: 'noteWriteShareModalTitle',
        context: 'noteWriteShareContext',
        candidates: 'noteWriteShareCandidates',
        selected: 'noteWriteShareSelected',
        hiddenFields: 'noteWriteShareHiddenFields',
        count: 'noteWriteShareCount',
        modalCount: 'noteWriteShareModalCount',
        permissionButton: 'openNoteWritePermissionModal',
        permissionCount: 'noteWritePermissionCount',
        initialSharesSource: 'noteShareInitialSource',
        workspaceMemberSource: 'noteWriteWorkspaceMemberSource',
        projectMemberSource: 'noteWriteProjectMemberSource',
        workspaceTargetSource: 'noteWriteWorkspaceTargetSource',
        projectTargetSource: 'noteWriteProjectTargetSource',
        friendManageLink: 'noteShareFriendManageLink'
    };

    function initShareModal(userOptions) {
        const options = Object.assign({ contentType: 'NOTE' }, userOptions || {});
        const ids = Object.assign({}, DEFAULT_IDS, options.ids || {});
        const el = (name) => document.getElementById(ids[name]);
        const cssId = (id) => '#' + String(id).replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g, '\\$1');
        const modalSelector = () => cssId(ids.modal);
        const selected = new Map();       // 공유 대상: USER / WS / PROJ, 기본 VIEW
        const editors = new Map();        // 편집 권한: USER만 EDIT
        const originalShares = new Map(); // 상세 화면 저장 비교용
        const groupMemberCache = new Map();
        const groupMemberLoading = new Set();
        let cachedCandidates = [];
        let activeTab = 'FRIEND';
        let mode = 'SHARE';
        let mounted = false;

        // 사용자/상태 보조 함수
        const currentUserId = () => String(
            firstValue(
                options.currentUserId,
                el('modal')?.dataset.currentUserId,
                document.body?.dataset.userId,
                document.getElementById('userId')?.value,
                ''
            )
        ).trim();
        const isCurrentUserId = (userId) => {
            const me = currentUserId();
            return !!me && String(userId || '').trim() === me;
        };

        // 초기화 / 이벤트 바인딩
        function mount() {
            if (mounted) return;
            const openButton = el('openButton');
            const modal = el('modal');
            const keyword = el('keyword');
            if (!openButton || !modal || !keyword) return;
            mounted = true;

            normalizeModalText();
            ensurePermissionButton(openButton);
            loadInitialShares();

            openButton.addEventListener('click', () => openModal('SHARE'));
            el('permissionButton')?.addEventListener('click', () => openModal('PERMISSION'));
            modal.querySelectorAll('[data-note-share-close]').forEach((node) => node.addEventListener('click', closeModal));
            el('applyButton')?.addEventListener('click', () => {
                if (options.persist) syncShareChanges();
                else closeModal();
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && !modal.hidden) closeModal();
            });

            document.querySelectorAll(modalSelector() + ' [data-share-tab]').forEach((tab) => {
                tab.addEventListener('click', () => {
                    if (mode !== 'SHARE') return;
                    activeTab = tab.dataset.shareTab || 'FRIEND';
                    keyword.value = '';
                    document.querySelectorAll(modalSelector() + ' [data-share-tab]').forEach((item) => item.classList.toggle('is-active', item === tab));
                    updatePlaceholder();
                    loadCandidates();
                });
            });

            keyword.addEventListener('input', debounce(loadCandidates, 160));
            updatePlaceholder();
            renderSelected();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mount, { once: true });
        } else {
            mount();
        }

        function normalizeModalText() {
            const title = el('title');
            if (title) title.textContent = '공유하기';
            const desc = title?.closest('.note-write-share-modal-head')?.querySelector('p');
            if (desc) desc.textContent = '공유는 보기 범위만 정하고, 편집은 권한에서 따로 지정합니다.';
            const subtitles = document.querySelectorAll(modalSelector() + ' .note-write-share-subtitle');
            if (subtitles[0]) subtitles[0].textContent = '공유 대상';
            if (subtitles[1]) {
                subtitles[1].innerHTML = '공유 목록 <span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                subtitles[1].classList.add('note-write-share-subtitle-with-count');
            }
            const friendLink = el('friendManageLink');
            if (friendLink) friendLink.remove();
            el('context')?.setAttribute('hidden', 'hidden');
            document.querySelector(modalSelector() + ' .note-write-share-body')?.classList.add('note-write-share-body-simple');
        }

        function ensurePermissionButton(openButton) {
            if (el('permissionButton')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.id = ids.permissionButton;
            button.className = openButton.className || 'note-meta-text';
            button.classList.add('note-meta-permission');
            button.innerHTML = '<span class="note-meta-label">편집 권한</span><span id="' + escapeHtml(ids.permissionCount) + '" class="note-share-count" hidden>0</span>';
            openButton.insertAdjacentElement('afterend', button);
        }

        function loadInitialShares() {
            const source = el('initialSharesSource');
            if (!source) return;
            Array.from(source.children || []).forEach((node) => {
                const type = normalizeType(node.dataset.targetType);
                const id = String(firstValue(node.dataset.targetId, '')).trim();
                if (!type || !id) return;
                const key = makeKey(type, id);
                const permission = String(firstValue(node.dataset.permissionType, 'VIEW')).toUpperCase() === 'EDIT' ? 'EDIT' : 'VIEW';
                const item = {
                    type,
                    id,
                    name: firstValue(node.dataset.targetName, '이름 없음'),
                    email: type === 'USER' ? firstValue(node.dataset.targetSubtext, '') : '',
                    subText: firstValue(node.dataset.targetSubtext, type === 'WS' ? '워크스페이스' : (type === 'PROJ' ? '프로젝트' : '친구')),
                    imagePath: firstValue(node.dataset.profileImagePath, node.dataset.imagePath, ''),
                    contextName: firstValue(node.dataset.targetSubtext, ''),
                    wsName: type === 'PROJ' ? firstValue(node.dataset.targetSubtext, '') : '',
                    permission,
                    shareId: String(firstValue(node.dataset.shareId, '')).trim()
                };
                selected.set(key, { ...item, permission: 'VIEW' });
                originalShares.set(key, { ...item });
                if (type === 'USER' && permission === 'EDIT') {
                    editors.set(key, { ...item, type: 'USER', permission: 'EDIT' });
                }
            });
            removeOrphanEditors();
        }

        function normalizeType(type) {
            const value = String(type || '').trim().toUpperCase();
            if (value === 'WORKSPACE') return 'WS';
            if (value === 'PROJECT') return 'PROJ';
            if (value === 'FRIEND') return 'USER';
            return ['USER', 'WS', 'PROJ'].includes(value) ? value : '';
        }

        function currentRowsMap() {
            const rows = new Map();
            selected.forEach((item) => {
                const type = normalizeType(item.type);
                const key = makeKey(type, item.id);
                rows.set(key, {
                    type,
                    id: item.id,
                    permission: type === 'USER' && editors.has(makeKey('USER', item.id)) ? 'EDIT' : 'VIEW'
                });
            });
            return rows;
        }

        function permissionRowsMap() {
            const rows = new Map();
            selected.forEach((item) => {
                const type = normalizeType(item.type);
                const key = makeKey(type, item.id);
                rows.set(key, {
                    type,
                    id: item.id,
                    permission: type === 'USER' && editors.has(makeKey('USER', item.id)) ? 'EDIT' : 'VIEW'
                });
            });
            editors.forEach((item) => {
                const key = makeKey('USER', item.id);
                if (!rows.has(key)) {
                    rows.set(key, { type: 'USER', id: item.id, permission: 'EDIT' });
                }
            });
            return rows;
        }

        function syncShareChanges() {
            const contentType = String(options.contentType || 'NOTE');
            const contentId = String(firstValue(options.contentId, el('openButton')?.dataset.shareContentId, '')).trim();
            if (!contentId) { closeModal(); return; }
            const applyButton = el('applyButton');
            if (applyButton) { applyButton.disabled = true; applyButton.textContent = '저장 중'; }

            const tasks = [];

            if (mode === 'PERMISSION') {
                const rows = permissionRowsMap();
                rows.forEach((row, key) => {
                    const old = originalShares.get(key);
                    if (!old && row.permission !== 'EDIT') return;
                    if (!old || String(old.permission || 'VIEW').toUpperCase() !== row.permission) {
                        const body = new URLSearchParams({
                            contentType,
                            contentId,
                            targetType: row.type,
                            targetId: row.id,
                            permissionType: row.permission
                        });
                        tasks.push(fetch('/share/api/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                            credentials: 'same-origin',
                            body: body.toString()
                        }).then(assertShareResponse));
                    }
                });
            } else {
                const currentRows = currentRowsMap();
                originalShares.forEach((old, key) => {
                    if (!currentRows.has(key) && old.shareId) {
                        const body = new URLSearchParams({ shareId: old.shareId });
                        tasks.push(fetch('/share/api/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                            credentials: 'same-origin',
                            body: body.toString()
                        }).then(assertShareResponse));
                    }
                });

                currentRows.forEach((row, key) => {
                    const old = originalShares.get(key);
                    if (!old || String(old.permission || 'VIEW').toUpperCase() !== row.permission) {
                        const body = new URLSearchParams({
                            contentType,
                            contentId,
                            targetType: row.type,
                            targetId: row.id,
                            permissionType: row.permission
                        });
                        tasks.push(fetch('/share/api/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                            credentials: 'same-origin',
                            body: body.toString()
                        }).then(assertShareResponse));
                    }
                });
            }

            Promise.all(tasks).then(() => {
                closeModal();
                if (options.reloadOnPersist !== false) window.location.reload();
            }).catch((error) => {
                alert(error && error.message ? error.message : '공유 정보를 저장하지 못했습니다.');
            }).finally(() => {
                if (applyButton) { applyButton.disabled = false; applyButton.textContent = '적용'; }
            });
        }

        function assertShareResponse(res) {
            return res.json().catch(() => ({})).then((data) => {
                if (!res.ok || data.success === false) throw new Error(data.message || '공유 요청 실패');
                return data;
            });
        }

        function openModal(nextMode) {
            mode = nextMode === 'PERMISSION' ? 'PERMISSION' : 'SHARE';
            const modal = el('modal');
            if (!modal) return;
            modal.hidden = false;
            modal.dataset.shareMode = mode.toLowerCase();
            document.body.classList.add(options.bodyOpenClass || 'note-share-modal-open');
            applyModeText();
            updatePlaceholder();
            loadCandidates();
            renderSelected();
            setTimeout(() => el('keyword')?.focus(), 30);
        }

        function closeModal() {
            const modal = el('modal');
            if (!modal) return;
            modal.hidden = true;
            document.body.classList.remove(options.bodyOpenClass || 'note-share-modal-open');
            (mode === 'PERMISSION' ? el('permissionButton') : el('openButton'))?.focus();
        }

        function applyModeText() {
            const title = el('title');
            const desc = title?.closest('.note-write-share-modal-head')?.querySelector('p');
            const tabs = document.querySelector(modalSelector() + ' .note-write-share-tabs');
            const subtitles = document.querySelectorAll(modalSelector() + ' .note-write-share-subtitle');
            if (mode === 'PERMISSION') {
                if (title) title.textContent = '권한 설정';
                if (desc) desc.textContent = '공유된 사람 중 편집 가능한 멤버만 따로 지정합니다.';
                if (tabs) tabs.hidden = true;
                if (subtitles[0]) subtitles[0].textContent = '편집 권한을 줄 멤버';
                if (subtitles[1]) {
                    subtitles[1].innerHTML = '편집 가능 <span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                    subtitles[1].classList.add('note-write-share-subtitle-with-count');
                }
            } else {
                if (title) title.textContent = '공유하기';
                if (desc) desc.textContent = '공유는 보기 범위만 정하고, 편집은 권한에서 따로 지정합니다.';
                if (tabs) tabs.hidden = false;
                if (subtitles[0]) subtitles[0].textContent = '공유 대상';
                if (subtitles[1]) {
                    subtitles[1].innerHTML = '공유 목록 <span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                    subtitles[1].classList.add('note-write-share-subtitle-with-count');
                }
            }
        }

        function updatePlaceholder() {
            const keyword = el('keyword');
            if (!keyword) return;
            if (mode === 'PERMISSION') {
                keyword.placeholder = '편집 권한을 줄 멤버 검색';
            } else if (activeTab === 'FRIEND') {
                keyword.placeholder = '친구 이름 또는 이메일 검색';
            } else if (activeTab === 'WORKSPACE') {
                keyword.placeholder = '워크스페이스 검색';
            } else {
                keyword.placeholder = '프로젝트 검색';
            }
        }

        // 후보 데이터 로딩
        function loadCandidates() {
            if (mode === 'PERMISSION') {
                loadPermissionCandidates();
                return;
            }
            if (activeTab === 'FRIEND') {
                loadFriendCandidates();
                return;
            }
            const keyword = getKeyword();
            const source = activeTab === 'WORKSPACE' ? getWorkspaceTargets() : getProjectTargets();
            cachedCandidates = source
                .filter((item) => !selected.has(makeKey(item.type, item.id)))
                .filter((item) => matchKeyword(item, keyword));
            renderCandidatesFromCache();
        }

        function loadFriendCandidates() {
            const keyword = getKeyword();
            fetch('/friends/api/list?keyword=' + encodeURIComponent(keyword), { credentials: 'same-origin' })
                .then((res) => res.json())
                .then((data) => {
                    cachedCandidates = (data.friends || [])
                        .map(friendToTarget)
                        .filter(Boolean)
                        .filter((item) => !isCurrentUserId(item.id))
                        .filter((item) => !selected.has(makeKey('USER', item.id)));
                    renderCandidatesFromCache();
                })
                .catch(() => renderCandidates([], '친구 목록을 불러오지 못했습니다.'));
        }

        function friendToTarget(item) {
            const id = String(firstValue(item.userId, item.USER_ID, item.id, item.ID, '')).trim();
            if (!id) return null;
            return {
                type: 'USER',
                id,
                name: firstValue(item.userName, item.USER_NAME, item.name, item.NAME, item.email, item.EMAIL, '이름 없음'),
                email: firstValue(item.email, item.EMAIL, ''),
                subText: firstValue(item.email, item.EMAIL, '친구'),
                imagePath: firstValue(item.profileImagePath, item.profileImage, item.profileImg, item.profileImageUrl, item.profilePath, item.imagePath),
                sourceLabel: '친구',
                contextName: ''
            };
        }

        function loadPermissionCandidates() {
            const keyword = getKeyword();
            const pendingLoads = ensureSharedGroupMembersLoaded();
            const accessUsers = getAccessUsers();
            cachedCandidates = accessUsers
                .filter((item) => !editors.has(makeKey('USER', item.id)))
                .filter((item) => matchKeyword(item, keyword));

            let message;
            if (selected.size === 0) {
                message = '먼저 공유 대상에서 친구/워크스페이스/프로젝트를 추가하세요.';
            } else if (pendingLoads > 0) {
                message = '공유된 그룹 멤버를 불러오는 중입니다.';
            } else {
                message = '공유된 대상 중 추가할 편집 후보가 없습니다.';
            }
            renderCandidates(cachedCandidates, message);
        }

        function renderCandidatesFromCache() {
            renderCandidates(cachedCandidates);
        }

        // 렌더링
        function renderCandidates(items, emptyMessage) {
            const box = el('candidates');
            if (!box) return;
            if (!items.length) {
                box.innerHTML = `<div class="note-write-share-empty">${escapeHtml(emptyMessage || '선택할 대상이 없습니다.')}</div>`;
                return;
            }

            if (mode === 'PERMISSION') {
                box.innerHTML = `<div class="note-write-share-picked-list note-share-permission-member-list">
                    ${items.map((item) => permissionMemberLineHtml(item, 'add')).join('')}
                </div>`;
                box.querySelectorAll('[data-permission-add]').forEach((button) => {
                    const addEditor = () => {
                        const item = cachedCandidates.find((candidate) => String(candidate.id) === String(button.dataset.permissionAdd));
                        if (!item) return;
                        editors.set(makeKey('USER', item.id), { ...item, type: 'USER', permission: 'EDIT' });
                        loadCandidates();
                        renderSelected();
                    };
                    button.addEventListener('click', addEditor);
                    button.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            addEditor();
                        }
                    });
                });
                return;
            }

            box.innerHTML = items.map((item) => {
                const key = makeKey(item.type, item.id);
                return `
                    <div class="note-share-target-block note-share-type-${escapeHtml(item.type.toLowerCase())}">
                        <div class="note-write-share-card note-share-type-${escapeHtml(item.type.toLowerCase())}" data-type="${escapeHtml(item.type)}" data-id="${escapeHtml(item.id)}" role="button" tabindex="0">
                            ${avatarHtml(item)}
                            <span class="note-write-share-main">
                                <strong>${escapeHtml(item.name)}</strong>
                                <small>${escapeHtml(item.subText || item.contextName || '')}</small>
                            </span>
                            <span class="note-share-candidate-actions">
                                <span class="note-share-member-only-badge">공유</span>
                            </span>
                            <span class="note-write-share-check" aria-hidden="true"></span>
                        </div>
                    </div>
                `;
            }).join('');

            box.querySelectorAll('.note-write-share-card').forEach((row) => {
                const toggle = () => {
                    const key = makeKey(row.dataset.type, row.dataset.id);
                    const item = cachedCandidates.find((candidate) => makeKey(candidate.type, candidate.id) === key);
                    if (!item) return;
                    selected.set(key, { ...item, permission: 'VIEW' });
                    loadCandidates();
                    renderSelected();
                };
                row.addEventListener('click', toggle);
                row.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggle();
                    }
                });
            });
        }

        function renderSelected() {
            const box = el('selected');
            const hidden = el('hiddenFields');
            const count = el('count');
            const modalCount = el('modalCount');

            const displayCount = mode === 'PERMISSION' ? editors.size : selected.size;
            if (count) {
                count.textContent = String(selected.size);
                count.hidden = selected.size === 0;
            }
            if (modalCount) {
                modalCount.textContent = '(' + String(displayCount) + ')';
                modalCount.hidden = displayCount === 0;
            }
            const permissionCount = el('permissionCount');
            if (permissionCount) {
                permissionCount.textContent = String(editors.size);
                permissionCount.hidden = editors.size === 0;
            }

            if (box) {
                const rows = mode === 'PERMISSION' ? Array.from(editors.entries()) : Array.from(selected.entries());
                if (!rows.length) {
                    box.innerHTML = `<div class="note-write-share-empty note-write-share-empty-compact">${mode === 'PERMISSION' ? '아직 편집 가능한 멤버가 없습니다.' : '아직 선택된 공유 대상이 없습니다.'}</div>`;
                } else {
                    box.innerHTML = mode === 'PERMISSION'
                        ? `<div class="note-write-share-picked-list note-share-permission-member-list note-share-permission-editor-list">
                            ${rows.map(([key, item]) => permissionMemberLineHtml(item, 'remove', key)).join('')}
                        </div>`
                        : `<div class="note-write-share-picked-list note-share-selected-list-view">
                            ${rows.map(([key, item]) => selectedLineHtml(key, item)).join('')}
                        </div>`;
                    box.querySelectorAll('[data-remove-share]').forEach((button) => {
                        button.addEventListener('click', (event) => {
                            event.stopPropagation();
                            const key = button.dataset.removeShare;
                            if (mode === 'PERMISSION') {
                                const item = editors.get(key);
                                editors.delete(key);
                                if (item && !selected.has(key)) {
                                    selected.set(key, { ...item, type: 'USER', permission: 'VIEW' });
                                }
                            } else {
                                selected.delete(key);
                                removeOrphanEditors();
                            }
                            loadCandidates();
                            renderSelected();
                        });
                    });
                }
            }

            renderHiddenFields();
        }

        function permissionMemberLineHtml(item, action, key) {
            const isRemove = action === 'remove';
            const actionHtml = isRemove
                ? `<button type="button" class="note-share-remove note-share-remove-text" data-remove-share="${escapeHtml(key || makeKey('USER', item.id))}">제거</button>`
                : `<button type="button" class="note-share-permission-add-btn" data-permission-add="${escapeHtml(item.id)}">추가</button>`;
            return `
                <div class="note-share-permission-member-row ${isRemove ? 'is-editor' : ''}">
                    <span class="note-share-permission-member-main">
                        <strong>${escapeHtml(item.name || '이름 없음')}</strong>
                        ${sourceTagsHtml(item)}
                    </span>
                    <span class="note-share-selected-actions">${actionHtml}</span>
                </div>
            `;
        }

        function selectedLineHtml(key, item) {
            const isEditor = mode === 'PERMISSION';
            const actionHtml = isEditor
                ? `<button type="button" class="note-share-remove note-share-remove-text" data-remove-share="${escapeHtml(key)}">제거</button>`
                : `<span class="note-share-readonly-permission">보기</span><button type="button" class="note-share-remove" data-remove-share="${escapeHtml(key)}" aria-label="공유 해제">×</button>`;
            return `
                <div class="note-share-target-block note-share-selected-user note-share-type-${escapeHtml(item.type.toLowerCase())}">
                    <div class="note-write-share-card note-share-type-${escapeHtml(item.type.toLowerCase())} is-added">
                        ${avatarHtml(item)}
                        <span class="note-write-share-main">
                            <strong>${escapeHtml(item.name)}</strong>
                            ${isEditor ? sourceTagsHtml(item) : shareTargetMetaHtml(item)}
                        </span>
                        <span class="note-share-selected-actions">${actionHtml}</span>
                    </div>
                </div>
            `;
        }

        // form submit용 hidden field
        function renderHiddenFields() {
            const hidden = el('hiddenFields');
            if (!hidden) return;
            const rows = currentRowsMap();
            hidden.innerHTML = Array.from(rows.values()).map((item) => `
                <input type="hidden" name="shareTargetType" value="${escapeHtml(item.type)}">
                <input type="hidden" name="shareTargetId" value="${escapeHtml(item.id)}">
                <input type="hidden" name="sharePermissionType" value="${escapeHtml(item.permission)}">
            `).join('');
        }

        function removeOrphanEditors() {
            const accessIds = new Set(getAccessUsers().map((item) => String(item.id)));
            Array.from(editors.keys()).forEach((key) => {
                const item = editors.get(key);
                if (!item || !accessIds.has(String(item.id))) editors.delete(key);
            });
        }

        function getAccessUsers() {
            const map = new Map();
            selected.forEach((item) => {
                if (item.type === 'USER') {
                    addAccessUser(map, item, { type: 'USER', label: '친구', id: item.id });
                } else if (item.type === 'WS') {
                    getWorkspaceMembers(item.id).forEach((member) => addAccessUser(map, member, { type: 'WS', label: item.name || '워크스페이스', id: item.id }));
                } else if (item.type === 'PROJ') {
                    getProjectMembers(item.id).forEach((member) => addAccessUser(map, member, { type: 'PROJ', label: item.name || '프로젝트', id: item.id, parent: item.wsName || '' }));
                }
            });
            return Array.from(map.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));
        }

        function addAccessUser(map, user, sourceTag) {
            const id = String(user.id || '').trim();
            if (!id || isCurrentUserId(id)) return;
            const key = makeKey('USER', id);
            const tag = normalizeSourceTag(sourceTag);
            const existing = map.get(key);
            if (existing) {
                if (tag && !existing.sourceTagKeys.has(tag.key)) {
                    existing.sourceTagKeys.add(tag.key);
                    existing.sourceTags.push(tag);
                }
                existing.subText = existing.sourceTags.map((item) => item.label).join(' ');
                return;
            }
            const sourceTags = tag ? [tag] : [];
            map.set(key, {
                type: 'USER',
                id,
                name: user.name || user.userName || user.email || '이름 없음',
                email: user.email || '',
                imagePath: user.imagePath || user.profileImagePath || '',
                subText: sourceTags.map((item) => item.label).join(' ') || user.subText || '공유 대상',
                contextName: user.contextName || '',
                sourceTags,
                sourceTagKeys: new Set(sourceTags.map((item) => item.key))
            });
        }

        function normalizeSourceTag(sourceTag) {
            if (!sourceTag) return null;
            const type = String(sourceTag.type || 'USER').toUpperCase();
            const label = String(sourceTag.label || '').trim();
            if (!label) return null;
            const id = String(sourceTag.id || label).trim();
            return {
                type,
                id,
                label,
                parent: String(sourceTag.parent || '').trim(),
                key: type + '_' + id + '_' + label
            };
        }

        // DOM/API 데이터 파싱
        function getWorkspaceTargets() {
            const map = new Map();
            const targetSource = el('workspaceTargetSource');
            Array.from(targetSource ? targetSource.children : []).forEach((node) => {
                const id = String(firstValue(node.dataset.wsId, node.dataset.id, '')).trim();
                if (!id || map.has(id)) return;
                const name = firstValue(node.dataset.wsName, node.dataset.name, '워크스페이스');
                map.set(id, {
                    type: 'WS', id, name,
                    subText: '워크스페이스',
                    imagePath: firstValue(node.dataset.wsImagePath, node.dataset.profileImagePath, node.dataset.imagePath),
                    sourceLabel: '워크스페이스', contextName: name, wsId: id
                });
            });
            const source = el('workspaceMemberSource');
            Array.from(source ? source.children : []).forEach((node) => {
                const id = String(firstValue(node.dataset.wsId, node.dataset.id, '')).trim();
                if (!id || map.has(id)) return;
                const name = firstValue(node.dataset.wsName, node.dataset.name, '워크스페이스');
                map.set(id, {
                    type: 'WS', id, name,
                    subText: '워크스페이스',
                    imagePath: firstValue(node.dataset.wsImagePath, node.dataset.profileImagePath, node.dataset.imagePath),
                    sourceLabel: '워크스페이스', contextName: name, wsId: id
                });
            });
            document.querySelectorAll('.moyo-app-workspace[data-ws-id]').forEach((node) => {
                const id = String(node.dataset.wsId || '').trim();
                if (!id || map.has(id)) return;
                const name = textOf(node.querySelector('.moyo-app-workspace-name')) || '워크스페이스';
                const img = node.querySelector('.moyo-app-workspace-avatar img');
                map.set(id, { type: 'WS', id, name, subText: '워크스페이스', imagePath: img ? img.getAttribute('src') : '', sourceLabel: '워크스페이스', contextName: name, wsId: id });
            });
            return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        }

        function getProjectTargets() {
            const map = new Map();
            const targetSource = el('projectTargetSource');
            Array.from(targetSource ? targetSource.children : []).forEach((node) => addProjectTarget(map, node));
            const source = el('projectMemberSource');
            Array.from(source ? source.children : []).forEach((node) => addProjectTarget(map, node));
            document.querySelectorAll('.moyo-app-project-link[data-proj-id]').forEach((node) => addProjectTarget(map, node));
            return Array.from(map.values()).sort((a, b) => (a.subText + a.name).localeCompare(b.subText + b.name, 'ko'));
        }

        function addProjectTarget(map, node) {
            const id = String(firstValue(node.dataset.projId, node.dataset.id, '')).trim();
            if (!id || map.has(id)) return;
            const wsName = firstValue(node.dataset.wsName, textOf(node.closest('.moyo-app-workspace')?.querySelector('.moyo-app-workspace-name')), '');
            const name = firstValue(node.dataset.projName, node.dataset.name, textOf(node.querySelector?.('.moyo-app-project-name')), textOf(node), '프로젝트');
            map.set(id, {
                type: 'PROJ', id, name,
                subText: wsName ? `${wsName} · 프로젝트` : '프로젝트',
                imagePath: '', sourceLabel: '프로젝트', contextName: name,
                wsName, wsId: String(node.dataset.wsId || ''), projId: id
            });
        }

        function ensureSharedGroupMembersLoaded() {
            let pending = 0;
            selected.forEach((item) => {
                if (item.type !== 'WS' && item.type !== 'PROJ') return;
                const key = makeKey(item.type, item.id);
                if (groupMemberCache.has(key)) return;

                const localMembers = item.type === 'WS'
                    ? getWorkspaceMembersFromDom(item.id)
                    : getProjectMembersFromDom(item.id);
                if (localMembers.length > 0) {
                    groupMemberCache.set(key, localMembers);
                    return;
                }

                pending += 1;
                fetchGroupMembers(item);
            });
            return pending;
        }

        function fetchGroupMembers(item) {
            const key = makeKey(item.type, item.id);
            if (groupMemberLoading.has(key) || groupMemberCache.has(key)) return;
            groupMemberLoading.add(key);

            const url = item.type === 'WS'
                ? '/workspace/api/members?wsId=' + encodeURIComponent(item.id)
                : '/project/api/members?projId=' + encodeURIComponent(item.id);

            fetch(url, { credentials: 'same-origin' })
                .then((res) => res.ok ? res.json() : [])
                .then((data) => {
                    const list = Array.isArray(data) ? data : (data.members || data.list || []);
                    const members = list
                        .map((row) => memberFromApi(row, item))
                        .filter((member) => member.id && !isCurrentUserId(member.id));
                    groupMemberCache.set(key, members);
                })
                .catch(() => {
                    groupMemberCache.set(key, []);
                })
                .finally(() => {
                    groupMemberLoading.delete(key);
                    if (mode === 'PERMISSION') {
                        loadPermissionCandidates();
                        renderSelected();
                    }
                });
        }

        function getWorkspaceMembers(wsId) {
            const key = makeKey('WS', wsId);
            return groupMemberCache.has(key) ? groupMemberCache.get(key) : getWorkspaceMembersFromDom(wsId);
        }

        function getProjectMembers(projId) {
            const key = makeKey('PROJ', projId);
            return groupMemberCache.has(key) ? groupMemberCache.get(key) : getProjectMembersFromDom(projId);
        }

        function getWorkspaceMembersFromDom(wsId) {
            const source = el('workspaceMemberSource');
            return Array.from(source ? source.children : [])
                .filter((node) => String(firstValue(node.dataset.wsId, node.dataset.WS_ID, '')) === String(wsId))
                .map(memberFromDataset)
                .filter((member) => member.id && !isCurrentUserId(member.id));
        }

        function getProjectMembersFromDom(projId) {
            const source = el('projectMemberSource');
            return Array.from(source ? source.children : [])
                .filter((node) => String(firstValue(node.dataset.projId, node.dataset.PROJ_ID, '')) === String(projId))
                .map(memberFromDataset)
                .filter((member) => member.id && !isCurrentUserId(member.id));
        }

        function memberFromDataset(node) {
            return {
                type: 'USER',
                id: String(firstValue(node.dataset.userId, node.dataset.USER_ID, '')).trim(),
                name: firstValue(node.dataset.userName, node.dataset.displayName, node.dataset.USER_NAME, node.dataset.DISPLAY_NAME, node.dataset.email, node.dataset.EMAIL, '이름 없음'),
                email: firstValue(node.dataset.email, node.dataset.EMAIL, ''),
                imagePath: firstValue(node.dataset.profileImagePath, node.dataset.PROFILE_IMAGE_PATH, node.dataset.profileImage, node.dataset.imagePath),
                subText: firstValue(node.dataset.wsName, node.dataset.projName, '멤버'),
                contextName: [node.dataset.wsName, node.dataset.projName].filter(Boolean).join(' / ')
            };
        }

        function memberFromApi(row, group) {
            const id = String(firstValue(row.userId, row.USER_ID, row.id, row.ID, '')).trim();
            const name = firstValue(row.userName, row.USER_NAME, row.displayName, row.DISPLAY_NAME, row.name, row.NAME, row.email, row.EMAIL, '이름 없음');
            const email = firstValue(row.email, row.EMAIL, row.contactEmail, row.CONTACT_EMAIL, '');
            const imagePath = firstValue(row.profileImagePath, row.PROFILE_IMAGE_PATH, row.profileImage, row.imagePath, row.IMAGE_PATH, '');
            const roleName = firstValue(row.roleName, row.WS_ROLE, row.PROJ_ROLE, row.role, row.ROLE, '멤버');
            const groupText = group.type === 'WS'
                ? `${group.name} · 워크스페이스`
                : `${group.wsName ? group.wsName + ' · ' : ''}${group.name} · 프로젝트`;
            return {
                type: 'USER',
                id,
                name,
                email,
                imagePath,
                subText: groupText,
                contextName: roleName
            };
        }

        // 공통 유틸
        function matchKeyword(item, keyword) {
            if (!keyword) return true;
            return [item.name, item.subText, item.email, item.contextName, ...(item.sourceTags || []).map((tag) => tag.label), ...(item.sourceTags || []).map((tag) => tag.parent)]
                .some((value) => String(value || '').toLowerCase().includes(keyword));
        }

        function getKeyword() {
            return String(el('keyword')?.value || '').trim().toLowerCase();
        }

        function sourceText(item) {
            return item.subText || (item.sourceTags || []).map((tag) => tag.label).join(' ') || '공유 대상';
        }

        function sourceTagsHtml(item) {
            const tags = Array.isArray(item.sourceTags) ? item.sourceTags : [];
            if (!tags.length) {
                return `<small>${escapeHtml(sourceText(item))}</small>`;
            }
            return `<span class="note-share-source-tags">${tags.map((tag) => {
                const type = String(tag.type || 'USER').toLowerCase();
                const title = tag.parent ? `${tag.parent} · ${tag.label}` : tag.label;
                return `<span class="note-share-source-tag note-share-source-tag-${escapeHtml(type)}" title="${escapeHtml(title)}">${escapeHtml(tag.label)}</span>`;
            }).join('')}</span>`;
        }


        function shareTargetMetaHtml(item) {
            const type = String(item.type || '').toUpperCase();
            if (type === 'USER') {
                return `<small>${escapeHtml(item.email || item.subText || '친구')}</small>`;
            }
            if (type === 'WS') {
                return `<small>워크스페이스</small>`;
            }
            if (type === 'PROJ') {
                const wsName = String(item.wsName || '').trim();
                return `<small>${escapeHtml(wsName ? wsName + ' · 프로젝트' : '프로젝트')}</small>`;
            }
            return `<small>${escapeHtml(item.subText || item.contextName || '보기 가능')}</small>`;
        }
    }

    function makeKey(type, id) {
        const normalizedType = String(type || '').trim().toUpperCase();
        const prefix = normalizedType === 'WORKSPACE' ? 'WS' : (normalizedType === 'PROJECT' ? 'PROJ' : normalizedType);
        return prefix + '_' + String(id || '').trim();
    }

    function avatarHtml(item) {
        const imagePath = item.imagePath || item.profileImagePath || '';
        const typeClass = 'note-share-type-' + escapeHtml(String(item.type || 'user').toLowerCase());
        if (imagePath) {
            return `<span class="note-write-share-avatar note-share-avatar ${typeClass}"><img src="${escapeHtml(imagePath)}" alt=""></span>`;
        }
        return `<span class="note-write-share-avatar note-share-avatar ${typeClass} is-fallback"><b>${escapeHtml(initialOf(item.name))}</b></span>`;
    }

    function initialOf(name) {
        const text = String(name || '').trim();
        return text ? text.charAt(0).toUpperCase() : '?';
    }

    function firstValue() {
        for (let i = 0; i < arguments.length; i += 1) {
            const value = arguments[i];
            if (value !== undefined && value !== null && String(value).trim() !== '') return value;
        }
        return '';
    }

    function textOf(node) {
        return node ? String(node.textContent || '').trim() : '';
    }

    function debounce(fn, delay) {
        let timer;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(fn, delay);
        };
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    window.MoyoShareModal = window.MoyoShareModal || {};
    window.MoyoShareModal.init = initShareModal;
})();
