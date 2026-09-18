'use strict';

const workspaceRoot = document.body;
const WORKSPACE_WIDGET_LIMITS = Object.freeze({
board: 3,
    todaySchedule: 3,
    photo: 2,
    poll: 2,
    note: 3
});

const WORKSPACE_CONFIG = {
    wsId: workspaceRoot.dataset.wsId || '',
    contextPath: workspaceRoot.dataset.contextPath || '',
    currentUserId: Number(workspaceRoot.dataset.currentUserId || 0),
    isAdmin: workspaceRoot.dataset.workspaceAdmin === 'true',
    isOwner: workspaceRoot.dataset.workspaceOwner === 'true',
    isMember: workspaceRoot.dataset.workspaceMember === 'true'
};

function workspacePath(path) {
    const contextPath = String(WORKSPACE_CONFIG.contextPath || '').replace(/\/$/, '');
    const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : '/' + String(path || '');
    return contextPath + normalizedPath;
}
function getWorkspaceCommunityConfig() {
    return {
        scope: 'WORKSPACE',
        contextPath: WORKSPACE_CONFIG.contextPath,
        wsId: String(WORKSPACE_CONFIG.wsId || '').trim(),
        currentUserId: WORKSPACE_CONFIG.currentUserId,
        isMember: WORKSPACE_CONFIG.isMember,
        canManageNotice: WORKSPACE_CONFIG.isAdmin || WORKSPACE_CONFIG.isOwner,
        limits: {
            board: WORKSPACE_WIDGET_LIMITS.board,
            schedule: WORKSPACE_WIDGET_LIMITS.todaySchedule,
            poll: WORKSPACE_WIDGET_LIMITS.poll
        },
        retryBoards: 'loadBoardWidgets',
        retryToday: 'loadTodaySchedule',
        retryPolls: 'loadActivePoll',
        scheduleRawFilter: isWorkspaceVisibleTodayEvent
    };
}

function validateWorkspaceCommunityConfig(config) {
    const errors = [];
    if (!config || config.scope !== 'WORKSPACE') errors.push('scope');
    if (!config || !config.wsId) errors.push('wsId');
    if (!config || typeof config.contextPath !== 'string') errors.push('contextPath');
    return errors;
}

function renderWorkspaceCommunityInitError(message) {
    const safeMessage = escapeWorkspaceHtml(message || '공통 위젯을 초기화하지 못했습니다.');
    ['noticeList', 'freeList', 'fileList'].forEach(function (id) {
        const target = document.getElementById(id);
        if (target) target.innerHTML = '<li class="workspace-empty-state is-error">' + safeMessage + '</li>';
    });
    const schedule = document.getElementById('todayScheduleList');
    if (schedule) schedule.innerHTML = '<li class="workspace-empty-state is-error">' + safeMessage + '</li>';
    const poll = document.getElementById('activePollArea');
    if (poll) poll.innerHTML = '<div class="workspace-poll-summary-error">' + safeMessage + '</div>';
}

function getWorkspaceCommunityRenderer() {
    const renderer = window.MoyoCommunityWidgets;
    if (!renderer || typeof renderer.load !== 'function') {
        renderWorkspaceCommunityInitError('공통 위젯 스크립트를 불러오지 못했습니다.');
        console.error('[MOYO] commonCommunityWidgets.js가 로드되지 않았습니다.');
        return null;
    }
    return renderer;
}

        const today = new Date();
        let workspaceActivePollId = null;


        async function postWorkspaceGuestAction(path, values) {
            const form = new URLSearchParams();
            Object.keys(values || {}).forEach(function (key) {
                if (values[key] != null) form.append(key, values[key]);
            });
            const response = await fetch(workspacePath(path), {
                method: 'POST', credentials: 'same-origin',
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
                body: form.toString()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.status || '요청 처리 실패');
            return data;
        }

        function initWorkspaceGuestJoin() {
            if (WORKSPACE_CONFIG.isMember) return;
            const wsName = document.body.dataset.workspaceName || '그룹';
            const openButton = document.getElementById('workspaceOpenJoinBtn');
            const requestButton = document.getElementById('workspaceRequestJoinBtn');
            const cancelButton = document.getElementById('workspaceCancelRequestBtn');
            if (openButton) openButton.addEventListener('click', function () {
                if (typeof window.openJoinProfileModal === 'function') {
                    window.openJoinProfileModal({mode: 'open', workspaceId: WORKSPACE_CONFIG.wsId, workspaceName: wsName});
                }
            });
            if (requestButton) requestButton.addEventListener('click', async function () {
                requestButton.disabled = true;
                try {
                    const data = await postWorkspaceGuestAction('/workspace/api/join-request', {wsId: WORKSPACE_CONFIG.wsId});
                    if (!(data.success === true || data.status === 'SUCCESS' || data.status === 'ALREADY_PENDING')) throw new Error('참여 요청 실패');
                    window.location.reload();
                } catch (error) { alert('참여 요청을 처리하지 못했습니다.'); requestButton.disabled = false; }
            });
            if (cancelButton) cancelButton.addEventListener('click', async function () {
                cancelButton.disabled = true;
                try {
                    const data = await postWorkspaceGuestAction('/workspace/api/join-request/cancel', {wsId: WORKSPACE_CONFIG.wsId});
                    if (!(data.success === true || data.status === 'SUCCESS')) throw new Error('취소 실패');
                    window.location.reload();
                } catch (error) { alert('참여 요청을 취소하지 못했습니다.'); cancelButton.disabled = false; }
            });
        }

        function escapeWorkspaceHtml(value) {
            return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        function toSafeNumber(value) {
            const num = Number(value);
            return Number.isFinite(num) ? num : 0;
        }


        function updateSummaryCard(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = toSafeNumber(value);
        }

        function loadCommunitySummary() {
            fetch(workspacePath('/workspace/api/' + WORKSPACE_CONFIG.wsId + '/community-summary'))
                .then(function(res) { return res.ok ? res.json() : null; })
                .then(function(data) {
                    if (!data) return;
                    updateSummaryCard('noticeCount', data.noticeCount);
                    updateSummaryCard('freeCount', data.freeCount);
                    updateSummaryCard('activePollCount', data.activePollCount);
                    updateSummaryCard('fileCount', data.fileCount);
                    // 위젯 헤더 배지는 각 공통 컴포넌트가 실제 렌더링 결과를 기준으로 관리합니다.
                })
                .catch(function(err) {
                    console.error('커뮤니티 요약 로딩 실패:', err);
                    ['noticeCount', 'freeCount', 'activePollCount', 'fileCount'].forEach(function(id) {
                        const el = document.getElementById(id);
                        if (el) el.textContent = '-';
                    });
                });
        }


        function isWorkspaceVisibleTodayEvent(ev) {
            const rawType = String(ev.itemType || ev.ITEM_TYPE || ev.type || ev.TYPE || '').toUpperCase();
            const rawLabel = String(ev.typeLabel || ev.TYPE_LABEL || ev.scopeLabel || ev.SCOPE_LABEL || '').trim();
            if (rawType === 'PRIVATE' || rawLabel.includes('개인')) return false;
            if (rawType === 'HOLIDAY' || rawLabel.includes('공휴일')) return false;
            return true;
        }


        function toggleTodaySchedule(button) {
            const renderer = getWorkspaceCommunityRenderer();
            if (!renderer) return;
            renderer.toggleToday(getWorkspaceCommunityConfig(), button);
        }
        function loadBoardWidgets() {
            const renderer = getWorkspaceCommunityRenderer();
            if (!renderer) return Promise.resolve();
            return renderer.loadBoards(getWorkspaceCommunityConfig()).catch(function (err) {
                console.error('워크스페이스 게시글 로딩 실패:', err);
            });
        }
        function loadTodaySchedule() {
            const renderer = getWorkspaceCommunityRenderer();
            if (!renderer) return Promise.resolve();
            return renderer.loadToday(getWorkspaceCommunityConfig()).catch(function (err) {
                console.error('오늘 일정 로딩 실패:', err);
            });
        }

        // 공통 커뮤니티 렌더링은 commonCommunityWidgets.js가 전담합니다.
        function loadDashboardWidgets() {
            const config = getWorkspaceCommunityConfig();
            const errors = validateWorkspaceCommunityConfig(config);
            if (errors.length) {
                console.error('[MOYO] 그룹 공통 위젯 설정값 누락:', errors.join(', '), config);
                renderWorkspaceCommunityInitError('그룹 정보를 확인하지 못해 위젯을 불러올 수 없습니다.');
                return;
            }

            const renderer = getWorkspaceCommunityRenderer();
            if (!renderer) return;

            renderer.load(config).catch(function (err) {
                console.error('그룹 공통 위젯 초기화 실패:', err);
            });
            loadCommunitySummary();
        }
        function loadActivePoll() {
            const renderer = getWorkspaceCommunityRenderer();
            if (!renderer) return Promise.resolve();
            return renderer.loadPolls(getWorkspaceCommunityConfig()).catch(function (err) {
                console.error('워크스페이스 투표 로딩 실패:', err);
            });
        }










        function leaveWorkspace() {
            setWorkspaceGroupMenuOpen(false);

            if (WORKSPACE_CONFIG.isOwner) {
                openOwnerLeaveGuideModal();
                return;
            }

            if (!confirm('정말 이 그룹을 탈퇴하시겠습니까?')) return;
            const params = new URLSearchParams();
            params.append('wsId', WORKSPACE_CONFIG.wsId);
            fetch(workspacePath('/workspace/api/leave'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
                .then(function(res) { return res.text(); })
                .then(function(result) {
                    if (result === 'SUCCESS') {
                        alert('그룹에서 탈퇴했습니다.');
                        location.href = workspacePath('/workspace/list');
                        return;
                    }
                    if (result === 'OWNER_TRANSFER_REQUIRED' || result === 'ADMIN_TRANSFER_REQUIRED' || result === 'OWNER_CANNOT_LEAVE') {
                        openOwnerLeaveGuideModal();
                        return;
                    }
                    if (result === 'PROJECT_LEADER_TRANSFER_REQUIRED') {
                        alert('진행 중인 그룹 프로젝트의 팀장을 다른 멤버에게 위임한 뒤 그룹에서 탈퇴할 수 있습니다.');
                        return;
                    }
                    if (result === 'NOT_MEMBER') {
                        alert('이미 탈퇴했거나 현재 그룹 멤버가 아닙니다.');
                        location.href = workspacePath('/workspace/list');
                        return;
                    }
                    if (result === 'WORKSPACE_NOT_ACTIVE') {
                        alert('현재 상태에서는 그룹 탈퇴를 처리할 수 없습니다.');
                        return;
                    }
                    if (result === 'LOGIN_REQUIRED') {
                        location.href = workspacePath('/login');
                        return;
                    }
                    alert('탈퇴 처리 중 오류가 발생했습니다.');
                })
                .catch(function(error) {
                    console.error('그룹 탈퇴 실패:', error);
                    alert('탈퇴 처리 중 오류가 발생했습니다.');
                });
        }

        function openOwnerLeaveGuideModal() {
            const modal = document.getElementById('ownerLeaveGuideModal');
            if (!modal) return;
            modal.hidden = false;
            document.body.classList.add('workspace-modal-open');
            const cancelButton = modal.querySelector('[data-owner-leave-cancel]');
            if (cancelButton) cancelButton.focus();
        }

        function closeOwnerLeaveGuideModal() {
            const modal = document.getElementById('ownerLeaveGuideModal');
            if (!modal) return;
            modal.hidden = true;
            document.body.classList.remove('workspace-modal-open');
        }

        function goToOwnerTransfer() {
            location.href = workspacePath('/workspace/settings?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&tab=members');
        }

        function openCalendarModal() {
            const selectedDate = document.querySelector('.moyo-mini-calendar')?.dataset.selectedDate || '';
            if (!window.MoyoQuickCalendarCreate) {
                location.href = workspacePath('/calendar?scope=WS&calendarContext=GROUP&wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId));
                return;
            }
            window.MoyoQuickCalendarCreate.open({
                scopeType: 'WS',
                wsId: WORKSPACE_CONFIG.wsId,
                scopeLabel: WORKSPACE_CONFIG.wsName || document.body.dataset.workspaceName || '현재 그룹',
                date: selectedDate || undefined,
                onSaved: function () {
                    if (window.WorkspaceMiniCalendarAdapter && typeof window.WorkspaceMiniCalendarAdapter.reload === 'function') {
                        window.WorkspaceMiniCalendarAdapter.reload();
                    } else {
                        window.location.reload();
                    }
                }
            });
        }

        // Inline handler와 동적 위젯 모두 같은 공통 모달 진입점을 사용한다.
        window.openCalendarModal = openCalendarModal;
        // 기존 공통 미니 달력 인라인 호출과의 호환용 진입점
        window.openWorkspaceCalendarEventForm = openCalendarModal;

        document.addEventListener('click', function (event) {
            const trigger = event.target.closest('[data-workspace-calendar-create]');
            if (!trigger) return;
            event.preventDefault();
            openCalendarModal();
        });


        /* ===== Workspace shared note widget ===== */
        document.addEventListener('DOMContentLoaded', function() {
            initWorkspaceGuestJoin();
            if (!WORKSPACE_CONFIG.isMember) return;
            loadDashboardWidgets();
        });


/* ===== Group hero menu ===== */
function setWorkspaceGroupMenuOpen(open) {
    const menu = document.getElementById('workspaceGroupMenu');
    const trigger = document.getElementById('workspaceGroupMenuTrigger');
    if (!menu || !trigger) return;

    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) {
        const triggerRect = trigger.getBoundingClientRect();
        const menuWidth = menu.offsetWidth || 168;
        const viewportGap = 12;
        const left = Math.min(
            window.innerWidth - menuWidth - viewportGap,
            Math.max(viewportGap, triggerRect.right - menuWidth)
        );

        menu.style.left = left + 'px';
        menu.style.top = (triggerRect.bottom + 8) + 'px';
        menu.style.right = 'auto';
    } else {
        menu.style.left = '';
        menu.style.top = '';
        menu.style.right = '';
    }
}

function toggleWorkspaceGroupMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('workspaceGroupMenu');
    setWorkspaceGroupMenuOpen(menu ? menu.hidden : false);
}

function initWorkspaceGroupMenu() {
    const trigger = document.getElementById('workspaceGroupMenuTrigger');
    if (!trigger || trigger.dataset.menuBound === 'true') return;

    trigger.dataset.menuBound = 'true';

    trigger.addEventListener('click', function(event) {
        event.preventDefault();
        toggleWorkspaceGroupMenu(event);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkspaceGroupMenu, { once: true });
} else {
    initWorkspaceGroupMenu();
}

function openMyWorkspaceProfileFromMenu() {
    setWorkspaceGroupMenuOpen(false);
    if (typeof openWorkspaceMemberActivityProfile === 'function' && WORKSPACE_CONFIG.currentUserId) {
        openWorkspaceMemberActivityProfile(WORKSPACE_CONFIG.currentUserId);
    }
}

document.addEventListener('click', function(event) {
    const wrap = document.querySelector('.workspace-group-menu-wrap');
    if (wrap && !wrap.contains(event.target)) {
        setWorkspaceGroupMenuOpen(false);
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        setWorkspaceGroupMenuOpen(false);
    }
});


document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const ownerLeaveModal = document.getElementById('ownerLeaveGuideModal');
        if (ownerLeaveModal && !ownerLeaveModal.hidden) {
            closeOwnerLeaveGuideModal();
        }
    }
});