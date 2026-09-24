(function(window, document) {
    'use strict';

    const cfg = window.PROJECT_SETTINGS_CONFIG || {};
    const $ = (selector, root) => (root || document).querySelector(selector);
    const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

    let initialSnapshot = '';
    let activeMemberRow = null;
    let assignableMembers = [];
    let confirmResolver = null;


    // MOYO project period picker — same interaction language as project creation.
    let activeProjectDateInput = null;
    let activeProjectDateView = null;
    let projectDatePickerMenu = null;
    const PROJECT_DATE_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

    function formatProjectDate(date) {
        return date.getFullYear() + '-'
            + String(date.getMonth() + 1).padStart(2, '0') + '-'
            + String(date.getDate()).padStart(2, '0');
    }

    function parseProjectDate(raw) {
        const match = String(raw || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return { year, month, day, date, value: formatProjectDate(date) };
    }

    function formatProjectDateDisplay(raw) {
        const parsed = parseProjectDate(raw);
        if (!parsed) return '';
        const weekday = PROJECT_DATE_WEEKDAYS[parsed.date.getDay()];
        return parsed.year + '. '
            + String(parsed.month).padStart(2, '0') + '. '
            + String(parsed.day).padStart(2, '0') + ' (' + weekday + ')';
    }

    function getProjectDateDisplay(kind) {
        return $('[data-project-date-picker="' + kind + '"]');
    }

    function getProjectDatePickerState(input) {
        const kind = input?.dataset?.projectDatePicker || 'start';
        const raw = getPeriodInputs()[kind]?.value || '';
        const parsed = parseProjectDate(raw) || parseProjectDate(formatProjectDate(new Date()));
        return { year: parsed.year, month: parsed.month };
    }

    function getPeriodInputs() {
        return {
            start: $('[data-project-period-start]'),
            end: $('[data-project-period-end]')
        };
    }

    function setProjectDateDisplayText(control, raw, placeholder) {
        if (!control) return;
        const valueEl = control.querySelector('.project-date-value');
        if (!valueEl) return;
        const formatted = formatProjectDateDisplay(raw || '');
        valueEl.textContent = formatted || placeholder;
        control.classList.toggle('is-empty', !formatted);
    }

    function syncProjectDateDisplays() {
        const period = getPeriodInputs();
        setProjectDateDisplayText(getProjectDateDisplay('start'), period.start?.value || '', '시작일 선택');
        setProjectDateDisplayText(getProjectDateDisplay('end'), period.end?.value || '', '종료일 선택');
    }

    function rawInputForDisplay(input) {
        const kind = input?.dataset?.projectDatePicker;
        return kind ? getPeriodInputs()[kind] : null;
    }

    function isProjectDateDisabled(input, value) {
        if (!input || !value) return false;
        const period = getPeriodInputs();
        const kind = input.dataset.projectDatePicker;
        if (kind === 'end' && period.start && period.start.value) return value < period.start.value;
        if (kind === 'start' && period.end && period.end.value) return value > period.end.value;
        return false;
    }

    function ensureProjectDatePicker() {
        if (projectDatePickerMenu) return projectDatePickerMenu;
        projectDatePickerMenu = document.createElement('div');
        projectDatePickerMenu.className = 'project-date-picker-menu';
        projectDatePickerMenu.hidden = true;
        projectDatePickerMenu.setAttribute('role', 'dialog');
        projectDatePickerMenu.setAttribute('aria-label', '프로젝트 기간 날짜 선택');
        projectDatePickerMenu.addEventListener('click', event => {
            event.stopPropagation();
            if (!activeProjectDateInput) return;
            const nav = event.target.closest('[data-project-date-nav]');
            const day = event.target.closest('[data-project-date-value]');
            const today = event.target.closest('[data-project-date-action="today"]');
            if (nav) {
                const delta = Number(nav.dataset.projectDateNav) || 0;
                const base = new Date(activeProjectDateView.year, activeProjectDateView.month - 1 + delta, 1);
                activeProjectDateView = { year: base.getFullYear(), month: base.getMonth() + 1 };
                renderProjectDatePicker();
                positionProjectDatePicker(activeProjectDateInput);
                return;
            }
            if (today) {
                const todayValue = formatProjectDate(new Date());
                if (!isProjectDateDisabled(activeProjectDateInput, todayValue)) {
                    setProjectDateValue(activeProjectDateInput, todayValue);
                    movePeriodPickerForwardOrClose();
                }
                return;
            }
            if (day && !day.disabled) {
                setProjectDateValue(activeProjectDateInput, day.dataset.projectDateValue);
                movePeriodPickerForwardOrClose();
            }
        });
        document.body.appendChild(projectDatePickerMenu);
        return projectDatePickerMenu;
    }

    function movePeriodPickerForwardOrClose() {
        const period = getPeriodInputs();
        if (activeProjectDateInput?.dataset?.projectDatePicker === 'start' && period.end && !period.end.value) {
            const endDisplay = getProjectDateDisplay('end');
            if (endDisplay) {
                activeProjectDateInput = endDisplay;
                activeProjectDateView = getProjectDatePickerState(endDisplay);
                renderProjectDatePicker();
                positionProjectDatePicker(endDisplay);
                return;
            }
        }
        closeProjectDatePicker();
    }

    function renderProjectDatePicker() {
        const menu = ensureProjectDatePicker();
        const view = activeProjectDateView || getProjectDatePickerState(activeProjectDateInput);
        const period = getPeriodInputs();
        const startValue = parseProjectDate(period.start?.value || '')?.value || '';
        const endValue = parseProjectDate(period.end?.value || '')?.value || '';
        const activeKind = activeProjectDateInput?.dataset?.projectDatePicker || '';
        const activeRaw = activeKind ? parseProjectDate(period[activeKind]?.value || '')?.value || '' : '';
        const todayValue = formatProjectDate(new Date());
        const first = new Date(view.year, view.month - 1, 1);
        const start = new Date(view.year, view.month - 1, 1 - first.getDay());
        const days = [];
        for (let index = 0; index < 42; index += 1) {
            const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
            const value = formatProjectDate(current);
            const classes = ['project-date-picker-day'];
            const disabled = isProjectDateDisabled(activeProjectDateInput, value);
            const inRange = startValue && endValue && value > startValue && value < endValue;
            const rangeStart = startValue && value === startValue;
            const rangeEnd = endValue && value === endValue;
            if (current.getMonth() !== view.month - 1) classes.push('is-muted');
            if (value === todayValue) classes.push('is-today');
            if (inRange) classes.push('is-in-range');
            if (rangeStart) classes.push('is-range-start');
            if (rangeEnd) classes.push('is-range-end');
            if (activeRaw && value === activeRaw) classes.push('is-selected');
            if (disabled) classes.push('is-disabled');
            const weekday = PROJECT_DATE_WEEKDAYS[current.getDay()];
            days.push('<button type="button" class="' + classes.join(' ') + '" data-project-date-value="' + value + '"'
                + ' aria-label="' + current.getFullYear() + '년 ' + (current.getMonth() + 1) + '월 ' + current.getDate() + '일 ' + weekday + '요일"'
                + (disabled ? ' disabled aria-disabled="true"' : '') + '>' + current.getDate() + '</button>');
        }
        menu.innerHTML = ''
            + '<div class="project-date-picker-head"><div class="project-date-picker-title">' + view.year + '년 ' + view.month + '월</div>'
            + '<div class="project-date-picker-nav"><button type="button" data-project-date-nav="-1" aria-label="이전 달">‹</button>'
            + '<button type="button" data-project-date-nav="1" aria-label="다음 달">›</button></div></div>'
            + '<div class="project-date-picker-weekdays">' + PROJECT_DATE_WEEKDAYS.map((day, index) => '<span class="weekday-' + index + '">' + day + '</span>').join('') + '</div>'
            + '<div class="project-date-picker-days">' + days.join('') + '</div>'
            + '<div class="project-date-picker-foot"><button type="button" class="project-date-picker-today" data-project-date-action="today">오늘</button></div>';
    }

    function positionProjectDatePicker(input) {
        const menu = ensureProjectDatePicker();
        menu.hidden = false;
        const rect = input.closest('.project-settings-date-control')?.getBoundingClientRect() || input.getBoundingClientRect();
        const width = menu.offsetWidth || 252;
        const height = menu.offsetHeight || 300;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
        const belowTop = rect.bottom + 8;
        const aboveTop = rect.top - height - 8;
        const top = belowTop + height <= window.innerHeight - 10 ? belowTop : Math.max(10, aboveTop);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    function openProjectDatePicker(input) {
        if (!input || input.disabled) return;
        activeProjectDateInput = input;
        activeProjectDateView = getProjectDatePickerState(input);
        renderProjectDatePicker();
        positionProjectDatePicker(input);
    }

    function closeProjectDatePicker() {
        if (projectDatePickerMenu) projectDatePickerMenu.hidden = true;
        activeProjectDateInput = null;
    }

    function setProjectDateValue(input, value) {
        const parsed = parseProjectDate(value);
        const rawInput = rawInputForDisplay(input);
        if (!input || !rawInput || !parsed || isProjectDateDisabled(input, parsed.value)) return;
        rawInput.value = parsed.value;
        setProjectDateDisplayText(input, parsed.value, input.dataset.projectDatePicker === 'start' ? '시작일 선택' : '종료일 선택');
        rawInput.dispatchEvent(new Event('input', { bubbles: true }));
        rawInput.dispatchEvent(new Event('change', { bubbles: true }));
        renderProjectDatePicker();
    }

    function setupProjectDatePickers() {
        syncProjectDateDisplays();
        $$('[data-project-date-picker]').forEach(input => {
            input.addEventListener('click', event => {
                event.stopPropagation();
                openProjectDatePicker(input);
            });
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openProjectDatePicker(input);
                } else if (event.key === 'Escape') closeProjectDatePicker();
            });
        });
        const period = getPeriodInputs();
        [period.start, period.end].filter(Boolean).forEach(input => input.addEventListener('change', syncProjectDateDisplays));
        document.addEventListener('click', event => {
            if (projectDatePickerMenu && !projectDatePickerMenu.hidden
                && !event.target.closest('.project-date-picker-menu')
                && !event.target.closest('[data-project-date-picker]')
                && !event.target.closest('.project-settings-date-control')) closeProjectDatePicker();
        });
        window.addEventListener('resize', closeProjectDatePicker);
        window.addEventListener('scroll', closeProjectDatePicker, true);
    }

    function api(path, options) {
        return fetch((cfg.contextPath || '') + path, Object.assign({ credentials: 'same-origin' }, options || {}));
    }

    function postForm(path, params) {
        const body = new URLSearchParams();
        Object.entries(params || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) value.forEach(item => body.append(key, String(item)));
            else if (value !== undefined && value !== null) body.append(key, String(value));
        });
        return api(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body
        }).then(r => r.text()).then(text => text.trim());
    }

    function value(source, ...keys) {
        for (const key of keys) if (source && source[key] != null) return source[key];
        return '';
    }

    function projectForm() { return $('#projectInfoForm'); }

    function collectLinks() {
        return $$('.project-settings-link-row').map(row => ({
            linkName: ($('[data-link-name]', row)?.value || '').trim().replace(/\s+/g, ' '),
            linkUrl: ($('[data-link-url]', row)?.value || '').trim()
        })).filter(link => link.linkName || link.linkUrl);
    }

    function validateLinks(links) {
        if ($$('.project-settings-link-row').length > 5 || links.length > 5) {
            alert('외부 링크는 최대 5개까지 등록할 수 있습니다.');
            return false;
        }
        const seen = new Set();
        for (const link of links) {
            if (!link.linkName || !link.linkUrl) {
                alert('링크 이름과 주소를 모두 입력해 주세요.');
                return false;
            }
            try {
                const parsed = new URL(link.linkUrl);
                if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) throw new Error();
                link.linkUrl = parsed.href;
                const key = parsed.href.toLowerCase();
                if (seen.has(key)) {
                    alert('같은 외부 링크 주소는 중복해서 등록할 수 없습니다.');
                    return false;
                }
                seen.add(key);
            } catch (e) {
                alert('외부 링크는 올바른 http:// 또는 https:// 주소를 입력해 주세요.');
                return false;
            }
        }
        return true;
    }

    function buildPayload() {
        const common = window.MoyoProjectForm ? window.MoyoProjectForm.getValue(projectForm()) : {};
        return {
            projId: Number(cfg.projId),
            wsId: cfg.wsId ? Number(cfg.wsId) : null,
            projName: String(common.projName || '').trim(),
            projCategory: common.projType || null,
            projType: common.projType || null,
            projIcon: common.projIcon || null,
            projDesc: String(common.projDesc || '').trim(),
            accessScope: cfg.groupProject ? (common.accessScope || 'PARTICIPANTS') : 'OWNER_ONLY',
            periodEnabledYn: common.periodEnabledYn === 'Y' ? 'Y' : 'N',
            startDate: common.periodEnabledYn === 'Y' ? (common.startDate || null) : null,
            endDate: common.periodEnabledYn === 'Y' ? (common.endDate || null) : null,
            links: collectLinks()
        };
    }

    function snapshot() {
        try { return JSON.stringify(buildPayload()); } catch (e) { return ''; }
    }

    function refreshDirty() {
        const save = $('[data-save-project]');
        const state = $('[data-project-save-state]');
        if (!save) return;
        const dirty = snapshot() !== initialSnapshot;
        save.disabled = !dirty || cfg.readOnly || !cfg.canManage;
        if (state) state.textContent = dirty ? '저장하지 않은 변경사항이 있습니다.' : '변경사항이 없습니다.';
    }

    function setupProjectForm() {
        const form = projectForm();
        if (!form) return;
        if (window.MoyoProjectForm) {
            // 서버에서 정규화한 생성 당시 기간값을 먼저 주입한 뒤 공통 폼을 초기화한다.
            // input[type=date]가 Timestamp/ISO 문자열을 조용히 비우는 회귀를 방지한다.
            window.MoyoProjectForm.setValue(form, {
                startDate: cfg.startDate || '',
                endDate: cfg.endDate || '',
                periodEnabledYn: cfg.periodEnabledYn === 'Y' ? 'Y' : 'N'
            });
            window.MoyoProjectForm.initialize(form, { readOnly: cfg.readOnly || !cfg.canManage, preserveCustomIconOnTypeChange: false });
            if (cfg.readOnly || !cfg.canManage) window.MoyoProjectForm.setReadOnly(form, true);
        }
        initialSnapshot = snapshot();
        form.addEventListener('moyo:project-form-change', refreshDirty);
        form.addEventListener('input', refreshDirty);
        form.addEventListener('change', refreshDirty);
        setupLinks();

        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!cfg.canManage || cfg.readOnly) return;
            const validation = window.MoyoProjectForm ? window.MoyoProjectForm.validate(form) : { valid: true, errors: [] };
            if (!validation.valid) return alert(validation.errors?.[0]?.message || '프로젝트 정보를 확인해 주세요.');
            const payload = buildPayload();
            if (!validateLinks(payload.links)) return;
            const save = $('[data-save-project]');
            const state = $('[data-project-save-state]');
            save.disabled = true; save.textContent = '저장 중...';
            if (state) state.textContent = '변경사항을 저장하고 있습니다.';
            try {
                const response = await api('/project/api/update-project', {
                    method: 'POST', headers: { 'Content-Type': 'application/json;charset=UTF-8' }, body: JSON.stringify(payload)
                });
                const result = (await response.text()).trim();
                if (result !== 'SUCCESS') throw new Error(projectResultMessage(result));
                initialSnapshot = snapshot();
                if (state) state.textContent = '저장되었습니다.';

                const mainUrl = new URL((cfg.contextPath || '') + '/project/main', window.location.origin);
                mainUrl.searchParams.set('projId', String(cfg.projId));
                if (cfg.groupProject && cfg.wsId != null && String(cfg.wsId).trim() !== '') {
                    mainUrl.searchParams.set('wsId', String(cfg.wsId));
                }
                window.location.assign(mainUrl.pathname + mainUrl.search);
                return;
            } catch (error) {
                alert(error.message || '프로젝트 설정 저장에 실패했습니다.');
                if (state) state.textContent = '저장에 실패했습니다.';
            } finally {
                save.textContent = '변경사항 저장';
                refreshDirty();
            }
        });
    }

    function setupLinks() {
        $('[data-add-project-link]')?.addEventListener('click', () => {
            if (cfg.readOnly || !cfg.canManage) return;
            const list = $('[data-project-link-list]');
            if ($$('.project-settings-link-row', list).length >= 5) return alert('외부 링크는 최대 5개까지 등록할 수 있습니다.');
            const row = document.createElement('div');
            row.className = 'project-settings-link-row';
            row.innerHTML = '<input type="text" data-link-name maxlength="50" placeholder="링크 이름">'
                + '<input type="url" data-link-url maxlength="500" placeholder="https://example.com">'
                + '<button type="button" data-remove-project-link>×</button>';
            list.appendChild(row); refreshDirty();
        });
        document.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-project-link]');
            if (!button || cfg.readOnly || !cfg.canManage) return;
            button.closest('.project-settings-link-row')?.remove();
            refreshDirty();
        });
    }

    function projectResultMessage(code) {
        const value = String(code || '').trim();
        const map = {
            LOGIN_FAIL: '로그인이 만료되었습니다.', NO_PERMISSION: '프로젝트 설정 권한이 없습니다.',
            FAIL: '프로젝트 설정을 저장하지 못했습니다.', PROJECT_UNAVAILABLE: '현재 프로젝트 상태에서는 변경할 수 없습니다.'
        };
        if (map[value]) return map[value];
        // 서버 오류 페이지 전체 HTML을 alert에 그대로 노출하지 않는다.
        if (/^<!doctype\s+html/i.test(value) || /^<html[\s>]/i.test(value) || value.includes('<body')) {
            return '프로젝트 설정 저장 중 서버 오류가 발생했습니다. 서버 로그를 확인해 주세요.';
        }
        return value ? '요청을 처리하지 못했습니다. (' + value + ')' : '요청을 처리하지 못했습니다.';
    }

    function setupMemberList() {
        const search = $('[data-project-member-search]');
        const filters = $$('.project-settings-member-filters button');
        let role = 'ALL';
        const apply = () => {
            const keyword = (search?.value || '').trim().toLowerCase();
            $$('[data-project-member-row]').forEach(row => {
                const current = row.dataset.memberRole || 'MEMBER';
                const normalized = current === 'LEADER' ? 'ADMIN' : current;
                const matchRole = role === 'ALL' || normalized === role;
                const matchText = !keyword || (row.dataset.search || '').includes(keyword);
                row.classList.toggle('is-hidden', !(matchRole && matchText));
            });
        };
        search?.addEventListener('input', apply);
        filters.forEach(button => button.addEventListener('click', () => {
            role = button.dataset.role || 'ALL';
            filters.forEach(item => item.classList.toggle('is-active', item === button));
            apply();
        }));

        document.addEventListener('click', event => {
            const edit = event.target.closest('[data-edit-project-member]');
            if (edit) {
                event.preventDefault();
                event.stopPropagation();
                openMemberSheet(edit.closest('[data-project-member-row]'));
                return;
            }

            const row = event.target.closest('[data-project-member-row]');
            if (!row) return;
            const userId = Number(row.dataset.userId);
            if (userId && typeof window.openProjectMemberProfile === 'function') {
                window.openProjectMemberProfile(userId);
            }
        });
    }

    async function loadProjectMemberProfile(userId) {
        const response = await api('/project/api/member-profile?projId=' + encodeURIComponent(cfg.projId) + '&userId=' + encodeURIComponent(userId));
        if (!response.ok) throw new Error('멤버 정보를 불러오지 못했습니다.');
        return response.json();
    }

    async function openMemberSheet(row) {
        if (!row) return;
        activeMemberRow = row;
        const sheet = $('[data-project-member-sheet]');
        sheet.hidden = false; document.body.style.overflow = 'hidden';
        const name = $('.project-settings-person-copy strong', row)?.textContent?.trim() || '멤버 관리';
        $('[data-project-sheet-name]').textContent = name;
        const role = row.dataset.memberRole || 'MEMBER';
        const roleSelect = $('[data-project-sheet-role]');
        const position = $('[data-project-sheet-position]');
        const wsPosition = $('[data-project-sheet-workspace-position]');
        const hint = $('[data-project-sheet-hint]');
        const save = $('[data-project-sheet-save]');
        const remove = $('[data-project-sheet-remove]');
        roleSelect.value = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
        roleSelect.disabled = role === 'LEADER' || Number(row.dataset.userId) === cfg.currentUserId || cfg.readOnly || !cfg.canManage;
        position.disabled = role === 'LEADER' ? false : cfg.readOnly || !cfg.canManage;
        save.disabled = cfg.readOnly || !cfg.canManage;
        remove.hidden = role === 'LEADER' || Number(row.dataset.userId) === cfg.currentUserId || cfg.readOnly || !cfg.canManage;
        hint.textContent = role === 'LEADER' ? '팀장 권한은 관리 탭의 팀장 위임으로 변경합니다.' : '';
        position.value = ''; wsPosition.value = '';
        try {
            const profile = await loadProjectMemberProfile(Number(row.dataset.userId));
            row.__projectProfile = profile;
            position.value = value(profile, 'PROJ_POSITION', 'projectPosition', 'projPosition');
            wsPosition.value = value(profile, 'WS_POSITION', 'workspacePosition', 'positionName');
        } catch (error) { hint.textContent = error.message; }
    }

    function closeMemberSheet() {
        $('[data-project-member-sheet]').hidden = true;
        activeMemberRow = null; document.body.style.overflow = '';
    }

    function setupMemberSheet() {
        $$('[data-close-project-member-sheet]').forEach(button => button.addEventListener('click', closeMemberSheet));
        $('[data-project-sheet-save]')?.addEventListener('click', async () => {
            if (!activeMemberRow || cfg.readOnly || !cfg.canManage) return;
            const userId = Number(activeMemberRow.dataset.userId);
            const currentRole = activeMemberRow.dataset.memberRole || 'MEMBER';
            const change = { userId, position: ($('[data-project-sheet-position]')?.value || '').trim() };
            if (currentRole !== 'LEADER' && userId !== cfg.currentUserId) change.role = $('[data-project-sheet-role]').value;
            const result = await postForm('/project/api/update-members', { projId: cfg.projId, changes: JSON.stringify([change]) });
            if (result !== 'success') return alert(projectMemberMessage(result));
            window.location.reload();
        });
        $('[data-project-sheet-remove]')?.addEventListener('click', async () => {
            if (!activeMemberRow || cfg.readOnly || !cfg.canManage) return;
            const name = $('.project-settings-person-copy strong', activeMemberRow)?.textContent?.trim() || '이 멤버';
            const ok = await confirmDialog('프로젝트에서 제외', name + '님을 프로젝트에서 제외하시겠어요? 담당 중인 업무는 팀장 기준으로 정리됩니다.');
            if (!ok) return;
            const result = await postForm('/project/api/remove-members', { projId: cfg.projId, userIds: activeMemberRow.dataset.userId });
            if (result !== 'success') return alert(projectMemberMessage(result));
            window.location.reload();
        });
    }

    function projectMemberMessage(code) {
        const map = {
            forbidden: '멤버 관리 권한이 없습니다.', leader_role_locked: '팀장 권한은 직접 변경할 수 없습니다.',
            self_role_locked: '내 권한은 직접 변경할 수 없습니다.', leader_protected: '팀장은 프로젝트에서 제외할 수 없습니다.',
            project_unavailable: '현재 프로젝트 상태에서는 멤버를 변경할 수 없습니다.', NO_PERMISSION: '멤버 관리 권한이 없습니다.',
            PROJECT_UNAVAILABLE: '현재 프로젝트 상태에서는 변경할 수 없습니다.'
        };
        return map[code] || '멤버 변경에 실패했습니다. (' + code + ')';
    }

    async function openAddMembers() {
        if (!cfg.groupProject || cfg.readOnly || !cfg.canManage) return;
        const modal = $('[data-add-members-modal]');
        modal.hidden = false; document.body.style.overflow = 'hidden';
        const list = $('[data-add-member-list]');
        list.innerHTML = '<div style="padding:18px;color:#8a95a7;font-size:12px;">그룹 멤버를 불러오는 중입니다.</div>';
        try {
            const response = await api('/project/api/assignable-members?wsId=' + encodeURIComponent(cfg.wsId) + '&projId=' + encodeURIComponent(cfg.projId));
            assignableMembers = await response.json();
            renderAssignableMembers();
        } catch (error) {
            list.innerHTML = '<div style="padding:18px;color:#b95454;font-size:12px;">멤버를 불러오지 못했습니다.</div>';
        }
    }

    function renderAssignableMembers() {
        const list = $('[data-add-member-list]');
        const keyword = ($('[data-add-member-search]')?.value || '').trim().toLowerCase();
        const filtered = assignableMembers.filter(member => {
            const haystack = [value(member,'USER_NAME','userName'), value(member,'EMAIL','email'), value(member,'WS_POSITION','wsPosition')].join(' ').toLowerCase();
            return !keyword || haystack.includes(keyword);
        });
        if (!filtered.length) {
            list.innerHTML = '<div style="padding:18px;color:#8a95a7;font-size:12px;">추가할 수 있는 그룹 멤버가 없습니다.</div>';
            return;
        }
        list.innerHTML = filtered.map(member => {
            const id = Number(value(member,'USER_ID','userId'));
            const name = String(value(member,'USER_NAME','userName') || '멤버');
            const position = String(value(member,'WS_POSITION','wsPosition') || value(member,'EMAIL','email') || '');
            return '<label class="project-settings-add-member-row" data-candidate-id="' + id + '">'
                + '<input type="checkbox" data-add-member-checkbox value="' + id + '">'
                + '<div><strong>' + escapeHtml(name) + '</strong><small>' + escapeHtml(position) + '</small></div>'
                + '<span class="project-settings-role-badge">멤버</span></label>';
        }).join('');
    }

    function escapeHtml(text) {
        return String(text || '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    }

    function closeAddMembers() {
        $('[data-add-members-modal]').hidden = true; document.body.style.overflow = '';
    }

    function setupAddMembers() {
        $('[data-open-add-members]')?.addEventListener('click', openAddMembers);
        $$('[data-close-add-members]').forEach(button => button.addEventListener('click', closeAddMembers));
        $('[data-add-member-search]')?.addEventListener('input', renderAssignableMembers);
        $('[data-add-selected-members]')?.addEventListener('click', async () => {
            const ids = $$('[data-add-member-checkbox]:checked').map(input => Number(input.value)).filter(Boolean);
            if (!ids.length) return alert('추가할 멤버를 선택해 주세요.');
            const result = await postForm('/project/api/add-members', { projId: cfg.projId, userIds: ids });
            if (result !== 'SUCCESS' && result !== 'ALREADY_EXISTS') return alert(projectResultMessage(result));

            const changes = ids.map(id => {
                const member = assignableMembers.find(item => Number(value(item,'USER_ID','userId')) === id) || {};
                return { userId: id, position: String(value(member,'WS_POSITION','wsPosition') || '').trim() };
            });
            if (changes.length) await postForm('/project/api/update-members', { projId: cfg.projId, changes: JSON.stringify(changes) });
            window.location.reload();
        });
    }

    function confirmDialog(title, message, placeholder) {
        const modal = $('[data-project-confirm]');
        if (!modal) return Promise.resolve(window.confirm(message));
        $('[data-project-confirm-title]').textContent = title;
        $('[data-project-confirm-message]').textContent = message;
        const input = $('[data-project-confirm-input]');
        if (placeholder) { input.hidden = false; input.value = ''; input.placeholder = placeholder; }
        else { input.hidden = true; input.value = ''; }
        modal.hidden = false; document.body.style.overflow = 'hidden';
        return new Promise(resolve => confirmResolver = { resolve, inputRequired: Boolean(placeholder) });
    }

    function closeConfirm(ok) {
        const input = $('[data-project-confirm-input]');
        if (ok && confirmResolver?.inputRequired && !(input?.value || '').trim()) return;
        $('[data-project-confirm]').hidden = true; document.body.style.overflow = '';
        const resolver = confirmResolver; confirmResolver = null;
        if (resolver) resolver.resolve(ok ? (resolver.inputRequired ? input.value.trim() : true) : false);
    }

    function setupConfirm() {
        $$('[data-project-confirm-cancel]').forEach(button => button.addEventListener('click', () => closeConfirm(false)));
        $('[data-project-confirm-ok]')?.addEventListener('click', () => closeConfirm(true));
    }

    function setupManagement() {
        $('[data-request-project-delete]')?.addEventListener('click', async () => {
            const typed = await confirmDialog('프로젝트 삭제', '삭제를 진행하려면 프로젝트 이름을 정확히 입력해 주세요. 그룹 프로젝트에서 팀장만 남아 있으면 즉시 삭제되며, 그 외에는 30일간 삭제 예정 상태로 전환됩니다.', cfg.projectName);
            if (!typed) return;
            if (typed !== cfg.projectName) return alert('프로젝트 이름이 일치하지 않습니다.');
            const result = await postForm('/project/api/delete-policy', { projId: cfg.projId });
            if (result === 'DELETED') {
                const target = cfg.groupProject && cfg.wsId ? '/project/list?wsId=' + encodeURIComponent(cfg.wsId) : '/project/manage';
                window.location.href = (cfg.contextPath || '') + target;
                return;
            }
            if (result === 'PENDING' || result === 'ALREADY_PENDING') return window.location.reload();
            alert(projectResultMessage(result));
        });

        $('[data-cancel-project-delete]')?.addEventListener('click', async () => {
            const ok = await confirmDialog('삭제 신청 취소', '프로젝트 삭제 신청을 취소하시겠어요?');
            if (!ok) return;
            const result = await postForm('/project/api/cancel-delete', { projId: cfg.projId });
            if (result !== 'SUCCESS') return alert(projectResultMessage(result));
            window.location.reload();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupProjectForm();
        setupProjectDatePickers();
        setupConfirm();
        setupManagement();
    });
})(window, document);
