(function (global) {
    'use strict';

    var currentMonth = new Date();
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    var items = [];
    var state = 'ready';

    function contextPath() {
        return String(document.body.dataset.contextPath || '').replace(/\/$/, '');
    }

    function workspaceId() {
        return String(document.body.dataset.wsId || '');
    }

    function normalize(payload) {
        return (Array.isArray(payload) ? payload : []).filter(function (event) {
            if (!event || event.TYPE === 'NOTICE') return false;
            var itemType = String(event.itemType || event.ITEM_TYPE || event.type || event.TYPE || '').toUpperCase();
            var eventType = String(event.eventType || event.EVENT_TYPE || event.kind || event.KIND || '').toUpperCase();
            // 그룹 메인 일정 영역은 그룹 공통 일정과 프로젝트 기간만 보여준다.
            // 프로젝트 내부의 세부 일정은 각 프로젝트 페이지에서 확인한다.
            if (itemType === 'WS') return true;
            return eventType === 'PROJECT_PERIOD';
        }).map(function (event) {
            var start = event.startDt || event.START_DT || event.startDate || event.EVENT_DATE;
            var itemType = String(event.itemType || event.ITEM_TYPE || event.type || event.TYPE || '').toUpperCase();
            var eventType = String(event.eventType || event.EVENT_TYPE || event.kind || event.KIND || '').toUpperCase();
            var isProjectPeriod = eventType === 'PROJECT_PERIOD';
            var end = event.endDt || event.END_DT || event.endDate || start;
            var startText = String(start || '');
            var endText = String(end || '');
            var startMatch = startText.match(/(?:T|\s)(\d{2}:\d{2})/);
            var endMatch = endText.match(/(?:T|\s)(\d{2}:\d{2})/);
            var explicitAllDay = event.allDay;
            if (explicitAllDay == null) explicitAllDay = event.ALL_DAY;
            if (explicitAllDay == null) explicitAllDay = event.ALL_DAY_YN;
            var inferredAllDay = Boolean(startMatch && endMatch && startMatch[1] === '00:00' && (endMatch[1] === '23:59' || endMatch[1] === '00:00'));
            var allDay = explicitAllDay === true || explicitAllDay === 1 || String(explicitAllDay || '').toUpperCase() === 'Y' || inferredAllDay;
            return {
                id: event.id || event.eventId || event.EVENT_ID || '',
                type: isProjectPeriod ? 'project-period' : 'group',
                typeLabel: isProjectPeriod ? '프로젝트 기간' : '그룹 일정',
                title: isProjectPeriod
                    ? (event.projName || event.PROJ_NAME || event.projectName || event.PROJECT_NAME || event.title || event.TITLE || '프로젝트')
                    : (event.title || event.TITLE || '일정'),
                startDate: start,
                endDate: end,
                startTime: startMatch ? startMatch[1] : '',
                endTime: endMatch ? endMatch[1] : '',
                allDay: allDay,
                color: isProjectPeriod ? '#7A5CFF' : (event.color || event.EVENT_COLOR || event.COLOR || '#4A90E2'),
                projectName: '',
                eventType: eventType,
                original: event
            };
        }).sort(function (a, b) {
            // 선택한 날짜 목록이 API 반환 순서에 흔들리지 않게 한다.
            // 프로젝트 기간 → 종일 일정 → 시간 일정 순, 시간 일정은 시작 시각 오름차순.
            function rank(item) {
                if (item.type === 'project-period') return 0;
                if (item.allDay) return 1;
                return 2;
            }
            var rankDiff = rank(a) - rank(b);
            if (rankDiff !== 0) return rankDiff;
            var timeA = String(a.startTime || '99:99');
            var timeB = String(b.startTime || '99:99');
            if (timeA !== timeB) return timeA.localeCompare(timeB);
            return String(a.title || '').localeCompare(String(b.title || ''), 'ko');
        });
    }

    function render() {
        if (!global.MoyoMiniCalendar) return;
        global.MoyoMiniCalendar.render({
            grid: 'calendarGrid',
            title: 'calendarTitle',
            currentDate: currentMonth,
            items: items,
            state: state,
            errorMessage: '일정을 불러오지 못했습니다.',
            onItemClick: function (item) {
                var original = item.original || {};
                var eventId = item.id || original.id || original.eventId || original.EVENT_ID;
                if (eventId && global.MoyoCalendarEventPreview && typeof global.MoyoCalendarEventPreview.open === 'function') {
                    global.MoyoCalendarEventPreview.open(eventId);
                }
            }
        });
    }

    function load() {
        var id = workspaceId();
        if (!id) {
            items = [];
            state = 'ready';
            render();
            return Promise.resolve([]);
        }
        state = 'loading';
        render();
        var year = currentMonth.getFullYear();
        var month = currentMonth.getMonth();
        var startDate = year + '-' + String(month + 1).padStart(2, '0') + '-01';
        var endDate = new Date(year, month + 1, 0);
        var endDateText = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0');
        var params = new URLSearchParams({
            wsId: id,
            types: 'WS,PROJ',
            startDate: startDate,
            endDate: endDateText
        });
        return fetch(contextPath() + '/api/calendar/monthly?' + params.toString(), {
            credentials: 'same-origin'
        }).then(function (response) {
            if (!response.ok) throw new Error('calendar response ' + response.status);
            return response.json();
        }).then(function (payload) {
            items = normalize(payload);
            state = 'ready';
            render();
            return items;
        }).catch(function (error) {
            console.error('그룹 미니 달력 로딩 실패:', error);
            items = [];
            state = 'error';
            render();
            return [];
        });
    }

    global.generateCalendar = render;
    global.loadCalendarEvents = load;
    global.changeMonth = function (delta) {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + Number(delta || 0), 1);
        load();
    };

    global.WorkspaceMiniCalendarAdapter = {
        reload: load,
        render: render,
        getItems: function () { return items.slice(); }
    };

    document.addEventListener('DOMContentLoaded', function () {
        if (document.body.dataset.mainShellMode !== 'WORKSPACE') return;
        load();
    });
})(window);
