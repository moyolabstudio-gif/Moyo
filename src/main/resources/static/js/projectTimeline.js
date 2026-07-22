/**
 * MOYO 프로젝트 타임라인
 *
 * 간트차트, 주간계획표, 프로젝트 일정 등록/수정/삭제를 담당합니다.
 * 기존 전역 함수 호출 구조는 유지합니다.
 */

let currentScheduleId = null;

const defaultScheduleColorPalette = [
            '#4A90E2',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#EC4899',
            '#14B8A6',
            '#64748B'
        ];

        let scheduleColorPalette = loadScheduleColorPalette();

        function getScheduleColorStorageKey() {
            const projId = new URLSearchParams(window.location.search).get('projId') || 'default';
            return 'moyo.schedule.colors.' + projId;
        }

        function loadScheduleColorPalette() {
            try {
                const saved = localStorage.getItem('moyo.schedule.colors.' + (new URLSearchParams(window.location.search).get('projId') || 'default'));
                const parsed = saved ? JSON.parse(saved) : null;

                if (Array.isArray(parsed) && parsed.length > 0) {
                    return Array.from(new Set(defaultScheduleColorPalette.concat(parsed)));
                }
            } catch (e) {
                console.warn('일정 색상 팔레트 로드 실패', e);
            }

            return defaultScheduleColorPalette.slice();
        }

        function saveScheduleColorPalette() {
            try {
                localStorage.setItem(getScheduleColorStorageKey(), JSON.stringify(scheduleColorPalette));
            } catch (e) {
                console.warn('일정 색상 팔레트 저장 실패', e);
            }
        }

        function normalizeScheduleColor(color) {
            if (!color) return '#4A90E2';
            return color.trim().toUpperCase();
        }

        function addSchedulePaletteColor(color) {
            const normalized = normalizeScheduleColor(color);

            if (!scheduleColorPalette.map(c => c.toUpperCase()).includes(normalized)) {
                scheduleColorPalette.push(normalized);
                saveScheduleColorPalette();
                renderScheduleColorChips();
            }

            return normalized;
        }

        function getNextScheduleColor() {
            const usedCount = (projectCalendarSchedules || []).length;
            if (!scheduleColorPalette || scheduleColorPalette.length === 0) {
                scheduleColorPalette = defaultScheduleColorPalette.slice();
            }
            return scheduleColorPalette[usedCount % scheduleColorPalette.length];
        }

        function buildScheduleColorChips(targetId, isEditMode) {
            const target = document.getElementById(targetId);
            if (!target) return;

            const chipClass = isEditMode ? 'schedule-color-chip edit-schedule-color-chip' : 'schedule-color-chip';

            let html = '';

            scheduleColorPalette.forEach(color => {
                html += '<button type="button" class="' + chipClass + '" data-color="' + color + '" onclick="' + (isEditMode ? 'selectEditScheduleColor' : 'selectScheduleColor') + '(\'' + color + '\')" style="background:' + color + ';" title="' + color + '"></button>';
            });

            html +=
                '<label class="schedule-color-custom" title="색상 추가">+' +
                    '<input type="color" onchange="' + (isEditMode ? 'addCustomScheduleColor(this.value, true)' : 'addCustomScheduleColor(this.value, false)') + '">' +
                '</label>';

            target.innerHTML = html;
        }

        function renderScheduleColorChips() {
            buildScheduleColorChips('scheduleColorRow', false);
            buildScheduleColorChips('editScheduleColorRow', true);
        }

        function applyScheduleColorSelection(color, isEditMode) {
            const normalized = normalizeScheduleColor(color);
            const inputId = isEditMode ? 'editScheduleColor' : 'scheduleColor';
            const chipSelector = isEditMode ? '.edit-schedule-color-chip' : '#scheduleColorRow .schedule-color-chip';

            const input = document.getElementById(inputId);
            if (input) input.value = normalized;

            document.querySelectorAll(chipSelector).forEach(chip => {
                chip.classList.toggle('active', normalizeScheduleColor(chip.dataset.color) === normalized);
            });
        }

        function addCustomScheduleColor(color, isEditMode) {
            const addedColor = addSchedulePaletteColor(color);
            renderScheduleColorChips();
            applyScheduleColorSelection(addedColor, isEditMode);
        }

function getScheduleStatusText(status) {
            if (status === 'DONE') return '완료';
            if (status === 'IN_PROGRESS') return '진행 중';
            return '예정';
        }

        function getScheduleStatusClass(status) {
            if (status === 'DONE') return 'done';
            if (status === 'IN_PROGRESS') return 'progress';
            return '';
        }




        let ganttDragStartDate = null;
        let ganttDragEndDate = null;
        let ganttDragRowKey = null;
        let isGanttDragging = false;

        let currentGanttScale = 'DAY';
        let selectedGanttScale = 'AUTO';
        let currentGanttRangeStart = null;
        let currentGanttRangeEnd = null;
        let currentGanttTicks = [];
        let ganttBarDragState = null;
        let suppressGanttBarClick = false;

        let weeklyScheduleDragState = null;
        let weeklyScheduleEventDragState = null;
        let suppressWeeklyScheduleClick = false;
        let weeklyDawnExpanded = false;











        document.addEventListener('mouseup', function() {
            if (isGanttDragging) {
                const startDate = ganttDragStartDate;
                const endDate = ganttDragEndDate;

                isGanttDragging = false;
                ganttDragStartDate = null;
                ganttDragEndDate = null;
                ganttDragRowKey = null;

                clearGanttDragSelection();

                if (startDate && endDate) {
                    openAddScheduleModalWithDates(startDate, endDate);
                }
            }
        });



        function getTimeParts(value, fallback) {
            const normalized = normalizeScheduleTime(value, fallback || '09:00');
            const parts = normalized.split(':');
            return {
                hour: parts[0] || '09',
                minute: parts[1] || '00'
            };
        }

        function buildScheduleTimeSplitOptions(baseId, fallback) {
            const hourEl = document.getElementById(baseId + 'Hour');
            const minuteEl = document.getElementById(baseId + 'Minute');
            const hiddenEl = document.getElementById(baseId);

            if (!hourEl || !minuteEl || !hiddenEl) return;

            if (!hourEl.options || hourEl.options.length === 0) {
                let hourHtml = '';
                for (let hour = 0; hour < 24; hour++) {
                    const value = String(hour).padStart(2, '0');
                    hourHtml += '<option value="' + value + '">' + value + '</option>';
                }
                hourEl.innerHTML = hourHtml;
            }

            if (!minuteEl.options || minuteEl.options.length === 0) {
                let minuteHtml = '';
                for (let minute = 0; minute < 60; minute += 10) {
                    const value = String(minute).padStart(2, '0');
                    minuteHtml += '<option value="' + value + '">' + value + '</option>';
                }
                minuteEl.innerHTML = minuteHtml;
            }

            setScheduleTimeSplitValue(baseId, hiddenEl.value || fallback || '09:00');
        }

        function setScheduleTimeSplitValue(baseId, value) {
            const hourEl = document.getElementById(baseId + 'Hour');
            const minuteEl = document.getElementById(baseId + 'Minute');
            const hiddenEl = document.getElementById(baseId);

            if (!hourEl || !minuteEl || !hiddenEl) return;

            const parts = getTimeParts(value, hiddenEl.value || '09:00');
            hourEl.value = parts.hour;

            // 10분 단위로 정규화
            const rawMinute = parseInt(parts.minute, 10);
            const normalizedMinute = String(Math.max(0, Math.min(50, Math.round((isNaN(rawMinute) ? 0 : rawMinute) / 10) * 10))).padStart(2, '0');
            minuteEl.value = normalizedMinute;

            hiddenEl.value = hourEl.value + ':' + minuteEl.value;
        }

        function syncScheduleTimeSplitValue(baseId) {
            const hourEl = document.getElementById(baseId + 'Hour');
            const minuteEl = document.getElementById(baseId + 'Minute');
            const hiddenEl = document.getElementById(baseId);

            if (!hourEl || !minuteEl || !hiddenEl) return;

            hiddenEl.value = hourEl.value + ':' + minuteEl.value;
        }

        function normalizeScheduleTimeInputValue(inputEl, fallback) {
            if (!inputEl) return;

            if (inputEl.type === 'hidden') {
                setScheduleTimeSplitValue(inputEl.id, inputEl.value || fallback || '09:00');
                return;
            }

            const normalized = normalizeScheduleTime(inputEl.value, fallback);
            if (inputEl.value !== normalized) {
                inputEl.value = normalized;
            }
        }

        function bindScheduleTimeInputNormalization() {
            [
                { id: 'scheduleStartTime', fallback: '09:00' },
                { id: 'scheduleEndTime', fallback: '18:00' },
                { id: 'editScheduleStartTime', fallback: '09:00' },
                { id: 'editScheduleEndTime', fallback: '18:00' }
            ].forEach(function(item) {
                const hiddenEl = document.getElementById(item.id);
                const hourEl = document.getElementById(item.id + 'Hour');
                const minuteEl = document.getElementById(item.id + 'Minute');

                if (!hiddenEl || !hourEl || !minuteEl) return;

                buildScheduleTimeSplitOptions(item.id, item.fallback);

                if (hiddenEl.dataset.timeNormalizeBound === 'Y') return;
                hiddenEl.dataset.timeNormalizeBound = 'Y';

                [hourEl, minuteEl].forEach(function(el) {
                    el.addEventListener('change', function() {
                        syncScheduleTimeSplitValue(item.id);
                    });
                });
            });
        }

        function toggleScheduleTimeFields(enabled, isEditMode) {
            const prefix = isEditMode ? 'editSchedule' : 'schedule';
            const useTimeEl = document.getElementById(prefix + 'UseTime');
            const startTimeEl = document.getElementById(prefix + 'StartTime');
            const endTimeEl = document.getElementById(prefix + 'EndTime');

            if (useTimeEl) useTimeEl.checked = !!enabled;

            bindScheduleTimeInputNormalization();

            [startTimeEl, endTimeEl].forEach(function(el) {
                if (!el) return;

                const hourEl = document.getElementById(el.id + 'Hour');
                const minuteEl = document.getElementById(el.id + 'Minute');

                if (hourEl) hourEl.disabled = !enabled;
                if (minuteEl) minuteEl.disabled = !enabled;
            });
        }











        function shiftDateByDays(dateStr, days) {
            const date = parseProjectDate(dateStr);
            if (!date) return dateStr;
            date.setDate(date.getDate() + days);
            return formatProjectDate(date);
        }


        function getGanttCellStartDate(cell) {
            if (!cell) return null;
            return cell.dataset.startDate || cell.dataset.date || null;
        }

        function getGanttCellEndDate(cell) {
            if (!cell) return null;
            return cell.dataset.endDate || cell.dataset.date || null;
        }

        function getPointerCellInTrack(event, track) {
            if (!track) return null;

            const hoveredCell = event.target.closest('.gantt-cell[data-row-key]');
            if (hoveredCell && track.contains(hoveredCell)) {
                return hoveredCell;
            }

            const cells = Array.from(track.querySelectorAll('.gantt-cell[data-row-key]'));
            if (cells.length === 0) return null;

            const rect = track.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / Math.max(rect.width, 1);

            let index = Math.floor(ratio * cells.length);
            index = Math.max(0, Math.min(index, cells.length - 1));

            return cells[index];
        }

        function getPointerRangeInTrack(event, track) {
            const cell = getPointerCellInTrack(event, track);
            if (!cell) return null;

            return {
                startDate: getGanttCellStartDate(cell),
                endDate: getGanttCellEndDate(cell),
                startTime: getGanttCellStartTime(cell),
                endTime: getGanttCellEndTime(cell)
            };
        }

        function clearGanttDragSelection() {
            document.querySelectorAll('.gantt-cell.drag-selecting, .gantt-cell.drag-start, .gantt-cell.drag-end')
                .forEach(cell => {
                    cell.classList.remove('drag-selecting', 'drag-start', 'drag-end');
                });
        }

        function getOrderedDateRange(dateA, dateB) {
            const start = parseProjectDate(dateA);
            const end = parseProjectDate(dateB);

            if (!start || !end) {
                return { startDate: dateA, endDate: dateB };
            }

            if (start <= end) {
                return { startDate: dateA, endDate: dateB };
            }

            return { startDate: dateB, endDate: dateA };
        }

        function highlightGanttDragRange(startDate, endDate) {
            clearGanttDragSelection();

            if (!startDate || !endDate || !ganttDragRowKey) return;

            const range = getOrderedDateRange(startDate, endDate);
            const start = parseProjectDate(range.startDate);
            const end = parseProjectDate(range.endDate);

            document.querySelectorAll('.gantt-cell[data-row-key="' + ganttDragRowKey + '"]').forEach(cell => {
                const cellStart = parseProjectDate(getGanttCellStartDate(cell));
                const cellEnd = parseProjectDate(getGanttCellEndDate(cell));

                if (!cellStart || !cellEnd) return;

                if (cellStart <= end && cellEnd >= start) {
                    cell.classList.add('drag-selecting');
                }

                if (getGanttCellStartDate(cell) === range.startDate || getGanttCellEndDate(cell) === range.startDate) {
                    cell.classList.add('drag-start');
                }

                if (getGanttCellStartDate(cell) === range.endDate || getGanttCellEndDate(cell) === range.endDate) {
                    cell.classList.add('drag-end');
                }
            });
        }

        function openAddScheduleModalWithDates(startDate, endDate, startTime, endTime) {
            const range = getOrderedDateRange(startDate, endDate);
            const hasTime = !!(startTime || endTime);

            openAddScheduleModal();

            document.getElementById('scheduleStartDate').value = range.startDate;
            document.getElementById('scheduleEndDate').value = range.endDate;

            if (hasTime) {
                document.getElementById('scheduleStartTime').value = normalizeScheduleTime(startTime, '09:00');
                document.getElementById('scheduleEndTime').value = normalizeScheduleTime(endTime, '18:00');
            }

            toggleScheduleTimeFields(hasTime, false);

            setTimeout(() => {
                const titleInput = document.getElementById('scheduleTitle');
                if (titleInput) titleInput.focus();
            }, 80);
        }

        function startGanttDrag(event, startDate, endDate, rowKey) {
            if (!startDate || !endDate || !rowKey) return;

            event.preventDefault();
            event.stopPropagation();

            isGanttDragging = true;
            ganttDragStartDate = startDate;
            ganttDragEndDate = endDate;
            ganttDragRowKey = rowKey;

            highlightGanttDragRange(ganttDragStartDate, ganttDragEndDate);
        }

        function moveGanttDrag(event, startDate, endDate, rowKey) {
            if (!isGanttDragging || !startDate || !endDate || !rowKey) return;
            if (rowKey !== ganttDragRowKey) return;

            event.preventDefault();

            const currentStart = parseProjectDate(startDate);
            const dragStart = parseProjectDate(ganttDragStartDate);

            if (currentStart && dragStart && currentStart < dragStart) {
                ganttDragStartDate = startDate;
            }

            ganttDragEndDate = endDate;
            highlightGanttDragRange(ganttDragStartDate, ganttDragEndDate);
        }

        function endGanttDrag(event, startDate, endDate) {
            if (!isGanttDragging) return;

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (startDate && endDate) {
                const currentStart = parseProjectDate(startDate);
                const dragStart = parseProjectDate(ganttDragStartDate);

                if (currentStart && dragStart && currentStart < dragStart) {
                    ganttDragStartDate = startDate;
                }

                ganttDragEndDate = endDate;
            }

            const finalStartDate = ganttDragStartDate;
            const finalEndDate = ganttDragEndDate;

            isGanttDragging = false;
            ganttDragStartDate = null;
            ganttDragEndDate = null;
            ganttDragRowKey = null;

            clearGanttDragSelection();

            if (finalStartDate && finalEndDate) {
                openAddScheduleModalWithDates(finalStartDate, finalEndDate, getGanttCellStartTime(event ? event.target.closest('.gantt-cell') : null), getGanttCellEndTime(event ? event.target.closest('.gantt-cell') : null));
            }
        }

        document.addEventListener('mouseup', function() {
            if (isGanttDragging) {
                const startDate = ganttDragStartDate;
                const endDate = ganttDragEndDate;

                isGanttDragging = false;
                ganttDragStartDate = null;
                ganttDragEndDate = null;
                ganttDragRowKey = null;

                clearGanttDragSelection();

                if (startDate && endDate) {
                    openAddScheduleModalWithDates(startDate, endDate);
                }
            }
        });


        function normalizeScheduleTime(value, fallback) {
            const raw = String(value || '').trim();
            if (/^\d{2}:\d{2}$/.test(raw)) return raw;
            if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw.substring(0, 5);
            return fallback || '09:00';
        }

        function isScheduleTimeEnabled(schedule) {
            if (!schedule) return false;
            return String(schedule.USE_TIME || schedule.useTime || '').toUpperCase() === 'Y';
        }

        function parseProjectDateTime(dateStr, timeStr, isEnd) {
            const date = parseProjectDate(dateStr);
            if (!date) return null;

            const time = normalizeScheduleTime(timeStr, isEnd ? '23:59' : '00:00');
            const parts = time.split(':');
            date.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, isEnd ? 59 : 0, 0);
            return date;
        }

        function formatProjectDateTimeValue(date) {
            return formatProjectDate(date) + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        }

        function getScheduleStartDateTime(schedule) {
            const startDate = schedule.START_DATE || schedule.startDate;
            if (isScheduleTimeEnabled(schedule)) {
                return parseProjectDateTime(startDate, schedule.START_TIME || schedule.startTime, false);
            }
            return parseProjectDateTime(startDate, '00:00', false);
        }

        function getScheduleEndDateTime(schedule) {
            const endDate = schedule.END_DATE || schedule.endDate || schedule.START_DATE || schedule.startDate;
            if (isScheduleTimeEnabled(schedule)) {
                return parseProjectDateTime(endDate, schedule.END_TIME || schedule.endTime, true);
            }
            return parseProjectDateTime(endDate, '23:59', true);
        }

        function getGanttCellStartTime(cell) {
            return cell ? (cell.dataset.startTime || '') : '';
        }

        function getGanttCellEndTime(cell) {
            return cell ? (cell.dataset.endTime || '') : '';
        }


        function bindGanttDragHandlers() {
            const target = document.getElementById('projectGanttPreview');
            if (!target) return;

            target.onmousedown = function(event) {
                const cell = event.target.closest('.gantt-cell[data-row-key]');
                if (!cell || !target.contains(cell)) return;
                startGanttDrag(event, getGanttCellStartDate(cell), getGanttCellEndDate(cell), cell.dataset.rowKey);
            };

            target.onmouseover = function(event) {
                const cell = event.target.closest('.gantt-cell[data-row-key]');
                if (!cell || !target.contains(cell)) return;
                moveGanttDrag(event, getGanttCellStartDate(cell), getGanttCellEndDate(cell), cell.dataset.rowKey);
            };

            target.onmouseup = function(event) {
                const cell = event.target.closest('.gantt-cell[data-row-key]');
                if (!cell || !target.contains(cell)) return;
                if (cell.dataset.rowKey !== ganttDragRowKey) return;
                endGanttDrag(event, getGanttCellStartDate(cell), getGanttCellEndDate(cell));
            };
        }

        function findScheduleById(scheduleId) {
            const idStr = String(scheduleId);
            return (projectCalendarSchedules || []).find(schedule => {
                const id = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
                return String(id) === idStr;
            });
        }

        function getDayDiff(start, end) {
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.round((end - start) / oneDay);
        }

        function getShiftedScheduleRange(originalStart, originalEnd, pointerStartDate, pointerCurrentDate) {
            const originalStartDate = parseProjectDate(originalStart);
            const originalEndDate = parseProjectDate(originalEnd);
            const pointerStart = parseProjectDate(pointerStartDate);
            const pointerCurrent = parseProjectDate(pointerCurrentDate);

            if (!originalStartDate || !originalEndDate || !pointerStart || !pointerCurrent) {
                return { startDate: originalStart, endDate: originalEnd };
            }

            const duration = getDayDiff(originalStartDate, originalEndDate);
            const delta = getDayDiff(pointerStart, pointerCurrent);

            let newStart = addDays(originalStartDate, delta);
            let newEnd = addDays(originalEndDate, delta);

            const rangeStart = parseProjectDate(currentGanttRangeStart);
            const rangeEnd = parseProjectDate(currentGanttRangeEnd);

            if (rangeStart && newStart < rangeStart) {
                newStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
                newEnd = addDays(newStart, duration);
            }

            if (rangeEnd && newEnd > rangeEnd) {
                newEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
                newStart = addDays(newEnd, -duration);
            }

            return {
                startDate: formatProjectDate(newStart),
                endDate: formatProjectDate(newEnd)
            };
        }

        function findTickColumnByDate(dateStr) {
            const date = parseProjectDate(dateStr);
            if (!date || !currentGanttTicks || currentGanttTicks.length === 0) return 1;

            for (let i = 0; i < currentGanttTicks.length; i++) {
                const tickStart = parseProjectDate(currentGanttTicks[i].startDate);
                const tickEnd = parseProjectDate(currentGanttTicks[i].endDate);

                if (tickStart && tickEnd && date >= tickStart && date <= tickEnd) {
                    return i + 1;
                }
            }

            return 1;
        }



        function applyGanttBarPosition(barEl, startDate, endDate, startTime, endTime, useTime) {
            if (!barEl) return;

            const tickCount = currentGanttTicks && currentGanttTicks.length > 0
                ? currentGanttTicks.length
                : document.querySelectorAll('.gantt-date-cell').length;

            if (!tickCount) return;

            let startColumn;
            let endColumn;

            startColumn = findTickColumnByDate(startDate);
            endColumn = findTickColumnByDate(endDate);

            if (endColumn < startColumn) endColumn = startColumn;

            let spanColumn = Math.max(endColumn - startColumn + 1, 1);

            startColumn = Math.max(1, Math.min(startColumn, tickCount));
            spanColumn = Math.max(1, Math.min(spanColumn, tickCount - startColumn + 1));

            barEl.style.gridColumn = startColumn + ' / span ' + spanColumn;
            barEl.title = barEl.dataset.title + ' · ' + startDate + (useTime ? ' ' + startTime : '') + ' ~ ' + endDate + (useTime ? ' ' + endTime : '');
        }

        function startGanttBarDrag(event, scheduleId, mode) {
            const schedule = findScheduleById(scheduleId);
            if (!schedule) return;

            const barEl = event.currentTarget.closest('.gantt-bar');
            const track = barEl.closest('.gantt-track');
            const pointerRange = getPointerRangeInTrack(event, track);

            if (!pointerRange) return;

            event.preventDefault();
            event.stopPropagation();

            ganttBarDragState = {
                mode: mode || 'MOVE',
                scheduleId: scheduleId,
                schedule: schedule,
                barEl: barEl,
                track: track,
                pointerStartDate: pointerRange.startDate,
                pointerEndDate: pointerRange.endDate,
                originalStart: schedule.START_DATE || schedule.startDate,
                originalEnd: schedule.END_DATE || schedule.endDate,
                newStart: schedule.START_DATE || schedule.startDate,
                newEnd: schedule.END_DATE || schedule.endDate,
                newStartTime: pointerRange.startTime || schedule.START_TIME || schedule.startTime || '09:00',
                newEndTime: pointerRange.endTime || schedule.END_TIME || schedule.endTime || '18:00',
                moved: false
            };

            barEl.classList.add('dragging');
        }

        function moveGanttBarDrag(event) {
            if (!ganttBarDragState) return;

            const pointerRange = getPointerRangeInTrack(event, ganttBarDragState.track);
            if (!pointerRange) return;

            event.preventDefault();

            let range;

            if (ganttBarDragState.mode === 'MOVE') {
                range = getShiftedScheduleRange(
                    ganttBarDragState.originalStart,
                    ganttBarDragState.originalEnd,
                    ganttBarDragState.pointerStartDate,
                    pointerRange.startDate
                );
            } else if (ganttBarDragState.mode === 'RESIZE_START') {
                const originalEndDate = parseProjectDate(ganttBarDragState.originalEnd);
                const pointer = parseProjectDate(pointerRange.startDate);
                const rangeStart = parseProjectDate(currentGanttRangeStart);

                let newStart = pointer;

                if (rangeStart && newStart < rangeStart) newStart = rangeStart;
                if (originalEndDate && newStart > originalEndDate) newStart = originalEndDate;

                range = {
                    startDate: formatProjectDate(newStart),
                    endDate: ganttBarDragState.originalEnd
                };
            } else if (ganttBarDragState.mode === 'RESIZE_END') {
                const originalStartDate = parseProjectDate(ganttBarDragState.originalStart);
                const pointer = parseProjectDate(pointerRange.endDate);
                const rangeEnd = parseProjectDate(currentGanttRangeEnd);

                let newEnd = pointer;

                if (rangeEnd && newEnd > rangeEnd) newEnd = rangeEnd;
                if (originalStartDate && newEnd < originalStartDate) newEnd = originalStartDate;

                range = {
                    startDate: ganttBarDragState.originalStart,
                    endDate: formatProjectDate(newEnd)
                };
            } else {
                return;
            }

            const nextStartTime = currentGanttScale === 'HOUR'
                ? (pointerRange.startTime || ganttBarDragState.newStartTime || '09:00')
                : (ganttBarDragState.newStartTime || '');
            const nextEndTime = currentGanttScale === 'HOUR'
                ? (pointerRange.endTime || ganttBarDragState.newEndTime || '18:00')
                : (ganttBarDragState.newEndTime || '');

            if (
                range.startDate !== ganttBarDragState.newStart ||
                range.endDate !== ganttBarDragState.newEnd ||
                nextStartTime !== ganttBarDragState.newStartTime ||
                nextEndTime !== ganttBarDragState.newEndTime
            ) {
                ganttBarDragState.moved = true;
            }

            ganttBarDragState.newStart = range.startDate;
            ganttBarDragState.newEnd = range.endDate;
            ganttBarDragState.newStartTime = nextStartTime;
            ganttBarDragState.newEndTime = nextEndTime;

            applyGanttBarPosition(ganttBarDragState.barEl, range.startDate, range.endDate, nextStartTime, nextEndTime, currentGanttScale === 'HOUR');
        }

        function finishGanttBarDrag() {
            if (!ganttBarDragState) return;

            const drag = ganttBarDragState;
            ganttBarDragState = null;

            if (drag.barEl) {
                drag.barEl.classList.remove('dragging');
            }

            if (!drag.moved) return;

            suppressGanttBarClick = true;
            setTimeout(() => {
                suppressGanttBarClick = false;
            }, 250);

            const params = new URLSearchParams();
            params.append('scheduleId', drag.scheduleId);
            params.append('title', drag.schedule.TITLE || drag.schedule.title || '');
            params.append('startDate', drag.newStart);
            params.append('endDate', drag.newEnd);
            params.append('status', drag.schedule.STATUS || drag.schedule.status || 'TODO');

            const dragUseTime = isScheduleTimeEnabled(drag.schedule);
            params.append('useTime', dragUseTime ? 'Y' : 'N');
            if (dragUseTime) {
                params.append('startTime', drag.newStartTime || drag.schedule.START_TIME || drag.schedule.startTime || '09:00');
                params.append('endTime', drag.newEndTime || drag.schedule.END_TIME || drag.schedule.endTime || '18:00');
            }

            params.append('color', drag.schedule.COLOR || drag.schedule.color || '#4A90E2');

            fetch('/project/api/update-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 기간 수정 실패');
                    loadProjectSchedules();
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
                loadProjectSchedules();
            });
        }

        function handleGanttBarClick(event, scheduleId) {
            event.stopPropagation();

            if (suppressGanttBarClick) return;

            openScheduleDetailModal(scheduleId);
        }

        document.addEventListener('mousemove', moveGanttBarDrag);
        document.addEventListener('mouseup', finishGanttBarDrag);

        function addDays(date, days) {
            const copied = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            copied.setDate(copied.getDate() + days);
            return copied;
        }

        function addMonths(date, months) {
            return new Date(date.getFullYear(), date.getMonth() + months, 1);
        }

        function getDateDiffInclusive(start, end) {
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.floor((end - start) / oneDay) + 1;
        }

        function getMonthDiffInclusive(start, end) {
            return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        }

        function getKoreanWeekday(date) {
            if (!date) return '';
            return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
        }

        function formatGanttDate(date) {
            return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + getKoreanWeekday(date);
        }

        function formatGanttMonth(date) {
            return date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, '0');
        }

        function isWeekendDate(date) {
            if (!date) return false;
            const day = date.getDay();
            return day === 0 || day === 6;
        }


        function getAutoGanttScale(totalDays) {
            if (totalDays <= 8) {
                return { type: 'HOUR', label: '자동 · 시간별' };
            }

            if (totalDays <= 30) {
                return { type: 'DAY', label: '자동 · 일 단위' };
            }

            if (totalDays <= 90) {
                return { type: 'WEEK', label: '자동 · 주 단위' };
            }

            return { type: 'MONTH', label: '자동 · 월 단위' };
        }

        function getGanttScale(totalDays) {
            if (selectedGanttScale === 'HOUR') {
                return { type: 'HOUR', label: '시간별' };
            }

            if (selectedGanttScale === 'DAY') {
                return { type: 'DAY', label: '일 단위' };
            }

            if (selectedGanttScale === 'WEEK') {
                return { type: 'WEEK', label: '주 단위' };
            }

            if (selectedGanttScale === 'MONTH') {
                return { type: 'MONTH', label: '월 단위' };
            }

            return getAutoGanttScale(totalDays);
        }

        function setProjectTimelineScale(scaleType) {
            selectedGanttScale = scaleType || 'AUTO';

            try {
                localStorage.setItem(getProjectTimelineScaleStorageKey(), selectedGanttScale);
                localStorage.removeItem('projectTimelineScale'); // 예전 전역 키 제거
            } catch (e) {
                // localStorage 사용 불가 환경은 무시
            }

            updateProjectTimelineScaleButtons();

            if (typeof renderProjectGantt === 'function') {
                renderProjectGantt(projectCalendarSchedules || []);
            }
        }

        function updateProjectTimelineScaleButtons(activeScale) {
            const scaleToMark = activeScale || selectedGanttScale;
            document.querySelectorAll('.timeline-scale-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.scale === scaleToMark);
            });
        }

        function getProjectTimelineScaleStorageKey() {
            const projId = new URLSearchParams(window.location.search).get('projId') || 'default';
            return 'projectTimelineScale.' + projId;
        }

        function restoreProjectTimelineScale() {
            // 기본 진입은 항상 AUTO.
            // 이전 테스트 중 localStorage에 DAY/WEEK 등이 남아 있으면 3일 프로젝트도 계속 일간으로 뜨는 문제가 생김.
            selectedGanttScale = 'AUTO';

            try {
                localStorage.removeItem('projectTimelineScale'); // 예전 전역 키 제거
            } catch (e) {
                // localStorage 사용 불가 환경은 무시
            }

            updateProjectTimelineScaleButtons();
        }

        function buildGanttTicks(rangeStart, rangeEnd, scale) {
            const ticks = [];

            if (scale.type === 'HOUR') {
                const totalDays = getDateDiffInclusive(rangeStart, rangeEnd);
                const timeSlots = [
                    { label: '09시', startTime: '09:00', endTime: '11:59' },
                    { label: '12시', startTime: '12:00', endTime: '14:59' },
                    { label: '15시', startTime: '15:00', endTime: '17:59' },
                    { label: '18시', startTime: '18:00', endTime: '23:59' }
                ];

                for (let i = 0; i < totalDays; i++) {
                    const date = addDays(rangeStart, i);
                    const day = date.getDay();

                    timeSlots.forEach(function(slot) {
                        ticks.push({
                            label: formatGanttDate(date),
                            timeLabel: slot.label,
                            start: date,
                            end: date,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            isSaturday: day === 6,
                            isSunday: day === 0,
                            isWeekend: day === 0 || day === 6
                        });
                    });
                }
            } else if (scale.type === 'DAY') {
                const totalDays = getDateDiffInclusive(rangeStart, rangeEnd);
                for (let i = 0; i < totalDays; i++) {
                    const start = addDays(rangeStart, i);
                    const end = start;
                    const day = start.getDay();
                    ticks.push({
                        label: formatGanttDate(start),
                        start: start,
                        end: end,
                        isSaturday: day === 6,
                        isSunday: day === 0,
                        isWeekend: day === 0 || day === 6
                    });
                }
            } else if (scale.type === 'WEEK') {
                let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
                let weekNo = 1;

                while (cursor <= rangeEnd) {
                    const tickStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
                    const tickEnd = addDays(tickStart, 6);
                    const safeEnd = tickEnd > rangeEnd ? rangeEnd : tickEnd;

                    ticks.push({
                        label: weekNo + '주차',
                        start: tickStart,
                        end: safeEnd
                    });

                    cursor = addDays(tickStart, 7);
                    weekNo++;
                }
            } else {
                let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);

                while (cursor <= rangeEnd) {
                    const tickStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
                    const tickEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
                    const safeStart = tickStart < rangeStart ? rangeStart : tickStart;
                    const safeEnd = tickEnd > rangeEnd ? rangeEnd : tickEnd;

                    ticks.push({
                        label: formatGanttMonth(cursor),
                        start: safeStart,
                        end: safeEnd
                    });

                    cursor = addMonths(cursor, 1);
                }
            }

            return ticks;
        }




        function formatWeeklyHourTime(hour) {
            return String(hour).padStart(2, '0') + ':00';
        }

        function addHoursToDate(date, hours) {
            const copied = new Date(date.getTime());
            copied.setHours(copied.getHours() + hours);
            return copied;
        }

        function formatProjectTime(date) {
            return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        }

        function getWeeklySlotInfo(el) {
            if (!el) return null;
            return {
                date: el.dataset.date,
                hour: parseInt(el.dataset.hour, 10),
                row: parseInt(el.dataset.row, 10),
                col: parseInt(el.dataset.col, 10)
            };
        }

        function getWeeklySlotFromPoint(clientX, clientY) {
            const el = document.elementFromPoint(clientX, clientY);
            if (!el) return null;

            const slot = el.closest('.weekly-schedule-slot[data-date][data-hour]');
            if (slot) return slot;

            const grid = el.closest('.weekly-schedule-grid');
            if (!grid) return null;

            const slots = Array.from(grid.querySelectorAll('.weekly-schedule-slot[data-date][data-hour]'));
            if (slots.length === 0) return null;

            let nearest = null;
            let nearestDistance = Infinity;

            slots.forEach(function(candidate) {
                const rect = candidate.getBoundingClientRect();

                if (
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom
                ) {
                    nearest = candidate;
                    nearestDistance = 0;
                    return;
                }

                const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
                const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
                const distance = dx * dx + dy * dy;

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearest = candidate;
                }
            });

            return nearest;
        }


        function clearWeeklyScheduleDragSelection() {
            document.querySelectorAll('.weekly-schedule-slot.drag-selecting, .weekly-schedule-slot.drag-start, .weekly-schedule-slot.drag-end')
                .forEach(function(slot) {
                    slot.classList.remove('drag-selecting', 'drag-start', 'drag-end');
                });
        }

        function clearWeeklyDropTarget() {
            document.querySelectorAll('.weekly-schedule-slot.drop-target')
                .forEach(function(slot) {
                    slot.classList.remove('drop-target');
                });
        }

        function updateWeeklyDragPreview(event, text) {
            let preview = document.getElementById('weeklyDragPreview');
            if (!preview) {
                preview = document.createElement('div');
                preview.id = 'weeklyDragPreview';
                preview.className = 'weekly-drag-preview';
                document.body.appendChild(preview);
            }

            preview.textContent = text || '';
            preview.style.left = event.clientX + 'px';
            preview.style.top = event.clientY + 'px';
        }

        function clearWeeklyDragPreview() {
            const preview = document.getElementById('weeklyDragPreview');
            if (preview) preview.remove();
            clearWeeklyDropTarget();
        }

        function getWeeklyDragLabel(info, mode) {
            if (!info) return '';
            const dateText = info.date ? info.date.substring(5).replace('-', '/') : '';
            const timeText = formatWeeklyHourTime(info.hour);
            if (mode === 'RESIZE_START') return '시작 ' + dateText + ' ' + timeText;
            if (mode === 'RESIZE_END') return '종료 ' + dateText + ' ' + timeText;
            return '이동 ' + dateText + ' ' + timeText;
        }

        function markWeeklyDropTarget(slot) {
            clearWeeklyDropTarget();
            if (slot) slot.classList.add('drop-target');
        }


        function getOrderedWeeklySlotRange(a, b) {
            if (!a || !b) return null;

            const startDt = parseProjectDateTime(a.date, formatWeeklyHourTime(a.hour), false);
            const endDt = parseProjectDateTime(b.date, formatWeeklyHourTime(b.hour), false);

            if (!startDt || !endDt) return null;

            const first = startDt <= endDt ? a : b;
            const last = startDt <= endDt ? b : a;

            return { first: first, last: last };
        }

        function highlightWeeklyScheduleRange(startInfo, endInfo) {
            clearWeeklyScheduleDragSelection();

            const range = getOrderedWeeklySlotRange(startInfo, endInfo);
            if (!range) return;

            const firstDt = parseProjectDateTime(range.first.date, formatWeeklyHourTime(range.first.hour), false);
            const lastEndDt = parseProjectDateTime(range.last.date, formatWeeklyHourTime(range.last.hour + 1), true);

            document.querySelectorAll('.weekly-schedule-slot[data-date][data-hour]').forEach(function(slot) {
                const info = getWeeklySlotInfo(slot);
                if (!info) return;

                const slotStart = parseProjectDateTime(info.date, formatWeeklyHourTime(info.hour), false);
                const slotEnd = parseProjectDateTime(info.date, formatWeeklyHourTime(info.hour + 1), true);

                if (slotStart && slotEnd && slotStart < lastEndDt && slotEnd > firstDt) {
                    slot.classList.add('drag-selecting');
                }

                if (info.date === range.first.date && info.hour === range.first.hour) {
                    slot.classList.add('drag-start');
                }

                if (info.date === range.last.date && info.hour === range.last.hour) {
                    slot.classList.add('drag-end');
                }
            });
        }

        function openAddScheduleModalWithWeeklyRange(startInfo, endInfo) {
            const range = getOrderedWeeklySlotRange(startInfo, endInfo);
            if (!range) return;

            const startDate = range.first.date;
            const endDate = range.last.date;
            const startTime = formatWeeklyHourTime(range.first.hour);
            const endTime = formatWeeklyHourTime(Math.min(range.last.hour + 1, 23));

            openAddScheduleModalWithDates(startDate, endDate, startTime, endTime);
        }

        function findScheduleByIdSafe(scheduleId) {
            return findScheduleById(scheduleId);
        }


        function updateScheduleByWeeklyDrop(schedule, dropInfo, mode) {
            if (!schedule || !dropInfo) return;

            const scheduleId = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
            const title = schedule.TITLE || schedule.title || '';
            const status = schedule.STATUS || schedule.status || 'TODO';
            const color = schedule.COLOR || schedule.color || '#4A90E2';
            const dragMode = mode || 'MOVE';

            const originalStart = getScheduleStartDateTime(schedule);
            const originalEnd = getScheduleEndDateTime(schedule);
            const dropStart = parseProjectDateTime(dropInfo.date, formatWeeklyHourTime(dropInfo.hour), false);
            const dropEnd = parseProjectDateTime(dropInfo.date, formatWeeklyHourTime(Math.min(dropInfo.hour + 1, 23)), true);

            if (!originalStart || !originalEnd || !dropStart || !dropEnd) return;

            let newStart = new Date(originalStart.getTime());
            let newEnd = new Date(originalEnd.getTime());

            if (dragMode === 'RESIZE_START') {
                newStart = dropStart;

                if (newStart >= newEnd) {
                    newStart = addHoursToDate(newEnd, -1);
                }
            } else if (dragMode === 'RESIZE_END') {
                newEnd = addHoursToDate(dropStart, 1);

                if (newEnd <= newStart) {
                    newEnd = addHoursToDate(newStart, 1);
                }
            } else {
                const durationMs = Math.max(60 * 60 * 1000, originalEnd - originalStart);
                newStart = dropStart;
                newEnd = new Date(newStart.getTime() + durationMs);
            }

            const params = new URLSearchParams();
            params.append('scheduleId', scheduleId);
            params.append('title', title);
            params.append('startDate', formatProjectDate(newStart));
            params.append('endDate', formatProjectDate(newEnd));
            params.append('status', status);
            params.append('useTime', 'Y');
            params.append('startTime', formatProjectTime(newStart));
            params.append('endTime', formatProjectTime(newEnd));
            params.append('color', color);

            fetch('/project/api/update-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(function(res) { return res.text(); })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    loadProjectSchedules();
                } else {
                    alert('일정 시간 수정 실패');
                    loadProjectSchedules();
                }
            })
            .catch(function(err) {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
                loadProjectSchedules();
            });
        }

        function bindWeeklyScheduleDragHandlers() {
            const target = document.getElementById('projectGanttPreview');
            if (!target || currentGanttScale !== 'HOUR') return;

            target.onmousedown = null;
            target.onmousemove = null;
            target.onmouseover = null;
            target.onmouseup = null;

            target.onclick = function(event) {
                const eventCard = event.target.closest('.weekly-schedule-event[data-schedule-id]');
                if (eventCard && target.contains(eventCard)) {
                    event.preventDefault();
                    event.stopPropagation();

                    const scheduleId = eventCard.dataset.scheduleId;
                    if (scheduleId) openScheduleDetailModal(scheduleId);
                    return;
                }

                const slot = event.target.closest('.weekly-schedule-slot[data-date][data-hour]');
                if (!slot || !target.contains(slot)) return;

                event.preventDefault();
                event.stopPropagation();

                const info = getWeeklySlotInfo(slot);
                openAddScheduleModalWithWeeklyRange(info, info);
            };
        }

        document.addEventListener('mousemove', function(event) {
            if (!weeklyScheduleEventDragState) return;

            const dx = Math.abs(event.clientX - weeklyScheduleEventDragState.startX);
            const dy = Math.abs(event.clientY - weeklyScheduleEventDragState.startY);

            if (dx > 4 || dy > 4) {
                weeklyScheduleEventDragState.moved = true;
                const slot = getWeeklySlotFromPoint(event.clientX, event.clientY);
                weeklyScheduleEventDragState.currentSlot = slot;

                if (slot) {
                    markWeeklyDropTarget(slot);
                    updateWeeklyDragPreview(event, getWeeklyDragLabel(getWeeklySlotInfo(slot), weeklyScheduleEventDragState.mode));
                }
            }
        });

        document.addEventListener('mouseup', function() {
            if (weeklyScheduleEventDragState && weeklyScheduleEventDragState.card) {
                weeklyScheduleEventDragState.card.classList.remove('dragging');
            }
            weeklyScheduleEventDragState = null;
            clearWeeklyDragPreview();
        });

        function buildWeeklyScheduleDays(rangeStart, rangeEnd) {
            const days = [];
            if (!rangeStart || !rangeEnd) return days;

            const totalDays = Math.min(getDateDiffInclusive(rangeStart, rangeEnd), 7);
            for (let i = 0; i < totalDays; i++) {
                const date = addDays(rangeStart, i);
                days.push({
                    date: formatProjectDate(date),
                    label: formatGanttDate(date),
                    day: date.getDay(),
                    weekend: date.getDay() === 0 || date.getDay() === 6
                });
            }

            return days;
        }

        function getWeeklyScheduleHour(timeValue, fallback) {
            const time = normalizeScheduleTime(timeValue, fallback || '09:00');
            const hour = parseInt(time.substring(0, 2), 10);
            if (isNaN(hour)) return fallback === '18:00' ? 18 : 9;
            return Math.max(0, Math.min(23, hour));
        }

        // 종료 시각은 해당 시각 직전까지 차지하므로 끝 행을 배타적으로 계산한다.
        // 예: 07:00~08:00은 07시 한 칸만 사용하고, 08:00 일정과 겹치지 않는다.
        function getWeeklyScheduleEndHour(timeValue, fallback) {
            const time = normalizeScheduleTime(timeValue, fallback || '18:00');
            const hour = parseInt(time.substring(0, 2), 10);
            const minute = parseInt(time.substring(3, 5), 10);

            if (isNaN(hour)) return fallback === '18:00' ? 18 : 9;

            const normalizedMinute = isNaN(minute) ? 0 : minute;
            const exclusiveHour = hour + (normalizedMinute > 0 ? 1 : 0);
            return Math.max(1, Math.min(24, exclusiveHour));
        }


        function hasWeeklyDawnSchedule(timeSchedules) {
            return (timeSchedules || []).some(function(schedule) {
                const startTime = normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00');
                const endTime = normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00');
                const startHour = parseInt(startTime.substring(0, 2), 10);
                const endHour = parseInt(endTime.substring(0, 2), 10);
                return (!isNaN(startHour) && startHour < 4) || (!isNaN(endHour) && endHour <= 4);
            });
        }

        function toggleWeeklyDawnRows() {
            weeklyDawnExpanded = !weeklyDawnExpanded;
            document.querySelectorAll('.weekly-dawn-row').forEach(function(el) {
                el.classList.toggle('weekly-dawn-row-hidden', !weeklyDawnExpanded);
            });

            const btn = document.getElementById('weeklyDawnToggleBtn');
            if (btn) {
                btn.innerText = weeklyDawnExpanded ? '새벽 시간 접기' : '새벽 시간 더보기';
            }
        }


        function getWeeklyCurrentTimeLineHtml(days, startHour, endHour) {
            const now = new Date();
            const today = formatProjectDate(now);
            const dayIndex = days.findIndex(function(day) {
                return day.date === today;
            });

            if (dayIndex < 0) return '';

            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            if (currentHour < startHour || currentHour > endHour) return '';

            const topPercent = Math.max(0, Math.min(100, (currentMinute / 60) * 100));
            return '<span class="weekly-current-time-line" style="top:' + topPercent + '%;"></span>';
        }

        function renderWeeklyScheduleTable(schedules, rangeStart, rangeEnd, targetEl) {
            const target = targetEl || document.getElementById('projectGanttPreview');
            if (!target) return;

            schedules = schedules || [];
            const days = buildWeeklyScheduleDays(rangeStart, rangeEnd);

            if (days.length === 0 || days.length > 7) {
                target.innerHTML = '<div class="weekly-schedule-empty">주간 일정표는 프로젝트 기간이 1주 이내일 때 표시됩니다.</div>';
                return;
            }

            const timeSchedules = schedules.filter(function(schedule) {
                const startDate = schedule.START_DATE || schedule.startDate || '';
                const endDate = schedule.END_DATE || schedule.endDate || startDate;
                return isScheduleTimeEnabled(schedule)
                    && days.some(function(day) { return day.date >= startDate && day.date <= endDate; });
            });

            const startHour = 0;
            const endHour = 23;
            const shouldShowDawnByDefault = weeklyDawnExpanded || hasWeeklyDawnSchedule(timeSchedules);
            const rowCount = endHour - startHour + 1;

            let html = '<div class="weekly-schedule-table-wrap">';
            html += '<div class="weekly-schedule-title">⏰ 주간 시간표 <span>(' + timeSchedules.length + ')</span><span class="weekly-schedule-drag-guide">빈 칸 드래그: 등록 · 일정 드래그: 시간 이동</span></div>';
            html += '<div class="weekly-schedule-grid" style="--day-count:' + days.length + ';">';

            html += '<div class="weekly-schedule-cell weekly-schedule-head weekly-schedule-time-head" style="grid-column:1; grid-row:1;">시간</div>';

            days.forEach(function(day, idx) {
                const isToday = day.date === formatProjectDate(new Date());
                const weekendHeadClass = day.weekend ? ' weekend ' + (day.day === 0 ? 'sunday' : 'saturday') : '';
                const todayHeadClass = isToday ? ' today-weekly-head' : '';
                html += '<div class="weekly-schedule-cell weekly-schedule-head' + weekendHeadClass + todayHeadClass + '" style="grid-column:' + (idx + 2) + '; grid-row:1;">'
                    + day.label
                    + ''
                    + '</div>';
            });

            for (let hour = startHour; hour <= endHour; hour++) {
                const row = hour - startHour + 2;
                const dawnClass = hour < 4 ? ' weekly-dawn-row' + (shouldShowDawnByDefault ? '' : ' weekly-dawn-row-hidden') : '';
                html += '<div class="weekly-schedule-cell weekly-schedule-time' + dawnClass + '" style="grid-column:1; grid-row:' + row + ';">' + String(hour).padStart(2, '0') + ':00</div>';

                days.forEach(function(day, idx) {
                    const isToday = day.date === formatProjectDate(new Date());
                    const weekendSlotClass = day.weekend ? ' weekend ' + (day.day === 0 ? 'sunday' : 'saturday') : '';
                    const todaySlotClass = isToday ? ' today-weekly-slot' : '';
                    const currentLineHtml = isToday && hour === new Date().getHours() ? getWeeklyCurrentTimeLineHtml(days, startHour, endHour) : '';
                    html += '<div class="weekly-schedule-cell weekly-schedule-slot' + weekendSlotClass + todaySlotClass + dawnClass + '" data-date="' + day.date + '" data-hour="' + hour + '" data-row="' + row + '" data-col="' + (idx + 2) + '" style="grid-column:' + (idx + 2) + '; grid-row:' + row + ';">' + currentLineHtml + '</div>';
                });
            }

            timeSchedules.forEach(function(schedule) {
                const scheduleId = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
                const title = schedule.TITLE || schedule.title || '제목 없음';
                const startDate = schedule.START_DATE || schedule.startDate || '';
                const endDate = schedule.END_DATE || schedule.endDate || startDate;
                const startTime = normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00');
                const endTime = normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00');
                const color = schedule.COLOR || schedule.color || '#4A90E2';

                days.forEach(function(day, idx) {
                    if (day.date < startDate || day.date > endDate) return;

                    const isFirstDay = day.date === startDate;
                    const isLastDay = day.date === endDate;

                    const eventStartHour = isFirstDay ? getWeeklyScheduleHour(startTime, '09:00') : startHour;
                    const eventEndHour = isLastDay ? getWeeklyScheduleEndHour(endTime, '18:00') : endHour + 1;
                    const safeStart = Math.max(startHour, Math.min(endHour, eventStartHour));
                    const safeEnd = Math.max(safeStart + 1, Math.min(endHour + 1, eventEndHour));

                    const col = idx + 2;
                    const rowStart = safeStart - startHour + 2;
                    const rowEnd = safeEnd - startHour + 2;

                    html += '<div class="weekly-schedule-event" data-schedule-id="' + scheduleId + '" onclick="if (!suppressWeeklyScheduleClick) openScheduleDetailModal(' + scheduleId + ')" '
                        + 'style="grid-column:' + col + '; grid-row:' + rowStart + ' / ' + rowEnd + '; background:' + color + ';" '
                        + 'title="' + safeTaskHtml(title) + ' · ' + startTime + ' ~ ' + endTime + '">'
                        + '<span class="weekly-schedule-event-title">' + safeTaskHtml(title) + '</span>'
                        + '</div>';
                });
            });

            html += '</div>';
            if (!hasWeeklyDawnSchedule(timeSchedules)) {
                html += '<button type="button" id="weeklyDawnToggleBtn" class="weekly-dawn-toggle" onclick="toggleWeeklyDawnRows()">' + (weeklyDawnExpanded ? '새벽 시간 접기' : '새벽 시간 더보기') + '</button>';
            }
            html += '</div>';
            target.innerHTML = html;
            bindWeeklyScheduleDragHandlers();
        }


        function renderProjectGantt(schedules) {
            const target = document.getElementById('projectGanttPreview');
            const scaleBadge = document.getElementById('ganttScaleBadge');

            if (!target) return;

            schedules = schedules || [];
            let rangeStart = parseProjectDate(window.PROJECT_MAIN_CONFIG.projectStartDate);
            let rangeEnd = parseProjectDate(window.PROJECT_MAIN_CONFIG.projectEndDate);

            schedules.forEach(schedule => {
                const start = parseProjectDate(schedule.START_DATE || schedule.startDate);
                const end = parseProjectDate(schedule.END_DATE || schedule.endDate);
                if (!start || !end) return;

                if (!rangeStart || start < rangeStart) rangeStart = start;
                if (!rangeEnd || end > rangeEnd) rangeEnd = end;
            });

            if (!rangeStart || !rangeEnd) {
                target.className = 'gantt-box';
                target.innerHTML = '<div class="gantt-empty">프로젝트 기간 정보가 없습니다.</div>';
                if (scaleBadge) scaleBadge.innerText = '기간 없음';
                return;
            }

            const totalDays = Math.max(getDateDiffInclusive(rangeStart, rangeEnd), 1);
            const scale = getGanttScale(totalDays);
            updateProjectTimelineScaleButtons(scale.type);

            if (scale.type === 'HOUR') {
                currentGanttScale = 'HOUR';
                currentGanttRangeStart = formatProjectDate(rangeStart);
                currentGanttRangeEnd = formatProjectDate(rangeEnd);
                currentGanttTicks = [];
                target.className = 'gantt-box weekly-schedule-mode';
                renderWeeklyScheduleTable(schedules, rangeStart, rangeEnd, target);
                if (scaleBadge) scaleBadge.innerText = scale.label;
                return;
            }

            const ticks = buildGanttTicks(rangeStart, rangeEnd, scale);
            const tickCount = Math.max(ticks.length, 1);

            currentGanttScale = scale.type;
            currentGanttRangeStart = formatProjectDate(rangeStart);
            currentGanttRangeEnd = formatProjectDate(rangeEnd);
            currentGanttTicks = ticks.map(tick => ({
                startDate: formatProjectDate(tick.start),
                endDate: formatProjectDate(tick.end),
                startTime: tick.startTime || '',
                endTime: tick.endTime || '',
                isSaturday: (scale.type === 'DAY' || scale.type === 'HOUR') && (tick.isSaturday || tick.start.getDay() === 6),
                isSunday: (scale.type === 'DAY' || scale.type === 'HOUR') && (tick.isSunday || tick.start.getDay() === 0),
                isWeekend: (scale.type === 'DAY' || scale.type === 'HOUR') && (tick.isWeekend || tick.start.getDay() === 0 || tick.start.getDay() === 6)
            }));

            if (scaleBadge) scaleBadge.innerText = scale.label;

            target.className = 'gantt-box' + (scale.type === 'DAY' ? '' : ' gantt-scrollable');

            let tickMinWidth = 0;
            if (scale.type === 'WEEK') tickMinWidth = 70;
            if (scale.type === 'MONTH') tickMinWidth = 90;

            let dateColumnTemplate = 'repeat(' + tickCount + ', minmax(0, 1fr))';
            if (tickMinWidth > 0) {
                dateColumnTemplate = 'repeat(' + tickCount + ', minmax(' + tickMinWidth + 'px, 1fr))';
            }

            const fullGridTemplate = '130px ' + dateColumnTemplate;
            const todayString = formatProjectDate(new Date());

            function buildCells(rowKey) {
                let cells = '';

                currentGanttTicks.forEach(tick => {
                    const todayClass = todayString >= tick.startDate && todayString <= tick.endDate ? ' today-gantt-cell' : '';
                    const weekendClass = tick.isSunday ? ' sunday-gantt-cell' : (tick.isSaturday ? ' saturday-gantt-cell' : '');
                    const cellColumn = currentGanttTicks.indexOf(tick) + 1;
                    cells += '<div class="gantt-cell' + todayClass + weekendClass + '" data-start-date="' + tick.startDate + '" data-end-date="' + tick.endDate + '" data-start-time="' + (tick.startTime || '') + '" data-end-time="' + (tick.endTime || '') + '" data-row-key="' + rowKey + '" data-tick-index="' + cellColumn + '" style="grid-column:' + cellColumn + ';"></div>';
                });

                return cells;
            }

            function findTickColumnByDateTime(dateStr, timeStr, isEnd) {
                if (scale.type !== 'HOUR') {
                    return findTickColumnByDate(dateStr);
                }

                const target = parseProjectDateTime(dateStr, timeStr || (isEnd ? '23:59' : '00:00'), isEnd);
                if (!target || !currentGanttTicks || currentGanttTicks.length === 0) return 1;

                for (let i = 0; i < currentGanttTicks.length; i++) {
                    const tick = currentGanttTicks[i];
                    const tickStart = parseProjectDateTime(tick.startDate, tick.startTime || '00:00', false);
                    const tickEnd = parseProjectDateTime(tick.endDate, tick.endTime || '23:59', true);

                    if (tickStart && tickEnd && target >= tickStart && target <= tickEnd) {
                        return i + 1;
                    }
                }

                return isEnd ? currentGanttTicks.length : 1;
            }

            function getBarGridStyle(startDate, startTime, endDate, endTime, useTime) {
                let startColumn;
                let endColumn;

                startColumn = findTickColumnByDate(startDate);
                endColumn = findTickColumnByDate(endDate);

                if (endColumn < startColumn) endColumn = startColumn;

                const spanColumn = Math.max(endColumn - startColumn + 1, 1);

                return 'grid-column:' + startColumn + ' / span ' + spanColumn + ';';
            }

            let html = '<div class="gantt-inner">';

            html += '<div class="gantt-header-row" style="grid-template-columns:' + fullGridTemplate + ';">';
            html += '<div class="gantt-label-spacer"></div>';

            currentGanttTicks.forEach((tick, index) => {
                const isTodayInTick = todayString >= tick.startDate && todayString <= tick.endDate;
                const todayClass = isTodayInTick ? ' today-gantt-header' : '';
                const weekendClass = tick.isSunday ? ' sunday-gantt-header' : (tick.isSaturday ? ' saturday-gantt-header' : '');

                let tickLabelHtml = '<span class="tick-main">' + ticks[index].label + '</span>';

                if (scale.type !== 'DAY') {
                    tickLabelHtml += '<span class="tick-range">' + tick.startDate.substring(5).replace('-', '/') + '~' + tick.endDate.substring(5).replace('-', '/') + '</span>';
                }

                const headerColumn = index + 2;
                html += '<div class="gantt-date-cell' + todayClass + weekendClass + '" title="' + tick.startDate + ' ~ ' + tick.endDate + '" style="grid-column:' + headerColumn + ';">' + tickLabelHtml + '</div>';
            });

            html += '</div>';

            if (schedules.length === 0) {
                const rowKey = 'empty-create-row';

                html +=
                    '<div class="gantt-row" style="grid-template-columns:' + fullGridTemplate + ';">' +
                        '<div class="gantt-label gantt-empty-row-label">새 일정</div>' +
                        '<div class="gantt-track" style="grid-template-columns:' + dateColumnTemplate + ';">' +
                            buildCells(rowKey) +
                        '</div>' +
                    '</div>' +
                    '<div class="gantt-empty-guide"><strong>빈 칸을 드래그</strong>해서 프로젝트 일정을 바로 등록하세요. 주/월 단위에서는 해당 주/월 범위로 등록됩니다.</div>';

                html += '</div>';
                target.innerHTML = html;
                bindGanttDragHandlers();
                return;
            }

            schedules.forEach(schedule => {
                const scheduleId = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
                const title = schedule.TITLE || schedule.title || '제목 없음';
                const startDate = schedule.START_DATE || schedule.startDate;
                const endDate = schedule.END_DATE || schedule.endDate;
                const useTime = isScheduleTimeEnabled(schedule);
                const startTime = useTime ? normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00') : '';
                const endTime = useTime ? normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00') : '';
                const color = schedule.COLOR || schedule.color || '#4A90E2';

                const start = parseProjectDate(startDate);
                const end = parseProjectDate(endDate);

                if (!start || !end) return;

                const rowKey = 'schedule-' + scheduleId;

                const timeText = useTime ? '<span class="gantt-bar-time">' + startTime + ' ~ ' + endTime + '</span>' : '';
                const barTitle = title + ' · ' + startDate + (useTime ? ' ' + startTime : '') + ' ~ ' + endDate + (useTime ? ' ' + endTime : '');

                const barHtml =
                    '<div class="gantt-bar" data-title="' + title + '" title="' + barTitle + '" ' +
                        'onmousedown="startGanttBarDrag(event, ' + scheduleId + ', \'MOVE\')" ' +
                        'onclick="handleGanttBarClick(event, ' + scheduleId + ')" ' +
                        'style="' + getBarGridStyle(startDate, startTime, endDate, endTime, useTime) + ' background:' + color + ';">' +
                        '<span class="gantt-resize-handle left" onmousedown="startGanttBarDrag(event, ' + scheduleId + ', \'RESIZE_START\')"></span>' +
                        '<span class="gantt-resize-handle right" onmousedown="startGanttBarDrag(event, ' + scheduleId + ', \'RESIZE_END\')"></span>' +
                        timeText +
                    '</div>';

                html +=
                    '<div class="gantt-row" style="grid-template-columns:' + fullGridTemplate + ';">' +
                        '<div class="gantt-label" title="' + title + '"><span class="gantt-label-dot" style="background:' + color + ';"></span><span class="gantt-label-text">' + title + '</span></div>' +
                        '<div class="gantt-track" style="grid-template-columns:' + dateColumnTemplate + ';">' +
                            buildCells(rowKey) +
                            barHtml +
                        '</div>' +
                    '</div>';
            });

            html += '</div>';
            target.innerHTML = html;
            bindGanttDragHandlers();
        }

        async function loadProjectSchedules() {
            const projId = new URLSearchParams(window.location.search).get('projId');
            const target = document.getElementById('projectScheduleList');

            if (!target) return;

            if (!projId) {
                console.error('[프로젝트 일정] URL에 projId가 없습니다.');
                target.innerHTML =
                    '<div class="schedule-empty">프로젝트 정보를 확인할 수 없습니다.</div>';
                return;
            }

            const requestUrl =
                '/project/api/schedules?projId=' + encodeURIComponent(projId);

            try {
                const response = await fetch(requestUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const responseText = await response.text();

                if (!response.ok) {
                    console.error('[프로젝트 일정] 요청 실패', {
                        url: requestUrl,
                        status: response.status,
                        statusText: response.statusText,
                        response: responseText
                    });

                    throw new Error(
                        '프로젝트 일정 조회 실패'
                        + ' (' + response.status + ' ' + response.statusText + ')'
                    );
                }

                let data;

                try {
                    data = responseText ? JSON.parse(responseText) : [];
                } catch (parseError) {
                    console.error('[프로젝트 일정] JSON 변환 실패', {
                        url: requestUrl,
                        response: responseText,
                        error: parseError
                    });

                    throw new Error('프로젝트 일정 응답 형식이 올바르지 않습니다.');
                }

                if (!Array.isArray(data)) {
                    console.error('[프로젝트 일정] 배열이 아닌 응답 수신', data);
                    throw new Error('프로젝트 일정 응답 데이터가 올바르지 않습니다.');
                }

                projectCalendarSchedules = data;

                generateProjectMiniCalendar();
                renderProjectGantt(projectCalendarSchedules);

                target.innerHTML = '';

                if (data.length === 0) {
                    target.innerHTML =
                        '<div class="schedule-empty">등록된 프로젝트 일정이 없습니다.</div>';
                    return;
                }

                data.forEach(schedule => {
                    const scheduleId =
                        schedule.EVENT_ID
                        || schedule.SCHEDULE_ID
                        || schedule.scheduleId;

                    const title =
                        schedule.TITLE
                        || schedule.title
                        || '제목 없음';

                    const start =
                        schedule.START_DATE
                        || schedule.startDate
                        || '';

                    const end =
                        schedule.END_DATE
                        || schedule.endDate
                        || '';

                    const status =
                        schedule.STATUS
                        || schedule.status
                        || 'TODO';

                    const color =
                        schedule.COLOR
                        || schedule.color
                        || '#4A90E2';

                    const html =
                        '<div class="schedule-item" '
                        + 'onclick="openScheduleDetailModal(' + scheduleId + ')">'
                        + '<div class="schedule-left">'
                        + '<div class="schedule-title">'
                        + '<span class="schedule-dot" style="background:'
                        + color + ';"></span>'
                        + '<span>' + title + '</span>'
                        + '</div>'
                        + '<div class="schedule-date">'
                        + start + ' ~ ' + end
                        + '</div>'
                        + '</div>'
                        + '<div class="schedule-status '
                        + getScheduleStatusClass(status) + '">'
                        + getScheduleStatusText(status)
                        + '</div>'
                        + '</div>';

                    target.insertAdjacentHTML('beforeend', html);
                });
            } catch (error) {
                console.error('[프로젝트 일정] 로딩 오류:', error);

                projectCalendarSchedules = [];

                try {
                    generateProjectMiniCalendar();
                    renderProjectGantt([]);
                } catch (renderError) {
                    console.error(
                        '[프로젝트 일정] 빈 화면 렌더링 오류:',
                        renderError
                    );
                }

                target.innerHTML =
                    '<div class="schedule-empty">'
                    + '프로젝트 일정을 불러오지 못했습니다.'
                    + '<br><small>브라우저 콘솔에서 요청 상태와 서버 응답을 확인해주세요.</small>'
                    + '</div>';
            }
        }

        function openAddScheduleModal() {
            const nextColor = getNextScheduleColor();

            const titleInput = document.getElementById('scheduleTitle');
            const startInput = document.getElementById('scheduleStartDate');
            const endInput = document.getElementById('scheduleEndDate');
            const statusInput = document.getElementById('scheduleStatus');

            if (titleInput) titleInput.value = '';
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
            if (statusInput) statusInput.value = 'TODO';
            bindScheduleTimeInputNormalization();
            setScheduleTimeSplitValue('scheduleStartTime', '09:00');
            setScheduleTimeSplitValue('scheduleEndTime', '18:00');
            toggleScheduleTimeFields(false, false);
            bindScheduleTimeInputNormalization();

            renderScheduleColorChips();
            applyScheduleColorSelection(nextColor, false);
            openModal('addScheduleModal');
        }

        function selectScheduleColor(color) {
            applyScheduleColorSelection(color, false);
        }

        function addProjectSchedule() {
            const urlParams = new URLSearchParams(window.location.search);
            const projId = urlParams.get('projId');
            const wsId = urlParams.get('wsId');

            const title = document.getElementById('scheduleTitle').value.trim();
            const startDate = document.getElementById('scheduleStartDate').value;
            const endDate = document.getElementById('scheduleEndDate').value;
            const status = document.getElementById('scheduleStatus').value;
            const useTime = !!(document.getElementById('scheduleUseTime') && document.getElementById('scheduleUseTime').checked);
            const startTime = useTime ? document.getElementById('scheduleStartTime').value : '';
            const endTime = useTime ? document.getElementById('scheduleEndTime').value : '';
            const color = document.getElementById('scheduleColor').value || '#4A90E2';

            if (!title) return alert('일정명을 입력해주세요.');
            if (!startDate) return alert('시작일을 선택해주세요.');
            if (!endDate) return alert('종료일을 선택해주세요.');
            if (new Date(startDate) > new Date(endDate)) return alert('종료일은 시작일보다 빠를 수 없습니다.');

            const params = new URLSearchParams();
            params.append('projId', projId);
            if (!isPersonalProjectMain() && wsId && wsId !== 'null') params.append('wsId', wsId);
            params.append('title', title);
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }
            params.append('color', color);

            fetch('/project/api/add-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    closeModal('addScheduleModal');
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 추가 실패');
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
            });
        }



        function openScheduleDetailModal(scheduleId) {
            currentScheduleId = scheduleId;

            fetch('/project/api/schedule-detail?scheduleId=' + scheduleId)
                .then(res => {
                    if (!res.ok) throw new Error('프로젝트 일정 상세 조회 실패');
                    return res.json();
                })
                .then(schedule => {
                    const title = schedule.TITLE || schedule.title || '';
                    const start = schedule.START_DATE || schedule.startDate || '';
                    const end = schedule.END_DATE || schedule.endDate || '';
                    const status = schedule.STATUS || schedule.status || 'TODO';
                    const useTime = isScheduleTimeEnabled(schedule);
                    const startTime = useTime ? normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00') : '09:00';
                    const endTime = useTime ? normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00') : '18:00';
                    const color = schedule.COLOR || schedule.color || '#4A90E2';

                    document.getElementById('editScheduleTitle').value = title;
                    document.getElementById('editScheduleStartDate').value = start;
                    document.getElementById('editScheduleEndDate').value = end;
                    document.getElementById('editScheduleStatus').value = status;
                    setScheduleTimeSplitValue('editScheduleStartTime', startTime || '09:00');
                    setScheduleTimeSplitValue('editScheduleEndTime', endTime || '18:00');
                    toggleScheduleTimeFields(useTime, true);
                    bindScheduleTimeInputNormalization();
                    addSchedulePaletteColor(color);
                    renderScheduleColorChips();
                    applyScheduleColorSelection(color, true);

                    openModal('editScheduleModal');
                })
                .catch(err => {
                    console.error(err);
                    alert('프로젝트 일정 정보를 불러오지 못했습니다.');
                });
        }

        function selectEditScheduleColor(color) {
            applyScheduleColorSelection(color, true);
        }

        function updateProjectSchedule() {
            if (!currentScheduleId) return alert('수정할 일정을 선택해주세요.');

            const title = document.getElementById('editScheduleTitle').value.trim();
            const startDate = document.getElementById('editScheduleStartDate').value;
            const endDate = document.getElementById('editScheduleEndDate').value;
            const status = document.getElementById('editScheduleStatus').value;
            const useTime = !!(document.getElementById('editScheduleUseTime') && document.getElementById('editScheduleUseTime').checked);
            const startTime = useTime ? document.getElementById('editScheduleStartTime').value : '';
            const endTime = useTime ? document.getElementById('editScheduleEndTime').value : '';
            const color = document.getElementById('editScheduleColor').value || '#4A90E2';

            if (!title) return alert('일정명을 입력해주세요.');
            if (!startDate) return alert('시작일을 선택해주세요.');
            if (!endDate) return alert('종료일을 선택해주세요.');
            if (new Date(startDate) > new Date(endDate)) return alert('종료일은 시작일보다 빠를 수 없습니다.');

            const params = new URLSearchParams();
            params.append('scheduleId', currentScheduleId);
            params.append('title', title);
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }
            params.append('color', color);

            fetch('/project/api/update-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    closeModal('editScheduleModal');
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 수정 실패');
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
            });
        }

        function deleteProjectSchedule() {
            if (!currentScheduleId) return alert('삭제할 일정을 선택해주세요.');
            if (!confirm('정말 이 프로젝트 일정을 삭제하시겠습니까?')) return;

            const params = new URLSearchParams();
            params.append('scheduleId', currentScheduleId);

            fetch('/project/api/delete-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    closeModal('editScheduleModal');
                    currentScheduleId = null;
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 삭제 실패');
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
            });
        }
