(function () {
    'use strict';

    const page = document.querySelector('.project-create-page');
    if (!page) return;

    const contextPath = page.dataset.contextPath || '';
    const wsId = page.dataset.wsId;
    const currentUserId = String(page.dataset.currentUserId || '');
    const createLayout = document.querySelector('.create-layout');
    const memberSection = document.getElementById('memberSection');
    const memberList = document.getElementById('memberList');
    const submitButton = document.getElementById('btnSubmit');

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(date) {
        return date.getFullYear() + '-'
            + String(date.getMonth() + 1).padStart(2, '0') + '-'
            + String(date.getDate()).padStart(2, '0');
    }

    function setDefaultDates() {
        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + 2);
        document.getElementById('startDate').value = formatDate(today);
        document.getElementById('endDate').value = formatDate(end);
        document.getElementById('startDate').min = formatDate(today);
        document.getElementById('endDate').min = formatDate(today);
    }

    function syncEndDate() {
        const start = document.getElementById('startDate').value;
        const endInput = document.getElementById('endDate');
        if (!start) return;
        endInput.min = start;
        if (!endInput.value || endInput.value < start) endInput.value = start;
    }

    function getScope() {
        const checked = document.querySelector('input[name="projScope"]:checked');
        return checked ? checked.value : 'GROUP';
    }

    function updateScopeUI() {
        const scope = getScope();
        document.querySelectorAll('.scope-card').forEach(function (card) {
            const radio = card.querySelector('input[name="projScope"]');
            card.classList.toggle('active', !!radio && radio.checked);
        });
        const isGroup = scope === 'GROUP';
        memberSection.style.display = isGroup ? '' : 'none';
        if (createLayout) createLayout.classList.toggle('personal-mode', !isGroup);
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

    function renderMembers(members) {
        if (!Array.isArray(members) || members.length === 0) {
            memberList.innerHTML = '<div class="member-empty">참여 가능한 워크스페이스 멤버가 없습니다.</div>';
            return;
        }

        const sorted = members.slice().sort(function (a, b) {
            const aId = String(a.USER_ID || a.userId || a.user_id || '');
            const bId = String(b.USER_ID || b.userId || b.user_id || '');
            if (aId === currentUserId) return -1;
            if (bId === currentUserId) return 1;
            return 0;
        });

        memberList.innerHTML = sorted.map(function (member, index) {
            const userId = String(member.USER_ID || member.userId || member.user_id || '');
            const userName = member.USER_NAME || member.userName || member.user_name || '이름 없음';
            const email = member.EMAIL || member.email || '';
            const isCurrent = userId === currentUserId || (!currentUserId && index === 0);
            return '<div class="member-row" data-user-id="' + escapeHtml(userId) + '">'
                + '<div class="member-main">'
                + '<input class="member-check" type="checkbox" ' + (isCurrent ? 'checked' : '') + ' aria-label="멤버 선택">'
                + '<div class="member-avatar">' + escapeHtml(userName.substring(0, 1)) + '</div>'
                + '<div class="member-info"><span class="member-name">' + escapeHtml(userName) + (isCurrent ? ' (나)' : '') + '</span>'
                + '<span class="member-email">' + escapeHtml(email) + '</span></div></div>'
                + '<select class="member-role" aria-label="프로젝트 권한" ' + (isCurrent ? '' : 'disabled') + '>'
                + '<option value="MEMBER">멤버</option>'
                + '<option value="ADMIN">관리자</option>'
                + '<option value="LEADER" ' + (isCurrent ? 'selected' : '') + '>팀장</option>'
                + '</select></div>';
        }).join('');
    }

    function loadMembers() {
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
                selected.push({ userId: row.dataset.userId, role: role ? role.value : 'MEMBER' });
            }
        });
        return selected;
    }

    function validateAndBuildPayload() {
        const projName = document.getElementById('projName').value.trim();
        const projScope = getScope();
        const projCategory = document.getElementById('projCategory').value;
        const projCategoryDetail = document.getElementById('projCategoryDetail').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const projDesc = document.getElementById('projDesc').value.trim();

        if (!projName) { alert('프로젝트명을 입력해주세요.'); document.getElementById('projName').focus(); return null; }
        if (projCategory === 'ETC' && !projCategoryDetail) {
            alert('기타 카테고리명을 입력해주세요.');
            document.getElementById('projCategoryDetail').focus();
            return null;
        }
        if (!startDate || !endDate) { alert('프로젝트 기간을 입력해주세요.'); return null; }
        if (startDate > endDate) { alert('종료일은 시작일보다 빠를 수 없습니다.'); return null; }

        let leaderId = currentUserId;
        let memberIds = currentUserId ? [currentUserId] : [];
        let adminIds = [];

        if (projScope === 'GROUP') {
            const selected = collectMemberSettings();
            const leaders = selected.filter(function (item) { return item.role === 'LEADER'; });
            if (selected.length === 0) { alert('참여 멤버를 한 명 이상 선택해주세요.'); return null; }
            if (leaders.length !== 1) { alert('팀장은 반드시 1명만 지정해야 합니다.'); return null; }
            leaderId = leaders[0].userId;
            memberIds = selected.map(function (item) { return item.userId; });
            adminIds = selected.filter(function (item) { return item.role === 'ADMIN'; })
                .map(function (item) { return item.userId; });
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
            startDate: startDate,
            endDate: endDate
        };
    }

    document.addEventListener('change', function (event) {
        if (event.target.matches('input[name="projScope"]')) updateScopeUI();
        if (event.target.matches('#projCategory')) updateCategoryUI();

        if (event.target.matches('.member-check')) {
            const row = event.target.closest('.member-row');
            const role = row.querySelector('.member-role');
            role.disabled = !event.target.checked;
            row.classList.toggle('is-disabled', !event.target.checked);
            if (!event.target.checked && role.value === 'LEADER') role.value = 'MEMBER';
        }

        if (event.target.matches('.member-role')) {
            const row = event.target.closest('.member-row');
            const checkbox = row.querySelector('.member-check');
            checkbox.checked = true;
            event.target.disabled = false;
            row.classList.remove('is-disabled');
            if (event.target.value === 'LEADER') {
                document.querySelectorAll('.member-role').forEach(function (select) {
                    if (select !== event.target && select.value === 'LEADER') select.value = 'MEMBER';
                });
            }
        }
    });

    document.getElementById('startDate').addEventListener('change', syncEndDate);
    function goWorkspaceMain() {
        location.href = contextPath + '/workspace/main?wsId=' + encodeURIComponent(wsId);
    }

    document.getElementById('btnCancel').addEventListener('click', goWorkspaceMain);
    const topCancelButton = document.getElementById('btnCancelTop');
    if (topCancelButton) topCancelButton.addEventListener('click', goWorkspaceMain);

    submitButton.addEventListener('click', function () {
        const payload = validateAndBuildPayload();
        if (!payload) return;
        submitButton.disabled = true;
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
            submitButton.textContent = '프로젝트 생성';
        });
    });

    setDefaultDates();
    updateScopeUI();
    updateCategoryUI();
    loadMembers();
})();
