/** MOYO 프로젝트 기간별 계획 그리드·드래그·렌더링 */

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

        function startGanttDrag(event, startDate, endDate, rowKey) {
            if (!canManageProjectPlan() || !startDate || !endDate || !rowKey) return;

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
            const id = Number(scheduleId);
            const ganttItem = (projectGanttItems || []).find(function(item) {
                return item && item.type === 'PERIOD_PLAN' && Number(item.entityId) === id;
            });

            if (ganttItem) {
                return {
                    SCHEDULE_ID: ganttItem.entityId,
                    TITLE: ganttItem.title || '',
                    DESCRIPTION: ganttItem.description || '',
                    START_DATE: ganttItem.startDate,
                    END_DATE: ganttItem.endDate,
                    COLOR: ganttItem.color || '#4A90E2',
                    STATUS: ganttItem.status || 'PLANNED',
                    PROGRESS: Number(ganttItem.progress || 0),
                    SORT_ORDER: Number(ganttItem.sortOrder || 0),
                    GANTT_PLAN_YN: 'Y'
                };
            }

            return null;
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

        async function finishGanttBarDrag() {
            if (!ganttBarDragState) return;

            const drag = ganttBarDragState;
            ganttBarDragState = null;

            if (drag.barEl) drag.barEl.classList.remove('dragging');
            if (!drag.moved) return;

            suppressGanttBarClick = true;
            setTimeout(function() { suppressGanttBarClick = false; }, 250);

            const payload = {
                projId: Number(getCurrentProjectId()),
                title: drag.schedule.TITLE || '',
                description: drag.schedule.DESCRIPTION || null,
                startDate: drag.newStart,
                endDate: drag.newEnd,
                color: drag.schedule.COLOR || '#4A90E2',
                status: drag.schedule.STATUS || 'PLANNED',
                progress: Number(drag.schedule.PROGRESS || 0),
                sortOrder: (function() {
                    const currentSortOrder = Number(drag.schedule.SORT_ORDER || 0);
                    if (currentSortOrder >= 1) return currentSortOrder;

                    const phaseIndex = (projectGanttItems || []).findIndex(function(item) {
                        return item
                            && item.type === 'PERIOD_PLAN'
                            && Number(item.entityId) === Number(drag.scheduleId);
                    });
                    return phaseIndex >= 0 ? phaseIndex + 1 : 1;
                })()
            };

            try {
                const response = await fetch(
                    getProjectMainContextPath() + '/project/api/period-plans/' + encodeURIComponent(drag.scheduleId),
                    {
                        method: 'PUT',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload)
                    }
                );
                const body = await response.json().catch(function() { return {}; });
                if (!response.ok || body.success === false) {
                    throw new Error(body.message || '기간별 계획 기간을 수정하지 못했습니다.');
                }

                await loadProjectPlanItems();
                renderProjectGantt(getGanttPlanSchedules());
            } catch (error) {
                console.error('[간트차트] 드래그 기간 수정 실패:', error);
                alert(error.message || '기간별 계획 기간을 수정하지 못했습니다.');
                renderProjectGantt(getGanttPlanSchedules());
            }
        }

        function handleGanttBarClick(event, scheduleId) {
            event.stopPropagation();

            if (suppressGanttBarClick) return;

            // 간트 막대는 프로젝트 공식 일정이 아니라 기간별 계획 데이터(PERIOD_PLAN)다.
            // 공통 일정 상세 모달로 넘기지 않고 간트 전용 등록/수정 모달을 재사용한다.
            const ganttPlan = (projectGanttItems || []).find(function(item) {
                return item
                    && item.type === 'PERIOD_PLAN'
                    && Number(item.entityId) === Number(scheduleId);
            });

            if (!ganttPlan) {
                console.error('[간트차트] 간트 계획 정보를 찾을 수 없습니다.', scheduleId);
                alert('기간별 계획 정보를 찾을 수 없습니다.');
                return;
            }

            openGanttPlanCreateModal(ganttPlan.startDate, ganttPlan.endDate, ganttPlan);
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


        function getAutoGanttScale(totalDays) {
            if (totalDays <= 8) {
                return { type: 'DAY', label: '자동 · 일 단위' };
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
            let scale = getGanttScale(totalDays);
            // 간트와 주간계획표는 별도 기능이다. 이전 저장값이 HOUR여도 간트는 일 단위로 복구한다.
            if (scale.type === 'HOUR') scale = { type: 'DAY', label: '일 단위' };
            updateProjectTimelineScaleButtons(scale.type);

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

            target.className = 'gantt-box gantt-scroll-shell';

            let tickMinWidth = 0;
            if (scale.type === 'WEEK') tickMinWidth = 70;
            if (scale.type === 'MONTH') tickMinWidth = 90;

            let dateColumnTemplate = 'repeat(' + tickCount + ', minmax(0, 1fr))';
            if (tickMinWidth > 0) {
                dateColumnTemplate = 'repeat(' + tickCount + ', minmax(' + tickMinWidth + 'px, 1fr))';
            }

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

            function getBarGridStyle(startDate, startTime, endDate, endTime, useTime) {
                let startColumn;
                let endColumn;

                startColumn = findTickColumnByDate(startDate);
                endColumn = findTickColumnByDate(endDate);

                if (endColumn < startColumn) endColumn = startColumn;

                const spanColumn = Math.max(endColumn - startColumn + 1, 1);

                return 'grid-column:' + startColumn + ' / span ' + spanColumn + ';';
            }

            let guideHtml = '';
            let fixedRowsHtml = '';
            let scrollRowsHtml = '';
            let headerHtml = '<div class="gantt-header-row" style="grid-template-columns:' + dateColumnTemplate + ';">';

            currentGanttTicks.forEach((tick, index) => {
                const isTodayInTick = todayString >= tick.startDate && todayString <= tick.endDate;
                const todayClass = isTodayInTick ? ' today-gantt-header' : '';
                const weekendClass = tick.isSunday ? ' sunday-gantt-header' : (tick.isSaturday ? ' saturday-gantt-header' : '');
                let tickLabelHtml = '<span class="tick-main">' + ticks[index].label + '</span>';

                if (scale.type !== 'DAY') {
                    tickLabelHtml += '<span class="tick-range">' + tick.startDate.substring(5).replace('-', '/') + '~' + tick.endDate.substring(5).replace('-', '/') + '</span>';
                }

                const headerColumn = index + 1;
                headerHtml += '<div class="gantt-date-cell' + todayClass + weekendClass + '" title="' + tick.startDate + ' ~ ' + tick.endDate + '" style="grid-column:' + headerColumn + ';">' + tickLabelHtml + '</div>';
            });

            headerHtml += '</div>';

            if (schedules.length === 0) {
                const canEditGantt = canManageProjectPlan();
                guideHtml = '<div class="gantt-empty-guide">' + (canEditGantt
                    ? '<strong>아래 추가 행을 클릭하거나 빈 칸을 드래그</strong>해서 기간별 계획을 등록하세요.'
                    : '등록된 기간별 계획이 없습니다.') + '</div>';
            } else {
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
                    const canEditGantt = canManageProjectPlan();
                    const dragAttribute = canEditGantt
                        ? " onmousedown=\"startGanttBarDrag(event, " + scheduleId + ", 'MOVE')\""
                        : '';
                    const resizeHandles = canEditGantt
                        ? "<span class=\"gantt-resize-handle left\" onmousedown=\"startGanttBarDrag(event, " + scheduleId + ", 'RESIZE_START')\"></span>"
                            + "<span class=\"gantt-resize-handle right\" onmousedown=\"startGanttBarDrag(event, " + scheduleId + ", 'RESIZE_END')\"></span>"
                        : '';
                    const barHtml =
                        '<div class="gantt-bar' + (canEditGantt ? '' : ' is-readonly') + '" data-title="' + title + '" title="' + barTitle + '"' +
                            dragAttribute +
                            ' onclick="handleGanttBarClick(event, ' + scheduleId + ')" ' +
                            'style="' + getBarGridStyle(startDate, startTime, endDate, endTime, useTime) + ' background:' + color + ';">' +
                            resizeHandles +
                            timeText +
                        '</div>';

                    fixedRowsHtml += '<div class="gantt-fixed-row" title="' + title + '"><span class="gantt-label-dot" style="background:' + color + ';"></span><span class="gantt-label-text">' + title + '</span></div>';
                    scrollRowsHtml +=
                        '<div class="gantt-row">' +
                            '<div class="gantt-track" style="grid-template-columns:' + dateColumnTemplate + ';">' +
                                buildCells(rowKey) +
                                barHtml +
                            '</div>' +
                        '</div>';
                });

                if (canManageProjectPlan()) {
                    guideHtml = '<div class="gantt-empty-guide gantt-edit-guide"><strong>빈 칸 드래그</strong>: 새 계획 등록 · <strong>막대 드래그</strong>: 기간 이동 · <strong>양끝 핸들</strong>: 기간 조정</div>';
                }
            }

            if (canManageProjectPlan()) {
                const addRowKey = 'period-plan-add-row';
                fixedRowsHtml += '<button type="button" class="gantt-fixed-row gantt-add-row-label" data-gantt-add-row><span class="gantt-add-row-icon" aria-hidden="true">+</span><span class="gantt-label-text">새 계획 추가</span></button>';
                scrollRowsHtml +=
                    '<div class="gantt-row gantt-add-row" data-gantt-add-track>' +
                        '<div class="gantt-track" style="grid-template-columns:' + dateColumnTemplate + ';">' +
                            buildCells(addRowKey) +
                        '</div>' +
                    '</div>';
            }

            const previousViewport = target.querySelector('.gantt-scroll-viewport');
            const initialFocusApplied = target.dataset.ganttInitialFocusApplied === 'true';
            const previousScrollLeft = initialFocusApplied && previousViewport
                ? previousViewport.scrollLeft
                : null;

            target.innerHTML =
                '<div class="gantt-scroll-layout">' +
                    '<div class="gantt-fixed-column">' +
                        '<div class="gantt-fixed-header"></div>' +
                        fixedRowsHtml +
                    '</div>' +
                    '<div class="gantt-scroll-viewport">' +
                        '<div class="gantt-inner">' + headerHtml + scrollRowsHtml + '</div>' +
                    '</div>' +
                '</div>' +
                guideHtml;

            const nextViewport = target.querySelector('.gantt-scroll-viewport');
            if (nextViewport) {
                requestAnimationFrame(function() {
                    if (previousScrollLeft !== null) {
                        nextViewport.scrollLeft = previousScrollLeft;
                        return;
                    }

                    const todayHeader = nextViewport.querySelector('.today-gantt-header');
                    if (todayHeader) {
                        const maxScrollLeft = Math.max(nextViewport.scrollWidth - nextViewport.clientWidth, 0);
                        const centeredScrollLeft = todayHeader.offsetLeft
                            - ((nextViewport.clientWidth - todayHeader.offsetWidth) / 2);

                        nextViewport.scrollLeft = Math.max(0, Math.min(centeredScrollLeft, maxScrollLeft));
                    } else {
                        // 오늘이 프로젝트 기간 밖이면 프로젝트 시작점부터 보여준다.
                        nextViewport.scrollLeft = 0;
                    }

                    target.dataset.ganttInitialFocusApplied = 'true';
                });
            }

            if (canManageProjectPlan()) {
                bindGanttDragHandlers();
                const addRowButton = target.querySelector('[data-gantt-add-row]');
                if (addRowButton) {
                    addRowButton.addEventListener('click', function() {
                        const periodPlans = (projectGanttItems || []).filter(function(item) {
                            return item && item.type === 'PERIOD_PLAN';
                        });
                        const projectStart = parseProjectDate(window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectStartDate);
                        const projectEnd = parseProjectDate(window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectEndDate);
                        let defaultDate = projectStart;

                        periodPlans.forEach(function(item) {
                            const itemEnd = parseProjectDate(item.END_DATE || item.endDate || item.START_DATE || item.startDate);
                            if (!itemEnd) return;
                            const nextDate = addDays(itemEnd, 1);
                            if (!defaultDate || nextDate > defaultDate) defaultDate = nextDate;
                        });

                        if (!defaultDate) {
                            const firstTick = currentGanttTicks[0] || null;
                            defaultDate = firstTick ? parseProjectDate(firstTick.startDate) : new Date();
                        }

                        if (projectStart && defaultDate < projectStart) defaultDate = projectStart;
                        if (projectEnd && defaultDate > projectEnd) {
                            alert('프로젝트 종료일까지 기간별 계획이 등록되어 있습니다.');
                            return;
                        }

                        const defaultDateText = formatProjectDate(defaultDate);
                        openGanttPlanCreateModal(defaultDateText, defaultDateText);
                    });
                }
            }
        }


