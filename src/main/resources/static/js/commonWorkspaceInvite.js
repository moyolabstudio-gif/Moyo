(function () {
    'use strict';

    let searchTimer = null;
    let searchController = null;

    function modal() { return document.getElementById('workspaceInviteModal'); }
    function overlay() { return document.getElementById('workspaceInviteOverlay'); }
    function input() { return document.getElementById('workspaceInviteKeyword'); }
    function results() { return document.getElementById('workspaceInviteResults'); }

    function contextPath() {
        const node = modal();
        if (node && node.dataset.contextPath != null) return node.dataset.contextPath;
        if (window.WORKSPACE_CONFIG && WORKSPACE_CONFIG.contextPath != null) return WORKSPACE_CONFIG.contextPath;
        if (typeof window.WORKSPACE_CONTEXT_PATH === 'string') return window.WORKSPACE_CONTEXT_PATH;
        return '';
    }

    function workspaceId() {
        const node = modal();
        const value = node && node.dataset.workspaceId
            ? node.dataset.workspaceId
            : (window.WORKSPACE_CONFIG ? WORKSPACE_CONFIG.wsId : document.body.dataset.wsId);
        return Number(value || 0);
    }

    function resolvePath(path) {
        if (!path || /^(?:https?:|data:|blob:)/i.test(path)) return path || '';
        const base = contextPath();
        if (!base || path.indexOf(base + '/') === 0) return path;
        return base + (path.charAt(0) === '/' ? path : '/' + path);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function empty(message) {
        const target = results();
        if (target) target.innerHTML = '<div class="workspace-invite-empty">' + escapeHtml(message) + '</div>';
    }

    function reset() {
        clearTimeout(searchTimer);
        if (searchController) {
            searchController.abort();
            searchController = null;
        }
        const field = input();
        if (field) field.value = '';
        empty('이름이나 이메일로 멤버를 검색하세요.');
    }

    function setVisible(visible) {
        const dialog = modal();
        const backdrop = overlay();
        if (!dialog || !backdrop) return;
        dialog.style.display = visible ? 'block' : 'none';
        backdrop.style.display = visible ? 'block' : 'none';
        document.body.classList.toggle('workspace-invite-open', visible);
        if (visible) {
            window.setTimeout(function () { if (input()) input().focus(); }, 60);
        } else {
            reset();
        }
    }

    function statusButton(status, email) {
        if (status === 'SELF') return '<button type="button" disabled>본인</button>';
        if (status === 'ALREADY_MEMBER') return '<button type="button" disabled>이미 가입됨</button>';
        if (status === 'PENDING') return '<button type="button" disabled>초대 대기</button>';
        return '<button type="button" data-invite-email="' + escapeHtml(email) + '">초대</button>';
    }

    function renderUsers(users) {
        const target = results();
        if (!target) return;
        if (!Array.isArray(users) || users.length === 0) {
            empty('검색된 사용자가 없습니다.');
            return;
        }

        target.innerHTML = users.map(function (user) {
            const email = user.email || user.EMAIL || '';
            const name = user.userName || user.USER_NAME || email;
            const initial = name ? name.substring(0, 1) : '?';
            const image = user.profileImagePath || user.PROFILE_IMAGE_PATH ||
                user.profilePath || user.PROFILE_PATH || user.profileImage || user.PROFILE_IMAGE || '';
            const status = user.memberStatus || user.MEMBER_STATUS || 'AVAILABLE';
            const avatar = image
                ? '<img src="' + escapeHtml(resolvePath(image)) + '" alt="" data-avatar-fallback="' + escapeHtml(initial) + '">'
                : escapeHtml(initial);

            return '<div class="workspace-invite-user">' +
                '<div class="workspace-invite-avatar">' + avatar + '</div>' +
                '<div class="workspace-invite-info"><strong>' + escapeHtml(name) + '</strong><span>' + escapeHtml(email) + '</span></div>' +
                statusButton(status, email) +
                '</div>';
        }).join('');
    }

    function search() {
        const field = input();
        const keyword = field ? field.value.trim() : '';
        const wsId = workspaceId();

        clearTimeout(searchTimer);
        if (searchController) searchController.abort();

        if (!keyword) {
            empty('이름이나 이메일로 멤버를 검색하세요.');
            return;
        }
        if (keyword.length < 2) {
            empty('2글자 이상 입력해 주세요.');
            return;
        }
        if (!wsId) {
            empty('그룹 정보를 확인할 수 없습니다.');
            return;
        }

        searchController = new AbortController();
        empty('검색 중입니다.');
        fetch(contextPath() + '/workspace/api/search-member?wsId=' + encodeURIComponent(wsId) + '&email=' + encodeURIComponent(keyword), {
            signal: searchController.signal
        })
            .then(function (response) {
                if (!response.ok) throw new Error('SEARCH_FAILED');
                return response.json();
            })
            .then(renderUsers)
            .catch(function (error) {
                if (error && error.name === 'AbortError') return;
                console.error('그룹 초대 사용자 검색 실패:', error);
                empty('검색 중 오류가 발생했습니다.');
            });
    }

    function scheduleSearch() {
        clearTimeout(searchTimer);
        searchTimer = window.setTimeout(search, 300);
    }

    function invite(email, button) {
        const wsId = workspaceId();
        if (!email || !wsId) return;
        if (button) {
            button.disabled = true;
            button.textContent = '처리 중';
        }

        fetch(contextPath() + '/workspace/api/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wsId: wsId, email: email })
        })
            .then(function (response) {
                if (!response.ok) throw new Error('INVITE_FAILED');
                return response.json();
            })
            .then(function (result) {
                if (result.status === 'SUCCESS') {
                    alert('초대장을 보냈습니다.');
                    search();
                    return;
                }
                if (result.status === 'ALREADY_MEMBER') alert('이미 그룹에 참여 중인 사용자입니다.');
                else if (result.status === 'ALREADY_EXISTS') alert('이미 초대 대기 중인 사용자입니다.');
                else if (result.status === 'SELF_INVITE') alert('본인은 초대할 수 없습니다.');
                else if (result.status === 'NOT_FOUND' || result.status === 'USER_NOT_FOUND') alert('사용자를 찾지 못했습니다.');
                else if (result.status === 'LOGIN_REQUIRED') alert('로그인이 필요합니다.');
                else alert('초대 처리 중 오류가 발생했습니다.');
                if (button) {
                    button.disabled = false;
                    button.textContent = '초대';
                }
            })
            .catch(function (error) {
                console.error('그룹 멤버 초대 실패:', error);
                alert('초대 처리 중 오류가 발생했습니다.');
                if (button) {
                    button.disabled = false;
                    button.textContent = '초대';
                }
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        const field = input();
        if (field) {
            field.addEventListener('input', scheduleSearch);
            field.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    search();
                }
            });
        }

        document.querySelectorAll('[data-workspace-invite-close]').forEach(function (node) {
            node.addEventListener('click', function () { setVisible(false); });
        });

        const target = results();
        if (target) {
            target.addEventListener('click', function (event) {
                const button = event.target.closest('[data-invite-email]');
                if (button) invite(button.dataset.inviteEmail, button);
            });
            target.addEventListener('error', function (event) {
                const image = event.target;
                if (image && image.matches('img[data-avatar-fallback]')) {
                    const parent = image.parentElement;
                    if (parent) parent.textContent = image.dataset.avatarFallback || '?';
                }
            }, true);
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal() && modal().style.display === 'block') setVisible(false);
    });

    window.openWorkspaceInviteModal = function () { setVisible(true); };
    window.closeWorkspaceInviteModal = function () { setVisible(false); };
    window.openInviteModal = window.openWorkspaceInviteModal;
    window.closeInviteModal = window.closeWorkspaceInviteModal;
    window.openTabInviteModal = window.openWorkspaceInviteModal;
    window.closeTabInviteModal = window.closeWorkspaceInviteModal;
})();
