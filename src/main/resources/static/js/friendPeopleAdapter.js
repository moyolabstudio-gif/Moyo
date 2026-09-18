/**
 * 친구 목록 어댑터
 * - 친구 전용 문구, 관계 데이터/버튼, 친구 API를 담당한다.
 * - 공통 사람 모달에 친구 전용 API와 관계 동작을 연결한다.
 */
(function () {
    'use strict';

    function getPeopleModal() {
        return window.CommonPeopleModal || null;
    }

    function requirePeopleModal() {
        const modal = getPeopleModal();
        if (!modal || typeof modal.open !== 'function') {
            throw new Error('공통 사람 모달을 불러오지 못했습니다.');
        }
        return modal;
    }

    function pick(source, keys, fallback) {
        if (!source) return fallback;
        for (const key of keys) {
            if (source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
        }
        return fallback;
    }

    function normalizeFriendRelation(source) {
        return {
            relationStatus: String(pick(source, ['relationStatus', 'RELATION_STATUS', 'status', 'STATUS'], 'NONE')).trim() || 'NONE',
            direction: String(pick(source, ['direction', 'DIRECTION'], 'NONE')).trim() || 'NONE',
            friendId: String(pick(source, ['friendId', 'FRIEND_ID', 'friend_id'], '')).trim()
        };
    }

    function normalizeFriend(source) {
        return Object.assign({}, source || {}, requirePeopleModal().normalizePerson(source), normalizeFriendRelation(source), {
            raw: source
        });
    }

    let activeFriendMenu = null;
    let activeFriendMenuButton = null;
    let activeFriendMenuPerson = null;
    let activeFriendMenuOptions = null;
    let activeFriendPeopleById = new Map();
    let activeFriendOpenOptions = null;

    function relationAction(friend) {
        const status = friend.relationStatus || 'NONE';
        const direction = friend.direction || 'NONE';
        if (status === 'SELF') return '<span class="common-people-modal-status is-self" aria-label="내 계정">나</span>';
        if (status === 'ACCEPTED') {
            return '<button type="button" class="common-people-modal-action is-friend common-people-friend-menu-toggle" data-person-action="friend-menu" aria-haspopup="menu" aria-expanded="false">친구</button>';
        }
        if (status === 'PENDING' && direction === 'SENT') {
            return '<button type="button" class="common-people-modal-action is-muted" data-person-action="cancel">요청 취소</button>';
        }
        if (status === 'PENDING' && direction === 'RECEIVED') {
            return '<button type="button" class="common-people-modal-action" data-person-action="accept">수락</button>'
                + '<button type="button" class="common-people-modal-action is-muted" data-person-action="reject">거절</button>';
        }
        if (status === 'BLOCKED') {
            return '<span class="common-people-modal-status is-muted" aria-label="차단된 관계">차단됨</span>';
        }
        return '<button type="button" class="common-people-modal-action" data-person-action="request">친구 요청</button>';
    }

    function ensureFriendMenu() {
        if (activeFriendMenu && activeFriendMenu.isConnected) return activeFriendMenu;
        const menu = document.createElement('div');
        menu.className = 'common-people-friend-popover';
        menu.setAttribute('role', 'menu');
        menu.style.setProperty('display', 'none', 'important');
        menu.innerHTML = `
            <button type="button" class="common-people-friend-popover-item" data-friend-popover-action="profile" role="menuitem">프로필 보기</button>
            <button type="button" class="common-people-friend-popover-item is-danger" data-friend-popover-action="delete" role="menuitem">친구 해제</button>
        `;
        document.body.appendChild(menu);
        menu.addEventListener('click', event => {
            const item = event.target.closest('[data-friend-popover-action]');
            if (!item || !activeFriendMenuPerson) return;
            event.preventDefault();
            event.stopPropagation();
            const action = item.dataset.friendPopoverAction;
            const person = activeFriendMenuPerson;
            const options = activeFriendMenuOptions || {};
            closeFriendMenus();
            if (action === 'profile') {
                if (typeof options.onProfile === 'function') options.onProfile(person);
                return;
            }
            const handler = options.onRelationAction || options.onRowAction;
            if (typeof handler === 'function') handler(person, action, item);
        });
        activeFriendMenu = menu;
        return menu;
    }

    function positionFriendMenu(button, menu) {
        const rect = button.getBoundingClientRect();
        const gap = 6;
        const width = 132;
        menu.style.width = `${width}px`;
        menu.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width))}px`;
        menu.style.top = `${rect.bottom + gap}px`;
        menu.style.visibility = 'hidden';
        menu.style.setProperty('display', 'block', 'important');
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight - 8) {
            menu.style.top = `${Math.max(8, rect.top - menuRect.height - gap)}px`;
        }
        menu.style.visibility = 'visible';
    }

    function closeFriendMenus() {
        if (activeFriendMenu) {
            activeFriendMenu.style.setProperty('display', 'none', 'important');
            activeFriendMenu.style.visibility = '';
        }
        if (activeFriendMenuButton) activeFriendMenuButton.setAttribute('aria-expanded', 'false');
        activeFriendMenuButton = null;
        activeFriendMenuPerson = null;
        activeFriendMenuOptions = null;
    }

    function toggleFriendMenu(button, friend, options) {
        if (!button) return;
        const isSameOpen = activeFriendMenuButton === button
            && activeFriendMenu
            && activeFriendMenu.style.display !== 'none';
        if (isSameOpen) {
            closeFriendMenus();
            return;
        }
        closeFriendMenus();
        const menu = ensureFriendMenu();
        activeFriendMenuButton = button;
        activeFriendMenuPerson = friend;
        activeFriendMenuOptions = options || {};
        button.setAttribute('aria-expanded', 'true');
        positionFriendMenu(button, menu);
    }

    function bindFriendMenuDismiss() {
        if (document.documentElement.dataset.commonFriendMenuBound === 'true') return;
        document.documentElement.dataset.commonFriendMenuBound = 'true';

        // 친구 목록의 "친구" 버튼은 캡처 단계에서 이 어댑터가 단독 처리한다.
        // CommonPeopleModal의 행 클릭 위임보다 먼저 처리해 열림/닫힘 충돌을 막는다.
        document.addEventListener('click', event => {
            const toggle = event.target.closest('#commonPeopleModal .common-people-friend-menu-toggle');
            if (toggle) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                const row = toggle.closest('[data-person-id]');
                const personId = String(row?.dataset.personId || '').trim();
                const friend = activeFriendPeopleById.get(personId);
                if (friend) toggleFriendMenu(toggle, friend, activeFriendOpenOptions || {});
                return;
            }
            if (event.target.closest('.common-people-friend-popover')) return;
            closeFriendMenus();
        }, true);

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeFriendMenus();
        });
        window.addEventListener('resize', closeFriendMenus);
        window.addEventListener('scroll', closeFriendMenus, true);
    }

    function open(options) {
        const opts = options || {};
        const sourceItems = opts.people || opts.friends || [];
        const customNormalizer = typeof opts.normalizePerson === 'function' ? opts.normalizePerson : null;
        const peopleModal = requirePeopleModal();
        const normalizedForMenu = sourceItems.map(item => {
            try {
                return customNormalizer
                    ? customNormalizer(item, { normalizePerson: peopleModal.normalizePerson, normalizeFriendRelation })
                    : normalizeFriend(item);
            } catch (e) {
                return normalizeFriend(item);
            }
        }).filter(Boolean);
        activeFriendPeopleById = new Map(normalizedForMenu.map(friend => [String(friend.id || '').trim(), friend]).filter(entry => entry[0]));
        activeFriendOpenOptions = opts;
        closeFriendMenus();
        bindFriendMenuDismiss();

        peopleModal.open(Object.assign({}, opts, {
            title: opts.title || '친구 목록',
            searchPlaceholder: opts.searchPlaceholder || '친구 이름 또는 이메일 검색',
            emptyText: opts.emptyText || '표시할 친구가 없습니다.',
            emptySubText: opts.emptySubText || '친구 이름이나 이메일로 다시 검색해보세요.',
            loadingText: opts.loadingText || '친구 목록을 불러오는 중입니다.',
            emptySummaryText: opts.emptySummaryText || '친구 없음',
            countLabel: opts.countLabel !== undefined ? opts.countLabel : (opts.profileList ? false : undefined),
            manageText: opts.manageText || '친구 관리로 이동',
            people: sourceItems,
            normalizePerson(item, helpers) {
                return customNormalizer
                    ? customNormalizer(item, { normalizePerson: helpers.normalizePerson, normalizeFriendRelation })
                    : normalizeFriend(item);
            },
            renderRowAction: opts.renderRowAction || (opts.profileList ? relationAction : null),
            onRowAction(friend, action, button) {
                if (action === 'friend-menu') {
                    toggleFriendMenu(button, friend, opts);
                    return;
                }
                if (action === 'profile') {
                    closeFriendMenus();
                    if (typeof opts.onProfile === 'function') opts.onProfile(friend);
                    return;
                }
                closeFriendMenus();
                const handler = opts.onRelationAction || opts.onRowAction;
                if (typeof handler === 'function') return handler(friend, action, button);
            }
        }));
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, Object.assign({
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        }, options || {}));
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) throw new Error(data.message || '친구 목록을 불러오지 못했습니다.');
        return data;
    }

    async function fetchList(contextPath) {
        const data = await fetchJson(`${contextPath || ''}/friends/api/list`);
        return Array.isArray(data.friends) ? data.friends : [];
    }

    async function fetchProfileFriends(contextPath, userId) {
        const data = await fetchJson(`${contextPath || ''}/users/profile/friends?userId=${encodeURIComponent(userId || '')}`);
        return Array.isArray(data.friends) ? data.friends : [];
    }

    async function postForm(url, params) {
        return fetchJson(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Accept': 'application/json' },
            body: new URLSearchParams(params || {}).toString()
        });
    }

    function requestFriend(contextPath, targetUserId) {
        return postForm(`${contextPath || ''}/friends/api/request`, { targetUserId });
    }

    function acceptFriend(contextPath, friendId) {
        return postForm(`${contextPath || ''}/friends/api/accept`, { friendId });
    }

    function rejectFriend(contextPath, friendId) {
        return postForm(`${contextPath || ''}/friends/api/reject`, { friendId });
    }

    function cancelFriend(contextPath, friendId) {
        return postForm(`${contextPath || ''}/friends/api/cancel`, { friendId });
    }

    function deleteFriend(contextPath, friendId) {
        return postForm(`${contextPath || ''}/friends/api/delete`, { friendId });
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

    function openAdd(options) {
        const opts = options || {};
        const contextPath = opts.contextPath || '';
        const peopleModal = requirePeopleModal();
        peopleModal.open({
            title: opts.title || '친구 추가',
            people: [],
            profileList: true,
            showCount: false,
            searchPlaceholder: opts.searchPlaceholder || '이름 또는 이메일로 검색',
            searchMinLength: 2,
            searchDelay: 300,
            loadingText: '친구를 검색하는 중입니다.',
            emptyText: '이름이나 이메일로 친구를 검색하세요.',
            emptySubText: '2글자 이상 입력하면 검색 결과가 표시됩니다.',
            normalizePerson: normalizeFriendSearchPerson,
            renderRowAction: friendSearchAction,
            onSearch(keyword) {
                return fetchJson(`${contextPath}/friends/api/search?keyword=${encodeURIComponent(keyword)}`)
                    .then(data => Array.isArray(data.users) ? data.users : []);
            },
            onProfile(person) {
                window.location.href = `${contextPath}/users/profile?userId=${encodeURIComponent(person.id)}`;
            },
            onRowAction(person, action, button) {
                if (action !== 'request' || !button) return;
                button.disabled = true;
                button.textContent = '처리 중';
                requestFriend(contextPath, person.id).then(data => {
                    if (data && data.success === false) {
                        if (data.message) alert(data.message);
                        button.disabled = false;
                        button.textContent = '친구 요청';
                        return;
                    }
                    button.outerHTML = '<span class="common-people-modal-status is-muted">요청 중</span>';
                    if (typeof opts.onUpdated === 'function') opts.onUpdated(data, person);
                }).catch(() => {
                    alert('친구 요청 처리 중 오류가 발생했습니다.');
                    button.disabled = false;
                    button.textContent = '친구 요청';
                });
            }
        });
    }
    const api = {
        open,
        openAdd,
        close: function () {
            closeFriendMenus();
            activeFriendPeopleById.clear();
            activeFriendOpenOptions = null;
            const modal = getPeopleModal();
            if (modal && typeof modal.close === 'function') modal.close();
        },
        fallbackAvatar: function (img, letter) {
            const modal = getPeopleModal();
            if (modal && typeof modal.fallbackAvatar === 'function') modal.fallbackAvatar(img, letter);
        },
        normalizeFriend,
        normalizeFriendRelation,
        fetchList,
        fetchProfileFriends,
        requestFriend,
        acceptFriend,
        rejectFriend,
        cancelFriend,
        deleteFriend
    };

    window.CommonFriendAdapter = api;
})();
