(function (global) {
    'use strict';

    let openedUserId = '';
    let openedProfile = null;
    let openedContributions = null;
    let openedTasks = [];
    let openedActivities = [];
    let activeTaskFilter = 'ALL';
    let activeContributionType = 'NOTE';
    let activeProfileTab = 'TASKS';
    let groupEditPreviewObjectUrl = '';
    let groupImageSourceObjectUrl = '';
    let groupImageDraft = null;
    let groupProfileCropper = null;

    function mode() {
        const explicitMode = String(document.body?.dataset?.memberActivityMode || '').toUpperCase();
        if (explicitMode === 'GROUP' || explicitMode === 'PROJECT') return explicitMode;
        const shellMode = String(document.body?.dataset?.mainShellMode || '').toUpperCase();
        return shellMode === 'WORKSPACE' ? 'GROUP' : 'PROJECT';
    }

    function isProjectMode() {
        return mode() === 'PROJECT';
    }

    function config() {
        if (isProjectMode()) return global.PROJECT_MAIN_CONFIG || global.PROJECT_SETTINGS_CONFIG || {};
        return global.WORKSPACE_CONFIG || {
            wsId: document.body?.dataset?.wsId || '',
            contextPath: document.body?.dataset?.contextPath || '',
            currentUserId: Number(document.body?.dataset?.currentUserId || 0)
        };
    }

    function contextPath() {
        return String(config().contextPath || document.body?.dataset?.contextPath || '').replace(/\/+$/, '');
    }

    function projectId() {
        return String(config().projectId || config().projId || config().paramProjId || new URLSearchParams(location.search).get('projId') || '').trim();
    }

    function projectScope() {
        if (!isProjectMode()) return '';
        const configured = String(config().projectScope || document.body?.dataset?.projectScope || '').trim().toUpperCase();
        if (configured === 'PERSONAL' || configured === 'GROUP') return configured;
        if (config().isPersonalProject === true || String(config().isPersonalProject).toLowerCase() === 'true') return 'PERSONAL';
        return String(config().wsId || document.body?.dataset?.wsId || '').trim() ? 'GROUP' : 'PERSONAL';
    }

    function isPersonalProject() {
        return isProjectMode() && projectScope() === 'PERSONAL';
    }

    function workspaceId() {
        // 개인 프로젝트는 URL에 과거 wsId가 남아 있어도 그룹 context를 절대 사용하지 않는다.
        if (isPersonalProject()) return '';
        return String(config().wsId || document.body?.dataset?.wsId || new URLSearchParams(location.search).get('wsId') || '').trim();
    }

    function scopeId() {
        return isProjectMode() ? projectId() : workspaceId();
    }

    function value(data, camel, upper) {
        if (!data) return null;
        return data[camel] != null ? data[camel] : data[upper];
    }

    function resolvePath(path) {
        const raw = String(path || '').trim();
        if (!raw) return '';
        if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
        return contextPath() + (raw.startsWith('/') ? raw : '/' + raw);
    }

    function roleInfo(data) {
        if (!isProjectMode()) {
            if (String(value(data, 'isOwner', 'IS_OWNER') || '').toUpperCase() === 'Y') {
                return { text: '그룹장', cls: 'is-leader' };
            }
            const role = String(value(data, 'wsRole', 'WS_ROLE') || '').toUpperCase();
            if (role === 'ADMIN') return { text: '관리자', cls: 'is-admin' };
            return { text: '멤버', cls: '' };
        }
        if (String(value(data, 'isLeader', 'IS_LEADER') || '').toUpperCase() === 'Y') {
            return { text: '팀장', cls: 'is-leader' };
        }
        const role = String(value(data, 'projRole', 'PROJ_ROLE') || '').toUpperCase();
        if (role === 'ADMIN' || role === 'OWNER' || role === 'LEADER' || role === 'PM') {
            return { text: '관리자', cls: 'is-admin' };
        }
        return { text: '멤버', cls: '' };
    }

    function currentUserId() {
        return Number(config().currentUserId || config().loginUserId || document.body?.dataset?.currentUserId || document.body?.dataset?.userId || 0);
    }

    function isScopeManager() {
        if (isProjectMode()) return config().canManageProject === true || String(config().canManageProject).toLowerCase() === 'true';
        return config().isAdmin === true
            || String(config().isAdmin).toLowerCase() === 'true'
            || config().isOwner === true
            || String(config().isOwner).toLowerCase() === 'true'
            || String(document.body?.dataset?.workspaceAdmin || '').toLowerCase() === 'true'
            || String(document.body?.dataset?.workspaceOwner || '').toLowerCase() === 'true';
    }

    function isScopeMutationLocked() {
        const status = String(
            config().deleteStatus
            || config().workspaceStatus
            || document.body?.dataset?.scopeStatus
            || ''
        ).trim().toUpperCase();
        if (status === 'DELETE_PENDING') return true;
        return config().readOnlyProjectSettings === true
            || String(config().readOnlyProjectSettings).toLowerCase() === 'true';
    }

    function isProtectedTarget(data) {
        if (isProjectMode()) {
            return String(value(data, 'isLeader', 'IS_LEADER') || '').toUpperCase() === 'Y';
        }
        return String(value(data, 'isOwner', 'IS_OWNER') || '').toUpperCase() === 'Y';
    }

    function currentScopeRole(data) {
        if (isProjectMode()) {
            const role = String(value(data, 'projRole', 'PROJ_ROLE') || 'MEMBER').toUpperCase();
            return role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
        }
        const role = String(value(data, 'wsRole', 'WS_ROLE') || 'MEMBER').toUpperCase();
        return role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
    }

    function closeAdminMenu() {
        const menu = document.getElementById('memberActivityProfileAdminMenu');
        const button = document.getElementById('memberActivityProfileAdminMenuButton');
        if (menu) menu.hidden = true;
        if (button) button.setAttribute('aria-expanded', 'false');
    }

    function renderAdminActions(data) {
        const host = document.getElementById('memberActivityProfileAdminActions');
        const roleAction = document.getElementById('memberActivityProfileRoleAction');
        const removeAction = document.getElementById('memberActivityProfileRemoveAction');
        if (!host || !roleAction || !removeAction) return;

        const targetId = Number(openedUserId || 0);
        const visible = isScopeManager() && !isScopeMutationLocked() && targetId > 0 && targetId !== currentUserId() && !isProtectedTarget(data);
        host.hidden = !visible;
        closeAdminMenu();
        if (!visible) return;

        const currentRole = currentScopeRole(data);
        roleAction.dataset.nextRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
        roleAction.dataset.currentRole = currentRole;
        roleAction.textContent = roleLabel(roleAction.dataset.nextRole) + '로 변경';
        removeAction.textContent = isProjectMode() ? '프로젝트에서 내보내기' : '그룹에서 내보내기';
    }

    function roleLabel(role) {
        return String(role || '').toUpperCase() === 'ADMIN' ? '관리자' : '멤버';
    }

    function closeRoleChangeModal() {
        const modal = document.getElementById('memberActivityProfileRoleModal');
        if (modal) modal.hidden = true;
    }

    function openRoleChangeModal() {
        if (!openedProfile || !openedUserId || !isScopeManager() || isScopeMutationLocked() || isProtectedTarget(openedProfile)) return;
        const button = document.getElementById('memberActivityProfileRoleAction');
        const currentRole = button?.dataset?.currentRole || currentScopeRole(openedProfile);
        const nextRole = button?.dataset?.nextRole || (currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN');
        const name = String(value(openedProfile, 'displayName', 'DISPLAY_NAME') || '이 멤버').trim();
        closeAdminMenu();

        const modal = document.getElementById('memberActivityProfileRoleModal');
        const target = document.getElementById('memberActivityProfileRoleTarget');
        const current = document.getElementById('memberActivityProfileRoleCurrent');
        const next = document.getElementById('memberActivityProfileRoleNext');
        const description = document.getElementById('memberActivityProfileRoleDescription');
        const confirmButton = document.getElementById('memberActivityProfileRoleConfirm');
        if (!modal || !target || !current || !next || !description || !confirmButton) return;

        target.textContent = name + '님의 권한을 변경합니다.';
        current.textContent = roleLabel(currentRole);
        next.textContent = roleLabel(nextRole);
        description.textContent = nextRole === 'ADMIN'
            ? '관리자 권한이 추가됩니다.'
            : '관리자 권한이 제거되며 일반 멤버 권한으로 변경됩니다.';
        confirmButton.textContent = roleLabel(nextRole) + '로 변경';
        confirmButton.dataset.currentRole = currentRole;
        confirmButton.dataset.nextRole = nextRole;
        modal.hidden = false;
        confirmButton.focus();
    }

    async function changeManagedMemberRole() {
        if (!openedProfile || !openedUserId || !isScopeManager() || isScopeMutationLocked() || isProtectedTarget(openedProfile)) return;
        const confirmButton = document.getElementById('memberActivityProfileRoleConfirm');
        const currentRole = confirmButton?.dataset?.currentRole || currentScopeRole(openedProfile);
        const nextRole = confirmButton?.dataset?.nextRole || (currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN');
        closeRoleChangeModal();

        const body = new URLSearchParams();
        let url;
        if (isProjectMode()) {
            url = contextPath() + '/project/api/update-member-setting';
            body.append('projId', projectId());
            body.append('userId', openedUserId);
            body.append('projPosition', String(value(openedProfile, 'projPosition', 'PROJ_POSITION') || '').trim());
            body.append('projRole', nextRole);
        } else {
            url = contextPath() + '/workspace/api/update-member-role';
            body.append('wsId', workspaceId());
            body.append('userId', openedUserId);
            body.append('role', nextRole);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'same-origin',
                body: body.toString()
            });
            const result = (await response.text()).trim();
            const success = isProjectMode() ? result === 'SUCCESS' : result === 'success';
            if (!success) {
                if (result === 'NO_PERMISSION' || result === 'forbidden') throw new Error('NO_PERMISSION');
                if (result === 'LEADER_ROLE_LOCKED' || result === 'owner_role_locked') throw new Error('PROTECTED');
                throw new Error(result || 'FAIL');
            }
            alert('권한을 ' + roleLabel(nextRole) + '로 변경했습니다.');
            if (isProjectMode() && typeof global.refreshProjectMemberPanel === 'function') global.refreshProjectMemberPanel();
            open(openedUserId);
        } catch (error) {
            console.error('멤버 권한 변경 실패:', error);
            alert(error.message === 'NO_PERMISSION' ? '권한을 변경할 수 없습니다.' : '멤버 권한 변경에 실패했습니다.');
        }
    }

    async function removeManagedMember() {
        if (!openedProfile || !openedUserId || !isScopeManager() || isScopeMutationLocked() || isProtectedTarget(openedProfile)) return;
        const targetId = openedUserId;
        const name = String(value(openedProfile, 'displayName', 'DISPLAY_NAME') || '이 멤버').trim();
        const scopeName = isProjectMode() ? '프로젝트' : '그룹';
        closeAdminMenu();
        if (!global.confirm(name + '님을 ' + scopeName + '에서 내보낼까요?\n더 이상 멤버 전용 영역에 접근할 수 없습니다.')) return;

        const body = new URLSearchParams();
        const url = isProjectMode() ? contextPath() + '/project/api/remove-member' : contextPath() + '/workspace/api/remove-member';
        body.append(isProjectMode() ? 'projId' : 'wsId', scopeId());
        body.append('userId', targetId);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'same-origin',
                body: body.toString()
            });
            const result = (await response.text()).trim();
            const success = isProjectMode() ? result === 'SUCCESS' : result === 'success';
            if (!success) {
                if (result === 'NO_PERMISSION' || result === 'forbidden') throw new Error('NO_PERMISSION');
                if (result === 'CANNOT_REMOVE_LEADER' || result === 'owner_protected') throw new Error('PROTECTED');
                if (result === 'project_leader_transfer_required') throw new Error('TRANSFER_REQUIRED');
                throw new Error(result || 'FAIL');
            }
            alert(name + '님을 ' + scopeName + '에서 내보냈습니다.');
            close();
            if (isProjectMode() && typeof global.refreshProjectMemberPanel === 'function') {
                global.refreshProjectMemberPanel();
            } else {
                global.location.reload();
            }
        } catch (error) {
            console.error('멤버 내보내기 실패:', error);
            const message = error.message === 'NO_PERMISSION'
                ? '이 멤버를 내보낼 권한이 없습니다.'
                : (error.message === 'PROTECTED'
                    ? (isProjectMode() ? '팀장은 내보낼 수 없습니다.' : '그룹장은 내보낼 수 없습니다.')
                    : (error.message === 'TRANSFER_REQUIRED'
                        ? '진행 중인 그룹 프로젝트의 팀장은 먼저 다른 멤버에게 팀장을 위임해야 합니다.'
                        : '멤버 내보내기에 실패했습니다.'));
            alert(message);
        }
    }

    function renderAvatar(data) {
        const host = document.getElementById('memberActivityProfileAvatar');
        if (!host) return;
        host.innerHTML = '';

        const name = String(value(data, 'displayName', 'DISPLAY_NAME') || '사용자').trim();
        const src = resolvePath(value(data, 'profileImagePath', 'PROFILE_IMAGE_PATH'));
        if (src) {
            const img = document.createElement('img');
            img.alt = '';
            img.src = src;
            img.onload = function () { host.classList.add('has-image'); };
            img.onerror = function () {
                img.remove();
                host.classList.remove('has-image');
                host.textContent = name.substring(0, 1) || '?';
            };
            host.appendChild(img);
            return;
        }
        host.classList.remove('has-image');
        host.textContent = name.substring(0, 1) || '?';
    }

    function render(data) {
        openedProfile = data;
        const name = String(value(data, 'displayName', 'DISPLAY_NAME') || value(data, 'accountName', 'ACCOUNT_NAME') || '사용자').trim();
        const position = isProjectMode()
            ? String(value(data, 'projPosition', 'PROJ_POSITION') || '').trim()
            : String(value(data, 'positionName', 'POSITION_NAME') || '').trim();
        const joinedAt = isProjectMode()
            ? String(value(data, 'projJoinedAt', 'PROJ_JOINED_AT') || '').trim()
            : String(value(data, 'joinedAt', 'JOINED_AT') || '').trim();
        const currentUserId = Number(config().currentUserId || config().loginUserId || document.body?.dataset?.currentUserId || document.body?.dataset?.userId || 0);
        const canEdit = !isScopeMutationLocked() && (isProjectMode()
            ? Boolean(value(data, 'canEditProjectRole', 'CAN_EDIT_PROJECT_ROLE'))
            : (Number(openedUserId || 0) === currentUserId));
        const role = roleInfo(data);

        renderAvatar(data);
        document.getElementById('memberActivityProfileName').textContent = name;

        const roleEl = document.getElementById('memberActivityProfileRole');
        roleEl.textContent = role.text;
        roleEl.className = 'member-activity-profile__role' + (role.cls ? ' ' + role.cls : '');
        renderAdminActions(data);

        const positionEl = document.getElementById('memberActivityProfilePosition');
        positionEl.textContent = position || (isProjectMode() ? '담당 역할 미지정' : '직책 · 담당 미지정');
        positionEl.classList.toggle('is-empty', !position);

        const joinedEl = document.getElementById('memberActivityProfileJoinedAt');
        const joinedLabel = isProjectMode() ? '프로젝트 참여일' : '그룹 가입일';
        joinedEl.textContent = joinedAt ? joinedLabel + ' · ' + joinedAt : joinedLabel + ' 정보 없음';

        const editButton = document.getElementById('memberActivityProfileEditPositionButton');
        editButton.hidden = !canEdit;
        editButton.textContent = isProjectMode() ? '담당 역할 수정' : '프로필 수정';
        document.getElementById('memberActivityProfilePositionInput').value = position;
        document.getElementById('memberActivityProfilePositionForm').hidden = true;
        setGroupEditVisible(false);

        const kicker = document.querySelector('.member-activity-profile__kicker');
        if (kicker) kicker.textContent = isProjectMode() ? '프로젝트 프로필' : '그룹 프로필';
        const contentDesc = document.getElementById('memberActivityProfileContentDescription');
        if (contentDesc) contentDesc.textContent = isProjectMode()
            ? '이 프로젝트에서 작성하거나 업로드한 기록입니다.'
            : '이 그룹에서 작성하거나 업로드한 기록입니다.';
        const activityDesc = document.getElementById('memberActivityProfileActivityDescription');
        if (activityDesc) activityDesc.textContent = isProjectMode()
            ? '프로젝트 안에서의 최근 변경과 참여 기록입니다.'
            : '그룹 안에서의 최근 작성과 참여 기록입니다.';
    }


    function setProfileTab(tab) {
        const fallback = isProjectMode() ? 'TASKS' : 'CONTENT';
        const next = String(tab || fallback).toUpperCase();
        activeProfileTab = ['TASKS', 'CONTENT', 'ACTIVITY'].includes(next) ? next : fallback;
        if (!isProjectMode() && activeProfileTab === 'TASKS') activeProfileTab = 'CONTENT';

        document.querySelectorAll('[data-member-activity-tab]').forEach(function (button) {
            const active = button.dataset.memberActivityTab === activeProfileTab;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        document.querySelectorAll('[data-member-activity-panel]').forEach(function (panel) {
            const active = panel.dataset.memberActivityPanel === activeProfileTab;
            panel.classList.toggle('is-active', active);
            panel.hidden = !active;
        });
    }

    function taskNumber(summary, key) {
        const raw = summary && (summary[key] != null ? summary[key] : summary[key.toLowerCase()]);
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function safeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function taskStatusInfo(task) {
        const delayed = String(value(task, 'delayedYn', 'DELAYED_YN') || '').toUpperCase() === 'Y';
        if (delayed) return { text: '지연', cls: 'is-delayed moyo-task-status moyo-task-status--delayed' };
        const status = String(value(task, 'status', 'STATUS') || '').toUpperCase();
        if (status === 'IN_PROGRESS') return { text: '진행 중', cls: 'is-progress moyo-task-status moyo-task-status--progress' };
        if (status === 'DONE') return { text: '완료', cls: 'is-done moyo-task-status moyo-task-status--done' };
        return { text: '할 일', cls: 'is-todo moyo-task-status moyo-task-status--todo' };
    }

    function taskPeriod(task) {
        const start = String(value(task, 'startDate', 'START_DATE') || '').trim();
        const end = String(value(task, 'endDate', 'END_DATE') || '').trim();
        if (start && end) return start === end ? end : start + ' ~ ' + end;
        if (end) return '마감 ' + end;
        if (start) return '시작 ' + start;
        return '기간 미정';
    }

    function renderTaskSummary(summary) {
        const host = document.getElementById('memberActivityProfileTaskSummary');
        if (!host) return;
        const items = [
            ['ALL', '전체', taskNumber(summary, 'TOTAL'), 'moyo-task-status moyo-task-status--all'],
            ['TODO', '할 일', taskNumber(summary, 'TODO_CNT'), 'is-todo moyo-task-status moyo-task-status--todo'],
            ['IN_PROGRESS', '진행', taskNumber(summary, 'IN_PROGRESS_CNT'), 'is-progress moyo-task-status moyo-task-status--progress'],
            ['DONE', '완료', taskNumber(summary, 'DONE_CNT'), 'is-done moyo-task-status moyo-task-status--done'],
            ['DELAYED', '지연', taskNumber(summary, 'DELAYED_CNT'), 'is-delayed moyo-task-status moyo-task-status--delayed']
        ];
        host.innerHTML = items.map(function (item) {
            const active = activeTaskFilter === item[0];
            return '<button type="button" class="member-activity-profile__task-stat ' + item[3] + (active ? ' is-active' : '') + '"' +
                ' data-member-activity-task-filter="' + item[0] + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
                '<span>' + item[1] + '</span><strong>' + item[2] + '</strong></button>';
        }).join('');
    }

    function taskMatchesFilter(task) {
        if (activeTaskFilter === 'ALL') return true;
        if (activeTaskFilter === 'DELAYED') {
            return String(value(task, 'delayedYn', 'DELAYED_YN') || '').toUpperCase() === 'Y';
        }
        return String(value(task, 'status', 'STATUS') || '').toUpperCase() === activeTaskFilter;
    }

    function renderTaskList(tasks) {
        const host = document.getElementById('memberActivityProfileTaskList');
        if (!host) return;
        const source = Array.isArray(tasks) ? tasks : [];
        const list = source.filter(taskMatchesFilter);
        if (!list.length) {
            const label = ({TODO:'할 일', IN_PROGRESS:'진행 중', DONE:'완료', DELAYED:'지연'})[activeTaskFilter];
            host.innerHTML = '<div class="member-activity-profile__task-empty">' +
                (label ? label + ' 업무가 없습니다.' : '담당하고 있는 업무가 없습니다.') + '</div>';
            return;
        }

        host.innerHTML = list.map(function (task) {
            const status = taskStatusInfo(task);
            const taskId = value(task, 'taskId', 'TASK_ID');
            const title = safeHtml(value(task, 'title', 'TITLE') || '제목 없는 업무');
            const period = safeHtml(taskPeriod(task));
            return '<button type="button" class="member-activity-profile__task-item" data-member-activity-task-id="' + safeHtml(taskId) + '">' +
                '<span class="member-activity-profile__task-main"><strong>' + title + '</strong>' +
                '<span class="member-activity-profile__task-period">' + period + '</span></span>' +
                '<span class="member-activity-profile__task-status ' + status.cls + '">' + status.text + '</span>' +
                '</button>';
        }).join('');
    }

    function loadTasks(userId) {
        const section = document.getElementById('memberActivityProfileTasksSection');
        const summary = document.getElementById('memberActivityProfileTaskSummary');
        const list = document.getElementById('memberActivityProfileTaskList');
        if (!section || !summary || !list) return Promise.resolve();

        section.hidden = activeProfileTab !== 'TASKS';
        summary.innerHTML = '';
        list.innerHTML = '<div class="member-activity-profile__task-loading">담당 업무를 불러오는 중입니다.</div>';

        if (!isProjectMode()) return Promise.resolve();
        return fetch(contextPath() + '/project/api/member-profile/tasks?projId=' + encodeURIComponent(projectId())
            + '&userId=' + encodeURIComponent(userId), { credentials: 'same-origin' })
            .then(function (response) {
                if (!response.ok) throw new Error('TASK_LOAD_FAILED');
                return response.json();
            })
            .then(function (data) {
                if (openedUserId !== String(userId)) return;
                openedTasks = Array.isArray(data.tasks) ? data.tasks : [];
                activeTaskFilter = 'ALL';
                renderTaskSummary(data.summary || {});
                renderTaskList(openedTasks);
            })
            .catch(function (error) {
                console.error('프로젝트 담당 업무 로딩 실패:', error);
                summary.innerHTML = '';
                list.innerHTML = '<div class="member-activity-profile__task-empty is-error">담당 업무를 불러오지 못했습니다.</div>';
            });
    }


    function contributionCount(summary, key) {
        const raw = summary && (summary[key] != null ? summary[key] : summary[key.toLowerCase()]);
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatFileSize(bytes) {
        const size = Number(bytes || 0);
        if (!Number.isFinite(size) || size <= 0) return '';
        if (size < 1024) return size + ' B';
        if (size < 1024 * 1024) return (size / 1024).toFixed(size < 10 * 1024 ? 1 : 0) + ' KB';
        if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
        return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    function contributionRows(type) {
        if (!openedContributions) return [];
        if (type === 'PHOTO') return Array.isArray(openedContributions.photos) ? openedContributions.photos : [];
        if (type === 'FILE') return Array.isArray(openedContributions.files) ? openedContributions.files : [];
        return Array.isArray(openedContributions.notes) ? openedContributions.notes : [];
    }

    function renderContributionSummary(summary) {
        const host = document.getElementById('memberActivityProfileContributionSummary');
        if (!host) return;
        const items = [
            ['NOTE', '노트', 'fa-regular fa-note-sticky', contributionCount(summary, 'NOTE_CNT')],
            ['PHOTO', '사진', 'fa-regular fa-images', contributionCount(summary, 'PHOTO_CNT')],
            ['FILE', '파일', 'fa-regular fa-folder-open', contributionCount(summary, 'FILE_CNT')]
        ];
        host.innerHTML = items.map(function (item) {
            const active = activeContributionType === item[0];
            return '<button type="button" class="member-activity-profile__contribution-tab' + (active ? ' is-active' : '') + '"' +
                ' data-member-activity-contribution-type="' + item[0] + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
                '<span class="member-activity-profile__contribution-tab-label"><i class="' + item[2] + '" aria-hidden="true"></i><span>' + item[1] + '</span></span>' +
                '<strong>' + item[3] + '</strong></button>';
        }).join('');
    }

    function renderContributionList() {
        const host = document.getElementById('memberActivityProfileContributionList');
        if (!host) return;
        const rows = contributionRows(activeContributionType);
        if (!rows.length) {
            const scopeLabel = isProjectMode() ? '프로젝트' : '그룹';
            const copy = activeContributionType === 'PHOTO' ? '이 ' + scopeLabel + '에 올린 사진이 없습니다.'
                : (activeContributionType === 'FILE' ? '이 ' + scopeLabel + '에 올린 파일이 없습니다.' : '이 ' + scopeLabel + '에 작성한 노트가 없습니다.');
            host.innerHTML = '<div class="member-activity-profile__contribution-empty">' + copy + '</div>';
            return;
        }

        host.innerHTML = rows.map(function (item) {
            const activityAt = safeHtml(value(item, 'activityAt', 'ACTIVITY_AT') || '날짜 정보 없음');
            if (activeContributionType === 'PHOTO') {
                const postId = value(item, 'postId', 'POST_ID');
                const title = safeHtml(value(item, 'title', 'TITLE') || '사진');
                const count = Number(value(item, 'photoCount', 'PHOTO_COUNT') || 0);
                const coverPhotoId = value(item, 'coverPhotoId', 'COVER_PHOTO_ID');
                const fallbackCover = resolvePath(value(item, 'coverPath', 'COVER_PATH'));
                const cover = coverPhotoId
                    ? contextPath() + '/photo/media/' + encodeURIComponent(String(coverPhotoId))
                    : fallbackCover;
                const visual = cover
                    ? '<span class="member-activity-profile__contribution-thumb"><img src="' + safeHtml(cover) + '" alt="" loading="lazy" onerror="this.closest(\'.member-activity-profile__contribution-thumb\').classList.add(\'is-broken\');this.remove();"></span>'
                    : '<span class="member-activity-profile__contribution-icon is-photo" aria-hidden="true"><i class="fa-regular fa-image"></i></span>';
                return '<button type="button" class="member-activity-profile__contribution-item" data-member-activity-photo-id="' + safeHtml(postId) + '">' +
                    visual + '<span class="member-activity-profile__contribution-main"><strong>' + title + '</strong>' +
                    '<span>사진 ' + count + '장 · ' + activityAt + '</span></span></button>';
            }
            if (activeContributionType === 'FILE') {
                const fileId = value(item, 'contentFileId', 'CONTENT_FILE_ID');
                const title = safeHtml(value(item, 'title', 'TITLE') || '파일');
                const ext = String(value(item, 'fileExt', 'FILE_EXT') || '').replace(/^\./, '').toUpperCase();
                const size = formatFileSize(value(item, 'fileSize', 'FILE_SIZE'));
                const meta = [ext || 'FILE', size, activityAt].filter(Boolean).join(' · ');
                return '<button type="button" class="member-activity-profile__contribution-item" data-member-activity-file-id="' + safeHtml(fileId) + '">' +
                    '<span class="member-activity-profile__contribution-icon is-file" aria-hidden="true"><i class="fa-regular fa-folder-open"></i></span>' +
                    '<span class="member-activity-profile__contribution-main"><strong>' + title + '</strong><span>' + safeHtml(meta) + '</span></span></button>';
            }

            const noteId = value(item, 'noteId', 'NOTE_ID');
            const title = safeHtml(value(item, 'title', 'TITLE') || '제목 없는 노트');
            return '<button type="button" class="member-activity-profile__contribution-item" data-member-activity-note-id="' + safeHtml(noteId) + '">' +
                '<span class="member-activity-profile__contribution-icon is-note" aria-hidden="true"><i class="fa-regular fa-note-sticky"></i></span>' +
                '<span class="member-activity-profile__contribution-main"><strong>' + title + '</strong><span>' + activityAt + '</span></span></button>';
        }).join('');
    }

    function renderContributions(data) {
        openedContributions = data || {};
        const summary = openedContributions.summary || {};
        const noteCount = contributionCount(summary, 'NOTE_CNT');
        const photoCount = contributionCount(summary, 'PHOTO_CNT');
        const fileCount = contributionCount(summary, 'FILE_CNT');
        if (activeContributionType === 'NOTE' && noteCount === 0) {
            activeContributionType = photoCount > 0 ? 'PHOTO' : (fileCount > 0 ? 'FILE' : 'NOTE');
        } else if (activeContributionType === 'PHOTO' && photoCount === 0 && noteCount > 0) {
            activeContributionType = 'NOTE';
        } else if (activeContributionType === 'FILE' && fileCount === 0 && (noteCount > 0 || photoCount > 0)) {
            activeContributionType = noteCount > 0 ? 'NOTE' : 'PHOTO';
        }
        renderContributionSummary(summary);
        renderContributionList();
    }

    function loadContributions(userId) {
        const section = document.getElementById('memberActivityProfileContentSection');
        const summary = document.getElementById('memberActivityProfileContributionSummary');
        const list = document.getElementById('memberActivityProfileContributionList');
        if (!section || !summary || !list) return Promise.resolve();

        section.hidden = activeProfileTab !== 'CONTENT';
        openedContributions = null;
        activeContributionType = 'NOTE';
        summary.innerHTML = '';
        list.innerHTML = '<div class="member-activity-profile__contribution-loading">활동 콘텐츠를 불러오는 중입니다.</div>';

        const url = isProjectMode()
            ? contextPath() + '/project/api/member-profile/contributions?projId=' + encodeURIComponent(projectId()) + '&userId=' + encodeURIComponent(userId)
            : contextPath() + '/workspace/api/' + encodeURIComponent(workspaceId()) + '/members/' + encodeURIComponent(userId) + '/activity-profile/contributions';
        return fetch(url, { credentials: 'same-origin' })
            .then(function (response) {
                if (!response.ok) throw new Error('CONTRIBUTION_LOAD_FAILED');
                return response.json();
            })
            .then(function (data) {
                if (openedUserId !== String(userId)) return;
                renderContributions(data || {});
            })
            .catch(function (error) {
                console.error('멤버 활동 콘텐츠 로딩 실패:', error);
                summary.innerHTML = '';
                list.innerHTML = '<div class="member-activity-profile__contribution-empty is-error">활동 콘텐츠를 불러오지 못했습니다.</div>';
            });
    }


    function activityInfo(item) {
        const type = String(value(item, 'activityType', 'ACTIVITY_TYPE') || '').toUpperCase();
        const serverDetail = String(value(item, 'detail', 'DETAIL') || '').trim();
        const map = {
            TASK_CREATED: { icon: 'fa-regular fa-square-check', cls: 'is-task', detail: '업무 등록' },
            TASK_DONE: { icon: 'fa-regular fa-circle-check', cls: 'is-done', detail: '담당 업무 완료' },
            NOTE: { icon: 'fa-regular fa-note-sticky', cls: 'is-note', detail: '노트 작성' },
            PHOTO: { icon: 'fa-regular fa-images', cls: 'is-photo', detail: '사진 업로드' },
            FILE: { icon: 'fa-regular fa-folder-open', cls: 'is-file', detail: '파일 업로드' },
            NOTICE: { icon: 'fa-regular fa-bullhorn', cls: 'is-board', detail: '공지 작성' },
            BOARD: { icon: 'fa-regular fa-message', cls: 'is-board', detail: '게시글 작성' },
            PLAN: { icon: 'fa-regular fa-calendar-check', cls: 'is-plan', detail: '프로젝트 계획 작성' }
        };
        const info = map[type] || { icon: 'fa-regular fa-clock', cls: '', detail: '활동' };
        return { type: type, icon: info.icon, cls: info.cls, detail: serverDetail || info.detail };
    }

    function renderActivities(rows) {
        const host = document.getElementById('memberActivityProfileActivityList');
        if (!host) return;
        openedActivities = Array.isArray(rows) ? rows : [];
        if (!openedActivities.length) {
            host.innerHTML = '<div class="member-activity-profile__activity-empty">아직 표시할 프로젝트 활동이 없습니다.</div>';
            return;
        }

        host.innerHTML = openedActivities.map(function (item) {
            const info = activityInfo(item);
            const targetId = value(item, 'targetId', 'TARGET_ID');
            const title = safeHtml(value(item, 'title', 'TITLE') || '제목 없음');
            const at = safeHtml(value(item, 'activityAt', 'ACTIVITY_AT') || '날짜 정보 없음');
            const attrs = targetId != null ? ' data-member-activity-activity-type="' + safeHtml(info.type) + '" data-member-activity-activity-id="' + safeHtml(targetId) + '"' : '';
            const clickable = ['TASK_CREATED', 'TASK_DONE', 'NOTE', 'PHOTO', 'FILE'].includes(info.type);
            const tag = clickable ? 'button' : 'div';
            const typeAttr = clickable ? ' type="button"' : '';
            return '<' + tag + typeAttr + ' class="member-activity-profile__activity-item ' + info.cls + (clickable ? ' is-clickable' : '') + '"' + attrs + '>' +
                '<span class="member-activity-profile__activity-icon" aria-hidden="true"><i class="' + info.icon + '"></i></span>' +
                '<span class="member-activity-profile__activity-main"><strong>' + safeHtml(info.detail) + '</strong><span>' + title + '</span></span>' +
                '<time>' + at + '</time></' + tag + '>';
        }).join('');
    }

    function loadActivities(userId) {
        const section = document.getElementById('memberActivityProfileActivitySection');
        const list = document.getElementById('memberActivityProfileActivityList');
        if (!section || !list) return Promise.resolve();

        section.hidden = activeProfileTab !== 'ACTIVITY';
        openedActivities = [];
        list.innerHTML = '<div class="member-activity-profile__activity-loading">최근 활동을 불러오는 중입니다.</div>';

        const url = isProjectMode()
            ? contextPath() + '/project/api/member-profile/activities?projId=' + encodeURIComponent(projectId()) + '&userId=' + encodeURIComponent(userId)
            : contextPath() + '/workspace/api/' + encodeURIComponent(workspaceId()) + '/members/' + encodeURIComponent(userId) + '/activity-profile/activities';
        return fetch(url, { credentials: 'same-origin' })
            .then(function (response) {
                if (!response.ok) throw new Error('ACTIVITY_LOAD_FAILED');
                return response.json();
            })
            .then(function (data) {
                if (openedUserId !== String(userId)) return;
                renderActivities(data);
            })
            .catch(function (error) {
                console.error('멤버 최근 활동 로딩 실패:', error);
                list.innerHTML = '<div class="member-activity-profile__activity-empty is-error">최근 활동을 불러오지 못했습니다.</div>';
            });
    }

    function openContributionNote(noteId) {
        if (!noteId) return;
        if (global.MoyoNoteModal && typeof global.MoyoNoteModal.open === 'function') {
            global.MoyoNoteModal.open({
                noteId: Number(noteId),
                scopeType: isProjectMode() ? 'PROJECT' : 'WORKSPACE',
                scopeId: Number(scopeId()),
                wsId: isProjectMode() ? (isPersonalProject() ? null : (workspaceId() || null)) : Number(workspaceId()),
                projId: isProjectMode() ? Number(projectId()) : null
            });
            return;
        }
        const query = new URLSearchParams();
        query.set('scope', isProjectMode() ? 'PROJ' : 'WS');
        if (isProjectMode()) {
            query.set('projId', projectId());
            if (!isPersonalProject() && workspaceId()) query.set('wsId', workspaceId());
        } else {
            query.set('wsId', workspaceId());
        }
        query.set('noteId', noteId);
        global.location.href = contextPath() + '/note/detail?' + query.toString();
    }

    function openContributionPhoto(postId) {
        if (!postId) return;
        if (global.MoyoPhotoPostDetail && typeof global.MoyoPhotoPostDetail.open === 'function') {
            global.MoyoPhotoPostDetail.open(Number(postId));
            return;
        }
        const query = new URLSearchParams();
        query.set('scopeType', isProjectMode() ? 'PROJECT' : 'WORKSPACE');
        query.set('scopeId', scopeId());
        query.set('postId', postId);
        global.location.href = contextPath() + '/photo-album?' + query.toString();
    }

    function setVisible(visible) {
        const root = document.getElementById('memberActivityProfileComponent');
        if (!root) return;
        root.hidden = !visible;
        document.body.classList.toggle('member-activity-profile-open', visible);
        if (!visible) {
            openedUserId = '';
            openedProfile = null;
            openedContributions = null;
            activeContributionType = 'NOTE';
            activeProfileTab = 'TASKS';
        }
    }

    function open(userId) {
        const id = String(userId || '').trim();
        const sid = scopeId();
        if (!id || !sid) return;

        const loading = document.getElementById('memberActivityProfileLoading');
        const content = document.getElementById('memberActivityProfileContent');
        if (!loading || !content) return;

        openedUserId = id;
        openedTasks = [];
        activeTaskFilter = 'ALL';
        activeProfileTab = isProjectMode() ? 'TASKS' : 'CONTENT';
        const taskTab = document.querySelector('[data-member-activity-tab="TASKS"]');
        if (taskTab) taskTab.hidden = !isProjectMode();
        setProfileTab(activeProfileTab);
        loading.textContent = (isProjectMode() ? '프로젝트' : '그룹') + ' 프로필을 불러오는 중입니다.';
        loading.hidden = false;
        content.hidden = true;
        setVisible(true);

        const profileUrl = isProjectMode()
            ? contextPath() + '/project/api/member-profile?projId=' + encodeURIComponent(projectId()) + '&userId=' + encodeURIComponent(id)
            : contextPath() + '/workspace/api/' + encodeURIComponent(workspaceId()) + '/members/' + encodeURIComponent(id) + '/profile';
        fetch(profileUrl, { credentials: 'same-origin' })
            .then(function (response) {
                if (response.status === 401) throw new Error('LOGIN_REQUIRED');
                if (response.status === 403) throw new Error('FORBIDDEN');
                if (response.status === 404) throw new Error('NOT_FOUND');
                if (!response.ok) throw new Error('LOAD_FAILED');
                return response.json();
            })
            .then(function (data) {
                if (openedUserId !== id) return;
                render(data);
                loading.hidden = true;
                content.hidden = false;
                setProfileTab(activeProfileTab);
                if (isProjectMode()) loadTasks(id);
                loadContributions(id);
                loadActivities(id);
            })
            .catch(function (error) {
                console.error('멤버 활동 프로필 로딩 실패:', error);
                loading.textContent = error.message === 'LOGIN_REQUIRED'
                    ? '로그인이 필요합니다.'
                    : (error.message === 'FORBIDDEN'
                        ? '이 멤버 프로필을 볼 권한이 없습니다.'
                        : '멤버 프로필을 불러오지 못했습니다.');
            });
    }

    function close() {
        closeRoleChangeModal();
        closeAdminMenu();
        closeGroupImageEditor();
        setVisible(false);
    }

    function formatGroupBirthText(data) {
        const raw = String(value(data, 'birthDate', 'BIRTH_DATE') || '').trim();
        if (!raw) return '등록된 생일 없음';
        const matched = raw.match(/^(\d{1,2})-(\d{1,2})$/);
        const dateText = matched
            ? String(Number(matched[1])).padStart(2, '0') + '월 ' + String(Number(matched[2])).padStart(2, '0') + '일'
            : raw;
        const calendar = String(value(data, 'birthCalendarType', 'BIRTH_CALENDAR_TYPE') || 'SOLAR').toUpperCase() === 'LUNAR' ? '음력' : '양력';
        return dateText + ' · ' + calendar;
    }

    function ensureGroupProfileCropper() {
        if (groupProfileCropper || isProjectMode()) return groupProfileCropper;
        if (typeof global.createProfileCropper !== 'function') {
            console.warn('프로필 이미지 조정기를 불러오지 못했습니다.');
            return null;
        }
        groupProfileCropper = global.createProfileCropper({
            fileInputId: 'memberActivityProfileImage',
            viewportId: 'memberActivityProfileCropViewport',
            imageId: 'memberActivityProfileCropImage',
            placeholderId: 'memberActivityProfileCropPlaceholder',
            zoomId: 'memberActivityProfileCropZoom'
        });
        groupProfileCropper.setOnChange(function () {
            const file = groupProfileCropper.getOriginalFile();
            const fileName = document.getElementById('memberActivityProfileImageFileName');
            if (fileName) {
                fileName.textContent = groupProfileCropper.isRemoveRequested()
                    ? '기본 아바타 사용'
                    : (file ? file.name : '현재 그룹 프로필 이미지');
            }
        });
        return groupProfileCropper;
    }

    function revokeGroupPreviewUrl() {
        if (groupEditPreviewObjectUrl) {
            URL.revokeObjectURL(groupEditPreviewObjectUrl);
            groupEditPreviewObjectUrl = '';
        }
    }

    function revokeGroupSourceUrl() {
        if (groupImageSourceObjectUrl) {
            URL.revokeObjectURL(groupImageSourceObjectUrl);
            groupImageSourceObjectUrl = '';
        }
    }

    function setSummaryAvatarPreview(src, fallbackText) {
        const host = document.getElementById('memberActivityProfileAvatar');
        if (!host) return;
        host.innerHTML = '';
        host.classList.remove('has-image');
        if (src) {
            const img = document.createElement('img');
            img.alt = '';
            img.src = src;
            img.onload = function () { host.classList.add('has-image'); };
            img.onerror = function () {
                img.remove();
                host.textContent = String(fallbackText || '?').substring(0, 1) || '?';
            };
            host.appendChild(img);
            return;
        }
        host.textContent = String(fallbackText || '?').substring(0, 1) || '?';
    }

    function currentGroupFallbackName() {
        return document.getElementById('memberActivityProfileDisplayName')?.value.trim()
            || String(value(openedProfile, 'displayName', 'DISPLAY_NAME') || value(openedProfile, 'accountName', 'ACCOUNT_NAME') || '사용자').trim();
    }

    function currentCustomImageSource() {
        if (groupImageDraft?.originalFile) {
            revokeGroupSourceUrl();
            groupImageSourceObjectUrl = URL.createObjectURL(groupImageDraft.originalFile);
            return groupImageSourceObjectUrl;
        }
        if (groupImageDraft?.sourceUrl) return groupImageDraft.sourceUrl;
        return resolvePath(value(openedProfile, 'customProfileImageOriginalPath', 'CUSTOM_PROFILE_IMAGE_ORIGINAL_PATH'))
            || resolvePath(value(openedProfile, 'customProfileImagePath', 'CUSTOM_PROFILE_IMAGE_PATH'))
            || '';
    }

    function resetCropperSession(cropper, src, state, fallbackText) {
        if (!cropper) return;
        cropper.setFallbackText(String(fallbackText || '?').substring(0, 1) || '?');
        // 로컬 파일 선택 상태를 안전하게 비우기 위해 account 모드를 잠깐 거친 뒤 custom으로 복원한다.
        cropper.setMode('account', String(fallbackText || '?').substring(0, 1) || '?');
        cropper.setExistingImage('', { scale: 1, x: 0, y: 0 });
        cropper.setMode('custom', String(fallbackText || '?').substring(0, 1) || '?');
        if (groupImageDraft?.removeRequested) {
            cropper.resetToDefault();
            return;
        }
        cropper.setExistingImage(src, state || { scale: 1, x: 0, y: 0 });
    }

    function openGroupImageEditor() {
        if (isProjectMode() || document.getElementById('memberActivityProfileUseAccount')?.checked) return;
        const editor = document.getElementById('memberActivityProfileImageEditor');
        const cropper = ensureGroupProfileCropper();
        if (!editor || !cropper) return;
        editor.hidden = false;
        document.body.classList.add('member-activity-profile-image-editor-open');
        requestAnimationFrame(function () {
            const fallback = currentGroupFallbackName();
            const src = currentCustomImageSource();
            const state = groupImageDraft?.state || (src ? groupCustomCropState(openedProfile) : { scale: 1, x: 0, y: 0 });
            resetCropperSession(cropper, src, state, fallback);
        });
    }

    function closeGroupImageEditor() {
        const editor = document.getElementById('memberActivityProfileImageEditor');
        if (editor) editor.hidden = true;
        document.body.classList.remove('member-activity-profile-image-editor-open');
    }

    async function applyGroupImageEditor() {
        const cropper = ensureGroupProfileCropper();
        if (!cropper) return;
        const removeRequested = cropper.isRemoveRequested();
        const originalFile = removeRequested ? null : cropper.getOriginalFile();
        const state = cropper.getState();
        const blob = removeRequested ? null : await cropper.getBlob();
        groupImageDraft = {
            removeRequested: removeRequested,
            originalFile: originalFile || groupImageDraft?.originalFile || null,
            state: state,
            blob: blob,
            sourceUrl: originalFile ? '' : currentCustomImageSource()
        };

        revokeGroupPreviewUrl();
        const fallback = currentGroupFallbackName();
        if (removeRequested || !blob) {
            setSummaryAvatarPreview('', fallback);
        } else {
            groupEditPreviewObjectUrl = URL.createObjectURL(blob);
            setSummaryAvatarPreview(groupEditPreviewObjectUrl, fallback);
        }
        closeGroupImageEditor();
    }

    function syncGroupAvatarPreview() {
        if (!openedProfile || isProjectMode()) return;
        const useAccount = document.getElementById('memberActivityProfileUseAccount')?.checked;
        const fallback = currentGroupFallbackName();
        if (useAccount) {
            revokeGroupPreviewUrl();
            const accountImage = resolvePath(value(openedProfile, 'accountProfileImagePath', 'ACCOUNT_PROFILE_IMAGE_PATH'))
                || resolvePath(value(openedProfile, 'profileImagePath', 'PROFILE_IMAGE_PATH'));
            setSummaryAvatarPreview(accountImage, fallback);
            return;
        }
        if (groupEditPreviewObjectUrl) {
            setSummaryAvatarPreview(groupEditPreviewObjectUrl, fallback);
            return;
        }
        if (groupImageDraft?.removeRequested) {
            setSummaryAvatarPreview('', fallback);
            return;
        }
        const customImage = resolvePath(value(openedProfile, 'customProfileImagePath', 'CUSTOM_PROFILE_IMAGE_PATH'))
            || resolvePath(value(openedProfile, 'profileImagePath', 'PROFILE_IMAGE_PATH'));
        setSummaryAvatarPreview(customImage, fallback);
    }

    function groupCustomCropState(data) {
        return {
            scale: Number(value(data, 'customProfileImageCropScale', 'CUSTOM_PROFILE_IMAGE_CROP_SCALE') || 1),
            x: Number(value(data, 'customProfileImageCropX', 'CUSTOM_PROFILE_IMAGE_CROP_X') || 0),
            y: Number(value(data, 'customProfileImageCropY', 'CUSTOM_PROFILE_IMAGE_CROP_Y') || 0)
        };
    }

    function updateGroupImageFileName() {
        const image = document.getElementById('memberActivityProfileImage');
        const fileName = document.getElementById('memberActivityProfileImageFileName');
        if (image?.files?.[0] && fileName) fileName.textContent = image.files[0].name;
    }

    function resetGroupProfileImage() {
        const cropper = ensureGroupProfileCropper();
        if (!cropper || document.getElementById('memberActivityProfileUseAccount')?.checked) return;
        const name = document.getElementById('memberActivityProfileDisplayName')?.value.trim() || '사용자';
        cropper.setFallbackText(name.substring(0, 1) || '?');
        cropper.resetToDefault();
    }

    function fillGroupEditForm() {
        if (!openedProfile) return;
        const useAccount = String(value(openedProfile, 'useAccountProfile', 'USE_ACCOUNT_PROFILE') || 'Y').toUpperCase() !== 'N';
        const accountName = String(value(openedProfile, 'accountName', 'ACCOUNT_NAME') || '').trim();
        const customName = String(value(openedProfile, 'customDisplayName', 'CUSTOM_DISPLAY_NAME') || '').trim();
        const accountEmail = String(value(openedProfile, 'accountEmail', 'ACCOUNT_EMAIL') || '').trim();
        const customEmail = String(value(openedProfile, 'customContactEmail', 'CUSTOM_CONTACT_EMAIL') || '').trim();

        document.getElementById('memberActivityProfileUseAccount').checked = useAccount;
        document.getElementById('memberActivityProfileDisplayName').value = customName || accountName;
        document.getElementById('memberActivityProfileGroupPosition').value = String(value(openedProfile, 'positionName', 'POSITION_NAME') || '').trim();
        document.getElementById('memberActivityProfileIntro').value = String(value(openedProfile, 'introText', 'INTRO_TEXT') || '').trim();
        document.getElementById('memberActivityProfileEmail').value = customEmail || accountEmail || String(value(openedProfile, 'email', 'EMAIL') || '').trim();
        document.getElementById('memberActivityProfilePhone').value = String(value(openedProfile, 'phoneNumber', 'PHONE_NUMBER') || '').trim();
        document.getElementById('memberActivityProfileShowEmail').checked = String(value(openedProfile, 'showEmail', 'SHOW_EMAIL') || 'Y').toUpperCase() !== 'N';
        document.getElementById('memberActivityProfileShowPhone').checked = String(value(openedProfile, 'showPhone', 'SHOW_PHONE') || 'Y').toUpperCase() !== 'N';
        document.getElementById('memberActivityProfileShowBirth').checked = String(value(openedProfile, 'showBirth', 'SHOW_BIRTH') || 'Y').toUpperCase() !== 'N';
        document.getElementById('memberActivityProfileBirthText').textContent = formatGroupBirthText(openedProfile);
        groupImageDraft = null;
        revokeGroupPreviewUrl();
        revokeGroupSourceUrl();
        document.getElementById('memberActivityProfileImage').value = '';
        document.getElementById('memberActivityProfileImageFileName').textContent = '현재 그룹 프로필 이미지';
        syncGroupEditModeInputs();
    }

    function syncGroupEditModeInputs() {
        const useAccount = document.getElementById('memberActivityProfileUseAccount');
        const displayName = document.getElementById('memberActivityProfileDisplayName');
        const image = document.getElementById('memberActivityProfileImage');
        const imageSelect = document.getElementById('memberActivityProfileImageSelectButton');
        const removeButton = document.getElementById('memberActivityProfileRemoveImageButton');
        if (!useAccount) return;
        if (displayName && openedProfile) {
            const accountName = String(value(openedProfile, 'accountName', 'ACCOUNT_NAME') || '').trim();
            const customName = String(value(openedProfile, 'customDisplayName', 'CUSTOM_DISPLAY_NAME') || '').trim();
            if (useAccount.checked && accountName) displayName.value = accountName;
            else if (!useAccount.checked) displayName.value = customName || accountName || displayName.value;
        }
        if (displayName) displayName.disabled = useAccount.checked;
        if (image) image.disabled = useAccount.checked;
        if (imageSelect) imageSelect.disabled = useAccount.checked;
        if (removeButton) removeButton.disabled = useAccount.checked;
        syncGroupAvatarPreview();
    }

    function setGroupEditVisible(visible) {
        const form = document.getElementById('memberActivityProfileGroupEditForm');
        const summary = document.querySelector('.member-activity-profile__summary');
        const tabs = document.querySelector('.member-activity-profile__tabs');
        const panels = document.querySelector('.member-activity-profile__panels');
        if (form) form.hidden = !visible;
        if (summary) summary.classList.toggle('is-group-editing', visible);
        document.querySelectorAll('[data-group-inline-edit]').forEach(function (element) {
            element.hidden = !visible;
        });
        if (tabs) tabs.hidden = visible;
        if (panels) panels.hidden = visible;
        if (!visible) closeGroupImageEditor();
        const editButton = document.getElementById('memberActivityProfileEditPositionButton');
        if (editButton && !isProjectMode()) editButton.hidden = visible || isScopeMutationLocked() || !(Number(openedUserId || 0) === Number(config().currentUserId || config().loginUserId || document.body?.dataset?.currentUserId || document.body?.dataset?.userId || 0));
    }

    function startPositionEdit() {
        if (!openedProfile || isScopeMutationLocked()) return;
        if (!isProjectMode()) {
            fillGroupEditForm();
            setGroupEditVisible(true);
            requestAnimationFrame(function () {
                const first = document.getElementById('memberActivityProfileDisplayName');
                if (first) first.focus();
            });
            return;
        }
        const form = document.getElementById('memberActivityProfilePositionForm');
        const input = document.getElementById('memberActivityProfilePositionInput');
        form.hidden = false;
        input.value = String(value(openedProfile, 'projPosition', 'PROJ_POSITION') || '').trim();
        requestAnimationFrame(function () { input.focus(); });
    }

    function cancelGroupEdit() {
        if (openedProfile) render(openedProfile);
        else setGroupEditVisible(false);
    }

    async function saveGroupProfile(event) {
        event.preventDefault();
        if (isProjectMode() || !openedUserId || !workspaceId() || isScopeMutationLocked()) return;

        const currentUserId = Number(config().currentUserId || document.body?.dataset?.currentUserId || 0);
        if (Number(openedUserId) !== currentUserId) return;

        const form = event.currentTarget;
        const saveButton = form.querySelector('.member-activity-profile__save');
        const originalText = saveButton ? saveButton.textContent : '저장';
        if (saveButton) { saveButton.disabled = true; saveButton.textContent = '저장 중'; }

        const useAccount = document.getElementById('memberActivityProfileUseAccount').checked;
        const displayName = document.getElementById('memberActivityProfileDisplayName').value.trim();
        const contactEmail = document.getElementById('memberActivityProfileEmail').value.trim();
        if (!useAccount && !displayName) {
            alert('그룹 표시 이름을 입력해 주세요.');
            if (saveButton) { saveButton.disabled = false; saveButton.textContent = originalText; }
            return;
        }
        if (!contactEmail) {
            alert('연락 이메일을 입력해 주세요.');
            if (saveButton) { saveButton.disabled = false; saveButton.textContent = originalText; }
            return;
        }

        const body = new FormData();
        body.append('useAccountProfile', useAccount ? 'Y' : 'N');
        body.append('displayName', displayName);
        body.append('contactEmail', contactEmail);
        body.append('introText', document.getElementById('memberActivityProfileIntro').value.trim());
        body.append('positionName', document.getElementById('memberActivityProfileGroupPosition').value.trim());
        body.append('phoneNumber', document.getElementById('memberActivityProfilePhone').value.trim());
        body.append('showEmail', document.getElementById('memberActivityProfileShowEmail').checked ? 'Y' : 'N');
        body.append('showPhone', document.getElementById('memberActivityProfileShowPhone').checked ? 'Y' : 'N');
        body.append('showBirth', document.getElementById('memberActivityProfileShowBirth').checked ? 'Y' : 'N');

        if (!useAccount && groupImageDraft) {
            const removeProfileImage = Boolean(groupImageDraft.removeRequested);
            const cropState = groupImageDraft.state || { scale: 1, x: 0, y: 0 };
            body.append('removeProfileImage', removeProfileImage ? 'Y' : 'N');
            if (!removeProfileImage && groupImageDraft.blob) {
                body.append('profileImage', groupImageDraft.blob, 'workspace_profile.png');
            }
            if (!removeProfileImage && groupImageDraft.originalFile) {
                body.append('profileImageOriginal', groupImageDraft.originalFile, groupImageDraft.originalFile.name);
            }
            body.append('profileImageCropScale', String(cropState.scale));
            body.append('profileImageCropX', String(cropState.x));
            body.append('profileImageCropY', String(cropState.y));
        }

        fetch(contextPath() + '/workspace/api/' + encodeURIComponent(workspaceId()) + '/members/me/profile', {
            method: 'POST',
            credentials: 'same-origin',
            body: body
        }).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (payload) {
                if (!response.ok || payload.success === false) throw new Error(payload.message || 'SAVE_FAILED');
                return payload;
            });
        }).then(function () {
            setGroupEditVisible(false);
            return fetch(contextPath() + '/workspace/api/' + encodeURIComponent(workspaceId()) + '/members/' + encodeURIComponent(openedUserId) + '/profile', { credentials: 'same-origin' });
        }).then(function (response) {
            if (!response.ok) throw new Error('RELOAD_FAILED');
            return response.json();
        }).then(function (data) {
            openedProfile = data;
            render(data);
            if (typeof global.refreshWorkspaceMemberPanel === 'function') global.refreshWorkspaceMemberPanel();
            if (typeof global.loadWorkspaceMembers === 'function') global.loadWorkspaceMembers();
        }).catch(function (error) {
            console.error('그룹 프로필 저장 실패:', error);
            alert(error.message && !['SAVE_FAILED', 'RELOAD_FAILED'].includes(error.message) ? error.message : '프로필 저장에 실패했습니다.');
        }).finally(function () {
            if (saveButton) { saveButton.disabled = false; saveButton.textContent = originalText; }
        });
    }

    function cancelPositionEdit() {
        const form = document.getElementById('memberActivityProfilePositionForm');
        if (form) form.hidden = true;
    }

    function savePosition(event) {
        event.preventDefault();
        if (!isProjectMode() || !openedUserId || !projectId()) return;
        const input = document.getElementById('memberActivityProfilePositionInput');
        const saveButton = event.currentTarget.querySelector('.member-activity-profile__save');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = '저장 중';

        const params = new URLSearchParams();
        params.append('projId', projectId());
        params.append('userId', openedUserId);
        params.append('projPosition', input.value.trim());

        fetch(contextPath() + '/project/api/member-profile/position', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: params.toString()
        }).then(function (response) { return response.text(); })
          .then(function (result) {
              if (result !== 'SUCCESS') throw new Error(result || 'SAVE_FAILED');
              if (openedProfile) {
                  openedProfile.projPosition = input.value.trim();
                  openedProfile.PROJ_POSITION = input.value.trim();
                  render(openedProfile);
              }
              if (typeof global.refreshProjectMemberPanel === 'function') {
                  global.refreshProjectMemberPanel();
              }
          })
          .catch(function (error) {
              console.error('프로젝트 담당 역할 저장 실패:', error);
              alert(error.message === 'NO_PERMISSION'
                  ? '내 프로젝트 담당 역할만 수정할 수 있습니다.'
                  : '담당 역할 저장에 실패했습니다.');
          })
          .finally(function () {
              saveButton.disabled = false;
              saveButton.textContent = originalText;
          });
    }

    function bind() {
        document.querySelectorAll('[data-member-activity-close]').forEach(function (element) {
            if (element.dataset.boundMemberActivityClose) return;
            element.addEventListener('click', close);
            element.dataset.boundMemberActivityClose = 'Y';
        });
        document.getElementById('memberActivityProfileAdminMenuButton')?.addEventListener('click', function (event) {
            event.stopPropagation();
            const menu = document.getElementById('memberActivityProfileAdminMenu');
            if (!menu) return;
            menu.hidden = !menu.hidden;
            this.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
        });
        document.getElementById('memberActivityProfileRoleAction')?.addEventListener('click', openRoleChangeModal);
        document.getElementById('memberActivityProfileRoleConfirm')?.addEventListener('click', changeManagedMemberRole);
        document.querySelectorAll('[data-member-role-modal-close]').forEach(function (element) {
            element.addEventListener('click', closeRoleChangeModal);
        });
        document.getElementById('memberActivityProfileRemoveAction')?.addEventListener('click', removeManagedMember);
        document.addEventListener('click', function (event) {
            if (!event.target.closest('#memberActivityProfileAdminActions')) closeAdminMenu();
        });
        document.getElementById('memberActivityProfileEditPositionButton')?.addEventListener('click', startPositionEdit);
        document.getElementById('memberActivityProfilePositionCancel')?.addEventListener('click', cancelPositionEdit);
        document.getElementById('memberActivityProfilePositionForm')?.addEventListener('submit', savePosition);
        document.getElementById('memberActivityProfileGroupEditForm')?.addEventListener('submit', saveGroupProfile);
        document.getElementById('memberActivityProfileGroupEditCancel')?.addEventListener('click', cancelGroupEdit);
        document.getElementById('memberActivityProfileUseAccount')?.addEventListener('change', syncGroupEditModeInputs);
        document.getElementById('memberActivityProfileImage')?.addEventListener('change', updateGroupImageFileName);
        document.getElementById('memberActivityProfileDisplayName')?.addEventListener('input', function () {
            const cropper = ensureGroupProfileCropper();
            const name = this.value.trim() || '사용자';
            if (cropper) cropper.setFallbackText(name.substring(0, 1) || '?');
            syncGroupAvatarPreview();
        });
        document.getElementById('memberActivityProfileImageSelectButton')?.addEventListener('click', function () {
            if (this.disabled) return;
            openGroupImageEditor();
        });
        document.getElementById('memberActivityProfileImageFileSelectButton')?.addEventListener('click', function () {
            document.getElementById('memberActivityProfileImage')?.click();
        });
        document.getElementById('memberActivityProfileRemoveImageButton')?.addEventListener('click', resetGroupProfileImage);
        document.getElementById('memberActivityProfileImageEditorApply')?.addEventListener('click', applyGroupImageEditor);
        document.getElementById('memberActivityProfileImageEditorCancel')?.addEventListener('click', closeGroupImageEditor);
        document.querySelectorAll('[data-group-image-editor-close]').forEach(function (element) {
            element.addEventListener('click', closeGroupImageEditor);
        });
        document.querySelectorAll('[data-member-activity-tab]').forEach(function (button) {
            button.addEventListener('click', function () {
                if (button.hidden) return;
                setProfileTab(button.dataset.memberActivityTab);
                if (button.dataset.memberActivityTab === 'ACTIVITY' && openedUserId && !openedActivities.length) {
                    loadActivities(openedUserId);
                }
            });
        });
        document.getElementById('memberActivityProfileTaskSummary')?.addEventListener('click', function (event) {
            const button = event.target.closest('[data-member-activity-task-filter]');
            if (!button) return;
            const next = String(button.dataset.memberActivityTaskFilter || 'ALL').toUpperCase();
            activeTaskFilter = ['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'DELAYED'].includes(next) ? next : 'ALL';
            const summary = {};
            // 기존 서버 카운트 대신 현재 버튼의 숫자를 유지하기 위해 DOM은 active 상태만 갱신한다.
            document.querySelectorAll('[data-member-activity-task-filter]').forEach(function (item) {
                const active = item.dataset.memberActivityTaskFilter === activeTaskFilter;
                item.classList.toggle('is-active', active);
                item.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            renderTaskList(openedTasks);
        });
        document.getElementById('memberActivityProfileTaskList')?.addEventListener('click', function (event) {
            const button = event.target.closest('[data-member-activity-task-id]');
            if (!button) return;
            const taskId = button.dataset.memberActivityTaskId;
            if (taskId && typeof global.openProjectTaskDetail === 'function') {
                close();
                global.openProjectTaskDetail(taskId);
            }
        });
        document.getElementById('memberActivityProfileContributionSummary')?.addEventListener('click', function (event) {
            const button = event.target.closest('[data-member-activity-contribution-type]');
            if (!button || !openedContributions) return;
            activeContributionType = button.dataset.memberActivityContributionType || 'NOTE';
            renderContributionSummary(openedContributions.summary || {});
            renderContributionList();
        });
        document.getElementById('memberActivityProfileContributionList')?.addEventListener('click', function (event) {
            const note = event.target.closest('[data-member-activity-note-id]');
            if (note) {
                close();
                openContributionNote(note.dataset.memberActivityNoteId);
                return;
            }
            const photo = event.target.closest('[data-member-activity-photo-id]');
            if (photo) {
                close();
                openContributionPhoto(photo.dataset.memberActivityPhotoId);
                return;
            }
            const file = event.target.closest('[data-member-activity-file-id]');
            if (file) {
                const fileId = file.dataset.memberActivityFileId;
                if (fileId) global.location.href = contextPath() + '/api/files/' + encodeURIComponent(fileId) + '/download';
            }
        });
        document.getElementById('memberActivityProfileActivityList')?.addEventListener('click', function (event) {
            const item = event.target.closest('[data-member-activity-activity-type][data-member-activity-activity-id]');
            if (!item) return;
            const type = String(item.dataset.memberActivityActivityType || '').toUpperCase();
            const targetId = item.dataset.memberActivityActivityId;
            if (!targetId) return;
            if (type === 'TASK_CREATED' || type === 'TASK_DONE') {
                if (typeof global.openProjectTaskDetail === 'function') {
                    close();
                    global.openProjectTaskDetail(targetId);
                }
                return;
            }
            if (type === 'NOTE') {
                close();
                openContributionNote(targetId);
                return;
            }
            if (type === 'PHOTO') {
                close();
                openContributionPhoto(targetId);
                return;
            }
            if (type === 'FILE') {
                global.location.href = contextPath() + '/api/files/' + encodeURIComponent(targetId) + '/download';
            }
        });
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape' || document.getElementById('memberActivityProfileComponent')?.hidden) return;
            const menu = document.getElementById('memberActivityProfileAdminMenu');
            if (menu && !menu.hidden) {
                closeAdminMenu();
                return;
            }
            close();
        });
    }

    document.addEventListener('DOMContentLoaded', bind);

    global.MemberActivityProfile = { open: open, close: close, mode: mode };
    global.openProjectMemberProfile = function (userId) { if (isProjectMode()) open(userId); };
    global.openWorkspaceMemberActivityProfile = function (userId) { if (!isProjectMode()) open(userId); };
})(window);
