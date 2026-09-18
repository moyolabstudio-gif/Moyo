/** MOYO 프로젝트 계획 공통 등록·수정·상세 모달 */
let currentPeriodPlanRecordDraftKey = null;
let currentPeriodPlanRecordTargetId = null;
let currentPeriodPlanRecordSaved = false;
let currentProjectPlanRecordItems = [];
const ganttPlanEditorState = {
    members: [],
    selectedIds: new Set(),
    loadedProjId: null
};

function getCurrentPlanRecordTargetType() {
    const mode = (window.__projectPlanModalContext || {}).mode || 'PERIOD_PLAN';
    if (mode === 'TIME_PLAN') return 'TIME_PLAN';
    if (mode === 'WEEKLY_PLAN') return 'WEEKLY_PLAN';
    return 'PERIOD_PLAN';
}


function setProjectPlanRecordVisibility(value) {
    const normalized = String(value || 'PROJECT').toUpperCase() === 'MANAGER' ? 'MANAGER' : 'PROJECT';
    const input = document.getElementById('ganttPlanRecordVisibility');
    if (input) input.value = normalized;
    document.querySelectorAll('[data-plan-record-visibility]').forEach(function(button) {
        const selected = String(button.dataset.planRecordVisibility || '').toUpperCase() === normalized;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
}

function projectPlanRecordType(item) {
    const raw = String(item && (item.recordType || item.RECORD_TYPE || item.contentType || item.CONTENT_TYPE) || '').toUpperCase();
    return raw === 'PHOTO_POST' ? 'PHOTO' : raw;
}

function renderProjectPlanRecordSummary(items) {
    const wrap = document.getElementById('ganttPlanRecordSummaryCounts');
    if (!wrap) return;
    const counts = { NOTE: 0, PHOTO: 0, FILE: 0, LINK: 0, LOCATION: 0 };
    (Array.isArray(items) ? items : []).forEach(function(item) {
        const type = projectPlanRecordType(item);
        if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type] += 1;
    });
    wrap.innerHTML = [
        ['NOTE', 'fa-regular fa-note-sticky', '노트', counts.NOTE],
        ['PHOTO', 'fa-regular fa-image', '사진', counts.PHOTO],
        ['FILE', 'fa-solid fa-paperclip', '파일', counts.FILE],
        ['LINK', 'fa-solid fa-link', '링크', counts.LINK],
        ['LOCATION', 'fa-solid fa-location-dot', '장소', counts.LOCATION]
    ].map(function(value) {
        return '<button type="button" class="gantt-plan-record-summary__shortcut" data-plan-record-type="' + value[0] + '" title="' + value[2] + ' 바로 열기" aria-label="' + value[2] + ' ' + value[3] + '개, 바로 열기"><i class="' + value[1] + '" aria-hidden="true"></i><b>' + value[3] + '</b></button>';
    }).join('');
}

async function loadProjectPlanRecordSummary() {
    const detailRow = document.getElementById('ganttPlanRecordDetailRow');
    if (!detailRow || !currentGanttPlanId) return;
    try {
        const target = await requestProjectPlanRecordTarget();
        const targetId = Number(target.recordTargetId || target.RECORD_TARGET_ID);
        if (!targetId) throw new Error('기록 대상을 확인할 수 없습니다.');
        const response = await fetch(getProjectMainContextPath() + '/api/content-records/' + encodeURIComponent(targetId) + '/items', {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('기록을 불러오지 못했습니다.');
        currentProjectPlanRecordItems = await response.json();
        renderProjectPlanRecordSummary(currentProjectPlanRecordItems);
    } catch (error) {
        console.error('[프로젝트 계획] 기록 요약 조회 실패:', error);
        currentProjectPlanRecordItems = [];
        renderProjectPlanRecordSummary([]);
    }
}

function syncProjectPlanRecordSetting(item, isReadOnly) {
    const enabledInput = document.getElementById('ganttPlanRecordEnabled');
    const visibilityWrap = document.getElementById('ganttPlanRecordVisibilityWrap');
    const settingPanel = document.getElementById('ganttPlanRecordSettingPanel');
    const detailRow = document.getElementById('ganttPlanRecordDetailRow');
    const recordSection = document.getElementById('ganttPlanRecordSection');
    const enabled = !!item || String(item && (item.recordEnabledYn || item.RECORD_ENABLED_YN) || 'N').toUpperCase() === 'Y';
    if (enabledInput) enabledInput.checked = enabled;
    setProjectPlanRecordVisibility(item && (item.recordVisibility || item.RECORD_VISIBILITY) || 'PROJECT');

    if (settingPanel) settingPanel.hidden = !!isReadOnly;
    if (visibilityWrap) visibilityWrap.hidden = !!isReadOnly || !enabled;
    if (detailRow) detailRow.hidden = !(isReadOnly && enabled && Number(currentGanttPlanId) > 0);
    if (recordSection) recordSection.hidden = !!isReadOnly && !enabled;

    currentProjectPlanRecordItems = [];
    renderProjectPlanRecordSummary([]);
    if (isReadOnly && enabled && Number(currentGanttPlanId) > 0) {
        loadProjectPlanRecordSummary();
    }
}

async function requestProjectPlanRecordTarget() {
    const contextPath = getProjectMainContextPath();
    const projId = Number(getCurrentProjectId());
    const targetType = getCurrentPlanRecordTargetType();

    if (!Number.isFinite(projId) || projId <= 0) {
        throw new Error('프로젝트 정보를 찾을 수 없습니다.');
    }

    if (currentGanttPlanId) {
        const response = await fetch(contextPath + '/api/content-records/target', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                targetType: targetType,
                targetId: Number(currentGanttPlanId),
                contextType: 'PROJECT',
                contextId: projId
            })
        });
        const body = await response.json().catch(function() { return {}; });
        if (!response.ok) {
            const label = targetType === 'TIME_PLAN' ? '시간별 계획'
                : (targetType === 'WEEKLY_PLAN' ? '주간 계획' : '기간별 계획');
            throw new Error(body.message || label + ' 기록 대상을 불러오지 못했습니다.');
        }
        currentPeriodPlanRecordTargetId = Number(body.recordTargetId || body.RECORD_TARGET_ID);
        currentPeriodPlanRecordDraftKey = body.draftKey || body.DRAFT_KEY || null;
        return body;
    }

    throw new Error('계획을 먼저 저장한 뒤 기록을 추가해 주세요.');
}

async function openProjectPlanCommonRecords(recordType) {
    const context = window.__projectPlanModalContext || { mode: 'PERIOD_PLAN' };
    try {
        const target = await requestProjectPlanRecordTarget();
        const modal = window.moyoCommonContentRecordModal;
        if (!modal) throw new Error('공통 기록 모달을 불러오지 못했습니다.');

        const defaultLabel = context.mode === 'TIME_PLAN' ? '시간별 계획'
            : (context.mode === 'WEEKLY_PLAN' ? '주간 계획' : '기간별 계획');
        const title = document.getElementById('ganttPlanTitle')?.value?.trim() || defaultLabel;

        modal.open({
            recordTargetId: Number(target.recordTargetId || target.RECORD_TARGET_ID),
            draftKey: target.draftKey || target.DRAFT_KEY || null,
            targetLabel: title,
            activeType: String(recordType || 'NOTE').toUpperCase()
        });
    } catch (error) {
        alert(error.message || '기록을 열지 못했습니다.');
    }
}

function closeGanttPlanCreateModal() {
            const overlay = document.getElementById('ganttPlanCreateModal');
            if (!overlay) return;

            const closingContext = window.__projectPlanModalContext || {};
            const closingMode = closingContext.mode || (overlay.dataset.planMode === 'TIME' ? 'TIME_PLAN' : 'PERIOD_PLAN');
            currentPeriodPlanRecordDraftKey = null;
            currentPeriodPlanRecordTargetId = null;
            currentPeriodPlanRecordSaved = false;

            closeGanttPlanDatePicker();
            closeGanttPlanTimePicker();
            overlay.hidden = true;
            overlay.dataset.planMode = '';
            currentGanttPlanId = null;
            window.__projectPlanModalContext = null;
            document.body.classList.remove('gantt-plan-modal-open');

            // 시간별·주간 시간표 드래그로 연 공통 모달이 닫히면
            // 현재 그리드의 확정 선택 표시와 임시 선택값을 함께 해제한다.
            if (closingMode === 'TIME_PLAN' || closingMode === 'WEEKLY_PLAN') {
                document.dispatchEvent(new CustomEvent('project-time-plan-modal-closed', {
                    detail: { mode: closingMode }
                }));
            }
        }

        function selectGanttPlanColor(color, manualSelection) {
            const normalized = normalizeScheduleColor(color);
            const colorInput = document.getElementById('ganttPlanColor');
            const customInput = document.getElementById('ganttPlanCustomColor');
            if (colorInput) colorInput.value = normalized;
            if (customInput) customInput.value = normalized;

            document.querySelectorAll('#ganttPlanColorOptions .gantt-plan-modal__color-chip').forEach(function(chip) {
                const chipColor = chip.dataset.color ? normalizeScheduleColor(chip.dataset.color) : '';
                chip.classList.toggle('is-active', !!chipColor && chipColor === normalized);
            });

            const dualCalendar = document.getElementById('ganttPlanDualCalendar');
            if (dualCalendar) {
                dualCalendar.style.setProperty('--gantt-plan-range-color', normalized);
            }
            if (ganttPlanSingleDatePickerState && ganttPlanSingleDatePickerState.menu && !ganttPlanSingleDatePickerState.menu.hidden) {
                ganttPlanSingleDatePickerState.menu.style.setProperty('--gantt-plan-picker-color', normalized);
                renderGanttPlanSingleDatePicker();
            }
        }

        function getPlanItemsByMode(mode) {
            if (mode === 'TIME_PLAN') {
                const source = (typeof projectTimeScheduleItems !== 'undefined' && Array.isArray(projectTimeScheduleItems))
                    ? projectTimeScheduleItems
                    : (Array.isArray(window.projectTimeScheduleItems) ? window.projectTimeScheduleItems : []);
                const seen = new Set();
                return source.filter(function(item) {
                    if (!item || item.TASK_ID || item.taskId) return false;
                    const id = item.TIME_PLAN_ID || item.timePlanId;
                    // 자동 색상 순번은 DB에 저장된 시간별 계획만 계산한다.
                    // 드래그 미리보기·임시 행·ID 없는 렌더링 데이터는 개수에서 제외한다.
                    if (id == null || id === '') return false;
                    const key = String(id);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            }
            if (mode === 'WEEKLY_PLAN') {
                if (typeof projectWeeklyPlanItems !== 'undefined' && Array.isArray(projectWeeklyPlanItems)) return projectWeeklyPlanItems;
                if (Array.isArray(window.projectWeeklyPlanItems)) return window.projectWeeklyPlanItems;
                return [];
            }
            return Array.isArray(projectGanttItems)
                ? projectGanttItems.filter(function(item) { return item && item.type === 'PERIOD_PLAN'; })
                : [];
        }

        function getNextPlanColorByMode(mode) {
            const palette = Array.isArray(scheduleColorPalette) && scheduleColorPalette.length ? scheduleColorPalette : ['#4A90E2'];
            const items = getPlanItemsByMode(mode);

            // 시간별 계획은 저장 건수만 단순히 더하지 않고, 현재 실제로 사용 중인 색상을 기준으로
            // 팔레트의 첫 미사용 색상을 선택한다. 중복 저장 데이터가 있어도 두 번째 계획은 두 번째 색상을 받는다.
            if (mode === 'TIME_PLAN') {
                const usedColors = new Set(items.map(function(item) {
                    return normalizeScheduleColor(item.COLOR || item.color || '');
                }).filter(Boolean));
                const unused = palette.map(normalizeScheduleColor).find(function(color) {
                    return !usedColors.has(color);
                });
                if (unused) return unused;
            }

            return normalizeScheduleColor(palette[items.length % palette.length]);
        }

        function addTimePlanDays(dateText, days) {
            const date = parseProjectDate(dateText);
            if (!date) return dateText;
            date.setDate(date.getDate() + days);
            return formatProjectDate(date);
        }

        function normalizeTimePlanEndBoundary(startDate, endDate, endTime) {
            const normalizedEndDate = endDate || startDate;
            const normalizedEndTime = String(endTime || '').trim();
            if (normalizedEndTime === '24:00') {
                return { endDate: addTimePlanDays(normalizedEndDate, 1), endTime: '00:00' };
            }
            return { endDate: normalizedEndDate, endTime: normalizedEndTime };
        }

        function hasTimePlanOverlapInLoadedItems(startDate, startTime, endDate, endTime, excludeId) {
            const normalizedBoundary = normalizeTimePlanEndBoundary(startDate, endDate, endTime);
            const newStart = new Date(startDate + 'T' + startTime + ':00');
            const newEnd = new Date(normalizedBoundary.endDate + 'T' + normalizedBoundary.endTime + ':00');
            if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) return false;

            return getPlanItemsByMode('TIME_PLAN').some(function(item) {
                const itemId = Number(item.TIME_PLAN_ID || item.timePlanId || 0);
                if (excludeId && itemId === Number(excludeId)) return false;
                const itemStartDate = String(item.START_DATE || item.startDate || '').substring(0, 10);
                const itemEndDate = String(item.END_DATE || item.endDate || itemStartDate).substring(0, 10);
                const itemStartTime = String(item.START_TIME || item.startTime || '00:00').substring(0, 5);
                const itemEndTime = String(item.END_TIME || item.endTime || '23:59').substring(0, 5);
                const itemBoundary = normalizeTimePlanEndBoundary(itemStartDate, itemEndDate, itemEndTime);
                const itemStart = new Date(itemStartDate + 'T' + itemStartTime + ':00');
                const itemEnd = new Date(itemBoundary.endDate + 'T' + itemBoundary.endTime + ':00');
                if (Number.isNaN(itemStart.getTime()) || Number.isNaN(itemEnd.getTime())) return false;
                return newStart < itemEnd && newEnd > itemStart;
            });
        }

        function getGanttPlanModalPaletteState(selectedColor) {
            const source = (typeof defaultScheduleColorPalette !== 'undefined' && Array.isArray(defaultScheduleColorPalette) && defaultScheduleColorPalette.length)
                ? defaultScheduleColorPalette.slice(0, 12)
                : ['#4A90E2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B', '#06B6D4', '#6366F1', '#84CC16', '#F97316'];
            const base = [];
            source.forEach(function(color) {
                const normalized = normalizeScheduleColor(color);
                if (normalized && !base.includes(normalized)) base.push(normalized);
            });

            const selected = normalizeScheduleColor(selectedColor);
            return {
                base: base,
                custom: selected && !base.includes(selected) ? selected : ''
            };
        }

        function renderGanttPlanColorOptions(selectedColor) {
            const container = document.getElementById('ganttPlanColorOptions');
            if (!container) return;

            const paletteState = getGanttPlanModalPaletteState(selectedColor);
            container.innerHTML = '';

            paletteState.base.forEach(function(color) {
                const normalized = normalizeScheduleColor(color);
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'gantt-plan-modal__color-chip';
                button.title = normalized;
                button.setAttribute('aria-label', normalized + ' 색상 선택');
                button.dataset.color = normalized;
                button.style.background = normalized;
                button.addEventListener('click', function() {
                    selectGanttPlanColor(normalized, true);
                });
                container.appendChild(button);
            });

            const customSlot = document.createElement('button');
            customSlot.type = 'button';
            customSlot.className = 'gantt-plan-modal__color-chip gantt-plan-modal__color-chip--custom-slot';
            customSlot.dataset.customSlot = 'true';
            if (paletteState.custom) {
                customSlot.classList.add('is-custom');
                customSlot.dataset.color = paletteState.custom;
                customSlot.style.background = paletteState.custom;
                customSlot.title = '사용자 지정 색상 ' + paletteState.custom;
                customSlot.setAttribute('aria-label', '사용자 지정 색상 ' + paletteState.custom + ' 선택');
                customSlot.addEventListener('click', function() {
                    selectGanttPlanColor(paletteState.custom, true);
                });
            } else {
                customSlot.classList.add('is-empty');
                customSlot.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
                customSlot.title = '사용자 지정 색상 추가';
                customSlot.setAttribute('aria-label', '사용자 지정 색상 추가');
                customSlot.addEventListener('click', function() {
                    document.getElementById('ganttPlanCustomColor')?.click();
                });
            }
            container.appendChild(customSlot);

            selectGanttPlanColor(selectedColor);
        }


        const ganttPlanDatePickerState = {
            overlay: null,
            year: 0,
            month: 0,
            startDate: '',
            endDate: '',
            selectingEnd: false
        };

        const ganttPlanDualCalendarState = {
            startYear: 0,
            startMonth: 0,
            endYear: 0,
            endMonth: 0
        };

        function normalizeGanttPlanDateText(value) {
            const source = String(value || '').trim();
            const match = source.match(/(\d{4})\D?(\d{1,2})\D?(\d{1,2})/);
            if (!match) return '';
            return match[1] + '-' + String(Number(match[2])).padStart(2, '0') + '-' + String(Number(match[3])).padStart(2, '0');
        }

        function parseGanttPlanDateValue(value) {
            const normalized = normalizeGanttPlanDateText(value);
            const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            const date = new Date(year, month - 1, day);
            if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
            return date;
        }

        function formatGanttPlanDateValue(date) {
            if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
            return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
        }

        function closeGanttPlanDatePicker() {
            if (ganttPlanDatePickerState.overlay) ganttPlanDatePickerState.overlay.hidden = true;
        }

        function getGanttPlanRangeInputs() {
            return {
                start: document.getElementById('ganttPlanStartDate'),
                end: document.getElementById('ganttPlanEndDate')
            };
        }

        function renderGanttPlanDatePicker() {
            const state = ganttPlanDatePickerState;
            if (!state.overlay) return;
            const calendar = state.overlay.querySelector('[data-gantt-range-calendar]');
            if (!calendar) return;

            const todayValue = formatGanttPlanDateValue(new Date());
            const first = new Date(state.year, state.month, 1);
            const gridStart = new Date(state.year, state.month, 1 - first.getDay());
            const days = [];

            for (let index = 0; index < 42; index += 1) {
                const current = new Date(gridStart);
                current.setDate(gridStart.getDate() + index);
                const value = formatGanttPlanDateValue(current);
                const classes = ['gantt-plan-range-picker__day'];
                if (current.getMonth() !== state.month) classes.push('is-muted');
                if (value === todayValue) classes.push('is-today');
                if (state.startDate && value === state.startDate) classes.push('is-selected', 'is-start');
                if (state.endDate && value === state.endDate) classes.push('is-selected', 'is-end');
                if (state.startDate && state.endDate && value > state.startDate && value < state.endDate) classes.push('is-in-range');
                days.push('<button type="button" class="' + classes.join(' ') + '" data-gantt-range-date="' + value + '">' + current.getDate() + '</button>');
            }

            calendar.innerHTML = '<div class="gantt-plan-range-picker__calendar-head">'
                + '<button type="button" data-gantt-range-nav="-1" aria-label="이전 달"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>'
                + '<strong>' + state.year + '년 ' + (state.month + 1) + '월</strong>'
                + '<button type="button" data-gantt-range-nav="1" aria-label="다음 달"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>'
                + '</div>'
                + '<div class="gantt-plan-range-picker__weekdays"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'
                + '<div class="gantt-plan-range-picker__days">' + days.join('') + '</div>';

            const startText = state.overlay.querySelector('[data-gantt-range-start]');
            const endText = state.overlay.querySelector('[data-gantt-range-end]');
            const hint = state.overlay.querySelector('[data-gantt-range-hint]');
            const apply = state.overlay.querySelector('[data-gantt-range-apply]');
            if (startText) startText.textContent = state.startDate || '시작일 선택';
            if (endText) endText.textContent = state.endDate || '종료일 선택';
            if (hint) hint.textContent = state.selectingEnd && state.startDate && !state.endDate ? '종료일을 선택하세요.' : '시작일과 종료일을 선택하세요.';
            if (apply) apply.disabled = !(state.startDate && state.endDate);
        }

        function ensureGanttPlanDatePicker() {
            if (ganttPlanDatePickerState.overlay) return ganttPlanDatePickerState.overlay;
            const panel = document.getElementById('ganttPlanRangePicker');
            if (!panel) return null;
            panel.innerHTML = '<section class="gantt-plan-range-picker__dialog gantt-plan-range-picker__dialog--inline" aria-label="계획 기간 선택">'
                + '<header class="gantt-plan-range-picker__header gantt-plan-range-picker__header--inline"><div><strong>기간 선택</strong><span data-gantt-range-hint>시작일과 종료일을 선택하세요.</span></div><button type="button" data-gantt-range-close aria-label="기간 선택 닫기"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button></header>'
                + '<div class="gantt-plan-range-picker__summary"><div><span>시작</span><strong data-gantt-range-start>시작일 선택</strong></div><i class="fa-solid fa-arrow-right" aria-hidden="true"></i><div><span>종료</span><strong data-gantt-range-end>종료일 선택</strong></div></div>'
                + '<div class="gantt-plan-range-picker__calendar" data-gantt-range-calendar></div>'
                + '<footer class="gantt-plan-range-picker__footer"><button type="button" class="gantt-plan-range-picker__today" data-gantt-range-today>오늘</button><button type="button" class="gantt-plan-range-picker__apply" data-gantt-range-apply>적용</button></footer>'
                + '</section>';

            panel.addEventListener('click', function(event) {
                if (event.target.closest('[data-gantt-range-close]')) {
                    closeGanttPlanDatePicker();
                    return;
                }
                const nav = event.target.closest('[data-gantt-range-nav]');
                if (nav) {
                    ganttPlanDatePickerState.month += Number(nav.dataset.ganttRangeNav || 0);
                    if (ganttPlanDatePickerState.month < 0) { ganttPlanDatePickerState.month = 11; ganttPlanDatePickerState.year -= 1; }
                    if (ganttPlanDatePickerState.month > 11) { ganttPlanDatePickerState.month = 0; ganttPlanDatePickerState.year += 1; }
                    renderGanttPlanDatePicker();
                    return;
                }
                if (event.target.closest('[data-gantt-range-today]')) {
                    const today = formatGanttPlanDateValue(new Date());
                    ganttPlanDatePickerState.startDate = today;
                    ganttPlanDatePickerState.endDate = today;
                    ganttPlanDatePickerState.selectingEnd = false;
                    const parsed = parseGanttPlanDateValue(today);
                    ganttPlanDatePickerState.year = parsed.getFullYear();
                    ganttPlanDatePickerState.month = parsed.getMonth();
                    renderGanttPlanDatePicker();
                    return;
                }
                const day = event.target.closest('[data-gantt-range-date]');
                if (day) {
                    const value = day.dataset.ganttRangeDate || '';
                    const state = ganttPlanDatePickerState;
                    if (!state.startDate || (state.startDate && state.endDate) || !state.selectingEnd) {
                        state.startDate = value;
                        state.endDate = '';
                        state.selectingEnd = true;
                    } else if (value < state.startDate) {
                        state.startDate = value;
                        state.endDate = '';
                        state.selectingEnd = true;
                    } else {
                        state.endDate = value;
                        state.selectingEnd = false;
                    }
                    renderGanttPlanDatePicker();
                    return;
                }
                if (event.target.closest('[data-gantt-range-apply]')) {
                    const state = ganttPlanDatePickerState;
                    if (!state.startDate || !state.endDate) return;
                    const inputs = getGanttPlanRangeInputs();
                    if (inputs.start) {
                        inputs.start.value = state.startDate;
                        inputs.start.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    if (inputs.end) {
                        inputs.end.value = state.endDate;
                        inputs.end.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    closeGanttPlanDatePicker();
                }
            });

            ganttPlanDatePickerState.overlay = panel;
            return panel;
        }


        function getGanttTimePlanAllowedBounds() {
            let rangeStart = '';
            let rangeEnd = '';
            try {
                if (typeof projectPlanServerFeatures !== 'undefined' && projectPlanServerFeatures) {
                    rangeStart = normalizeGanttPlanDateText(projectPlanServerFeatures.timeRangeStart || '');
                    rangeEnd = normalizeGanttPlanDateText(projectPlanServerFeatures.timeRangeEnd || '');
                }
            } catch (e) {}
            const cfg = window.PROJECT_MAIN_CONFIG || {};
            const projectStart = normalizeGanttPlanDateText(cfg.projectStartDate || '');
            const projectEnd = normalizeGanttPlanDateText(cfg.projectEndDate || '');
            return {
                start: rangeStart || projectStart,
                end: rangeEnd || projectEnd
            };
        }

        function isGanttTimePlanDateAllowed(value) {
            const bounds = getGanttTimePlanAllowedBounds();
            if (!value) return false;
            return (!bounds.start || value >= bounds.start) && (!bounds.end || value <= bounds.end);
        }

        let ganttPlanSingleDatePickerState = { menu: null, input: null, year: 0, month: 0 };

        function closeGanttPlanSingleDatePicker() {
            const state = ganttPlanSingleDatePickerState;
            if (state.menu) state.menu.hidden = true;
            state.input = null;
        }

        function positionGanttPlanSingleDatePicker() {
            const state = ganttPlanSingleDatePickerState;
            if (!state.menu || !state.input || state.menu.hidden) return;
            const field = state.input.closest('.gantt-plan-modal__date-field') || state.input;
            const rect = field.getBoundingClientRect();
            const width = Math.min(248, Math.max(220, rect.width));
            const gap = 6;
            let left = rect.left;
            let top = rect.bottom + gap;
            const menuHeight = 292;
            if (left + width > window.innerWidth - 10) left = Math.max(10, window.innerWidth - width - 10);
            if (top + menuHeight > window.innerHeight - 10) top = Math.max(10, rect.top - menuHeight - gap);
            state.menu.style.width = width + 'px';
            state.menu.style.left = Math.round(left) + 'px';
            state.menu.style.top = Math.round(top) + 'px';
        }

        function renderGanttPlanSingleDatePicker() {
            const state = ganttPlanSingleDatePickerState;
            if (!state.menu || !state.input) return;
            const selected = normalizeGanttPlanDateText(state.input.value || '');
            const rangeInputs = getGanttPlanRangeInputs();
            const rangeStart = normalizeGanttPlanDateText(rangeInputs.start && rangeInputs.start.value);
            const rangeEnd = normalizeGanttPlanDateText(rangeInputs.end && rangeInputs.end.value);
            const isStartPicker = state.input.id === 'ganttPlanStartDate';
            const isEndPicker = state.input.id === 'ganttPlanEndDate';
            const planColor = normalizeScheduleColor(document.getElementById('ganttPlanColor')?.value || '#4A90E2');
            state.menu.style.setProperty('--gantt-plan-picker-color', planColor);
            const today = formatGanttPlanDateValue(new Date());
            const first = new Date(state.year, state.month, 1);
            const gridStart = new Date(state.year, state.month, 1 - first.getDay());
            const days = [];
            for (let index = 0; index < 42; index += 1) {
                const current = new Date(gridStart);
                current.setDate(gridStart.getDate() + index);
                const value = formatGanttPlanDateValue(current);
                const classes = ['gantt-plan-single-date-picker__day'];
                if (current.getMonth() !== state.month) classes.push('is-muted');
                if (value === today) classes.push('is-today');

                // 시간별 계획도 기간별 계획과 동일하게 시작~종료 전체 범위를 연하게 표시한다.
                // 단, 현재 열어둔 필드(시작/종료)의 값만 진하게 강조한다.
                const hasValidRange = !!rangeStart && !!rangeEnd && rangeStart <= rangeEnd;
                if (hasValidRange && value >= rangeStart && value <= rangeEnd) {
                    const isOwnBoundary =
                        (isStartPicker && value === rangeStart) ||
                        (isEndPicker && value === rangeEnd);
                    if (isOwnBoundary) classes.push('is-selected');
                    else classes.push('is-range');
                } else if (value === selected) {
                    classes.push('is-selected');
                }

                const disabled = !isGanttTimePlanDateAllowed(value);
                if (disabled) classes.push('is-disabled');
                days.push('<button type="button" class="' + classes.join(' ') + '" data-gantt-single-date="' + value + '"' + (disabled ? ' disabled aria-disabled="true"' : '') + '>' + current.getDate() + '</button>');
            }
            const bounds = getGanttTimePlanAllowedBounds();
            const currentMonthIndex = state.year * 12 + state.month;
            const minDate = parseGanttPlanDateValue(bounds.start);
            const maxDate = parseGanttPlanDateValue(bounds.end);
            const minMonthIndex = minDate ? minDate.getFullYear() * 12 + minDate.getMonth() : null;
            const maxMonthIndex = maxDate ? maxDate.getFullYear() * 12 + maxDate.getMonth() : null;
            const prevDisabled = minMonthIndex !== null && currentMonthIndex <= minMonthIndex;
            const nextDisabled = maxMonthIndex !== null && currentMonthIndex >= maxMonthIndex;
            const todayDisabled = !isGanttTimePlanDateAllowed(today);
            state.menu.innerHTML = '<div class="gantt-plan-single-date-picker__head">'
                + '<strong>' + state.year + '년 ' + (state.month + 1) + '월</strong>'
                + '<div><button type="button" data-gantt-single-nav="-1" aria-label="이전 달"' + (prevDisabled ? ' disabled' : '') + '>‹</button><button type="button" data-gantt-single-nav="1" aria-label="다음 달"' + (nextDisabled ? ' disabled' : '') + '>›</button></div>'
                + '</div>'
                + '<div class="gantt-plan-single-date-picker__weekdays"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'
                + '<div class="gantt-plan-single-date-picker__days">' + days.join('') + '</div>'
                + '<div class="gantt-plan-single-date-picker__foot"><button type="button" data-gantt-single-today' + (todayDisabled ? ' disabled' : '') + '>오늘</button></div>';
            positionGanttPlanSingleDatePicker();
        }

        function ensureGanttPlanSingleDatePicker() {
            if (ganttPlanSingleDatePickerState.menu) return ganttPlanSingleDatePickerState.menu;
            const menu = document.createElement('div');
            menu.className = 'gantt-plan-single-date-picker';
            menu.hidden = true;
            document.body.appendChild(menu);
            menu.addEventListener('click', function(event) {
                const nav = event.target.closest('[data-gantt-single-nav]');
                if (nav) {
                    ganttPlanSingleDatePickerState.month += Number(nav.dataset.ganttSingleNav || 0);
                    if (ganttPlanSingleDatePickerState.month < 0) { ganttPlanSingleDatePickerState.month = 11; ganttPlanSingleDatePickerState.year -= 1; }
                    if (ganttPlanSingleDatePickerState.month > 11) { ganttPlanSingleDatePickerState.month = 0; ganttPlanSingleDatePickerState.year += 1; }
                    renderGanttPlanSingleDatePicker();
                    return;
                }
                const todayButton = event.target.closest('[data-gantt-single-today]');
                if (todayButton && !todayButton.disabled) {
                    const now = new Date();
                    ganttPlanSingleDatePickerState.year = now.getFullYear();
                    ganttPlanSingleDatePickerState.month = now.getMonth();
                    const input = ganttPlanSingleDatePickerState.input;
                    if (input) {
                        input.value = formatGanttPlanDateValue(now);
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    closeGanttPlanSingleDatePicker();
                    return;
                }
                const day = event.target.closest('[data-gantt-single-date]');
                if (day && !day.disabled && ganttPlanSingleDatePickerState.input) {
                    ganttPlanSingleDatePickerState.input.value = day.dataset.ganttSingleDate || '';
                    ganttPlanSingleDatePickerState.input.dispatchEvent(new Event('change', { bubbles: true }));
                    closeGanttPlanSingleDatePicker();
                }
            });
            ganttPlanSingleDatePickerState.menu = menu;
            return menu;
        }

        function openGanttPlanSingleDatePicker(input) {
            if (!input || input.readOnly || input.disabled) return;
            closeGanttPlanTimePicker();
            closeGanttPlanDatePicker();
            const bounds = getGanttTimePlanAllowedBounds();
            let anchor = parseGanttPlanDateValue(input.value) || new Date();
            const anchorValue = formatGanttPlanDateValue(anchor);
            if (bounds.start && anchorValue < bounds.start) anchor = parseGanttPlanDateValue(bounds.start) || anchor;
            if (bounds.end && formatGanttPlanDateValue(anchor) > bounds.end) anchor = parseGanttPlanDateValue(bounds.end) || anchor;
            const menu = ensureGanttPlanSingleDatePicker();
            ganttPlanSingleDatePickerState.input = input;
            ganttPlanSingleDatePickerState.year = anchor.getFullYear();
            ganttPlanSingleDatePickerState.month = anchor.getMonth();
            menu.hidden = false;
            renderGanttPlanSingleDatePicker();
        }

        function openGanttPlanDatePicker(input) {
            if (!input || input.readOnly || input.disabled) return;
            const modalContext = window.__projectPlanModalContext || {};
            if (modalContext.mode === 'TIME_PLAN') {
                openGanttPlanSingleDatePicker(input);
                return;
            }
            closeGanttPlanTimePicker();
            closeGanttPlanSingleDatePicker();
            const inputs = getGanttPlanRangeInputs();
            const startValue = normalizeGanttPlanDateText(inputs.start && inputs.start.value);
            const endValue = normalizeGanttPlanDateText(inputs.end && inputs.end.value);
            const anchor = parseGanttPlanDateValue(input.value) || parseGanttPlanDateValue(startValue) || new Date();
            const overlay = ensureGanttPlanDatePicker();
            if (!overlay) return;
            ganttPlanDatePickerState.startDate = startValue;
            ganttPlanDatePickerState.endDate = endValue;
            ganttPlanDatePickerState.selectingEnd = !endValue;
            ganttPlanDatePickerState.year = anchor.getFullYear();
            ganttPlanDatePickerState.month = anchor.getMonth();
            overlay.hidden = false;
            renderGanttPlanDatePicker();
        }

        document.addEventListener('click', function(event) {
            const trigger = event.target.closest('[data-gantt-date-target]');
            const input = event.target.closest('[data-gantt-date-picker]');
            if (trigger) {
                const field = trigger.closest('.gantt-plan-modal__date-field');
                const targetInput = field
                    ? field.querySelector('[data-gantt-date-picker]')
                    : document.getElementById(trigger.dataset.ganttDateTarget);
                openGanttPlanDatePicker(targetInput);
                return;
            }
            if (input) openGanttPlanDatePicker(input);
        });

        document.addEventListener('click', function(event) {
            const state = ganttPlanSingleDatePickerState;
            if (!state.menu || state.menu.hidden) return;
            if (event.target.closest('.gantt-plan-single-date-picker')) return;
            if (event.target.closest('[data-gantt-date-target], [data-gantt-date-picker]')) return;
            closeGanttPlanSingleDatePicker();
        });
        window.addEventListener('resize', positionGanttPlanSingleDatePicker);
        window.addEventListener('scroll', positionGanttPlanSingleDatePicker, true);


        function shiftGanttPlanMonth(year, month, delta) {
            const next = new Date(year, month + delta, 1);
            return { year: next.getFullYear(), month: next.getMonth() };
        }

        function renderGanttPlanDualCalendarMonth(kind, year, month, selectedValue, startValue, endValue) {
            const first = new Date(year, month, 1);
            const gridStart = new Date(year, month, 1 - first.getDay());
            const today = formatGanttPlanDateValue(new Date());
            const days = [];
            for (let index = 0; index < 42; index += 1) {
                const current = new Date(gridStart);
                current.setDate(gridStart.getDate() + index);
                const value = formatGanttPlanDateValue(current);
                const classes = ['gantt-plan-dual-calendar__day'];
                if (current.getMonth() !== month) classes.push('is-muted');
                if (value === today) classes.push('is-today');
                if (value === selectedValue) classes.push('is-selected');
                if (startValue && endValue) {
                    if (value > startValue && value < endValue) classes.push('is-in-range');
                    if (startValue !== endValue && kind === 'start' && value === endValue) classes.push('is-in-range');
                    if (startValue !== endValue && kind === 'end' && value === startValue) classes.push('is-in-range');
                }
                days.push('<button type="button" class="' + classes.join(' ') + '" data-plan-dual-date="' + value + '" data-plan-dual-kind="' + kind + '">' + current.getDate() + '</button>');
            }
            return '<section class="gantt-plan-dual-calendar__panel" data-plan-dual-panel="' + kind + '">'
                + '<div class="gantt-plan-dual-calendar__label"><span>' + (kind === 'start' ? '시작일' : '종료일') + '</span><strong>' + (selectedValue || '날짜 선택') + '</strong></div>'
                + '<div class="gantt-plan-dual-calendar__head">'
                + '<button type="button" data-plan-dual-nav="-1" data-plan-dual-kind="' + kind + '" aria-label="이전 달"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>'
                + '<strong>' + year + '년 ' + (month + 1) + '월</strong>'
                + '<button type="button" data-plan-dual-nav="1" data-plan-dual-kind="' + kind + '" aria-label="다음 달"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>'
                + '</div>'
                + '<div class="gantt-plan-dual-calendar__weekdays"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'
                + '<div class="gantt-plan-dual-calendar__days">' + days.join('') + '</div>'
                + '</section>';
        }

        function renderGanttPlanDualCalendar() {
            const wrap = document.getElementById('ganttPlanDualCalendar');
            const inputs = getGanttPlanRangeInputs();
            if (!wrap || !inputs.start || !inputs.end) return;
            const startValue = normalizeGanttPlanDateText(inputs.start.value);
            const endValue = normalizeGanttPlanDateText(inputs.end.value);
            wrap.innerHTML = renderGanttPlanDualCalendarMonth('start', ganttPlanDualCalendarState.startYear, ganttPlanDualCalendarState.startMonth, startValue, startValue, endValue)
                + renderGanttPlanDualCalendarMonth('end', ganttPlanDualCalendarState.endYear, ganttPlanDualCalendarState.endMonth, endValue, startValue, endValue);
        }

        function syncGanttPlanDualCalendarMonths() {
            const inputs = getGanttPlanRangeInputs();
            const startDate = parseGanttPlanDateValue(inputs.start && inputs.start.value) || new Date();
            const endDate = parseGanttPlanDateValue(inputs.end && inputs.end.value);
            ganttPlanDualCalendarState.startYear = startDate.getFullYear();
            ganttPlanDualCalendarState.startMonth = startDate.getMonth();
            if (endDate) {
                ganttPlanDualCalendarState.endYear = endDate.getFullYear();
                ganttPlanDualCalendarState.endMonth = endDate.getMonth();
            } else {
                const next = shiftGanttPlanMonth(startDate.getFullYear(), startDate.getMonth(), 1);
                ganttPlanDualCalendarState.endYear = next.year;
                ganttPlanDualCalendarState.endMonth = next.month;
            }
            renderGanttPlanDualCalendar();
        }

        function bindGanttPlanDualCalendar() {
            const wrap = document.getElementById('ganttPlanDualCalendar');
            if (!wrap || wrap.dataset.bound === 'true') return;
            wrap.dataset.bound = 'true';
            wrap.addEventListener('click', function(event) {
                const nav = event.target.closest('[data-plan-dual-nav]');
                if (nav) {
                    const kind = nav.dataset.planDualKind;
                    const delta = Number(nav.dataset.planDualNav || 0);
                    const yearKey = kind === 'start' ? 'startYear' : 'endYear';
                    const monthKey = kind === 'start' ? 'startMonth' : 'endMonth';
                    const next = shiftGanttPlanMonth(ganttPlanDualCalendarState[yearKey], ganttPlanDualCalendarState[monthKey], delta);
                    ganttPlanDualCalendarState[yearKey] = next.year;
                    ganttPlanDualCalendarState[monthKey] = next.month;
                    renderGanttPlanDualCalendar();
                    return;
                }
                const day = event.target.closest('[data-plan-dual-date]');
                if (!day) return;
                const kind = day.dataset.planDualKind;
                const value = day.dataset.planDualDate || '';
                const inputs = getGanttPlanRangeInputs();
                if (!inputs.start || !inputs.end || !value) return;
                if (kind === 'start') {
                    inputs.start.value = value;
                    if (!normalizeGanttPlanDateText(inputs.end.value) || value > normalizeGanttPlanDateText(inputs.end.value)) inputs.end.value = value;
                } else {
                    inputs.end.value = value;
                    if (!normalizeGanttPlanDateText(inputs.start.value) || value < normalizeGanttPlanDateText(inputs.start.value)) inputs.start.value = value;
                }
                inputs.start.dispatchEvent(new Event('change', { bubbles: true }));
                inputs.end.dispatchEvent(new Event('change', { bubbles: true }));
                renderGanttPlanDualCalendar();
            });
        }


        const ganttPlanTimePickerState = {
            input: null,
            menu: null,
            meridiem: 'AM',
            hour12: 9,
            minute: 0
        };

        function padGanttPlanTime(value) {
            return String(value).padStart(2, '0');
        }

        function parseGanttPlanTime(value, fallback) {
            const source = String(value || fallback || '').trim();
            const match = source.match(/^(\d{1,2}):(\d{2})$/);
            if (!match) return null;
            const hour = Number(match[1]);
            const minute = Number(match[2]);
            if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) return null;
            return { hour: hour, minute: minute };
        }

        function canonicalGanttPlanTime(hour, minute) {
            return padGanttPlanTime(hour) + ':' + padGanttPlanTime(minute);
        }

        function updateGanttPlanTimeMeridiem(input) {
            if (!input) return;
            const parsed = parseGanttPlanTime(input.value, input.id === 'ganttPlanEndTime' ? '10:00' : '09:00');
            const chip = document.querySelector('[data-gantt-time-meridiem-for="' + input.id + '"]');
            if (!parsed || !chip) return;
            const isPm = parsed.hour >= 12;
            chip.textContent = isPm ? '오후' : '오전';
            chip.classList.toggle('is-am', !isPm);
            chip.classList.toggle('is-pm', isPm);
        }

        function setGanttPlanTimeValue(input, value, fallback) {
            if (!input) return;
            const parsed = parseGanttPlanTime(value, fallback) || parseGanttPlanTime(fallback, '09:00');
            input.value = canonicalGanttPlanTime(parsed.hour, parsed.minute);
            input.dataset.timeValue = input.value;
            updateGanttPlanTimeMeridiem(input);
        }

        function normalizeGanttPlanTimeInput(input) {
            if (!input) return;
            const fallback = input.id === 'ganttPlanEndTime' ? '10:00' : '09:00';
            const raw = String(input.value || '').replace(/[^0-9]/g, '').slice(0, 4);
            let value = input.value;
            if (raw.length >= 3) value = raw.slice(0, raw.length - 2) + ':' + raw.slice(-2);
            const parsed = parseGanttPlanTime(value, input.dataset.timeValue || fallback);
            setGanttPlanTimeValue(input, parsed ? canonicalGanttPlanTime(parsed.hour, parsed.minute) : (input.dataset.timeValue || fallback), fallback);
        }

        function closeGanttPlanTimePicker() {
            if (ganttPlanTimePickerState.menu) ganttPlanTimePickerState.menu.hidden = true;
            ganttPlanTimePickerState.input = null;
        }

        function positionGanttPlanTimePicker() {
            const input = ganttPlanTimePickerState.input;
            const menu = ganttPlanTimePickerState.menu;
            if (!input || !menu || menu.hidden) return;
            const field = input.closest('.gantt-plan-modal__time-field') || input;
            const rect = field.getBoundingClientRect();
            const width = 268;
            const height = 276;
            const left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
            const below = rect.bottom + 5;
            const top = below + height > window.innerHeight - 10 ? Math.max(10, rect.top - height - 5) : below;
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
        }

        function renderGanttPlanTimePicker() {
            const state = ganttPlanTimePickerState;
            const menu = ensureGanttPlanTimePicker();
            const hours = Array.from({ length: 12 }, function(_, index) {
                const hour = index + 1;
                return '<button type="button" data-gantt-time-hour="' + hour + '" class="' + (state.hour12 === hour ? 'is-selected' : '') + '">' + padGanttPlanTime(hour) + '</button>';
            }).join('');
            const minutes = Array.from({ length: 12 }, function(_, index) { return index * 5; }).map(function(minute) {
                return '<button type="button" data-gantt-time-minute="' + minute + '" class="' + (state.minute === minute ? 'is-selected' : '') + '">' + padGanttPlanTime(minute) + '</button>';
            }).join('');
            menu.innerHTML = '<div class="gantt-plan-time-picker__head"><strong>시간 선택</strong><button type="button" data-gantt-time-action="now">현재 시간</button></div>'
                + '<div class="gantt-plan-time-picker__ampm"><button type="button" data-gantt-time-meridiem="AM" class="' + (state.meridiem === 'AM' ? 'is-selected' : '') + '">오전</button><button type="button" data-gantt-time-meridiem="PM" class="' + (state.meridiem === 'PM' ? 'is-selected' : '') + '">오후</button></div>'
                + '<div class="gantt-plan-time-picker__section"><span>시</span><div class="gantt-plan-time-picker__grid">' + hours + '</div></div>'
                + '<div class="gantt-plan-time-picker__section"><span>분 · 5분 단위</span><div class="gantt-plan-time-picker__grid gantt-plan-time-picker__grid--minutes">' + minutes + '</div></div>';
        }

        function ensureGanttPlanTimePicker() {
            if (ganttPlanTimePickerState.menu) return ganttPlanTimePickerState.menu;
            const menu = document.createElement('div');
            menu.className = 'gantt-plan-time-picker';
            menu.hidden = true;
            menu.addEventListener('click', function(event) {
                event.stopPropagation();
                const button = event.target.closest('button');
                const input = ganttPlanTimePickerState.input;
                if (!button || !input) return;
                if (button.dataset.ganttTimeAction === 'now') {
                    const now = new Date();
                    let minute = Math.round(now.getMinutes() / 5) * 5;
                    let hour = now.getHours();
                    if (minute >= 60) { minute = 0; hour = (hour + 1) % 24; }
                    ganttPlanTimePickerState.meridiem = hour >= 12 ? 'PM' : 'AM';
                    ganttPlanTimePickerState.hour12 = hour % 12 || 12;
                    ganttPlanTimePickerState.minute = minute;
                }
                if (button.dataset.ganttTimeMeridiem) ganttPlanTimePickerState.meridiem = button.dataset.ganttTimeMeridiem;
                if (button.dataset.ganttTimeHour) ganttPlanTimePickerState.hour12 = Number(button.dataset.ganttTimeHour);
                if (button.dataset.ganttTimeMinute !== undefined) ganttPlanTimePickerState.minute = Number(button.dataset.ganttTimeMinute);
                const hour = (ganttPlanTimePickerState.hour12 % 12) + (ganttPlanTimePickerState.meridiem === 'PM' ? 12 : 0);
                setGanttPlanTimeValue(input, canonicalGanttPlanTime(hour, ganttPlanTimePickerState.minute), input.id === 'ganttPlanEndTime' ? '10:00' : '09:00');
                input.dispatchEvent(new Event('change', { bubbles: true }));
                renderGanttPlanTimePicker();
            });
            document.body.appendChild(menu);
            ganttPlanTimePickerState.menu = menu;
            return menu;
        }

        function openGanttPlanTimePicker(input) {
            if (!input || input.disabled || input.readOnly) return;
            closeGanttPlanDatePicker();
            const fallback = input.id === 'ganttPlanEndTime' ? '10:00' : '09:00';
            const parsed = parseGanttPlanTime(input.value, fallback) || parseGanttPlanTime(fallback, '09:00');
            ganttPlanTimePickerState.input = input;
            ganttPlanTimePickerState.meridiem = parsed.hour >= 12 ? 'PM' : 'AM';
            ganttPlanTimePickerState.hour12 = parsed.hour % 12 || 12;
            ganttPlanTimePickerState.minute = parsed.minute;
            renderGanttPlanTimePicker();
            const menu = ensureGanttPlanTimePicker();
            menu.hidden = false;
            positionGanttPlanTimePicker();
        }

        document.addEventListener('click', function(event) {
            const trigger = event.target.closest('[data-gantt-time-target]');
            const input = event.target.closest('[data-gantt-time-picker]');
            if (trigger) {
                event.preventDefault();
                openGanttPlanTimePicker(document.getElementById(trigger.dataset.ganttTimeTarget));
                return;
            }
            if (input) {
                openGanttPlanTimePicker(input);
                return;
            }
            if (!event.target.closest('.gantt-plan-time-picker')) closeGanttPlanTimePicker();
        });

        document.addEventListener('blur', function(event) {
            const input = event.target.closest && event.target.closest('[data-gantt-time-picker]');
            if (input) normalizeGanttPlanTimeInput(input);
        }, true);

        window.addEventListener('resize', positionGanttPlanTimePicker);
        window.addEventListener('scroll', positionGanttPlanTimePicker, true);

        function getPlanEditorIdsFromItem(item) {
            const raw = item && (item.editorUserIds || item.EDITOR_USER_IDS);
            return Array.isArray(raw) ? raw.map(Number).filter(Number.isFinite) : [];
        }

        function planMemberValue(member, camel, upper) {
            if (!member) return null;
            return member[camel] ?? member[upper] ?? null;
        }

        function escapeProjectPlanHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function projectPlanScopeLabel() {
            const config = window.PROJECT_MAIN_CONFIG || {};
            const projectName = String(config.projectName || document.body?.dataset?.projectName || '').trim();
            const workspaceName = String(config.workspaceName || '').trim();
            const groupProject = config.groupProject === true || config.isPersonalProject === false;
            if (groupProject && workspaceName && projectName) return workspaceName + ' > ' + projectName;
            return projectName || workspaceName || '-';
        }

        function ganttPlanReadonlyAvatarHtml(member) {
            const name = String(planMemberValue(member, 'userName', 'USER_NAME') || '멤버');
            const userId = Number(planMemberValue(member, 'userId', 'USER_ID'));
            const image = String(planMemberValue(member, 'profileImagePath', 'PROFILE_IMAGE_PATH') || '').trim();
            const profileAttr = Number.isFinite(userId) && userId > 0
                ? ' data-gantt-plan-profile-user-id="' + userId + '" aria-label="' + escapeProjectPlanHtml(name) + ' 프로필 보기"'
                : '';
            const tag = profileAttr ? 'button' : 'span';
            const typeAttr = profileAttr ? ' type="button"' : '';
            if (image) {
                return '<' + tag + typeAttr + ' class="gantt-plan-readonly__avatar gantt-plan-readonly__avatar--image"' + profileAttr + '><img src="' + escapeProjectPlanHtml(image) + '" alt=""></' + tag + '>';
            }
            return '<' + tag + typeAttr + ' class="gantt-plan-readonly__avatar gantt-plan-readonly__avatar--fallback"' + profileAttr + '>' + escapeProjectPlanHtml(name.charAt(0) || '?') + '</' + tag + '>';
        }

        function renderGanttPlanReadonlyPeople(planItem) {
            const authorEl = document.getElementById('ganttPlanReadonlyAuthor');
            const scopeEl = document.getElementById('ganttPlanReadonlyScope');
            const editorRow = document.getElementById('ganttPlanReadonlyEditorRow');
            const editorsEl = document.getElementById('ganttPlanReadonlyEditors');
            if (scopeEl) scopeEl.textContent = projectPlanScopeLabel();

            const createdBy = Number(planItem && (planItem.createdBy || planItem.CREATED_BY) || 0);
            const author = ganttPlanEditorState.members.find(function(member) {
                return Number(planMemberValue(member, 'userId', 'USER_ID')) === createdBy;
            }) || null;
            if (authorEl) {
                const authorName = author ? String(planMemberValue(author, 'userName', 'USER_NAME') || '작성자') : '작성자';
                const authorUserId = Number(author && planMemberValue(author, 'userId', 'USER_ID'));
                const authorNameHtml = Number.isFinite(authorUserId) && authorUserId > 0
                    ? '<button type="button" class="gantt-plan-readonly__profile-name" data-gantt-plan-profile-user-id="' + authorUserId + '">' + escapeProjectPlanHtml(authorName) + '</button>'
                    : '<strong>' + escapeProjectPlanHtml(authorName) + '</strong>';
                authorEl.innerHTML = ganttPlanReadonlyAvatarHtml(author) + '<span class="gantt-plan-readonly__person-copy">' + authorNameHtml + '</span>';
            }

            const editorIds = getPlanEditorIdsFromItem(planItem);
            const editors = ganttPlanEditorState.members.filter(function(member) {
                return editorIds.includes(Number(planMemberValue(member, 'userId', 'USER_ID')));
            });
            if (editorRow) editorRow.hidden = editors.length === 0;
            if (editorsEl) {
                if (!editors.length) {
                    editorsEl.innerHTML = '';
                } else {
                    const firstName = String(planMemberValue(editors[0], 'userName', 'USER_NAME') || '멤버');
                    const summary = editors.length === 1 ? firstName : firstName + ' 외 ' + (editors.length - 1) + '명';
                    editorsEl.innerHTML = '<span class="gantt-plan-readonly__avatar-stack">'
                        + editors.slice(0, 3).map(ganttPlanReadonlyAvatarHtml).join('')
                        + '</span><span class="gantt-plan-readonly__person-copy"><strong>' + escapeProjectPlanHtml(summary) + '</strong><small>' + editors.length + '명 편집 가능</small></span>';
                }
            }
        }

        document.addEventListener('click', function(event) {
            const trigger = event.target.closest && event.target.closest('[data-gantt-plan-profile-user-id]');
            if (!trigger) return;
            const userId = Number(trigger.dataset.ganttPlanProfileUserId);
            if (!Number.isFinite(userId) || userId <= 0) return;
            event.preventDefault();
            event.stopPropagation();
            if (typeof window.openProjectMemberProfile === 'function') {
                window.openProjectMemberProfile(userId);
                return;
            }
            if (window.MemberActivityProfile && typeof window.MemberActivityProfile.open === 'function') {
                window.MemberActivityProfile.open(userId);
            }
        });

        function hydrateGanttPlanReadonlyPeople(planItem) {
            const projId = Number(getCurrentProjectId());
            if (!Number.isFinite(projId) || projId <= 0) {
                renderGanttPlanReadonlyPeople(planItem);
                return;
            }
            loadGanttPlanEditorMembers(projId).then(function() {
                renderGanttPlanReadonlyPeople(planItem);
            });
        }

        function renderGanttPlanEditorSummary() {
            const summary = document.getElementById('ganttPlanEditorSummary');
            const avatars = document.getElementById('ganttPlanEditorAvatars');
            const meta = document.getElementById('ganttPlanEditorMeta');
            const action = document.getElementById('ganttPlanEditorAction');
            const selectedMembers = ganttPlanEditorState.members.filter(function(member) {
                return ganttPlanEditorState.selectedIds.has(Number(planMemberValue(member, 'userId', 'USER_ID')));
            });
            if (!selectedMembers.length) {
                if (summary) summary.textContent = '편집 멤버를 선택하세요';
                if (meta) { meta.textContent = ''; meta.hidden = true; }
                if (action) action.textContent = '선택';
                if (avatars) {
                    avatars.innerHTML = '<span class="gantt-plan-editor-empty-avatar" aria-hidden="true"><i class="fa-solid fa-user-group"></i></span>';
                }
                return;
            }
            if (summary) {
                const firstName = String(planMemberValue(selectedMembers[0], 'userName', 'USER_NAME') || '멤버');
                summary.textContent = selectedMembers.length === 1 ? firstName : firstName + ' 외 ' + (selectedMembers.length - 1) + '명';
            }
            if (meta) {
                meta.textContent = selectedMembers.length + '명 편집 가능';
                meta.hidden = false;
            }
            if (action) action.textContent = '변경';
            if (avatars) {
                avatars.innerHTML = selectedMembers.slice(0, 3).map(function(member) {
                    const name = String(planMemberValue(member, 'userName', 'USER_NAME') || '멤버');
                    const image = String(planMemberValue(member, 'profileImagePath', 'PROFILE_IMAGE_PATH') || '').trim();
                    if (image) return '<span class="gantt-plan-editor-avatar"><img src="' + image.replace(/"/g, '&quot;') + '" alt=""></span>';
                    return '<span class="gantt-plan-editor-avatar gantt-plan-editor-avatar--fallback">' + name.charAt(0) + '</span>';
                }).join('');
            }
        }

        function renderGanttPlanEditorList() {
            const list = document.getElementById('ganttPlanEditorList');
            if (!list) return;
            if (!ganttPlanEditorState.members.length) {
                list.innerHTML = '<div class="gantt-plan-editor-empty">선택할 프로젝트 멤버가 없습니다.</div>';
                return;
            }
            list.innerHTML = ganttPlanEditorState.members.map(function(member) {
                const userId = Number(planMemberValue(member, 'userId', 'USER_ID'));
                const name = String(planMemberValue(member, 'userName', 'USER_NAME') || '멤버');
                const image = String(planMemberValue(member, 'profileImagePath', 'PROFILE_IMAGE_PATH') || '').trim();
                const selected = ganttPlanEditorState.selectedIds.has(userId);
                const avatar = image
                    ? '<span class="gantt-plan-editor-avatar"><img src="' + image.replace(/"/g, '&quot;') + '" alt=""></span>'
                    : '<span class="gantt-plan-editor-avatar gantt-plan-editor-avatar--fallback">' + name.charAt(0) + '</span>';
                return '<button type="button" class="gantt-plan-editor-member' + (selected ? ' is-selected' : '') + '" data-plan-editor-user-id="' + userId + '">'
                    + avatar + '<span class="gantt-plan-editor-member__name">' + name.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>'
                    + '<span class="gantt-plan-editor-member__check"><i class="fa-solid fa-check" aria-hidden="true"></i></span></button>';
            }).join('');
        }

        async function loadGanttPlanEditorMembers(projId) {
            if (!projId) return;
            if (ganttPlanEditorState.loadedProjId === Number(projId) && ganttPlanEditorState.members.length) {
                renderGanttPlanEditorSummary();
                renderGanttPlanEditorList();
                return;
            }
            try {
                const response = await fetch(getProjectMainContextPath() + '/project/api/members?projId=' + encodeURIComponent(projId), {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });
                ganttPlanEditorState.members = response.ok ? await response.json() : [];
                ganttPlanEditorState.loadedProjId = Number(projId);
            } catch (error) {
                console.error('[프로젝트 계획] 편집 권한 멤버 조회 실패:', error);
                ganttPlanEditorState.members = [];
            }
            renderGanttPlanEditorSummary();
            renderGanttPlanEditorList();
        }

        function setupGanttPlanEditorSection(planItem, isReadOnly) {
            const section = document.getElementById('ganttPlanEditorSection');
            const panel = document.getElementById('ganttPlanEditorPanel');
            const toggle = document.getElementById('ganttPlanEditorToggle');
            const config = window.PROJECT_MAIN_CONFIG || {};
            const canAssign = canManageProjectPlan() && config.isPersonalProject !== true;
            ganttPlanEditorState.selectedIds = new Set(getPlanEditorIdsFromItem(planItem));
            if (section) section.hidden = !!isReadOnly || !canAssign;
            if (panel) panel.hidden = true;
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
            renderGanttPlanEditorSummary();
            if (canAssign && !isReadOnly) loadGanttPlanEditorMembers(Number(getCurrentProjectId()));
        }

        function bindGanttPlanEditorSection() {
            const toggle = document.getElementById('ganttPlanEditorToggle');
            const panel = document.getElementById('ganttPlanEditorPanel');
            const list = document.getElementById('ganttPlanEditorList');
            if (toggle && toggle.dataset.bound !== 'true') {
                toggle.dataset.bound = 'true';
                toggle.addEventListener('click', function() {
                    if (!panel) return;
                    panel.hidden = !panel.hidden;
                    toggle.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
                });
            }
            if (list && list.dataset.bound !== 'true') {
                list.dataset.bound = 'true';
                list.addEventListener('click', function(event) {
                    const button = event.target.closest('[data-plan-editor-user-id]');
                    if (!button) return;
                    const userId = Number(button.dataset.planEditorUserId);
                    if (!Number.isFinite(userId)) return;
                    if (ganttPlanEditorState.selectedIds.has(userId)) ganttPlanEditorState.selectedIds.delete(userId);
                    else ganttPlanEditorState.selectedIds.add(userId);
                    renderGanttPlanEditorSummary();
                    renderGanttPlanEditorList();
                });
            }
        }

        function openGanttPlanCreateModal(startDate, endDate, planItem) {
            const overlay = document.getElementById('ganttPlanCreateModal');
            const form = document.getElementById('ganttPlanCreateForm');
            const titleInput = document.getElementById('ganttPlanTitle');
            const startInput = document.getElementById('ganttPlanStartDate');
            const endInput = document.getElementById('ganttPlanEndDate');
            const memoInput = document.getElementById('ganttPlanMemo');
            const customColorInput = document.getElementById('ganttPlanCustomColor');
            const colorPicker = document.getElementById('ganttPlanColorPicker');
            const dateTriggers = form ? form.querySelectorAll('.gantt-plan-modal__date-trigger') : [];
            const footer = form ? form.querySelector('.gantt-plan-modal__footer') : null;
            const readonlySummary = document.getElementById('ganttPlanReadonlySummary');
            const readonlyTitle = document.getElementById('ganttPlanReadonlyTitle');
            const readonlyTitleLabel = document.getElementById('ganttPlanReadonlyTitleLabel');
            const readonlyPeriodLabel = document.getElementById('ganttPlanReadonlyPeriodLabel');
            const readonlyTypeColor = document.getElementById('ganttPlanReadonlyTypeColor');
            const readonlyTypeText = document.getElementById('ganttPlanReadonlyTypeText');
            const readonlyPeriod = document.getElementById('ganttPlanReadonlyPeriod');
            const readonlyMemo = document.getElementById('ganttPlanReadonlyMemo');
            const editableSections = form ? form.querySelectorAll(':scope > .gantt-plan-modal__section') : [];
            const modalContext = window.__projectPlanModalContext || { mode: 'PERIOD_PLAN' };
            const canEditPlan = canManageProjectPlan();
            const isExistingPlan = !!(planItem && (
                planItem.entityId
                || planItem.weeklyPlanId
                || planItem.timePlanId
                || modalContext.weeklyPlanId
                || modalContext.timePlanId
            ));
            const isTimePlanMode = modalContext.mode === 'TIME_PLAN';
            const isWeeklyPlanMode = modalContext.mode === 'WEEKLY_PLAN';
            const recordSection = document.getElementById('ganttPlanRecordSection');
            if (recordSection) recordSection.hidden = false;
            currentPeriodPlanRecordDraftKey = null;
            currentPeriodPlanRecordTargetId = null;
            currentPeriodPlanRecordSaved = false;
            if (planItem) {
                modalContext.item = planItem;
                modalContext.startDate = modalContext.startDate || startDate || planItem.startDate || '';
                modalContext.endDate = modalContext.endDate || endDate || planItem.endDate || planItem.startDate || '';
                window.__projectPlanModalContext = modalContext;
            }
            const usesTimeFields = isTimePlanMode || isWeeklyPlanMode;
            const isReadOnly = isExistingPlan && modalContext.editMode !== true;
            bindGanttPlanEditorSection();

            if (!overlay || !form || !startInput || !endInput) {
                console.error('[간트차트] 전용 등록 모달 마크업을 찾을 수 없습니다.');
                return;
            }

            form.reset();
            overlay.dataset.planMode = isWeeklyPlanMode ? 'WEEKLY' : (isTimePlanMode ? 'TIME' : 'PERIOD');
            currentGanttPlanId = isWeeklyPlanMode
                ? (Number(modalContext.weeklyPlanId || (planItem && (planItem.weeklyPlanId || planItem.entityId))) || null)
                : (isTimePlanMode
                    ? (Number(modalContext.timePlanId || (planItem && planItem.entityId)) || null)
                    : (planItem && planItem.entityId ? Number(planItem.entityId) : null));
            syncProjectPlanRecordSetting(planItem || modalContext.item || null, isReadOnly);
            startInput.value = isWeeklyPlanMode ? '' : (isTimePlanMode ? (modalContext.startDate || startDate || '') : (planItem ? (planItem.startDate || '') : (startDate || '')));
            endInput.value = isWeeklyPlanMode ? '' : (isTimePlanMode ? (modalContext.endDate || modalContext.startDate || endDate || startDate || '') : (planItem ? (planItem.endDate || planItem.startDate || '') : (endDate || startDate || '')));
            if (titleInput) titleInput.value = planItem ? (planItem.title || '') : '';
            if (memoInput) memoInput.value = planItem ? (planItem.description || '') : '';

            const timeFields = form.querySelectorAll('[data-gantt-time-field]');
            const startTimeInput = document.getElementById('ganttPlanStartTime');
            const endTimeInput = document.getElementById('ganttPlanEndTime');
            timeFields.forEach(function(field) { field.hidden = !usesTimeFields; });
            if (startTimeInput) {
                startTimeInput.required = usesTimeFields;
                setGanttPlanTimeValue(startTimeInput, usesTimeFields ? (modalContext.startTime || (planItem && planItem.startTime) || '09:00') : '09:00', '09:00');
            }
            if (endTimeInput) {
                endTimeInput.required = usesTimeFields;
                setGanttPlanTimeValue(endTimeInput, usesTimeFields ? (modalContext.endTime || (planItem && planItem.endTime) || '10:00') : '10:00', '10:00');
            }
            const weeklyFields = document.getElementById('ganttPlanWeeklyFields');
            const dayOfWeekInput = document.getElementById('ganttPlanDayOfWeek');
            if (weeklyFields) weeklyFields.hidden = !isWeeklyPlanMode;
            bindWeeklyDayButtons();
            if (isWeeklyPlanMode) {
                const initialDay = Number(modalContext.dayOfWeek || (planItem && planItem.dayOfWeek) || 1);
                setSelectedWeeklyDays([initialDay], !!currentGanttPlanId);
            } else {
                setSelectedWeeklyDays([], false);
            }
            if (dayOfWeekInput) dayOfWeekInput.required = false;
            const dateRows = form.querySelectorAll('.gantt-plan-modal__date-row');
            form.querySelectorAll('.gantt-plan-modal__date-field').forEach(function(field) { field.hidden = isWeeklyPlanMode; });
            dateRows.forEach(function(row) { row.hidden = isWeeklyPlanMode || (!isTimePlanMode && !isWeeklyPlanMode); });
            const dualCalendar = document.getElementById('ganttPlanDualCalendar');
            if (dualCalendar) {
                dualCalendar.hidden = isWeeklyPlanMode || isTimePlanMode;
                if (!dualCalendar.hidden) {
                    bindGanttPlanDualCalendar();
                    syncGanttPlanDualCalendarMonths();
                }
            }
            const legacyRangePicker = document.getElementById('ganttPlanRangePicker');
            if (legacyRangePicker) { legacyRangePicker.hidden = true; legacyRangePicker.innerHTML = ''; }
            startInput.required = !isWeeklyPlanMode;
            endInput.required = !isWeeklyPlanMode;
            const periodTitle = document.getElementById('ganttPlanPeriodSectionTitle');
            if (periodTitle) periodTitle.textContent = isWeeklyPlanMode ? '요일 및 시간' : (isTimePlanMode ? '계획 날짜 및 시간' : '계획 기간');

            const modalTitle = document.getElementById('ganttPlanCreateTitle');
            const saveButton = form.querySelector('.gantt-plan-modal__save');
            const editButton = document.getElementById('ganttPlanEditButton');
            const deleteButton = document.getElementById('ganttPlanDeleteButton');
            if (modalTitle) {
                modalTitle.textContent = isWeeklyPlanMode
                    ? (isReadOnly ? '주간 계획 상세' : (currentGanttPlanId ? '주간 계획 수정' : '주간 계획 등록'))
                    : (isTimePlanMode
                        ? (isReadOnly ? '시간별 계획 상세' : (currentGanttPlanId ? '시간별 계획 수정' : '시간별 계획 등록'))
                        : (isReadOnly ? '기간별 계획 상세' : (currentGanttPlanId ? '기간별 계획 수정' : '기간별 계획 등록')));
            }
            if (saveButton) saveButton.textContent = currentGanttPlanId ? '수정' : '등록';
            if (editButton) {
                const canEditExisting = !!currentGanttPlanId && canEditPlan && isReadOnly;
                editButton.hidden = !canEditExisting;
                editButton.disabled = !canEditExisting;
                editButton.onclick = canEditExisting ? enterProjectPlanEditMode : null;
            }
            if (deleteButton) {
                const cfg = window.PROJECT_MAIN_CONFIG || {};
                const canDelete = !!currentGanttPlanId && (cfg.isPersonalProject === true || cfg.canManageProject === true);
                deleteButton.hidden = !canDelete;
                deleteButton.disabled = !canDelete;
                deleteButton.onclick = canDelete ? deleteCurrentGanttPlan : null;
            }

            overlay.classList.toggle('is-readonly', isReadOnly);
            editableSections.forEach(function(section) {
                section.hidden = isReadOnly;
                section.style.display = isReadOnly ? 'none' : '';
            });
            setupGanttPlanEditorSection(planItem || modalContext.item || null, isReadOnly);
            if (readonlySummary) {
                readonlySummary.hidden = !isReadOnly;
                readonlySummary.style.display = isReadOnly ? '' : 'none';
            }

            // 조회 전용 상세에서는 상단 요약만 표시한다.
            // 주간 모드의 요일 버튼/시간 입력 미리보기와 날짜·시간 편집 영역은 중복이므로 숨긴다.
            const scheduleSection = form ? form.querySelector('.gantt-plan-modal__schedule-section') : null;
            [weeklyFields, scheduleSection].forEach(function(section) {
                if (!section) return;
                if (isReadOnly) {
                    section.hidden = true;
                    section.setAttribute('aria-hidden', 'true');
                    section.style.setProperty('display', 'none', 'important');
                } else {
                    section.style.removeProperty('display');
                    section.removeAttribute('aria-hidden');
                    if (section === weeklyFields) {
                        section.hidden = !isWeeklyPlanMode;
                    } else {
                        section.hidden = false;
                    }
                }
            });

            if (isReadOnly) {
                if (readonlyTitleLabel) readonlyTitleLabel.textContent = isWeeklyPlanMode ? '주간 계획명' : (isTimePlanMode ? '시간별 계획명' : '계획명');
                if (readonlyPeriodLabel) readonlyPeriodLabel.textContent = isWeeklyPlanMode ? '요일 및 시간' : (isTimePlanMode ? '계획 일시' : '계획 기간');
                if (readonlyTitle) readonlyTitle.textContent = (planItem && planItem.title) ? planItem.title : '-';
                if (readonlyTypeColor) readonlyTypeColor.style.backgroundColor = normalizeScheduleColor(planItem && planItem.color ? planItem.color : '#4A90E2');
                if (readonlyTypeText) readonlyTypeText.textContent = isWeeklyPlanMode ? '주간' : (isTimePlanMode ? '시간별' : '기간별');
                hydrateGanttPlanReadonlyPeople(planItem || modalContext.item || null);
                if (readonlyPeriod) {
                    if (isWeeklyPlanMode) {
                        const weeklyDayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                        const weeklyDay = Number(modalContext.dayOfWeek || (planItem && planItem.dayOfWeek) || 1);
                        const weeklyStartTime = String(modalContext.startTime || (planItem && planItem.startTime) || '').substring(0, 5);
                        const weeklyEndTime = String(modalContext.endTime || (planItem && planItem.endTime) || '').substring(0, 5);
                        readonlyPeriod.textContent = (weeklyDayNames[weeklyDay] || '-') + (weeklyStartTime && weeklyEndTime ? ' · ' + weeklyStartTime + ' ~ ' + weeklyEndTime : '');
                    } else if (isTimePlanMode) {
                        const readonlyStart = (planItem && planItem.startDate) || modalContext.startDate || startDate || '';
                        const readonlyEnd = (planItem && (planItem.endDate || planItem.startDate)) || modalContext.endDate || endDate || readonlyStart;
                        const readonlyStartTime = String(modalContext.startTime || (planItem && planItem.startTime) || '').substring(0, 5);
                        const readonlyEndTime = String(modalContext.endTime || (planItem && planItem.endTime) || '').substring(0, 5);
                        readonlyPeriod.textContent = [readonlyStart, readonlyStartTime].filter(Boolean).join(' ') + ' ~ ' + [readonlyEnd, readonlyEndTime].filter(Boolean).join(' ');
                    } else {
                        const readonlyStart = (planItem && planItem.startDate) || startDate || '';
                        const readonlyEnd = (planItem && (planItem.endDate || planItem.startDate)) || endDate || startDate || '';
                        readonlyPeriod.textContent = [readonlyStart, readonlyEnd].filter(Boolean).join(' ~ ') || '-';
                    }
                }
                if (readonlyMemo) {
                    const memoText = (planItem && planItem.description ? String(planItem.description) : '').trim();
                    const readonlyMemoItem = readonlyMemo.closest('.gantt-plan-readonly__item--memo');
                    readonlyMemo.textContent = memoText;
                    readonlyMemo.classList.remove('is-empty');
                    if (readonlyMemoItem) {
                        readonlyMemoItem.hidden = !memoText;
                        readonlyMemoItem.style.display = memoText ? '' : 'none';
                    }
                    if (readonlySummary) {
                        readonlySummary.classList.toggle('has-memo', Boolean(memoText));
                    }
                }
            }
            [titleInput, startInput, endInput, memoInput].forEach(function(field) {
                if (!field) return;
                field.readOnly = isReadOnly;
                field.setAttribute('aria-readonly', String(isReadOnly));
                field.tabIndex = isReadOnly ? -1 : 0;
            });
            dateTriggers.forEach(function(button) {
                button.hidden = isReadOnly;
                button.disabled = isReadOnly;
                button.style.display = isReadOnly ? 'none' : '';
            });
            if (colorPicker && isReadOnly) {
                colorPicker.hidden = true;
                colorPicker.style.display = 'none';
            } else if (colorPicker) {
                colorPicker.hidden = false;
                colorPicker.style.display = 'flex';
            }
            if (footer) {
                footer.hidden = isReadOnly;
                footer.style.display = isReadOnly ? 'none' : '';
            }
            if (saveButton) {
                saveButton.disabled = isReadOnly;
                saveButton.setAttribute('aria-disabled', String(isReadOnly));
                saveButton.tabIndex = isReadOnly ? -1 : 0;
            }

            const defaultColor = normalizeScheduleColor(planItem && planItem.color ? planItem.color : getNextPlanColorByMode(modalContext.mode));
            renderGanttPlanColorOptions(defaultColor);

            const colorOptions = document.getElementById('ganttPlanColorOptions');
            if (colorOptions) {
                colorOptions.onclick = function(event) {
                    if (!event.target.closest('.gantt-plan-modal__color-chip')) return;
                };
            }
            if (customColorInput) {
                customColorInput.value = defaultColor;
                customColorInput.oninput = function() {
                    const customColor = normalizeScheduleColor(customColorInput.value);
                    renderGanttPlanColorOptions(customColor);
                    selectGanttPlanColor(customColor, true);
                };
            }

            overlay.hidden = false;
            document.body.classList.add('gantt-plan-modal-open');
            window.requestAnimationFrame(function() {
                if (!isReadOnly && titleInput) titleInput.focus();
            });
        }

        function enterProjectPlanEditMode() {
            const context = Object.assign({}, window.__projectPlanModalContext || {});
            if (!canManageProjectPlan() || !context.item) return;
            context.editMode = true;
            window.__projectPlanModalContext = context;
            openGanttPlanCreateModal(
                context.startDate || '',
                context.endDate || context.startDate || '',
                context.item
            );
        }

        window.openProjectPlanSharedModal = function(config) {
            const context = Object.assign({ mode: 'PERIOD_PLAN' }, config || {});
            if (context.item && context.editMode !== true) context.editMode = false;
            window.__projectPlanModalContext = context;
            openGanttPlanCreateModal(context.startDate || '', context.endDate || context.startDate || '', context.item || null);
        };

        function openAddScheduleModalWithDates(startDate, endDate) {
            const range = getOrderedDateRange(startDate, endDate);
            openGanttPlanCreateModal(range.startDate, range.endDate);
        }

        document.addEventListener('click', function(event) {
            const overlay = document.getElementById('ganttPlanCreateModal');
            if (!overlay || overlay.hidden) return;
            if (event.target === overlay || event.target.closest('[data-gantt-plan-modal-close]')) {
                closeGanttPlanCreateModal();
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key !== 'Escape') return;
            const overlay = document.getElementById('ganttPlanCreateModal');
            if (overlay && !overlay.hidden) closeGanttPlanCreateModal();
        });

        async function deleteCurrentGanttPlan() {
            if (!canManageProjectPlan()) {
                alert('기간별 계획을 삭제할 권한이 없습니다.');
                return;
            }

            const modalContext = window.__projectPlanModalContext || { mode: 'PERIOD_PLAN' };
            const isTimePlanMode = modalContext.mode === 'TIME_PLAN';
            const isWeeklyPlanMode = modalContext.mode === 'WEEKLY_PLAN';
            const recordSection = document.getElementById('ganttPlanRecordSection');
            if (recordSection) recordSection.hidden = false;
            const periodPlanId = Number(currentGanttPlanId);
            if (!Number.isFinite(periodPlanId) || periodPlanId <= 0) return;
            if (!window.confirm((isWeeklyPlanMode ? '이 주간 계획을 삭제할까요?' : (isTimePlanMode ? '이 시간별 계획을 삭제할까요?' : '이 기간별 계획을 삭제할까요?')) + '\n삭제한 계획은 되돌릴 수 없어요.')) return;

            const deleteButton = document.getElementById('ganttPlanDeleteButton');
            if (deleteButton) {
                deleteButton.disabled = true;
                deleteButton.setAttribute('aria-disabled', 'true');
            }

            try {
                const endpoint = getProjectMainContextPath() + (isWeeklyPlanMode ? '/project/api/weekly-plans/' : (isTimePlanMode ? '/project/api/time-plans/' : '/project/api/period-plans/')) + encodeURIComponent(periodPlanId);
                const response = await fetch(endpoint, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });
                const body = await response.json().catch(function() { return {}; });
                if (!response.ok || body.success === false) {
                    throw new Error(body.message || '기간별 계획을 삭제하지 못했습니다.');
                }

                currentGanttPlanId = null;
                const isCalendarHost = String(window.PROJECT_MAIN_CONFIG?.hostContext || '').toUpperCase() === 'CALENDAR_V2';
                if (!isCalendarHost) {
                    if (isWeeklyPlanMode) {
                        await loadProjectWeeklyPlanItems();
                        renderWeeklyPlan();
                    } else if (isTimePlanMode) {
                        await loadProjectTimeScheduleItems();
                        if (typeof renderTimeSchedule === 'function') {
                            renderTimeSchedule();
                        }
                    } else {
                        await loadProjectPlanItems();
                        renderProjectPlanViews('GANTT');
                    }
                }
                closeGanttPlanCreateModal();
            } catch (error) {
                console.error('[간트차트] 계획 삭제 실패:', error);
                alert(error.message || '기간별 계획을 삭제하지 못했습니다.');
            } finally {
                if (deleteButton) {
                    deleteButton.disabled = false;
                    deleteButton.setAttribute('aria-disabled', 'false');
                }
            }
        }

        function getSelectedWeeklyDays() {
            return Array.from(document.querySelectorAll('#ganttPlanWeekdayOptions [data-weekly-day].is-selected'))
                .map(function(button) { return Number(button.dataset.weeklyDay); })
                .filter(function(day) { return day >= 1 && day <= 7; });
        }

        function setSelectedWeeklyDays(days, lockSingle) {
            const selected = new Set((Array.isArray(days) ? days : [days]).map(Number));
            document.querySelectorAll('#ganttPlanWeekdayOptions [data-weekly-day]').forEach(function(button) {
                const day = Number(button.dataset.weeklyDay);
                const active = selected.has(day);
                button.classList.toggle('is-selected', active);
                button.setAttribute('aria-pressed', String(active));
                button.disabled = !!lockSingle && !active;
            });
            const hiddenInput = document.getElementById('ganttPlanDayOfWeek');
            if (hiddenInput) hiddenInput.value = String(Array.from(selected)[0] || '');
        }

        function bindWeeklyDayButtons() {
            const container = document.getElementById('ganttPlanWeekdayOptions');
            if (!container || container.dataset.bound === 'true') return;
            container.dataset.bound = 'true';
            container.addEventListener('click', function(event) {
                const button = event.target.closest('[data-weekly-day]');
                if (!button || button.disabled) return;
                const modalContext = window.__projectPlanModalContext || {};
                const editing = Number(modalContext.weeklyPlanId || 0) > 0;
                if (editing) {
                    setSelectedWeeklyDays([Number(button.dataset.weeklyDay)], true);
                    return;
                }
                button.classList.toggle('is-selected');
                button.setAttribute('aria-pressed', String(button.classList.contains('is-selected')));
                const selected = getSelectedWeeklyDays();
                const hiddenInput = document.getElementById('ganttPlanDayOfWeek');
                if (hiddenInput) hiddenInput.value = String(selected[0] || '');
            });
        }

        async function saveGanttPlan(event) {
            event.preventDefault();
            if (!canManageProjectPlan()) {
                alert('프로젝트 계획을 수정할 권한이 없습니다.');
                return;
            }

            const modalContext = window.__projectPlanModalContext || { mode: 'PERIOD_PLAN' };
            const isTimePlanMode = modalContext.mode === 'TIME_PLAN';
            const isWeeklyPlanMode = modalContext.mode === 'WEEKLY_PLAN';
            const recordSection = document.getElementById('ganttPlanRecordSection');
            if (recordSection) recordSection.hidden = false;
            const form = event.target;
            const submitButton = form.querySelector('.gantt-plan-modal__save');
            const projId = getCurrentProjectId();
            const title = (document.getElementById('ganttPlanTitle')?.value || '').trim();
            const startDateInput = document.getElementById('ganttPlanStartDate');
            const endDateInput = document.getElementById('ganttPlanEndDate');
            const startDate = normalizeGanttPlanDateText(startDateInput?.value || '');
            let endDate = normalizeGanttPlanDateText(endDateInput?.value || '');
            if (startDateInput && startDate) startDateInput.value = startDate;
            if (endDateInput && endDate) endDateInput.value = endDate;
            const startTime = (document.getElementById('ganttPlanStartTime')?.value || '').trim();
            let endTime = (document.getElementById('ganttPlanEndTime')?.value || '').trim();
            const selectedWeeklyDays = isWeeklyPlanMode ? getSelectedWeeklyDays() : [];
            const dayOfWeek = Number(selectedWeeklyDays[0] || modalContext.dayOfWeek || 0);
            const color = normalizeScheduleColor(document.getElementById('ganttPlanColor')?.value || getNextPlanColorByMode(modalContext.mode));

            if (isTimePlanMode) {
                const normalizedBoundary = normalizeTimePlanEndBoundary(startDate, endDate, endTime);
                endDate = normalizedBoundary.endDate;
                endTime = normalizedBoundary.endTime;
                if (endDateInput) endDateInput.value = endDate;
                const endTimeInput = document.getElementById('ganttPlanEndTime');
                if (endTimeInput) endTimeInput.value = endTime;
            }

            if (!projId) return alert('프로젝트 정보를 확인할 수 없습니다.');
            if (!title) return alert('제목을 입력해주세요.');
            if (isWeeklyPlanMode && selectedWeeklyDays.length === 0) return alert('반복할 요일을 하나 이상 선택해주세요.');
            if (!isWeeklyPlanMode && (!startDate || !endDate)) return alert(isTimePlanMode ? '계획 날짜를 선택해주세요.' : '계획 기간을 선택해주세요.');
            if (!isWeeklyPlanMode && (!parseGanttPlanDateValue(startDate) || !parseGanttPlanDateValue(endDate))) return alert('날짜 형식을 확인해주세요.');
            if (!isWeeklyPlanMode && startDate > endDate) return alert('종료일은 시작일보다 빠를 수 없습니다.');
            if ((isTimePlanMode || isWeeklyPlanMode) && (!startTime || !endTime)) return alert('시작 시간과 종료 시간을 입력해주세요.');
            if (isTimePlanMode && endDate === startDate && endTime <= startTime) return alert('종료 일시는 시작 일시보다 늦어야 합니다.');
            if (isTimePlanMode && hasTimePlanOverlapInLoadedItems(startDate, startTime, endDate, endTime, currentGanttPlanId)) {
                return alert('해당 시간대에 이미 등록된 시간별 계획이 있습니다.');
            }
            if (isWeeklyPlanMode && typeof window.hasWeeklyPlanOverlapInLoadedItems === 'function') {
                const overlapDay = selectedWeeklyDays.find(function(day) {
                    return window.hasWeeklyPlanOverlapInLoadedItems(day, startTime, endTime, currentGanttPlanId);
                });
                if (overlapDay) return alert('선택한 요일 중 이미 등록된 시간대가 있습니다.');
            }

            const projectConfig = window.PROJECT_MAIN_CONFIG || {};
            const projectStart = String(projectConfig.projectStartDate || '').substring(0, 10);
            const projectEnd = String(projectConfig.projectEndDate || '').substring(0, 10);
            if (!isWeeklyPlanMode && ((projectStart && startDate < projectStart) || (projectEnd && endDate > projectEnd))) {
                return alert('프로젝트 기간 안에서 등록해 주세요.');
            }
            if (isTimePlanMode) {
                const timeBounds = getGanttTimePlanAllowedBounds();
                if ((timeBounds.start && startDate < timeBounds.start) || (timeBounds.end && endDate > timeBounds.end)) {
                    return alert('시간별 계획 기간 안에서 등록해 주세요.');
                }
            }

            const isEditMode = Number.isFinite(currentGanttPlanId) && currentGanttPlanId > 0;

            const payload = isWeeklyPlanMode ? {
                projId: Number(projId),
                title: title,
                description: null,
                dayOfWeek: dayOfWeek,
                startTime: startTime,
                endTime: endTime,
                repeatStartDate: projectStart || null,
                repeatEndDate: projectEnd || null,
                color: color,
                activeYn: (modalContext.item && modalContext.item.activeYn) || 'Y',
                draftKey: null,
                recordEnabledYn: 'Y',
                recordVisibility: 'PROJECT',
                editorUserIds: Array.from(ganttPlanEditorState.selectedIds)
            } : (isTimePlanMode ? {
                projId: Number(projId),
                title: title,
                description: null,
                startDate: startDate,
                endDate: endDate,
                allDayYn: 'N',
                startTime: startTime,
                endTime: endTime,
                color: color,
                draftKey: null,
                recordEnabledYn: 'Y',
                recordVisibility: 'PROJECT',
                editorUserIds: Array.from(ganttPlanEditorState.selectedIds)
            } : {
                projId: Number(projId),
                title: title,
                description: null,
                startDate: startDate,
                endDate: endDate,
                color: color,
                draftKey: null,
                recordEnabledYn: 'Y',
                recordVisibility: 'PROJECT',
                editorUserIds: Array.from(ganttPlanEditorState.selectedIds),
                sortOrder: Array.isArray(projectGanttItems) ? projectGanttItems.filter(function(item) { return item && item.type === 'PERIOD_PLAN'; }).length + 1 : 1
            });

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.setAttribute('aria-disabled', 'true');
                submitButton.textContent = isEditMode ? '수정 중...' : '등록 중...';
            }

            try {
                const basePath = isWeeklyPlanMode ? '/project/api/weekly-plans' : (isTimePlanMode ? '/project/api/time-plans' : '/project/api/period-plans');
                const endpoint = getProjectMainContextPath() + basePath + (isEditMode ? '/' + encodeURIComponent(currentGanttPlanId) : '');
                if (isWeeklyPlanMode && !isEditMode && selectedWeeklyDays.length > 1) {
                    for (const selectedDay of selectedWeeklyDays) {
                        const response = await fetch(getProjectMainContextPath() + basePath, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify(Object.assign({}, payload, { dayOfWeek: selectedDay }))
                        });
                        const body = await response.json().catch(function() { return {}; });
                        if (!response.ok || body.success === false) {
                            throw new Error(body.message || '주간 계획을 등록하지 못했습니다.');
                        }
                    }
                } else {
                    const response = await fetch(endpoint, {
                        method: isEditMode ? 'PUT' : 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const body = await response.json().catch(function() { return {}; });
                    if (!response.ok || body.success === false) {
                        throw new Error(body.message || (isEditMode ? '계획을 수정하지 못했습니다.' : '계획을 등록하지 못했습니다.'));
                    }
                }

                currentPeriodPlanRecordSaved = true;
                closeGanttPlanCreateModal();
                // 달력에서 연 공통 계획 모달은 bridge가 닫힘을 감지해 달력만
                // 갱신한다. 프로젝트 메인 전용 간트/주간/시간표 재렌더는 생략한다.
                const isCalendarHost = String(window.PROJECT_MAIN_CONFIG?.hostContext || '').toUpperCase() === 'CALENDAR_V2';
                if (!isCalendarHost) {
                    if (isWeeklyPlanMode) {
                        await loadProjectWeeklyPlanItems();
                        renderWeeklyPlan();
                    } else if (isTimePlanMode) {
                        await loadProjectTimeScheduleItems();
                        if (typeof renderTimeSchedule === 'function') {
                            renderTimeSchedule();
                        }
                    } else {
                        await loadProjectPlanItems();
                        renderProjectPlanViews('GANTT');
                    }
                }
            } catch (error) {
                console.error(isWeeklyPlanMode ? '[주간 계획] 저장 실패:' : (isTimePlanMode ? '[시간별 계획] 저장 실패:' : '[기간별 계획] 저장 실패:'), error);
                alert(error.message || (isEditMode ? '계획을 수정하지 못했습니다.' : '계획을 등록하지 못했습니다.'));
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.setAttribute('aria-disabled', 'false');
                    submitButton.textContent = isEditMode ? '수정' : '등록';
                }
            }
        }

        document.addEventListener('submit', function(event) {
            if (!event.target || event.target.id !== 'ganttPlanCreateForm') return;
            saveGanttPlan(event);
        });



function initProjectPlanContentRecordModal() {
    if (!window.moyoCommonContentRecordModal && window.CommonContentRecordModal?.create) {
        window.moyoCommonContentRecordModal = window.CommonContentRecordModal.create({
            contextPath: getProjectMainContextPath(),
            onChanged: async function() {
                const detailRow = document.getElementById('ganttPlanRecordDetailRow');
                if (detailRow && !detailRow.hidden && currentGanttPlanId) {
                    await loadProjectPlanRecordSummary();
                }
            },
            onCreatePhoto: async function (payload) {
                const recordTargetId = payload && payload.recordTargetId;
                const formData = payload && payload.formData;
                const projId = Number(getCurrentProjectId());
                if (!recordTargetId || !Number.isFinite(projId) || projId <= 0) throw new Error('사진을 저장할 기록 대상을 확인할 수 없습니다.');
                const files = formData ? formData.getAll('files').filter(file => file instanceof File && file.size > 0) : [];
                if (!files.length) throw new Error('등록할 사진을 선택해주세요.');
                const requestJson = async function(url, options) {
                    const response = await fetch(getProjectMainContextPath() + url, Object.assign({ credentials: 'include' }, options || {}));
                    const body = await response.json().catch(function() { return null; });
                    if (!response.ok) throw new Error(body?.message || body?.error || '사진을 저장하지 못했습니다.');
                    return body;
                };
                const context = window.__projectPlanModalContext || { mode: 'PERIOD_PLAN' };
                const defaultLabel = context.mode === 'TIME_PLAN' ? '시간별 계획'
                    : (context.mode === 'WEEKLY_PLAN' ? '주간 계획' : '기간별 계획');
                const title = document.getElementById('ganttPlanTitle')?.value?.trim() || defaultLabel;
                const album = await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/photo-album', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ albumName: title })
                });
                const albumId = Number(album?.albumId || album?.ALBUM_ID);
                if (!albumId) throw new Error('기록 사진 앨범을 준비하지 못했습니다.');
                const upload = new FormData();
                upload.append('scopeType', 'PROJECT');
                upload.append('scopeId', String(projId));
                upload.append('albumId', String(albumId));
                upload.append('title', title);
                upload.append('description', '');
                upload.append('visibilityType', 'PROJECT');
                files.forEach(file => upload.append('files', file));
                const post = await requestJson('/api/photo-posts', { method: 'POST', body: upload });
                const postId = Number(post?.postId || post?.POST_ID);
                if (!postId) throw new Error('사진 게시물 정보를 확인하지 못했습니다.');
                await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/contents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recordType: 'PHOTO', contentId: postId, title: title })
                });
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectPlanContentRecordModal, { once: true });
} else {
    initProjectPlanContentRecordModal();
}


document.addEventListener('change', function(event) {
    if (event.target && event.target.id === 'ganttPlanRecordEnabled') {
        const wrap = document.getElementById('ganttPlanRecordVisibilityWrap');
        if (wrap) wrap.hidden = !event.target.checked;
    }
});
document.addEventListener('click', function(event) {
    const visibilityButton = event.target.closest && event.target.closest('[data-plan-record-visibility]');
    if (visibilityButton) {
        setProjectPlanRecordVisibility(visibilityButton.dataset.planRecordVisibility);
        return;
    }
    const shortcut = event.target.closest && event.target.closest('[data-plan-record-type]');
    if (shortcut) {
        openProjectPlanCommonRecords(shortcut.dataset.planRecordType);
        return;
    }
    const viewButton = event.target.closest && event.target.closest('#ganttPlanRecordViewButton');
    if (viewButton) openProjectPlanCommonRecords('NOTE');
});
