/** MOYO 시간표 공통 그리드: 날짜형(DATE) / 요일형(WEEKDAY) */
(function(global) {
    'use strict';

    const DEFAULT_SNAP_MINUTES = 15;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeColumns(mode, columns) {
        return (columns || []).map(function(column, index) {
            const key = String(column.key != null ? column.key : (mode === 'WEEKDAY' ? index + 1 : ''));
            return {
                key: key,
                label: column.label || key,
                active: column.active !== false,
                today: column.today === true,
                weekend: column.weekend === true,
                sunday: column.sunday === true,
                saturday: column.saturday === true,
                className: column.className || ''
            };
        });
    }

    function getColumnAttribute(mode) {
        return mode === 'WEEKDAY' ? 'data-day-of-week' : 'data-date';
    }

    function getColumnClasses(column, type) {
        const classes = [];
        if (column.weekend) classes.push('weekend');
        if (column.sunday) classes.push('sunday');
        if (column.saturday) classes.push('saturday');
        if (column.today) classes.push(type === 'head' ? 'today-time-schedule-head' : 'today-time-schedule-slot');
        if (!column.active) classes.push('is-outside-range');
        if (column.className) classes.push(column.className);
        return classes.length ? ' ' + classes.join(' ') : '';
    }

    function buildHeader(options) {
        const mode = options.mode === 'WEEKDAY' ? 'WEEKDAY' : 'DATE';
        const columns = normalizeColumns(mode, options.columns);
        let html = '<div class="time-schedule-grid-header project-schedule-grid-header" data-grid-mode="' + mode + '" style="--day-count:' + columns.length + ';">';
        html += '<div class="time-schedule-cell time-schedule-head time-schedule-time-head" style="grid-column:1;">' + escapeHtml(options.timeHeaderLabel || '시간') + '</div>';
        columns.forEach(function(column, index) {
            html += '<div class="time-schedule-cell time-schedule-head' + getColumnClasses(column, 'head') + '" style="grid-column:' + (index + 2) + ';">' + escapeHtml(column.label) + '</div>';
        });
        html += '</div>';
        return html;
    }

    function buildBody(options) {
        const mode = options.mode === 'WEEKDAY' ? 'WEEKDAY' : 'DATE';
        const columns = normalizeColumns(mode, options.columns);
        const snapMinutes = Number(options.snapMinutes || DEFAULT_SNAP_MINUTES);
        const displayStartMinute = Math.max(0, Number(options.displayStartMinute || 0));
        const displayEndMinute = Math.min(24 * 60, Number(options.displayEndMinute || 24 * 60));
        const totalSlots = Math.max(0, Math.ceil((displayEndMinute - displayStartMinute) / snapMinutes));
        const keyAttribute = getColumnAttribute(mode);
        const nowMinute = options.nowMinute == null ? null : Number(options.nowMinute);

        let html = '<div class="time-schedule-grid-scroll project-schedule-grid-scroll" data-grid-mode="' + mode + '">';
        html += '<div class="time-schedule-grid project-schedule-grid" data-grid-mode="' + mode + '" style="--day-count:' + columns.length + '; --time-slot-count:' + totalSlots + ';">';

        for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
            const totalMinute = displayStartMinute + slotIndex * snapMinutes;
            const hour = Math.floor(totalMinute / 60);
            const minute = totalMinute % 60;
            const row = slotIndex + 1;
            const hourLabel = minute === 0 ? String(hour).padStart(2, '0') + ':00' : '';
            const subdivisionClass = minute === 0 ? ' is-hour-start' : (minute === 30 ? ' is-half-hour' : ' is-quarter-hour');
            html += '<div class="time-schedule-cell time-schedule-time' + subdivisionClass + '" style="grid-column:1; grid-row:' + row + ';">' + hourLabel + '</div>';

            columns.forEach(function(column, index) {
                const disabledAttr = column.active ? '' : ' data-disabled="true" aria-disabled="true"';
                let currentLineHtml = '';
                if (column.today && nowMinute != null && totalMinute <= nowMinute && totalMinute + snapMinutes > nowMinute) {
                    const topPercent = Math.max(0, Math.min(100, ((nowMinute - totalMinute) / snapMinutes) * 100));
                    currentLineHtml = '<span class="time-schedule-current-time-line" style="top:' + topPercent + '%;"></span>';
                }
                html += '<div class="time-schedule-cell time-schedule-slot' + getColumnClasses(column, 'slot') + subdivisionClass + '" '
                    + keyAttribute + '="' + escapeHtml(column.key) + '" data-minute="' + totalMinute + '" data-row="' + row + '" data-col="' + (index + 2) + '"'
                    + disabledAttr + ' style="grid-column:' + (index + 2) + '; grid-row:' + row + ';">' + currentLineHtml + '</div>';
            });
        }
        return html;
    }

    function closeBody() {
        return '</div></div>';
    }

    function getPlacement(options) {
        const snapMinutes = Number(options.snapMinutes || DEFAULT_SNAP_MINUTES);
        const displayStartMinute = Number(options.displayStartMinute || 0);
        const visibleStart = Math.max(displayStartMinute, Number(options.startMinute || 0));
        const visibleEnd = Math.min(Number(options.displayEndMinute || 24 * 60), Number(options.endMinute || 0));
        if (visibleEnd <= visibleStart) return null;
        return {
            column: Number(options.columnIndex || 0) + 2,
            rowStart: (visibleStart - displayStartMinute) / snapMinutes + 1,
            rowEnd: (visibleEnd - displayStartMinute) / snapMinutes + 1,
            visibleStart: visibleStart,
            visibleEnd: visibleEnd
        };
    }

    global.ProjectScheduleGrid = Object.freeze({
        buildHeader: buildHeader,
        buildBody: buildBody,
        closeBody: closeBody,
        getPlacement: getPlacement,
        getColumnAttribute: getColumnAttribute
    });
})(window);
