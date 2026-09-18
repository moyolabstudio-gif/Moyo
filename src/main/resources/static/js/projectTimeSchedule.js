/** MOYO 프로젝트 시간별/주간 공통 시간표 엔진 */
let projectScheduleGridMode = 'TIME_PLAN';
let projectWeeklyScheduleGridItems = [];
const WEEKLY_GRID_BASE_DATES = ['2026-07-26','2026-07-27','2026-07-28','2026-07-29','2026-07-30','2026-07-31','2026-08-01'];
function isWeeklyScheduleGridMode(){ return projectScheduleGridMode === 'WEEKLY_PLAN'; }
function getScheduleGridRoot(){ return document.getElementById(isWeeklyScheduleGridMode() ? 'projectWeeklyPlanPreview' : 'projectTimeSchedulePreview'); }
function getActiveScheduleGridItems(){ return isWeeklyScheduleGridMode() ? projectWeeklyScheduleGridItems : (projectTimeScheduleItems || []); }
function weeklyDayFromGridDate(date){ const i=WEEKLY_GRID_BASE_DATES.indexOf(String(date||'')); return i < 0 ? 7 : (i===0 ? 7 : i); }
function gridDateFromWeeklyDay(day){ const n=Number(day); return WEEKLY_GRID_BASE_DATES[n===7?0:n] || WEEKLY_GRID_BASE_DATES[0]; }
function renderActiveScheduleGrid(){ if(isWeeklyScheduleGridMode() && typeof window.renderWeeklyPlan==='function') window.renderWeeklyPlan(); else renderTimeSchedule(); }

// 시간별/주간 공통 날짜 이동 유틸리티.
// 주간 렌더링은 bindTimeScheduleCardEditHandlers 바깥에서도 사용하므로
// 특정 이벤트 바인더의 지역 함수로 두면 ReferenceError가 발생한다.
function addDateDays(dateText, amount) {
    const match = String(dateText || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return dateText;

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isNaN(date.getTime())) return dateText;

    date.setDate(date.getDate() + (Number(amount) || 0));
    return String(date.getFullYear()).padStart(4, '0') + '-'
        + String(date.getMonth() + 1).padStart(2, '0') + '-'
        + String(date.getDate()).padStart(2, '0');
}


        function addHoursToDate(date, hours) {
            const copied = new Date(date.getTime());
            copied.setHours(copied.getHours() + hours);
            return copied;
        }

        const TIME_SCHEDULE_SNAP_MINUTES = 15;
        const TIME_SCHEDULE_SLOTS_PER_HOUR = 60 / TIME_SCHEDULE_SNAP_MINUTES;

        function formatTimeScheduleMinutes(totalMinutes) {
            const normalized = Math.max(0, Math.min(24 * 60, totalMinutes));
            const hour = Math.floor(normalized / 60);
            const minute = normalized % 60;
            return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
        }

        function getTimeScheduleSlotInfo(el) {
            if (!el) return null;
            const minute = parseInt(el.dataset.minute, 10);
            return {
                date: el.dataset.date,
                minute: isNaN(minute) ? (parseInt(el.dataset.hour, 10) || 0) * 60 : minute,
                row: parseInt(el.dataset.row, 10),
                col: parseInt(el.dataset.col, 10)
            };
        }

        function getTimeScheduleSlotFromPoint(clientX, clientY) {
            const el = document.elementFromPoint(clientX, clientY);
            if (!el) return null;

            const slot = el.closest('.time-schedule-slot[data-date][data-minute]');
            if (slot) return slot;

            const grid = el.closest('.time-schedule-grid');
            if (!grid) return null;

            const slots = Array.from(grid.querySelectorAll('.time-schedule-slot[data-date][data-minute]'));
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


        function clearTimeScheduleDragSelection(root) {
            const scope = root || getScheduleGridRoot() || document;
            scope.querySelectorAll('.time-schedule-slot.drag-selecting, .time-schedule-slot.drag-start, .time-schedule-slot.drag-end')
                .forEach(function(slot) {
                    slot.classList.remove('drag-selecting', 'drag-start', 'drag-end');
                });

            scope.querySelectorAll('.time-schedule-selection-overlay')
                .forEach(function(overlay) { overlay.remove(); });
        }


        window.clearTimeScheduleDragSelection = clearTimeScheduleDragSelection;

        // 공통 계획 모달을 X/바깥 클릭/Esc/저장으로 닫으면 시간표의 확정 선택도 즉시 해제한다.
        if (!window.__timeScheduleModalCloseSelectionBound) {
            window.__timeScheduleModalCloseSelectionBound = true;
            document.addEventListener('project-time-plan-modal-closed', function() {
                clearTimeScheduleDragSelection();
                clearTimeScheduleHoverSlot();
                const preview = getScheduleGridRoot();
                if (preview) preview.classList.remove('is-time-slot-dragging');
            });
        }

        function clearTimeScheduleHoverSlot() {
            document.querySelectorAll('.time-schedule-slot.is-time-slot-hover')
                .forEach(function(slot) {
                    slot.classList.remove('is-time-slot-hover');
                    slot.removeAttribute('data-hover-time');
                });
        }

        function markTimeScheduleHoverSlot(slot) {
            clearTimeScheduleHoverSlot();
            if (!slot || slot.dataset.disabled === 'true' || slot.closest('.time-schedule-event')) return;
            const info = getTimeScheduleSlotInfo(slot);
            if (!info) return;
            slot.classList.add('is-time-slot-hover');
            slot.dataset.hoverTime = formatTimeScheduleMinutes(info.minute);
        }


        function getTimeScheduleSelectionBounds(startInfo, endInfo) {
            if (!startInfo || !endInfo || startInfo.date !== endInfo.date) return null;
            const startMinute = Math.min(startInfo.minute, endInfo.minute);
            const endMinute = Math.max(startInfo.minute, endInfo.minute) + TIME_SCHEDULE_SNAP_MINUTES;
            return { date: startInfo.date, startMinute: startMinute, endMinute: endMinute };
        }

        function hasTimeScheduleEventConflict(startInfo, endInfo) {
            const bounds = getTimeScheduleSelectionBounds(startInfo, endInfo);
            if (!bounds) return true;

            return Array.from(document.querySelectorAll(
                (isWeeklyScheduleGridMode() ? '#projectWeeklyPlanPreview' : '#projectTimeSchedulePreview') + ' .time-schedule-event[data-date][data-start-minute][data-end-minute]'
            )).some(function(eventCard) {
                if (eventCard.dataset.date !== bounds.date) return false;
                const eventStart = parseInt(eventCard.dataset.startMinute, 10);
                const eventEnd = parseInt(eventCard.dataset.endMinute, 10);
                if (!Number.isFinite(eventStart) || !Number.isFinite(eventEnd)) return false;
                return bounds.startMinute < eventEnd && bounds.endMinute > eventStart;
            });
        }

        function clearTimeScheduleDropTarget() {
            document.querySelectorAll('.time-schedule-slot.drop-target')
                .forEach(function(slot) {
                    slot.classList.remove('drop-target');
                });
        }

        function updateTimeScheduleDragPreview(event, text) {
            let preview = document.getElementById('timeScheduleDragPreview');
            if (!preview) {
                preview = document.createElement('div');
                preview.id = 'timeScheduleDragPreview';
                preview.className = 'time-schedule-drag-preview';
                document.body.appendChild(preview);
            }

            preview.textContent = text || '';
            preview.style.left = event.clientX + 'px';
            preview.style.top = event.clientY + 'px';
        }

        function clearTimeScheduleDragPreview() {
            const preview = document.getElementById('timeScheduleDragPreview');
            if (preview) preview.remove();
            clearTimeScheduleDropTarget();
        }

        function getTimeScheduleDragLabel(info, mode) {
            if (!info) return '';
            const dateText = info.date ? info.date.substring(5).replace('-', '/') : '';
            const timeText = formatTimeScheduleMinutes(info.minute);
            if (mode === 'RESIZE_START') return '시작 ' + dateText + ' ' + timeText;
            if (mode === 'RESIZE_END') return '종료 ' + dateText + ' ' + timeText;
            return '이동 ' + dateText + ' ' + timeText;
        }

        function markTimeScheduleDropTarget(slot) {
            clearTimeScheduleDropTarget();
            if (slot) slot.classList.add('drop-target');
        }


        function getOrderedTimeScheduleSlotRange(a, b) {
            if (!a || !b) return null;

            const startDt = parseProjectDateTime(a.date, formatTimeScheduleMinutes(a.minute), false);
            const endDt = parseProjectDateTime(b.date, formatTimeScheduleMinutes(b.minute), false);

            if (!startDt || !endDt) return null;

            const first = startDt <= endDt ? a : b;
            const last = startDt <= endDt ? b : a;

            return { first: first, last: last };
        }

        function highlightTimeScheduleRange(startInfo, endInfo) {
            const root = getScheduleGridRoot();
            if (!root) return;
            clearTimeScheduleDragSelection(root);

            const range = getOrderedTimeScheduleSlotRange(startInfo, endInfo);
            if (!range) return;

            const firstDt = parseProjectDateTime(range.first.date, formatTimeScheduleMinutes(range.first.minute), false);
            const lastEndMinute = Math.min(range.last.minute + TIME_SCHEDULE_SNAP_MINUTES, 24 * 60);
            const lastEndDt = parseProjectDateTime(range.last.date, formatTimeScheduleMinutes(lastEndMinute), true);
            let firstSlot = null;
            let lastSlot = null;

            root.querySelectorAll('.time-schedule-slot[data-date][data-minute]').forEach(function(slot) {
                const info = getTimeScheduleSlotInfo(slot);
                if (!info) return;

                const slotStart = parseProjectDateTime(info.date, formatTimeScheduleMinutes(info.minute), false);
                const slotEnd = parseProjectDateTime(info.date, formatTimeScheduleMinutes(info.minute + TIME_SCHEDULE_SNAP_MINUTES), true);

                if (slotStart && slotEnd && slotStart < lastEndDt && slotEnd > firstDt) {
                    slot.classList.add('drag-selecting');
                }

                if (info.date === range.first.date && info.minute === range.first.minute) {
                    firstSlot = slot;
                    slot.classList.add('drag-start');
                }

                if (info.date === range.last.date && info.minute === range.last.minute) {
                    lastSlot = slot;
                    slot.classList.add('drag-end');
                }
            });

            const grid = root.querySelector('.time-schedule-grid');
            if (!grid || !firstSlot || !lastSlot) return;

            // 실제 화면 좌표를 grid 기준으로 환산한다. border/scroll/offsetParent 차이로
            // 첫·마지막 15분이 잘려 보이지 않도록 선택 셀의 바깥 경계를 그대로 사용한다.
            const gridRect = grid.getBoundingClientRect();
            const firstRect = firstSlot.getBoundingClientRect();
            const lastRect = lastSlot.getBoundingClientRect();
            const selectionLeft = firstRect.left - gridRect.left + grid.scrollLeft;
            const selectionTop = firstRect.top - gridRect.top + grid.scrollTop;
            const selectionRight = firstRect.right - gridRect.left + grid.scrollLeft;
            const selectionBottom = lastRect.bottom - gridRect.top + grid.scrollTop;
            const overlay = document.createElement('div');
            overlay.className = 'time-schedule-selection-overlay';
            overlay.style.left = selectionLeft + 'px';
            overlay.style.top = selectionTop + 'px';
            overlay.style.width = Math.max(selectionRight - selectionLeft, firstRect.width) + 'px';
            overlay.style.height = Math.max(selectionBottom - selectionTop, firstRect.height) + 'px';

            const startLabel = document.createElement('span');
            startLabel.className = 'time-schedule-selection-time time-schedule-selection-time--start';
            startLabel.textContent = formatTimeScheduleMinutes(range.first.minute);

            const endLabel = document.createElement('span');
            endLabel.className = 'time-schedule-selection-time time-schedule-selection-time--end';
            endLabel.textContent = formatTimeScheduleMinutes(lastEndMinute);

            overlay.appendChild(startLabel);
            overlay.appendChild(endLabel);
            grid.appendChild(overlay);
        }

        function openAddScheduleModalWithTimeScheduleRange(startInfo, endInfo) {
            const range = getOrderedTimeScheduleSlotRange(startInfo, endInfo);
            if (!range) return;

            const planDate = range.first.date;
            const startTime = formatTimeScheduleMinutes(range.first.minute);
            const rawEndMinute = Math.min(range.last.minute + TIME_SCHEDULE_SNAP_MINUTES, 24 * 60);
            const endTime = rawEndMinute === 24 * 60 ? '00:00' : formatTimeScheduleMinutes(rawEndMinute);
            const endDateValue = rawEndMinute === 24 * 60
                ? formatProjectDate(addHoursToDate(parseProjectDate(planDate), 24))
                : planDate;

            if (typeof window.openProjectPlanSharedModal !== 'function') {
                console.error('[시간별 계획] 공통 계획 모달 호출 함수를 찾을 수 없습니다.');
                clearTimeScheduleDragSelection();
                return;
            }

            if (isWeeklyScheduleGridMode()) {
                window.openProjectPlanSharedModal({
                    mode: 'WEEKLY_PLAN',
                    dayOfWeek: weeklyDayFromGridDate(planDate),
                    startTime: startTime,
                    endTime: rawEndMinute === 24 * 60 ? '24:00' : formatTimeScheduleMinutes(rawEndMinute),
                    item: null
                });
            } else {
                window.openProjectPlanSharedModal({
                    mode: 'TIME_PLAN',
                    startDate: planDate,
                    endDate: endDateValue,
                    startTime: startTime,
                    endTime: endTime,
                    item: null
                });
            }
        }


        function bindTimeScheduleDragHandlers() {
            const target = getScheduleGridRoot();
            if (!target || currentGanttScale !== 'HOUR') return;

            // 재렌더링될 때 document 이벤트가 중복 등록되지 않도록 이전 핸들러를 제거한다.
            if (target._timeScheduleDocumentMouseupHandler) {
                document.removeEventListener('mouseup', target._timeScheduleDocumentMouseupHandler);
            }
            if (target._timeScheduleDocumentKeydownHandler) {
                document.removeEventListener('keydown', target._timeScheduleDocumentKeydownHandler);
            }
            if (target._timeScheduleDocumentPointerHandler) {
                document.removeEventListener('mousedown', target._timeScheduleDocumentPointerHandler, true);
            }

            let dragStartInfo = null;
            let dragCurrentInfo = null;
            let dragging = false;
            let selectionConfirmed = !!target.querySelector('.time-schedule-selection-overlay');

            function cancelTimeScheduleSelection() {
                dragging = false;
                selectionConfirmed = false;
                dragStartInfo = null;
                dragCurrentInfo = null;
                target.classList.remove('is-time-slot-dragging');
                clearTimeScheduleHoverSlot();
                clearTimeScheduleDragSelection();
            }

            target.onselectstart = function(event) {
                if (event.target.closest('.time-schedule-grid-scroll')) {
                    event.preventDefault();
                    return false;
                }
            };

            target.onmousemove = function(event) {
                if (dragging) return;
                const slot = event.target.closest('.time-schedule-slot[data-date][data-minute]');
                if (!slot || !target.contains(slot) || event.target.closest('.time-schedule-event')) {
                    clearTimeScheduleHoverSlot();
                    return;
                }
                markTimeScheduleHoverSlot(slot);
            };

            target.onmouseleave = function() {
                if (!dragging) clearTimeScheduleHoverSlot();
            };

            target.onmousedown = function(event) {
                if (event.button !== 0 || event.target.closest('.time-schedule-event')) return;
                const slot = event.target.closest('.time-schedule-slot[data-date][data-minute]');
                if (!slot || !target.contains(slot) || slot.dataset.disabled === 'true') return;
                const startSlotInfo = getTimeScheduleSlotInfo(slot);
                if (!startSlotInfo || hasTimeScheduleEventConflict(startSlotInfo, startSlotInfo)) return;
                event.preventDefault();
                if (window.getSelection) {
                    const selection = window.getSelection();
                    if (selection && typeof selection.removeAllRanges === 'function') selection.removeAllRanges();
                }
                // 확정된 기존 범위가 있더라도 새 드래그를 시작하면 즉시 교체한다.
                clearTimeScheduleHoverSlot();
                clearTimeScheduleDragSelection();
                selectionConfirmed = false;
                target.classList.add('is-time-slot-dragging');
                dragStartInfo = startSlotInfo;
                dragCurrentInfo = dragStartInfo;
                dragging = true;
                highlightTimeScheduleRange(dragStartInfo, dragCurrentInfo);
            };

            target.onmouseover = function(event) {
                if (!dragging) return;
                const slot = event.target.closest('.time-schedule-slot[data-date][data-minute]');
                if (!slot || slot.dataset.disabled === 'true') return;
                const info = getTimeScheduleSlotInfo(slot);
                if (!info || info.date !== dragStartInfo.date) return;
                if (hasTimeScheduleEventConflict(dragStartInfo, info)) return;
                dragCurrentInfo = info;
                highlightTimeScheduleRange(dragStartInfo, dragCurrentInfo);
            };

            function confirmTimeScheduleDragSelection(event) {
                if (!dragging) return;
                if (event) event.preventDefault();

                // 마우스를 놓은 실제 위치가 유효한 15분 슬롯이면 그 값을 최종 종료값으로 확정한다.
                // 그리드 밖에서 놓은 경우에는 드래그 중 마지막으로 지나온 유효 슬롯을 사용한다.
                let releaseSlot = event && event.target && event.target.closest
                    ? event.target.closest('.time-schedule-slot[data-date][data-minute]')
                    : null;

                if (!releaseSlot && event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
                    const releaseElement = document.elementFromPoint(event.clientX, event.clientY);
                    releaseSlot = releaseElement && releaseElement.closest
                        ? releaseElement.closest('.time-schedule-slot[data-date][data-minute]')
                        : null;
                }

                if (releaseSlot && target.contains(releaseSlot) && releaseSlot.dataset.disabled !== 'true') {
                    const releaseInfo = getTimeScheduleSlotInfo(releaseSlot);
                    if (
                        releaseInfo && dragStartInfo && releaseInfo.date === dragStartInfo.date &&
                        !hasTimeScheduleEventConflict(dragStartInfo, releaseInfo)
                    ) {
                        dragCurrentInfo = releaseInfo;
                    }
                }

                const startInfo = dragStartInfo;
                const endInfo = dragCurrentInfo || dragStartInfo;

                // 마우스를 놓은 시점의 값으로 선택 표시와 입력값을 한 번 더 확정한다.
                highlightTimeScheduleRange(startInfo, endInfo);

                dragging = false;
                selectionConfirmed = true;
                target.classList.remove('is-time-slot-dragging');
                clearTimeScheduleHoverSlot();
                if (window.getSelection) {
                    const selection = window.getSelection();
                    if (selection && typeof selection.removeAllRanges === 'function') selection.removeAllRanges();
                }

                dragStartInfo = null;
                dragCurrentInfo = null;
                openAddScheduleModalWithTimeScheduleRange(startInfo, endInfo);
                // 선택 범위는 모달이 닫힐 때까지 유지해 사용자가 확정한 시간을 확인할 수 있게 한다.
            }

            target.onmouseup = confirmTimeScheduleDragSelection;

            // 빠르게 드래그하거나 그리드 경계에서 놓아 target의 mouseup이 누락되는 경우도 확정한다.
            target._timeScheduleDocumentMouseupHandler = confirmTimeScheduleDragSelection;
            document.addEventListener('mouseup', target._timeScheduleDocumentMouseupHandler);

            // Esc는 진행 중 드래그와 확정된 선택을 모두 취소한다.
            target._timeScheduleDocumentKeydownHandler = function(event) {
                if (event.key !== 'Escape') return;
                if (!dragging && !selectionConfirmed && !target.querySelector('.time-schedule-selection-overlay')) return;
                event.preventDefault();
                cancelTimeScheduleSelection();
            };
            document.addEventListener('keydown', target._timeScheduleDocumentKeydownHandler);

            // 확정된 선택 상태에서 그리드/일정 모달 바깥을 클릭하면 선택 표시만 해제한다.
            target._timeScheduleDocumentPointerHandler = function(event) {
                if (dragging || !selectionConfirmed) return;
                if (target.contains(event.target)) return;
                if (event.target.closest && event.target.closest('.modal, [role="dialog"], .schedule-modal, .project-schedule-modal')) return;
                cancelTimeScheduleSelection();
            };
            document.addEventListener('mousedown', target._timeScheduleDocumentPointerHandler, true);

            target.onclick = function(event) {
                const eventCard = event.target.closest('.time-schedule-event[data-schedule-id]');
                if (eventCard && target.contains(eventCard)) {
                    event.preventDefault();
                    event.stopPropagation();
                    const scheduleId = eventCard.dataset.scheduleId;
                    if (scheduleId) openProjectPlanScheduleDetail(scheduleId, 'TIME_SCHEDULE');
                }
            };
        }

        document.addEventListener('mousemove', function(event) {
            if (!timeScheduleEventDragState) return;

            const dx = Math.abs(event.clientX - timeScheduleEventDragState.startX);
            const dy = Math.abs(event.clientY - timeScheduleEventDragState.startY);

            if (dx > 4 || dy > 4) {
                timeScheduleEventDragState.moved = true;
                const slot = getTimeScheduleSlotFromPoint(event.clientX, event.clientY);
                timeScheduleEventDragState.currentSlot = slot;

                if (slot) {
                    markTimeScheduleDropTarget(slot);
                    updateTimeScheduleDragPreview(event, getTimeScheduleDragLabel(getTimeScheduleSlotInfo(slot), timeScheduleEventDragState.mode));
                }
            }
        });

        document.addEventListener('mouseup', function() {
            if (timeScheduleEventDragState && timeScheduleEventDragState.card) {
                timeScheduleEventDragState.card.classList.remove('dragging');
            }
            timeScheduleEventDragState = null;
            clearTimeScheduleDragPreview();
        });


        function bindTimeScheduleCardEditHandlers(target) {
            if (!target || target._timeScheduleCardEditBound) return;
            target._timeScheduleCardEditBound = true;

            let state = null;

            function minutesToTime(value) {
                const normalized = Math.max(0, Number(value) || 0);
                if (normalized === 24 * 60) return '24:00';
                return formatTimeScheduleMinutes(normalized % (24 * 60));
            }

            function splitCandidateRangeByDate(date, startMinute, endMinute) {
                const segments = [];
                let cursor = Math.max(0, startMinute);
                const finish = Math.max(cursor + TIME_SCHEDULE_SNAP_MINUTES, endMinute);
                while (cursor < finish) {
                    const dayOffset = Math.floor(cursor / (24 * 60));
                    const dayStart = dayOffset * 24 * 60;
                    const segmentStart = cursor - dayStart;
                    const segmentEnd = Math.min(24 * 60, finish - dayStart);
                    segments.push({
                        date: addDateDays(date, dayOffset),
                        startMinute: segmentStart,
                        endMinute: segmentEnd
                    });
                    cursor = dayStart + 24 * 60;
                }
                return segments;
            }

            function getPlanByCard(card) {
                const id = card && card.dataset.timeScheduleItemId;
                return getActiveScheduleGridItems().find(function(item) {
                    return String(item.TIME_PLAN_ID || item.timePlanId) === String(id);
                }) || null;
            }

            function getPlanDateTimeRange(plan) {
                if (!plan) return null;
                const startDate = String(plan.START_DATE || plan.startDate || plan.PLAN_DATE || plan.planDate || '').substring(0, 10);
                const endDate = String(plan.END_DATE || plan.endDate || startDate).substring(0, 10);
                const startTime = normalizeScheduleTime(plan.START_TIME || plan.startTime, '09:00');
                const endTime = normalizeScheduleTime(plan.END_TIME || plan.endTime, '10:00');
                if (!startDate || !endDate) return null;

                const start = new Date(startDate + 'T' + (startTime === '24:00' ? '00:00' : startTime) + ':00');
                if (startTime === '24:00') start.setDate(start.getDate() + 1);
                const end = new Date(endDate + 'T' + (endTime === '24:00' ? '00:00' : endTime) + ':00');
                if (endTime === '24:00') end.setDate(end.getDate() + 1);
                if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
                return { start: start, end: end };
            }

            function dateMinuteToDate(dateText, minute) {
                const date = parseProjectDate(dateText);
                if (!date) return null;
                date.setHours(0, 0, 0, 0);
                date.setMinutes(Number(minute) || 0);
                return date;
            }

            function clearStaleCardDragArtifacts() {
                document.querySelectorAll('.time-schedule-card-drag-preview').forEach(function(preview) {
                    preview.remove();
                });
                target.querySelectorAll('.time-schedule-task-placement.is-card-dragging, .time-schedule-task-placement.is-card-resizing')
                    .forEach(function(card) {
                        card.classList.remove('is-card-dragging', 'is-card-resizing');
                        card.style.removeProperty('visibility');
                    });
                target.classList.remove('is-time-card-editing');
            }

            function clearCardDrag() {
                if (state && state.card) {
                    state.card.classList.remove('is-card-dragging', 'is-card-resizing', 'is-conflict');
                    state.card.style.removeProperty('visibility');
                    if (state.mode !== 'MOVE') {
                        state.card.style.gridColumn = state.originalGridColumn;
                        state.card.style.gridRow = state.originalGridRow;
                        state.card.dataset.date = state.originalDate;
                        state.card.dataset.startMinute = String(state.originalStart);
                        state.card.dataset.endMinute = String(state.originalEnd);
                        const originalTimeEl = state.card.querySelector('.time-schedule-event-time');
                        if (originalTimeEl) originalTimeEl.textContent = state.originalTimeText;
                    }
                }
                if (state && state.mode === 'MOVE' && state.preview && state.preview.parentNode) state.preview.remove();
                clearStaleCardDragArtifacts();
                state = null;
            }

            function getSlotAt(clientX, clientY) {
                return getTimeScheduleSlotFromPoint(clientX, clientY);
            }

            function hasConflict(date, startMinute, endMinute, selfId) {
                const candidateSegments = splitCandidateRangeByDate(date, startMinute, endMinute);
                const cards = Array.from(target.querySelectorAll('.time-schedule-task-placement[data-time-schedule-item-id]'));
                return candidateSegments.some(function(segment) {
                    return cards.some(function(card) {
                        if (String(card.dataset.timeScheduleItemId) === String(selfId)) return false;
                        if (card.dataset.date !== segment.date) return false;
                        const otherStart = parseInt(card.dataset.startMinute, 10);
                        const otherEnd = parseInt(card.dataset.endMinute, 10);
                        return Number.isFinite(otherStart) && Number.isFinite(otherEnd)
                            && segment.startMinute < otherEnd && segment.endMinute > otherStart;
                    });
                });
            }

            async function saveCardRange(current) {
                const plan = current.plan;
                const id = plan.TIME_PLAN_ID || plan.timePlanId;
                const endDayOffset = Math.floor(current.endMinute / (24 * 60));
                const normalizedEndMinute = current.endMinute % (24 * 60);
                const payload = {
                    projId: Number(getCurrentProjectId()),
                    title: plan.TITLE || plan.title || '',
                    description: plan.DESCRIPTION || plan.description || null,
                    startDate: current.date,
                    endDate: addDateDays(current.date, endDayOffset),
                    allDayYn: 'N',
                    startTime: minutesToTime(current.startMinute),
                    endTime: normalizedEndMinute === 0 && endDayOffset === 0 ? '24:00' : minutesToTime(normalizedEndMinute),
                    color: plan.COLOR || plan.color || '#4A90E2',
                    sortOrder: plan.SORT_ORDER || plan.sortOrder || 1
                };
                if (isWeeklyScheduleGridMode()) {
                    if (typeof window.updateWeeklyPlanFromTimeGrid !== 'function') throw new Error('주간 계획 저장 함수를 찾을 수 없습니다.');
                    await window.updateWeeklyPlanFromTimeGrid(plan, weeklyDayFromGridDate(current.date), current.startMinute, current.endMinute);
                    return;
                }
                const response = await fetch(getProjectMainContextPath() + '/project/api/time-plans/' + encodeURIComponent(id), {
                    method: 'PUT', credentials: 'include',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const body = await response.json().catch(function() { return {}; });
                if (!response.ok || body.success === false) throw new Error(body.message || '시간별 계획을 수정하지 못했습니다.');
                await loadProjectTimeScheduleItems();
                renderActiveScheduleGrid();
            }

            target.addEventListener('mousedown', function(event) {
                if (event.button !== 0) return;
                const card = event.target.closest('.time-schedule-task-placement[data-time-schedule-item-id]');
                if (!card || !target.contains(card)) return;
                const plan = getPlanByCard(card);
                if (!plan) return;

                const handle = event.target.closest('[data-resize-mode]');
                const mode = handle ? handle.dataset.resizeMode : 'MOVE';
                const rect = card.getBoundingClientRect();
                const startMinute = parseInt(card.dataset.startMinute, 10);
                const endMinute = parseInt(card.dataset.endMinute, 10);
                if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute)) return;

                const fullRange = getPlanDateTimeRange(plan);
                const segmentStartDateTime = dateMinuteToDate(card.dataset.date, startMinute);
                const fullDurationMinutes = fullRange
                    ? Math.max(TIME_SCHEDULE_SNAP_MINUTES, Math.round((fullRange.end - fullRange.start) / 60000))
                    : Math.max(TIME_SCHEDULE_SNAP_MINUTES, endMinute - startMinute);
                const segmentOffsetMinutes = fullRange && segmentStartDateTime
                    ? Math.max(0, Math.round((segmentStartDateTime - fullRange.start) / 60000))
                    : 0;

                event.preventDefault();
                event.stopPropagation();
                clearTimeScheduleHoverSlot();
                clearStaleCardDragArtifacts();
                target.classList.add('is-time-card-editing');

                let preview = card;
                if (mode === 'MOVE') {
                    preview = card.cloneNode(true);
                    preview.removeAttribute('onclick');
                    preview.classList.add('time-schedule-card-drag-preview');

                    // body로 이동한 복제 카드는 #projectTimeSchedulePreview 하위 CSS를 더 이상 받지 못한다.
                    // 원본의 계산된 스타일을 복사해 드래그 중에도 카드 모양이 바뀌지 않게 유지한다.
                    const computed = window.getComputedStyle(card);
                    [
                        'backgroundColor', 'backgroundImage', 'color', 'borderTopWidth', 'borderRightWidth',
                        'borderBottomWidth', 'borderLeftWidth', 'borderTopStyle', 'borderRightStyle',
                        'borderBottomStyle', 'borderLeftStyle', 'borderTopColor', 'borderRightColor',
                        'borderBottomColor', 'borderLeftColor', 'borderRadius', 'paddingTop', 'paddingRight',
                        'paddingBottom', 'paddingLeft', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
                        'display', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'overflow',
                        'boxSizing', 'textAlign'
                    ].forEach(function(prop) {
                        preview.style[prop] = computed[prop];
                    });

                    preview.style.position = 'fixed';
                    preview.style.left = rect.left + 'px';
                    preview.style.top = rect.top + 'px';
                    preview.style.width = rect.width + 'px';
                    preview.style.height = rect.height + 'px';
                    preview.style.minWidth = rect.width + 'px';
                    preview.style.maxWidth = rect.width + 'px';
                    preview.style.minHeight = rect.height + 'px';
                    preview.style.maxHeight = rect.height + 'px';
                    preview.style.margin = '0';
                    preview.style.transform = 'none';
                    preview.style.zIndex = '9999';
                    document.body.appendChild(preview);
                }

                const referenceSlot = target.querySelector('.time-schedule-slot[data-minute]');
                const slotPixelHeight = referenceSlot ? referenceSlot.getBoundingClientRect().height : 14;
                const durationPixelHeight = Math.max(
                    slotPixelHeight,
                    ((endMinute - startMinute) / TIME_SCHEDULE_SNAP_MINUTES) * slotPixelHeight
                );
                const moveCardPixelHeight = Math.max(rect.height, durationPixelHeight);

                if (mode === 'MOVE') {
                    preview.style.setProperty('height', moveCardPixelHeight + 'px', 'important');
                    preview.style.setProperty('min-height', moveCardPixelHeight + 'px', 'important');
                    preview.style.setProperty('max-height', moveCardPixelHeight + 'px', 'important');
                }

                state = {
                    card: card, plan: plan, preview: preview, mode: mode,
                    startX: event.clientX, startY: event.clientY,
                    grabOffsetY: event.clientY - rect.top,
                    slotPixelHeight: slotPixelHeight,
                    moveCardPixelHeight: moveCardPixelHeight,
                    originalRect: rect, originalStart: startMinute, originalEnd: endMinute,
                    originalDate: card.dataset.date,
                    fullDurationMinutes: fullDurationMinutes,
                    fullStartDateTime: fullRange ? new Date(fullRange.start.getTime()) : dateMinuteToDate(card.dataset.date, startMinute),
                    fullEndDateTime: fullRange ? new Date(fullRange.end.getTime()) : dateMinuteToDate(card.dataset.date, endMinute),
                    segmentOffsetMinutes: segmentOffsetMinutes,
                    segmentDurationMinutes: Math.max(TIME_SCHEDULE_SNAP_MINUTES, endMinute - startMinute),
                    originalGridColumn: card.style.gridColumn,
                    originalGridRow: card.style.gridRow,
                    originalTimeText: (card.querySelector('.time-schedule-event-time') || {}).textContent || '',
                    date: card.dataset.date, startMinute: startMinute, endMinute: endMinute,
                    moved: false
                };
                card.classList.add(mode === 'MOVE' ? 'is-card-dragging' : 'is-card-resizing');
                if (mode === 'MOVE') card.style.visibility = 'hidden';
            }, true);

            document.addEventListener('mousemove', function(event) {
                if (!state) return;
                if (Math.abs(event.clientX - state.startX) > 3 || Math.abs(event.clientY - state.startY) > 3) state.moved = true;
                if (!state.moved) return;

                clearTimeScheduleHoverSlot();
                const duration = state.originalEnd - state.originalStart;
                let slot;
                let info;
                if (state.mode === 'MOVE') {
                    const desiredTop = event.clientY - state.grabOffsetY;

                    // 현재 화면의 첫 표시 슬롯을 기준으로 이동 시간을 계산한다.
                    // 새벽 시간 숨김 상태에서는 첫 슬롯이 06:00이므로 00:00 슬롯을 찾으면
                    // 기준 슬롯이 없어 드래그가 중단된다. 표시 시작 분을 기준값에 더해
                    // 새벽 표시 여부와 무관하게 같은 좌표 계산을 사용한다.
                    const visibleStartMinute = getTimeScheduleDisplayStartMinute();
                    const firstSlots = Array.from(target.querySelectorAll(
                        '.time-schedule-slot[data-minute="' + visibleStartMinute + '"]'
                    ));
                    const baseSlot = firstSlots.find(function(candidate) {
                        const rect = candidate.getBoundingClientRect();
                        return event.clientX >= rect.left && event.clientX <= rect.right;
                    });
                    if (!baseSlot || baseSlot.dataset.disabled === 'true') return;

                    const baseRect = baseSlot.getBoundingClientRect();
                    const rawSlotIndex = Math.round((desiredTop - baseRect.top) / state.slotPixelHeight);
                    const rawMinute = visibleStartMinute + rawSlotIndex * TIME_SCHEDULE_SNAP_MINUTES;
                    const normalizedDateTime = dateMinuteToDate(baseSlot.dataset.date, rawMinute);
                    if (!normalizedDateTime) return;

                    info = {
                        date: formatProjectDate(normalizedDateTime),
                        minute: normalizedDateTime.getHours() * 60 + normalizedDateTime.getMinutes()
                    };
                    slot = baseSlot;
                } else {
                    slot = getSlotAt(event.clientX, event.clientY);
                    if (!slot || slot.dataset.disabled === 'true') return;
                    info = getTimeScheduleSlotInfo(slot);
                    if (!info) return;
                }

                let startMinute = state.originalStart;
                let endMinute = state.originalEnd;
                let displayDate = info.date;
                let displayStartMinute = info.minute;
                let displayEndMinute = Math.min(24 * 60, displayStartMinute + state.segmentDurationMinutes);

                if (state.mode === 'MOVE') {
                    // 분할 카드의 다음 날 조각을 잡아도 조각 길이를 새 일정 길이로 저장하지 않는다.
                    // 드롭된 조각 위치에서 원본 전체 일정 안의 조각 오프셋을 빼 전체 시작 시각을 복원한다.
                    const droppedSegmentStart = dateMinuteToDate(info.date, info.minute);
                    if (!droppedSegmentStart) return;
                    const candidateFullStart = new Date(droppedSegmentStart.getTime() - state.segmentOffsetMinutes * 60000);
                    const candidateDayStart = new Date(candidateFullStart.getFullYear(), candidateFullStart.getMonth(), candidateFullStart.getDate());
                    startMinute = Math.round((candidateFullStart - candidateDayStart) / 60000);
                    endMinute = startMinute + state.fullDurationMinutes;
                    state.date = formatProjectDate(candidateFullStart);
                } else if (state.mode === 'RESIZE_START') {
                    // 분할된 첫날 조각의 상단을 조절해도 보이는 조각의 24:00을 전체 종료로 사용하지 않는다.
                    // 원본 전체 종료 일시는 고정하고 새 시작 일시만 변경한다.
                    const candidateFullStart = dateMinuteToDate(info.date, info.minute);
                    const fixedFullEnd = state.fullEndDateTime;
                    if (!candidateFullStart || !fixedFullEnd) return;
                    const maxStart = new Date(fixedFullEnd.getTime() - TIME_SCHEDULE_SNAP_MINUTES * 60000);
                    const normalizedFullStart = candidateFullStart > maxStart ? maxStart : candidateFullStart;
                    const startDay = new Date(normalizedFullStart.getFullYear(), normalizedFullStart.getMonth(), normalizedFullStart.getDate());
                    startMinute = Math.round((normalizedFullStart - startDay) / 60000);
                    endMinute = Math.round((fixedFullEnd - startDay) / 60000);
                    state.date = formatProjectDate(normalizedFullStart);

                    displayDate = state.originalDate;
                    displayStartMinute = state.date === state.originalDate ? startMinute : 0;
                    displayEndMinute = state.originalEnd;
                } else {
                    // 분할된 마지막 날 조각의 하단을 조절해도 그 조각의 00:00을 전체 시작으로 사용하지 않는다.
                    // 원본 전체 시작 일시는 고정하고 새 종료 일시만 변경한다.
                    const fixedFullStart = state.fullStartDateTime;
                    const candidateFullEnd = dateMinuteToDate(info.date, info.minute + TIME_SCHEDULE_SNAP_MINUTES);
                    if (!fixedFullStart || !candidateFullEnd) return;
                    const minEnd = new Date(fixedFullStart.getTime() + TIME_SCHEDULE_SNAP_MINUTES * 60000);
                    const normalizedFullEnd = candidateFullEnd < minEnd ? minEnd : candidateFullEnd;
                    const startDay = new Date(fixedFullStart.getFullYear(), fixedFullStart.getMonth(), fixedFullStart.getDate());
                    startMinute = Math.round((fixedFullStart - startDay) / 60000);
                    endMinute = Math.round((normalizedFullEnd - startDay) / 60000);
                    state.date = formatProjectDate(fixedFullStart);

                    displayDate = state.originalDate;
                    displayStartMinute = state.originalStart;
                    const originalDayStart = parseProjectDate(state.originalDate);
                    displayEndMinute = originalDayStart
                        ? Math.round((normalizedFullEnd - originalDayStart) / 60000)
                        : state.originalEnd;
                    displayEndMinute = Math.max(displayStartMinute + TIME_SCHEDULE_SNAP_MINUTES, Math.min(24 * 60, displayEndMinute));
                }

                state.startMinute = startMinute;
                state.endMinute = endMinute;

                const startSlot = target.querySelector('.time-schedule-slot[data-date="' + displayDate + '"][data-minute="' + displayStartMinute + '"]');
                const visibleEndMinute = Math.min(24 * 60, displayEndMinute);
                const endSlotMinute = Math.max(displayStartMinute, visibleEndMinute - TIME_SCHEDULE_SNAP_MINUTES);
                const endSlot = target.querySelector('.time-schedule-slot[data-date="' + displayDate + '"][data-minute="' + endSlotMinute + '"]');

                if (state.mode === 'MOVE') {
                    // 전날/다음 날로 정규화된 경우 해당 날짜 슬롯이 현재 열에 없을 수 있다.
                    // 이동 미리보기는 마우스가 놓인 열의 폭을 유지하고, 저장 값만 실제 날짜로 사용한다.
                    const previewColumnSlot = slot || startSlot;
                    if (!previewColumnSlot) return;
                    const startRect = previewColumnSlot.getBoundingClientRect();
                    // 이동 중에는 사용자가 카드를 집은 위치와 원본 카드 크기를 그대로 유지한다.
                    // 그리드 슬롯은 최종 시간 계산에만 사용하고 미리보기 카드의 크기를 다시 계산하지 않는다.
                    state.preview.style.left = startRect.left + 'px';
                    state.preview.style.top = (event.clientY - state.grabOffsetY) + 'px';
                    state.preview.style.setProperty('width', state.originalRect.width + 'px', 'important');
                    state.preview.style.setProperty('min-width', state.originalRect.width + 'px', 'important');
                    state.preview.style.setProperty('max-width', state.originalRect.width + 'px', 'important');
                    state.preview.style.setProperty('height', state.moveCardPixelHeight + 'px', 'important');
                    state.preview.style.setProperty('min-height', state.moveCardPixelHeight + 'px', 'important');
                    state.preview.style.setProperty('max-height', state.moveCardPixelHeight + 'px', 'important');
                } else {
                    if (!startSlot || !endSlot) return;
                    const startRect = startSlot.getBoundingClientRect();
                    const endRect = endSlot.getBoundingClientRect();
                    const dayColumn = Array.from(target.querySelectorAll('.time-schedule-day-header')).findIndex(function(header) {
                        return header.dataset.date === displayDate;
                    });
                    if (dayColumn >= 0) state.card.style.gridColumn = (dayColumn + 2) + ' / span 1';
                    const displayStartMinute = getTimeScheduleDisplayStartMinute();
                    state.card.style.gridRow = ((Math.max(displayStartMinute, startMinute) - displayStartMinute) / TIME_SCHEDULE_SNAP_MINUTES + 1) + ' / ' + ((Math.min(24 * 60, endMinute) - displayStartMinute) / TIME_SCHEDULE_SNAP_MINUTES + 1);
                    state.card.dataset.startMinute = String(startMinute);
                    state.card.dataset.endMinute = String(endMinute);
                }
                state.preview.classList.toggle('is-conflict', hasConflict(state.date, startMinute, endMinute, state.card.dataset.timeScheduleItemId));
                const timeEl = state.preview.querySelector('.time-schedule-event-time');
                if (timeEl) {
                    const dayOffset = Math.floor(endMinute / (24 * 60));
                    timeEl.textContent = minutesToTime(startMinute) + ' ~ ' + minutesToTime(endMinute)
                        + (dayOffset > 0 ? ' (+' + dayOffset + '일)' : '');
                }
            }, true);

            document.addEventListener('mouseup', async function(event) {
                if (!state) return;
                const current = state;
                if (!current.moved) {
                    const plan = current.plan || {};
                    const planMode = String(plan.PLAN_MODE || plan.planMode || '').toUpperCase();
                    const isWeeklyPlanCard = planMode === 'WEEKLY_PLAN' || !!(plan.WEEKLY_PLAN_ID || plan.weeklyPlanId);
                    const itemId = current.card.dataset.timeScheduleItemId;
                    clearCardDrag();
                    window.setTimeout(function() {
                        if (isWeeklyPlanCard) {
                            if (typeof window.openWeeklyPlanEditorByGridId === 'function') {
                                window.openWeeklyPlanEditorByGridId(itemId);
                            } else if (typeof openWeeklyPlanEditorByGridId === 'function') {
                                openWeeklyPlanEditorByGridId(itemId);
                            }
                            return;
                        }
                        openTimeSchedulePlanEditor(itemId);
                    }, 0);
                    return;
                }

                // 드래그/리사이즈 뒤 브라우저가 같은 포인터 동작을 click으로 이어 보내는 것을 차단한다.
                // 그렇지 않으면 저장 직후 카드 onclick이 실행돼 수정 모달이 다시 열린다.
                window.suppressTimeScheduleClick = true;
                window.__timeScheduleSuppressCardClickUntil = Date.now() + 350;
                window.setTimeout(function() {
                    if (Date.now() >= (window.__timeScheduleSuppressCardClickUntil || 0)) {
                        window.suppressTimeScheduleClick = false;
                    }
                }, 380);
                if (hasConflict(current.date, current.startMinute, current.endMinute, current.card.dataset.timeScheduleItemId)) {
                    clearCardDrag();
                    alert('해당 시간대에 이미 등록된 시간별 계획이 있습니다.');
                    return;
                }
                try {
                    await saveCardRange(current);
                } catch (error) {
                    console.error('[시간별 계획] 드래그 수정 실패:', error);
                    alert(error.message || '시간별 계획을 수정하지 못했습니다.');
                } finally {
                    clearCardDrag();
                }
            }, true);

            if (!target.__timeScheduleCardClickGuardBound) {
                target.__timeScheduleCardClickGuardBound = true;
                target.addEventListener('click', function(event) {
                    if (Date.now() < (window.__timeScheduleSuppressCardClickUntil || 0)) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        return false;
                    }
                }, true);
            }
        }

        function getSundayStart(date) {
            const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            result.setDate(result.getDate() - result.getDay());
            return result;
        }

        function buildTimePlanWeeks(rangeStart, rangeEnd) {
            const weeks = [];
            if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) return weeks;

            let cursor = getSundayStart(rangeStart);
            let weekNo = 1;

            while (cursor <= rangeEnd) {
                const calendarWeekStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
                const calendarWeekEnd = addDays(calendarWeekStart, 6);
                const visibleStart = calendarWeekStart < rangeStart ? rangeStart : calendarWeekStart;
                const visibleEnd = calendarWeekEnd > rangeEnd ? rangeEnd : calendarWeekEnd;

                weeks.push({
                    weekNo: weekNo,
                    calendarStart: calendarWeekStart,
                    calendarEnd: calendarWeekEnd,
                    start: visibleStart,
                    end: visibleEnd
                });

                cursor = addDays(calendarWeekStart, 7);
                weekNo++;
            }

            return weeks;
        }

        function buildTimeScheduleDays(calendarWeekStart, activeStart, activeEnd) {
            const days = [];
            if (!calendarWeekStart || !activeStart || !activeEnd) return days;

            for (let i = 0; i < 7; i++) {
                const date = addDays(calendarWeekStart, i);
                const dateText = formatProjectDate(date);
                days.push({
                    date: dateText,
                    label: formatGanttDate(date),
                    day: date.getDay(),
                    weekend: date.getDay() === 0 || date.getDay() === 6,
                    active: date >= activeStart && date <= activeEnd
                });
            }

            return days;
        }

        function moveTimePlanWeek(direction) {
            const range = ensureTimePlanRange();
            if (!range) return;
            const weeks = buildTimePlanWeeks(parseProjectDate(range.start), parseProjectDate(range.end));
            if (weeks.length === 0) return;
            currentTimePlanWeekIndex = Math.max(0, Math.min(weeks.length - 1, currentTimePlanWeekIndex + direction));
            renderTimeSchedule();
        }

        // 종료 시각은 해당 시각 직전까지 차지하므로 끝 행을 배타적으로 계산한다.
        // 예: 07:00~08:00은 07시 한 칸만 사용하고, 08:00 일정과 겹치지 않는다.

        const TIME_SCHEDULE_DAWN_START_MINUTE = 6 * 60;

        function getTimeScheduleDisplayStartMinute() {
            return timeScheduleDawnExpanded ? 0 : TIME_SCHEDULE_DAWN_START_MINUTE;
        }

        function getTimeScheduleDawnPreferenceKey() {
            const projId = typeof getCurrentProjectId === 'function' ? getCurrentProjectId() : '';
            return (isWeeklyScheduleGridMode() ? 'moyo.weeklySchedule.showDawn.' : 'moyo.timeSchedule.showDawn.') + String(projId || 'default');
        }

        function loadTimeScheduleDawnPreference() {
            try {
                timeScheduleDawnExpanded = window.localStorage.getItem(getTimeScheduleDawnPreferenceKey()) === 'Y';
            } catch (error) {
                timeScheduleDawnExpanded = false;
            }
            syncTimeScheduleDawnToggle();
            return timeScheduleDawnExpanded;
        }

        function saveTimeScheduleDawnPreference(checked) {
            timeScheduleDawnExpanded = !!checked;
            try {
                window.localStorage.setItem(getTimeScheduleDawnPreferenceKey(), timeScheduleDawnExpanded ? 'Y' : 'N');
            } catch (error) {
                // 저장소 사용이 제한된 환경에서는 현재 화면 상태만 유지한다.
            }
            syncTimeScheduleDawnToggle();
            renderActiveScheduleGrid();
        }

        function syncTimeScheduleDawnToggle() {
            const toggle = document.getElementById(isWeeklyScheduleGridMode() ? 'showWeeklyPlanDawnHours' : 'showTimeScheduleDawn');
            if (toggle) toggle.checked = !!timeScheduleDawnExpanded;
        }


        function renderTimeScheduleTable(schedules, rangeStart, rangeEnd, targetEl, calendarWeekStart) {
            const target = targetEl || getScheduleGridRoot();
            if (!target) return;

            schedules = schedules || [];
            const weekStart = calendarWeekStart || getSundayStart(rangeStart);
            const days = buildTimeScheduleDays(weekStart, rangeStart, rangeEnd);
            if (isWeeklyScheduleGridMode()) {
                const labels=['일','월','화','수','목','금','토'];
                days.forEach(function(day,index){ day.label=labels[index]; day.active=true; });
            }

            if (days.length !== 7) {
                target.innerHTML = '<div class="time-schedule-empty">시간별 계획 기간을 최대 28일까지 지정해 주세요.</div>';
                return;
            }

            const timeSchedules = (isWeeklyScheduleGridMode() ? [] : schedules).filter(function(schedule) {
                const startDate = schedule.START_DATE || schedule.startDate || '';
                const endDate = schedule.END_DATE || schedule.endDate || startDate;
                return isScheduleTimeEnabled(schedule)
                    && days.some(function(day) { return day.date >= startDate && day.date <= endDate; });
            });

            const displayStartMinute = getTimeScheduleDisplayStartMinute();
            const startHour = displayStartMinute / 60;
            const endHour = 23;
            const totalSlots = (24 * 60 - displayStartMinute) / TIME_SCHEDULE_SNAP_MINUTES;

            const fullRange = isWeeklyScheduleGridMode() ? {start: WEEKLY_GRID_BASE_DATES[0], end: WEEKLY_GRID_BASE_DATES[6]} : ensureTimePlanRange();
            const allWeeks = fullRange ? buildTimePlanWeeks(parseProjectDate(fullRange.start), parseProjectDate(fullRange.end)) : [];
            const activeWeekIndex = allWeeks.findIndex(function(week) {
                return formatProjectDate(week.start) === formatProjectDate(rangeStart)
                    && formatProjectDate(week.end) === formatProjectDate(rangeEnd);
            });
            const activeWeekNo = activeWeekIndex >= 0 ? activeWeekIndex + 1 : 1;
            const activeCalendarWeek = activeWeekIndex >= 0 ? allWeeks[activeWeekIndex] : null;
            const displayWeekStart = activeCalendarWeek ? activeCalendarWeek.calendarStart : weekStart;
            const displayWeekEnd = activeCalendarWeek ? activeCalendarWeek.calendarEnd : addDays(weekStart, 6);
            const prevDisabled = activeWeekIndex <= 0;
            const nextDisabled = activeWeekIndex < 0 || activeWeekIndex >= allWeeks.length - 1;

            const hasMultipleWeeks = allWeeks.length > 1;
            let html = '<div class="time-schedule-table-wrap">';
            html += '<div class="time-schedule-title-row">'
                + '<div class="time-plan-week-summary">'
                + '<div class="time-plan-week-nav' + (hasMultipleWeeks ? '' : ' is-single-week') + '">'
                + (hasMultipleWeeks
                    ? '<button type="button" class="time-plan-week-nav__btn" onclick="moveTimePlanWeek(-1)"' + (prevDisabled ? ' disabled' : '') + ' aria-label="이전 주">‹</button>'
                    : '')
                + '<span class="time-plan-week-nav__info">'
                + '<strong class="time-plan-week-nav__label">'
                + (isWeeklyScheduleGridMode()
                    ? '프로젝트 기간 동안 매주 반복'
                    : (hasMultipleWeeks ? activeWeekNo + ' / ' + allWeeks.length + '주차' : '1주차'))
                + '</strong>'
                + '</span>'
                + (hasMultipleWeeks
                    ? '<button type="button" class="time-plan-week-nav__btn" onclick="moveTimePlanWeek(1)"' + (nextDisabled ? ' disabled' : '') + ' aria-label="다음 주">›</button>'
                    : '')
                + '</div>'
                + '</div>'
                + '<div class="time-schedule-title-meta">'
                + '<div class="time-schedule-drag-guide"><strong>빈 시간대를 드래그해</strong><span>계획을 등록할 수 있습니다.</span></div>'
                + '</div>'
                + '</div>';
            const allDayPlans = getActiveScheduleGridItems().filter(function(plan) {
                const date = plan.START_DATE || plan.startDate || plan.PLAN_DATE || plan.planDate || '';
                return days.some(function(day) { return day.date === date; })
                    && String(plan.ALL_DAY_YN || plan.allDayYn || 'N').toUpperCase() === 'Y';
            });
            if (allDayPlans.length) {
                html += '<div class="time-schedule-all-day"><strong>종일</strong><div class="time-schedule-all-day__items">';
                allDayPlans.forEach(function(plan) {
                    const id = plan.TIME_PLAN_ID || plan.timePlanId;
                    const title = plan.TITLE || plan.title || '시간별 계획';
                    const date = plan.START_DATE || plan.startDate || plan.PLAN_DATE || plan.planDate || '';
                    const color = plan.COLOR || plan.color || '#7c5cff';
                    html += '<button type="button" class="time-schedule-all-day__item" onclick="openTimeSchedulePlanEditor(' + id + ')" style="border-color:' + color + ';">'
                        + '<span>' + safeTaskHtml(date.substring(5).replace('-', '/')) + '</span>'
                        + '<strong>' + safeTaskHtml(title) + '</strong></button>';
                });
                html += '</div></div>';
            }

            const commonGridColumns = days.map(function(day) {
                return {
                    key: day.date,
                    label: day.label,
                    active: day.active,
                    today: day.date === formatProjectDate(new Date()),
                    weekend: day.weekend,
                    sunday: day.day === 0,
                    saturday: day.day === 6
                };
            });
            const now = new Date();
            html += ProjectScheduleGrid.buildHeader({
                mode: 'DATE',
                columns: commonGridColumns,
                timeHeaderLabel: '시간'
            });
            html += ProjectScheduleGrid.buildBody({
                mode: 'DATE',
                columns: commonGridColumns,
                snapMinutes: TIME_SCHEDULE_SNAP_MINUTES,
                displayStartMinute: displayStartMinute,
                displayEndMinute: 24 * 60,
                nowMinute: now.getHours() * 60 + now.getMinutes()
            });

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

                    const startMinutes = isFirstDay ? (parseInt(startTime.substring(0, 2), 10) * 60 + parseInt(startTime.substring(3, 5), 10)) : 0;
                    const endMinutes = isLastDay ? (parseInt(endTime.substring(0, 2), 10) * 60 + parseInt(endTime.substring(3, 5), 10)) : 24 * 60;
                    const snappedStart = Math.max(0, Math.floor(startMinutes / TIME_SCHEDULE_SNAP_MINUTES) * TIME_SCHEDULE_SNAP_MINUTES);
                    const snappedEnd = Math.min(24 * 60, Math.max(snappedStart + TIME_SCHEDULE_SNAP_MINUTES, Math.ceil(endMinutes / TIME_SCHEDULE_SNAP_MINUTES) * TIME_SCHEDULE_SNAP_MINUTES));
                    const visibleStart = Math.max(displayStartMinute, snappedStart);
                    const visibleEnd = Math.min(24 * 60, snappedEnd);
                    if (visibleEnd <= visibleStart) return;

                    const placement = ProjectScheduleGrid.getPlacement({
                        columnIndex: idx,
                        startMinute: snappedStart,
                        endMinute: snappedEnd,
                        displayStartMinute: displayStartMinute,
                        displayEndMinute: 24 * 60,
                        snapMinutes: TIME_SCHEDULE_SNAP_MINUTES
                    });
                    if (!placement) return;

                    html += '<div class="time-schedule-event time-schedule-event--schedule" data-card-type="SCHEDULE" data-schedule-id="' + scheduleId + '" data-date="' + day.date + '" data-start-minute="' + snappedStart + '" data-end-minute="' + snappedEnd + '" onclick="if (!suppressTimeScheduleClick) openProjectPlanScheduleDetail(' + scheduleId + ', \'TIME_SCHEDULE\')" '
                        + 'style="grid-column:' + placement.column + '; grid-row:' + placement.rowStart + ' / ' + placement.rowEnd + '; background:' + color + ';" '
                        + 'title="일정 · ' + safeTaskHtml(title) + ' · ' + startTime + ' ~ ' + endTime + '">'
                        + '<span class="time-schedule-event-type" aria-hidden="true">일정</span>'
                        + '<span class="time-schedule-event-title">' + safeTaskHtml(title) + '</span>'
                        + '</div>';
                });
            });

            getActiveScheduleGridItems().forEach(function(plan) {
                const startDate = String(plan.START_DATE || plan.startDate || plan.PLAN_DATE || plan.planDate || '').substring(0, 10);
                const endDate = String(plan.END_DATE || plan.endDate || startDate).substring(0, 10);
                const allDay = String(plan.ALL_DAY_YN || plan.allDayYn || 'N').toUpperCase() === 'Y';
                if (!startDate || allDay) return;

                const startTime = normalizeScheduleTime(plan.START_TIME || plan.startTime, '09:00');
                const endTime = normalizeScheduleTime(plan.END_TIME || plan.endTime, '10:00');
                const startTimeMinutes = parseInt(startTime.substring(0, 2), 10) * 60 + parseInt(startTime.substring(3, 5), 10);
                const endTimeMinutes = parseInt(endTime.substring(0, 2), 10) * 60 + parseInt(endTime.substring(3, 5), 10);
                const timeScheduleItemId = plan.TIME_PLAN_ID || plan.timePlanId;
                const planMode = String(plan.PLAN_MODE || plan.planMode || '').toUpperCase();
                const isWeeklyPlanCard = planMode === 'WEEKLY_PLAN' || !!(plan.WEEKLY_PLAN_ID || plan.weeklyPlanId);
                const itemTitle = plan.TITLE || plan.title || plan.TASK_TITLE || plan.taskTitle || '시간별 계획';
                const itemColor = plan.COLOR || plan.color || '#7c5cff';
                const hasTask = !!(plan.TASK_ID || plan.taskId);
                const cardTypeClass = hasTask ? ' time-schedule-event--task' : ' time-schedule-event--plan';
                const cardTypeValue = hasTask ? 'TASK' : 'PLAN';
                const cardTypeLabel = hasTask ? '업무' : '계획';

                days.forEach(function(day, dayIndex) {
                    if (day.date < startDate || day.date > endDate) return;
                    const isFirstDay = day.date === startDate;
                    const isLastDay = day.date === endDate;
                    const weeklyOvernightPlan = isWeeklyPlanCard && endDate > startDate;

                    // 자정을 넘긴 주간 계획도 시간별 계획과 동일하게 날짜(요일)별 구간으로 렌더링한다.
                    // 시작 요일은 시작 시각~24:00, 다음 요일은 00:00~종료 시각을 사용한다.
                    let segmentStart = isFirstDay ? startTimeMinutes : 0;
                    let segmentEnd = isLastDay ? endTimeMinutes : 24 * 60;

                    if (isLastDay && segmentEnd === 0 && day.date !== startDate) return;
                    if (segmentEnd <= segmentStart) return;

                    const snappedStart = Math.max(0, Math.floor(segmentStart / TIME_SCHEDULE_SNAP_MINUTES) * TIME_SCHEDULE_SNAP_MINUTES);
                    const snappedEnd = Math.min(24 * 60, Math.max(snappedStart + TIME_SCHEDULE_SNAP_MINUTES, Math.ceil(segmentEnd / TIME_SCHEDULE_SNAP_MINUTES) * TIME_SCHEDULE_SNAP_MINUTES));
                    const displayStart = isFirstDay ? startTime : '00:00';
                    const displayEnd = isLastDay ? endTime : '24:00';
                    const compactStartDate = startDate.substring(5).replace('-', '/');
                    const compactEndDate = endDate.substring(5).replace('-', '/');
                    const startDateValue = parseProjectDate(startDate);
                    const endDateValue = parseProjectDate(endDate);
                    const spanDays = startDateValue && endDateValue
                        ? Math.max(1, Math.round((endDateValue - startDateValue) / 86400000) + 1)
                        : 1;
                    const crossesDate = endDate > startDate;
                    const midnightOnlyNextDay = crossesDate && spanDays === 2 && endTimeMinutes === 0;
                    const showContinuity = crossesDate && !midnightOnlyNextDay;
                    const continuesFromPreviousDay = showContinuity && !isFirstDay;
                    const continuesToNextDay = showContinuity && !isLastDay;
                    // 주간 계획은 같은 계획의 다음 요일 구간을 일반 카드로 표시한다.
                    // 연결 점선 클래스는 시간별 UI와 다르게 보이므로 주간 모드에서는 적용하지 않는다.
                    const continuityClass = isWeeklyPlanCard
                        ? ''
                        : ((continuesFromPreviousDay ? ' is-continued-from-previous' : '')
                            + (continuesToNextDay ? ' is-continued-to-next' : ''));

                    let timeDisplayText = displayStart + ' ~ ' + displayEnd;
                    let segmentTitleText = itemTitle;
                    if (weeklyOvernightPlan) {
                        // 두 요일 조각 모두 하나의 계획임을 동일한 전체 시간으로 표시한다.
                        timeDisplayText = startTime + ' ~ ' + endTime + ' (+1일)';
                    } else if (showContinuity) {
                        if (isFirstDay) {
                            timeDisplayText = startTime + ' → ' + compactEndDate + ' ' + endTime;
                        } else if (isLastDay) {
                            timeDisplayText = compactStartDate + ' ' + startTime + ' → ' + endTime;
                        } else {
                            timeDisplayText = compactStartDate + '부터 · ' + compactEndDate + ' ' + endTime + ' 종료';
                        }
                    }

                    const visibleStart = Math.max(displayStartMinute, snappedStart);
                    const visibleEnd = Math.min(24 * 60, snappedEnd);
                    if (visibleEnd <= visibleStart) return;

                    const segmentDurationMinutes = visibleEnd - visibleStart;
                    const compactHeightClass = segmentDurationMinutes <= 30
                        ? ' is-micro-height'
                        : (segmentDurationMinutes <= 60 ? ' is-compact-height' : '');

                    const placement = ProjectScheduleGrid.getPlacement({
                        columnIndex: dayIndex,
                        startMinute: snappedStart,
                        endMinute: snappedEnd,
                        displayStartMinute: displayStartMinute,
                        displayEndMinute: 24 * 60,
                        snapMinutes: TIME_SCHEDULE_SNAP_MINUTES
                    });
                    if (!placement) return;

                    html += '<button type="button" class="time-schedule-event time-schedule-task-placement' + cardTypeClass + continuityClass + compactHeightClass + '" data-card-type="' + cardTypeValue + '" data-time-schedule-item-id="' + timeScheduleItemId + '" data-date="' + day.date + '" data-start-minute="' + snappedStart + '" data-end-minute="' + snappedEnd + '" '
                        + 'onclick="if(' + (isWeeklyPlanCard ? 'true' : 'false') + '){openWeeklyPlanEditorByGridId(' + timeScheduleItemId + ')}else{openTimeSchedulePlanEditor(' + timeScheduleItemId + ')}" '
                        + 'style="grid-column:' + placement.column + ' / span 1; grid-row:' + placement.rowStart + ' / ' + placement.rowEnd + '; justify-self:stretch; width:auto; left:auto; right:auto; transform:none; --time-plan-card-color:' + itemColor + '; background:' + itemColor + ';" '
                        + 'title="' + cardTypeLabel + ' · ' + safeTaskHtml(itemTitle) + ' · ' + startDate + ' ' + startTime + ' ~ ' + endDate + ' ' + endTime + '">'
                        + (hasTask ? '<span class="time-schedule-event-type" aria-hidden="true">업무</span>' : '')
                        + (isFirstDay ? '<span class="time-schedule-resize-handle time-schedule-resize-handle--start" data-resize-mode="RESIZE_START" aria-hidden="true"></span>' : '')
                        + (segmentTitleText ? '<span class="time-schedule-event-title">' + safeTaskHtml(segmentTitleText) + '</span>' : '')
                        + (timeDisplayText ? '<span class="time-schedule-event-time">' + safeTaskHtml(timeDisplayText) + '</span>' : '')
                        + (isLastDay ? '<span class="time-schedule-resize-handle time-schedule-resize-handle--end" data-resize-mode="RESIZE_END" aria-hidden="true"></span>' : '')
                        + '</button>';
                });
            });

            html += ProjectScheduleGrid.closeBody();
            html += '</div>';
            target.innerHTML = html;
            target.querySelectorAll('.time-schedule-task-placement').forEach(function(card) {
                card.classList.remove('is-overlap', 'is-overlapping', 'time-schedule-event--overlap');
                card.style.removeProperty('--time-schedule-overlap-count');
                card.style.removeProperty('--time-schedule-overlap-index');
                card.style.removeProperty('--time-schedule-card-width');
                card.style.removeProperty('--time-schedule-card-left');
                card.style.justifySelf = 'stretch';
                card.style.width = 'auto';
                card.style.left = 'auto';
                card.style.right = 'auto';
                card.style.transform = 'none';
            });
            bindTimeScheduleDragHandlers();
            bindTimeScheduleCardEditHandlers(target);
            window.setTimeout(function() {
                const scroller = target.querySelector('.time-schedule-grid-scroll');
                const header = target.querySelector('.time-schedule-grid-header');
                if (!scroller) return;

                if (header) {
                    const style = window.getComputedStyle(scroller);
                    const borderWidth = (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
                    const scrollbarWidth = Math.max(0, scroller.offsetWidth - scroller.clientWidth - borderWidth);
                    header.style.setProperty('--time-schedule-scrollbar-width', scrollbarWidth + 'px');
                }

                const now = new Date();
                const todayVisible = days.some(function(day) { return day.date === formatProjectDate(now) && day.active; });
                const focusHour = todayVisible ? Math.max(startHour, now.getHours() - 2) : Math.max(startHour, 7);
                scroller.scrollTop = Math.max(0, focusHour - startHour) * TIME_SCHEDULE_SLOTS_PER_HOUR * 14;
            }, 0);
        }



        function getTimeSchedulePlacementRange() {
            const saved = readSavedTimePlanRange();
            if (saved) return { startDate: saved.start, endDate: saved.end };
            const start = window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectStartDate;
            const end = window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectEndDate;
            return { startDate: start || '', endDate: end || '' };
        }

        async function loadProjectTimeScheduleItems() {
            const projId = getCurrentProjectId();
            const range = getTimeSchedulePlacementRange();
            if (!projId || !range.startDate || !range.endDate) {
                projectTimeScheduleItems = [];
                return projectTimeScheduleItems;
            }
            const url = getProjectMainContextPath() + '/project/api/time-plans?projId=' + encodeURIComponent(projId)
                + '&startDate=' + encodeURIComponent(range.startDate) + '&endDate=' + encodeURIComponent(range.endDate);
            const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'include' });
            const body = await response.json().catch(function() { return {}; });
            if (!response.ok || body.success === false) throw new Error(body.message || '시간별 계획 항목을 불러오지 못했습니다.');
            projectTimeScheduleItems = Array.isArray(body.data) ? body.data : [];
            return projectTimeScheduleItems;
        }

        function openTimeSchedulePlanEditor(timePlanId) {
            const plan = (projectTimeScheduleItems || []).find(function(item) {
                return String(item.TIME_PLAN_ID || item.timePlanId) === String(timePlanId);
            });
            if (!plan || typeof window.openProjectPlanSharedModal !== 'function') return;

            const startDate = String(plan.START_DATE || plan.startDate || plan.PLAN_DATE || plan.planDate || '').substring(0, 10);
            const endDate = String(plan.END_DATE || plan.endDate || plan.START_DATE || plan.startDate || plan.PLAN_DATE || plan.planDate || '').substring(0, 10);
            window.openProjectPlanSharedModal({
                mode: 'TIME_PLAN',
                timePlanId: Number(plan.TIME_PLAN_ID || plan.timePlanId),
                startDate: startDate,
                endDate: endDate || startDate,
                startTime: String(plan.START_TIME || plan.startTime || '').substring(0, 5),
                endTime: String(plan.END_TIME || plan.endTime || '').substring(0, 5),
                item: {
                    entityId: Number(plan.TIME_PLAN_ID || plan.timePlanId),
                    title: plan.TITLE || plan.title || '',
                    description: plan.DESCRIPTION || plan.description || '',
                    color: plan.COLOR || plan.color || '#4A90E2',
                    startDate: startDate,
                    endDate: endDate || startDate,
                    recordEnabledYn: String(plan.recordEnabledYn || plan.RECORD_ENABLED_YN || 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
                    recordVisibility: String(plan.recordVisibility || plan.RECORD_VISIBILITY || 'PROJECT').toUpperCase() === 'MANAGER' ? 'MANAGER' : 'PROJECT',
                    createdBy: plan.createdBy || plan.CREATED_BY || null,
                    editorUserIds: Array.isArray(plan.editorUserIds || plan.EDITOR_USER_IDS) ? (plan.editorUserIds || plan.EDITOR_USER_IDS).map(Number) : []
                }
            });
        }


const TIME_PLAN_MAX_DAYS = 28;
let timePlanRangeRequiredOnSave = false;
let timePlanCalendarViews = { start: null, end: null };

function getTimePlanCalendarMonth(value) {
    const date = parseProjectDate(value);
    return date ? { year: date.getFullYear(), month: date.getMonth() } : null;
}

function moveTimePlanCalendarMonth(kind, delta) {
    const current = timePlanCalendarViews[kind];
    if (!current) return;
    const moved = new Date(current.year, current.month + delta, 1);
    timePlanCalendarViews[kind] = { year: moved.getFullYear(), month: moved.getMonth() };
    renderTimePlanRangeCalendars();
}

function selectTimePlanCalendarDate(kind, value) {
    const bounds = getProjectTimePlanBounds();
    if (!value || value < bounds.start || value > bounds.end) return;
    const startInput = document.getElementById('timePlanRangeStart');
    const endInput = document.getElementById('timePlanRangeEnd');
    if (!startInput || !endInput) return;

    if (kind === 'start') {
        startInput.value = value;
        if (!endInput.value || endInput.value < value || getInclusiveDayCount(value, endInput.value) > TIME_PLAN_MAX_DAYS) {
            const endDate = parseProjectDate(value);
            endDate.setDate(endDate.getDate() + TIME_PLAN_MAX_DAYS - 1);
            const limited = formatProjectDate(endDate);
            endInput.value = limited > bounds.end ? bounds.end : limited;
            timePlanCalendarViews.end = getTimePlanCalendarMonth(endInput.value);
        }
    } else {
        if (startInput.value && value < startInput.value) return;
        if (startInput.value && getInclusiveDayCount(startInput.value, value) > TIME_PLAN_MAX_DAYS) return;
        endInput.value = value;
    }
    const error = document.getElementById('timePlanRangeError');
    if (error) { error.hidden = true; error.textContent = ''; }
    renderTimePlanRangeCalendars();
}

function renderTimePlanCalendar(kind) {
    const panel = document.getElementById(kind === 'start' ? 'timePlanStartCalendar' : 'timePlanEndCalendar');
    const selectedInput = document.getElementById(kind === 'start' ? 'timePlanRangeStart' : 'timePlanRangeEnd');
    if (!panel || !selectedInput) return;
    const bounds = getProjectTimePlanBounds();
    const startValue = document.getElementById('timePlanRangeStart')?.value || '';
    const selectedValue = selectedInput.value || '';
    const view = timePlanCalendarViews[kind] || getTimePlanCalendarMonth(selectedValue || bounds.start);
    timePlanCalendarViews[kind] = view;
    const first = new Date(view.year, view.month, 1);
    const gridStart = new Date(view.year, view.month, 1 - first.getDay());
    const today = formatProjectDate(new Date());
    const weekdays = ['일','월','화','수','목','금','토'];
    let days = '';
    for (let i = 0; i < 42; i += 1) {
        const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
        const value = formatProjectDate(date);
        const classes = ['time-plan-calendar__day'];
        if (date.getMonth() !== view.month) classes.push('is-muted');
        if (value === today) classes.push('is-today');
        if (value === selectedValue) classes.push('is-selected');
        const endValue = document.getElementById('timePlanRangeEnd')?.value || '';
        if (startValue && endValue && value >= startValue && value <= endValue) classes.push('is-in-range');
        let disabled = value < bounds.start || value > bounds.end;
        if (kind === 'end' && startValue) {
            disabled = disabled || value < startValue || getInclusiveDayCount(startValue, value) > TIME_PLAN_MAX_DAYS;
        }
        days += '<button type="button" class="' + classes.join(' ') + '" data-time-plan-date="' + value + '" data-time-plan-kind="' + kind + '"' + (disabled ? ' disabled' : '') + '>' + date.getDate() + '</button>';
    }
    const minMonthValue = kind === 'end' && startValue ? startValue : bounds.start;
    let maxMonthValue = bounds.end;
    if (kind === 'end' && startValue) {
        const maxEndDate = parseProjectDate(startValue);
        maxEndDate.setDate(maxEndDate.getDate() + TIME_PLAN_MAX_DAYS - 1);
        const maxEndValue = formatProjectDate(maxEndDate);
        if (!maxMonthValue || maxEndValue < maxMonthValue) maxMonthValue = maxEndValue;
    }
    const currentMonthIndex = view.year * 12 + view.month;
    const minMonth = getTimePlanCalendarMonth(minMonthValue);
    const maxMonth = getTimePlanCalendarMonth(maxMonthValue);
    const previousDisabled = minMonth && currentMonthIndex <= (minMonth.year * 12 + minMonth.month);
    const nextDisabled = maxMonth && currentMonthIndex >= (maxMonth.year * 12 + maxMonth.month);

    panel.innerHTML = ''
        + '<div class="time-plan-calendar__head">'
        + '<strong>' + view.year + '년 ' + (view.month + 1) + '월</strong>'
        + '<div><button type="button" onclick="moveTimePlanCalendarMonth(\'' + kind + '\',-1)" aria-label="이전 달"' + (previousDisabled ? ' disabled' : '') + '>‹</button><button type="button" onclick="moveTimePlanCalendarMonth(\'' + kind + '\',1)" aria-label="다음 달"' + (nextDisabled ? ' disabled' : '') + '>›</button></div>'
        + '</div>'
        + '<div class="time-plan-calendar__weekdays">' + weekdays.map(function(day){ return '<span>' + day + '</span>'; }).join('') + '</div>'
        + '<div class="time-plan-calendar__days">' + days + '</div>';
}

function renderTimePlanRangeCalendars() {
    renderTimePlanCalendar('start');
    renderTimePlanCalendar('end');
    const start = document.getElementById('timePlanRangeStart')?.value || '-';
    const end = document.getElementById('timePlanRangeEnd')?.value || '-';
    const startLabel = document.getElementById('timePlanStartSelected');
    const endLabel = document.getElementById('timePlanEndSelected');
    if (startLabel) startLabel.textContent = start === '-' ? start : formatProjectPlanDate(start);
    if (endLabel) endLabel.textContent = end === '-' ? end : formatProjectPlanDate(end);
}

document.addEventListener('click', function(event) {
    const day = event.target.closest('[data-time-plan-date]');
    if (!day || day.disabled) return;
    selectTimePlanCalendarDate(day.dataset.timePlanKind, day.dataset.timePlanDate);
});

function readSavedTimePlanRange() {
    const start = normalizeTimePlanDate(typeof projectPlanServerFeatures !== 'undefined' ? projectPlanServerFeatures.timeRangeStart : '');
    const end = normalizeTimePlanDate(typeof projectPlanServerFeatures !== 'undefined' ? projectPlanServerFeatures.timeRangeEnd : '');
    return start && end ? { start: start, end: end } : null;
}

function normalizeTimePlanDate(value) {
    return String(value || '').substring(0, 10);
}

function getInclusiveDayCount(start, end) {
    const startDate = parseProjectDate(start);
    const endDate = parseProjectDate(end);
    if (!startDate || !endDate) return 0;
    return Math.floor((endDate - startDate) / 86400000) + 1;
}

function getProjectTimePlanBounds() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    return {
        start: normalizeTimePlanDate(config.projectStartDate),
        end: normalizeTimePlanDate(config.projectEndDate)
    };
}

function isValidTimePlanRange(range) {
    if (!range || !range.start || !range.end) return false;
    const bounds = getProjectTimePlanBounds();
    const count = getInclusiveDayCount(range.start, range.end);
    return count >= 1 && count <= TIME_PLAN_MAX_DAYS
        && (!bounds.start || range.start >= bounds.start)
        && (!bounds.end || range.end <= bounds.end);
}

function ensureTimePlanRange() {
    const bounds = getProjectTimePlanBounds();
    if (!bounds.start || !bounds.end) return null;
    const projectDays = getInclusiveDayCount(bounds.start, bounds.end);
    if (projectDays <= TIME_PLAN_MAX_DAYS) return bounds;
    const saved = readSavedTimePlanRange();
    return isValidTimePlanRange(saved) ? saved : null;
}

function syncTimePlanRangeButton() {
    const button = document.getElementById('timePlanRangeBtn');
    const summary = document.getElementById('timePlanRangeSummary');
    const bounds = getProjectTimePlanBounds();
    const projectDays = getInclusiveDayCount(bounds.start, bounds.end);
    const range = ensureTimePlanRange();
    const hasCustomRange = projectDays > TIME_PLAN_MAX_DAYS && !!range;

    if (button) {
        button.textContent = '기간 변경';
        button.hidden = !hasCustomRange;
    }

    if (summary) {
        if (range) {
            summary.textContent = '시간별 계획 기간 · ' + formatProjectPlanDate(range.start) + ' ~ ' + formatProjectPlanDate(range.end);
            summary.hidden = false;
        } else {
            summary.textContent = '';
            summary.hidden = true;
        }
    }
}

function openTimePlanRangeModal(required) {
    if (!canManageProjectPlan()) return;
    const modal = document.getElementById('timePlanRangeModal');
    const startInput = document.getElementById('timePlanRangeStart');
    const endInput = document.getElementById('timePlanRangeEnd');
    const guide = document.getElementById('timePlanRangeGuide');
    const error = document.getElementById('timePlanRangeError');
    if (!modal || !startInput || !endInput) return;
    const bounds = getProjectTimePlanBounds();
    const saved = readSavedTimePlanRange();
    const defaultStart = saved && isValidTimePlanRange(saved) ? saved.start : bounds.start;
    let defaultEnd = saved && isValidTimePlanRange(saved) ? saved.end : bounds.end;
    if (getInclusiveDayCount(defaultStart, defaultEnd) > TIME_PLAN_MAX_DAYS) {
        const endDate = parseProjectDate(defaultStart);
        endDate.setDate(endDate.getDate() + TIME_PLAN_MAX_DAYS - 1);
        defaultEnd = formatProjectDate(endDate);
    }
    startInput.value = defaultStart;
    endInput.value = defaultEnd;
    timePlanCalendarViews.start = getTimePlanCalendarMonth(defaultStart);
    timePlanCalendarViews.end = getTimePlanCalendarMonth(defaultEnd);
    renderTimePlanRangeCalendars();
    if (guide) guide.textContent = '시간별로 계획할 기간을 선택해 주세요. 최대 28일까지 선택할 수 있어요.';
    if (error) { error.hidden = true; error.textContent = ''; }
    timePlanRangeRequiredOnSave = required === true;
    modal.hidden = false;
    document.body.classList.add('project-plan-type-modal-open');
}

function closeTimePlanRangeModal() {
    const modal = document.getElementById('timePlanRangeModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('project-plan-type-modal-open');
    timePlanRangeRequiredOnSave = false;
}

async function saveTimePlanRange() {
    const start = normalizeTimePlanDate(document.getElementById('timePlanRangeStart')?.value);
    const end = normalizeTimePlanDate(document.getElementById('timePlanRangeEnd')?.value);
    const error = document.getElementById('timePlanRangeError');
    const range = { start: start, end: end };
    let message = '';
    if (!start || !end) message = '시작일과 종료일을 모두 선택해 주세요.';
    else if (start > end) message = '종료일은 시작일보다 빠를 수 없어요.';
    else if (!isValidTimePlanRange(range)) message = '프로젝트 기간 안에서 최대 28일까지 선택해 주세요.';
    if (message) {
        if (error) { error.textContent = message; error.hidden = false; }
        return;
    }
    try {
        const feature = await saveProjectPlanFeature({
            projId: getCurrentProjectId(),
            timeEnabledYn: 'Y',
            timeRangeStartDate: range.start,
            timeRangeEndDate: range.end
        });
        applyProjectPlanServerFeature(feature);
        currentTimePlanWeekIndex = 0;
        window.__moyoTimePlanInitialWeekRange = '';
        closeTimePlanRangeModal();
        syncProjectPlanFeatureUi('TIME_SCHEDULE');
        setProjectPlanGuideExpanded(true, true);
        selectProjectPlanTab('TIME_SCHEDULE');
        syncTimePlanRangeButton();
    } catch (saveError) {
        if (error) { error.textContent = saveError.message || '기간을 저장하지 못했습니다.'; error.hidden = false; }
    }
}

function renderTimeSchedule() {
    projectScheduleGridMode = 'TIME_PLAN';
    if (!window.__timeScheduleDawnPreferenceLoaded) {
        window.__timeScheduleDawnPreferenceLoaded = true;
        loadTimeScheduleDawnPreference();
    } else {
        syncTimeScheduleDawnToggle();
    }
    document.querySelectorAll('.time-schedule-card-drag-preview').forEach(function(preview) { preview.remove(); });
    const target = getScheduleGridRoot();
    if (!target) return;
    const range = ensureTimePlanRange();
    if (!range) {
        target.innerHTML = '<div class="time-schedule-empty time-schedule-empty--action"><strong>시간별로 계획할 기간을 먼저 정해 주세요.</strong><button type="button" onclick="openTimePlanRangeModal(true)">기간 지정</button></div>';
        target.setAttribute('aria-busy', 'false');
        syncTimePlanRangeButton();
        return;
    }
    currentGanttScale = 'HOUR';
    const weeks = buildTimePlanWeeks(parseProjectDate(range.start), parseProjectDate(range.end));
    if (weeks.length === 0) return;

    // 시간별 계획표 최초 진입 시 오늘이 선택 기간 안에 있으면 오늘이 포함된 주차를 먼저 연다.
    // 같은 기간 안에서 사용자가 직접 주차를 이동한 뒤 다시 렌더링될 때는 현재 주차를 유지한다.
    const rangeKey = range.start + '|' + range.end;
    if (window.__moyoTimePlanInitialWeekRange !== rangeKey) {
        const todayText = formatProjectDate(new Date());
        const todayWeekIndex = weeks.findIndex(function(week) {
            return todayText >= formatProjectDate(week.calendarStart)
                && todayText <= formatProjectDate(week.calendarEnd)
                && todayText >= range.start
                && todayText <= range.end;
        });
        currentTimePlanWeekIndex = todayWeekIndex >= 0 ? todayWeekIndex : 0;
        window.__moyoTimePlanInitialWeekRange = rangeKey;
    }

    currentTimePlanWeekIndex = Math.max(0, Math.min(weeks.length - 1, currentTimePlanWeekIndex));
    const activeWeek = weeks[currentTimePlanWeekIndex];
    renderTimeScheduleTable(projectCalendarSchedules || [], activeWeek.start, activeWeek.end, target, activeWeek.calendarStart);
    target.setAttribute('aria-busy', 'false');
    syncTimePlanRangeButton();
}




window.renderWeeklyScheduleWithTimeGrid = function(items) {
    // 주간 데이터의 비동기 재조회가 숨겨진 패널을 다시 렌더링하더라도
    // 현재 활성화된 시간별 그리드 모드를 빼앗지 않도록 렌더링 동안만 주간 모드를 사용한다.
    const weeklyRoot = document.getElementById('projectWeeklyPlanPreview');
    const weeklyPanel = weeklyRoot && weeklyRoot.closest('[data-plan-panel]');
    const weeklyIsActive = !!(weeklyPanel && !weeklyPanel.hidden);
    const previousGridMode = projectScheduleGridMode;
    projectScheduleGridMode = 'WEEKLY_PLAN';
    if (!window.__weeklyScheduleDawnPreferenceLoaded) {
        window.__weeklyScheduleDawnPreferenceLoaded = true;
        loadTimeScheduleDawnPreference();
    } else {
        syncTimeScheduleDawnToggle();
    }
    projectWeeklyScheduleGridItems = (items || []).map(function(item) {
        const id = Number(item.weeklyPlanId || item.WEEKLY_PLAN_ID || 0);
        const day = Number(item.dayOfWeek || item.DAY_OF_WEEK || 7);
        const date = gridDateFromWeeklyDay(day);
        const weeklyStartTime = String(item.startTime || item.START_TIME || '09:00').match(/\d{1,2}:\d{2}/);
        const weeklyEndTime = String(item.endTime || item.END_TIME || '10:00').match(/\d{1,2}:\d{2}/);
        const cleanStartTime = weeklyStartTime ? weeklyStartTime[0].padStart(5, '0') : '09:00';
        const cleanEndTime = weeklyEndTime ? weeklyEndTime[0].padStart(5, '0') : '10:00';
        const startMinute = Number(cleanStartTime.substring(0, 2)) * 60 + Number(cleanStartTime.substring(3, 5));
        const endMinute = Number(cleanEndTime.substring(0, 2)) * 60 + Number(cleanEndTime.substring(3, 5));
        const crossesMidnight = endMinute <= startMinute;
        return {
            TIME_PLAN_ID: id,
            timePlanId: id,
            WEEKLY_PLAN_ID: id,
            weeklyPlanId: id,
            PLAN_MODE: 'WEEKLY_PLAN',
            planMode: 'WEEKLY_PLAN',
            DAY_OF_WEEK: day,
            dayOfWeek: day,
            TITLE: item.title || item.TITLE || '',
            title: item.title || item.TITLE || '',
            DESCRIPTION: item.description || item.DESCRIPTION || '',
            description: item.description || item.DESCRIPTION || '',
            START_DATE: date,
            END_DATE: crossesMidnight ? addDateDays(date, 1) : date,
            START_TIME: cleanStartTime,
            END_TIME: cleanEndTime,
            CROSSES_MIDNIGHT: crossesMidnight,
            crossesMidnight: crossesMidnight,
            COLOR: item.color || item.COLOR || '#7c5cff',
            ACTIVE_YN: item.activeYn || item.ACTIVE_YN || 'Y',
            activeYn: item.activeYn || item.ACTIVE_YN || 'Y',
            repeatStartDate: item.repeatStartDate || item.REPEAT_START_DATE || '',
            repeatEndDate: item.repeatEndDate || item.REPEAT_END_DATE || ''
        };
    });
    currentGanttScale = 'HOUR';
    renderTimeScheduleTable([], parseProjectDate(WEEKLY_GRID_BASE_DATES[0]), parseProjectDate(WEEKLY_GRID_BASE_DATES[6]), weeklyRoot, parseProjectDate(WEEKLY_GRID_BASE_DATES[0]));
    if (weeklyRoot) weeklyRoot.setAttribute('aria-busy', 'false');

    // 숨겨진 주간 패널의 후행 렌더링이면 활성 시간별 모드를 원래대로 복구한다.
    if (!weeklyIsActive) projectScheduleGridMode = previousGridMode;
};
window.activateTimeScheduleGridMode = function(){ projectScheduleGridMode='TIME_PLAN'; };
