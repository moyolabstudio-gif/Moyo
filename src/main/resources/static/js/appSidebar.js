(function() {
    'use strict';

    const STORAGE_COLLAPSED = 'moyo.appSidebar.collapsed';
    const STORAGE_OPEN_WS = 'moyo.appSidebar.openWorkspaces';

    function readOpenWorkspaceIds() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_OPEN_WS) || '[]');
            return Array.isArray(value) ? value.map(String) : [];
        } catch (error) {
            return [];
        }
    }

    function saveOpenWorkspaceIds() {
        const ids = Array.from(document.querySelectorAll('.moyo-app-workspace.open'))
            .map(function(item) { return item.dataset.wsId; })
            .filter(Boolean);
        localStorage.setItem(STORAGE_OPEN_WS, JSON.stringify(ids));
    }

    function setDesktopCollapsed(collapsed) {
        document.body.classList.toggle('moyo-app-sidebar-collapsed', collapsed);
        localStorage.setItem(STORAGE_COLLAPSED, collapsed ? 'true' : 'false');
        const button = document.getElementById('moyoAppSidebarToggle');
        if (button) {
            button.setAttribute('aria-expanded', String(!collapsed));
            button.setAttribute('aria-label', collapsed ? '공간 메뉴 열기' : '공간 메뉴 접기');
        }
    }

    function closeMobileSidebar() {
        document.body.classList.remove('moyo-app-sidebar-mobile-open');
        const backdrop = document.getElementById('moyoAppSidebarBackdrop');
        if (backdrop) {
            backdrop.style.display = '';
            backdrop.style.opacity = '';
            backdrop.style.pointerEvents = '';
        }
    }

    function normalizeSidebarBackdrop() {
        const isMobile = window.innerWidth <= 900;
        const isOpen = document.body.classList.contains('moyo-app-sidebar-mobile-open');
        const backdrop = document.getElementById('moyoAppSidebarBackdrop');

        if (!isMobile || !isOpen) {
            document.body.classList.remove('moyo-app-sidebar-mobile-open');
            if (backdrop) {
                backdrop.style.display = '';
                backdrop.style.opacity = '';
                backdrop.style.pointerEvents = '';
            }
        }
    }


    function fetchJson(url) {
        return fetch(url, { credentials: 'same-origin' }).then(function(res) { return res.json(); });
    }

    function escapeText(value) {
        return String(value == null ? '' : value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function friendDisplayName(friend) {
        return friend.userName || friend.friendName || friend.displayName || friend.email || '친구';
    }

    function friendEmail(friend) {
        return friend.email || friend.friendEmail || friend.contactEmail || '';
    }

    function friendImage(friend) {
        return friend.profileImagePath || friend.friendProfileImagePath || friend.profileImage || friend.imagePath || '';
    }

    function friendUpdatedTime(friend) {
        const raw = friend.lastInteractionAt || friend.lastActivityAt || friend.updatedAt || friend.acceptedAt || friend.createdAt || '';
        const time = raw ? new Date(raw).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    }

    function friendActivityTime(friend) {
        const raw = friend.lastInteractionAt || friend.lastActivityAt || friend.profileUpdatedAt || friend.feedUpdatedAt || friend.photoUpdatedAt || friend.noteUpdatedAt || friend.recentActivityAt || friend.recentUpdatedAt || '';
        const time = raw ? new Date(raw).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    }

    function friendBirthdayRaw(friend) {
        return friend.birthDate || friend.birthday || friend.userBirthday || friend.friendBirthday || friend.birth || '';
    }

    function parseBirthday(friend) {
        const raw = friendBirthdayRaw(friend);
        if (!raw) return null;
        const text = String(raw).trim();
        const match = text.match(/(?:\d{4}[-/.])?(\d{1,2})[-/.](\d{1,2})/);
        if (!match) return null;
        const month = Number(match[1]);
        const day = Number(match[2]);
        if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
        return { month: month, day: day };
    }

    function birthdayDistance(friend) {
        const birthday = parseBirthday(friend);
        if (!birthday) return Number.POSITIVE_INFINITY;
        const today = new Date();
        const current = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        let target = new Date(today.getFullYear(), birthday.month - 1, birthday.day).getTime();
        if (target < current) target = new Date(today.getFullYear() + 1, birthday.month - 1, birthday.day).getTime();
        return Math.round((target - current) / 86400000);
    }

    function birthdayLabel(friend) {
        const distance = birthdayDistance(friend);
        const birthday = parseBirthday(friend);
        if (!birthday || !Number.isFinite(distance)) return '';
        if (distance === 0) return '오늘 생일';
        if (distance === 1) return '내일 생일';
        if (distance <= 7) return distance + '일 후';
        return birthday.month + '월 ' + birthday.day + '일';
    }

    function sortSidebarFriends(friends) {
        return friends.slice().sort(function(a, b) {
            const favoriteA = a.favorite === true || a.isFavorite === true || a.favoriteYn === 'Y';
            const favoriteB = b.favorite === true || b.isFavorite === true || b.favoriteYn === 'Y';
            if (favoriteA !== favoriteB) return favoriteA ? -1 : 1;
            return friendUpdatedTime(b) - friendUpdatedTime(a);
        });
    }

    function initSidebarFriendPreview() {
        const box = document.getElementById('moyoSidebarFriendPreview');
        const updatedBox = document.getElementById('moyoSidebarUpdatedFriends');
        const birthdayBox = document.getElementById('moyoSidebarBirthdayFriends');
        const friendListBox = document.getElementById('moyoSidebarFriendList');
        if (!box || !updatedBox || !friendListBox) return;

        function section(name) {
            return box.querySelector('[data-moyo-friend-section="' + name + '"]');
        }

        function friendInitial(name) {
            return String(name || '친구').substring(0, 1).toUpperCase();
        }

        function avatarHtml(friend, name, extraClass) {
            const image = friendImage(friend);
            const safeName = escapeText(name);
            const initial = escapeText(friendInitial(name));
            const cls = 'moyo-app-sidebar-friend-avatar' + (extraClass ? ' ' + extraClass : '');
            return image
                ? '<span class="' + cls + '"><img src="' + escapeText(image) + '" alt="' + safeName + '" onerror="this.remove();"></span>'
                : '<span class="' + cls + '">' + initial + '</span>';
        }

        function renderEmpty(message) {
            const birthdaySection = section('birthday');
            updatedBox.innerHTML = '';
            friendListBox.innerHTML = '<button type="button" class="moyo-app-sidebar-friend-item skeleton" data-moyo-friend-modal-open>' +
                '<span class="moyo-app-sidebar-friend-avatar">👥</span>' +
                '<span class="moyo-app-sidebar-friend-text"><strong>' + escapeText(message) + '</strong><em>관리에서 추가할 수 있어요</em></span>' +
                '</button>';
            if (birthdaySection) birthdaySection.hidden = true;
        }

        function renderUpdated(friends) {
            const updatedSection = section('updated');
            const updatedFriends = friends
                .filter(function(friend) { return friendActivityTime(friend) > 0; })
                .sort(function(a, b) { return friendActivityTime(b) - friendActivityTime(a); })
                .slice(0, 5);

            if (updatedSection) updatedSection.hidden = updatedFriends.length === 0;
            if (!updatedFriends.length) {
                updatedBox.innerHTML = '';
                return false;
            }

            updatedBox.innerHTML = updatedFriends.map(function(friend) {
                const name = friendDisplayName(friend);
                return '<button type="button" class="moyo-app-sidebar-friend-chip" data-moyo-friend-modal-open title="' + escapeText(name) + '">' +
                    avatarHtml(friend, name) +
                    '<span>' + escapeText(name) + '</span>' +
                    '</button>';
            }).join('');
            return true;
        }

        function renderBirthdays(friends) {
            const birthdaySection = section('birthday');
            if (!birthdaySection || !birthdayBox) return false;
            const birthdays = friends
                .filter(function(friend) { return birthdayDistance(friend) <= 30; })
                .sort(function(a, b) { return birthdayDistance(a) - birthdayDistance(b); })
                .slice(0, 2);
            birthdaySection.hidden = birthdays.length === 0;
            if (!birthdays.length) {
                birthdayBox.innerHTML = '';
                return false;
            }
            birthdayBox.innerHTML = birthdays.map(function(friend) {
                const name = friendDisplayName(friend);
                const email = friendEmail(friend);
                return '<button type="button" class="moyo-app-sidebar-friend-item" data-moyo-friend-modal-open>' +
                    avatarHtml(friend, name) +
                    '<span class="moyo-app-sidebar-friend-text"><strong>' + escapeText(name) + '</strong><em>' + escapeText(email || '친구') + '</em></span>' +
                    '<span class="moyo-app-sidebar-birthday-note">' + escapeText(birthdayLabel(friend)) + '</span>' +
                    '</button>';
            }).join('');
            return true;
        }

        function renderFriendList(friends, showLabel) {
            const listSection = section('list');
            const listLabel = listSection ? listSection.querySelector('.moyo-app-sidebar-friend-section-label') : null;
            if (listLabel) listLabel.hidden = !showLabel;
            const listFriends = sortSidebarFriends(friends).slice(0, 3);
            friendListBox.innerHTML = listFriends.map(function(friend) {
                const name = friendDisplayName(friend);
                const email = friendEmail(friend);
                return '<button type="button" class="moyo-app-sidebar-friend-item" data-moyo-friend-modal-open>' +
                    avatarHtml(friend, name) +
                    '<span class="moyo-app-sidebar-friend-text"><strong>' + escapeText(name) + '</strong><em>' + escapeText(email || '친구') + '</em></span>' +
                    '</button>';
            }).join('');
        }

        function render(friends) {
            if (!friends.length) {
                renderEmpty('등록된 친구가 없습니다');
                return;
            }
            const hasUpdated = renderUpdated(friends);
            const hasBirthday = renderBirthdays(friends);
            renderFriendList(friends, hasUpdated || hasBirthday);
        }

        fetchJson('/friends/api/list')
            .then(function(data) { render(data.friends || []); })
            .catch(function() { renderEmpty('친구를 불러오지 못했습니다'); });
    }

    function initFriendModal() {
        const modal = document.getElementById('moyoFriendModal');
        if (!modal) return;

        const panel = modal.querySelector('.moyo-friend-modal-panel');
        const closeButtons = modal.querySelectorAll('[data-moyo-friend-modal-close]');
        const searchInput = document.getElementById('moyoFriendModalSearchInput');
        const searchButton = document.getElementById('moyoFriendModalSearchButton');
        let loadedOnce = false;

        function openModal() {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('moyo-friend-modal-open');
            closeMobileSidebar();
            if (!loadedOnce) {
                loadAllFriends();
                loadedOnce = true;
            }
            setTimeout(function() {
                if (panel) panel.focus();
            }, 0);
        }

        function closeModal() {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('moyo-friend-modal-open');
        }

        function setTab(tabName) {
            modal.querySelectorAll('[data-moyo-friend-tab]').forEach(function(button) {
                const active = button.dataset.moyoFriendTab === tabName;
                button.classList.toggle('active', active);
                button.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            modal.querySelectorAll('[data-moyo-friend-panel]').forEach(function(panel) {
                panel.classList.toggle('active', panel.dataset.moyoFriendPanel === tabName);
            });
            if (tabName === 'add' && searchInput) {
                setTimeout(function() { searchInput.focus(); }, 0);
            }
        }

        function loadAllFriends() {
            loadFriendList();
            loadFriendRequests();
        }

        function fetchJson(url) {
            return fetch(url, { credentials: 'same-origin' }).then(function(res) { return res.json(); });
        }

        function post(url, params) {
            const body = new URLSearchParams();
            Object.keys(params).forEach(function(key) { body.append(key, params[key]); });
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                credentials: 'same-origin',
                body: body
            }).then(function(res) { return res.json(); });
        }

        function loadFriendList() {
            fetchJson('/friends/api/list')
                .then(function(data) { renderFriendList(data.friends || []); })
                .catch(function() { renderMessage('moyoFriendModalFriendList', '친구 목록을 불러오지 못했습니다.'); });
        }

        function loadFriendRequests() {
            fetchJson('/friends/api/requests')
                .then(function(data) {
                    renderReceived(data.received || []);
                    renderSent(data.sent || []);
                    const pendingCount = data.pendingCount || 0;
                    const pending = document.getElementById('moyoFriendModalPendingCount');
                    if (pending) pending.textContent = pendingCount;
                })
                .catch(function() {
                    renderMessage('moyoFriendModalReceivedList', '받은 요청을 불러오지 못했습니다.');
                    renderMessage('moyoFriendModalSentList', '보낸 요청을 불러오지 못했습니다.');
                });
        }

        function searchUsers() {
            const keyword = (searchInput && searchInput.value || '').trim();
            fetchJson('/friends/api/search?keyword=' + encodeURIComponent(keyword))
                .then(function(data) { renderSearchResult(data.users || []); })
                .catch(function() { renderMessage('moyoFriendModalSearchResult', '검색 중 오류가 발생했습니다.'); });
        }

        function renderFriendList(friends) {
            const total = document.getElementById('moyoFriendModalTotalCount');
            if (total) total.textContent = friends.length;
            if (!friends.length) {
                renderMessage('moyoFriendModalFriendList', '아직 등록된 친구가 없습니다.');
                return;
            }
            const box = document.getElementById('moyoFriendModalFriendList');
            if (!box) return;
            box.innerHTML = friends.map(function(friend) {
                return friendRow(friend, '<button type="button" class="danger" data-moyo-delete-friend="' + escapeHtml(friend.friendId) + '">삭제</button>');
            }).join('');
            box.querySelectorAll('[data-moyo-delete-friend]').forEach(function(button) {
                button.addEventListener('click', function() {
                    if (!confirm('친구를 삭제할까요?')) return;
                    post('/friends/api/delete', { friendId: button.dataset.moyoDeleteFriend }).then(afterAction);
                });
            });
        }

        function renderSearchResult(users) {
            if (!users.length) {
                renderMessage('moyoFriendModalSearchResult', '검색 결과가 없습니다.');
                return;
            }
            const box = document.getElementById('moyoFriendModalSearchResult');
            if (!box) return;
            box.innerHTML = users.map(function(user) {
                const status = user.relationStatus || 'NONE';
                const direction = user.direction || 'NONE';
                let action = '<button type="button" class="primary" data-moyo-request-friend="' + escapeHtml(user.userId) + '">친구 요청</button>';
                if (status === 'ACCEPTED') action = '<span class="moyo-friend-status-chip">친구</span>';
                if (status === 'PENDING' && direction === 'SENT') action = '<span class="moyo-friend-status-chip">요청 중</span>';
                if (status === 'PENDING' && direction === 'RECEIVED') action = '<span class="moyo-friend-status-chip">받은 요청 있음</span>';
                if (status === 'BLOCKED') action = '<span class="moyo-friend-status-chip">차단됨</span>';
                return friendRow(user, action);
            }).join('');
            box.querySelectorAll('[data-moyo-request-friend]').forEach(function(button) {
                button.addEventListener('click', function() {
                    post('/friends/api/request', { targetUserId: button.dataset.moyoRequestFriend }).then(afterAction);
                });
            });
        }

        function renderReceived(requests) {
            if (!requests.length) {
                renderMessage('moyoFriendModalReceivedList', '받은 요청이 없습니다.');
                return;
            }
            const box = document.getElementById('moyoFriendModalReceivedList');
            if (!box) return;
            box.innerHTML = requests.map(function(request) {
                return friendRow(request,
                    '<button type="button" class="primary" data-moyo-accept-friend="' + escapeHtml(request.friendId) + '">수락</button>' +
                    '<button type="button" data-moyo-reject-friend="' + escapeHtml(request.friendId) + '">거절</button>'
                );
            }).join('');
            box.querySelectorAll('[data-moyo-accept-friend]').forEach(function(button) {
                button.addEventListener('click', function() { post('/friends/api/accept', { friendId: button.dataset.moyoAcceptFriend }).then(afterAction); });
            });
            box.querySelectorAll('[data-moyo-reject-friend]').forEach(function(button) {
                button.addEventListener('click', function() { post('/friends/api/reject', { friendId: button.dataset.moyoRejectFriend }).then(afterAction); });
            });
        }

        function renderSent(requests) {
            if (!requests.length) {
                renderMessage('moyoFriendModalSentList', '보낸 요청이 없습니다.');
                return;
            }
            const box = document.getElementById('moyoFriendModalSentList');
            if (!box) return;
            box.innerHTML = requests.map(function(request) {
                return friendRow(request, '<button type="button" data-moyo-cancel-friend="' + escapeHtml(request.friendId) + '">취소</button>');
            }).join('');
            box.querySelectorAll('[data-moyo-cancel-friend]').forEach(function(button) {
                button.addEventListener('click', function() { post('/friends/api/cancel', { friendId: button.dataset.moyoCancelFriend }).then(afterAction); });
            });
        }

        function afterAction(data) {
            if (data && data.success === false && data.message) alert(data.message);
            loadAllFriends();
            if (searchInput && searchInput.value.trim()) searchUsers();
        }

        function friendRow(user, actionHtml) {
            const name = escapeHtml(user.userName || user.email || '이름 없음');
            const email = escapeHtml(user.email || '');
            const initial = name.substring(0, 1).toUpperCase();
            return '<div class="moyo-friend-row">' +
                '<div class="moyo-friend-avatar">' + initial + '</div>' +
                '<div class="moyo-friend-info"><strong>' + name + '</strong><span>' + email + '</span></div>' +
                '<div class="moyo-friend-row-actions">' + actionHtml + '</div>' +
                '</div>';
        }

        function renderMessage(id, message) {
            const box = document.getElementById(id);
            if (box) box.innerHTML = '<div class="moyo-friend-empty">' + escapeHtml(message) + '</div>';
        }

        function escapeHtml(value) {
            return String(value == null ? '' : value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        document.addEventListener('click', function(event) {
            const trigger = event.target.closest('[data-moyo-friend-modal-open]');
            if (!trigger || modal.contains(trigger)) return;
            event.preventDefault();
            openModal();
        });
        closeButtons.forEach(function(button) {
            button.addEventListener('click', closeModal);
        });
        modal.querySelectorAll('[data-moyo-friend-tab]').forEach(function(button) {
            button.addEventListener('click', function() { setTab(button.dataset.moyoFriendTab); });
        });
        modal.querySelectorAll('[data-moyo-friend-refresh]').forEach(function(button) {
            button.addEventListener('click', loadAllFriends);
        });
        if (searchButton) searchButton.addEventListener('click', searchUsers);
        if (searchInput) {
            searchInput.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') searchUsers();
            });
        }
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
        });
    }

    function init() {
        const sidebar = document.getElementById('moyoAppSidebar');
        if (!sidebar) return;

        document.body.classList.add('moyo-app-sidebar-enabled');
        normalizeSidebarBackdrop();

        const params = new URLSearchParams(window.location.search);
        const currentPath = window.location.pathname;
        const currentWsId = String(sidebar.dataset.currentWsId || params.get('wsId') || '');
        const currentProjId = String(sidebar.dataset.currentProjId || params.get('projId') || '');
        const openedIds = readOpenWorkspaceIds();

        if (window.innerWidth > 900) {
            setDesktopCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === 'true');
        }

        document.querySelectorAll('.moyo-app-workspace').forEach(function(workspace) {
            const wsId = String(workspace.dataset.wsId || '');
            const shouldOpen = wsId === currentWsId || openedIds.includes(wsId);
            workspace.classList.toggle('open', shouldOpen);
            workspace.classList.toggle('current', wsId === currentWsId);

            const toggle = workspace.querySelector('.moyo-app-workspace-toggle');
            const entry = workspace.querySelector('.moyo-app-workspace-home');

            if (entry && !currentProjId && currentWsId && wsId === currentWsId && currentPath.startsWith('/workspace/')) {
                entry.classList.add('active');
            }

            if (!toggle) return;

            toggle.setAttribute('aria-expanded', String(shouldOpen));
            toggle.setAttribute('aria-label', workspace.classList.contains('open') ? '프로젝트 목록 접기' : '프로젝트 목록 펼치기');
            toggle.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                workspace.classList.toggle('open');
                const opened = workspace.classList.contains('open');
                toggle.setAttribute('aria-expanded', String(opened));
                toggle.setAttribute('aria-label', opened ? '프로젝트 목록 접기' : '프로젝트 목록 펼치기');
                saveOpenWorkspaceIds();
            });
        });

        document.querySelectorAll('.moyo-app-project-link').forEach(function(link) {
            if (currentProjId && String(link.dataset.projId || '') === currentProjId) {
                link.classList.add('active');
                const workspace = link.closest('.moyo-app-workspace');
                if (workspace) {
                    workspace.classList.add('open', 'current');
                    const toggle = workspace.querySelector('.moyo-app-workspace-toggle');
                    if (toggle) toggle.setAttribute('aria-expanded', 'true');
                }
            }
        });

        document.querySelectorAll('.moyo-app-workspace-home').forEach(function(link) {
            const wsId = String(link.dataset.wsId || '');
            if (!currentProjId && currentWsId && wsId === currentWsId && currentPath.startsWith('/workspace/')) {
                link.classList.add('active');
            }
        });

        document.querySelectorAll('.moyo-app-sidebar-main-link').forEach(function(link) {
            const path = link.dataset.appPath;
            if (path && currentPath.startsWith(path)) link.classList.add('active');
        });

        const toggleButton = document.getElementById('moyoAppSidebarToggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', function() {
                if (window.innerWidth <= 900) {
                    document.body.classList.toggle('moyo-app-sidebar-mobile-open');
                    const opened = document.body.classList.contains('moyo-app-sidebar-mobile-open');
                    toggleButton.setAttribute('aria-expanded', String(opened));
                    toggleButton.setAttribute('aria-label', opened ? '공간 메뉴 닫기' : '공간 메뉴 열기');
                } else {
                    setDesktopCollapsed(!document.body.classList.contains('moyo-app-sidebar-collapsed'));
                }
            });
        }

        const backdrop = document.getElementById('moyoAppSidebarBackdrop');
        if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);

        sidebar.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 900) closeMobileSidebar();
            });
        });

        initSidebarFriendPreview();
        initFriendModal();

        window.addEventListener('pageshow', normalizeSidebarBackdrop);

        window.addEventListener('resize', function() {
            normalizeSidebarBackdrop();
            if (window.innerWidth > 900) {
                closeMobileSidebar();
                setDesktopCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === 'true');
            } else {
                document.body.classList.remove('moyo-app-sidebar-collapsed');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
