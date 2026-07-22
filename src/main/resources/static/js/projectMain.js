/**
 * MOYO 프로젝트 메인
 * 공통 설정, 페이지 초기화, 프로젝트 설정/삭제를 담당합니다.
 */

window.PROJECT_MAIN_CONFIG = window.PROJECT_MAIN_CONFIG || {
    projectLeaderId: '',
    loginUserId: '',
    projectStartDate: '',
    projectEndDate: '',
    projectId: '',
    paramProjId: '',
    wsId: '',
    paramWsId: '',
    isPersonalProject: false,
    projectScope: 'GROUP',
    canManageProject: false
};

function isPersonalProjectMain() {
    return !!(window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.isPersonalProject);
}

function buildProjectMainQuery(includeWorkspace) {
    const params = new URLSearchParams(window.location.search);
    const projId = params.get('projId') || window.PROJECT_MAIN_CONFIG.projectId || window.PROJECT_MAIN_CONFIG.paramProjId;
    const query = new URLSearchParams();
    if (projId) query.set('projId', projId);
    if (includeWorkspace !== false && !isPersonalProjectMain()) {
        const wsId = params.get('wsId') || window.PROJECT_MAIN_CONFIG.wsId || window.PROJECT_MAIN_CONFIG.paramWsId;
        if (wsId && wsId !== 'null') query.set('wsId', wsId);
    }
    return query;
}


		let currentTaskId = null;
        let projectTaskMemberList = [];
        let projectMemberPanelExpanded = false;
        let cachedProjectMembers = [];
        let cachedProjectTasks = [];

function deleteProject() {
		    const projId = new URLSearchParams(window.location.search).get('projId');

		    const params = new URLSearchParams();
		    params.append("projId", projId);

		    fetch('/project/api/delete-project', {
		        method: 'POST',
		        body: params
		    })
		    .then(res => res.text())
		    .then(result => {
		        if (result === 'SUCCESS') {
		            alert("프로젝트가 삭제되었습니다.");

		            // 👉 여기 핵심: 워크스페이스로 이동
		            const wsId = new URLSearchParams(window.location.search).get('wsId');
		            window.location.href = `/workspace/main?wsId=${wsId}`;
		        } else {
		            alert("삭제 실패");
		        }
		    });
		}


        function goProjectSettings() {
            const query = buildProjectMainQuery(true);
            if (!query.get('projId')) {
                alert('프로젝트 설정으로 이동할 수 없습니다.');
                return;
            }
            location.href = '/project/settings?' + query.toString();
        }


function openEditProjectModal() {
            const startDate = document.getElementById('editStartDate').value;
            const endDateInput = document.getElementById('editEndDate');

            if (startDate && endDateInput) {
                endDateInput.setAttribute('min', startDate);
            }

            openModal('editProjectModal');
        }

		function updateProject() {
            const projId = new URLSearchParams(window.location.search).get('projId');

            const projName = document.getElementById('editProjName').value.trim();
            const projType = document.getElementById('editProjType').value;
            const startDate = document.getElementById('editStartDate').value;
            const endDate = document.getElementById('editEndDate').value;
            const projDesc = document.getElementById('editProjDesc').value.trim();

            if (!projName) {
                alert("프로젝트명을 입력해주세요.");
                document.getElementById('editProjName').focus();
                return;
            }

            if (!startDate) {
                alert("시작일을 선택해주세요.");
                document.getElementById('editStartDate').focus();
                return;
            }

            if (!endDate) {
                alert("종료일을 선택해주세요.");
                document.getElementById('editEndDate').focus();
                return;
            }

            if (endDate < startDate) {
                alert("종료일은 시작일보다 빠를 수 없습니다.");
                document.getElementById('editEndDate').focus();
                return;
            }

            const data = {
                projId: projId,
                projName: projName,
                projType: projType,
                startDate: startDate,
                endDate: endDate,
                projDesc: projDesc
            };

            fetch('/project/api/update-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.text())
            .then(result => {
                if (result === 'SUCCESS') {
                    alert("수정되었습니다.");
                    location.reload();
                } else {
                    alert("수정 실패");
                }
            })
            .catch(err => {
                console.error(err);
                alert("수정 중 오류가 발생했습니다.");
            });
        }
		let projectCalendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		let projectCalendarTasks = [];
		let projectCalendarSchedules = [];

// 페이지 로드 시 멤버 리스트 불러오기
		document.addEventListener('DOMContentLoaded', function() {
		    loadKanbanBoard();
            if (!isPersonalProjectMain()) {
                refreshProjectMemberPanel();
                loadProjectMembers();
            }
            if (!window.PROJECT_MAIN_CONFIG.isPersonalProject) {
                loadAllWidgets(new URLSearchParams(window.location.search).get('projId'));
                loadProjectActivePoll();
            }
		    setTimeout(limitMainWidgetItems, 300);
		    setTimeout(limitMainWidgetItems, 900);
		    restoreProjectTimelineScale();
		    loadProjectSchedules();
		    calculateProjectDday();
		});


function closeProjectMainMenu() {
    const trigger = document.getElementById('projectMainMenuTrigger');
    const menu = document.getElementById('projectMainMenu');
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menu.style.left = '';
    menu.style.top = '';
    menu.style.right = '';
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', function (event) {
    const wrap = event.target.closest('.project-main-menu-wrap');
    if (!wrap) closeProjectMainMenu();
});
window.addEventListener('scroll', closeProjectMainMenu, true);
window.addEventListener('resize', closeProjectMainMenu);
