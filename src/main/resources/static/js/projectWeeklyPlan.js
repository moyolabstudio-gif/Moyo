/** MOYO 프로젝트 주간 계획: 시간별 계획표 엔진의 데이터/API 분기만 담당 */
let projectWeeklyPlanItems = [];

function getWeeklyPlanApiUrl(path) {
    return getProjectMainContextPath() + '/project/api/weekly-plans' + (path || '');
}

function normalizeWeeklyPlanItem(item) {
    return {
        weeklyPlanId: Number(item.weeklyPlanId || item.WEEKLY_PLAN_ID || 0),
        projId: Number(item.projId || item.PROJ_ID || getCurrentProjectId() || 0),
        taskId: item.taskId || item.TASK_ID || null,
        title: item.title || item.TITLE || '',
        description: item.description || item.DESCRIPTION || '',
        dayOfWeek: Number(item.dayOfWeek || item.DAY_OF_WEEK || 1),
        startTime: String(item.startTime || item.START_TIME || '09:00').substring(0, 5),
        endTime: String(item.endTime || item.END_TIME || '10:00').substring(0, 5),
        color: item.color || item.COLOR || '#7c5cff',
        sortOrder: Number(item.sortOrder || item.SORT_ORDER || 0),
        repeatStartDate: String(item.repeatStartDate || item.REPEAT_START_DATE || '').substring(0, 10),
        repeatEndDate: String(item.repeatEndDate || item.REPEAT_END_DATE || '').substring(0, 10),
        activeYn: String(item.activeYn || item.ACTIVE_YN || 'Y').toUpperCase() === 'N' ? 'N' : 'Y',
        recordEnabledYn: String(item.recordEnabledYn || item.RECORD_ENABLED_YN || 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
        recordVisibility: String(item.recordVisibility || item.RECORD_VISIBILITY || 'PROJECT').toUpperCase() === 'MANAGER' ? 'MANAGER' : 'PROJECT',
        taskTitle: item.taskTitle || item.TASK_TITLE || '',
        createdBy: item.createdBy || item.CREATED_BY || null,
        editorUserIds: Array.isArray(item.editorUserIds || item.EDITOR_USER_IDS) ? (item.editorUserIds || item.EDITOR_USER_IDS).map(Number) : []
    };
}

async function loadProjectWeeklyPlanItems() {
    const projId = getCurrentProjectId();
    if (!projId) {
        projectWeeklyPlanItems = [];
        return projectWeeklyPlanItems;
    }
    const response = await fetch(getWeeklyPlanApiUrl('?projId=' + encodeURIComponent(projId)), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
    });
    const body = await response.json().catch(function() { return {}; });
    if (!response.ok || body.success === false) {
        throw new Error(body.message || '주간 계획을 불러오지 못했습니다.');
    }
    projectWeeklyPlanItems = (Array.isArray(body.data) ? body.data : []).map(normalizeWeeklyPlanItem);
    return projectWeeklyPlanItems;
}

function renderWeeklyPlan() {
    if (typeof window.renderWeeklyScheduleWithTimeGrid !== 'function') {
        const root = document.getElementById('projectWeeklyPlanPreview');
        if (root) root.innerHTML = '<div class="gantt-empty">시간별 계획표 엔진을 불러오지 못했습니다.</div>';
        return;
    }
    window.renderWeeklyScheduleWithTimeGrid(projectWeeklyPlanItems);
}

function weeklyMinuteToTime(minute) {
    const raw = Number(minute || 0);
    const value = ((raw % (24 * 60)) + (24 * 60)) % (24 * 60);
    return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
}

function weeklyTimeToMinute(value) {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    return Math.max(0, Math.min(24 * 60 - 1, Number(match[1] || 0) * 60 + Number(match[2] || 0)));
}

function nextWeeklyDay(dayOfWeek) {
    const day = Number(dayOfWeek || 1);
    return day >= 7 ? 1 : day + 1;
}

function splitWeeklyRange(dayOfWeek, startMinute, endMinute) {
    const day = Number(dayOfWeek || 1);
    const start = Math.max(0, Math.min(24 * 60 - 1, Number(startMinute || 0)));
    const rawEnd = Number(endMinute || 0);
    const normalizedEnd = ((rawEnd % (24 * 60)) + (24 * 60)) % (24 * 60);
    const crossesMidnight = rawEnd > 24 * 60 || normalizedEnd <= start;
    if (!crossesMidnight) return [{ dayOfWeek: day, startMinute: start, endMinute: normalizedEnd }];
    const segments = [{ dayOfWeek: day, startMinute: start, endMinute: 24 * 60 }];
    if (normalizedEnd > 0) segments.push({ dayOfWeek: nextWeeklyDay(day), startMinute: 0, endMinute: normalizedEnd });
    return segments;
}

function weeklyPlanHasConflict(dayOfWeek, startMinute, endMinute, ignoreId) {
    const candidateSegments = splitWeeklyRange(dayOfWeek, startMinute, endMinute);
    return projectWeeklyPlanItems.some(function(item) {
        if (Number(item.weeklyPlanId) === Number(ignoreId)) return false;
        const itemStart = weeklyTimeToMinute(item.startTime);
        const itemEnd = weeklyTimeToMinute(item.endTime);
        const itemSegments = splitWeeklyRange(item.dayOfWeek, itemStart, itemEnd);
        return candidateSegments.some(function(candidate) {
            return itemSegments.some(function(existing) {
                return Number(candidate.dayOfWeek) === Number(existing.dayOfWeek)
                    && candidate.startMinute < existing.endMinute
                    && candidate.endMinute > existing.startMinute;
            });
        });
    });
}

window.updateWeeklyPlanFromTimeGrid = async function(plan, dayOfWeek, startMinute, endMinute) {
    const id = Number(plan.WEEKLY_PLAN_ID || plan.weeklyPlanId || plan.TIME_PLAN_ID || plan.timePlanId || 0);
    const source = projectWeeklyPlanItems.find(function(item) { return Number(item.weeklyPlanId) === id; });
    if (!source) throw new Error('수정할 주간 계획을 찾지 못했습니다.');
    if (weeklyPlanHasConflict(dayOfWeek, startMinute, endMinute, id)) {
        alert('해당 요일 시간대에 이미 등록된 주간 계획이 있습니다.');
        renderWeeklyPlan();
        return false;
    }
    const payload = {
        projId: Number(getCurrentProjectId()),
        title: source.title,
        description: source.description || null,
        dayOfWeek: Number(dayOfWeek),
        startTime: weeklyMinuteToTime(startMinute),
        endTime: weeklyMinuteToTime(endMinute),
        repeatStartDate: source.repeatStartDate || null,
        repeatEndDate: source.repeatEndDate || null,
        color: source.color,
        activeYn: source.activeYn,
        sortOrder: Number(source.sortOrder || 1),
        recordEnabledYn: source.recordEnabledYn || null,
        recordVisibility: source.recordVisibility || null,
        editorUserIds: Array.isArray(source.editorUserIds) ? source.editorUserIds.map(Number) : null
    };
    const response = await fetch(getWeeklyPlanApiUrl('/' + encodeURIComponent(id)), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
    });
    const body = await response.json().catch(function() { return {}; });
    if (!response.ok || body.success === false) throw new Error(body.message || '주간 계획을 수정하지 못했습니다.');
    await loadProjectWeeklyPlanItems();
    renderWeeklyPlan();
    return true;
};

function openWeeklyPlanEditorByGridId(weeklyPlanId) {
    openWeeklyPlanEditor(weeklyPlanId);
}

function openWeeklyPlanEditor(weeklyPlanId, defaults) {
    // 기존 계획은 권한이 없어도 상세 조회할 수 있고, 신규 등록만 관리 권한이 필요하다.
    if (weeklyPlanId == null && !canManageProjectPlan()) return;
    if (typeof window.openProjectPlanSharedModal !== 'function') {
        alert('공통 계획 등록 모달을 불러오지 못했습니다.');
        return;
    }
    const item = weeklyPlanId != null
        ? projectWeeklyPlanItems.find(function(plan) { return Number(plan.weeklyPlanId) === Number(weeklyPlanId); })
        : null;
    if (weeklyPlanId != null && !item) return;
    const initial = defaults || {};
    window.openProjectPlanSharedModal({
        mode: 'WEEKLY_PLAN',
        weeklyPlanId: item ? item.weeklyPlanId : null,
        item: item || null,
        dayOfWeek: item ? item.dayOfWeek : Number(initial.dayOfWeek || 1),
        startTime: item ? item.startTime : (initial.startTime || '09:00'),
        endTime: item ? item.endTime : (initial.endTime || '10:00')
    });
}

function hasWeeklyPlanOverlapInLoadedItems(dayOfWeek, startTime, endTime, excludeId) {
    return weeklyPlanHasConflict(dayOfWeek, weeklyTimeToMinute(startTime), weeklyTimeToMinute(endTime), excludeId);
}
window.hasWeeklyPlanOverlapInLoadedItems = hasWeeklyPlanOverlapInLoadedItems;
