(function () {
    'use strict';

    const $ = (selector) => document.querySelector(selector);
    const contextPath = String(window.MOYO_CONTEXT_PATH || '').replace(/\/$/, '');
    const appUrl = (path) => `${contextPath}${path}`;

    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        loadAll();
    });

    function bindEvents() {
        $('#openFriendAddModalButton')?.addEventListener('click', openFriendAddModal);
        document.querySelectorAll('[data-friend-refresh]').forEach((button) => button.addEventListener('click', loadAll));
        document.querySelectorAll('[data-friend-request-tab]').forEach((button) => {
            button.addEventListener('click', () => activateRequestTab(button.dataset.friendRequestTab));
        });
        document.addEventListener('click', (event) => {
            const toggle = event.target.closest('[data-friend-more]');
            if (toggle) {
                event.preventDefault();
                event.stopPropagation();
                const row = toggle.closest('.friend-row');
                const menu = row?.querySelector('.friend-row-menu');
                const opening = menu && !menu.classList.contains('open');
                closeFriendMenus();
                if (opening) {
                    menu.classList.add('open');
                    toggle.setAttribute('aria-expanded', 'true');
                }
                return;
            }
            if (!event.target.closest('.friend-row-menu')) closeFriendMenus();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeFriendMenus();
        });
    }

    function loadAll() {
        loadFriends();
        loadRequests();
        loadRecommendations();
    }

    function normalizeFriendSearchPerson(source, helpers) {
        const person = helpers.normalizePerson(source);
        person.id = String(source.userId || source.USER_ID || person.id || '');
        person.relationStatus = String(source.relationStatus || 'NONE').toUpperCase();
        person.direction = String(source.direction || 'NONE').toUpperCase();
        person.raw = source;
        return person;
    }

    function friendSearchAction(person) {
        if (person.relationStatus === 'ACCEPTED') return '<span class="common-people-modal-status is-friend">친구</span>';
        if (person.relationStatus === 'PENDING' && person.direction === 'SENT') return '<span class="common-people-modal-status is-muted">요청 중</span>';
        if (person.relationStatus === 'PENDING' && person.direction === 'RECEIVED') return '<span class="common-people-modal-status is-muted">받은 요청</span>';
        if (person.relationStatus === 'BLOCKED') return '<span class="common-people-modal-status is-muted">차단됨</span>';
        return '<button type="button" class="common-people-modal-action" data-person-action="request">친구 요청</button>';
    }

    function openFriendAddModal() {
        if (window.CommonFriendAdapter?.openAdd) {
            window.CommonFriendAdapter.openAdd({ contextPath, onUpdated: loadAll });
            return;
        }
        if (!window.CommonPeopleModal?.open) return;
        window.CommonPeopleModal.open({
            title: '친구 찾기',
            people: [],
            profileList: true,
            showCount: false,
            searchPlaceholder: '이름 또는 이메일로 검색',
            searchMinLength: 2,
            searchDelay: 300,
            loadingText: '친구를 검색하는 중입니다.',
            emptyText: '이름이나 이메일로 친구를 검색하세요.',
            emptySubText: '2글자 이상 입력하면 검색 결과가 표시됩니다.',
            normalizePerson: normalizeFriendSearchPerson,
            renderRowAction: friendSearchAction,
            onSearch: (keyword) => fetchJson(appUrl('/friends/api/search?keyword=' + encodeURIComponent(keyword))).then((data) => data.users || []),
            onProfile: (person) => { window.location.href = appUrl('/users/profile?userId=' + encodeURIComponent(person.id)); },
            onRowAction: (person, action, button) => {
                if (action !== 'request' || !button) return;
                requestFriend(person.id, button);
            }
        });
    }

    function loadFriends() {
        fetchJson(appUrl('/friends/api/list'))
            .then((data) => renderFriends(data.friends || []))
            .catch(() => renderMessage('#friendList', '친구 목록을 불러오지 못했습니다.'));
    }

    function loadRequests() {
        fetchJson(appUrl('/friends/api/requests'))
            .then((data) => {
                renderReceived(data.received || []);
                renderSent(data.sent || []);
                const pendingCount = Number(data.pendingCount || 0);
                const sentCount = (data.sent || []).length;
                if ($('#friendPendingBadge')) $('#friendPendingBadge').textContent = pendingCount;
                if ($('#friendHeroPendingCount')) $('#friendHeroPendingCount').textContent = pendingCount;
                if ($('#friendSentBadge')) $('#friendSentBadge').textContent = sentCount;
            })
            .catch(() => {
                renderMessage('#friendReceivedList', '받은 요청을 불러오지 못했습니다.');
                renderMessage('#friendSentList', '보낸 요청을 불러오지 못했습니다.');
            });
    }

    function loadRecommendations() {
        fetchJson(appUrl('/friends/api/recommendations'))
            .then((data) => renderRecommendations(data.recommendations || []))
            .catch(() => renderMessage('#friendRecommendationList', '추천 친구를 불러오지 못했습니다.'));
    }

    function renderFriends(friends) {
        const box = $('#friendList');
        if (!box) return;
        if ($('#friendTotalCount')) $('#friendTotalCount').textContent = friends.length;
        if (!friends.length) {
            box.innerHTML = empty('아직 친구가 없습니다.', '친구 찾기에서 이름이나 이메일로 첫 친구를 추가해보세요.');
            return;
        }
        box.innerHTML = friends.map(friend => friendRow(friend)).join('');
        hydrateAvatars(box);
        box.querySelectorAll('[data-delete-friend]').forEach((button) => {
            button.addEventListener('click', () => {
                closeFriendMenus();
                if (confirm('이 친구와의 연결을 해제할까요?')) {
                    post(appUrl('/friends/api/delete'), { friendId: button.dataset.deleteFriend }).then(afterAction);
                }
            });
        });
    }

    function renderRecommendations(items) {
        const box = $('#friendRecommendationList');
        if (!box) return;
        if (!items.length) {
            box.innerHTML = empty('지금 추천할 사람이 없습니다.', '공통 친구가 생기면 여기에 추천됩니다.');
            return;
        }
        box.innerHTML = items.map((user) => {
            const name = escapeHtml(user.userName || '이름 없음');
            const mutualCount = Number(user.mutualFriendCount || 0);
            const profileUrl = appUrl('/users/profile?userId=' + encodeURIComponent(user.userId || ''));
            return `
                <div class="friend-recommend-item">
                    <a class="friend-recommend-profile" href="${profileUrl}" aria-label="${name} 프로필 보기">
                        ${avatarHtml(user, 'friend-recommend-avatar')}
                        <div class="friend-recommend-copy">
                            <strong>${name}</strong>
                            <span>공통 친구 ${mutualCount}명</span>
                        </div>
                    </a>
                    <button type="button" class="friend-request-compact" data-recommend-request="${escapeHtml(user.userId)}">친구 요청</button>
                </div>`;
        }).join('');
        hydrateAvatars(box);
        box.querySelectorAll('[data-recommend-request]').forEach((button) => {
            button.addEventListener('click', () => requestFriend(button.dataset.recommendRequest, button));
        });
    }

    function renderReceived(requests) {
        const box = $('#friendReceivedList');
        if (!box) return;
        if (!requests.length) {
            box.innerHTML = empty('받은 요청이 없습니다.');
            return;
        }
        box.innerHTML = requests.map((request) => compactRequestRow(request, `
            <button type="button" data-accept-friend="${escapeHtml(request.friendId)}">수락</button>
            <button type="button" class="ghost" data-reject-friend="${escapeHtml(request.friendId)}">거절</button>
        `)).join('');
        hydrateAvatars(box);
        box.querySelectorAll('[data-accept-friend]').forEach((button) => button.addEventListener('click', () => post(appUrl('/friends/api/accept'), { friendId: button.dataset.acceptFriend }).then(afterAction)));
        box.querySelectorAll('[data-reject-friend]').forEach((button) => button.addEventListener('click', () => post(appUrl('/friends/api/reject'), { friendId: button.dataset.rejectFriend }).then(afterAction)));
    }

    function renderSent(requests) {
        const box = $('#friendSentList');
        if (!box) return;
        if (!requests.length) {
            box.innerHTML = empty('보낸 요청이 없습니다.');
            return;
        }
        box.innerHTML = requests.map((request) => compactRequestRow(request, `<button type="button" class="ghost" data-cancel-friend="${escapeHtml(request.friendId)}">요청 취소</button>`)).join('');
        hydrateAvatars(box);
        box.querySelectorAll('[data-cancel-friend]').forEach((button) => button.addEventListener('click', () => post(appUrl('/friends/api/cancel'), { friendId: button.dataset.cancelFriend }).then(afterAction)));
    }

    function friendRow(user) {
        const name = escapeHtml(user.userName || user.email || '이름 없음');
        const email = escapeHtml(user.email || '');
        const profileUrl = appUrl('/users/profile?userId=' + encodeURIComponent(user.userId || ''));
        return `
            <div class="friend-row">
                <a class="friend-profile-link" href="${profileUrl}" aria-label="${name} 프로필 보기">
                    ${avatarHtml(user, 'friend-avatar')}
                    <div class="friend-info">
                        <strong>${name}</strong>
                        ${email ? `<span>${email}</span>` : ''}
                    </div>
                </a>
                <div class="friend-row-tools">
                    <button type="button" class="friend-more-btn" data-friend-more aria-haspopup="menu" aria-expanded="false" aria-label="${name} 친구 메뉴">⋮</button>
                    <div class="friend-row-menu" role="menu">
                        <a href="${profileUrl}" role="menuitem">프로필 보기</a>
                        <button type="button" class="is-danger" data-delete-friend="${escapeHtml(user.friendId)}" role="menuitem">친구 해제</button>
                    </div>
                </div>
            </div>`;
    }

    function compactRequestRow(user, actionHtml) {
        const name = escapeHtml(user.userName || user.email || '이름 없음');
        const profileUrl = appUrl('/users/profile?userId=' + encodeURIComponent(user.userId || ''));
        return `
            <div class="friend-row friend-request-row">
                <a class="friend-profile-link" href="${profileUrl}" aria-label="${name} 프로필 보기">
                    ${avatarHtml(user, 'friend-avatar')}
                    <div class="friend-info"><strong>${name}</strong></div>
                </a>
                <div class="friend-actions">${actionHtml}</div>
            </div>`;
    }

    function avatarHtml(user, className) {
        const name = escapeHtml(user.userName || user.email || '?');
        const initial = escapeHtml(String(user.userName || user.email || '?').substring(0, 1).toUpperCase());
        const path = user.profileImagePath || user.profileOriginalImagePath || '';
        return `<div class="${className}" data-friend-avatar data-profile-image="${escapeHtml(path)}" data-profile-name="${name}">${initial}</div>`;
    }

    function hydrateAvatars(scope) {
        if (!scope) return;
        const utils = window.MoyoProfileUtils;
        scope.querySelectorAll('[data-friend-avatar]').forEach((avatar) => {
            const rawPath = avatar.dataset.profileImage || '';
            const name = avatar.dataset.profileName || '?';
            const src = utils?.resolvePath ? utils.resolvePath(rawPath, contextPath) : (rawPath ? appUrl(rawPath.startsWith('/') ? rawPath : '/' + rawPath) : '');
            if (utils?.renderAvatar) {
                utils.renderAvatar(avatar, { src, fallbackText: name, alt: `${name} 프로필` });
            }
        });
    }

    function requestFriend(targetUserId, button) {
        if (!targetUserId || !button) return;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '요청 중';
        post(appUrl('/friends/api/request'), { targetUserId })
            .then((data) => {
                if (!data.success) {
                    alert(data.message || '친구 요청을 처리하지 못했습니다.');
                    button.disabled = false;
                    button.textContent = originalText;
                    return;
                }
                loadAll();
                if (button.closest('#commonPeopleModal')) button.outerHTML = '<span class="common-people-modal-status is-muted">요청 중</span>';
            })
            .catch(() => {
                alert('친구 요청 처리 중 오류가 발생했습니다.');
                button.disabled = false;
                button.textContent = originalText;
            });
    }

    function activateRequestTab(tabName) {
        document.querySelectorAll('[data-friend-request-tab]').forEach((button) => {
            const active = button.dataset.friendRequestTab === tabName;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll('[data-friend-request-panel]').forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.friendRequestPanel === tabName);
        });
    }

    function closeFriendMenus() {
        document.querySelectorAll('.friend-row-menu.open').forEach((menu) => menu.classList.remove('open'));
        document.querySelectorAll('[data-friend-more][aria-expanded="true"]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }

    function empty(message, subMessage) {
        return `<div class="friend-empty"><strong>${escapeHtml(message)}</strong>${subMessage ? `<span>${escapeHtml(subMessage)}</span>` : ''}</div>`;
    }

    function renderMessage(selector, message) {
        const box = document.querySelector(selector);
        if (box) box.innerHTML = empty(message);
    }

    function afterAction(data) {
        if (!data.success && data.message) alert(data.message);
        loadAll();
    }

    function fetchJson(url) {
        return fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.success === false) throw new Error(data.message || '요청을 처리하지 못했습니다.');
                return data;
            });
    }

    function post(url, params) {
        const body = new URLSearchParams();
        Object.keys(params).forEach((key) => body.append(key, params[key]));
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Accept': 'application/json' },
            credentials: 'same-origin',
            body
        }).then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || '요청을 처리하지 못했습니다.');
            return data;
        });
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
})();
