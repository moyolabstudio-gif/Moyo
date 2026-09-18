/**
 * MOYO 프로젝트 멤버
 * 멤버 조회/추가, 역할 통계, 멤버 프로필을 담당합니다.
 */

function openInviteModal() {
    openAssignModal();
}

function openProjectMemberAllModal() {
    if (!window.ProjectMemberPeopleAdapter?.openView) {
        alert('프로젝트 멤버 목록을 불러오지 못했습니다.');
        return;
    }

    window.ProjectMemberPeopleAdapter.openView({
        title: '프로젝트 멤버',
        description: '프로젝트에 참여 중인 멤버를 확인할 수 있습니다.'
    }).catch(function (error) {
        console.error('프로젝트 멤버 전체 보기 오류:', error);
        alert('프로젝트 멤버 목록을 불러오지 못했습니다.');
    });
}

function openAssignModal() {
    const config = window.PROJECT_MAIN_CONFIG || {};

    if (!window.ProjectMemberPeopleAdapter?.openAdd) {
        alert('공통 사람 모달을 불러오지 못했습니다.');
        return;
    }

    window.ProjectMemberPeopleAdapter.openAdd({
        projId: config.projectId || config.paramProjId,
        wsId: config.wsId || config.paramWsId,
        contextPath: '',
        onAdded: function() {
            window.setTimeout(function() {
                location.reload();
            }, 250);
        }
    });
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
    if (!window.CommonMemberDataAdapter || !window.CommonMemberWidget) {
        window.CommonMemberWidget?.renderState('projectMemberList', '멤버 카드 모듈을 불러오지 못했습니다.', 'error');
        return;
    }
    const stats = window.CommonMemberDataAdapter.buildStats(tasks);
    const normalized = window.CommonMemberDataAdapter.adaptMembers(members, {
        scope: 'PROJECT',
        ownerId: window.PROJECT_MAIN_CONFIG?.projectLeaderId || window.PROJECT_MAIN_CONFIG?.leaderId || '',
        stats: stats
    });
    const widgetMembers = normalized.map(function (member) {
        return Object.assign({}, member, { secondary: member.position || '' });
    });
    window.CommonMemberWidget.renderMembers({
        listId: 'projectMemberList',
        countId: 'projectMemberCount',
        members: widgetMembers,
        showStats: true,
        hideEmptySecondary: true,
        avatarFit: 'cover',
        onSelect: function (member) { openProjectMemberProfile(member.userId); }
    });
}

function refreshProjectMemberPanel() {
    if (isPersonalProjectMain()) return Promise.resolve([]);
    if (!window.CommonMemberDataAdapter) {
        window.CommonMemberWidget?.renderState('projectMemberList', '멤버 데이터 모듈을 불러오지 못했습니다.', 'error');
        return Promise.resolve([]);
    }
    return window.CommonMemberDataAdapter.refreshProject();
}




/* ===== 프로젝트 멤버 프로필 =====
 * 그룹 프로젝트/개인 프로젝트 모두 프로젝트 전용 프로필을 연다.
 * 그룹 프로젝트의 이름/사진은 서버에서 그룹 전용 프로필을 identity source로 사용한다.
 */
function openProjectMemberProfile(userId) {
    const id = String(userId || '').trim();
    if (!id) return;

    if (window.MemberActivityProfile?.open) {
        window.MemberActivityProfile.open(id);
        return;
    }

    alert('프로젝트 프로필을 불러오지 못했습니다.');
}
/* ===== End 프로젝트 멤버 프로필 ===== */
