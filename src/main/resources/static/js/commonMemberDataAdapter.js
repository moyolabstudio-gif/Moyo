(function (global) {
    'use strict';

    const EMPTY_STATS = Object.freeze({ total: 0, todo: 0, progress: 0, done: 0, delay: 0 });
    let workspaceMembersCache = [];
    let projectMembersCache = [];

    function text(value, fallback) {
        const result = value == null ? '' : String(value).trim();
        return result || (fallback || '');
    }

    function first(source, keys, fallback) {
        for (const key of keys) {
            if (source && source[key] != null && String(source[key]).trim() !== '') return source[key];
        }
        return fallback;
    }

    function roleInfo(scope, rawRole, isOwner) {
        if (isOwner) {
            return scope === 'WORKSPACE'
                ? { code: 'OWNER', text: '그룹장', className: 'leader' }
                : { code: 'LEADER', text: '팀장', className: 'leader' };
        }
        const code = text(rawRole, 'MEMBER').toUpperCase();
        if (scope === 'WORKSPACE' && ['OWNER', 'LEADER'].includes(code)) {
            return { code: 'OWNER', text: '그룹장', className: 'leader' };
        }
        if (scope === 'PROJECT' && ['OWNER', 'LEADER', 'PM'].includes(code)) {
            return { code: 'LEADER', text: '팀장', className: 'leader' };
        }
        if (code === 'ADMIN') {
            return { code: 'ADMIN', text: '관리자', className: 'admin' };
        }
        return { code: 'MEMBER', text: '멤버', className: 'member' };
    }

    function normalizeMember(raw, options) {
        const opts = options || {};
        const scope = text(opts.scope, 'PROJECT').toUpperCase();
        const userId = text(first(raw, ['USER_ID', 'userId', 'MEMBER_ID', 'memberId'], ''));
        const name = text(first(raw, ['DISPLAY_NAME', 'displayName', 'USER_NAME', 'userName', 'NAME', 'name'], ''), '이름 없음');
        const ownerId = text(opts.ownerId || '');
        const isOwner = !!userId && userId === ownerId;
        const role = roleInfo(scope, first(raw, scope === 'WORKSPACE'
            ? ['WS_ROLE', 'wsRole', 'ROLE', 'role']
            : ['PROJ_ROLE', 'projRole', 'ROLE', 'role'], 'MEMBER'), isOwner);
        const position = text(first(raw, scope === 'WORKSPACE'
            ? ['POSITION_NAME', 'positionName', 'WS_POSITION', 'wsPosition']
            : ['PROJ_POSITION', 'projPosition', 'PROJECT_POSITION', 'projectPosition', 'WS_POSITION', 'wsPosition', 'POSITION_NAME', 'positionName'], ''));
        const email = text(first(raw, ['EMAIL', 'email', 'USER_EMAIL', 'userEmail'], ''));
        return {
            scope: scope,
            userId: userId,
            name: name,
            profileImage: text(first(raw, ['PROFILE_IMAGE_PATH', 'profileImagePath', 'PROFILE_IMAGE', 'profileImage'], '')),
            profileAvatarType: text(first(raw, ['PROFILE_AVATAR_TYPE', 'profileAvatarType', 'AVATAR_TYPE', 'avatarType'], 'DEFAULT'), 'DEFAULT').toUpperCase(),
            role: role,
            position: position,
            secondary: [position, email].filter(Boolean).join(' · '),
            email: email,
            isOwner: isOwner,
            joinedAt: text(first(raw, ['JOINED_AT', 'joinedAt'], '')),
            raw: raw
        };
    }

    function isDelayed(task) {
        const status = text(first(task, ['STATUS', 'status'], 'TODO')).toUpperCase();
        if (status === 'DONE') return false;
        if (typeof global.isTaskDelayed === 'function') {
            return !!global.isTaskDelayed(
                first(task, ['END_DATE', 'endDate'], ''),
                first(task, ['END_TIME', 'endTime', 'END_TIME_SLOT', 'endTimeSlot'], ''),
                status
            );
        }
        const dateText = text(first(task, ['END_DATE', 'endDate'], '')).replace(/[./]/g, '-');
        if (!dateText) return false;
        const timeText = text(first(task, ['END_TIME', 'endTime', 'END_TIME_SLOT', 'endTimeSlot'], ''), '23:59');
        const due = new Date(dateText + 'T' + timeText.substring(0, 5) + ':00');
        return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
    }

    function buildStats(tasks) {
        const stats = Object.create(null);
        (Array.isArray(tasks) ? tasks : []).forEach(function (task) {
            const userId = text(first(task, ['ASSIGNED_USER_ID', 'assignedUserId', 'USER_ID', 'userId'], ''));
            if (!userId) return;
            const item = stats[userId] || { total: 0, todo: 0, progress: 0, done: 0, delay: 0 };
            const status = text(first(task, ['STATUS', 'status'], 'TODO')).toUpperCase();
            if (status === 'DONE') item.done += 1;
            else if (status === 'IN_PROGRESS') item.progress += 1;
            else item.todo += 1;
            if (isDelayed(task)) item.delay += 1;
            item.total = item.todo + item.progress + item.done;
            stats[userId] = item;
        });
        return stats;
    }

    function adaptMembers(members, options) {
        const opts = options || {};
        const stats = opts.stats || Object.create(null);
        return (Array.isArray(members) ? members : []).map(function (raw) {
            const member = normalizeMember(raw, opts);
            member.stats = stats[member.userId] || EMPTY_STATS;
            return member;
        }).sort(function (a, b) {
            if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
            const rank = { leader: 0, admin: 1, member: 2 };
            const roleDiff = (rank[a.role.className] ?? 9) - (rank[b.role.className] ?? 9);
            return roleDiff || a.name.localeCompare(b.name, 'ko');
        });
    }

    function contextPath() {
        return document.body?.dataset.contextPath
            || global.PROJECT_MAIN_CONFIG?.contextPath
            || '';
    }

    function ensureOk(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    }

    function render(options) {
        const opts = options || {};
        const listId = opts.listId || (String(opts.scope || '').toUpperCase() === 'WORKSPACE' ? 'workspaceMemberList' : 'projectMemberList');

        // 달력의 참석자 선택처럼 멤버 데이터만 필요한 화면에서는
        // 멤버 위젯 DOM/renderer를 강제로 요구하지 않는다.
        if (!document.getElementById(listId)) return;

        if (!global.CommonMemberWidget || typeof global.CommonMemberWidget.renderMembers !== 'function') {
            throw new Error('CommonMemberWidget renderer is not loaded.');
        }
        global.CommonMemberWidget.renderMembers(options);
    }

    function loadWorkspace(options) {
        const opts = options || {};
        const wsId = text(opts.wsId || document.body?.dataset.wsId || '');
        if (!wsId) return Promise.resolve([]);
        var membersRequest = fetch(contextPath() + '/workspace/api/members?wsId=' + encodeURIComponent(wsId), { credentials: 'same-origin' }).then(ensureOk);
        var leavesRequest = fetch(contextPath() + '/workspace/api/member-leave-activities?wsId=' + encodeURIComponent(wsId), { credentials: 'same-origin' })
            .then(ensureOk)
            .catch(function () { return []; });
        return Promise.all([membersRequest, leavesRequest])
            .then(function (results) {
                const rows = results[0];
                const leaves = Array.isArray(results[1]) ? results[1] : [];
                const members = adaptMembers(rows, {
                    scope: 'WORKSPACE',
                    ownerId: text(opts.ownerId || document.body?.dataset.workspaceOwnerId || '')
                });
                workspaceMembersCache = members.slice();
                document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: { scope: 'WORKSPACE', scopeId: wsId, wsId: wsId, contextPath: contextPath(), members: members, leaves: leaves } }));
                const widgetMembers = members.map(function (member) {
                    return Object.assign({}, member, { secondary: member.position || '' });
                });
                render({
                    listId: opts.listId || 'workspaceMemberList',
                    countId: opts.countId || 'workspaceMemberCount',
                    members: widgetMembers,
                    emptyText: '참여 중인 멤버가 없습니다.',
                    showStats: false,
                    hideEmptySecondary: true,
                    avatarFit: 'cover',
                    displayLimit: Number(opts.displayLimit || 5),
                    onSelect: function (member) {
                        if (typeof global.openWorkspaceMemberActivityProfile === 'function') global.openWorkspaceMemberActivityProfile(member.userId);
                        else if (typeof global.openWorkspaceMemberProfile === 'function') global.openWorkspaceMemberProfile(member.userId);
                    }
                });
                return members;
            });
    }

    function loadProject(options) {
        const opts = options || {};
        const config = global.PROJECT_MAIN_CONFIG || {};
        const projId = text(opts.projId || config.projectId || new URLSearchParams(location.search).get('projId') || '');
        if (!projId || config.isPersonalProject) return Promise.resolve([]);
        const base = contextPath();
        return Promise.all([
            fetch(base + '/project/api/members?projId=' + encodeURIComponent(projId), { credentials: 'same-origin' }).then(ensureOk),
            fetch(base + '/project/api/tasks?projId=' + encodeURIComponent(projId), { credentials: 'same-origin' }).then(ensureOk)
        ]).then(function (result) {
            const stats = buildStats(result[1]);
            const members = adaptMembers(result[0], {
                scope: 'PROJECT',
                ownerId: text(opts.ownerId || config.projectLeaderId || config.leaderId || ''),
                stats: stats
            });
            projectMembersCache = members.slice();
            document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: {
                scope: 'PROJECT',
                scopeId: projId,
                projId: projId,
                wsId: text(config.wsId || document.body?.dataset.wsId || ''),
                contextPath: contextPath(),
                members: members
            } }));
            const widgetMembers = members.map(function (member) {
                return Object.assign({}, member, { secondary: member.secondary || '' });
            });
            render({
                listId: opts.listId || 'projectMemberList',
                countId: opts.countId || 'projectMemberCount',
                members: widgetMembers,
                emptyText: '참여 중인 멤버가 없습니다.',
                showStats: true,
                hideEmptySecondary: true,
                avatarFit: 'cover',
                displayLimit: Number(opts.displayLimit || 5),
                onSelect: function (member) {
                    if (typeof global.openProjectMemberProfile === 'function') global.openProjectMemberProfile(member.userId);
                }
            });
            return members;
        });
    }

    function showError(scope, message) {
        const listId = scope === 'WORKSPACE' ? 'workspaceMemberList' : 'projectMemberList';
        if (global.CommonMemberWidget?.renderState) {
            global.CommonMemberWidget.renderState(listId, message || '멤버 정보를 불러오지 못했습니다.', 'error');
        }
    }

    global.CommonMemberDataAdapter = {
        normalizeMember: normalizeMember,
        buildStats: buildStats,
        adaptMembers: adaptMembers,
        loadWorkspace: loadWorkspace,
        loadProject: loadProject,
        getWorkspaceMembers: function () { return workspaceMembersCache.slice(); },
        getProjectMembers: function () { return projectMembersCache.slice(); },
        refreshWorkspace: function () { return loadWorkspace().catch(function (e) {
            console.error(e);
            showError('WORKSPACE');
            const wsId = text(document.body?.dataset.wsId || '');
            if (wsId) document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: {
                scope: 'WORKSPACE', scopeId: wsId, wsId: wsId, contextPath: contextPath(), members: [], leaves: []
            } }));
            return [];
        }); },
        refreshProject: function () { return loadProject().catch(function (e) {
            console.error(e);
            showError('PROJECT');
            const config = global.PROJECT_MAIN_CONFIG || {};
            const projId = text(config.projectId || new URLSearchParams(location.search).get('projId') || '');
            if (projId) document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: {
                scope: 'PROJECT', scopeId: projId, projId: projId,
                wsId: text(config.wsId || document.body?.dataset.wsId || ''),
                contextPath: contextPath(), members: []
            } }));
            return [];
        }); }
    };

    document.addEventListener('DOMContentLoaded', function () {
        const workspaceList = document.getElementById('workspaceMemberList');
        const projectList = document.getElementById('projectMemberList');
        if (workspaceList) global.CommonMemberDataAdapter.refreshWorkspace();
        if (projectList) global.CommonMemberDataAdapter.refreshProject();
    });
})(window);
