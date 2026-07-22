/**
 * MOYO 프로젝트 업무 데이터 기준
 *
 * API 응답의 대문자/소문자/과거 별칭을 화면 공통 업무 객체로 정규화합니다.
 *
 * 표준 필드:
 * taskId, projectId, assignedUserId, userName, title, status,
 * startDate, endDate, useTime, startTime, endTime,
 * actualStartDate, actualDoneDate, delayedYn
 *
 * 상태값:
 * TODO / IN_PROGRESS / DONE
 */
(function(global) {
    'use strict';

    const STATUS = Object.freeze({
        TODO: 'TODO',
        IN_PROGRESS: 'IN_PROGRESS',
        DONE: 'DONE'
    });

    function firstValue(source, keys, fallback) {
        if (!source) return fallback;

        for (let i = 0; i < keys.length; i++) {
            const value = source[keys[i]];
            if (value !== undefined && value !== null && value !== '') {
                return value;
            }
        }

        return fallback;
    }

    function normalizeId(value) {
        if (value === undefined || value === null || value === '') return '';
        return String(value);
    }

    function normalizeDate(value) {
        const text = String(value || '').trim();
        if (!text) return '';

        const normalized = text.replace(/\./g, '-').replace(/\//g, '-');
        const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

        if (!match) return normalized.substring(0, 10);

        return [
            match[1],
            String(match[2]).padStart(2, '0'),
            String(match[3]).padStart(2, '0')
        ].join('-');
    }

    function normalizeTime(value, fallback) {
        const text = String(value || '').trim();

        if (/^\d{1,2}:\d{2}/.test(text)) {
            const parts = text.split(':');
            return String(parts[0]).padStart(2, '0') + ':' + parts[1].substring(0, 2);
        }

        return fallback || '';
    }

    function normalizeStatus(value) {
        const text = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

        if (
            text === 'DONE' ||
            text === 'COMPLETE' ||
            text === 'COMPLETED' ||
            text === 'FINISHED' ||
            text === '완료'
        ) {
            return STATUS.DONE;
        }

        if (
            text === 'IN_PROGRESS' ||
            text === 'PROGRESS' ||
            text === 'DOING' ||
            text === '진행' ||
            text === '진행중' ||
            text === '진행_중'
        ) {
            return STATUS.IN_PROGRESS;
        }

        return STATUS.TODO;
    }

    function normalizeYn(value, fallback) {
        const text = String(value == null ? '' : value).trim().toUpperCase();

        if (['Y', 'YES', 'TRUE', '1'].includes(text)) return 'Y';
        if (['N', 'NO', 'FALSE', '0'].includes(text)) return 'N';

        return fallback || 'N';
    }

    function normalizeProjectTask(rawTask) {
        const raw = rawTask && typeof rawTask === 'object' ? rawTask : {};

        const taskId = normalizeId(firstValue(raw, [
            'taskId', 'TASK_ID', 'eventId', 'EVENT_ID'
        ], ''));

        const projectId = normalizeId(firstValue(raw, [
            'projectId', 'PROJECT_ID', 'projId', 'PROJ_ID'
        ], ''));

        const assignedUserId = normalizeId(firstValue(raw, [
            'assignedUserId', 'ASSIGNED_USER_ID',
            'userId', 'USER_ID',
            'assigneeId', 'ASSIGNEE_ID'
        ], ''));

        const title = String(firstValue(raw, [
            'title', 'TITLE', 'taskTitle', 'TASK_TITLE'
        ], '') || '').trim();

        const userName = String(firstValue(raw, [
            'userName', 'USER_NAME',
            'assignedUserName', 'ASSIGNED_USER_NAME',
            'assigneeName', 'ASSIGNEE_NAME'
        ], '') || '').trim();

        const startDate = normalizeDate(firstValue(raw, [
            'startDate', 'START_DATE'
        ], ''));

        const endDate = normalizeDate(firstValue(raw, [
            'endDate', 'END_DATE', 'dueDate', 'DUE_DATE'
        ], startDate));

        const explicitUseTime = firstValue(raw, [
            'useTime', 'USE_TIME', 'taskUseTime', 'TASK_USE_TIME'
        ], '');

        const rawStartTime = firstValue(raw, [
            'startTime', 'START_TIME', 'startTimeSlot', 'START_TIME_SLOT'
        ], '');

        const rawEndTime = firstValue(raw, [
            'endTime', 'END_TIME', 'endTimeSlot', 'END_TIME_SLOT'
        ], '');

        const hasTimeValue = !!(String(rawStartTime || '').trim() || String(rawEndTime || '').trim());
        const useTime = explicitUseTime === ''
            ? (hasTimeValue ? 'Y' : 'N')
            : normalizeYn(explicitUseTime, hasTimeValue ? 'Y' : 'N');

        const startTime = useTime === 'Y' ? normalizeTime(rawStartTime, '09:00') : '';
        const endTime = useTime === 'Y' ? normalizeTime(rawEndTime, '18:00') : '';

        const actualStartDate = normalizeDate(firstValue(raw, [
            'actualStartDate', 'ACTUAL_START_DATE'
        ], ''));

        const actualDoneDate = normalizeDate(firstValue(raw, [
            'actualDoneDate', 'ACTUAL_DONE_DATE',
            'actualEndDate', 'ACTUAL_END_DATE'
        ], ''));

        const delayedYn = normalizeYn(firstValue(raw, [
            'delayedYn', 'DELAYED_YN'
        ], 'N'), 'N');

        const status = normalizeStatus(firstValue(raw, [
            'status', 'STATUS', 'taskStatus', 'TASK_STATUS'
        ], STATUS.TODO));

        return Object.assign({}, raw, {
            taskId,
            projectId,
            assignedUserId,
            userId: assignedUserId,
            userName,
            title,
            status,
            startDate,
            endDate,
            useTime,
            startTime,
            endTime,
            actualStartDate,
            actualDoneDate,
            delayedYn,

            TASK_ID: taskId,
            PROJ_ID: projectId,
            PROJECT_ID: projectId,
            ASSIGNED_USER_ID: assignedUserId,
            USER_ID: assignedUserId,
            USER_NAME: userName,
            TITLE: title,
            STATUS: status,
            START_DATE: startDate,
            END_DATE: endDate,
            USE_TIME: useTime,
            START_TIME: startTime,
            END_TIME: endTime,
            ACTUAL_START_DATE: actualStartDate,
            ACTUAL_DONE_DATE: actualDoneDate,
            DELAYED_YN: delayedYn
        });
    }

    function normalizeProjectTasks(tasks) {
        return Array.isArray(tasks) ? tasks.map(normalizeProjectTask) : [];
    }

    global.PROJECT_TASK_STATUS = STATUS;
    global.normalizeProjectTask = normalizeProjectTask;
    global.normalizeProjectTasks = normalizeProjectTasks;
})(window);
