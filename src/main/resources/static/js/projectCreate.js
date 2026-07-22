(function () {
    'use strict';

    window.addProjectCreateLink = function(name, url) {
        const list = document.getElementById('projectCreateLinkList');
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'project-link-row';
        row.innerHTML =
            '<input type="text" class="project-link-name" maxlength="50" placeholder="링크 이름">' +
            '<input type="text" class="project-link-url" maxlength="500" placeholder="https://...">' +
            '<button type="button" class="project-link-remove-btn" onclick="removeProjectCreateLink(this)" aria-label="링크 삭제">×</button>';
        row.querySelector('.project-link-name').value = name || '';
        row.querySelector('.project-link-url').value = url || '';
        list.appendChild(row);
    };

    window.removeProjectCreateLink = function(button) {
        const list = document.getElementById('projectCreateLinkList');
        if (!list) return;
        const rows = list.querySelectorAll('.project-link-row');
        if (rows.length <= 1) {
            rows[0].querySelectorAll('input').forEach(function(input) { input.value = ''; });
            return;
        }
        button.closest('.project-link-row').remove();
    };

    const page = document.querySelector('.project-create-page');
    if (!page) return;

    const contextPath = page.dataset.contextPath || '';
    const initialWsId = String(page.dataset.wsId || '').trim();
    const initialScope = String(page.dataset.initialScope || 'PERSONAL').toUpperCase();
    const personalEntry = String(page.dataset.personalEntry || '') === 'true';
    const groupEntry = String(page.dataset.groupEntry || '') === 'true';
    const canCreateGroupProject = String(page.dataset.canCreateGroupProject || '') === 'true';
    const currentUserId = String(page.dataset.currentUserId || '');
    const currentUserName = String(page.dataset.currentUserName || '').trim();

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
    const cancelButton = document.getElementById('btnCancel');
    const topCancelButton = document.getElementById('btnCancelTop');

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
        startInput.min = formatDate(today);
        endInput.min = formatDate(today);
    }

    function syncEndDate() {
        const start = document.getElementById('startDate').value;
        const endInput = document.getElementById('endDate');
        if (!start) return;
        endInput.min = start;
        if (!endInput.value || endInput.value < start) {
            const startDate = new Date(start + 'T00:00:00');
            startDate.setDate(startDate.getDate() + 7);
            endInput.value = formatDate(startDate);
        }
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
            if (current.getMonth() !== view.month - 1) classes.push('is-muted');
            if (value === todayValue) classes.push('is-today');
            if (selected && value === selected.value) classes.push('is-selected');
            days.push('<button type="button" class="' + classes.join(' ') + '" data-project-date-value="' + value + '">' + current.getDate() + '</button>');
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

    function resetMemberSelection() {
        loadedWorkspaceId = '';
        if (memberList) {
            memberList.innerHTML = '<div class="member-loading">그룹 멤버를 불러오는 중입니다.</div>';
        }
    }

    function updateCategoryUI() {
        const categorySelect = document.getElementById('projCategory');
        const customField = document.getElementById('customCategoryField');
        const customInput = document.getElementById('projCategoryDetail');
        const isEtc = categorySelect && categorySelect.value === 'ETC';

        if (customField) customField.hidden = !isEtc;
        if (customInput) {
            customInput.required = isEtc;
            if (!isEtc) customInput.value = '';
        }
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
                ? '프로젝트 정보를 입력하면 나만 사용하는 프로젝트가 생성됩니다.'
                : '프로젝트 정보를 입력한 다음 참여 멤버를 설정합니다.');

        setVisible(prevButton, isStep2);
        setVisible(cancelButton, !isStep2);
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

    function updateMemberSelectionUI() {
        const rows = Array.from(document.querySelectorAll('.member-row'));
        const selectedCount = rows.filter(function(row) {
            const checkbox = row.querySelector('.member-check');
            return checkbox && checkbox.checked;
        }).length;
        if (memberSelectedCount) memberSelectedCount.textContent = '참여 멤버 ' + selectedCount + '명';
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
            const profileImagePath = resolveProfileImageUrl(firstValue(member, [
                'PROFILE_IMAGE_PATH', 'profileImagePath', 'profile_image_path',
                'MEMBER_PROFILE_IMAGE_PATH', 'memberProfileImagePath',
                'CROPPED_IMAGE_PATH', 'croppedImagePath',
                'PROFILE_IMAGE_URL', 'profileImageUrl', 'imagePath'
            ]));
            const avatarImage = profileImagePath
                ? '<img src="' + escapeHtml(profileImagePath) + '" alt="" loading="lazy" onerror="this.closest(\'.member-avatar\').classList.remove(\'has-image\'); this.remove();">'
                : '';
            const avatarClass = profileImagePath ? 'member-avatar has-image' : 'member-avatar';

            const defaultPosition = String(firstValue(member, ['PROJ_POSITION', 'projPosition', 'projectPosition']) || '');

            const searchText = normalizeMemberSearchText(userName + ' ' + email);

            return '<div class="member-row' + (isCurrent ? '' : ' is-disabled') + '" data-user-id="' + escapeHtml(userId) + '" data-search-text="' + escapeHtml(searchText) + '">'
                + '<div class="member-main">'
                + '<input class="member-check" type="checkbox" ' + (isCurrent ? 'checked' : '') + ' aria-label="멤버 선택">'
                + '<div class="' + avatarClass + '"><span>' + escapeHtml(initial) + '</span>' + avatarImage + '</div>'
                + '<div class="member-info"><span class="member-name">' + escapeHtml(userName) + (isCurrent ? ' (나)' : '') + '</span>'
                + '<span class="member-email">' + escapeHtml(email) + '</span></div></div>'
                + '<input class="member-position" type="text" maxlength="100" placeholder="예: 일정 관리, 자료 정리" value="' + escapeHtml(defaultPosition) + '" ' + (isCurrent ? '' : 'disabled') + '>'
                + '<select class="member-role" aria-label="프로젝트 권한" ' + (isCurrent ? '' : 'disabled') + '>'
                + '<option value="MEMBER">멤버</option>'
                + '<option value="ADMIN">관리자</option>'
                + '<option value="LEADER" ' + (isCurrent ? 'selected' : '') + '>팀장</option>'
                + '</select></div>';
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
        document.querySelectorAll('.member-row').forEach(function (row) {
            const checkbox = row.querySelector('.member-check');
            const role = row.querySelector('.member-role');
            if (checkbox && checkbox.checked) {
                const position = row.querySelector('.member-position');
                selected.push({
                    userId: row.dataset.userId,
                    role: role ? role.value : 'MEMBER',
                    position: position ? position.value.trim() : ''
                });
            }
        });
        return selected;
    }

    function validateBasic() {
        const projName = document.getElementById('projName').value.trim();
        const projCategory = document.getElementById('projCategory').value;
        const projCategoryDetail = document.getElementById('projCategoryDetail').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!projName) { alert('프로젝트명을 입력해주세요.'); document.getElementById('projName').focus(); return false; }
        if (projCategory === 'ETC' && !projCategoryDetail) {
            alert('기타 카테고리명을 입력해주세요.');
            document.getElementById('projCategoryDetail').focus();
            return false;
        }
        if (!startDate || !endDate) { alert('프로젝트 기간을 입력해주세요.'); return false; }
        if (startDate > endDate) { alert('종료일은 시작일보다 빠를 수 없습니다.'); return false; }
        return true;
    }

    function buildPayload() {
        const projName = document.getElementById('projName').value.trim();
        const projScope = getScope();
        const projCategory = document.getElementById('projCategory').value;
        const projCategoryDetail = document.getElementById('projCategoryDetail').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const projDesc = document.getElementById('projDesc').value.trim();

        let leaderId = currentUserId;
        let memberIds = currentUserId ? [currentUserId] : [];
        let adminIds = [];
        let memberPositions = {};
        if (currentUserId) {
            memberPositions[currentUserId] = '';
        }

        if (projScope === 'GROUP') {
            const selected = collectMemberSettings();
            const leaders = selected.filter(function (item) { return item.role === 'LEADER'; });
            if (selected.length === 0) { alert('참여 멤버를 한 명 이상 선택해주세요.'); return null; }
            if (leaders.length !== 1) { alert('팀장은 반드시 1명만 지정해야 합니다.'); return null; }
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
            projName: projName,
            projDesc: projDesc,
            projScope: projScope,
            projCategory: projCategory,
            projCategoryDetail: projCategory === 'ETC' ? projCategoryDetail : null,
            projType: projCategory,
            leaderId: Number(leaderId),
            wsId: projScope === 'GROUP' ? Number(getSelectedWorkspaceId()) : null,
            memberIds: memberIds.map(Number),
            adminIds: adminIds.map(Number),
            memberPositions: memberPositions,
            startDate: startDate,
            endDate: endDate,
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
        if (event.target.matches('#projCategory')) updateCategoryUI();

        if (event.target.matches('.member-check')) {
            const row = event.target.closest('.member-row');
            const role = row.querySelector('.member-role');
            const position = row.querySelector('.member-position');
            role.disabled = !event.target.checked;
            if (position) position.disabled = !event.target.checked;
            row.classList.toggle('is-disabled', !event.target.checked);
            if (!event.target.checked && role.value === 'LEADER') role.value = 'MEMBER';
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
                    if (select !== event.target && select.value === 'LEADER') select.value = 'MEMBER';
                });
            }
            updateMemberSelectionUI();
        }
    });

    document.addEventListener('input', function (event) {
        if (event.target === memberSearchInput) {
            applyMemberFilters();
            return;
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
    });

    if (memberSelectedFilter) {
        memberSelectedFilter.addEventListener('click', function() {
            showSelectedMembersOnly = !showSelectedMembersOnly;
            memberSelectedFilter.setAttribute('aria-pressed', String(showSelectedMembersOnly));
            memberSelectedFilter.classList.toggle('is-active', showSelectedMembersOnly);
            applyMemberFilters();
        });
    }

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

    document.getElementById('startDate').addEventListener('change', syncEndDate);
    cancelButton.addEventListener('click', goBack);
    if (topCancelButton) topCancelButton.addEventListener('click', goBack);

    nextButton.addEventListener('click', function () {
        if (!validateBasic()) return;
        loadMembers();
        setStep(2);
    });

    prevButton.addEventListener('click', function () { setStep(1); });
    submitButton.addEventListener('click', submitProject);

    setDefaultDates();
    updateCategoryUI();
    setStep(1);
    if (groupEntry && canCreateGroupProject) loadMembers();
})();
