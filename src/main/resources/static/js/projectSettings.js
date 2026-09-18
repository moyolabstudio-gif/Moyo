
const projectSettingsState = {
    initialSnapshot: '',
    saving: false,
    saved: false
};


let activeProjectDateInput = null;
let activeProjectDateView = null;
let projectDatePickerMenu = null;

const PROJECT_DATE_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatProjectDate(date) {
    return date.getFullYear() + '-'
        + String(date.getMonth() + 1).padStart(2, '0') + '-'
        + String(date.getDate()).padStart(2, '0');
}

function parseProjectDate(value) {
    const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
    ) {
        return null;
    }

    return {
        year: year,
        month: month,
        day: day,
        value: formatProjectDate(date)
    };
}

function getProjectDatePickerState(input) {
    const parsed = parseProjectDate(input && input.value)
        || parseProjectDate(formatProjectDate(new Date()));

    return {
        year: parsed.year,
        month: parsed.month
    };
}

function isProjectDateDisabled(input, value) {
    if (!input || !value) return false;

    const startInput = document.getElementById('settingStartDate');
    const endInput = document.getElementById('settingEndDate');

    if (input === endInput && startInput && startInput.value) {
        return value < startInput.value;
    }

    if (input === startInput && endInput && endInput.value) {
        return value > endInput.value;
    }

    return false;
}

function ensureProjectDatePicker() {
    if (projectDatePickerMenu) return projectDatePickerMenu;

    projectDatePickerMenu = document.createElement('div');
    projectDatePickerMenu.className = 'project-date-picker-menu';
    projectDatePickerMenu.hidden = true;
    projectDatePickerMenu.setAttribute('role', 'dialog');
    projectDatePickerMenu.setAttribute('aria-label', '날짜 선택');

    projectDatePickerMenu.addEventListener('click', function(event) {
        event.stopPropagation();
        if (!activeProjectDateInput) return;

        const nav = event.target.closest('[data-project-date-nav]');
        const day = event.target.closest('[data-project-date-value]');
        const today = event.target.closest('[data-project-date-action="today"]');

        if (nav) {
            const delta = Number(nav.dataset.projectDateNav) || 0;
            const base = new Date(
                activeProjectDateView.year,
                activeProjectDateView.month - 1 + delta,
                1
            );

            activeProjectDateView = {
                year: base.getFullYear(),
                month: base.getMonth() + 1
            };

            renderProjectDatePicker();
            positionProjectDatePicker(activeProjectDateInput);
            return;
        }

        if (today) {
            const todayValue = formatProjectDate(new Date());

            if (!isProjectDateDisabled(activeProjectDateInput, todayValue)) {
                setProjectDateValue(activeProjectDateInput, todayValue);
                closeProjectDatePicker();
            }
            return;
        }

        if (day && !day.disabled) {
            setProjectDateValue(
                activeProjectDateInput,
                day.dataset.projectDateValue
            );
            closeProjectDatePicker();
        }
    });

    document.body.appendChild(projectDatePickerMenu);
    return projectDatePickerMenu;
}

function renderProjectDatePicker() {
    const menu = ensureProjectDatePicker();
    const view = activeProjectDateView
        || getProjectDatePickerState(activeProjectDateInput);
    const selected = parseProjectDate(
        activeProjectDateInput && activeProjectDateInput.value
    );
    const todayValue = formatProjectDate(new Date());
    const first = new Date(view.year, view.month - 1, 1);
    const start = new Date(
        view.year,
        view.month - 1,
        1 - first.getDay()
    );
    const days = [];

    for (let index = 0; index < 42; index += 1) {
        const current = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + index
        );
        const value = formatProjectDate(current);
        const classes = ['project-date-picker-day'];
        const disabled = isProjectDateDisabled(activeProjectDateInput, value);

        if (current.getMonth() !== view.month - 1) {
            classes.push('is-muted');
        }
        if (value === todayValue) {
            classes.push('is-today');
        }
        if (selected && value === selected.value) {
            classes.push('is-selected');
        }
        if (disabled) {
            classes.push('is-disabled');
        }

        days.push(
            '<button type="button"'
            + ' class="' + classes.join(' ') + '"'
            + ' data-project-date-value="' + value + '"'
            + (disabled ? ' disabled aria-disabled="true"' : '')
            + '>' + current.getDate() + '</button>'
        );
    }

    menu.innerHTML = ''
        + '<div class="project-date-picker-head">'
        + '<div class="project-date-picker-title">'
        + view.year + '년 ' + view.month + '월'
        + '</div>'
        + '<div class="project-date-picker-nav">'
        + '<button type="button" data-project-date-nav="-1" aria-label="이전 달">‹</button>'
        + '<button type="button" data-project-date-nav="1" aria-label="다음 달">›</button>'
        + '</div></div>'
        + '<div class="project-date-picker-weekdays">'
        + PROJECT_DATE_WEEKDAYS.map(function(day) {
            return '<span>' + day + '</span>';
        }).join('')
        + '</div>'
        + '<div class="project-date-picker-days">'
        + days.join('')
        + '</div>'
        + '<div class="project-date-picker-foot">'
        + '<button type="button" class="project-date-picker-today"'
        + ' data-project-date-action="today">오늘</button>'
        + '</div>';
}

function positionProjectDatePicker(input) {
    const menu = ensureProjectDatePicker();
    menu.hidden = false;

    const rect = input.getBoundingClientRect();
    const width = menu.offsetWidth || 248;
    const height = menu.offsetHeight || 300;
    const left = Math.min(
        Math.max(10, rect.left),
        window.innerWidth - width - 10
    );

    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 10) {
        top = Math.max(10, rect.top - height - 6);
    }

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
    if (projectDatePickerMenu) {
        projectDatePickerMenu.hidden = true;
    }

    activeProjectDateInput = null;
}

function setProjectDateValue(input, value) {
    const parsed = parseProjectDate(value);
    if (!input || !parsed || isProjectDateDisabled(input, parsed.value)) {
        return;
    }

    input.value = parsed.value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

function initializeProjectSettingDatePickers() {
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

            if (event.key === 'Escape') {
                closeProjectDatePicker();
            }
        });
    });

    document.addEventListener('click', function(event) {
        if (
            projectDatePickerMenu
            && !projectDatePickerMenu.hidden
            && !event.target.closest('.project-date-picker-menu')
            && !event.target.closest('[data-project-date-picker]')
        ) {
            closeProjectDatePicker();
        }
    });

    window.addEventListener('resize', closeProjectDatePicker);
    window.addEventListener('scroll', closeProjectDatePicker, true);
}

function getProjectSettingsSnapshot() {
    const form = document.getElementById('projectSettingsForm');
    if (!form) return '';

    const values = [];

    form.querySelectorAll('input, select, textarea').forEach(function(field) {
        if (field.type === 'button' || field.type === 'submit') return;

        let key = field.name || field.id;

        // 외부 링크 입력은 name/id가 없으므로 기존 변경 감지에서 빠졌다.
        // 행 순서 + 필드 종류를 임시 key로 사용해 추가/수정/삭제 모두 저장 버튼에 반영한다.
        if (!key) {
            const linkRow = field.closest('.project-settings-link-row');
            if (linkRow && field.matches('.project-setting-link-name, .project-setting-link-url')) {
                const rows = getProjectSettingLinkRows();
                const rowIndex = rows.indexOf(linkRow);
                const fieldType = field.classList.contains('project-setting-link-name')
                    ? 'name'
                    : 'url';
                key = 'projectLink[' + rowIndex + '].' + fieldType;
            }
        }

        if (!key) return;

        let value;

        if (field.type === 'checkbox' || field.type === 'radio') {
            value = field.checked;
        } else {
            value = field.value;
        }

        values.push([key, value]);
    });

    values.sort(function(a, b) {
        return a[0].localeCompare(b[0]);
    });

    return JSON.stringify(values);
}

function initializeProjectSettingsChangeTracking() {
    projectSettingsState.initialSnapshot = getProjectSettingsSnapshot();
    projectSettingsState.saved = false;
    syncProjectSettingsDirtyState();
}

function hasProjectSettingsChanges() {
    return getProjectSettingsSnapshot() !== projectSettingsState.initialSnapshot;
}

function syncProjectSettingsDirtyState() {
    const dirty = hasProjectSettingsChanges();
    document.body.classList.toggle('project-settings-dirty', dirty);

    const saveButton = document.getElementById('projectSettingsSaveButton');
    if (saveButton && !projectSettingsState.saving) {
        saveButton.disabled = !dirty;
        saveButton.textContent = '변경사항 저장';
    }

    return dirty;
}

function resetProjectSettingsInitialSnapshot() {
    projectSettingsState.initialSnapshot = getProjectSettingsSnapshot();
    projectSettingsState.saved = true;
    syncProjectSettingsDirtyState();
}

function setProjectSettingsSaveState(saving) {
    projectSettingsState.saving = saving;

    const button = document.getElementById('projectSettingsSaveButton');
    if (!button) return;

    button.disabled = saving;
    button.setAttribute('aria-busy', String(saving));
    button.textContent = saving ? '저장 중...' : '변경사항 저장';
}

function showProjectSettingsResult(message, type) {
    let status = document.getElementById('projectSettingsStatus');

    if (!status) {
        status = document.createElement('div');
        status.id = 'projectSettingsStatus';
        status.className = 'project-settings-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');

        const header = document.querySelector('.settings-page-header');
        if (header) {
            header.insertAdjacentElement('afterend', status);
        }
    }

    status.className = 'project-settings-status is-' + type;
    status.textContent = message;
    status.hidden = false;

    window.clearTimeout(showProjectSettingsResult.timer);
    showProjectSettingsResult.timer = window.setTimeout(function() {
        status.hidden = true;
    }, type === 'success' ? 2600 : 4200);
}


function applyProjectSettingsPermissionState() {
    const config = window.PROJECT_SETTINGS_CONFIG || {};
    const readOnly = Boolean(config.readOnlyProjectSettings)
        || !Boolean(config.canManageProject);

    document.body.classList.toggle('project-settings-readonly', readOnly);
    document.body.classList.toggle('project-settings-editable', !readOnly);

    if (!readOnly) return;

    document.querySelectorAll(
        '#projectSettingsForm input,'
        + '#projectSettingsForm select,'
        + '#projectSettingsForm textarea'
    ).forEach(function(field) {
        field.disabled = true;
        field.setAttribute('aria-disabled', 'true');
    });

    document.querySelectorAll(
        '.project-setting-link-add,'
        + '.project-setting-link-remove,'
        + '.project-member-edit-trigger,'
        + '.project-member-remove-trigger,'
        + '.project-member-add-button'
    ).forEach(function(button) {
        button.disabled = true;
        button.hidden = true;
    });
}


function syncProjectSettingsHeaderSaveButton(tabName) {
    const actionArea = document.getElementById('projectSettingsPageActions');
    const saveButton = document.getElementById('projectSettingsSaveButton');
    const isMembersTab = tabName === 'members';

    if (actionArea) {
        actionArea.hidden = isMembersTab;
        actionArea.style.setProperty(
            'display',
            isMembersTab ? 'none' : 'flex',
            'important'
        );
    }

    if (saveButton) {
        saveButton.hidden = isMembersTab;
        saveButton.style.setProperty(
            'display',
            isMembersTab ? 'none' : 'inline-flex',
            'important'
        );
    }
}

function switchProjectSettingsTab(tabName) {
    const basic = document.getElementById('projectSettingsBasic');
    const members = document.getElementById('projectSettingsMembers');

    if (!basic) return;

    // 개인 프로젝트에는 멤버 관리 탭이 없다.
    // 예전 URL의 ?tab=members가 남아 있어도 기본 설정으로 복귀한다.
    if (!members) {
        basic.classList.add('is-active');
        document.body.classList.remove('project-settings-members-tab');
        syncProjectSettingsHeaderSaveButton('basic');
        document.querySelectorAll('.settings-tab-button').forEach(function(button) {
            button.classList.toggle('is-active', button.dataset.tab === 'basic');
        });
        const url = new URL(window.location.href);
        url.searchParams.delete('tab');
        history.replaceState(null, '', url);
        return;
    }

    basic.classList.toggle('is-active', tabName === 'basic');
    members.classList.toggle('is-active', tabName === 'members');

    document.body.classList.toggle(
        'project-settings-members-tab',
        tabName === 'members'
    );

    syncProjectSettingsHeaderSaveButton(tabName);

    if (tabName !== 'members') {
        setProjectMemberMode('view', true);
    }

    document.querySelectorAll('.settings-tab-button').forEach(function(button) {
        button.classList.toggle('is-active', button.dataset.tab === tabName);
    });

    const url = new URL(window.location.href);
    if (tabName === 'members') {
        url.searchParams.set('tab', 'members');
    } else {
        url.searchParams.delete('tab');
    }
    history.replaceState(null, '', url);
}

const PROJECT_LINK_MAX_COUNT = 5;

function getProjectSettingLinkRows() {
    const list = document.getElementById('projectSettingLinkList');
    return list ? Array.from(list.querySelectorAll('.project-settings-link-row')) : [];
}

function syncProjectSettingLinkControls() {
    const rows = getProjectSettingLinkRows();
    const addButton = document.getElementById('projectSettingLinkAddButton');
    const count = document.getElementById('projectSettingLinkCount');
    const reachedLimit = rows.length >= PROJECT_LINK_MAX_COUNT;

    if (count) {
        count.textContent = rows.length + ' / ' + PROJECT_LINK_MAX_COUNT;
    }

    if (addButton) {
        addButton.disabled = reachedLimit;
        addButton.setAttribute('aria-disabled', String(reachedLimit));
        addButton.title = reachedLimit
            ? '외부 링크는 최대 5개까지 등록할 수 있습니다.'
            : '';
    }
}

function createProjectSettingLinkRow(name, url) {
    const row = document.createElement('div');
    row.className = 'project-settings-link-row';
    row.innerHTML =
        '<input type="text" class="project-setting-link-name form-control" maxlength="50" placeholder="링크 이름" autocomplete="off">' +
        '<input type="url" class="project-setting-link-url form-control" maxlength="500" placeholder="https://example.com" inputmode="url" autocomplete="url">' +
        '<button type="button" class="project-setting-link-remove" aria-label="링크 삭제">×</button>';

    row.querySelector('.project-setting-link-name').value = name || '';
    row.querySelector('.project-setting-link-url').value = url || '';
    row.querySelector('.project-setting-link-remove').addEventListener('click', function() {
        removeProjectSettingLink(this);
    });
    return row;
}

function addProjectSettingLink(name, url) {
    const list = document.getElementById('projectSettingLinkList');
    if (!list) return;

    const rows = getProjectSettingLinkRows();
    if (rows.length >= PROJECT_LINK_MAX_COUNT) {
        alert('외부 링크는 최대 5개까지 등록할 수 있습니다.');
        return;
    }

    const row = createProjectSettingLinkRow(name, url);
    list.appendChild(row);
    syncProjectSettingLinkControls();
    syncProjectSettingsDirtyState();
    row.querySelector('.project-setting-link-name')?.focus();
}

function removeProjectSettingLink(button) {
    const row = button ? button.closest('.project-settings-link-row') : null;
    if (!row) return;

    row.remove();
    syncProjectSettingLinkControls();
    syncProjectSettingsDirtyState();
}

function normalizeProjectSettingUrl(value) {
    const url = normalizeProjectSettingText(value);
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : 'https://' + url;
}

function collectProjectSettingLinks() {
    return getProjectSettingLinkRows()
        .map(function(row) {
            return {
                linkName: normalizeProjectSettingText(
                    row.querySelector('.project-setting-link-name')?.value
                ).replace(/\s+/g, ' '),
                linkUrl: normalizeProjectSettingText(
                    row.querySelector('.project-setting-link-url')?.value
                )
            };
        })
        .filter(function(link) {
            return link.linkName || link.linkUrl;
        });
}

function validateProjectSettingLinks(links) {
    if (getProjectSettingLinkRows().length > PROJECT_LINK_MAX_COUNT || links.length > PROJECT_LINK_MAX_COUNT) {
        alert('외부 링크는 최대 5개까지 등록할 수 있습니다.');
        return false;
    }

    const duplicateUrls = new Set();
    const rows = getProjectSettingLinkRows();

    for (let index = 0; index < links.length; index += 1) {
        const link = links[index];
        const row = rows.find(function(candidate) {
            const name = normalizeProjectSettingText(
                candidate.querySelector('.project-setting-link-name')?.value
            ).replace(/\s+/g, ' ');
            const url = normalizeProjectSettingText(
                candidate.querySelector('.project-setting-link-url')?.value
            );
            return name === link.linkName && url === link.linkUrl;
        });

        if (!link.linkName || !link.linkUrl) {
            alert('링크 이름과 주소를 모두 입력해주세요.');
            (row?.querySelector(!link.linkName
                ? '.project-setting-link-name'
                : '.project-setting-link-url'))?.focus();
            return false;
        }

        const normalizedUrl = normalizeProjectSettingUrl(link.linkUrl);
        try {
            const parsed = new URL(normalizedUrl);
            if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) {
                throw new Error('INVALID_URL');
            }
        } catch (error) {
            alert('올바른 외부 링크 주소를 입력해주세요.');
            row?.querySelector('.project-setting-link-url')?.focus();
            return false;
        }

        const duplicateKey = normalizedUrl.toLowerCase();
        if (duplicateUrls.has(duplicateKey)) {
            alert('같은 외부 링크 주소를 중복 등록할 수 없습니다.');
            row?.querySelector('.project-setting-link-url')?.focus();
            return false;
        }
        duplicateUrls.add(duplicateKey);
        link.linkUrl = normalizedUrl;
    }

    return true;
}

function goProjectMain() {
    const config = window.PROJECT_SETTINGS_CONFIG || {};
    const query = new URLSearchParams();

    if (config.projId) {
        query.set('projId', config.projId);
    }

    if (config.wsId && String(config.wsId) !== 'null') {
        query.set('wsId', config.wsId);
    }

    if (!query.get('projId')) {
        alert('프로젝트 화면으로 이동할 수 없습니다.');
        return;
    }

    location.href = (config.contextPath || '')
        + '/project/main?' + query.toString();
}

const PROJECT_SETTING_CATEGORIES = new Set([
    'WORK',
    'TRAVEL',
    'EVENT',
    'STUDY',
    'LIFE',
    'HOBBY',
    'ETC'
]);

function isValidProjectDateValue(value) {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const parts = value.split('-').map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

    return date.getUTCFullYear() === parts[0]
        && date.getUTCMonth() === parts[1] - 1
        && date.getUTCDate() === parts[2];
}

function syncProjectPeriodConstraints() {
    const startInput = document.getElementById('settingStartDate');
    const endInput = document.getElementById('settingEndDate');
    if (!startInput || !endInput) return;

    const startDate = startInput.value;
    const endDate = endInput.value;

    if (startDate) {
        endInput.min = startDate;
    } else {
        endInput.removeAttribute('min');
    }

    if (endDate) {
        startInput.max = endDate;
    } else {
        startInput.removeAttribute('max');
    }

    startInput.setCustomValidity('');
    endInput.setCustomValidity('');

    if (startDate && !isValidProjectDateValue(startDate)) {
        startInput.setCustomValidity('올바른 시작일을 입력해주세요.');
    }

    if (endDate && !isValidProjectDateValue(endDate)) {
        endInput.setCustomValidity('올바른 마감일을 입력해주세요.');
    }

    if (startDate && endDate && startDate > endDate) {
        endInput.setCustomValidity('마감일은 시작일보다 빠를 수 없습니다.');
    }

    if (
        projectDatePickerMenu
        && !projectDatePickerMenu.hidden
        && activeProjectDateInput
    ) {
        renderProjectDatePicker();
        positionProjectDatePicker(activeProjectDateInput);
    }
}

function normalizeProjectSettingText(value) {
    return String(value == null ? '' : value)
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\r\n?/g, '\n')
        .trim();
}

function setProjectSettingsSaving(saving) {
    const button = document.getElementById('projectSettingsSaveButton');
    if (!button) return;

    if (!button.dataset.defaultText) {
        button.dataset.defaultText = button.textContent.trim() || '변경사항 저장';
    }

    button.disabled = Boolean(saving);
    button.setAttribute('aria-busy', saving ? 'true' : 'false');
    button.textContent = saving ? '저장 중...' : button.dataset.defaultText;
}

function focusProjectSettingField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.focus();
    if (typeof field.select === 'function' && field.tagName === 'INPUT') {
        field.select();
    }
}

function buildProjectSettingPayload() {
    const config = window.PROJECT_SETTINGS_CONFIG || {};
    const category = document.getElementById('settingProjCategory')?.value || '';

    return {
        projId: Number(config.projId),
        wsId: config.wsId ? Number(config.wsId) : null,
        projName: normalizeProjectSettingText(
            document.getElementById('settingProjName')?.value
        ),
        projCategory: category,
        projCategoryDetail: null,
        // 기존 PROJECTS.PROJ_TYPE 저장 로직과의 호환을 유지한다.
        projType: category,
        startDate: document.getElementById('settingStartDate')?.value || null,
        endDate: document.getElementById('settingEndDate')?.value || null,
        projDesc: normalizeProjectSettingText(
            document.getElementById('settingProjDesc')?.value
        ),
        // 기본 정보 저장 시 기존 링크가 삭제되지 않도록 현재 값을 함께 전달한다.
        links: collectProjectSettingLinks()
    };
}

function validateProjectSettingPayload(payload) {
    if (!Number.isFinite(payload.projId) || payload.projId <= 0) {
        alert('프로젝트 정보를 확인할 수 없습니다.');
        return false;
    }

    if (!payload.projName) {
        alert('프로젝트 이름을 입력해주세요.');
        focusProjectSettingField('settingProjName');
        return false;
    }

    if (payload.projName.length > 80) {
        alert('프로젝트 이름은 80자 이내로 입력해주세요.');
        focusProjectSettingField('settingProjName');
        return false;
    }

    if (!PROJECT_SETTING_CATEGORIES.has(payload.projCategory)) {
        alert('프로젝트 유형을 선택해주세요.');
        focusProjectSettingField('settingProjCategory');
        return false;
    }

    if (!isValidProjectDateValue(payload.startDate)) {
        alert('올바른 시작일을 입력해주세요.');
        focusProjectSettingField('settingStartDate');
        return false;
    }

    if (!isValidProjectDateValue(payload.endDate)) {
        alert('올바른 마감일을 입력해주세요.');
        focusProjectSettingField('settingEndDate');
        return false;
    }

    if (payload.projDesc.length > 1000) {
        alert('프로젝트 설명은 1000자 이내로 입력해주세요.');
        focusProjectSettingField('settingProjDesc');
        return false;
    }

    if (!validateProjectSettingLinks(payload.links)) {
        return false;
    }

    if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
        alert('마감일은 시작일보다 빠를 수 없습니다.');
        focusProjectSettingField('settingEndDate');
        return false;
    }

    return true;
}

async function saveProjectInfo() {
    if (projectSettingsState.saving) return;

    const config = window.PROJECT_SETTINGS_CONFIG || {};

    if (!config.canManageProject) {
        alert('프로젝트 설정 권한이 없습니다.');
        return;
    }

    const payload = buildProjectSettingPayload();
    if (!validateProjectSettingPayload(payload)) return;

    setProjectSettingsSaving(true);

    try {
        setProjectSettingsSaveState(true);
        const response = await fetch(config.contextPath + '/project/api/update-project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('HTTP_' + response.status);
        }

        const result = (await response.text()).trim();

        if (result === 'SUCCESS') {
            resetProjectSettingsInitialSnapshot();
            goProjectMain();
            return;
        }

        if (result === 'LOGIN_FAIL') {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            location.href = config.contextPath + '/login';
            return;
        }

        if (result === 'NO_PERMISSION') {
            alert('프로젝트 설정 권한이 없습니다.');
            return;
        }

        alert('프로젝트 설정 저장에 실패했습니다.');
    } catch (error) {
        showProjectSettingsResult(
            '프로젝트 설정 저장에 실패했습니다. 입력값과 네트워크 상태를 확인해주세요.',
            'error'
        );

        console.error('프로젝트 설정 저장 오류:', error);
        alert('프로젝트 설정 저장 중 오류가 발생했습니다.');
    } finally {
        setProjectSettingsSaveState(false);
        setProjectSettingsSaving(false);
        syncProjectSettingsDirtyState();
    }
}





let projectMemberMode = 'view';

function getProjectMemberRows() {
    return Array.from(document.querySelectorAll('#projectMemberManageList .project-wsmt-row'));
}

function setProjectMemberMode(mode, resetValues) {
    const panel = document.getElementById('projectSettingsMembers');
    if (!panel) return;

    projectMemberMode = mode;
    panel.classList.toggle('is-member-editing', mode === 'edit');
    panel.classList.toggle('is-member-removing', mode === 'remove');

    document.body.classList.toggle('project-member-editing', mode === 'edit');
    document.body.classList.toggle('project-member-removing', mode === 'remove');

    getProjectMemberRows().forEach(function(row) {
        const roleSelect = row.querySelector('.project-member-role-edit');
        const positionInput = row.querySelector('.project-member-position-edit');
        const checkbox = row.querySelector('.project-member-select');

        if (resetValues) {
            if (roleSelect) roleSelect.value = row.dataset.role || 'MEMBER';
            if (positionInput) positionInput.value = row.dataset.position || '';
            if (checkbox) checkbox.checked = false;
        }

        if (roleSelect) roleSelect.disabled = mode !== 'edit';
        if (positionInput) positionInput.disabled = mode !== 'edit';
        if (checkbox && mode !== 'remove') checkbox.checked = false;
    });

    const selectAll = document.getElementById('projectMemberSelectAll');
    if (selectAll) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
        selectAll.disabled = mode !== 'remove';
    }

    syncProjectMemberSelection();
    syncProjectMemberModeNote();
}

function enterProjectMemberEditMode() {
    setProjectMemberMode('edit', true);
}

function enterProjectMemberRemoveMode() {
    setProjectMemberMode('remove', true);
}

function exitProjectMemberMode(resetValues) {
    setProjectMemberMode('view', resetValues !== false);
}

function syncProjectMemberModeNote() {
    const note = document.getElementById('projectMemberModeNote');
    if (!note) return;

    if (projectMemberMode === 'edit') {
        note.textContent = '권한과 담당 역할을 수정한 뒤 변경사항 저장을 눌러 한 번에 반영하세요.';
    } else if (projectMemberMode === 'remove') {
        note.textContent = '내보낼 멤버를 선택하세요. 팀장은 선택할 수 없습니다.';
    } else {
        note.textContent = '프로젝트 멤버의 권한과 담당 역할을 관리합니다.';
    }
}

function getSelectableProjectMemberCheckboxes() {
    return getProjectMemberRows()
        .filter(function(row) { return !row.hidden; })
        .map(function(row) { return row.querySelector('.project-member-select'); })
        .filter(function(checkbox) { return checkbox && !checkbox.disabled; });
}

function syncProjectMemberSelection() {
    const selectable = getSelectableProjectMemberCheckboxes();
    const selected = selectable.filter(function(checkbox) { return checkbox.checked; });
    const selectAll = document.getElementById('projectMemberSelectAll');
    const count = document.getElementById('projectMemberSelected');
    const removeButton = document.getElementById('projectMemberRemoveConfirmButton');

    if (selectAll) {
        selectAll.checked = selectable.length > 0 && selected.length === selectable.length;
        selectAll.indeterminate = selected.length > 0 && selected.length < selectable.length;
        selectAll.disabled = projectMemberMode !== 'remove' || selectable.length === 0;
    }

    if (count) count.textContent = '선택 ' + selected.length + '명';

    if (removeButton) {
        removeButton.disabled = selected.length === 0;
        removeButton.textContent = selected.length
            ? selected.length + '명 내보내기'
            : '선택 내보내기';
    }

    getProjectMemberRows().forEach(function(row) {
        const checkbox = row.querySelector('.project-member-select');
        row.classList.toggle(
            'is-selected',
            projectMemberMode === 'remove' && checkbox && checkbox.checked
        );
    });
}

function toggleAllProjectMembers(checked) {
    if (projectMemberMode !== 'remove') return;

    getSelectableProjectMemberCheckboxes().forEach(function(checkbox) {
        checkbox.checked = checked;
    });

    syncProjectMemberSelection();
}

function filterProjectSettingMembers() {
    const input = document.getElementById('projectMemberSearchInput');
    const keyword = String(input ? input.value : '').trim().toLowerCase();
    let visibleCount = 0;

    getProjectMemberRows().forEach(function(row) {
        const matched = !keyword
            || String(row.dataset.search || '').includes(keyword);

        row.hidden = !matched;
        if (matched) visibleCount += 1;

        const checkbox = row.querySelector('.project-member-select');
        if (!matched && checkbox) checkbox.checked = false;
    });

    const empty = document.getElementById('projectMemberEmpty');
    if (empty) empty.classList.toggle('is-visible', visibleCount === 0);

    syncProjectMemberSelection();
}

function postProjectMemberSetting(values, endpoint) {
    const config = window.PROJECT_SETTINGS_CONFIG || {};
    const params = new URLSearchParams();

    Object.keys(values).forEach(function(key) {
        params.append(key, values[key]);
    });

    return fetch(
        (config.contextPath || '') + endpoint,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: params
        }
    ).then(function(response) {
        if (!response.ok) throw new Error('HTTP_' + response.status);
        return response.text();
    });
}

async function saveProjectMemberChanges() {
    const config = window.PROJECT_SETTINGS_CONFIG || {};
    if (!config.canManageProject) return;

    const changedRows = getProjectMemberRows().filter(function(row) {
        const roleSelect = row.querySelector('.project-member-role-edit');
        const positionInput = row.querySelector('.project-member-position-edit');
        const nextRole = roleSelect ? roleSelect.value : row.dataset.role;
        const nextPosition = positionInput ? positionInput.value.trim() : '';

        return nextRole !== (row.dataset.role || 'MEMBER')
            || nextPosition !== (row.dataset.position || '');
    });

    if (!changedRows.length) {
        exitProjectMemberMode(false);
        return;
    }

    if (!confirm(changedRows.length + '명의 변경사항을 저장하시겠습니까?')) return;

    const saveButton = document.getElementById('projectMemberSaveButton');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = '저장 중';
    }

    try {
        for (const row of changedRows) {
            const roleSelect = row.querySelector('.project-member-role-edit');
            const positionInput = row.querySelector('.project-member-position-edit');
            const nextRole = roleSelect ? roleSelect.value : row.dataset.role;
            const nextPosition = positionInput ? positionInput.value.trim() : '';

            const result = (await postProjectMemberSetting({
                projId: config.projId,
                userId: row.dataset.userId,
                projRole: nextRole,
                projPosition: nextPosition
            }, '/project/api/update-member-setting')).trim();

            if (result !== 'SUCCESS') throw new Error(result || 'UPDATE_FAILED');

            row.dataset.role = nextRole;
            row.dataset.position = nextPosition;

            const roleSummary = row.querySelector('.project-member-role-summary');
            if (roleSummary && roleSelect) {
                roleSummary.textContent = nextRole === 'ADMIN' ? '관리자' : '멤버';
                roleSummary.classList.toggle('is-admin', nextRole === 'ADMIN');
            }

            const positionSummary = row.querySelector('.project-member-position-summary');
            if (positionSummary) {
                positionSummary.textContent = nextPosition || '미지정';
                positionSummary.classList.toggle('is-empty', !nextPosition);
            }
        }

        exitProjectMemberMode(false);
    } catch (error) {
        console.error('프로젝트 멤버 변경사항 저장 실패:', error);
        alert('일부 변경사항 저장에 실패했습니다. 화면을 새로고침해 상태를 확인해주세요.');
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = '변경사항 저장';
        }
    }
}

async function removeSelectedProjectMembers() {
    const config = window.PROJECT_SETTINGS_CONFIG || {};

    const selectedRows = getProjectMemberRows().filter(function(row) {
        const checkbox = row.querySelector('.project-member-select');
        return checkbox && checkbox.checked && !checkbox.disabled;
    });

    if (!selectedRows.length) return;

    const names = selectedRows
        .map(function(row) { return row.dataset.memberName; })
        .filter(Boolean);

    const label = names.length <= 3
        ? names.join(', ')
        : names.slice(0, 3).join(', ') + ' 외 ' + (names.length - 3) + '명';

    if (!confirm(label + '을 프로젝트에서 내보내시겠습니까?')) return;

    try {
        for (const row of selectedRows) {
            const result = (await postProjectMemberSetting({
                projId: config.projId,
                userId: row.dataset.userId
            }, '/project/api/remove-member')).trim();

            if (result !== 'SUCCESS') throw new Error(result || 'REMOVE_FAILED');
            row.remove();
        }

        updateProjectMemberTotal();
        exitProjectMemberMode(false);
        filterProjectSettingMembers();
    } catch (error) {
        console.error('프로젝트 멤버 내보내기 실패:', error);
        alert('일부 멤버 내보내기에 실패했습니다. 화면을 새로고침해 상태를 확인해주세요.');
    }
}

function updateProjectMemberTotal() {
    const total = getProjectMemberRows().length;
    const element = document.getElementById('projectMemberTotal');

    if (element) {
        element.innerHTML = '전체 <strong>' + total + '</strong>명';
    }
}



function openProjectMemberAddModal() {
    const config = window.PROJECT_SETTINGS_CONFIG || {};

    if (!window.ProjectMemberPeopleAdapter?.openAdd) {
        alert('공통 사람 모달을 불러오지 못했습니다.');
        return;
    }

    window.ProjectMemberPeopleAdapter.openAdd({
        projId: config.projId,
        wsId: config.wsId,
        contextPath: config.contextPath || '',
        onAdded: function() {
            window.setTimeout(function() {
                location.reload();
            }, 250);
        }
    });
}

function handleProjectMemberLeaderTransferSelect(select) {
    if (!select || select.value !== 'LEADER') return false;

    const config = window.PROJECT_SETTINGS_CONFIG || {};
    const row = select.closest('.project-wsmt-row');
    const previousRole = row ? (row.dataset.role || 'MEMBER') : 'MEMBER';
    const userId = row ? row.dataset.userId : '';
    const memberName = row ? (row.dataset.memberName || '해당 멤버') : '해당 멤버';

    // 팀장 위임은 일반 일괄 저장과 분리해 즉시 확인/처리한다.
    select.value = previousRole === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    if (!config.isProjectLeader) {
        alert('현재 팀장만 팀장 권한을 위임할 수 있습니다.');
        return true;
    }
    if (!userId) {
        alert('팀장으로 지정할 멤버 정보를 찾을 수 없습니다.');
        return true;
    }

    transferProjectLeader(userId, memberName);
    return true;
}

function transferProjectLeader(userId, memberName) {
    const config = window.PROJECT_SETTINGS_CONFIG;
    const row = document.querySelector(
        '.project-wsmt-row[data-user-id="' + userId + '"]'
    );
    const positionInput = row ? row.querySelector('.project-member-position-edit') : null;

    if (!config.isProjectLeader) {
        alert('현재 팀장만 팀장 권한을 위임할 수 있습니다.');
        return;
    }

    if (!confirm(
        memberName + ' 멤버에게 팀장 권한을 넘기시겠습니까?\n'
        + '기존 팀장은 관리자가 됩니다.'
    )) {
        return;
    }

    const params = new URLSearchParams();
    params.append('projId', config.projId);
    params.append('userId', userId);
    params.append('projPosition', positionInput ? positionInput.value.trim() : '');

    fetch(config.contextPath + '/project/api/transfer-leader', {
        method: 'POST',
        body: params
    })
    .then(function(response) {
        if (!response.ok) throw new Error('TRANSFER_FAILED');
        return response.text();
    })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert('팀장 권한을 넘겼습니다.');
            location.reload();
        } else if (result === 'LEADER_ONLY') {
            alert('현재 팀장만 팀장 권한을 위임할 수 있습니다.');
        } else if (result === 'SAME_LEADER') {
            alert('이미 현재 팀장입니다.');
        } else if (result === 'MEMBER_NOT_FOUND') {
            alert('프로젝트 멤버를 찾을 수 없습니다.');
        } else {
            alert('팀장 권한 위임에 실패했습니다.');
        }
    })
    .catch(function(error) {
        console.error('프로젝트 팀장 위임 오류:', error);
        alert('팀장 권한 위임 중 오류가 발생했습니다.');
    });
}

function removeProjectMember(userId, userName) {
    const config = window.PROJECT_SETTINGS_CONFIG;

    if (!confirm((userName || '해당 멤버') + '님을 프로젝트에서 내보내시겠습니까?')) {
        return;
    }

    const params = new URLSearchParams();
    params.append('projId', config.projId);
    params.append('userId', userId);

    fetch(config.contextPath + '/project/api/remove-member', {
        method: 'POST',
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert('멤버를 프로젝트에서 내보냈습니다.');
            location.reload();
        } else if (result === 'NO_PERMISSION') {
            alert('멤버 내보내기 권한이 없습니다.');
        } else if (result === 'CANNOT_REMOVE_LEADER') {
            alert('팀장은 내보낼 수 없습니다. 먼저 다른 멤버에게 팀장을 위임해주세요.');
        } else {
            alert('멤버 내보내기에 실패했습니다.');
        }
    })
    .catch(function(err) {
        console.error('멤버 내보내기 오류:', err);
        alert('멤버 내보내기 중 오류가 발생했습니다.');
    });
}


function getProjectDeleteExpectedDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function openProjectDeleteRequestModal() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    if (!config || !config.isProjectLeader) {
        alert('프로젝트 삭제 신청은 팀장만 가능합니다.');
        return;
    }

    const modal = document.getElementById('projectDeleteRequestModal');
    const input = document.getElementById('projectDeleteConfirmName');
    const dateText = document.getElementById('projectDeleteExpectedDate');
    if (!modal) return;

    if (dateText) dateText.textContent = getProjectDeleteExpectedDate();
    if (input) input.value = '';

    modal.hidden = false;
    document.body.classList.add('project-delete-modal-open');
    window.setTimeout(function() {
        if (input) input.focus();
    }, 0);
}

function closeProjectDeleteRequestModal() {
    const modal = document.getElementById('projectDeleteRequestModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('project-delete-modal-open');
}

function requestProjectDeletionFromSettings() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    const input = document.getElementById('projectDeleteConfirmName');
    const submit = document.getElementById('projectDeleteRequestSubmit');

    if (!config || !config.isProjectLeader) {
        alert('프로젝트 삭제 신청은 팀장만 가능합니다.');
        return;
    }

    if (!input || input.value.trim() !== String(config.projectName || '').trim()) {
        alert('프로젝트 이름을 정확히 입력해 주세요.');
        if (input) input.focus();
        return;
    }

    const params = new URLSearchParams();
    params.append('projId', config.projId);

    if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
    }

    fetch(config.contextPath + '/project/api/request-delete', {
        method: 'POST',
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'SUCCESS' || result === 'ALREADY_PENDING') {
            closeProjectDeleteRequestModal();
            alert('프로젝트 삭제가 신청되었습니다. 30일 안에는 취소할 수 있습니다.');
            location.reload();
            return;
        }
        if (result === 'LEADER_ONLY') {
            alert('프로젝트 삭제 신청은 팀장만 가능합니다.');
            return;
        }
        if (result === 'LOGIN_FAIL') {
            alert('로그인이 필요합니다.');
            return;
        }
        alert('프로젝트 삭제 신청에 실패했습니다.');
    })
    .catch(function(err) {
        console.error('프로젝트 삭제 신청 오류:', err);
        alert('프로젝트 삭제 신청 중 오류가 발생했습니다.');
    })
    .finally(function() {
        if (submit) {
            submit.disabled = false;
            submit.removeAttribute('aria-busy');
        }
    });
}

function cancelProjectDeletionFromSettings() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    if (!config || !config.isProjectLeader) {
        alert('프로젝트 삭제 신청 취소는 팀장만 가능합니다.');
        return;
    }

    if (!confirm('프로젝트 삭제 신청을 취소하고 정상 상태로 되돌릴까요?')) {
        return;
    }

    const params = new URLSearchParams();
    params.append('projId', config.projId);

    fetch(config.contextPath + '/project/api/cancel-delete', {
        method: 'POST',
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert('프로젝트 삭제 신청이 취소되었습니다.');
            location.reload();
            return;
        }
        if (result === 'NOT_PENDING') {
            alert('이미 삭제 신청이 취소되었거나 정상 상태입니다.');
            location.reload();
            return;
        }
        if (result === 'LEADER_ONLY') {
            alert('프로젝트 삭제 신청 취소는 팀장만 가능합니다.');
            return;
        }
        alert('프로젝트 삭제 신청 취소에 실패했습니다.');
    })
    .catch(function(err) {
        console.error('프로젝트 삭제 신청 취소 오류:', err);
        alert('프로젝트 삭제 신청 취소 중 오류가 발생했습니다.');
    });
}




document.addEventListener('DOMContentLoaded', function () {
    const initialMemberTab = document.querySelector(
        '.settings-tab-button.is-active[data-tab="members"]'
    );
    const initialMemberPanel = document.getElementById(
        'projectSettingsMembers'
    );

    const startsOnMembersTab = Boolean(
        initialMemberTab
        || (
            initialMemberPanel
            && initialMemberPanel.classList.contains('is-active')
        )
    );

    document.body.classList.toggle(
        'project-settings-members-tab',
        startsOnMembersTab
    );

    syncProjectSettingsHeaderSaveButton(
        startsOnMembersTab ? 'members' : 'basic'
    );


    initializeProjectSettingDatePickers();
    window.requestAnimationFrame(function() {
        initializeProjectSettingsChangeTracking();
    });

    const settingsFormForTracking = document.getElementById('projectSettingsForm');
    if (settingsFormForTracking) {
        settingsFormForTracking.addEventListener('input', syncProjectSettingsDirtyState);
        settingsFormForTracking.addEventListener('change', syncProjectSettingsDirtyState);
    }

    window.addEventListener('beforeunload', function(event) {
        if (projectSettingsState.saving || !hasProjectSettingsChanges()) return;
        event.preventDefault();
        event.returnValue = '';
    });

    applyProjectSettingsPermissionState();
    const startDateInput = document.getElementById('settingStartDate');
    const endDateInput = document.getElementById('settingEndDate');
    [startDateInput, endDateInput].forEach(function(input) {
        if (!input) return;
        input.addEventListener('input', syncProjectPeriodConstraints);
        input.addEventListener('change', syncProjectPeriodConstraints);
    });

    const settingsForm = document.getElementById('projectSettingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveProjectInfo();
        });
    }

    syncProjectPeriodConstraints();
    syncProjectSettingLinkControls();
    document.querySelectorAll('#projectSettingLinkList .project-setting-link-remove')
        .forEach(function(button) {
            button.addEventListener('click', function() {
                removeProjectSettingLink(this);
            });
            button.removeAttribute('onclick');
        });

    document.querySelectorAll('.project-member-role-edit').forEach(function(select) {
        select.addEventListener('change', function() {
            handleProjectMemberLeaderTransferSelect(this);
        });
    });

    const params = new URLSearchParams(window.location.search);
    updateProjectMemberTotal();
    setProjectMemberMode('view', false);

    switchProjectSettingsTab(
        params.get('tab') === 'members' ? 'members' : 'basic'
    );
});


document.addEventListener('click', function(event) {
    if (event.target.closest('.workspace-link-add, .workspace-link-remove, .project-setting-link-add, .project-setting-link-remove')) {
        window.setTimeout(syncProjectSettingsDirtyState, 0);
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeProjectDeleteRequestModal();
    }
});
