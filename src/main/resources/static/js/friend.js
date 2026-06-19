(function () {
    const $ = (selector) => document.querySelector(selector);

    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        loadAll();
    });

    function bindEvents() {
        const searchButton = $('#friendSearchButton');
        const searchInput = $('#friendSearchInput');
        if (searchButton) searchButton.addEventListener('click', searchUsers);
        if (searchInput) {
            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') searchUsers();
            });
        }
        document.querySelectorAll('[data-friend-refresh]').forEach((button) => button.addEventListener('click', loadAll));
        document.querySelectorAll('[data-friend-request-tab]').forEach((button) => {
            button.addEventListener('click', () => activateRequestTab(button.dataset.friendRequestTab));
        });
    }

    function loadAll() {
        loadFriends();
        loadRequests();
    }

    function searchUsers() {
        const keyword = ($('#friendSearchInput')?.value || '').trim();
        fetchJson('/friends/api/search?keyword=' + encodeURIComponent(keyword))
            .then((data) => renderSearch(data.users || []))
            .catch(() => renderMessage('#friendSearchResult', '검색 중 오류가 발생했습니다.'));
    }

    function loadFriends() {
        fetchJson('/friends/api/list')
            .then((data) => renderFriends(data.friends || []))
            .catch(() => renderMessage('#friendList', '친구 목록을 불러오지 못했습니다.'));
    }

    function loadRequests() {
        fetchJson('/friends/api/requests')
            .then((data) => {
                renderReceived(data.received || []);
                renderSent(data.sent || []);
                const pendingCount = data.pendingCount || 0;
                const sentCount = (data.sent || []).length;
                const badge = $('#friendPendingBadge');
                const heroPending = $('#friendHeroPendingCount');
                const sentBadge = $('#friendSentBadge');
                if (badge) badge.textContent = pendingCount;
                if (heroPending) heroPending.textContent = pendingCount;
                if (sentBadge) sentBadge.textContent = sentCount;
            })
            .catch(() => {
                renderMessage('#friendReceivedList', '받은 요청을 불러오지 못했습니다.');
                renderMessage('#friendSentList', '보낸 요청을 불러오지 못했습니다.');
            });
    }

    function renderSearch(users) {
        const box = $('#friendSearchResult');
        if (!box) return;
        if (!users.length) {
            box.innerHTML = empty('검색 결과가 없습니다.');
            return;
        }
        box.innerHTML = users.map((user) => {
            const status = user.relationStatus || 'NONE';
            const direction = user.direction || 'NONE';
            let action = `<button type="button" data-request-friend="${user.userId}">친구 요청</button>`;
            if (status === 'ACCEPTED') action = '<span class="friend-status-chip is-done">친구</span>';
            if (status === 'PENDING' && direction === 'SENT') action = '<span class="friend-status-chip is-waiting">요청 중</span>';
            if (status === 'PENDING' && direction === 'RECEIVED') action = '<span class="friend-status-chip is-waiting">받은 요청 있음</span>';
            if (status === 'BLOCKED') action = '<span class="friend-status-chip is-waiting">차단됨</span>';
            return row(user, action);
        }).join('');
        box.querySelectorAll('[data-request-friend]').forEach((button) => {
            button.addEventListener('click', () => post('/friends/api/request', { targetUserId: button.dataset.requestFriend }).then(afterAction));
        });
    }

    function renderFriends(friends) {
        const box = $('#friendList');
        if (!box) return;
        const totalCount = $('#friendTotalCount');
        if (totalCount) totalCount.textContent = friends.length;
        if (!friends.length) {
            box.innerHTML = empty('아직 등록된 친구가 없습니다.');
            return;
        }
        box.innerHTML = friends.map((friend) => row(friend, `<button type="button" class="danger" data-delete-friend="${friend.friendId}">삭제</button>`, { shareable: true })).join('');
        box.querySelectorAll('[data-delete-friend]').forEach((button) => {
            button.addEventListener('click', () => {
                if (confirm('친구를 삭제할까요?')) post('/friends/api/delete', { friendId: button.dataset.deleteFriend }).then(afterAction);
            });
        });
    }

    function renderReceived(requests) {
        const box = $('#friendReceivedList');
        if (!box) return;
        if (!requests.length) {
            box.innerHTML = empty('받은 요청이 없습니다.');
            return;
        }
        box.innerHTML = requests.map((request) => row(request, `
            <button type="button" data-accept-friend="${request.friendId}">수락</button>
            <button type="button" class="ghost" data-reject-friend="${request.friendId}">거절</button>
        `)).join('');
        box.querySelectorAll('[data-accept-friend]').forEach((button) => button.addEventListener('click', () => post('/friends/api/accept', { friendId: button.dataset.acceptFriend }).then(afterAction)));
        box.querySelectorAll('[data-reject-friend]').forEach((button) => button.addEventListener('click', () => post('/friends/api/reject', { friendId: button.dataset.rejectFriend }).then(afterAction)));
    }

    function renderSent(requests) {
        const box = $('#friendSentList');
        if (!box) return;
        if (!requests.length) {
            box.innerHTML = empty('보낸 요청이 없습니다.');
            return;
        }
        box.innerHTML = requests.map((request) => row(request, `<button type="button" class="ghost" data-cancel-friend="${request.friendId}">취소</button>`)).join('');
        box.querySelectorAll('[data-cancel-friend]').forEach((button) => button.addEventListener('click', () => post('/friends/api/cancel', { friendId: button.dataset.cancelFriend }).then(afterAction)));
    }

    function row(user, actionHtml, options = {}) {
        const name = escapeHtml(user.userName || user.email || '이름 없음');
        const email = escapeHtml(user.email || '');
        const initial = name.substring(0, 1).toUpperCase();
        const shareBadge = options.shareable ? '<span class="friend-share-badge">공유 가능</span>' : '';
        return `
            <div class="friend-row">
                <div class="friend-avatar">${escapeHtml(initial)}</div>
                <div class="friend-info">
                    <div class="friend-info-main"><strong>${name}</strong>${shareBadge}</div>
                    <span>${email}</span>
                </div>
                <div class="friend-actions">${actionHtml}</div>
            </div>
        `;
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

    function empty(message) {
        return `<div class="friend-empty">${escapeHtml(message)}</div>`;
    }

    function renderMessage(selector, message) {
        const box = document.querySelector(selector);
        if (box) box.innerHTML = empty(message);
    }

    function afterAction(data) {
        if (!data.success && data.message) alert(data.message);
        loadAll();
        const input = $('#friendSearchInput');
        if (input && input.value.trim()) searchUsers();
    }

    function fetchJson(url) {
        return fetch(url, { credentials: 'same-origin' }).then((res) => res.json());
    }

    function post(url, params) {
        const body = new URLSearchParams();
        Object.keys(params).forEach((key) => body.append(key, params[key]));
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            credentials: 'same-origin',
            body
        }).then((res) => res.json());
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
