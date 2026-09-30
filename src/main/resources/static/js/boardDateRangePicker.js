(function () {
    'use strict';

    const instances = new Map();
    const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

    function normalizeDate(value) {
        if (!value) return '';
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
    }

    function toDate(value) {
        const normalized = normalizeDate(value);
        if (!normalized) return null;
        const [y, m, d] = normalized.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0, 0);
    }

    function formatValue(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatLabel(value) {
        const date = toDate(value);
        if (!date) return '';
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }

    function sameDay(a, b) {
        return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    }

    function makeButton(className, text, ariaLabel) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
        return button;
    }

    function create(instanceId, startInputId, endInputId) {
        const root = document.getElementById(instanceId);
        const startInput = document.getElementById(startInputId);
        const endInput = document.getElementById(endInputId);
        if (!root || !startInput || !endInput) return null;
        if (instances.has(instanceId)) return instances.get(instanceId);

        const trigger = root.querySelector('.board-date-range-trigger');
        const label = root.querySelector('.board-date-range-label');
        if (!trigger || !label) return null;

        const startValue = normalizeDate(startInput.value || root.dataset.start);
        const endValue = normalizeDate(endInput.value || root.dataset.end);
        startInput.value = startValue;
        endInput.value = endValue;

        const state = {
            id: instanceId,
            root,
            trigger,
            label,
            startInput,
            endInput,
            start: toDate(startValue),
            end: toDate(endValue),
            view: toDate(startValue || endValue) || startOfDay(new Date()),
            disabled: trigger.disabled,
            popover: null,
            title: null,
            grid: null,
            summary: null
        };

        buildPopover(state);
        bind(state);
        render(state);
        instances.set(instanceId, state);
        return state;
    }

    function buildPopover(state) {
        const popover = document.createElement('div');
        popover.className = 'board-date-range-popover';
        popover.hidden = true;
        popover.setAttribute('role', 'dialog');
        popover.setAttribute('aria-label', '공지 고정 기간 선택');

        const head = document.createElement('div');
        head.className = 'board-date-calendar-head';
        const title = document.createElement('div');
        title.className = 'board-date-calendar-title';
        const nav = document.createElement('div');
        nav.className = 'board-date-calendar-nav';
        const prev = makeButton('', '‹', '이전 달');
        const next = makeButton('', '›', '다음 달');
        nav.append(prev, next);
        head.append(title, nav);

        const weekdays = document.createElement('div');
        weekdays.className = 'board-date-weekdays';
        WEEKDAYS.forEach(day => {
            const span = document.createElement('span');
            span.textContent = day;
            weekdays.appendChild(span);
        });

        const grid = document.createElement('div');
        grid.className = 'board-date-grid';

        const foot = document.createElement('div');
        foot.className = 'board-date-calendar-foot';
        const clearBtn = makeButton('board-date-calendar-action is-clear', '지우기');
        const todayBtn = makeButton('board-date-calendar-action', '오늘');
        foot.append(clearBtn, todayBtn);

        popover.append(head, weekdays, grid, foot);
        state.root.appendChild(popover);
        state.popover = popover;
        state.title = title;
        state.grid = grid;

        prev.addEventListener('click', () => {
            state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1, 12);
            render(state);
        });
        next.addEventListener('click', () => {
            state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1, 12);
            render(state);
        });
        clearBtn.addEventListener('click', () => clearState(state));
        todayBtn.addEventListener('click', () => {
            const today = startOfDay(new Date());
            state.start = today;
            state.end = today;
            state.view = today;
            commit(state);
            render(state);
        });
    }

    function bind(state) {
        state.trigger.addEventListener('click', () => {
            if (state.disabled) return;
            toggle(state);
        });

        document.addEventListener('pointerdown', event => {
            if (!state.root.contains(event.target)) close(state);
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') close(state);
        });
    }

    function toggle(state) {
        state.popover.hidden ? open(state) : close(state);
    }

    function open(state) {
        if (state.disabled) return;
        for (const other of instances.values()) {
            if (other !== state) close(other);
        }
        state.popover.hidden = false;
        state.root.classList.add('is-open');
        state.trigger.setAttribute('aria-expanded', 'true');
        render(state);
    }

    function close(state) {
        if (!state || !state.popover || state.popover.hidden) return;
        state.popover.hidden = true;
        state.root.classList.remove('is-open');
        state.trigger.setAttribute('aria-expanded', 'false');
    }

    function render(state) {
        state.title.textContent = `${state.view.getFullYear()}년 ${state.view.getMonth() + 1}월`;
        state.grid.innerHTML = '';

        const first = new Date(state.view.getFullYear(), state.view.getMonth(), 1, 12);
        const gridStart = new Date(first);
        gridStart.setDate(first.getDate() - first.getDay());
        const today = startOfDay(new Date());

        for (let index = 0; index < 42; index++) {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + index);
            const button = makeButton('board-date-cell', '');
            const span = document.createElement('span');
            span.textContent = date.getDate();
            button.appendChild(span);
            button.dataset.date = formatValue(date);
            button.setAttribute('aria-label', `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`);

            if (date.getMonth() !== state.view.getMonth()) button.classList.add('is-other');
            if (sameDay(date, today)) button.classList.add('is-today');
            if (sameDay(date, state.start)) button.classList.add('is-start');
            if (sameDay(date, state.end)) button.classList.add('is-end');
            if (state.start && state.end && date >= state.start && date <= state.end) button.classList.add('is-range');

            button.addEventListener('click', () => selectDate(state, date));
            state.grid.appendChild(button);
        }

        updateLabel(state);
    }

    function selectDate(state, date) {
        const selected = startOfDay(date);
        if (!state.start || state.end) {
            state.start = selected;
            state.end = null;
        } else if (selected < state.start) {
            state.start = selected;
            state.end = null;
        } else {
            state.end = selected;
        }
        state.view = selected;
        commit(state);
        render(state);
        if (state.start && state.end) {
            window.setTimeout(() => close(state), 120);
        }
    }

    function commit(state) {
        state.startInput.value = state.start ? formatValue(state.start) : '';
        state.endInput.value = state.end ? formatValue(state.end) : '';
        updateLabel(state);
        state.startInput.dispatchEvent(new Event('change', { bubbles: true }));
        state.endInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function updateLabel(state) {
        const start = state.start ? formatLabel(formatValue(state.start)) : '';
        const end = state.end ? formatLabel(formatValue(state.end)) : '';
        if (start && end) {
            state.label.textContent = `${start} - ${end}`;
        } else if (start) {
            state.label.textContent = `${start}부터`;
        } else {
            state.label.textContent = '기간을 선택하세요';
        }
    }

    function clearState(state) {
        state.start = null;
        state.end = null;
        commit(state);
        render(state);
    }

    function setDisabled(id, disabled) {
        const state = instances.get(id);
        if (!state) return;
        state.disabled = !!disabled;
        state.trigger.disabled = state.disabled;
        state.root.classList.toggle('is-disabled', state.disabled);
        if (state.disabled) close(state);
    }

    function clear(id) {
        const state = instances.get(id);
        if (!state) return;
        clearState(state);
    }

    window.MoyoDateRangePicker = { create, setDisabled, clear };
})();
