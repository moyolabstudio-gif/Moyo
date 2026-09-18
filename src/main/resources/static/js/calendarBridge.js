/**
 * MOYO Calendar V2 Bridge
 * --------------------------------------------------------------------------
 * V2 본체와 기존 공통 일정/업무/계획/대상선택 모달 사이의 연결 전용 파일.
 *
 * 원칙
 * - V2 본체는 기존 모달 구현 세부사항을 알지 않는다.
 * - 기존 calendar.js / calendar.css에는 의존하지 않는다.
 * - 모달 내부 DOM/저장 로직은 수정하지 않는다.
 * - 일정은 기존 onSaved/onDeleted callback으로 갱신한다.
 * - 업무/계획은 기존 모달을 건드리지 않기 위해 닫힘을 감지해 갱신한다.
 */
(function (global, document) {
    'use strict';

    var configuredRefresh = function () {};
    var contextPathOverride = '';

    function noop() {}

    function contextPath() {
        var configured = String(contextPathOverride || '').trim();
        if (configured) return configured.replace(/\/$/, '');

        var globalPath = String(global.MOYO_CALENDAR_CONTEXT_PATH || '').trim();
        if (globalPath) return globalPath.replace(/\/$/, '');

        var bodyPath = String(document.body && document.body.dataset.contextPath || '').trim();
        return bodyPath.replace(/\/$/, '');
    }

    function refresh() {
        try {
            configuredRefresh();
        } catch (error) {
            console.error('[Calendar V2 Bridge] refresh 실패:', error);
        }
    }

    function configure(options) {
        options = options || {};
        configuredRefresh = typeof options.refreshCalendar === 'function'
            ? options.refreshCalendar
            : noop;
        if (options.contextPath != null) {
            contextPathOverride = String(options.contextPath || '');
        }
    }

    function requireApi(api, method, message) {
        if (!api || typeof api[method] !== 'function') {
            throw new Error(message);
        }
        return api;
    }

    function normalizeDateOnly(value) {
        return String(value == null ? '' : value).substring(0, 10);
    }

    function normalizeTimeOnly(value) {
        return String(value == null ? '' : value).substring(0, 5);
    }

    function firstValue(source, keys, fallback) {
        source = source || {};
        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            if (Object.prototype.hasOwnProperty.call(source, key)
                && source[key] !== undefined
                && source[key] !== null
                && source[key] !== '') {
                return source[key];
            }
        }
        return fallback;
    }

    function applyProjectContext(projectContext) {
        var source = projectContext || {};
        var config = global.PROJECT_MAIN_CONFIG || (global.PROJECT_MAIN_CONFIG = {});

        var projectId = firstValue(source, ['projectId', 'projId', 'PROJECT_ID', 'PROJ_ID'], config.projectId || config.paramProjId || '');
        var wsId = firstValue(source, ['wsId', 'workspaceId', 'WS_ID', 'WORKSPACE_ID'], config.wsId || config.paramWsId || '');
        var projectScope = String(firstValue(
            source,
            ['projectScope', 'PROJECT_SCOPE'],
            wsId ? 'GROUP' : (config.projectScope || 'PERSONAL')
        ) || 'PERSONAL').toUpperCase();

        config.contextPath = contextPath() || config.contextPath || '';
        // 프로젝트 공통 모달이 달력에서 호출된 경우 프로젝트 메인 화면용
        // 후처리(칸반/간트/주간표 재렌더)를 타지 않도록 호출 호스트를 표시한다.
        config.hostContext = 'CALENDAR_V2';
        config.loginUserId = firstValue(
            source,
            ['loginUserId', 'userId', 'LOGIN_USER_ID', 'USER_ID'],
            global.MOYO_CALENDAR_SESSION_USER_ID || config.loginUserId || ''
        );
        config.projectId = projectId || '';
        config.paramProjId = projectId || '';
        config.projectName = String(firstValue(source, ['projectName', 'projName', 'PROJECT_NAME', 'PROJ_NAME'], config.projectName || '') || '');
        config.wsId = wsId || '';
        config.paramWsId = wsId || '';
        config.workspaceName = String(firstValue(source, ['workspaceName', 'wsName', 'WORKSPACE_NAME', 'WS_NAME'], config.workspaceName || '') || '');
        config.projectScope = projectScope;
        config.isPersonalProject = projectScope === 'PERSONAL';
        config.groupProject = projectScope !== 'PERSONAL';

        var canManageTasks = firstValue(source, ['canManageTasks', 'CAN_MANAGE_TASKS'], undefined);
        var canManageProject = firstValue(source, ['canManageProject', 'CAN_MANAGE_PROJECT'], undefined);
        var projectStartDate = firstValue(source, ['projectStartDate', 'startDate', 'PROJECT_START_DATE', 'START_DATE'], undefined);
        var projectEndDate = firstValue(source, ['projectEndDate', 'endDate', 'PROJECT_END_DATE', 'END_DATE'], undefined);

        if (canManageTasks !== undefined) config.canManageTasks = !!canManageTasks;
        if (canManageProject !== undefined) config.canManageProject = !!canManageProject;
        if (projectStartDate !== undefined) config.projectStartDate = normalizeDateOnly(projectStartDate);
        if (projectEndDate !== undefined) config.projectEndDate = normalizeDateOnly(projectEndDate);

        return config;
    }

    function createSchedule(options) {
        options = options || {};
        try {
            var quick = requireApi(
                global.MoyoQuickCalendarCreate,
                'open',
                '일정 등록 모달을 불러오지 못했습니다.'
            );

            var userOnSaved = options.onSaved;
            var modalOptions = Object.assign({}, options, {
                scopeType: String(options.scopeType || options.scope || 'PRIVATE').toUpperCase(),
                date: options.date || options.startDate,
                onSaved: function (data) {
                    if (typeof userOnSaved === 'function') userOnSaved(data);
                    refresh();
                }
            });

            delete modalOptions.scope;
            quick.open(modalOptions);
            return true;
        } catch (error) {
            console.error('[Calendar V2 Bridge] 일정 등록 열기 실패:', error);
            alert(error.message || '일정 등록 모달을 열지 못했습니다.');
            return false;
        }
    }

    function editSchedule(eventId, options) {
        options = options || {};
        if (!eventId) return Promise.resolve(null);

        try {
            var quick = requireApi(
                global.MoyoQuickCalendarCreate,
                'openEdit',
                '일정 수정 모달을 불러오지 못했습니다.'
            );
            var userOnSaved = options.onSaved;
            return Promise.resolve(quick.openEdit(eventId, Object.assign({}, options, {
                onSaved: function (data) {
                    if (typeof userOnSaved === 'function') userOnSaved(data);
                    refresh();
                }
            }))).catch(function (error) {
                console.error('[Calendar V2 Bridge] 일정 수정 열기 실패:', error);
                alert(error.message || '일정 수정 모달을 열지 못했습니다.');
                return null;
            });
        } catch (error) {
            console.error('[Calendar V2 Bridge] 일정 수정 열기 실패:', error);
            alert(error.message || '일정 수정 모달을 열지 못했습니다.');
            return Promise.resolve(null);
        }
    }

    function openSchedule(eventId, options) {
        options = options || {};
        if (!eventId) return Promise.resolve(null);

        try {
            var preview = requireApi(
                global.MoyoCalendarEventPreview,
                'open',
                '일정 상세 모달을 불러오지 못했습니다.'
            );
            var userOnEdit = options.onEdit;
            var userOnDeleted = options.onDeleted;

            return Promise.resolve(preview.open(eventId, Object.assign({}, options, {
                source: options.source || 'calendar-v2',
                showActions: options.showActions !== false,
                onEdit: function (targetEventId) {
                    // 상세 모달 위에 수정 모달이 겹치지 않도록 먼저 상세를 닫는다.
                    // 모달 내부 구현은 건드리지 않고 bridge에서 전환만 책임진다.
                    if (global.MoyoCalendarEventPreview
                        && typeof global.MoyoCalendarEventPreview.close === 'function') {
                        global.MoyoCalendarEventPreview.close();
                    }
                    if (typeof userOnEdit === 'function') {
                        userOnEdit(targetEventId);
                        return;
                    }
                    editSchedule(targetEventId, {
                        occurrenceDate: options.occurrenceDate
                    });
                },
                onDeleted: function () {
                    if (typeof userOnDeleted === 'function') userOnDeleted();
                    refresh();
                }
            })));
        } catch (error) {
            console.error('[Calendar V2 Bridge] 일정 상세 열기 실패:', error);
            alert(error.message || '일정 상세 모달을 열지 못했습니다.');
            return Promise.resolve(null);
        }
    }

    function openScopeSelector(options) {
        options = options || {};
        try {
            var selector = requireApi(
                global.MoyoScopeSelector,
                'open',
                '대상 선택 모달을 불러오지 못했습니다.'
            );
            selector.open(options);
            return true;
        } catch (error) {
            console.error('[Calendar V2 Bridge] 대상 선택 열기 실패:', error);
            alert(error.message || '대상 선택 모달을 열지 못했습니다.');
            return false;
        }
    }

    function observeTaskModalClose(onClose) {
        var modal = document.getElementById('projectTaskModal');
        if (!modal || typeof MutationObserver === 'undefined') return noop;

        var wasOpen = modal.classList.contains('is-open') || modal.getAttribute('aria-hidden') === 'false';
        var hasOpened = wasOpen;
        var stopped = false;
        var timeoutId = null;

        function stop() {
            if (stopped) return;
            stopped = true;
            observer.disconnect();
            if (timeoutId) global.clearTimeout(timeoutId);
        }

        var observer = new MutationObserver(function () {
            var isOpen = modal.classList.contains('is-open') || modal.getAttribute('aria-hidden') === 'false';
            if (isOpen) hasOpened = true;
            if (hasOpened && wasOpen && !isOpen) {
                stop();
                onClose();
                return;
            }
            wasOpen = isOpen;
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });

        // 상세 API가 실패하면 기존 openProjectTaskDetail이 오류를 내부 처리하고 resolve할 수 있다.
        // 그 경우 observer가 다음 업무 모달까지 살아남지 않도록 자동 정리한다.
        timeoutId = global.setTimeout(stop, 30000);
        return stop;
    }

    function openTask(taskId, projectContext, options) {
        options = options || {};
        if (!taskId) return Promise.resolve(null);
        applyProjectContext(projectContext);

        if (typeof global.openProjectTaskDetail !== 'function') {
            alert('업무 상세 모달을 불러오지 못했습니다.');
            return Promise.resolve(null);
        }

        var stopObserver = noop;
        try {
            var result = global.openProjectTaskDetail(taskId);
            // openProjectTaskDetail은 비동기 상세 조회 후 모달을 연다.
            // 모달이 실제 열린 뒤 observer가 시작되도록 한 tick 뒤 연결한다.
            global.setTimeout(function () {
                stopObserver();
                stopObserver = observeTaskModalClose(function () {
                    if (typeof options.onClosed === 'function') options.onClosed();
                    refresh();
                });
            }, 0);
            return Promise.resolve(result).catch(function (error) {
                stopObserver();
                console.error('[Calendar V2 Bridge] 업무 상세 열기 실패:', error);
                alert(error.message || '업무 상세를 열지 못했습니다.');
                return null;
            });
        } catch (error) {
            stopObserver();
            console.error('[Calendar V2 Bridge] 업무 상세 열기 실패:', error);
            alert(error.message || '업무 상세를 열지 못했습니다.');
            return Promise.resolve(null);
        }
    }

    function normalizePlanKind(value) {
        var kind = String(value || '').toUpperCase();
        if (kind === 'PERIOD_PLAN' || kind === 'PERIOD' || kind === 'PHASE') return 'PHASE';
        if (kind === 'WEEKLY' || kind === 'WEEKLY_PLAN') return 'WEEKLY_PLAN';
        if (kind === 'TIME' || kind === 'TIME_PLAN') return 'TIME_PLAN';
        return kind;
    }

    function normalizeIdArray(value) {
        if (Array.isArray(value)) {
            return value.map(Number).filter(function (id) { return Number.isFinite(id) && id > 0; });
        }
        if (value == null || value === '') return [];
        return String(value).split(',').map(function (id) { return Number(String(id).trim()); })
            .filter(function (id) { return Number.isFinite(id) && id > 0; });
    }

    function mergePlanMetadata(item, normalized) {
        var source = item || {};
        var result = Object.assign({}, source, normalized || {});
        result.createdBy = firstValue(source, ['createdBy', 'CREATED_BY', 'creatorUserId', 'CREATOR_USER_ID'], result.createdBy || null);
        result.editorUserIds = normalizeIdArray(firstValue(source, ['editorUserIds', 'EDITOR_USER_IDS'], result.editorUserIds || []));
        return result;
    }

    function normalizePlanForModal(kind, raw, id) {
        var item = raw || {};
        if (kind === 'PHASE') {
            return mergePlanMetadata(item, {
                entityId: Number(firstValue(item, ['entityId', 'PERIOD_PLAN_ID', 'periodPlanId'], id)),
                title: firstValue(item, ['title', 'TITLE'], ''),
                description: firstValue(item, ['description', 'DESCRIPTION'], ''),
                color: firstValue(item, ['color', 'COLOR'], '#4A90E2'),
                startDate: normalizeDateOnly(firstValue(item, ['startDate', 'START_DATE'], '')),
                endDate: normalizeDateOnly(firstValue(item, ['endDate', 'END_DATE', 'startDate', 'START_DATE'], '')),
                recordEnabledYn: String(firstValue(item, ['recordEnabledYn', 'RECORD_ENABLED_YN'], 'N')).toUpperCase(),
                recordVisibility: String(firstValue(item, ['recordVisibility', 'RECORD_VISIBILITY'], 'PROJECT')).toUpperCase()
            });
        }

        if (kind === 'WEEKLY_PLAN') {
            var weeklyId = Number(firstValue(item, ['weeklyPlanId', 'WEEKLY_PLAN_ID', 'entityId'], id));
            return mergePlanMetadata(item, {
                weeklyPlanId: weeklyId,
                entityId: weeklyId,
                title: firstValue(item, ['title', 'TITLE'], ''),
                description: firstValue(item, ['description', 'DESCRIPTION'], ''),
                dayOfWeek: Number(firstValue(item, ['dayOfWeek', 'DAY_OF_WEEK'], 1)),
                startTime: normalizeTimeOnly(firstValue(item, ['startTime', 'START_TIME'], '')),
                endTime: normalizeTimeOnly(firstValue(item, ['endTime', 'END_TIME'], '')),
                repeatStartDate: normalizeDateOnly(firstValue(item, ['repeatStartDate', 'REPEAT_START_DATE'], '')),
                repeatEndDate: normalizeDateOnly(firstValue(item, ['repeatEndDate', 'REPEAT_END_DATE'], '')),
                color: firstValue(item, ['color', 'COLOR'], '#7c5cff'),
                activeYn: String(firstValue(item, ['activeYn', 'ACTIVE_YN'], 'Y')).toUpperCase(),
                recordEnabledYn: String(firstValue(item, ['recordEnabledYn', 'RECORD_ENABLED_YN'], 'N')).toUpperCase(),
                recordVisibility: String(firstValue(item, ['recordVisibility', 'RECORD_VISIBILITY'], 'PROJECT')).toUpperCase()
            });
        }

        return mergePlanMetadata(item, {
            entityId: Number(firstValue(item, ['timePlanId', 'TIME_PLAN_ID', 'entityId'], id)),
            title: firstValue(item, ['title', 'TITLE'], ''),
            description: firstValue(item, ['description', 'DESCRIPTION'], ''),
            startDate: normalizeDateOnly(firstValue(item, ['startDate', 'START_DATE', 'planDate', 'PLAN_DATE'], '')),
            endDate: normalizeDateOnly(firstValue(item, ['endDate', 'END_DATE', 'startDate', 'START_DATE', 'planDate', 'PLAN_DATE'], '')),
            startTime: normalizeTimeOnly(firstValue(item, ['startTime', 'START_TIME'], '')),
            endTime: normalizeTimeOnly(firstValue(item, ['endTime', 'END_TIME'], '')),
            color: firstValue(item, ['color', 'COLOR'], '#4A90E2'),
            recordEnabledYn: String(firstValue(item, ['recordEnabledYn', 'RECORD_ENABLED_YN'], 'N')).toUpperCase(),
            recordVisibility: String(firstValue(item, ['recordVisibility', 'RECORD_VISIBILITY'], 'PROJECT')).toUpperCase()
        });
    }

    function planEndpoint(kind, id) {
        var base = contextPath();
        if (kind === 'PHASE') return base + '/project/api/period-plans/' + encodeURIComponent(id);
        if (kind === 'WEEKLY_PLAN') return base + '/project/api/weekly-plans/' + encodeURIComponent(id);
        return base + '/project/api/time-plans/' + encodeURIComponent(id);
    }

    function observePlanModalClose(onClose) {
        var modal = document.getElementById('ganttPlanCreateModal');
        if (!modal || typeof MutationObserver === 'undefined' || modal.hidden) return noop;

        var wasOpen = true;
        var stopped = false;
        var observer = new MutationObserver(function () {
            var isOpen = !modal.hidden;
            if (wasOpen && !isOpen) {
                stop();
                onClose();
                return;
            }
            wasOpen = isOpen;
        });

        function stop() {
            if (stopped) return;
            stopped = true;
            observer.disconnect();
        }

        observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
        return stop;
    }

    async function openPlan(plan, projectContext, options) {
        plan = plan || {};
        options = options || {};

        var kind = normalizePlanKind(firstValue(plan, ['kind', 'type', 'displayType', 'TYPE'], ''));
        var entityId = firstValue(plan, [
            'entityId', 'id', 'periodPlanId', 'weeklyPlanId', 'timePlanId',
            'ENTITY_ID', 'PERIOD_PLAN_ID', 'WEEKLY_PLAN_ID', 'TIME_PLAN_ID'
        ], '');

        if (!entityId || ['PHASE', 'WEEKLY_PLAN', 'TIME_PLAN'].indexOf(kind) < 0) {
            alert('계획 정보를 확인할 수 없습니다.');
            return null;
        }

        applyProjectContext(projectContext || plan);

        try {
            var loader = requireApi(
                global.MoyoProjectPlanLoader,
                'load',
                '계획 모달 로더를 불러오지 못했습니다.'
            );
            await loader.load();

            var response = await fetch(planEndpoint(kind, entityId), {
                credentials: 'include',
                cache: 'no-store'
            });
            var payload = await response.json().catch(function () { return {}; });
            if (!response.ok || payload.success === false) {
                throw new Error(payload.message || '계획 정보를 불러오지 못했습니다.');
            }

            if (typeof global.openProjectPlanSharedModal !== 'function') {
                throw new Error('계획 상세 모달을 불러오지 못했습니다.');
            }

            var item = normalizePlanForModal(kind, payload.data || payload.DATA || payload, entityId);
            var modalOptions;
            if (kind === 'PHASE') {
                modalOptions = {
                    mode: 'PERIOD_PLAN',
                    startDate: item.startDate,
                    endDate: item.endDate || item.startDate,
                    item: item
                };
            } else if (kind === 'WEEKLY_PLAN') {
                modalOptions = {
                    mode: 'WEEKLY_PLAN',
                    weeklyPlanId: item.weeklyPlanId,
                    item: item,
                    dayOfWeek: item.dayOfWeek,
                    startTime: item.startTime,
                    endTime: item.endTime
                };
            } else {
                modalOptions = {
                    mode: 'TIME_PLAN',
                    timePlanId: item.entityId,
                    startDate: item.startDate,
                    endDate: item.endDate || item.startDate,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    item: item
                };
            }

            global.openProjectPlanSharedModal(modalOptions);

            // 기존 계획 모달은 저장 callback을 외부에 제공하지 않으므로
            // 모달 닫힘을 V2의 갱신 시점으로 사용한다.
            global.setTimeout(function () {
                observePlanModalClose(function () {
                    if (typeof options.onClosed === 'function') options.onClosed();
                    refresh();
                });
            }, 0);

            return item;
        } catch (error) {
            console.error('[Calendar V2 Bridge] 계획 상세 열기 실패:', error);
            alert(error.message || '계획 상세를 열지 못했습니다.');
            return null;
        }
    }

    global.MoyoCalendarV2Bridge = Object.freeze({
        configure: configure,
        refresh: refresh,
        createSchedule: createSchedule,
        openSchedule: openSchedule,
        editSchedule: editSchedule,
        openTask: openTask,
        openPlan: openPlan,
        openScopeSelector: openScopeSelector,
        applyProjectContext: applyProjectContext
    });
})(window, document);
