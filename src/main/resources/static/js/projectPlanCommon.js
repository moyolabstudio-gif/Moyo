/** MOYO 프로젝트 계획 공통 상태·유틸·셸 제어 */
/**
 * MOYO 프로젝트 타임라인
 *
 * 간트차트, 주간계획표, 프로젝트 일정 등록/수정/삭제를 담당합니다.
 * 기존 전역 함수 호출 구조는 유지합니다.
 */

let currentScheduleId = null;
let currentGanttPlanId = null;
let projectTimeScheduleItems = [];

        function refreshProjectPlanViews() {
            const jobs = [];

            if (typeof loadProjectSchedules === 'function') {
                try {
                    const result = loadProjectSchedules({ force: true });
                    if (result && typeof result.then === 'function') jobs.push(result);
                } catch (error) {
                    console.error('[프로젝트 계획] 타임라인 재조회 실패:', error);
                }
            }

            if (typeof window.loadKanbanBoard === 'function') {
                try {
                    const result = window.loadKanbanBoard();
                    if (result && typeof result.then === 'function') jobs.push(result);
                } catch (error) {
                    console.error('[프로젝트 계획] 업무 재조회 실패:', error);
                }
            }

            if (window.ProjectMiniCalendarAdapter && typeof window.ProjectMiniCalendarAdapter.reload === 'function') {
                try {
                    const result = window.ProjectMiniCalendarAdapter.reload();
                    if (result && typeof result.then === 'function') jobs.push(result);
                } catch (error) {
                    console.error('[프로젝트 계획] 미니 달력 재조회 실패:', error);
                }
            }

            return Promise.allSettled(jobs);
        }

        window.refreshProjectPlanViews = refreshProjectPlanViews;
let timeSchedulePlacementTasks = [];

const defaultScheduleColorPalette = [
            '#4A90E2',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#EC4899',
            '#14B8A6',
            '#64748B',
            '#06B6D4',
            '#6366F1',
            '#84CC16',
            '#F97316'
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

        let timeScheduleDragState = null;
        let timeScheduleEventDragState = null;
        let suppressTimeScheduleClick = false;
        let timeScheduleDawnExpanded = false;
        let currentTimePlanWeekIndex = 0;











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














        function getProjectMainContextPath() {
            const config = window.PROJECT_MAIN_CONFIG || {};
            const contextPath = String(config.contextPath || '').trim();
            return contextPath === '/' ? '' : contextPath.replace(/\/$/, '');
        }

        function getCurrentProjectId() {
            const config = window.PROJECT_MAIN_CONFIG || {};
            return config.projectId
                || config.paramProjId
                || new URLSearchParams(window.location.search).get('projId')
                || '';
        }



        function getProjectPlanGuideStorageKey() {
            return 'moyo.project.plan.expanded.' + (getCurrentProjectId() || 'default');
        }

        function parseProjectPlanDate(value) {
            if (!value) return null;
            const text = String(value).trim();
            const match = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
            if (!match) return null;
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            return Number.isNaN(date.getTime()) ? null : date;
        }

        function formatProjectPlanDate(value) {
            const date = parseProjectPlanDate(value);
            if (!date) return '';
            return date.getFullYear() + '.'
                + String(date.getMonth() + 1).padStart(2, '0') + '.'
                + String(date.getDate()).padStart(2, '0');
        }

        function readProjectPlanGuidePreference() {
            try {
                const value = localStorage.getItem(getProjectPlanGuideStorageKey());
                return value === 'true' ? true : value === 'false' ? false : null;
            } catch (e) {
                return null;
            }
        }

        function setProjectPlanGuideExpanded(expanded, persist) {
            const card = document.getElementById('projectTimelineCard');
            const toggle = document.getElementById('projectTimelineToggle');
            if (!card || !toggle) return;

            card.classList.toggle('is-collapsed', !expanded);
            card.classList.remove('is-loading');
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            toggle.setAttribute('aria-label', expanded ? '프로젝트 계획 접기' : '프로젝트 계획 펼치기');
            syncProjectPlanActionLabels();

            if (persist) {
                try {
                    localStorage.setItem(getProjectPlanGuideStorageKey(), String(expanded));
                } catch (e) {
                    // 저장이 불가능한 환경에서는 현재 화면 상태만 유지합니다.
                }
            }
        }

        function toggleProjectPlanGuide() {
            const toggle = document.getElementById('projectTimelineToggle');
            if (!toggle) return;
            setProjectPlanGuideExpanded(toggle.getAttribute('aria-expanded') !== 'true', true);
        }



