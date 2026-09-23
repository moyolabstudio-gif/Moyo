(function () {
    'use strict';

    const PROJECT_LINK_MAX = 5;

    function normalizeProjectLinkUrl(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        return 'https://' + raw;
    }

    function clearProjectLinkError() {
        const error = document.getElementById('projectCreateLinkError');
        if (!error) return;
        error.hidden = true;
        error.textContent = '';
    }

    function updateProjectLinkUi() {
        const list = document.getElementById('projectCreateLinkList');
        if (!list) return;
        const count = list.querySelectorAll('.project-link-row').length;
        const countEl = document.getElementById('projectCreateLinkCount');
        const emptyEl = document.getElementById('projectCreateLinkEmpty');
        const addButton = document.getElementById('projectCreateLinkAdd');
        if (countEl) countEl.textContent = count + ' / ' + PROJECT_LINK_MAX;
        if (emptyEl) emptyEl.hidden = count > 0;
        if (addButton) {
            addButton.disabled = count >= PROJECT_LINK_MAX;
            addButton.setAttribute('aria-disabled', count >= PROJECT_LINK_MAX ? 'true' : 'false');
        }
    }

    window.addProjectCreateLink = function(name, url) {
        const list = document.getElementById('projectCreateLinkList');
        if (!list) return;
        const count = list.querySelectorAll('.project-link-row').length;
        if (count >= PROJECT_LINK_MAX) return;

        const row = document.createElement('div');
        row.className = 'project-link-row moyo-create-link-row';
        row.innerHTML =
            '<input type="text" class="project-link-name moyo-create-control moyo-create-link-name" maxlength="50" placeholder="링크 이름" aria-label="링크 이름">' +
            '<input type="url" class="project-link-url moyo-create-control moyo-create-link-url" maxlength="500" placeholder="https://..." aria-label="링크 주소">' +
            '<button type="button" class="project-link-remove-btn moyo-create-link-remove" onclick="removeProjectCreateLink(this)" aria-label="링크 삭제"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
        row.querySelector('.project-link-name').value = name || '';
        row.querySelector('.project-link-url').value = normalizeProjectLinkUrl(url || '');
        row.querySelector('.project-link-url').addEventListener('blur', function() {
            this.value = normalizeProjectLinkUrl(this.value);
            clearProjectLinkError();
        });
        list.appendChild(row);
        updateProjectLinkUi();
        clearProjectLinkError();
        if (!name && !url) row.querySelector('.project-link-name').focus();
    };

    window.removeProjectCreateLink = function(button) {
        const row = button.closest('.project-link-row');
        if (row) row.remove();
        updateProjectLinkUi();
        clearProjectLinkError();
    };

    function validateProjectLinks() {
        const rows = document.querySelectorAll('#projectCreateLinkList .project-link-row');
        const error = document.getElementById('projectCreateLinkError');
        for (const row of rows) {
            const urlInput = row.querySelector('.project-link-url');
            const nameInput = row.querySelector('.project-link-name');
            const name = nameInput.value.trim();
            const normalized = normalizeProjectLinkUrl(urlInput.value);
            urlInput.value = normalized;
            if (!name && !normalized) continue;
            try {
                const parsed = new URL(normalized);
                if (!/^https?:$/.test(parsed.protocol)) throw new Error('invalid');
            } catch (e) {
                if (error) {
                    error.textContent = '링크 주소를 확인해주세요.';
                    error.hidden = false;
                }
                urlInput.focus();
                return false;
            }
        }
        clearProjectLinkError();
        return true;
    }


    const page = document.querySelector('.project-create-page');
    if (!page) return;

    updateProjectLinkUi();

    const contextPath = page.dataset.contextPath || '';
    const initialWsId = String(page.dataset.wsId || '').trim();
    const initialScope = String(page.dataset.initialScope || 'PERSONAL').toUpperCase();
    const personalEntry = String(page.dataset.personalEntry || '') === 'true';
    const groupEntry = String(page.dataset.groupEntry || '') === 'true';
    const canCreateGroupProject = String(page.dataset.canCreateGroupProject || '') === 'true';
    const currentUserId = String(page.dataset.currentUserId || '');
    const currentUserName = String(page.dataset.currentUserName || '').trim();
    const currentUserProfileImage = resolveProfileImageUrl(page.dataset.currentUserProfileImage || '');

    const stepLabel = document.getElementById('createStepLabel');
    const createTitle = document.getElementById('createTitle');
    const createSubTitle = document.getElementById('createSubTitle');
    const stepBasic = document.getElementById('stepBasic');
    const stepMembers = document.getElementById('stepMembers');
    const memberList = document.getElementById('memberList');
    const memberSearchInput = document.getElementById('memberSearchInput');
    const memberSelectedFilter = document.getElementById('memberSelectedFilter');
    const memberSelectedCount = document.getElementById('memberSelectedCount');
    const memberFilterEmpty = document.getElementById('memberFilterEmpty');
    const nextButton = document.getElementById('btnNextStep');
    const prevButton = document.getElementById('btnPrevStep');
    const submitButton = document.getElementById('btnSubmit');
    const topCancelButton = document.getElementById('btnCancelTop');
    const commonProjectForm = document.querySelector('[data-project-form-common]');
    const projectNameCount = document.getElementById('projectNameCount');

    let currentStep = 1;
    let loadedWorkspaceId = '';
    let activeProjectDateInput = null;
    let activeProjectDateView = null;
    let projectDatePickerMenu = null;
    let showSelectedMembersOnly = false;
    const PROJECT_DATE_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

    if (groupEntry && !canCreateGroupProject) return;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function firstValue(object, keys) {
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (object && object[key] !== undefined && object[key] !== null && String(object[key]).trim() !== '') {
                return object[key];
            }
        }
        return '';
    }

    function resolveProfileImageUrl(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;
        if (contextPath && (raw === contextPath || raw.indexOf(contextPath + '/') === 0)) return raw;
        if (raw.charAt(0) === '/') return contextPath + raw;
        return contextPath + '/' + raw.replace(/^\/+/, '');
    }

    function emailName(email) {
        if (!email) return '';
        return String(email).split('@')[0] || '';
    }

    function formatDate(date) {
        return date.getFullYear() + '-'
            + String(date.getMonth() + 1).padStart(2, '0') + '-'
            + String(date.getDate()).padStart(2, '0');
    }

    function setDefaultDates() {
        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + 7);

        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        startInput.value = formatDate(today);
        endInput.value = formatDate(end);
        startInput.removeAttribute('min');
        endInput.min = startInput.value;
    }

    function syncEndDate() {
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        const start = startInput ? startInput.value : '';
        if (!endInput) return;
        endInput.min = start || '';
    }

    function parseProjectDate(value) {
        const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return { year: year, month: month, day: day, value: formatDate(date) };
    }

    function getProjectDatePickerState(input) {
        const parsed = parseProjectDate(input && input.value) || parseProjectDate(formatDate(new Date()));
        return { year: parsed.year, month: parsed.month };
    }

    function ensureProjectDatePicker() {
        if (projectDatePickerMenu) return projectDatePickerMenu;
        projectDatePickerMenu = document.createElement('div');
        projectDatePickerMenu.className = 'project-date-picker-menu';
        projectDatePickerMenu.hidden = true;
        projectDatePickerMenu.addEventListener('click', function(event) {
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
                return;
            }
            if (today) {
                setProjectDateValue(activeProjectDateInput, formatDate(new Date()));
                closeProjectDatePicker();
                return;
            }
            if (day) {
                setProjectDateValue(activeProjectDateInput, day.dataset.projectDateValue);
                closeProjectDatePicker();
            }
        });
        document.body.appendChild(projectDatePickerMenu);
        return projectDatePickerMenu;
    }

    function renderProjectDatePicker() {
        const menu = ensureProjectDatePicker();
        const view = activeProjectDateView || getProjectDatePickerState(activeProjectDateInput);
        const selected = parseProjectDate(activeProjectDateInput && activeProjectDateInput.value);
        const todayValue = formatDate(new Date());
        const first = new Date(view.year, view.month - 1, 1);
        const start = new Date(view.year, view.month - 1, 1 - first.getDay());
        const days = [];
        for (let i = 0; i < 42; i += 1) {
            const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            const value = formatDate(current);
            const classes = ['project-date-picker-day'];
            const minDate = parseProjectDate(activeProjectDateInput && activeProjectDateInput.min);
            const disabled = Boolean(minDate && value < minDate.value);
            if (current.getMonth() !== view.month - 1) classes.push('is-muted');
            if (value === todayValue) classes.push('is-today');
            if (selected && value === selected.value) classes.push('is-selected');
            if (disabled) classes.push('is-disabled');
            days.push('<button type="button" class="' + classes.join(' ') + '"'
                + (disabled ? ' disabled aria-disabled="true"' : ' data-project-date-value="' + value + '"')
                + '>' + current.getDate() + '</button>');
        }
        menu.innerHTML = ''
            + '<div class="project-date-picker-head">'
            + '<div class="project-date-picker-title">' + view.year + '년 ' + view.month + '월</div>'
            + '<div class="project-date-picker-nav">'
            + '<button type="button" data-project-date-nav="-1" aria-label="이전 달">‹</button>'
            + '<button type="button" data-project-date-nav="1" aria-label="다음 달">›</button>'
            + '</div></div>'
            + '<div class="project-date-picker-weekdays">' + PROJECT_DATE_WEEKDAYS.map(function(day) { return '<span>' + day + '</span>'; }).join('') + '</div>'
            + '<div class="project-date-picker-days">' + days.join('') + '</div>'
            + '<div class="project-date-picker-foot"><button type="button" class="project-date-picker-today" data-project-date-action="today">오늘</button></div>';
    }

    function positionProjectDatePicker(input) {
        const menu = ensureProjectDatePicker();
        menu.hidden = false;
        const rect = input.getBoundingClientRect();
        const width = menu.offsetWidth || 248;
        const height = menu.offsetHeight || 300;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
        let top = rect.bottom + 6;
        if (top + height > window.innerHeight - 10) top = Math.max(10, rect.top - height - 6);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    function openProjectDatePicker(input) {
        if (!input) return;
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
        if (!input || !parsed) return;
        input.value = parsed.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function getScope() {
        return groupEntry ? 'GROUP' : 'PERSONAL';
    }

    function getSelectedWorkspaceId() {
        return groupEntry ? initialWsId : '';
    }

    function setVisible(button, visible) {
        if (!button) return;
        button.hidden = !visible;
        button.style.display = visible ? 'inline-flex' : 'none';
    }

    function setStep(step) {
        currentStep = step;
        const isStep2 = step === 2;

        stepBasic.classList.toggle('is-active', !isStep2);
        stepMembers.classList.toggle('is-active', isStep2);

        const personal = getScope() === 'PERSONAL';
        stepLabel.textContent = personal ? '1 / 1' : (isStep2 ? '2 / 2' : '1 / 2');
        createTitle.textContent = isStep2 ? '참여 멤버 설정' : (personal ? '개인 프로젝트 만들기' : '새 프로젝트 만들기');
        createSubTitle.textContent = isStep2
            ? '함께 진행할 멤버를 선택하고 프로젝트 권한과 역할을 지정합니다.'
            : (personal
                ? '함께 진행할 프로젝트를 만들어보세요.'
                : '함께 진행할 프로젝트를 만들어보세요.');

        setVisible(prevButton, isStep2);
        setVisible(nextButton, !personal && !isStep2);
        setVisible(submitButton, personal || isStep2);
    }

    function collectProjectLinks() {
        return Array.from(document.querySelectorAll('#projectCreateLinkList .project-link-row'))
            .map(function(row) {
                return {
                    linkName: row.querySelector('.project-link-name').value.trim(),
                    linkUrl: row.querySelector('.project-link-url').value.trim()
                };
            })
            .filter(function(link) {
                return link.linkName || link.linkUrl;
            });
    }

    function normalizeMemberSearchText(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    const ROLE_LABELS = { MEMBER: '멤버', ADMIN: '관리자', LEADER: '팀장' };

    function syncMemberRoleControl(select) {
        if (!select) return;
        const wrap = select.closest('[data-role-select]');
        if (!wrap) return;
        const trigger = wrap.querySelector('.member-role-trigger');
        const value = String(select.value || 'MEMBER').toUpperCase();
        if (trigger) {
            const text = trigger.querySelector('.member-role-trigger__text');
            if (text) text.textContent = ROLE_LABELS[value] || '멤버';
            trigger.disabled = !!select.disabled;
        }
        wrap.querySelectorAll('.member-role-option').forEach(function(option) {
            const selected = option.dataset.roleValue === value;
            option.classList.toggle('is-selected', selected);
            option.setAttribute('aria-selected', String(selected));
        });
    }

    function syncAllMemberRoleControls() {
        document.querySelectorAll('.member-role').forEach(syncMemberRoleControl);
    }

    let activeRoleWrap = null;
    let activeRolePortal = null;

    function removeRolePortal() {
        if (activeRolePortal && activeRolePortal.parentNode) {
            activeRolePortal.parentNode.removeChild(activeRolePortal);
        }
        activeRolePortal = null;
    }

    function closeMemberRoleMenus(exceptWrap) {
        document.querySelectorAll('[data-role-select].is-open').forEach(function(wrap) {
            if (exceptWrap && wrap === exceptWrap) return;
            wrap.classList.remove('is-open', 'opens-up');
            const trigger = wrap.querySelector('.member-role-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
        if (!exceptWrap || activeRoleWrap !== exceptWrap) {
            removeRolePortal();
            activeRoleWrap = null;
        }
    }

    function positionRolePortal() {
        if (!activeRoleWrap || !activeRolePortal) return;
        const trigger = activeRoleWrap.querySelector('.member-role-trigger');
        if (!trigger || !document.body.contains(trigger)) {
            closeMemberRoleMenus();
            return;
        }
        const rect = trigger.getBoundingClientRect();
        const gap = 6;
        const menuHeight = activeRolePortal.offsetHeight || 126;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < menuHeight + gap + 8 && rect.top > menuHeight + gap + 8;
        activeRoleWrap.classList.toggle('opens-up', openUp);
        activeRolePortal.classList.toggle('opens-up', openUp);
        activeRolePortal.style.left = Math.round(rect.left) + 'px';
        activeRolePortal.style.width = Math.round(rect.width) + 'px';
        activeRolePortal.style.top = Math.round(openUp ? rect.top - menuHeight - gap : rect.bottom + gap) + 'px';
    }

    function buildRolePortal(wrap) {
        const select = wrap.querySelector('.member-role');
        if (!select) return null;
        const current = String(select.value || 'MEMBER').toUpperCase();
        const portal = document.createElement('div');
        portal.className = 'member-role-portal';
        portal.setAttribute('role', 'listbox');

        // Portal lives under <body>, so do not rely on #stepMembers-scoped CSS.
        // Apply the essential box/position styles inline to avoid stale stylesheet cache
        // or overflow/ancestor selector issues breaking the dropdown.
        Object.assign(portal.style, {
            position: 'fixed',
            zIndex: '10020',
            boxSizing: 'border-box',
            padding: '5px',
            border: '1px solid #dce5f0',
            borderRadius: '12px',
            background: '#fff',
            boxShadow: '0 12px 28px rgba(31, 51, 82, .16)',
            overflow: 'hidden'
        });

        portal.innerHTML = ['MEMBER', 'ADMIN', 'LEADER'].map(function(value) {
            const selected = value === current;
            return '<button type="button" class="member-role-option' + (selected ? ' is-selected' : '') + '" data-role-value="' + value + '" role="option" aria-selected="' + String(selected) + '"><span>' + ROLE_LABELS[value] + '</span><i class="fa-solid fa-check" aria-hidden="true"></i></button>';
        }).join('');

        portal.querySelectorAll('.member-role-option').forEach(function(option) {
            const selected = option.classList.contains('is-selected');
            Object.assign(option.style, {
                width: '100%',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '0 10px',
                border: '0',
                borderRadius: '8px',
                background: selected ? 'linear-gradient(135deg, rgba(47,203,189,.10), rgba(78,137,245,.10), rgba(119,87,255,.10))' : 'transparent',
                color: selected ? '#2f5fb8' : '#26364d',
                fontFamily: 'inherit',
                fontSize: '11.5px',
                fontWeight: '750',
                textAlign: 'left',
                cursor: 'pointer'
            });
            const check = option.querySelector('i');
            if (check) {
                Object.assign(check.style, {
                    opacity: selected ? '1' : '0',
                    color: '#4f78dd',
                    fontSize: '10px'
                });
            }
            option.addEventListener('mouseenter', function() {
                if (!option.classList.contains('is-selected')) option.style.background = '#f1f6ff';
            });
            option.addEventListener('mouseleave', function() {
                if (!option.classList.contains('is-selected')) option.style.background = 'transparent';
            });
            option.addEventListener('focus', function() {
                if (!option.classList.contains('is-selected')) option.style.background = '#f1f6ff';
            });
            option.addEventListener('blur', function() {
                if (!option.classList.contains('is-selected')) option.style.background = 'transparent';
            });
        });

        portal.__roleWrap = wrap;
        document.body.appendChild(portal);
        return portal;
    }

    function openMemberRoleMenu(wrap) {
        if (!wrap) return;
        const select = wrap.querySelector('.member-role');
        const trigger = wrap.querySelector('.member-role-trigger');
        if (!select || !trigger || select.disabled || trigger.disabled) return;
        const alreadyOpen = wrap.classList.contains('is-open') && activeRoleWrap === wrap;
        closeMemberRoleMenus();
        if (alreadyOpen) return;

        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        syncMemberRoleControl(select);
        activeRoleWrap = wrap;
        activeRolePortal = buildRolePortal(wrap);
        positionRolePortal();
    }

    function selectMemberRole(wrap, value, focusTrigger) {
        if (!wrap) return;
        const select = wrap.querySelector('.member-role');
        if (!select) return;
        const nextValue = String(value || 'MEMBER').toUpperCase();
        if (!ROLE_LABELS[nextValue]) return;
        select.value = nextValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncMemberRoleControl(select);
        closeMemberRoleMenus();
        if (focusTrigger) {
            const trigger = wrap.querySelector('.member-role-trigger');
            if (trigger) trigger.focus();
        }
    }

    function updateMemberSelectionUI() {
        const rows = Array.from(document.querySelectorAll('.member-row'));
        const selectedCount = rows.filter(function(row) {
            const checkbox = row.querySelector('.member-check');
            return checkbox && checkbox.checked;
        }).length;
        if (memberSelectedCount) {
            const countText = memberSelectedCount.querySelector('span');
            if (countText) countText.textContent = '참여 멤버 ' + selectedCount + '명';
            else memberSelectedCount.textContent = '참여 멤버 ' + selectedCount + '명';
        }
        syncAllMemberRoleControls();
        applyMemberFilters();
    }

    function applyMemberFilters() {
        const query = normalizeMemberSearchText(memberSearchInput && memberSearchInput.value);
        const rows = Array.from(document.querySelectorAll('.member-row'));
        let visibleCount = 0;
        rows.forEach(function(row) {
            const checkbox = row.querySelector('.member-check');
            const matchesSearch = !query || normalizeMemberSearchText(row.dataset.searchText).indexOf(query) !== -1;
            const matchesSelected = !showSelectedMembersOnly || (checkbox && checkbox.checked);
            const visible = matchesSearch && matchesSelected;
            row.hidden = !visible;
            if (visible) visibleCount += 1;
        });
        if (memberFilterEmpty) memberFilterEmpty.hidden = rows.length === 0 || visibleCount > 0;
    }

    function renderMembers(members) {
        if (!Array.isArray(members) || members.length === 0) {
            memberList.innerHTML = '<div class="member-empty">참여 가능한 그룹 멤버가 없습니다.</div>';
            return;
        }

        const sorted = members.slice().sort(function (a, b) {
            const aId = String(firstValue(a, ['USER_ID', 'userId', 'user_id', 'id']));
            const bId = String(firstValue(b, ['USER_ID', 'userId', 'user_id', 'id']));
            if (aId === currentUserId) return -1;
            if (bId === currentUserId) return 1;
            return 0;
        });

        memberList.innerHTML = sorted.map(function (member, index) {
            const userId = String(firstValue(member, ['USER_ID', 'userId', 'user_id', 'id']));
            const email = String(firstValue(member, [
                'CONTACT_EMAIL', 'contactEmail', 'contact_email',
                'EMAIL', 'email', 'USER_EMAIL', 'userEmail', 'mail'
            ]));
            const isCurrent = userId === currentUserId || (!currentUserId && index === 0);
            const rawName = firstValue(member, [
                'DISPLAY_NAME', 'displayName', 'display_name',
                'MEMBER_NAME', 'memberName',
                'USER_NAME', 'userName', 'user_name', 'USERNAME', 'username',
                'NAME', 'name', 'USER_NM', 'userNm', 'NICKNAME', 'nickname'
            ]);
            const userName = String(rawName || (isCurrent ? currentUserName : '') || emailName(email) || '이름 없음');
            const initial = userName && userName !== '이름 없음' ? userName.substring(0, 1) : '멤';
            const memberProfileImagePath = resolveProfileImageUrl(firstValue(member, [
                'PROFILE_IMAGE_PATH', 'profileImagePath', 'profile_image_path',
                'MEMBER_PROFILE_IMAGE_PATH', 'memberProfileImagePath',
                'CROPPED_IMAGE_PATH', 'croppedImagePath',
                'PROFILE_IMAGE_URL', 'profileImageUrl', 'imagePath'
            ]));
            const profileImagePath = memberProfileImagePath || (isCurrent ? currentUserProfileImage : '');
            const avatarImage = profileImagePath
                ? '<img src="' + escapeHtml(profileImagePath) + '" alt="" loading="lazy" onerror="this.closest(\'.member-avatar\').classList.remove(\'has-image\'); this.remove();">'
                : '';
            const avatarClass = profileImagePath ? 'member-avatar has-image' : 'member-avatar';

            const defaultPosition = String(firstValue(member, ['PROJ_POSITION', 'projPosition', 'projectPosition']) || '');

            const searchText = normalizeMemberSearchText(userName + ' ' + email);

            return '<div class="member-row' + (isCurrent ? '' : ' is-disabled') + '" data-user-id="' + escapeHtml(userId) + '" data-search-text="' + escapeHtml(searchText) + '">'
                + '<div class="member-main">'
                + '<input class="member-check" type="checkbox" ' + (isCurrent ? 'checked' : '') + ' aria-label="' + escapeHtml(userName) + ' 참여 선택">'
                + '<div class="' + avatarClass + '"><span>' + escapeHtml(initial) + '</span>' + avatarImage + '</div>'
                + '<div class="member-info"><span class="member-name">' + escapeHtml(userName) + (isCurrent ? ' <em>나</em>' : '') + '</span>'
                + '<span class="member-email">' + escapeHtml(email) + '</span></div></div>'
                + '<label class="member-control member-control--position"><span class="member-control__label">담당</span>'
                + '<input class="member-position" type="text" maxlength="100" placeholder="예: 일정 관리" value="' + escapeHtml(defaultPosition) + '" ' + (isCurrent ? '' : 'disabled') + '></label>'
                + '<div class="member-control member-control--role"><span class="member-control__label">권한</span>'
                + '<div class="member-role-select" data-role-select>'
                + '<select class="member-role" aria-label="프로젝트 권한" ' + (isCurrent ? '' : 'disabled') + '>'
                + '<option value="MEMBER">멤버</option>'
                + '<option value="ADMIN">관리자</option>'
                + '<option value="LEADER" ' + (isCurrent ? 'selected' : '') + '>팀장</option>'
                + '</select>'
                + '<button type="button" class="member-role-trigger" aria-haspopup="listbox" aria-expanded="false" ' + (isCurrent ? '' : 'disabled') + '>'
                + '<span class="member-role-trigger__text">' + (isCurrent ? '팀장' : '멤버') + '</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>'
                + '<div class="member-role-menu" role="listbox" hidden>'
                + '<button type="button" class="member-role-option" data-role-value="MEMBER" role="option"><span>멤버</span><i class="fa-solid fa-check" aria-hidden="true"></i></button>'
                + '<button type="button" class="member-role-option" data-role-value="ADMIN" role="option"><span>관리자</span><i class="fa-solid fa-check" aria-hidden="true"></i></button>'
                + '<button type="button" class="member-role-option" data-role-value="LEADER" role="option"><span>팀장</span><i class="fa-solid fa-check" aria-hidden="true"></i></button>'
                + '</div></div></div></div>';
        }).join('');
        updateMemberSelectionUI();
    }

    function loadMembers() {
        if (!groupEntry || !canCreateGroupProject) return;
        const workspaceId = initialWsId;
        if (!workspaceId) return;
        if (loadedWorkspaceId === workspaceId && memberList.querySelector('.member-row')) return;

        loadedWorkspaceId = workspaceId;
        memberList.innerHTML = '<div class="member-loading">그룹 멤버를 불러오는 중입니다.</div>';
        fetch(contextPath + '/workspace/api/members?wsId=' + encodeURIComponent(workspaceId))
            .then(function (response) {
                if (!response.ok) throw new Error('멤버 조회 실패');
                return response.json();
            })
            .then(renderMembers)
            .catch(function (error) {
                console.error(error);
                memberList.innerHTML = '<div class="member-error">멤버 목록을 불러오지 못했습니다.</div>';
            });
    }

    function collectMemberSettings() {
        const selected = [];
        const seen = new Set();
        document.querySelectorAll('.member-row').forEach(function (row) {
            const checkbox = row.querySelector('.member-check');
            if (!checkbox || !checkbox.checked) return;

            const userId = String(row.dataset.userId || '').trim();
            if (!/^\d+$/.test(userId) || Number(userId) <= 0 || seen.has(userId)) return;
            seen.add(userId);

            const roleSelect = row.querySelector('.member-role');
            const position = row.querySelector('.member-position');
            const rawRole = roleSelect ? String(roleSelect.value || '').toUpperCase() : 'MEMBER';
            const role = ['MEMBER', 'ADMIN', 'LEADER'].includes(rawRole) ? rawRole : 'MEMBER';

            selected.push({
                userId: userId,
                role: role,
                position: position ? position.value.trim().slice(0, 100) : ''
            });
        });
        return selected;
    }

    function validateMemberSettings(selected) {
        if (!Array.isArray(selected) || selected.length === 0) {
            alert('참여 멤버를 한 명 이상 선택해주세요.');
            return false;
        }

        const leaders = selected.filter(function (item) { return item.role === 'LEADER'; });
        if (leaders.length !== 1) {
            alert('팀장은 반드시 1명만 지정해야 합니다.');
            return false;
        }

        return true;
    }

    function validateBasic() {
        if (!commonProjectForm || !window.MoyoProjectForm) {
            alert('프로젝트 입력 화면을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
            return false;
        }

        const result = window.MoyoProjectForm.validate(commonProjectForm);
        if (result.valid) return validateProjectLinks();

        const firstError = result.errors && result.errors.length ? result.errors[0] : null;
        if (firstError) {
            const group = commonProjectForm.querySelector('[data-project-field="' + firstError.key + '"]');
            if (group) group.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const focusTarget = group && group.querySelector('input:not([type="hidden"]), textarea, button');
            if (focusTarget) window.setTimeout(function() { focusTarget.focus(); }, 180);
        }
        return false;
    }

    function buildPayload() {
        const formValue = window.MoyoProjectForm.getValue(commonProjectForm);
        const projScope = getScope();

        let leaderId = currentUserId;
        let memberIds = currentUserId ? [currentUserId] : [];
        let adminIds = [];
        let memberPositions = {};
        if (currentUserId) {
            memberPositions[currentUserId] = '';
        }

        if (projScope === 'GROUP') {
            const selected = collectMemberSettings();
            if (!validateMemberSettings(selected)) return null;

            const leaders = selected.filter(function (item) { return item.role === 'LEADER'; });
            leaderId = leaders[0].userId;
            memberIds = selected.map(function (item) { return item.userId; });
            adminIds = selected.filter(function (item) { return item.role === 'ADMIN'; })
                .map(function (item) { return item.userId; });
            memberPositions = {};
            selected.forEach(function (item) {
                memberPositions[item.userId] = item.position || '';
            });
        }

        return {
            projName: formValue.projName,
            projDesc: formValue.projDesc,
            projScope: projScope,
            projType: formValue.projType,
            projCategory: formValue.projType,
            projCategoryDetail: null,
            projIcon: formValue.projIcon,
            accessScope: projScope === 'GROUP' ? formValue.accessScope : 'OWNER_ONLY',
            periodEnabledYn: formValue.periodEnabledYn,
            leaderId: Number(leaderId),
            wsId: projScope === 'GROUP' ? Number(getSelectedWorkspaceId()) : null,
            memberIds: memberIds.map(Number),
            adminIds: adminIds.map(Number),
            memberPositions: memberPositions,
            startDate: formValue.periodEnabledYn === 'Y' ? formValue.startDate : null,
            endDate: formValue.periodEnabledYn === 'Y' ? formValue.endDate : null,
            links: collectProjectLinks()
        };
    }

    function submitProject() {
        if (!validateBasic()) return;
        const payload = buildPayload();
        if (!payload) return;

        submitButton.disabled = true;
        if (nextButton) nextButton.disabled = true;
        submitButton.textContent = '생성 중...';

        fetch(contextPath + '/project/api/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: JSON.stringify(payload)
        })
        .then(function (response) { return response.json(); })
        .then(function (result) {
            if (result.status !== 'success') throw new Error(result.message || '프로젝트 생성 실패');
            location.href = contextPath + result.redirectUrl;
        })
        .catch(function (error) {
            console.error(error);
            alert(error.message || '프로젝트 생성 중 오류가 발생했습니다.');
            submitButton.disabled = false;
            if (nextButton) nextButton.disabled = false;
            submitButton.textContent = '프로젝트 생성';
        });
    }

    function goBack() {
        const workspaceId = initialWsId;
        if (groupEntry && workspaceId) {
            location.href = contextPath + '/workspace/main?wsId=' + encodeURIComponent(workspaceId);
            return;
        }
        location.href = contextPath + '/project/manage' + (personalEntry ? '?scope=PERSONAL' : '');
    }

    document.addEventListener('change', function (event) {
        if (event.target.matches('.member-check')) {
            const row = event.target.closest('.member-row');
            const role = row.querySelector('.member-role');
            const position = row.querySelector('.member-position');
            role.disabled = !event.target.checked;
            if (position) position.disabled = !event.target.checked;
            row.classList.toggle('is-disabled', !event.target.checked);
            if (!event.target.checked && role.value === 'LEADER') role.value = 'MEMBER';
            syncMemberRoleControl(role);
            updateMemberSelectionUI();
        }


        if (event.target.matches('.member-position')) {
            const row = event.target.closest('.member-row');
            const checkbox = row.querySelector('.member-check');
            const role = row.querySelector('.member-role');
            if (checkbox) checkbox.checked = true;
            if (role) role.disabled = false;
            event.target.disabled = false;
            row.classList.remove('is-disabled');
            updateMemberSelectionUI();
        }

        if (event.target.matches('.member-role')) {
            const row = event.target.closest('.member-row');
            const checkbox = row.querySelector('.member-check');
            checkbox.checked = true;
            event.target.disabled = false;
            const position = row.querySelector('.member-position');
            if (position) position.disabled = false;
            row.classList.remove('is-disabled');
            if (event.target.value === 'LEADER') {
                document.querySelectorAll('.member-role').forEach(function (select) {
                    if (select !== event.target && select.value === 'LEADER') {
                        select.value = 'MEMBER';
                        syncMemberRoleControl(select);
                    }
                });
            }
            syncMemberRoleControl(event.target);
            updateMemberSelectionUI();
        }
    });

    function bindDebouncedInput(input, handler, delay) {
        if (!input || input.dataset.moyoSearchBound === 'true') return;
        input.dataset.moyoSearchBound = 'true';
        let timer = null;
        let composing = false;
        const schedule = function () {
            window.clearTimeout(timer);
            timer = window.setTimeout(handler, delay);
        };
        input.addEventListener('compositionstart', function () { composing = true; });
        input.addEventListener('compositionend', function () {
            composing = false;
            schedule();
        });
        input.addEventListener('input', function () {
            if (!composing) schedule();
        });
    }

    bindDebouncedInput(memberSearchInput, applyMemberFilters, 160);

    if (memberList && memberList.dataset.moyoMemberInputBound !== 'true') {
        memberList.dataset.moyoMemberInputBound = 'true';
        memberList.addEventListener('input', function (event) {
            if (!event.target.matches('.member-position')) return;
            const row = event.target.closest('.member-row');
            if (!row) return;
            const checkbox = row.querySelector('.member-check');
            const role = row.querySelector('.member-role');
            if (checkbox) checkbox.checked = true;
            if (role) role.disabled = false;
            event.target.disabled = false;
            row.classList.remove('is-disabled');
            updateMemberSelectionUI();
        });
    }

    if (memberSelectedFilter && memberSelectedFilter.dataset.moyoSelectedFilterBound !== 'true') {
        memberSelectedFilter.dataset.moyoSelectedFilterBound = 'true';
        memberSelectedFilter.addEventListener('click', function() {
            showSelectedMembersOnly = !showSelectedMembersOnly;
            memberSelectedFilter.setAttribute('aria-pressed', String(showSelectedMembersOnly));
            memberSelectedFilter.classList.toggle('is-active', showSelectedMembersOnly);
            applyMemberFilters();
        });
    }

    document.addEventListener('click', function(event) {
        const trigger = event.target.closest('.member-role-trigger');
        if (trigger) {
            event.preventDefault();
            event.stopPropagation();
            openMemberRoleMenu(trigger.closest('[data-role-select]'));
            return;
        }
        const option = event.target.closest('.member-role-option');
        if (option) {
            event.preventDefault();
            event.stopPropagation();
            const wrap = option.closest('[data-role-select]') || (option.closest('.member-role-portal') && option.closest('.member-role-portal').__roleWrap) || activeRoleWrap;
            selectMemberRole(wrap, option.dataset.roleValue, true);
            return;
        }
        if (!event.target.closest('[data-role-select]') && !event.target.closest('.member-role-portal')) closeMemberRoleMenus();
    });

    document.addEventListener('keydown', function(event) {
        const trigger = event.target.closest('.member-role-trigger');
        if (trigger) {
            const wrap = trigger.closest('[data-role-select]');
            const select = wrap && wrap.querySelector('.member-role');
            if (!select) return;
            const values = ['MEMBER', 'ADMIN', 'LEADER'];
            const index = Math.max(0, values.indexOf(String(select.value || 'MEMBER').toUpperCase()));
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (!wrap.classList.contains('is-open')) openMemberRoleMenu(wrap);
                const delta = event.key === 'ArrowDown' ? 1 : -1;
                const next = values[(index + delta + values.length) % values.length];
                const option = activeRolePortal && activeRolePortal.querySelector('.member-role-option[data-role-value="' + next + '"]');
                if (option) option.focus();
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openMemberRoleMenu(wrap);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeMemberRoleMenus();
            }
            return;
        }
        const option = event.target.closest('.member-role-option');
        if (option) {
            const portal = option.closest('.member-role-portal');
            const wrap = option.closest('[data-role-select]') || (portal && portal.__roleWrap) || activeRoleWrap;
            const options = Array.from((portal || wrap).querySelectorAll('.member-role-option'));
            const index = options.indexOf(option);
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const delta = event.key === 'ArrowDown' ? 1 : -1;
                options[(index + delta + options.length) % options.length].focus();
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectMemberRole(wrap, option.dataset.roleValue, true);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeMemberRoleMenus();
                const t = wrap && wrap.querySelector('.member-role-trigger');
                if (t) t.focus();
            }
        }
    });

    window.addEventListener('resize', function() {
        if (activeRolePortal) positionRolePortal();
    });
    window.addEventListener('scroll', function() {
        if (activeRolePortal) positionRolePortal();
    }, true);

    document.querySelectorAll('[data-project-date-picker]').forEach(function(input) {
        input.addEventListener('click', function(event) {
            event.stopPropagation();
            openProjectDatePicker(input);
        });
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProjectDatePicker(input);
            }
        });
    });
    document.addEventListener('click', closeProjectDatePicker);
    window.addEventListener('resize', closeProjectDatePicker);
    window.addEventListener('scroll', closeProjectDatePicker, true);

    const startDateInput = document.getElementById('startDate');
    if (startDateInput) startDateInput.addEventListener('change', syncEndDate);

    if (commonProjectForm && window.MoyoProjectForm) {
        window.MoyoProjectForm.initialize(commonProjectForm);

        const typeToggle = commonProjectForm.querySelector('[data-project-type-toggle]');
        const typePanel = commonProjectForm.querySelector('[data-project-type-panel]');
        const typeSummaryLabel = commonProjectForm.querySelector('[data-project-type-summary-label]');
        const typeSummaryIcon = commonProjectForm.querySelector('[data-project-type-summary-icon]');

        const closeTypePanel = function() {
            if (!typePanel || !typeToggle) return;
            typePanel.hidden = true;
            typeToggle.setAttribute('aria-expanded', 'false');
        };

        const syncTypeSummary = function(button) {
            if (!button) return;
            const label = button.dataset.projectTypeLabel || (button.querySelector('.moyo-project-type-option__name') || {}).textContent || '';
            const icon = button.dataset.projectDefaultIcon || 'briefcase';
            if (typeSummaryLabel) typeSummaryLabel.textContent = String(label).trim();
            if (typeSummaryIcon) typeSummaryIcon.innerHTML = '<i class="fa-solid fa-' + icon + '" aria-hidden="true"></i>';
        };

        if (typeToggle && typePanel) {
            typeToggle.addEventListener('click', function(event) {
                event.stopPropagation();
                const nextOpen = typePanel.hidden;
                typePanel.hidden = !nextOpen;
                typeToggle.setAttribute('aria-expanded', String(nextOpen));
            });
            typePanel.addEventListener('click', function(event) { event.stopPropagation(); });
            document.addEventListener('click', closeTypePanel);
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') closeTypePanel();
            });
        }

        commonProjectForm.querySelectorAll('[data-project-type]').forEach(function(button) {
            button.addEventListener('click', function() {
                syncTypeSummary(button);
                closeTypePanel();
            });
        });

        const initialTypeButton = commonProjectForm.querySelector('[data-project-type][aria-pressed="true"]')
            || commonProjectForm.querySelector('[data-project-type="WORK"]')
            || commonProjectForm.querySelector('[data-project-type]');
        syncTypeSummary(initialTypeButton);
        const nameInput = commonProjectForm.querySelector('[data-project-name]');
        const syncNameCount = function() {
            if (projectNameCount && nameInput) projectNameCount.textContent = String(nameInput.value.length);
        };
        if (nameInput) nameInput.addEventListener('input', syncNameCount);
        syncNameCount();
    }

    if (topCancelButton) topCancelButton.addEventListener('click', goBack);

    nextButton.addEventListener('click', function () {
        if (!validateBasic()) return;
        loadMembers();
        setStep(2);
    });

    prevButton.addEventListener('click', function () { setStep(1); });
    submitButton.addEventListener('click', submitProject);

    setDefaultDates();
    syncEndDate();
    setStep(1);
    if (groupEntry && canCreateGroupProject) loadMembers();
})();
