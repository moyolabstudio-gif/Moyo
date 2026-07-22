/**
 * MOYO 프로젝트 업무
 * 칸반, 업무 등록/수정/삭제, 업무 드래그, 미니 달력을 담당합니다.
 */

function refreshProjectTaskAndMemberView() {
            loadKanbanBoard();

            if (!isPersonalProjectMain() && typeof refreshProjectMemberPanel === 'function') {
                refreshProjectMemberPanel();
            }
        }


function loadKanbanBoard() {
		    const projId = new URLSearchParams(window.location.search).get('projId');
		    fetch(`/project/api/tasks?projId=${projId}`)
		        .then(res => res.json())
		        .then(data => {
                    const tasks = normalizeProjectTasks(data);
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

					tasks.forEach(task => {
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

					drawCalendar(tasks);
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
            const select = document.getElementById('taskAssignedUserId');
            const loginUserId = window.PROJECT_MAIN_CONFIG.loginUserId;

            if (isPersonalProjectMain()) {
                projectTaskMemberList = [{ USER_ID: loginUserId, USER_NAME: '나', PROJ_ROLE: 'LEADER' }];
                document.body.classList.add('admin-mode');
                if (select) {
                    select.innerHTML = '<option value="' + escapeTaskHtml(loginUserId) + '" selected>나</option>';
                    select.value = loginUserId;
                }
                return Promise.resolve(projectTaskMemberList);
            }

            const projId = new URLSearchParams(window.location.search).get('projId');
            const projectLeaderId = window.PROJECT_MAIN_CONFIG.projectLeaderId;

            return fetch('/project/api/members?projId=' + projId)
                .then(res => res.json())
                .then(members => {
                    projectTaskMemberList = members || [];
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
		        .then(rawTask => {
                    const task = normalizeProjectTask(rawTask);
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
            const assignedUserId = isPersonalProjectMain()
                ? (window.PROJECT_MAIN_CONFIG.loginUserId || '')
                : (document.getElementById('taskAssignedUserId') ? document.getElementById('taskAssignedUserId').value : '');

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
		    projectCalendarTasks = normalizeProjectTasks(tasks);
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
