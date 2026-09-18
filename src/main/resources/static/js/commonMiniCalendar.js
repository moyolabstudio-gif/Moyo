(function (global) {
    'use strict';

    var calendarState = new WeakMap();

    function resolveElement(value) {
        return typeof value === 'string' ? document.getElementById(value) : value;
    }

    function toDate(value) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return new Date(value.getFullYear(), value.getMonth(), value.getDate());
        }
        if (!value) return null;
        var match = String(value).trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        if (!match) return null;
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    function formatDate(date) {
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    }

    function sameDate(left, right) {
        var a = toDate(left), b = toDate(right);
        return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
    }

    function inRange(date, startValue, endValue) {
        var target = toDate(date), start = toDate(startValue), end = toDate(endValue || startValue);
        return Boolean(target && start && end && target >= start && target <= end);
    }

    function normalizeItem(item) {
        if (!item || typeof item !== 'object') return null;
        var startDate = item.startDate || item.date;
        var endDate = item.endDate || startDate;
        if (!toDate(startDate)) return null;
        var original = item.original || item;
        var startTime = item.startTime || original.START_TIME || original.START_TM || original.startTime || original.startTm || '';
        var endTime = item.endTime || original.END_TIME || original.END_TM || original.endTime || original.endTm || '';
        var allDayValue = item.allDay;
        if (allDayValue == null) allDayValue = original.ALL_DAY;
        if (allDayValue == null) allDayValue = original.ALL_DAY_YN;
        if (allDayValue == null) allDayValue = original.IS_ALL_DAY;
        if (allDayValue == null) allDayValue = original.allDay;
        var allDay = allDayValue === true || allDayValue === 1 || String(allDayValue || '').toUpperCase() === 'Y';
        return {
            id: item.id == null ? '' : String(item.id),
            type: String(item.type || 'event').toLowerCase(),
            title: cleanDisplayText(item.title, '일정'),
            startDate: startDate,
            endDate: endDate,
            startTime: String(startTime || ''),
            endTime: String(endTime || ''),
            allDay: allDay,
            color: item.color || '',
            projectName: cleanDisplayText(item.projectName || original.projName || original.PROJ_NAME || original.projectName || original.PROJECT_NAME || '', ''),
            original: original
        };
    }


    function cleanDisplayText(value, fallback) {
        var text = value == null ? '' : String(value);
        if (text.indexOf('&') >= 0) {
            var textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            text = textarea.value;
        }
        text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
        if (typeof text.normalize === 'function') text = text.normalize('NFC');
        return text || fallback || '';
    }

    function hexToRgba(hex, alpha) {
        var color = String(hex || '').replace('#', '').trim();
        if (color.length === 3) color = color.split('').map(function (ch) { return ch + ch; }).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(color)) return 'rgba(74,144,226,' + alpha + ')';
        return 'rgba(' + parseInt(color.slice(0, 2), 16) + ',' + parseInt(color.slice(2, 4), 16) + ',' + parseInt(color.slice(4, 6), 16) + ',' + alpha + ')';
    }

    function itemsForDate(items, date) {
        return items.filter(function (item) { return inRange(date, item.startDate, item.endDate); });
    }


    function addDays(date, amount) {
        var result = toDate(date);
        if (!result) return null;
        result.setDate(result.getDate() + Number(amount || 0));
        return result;
    }

    function maxDate(left, right) {
        var a = toDate(left), b = toDate(right);
        if (!a) return b;
        if (!b) return a;
        return a > b ? a : b;
    }

    function minDate(left, right) {
        var a = toDate(left), b = toDate(right);
        if (!a) return b;
        if (!b) return a;
        return a < b ? a : b;
    }

    function hasProjectPeriodOnDate(model, date) {
        return (model.items || []).some(function (item) {
            return item.type === 'project-period' && inRange(date, item.startDate, item.endDate);
        });
    }

    function renderProjectPeriodBands() {
        /* Project periods are represented by one merged band per active date. */
    }

    function findRoot(grid) {
        return grid ? grid.closest('.moyo-mini-calendar') : null;
    }

    function weekdayLabel(date) {
        return ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][date.getDay()];
    }

    function normalizeClock(value) {
        var text = String(value || '').trim();
        if (!text) return '';
        var match = text.match(/(\d{1,2}):(\d{2})/);
        if (!match) return '';
        return String(Number(match[1])).padStart(2, '0') + ':' + match[2];
    }

    function itemTimeLabel(item) {
        var start = normalizeClock(item.startTime);
        var end = normalizeClock(item.endTime);
        if (item.allDay || (!start && !end)) return '종일';
        if (start && end) return start + ' - ' + end;
        return start || end;
    }

    function isMultiDay(item) {
        return Boolean(item && toDate(item.startDate) && toDate(item.endDate) && !sameDate(item.startDate, item.endDate));
    }

    function shortDateLabel(value) {
        var date = toDate(value);
        return date ? ((date.getMonth() + 1) + '월 ' + date.getDate() + '일') : '';
    }

    function itemMetaLabel(item) {
        if (item.type === 'project-period') {
            return shortDateLabel(item.startDate) + ' - ' + shortDateLabel(item.endDate);
        }
        var prefix = item.type === 'project' && item.projectName ? item.projectName + ' · ' : '';
        if (isMultiDay(item)) {
            return prefix + shortDateLabel(item.startDate) + ' - ' + shortDateLabel(item.endDate);
        }
        return prefix + itemTimeLabel(item);
    }

    function itemTypeLabel(item) {
        if (!item) return '일정';
        if (item.type === 'project-period') return '프로젝트 기간';
        if (item.type === 'time-plan') return '시간 계획';
        if (item.type === 'weekly-plan') return '주간 계획';
        if (item.type === 'project-task') return '업무';
        if (item.type === 'project') return '프로젝트 일정';
        return '일정';
    }

    function itemTypeClass(item) {
        if (!item) return 'project';
        if (item.type === 'time-plan') return 'time-plan';
        if (item.type === 'weekly-plan') return 'weekly-plan';
        if (item.type === 'project-period') return 'project-period';
        return 'project';
    }

    function renderSelected(root, model, date) {
        if (!root) return;
        var panel = root.querySelector('.moyo-calendar-selected');
        if (!panel) return;
        var list = panel.querySelector('.moyo-calendar-selected-list');
        var dateEl = panel.querySelector('.moyo-calendar-selected-date');
        var countEl = panel.querySelector('.moyo-calendar-selected-count');
        var matched = itemsForDate(model.items, date);

        dateEl.textContent = (date.getMonth() + 1) + '월 ' + date.getDate() + '일 · ' + weekdayLabel(date);
        countEl.textContent = matched.length ? matched.length + '개' : '';
        list.replaceChildren();

        if (!matched.length) {
            var empty = document.createElement('p');
            empty.className = 'moyo-calendar-selected-empty';
            empty.textContent = '등록된 일정이 없습니다.';
            list.appendChild(empty);
        } else {
            matched.forEach(function (item) {
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'moyo-calendar-selected-item is-' + itemTypeClass(item);
                var itemColor = item.color || (item.type === 'project' ? '#7A5CFF' : '#4A90E2');
                button.style.setProperty('--item-color', itemColor);
                button.style.setProperty('--item-soft-color', hexToRgba(itemColor, 0.10));
                button.style.setProperty('--item-soft-border', hexToRgba(itemColor, 0.24));

                var badge = document.createElement('span');
                badge.className = 'moyo-calendar-selected-type';
                badge.textContent = itemTypeLabel(item);
                var content = document.createElement('span');
                content.className = 'moyo-calendar-selected-content';
                var title = document.createElement('strong');
                title.textContent = item.title;
                var meta = document.createElement('span');
                meta.className = 'moyo-calendar-selected-time';
                meta.textContent = itemMetaLabel(item);
                content.append(title, meta);
                button.append(badge, content);
                button.addEventListener('click', function () {
                    if (typeof model.onItemClick === 'function') model.onItemClick(item, date);
                });
                list.appendChild(button);
            });
        }

        panel.hidden = false;
        panel.removeAttribute('hidden');
        root.classList.add('has-selected-date');
        root.dataset.selectedDate = formatDate(date);
        model.selectedDate = formatDate(date);
    }

    function decorateCell(cell, cellDate, model) {
        var range = model.range || null;
        if (range && inRange(cellDate, range.startDate, range.endDate)) {
            cell.classList.add('project-range-day');
            if (sameDate(cellDate, range.startDate)) cell.classList.add('project-start-day', 'project-boundary');
            if (sameDate(cellDate, range.endDate)) cell.classList.add('project-end-day', 'project-boundary');
        }

        var matched = itemsForDate(model.items, cellDate);
        var schedules = matched.filter(function (item) { return item.type !== 'project-task'; });
        var projectPeriods = schedules.filter(function (item) { return item.type === 'project-period'; });
        var pointSchedules = schedules.filter(function (item) { return item.type !== 'project-period'; });

        if (projectPeriods.length) {
            var periodColors = projectPeriods.map(function (item) {
                return item.color || '#7A5CFF';
            });
            var uniqueColors = periodColors.filter(function (color, index, list) {
                return list.indexOf(color) === index;
            });
            var previousDate = addDays(cellDate, -1);
            var nextDate = addDays(cellDate, 1);
            var connectsPrevious = cellDate.getDay() !== 0 && hasProjectPeriodOnDate(model, previousDate);
            var connectsNext = cellDate.getDay() !== 6 && hasProjectPeriodOnDate(model, nextDate);
            var background;

            if (uniqueColors.length === 1) {
                background = hexToRgba(uniqueColors[0], 0.22);
            } else {
                var segment = 100 / uniqueColors.length;
                var stops = [];
                uniqueColors.forEach(function (color, index) {
                    var start = (segment * index).toFixed(3);
                    var end = (segment * (index + 1)).toFixed(3);
                    var rgba = hexToRgba(color, 0.22);
                    stops.push(rgba + ' ' + start + '%', rgba + ' ' + end + '%');
                });
                background = 'linear-gradient(180deg, ' + stops.join(', ') + ')';
            }

            cell.classList.add('has-project-period');
            cell.style.setProperty('--project-period-background', background);
            cell.style.setProperty('--project-period-border', hexToRgba(uniqueColors[0], 0.34));
            if (!connectsPrevious) cell.classList.add('project-period-start');
            if (!connectsNext) cell.classList.add('project-period-end');
        }

        if (pointSchedules.length) {
            var color = pointSchedules[0].color || '#4A90E2';
            cell.classList.add('has-event', 'schedule-range-day');
            cell.style.setProperty('--schedule-solid', color);
            cell.style.setProperty('--schedule-bg', hexToRgba(color, 0.14));
            cell.style.setProperty('--schedule-border', hexToRgba(color, 0.32));
            if (pointSchedules.length > 1) cell.classList.add('has-multiple-schedules');
        }
        if (matched.length) cell.title = matched.map(function (item) { return item.title; }).join('\n');
    }

    function render(model) {
        model = model || {};
        var grid = resolveElement(model.grid), title = resolveElement(model.title);
        var currentDate = model.currentDate instanceof Date ? model.currentDate : new Date();
        if (!grid || !title) return [];

        var root = findRoot(grid);
        var year = currentDate.getFullYear(), month = currentDate.getMonth();
        var today = new Date();
        var items = (Array.isArray(model.items) ? model.items : []).map(normalizeItem).filter(Boolean);
        var previousModel = calendarState.get(grid) || {};
        var selectedDateValue = model.selectedDate || previousModel.selectedDate || (root && root.dataset.selectedDate) || '';
        var selectedDate = toDate(selectedDateValue);

        // 첫 진입 시 현재 월이라면 오늘을 기본 선택해 하단 일정 목록을 바로 보여준다.
        if (!selectedDate
            && today.getFullYear() === year
            && today.getMonth() === month) {
            selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        }
        var renderModel = Object.assign({}, previousModel, model, {
            items: items,
            selectedDate: selectedDate ? formatDate(selectedDate) : ''
        });
        var firstDay = new Date(year, month, 1).getDay();
        var lastDate = new Date(year, month + 1, 0).getDate();
        var weekRows = Math.ceil((firstDay + lastDate) / 7);
        var fragment = document.createDocumentFragment();
        var cells = [];

        title.textContent = year + '.' + String(month + 1).padStart(2, '0');
        grid.querySelectorAll('.day-num, .empty-slot').forEach(function (node) { node.remove(); });
        grid.dataset.weekRows = String(weekRows);
        grid.style.setProperty('--mini-calendar-week-rows', String(weekRows));

        for (var index = 0; index < weekRows * 7; index += 1) {
            var day = index - firstDay + 1;
            if (day < 1 || day > lastDate) {
                var empty = document.createElement('span');
                empty.className = 'empty-slot';
                empty.setAttribute('aria-hidden', 'true');
                fragment.appendChild(empty);
                continue;
            }

            var cellDate = new Date(year, month, day);
            var cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'day-num';
            cell.textContent = String(day);
            cell.dataset.date = formatDate(cellDate);
            cell.setAttribute('aria-label', (month + 1) + '월 ' + day + '일');
            if (cellDate.getDay() === 0) cell.classList.add('is-sunday');
            if (cellDate.getDay() === 6) cell.classList.add('is-saturday');
            if (sameDate(cellDate, today)) cell.classList.add('today');
            if (selectedDate && sameDate(cellDate, selectedDate)) cell.classList.add('is-selected');
            decorateCell(cell, cellDate, renderModel);
            cell.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var clicked = event.currentTarget;
                var clickedDate = toDate(clicked.dataset.date);
                if (!clickedDate) return;
                grid.querySelectorAll('.day-num.is-selected').forEach(function (node) { node.classList.remove('is-selected'); });
                clicked.classList.add('is-selected');
                renderModel.selectedDate = formatDate(clickedDate);
                calendarState.set(grid, renderModel);
                renderSelected(root, renderModel, clickedDate);
            });
            cells.push(cell);
            fragment.appendChild(cell);
        }

        grid.appendChild(fragment);
        renderProjectPeriodBands(grid, renderModel, year, month, firstDay, weekRows);
        calendarState.set(grid, renderModel);

        if (root) {
            var panel = root.querySelector('.moyo-calendar-selected');
            var selectedInCurrentMonth = selectedDate
                && selectedDate.getFullYear() === year
                && selectedDate.getMonth() === month;

            if (selectedInCurrentMonth) {
                renderSelected(root, renderModel, selectedDate);
            } else {
                root.classList.remove('has-selected-date');
                delete root.dataset.selectedDate;
                renderModel.selectedDate = '';
                if (panel) {
                    panel.hidden = true;
                    panel.setAttribute('hidden', 'hidden');
                }
            }
            calendarState.set(grid, renderModel);
        }
        return cells;
    }

    global.MoyoMiniCalendar = {render: render, renderMonth: render, toDate: toDate, formatDate: formatDate};
})(window);
