(function (window, document) {
    'use strict';

    const runtime = {
        scope: null,
        selection: {},
        friends: [],
        workspaces: [],
        projects: [],
        step: 'LIST',
        projectBranch: null,
        selectedWorkspaceId: null,
        keyword: '',
        showCompleted: false,
        onSelect: null,
        imageResolver: null
    };

    function el(id) { return document.getElementById(id); }
    function valueText(value) { return String(value == null ? '' : value); }
    function escapeHtml(value) {
        return valueText(value).replace(/[&<>'"]/g, function (ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[ch];
        });
    }
    function initial(name) { return valueText(name).trim().charAt(0).toUpperCase() || 'M'; }
    function imagePath(value) {
        return typeof runtime.imageResolver === 'function' ? runtime.imageResolver(value || '') : (value || '');
    }
    function normalizeStatus(value) { return valueText(value).trim().toUpperCase().replace(/[\s-]+/g, '_'); }
    function isCompletedProject(project) {
        if (project.completed === true || project.completedYn === 'Y') return true;
        return ['DONE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'CLOSED', 'END'].indexOf(normalizeStatus(project.status)) >= 0;
    }
    function matches(item) {
        const keyword = valueText(runtime.keyword).trim().toLowerCase();
        if (!keyword) return true;
        return valueText((item.name || '') + ' ' + (item.meta || '')).toLowerCase().indexOf(keyword) >= 0;
    }
    function avatarHtml(item, kind) {
        const path = imagePath(item.image);
        const className = kind === 'friend' ? ' is-round' : ' is-square';
        return '<span class="moyo-scope-item__avatar' + className + '">'
            + (path ? '<img src="' + escapeHtml(path) + '" alt="">' : escapeHtml(initial(item.name)))
            + '</span>';
    }
    function rowHtml(config) {
        const classes = ['moyo-scope-item'];
        if (config.active) classes.push('is-active');
        if (config.completed) classes.push('is-completed');
        const icon = config.icon ? '<span class="moyo-scope-item__type"><i class="' + escapeHtml(config.icon) + '"></i></span>' : avatarHtml(config, config.kind);
        return '<button type="button" class="' + classes.join(' ') + '" ' + (config.attrs || '') + '>'
            + icon
            + '<span class="moyo-scope-item__copy"><strong>' + escapeHtml(config.name) + '</strong>'
            + (config.meta ? '<small>' + escapeHtml(config.meta) + '</small>' : '') + '</span>'
            + (config.trailing || '')
            + (config.active ? '<i class="fa-solid fa-check moyo-scope-item__check" aria-hidden="true"></i>' : '')
            + '</button>';
    }
    function emptyHtml(message) { return '<div class="moyo-scope-empty">' + escapeHtml(message) + '</div>'; }
    function setHeader(title, canBack) {
        const titleEl = el('commonScopeSelectorTitle');
        const back = el('commonScopeSelectorBack');
        if (titleEl) titleEl.textContent = title;
        if (back) back.hidden = !canBack;
    }
    function setSearchVisible(visible, placeholder) {
        const wrap = el('commonScopeSelectorSearchWrap');
        const input = el('commonScopeSelectorSearch');
        if (wrap) wrap.hidden = !visible;
        if (input && placeholder) input.placeholder = placeholder;
    }
    function setCompletedVisible(visible) {
        const wrap = el('commonScopeSelectorCompletedWrap');
        const checkbox = el('commonScopeSelectorCompleted');
        if (wrap) wrap.hidden = !visible;
        if (checkbox) checkbox.checked = runtime.showCompleted;
    }
    function close() {
        const modal = el('commonScopeSelectorModal');
        if (modal) modal.hidden = true;
        document.body.classList.remove('moyo-scope-modal-open');
    }
    function emit(selection) {
        if (typeof runtime.onSelect === 'function') runtime.onSelect(selection);
        close();
    }
    function renderSimpleList(kind) {
        const body = el('commonScopeSelectorBody');
        const isFriend = kind === 'FRIEND';
        const list = (isFriend ? runtime.friends : runtime.workspaces).filter(matches);
        const allActive = isFriend ? !runtime.selection.friendId : !runtime.selection.wsId;
        setHeader(isFriend ? '친구 선택' : '그룹 선택', false);
        setSearchVisible(true, isFriend ? '친구 검색' : '그룹 검색');
        setCompletedVisible(false);

        let html = '<div class="moyo-scope-list">';
        html += rowHtml({
            name: isFriend ? '친구 전체' : '그룹 전체',
            meta: isFriend ? '모든 친구의 일정 보기' : '모든 그룹의 일정 보기',
            icon: isFriend ? 'fa-solid fa-user-group' : 'fa-solid fa-people-group',
            active: allActive,
            attrs: 'data-common-choice="' + (isFriend ? 'FRIEND_ALL' : 'WS_ALL') + '"'
        });
        html += '<div class="moyo-scope-list__divider"></div>';
        html += list.map(function (item) {
            return rowHtml({
                name: item.name,
                meta: item.meta,
                image: item.image,
                kind: isFriend ? 'friend' : 'workspace',
                active: isFriend ? valueText(runtime.selection.friendId) === valueText(item.id) : valueText(runtime.selection.wsId) === valueText(item.id),
                attrs: 'data-common-choice="' + (isFriend ? 'FRIEND' : 'WS') + '" data-target-id="' + escapeHtml(item.id) + '"'
            });
        }).join('');
        html += '</div>';
        if (!list.length) html += emptyHtml(isFriend ? '검색 결과가 없습니다.' : '검색 결과가 없습니다.');
        body.innerHTML = html;
    }
    function renderProjectRoot() {
        const body = el('commonScopeSelectorBody');
        const workspaces = runtime.workspaces.filter(matches);
        setHeader('프로젝트 선택', false);
        setSearchVisible(true, '개인 프로젝트 또는 그룹 검색');
        setCompletedVisible(false);

        let html = '<div class="moyo-scope-list">';
        html += rowHtml({
            name: '프로젝트 전체',
            meta: '개인·그룹 프로젝트 전체 일정 보기',
            icon: 'fa-solid fa-layer-group',
            active: !runtime.selection.projectScope && !runtime.selection.projId,
            attrs: 'data-common-choice="PROJ_ALL"'
        });
        html += '<div class="moyo-scope-list__divider"></div>';
        if (matches({ name: '개인 프로젝트', meta: '내 프로젝트' })) {
            html += rowHtml({
                name: '개인 프로젝트',
                meta: '내 개인 프로젝트 선택',
                icon: 'fa-solid fa-user',
                trailing: '<i class="fa-solid fa-chevron-right moyo-scope-item__arrow" aria-hidden="true"></i>',
                attrs: 'data-project-branch="PERSONAL"'
            });
        }
        html += workspaces.map(function (workspace) {
            return rowHtml({
                name: workspace.name,
                meta: '그룹 프로젝트 선택',
                image: workspace.image,
                kind: 'workspace',
                trailing: '<i class="fa-solid fa-chevron-right moyo-scope-item__arrow" aria-hidden="true"></i>',
                attrs: 'data-project-branch="GROUP" data-workspace-id="' + escapeHtml(workspace.id) + '"'
            });
        }).join('');
        html += '</div>';
        if (!workspaces.length && runtime.keyword) html += emptyHtml('검색 결과가 없습니다.');
        body.innerHTML = html;
    }
    function projectStatusMeta(project) {
        if (isCompletedProject(project)) return '완료';
        const status = normalizeStatus(project.status);
        if (status === 'PLANNED' || status === 'READY' || status === 'WAITING') return '예정';
        return '진행 중';
    }
    function renderProjectList() {
        const body = el('commonScopeSelectorBody');
        const personal = runtime.projectBranch === 'PERSONAL';
        const workspace = runtime.workspaces.find(function (item) { return valueText(item.id) === valueText(runtime.selectedWorkspaceId); }) || null;
        const scopeProjects = runtime.projects.filter(function (item) {
            if (personal) return item.projectScope === 'PERSONAL';
            return item.projectScope === 'GROUP' && valueText(item.wsId) === valueText(runtime.selectedWorkspaceId);
        });
        const filtered = scopeProjects.filter(function (item) {
            return matches(item) && (runtime.showCompleted || !isCompletedProject(item));
        }).sort(function (a, b) {
            return Number(isCompletedProject(a)) - Number(isCompletedProject(b));
        });
        const title = personal ? '개인 프로젝트' : (workspace ? workspace.name : '그룹 프로젝트');

        setHeader(title, true);
        setSearchVisible(true, '프로젝트 검색');
        setCompletedVisible(true);

        let html = '<div class="moyo-scope-list">';
        html += rowHtml({
            name: title + ' 전체',
            meta: personal ? '모든 개인 프로젝트 일정 보기' : '이 그룹의 모든 프로젝트 일정 보기',
            icon: 'fa-solid fa-layer-group',
            active: personal
                ? runtime.selection.projectScope === 'PERSONAL' && !runtime.selection.projId
                : runtime.selection.projectScope === 'GROUP' && valueText(runtime.selection.wsId) === valueText(runtime.selectedWorkspaceId) && !runtime.selection.projId,
            attrs: personal
                ? 'data-common-choice="PROJ_PERSONAL_ALL"'
                : 'data-common-choice="PROJ_GROUP_ALL" data-target-ws-id="' + escapeHtml(runtime.selectedWorkspaceId) + '"'
        });
        html += '<div class="moyo-scope-list__divider"></div>';
        html += filtered.map(function (item) {
            const completed = isCompletedProject(item);
            return rowHtml({
                name: item.name,
                meta: projectStatusMeta(item),
                icon: completed ? 'fa-solid fa-circle-check' : 'fa-solid fa-folder-open',
                completed: completed,
                active: valueText(runtime.selection.projId) === valueText(item.id),
                attrs: personal
                    ? 'data-common-choice="PROJ_PERSONAL" data-target-id="' + escapeHtml(item.id) + '"'
                    : 'data-common-choice="PROJ_GROUP" data-target-id="' + escapeHtml(item.id) + '" data-target-ws-id="' + escapeHtml(runtime.selectedWorkspaceId) + '"'
            });
        }).join('');
        html += '</div>';
        if (!filtered.length) {
            html += emptyHtml(runtime.showCompleted ? '표시할 프로젝트가 없습니다.' : '진행 중인 프로젝트가 없습니다.');
        }
        body.innerHTML = html;
    }
    function render() {
        if (runtime.scope === 'FRIEND' || runtime.scope === 'WS') {
            renderSimpleList(runtime.scope);
            return;
        }
        if (runtime.step === 'PROJECT_LIST') renderProjectList();
        else renderProjectRoot();
    }
    function applyChoice(button) {
        const choice = button.getAttribute('data-common-choice');
        const id = button.getAttribute('data-target-id');
        const wsId = button.getAttribute('data-target-ws-id');
        const title = (button.querySelector('.moyo-scope-item__copy strong') || {}).textContent || '';
        const map = {
            FRIEND_ALL: { friendId: null, label: '친구 전체' },
            FRIEND: { friendId: id, label: title },
            WS_ALL: { wsId: null, label: '그룹 전체' },
            WS: { wsId: id, label: title },
            PROJ_ALL: { projectScope: null, wsId: null, projId: null, label: '프로젝트 전체' },
            PROJ_PERSONAL_ALL: { projectScope: 'PERSONAL', wsId: null, projId: null, label: '개인 프로젝트 전체' },
            PROJ_PERSONAL: { projectScope: 'PERSONAL', wsId: null, projId: id, label: title },
            PROJ_GROUP_ALL: { projectScope: 'GROUP', wsId: wsId, projId: null, label: title },
            PROJ_GROUP: { projectScope: 'GROUP', wsId: wsId, projId: id, label: title }
        };
        if (map[choice]) emit(map[choice]);
    }
    function openProjectBranch(button) {
        runtime.projectBranch = button.getAttribute('data-project-branch');
        runtime.selectedWorkspaceId = button.getAttribute('data-workspace-id') || null;
        runtime.step = 'PROJECT_LIST';
        runtime.keyword = '';
        runtime.showCompleted = false;
        const search = el('commonScopeSelectorSearch');
        if (search) search.value = '';
        render();
        if (search) search.focus();
    }
    function goBack() {
        if (runtime.scope !== 'PROJ' || runtime.step !== 'PROJECT_LIST') return;
        runtime.step = 'PROJECT_ROOT';
        runtime.projectBranch = null;
        runtime.selectedWorkspaceId = null;
        runtime.keyword = '';
        runtime.showCompleted = false;
        const search = el('commonScopeSelectorSearch');
        if (search) search.value = '';
        render();
        if (search) search.focus();
    }
    function open(options) {
        options = options || {};
        runtime.scope = options.scope;
        runtime.selection = options.selection || {};
        runtime.friends = options.friends || [];
        runtime.workspaces = options.workspaces || [];
        runtime.projects = options.projects || [];
        runtime.onSelect = options.onSelect;
        runtime.imageResolver = options.imageResolver;
        runtime.keyword = '';
        runtime.showCompleted = false;
        runtime.step = runtime.scope === 'PROJ' ? 'PROJECT_ROOT' : 'LIST';
        runtime.projectBranch = null;
        runtime.selectedWorkspaceId = null;

        const search = el('commonScopeSelectorSearch');
        if (search) search.value = '';
        const modal = el('commonScopeSelectorModal');
        if (!modal) return;
        modal.hidden = false;
        document.body.classList.add('moyo-scope-modal-open');
        render();
        setTimeout(function () { if (search) search.focus(); }, 30);
    }

    document.addEventListener('click', function (event) {
        if (event.target.closest('[data-common-scope-close]')) { close(); return; }
        if (event.target.closest('#commonScopeSelectorBack')) { goBack(); return; }
        if (event.target.closest('#commonScopeSelectorSearchClear')) {
            runtime.keyword = '';
            const search = el('commonScopeSelectorSearch');
            if (search) { search.value = ''; search.focus(); }
            render();
            return;
        }
        const branch = event.target.closest('[data-project-branch]');
        if (branch) { openProjectBranch(branch); return; }
        const choice = event.target.closest('[data-common-choice]');
        if (choice) applyChoice(choice);
    });
    document.addEventListener('input', function (event) {
        if (event.target.id === 'commonScopeSelectorSearch') {
            runtime.keyword = event.target.value || '';
            render();
        }
    });
    document.addEventListener('change', function (event) {
        if (event.target.id === 'commonScopeSelectorCompleted') {
            runtime.showCompleted = !!event.target.checked;
            render();
        }
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') close();
    });

    window.MoyoScopeSelector = { open: open, close: close };
})(window, document);
