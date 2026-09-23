/** MOYO 프로젝트 메인 할 일 관리 */
let currentProjectTaskFilter = 'ALL';
let currentProjectTaskAssignee = 'ALL';
let projectTaskCache = [];
let projectTaskIndicators = new Map();
let projectTaskMembers = [];
let selectedProjectTaskAssignees = [];
let projectTaskDraggingAllowed = false;
let currentProjectTaskModalTask = null;
let currentProjectTaskRecords = [];
let currentProjectTaskModalMode = 'CREATE';
let currentProjectTaskStatusOnlyEdit = false;
let projectTaskQueryOpenHandled = false;
let projectTaskSuppressCardClickUntil = 0;

function taskConfig() { return window.PROJECT_MAIN_CONFIG || {}; }
function isProjectTaskReadOnly() {
    return taskConfig().projectReadOnly === true || taskConfig().projectReadOnly === 'true';
}
function getTaskApiUrl(path) {
    const base = taskConfig().contextPath || '';
    return base + (String(path || '').startsWith('/') ? path : '/' + path);
}
function getProjectTaskProjectId() {
    return taskConfig().projectId || taskConfig().paramProjId || new URLSearchParams(location.search).get('projId');
}

function refreshProjectCollaborationActivity() {
    const widgets = window.MoyoCommunityWidgets;
    const projId = getProjectTaskProjectId();
    if (!widgets || typeof widgets.loadCollaborationActivities !== 'function' || !projId) return Promise.resolve([]);
    return widgets.loadCollaborationActivities({
        scope: 'PROJECT',
        projId: projId,
        wsId: taskConfig().wsId || taskConfig().paramWsId || '',
        contextPath: taskConfig().contextPath || ''
    }).catch(() => []);
}

function canManageProjectTasks() {
    if (isProjectTaskReadOnly()) return false;
    return taskConfig().canManageTasks === true || taskConfig().canManageTasks === 'true';
}
function canCreateProjectTasks() {
    if (isProjectTaskReadOnly()) return false;
    return canManageProjectTasks()
        || taskConfig().canCreateTasks === true
        || taskConfig().canCreateTasks === 'true';
}
function currentProjectTaskUserId() {
    return String(taskConfig().loginUserId || '');
}
function canChangeProjectTaskStatus(task) {
    if (isProjectTaskReadOnly()) return false;
    if (canManageProjectTasks()) return true;
    const loginUserId = currentProjectTaskUserId();
    return !!loginUserId && taskAssignees(task).some(person => String(person.id) === loginUserId);
}
function taskValue(row, ...keys) {
    if (!row) return '';
    for (const key of keys) {
        if (row[key] != null) return row[key];
    }
    // MyBatis Map/Jackson 설정에 따라 대소문자·snake_case가 달라질 수 있으므로
    // 같은 의미의 키를 정규화해서 한 번 더 찾습니다.
    const normalized = new Map();
    Object.keys(row).forEach(function (key) {
        normalized.set(String(key).replace(/[^a-zA-Z0-9]/g, '').toLowerCase(), row[key]);
    });
    for (const key of keys) {
        const value = normalized.get(String(key).replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
        if (value != null) return value;
    }
    return '';
}
function safeTaskHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}
function taskDateOnly(value) { return String(value || '').substring(0, 10).replaceAll('.', '-').replaceAll('/', '-'); }
function localTaskDateString(date) {
    const value = date instanceof Date ? date : new Date();
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}
function getDefaultProjectTaskDate() {
    const bounds = getProjectTaskDateBounds();
    let date = localTaskDateString(new Date());
    if (bounds.min && date < bounds.min) date = bounds.min;
    if (bounds.max && date > bounds.max) date = bounds.max;
    return date;
}
function taskTimeOnly(value, fallback) {
    const raw = String(value || '').trim();
    const match = raw.match(/(\d{1,2}):(\d{2})/);
    return match ? String(match[1]).padStart(2,'0') + ':' + match[2] : (fallback || '');
}
function taskInitial(name) { return Array.from(String(name || '?').trim()).slice(0, 1).join('') || '?'; }
function taskStatusLabel(status) { return ({TODO:'예정', IN_PROGRESS:'진행 중', DONE:'완료'})[status] || status; }
function setProjectTaskStatus(status) {
    const value = ['TODO','IN_PROGRESS','DONE'].includes(String(status || '').toUpperCase()) ? String(status).toUpperCase() : 'TODO';
    const input = document.getElementById('projectTaskStatus');
    if (input) input.value = value;
    const modal = document.getElementById('projectTaskModal');
    (modal || document).querySelectorAll('.project-task-status-option[data-task-status]').forEach(function(button) {
        const selected = button.dataset.taskStatus === value;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-checked', selected ? 'true' : 'false');
        button.tabIndex = selected ? 0 : -1;
    });
}

function taskRoleLabel(role) {
    const value = String(role || '').trim().toUpperCase();
    return ({LEADER:'프로젝트장', OWNER:'프로젝트장', ADMIN:'관리자', MANAGER:'관리자', MEMBER:'멤버'})[value] || String(role || '');
}
function normalizeTaskPerson(person) {
    return {
        id: String(taskValue(person, 'userId','USER_ID','id','ASSIGNEE_ID','assigneeId') || ''),
        name: String(taskValue(person, 'name','USER_NAME','userName','ASSIGNEE_NAME','assigneeName') || '담당자 없음'),
        image: String(taskValue(person, 'profileImagePath','PROFILE_IMAGE_PATH','profileImage','PROFILE_IMAGE','ASSIGNEE_PROFILE_IMAGE_PATH','assigneeProfileImagePath') || ''),
        role: String(taskValue(person, 'projectPosition','PROJECT_POSITION','projectRole','PROJECT_ROLE','PROJ_POSITION','projPosition','ASSIGNEE_ROLE','assigneeRole') || ''),
        email: String(taskValue(person, 'email','EMAIL') || '')
    };
}
function taskAssignees(task) {
    const rows = taskValue(task, 'assignees','ASSIGNEES');
    if (Array.isArray(rows) && rows.length) return rows.map(normalizeTaskPerson).filter(person => person.id);
    const single = normalizeTaskPerson({
        userId: taskValue(task, 'ASSIGNEE_ID','assigneeId','USER_ID','userId'),
        name: taskValue(task, 'ASSIGNEE_NAME','assigneeName','USER_NAME','userName'),
        profileImagePath: taskValue(task, 'ASSIGNEE_PROFILE_IMAGE_PATH','assigneeProfileImagePath','ASSIGNEE_PROFILE_IMAGE','assigneeProfileImage','PROFILE_IMAGE_PATH','profileImagePath','PROFILE_IMAGE','profileImage'),
        projectPosition: taskValue(task, 'ASSIGNEE_POSITION','assigneePosition','ASSIGNEE_ROLE','assigneeRole','PROJ_POSITION','projPosition'),
        email: taskValue(task, 'ASSIGNEE_EMAIL','assigneeEmail','EMAIL','email')
    });
    return single.id ? [single] : [];
}
function isTaskTimeEnabledFromData(task) {
    const allDay = String(taskValue(task,'ALL_DAY_YN','allDayYn')).toUpperCase();
    if (allDay) return allDay === 'N';
    return !!taskTimeOnly(taskValue(task,'START_TIME','startTime','START_AT','startAt'));
}
function taskDeadline(task) {
    const end = taskDateOnly(taskValue(task,'END_DATE','endDate','END_AT','endAt'));
    if (!end) return null;
    const time = isTaskTimeEnabledFromData(task) ? taskTimeOnly(taskValue(task,'END_TIME','endTime','END_AT','endAt'),'18:00') : '23:59';
    const date = new Date(end + 'T' + time + ':59');
    return Number.isNaN(date.getTime()) ? null : date;
}
function isTaskDelayed(task) {
    const status = String(taskValue(task,'STATUS','status')).toUpperCase();
    const explicit = String(taskValue(task,'IS_OVERDUE','isOverdue')).toUpperCase();
    if (explicit === 'Y' || explicit === 'TRUE') return status !== 'DONE';
    const deadline = taskDeadline(task);
    return status !== 'DONE' && deadline && deadline.getTime() < Date.now();
}
function taskDueLabel(task) {
    const status = String(taskValue(task,'STATUS','status') || '').toUpperCase();
    if (status === 'DONE') return '';

    const deadline = taskDeadline(task);
    if (!deadline) return '';

    const today = new Date(); today.setHours(0,0,0,0);
    const day = new Date(deadline); day.setHours(0,0,0,0);
    const diff = Math.round((day - today) / 86400000);

    if (isTaskDelayed(task)) return diff < 0 ? Math.abs(diff) + '일 지연' : '마감 지남';
    if (diff === 0) return '오늘 마감';
    if (diff > 0 && diff <= 7) return 'D-' + diff;
    return '';
}
function taskDueClass(task) {
    const status = String(taskValue(task,'STATUS','status') || '').toUpperCase();
    if (status === 'DONE') return 'is-done';
    if (isTaskDelayed(task)) return 'is-delay';

    const deadline = taskDeadline(task);
    if (!deadline) return 'is-neutral';
    const today = new Date(); today.setHours(0,0,0,0);
    const day = new Date(deadline); day.setHours(0,0,0,0);
    const diff = Math.round((day - today) / 86400000);
    if (diff === 0) return 'is-today';
    if (diff > 0 && diff <= 3) return 'is-soon';
    return 'is-neutral';
}
function taskWeekdayLabel(value) {
    const date = taskDateOnly(value);
    if (!date) return '';
    const parsed = new Date(date + 'T00:00:00');
    if (Number.isNaN(parsed.getTime())) return '';
    return ['일','월','화','수','목','금','토'][parsed.getDay()];
}
function taskDateWithWeekday(value, shortDate) {
    const date = taskDateOnly(value);
    if (!date) return '';
    const display = shortDate ? date.substring(5).replace('-', '.') : date.replaceAll('-', '.');
    const weekday = taskWeekdayLabel(date);
    return display + (weekday ? ' (' + weekday + ')' : '');
}
function taskPeriodLabel(task) {
    const start = taskDateOnly(taskValue(task,'START_DATE','startDate','START_AT','startAt'));
    const end = taskDateOnly(taskValue(task,'END_DATE','endDate','END_AT','endAt'));
    if (!start && !end) return '기간 미정';
    const short = value => taskDateWithWeekday(value, true);
    const useTime = isTaskTimeEnabledFromData(task);
    const st = useTime ? taskTimeOnly(taskValue(task,'START_TIME','startTime','START_AT','startAt')) : '';
    const et = useTime ? taskTimeOnly(taskValue(task,'END_TIME','endTime','END_AT','endAt')) : '';
    if (start === end) return short(start) + (st || et ? ' ' + st + (et ? '–' + et : '') : '');
    return (start ? short(start) + (st ? ' ' + st : '') : '') + ' – ' + (end ? short(end) + (et ? ' ' + et : '') : '');
}
function formatTaskDetailDate(value) {
    return taskDateWithWeekday(value, false);
}
function formatTaskDetailTime(value) {
    const time = taskTimeOnly(value);
    if (!time) return '';
    const [hourText, minute] = time.split(':');
    const hour = Number(hourText);
    const meridiem = hour < 12 ? '오전' : '오후';
    const displayHour = hour % 12 || 12;
    return meridiem + ' ' + String(displayHour).padStart(2, '0') + ':' + minute;
}
function taskPeriodDetail(task) {
    const startRaw = taskValue(task,'START_DATE','startDate','START_AT','startAt');
    const endRaw = taskValue(task,'END_DATE','endDate','END_AT','endAt');
    const start = taskDateOnly(startRaw);
    const end = taskDateOnly(endRaw);
    if (!start && !end) {
        return {
            main: '기간 미정',
            sub: '시작일과 종료일이 지정되지 않았습니다.',
            delayed: ''
        };
    }

    const useTime = isTaskTimeEnabledFromData(task);
    const startDate = formatTaskDetailDate(startRaw);
    const endDate = formatTaskDetailDate(endRaw);
    const startTime = useTime ? formatTaskDetailTime(taskValue(task,'START_TIME','startTime','START_AT','startAt')) : '';
    const endTime = useTime ? formatTaskDetailTime(taskValue(task,'END_TIME','endTime','END_AT','endAt')) : '';
    let main = '';
    let sub = '';

    if (start && end && start === end) {
        main = startDate;
        sub = useTime
            ? [startTime, endTime].filter(Boolean).join(' ~ ')
            : '종일';
    } else {
        const startText = [startDate, startTime].filter(Boolean).join(' ');
        const endText = [endDate, endTime].filter(Boolean).join(' ');
        main = [startText, endText].filter(Boolean).join(' ~ ');
        if (start && end) {
            const startDay = new Date(start + 'T00:00:00');
            const endDay = new Date(end + 'T00:00:00');
            const days = Math.max(1, Math.round((endDay - startDay) / 86400000) + 1);
            sub = useTime ? days + '일 일정' : days + '일 · 종일';
        } else {
            sub = useTime ? '시간 지정 할 일' : '종일 할 일';
        }
    }

    let delayed = '';
    if (isTaskDelayed(task)) {
        const deadline = taskDeadline(task);
        if (deadline) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const due = new Date(deadline);
            due.setHours(0,0,0,0);
            const diff = Math.max(1, Math.abs(Math.round((due - today) / 86400000)));
            delayed = '종료일 기준 ' + diff + '일 지연';
        }
    }
    return {main, sub, delayed};
}
function taskAvatarHtml(person, sizeClass) {
    const image = person.image ? getTaskApiUrl(person.image) : '';
    const stateClass = image ? 'has-image' : 'is-default-profile';
    const imageHtml = image
        ? '<img src="' + safeTaskHtml(image) + '" alt="' + safeTaskHtml(person.name) + ' 프로필" loading="lazy" decoding="async" onload="window.CommonMemberWidget&&CommonMemberWidget.applyAvatarImagePolicy(this)" onerror="window.CommonMemberWidget?CommonMemberWidget.handleAvatarError(this):this.remove()">'
        : '';
    return '<span class="project-task-avatar moyo-member-avatar is-person-avatar ' + stateClass + ' ' + (sizeClass || '') + '" data-avatar-kind="person">'
        + imageHtml
        + '<span class="moyo-member-avatar-fallback">' + safeTaskHtml(taskInitial(person.name)) + '</span></span>';
}

async function loadProjectTaskMembers() {
    const projId = getProjectTaskProjectId();
    if (!projId) return [];
    try {
        const response = await fetch(getTaskApiUrl('/project/api/members?projId=' + encodeURIComponent(projId)), {credentials:'include'});
        if (!response.ok) throw new Error('MEMBER_LOAD_FAILED');
        const rows = await response.json();
        projectTaskMembers = (Array.isArray(rows) ? rows : []).map(row => ({
            id: String(taskValue(row,'USER_ID','userId')),
            name: String(taskValue(row,'USER_NAME','userName','NICKNAME','nickname') || '이름 없음'),
            image: String(taskValue(row,'PROFILE_IMAGE_PATH','profileImagePath','PROFILE_IMAGE','profileImage','PROFILE_IMG','profileImg') || ''),
            role: String(taskValue(row,'PROJ_POSITION','projPosition','PROJ_ROLE','projRole') || '')
        })).filter(member => member.id);
    } catch (error) {
        console.error('[프로젝트 작업] 멤버 조회 실패:', error);
        projectTaskMembers = [];
    }
    return projectTaskMembers;
}

function openProjectTaskFromQueryIfNeeded() {
    if (projectTaskQueryOpenHandled) return;
    const params = new URLSearchParams(window.location.search || '');
    const taskId = String(params.get('taskId') || '').trim();
    const shouldOpen = params.get('openTask') === 'Y' || !!taskId;
    if (!shouldOpen || !taskId) return;
    projectTaskQueryOpenHandled = true;
    window.setTimeout(function () {
        openProjectTaskDetail(taskId);
    }, 0);
}

async function loadProjectTaskIndicators() {
    const projId = getProjectTaskProjectId();
    projectTaskIndicators = new Map();
    if (!projId) return projectTaskIndicators;
    try {
        const response = await fetch(
            getTaskApiUrl('/project/api/task-indicators?projId=' + encodeURIComponent(projId)),
            {credentials:'include', cache:'no-store'}
        );
        if (!response.ok) throw new Error('TASK_INDICATOR_LOAD_FAILED');
        const rows = await response.json();
        (Array.isArray(rows) ? rows : []).forEach(function(row) {
            const taskId = String(taskValue(row, 'taskId', 'TASK_ID') || '').trim();
            if (!taskId) return;
            projectTaskIndicators.set(taskId, {
                unreadTaskCount: Number(taskValue(row, 'unreadTaskCount', 'UNREAD_TASK_COUNT') || 0),
                unreadNoteCount: Number(taskValue(row, 'unreadNoteCount', 'UNREAD_NOTE_COUNT') || 0),
                unreadPhotoCount: Number(taskValue(row, 'unreadPhotoCount', 'UNREAD_PHOTO_COUNT') || 0),
                unreadFileCount: Number(taskValue(row, 'unreadFileCount', 'UNREAD_FILE_COUNT') || 0),
                unreadLinkCount: Number(taskValue(row, 'unreadLinkCount', 'UNREAD_LINK_COUNT') || 0),
                unreadLocationCount: Number(taskValue(row, 'unreadLocationCount', 'UNREAD_LOCATION_COUNT') || 0)
            });
        });
    } catch (error) {
        console.error('[프로젝트 작업] 미확인 업데이트 조회 실패:', error);
    }
    return projectTaskIndicators;
}


function projectTaskCardUpdateBadgeHtml(taskId) {
    const indicator = projectTaskIndicators.get(String(taskId)) || {};
    const unreadCount =
        Number(indicator.unreadTaskCount || 0) +
        Number(indicator.unreadNoteCount || 0) +
        Number(indicator.unreadPhotoCount || 0) +
        Number(indicator.unreadFileCount || 0) +
        Number(indicator.unreadLinkCount || 0) +
        Number(indicator.unreadLocationCount || 0);

    if (unreadCount <= 0) return '';
    return '<span class="project-task-card-update-dot" title="미확인 업데이트 있음" aria-label="미확인 업데이트 있음"></span>';
}


async function loadKanbanBoard() {
    const projId = getProjectTaskProjectId();
    if (!projId) return [];
    try {
        const response = await fetch(getTaskApiUrl('/project/api/tasks?projId=' + encodeURIComponent(projId)), {credentials:'include'});
        if (!response.ok) throw new Error('TASK_LOAD_FAILED');
        const raw = await response.json();
        projectTaskCache = typeof normalizeProjectTasks === 'function' ? normalizeProjectTasks(raw) : (Array.isArray(raw) ? raw : []);
        if (!projectTaskMembers.length) await loadProjectTaskMembers();
        await loadProjectTaskIndicators();
        renderProjectTaskWorkspace();
        if (typeof drawCalendar === 'function') drawCalendar(projectTaskCache);
        openProjectTaskFromQueryIfNeeded();
        return projectTaskCache;
    } catch (error) {
        console.error('[프로젝트 작업] 조회 실패:', error);
        renderProjectTaskError();
        return [];
    }
}

function renderProjectTaskWorkspace() {
    const lists = {TODO:document.getElementById('todo-list'), IN_PROGRESS:document.getElementById('inprogress-list'), DONE:document.getElementById('done-list')};
    if (!lists.TODO || !lists.IN_PROGRESS || !lists.DONE) return;
    Object.values(lists).forEach(list => list.innerHTML = '');
    const counts = {TODO:0, IN_PROGRESS:0, DONE:0, DELAYED:0};
    const visible = projectTaskCache.filter(matchesProjectTaskFilters);
    projectTaskCache.forEach(task => {
        const status = String(taskValue(task,'STATUS','status') || 'TODO').toUpperCase();
        if (counts[status] != null) counts[status]++;
        if (isTaskDelayed(task)) counts.DELAYED++;
    });
    visible.forEach(task => {
        const status = String(taskValue(task,'STATUS','status') || 'TODO').toUpperCase();
        if (lists[status]) lists[status].insertAdjacentHTML('beforeend', buildProjectTaskCard(task));
    });
    const emptyLabels = {TODO:'등록된 할 일이 없습니다.', IN_PROGRESS:'진행 중인 할 일이 없습니다.', DONE:'완료된 할 일이 없습니다.'};
    const hasActiveFilter = currentProjectTaskFilter !== 'ALL' || currentProjectTaskAssignee !== 'ALL' || String(document.getElementById('projectTaskSearch')?.value || '').trim();
    const hasDraggableTask = visible.some(canChangeProjectTaskStatus);
    Object.entries(lists).forEach(([status,list]) => {
        if (!list.children.length) {
            const label = hasActiveFilter ? '조건에 맞는 할 일이 없습니다.' : emptyLabels[status];
            const guide = hasActiveFilter
                ? ''
                : (hasDraggableTask
                    ? '<small>카드를 이곳으로 끌어 상태를 변경할 수 있어요.</small>'
                    : '');
            const icon = hasDraggableTask && !hasActiveFilter ? 'fa-solid fa-grip-vertical' : 'fa-regular fa-circle-check';
            list.innerHTML = '<div class="project-task-empty' + (hasDraggableTask && !hasActiveFilter ? ' has-drag-guide' : '') + '"><i class="' + icon + '"></i><span>' + label + '</span>' + guide + '</div>';
        }
    });
    updateTaskCountDisplays(counts.TODO, counts.IN_PROGRESS, counts.DONE, counts.DELAYED);
    renderProjectTaskPersonFilter();
}
function renderProjectTaskError() {
    ['todo-list','inprogress-list','done-list'].forEach(id => { const el=document.getElementById(id); if(el) el.innerHTML='<div class="project-task-empty is-error">할 일을 불러오지 못했습니다.</div>'; });
    updateTaskCountDisplays(0, 0, 0, 0);
    const holder = document.getElementById('projectTaskPersonFilter');
    if (holder) holder.innerHTML = '';
}
function matchesProjectTaskFilters(task) {
    const status = String(taskValue(task,'STATUS','status')).toUpperCase();
    const people = taskAssignees(task);
    const search = String(document.getElementById('projectTaskSearch')?.value || '').trim().toLowerCase();
    if (currentProjectTaskFilter === 'DELAYED' && !isTaskDelayed(task)) return false;
    if (!['ALL','DELAYED'].includes(currentProjectTaskFilter) && status !== currentProjectTaskFilter) return false;
    if (currentProjectTaskAssignee !== 'ALL' && !people.some(person => person.id === currentProjectTaskAssignee)) return false;
    if (search && !(String(taskValue(task,'TITLE','title')).toLowerCase().includes(search) || people.some(person => (person.name + ' ' + person.email).toLowerCase().includes(search)))) return false;
    return true;
}
function taskAssigneeStackHtml(people, limit, sizeClass) {
    const visible = people.slice(0, limit);
    const remain = Math.max(0, people.length - visible.length);
    return '<span class="project-task-avatar-stack">' + visible.map(person => taskAvatarHtml(person, sizeClass || 'small')).join('') + (remain ? '<span class="project-task-avatar-more">+' + remain + '</span>' : '') + '</span>';
}
function taskAssigneeSummary(people) {
    if (!people.length) return '담당자 없음';
    if (people.length === 1) return people[0].name;
    return people[0].name + ' 외 ' + (people.length - 1) + '명';
}
function taskCreatorName(task) {
    return String(taskValue(task, 'CREATOR_NAME', 'creatorName', 'WRITER_NAME', 'writerName') || '').trim();
}
function taskCreatorId(task) {
    const value = taskValue(task, 'CREATED_BY', 'createdBy', 'CREATOR_ID', 'creatorId', 'WRITER_ID', 'writerId');
    return value == null ? '' : String(value);
}
function buildProjectTaskCard(task) {
    const taskId = taskValue(task,'TASK_ID','taskId','EVENT_ID','eventId');
    const title = String(taskValue(task,'TITLE','title') || '제목 없음');
    const status = String(taskValue(task,'STATUS','status') || 'TODO').toUpperCase();
    const people = taskAssignees(task);
    const delayed = isTaskDelayed(task);
    const canDrag = canChangeProjectTaskStatus(task);
    const draggable = canDrag ? 'true' : 'false';
    const dragClass = canDrag ? ' is-draggable' : '';
    const updateBadge = projectTaskCardUpdateBadgeHtml(taskId);
    const dragHandle = (canDrag || updateBadge)
        ? '<span class="project-task-card-top-action' + (updateBadge ? ' has-update' : '') + (canDrag ? '' : ' is-indicator-only') + '">'
            + (canDrag ? '<span class="project-task-drag-handle" data-tooltip="끌어서 상태 변경" title="끌어서 상태 변경" aria-label="끌어서 상태 변경"><i class="fa-solid fa-grip-vertical" aria-hidden="true"></i></span>' : '')
            + updateBadge
        + '</span>'
        : '';
    const assigneeMeta = people.length === 1 ? taskRoleLabel(people[0].role) : (people.length ? people.length + '명 담당' : '미지정');
    const creatorName = taskCreatorName(task);
    const creatorMeta = creatorName
        ? '<span class="project-task-card-creator" title="작성자 ' + safeTaskHtml(creatorName) + '"><span>작성</span><b>' + safeTaskHtml(creatorName) + '</b></span>'
        : '';
    const dueLabel = taskDueLabel(task);
    const dueMeta = dueLabel
        ? '<em class="' + taskDueClass(task) + '"' + (delayed ? ' title="마감일이 지났습니다."' : '') + '>' + safeTaskHtml(dueLabel) + '</em>'
        : '';
    return '<button type="button" class="project-task-card ' + (delayed ? 'is-delayed ' : '') + 'status-' + status.toLowerCase() + dragClass + '" id="task-' + safeTaskHtml(taskId) + '" data-task-id="' + safeTaskHtml(taskId) + '" data-task-status="' + safeTaskHtml(status) + '" draggable="' + draggable + '" ondragstart="drag(event)" ondragend="endProjectTaskDrag(event)" onclick="handleProjectTaskCardClick(\'' + safeTaskHtml(taskId) + '\')">' +
        '<span class="project-task-card-top"><strong>' + safeTaskHtml(title) + '</strong>' + dragHandle + '</span>' +
        '<span class="project-task-card-period"><span class="project-task-card-period-main"><i class="fa-regular fa-calendar"></i><span>' + safeTaskHtml(taskPeriodLabel(task)) + '</span></span>' + dueMeta + '</span>' +
        '<span class="project-task-card-bottom"><span class="project-task-person">' + taskAssigneeStackHtml(people, 3, 'small') + '<span><b>' + safeTaskHtml(taskAssigneeSummary(people)) + '</b><small>' + safeTaskHtml(assigneeMeta) + '</small></span></span>' + creatorMeta + '</span>' +
        '</button>';
}
function renderProjectTaskPersonFilter() {
    const holder = document.getElementById('projectTaskPersonFilter');
    if (!holder) return;
    const assigned = new Map();
    projectTaskCache.forEach(task => taskAssignees(task).forEach(person => { if (person.id) assigned.set(person.id, person); }));

    const people = Array.from(assigned.values());
    const visibleLimit = 5;
    let visiblePeople = people.slice(0, visibleLimit);
    if (currentProjectTaskAssignee !== 'ALL' && !visiblePeople.some(person => person.id === currentProjectTaskAssignee)) {
        const selected = people.find(person => person.id === currentProjectTaskAssignee);
        if (selected) visiblePeople = visiblePeople.slice(0, Math.max(0, visibleLimit - 1)).concat(selected);
    }

    const remainingCount = Math.max(0, people.length - visiblePeople.length);
    holder.innerHTML =
        '<button type="button" class="project-task-person-chip ' + (currentProjectTaskAssignee === 'ALL' ? 'is-active' : '') + '" onclick="setProjectTaskAssignee(\'ALL\')">전체 담당자</button>' +
        visiblePeople.map(p => '<button type="button" class="project-task-person-chip ' + (currentProjectTaskAssignee === p.id ? 'is-active' : '') + '" onclick="setProjectTaskAssignee(\'' + safeTaskHtml(p.id) + '\')" title="' + safeTaskHtml(p.name) + '">' + taskAvatarHtml(p, 'tiny') + '<span>' + safeTaskHtml(p.name) + '</span></button>').join('') +
        (remainingCount > 0 ? '<button type="button" class="project-task-person-more" id="projectTaskPersonMoreBtn" onclick="toggleProjectTaskPersonPicker(event)">+' + remainingCount + '<span>더보기</span><i class="fa-solid fa-chevron-down"></i></button>' : '') +
        '<div class="project-task-person-picker" id="projectTaskPersonPicker" hidden>' +
            '<div class="project-task-person-picker-head"><strong>담당자 선택</strong><button type="button" onclick="closeProjectTaskPersonPicker()" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button></div>' +
            '<label class="project-task-person-picker-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="projectTaskPersonPickerSearch" placeholder="담당자 검색" autocomplete="off"></label>' +
            '<div class="project-task-person-picker-list" id="projectTaskPersonPickerList"></div>' +
        '</div>';

    renderProjectTaskPersonPickerList(people, '');
}
function renderProjectTaskPersonPickerList(people, keyword) {
    const list = document.getElementById('projectTaskPersonPickerList');
    if (!list) return;
    const search = String(keyword || '').trim().toLowerCase();
    const filtered = people.filter(person => !search || (person.name + ' ' + person.email).toLowerCase().includes(search));
    list.innerHTML = filtered.length
        ? filtered.map(person => '<button type="button" class="project-task-person-picker-item ' + (currentProjectTaskAssignee === person.id ? 'is-active' : '') + '" onclick="setProjectTaskAssignee(\'' + safeTaskHtml(person.id) + '\');closeProjectTaskPersonPicker()">' + taskAvatarHtml(person, 'small') + '<span><b>' + safeTaskHtml(person.name) + '</b><small>' + safeTaskHtml(taskRoleLabel(person.role)) + '</small></span>' + (currentProjectTaskAssignee === person.id ? '<i class="fa-solid fa-check"></i>' : '') + '</button>').join('')
        : '<p class="project-task-person-picker-empty">일치하는 담당자가 없습니다.</p>';
}
function toggleProjectTaskPersonPicker(event) {
    event?.stopPropagation();
    const picker = document.getElementById('projectTaskPersonPicker');
    if (!picker) return;
    const willOpen = picker.hasAttribute('hidden');
    if (willOpen) {
        picker.removeAttribute('hidden');
        const input = document.getElementById('projectTaskPersonPickerSearch');
        if (input) { input.value = ''; input.focus(); }
    } else {
        picker.setAttribute('hidden', '');
    }
}
function closeProjectTaskPersonPicker() {
    document.getElementById('projectTaskPersonPicker')?.setAttribute('hidden', '');
}
function updateTaskCountDisplays(todo, progress, done, delayed) {
    const values = {'todo-count':todo,'progress-count':progress,'done-count':done,'task-todo-summary':todo,'task-progress-summary':progress,'task-done-summary':done,'task-delay-count':delayed,'task-total-count':todo+progress+done};
    Object.entries(values).forEach(([id,value]) => { const el=document.getElementById(id); if(el) el.textContent=value; });

    // 개인 프로젝트는 프로젝트 멤버 위젯 대신 소유자 카드를 사용한다.
    // 진행 보드와 같은 할 일 요약 값을 소유자 카드에도 동기화한다.
    if (taskConfig().isPersonalProject) {
        const ownerValues = {
            projectOwnerTotalCount: todo + progress + done,
            projectOwnerTodoCount: todo,
            projectOwnerProgressCount: progress,
            projectOwnerDoneCount: done,
            projectOwnerDelayCount: delayed
        };
        Object.entries(ownerValues).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }
}
function setProjectTaskFilter(filter) {
    currentProjectTaskFilter = ['ALL','TODO','IN_PROGRESS','DONE','DELAYED'].includes(filter) ? filter : 'ALL';
    document.querySelectorAll('[data-task-filter]').forEach(btn => { const active=btn.dataset.taskFilter === currentProjectTaskFilter; btn.classList.toggle('is-active', active); btn.setAttribute('aria-pressed', String(active)); });
    renderProjectTaskWorkspace();
}
function setProjectTaskAssignee(id) { currentProjectTaskAssignee=String(id || 'ALL'); renderProjectTaskWorkspace(); }
function resetProjectTaskFilters() {
    currentProjectTaskFilter='ALL'; currentProjectTaskAssignee='ALL';
    const search=document.getElementById('projectTaskSearch'); if(search) search.value='';
    document.querySelectorAll('[data-task-filter]').forEach(btn => { const active=btn.dataset.taskFilter==='ALL'; btn.classList.toggle('is-active', active); btn.setAttribute('aria-pressed', String(active)); });
    renderProjectTaskWorkspace();
}
function handleProjectTaskCardClick(taskId) {
    if (Date.now() < projectTaskSuppressCardClickUntil) return;
    openProjectTaskDetail(taskId);
}

function drag(event) {
    const taskId = String(event.currentTarget?.dataset?.taskId || '');
    const task = projectTaskCache.find(item => String(taskValue(item, 'TASK_ID','taskId')) === taskId);
    projectTaskDraggingAllowed = !!task && canChangeProjectTaskStatus(task);
    if (!projectTaskDraggingAllowed) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', event.currentTarget.id);
    event.currentTarget.classList.add('is-dragging');
    projectTaskSuppressCardClickUntil = Date.now() + 250;
    document.getElementById('projectTaskBoard')?.classList.add('is-drag-active');
}
function endProjectTaskDrag(event) {
    projectTaskSuppressCardClickUntil = Date.now() + 250;
    event.currentTarget?.classList.remove('is-dragging');
    document.getElementById('projectTaskBoard')?.classList.remove('is-drag-active');
    document.querySelectorAll('.project-task-column.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
    projectTaskDraggingAllowed = false;
}
function allowDrop(event) {
    if (!projectTaskDraggingAllowed) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const column = event.currentTarget.closest('[data-task-column]');
    document.querySelectorAll('.project-task-column.is-drop-target').forEach(el => { if (el !== column) el.classList.remove('is-drop-target'); });
    column?.classList.add('is-drop-target');
}
function drop(event) {
    event.preventDefault(); if(!projectTaskDraggingAllowed) return;
    const id=event.dataTransfer.getData('text/plain'); const card=document.getElementById(id); if(!card) return;
    const column=event.currentTarget.closest('[data-task-column]'); const status=column?.dataset.taskColumn; const taskId=id.replace('task-','');
    const previousStatus = String(card.dataset.taskStatus || '').toUpperCase();
    projectTaskSuppressCardClickUntil = Date.now() + 250;
    card.classList.remove('is-dragging');
    document.getElementById('projectTaskBoard')?.classList.remove('is-drag-active');
    document.querySelectorAll('.project-task-column.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
    projectTaskDraggingAllowed = false;
    if(status && String(status).toUpperCase() !== previousStatus) updateTaskStatus(taskId,status);
}
async function updateTaskStatus(taskId,status) {
    const params=new URLSearchParams({taskId:String(taskId),status:String(status),projId:String(getProjectTaskProjectId()||'')});
    try {
        const response=await fetch(getTaskApiUrl('/project/api/update-task-status'),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString(),credentials:'include'});
        const result=await response.text();
        if(!response.ok || result!=='SUCCESS') throw new Error(result || 'UPDATE_FAILED');
        await refreshProjectCollaborationActivity();
    } catch(error) {
        alert('할 일 상태를 변경하지 못했습니다.');
    }
    await refreshProjectTaskAndMemberView();
}
function refreshProjectTaskAndMemberView() {
    // 캘린더에서 공통 할 일 모달을 연 경우 프로젝트 메인 화면용
    // 칸반/멤버/미니달력 갱신은 하지 않는다. Calendar V2 bridge가
    // 모달 닫힘을 감지해 현재 캘린더 컨텍스트만 다시 조회한다.
    if (String(taskConfig().hostContext || '').toUpperCase() === 'CALENDAR_V2') {
        return Promise.resolve([]);
    }
    const promise=loadKanbanBoard();
    if(window.ProjectMiniCalendarAdapter?.reload) window.ProjectMiniCalendarAdapter.reload().catch(()=>{});
    if(typeof refreshProjectMemberPanel==='function' && !taskConfig().isPersonalProject) refreshProjectMemberPanel();
    return promise;
}

function canEditProjectTask(task) {
    return canManageProjectTasks() || canChangeProjectTaskStatus(task);
}

function setProjectTaskFormAccess(task, mode) {
    const form = document.getElementById('projectTaskForm');
    const detail = document.getElementById('projectTaskDetailView');
    const isDetail = mode === 'DETAIL';
    const statusOnly = mode === 'EDIT' && !canManageProjectTasks() && canChangeProjectTaskStatus(task);
    currentProjectTaskStatusOnlyEdit = statusOnly;

    if (form) {
        form.hidden = isDetail;
        form.style.display = isDetail ? 'none' : '';
    }
    if (detail) {
        detail.hidden = !isDetail;
        detail.style.display = isDetail ? '' : 'none';
    }

    const editButton = document.getElementById('projectTaskEditBtn');
    const deleteButton = document.getElementById('projectTaskDeleteBtn');
    const submitButton = document.getElementById('projectTaskSubmitBtn');

    if (editButton) {
        const canEdit = !!task && isDetail && canEditProjectTask(task);
        editButton.hidden = !canEdit;
        editButton.disabled = !canEdit;
    }
    if (deleteButton) {
        const canDelete = !!task && canManageProjectTasks() && (isDetail || mode === 'EDIT');
        deleteButton.hidden = !canDelete;
        deleteButton.disabled = !canDelete;
    }
    if (submitButton) {
        submitButton.textContent = statusOnly ? '상태 저장' : (task ? '수정' : '저장');
    }

    const titleInput = document.getElementById('projectTaskTitle');
    const assigneeButton = document.getElementById('projectTaskAssigneeSummary');
    const useTime = document.getElementById('projectTaskUseTime');
    const dateInputs = ['projectTaskStartDate','projectTaskEndDate','projectTaskStartTime','projectTaskEndTime']
        .map(id => document.getElementById(id)).filter(Boolean);
    const statusButtons = document.querySelectorAll('.project-task-status-option[data-task-status]');

    if (titleInput) titleInput.disabled = statusOnly;
    if (assigneeButton) {
        assigneeButton.disabled = statusOnly;
        assigneeButton.classList.toggle('is-readonly', statusOnly);
    }
    if (useTime) useTime.disabled = statusOnly;
    dateInputs.forEach(input => input.disabled = statusOnly || (input.id.includes('Time') && !document.getElementById('projectTaskUseTime')?.checked));
    document.querySelectorAll('.project-task-period .moyo-quick-date-trigger, .project-task-period .moyo-quick-time-trigger')
        .forEach(button => button.disabled = statusOnly);

    // 상태만 수정할 수 있는 담당자에게는 기록 설정을 수정 가능한 것처럼 보여주지 않는다.
    const recordVisibilityButtons = document.querySelectorAll('[data-record-visibility]');
    recordVisibilityButtons.forEach(button => button.disabled = statusOnly);

    statusButtons.forEach(button => button.disabled = false);
}

function isProjectTaskRecordEnabled(task) {
    return !!task;
}

function projectTaskScopeLabel() {
    const config = window.PROJECT_MAIN_CONFIG || {};
    const projectName = String(config.projectName || document.body?.dataset?.projectName || '').trim();
    const workspaceName = String(config.workspaceName || '').trim();
    const groupProject = config.groupProject === true || config.isPersonalProject === false;

    if (groupProject) {
        if (workspaceName && projectName) return workspaceName + ' > ' + projectName;
        return projectName || workspaceName || '-';
    }

    return projectName ? '개인 > ' + projectName : '개인';
}


function renderProjectTaskDetail(task) {
    const title = String(taskValue(task,'TITLE','title') || '-');
    const people = taskAssignees(task);
    const status = String(taskValue(task,'STATUS','status') || 'TODO').toUpperCase();
    const titleEl = document.getElementById('projectTaskDetailTitle');
    const peopleEl = document.getElementById('projectTaskDetailAssignees');
    const moreButton = document.getElementById('projectTaskDetailAssigneeMore');
    const listEl = document.getElementById('projectTaskDetailAssigneeList');
    const periodEl = document.getElementById('projectTaskDetailPeriod');
    const scopeEl = document.getElementById('projectTaskDetailScope');
    const statusEl = document.getElementById('projectTaskDetailStatus');
    if (titleEl) titleEl.textContent = title;
    if (scopeEl) scopeEl.textContent = projectTaskScopeLabel();
    if (peopleEl) {
        const representative = people[0] || null;
        const assigneeMeta = people.length === 1
            ? taskRoleLabel(representative?.role)
            : (people.length > 1 ? people.length + '명 담당' : '');
        const visiblePeople = people.slice(0, 3);
        const remainCount = Math.max(0, people.length - visiblePeople.length);
        const profileStack = representative
            ? '<span class="project-task-detail__assignee-stack project-task-avatar-stack">'
                + visiblePeople.map(function(person) {
                    const avatar = taskAvatarHtml(person, 'small');
                    return person.id
                        ? '<button type="button" class="project-task-detail__assignee-avatar-link" onclick="event.stopPropagation();openProjectTaskAssigneeProfile(\'' + safeTaskHtml(person.id) + '\')" title="' + safeTaskHtml(person.name) + ' 프로필 보기">' + avatar + '</button>'
                        : avatar;
                }).join('')
                + (remainCount ? '<span class="project-task-avatar-more">+' + remainCount + '</span>' : '')
                + '</span>'
            : '';
        const representativeText = representative
            ? '<span class="project-task-detail__assignee-text"><b>' + safeTaskHtml(taskAssigneeSummary(people)) + '</b>'
                + (assigneeMeta ? '<small>' + safeTaskHtml(assigneeMeta) + '</small>' : '')
                + '</span>'
            : '';
        peopleEl.innerHTML = representative
            ? profileStack
                + '<span class="project-task-detail__assignee-copy"'
                + (representative.id
                    ? ' role="button" tabindex="0" onclick="openProjectTaskAssigneeProfile(\'' + safeTaskHtml(representative.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openProjectTaskAssigneeProfile(\'' + safeTaskHtml(representative.id) + '\');}" title="' + safeTaskHtml(representative.name) + ' 프로필 보기"'
                    : '')
                + '>' + representativeText + '</span>'
            : '<span class="project-task-detail__empty">담당자 없음</span>';
    }
    if (moreButton) {
        const showAssigneeMore = people.length > 1;
        moreButton.hidden = !showAssigneeMore;
        moreButton.style.display = showAssigneeMore ? '' : 'none';
        moreButton.textContent = '전체 보기';
        moreButton.setAttribute('aria-expanded', 'false');
    }
    if (listEl) {
        listEl.hidden = true;
        listEl.innerHTML = people.map(function(person) {
            const role = taskRoleLabel(person.role) || '멤버';
            return '<button type="button" class="project-task-detail__assignee-person" onclick="openProjectTaskAssigneeProfile(\'' + safeTaskHtml(person.id) + '\')" title="' + safeTaskHtml(person.name) + ' 프로필 보기">'
                + taskAvatarHtml(person, 'small')
                + '<span><b>' + safeTaskHtml(person.name) + '</b><small>' + safeTaskHtml(role) + '</small></span>'
                + '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>'
                + '</button>';
        }).join('');
    }
    if (periodEl) {
        const period = taskPeriodDetail(task);
        const dueClass = taskDueClass(task);
        const showDueText = ['is-today', 'is-soon', 'is-delay'].includes(dueClass);
        const dueText = showDueText ? taskDueLabel(task) : '';
        const periodMeta = period.sub || dueText
            ? '<small>'
                + (period.sub ? '<span>' + safeTaskHtml(period.sub) + '</span>' : '')
                + (period.sub && dueText ? '<span class="project-task-detail__period-separator">·</span>' : '')
                + (dueText ? '<em class="project-task-detail__period-due ' + safeTaskHtml(dueClass) + '">' + safeTaskHtml(dueText) + '</em>' : '')
                + '</small>'
            : '';
        periodEl.innerHTML = '<span class="project-task-detail__period-icon"><i class="fa-regular fa-calendar"></i></span>'
            + '<span class="project-task-detail__period-copy"><strong>' + safeTaskHtml(period.main) + '</strong>'
            + periodMeta
            + '</span>';
    }
    if (statusEl) {
        statusEl.textContent = taskStatusLabel(status);
        statusEl.className = 'project-task-detail__status status-' + status.toLowerCase();
    }
}

function toggleProjectTaskAssigneeList() {
    const list = document.getElementById('projectTaskDetailAssigneeList');
    const button = document.getElementById('projectTaskDetailAssigneeMore');
    if (!list || !button) return;
    const willOpen = list.hidden;
    list.hidden = !willOpen;
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    button.textContent = willOpen ? '접기' : '전체 보기';
}

function openProjectTaskAssigneeProfile(userId) {
    const id = String(userId || '').trim();
    if (!id) return;
    if (typeof window.openProjectMemberProfile === 'function') {
        window.openProjectMemberProfile(id);
        return;
    }
    const wsId = String(
        window.PROJECT_MAIN_CONFIG?.wsId
        || window.PROJECT_MAIN_CONFIG?.paramWsId
        || document.body?.dataset?.wsId
        || ''
    ).trim();
    // 그룹 기반 프로젝트의 담당자는 상위 그룹 프로필 정책을 따른다.
    if (wsId) {
        if (typeof window.openWorkspaceMemberProfile === 'function') {
            window.openWorkspaceMemberProfile(id);
            return;
        }
        window.alert('그룹 멤버 프로필을 불러오지 못했습니다.');
        return;
    }
    location.href = getTaskApiUrl('/users/profile?userId=' + encodeURIComponent(id));
}

async function openProjectTaskModal(task, options) {
    const modal=document.getElementById('projectTaskModal');
    const form=document.getElementById('projectTaskForm');
    const mode = options?.mode || (task ? 'DETAIL' : 'CREATE');

    if (!task && !canCreateProjectTasks()) return;
    if(!projectTaskMembers.length) await loadProjectTaskMembers();

    currentProjectTaskModalTask = task || null;
    currentProjectTaskModalMode = mode;

    form?.reset();
    selectedProjectTaskAssignees = [];
    if (!task) {
        const loginUserId = currentProjectTaskUserId();
        const currentMember = projectTaskMembers.find(function(member) {
            return String(member.id) === loginUserId;
        });
        if (currentMember) selectedProjectTaskAssignees = [currentMember];
    }
    setProjectTaskStatus('TODO');
    setProjectTaskPickerTime('projectTaskStartTime','09:00');
    setProjectTaskPickerTime('projectTaskEndTime','18:00');
    const recordVisibilityInput=document.getElementById('projectTaskRecordVisibility');
    if(recordVisibilityInput) recordVisibilityInput.value='PROJECT';
    syncProjectTaskRecordVisibilityOptions();
    syncProjectTaskRecordSetting();

    document.getElementById('projectTaskId').value=task ? taskValue(task,'TASK_ID','taskId') : '';
    document.getElementById('projectTaskModalTitle').textContent = task
        ? (mode === 'DETAIL' ? '할 일 상세' : '할 일 수정')
        : '할 일 추가';

    renderProjectTaskAssigneeSummary();

    if (!task) {
        const defaultDate = getDefaultProjectTaskDate();
        const startDateInput = document.getElementById('projectTaskStartDate');
        const endDateInput = document.getElementById('projectTaskEndDate');
        if (startDateInput) startDateInput.value = defaultDate;
        if (endDateInput) endDateInput.value = defaultDate;
        syncProjectTaskInputWeekdays();
    }

    if(task) {
        document.getElementById('projectTaskTitle').value=taskValue(task,'TITLE','title');
        setProjectTaskStatus(String(taskValue(task,'STATUS','status')||'TODO').toUpperCase());
        document.getElementById('projectTaskStartDate').value=taskDateOnly(taskValue(task,'START_DATE','startDate','START_AT','startAt'));
        document.getElementById('projectTaskEndDate').value=taskDateOnly(taskValue(task,'END_DATE','endDate','END_AT','endAt'));
        syncProjectTaskInputWeekdays();
        const useTime=isTaskTimeEnabledFromData(task);
        document.getElementById('projectTaskUseTime').checked=useTime;
        setProjectTaskPickerTime('projectTaskStartTime',taskTimeOnly(taskValue(task,'START_TIME','startTime','START_AT','startAt'),'09:00'));
        setProjectTaskPickerTime('projectTaskEndTime',taskTimeOnly(taskValue(task,'END_TIME','endTime','END_AT','endAt'),'18:00'));
        if(recordVisibilityInput) recordVisibilityInput.value=String(taskValue(task,'RECORD_VISIBILITY','recordVisibility')||'PROJECT').toUpperCase();
        syncProjectTaskRecordVisibilityOptions();
        syncProjectTaskRecordSetting();
        selectedProjectTaskAssignees = taskAssignees(task);
        renderProjectTaskAssigneeSummary();
        renderProjectTaskDetail(task);
        if (prepareProjectTaskRecordSection(task)) {
            loadProjectTaskRecords(task);
        }
    }

    syncProjectTaskDateBounds();
    rememberProjectTaskDateRange();
    syncProjectTaskTimeFields();
    rememberProjectTaskTimeRange();
    setProjectTaskFormAccess(task, mode);

    modal?.classList.add('is-open');
    modal?.setAttribute('aria-hidden','false');
    document.body.classList.add('project-task-modal-open');

    if (!task) setProjectTaskStatus('TODO');
    if (mode !== 'DETAIL') setTimeout(()=>document.getElementById('projectTaskTitle')?.focus(),0);
}

function enterProjectTaskEditMode() {
    if (!currentProjectTaskModalTask || !canEditProjectTask(currentProjectTaskModalTask)) return;
    openProjectTaskModal(currentProjectTaskModalTask, {mode:'EDIT'});
}







async function markProjectTaskRead(taskId) {
    if (!taskId) return;
    try {
        const response = await fetch(
            getTaskApiUrl('/project/api/task-read?taskId=' + encodeURIComponent(taskId)),
            {method:'POST', credentials:'include'}
        );
        if (!response.ok) return;

        const indicator = projectTaskIndicators.get(String(taskId));
        if (indicator) {
            indicator.unreadTaskCount = 0;
            projectTaskIndicators.set(String(taskId), indicator);
            renderProjectTaskWorkspace();
            renderProjectTaskCommonRecordSummary(currentProjectTaskRecords || []);
        }
    } catch (error) {
        console.error('[프로젝트 작업] 업무 읽음 처리 실패:', error);
    }
}

function clearProjectTaskRecordUnread(taskId, recordType) {
    const indicator = projectTaskIndicators.get(String(taskId));
    if (!indicator) return;

    const keys = {
        NOTE:'unreadNoteCount',
        PHOTO:'unreadPhotoCount',
        FILE:'unreadFileCount',
        LINK:'unreadLinkCount',
        LOCATION:'unreadLocationCount'
    };
    const key = keys[String(recordType || '').toUpperCase()];
    if (!key) return;

    indicator[key] = 0;
    projectTaskIndicators.set(String(taskId), indicator);
    renderProjectTaskCommonRecordSummary(currentProjectTaskRecords || []);
    renderProjectTaskWorkspace();
}

async function openProjectTaskDetail(taskId) {
    const cached = projectTaskCache.find(task => String(taskValue(task,'TASK_ID','taskId','EVENT_ID','eventId')) === String(taskId));
    try {
        // 기록 ON/OFF처럼 즉시 반영되어야 하는 값은 캐시를 믿지 않고 상세 API에서 다시 읽습니다.
        const response = await fetch(getTaskApiUrl('/project/api/task-detail?taskId=' + encodeURIComponent(taskId)), {
            credentials: 'include',
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('DETAIL_LOAD_FAILED');
        const task = await response.json();
        if (!task || !Object.keys(task).length) throw new Error('DETAIL_EMPTY');
        const index = projectTaskCache.findIndex(item => String(taskValue(item,'TASK_ID','taskId','EVENT_ID','eventId')) === String(taskId));
        if (index >= 0) projectTaskCache[index] = task;
        openProjectTaskModal(task, {mode:'DETAIL'});
        markProjectTaskRead(taskId);
    } catch (error) {
        if (cached) {
            openProjectTaskModal(cached, {mode:'DETAIL'});
            markProjectTaskRead(taskId);
            return;
        }
        alert('할 일 정보를 불러오지 못했습니다.');
    }
}

async function closeProjectTaskModal() {
    const modal=document.getElementById('projectTaskModal');
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden','true');
    document.body.classList.remove('project-task-modal-open');
}
function renderProjectTaskAssigneeSummary() {
    const holder = document.getElementById('projectTaskAssigneeSummary');
    if (!holder) return;
    const people = selectedProjectTaskAssignees;
    if (!people.length) {
        holder.innerHTML = '<div class="project-task-assignee-unselected"><span class="project-task-assignee-empty-avatar"><i class="fa-solid fa-user-plus"></i></span><span><b>담당자를 선택하세요</b><small>프로젝트 멤버를 여러 명 선택할 수 있습니다.</small></span></div>';
    } else {
        holder.innerHTML = '<div class="project-task-assignee-selected">' + taskAssigneeStackHtml(people, 3, 'picker') + '<span><b>' + safeTaskHtml(taskAssigneeSummary(people)) + '</b></span></div>';
    }
}
function openProjectTaskAssigneeSelector() {
    if (currentProjectTaskStatusOnlyEdit) return;
    if (!window.ProjectMemberPeopleAdapter?.openMultiple) {
        alert('프로젝트 멤버 선택 모달을 불러오지 못했습니다.');
        return;
    }
    window.ProjectMemberPeopleAdapter.openMultiple({
        title: '담당자 선택',
        description: '할 일을 함께 담당할 프로젝트 멤버를 모두 선택하세요.',
        selectedIds: selectedProjectTaskAssignees.map(person => person.id),
        confirmText: '선택 완료',
        onSelect: function (members) {
            selectedProjectTaskAssignees = (Array.isArray(members) ? members : []).map(function (member) {
                const raw = member.raw || member;
                return normalizeTaskPerson({
                    userId: member.id || raw.userId,
                    name: member.name || raw.name,
                    email: member.email || raw.email,
                    profileImagePath: member.profileImagePath || raw.profileImage,
                    projectRole: member.projectRole || raw.projectRoleText,
                    projectPosition: raw.position || member.subtitle
                });
            }).filter(person => person.id);
            renderProjectTaskAssigneeSummary();
        }
    }).catch(function (error) {
        console.error('[프로젝트 작업] 담당자 선택 모달 열기 실패:', error);
        alert('담당자 선택 화면을 열지 못했습니다.');
    });
}

function setProjectTaskPickerTime(id, value) {
    const input = document.getElementById(id);
    if (!input) return;
    if (window.MoyoQuickCalendarCreate?.setTimeInput) {
        window.MoyoQuickCalendarCreate.setTimeInput(input, value, id === 'projectTaskEndTime' ? '18:00' : '09:00');
        return;
    }
    input.value = value || (id === 'projectTaskEndTime' ? '18:00' : '09:00');
    input.dataset.timeValue = input.value;
}
function getProjectTaskPickerTime(id) {
    const input = document.getElementById(id);
    if (!input) return '';
    if (window.MoyoQuickCalendarCreate?.getTimeValue) return window.MoyoQuickCalendarCreate.getTimeValue(input, id === 'projectTaskEndTime' ? '18:00' : '09:00');
    return input.dataset.timeValue || input.value || '';
}

function projectTaskTimeToMinutes(value) {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
}

function projectTaskMinutesToTime(totalMinutes) {
    const normalized = ((Number(totalMinutes) || 0) % 1440 + 1440) % 1440;
    const hour = Math.floor(normalized / 60);
    const minute = normalized % 60;
    return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}

function projectTaskDateTimeToMinutes(dateValue, timeValue) {
    const dateUtc = projectTaskDateToUtc(taskDateOnly(dateValue));
    const timeMinutes = projectTaskTimeToMinutes(timeValue);
    if (dateUtc === null || timeMinutes === null) return null;
    return Math.floor(dateUtc / 60000) + timeMinutes;
}

function projectTaskMinutesToDate(totalMinutes) {
    const date = new Date(Number(totalMinutes) * 60000);
    if (Number.isNaN(date.getTime())) return '';
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        String(date.getUTCDate()).padStart(2, '0')
    ].join('-');
}

function rememberProjectTaskTimeRange() {
    const startInput = document.getElementById('projectTaskStartTime');
    const endInput = document.getElementById('projectTaskEndTime');
    if (!startInput || !endInput) return;
    startInput.dataset.previousTaskTime = getProjectTaskPickerTime('projectTaskStartTime');
    endInput.dataset.previousTaskTime = getProjectTaskPickerTime('projectTaskEndTime');
}

function handleProjectTaskStartTimeChange() {
    const useTime = document.getElementById('projectTaskUseTime')?.checked === true;
    const startDateInput = document.getElementById('projectTaskStartDate');
    const endDateInput = document.getElementById('projectTaskEndDate');
    const startTimeInput = document.getElementById('projectTaskStartTime');
    const endTimeInput = document.getElementById('projectTaskEndTime');
    if (!useTime || !startDateInput || !endDateInput || !startTimeInput || !endTimeInput) {
        rememberProjectTaskTimeRange();
        return;
    }

    const startDate = taskDateOnly(startDateInput.value);
    const previousStartDate = taskDateOnly(startDateInput.dataset.previousTaskDate || startDate);
    const previousEndDate = taskDateOnly(endDateInput.dataset.previousTaskDate || endDateInput.value);
    const newStartTime = getProjectTaskPickerTime('projectTaskStartTime');
    const previousStartTime = startTimeInput.dataset.previousTaskTime;
    const previousEndTime = endTimeInput.dataset.previousTaskTime;

    let newStartDateTime = projectTaskDateTimeToMinutes(startDate, newStartTime);
    const previousStartDateTime = projectTaskDateTimeToMinutes(previousStartDate, previousStartTime);
    const previousEndDateTime = projectTaskDateTimeToMinutes(previousEndDate, previousEndTime);
    if (newStartDateTime === null) return;

    // 작업 시간 선택기에서는 사용자가 '오후 12시'를 하루의 끝(24시)으로 인식하므로
    // 해당 표시 상태에서 종료 1시간 뒤를 계산할 때는 다음 날 00시를 기준으로 잡는다.
    // 그 외 시간은 표준 24시간 값 그대로 계산한다.
    const displayedStartHour = String(startTimeInput.value || '').trim().split(':')[0];
    const isDisplayedPmTwelve = startTimeInput.dataset.meridiem === 'PM' && Number(displayedStartHour) === 12;
    if (isDisplayedPmTwelve) newStartDateTime += 12 * 60;

    // 시작 시간을 변경하면 종료는 항상 1시간 뒤로 맞춘다.
    const durationMinutes = 60;
    let nextEndDateTime = newStartDateTime + durationMinutes;
    const bounds = getProjectTaskDateBounds();
    if (bounds.max) {
        const maxEndDateTime = projectTaskDateTimeToMinutes(bounds.max, '23:59');
        if (maxEndDateTime !== null && nextEndDateTime > maxEndDateTime) nextEndDateTime = maxEndDateTime;
    }

    const nextEndDate = projectTaskMinutesToDate(nextEndDateTime);
    const nextEndTime = projectTaskMinutesToTime(nextEndDateTime);
    if (nextEndDate) endDateInput.value = nextEndDate;
    setProjectTaskPickerTime('projectTaskEndTime', nextEndTime);

    syncProjectTaskInputWeekdays();
    syncProjectTaskDateBounds();
    rememberProjectTaskDateRange();
    rememberProjectTaskTimeRange();
}

function handleProjectTaskEndTimeChange() {
    const useTime = document.getElementById('projectTaskUseTime')?.checked === true;
    const startDateInput = document.getElementById('projectTaskStartDate');
    const endDateInput = document.getElementById('projectTaskEndDate');
    if (!useTime || !startDateInput || !endDateInput) {
        rememberProjectTaskTimeRange();
        return;
    }

    const startDate = taskDateOnly(startDateInput.value);
    let endDate = taskDateOnly(endDateInput.value);
    const startTime = getProjectTaskPickerTime('projectTaskStartTime');
    const endTime = getProjectTaskPickerTime('projectTaskEndTime');
    const startDateTime = projectTaskDateTimeToMinutes(startDate, startTime);
    let endDateTime = projectTaskDateTimeToMinutes(endDate, endTime);
    if (startDateTime === null || endDateTime === null) return;

    if (endDateTime <= startDateTime) {
        const nextDate = projectTaskAddDays(startDate, 1);
        const bounds = getProjectTaskDateBounds();
        if (!bounds.max || nextDate <= bounds.max) {
            endDate = nextDate;
            endDateInput.value = nextDate;
            endDateTime = projectTaskDateTimeToMinutes(nextDate, endTime);
        } else {
            endDateInput.value = startDate;
            setProjectTaskPickerTime('projectTaskEndTime', projectTaskMinutesToTime(startDateTime + 60));
        }
    }

    syncProjectTaskInputWeekdays();
    syncProjectTaskDateBounds();
    rememberProjectTaskDateRange();
    rememberProjectTaskTimeRange();
}

function validateProjectTaskTimeRange(startDate, endDate) {
    if (document.getElementById('projectTaskUseTime')?.checked !== true) return '';
    const startDateTime = projectTaskDateTimeToMinutes(startDate, getProjectTaskPickerTime('projectTaskStartTime'));
    const endDateTime = projectTaskDateTimeToMinutes(endDate, getProjectTaskPickerTime('projectTaskEndTime'));
    if (startDateTime === null || endDateTime === null) return '시작 시간과 종료 시간을 확인하세요.';
    if (endDateTime <= startDateTime) return '종료 일시는 시작 일시보다 뒤여야 합니다.';
    return '';
}

function syncProjectTaskInputWeekdays() {
    const pairs = [
        ['projectTaskStartDate', 'projectTaskStartDateDisplay'],
        ['projectTaskEndDate', 'projectTaskEndDateDisplay']
    ];
    pairs.forEach(function(pair) {
        const rawInput = document.getElementById(pair[0]);
        const displayInput = document.getElementById(pair[1]);
        if (!rawInput || !displayInput) return;
        const date = taskDateOnly(rawInput.value);
        if (!date) {
            displayInput.value = '';
            return;
        }
        const utc = projectTaskDateToUtc(date);
        const weekday = utc === null ? '' : ['일','월','화','수','목','금','토'][new Date(utc).getUTCDay()];
        displayInput.value = weekday ? date + ' (' + weekday + ')' : date;
    });
}

function bindProjectTaskDateDisplay(displayId, rawId) {
    const display = document.getElementById(displayId);
    const raw = document.getElementById(rawId);
    if (!display || !raw || display.dataset.taskDateDisplayBound === 'true') return;
    display.dataset.taskDateDisplayBound = 'true';
    const openPicker = function() {
        const trigger = document.querySelector('[data-quick-date-target="' + rawId + '"]');
        if (trigger) trigger.click();
        else raw.focus();
    };
    display.addEventListener('click', openPicker);
    display.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
        }
    });
}

function getProjectTaskDateBounds() {
    const config = taskConfig();
    return {
        min: taskDateOnly(config.projectStartDate || config.startDate || ''),
        max: taskDateOnly(config.projectEndDate || config.endDate || '')
    };
}
function syncProjectTaskDateBounds() {
    const startInput = document.getElementById('projectTaskStartDate');
    const endInput = document.getElementById('projectTaskEndDate');
    if (!startInput || !endInput) return;

    const bounds = getProjectTaskDateBounds();
    const selectedStart = taskDateOnly(startInput.value);

    // 과거 작업을 뒤늦게 등록할 수 있도록 시작일의 하한은 두지 않는다.
    // 종료일은 시작일보다 빠를 수 없고, 프로젝트 종료일이 있으면 그 날짜까지만 허용한다.
    startInput.min = '';
    startInput.max = bounds.max || '';
    endInput.min = selectedStart || '';
    endInput.max = bounds.max || '';

    startInput.dataset.minDate = startInput.min;
    startInput.dataset.maxDate = startInput.max;
    endInput.dataset.minDate = endInput.min;
    endInput.dataset.maxDate = endInput.max;
}

function projectTaskDateToUtc(value) {
    const date = taskDateOnly(value);
    if (!date) return null;
    const parts = date.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}

function projectTaskAddDays(value, days) {
    const utc = projectTaskDateToUtc(value);
    if (utc === null) return taskDateOnly(value);
    const shifted = new Date(utc + (Number(days) || 0) * 86400000);
    return [
        shifted.getUTCFullYear(),
        String(shifted.getUTCMonth() + 1).padStart(2, '0'),
        String(shifted.getUTCDate()).padStart(2, '0')
    ].join('-');
}

function rememberProjectTaskDateRange() {
    const startInput = document.getElementById('projectTaskStartDate');
    const endInput = document.getElementById('projectTaskEndDate');
    if (!startInput || !endInput) return;
    startInput.dataset.previousTaskDate = taskDateOnly(startInput.value);
    endInput.dataset.previousTaskDate = taskDateOnly(endInput.value);
}

function handleProjectTaskStartDateChange() {
    const startInput = document.getElementById('projectTaskStartDate');
    const endInput = document.getElementById('projectTaskEndDate');
    if (!startInput || !endInput) return;

    const newStart = taskDateOnly(startInput.value);
    if (!newStart) {
        syncProjectTaskDateBounds();
        return;
    }

    const previousStart = taskDateOnly(startInput.dataset.previousTaskDate);
    const previousEnd = taskDateOnly(endInput.dataset.previousTaskDate || endInput.value);
    let durationDays = 0;
    const previousStartUtc = projectTaskDateToUtc(previousStart);
    const previousEndUtc = projectTaskDateToUtc(previousEnd);
    if (previousStartUtc !== null && previousEndUtc !== null && previousEndUtc >= previousStartUtc) {
        durationDays = Math.round((previousEndUtc - previousStartUtc) / 86400000);
    }

    let nextEnd = projectTaskAddDays(newStart, durationDays);
    const bounds = getProjectTaskDateBounds();
    if (bounds.max && nextEnd > bounds.max) nextEnd = bounds.max;
    if (nextEnd < newStart) nextEnd = newStart;

    endInput.value = nextEnd;
    syncProjectTaskInputWeekdays();
    syncProjectTaskDateBounds();
    rememberProjectTaskDateRange();
}

function handleProjectTaskEndDateChange() {
    syncProjectTaskInputWeekdays();
    syncProjectTaskDateBounds();
    rememberProjectTaskDateRange();
}

function validateProjectTaskDateRange(start, end) {
    const bounds = getProjectTaskDateBounds();
    if (!start || !end) return '시작일과 종료일을 선택하세요.';
    if (start > end) return '종료일은 시작일보다 빠를 수 없습니다.';
    if (bounds.max && end > bounds.max) return '할 일 종료일은 프로젝트 종료일(' + bounds.max + ') 이후로 지정할 수 없습니다.';
    return '';
}

function syncProjectTaskTimeFields() {
    const period = document.getElementById('projectTaskPeriod');
    const toggle = document.getElementById('projectTaskUseTime');
    const enabled = toggle?.checked === true;
    period?.classList.toggle('is-time-enabled', enabled);
    period?.setAttribute('data-time-enabled', enabled ? 'true' : 'false');
    ['projectTaskStartTime','projectTaskEndTime'].forEach(function(id){
        const input = document.getElementById(id);
        if (input) {
            input.disabled = !enabled;
            input.setAttribute('aria-hidden', enabled ? 'false' : 'true');
        }
    });
}
async function submitProjectTask(event) {
    event.preventDefault();
    const taskId=document.getElementById('projectTaskId').value;
    if (currentProjectTaskStatusOnlyEdit && taskId) {
        const status = document.getElementById('projectTaskStatus').value;
        await updateTaskStatus(taskId, status);
        closeProjectTaskModal();
        return;
    } const start=document.getElementById('projectTaskStartDate').value; const end=document.getElementById('projectTaskEndDate').value;
    const dateValidationMessage = validateProjectTaskDateRange(start, end);
    if (dateValidationMessage) return alert(dateValidationMessage);
    const useTime=document.getElementById('projectTaskUseTime').checked;
    const timeValidationMessage = validateProjectTaskTimeRange(start, end);
    if (timeValidationMessage) return alert(timeValidationMessage);
    const params=new URLSearchParams({title:document.getElementById('projectTaskTitle').value.trim(),status:document.getElementById('projectTaskStatus').value,useTime:useTime?'Y':'N'});
    if(taskId) { params.set('taskId',taskId); params.set('projId',getProjectTaskProjectId()); } else params.set('projId',getProjectTaskProjectId());
    if(start) params.set('startDate',start); if(end) params.set('endDate',end);
    params.set('recordEnabledYn','Y');
    params.set('recordVisibility',document.getElementById('projectTaskRecordVisibility')?.value||'PROJECT');
    if(useTime) { params.set('startTime',getProjectTaskPickerTime('projectTaskStartTime')); params.set('endTime',getProjectTaskPickerTime('projectTaskEndTime')); }
    selectedProjectTaskAssignees.forEach(person => params.append('assigneeIds', person.id));
    if (selectedProjectTaskAssignees[0]?.id) params.set('assignedUserId', selectedProjectTaskAssignees[0].id);
    const button=document.getElementById('projectTaskSubmitBtn'); button.disabled=true;
    try {
        const response=await fetch(getTaskApiUrl(taskId?'/project/api/update-task':'/project/api/add-task'),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString(),credentials:'include'});
        const result=await response.text(); if(!response.ok||result!=='SUCCESS') throw new Error(result||'SAVE_FAILED');
        const savedRecordEnabledYn = 'Y';
        const savedRecordVisibility = document.getElementById('projectTaskRecordVisibility')?.value || 'PROJECT';

        // 수정 저장은 서버에서 다시 읽어 실제 반영값을 확인한다. 캐시/화면 상태만 믿지 않는다.
        let verifiedTask = null;
        if (taskId) {
            try {
                const verifyResponse = await fetch(getTaskApiUrl('/project/api/task-detail?taskId=' + encodeURIComponent(taskId)), {
                    credentials: 'include',
                    cache: 'no-store'
                });
                if (verifyResponse.ok) verifiedTask = await verifyResponse.json();
            } catch (verifyError) {
                console.warn('[프로젝트 작업] 저장 후 기록 설정 재조회 실패:', verifyError);
            }
            if (verifiedTask && Object.keys(verifiedTask).length) {
                const actualEnabled = String(taskValue(verifiedTask,'RECORD_ENABLED_YN','recordEnabledYn')||'N').toUpperCase();
                const expectedEnabled = String(savedRecordEnabledYn).toUpperCase();
                if (actualEnabled !== expectedEnabled) {
                    throw new Error('RECORD_SETTING_NOT_APPLIED');
                }
                const index = projectTaskCache.findIndex(item => String(taskValue(item,'TASK_ID','taskId')) === String(taskId));
                if (index >= 0) projectTaskCache[index] = verifiedTask;
                currentProjectTaskModalTask = verifiedTask;
            }
        }

        closeProjectTaskModal();
        await refreshProjectTaskAndMemberView();
        await refreshProjectCollaborationActivity();
        document.dispatchEvent(new CustomEvent('moyo:content-record-availability-changed', {
            detail: {
                taskId: taskId ? Number(taskId) : null,
                projId: Number(getProjectTaskProjectId() || 0) || null,
                enabledYn: savedRecordEnabledYn,
                visibility: savedRecordVisibility
            }
        }));
    } catch(error) { alert('할 일을 저장하지 못했습니다. ('+error.message+')'); }
    finally { button.disabled=false; }
}
async function deleteProjectTask() {
    const taskId=document.getElementById('projectTaskId').value; if(!taskId||!confirm('이 할 일을 삭제하시겠습니까?')) return;
    try {
        const response=await fetch(getTaskApiUrl('/project/api/delete-task'),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({taskId,projId:String(getProjectTaskProjectId()||'')}).toString(),credentials:'include'});
        const result=await response.text(); if(!response.ok||result!=='SUCCESS') throw new Error(result||'DELETE_FAILED');
        closeProjectTaskModal(); await refreshProjectTaskAndMemberView(); await refreshProjectCollaborationActivity();
    } catch(error) { alert('할 일을 삭제하지 못했습니다.'); }
}



function syncProjectTaskRecordSetting(){
    const wrap=document.getElementById('projectTaskRecordVisibilityWrap');
    if(wrap) wrap.hidden=false;
}
function setProjectTaskRecordVisibility(value){
    const input=document.getElementById('projectTaskRecordVisibility');
    if(input) input.value=String(value||'PROJECT').toUpperCase();
    syncProjectTaskRecordVisibilityOptions();
}
function syncProjectTaskRecordVisibilityOptions(){
    const value=String(document.getElementById('projectTaskRecordVisibility')?.value||'PROJECT').toUpperCase();
    document.querySelectorAll('[data-record-visibility]').forEach(button=>{
        const selected=String(button.dataset.recordVisibility||'').toUpperCase()===value;
        button.classList.toggle('is-selected',selected);
        button.setAttribute('aria-checked',selected?'true':'false');
    });
    const help=document.getElementById('projectTaskRecordVisibilityHelp');
    if(help){
        help.innerHTML=value==='ASSIGNEE_MANAGER'
            ? '<i class="fa-solid fa-lock" aria-hidden="true"></i> 담당자 전원과 팀장·관리자만 기록을 확인할 수 있습니다.'
            : '<i class="fa-solid fa-lock-open" aria-hidden="true"></i> 프로젝트 멤버가 연결된 기록을 확인할 수 있습니다.';
    }
}


/* 작업 기록 공통 구조 전환 */
let projectTaskCommonRecordModal = null;
let currentProjectTaskRecordTarget = null;

function projectTaskCommonRecordContextPath() {
    return window.PROJECT_MAIN_CONFIG?.contextPath || document.body?.dataset?.contextPath || '';
}

async function ensureProjectTaskRecordTarget(task) {
    const taskId = taskValue(task, 'TASK_ID', 'taskId');
    const projId = taskValue(task, 'PROJ_ID', 'projId') || getProjectTaskProjectId();
    if (!taskId || !projId) throw new Error('할 일 기록 대상을 확인할 수 없습니다.');
    const response = await fetch(getTaskApiUrl('/api/content-records/target'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({
            targetType: 'TASK',
            targetId: Number(taskId),
            contextType: 'PROJECT',
            contextId: Number(projId)
        })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || '할 일 기록 대상을 준비하지 못했습니다.');
    currentProjectTaskRecordTarget = body;
    return body;
}

function commonTaskRecordType(item) {
    const raw = String(taskValue(item, 'RECORD_TYPE', 'recordType', 'CONTENT_TYPE', 'contentType') || '').toUpperCase();
    return raw === 'PHOTO_POST' ? 'PHOTO' : raw;
}

function renderProjectTaskCommonRecordSummary(items) {
    const wrap = document.getElementById('projectTaskRecordSummaryCounts');
    if (!wrap) return;
    const counts = {NOTE:0, PHOTO:0, FILE:0, LINK:0, LOCATION:0};
    (Array.isArray(items) ? items : []).forEach(item => {
        const type = commonTaskRecordType(item);
        if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type]++;
    });

    const taskId = taskValue(currentProjectTaskModalTask, 'TASK_ID', 'taskId');
    const indicator = projectTaskIndicators.get(String(taskId || '')) || {};
    const unreadByType = {
        NOTE: Number(indicator.unreadNoteCount || 0) > 0,
        PHOTO: Number(indicator.unreadPhotoCount || 0) > 0,
        FILE: Number(indicator.unreadFileCount || 0) > 0,
        LINK: Number(indicator.unreadLinkCount || 0) > 0,
        LOCATION: Number(indicator.unreadLocationCount || 0) > 0
    };

    wrap.innerHTML = [
        ['NOTE','fa-regular fa-note-sticky','노트',counts.NOTE],
        ['PHOTO','fa-regular fa-image','사진',counts.PHOTO],
        ['FILE','fa-solid fa-paperclip','파일',counts.FILE],
        ['LINK','fa-solid fa-link','링크',counts.LINK],
        ['LOCATION','fa-solid fa-location-dot','장소',counts.LOCATION]
    ].map(v => {
        const dot = unreadByType[v[0]]
            ? '<span class="project-task-record-type-dot" aria-hidden="true"></span>'
            : '';
        return '<button type="button" class="project-task-record-summary__shortcut" data-record-type="'+v[0]+'" title="'+v[2]+' 바로 열기" aria-label="'+v[2]+' '+v[3]+'개, 바로 열기">' +
            '<span class="project-task-record-summary__icon"><i class="'+v[1]+'" aria-hidden="true"></i>'+dot+'</span><b>'+v[3]+'</b></button>';
    }).join('');
}


async function loadProjectTaskRecords(task) {
    const section = document.getElementById('projectTaskRecords');
    if (!section || !task) return;
    if (!isProjectTaskRecordEnabled(task)) {
        section.hidden = true;
        currentProjectTaskRecords = [];
        renderProjectTaskCommonRecordSummary([]);
        return;
    }
    section.hidden = false;
    try {
        const target = await ensureProjectTaskRecordTarget(task);
        const id = taskValue(target, 'RECORD_TARGET_ID', 'recordTargetId');
        const response = await fetch(getTaskApiUrl('/api/content-records/' + encodeURIComponent(id) + '/items'), {credentials:'include'});
        if (!response.ok) throw new Error('LOAD_FAILED');
        currentProjectTaskRecords = await response.json();
        renderProjectTaskCommonRecordSummary(currentProjectTaskRecords);
    } catch (error) {
        console.error('[프로젝트 작업] 공통 기록 조회 실패:', error);
        currentProjectTaskRecords = [];
        renderProjectTaskCommonRecordSummary([]);
    }
}

function prepareProjectTaskRecordSection(task) {
    const section = document.getElementById('projectTaskRecords');
    if (!section || !task) return false;
    const enabled = isProjectTaskRecordEnabled(task);
    section.hidden = !enabled;
    if (!enabled) {
        currentProjectTaskRecords = [];
        renderProjectTaskCommonRecordSummary([]);
        return false;
    }
    renderProjectTaskCommonRecordSummary([]);
    return true;
}

async function openProjectTaskRecordViewer(recordType) {
    if (!currentProjectTaskModalTask || !isProjectTaskRecordEnabled(currentProjectTaskModalTask)) return;
    const activeType = String(recordType || 'NOTE').toUpperCase();
    const taskId = taskValue(currentProjectTaskModalTask, 'TASK_ID', 'taskId');

    try {
        const target = await ensureProjectTaskRecordTarget(currentProjectTaskModalTask);
        const id = taskValue(target, 'RECORD_TARGET_ID', 'recordTargetId');
        if (!projectTaskCommonRecordModal) throw new Error('공통 기록 모달을 불러오지 못했습니다.');

        const indicator = projectTaskIndicators.get(String(taskId)) || {};
        const unreadTypeCounts = {
            NOTE: Number(indicator.unreadNoteCount || 0),
            PHOTO: Number(indicator.unreadPhotoCount || 0),
            FILE: Number(indicator.unreadFileCount || 0),
            LINK: Number(indicator.unreadLinkCount || 0),
            LOCATION: Number(indicator.unreadLocationCount || 0)
        };
        const unreadTypes = Object.keys(unreadTypeCounts).filter(function (type) {
            return unreadTypeCounts[type] > 0;
        });

        let unreadItemIds = [];
        try {
            const fetchTypes = Array.from(new Set(unreadTypes.concat([activeType])));
            const unreadLists = await Promise.all(fetchTypes.map(async function (type) {
                const unreadResponse = await fetch(
                    getTaskApiUrl('/project/api/task-record-unread-items?taskId=' + encodeURIComponent(taskId) +
                        '&recordType=' + encodeURIComponent(type)),
                    {credentials:'include', cache:'no-store'}
                );
                if (!unreadResponse.ok) return [];
                const rows = await unreadResponse.json();
                return Array.isArray(rows) ? rows : [];
            }));
            unreadItemIds = Array.from(new Set(unreadLists.flat().map(String)));
        } catch (error) {
            console.error('[프로젝트 작업] 미확인 기록 항목 조회 실패:', error);
        }

        await projectTaskCommonRecordModal.open({
            recordTargetId: Number(id),
            targetLabel: String(taskValue(currentProjectTaskModalTask, 'TITLE', 'title') || '할 일'),
            activeType: activeType,
            unreadItemIds: unreadItemIds,
            unreadTypes: unreadTypes
        });

        try {
            const readResponse = await fetch(
                getTaskApiUrl('/project/api/task-record-read?taskId=' + encodeURIComponent(taskId) +
                    '&recordType=' + encodeURIComponent(activeType)),
                {method:'POST', credentials:'include'}
            );
            if (readResponse.ok) {
                clearProjectTaskRecordUnread(taskId, activeType);
                projectTaskCommonRecordModal.clearUnreadType?.(activeType);
            }
        } catch (error) {
            console.error('[프로젝트 작업] 기록 읽음 처리 실패:', error);
        }
    } catch (error) {
        alert(error.message || '기록을 열지 못했습니다.');
    }
}


function initProjectTaskCommonRecordModal() {
    if (!window.CommonContentRecordModal?.create || projectTaskCommonRecordModal) return;
    projectTaskCommonRecordModal = window.CommonContentRecordModal.create({
        contextPath: projectTaskCommonRecordContextPath(),
        onTypeViewed: async function (recordType) {
            if (!currentProjectTaskModalTask) return false;
            const taskId = taskValue(currentProjectTaskModalTask, 'TASK_ID', 'taskId');
            if (!taskId) return false;
            const type = String(recordType || '').toUpperCase();
            const response = await fetch(
                getTaskApiUrl('/project/api/task-record-read?taskId=' + encodeURIComponent(taskId) +
                    '&recordType=' + encodeURIComponent(type)),
                {method:'POST', credentials:'include'}
            );
            if (!response.ok) return false;
            clearProjectTaskRecordUnread(taskId, type);
            return true;
        },
        onChanged: async function (change) {
            if (currentProjectTaskModalTask) await loadProjectTaskRecords(currentProjectTaskModalTask);

            const changedType = String(change?.type || '').toUpperCase();
            if (changedType === 'NOTE') {
                window.MoyoCommonContentWidgets?.reloadNotes?.();
            } else if (changedType === 'PHOTO') {
                window.MoyoCommonContentWidgets?.reloadPhotos?.();
            }
        },
        onCreateNote: async function () {
            throw new Error('공통 노트 작성 화면 연결은 다음 전환 단계에서 적용됩니다.');
        },
        onCreatePhoto: async function ({ recordTargetId, formData }) {
            if (!currentProjectTaskModalTask) throw new Error('할 일 정보를 확인할 수 없습니다.');

            const taskTitle = String(taskValue(currentProjectTaskModalTask, 'TITLE', 'title') || '할 일').trim();
            const projId = Number(taskValue(currentProjectTaskModalTask, 'PROJ_ID', 'projId') || getProjectTaskProjectId());
            if (!recordTargetId || !projId) throw new Error('사진을 저장할 기록 대상을 확인할 수 없습니다.');

            const files = formData.getAll('files').filter(file => file instanceof File && file.size > 0);
            if (files.length === 0) throw new Error('등록할 사진을 선택해주세요.');

            const requestJson = async (url, options) => {
                const response = await fetch(getTaskApiUrl(url), Object.assign({ credentials: 'include' }, options || {}));
                const body = await response.json().catch(() => null);
                if (!response.ok) throw new Error(body?.message || body?.error || '사진을 저장하지 못했습니다.');
                return body;
            };

            const album = await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/photo-album', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ albumName: '[할 일 보드] ' + taskTitle })
            });
            const albumId = Number(album?.albumId || album?.ALBUM_ID);
            if (!albumId) throw new Error('기록 사진 앨범을 준비하지 못했습니다.');

            const upload = new FormData();
            upload.append('scopeType', 'PROJECT');
            upload.append('scopeId', String(projId));
            upload.append('albumId', String(albumId));
            upload.append('title', '[할 일 보드] ' + taskTitle);
            upload.append('description', '');
            upload.append('visibilityType', 'PROJECT');
            files.forEach(file => upload.append('files', file));

            const post = await requestJson('/api/photo-posts', { method: 'POST', body: upload });
            const postId = Number(post?.postId || post?.POST_ID);
            if (!postId) throw new Error('사진 게시물 정보를 확인하지 못했습니다.');

            await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/contents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recordType: 'PHOTO',
                    contentId: postId,
                    title: '[할 일 보드] ' + taskTitle
                })
            });
        }
    });
    window.moyoCommonContentRecordModal = projectTaskCommonRecordModal;
}

document.addEventListener('DOMContentLoaded', function(){
    initProjectTaskCommonRecordModal();
    document.getElementById('projectTaskRecordSummaryCounts')?.addEventListener('click', function (event) {
        const shortcut = event.target.closest('[data-record-type]');
        if (!shortcut) return;
        openProjectTaskRecordViewer(shortcut.dataset.recordType);
    });
    document.querySelectorAll('[data-record-visibility]').forEach(button=>button.addEventListener('click',()=>setProjectTaskRecordVisibility(button.dataset.recordVisibility)));
    document.querySelectorAll('.project-task-status-option[data-task-status]').forEach(function(button) {
        if (button.dataset.taskStatusBound === 'true') return;
        button.dataset.taskStatusBound = 'true';
        button.addEventListener('click', function() {
            if (button.disabled) return;
            setProjectTaskStatus(button.dataset.taskStatus);
        });
    });

    const startDateInput = document.getElementById('projectTaskStartDate');
    if (startDateInput && startDateInput.dataset.taskDateBoundsBound !== 'true') {
        startDateInput.dataset.taskDateBoundsBound = 'true';
        startDateInput.addEventListener('change', handleProjectTaskStartDateChange);
        startDateInput.addEventListener('input', syncProjectTaskInputWeekdays);
    }

    const endDateInput = document.getElementById('projectTaskEndDate');
    if (endDateInput && endDateInput.dataset.taskDateBoundsBound !== 'true') {
        endDateInput.dataset.taskDateBoundsBound = 'true';
        endDateInput.addEventListener('change', handleProjectTaskEndDateChange);
        endDateInput.addEventListener('input', syncProjectTaskInputWeekdays);
    }

    const startTimeInput = document.getElementById('projectTaskStartTime');
    if (startTimeInput && startTimeInput.dataset.taskTimeRangeBound !== 'true') {
        startTimeInput.dataset.taskTimeRangeBound = 'true';
        startTimeInput.addEventListener('change', handleProjectTaskStartTimeChange);
    }

    const endTimeInput = document.getElementById('projectTaskEndTime');
    if (endTimeInput && endTimeInput.dataset.taskTimeRangeBound !== 'true') {
        endTimeInput.dataset.taskTimeRangeBound = 'true';
        endTimeInput.addEventListener('change', handleProjectTaskEndTimeChange);
    }

    const useTimeToggle = document.getElementById('projectTaskUseTime');
    if (useTimeToggle && useTimeToggle.dataset.taskTimeToggleBound !== 'true') {
        useTimeToggle.dataset.taskTimeToggleBound = 'true';
        useTimeToggle.addEventListener('change', function () {
            syncProjectTaskTimeFields();
            handleProjectTaskEndTimeChange();
        });
    }

    bindProjectTaskDateDisplay('projectTaskStartDateDisplay', 'projectTaskStartDate');
    bindProjectTaskDateDisplay('projectTaskEndDateDisplay', 'projectTaskEndDate');
    syncProjectTaskInputWeekdays();
    syncProjectTaskTimeFields();
});

window.openProjectTaskDetail = openProjectTaskDetail;


/* =====================================================================
   2026-09-18 진행 보드 mobile drag edge scroll v3
   ===================================================================== */
(function bindProjectTaskBoardEdgeAutoScrollV3() {
    if (window.__moyoProjectTaskBoardEdgeScrollV3) return;
    window.__moyoProjectTaskBoardEdgeScrollV3 = true;

    let rafId = 0;
    let direction = 0;

    function stop() {
        direction = 0;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
    }

    function tick() {
        const board = document.getElementById('projectTaskBoard');
        if (!board || !direction) {
            stop();
            return;
        }
        board.scrollLeft += direction * 9;
        rafId = requestAnimationFrame(tick);
    }

    document.addEventListener('dragover', function (event) {
        const board = document.getElementById('projectTaskBoard');
        if (!board || window.innerWidth > 760) {
            stop();
            return;
        }

        const rect = board.getBoundingClientRect();
        const edge = Math.min(60, Math.max(40, rect.width * 0.15));
        const next = event.clientX < rect.left + edge ? -1
                   : event.clientX > rect.right - edge ? 1
                   : 0;

        if (next === direction) return;
        stop();
        direction = next;
        if (direction) rafId = requestAnimationFrame(tick);
    });

    document.addEventListener('drop', stop);
    document.addEventListener('dragend', stop);
})();


function applyProjectTaskRecordUpdateDots(root) {
    const scope = root || document;
    const rows = scope.querySelectorAll(
        '[data-record-item], .project-task-record-item, .content-record-item, .record-item'
    );

    rows.forEach(function(row) {
        const updated =
            row.classList.contains('is-updated') ||
            String(row.getAttribute('data-updated') || '').toUpperCase() === 'Y' ||
            Number(row.getAttribute('data-update-count') || 0) > 0;

        let dot = row.querySelector('.project-task-record-update-dot');
        if (updated && !dot) {
            dot = document.createElement('span');
            dot.className = 'project-task-record-update-dot';
            dot.title = '업데이트됨';
            dot.setAttribute('aria-label', '업데이트됨');

            const label =
                row.querySelector('.record-title, .content-record-title, strong, b, .title') ||
                row.firstElementChild ||
                row;
            label.appendChild(dot);
        } else if (!updated && dot) {
            dot.remove();
        }
    });
}

document.addEventListener('moyo:record-modal-opened', function(event) {
    const root = event && event.detail && event.detail.root ? event.detail.root : document;
    applyProjectTaskRecordUpdateDots(root);
});

const projectTaskRecordDotObserver = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes || []) {
            if (node && node.nodeType === 1) {
                applyProjectTaskRecordUpdateDots(node);
            }
        }
    }
});
projectTaskRecordDotObserver.observe(document.documentElement, {childList:true, subtree:true});

