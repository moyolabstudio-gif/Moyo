/**
 * MOYO 프로젝트 위젯
 * 게시판, 노트, 투표, 사진 위젯과 공통 모달을 담당합니다.
 */

function getProjectCommunityConfig(projId) {
    var config = window.PROJECT_MAIN_CONFIG || {};
    return {
        scope: 'PROJECT',
        contextPath: config.contextPath || '',
        wsId: config.wsId || '',
        projId: projId || getProjectMainProjId(),
        canManageNotice: config.canManageProject === true,
        limits: { board: 3, schedule: 4, poll: 2, activity: 4 },
        retryBoards: 'loadAllWidgets.bind(null, getProjectMainProjId())',
        retryToday: 'loadProjectTodaySchedule.bind(null, getProjectMainProjId())',
        retryPolls: 'loadProjectActivePoll'
    };
}

function loadProjectCommunityWidgets(projId) {
    if (window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.isPersonalProject) return Promise.resolve();
    if (!projId || !window.MoyoCommunityWidgets) return Promise.resolve();

    return window.MoyoCommunityWidgets.load(getProjectCommunityConfig(projId)).catch(function (err) {
        console.error('프로젝트 공통 커뮤니티 위젯 초기화 실패:', err);
    });
}


function loadAllWidgets(projId) {
    if (window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.isPersonalProject) return;
    if (!projId || !window.MoyoCommunityWidgets) return;
    window.MoyoCommunityWidgets.loadBoards(getProjectCommunityConfig(projId)).catch(function (err) {
        console.error('프로젝트 공통 게시판 위젯 로딩 실패:', err);
    });
    loadProjectTodaySchedule(projId);
}


function loadProjectTodaySchedule(projId) {
    if (!window.MoyoCommunityWidgets) return;
    window.MoyoCommunityWidgets.loadToday(getProjectCommunityConfig(projId)).catch(function (err) {
        console.error('프로젝트 오늘 일정 로딩 실패:', err);
    });
}


function toggleTodaySchedule(button) {
    if (!window.MoyoCommunityWidgets) return;
    window.MoyoCommunityWidgets.toggleToday(getProjectCommunityConfig(getProjectMainProjId()), button);
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



        function escapeHtml(value) {
            return String(value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }



/* ===== Project active poll loader ===== */

function getProjectMainProjId() {
    var config = window.PROJECT_MAIN_CONFIG || {};
    return config.projectId || config.paramProjId || new URLSearchParams(window.location.search).get('projId') || '';
}




function loadProjectActivePoll() {
    if (window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.isPersonalProject) return;
    if (!window.MoyoCommunityWidgets) return;
    window.MoyoCommunityWidgets.loadPolls(getProjectCommunityConfig(getProjectMainProjId())).catch(function (err) {
        console.error('프로젝트 메인 투표 목록 조회 실패:', err);
    });
}




/* ===== End project active poll loader ===== */


function limitMainWidgetItems() {
    ['noticeBoard'].forEach(function(id) {
        const box = document.getElementById(id);
        if (!box) return;

        Array.from(box.children).forEach(function(child, index) {
            child.style.display = index >= 4 ? 'none' : '';
        });
    });
}


