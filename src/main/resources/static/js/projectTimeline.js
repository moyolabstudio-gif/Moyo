/** MOYO 프로젝트 계획 탭·초기화·데이터 조율 */
/* ===== 프로젝트 계획 독립 기능 분리 ===== */
let projectGanttItems = [];
let projectPlanActiveTab = null;
let projectPlanServerFeatures = { gantt: false, timeSchedule: false, weeklyRoutine: false, timeRangeStart: '', timeRangeEnd: '' };
let projectPlanFeatureDataReady = false;
function getActualProjectPlanFeatures() {
    return {
        gantt: (projectGanttItems || []).some(function(item) {
            return item && item.type === 'PERIOD_PLAN';
        }),
        timeSchedule: (projectTimeScheduleItems || []).length > 0 || (projectCalendarSchedules || []).some(function(item) {
            return item && isScheduleTimeEnabled(item);
        }),
        weekly: (typeof projectWeeklyPlanItems !== 'undefined' ? projectWeeklyPlanItems : []).length > 0
    };
}

function getEffectiveProjectPlanFeatures() {
    const actual = getActualProjectPlanFeatures() || {};
    const server = projectPlanServerFeatures || {};
    return {
        gantt: !!(server.gantt || actual.gantt),
        timeSchedule: !!(server.timeSchedule || actual.timeSchedule),
        weekly: !!(server.weeklyRoutine || actual.weekly)
    };
}

function canManageProjectPlan() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    if (config.isPersonalProject === true || config.canManageProject === true) return true;
    const context = window.__projectPlanModalContext || {};
    const item = context.item || {};
    const raw = item.editorUserIds || item.EDITOR_USER_IDS || [];
    const loginUserId = Number(config.loginUserId || 0);
    return Array.isArray(raw) && raw.map(Number).includes(loginUserId);
}

function syncProjectPlanActionLabels(features) {
    features = features || getEffectiveProjectPlanFeatures();
    const actionGroup = document.querySelector('.project-plan-guide__create-actions');
    const addButton = document.getElementById('openProjectPlanTypeChooserBtn');

    if (!projectPlanFeatureDataReady) {
        if (addButton) addButton.hidden = true;
        if (actionGroup) actionGroup.hidden = true;
        return;
    }

    const canManage = canManageProjectPlan();
    if (addButton) {
        addButton.hidden = !canManage;
        const label = addButton.querySelector('span');
        const allCreated = features.gantt && features.timeSchedule && features.weekly;
        if (label) label.textContent = allCreated ? '계획 관리' : '계획 추가';
        const icon = addButton.querySelector('i');
        if (icon) icon.className = allCreated ? 'fa-solid fa-sliders' : 'fa-solid fa-plus';
    }
    if (actionGroup) actionGroup.hidden = !canManage;
}

function syncProjectPlanTypeChooser() {
    const features = getEffectiveProjectPlanFeatures();
    const states = { GANTT: features.gantt, TIME_SCHEDULE: features.timeSchedule, WEEKLY: features.weekly };
    const hasCreated = states.GANTT || states.TIME_SCHEDULE || states.WEEKLY;
    const title = document.getElementById('projectPlanTypeChooserTitle');
    const description = title && title.parentElement ? title.parentElement.querySelector('p') : null;
    if (title) title.textContent = hasCreated ? '프로젝트 계획 관리' : '어떤 계획을 만들까요?';
    if (description) description.textContent = hasCreated
        ? '필요한 계획표를 추가하거나 만들어진 계획표를 관리하세요.'
        : '프로젝트에 어울리는 방식을 선택하세요.';

    document.querySelectorAll('[data-plan-type-option]').forEach(function(option) {
        const created = !!states[option.dataset.planTypeOption];
        option.classList.toggle('is-created', created);
        const status = option.querySelector('[data-plan-type-status]');
        const create = option.querySelector('[data-plan-create]');
        const remove = option.querySelector('[data-plan-remove]');
        if (status) status.textContent = created ? '생성 완료' : '미생성';
        if (create) create.hidden = created;
        if (remove) remove.hidden = !created;
    });
}

function openProjectPlanTypeChooser() {
    if (!canManageProjectPlan()) return;
    const modal = document.getElementById('projectPlanTypeChooser');
    if (!modal) return;
    syncProjectPlanTypeChooser();
    modal.hidden = false;
    document.body.classList.add('project-plan-type-modal-open');
}

function closeProjectPlanTypeChooser() {
    const modal = document.getElementById('projectPlanTypeChooser');
    if (modal) modal.hidden = true;
    document.body.classList.remove('project-plan-type-modal-open');
}


function getProjectPlanTypeName(type) {
    if (type === 'GANTT') return '기간별 계획';
    if (type === 'TIME_SCHEDULE') return '시간별 계획표';
    return '주간 계획표';
}

async function removeProjectPlanFeature(type) {
    if (!canManageProjectPlan()) return;
    const features = getEffectiveProjectPlanFeatures();
    const created = type === 'GANTT' ? features.gantt : (type === 'TIME_SCHEDULE' ? features.timeSchedule : features.weekly);
    if (!created) return;
    const name = getProjectPlanTypeName(type);
    if (!window.confirm(name + '를 제거할까요?\n해당 계획표에 등록된 모든 계획도 함께 삭제되며 되돌릴 수 없습니다.')) return;

    try {
        const response = await fetch(getProjectMainContextPath() + '/project/api/plan-features/' + encodeURIComponent(type)
            + '?projId=' + encodeURIComponent(getCurrentProjectId()), {
            method: 'DELETE', credentials: 'same-origin', headers: { Accept: 'application/json' }
        });
        const body = await response.json().catch(function() { return {}; });
        if (!response.ok) throw new Error(body.message || name + '를 제거하지 못했습니다.');
        const featureState = applyProjectPlanServerFeature(body && body.feature ? body.feature : {});
        if (type === 'GANTT') projectGanttItems = (projectGanttItems || []).filter(function(item) { return item && item.type !== 'PERIOD_PLAN'; });
        if (type === 'TIME_SCHEDULE') projectTimeScheduleItems = [];
        if (type === 'WEEKLY' && typeof projectWeeklyPlanItems !== 'undefined') projectWeeklyPlanItems = [];
        syncProjectPlanFeatureUi();
        syncProjectPlanTypeChooser();
        syncProjectPlanActionLabels(featureState);
    } catch (error) {
        console.error('[프로젝트 계획] 계획표 제거 실패:', error);
        alert(error.message || name + '를 제거하지 못했습니다.');
    }
}

function chooseProjectPlanType(type) {
    closeProjectPlanTypeChooser();
    if (type === 'GANTT') {
        const features = getEffectiveProjectPlanFeatures();
        if (!features.gantt) createProjectPlanFeature('GANTT');
        else {
            setProjectPlanGuideExpanded(true, true);
            selectProjectPlanTab('GANTT');
        }
        return;
    }
    if (type === 'TIME_SCHEDULE') {
        const range = ensureTimePlanRange();
        if (!range) {
            openTimePlanRangeModal(true);
            return;
        }
        const features = getEffectiveProjectPlanFeatures();
        if (!features.timeSchedule) createProjectPlanFeature('TIME_SCHEDULE');
        else {
            setProjectPlanGuideExpanded(true, true);
            selectProjectPlanTab('TIME_SCHEDULE');
        }
        return;
    }
    if (type === 'WEEKLY') {
        const features = getEffectiveProjectPlanFeatures();
        if (!features.weekly) createProjectPlanFeature('WEEKLY');
        else {
            setProjectPlanGuideExpanded(true, true);
            selectProjectPlanTab('WEEKLY');
        }
    }
}

document.addEventListener('click', function(event) {
    const modal = document.getElementById('projectPlanTypeChooser');
    if (modal && !modal.hidden && event.target === modal) closeProjectPlanTypeChooser();
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') { closeProjectPlanTypeChooser(); closeTimePlanRangeModal(); if (typeof closeWeeklyPlanModal === 'function') closeWeeklyPlanModal(); }
});

async function createProjectPlanFeature(type) {
    if (!canManageProjectPlan()) return;
    const payload = { projId: getCurrentProjectId() };
    if (type === 'GANTT') payload.periodEnabledYn = 'Y';
    else if (type === 'TIME_SCHEDULE') {
        payload.timeEnabledYn = 'Y';
        const range = ensureTimePlanRange();
        if (range) { payload.timeRangeStartDate = range.start; payload.timeRangeEndDate = range.end; }
    } else if (type === 'WEEKLY') payload.weeklyEnabledYn = 'Y';
    try {
        const feature = await saveProjectPlanFeature(payload);
        applyProjectPlanServerFeature(feature);
        if (type === 'GANTT') {
            selectedGanttScale = 'DAY';
            try { localStorage.setItem(getProjectTimelineScaleStorageKey(), 'DAY'); } catch (error) {}
        }
        syncProjectPlanFeatureUi(type);
        setProjectPlanGuideExpanded(true, true);
    } catch (error) {
        console.error('[프로젝트 계획] 기능 생성 실패:', error);
        alert(error.message || '계획 기능을 생성하지 못했습니다.');
    }
}

function selectProjectPlanTab(type) {
    const features = getEffectiveProjectPlanFeatures();
    if ((type === 'GANTT' && !features.gantt) || (type === 'TIME_SCHEDULE' && !features.timeSchedule) || (type === 'WEEKLY' && !features.weekly)) return;
    projectPlanActiveTab = type;
    document.querySelectorAll('[data-plan-tab]').forEach(function(tab) {
        const active = tab.dataset.planTab === type;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-plan-panel]').forEach(function(panel) {
        panel.hidden = panel.dataset.planPanel !== type;
    });
    if (type === 'GANTT') renderProjectGantt(getGanttPlanSchedules());
    if (type === 'TIME_SCHEDULE') if (typeof window.renderTimeSchedule === 'function') window.renderTimeSchedule();
    if (type === 'WEEKLY' && typeof renderWeeklyPlan === 'function') renderWeeklyPlan();
    syncProjectPlanActionLabels(features);
}

function syncProjectPlanFeatureUi(preferredTab) {
    const features = getEffectiveProjectPlanFeatures();

    const ganttTab = document.getElementById('ganttPlanTab');
    const timeScheduleTab = document.getElementById('timeScheduleTab');
    const weeklyPlanTab = document.getElementById('weeklyPlanTab');
    const workspace = document.getElementById('projectPlanWorkspace');
    const empty = document.getElementById('projectPlanEmpty');
    const hasAnyPlanFeature = features.gantt || features.timeSchedule || features.weekly;
    const toggle = document.getElementById('projectTimelineToggle');
    const expandable = document.getElementById('projectTimelineExpandable');

    if (ganttTab) ganttTab.hidden = !features.gantt;
    if (timeScheduleTab) timeScheduleTab.hidden = !features.timeSchedule;
    if (weeklyPlanTab) weeklyPlanTab.hidden = !features.weekly;
    if (workspace) workspace.hidden = !hasAnyPlanFeature;
    if (empty) empty.hidden = true;
    if (toggle) toggle.hidden = !hasAnyPlanFeature;

    if (!hasAnyPlanFeature) {
        projectPlanActiveTab = null;
        if (expandable) expandable.hidden = true;
        setProjectPlanGuideExpanded(false, false);
    } else {
        if (expandable) expandable.hidden = false;

        // 새로고침 뒤에도 사용자가 마지막으로 펼쳐 둔 상태를 복원한다.
        // 저장값이 없는 첫 진입은 기존처럼 접힌 상태를 유지한다.
        const savedExpanded = typeof readProjectPlanGuidePreference === 'function'
            ? readProjectPlanGuidePreference()
            : null;
        if (savedExpanded !== null) {
            setProjectPlanGuideExpanded(savedExpanded, false);
        }
    }


    let next = preferredTab || projectPlanActiveTab;
    if (next === 'GANTT' && !features.gantt) next = null;
    if (next === 'TIME_SCHEDULE' && !features.timeSchedule) next = null;
    if (next === 'WEEKLY' && !features.weekly) next = null;
    if (!next) next = features.gantt ? 'GANTT' : (features.timeSchedule ? 'TIME_SCHEDULE' : (features.weekly ? 'WEEKLY' : null));
    if (next) selectProjectPlanTab(next);

    syncProjectPlanActionLabels(features);

    // 두 데이터 조회와 두 버튼 문구 확정이 모두 끝난 뒤 한 번에 노출한다.
    const actionGroup = document.querySelector('.project-plan-guide__create-actions');
    if (actionGroup) actionGroup.classList.remove('project-plan-actions-pending');
    const card = document.getElementById('projectTimelineCard');
    if (card) card.classList.add('is-feature-ready');
}

function getGanttSettingsScale() {
    try {
        const saved = localStorage.getItem(getProjectTimelineScaleStorageKey());
        return saved === 'WEEK' || saved === 'MONTH' ? saved : 'DAY';
    } catch (error) {
        return 'DAY';
    }
}

function getGanttScaleLabel(scale) {
    if (scale === 'WEEK') return '주 단위';
    if (scale === 'MONTH') return '월 단위';
    return '일 단위';
}

function syncGanttScaleControl() {
    const scale = selectedGanttScale || getGanttSettingsScale();
    const label = document.getElementById('ganttScaleButtonLabel');
    const menu = document.getElementById('ganttScaleMenu');
    if (label) label.textContent = getGanttScaleLabel(scale);
    if (menu) {
        menu.querySelectorAll('[data-gantt-scale]').forEach(function(button) {
            const active = button.dataset.ganttScale === scale;
            button.classList.toggle('active', active);
            button.setAttribute('aria-checked', active ? 'true' : 'false');
        });
    }
}

function closeGanttScaleMenu() {
    const button = document.getElementById('ganttScaleButton');
    const menu = document.getElementById('ganttScaleMenu');
    if (menu) menu.hidden = true;
    if (button) button.setAttribute('aria-expanded', 'false');
}

function toggleGanttScaleMenu(event) {
    if (!canManageProjectPlan()) return;
    if (event) event.stopPropagation();
    const button = document.getElementById('ganttScaleButton');
    const menu = document.getElementById('ganttScaleMenu');
    if (!button || !menu) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) syncGanttScaleControl();
}

function changeGanttScale(scale) {
    if (!canManageProjectPlan()) return;
    selectedGanttScale = scale === 'WEEK' || scale === 'MONTH' ? scale : 'DAY';
    try { localStorage.setItem(getProjectTimelineScaleStorageKey(), selectedGanttScale); } catch (error) {}
    syncGanttScaleControl();
    closeGanttScaleMenu();
    // 최초 생성과 동일한 기존 간트 렌더러를 재사용한다.
    // 주말/오늘 표시, 새 일정 등록 행, 빈 칸 드래그 기능을 그대로 유지한다.
    renderProjectGantt(getGanttPlanSchedules());
}

function restoreProjectTimelineScale() {
    selectedGanttScale = getGanttSettingsScale();
    syncGanttScaleControl();
}

document.addEventListener('click', function(event) {
    const control = document.querySelector('.project-plan-scale-control');
    if (control && !control.contains(event.target)) closeGanttScaleMenu();
});

function normalizePlanCalendarItem(item) {
    const startText = String(item.start || '').substring(0, 10);
    const endText = String(item.end || item.start || '').substring(0, 10);
    return {
        type: item.type,
        entityId: item.entityId,
        title: item.title || '제목 없음',
        startDate: startText,
        endDate: endText || startText,
        color: item.color || '#64748b',
        status: item.status || '',
        description: item.description || item.memo || '',
        phaseTitle: item.phaseTitle || '',
        recordEnabledYn: String(item.recordEnabledYn || item.RECORD_ENABLED_YN || 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
        recordVisibility: String(item.recordVisibility || item.RECORD_VISIBILITY || 'PROJECT').toUpperCase() === 'MANAGER' ? 'MANAGER' : 'PROJECT',
        createdBy: item.createdBy || item.CREATED_BY || null,
        editorUserIds: Array.isArray(item.editorUserIds || item.EDITOR_USER_IDS) ? (item.editorUserIds || item.EDITOR_USER_IDS).map(Number) : []
    };
}

function getGanttPlanSchedules() {
    return (projectGanttItems || [])
        .filter(function(item) { return item && item.type === 'PERIOD_PLAN'; })
        .map(function(item) {
            return {
                SCHEDULE_ID: item.entityId,
                TITLE: item.title,
                START_DATE: item.startDate,
                END_DATE: item.endDate,
                COLOR: item.color || '#4A90E2',
                STATUS: item.status || 'PLANNED',
                GANTT_PLAN_YN: 'Y'
            };
        });
}


function updateProjectPlanGuide() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    const meta = document.getElementById('projectPlanMeta');
    const period = document.getElementById('projectPlanPeriod');
    const deadline = document.getElementById('projectPlanDeadline');
    const start = parseProjectPlanDate(config.projectStartDate);
    const end = parseProjectPlanDate(config.projectEndDate);
    if (period) period.textContent = start && end ? formatProjectPlanDate(config.projectStartDate) + ' - ' + formatProjectPlanDate(config.projectEndDate) : '기간 미설정';
    if (deadline) {
        deadline.classList.remove('is-upcoming', 'is-urgent', 'is-today', 'is-overdue', 'is-none');
        if (!end) {
            deadline.textContent = '마감 없음';
            deadline.classList.add('is-none');
        } else {
            const today = new Date(); today.setHours(0,0,0,0); end.setHours(0,0,0,0);
            const diff = Math.round((end - today) / 86400000);
            deadline.textContent = diff > 0 ? 'D-' + diff : diff === 0 ? '오늘 마감' : 'D+' + Math.abs(diff);
            deadline.classList.add(diff > 7 ? 'is-upcoming' : diff > 0 ? 'is-urgent' : diff === 0 ? 'is-today' : 'is-overdue');
        }
    }
    // 초기 HTML의 "확인 중" 문구를 노출하지 않고 실제 값이 준비된 뒤 한 번에 보여준다.
    if (meta) meta.hidden = false;
}

async function loadProjectPlanItems() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    const projId = getCurrentProjectId();
    if (!projId || !config.projectStartDate || !config.projectEndDate) return projectGanttItems;

    const url = getProjectMainContextPath() + '/project/api/calendar-items?projId=' + encodeURIComponent(projId)
        + '&startDate=' + encodeURIComponent(String(config.projectStartDate).substring(0,10))
        + '&endDate=' + encodeURIComponent(String(config.projectEndDate).substring(0,10))
        + '&include=TASK';

    try {
        const periodPlanUrl = getProjectMainContextPath() + '/project/api/period-plans?projId=' + encodeURIComponent(projId)
            + '&startDate=' + encodeURIComponent(String(config.projectStartDate).substring(0,10))
            + '&endDate=' + encodeURIComponent(String(config.projectEndDate).substring(0,10));

        const responses = await Promise.all([
            fetch(periodPlanUrl, { headers: { Accept: 'application/json' } }),
            fetch(url, { headers: { Accept: 'application/json' } })
        ]);
        const periodResponse = responses[0];
        const calendarResponse = responses[1];
        if (!periodResponse.ok) {
            throw new Error('기간별 계획 조회 실패 (' + periodResponse.status + ')');
        }
        if (!calendarResponse.ok) {
            throw new Error('프로젝트 업무 조회 실패 (' + calendarResponse.status + ')');
        }

        const periodBody = await periodResponse.json();
        const calendarBody = await calendarResponse.json();
        const periodPayload = periodBody && Object.prototype.hasOwnProperty.call(periodBody, 'data') ? periodBody.data : periodBody;
        const calendarPayload = calendarBody && Object.prototype.hasOwnProperty.call(calendarBody, 'data') ? calendarBody.data : calendarBody;

        const periodPlans = Array.isArray(periodPayload) ? periodPayload : [];
        let calendarItems = [];
        if (Array.isArray(calendarPayload)) {
            calendarItems = calendarPayload;
        } else if (calendarPayload && Array.isArray(calendarPayload.items)) {
            calendarItems = calendarPayload.items;
        } else if (calendarBody && Array.isArray(calendarBody.items)) {
            calendarItems = calendarBody.items;
        }

        const normalizedPeriodPlans = periodPlans.map(function(plan) {
            return normalizePlanCalendarItem({
                type: 'PERIOD_PLAN',
                entityId: plan.periodPlanId,
                title: plan.title,
                start: plan.startDate,
                end: plan.endDate,
                color: plan.color,
                description: plan.description,
                sortOrder: plan.sortOrder,
                recordEnabledYn: plan.recordEnabledYn || plan.RECORD_ENABLED_YN || 'N',
                recordVisibility: plan.recordVisibility || plan.RECORD_VISIBILITY || 'PROJECT',
                createdBy: plan.createdBy || plan.CREATED_BY || null,
                editorUserIds: plan.editorUserIds || plan.EDITOR_USER_IDS || []
            });
        });
        projectGanttItems = normalizedPeriodPlans.concat(calendarItems.map(normalizePlanCalendarItem));

        // 한 번이라도 실제 생성 데이터를 확인했다면 같은 페이지의 후속 초기화가
        // 버튼을 다시 숨기지 못하도록 현재 세션 상태에도 반영한다.
        if (projectGanttItems.some(function(item) {
            return item && item.type === 'PERIOD_PLAN';
        })) {
            projectPlanServerFeatures.gantt = true;
        }

        return projectGanttItems;
    } catch (error) {
        // 새로고침 과정의 중복/후속 호출이 일시적으로 실패해도 이미 확인한 데이터를
        // 빈 배열로 덮어쓰지 않는다.
        return projectGanttItems;
    }
}

let projectTimelineInitPromise = null;

function initProjectTimeline() {
    if (projectTimelineInitPromise) return projectTimelineInitPromise;

    projectTimelineInitPromise = Promise.resolve().then(function() {
        restoreProjectTimelineScale();
        return loadProjectSchedules();
    }).catch(function(error) {
        projectTimelineInitPromise = null;
        throw error;
    });

    return projectTimelineInitPromise;
}

window.initProjectTimeline = initProjectTimeline;

let projectSchedulesLoadPromise = null;
let projectSchedulesInitialLoadDone = false;

async function fetchProjectCalendarSchedules(projId) {
    try {
        const response = await fetch(
            getProjectMainContextPath() + '/project/api/schedules?projId=' + encodeURIComponent(projId),
            { headers: { Accept: 'application/json' } }
        );
        projectCalendarSchedules = response.ok ? await response.json() : [];
    } catch (error) {
        projectCalendarSchedules = [];
    }
    return projectCalendarSchedules;
}

async function loadProjectPlanFeature() {
    const projId = getCurrentProjectId();
    if (!projId) return projectPlanServerFeatures;
    const response = await fetch(getProjectMainContextPath() + '/project/api/plan-features?projId=' + encodeURIComponent(projId), { credentials: 'same-origin' });
    const body = await response.json().catch(function(){ return {}; });
    if (!response.ok) throw new Error(body.message || '계획 기능 상태를 조회하지 못했습니다.');
    applyProjectPlanServerFeature(body.feature || {});
    return projectPlanServerFeatures;
}

function applyProjectPlanServerFeature(feature) {
    feature = feature || {};
    if (!projectPlanServerFeatures) {
        projectPlanServerFeatures = { gantt: false, timeSchedule: false, weeklyRoutine: false, timeRangeStart: '', timeRangeEnd: '' };
    }
    projectPlanServerFeatures.gantt = String(feature.periodEnabledYn || 'N').toUpperCase() === 'Y';
    projectPlanServerFeatures.timeSchedule = String(feature.timeEnabledYn || 'N').toUpperCase() === 'Y';
    projectPlanServerFeatures.weeklyRoutine = String(feature.weeklyEnabledYn || 'N').toUpperCase() === 'Y';
    projectPlanServerFeatures.timeRangeStart = String(feature.timeRangeStartDate || '').substring(0, 10);
    projectPlanServerFeatures.timeRangeEnd = String(feature.timeRangeEndDate || '').substring(0, 10);
    return getEffectiveProjectPlanFeatures();
}

async function saveProjectPlanFeature(payload) {
    const response = await fetch(getProjectMainContextPath() + '/project/api/plan-features', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const body = await response.json().catch(function(){ return {}; });
    if (!response.ok) throw new Error(body.message || '계획 기능 상태를 저장하지 못했습니다.');
    return body.feature || {};
}

async function fetchProjectPlanData(projId) {
    function safelyRun(loader, fallback) {
        try {
            return typeof loader === 'function' ? Promise.resolve(loader()) : Promise.resolve(fallback);
        } catch (error) {
            console.error('[프로젝트 계획] 데이터 모듈 실행 실패:', error);
            return Promise.resolve(fallback);
        }
    }

    const results = await Promise.allSettled([
        safelyRun(function() { return loadProjectPlanFeature(); }, projectPlanServerFeatures),
        safelyRun(function() { return fetchProjectCalendarSchedules(projId); }, []),
        safelyRun(typeof loadProjectPlanItems === 'function' ? loadProjectPlanItems : null, []),
        safelyRun(typeof loadProjectPlanCalendarPrefs === 'function' ? loadProjectPlanCalendarPrefs : null, projectPlanCalendarPrefs),
        safelyRun(typeof loadProjectTimeScheduleItems === 'function' ? loadProjectTimeScheduleItems : null, []),
        safelyRun(typeof loadProjectWeeklyPlanItems === 'function' ? loadProjectWeeklyPlanItems : null, [])
    ]);

    return {
        schedules: projectCalendarSchedules,
        ganttItems: projectGanttItems,
        timeScheduleItems: projectTimeScheduleItems,
        weeklyPlanItems: typeof projectWeeklyPlanItems !== 'undefined' ? projectWeeklyPlanItems : []
    };
}

function renderProjectPlanViews(preferredTab) {
    projectPlanFeatureDataReady = true;
    generateProjectMiniCalendar();
    syncProjectPlanFeatureUi(preferredTab || projectPlanActiveTab);

    const card = document.getElementById('projectTimelineCard');
    if (card) {
        card.classList.remove('is-loading');
        card.setAttribute('aria-busy', 'false');
    }
}

function loadProjectSchedules(options) {
    const projId = getCurrentProjectId();
    if (!projId) {
        updateProjectPlanGuide();
        renderProjectPlanViews(projectPlanActiveTab);
        return Promise.resolve();
    }

    const forceReload = options === true || Boolean(options && options.force === true);

    if (!forceReload && projectSchedulesInitialLoadDone) return Promise.resolve();
    if (projectSchedulesLoadPromise) return projectSchedulesLoadPromise;

    projectSchedulesLoadPromise = (async function() {
        updateProjectPlanGuide();
        try {
            await fetchProjectPlanData(projId);
        } catch (error) {
            console.error('[프로젝트 계획] 초기 데이터 조회 실패:', error);
        } finally {
            // 개별 계획 모듈 하나가 실패해도 계획 펼치기/추가 버튼은 반드시 복구한다.
            renderProjectPlanViews(projectPlanActiveTab);
            projectSchedulesInitialLoadDone = true;
        }
    })().finally(function() {
        projectSchedulesLoadPromise = null;
    });

    return projectSchedulesLoadPromise;
}


let projectPlanCalendarPrefs = {
    showPeriodYn: 'Y',
    showTimeYn: 'Y',
    showWeeklyYn: 'Y'
};

async function loadProjectPlanCalendarPrefs() {
    const projId = getCurrentProjectId();
    if (!projId) return projectPlanCalendarPrefs;
    try {
        const response = await fetch(getProjectMainContextPath() + '/project/api/plan-calendar-prefs?projId=' + encodeURIComponent(projId), {
            headers: { Accept: 'application/json' }
        });
        const body = await response.json().catch(function() { return {}; });
        if (!response.ok) throw new Error(body && body.message ? body.message : '달력 표시 설정 조회 실패');
        const data = body && body.data ? body.data : body;
        projectPlanCalendarPrefs = {
            showPeriodYn: String(data.showPeriodYn || 'Y').toUpperCase() === 'N' ? 'N' : 'Y',
            showTimeYn: String(data.showTimeYn || 'Y').toUpperCase() === 'N' ? 'N' : 'Y',
            showWeeklyYn: String(data.showWeeklyYn || 'Y').toUpperCase() === 'N' ? 'N' : 'Y'
        };
        syncProjectPlanCalendarPrefCheckboxes();
    } catch (error) {
        // 개인 달력 표시 설정을 읽지 못하면 기본 표시값을 유지한다.
        syncProjectPlanCalendarPrefCheckboxes();
    }
    return projectPlanCalendarPrefs;
}

function syncProjectPlanCalendarPrefCheckboxes() {
    const period = document.getElementById('showPeriodPlanOnCalendar');
    const time = document.getElementById('showTimePlanOnCalendar');
    const weekly = document.getElementById('showWeeklyPlanOnCalendar');
    if (period) period.checked = projectPlanCalendarPrefs.showPeriodYn === 'Y';
    if (time) time.checked = projectPlanCalendarPrefs.showTimeYn === 'Y';
    if (weekly) weekly.checked = projectPlanCalendarPrefs.showWeeklyYn === 'Y';
}

async function saveSingleProjectPlanCalendarPref(type, checked) {
    const projId = getCurrentProjectId();
    if (!projId) return;

    const key = type === 'PERIOD' ? 'showPeriodYn' : type === 'TIME' ? 'showTimeYn' : 'showWeeklyYn';
    const previous = projectPlanCalendarPrefs[key];
    projectPlanCalendarPrefs[key] = checked ? 'Y' : 'N';

    const payload = {
        projId: Number(projId),
        showPeriodYn: projectPlanCalendarPrefs.showPeriodYn,
        showTimeYn: projectPlanCalendarPrefs.showTimeYn,
        showWeeklyYn: projectPlanCalendarPrefs.showWeeklyYn
    };

    try {
        const response = await fetch(getProjectMainContextPath() + '/project/api/plan-calendar-prefs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
        });
        const body = await response.json().catch(function() { return {}; });
        if (!response.ok) throw new Error(body && body.message ? body.message : '달력 표시 설정 저장 실패');
        if (typeof window.refreshProjectPlanViews === 'function') {
            await window.refreshProjectPlanViews();
        }
    } catch (error) {
        projectPlanCalendarPrefs[key] = previous;
        syncProjectPlanCalendarPrefCheckboxes();
        alert(error.message || '달력 표시 설정을 저장하지 못했습니다.');
    }
}

