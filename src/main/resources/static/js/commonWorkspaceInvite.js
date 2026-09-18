(function () {
    'use strict';

    let searchController = null;
    let lastKeyword = '';

    function configNode() {
        return document.getElementById('workspaceInviteConfig');
    }

    function contextPath() {
        const node = configNode();
        if (node && node.dataset.contextPath != null) return node.dataset.contextPath;
        if (window.WORKSPACE_CONFIG && window.WORKSPACE_CONFIG.contextPath != null) return window.WORKSPACE_CONFIG.contextPath;
        if (typeof window.WORKSPACE_CONTEXT_PATH === 'string') return window.WORKSPACE_CONTEXT_PATH;
        return document.body?.dataset?.contextPath || '';
    }

    function workspaceId() {
        const node = configNode();
        const value = node?.dataset?.workspaceId || window.WORKSPACE_CONFIG?.wsId || document.body?.dataset?.wsId;
        return Number(value || 0);
    }

    function readUsers(payload) {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.users)) return payload.users;
        if (Array.isArray(payload?.members)) return payload.members;
        return [];
    }

    function normalizeInvitePerson(source, helpers) {
        const person = helpers.normalizePerson(source);
        const email = source.email || source.EMAIL || person.email || '';
        const status = source.memberStatus || source.MEMBER_STATUS || 'AVAILABLE';
        person.id = String(source.userId || source.USER_ID || person.id || email);
        person.email = email;
        person.subtitle = email;
        person.inviteStatus = String(status || 'AVAILABLE').toUpperCase();
        person.raw = source;
        return person;
    }

    function actionMarkup(person) {
        switch (person.inviteStatus) {
            case 'SELF':
                return '<span class="common-people-modal-status is-self">본인</span>';
            case 'ALREADY_MEMBER':
                return '<span class="common-people-modal-status is-friend">가입됨</span>';
            case 'PENDING':
            case 'ALREADY_EXISTS':
                return '<span class="common-people-modal-status is-muted">초대 대기</span>';
            default:
                return '<button type="button" class="common-people-modal-action" data-person-action="invite">초대</button>';
        }
    }

    function searchUsers(keyword) {
        const wsId = workspaceId();
        lastKeyword = keyword;
        if (!wsId) return Promise.reject(new Error('그룹 정보를 확인할 수 없습니다.'));
        if (searchController) searchController.abort();
        searchController = new AbortController();
        const url = contextPath() + '/workspace/api/search-member?wsId=' + encodeURIComponent(wsId) + '&email=' + encodeURIComponent(keyword);
        return fetch(url, { signal: searchController.signal, credentials: 'same-origin' })
            .then(function (response) {
                if (!response.ok) throw new Error('SEARCH_FAILED');
                return response.json();
            })
            .then(readUsers)
            .catch(function (error) {
                if (error?.name === 'AbortError') return [];
                throw error;
            });
    }

    function refreshSearch() {
        const api = window.CommonPeopleModal;
        if (!api || !lastKeyword) return;
        searchUsers(lastKeyword).then(function (users) {
            api.replacePeople(users);
        }).catch(function (error) {
            console.error('그룹 초대 사용자 검색 실패:', error);
            api.replacePeople([]);
        });
    }

    function invite(person, button) {
        const wsId = workspaceId();
        const email = person.email || person.raw?.email || person.raw?.EMAIL || '';
        if (!email || !wsId || !button) return;
        button.disabled = true;
        button.textContent = '처리 중';

        fetch(contextPath() + '/workspace/api/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ wsId: wsId, email: email })
        })
            .then(function (response) {
                if (!response.ok) throw new Error('INVITE_FAILED');
                return response.json();
            })
            .then(function (result) {
                if (result.status === 'SUCCESS') {
                    alert('초대장을 보냈습니다.');
                    refreshSearch();
                    return;
                }
                if (result.status === 'ALREADY_MEMBER') alert('이미 그룹에 참여 중인 사용자입니다.');
                else if (result.status === 'ALREADY_EXISTS') alert('이미 초대 대기 중인 사용자입니다.');
                else if (result.status === 'SELF_INVITE') alert('본인은 초대할 수 없습니다.');
                else if (result.status === 'NOT_FOUND' || result.status === 'USER_NOT_FOUND') alert('사용자를 찾지 못했습니다.');
                else if (result.status === 'LOGIN_REQUIRED') alert('로그인이 필요합니다.');
                else if (result.status === 'FORBIDDEN') alert('멤버를 초대할 권한이 없습니다.');
                else if (result.status === 'UNAVAILABLE') alert('현재 초대할 수 없는 그룹입니다.');
                else alert('초대 처리 중 오류가 발생했습니다.');
                button.disabled = false;
                button.textContent = '초대';
            })
            .catch(function (error) {
                console.error('그룹 멤버 초대 실패:', error);
                alert('초대 처리 중 오류가 발생했습니다.');
                button.disabled = false;
                button.textContent = '초대';
            });
    }

    function open() {
        const api = window.CommonPeopleModal;
        if (!api || typeof api.open !== 'function') {
            console.error('공통 사람 모달을 불러오지 못했습니다.');
            return;
        }
        lastKeyword = '';
        api.open({
            title: '멤버 초대',
            people: [],
            profileList: true,
            showCount: false,
            searchPlaceholder: '이름 또는 이메일로 검색',
            searchMinLength: 2,
            searchDelay: 300,
            loadingText: '멤버를 검색하는 중입니다.',
            emptyText: '이름이나 이메일로 멤버를 검색하세요.',
            emptySubText: '2글자 이상 입력하면 검색 결과가 표시됩니다.',
            normalizePerson: normalizeInvitePerson,
            renderRowAction: actionMarkup,
            onSearch: searchUsers,
            onRowAction: function (person, action, button) {
                if (action === 'invite') invite(person, button);
            }
        });
    }

    function close() {
        window.CommonPeopleModal?.close?.();
    }

    window.openWorkspaceInviteModal = open;
    window.closeWorkspaceInviteModal = close;
    window.openInviteModal = open;
    window.closeInviteModal = close;
    window.openTabInviteModal = open;
    window.closeTabInviteModal = close;
})();
