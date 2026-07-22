/**
 * 공통 친구/프로필 모달
 * - 기본: 단일/다중 선택 후 확인
 * - profileList=true: 인스타식 고정 모달 + 리스트 스크롤 + 프로필 이동/친구 액션
 * - listPageSize로 클라이언트 무한 스크롤 단위 조정
 */
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    const modal = $('commonFriendPickerModal');
    if (!modal) return;

    const el = {
        title: $('commonFriendPickerTitle'),
        search: $('commonFriendPickerSearchInput'),
        list: $('commonFriendPickerList'),
        summary: $('commonFriendPickerSummary'),
        manage: $('commonFriendPickerManageLink'),
        footer: $('commonFriendPickerFooter'),
        actions: modal.querySelector('.common-friend-picker-actions'),
        confirm: $('commonFriendPickerConfirmButton'),
        cancel: $('commonFriendPickerCancelButton'),
        close: $('commonFriendPickerCloseButton')
    };

    const state = {
        friends: [],
        filtered: [],
        renderedCount: 0,
        pageSize: 20,
        selected: new Set(),
        mode: 'single',
        instantSelect: false,
        profileList: false,
        loading: false,
        onSelect: null,
        onProfile: null,
        onRelationAction: null,
        emptyText: '표시할 친구가 없습니다.',
        emptySubText: '친구 이름이나 이메일로 다시 검색해보세요.',
        loadingText: '친구 목록을 불러오는 중입니다.'
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
        const clean = value.replace(/^\/+/,'');
        return `${ctx}/${clean}`;
    }

    function toNumber(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function normalizeFriend(friend) {
        const id = String(pick(friend, [
            'id', 'userId', 'USER_ID', 'user_id', 'friendUserId', 'FRIEND_USER_ID', 'friend_user_id'
        ], '')).trim();
        const name = String(pick(friend, [
            'name', 'userName', 'USER_NAME', 'user_name', 'displayName', 'DISPLAY_NAME'
        ], '친구')).trim();
        const email = String(pick(friend, ['email', 'EMAIL'], '')).trim();

        const profile = normalizeAssetPath(pick(friend, [
            'profile', 'profileUrl', 'PROFILE_URL', 'profileImage', 'profileImageUrl', 'PROFILE_IMAGE_URL',
            'profileImagePath', 'PROFILE_IMAGE_PATH', 'profile_image_path',
            'croppedImagePath', 'CROPPED_IMAGE_PATH', 'cropped_image_path',
            'avatarUrl', 'AVATAR_URL', 'avatarPath', 'AVATAR_PATH'
        ], ''));

        const profileOriginal = normalizeAssetPath(pick(friend, [
            'profileOriginal', 'profileOriginalImagePath', 'PROFILE_ORIGINAL_IMAGE_PATH', 'profile_original_image_path',
            'originalImagePath', 'ORIGINAL_IMAGE_PATH', 'original_image_path'
        ], ''));
        const profileCropScale = pick(friend, [
            'profileCropScale', 'PROFILE_CROP_SCALE', 'profile_crop_scale', 'cropScale', 'CROP_SCALE', 'crop_scale'
        ], '');
        const profileCropX = pick(friend, [
            'profileCropX', 'PROFILE_CROP_X', 'profile_crop_x', 'cropX', 'CROP_X', 'crop_x'
        ], '');
        const profileCropY = pick(friend, [
            'profileCropY', 'PROFILE_CROP_Y', 'profile_crop_y', 'cropY', 'CROP_Y', 'crop_y'
        ], '');
        const hasProfileImage = Boolean(profile || profileOriginal);
        const rawAvatarType = pick(friend, [
            'profileAvatarType', 'PROFILE_AVATAR_TYPE', 'profile_avatar_type', 'avatarType', 'AVATAR_TYPE'
        ], '');
        const profileAvatarType = String(rawAvatarType == null ? '' : rawAvatarType).trim().toUpperCase();
        const subtitle = String(pick(friend, ['subtitle', 'description'], email)).trim();
        const type = String(pick(friend, ['type', 'TYPE'], '')).trim();
        const avatarIcon = String(pick(friend, ['avatarIcon', 'AVATAR_ICON'], '')).trim();
        const relationStatus = String(pick(friend, ['relationStatus', 'RELATION_STATUS', 'status', 'STATUS'], 'NONE')).trim() || 'NONE';
        const direction = String(pick(friend, ['direction', 'DIRECTION'], 'NONE')).trim() || 'NONE';
        const friendId = String(pick(friend, ['friendId', 'FRIEND_ID', 'friend_id'], '')).trim();
        return {
            id, name, email, profile, profileOriginal, profileCropScale, profileCropX, profileCropY,
            profileAvatarType, subtitle, type, avatarIcon, relationStatus, direction, friendId, raw: friend
        };
    }

    function avatarLetter(name) {
        const chars = Array.from(String(name || '').trim());
        return esc((chars[0] || '모').toUpperCase());
    }

    function signupProfileBackgroundStyle(friend) {
        const scale = toNumber(friend.profileCropScale, 1.15);
        const cropX = toNumber(friend.profileCropX, 0);
        const cropY = toNumber(friend.profileCropY, 0);
        // 회원가입 프로필 미리보기는 500px canvas 기준으로 crop 좌표를 저장한다.
        // 공통모달 썸네일은 같은 계산식을 크기만 줄여 적용한다.
        const ratio = 44 / 500;
        return [
            `background-image:url('${esc(friend.profileOriginal)}')`,
            `background-size:${Math.max(70, scale * 100)}% auto`,
            `background-position:calc(50% + ${cropX * ratio}px) calc(50% + ${cropY * ratio}px)`,
            'background-repeat:no-repeat',
            'background-color:#fff'
        ].join(';');
    }

    function profileViewport(innerHtml, type, extraClass, style, label) {
        const styleAttr = style ? ` style="${style}"` : '';
        const labelAttr = label ? ` aria-label="${esc(label)}"` : '';
        return `<span class="common-friend-picker-avatar signup-profile-viewport common-profile-avatar-viewport ${extraClass || ''}" data-avatar-type="${esc(type || 'DEFAULT')}"${styleAttr}${labelAttr}>${innerHtml}</span>`;
    }

    function signupDefaultAvatar(name) {
        // 회원가입 프로필 생성 화면의 기본 아바타 구조를 그대로 재사용한다.
        // DEFAULT는 fallback이 아니라 profileAvatarType에 저장된 정상 아바타 타입이다.
        return profileViewport(
            `<canvas width="500" height="500" hidden aria-hidden="true"></canvas><span class="signup-avatar-preview">${avatarLetter(name)}</span>`,
            'DEFAULT',
            'common-profile-avatar-viewport--default',
            '',
            `${name} 기본 아바타`
        );
    }

    function fallbackAvatar(name) {
        // DB 제약상 일반 사용자는 DEFAULT 이상을 가진다. 이 분기는 데이터가 깨졌을 때만 쓰는 최후 예외다.
        return profileViewport(
            `<canvas width="500" height="500" hidden aria-hidden="true"></canvas><span class="signup-avatar-preview">${avatarLetter(name)}</span>`,
            'FALLBACK',
            'common-profile-avatar-viewport--fallback',
            '',
            `${name} 기본 아바타`
        );
    }

    function avatar(friend) {
        const name = friend.name || '친구';
        const avatarType = String(friend.profileAvatarType || '').trim().toUpperCase();

        // 회원가입 프로필 생성 기준 그대로:
        // 1) profileImagePath: 저장된 최종 프로필 이미지 사용
        // 2) profileOriginalImagePath + crop 값: 회원가입 crop 계산식으로 배경 표시
        // 3) PROFILE_AVATAR_TYPE=DEFAULT: 회원가입 기본 아바타 DOM/CSS 구조 사용
        // 4) 예외 데이터만 fallback
        if (friend.profile) {
            return profileViewport(
                `<img src="${esc(friend.profile)}" alt="${esc(name)}" loading="lazy" onerror="window.CommonFriendPickerModal?.fallbackAvatar?.(this, '${avatarLetter(name)}')">`,
                'IMAGE',
                'has-image common-profile-avatar-viewport--image',
                '',
                name
            );
        }

        if (friend.profileOriginal && (avatarType === 'IMAGE' || avatarType === '')) {
            return profileViewport(
                `<canvas width="500" height="500" hidden aria-hidden="true"></canvas>`,
                'IMAGE',
                'has-image common-profile-avatar-viewport--crop',
                signupProfileBackgroundStyle(friend),
                name
            );
        }

        if (avatarType === 'DEFAULT') {
            return signupDefaultAvatar(name);
        }

        return fallbackAvatar(name);
    }

    function relationAction(friend) {
        const status = friend.relationStatus || 'NONE';
        const direction = friend.direction || 'NONE';
        if (status === 'SELF') {
            return `<span class="common-friend-picker-status is-self" aria-label="내 계정">나</span>`;
        }
        if (status === 'ACCEPTED') {
            return `<span class="common-friend-picker-status is-friend" aria-label="이미 친구">친구</span>`;
        }
        if (status === 'PENDING' && direction === 'SENT') {
            return `<span class="common-friend-picker-status is-muted" aria-label="친구 요청을 보냈습니다">요청 보냄</span>`;
        }
        if (status === 'PENDING' && direction === 'RECEIVED') {
            return `<button type="button" class="common-friend-picker-action" data-friend-action-button="accept">수락</button>`;
        }
        return `<button type="button" class="common-friend-picker-action" data-friend-action-button="request">친구 요청</button>`;
    }

    function profileRow(friend) {
        const meta = friend.email || friend.subtitle || '';
        const typeClass = friend.type ? ` common-friend-picker-row--${friend.type}` : '';
        return `<div class="common-friend-picker-row${typeClass}" data-friend-id="${esc(friend.id)}" role="option">
            <button type="button" class="common-friend-picker-profile" data-profile-link="${esc(friend.id)}" aria-label="${esc(friend.name)} 프로필 보기">
                ${avatar(friend)}
                <span class="common-friend-picker-info">
                    <strong>${esc(friend.name)}</strong>
                    ${meta ? `<small>${esc(meta)}</small>` : ''}
                </span>
            </button>
            ${relationAction(friend)}
        </div>`;
    }

    function selectRow(friend) {
        const selected = state.selected.has(friend.id);
        const meta = friend.email || friend.subtitle || '';
        const typeClass = friend.type ? ` common-friend-picker-row--${friend.type}` : '';
        return `<button type="button" class="common-friend-picker-row${typeClass}${selected ? ' selected' : ''}" data-friend-id="${esc(friend.id)}" role="option" aria-selected="${selected}">
            ${avatar(friend)}
            <span class="common-friend-picker-info">
                <strong>${esc(friend.name)}</strong>
                ${meta ? `<small>${esc(meta)}</small>` : ''}
            </span>
            <span class="common-friend-picker-check">✓</span>
        </button>`;
    }

    function updateSummary() {
        const selectedCount = state.selected.size;
        if (state.profileList || state.instantSelect) {
            el.summary.textContent = state.friends.length ? `${state.friends.length}명` : '친구 없음';
        } else {
            el.summary.textContent = selectedCount ? `선택 ${selectedCount}명` : '선택 없음';
        }
        if (el.confirm) el.confirm.disabled = !selectedCount;
    }

    function renderList(reset) {
        if (reset) {
            state.renderedCount = 0;
            el.list.innerHTML = '';
        }

        if (state.loading) {
            el.list.innerHTML = `<div class="common-friend-picker-empty"><strong>${esc(state.loadingText)}</strong><span>잠시만 기다려주세요.</span></div>`;
            updateSummary();
            return;
        }

        if (!state.filtered.length) {
            el.list.innerHTML = `<div class="common-friend-picker-empty"><strong>${esc(state.emptyText)}</strong><span>${esc(state.emptySubText)}</span></div>`;
            updateSummary();
            return;
        }

        const next = state.filtered.slice(state.renderedCount, state.renderedCount + state.pageSize);
        state.renderedCount += next.length;
        const rows = next.map(friend => state.profileList ? profileRow(friend) : selectRow(friend)).join('');
        el.list.insertAdjacentHTML('beforeend', rows);

        const oldEnd = el.list.querySelector('[data-list-end]');
        if (oldEnd) oldEnd.remove();
        if (state.renderedCount < state.filtered.length) {
            el.list.insertAdjacentHTML('beforeend', '<div class="common-friend-picker-loading" data-list-end>아래로 더 내려보세요.</div>');
        }
        updateSummary();
    }

    function applySearch() {
        const keyword = String(el.search.value || '').trim().toLowerCase();
        state.filtered = keyword
            ? state.friends.filter(friend => [friend.name, friend.email, friend.subtitle].join(' ').toLowerCase().includes(keyword))
            : state.friends.slice();
        renderList(true);
    }

    function close() {
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    function commitSelection() {
        const selected = state.friends.filter(friend => state.selected.has(friend.id));
        if (!selected.length) return;
        close();
        if (typeof state.onSelect === 'function') {
            state.onSelect(state.mode === 'multiple' ? selected : selected[0]);
        }
    }

    function open(options) {
        const opts = options || {};
        state.mode = opts.mode === 'multiple' ? 'multiple' : 'single';
        state.instantSelect = !!opts.instantSelect;
        state.profileList = !!opts.profileList;
        state.loading = !!opts.loading;
        state.onSelect = opts.onSelect || null;
        state.onProfile = opts.onProfile || opts.onSelect || null;
        state.onRelationAction = opts.onRelationAction || null;
        state.emptyText = opts.emptyText || '표시할 친구가 없습니다.';
        state.emptySubText = opts.emptySubText || '친구 이름이나 이메일로 다시 검색해보세요.';
        state.loadingText = opts.loadingText || '친구 목록을 불러오는 중입니다.';
        state.pageSize = Number(opts.listPageSize || 20);
        state.friends = (opts.friends || []).map(normalizeFriend).filter(friend => friend.id);
        state.filtered = state.friends.slice();
        state.selected = new Set((opts.selectedIds || []).map(String));

        el.title.textContent = opts.title || '친구 목록';
        el.search.value = '';
        el.search.placeholder = opts.searchPlaceholder || '검색';
        el.confirm.textContent = opts.confirmText || '확인';
        el.actions.hidden = state.instantSelect || state.profileList;
        el.footer.hidden = state.instantSelect || state.profileList;

        if (opts.manageHref && el.manage) {
            el.manage.hidden = false;
            el.manage.href = opts.manageHref;
            el.manage.textContent = opts.manageText || '친구 관리로 이동';
        } else if (el.manage) {
            el.manage.hidden = true;
            el.manage.removeAttribute('href');
        }

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        renderList(true);
        setTimeout(() => el.search && el.search.focus(), 30);
    }

    el.search.addEventListener('input', applySearch);
    el.list.addEventListener('scroll', () => {
        if (state.loading || state.renderedCount >= state.filtered.length) return;
        const nearBottom = el.list.scrollTop + el.list.clientHeight >= el.list.scrollHeight - 80;
        if (nearBottom) renderList(false);
    });
    el.list.addEventListener('click', event => {
        const profileButton = event.target.closest('[data-profile-link]');
        if (profileButton) {
            const id = String(profileButton.dataset.profileLink || '');
            const friend = state.friends.find(item => item.id === id);
            if (friend && typeof state.onProfile === 'function') {
                close();
                state.onProfile(friend);
            }
            return;
        }

        const actionButton = event.target.closest('[data-friend-action-button]');
        if (actionButton) {
            const row = actionButton.closest('[data-friend-id]');
            const friend = state.friends.find(item => item.id === String(row?.dataset.friendId || ''));
            if (friend && typeof state.onRelationAction === 'function') {
                state.onRelationAction(friend, actionButton.dataset.friendActionButton, actionButton);
            }
            return;
        }

        const button = event.target.closest('[data-friend-id]');
        if (!button || state.profileList) return;
        const id = String(button.dataset.friendId || '');
        const friend = state.friends.find(item => item.id === id);
        if (!friend) return;

        if (state.instantSelect) {
            close();
            if (typeof state.onSelect === 'function') state.onSelect(friend);
            return;
        }

        if (state.mode === 'single') {
            state.selected.clear();
            state.selected.add(id);
        } else if (state.selected.has(id)) {
            state.selected.delete(id);
        } else {
            state.selected.add(id);
        }
        renderList(true);
    });

    el.confirm.addEventListener('click', commitSelection);
    el.cancel.addEventListener('click', close);
    el.close.addEventListener('click', close);
    modal.addEventListener('click', event => {
        if (event.target === modal) close();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) close();
    });

    function fallbackAvatar(img, letter) {
        const viewport = img?.closest?.('.common-profile-avatar-viewport, .common-friend-picker-avatar');
        if (!viewport) return;
        viewport.className = 'common-friend-picker-avatar signup-profile-viewport common-profile-avatar-viewport common-profile-avatar-viewport--fallback';
        viewport.dataset.avatarType = 'FALLBACK';
        viewport.removeAttribute('style');
        viewport.innerHTML = `<canvas width="500" height="500" hidden aria-hidden="true"></canvas><span class="signup-avatar-preview">${esc(letter || '모')}</span>`;
    }

    window.CommonFriendPickerModal = { open, close, fallbackAvatar };
})();
