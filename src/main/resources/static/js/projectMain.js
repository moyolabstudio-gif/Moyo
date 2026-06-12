window.PROJECT_MAIN_CONFIG = window.PROJECT_MAIN_CONFIG || {
    projectLeaderId: '',
    loginUserId: '',
    projectStartDate: '',
    projectEndDate: '',
    projectId: '',
    paramProjId: '',
    wsId: '',
    paramWsId: '',
    canManageProject: false
};


		let currentTaskId = null;
        let projectTaskMemberList = [];
		let currentScheduleId = null;
        let projectMemberPanelExpanded = false;
        let cachedProjectMembers = [];
        let cachedProjectTasks = [];

        const defaultScheduleColorPalette = [
            '#4A90E2',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#EC4899',
            '#14B8A6',
            '#64748B'
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

        function getNextScheduleColor() {
            const usedCount = (projectCalendarSchedules || []).length;
            if (!scheduleColorPalette || scheduleColorPalette.length === 0) {
                scheduleColorPalette = defaultScheduleColorPalette.slice();
            }
            return scheduleColorPalette[usedCount % scheduleColorPalette.length];
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
    const taskList = Array.isArray(tasks) ? tasks : [];

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
            const params = new URLSearchParams(window.location.search);
            const wsId = params.get('wsId') || window.PROJECT_MAIN_CONFIG.paramWsId;
            const projId = params.get('projId') || window.PROJECT_MAIN_CONFIG.paramProjId;

            if (!wsId || !projId || wsId === 'null' || projId === 'null') {
                alert('프로젝트 또는 워크스페이스 정보를 찾을 수 없습니다.');
                return;
            }

            location.href = '/project/work/list?wsId=' + encodeURIComponent(wsId) + '&projId=' + encodeURIComponent(projId);
        }


function refreshProjectMemberPanel() {
            const projId = new URLSearchParams(window.location.search).get('projId');

            Promise.all([
                fetch('/project/api/members?projId=' + projId).then(function(res) { return res.json(); }),
                fetch('/project/api/tasks?projId=' + projId).then(function(res) { return res.json(); })
            ])
            .then(function(results) {
                renderProjectMemberList(results[0], results[1]);
            })
            .catch(function(err) {
                console.error('프로젝트 멤버 패널 로딩 실패:', err);
                const listEl = document.getElementById('projectMemberList');
                if (listEl) {
                    listEl.innerHTML = '<div class="project-member-empty">멤버 정보를 불러오지 못했습니다.</div>';
                }
            });
        }



        function refreshProjectTaskAndMemberView() {
            loadKanbanBoard();

            if (typeof refreshProjectMemberPanel === 'function') {
                refreshProjectMemberPanel();
            }
        }


function loadKanbanBoard() {
		    const projId = new URLSearchParams(window.location.search).get('projId');
		    fetch(`/project/api/tasks?projId=${projId}`)
		        .then(res => res.json())
		        .then(data => {
		            const todoList = document.getElementById('todo-list');
		            const progressList = document.getElementById('inprogress-list');
		            const doneList = document.getElementById('done-list');

                    if (!todoList || !progressList || !doneList) return;

		            // 리스트 초기화
		            todoList.innerHTML = '';
		            progressList.innerHTML = '';
		            doneList.innerHTML = '';

                    let todoCount = 0;
                    let progressCount = 0;
                    let doneCount = 0;
                    let delayCount = 0;

					data.forEach(task => {
					    const title = task.TITLE || task.title || "제목 없음";
						const start = ((task.START_DATE || task.startDate || "") + "").trim();
						const end = ((task.END_DATE || task.endDate || "") + "").trim();
					    const status = ((task.STATUS || task.status || "") + "").toUpperCase();
					    const taskId = task.TASK_ID || task.taskId || task.EVENT_ID || task.eventId;

                        const viewUserName = task.USER_NAME || task.userName || '담당자 없음';
                        const viewUseTime = isTaskTimeEnabledFromData(task);
                        const viewStartTime = viewUseTime ? normalizeTaskTime(task.START_TIME || task.startTime || task.START_TIME_SLOT || task.startTimeSlot, '09:00') : '';
                        const viewEndTime = viewUseTime ? normalizeTaskTime(task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot, '18:00') : '';
                        const viewActualStart = task.ACTUAL_START_DATE || task.actualStartDate || '';
                        const viewActualDone = task.ACTUAL_DONE_DATE || task.actualDoneDate || '';

                        // 지연 숫자와 카드 배지는 같은 기준을 사용해야 합니다.
                        // 기준: DONE은 지연 제외, 마감 오전은 11:59:59, 마감 오후는 23:59:59
                        const viewIsDelayed = isTaskDelayed(end, viewUseTime ? viewEndTime : '18:00', status);

                        if (status === 'TODO') todoCount++;
                        else if (status === 'IN_PROGRESS') progressCount++;
                        else if (status === 'DONE') doneCount++;

                        if (viewIsDelayed) delayCount++;

						const cardHtml =
						    '<div class="task-card main-task-card ' + (viewIsDelayed ? 'delayed-task' : '') + '" draggable="true" ondragstart="drag(event)" id="task-' + taskId + '" onclick="openTaskDetailModal(' + taskId + ')">'
                            + '  <div class="main-task-card-title-row">'
                            + '      <div class="main-task-title" title="' + safeTaskHtml(title) + '">' + safeTaskHtml(title) + '</div>'
                            + (viewIsDelayed ? '      <span class="main-task-status delay">지연</span>' : '')
                            + '  </div>'
                            + '  <div class="main-task-sub">'
                            + '      <span class="main-task-assignee" title="' + safeTaskHtml(viewUserName) + '">' + safeTaskHtml(viewUserName) + '</span>'
                            + '      <span class="main-task-period">' + safeTaskHtml(formatMainTaskPeriod(start, viewStartTime, end, viewEndTime, viewUseTime)) + '</span>'
                            + '  </div>'
						    + '</div>';

					    // 상태별 삽입
					    if (status === 'TODO') {
					        todoList.insertAdjacentHTML('beforeend', cardHtml);
					    } else if (status === 'IN_PROGRESS') {
					        progressList.insertAdjacentHTML('beforeend', cardHtml);
					    } else if (status === 'DONE') {
					        doneList.insertAdjacentHTML('beforeend', cardHtml);
					    }
					});

                    updateTaskCountDisplays(todoCount, progressCount, doneCount, delayCount);

					drawCalendar(data);
		        })
		        .catch(err => console.error("칸반 로딩 실패:", err));
		}

        function updateTaskCountDisplays(todoCount, progressCount, doneCount, delayCount) {
            const totalCount = todoCount + progressCount + doneCount;

            setTextIfExists('todo-count', todoCount);
            setTextIfExists('progress-count', progressCount);
            setTextIfExists('done-count', doneCount);

            setTextIfExists('task-total-count', totalCount);
            setTextIfExists('task-todo-summary', todoCount);
            setTextIfExists('task-progress-summary', progressCount);
            setTextIfExists('task-done-summary', doneCount);
            setTextIfExists('task-delay-count', delayCount);
        }

        function setTextIfExists(id, value) {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        }

        function isTaskDelayed(endDateText, endTime, status) {
            if (!endDateText) return false;

            const normalizedStatus = String(status || '').toUpperCase();
            if (normalizedStatus === 'DONE') return false;

            const normalized = String(endDateText)
                .replaceAll('.', '-')
                .replaceAll('/', '-')
                .trim();

            const dateOnly = normalized.substring(0, 10);
            const time = normalizeTaskTime(endTime, '18:00');
            const deadline = new Date(dateOnly + 'T' + time + ':59');

            if (Number.isNaN(deadline.getTime())) return false;

            return deadline < new Date();
        }

		// 페이지 로드 시 멤버 리스트 불러오기
		document.addEventListener('DOMContentLoaded', function() {
		    loadKanbanBoard();
		    refreshProjectMemberPanel();
		    loadProjectMembers(); // 멤버 리스트 로드 함수 추가
		    loadAllWidgets(new URLSearchParams(window.location.search).get('projId'));
		    loadProjectActivePoll();
		    setTimeout(limitMainWidgetItems, 300);
		    setTimeout(limitMainWidgetItems, 900);
		    restoreProjectTimelineScale();
		    loadProjectSchedules();
		    calculateProjectDday();
		});


        function getScheduleStatusText(status) {
            if (status === 'DONE') return '완료';
            if (status === 'IN_PROGRESS') return '진행 중';
            return '예정';
        }

        function getScheduleStatusClass(status) {
            if (status === 'DONE') return 'done';
            if (status === 'IN_PROGRESS') return 'progress';
            return '';
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

        let weeklyScheduleDragState = null;
        let weeklyScheduleEventDragState = null;
        let suppressWeeklyScheduleClick = false;
        let weeklyDawnExpanded = false;











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



        function getTimeParts(value, fallback) {
            const normalized = normalizeScheduleTime(value, fallback || '09:00');
            const parts = normalized.split(':');
            return {
                hour: parts[0] || '09',
                minute: parts[1] || '00'
            };
        }

        function buildScheduleTimeSplitOptions(baseId, fallback) {
            const hourEl = document.getElementById(baseId + 'Hour');
            const minuteEl = document.getElementById(baseId + 'Minute');
            const hiddenEl = document.getElementById(baseId);

            if (!hourEl || !minuteEl || !hiddenEl) return;

            if (!hourEl.options || hourEl.options.length === 0) {
                let hourHtml = '';
                for (let hour = 0; hour < 24; hour++) {
                    const value = String(hour).padStart(2, '0');
                    hourHtml += '<option value="' + value + '">' + value + '</option>';
                }
                hourEl.innerHTML = hourHtml;
            }

            if (!minuteEl.options || minuteEl.options.length === 0) {
                let minuteHtml = '';
                for (let minute = 0; minute < 60; minute += 10) {
                    const value = String(minute).padStart(2, '0');
                    minuteHtml += '<option value="' + value + '">' + value + '</option>';
                }
                minuteEl.innerHTML = minuteHtml;
            }

            setScheduleTimeSplitValue(baseId, hiddenEl.value || fallback || '09:00');
        }

        function setScheduleTimeSplitValue(baseId, value) {
            const hourEl = document.getElementById(baseId + 'Hour');
            const minuteEl = document.getElementById(baseId + 'Minute');
            const hiddenEl = document.getElementById(baseId);

            if (!hourEl || !minuteEl || !hiddenEl) return;

            const parts = getTimeParts(value, hiddenEl.value || '09:00');
            hourEl.value = parts.hour;

            // 10분 단위로 정규화
            const rawMinute = parseInt(parts.minute, 10);
            const normalizedMinute = String(Math.max(0, Math.min(50, Math.round((isNaN(rawMinute) ? 0 : rawMinute) / 10) * 10))).padStart(2, '0');
            minuteEl.value = normalizedMinute;

            hiddenEl.value = hourEl.value + ':' + minuteEl.value;
        }

        function syncScheduleTimeSplitValue(baseId) {
            const hourEl = document.getElementById(baseId + 'Hour');
            const minuteEl = document.getElementById(baseId + 'Minute');
            const hiddenEl = document.getElementById(baseId);

            if (!hourEl || !minuteEl || !hiddenEl) return;

            hiddenEl.value = hourEl.value + ':' + minuteEl.value;
        }

        function normalizeScheduleTimeInputValue(inputEl, fallback) {
            if (!inputEl) return;

            if (inputEl.type === 'hidden') {
                setScheduleTimeSplitValue(inputEl.id, inputEl.value || fallback || '09:00');
                return;
            }

            const normalized = normalizeScheduleTime(inputEl.value, fallback);
            if (inputEl.value !== normalized) {
                inputEl.value = normalized;
            }
        }

        function bindScheduleTimeInputNormalization() {
            [
                { id: 'scheduleStartTime', fallback: '09:00' },
                { id: 'scheduleEndTime', fallback: '18:00' },
                { id: 'editScheduleStartTime', fallback: '09:00' },
                { id: 'editScheduleEndTime', fallback: '18:00' }
            ].forEach(function(item) {
                const hiddenEl = document.getElementById(item.id);
                const hourEl = document.getElementById(item.id + 'Hour');
                const minuteEl = document.getElementById(item.id + 'Minute');

                if (!hiddenEl || !hourEl || !minuteEl) return;

                buildScheduleTimeSplitOptions(item.id, item.fallback);

                if (hiddenEl.dataset.timeNormalizeBound === 'Y') return;
                hiddenEl.dataset.timeNormalizeBound = 'Y';

                [hourEl, minuteEl].forEach(function(el) {
                    el.addEventListener('change', function() {
                        syncScheduleTimeSplitValue(item.id);
                    });
                });
            });
        }

        function toggleScheduleTimeFields(enabled, isEditMode) {
            const prefix = isEditMode ? 'editSchedule' : 'schedule';
            const useTimeEl = document.getElementById(prefix + 'UseTime');
            const startTimeEl = document.getElementById(prefix + 'StartTime');
            const endTimeEl = document.getElementById(prefix + 'EndTime');

            if (useTimeEl) useTimeEl.checked = !!enabled;

            bindScheduleTimeInputNormalization();

            [startTimeEl, endTimeEl].forEach(function(el) {
                if (!el) return;

                const hourEl = document.getElementById(el.id + 'Hour');
                const minuteEl = document.getElementById(el.id + 'Minute');

                if (hourEl) hourEl.disabled = !enabled;
                if (minuteEl) minuteEl.disabled = !enabled;
            });
        }











        function shiftDateByDays(dateStr, days) {
            const date = parseProjectDate(dateStr);
            if (!date) return dateStr;
            date.setDate(date.getDate() + days);
            return formatProjectDate(date);
        }


        function getGanttCellStartDate(cell) {
            if (!cell) return null;
            return cell.dataset.startDate || cell.dataset.date || null;
        }

        function getGanttCellEndDate(cell) {
            if (!cell) return null;
            return cell.dataset.endDate || cell.dataset.date || null;
        }

        function getPointerCellInTrack(event, track) {
            if (!track) return null;

            const hoveredCell = event.target.closest('.gantt-cell[data-row-key]');
            if (hoveredCell && track.contains(hoveredCell)) {
                return hoveredCell;
            }

            const cells = Array.from(track.querySelectorAll('.gantt-cell[data-row-key]'));
            if (cells.length === 0) return null;

            const rect = track.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / Math.max(rect.width, 1);

            let index = Math.floor(ratio * cells.length);
            index = Math.max(0, Math.min(index, cells.length - 1));

            return cells[index];
        }

        function getPointerRangeInTrack(event, track) {
            const cell = getPointerCellInTrack(event, track);
            if (!cell) return null;

            return {
                startDate: getGanttCellStartDate(cell),
                endDate: getGanttCellEndDate(cell),
                startTime: getGanttCellStartTime(cell),
                endTime: getGanttCellEndTime(cell)
            };
        }

        function clearGanttDragSelection() {
            document.querySelectorAll('.gantt-cell.drag-selecting, .gantt-cell.drag-start, .gantt-cell.drag-end')
                .forEach(cell => {
                    cell.classList.remove('drag-selecting', 'drag-start', 'drag-end');
                });
        }

        function getOrderedDateRange(dateA, dateB) {
            const start = parseProjectDate(dateA);
            const end = parseProjectDate(dateB);

            if (!start || !end) {
                return { startDate: dateA, endDate: dateB };
            }

            if (start <= end) {
                return { startDate: dateA, endDate: dateB };
            }

            return { startDate: dateB, endDate: dateA };
        }

        function highlightGanttDragRange(startDate, endDate) {
            clearGanttDragSelection();

            if (!startDate || !endDate || !ganttDragRowKey) return;

            const range = getOrderedDateRange(startDate, endDate);
            const start = parseProjectDate(range.startDate);
            const end = parseProjectDate(range.endDate);

            document.querySelectorAll('.gantt-cell[data-row-key="' + ganttDragRowKey + '"]').forEach(cell => {
                const cellStart = parseProjectDate(getGanttCellStartDate(cell));
                const cellEnd = parseProjectDate(getGanttCellEndDate(cell));

                if (!cellStart || !cellEnd) return;

                if (cellStart <= end && cellEnd >= start) {
                    cell.classList.add('drag-selecting');
                }

                if (getGanttCellStartDate(cell) === range.startDate || getGanttCellEndDate(cell) === range.startDate) {
                    cell.classList.add('drag-start');
                }

                if (getGanttCellStartDate(cell) === range.endDate || getGanttCellEndDate(cell) === range.endDate) {
                    cell.classList.add('drag-end');
                }
            });
        }

        function openAddScheduleModalWithDates(startDate, endDate, startTime, endTime) {
            const range = getOrderedDateRange(startDate, endDate);
            const hasTime = !!(startTime || endTime);

            openAddScheduleModal();

            document.getElementById('scheduleStartDate').value = range.startDate;
            document.getElementById('scheduleEndDate').value = range.endDate;

            if (hasTime) {
                document.getElementById('scheduleStartTime').value = normalizeScheduleTime(startTime, '09:00');
                document.getElementById('scheduleEndTime').value = normalizeScheduleTime(endTime, '18:00');
            }

            toggleScheduleTimeFields(hasTime, false);

            setTimeout(() => {
                const titleInput = document.getElementById('scheduleTitle');
                if (titleInput) titleInput.focus();
            }, 80);
        }

        function startGanttDrag(event, startDate, endDate, rowKey) {
            if (!startDate || !endDate || !rowKey) return;

            event.preventDefault();
            event.stopPropagation();

            isGanttDragging = true;
            ganttDragStartDate = startDate;
            ganttDragEndDate = endDate;
            ganttDragRowKey = rowKey;

            highlightGanttDragRange(ganttDragStartDate, ganttDragEndDate);
        }

        function moveGanttDrag(event, startDate, endDate, rowKey) {
            if (!isGanttDragging || !startDate || !endDate || !rowKey) return;
            if (rowKey !== ganttDragRowKey) return;

            event.preventDefault();

            const currentStart = parseProjectDate(startDate);
            const dragStart = parseProjectDate(ganttDragStartDate);

            if (currentStart && dragStart && currentStart < dragStart) {
                ganttDragStartDate = startDate;
            }

            ganttDragEndDate = endDate;
            highlightGanttDragRange(ganttDragStartDate, ganttDragEndDate);
        }

        function endGanttDrag(event, startDate, endDate) {
            if (!isGanttDragging) return;

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (startDate && endDate) {
                const currentStart = parseProjectDate(startDate);
                const dragStart = parseProjectDate(ganttDragStartDate);

                if (currentStart && dragStart && currentStart < dragStart) {
                    ganttDragStartDate = startDate;
                }

                ganttDragEndDate = endDate;
            }

            const finalStartDate = ganttDragStartDate;
            const finalEndDate = ganttDragEndDate;

            isGanttDragging = false;
            ganttDragStartDate = null;
            ganttDragEndDate = null;
            ganttDragRowKey = null;

            clearGanttDragSelection();

            if (finalStartDate && finalEndDate) {
                openAddScheduleModalWithDates(finalStartDate, finalEndDate, getGanttCellStartTime(event ? event.target.closest('.gantt-cell') : null), getGanttCellEndTime(event ? event.target.closest('.gantt-cell') : null));
            }
        }

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


        function normalizeScheduleTime(value, fallback) {
            const raw = String(value || '').trim();
            if (/^\d{2}:\d{2}$/.test(raw)) return raw;
            if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw.substring(0, 5);
            return fallback || '09:00';
        }

        function isScheduleTimeEnabled(schedule) {
            if (!schedule) return false;
            return String(schedule.USE_TIME || schedule.useTime || '').toUpperCase() === 'Y';
        }

        function parseProjectDateTime(dateStr, timeStr, isEnd) {
            const date = parseProjectDate(dateStr);
            if (!date) return null;

            const time = normalizeScheduleTime(timeStr, isEnd ? '23:59' : '00:00');
            const parts = time.split(':');
            date.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, isEnd ? 59 : 0, 0);
            return date;
        }

        function formatProjectDateTimeValue(date) {
            return formatProjectDate(date) + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        }

        function getScheduleStartDateTime(schedule) {
            const startDate = schedule.START_DATE || schedule.startDate;
            if (isScheduleTimeEnabled(schedule)) {
                return parseProjectDateTime(startDate, schedule.START_TIME || schedule.startTime, false);
            }
            return parseProjectDateTime(startDate, '00:00', false);
        }

        function getScheduleEndDateTime(schedule) {
            const endDate = schedule.END_DATE || schedule.endDate || schedule.START_DATE || schedule.startDate;
            if (isScheduleTimeEnabled(schedule)) {
                return parseProjectDateTime(endDate, schedule.END_TIME || schedule.endTime, true);
            }
            return parseProjectDateTime(endDate, '23:59', true);
        }

        function getGanttCellStartTime(cell) {
            return cell ? (cell.dataset.startTime || '') : '';
        }

        function getGanttCellEndTime(cell) {
            return cell ? (cell.dataset.endTime || '') : '';
        }


        function bindGanttDragHandlers() {
            const target = document.getElementById('projectGanttPreview');
            if (!target) return;

            target.onmousedown = function(event) {
                const cell = event.target.closest('.gantt-cell[data-row-key]');
                if (!cell || !target.contains(cell)) return;
                startGanttDrag(event, getGanttCellStartDate(cell), getGanttCellEndDate(cell), cell.dataset.rowKey);
            };

            target.onmouseover = function(event) {
                const cell = event.target.closest('.gantt-cell[data-row-key]');
                if (!cell || !target.contains(cell)) return;
                moveGanttDrag(event, getGanttCellStartDate(cell), getGanttCellEndDate(cell), cell.dataset.rowKey);
            };

            target.onmouseup = function(event) {
                const cell = event.target.closest('.gantt-cell[data-row-key]');
                if (!cell || !target.contains(cell)) return;
                if (cell.dataset.rowKey !== ganttDragRowKey) return;
                endGanttDrag(event, getGanttCellStartDate(cell), getGanttCellEndDate(cell));
            };
        }

        function findScheduleById(scheduleId) {
            const idStr = String(scheduleId);
            return (projectCalendarSchedules || []).find(schedule => {
                const id = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
                return String(id) === idStr;
            });
        }

        function getDayDiff(start, end) {
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.round((end - start) / oneDay);
        }

        function getShiftedScheduleRange(originalStart, originalEnd, pointerStartDate, pointerCurrentDate) {
            const originalStartDate = parseProjectDate(originalStart);
            const originalEndDate = parseProjectDate(originalEnd);
            const pointerStart = parseProjectDate(pointerStartDate);
            const pointerCurrent = parseProjectDate(pointerCurrentDate);

            if (!originalStartDate || !originalEndDate || !pointerStart || !pointerCurrent) {
                return { startDate: originalStart, endDate: originalEnd };
            }

            const duration = getDayDiff(originalStartDate, originalEndDate);
            const delta = getDayDiff(pointerStart, pointerCurrent);

            let newStart = addDays(originalStartDate, delta);
            let newEnd = addDays(originalEndDate, delta);

            const rangeStart = parseProjectDate(currentGanttRangeStart);
            const rangeEnd = parseProjectDate(currentGanttRangeEnd);

            if (rangeStart && newStart < rangeStart) {
                newStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
                newEnd = addDays(newStart, duration);
            }

            if (rangeEnd && newEnd > rangeEnd) {
                newEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
                newStart = addDays(newEnd, -duration);
            }

            return {
                startDate: formatProjectDate(newStart),
                endDate: formatProjectDate(newEnd)
            };
        }

        function findTickColumnByDate(dateStr) {
            const date = parseProjectDate(dateStr);
            if (!date || !currentGanttTicks || currentGanttTicks.length === 0) return 1;

            for (let i = 0; i < currentGanttTicks.length; i++) {
                const tickStart = parseProjectDate(currentGanttTicks[i].startDate);
                const tickEnd = parseProjectDate(currentGanttTicks[i].endDate);

                if (tickStart && tickEnd && date >= tickStart && date <= tickEnd) {
                    return i + 1;
                }
            }

            return 1;
        }



        function applyGanttBarPosition(barEl, startDate, endDate, startTime, endTime, useTime) {
            if (!barEl) return;

            const tickCount = currentGanttTicks && currentGanttTicks.length > 0
                ? currentGanttTicks.length
                : document.querySelectorAll('.gantt-date-cell').length;

            if (!tickCount) return;

            let startColumn;
            let endColumn;

            startColumn = findTickColumnByDate(startDate);
            endColumn = findTickColumnByDate(endDate);

            if (endColumn < startColumn) endColumn = startColumn;

            let spanColumn = Math.max(endColumn - startColumn + 1, 1);

            startColumn = Math.max(1, Math.min(startColumn, tickCount));
            spanColumn = Math.max(1, Math.min(spanColumn, tickCount - startColumn + 1));

            barEl.style.gridColumn = startColumn + ' / span ' + spanColumn;
            barEl.title = barEl.dataset.title + ' · ' + startDate + (useTime ? ' ' + startTime : '') + ' ~ ' + endDate + (useTime ? ' ' + endTime : '');
        }

        function startGanttBarDrag(event, scheduleId, mode) {
            const schedule = findScheduleById(scheduleId);
            if (!schedule) return;

            const barEl = event.currentTarget.closest('.gantt-bar');
            const track = barEl.closest('.gantt-track');
            const pointerRange = getPointerRangeInTrack(event, track);

            if (!pointerRange) return;

            event.preventDefault();
            event.stopPropagation();

            ganttBarDragState = {
                mode: mode || 'MOVE',
                scheduleId: scheduleId,
                schedule: schedule,
                barEl: barEl,
                track: track,
                pointerStartDate: pointerRange.startDate,
                pointerEndDate: pointerRange.endDate,
                originalStart: schedule.START_DATE || schedule.startDate,
                originalEnd: schedule.END_DATE || schedule.endDate,
                newStart: schedule.START_DATE || schedule.startDate,
                newEnd: schedule.END_DATE || schedule.endDate,
                newStartTime: pointerRange.startTime || schedule.START_TIME || schedule.startTime || '09:00',
                newEndTime: pointerRange.endTime || schedule.END_TIME || schedule.endTime || '18:00',
                moved: false
            };

            barEl.classList.add('dragging');
        }

        function moveGanttBarDrag(event) {
            if (!ganttBarDragState) return;

            const pointerRange = getPointerRangeInTrack(event, ganttBarDragState.track);
            if (!pointerRange) return;

            event.preventDefault();

            let range;

            if (ganttBarDragState.mode === 'MOVE') {
                range = getShiftedScheduleRange(
                    ganttBarDragState.originalStart,
                    ganttBarDragState.originalEnd,
                    ganttBarDragState.pointerStartDate,
                    pointerRange.startDate
                );
            } else if (ganttBarDragState.mode === 'RESIZE_START') {
                const originalEndDate = parseProjectDate(ganttBarDragState.originalEnd);
                const pointer = parseProjectDate(pointerRange.startDate);
                const rangeStart = parseProjectDate(currentGanttRangeStart);

                let newStart = pointer;

                if (rangeStart && newStart < rangeStart) newStart = rangeStart;
                if (originalEndDate && newStart > originalEndDate) newStart = originalEndDate;

                range = {
                    startDate: formatProjectDate(newStart),
                    endDate: ganttBarDragState.originalEnd
                };
            } else if (ganttBarDragState.mode === 'RESIZE_END') {
                const originalStartDate = parseProjectDate(ganttBarDragState.originalStart);
                const pointer = parseProjectDate(pointerRange.endDate);
                const rangeEnd = parseProjectDate(currentGanttRangeEnd);

                let newEnd = pointer;

                if (rangeEnd && newEnd > rangeEnd) newEnd = rangeEnd;
                if (originalStartDate && newEnd < originalStartDate) newEnd = originalStartDate;

                range = {
                    startDate: ganttBarDragState.originalStart,
                    endDate: formatProjectDate(newEnd)
                };
            } else {
                return;
            }

            const nextStartTime = currentGanttScale === 'HOUR'
                ? (pointerRange.startTime || ganttBarDragState.newStartTime || '09:00')
                : (ganttBarDragState.newStartTime || '');
            const nextEndTime = currentGanttScale === 'HOUR'
                ? (pointerRange.endTime || ganttBarDragState.newEndTime || '18:00')
                : (ganttBarDragState.newEndTime || '');

            if (
                range.startDate !== ganttBarDragState.newStart ||
                range.endDate !== ganttBarDragState.newEnd ||
                nextStartTime !== ganttBarDragState.newStartTime ||
                nextEndTime !== ganttBarDragState.newEndTime
            ) {
                ganttBarDragState.moved = true;
            }

            ganttBarDragState.newStart = range.startDate;
            ganttBarDragState.newEnd = range.endDate;
            ganttBarDragState.newStartTime = nextStartTime;
            ganttBarDragState.newEndTime = nextEndTime;

            applyGanttBarPosition(ganttBarDragState.barEl, range.startDate, range.endDate, nextStartTime, nextEndTime, currentGanttScale === 'HOUR');
        }

        function finishGanttBarDrag() {
            if (!ganttBarDragState) return;

            const drag = ganttBarDragState;
            ganttBarDragState = null;

            if (drag.barEl) {
                drag.barEl.classList.remove('dragging');
            }

            if (!drag.moved) return;

            suppressGanttBarClick = true;
            setTimeout(() => {
                suppressGanttBarClick = false;
            }, 250);

            const params = new URLSearchParams();
            params.append('scheduleId', drag.scheduleId);
            params.append('title', drag.schedule.TITLE || drag.schedule.title || '');
            params.append('startDate', drag.newStart);
            params.append('endDate', drag.newEnd);
            params.append('status', drag.schedule.STATUS || drag.schedule.status || 'TODO');

            const dragUseTime = isScheduleTimeEnabled(drag.schedule);
            params.append('useTime', dragUseTime ? 'Y' : 'N');
            if (dragUseTime) {
                params.append('startTime', drag.newStartTime || drag.schedule.START_TIME || drag.schedule.startTime || '09:00');
                params.append('endTime', drag.newEndTime || drag.schedule.END_TIME || drag.schedule.endTime || '18:00');
            }

            params.append('color', drag.schedule.COLOR || drag.schedule.color || '#4A90E2');

            fetch('/project/api/update-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 기간 수정 실패');
                    loadProjectSchedules();
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
                loadProjectSchedules();
            });
        }

        function handleGanttBarClick(event, scheduleId) {
            event.stopPropagation();

            if (suppressGanttBarClick) return;

            openScheduleDetailModal(scheduleId);
        }

        document.addEventListener('mousemove', moveGanttBarDrag);
        document.addEventListener('mouseup', finishGanttBarDrag);

        function addDays(date, days) {
            const copied = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            copied.setDate(copied.getDate() + days);
            return copied;
        }

        function addMonths(date, months) {
            return new Date(date.getFullYear(), date.getMonth() + months, 1);
        }

        function getDateDiffInclusive(start, end) {
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.floor((end - start) / oneDay) + 1;
        }

        function getMonthDiffInclusive(start, end) {
            return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        }

        function getKoreanWeekday(date) {
            if (!date) return '';
            return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
        }

        function formatGanttDate(date) {
            return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + getKoreanWeekday(date);
        }

        function formatGanttMonth(date) {
            return date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, '0');
        }

        function isWeekendDate(date) {
            if (!date) return false;
            const day = date.getDay();
            return day === 0 || day === 6;
        }


        function getAutoGanttScale(totalDays) {
            if (totalDays <= 8) {
                return { type: 'HOUR', label: '자동 · 시간별' };
            }

            if (totalDays <= 30) {
                return { type: 'DAY', label: '자동 · 일 단위' };
            }

            if (totalDays <= 90) {
                return { type: 'WEEK', label: '자동 · 주 단위' };
            }

            return { type: 'MONTH', label: '자동 · 월 단위' };
        }

        function getGanttScale(totalDays) {
            if (selectedGanttScale === 'HOUR') {
                return { type: 'HOUR', label: '시간별' };
            }

            if (selectedGanttScale === 'DAY') {
                return { type: 'DAY', label: '일 단위' };
            }

            if (selectedGanttScale === 'WEEK') {
                return { type: 'WEEK', label: '주 단위' };
            }

            if (selectedGanttScale === 'MONTH') {
                return { type: 'MONTH', label: '월 단위' };
            }

            return getAutoGanttScale(totalDays);
        }

        function setProjectTimelineScale(scaleType) {
            selectedGanttScale = scaleType || 'AUTO';

            try {
                localStorage.setItem(getProjectTimelineScaleStorageKey(), selectedGanttScale);
                localStorage.removeItem('projectTimelineScale'); // 예전 전역 키 제거
            } catch (e) {
                // localStorage 사용 불가 환경은 무시
            }

            updateProjectTimelineScaleButtons();

            if (typeof renderProjectGantt === 'function') {
                renderProjectGantt(projectCalendarSchedules || []);
            }
        }

        function updateProjectTimelineScaleButtons(activeScale) {
            const scaleToMark = activeScale || selectedGanttScale;
            document.querySelectorAll('.timeline-scale-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.scale === scaleToMark);
            });
        }

        function getProjectTimelineScaleStorageKey() {
            const projId = new URLSearchParams(window.location.search).get('projId') || 'default';
            return 'projectTimelineScale.' + projId;
        }

        function restoreProjectTimelineScale() {
            // 기본 진입은 항상 AUTO.
            // 이전 테스트 중 localStorage에 DAY/WEEK 등이 남아 있으면 3일 프로젝트도 계속 일간으로 뜨는 문제가 생김.
            selectedGanttScale = 'AUTO';

            try {
                localStorage.removeItem('projectTimelineScale'); // 예전 전역 키 제거
            } catch (e) {
                // localStorage 사용 불가 환경은 무시
            }

            updateProjectTimelineScaleButtons();
        }

        function buildGanttTicks(rangeStart, rangeEnd, scale) {
            const ticks = [];

            if (scale.type === 'HOUR') {
                const totalDays = getDateDiffInclusive(rangeStart, rangeEnd);
                const timeSlots = [
                    { label: '09시', startTime: '09:00', endTime: '11:59' },
                    { label: '12시', startTime: '12:00', endTime: '14:59' },
                    { label: '15시', startTime: '15:00', endTime: '17:59' },
                    { label: '18시', startTime: '18:00', endTime: '23:59' }
                ];

                for (let i = 0; i < totalDays; i++) {
                    const date = addDays(rangeStart, i);
                    const day = date.getDay();

                    timeSlots.forEach(function(slot) {
                        ticks.push({
                            label: formatGanttDate(date),
                            timeLabel: slot.label,
                            start: date,
                            end: date,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            isSaturday: day === 6,
                            isSunday: day === 0,
                            isWeekend: day === 0 || day === 6
                        });
                    });
                }
            } else if (scale.type === 'DAY') {
                const totalDays = getDateDiffInclusive(rangeStart, rangeEnd);
                for (let i = 0; i < totalDays; i++) {
                    const start = addDays(rangeStart, i);
                    const end = start;
                    const day = start.getDay();
                    ticks.push({
                        label: formatGanttDate(start),
                        start: start,
                        end: end,
                        isSaturday: day === 6,
                        isSunday: day === 0,
                        isWeekend: day === 0 || day === 6
                    });
                }
            } else if (scale.type === 'WEEK') {
                let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
                let weekNo = 1;

                while (cursor <= rangeEnd) {
                    const tickStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
                    const tickEnd = addDays(tickStart, 6);
                    const safeEnd = tickEnd > rangeEnd ? rangeEnd : tickEnd;

                    ticks.push({
                        label: weekNo + '주차',
                        start: tickStart,
                        end: safeEnd
                    });

                    cursor = addDays(tickStart, 7);
                    weekNo++;
                }
            } else {
                let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);

                while (cursor <= rangeEnd) {
                    const tickStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
                    const tickEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
                    const safeStart = tickStart < rangeStart ? rangeStart : tickStart;
                    const safeEnd = tickEnd > rangeEnd ? rangeEnd : tickEnd;

                    ticks.push({
                        label: formatGanttMonth(cursor),
                        start: safeStart,
                        end: safeEnd
                    });

                    cursor = addMonths(cursor, 1);
                }
            }

            return ticks;
        }




        function formatWeeklyHourTime(hour) {
            return String(hour).padStart(2, '0') + ':00';
        }

        function addHoursToDate(date, hours) {
            const copied = new Date(date.getTime());
            copied.setHours(copied.getHours() + hours);
            return copied;
        }

        function formatProjectTime(date) {
            return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        }

        function getWeeklySlotInfo(el) {
            if (!el) return null;
            return {
                date: el.dataset.date,
                hour: parseInt(el.dataset.hour, 10),
                row: parseInt(el.dataset.row, 10),
                col: parseInt(el.dataset.col, 10)
            };
        }

        function getWeeklySlotFromPoint(clientX, clientY) {
            const el = document.elementFromPoint(clientX, clientY);
            if (!el) return null;

            const slot = el.closest('.weekly-schedule-slot[data-date][data-hour]');
            if (slot) return slot;

            const grid = el.closest('.weekly-schedule-grid');
            if (!grid) return null;

            const slots = Array.from(grid.querySelectorAll('.weekly-schedule-slot[data-date][data-hour]'));
            if (slots.length === 0) return null;

            let nearest = null;
            let nearestDistance = Infinity;

            slots.forEach(function(candidate) {
                const rect = candidate.getBoundingClientRect();

                if (
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom
                ) {
                    nearest = candidate;
                    nearestDistance = 0;
                    return;
                }

                const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
                const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
                const distance = dx * dx + dy * dy;

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearest = candidate;
                }
            });

            return nearest;
        }


        function clearWeeklyScheduleDragSelection() {
            document.querySelectorAll('.weekly-schedule-slot.drag-selecting, .weekly-schedule-slot.drag-start, .weekly-schedule-slot.drag-end')
                .forEach(function(slot) {
                    slot.classList.remove('drag-selecting', 'drag-start', 'drag-end');
                });
        }

        function clearWeeklyDropTarget() {
            document.querySelectorAll('.weekly-schedule-slot.drop-target')
                .forEach(function(slot) {
                    slot.classList.remove('drop-target');
                });
        }

        function updateWeeklyDragPreview(event, text) {
            let preview = document.getElementById('weeklyDragPreview');
            if (!preview) {
                preview = document.createElement('div');
                preview.id = 'weeklyDragPreview';
                preview.className = 'weekly-drag-preview';
                document.body.appendChild(preview);
            }

            preview.textContent = text || '';
            preview.style.left = event.clientX + 'px';
            preview.style.top = event.clientY + 'px';
        }

        function clearWeeklyDragPreview() {
            const preview = document.getElementById('weeklyDragPreview');
            if (preview) preview.remove();
            clearWeeklyDropTarget();
        }

        function getWeeklyDragLabel(info, mode) {
            if (!info) return '';
            const dateText = info.date ? info.date.substring(5).replace('-', '/') : '';
            const timeText = formatWeeklyHourTime(info.hour);
            if (mode === 'RESIZE_START') return '시작 ' + dateText + ' ' + timeText;
            if (mode === 'RESIZE_END') return '종료 ' + dateText + ' ' + timeText;
            return '이동 ' + dateText + ' ' + timeText;
        }

        function markWeeklyDropTarget(slot) {
            clearWeeklyDropTarget();
            if (slot) slot.classList.add('drop-target');
        }


        function getOrderedWeeklySlotRange(a, b) {
            if (!a || !b) return null;

            const startDt = parseProjectDateTime(a.date, formatWeeklyHourTime(a.hour), false);
            const endDt = parseProjectDateTime(b.date, formatWeeklyHourTime(b.hour), false);

            if (!startDt || !endDt) return null;

            const first = startDt <= endDt ? a : b;
            const last = startDt <= endDt ? b : a;

            return { first: first, last: last };
        }

        function highlightWeeklyScheduleRange(startInfo, endInfo) {
            clearWeeklyScheduleDragSelection();

            const range = getOrderedWeeklySlotRange(startInfo, endInfo);
            if (!range) return;

            const firstDt = parseProjectDateTime(range.first.date, formatWeeklyHourTime(range.first.hour), false);
            const lastEndDt = parseProjectDateTime(range.last.date, formatWeeklyHourTime(range.last.hour + 1), true);

            document.querySelectorAll('.weekly-schedule-slot[data-date][data-hour]').forEach(function(slot) {
                const info = getWeeklySlotInfo(slot);
                if (!info) return;

                const slotStart = parseProjectDateTime(info.date, formatWeeklyHourTime(info.hour), false);
                const slotEnd = parseProjectDateTime(info.date, formatWeeklyHourTime(info.hour + 1), true);

                if (slotStart && slotEnd && slotStart < lastEndDt && slotEnd > firstDt) {
                    slot.classList.add('drag-selecting');
                }

                if (info.date === range.first.date && info.hour === range.first.hour) {
                    slot.classList.add('drag-start');
                }

                if (info.date === range.last.date && info.hour === range.last.hour) {
                    slot.classList.add('drag-end');
                }
            });
        }

        function openAddScheduleModalWithWeeklyRange(startInfo, endInfo) {
            const range = getOrderedWeeklySlotRange(startInfo, endInfo);
            if (!range) return;

            const startDate = range.first.date;
            const endDate = range.last.date;
            const startTime = formatWeeklyHourTime(range.first.hour);
            const endTime = formatWeeklyHourTime(Math.min(range.last.hour + 1, 23));

            openAddScheduleModalWithDates(startDate, endDate, startTime, endTime);
        }

        function findScheduleByIdSafe(scheduleId) {
            return findScheduleById(scheduleId);
        }


        function updateScheduleByWeeklyDrop(schedule, dropInfo, mode) {
            if (!schedule || !dropInfo) return;

            const scheduleId = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
            const title = schedule.TITLE || schedule.title || '';
            const status = schedule.STATUS || schedule.status || 'TODO';
            const color = schedule.COLOR || schedule.color || '#4A90E2';
            const dragMode = mode || 'MOVE';

            const originalStart = getScheduleStartDateTime(schedule);
            const originalEnd = getScheduleEndDateTime(schedule);
            const dropStart = parseProjectDateTime(dropInfo.date, formatWeeklyHourTime(dropInfo.hour), false);
            const dropEnd = parseProjectDateTime(dropInfo.date, formatWeeklyHourTime(Math.min(dropInfo.hour + 1, 23)), true);

            if (!originalStart || !originalEnd || !dropStart || !dropEnd) return;

            let newStart = new Date(originalStart.getTime());
            let newEnd = new Date(originalEnd.getTime());

            if (dragMode === 'RESIZE_START') {
                newStart = dropStart;

                if (newStart >= newEnd) {
                    newStart = addHoursToDate(newEnd, -1);
                }
            } else if (dragMode === 'RESIZE_END') {
                newEnd = addHoursToDate(dropStart, 1);

                if (newEnd <= newStart) {
                    newEnd = addHoursToDate(newStart, 1);
                }
            } else {
                const durationMs = Math.max(60 * 60 * 1000, originalEnd - originalStart);
                newStart = dropStart;
                newEnd = new Date(newStart.getTime() + durationMs);
            }

            const params = new URLSearchParams();
            params.append('scheduleId', scheduleId);
            params.append('title', title);
            params.append('startDate', formatProjectDate(newStart));
            params.append('endDate', formatProjectDate(newEnd));
            params.append('status', status);
            params.append('useTime', 'Y');
            params.append('startTime', formatProjectTime(newStart));
            params.append('endTime', formatProjectTime(newEnd));
            params.append('color', color);

            fetch('/project/api/update-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(function(res) { return res.text(); })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    loadProjectSchedules();
                } else {
                    alert('일정 시간 수정 실패');
                    loadProjectSchedules();
                }
            })
            .catch(function(err) {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
                loadProjectSchedules();
            });
        }

        function bindWeeklyScheduleDragHandlers() {
            const target = document.getElementById('projectGanttPreview');
            if (!target || currentGanttScale !== 'HOUR') return;

            target.onmousedown = null;
            target.onmousemove = null;
            target.onmouseover = null;
            target.onmouseup = null;

            target.onclick = function(event) {
                const eventCard = event.target.closest('.weekly-schedule-event[data-schedule-id]');
                if (eventCard && target.contains(eventCard)) {
                    event.preventDefault();
                    event.stopPropagation();

                    const scheduleId = eventCard.dataset.scheduleId;
                    if (scheduleId) openScheduleDetailModal(scheduleId);
                    return;
                }

                const slot = event.target.closest('.weekly-schedule-slot[data-date][data-hour]');
                if (!slot || !target.contains(slot)) return;

                event.preventDefault();
                event.stopPropagation();

                const info = getWeeklySlotInfo(slot);
                openAddScheduleModalWithWeeklyRange(info, info);
            };
        }

        document.addEventListener('mousemove', function(event) {
            if (!weeklyScheduleEventDragState) return;

            const dx = Math.abs(event.clientX - weeklyScheduleEventDragState.startX);
            const dy = Math.abs(event.clientY - weeklyScheduleEventDragState.startY);

            if (dx > 4 || dy > 4) {
                weeklyScheduleEventDragState.moved = true;
                const slot = getWeeklySlotFromPoint(event.clientX, event.clientY);
                weeklyScheduleEventDragState.currentSlot = slot;

                if (slot) {
                    markWeeklyDropTarget(slot);
                    updateWeeklyDragPreview(event, getWeeklyDragLabel(getWeeklySlotInfo(slot), weeklyScheduleEventDragState.mode));
                }
            }
        });

        document.addEventListener('mouseup', function() {
            if (weeklyScheduleEventDragState && weeklyScheduleEventDragState.card) {
                weeklyScheduleEventDragState.card.classList.remove('dragging');
            }
            weeklyScheduleEventDragState = null;
            clearWeeklyDragPreview();
        });

        function buildWeeklyScheduleDays(rangeStart, rangeEnd) {
            const days = [];
            if (!rangeStart || !rangeEnd) return days;

            const totalDays = Math.min(getDateDiffInclusive(rangeStart, rangeEnd), 7);
            for (let i = 0; i < totalDays; i++) {
                const date = addDays(rangeStart, i);
                days.push({
                    date: formatProjectDate(date),
                    label: formatGanttDate(date),
                    day: date.getDay(),
                    weekend: date.getDay() === 0 || date.getDay() === 6
                });
            }

            return days;
        }

        function getWeeklyScheduleHour(timeValue, fallback) {
            const time = normalizeScheduleTime(timeValue, fallback || '09:00');
            const hour = parseInt(time.substring(0, 2), 10);
            if (isNaN(hour)) return fallback === '18:00' ? 18 : 9;
            return Math.max(0, Math.min(23, hour));
        }

        // 종료 시각은 해당 시각 직전까지 차지하므로 끝 행을 배타적으로 계산한다.
        // 예: 07:00~08:00은 07시 한 칸만 사용하고, 08:00 일정과 겹치지 않는다.
        function getWeeklyScheduleEndHour(timeValue, fallback) {
            const time = normalizeScheduleTime(timeValue, fallback || '18:00');
            const hour = parseInt(time.substring(0, 2), 10);
            const minute = parseInt(time.substring(3, 5), 10);

            if (isNaN(hour)) return fallback === '18:00' ? 18 : 9;

            const normalizedMinute = isNaN(minute) ? 0 : minute;
            const exclusiveHour = hour + (normalizedMinute > 0 ? 1 : 0);
            return Math.max(1, Math.min(24, exclusiveHour));
        }


        function hasWeeklyDawnSchedule(timeSchedules) {
            return (timeSchedules || []).some(function(schedule) {
                const startTime = normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00');
                const endTime = normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00');
                const startHour = parseInt(startTime.substring(0, 2), 10);
                const endHour = parseInt(endTime.substring(0, 2), 10);
                return (!isNaN(startHour) && startHour < 4) || (!isNaN(endHour) && endHour <= 4);
            });
        }

        function toggleWeeklyDawnRows() {
            weeklyDawnExpanded = !weeklyDawnExpanded;
            document.querySelectorAll('.weekly-dawn-row').forEach(function(el) {
                el.classList.toggle('weekly-dawn-row-hidden', !weeklyDawnExpanded);
            });

            const btn = document.getElementById('weeklyDawnToggleBtn');
            if (btn) {
                btn.innerText = weeklyDawnExpanded ? '새벽 시간 접기' : '새벽 시간 더보기';
            }
        }


        function getWeeklyCurrentTimeLineHtml(days, startHour, endHour) {
            const now = new Date();
            const today = formatProjectDate(now);
            const dayIndex = days.findIndex(function(day) {
                return day.date === today;
            });

            if (dayIndex < 0) return '';

            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            if (currentHour < startHour || currentHour > endHour) return '';

            const topPercent = Math.max(0, Math.min(100, (currentMinute / 60) * 100));
            return '<span class="weekly-current-time-line" style="top:' + topPercent + '%;"></span>';
        }

        function renderWeeklyScheduleTable(schedules, rangeStart, rangeEnd, targetEl) {
            const target = targetEl || document.getElementById('projectGanttPreview');
            if (!target) return;

            schedules = schedules || [];
            const days = buildWeeklyScheduleDays(rangeStart, rangeEnd);

            if (days.length === 0 || days.length > 7) {
                target.innerHTML = '<div class="weekly-schedule-empty">주간 일정표는 프로젝트 기간이 1주 이내일 때 표시됩니다.</div>';
                return;
            }

            const timeSchedules = schedules.filter(function(schedule) {
                const startDate = schedule.START_DATE || schedule.startDate || '';
                const endDate = schedule.END_DATE || schedule.endDate || startDate;
                return isScheduleTimeEnabled(schedule)
                    && days.some(function(day) { return day.date >= startDate && day.date <= endDate; });
            });

            const startHour = 0;
            const endHour = 23;
            const shouldShowDawnByDefault = weeklyDawnExpanded || hasWeeklyDawnSchedule(timeSchedules);
            const rowCount = endHour - startHour + 1;

            let html = '<div class="weekly-schedule-table-wrap">';
            html += '<div class="weekly-schedule-title">⏰ 주간 시간표 <span>(' + timeSchedules.length + ')</span><span class="weekly-schedule-drag-guide">빈 칸 드래그: 등록 · 일정 드래그: 시간 이동</span></div>';
            html += '<div class="weekly-schedule-grid" style="--day-count:' + days.length + ';">';

            html += '<div class="weekly-schedule-cell weekly-schedule-head weekly-schedule-time-head" style="grid-column:1; grid-row:1;">시간</div>';

            days.forEach(function(day, idx) {
                const isToday = day.date === formatProjectDate(new Date());
                const weekendHeadClass = day.weekend ? ' weekend ' + (day.day === 0 ? 'sunday' : 'saturday') : '';
                const todayHeadClass = isToday ? ' today-weekly-head' : '';
                html += '<div class="weekly-schedule-cell weekly-schedule-head' + weekendHeadClass + todayHeadClass + '" style="grid-column:' + (idx + 2) + '; grid-row:1;">'
                    + day.label
                    + ''
                    + '</div>';
            });

            for (let hour = startHour; hour <= endHour; hour++) {
                const row = hour - startHour + 2;
                const dawnClass = hour < 4 ? ' weekly-dawn-row' + (shouldShowDawnByDefault ? '' : ' weekly-dawn-row-hidden') : '';
                html += '<div class="weekly-schedule-cell weekly-schedule-time' + dawnClass + '" style="grid-column:1; grid-row:' + row + ';">' + String(hour).padStart(2, '0') + ':00</div>';

                days.forEach(function(day, idx) {
                    const isToday = day.date === formatProjectDate(new Date());
                    const weekendSlotClass = day.weekend ? ' weekend ' + (day.day === 0 ? 'sunday' : 'saturday') : '';
                    const todaySlotClass = isToday ? ' today-weekly-slot' : '';
                    const currentLineHtml = isToday && hour === new Date().getHours() ? getWeeklyCurrentTimeLineHtml(days, startHour, endHour) : '';
                    html += '<div class="weekly-schedule-cell weekly-schedule-slot' + weekendSlotClass + todaySlotClass + dawnClass + '" data-date="' + day.date + '" data-hour="' + hour + '" data-row="' + row + '" data-col="' + (idx + 2) + '" style="grid-column:' + (idx + 2) + '; grid-row:' + row + ';">' + currentLineHtml + '</div>';
                });
            }

            timeSchedules.forEach(function(schedule) {
                const scheduleId = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
                const title = schedule.TITLE || schedule.title || '제목 없음';
                const startDate = schedule.START_DATE || schedule.startDate || '';
                const endDate = schedule.END_DATE || schedule.endDate || startDate;
                const startTime = normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00');
                const endTime = normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00');
                const color = schedule.COLOR || schedule.color || '#4A90E2';

                days.forEach(function(day, idx) {
                    if (day.date < startDate || day.date > endDate) return;

                    const isFirstDay = day.date === startDate;
                    const isLastDay = day.date === endDate;

                    const eventStartHour = isFirstDay ? getWeeklyScheduleHour(startTime, '09:00') : startHour;
                    const eventEndHour = isLastDay ? getWeeklyScheduleEndHour(endTime, '18:00') : endHour + 1;
                    const safeStart = Math.max(startHour, Math.min(endHour, eventStartHour));
                    const safeEnd = Math.max(safeStart + 1, Math.min(endHour + 1, eventEndHour));

                    const col = idx + 2;
                    const rowStart = safeStart - startHour + 2;
                    const rowEnd = safeEnd - startHour + 2;

                    html += '<div class="weekly-schedule-event" data-schedule-id="' + scheduleId + '" onclick="if (!suppressWeeklyScheduleClick) openScheduleDetailModal(' + scheduleId + ')" '
                        + 'style="grid-column:' + col + '; grid-row:' + rowStart + ' / ' + rowEnd + '; background:' + color + ';" '
                        + 'title="' + safeTaskHtml(title) + ' · ' + startTime + ' ~ ' + endTime + '">'
                        + '<span class="weekly-schedule-event-title">' + safeTaskHtml(title) + '</span>'
                        + '</div>';
                });
            });

            html += '</div>';
            if (!hasWeeklyDawnSchedule(timeSchedules)) {
                html += '<button type="button" id="weeklyDawnToggleBtn" class="weekly-dawn-toggle" onclick="toggleWeeklyDawnRows()">' + (weeklyDawnExpanded ? '새벽 시간 접기' : '새벽 시간 더보기') + '</button>';
            }
            html += '</div>';
            target.innerHTML = html;
            bindWeeklyScheduleDragHandlers();
        }


        function renderProjectGantt(schedules) {
            const target = document.getElementById('projectGanttPreview');
            const scaleBadge = document.getElementById('ganttScaleBadge');

            if (!target) return;

            schedules = schedules || [];
            let rangeStart = parseProjectDate(window.PROJECT_MAIN_CONFIG.projectStartDate);
            let rangeEnd = parseProjectDate(window.PROJECT_MAIN_CONFIG.projectEndDate);

            schedules.forEach(schedule => {
                const start = parseProjectDate(schedule.START_DATE || schedule.startDate);
                const end = parseProjectDate(schedule.END_DATE || schedule.endDate);
                if (!start || !end) return;

                if (!rangeStart || start < rangeStart) rangeStart = start;
                if (!rangeEnd || end > rangeEnd) rangeEnd = end;
            });

            if (!rangeStart || !rangeEnd) {
                target.className = 'gantt-box';
                target.innerHTML = '<div class="gantt-empty">프로젝트 기간 정보가 없습니다.</div>';
                if (scaleBadge) scaleBadge.innerText = '기간 없음';
                return;
            }

            const totalDays = Math.max(getDateDiffInclusive(rangeStart, rangeEnd), 1);
            const scale = getGanttScale(totalDays);
            updateProjectTimelineScaleButtons(scale.type);

            if (scale.type === 'HOUR') {
                currentGanttScale = 'HOUR';
                currentGanttRangeStart = formatProjectDate(rangeStart);
                currentGanttRangeEnd = formatProjectDate(rangeEnd);
                currentGanttTicks = [];
                target.className = 'gantt-box weekly-schedule-mode';
                renderWeeklyScheduleTable(schedules, rangeStart, rangeEnd, target);
                if (scaleBadge) scaleBadge.innerText = scale.label;
                return;
            }

            const ticks = buildGanttTicks(rangeStart, rangeEnd, scale);
            const tickCount = Math.max(ticks.length, 1);

            currentGanttScale = scale.type;
            currentGanttRangeStart = formatProjectDate(rangeStart);
            currentGanttRangeEnd = formatProjectDate(rangeEnd);
            currentGanttTicks = ticks.map(tick => ({
                startDate: formatProjectDate(tick.start),
                endDate: formatProjectDate(tick.end),
                startTime: tick.startTime || '',
                endTime: tick.endTime || '',
                isSaturday: (scale.type === 'DAY' || scale.type === 'HOUR') && (tick.isSaturday || tick.start.getDay() === 6),
                isSunday: (scale.type === 'DAY' || scale.type === 'HOUR') && (tick.isSunday || tick.start.getDay() === 0),
                isWeekend: (scale.type === 'DAY' || scale.type === 'HOUR') && (tick.isWeekend || tick.start.getDay() === 0 || tick.start.getDay() === 6)
            }));

            if (scaleBadge) scaleBadge.innerText = scale.label;

            target.className = 'gantt-box' + (scale.type === 'DAY' ? '' : ' gantt-scrollable');

            let tickMinWidth = 0;
            if (scale.type === 'WEEK') tickMinWidth = 70;
            if (scale.type === 'MONTH') tickMinWidth = 90;

            let dateColumnTemplate = 'repeat(' + tickCount + ', minmax(0, 1fr))';
            if (tickMinWidth > 0) {
                dateColumnTemplate = 'repeat(' + tickCount + ', minmax(' + tickMinWidth + 'px, 1fr))';
            }

            const fullGridTemplate = '130px ' + dateColumnTemplate;
            const todayString = formatProjectDate(new Date());

            function buildCells(rowKey) {
                let cells = '';

                currentGanttTicks.forEach(tick => {
                    const todayClass = todayString >= tick.startDate && todayString <= tick.endDate ? ' today-gantt-cell' : '';
                    const weekendClass = tick.isSunday ? ' sunday-gantt-cell' : (tick.isSaturday ? ' saturday-gantt-cell' : '');
                    const cellColumn = currentGanttTicks.indexOf(tick) + 1;
                    cells += '<div class="gantt-cell' + todayClass + weekendClass + '" data-start-date="' + tick.startDate + '" data-end-date="' + tick.endDate + '" data-start-time="' + (tick.startTime || '') + '" data-end-time="' + (tick.endTime || '') + '" data-row-key="' + rowKey + '" data-tick-index="' + cellColumn + '" style="grid-column:' + cellColumn + ';"></div>';
                });

                return cells;
            }

            function findTickColumnByDateTime(dateStr, timeStr, isEnd) {
                if (scale.type !== 'HOUR') {
                    return findTickColumnByDate(dateStr);
                }

                const target = parseProjectDateTime(dateStr, timeStr || (isEnd ? '23:59' : '00:00'), isEnd);
                if (!target || !currentGanttTicks || currentGanttTicks.length === 0) return 1;

                for (let i = 0; i < currentGanttTicks.length; i++) {
                    const tick = currentGanttTicks[i];
                    const tickStart = parseProjectDateTime(tick.startDate, tick.startTime || '00:00', false);
                    const tickEnd = parseProjectDateTime(tick.endDate, tick.endTime || '23:59', true);

                    if (tickStart && tickEnd && target >= tickStart && target <= tickEnd) {
                        return i + 1;
                    }
                }

                return isEnd ? currentGanttTicks.length : 1;
            }

            function getBarGridStyle(startDate, startTime, endDate, endTime, useTime) {
                let startColumn;
                let endColumn;

                startColumn = findTickColumnByDate(startDate);
                endColumn = findTickColumnByDate(endDate);

                if (endColumn < startColumn) endColumn = startColumn;

                const spanColumn = Math.max(endColumn - startColumn + 1, 1);

                return 'grid-column:' + startColumn + ' / span ' + spanColumn + ';';
            }

            let html = '<div class="gantt-inner">';

            html += '<div class="gantt-header-row" style="grid-template-columns:' + fullGridTemplate + ';">';
            html += '<div class="gantt-label-spacer"></div>';

            currentGanttTicks.forEach((tick, index) => {
                const isTodayInTick = todayString >= tick.startDate && todayString <= tick.endDate;
                const todayClass = isTodayInTick ? ' today-gantt-header' : '';
                const weekendClass = tick.isSunday ? ' sunday-gantt-header' : (tick.isSaturday ? ' saturday-gantt-header' : '');

                let tickLabelHtml = '<span class="tick-main">' + ticks[index].label + '</span>';

                if (scale.type !== 'DAY') {
                    tickLabelHtml += '<span class="tick-range">' + tick.startDate.substring(5).replace('-', '/') + '~' + tick.endDate.substring(5).replace('-', '/') + '</span>';
                }

                const headerColumn = index + 2;
                html += '<div class="gantt-date-cell' + todayClass + weekendClass + '" title="' + tick.startDate + ' ~ ' + tick.endDate + '" style="grid-column:' + headerColumn + ';">' + tickLabelHtml + '</div>';
            });

            html += '</div>';

            if (schedules.length === 0) {
                const rowKey = 'empty-create-row';

                html +=
                    '<div class="gantt-row" style="grid-template-columns:' + fullGridTemplate + ';">' +
                        '<div class="gantt-label gantt-empty-row-label">새 일정</div>' +
                        '<div class="gantt-track" style="grid-template-columns:' + dateColumnTemplate + ';">' +
                            buildCells(rowKey) +
                        '</div>' +
                    '</div>' +
                    '<div class="gantt-empty-guide"><strong>빈 칸을 드래그</strong>해서 프로젝트 일정을 바로 등록하세요. 주/월 단위에서는 해당 주/월 범위로 등록됩니다.</div>';

                html += '</div>';
                target.innerHTML = html;
                bindGanttDragHandlers();
                return;
            }

            schedules.forEach(schedule => {
                const scheduleId = schedule.EVENT_ID || schedule.SCHEDULE_ID || schedule.scheduleId;
                const title = schedule.TITLE || schedule.title || '제목 없음';
                const startDate = schedule.START_DATE || schedule.startDate;
                const endDate = schedule.END_DATE || schedule.endDate;
                const useTime = isScheduleTimeEnabled(schedule);
                const startTime = useTime ? normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00') : '';
                const endTime = useTime ? normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00') : '';
                const color = schedule.COLOR || schedule.color || '#4A90E2';

                const start = parseProjectDate(startDate);
                const end = parseProjectDate(endDate);

                if (!start || !end) return;

                const rowKey = 'schedule-' + scheduleId;

                const timeText = useTime ? '<span class="gantt-bar-time">' + startTime + ' ~ ' + endTime + '</span>' : '';
                const barTitle = title + ' · ' + startDate + (useTime ? ' ' + startTime : '') + ' ~ ' + endDate + (useTime ? ' ' + endTime : '');

                const barHtml =
                    '<div class="gantt-bar" data-title="' + title + '" title="' + barTitle + '" ' +
                        'onmousedown="startGanttBarDrag(event, ' + scheduleId + ', \'MOVE\')" ' +
                        'onclick="handleGanttBarClick(event, ' + scheduleId + ')" ' +
                        'style="' + getBarGridStyle(startDate, startTime, endDate, endTime, useTime) + ' background:' + color + ';">' +
                        '<span class="gantt-resize-handle left" onmousedown="startGanttBarDrag(event, ' + scheduleId + ', \'RESIZE_START\')"></span>' +
                        '<span class="gantt-resize-handle right" onmousedown="startGanttBarDrag(event, ' + scheduleId + ', \'RESIZE_END\')"></span>' +
                        timeText +
                    '</div>';

                html +=
                    '<div class="gantt-row" style="grid-template-columns:' + fullGridTemplate + ';">' +
                        '<div class="gantt-label" title="' + title + '"><span class="gantt-label-dot" style="background:' + color + ';"></span><span class="gantt-label-text">' + title + '</span></div>' +
                        '<div class="gantt-track" style="grid-template-columns:' + dateColumnTemplate + ';">' +
                            buildCells(rowKey) +
                            barHtml +
                        '</div>' +
                    '</div>';
            });

            html += '</div>';
            target.innerHTML = html;
            bindGanttDragHandlers();
        }

        async function loadProjectSchedules() {
            const projId = new URLSearchParams(window.location.search).get('projId');
            const target = document.getElementById('projectScheduleList');

            if (!target) return;

            if (!projId) {
                console.error('[프로젝트 일정] URL에 projId가 없습니다.');
                target.innerHTML =
                    '<div class="schedule-empty">프로젝트 정보를 확인할 수 없습니다.</div>';
                return;
            }

            const requestUrl =
                '/project/api/schedules?projId=' + encodeURIComponent(projId);

            try {
                const response = await fetch(requestUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const responseText = await response.text();

                if (!response.ok) {
                    console.error('[프로젝트 일정] 요청 실패', {
                        url: requestUrl,
                        status: response.status,
                        statusText: response.statusText,
                        response: responseText
                    });

                    throw new Error(
                        '프로젝트 일정 조회 실패'
                        + ' (' + response.status + ' ' + response.statusText + ')'
                    );
                }

                let data;

                try {
                    data = responseText ? JSON.parse(responseText) : [];
                } catch (parseError) {
                    console.error('[프로젝트 일정] JSON 변환 실패', {
                        url: requestUrl,
                        response: responseText,
                        error: parseError
                    });

                    throw new Error('프로젝트 일정 응답 형식이 올바르지 않습니다.');
                }

                if (!Array.isArray(data)) {
                    console.error('[프로젝트 일정] 배열이 아닌 응답 수신', data);
                    throw new Error('프로젝트 일정 응답 데이터가 올바르지 않습니다.');
                }

                projectCalendarSchedules = data;

                generateProjectMiniCalendar();
                renderProjectGantt(projectCalendarSchedules);

                target.innerHTML = '';

                if (data.length === 0) {
                    target.innerHTML =
                        '<div class="schedule-empty">등록된 프로젝트 일정이 없습니다.</div>';
                    return;
                }

                data.forEach(schedule => {
                    const scheduleId =
                        schedule.EVENT_ID
                        || schedule.SCHEDULE_ID
                        || schedule.scheduleId;

                    const title =
                        schedule.TITLE
                        || schedule.title
                        || '제목 없음';

                    const start =
                        schedule.START_DATE
                        || schedule.startDate
                        || '';

                    const end =
                        schedule.END_DATE
                        || schedule.endDate
                        || '';

                    const status =
                        schedule.STATUS
                        || schedule.status
                        || 'TODO';

                    const color =
                        schedule.COLOR
                        || schedule.color
                        || '#4A90E2';

                    const html =
                        '<div class="schedule-item" '
                        + 'onclick="openScheduleDetailModal(' + scheduleId + ')">'
                        + '<div class="schedule-left">'
                        + '<div class="schedule-title">'
                        + '<span class="schedule-dot" style="background:'
                        + color + ';"></span>'
                        + '<span>' + title + '</span>'
                        + '</div>'
                        + '<div class="schedule-date">'
                        + start + ' ~ ' + end
                        + '</div>'
                        + '</div>'
                        + '<div class="schedule-status '
                        + getScheduleStatusClass(status) + '">'
                        + getScheduleStatusText(status)
                        + '</div>'
                        + '</div>';

                    target.insertAdjacentHTML('beforeend', html);
                });
            } catch (error) {
                console.error('[프로젝트 일정] 로딩 오류:', error);

                projectCalendarSchedules = [];

                try {
                    generateProjectMiniCalendar();
                    renderProjectGantt([]);
                } catch (renderError) {
                    console.error(
                        '[프로젝트 일정] 빈 화면 렌더링 오류:',
                        renderError
                    );
                }

                target.innerHTML =
                    '<div class="schedule-empty">'
                    + '프로젝트 일정을 불러오지 못했습니다.'
                    + '<br><small>브라우저 콘솔에서 요청 상태와 서버 응답을 확인해주세요.</small>'
                    + '</div>';
            }
        }

        function openAddScheduleModal() {
            const nextColor = getNextScheduleColor();

            const titleInput = document.getElementById('scheduleTitle');
            const startInput = document.getElementById('scheduleStartDate');
            const endInput = document.getElementById('scheduleEndDate');
            const statusInput = document.getElementById('scheduleStatus');

            if (titleInput) titleInput.value = '';
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
            if (statusInput) statusInput.value = 'TODO';
            bindScheduleTimeInputNormalization();
            setScheduleTimeSplitValue('scheduleStartTime', '09:00');
            setScheduleTimeSplitValue('scheduleEndTime', '18:00');
            toggleScheduleTimeFields(false, false);
            bindScheduleTimeInputNormalization();

            renderScheduleColorChips();
            applyScheduleColorSelection(nextColor, false);
            openModal('addScheduleModal');
        }

        function selectScheduleColor(color) {
            applyScheduleColorSelection(color, false);
        }

        function addProjectSchedule() {
            const urlParams = new URLSearchParams(window.location.search);
            const projId = urlParams.get('projId');
            const wsId = urlParams.get('wsId');

            const title = document.getElementById('scheduleTitle').value.trim();
            const startDate = document.getElementById('scheduleStartDate').value;
            const endDate = document.getElementById('scheduleEndDate').value;
            const status = document.getElementById('scheduleStatus').value;
            const useTime = !!(document.getElementById('scheduleUseTime') && document.getElementById('scheduleUseTime').checked);
            const startTime = useTime ? document.getElementById('scheduleStartTime').value : '';
            const endTime = useTime ? document.getElementById('scheduleEndTime').value : '';
            const color = document.getElementById('scheduleColor').value || '#4A90E2';

            if (!title) return alert('일정명을 입력해주세요.');
            if (!startDate) return alert('시작일을 선택해주세요.');
            if (!endDate) return alert('종료일을 선택해주세요.');
            if (new Date(startDate) > new Date(endDate)) return alert('종료일은 시작일보다 빠를 수 없습니다.');

            const params = new URLSearchParams();
            params.append('projId', projId);
            params.append('wsId', wsId);
            params.append('title', title);
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }
            params.append('color', color);

            fetch('/project/api/add-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    closeModal('addScheduleModal');
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 추가 실패');
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
            });
        }



        function openScheduleDetailModal(scheduleId) {
            currentScheduleId = scheduleId;

            fetch('/project/api/schedule-detail?scheduleId=' + scheduleId)
                .then(res => {
                    if (!res.ok) throw new Error('프로젝트 일정 상세 조회 실패');
                    return res.json();
                })
                .then(schedule => {
                    const title = schedule.TITLE || schedule.title || '';
                    const start = schedule.START_DATE || schedule.startDate || '';
                    const end = schedule.END_DATE || schedule.endDate || '';
                    const status = schedule.STATUS || schedule.status || 'TODO';
                    const useTime = isScheduleTimeEnabled(schedule);
                    const startTime = useTime ? normalizeScheduleTime(schedule.START_TIME || schedule.startTime, '09:00') : '09:00';
                    const endTime = useTime ? normalizeScheduleTime(schedule.END_TIME || schedule.endTime, '18:00') : '18:00';
                    const color = schedule.COLOR || schedule.color || '#4A90E2';

                    document.getElementById('editScheduleTitle').value = title;
                    document.getElementById('editScheduleStartDate').value = start;
                    document.getElementById('editScheduleEndDate').value = end;
                    document.getElementById('editScheduleStatus').value = status;
                    setScheduleTimeSplitValue('editScheduleStartTime', startTime || '09:00');
                    setScheduleTimeSplitValue('editScheduleEndTime', endTime || '18:00');
                    toggleScheduleTimeFields(useTime, true);
                    bindScheduleTimeInputNormalization();
                    addSchedulePaletteColor(color);
                    renderScheduleColorChips();
                    applyScheduleColorSelection(color, true);

                    openModal('editScheduleModal');
                })
                .catch(err => {
                    console.error(err);
                    alert('프로젝트 일정 정보를 불러오지 못했습니다.');
                });
        }

        function selectEditScheduleColor(color) {
            applyScheduleColorSelection(color, true);
        }

        function updateProjectSchedule() {
            if (!currentScheduleId) return alert('수정할 일정을 선택해주세요.');

            const title = document.getElementById('editScheduleTitle').value.trim();
            const startDate = document.getElementById('editScheduleStartDate').value;
            const endDate = document.getElementById('editScheduleEndDate').value;
            const status = document.getElementById('editScheduleStatus').value;
            const useTime = !!(document.getElementById('editScheduleUseTime') && document.getElementById('editScheduleUseTime').checked);
            const startTime = useTime ? document.getElementById('editScheduleStartTime').value : '';
            const endTime = useTime ? document.getElementById('editScheduleEndTime').value : '';
            const color = document.getElementById('editScheduleColor').value || '#4A90E2';

            if (!title) return alert('일정명을 입력해주세요.');
            if (!startDate) return alert('시작일을 선택해주세요.');
            if (!endDate) return alert('종료일을 선택해주세요.');
            if (new Date(startDate) > new Date(endDate)) return alert('종료일은 시작일보다 빠를 수 없습니다.');

            const params = new URLSearchParams();
            params.append('scheduleId', currentScheduleId);
            params.append('title', title);
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }
            params.append('color', color);

            fetch('/project/api/update-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    closeModal('editScheduleModal');
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 수정 실패');
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
            });
        }

        function deleteProjectSchedule() {
            if (!currentScheduleId) return alert('삭제할 일정을 선택해주세요.');
            if (!confirm('정말 이 프로젝트 일정을 삭제하시겠습니까?')) return;

            const params = new URLSearchParams();
            params.append('scheduleId', currentScheduleId);

            fetch('/project/api/delete-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    closeModal('editScheduleModal');
                    currentScheduleId = null;
                    loadProjectSchedules();
                } else {
                    alert('프로젝트 일정 삭제 실패');
                }
            })
            .catch(err => {
                console.error(err);
                alert('서버 통신 중 오류가 발생했습니다.');
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


        function getTodayDateString() {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            return yyyy + '-' + mm + '-' + dd;
        }

        function normalizeTaskTime(value, fallback) {
            const raw = String(value || '').trim();
            if (/^\d{2}:\d{2}$/.test(raw)) return raw;
            if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw.substring(0, 5);
            if (raw.toUpperCase() === 'AM') return '09:00';
            if (raw.toUpperCase() === 'PM') return '18:00';
            return fallback || '09:00';
        }

        function formatTaskTimeText(value) {
            const time = normalizeTaskTime(value, '');
            return time || '';
        }

        function formatTaskSlotText(dateText, timeValue, type) {
            if (!dateText) return '미정';
            const clock = formatTaskTimeText(timeValue);
            return dateText + (clock ? ' ' + clock : '');
        }

        function isTaskTimeEnabledFromData(task) {
            if (!task) return false;

            // 서버가 USE_TIME='Y'로 내려준 업무만 시간을 표시합니다.
            // 기존 AM/PM 데이터나 이전 패치에서 기본값으로 저장된 09:00 값은 날짜만 보여야 합니다.
            return String(task.USE_TIME || task.useTime || '').toUpperCase() === 'Y';
        }

        function toggleTaskTimeFields(enabled) {
            const useTimeEl = document.getElementById('taskUseTime');
            const startTimeEl = document.getElementById('taskStartTime');
            const endTimeEl = document.getElementById('taskEndTime');

            if (useTimeEl) useTimeEl.checked = !!enabled;

            [startTimeEl, endTimeEl].forEach(function(el) {
                if (!el) return;
                el.disabled = !enabled;
                const wrap = el.closest('.task-time-field');
                if (wrap) wrap.classList.toggle('disabled', !enabled);
            });
        }

        function getTaskUseTimeValue() {
            const el = document.getElementById('taskUseTime');
            return !!(el && el.checked);
        }


        function safeTaskHtml(value) {
            return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

function loadTaskMemberOptions(selectedUserId) {
            const projId = new URLSearchParams(window.location.search).get('projId');
            const loginUserId = window.PROJECT_MAIN_CONFIG.loginUserId;
            const projectLeaderId = window.PROJECT_MAIN_CONFIG.projectLeaderId;

            return fetch('/project/api/members?projId=' + projId)
                .then(res => res.json())
                .then(members => {
                    projectTaskMemberList = members || [];
                    const select = document.getElementById('taskAssignedUserId');

                    if (!select) return;

                    let loginMember = null;

                    projectTaskMemberList.forEach(member => {
                        const userId = member.USER_ID || member.userId;

                        if (String(userId) === String(loginUserId)) {
                            loginMember = member;
                        }
                    });

                    const isAdmin = (String(loginUserId) === String(projectLeaderId)) || (loginMember && String(loginMember.PROJ_ROLE || '').toUpperCase() === 'ADMIN');

                    document.body.classList.toggle('admin-mode', !!isAdmin);

                    let defaultUserId = selectedUserId || loginUserId;

                    let html = '';

                    projectTaskMemberList.forEach(member => {
                        const userId = member.USER_ID || member.userId;
                        const userName = member.USER_NAME || member.userName || '이름 없음';
                        const selected = String(userId) === String(defaultUserId || '') ? ' selected' : '';

                        html += '<option value="' + userId + '"' + selected + '>' + userName + '</option>';
                    });

                    select.innerHTML = html;

                    if (!isAdmin) {
                        select.value = loginUserId;
                    }
                })
                .catch(err => console.error('업무 담당자 목록 로딩 실패:', err));
        }


// 1. 업무 추가용 모달 열기
		function openAddTaskModal() {
		    document.getElementById('taskModalTitle').innerText = "새 업무 추가";
		    currentTaskId = null;
		    document.getElementById('taskTitle').value = "";
		    document.getElementById('taskStartDate').value = getTodayDateString();
		    document.getElementById('taskEndDate').value = getTodayDateString();
		    setTaskStatusValue('TODO');
		    document.getElementById('taskStartTime').value = '09:00';
		    document.getElementById('taskEndTime').value = '18:00';
		    toggleTaskTimeFields(false);
		    loadTaskMemberOptions();

		    setModalMode(true);

		    // 요소가 존재할 때만 style에 접근하도록 수정
		    var editBtn = document.getElementById('editBtn');
		    var saveBtn = document.getElementById('saveBtn');
		    var addBtn = document.getElementById('addBtn');

		    var deleteBtn = document.getElementById('deleteBtn');

		    if (editBtn) editBtn.style.display = 'none';
		    if (saveBtn) saveBtn.style.display = 'none';
		    if (deleteBtn) deleteBtn.style.display = 'none';
		    if (addBtn) addBtn.style.display = 'inline-block';

		    openModal('addTaskModal');
		}

		// 2. 업무 상세 조회 (읽기 전용)
		function openTaskDetailModal(taskId) {
		    currentTaskId = taskId;
		    fetch('/project/api/task-detail?taskId=' + taskId)
		        .then(res => res.json())
		        .then(task => {
		            document.getElementById('taskModalTitle').innerText = "업무 상세";
		            document.getElementById('taskTitle').value = task.TITLE || "";
		            document.getElementById('taskStartDate').value = task.START_DATE || "";
		            document.getElementById('taskEndDate').value = task.END_DATE || "";
		            setTaskStatusValue(task.STATUS || 'TODO');
		            loadTaskMemberOptions(task.USER_ID);
                    const detailUseTime = isTaskTimeEnabledFromData(task);
                    document.getElementById('taskStartTime').value = normalizeTaskTime(task.START_TIME || task.startTime || task.START_TIME_SLOT || task.startTimeSlot, '09:00');
                    document.getElementById('taskEndTime').value = normalizeTaskTime(task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot, '18:00');
                    toggleTaskTimeFields(detailUseTime);

                    let autoInfo = document.getElementById('taskAutoTimeInfo');
                    if (!autoInfo) {
                        autoInfo = document.createElement('div');
                        autoInfo.id = 'taskAutoTimeInfo';
                        autoInfo.style.marginTop = '8px';
                        autoInfo.style.fontSize = '12px';
                        autoInfo.style.color = '#777';
                        document.getElementById('taskStatus').parentElement.appendChild(autoInfo);
                    }

                    const actualStart = task.ACTUAL_START_DATE || '';
                    const actualDone = task.ACTUAL_DONE_DATE || '';
                    const delayedYn = task.DELAYED_YN || 'N';

                    autoInfo.innerHTML =
                        (actualStart ? '시작: ' + actualStart + '<br>' : '') +
                        (actualDone ? '완료: ' + actualDone + '<br>' : '') +
                        (delayedYn === 'Y' ? '<span style="color:#ff4d4d;font-weight:800;">지연 중</span>' : '');

		            setModalMode(false);

		            document.getElementById('editBtn').style.display = 'inline-block';
		            document.getElementById('deleteBtn').style.display = 'inline-block';
		            document.getElementById('saveBtn').style.display = 'none';
		            document.getElementById('addBtn').style.display = 'none';

		            openModal('addTaskModal');
		        });
		}

		// 3. 수정 모드 전환
		function enableEdit() {
		    setModalMode(true);

            const titleEl = document.getElementById('taskModalTitle');
            if (titleEl) {
                titleEl.innerText = '업무 수정';
            }

            const addBtn = document.getElementById('addBtn');
            const editBtn = document.getElementById('editBtn');
            const saveBtn = document.getElementById('saveBtn');
            const deleteBtn = document.getElementById('deleteBtn');

            if (addBtn) addBtn.style.display = 'none';
            if (editBtn) editBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'inline-flex';
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';
		}

		// 4. 공통 입력 제어 함수

        function setTaskStatusValue(status) {
            const select = document.getElementById('taskStatus');
            if (select) {
                select.value = status || 'TODO';
            }

            document.querySelectorAll('.task-status-pill').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.status === (status || 'TODO'));
            });
        }


function setModalMode(isEdit) {
		    const fieldIds = [
                'taskTitle',
                'taskStartDate',
                'taskEndDate',
                'taskStatus',
                'taskAssignedUserId',
                'taskUseTime',
                'taskStartTime',
                'taskEndTime'
            ];

            fieldIds.forEach(function(id) {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = !isEdit;
                }
            });

            if (isEdit) {
                toggleTaskTimeFields(getTaskUseTimeValue());
            } else {
                const startTimeEl = document.getElementById('taskStartTime');
                const endTimeEl = document.getElementById('taskEndTime');
                if (startTimeEl) startTimeEl.disabled = true;
                if (endTimeEl) endTimeEl.disabled = true;
                document.querySelectorAll('.task-time-field').forEach(function(wrap) {
                    wrap.classList.toggle('disabled', !getTaskUseTimeValue());
                });
            }

            document.querySelectorAll('.task-status-pill').forEach(function(btn) {
                btn.disabled = !isEdit;
            });
		}

		function addTask() {
            const projId = new URLSearchParams(window.location.search).get('projId');
            const wsId = new URLSearchParams(window.location.search).get('wsId');

            const title = document.getElementById('taskTitle').value;
            const startDate = document.getElementById('taskStartDate').value;
            const endDate = document.getElementById('taskEndDate').value;
            const status = document.getElementById('taskStatus').value;
            const useTime = getTaskUseTimeValue();
            const startTime = useTime ? document.getElementById('taskStartTime').value : '';
            const endTime = useTime ? document.getElementById('taskEndTime').value : '';
            const assignedUserId = document.getElementById('taskAssignedUserId') ? document.getElementById('taskAssignedUserId').value : '';

            if (!title || !title.trim()) {
                alert('제목을 입력하세요.');
                return;
            }

            const params = new URLSearchParams();
            params.append('projId', projId);
            params.append('wsId', wsId);
            params.append('title', title.trim());
            params.append('loginUserId', window.PROJECT_MAIN_CONFIG.loginUserId || '');
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }

            if (assignedUserId) {
                params.append('assignedUserId', assignedUserId);
            }

            fetch('/project/api/add-task', {
                method: 'POST',
                credentials: 'include',
                body: params
            })
            .then(function(res) { return res.text(); })
            .then(function(res) {
                if (res === 'SUCCESS') {
                    closeModal('addTaskModal');
                    refreshProjectTaskAndMemberView();
                } else {
                    alert('추가 실패: ' + res);
                }
            })
            .catch(function(err) {
                console.error('업무 추가 실패:', err);
                alert('업무 추가 중 오류가 발생했습니다.');
            });
        }
		function updateTask(taskId) {
            const title = document.getElementById('taskTitle').value;
            const startDate = document.getElementById('taskStartDate').value;
            const endDate = document.getElementById('taskEndDate').value;
            const status = document.getElementById('taskStatus').value;
            const useTime = getTaskUseTimeValue();
            const startTime = useTime ? document.getElementById('taskStartTime').value : '';
            const endTime = useTime ? document.getElementById('taskEndTime').value : '';
            const assignedUserId = document.getElementById('taskAssignedUserId') ? document.getElementById('taskAssignedUserId').value : '';

            if (!title || !title.trim()) {
                alert('제목을 입력하세요.');
                return;
            }

            const params = new URLSearchParams();
            params.append('taskId', taskId);
            params.append('title', title.trim());
            params.append('loginUserId', window.PROJECT_MAIN_CONFIG.loginUserId || '');
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }

            if (assignedUserId) {
                params.append('assignedUserId', assignedUserId);
            }

            fetch('/project/api/update-task', {
                method: 'POST',
                credentials: 'include',
                body: params
            })
            .then(function(res) { return res.text(); })
            .then(function(res) {
                if (res === 'SUCCESS') {
                    closeModal('addTaskModal');
                    refreshProjectTaskAndMemberView();
                } else {
                    alert('수정 실패: ' + res);
                }
            })
            .catch(function(err) {
                console.error('업무 수정 실패:', err);
                alert('업무 수정 중 오류가 발생했습니다.');
            });
        }
		function deleteTask() {
            if (!currentTaskId) {
                alert('업무를 선택해주세요.');
                return;
            }

            if (!confirm('정말 이 업무를 삭제하시겠습니까?')) {
                return;
            }

            fetch('/project/api/delete-task?taskId=' + currentTaskId, {
                method: 'POST'
            })
            .then(function(res) { return res.text(); })
            .then(function(res) {
                if (res === 'SUCCESS') {
                    closeModal('addTaskModal');
                    refreshProjectTaskAndMemberView();
                } else {
                    alert('삭제 실패');
                }
            })
            .catch(function(err) {
                console.error('업무 삭제 실패:', err);
                alert('업무 삭제 중 오류가 발생했습니다.');
            });
        }


		// 1. 프로젝트 삭제 함수
		function deleteProject() {
		    const projId = new URLSearchParams(window.location.search).get('projId');

		    const params = new URLSearchParams();
		    params.append("projId", projId);

		    fetch('/project/api/delete-project', {
		        method: 'POST',
		        body: params
		    })
		    .then(res => res.text())
		    .then(result => {
		        if (result === 'SUCCESS') {
		            alert("프로젝트가 삭제되었습니다.");

		            // 👉 여기 핵심: 워크스페이스로 이동
		            const wsId = new URLSearchParams(window.location.search).get('wsId');
		            window.location.href = `/workspace/main?wsId=${wsId}`;
		        } else {
		            alert("삭제 실패");
		        }
		    });
		}


        function goProjectSettings() {
            const params = new URLSearchParams(window.location.search);
            const wsId = params.get('wsId') || window.PROJECT_MAIN_CONFIG.paramWsId || window.PROJECT_MAIN_CONFIG.wsId;
            const projId = params.get('projId') || window.PROJECT_MAIN_CONFIG.paramProjId || window.PROJECT_MAIN_CONFIG.projectId;

            if (!wsId || !projId || wsId === 'null' || projId === 'null') {
                alert('프로젝트 설정으로 이동할 수 없습니다.');
                return;
            }

            location.href = '/project/settings?wsId=' + encodeURIComponent(wsId) + '&projId=' + encodeURIComponent(projId);
        }


function openEditProjectModal() {
            const startDate = document.getElementById('editStartDate').value;
            const endDateInput = document.getElementById('editEndDate');

            if (startDate && endDateInput) {
                endDateInput.setAttribute('min', startDate);
            }

            openModal('editProjectModal');
        }

		function updateProject() {
            const projId = new URLSearchParams(window.location.search).get('projId');

            const projName = document.getElementById('editProjName').value.trim();
            const projType = document.getElementById('editProjType').value;
            const startDate = document.getElementById('editStartDate').value;
            const endDate = document.getElementById('editEndDate').value;
            const projDesc = document.getElementById('editProjDesc').value.trim();

            if (!projName) {
                alert("프로젝트명을 입력해주세요.");
                document.getElementById('editProjName').focus();
                return;
            }

            if (!startDate) {
                alert("시작일을 선택해주세요.");
                document.getElementById('editStartDate').focus();
                return;
            }

            if (!endDate) {
                alert("종료일을 선택해주세요.");
                document.getElementById('editEndDate').focus();
                return;
            }

            if (endDate < startDate) {
                alert("종료일은 시작일보다 빠를 수 없습니다.");
                document.getElementById('editEndDate').focus();
                return;
            }

            const data = {
                projId: projId,
                projName: projName,
                projType: projType,
                startDate: startDate,
                endDate: endDate,
                projDesc: projDesc
            };

            fetch('/project/api/update-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    alert("수정되었습니다.");
                    location.reload();
                } else {
                    alert("수정 실패");
                }
            })
            .catch(err => {
                console.error(err);
                alert("수정 중 오류가 발생했습니다.");
            });
        }
		let projectCalendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		let projectCalendarTasks = [];
		let projectCalendarSchedules = [];

		function parseProjectDate(dateStr) {
		    if (!dateStr) return null;
		    const parts = dateStr.split('-');
		    if (parts.length < 3) return null;
		    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
		}

		function formatProjectDate(date) {
		    const y = date.getFullYear();
		    const m = String(date.getMonth() + 1).padStart(2, '0');
		    const d = String(date.getDate()).padStart(2, '0');
		    return y + '-' + m + '-' + d;
		}

        function isSameProjectDate(date, dateStr) {
            const target = parseProjectDate(dateStr);
            if (!target) return false;

            return date.getFullYear() === target.getFullYear()
                && date.getMonth() === target.getMonth()
                && date.getDate() === target.getDate();
        }

        function isDateInProjectRange(date) {
            const start = parseProjectDate(window.PROJECT_MAIN_CONFIG.projectStartDate);
            const end = parseProjectDate(window.PROJECT_MAIN_CONFIG.projectEndDate);

            if (!start || !end) return false;

            const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return target >= start && target <= end;
        }

        function calculateProjectDday() {
            const endDateStr = window.PROJECT_MAIN_CONFIG.projectEndDate;
            const badge = document.getElementById("projectDdayBadge");

            if (!badge || !endDateStr) return;

            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endDate = parseProjectDate(endDateStr);

            if (!endDate) {
                badge.innerText = "기간 미정";
                badge.className = "side-dday dday-ended";
                return;
            }

            const diffMs = endDate - todayOnly;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                badge.innerText = "D-" + diffDays;
                badge.className = "side-dday";
            } else if (diffDays === 0) {
                badge.innerText = "D-Day";
                badge.className = "side-dday dday-today";
            } else {
                badge.innerText = "종료됨";
                badge.className = "side-dday dday-ended";
            }
        }

		function isDateInTaskRange(date, task) {
		    const start = parseProjectDate(task.START_DATE);
		    const end = parseProjectDate(task.END_DATE || task.START_DATE);
		    if (!start || !end) return false;
		    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		    return target >= start && target <= end;
		}


        function getScheduleColor(schedule) {
            return (schedule.COLOR || schedule.color || '#4A90E2').trim();
        }

        function hexToRgba(hex, alpha) {
            let color = (hex || '#4A90E2').replace('#', '').trim();

            if (color.length === 3) {
                color = color.split('').map(ch => ch + ch).join('');
            }

            if (color.length !== 6) {
                return 'rgba(74,144,226,' + alpha + ')';
            }

            const r = parseInt(color.substring(0, 2), 16);
            const g = parseInt(color.substring(2, 4), 16);
            const b = parseInt(color.substring(4, 6), 16);

            if ([r, g, b].some(v => Number.isNaN(v))) {
                return 'rgba(74,144,226,' + alpha + ')';
            }

            return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        }

        function isSameScheduleBoundary(date, schedule) {
            return isSameProjectDate(date, schedule.START_DATE || schedule.startDate)
                || isSameProjectDate(date, schedule.END_DATE || schedule.endDate);
        }

        function isDateInScheduleRange(date, schedule) {
            const start = parseProjectDate(schedule.START_DATE || schedule.startDate);
            const end = parseProjectDate(schedule.END_DATE || schedule.endDate || schedule.START_DATE || schedule.startDate);
            if (!start || !end) return false;
            const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return target >= start && target <= end;
        }

        function isTaskDueDate(date, task) {
            const due = parseProjectDate(task.END_DATE || task.START_DATE);
            if (!due) return false;

            return date.getFullYear() === due.getFullYear()
                && date.getMonth() === due.getMonth()
                && date.getDate() === due.getDate();
        }

		function drawCalendar(tasks) {
		    projectCalendarTasks = tasks || [];
		    generateProjectMiniCalendar();
		}

		function generateProjectMiniCalendar() {
		    const grid = document.getElementById('projectCalendarGrid');
		    const title = document.getElementById('projectCalendarTitle');
		    if (!grid || !title) return;

		    const year = projectCalendarDate.getFullYear();
		    const month = projectCalendarDate.getMonth();
		    title.textContent = year + '.' + String(month + 1).padStart(2, '0');

		    grid.querySelectorAll('.day-num, .empty-slot').forEach(el => el.remove());

		    const firstDay = new Date(year, month, 1).getDay();
		    const lastDate = new Date(year, month + 1, 0).getDate();
		    const today = new Date();

		    for (let i = 0; i < firstDay; i++) {
		        const empty = document.createElement('div');
		        empty.className = 'empty-slot';
		        grid.appendChild(empty);
		    }

		    for (let day = 1; day <= lastDate; day++) {
		        const cellDate = new Date(year, month, day);
		        const div = document.createElement('div');
		        div.className = 'day-num';
		        div.innerText = day;

                if (isDateInProjectRange(cellDate)) {
                    div.classList.add('project-period-day');
                }

                if (isSameProjectDate(cellDate, window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectStartDate)) {
                    div.classList.add('project-start-day');
                }

                if (isSameProjectDate(cellDate, window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectEndDate)) {
                    div.classList.add('project-end-day');
                }

		        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
		            div.classList.add('today');
		        }

                if (isSameProjectDate(cellDate, window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectStartDate) || isSameProjectDate(cellDate, window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.projectEndDate)) {
                    div.classList.add('project-boundary');
                }

                const matchedSchedules = (Array.isArray(projectCalendarSchedules) ? projectCalendarSchedules : []).filter(schedule => isDateInScheduleRange(cellDate, schedule));
                const dueTasks = (Array.isArray(projectCalendarTasks) ? projectCalendarTasks : []).filter(task => isTaskDueDate(cellDate, task));

                if (matchedSchedules.length > 0) {
                    const primarySchedule = matchedSchedules[0];
                    const scheduleColor = getScheduleColor(primarySchedule);

                    div.classList.add('schedule-range-day');
                    div.style.setProperty('--schedule-solid', scheduleColor);
                    div.style.setProperty('--schedule-bg', hexToRgba(scheduleColor, 0.14));
                    div.style.setProperty('--schedule-border', hexToRgba(scheduleColor, 0.32));

                    if (matchedSchedules.length > 1) {
                        div.classList.add('has-multiple-schedules');
                    }

                    if (matchedSchedules.some(schedule => isSameScheduleBoundary(cellDate, schedule))) {
                        div.classList.add('schedule-boundary');
                    }
                }

                if (matchedSchedules.length > 0 || dueTasks.length > 0) {
                    const markerRow = document.createElement('div');
                    markerRow.className = matchedSchedules.length > 0 ? 'calendar-marker-row schedule-hidden' : 'calendar-marker-row';

                    if (dueTasks.length > 0) {
                        const taskMarker = document.createElement('span');
                        taskMarker.className = 'calendar-marker task-marker';
                        markerRow.appendChild(taskMarker);
                    }

                    if (dueTasks.length > 0) {
                        div.appendChild(markerRow);
                    }

                    const scheduleTitles = matchedSchedules.map(s => '[일정] ' + (s.TITLE || '프로젝트 일정'));
                    const taskTitles = dueTasks.map(t => '[업무 마감] ' + (t.TITLE || '업무'));
                    div.setAttribute('title', scheduleTitles.concat(taskTitles).join('\n'));

                    div.onclick = function() {
                        if (matchedSchedules.length === 1 && dueTasks.length === 0) {
                            const scheduleId = matchedSchedules[0].EVENT_ID || matchedSchedules[0].SCHEDULE_ID;
                            if (scheduleId) openScheduleDetailModal(scheduleId);
                            return;
                        }

                        if (matchedSchedules.length === 0 && dueTasks.length === 1 && dueTasks[0].TASK_ID) {
                            openTaskDetailModal(dueTasks[0].TASK_ID);
                            return;
                        }

                        alert(formatProjectDate(cellDate) + ' 표시 항목\n\n' + scheduleTitles.concat(taskTitles).join('\n'));
                    };
                }

		        grid.appendChild(div);
		    }
		}

		function changeProjectMonth(delta) {
		    projectCalendarDate = new Date(
		        projectCalendarDate.getFullYear(),
		        projectCalendarDate.getMonth() + delta,
		        1
		    );
		    generateProjectMiniCalendar();
		}



		// 탭 클릭 시 달력 다시 그리기
				function drag(ev) {
				    ev.dataTransfer.setData("text", ev.target.id);
				}
				function drop(ev) {

				    ev.preventDefault();

				    const draggedId =
				        ev.dataTransfer.getData("text");

				    const draggedCard =
				        document.getElementById(draggedId);

				    // 기존 상태 확인
				    const oldListId =
				        draggedCard.parentElement.id;

				    let oldStatus = "";

				    if(oldListId === "todo-list")
				        oldStatus = "TODO";

				    else if(oldListId === "inprogress-list")
				        oldStatus = "IN_PROGRESS";

				    else if(oldListId === "done-list")
				        oldStatus = "DONE";

				    const targetList =
				        ev.currentTarget;

				    targetList.appendChild(draggedCard);

				    const taskId =
				        draggedId.replace("task-", "");

				    let newStatus = "";

				    if(targetList.id === "todo-list")
				        newStatus = "TODO";

				    else if(targetList.id === "inprogress-list")
				        newStatus = "IN_PROGRESS";

				    else if(targetList.id === "done-list")
				        newStatus = "DONE";

				    updateTaskStatus(taskId, newStatus);
				}
				// 3. 드롭 허용 함수
				function allowDrop(ev) {
				    ev.preventDefault(); // 기본 동작 방지
				}


				function updateTaskStatus(taskId, newStatus) {
            const params = new URLSearchParams();
            params.append('taskId', taskId);
            params.append('status', newStatus);

            fetch('/project/api/update-task-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            })
            .then(function(res) {
                if (!res.ok) throw new Error('서버 응답 오류');
                return res.text();
            })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    refreshProjectTaskAndMemberView();
                } else {
                    alert('상태 업데이트 실패');
                    refreshProjectTaskAndMemberView();
                }
            })
            .catch(function(err) {
                console.error('통신 실패:', err);
                refreshProjectTaskAndMemberView();
            });
        }


        function formatTaskDeadline(dateText, endTime) {
            if (!dateText) return '미정';
            const clock = formatTaskTimeText(endTime);
            return dateText + (clock ? ' ' + clock : '');
        }

function escapeTaskHtml(value) {
            return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }


        function formatTaskShortDate(dateText) {
            if (!dateText) return '미정';

            const value = String(dateText).substring(0, 10).replaceAll('.', '-').replaceAll('/', '-');
            const parts = value.split('-');

            if (parts.length >= 3) {
                return parts[1] + '/' + parts[2];
            }

            return value;
        }

        function formatTaskSlotShort(dateText, slotValue, type) {
            const shortDate = formatTaskShortDate(dateText);

            if (type === 'start') {
                return shortDate + (slotValue === 'PM' ? ' 오후 시작' : ' 오전 시작');
            }

            return shortDate + (slotValue === 'AM' ? ' 오전 마감' : ' 오후 마감');
        }

        function getAssigneeBadgeText(userName) {
            const name = String(userName || '미정').trim();

            if (name.length <= 3) {
                return name;
            }

            return name.substring(0, 3);
        }


        function formatTaskRangeSimple(startDate, startSlot, endDate, endSlot) {
            const startText = formatTaskShortDate(startDate);
            const endText = formatTaskShortDate(endDate);
            const startAmpm = startSlot === 'PM' ? '오후' : '오전';
            const endAmpm = endSlot === 'AM' ? '오전' : '오후';

            if (startText === '미정' && endText === '미정') {
                return '기간 미정';
            }

            if (startText === endText) {
                return startText + ' ' + startAmpm + ' - ' + endAmpm;
            }

            return startText + ' ' + startAmpm + ' - ' + endText + ' ' + endAmpm;
        }


        function formatTaskCompactDate(startDate, endDate) {
            const startText = formatTaskShortDate(startDate);
            const endText = formatTaskShortDate(endDate);

            if (startText === '미정' && endText === '미정') {
                return '기간 미정';
            }

            if (startText === endText || endText === '미정') {
                return startText;
            }

            if (startText === '미정') {
                return endText;
            }

            return startText + ' - ' + endText;
        }

        function formatTaskCompactSlot(startSlot, endSlot) {
            const s = startSlot === 'PM' ? '오후' : '오전';
            const e = endSlot === 'AM' ? '오전' : '오후';

            if (s === e) {
                return s;
            }

            return s + ' - ' + e;
        }


        function formatTaskLineDate(dateText, slotValue) {
            const shortDate = formatTaskShortDate(dateText);
            const ampm = slotValue === 'PM' ? '오후' : '오전';

            if (shortDate === '미정') {
                return '미정';
            }

            return shortDate + ' ' + ampm;
        }


        function formatMainTaskDate(dateText) {
            if (!dateText) return '미정';

            const value = String(dateText).substring(0, 10).replaceAll('.', '-').replaceAll('/', '-');
            const parts = value.split('-');

            if (parts.length >= 3) {
                return parts[1] + '/' + parts[2];
            }

            return value;
        }

        function formatMainTaskPeriod(startDate, startTime, endDate, endTime, useTime) {
            const start = formatTaskShortDate(startDate);
            const end = formatTaskShortDate(endDate);
            const showTime = useTime === true;
            const startClock = showTime ? formatTaskTimeText(startTime) : '';
            const endClock = showTime ? formatTaskTimeText(endTime) : '';

            if (!start && !end) return '';

            if (start && end) {
                if (start === end) {
                    return showTime && (startClock || endClock)
                        ? start + (startClock ? ' ' + startClock : '') + (endClock ? ' ~ ' + endClock : '')
                        : start;
                }

                return start + (startClock ? ' ' + startClock : '') + ' ~ ' + end + (endClock ? ' ' + endClock : '');
            }

            return start ? start + (startClock ? ' ' + startClock : '') : end + (endClock ? ' ' + endClock : '');
        }

        function getMainTaskStatusText(status, isDelayed) {
            return isDelayed ? '지연' : '';
        }

        function getMainTaskStatusClass(status, isDelayed) {
            return isDelayed ? 'delay' : '';
        }

function updateBoardCounts(oldStatus, newStatus) {
				    const countMap = {
				        "TODO": document.getElementById("todo-count"),
				        "IN_PROGRESS": document.getElementById("progress-count"),
				        "DONE": document.getElementById("done-count")
				    };

				    // 기존 컬럼 -1
				    if (countMap[oldStatus]) {
				        let count = parseInt(countMap[oldStatus].innerText) || 0;
				        countMap[oldStatus].innerText = Math.max(0, count - 1);
				    }

				    // 새 컬럼 +1
				    if (countMap[newStatus]) {
				        let count = parseInt(countMap[newStatus].innerText) || 0;
				        countMap[newStatus].innerText = count + 1;
				    }

                    const todoCount = parseInt(document.getElementById("todo-count")?.innerText || "0") || 0;
                    const progressCount = parseInt(document.getElementById("progress-count")?.innerText || "0") || 0;
                    const doneCount = parseInt(document.getElementById("done-count")?.innerText || "0") || 0;
                    const delayCount = parseInt(document.getElementById("task-delay-count")?.innerText || "0") || 0;

                    updateTaskCountDisplays(todoCount, progressCount, doneCount, delayCount);
				}
				// 기존의 loadBoard 함수를 지우고 아래 코드를 사용하세요
				// 기존의 loadBoard 함수를 아래 코드로 수정하세요.
				// [이 함수를 기존 loadBoard 함수 자리에 덮어쓰세요]


				function loadAllWidgets(projId) {
				    if (!projId) {
				        console.warn("프로젝트 위젯 로딩 중단: projId가 없습니다.");
				        return;
				    }

				    fetch('/api/workspace/project/' + projId + '/dashboard-widgets')
				        .then(res => {
				            if (!res.ok) throw new Error('위젯 API 응답 오류: ' + res.status);
				            return res.json();
				        })
				        .then(data => {
				            console.log("프로젝트 위젯 데이터:", data);

				            renderWidget('noticeBoard', data.notice || data.notices || [], projId, 'NOTICE');
					            renderWidget('fileBoard', data.file || data.files || data.fileBoards || [], projId, 'FILE');

})
				        .catch(err => {
				            console.error("프로젝트 위젯 로딩 실패:", err);
				        });
				}

				function renderWidget(elementId, list, projId, type) {
				    const target = document.getElementById(elementId);
				    const wsId = new URLSearchParams(window.location.search).get('wsId');

				    if (!target) {
				        console.warn("위젯 영역을 찾을 수 없습니다:", elementId);
				        return;
				    }

				    target.innerHTML = '';

				    if (!list || list.length === 0) {
				        target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">등록된 글이 없습니다.</p>';
				        return;
				    }

				    let html = '<ul class="board-list-inner">';

				    list.slice(0, 3).forEach(post => {
				        const postId = post.postId || post.POST_ID;
				        const title = post.title || post.TITLE || '제목 없음';
				        const regDt = post.regDt || post.REG_DT || '';

				        html += '<li class="board-item">' +
				                    '<a href="/group/board/detail?postId=' + postId + '&projId=' + projId + '&wsId=' + wsId + '">' +
				                        title +
				                    '</a>' +
				                    '<span class="board-date">' + regDt + '</span>' +
				                '</li>';
				    });

				    html += '</ul>';
				    target.innerHTML = html;
				}
                document.addEventListener('DOMContentLoaded', function() {
                    const editStartDate = document.getElementById('editStartDate');
                    const editEndDate = document.getElementById('editEndDate');

                    if (editStartDate && editEndDate) {
                        editStartDate.addEventListener('change', function() {
                            const startDate = editStartDate.value;
                            const endDate = editEndDate.value;

                            if (!startDate) return;

                            editEndDate.setAttribute('min', startDate);

                            if (endDate && endDate < startDate) {
                                editEndDate.value = startDate;
                            }
                        });
                    }
                });
// 모달 열기
				function openModal(id) {
				    document.getElementById(id).style.display = 'flex';
				}

				// 모달 닫기
				function closeModal(id) {
				    document.getElementById(id).style.display = 'none';
				}

        /* ===== Work note widget script ===== */
        function renderSharedNotePlaceholder(target) {
            if (!target) return;
            target.innerHTML = '<div class="work-note-empty shared-note-placeholder">' +
                '<div class="work-note-empty-left">' +
                '<div class="work-note-empty-icon">📝</div>' +
                '<div><strong>공유 노트가 들어갈 자리입니다.</strong><span>노트 기능은 다시 정리해서 연결할 예정입니다.<br>프로젝트 회의록과 작업 메모를 이 영역에서 확인할 수 있게 됩니다.</span></div>' +
                '</div>' +
                '</div>';
        }

        function normalizeSharedNoteSection() {
            var target = document.getElementById('recentNoteList');
            if (!target) return;
            var section = target.closest('.note-main-section, section, article, .widget-card, .dashboard-card, .content-section');
            if (!section) return;

            section.classList.add('shared-note-ready-section');

            var title = section.querySelector('h1, h2, h3, .section-title, .note-section-title');
            if (title) title.innerHTML = '📝 공유 노트';

            var desc = section.querySelector('.note-section-header p, .section-desc, .section-subtitle, p');
            if (desc) desc.textContent = '공유 노트가 들어갈 자리입니다.';

            section.querySelectorAll('.note-write-link, .empty-note-write-link, .note-write-bottom-actions, a[href*="/project/note/write"]').forEach(function(el) {
                el.style.display = 'none';
            });
        }

        function loadRecentNotes() {
            const target = document.getElementById('recentNoteList');
            if (!target) return;
            normalizeSharedNoteSection();
            renderSharedNotePlaceholder(target);
        }

        function escapeNoteHtml(value) {
            if (value === null || value === undefined) return '';
            return String(value)
                .replaceAll('&','&amp;')
                .replaceAll('<','&lt;')
                .replaceAll('>','&gt;')
                .replaceAll('"','&quot;')
                .replaceAll("'",'&#039;');
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadRecentNotes();
            setTimeout(loadRecentNotes, 150);
        });
        /* ===== End work note widget script ===== */


        function escapeHtml(value) {
            return String(value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }



/* ===== Project active poll widget ===== */
let projectActivePollId = null;

function getProjectMainWsId() {
    return new URLSearchParams(window.location.search).get('wsId') || '';
}

function getProjectMainProjId() {
    return new URLSearchParams(window.location.search).get('projId') || '';
}

function getProjectPollListUrl() {
    const wsId = encodeURIComponent(getProjectMainWsId());
    const projId = encodeURIComponent(getProjectMainProjId());
    return '/poll/list?scope=PROJECT&wsId=' + wsId + '&projId=' + projId;
}

function getProjectMainLoginUserId() {
    const fromBody = document.body ? (document.body.dataset.userId || '') : '';
    if (fromBody) return fromBody;
    return window.LOGIN_USER_ID || '';
}

function normalizeProjectPollData(data) {
    if (!data || Object.keys(data).length === 0) return null;

    const question = data.question || data.QUESTION;
    const pollId = data.pollId || data.POLL_ID || data.poll_id;

    if (!question || !pollId) return null;

    return {
        pollId: pollId,
        question: question,
        options: Array.isArray(data.options) ? data.options : []
    };
}

function loadProjectActivePoll() {
    const target = document.getElementById('projectActivePollArea');
    const wsId = getProjectMainWsId();
    const projId = getProjectMainProjId();

    if (!target) return;

    if (!wsId || !projId) {
        target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">프로젝트 정보를 찾을 수 없습니다.</p>';
        return;
    }

    target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">진행 중인 투표 목록을 불러오는 중입니다.</p>';

    fetch('/api/polls/list?scope=PROJECT&wsId=' + encodeURIComponent(wsId) + '&projId=' + encodeURIComponent(projId))
        .then(function(res) {
            if (!res.ok) throw new Error('투표 목록 API 응답 오류: ' + res.status);
            return res.json();
        })
        .then(function(list) {
            const activePolls = Array.isArray(list)
                ? list.filter(function(poll) {
                    return !isProjectPollClosed(poll);
                })
                : [];

            renderProjectActivePollList(activePolls);
        })
        .catch(function(err) {
            console.error('프로젝트 메인 투표 목록 조회 실패:', err);
            target.innerHTML = '<div class="project-poll-error">투표 목록을 불러오지 못했습니다.</div>';
        });
}

function isProjectPollClosed(poll) {
    const status = String(poll.STATUS || poll.status || '').toUpperCase();
    if (status === 'CLOSED') return true;

    const endValue = poll.END_DT || poll.endDt;
    if (!endValue) return false;

    const endDate = new Date(endValue);
    return !Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now();
}

function renderProjectActivePollList(polls) {
    const target = document.getElementById('projectActivePollArea');
    const countTarget = document.getElementById('projectActivePollCount');

    if (!target) return;

    const activePolls = Array.isArray(polls) ? polls : [];

    if (countTarget) {
        countTarget.textContent = String(activePolls.length);
    }

    if (activePolls.length === 0) {
        target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">등록된 글이 없습니다.</p>';
        return;
    }

    const visiblePolls = activePolls.slice(0, 4);
    let html = '<div class="project-poll-list">';

    visiblePolls.forEach(function(poll) {
        const pollId = poll.POLL_ID || poll.pollId;
        const question = poll.QUESTION || poll.question || '질문 없음';
        const endDt = poll.END_DT || poll.endDt || '';
        const href = getProjectPollListUrl() + '&pollId=' + encodeURIComponent(pollId);

        html += '<a class="project-poll-list-item" href="' + href + '">';
        html += '  <span class="project-poll-list-title">' + escapeWidgetHtml(question) + '</span>';
        html += '  <span class="project-poll-list-date">' + formatProjectPollListDate(endDt) + '</span>';
        html += '</a>';
    });

    if (activePolls.length > visiblePolls.length) {
        html += '<div class="project-poll-more">외 ' + (activePolls.length - visiblePolls.length) + '개의 투표가 더 있습니다.</div>';
    }

    html += '</div>';
    target.innerHTML = html;
}

function formatProjectPollListDate(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).substring(0, 10);
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return y + '-' + m + '-' + d;
}

function submitProjectActivePollVote(optionId) {
    if (!projectActivePollId || !optionId) {
        alert('투표 정보를 찾을 수 없습니다.');
        return;
    }

    const loginUserId = getProjectMainLoginUserId();
    const body = {
        pollId: projectActivePollId,
        optionId: optionId
    };

    if (loginUserId) {
        body.userId = loginUserId;
    }

    fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(function(res) {
        if (!res.ok) throw new Error('투표 저장 실패: ' + res.status);
        return res.text();
    })
    .then(function() {
        loadProjectActivePoll();
    })
    .catch(function(err) {
        console.error('투표 반영 실패:', err);
        alert('투표 반영 중 오류가 발생했습니다.');
    });
}
/* ===== End project active poll widget ===== */


function limitMainWidgetItems() {
    ['noticeBoard'].forEach(function(id) {
        const box = document.getElementById(id);
        if (!box) return;

        Array.from(box.children).forEach(function(child, index) {
            child.style.display = index >= 4 ? 'none' : '';
        });
    });
}


function renderRecentNoteWidget(list, projId) {
}

function loadRecentNotesFallback(projId) {
}

function formatWidgetDate(value) {
    if (!value) return '';

    const text = String(value);
    if (text.length >= 10) {
        return text.substring(0, 10);
    }

    return text;
}

function loadProjectNoteWidget(projId) {
    const target = document.getElementById('projectNoteBoard');
    if (!target) return;
    target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">공유 노트가 들어갈 자리입니다.</p>';
}
function escapeWidgetHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');
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

/* ===== 프로젝트 메인 사진첩 위젯 추가 ===== */
(function () {
    'use strict';

    function getProjectId() {
        var params = new URLSearchParams(window.location.search);
        return params.get('projId')
            || (window.PROJECT_MAIN_CONFIG && (window.PROJECT_MAIN_CONFIG.projectId || window.PROJECT_MAIN_CONFIG.paramProjId))
            || '';
    }

    function escapeProjectPhotoHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function firstProjectPhotoValue(object, keys) {
        if (!object) return '';
        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            if (object[key] !== undefined && object[key] !== null && String(object[key]).trim() !== '') {
                return object[key];
            }
        }
        return '';
    }

    function normalizeProjectPhotoPath(path) {
        if (!path) return '';
        var value = String(path);
        if (/^https?:\/\//i.test(value)) return value;
        if (value.charAt(0) === '/') return value;
        return '/' + value;
    }

    function findProjectPhotoInsertTarget() {
        var noteSection = findProjectNoteSection();
        if (noteSection) return { parent: noteSection.parentElement, after: noteSection, noteSection: noteSection, mode: 'note-row' };

        var grids = Array.from(document.querySelectorAll('.widget-grid, .project-widget-grid, .dashboard-widget-grid, .main-content .widget-grid'));
        var bestGrid = grids.find(function (grid) {
            var text = (grid.textContent || '').replace(/\s+/g, ' ');
            return /공지|자료|노트|게시판|피드/.test(text);
        });
        if (bestGrid) return { parent: bestGrid, mode: 'append' };

        var main = document.querySelector('.main-content, .project-main-content, .dashboard-main, .container');
        if (!main) return null;
        return { parent: main, mode: 'append' };
    }

    function findProjectNoteSection() {
        var direct = document.querySelector('.note-main-section');
        if (direct) return direct;

        var list = document.getElementById('recentNoteList');
        if (list) {
            var section = list.closest('section, article, .widget-card, .dashboard-card, .content-section');
            if (section) return section;
        }

        var main = document.querySelector('.main-content, .project-main-content, .dashboard-main, .container');
        if (!main) return null;
        return Array.from(main.querySelectorAll('section, article, .widget-card, .dashboard-card')).find(function (card) {
            return /노트/.test(card.textContent || '');
        }) || null;
    }

    function arrangeNoteAndPhoto(noteSection, photoCard) {
        if (!noteSection || !photoCard || !noteSection.parentElement) return false;

        var currentRow = noteSection.closest('.project-note-photo-row') || photoCard.closest('.project-note-photo-row');
        var row = currentRow || document.createElement('div');
        if (!currentRow) {
            row.className = 'project-note-photo-row';
            noteSection.parentElement.insertBefore(row, noteSection);
        }

        if (!noteSection.classList.contains('project-note-panel')) {
            noteSection.classList.add('project-note-panel');
        }
        if (!photoCard.classList.contains('project-photo-panel')) {
            photoCard.classList.add('project-photo-panel');
        }

        if (noteSection.parentElement !== row) row.appendChild(noteSection);
        if (photoCard.parentElement !== row) row.appendChild(photoCard);
        return true;
    }

    function createProjectPhotoCard(projId) {
        var href = '/photo-album?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId);
        var card = document.createElement('section');
        card.id = 'projectPhotoWidget';
        card.className = 'widget-card project-photo-widget-card';
        card.innerHTML =
            '<div class="project-photo-widget-head">' +
                '<h3 class="project-photo-widget-title">📷 사진첩</h3>' +
                '<a class="project-photo-widget-more" href="' + href + '">더보기</a>' +
            '</div>' +
            '<div id="projectPhotoWidgetList" class="project-photo-grid">' +
                '<div class="project-photo-empty"><span class="project-photo-empty-icon">📷</span><div><strong>사진을 불러오는 중입니다.</strong><span>프로젝트에 공유된 사진을 확인하고 있습니다.</span></div></div>' +
            '</div>';
        return card;
    }

    function mountProjectPhotoCard() {
        var projId = getProjectId();
        if (!projId || document.getElementById('projectPhotoWidget')) return;

        var target = findProjectPhotoInsertTarget();
        if (!target || !target.parent) return;

        var card = createProjectPhotoCard(projId);
        if (target.mode === 'note-row' && target.noteSection) {
            target.noteSection.insertAdjacentElement('afterend', card);
            arrangeNoteAndPhoto(target.noteSection, card);
        } else if (target.mode === 'after' && target.after && target.after.parentElement) {
            target.after.insertAdjacentElement('afterend', card);
        } else {
            target.parent.appendChild(card);
        }
        loadProjectPhotoWidget(projId);

        // 노트 섹션이 늦게 렌더링되는 화면도 있어서, 짧게 한 번 더 재배치한다.
        var retryCount = 0;
        var retryTimer = window.setInterval(function () {
            retryCount += 1;
            var noteSection = findProjectNoteSection();
            var photoCard = document.getElementById('projectPhotoWidget');
            if ((noteSection && photoCard && arrangeNoteAndPhoto(noteSection, photoCard)) || retryCount >= 8) {
                window.clearInterval(retryTimer);
            }
        }, 120);
    }

    function renderProjectPhotoEmpty(list, projId) {
        var albumUrl = '/photo-album?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId);
        list.innerHTML =
            '<div class="project-photo-empty">' +
                '<span class="project-photo-empty-icon">📷</span>' +
                '<div>' +
                    '<strong>아직 공유된 사진이 없습니다.</strong>' +
                    '<span>프로젝트 자료와 현장 사진을 모아서 공유할 수 있습니다.</span>' +
                    '<a class="project-photo-empty-action" href="' + albumUrl + '">첫 사진 공유</a>' +
                '</div>' +
            '</div>';
    }

    function renderProjectPhotos(list, posts, projId) {
        var albumUrl = '/photo-album?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId);
        if (!Array.isArray(posts) || posts.length === 0) {
            renderProjectPhotoEmpty(list, projId);
            return;
        }

        list.innerHTML = posts.slice(0, 2).map(function (post) {
            var postId = firstProjectPhotoValue(post, ['postId', 'POST_ID', 'id']);
            var title = firstProjectPhotoValue(post, ['title', 'TITLE', 'postTitle', 'POST_TITLE']) || '사진 게시물';
            var creator = firstProjectPhotoValue(post, ['userName', 'USER_NAME', 'creatorName', 'CREATOR_NAME', 'email', 'EMAIL']) || '공유됨';
            var imageUrl = normalizeProjectPhotoPath(firstProjectPhotoValue(post, [
                'thumbnailPath', 'THUMBNAIL_PATH', 'filePath', 'FILE_PATH', 'coverPath', 'COVER_PATH', 'photoPath', 'PHOTO_PATH'
            ]));
            var photoCount = Number(firstProjectPhotoValue(post, ['photoCount', 'PHOTO_COUNT']) || 0);
            var href = postId ? (albumUrl + '&postId=' + encodeURIComponent(postId)) : albumUrl;

            return '<a class="project-photo-post" href="' + href + '" aria-label="' + escapeProjectPhotoHtml(title) + '">' +
                '<span class="project-photo-post-thumb" style="background-image:url(&quot;' + escapeProjectPhotoHtml(imageUrl) + '&quot;)">' +
                    (photoCount > 1 ? '<span class="project-photo-post-count">▣ ' + photoCount + '</span>' : '') +
                    '<span class="project-photo-post-overlay"><strong>' + escapeProjectPhotoHtml(title) + '</strong><small>' + escapeProjectPhotoHtml(creator) + '</small></span>' +
                '</span>' +
            '</a>';
        }).join('');
    }

    function loadProjectPhotoWidget(projId) {
        var list = document.getElementById('projectPhotoWidgetList');
        if (!list) return;

        fetch('/api/photo-posts/recent?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId) + '&limit=2')
            .then(function (response) {
                if (!response.ok) throw new Error('프로젝트 사진 조회 실패: ' + response.status);
                return response.json();
            })
            .then(function (posts) { renderProjectPhotos(list, posts, projId); })
            .catch(function (error) {
                console.error(error);
                renderProjectPhotoEmpty(list, projId);
            });
    }

    document.addEventListener('DOMContentLoaded', mountProjectPhotoCard);
})();
/* ===== End 프로젝트 메인 사진첩 위젯 추가 ===== */
