/**
 * MOYO Calendar V2
 * --------------------------------------------------------------------------
 * 신규 달력 본체 전용 스크립트.
 * 기존 calendar.js에 의존하지 않는다.
 *
 * Step 42: 중복 fetch와 반복 DOM/event scan을 줄인 V2 성능 구조를 사용한다.
 * - 월간 뷰 / 이전 / 다음 / 오늘
 * - 현재 월 표시 / 날짜 클릭
 * - 개인: 전체/개인/친구/모요/프로젝트 1차 필터 + 대상 선택
 * - 그룹: 전체/그룹/프로젝트 1차 필터 + 그룹 일정/멤버/프로젝트 2차 필터
 * - 프로젝트: 전체/일정/업무/계획 1차 필터 + 각 범주의 2차 필터
 * - 검색은 현재 월에 로드된 일정/업무/계획을 대상으로 동작한다.
 *
 * 기존 calendar.js의 렌더링 코드는 가져오지 않고 V2 전용 event adapter를 사용한다.
 */
(() => {
    'use strict';

    const root = document.getElementById('moyoCalendarV2');
    const calendarEl = document.getElementById('moyoCal2Calendar');
    const projectContextEl = document.getElementById('moyoCal2Context');
    const projectContextNameEl = document.getElementById('moyoCal2ProjectContextName');
    const projectContextMetaEl = document.getElementById('moyoCal2ProjectContextMeta');
    const projectContextChangeButton = document.getElementById('moyoCal2ProjectContextChange');
    const calendarStatusEl = document.getElementById('moyoCal2CalendarStatus');
    const calendarStatusTitleEl = document.getElementById('moyoCal2CalendarStatusTitle');
    const calendarStatusTextEl = document.getElementById('moyoCal2CalendarStatusText');
    const calendarRetryButton = document.getElementById('moyoCal2CalendarRetry');
    const calendarNoticeEl = document.getElementById('moyoCal2CalendarNotice');
    if (!root || !calendarEl) return;

    if (!window.FullCalendar || typeof window.FullCalendar.Calendar !== 'function') {
        console.error('[Calendar V2] FullCalendar를 불러오지 못했습니다.');
        return;
    }

    const params = new URLSearchParams(window.location.search || '');
    const initialViewDate = params.get('viewDate') || undefined;
    const initialSelectedDate = params.get('selectedDate') || null;
    const initialViewEventId = params.get('viewEventId') || params.get('eventId') || null;
    const initialEditEventId = params.get('editEventId') || null;

    const requestedInitialScope = String(params.get('scope') || '').toUpperCase();
    const rawInitialProjectScope = String(params.get('projectScope') || '').toUpperCase();
    const initialProjectScope = ['PERSONAL', 'GROUP'].includes(rawInitialProjectScope)
        ? rawInitialProjectScope
        : null;

    // 상단은 모든 진입 컨텍스트에서 정확히 2단을 사용한다.
    // 1단은 월 이동/검색/추가, 2단은 아래 범위 + 세부 필터다.
    // PERSONAL : 전체 / 개인 / 친구 / 프로젝트
    // GROUP    : 전체 / 그룹 / 프로젝트
    // PROJECT  : 전체 / 일정 / 업무 / 계획
    const rawCalendarContext = String(params.get('calendarContext') || '').toUpperCase();
    const inferredCalendarContext = (() => {
        if (['PERSONAL', 'GROUP', 'PROJECT'].includes(rawCalendarContext)) return rawCalendarContext;
        if (requestedInitialScope === 'WS' && params.get('wsId')) return 'GROUP';
        if (requestedInitialScope === 'PROJ' && params.get('projId')) return 'PROJECT';
        return 'PERSONAL';
    })();
    const calendarContext = inferredCalendarContext;
    const contextWsId = calendarContext === 'GROUP' || calendarContext === 'PROJECT'
        ? (params.get('wsId') || null)
        : null;
    const contextProjId = calendarContext === 'PROJECT'
        ? (params.get('projId') || null)
        : null;

    const contextScopes = calendarContext === 'GROUP'
        ? ['ALL', 'WS', 'PROJ']
        : (calendarContext === 'PROJECT'
            ? ['ALL', 'EVENT', 'TASK', 'PLAN']
            : ['ALL', 'PRIVATE', 'FRIEND', 'PROJ']);
    const defaultContextScope = 'ALL';

    /*
     * 달력 최초 진입은 모든 컨텍스트에서 항상 '전체'를 기본 탭으로 사용한다.
     * - PERSONAL : 전체
     * - GROUP    : 전체
     * - PROJECT  : 전체
     *
     * URL에 scope/view가 남아 있어도 최초 활성 탭을 바꾸지 않는다.
     * wsId/projId는 진입 컨텍스트 식별용으로만 유지한다.
     */
    const resolvedInitialScope = defaultContextScope;

    const state = {
        scope: resolvedInitialScope,
        // URL에 다른 scope의 오래된 대상 파라미터가 남아 있어도 V2 state로 끌고 오지 않는다.
        friendId: resolvedInitialScope === 'FRIEND' ? (params.get('friendId') || null) : null,
        wsId: calendarContext === 'PROJECT' || calendarContext === 'GROUP'
            ? contextWsId
            : (['WS', 'PROJ'].includes(resolvedInitialScope) ? (params.get('wsId') || null) : null),
        projId: calendarContext === 'PROJECT'
            ? contextProjId
            : (resolvedInitialScope === 'PROJ' ? (params.get('projId') || null) : null),
        projectScope: calendarContext === 'PROJECT'
            ? (initialProjectScope || (contextWsId ? 'GROUP' : 'PERSONAL'))
            : (resolvedInitialScope === 'PROJ'
                ? (calendarContext === 'PERSONAL' ? 'PERSONAL' : 'GROUP')
                : null),
        calendarContext,
        scopeLabel: '',
        groupScheduleFilter: String(params.get('groupFilter') || 'ALL').toUpperCase(),
        projectScheduleFilter: String(params.get('eventFilter') || 'ALL').toUpperCase(),
        taskStatusFilter: String(params.get('taskStatus') || 'ALL').toUpperCase(),
        taskMemberFilter: params.get('taskMemberId') || 'ALL',
        planFilter: String(params.get('planFilter') || 'ALL').toUpperCase(),
        viewDate: initialViewDate || null,
        selectedDate: initialSelectedDate,
        moyoPublicVisible: calendarContext !== 'PERSONAL' ? true : String(params.get('moyoPublic') || 'ON').toUpperCase() !== 'OFF',

        // Step 15: 화면 기능별 상태는 V2 내부에서만 관리한다.
        // 기존 PROJECT_MAIN_CONFIG는 모달 호환용 bridge context일 뿐 V2 state로 사용하지 않는다.
        search: {
            query: '',
            open: false
        },
        loading: {
            calendar: false,
            projectPlans: false,
            scopeOptions: false
        },
        modalRefresh: {
            pending: false,
            source: null
        },

        // Selector option cache.
        friends: [],
        userSpaces: { workspaces: [], projects: [] },
        groupMembers: [],
        projectMembers: [],
        groupMembersLoaded: false,
        projectMembersLoaded: false,
        scopeOptionsLoaded: false,
        scopeOptionsPromise: null
    };

    const stateSubscribers = new Set();

    function snapshotState() {
        return {
            ...state,
            search: { ...state.search },
            loading: { ...state.loading },
            modalRefresh: { ...state.modalRefresh },
            friends: [...state.friends],
            groupMembers: [...state.groupMembers],
            projectMembers: [...state.projectMembers],
            userSpaces: {
                workspaces: [...(state.userSpaces.workspaces || [])],
                projects: [...(state.userSpaces.projects || [])]
            }
        };
    }

    function notifyStateChange(changedKeys, meta) {
        if (!changedKeys.length) return;
        const detail = {
            changedKeys,
            state: snapshotState(),
            meta: meta || {}
        };

        stateSubscribers.forEach((subscriber) => {
            try {
                subscriber(detail.state, detail);
            } catch (error) {
                console.error('[Calendar V2] state subscriber 오류', error);
            }
        });

        document.dispatchEvent(new CustomEvent('moyo:calendar-v2-state-change', { detail }));
    }

    function setState(patch, meta = {}) {
        if (!patch || typeof patch !== 'object') return snapshotState();

        const changedKeys = [];
        Object.entries(patch).forEach(([key, value]) => {
            if (!Object.prototype.hasOwnProperty.call(state, key)) {
                console.warn(`[Calendar V2] 정의되지 않은 state key는 무시합니다: ${key}`);
                return;
            }
            if (state[key] === value) return;
            state[key] = value;
            changedKeys.push(key);
        });

        if (meta.notify !== false) notifyStateChange(changedKeys, meta);
        return snapshotState();
    }

    function subscribeState(subscriber) {
        if (typeof subscriber !== 'function') return () => {};
        stateSubscribers.add(subscriber);
        return () => stateSubscribers.delete(subscriber);
    }

    function setLoading(key, value, meta = {}) {
        if (!Object.prototype.hasOwnProperty.call(state.loading, key)) return;
        setState({
            loading: { ...state.loading, [key]: Boolean(value) }
        }, { reason: `loading:${key}`, ...meta });
        window.requestAnimationFrame(() => {
            if (typeof renderCalendarExceptionState === 'function') renderCalendarExceptionState();
        });
    }

    function setSearchState(patch) {
        const next = patch && typeof patch === 'object' ? patch : {};
        setState({
            search: { ...state.search, ...next }
        }, { reason: 'search' });
    }

    function markModalRefresh(source) {
        setState({
            modalRefresh: { pending: true, source: source || null }
        }, { reason: 'modal-refresh:pending' });
    }

    function consumeModalRefresh() {
        const pending = { ...state.modalRefresh };
        if (pending.pending) {
            setState({
                modalRefresh: { pending: false, source: null }
            }, { reason: 'modal-refresh:consumed' });
        }
        return pending;
    }

    const monthLabel = document.getElementById('moyoCal2MonthLabel');
    const dayPanel = document.getElementById('moyoCal2DayPanel');
    const dayPanelDate = document.getElementById('moyoCal2DayDate');
    const dayPanelMeta = document.getElementById('moyoCal2DayMeta');
    const dayPanelToday = document.getElementById('moyoCal2DayToday');
    const dayPanelBody = document.getElementById('moyoCal2DayPanelBody');
    const prevButton = document.getElementById('moyoCal2Prev');
    const nextButton = document.getElementById('moyoCal2Next');
    const todayButton = document.getElementById('moyoCal2Today');
    const scopeTabs = Array.from(document.querySelectorAll('[data-cal2-scope]'));
    const scopeNav = document.querySelector('.moyo-cal2-scope-nav');
    const moyoOnlyButton = document.getElementById('moyoCal2MoyoOnly');
    const scopeTargetButton = document.getElementById('moyoCal2ScopeTarget');
    const scopeTargetLabel = document.getElementById('moyoCal2ScopeTargetLabel');
    const filterRow = document.getElementById('moyoCal2FilterRow');
    const secondaryFilters = document.getElementById('moyoCal2SecondaryFilters');
    const birthdaySection = document.getElementById('moyoCal2BirthdaySection');
    const birthdayTitle = document.getElementById('moyoCal2BirthdayTitle');
    const birthdayCount = document.getElementById('moyoCal2BirthdayCount');
    const birthdayList = document.getElementById('moyoCal2BirthdayList');
    const dayCategoryTabs = document.getElementById('moyoCal2DayCategoryTabs');
    const monthProjectsSection = document.getElementById('moyoCal2MonthProjectsSection');
    const monthProjectsCount = document.getElementById('moyoCal2MonthProjectsCount');
    const monthProjects = document.getElementById('moyoCal2MonthProjects');
    const holidaySection = document.getElementById('moyoCal2HolidaySection');
    const holidayCount = document.getElementById('moyoCal2HolidayCount');
    const holidayList = document.getElementById('moyoCal2HolidayList');
    const projectProgressSection = document.getElementById('moyoCal2ProjectProgressSection');
    const projectProgressRate = document.getElementById('moyoCal2ProjectProgressRate');
    const projectProgressBar = document.getElementById('moyoCal2ProjectProgressBar');
    let selectedDayCategory = 'ALL';
    let groupMonthBirthdays = [];
    let projectTaskSummary = null;
    let projectTaskSummaryKey = '';
    const createButton = document.getElementById('moyoCal2Create');
    const searchPanel = document.getElementById('moyoCal2SearchPanel');
    const searchInput = document.getElementById('moyoCal2SearchInput');
    const searchClearButton = document.getElementById('moyoCal2SearchClear');
    const searchStatus = document.getElementById('moyoCal2SearchStatus');
    const searchResults = document.getElementById('moyoCal2SearchResults');

    const scopeMeta = {
        ALL: { label: '전체' },
        PRIVATE: { label: '개인' },
        FRIEND: { label: '친구' },
        WS: { label: '그룹' },
        PROJ: { label: '프로젝트' },
        EVENT: { label: '일정' },
        TASK: { label: '업무' },
        PLAN: { label: '계획' }
    };

    // Step 42: 자주 호출되는 formatter / event lookup은 재사용한다.
    const selectedDayFormatter = new Intl.DateTimeFormat('ko-KR', {
        month: 'long', day: 'numeric', weekday: 'long'
    });
    const eventTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit', minute: '2-digit', hour12: false
    });
    const searchDateFormatter = new Intl.DateTimeFormat('ko-KR', {
        month: 'short', day: 'numeric'
    });
    const runtimeEventIndex = {
        all: [],
        searchable: [],
        byDate: new Map(),
        holidaysByDate: new Map()
    };

    function toDateOnly(value) {
        if (!value) return '';
        if (typeof value === 'string') return value.substring(0, 10);
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function updateMonthLabel(date) {
        if (!monthLabel || !date) return;
        monthLabel.textContent = new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long'
        }).format(date);
    }

    function parseDateOnlyLocal(value) {
        const text = String(value || '').substring(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
        const [year, month, day] = text.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function isTodayDateOnly(value) {
        return Boolean(value) && toDateOnly(new Date()) === String(value).substring(0, 10);
    }

    function formatSelectedDayTitle(value) {
        const date = parseDateOnlyLocal(value);
        if (!date) return '';
        return selectedDayFormatter.format(date);
    }

    function normalizeProjectType(value) {
        const text = String(value || '').trim();
        const type = text.toUpperCase().replace(/\s+/g, '');
        const raw = text.replace(/\s+/g, '');

        if (type === 'WORK' || raw === '업무') return 'WORK';
        if (type === 'TRAVEL' || raw === '여행') return 'TRAVEL';
        if (type === 'MEETING' || type === 'EVENT' || type === 'GROUP'
                || raw === '모임·행사' || raw === '모임.행사' || raw === '모임행사' || raw === '행사') return 'MEETING';
        if (type === 'STUDY'
                || raw === '학습·연구' || raw === '학습.연구' || raw === '학습연구'
                || raw === '공부' || raw === '학습' || raw === '연구') return 'STUDY';
        if (type === 'LIFE'
                || raw === '생활·가정' || raw === '생활.가정' || raw === '생활가정') return 'LIFE';
        if (type === 'HOBBY'
                || raw === '취미·창작' || raw === '취미.창작' || raw === '취미창작') return 'HOBBY';
        if (type === 'ETC' || raw === '기타') return 'ETC';
        return type;
    }

    function projectTypeIconClass(type) {
        switch (normalizeProjectType(type)) {
            case 'WORK': return 'fa-briefcase';
            case 'TRAVEL': return 'fa-plane';
            case 'MEETING':
            case 'EVENT': return 'fa-users';
            case 'STUDY': return 'fa-graduation-cap';
            case 'LIFE': return 'fa-house';
            case 'HOBBY': return 'fa-palette';
            case 'ETC': return 'fa-folder-open';
            default: return 'fa-diagram-project';
        }
    }

    function projectTypeLabel(type) {
        switch (normalizeProjectType(type)) {
            case 'WORK': return '업무';
            case 'TRAVEL': return '여행';
            case 'MEETING':
            case 'EVENT': return '모임 · 행사';
            case 'STUDY': return '학습 · 연구';
            case 'LIFE': return '생활 · 가정';
            case 'HOBBY': return '취미 · 창작';
            case 'ETC': return '기타';
            default: return '프로젝트';
        }
    }

    function eventOccursOnDate(event, dateString) {
        const dayStart = parseDateOnlyLocal(dateString);
        if (!dayStart || !event || !event.start) return false;
        const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1);
        const start = event.start;
        const end = event.end || (event.allDay
            ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
            : new Date(start.getTime() + 1));
        return start < dayEnd && end > dayStart;
    }

    function getSelectedDayEvents(dateString) {
        if (!dateString) return [];

        const selectedDate = String(dateString).substring(0, 10);

        // 달력 본체에는 PHASE의 시작/종료 row만 그리지만,
        // 우측 선택 날짜 패널에서는 선택일이 PHASE 기간 안에 있으면
        // 해당 기간별 계획을 '진행 중인 계획'으로 포함한다.
        const events = [
            ...(runtimeEventIndex.byDate.get(selectedDate) || [])
        ].filter((event) => {
            const kind = String(event?.extendedProps?.calendarV2Kind || '').toUpperCase();

            // 달력 본체의 시각 전용 boundary/marker 이벤트는
            // 우측 '선택한 날' 실제 일정/계획/업무 목록에 절대 포함하지 않는다.
            return ![
                'PHASE_BOUNDARY',
                'PROJECT_PERIOD',
                'PROJECT_PERIOD_BOUNDARY',
                'PROJECT_PERIOD_MARKER'
            ].includes(kind);
        });

        const canShowPhase = (
            (calendarContext === 'PROJECT' && ['ALL', 'PLAN'].includes(state.scope))
            || (calendarContext !== 'GROUP' && state.scope === 'PROJ')
        );

        if (!canShowPhase) return events;
        if (calendarContext === 'PROJECT' && !['ALL', 'PHASE'].includes(state.planFilter)) return events;

        const existingPhaseIds = new Set(
            events
                .filter((event) => String(event?.extendedProps?.calendarV2Kind || '').toUpperCase() === 'PHASE')
                .map((event) => String(event?.extendedProps?.entityId || ''))
                .filter(Boolean)
        );

        (projectPlanStore.records || []).forEach((record) => {
            const kind = String(record?.kind || record?.itemType || '').toUpperCase();
            if (kind !== 'PHASE' || !record.start || !record.entityId) return;

            const startDate = String(record.start).substring(0, 10);
            let endDate = String(record.end || record.start).substring(0, 10);
            if (!endDate || endDate < startDate) endDate = startDate;

            if (selectedDate < startDate || selectedDate > endDate) return;

            const entityId = String(record.entityId);
            if (existingPhaseIds.has(entityId)) return;
            existingPhaseIds.add(entityId);

            const start = parseDateOnlyLocal(startDate);
            const endInclusive = parseDateOnlyLocal(endDate);
            const endExclusive = endInclusive
                ? new Date(endInclusive.getFullYear(), endInclusive.getMonth(), endInclusive.getDate() + 1)
                : null;
            if (!start) return;

            let phasePosition = 'progress';
            if (selectedDate === startDate && selectedDate === endDate) phasePosition = 'single';
            else if (selectedDate === startDate) phasePosition = 'start';
            else if (selectedDate === endDate) phasePosition = 'end';

            events.push({
                id: `PHASE_PANEL:${entityId}`,
                title: record.title || '기간별 계획',
                start,
                end: endExclusive,
                allDay: true,
                extendedProps: {
                    calendarV2Kind: 'PHASE',
                    itemType: 'PHASE',
                    displayType: 'PROJ',
                    entityId,
                    sourceColor: record.color || null,
                    description: record.description || '',
                    recurring: !!record.recurring,
                    taskId: record.taskId || null,
                    projId: record.projId || effectiveProjectId() || null,
                    wsId: record.wsId || effectiveProjectWsId() || null,
                    projectScope: record.projectScope || effectiveProjectScope(),
                    originalStartDt: record.start,
                    originalEndDt: record.end,
                    phasePosition,
                    phaseStartDate: startDate,
                    phaseEndDate: endDate,
                    raw: record.raw || {}
                }
            });
        });

        return events;
    }

    function rebuildRuntimeEventIndex(events) {
        const all = Array.isArray(events) ? events.filter(Boolean) : [];
        const byDate = new Map();
        const holidaysByDate = new Map();
        const searchable = [];

        const viewStart = calendar?.view?.activeStart || calendar?.view?.currentStart || null;
        const viewEnd = calendar?.view?.activeEnd || calendar?.view?.currentEnd || null;
        if (viewStart && viewEnd) {
            for (let cursor = new Date(viewStart.getFullYear(), viewStart.getMonth(), viewStart.getDate()); cursor < viewEnd; cursor.setDate(cursor.getDate() + 1)) {
                byDate.set(toDateOnly(cursor), []);
            }
        }

        all.forEach((event) => {
            const props = event?.extendedProps || {};
            const kind = String(props.calendarV2Kind || '').toUpperCase();
            if (event?.start && isSearchableCalendarEvent(event)) searchable.push(event);
            if (kind !== 'PROJECT_PERIOD') {
                byDate.forEach((bucket, dateString) => {
                    if (eventOccursOnDate(event, dateString)) bucket.push(event);
                });
            }
            if (props.displayType === 'HOLIDAY' && event?.start) {
                const date = toDateOnly(event.start);
                const title = String(event.title || '').trim();
                if (!holidaysByDate.has(date)) holidaysByDate.set(date, []);
                if (title) holidaysByDate.get(date).push(title);
            }
        });

        byDate.forEach((bucket) => {
            bucket.sort((a, b) => {
                if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
                return (a.start?.getTime() || 0) - (b.start?.getTime() || 0);
            });
        });

        runtimeEventIndex.all = all;
        runtimeEventIndex.searchable = searchable;
        runtimeEventIndex.byDate = byDate;
        runtimeEventIndex.holidaysByDate = holidaysByDate;
    }

    function getPanelCategory(event) {
        const props = event?.extendedProps || {};
        const kind = String(props.calendarV2Kind || '').toUpperCase();
        if (kind === 'TASK') return 'TASK';
        if (kind === 'BIRTHDAY' || String(props.displayType || '').toUpperCase() === 'BIRTHDAY') return 'BIRTHDAY';
        if (['PLAN', 'PHASE', 'PHASE_BOUNDARY', 'WEEKLY_PLAN', 'TIME_PLAN'].includes(kind)) return 'PLAN';
        if (kind === 'SCHEDULE' && props.displayType !== 'HOLIDAY') return 'SCHEDULE';
        if (props.displayType === 'TASK') return 'TASK';
        return props.displayType === 'HOLIDAY' ? 'HOLIDAY' : 'SCHEDULE';
    }

    function panelTimeLabel(event, dateString) {
        if (!event || event.allDay) return '종일';
        const start = event.start;
        if (!start) return '';
        const startsToday = toDateOnly(start) === dateString;
        if (!startsToday) return '이어지는 일정';
        return eventTimeFormatter.format(start);
    }

    function createPanelSummary(counts) {
        const summary = document.createElement('div');
        summary.className = 'moyo-cal2-day-summary';
        [
            ['SCHEDULE', '일정', counts.SCHEDULE],
            ['TASK', '업무', counts.TASK],
            ['PLAN', '계획', counts.PLAN]
        ].forEach(([kind, label, count]) => {
            const item = document.createElement('div');
            item.className = `moyo-cal2-day-summary-item is-${kind.toLowerCase()}`;
            const value = document.createElement('strong');
            value.textContent = String(count || 0);
            const text = document.createElement('span');
            text.textContent = label;
            item.append(value, text);
            summary.appendChild(item);
        });
        return summary;
    }

    function planKindLabel(kind) {
        const value = String(kind || '').toUpperCase();
        if (value === 'PHASE') return '기간별 계획';
        if (value === 'WEEKLY_PLAN') return '주간 계획';
        if (value === 'TIME_PLAN') return '시간별 계획';
        return '계획';
    }

    // ---------------------------------------------------------------------
    // Step 34: interaction guard / keyboard activation
    // 빠른 연속 클릭으로 동일 모달이 두 번 열리는 것만 막고, 월 이동처럼
    // 사용자가 반복해서 누르는 것이 자연스러운 동작은 제한하지 않는다.
    // ---------------------------------------------------------------------
    const interactionStamp = new Map();

    function runInteractionOnce(key, callback, cooldown = 420) {
        if (typeof callback !== 'function') return false;
        const now = window.performance?.now ? window.performance.now() : Date.now();
        const previous = interactionStamp.get(key) || -Infinity;
        if (now - previous < cooldown) return false;
        interactionStamp.set(key, now);
        callback();
        return true;
    }

    function calendarItemInteractionKey(event) {
        const props = event?.extendedProps || {};
        const kind = String(props.calendarV2Kind || props.displayType || 'SCHEDULE').toUpperCase();
        const entity = props.taskId || props.entityId || event?.id || event?.title || 'unknown';
        const occurrence = event?.start ? toDateOnly(event.start) : '';
        return `${kind}:${entity}:${occurrence}`;
    }

    function openPanelEvent(event) {
        const props = event?.extendedProps || {};
        const category = getPanelCategory(event);
        const key = `panel:${calendarItemInteractionKey(event)}`;

        runInteractionOnce(key, () => {
            if (category === 'SCHEDULE' && event.id && window.MoyoCalendarV2Bridge?.openSchedule) {
                window.MoyoCalendarV2Bridge.openSchedule(event.id, {
                    occurrenceDate: event.start ? toDateOnly(event.start) : state.selectedDate
                });
                return;
            }
            if (category === 'TASK' && window.MoyoCalendarV2Bridge?.openTask) {
                const taskId = props.taskId || event.id;
                if (!taskId) return;
                window.MoyoCalendarV2Bridge.openTask(taskId, buildTaskProjectContext(props));
                return;
            }
            if (category === 'PLAN' && window.MoyoCalendarV2Bridge?.openPlan) {
                const kind = String(props.calendarV2Kind || props.itemType || '').toUpperCase();
                const entityId = props.entityId || String(event.id || '').split(':')[1] || '';
                if (!entityId) return;
                window.MoyoCalendarV2Bridge.openPlan({
                    kind,
                    type: kind,
                    entityId,
                    id: entityId,
                    title: event.title || '',
                    start: props.originalStartDt || (event.start ? event.start.toISOString() : ''),
                    end: props.originalEndDt || (event.end ? event.end.toISOString() : ''),
                    color: props.sourceColor || '',
                    description: props.description || ''
                }, buildTaskProjectContext(props));
            }
        });
    }

    function isScheduleOwnedBySession(props) {
        if (!props) return false;
        if (String(props.ownerYn || '').toUpperCase() === 'Y') return true;
        const sessionUserId = String(window.MOYO_CALENDAR_SESSION_USER_ID || '');
        const ownerUserId = String(props.ownerUserId || '');
        return Boolean(sessionUserId && ownerUserId && sessionUserId === ownerUserId);
    }

    function isProjectScheduleProps(props) {
        if (!props) return false;
        const kind = String(props.calendarV2Kind || '').toUpperCase();
        if (kind !== 'SCHEDULE') return false;
        const itemType = String(props.itemType || '').toUpperCase();
        const displayType = String(props.displayType || '').toUpperCase();
        return itemType === 'PROJ' || displayType === 'PROJ';
    }

    function isMoyoPublicScheduleProps(props) {
        if (!props) return false;
        if (String(props.calendarV2Kind || '').toUpperCase() !== 'SCHEDULE') return false;
        if (String(props.itemType || '').toUpperCase() !== 'PRIVATE') return false;
        return String(props.visibilityType || '').toUpperCase() === 'MOYO'
            || String(props.moyoPublicYn || '').toUpperCase() === 'Y'
            || String(props.isPrivate || '').toUpperCase() === 'N';
    }

    function projectTypeForEvent(props) {
        if (!props) return '';

        // 시작/종료 boundary 이벤트처럼 projectType을 extendedProps에 직접 싣는 경우를
        // 가장 먼저 사용한다. 기존 구현은 raw만 확인해서 항상 기본 프로젝트 아이콘으로 fallback 됐다.
        const directProps = firstValue(props, [
            'projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY'
        ], '');
        if (directProps) return directProps;

        const raw = props.raw || {};
        const directRaw = firstValue(raw, [
            'projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY'
        ], '');
        if (directRaw) return directRaw;

        const projId = String(props.projId || '');
        if (!projId) return '';

        const project = mapProjectsForSelector().find((item) => String(item.id || '') === projId);
        return project?.type || '';
    }

    function buildScheduleAvatar(props, fallbackLabel) {
        const avatar = document.createElement('span');
        avatar.className = 'moyo-cal2-event-avatar';
        const ownerName = String(props?.ownerName || '').trim() || fallbackLabel || '사용자';
        const imagePath = normalizeImagePath(props?.ownerProfileImagePath || '');
        if (imagePath) {
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = `${ownerName} 프로필`;
            img.loading = 'lazy';
            avatar.appendChild(img);
        } else {
            avatar.classList.add('is-initial');
            avatar.textContent = ownerName.substring(0, 1) || '?';
            avatar.setAttribute('aria-label', `${ownerName} 프로필`);
        }
        avatar.title = ownerName;
        return avatar;
    }

    function buildTaskAssigneeAvatar(props, panel = false) {
        const avatar = document.createElement('span');
        avatar.className = panel
            ? 'moyo-cal2-day-item-avatar is-task-assignee'
            : 'moyo-cal2-event-avatar is-task-assignee';

        const assigneeName = String(props?.assigneeName || '').trim() || '미지정';
        const imagePath = normalizeImagePath(props?.assigneeProfileImagePath || '');

        if (imagePath) {
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = `${assigneeName} 프로필`;
            img.loading = 'lazy';
            avatar.appendChild(img);
        } else {
            avatar.classList.add('is-initial');
            avatar.textContent = assigneeName === '미지정' ? '?' : (assigneeName.substring(0, 1) || '?');
            avatar.setAttribute('aria-label', `${assigneeName} 프로필`);
        }

        avatar.title = assigneeName;
        return avatar;
    }

    function buildProjectTypeIcon(props, panel = false) {
        const icon = document.createElement('span');
        icon.className = panel ? 'moyo-cal2-day-item-project-icon' : 'moyo-cal2-event-project-icon';
        const i = document.createElement('i');
        i.className = `fa-solid ${projectTypeIconClass(projectTypeForEvent(props))}`;
        i.setAttribute('aria-hidden', 'true');
        icon.appendChild(i);
        icon.title = projectTypeLabel(projectTypeForEvent(props));
        return icon;
    }

    function buildMoyoPublicMark(className) {
        const mark = document.createElement('img');
        mark.className = className;
        mark.src = normalizeImagePath('/brand/moyo_mark.png');
        mark.alt = '모요 공개';
        mark.title = '모요 공개';
        mark.loading = 'lazy';
        return mark;
    }

    function createPanelEventRow(event, dateString) {
        const props = event.extendedProps || {};
        const category = getPanelCategory(event);
        const displayType = String(props.displayType || '').toUpperCase();
        const isBirthday = category === 'BIRTHDAY';
        const isProjectSchedule = category === 'SCHEDULE' && isProjectScheduleProps(props);
        const isOwnSchedule = category === 'SCHEDULE' && !isProjectSchedule && isScheduleOwnedBySession(props);
        const isFriendSchedule = category === 'SCHEDULE'
            && !isProjectSchedule
            && !isOwnSchedule
            && ['FRIEND', 'MOYO'].includes(displayType);
        const isMoyoPublic = isMoyoPublicScheduleProps(props);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `moyo-cal2-day-item is-${category.toLowerCase()}`;
        if (isFriendSchedule) row.classList.add('is-friend-schedule', 'has-scope-icon');
        else if (isOwnSchedule) row.classList.add('is-own-schedule', 'has-scope-icon');
        else if (isProjectSchedule) row.classList.add('is-project-schedule', 'has-scope-icon');
        if (category === 'PLAN') {
            const planKind = String(props.calendarV2Kind || '').toUpperCase();
            if (planKind) row.classList.add(`is-plan-${planKind.toLowerCase().replace('_', '-')}`);

            // 기간계획의 실제 저장 색상을 우측 패널 전체 표현에 그대로 사용한다.
            // 기본 파랑/보라로 덮어쓰지 않는다.
            const planColor = normalizeCssColor(props.sourceColor);
            if (planColor) {
                row.style.setProperty('--cal2-day-item-accent', planColor);
                row.style.setProperty('--cal2-plan-color', planColor);
            }
        }
        if (category === 'TASK') {
            const status = normalizeTaskStatus(props.status);
            row.classList.add(`is-task-${status.toLowerCase().replace('_', '-')}`);
            if (String(props.delayedYn || '').toUpperCase() === 'Y') row.classList.add('is-task-delayed');
        }
        row.dataset.eventId = event.id || '';

        // 생일/공휴일 같은 조회 전용 항목은 native disabled를 쓰면
        // 브라우저 기본 스타일 때문에 프로필/텍스트가 회색으로 죽는다.
        // 시각은 정상 유지하고 aria-disabled로만 조회 전용임을 표현한다.
        if (!['SCHEDULE', 'TASK', 'PLAN'].includes(category)) {
            row.setAttribute('aria-disabled', 'true');
            row.classList.add('is-readonly');
        }

        const visualNodes = [];
        if (category === 'TASK') {
            visualNodes.push(buildTaskAssigneeAvatar(props, true));
        } else if (isBirthday) {
            const avatar = document.createElement('span');
            avatar.className = 'moyo-cal2-day-item-avatar';
            const ownerName = String(props.ownerName || event.title || '').replace(/\s*생일\s*$/, '').trim() || '친구';
            const imagePath = normalizeImagePath(props.ownerProfileImagePath || '');
            if (imagePath) {
                const img = document.createElement('img');
                img.src = imagePath;
                img.alt = `${ownerName} 프로필`;
                img.loading = 'lazy';
                avatar.appendChild(img);
            } else {
                avatar.classList.add('is-initial');
                avatar.textContent = ownerName.substring(0, 1) || '?';
            }
            avatar.title = ownerName;
            visualNodes.push(avatar);
        } else if (isFriendSchedule || isOwnSchedule || isProjectSchedule) {
            // 일정의 1차 식별자는 작성자 프로필이지만,
            // 기존 scope 세로선도 함께 유지한다.
            const line = document.createElement('span');
            line.className = 'moyo-cal2-day-item-marker';
            if (isFriendSchedule) {
                line.style.setProperty('--cal2-day-item-accent', 'var(--cal2-scope-friend)');
            } else if (isOwnSchedule) {
                line.style.setProperty('--cal2-day-item-accent', 'var(--cal2-scope-private)');
            } else {
                line.style.setProperty('--cal2-day-item-accent', 'var(--cal2-scope-project)');
            }
            visualNodes.push(line);

            const avatar = document.createElement('span');
            avatar.className = 'moyo-cal2-day-item-avatar';
            const ownerName = String(props.ownerName || '').trim()
                || (isOwnSchedule ? '나' : (isProjectSchedule ? '작성자' : '친구'));
            const imagePath = normalizeImagePath(props.ownerProfileImagePath || '');
            if (imagePath) {
                const img = document.createElement('img');
                img.src = imagePath;
                img.alt = `${ownerName} 프로필`;
                img.loading = 'lazy';
                avatar.appendChild(img);
            } else {
                avatar.classList.add('is-initial');
                avatar.textContent = ownerName.substring(0, 1) || '?';
            }
            avatar.title = ownerName;
            visualNodes.push(avatar);
        } else {
            const marker = document.createElement('span');
            marker.className = 'moyo-cal2-day-item-marker';
            visualNodes.push(marker);
        }

        const content = document.createElement('span');
        content.className = 'moyo-cal2-day-item-content';

        const titleLine = document.createElement('span');
        titleLine.className = 'moyo-cal2-day-item-title-line';

        const title = document.createElement('strong');
        title.className = 'moyo-cal2-day-item-title';
        title.textContent = isBirthday
            ? (String(event.title || '친구').replace(/\s*생일\s*$/, '') || '친구')
            : (event.title || '제목 없음');
        titleLine.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'moyo-cal2-day-item-meta';
        if (category === 'TASK') {
            const bits = ['업무', taskStatusLabel(props.status, props.delayedYn)];
            if (props.assigneeName) bits.push(props.assigneeName);
            meta.textContent = bits.join(' · ');
        } else if (category === 'BIRTHDAY') {
            meta.textContent = '친구 생일';
        } else if (category === 'PLAN') {
            const bits = [planKindLabel(props.calendarV2Kind)];

            if (String(props.calendarV2Kind || '').toUpperCase() === 'PHASE') {
                const phasePosition = String(props.phasePosition || '').toLowerCase();
                const phaseState = phasePosition === 'start'
                    ? '시작'
                    : (phasePosition === 'end'
                        ? '종료'
                        : (phasePosition === 'single' ? '당일' : '진행 중'));
                bits.push(phaseState);
            } else {
                const time = panelTimeLabel(event, dateString);
                if (time && time !== '종일') bits.push(time);
            }

            meta.textContent = bits.join(' · ');
        } else {
            const time = panelTimeLabel(event, dateString);
            if (isFriendSchedule || isProjectSchedule) {
                const ownerName = String(props.ownerName || '').trim()
                    || (isProjectSchedule ? '작성자' : '친구');
                meta.textContent = [ownerName, time].filter(Boolean).join(' · ');
            } else {
                meta.textContent = time;
            }
        }
        content.append(titleLine, meta);

        const arrow = document.createElement('span');
        arrow.className = 'moyo-cal2-day-item-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '›';
        const tail = document.createElement('span');
        tail.className = 'moyo-cal2-day-item-tail';
        if (isBirthday) {
            const birthdayIcon = document.createElement('span');
            birthdayIcon.className = 'moyo-cal2-day-item-birthday-icon';
            birthdayIcon.title = '생일';
            birthdayIcon.setAttribute('aria-label', '생일');
            const cake = document.createElement('i');
            cake.className = 'fa-solid fa-cake-candles';
            cake.setAttribute('aria-hidden', 'true');
            birthdayIcon.appendChild(cake);
            tail.appendChild(birthdayIcon);
        } else if (isMoyoPublic) {
            tail.appendChild(buildMoyoPublicMark('moyo-cal2-day-item-public-mark'));
        }
        tail.appendChild(arrow);

        row.append(...visualNodes, content, tail);
        if (!row.disabled) row.addEventListener('click', () => openPanelEvent(event));
        return row;
    }

    function renderSelectedDayPanel() {
        if (!dayPanelBody || !dayPanelDate || !dayPanelMeta) return;
        const selectedDate = state.selectedDate;
        dayPanelBody.replaceChildren();

        if (!selectedDate) {
            dayPanel.classList.remove('has-selection');
            dayPanelDate.textContent = '날짜를 선택해 주세요';
            dayPanelMeta.textContent = '달력에서 하루를 골라보세요.';
            dayPanelMeta.hidden = false;
            if (dayPanelToday) dayPanelToday.hidden = true;
            if (dayCategoryTabs) dayCategoryTabs.hidden = true;

            const empty = document.createElement('div');
            empty.className = 'moyo-cal2-day-panel-empty';
            empty.innerHTML = '<span class="moyo-cal2-day-panel-empty-icon" aria-hidden="true"><i class="fa-regular fa-calendar"></i></span><p>날짜를 선택하면 하루 내용을 한눈에 볼 수 있어요.</p>';
            dayPanelBody.appendChild(empty);
            return;
        }

        dayPanel.classList.add('has-selection');
        dayPanelDate.textContent = formatSelectedDayTitle(selectedDate);
        const events = getSelectedDayEvents(selectedDate);
        const holidays = events.filter((event) => getPanelCategory(event) === 'HOLIDAY');

        // 선택 날짜 패널의 기본 우선순위:
        // 계획 -> 일정 -> 업무
        const selectedDayCategoryOrder = { PLAN: 0, SCHEDULE: 1, TASK: 2 };
        const contentEvents = events
            .filter((event) => getPanelCategory(event) !== 'HOLIDAY')
            .sort((a, b) => {
                const aCategory = getPanelCategory(a);
                const bCategory = getPanelCategory(b);
                const categoryDiff = (selectedDayCategoryOrder[aCategory] ?? 9)
                    - (selectedDayCategoryOrder[bCategory] ?? 9);
                if (categoryDiff !== 0) return categoryDiff;

                const aStart = a?.start instanceof Date ? a.start.getTime() : 0;
                const bStart = b?.start instanceof Date ? b.start.getTime() : 0;
                return aStart - bStart;
            });
        const holidayText = holidays.map((event) => event.title).filter(Boolean).join(' · ');
        dayPanelMeta.textContent = holidayText;
        dayPanelMeta.hidden = !holidayText;
        if (dayPanelToday) dayPanelToday.hidden = !isTodayDateOnly(selectedDate);

        const counts = { ALL: contentEvents.length, SCHEDULE: 0, TASK: 0, PLAN: 0 };
        contentEvents.forEach((event) => {
            const category = getPanelCategory(event);
            if (Object.prototype.hasOwnProperty.call(counts, category)) counts[category] += 1;
        });

        if (dayCategoryTabs) {
            dayCategoryTabs.hidden = false;

            // 우측 패널 탭 순서: 전체 / 계획 / 일정 / 업무
            ['ALL', 'PLAN', 'SCHEDULE', 'TASK'].forEach((category) => {
                const button = dayCategoryTabs.querySelector(`[data-day-category="${category}"]`);
                if (button) dayCategoryTabs.appendChild(button);
            });

            dayCategoryTabs.querySelectorAll('[data-day-category]').forEach((button) => {
                const category = String(button.dataset.dayCategory || 'ALL').toUpperCase();
                button.classList.toggle('is-active', category === selectedDayCategory);
                button.setAttribute('aria-pressed', category === selectedDayCategory ? 'true' : 'false');
                const countEl = button.querySelector('[data-day-count]');
                if (countEl) countEl.textContent = String(counts[category] || 0);
            });
        }

        const visibleEvents = selectedDayCategory === 'ALL'
            ? contentEvents
            : contentEvents.filter((event) => getPanelCategory(event) === selectedDayCategory);

        const list = document.createElement('div');
        list.className = 'moyo-cal2-day-list';
        if (visibleEvents.length) {
            visibleEvents.forEach((event) => list.appendChild(createPanelEventRow(event, selectedDate)));
        } else {
            const empty = document.createElement('div');
            empty.className = 'moyo-cal2-day-content-empty';
            if (contentEvents.length && selectedDayCategory !== 'ALL') {
                const label = selectedDayCategory === 'SCHEDULE' ? '일정' : selectedDayCategory === 'TASK' ? '업무' : '계획';
                empty.innerHTML = `<strong>이 날 등록된 ${label}이 없어요.</strong><span>다른 항목을 확인해 보세요.</span>`;
            } else {
                empty.innerHTML = canCreateScheduleInCurrentScope()
                    ? '<strong>아직 등록된 내용이 없어요.</strong><span>가볍게 일정을 하나 추가해볼까요?</span>'
                    : '<strong>아직 등록된 내용이 없어요.</strong><span>이 범위는 조회 전용이에요.</span>';
            }
            list.appendChild(empty);
        }
        dayPanelBody.appendChild(list);

        if (canCreateScheduleInCurrentScope()) {
            const actions = document.createElement('div');
            actions.className = 'moyo-cal2-day-actions';
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'moyo-cal2-day-add';
            addButton.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>일정 추가</span>';
            addButton.addEventListener('click', openScheduleCreate);
            actions.appendChild(addButton);
            dayPanelBody.appendChild(actions);
        }
    }

    // ---------------------------------------------------------------------
    // Step 31: Search V2
    // 현재 FullCalendar에 로드된 월 범위의 일정/업무/계획만 대상으로 한다.
    // 별도 검색 API나 기존 calendar.js 검색 DOM에는 의존하지 않는다.
    // ---------------------------------------------------------------------
    function normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFKC')
            .trim()
            .toLocaleLowerCase('ko-KR');
    }

    function searchTypeLabel(event) {
        const category = getPanelCategory(event);
        const props = event?.extendedProps || {};
        if (category === 'TASK') return '업무';
        if (category === 'BIRTHDAY') return '친구 생일';
        if (category === 'PLAN') return planKindLabel(props.calendarV2Kind);
        return '일정';
    }

    function isSearchableCalendarEvent(event) {
        if (!event || !event.start) return false;
        const props = event.extendedProps || {};
        const kind = String(props.calendarV2Kind || '').toUpperCase();
        const category = getPanelCategory(event);
        if (props.displayType === 'HOLIDAY' || kind === 'PROJECT_PERIOD') return false;
        if (!['SCHEDULE', 'TASK', 'PLAN'].includes(category)) return false;

        const view = calendar?.view;
        if (!view?.currentStart || !view?.currentEnd) return true;
        const eventStart = event.start;
        const eventEnd = event.end || new Date(eventStart.getTime() + 1);
        return eventStart < view.currentEnd && eventEnd > view.currentStart;
    }

    function buildSearchHaystack(event) {
        const props = event.extendedProps || {};
        return normalizeSearchText([
            event.title,
            searchTypeLabel(event),
            planKindLabel(props.calendarV2Kind),
            props.description,
            props.assigneeName,
            taskStatusLabel(props.status, props.delayedYn),
            props.scopeLabel,
            props.projectName,
            props.workspaceName
        ].filter(Boolean).join(' '));
    }

    function searchResultMeta(event) {
        const type = searchTypeLabel(event);
        const date = event.start ? toDateOnly(event.start) : '';
        const parsed = parseDateOnlyLocal(date);
        const dateLabel = parsed ? searchDateFormatter.format(parsed) : '';
        const time = date ? panelTimeLabel(event, date) : '';
        const bits = [type, dateLabel];
        if (time && time !== '종일') bits.push(time);
        const props = event.extendedProps || {};
        if (getPanelCategory(event) === 'TASK') bits.push(taskStatusLabel(props.status, props.delayedYn));
        return bits.filter(Boolean).join(' · ');
    }

    function getSearchMatches(query) {
        if (!calendar) return [];
        const normalized = normalizeSearchText(query);
        if (!normalized) return [];

        const matches = runtimeEventIndex.searchable
            .filter((event) => buildSearchHaystack(event).includes(normalized))
            .sort((a, b) => {
                const aTime = a.start?.getTime() || 0;
                const bTime = b.start?.getTime() || 0;
                if (aTime !== bTime) return aTime - bTime;
                return String(a.title || '').localeCompare(String(b.title || ''), 'ko-KR');
            });

        // 반복 일정 instance까지 포함하되 동일 instance가 중복으로 잡히는 경우만 제거한다.
        const seen = new Set();
        return matches.filter((event) => {
            const props = event.extendedProps || {};
            const key = [
                props.calendarV2Kind || props.displayType || 'SCHEDULE',
                event.id || props.entityId || props.taskId || event.title,
                event.start ? event.start.toISOString() : '',
                event.end ? event.end.toISOString() : ''
            ].join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 40);
    }

    function createSearchEmpty(title, description) {
        const empty = document.createElement('div');
        empty.className = 'moyo-cal2-search-empty';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-magnifying-glass';
        icon.setAttribute('aria-hidden', 'true');
        const strong = document.createElement('strong');
        strong.textContent = title;
        const text = document.createElement('span');
        text.textContent = description;
        empty.append(icon, strong, text);
        return empty;
    }

    function openSearchResult(event) {
        if (!event?.start) return;
        const date = toDateOnly(event.start);
        if (date) {
            calendar.gotoDate(date);
            selectCalendarDate(date, { reason: 'calendar:search-result' });
        }
        closeSearchPanel({ keepQuery: true, restoreFocus: false });
        window.requestAnimationFrame(() => openPanelEvent(event));
    }

    function createSearchResultRow(event) {
        const props = event.extendedProps || {};
        const category = getPanelCategory(event);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `moyo-cal2-search-result is-${category.toLowerCase()}`;
        row.setAttribute('role', 'listitem');
        if (category === 'PLAN') {
            const planKind = String(props.calendarV2Kind || '').toUpperCase();
            if (planKind) row.classList.add(`is-plan-${planKind.toLowerCase().replaceAll('_', '-')}`);
        }

        const marker = document.createElement('span');
        marker.className = 'moyo-cal2-search-result-marker';
        const sourceColor = normalizeCssColor(props.sourceColor);
        if (sourceColor && category === 'SCHEDULE') marker.style.backgroundColor = sourceColor;
        if (sourceColor && category === 'PLAN') {
            const planKind = String(props.calendarV2Kind || '').toUpperCase();
            if (planKind === 'TIME_PLAN') marker.style.backgroundColor = sourceColor;
            else marker.style.borderColor = sourceColor;
        }

        const content = document.createElement('span');
        content.className = 'moyo-cal2-search-result-content';
        const title = document.createElement('strong');
        title.className = 'moyo-cal2-search-result-title';
        title.textContent = event.title || '제목 없음';
        const meta = document.createElement('span');
        meta.className = 'moyo-cal2-search-result-meta';
        meta.textContent = searchResultMeta(event);
        content.append(title, meta);

        const arrow = document.createElement('span');
        arrow.className = 'moyo-cal2-search-result-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '›';

        row.append(marker, content, arrow);
        row.addEventListener('click', () => openSearchResult(event));
        return row;
    }

    function renderSearchResults() {
        if (!searchResults || !searchStatus) return;
        const query = String(state.search.query || '');
        searchResults.replaceChildren();
        if (searchClearButton) searchClearButton.hidden = !query;

        if (!normalizeSearchText(query)) {
            searchStatus.textContent = '현재 달에 불러온 일정·업무·계획에서 검색해요.';
            searchResults.appendChild(createSearchEmpty(
                '찾고 싶은 내용을 입력해 주세요.',
                '일정 제목, 업무 상태, 계획 이름까지 함께 찾아볼 수 있어요.'
            ));
            return;
        }

        const matches = getSearchMatches(query);
        searchStatus.textContent = matches.length
            ? `${matches.length}개의 결과를 찾았어요.`
            : '검색 결과가 없어요.';

        if (!matches.length) {
            searchResults.appendChild(createSearchEmpty(
                '일치하는 내용이 없어요.',
                '검색어를 바꾸거나 다른 범위·월에서 다시 찾아보세요.'
            ));
            return;
        }

        const fragment = document.createDocumentFragment();
        matches.forEach((event) => fragment.appendChild(createSearchResultRow(event)));
        searchResults.appendChild(fragment);
    }

    let searchRenderFrame = 0;
    function scheduleSearchResultsRender() {
        if (searchRenderFrame) window.cancelAnimationFrame(searchRenderFrame);
        searchRenderFrame = window.requestAnimationFrame(() => {
            searchRenderFrame = 0;
            if (state.search.open) renderSearchResults();
        });
    }

    function openSearchPanel(options = {}) {
        if (!searchPanel || !searchInput) return;
        searchPanel.hidden = false;
        searchInput.setAttribute('aria-expanded', 'true');
        setSearchState({ open: true });
        if (searchInput.value !== state.search.query) searchInput.value = state.search.query || '';
        renderSearchResults();
        if (options.focus !== false) window.requestAnimationFrame(() => searchInput.focus());
    }

    function closeSearchPanel(options = {}) {
        if (!searchPanel || !searchInput) return;
        searchPanel.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
        if (!options.keepQuery) {
            searchInput.value = '';
            setSearchState({ query: '', open: false });
        } else {
            setSearchState({ open: false });
        }
        if (options.restoreFocus === true) searchInput.focus();
    }

    function clearSearchQuery() {
        if (searchInput) searchInput.value = '';
        setSearchState({ query: '' });
        scheduleSearchResultsRender();
        searchInput?.focus();
    }

    function replaceCalendarUrl(url) {
        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(window.history.state, '', nextUrl);
    }

    function syncSelectedDateQuery(dateString) {
        const url = new URL(window.location.href);
        if (dateString) url.searchParams.set('selectedDate', dateString);
        else url.searchParams.delete('selectedDate');
        replaceCalendarUrl(url);
    }

    function syncViewDateQuery(dateString) {
        const url = new URL(window.location.href);
        if (dateString) url.searchParams.set('viewDate', dateString);
        else url.searchParams.delete('viewDate');
        replaceCalendarUrl(url);
    }

    function syncScopeQuery() {
        const url = new URL(window.location.href);
        ['scope', 'view', 'friendId', 'wsId', 'projId', 'projectScope', 'calendarContext',
         'groupFilter', 'eventFilter', 'taskStatus', 'taskMemberId', 'planFilter', 'moyoOnly', 'moyoPublic']
            .forEach((key) => url.searchParams.delete(key));

        if (calendarContext === 'PROJECT') {
            url.searchParams.set('scope', 'PROJ');
            url.searchParams.set('view', state.scope);
            if (contextWsId) url.searchParams.set('wsId', String(contextWsId));
            if (contextProjId) url.searchParams.set('projId', String(contextProjId));
            if (state.projectScope) url.searchParams.set('projectScope', String(state.projectScope));
            if (state.scope === 'EVENT' && state.projectScheduleFilter !== 'ALL') url.searchParams.set('eventFilter', state.projectScheduleFilter);
            if (state.scope === 'TASK') {
                if (state.taskStatusFilter !== 'ALL') url.searchParams.set('taskStatus', state.taskStatusFilter);
                if (state.taskMemberFilter !== 'ALL') url.searchParams.set('taskMemberId', state.taskMemberFilter);
            }
            if (state.scope === 'PLAN' && state.planFilter !== 'ALL') url.searchParams.set('planFilter', state.planFilter);
            replaceCalendarUrl(url);
            return;
        }

        url.searchParams.set('scope', state.scope);
        url.searchParams.set('calendarContext', calendarContext);
        if (state.scope === 'FRIEND' && state.friendId) {
            url.searchParams.set('friendId', String(state.friendId));
        } else if (state.scope === 'WS') {
            if (contextWsId || state.wsId) url.searchParams.set('wsId', String(contextWsId || state.wsId));
            if (state.groupScheduleFilter !== 'ALL') url.searchParams.set('groupFilter', state.groupScheduleFilter);
        } else if (state.scope === 'PROJ') {
            if (state.projectScope) url.searchParams.set('projectScope', String(state.projectScope));
            if (contextWsId || state.wsId) url.searchParams.set('wsId', String(contextWsId || state.wsId));
            if (state.projId) url.searchParams.set('projId', String(state.projId));
        } else if (calendarContext === 'GROUP' && contextWsId) {
            url.searchParams.set('wsId', String(contextWsId));
        }
        if (calendarContext === 'PERSONAL' && !state.moyoPublicVisible) url.searchParams.set('moyoPublic', 'OFF');
        replaceCalendarUrl(url);
    }

    function consumeDeepLinkQuery() {
        const url = new URL(window.location.href);
        url.searchParams.delete('viewEventId');
        url.searchParams.delete('eventId');
        url.searchParams.delete('editEventId');
        replaceCalendarUrl(url);
    }

    function openInitialDeepLink() {
        // 수정 링크를 상세 링크보다 우선한다. 두 값이 동시에 존재해도 모달은 하나만 연다.
        const targetEditId = initialEditEventId;
        const targetViewId = targetEditId ? null : initialViewEventId;
        if (!targetEditId && !targetViewId) return;

        const bridge = window.MoyoCalendarV2Bridge;
        if (!bridge) {
            console.error('[Calendar V2] URL deep-link bridge를 불러오지 못했습니다.');
            return;
        }

        // 모달을 연 뒤 새로고침했을 때 같은 모달이 반복해서 열리지 않도록 먼저 소비한다.
        consumeDeepLinkQuery();

        if (targetEditId && typeof bridge.editSchedule === 'function') {
            bridge.editSchedule(targetEditId);
            return;
        }
        if (targetViewId && typeof bridge.openSchedule === 'function') {
            bridge.openSchedule(targetViewId);
        }
    }

    function syncSelectedDayVisual() {
        const selectedDate = state.selectedDate;
        calendarEl.querySelectorAll('.fc-daygrid-day.is-cal2-selected').forEach((cell) => {
            cell.classList.remove('is-cal2-selected');
            cell.removeAttribute('aria-selected');
        });

        if (!selectedDate) return;
        const selectedCell = calendarEl.querySelector(`.fc-daygrid-day[data-date=\"${selectedDate}\"]`);
        if (!selectedCell) return;
        selectedCell.classList.add('is-cal2-selected');
        selectedCell.setAttribute('aria-selected', 'true');
    }

    function selectCalendarDate(value, meta = {}) {
        const selectedDate = toDateOnly(value) || null;
        if (String(state.selectedDate || '') !== String(selectedDate || '')) selectedDayCategory = 'ALL';
        setState({ selectedDate }, {
            reason: meta.reason || 'calendar:selected-date'
        });
        syncSelectedDateQuery(selectedDate);
        syncSelectedDayVisual();
        renderSelectedDayPanel();
        return selectedDate;
    }

    function normalizeImagePath(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        return raw.startsWith('/') ? contextPath + raw : contextPath + '/' + raw;
    }

    function inferProjectScope(item) {
        const source = item || {};
        const explicit = String(source.projectScope || source.PROJECT_SCOPE || '').toUpperCase();
        if (explicit === 'PERSONAL' || explicit === 'GROUP') return explicit;
        const wsId = source.wsId || source.WS_ID || source.workspaceId || source.WORKSPACE_ID || null;
        return wsId ? 'GROUP' : 'PERSONAL';
    }

    // ---------------------------------------------------------------------
    // Step 16: monthly data source
    // 기존 calendar.js의 AJAX/UI 결합 코드를 가져오지 않고 V2 전용 데이터 경계를 둔다.
    // ---------------------------------------------------------------------
    const monthlyStore = {
        requestId: 0,
        controller: null,
        range: null,
        request: null,
        requestKey: '',
        records: [],
        loadedAt: null,
        error: null,
        dirty: true
    };

    // Step 23: selected project plan source
    // PHASE / WEEKLY_PLAN / TIME_PLAN are loaded only for one selected project.
    const projectPlanStore = {
        requestId: 0,
        controller: null,
        range: null,
        requestKey: '',
        records: [],
        loadedAt: null,
        error: null,
        dirty: true
    };

    // Step 27: 프로젝트 전체 기간은 일정 row가 아니라 월간 셀 뒤의 가장 약한 context layer다.
    const projectPeriodStore = {
        projId: null,
        start: null,
        end: null,
        title: '',
        source: null
    };

    function effectiveProjectId() {
        return calendarContext === 'PROJECT' ? contextProjId : state.projId;
    }

    function effectiveProjectWsId() {
        return calendarContext === 'PROJECT' ? (state.wsId || contextWsId || null) : state.wsId;
    }

    function effectiveProjectScope() {
        if (calendarContext === 'PROJECT') {
            return String(state.projectScope || (effectiveProjectWsId() ? 'GROUP' : 'PERSONAL')).toUpperCase();
        }
        return String(state.projectScope || (state.wsId ? 'GROUP' : 'PERSONAL')).toUpperCase();
    }

    function isIndividualProjectSelection() {
        if (calendarContext === 'PROJECT') return !!effectiveProjectId();
        return state.scope === 'PROJ' && !!effectiveProjectId();
    }

    // 달력 본체는 현재 공간에서 의미 있는 데이터만 요청한다.
    // 개인/친구/그룹은 일정 중심, 개별 프로젝트를 선택한 경우에만 일정+업무를 요청한다.
    // 기간별/주간/시간별 계획은 projectPlanStore에서 별도로 불러온다.
    function getMonthlyRequestTypes() {
        if (calendarContext === 'PROJECT') return ['PROJ', 'TASK', 'HOLIDAY'];
        if (calendarContext === 'GROUP') {
            if (state.scope === 'WS') return ['WS', 'HOLIDAY'];
            if (state.scope === 'PROJ') return ['PROJ', 'HOLIDAY'];
            if (state.scope === 'ALL') return ['WS', 'PROJ', 'HOLIDAY'];
        }
        if (state.scope === 'PRIVATE') return ['PRIVATE', 'HOLIDAY'];
        if (state.scope === 'FRIEND') return ['PRIVATE', 'MOYO', 'HOLIDAY'];
        if (state.scope === 'PROJ') return ['PROJ', 'TASK', 'HOLIDAY'];
        if (state.scope === 'ALL') return ['PRIVATE', 'MOYO', 'PROJ', 'TASK', 'HOLIDAY'];
        return ['HOLIDAY'];
    }

    function addDaysDateOnly(value, amount) {
        const base = value instanceof Date ? new Date(value.getTime()) : new Date(value);
        if (Number.isNaN(base.getTime())) return '';
        base.setDate(base.getDate() + amount);
        return toDateOnly(base);
    }

    function getInclusiveFetchRange(info) {
        const startDate = toDateOnly(info && info.start);
        const exclusiveEnd = info && info.end;
        const endDate = exclusiveEnd ? addDaysDateOnly(exclusiveEnd, -1) : startDate;
        return { startDate, endDate: endDate || startDate };
    }

    function buildMonthlyRequest(info) {
        const range = getInclusiveFetchRange(info);
        const request = {
            userId: String(window.MOYO_CALENDAR_SESSION_USER_ID || ''),
            types: getMonthlyRequestTypes().join(','),
            startDate: range.startDate,
            endDate: range.endDate
        };

        // 개별 범위를 서버가 직접 지원하는 경우에만 explicit scope를 사용한다.
        // 전체/모요/프로젝트 전체는 types 기반으로 넓게 가져온 뒤 V2에서 현재 컨텍스트만 남긴다.
        if (calendarContext === 'PROJECT') {
            request.scope = 'PROJ';
            request.projId = String(contextProjId || '');
            if (contextWsId) request.wsId = String(contextWsId);
            return { range, request };
        }

        if (state.scope === 'PRIVATE' || state.scope === 'WS') {
            request.scope = state.scope;
        }

        if (state.scope === 'FRIEND' && state.friendId) {
            request.friendId = String(state.friendId);
        }

        if (calendarContext === 'GROUP' && contextWsId) {
            request.wsId = String(contextWsId);
        } else if (state.scope === 'WS' && state.wsId) {
            request.wsId = String(state.wsId);
        }

        if (state.scope === 'PROJ' && effectiveProjectId()) {
            request.scope = 'PROJ';
            request.projId = String(effectiveProjectId());
        }

        return { range, request };
    }

    function requestCacheKey(request) {
        return Object.keys(request || {})
            .sort()
            .map((key) => `${key}=${String(request[key] ?? '')}`)
            .join('&');
    }

    function invalidateCalendarData() {
        monthlyStore.dirty = true;
        projectPlanStore.dirty = true;
    }

    function firstValue(source, keys, fallback = null) {
        for (const key of keys) {
            if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
                return source[key];
            }
        }
        return fallback;
    }

    function normalizeDateTimeValue(value) {
        if (value == null) return null;
        const text = String(value).trim();
        if (!text) return null;
        return text.includes(' ') ? text.replace(' ', 'T') : text;
    }

    function normalizeMonthlyRecord(item, index) {
        const source = item && typeof item === 'object' ? item : {};
        const itemType = String(firstValue(source, ['itemType', 'itemtype', 'ITEMTYPE', 'type', 'TYPE'], 'PRIVATE')).toUpperCase();
        const start = normalizeDateTimeValue(firstValue(source, ['startDt', 'startdt', 'STARTDT', 'start', 'START']));
        const end = normalizeDateTimeValue(firstValue(source, ['endDt', 'enddt', 'ENDDT', 'end', 'END']));
        const allDayRaw = firstValue(source, ['allDay', 'ALL_DAY', 'allDayYn', 'ALL_DAY_YN'], 'N');
        const allDay = allDayRaw === true || String(allDayRaw).toUpperCase() === 'Y';

        return {
            key: String(firstValue(source, ['id', 'ID', 'eventId', 'EVENT_ID'], `${itemType}:${index}`)),
            id: firstValue(source, ['id', 'ID', 'eventId', 'EVENT_ID']),
            title: String(firstValue(source, ['title', 'TITLE'], '제목 없음')),
            itemType,
            start,
            end,
            allDay,
            color: firstValue(source, ['color', 'COLOR']),
            ownerUserId: firstValue(source, ['userId', 'USER_ID', 'ownerId', 'OWNER_ID', 'writerId', 'WRITER_ID']),
            sharedByUserId: firstValue(source, ['sharedByUserId', 'SHARED_BY_USER_ID', 'shareOwnerId', 'SHARE_OWNER_ID']),
            ownerName: firstValue(source, ['ownerName', 'OWNER_NAME', 'userName', 'USER_NAME', 'writerName', 'WRITER_NAME']),
            ownerProfileImagePath: firstValue(source, ['ownerProfileImagePath', 'OWNER_PROFILE_IMAGE_PATH', 'profileImagePath', 'PROFILE_IMAGE_PATH']),
            ownerEmail: firstValue(source, ['ownerEmail', 'OWNER_EMAIL', 'userEmail', 'USER_EMAIL', 'writerEmail', 'WRITER_EMAIL', 'email', 'EMAIL']),
            wsId: firstValue(source, ['wsId', 'WS_ID', 'workspaceId', 'WORKSPACE_ID']),
            projId: firstValue(source, ['projId', 'PROJ_ID', 'projectId', 'PROJECT_ID']),
            taskId: firstValue(source, ['taskId', 'TASK_ID'], itemType === 'TASK' ? firstValue(source, ['id', 'ID']) : null),
            projName: firstValue(source, ['projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME']),
            projectType: firstValue(source, ['projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY']),
            wsName: firstValue(source, ['wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME']),
            projectScope: firstValue(source, ['projectScope', 'PROJECT_SCOPE']),
            status: firstValue(source, ['status', 'STATUS'], itemType === 'TASK' ? 'TODO' : null),
            assigneeUserId: firstValue(source, ['assigneeUserId', 'ASSIGNEE_USER_ID', 'userId', 'USER_ID']),
            assigneeName: firstValue(source, ['assigneeName', 'ASSIGNEE_NAME', 'userName', 'USER_NAME']),
            assigneeEmail: firstValue(source, ['assigneeEmail', 'ASSIGNEE_EMAIL']),
            assigneeProfileImagePath: firstValue(source, ['assigneeProfileImagePath', 'ASSIGNEE_PROFILE_IMAGE_PATH']),
            actualStartDt: normalizeDateTimeValue(firstValue(source, ['actualStartDt', 'ACTUAL_START_DT'])),
            actualDoneDt: normalizeDateTimeValue(firstValue(source, ['actualDoneDt', 'ACTUAL_DONE_DT'])),
            delayedYn: String(firstValue(source, ['delayedYn', 'DELAYED_YN'], 'N')).toUpperCase(),
            delayedCompletedYn: String(firstValue(source, ['delayedCompletedYn', 'DELAYED_COMPLETED_YN'], 'N')).toUpperCase(),
            delayedDays: Number(firstValue(source, ['delayedDays', 'DELAYED_DAYS'], 0)) || 0,
            eventType: firstValue(source, ['eventType', 'EVENT_TYPE', 'calendarEventType', 'CALENDAR_EVENT_TYPE']),
            visibilityType: firstValue(source, ['visibilityType', 'VISIBILITY_TYPE', 'visibility', 'VISIBILITY']),
            isPrivate: firstValue(source, ['isPrivate', 'IS_PRIVATE']),
            moyoPublicYn: firstValue(source, ['moyoPublicYn', 'MOYO_PUBLIC_YN', 'isMoyoPublic', 'IS_MOYO_PUBLIC']),
            attendeeUserIdCsv: String(firstValue(source, ['attendeeUserIdCsv', 'ATTENDEE_USER_ID_CSV'], '') || ''),
            directShareYn: String(firstValue(source, ['directShareYn', 'DIRECT_SHARE_YN'], 'N') || 'N').toUpperCase(),
            ownerYn: firstValue(source, ['ownerYn', 'OWNER_YN']),
            canEditYn: firstValue(source, ['canEditYn', 'CAN_EDIT_YN']),
            shareRelation: firstValue(source, ['shareRelation', 'SHARE_RELATION']),
            shareStatus: firstValue(source, ['shareStatus', 'SHARE_STATUS']),
            shareId: firstValue(source, ['shareId', 'SHARE_ID', 'receivedShareId', 'RECEIVED_SHARE_ID']),
            isRecurring: String(firstValue(source, ['isRecurring', 'IS_RECURRING'], 'N')).toUpperCase(),
            recurGroupId: firstValue(source, ['recurGroupId', 'RECUR_GROUP_ID']),
            recurType: firstValue(source, ['recurType', 'RECUR_TYPE']),
            recurInterval: Number(firstValue(source, ['recurInterval', 'RECUR_INTERVAL'], 1)) || 1,
            recurDays: firstValue(source, ['recurDays', 'RECUR_DAYS'], ''),
            untilDt: normalizeDateTimeValue(firstValue(source, ['untilDt', 'UNTIL_DT'])),
            exceptionDateList: firstValue(source, ['exceptionDateList', 'EXCEPTION_DATE_LIST'], ''),
            isLunar: String(firstValue(source, ['isLunar', 'IS_LUNAR'], 'N')).toUpperCase(),
            raw: source
        };
    }

    function normalizeMonthlyPayload(payload) {
        const source = Array.isArray(payload)
            ? payload
            : (payload && Array.isArray(payload.data) ? payload.data : []);
        return source.map(normalizeMonthlyRecord);
    }

    function monthlyStoreSnapshot() {
        return {
            requestId: monthlyStore.requestId,
            range: monthlyStore.range ? { ...monthlyStore.range } : null,
            request: monthlyStore.request ? { ...monthlyStore.request } : null,
            requestKey: monthlyStore.requestKey,
            dirty: monthlyStore.dirty,
            records: monthlyStore.records.map((record) => ({ ...record })),
            loadedAt: monthlyStore.loadedAt,
            error: monthlyStore.error
        };
    }

    function announceMonthlyData() {
        document.dispatchEvent(new CustomEvent('moyo:calendar-v2-month-data', {
            detail: monthlyStoreSnapshot()
        }));
    }

    function hasMonthContent() {
        const monthlyContent = monthlyStore.records.some((record) => {
            if (!recordMatchesCurrentScope(record)) return false;
            if (String(record.itemType || '').toUpperCase() === 'HOLIDAY') return false;
            return !isProjectPeriodRecord(record);
        });
        const planContent = projectPlanStore.records.length > 0;
        return monthlyContent || planContent;
    }

    function renderCalendarExceptionState() {
        if (!calendarStatusEl || !calendarNoticeEl) return;

        const loading = Boolean(state.loading.calendar) && !monthlyStore.loadedAt && !monthlyStore.error;
        const fullError = Boolean(monthlyStore.error);
        const partialPlanError = !fullError && Boolean(projectPlanStore.error);

        calendarStatusEl.hidden = !(loading || fullError);
        calendarStatusEl.dataset.state = fullError ? 'error' : 'loading';
        if (calendarRetryButton) calendarRetryButton.hidden = !fullError;

        if (loading) {
            if (calendarStatusTitleEl) calendarStatusTitleEl.textContent = '달력을 불러오는 중이에요.';
            if (calendarStatusTextEl) calendarStatusTextEl.textContent = '잠시만 기다려 주세요.';
        } else if (fullError) {
            if (calendarStatusTitleEl) calendarStatusTitleEl.textContent = '달력 내용을 불러오지 못했어요.';
            if (calendarStatusTextEl) calendarStatusTextEl.textContent = '연결을 확인한 뒤 다시 불러와 주세요.';
        }

        let notice = '';
        let tone = 'neutral';
        if (partialPlanError) {
            notice = '프로젝트 계획 일부를 불러오지 못했어요.';
            tone = 'warning';
        } else if (!state.loading.calendar && monthlyStore.loadedAt && !fullError && !hasMonthContent()) {
            notice = '이번 달에는 표시할 일정·업무·계획이 없어요.';
            tone = 'empty';
        }
        calendarNoticeEl.hidden = !notice;
        calendarNoticeEl.textContent = notice;
        calendarNoticeEl.dataset.tone = tone;
    }

    function birthdayRequestYearMonth(info) {
        const start = info?.start instanceof Date ? info.start : null;
        const end = info?.end instanceof Date ? info.end : null;
        if (start && end) {
            const middle = new Date(start.getTime() + ((end.getTime() - start.getTime()) / 2));
            return { year: middle.getFullYear(), month: middle.getMonth() + 1 };
        }
        const current = calendar?.getDate?.() || new Date();
        return { year: current.getFullYear(), month: current.getMonth() + 1 };
    }

    async function fetchFriendBirthdayPayload(info, signal) {
        if (calendarContext !== 'PERSONAL') return [];
        const { year, month } = birthdayRequestYearMonth(info);
        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        const query = new URLSearchParams({ year: String(year), month: String(month) });
        try {
            const response = await fetch(`${contextPath}/api/calendar/friend-birthdays?${query.toString()}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' },
                signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            return Array.isArray(payload) ? payload : [];
        } catch (error) {
            if (error && error.name === 'AbortError') throw error;
            console.warn('[Calendar V2] 친구 생일 조회 실패', error);
            return [];
        }
    }


    async function fetchGroupBirthdaySummaryPayload(info, signal) {
        const birthdayWsId = calendarContext === 'GROUP'
            ? contextWsId
            : (calendarContext === 'PROJECT' ? effectiveProjectWsId() : null);
        if (!birthdayWsId) return [];
        const { year, month } = birthdayRequestYearMonth(info);
        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        const query = new URLSearchParams({
            wsId: String(birthdayWsId),
            year: String(year),
            month: String(month)
        });
        try {
            const response = await fetch(`${contextPath}/api/calendar/group-member-birthdays?${query.toString()}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' },
                signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            return Array.isArray(payload) ? payload : [];
        } catch (error) {
            if (error && error.name === 'AbortError') throw error;
            console.warn('[Calendar V2] 그룹 멤버 생일 조회 실패', error);
            return [];
        }
    }

    async function fetchMonthlyData(info) {
        const { range, request } = buildMonthlyRequest(info);
        const cacheKey = requestCacheKey(request);
        if (!monthlyStore.dirty && monthlyStore.requestKey === cacheKey && monthlyStore.loadedAt && !monthlyStore.error) {
            monthlyStore.range = range;
            monthlyStore.request = request;
            return { stale: false, cached: true, records: monthlyStore.records };
        }

        const requestId = monthlyStore.requestId + 1;
        monthlyStore.requestId = requestId;

        if (monthlyStore.controller) monthlyStore.controller.abort();
        const controller = new AbortController();
        monthlyStore.controller = controller;

        monthlyStore.range = range;
        monthlyStore.request = request;
        monthlyStore.requestKey = cacheKey;
        monthlyStore.error = null;
        setLoading('calendar', true);

        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        const query = new URLSearchParams();
        Object.entries(request).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value) !== '') query.set(key, String(value));
        });

        try {
            const response = await fetch(`${contextPath}/api/calendar/monthly?${query.toString()}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const payload = await response.json();
            const birthdayPayload = await fetchFriendBirthdayPayload(info, controller.signal);
            groupMonthBirthdays = await fetchGroupBirthdaySummaryPayload(info, controller.signal);
            if (requestId !== monthlyStore.requestId) return { stale: true, records: [] };

            const mergedPayload = [
                ...(Array.isArray(payload) ? payload : []),
                ...birthdayPayload
            ];
            monthlyStore.records = normalizeMonthlyPayload(mergedPayload);
            monthlyStore.loadedAt = new Date().toISOString();
            monthlyStore.error = null;
            monthlyStore.dirty = false;
            announceMonthlyData();
            renderCalendarExceptionState();
            renderMonthOverview();
            return { stale: false, records: monthlyStore.records };
        } catch (error) {
            if (error && error.name === 'AbortError') return { stale: true, aborted: true, records: [] };
            if (requestId !== monthlyStore.requestId) return { stale: true, records: [] };

            monthlyStore.records = [];
            monthlyStore.loadedAt = null;
            monthlyStore.error = error instanceof Error ? error.message : String(error || 'UNKNOWN_ERROR');
            monthlyStore.dirty = true;
            announceMonthlyData();
            renderCalendarExceptionState();
            throw error;
        } finally {
            if (requestId === monthlyStore.requestId) {
                monthlyStore.controller = null;
                setLoading('calendar', false);
            }
        }
    }

    function normalizeProjectPlanRecord(item, index) {
        const source = item && typeof item === 'object' ? item : {};
        const kind = String(firstValue(source, ['type', 'TYPE', 'itemType', 'ITEM_TYPE'], '')).toUpperCase();
        if (!['PHASE', 'WEEKLY_PLAN', 'TIME_PLAN'].includes(kind)) return null;

        const entityId = firstValue(source, ['entityId', 'ENTITY_ID', 'periodPlanId', 'PERIOD_PLAN_ID', 'weeklyPlanId', 'WEEKLY_PLAN_ID', 'timePlanId', 'TIME_PLAN_ID']);
        const id = String(firstValue(source, ['id', 'ID'], `${kind}:${entityId || index}`));
        const start = normalizeDateTimeValue(firstValue(source, ['start', 'START', 'startDt', 'START_DT']));
        const end = normalizeDateTimeValue(firstValue(source, ['end', 'END', 'endDt', 'END_DT'], start));
        const allDayRaw = firstValue(source, ['allDay', 'ALL_DAY', 'allDayYn', 'ALL_DAY_YN'], kind === 'PHASE' ? 'Y' : 'N');
        const allDay = allDayRaw === true || String(allDayRaw).toUpperCase() === 'Y';
        const projectScope = effectiveProjectScope();

        return {
            key: id,
            id,
            entityId: entityId != null ? String(entityId) : '',
            kind,
            title: String(firstValue(source, ['title', 'TITLE'], '제목 없음')),
            start,
            end,
            allDay,
            color: firstValue(source, ['color', 'COLOR']),
            description: firstValue(source, ['description', 'DESCRIPTION'], ''),
            recurring: firstValue(source, ['recurring', 'RECURRING'], false) === true || String(firstValue(source, ['recurring', 'RECURRING'], 'N')).toUpperCase() === 'Y',
            taskId: firstValue(source, ['taskId', 'TASK_ID']),
            sortOrder: firstValue(source, ['sortOrder', 'SORT_ORDER']),
            projId: effectiveProjectId() || null,
            wsId: effectiveProjectWsId() || null,
            projectScope,
            raw: source
        };
    }

    function normalizeProjectPlanPayload(payload) {
        const root = payload && payload.data ? payload.data : payload;
        const items = root && Array.isArray(root.items) ? root.items : [];
        return items.map(normalizeProjectPlanRecord).filter(Boolean);
    }

    function projectPlanStoreSnapshot() {
        return {
            requestId: projectPlanStore.requestId,
            range: projectPlanStore.range ? { ...projectPlanStore.range } : null,
            requestKey: projectPlanStore.requestKey,
            dirty: projectPlanStore.dirty,
            records: projectPlanStore.records.map((record) => ({ ...record })),
            loadedAt: projectPlanStore.loadedAt,
            error: projectPlanStore.error
        };
    }

    function announceProjectPlanData() {
        document.dispatchEvent(new CustomEvent('moyo:calendar-v2-project-plan-data', {
            detail: projectPlanStoreSnapshot()
        }));
        renderMonthOverview();
    }

    async function fetchProjectPlanData(info) {
        const range = getInclusiveFetchRange(info);

        if (!isIndividualProjectSelection()) {
            if (projectPlanStore.controller) projectPlanStore.controller.abort();
            projectPlanStore.requestId += 1;
            projectPlanStore.controller = null;
            projectPlanStore.range = range;
            projectPlanStore.requestKey = '';
            projectPlanStore.records = [];
            projectPlanStore.loadedAt = null;
            projectPlanStore.error = null;
            projectPlanStore.dirty = false;
            announceProjectPlanData();
            return { stale: false, records: [] };
        }

        const cacheKey = requestCacheKey({
            projId: String(effectiveProjectId()),
            startDate: range.startDate,
            endDate: range.endDate,
            include: 'PHASE,WEEKLY_PLAN,TIME_PLAN'
        });
        if (!projectPlanStore.dirty && projectPlanStore.requestKey === cacheKey && projectPlanStore.loadedAt && !projectPlanStore.error) {
            projectPlanStore.range = range;
            return { stale: false, cached: true, records: projectPlanStore.records };
        }

        const requestId = projectPlanStore.requestId + 1;
        projectPlanStore.requestId = requestId;
        if (projectPlanStore.controller) projectPlanStore.controller.abort();

        const controller = new AbortController();
        projectPlanStore.controller = controller;
        projectPlanStore.range = range;
        projectPlanStore.requestKey = cacheKey;
        projectPlanStore.error = null;
        setLoading('projectPlans', true);

        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        const query = new URLSearchParams({
            projId: String(effectiveProjectId()),
            startDate: range.startDate,
            endDate: range.endDate,
            include: 'PHASE,WEEKLY_PLAN,TIME_PLAN'
        });

        try {
            const response = await fetch(`${contextPath}/project/api/calendar-items?${query.toString()}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (requestId !== projectPlanStore.requestId) return { stale: true, records: [] };

            projectPlanStore.records = normalizeProjectPlanPayload(payload);
            projectPlanStore.loadedAt = new Date().toISOString();
            projectPlanStore.error = null;
            projectPlanStore.dirty = false;
            announceProjectPlanData();
            renderCalendarExceptionState();
            return { stale: false, records: projectPlanStore.records };
        } catch (error) {
            if (error && error.name === 'AbortError') return { stale: true, aborted: true, records: [] };
            if (requestId !== projectPlanStore.requestId) return { stale: true, records: [] };
            projectPlanStore.records = [];
            projectPlanStore.loadedAt = null;
            projectPlanStore.error = error instanceof Error ? error.message : String(error || 'UNKNOWN_ERROR');
            projectPlanStore.dirty = true;
            announceProjectPlanData();
            renderCalendarExceptionState();
            throw error;
        } finally {
            if (requestId === projectPlanStore.requestId) {
                projectPlanStore.controller = null;
                setLoading('projectPlans', false);
            }
        }
    }

    function extractTimePart(value) {
        const match = String(value || '').match(/[T\s](\d{2}:\d{2})(?::(\d{2}))?/);
        return match ? `${match[1]}:${match[2] || '00'}` : '';
    }

    function isMoyoPublicRecord(record) {
        const raw = record.raw || {};
        const visibility = String(record.visibilityType || '').toUpperCase();
        const publicFlag = String(record.moyoPublicYn || firstValue(raw, ['moyoPublicYn', 'MOYO_PUBLIC_YN', 'isMoyoPublic', 'IS_MOYO_PUBLIC'], '')).toUpperCase();
        return visibility === 'MOYO' || visibility === 'MOYO_PUBLIC' || visibility === 'PUBLIC_MOYO'
            || publicFlag === 'Y' || publicFlag === 'TRUE'
            || (record.itemType === 'PRIVATE' && String(record.isPrivate || '').toUpperCase() === 'N');
    }

    function resolveDisplayType(record) {
        if (record.itemType === 'BIRTHDAY') return 'BIRTHDAY';
        if (record.itemType === 'HOLIDAY') return 'HOLIDAY';
        if (record.itemType === 'TASK') return 'TASK';
        if (record.itemType === 'WS') return 'WS';
        if (record.itemType === 'PROJ') return 'PROJ';
        if (record.itemType === 'PRIVATE') {
            const sessionUserId = String(window.MOYO_CALENDAR_SESSION_USER_ID || '');
            const ownerUserId = String(record.ownerUserId || '');
            const isOtherUser = Boolean(ownerUserId && sessionUserId && ownerUserId !== sessionUserId);
            if (isOtherUser || isReceivedPrivateRecord(record)) return 'FRIEND';
            if (isMoyoPublicRecord(record)) return 'MOYO';
        }
        return record.itemType || 'PRIVATE';
    }

    function detectAllDay(record) {
        if (record.allDay || record.isLunar === 'Y' || ['HOLIDAY', 'BIRTHDAY'].includes(record.itemType)) return true;
        const startTime = extractTimePart(record.start);
        const endTime = extractTimePart(record.end);
        return startTime === '00:00:00' && (
            endTime === '23:59:00'
            || endTime === '23:59:59'
            || (endTime === '00:00:00' && record.start && record.end && record.start.slice(0, 10) !== record.end.slice(0, 10))
        );
    }

    function addDaysToDateOnly(value, days) {
        const text = String(value || '').substring(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
        const [year, month, day] = text.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() + days);
        return toDateOnly(date);
    }

    function normalizeInclusiveAllDayRange(start, end) {
        const startDate = String(start || '').substring(0, 10);
        let endDate = String(end || start || '').substring(0, 10);
        if (!startDate) return null;
        if (!endDate || endDate < startDate) endDate = startDate;
        return { start: startDate, endExclusive: addDaysToDateOnly(endDate, 1) };
    }

    function normalizeTimedRange(start, end) {
        const startValue = normalizeDateTimeValue(start);
        const endValue = normalizeDateTimeValue(end);
        if (!startValue) return null;
        if (!endValue) return { start: startValue, end: null };
        const startDate = new Date(startValue);
        const endDate = new Date(endValue);
        if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
            return { start: startValue, end: null };
        }
        return { start: startValue, end: endValue };
    }

    function normalizeRecurDays(value) {
        const dayMap = { SUN: 'su', MON: 'mo', TUE: 'tu', WED: 'we', THU: 'th', FRI: 'fr', SAT: 'sa' };
        return String(value || '').split(',')
            .map((day) => dayMap[String(day).trim().toUpperCase()])
            .filter(Boolean);
    }

    function buildRecurrenceExDates(value, start) {
        const startTime = extractTimePart(start);
        return String(value || '').split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => {
                if (item.includes('T') || item.includes(' ')) return normalizeDateTimeValue(item);
                return startTime ? `${item.substring(0, 10)}T${startTime}` : item.substring(0, 10);
            });
    }

    function allDayDurationDays(start, end) {
        const range = normalizeInclusiveAllDayRange(start, end);
        if (!range) return 1;
        const startDate = new Date(`${range.start}T00:00:00`);
        const endDate = new Date(`${range.endExclusive}T00:00:00`);
        return Math.max(1, Math.round((endDate - startDate) / 86400000));
    }

    function friendIdentityValues(friend) {
        const source = friend || {};
        const ids = [
            source.friendId, source.FRIEND_ID,
            source.userId, source.USER_ID,
            source.friendUserId, source.FRIEND_USER_ID,
            source.id, source.ID
        ].filter((value) => value !== undefined && value !== null && String(value).trim() !== '').map(String);
        const emails = [
            source.userEmail, source.USER_EMAIL,
            source.friendEmail, source.FRIEND_EMAIL,
            source.email, source.EMAIL
        ].filter(Boolean).map((value) => String(value).trim().toLowerCase());
        const names = [
            source.userName, source.USER_NAME,
            source.friendName, source.FRIEND_NAME,
            source.name, source.NAME
        ].filter(Boolean).map((value) => String(value).trim());
        return { ids, emails, names };
    }

    function isReceivedPrivateRecord(record) {
        if (!record || String(record.itemType || '').toUpperCase() !== 'PRIVATE') return false;

        const sessionUserId = String(window.MOYO_CALENDAR_SESSION_USER_ID || '');
        const ownerIds = [record.sharedByUserId, record.ownerUserId]
            .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
            .map(String);
        if (sessionUserId && ownerIds.includes(sessionUserId)) return false;

        if (record.directShareYn === 'Y') return true;
        if (recordHasAttendee(record, sessionUserId)) return true;

        const ownerYn = String(record.ownerYn || '').toUpperCase();
        const relation = String(record.shareRelation || '').toUpperCase();
        const shareStatus = String(record.shareStatus || '').toUpperCase();
        const canEditYn = String(record.canEditYn || '').toUpperCase();
        const shareId = record.shareId;

        if (ownerYn === 'Y') return false;
        if (relation === 'DIRECT_RECEIVED' || relation === 'SCOPE_RECEIVED') return true;
        if (shareId && (!shareStatus || shareStatus === 'ACCEPTED' || shareStatus === 'PENDING')) return true;
        if (canEditYn === 'Y' && ownerYn !== 'Y') return true;

        // 비공개 타인 일정이 월간 권한 조회를 통과했다면 직접 공유/참석 일정이다.
        if (!isMoyoPublicRecord(record)) {
            return Boolean(ownerIds.length && (!sessionUserId || !ownerIds.includes(sessionUserId)));
        }
        return false;
    }

    function recordMatchesFriend(record, targetFriendId = null) {
        const ownerIds = [record.sharedByUserId, record.ownerUserId]
            .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
            .map(String);
        const recordEmail = String(record.ownerEmail || '').trim().toLowerCase();
        const recordName = String(record.ownerName || '').trim();
        const friends = state.friends || [];

        if (targetFriendId) {
            if (ownerIds.includes(String(targetFriendId))) return true;
            const targetFriend = friends.find((friend) => friendIdentityValues(friend).ids.includes(String(targetFriendId)));
            if (!targetFriend) return false;
            const identity = friendIdentityValues(targetFriend);
            if (identity.ids.some((id) => ownerIds.includes(id))) return true;
            if (recordEmail && identity.emails.includes(recordEmail)) return true;
            return Boolean(recordName && identity.names.includes(recordName));
        }

        // 친구 전체는 단순히 "내 일정이 아닌 것"이 아니라 실제 친구 목록에 있는 작성자만 허용한다.
        if (!friends.length) return false;
        return friends.some((friend) => {
            const identity = friendIdentityValues(friend);
            if (identity.ids.some((id) => ownerIds.includes(id))) return true;
            if (recordEmail && identity.emails.includes(recordEmail)) return true;
            return Boolean(recordName && identity.names.includes(recordName));
        });
    }

    function recordHasAttendee(record, userId) {
        if (!record || userId === undefined || userId === null || String(userId) === '') return false;
        const ids = String(record.attendeeUserIdCsv || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
        return ids.includes(String(userId));
    }

    function recordMatchesCurrentScope(record) {
        if (!record) return false;

        const itemType = String(record.itemType || '').toUpperCase();
        if (itemType === 'HOLIDAY') return true;
        if (itemType === 'BIRTHDAY') {
            return calendarContext === 'PERSONAL' && ['ALL', 'PRIVATE'].includes(state.scope);
        }
        const sessionUserId = String(window.MOYO_CALENDAR_SESSION_USER_ID || '');
        const ownerIds = [record.sharedByUserId, record.ownerUserId]
            .filter((value) => value !== undefined && value !== null && String(value) !== '')
            .map(String);
        const selectedProjId = effectiveProjectId();
        const projectScope = String(record.projectScope || (record.wsId ? 'GROUP' : 'PERSONAL')).toUpperCase();

        if (calendarContext === 'PROJECT') {
            if (String(record.projId || '') !== String(contextProjId || '')) return false;
            if (itemType === 'TASK') {
                if (!['ALL', 'TASK'].includes(state.scope)) return false;
                const status = normalizeTaskStatus(record.status);
                if (state.taskStatusFilter === 'DELAYED' && String(record.delayedYn || '').toUpperCase() !== 'Y') return false;
                if (!['ALL', 'DELAYED'].includes(state.taskStatusFilter) && status !== state.taskStatusFilter) return false;
                if (state.taskMemberFilter === 'ME' && String(record.assigneeUserId || '') !== sessionUserId) return false;
                if (!['ALL', 'ME'].includes(String(state.taskMemberFilter || 'ALL'))
                    && String(record.assigneeUserId || '') !== String(state.taskMemberFilter)) return false;
                return true;
            }
            if (!['PROJ', 'SCHEDULE'].includes(itemType)) return false;
            if (!['ALL', 'EVENT'].includes(state.scope)) return false;
            if (state.projectScheduleFilter === 'MINE') return ownerIds.includes(sessionUserId);
            if (state.projectScheduleFilter === 'JOINED') return recordHasAttendee(record, sessionUserId);
            return true;
        }

        if (calendarContext === 'GROUP') {
            const sameWs = String(record.wsId || '') === String(contextWsId || '');
            if (!sameWs) return false;
            if (itemType === 'TASK') return false;
            if (state.scope === 'ALL') return itemType === 'WS' || ['PROJ', 'SCHEDULE'].includes(itemType);
            if (state.scope === 'WS') {
                if (itemType !== 'WS') return false;
                if (state.groupScheduleFilter === 'ME') {
                    return ownerIds.includes(sessionUserId) || recordHasAttendee(record, sessionUserId);
                }
                if (state.groupScheduleFilter.startsWith('MEMBER:')) {
                    const memberId = state.groupScheduleFilter.substring(7);
                    return ownerIds.includes(memberId) || recordHasAttendee(record, memberId);
                }
                return true;
            }
            if (state.scope === 'PROJ') {
                if (!['PROJ', 'SCHEDULE'].includes(itemType)) return false;
                return !selectedProjId || String(record.projId || '') === String(selectedProjId);
            }
            return false;
        }

        if (itemType === 'TASK') {
            if (state.scope === 'PROJ') {
                if (projectScope !== 'PERSONAL') return false;
                return !selectedProjId || String(record.projId || '') === String(selectedProjId);
            }
            return state.scope === 'ALL' && projectScope === 'PERSONAL';
        }

        if (state.scope === 'PRIVATE') {
            if (itemType !== 'PRIVATE') return false;
            return !ownerIds.length || ownerIds.includes(sessionUserId);
        }
        if (state.scope === 'FRIEND') {
            if (itemType !== 'PRIVATE') return false;
            const directShared = isReceivedPrivateRecord(record);
            // 월간 API의 MOYO 타입 조회는 SQL에서 이미 ACCEPTED 친구 관계를 검증한다.
            // 여기서 다시 state.friends와 대조하면 친구 목록 로딩/응답 필드 차이 때문에
            // 정상적인 MOYO 공개 일정이 탈락할 수 있으므로 서버 권한 결과를 그대로 사용한다.
            const friendPublic = state.moyoPublicVisible && isMoyoPublicRecord(record);
            if (state.friendId) {
                return recordMatchesFriend(record, state.friendId) && (directShared || friendPublic);
            }
            return directShared || friendPublic;
        }
        if (state.scope === 'PROJ') {
            if (!['PROJ', 'SCHEDULE'].includes(itemType) || projectScope !== 'PERSONAL') return false;
            return !selectedProjId || String(record.projId || '') === String(selectedProjId);
        }
        if (state.scope === 'ALL') {
            if (itemType === 'PRIVATE') {
                const mine = !ownerIds.length || ownerIds.includes(sessionUserId);
                const friendShared = isReceivedPrivateRecord(record);
                // MOYO 타입은 서버에서 본인 + ACCEPTED 친구 공개 일정만 내려온다.
                // 클라이언트에서 친구 목록으로 재검증하지 않는다.
                const friendMoyo = state.moyoPublicVisible && isMoyoPublicRecord(record);
                return mine || friendShared || friendMoyo;
            }
            if (['PROJ', 'SCHEDULE'].includes(itemType)) return projectScope === 'PERSONAL';
        }
        return false;
    }

    function isProjectPeriodRecord(record) {
        if (!record) return false;
        const eventType = String(record.eventType || firstValue(record.raw || {}, [
            'eventType', 'EVENT_TYPE', 'calendarEventType', 'CALENDAR_EVENT_TYPE'
        ], '')).toUpperCase();
        return record.itemType === 'PROJ' && eventType === 'PROJECT_PERIOD';
    }

    function findSelectedProjectOption() {
        if (!isIndividualProjectSelection()) return null;
        return (state.userSpaces.projects || []).find((item) => String(
            item.projId || item.PROJ_ID || item.projectId || item.PROJECT_ID || item.id || item.ID || ''
        ) === String(effectiveProjectId())) || null;
    }


    function findSelectedWorkspaceOption() {
        const wsId = effectiveProjectWsId();
        if (!wsId) return null;
        return (state.userSpaces.workspaces || []).find((item) => String(
            item.wsId || item.WS_ID || item.workspaceId || item.WORKSPACE_ID || item.groupId || item.GROUP_ID || item.id || item.ID || ''
        ) === String(wsId)) || null;
    }

    function formatContextDate(dateOnly) {
        const text = String(dateOnly || '').substring(0, 10);
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
        if (!match) return '';
        return `${Number(match[2])}월 ${Number(match[3])}일`;
    }

    function resolveProjectContextModel() {
        if (!isIndividualProjectSelection()) return null;

        const project = findSelectedProjectOption();
        const workspace = findSelectedWorkspaceOption();
        const projectScope = String(
            state.projectScope
            || (project ? inferProjectScope(project) : '')
            || (state.wsId ? 'GROUP' : 'PERSONAL')
        ).toUpperCase();

        const name = String(
            firstValue(project || {}, ['projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME', 'name', 'NAME'], '')
            || projectPeriodStore.title
            || state.scopeLabel
            || '프로젝트'
        );

        const groupName = String(
            firstValue(project || {}, ['wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME', 'groupName', 'GROUP_NAME'], '')
            || firstValue(workspace || {}, ['wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME', 'groupName', 'GROUP_NAME', 'name', 'NAME'], '')
            || ''
        );

        let start = projectPeriodStore.start || String(firstValue(project || {}, ['startDate', 'START_DATE', 'projectStartDate', 'PROJECT_START_DATE'], '') || '').substring(0, 10);
        let end = projectPeriodStore.end || String(firstValue(project || {}, ['endDate', 'END_DATE', 'projectEndDate', 'PROJECT_END_DATE'], start) || start).substring(0, 10);
        start = String(start || '').substring(0, 10);
        end = String(end || start || '').substring(0, 10);

        const meta = [];
        if (projectScope === 'PERSONAL') {
            meta.push('개인 프로젝트');
        } else {
            meta.push(groupName || '그룹 프로젝트');
        }
        if (start) {
            const startLabel = formatContextDate(start);
            const endLabel = formatContextDate(end);
            meta.push(end && end !== start ? `${startLabel} – ${endLabel}` : startLabel);
        }

        const status = String(firstValue(project || {}, ['projStatus', 'PROJ_STATUS', 'projectStatus', 'PROJECT_STATUS', 'status', 'STATUS'], '') || '').toUpperCase();
        const completed = ['COMPLETED', 'COMPLETE', 'DONE', 'CLOSED', 'END', 'ENDED'].includes(status)
            || firstValue(project || {}, ['completed', 'isCompleted'], false) === true
            || String(firstValue(project || {}, ['completedYn', 'COMPLETED_YN', 'completeYn', 'COMPLETE_YN'], '')).toUpperCase() === 'Y';
        if (completed) meta.push('종료됨');

        return { name, meta: meta.filter(Boolean).join(' · '), projectScope };
    }

    function renderProjectContext() {
        if (!projectContextEl) return;
        const model = resolveProjectContextModel();

        // 개인/그룹 캘린더에서는 선택한 프로젝트명이 이미 상단 대상 pill에 노출된다.
        // 같은 정보를 한 줄 더 반복하지 않고, 프로젝트 직접 진입에서만 읽기 전용
        // 컨텍스트(프로젝트명/기간)를 짧게 보여준다.
        if (!model || calendarContext !== 'PROJECT') {
            projectContextEl.hidden = true;
            if (projectContextNameEl) projectContextNameEl.textContent = '프로젝트';
            if (projectContextMetaEl) projectContextMetaEl.textContent = '';
            return;
        }

        projectContextEl.hidden = false;
        if (projectContextNameEl) projectContextNameEl.textContent = model.name;
        if (projectContextMetaEl) projectContextMetaEl.textContent = model.meta;
        projectContextEl.dataset.projectScope = model.projectScope;
        if (projectContextChangeButton) projectContextChangeButton.hidden = true;
    }

    function resolveProjectPeriod(records) {
        if (!isIndividualProjectSelection()) return null;

        const periodRecord = (records || []).find((record) =>
            isProjectPeriodRecord(record) && String(record.projId || '') === String(effectiveProjectId())
        );
        if (periodRecord && periodRecord.start) {
            const range = normalizeInclusiveAllDayRange(periodRecord.start, periodRecord.end || periodRecord.start);
            if (range) {
                return {
                    projId: String(effectiveProjectId()),
                    start: range.start,
                    end: addDaysToDateOnly(range.endExclusive, -1),
                    title: periodRecord.projName || periodRecord.title || '프로젝트',
                    projectType: periodRecord.projectType || firstValue(periodRecord, [
                        'projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY'
                    ], '') || '',
                    source: 'MONTHLY'
                };
            }
        }

        // 대상 선택 목록은 월 경계와 무관하게 프로젝트의 전체 시작/종료일을 제공한다.
        const project = findSelectedProjectOption();
        if (!project) return null;
        const start = String(firstValue(project, ['startDate', 'START_DATE', 'projectStartDate', 'PROJECT_START_DATE'], '') || '').substring(0, 10);
        const end = String(firstValue(project, ['endDate', 'END_DATE', 'projectEndDate', 'PROJECT_END_DATE'], start) || start).substring(0, 10);
        if (!start) return null;
        return {
            projId: String(effectiveProjectId()),
            start,
            end: end && end >= start ? end : start,
            title: String(firstValue(project, ['projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME', 'name', 'NAME'], '프로젝트')),
            projectType: firstValue(project, [
                'projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY'
            ], '') || '',
            source: 'USER_SPACES'
        };
    }

    function setActiveProjectPeriod(period) {
        projectPeriodStore.projId = period ? period.projId : null;
        projectPeriodStore.start = period ? period.start : null;
        projectPeriodStore.end = period ? period.end : null;
        projectPeriodStore.title = period ? period.title : '';
        projectPeriodStore.source = period ? period.source : null;
    }

    function projectPeriodToCalendarEvent(period) {
        if (!period || !period.start) return null;
        const range = normalizeInclusiveAllDayRange(period.start, period.end || period.start);
        if (!range) return null;

        const periodColor = period.color || 'var(--cal2-scope-project)';
        return {
            id: `PROJECT_PERIOD:${period.projId || effectiveProjectId() || ''}`,
            title: period.title || '프로젝트 기간',
            start: range.start,
            end: range.endExclusive,
            allDay: true,
            display: 'background',
            backgroundColor: periodColor,
            extendedProps: {
                calendarV2Kind: 'PROJECT_PERIOD',
                itemType: 'PROJECT_PERIOD',
                displayType: 'PROJ',
                projId: period.projId || effectiveProjectId() || null,
                projectType: period.projectType || period.projType || '',
                periodStart: range.start,
                periodEnd: addDaysToDateOnly(range.endExclusive, -1),
                sourceColor: periodColor,
                periodSource: period.source || null
            }
        };
    }


    function projectPeriodToDayMarkerEvents(period) {
        if (!period || !period.start) return [];

        const start = String(period.start).slice(0, 10);
        const end = String(period.end || period.start).slice(0, 10);
        if (!start) return [];

        const normalizedEnd = end && end >= start ? end : start;
        const projectName = period.title || '프로젝트';
        const projectType = period.projectType || period.projType || '';

        const events = [{
            id: `PROJECT_PERIOD_BOUNDARY:${period.projId || ''}:${start}:start`,
            title: projectName,
            start,
            end: addDaysDateOnly(start, 1),
            allDay: true,
            display: 'block',
            extendedProps: {
                calendarV2Kind: 'PROJECT_PERIOD_BOUNDARY',
                itemType: 'PROJECT_PERIOD_BOUNDARY',
                displayType: 'PROJ',
                projId: period.projId || null,
                projectType,
                periodStart: start,
                periodEnd: normalizedEnd,
                periodPosition: normalizedEnd === start ? 'single' : 'start'
            }
        }];

        if (normalizedEnd !== start) {
            events.push({
                id: `PROJECT_PERIOD_BOUNDARY:${period.projId || ''}:${normalizedEnd}:end`,
                title: projectName,
                start: normalizedEnd,
                end: addDaysDateOnly(normalizedEnd, 1),
                allDay: true,
                display: 'block',
                extendedProps: {
                    calendarV2Kind: 'PROJECT_PERIOD_BOUNDARY',
                    itemType: 'PROJECT_PERIOD_BOUNDARY',
                    displayType: 'PROJ',
                    projId: period.projId || null,
                    projectType,
                    periodStart: start,
                    periodEnd: normalizedEnd,
                    periodPosition: 'end'
                }
            });
        }

        return events;
    }

    function projectPeriodEventToDayMarkers(event) {
        if (!event) return [];
        const props = event.extendedProps || {};
        return projectPeriodToDayMarkerEvents({
            projId: props.projId || null,
            title: event.title || '프로젝트 기간',
            projectType: props.projectType || props.projType || '',
            start: props.periodStart || event.start,
            end: props.periodEnd || props.periodStart || event.start
        });
    }

    /*
     * 전체(ALL)에서는 특정 프로젝트 하나를 선택하지 않아도
     * 사용자가 볼 수 있는 프로젝트들의 전체 기간을 background layer로 표시한다.
     * 프로젝트 기간은 일정 row / +N 개수를 차지하지 않는다.
     */
    function buildAllScopeProjectPeriodEvents(records) {
        if (state.scope !== 'ALL') return [];
        if (calendarContext === 'PROJECT') return [];

        const periodsByProject = new Map();

        (records || []).forEach((record) => {
            if (!isProjectPeriodRecord(record) || !recordMatchesCurrentScope(record)) return;

            const projId = String(record.projId || '');
            if (!projId || !record.start) return;

            // 전체 탭에서도 컨텍스트를 섞지 않는다.
            // 개인 전체 = 개인 프로젝트만
            // 그룹 전체 = 현재 그룹의 그룹 프로젝트만
            const projectScope = String(record.projectScope || (record.wsId ? 'GROUP' : 'PERSONAL')).toUpperCase();
            if (calendarContext === 'PERSONAL' && projectScope !== 'PERSONAL') return;
            if (calendarContext === 'GROUP') {
                if (projectScope !== 'GROUP') return;
                if (String(record.wsId || '') !== String(contextWsId || '')) return;
            }

            const range = normalizeInclusiveAllDayRange(record.start, record.end || record.start);
            if (!range) return;

            periodsByProject.set(projId, {
                projId,
                start: range.start,
                end: addDaysToDateOnly(range.endExclusive, -1),
                title: record.projName || record.title || '프로젝트',
                projectType: record.projectType || firstValue(record, [
                    'projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY'
                ], '') || '',
                color: record.color || null,
                source: 'MONTHLY'
            });
        });

        // 월간 API에 기간 record가 없는 프로젝트도 userSpaces의 시작/종료일로 보완한다.
        (state.userSpaces.projects || []).forEach((project) => {
            const projId = String(firstValue(project, [
                'projId', 'PROJ_ID', 'projectId', 'PROJECT_ID', 'id', 'ID'
            ], '') || '');
            if (!projId) return;

            const projectType = firstValue(project, [
                'projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY'
            ], '') || '';

            if (periodsByProject.has(projId)) {
                const existing = periodsByProject.get(projId);
                if (existing && !existing.projectType && projectType) {
                    existing.projectType = projectType;
                    periodsByProject.set(projId, existing);
                }
                return;
            }

            const projectScope = String(inferProjectScope(project) || '').toUpperCase();
            const wsId = String(firstValue(project, [
                'wsId', 'WS_ID', 'workspaceId', 'WORKSPACE_ID', 'groupId', 'GROUP_ID'
            ], '') || '');

            if (calendarContext === 'PERSONAL' && projectScope !== 'PERSONAL') return;
            if (calendarContext === 'GROUP') {
                if (projectScope !== 'GROUP') return;
                if (String(contextWsId || '') !== wsId) return;
            }

            const start = String(firstValue(project, [
                'startDate', 'START_DATE', 'startDt', 'START_DT',
                'projectStartDate', 'PROJECT_START_DATE'
            ], '') || '').substring(0, 10);
            const endRaw = String(firstValue(project, [
                'endDate', 'END_DATE', 'endDt', 'END_DT',
                'projectEndDate', 'PROJECT_END_DATE'
            ], start) || start).substring(0, 10);
            if (!start) return;

            periodsByProject.set(projId, {
                projId,
                start,
                end: endRaw && endRaw >= start ? endRaw : start,
                title: String(firstValue(project, [
                    'projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME', 'name', 'NAME'
                ], '프로젝트')),
                projectType: firstValue(project, [
                    'projType', 'PROJ_TYPE', 'projectType', 'PROJECT_TYPE', 'category', 'CATEGORY'
                ], '') || '',
                color: firstValue(project, ['color', 'COLOR', 'projectColor', 'PROJECT_COLOR']) || null,
                source: 'USER_SPACES'
            });
        });

        return Array.from(periodsByProject.values())
            .map(projectPeriodToCalendarEvent)
            .filter(Boolean);
    }

    function buildAllScopeProjectPeriodMarkerEvents(records) {
        return buildAllScopeProjectPeriodEvents(records).flatMap((periodEvent) => {
            return projectPeriodEventToDayMarkers(periodEvent).map((event) => ({
                ...event,
                extendedProps: {
                    ...(event.extendedProps || {}),
                    allScopePeriodYn: 'Y'
                }
            }));
        });
    }

    function syncHolidayDayVisual() {
        const holidayMap = runtimeEventIndex.holidaysByDate;
        calendarEl.querySelectorAll('.fc-daygrid-day[data-date]').forEach((cell) => {
            const date = String(cell.getAttribute('data-date') || '');
            const titles = holidayMap.get(date) || [];
            const holidayText = titles.join(' · ');
            const dayTop = cell.querySelector('.fc-daygrid-day-top');
            let holidayLabel = dayTop ? dayTop.querySelector('.moyo-cal2-day-holiday') : null;

            cell.classList.toggle('is-cal2-holiday', titles.length > 0);
            if (holidayText) {
                cell.setAttribute('data-cal2-holiday', holidayText);
                if (dayTop && !holidayLabel) {
                    holidayLabel = document.createElement('span');
                    holidayLabel.className = 'moyo-cal2-day-holiday';
                    dayTop.appendChild(holidayLabel);
                }
                if (holidayLabel) {
                    holidayLabel.textContent = holidayText;
                    holidayLabel.title = holidayText;
                    holidayLabel.hidden = false;
                }
            } else {
                cell.removeAttribute('data-cal2-holiday');
                if (holidayLabel) holidayLabel.remove();
            }
        });
    }

    function syncProjectPeriodDayVisual() {
        const cells = calendarEl.querySelectorAll('.fc-daygrid-day[data-date]');
        cells.forEach((cell) => {
            cell.classList.remove(
                'is-cal2-project-before',
                'is-cal2-project-after',
                'is-cal2-project-outside',
                'is-cal2-project-period-start',
                'is-cal2-project-period-end',
                'is-cal2-project-period-single'
            );
            cell.removeAttribute('data-project-period-position');
        });

        if (!isIndividualProjectSelection() || !projectPeriodStore.start || !projectPeriodStore.end) return;

        const periodStart = String(projectPeriodStore.start).slice(0, 10);
        const periodEnd = String(projectPeriodStore.end).slice(0, 10);

        cells.forEach((cell) => {
            const date = String(cell.getAttribute('data-date') || '');
            if (!date) return;

            if (date === periodStart) {
                cell.classList.add('is-cal2-project-period-start');
                cell.setAttribute('data-project-period-position', 'start');
            }

            if (date === periodEnd) {
                cell.classList.add('is-cal2-project-period-end');
                cell.setAttribute('data-project-period-position', 'end');
            }

            if (date === periodStart && date === periodEnd) {
                cell.classList.add('is-cal2-project-period-single');
                cell.setAttribute('data-project-period-position', 'single');
            }

            if (date < periodStart) {
                cell.classList.add('is-cal2-project-outside', 'is-cal2-project-before');
                cell.setAttribute('data-project-period-position', 'before');
            } else if (date > periodEnd) {
                cell.classList.add('is-cal2-project-outside', 'is-cal2-project-after');
                cell.setAttribute('data-project-period-position', 'after');
            }
        });
    }

    function normalizeTaskStatus(value) {
        const status = String(value || 'TODO').trim().toUpperCase();
        if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
        if (status === 'DONE') return 'DONE';
        return 'TODO';
    }

    function buildTaskProjectContext(props) {
        const source = props || {};
        const raw = source.raw || {};
        const selectedProject = findSelectedProjectOption() || {};
        const wsId = source.wsId
            || firstValue(raw, ['wsId', 'WS_ID'])
            || firstValue(selectedProject, ['wsId', 'WS_ID']);
        const projectScope = String(
            source.projectScope
            || firstValue(raw, ['projectScope', 'PROJECT_SCOPE'])
            || firstValue(selectedProject, ['projScope', 'PROJ_SCOPE', 'projectScope', 'PROJECT_SCOPE'])
            || (wsId ? 'GROUP' : 'PERSONAL')
        ).toUpperCase();
        const projRole = String(
            source.projRole
            || firstValue(raw, ['projRole', 'PROJ_ROLE'])
            || firstValue(selectedProject, ['projRole', 'PROJ_ROLE'])
            || ''
        ).toUpperCase();
        // 서버 projectAuthorizationService.canManageProject()와 같은 role 범위만 인정한다.
        const canManageByRole = ['ADMIN', 'LEADER', 'OWNER', 'PM'].includes(projRole);
        const sessionUserId = String(window.MOYO_CALENDAR_SESSION_USER_ID || '');
        const leaderId = firstValue(selectedProject, ['leaderId', 'LEADER_ID']);
        const isLeader = leaderId != null && sessionUserId && String(leaderId) === sessionUserId;
        const explicitCanManageProject = firstValue(source, ['canManageProject', 'CAN_MANAGE_PROJECT'], undefined);
        const explicitCanManageTasks = firstValue(source, ['canManageTasks', 'CAN_MANAGE_TASKS'], undefined);
        const isPersonalProject = projectScope === 'PERSONAL';
        const canManageProject = explicitCanManageProject !== undefined
            ? (explicitCanManageProject === true || String(explicitCanManageProject).toUpperCase() === 'Y')
            : (isLeader || canManageByRole);
        const canManageTasks = explicitCanManageTasks !== undefined
            ? (explicitCanManageTasks === true || String(explicitCanManageTasks).toUpperCase() === 'Y')
            : canManageProject;

        return {
            projId: source.projId
                || firstValue(raw, ['projId', 'PROJ_ID', 'projectId', 'PROJECT_ID'])
                || firstValue(selectedProject, ['projId', 'PROJ_ID', 'projectId', 'PROJECT_ID']),
            projectName: source.projName
                || source.projectName
                || firstValue(raw, ['projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME'])
                || firstValue(selectedProject, ['projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME', 'name', 'NAME']),
            wsId: wsId || null,
            workspaceName: source.wsName
                || source.workspaceName
                || firstValue(raw, ['wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME'])
                || firstValue(selectedProject, ['wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME']),
            projectScope,
            projRole,
            isPersonalProject,
            groupProject: !isPersonalProject,
            canManageTasks,
            canManageProject,
            projectStartDate: firstValue(raw, ['projectStartDate', 'PROJECT_START_DATE', 'projStartDate', 'PROJ_START_DATE'])
                || projectPeriodStore.start
                || firstValue(selectedProject, ['startDate', 'START_DATE', 'projectStartDate', 'PROJECT_START_DATE']),
            projectEndDate: firstValue(raw, ['projectEndDate', 'PROJECT_END_DATE', 'projEndDate', 'PROJ_END_DATE'])
                || projectPeriodStore.end
                || firstValue(selectedProject, ['endDate', 'END_DATE', 'projectEndDate', 'PROJECT_END_DATE'])
        };
    }

    function taskRecordToCalendarEvent(record) {
        const taskId = record.taskId || record.id;
        if (!taskId || !record.start) return null;

        const allDay = detectAllDay(record);
        const event = {
            id: `TASK:${taskId}`,
            title: record.title || '제목 없음',
            allDay,
            extendedProps: {
                calendarV2Kind: 'TASK',
                itemType: 'TASK',
                displayType: 'TASK',
                sourceColor: record.color || null,
                taskId: String(taskId),
                projId: record.projId || null,
                projName: record.projName || null,
                wsId: record.wsId || null,
                wsName: record.wsName || null,
                projectScope: String(record.projectScope || (record.wsId ? 'GROUP' : 'PERSONAL')).toUpperCase(),
                status: normalizeTaskStatus(record.status),
                assigneeUserId: record.assigneeUserId || null,
                assigneeName: record.assigneeName || null,
                assigneeEmail: record.assigneeEmail || null,
                assigneeProfileImagePath: record.assigneeProfileImagePath || null,
                delayedYn: record.delayedYn || 'N',
                delayedCompletedYn: record.delayedCompletedYn || 'N',
                delayedDays: record.delayedDays || 0,
                actualStartDt: record.actualStartDt || null,
                actualDoneDt: record.actualDoneDt || null,
                originalStartDt: record.start,
                originalEndDt: record.end,
                raw: record.raw
            }
        };

        if (allDay) {
            const range = normalizeInclusiveAllDayRange(record.start, record.end);
            if (!range) return null;
            event.start = range.start;
            event.end = range.endExclusive;
        } else {
            const range = normalizeTimedRange(record.start, record.end);
            if (!range) return null;
            event.start = range.start;
            if (range.end) event.end = range.end;
        }
        return event;
    }

    function monthlyRecordToCalendarEvent(record) {
        if (!record || !record.id || !record.start || !recordMatchesCurrentScope(record)) return null;
        if (record.itemType === 'TASK') return taskRecordToCalendarEvent(record);
        // PROJECT_PERIOD는 일정처럼 한 줄을 차지하지 않고 Step 27 background layer에서만 사용한다.
        if (isProjectPeriodRecord(record)) return null;

        const allDay = detectAllDay(record);
        const displayType = resolveDisplayType(record);
        const calendarV2Kind = record.itemType === 'BIRTHDAY' ? 'BIRTHDAY' : 'SCHEDULE';
        const event = {
            id: String(record.id),
            title: record.title || '제목 없음',
            allDay,
            // 공휴일은 일정 row가 아니라 날짜 숫자와 같은 상단 라인에 표시한다.
            // display:none이어도 FullCalendar event collection에는 남아 있어
            // 우측 선택 날짜 패널/월 요약/holiday index에서는 그대로 사용할 수 있다.
            ...(displayType === 'HOLIDAY' ? { display: 'none' } : {}),
            extendedProps: {
                calendarV2Kind,
                itemType: record.itemType,
                displayType,
                sourceColor: record.color || null,
                ownerUserId: record.ownerUserId || null,
                ownerName: record.ownerName || null,
                ownerProfileImagePath: record.ownerProfileImagePath || null,
                sharedByUserId: record.sharedByUserId || null,
                ownerYn: record.ownerYn || null,
                canEditYn: record.canEditYn || null,
                shareRelation: record.shareRelation || null,
                shareStatus: record.shareStatus || null,
                shareId: record.shareId || null,
                visibilityType: record.visibilityType || null,
                moyoPublicYn: record.moyoPublicYn || null,
                isPrivate: record.isPrivate || null,
                wsId: record.wsId || null,
                projId: record.projId || null,
                eventType: record.eventType || null,
                isRecurring: record.isRecurring,
                recurGroupId: record.recurGroupId || null,
                originalStartDt: record.start,
                originalEndDt: record.end,
                raw: record.raw
            }
        };

        const recurring = record.isRecurring === 'Y' && record.recurType && record.isLunar !== 'Y';
        if (recurring) {
            let until = record.untilDt || null;
            if (until && !String(until).includes('T')) until = `${until}T23:59:59`;
            event.rrule = {
                freq: String(record.recurType).toLowerCase(),
                dtstart: record.start,
                interval: record.recurInterval || 1
            };
            if (until) event.rrule.until = until;
            const recurDays = normalizeRecurDays(record.recurDays);
            if (event.rrule.freq === 'weekly' && recurDays.length) event.rrule.byweekday = recurDays;
            const exdates = buildRecurrenceExDates(record.exceptionDateList, record.start);
            if (exdates.length) event.exdate = exdates;
            if (allDay) event.duration = { days: allDayDurationDays(record.start, record.end) };
            return event;
        }

        if (allDay) {
            const range = normalizeInclusiveAllDayRange(record.start, record.end);
            if (!range) return null;
            event.start = range.start;
            event.end = range.endExclusive;
        } else {
            const range = normalizeTimedRange(record.start, record.end);
            if (!range) return null;
            event.start = range.start;
            if (range.end) event.end = range.end;
        }
        return event;
    }

    function phasePlanToBoundaryEvents(record) {
        if (!record || !record.start || !record.entityId) return [];

        const range = normalizeInclusiveAllDayRange(record.start, record.end || record.start);
        if (!range || !range.start) return [];

        const start = range.start;
        const end = addDaysToDateOnly(range.endExclusive, -1) || start;
        const title = record.title || '제목 없음';
        const color = record.color || 'var(--cal2-brand-purple)';
        const baseProps = {
            calendarV2Kind: 'PHASE_BOUNDARY',
            itemType: 'PHASE',
            displayType: 'PROJ',
            entityId: record.entityId,
            sourceColor: color,
            description: record.description || '',
            recurring: !!record.recurring,
            taskId: record.taskId || null,
            projId: record.projId || state.projId || null,
            wsId: record.wsId || state.wsId || null,
            projectScope: record.projectScope || state.projectScope || (state.wsId ? 'GROUP' : 'PERSONAL'),
            originalStartDt: record.start,
            originalEndDt: record.end,
            phaseStart: start,
            phaseEnd: end,
            raw: record.raw || {}
        };

        const events = [{
            id: `PHASE_BOUNDARY:${record.entityId}:${start}:start`,
            title,
            start,
            end: addDaysToDateOnly(start, 1),
            allDay: true,
            display: 'block',
            extendedProps: {
                ...baseProps,
                phasePosition: end === start ? 'single' : 'start'
            }
        }];

        if (end !== start) {
            events.push({
                id: `PHASE_BOUNDARY:${record.entityId}:${end}:end`,
                title,
                start: end,
                end: addDaysToDateOnly(end, 1),
                allDay: true,
                display: 'block',
                extendedProps: {
                    ...baseProps,
                    phasePosition: 'end'
                }
            });
        }

        return events;
    }

    function projectPlanRecordToCalendarEvent(record) {
        if (!record || !record.start || !record.entityId) return null;

        const kind = String(record.kind || '').toUpperCase();
        if (kind === 'PHASE') return null;
        if (calendarContext === 'GROUP') return null;
        if (calendarContext === 'PROJECT') {
            if (!['ALL', 'PLAN'].includes(state.scope)) return null;
            if (state.planFilter !== 'ALL' && state.planFilter !== kind) return null;
        } else if (state.scope !== 'PROJ') {
            return null;
        }

        const event = {
            id: record.id || `${kind}:${record.entityId}`,
            title: record.title || '제목 없음',
            allDay: !!record.allDay,
            extendedProps: {
                calendarV2Kind: kind,
                itemType: kind,
                displayType: 'PROJ',
                entityId: record.entityId,
                sourceColor: record.color || null,
                description: record.description || '',
                recurring: !!record.recurring,
                taskId: record.taskId || null,
                projId: record.projId || state.projId || null,
                wsId: record.wsId || state.wsId || null,
                projectScope: record.projectScope || state.projectScope || (state.wsId ? 'GROUP' : 'PERSONAL'),
                originalStartDt: record.start,
                originalEndDt: record.end,
                raw: record.raw || {}
            }
        };

        if (record.allDay) {
            const range = normalizeInclusiveAllDayRange(record.start, record.end || record.start);
            if (!range || !range.start) return null;
            event.start = range.start;
            event.end = range.endExclusive;
        } else {
            const range = normalizeTimedRange(record.start, record.end);
            if (!range || !range.start) return null;
            event.start = range.start;
            if (range.end) event.end = range.end;
        }
        return event;
    }

    function buildProjectPlanCalendarEvents(records) {
        const events = [];
        (records || []).forEach((record) => {
            const kind = String(record?.kind || '').toUpperCase();

            if (calendarContext === 'GROUP') return;
            if (calendarContext === 'PROJECT') {
                if (!['ALL', 'PLAN'].includes(state.scope)) return;
                if (state.planFilter !== 'ALL' && state.planFilter !== kind) return;
            } else if (state.scope !== 'PROJ') {
                return;
            }

            if (kind === 'PHASE') {
                events.push(...phasePlanToBoundaryEvents(record));
                return;
            }

            const event = projectPlanRecordToCalendarEvent(record);
            if (event) events.push(event);
        });
        return events;
    }

    function buildMonthlyCalendarEvents(records) {
        return (records || []).map(monthlyRecordToCalendarEvent).filter(Boolean);
    }

    async function loadCalendarEventSource(info, successCallback, failureCallback) {
        try {
            const [monthlyResult, planResult] = await Promise.all([
                fetchMonthlyData(info),
                fetchProjectPlanData(info).catch((error) => {
                    console.error('[Calendar V2] 프로젝트 계획 데이터를 불러오지 못했습니다.', error);
                    return { stale: false, records: [], error };
                })
            ]);

            if (monthlyResult.stale) return;

            const projectPeriod = resolveProjectPeriod(monthlyResult.records);
            setActiveProjectPeriod(projectPeriod);
            renderProjectContext();

            // 일정은 기존 월간 record 그대로 표시한다.
            const events = buildMonthlyCalendarEvents(monthlyResult.records);

            // 개인 전체 = 개인 프로젝트 기간 시작/종료 event row
            // 그룹 전체 = 현재 그룹 프로젝트 기간 시작/종료 event row
            // 유형 아이콘 + 프로젝트명 + 굵은 보라 경계선으로 표현한다.
            if (state.scope === 'ALL' && ['PERSONAL', 'GROUP'].includes(calendarContext)) {
                events.push(...buildAllScopeProjectPeriodMarkerEvents(monthlyResult.records));
            }

            // 개별 프로젝트 화면에서는 기존 기간 밖 날짜 비활성 + 시작/종료 marker를 유지한다.
            if (planResult && !planResult.stale) {
                events.push(...buildProjectPlanCalendarEvents(planResult.records));
            }
            successCallback(events);
        } catch (error) {
            console.error('[Calendar V2] 월간 데이터를 불러오지 못했습니다.', error);
            failureCallback(error);
        }
    }

    function mapFriendsForSelector() {
        return (state.friends || []).map((friend) => ({
            id: friend.friendId || friend.userId || friend.id || friend.USER_ID,
            name: friend.userName || friend.friendName || friend.name || friend.email || '이름 없음',
            image: friend.profileImagePath || friend.PROFILE_IMAGE_PATH || friend.profileImage || friend.avatarUrl || '',
            meta: friend.email || ''
        })).filter((item) => item.id);
    }

    function mapWorkspacesForSelector() {
        return (state.userSpaces.workspaces || []).map((item) => ({
            id: item.wsId || item.WS_ID || item.workspaceId || item.WORKSPACE_ID || item.groupId || item.GROUP_ID || item.id || item.ID,
            name: item.wsName || item.WS_NAME || item.workspaceName || item.WORKSPACE_NAME || item.groupName || item.GROUP_NAME || item.name || item.NAME || '이름 없음',
            image: item.wsImagePath || item.WS_IMAGE_PATH || item.workspaceImagePath || item.WORKSPACE_IMAGE_PATH || item.imagePath || item.IMAGE_PATH || item.profileImagePath || item.PROFILE_IMAGE_PATH || ''
        })).filter((item) => item.id);
    }

    function mapProjectsForSelector() {
        return (state.userSpaces.projects || []).map((item) => ({
            id: item.projId || item.PROJ_ID || item.projectId || item.PROJECT_ID || item.id || item.ID,
            name: item.projName || item.PROJ_NAME || item.projectName || item.PROJECT_NAME || item.name || item.NAME || '이름 없음',
            wsId: item.wsId || item.WS_ID || item.workspaceId || item.WORKSPACE_ID || item.groupId || item.GROUP_ID || null,
            projectScope: inferProjectScope(item),
            status: item.projStatus || item.PROJ_STATUS || item.projectStatus || item.PROJECT_STATUS || item.status || item.STATUS || '',
            startDate: item.startDate || item.START_DATE || item.startDt || item.START_DT || '',
            endDate: item.endDate || item.END_DATE || item.endDt || item.END_DT || '',
            completed: item.completed === true || item.isCompleted === true,
            completedYn: item.completedYn || item.COMPLETED_YN || item.completeYn || item.COMPLETE_YN || '',
            type: item.projType || item.PROJ_TYPE || item.projectType || item.PROJECT_TYPE || item.category || item.CATEGORY || ''
        })).filter((item) => item.id);
    }

    async function fetchJson(url) {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    function memberOption(item) {
        const source = item || {};
        return {
            id: firstValue(source, ['userId', 'USER_ID', 'id', 'ID']),
            name: String(firstValue(source, ['displayName', 'DISPLAY_NAME', 'userName', 'USER_NAME', 'name', 'NAME'], '이름 없음')),
            profileImagePath: firstValue(source, ['profileImagePath', 'PROFILE_IMAGE_PATH', 'memberProfileImagePath', 'MEMBER_PROFILE_IMAGE_PATH']),
            birthDate: firstValue(source, ['birthDate', 'BIRTH_DATE', 'birthday', 'BIRTHDAY', 'birth', 'BIRTH']),
            lunarYn: String(firstValue(source, ['lunarYn', 'LUNAR_YN', 'isLunar', 'IS_LUNAR'], 'N')).toUpperCase(),
            raw: source
        };
    }

    async function ensureContextMembers() {
        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        if (calendarContext === 'GROUP' && contextWsId && !state.groupMembersLoaded) {
            const payload = await fetchJson(`${contextPath}/workspace/api/members?wsId=${encodeURIComponent(contextWsId)}`).catch(() => []);
            const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.members) ? payload.members : []);
            setState({ groupMembers: list.map(memberOption).filter((item) => item.id), groupMembersLoaded: true }, { reason: 'group-members:loaded' });
        }
        if (calendarContext === 'PROJECT' && contextProjId && !state.projectMembersLoaded) {
            const payload = await fetchJson(`${contextPath}/project/api/members?projId=${encodeURIComponent(contextProjId)}`).catch(() => []);
            const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.members) ? payload.members : []);
            setState({ projectMembers: list.map(memberOption).filter((item) => item.id), projectMembersLoaded: true }, { reason: 'project-members:loaded' });
        }
    }

    function ensureScopeOptions() {
        if (state.scopeOptionsLoaded) return Promise.resolve();
        if (state.scopeOptionsPromise) return state.scopeOptionsPromise;

        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        setLoading('scopeOptions', true);
        const scopeOptionsPromise = Promise.all([
            fetchJson(`${contextPath}/api/calendar/user-spaces`).catch(() => ({ workspaces: [], projects: [] })),
            fetchJson(`${contextPath}/friends/api/list`).catch(() => ({ friends: [] }))
        ]).then(([spaces, friends]) => {
            setState({
                userSpaces: spaces || { workspaces: [], projects: [] },
                friends: (friends && Array.isArray(friends.friends)) ? friends.friends : [],
                scopeOptionsLoaded: true
            }, { reason: 'scope-options:loaded' });
            const projectContextChanged = hydrateLockedProjectContextFromOptions();
            resolveScopeLabelFromCurrentSelection();
            renderScopeNavigation();
            renderProjectContext();
            if (projectContextChanged) {
                syncScopeQuery();
                invalidateCalendarData();
                if (window.MoyoCalendarV2) window.MoyoCalendarV2.refresh();
            }
            // 친구 전체/친구 선택은 실제 친구 목록을 기준으로 필터링하므로
            // 옵션 로드가 끝난 시점에 한 번 다시 조회해 초기 직접 진입도 동일하게 맞춘다.
            if (calendarContext === 'PERSONAL' && ['ALL', 'FRIEND'].includes(state.scope) && window.MoyoCalendarV2) {
                window.MoyoCalendarV2.refresh();
            }
        }).finally(() => {
            setState({ scopeOptionsPromise: null }, { notify: false });
            setLoading('scopeOptions', false);
        });

        setState({ scopeOptionsPromise }, { notify: false });
        return scopeOptionsPromise;
    }

    function hydrateLockedProjectContextFromOptions() {
        if (calendarContext !== 'PROJECT' || !contextProjId) return false;

        const project = mapProjectsForSelector().find((item) => String(item.id || '') === String(contextProjId));
        if (!project) return false;

        const projectWsId = project.projectScope === 'GROUP' ? (project.wsId || contextWsId || null) : null;
        const nextProjectScope = project.projectScope === 'GROUP' ? 'GROUP' : 'PERSONAL';

        const changed = String(state.wsId || '') !== String(projectWsId || '')
            || String(state.projectScope || '') !== nextProjectScope
            || String(state.projId || '') !== String(contextProjId)
            || String(state.scopeLabel || '') !== String(project.name || '');

        /*
         * PROJECT 컨텍스트에서는 scope가
         * ALL / EVENT / TASK / PLAN 중 하나여야 한다.
         *
         * 기존 코드는 프로젝트 메타를 hydrate 하면서 scope를 'PROJ'로 덮어써서
         * 데이터는 전체처럼 보이지만 상단 탭은 어떤 것도 active가 아닌 상태가 됐다.
         * 여기서는 현재 탭 scope를 절대 건드리지 않고 프로젝트 식별 정보만 보강한다.
         */
        setState({
            wsId: projectWsId,
            projId: contextProjId,
            projectScope: nextProjectScope,
            scopeLabel: project.name || state.scopeLabel || '프로젝트'
        }, { reason: 'calendar-context:project-hydrate', notify: false });

        return changed;
    }

    function resetScopeTargets(scope) {
        const patch = {
            friendId: null,
            wsId: null,
            projId: null,
            projectScope: null,
            scopeLabel: scopeMeta[scope]?.label || ''
        };

        if (calendarContext === 'GROUP') {
            patch.wsId = contextWsId;
            if (scope === 'PROJ') patch.projectScope = 'GROUP';
        } else if (calendarContext === 'PROJECT') {
            patch.wsId = contextWsId;
            patch.projId = contextProjId;
            patch.projectScope = initialProjectScope || (contextWsId ? 'GROUP' : 'PERSONAL');
        } else if (scope === 'PROJ') {
            patch.projectScope = 'PERSONAL';
        }

        setState(patch, { reason: 'scope:reset-targets' });
    }

    function currentScopeSelection() {
        return {
            scope: state.scope,
            friendId: state.friendId,
            wsId: state.wsId,
            projId: state.projId,
            projectScope: state.projectScope,
            label: state.scopeLabel
        };
    }

    function resolveScopeLabelFromCurrentSelection() {
        let label = scopeMeta[state.scope]?.label || '전체';

        if (state.scope === 'FRIEND') {
            if (!state.friendId) label = '친구 전체';
            else {
                const friend = mapFriendsForSelector().find((item) => String(item.id) === String(state.friendId));
                label = friend ? friend.name : '친구 선택';
            }
        } else if (state.scope === 'WS') {
            if (!state.wsId) label = '그룹 전체';
            else {
                const workspace = mapWorkspacesForSelector().find((item) => String(item.id) === String(state.wsId));
                label = workspace ? workspace.name : '그룹 선택';
            }
        } else if (state.scope === 'PROJ') {
            if (state.projId) {
                const project = mapProjectsForSelector().find((item) => String(item.id) === String(state.projId));
                label = project ? project.name : '프로젝트 선택';
            } else if (state.projectScope === 'PERSONAL') {
                label = '개인 프로젝트 전체';
            } else if (state.projectScope === 'GROUP' && state.wsId) {
                const workspace = mapWorkspacesForSelector().find((item) => String(item.id) === String(state.wsId));
                label = workspace ? `${workspace.name} 프로젝트` : '그룹 프로젝트 전체';
            } else if (state.projectScope === 'GROUP') {
                label = '그룹 프로젝트 전체';
            } else {
                label = '프로젝트 전체';
            }
        }

        if (state.scopeLabel !== label) {
            setState({ scopeLabel: label }, { reason: 'scope:label', notify: false });
        }
        return label;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function makeSecondaryButton(label, value, active, key) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'moyo-cal2-secondary-btn' + (active ? ' is-active' : '');
        button.textContent = label;
        button.dataset.filterKey = key;
        button.dataset.filterValue = value;
        return button;
    }

    function appendSecondaryEntityList(items, options) {
        if (!secondaryFilters) return;
        const config = options || {};
        const allLabel = config.allLabel || '전체';
        const key = config.key || '';
        const activeValue = String(config.activeValue || '');
        const visibleLimit = Number(config.visibleLimit || 7);

        secondaryFilters.appendChild(makeSecondaryButton(allLabel, '', !activeValue, key));
        items.slice(0, visibleLimit).forEach((item) => {
            secondaryFilters.appendChild(makeSecondaryButton(
                item.name || config.itemFallback || '항목',
                String(item.id || ''),
                activeValue === String(item.id || ''),
                key
            ));
        });

        if (items.length > visibleLimit) {
            const overflowItems = items.slice(visibleLimit);
            const select = document.createElement('select');
            select.className = 'moyo-cal2-secondary-select';
            select.setAttribute('aria-label', config.moreLabel || '더보기');
            select.innerHTML = `<option value="">${escapeHtml(config.moreLabel || '더보기')} +${overflowItems.length}</option>`
                + overflowItems.map((item) => `<option value="${String(item.id || '')}">${escapeHtml(item.name || config.itemFallback || '항목')}</option>`).join('');
            if (overflowItems.some((item) => String(item.id || '') === activeValue)) select.value = activeValue;
            select.addEventListener('change', () => {
                if (!select.value) return;
                const patch = { [key]: select.value };
                if (typeof config.patch === 'function') Object.assign(patch, config.patch(select.value));
                setState(patch, { reason: config.reason || `secondary-filter:${key}` });
                renderSecondaryFilters();
                syncScopeQuery();
                window.MoyoCalendarV2?.refresh();
            });
            secondaryFilters.appendChild(select);
        }
    }

    function currentCalendarYearMonth() {
        const current = calendar?.getDate ? calendar.getDate() : null;
        const year = current ? current.getFullYear() : Number(String(state.viewDate || '').slice(0, 4));
        const month = current ? current.getMonth() + 1 : Number(String(state.viewDate || '').slice(5, 7));
        return { year, month };
    }

    function monthRangeDateStrings() {
        const { year, month } = currentCalendarYearMonth();
        if (!year || !month) return { start: '', end: '' };
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return { start, end };
    }

    function projectOverlapsCurrentMonth(project) {
        const { start, end } = monthRangeDateStrings();
        const projectStart = String(project.startDate || '').substring(0, 10);
        const projectEnd = String(project.endDate || '').substring(0, 10);
        if (!start || !end) return true;
        if (!projectStart && !projectEnd) return true;
        if (projectStart && projectStart > end) return false;
        if (projectEnd && projectEnd < start) return false;
        return true;
    }

    function formatMonthDay(dateText) {
        const value = String(dateText || '').substring(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
        return `${value.substring(5, 7)}.${value.substring(8, 10)}`;
    }

    function makeMonthSummaryRow({ iconHtml = '', iconLabel = '', title = '', period = '', extraClass = '' }) {
        const row = document.createElement('div');
        row.className = `moyo-cal2-month-summary-item${extraClass ? ` ${extraClass}` : ''}`;

        const left = document.createElement('span');
        left.className = 'moyo-cal2-month-summary-main';

        const icon = document.createElement('span');
        icon.className = 'moyo-cal2-month-summary-icon';
        if (iconLabel) icon.setAttribute('aria-label', iconLabel);
        else icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = iconHtml;

        const name = document.createElement('strong');
        name.className = 'moyo-cal2-month-summary-name';
        name.textContent = title;
        left.append(icon, name);

        const date = document.createElement('span');
        date.className = 'moyo-cal2-month-summary-period';
        date.textContent = period;

        row.append(left, date);
        return row;
    }

    function renderBirthdayRows(items, emptyText) {
        if (!birthdayList) return;
        birthdayList.replaceChildren();
        if (birthdayCount) birthdayCount.textContent = items.length ? `${items.length}명` : '';
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'moyo-cal2-birthday-empty';
            empty.textContent = emptyText;
            birthdayList.appendChild(empty);
            return;
        }
        items.slice(0, 4).forEach((item) => {
            birthdayList.appendChild(makeMonthSummaryRow({
                iconHtml: '<i class="fa-solid fa-cake-candles" aria-hidden="true"></i>',
                iconLabel: '생일',
                title: item.name || '생일',
                period: formatMonthDay(item.date),
                extraClass: 'is-birthday'
            }));
        });
        if (items.length > 4) {
            const more = document.createElement('span');
            more.className = 'moyo-cal2-birthday-more';
            more.textContent = `외 ${items.length - 4}명`;
            birthdayList.appendChild(more);
        }
    }

    function renderBirthdaySection() {
        if (!birthdaySection || !birthdayList) return;
        const { year, month } = currentCalendarYearMonth();

        if (calendarContext === 'PERSONAL') {
            birthdaySection.hidden = false;
            if (birthdayTitle) birthdayTitle.textContent = '친구 생일';
            const birthdays = runtimeEventIndex.all
                .filter((event) => getPanelCategory(event) === 'BIRTHDAY')
                .map((event) => ({
                    date: toDateOnly(event.start),
                    name: String(event.title || '친구 생일').replace(/\s*생일\s*$/, '') || '친구'
                }))
                .filter((item) => {
                    if (!item.date) return false;
                    const [y, m] = item.date.split('-').map(Number);
                    return y === year && m === month;
                })
                .sort((a, b) => String(a.date).localeCompare(String(b.date)));
            renderBirthdayRows(birthdays, '이번 달 생일인 친구가 없어요.');
            return;
        }

        if (calendarContext === 'GROUP') {
            birthdaySection.hidden = false;
            if (birthdayTitle) birthdayTitle.textContent = '멤버 생일';
            const birthdays = (groupMonthBirthdays || []).map((item) => ({
                date: String(item.startDt || item.START_DT || '').substring(0, 10),
                name: String(item.ownerName || item.memberName || item.title || '멤버 생일').replace(/\s*생일\s*$/, '') || '멤버'
            })).sort((a, b) => String(a.date).localeCompare(String(b.date)));
            renderBirthdayRows(birthdays, '이번 달 생일인 멤버가 없어요.');
            return;
        }

        if (calendarContext === 'PROJECT') {
            birthdaySection.hidden = false;
            if (birthdayTitle) birthdayTitle.textContent = '멤버 생일';

            const workspaceBirthdays = (groupMonthBirthdays || []).map((item) => ({
                date: String(item.startDt || item.START_DT || '').substring(0, 10),
                name: String(item.ownerName || item.memberName || item.title || '멤버 생일').replace(/\s*생일\s*$/, '') || '멤버'
            }));

            const memberBirthdays = (state.projectMembers || [])
                .map((member) => {
                    const rawDate = String(member.birthDate || '').substring(0, 10);
                    if (!rawDate) return null;
                    const parts = rawDate.split('-').map(Number);
                    if (parts.length < 3 || !parts[1] || !parts[2]) return null;
                    return {
                        date: `${year}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`,
                        name: member.name || '멤버'
                    };
                })
                .filter(Boolean)
                .filter((item) => Number(item.date.slice(5, 7)) === month);

            const seenBirthdays = new Set();
            const birthdays = [...memberBirthdays, ...workspaceBirthdays]
                .filter((item) => {
                    if (!item.date) return false;
                    const key = `${item.date}:${item.name}`;
                    if (seenBirthdays.has(key)) return false;
                    seenBirthdays.add(key);
                    return true;
                })
                .sort((a, b) => String(a.date).localeCompare(String(b.date)));

            renderBirthdayRows(birthdays, '이번 달 생일인 멤버가 없어요.');
            if (!state.projectMembersLoaded) {
                ensureContextMembers().then(renderBirthdaySection);
            }
            return;
        }

        birthdaySection.hidden = true;
        birthdayList.replaceChildren();
        if (birthdayCount) birthdayCount.textContent = '';
    }

    function renderMonthProjects() {
        if (!monthProjectsSection || !monthProjects) return;
        if (!['PERSONAL', 'GROUP'].includes(calendarContext)) {
            monthProjectsSection.hidden = true;
            monthProjects.replaceChildren();
            if (monthProjectsCount) monthProjectsCount.textContent = '';
            return;
        }

        const projects = mapProjectsForSelector().filter((project) => {
            if (!projectOverlapsCurrentMonth(project)) return false;
            if (calendarContext === 'PERSONAL') return project.projectScope === 'PERSONAL';
            return project.projectScope === 'GROUP' && String(project.wsId || '') === String(contextWsId || '');
        });
        monthProjectsSection.hidden = false;
        monthProjects.replaceChildren();
        if (monthProjectsCount) monthProjectsCount.textContent = projects.length ? `${projects.length}개` : '';

        if (!projects.length) {
            const empty = document.createElement('p');
            empty.className = 'moyo-cal2-month-empty';
            empty.textContent = '이번 달 진행 중인 프로젝트가 없어요.';
            monthProjects.appendChild(empty);
            return;
        }

        projects.slice(0, 4).forEach((project) => {
            const start = formatMonthDay(project.startDate);
            const end = formatMonthDay(project.endDate);
            monthProjects.appendChild(makeMonthSummaryRow({
                iconHtml: `<i class="fa-solid ${projectTypeIconClass(project.type)}" aria-hidden="true"></i>`,
                iconLabel: `${projectTypeLabel(project.type)} 유형`,
                title: project.name || '프로젝트',
                period: start || end ? [start, end].filter(Boolean).join(' ~ ') : '기간 미정',
                extraClass: 'is-project'
            }));
        });
        if (projects.length > 4) {
            const more = document.createElement('span');
            more.className = 'moyo-cal2-birthday-more';
            more.textContent = `외 ${projects.length - 4}개`;
            monthProjects.appendChild(more);
        }
    }

    function renderHolidaySection() {
        if (!holidaySection || !holidayList) return;
        holidaySection.hidden = true;
        holidayList.replaceChildren();
        if (holidayCount) holidayCount.textContent = '';

        const currentDate = calendar?.getDate?.() || parseDateOnlyLocal(state.viewDate) || new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const seen = new Set();
        const holidays = (runtimeEventIndex.all || [])
            .filter((event) => String(event?.extendedProps?.displayType || '').toUpperCase() === 'HOLIDAY')
            .map((event) => ({
                date: toDateOnly(event.start),
                name: event.title || '공휴일'
            }))
            .filter((item) => {
                if (!item.date) return false;
                const [y, m] = item.date.split('-').map(Number);
                if (y !== year || m !== month) return false;
                const key = `${item.date}:${item.name}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => String(a.date).localeCompare(String(b.date)));

        if (!holidays.length) return;

        const grouped = [];
        holidays.forEach((item) => {
            const previous = grouped[grouped.length - 1];
            const currentTime = Date.parse(`${item.date}T00:00:00Z`);
            const previousTime = previous ? Date.parse(`${previous.endDate}T00:00:00Z`) : NaN;
            const isNextDay = Number.isFinite(currentTime) && Number.isFinite(previousTime)
                && currentTime - previousTime === 86400000;
            if (previous && previous.name === item.name && isNextDay) {
                previous.endDate = item.date;
            } else {
                grouped.push({ name: item.name, startDate: item.date, endDate: item.date });
            }
        });

        holidaySection.hidden = false;
        if (holidayCount) holidayCount.textContent = `${grouped.length}개`;
        grouped.slice(0, 4).forEach((item) => {
            const start = formatMonthDay(item.startDate);
            const end = formatMonthDay(item.endDate);
            holidayList.appendChild(makeMonthSummaryRow({
                iconHtml: '<i class="fa-solid fa-flag" aria-hidden="true"></i>',
                iconLabel: '공휴일',
                title: item.name,
                period: item.startDate === item.endDate ? start : `${start} ~ ${end}`,
                extraClass: 'is-holiday'
            }));
        });
        if (grouped.length > 4) {
            const more = document.createElement('p');
            more.className = 'moyo-cal2-birthday-more';
            more.textContent = `외 ${grouped.length - 4}개`;
            holidayList.appendChild(more);
        }
    }

    async function ensureProjectTaskSummary() {
        if (calendarContext !== 'PROJECT' || !effectiveProjectId()) return;
        const key = String(effectiveProjectId());
        if (projectTaskSummaryKey === key && projectTaskSummary) return;
        const contextPath = String(window.MOYO_CALENDAR_CONTEXT_PATH || '').replace(/\/$/, '');
        try {
            projectTaskSummary = await fetchJson(`${contextPath}/api/calendar/project-task-summary?projId=${encodeURIComponent(key)}`);
            projectTaskSummaryKey = key;
        } catch (error) {
            projectTaskSummary = null;
            projectTaskSummaryKey = '';
        }
    }

    function renderProjectMonthSummary() {
        const isProject = calendarContext === 'PROJECT';
        if (projectProgressSection) projectProgressSection.hidden = !isProject;
        if (!isProject) return;

        const summary = projectTaskSummary || {};
        const rate = Math.max(0, Math.min(100, Number(summary.rate) || 0));

        if (projectProgressRate) projectProgressRate.textContent = `${rate}%`;
        if (projectProgressBar) {
            projectProgressBar.style.width = `${rate}%`;
            projectProgressBar.setAttribute('aria-valuenow', String(rate));
        }
    }

    function renderMonthOverview() {
        renderBirthdaySection();
        renderMonthProjects();
        renderHolidaySection();
        renderProjectMonthSummary();
        if (calendarContext === 'PROJECT') {
            ensureProjectTaskSummary().then(renderProjectMonthSummary);
            if (!state.projectMembersLoaded) ensureContextMembers().then(renderBirthdaySection);
        }
    }

    function renderSecondaryFilters() {
        if (!secondaryFilters) return;
        secondaryFilters.replaceChildren();
        secondaryFilters.classList.add('is-empty');
        if (filterRow) filterRow.hidden = true;
        renderMonthOverview();

        const showSecondaryFilters = () => {
            secondaryFilters.replaceChildren();
            secondaryFilters.classList.remove('is-empty');
            if (filterRow) filterRow.hidden = false;
        };

        if (calendarContext === 'PERSONAL' && state.scope === 'FRIEND') {
            showSecondaryFilters();
            const friends = mapFriendsForSelector();
            appendSecondaryEntityList(friends, {
                allLabel: '전체 친구',
                key: 'friendId',
                activeValue: state.friendId,
                itemFallback: '친구',
                moreLabel: '친구 더보기',
                reason: 'friend-filter'
            });
            if (!state.scopeOptionsLoaded) ensureScopeOptions().then(renderSecondaryFilters);
            return;
        }

        if (calendarContext === 'PERSONAL' && state.scope === 'PROJ') {
            showSecondaryFilters();
            // 개인 캘린더의 프로젝트 범위는 개인 프로젝트만 다룬다.
            // 그룹 프로젝트는 각 그룹 캘린더의 프로젝트 범위에서만 노출한다.
            const projects = mapProjectsForSelector().filter((project) => project.projectScope === 'PERSONAL');
            appendSecondaryEntityList(projects, {
                allLabel: '전체 프로젝트',
                key: 'projId',
                activeValue: state.projId,
                itemFallback: '프로젝트',
                moreLabel: '프로젝트 더보기',
                reason: 'personal-project-filter',
                patch: () => ({ projectScope: 'PERSONAL', wsId: null })
            });
            if (!state.scopeOptionsLoaded) ensureScopeOptions().then(renderSecondaryFilters);
            return;
        }

        if (calendarContext === 'GROUP' && state.scope === 'PROJ') {
            showSecondaryFilters();
            const projects = mapProjectsForSelector().filter((project) => (
                project.projectScope === 'GROUP'
                && String(project.wsId || '') === String(contextWsId || '')
            ));
            secondaryFilters.appendChild(makeSecondaryButton('전체 프로젝트', '', !state.projId, 'projId'));

            const visibleLimit = 5;
            const visibleProjects = projects.slice(0, visibleLimit);
            visibleProjects.forEach((project) => {
                secondaryFilters.appendChild(makeSecondaryButton(
                    project.name || '프로젝트',
                    String(project.id || ''),
                    String(state.projId || '') === String(project.id || ''),
                    'projId'
                ));
            });

            if (projects.length > visibleLimit) {
                const overflowProjects = projects.slice(visibleLimit);
                const select = document.createElement('select');
                select.className = 'moyo-cal2-secondary-select';
                select.setAttribute('aria-label', '나머지 프로젝트');
                select.innerHTML = `<option value="">프로젝트 더보기 +${overflowProjects.length}</option>`
                    + overflowProjects.map((project) => `<option value="${String(project.id || '')}">${escapeHtml(project.name || '프로젝트')}</option>`).join('');
                if (overflowProjects.some((project) => String(project.id || '') === String(state.projId || ''))) {
                    select.value = String(state.projId || '');
                }
                select.addEventListener('change', () => {
                    if (!select.value) return;
                    setState({ projId: select.value, projectScope: 'GROUP' }, { reason: 'group-project-filter' });
                    renderSecondaryFilters();
                    syncScopeQuery();
                    window.MoyoCalendarV2?.refresh();
                });
                secondaryFilters.appendChild(select);
            }

            if (!state.scopeOptionsLoaded) ensureScopeOptions().then(renderSecondaryFilters);
            return;
        }

        if (calendarContext === 'GROUP' && state.scope === 'WS') {
            showSecondaryFilters();
            secondaryFilters.appendChild(makeSecondaryButton('전체 일정', 'ALL', state.groupScheduleFilter === 'ALL', 'groupScheduleFilter'));
            secondaryFilters.appendChild(makeSecondaryButton('내 일정', 'ME', state.groupScheduleFilter === 'ME', 'groupScheduleFilter'));
            const select = document.createElement('select');
            select.className = 'moyo-cal2-secondary-select';
            select.setAttribute('aria-label', '멤버별 일정');
            const sessionUserId = String(window.MOYO_CALENDAR_SESSION_USER_ID || '');
            select.innerHTML = '<option value="">멤버별</option>' + state.groupMembers
                .filter((member) => String(member.id || '') !== sessionUserId)
                .map((member) => `<option value="${String(member.id)}">${escapeHtml(member.name)}</option>`).join('');
            if (state.groupScheduleFilter.startsWith('MEMBER:')) select.value = state.groupScheduleFilter.substring(7);
            select.addEventListener('change', () => {
                const next = select.value ? `MEMBER:${select.value}` : 'ALL';
                setState({ groupScheduleFilter: next }, { reason: 'group-filter' });
                renderSecondaryFilters();
                syncScopeQuery();
                window.MoyoCalendarV2?.refresh();
            });
            secondaryFilters.appendChild(select);
            if (!state.groupMembersLoaded) ensureContextMembers().then(renderSecondaryFilters);
            return;
        }

        if (calendarContext === 'PROJECT' && state.scope === 'EVENT') {
            showSecondaryFilters();
            [['전체 일정','ALL'],['내가 만든 일정','MINE'],['내가 참여한 일정','JOINED']].forEach(([label,value]) =>
                secondaryFilters.appendChild(makeSecondaryButton(label, value, state.projectScheduleFilter === value, 'projectScheduleFilter'))
            );
            return;
        }

        if (calendarContext === 'PROJECT' && state.scope === 'TASK') {
            showSecondaryFilters();
            [['전체','ALL'],['할 일','TODO'],['진행 중','IN_PROGRESS'],['완료','DONE'],['지연','DELAYED']].forEach(([label,value]) =>
                secondaryFilters.appendChild(makeSecondaryButton(label, value, state.taskStatusFilter === value, 'taskStatusFilter'))
            );
            const select = document.createElement('select');
            select.className = 'moyo-cal2-secondary-select is-member';
            select.setAttribute('aria-label', '업무 담당자');
            const sessionUserId = String(window.MOYO_CALENDAR_SESSION_USER_ID || '');
            select.innerHTML = '<option value="ALL">전체 멤버</option><option value="ME">내 업무</option>' + state.projectMembers
                .filter((member) => String(member.id || '') !== sessionUserId)
                .map((member) => `<option value="${String(member.id)}">${escapeHtml(member.name)}</option>`).join('');
            select.value = state.taskMemberFilter || 'ALL';
            select.addEventListener('change', () => {
                setState({ taskMemberFilter: select.value || 'ALL' }, { reason: 'task-member-filter' });
                syncScopeQuery();
                window.MoyoCalendarV2?.refresh();
            });
            secondaryFilters.appendChild(select);
            if (!state.projectMembersLoaded) ensureContextMembers().then(renderSecondaryFilters);
            return;
        }

        if (calendarContext === 'PROJECT' && state.scope === 'PLAN') {
            showSecondaryFilters();
            [['전체 계획','ALL'],['기간별','PHASE'],['주간','WEEKLY_PLAN'],['시간별','TIME_PLAN']].forEach(([label,value]) =>
                secondaryFilters.appendChild(makeSecondaryButton(label, value, state.planFilter === value, 'planFilter'))
            );
        }
    }

    function renderScopeNavigation() {
        if (calendarContext === 'PROJECT' && !contextScopes.includes(state.scope)) {
            setState({ scope: 'ALL' }, { reason: 'scope:project-normalize', notify: false });
        }

        // 프로젝트 컨텍스트의 상단 탭도 우측 패널과 같은 순서로 맞춘다.
        // 전체 / 계획 / 일정 / 업무
        if (calendarContext === 'PROJECT' && scopeNav) {
            ['ALL', 'PLAN', 'EVENT', 'TASK'].forEach((scope) => {
                const button = scopeNav.querySelector(`[data-cal2-scope="${scope}"]`);
                if (button) scopeNav.appendChild(button);
            });
        }

        scopeTabs.forEach((button) => {
            const buttonScope = String(button.dataset.cal2Scope || '').toUpperCase();
            const visible = contextScopes.includes(buttonScope);
            const active = visible && buttonScope === state.scope;
            button.hidden = !visible;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (moyoOnlyButton) {
            const visible = calendarContext === 'PERSONAL';
            moyoOnlyButton.hidden = !visible;
            moyoOnlyButton.classList.toggle('is-active', visible && state.moyoPublicVisible);
            moyoOnlyButton.classList.toggle('is-muted', visible && !state.moyoPublicVisible);
            moyoOnlyButton.setAttribute('aria-pressed', visible && state.moyoPublicVisible ? 'true' : 'false');
            moyoOnlyButton.setAttribute('aria-label', state.moyoPublicVisible ? '모요 공개 일정 숨기기' : '모요 공개 일정 보이기');
            moyoOnlyButton.setAttribute('title', state.moyoPublicVisible ? '모요 공개 일정 숨기기' : '모요 공개 일정 보이기');
        }

        if (scopeNav) scopeNav.hidden = false;

        const hasTargetSelector = false;
        if (scopeTargetButton) scopeTargetButton.hidden = true;

        renderSecondaryFilters();
        updateCreateAvailability();
    }

    function announceScopeChange() {
        document.dispatchEvent(new CustomEvent('moyo:calendar-v2-scope-change', {
            detail: currentScopeSelection()
        }));
    }

    function applyScope(scope) {
        const next = contextScopes.includes(scope) ? scope : defaultContextScope;
        if (state.scope === next) return;
        setState({ scope: next }, { reason: 'scope:change' });
        resetScopeTargets(next);
        renderScopeNavigation();
        renderProjectContext();
        syncScopeQuery();
        announceScopeChange();
        if (calendarContext === 'PERSONAL' && ['ALL', 'FRIEND', 'PROJ'].includes(state.scope)) ensureScopeOptions();
        if (calendarContext === 'GROUP' && state.scope === 'PROJ') ensureScopeOptions();
        if (window.MoyoCalendarV2) window.MoyoCalendarV2.refresh();
    }

    function applyTargetSelection(selection) {
        const selected = selection || {};
        const patch = { scopeLabel: selected.label || '' };
        if (state.scope === 'FRIEND') {
            Object.assign(patch, {
                friendId: selected.friendId || null,
                wsId: null,
                projId: null,
                projectScope: null
            });
        } else if (state.scope === 'WS') {
            Object.assign(patch, {
                friendId: null,
                wsId: calendarContext === 'GROUP' ? contextWsId : (selected.wsId || null),
                projId: null,
                projectScope: null
            });
        } else if (state.scope === 'PROJ') {
            const selectedWsId = selected.wsId || null;
            const selectedProjId = selected.projId || null;

            // 그룹 캘린더에서는 공통 선택 모달이 어떤 값을 돌려주더라도 현재 그룹에
            // 속하지 않은 프로젝트를 state에 넣지 않는다. 선택 목록 자체도 아래에서
            // 필터링하지만, 적용 시점에도 한 번 더 방어한다.
            if (calendarContext === 'GROUP' && selectedProjId) {
                const allowed = mapProjectsForSelector().some((project) => (
                    String(project.id || '') === String(selectedProjId)
                    && project.projectScope === 'GROUP'
                    && String(project.wsId || '') === String(contextWsId || '')
                ));
                if (!allowed) return;
            }

            Object.assign(patch, {
                friendId: null,
                wsId: calendarContext === 'GROUP' ? contextWsId : selectedWsId,
                projId: selectedProjId,
                projectScope: calendarContext === 'PERSONAL'
                    ? 'PERSONAL'
                    : (calendarContext === 'GROUP' ? 'GROUP' : (selected.projectScope || null))
            });
        }
        setState(patch, { reason: 'scope:target' });
        resolveScopeLabelFromCurrentSelection();
        renderScopeNavigation();
        renderProjectContext();
        syncScopeQuery();
        announceScopeChange();
        if (window.MoyoCalendarV2) window.MoyoCalendarV2.refresh();
    }

    async function openScopeTargetSelector() {
        const selectorAllowed = calendarContext === 'PERSONAL'
            ? ['FRIEND', 'PROJ'].includes(state.scope)
            : (calendarContext === 'GROUP' && state.scope === 'PROJ');
        if (!selectorAllowed) return;
        if (!window.MoyoCalendarV2Bridge || typeof window.MoyoCalendarV2Bridge.openScopeSelector !== 'function') {
            console.error('[Calendar V2] Scope selector bridge를 불러오지 못했습니다.');
            return;
        }

        await ensureScopeOptions();
        const selectableProjects = mapProjectsForSelector().filter((project) => {
            if (calendarContext === 'PERSONAL') return project.projectScope === 'PERSONAL';
            if (calendarContext === 'GROUP') {
                return project.projectScope === 'GROUP'
                    && String(project.wsId || '') === String(contextWsId || '');
            }
            return String(project.id || '') === String(contextProjId || '');
        });
        window.MoyoCalendarV2Bridge.openScopeSelector({
            scope: state.scope,
            selection: currentScopeSelection(),
            friends: calendarContext === 'PERSONAL' ? mapFriendsForSelector() : [],
            workspaces: calendarContext === 'GROUP'
                ? mapWorkspacesForSelector().filter((workspace) => String(workspace.id || '') === String(contextWsId || ''))
                : [],
            projects: selectableProjects,
            lockProjectBranch: state.scope === 'PROJ' && calendarContext !== 'PROJECT',
            projectBranch: calendarContext === 'PERSONAL' ? 'PERSONAL' : (calendarContext === 'GROUP' ? 'GROUP' : null),
            selectedWorkspaceId: calendarContext === 'GROUP' ? contextWsId : null,
            contextLabel: '일정',
            imageResolver: normalizeImagePath,
            onSelect: applyTargetSelection
        });
    }

    function normalizeCssColor(value) {
        const color = String(value || '').trim();
        if (!color) return '';
        if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
        if (/^(rgb|rgba|hsl|hsla)\(/i.test(color)) return color;
        return '';
    }

    function taskStatusLabel(status, delayedYn) {
        if (String(delayedYn || '').toUpperCase() === 'Y') return '지연';
        if (status === 'DONE') return '완료';
        if (status === 'IN_PROGRESS') return '진행';
        return '할 일';
    }

    function scheduleEventContent(info) {
        const props = info.event.extendedProps || {};
        const root = document.createElement('div');
        root.className = 'moyo-cal2-event-content';

        if (props.displayType === 'HOLIDAY') {
            const holidayTitle = document.createElement('span');
            holidayTitle.className = 'moyo-cal2-event-title';
            holidayTitle.textContent = info.event.title || '';
            root.appendChild(holidayTitle);
            return { domNodes: [root] };
        }

        const kind = String(props.calendarV2Kind || '').toUpperCase();

        if (kind === 'BIRTHDAY' || String(props.displayType || '').toUpperCase() === 'BIRTHDAY') {
            root.classList.add('is-birthday-content');
            root.appendChild(buildScheduleAvatar(props, '친구'));

            const birthdayTitle = document.createElement('span');
            birthdayTitle.className = 'moyo-cal2-event-title';
            birthdayTitle.textContent = String(info.event.title || '친구').replace(/\s*생일\s*$/, '') || '친구';
            root.appendChild(birthdayTitle);

            const birthdayIcon = document.createElement('span');
            birthdayIcon.className = 'moyo-cal2-birthday-event-icon';
            birthdayIcon.title = '생일';
            birthdayIcon.setAttribute('aria-label', '생일');
            const cake = document.createElement('i');
            cake.className = 'fa-solid fa-cake-candles';
            cake.setAttribute('aria-hidden', 'true');
            birthdayIcon.appendChild(cake);
            root.appendChild(birthdayIcon);

            return { domNodes: [root] };
        }

        const isSchedule = kind === 'SCHEDULE';
        const isProjectSchedule = isProjectScheduleProps(props);
        const isOwnSchedule = isSchedule && !isProjectSchedule && isScheduleOwnedBySession(props);
        const isFriendSchedule = isSchedule
            && !isProjectSchedule
            && !isOwnSchedule
            && ['FRIEND', 'MOYO'].includes(String(props.displayType || '').toUpperCase());

        if (kind === 'TASK') {
            root.appendChild(buildTaskAssigneeAvatar(props));
        } else if (isProjectSchedule) {
            // 일정의 1차 식별자는 프로젝트 유형이 아니라 작성자다.
            root.appendChild(buildScheduleAvatar(props, '작성자'));
        } else if (isOwnSchedule) {
            root.appendChild(buildScheduleAvatar(props, '나'));
        } else if (isFriendSchedule) {
            root.appendChild(buildScheduleAvatar(props, '친구'));
        } else {
            const marker = document.createElement('span');
            marker.className = kind === 'PHASE'
                ? 'moyo-cal2-event-marker moyo-cal2-phase-marker'
                : (kind === 'WEEKLY_PLAN'
                    ? 'moyo-cal2-event-marker moyo-cal2-weekly-marker'
                    : (kind === 'TIME_PLAN'
                        ? 'moyo-cal2-event-marker moyo-cal2-time-plan-marker'
                        : 'moyo-cal2-event-marker'));
            marker.setAttribute('aria-hidden', 'true');
            root.appendChild(marker);
        }

        if (info.timeText) {
            const time = document.createElement('span');
            time.className = 'moyo-cal2-event-time';
            time.textContent = info.timeText;
            root.appendChild(time);
        }

        const title = document.createElement('span');
        title.className = 'moyo-cal2-event-title';
        title.textContent = info.event.title || '제목 없음';
        root.appendChild(title);

        if (kind === 'TASK') {
            const status = document.createElement('span');
            status.className = 'moyo-cal2-task-status';
            status.textContent = taskStatusLabel(props.status, props.delayedYn);
            root.appendChild(status);
        } else if (kind === 'WEEKLY_PLAN') {
            const weekly = document.createElement('span');
            weekly.className = 'moyo-cal2-weekly-label';
            weekly.textContent = '매주';
            root.appendChild(weekly);
        } else if (String(props.isRecurring || '').toUpperCase() === 'Y') {
            const recurring = document.createElement('span');
            recurring.className = 'moyo-cal2-event-recurring';
            recurring.setAttribute('aria-hidden', 'true');
            recurring.textContent = '↻';
            root.appendChild(recurring);
        }

        if (isMoyoPublicScheduleProps(props)) {
            root.classList.add('has-moyo-public');
            root.appendChild(buildMoyoPublicMark('moyo-cal2-event-public-mark'));
        }

        return { domNodes: [root] };
    }

    // ------------------------------------------------------------------
    // Step 32: +N / content density
    // ------------------------------------------------------------------
    // 날짜 셀 높이를 JS로 강제 보정하지 않는다. 화면 폭(그리고 아주 낮은
    // viewport)만 기준으로 FullCalendar가 보여줄 foreground row 수를 정한다.
    // PROJECT_PERIOD는 별도 context이고, PHASE는 일반 event row로 +N 계산에 포함된다.
    function getCalendarContentDensityRows() {
        const width = Math.round(root.getBoundingClientRect().width || window.innerWidth || 1280);
        let rows = 5;

        if (width < 640) rows = 2;
        else if (width < 920) rows = 3;
        else if (width < 1240) rows = 4;

        // 세로 공간이 유난히 작은 노트북 화면에서는 한 줄만 더 덜어낸다.
        if ((window.innerHeight || 900) < 720) rows = Math.max(2, rows - 1);
        return rows;
    }

    function moreLinkContent(arg) {
        return `+${arg.num}`;
    }

    function handleMoreLinkClick(arg) {
        if (arg && arg.date) {
            selectCalendarDate(toDateOnly(arg.date), { reason: 'calendar:more-link' });
        }
        // FullCalendar 기본 popover는 유지한다. V2는 trigger/pill 톤만 정리한다.
        return 'popover';
    }

    function applyCalendarEventVisual(info) {
        const props = info.event.extendedProps || {};
        if (!['SCHEDULE', 'BIRTHDAY', 'TASK', 'PROJECT_PERIOD', 'PHASE', 'PHASE_BOUNDARY', 'WEEKLY_PLAN', 'TIME_PLAN'].includes(props.calendarV2Kind)) return;

        const displayType = String(props.displayType || '').toUpperCase();
        const calendarKind = String(props.calendarV2Kind || '').toUpperCase();
        const isBirthday = calendarKind === 'BIRTHDAY' || displayType === 'BIRTHDAY';
        const isSchedule = calendarKind === 'SCHEDULE';
        const isOwnSchedule = isSchedule && isScheduleOwnedBySession(props);
        const isFriendSchedule = isSchedule
            && !isOwnSchedule
            && ['FRIEND', 'MOYO'].includes(displayType);
        const sourceColor = normalizeCssColor(props.sourceColor);

        if (isBirthday) {
            info.el.style.setProperty('--cal2-event-accent', 'var(--cal2-scope-friend)');
            info.el.style.setProperty('--cal2-event-soft', 'color-mix(in srgb, var(--cal2-scope-friend) 11%, var(--cal2-surface))');
        } else if (isOwnSchedule) {
            info.el.style.setProperty('--cal2-event-accent', 'var(--cal2-scope-private)');
            info.el.style.setProperty('--cal2-event-soft', '#eef3ff');
        } else if (isFriendSchedule) {
            info.el.style.setProperty('--cal2-event-accent', 'var(--cal2-scope-friend)');
            info.el.style.setProperty('--cal2-event-soft', 'color-mix(in srgb, var(--cal2-scope-friend) 14%, var(--cal2-surface))');
        } else if (sourceColor && displayType !== 'HOLIDAY') {
            info.el.style.setProperty('--cal2-event-accent', sourceColor);
        }

        const typeLabel = props.calendarV2Kind === 'TASK'
            ? '업무'
            : (props.calendarV2Kind === 'BIRTHDAY'
                ? '생일'
                : (['PHASE', 'WEEKLY_PLAN', 'TIME_PLAN'].includes(props.calendarV2Kind) ? planKindLabel(props.calendarV2Kind) : ''));
        const label = props.displayType === 'HOLIDAY'
            ? info.event.title
            : `${typeLabel ? `${typeLabel} ` : ''}${info.timeText ? `${info.timeText} ` : ''}${info.event.title}`.trim();
        if (label) info.el.setAttribute('aria-label', label);
    }

    function activateCalendarEvent(event) {
        if (!event) return;
        const props = event.extendedProps || {};
        if (props.calendarV2Kind === 'TASK') {
            if (!window.MoyoCalendarV2Bridge || typeof window.MoyoCalendarV2Bridge.openTask !== 'function') return;
            const taskId = props.taskId || String(event.id || '').replace(/^TASK:/, '');
            if (!taskId) return;
            runInteractionOnce(`calendar:${calendarItemInteractionKey(event)}`, () => {
                window.MoyoCalendarV2Bridge.openTask(taskId, buildTaskProjectContext(props));
            });
            return;
        }

        if (['PHASE', 'PHASE_BOUNDARY', 'WEEKLY_PLAN', 'TIME_PLAN'].includes(String(props.calendarV2Kind || '').toUpperCase())) {
            if (!window.MoyoCalendarV2Bridge || typeof window.MoyoCalendarV2Bridge.openPlan !== 'function') return;
            const rawKind = String(props.calendarV2Kind || '').toUpperCase();
            const kind = rawKind === 'PHASE_BOUNDARY' ? 'PHASE' : rawKind;
            const entityId = props.entityId || String(event.id || '').split(':')[1] || '';
            if (!entityId) return;
            runInteractionOnce(`calendar:${calendarItemInteractionKey(event)}`, () => {
                window.MoyoCalendarV2Bridge.openPlan({
                    kind,
                    type: kind,
                    entityId,
                    id: entityId,
                    title: event.title || '',
                    start: props.originalStartDt || (event.start ? event.start.toISOString() : ''),
                    end: props.originalEndDt || (event.end ? event.end.toISOString() : ''),
                    color: props.sourceColor || '',
                    description: props.description || ''
                }, buildTaskProjectContext(props));
            });
            return;
        }

        if (props.calendarV2Kind !== 'SCHEDULE' || props.displayType === 'HOLIDAY') return;
        if (!window.MoyoCalendarV2Bridge || typeof window.MoyoCalendarV2Bridge.openSchedule !== 'function') return;
        const occurrenceDate = event.start ? toDateOnly(event.start) : null;
        runInteractionOnce(`calendar:${calendarItemInteractionKey(event)}`, () => {
            window.MoyoCalendarV2Bridge.openSchedule(event.id, { occurrenceDate });
        });
    }

    let lastDateClick = {
        date: null,
        at: 0
    };
    const DATE_DOUBLE_CLICK_MS = 420;

    function openScheduleForSingleDate(dateString) {
        if (!dateString || !canCreateScheduleInCurrentScope()) return;
        if (!window.MoyoCalendarV2Bridge || typeof window.MoyoCalendarV2Bridge.createSchedule !== 'function') return;

        const scope = scheduleCreateScope();
        if (!scope) return;

        const interactionKey = `create-schedule-day:${scope.scopeType}:${scope.wsId || ''}:${scope.projId || ''}:${dateString}`;
        runInteractionOnce(interactionKey, () => {
            window.MoyoCalendarV2Bridge.createSchedule({
                ...scope,
                date: dateString,
                startDate: dateString,
                endDate: dateString,
                allDay: true
            });
        }, 500);
    }

    const calendar = new window.FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: initialViewDate,
        locale: 'ko',
        headerToolbar: false,
        fixedWeekCount: false,
        selectable: true,
        editable: false,
        nowIndicator: true,
        dayMaxEventRows: getCalendarContentDensityRows(),
        moreLinkClassNames: ['moyo-cal2-more-link'],
        moreLinkContent,
        moreLinkClick: handleMoreLinkClick,
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        events(info, successCallback, failureCallback) {
            loadCalendarEventSource(info, successCallback, failureCallback);
        },
        datesSet(info) {
            const current = calendar.getDate();
            const viewDate = toDateOnly(current);
            setState({ viewDate }, { reason: 'calendar:view-date' });
            syncViewDateQuery(viewDate);
            updateMonthLabel(current);

            // 월을 이동해도 selectedDate 자체는 유지한다.
            // 해당 날짜가 현재 렌더 범위에 있을 때만 셀 강조가 보인다.
            window.requestAnimationFrame(() => {
                syncSelectedDayVisual();
                syncHolidayDayVisual();
                syncProjectPeriodDayVisual();
                renderSelectedDayPanel();
                renderMonthOverview();
            });
        },
        dayCellDidMount(info) {
            if (info && info.el) {
                const dateString = toDateOnly(info.date);
                info.el.setAttribute('tabindex', '0');
                info.el.setAttribute('role', 'button');
                if (dateString) info.el.setAttribute('aria-label', `${dateString} 선택`);

                info.el.addEventListener('keydown', (event) => {
                    // 셀 안의 이벤트/+N 같은 별도 컨트롤에서 올라온 keydown은 가로채지 않는다.
                    if (event.target !== info.el) return;
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    selectCalendarDate(dateString, { reason: 'calendar:selected-date:keyboard' });
                });
            }

            window.requestAnimationFrame(() => {
                syncSelectedDayVisual();
                syncHolidayDayVisual();
                syncProjectPeriodDayVisual();
            });
        },
        eventsSet(events) {
            rebuildRuntimeEventIndex(events);
            syncHolidayDayVisual();
            syncProjectPeriodDayVisual();
            renderSelectedDayPanel();
            renderMonthOverview();
            if (state.search.open) scheduleSearchResultsRender();
        },
        dateClick(info) {
            const dateString = info && info.dateStr ? String(info.dateStr).slice(0, 10) : '';
            if (!dateString) return;

            const now = Date.now();
            const isDoubleClick = lastDateClick.date === dateString
                && (now - lastDateClick.at) <= DATE_DOUBLE_CLICK_MS;

            // 첫 클릭은 날짜 선택과 오른쪽 패널 갱신만 담당한다.
            selectCalendarDate(dateString, { reason: 'calendar:selected-date' });

            if (isDoubleClick) {
                lastDateClick = { date: null, at: 0 };
                openScheduleForSingleDate(dateString);
                return;
            }

            lastDateClick = {
                date: dateString,
                at: now
            };
        },
        select(info) {
            const startDate = toDateOnly(info && info.start);
            if (!startDate) return;

            const inclusiveEnd = info && info.allDay && info.end
                ? (addDaysDateOnly(info.end, -1) || startDate)
                : startDate;

            selectCalendarDate(startDate, { reason: 'calendar:selected-date:range' });

            // 단일 날짜 클릭/선택은 오른쪽 패널 탐색만 담당한다.
            // 실제 생성은 빈 셀 더블클릭, 또는 2일 이상 드래그 범위 선택에서만 연다.
            if (info && info.allDay !== false && inclusiveEnd === startDate) {
                calendar.unselect();
                return;
            }

            // 친구 캘린더는 조회 전용이고, 개인 프로젝트는 프로젝트를 고른 뒤에만 등록한다.
            if (!canCreateScheduleInCurrentScope()) {
                calendar.unselect();
                return;
            }

            if (window.MoyoCalendarV2Bridge && typeof window.MoyoCalendarV2Bridge.createSchedule === 'function') {
                const scope = scheduleCreateScope();
                const options = {
                    ...scope,
                    date: startDate,
                    startDate,
                    allDay: info.allDay !== false
                };

                if (info.allDay) {
                    options.endDate = inclusiveEnd;
                } else {
                    if (info.start) {
                        options.startTime = `${String(info.start.getHours()).padStart(2, '0')}:${String(info.start.getMinutes()).padStart(2, '0')}`;
                    }
                    if (info.end) {
                        options.endDate = toDateOnly(info.end);
                        options.endTime = `${String(info.end.getHours()).padStart(2, '0')}:${String(info.end.getMinutes()).padStart(2, '0')}`;
                    }
                }

                const interactionKey = `create-schedule-range:${scope.scopeType}:${scope.wsId || ''}:${scope.projId || ''}:${startDate}:${options.endDate || ''}`;
                runInteractionOnce(interactionKey, () => {
                    window.MoyoCalendarV2Bridge.createSchedule(options);
                }, 500);
            }

            calendar.unselect();
        },
        eventClassNames(info) {
            const props = info.event.extendedProps || {};
            const rawDisplayType = String(props.displayType || 'PRIVATE').toUpperCase();
            const isSchedule = String(props.calendarV2Kind || '').toUpperCase() === 'SCHEDULE';
            const isOwnSchedule = isSchedule && isScheduleOwnedBySession(props);
            const visualDisplayType = isOwnSchedule
                ? 'PRIVATE'
                : (isSchedule && ['FRIEND', 'MOYO'].includes(rawDisplayType) ? 'FRIEND' : rawDisplayType);
            const classes = ['moyo-cal2-event', `is-${visualDisplayType.toLowerCase()}`];
            if (String(props.calendarV2Kind || '').toUpperCase() === 'PROJECT_PERIOD_BOUNDARY') {
                classes.push('is-project-period-boundary');
                if (String(props.allScopePeriodYn || '').toUpperCase() === 'Y') {
                    classes.push('is-all-scope-project-boundary');
                }
                const boundaryPosition = String(props.periodPosition || '').toLowerCase();
                if (boundaryPosition) classes.push(`is-${boundaryPosition}`);
            }
            if (String(props.calendarV2Kind || '').toUpperCase() === 'PHASE_BOUNDARY') {
                classes.push('is-plan', 'is-plan-phase-boundary');
                const phasePosition = String(props.phasePosition || '').toLowerCase();
                if (phasePosition) classes.push(`is-${phasePosition}`);
            }
            if (String(props.calendarV2Kind || '').toUpperCase() === 'PROJECT_PERIOD_MARKER') {
                classes.push('is-project-period-day-marker');
                const markerPosition = String(props.periodPosition || '').toLowerCase();
                if (markerPosition) classes.push(`is-${markerPosition}`);
            }
            if (info.event.allDay) classes.push('is-all-day');
            else classes.push('is-timed');
            if (info.isStart && info.isEnd) classes.push('is-single-segment');
            else if (info.isStart) classes.push('is-segment-start');
            else if (info.isEnd) classes.push('is-segment-end');
            else classes.push('is-segment-middle');
            if (props.calendarV2Kind === 'TASK') {
                classes.push('is-task');
                const status = normalizeTaskStatus(props.status);
                classes.push(`is-task-${status.toLowerCase().replace('_', '-')}`);
                if (String(props.delayedYn || '').toUpperCase() === 'Y') classes.push('is-task-delayed');
            } else if (String(props.calendarV2Kind || '').toUpperCase() === 'PROJECT_PERIOD') {
                classes.push('is-project-period', 'is-project-period-background');
            } else if (['PHASE', 'WEEKLY_PLAN', 'TIME_PLAN'].includes(String(props.calendarV2Kind || '').toUpperCase())) {
                classes.push('is-plan', `is-plan-${String(props.calendarV2Kind).toLowerCase().replace('_', '-')}`);
                if (String(props.calendarV2Kind || '').toUpperCase() === 'PHASE') classes.push('is-plan-phase-range');
            }
            if (String(props.isRecurring || '').toUpperCase() === 'Y' || props.recurring === true) classes.push('is-recurring');
            return classes;
        },
        eventContent(info) {
            const boundaryProps = info.event.extendedProps || {};
            if (String(boundaryProps.calendarV2Kind || '').toUpperCase() === 'PROJECT_PERIOD_BOUNDARY') {
                const wrapper = document.createElement('div');
                wrapper.className = 'moyo-cal2-project-boundary-content';

                // 기존 프로젝트 유형 아이콘 매핑을 그대로 사용한다.
                // WORK=briefcase / TRAVEL=plane / MEETING=users /
                // STUDY=graduation-cap / LIFE=house / HOBBY=palette / ETC=folder-open
                const icon = buildProjectTypeIcon(boundaryProps);
                icon.classList.add('moyo-cal2-project-boundary-type-icon');

                const title = document.createElement('span');
                title.className = 'moyo-cal2-project-boundary-title';
                title.textContent = info.event.title || '프로젝트';

                const isAllScopeBoundary = String(boundaryProps.allScopePeriodYn || '').toUpperCase() === 'Y';
                if (isAllScopeBoundary) {
                    wrapper.append(icon, title);
                    return { domNodes: [wrapper] };
                }

                const label = document.createElement('span');
                label.className = 'moyo-cal2-project-boundary-state';
                const position = String(boundaryProps.periodPosition || '').toLowerCase();
                label.textContent = position === 'end'
                    ? '종료'
                    : (position === 'single' ? '시작·종료' : '시작');

                wrapper.append(icon, title, label);
                return { domNodes: [wrapper] };
            }

            if (String(boundaryProps.calendarV2Kind || '').toUpperCase() === 'PHASE_BOUNDARY') {
                const wrapper = document.createElement('div');
                wrapper.className = 'moyo-cal2-phase-boundary-content';

                const marker = document.createElement('span');
                marker.className = 'moyo-cal2-phase-boundary-marker';
                marker.setAttribute('aria-hidden', 'true');

                const title = document.createElement('span');
                title.className = 'moyo-cal2-phase-boundary-title';
                title.textContent = info.event.title || '기간별 계획';

                wrapper.append(marker, title);
                return { domNodes: [wrapper] };
            }

            const props = info.event.extendedProps || {};
            if (String(props.calendarV2Kind || '').toUpperCase() === 'PROJECT_PERIOD') return { domNodes: [] };
            return scheduleEventContent(info);
        },
        eventDidMount(info) {
            applyCalendarEventVisual(info);
            const props = info.event.extendedProps || {};
            const actionable = !['HOLIDAY', 'BIRTHDAY'].includes(String(props.displayType || '').toUpperCase())
                && !['PROJECT_PERIOD', 'PROJECT_PERIOD_BOUNDARY', 'PROJECT_PERIOD_MARKER', 'BIRTHDAY'].includes(String(props.calendarV2Kind || '').toUpperCase());
            if (!actionable || !info.el) return;

            info.el.setAttribute('role', 'button');
            info.el.setAttribute('tabindex', '0');
            info.el.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                activateCalendarEvent(info.event);
            });
        },
        eventClick(info) {
            info.jsEvent?.preventDefault?.();
            activateCalendarEvent(info.event);
        }
    });

    function canCreateScheduleInCurrentScope() {
        if (state.scope === 'FRIEND') return false;

        if (calendarContext === 'PROJECT') {
            return ['ALL', 'EVENT'].includes(state.scope) && Boolean(contextProjId);
        }

        if (calendarContext === 'GROUP') {
            if (!contextWsId) return false;
            if (['ALL', 'WS'].includes(state.scope)) return true;
            if (state.scope === 'PROJ') return Boolean(state.projId);
            return false;
        }

        if (state.scope === 'PROJ') return Boolean(state.projId);
        return ['ALL', 'PRIVATE'].includes(state.scope);
    }

    function updateCreateAvailability() {
        if (!createButton) return;
        const available = canCreateScheduleInCurrentScope();

        // 친구 범위는 완전한 조회 전용이라 CTA 자체를 노출하지 않는다.
        createButton.hidden = state.scope === 'FRIEND'
            || (calendarContext === 'PROJECT' && ['TASK', 'PLAN'].includes(state.scope));
        createButton.disabled = !available;
        createButton.setAttribute('aria-disabled', available ? 'false' : 'true');

        if (state.scope === 'PROJ' && !state.projId) {
            createButton.title = '프로젝트를 먼저 선택해 주세요.';
        } else {
            createButton.removeAttribute('title');
        }
    }

    function scheduleCreateScope() {
        if (!canCreateScheduleInCurrentScope()) return null;

        if (calendarContext === 'PROJECT') {
            return {
                scopeType: 'PROJ',
                wsId: effectiveProjectWsId(),
                projId: contextProjId
            };
        }

        if (calendarContext === 'GROUP') {
            if (['ALL', 'WS'].includes(state.scope)) {
                return { scopeType: 'WS', wsId: contextWsId, projId: null };
            }
            if (state.scope === 'PROJ') {
                return { scopeType: 'PROJ', wsId: contextWsId, projId: state.projId };
            }
        }

        if (state.scope === 'WS') return { scopeType: 'WS', wsId: state.wsId, projId: null };
        if (state.scope === 'PROJ') return { scopeType: 'PROJ', wsId: state.wsId || null, projId: state.projId };
        return { scopeType: 'PRIVATE', wsId: null, projId: null };
    }

    function openScheduleCreate() {
        if (!canCreateScheduleInCurrentScope()) return;
        if (!window.MoyoCalendarV2Bridge || typeof window.MoyoCalendarV2Bridge.createSchedule !== 'function') return;
        const scope = scheduleCreateScope();
        if (!scope) return;
        const date = state.selectedDate || state.viewDate || toDateOnly(new Date());
        runInteractionOnce(`create-schedule:${scope.scopeType}:${scope.wsId || ''}:${scope.projId || ''}:${date}`, () => {
            window.MoyoCalendarV2Bridge.createSchedule({
                ...scope,
                date
            });
        }, 500);
    }

    if (createButton) {
        createButton.addEventListener('click', openScheduleCreate);
    }

    dayCategoryTabs?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-day-category]');
        if (!button || !dayCategoryTabs.contains(button)) return;
        selectedDayCategory = String(button.dataset.dayCategory || 'ALL').toUpperCase();
        renderSelectedDayPanel();
    });

    if (searchPanel && searchInput) {
        searchInput.addEventListener('focus', () => {
            openSearchPanel({ focus: false });
        });
        searchInput.addEventListener('input', () => {
            setSearchState({ query: searchInput.value, open: true });
            searchPanel.hidden = false;
            searchInput.setAttribute('aria-expanded', 'true');
            scheduleSearchResultsRender();
        });
        searchClearButton?.addEventListener('click', clearSearchQuery);

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || !state.search.open) return;
            event.preventDefault();
            closeSearchPanel({ keepQuery: true, restoreFocus: true });
        });

        document.addEventListener('pointerdown', (event) => {
            if (!state.search.open) return;
            const target = event.target;
            const searchWrap = searchInput.closest('.moyo-cal2-search-wrap');
            if (searchWrap && searchWrap.contains(target)) return;
            closeSearchPanel({ keepQuery: true, restoreFocus: false });
        });
    }

    calendar.render();
    renderCalendarExceptionState();
    updateMonthLabel(calendar.getDate());
    syncSelectedDateQuery(state.selectedDate);
    window.requestAnimationFrame(() => {
        syncSelectedDayVisual();
        syncProjectPeriodDayVisual();
        renderSelectedDayPanel();
        renderMonthOverview();
    });

    // 폭 breakpoint가 바뀔 때만 표시 row 수를 갱신한다.
    // 셀/행의 실제 높이는 건드리지 않으므로 legacy stabilize 로직과 무관하다.
    let densityRows = getCalendarContentDensityRows();
    const syncCalendarDensity = () => {
        const nextRows = getCalendarContentDensityRows();
        if (nextRows === densityRows) return;
        densityRows = nextRows;
        calendar.setOption('dayMaxEventRows', nextRows);
    };

    let densityResizeObserver = null;
    if ('ResizeObserver' in window) {
        densityResizeObserver = new ResizeObserver(syncCalendarDensity);
        densityResizeObserver.observe(root);
    } else {
        window.addEventListener('resize', syncCalendarDensity, { passive: true });
    }

    calendarRetryButton?.addEventListener('click', () => {
        monthlyStore.error = null;
        projectPlanStore.error = null;
        invalidateCalendarData();
        renderCalendarExceptionState();
        calendar.refetchEvents();
    });

    prevButton?.addEventListener('click', () => calendar.prev());
    nextButton?.addEventListener('click', () => calendar.next());
    todayButton?.addEventListener('click', () => calendar.today());

    // 브라우저 뒤로가기로 bfcache에서 복원되면 이전 월 데이터가 그대로 남을 수 있다.
    // 기존 달력과 동일하게 서버 기준으로 한 번 새로 맞추되, 일반 최초 진입에는 영향 주지 않는다.
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        invalidateCalendarData();
        calendar.refetchEvents();
    });

    scopeTabs.forEach((button) => {
        button.addEventListener('click', () => applyScope(String(button.dataset.cal2Scope || '').toUpperCase()));
    });
    moyoOnlyButton?.addEventListener('click', () => {
        if (calendarContext !== 'PERSONAL') return;
        setState({ moyoPublicVisible: !state.moyoPublicVisible }, { reason: 'filter:moyo-public-visibility' });
        renderScopeNavigation();
        renderSelectedDayPanel();
        syncScopeQuery();
        window.MoyoCalendarV2?.refresh();
    });
    secondaryFilters?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter-key][data-filter-value]');
        if (!button || !secondaryFilters.contains(button)) return;
        const key = button.dataset.filterKey;
        const value = button.dataset.filterValue;
        if (!key || !Object.prototype.hasOwnProperty.call(state, key)) return;
        const patch = { [key]: key === 'projId' ? (value || null) : value };
        if (key === 'projId' && calendarContext === 'GROUP') patch.projectScope = 'GROUP';
        if (key === 'projId' && calendarContext === 'PERSONAL') {
            if (!value) {
                patch.projectScope = null;
                patch.wsId = null;
            } else {
                const selected = mapProjectsForSelector().find((project) => String(project.id || '') === String(value));
                patch.projectScope = selected?.projectScope || null;
                patch.wsId = selected?.wsId || null;
            }
        }
        setState(patch, { reason: `secondary-filter:${key}` });
        renderSecondaryFilters();
        syncScopeQuery();
        window.MoyoCalendarV2?.refresh();
    });
    scopeTargetButton?.addEventListener('click', openScopeTargetSelector);
    projectContextChangeButton?.addEventListener('click', openScopeTargetSelector);

    // URL에 대상이 없거나 오래된 범위가 섞여 있어도 현재 공간 구조를 우선한다.
    if (calendarContext === 'GROUP') {
        setState({
            wsId: contextWsId,
            projectScope: state.scope === 'PROJ' ? 'GROUP' : null
        }, { reason: 'calendar-context:init', notify: false });
    } else if (calendarContext === 'PROJECT') {
        setState({
            wsId: contextWsId,
            projId: contextProjId,
            projectScope: initialProjectScope || (contextWsId ? 'GROUP' : 'PERSONAL')
        }, { reason: 'calendar-context:init', notify: false });
    } else if (state.scope === 'PROJ') {
        setState({ projectScope: 'PERSONAL', wsId: null }, { reason: 'calendar-context:init', notify: false });
    }

    renderScopeNavigation();
    renderProjectContext();
    // 직접 URL 진입에서도 오래된 다른 scope 파라미터를 정리하고 현재 상태만 URL에 유지한다.
    syncScopeQuery();
    if (['PERSONAL', 'GROUP', 'PROJECT'].includes(calendarContext)) {
        ensureScopeOptions().then(renderMonthOverview);
    }

    const api = {
        version: 2,
        root,
        calendar,
        get state() {
            return snapshotState();
        },
        getState() {
            return snapshotState();
        },
        subscribe(subscriber) {
            return subscribeState(subscriber);
        },
        refresh() {
            invalidateCalendarData();
            calendar.refetchEvents();
        },
        goToDate(date) {
            if (!date) return;
            calendar.gotoDate(date);
        },
        selectDate(date) {
            return selectCalendarDate(date, { reason: 'calendar:selected-date:api' });
        },
        getViewDate() {
            return toDateOnly(calendar.getDate());
        },
        getScopeSelection() {
            return { ...currentScopeSelection() };
        },
        getMonthlyData() {
            return monthlyStoreSnapshot();
        },
        getMonthlyRequestTypes() {
            return [...getMonthlyRequestTypes()];
        },
        getProjectPlanData() {
            return projectPlanStoreSnapshot();
        },
        getActiveProjectPeriod() {
            return { ...projectPeriodStore };
        },
        reloadMonthData() {
            invalidateCalendarData();
            calendar.refetchEvents();
        },
        setScope(scope) {
            applyScope(String(scope || '').toUpperCase());
        },
        openScopeSelector() {
            return openScopeTargetSelector();
        },
        setSearchState(patch) {
            const next = patch && typeof patch === 'object' ? patch : {};
            setSearchState(next);
            if (Object.prototype.hasOwnProperty.call(next, 'query') && searchInput) {
                searchInput.value = String(next.query || '');
                scheduleSearchResultsRender();
            }
            if (next.open === true) openSearchPanel();
            if (next.open === false) closeSearchPanel({ keepQuery: true, restoreFocus: false });
        },
        openSearch() {
            openSearchPanel();
        },
        closeSearch() {
            closeSearchPanel({ keepQuery: true, restoreFocus: false });
        },
        setLoading(key, value) {
            setLoading(key, value);
        },
        markModalRefresh(source) {
            markModalRefresh(source);
        },
        consumeModalRefresh() {
            return consumeModalRefresh();
        }
    };

    window.MoyoCalendarV2 = api;

    if (window.MoyoCalendarV2Bridge && typeof window.MoyoCalendarV2Bridge.configure === 'function') {
        window.MoyoCalendarV2Bridge.configure({
            contextPath: window.MOYO_CALENDAR_CONTEXT_PATH || '',
            refreshCalendar: () => api.refresh()
        });
    }

    // 기존 /calendar?viewEventId=... / editEventId=... 외부 링크 contract 호환.
    // V2 초기 렌더와 bridge 설정이 모두 끝난 다음 기존 공통 모달을 연다.
    window.requestAnimationFrame(openInitialDeepLink);
})();
