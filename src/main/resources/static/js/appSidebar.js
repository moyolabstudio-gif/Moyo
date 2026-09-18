(function() {
    'use strict';

    const STORAGE_COLLAPSED = 'moyo.appSidebar.collapsed';
    const STORAGE_OPEN_WS = 'moyo.appSidebar.openWorkspaces';
    const SIDEBAR_MOBILE_BREAKPOINT = 1200;
    const UPDATED_FRIEND_WINDOW_DAYS = 7;
    const UPDATED_FRIEND_MAX_ITEMS = 8;
    let CONTEXT_PATH = '';

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
        const isMobile = window.innerWidth <= SIDEBAR_MOBILE_BREAKPOINT;
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


    function appUrl(path) {
        const value = String(path || '');
        if (!value) return CONTEXT_PATH || '/';
        if (/^https?:\/\//i.test(value)) return value;
        if (!value.startsWith('/')) return (CONTEXT_PATH || '') + '/' + value;
        return (CONTEXT_PATH || '') + value;
    }

    function fetchJson(url) {
        return fetch(appUrl(url), { credentials: 'same-origin' }).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
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

    function parseActivityTime(raw) {
        if (!raw) return 0;
        const time = new Date(raw).getTime();
        return Number.isFinite(time) ? time : 0;
    }

    function friendActivityMeta(friend) {
        const candidates = [];

        function add(raw, label, contentType, contentId) {
            const time = parseActivityTime(raw);
            if (time > 0) candidates.push({ time: time, label: label, contentType: contentType || '', contentId: contentId || '' });
        }

        // /friends/api/list가 제공하는 공개 활동과 실제 원본 콘텐츠 ID를 함께 사용한다.
        add(friend.latestPhotoAt, '새 사진', 'PHOTO', friend.latestPhotoPostId);
        add(friend.latestNoteAt, '새 노트', 'NOTE', friend.latestNoteId);
        add(friend.latestProfileAt, '프로필 변경', 'PROFILE', '');

        const relationStatus = String(friend.relationStatus || friend.status || '').toUpperCase();
        if (relationStatus === 'ACCEPTED') {
            add(friend.respondedAt || friend.updatedAt, '친구가 됨');
        }

        if (!candidates.length) return { time: 0, label: '' };
        candidates.sort(function(a, b) { return b.time - a.time; });
        return candidates[0];
    }

    function friendActivityTime(friend) {
        return friendActivityMeta(friend).time;
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
        if (!box || !updatedBox) return;

        function friendInitial(name) {
            return String(name || '친구').substring(0, 1).toUpperCase();
        }

        function avatarHtml(friend, name) {
            const image = friendImage(friend);
            const safeName = escapeText(name);
            const initial = escapeText(friendInitial(name));
            return image
                ? '<span class="moyo-app-sidebar-friend-avatar has-image"><img src="' + escapeText(image) + '" alt="' + safeName + '" onerror="this.parentElement.classList.remove(\'has-image\');this.parentElement.textContent=\'' + initial + '\';"></span>'
                : '<span class="moyo-app-sidebar-friend-avatar">' + initial + '</span>';
        }

        function renderEmpty(message) {
            updatedBox.innerHTML = '<div class="moyo-app-sidebar-friend-chip skeleton">' +
                '<span class="moyo-app-sidebar-friend-avatar">👥</span>' +
                '<span>' + escapeText(message) + '</span>' +
                '</div>';
        }

        function render(friends) {
            const cutoff = Date.now() - (UPDATED_FRIEND_WINDOW_DAYS * 86400000);
            const byUser = new Map();

            (Array.isArray(friends) ? friends : []).forEach(function(friend) {
                const relationStatus = String(friend.relationStatus || friend.status || '').toUpperCase();
                if (relationStatus && relationStatus !== 'ACCEPTED') return;

                const userId = String(friend.userId || friend.USER_ID || friend.id || '');
                if (!userId) return;

                const activity = friendActivityMeta(friend);
                if (!activity.time || activity.time < cutoff) return;

                const previous = byUser.get(userId);
                if (!previous || activity.time > previous.activity.time) {
                    byUser.set(userId, { friend: friend, activity: activity, userId: userId });
                }
            });

            const updatedFriends = Array.from(byUser.values())
                .sort(function(a, b) {
                    if (b.activity.time !== a.activity.time) return b.activity.time - a.activity.time;
                    return friendDisplayName(a.friend).localeCompare(friendDisplayName(b.friend), 'ko');
                })
                .slice(0, UPDATED_FRIEND_MAX_ITEMS);

            if (!updatedFriends.length) {
                renderEmpty('최근 업데이트 없음');
                return;
            }

            updatedBox.innerHTML = updatedFriends.map(function(item) {
                const friend = item.friend;
                const name = friendDisplayName(friend);
                const reason = item.activity.label;
                let profilePath = '/users/profile?userId=' + encodeURIComponent(item.userId);
                if (item.activity.contentType === 'PHOTO' && item.activity.contentId) {
                    profilePath += '&openPhotoId=' + encodeURIComponent(item.activity.contentId);
                } else if (item.activity.contentType === 'NOTE' && item.activity.contentId) {
                    profilePath += '&openNoteId=' + encodeURIComponent(item.activity.contentId);
                }
                return '<a class="moyo-app-sidebar-friend-chip" href="' + escapeText(appUrl(profilePath)) + '" title="' + escapeText(name + ' · ' + reason) + '">' +
                    avatarHtml(friend, name) +
                    '<span class="moyo-app-sidebar-friend-name">' + escapeText(name) + '</span>' +
                    '<span class="moyo-app-sidebar-friend-reason">' + escapeText(reason) + '</span>' +
                    '</a>';
            }).join('');
        }

        fetchJson('/friends/api/list')
            .then(function(data) { render(data.friends || []); })
            .catch(function() { renderEmpty('불러오기 실패'); });
    }

    let commonFriendToolsPromise = null;

    function ensureStylesheet(href, marker) {
        if (document.querySelector('link[data-' + marker + ']')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset[marker] = 'true';
        document.head.appendChild(link);
    }

    function loadScriptOnce(src, test) {
        if (typeof test === 'function' && test()) return Promise.resolve();
        return new Promise(function(resolve, reject) {
            const existing = Array.from(document.scripts).find(function(script) {
                return script.src && script.src.indexOf(src) !== -1;
            });
            if (existing) {
                if (typeof test === 'function' && test()) return resolve();
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        });
    }

    function ensureCommonFriendTools() {
        if (window.CommonPeopleModal && window.CommonFriendAdapter && typeof window.CommonFriendAdapter.openAdd === 'function') {
            return Promise.resolve();
        }
        if (commonFriendToolsPromise) return commonFriendToolsPromise;
        ensureStylesheet(appUrl('/css/commonPeopleModal.css?v=sidebar-friend-add-v1'), 'moyoCommonPeopleCss');
        commonFriendToolsPromise = loadScriptOnce(appUrl('/js/commonPeopleModal.js?v=sidebar-friend-add-v1'), function() {
            return !!window.CommonPeopleModal;
        }).then(function() {
            return loadScriptOnce(appUrl('/js/friendPeopleAdapter.js?v=sidebar-friend-add-v1'), function() {
                return !!window.CommonFriendAdapter;
            });
        }).catch(function(error) {
            commonFriendToolsPromise = null;
            throw error;
        });
        return commonFriendToolsPromise;
    }

    function openCommonFriendAddModal() {
        closeMobileSidebar();
        ensureCommonFriendTools().then(function() {
            if (!window.CommonFriendAdapter || typeof window.CommonFriendAdapter.openAdd !== 'function') {
                throw new Error('친구 추가 공통 모달을 불러오지 못했습니다.');
            }
            window.CommonFriendAdapter.openAdd({
                contextPath: CONTEXT_PATH,
                onUpdated: initSidebarFriendPreview
            });
        }).catch(function(error) {
            console.error(error);
            window.location.href = appUrl('/friends');
        });
    }

    function initFriendAddTrigger() {
        document.addEventListener('click', function(event) {
            const trigger = event.target.closest('[data-moyo-friend-add-open]');
            if (!trigger) return;
            event.preventDefault();
            event.stopPropagation();
            openCommonFriendAddModal();
        });
    }

    function init() {
        const sidebar = document.getElementById('moyoAppSidebar');
        if (!sidebar) return;

        document.body.classList.add('moyo-app-sidebar-enabled');
        CONTEXT_PATH = String(sidebar.dataset.contextPath || '').replace(/\/$/, '');
        normalizeSidebarBackdrop();

        const params = new URLSearchParams(window.location.search);
        const rawCurrentPath = window.location.pathname;
        const currentPath = CONTEXT_PATH && rawCurrentPath.startsWith(CONTEXT_PATH)
            ? (rawCurrentPath.slice(CONTEXT_PATH.length) || '/')
            : rawCurrentPath;
        const currentWsId = String(sidebar.dataset.currentWsId || params.get('wsId') || '');
        const currentProjId = String(sidebar.dataset.currentProjId || params.get('projId') || '');
        const openedIds = readOpenWorkspaceIds();

        if (window.innerWidth > SIDEBAR_MOBILE_BREAKPOINT) {
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

        document.querySelectorAll('[data-app-path]').forEach(function(link) {
            const path = String(link.dataset.appPath || '');
            if (!path) return;
            const exactOrChild = currentPath === path || currentPath.startsWith(path + '/');
            if (exactOrChild) link.classList.add('active');
        });

        const toggleButton = document.getElementById('moyoAppSidebarToggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', function() {
                if (window.innerWidth <= SIDEBAR_MOBILE_BREAKPOINT) {
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
                if (window.innerWidth <= SIDEBAR_MOBILE_BREAKPOINT) closeMobileSidebar();
            });
        });

        initSidebarFriendPreview();
        // 헤더/공통 모달에서 친구 관계가 바뀐 직후 같은 화면에서 즉시 갱신할 수 있도록 공개 훅을 제공한다.
        window.refreshMoyoSidebarFriends = initSidebarFriendPreview;
        initFriendAddTrigger();

        window.addEventListener('pageshow', normalizeSidebarBackdrop);

        window.addEventListener('resize', function() {
            normalizeSidebarBackdrop();
            if (window.innerWidth > SIDEBAR_MOBILE_BREAKPOINT) {
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
