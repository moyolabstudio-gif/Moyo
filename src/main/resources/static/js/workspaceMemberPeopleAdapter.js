/**
 * 그룹 멤버 전체 보기 어댑터
 * - 우측 멤버 위젯의 일부 목록과 공통 사람 모달의 전체 목록을 연결한다.
 * - 그룹 멤버 API/정규화는 CommonMemberDataAdapter가 소유한다.
 */
(function (global) {
    'use strict';

    function contextPath() {
        return document.body?.dataset?.contextPath || '';
    }

    function workspaceId() {
        return String(document.body?.dataset?.wsId || '').trim();
    }

    function workspaceName() {
        return String(document.body?.dataset?.workspaceName || '').trim();
    }

    function readMainRole(userId) {
        const id = String(userId || '').trim();
        if (!id) return null;
        const cards = document.querySelectorAll('#workspaceMemberList .moyo-member-card[data-user-id]');
        for (const card of cards) {
            if (String(card.dataset.userId || '').trim() !== id) continue;
            const badge = card.querySelector('.moyo-member-role');
            if (!badge) return null;
            const className = badge.classList.contains('leader')
                ? 'leader'
                : (badge.classList.contains('admin') ? 'admin' : 'member');
            return {
                text: String(badge.textContent || '').trim() || '멤버',
                className: className
            };
        }
        return null;
    }

    function toPerson(member) {
        const mainRole = readMainRole(member?.userId);
        const normalizedRole = member?.role && typeof member.role === 'object' ? member.role : null;
        const roleText = mainRole?.text || normalizedRole?.text || '멤버';
        const roleClass = mainRole?.className || normalizedRole?.className || 'member';
        const position = String(member?.position || '').trim();
        return {
            id: String(member?.userId || ''),
            name: member?.name || '사용자',
            // 전체보기 목록에서는 개인정보(이메일)를 노출/검색하지 않는다.
            email: '',
            subtitle: position,
            profileImagePath: member?.profileImage || '',
            type: roleClass === 'leader' ? 'workspace-owner' : 'workspace-member',
            workspaceRole: roleText,
            workspaceRoleClass: roleClass,
            raw: member
        };
    }

    function openProfile(person) {
        const member = person?.raw || person;
        const userId = String(member?.userId || person?.id || '').trim();
        if (!userId) return;
        if (typeof global.openWorkspaceMemberActivityProfile === 'function') {
            global.openWorkspaceMemberActivityProfile(userId);
            return;
        }
        if (typeof global.openWorkspaceMemberProfile === 'function') {
            global.openWorkspaceMemberProfile(userId);
            return;
        }
        if (typeof global.alert === 'function') {
            global.alert('그룹 멤버 프로필을 불러오지 못했습니다.');
        }
    }

    function openWithMembers(members) {
        if (!global.CommonPeopleModal || typeof global.CommonPeopleModal.open !== 'function') {
            throw new Error('공통 사람 모달을 불러오지 못했습니다.');
        }
        const rank = { leader: 0, admin: 1, member: 2 };
        const people = (Array.isArray(members) ? members : [])
            .map(toPerson)
            .filter(function (person) { return !!person.id; })
            .sort(function (a, b) {
                const roleDiff = (rank[a.workspaceRoleClass] ?? 9) - (rank[b.workspaceRoleClass] ?? 9);
                return roleDiff || String(a.name || '').localeCompare(String(b.name || ''), 'ko');
            });
        global.CommonPeopleModal.open({
            title: '그룹 멤버',
            mode: 'VIEW',
            variant: 'workspace-members',
            showCount: true,
            countLabel: '전체 멤버',
            searchPlaceholder: '이름 또는 직책 · 담당 검색',
            emptyText: '검색 결과가 없습니다.',
            emptySubText: '이름이나 직책 · 담당을 다시 확인해주세요.',
            emptySummaryText: '멤버 없음',
            profileList: true,
            keepOpenOnProfile: true,
            listPageSize: 20,
            people: people,
            normalizePerson: function (source, helpers) {
                const person = helpers.normalizePerson(source);
                // 공통 정규화의 email fallback을 제거해 전체보기에서는
                // 직책 · 담당만 보조정보/검색 대상으로 사용한다.
                person.email = '';
                person.subtitle = String(source.subtitle || '').trim();
                person.workspaceRole = source.workspaceRole || '멤버';
                person.workspaceRoleClass = source.workspaceRoleClass || 'member';
                person.raw = source.raw || source;
                return person;
            },
            onProfile: openProfile,
            renderRowAction: function (person) {
                const role = String(person?.workspaceRole || '멤버').trim();
                const roleType = String(person?.workspaceRoleClass || 'member').trim();
                const roleClass = roleType === 'leader' ? ' is-owner' : (roleType === 'admin' ? ' is-admin' : '');
                return '<span class="common-people-modal-role' + roleClass + '">' + role.replace(/[&<>"']/g, function (char) {
                    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
                }) + '</span>';
            },
            manageHref: document.body?.dataset?.workspaceAdmin === 'true'
                ? contextPath() + '/workspace/settings/members?wsId=' + encodeURIComponent(workspaceId())
                : '',
            manageText: '멤버 관리로 이동',
            summaryFormatter: function (summary) {
                return '전체 ' + summary.totalCount + '명';
            }
        });
    }

    function open() {
        const adapter = global.CommonMemberDataAdapter;
        if (!adapter) return Promise.reject(new Error('공통 멤버 어댑터를 불러오지 못했습니다.'));
        const cached = typeof adapter.getWorkspaceMembers === 'function'
            ? adapter.getWorkspaceMembers()
            : [];
        if (cached.length) {
            openWithMembers(cached);
            return Promise.resolve(cached);
        }
        return adapter.loadWorkspace({ wsId: workspaceId(), displayLimit: 8 }).then(function (members) {
            openWithMembers(members);
            return members;
        });
    }

    function bind() {
        const button = document.querySelector('[data-workspace-member-all-button]');
        if (!button || button.dataset.peopleBound === 'true') return;
        button.dataset.peopleBound = 'true';
        button.addEventListener('click', function () {
            button.disabled = true;
            open().catch(function (error) {
                console.error(error);
                if (typeof global.showToast === 'function') {
                    global.showToast('그룹 멤버 목록을 불러오지 못했습니다.', 'error');
                } else {
                    alert('그룹 멤버 목록을 불러오지 못했습니다.');
                }
            }).finally(function () {
                button.disabled = false;
            });
        });
    }

    global.WorkspaceMemberPeopleAdapter = { open: open, bind: bind };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
    else bind();
})(window);
