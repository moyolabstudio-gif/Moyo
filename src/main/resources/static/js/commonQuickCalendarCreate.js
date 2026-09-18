(function (global) {
    'use strict';

    var TYPES = [
        { value: '', label: '일반', icon: '🗓️' },
        { value: 'MEETING', label: '약속', icon: '🤝' },
        { value: 'ANNIVERSARY', label: '기념일', icon: '🎉' },
        { value: 'BIRTHDAY', label: '생일', icon: '🎂' },
        { value: 'TRAVEL', label: '여행', icon: '✈️' },
        { value: 'STUDY', label: '학습', icon: '📚' }
    ];
    var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
    var MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    var state = {
        options: null,
        saving: false,
        eventType: '',
        dateInput: null,
        dateView: null,
        timeInput: null,
        timeState: null,
        dateMenu: null,
        timeMenu: null,
        attendees: [],
        attendeePermissions: {},
        recordModal: null,
        recordTargetId: null,
        draftKey: null,
        editMode: false,
        editEventId: null,
        editDetail: null,
        editOccurrenceDate: null,
        visibilityType: 'PRIVATE',
        recordCounts: { NOTE: 0, PHOTO: 0, FILE: 0, LINK: 0, LOCATION: 0 }
    };

    function byId(id) { return document.getElementById(id); }
    function pad(value) { return String(value).padStart(2, '0'); }
    function contextPath() { return String(document.body && document.body.dataset.contextPath || '').replace(/\/$/, ''); }
    function todayString() {
        var date = new Date();
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }
    function addHour(time) {
        var parts = String(time || '09:00').split(':').map(Number);
        var total = ((parts[0] || 9) * 60 + (parts[1] || 0) + 60) % 1440;
        return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
    }
    function formatDate(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }
    function parseDate(value) {
        var match = String(value || '').trim().match(/^(\d{4})[-.\/년\s]?(\d{1,2})[-.\/월\s]?(\d{1,2})일?$/);
        if (!match) return null;
        var year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
        var test = new Date(year, month - 1, day);
        if (test.getFullYear() !== year || test.getMonth() !== month - 1 || test.getDate() !== day) return null;
        return { year: year, month: month, day: day, value: year + '-' + pad(month) + '-' + pad(day) };
    }
    function parseTime(value) {
        var raw = String(value || '').trim();
        var match = raw.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
        if (!match) return null;
        var hour = Number(match[1]), minute = Number(match[2]);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return { hour: hour, minute: minute };
    }
    function canonicalTime(hour, minute) { return pad(hour) + ':' + pad(minute); }


    function isDateSelectable(input, value) {
        var parsed = parseDate(value);
        if (!parsed || !input) return false;
        var min = parseDate(input.min || input.dataset.minDate || '');
        var max = parseDate(input.max || input.dataset.maxDate || '');
        if (min && parsed.value < min.value) return false;
        if (max && parsed.value > max.value) return false;
        return true;
    }

    function setTimeInput(input, value, fallback) {
        if (!input) return;
        var parsed = parseTime(value) || parseTime(fallback) || { hour: input.id === 'quickCreateEndTime' ? 10 : 9, minute: 0 };
        var canonical = canonicalTime(parsed.hour, parsed.minute);
        input.dataset.timeValue = canonical;
        input.dataset.prevValue = canonical;
        input.dataset.meridiem = parsed.hour >= 12 ? 'PM' : 'AM';
        input.value = pad(parsed.hour % 12 || 12) + ':' + pad(parsed.minute);
        updateMeridiem(input);
    }
    function getTimeValue(input, fallback) {
        if (!input) return fallback || '';
        var stored = parseTime(input.dataset.timeValue);
        if (stored) return canonicalTime(stored.hour, stored.minute);
        var parsed = parseTime(input.value);
        if (!parsed) return fallback || '';
        var hour = parsed.hour;
        if (hour <= 12) {
            var meridiem = input.dataset.meridiem || (hour >= 12 ? 'PM' : 'AM');
            if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
            else hour = hour === 12 ? 12 : hour + 12;
        }
        return canonicalTime(hour, parsed.minute);
    }
    function updateMeridiem(input) {
        var chip = document.querySelector('[data-quick-time-meridiem-for="' + input.id + '"]');
        if (!chip) return;
        var parsed = parseTime(getTimeValue(input, input.id === 'quickCreateEndTime' ? '10:00' : '09:00')) || { hour: 9, minute: 0 };
        var isPm = parsed.hour >= 12;
        input.dataset.meridiem = isPm ? 'PM' : 'AM';
        chip.textContent = isPm ? '오후' : '오전';
        chip.classList.toggle('is-am', !isPm);
        chip.classList.toggle('is-pm', isPm);
    }

    function closeSelectMenus(exceptId) {
        document.querySelectorAll('[data-quick-select-menu]').forEach(function (menu) {
            if (exceptId && menu.dataset.quickSelectMenu === exceptId) return;
            menu.hidden = true;
            var button = document.querySelector('[data-quick-select-button="' + menu.dataset.quickSelectMenu + '"]');
            if (button) button.setAttribute('aria-expanded', 'false');
        });
    }
    function syncSelectButton(selectId) {
        var select = byId(selectId);
        var button = document.querySelector('[data-quick-select-button="' + selectId + '"]');
        var menu = document.querySelector('[data-quick-select-menu="' + selectId + '"]');
        if (!select || !button) return;
        var option = select.options[select.selectedIndex] || select.options[0];
        button.textContent = option ? option.textContent : '';
        if (menu) {
            menu.querySelectorAll('[data-quick-select-value]').forEach(function (item) {
                var selected = String(item.dataset.quickSelectValue || '') === String(select.value || '');
                item.classList.toggle('is-selected', selected);
                item.setAttribute('aria-selected', selected ? 'true' : 'false');
            });
        }
    }
    function initSelectMenus() {
        document.querySelectorAll('[data-quick-select-wrap]').forEach(function (wrap) {
            var select = wrap.querySelector('select.moyo-quick-select');
            var button = wrap.querySelector('[data-quick-select-button]');
            var menu = wrap.querySelector('[data-quick-select-menu]');
            if (!select || !button || !menu || wrap.dataset.commonBound === 'true') return;
            wrap.dataset.commonBound = 'true';
            menu.innerHTML = '';
            Array.from(select.options).forEach(function (option) {
                var item = document.createElement('button');
                item.type = 'button';
                item.dataset.quickSelectValue = option.value || '';
                item.textContent = option.textContent || '';
                item.addEventListener('click', function (event) {
                    event.stopPropagation();
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    syncSelectButton(select.id);
                    closeSelectMenus();
                });
                menu.appendChild(item);
            });
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                var open = menu.hidden;
                closeFloaters('select:' + select.id);
                menu.hidden = !open;
                button.setAttribute('aria-expanded', open ? 'true' : 'false');
                syncSelectButton(select.id);
            });
            select.addEventListener('change', function () { syncSelectButton(select.id); });
            syncSelectButton(select.id);
        });
    }

    function initTypePicker() {
        var grid = byId('quickCreateTypeGrid');
        if (!grid || grid.dataset.ready === 'true') return;
        grid.dataset.ready = 'true';
        grid.innerHTML = '';
        TYPES.forEach(function (meta) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'moyo-quick-type-option';
            button.dataset.type = meta.value;
            button.innerHTML = '<span class="emoji">' + meta.icon + '</span><span>' + meta.label + '</span>';
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                setType(meta.value);
                closeTypePopover();
            });
            grid.appendChild(button);
        });
    }
    function setType(value) {
        state.eventType = value || '';
        var meta = TYPES.find(function (item) { return item.value === state.eventType; }) || TYPES[0];
        if (byId('quickCreateTypeIcon')) byId('quickCreateTypeIcon').textContent = meta.icon;
        if (byId('quickCreateTypeText')) byId('quickCreateTypeText').textContent = meta.label;
        document.querySelectorAll('.moyo-quick-type-option').forEach(function (button) {
            button.classList.toggle('is-active', button.dataset.type === state.eventType);
        });
    }
    function closeTypePopover() {
        var popover = byId('quickCreateTypePopover');
        var button = byId('quickCreateTypeButton');
        if (popover) popover.hidden = true;
        if (button) button.setAttribute('aria-expanded', 'false');
    }

    function ensureDateMenu() {
        if (state.dateMenu) return state.dateMenu;
        var menu = document.createElement('div');
        menu.id = 'quickDatePickerMenu';
        menu.className = 'moyo-quick-picker-menu moyo-quick-date-picker-menu';
        menu.hidden = true;
        menu.addEventListener('click', function (event) {
            event.stopPropagation();
            if (!state.dateInput) return;
            var nav = event.target.closest('[data-quick-date-nav]');
            var day = event.target.closest('[data-quick-date-value]');
            var today = event.target.closest('[data-quick-date-action="today"]');
            if (nav && !nav.disabled) {
                var next = new Date(state.dateView.year, state.dateView.month - 1 + Number(nav.dataset.quickDateNav || 0), 1);
                state.dateView = { year: next.getFullYear(), month: next.getMonth() + 1 };
                renderDateMenu();
            } else if (today) {
                if (isDateSelectable(state.dateInput, todayString())) {
                    setDateValue(state.dateInput, todayString());
                    closeDateMenu();
                }
            } else if (day && !day.disabled && isDateSelectable(state.dateInput, day.dataset.quickDateValue)) {
                setDateValue(state.dateInput, day.dataset.quickDateValue);
                closeDateMenu();
            }
        });
        document.body.appendChild(menu);
        state.dateMenu = menu;
        return menu;
    }
    function renderDateMenu() {
        var menu = ensureDateMenu();
        if (!state.dateInput || !state.dateView) return;
        var selected = parseDate(state.dateInput.value);
        var first = new Date(state.dateView.year, state.dateView.month - 1, 1);
        var start = new Date(state.dateView.year, state.dateView.month - 1, 1 - first.getDay());
        var days = [];
        for (var index = 0; index < 42; index += 1) {
            var current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
            var value = formatDate(current);
            var classes = ['moyo-quick-date-picker-day'];
            if (current.getMonth() !== state.dateView.month - 1) classes.push('is-muted');
            if (value === todayString()) classes.push('is-today');
            var disabled = !isDateSelectable(state.dateInput, value);
            if (selected && value === selected.value) classes.push('is-selected');
            if (disabled) classes.push('is-disabled');
            days.push('<button type="button" class="' + classes.join(' ') + '" data-quick-date-value="' + value + '"' + (disabled ? ' disabled aria-disabled="true"' : '') + '>' + current.getDate() + '</button>');
        }
        var minDate = parseDate(state.dateInput.min || state.dateInput.dataset.minDate || '');
        var maxDate = parseDate(state.dateInput.max || state.dateInput.dataset.maxDate || '');
        var currentMonthKey = state.dateView.year * 12 + state.dateView.month;
        var minMonthKey = minDate ? minDate.year * 12 + minDate.month : null;
        var maxMonthKey = maxDate ? maxDate.year * 12 + maxDate.month : null;
        var prevDisabled = minMonthKey !== null && currentMonthKey <= minMonthKey;
        var nextDisabled = maxMonthKey !== null && currentMonthKey >= maxMonthKey;
        menu.innerHTML = '<div class="moyo-quick-date-picker-head"><div class="moyo-quick-date-picker-title">' + state.dateView.year + '년 ' + state.dateView.month + '월</div><div class="moyo-quick-date-picker-nav"><button type="button" data-quick-date-nav="-1" aria-label="이전 달"' + (prevDisabled ? ' disabled aria-disabled="true"' : '') + '>‹</button><button type="button" data-quick-date-nav="1" aria-label="다음 달"' + (nextDisabled ? ' disabled aria-disabled="true"' : '') + '>›</button></div></div>'
            + '<div class="moyo-quick-date-picker-weekdays">' + WEEKDAYS.map(function (day) { return '<span>' + day + '</span>'; }).join('') + '</div>'
            + '<div class="moyo-quick-date-picker-days">' + days.join('') + '</div>'
            + '<div class="moyo-quick-date-picker-foot"><button type="button" class="moyo-quick-date-picker-today" data-quick-date-action="today">오늘</button></div>';
    }
    function positionMenu(menu, field, width, estimatedHeight) {
        var rect = field.getBoundingClientRect();
        var left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
        var below = rect.bottom + 3;
        var top = below + estimatedHeight > window.innerHeight - 10 ? Math.max(10, rect.top - estimatedHeight - 3) : below;
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }
    function openDateMenu(input) {
        if (!input || input.disabled || input.readOnly) return;
        closeFloaters('date');
        var parsed = parseDate(input.value) || parseDate(todayString());
        var minDate = parseDate(input.min || input.dataset.minDate || '');
        var maxDate = parseDate(input.max || input.dataset.maxDate || '');
        if (minDate && parsed.value < minDate.value) parsed = minDate;
        if (maxDate && parsed.value > maxDate.value) parsed = maxDate;
        state.dateInput = input;
        state.dateView = { year: parsed.year, month: parsed.month };
        renderDateMenu();
        var menu = ensureDateMenu();
        positionMenu(menu, input.closest('.moyo-quick-date-field') || input, 248, 288);
        menu.hidden = false;
    }
    function closeDateMenu() {
        if (state.dateMenu) state.dateMenu.hidden = true;
        state.dateInput = null;
    }
    function setDateValue(input, value) {
        var parsed = parseDate(value);
        if (!input || !parsed || !isDateSelectable(input, parsed.value)) return;
        input.value = parsed.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function timeStateFrom(value, fallback) {
        var parsed = parseTime(value) || parseTime(fallback) || { hour: 9, minute: 0 };
        return { meridiem: parsed.hour >= 12 ? 'PM' : 'AM', hour12: parsed.hour % 12 || 12, minute: parsed.minute };
    }
    function timeStateValue(timeState) {
        var hour = Number(timeState.hour12 || 12) % 12 + (timeState.meridiem === 'PM' ? 12 : 0);
        return canonicalTime(hour, Number(timeState.minute || 0));
    }
    function ensureTimeMenu() {
        if (state.timeMenu) return state.timeMenu;
        var menu = document.createElement('div');
        menu.id = 'quickTimePickerMenu';
        menu.className = 'moyo-quick-picker-menu moyo-quick-time-picker-menu';
        menu.hidden = true;
        menu.addEventListener('click', function (event) {
            event.stopPropagation();
            var button = event.target.closest('button[data-quick-time-action],button[data-quick-meridiem],button[data-quick-hour],button[data-quick-minute]');
            if (!button || !state.timeInput) return;
            if (button.dataset.quickTimeAction === 'now') {
                var now = new Date();
                var rounded = Math.round(now.getMinutes() / 5) * 5;
                if (rounded >= 60) { now.setHours(now.getHours() + 1); rounded = 0; }
                state.timeState = timeStateFrom(canonicalTime(now.getHours(), rounded), '09:00');
            }
            if (button.dataset.quickMeridiem) state.timeState.meridiem = button.dataset.quickMeridiem;
            if (button.dataset.quickHour) state.timeState.hour12 = Number(button.dataset.quickHour);
            if (button.dataset.quickMinute) state.timeState.minute = Number(button.dataset.quickMinute);
            setTimeInput(state.timeInput, timeStateValue(state.timeState), state.timeInput.id === 'quickCreateEndTime' ? '10:00' : '09:00');
            state.timeInput.dispatchEvent(new Event('change', { bubbles: true }));
            renderTimeMenu();
        });
        document.body.appendChild(menu);
        state.timeMenu = menu;
        return menu;
    }
    function renderTimeMenu() {
        var menu = ensureTimeMenu();
        var hourButtons = Array.from({ length: 12 }, function (_, index) {
            var hour = index + 1;
            return '<button type="button" data-quick-hour="' + hour + '" class="' + (state.timeState.hour12 === hour ? 'is-selected' : '') + '">' + pad(hour) + '</button>';
        }).join('');
        var minuteButtons = MINUTES.map(function (minute) {
            return '<button type="button" data-quick-minute="' + minute + '" class="' + (state.timeState.minute === minute ? 'is-selected' : '') + '">' + pad(minute) + '</button>';
        }).join('');
        menu.innerHTML = '<div class="moyo-quick-time-picker-head"><div class="moyo-quick-time-picker-title">시간 선택</div><button type="button" class="moyo-quick-time-picker-now" data-quick-time-action="now">현재 시간</button></div>'
            + '<div class="moyo-quick-time-picker-ampm"><button type="button" data-quick-meridiem="AM" class="' + (state.timeState.meridiem === 'AM' ? 'is-selected' : '') + '">오전</button><button type="button" data-quick-meridiem="PM" class="' + (state.timeState.meridiem === 'PM' ? 'is-selected' : '') + '">오후</button></div>'
            + '<div class="moyo-quick-time-picker-section"><div class="moyo-quick-time-picker-label">시</div><div class="moyo-quick-time-picker-grid">' + hourButtons + '</div></div>'
            + '<div class="moyo-quick-time-picker-section"><div class="moyo-quick-time-picker-label">분 · 5분 단위</div><div class="moyo-quick-time-picker-grid">' + minuteButtons + '</div></div>';
    }
    function openTimeMenu(input) {
        if (!input || input.disabled) return;
        closeFloaters('time');
        state.timeInput = input;
        state.timeState = timeStateFrom(getTimeValue(input, input.id === 'quickCreateEndTime' ? '10:00' : '09:00'), input.id === 'quickCreateEndTime' ? '10:00' : '09:00');
        renderTimeMenu();
        var menu = ensureTimeMenu();
        positionMenu(menu, input.closest('.moyo-quick-time-field') || input, 268, 276);
        menu.hidden = false;
    }
    function closeTimeMenu() {
        if (state.timeMenu) state.timeMenu.hidden = true;
        state.timeInput = null;
    }

    function closeFloaters(except) {
        if (except !== 'type') closeTypePopover();
        if (except !== 'date') closeDateMenu();
        if (except !== 'time') closeTimeMenu();
        if (String(except || '').indexOf('select:') === 0) closeSelectMenus(String(except).slice(7));
        else closeSelectMenus();
    }

    function syncUseTime() {
        var useTime = !!(byId('quickCreateUseTime') && byId('quickCreateUseTime').checked);
        var allDay = !useTime;
        ['quickCreateStartTime', 'quickCreateEndTime'].forEach(function (id) {
            var input = byId(id);
            if (!input) return;
            input.disabled = allDay;
            var trigger = input.closest('.moyo-quick-time-field') && input.closest('.moyo-quick-time-field').querySelector('.moyo-quick-time-trigger');
            if (trigger) trigger.disabled = allDay;
        });
        document.querySelectorAll('.moyo-quick-time-grid').forEach(function (row) { row.classList.toggle('is-all-day', allDay); });
        if (allDay) closeTimeMenu();
    }
    function normalizeEnd() {
        var startDate = byId('quickCreateStartDate').value;
        var endDate = byId('quickCreateEndDate').value;
        var startTime = getTimeValue(byId('quickCreateStartTime'), '09:00');
        var endTime = getTimeValue(byId('quickCreateEndTime'), '10:00');
        if (startDate && (!endDate || endDate < startDate)) byId('quickCreateEndDate').value = startDate;
        if (startDate && byId('quickCreateEndDate').value === startDate && endTime <= startTime) setTimeInput(byId('quickCreateEndTime'), addHour(startTime), '10:00');
    }
    function scopeInfo() {
        var options = state.options || {};
        var scopeType = String(options.scopeType || 'PRIVATE').toUpperCase();
        if (['PRIVATE', 'WS', 'PROJ'].indexOf(scopeType) < 0) scopeType = 'PRIVATE';

        var wsId = options.wsId || null;
        var projId = options.projId || null;
        if (scopeType === 'PRIVATE') {
            wsId = null;
            projId = null;
        } else if (scopeType === 'WS') {
            projId = null;
        }
        return { scopeType: scopeType, wsId: wsId, projId: projId };
    }
    function scopeContextText() {
        var options = state.options || {};
        var info = scopeInfo();
        var label = String(options.contextLabel || '').trim();
        if (!label) {
            if (info.scopeType === 'PROJ') label = '현재 프로젝트';
            else if (info.scopeType === 'WS') label = '현재 그룹';
            else label = '내 캘린더';
        }
        if (info.scopeType === 'PROJ') return '프로젝트 · ' + label;
        if (info.scopeType === 'WS') return '그룹 · ' + label;
        return label;
    }
    function renderScopeContext() {
        var node = byId('quickCreateContext');
        if (!node) return;
        node.textContent = scopeContextText();
        node.hidden = false;
    }
    function normalizeVisibilityType(value) {
        var visibility = String(value || 'PRIVATE').trim().toUpperCase();
        return ['PRIVATE', 'FRIEND', 'MOYO'].indexOf(visibility) >= 0 ? visibility : 'PRIVATE';
    }
    function isMoyoPublic() { return state.visibilityType === 'MOYO'; }
    function setVisibilityType(value) {
        var info = scopeInfo();
        state.visibilityType = info.scopeType === 'PRIVATE' && normalizeVisibilityType(value) === 'MOYO' ? 'MOYO' : 'PRIVATE';
        var toggle = byId('quickCreateMoyoPublic');
        if (toggle) toggle.checked = state.visibilityType === 'MOYO';
        var row = byId('quickCreateVisibilityRow');
        if (row) {
            row.hidden = info.scopeType !== 'PRIVATE';
            row.classList.toggle('is-active', state.visibilityType === 'MOYO');
            row.setAttribute('aria-label', state.visibilityType === 'MOYO' ? '모요 공개 사용 중' : '모요 공개 사용 안 함');
        }
    }
    function syncLunarUi() {
        var select = byId('quickCreateLunar');
        if (!select) return;
        var value = select.value === 'Y' ? 'Y' : 'N';
        document.querySelectorAll('[data-lunar-value]').forEach(function (button) {
            var active = button.dataset.lunarValue === value;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-checked', active ? 'true' : 'false');
        });
    }

    function collectDraft() {
        var allDay = !(byId('quickCreateUseTime') && byId('quickCreateUseTime').checked);
        return {
            title: String(byId('quickCreateTitleInput').value || '').trim(),
            startDate: byId('quickCreateStartDate').value || '',
            endDate: byId('quickCreateEndDate').value || '',
            startTime: allDay ? null : getTimeValue(byId('quickCreateStartTime'), '09:00'),
            endTime: allDay ? null : getTimeValue(byId('quickCreateEndTime'), '10:00'),
            allDay: allDay,
            repeat: byId('quickCreateRepeat').value === 'CUSTOM' ? (byId('quickCreateRepeatUnit').value || 'WEEKLY') : (byId('quickCreateRepeat').value || ''),
            repeatInterval: byId('quickCreateRepeat').value === 'CUSTOM' ? Math.max(1, Number(byId('quickCreateRepeatInterval').value || 1)) : 1,
            repeatDays: byId('quickCreateRepeat').value === 'CUSTOM' && byId('quickCreateRepeatUnit').value === 'WEEKLY'
                ? Array.from(document.querySelectorAll('[data-repeat-day].is-active')).map(function (button) { return button.dataset.repeatDay; }).join(',')
                : null,
            repeatUntil: byId('quickCreateRepeat').value === 'CUSTOM' && byId('quickCreateRepeatEndType').value === 'DATE'
                ? (byId('quickCreateRepeatUntil').value || null)
                : null,
            isLunar: byId('quickCreateLunar').value === 'Y',
            timezone: allDay ? 'Asia/Seoul' : (byId('quickCreateTimezone').value || 'Asia/Seoul'),
            reminderMinutes: byId('quickCreateReminder').value === '' ? null : Number(byId('quickCreateReminder').value),
            eventType: state.eventType || null,
            visibilityType: state.visibilityType,
            moyoPublic: state.visibilityType === 'MOYO',
            attendees: state.attendees.slice(),
            draftKey: state.draftKey,
            scopeInfo: scopeInfo()
        };
    }
    function validate(draft) {
        if (!draft.title) return '제목을 입력하세요.';
        if (!draft.startDate || !draft.endDate) return '시작/종료 날짜를 입력하세요.';
        if (!draft.allDay && (!draft.startTime || !draft.endTime)) return '시작/종료 시간을 입력하세요.';
        if (draft.isLunar && draft.repeat && draft.repeat !== 'YEARLY') return '음력 일정은 반복 안 함 또는 매년 반복만 사용할 수 있습니다.';
        if (byId('quickCreateRepeat').value === 'CUSTOM' && draft.repeat === 'WEEKLY' && !draft.repeatDays) return '반복할 요일을 선택하세요.';
        if (byId('quickCreateRepeat').value === 'CUSTOM' && byId('quickCreateRepeatEndType').value === 'DATE' && !draft.repeatUntil) return '반복 종료일을 입력하세요.';
        var start = new Date(draft.startDate + 'T' + (draft.allDay ? '00:00:00' : draft.startTime + ':00'));
        var end = new Date(draft.endDate + 'T' + (draft.allDay ? '23:59:59' : draft.endTime + ':00'));
        if (end < start) return '종료 일시는 시작 일시보다 빠를 수 없습니다.';
        if (draft.scopeInfo.scopeType === 'WS' && !draft.scopeInfo.wsId) return '그룹 정보가 없습니다.';
        if (draft.scopeInfo.scopeType === 'PROJ' && !draft.scopeInfo.projId) return '프로젝트 정보가 없습니다.';
        return '';
    }

    function isMoyoQuickPersonProfile(path) {
        var value = String(path || '').trim();
        return !!value && /(?:^|\/)uploads\/(?:users|workspace)\//i.test(value);
    }
    function normalizeQuickPerson(source) {
        source = source || {};
        var raw = source.raw || source;
        return {
            id: String(source.id || raw.userId || raw.USER_ID || ''),
            name: String(source.name || raw.name || raw.userName || raw.USER_NAME || '사용자'),
            email: String(source.email || raw.email || raw.EMAIL || ''),
            profile: (function () {
                var path = String(source.profile || source.profileImagePath || raw.profileImage || raw.profileImagePath || raw.PROFILE_IMAGE_PATH || '');
                return isMoyoQuickPersonProfile(path) ? path : '';
            })(),
            raw: raw
        };
    }
    function attendeeAvatar(person) {
        var name = String(person.name || '사용자');
        if (person.profile) return '<span class="moyo-quick-attendee-avatar"><img src="' + person.profile.replace(/"/g, '&quot;') + '" alt=""></span>';
        return '<span class="moyo-quick-attendee-avatar is-default">' + Array.from(name)[0] + '</span>';
    }
    function renderAttendeeSummary() {
        var stack = byId('quickCreateAttendeeStack');
        var title = byId('quickCreateAttendeeTitle');
        var meta = byId('quickCreateAttendeeMeta');
        var action = byId('quickCreateAttendeeAction');
        if (!stack || !title || !meta || !action) return;
        var people = state.attendees;
        if (!people.length) {
            stack.innerHTML = '<span class="moyo-quick-attendee-empty-avatar" aria-hidden="true"><i class="fa-solid fa-user-group"></i></span>';
            stack.hidden = false;
            title.textContent = '참석자를 선택하세요';
            meta.textContent = '';
            meta.hidden = true;
            action.textContent = '선택';
            return;
        }
        stack.innerHTML = people.slice(0, 3).map(attendeeAvatar).join('');
        stack.hidden = false;
        title.textContent = people.length === 1 ? people[0].name : people[0].name + ' 외 ' + (people.length - 1) + '명';
        meta.textContent = people.length + '명 참석';
        meta.hidden = false;
        action.textContent = people.length === 1 ? '변경' : '전체 보기';
    }
    function permissionAction(person) {
        var permission = state.attendeePermissions[String(person.id)] || 'VIEW';
        return '<button type="button" class="common-people-modal-role is-permission" data-person-action="toggle-permission">' + (permission === 'EDIT' ? '편집' : '보기') + '</button>';
    }
    function openAttendeeSelector() {
        if (!window.CommonPeopleModal) return alert('참석자 선택 모달을 불러오지 못했습니다.');
        var info = scopeInfo();
        var loader;
        if (info.scopeType === 'PRIVATE') {
            loader = window.CommonFriendAdapter && window.CommonFriendAdapter.fetchList
                ? window.CommonFriendAdapter.fetchList(contextPath())
                : Promise.reject(new Error('친구 목록을 불러올 수 없습니다.'));
        } else if (window.CommonMemberDataAdapter) {
            loader = info.scopeType === 'PROJ'
                ? window.CommonMemberDataAdapter.loadProject({ projId: info.projId })
                : window.CommonMemberDataAdapter.loadWorkspace({ wsId: info.wsId });
        } else {
            loader = Promise.reject(new Error('멤버 목록을 불러올 수 없습니다.'));
        }
        Promise.resolve(loader).then(function (items) {
            var people = (Array.isArray(items) ? items : []).map(normalizeQuickPerson).filter(function (person) { return person.id; });
            window.CommonPeopleModal.open({
                title: '참석자 선택',
                description: info.scopeType === 'PRIVATE'
                    ? '참석자를 선택하세요. 편집으로 지정하면 일정 기록도 함께 수정할 수 있습니다.'
                    : '일정은 현재 공간 멤버에게 공개됩니다. 참석자 중 기록 편집 권한을 줄 사람만 편집으로 지정하세요.',
                mode: 'SELECT_MULTIPLE',
                people: people,
                selectedIds: state.attendees.map(function (person) { return person.id; }),
                confirmText: '선택 완료',
                searchPlaceholder: info.scopeType === 'PRIVATE' ? '친구 이름 또는 이메일 검색' : '멤버 이름 또는 이메일 검색',
                renderRowAction: permissionAction,
                onRowAction: function (person, action, button) {
                    if (action !== 'toggle-permission') return;
                    var id = String(person.id);
                    state.attendeePermissions[id] = (state.attendeePermissions[id] || 'VIEW') === 'VIEW' ? 'EDIT' : 'VIEW';
                    button.textContent = state.attendeePermissions[id] === 'EDIT' ? '편집' : '보기';
                },
                onSelect: function (selected) {
                    state.attendees = (Array.isArray(selected) ? selected : []).map(normalizeQuickPerson);
                    state.attendees.forEach(function (person) {
                        if (!state.attendeePermissions[person.id]) state.attendeePermissions[person.id] = 'VIEW';
                    });
                    renderAttendeeSummary();
                }
            });
        }).catch(function (error) { alert(error.message || '참석자 목록을 불러오지 못했습니다.'); });
    }
    function syncRepeatCustom() {
        var custom = byId('quickCreateRepeatCustom');
        if (!custom) return;
        var active = byId('quickCreateRepeat').value === 'CUSTOM';
        custom.hidden = !active;
        var weekly = byId('quickCreateRepeatUnit').value === 'WEEKLY';
        byId('quickCreateRepeatDays').hidden = !weekly;
        var useDate = byId('quickCreateRepeatEndType').value === 'DATE';
        var repeatUntilField = byId('quickCreateRepeatUntilField');
        if (repeatUntilField) repeatUntilField.hidden = !useDate;
    }
    function renderRecordCounts() {
        document.querySelectorAll('[data-quick-record-count]').forEach(function (node) {
            node.textContent = String(state.recordCounts[node.dataset.quickRecordCount] || 0);
        });
    }
    function ensureRecordModal() {
        if (state.recordModal) return state.recordModal;
        if (!window.CommonContentRecordModal) throw new Error('공통 기록 모달을 불러오지 못했습니다.');
        state.recordModal = window.CommonContentRecordModal.create({
            contextPath: contextPath(),
            ensureDraft: function () {
                var info = scopeInfo();
                var contextType = info.scopeType === 'PROJ' ? 'PROJECT' : (info.scopeType === 'WS' ? 'GROUP' : 'PERSONAL');
                var contextId = info.scopeType === 'PROJ' ? info.projId : (info.scopeType === 'WS' ? info.wsId : null);
                return fetch(contextPath() + '/api/content-record-drafts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ draftKey: state.draftKey, contextType: contextType, contextId: contextId })
                }).then(function (response) { return response.json().then(function (body) { if (!response.ok) throw new Error(body.message || '임시 기록을 만들지 못했습니다.'); return body; }); })
                  .then(function (body) { state.recordTargetId = body.recordTargetId; state.draftKey = body.draftKey; return body; });
            },
            onCreatePhoto: async function (payload) {
                var recordTargetId = payload && payload.recordTargetId;
                var formData = payload && payload.formData;
                var info = scopeInfo();
                var photoScopeType = info.scopeType === 'PROJ' ? 'PROJECT' : (info.scopeType === 'WS' ? 'WORKSPACE' : 'PERSONAL');
                var scopeId = info.scopeType === 'PROJ' ? Number(info.projId)
                    : (info.scopeType === 'WS' ? Number(info.wsId) : Number(document.body.dataset.currentUserId));
                if (!recordTargetId || !Number.isFinite(scopeId) || scopeId <= 0) throw new Error('사진 저장 위치를 확인할 수 없습니다.');
                var files = formData ? formData.getAll('files').filter(function (file) { return file instanceof File && file.size > 0; }) : [];
                if (!files.length) throw new Error('등록할 사진을 선택해주세요.');
                var requestJson = async function (url, options) {
                    var response = await fetch(contextPath() + url, Object.assign({ credentials: 'same-origin' }, options || {}));
                    var body = await response.json().catch(function () { return null; });
                    if (!response.ok) throw new Error((body && (body.message || body.error)) || '사진을 저장하지 못했습니다.');
                    return body;
                };
                var title = String(byId('quickCreateTitleInput').value || '').trim() || '새 일정';
                var album = await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/photo-album', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ albumName: title })
                });
                var albumId = Number(album && (album.albumId || album.ALBUM_ID));
                if (!albumId) throw new Error('기록 사진 앨범을 준비하지 못했습니다.');
                var upload = new FormData();
                upload.append('scopeType', photoScopeType);
                upload.append('scopeId', String(scopeId));
                upload.append('albumId', String(albumId));
                upload.append('title', title);
                upload.append('description', '');
                upload.append('visibilityType', photoScopeType === 'PROJECT' ? 'PROJECT' : (photoScopeType === 'WORKSPACE' ? 'WORKSPACE' : 'PRIVATE'));
                files.forEach(function (file) { upload.append('files', file); });
                var post = await requestJson('/api/photo-posts', { method: 'POST', body: upload });
                var postId = Number(post && (post.postId || post.POST_ID));
                if (!postId) throw new Error('사진 게시물 정보를 확인하지 못했습니다.');
                await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/contents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recordType: 'PHOTO', contentId: postId, title: title })
                });
            },
            onChanged: function () {
                var current = state.recordModal.getState();
                state.recordTargetId = current.recordTargetId;
                state.draftKey = current.draftKey;
                fetch(contextPath() + '/api/content-records/' + current.recordTargetId + '/items', { credentials: 'same-origin' })
                    .then(function (response) { return response.json(); })
                    .then(function (items) {
                        state.recordCounts = { NOTE: 0, PHOTO: 0, FILE: 0, LINK: 0, LOCATION: 0 };
                        (Array.isArray(items) ? items : []).forEach(function (item) {
                            var type = String(item.recordType || item.RECORD_TYPE || '').toUpperCase();
                            if (state.recordCounts[type] != null) state.recordCounts[type] += 1;
                        });
                        renderRecordCounts();
                    });
            }
        });
        return state.recordModal;
    }
    function openRecordModal() {
        try {
            ensureRecordModal().open({
                recordTargetId: state.recordTargetId,
                draftKey: state.draftKey,
                targetLabel: String(byId('quickCreateTitleInput').value || '').trim() || '새 일정'
            });
        } catch (error) { alert(error.message); }
    }

    function buildPayload(draft) {
        var itemType = draft.scopeInfo.scopeType || 'PRIVATE';
        var payload = {
            title: draft.title,
            startDt: draft.startDate + 'T' + (draft.allDay ? '00:00:00' : draft.startTime + ':00'),
            endDt: draft.endDate + 'T' + (draft.allDay ? '23:59:59' : draft.endTime + ':00'),
            itemType: itemType,
            eventType: draft.eventType,
            isPrivate: draft.visibilityType === 'MOYO' ? 'N' : 'Y',
            visibilityType: draft.visibilityType || 'PRIVATE',
            reminderYn: draft.reminderMinutes == null ? 'N' : 'Y',
            reminderMinutes: draft.reminderMinutes,
            userId: Number(document.body.dataset.currentUserId) || null,
            wsId: itemType === 'WS' || itemType === 'PROJ' ? (Number(draft.scopeInfo.wsId) || null) : null,
            projId: itemType === 'PROJ' ? (Number(draft.scopeInfo.projId) || null) : null,
            color: null,
            allDay: draft.allDay ? 'Y' : 'N',
            timezone: draft.timezone,
            isRecurring: draft.repeat ? 'Y' : 'N',
            recurType: draft.repeat || null,
            recurInterval: draft.repeatInterval || 1,
            untilDt: draft.repeatUntil || null,
            recurDays: draft.repeatDays || null,
            recurGroupId: null,
            isLunar: draft.isLunar ? 'Y' : 'N',
            lunarMonth: draft.isLunar ? Number(draft.startDate.slice(5, 7)) : null,
            lunarDay: draft.isLunar ? Number(draft.startDate.slice(8, 10)) : null,
            locationText: null,
            locationAddress: null,
            locationLat: null,
            locationLng: null,
            locationPlaceId: null,
            descriptionText: null,
            shareTargets: draft.attendees.filter(function (person) {
                if (itemType === 'PRIVATE') return true;
                return (state.attendeePermissions[String(person.id)] || 'VIEW') === 'EDIT';
            }).map(function (person) {
                return { targetType: 'USER', targetId: Number(person.id), permissionType: state.attendeePermissions[String(person.id)] || 'VIEW' };
            }),
            attendeeUserIds: draft.attendees.map(function (person) { return Number(person.id); }).filter(Boolean),
            draftKey: draft.draftKey || state.draftKey || null,
            recordEnabledYn: 'Y'
        };
        if (itemType !== 'PRIVATE') {
            payload.isPrivate = 'Y';
            payload.visibilityType = 'PRIVATE';
        }
        return payload;
    }

    function setMoyoPublic(active) {
        var button = byId('quickCreateMoyoToggle');
        if (!button) return;
        button.classList.toggle('is-active', !!active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    function syncScopeUi() {
        setVisibilityType(state.visibilityType);
        renderScopeContext();
        renderAttendeeSummary();
    }


    function detailValue(detail) {
        if (!detail) return '';
        for (var i = 1; i < arguments.length; i += 1) {
            var key = arguments[i];
            if (detail[key] !== undefined && detail[key] !== null) return detail[key];
        }
        return '';
    }

    function parseDetailDateTime(value) {
        var text = String(value || '').trim().replace('T', ' ');
        var match = text.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}):(\d{2}))?/);
        return { date: match ? match[1] : '', time: match && match[2] ? match[2] + ':' + match[3] : '' };
    }

    function inferDetailAllDay(detail) {
        var explicit = String(detailValue(detail, 'allDay', 'ALL_DAY', 'allDayYn', 'ALL_DAY_YN') || '').toUpperCase();
        if (explicit === 'Y' || explicit === 'TRUE') return true;
        if (explicit === 'N' || explicit === 'FALSE') return false;
        var start = parseDetailDateTime(detailValue(detail, 'startDt', 'START_DT'));
        var end = parseDetailDateTime(detailValue(detail, 'endDt', 'END_DT'));
        return start.time === '00:00' && (end.time === '23:59' || end.time === '00:00');
    }

    function setEditUi(editing, recurring) {
        var heading = byId('quickCreateTitle');
        var saveButton = byId('quickCreateSave');
        var scopeRow = byId('quickCreateUpdateScopeRow');
        if (heading) heading.textContent = editing ? '일정 수정' : '일정 등록';
        if (saveButton) saveButton.textContent = editing ? '수정' : '등록';
        if (scopeRow) scopeRow.hidden = !(editing && recurring);
    }

    function resetRepeatDays() {
        document.querySelectorAll('[data-repeat-day]').forEach(function (button) {
            button.classList.remove('is-active');
        });
    }

    function applyRepeatFromDetail(detail) {
        var recurring = String(detailValue(detail, 'isRecurring', 'IS_RECURRING') || 'N').toUpperCase() === 'Y';
        var recurType = String(detailValue(detail, 'recurType', 'RECUR_TYPE') || '').toUpperCase();
        var interval = Math.max(1, Number(detailValue(detail, 'recurInterval', 'RECUR_INTERVAL') || 1));
        var recurDays = String(detailValue(detail, 'recurDays', 'RECUR_DAYS') || '');
        var untilDt = String(detailValue(detail, 'untilDt', 'UNTIL_DT') || '');

        resetRepeatDays();
        byId('quickCreateRepeatInterval').value = interval;
        byId('quickCreateRepeatUnit').value = recurType || 'WEEKLY';
        byId('quickCreateRepeatEndType').value = untilDt ? 'DATE' : 'NONE';
        byId('quickCreateRepeatUntil').value = untilDt;

        if (!recurring || !recurType) {
            byId('quickCreateRepeat').value = '';
        } else if (interval === 1 && !recurDays && !untilDt && ['DAILY','WEEKLY','MONTHLY','YEARLY'].indexOf(recurType) >= 0) {
            byId('quickCreateRepeat').value = recurType;
        } else {
            byId('quickCreateRepeat').value = 'CUSTOM';
            byId('quickCreateRepeatUnit').value = recurType || 'WEEKLY';
            recurDays.split(',').map(function (value) { return value.trim().toUpperCase(); }).filter(Boolean).forEach(function (day) {
                var button = document.querySelector('[data-repeat-day="' + day + '"]');
                if (button) button.classList.add('is-active');
            });
        }

        syncRepeatCustom();
        syncSelectButton('quickCreateRepeat');
    }

    function populateEditForm(detail, options) {
        var start = parseDetailDateTime(detailValue(detail, 'startDt', 'START_DT'));
        var end = parseDetailDateTime(detailValue(detail, 'endDt', 'END_DT'));
        var allDay = inferDetailAllDay(detail);

        byId('quickCreateTitleInput').value = String(detailValue(detail, 'title', 'TITLE') || '');
        byId('quickCreateStartDate').value = start.date || todayString();
        byId('quickCreateEndDate').value = end.date || start.date || todayString();
        setTimeInput(byId('quickCreateStartTime'), start.time || '09:00', '09:00');
        setTimeInput(byId('quickCreateEndTime'), end.time || '10:00', '10:00');
        byId('quickCreateUseTime').checked = !allDay;
        byId('quickCreateLunar').value = String(detailValue(detail, 'isLunar', 'IS_LUNAR') || 'N').toUpperCase() === 'Y' ? 'Y' : 'N';
        syncLunarUi();
        byId('quickCreateTimezone').value = String(detailValue(detail, 'timezone', 'TIMEZONE') || 'Asia/Seoul');
        byId('quickCreateReminder').value = String(detailValue(detail, 'reminderYn', 'REMINDER_YN') || 'N').toUpperCase() === 'Y'
            ? String(detailValue(detail, 'reminderMinutes', 'REMINDER_MINUTES') || '')
            : '';

        var detailVisibility = String(detailValue(detail, 'visibilityType', 'VISIBILITY_TYPE') || '').toUpperCase();
        if (!detailVisibility) {
            detailVisibility = String(detailValue(detail, 'isPrivate', 'IS_PRIVATE') || 'Y').toUpperCase() === 'N' ? 'MOYO' : 'PRIVATE';
        }
        setVisibilityType(detailVisibility);

        setType(String(detailValue(detail, 'eventType', 'EVENT_TYPE') || '').replace(/^NONE$/i, ''));

        state.attendees = (detail.attendees || detail.ATTENDEES || []).map(normalizeQuickPerson).filter(function (person) {
            return !!person.id;
        });
        state.attendeePermissions = {};
        state.attendees.forEach(function (person) {
            var raw = person.raw || {};
            var permission = String(raw.permissionType || raw.PERMISSION_TYPE || 'VIEW').toUpperCase();
            state.attendeePermissions[String(person.id)] = permission === 'EDIT' ? 'EDIT' : 'VIEW';
        });

        state.draftKey = detailValue(detail, 'draftKey', 'DRAFT_KEY') || null;

        applyRepeatFromDetail(detail);
        document.querySelectorAll('.moyo-quick-select').forEach(function (select) {
            syncSelectButton(select.id);
        });
        renderAttendeeSummary();
        syncUseTime();

        var recurring = String(detailValue(detail, 'isRecurring', 'IS_RECURRING') || 'N').toUpperCase() === 'Y'
            || !!String(detailValue(detail, 'recurGroupId', 'RECUR_GROUP_ID') || '').trim();
        setEditUi(true, recurring);

        var updateScope = byId('quickCreateUpdateScope');
        if (updateScope) updateScope.value = 'ONE';

        state.editOccurrenceDate = (options && options.occurrenceDate) || start.date || null;
    }

    function fetchEditDetail(eventId) {
        return fetch(contextPath() + '/api/calendar/detail?eventId=' + encodeURIComponent(eventId), {
            credentials: 'same-origin',
            cache: 'no-store'
        }).then(function (response) {
            if (!response.ok) throw new Error('일정 정보를 불러오지 못했습니다.');
            return response.json();
        });
    }

    function openEdit(eventId, options) {
        if (!eventId) return Promise.reject(new Error('수정할 일정 정보가 없습니다.'));

        return fetchEditDetail(eventId).then(function (detail) {
            if (String(detailValue(detail, 'canEditYn', 'CAN_EDIT_YN') || 'N').toUpperCase() !== 'Y') {
                throw new Error('일정을 수정할 권한이 없습니다.');
            }

            state.options = Object.assign({}, options || {}, {
                scopeType: String(detailValue(detail, 'itemType', 'ITEM_TYPE') || 'PRIVATE').toUpperCase(),
                wsId: detailValue(detail, 'wsId', 'WS_ID') || null,
                projId: detailValue(detail, 'projId', 'PROJ_ID') || null
            });
            state.editMode = true;
            state.editEventId = Number(eventId);
            state.editDetail = detail;

            var modal = byId('calendarQuickCreateModal');
            if (!modal) throw new Error('일정 수정 모달을 찾을 수 없습니다.');

            populateEditForm(detail, options || {});
            renderScopeContext();
            modal.hidden = false;
            document.body.classList.add('moyo-quick-create-open');
            setTimeout(function () { byId('quickCreateTitleInput').focus(); }, 20);
            return detail;
        });
    }

    function close() {
        var modal = byId('calendarQuickCreateModal');
        if (!modal) return;
        modal.hidden = true;
        closeFloaters();
        document.body.classList.remove('moyo-quick-create-open');
    }
    function open(options) {
        state.options = Object.assign({ scopeType: 'PRIVATE', date: todayString() }, options || {});
        state.editMode = false;
        state.editEventId = null;
        state.editDetail = null;
        state.editOccurrenceDate = null;
        state.visibilityType = 'PRIVATE';
        setEditUi(false, false);
        var modal = byId('calendarQuickCreateModal');
        if (!modal) return;
        var date = state.options.date || state.options.startDate || todayString();
        byId('quickCreateTitleInput').value = '';
        byId('quickCreateStartDate').value = date;
        byId('quickCreateEndDate').value = state.options.endDate || date;
        setTimeInput(byId('quickCreateStartTime'), state.options.startTime || '09:00', '09:00');
        setTimeInput(byId('quickCreateEndTime'), state.options.endTime || addHour(state.options.startTime || '09:00'), '10:00');
        byId('quickCreateUseTime').checked = !state.options.allDay;
        byId('quickCreateLunar').value = 'N';
        byId('quickCreateRepeat').value = '';
        byId('quickCreateRepeatInterval').value = '1';
        byId('quickCreateRepeatUnit').value = 'WEEKLY';
        byId('quickCreateRepeatEndType').value = 'NONE';
        byId('quickCreateRepeatUntil').value = '';
        resetRepeatDays();
        byId('quickCreateTimezone').value = 'Asia/Seoul';
        byId('quickCreateReminder').value = '';
        setType('');
        syncLunarUi();
        document.querySelectorAll('.moyo-quick-select').forEach(function (select) { syncSelectButton(select.id); });
        state.attendees = [];
        state.attendeePermissions = {};
        state.recordTargetId = null;
        state.draftKey = null;
        state.recordCounts = { NOTE: 0, PHOTO: 0, FILE: 0, LINK: 0, LOCATION: 0 };
        syncRepeatCustom();
        renderAttendeeSummary();
        renderRecordCounts();
        syncUseTime();
        syncScopeUi();
        modal.hidden = false;
        document.body.classList.add('moyo-quick-create-open');
        setTimeout(function () { byId('quickCreateTitleInput').focus(); }, 20);
    }

    function buildUpdatePayload(draft) {
        var detail = state.editDetail || {};
        var payload = buildPayload(draft);

        payload.id = state.editEventId;
        payload.originalEventId = state.editEventId;
        payload.itemType = String(detailValue(detail, 'itemType', 'ITEM_TYPE') || payload.itemType || 'PRIVATE').toUpperCase();
        payload.wsId = detailValue(detail, 'wsId', 'WS_ID') || payload.wsId || null;
        payload.projId = detailValue(detail, 'projId', 'PROJ_ID') || payload.projId || null;
        payload.color = detailValue(detail, 'color', 'COLOR') || payload.color || null;
        // 수정 모달에서 사용자가 바꾼 공개 상태를 그대로 저장한다.
        // 기존 상세값으로 덮어쓰면 모요 공개 토글 변경이 반영되지 않는다.
        payload.isPrivate = draft.visibilityType === 'MOYO' ? 'N' : 'Y';
        payload.visibilityType = draft.visibilityType || 'PRIVATE';
        payload.locationText = detailValue(detail, 'locationText', 'LOCATION_TEXT') || null;
        payload.locationAddress = detailValue(detail, 'locationAddress', 'LOCATION_ADDRESS') || null;
        payload.locationLat = detailValue(detail, 'locationLat', 'LOCATION_LAT') || null;
        payload.locationLng = detailValue(detail, 'locationLng', 'LOCATION_LNG') || null;
        payload.locationPlaceId = detailValue(detail, 'locationPlaceId', 'LOCATION_PLACE_ID') || null;
        payload.descriptionText = detailValue(detail, 'descriptionText', 'DESCRIPTION_TEXT') || null;
        payload.recurGroupId = detailValue(detail, 'recurGroupId', 'RECUR_GROUP_ID') || null;
        payload.occurrenceDate = state.editOccurrenceDate || draft.startDate;
        payload.updateScope = byId('quickCreateUpdateScope') ? byId('quickCreateUpdateScope').value : 'ONE';

        return payload;
    }

    function saveEdit(draft) {
        return fetch(contextPath() + '/api/calendar/update-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(buildUpdatePayload(draft))
        }).then(function (response) {
            return response.text().then(function (text) {
                if (!response.ok) throw new Error(text || '수정 실패');
                return { success: true, eventId: state.editEventId, message: text || '수정되었습니다.' };
            });
        });
    }

    function save() {
        if (state.saving) return;
        var draft = collectDraft();
        var message = validate(draft);
        if (message) { alert(message); return; }

        state.saving = true;
        var button = byId('quickCreateSave');
        var editing = !!state.editMode;

        if (button) {
            button.disabled = true;
            button.textContent = editing ? '수정 중...' : '등록 중...';
        }

        var request = editing
            ? saveEdit(draft)
            : fetch(contextPath() + '/api/calendar/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(buildPayload(draft))
            }).then(function (response) {
                return response.text().then(function (text) {
                    var data = null;
                    try { data = JSON.parse(text); } catch (error) { data = null; }
                    if (!response.ok || data && data.success === false) {
                        throw new Error(data && data.message || text || '저장 실패');
                    }
                    return data || {};
                });
            });

        request.then(function (data) {
            var callback = state.options && state.options.onSaved;
            close();
            if (typeof callback === 'function') callback(data);
        }).catch(function (error) {
            alert(error.message || (editing ? '수정 실패' : '저장 실패'));
        }).finally(function () {
            state.saving = false;
            if (button) {
                button.disabled = false;
                button.textContent = editing ? '수정' : '등록';
            }
        });
    }
    function normalizeTimeInput(input) {
        var fallback = input.dataset.prevValue || (input.id === 'quickCreateEndTime' ? '10:00' : '09:00');
        var parsed = parseTime(input.value);
        if (!parsed) setTimeInput(input, fallback, fallback);
        else {
            var hour = parsed.hour;
            if (hour <= 12) {
                var meridiem = input.dataset.meridiem || (hour >= 12 ? 'PM' : 'AM');
                if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
                else hour = hour === 12 ? 12 : hour + 12;
            }
            setTimeInput(input, canonicalTime(hour, parsed.minute), fallback);
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function bind() {
        var modal = byId('calendarQuickCreateModal');
        if (!modal || modal.dataset.commonBound === 'true') return;
        modal.dataset.commonBound = 'true';
        initSelectMenus();
        initTypePicker();
        setType('');

        byId('quickCreateClose').addEventListener('click', close);
        byId('quickCreateSave').addEventListener('click', save);
        byId('quickCreateUseTime').addEventListener('change', syncUseTime);
        document.querySelectorAll('[data-lunar-value]').forEach(function (button) {
            button.addEventListener('click', function () {
                var select = byId('quickCreateLunar');
                if (!select) return;
                select.value = button.dataset.lunarValue === 'Y' ? 'Y' : 'N';
                syncLunarUi();
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
        if (byId('quickCreateLunar')) byId('quickCreateLunar').addEventListener('change', syncLunarUi);
        byId('quickCreateRepeat').addEventListener('change', syncRepeatCustom);
        byId('quickCreateRepeatUnit').addEventListener('change', syncRepeatCustom);
        byId('quickCreateRepeatEndType').addEventListener('change', syncRepeatCustom);
        if (byId('quickCreateMoyoPublic')) {
            byId('quickCreateMoyoPublic').addEventListener('change', function () {
                setVisibilityType(this.checked ? 'MOYO' : 'PRIVATE');
            });
        }
        document.querySelectorAll('[data-repeat-day]').forEach(function (button) {
            button.addEventListener('click', function () { button.classList.toggle('is-active'); });
        });
        byId('quickCreateAttendeeButton').addEventListener('click', openAttendeeSelector);
        var typeButton = byId('quickCreateTypeButton');
        var typePopover = byId('quickCreateTypePopover');
        var typeClose = byId('quickCreateTypeClose');
        if (typeButton && typePopover) {
            typeButton.addEventListener('click', function (event) {
                event.stopPropagation();
                var open = typePopover.hidden;
                closeFloaters('type');
                typePopover.hidden = !open;
                this.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
            typePopover.addEventListener('click', function (event) { event.stopPropagation(); });
        }
        if (typeClose) typeClose.addEventListener('click', closeTypePopover);

        document.querySelectorAll('[data-quick-date-picker]').forEach(function (input) {
            input.addEventListener('focus', function () { openDateMenu(input); });
            input.addEventListener('click', function (event) { event.stopPropagation(); openDateMenu(input); });
            input.addEventListener('blur', function () { setTimeout(function () { var parsed = parseDate(input.value); if (parsed) input.value = parsed.value; }, 120); });
            input.addEventListener('change', normalizeEnd);
        });
        document.querySelectorAll('.moyo-quick-date-trigger').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                openDateMenu(byId(button.dataset.quickDateTarget));
            });
        });
        document.querySelectorAll('[data-quick-time-picker]').forEach(function (input) {
            input.addEventListener('focus', function () { openTimeMenu(input); });
            input.addEventListener('click', function (event) { event.stopPropagation(); openTimeMenu(input); });
            input.addEventListener('blur', function () { setTimeout(function () { normalizeTimeInput(input); }, 120); });
            input.addEventListener('change', normalizeEnd);
        });
        document.querySelectorAll('.moyo-quick-time-trigger').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                openTimeMenu(byId(button.dataset.quickTimeTarget));
            });
        });

        modal.addEventListener('click', function (event) { if (event.target === modal) close(); });
        modal.querySelector('.moyo-quick-create-panel').addEventListener('click', function (event) {
            if (!event.target.closest('.moyo-quick-type-wrap')) closeTypePopover();
            if (!event.target.closest('[data-quick-select-wrap]')) closeSelectMenus();
            if (!event.target.closest('.moyo-quick-date-field')) closeDateMenu();
            if (!event.target.closest('.moyo-quick-time-field')) closeTimeMenu();
            event.stopPropagation();
        });
        document.addEventListener('click', function () { closeFloaters(); });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !modal.hidden) close();
        });
        window.addEventListener('resize', function () {
            if (state.dateInput && state.dateMenu && !state.dateMenu.hidden) positionMenu(state.dateMenu, state.dateInput.closest('.moyo-quick-date-field') || state.dateInput, 248, 288);
            if (state.timeInput && state.timeMenu && !state.timeMenu.hidden) positionMenu(state.timeMenu, state.timeInput.closest('.moyo-quick-time-field') || state.timeInput, 268, 276);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
    else bind();

    global.MoyoQuickCalendarCreate = { open: open, openEdit: openEdit, close: close, setTimeInput: setTimeInput, getTimeValue: getTimeValue, parseDate: parseDate };
})(window);
