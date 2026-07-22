/**
 * MOYO 프로젝트 멤버
 * 멤버 조회/추가, 역할 통계, 멤버 프로필을 담당합니다.
 */

function openInviteModal() {
            openAssignModal();
        }


function escapeProjectMemberHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function updateAssignSelectedCount() {
            const count = document.querySelectorAll(
                '#assignableList .project-member-checkbox:checked'
            ).length;

            const countEl = document.getElementById('assignSelectedCount');
            if (countEl) countEl.textContent = count + '명 선택';
        }

        function openAssignModal() {
            const urlParams = new URLSearchParams(window.location.search);
            const wsId = urlParams.get('wsId');
            const projId = urlParams.get('projId');
            const listDiv = document.getElementById('assignableList');

            if (!listDiv) return;

            listDiv.innerHTML =
                '<div class="project-member-candidate-empty">' +
                '멤버를 불러오는 중입니다.' +
                '</div>';

            updateAssignSelectedCount();
            openModal('assignMemberModal');

            fetch('/project/api/assignable-members?wsId=' +
                    encodeURIComponent(wsId || '') +
                    '&projId=' + encodeURIComponent(projId || ''))
                .then(function(res) {
                    if (!res.ok) throw new Error('ASSIGNABLE_MEMBER_LOAD_FAILED');
                    return res.json();
                })
                .then(function(members) {
                    if (!Array.isArray(members) || members.length === 0) {
                        listDiv.innerHTML =
                            '<div class="project-member-candidate-empty">' +
                            '추가 가능한 멤버가 없습니다.' +
                            '</div>';
                        updateAssignSelectedCount();
                        return;
                    }

                    listDiv.innerHTML = members.map(function(member) {
                        const userId = member.USER_ID || member.userId || '';
                        const userName =
                            member.USER_NAME || member.userName || '이름 없음';
                        const email = member.EMAIL || member.email || '';
                        const profileImage =
                            member.PROFILE_IMAGE_PATH ||
                            member.profileImagePath ||
                            member.PROFILE_IMAGE ||
                            member.profileImage ||
                            '';
                        const initial =
                            Array.from(String(userName).trim())[0] || '?';

                        const avatar = profileImage
                            ? '<img src="' +
                              escapeProjectMemberHtml(profileImage) +
                              '" alt="" onerror="' +
                              "this.style.display='none';" +
                              "this.nextElementSibling.style.display='flex';" +
                              '">' +
                              '<span style="display:none;">' +
                              escapeProjectMemberHtml(initial) +
                              '</span>'
                            : '<span>' +
                              escapeProjectMemberHtml(initial) +
                              '</span>';

                        return '<label class="project-member-candidate-row">' +
                            '<input type="checkbox" ' +
                                'class="project-member-checkbox" value="' +
                                escapeProjectMemberHtml(userId) +
                                '" onchange="updateAssignSelectedCount()">' +
                            '<span class="project-member-candidate-avatar">' +
                                avatar +
                            '</span>' +
                            '<span class="project-member-candidate-info">' +
                                '<strong>' +
                                    escapeProjectMemberHtml(userName) +
                                '</strong>' +
                                '<small>' +
                                    escapeProjectMemberHtml(email) +
                                '</small>' +
                            '</span>' +
                            '<span class="project-member-candidate-check">' +
                                '선택' +
                            '</span>' +
                        '</label>';
                    }).join('');

                    updateAssignSelectedCount();
                })
                .catch(function(error) {
                    console.error('추가 가능 멤버 로딩 오류:', error);
                    listDiv.innerHTML =
                        '<div class="project-member-candidate-empty is-error">' +
                        '멤버를 불러오지 못했습니다.' +
                        '</div>';
                    updateAssignSelectedCount();
                });
        }

        function submitAssign() {
            const projId =
                new URLSearchParams(window.location.search).get('projId');

            const checked = Array.from(document.querySelectorAll(
                '#assignableList .project-member-checkbox:checked'
            ));

            if (checked.length === 0) {
                alert('추가할 멤버를 한 명 이상 선택해주세요.');
                return;
            }

            const params = new URLSearchParams();
            params.append('projId', projId);

            checked.forEach(function(checkbox) {
                params.append('userIds', checkbox.value);
            });

            fetch('/project/api/add-members', {
                method: 'POST',
                body: params
            })
            .then(function(response) {
                if (!response.ok) throw new Error('ADD_FAILED');
                return response.text();
            })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    alert(checked.length +
                        '명의 멤버를 프로젝트에 추가했습니다.');
                    location.reload();
                } else if (result === 'NO_PERMISSION') {
                    alert('멤버 추가 권한이 없습니다.');
                } else if (result === 'ALREADY_EXISTS') {
                    alert('이미 프로젝트에 참여 중인 멤버가 있습니다.');
                } else {
                    alert('멤버 추가에 실패했습니다.');
                }
            })
            .catch(function(error) {
                console.error('프로젝트 멤버 추가 오류:', error);
                alert('멤버 추가 중 오류가 발생했습니다.');
            });
        }


        function getMemberInitialText(name) {
            const text = String(name || '?').trim();
            return text.substring(0, 1);
        }

        function normalizeProjectRole(role, isLeader) {
            const roleText = String(role || '').toUpperCase();

            if (isLeader) {
                return {
                    text: '팀장',
                    className: 'leader'
                };
            }

            if (roleText === 'ADMIN' || roleText === 'OWNER' || roleText === 'LEADER' || roleText === 'PM') {
                return {
                    text: '관리자',
                    className: 'admin'
                };
            }

            return {
                text: '멤버',
                className: ''
            };
        }

        function buildTaskStatsByMember(tasks) {
            const stats = {};

            (tasks || []).forEach(function(task) {
                const userId = String(task.USER_ID || task.userId || '');
                if (!userId) return;

                if (!stats[userId]) {
                    stats[userId] = {
                        todo: 0,
                        progress: 0,
                        done: 0,
                        delay: 0,
                        total: 0
                    };
                }

                const status = String(task.STATUS || task.status || 'TODO').toUpperCase();
                const endDate = task.END_DATE || task.endDate || '';
                const taskUseTime = isTaskTimeEnabledFromData(task);
                const endTime = taskUseTime ? (task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot || '18:00') : '18:00';
                const isDelayed = isTaskDelayed(endDate, endTime, status);

                stats[userId].total++;

                if (status === 'IN_PROGRESS') {
                    stats[userId].progress++;
                } else if (status === 'DONE') {
                    stats[userId].done++;
                } else {
                    stats[userId].todo++;
                }

                if (isDelayed) {
                    stats[userId].delay++;
                }
            });

            return stats;
        }






        function updateProjectMemberPosition(userId, projPosition) {
            const projId = new URLSearchParams(window.location.search).get('projId');
            const params = new URLSearchParams();

            params.append('projId', projId);
            params.append('userId', userId);
            params.append('projPosition', projPosition || '');

            fetch('/project/api/update-member-position', {
                method: 'POST',
                body: params
            })
            .then(function(res) { return res.text(); })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    refreshProjectMemberPanel();
                } else if (result === 'NO_PERMISSION') {
                    alert('프로젝트 멤버 역할은 팀장 또는 관리자만 수정할 수 있습니다.');
                } else if (result === 'LOGIN_FAIL') {
                    alert('로그인이 필요합니다.');
                } else {
                    alert('역할 저장에 실패했습니다.');
                }
            })
            .catch(function(err) {
                console.error('프로젝트 멤버 역할 저장 실패:', err);
                alert('역할 저장 중 오류가 발생했습니다.');
            });
        }


function renderProjectMemberList(members, tasks) {
    const listEl = document.getElementById('projectMemberList');
    const countEl = document.getElementById('projectMemberCount');

    if (!listEl) return;

    const memberList = Array.isArray(members) ? members : [];
    const taskList = normalizeProjectTasks(tasks);

    const taskStats = {};
    memberList.forEach(function(member) {
        const userId = String(member.USER_ID || member.userId || '');
        taskStats[userId] = { total: 0, todo: 0, progress: 0, done: 0, delay: 0 };
    });

    taskList.forEach(function(task) {
        const userId = String(task.ASSIGNED_USER_ID || task.assignedUserId || task.USER_ID || task.userId || '');
        if (!userId) return;

        if (!taskStats[userId]) {
            taskStats[userId] = { total: 0, todo: 0, progress: 0, done: 0, delay: 0 };
        }

        const status = String(task.STATUS || task.status || 'TODO').toUpperCase();
        const delayed = (typeof isProjectMemberTaskDelayedSafe === 'function')
            ? isProjectMemberTaskDelayedSafe(
                task.END_DATE || task.endDate,
                task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot,
                status
            )
            : (typeof isTaskDelayed === 'function'
                ? isTaskDelayed(task.END_DATE || task.endDate, task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot, status)
                : false);

        if (status === 'DONE') {
            taskStats[userId].done += 1;
        } else if (status === 'IN_PROGRESS') {
            taskStats[userId].progress += 1;
        } else {
            taskStats[userId].todo += 1;
        }

        if (delayed) {
            taskStats[userId].delay += 1;
        }

        // 전체는 지연 중복 카운트 없이 상태 업무 수만 합산합니다.
        taskStats[userId].total = taskStats[userId].todo + taskStats[userId].progress + taskStats[userId].done;
    });

    if (countEl) {
        countEl.textContent = memberList.length;
    }

    if (memberList.length === 0) {
        listEl.innerHTML = '<div class="project-member-empty">참여 중인 멤버가 없습니다.</div>';
        return;
    }

    const projectLeaderId = String(
        window.PROJECT_MAIN_CONFIG?.projectLeaderId ||
        window.PROJECT_MAIN_CONFIG?.leaderId ||
        ''
    );

    const sorted = memberList.slice().sort(function(a, b) {
        const aId = String(a.USER_ID || a.userId || '');
        const bId = String(b.USER_ID || b.userId || '');
        const aLeader = String(projectLeaderId) === aId;
        const bLeader = String(projectLeaderId) === bId;

        if (aLeader !== bLeader) return aLeader ? -1 : 1;

        const aStats = taskStats[aId] || { total: 0, todo: 0, progress: 0, done: 0, delay: 0 };
        const bStats = taskStats[bId] || { total: 0, todo: 0, progress: 0, done: 0, delay: 0 };

        if (bStats.total !== aStats.total) return bStats.total - aStats.total;
        if (bStats.delay !== aStats.delay) return bStats.delay - aStats.delay;
        if (bStats.progress !== aStats.progress) return bStats.progress - aStats.progress;

        return String(a.USER_NAME || a.userName || '').localeCompare(String(b.USER_NAME || b.userName || ''), 'ko');
    });

    let html = '';

    sorted.forEach(function(member) {
        const userId = String(member.USER_ID || member.userId || '');
        const userName = member.USER_NAME || member.userName || '이름 없음';
        const projPosition = member.PROJ_POSITION || member.projPosition || '';
        const isLeader = String(projectLeaderId) === userId;
        const role = normalizeProjectRole(member.PROJ_ROLE || member.projRole, isLeader);
        const roleClass = role.className || 'member';
        const stats = taskStats[userId] || { total: 0, todo: 0, progress: 0, done: 0, delay: 0 };

        const profileImage = member.PROFILE_IMAGE_PATH || member.profileImagePath || '';
        const avatarHtml = profileImage
            ? '<img src="' + escapeTaskHtml(profileImage) + '" alt="">'
            : escapeTaskHtml(getMemberInitialText(userName));

        html += '<div class="moyo-member-card" role="button" tabindex="0" '
            + 'onclick="openProjectMemberProfile(' + userId + ')" '
            + 'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openProjectMemberProfile(' + userId + ');}">';
        html += '   <div class="moyo-member-top">';
        html += '       <div class="moyo-member-avatar">' + avatarHtml + '</div>';
        html += '       <div class="moyo-member-main">';
        html += '           <div class="moyo-member-name-line">';
        html += '               <span class="moyo-member-name" title="' + escapeTaskHtml(userName) + '">' + escapeTaskHtml(userName) + '</span>';
        html += '               <span class="moyo-member-role ' + roleClass + '">' + escapeTaskHtml(role.text) + '</span>';
        html += '           </div>';
        html += '           <div class="moyo-member-position ' + (projPosition ? '' : 'empty') + '" title="' + escapeTaskHtml(projPosition || '역할 미지정') + '">' + escapeTaskHtml(projPosition || '역할 미지정') + '</div>';
        html += '       </div>';
        html += '   </div>';
        html += '   <div class="moyo-member-stats" aria-label="멤버 업무 현황">';
        html += '       <span class="moyo-member-stat total">전체 ' + stats.total + '</span>';
        html += '       <span class="moyo-member-stat todo">할일 ' + stats.todo + '</span>';
        html += '       <span class="moyo-member-stat progress">진행 ' + stats.progress + '</span>';
        html += '       <span class="moyo-member-stat done">완료 ' + stats.done + '</span>';
        html += '       <span class="moyo-member-stat delay">지연 ' + stats.delay + '</span>';
        html += '   </div>';
        html += '</div>';
    });

    listEl.innerHTML = html;
}


function goProjectWorkList() {
            const query = buildProjectMainQuery(true);
            if (!query.get('projId')) {
                alert('프로젝트 정보를 찾을 수 없습니다.');
                return;
            }
            location.href = '/project/work/list?' + query.toString();
        }


function refreshProjectMemberPanel() {
            if (isPersonalProjectMain()) return;
            const projId = new URLSearchParams(window.location.search).get('projId');

            Promise.all([
                fetch('/project/api/members?projId=' + projId).then(function(res) { return res.json(); }),
                fetch('/project/api/tasks?projId=' + projId).then(function(res) { return res.json(); })
            ])
            .then(function(results) {
                renderProjectMemberList(results[0], normalizeProjectTasks(results[1]));
            })
            .catch(function(err) {
                console.error('프로젝트 멤버 패널 로딩 실패:', err);
                const listEl = document.getElementById('projectMemberList');
                if (listEl) {
                    listEl.innerHTML = '<div class="project-member-empty">멤버 정보를 불러오지 못했습니다.</div>';
                }
            });
        }

function loadProjectMembers() {
            // 예전 멤버 리스트(memberListArea)용 함수가 남아 있어서 null 오류가 났습니다.
            // 현재 프로젝트 메인은 projectMemberList + refreshProjectMemberPanel() 구조를 사용합니다.
            if (typeof refreshProjectMemberPanel === 'function') {
                refreshProjectMemberPanel();
                return;
            }

            const projId = new URLSearchParams(window.location.search).get('projId');
            const memberListArea = document.getElementById('memberListArea');
            const memberCount = document.getElementById('memberCount');

            if (!memberListArea) {
                return;
            }

            fetch('/project/api/members?projId=' + projId)
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    let html = '';

                    if (memberCount) {
                        memberCount.innerText = data ? data.length : 0;
                    }

                    if (!data || data.length === 0) {
                        memberListArea.innerHTML = '<p style="color:#aaa; text-align:center; font-size:13px; margin-top:15px;">프로젝트 멤버가 없습니다.</p>';
                        return;
                    }

                    data.forEach(function(member) {
                        const name = member.USER_NAME || '';
                        const initial = name ? name.substring(0, 1) : '?';

                        html += '<div class="member-list-item">' +
                                    '<div class="member-avatar">' + initial + '</div>' +
                                    '<div class="member-info">' +
                                        '<span class="member-name">' + name + '</span>' +
                                        '<span class="member-email">' + (member.EMAIL || '') + '</span>' +
                                    '</div>' +
                                '</div>';
                    });

                    memberListArea.innerHTML = html;
                })
                .catch(function(err) {
                    console.error('멤버 로딩 실패:', err);
                });
        }

function toggleProjectMemberPanel() {
            // 프로젝트 멤버는 더보기 없이 전체 노출합니다.
        }

function isProjectMemberTaskDelayedSafe(endDateText, endTime, status) {
    const normalizedStatus = String(status || '').toUpperCase();
    if (normalizedStatus === 'DONE') return false;

    if (typeof isTaskDelayed === 'function') {
        return isTaskDelayed(endDateText, endTime, status);
    }

    if (!endDateText) return false;

    const normalized = String(endDateText)
        .replaceAll('.', '-')
        .replaceAll('/', '-')
        .trim();

    const dateOnly = normalized.substring(0, 10);
    if (!dateOnly || dateOnly.length < 10) return false;

    const time = normalizeTaskTime(endTime, '18:00');
    const deadline = new Date(dateOnly + 'T' + time + ':59');
    if (Number.isNaN(deadline.getTime())) return false;

    return deadline < new Date();
}

        document.addEventListener('DOMContentLoaded', bindScheduleTimeInputNormalization);



/* ===== 프로젝트 멤버 프로필: 기존 타임라인/캘린더 로직과 분리 ===== */
function setProjectMemberProfileVisible(visible) {
    const overlay = document.getElementById('projectMemberProfileOverlay');
    const modal = document.getElementById('projectMemberProfileModal');
    if (!overlay || !modal) return;

    overlay.style.display = visible ? 'block' : 'none';
    modal.style.display = visible ? 'block' : 'none';
    document.body.classList.toggle('project-member-profile-open', visible);
}

function closeProjectMemberProfile() {
    setProjectMemberProfileVisible(false);
}

function projectProfileValue(data, upper, camel) {
    return data ? (data[upper] ?? data[camel] ?? '') : '';
}

function projectMemberPermissionLabel(data) {
    const isLeader =
        String(projectProfileValue(data, 'IS_LEADER', 'isLeader')) === 'Y';

    if (isLeader) return '팀장';

    const role = String(
        projectProfileValue(data, 'PROJ_ROLE', 'projRole') || 'MEMBER'
    ).toUpperCase();

    return role === 'ADMIN' ? '관리자' : '멤버';
}

function openProjectMemberProfile(userId) {
    const body = document.getElementById('projectMemberProfileBody');
    if (!body) return;

    body.innerHTML =
        '<div class="project-member-profile-loading">프로필을 불러오는 중입니다.</div>';

    setProjectMemberProfileVisible(true);

    const projId =
        window.PROJECT_MAIN_CONFIG?.projectId ||
        window.PROJECT_MAIN_CONFIG?.paramProjId ||
        new URLSearchParams(window.location.search).get('projId');

    fetch('/project/api/member-profile?projId='
        + encodeURIComponent(projId)
        + '&userId=' + encodeURIComponent(userId))
        .then(function(response) {
            if (!response.ok) throw new Error('PROFILE_LOAD_FAILED');
            return response.json();
        })
        .then(renderProjectMemberProfile)
        .catch(function(error) {
            console.error('프로젝트 멤버 프로필 조회 실패:', error);
            body.innerHTML =
                '<div class="project-member-profile-loading">프로필을 불러오지 못했습니다.</div>';
        });
}

function renderProjectMemberProfile(profile) {
    const body = document.getElementById('projectMemberProfileBody');
    if (!body) return;

    const userId = projectProfileValue(profile, 'USER_ID', 'userId');
    const displayName =
        projectProfileValue(profile, 'DISPLAY_NAME', 'displayName') || '이름 없음';
    const profileImage =
        projectProfileValue(profile, 'PROFILE_IMAGE_PATH', 'profileImagePath');
    const email = projectProfileValue(profile, 'EMAIL', 'email') || '-';
    const phone = projectProfileValue(profile, 'PHONE_NUMBER', 'phoneNumber');
    const wsPosition =
        projectProfileValue(profile, 'WS_POSITION', 'wsPosition') || '역할 미지정';
    const projPosition =
        projectProfileValue(profile, 'PROJ_POSITION', 'projPosition') || '';
    const canEdit = Boolean(
        profile.CAN_EDIT_PROJECT_ROLE ?? profile.canEditProjectRole
    );

    const permission = projectMemberPermissionLabel(profile);
    const avatar = profileImage
        ? '<img src="' + escapeTaskHtml(profileImage) + '" alt="">'
        : escapeTaskHtml(getMemberInitialText(displayName));

    let html = '';
    html += '<div class="project-member-profile-summary">';
    html += '<div class="project-member-profile-avatar">' + avatar + '</div>';
    html += '<div class="project-member-profile-summary-copy">';
    html += '<strong>' + escapeTaskHtml(displayName) + '</strong>';
    html += '<span>' +
        escapeTaskHtml(projPosition || '프로젝트 역할 미지정') + '</span>';
    html += '<em>' + escapeTaskHtml(permission) + '</em>';
    html += '</div></div>';

    html += '<div class="project-member-profile-info">';
    html += '<div><span>이메일</span><strong>' +
        escapeTaskHtml(email) + '</strong></div>';

    if (phone) {
        html += '<div><span>연락처</span><strong>' +
            escapeTaskHtml(phone) + '</strong></div>';
    }

    html += '<div><span>워크스페이스 역할</span><strong>' +
        escapeTaskHtml(wsPosition) + '</strong></div>';

    html += '</div>';

    if (canEdit) {
        html += '<div class="project-member-profile-role-edit">';
        html += '<label for="projectMemberProfilePosition">프로젝트 역할</label>';
        html += '<input type="text" id="projectMemberProfilePosition" '
            + 'maxlength="100" '
            + 'value="' + escapeTaskHtml(projPosition) + '" '
            + 'placeholder="예: 백엔드 개발, 디자인, 일정 관리">';
        html += '<p>프로젝트에서 맡은 역할만 수정할 수 있습니다.</p>';
        html += '</div>';

        html += '<div class="project-member-profile-actions">';
        html += '<button type="button" '
            + 'onclick="saveProjectMemberProfilePosition(' + userId + ')">'
            + '역할 저장</button>';
        html += '</div>';
    } else {
        html += '<p class="project-member-profile-source-note">'
            + '표시 이름, 이미지와 연락처는 워크스페이스 프로필 정보를 사용합니다.'
            + '</p>';
    }

    body.innerHTML = html;
}

function saveProjectMemberProfilePosition(userId) {
    const input = document.getElementById('projectMemberProfilePosition');
    if (!input) return;

    const projId =
        window.PROJECT_MAIN_CONFIG?.projectId ||
        window.PROJECT_MAIN_CONFIG?.paramProjId ||
        new URLSearchParams(window.location.search).get('projId');

    const params = new URLSearchParams();
    params.append('projId', projId);
    params.append('userId', userId);
    params.append('projPosition', input.value.trim());

    fetch('/project/api/member-profile/position', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: params
    })
    .then(function(response) {
        if (!response.ok) throw new Error('SAVE_FAILED');
        return response.text();
    })
    .then(function(result) {
        if (result === 'SUCCESS') {
            alert('프로젝트 역할을 저장했습니다.');
            closeProjectMemberProfile();

            if (typeof refreshProjectMemberPanel === 'function') {
                refreshProjectMemberPanel();
            }
        } else if (result === 'NO_PERMISSION') {
            alert('프로젝트 역할 수정 권한이 없습니다.');
        } else {
            alert('프로젝트 역할 저장에 실패했습니다.');
        }
    })
    .catch(function(error) {
        console.error('프로젝트 역할 저장 실패:', error);
        alert('프로젝트 역할 저장 중 오류가 발생했습니다.');
    });
}

document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;

    const modal = document.getElementById('projectMemberProfileModal');
    if (modal && modal.style.display === 'block') {
        closeProjectMemberProfile();
    }
});
/* ===== End 프로젝트 멤버 프로필 ===== */
