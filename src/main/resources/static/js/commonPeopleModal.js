/**
 * MOYO Common People Modal
 * - 하나의 모달 껍데기에서 사람 선택 / 친구 공유 / 친구에게 보내기를 처리한다.
 * - init(): 공유·보내기 기능, open(): 사람 단일·다중 선택 기능.
 */
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
        const options = Object.assign({ contentType: 'NOTE', shareMode: 'PERMISSION', enablePermission: true }, userOptions || {});
        // 편집 권한은 협업 편집이 가능한 NOTE / CALENDAR에서만 사용한다.
        // PHOTO / FILE 등 다른 콘텐츠가 enablePermission을 누락하거나 true로 넘겨도 권한 UI가 노출되지 않게 공통 모달에서 최종 차단한다.
        const permissionContentType = String(options.contentType || '').trim().toUpperCase();
        const supportsEditPermission = ['NOTE', 'PHOTO', 'FILE', 'CALENDAR'].includes(permissionContentType);
        options.enablePermission = supportsEditPermission && options.enablePermission !== false;
        const ids = Object.assign({}, DEFAULT_IDS, options.ids || {});
        const el = (name) => document.getElementById(ids[name]);
        const cssId = (id) => '#' + String(id).replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g, '\\$1');
        const modalSelector = () => cssId(ids.modal);
        const selected = new Map();       // 공유 대상: USER / WS / PROJ, 기본 VIEW
        const editors = new Map();        // 편집 권한: 공유 대상 단위 EDIT
        const originalShares = new Map(); // 상세 화면 저장 비교용
        const groupMemberCache = new Map();
        const groupMemberLoading = new Set();
        let cachedCandidates = [];
        let activeTab = 'FRIEND';
        let mode = 'SHARE';
        let permissionDetailMode = 'TARGET'; // TARGET: 그룹/프로젝트 자체, MEMBER: 하위 멤버
        let shareWithEditPermission = false; // 공유 모달에서 선택 대상에 편집 권한을 함께 포함할지 여부
        let readonlyShare = false;
        let readonlyShareLoaded = false;
        let memberRestrictedAccess = false;
        let memberAccessSaving = false;
        const serverBlockedUserIds = new Set();
        let mounted = false;
        let shareStatusPopover = null;
        let shareStatusPopoverTrigger = null;
        const stagedSharePermissions = new Map();

        function isDraftShareMode() {
            return !options.persist;
        }

        const FRIEND_ONLY_CONTENT_TYPES = new Set(['NOTE', 'PHOTO', 'FILE']);

        function isFriendOnlyTargetMode() {
            // NOTE / PHOTO / FILE의 일반 공유 대상은 현재 정책상 친구(USER)만 허용한다.
            // 그룹/프로젝트 콘텐츠의 멤버 권한 관리는 MEMBER_PERMISSION 모드에서 별도로 처리한다.
            if (isMemberPermissionShareMode()) return false;
            const type = String(firstValue(options.contentType, '') || '').trim().toUpperCase();
            return options.friendOnly === true || FRIEND_ONLY_CONTENT_TYPES.has(type);
        }

        function isFriendOnlyShare() {
            return mode === 'SHARE' && isFriendOnlyTargetMode();
        }

        function actionKind() {
            return String(options.actionKind || 'SHARE').trim().toUpperCase();
        }

        function isFriendSendAction() {
            return isFriendOnlyShare() && actionKind() === 'SEND';
        }

        function actionDescriptionText() {
            if (!isFriendOnlyShare()) return '';
            if (isFriendSendAction()) return 'MOYO 공개 사진은 받은 친구가 다른 친구에게 다시 보낼 수 있습니다.';
            return '선택한 친구와 사진을 1:1로 연결해 함께 볼 수 있습니다.';
        }

        function syncActionDescription() {
            const modal = el('modal');
            const actions = modal?.querySelector('.note-write-share-modal-actions');
            if (!actions) return;
            let description = actions.querySelector('.moyo-share-action-description');
            const text = actionDescriptionText();
            if (!text) {
                if (description) description.remove();
                return;
            }
            if (!description) {
                description = document.createElement('p');
                description.className = 'moyo-share-action-description';
                actions.insertBefore(description, actions.firstChild);
            }
            description.textContent = text;
        }

        function shareApplyLabel() {
            if (mode === 'PERMISSION') return editors.size > 0 ? `선택 완료 ${editors.size}` : '선택 완료';
            if (mode !== 'SHARE') return '선택 완료';
            if (currentShareMode() === 'MEMBER_PERMISSION') return (selected.size > 0 || stagedSharePermissions.size > 0) ? '권한 저장' : '닫기';
            if (isDraftShareMode()) return selected.size > 0 ? `선택 완료 ${selected.size}` : '선택 완료';
            if (isFriendSendAction()) return selected.size > 0 ? `${selected.size}명에게 보내기` : '보내기';
            if (canUseInlineNotePermission() && stagedSharePermissions.size > 0) {
                return selected.size > 0 ? '공유 및 변경사항 저장' : '변경사항 저장';
            }
            if (isFriendOnlyShare()) return selected.size > 0 ? `${selected.size}명과 공유` : '공유';
            return selected.size > 0 ? `${selected.size}명에게 보내기` : '보내기';
        }

        function shareApplyProgressLabel() {
            if (mode === 'PERMISSION') return '적용 중';
            if (mode !== 'SHARE') return '적용 중';
            if (currentShareMode() === 'MEMBER_PERMISSION') return '권한 저장 중';
            if (isDraftShareMode()) return '적용 중';
            return isFriendSendAction() ? '보내는 중' : (isFriendOnlyShare() ? '공유 중' : '보내는 중');
        }

        function canUseShareEditShortcut() {
            if (options.enablePermission === false) return false;
            if (mode !== 'SHARE') return false;
            if (isReceivedShareView()) return false;
            if (currentShareMode() !== 'PERMISSION') return false;
            const type = String(firstValue(options.contentType, '') || '').trim().toUpperCase();
            // NOTE는 각 대상 행에서 VIEW / EDIT를 직접 선택한다.
            // 기존 일괄 체크 옵션은 CALENDAR에서만 유지한다.
            return !type || type === 'CALENDAR';
        }

        function shareEditOptionId() {
            return String(ids.modal || 'noteWriteShareModal') + 'EditOption';
        }

        function getShareEditOption() {
            return document.getElementById(shareEditOptionId());
        }

        function getShareEditCheckbox() {
            return document.getElementById(shareEditOptionId() + 'Check');
        }

        function ensureShareEditOption() {
            const modal = el('modal');
            if (!modal || getShareEditOption()) return;
            const actions = modal.querySelector('.note-write-share-modal-actions');
            if (!actions) return;
            const option = document.createElement('label');
            option.id = shareEditOptionId();
            option.className = 'note-share-edit-option';
            option.innerHTML = '<input type="checkbox" id="' + escapeHtml(shareEditOptionId() + 'Check') + '">'
                + '<span class="note-share-edit-option-text"><strong>선택한 대상에게 편집 권한 포함</strong><small>체크하지 않으면 공유 요청만 전송됩니다.</small></span>';
            actions.insertBefore(option, actions.firstChild);
            option.querySelector('input')?.addEventListener('change', (event) => {
                shareWithEditPermission = event.currentTarget.checked === true;
                syncShareEditShortcutEditors();
                renderCandidatesFromCache();
                renderSelected();
            });
        }

        function updateShareEditOption() {
            ensureShareEditOption();
            const option = getShareEditOption();
            const checkbox = getShareEditCheckbox();
            if (!option || !checkbox) return;
            const visible = canUseShareEditShortcut();
            option.hidden = !visible;
            option.classList.toggle('is-active', visible && shareWithEditPermission);
            checkbox.checked = visible && shareWithEditPermission;
            checkbox.disabled = !visible;
            if (!visible) return;
            const selectedCount = selected.size;
            option.classList.toggle('is-disabled', selectedCount === 0);
        }

        function syncShareEditShortcutEditors() {
            if (!canUseShareEditShortcut()) return;
            selected.forEach((item, key) => {
                if (!shareWithEditPermission) {
                    const old = originalShares.get(key);
                    const oldPermission = String(firstValue(old && old.permission, old && old.permissionType, 'VIEW')).toUpperCase();
                    if (!old || oldPermission !== 'EDIT') editors.delete(key);
                    return;
                }
                const type = normalizeType(item && item.type) || 'USER';
                if (type === 'WS' || type === 'PROJ') removeCoveredChildEditors({ ...item, type });
                else removeSameUserTargets(editors, item);
                editors.set(key, { ...item, type, permission: 'EDIT', permissionTab: item.permissionTab || activeTab });
            });
        }

        function currentShareMode() {
            // 같은 공통 모달을 개인/그룹/프로젝트 컨텍스트에서 재사용하므로
            // open 직전에 갱신되는 modal.dataset.shareModeType을 최우선으로 사용한다.
            // options.shareMode를 먼저 읽으면 초기값(PERMISSION)에 고정되어
            // 그룹/그룹 프로젝트에서도 친구 공유 모드로 열릴 수 있다.
            const value = String(firstValue(el('modal')?.dataset.shareModeType, options.shareMode, '') || '').trim().toUpperCase();
            return value === 'FEED' ? 'FEED' : (value === 'MEMBER_PERMISSION' ? 'MEMBER_PERMISSION' : 'PERMISSION');
        }

        function isMemberPermissionShareMode() {
            return currentShareMode() === 'MEMBER_PERMISSION';
        }

        function syncMemberSecretControl() {
            const modal = el('modal');
            if (!modal) return;
            const control = modal.querySelector('.moyo-member-access-range');
            // 공개 범위는 각 콘텐츠 정보 패널에서 관리한다.
            // MEMBER_PERMISSION 모달은 현재 스코프 멤버의 VIEW/EDIT 권한만 담당한다.
            if (control) control.remove();
            return;
        }

        function canUseInlineNotePermission() {
            if (options.enablePermission === false) return false;
            if (mode !== 'SHARE' || isReceivedShareView()) return false;
            if (!['PERMISSION', 'MEMBER_PERMISSION'].includes(currentShareMode())) return false;
            return ['NOTE', 'PHOTO', 'FILE'].includes(String(firstValue(options.contentType, '') || '').trim().toUpperCase());
        }

        function sharePermissionFor(item, key) {
            const directKey = key || scopedKey(item);
            const baseKey = makeKey(normalizeType(item && item.type) || 'USER', item && item.id);

            // 기존 공유자의 권한을 아직 저장하지 않은 상태에서는 staged 값이 화면 표시의 기준이다.
            // 특히 EDIT -> VIEW 변경은 editors 에서 제거되므로, staged 값을 먼저 보지 않으면
            // originalShares 의 EDIT 값으로 다시 렌더링되어 활성 표시가 되돌아간다.
            const staged = stagedSharePermissions.get(baseKey) || stagedSharePermissions.get(directKey);
            const stagedPermission = String(firstValue(staged && staged.permission, '') || '').toUpperCase();
            if (stagedPermission === 'EDIT' || stagedPermission === 'VIEW') return stagedPermission;

            if (editors.has(directKey) || editors.has(baseKey)) return 'EDIT';
            const selectedItem = selected.get(directKey) || selected.get(baseKey);
            const selectedPermission = String(firstValue(selectedItem && selectedItem.permission, '') || '').toUpperCase();
            if (selectedPermission === 'EDIT') return 'EDIT';
            if (selectedPermission === 'VIEW') return 'VIEW';
            const old = originalShares.get(baseKey);
            return String(firstValue(old && old.permission, old && old.permissionType, item && item.permission, 'VIEW')).toUpperCase() === 'EDIT' ? 'EDIT' : 'VIEW';
        }

        function inlinePermissionHtml(item, key, visible) {
            if (!canUseInlineNotePermission() || !visible) return '';
            const permission = sharePermissionFor(item, key);
            return '<span class="note-share-inline-permission" role="group" aria-label="공유 권한">'
                + '<button type="button" class="note-share-inline-permission-btn ' + (permission === 'VIEW' ? 'is-active' : '') + '" data-share-permission="VIEW" data-share-permission-key="' + escapeHtml(key) + '">보기</button>'
                + '<button type="button" class="note-share-inline-permission-btn ' + (permission === 'EDIT' ? 'is-active' : '') + '" data-share-permission="EDIT" data-share-permission-key="' + escapeHtml(key) + '">편집</button>'
                + '</span>';
        }

        function applyLocalSharePermission(item, key, permission) {
            const normalized = String(permission || '').toUpperCase() === 'EDIT' ? 'EDIT' : 'VIEW';
            const type = normalizeType(item && item.type) || 'USER';
            const nextItem = { ...item, type, permission: normalized, permissionTab: item.permissionTab || activeTab };
            if (selected.has(key)) selected.set(key, nextItem);
            if (normalized === 'EDIT') {
                if (type === 'WS' || type === 'PROJ') removeCoveredChildEditors(nextItem);
                else removeSameUserTargets(editors, nextItem);
                editors.set(key, { ...nextItem, permission: 'EDIT' });
            } else {
                editors.delete(key);
                const baseKey = makeKey(type, item && item.id);
                if (baseKey !== key) editors.delete(baseKey);
            }
        }

        function changeInlineSharePermission(item, key, permission) {
            if (!canUseInlineNotePermission()) return;
            const normalized = String(permission || '').toUpperCase() === 'EDIT' ? 'EDIT' : 'VIEW';
            const type = normalizeType(item && item.type) || 'USER';
            const baseKey = makeKey(type, item && item.id);
            const existing = originalShares.get(baseKey);

            applyLocalSharePermission(item, key, normalized);

            if (existing && isActiveShareStatus(existing.shareStatus)) {
                const originalPermission = String(firstValue(existing.permission, existing.permissionType, 'VIEW')).toUpperCase() === 'EDIT' ? 'EDIT' : 'VIEW';
                if (originalPermission === normalized) {
                    stagedSharePermissions.delete(baseKey);
                } else {
                    stagedSharePermissions.set(baseKey, {
                        type,
                        id: String(existing.id || item && item.id || ''),
                        permission: normalized
                    });
                }
            }

            renderCandidatesFromCache();
            renderSelected();
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
            values.push(...serverBlockedUserIds);
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
            if (serverBlockedUserIds.has(id)) return '원작성자';
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
            ensureShareEditOption();
            mounted = true;

            normalizeModalText();
            ensurePermissionButton(openButton);
            loadInitialShares();
            primePersistedShareState();

            openButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                openModal('SHARE');
            });
            if (options.enablePermission !== false) el('permissionButton')?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                openModal('PERMISSION');
            });
            modal.querySelectorAll('[data-note-share-close]').forEach((node) => node.addEventListener('click', closeModal));
            el('applyButton')?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isReceivedShareView()) {
                    handleReceivedShareAction(event.currentTarget);
                    return;
                }
                if (typeof options.onSubmit === 'function' && mode === 'SHARE') syncCustomSubmit();
                else if (options.persist) syncShareChanges();
                else closeModal();
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && !modal.hidden) closeModal();
            });

            document.querySelectorAll(modalSelector() + ' [data-share-tab]').forEach((tab) => {
                tab.addEventListener('click', () => {
                    if (mode !== 'SHARE' && mode !== 'PERMISSION') return;
                    if (isFriendOnlyTargetMode()) {
                        activeTab = 'FRIEND';
                        return;
                    }
                    activeTab = tab.dataset.shareTab || 'FRIEND';
                    permissionDetailMode = 'TARGET';
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

        // 외부 공통 상세(사진/프로필 등)에서는 숨김 버튼 click 이벤트보다
        // 직접 open API를 호출하는 쪽이 안정적이다. 기존 버튼 방식도 유지한다.
        return {
            openShare() {
                mount();
                openModal('SHARE');
            },
            openPermission() {
                mount();
                openModal('PERMISSION');
            },
            close() {
                closeModal();
            }
        };

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
            const source = mode === 'PERMISSION' ? editors : selected;
            source.forEach((item) => {
                if (item.permissionTab) {
                    if (String(item.permissionTab).toUpperCase() === value) count += 1;
                    return;
                }
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
            if (title) title.textContent = isFriendSendAction() ? '친구에게 보내기' : '친구 공유';
            ensureFriendShareRequestSymbol(true, isFriendSendAction() ? 'SEND' : 'SHARE');
            const desc = title?.closest('.note-write-share-modal-head')?.querySelector('p');
            if (desc) desc.textContent = isFriendOnlyShare() ? '' : (isDraftShareMode()
                ? '받는 대상을 선택해 두면 등록 완료 시 공유 요청이 함께 전송됩니다.'
                : (currentShareMode() === 'FEED' ? '받는 대상에게 MOYO 피드 게시물을 보냅니다.' : '받는 대상을 선택해 공유 요청을 보냅니다.'));
            const subtitles = document.querySelectorAll(modalSelector() + ' .note-write-share-subtitle');
            if (subtitles[0]) subtitles[0].textContent = '받는 대상';
            if (subtitles[1]) {
                subtitles[1].hidden = false;
                subtitles[1].innerHTML = '선택 대상 <span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                subtitles[1].classList.add('note-write-share-subtitle-with-count');
            }
            const friendLink = el('friendManageLink');
            if (friendLink) friendLink.remove();
            el('context')?.setAttribute('hidden', 'hidden');
            document.querySelector(modalSelector() + ' .note-write-share-body')?.classList.add('note-write-share-body-simple', 'note-write-share-body-feed');
            syncMemberSecretControl();
            updatePermissionModeSwitcher();
            const selectedBox = el('selected');
            if (selectedBox) {
                selectedBox.hidden = false;
                if (selectedBox.parentElement) selectedBox.parentElement.hidden = false;
                selectedBox.classList.add('note-share-chip-list');
            }
            syncActionDescription();
            updateShareEditOption();
        }

        function ensurePermissionButton(openButton) {
            if (options.enablePermission === false) return;
            if (el('permissionButton')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.id = ids.permissionButton;
            button.className = openButton.className || 'note-meta-text';
            button.classList.add('note-meta-permission');
            button.innerHTML = '<span class="note-meta-label">편집 권한</span><span id="' + escapeHtml(ids.permissionCount) + '" class="note-share-count" hidden>0</span>';
            openButton.insertAdjacentElement('afterend', button);
        }


        function primePersistedShareState() {
            if (!options.persist) {
                updatePersistedShareCounters();
                return;
            }
            refreshCurrentShares().then(() => {
                renderSelected();
                updateShareTabCounts();
            });
        }

        function editorTabFromItem(item) {
            const type = normalizeType(item && item.type);
            const parentType = normalizeType(item && item.parentType);
            if (type === 'WS' || parentType === 'WS') return 'WORKSPACE';
            if (type === 'PROJ' || parentType === 'PROJ') return 'PROJECT';
            return 'FRIEND';
        }

        function syncEditorsFromPersistedShares() {
            const persistedEditKeys = new Set();
            originalShares.forEach((item, key) => {
                const status = normalizeShareStatus(item && item.shareStatus);
                const permission = String(firstValue(item && item.permission, item && item.permissionType, 'VIEW')).toUpperCase();
                if ((status === 'PENDING' || status === 'ACCEPTED') && permission === 'EDIT') {
                    const type = normalizeType(item && item.type);
                    const id = String(item && item.id || '').trim();
                    if (!type || !id) return;
                    const editorKey = scopedKey({ ...item, type, id });
                    persistedEditKeys.add(editorKey);
                    editors.set(editorKey, {
                        ...item,
                        type,
                        id,
                        permission: 'EDIT',
                        permissionTab: item.permissionTab || editorTabFromItem(item)
                    });
                }
            });

            Array.from(editors.entries()).forEach(([key, item]) => {
                const old = originalShares.get(scopedKey(item)) || originalShares.get(makeKey(item.type, item.id));
                if (!old) return;
                const status = normalizeShareStatus(old.shareStatus);
                const permission = String(firstValue(old.permission, old.permissionType, 'VIEW')).toUpperCase();
                if ((status === 'PENDING' || status === 'ACCEPTED') && permission !== 'EDIT' && !selected.has(key)) {
                    editors.delete(key);
                }
            });
            removeOrphanEditors();
            dedupeEditorUsers();
            updatePersistedShareCounters();
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
                    requesterName: firstValue(node.dataset.requesterName, node.dataset.sharedByName, ''),
                    requesterEmail: firstValue(node.dataset.requesterEmail, ''),
                    shareStatus: normalizeShareStatus(firstValue(node.dataset.shareStatus, node.dataset.status, 'PENDING')),
                    releaseableYn: String(firstValue(node.dataset.releaseableYn, node.dataset.releaseable, '') || '').trim().toUpperCase()
                };
                originalShares.set(key, { ...item, permission: 'VIEW' });
                if (permission === 'EDIT') {
                    editors.set(key, { ...item, type, permission: 'EDIT' });
                }
            });
            syncEditorsFromPersistedShares();
        }


        function refreshCurrentShares() {
            if (!options.persist) return Promise.resolve(false);
            const contentType = String(firstValue(options.contentType, '') || '').trim().toUpperCase();
            const contentId = String(firstValue(options.contentId, el('openButton')?.dataset.shareContentId, el('modal')?.dataset.contentId, '') || '').trim();
            if (!contentType || !contentId || contentId === '0') return Promise.resolve(false);

            const params = new URLSearchParams({ contentType, contentId, shareMode: currentShareMode() });
            return fetch('/share/api/targets?' + params.toString(), { credentials: 'same-origin' })
                .then((res) => res.json())
                .then((data) => {
                    if (!data || data.success === false || !Array.isArray(data.shares)) return false;
                    readonlyShare = data.readonlyShare === true || String(data.readonlyShare || '').toUpperCase() === 'TRUE';
                    readonlyShareLoaded = true;
                    if (currentShareMode() === 'MEMBER_PERMISSION') {
                        memberRestrictedAccess = data.restrictedAccess === true || String(data.restrictedAccess || '').toUpperCase() === 'TRUE';
                        cachedCandidates = (Array.isArray(data.users) ? data.users : []).map((item) => {
                            const id = String(firstValue(item.targetId, item.TARGET_ID, item.userId, item.USER_ID, item.id, '') || '').trim();
                            if (!id) return null;
                            return {
                                type: 'USER',
                                id,
                                name: firstValue(item.targetName, item.TARGET_NAME, item.userName, item.USER_NAME, item.name, '이름 없음'),
                                email: firstValue(item.targetSubtext, item.TARGET_SUBTEXT, item.email, item.EMAIL, ''),
                                subText: firstValue(item.targetSubtext, item.TARGET_SUBTEXT, item.email, item.EMAIL, '멤버'),
                                imagePath: firstValue(item.profileImagePath, item.PROFILE_IMAGE_PATH, item.imagePath, item.IMAGE_PATH, ''),
                                sourceLabel: '멤버',
                                contextName: '',
                                permission: 'EDIT',
                                permissionTab: 'FRIEND'
                            };
                        }).filter(Boolean).filter((item) => !isCurrentUserId(item.id));
                    }
                    serverBlockedUserIds.clear();
                    (Array.isArray(data.blockedUserIds) ? data.blockedUserIds : []).forEach((id) => {
                        const value = String(id == null ? '' : id).trim();
                        if (value) serverBlockedUserIds.add(value);
                    });
                    Array.from(selected.entries()).forEach(([key, item]) => {
                        const id = String(firstValue(item && item.id, item && item.userId, '') || '').trim();
                        if (serverBlockedUserIds.has(id)) {
                            selected.delete(key);
                            editors.delete(key);
                        }
                    });
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
                    syncEditorsFromPersistedShares();
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
                requesterName: firstValue(share.requesterName, share.REQUESTER_NAME, share.sharedByName, share.SHARED_BY_NAME, ''),
                requesterEmail: firstValue(share.requesterEmail, share.REQUESTER_EMAIL, ''),
                shareStatus: normalizeShareStatus(firstValue(share.shareStatus, share.SHARE_STATUS, share.status, share.STATUS, 'PENDING')),
                releaseableYn: String(firstValue(share.releaseableYn, share.RELEASEABLE_YN, share.releaseable, share.RELEASEABLE, '') || '').trim().toUpperCase()
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


        function isReceivedShareView() {
            return mode === 'SHARE' && options.persist && readonlyShare === true;
        }

        function contentLabel() {
            const type = String(firstValue(options.contentType, '') || '').trim().toUpperCase();
            if (type === 'PHOTO') return '사진';
            if (type === 'CALENDAR') return '일정';
            if (type === 'NOTE') return '노트';
            return '콘텐츠';
        }

        function receivedActiveShares() {
            const rows = [];
            originalShares.forEach((item, key) => {
                if (isActiveShareStatus(item && item.shareStatus)) rows.push([key, item]);
            });
            return rows;
        }

        function directReceivedShare() {
            return receivedActiveShares()
                .map(([, item]) => item)
                .find((item) => normalizeType(item.type) === 'USER' && isCurrentUserId(item.id)) || null;
        }

        function releaseableReceivedShare() {
            return receivedActiveShares()
                .map(([, item]) => item)
                .find((item) => canReleaseShare(item)) || null;
        }

        function receivedScopeShare() {
            return receivedActiveShares()
                .map(([, item]) => item)
                .find((item) => normalizeType(item.type) === 'WS' || normalizeType(item.type) === 'PROJ') || null;
        }

        function receivedRequesterName(item) {
            return firstValue(item && item.requesterName, item && item.sharedByName, '작성자');
        }

        function receivedScopeLabel(item) {
            const type = normalizeType(item && item.type);
            if (type === 'WS') return `${firstValue(item.name, '그룹')} 그룹`;
            if (type === 'PROJ') return `${firstValue(item.name, '프로젝트')} 프로젝트`;
            return '공유 대상';
        }

        function friendShareIconHtml() {
            return '<i class="fa-solid fa-share-nodes" aria-hidden="true"></i>';
        }

        function friendSendIconHtml() {
            return '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
        }

        function ensureFriendShareRequestSymbol(show, kind) {
            const modal = el('modal');
            const title = el('title');
            if (!modal || !title) return;

            title.querySelectorAll('.moyo-friend-share-request-symbol').forEach((node) => node.remove());
            if (!show) return;

            const isSend = String(kind || '').toUpperCase() === 'SEND';
            const symbol = document.createElement('span');
            symbol.className = 'moyo-friend-share-request-symbol' + (isSend ? ' is-send' : ' is-share');
            symbol.setAttribute('aria-hidden', 'true');
            symbol.innerHTML = isSend ? friendSendIconHtml() : friendShareIconHtml();
            title.appendChild(symbol);
        }

        function receivedShareIconHtml(kind) {
            if (kind === 'scope-project') {
                return '<span class="note-share-received-scope-icon">P</span>';
            }
            if (kind === 'scope-workspace') {
                return '<span class="note-share-received-scope-icon">G</span>';
            }
            return '<i class="fa-solid fa-share-nodes" aria-hidden="true"></i>';
        }

        function receivedShareMessageHtml() {
            const label = contentLabel();
            const direct = directReceivedShare();
            const releasable = releaseableReceivedShare();
            const scope = receivedScopeShare();
            const primary = direct || scope || releasable || (receivedActiveShares()[0] && receivedActiveShares()[0][1]);
            const requester = receivedRequesterName(primary);
            let title;
            let description;
            let iconKind = 'share';
            if (direct) {
                title = `${requester}님에게 공유받은 ${label}입니다.`;
                description = `이 공유를 해지하면 내 ${label === '일정' ? '캘린더' : '목록'}에서 더 이상 보이지 않습니다.`;
            } else if (scope) {
                title = `${receivedScopeLabel(scope)}에 공유된 ${label}입니다.`;
                description = canReleaseShare(scope)
                    ? '공유 관리를 할 수 있는 권한이 있습니다. 해지하면 해당 공유 대상에서 더 이상 보이지 않습니다.'
                    : '공유 관리는 작성자 또는 해당 그룹/프로젝트 관리자만 할 수 있습니다.';
                iconKind = normalizeType(scope.type) === 'PROJ' ? 'scope-project' : 'scope-workspace';
            } else {
                title = `공유받은 ${label}입니다.`;
                description = releasable ? '공유 해지가 가능합니다.' : '공유 관리는 작성자만 할 수 있습니다.';
            }
            return `
                <div class="note-share-received-panel">
                    <div class="note-share-received-icon" aria-hidden="true">${receivedShareIconHtml(iconKind)}</div>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                </div>
            `;
        }

        function handleReceivedShareAction(trigger) {
            const target = releaseableReceivedShare();
            if (!target || !target.shareId) {
                closeModal();
                return;
            }
            releaseExistingShare(target.shareId, trigger);
        }

        function setShareNodeHidden(node, hidden) {
            if (!node) return;
            node.hidden = hidden;
            if (hidden) node.style.setProperty('display', 'none', 'important');
            else node.style.removeProperty('display');
        }

        function setReceivedShareLayout(active) {
            const modal = el('modal');
            if (modal) modal.classList.toggle('is-received-share-view', !!active);
            const body = modal?.querySelector('.note-write-share-body');
            if (body) body.classList.toggle('note-write-share-body-received', !!active);
        }

        function renderReceivedShareView() {
            setReceivedShareLayout(true);
            const tabs = document.querySelector(modalSelector() + ' .note-write-share-tabs');
            setShareNodeHidden(tabs, true);
            const toolbar = document.querySelector(modalSelector() + ' .note-write-share-toolbar');
            setShareNodeHidden(toolbar, true);
            const keyword = el('keyword');
            setShareNodeHidden(keyword, true);
            const subtitles = document.querySelectorAll(modalSelector() + ' .note-write-share-subtitle');
            setShareNodeHidden(subtitles[0], true);
            setShareNodeHidden(subtitles[1], true);
            const candidates = el('candidates');
            if (candidates) {
                setShareNodeHidden(candidates.parentElement, false);
                candidates.innerHTML = receivedShareMessageHtml();
            }
            const selectedBox = el('selected');
            if (selectedBox) {
                setShareNodeHidden(selectedBox, true);
                setShareNodeHidden(selectedBox.parentElement, true);
            }
            const editOption = getShareEditOption();
            setShareNodeHidden(editOption, true);
            const applyButton = el('applyButton');
            if (applyButton) {
                const releaseable = !!releaseableReceivedShare();
                applyButton.hidden = false;
                applyButton.style.removeProperty('display');
                applyButton.textContent = releaseable ? '공유 해지' : '확인';
                applyButton.disabled = false;
                applyButton.classList.add('note-share-received-action');
            }
        }

        function restoreShareManageView() {
            setReceivedShareLayout(false);
            const tabs = document.querySelector(modalSelector() + ' .note-write-share-tabs');
            setShareNodeHidden(tabs, false);
            const toolbar = document.querySelector(modalSelector() + ' .note-write-share-toolbar');
            setShareNodeHidden(toolbar, false);
            const keyword = el('keyword');
            setShareNodeHidden(keyword, false);
            const subtitles = document.querySelectorAll(modalSelector() + ' .note-write-share-subtitle');
            setShareNodeHidden(subtitles[0], false);
            setShareNodeHidden(subtitles[1], false);
            const selectedBox = el('selected');
            if (selectedBox) {
                setShareNodeHidden(selectedBox, false);
                setShareNodeHidden(selectedBox.parentElement, false);
            }
            const candidates = el('candidates');
            if (candidates) setShareNodeHidden(candidates.parentElement, false);
            const editOption = getShareEditOption();
            if (editOption) editOption.style.removeProperty('display');
            const applyButton = el('applyButton');
            if (applyButton) applyButton.classList.remove('note-share-received-action');
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
            const shareId = String(firstValue(item && item.shareId, '') || '').trim();
            if (status === 'PENDING') {
                if (shareId && canReleaseShare(item)) {
                    return '<button type="button" class="note-share-status-badge note-share-status-pending note-share-status-manage" data-share-status-manage="' + escapeHtml(shareId) + '" data-share-status="PENDING" title="공유 요청 관리" aria-haspopup="menu" aria-expanded="false"><span>수락 대기</span><i class="fa-solid fa-chevron-down note-share-status-chevron" aria-hidden="true"></i></button>';
                }
                return '<span class="note-share-status-badge note-share-status-pending" title="상대가 아직 수락하지 않아 목록에 노출되지 않습니다.">수락 대기</span>';
            }
            if (status === 'ACCEPTED') {
                if (shareId && canReleaseShare(item)) {
                    return '<button type="button" class="note-share-status-badge note-share-status-accepted note-share-status-manage" data-share-status-manage="' + escapeHtml(shareId) + '" data-share-status="ACCEPTED" title="공유 관리" aria-haspopup="menu" aria-expanded="false"><span>공유됨</span><i class="fa-solid fa-chevron-down note-share-status-chevron" aria-hidden="true"></i></button>';
                }
                return '<span class="note-share-status-badge note-share-status-accepted" title="현재 공유 중입니다.">공유됨</span>';
            }
            return '';
        }

        function closeShareStatusPopover() {
            if (shareStatusPopover) shareStatusPopover.remove();
            if (shareStatusPopoverTrigger) shareStatusPopoverTrigger.setAttribute('aria-expanded', 'false');
            shareStatusPopover = null;
            shareStatusPopoverTrigger = null;
        }

        function openShareStatusPopover(trigger) {
            if (!trigger) return;
            const shareId = String(trigger.dataset.shareStatusManage || '').trim();
            if (!shareId) return;
            if (shareStatusPopoverTrigger === trigger && shareStatusPopover) {
                closeShareStatusPopover();
                return;
            }
            closeShareStatusPopover();
            const status = normalizeShareStatus(trigger.dataset.shareStatus);
            const popover = document.createElement('div');
            popover.className = 'note-share-status-popover';
            popover.setAttribute('role', 'menu');
            popover.innerHTML = '<div class="note-share-status-popover-title">공유 관리</div>'
                + '<button type="button" class="note-share-status-popover-item is-danger" role="menuitem" data-share-status-release="' + escapeHtml(shareId) + '">'
                + '<i class="fa-solid fa-link-slash" aria-hidden="true"></i><span>'
                + (status === 'PENDING' ? '공유 요청 취소' : '공유 해지') + '</span></button>';
            document.body.appendChild(popover);
            const rect = trigger.getBoundingClientRect();
            const width = popover.offsetWidth || 132;
            const left = Math.min(window.innerWidth - width - 10, Math.max(10, rect.right - width));
            const top = Math.min(window.innerHeight - (popover.offsetHeight || 46) - 10, rect.bottom + 6);
            popover.style.left = left + 'px';
            popover.style.top = top + 'px';
            trigger.setAttribute('aria-expanded', 'true');
            shareStatusPopover = popover;
            shareStatusPopoverTrigger = trigger;
            popover.querySelector('[data-share-status-release]')?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const id = event.currentTarget.dataset.shareStatusRelease;
                closeShareStatusPopover();
                releaseExistingShare(id, trigger);
            });
        }

        document.addEventListener('pointerdown', (event) => {
            if (!shareStatusPopover) return;
            if (shareStatusPopover.contains(event.target) || shareStatusPopoverTrigger?.contains(event.target)) return;
            closeShareStatusPopover();
        }, true);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && shareStatusPopover) closeShareStatusPopover();
        });

        function canReleaseShare(item) {
            if (!item) return false;
            const me = currentUserId();
            if (!me) return false;
            const releaseable = String(firstValue(item.releaseableYn, item.releaseable, '') || '').trim().toUpperCase();
            if (releaseable === 'Y' || releaseable === 'TRUE') return true;
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
                const editKey = scopedKey({ ...item, type, id: item.id });
                rows.set(key, {
                    type,
                    id: item.id,
                    permission: options.enablePermission !== false && (editors.has(key) || editors.has(editKey)) ? 'EDIT' : 'VIEW'
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
                    permission: options.enablePermission !== false && editors.has(key) ? 'EDIT' : 'VIEW'
                });
            });
            selected.forEach((item) => {
                const type = normalizeType(item.type);
                const key = makeKey(type, item.id);
                rows.set(key, {
                    type,
                    id: item.id,
                    permission: options.enablePermission !== false && editors.has(key) ? 'EDIT' : 'VIEW'
                });
            });
            editors.forEach((item) => {
                const type = normalizeType(item.type) || 'USER';
                const key = makeKey(type, item.id);
                if (!rows.has(key)) {
                    rows.set(key, { type, id: item.id, permission: 'EDIT' });
                } else {
                    rows.set(key, { type, id: item.id, permission: 'EDIT' });
                }
            });
            return rows;
        }

        function selectedContentIds() {
            const values = [];
            if (Array.isArray(options.contentIds)) values.push(...options.contentIds);
            else if (options.contentIds != null) values.push(options.contentIds);
            const contentId = firstValue(options.contentId, el('openButton')?.dataset.shareContentId, '');
            values.push(contentId);
            return Array.from(new Set(values
                .map((value) => String(value == null ? '' : value).trim())
                .filter((value) => value && value !== '0')));
        }

        function appendShareRowsToBody(body, rows) {
            rows.forEach((row) => {
                body.append('targetType', row.type);
                body.append('targetId', row.id);
                body.append('permissionType', row.permission || 'VIEW');
            });
        }

        async function syncCustomSubmit() {
            const rows = Array.from(currentRowsMap().values()).filter((row) => normalizeType(row.type) === 'USER');
            if (rows.length === 0) {
                alert(isFriendSendAction() ? '보낼 친구를 선택해 주세요.' : '공유할 친구를 선택해 주세요.');
                return;
            }
            const applyButton = el('applyButton');
            if (applyButton) {
                applyButton.disabled = true;
                applyButton.textContent = shareApplyProgressLabel();
            }
            try {
                await options.onSubmit({
                    actionKind: actionKind(),
                    contentType: String(options.contentType || ''),
                    contentIds: selectedContentIds(),
                    targets: rows.map((row) => ({ type: 'USER', id: String(row.id || '') })).filter((row) => row.id)
                });
                closeModal();
                selected.clear();
                renderSelected();
            } catch (error) {
                alert(error && error.message ? error.message : (isFriendSendAction() ? '친구에게 보내지 못했습니다.' : '공유하지 못했습니다.'));
            } finally {
                if (applyButton) {
                    applyButton.disabled = false;
                    applyButton.textContent = shareApplyLabel();
                }
            }
        }

        function syncShareChanges() {
            const contentType = String(options.contentType || 'NOTE');
            const contentIds = selectedContentIds();
            const contentId = contentIds[0] || '';
            if (!contentId) {
                renderSelected();
                closeModal();
                return;
            }
            const applyButton = el('applyButton');
            if (applyButton) { applyButton.disabled = true; applyButton.textContent = shareApplyProgressLabel(); }

            const tasks = [];

            if (mode === 'SHARE' && currentShareMode() !== 'MEMBER_PERMISSION' && selected.size === 0 && stagedSharePermissions.size === 0) {
                alert('공유할 대상을 선택해 주세요.');
                if (applyButton) {
                    applyButton.disabled = false;
                    applyButton.textContent = shareApplyLabel();
                }
                return;
            }

            if (mode === 'SHARE') syncShareEditShortcutEditors();

            if (mode === 'SHARE' && canUseInlineNotePermission() && stagedSharePermissions.size > 0) {
                stagedSharePermissions.forEach((row) => {
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
                const currentRows = Array.from(currentRowsMap().values());
                if (contentIds.length > 1) {
                    const body = new URLSearchParams({ contentType, shareMode: currentShareMode() });
                    contentIds.forEach((id) => body.append('contentIds', id));
                    appendShareRowsToBody(body, currentRows);
                    tasks.push(fetch('/share/api/save-bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        credentials: 'same-origin',
                        body: body.toString()
                    }).then(assertShareResponse));
                } else {
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
            }

            Promise.all(tasks).then(() => refreshCurrentShares()).then(() => {
                stagedSharePermissions.clear();
                const persistedCount = activeShareCount();
                closeModal();
                if (typeof options.onPersistSuccess === 'function') {
                    options.onPersistSuccess({ mode, selectedCount: selected.size, editorCount: editors.size, shareCount: persistedCount, contentCount: contentIds.length });
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

        function truthyDataset(value) {
            const text = String(value || '').trim().toUpperCase();
            return text === 'Y' || text === 'TRUE' || text === '1';
        }

        function presetReadonlyShare() {
            return truthyDataset(firstValue(
                options.readonlyShare,
                el('openButton')?.dataset.readonlyShare,
                el('modal')?.dataset.readonlyShare,
                ''
            ));
        }

        function openModal(nextMode) {
            mode = currentShareMode() === 'MEMBER_PERMISSION'
                ? 'PERMISSION'
                : (nextMode === 'PERMISSION' && options.enablePermission !== false ? 'PERMISSION' : 'SHARE');
            permissionDetailMode = 'TARGET';
            if (isFriendOnlyTargetMode()) activeTab = 'FRIEND';
            if (mode === 'SHARE' && !isDraftShareMode()) {
                selected.clear();
                shareWithEditPermission = false;
            }
            const modal = el('modal');
            if (!modal) return;
            modal.dataset.shareMode = mode.toLowerCase();
            document.body.classList.add(options.bodyOpenClass || 'note-share-modal-open');

            const openAfterShareStateLoaded = () => {
                if (modal.hidden) modal.hidden = false;
                applyModeText();
                if (isReceivedShareView()) {
                    renderReceivedShareView();
                    return;
                }
                updatePlaceholder();
                loadCandidates();
                renderSelected();
                updateShareTabCounts();
                setTimeout(() => el('keyword')?.focus(), 30);
            };

            if (options.persist && (mode === 'SHARE' || currentShareMode() === 'MEMBER_PERMISSION')) {
                readonlyShare = presetReadonlyShare();
                if (readonlyShare) {
                    modal.hidden = false;
                    applyModeText();
                }
                refreshCurrentShares().then(() => {
                    openAfterShareStateLoaded();
                }).catch(() => {
                    if (modal.hidden) modal.hidden = false;
                    openAfterShareStateLoaded();
                });
                return;
            }

            modal.hidden = false;
            openAfterShareStateLoaded();
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
            if (isReceivedShareView()) {
                ensureFriendShareRequestSymbol(false);
                if (title) title.textContent = '공유';
                if (desc) desc.textContent = '';
                renderReceivedShareView();
                return;
            }
            restoreShareManageView();
            if (mode === 'PERMISSION') {
                const nativeMemberMode = currentShareMode() === 'MEMBER_PERMISSION';
                ensureFriendShareRequestSymbol(false);
                if (title) title.textContent = nativeMemberMode ? '멤버 권한' : '권한 설정';
                if (desc) desc.textContent = nativeMemberMode ? '현재 그룹/프로젝트 멤버의 보기·편집 권한을 관리합니다.' : '';
                const friendOnlyTargets = isFriendOnlyTargetMode();
                if (tabs) setShareNodeHidden(tabs, nativeMemberMode || friendOnlyTargets);
                if (nativeMemberMode || friendOnlyTargets) activeTab = 'FRIEND';
                else updateShareTabCounts();
                if (subtitles[0]) subtitles[0].textContent = nativeMemberMode ? '편집 가능한 멤버' : '편집 권한 대상';
                if (subtitles[1]) {
                    subtitles[1].hidden = false;
                    subtitles[1].innerHTML = '편집 가능 <span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                    subtitles[1].classList.add('note-write-share-subtitle-with-count');
                }
            } else {
                const nativeMemberMode = currentShareMode() === 'MEMBER_PERMISSION';
                if (title) title.textContent = nativeMemberMode ? '멤버 권한' : (isFriendSendAction() ? '친구에게 보내기' : '친구 공유');
                ensureFriendShareRequestSymbol(!nativeMemberMode, isFriendSendAction() ? 'SEND' : 'SHARE');
                if (desc) desc.textContent = nativeMemberMode
                    ? '현재 그룹/프로젝트 멤버의 보기·편집 권한을 관리합니다.'
                    : (isFriendOnlyShare() ? '' : (isDraftShareMode()
                        ? '받는 대상을 선택해 두면 등록 완료 시 공유 요청이 함께 전송됩니다.'
                        : (currentShareMode() === 'FEED' ? '받는 대상에게 MOYO 피드 게시물을 보냅니다.' : '받는 대상을 선택해 공유 요청을 보냅니다.')));
                const friendOnlyTargets = isFriendOnlyTargetMode();
                if (tabs) setShareNodeHidden(tabs, nativeMemberMode || friendOnlyTargets);
                if (nativeMemberMode || friendOnlyTargets) activeTab = 'FRIEND';
                else updateShareTabCounts();
                if (subtitles[0]) subtitles[0].textContent = nativeMemberMode ? '멤버' : '받는 대상';
                if (subtitles[1]) {
                    subtitles[1].hidden = false;
                    subtitles[1].innerHTML = (nativeMemberMode ? '새 권한 대상 ' : '선택 대상 ') + '<span id="' + escapeHtml(ids.modalCount) + '" class="note-share-modal-count" hidden>(0)</span>';
                    subtitles[1].classList.add('note-write-share-subtitle-with-count');
                }
            }
            syncMemberSecretControl();
            updatePermissionModeSwitcher();
            const selectedBox = el('selected');
            if (selectedBox) {
                selectedBox.hidden = false;
                if (selectedBox.parentElement) selectedBox.parentElement.hidden = false;
                selectedBox.classList.add('note-share-chip-list');
            }
            const applyButton = el('applyButton');
            if (applyButton) applyButton.textContent = shareApplyLabel();
            syncActionDescription();
            updateShareEditOption();
        }


        function updatePermissionModeSwitcher() {
            const subtitles = document.querySelectorAll(modalSelector() + ' .note-write-share-subtitle');
            const subtitle = subtitles[0];
            if (!subtitle) return;
            let switcher = subtitle.querySelector('.note-share-permission-scope-toggle');
            const tab = String(activeTab || 'FRIEND').toUpperCase();
            const shouldShow = (mode === 'PERMISSION' || mode === 'SHARE') && (tab === 'WORKSPACE' || tab === 'PROJECT');
            if (!shouldShow) {
                if (switcher) switcher.remove();
                return;
            }
            if (!switcher) {
                switcher = document.createElement('span');
                switcher.className = 'note-share-permission-scope-toggle';
                subtitle.appendChild(switcher);
            }
            const targetLabel = tab === 'PROJECT' ? '프로젝트별' : '그룹별';
            switcher.innerHTML = `
                <button type="button" class="note-share-permission-scope-btn ${permissionDetailMode === 'TARGET' ? 'is-active' : ''}" data-permission-scope="TARGET">${escapeHtml(targetLabel)}</button>
                <button type="button" class="note-share-permission-scope-btn ${permissionDetailMode === 'MEMBER' ? 'is-active' : ''}" data-permission-scope="MEMBER">멤버별</button>
            `;
            switcher.querySelectorAll('[data-permission-scope]').forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const next = String(button.dataset.permissionScope || 'TARGET').toUpperCase() === 'MEMBER' ? 'MEMBER' : 'TARGET';
                    if (permissionDetailMode === next) return;
                    permissionDetailMode = next;
                    const keyword = el('keyword');
                    if (keyword) keyword.value = '';
                    updatePlaceholder();
                    loadCandidates();
                });
            });
        }

        function updatePlaceholder() {
            const keyword = el('keyword');
            if (!keyword) return;
            if (mode === 'PERMISSION') {
                if (activeTab === 'FRIEND') keyword.placeholder = '친구 검색';
                else if (activeTab === 'WORKSPACE') keyword.placeholder = permissionDetailMode === 'MEMBER' ? '그룹 멤버 검색' : '그룹 검색';
                else keyword.placeholder = permissionDetailMode === 'MEMBER' ? '프로젝트 멤버 검색' : '프로젝트 검색';
            } else if (activeTab === 'FRIEND') {
                keyword.placeholder = '친구 이름 또는 이메일 검색';
            } else if (activeTab === 'WORKSPACE') {
                keyword.placeholder = permissionDetailMode === 'MEMBER' ? '그룹 멤버 검색' : '그룹 검색';
            } else {
                keyword.placeholder = permissionDetailMode === 'MEMBER' ? '프로젝트 멤버 검색' : '프로젝트 검색';
            }
        }

        function memberPermissionScopeTarget() {
            const scopeType = String(firstValue(options.scopeType, '') || '').trim().toUpperCase();
            const wsId = String(firstValue(options.wsId, options.scopeWsId, '') || '').trim();
            const projId = String(firstValue(options.projId, options.scopeProjId, '') || '').trim();
            if ((scopeType === 'PROJECT' || scopeType === 'PROJ') && projId) {
                return { type: 'PROJ', id: projId, name: String(firstValue(options.scopeName, '프로젝트') || '프로젝트'), projId, wsId };
            }
            if (wsId) {
                return { type: 'WS', id: wsId, name: String(firstValue(options.scopeName, '그룹') || '그룹'), wsId };
            }
            return null;
        }

        function loadMemberPermissionCandidates() {
            const target = memberPermissionScopeTarget();
            if (!target) {
                cachedCandidates = [];
                renderCandidates(cachedCandidates, '현재 그룹/프로젝트 정보를 찾지 못했습니다.');
                return;
            }
            const cacheKey = makeKey(target.type, target.id);
            if (!groupMemberCache.has(cacheKey)) {
                const localMembers = target.type === 'WS'
                    ? getWorkspaceMembersFromDom(target.id)
                    : getProjectMembersFromDom(target.id);
                if (localMembers.length > 0) groupMemberCache.set(cacheKey, localMembers);
                else {
                    fetchGroupMembers(target);
                    cachedCandidates = [];
                    renderCandidates(cachedCandidates, '멤버를 불러오는 중입니다.');
                    return;
                }
            }
            const keyword = getKeyword();
            cachedCandidates = (groupMemberCache.get(cacheKey) || [])
                .map((member) => ({
                    ...member,
                    type: 'USER',
                    parentType: target.type,
                    parentId: target.id,
                    permissionTab: target.type === 'PROJ' ? 'PROJECT' : 'WORKSPACE'
                }))
                .filter((item) => matchKeyword(item, keyword));
            renderCandidates(cachedCandidates, '현재 그룹/프로젝트에 표시할 멤버가 없습니다.');
        }

        // 후보 데이터 로딩
        function loadCandidates() {
            if (isMemberPermissionShareMode()) {
                loadMemberPermissionCandidates();
                return;
            }
            if (isReceivedShareView()) {
                renderReceivedShareView();
                return;
            }
            if (isFriendOnlyTargetMode()) activeTab = 'FRIEND';
            updatePermissionModeSwitcher();
            if (mode === 'PERMISSION') {
                loadPermissionCandidates();
                return;
            }
            if (activeTab === 'FRIEND') {
                loadFriendCandidates();
                return;
            }
            const keyword = getKeyword();
            const pendingLoads = ensureShareScopeMembersLoaded();
            const source = getShareCandidatesForTab(activeTab);
            cachedCandidates = source
                .filter((item) => !isCoveredByParentSelection(item))
                .filter((item) => matchKeyword(item, keyword));
            let message = '선택할 대상이 없습니다.';
            if (pendingLoads > 0 && permissionDetailMode === 'MEMBER') {
                message = activeTab === 'PROJECT' ? '프로젝트 멤버를 불러오는 중입니다.' : '그룹 멤버를 불러오는 중입니다.';
            } else if (permissionDetailMode === 'MEMBER') {
                message = activeTab === 'PROJECT' ? '선택 가능한 프로젝트 멤버가 없습니다.' : '선택 가능한 그룹 멤버가 없습니다.';
            }
            renderCandidates(cachedCandidates, message);
        }


        function ensureShareScopeMembersLoaded() {
            if (activeTab !== 'WORKSPACE' && activeTab !== 'PROJECT') return 0;
            if (permissionDetailMode !== 'MEMBER') return 0;
            const parents = activeTab === 'WORKSPACE' ? getWorkspaceTargets() : getProjectTargets();
            let pending = 0;
            parents.forEach((item) => {
                const type = activeTab === 'WORKSPACE' ? 'WS' : 'PROJ';
                const key = makeKey(type, item.id);
                if (groupMemberCache.has(key)) return;
                const localMembers = type === 'WS' ? getWorkspaceMembersFromDom(item.id) : getProjectMembersFromDom(item.id);
                if (localMembers.length > 0) {
                    groupMemberCache.set(key, localMembers);
                    return;
                }
                pending += 1;
                fetchGroupMembers({ ...item, type });
            });
            return pending;
        }

        function getShareCandidatesForTab(tabValue) {
            const tab = String(tabValue || 'FRIEND').toUpperCase();
            if (tab === 'WORKSPACE') {
                const groups = getWorkspaceTargets();
                if (permissionDetailMode === 'TARGET') return groups.map((item) => ({ ...item, permissionTab: 'WORKSPACE' }));
                ensureAllScopeMembersLoaded(groups, 'WS');
                return flattenScopeMembers(groups, 'WS', 'WORKSPACE');
            }
            if (tab === 'PROJECT') {
                const projects = getProjectTargets();
                if (permissionDetailMode === 'TARGET') return projects.map((item) => ({ ...item, permissionTab: 'PROJECT' }));
                ensureAllScopeMembersLoaded(projects, 'PROJ');
                return flattenScopeMembers(projects, 'PROJ', 'PROJECT');
            }
            return cachedCandidates;
        }

        function ensureAllScopeMembersLoaded(items, type) {
            (items || []).forEach((item) => fetchGroupMembers({ ...item, type }));
        }

        function flattenScopeMembers(parents, parentType, tabValue) {
            const map = new Map();
            (parents || []).forEach((parent) => {
                const members = parentType === 'WS' ? getWorkspaceMembers(parent.id) : getProjectMembers(parent.id);
                members.forEach((member) => {
                    const item = memberToPermissionCandidate(member, { ...parent, type: parentType }, tabValue);
                    if (!item || !item.id || isCurrentUserId(item.id)) return;
                    const key = scopedKey(item);
                    if (!map.has(key)) map.set(key, item);
                });
            });
            return Array.from(map.values()).sort((a, b) => `${a.subText || ''} ${a.name || ''}`.localeCompare(`${b.subText || ''} ${b.name || ''}`, 'ko'));
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
                imagePath: firstValue(
                    item.profileImagePath,
                    item.PROFILE_IMAGE_PATH,
                    item.profileImage,
                    item.profileImg,
                    item.profileImageUrl,
                    item.profileUrl,
                    item.profile,
                    item.croppedImagePath,
                    item.profilePath,
                    item.imagePath,
                    item.IMAGE_PATH
                ),
                sourceLabel: '친구',
                contextName: ''
            };
        }

        function loadPermissionCandidates() {
            updatePermissionModeSwitcher();
            const keyword = getKeyword();
            const pendingLoads = ensureSharedGroupMembersLoaded();
            const accessTargets = getSharedAccessTargets();
            cachedCandidates = getPermissionCandidatesForTab(activeTab)
                .filter((item) => !isCoveredByParentEditor(item) || editors.has(scopedKey(item)))
                .filter((item) => matchKeyword(item, keyword));

            let message;
            if (accessTargets.length === 0) {
                message = '먼저 공유에서 친구/그룹/프로젝트를 추가하세요.';
            } else if (pendingLoads > 0 && permissionDetailMode === 'MEMBER') {
                message = '공유된 그룹/프로젝트 멤버를 불러오는 중입니다.';
            } else if (mode === 'PERMISSION' && currentShareMode() !== 'MEMBER_PERMISSION' && activeTab !== 'FRIEND' && permissionDetailMode === 'MEMBER') {
                message = '선택한 공유 대상에 멤버가 없습니다.';
            } else {
                message = '추가할 편집 권한 대상이 없습니다.';
            }
            renderCandidates(cachedCandidates, message);
        }

        function getSharedAccessTargets() {
            const map = new Map();
            originalShares.forEach((item, key) => {
                const status = normalizeShareStatus(item.shareStatus);
                if (status !== 'PENDING' && status !== 'ACCEPTED') return;
                const type = normalizeType(item.type);
                const id = String(item.id || '').trim();
                if (!type || !id) return;
                map.set(scopedKey({ ...item, type, id }), { ...item, type, id, permission: 'VIEW' });
            });
            selected.forEach((item, key) => {
                const type = normalizeType(item.type);
                const id = String(item.id || '').trim();
                if (!type || !id) return;
                map.set(scopedKey({ ...item, type, id }), { ...item, type, id, permission: 'VIEW' });
            });
            return Array.from(map.values()).sort((a, b) => {
                const ax = `${typeSortValue(a.type)} ${a.subText || ''} ${a.name || ''}`;
                const bx = `${typeSortValue(b.type)} ${b.subText || ''} ${b.name || ''}`;
                return ax.localeCompare(bx, 'ko');
            });
        }


        function getPermissionCandidatesForTab(tabValue) {
            const tab = String(tabValue || 'FRIEND').toUpperCase();
            const map = new Map();
            getSharedAccessTargets().forEach((item) => {
                const type = normalizeType(item.type);
                const parentType = normalizeType(item.parentType);
                if (tab === 'FRIEND') {
                    if (type === 'USER' && !parentType) addPermissionCandidate(map, { ...item, type: 'USER', permissionTab: 'FRIEND' });
                    return;
                }
                if (tab === 'WORKSPACE') {
                    if (type === 'WS') {
                        if (permissionDetailMode === 'TARGET') {
                            addPermissionCandidate(map, { ...item, type: 'WS', permissionTab: 'WORKSPACE', subText: '그룹' });
                        } else {
                            getWorkspaceMembers(item.id).forEach((member) => {
                                addPermissionCandidate(map, memberToPermissionCandidate(member, item, 'WORKSPACE'));
                            });
                        }
                        return;
                    }
                    if (type === 'USER' && parentType === 'WS' && permissionDetailMode === 'MEMBER') {
                        addPermissionCandidate(map, { ...item, type: 'USER', permissionTab: 'WORKSPACE' });
                    }
                    return;
                }
                if (tab === 'PROJECT') {
                    if (type === 'PROJ') {
                        if (permissionDetailMode === 'TARGET') {
                            addPermissionCandidate(map, { ...item, type: 'PROJ', permissionTab: 'PROJECT', subText: item.wsName ? `${item.wsName} · 프로젝트` : '프로젝트' });
                        } else {
                            getProjectMembers(item.id).forEach((member) => {
                                addPermissionCandidate(map, memberToPermissionCandidate(member, item, 'PROJECT'));
                            });
                        }
                        return;
                    }
                    if (type === 'USER' && parentType === 'PROJ' && permissionDetailMode === 'MEMBER') {
                        addPermissionCandidate(map, { ...item, type: 'USER', permissionTab: 'PROJECT' });
                    }
                }
            });
            return Array.from(map.values()).sort((a, b) => {
                const ax = `${permissionSortValue(a)} ${a.subText || ''} ${a.name || ''}`;
                const bx = `${permissionSortValue(b)} ${b.subText || ''} ${b.name || ''}`;
                return ax.localeCompare(bx, 'ko');
            });
        }

        function addPermissionCandidate(map, item) {
            const type = normalizeType(item.type) || 'USER';
            const id = String(item.id || '').trim();
            if (!id) return;
            if (type === 'USER' && isCurrentUserId(id)) return;
            if (isCoveredByParentEditor(item)) return;
            const key = scopedKey({ ...item, type, id });
            if (map.has(key)) {
                const old = map.get(key);
                if (!old.permissionTab && item.permissionTab) old.permissionTab = item.permissionTab;
                if (!old.parentType && item.parentType) old.parentType = item.parentType;
                if (!old.parentId && item.parentId) old.parentId = item.parentId;
                return;
            }
            map.set(key, { ...item, type, id, permission: 'EDIT' });
        }

        function permissionScopeClass(item) {
            const type = normalizeType(item && item.type);
            const parentType = normalizeType(item && item.parentType);
            const tab = String(item && item.permissionTab || '').toUpperCase();
            if (type === 'USER' && (parentType === 'WS' || tab === 'WORKSPACE')) return 'note-share-scope-ws-member';
            if (type === 'USER' && (parentType === 'PROJ' || tab === 'PROJECT')) return 'note-share-scope-proj-member';
            return '';
        }

        function parentEditorKeyFor(item) {
            const parentType = normalizeType(item && item.parentType);
            const parentId = String(item && item.parentId || '').trim();
            if (!parentType || !parentId) return '';
            return makeKey(parentType, parentId);
        }

        function isCoveredByParentEditor(item) {
            const key = parentEditorKeyFor(item);
            return !!key && editors.has(key);
        }
        function isCoveredByParentSelection(item) {
            const key = parentEditorKeyFor(item);
            return !!key && selected.has(key);
        }

        function removeCoveredChildSelections(parentItem) {
            const parentType = normalizeType(parentItem && parentItem.type);
            const parentId = String(parentItem && parentItem.id || '').trim();
            if (!parentType || !parentId || (parentType !== 'WS' && parentType !== 'PROJ')) return;
            const members = parentType === 'WS' ? getWorkspaceMembers(parentId) : getProjectMembers(parentId);
            const memberIds = new Set(members.map((member) => String(member.id || '').trim()).filter(Boolean));
            Array.from(selected.entries()).forEach(([selectedKey, item]) => {
                const itemType = normalizeType(item && item.type);
                const itemId = String(item && item.id || '').trim();
                const itemParentType = normalizeType(item && item.parentType);
                const itemParentId = String(item && item.parentId || '').trim();
                const sameParent = itemParentType === parentType && itemParentId === parentId;
                const sameMember = itemType === 'USER' && memberIds.has(itemId);
                if (sameParent || sameMember) selected.delete(selectedKey);
            });
        }


        function removeCoveredChildEditors(parentItem) {
            const parentType = normalizeType(parentItem && parentItem.type);
            const parentId = String(parentItem && parentItem.id || '').trim();
            if (!parentType || !parentId || (parentType !== 'WS' && parentType !== 'PROJ')) return;
            const members = parentType === 'WS' ? getWorkspaceMembers(parentId) : getProjectMembers(parentId);
            const memberIds = new Set(members.map((member) => String(member.id || '').trim()).filter(Boolean));
            Array.from(editors.entries()).forEach(([editorKey, editor]) => {
                const editorType = normalizeType(editor && editor.type);
                const editorId = String(editor && editor.id || '').trim();
                const editorParentType = normalizeType(editor && editor.parentType);
                const editorParentId = String(editor && editor.parentId || '').trim();
                const sameParent = editorParentType === parentType && editorParentId === parentId;
                const sameMember = editorType === 'USER' && memberIds.has(editorId);
                if (sameParent || sameMember) editors.delete(editorKey);
            });
        }

        function memberToPermissionCandidate(member, parent, tabValue) {
            const parentType = normalizeType(parent.type);
            const parentName = parent.name || (parentType === 'WS' ? '그룹' : '프로젝트');
            const parentLabel = String(firstValue(member.roleName, member.role, member.memberRole, '멤버')).replace(/^(그룹|프로젝트)\s*/, '') || '멤버';
            const sourceTag = normalizeSourceTag({
                type: parentType,
                id: parent.id,
                label: parent.name || (parentType === 'WS' ? '그룹' : '프로젝트'),
                parent: parent.wsName || ''
            });
            return {
                ...member,
                type: 'USER',
                id: String(member.id || '').trim(),
                name: member.name || member.userName || member.email || '이름 없음',
                email: member.email || '',
                imagePath: member.imagePath || member.profileImagePath || '',
                subText: parentLabel,
                contextName: parentName,
                permissionTab: tabValue,
                parentType,
                parentId: String(parent.id || '').trim(),
                sourceTags: sourceTag ? [sourceTag] : [],
                sourceTagKeys: sourceTag ? new Set([sourceTag.key]) : new Set()
            };
        }

        function permissionSortValue(item) {
            const type = normalizeType(item.type);
            if (type === 'WS' || type === 'PROJ') return '0';
            return '1';
        }

        function typeSortValue(type) {
            const t = normalizeType(type);
            if (t === 'USER') return '1';
            if (t === 'WS') return '2';
            if (t === 'PROJ') return '3';
            return '9';
        }
        function scopedKey(item) {
            const type = normalizeType(item && item.type) || 'USER';
            const id = String(item && item.id || '').trim();
            const parentType = normalizeType(item && item.parentType);
            const parentId = String(item && item.parentId || '').trim();
            if (type === 'USER' && parentType && parentId) {
                return makeKey(type, id) + '@' + makeKey(parentType, parentId);
            }
            return makeKey(type, id);
        }

        function removeSameUserTargets(store, item) {
            const type = normalizeType(item && item.type);
            const id = String(item && item.id || '').trim();
            if (type !== 'USER' || !id) return;
            Array.from(store.entries()).forEach(([key, value]) => {
                if (normalizeType(value && value.type) === 'USER' && String(value && value.id || '').trim() === id) {
                    store.delete(key);
                }
            });
        }

        // 같은 사용자가 프로젝트/그룹 소속 키로 여러 번 들어와도 편집 권한은 USER_ID 기준 1건만 유지한다.
        function dedupeEditorUsers() {
            const seenUserIds = new Set();
            Array.from(editors.entries()).forEach(([key, item]) => {
                if (normalizeType(item && item.type) !== 'USER') return;
                const userId = String(firstValue(item && item.id, item && item.userId, item && item.USER_ID, '') || '').trim();
                if (!userId) return;
                if (seenUserIds.has(userId)) {
                    editors.delete(key);
                    return;
                }
                seenUserIds.add(userId);
            });
        }

        function hasAccessForEditor(item) {
            const type = normalizeType(item && item.type);
            const id = String(item && item.id || '').trim();
            if (!type || !id) return false;
            const directKey = makeKey(type, id);
            const accessKeys = permissionAccessKeys();
            if (accessKeys.has(directKey)) return true;
            if (type === 'USER') return accessKeys.has(makeKey('USER', id));
            return false;
        }

        function shareAvatarHtml(item) {
            return avatarHtml(item);
        }

        function renderCandidatesFromCache() {
            closeShareStatusPopover();
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
                box.innerHTML = items.map((item) => {
                    const type = normalizeType(item.type) || 'USER';
                    const key = scopedKey(item);
                    const checked = editors.has(key);
                    const scopeClass = permissionScopeClass(item);
                    return `
                        <div class="note-share-target-block note-share-type-${escapeHtml(type.toLowerCase())} ${escapeHtml(scopeClass)}">
                            <div class="note-write-share-card moyo-person-picker-card note-share-type-${escapeHtml(type.toLowerCase())} ${escapeHtml(scopeClass)} ${checked ? 'is-selected' : ''}" data-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}" data-key="${escapeHtml(key)}" role="button" tabindex="0">
                                ${shareAvatarHtml(item)}
                                <span class="note-write-share-main moyo-person-picker-main">
                                    <strong>${escapeHtml(item.name || '이름 없음')}</strong>
                                    <small>${escapeHtml(item.subText || item.contextName || '')}</small>
                                </span>
                                <span class="note-write-share-check moyo-person-picker-check" aria-hidden="true"></span>
                            </div>
                        </div>
                    `;
                }).join('');
                box.querySelectorAll('.note-write-share-card').forEach((row) => {
                    const toggleEditor = () => {
                        const type = normalizeType(row.dataset.type) || 'USER';
                        const key = row.dataset.key || makeKey(type, row.dataset.id);
                        const item = cachedCandidates.find((candidate) => scopedKey(candidate) === key);
                        if (!item) return;
                        if (editors.has(key)) {
                            editors.delete(key);
                        } else {
                            if (type === 'WS' || type === 'PROJ') removeCoveredChildEditors({ ...item, type });
                            else removeSameUserTargets(editors, item);
                            editors.set(key, { ...item, type, permission: 'EDIT', permissionTab: item.permissionTab || activeTab });
                        }
                        loadCandidates();
                        renderSelected();
                    };
                    row.addEventListener('click', toggleEditor);
                    row.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleEditor();
                        }
                    });
                });
                return;
            }

            box.innerHTML = items.map((item) => {
                const key = scopedKey(item);
                const scopeClass = permissionScopeClass(item);
                const existing = getExistingShare(item);
                const status = existing ? normalizeShareStatus(existing.shareStatus) : 'NONE';
                const blockedReason = blockedCandidateReason(item);
                const sendable = isCandidateSendable(item);
                const checked = selected.has(key);
                const permissionVisible = !blockedReason && (checked || (!!existing && isActiveShareStatus(status)));
                const permissionHtml = inlinePermissionHtml(existing || item, key, permissionVisible);
                const blockedHtml = blockedReason
                    ? '<span class="note-share-status-badge note-share-status-blocked" title="' + escapeHtml(blockedReason === '원작성자' ? '담아온 원본의 작성자에게는 다시 공유할 수 없습니다.' : '작성자 본인에게는 보낼 수 없습니다.') + '">' + escapeHtml(blockedReason) + '</span>'
                    : '';
                const statusHtml = !blockedReason && !sendable ? shareStatusBadgeHtml(existing || item) : '';
                return `
                    <div class="note-share-target-block note-share-type-${escapeHtml(item.type.toLowerCase())} ${escapeHtml(scopeClass)}">
                        <div class="note-write-share-card moyo-person-picker-card note-share-type-${escapeHtml(item.type.toLowerCase())} ${escapeHtml(scopeClass)} ${checked ? 'is-selected' : ''} ${sendable ? '' : 'is-share-disabled'}" data-type="${escapeHtml(item.type)}" data-id="${escapeHtml(item.id)}" data-key="${escapeHtml(key)}" role="button" tabindex="${sendable ? '0' : '-1'}" aria-disabled="${sendable ? 'false' : 'true'}">
                            ${shareAvatarHtml(item)}
                            <span class="note-write-share-main moyo-person-picker-main">
                                <strong>${escapeHtml(item.name)}</strong>
                                <small>${escapeHtml(item.subText || item.contextName || '')}</small>
                            </span>
                            <span class="note-share-candidate-actions">
                                ${permissionHtml}
                                ${blockedHtml}
                            </span>
                            <span class="note-share-candidate-state">
                                ${statusHtml || '<span class="note-write-share-check moyo-person-picker-check" aria-hidden="true"></span>'}
                            </span>
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

            box.querySelectorAll('[data-share-status-manage]').forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openShareStatusPopover(button);
                });
            });

            box.querySelectorAll('[data-share-permission]').forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const key = button.dataset.sharePermissionKey || '';
                    const row = button.closest('.note-write-share-card');
                    const item = cachedCandidates.find((candidate) => scopedKey(candidate) === key)
                        || getExistingShare({ type: row && row.dataset.type, id: row && row.dataset.id });
                    if (!item) return;
                    changeInlineSharePermission(item, key || scopedKey(item), button.dataset.sharePermission);
                });
            });

            box.querySelectorAll('.note-write-share-card').forEach((row) => {
                const toggle = () => {
                    const key = row.dataset.key || makeKey(row.dataset.type, row.dataset.id);
                    const item = cachedCandidates.find((candidate) => scopedKey(candidate) === key);
                    if (!item || !isCandidateSendable(item)) return;
                    if (selected.has(key)) {
                        selected.delete(key);
                        const old = originalShares.get(key);
                        const oldPermission = String(firstValue(old && old.permission, old && old.permissionType, 'VIEW')).toUpperCase();
                        if (!old || oldPermission !== 'EDIT') editors.delete(key);
                    } else {
                        const type = normalizeType(item.type);
                        if (type === 'WS' || type === 'PROJ') {
                            removeCoveredChildSelections({ ...item, type });
                            if (shareWithEditPermission) removeCoveredChildEditors({ ...item, type });
                        } else {
                            removeSameUserTargets(selected, item);
                            if (shareWithEditPermission) removeSameUserTargets(editors, item);
                        }
                        const nextItem = { ...item, permission: shareWithEditPermission ? 'EDIT' : 'VIEW', permissionTab: item.permissionTab || activeTab };
                        selected.set(key, nextItem);
                        if (shareWithEditPermission && options.enablePermission !== false) {
                            editors.set(key, { ...nextItem, permission: 'EDIT' });
                        }
                    }
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
            // 카운트/칩을 그리기 전에도 USER_ID 기준으로 한 번 더 정리해 중복 노출을 막는다.
            if (mode === 'PERMISSION') dedupeEditorUsers();
            if (isReceivedShareView()) {
                renderReceivedShareView();
                return;
            }
            const box = el('selected');
            const count = el('count');
            const modalCount = el('modalCount');

            const displayCount = mode === 'PERMISSION' ? editors.size : selected.size;
            updatePersistedShareCounters();
            if (modalCount) {
                modalCount.textContent = '(' + String(displayCount) + ')';
                modalCount.hidden = displayCount === 0;
            }
            updateShareTabCounts();
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
                box.hidden = false;
                if (box.parentElement) box.parentElement.hidden = false;
                box.classList.add('note-share-chip-list');
                if (mode === 'PERMISSION') {
                    const rows = Array.from(editors.entries());
                    if (!rows.length) {
                        box.innerHTML = '<div class="note-write-share-empty note-write-share-empty-compact">아직 편집 가능한 멤버가 없습니다.</div>';
                    } else {
                        box.innerHTML = rows.map(([key, item]) => selectedChipHtml(key, item, 'editor')).join('');
                        box.querySelectorAll('[data-remove-share]').forEach((button) => {
                            button.addEventListener('click', (event) => {
                                event.stopPropagation();
                                const key = button.dataset.removeShare;
                                editors.delete(key);
                                loadCandidates();
                                renderSelected();
                            });
                        });
                    }
                } else {
                    const rows = Array.from(selected.entries()).filter(([key]) => {
                        const existing = originalShares.get(key);
                        return !existing || !isActiveShareStatus(existing.shareStatus);
                    });
                    if (!rows.length) {
                        box.innerHTML = '<div class="note-write-share-empty note-write-share-empty-compact">아직 선택된 대상이 없습니다.</div>';
                    } else {
                        box.innerHTML = rows.map(([key, item]) => selectedChipHtml(key, item, 'share')).join('');
                        box.querySelectorAll('[data-share-release]').forEach((button) => {
                            button.addEventListener('click', (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                releaseExistingShare(button.dataset.shareRelease, button);
                            });
                        });
                        box.querySelectorAll('[data-remove-share]').forEach((button) => {
                            button.addEventListener('click', (event) => {
                                event.stopPropagation();
                                const removeKey = button.dataset.removeShare || '';
                                selected.delete(removeKey);
                                const old = originalShares.get(removeKey);
                                const oldPermission = String(firstValue(old && old.permission, old && old.permissionType, 'VIEW')).toUpperCase();
                                if (!old || oldPermission !== 'EDIT') editors.delete(removeKey);
                                renderCandidatesFromCache();
                                renderSelected();
                            });
                        });
                    }
                }
            }

            updateShareEditOption();
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
                if (isReceivedShareView()) {
                    closeModal();
                    if (options.reloadOnPersist !== false) window.location.reload();
                }
            }).catch((error) => {
                alert(error && error.message ? error.message : '공유를 해지하지 못했습니다.');
                if (trigger) {
                    trigger.disabled = false;
                    trigger.textContent = originalText || (status === 'PENDING' ? '취소' : '해지');
                }
            });
        }

        function selectedChipHtml(key, item, kind) {
            const type = normalizeType(item.type) || 'USER';
            const scopeClass = permissionScopeClass(item);
            const chipClass = 'note-share-chip moyo-person-picker-chip note-share-type-' + escapeHtml(type.toLowerCase()) + (scopeClass ? ' ' + escapeHtml(scopeClass) : '');
            const source = String(item.contextName || item.subText || '').trim();
            const rawTitle = kind === 'editor' && isMemberPermissionShareMode()
                ? (item.name || '이름 없음')
                : (source && normalizeType(item.type) === 'USER' && (item.parentType || item.permissionTab === 'WORKSPACE' || item.permissionTab === 'PROJECT')
                    ? (item.name || '이름 없음') + ' · ' + source.replace(/ · (그룹|프로젝트) 멤버$/, '')
                    : (item.name || '이름 없음'));
            const title = escapeHtml(rawTitle);
            const status = normalizeShareStatus(item && item.shareStatus);
            const shareId = String(firstValue(item && item.shareId, '')).trim();
            const existingActive = kind === 'share' && shareId && isActiveShareStatus(status);
            const releaseable = existingActive && canReleaseShare(item);
            const removeLabel = kind === 'editor' ? '편집 권한 제거' : (existingActive ? (status === 'PENDING' ? '공유 요청 취소' : '공유 해지') : '선택 대상 제거');
            const removeButton = releaseable
                ? `<button type="button" class="note-share-chip-remove" data-share-release="${escapeHtml(shareId)}" aria-label="${title} ${escapeHtml(removeLabel)}">×</button>`
                : (existingActive
                    ? ''
                    : `<button type="button" class="note-share-chip-remove" data-remove-share="${escapeHtml(key)}" aria-label="${title} ${escapeHtml(removeLabel)}">×</button>`);
            return `
                <span class="${chipClass}" title="${title}">
                    ${shareAvatarHtml(item)}
                    <span class="note-share-chip-name">${title}</span>
                    ${kind === 'share' && canUseInlineNotePermission() ? '<span class="note-share-chip-permission">' + (sharePermissionFor(item, key) === 'EDIT' ? '편집' : '보기') + '</span>' : (kind === 'share' && (editors.has(key) || String(firstValue(item && item.permission, item && item.permissionType, '')).toUpperCase() === 'EDIT') ? '<span class="note-share-chip-permission">편집</span>' : '')}
                    ${removeButton}
                </span>
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
                <input type="hidden" name="sharePermissionType" value="${escapeHtml(options.enablePermission === false ? 'VIEW' : item.permission)}">
            `).join('');
        }

        function removeOrphanEditors() {
            Array.from(editors.entries()).forEach(([key, item]) => {
                if (!hasAccessForEditor(item)) {
                    editors.delete(key);
                    return;
                }
                if (isCoveredByParentEditor(item)) editors.delete(key);
            });
        }

        function permissionAccessKeys() {
            const keys = new Set();
            getSharedAccessTargets().forEach((item) => {
                const type = normalizeType(item.type);
                const id = String(item.id || '').trim();
                if (!type || !id) return;
                keys.add(makeKey(type, id));
                if (type === 'WS') {
                    getWorkspaceMembers(id).forEach((member) => {
                        if (member.id && !isCurrentUserId(member.id)) keys.add(makeKey('USER', member.id));
                    });
                } else if (type === 'PROJ') {
                    getProjectMembers(id).forEach((member) => {
                        if (member.id && !isCurrentUserId(member.id)) keys.add(makeKey('USER', member.id));
                    });
                }
            });
            return keys;
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
            getSharedAccessTargets().forEach((item) => {
                const type = normalizeType(item.type);
                if (type !== 'WS' && type !== 'PROJ') return;
                const key = makeKey(type, item.id);
                if (groupMemberCache.has(key)) return;

                const localMembers = type === 'WS'
                    ? getWorkspaceMembersFromDom(item.id)
                    : getProjectMembersFromDom(item.id);
                if (localMembers.length > 0) {
                    groupMemberCache.set(key, localMembers);
                    return;
                }

                pending += 1;
                fetchGroupMembers({ ...item, type });
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
                    if (isMemberPermissionShareMode()) {
                        loadMemberPermissionCandidates();
                        renderSelected();
                    } else if (mode === 'PERMISSION') {
                        loadPermissionCandidates();
                        renderSelected();
                    } else if (mode === 'SHARE' && permissionDetailMode === 'MEMBER' && (activeTab === 'WORKSPACE' || activeTab === 'PROJECT')) {
                        loadCandidates();
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

        function memberRoleLabel(rawRole, parentType) {
            const code = String(rawRole || 'MEMBER').trim().toUpperCase();
            const type = normalizeType(parentType);
            if (type === 'PROJ') {
                if (['OWNER', 'LEADER', 'PM'].includes(code)) return '팀장';
                if (code === 'ADMIN') return '관리자';
                return '멤버';
            }
            if (type === 'WS') {
                if (['OWNER', 'LEADER'].includes(code)) return '그룹장';
                if (code === 'ADMIN') return '관리자';
                return '멤버';
            }
            return code === 'ADMIN' ? '관리자' : '멤버';
        }

        function memberFromDataset(node) {
            const wsId = String(firstValue(node.dataset.wsId, node.dataset.WS_ID, '')).trim();
            const projId = String(firstValue(node.dataset.projId, node.dataset.PROJ_ID, '')).trim();
            const parentType = wsId ? 'WS' : (projId ? 'PROJ' : '');
            const parentId = wsId || projId;
            const parentName = firstValue(node.dataset.wsName, node.dataset.projName, '');
            return {
                type: 'USER',
                id: String(firstValue(node.dataset.userId, node.dataset.USER_ID, '')).trim(),
                name: firstValue(node.dataset.userName, node.dataset.displayName, node.dataset.USER_NAME, node.dataset.DISPLAY_NAME, node.dataset.email, node.dataset.EMAIL, '이름 없음'),
                email: firstValue(node.dataset.email, node.dataset.EMAIL, ''),
                imagePath: firstValue(node.dataset.profileImagePath, node.dataset.PROFILE_IMAGE_PATH, node.dataset.profileImage, node.dataset.imagePath),
                roleName: memberRoleLabel(firstValue(node.dataset.roleName, node.dataset.projRole, node.dataset.wsRole, node.dataset.role, 'MEMBER'), parentType),
                subText: memberRoleLabel(firstValue(node.dataset.roleName, node.dataset.projRole, node.dataset.wsRole, node.dataset.role, 'MEMBER'), parentType),
                contextName: parentName,
                parentType,
                parentId,
                permissionTab: parentType === 'WS' ? 'WORKSPACE' : (parentType === 'PROJ' ? 'PROJECT' : '')
            };
        }

        function memberFromApi(row, group) {
            const id = String(firstValue(row.userId, row.USER_ID, row.id, row.ID, '')).trim();
            const name = firstValue(row.userName, row.USER_NAME, row.displayName, row.DISPLAY_NAME, row.name, row.NAME, row.email, row.EMAIL, '이름 없음');
            const email = firstValue(row.email, row.EMAIL, row.contactEmail, row.CONTACT_EMAIL, '');
            const imagePath = firstValue(row.profileImagePath, row.PROFILE_IMAGE_PATH, row.profileImage, row.imagePath, row.IMAGE_PATH, '');
            const rawRole = firstValue(row.roleName, row.WS_ROLE, row.PROJ_ROLE, row.role, row.ROLE, 'MEMBER');
            const groupType = normalizeType(group.type);
            const roleName = memberRoleLabel(rawRole, groupType);
            const groupText = groupType === 'WS'
                ? `${group.name} · 그룹 멤버`
                : `${group.wsName ? group.wsName + ' · ' : ''}${group.name} · 프로젝트 멤버`;
            return {
                type: 'USER',
                id,
                name,
                email,
                imagePath,
                roleName,
                subText: roleName,
                contextName: group.name || roleName,
                parentType: groupType,
                parentId: String(group.id || '').trim(),
                permissionTab: groupType === 'WS' ? 'WORKSPACE' : (groupType === 'PROJ' ? 'PROJECT' : '')
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
    }

    function makeKey(type, id) {
        const normalizedType = String(type || '').trim().toUpperCase();
        const prefix = normalizedType === 'WORKSPACE' ? 'WS' : (normalizedType === 'PROJECT' ? 'PROJ' : normalizedType);
        return prefix + '_' + String(id || '').trim();
    }

    function avatarHtml(item) {
        // SHARE / SEND도 일반 사람 선택과 동일한 프로필/기본 아바타 렌더러를 사용한다.
        // 두 모드가 서로 다른 fallback 마크업을 만들면 기본 아바타가 화면마다 달라진다.
        const commonAvatar = window.CommonPeopleModal && window.CommonPeopleModal.personAvatarHtml;
        if (typeof commonAvatar === 'function') {
            return commonAvatar(item || {});
        }

        // 초기화 순서상 공통 렌더러가 아직 준비되지 않은 극초기 fallback.
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

    window.CommonPeopleModal = window.CommonPeopleModal || {};
    window.CommonPeopleModal.init = initShareModal;
})();


/**
 * 공통 사람 목록/선택 모달
 * - 사람 공통 데이터, 검색, 목록 스크롤, 프로필 이동, 단일/다중 선택만 담당한다.
 * - 친구 관계/API/문구는 friendPeopleAdapter.js가 담당한다.
 */
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    let modal = null;
    let el = null;
    let previousBodyOverflow = '';

    function createModalDom() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<div class="common-people-modal-backdrop note-write-share-modal moyo-share-modal" id="commonPeopleModal" data-share-mode="share" hidden>
            <div class="note-write-share-backdrop" data-common-people-close></div>
            <section class="common-people-modal note-write-share-panel moyo-share-panel" role="dialog" aria-modal="true" aria-labelledby="commonPeopleModalTitle">
                <div class="common-people-modal-header note-write-share-modal-head moyo-share-head">
                    <div>
                        <h3 id="commonPeopleModalTitle">사람 목록</h3>
                        <p class="common-people-modal-description" id="commonPeopleModalDescription" hidden></p>
                    </div>
                    <button type="button" class="common-people-modal-close note-write-share-close moyo-share-close" id="commonPeopleModalCloseButton" aria-label="닫기">×</button>
                </div>
                <div class="common-people-modal-search note-write-share-toolbar">
                    <input type="text" id="commonPeopleModalSearchInput" class="note-write-share-input" autocomplete="off" placeholder="검색">
                </div>
                <div class="note-write-share-body note-write-share-body-simple note-write-share-body-feed">
                    <div>
                        <div class="common-people-modal-list-label note-write-share-subtitle" id="commonPeopleModalListLabel">받는 대상</div>
                        <span class="common-people-modal-count" id="commonPeopleModalCount" hidden>0</span>
                        <div class="common-people-modal-body note-write-share-list" id="commonPeopleModalList" role="listbox" aria-label="사람 목록"></div>
                    </div>
                    <div class="common-people-modal-selected-wrap" id="commonPeopleModalSelected">
                        <div class="common-people-modal-selected-head note-write-share-subtitle">
                            선택 대상 <span id="commonPeopleModalSelectedCount">(0)</span>
                        </div>
                        <div class="common-people-modal-selected-list note-write-share-selected note-share-chip-list" id="commonPeopleModalSelectedList">
                            <span class="common-people-modal-selected-empty">아직 선택된 대상이 없습니다.</span>
                        </div>
                    </div>
                </div>
                <div class="common-people-modal-footer note-write-share-modal-actions" id="commonPeopleModalFooter">
                    <div class="common-people-modal-footer-left" hidden>
                        <span id="commonPeopleModalSummary">선택 없음</span>
                        <a href="#" id="commonPeopleModalManageLink" hidden>관리 화면으로 이동</a>
                    </div>
                    <div class="common-people-modal-actions">
                        <button type="button" class="common-people-modal-secondary note-soft-btn" id="commonPeopleModalCancelButton" hidden>취소</button>
                        <button type="button" class="common-people-modal-primary note-gradient-btn" id="commonPeopleModalConfirmButton">확인</button>
                    </div>
                </div>
            </section>
        </div>`;
        const created = wrapper.firstElementChild;
        if (!created) return null;
        document.body.appendChild(created);
        return created;
    }

    function ensureDom() {
        modal = $('commonPeopleModal') || createModalDom();
        if (!modal) return false;

        // Older JSP fragments did not include the multi-select summary block.
        // Keep the common modal self-healing so the same layout is guaranteed.
        if (!$('commonPeopleModalSelected')) {
            const footer = $('commonPeopleModalFooter');
            if (footer) {
                const selected = document.createElement('div');
                selected.className = 'common-people-modal-selected-wrap';
                selected.id = 'commonPeopleModalSelected';
                selected.innerHTML = `<div class="common-people-modal-selected-head note-write-share-subtitle">선택 대상 <span id="commonPeopleModalSelectedCount">(0)</span></div>
                <div class="common-people-modal-selected-list note-write-share-selected note-share-chip-list" id="commonPeopleModalSelectedList">
                    <span class="common-people-modal-selected-empty">아직 선택된 대상이 없습니다.</span>
                </div>`;
                footer.before(selected);
            }
        }

        el = {
            title: $('commonPeopleModalTitle'),
            count: $('commonPeopleModalCount'),
            listMeta: $('commonPeopleModalListMeta'),
            listLabel: $('commonPeopleModalListLabel'),
            description: $('commonPeopleModalDescription'),
            search: $('commonPeopleModalSearchInput'),
            list: $('commonPeopleModalList'),
            selectedWrap: $('commonPeopleModalSelected'),
            selectedCount: $('commonPeopleModalSelectedCount'),
            selectedList: $('commonPeopleModalSelectedList'),
            summary: $('commonPeopleModalSummary'),
            manage: $('commonPeopleModalManageLink'),
            footer: $('commonPeopleModalFooter'),
            actions: modal.querySelector('.common-people-modal-actions'),
            confirm: $('commonPeopleModalConfirmButton'),
            cancel: $('commonPeopleModalCancelButton'),
            close: $('commonPeopleModalCloseButton')
        };
        return !!(el.title && el.search && el.list && el.footer && el.confirm && el.cancel && el.close);
    }

    const state = {
        people: [],
        filtered: [],
        renderedCount: 0,
        pageSize: 20,
        selected: new Set(),
        selectedPeople: [],
        mode: 'SELECT_SINGLE',
        instantSelect: false,
        profileList: false,
        keepOpenOnProfile: false,
        loading: false,
        onSearch: null,
        searchDelay: 300,
        searchMinLength: 0,
        searchTimer: null,
        searchRequestId: 0,
        normalizer: normalizePerson,
        onSelect: null,
        onProfile: null,
        onRowAction: null,
        renderRowAction: null,
        summaryFormatter: null,
        emptyText: '표시할 사람이 없습니다.',
        emptySubText: '이름이나 이메일로 다시 검색해보세요.',
        loadingText: '목록을 불러오는 중입니다.',
        emptySummaryText: '목록 없음',
        selectedSummaryText: '선택',
        confirmTextBase: '선택 완료'
    };

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[c]));
    }

    function pick(source, keys, fallback) {
        if (!source) return fallback;
        for (const key of keys) {
            if (source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
        }
        return fallback;
    }

    const contextPath = (() => {
        const bodyPath = document.body?.dataset?.contextPath || '';
        if (bodyPath) return bodyPath;
        const shell = document.querySelector('.profile-shell');
        const fromShell = shell?.dataset?.contextPath || '';
        if (fromShell) return fromShell;
        const meta = document.querySelector('meta[name="context-path"]');
        return meta?.content || '';
    })();

    function normalizeAssetPath(path) {
        const value = String(path == null ? '' : path).trim();
        if (!value) return '';
        if (/^(https?:|data:|blob:)/i.test(value)) return value;
        const ctx = String(contextPath || '').replace(/\/+$/, '');
        return `${ctx}/${value.replace(/^\/+/, '')}`;
    }

    function toNumber(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function normalizePerson(source) {
        const id = String(pick(source, [
            'id', 'userId', 'USER_ID', 'user_id', 'personId', 'PERSON_ID',
            'friendUserId', 'FRIEND_USER_ID', 'friend_user_id'
        ], '')).trim();
        const name = String(pick(source, [
            'name', 'userName', 'USER_NAME', 'user_name', 'displayName', 'DISPLAY_NAME'
        ], '사용자')).trim();
        const email = String(pick(source, ['email', 'EMAIL'], '')).trim();
        const profile = normalizeAssetPath(pick(source, [
            'profile', 'profileUrl', 'PROFILE_URL', 'profileImage', 'profileImageUrl', 'PROFILE_IMAGE_URL',
            'profileImagePath', 'PROFILE_IMAGE_PATH', 'profile_image_path',
            'imagePath', 'IMAGE_PATH', 'image_path',
            'croppedImagePath', 'CROPPED_IMAGE_PATH', 'cropped_image_path',
            'avatarUrl', 'AVATAR_URL', 'avatarPath', 'AVATAR_PATH'
        ], ''));
        const profileOriginal = normalizeAssetPath(pick(source, [
            'profileOriginal', 'profileOriginalImagePath', 'PROFILE_ORIGINAL_IMAGE_PATH', 'profile_original_image_path',
            'originalImagePath', 'ORIGINAL_IMAGE_PATH', 'original_image_path'
        ], ''));
        const rawAvatarType = pick(source, [
            'profileAvatarType', 'PROFILE_AVATAR_TYPE', 'profile_avatar_type', 'avatarType', 'AVATAR_TYPE'
        ], '');
        return {
            id,
            name,
            email,
            profile,
            profileOriginal,
            profileCropScale: pick(source, ['profileCropScale', 'PROFILE_CROP_SCALE', 'profile_crop_scale', 'cropScale', 'CROP_SCALE', 'crop_scale'], ''),
            profileCropX: pick(source, ['profileCropX', 'PROFILE_CROP_X', 'profile_crop_x', 'cropX', 'CROP_X', 'crop_x'], ''),
            profileCropY: pick(source, ['profileCropY', 'PROFILE_CROP_Y', 'profile_crop_y', 'cropY', 'CROP_Y', 'crop_y'], ''),
            profileAvatarType: String(rawAvatarType == null ? '' : rawAvatarType).trim().toUpperCase(),
            useAccountProfile: String(pick(source, ['useAccountProfile', 'USE_ACCOUNT_PROFILE'], '') || '').trim().toUpperCase(),
            subtitle: String(pick(source, ['subtitle', 'description'], email)).trim(),
            type: String(pick(source, ['type', 'TYPE'], '')).trim(),
            avatarIcon: String(pick(source, ['avatarIcon', 'AVATAR_ICON'], '')).trim(),
            raw: source
        };
    }

    function avatarLetter(name) {
        const chars = Array.from(String(name || '').trim());
        return esc((chars[0] || '모').toUpperCase());
    }

    function signupProfileBackgroundStyle(person) {
        const scale = toNumber(person.profileCropScale, 1.15);
        const cropX = toNumber(person.profileCropX, 0);
        const cropY = toNumber(person.profileCropY, 0);
        const ratio = 44 / 500;
        return [
            `background-image:url('${esc(person.profileOriginal)}')`,
            `background-size:${Math.max(70, scale * 100)}% auto`,
            `background-position:calc(50% + ${cropX * ratio}px) calc(50% + ${cropY * ratio}px)`,
            'background-repeat:no-repeat',
            'background-color:#fff'
        ].join(';');
    }

    function profileViewport(innerHtml, type, extraClass, style, label) {
        const styleAttr = style ? ` style="${style}"` : '';
        const labelAttr = label ? ` aria-label="${esc(label)}"` : '';
        return `<span class="common-people-modal-avatar common-profile-avatar-viewport note-write-share-avatar note-share-avatar ${extraClass || ''}" data-avatar-type="${esc(type || 'DEFAULT')}"${styleAttr}${labelAttr}>${innerHtml}</span>`;
    }

    function defaultAvatar(name, type) {
        const avatarType = type || 'DEFAULT';
        const cssType = avatarType === 'FALLBACK' ? 'fallback' : 'default';
        return profileViewport(
            `<span class="common-people-modal-avatar-letter" aria-hidden="true">${avatarLetter(name)}</span>`,
            avatarType,
            `common-profile-avatar-viewport--${cssType} note-share-avatar-default`,
            '',
            `${name} 기본 아바타`
        );
    }

    function avatar(person) {
        const name = person.name || '사용자';
        const avatarType = String(person.profileAvatarType || '').trim().toUpperCase();

        // 기본 아바타 선택이 최우선이다. 과거 프로필 이미지 경로가 남아 있어도
        // 받는 대상/선택 대상 모두 MOYO 이니셜 기본 아바타를 렌더링한다.
        if (avatarType === 'DEFAULT') {
            return defaultAvatar(name, 'DEFAULT');
        }
        if (person.profile) {
            return profileViewport(
                `<img src="${esc(person.profile)}" alt="${esc(name)}" loading="lazy" onerror="window.CommonPeopleModal?.fallbackAvatar?.(this, '${avatarLetter(name)}')">`,
                'IMAGE',
                'has-image common-profile-avatar-viewport--image',
                '',
                name
            );
        }
        if (person.profileOriginal && (avatarType === 'IMAGE' || avatarType === '')) {
            return profileViewport(
                '<canvas width="500" height="500" hidden aria-hidden="true"></canvas>',
                'IMAGE',
                'has-image common-profile-avatar-viewport--crop',
                signupProfileBackgroundStyle(person),
                name
            );
        }
        return defaultAvatar(name, avatarType === 'DEFAULT' ? 'DEFAULT' : 'FALLBACK');
    }

    function rowAction(person) {
        if (typeof state.renderRowAction !== 'function') return '';
        return String(state.renderRowAction(person, { esc }) || '');
    }

    function profileRow(person) {
        const meta = person.email || person.subtitle || '';
        const typeClass = person.type ? ` common-people-modal-row--${person.type}` : '';
        return `<div class="common-people-modal-row note-write-share-card moyo-person-picker-card note-share-type-user${typeClass}" data-person-id="${esc(person.id)}" data-profile-link="${esc(person.id)}" role="button" tabindex="0" aria-label="${esc(person.name)} 프로필 보기">
            <button type="button" class="common-people-modal-profile note-write-share-profile" aria-hidden="true" tabindex="-1">
                ${avatar(person)}
                <span class="common-people-modal-info note-write-share-main moyo-person-picker-main">
                    <strong>${esc(person.name)}</strong>
                    ${meta ? `<small>${esc(meta)}</small>` : ''}
                </span>
            </button>
            ${rowAction(person)}
        </div>`;
    }

    function selectRow(person) {
        const selected = state.selected.has(person.id);
        const meta = person.email || person.subtitle || '';
        const typeToken = String(person.type || 'USER').trim().toLowerCase() || 'user';
        const typeClass = person.type ? ` common-people-modal-row--${person.type}` : '';
        return `<div class="common-people-modal-row note-write-share-card moyo-person-picker-card note-share-type-${esc(typeToken)}${typeClass}${selected ? ' selected is-selected' : ''}" data-person-id="${esc(person.id)}" role="option" aria-selected="${selected}">
            <button type="button" class="common-people-modal-profile-link note-write-share-profile" data-select-person="${esc(person.id)}" aria-label="${esc(person.name)} 선택">
                ${avatar(person)}
                <span class="common-people-modal-info note-write-share-main moyo-person-picker-main">
                    <strong>${esc(person.name)}</strong>
                    ${meta ? `<small>${esc(meta)}</small>` : ''}
                </span>
            </button>
            ${rowAction(person)}
            <button type="button" class="common-people-modal-select-toggle" data-select-person="${esc(person.id)}" aria-label="${esc(person.name)} ${selected ? '선택 해제' : '선택'}">
                <span class="common-people-modal-check note-write-share-check moyo-person-picker-check" aria-hidden="true"></span>
            </button>
        </div>`;
    }

    function selectedChip(person) {
        return `<button type="button" class="common-people-modal-selected-chip note-share-chip moyo-person-picker-chip" data-remove-selected="${esc(person.id)}" title="${esc(person.name)} 선택 해제">
            ${avatar(person)}
            <span class="common-people-modal-selected-chip-text note-share-chip-name"><strong>${esc(person.name)}</strong></span>
            <span class="common-people-modal-selected-chip-remove" aria-hidden="true">×</span>
        </button>`;
    }

    function renderSelectedPeople() {
        if (!el.selectedWrap || !el.selectedList || !el.selectedCount) return;
        const isMulti = state.mode === 'SELECT_MULTIPLE' && !state.profileList && !state.instantSelect;
        el.selectedWrap.hidden = !isMulti;
        if (!isMulti) return;
        const selected = state.people.filter(person => state.selected.has(person.id));
        el.selectedCount.textContent = `(${selected.length})`;
        el.selectedList.innerHTML = selected.length
            ? selected.map(selectedChip).join('')
            : '<span class="common-people-modal-selected-empty">아직 선택된 대상이 없습니다.</span>';
    }

    function updateSummary() {
        if (typeof state.summaryFormatter === 'function') {
            el.summary.textContent = String(state.summaryFormatter({
                totalCount: state.people.length,
                selectedCount: state.selected.size,
                profileList: state.profileList,
                instantSelect: state.instantSelect
            }) || '');
        } else if (state.profileList || state.instantSelect) {
            el.summary.textContent = state.people.length ? `${state.people.length}명` : state.emptySummaryText;
        } else {
            el.summary.textContent = state.selected.size ? `${state.selectedSummaryText} ${state.selected.size}명` : '선택 없음';
        }
        renderSelectedPeople();
        if (el.confirm) {
            el.confirm.disabled = !state.selected.size;
            if (state.mode === 'SELECT_MULTIPLE') {
                el.confirm.textContent = state.selected.size ? `${state.selected.size}명 ${state.confirmTextBase}` : state.confirmTextBase;
            }
        }
    }


    function syncListDensityState() {
        if (!el || !el.list) return;
        const hasRows = !!el.list.querySelector('[data-person-id], .common-people-modal-row');
        el.list.classList.toggle('common-people-modal-list--has-items', hasRows);
        el.list.classList.toggle('common-people-modal-list--empty', !hasRows);
    }

    function renderList(reset) {
        if (reset) {
            state.renderedCount = 0;
            el.list.innerHTML = '';
        }
        if (state.loading) {
            el.list.innerHTML = `<div class="common-people-modal-empty"><strong>${esc(state.loadingText)}</strong><span>잠시만 기다려주세요.</span></div>`;
            updateSummary();
            return;
        }
        if (!state.filtered.length) {
            el.list.innerHTML = `<div class="common-people-modal-empty"><strong>${esc(state.emptyText)}</strong><span>${esc(state.emptySubText)}</span></div>`;
            updateSummary();
            return;
        }
        const next = state.filtered.slice(state.renderedCount, state.renderedCount + state.pageSize);
        state.renderedCount += next.length;
        el.list.insertAdjacentHTML('beforeend', next.map(person => state.profileList ? profileRow(person) : selectRow(person)).join(''));
        el.list.querySelector('[data-list-end]')?.remove();
        if (state.renderedCount < state.filtered.length) {
            el.list.insertAdjacentHTML('beforeend', '<div class="common-people-modal-loading" data-list-end>아래로 더 내려보세요.</div>');
        }
        updateSummary();
            syncListDensityState();
    }

    function replacePeople(items) {
        const sourceItems = Array.isArray(items) ? items : [];
        state.people = sourceItems.map(item => state.normalizer(item, { normalizePerson })).filter(person => person && person.id);
        state.filtered = state.people.slice();
        if (el.count && !el.count.hidden) el.count.textContent = `${state.people.length}명`;
        renderList(true);
    }

    function applySearch() {
        const rawKeyword = String(el.search.value || '').trim();
        const keyword = rawKeyword.toLowerCase();
        if (typeof state.onSearch !== 'function') {
            state.filtered = keyword
                ? state.people.filter(person => [person.name, person.email, person.subtitle].join(' ').toLowerCase().includes(keyword))
                : state.people.slice();
            renderList(true);
            return;
        }

        clearTimeout(state.searchTimer);
        if (!rawKeyword || rawKeyword.length < state.searchMinLength) {
            state.loading = false;
            state.people = [];
            state.filtered = [];
            renderList(true);
            return;
        }

        const requestId = ++state.searchRequestId;
        state.loading = true;
        renderList(true);
        state.searchTimer = window.setTimeout(() => {
            Promise.resolve(state.onSearch(rawKeyword))
                .then(items => {
                    if (requestId !== state.searchRequestId) return;
                    state.loading = false;
                    replacePeople(items);
                })
                .catch(error => {
                    if (requestId !== state.searchRequestId) return;
                    state.loading = false;
                    state.people = [];
                    state.filtered = [];
                    console.error('공통 사람 모달 검색 실패:', error);
                    renderList(true);
                });
        }, state.searchDelay);
    }

    function close() {
        if (!modal) return;
        modal.hidden = true;
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = '';
    }

    function commitSelection() {
        const selected = state.people.filter(person => state.selected.has(person.id));
        if (!selected.length) return;
        close();
        if (typeof state.onSelect === 'function') state.onSelect(state.mode === 'SELECT_MULTIPLE' ? selected : selected[0]);
    }

    function normalizeComparable(value) {
        return String(value == null ? '' : value).trim().toLowerCase();
    }

    function resolveInitialSelection(selectedIds, selectedPeople) {
        const requestedIds = new Set((Array.isArray(selectedIds) ? selectedIds : []).map(value => String(value == null ? '' : value).trim()).filter(Boolean));
        const requestedPeople = Array.isArray(selectedPeople) ? selectedPeople : [];
        const requestedEmails = new Set(requestedPeople.map(person => normalizeComparable(pick(person, ['email','EMAIL'], ''))).filter(Boolean));
        const requestedNames = new Set(requestedPeople.map(person => normalizeComparable(pick(person, ['name','USER_NAME','userName'], ''))).filter(Boolean));

        const resolved = new Set();
        state.people.forEach(person => {
            if (requestedIds.has(String(person.id))) {
                resolved.add(String(person.id));
                return;
            }
            const email = normalizeComparable(person.email);
            if (email && requestedEmails.has(email)) {
                resolved.add(String(person.id));
                return;
            }
            const name = normalizeComparable(person.name);
            if (name && requestedNames.has(name) && requestedNames.size === 1) {
                resolved.add(String(person.id));
            }
        });
        return resolved;
    }

    function open(options) {
        if (!ensureDom()) {
            throw new Error('공통 사람 모달 DOM을 생성하지 못했습니다.');
        }
        bindEvents();
        const opts = options || {};
        const requestedMode = String(opts.mode || 'SELECT_SINGLE').trim().toUpperCase();
        state.mode = requestedMode === 'MULTIPLE' || requestedMode === 'SELECT_MULTIPLE'
            ? 'SELECT_MULTIPLE'
            : (requestedMode === 'VIEW' || requestedMode === 'PROFILE'
                ? 'VIEW'
                : 'SELECT_SINGLE');
        state.instantSelect = !!opts.instantSelect;
        state.profileList = state.mode === 'VIEW' || !!opts.profileList;
        state.keepOpenOnProfile = !!opts.keepOpenOnProfile;
        state.loading = !!opts.loading;
        state.onSearch = typeof opts.onSearch === 'function' ? opts.onSearch : null;
        state.searchDelay = Number(opts.searchDelay == null ? 300 : opts.searchDelay);
        state.searchMinLength = Number(opts.searchMinLength == null ? 0 : opts.searchMinLength);
        state.searchRequestId += 1;
        clearTimeout(state.searchTimer);
        state.onSelect = opts.onSelect || null;
        state.onProfile = opts.onProfile || null;
        state.onRowAction = opts.onRowAction || null;
        state.renderRowAction = opts.renderRowAction || null;
        state.summaryFormatter = opts.summaryFormatter || null;
        state.emptyText = opts.emptyText || '표시할 사람이 없습니다.';
        state.emptySubText = opts.emptySubText || '이름이나 이메일로 다시 검색해보세요.';
        state.loadingText = opts.loadingText || '목록을 불러오는 중입니다.';
        state.emptySummaryText = opts.emptySummaryText || '목록 없음';
        state.selectedSummaryText = opts.selectedSummaryText || '선택';
        state.confirmTextBase = opts.confirmText || (state.mode === 'SELECT_MULTIPLE' ? '선택 완료' : '확인');
        state.pageSize = Number(opts.listPageSize || 20);

        const sourceItems = opts.people || [];
        const normalizer = typeof opts.normalizePerson === 'function' ? opts.normalizePerson : normalizePerson;
        state.normalizer = normalizer;
        state.people = sourceItems.map(item => normalizer(item, { normalizePerson })).filter(person => person && person.id);
        state.filtered = state.people.slice();
        state.selectedPeople = Array.isArray(opts.selectedPeople) ? opts.selectedPeople.slice() : [];
        state.selected = resolveInitialSelection(opts.selectedIds, state.selectedPeople);

        el.title.textContent = opts.title || '사람 목록';
        if (el.count) {
            el.count.hidden = !opts.showCount;
            el.count.textContent = typeof opts.countText === 'function' ? String(opts.countText(state.people.length)) : (opts.countText || `${state.people.length}명`);
        }
        if (el.listLabel) {
            const rawListLabel = opts.countLabel === false
                ? ''
                : (opts.countLabel != null ? String(opts.countLabel) : (state.profileList ? '' : '받는 대상'));
            const listLabel = rawListLabel.trim();
            el.listLabel.textContent = listLabel;
            el.listLabel.hidden = !listLabel;
        }
        if (el.listMeta) el.listMeta.hidden = true;
        if (el.description) {
            const description = String(opts.description || '').trim();
            el.description.hidden = !description;
            el.description.textContent = description;
        }
        el.search.value = '';
        el.search.placeholder = opts.searchPlaceholder || '이름 또는 이메일 검색';
        el.confirm.textContent = state.confirmTextBase;
        el.cancel.hidden = state.mode !== 'VIEW';
        el.actions.hidden = state.instantSelect || state.profileList;
        el.footer.hidden = state.instantSelect || state.profileList;

        if (opts.manageHref && el.manage) {
            el.manage.hidden = false;
            el.manage.href = opts.manageHref;
            el.manage.textContent = opts.manageText || '관리 화면으로 이동';
        } else if (el.manage) {
            el.manage.hidden = true;
            el.manage.removeAttribute('href');
        }

        modal.hidden = false;
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        el.list.setAttribute('aria-multiselectable', state.mode === 'SELECT_MULTIPLE' ? 'true' : 'false');
        modal.dataset.mode = state.mode;
        modal.dataset.shareMode = 'share';
        modal.dataset.variant = String(opts.variant || '').trim();
        modal.classList.add('moyo-share-modal');
        renderList(true);
        setTimeout(() => el.search?.focus(), 30);
    }

    function bindEvents() {
        if (!el || !modal || modal.dataset.moyoModalBound === 'true') return;
        modal.dataset.moyoModalBound = 'true';
            el.search.addEventListener('input', applySearch);
            el.list.addEventListener('scroll', () => {
                if (state.loading || state.renderedCount >= state.filtered.length) return;
                if (el.list.scrollTop + el.list.clientHeight >= el.list.scrollHeight - 80) renderList(false);
            });
            el.list.addEventListener('click', event => {
                // profileList 행 자체가 data-profile-link를 가지고 있으므로, 행 안의 액션 버튼을
                // 먼저 처리하지 않으면 액션 클릭도 프로필 클릭으로 가로채진다.
                const actionButton = event.target.closest('[data-person-action]');
                if (actionButton) {
                    const row = actionButton.closest('[data-person-id]');
                    const person = state.people.find(item => item.id === String(row?.dataset.personId || ''));
                    if (person && typeof state.onRowAction === 'function') {
                        state.onRowAction(person, actionButton.dataset.personAction, actionButton);
                    }
                    return;
                }

                const profileButton = event.target.closest('[data-profile-link]');
                if (profileButton && state.profileList) {
                    const person = state.people.find(item => item.id === String(profileButton.dataset.profileLink || ''));
                    if (person && typeof state.onProfile === 'function') {
                        if (!state.keepOpenOnProfile) close();
                        state.onProfile(person);
                    }
                    return;
                }

                const selectControl = event.target.closest('[data-select-person]');
                const button = selectControl?.closest('[data-person-id]') || event.target.closest('[data-person-id]');
                if (!button || state.profileList) return;
                if (state.profileList && event.target.closest('[data-profile-link]')) return;
                const id = String(button.dataset.personId || '');
                const person = state.people.find(item => item.id === id);
                if (!person) return;
                if (state.instantSelect) {
                    close();
                    if (typeof state.onSelect === 'function') state.onSelect(person);
                    return;
                }
                if (state.mode === 'SELECT_SINGLE') {
                    state.selected.clear();
                    state.selected.add(id);
                } else if (state.selected.has(id)) {
                    state.selected.delete(id);
                } else {
                    state.selected.add(id);
                }
                renderList(true);
            });

            el.list.addEventListener('keydown', event => {
                if (!state.profileList || (event.key !== 'Enter' && event.key !== ' ')) return;
                const row = event.target.closest('[data-profile-link][data-person-id]');
                if (!row) return;
                event.preventDefault();
                const person = state.people.find(item => item.id === String(row.dataset.profileLink || row.dataset.personId || ''));
                if (person && typeof state.onProfile === 'function') {
                    if (!state.keepOpenOnProfile) close();
                    state.onProfile(person);
                }
            });

            modal.addEventListener('click', event => {
                const remove = event.target.closest('[data-remove-selected]');
                if (remove) {
                    const id = String(remove.dataset.removeSelected || '');
                    if (id) {
                        state.selected.delete(id);
                        renderList(true);
                    }
                }
            });

            el.confirm.addEventListener('click', commitSelection);
            el.cancel.addEventListener('click', close);
            modal.querySelector('[data-common-people-close]')?.addEventListener('click', close);
            el.close.addEventListener('click', close);
            modal.addEventListener('click', event => { if (event.target === modal) close(); });
            document.addEventListener('keydown', event => {
                if (event.key !== 'Escape' || modal.hidden) return;
                const profileRoot = document.getElementById('memberProfileComponent');
                const profileModal = document.getElementById('memberProfileModal');
                const profileVisible = (profileRoot && !profileRoot.hidden)
                    || (profileModal && profileModal.style.display === 'block');
                if (profileVisible) return;
                close();
            });
    }

    function fallbackAvatar(img, letter) {
        const viewport = img?.closest?.('.common-profile-avatar-viewport, .common-people-modal-avatar');
        if (!viewport) return;
        viewport.className = 'common-people-modal-avatar signup-profile-viewport common-profile-avatar-viewport common-profile-avatar-viewport--fallback note-write-share-avatar note-share-avatar note-share-avatar-default';
        viewport.dataset.avatarType = 'FALLBACK';
        viewport.removeAttribute('style');
        viewport.innerHTML = `<canvas width="500" height="500" hidden aria-hidden="true"></canvas><span class="signup-avatar-preview">${esc(letter || '모')}</span>`;
    }

    function personAvatarHtml(source) {
        return avatar(normalizePerson(source || {}));
    }

    window.CommonPeopleModal = Object.assign(window.CommonPeopleModal || {}, {
        MODES: Object.freeze({ VIEW: 'VIEW', SELECT_SINGLE: 'SELECT_SINGLE', SELECT_MULTIPLE: 'SELECT_MULTIPLE' }),
        open, close, fallbackAvatar, normalizePerson, replacePeople, personAvatarHtml
    });
})();
