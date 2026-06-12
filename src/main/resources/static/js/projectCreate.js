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
    const wsId = page.dataset.wsId;
    const currentUserId = String(page.dataset.currentUserId || '');
    const currentUserName = String(page.dataset.currentUserName || '').trim();

    const stepLabel = document.getElementById('createStepLabel');
    const createTitle = document.getElementById('createTitle');
    const createSubTitle = document.getElementById('createSubTitle');
    const stepBasic = document.getElementById('stepBasic');
    const stepMembers = document.getElementById('stepMembers');
    const memberList = document.getElementById('memberList');
    const nextButton = document.getElementById('btnNextStep');
    const prevButton = document.getElementById('btnPrevStep');
    const submitButton = document.getElementById('btnSubmit');
    const cancelButton = document.getElementById('btnCancel');
    const topCancelButton = document.getElementById('btnCancelTop');

    let currentStep = 1;

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

    function getScope() {
        const checked = document.querySelector('input[name="projScope"]:checked');
        return checked ? checked.value : 'GROUP';
    }

    function updateScopeUI() {
        document.querySelectorAll('.scope-card').forEach(function (card) {
            const radio = card.querySelector('input[name="projScope"]');
            card.classList.toggle('active', !!radio && radio.checked);
        });
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

        stepLabel.textContent = isStep2 ? '2 / 2' : '1 / 2';
        createTitle.textContent = isStep2 ? '참여 멤버 설정' : '새 프로젝트 만들기';
        createSubTitle.textContent = isStep2
            ? '함께 진행할 멤버를 선택하고 프로젝트 권한과 역할을 지정합니다.'
            : '프로젝트 정보를 먼저 입력한 다음, 다음 단계에서 참여 멤버를 설정합니다.';

        // 1단계: 취소 / 다음만 표시
        // 2단계: 이전 / 프로젝트 생성만 표시
        setVisible(prevButton, isStep2);
        setVisible(cancelButton, !isStep2);
        setVisible(nextButton, !isStep2);
        setVisible(submitButton, isStep2);
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

    function renderMembers(members) {
        if (!Array.isArray(members) || members.length === 0) {
            memberList.innerHTML = '<div class="member-empty">참여 가능한 워크스페이스 멤버가 없습니다.</div>';
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
            const email = String(firstValue(member, ['EMAIL', 'email', 'USER_EMAIL', 'userEmail', 'mail']));
            const isCurrent = userId === currentUserId || (!currentUserId && index === 0);
            const rawName = firstValue(member, [
                'USER_NAME', 'userName', 'user_name', 'USERNAME', 'username',
                'NAME', 'name', 'USER_NM', 'userNm', 'NICKNAME', 'nickname', 'displayName'
            ]);
            const userName = String(rawName || (isCurrent ? currentUserName : '') || emailName(email) || '이름 없음');
            const initial = userName && userName !== '이름 없음' ? userName.substring(0, 1) : '멤';

            const defaultPosition = String(firstValue(member, ['PROJ_POSITION', 'projPosition', 'projectPosition', 'WS_POSITION', 'wsPosition', 'POSITION_NAME', 'positionName']));

            return '<div class="member-row' + (isCurrent ? '' : ' is-disabled') + '" data-user-id="' + escapeHtml(userId) + '">'
                + '<div class="member-main">'
                + '<input class="member-check" type="checkbox" ' + (isCurrent ? 'checked' : '') + ' aria-label="멤버 선택">'
                + '<div class="member-avatar">' + escapeHtml(initial) + '</div>'
                + '<div class="member-info"><span class="member-name">' + escapeHtml(userName) + (isCurrent ? ' (나)' : '') + '</span>'
                + '<span class="member-email">' + escapeHtml(email) + '</span></div></div>'
                + '<input class="member-position" type="text" maxlength="100" placeholder="예: 총괄, 백엔드" value="' + escapeHtml(defaultPosition) + '" ' + (isCurrent ? '' : 'disabled') + '>'
                + '<select class="member-role" aria-label="프로젝트 권한" ' + (isCurrent ? '' : 'disabled') + '>'
                + '<option value="MEMBER">멤버</option>'
                + '<option value="ADMIN">관리자</option>'
                + '<option value="LEADER" ' + (isCurrent ? 'selected' : '') + '>팀장</option>'
                + '</select></div>';
        }).join('');
    }

    function loadMembers() {
        if (!wsId) {
            memberList.innerHTML = '<div class="member-error">워크스페이스 정보를 찾지 못했습니다.</div>';
            return;
        }

        fetch(contextPath + '/workspace/api/members?wsId=' + encodeURIComponent(wsId))
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
            wsId: Number(wsId),
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

    function goWorkspaceMain() {
        location.href = contextPath + '/workspace/main?wsId=' + encodeURIComponent(wsId);
    }

    document.addEventListener('change', function (event) {
        if (event.target.matches('input[name="projScope"]')) updateScopeUI();
        if (event.target.matches('#projCategory')) updateCategoryUI();

        if (event.target.matches('.member-check')) {
            const row = event.target.closest('.member-row');
            const role = row.querySelector('.member-role');
            const position = row.querySelector('.member-position');
            role.disabled = !event.target.checked;
            if (position) position.disabled = !event.target.checked;
            row.classList.toggle('is-disabled', !event.target.checked);
            if (!event.target.checked && role.value === 'LEADER') role.value = 'MEMBER';
        }


        if (event.target.matches('.member-position')) {
            const row = event.target.closest('.member-row');
            const checkbox = row.querySelector('.member-check');
            const role = row.querySelector('.member-role');
            if (checkbox) checkbox.checked = true;
            if (role) role.disabled = false;
            event.target.disabled = false;
            row.classList.remove('is-disabled');
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
        }
    });

    document.addEventListener('input', function (event) {
        if (event.target.matches('.member-position')) {
            const row = event.target.closest('.member-row');
            const checkbox = row.querySelector('.member-check');
            const role = row.querySelector('.member-role');
            if (checkbox) checkbox.checked = true;
            if (role) role.disabled = false;
            event.target.disabled = false;
            row.classList.remove('is-disabled');
        }
    });

    document.getElementById('startDate').addEventListener('change', syncEndDate);
    cancelButton.addEventListener('click', goWorkspaceMain);
    if (topCancelButton) topCancelButton.addEventListener('click', goWorkspaceMain);

    nextButton.addEventListener('click', function () {
        if (!validateBasic()) return;
        if (getScope() === 'PERSONAL') {
            submitProject();
            return;
        }
        setStep(2);
    });

    prevButton.addEventListener('click', function () { setStep(1); });
    submitButton.addEventListener('click', submitProject);

    setDefaultDates();
    updateScopeUI();
    updateCategoryUI();
    setStep(1);
    loadMembers();
})();
