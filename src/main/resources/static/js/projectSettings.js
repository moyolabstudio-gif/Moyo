function goProjectMain() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    location.href = config.contextPath + '/project/main?wsId=' + encodeURIComponent(config.wsId)
        + '&projId=' + encodeURIComponent(config.projId);
}

function updateSettingCategoryUI() {
    const select = document.getElementById('settingProjCategory');
    const field = document.getElementById('settingCustomCategoryField');
    const input = document.getElementById('settingProjCategoryDetail');
    if (!select || !field || !input) return;

    const isEtc = select.value === 'ETC';
    field.style.display = isEtc ? '' : 'none';
    input.required = isEtc;
    if (!isEtc) input.value = '';
}

function saveProjectInfo() {
    const config = window.PROJECT_SETTINGS_CONFIG;

    if (!config.canManageProject) {
        alert('프로젝트 설정 권한이 없습니다.');
        return;
    }

    const payload = {
        projId: config.projId,
        projName: document.getElementById('settingProjName').value.trim(),
        projCategory: document.getElementById('settingProjCategory').value,
        projCategoryDetail: document.getElementById('settingProjCategory').value === 'ETC'
            ? document.getElementById('settingProjCategoryDetail').value.trim()
            : null,
        projType: document.getElementById('settingProjCategory').value,
        startDate: document.getElementById('settingStartDate').value,
        endDate: document.getElementById('settingEndDate').value,
        projDesc: document.getElementById('settingProjDesc').value.trim()
    };

    if (!payload.projName) {
        alert('프로젝트명을 입력해주세요.');
        return;
    }

    if (payload.projCategory === 'ETC' && !payload.projCategoryDetail) {
        alert('기타 카테고리명을 입력해주세요.');
        document.getElementById('settingProjCategoryDetail').focus();
        return;
    }

    if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
        alert('마감일은 시작일보다 빠를 수 없습니다.');
        return;
    }

    fetch(config.contextPath + '/project/api/update-project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(payload)
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert('프로젝트 정보가 저장되었습니다.');
        } else {
            alert('프로젝트 정보 저장에 실패했습니다.');
        }
    })
    .catch(function(err) {
        console.error('프로젝트 정보 저장 오류:', err);
        alert('프로젝트 정보 저장 중 오류가 발생했습니다.');
    });
}

function saveMemberPositions() {
    const config = window.PROJECT_SETTINGS_CONFIG;

    if (!config.canManageProject) {
        alert('멤버 설정 수정 권한이 없습니다.');
        return;
    }

    const rows = Array.from(document.querySelectorAll('.member-role-row'));

    if (rows.length === 0) {
        alert('저장할 멤버가 없습니다.');
        return;
    }

    const leaderRows = rows.filter(function(row) {
        const roleSelect = row.querySelector('.proj-role-select');
        return roleSelect && roleSelect.value === 'LEADER';
    });

    if (leaderRows.length !== 1) {
        alert('팀장은 반드시 1명만 선택해야 합니다.');
        return;
    }

    if (!confirm('멤버 권한과 역할을 저장하시겠습니까?')) {
        return;
    }

    const requests = rows.map(function(row) {
        const userId = row.dataset.userId;
        const input = row.querySelector('.proj-position-input');
        const roleSelect = row.querySelector('.proj-role-select');
        const params = new URLSearchParams();

        params.append('projId', config.projId);
        params.append('userId', userId);
        params.append('projPosition', input ? input.value.trim() : '');
        params.append('projRole', roleSelect ? roleSelect.value : 'MEMBER');

        return fetch(config.contextPath + '/project/api/update-member-setting', {
            method: 'POST',
            body: params
        }).then(function(res) { return res.text(); });
    });

    Promise.all(requests)
        .then(function(results) {
            const failed = results.filter(function(result) {
                return result !== 'SUCCESS';
            });

            if (failed.length === 0) {
                alert('멤버 설정이 저장되었습니다.');
                location.reload();
            } else if (failed.includes('NO_PERMISSION')) {
                alert('멤버 설정 수정 권한이 없습니다.');
            } else if (failed.includes('INVALID_ROLE')) {
                alert('잘못된 멤버 권한 값이 포함되어 있습니다.');
            } else {
                alert('일부 멤버 설정 저장에 실패했습니다.');
            }
        })
        .catch(function(err) {
            console.error('멤버 설정 저장 오류:', err);
            alert('멤버 설정 저장 중 오류가 발생했습니다.');
        });
}


function toggleAddMemberPanel() {
    const panel = document.getElementById('memberAddPanel');
    if (!panel) return;

    const nextVisible = panel.style.display === 'none' || !panel.style.display;
    panel.style.display = nextVisible ? 'flex' : 'none';

    if (nextVisible) {
        loadAssignableProjectMembers();
    }
}

function loadAssignableProjectMembers() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    const select = document.getElementById('assignableMemberSelect');

    if (!select) return;

    select.innerHTML = '<option value="">불러오는 중...</option>';

    fetch(config.contextPath + '/project/api/assignable-members?wsId=' + encodeURIComponent(config.wsId)
        + '&projId=' + encodeURIComponent(config.projId))
        .then(function(res) { return res.json(); })
        .then(function(members) {
            select.innerHTML = '<option value="">추가할 멤버를 선택하세요</option>';

            if (!members || members.length === 0) {
                select.innerHTML = '<option value="">추가 가능한 멤버가 없습니다</option>';
                return;
            }

            members.forEach(function(member) {
                const option = document.createElement('option');
                option.value = member.USER_ID || member.userId;
                option.textContent = (member.USER_NAME || member.userName || '이름 없음')
                    + (member.EMAIL || member.email ? ' (' + (member.EMAIL || member.email) + ')' : '');
                select.appendChild(option);
            });
        })
        .catch(function(err) {
            console.error('추가 가능 멤버 로딩 오류:', err);
            select.innerHTML = '<option value="">멤버를 불러오지 못했습니다</option>';
        });
}

function addSelectedProjectMember() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    const select = document.getElementById('assignableMemberSelect');

    if (!select || !select.value) {
        alert('추가할 멤버를 선택해주세요.');
        return;
    }

    const params = new URLSearchParams();
    params.append('projId', config.projId);
    params.append('userIds', select.value);

    fetch(config.contextPath + '/project/api/add-members', {
        method: 'POST',
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert('멤버가 추가되었습니다.');
            location.reload();
        } else if (result === 'NO_PERMISSION') {
            alert('멤버 추가 권한이 없습니다.');
        } else if (result === 'ALREADY_EXISTS') {
            alert('이미 프로젝트에 참여 중인 멤버입니다.');
        } else {
            alert('멤버 추가에 실패했습니다.');
        }
    })
    .catch(function(err) {
        console.error('멤버 추가 오류:', err);
        alert('멤버 추가 중 오류가 발생했습니다.');
    });
}

function removeProjectMember(userId, userName) {
    const config = window.PROJECT_SETTINGS_CONFIG;

    if (!confirm((userName || '해당 멤버') + '님을 프로젝트에서 삭제하시겠습니까?')) {
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
            alert('멤버가 삭제되었습니다.');
            location.reload();
        } else if (result === 'NO_PERMISSION') {
            alert('멤버 삭제 권한이 없습니다.');
        } else if (result === 'CANNOT_REMOVE_LEADER') {
            alert('팀장은 삭제할 수 없습니다. 먼저 팀장을 다른 멤버로 변경해주세요.');
        } else {
            alert('멤버 삭제에 실패했습니다.');
        }
    })
    .catch(function(err) {
        console.error('멤버 삭제 오류:', err);
        alert('멤버 삭제 중 오류가 발생했습니다.');
    });
}


function deleteProjectFromSettings() {
    const config = window.PROJECT_SETTINGS_CONFIG;

    if (!config.canManageProject) {
        alert('프로젝트 삭제 권한이 없습니다.');
        return;
    }

    const firstConfirm = confirm('정말 이 프로젝트를 삭제하시겠습니까?\\n삭제 후에는 되돌리기 어렵습니다.');
    if (!firstConfirm) {
        return;
    }

    const typed = prompt('삭제하려면 "삭제"를 입력하세요.');
    if (typed !== '삭제') {
        alert('삭제가 취소되었습니다.');
        return;
    }

    const params = new URLSearchParams();
    params.append('projId', config.projId);

    fetch(config.contextPath + '/project/api/delete-project', {
        method: 'POST',
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert('프로젝트가 삭제되었습니다.');
            location.href = config.contextPath + '/workspace/main?wsId=' + encodeURIComponent(config.wsId);
        } else if (result === 'NO_PERMISSION') {
            alert('프로젝트 삭제 권한이 없습니다.');
        } else {
            alert('프로젝트 삭제에 실패했습니다.');
        }
    })
    .catch(function(err) {
        console.error('프로젝트 삭제 오류:', err);
        alert('프로젝트 삭제 중 오류가 발생했습니다.');
    });
}


document.addEventListener('DOMContentLoaded', function () {
    const categorySelect = document.getElementById('settingProjCategory');
    if (categorySelect) categorySelect.addEventListener('change', updateSettingCategoryUI);
    updateSettingCategoryUI();
});
