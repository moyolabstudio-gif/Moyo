<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	    <title>🚀 프로젝트 대시보드</title>
	    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
	    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
	    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js'></script>
	    <style>
	        .container { max-width: 1400px !important; }
	        .dashboard-container { display: flex; gap: 20px; width: 100%; align-items: stretch; margin-top: 30px; }
	        .kanban-column { flex: 1; display: flex; flex-direction: column; min-width: 250px; border: 1px solid #eef0f2; border-radius: 16px; overflow: hidden; }
	        .header-card { padding: 15px; text-align: center; color: white; }
	        .list-area { padding: 15px; flex-grow: 1; min-height: 400px; background-color: #ffffff; }
	        .task-card { background: #ffffff; border: 1px solid #eef0f2; border-radius: 8px; padding: 12px; margin-bottom: 10px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.03); transition: 0.2s; }
	        .task-card:hover { border-color: #cbd5e0; }
	        .member-item { padding: 10px 0; border-bottom: 1px solid #f8f9fa; display: flex; align-items: center; gap: 10px; }
	        .avatar { width: 34px; height: 34px; background: #4A90E2; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; }
	        .section-card { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #eef0f2; box-shadow: 0 4px 15px rgba(0,0,0,0.01); }
		/* FullCalendar 헤더 폰트 및 간격 */
		    .fc .fc-toolbar-title { font-weight: 700; font-size: 1.2rem !important; color: #334155; }
		    .fc .fc-button-primary { 
		        background-color: #fff !important; color: #64748b !important; 
		        border: 1px solid #e2e8f0 !important; border-radius: 8px !important; 
		        padding: 5px 15px !important; font-size: 0.85rem !important; 
		    }
		    .fc .fc-button-primary:hover { background-color: #f8fafc !important; }
		    .fc .fc-button-active { background-color: #4A90E2 !important; color: #fff !important; }

		    /* 날짜 셀 및 그리드 */
		    .fc-theme-standard td, .fc-theme-standard th { border: 1px solid #f1f5f9 !important; }
		    .fc .fc-daygrid-day-number { font-size: 0.85rem; color: #64748b; padding: 8px !important; }
		    
		    /* 오늘 날짜 하이라이트 */
		    .fc .fc-day-today { background-color: #f1f5f9 !important; }
		    
		    /* 이벤트 칩 디자인 */
		    .fc-event { 
		        border-radius: 6px !important; padding: 2px 8px !important; 
		        font-size: 0.75rem !important; border: none !important; cursor: pointer;
		    }
	</style>
    <script>
		let currentTaskId = null;
        function openAssignModal() {
            const urlParams = new URLSearchParams(window.location.search);
            const wsId = urlParams.get('wsId'); 
            const projId = urlParams.get('projId');
            fetch(`/project/api/assignable-members?wsId=${wsId}&projId=${projId}`)
                .then(res => res.json())
                .then(data => {
                    const listDiv = document.getElementById('assignableList');
                    listDiv.innerHTML = data.length === 0 ? '<p class="text-center p-3">초대 가능한 멤버가 없습니다.</p>' : '';
                    data.forEach(user => {
                        listDiv.innerHTML += `<label class="list-group-item d-flex align-items-center p-2"><input class="form-check-input me-2 member-check" type="checkbox" value="\${user.USER_ID}"> <div><div class="fw-bold">\${user.USER_NAME}</div><div class="small text-muted">\${user.EMAIL}</div></div></label>`;
                    });
                    new bootstrap.Modal(document.getElementById('assignMemberModal')).show();
                });
        }

        function submitAssign() {
            const projId = new URLSearchParams(window.location.search).get('projId'); 
            const selectedUsers = Array.from(document.querySelectorAll('.member-check:checked')).map(el => el.value);
            if (selectedUsers.length === 0) return alert("멤버를 선택해주세요.");
            const params = new URLSearchParams();
            params.append('projId', projId);
            selectedUsers.forEach(id => params.append('userIds', id));
            fetch('/project/api/add-members', { method: 'POST', body: params })
            .then(res => res.text()).then(result => {
                if (result === 'SUCCESS') { location.reload(); }
                else alert('오류가 발생했습니다.');
            });
        }
		function loadKanbanBoard() {
		    const projId = new URLSearchParams(window.location.search).get('projId');
		    fetch(`/project/api/tasks?projId=${projId}`)
		        .then(res => res.json())
		        .then(data => {
		            const todoList = document.getElementById('todo-list');
		            const progressList = document.getElementById('inprogress-list');
		            const doneList = document.getElementById('done-list');
		            
		            // 리스트 초기화
		            todoList.innerHTML = '';
		            progressList.innerHTML = '';
		            doneList.innerHTML = '';

					data.forEach(task => {
						console.log(task);
					    const title = task.TITLE || "제목 없음";
					    // 서버가 주는 데이터가 대문자 키값이므로 그대로 사용합니다.
						const start = (task.START_DATE || "").trim();
						const end = (task.END_DATE || "").trim();
					    const status = (task.STATUS || "").toUpperCase();
					    const taskId = task.TASK_ID;

					    // 날짜 포맷팅: 데이터가 있으면 출력하고, 없으면 빈 문자열
					    const dateRange = (start || end) ? `${start || '미지정'} ~ ${end || '미지정'}` : "일정 미지정";

						const cardHtml =
						    '<div class="task-card" draggable="true" ondragstart="drag(event)" id="task-' + taskId + '" onclick="openTaskDetailModal(' + taskId + ')" style="border:none; border-radius:8px; padding:12px; cursor:pointer;">'

						    + '<div style="font-size:14px; font-weight:bold; margin-bottom:6px; word-break:break-all;">'
						    + title +
						    '</div>'

						    + '<div style="font-size:12px; color:#666;">'
						    + start + ' ~ ' + end +
						    '</div>'

						    + '</div>';

					    // 상태별 삽입
					    if (status === 'TODO') {
					        todoList.insertAdjacentHTML('beforeend', cardHtml);
					    } else if (status === 'IN_PROGRESS') {
					        progressList.insertAdjacentHTML('beforeend', cardHtml);
					    } else if (status === 'DONE') {
					        doneList.insertAdjacentHTML('beforeend', cardHtml);
					    }
					});
					drawCalendar(data);
		        })
		        .catch(err => console.error("칸반 로딩 실패:", err));
		}
		// 1. 업무 추가용 모달 열기
		function openAddTaskModal() {
		    document.querySelector('#addTaskModal .modal-title').innerText = "새 업무 추가";
		    document.getElementById('taskTitle').value = "";
		    document.getElementById('taskEndDate').value = "";
		    document.getElementById('taskStatus').value = "TODO";
		    
		    // 모드 설정: 생성 모드 (입력 가능)
		    setModalMode(true); 
		    
		    // 버튼 표시
		    document.getElementById('editBtn').style.display = 'none';
		    document.getElementById('saveBtn').style.display = 'none';
		    document.getElementById('addBtn').style.display = 'inline-block';
		    
		    new bootstrap.Modal(document.getElementById('addTaskModal')).show();
		}

		// 2. 업무 상세 조회 (읽기 전용)
		function openTaskDetailModal(taskId) {
		    currentTaskId = taskId;

		    fetch('/project/api/task-detail?taskId=' + taskId)
		        .then(res => res.json())
		        .then(task => {
		            document.querySelector('#addTaskModal .modal-title').innerText = "업무 상세";
		            
		            document.getElementById('taskTitle').value = task.TITLE || "";
		            document.getElementById('taskStartDate').value = task.START_DATE || "";
		            document.getElementById('taskEndDate').value = task.END_DATE || "";
		            document.getElementById('taskStatus').value = task.STATUS || "TODO";

		            setModalMode(false); 
		            
		            // 버튼 표시 상태 초기화
		            document.getElementById('editBtn').style.display = 'inline-block';
		            document.getElementById('deleteBtn').style.display = 'inline-block';
		            document.getElementById('saveBtn').style.display = 'none';
		            document.getElementById('addBtn').style.display = 'none';

		            // 저장 버튼 이벤트 설정
		            document.getElementById('saveBtn').onclick = function() { updateTask(taskId); };

		            new bootstrap.Modal(document.getElementById('addTaskModal')).show();
		        });
		}

		// 3. 수정 모드 전환
		function enableEdit() {
		    document.querySelector('#addTaskModal .modal-title').innerText = "업무 수정";
		    setModalMode(true); // 입력 가능으로
		    
		    // 버튼 전환
		    document.getElementById('editBtn').style.display = 'none';
		    document.getElementById('saveBtn').style.display = 'inline-block';
		}

		// 4. 공통 입력 제어 함수
		function setModalMode(isEdit) {
		    document.getElementById('taskTitle').readOnly = !isEdit;
		    document.getElementById('taskStartDate').readOnly = !isEdit; // 추가
		    document.getElementById('taskEndDate').readOnly = !isEdit;
		    document.getElementById('taskStatus').disabled = !isEdit;
		}

		function addTask() {
		    const urlParams = new URLSearchParams(window.location.search);

		    const projId = urlParams.get('projId');
		    const wsId = urlParams.get('wsId');

		    const title = document.getElementById('taskTitle').value;
		    const startDate = document.getElementById('taskStartDate').value;
		    const endDate = document.getElementById('taskEndDate').value;
		    const status = document.getElementById('taskStatus').value;

		    if (!title) {
		        return alert("제목을 입력하세요.");
		    }

		    const params = new URLSearchParams();
		    params.append('projId', projId);
		    params.append('wsId', wsId);
		    params.append('title', title);
		    params.append('startDate', startDate);
		    params.append('endDate', endDate);
		    params.append('status', status);

		    fetch('/project/api/add-task', {
		        method: 'POST',
		        body: params
		    })
		    .then(res => res.text())
		    .then(res => {
		        if (res === 'SUCCESS') {
		            location.reload();
		        } else {
		            alert("추가 실패");
		        }
		    })
		    .catch(err => {
		        console.error(err);
		        alert("서버 오류");
		    });
		}
		function updateTask(taskId) {
		    const title = document.getElementById('taskTitle').value;
		    const startDate = document.getElementById('taskStartDate').value; // 추가
		    const endDate = document.getElementById('taskEndDate').value;
		    const status = document.getElementById('taskStatus').value;

		    if (!title) return alert("제목을 입력하세요.");

		    const params = new URLSearchParams();
		    params.append('taskId', taskId);
		    params.append('title', title);
		    params.append('startDate', startDate); // 추가
		    params.append('endDate', endDate);
		    params.append('status', status);

		    fetch('/project/api/update-task', {
		        method: 'POST',
		        body: params
		    })
		    .then(res => res.text())
		    .then(res => {
		        if (res === 'SUCCESS') { location.reload(); }
		        else { alert("수정 실패"); }
		    });
		}
		function deleteTask() {
		    if (!currentTaskId) {
		        alert("업무를 선택해주세요.");
		        return;
		    }
		    if (!confirm("정말 이 업무를 삭제하시겠습니까?")) return;

		    // 전역 변수 currentTaskId를 바로 사용
		    fetch('/project/api/delete-task?taskId=' + currentTaskId, { 
		        method: 'POST' 
		    })
		    .then(res => res.text())
		    .then(res => {
		        if (res === 'SUCCESS') {
		            location.reload();
		        } else {
		            alert("삭제 실패");
		        }
		    })
		    .catch(err => console.error(err));
		}
	

		// 1. 프로젝트 삭제 함수
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

		function openEditProjectModal() {
		    // 기존 jQuery방식 대신 Bootstrap 인스턴스 사용
		    var myModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
		    myModal.show();
		}

		function updateProject() {
		    const projId = new URLSearchParams(window.location.search).get('projId');
		    
		    // 모달에 있는 모든 값 가져오기
		    const data = {
		        projId: projId,
		        projName: document.getElementById('editProjName').value,
		        projType: document.getElementById('editProjType').value,
		        startDate: document.getElementById('editStartDate').value,
		        endDate: document.getElementById('editEndDate').value,
		        projDesc: document.getElementById('editProjDesc').value
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
		    });
		}
		let calendar = null;

		function drawCalendar(tasks) {

		    const calendarEl = document.getElementById('calendar');

		    const events = tasks
		        .filter(t => t.START_DATE && t.END_DATE)
		        .map(task => {

		            let endDate = new Date(task.END_DATE);
		            endDate.setDate(endDate.getDate() + 1);

		            return {
		                id: task.TASK_ID,
		                title: task.TITLE,
		                start: task.START_DATE,
		                end: endDate.toISOString().split('T')[0],
		                allDay: true,

		                backgroundColor:
		                    task.STATUS === 'DONE'
		                        ? '#10B981'
		                        : task.STATUS === 'IN_PROGRESS'
		                            ? '#06B6D4'
		                            : '#F59E0B',

		                borderColor: 'transparent'
		            };
		        });

		    if (calendar) {
		        calendar.destroy();
		    }

		    calendar = new FullCalendar.Calendar(calendarEl, {
		        initialView: 'dayGridMonth',
		        locale: 'ko',

		        headerToolbar: {
		            left: 'prev,next today',
		            center: 'title',
		            right: 'dayGridMonth'
		        },

		        events: events,

		        selectable: true,

		        select: function(info) {

		            openAddTaskModal();

		            document.getElementById('taskStartDate').value =
		                info.startStr;

		            let endDate = new Date(info.endStr);
		            endDate.setDate(endDate.getDate() - 1);

		            document.getElementById('taskEndDate').value =
		                endDate.toISOString().split('T')[0];
		        },

		        eventClick: function(info) {
		            openTaskDetailModal(info.event.id);
		        }
		    });

		    calendar.render();
		}
		// 탭 클릭 시 달력 다시 그리기
		
		document.addEventListener('DOMContentLoaded', function() {
		            loadKanbanBoard();
		            
		            document.querySelectorAll('button[data-bs-toggle="tab"], a[data-bs-toggle="tab"]').forEach(tab => {
		                tab.addEventListener('shown.bs.tab', (e) => {
		                    if (e.target.getAttribute('href') === '#calendarBoard') {
		                        // 기존 calendar 객체가 있다면 render 호출
		                        if(typeof calendar !== 'undefined') calendar.render();
		                    }
		                });
		            });
		        });
				function drag(ev) {
				    ev.dataTransfer.setData("text", ev.target.id);
				}
				function drop(ev) {

				    ev.preventDefault();

				    const draggedId =
				        ev.dataTransfer.getData("text");

				    const draggedCard =
				        document.getElementById(draggedId);

				    // 기존 상태 확인
				    const oldListId =
				        draggedCard.parentElement.id;

				    let oldStatus = "";

				    if(oldListId === "todo-list")
				        oldStatus = "TODO";

				    else if(oldListId === "inprogress-list")
				        oldStatus = "IN_PROGRESS";

				    else if(oldListId === "done-list")
				        oldStatus = "DONE";

				    const targetList =
				        ev.currentTarget;

				    targetList.appendChild(draggedCard);

				    const taskId =
				        draggedId.replace("task-", "");

				    let newStatus = "";

				    if(targetList.id === "todo-list")
				        newStatus = "TODO";

				    else if(targetList.id === "inprogress-list")
				        newStatus = "IN_PROGRESS";

				    else if(targetList.id === "done-list")
				        newStatus = "DONE";

				    // 숫자 갱신
				    updateBoardCounts(oldStatus, newStatus);

				    updateTaskStatus(taskId, newStatus);
				}
				// 3. 드롭 허용 함수
				function allowDrop(ev) {
				    ev.preventDefault(); // 기본 동작 방지
				}

		
				function updateTaskStatus(taskId, newStatus) {
				    // 1. URLSearchParams를 사용하여 form-data 형태로 구성
				    const params = new URLSearchParams();
				    params.append('taskId', taskId);
				    params.append('status', newStatus);

				    // 2. fetch 전송 (POST 요청)
				    fetch('/project/api/update-task-status', {
				        method: 'POST',
				        headers: {
				            'Content-Type': 'application/x-www-form-urlencoded' // 중요!
				        },
				        body: params.toString() // 데이터를 쿼리스트링 형태로 변환
				    })
				    .then(res => {
				        if (!res.ok) throw new Error('서버 응답 오류');
				        return res.text();
				    })
				    .then(result => {
				        if (result === 'SUCCESS') {
				            console.log("상태 업데이트 성공");
				            // location.reload(); // 성공 시 리로드
				        } else {
				            alert('상태 업데이트 실패');
				        }
				    })
				    .catch(err => {
				        console.error("통신 실패:", err);
				    });
				}
				function updateBoardCounts(oldStatus, newStatus) {
				    const countMap = {
				        "TODO": document.getElementById("todo-count"),
				        "IN_PROGRESS": document.getElementById("progress-count"),
				        "DONE": document.getElementById("done-count")
				    };

				    // 기존 컬럼 -1
				    if (countMap[oldStatus]) {
				        let count = parseInt(countMap[oldStatus].innerText) || 0;
				        countMap[oldStatus].innerText = count - 1;
				    }

				    // 새 컬럼 +1
				    if (countMap[newStatus]) {
				        let count = parseInt(countMap[newStatus].innerText) || 0;
				        countMap[newStatus].innerText = count + 1;
				    }
				}
				// 기존의 loadBoard 함수를 지우고 아래 코드를 사용하세요
				// 기존의 loadBoard 함수를 아래 코드로 수정하세요.
				// [이 함수를 기존 loadBoard 함수 자리에 덮어쓰세요]
				function loadBoard(boardType) {
				    const projId = new URLSearchParams(window.location.search).get('projId');
				    
				    // 💡 핵심: 컨트롤러(@RequestMapping("/project") + @GetMapping("/api/board-list"))와 일치시킴!
				    const url = '/project/api/board-list?projId=' + projId + '&boardType=' + boardType;
				    
				    const targetDiv = document.getElementById(boardType.toLowerCase() + 'Board');
				    
				    fetch(url)
				        .then(res => {
				            if (!res.ok) throw new Error("HTTP error " + res.status);
				            return res.json();
				        })
				        .then(data => {
				            let html = `<table class="table table-hover mt-3">
				                            <thead><tr><th>번호</th><th>제목</th><th>작성자</th><th>날짜</th></tr></thead>
				                            <tbody>`;
				            
				            // 데이터가 없거나 배열이 아닐 경우 예외처리
				            if (!data || !Array.isArray(data) || data.length === 0) {
				                html += '<tr><td colspan="4" class="text-center">등록된 프로젝트 게시글이 없습니다.</td></tr>';
				            } else {
				                data.forEach(post => {
				                    html += `<tr>
				                                <td>${post.postId}</td>
				                                <td><a href="/project/board/detail?postId=${post.postId}&projId=${projId}">${post.title}</a></td>
				                                <td>${post.writerName}</td>
				                                <td>${post.regDt}</td>
				                            </tr>`;
				                });
				            }
				            html += `</tbody></table>`;
				            
				            // 더보기 버튼 추가
				            html += `<div class="text-end">
				                        <a href="/project/board/list?projId=${projId}&type=${boardType}" class="btn btn-sm btn-outline-primary">더보기 +</a>
				                     </div>`;
				            
				            targetDiv.innerHTML = html;
				        })
				        .catch(err => {
				            console.error("게시판 로딩 오류:", err);
				            targetDiv.innerHTML = '<p class="text-danger p-3">데이터를 불러오는 중 오류가 발생했습니다. (관리자에게 문의하세요)</p>';
				        });
				}
				function loadAllWidgets(projId) {
				    fetch(`/api/workspace/project/${projId}/dashboard-widgets`)
				        .then(res => res.json())
				        .then(data => {
				            // data.notice, data.free, data.file 각각에 대해 반복문 수행
				            renderWidget('noticeBoard', data.notice, projId, 'NOTICE');
				            renderWidget('freeBoard', data.free, projId, 'FREE');
				            renderWidget('fileBoard', data.file, projId, 'FILE');
				        });
				}

				// 위젯 렌더링 공통 함수
				function renderWidget(elementId, list, projId, type) {
				    const target = document.getElementById(elementId);
				    if (!list || list.length === 0) {
				        target.innerHTML = '<p class="p-3 text-muted">등록된 글이 없습니다.</p>';
				        return;
				    }
				    
				    let html = '<table class="table table-hover"><tbody>';
				    list.slice(0, 5).forEach(post => {
				        html += `<tr><td><a href="/group/board/detail?postId=${post.postId}&wsId=...">${post.title}</a></td></tr>`;
				    });
				    html += '</tbody></table>';
				    
				    // 더보기 버튼 (워크스페이스 방식)
				    if (list.length >= 5) {
				        html += `<div class="text-end p-2"><a href="/group/board/list?wsId=...&type=${type}" class="btn btn-sm btn-link">더보기 +</a></div>`;
				    }
				    target.innerHTML = html;
				}
    </script>
</head>
<body>

    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    
    <div class="container" style="max-width: 1280px; margin: 30px auto; padding: 0 20px;">
		<div class="ws-hero" style="background: #fff; padding: 30px 40px; border-radius: 20px; border: 1px solid #eef0f2; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.01);">
		    <div class="d-flex justify-content-between align-items-center">
		        <div>
		            <h1 class="fw-bold" style="font-size: 26px;">${projectDetail.projName}</h1>
		            <p class="text-muted">${projectDetail.projDesc}</p>
		        </div>
		        
		        <div class="d-flex gap-2">
		            <c:if test="${projectDetail.leaderId == sessionScope.user.userId}">
		                <button class="btn btn-outline-secondary" onclick="openEditProjectModal()">수정</button>
		                <button class="btn btn-outline-danger" onclick="deleteProject()">삭제</button>
		            </c:if>
		        </div>
		    </div>
		</div>
		<div class="section-card mb-4">
		    <div class="d-flex justify-content-between align-items-center mb-3">
		        <h5 class="mb-0">📅 프로젝트 타임라인</h5>
		        <span class="text-muted small">💡 달력을 선택하여 새 업무를 추가하세요</span>
		    </div>
		    <div id="calendar" style="width: 100%; height: 400px;"></div>
		</div>
		
		<ul class="nav nav-tabs mb-4" id="projectTabs">
		    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#taskBoard">업무 보드</a></li>
		    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#noticeBoard" onclick="loadBoard('NOTICE')">공지사항</a></li>
		    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#freeBoard" onclick="loadBoard('FREE')">자유게시판</a></li>
		    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#fileBoard" onclick="loadBoard('FILE')">자료실</a></li>
		</ul>

		<div class="tab-content">
		    <div class="tab-pane fade show active" id="taskBoard">
		        <div class="dashboard-container">
		            <div class="kanban-column">
						<div class="header-card" style="background: #F59E0B;">
						    <h6>할 일</h6>
						    <h3 id="todo-count">${taskSummary.TODO_CNT != null ? taskSummary.TODO_CNT : 0}</h3>
						</div>
		               <div id="todo-list" class="list-area" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
		            </div>
		            <div class="kanban-column">
						<div class="header-card" style="background: #06B6D4;">
						    <h6>진행 중</h6>
						    <h3 id="progress-count">${taskSummary.IN_PROGRESS_CNT != null ? taskSummary.IN_PROGRESS_CNT : 0}</h3>
						</div>
		                <div id="inprogress-list" class="list-area" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
		            </div>
		            <div class="kanban-column">
						<div class="header-card" style="background: #10B981;">
						    <h6>완료</h6>
						    <h3 id="done-count">${taskSummary.DONE_CNT != null ? taskSummary.DONE_CNT : 0}</h3>
						</div>
		               <div id="done-list" class="list-area" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
		            </div>
		            <div class="kanban-column"> 
		                <div class="header-card" style="background: #6B7280;"><h6>참여 멤버</h6><h3>${projectMemberList.size()}</h3></div>
		                <div class="list-area" style="background: #fff; border: 1px solid #eef0f2;">
		                    <button onclick="openAssignModal()" class="btn btn-sm btn-primary w-100 mb-3">+ 멤버 추가</button>
		                    <div class="member-list">
		                        <c:forEach var="member" items="${projectMemberList}">
		                            <div class="member-item">
		                                <div class="avatar">${member.USER_NAME.substring(0,1)}</div>
		                                <div class="small fw-bold">${member.USER_NAME}</div>
		                            </div>
		                        </c:forEach>
		                    </div>
		                </div>
		            </div>
		        </div>
		    </div>
		    
		    <div class="tab-pane fade" id="noticeBoard">
		        <div class="section-card mt-4">공지사항 게시판 목록이 여기에 표시됩니다.</div>
		    </div>
		    <div class="tab-pane fade" id="freeBoard">
		        <div class="section-card mt-4">자유게시판 목록이 여기에 표시됩니다.</div>
		    </div>
		    <div class="tab-pane fade" id="fileBoard">
		        <div class="section-card mt-4">자료실 목록이 여기에 표시됩니다.</div>
		    </div>
		</div>

      

    <div class="modal fade" id="assignMemberModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header"><h5 class="modal-title">멤버 초대</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                <div class="modal-body"><div id="assignableList" class="list-group"></div></div>
                <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">취소</button><button class="btn btn-primary" onclick="submitAssign()">추가</button></div>
            </div>
        </div>
    </div>
	<div class="modal fade" id="addTaskModal" tabindex="-1">
	    <div class="modal-dialog">
	        <div class="modal-content">
	            <div class="modal-header">
	                <h5 class="modal-title">업무 정보</h5>
	                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
	            </div>
				<div class="modal-body">
				    <label class="small text-muted">업무 제목</label>
				    <input type="text" id="taskTitle" class="form-control mb-2" placeholder="업무 제목을 입력하세요" readonly>
				    
				    <label class="small text-muted">시작일</label>
				    <input type="date" id="taskStartDate" class="form-control mb-2" readonly>
				    
				    <label class="small text-muted">종료일</label>
				    <input type="date" id="taskEndDate" class="form-control mb-2" readonly>
				    
				    <label class="small text-muted">상태</label>
				    <select id="taskStatus" class="form-select" disabled>
				        <option value="TODO">할 일</option>
				        <option value="IN_PROGRESS">진행 중</option>
				        <option value="DONE">완료</option>
				    </select>
				</div>
	            <div class="modal-footer">
	                <button class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
					<button class="btn btn-danger" id="deleteBtn" onclick="deleteTask()" style="display:none;">삭제</button>
					<button class="btn btn-warning" id="editBtn" onclick="enableEdit()" style="display:none;">수정하기</button>
	                
	                <button class="btn btn-primary" id="saveBtn" style="display:none;">저장</button>
	                
	                <button class="btn btn-primary" id="addBtn" style="display:none;" onclick="addTask()">추가</button>
	            </div>
	        </div>
	    </div>
	</div>
	<div class="modal fade" id="editProjectModal" tabindex="-1" aria-hidden="true">
	    <div class="modal-dialog modal-lg">
	        <div class="modal-content">
	            <div class="modal-header">
	                <h5 class="modal-title">프로젝트 수정</h5>
	                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
	            </div>
	            <div class="modal-body">
	                <div class="mb-3">
	                    <label class="fw-bold">프로젝트 명</label>
	                    <input type="text" id="editProjName" class="form-control" value="${projectDetail.projName}">
	                </div>
	                <div class="mb-3">
	                    <label class="fw-bold">프로젝트 유형</label>
	                    <select id="editProjType" class="form-select">
	                        <option value="EVENT" ${projectDetail.projType == 'EVENT' ? 'selected' : ''}>행사/이벤트</option>
	                        <option value="TASK" ${projectDetail.projType == 'TASK' ? 'selected' : ''}>업무 프로젝트</option>
	                    </select>
	                </div>
	                <div class="row mb-3">
	                    <div class="col">
	                        <label class="fw-bold">시작일</label>
							<input type="date" id="editStartDate" class="form-control" 
							       value="${projectDetail.startDate}">
	                    </div>
	                    <div class="col">
	                        <label class="fw-bold">종료일</label>
							<input type="date" id="editEndDate" class="form-control" 
							       value="${projectDetail.endDate}">
	                    </div>
	                </div>
	                <div class="mb-3">
	                    <label class="fw-bold">프로젝트 설명</label>
	                    <textarea id="editProjDesc" class="form-control" rows="3">${projectDetail.projDesc}</textarea>
	                </div>
	            </div>
	            <div class="modal-footer">
	                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
	                <button type="button" class="btn btn-primary" onclick="updateProject()">저장</button>
	            </div>
	        </div>
	    </div>
	</div>

</body>
</html>