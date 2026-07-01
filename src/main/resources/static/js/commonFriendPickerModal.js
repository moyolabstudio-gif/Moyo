/**
 * 공통 친구 선택 모달
 * - 기본: 단일/다중 선택 후 확인
 * - instantSelect=true: 친구 row 클릭 즉시 onSelect 실행 후 닫힘
 * - MOYO 피드 친구 목록, 사진/노트 공유 모달에서 재사용
 */
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    const modal = $('commonFriendPickerModal');
    if (!modal) return;

    const el = {
        title: $('commonFriendPickerTitle'),
        description: $('commonFriendPickerDescription'),
        search: $('commonFriendPickerSearchInput'),
        list: $('commonFriendPickerList'),
        summary: $('commonFriendPickerSummary'),
        manage: $('commonFriendPickerManageLink'),
        actions: modal.querySelector('.common-friend-picker-actions'),
        confirm: $('commonFriendPickerConfirmButton'),
        cancel: $('commonFriendPickerCancelButton'),
        close: $('commonFriendPickerCloseButton')
    };

    const state = {
        friends: [],
        filtered: [],
        selected: new Set(),
        mode: 'single',
        instantSelect: false,
        loading: false,
        onSelect: null,
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

    function normalizeFriend(friend) {
        const id = String(pick(friend, ['id', 'userId', 'USER_ID', 'friendUserId', 'FRIEND_USER_ID'], '')).trim();
        const name = String(pick(friend, ['name', 'userName', 'USER_NAME'], '친구')).trim();
        const email = String(pick(friend, ['email', 'EMAIL'], '')).trim();
        const profile = String(pick(friend, ['profile', 'profileImage', 'profileImagePath', 'PROFILE_IMAGE_PATH'], '')).trim();
        const subtitle = String(pick(friend, ['subtitle', 'description'], email)).trim();
        const count = Number(pick(friend, ['count', 'photoCount', 'PHOTO_COUNT'], 0) || 0);
        const countLabel = String(pick(friend, ['countLabel', 'COUNT_LABEL'], '')).trim();
        const type = String(pick(friend, ['type', 'TYPE'], '')).trim();
        const avatarIcon = String(pick(friend, ['avatarIcon', 'AVATAR_ICON'], '')).trim();
        return { id, name, email, profile, subtitle, count, countLabel, type, avatarIcon, raw: friend };
    }

    function avatar(friend) {
        if (friend.avatarIcon) {
            return `<span class="common-friend-picker-avatar common-friend-picker-avatar--icon"><i class="${esc(friend.avatarIcon)}"></i></span>`;
        }
        if (friend.profile) {
            return `<span class="common-friend-picker-avatar has-image"><img src="${esc(friend.profile)}" alt="${esc(friend.name)}" loading="lazy" onerror="this.closest('.common-friend-picker-avatar').classList.remove('has-image');this.remove();"></span>`;
        }
        return `<span class="common-friend-picker-avatar">${esc((friend.name || '?').charAt(0))}</span>`;
    }

    function row(friend) {
        const selected = state.selected.has(friend.id);
        const meta = friend.email || friend.subtitle || '';
        const countLabel = friend.countLabel || `사진 ${Number(friend.count || 0)}개`;
        const typeClass = friend.type ? ` common-friend-picker-row--${friend.type}` : '';
        return `<button type="button" class="common-friend-picker-row${typeClass}${selected ? ' selected' : ''}" data-friend-id="${esc(friend.id)}" role="option" aria-selected="${selected}">
            ${avatar(friend)}
            <span class="common-friend-picker-info">
                <strong>${esc(friend.name)}</strong>
                ${meta ? `<small>${esc(meta)}</small>` : ''}
            </span>
            ${state.instantSelect ? `<span class="common-friend-picker-count">${esc(countLabel)}</span>` : '<span class="common-friend-picker-check"><i class="fa-solid fa-check"></i></span>'}
        </button>`;
    }

    function updateSummary() {
        const selectedCount = state.selected.size;
        if (state.instantSelect) {
            el.summary.textContent = state.friends.length ? `${state.friends.length}명` : '친구 없음';
        } else {
            el.summary.textContent = selectedCount ? `선택 ${selectedCount}명` : '선택 없음';
        }
        if (el.confirm) el.confirm.disabled = !selectedCount;
    }

    function render() {
        if (state.loading) {
            el.list.innerHTML = `<div class="common-friend-picker-empty"><i class="fa-solid fa-spinner fa-spin"></i><strong>${esc(state.loadingText)}</strong><span>잠시만 기다려주세요.</span></div>`;
            updateSummary();
            return;
        }
        if (!state.filtered.length) {
            el.list.innerHTML = `<div class="common-friend-picker-empty"><i class="fa-regular fa-face-smile"></i><strong>${esc(state.emptyText)}</strong><span>${esc(state.emptySubText)}</span></div>`;
            updateSummary();
            return;
        }
        el.list.innerHTML = state.filtered.map(row).join('');
        updateSummary();
    }

    function applySearch() {
        const keyword = String(el.search.value || '').trim().toLowerCase();
        state.filtered = keyword
            ? state.friends.filter(friend => [friend.name, friend.email, friend.subtitle].join(' ').toLowerCase().includes(keyword))
            : state.friends.slice();
        render();
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
        state.loading = !!opts.loading;
        state.onSelect = opts.onSelect || null;
        state.emptyText = opts.emptyText || '표시할 친구가 없습니다.';
        state.emptySubText = opts.emptySubText || '친구 이름이나 이메일로 다시 검색해보세요.';
        state.loadingText = opts.loadingText || '친구 목록을 불러오는 중입니다.';
        state.friends = (opts.friends || []).map(normalizeFriend).filter(friend => friend.id);
        state.filtered = state.friends.slice();
        state.selected = new Set((opts.selectedIds || []).map(String));

        el.title.textContent = opts.title || '친구 선택';
        el.description.textContent = opts.description || '친구를 검색하고 선택하세요.';
        el.search.value = '';
        el.search.placeholder = opts.searchPlaceholder || '친구 이름 또는 이메일 검색';
        el.confirm.textContent = opts.confirmText || '확인';
        el.actions.hidden = state.instantSelect;

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
        render();
        setTimeout(() => el.search && el.search.focus(), 30);
    }

    el.search.addEventListener('input', applySearch);
    el.list.addEventListener('click', event => {
        const button = event.target.closest('[data-friend-id]');
        if (!button) return;
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
        render();
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

    window.CommonFriendPickerModal = { open, close };
})();
