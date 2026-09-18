/**
 * 프로젝트 멤버 공통 모달 어댑터
 * - VIEW / SELECT_SINGLE / SELECT_MULTIPLE 모드를 공통 사람 모달에 연결한다.
 * - 프로젝트 멤버만 노출하며 그룹 멤버와 섞지 않는다.
 */
(function (global) {
    'use strict';

    function contextPath() {
        return document.body?.dataset?.contextPath || global.PROJECT_MAIN_CONFIG?.contextPath || global.PROJECT_SETTINGS_CONFIG?.contextPath || '';
    }

    function projectId() {
        return String(global.PROJECT_MAIN_CONFIG?.projectId || global.PROJECT_SETTINGS_CONFIG?.projId || new URLSearchParams(location.search).get('projId') || '').trim();
    }

    function isPersonalProject() {
        const main = global.PROJECT_MAIN_CONFIG || {};
        const settings = global.PROJECT_SETTINGS_CONFIG || {};
        const scope = String(main.projectScope || settings.projectScope || document.body?.dataset?.projectScope || '').trim().toUpperCase();
        return scope === 'PERSONAL'
            || main.isPersonalProject === true
            || settings.isPersonalProject === true
            || String(main.isPersonalProject).toLowerCase() === 'true'
            || String(settings.isPersonalProject).toLowerCase() === 'true';
    }

    function workspaceId() {
        if (isPersonalProject()) return '';
        return String(global.PROJECT_MAIN_CONFIG?.wsId
            || global.PROJECT_MAIN_CONFIG?.paramWsId
            || global.PROJECT_SETTINGS_CONFIG?.wsId
            || document.body?.dataset?.wsId
            || '').trim();
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
        });
    }

    function toPerson(member) {
        const role = member?.role || {};
        const roleText = String(role.text || member?.projectRoleText || '멤버').trim();
        const roleClass = String(role.className || member?.projectRoleClass || 'member').trim();
        const position = String(member?.position || '').trim();
        return {
            id: String(member?.userId || '').trim(),
            name: member?.name || '사용자',
            email: '',
            subtitle: position,
            profileImagePath: member?.profileImage || '',
            projectRole: roleText,
            projectRoleClass: roleClass,
            raw: member
        };
    }

    function normalizeMode(mode) {
        const value = String(mode || 'VIEW').trim().toUpperCase();
        if (value === 'SELECT_MULTIPLE' || value === 'MULTIPLE') return 'SELECT_MULTIPLE';
        if (value === 'SELECT_SINGLE' || value === 'SINGLE') return 'SELECT_SINGLE';
        return 'VIEW';
    }

    function openProfile(person) {
        const userId = String(person?.id || person?.raw?.userId || '').trim();
        if (!userId) return;
        if (typeof global.openProjectMemberProfile === 'function') {
            global.openProjectMemberProfile(userId);
            return;
        }
        // 그룹 기반 프로젝트에서는 개인 프로필로 빠지지 않는다.
        if (workspaceId()) {
            if (typeof global.openWorkspaceMemberProfile === 'function') {
                global.openWorkspaceMemberProfile(userId);
                return;
            }
            if (typeof global.alert === 'function') {
                global.alert('그룹 멤버 프로필을 불러오지 못했습니다.');
            }
            return;
        }
        location.href = contextPath() + '/users/profile?userId=' + encodeURIComponent(userId);
    }

    function roleBadge(person) {
        const role = String(person?.projectRole || '멤버').trim();
        const type = String(person?.projectRoleClass || 'member').trim();
        const cls = type === 'leader' ? ' is-owner' : (type === 'admin' ? ' is-admin' : '');
        return '<span class="common-people-modal-role' + cls + '">' + escapeHtml(role) + '</span>';
    }

    function loadMembers() {
        const adapter = global.CommonMemberDataAdapter;
        if (!adapter) return Promise.reject(new Error('공통 멤버 데이터 어댑터를 불러오지 못했습니다.'));
        const cached = typeof adapter.getProjectMembers === 'function' ? adapter.getProjectMembers() : [];
        if (cached.length) return Promise.resolve(cached);
        return adapter.loadProject({ projId: projectId() });
    }

    function open(options) {
        const opts = options || {};
        const mode = normalizeMode(opts.mode);
        if (!global.CommonPeopleModal || typeof global.CommonPeopleModal.open !== 'function') {
            return Promise.reject(new Error('공통 사람 모달을 불러오지 못했습니다.'));
        }
        return loadMembers().then(function (members) {
            const people = (Array.isArray(members) ? members : []).map(toPerson).filter(function (person) { return !!person.id; });
            global.CommonPeopleModal.open({
                title: opts.title || (mode === 'VIEW' ? '프로젝트 멤버' : '담당자 선택'),
                description: opts.description || '',
                mode: mode,
                showCount: false,
                countLabel: '프로젝트 멤버',
                countText: function (count) { return '총 ' + count + '명'; },
                people: people,
                selectedIds: Array.isArray(opts.selectedIds) ? opts.selectedIds : [],
                selectedPeople: Array.isArray(opts.selectedPeople) ? opts.selectedPeople : [],
                searchPlaceholder: '프로젝트 멤버 이름 또는 역할 검색',
                emptyText: '참여 중인 프로젝트 멤버가 없습니다.',
                emptySubText: '프로젝트 멤버 목록을 확인해주세요.',
                emptySummaryText: '멤버 없음',
                selectedSummaryText: '선택',
                confirmText: opts.confirmText || (mode === 'SELECT_MULTIPLE' ? '선택 완료' : '선택'),
                keepOpenOnProfile: true,
                listPageSize: Number(opts.listPageSize || 20),
                normalizePerson: function (source, helpers) {
                    const person = helpers.normalizePerson(source);
                    person.projectRole = source.projectRole || '멤버';
                    person.projectRoleClass = source.projectRoleClass || 'member';
                    person.raw = source.raw || source;
                    return person;
                },
                onProfile: openProfile,
                renderRowAction: mode === 'VIEW' ? roleBadge : null,
                onSelect: function (selected) {
                    if (typeof opts.onSelect === 'function') opts.onSelect(selected);
                },
                summaryFormatter: function (summary) {
                    if (mode === 'VIEW') return '전체 ' + summary.totalCount + '명';
                    return summary.selectedCount ? summary.selectedCount + '명 선택' : '선택 없음';
                }
            });
            return members;
        });
    }


    function resolveAddConfig(options) {
        const opts = options || {};
        const main = global.PROJECT_MAIN_CONFIG || {};
        const settings = global.PROJECT_SETTINGS_CONFIG || {};
        return {
            projId: String(opts.projId || settings.projId || main.projectId || main.paramProjId || projectId() || '').trim(),
            wsId: String(opts.wsId || settings.wsId || main.wsId || main.paramWsId || '').trim(),
            contextPath: String(opts.contextPath != null ? opts.contextPath : (settings.contextPath || main.contextPath || contextPath())).replace(/\/+$/, ''),
            onAdded: typeof opts.onAdded === 'function' ? opts.onAdded : null
        };
    }

    function loadAssignableMembers(config) {
        const url = config.contextPath
            + '/project/api/assignable-members?wsId=' + encodeURIComponent(config.wsId)
            + '&projId=' + encodeURIComponent(config.projId);
        return fetch(url).then(function (response) {
            if (!response.ok) throw new Error('LOAD_FAILED');
            return response.json();
        }).then(function (members) {
            return Array.isArray(members) ? members : [];
        });
    }

    function addProjectMember(config, person, button) {
        const userId = String(person?.id || '').trim();
        if (!userId || !button || button.disabled) return Promise.resolve(false);

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '처리 중';

        const params = new URLSearchParams();
        params.append('projId', config.projId);
        params.append('userIds', userId);

        return fetch(config.contextPath + '/project/api/add-members', {
            method: 'POST',
            body: params
        }).then(function (response) {
            if (!response.ok) throw new Error('ADD_FAILED');
            return response.text();
        }).then(function (result) {
            const code = String(result || '').trim();
            if (code === 'SUCCESS') {
                button.textContent = '추가됨';
                document.dispatchEvent(new CustomEvent('moyo:project-member-added', {
                    detail: { userId: userId }
                }));
                if (config.onAdded) config.onAdded(userId, person);
                return true;
            }
            if (code === 'NO_PERMISSION') alert('멤버 추가 권한이 없습니다.');
            else if (code === 'ALREADY_EXISTS') {
                button.textContent = '이미 참여';
                button.disabled = true;
                return false;
            } else alert('멤버 추가에 실패했습니다.');

            button.disabled = false;
            button.textContent = originalText;
            return false;
        }).catch(function (error) {
            console.error('프로젝트 멤버 추가 오류:', error);
            alert('멤버 추가 중 오류가 발생했습니다.');
            button.disabled = false;
            button.textContent = originalText;
            return false;
        });
    }

    function openAdd(options) {
        if (!global.CommonPeopleModal || typeof global.CommonPeopleModal.open !== 'function') {
            return Promise.reject(new Error('공통 사람 모달을 불러오지 못했습니다.'));
        }
        const config = resolveAddConfig(options);
        if (isPersonalProject()) {
            return Promise.reject(new Error('개인 프로젝트는 멤버 추가를 지원하지 않습니다.'));
        }
        if (!config.projId || !config.wsId) {
            return Promise.reject(new Error('프로젝트 또는 그룹 정보가 없습니다.'));
        }

        return loadAssignableMembers(config).then(function (members) {
            let people = members.slice();
            global.CommonPeopleModal.open({
                title: '프로젝트 멤버 추가',
                description: '그룹 멤버 중 프로젝트에 추가할 멤버를 선택하세요.',
                mode: 'VIEW',
                profileList: true,
                variant: 'project-member-add',
                showCount: true,
                countLabel: false,
                countText: function (count) { return '추가 가능한 멤버 ' + count + '명'; },
                people: people,
                normalizePerson: function (source, helpers) {
                    const person = helpers.normalizePerson(source);
                    person.subtitle = String(source.WS_POSITION || source.wsPosition || '').trim();
                    person.email = '';
                    person.raw = source;
                    return person;
                },
                searchPlaceholder: '이름 또는 직책 · 담당 검색',
                emptyText: '추가 가능한 멤버가 없습니다.',
                emptySubText: '그룹 멤버 또는 프로젝트 참여 상태를 확인해주세요.',
                listPageSize: 30,
                keepOpenOnProfile: true,
                onProfile: openProfile,
                renderRowAction: function () {
                    return '<button type="button" class="common-people-modal-row-action moyo-share-register-button" data-person-action="add">추가</button>';
                },
                onRowAction: function (person, action, button) {
                    if (action !== 'add') return;
                    addProjectMember(config, person, button).then(function (added) {
                        if (!added) return;
                        people = people.filter(function (member) {
                            return String(member.USER_ID || member.userId || member.id || '') !== String(person.id);
                        });
                        global.CommonPeopleModal.replacePeople(people);
                    });
                }
            });
            return members;
        }).catch(function (error) {
            console.error('추가 가능 프로젝트 멤버 로딩 오류:', error);
            alert('멤버를 불러오지 못했습니다.');
            throw error;
        });
    }

    global.ProjectMemberPeopleAdapter = {
        MODES: Object.freeze({ VIEW: 'VIEW', SELECT_SINGLE: 'SELECT_SINGLE', SELECT_MULTIPLE: 'SELECT_MULTIPLE' }),
        open: open,
        openView: function (options) { return open(Object.assign({}, options, { mode: 'VIEW' })); },
        openSingle: function (options) { return open(Object.assign({}, options, { mode: 'SELECT_SINGLE' })); },
        openMultiple: function (options) { return open(Object.assign({}, options, { mode: 'SELECT_MULTIPLE' })); },
        openAdd: openAdd
    };
})(window);
