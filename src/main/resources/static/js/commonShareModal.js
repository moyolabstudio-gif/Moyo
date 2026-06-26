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
        const options = Object.assign({ contentType: 'NOTE', shareMode: 'PERMISSION' }, userOptions || {});
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

        function isDraftShareMode() {
            return !options.persist;
        }

        function shareApplyLabel() {
            if (mode !== 'SHARE') return '적용';
            if (isDraftShareMode()) return selected.size > 0 ? `선택 완료 ${selected.size}` : '선택 완료';
            return selected.size > 0 ? `보내기 ${selected.size}` : '보내기';
        }

        function shareApplyProgressLabel() {
            if (mode !== 'SHARE') return '저장 중';
            return isDraftShareMode() ? '적용 중' : '보내는 중';
        }

        function currentShareMode() {
            const value = String(firstValue(options.shareMode, el('modal')?.dataset.shareModeType, '') || '').trim().toUpperCase();
            return value === 'FEED' ? 'FEED' : 'PERMISSION';
        }

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

        function blockedUserIds() {
            const values = [];
            const modal = el('modal');
            values.push(options.ownerUserId, options.authorUserId, options.blockedUserId);
            if (Array.isArray(options.blockedUserIds)) values.push(...options.blockedUserIds);
            values.push(
                modal?.dataset.ownerUserId,
                modal?.dataset.authorUserId,
                modal?.dataset.blockedUserId,
                modal?.dataset.shareOwnerId
            );
            return new Set(values.map((value) => String(value || '').trim()).filter(Boolean));
        }

        function blockedCandidateReason(item) {
            if (!item || normalizeType(item.type) !== 'USER') return '';
            const id = String(firstValue(item.id, item.userId, item.USER_ID, '')).trim();
            if (!id) return '';
            if (blockedUserIds().has(id)) return '작성자';
            return '';
        }

        // 초기화 / 이벤트 바인딩
        function mount() {
            if (mounted) return;
            const openButton = el('openButton');
            const modal = el('modal');
            const keyword = el('keyword');
            if (!openButton || !modal || !keyword) return;
            lockCommonShareNamespace(modal);
            mounted = true;

            normalizeModalText();
            ensurePermissionButton(openButton);
            loadInitialShares();

            openButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                openModal('SHARE');
            });
            el('permissionButton')?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                openModal('PERMISSION');
            });
            modal.querySelectorAll('[data-note-share-close]').forEach((node) => node.addEventListener('click', closeModal));
            el('applyButton')?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
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
                    updateShareTabCounts();
                    updatePlaceholder();
                    loadCandidates();
                });
            });

            keyword.addEventListener('input', debounce(loadCandidates, 160));
            updatePlaceholder();
            renderSelected();
            updateShareTabCounts();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mount, { once: true });
        } else {
            mount();
        }


        function lockCommonShareNamespace(modal) {
            if (!modal) return;
            modal.classList.add('moyo-share-modal');
            const panel = modal.querySelector('.note-write-share-panel');
            if (panel) panel.classList.add('moyo-share-panel');
            modal.querySelectorAll('.note-write-share-tab').forEach((tab) => tab.classList.add('moyo-share-tab'));
            modal.querySelectorAll('.note-write-share-card').forEach((card) => card.classList.add('moyo-share-card'));
            modal.querySelectorAll('.note-share-permission-add-btn').forEach((button) => button.classList.add('moyo-share-register-button'));
            modal.querySelectorAll('button').forEach((button) => {
                if (!button.getAttribute('type')) button.setAttribute('type', 'button');
            });
            modal.querySelectorAll('.note-gradient-btn').forEach((button) => button.classList.add('moyo-share-apply-button'));
            modal.querySelectorAll('.note-soft-btn').forEach((button) => button.classList.add('moyo-share-cancel-button'));
        }

        function shareTabLabel(tabValue) {
            const value = String(tabValue || '').toUpperCase();
            if (value === 'WORKSPACE') return '그룹';
            if (value === 'PROJECT') return '프로젝트';
            return '친구';
        }

        function selectedCountByTab(tabValue) {
            const value = String(tabValue || '').toUpperCase();
            let count = 0;
            selected.forEach((item) => {
                const type = normalizeType(item.type);
                if (value === 'FRIEND' && type === 'USER') count += 1;
                if (value === 'WORKSPACE' && type === 'WS') count += 1;
                if (value === 'PROJECT' && type === 'PROJ') count += 1;
            });
            return count;
        }

        function updateShareTabCounts() {
            document.querySelectorAll(modalSelector() + ' [data-share-tab]').forEach((tab) => {
                const tabValue = tab.dataset.shareTab || 'FRIEND';
                const count = selectedCountByTab(tabValue);
                tab.innerHTML = '<span class="note-share-tab-label">' + escapeHtml(shareTabLabel(tabValue)) + '</span>'
                    + (count > 0 ? '<span class="note-share-tab-count">' + escapeHtml(count) + '</span>' : '');
            });
        }

        function normalizeModalText() {
            const title = el('title');
            if (title) title.textContent = '공유';
            const desc = title?.closest('.note-write-share-modal-head')?.querySelector('p');
            if (desc) desc.textContent = isDraftShareMode()
                ? '받는 사람을 선택해 두면 등록 완료 시 공유 요청이 함께 전송됩니다.'
                : (currentShareMode() === 'FEED' ? '받는 사람에게 MOYO 피드 게시물을 보냅니다.' : '받는 사람을 선택해 공유 요청을 보냅니다.');
            const subtitles = document.querySelectorAll(modalSelector() + ' .note-write-share-subtitle');
            if (subtitles[0]) subtitles[0].textContent = '받는 사람';
            if (subtitles[1]) {
                subtitles[1].hidden = true;
                subtitles[1].innerHTML = '<span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
            }
            const friendLink = el('friendManageLink');
            if (friendLink) friendLink.remove();
            el('context')?.setAttribute('hidden', 'hidden');
            document.querySelector(modalSelector() + ' .note-write-share-body')?.classList.add('note-write-share-body-simple', 'note-write-share-body-feed');
            const selectedBox = el('selected');
            if (selectedBox) {
                selectedBox.hidden = true;
                if (selectedBox.parentElement) selectedBox.parentElement.hidden = true;
            }
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
                    subText: firstValue(node.dataset.targetSubtext, type === 'WS' ? '그룹' : (type === 'PROJ' ? '프로젝트' : '친구')),
                    imagePath: firstValue(node.dataset.profileImagePath, node.dataset.imagePath, ''),
                    contextName: firstValue(node.dataset.targetSubtext, ''),
                    wsName: type === 'PROJ' ? firstValue(node.dataset.targetSubtext, '') : '',
                    permission,
                    shareId: String(firstValue(node.dataset.shareId, '')).trim(),
                    ownerId: String(firstValue(node.dataset.ownerId, '')).trim(),
                    sharedBy: String(firstValue(node.dataset.sharedBy, '')).trim(),
                    shareStatus: normalizeShareStatus(firstValue(node.dataset.shareStatus, node.dataset.status, 'PENDING'))
                };
                originalShares.set(key, { ...item, permission: 'VIEW' });
                if (type === 'USER' && permission === 'EDIT') {
                    editors.set(key, { ...item, type: 'USER', permission: 'EDIT' });
                }
            });
            removeOrphanEditors();
            updatePersistedShareCounters();
        }


        function refreshCurrentShares() {
            if (!options.persist) return Promise.resolve(false);
            const contentType = String(firstValue(options.contentType, '') || '').trim().toUpperCase();
            const contentId = String(firstValue(options.contentId, '') || '').trim();
            if (!contentType || !contentId || contentId === '0') return Promise.resolve(false);

            const params = new URLSearchParams({ contentType, contentId, shareMode: currentShareMode() });
            return fetch('/share/api/targets?' + params.toString(), { credentials: 'same-origin' })
                .then((res) => res.json())
                .then((data) => {
                    if (!data || data.success === false || !Array.isArray(data.shares)) return false;
                    const next = new Map();
                    data.shares.forEach((share) => {
                        const item = shareDtoToItem(share);
                        if (!item) return;
                        next.set(makeKey(item.type, item.id), item);
                    });
                    let changed = next.size !== originalShares.size;
                    if (!changed) {
                        next.forEach((item, key) => {
                            const old = originalShares.get(key);
                            if (!old
                                || normalizeShareStatus(old.shareStatus) !== normalizeShareStatus(item.shareStatus)
                                || String(firstValue(old.shareId, '')) !== String(firstValue(item.shareId, ''))
                                || String(firstValue(old.permission, 'VIEW')) !== String(firstValue(item.permission, 'VIEW'))) {
                                changed = true;
                            }
                        });
                    }
                    originalShares.clear();
                    next.forEach((item, key) => originalShares.set(key, item));
                    Array.from(selected.keys()).forEach((key) => {
                        const status = normalizeShareStatus(originalShares.get(key)?.shareStatus);
                        if (status === 'PENDING' || status === 'ACCEPTED') selected.delete(key);
                    });
                    removeOrphanEditors();
                    updatePersistedShareCounters();
                    return changed;
                })
                .catch(() => false);
        }

        function shareDtoToItem(share) {
            if (!share) return null;
            const type = normalizeType(firstValue(share.targetType, share.TARGET_TYPE));
            const id = String(firstValue(share.targetId, share.TARGET_ID, '')).trim();
            if (!type || !id) return null;
            const permission = String(firstValue(share.permissionType, share.PERMISSION_TYPE, 'VIEW')).toUpperCase() === 'EDIT' ? 'EDIT' : 'VIEW';
            return {
                type,
                id,
                name: firstValue(share.targetName, share.TARGET_NAME, '이름 없음'),
                email: type === 'USER' ? firstValue(share.targetSubtext, share.TARGET_SUBTEXT, '') : '',
                subText: firstValue(share.targetSubtext, share.TARGET_SUBTEXT, type === 'WS' ? '그룹' : (type === 'PROJ' ? '프로젝트' : '친구')),
                imagePath: firstValue(share.profileImagePath, share.PROFILE_IMAGE_PATH, share.imagePath, share.IMAGE_PATH, ''),
                contextName: firstValue(share.targetSubtext, share.TARGET_SUBTEXT, ''),
                wsName: type === 'PROJ' ? firstValue(share.targetSubtext, share.TARGET_SUBTEXT, '') : '',
                permission,
                shareId: String(firstValue(share.shareId, share.SHARE_ID, '')).trim(),
                ownerId: String(firstValue(share.ownerId, share.OWNER_ID, '')).trim(),
                sharedBy: String(firstValue(share.sharedBy, share.SHARED_BY, '')).trim(),
                shareStatus: normalizeShareStatus(firstValue(share.shareStatus, share.SHARE_STATUS, share.status, share.STATUS, 'PENDING'))
            };
        }

        function normalizeShareStatus(status) {
            const value = String(status || '').trim().toUpperCase();
            return ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'LEFT', 'REMOVED'].includes(value) ? value : 'NONE';
        }

        function isActiveShareStatus(status) {
            const value = normalizeShareStatus(status);
            return value === 'PENDING' || value === 'ACCEPTED';
        }

        function activeShareCount() {
            let count = 0;
            originalShares.forEach((item) => {
                if (isActiveShareStatus(item && item.shareStatus)) count += 1;
            });
            return count;
        }

        function updatePersistedShareCounters() {
            const count = el('count');
            if (count) {
                const value = isDraftShareMode() ? selected.size : activeShareCount();
                count.textContent = String(value);
                count.hidden = value === 0;
                count.title = isDraftShareMode() ? '등록 완료 시 전송될 공유 요청 대상 수' : '';
            }
            const permissionCount = el('permissionCount');
            if (permissionCount) {
                permissionCount.textContent = String(editors.size);
                permissionCount.hidden = editors.size === 0;
            }
        }

        function shareStatusBadgeHtml(item) {
            const status = normalizeShareStatus(item && item.shareStatus);
            if (status === 'PENDING') {
                return '<span class="note-share-status-badge note-share-status-pending" title="상대가 아직 수락하지 않아 목록에 노출되지 않습니다.">수락 대기</span>';
            }
            if (status === 'ACCEPTED') {
                return '<span class="note-share-status-badge note-share-status-accepted" title="현재 공유 중입니다.">공유됨</span>';
            }
            return '';
        }

        function canReleaseShare(item) {
            if (!item) return false;
            const me = currentUserId();
            if (!me) return false;
            const ownerId = String(firstValue(item.ownerId, '')).trim();
            const sharedBy = String(firstValue(item.sharedBy, '')).trim();
            const targetType = normalizeType(item.type);
            const targetId = String(firstValue(item.id, '')).trim();
            return ownerId === me || sharedBy === me || (targetType === 'USER' && targetId === me);
        }

        function shareReleaseButtonHtml(item) {
            const status = normalizeShareStatus(item && item.shareStatus);
            const shareId = String(firstValue(item && item.shareId, '')).trim();
            if (!shareId || !canReleaseShare(item) || (status !== 'PENDING' && status !== 'ACCEPTED')) return '';
            const label = status === 'PENDING' ? '취소' : '해지';
            const title = status === 'PENDING' ? '공유 요청 취소' : '공유 해지';
            return '<button type="button" class="note-share-inline-release" data-share-release="' + escapeHtml(shareId) + '" title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + '">' + escapeHtml(label) + '</button>';
        }

        function getExistingShare(item) {
            if (!item) return null;
            return originalShares.get(makeKey(item.type, item.id)) || null;
        }

        function getCandidateStatus(item) {
            const old = getExistingShare(item);
            return old ? normalizeShareStatus(old.shareStatus) : 'NONE';
        }

        function isCandidateSendable(item) {
            if (blockedCandidateReason(item)) return false;
            const status = getCandidateStatus(item);
            return status !== 'PENDING' && status !== 'ACCEPTED';
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
            originalShares.forEach((item) => {
                const status = normalizeShareStatus(item.shareStatus);
                if (status !== 'PENDING' && status !== 'ACCEPTED') return;
                const type = normalizeType(item.type);
                const key = makeKey(type, item.id);
                rows.set(key, {
                    type,
                    id: item.id,
                    permission: type === 'USER' && editors.has(makeKey('USER', item.id)) ? 'EDIT' : 'VIEW'
                });
            });
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
            if (!contentId) {
                renderSelected();
                closeModal();
                return;
            }
            const applyButton = el('applyButton');
            if (applyButton) { applyButton.disabled = true; applyButton.textContent = shareApplyProgressLabel(); }

            const tasks = [];

            if (mode === 'SHARE' && selected.size === 0) {
                alert('공유할 대상을 선택해 주세요.');
                if (applyButton) {
                    applyButton.disabled = false;
                    applyButton.textContent = '보내기';
                }
                return;
            }

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
                            permissionType: row.permission,
                            shareMode: currentShareMode()
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
                currentRows.forEach((row) => {
                    const body = new URLSearchParams({
                        contentType,
                        contentId,
                        targetType: row.type,
                        targetId: row.id,
                        permissionType: row.permission,
                        shareMode: currentShareMode()
                    });
                    tasks.push(fetch('/share/api/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        credentials: 'same-origin',
                        body: body.toString()
                    }).then(assertShareResponse));
                });
            }

            Promise.all(tasks).then(() => refreshCurrentShares()).then(() => {
                const persistedCount = activeShareCount();
                closeModal();
                if (typeof options.onPersistSuccess === 'function') {
                    options.onPersistSuccess({ mode, selectedCount: selected.size, editorCount: editors.size, shareCount: persistedCount });
                }
                selected.clear();
                renderSelected();
                if (options.reloadOnPersist !== false) window.location.reload();
            }).catch((error) => {
                alert(error && error.message ? error.message : mode === 'SHARE' ? '공유 요청을 보내지 못했습니다.' : '공유 정보를 저장하지 못했습니다.');
            }).finally(() => {
                if (applyButton) { applyButton.disabled = false; applyButton.textContent = shareApplyLabel(); }
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
            if (mode === 'SHARE' && !isDraftShareMode()) selected.clear();
            const modal = el('modal');
            if (!modal) return;
            modal.hidden = false;
            modal.dataset.shareMode = mode.toLowerCase();
            document.body.classList.add(options.bodyOpenClass || 'note-share-modal-open');
            applyModeText();
            updatePlaceholder();
            loadCandidates();
            renderSelected();
            refreshCurrentShares().then((changed) => {
                if (!changed || modal.hidden) return;
                loadCandidates();
                renderSelected();
                updateShareTabCounts();
            });
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
                    subtitles[1].hidden = false;
                    subtitles[1].innerHTML = '편집 가능 <span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                    subtitles[1].classList.add('note-write-share-subtitle-with-count');
                }
            } else {
                if (title) title.textContent = '공유';
                if (desc) desc.textContent = isDraftShareMode()
                    ? '받는 사람을 선택해 두면 등록 완료 시 공유 요청이 함께 전송됩니다.'
                    : (currentShareMode() === 'FEED' ? '받는 사람에게 MOYO 피드 게시물을 보냅니다.' : '받는 사람을 선택해 공유 요청을 보냅니다.');
                if (tabs) tabs.hidden = false;
                updateShareTabCounts();
                if (subtitles[0]) subtitles[0].textContent = '받는 사람';
                if (subtitles[1]) {
                    subtitles[1].hidden = true;
                    subtitles[1].innerHTML = '<span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                }
            }
            const selectedBox = el('selected');
            if (selectedBox) {
                selectedBox.hidden = mode === 'SHARE';
                if (selectedBox.parentElement) selectedBox.parentElement.hidden = mode === 'SHARE';
            }
            const applyButton = el('applyButton');
            if (applyButton) applyButton.textContent = shareApplyLabel();
        }

        function updatePlaceholder() {
            const keyword = el('keyword');
            if (!keyword) return;
            if (mode === 'PERMISSION') {
                keyword.placeholder = '편집 권한을 줄 멤버 검색';
            } else if (activeTab === 'FRIEND') {
                keyword.placeholder = '친구 이름 또는 이메일 검색';
            } else if (activeTab === 'WORKSPACE') {
                keyword.placeholder = '그룹 검색';
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
                        .filter((item) => !isCurrentUserId(item.id));
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
                message = '먼저 요청 대상에서 친구/그룹/프로젝트를 추가하세요.';
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
                const existing = getExistingShare(item);
                const status = existing ? normalizeShareStatus(existing.shareStatus) : 'NONE';
                const blockedReason = blockedCandidateReason(item);
                const sendable = isCandidateSendable(item);
                const checked = selected.has(key);
                const statusHtml = blockedReason
                    ? '<span class="note-share-status-badge note-share-status-blocked" title="작성자 본인에게는 보낼 수 없습니다.">' + escapeHtml(blockedReason) + '</span>'
                    : (sendable ? '' : shareStatusBadgeHtml(existing || item) + shareReleaseButtonHtml(existing || item));
                return `
                    <div class="note-share-target-block note-share-type-${escapeHtml(item.type.toLowerCase())}">
                        <div class="note-write-share-card note-share-type-${escapeHtml(item.type.toLowerCase())} ${checked ? 'is-selected' : ''} ${sendable ? '' : 'is-share-disabled'}" data-type="${escapeHtml(item.type)}" data-id="${escapeHtml(item.id)}" role="button" tabindex="${sendable ? '0' : '-1'}" aria-disabled="${sendable ? 'false' : 'true'}">
                            ${avatarHtml(item)}
                            <span class="note-write-share-main">
                                <strong>${escapeHtml(item.name)}</strong>
                                <small>${escapeHtml(item.subText || item.contextName || '')}</small>
                            </span>
                            <span class="note-share-candidate-actions">
                                ${statusHtml}
                            </span>
                            <span class="note-write-share-check" aria-hidden="true"></span>
                        </div>
                    </div>
                `;
            }).join('');

            box.querySelectorAll('[data-share-release]').forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    releaseExistingShare(button.dataset.shareRelease, button);
                });
            });

            box.querySelectorAll('.note-write-share-card').forEach((row) => {
                const toggle = () => {
                    const key = makeKey(row.dataset.type, row.dataset.id);
                    const item = cachedCandidates.find((candidate) => makeKey(candidate.type, candidate.id) === key);
                    if (!item || !isCandidateSendable(item)) return;
                    if (selected.has(key)) selected.delete(key);
                    else selected.set(key, { ...item, permission: 'VIEW' });
                    renderCandidatesFromCache();
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
            const count = el('count');
            const modalCount = el('modalCount');

            const displayCount = mode === 'PERMISSION' ? editors.size : selected.size;
            updatePersistedShareCounters();
            if (modalCount) {
                modalCount.textContent = '(' + String(displayCount) + ')';
                modalCount.hidden = displayCount === 0;
            }
            if (mode === 'SHARE') updateShareTabCounts();
            const permissionCount = el('permissionCount');
            if (permissionCount) {
                permissionCount.textContent = String(editors.size);
                permissionCount.hidden = editors.size === 0;
            }

            const applyButton = el('applyButton');
            if (applyButton && mode === 'SHARE') {
                applyButton.disabled = false;
                applyButton.textContent = shareApplyLabel();
            }

            if (box) {
                box.hidden = mode === 'SHARE';
                if (box.parentElement) box.parentElement.hidden = mode === 'SHARE';
                if (mode === 'PERMISSION') {
                    const rows = Array.from(editors.entries());
                    if (!rows.length) {
                        box.innerHTML = '<div class="note-write-share-empty note-write-share-empty-compact">아직 편집 가능한 멤버가 없습니다.</div>';
                    } else {
                        box.innerHTML = `<div class="note-write-share-picked-list note-share-permission-member-list note-share-permission-editor-list">
                            ${rows.map(([key, item]) => permissionMemberLineHtml(item, 'remove', key)).join('')}
                        </div>`;
                        box.querySelectorAll('[data-remove-share]').forEach((button) => {
                            button.addEventListener('click', (event) => {
                                event.stopPropagation();
                                const key = button.dataset.removeShare;
                                const item = editors.get(key);
                                editors.delete(key);
                                if (item && !selected.has(key)) {
                                    selected.set(key, { ...item, type: 'USER', permission: 'VIEW' });
                                }
                                loadCandidates();
                                renderSelected();
                            });
                        });
                    }
                }
            }

            renderHiddenFields();
        }

        function releaseExistingShare(shareId, trigger) {
            const id = String(shareId || '').trim();
            if (!id) return;

            let target = null;
            originalShares.forEach((item) => {
                if (!target && String(item.shareId || '') === id) target = item;
            });

            const status = normalizeShareStatus(target && target.shareStatus);
            const confirmMessage = status === 'PENDING'
                ? '공유 요청을 취소하시겠습니까?'
                : '공유를 해지하시겠습니까?';
            if (!window.confirm(confirmMessage)) return;

            const originalText = trigger ? trigger.textContent : '';
            if (trigger) {
                trigger.disabled = true;
                trigger.textContent = '처리중';
            }
            fetch('/share/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                credentials: 'same-origin',
                body: new URLSearchParams({ shareId: id }).toString()
            }).then(assertShareResponse).then(() => {
                let removedKey = '';
                originalShares.forEach((item, key) => {
                    if (String(item.shareId || '') === id) removedKey = key;
                });
                if (removedKey) {
                    originalShares.delete(removedKey);
                    selected.delete(removedKey);
                }
                renderCandidatesFromCache();
                renderSelected();
                if (typeof options.onPersistSuccess === 'function') {
                    options.onPersistSuccess({ mode: 'SHARE_RELEASE', selectedCount: selected.size, editorCount: editors.size });
                }
            }).catch((error) => {
                alert(error && error.message ? error.message : '공유를 해지하지 못했습니다.');
                if (trigger) {
                    trigger.disabled = false;
                    trigger.textContent = originalText || (status === 'PENDING' ? '취소' : '해지');
                }
            });
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
            const status = normalizeShareStatus(item.shareStatus);
            const removeLabel = status === 'PENDING' ? '취소' : '해지';
            const removeTitle = status === 'PENDING' ? '공유 요청 취소' : '공유 해지';
            const actionHtml = isEditor
                ? `<button type="button" class="note-share-remove note-share-remove-text" data-remove-share="${escapeHtml(key)}">제거</button>`
                : `<span class="note-share-readonly-permission">보기</span>${shareStatusBadgeHtml(item)}<button type="button" class="note-share-remove note-share-remove-text" data-remove-share="${escapeHtml(key)}" title="${escapeHtml(removeTitle)}" aria-label="${escapeHtml(removeTitle)}">${escapeHtml(removeLabel)}</button>`;
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
            const accessMap = new Map();
            originalShares.forEach((item, key) => {
                const status = normalizeShareStatus(item.shareStatus);
                if (status === 'PENDING' || status === 'ACCEPTED') accessMap.set(key, item);
            });
            selected.forEach((item, key) => accessMap.set(key, item));
            accessMap.forEach((item) => {
                if (item.type === 'USER') {
                    addAccessUser(map, item, { type: 'USER', label: '친구', id: item.id });
                } else if (item.type === 'WS') {
                    getWorkspaceMembers(item.id).forEach((member) => addAccessUser(map, member, { type: 'WS', label: item.name || '그룹', id: item.id }));
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
                subText: sourceTags.map((item) => item.label).join(' ') || user.subText || '요청 대상',
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
                const name = firstValue(node.dataset.wsName, node.dataset.name, '그룹');
                map.set(id, {
                    type: 'WS', id, name,
                    subText: '그룹',
                    imagePath: firstValue(node.dataset.wsImagePath, node.dataset.profileImagePath, node.dataset.imagePath),
                    sourceLabel: '그룹', contextName: name, wsId: id
                });
            });
            const source = el('workspaceMemberSource');
            Array.from(source ? source.children : []).forEach((node) => {
                const id = String(firstValue(node.dataset.wsId, node.dataset.id, '')).trim();
                if (!id || map.has(id)) return;
                const name = firstValue(node.dataset.wsName, node.dataset.name, '그룹');
                map.set(id, {
                    type: 'WS', id, name,
                    subText: '그룹',
                    imagePath: firstValue(node.dataset.wsImagePath, node.dataset.profileImagePath, node.dataset.imagePath),
                    sourceLabel: '그룹', contextName: name, wsId: id
                });
            });
            document.querySelectorAll('.moyo-app-workspace[data-ws-id]').forEach((node) => {
                const id = String(node.dataset.wsId || '').trim();
                if (!id || map.has(id)) return;
                const name = textOf(node.querySelector('.moyo-app-workspace-name')) || '그룹';
                const img = node.querySelector('.moyo-app-workspace-avatar img');
                map.set(id, { type: 'WS', id, name, subText: '그룹', imagePath: img ? img.getAttribute('src') : '', sourceLabel: '그룹', contextName: name, wsId: id });
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
                ? `${group.name} · 그룹`
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
            return item.subText || (item.sourceTags || []).map((tag) => tag.label).join(' ') || '요청 대상';
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
                return `<small>그룹</small>`;
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
