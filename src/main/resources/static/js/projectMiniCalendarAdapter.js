(function (global) {
    'use strict';

    var currentMonth = new Date();
    var scheduleItems = [];
    var state = 'ready';
    var calendarMeta = { projectPeriodVisible: null };
    var reloadSequence = 0;
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    function config() {
        return global.PROJECT_MAIN_CONFIG || {};
    }

    function splitDateTime(value) {
        var text = String(value || '').trim();
        if (!text) return { date: '', time: '' };
        var match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/);
        return match ? { date: match[1], time: match[2] || '' } : { date: text, time: '' };
    }

    function normalizeSchedules() {
        var source = Array.isArray(scheduleItems) ? scheduleItems : [];
        return source.map(function (item) {
            var rawType = String(item.type || item.TYPE || '').toUpperCase();
            var start = splitDateTime(item.start || item.START || item.startDate || item.START_DATE);
            var end = splitDateTime(item.end || item.END || item.endDate || item.END_DATE || start.date);
            var type = 'project';

            if (rawType === 'PHASE' || rawType === 'PROJECT_PERIOD') type = 'project-period';
            else if (rawType === 'TIME_PLAN') type = 'time-plan';
            else if (rawType === 'WEEKLY_PLAN') type = 'weekly-plan';
            else if (rawType === 'TASK') type = 'project-task';

            return {
                id: item.entityId || item.ENTITY_ID || item.id || '',
                type: type,
                title: item.title || item.TITLE || '프로젝트 일정',
                startDate: start.date,
                endDate: end.date || start.date,
                startTime: start.time || item.startTime || item.START_TIME || '',
                endTime: end.time || item.endTime || item.END_TIME || '',
                allDay: item.allDay === true || item.ALL_DAY === true || String(item.allDay || item.ALL_DAY_YN || '').toUpperCase() === 'Y',
                color: String(item.color || item.COLOR || '#7a5cff').trim(),
                description: item.description || item.DESCRIPTION || '',
                recurring: item.recurring === true,
                original: item
            };
        }).filter(function (item) {
            // 프로젝트 메인 미니 달력에서는 업무 자체는 제외하고 일정과 세 계획 유형만 표시한다.
            return item.type !== 'project-task' && item.startDate;
        });
    }

    function render() {
        if (!global.MoyoMiniCalendar) return;
        var cfg = config();
        global.MoyoMiniCalendar.render({
            grid: 'projectCalendarGrid',
            title: 'projectCalendarTitle',
            currentDate: currentMonth,
            range: calendarMeta.projectPeriodVisible === true
                ? {startDate: cfg.projectStartDate, endDate: cfg.projectEndDate}
                : null,
            items: normalizeSchedules(),
            state: state,
            errorMessage: '일정을 불러오지 못했습니다.',
            onItemClick: function (item) {
                if (!item || !item.id) return;

                if (item.type === 'project') {
                    if (!global.MoyoCalendarEventPreview || typeof global.MoyoCalendarEventPreview.open !== 'function') {
                        console.error('[프로젝트 미니 달력] 공통 일정 상세 모달을 찾을 수 없습니다.');
                        return;
                    }
                    global.MoyoCalendarEventPreview.open(item.id, {
                        source: 'PROJECT_MAIN',
                        onSaved: reload,
                        onDeleted: reload
                    });
                    return;
                }

                if (item.type === 'time-plan' && typeof global.openTimeSchedulePlanEditor === 'function') {
                    if (typeof global.selectProjectPlanTab === 'function') global.selectProjectPlanTab('TIME_SCHEDULE');
                    global.openTimeSchedulePlanEditor(Number(item.id));
                    return;
                }

                if (item.type === 'weekly-plan' && typeof global.openWeeklyPlanEditor === 'function') {
                    if (typeof global.selectProjectPlanTab === 'function') global.selectProjectPlanTab('WEEKLY');
                    global.openWeeklyPlanEditor(Number(item.id));
                    return;
                }

                if (item.type === 'project-period' && typeof global.selectProjectPlanTab === 'function') {
                    global.selectProjectPlanTab('GANTT');
                }
            }
        });
    }

    async function reload() {
        var cfg = config();
        var projectId = cfg.projectId || cfg.paramProjId || '';
        if (!projectId) {
            scheduleItems = [];
            state = 'ready';
            render();
            return [];
        }

        state = 'loading';
        var requestSequence = ++reloadSequence;
        var requestMonthKey = currentMonth.getFullYear() + '-' + currentMonth.getMonth();
        render();

        var year = currentMonth.getFullYear();
        var month = currentMonth.getMonth();
        var startDate = formatLocalDate(new Date(year, month, 1));
        var endDate = formatLocalDate(new Date(year, month + 1, 0));
        var params = new URLSearchParams({
            projId: String(projectId),
            startDate: startDate,
            endDate: endDate
        });

        try {
            var contextPath = cfg.contextPath || '';
            var response = await fetch(
                contextPath + '/project/api/calendar-items?' + params.toString(),
                {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                }
            );

            if (!response.ok) {
                throw new Error('프로젝트 미니 달력 조회 실패: ' + response.status);
            }

            var body = await response.json();
            var data = body && body.data ? body.data : body;
            var items = data && Array.isArray(data.items) ? data.items : [];
            if (!Array.isArray(items)) {
                throw new Error('프로젝트 미니 달력 응답 형식이 올바르지 않습니다.');
            }

            if (requestSequence !== reloadSequence
                || requestMonthKey !== (currentMonth.getFullYear() + '-' + currentMonth.getMonth())) {
                return items;
            }

            scheduleItems = items;
            calendarMeta.projectPeriodVisible = data && typeof data.projectPeriodVisible === 'boolean'
                ? data.projectPeriodVisible
                : true;
            state = 'ready';
            render();
            return items;
        } catch (error) {
            if (requestSequence !== reloadSequence
                || requestMonthKey !== (currentMonth.getFullYear() + '-' + currentMonth.getMonth())) {
                return [];
            }
            scheduleItems = [];
            calendarMeta.projectPeriodVisible = null;
            state = 'error';
            render();
            return [];
        }
    }

    function formatLocalDate(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function openProjectQuickCreate() {
        var cfg = config();
        if (!global.MoyoQuickCalendarCreate || typeof global.MoyoQuickCalendarCreate.open !== 'function') return;

        var grid = document.getElementById('projectCalendarGrid');
        var calendarRoot = grid ? grid.closest('.moyo-mini-calendar') : null;
        var selectedDate = calendarRoot && calendarRoot.dataset.selectedDate
            ? calendarRoot.dataset.selectedDate
            : formatLocalDate(new Date());

        global.MoyoQuickCalendarCreate.open({
            scopeType: 'PROJ',
            wsId: cfg.wsId || null,
            projId: cfg.projectId || null,
            scopeLabel: cfg.projectName || document.body.dataset.projectName || '현재 프로젝트',
            date: selectedDate,
            onSaved: function () {
                reload();
            }
        });
    }

    global.ProjectMiniCalendarAdapter = {
        reload: reload,
        render: render
    };

    global.drawCalendar = function () {
        render();
    };
    global.generateProjectMiniCalendar = render;
    global.changeProjectMonth = function (delta) {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + Number(delta || 0), 1);
        reload();
    };

    document.addEventListener('DOMContentLoaded', function () {
        var mode = document.body.dataset.mainShellMode || '';
        if (mode !== 'GROUP_PROJECT' && mode !== 'PERSONAL_PROJECT') return;
        var createButton = document.querySelector('[data-project-calendar-create]');
        if (createButton && createButton.dataset.bound !== 'true') {
            createButton.dataset.bound = 'true';
            createButton.addEventListener('click', openProjectQuickCreate);
        }
        reload();
    });
})(window);
