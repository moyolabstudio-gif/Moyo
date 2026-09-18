/**
 * MOYO 프로젝트 메인
 * 공통 설정, 페이지 초기화, 프로젝트 설정/삭제를 담당합니다.
 */

window.PROJECT_MAIN_CONFIG = window.PROJECT_MAIN_CONFIG || {
    projectLeaderId: '',
    loginUserId: '',
    projectStartDate: '',
    projectEndDate: '',
    projectId: '',
    paramProjId: '',
    wsId: '',
    paramWsId: '',
    isPersonalProject: false,
    projectScope: 'GROUP',
    canManageProject: false
};

/**
 * 프로젝트 화면 전체에서 사용하는 날짜 공통 함수입니다.
 * 업무 스크립트의 로드 여부와 관계없이 기간별·시간별·주간 계획에서 사용합니다.
 */
function parseProjectDate(value) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    const raw = String(value || '').trim();
    if (!raw) return null;

    const datePart = raw.replace(/[./]/g, '-').substring(0, 10);
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(datePart);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);

    if (
        parsed.getFullYear() !== year
        || parsed.getMonth() !== month - 1
        || parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
}

function formatProjectDate(value) {
    const date = value instanceof Date ? value : parseProjectDate(value);
    if (!date || Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function calculateProjectDday() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    const badge = document.getElementById('projectDdayBadge');
    if (!badge) return;

    const endDate = parseProjectDate(config.projectEndDate);
    if (!endDate) {
        badge.innerText = '기간 미정';
        badge.className = 'side-dday project-dday-badge dday-ended';
        return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);

    if (diffDays > 0) {
        badge.innerText = 'D-' + diffDays;
        badge.className = 'side-dday project-dday-badge';
    } else if (diffDays === 0) {
        badge.innerText = 'D-Day';
        badge.className = 'side-dday project-dday-badge dday-today';
    } else {
        badge.innerText = '종료됨';
        badge.className = 'side-dday project-dday-badge dday-ended';
    }
}

// 다른 프로젝트 기능 파일에서도 명시적으로 접근할 수 있도록 공개합니다.
window.parseProjectDate = parseProjectDate;
window.formatProjectDate = formatProjectDate;
window.calculateProjectDday = calculateProjectDday;

function isPersonalProjectMain() {
    return !!(window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.isPersonalProject);
}

function getProjectMainProjectId() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    const params = new URLSearchParams(window.location.search);
    return config.projectId || config.paramProjId || params.get('projId') || '';
}

function getProjectMainWorkspaceId() {
    if (isPersonalProjectMain()) return '';
    const config = window.PROJECT_MAIN_CONFIG || {};
    const params = new URLSearchParams(window.location.search);
    const wsId = config.wsId || config.paramWsId || params.get('wsId') || '';
    return wsId && wsId !== 'null' && wsId !== 'undefined' ? wsId : '';
}

function getProjectMainContextPath() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    return config.contextPath || '';
}


function clearProjectCalendarPlanDeepLink() {
    const url = new URL(window.location.href);
    ['calendarPlanType', 'calendarPlanId', 'fromCalendar'].forEach(function(key) {
        url.searchParams.delete(key);
    });
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
}

async function openProjectPlanFromCalendarQuery() {
    const params = new URLSearchParams(window.location.search || '');
    if (params.get('fromCalendar') !== 'Y') return false;

    const type = String(params.get('calendarPlanType') || '').trim().toUpperCase();
    const rawId = String(params.get('calendarPlanId') || '').trim();
    const planId = Number(rawId);

    if (!type || !Number.isFinite(planId) || planId <= 0) return false;

    try {
        if (type === 'PHASE') {
            if (typeof window.openProjectPlanSharedModal !== 'function') return false;

            const item = (typeof projectGanttItems !== 'undefined' ? projectGanttItems : [])
                .find(function(plan) {
                    return plan
                        && plan.type === 'PERIOD_PLAN'
                        && Number(plan.entityId) === planId;
                });

            if (!item) return false;

            window.openProjectPlanSharedModal({
                mode: 'PERIOD_PLAN',
                startDate: item.startDate || item.start || '',
                endDate: item.endDate || item.end || item.startDate || item.start || '',
                item: item
            });
            clearProjectCalendarPlanDeepLink();
            return true;
        }

        if (type === 'WEEKLY_PLAN') {
            if (typeof loadProjectWeeklyPlanItems === 'function') {
                await loadProjectWeeklyPlanItems();
            }
            if (typeof openWeeklyPlanEditor !== 'function') return false;
            openWeeklyPlanEditor(planId);
            clearProjectCalendarPlanDeepLink();
            return true;
        }

        if (type === 'TIME_PLAN') {
            if (typeof loadTimeScheduleItems === 'function') {
                await loadTimeScheduleItems();
            }
            if (typeof openTimeSchedulePlanEditor !== 'function') return false;
            openTimeSchedulePlanEditor(planId);
            clearProjectCalendarPlanDeepLink();
            return true;
        }
    } catch (error) {
        console.error('[프로젝트 계획] 달력 딥링크 열기 실패:', error);
    }

    return false;
}

window.openProjectPlanFromCalendarQuery = openProjectPlanFromCalendarQuery;

function buildProjectMainQuery(includeWorkspace) {
    const projId = getProjectMainProjectId();
    const query = new URLSearchParams();
    if (projId) query.set('projId', projId);
    if (includeWorkspace !== false && !isPersonalProjectMain()) {
        const wsId = getProjectMainWorkspaceId();
        if (wsId) query.set('wsId', wsId);
    }
    return query;
}


        let projectMemberPanelExpanded = false;
        let cachedProjectMembers = [];
        let cachedProjectTasks = [];

function goProjectSettings(tabName) {
    const query = buildProjectMainQuery(true);
    if (!query.get('projId')) {
        alert('프로젝트 설정으로 이동할 수 없습니다.');
        return;
    }

    if (tabName === 'members') {
        query.set('tab', 'members');
    }

    closeProjectMainMoreMenu();
    location.href = '/project/settings?' + query.toString();
}

function goProjectList() {
    closeProjectMainMoreMenu();

    if (isPersonalProjectMain()) {
        location.href = '/project/manage';
        return;
    }

    const query = buildProjectMainQuery(true);
    const wsId = query.get('wsId');
    if (!wsId) {
        alert('프로젝트 목록으로 이동할 수 없습니다.');
        return;
    }

    location.href = '/project/list?wsId=' + encodeURIComponent(wsId);
}

function setProjectMainMoreMenuOpen(open) {
    const button = document.getElementById('projectMainMoreButton');
    const menu = document.getElementById('projectMainMoreMenu');
    if (!button || !menu) return;

    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));

    if (open) {
        const rect = button.getBoundingClientRect();
        const menuWidth = menu.offsetWidth || 168;
        const viewportGap = 12;
        const left = Math.min(
            window.innerWidth - menuWidth - viewportGap,
            Math.max(viewportGap, rect.right - menuWidth)
        );

        menu.style.position = 'fixed';
        menu.style.left = left + 'px';
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = 'auto';
        menu.style.zIndex = '1200';
    } else {
        menu.style.position = '';
        menu.style.left = '';
        menu.style.top = '';
        menu.style.right = '';
        menu.style.zIndex = '';
    }
}

function toggleProjectMainMoreMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('projectMainMoreMenu');
    setProjectMainMoreMenuOpen(menu ? menu.hidden : false);
}

function closeProjectMainMoreMenu() {
    setProjectMainMoreMenuOpen(false);
}

document.addEventListener('click', function(event) {
    if (!event.target.closest('.project-main-more')) {
        closeProjectMainMoreMenu();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeProjectMainMoreMenu();
    }
});



let projectCalendarSchedules = [];

// 페이지 로드 시 멤버 리스트 불러오기
		document.addEventListener('DOMContentLoaded', function() {
		    loadKanbanBoard();
            // 멤버 목록의 최초 조회는 CommonMemberDataAdapter가 단독으로 담당합니다.
            if (!isPersonalProjectMain()) {
                loadProjectCommunityWidgets(getProjectMainProjectId());
            }
		    setTimeout(limitMainWidgetItems, 300);
		    setTimeout(limitMainWidgetItems, 900);
            const planLoader = window.MoyoProjectPlanLoader;
            const planReady = planLoader && typeof planLoader.loadWhenIdle === 'function'
                ? planLoader.loadWhenIdle()
                : Promise.resolve();

            planReady.then(function() {
                if (typeof window.initProjectTimeline !== 'function') {
                    throw new Error('프로젝트 계획 초기화 함수를 찾을 수 없습니다.');
                }
                return window.initProjectTimeline();
            }).then(function() {
                return openProjectPlanFromCalendarQuery();
            }).catch(function(error) {
                console.error('[프로젝트 계획] 초기화 실패:', error);
            });
		    calculateProjectDday();
		});
