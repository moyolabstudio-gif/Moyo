
function switchProjectSettingsTab(tabName) {
    const basic = document.getElementById('projectSettingsBasic');
    const members = document.getElementById('projectSettingsMembers');

    if (!basic || !members) return;

    basic.classList.toggle('is-active', tabName === 'basic');
    members.classList.toggle('is-active', tabName === 'members');

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


function addProjectSettingLink(name, url) {
    const list = document.getElementById('projectSettingLinkList');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'project-settings-link-row';
    row.innerHTML =
        '<input type="text" class="project-setting-link-name" maxlength="50" placeholder="링크 이름">' +
        '<input type="text" class="project-setting-link-url" maxlength="500" placeholder="https://...">' +
        '<button type="button" class="project-setting-link-remove" onclick="removeProjectSettingLink(this)">×</button>';
    row.querySelector('.project-setting-link-name').value = name || '';
    row.querySelector('.project-setting-link-url').value = url || '';
    list.appendChild(row);
}

function removeProjectSettingLink(button) {
    const list = document.getElementById('projectSettingLinkList');
    if (!list) return;

    const rows = list.querySelectorAll('.project-settings-link-row');
    if (rows.length <= 1) {
        rows[0].querySelectorAll('input').forEach(function(input) { input.value = ''; });
        return;
    }
    button.closest('.project-settings-link-row').remove();
}

function collectProjectSettingLinks() {
    return Array.from(document.querySelectorAll('#projectSettingLinkList .project-settings-link-row'))
        .map(function(row) {
            return {
                linkName: row.querySelector('.project-setting-link-name').value.trim(),
                linkUrl: row.querySelector('.project-setting-link-url').value.trim()
            };
        })
        .filter(function(link) {
            return link.linkName || link.linkUrl;
        });
}

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
        projDesc: document.getElementById('settingProjDesc').value.trim(),
        links: collectProjectSettingLinks()
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


function saveProjectMemberSetting(button) {
    const config = window.PROJECT_SETTINGS_CONFIG;

    if (!config.canManageProject) {
        alert('멤버 설정 수정 권한이 없습니다.');
        return;
    }

    const row = button ? button.closest('.member-role-row') : null;
    if (!row) {
        alert('저장할 멤버 정보를 찾을 수 없습니다.');
        return;
    }

    const userId = row.dataset.userId;
    const input = row.querySelector('.proj-position-input');
    const roleSelect = row.querySelector('.proj-role-select');
    const role = roleSelect ? roleSelect.value : 'MEMBER';
    const position = input ? input.value.trim() : '';

    if (!userId) {
        alert('저장할 멤버 정보를 찾을 수 없습니다.');
        return;
    }

    if (role === 'LEADER' && !config.isProjectLeader) {
        alert('팀장 권한은 현재 팀장만 수정할 수 있습니다.');
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '저장 중';

    const params = new URLSearchParams();
    params.append('projId', config.projId);
    params.append('userId', userId);
    params.append('projPosition', position);
    params.append('projRole', role);

    fetch(config.contextPath + '/project/api/update-member-setting', {
        method: 'POST',
        body: params
    })
    .then(function(response) {
        if (!response.ok) throw new Error('SAVE_FAILED');
        return response.text();
    })
    .then(function(result) {
        if (result === 'SUCCESS') {
            button.textContent = '저장됨';
            setTimeout(function() {
                button.textContent = originalText;
                button.disabled = false;
            }, 900);
        } else if (result === 'NO_PERMISSION') {
            alert('멤버 설정 수정 권한이 없습니다.');
            button.textContent = originalText;
            button.disabled = false;
        } else if (result === 'LEADER_ONLY') {
            alert('팀장 위임은 현재 팀장만 할 수 있습니다.');
            button.textContent = originalText;
            button.disabled = false;
        } else if (result === 'LEADER_ROLE_LOCKED') {
            alert('현재 팀장의 권한은 직접 변경할 수 없습니다.');
            button.textContent = originalText;
            button.disabled = false;
        } else if (result === 'INVALID_ROLE') {
            alert('잘못된 멤버 권한 값입니다.');
            button.textContent = originalText;
            button.disabled = false;
        } else {
            alert('멤버 설정 저장에 실패했습니다.');
            button.textContent = originalText;
            button.disabled = false;
        }
    })
    .catch(function(err) {
        console.error('멤버 설정 저장 오류:', err);
        alert('멤버 설정 저장 중 오류가 발생했습니다.');
        button.textContent = originalText;
        button.disabled = false;
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
            } else if (failed.includes('LEADER_ONLY')) {
                alert('팀장 위임은 현재 팀장만 할 수 있습니다.');
            } else if (failed.includes('LEADER_ROLE_LOCKED')) {
                alert('현재 팀장의 권한은 직접 변경할 수 없습니다.');
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



function setProjectMemberAddModalVisible(visible) {
    const overlay = document.getElementById('projectMemberAddOverlay');
    const modal = document.getElementById('projectMemberAddModal');
    if (!overlay || !modal) return;

    overlay.style.display = visible ? 'block' : 'none';
    modal.style.display = visible ? 'block' : 'none';
    document.body.classList.toggle('project-member-modal-open', visible);
}

function openProjectMemberAddModal() {
    setProjectMemberAddModalVisible(true);
    loadAssignableProjectMembersForModal();
}

function closeProjectMemberAddModal() {
    setProjectMemberAddModalVisible(false);

    const list = document.getElementById('projectMemberCandidateList');
    const count = document.getElementById('projectMemberSelectedCount');
    if (list) {
        list.innerHTML =
            '<div class="project-member-candidate-empty">멤버를 불러오는 중입니다.</div>';
    }
    if (count) count.textContent = '0명 선택';
}

function escapeProjectMemberHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateProjectMemberSelectedCount() {
    const count = document.querySelectorAll(
        '#projectMemberCandidateList .project-member-checkbox:checked'
    ).length;

    const countElement = document.getElementById('projectMemberSelectedCount');
    if (countElement) {
        countElement.textContent = count + '명 선택';
    }
}

function loadAssignableProjectMembersForModal() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    const list = document.getElementById('projectMemberCandidateList');

    if (!list) return;

    list.innerHTML =
        '<div class="project-member-candidate-empty">멤버를 불러오는 중입니다.</div>';

    fetch(config.contextPath
        + '/project/api/assignable-members?wsId=' + encodeURIComponent(config.wsId)
        + '&projId=' + encodeURIComponent(config.projId))
        .then(function(response) {
            if (!response.ok) throw new Error('LOAD_FAILED');
            return response.json();
        })
        .then(function(members) {
            if (!Array.isArray(members) || members.length === 0) {
                list.innerHTML =
                    '<div class="project-member-candidate-empty">추가 가능한 멤버가 없습니다.</div>';
                updateProjectMemberSelectedCount();
                return;
            }

            list.innerHTML = members.map(function(member) {
                const userId = member.USER_ID || member.userId;
                const userName = member.USER_NAME || member.userName || '이름 없음';
                const email = member.EMAIL || member.email || '';
                const initial = userName ? userName.substring(0, 1) : '?';

                return '<label class="project-member-candidate-row">' +
                    '<input type="checkbox" class="project-member-checkbox" value="' +
                        escapeProjectMemberHtml(userId) +
                        '" onchange="updateProjectMemberSelectedCount()">' +
                    '<span class="project-member-candidate-avatar">' +
                        escapeProjectMemberHtml(initial) +
                    '</span>' +
                    '<span class="project-member-candidate-info">' +
                        '<strong>' + escapeProjectMemberHtml(userName) + '</strong>' +
                        '<small>' + escapeProjectMemberHtml(email) + '</small>' +
                    '</span>' +
                    '<span class="project-member-candidate-check">선택</span>' +
                '</label>';
            }).join('');

            updateProjectMemberSelectedCount();
        })
        .catch(function(error) {
            console.error('추가 가능 멤버 로딩 오류:', error);
            list.innerHTML =
                '<div class="project-member-candidate-empty">멤버를 불러오지 못했습니다.</div>';
        });
}

function addCheckedProjectMembers() {
    const config = window.PROJECT_SETTINGS_CONFIG;
    const checked = Array.from(document.querySelectorAll(
        '#projectMemberCandidateList .project-member-checkbox:checked'
    ));

    if (checked.length === 0) {
        alert('추가할 멤버를 한 명 이상 선택해주세요.');
        return;
    }

    const params = new URLSearchParams();
    params.append('projId', config.projId);
    checked.forEach(function(checkbox) {
        params.append('userIds', checkbox.value);
    });

    fetch(config.contextPath + '/project/api/add-members', {
        method: 'POST',
        body: params
    })
    .then(function(response) {
        if (!response.ok) throw new Error('ADD_FAILED');
        return response.text();
    })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert(checked.length + '명의 멤버를 프로젝트에 추가했습니다.');
            location.reload();
        } else if (result === 'NO_PERMISSION') {
            alert('멤버 추가 권한이 없습니다.');
        } else if (result === 'ALREADY_EXISTS') {
            alert('선택한 멤버 중 이미 프로젝트에 참여 중인 멤버가 있습니다.');
        } else {
            alert('멤버 추가에 실패했습니다.');
        }
    })
    .catch(function(error) {
        console.error('프로젝트 멤버 추가 오류:', error);
        alert('멤버 추가 중 오류가 발생했습니다.');
    });
}

function transferProjectLeader(userId, memberName) {
    const config = window.PROJECT_SETTINGS_CONFIG;
    const row = document.querySelector(
        '.member-role-row[data-user-id="' + userId + '"]'
    );
    const positionInput = row ? row.querySelector('.proj-position-input') : null;

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
        } else if (result === 'LEADER_ONLY') {
            alert('프로젝트 삭제는 팀장만 가능합니다.');
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


function initProjectLeaderSelectTransfer() {
    document.querySelectorAll('.member-role-row .proj-role-select').forEach(function(select) {
        select.dataset.originalRole = select.value;
        if (select.disabled) return;

        select.addEventListener('change', function() {
            if (select.value !== 'LEADER') {
                select.dataset.originalRole = select.value;
                return;
            }

            const row = select.closest('.member-role-row');
            const userId = row ? row.dataset.userId : '';
            const nameEl = row ? row.querySelector('.member-meta strong') : null;
            const memberName = nameEl ? nameEl.textContent.trim() : '해당 멤버';

            if (!userId) {
                alert('팀장으로 지정할 멤버 정보를 찾을 수 없습니다.');
                select.value = select.dataset.originalRole || 'MEMBER';
                return;
            }

            const previousRole = select.dataset.originalRole || 'MEMBER';
            select.value = previousRole;
            transferProjectLeader(userId, memberName);
        });
    });
}


function initProjectMemberSearch() {
    const input = document.getElementById('projectMemberSearchInput');
    const empty = document.getElementById('projectMemberEmpty');
    const rows = Array.from(document.querySelectorAll('.member-role-row'));
    if (!input || !rows.length) return;

    function applyFilter() {
        const keyword = input.value.trim().toLowerCase();
        let visibleCount = 0;

        rows.forEach(function(row) {
            const name = row.querySelector('.workspace-member-manage-name, .member-meta strong')?.textContent || '';
            const email = row.querySelector('.workspace-member-manage-email, .member-meta span')?.textContent || '';
            const position = row.querySelector('.proj-position-input')?.value || '';
            const role = row.querySelector('.proj-role-select option:checked')?.textContent || '';
            const text = (name + ' ' + email + ' ' + position + ' ' + role).toLowerCase();
            const matched = !keyword || text.includes(keyword);
            row.style.display = matched ? 'grid' : 'none';
            if (matched) visibleCount += 1;
        });

        if (empty) empty.classList.toggle('is-visible', visibleCount === 0);
    }

    input.addEventListener('input', applyFilter);
    rows.forEach(function(row) {
        const positionInput = row.querySelector('.proj-position-input');
        if (positionInput) positionInput.addEventListener('input', applyFilter);
        const roleSelect = row.querySelector('.proj-role-select');
        if (roleSelect) roleSelect.addEventListener('change', applyFilter);
    });
    applyFilter();
}


document.addEventListener('DOMContentLoaded', function () {
    const categorySelect = document.getElementById('settingProjCategory');
    if (categorySelect) categorySelect.addEventListener('change', updateSettingCategoryUI);
    updateSettingCategoryUI();
    initProjectLeaderSelectTransfer();
    initProjectMemberSearch();

    const params = new URLSearchParams(window.location.search);
    switchProjectSettingsTab(
        params.get('tab') === 'members' ? 'members' : 'basic'
    );
});


document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;

    const modal = document.getElementById('projectMemberAddModal');
    if (modal && modal.style.display === 'block') {
        closeProjectMemberAddModal();
    }
});
