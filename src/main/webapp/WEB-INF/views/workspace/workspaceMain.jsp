<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🎈 ${workspace.wsName} 그룹 대시보드</title>
    <style>
        /* 대시보드 전체를 감싸는 유연한 뼈대 */
        .dashboard-container { 
            display: flex; 
            gap: 25px; 
            width: 100%;
            box-sizing: border-box;
            align-items: flex-start;
        }
        
        /* 왼쪽 메인 영역 (진행 중인 이벤트 + 하단 위젯 피드) */
        .main-content { 
            flex: 3; 
            display: flex; 
            flex-direction: column; 
            gap: 25px; 
            min-width: 0;
        }
        
        /* 오른쪽 고정형 사이드바 영역 (미니 달력 + 멤버 목록) */
        .side-content { 
            flex: 1; 
            min-width: 320px; 
            max-width: 360px;
            background: #f8f9fa; 
            border-radius: 16px; 
            padding: 25px; 
            border: 1px solid #eef0f2; 
            box-sizing: border-box;
        }
        
        /* 공통 카드 스타일 */
        .section-card { 
            background: #ffffff; 
            border-radius: 16px; 
            padding: 25px; 
            border: 1px solid #eef0f2; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.01); 
            box-sizing: border-box;
        }
        
        /* 하단 게시판 위젯 그리드 (반반 정렬) */
        .widget-grid { 
            display: flex; 
            gap: 20px; 
            width: 100%;
        }
        .widget-card { 
            flex: 1; 
            background: #ffffff; 
            border-radius: 16px; 
            border: 1px solid #eef0f2; 
            padding: 25px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.01);
            box-sizing: border-box;
            min-width: 0;
        }
        
        /* 미니 달력 상세 스타일 */
        .mini-calendar {
            background: #ffffff;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 25px;
            border: 1px solid #eef0f2;
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: 14px;
            color: #222;
            margin-bottom: 15px;
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 6px;
            text-align: center;
            font-size: 12px;
        }
        .day-name { font-weight: bold; color: #777; padding-bottom: 5px; }
		.day-num {
		    padding: 6px 0;
		    border-radius: 6px;
		    color: #333;
		    cursor: pointer;
		    font-weight: 500;

		    position: relative;
		    height: 28px;
		    line-height: 28px;
		}
        .day-num:hover { background: #e2f0fe; color: #4A90E2; }
		.day-num.today {
		    background: #4A90E2;
		    color: white !important;
		    font-weight: bold;
		}
		.day-num.has-event {
		    position: relative;
		    font-weight: bold;
		    color: #4A90E2;
		}
		.day-num.today.has-event {
		    color: white !important;
		}
		.day-num.has-event::after {
		    content: '';
		    position: absolute;
		    bottom: 1px;
		    left: 50%;
		    transform: translateX(-50%);
		    width: 4px;
		    height: 4px;
		    background: currentColor;
		    border-radius: 50%;
		}
        
        /* 게시판 UI 리스트 요소 스타일 */
		.board-title { 
		    display: flex; 
		    justify-content: space-between; 
		    align-items: center; 
		    margin-bottom: 15px; 
		    font-size: 16px; 
		    border-bottom: 2px solid #333; 
		    padding-bottom: 8px; 
		}

		/* 제목 텍스트 */
		.board-title span {
		    font-weight: bold; 
		    color: #333;
		}

		/* 더보기 링크 */
		.board-title a { 
		    font-size: 12px; 
		    color: #888; 
		    text-decoration: none; 
		    white-space: nowrap; /* 줄바꿈 방지 */
		    flex-shrink: 0;      /* 레이아웃 변형 방지 */
		    margin-left: 10px;   /* 제목과 간격 */
		}

		.board-title a:hover {
		    color: #4A90E2;
		}
        .board-list { list-style: none; padding: 0; margin: 0; }
        .board-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f8f9fa; font-size: 14px; }
        .board-item a { text-decoration: none; color: #333; max-width: 75%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-flex; align-items: center; }
        .board-item a:hover { color: #4A90E2; }
        .board-date { color: #aaa; font-size: 12px; flex-shrink: 0; }
        
        .reply-badge { background: #e2f0fe; color: #4A90E2; padding: 2px 6px; border-radius: 8px; font-size: 11px; font-weight: bold; margin-left: 6px; }
        .pin-badge { background: #ffebee; color: #ff1744; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 6px; flex-shrink: 0; }
		/* 📅 일정 등록 모달 정밀 스타일 */
		.event-modal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px; border-radius: 16px; z-index: 1000; width: 360px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #eef0f2; }
		.modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 999; }
		.modal-field { margin-bottom: 15px; }
		.modal-field label { display: block; font-size: 13px; font-weight: bold; color: #444; margin-bottom: 6px; }
		.modal-field input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
		.btn-modal-submit { width: 100%; padding: 12px; background: #4A90E2; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        /* 이벤트 그리드 영역 */
        .event-grid { display: flex; flex-wrap: wrap; gap: 15px; }
        .event-card { border: 1px solid #eef0f2; padding: 20px; border-radius: 12px; width: calc(50% - 8px); box-sizing: border-box; background: #fff; transition: transform 0.2s, box-shadow 0.2s; }
        .event-card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.04); }
    </style>
    <script>
		const today = new Date();
		
		let myWorkspaceDate = new Date(
		    today.getFullYear(),
		    today.getMonth(),
		    1
		);
		let currentPollId = null;
		
		function loadDashboardWidgets() {
		    const wsId = "${workspace.wsId}";
		    
		    // 1. 공지사항 및 게시판 로딩
		    fetch('/api/workspace/' + wsId + '/dashboard-widgets')
		        .then(res => res.json())
		        .then(data => {
		            renderWidget('noticeList', data.notices, 'NOTICE');
		            renderWidget('freeList', data.freeBoards, 'FREE');
					renderWidget('fileList', data.fileBoards, 'FILE'); 
		        });

		    // 2. 오늘의 일정 로딩
		    fetch('/workspace/api/' + wsId + '/today-events')
		        .then(res => res.json())
		        .then(data => {
		            const listEl = document.getElementById('todayScheduleList');
		            listEl.innerHTML = data.length > 0 ? 
		                data.map(ev => `<li style="padding: 5px 0; border-bottom: 1px solid #f8f9fa;">${ev.title} <span style="float:right; color:#888;">${ev.time}</span></li>`).join('') 
		                : '<li style="color:#bbb; text-align:center; margin-top:20px;">오늘 예정된 일정이 없습니다.</li>';
		        });

		    // 3. 투표 로딩 함수 호출 (추가된 부분)
		    loadActivePoll(); 
		}

		function renderWidget(targetId, list, type) {

		    const targetUl = document.getElementById(targetId);

		    targetUl.innerHTML = '';

		    if (!list || list.length === 0) {

		        targetUl.innerHTML =
		            '<li class="board-item" style="color:#999; justify-content:center; padding:20px 0;">등록된 게시글이 없습니다.</li>';

		        return;
		    }

		    list.forEach(function(post) {

		        const li = document.createElement('li');

		        li.className = 'board-item';

		        let pinSpan = '';

		        if (post.isPinned === 'Y' && type === 'NOTICE') {
		            pinSpan =
		                '<span class="pin-badge">필독</span>';
		        }

		        let replySpan = '';

		        if (post.replyCount > 0) {
		            replySpan =
		                '<span class="reply-badge">' +
		                post.replyCount +
		                '</span>';
		        }

		        li.innerHTML =
		            '<a href="/group/board/detail?postId=' +
		            post.postId +
		            '&wsId=' +
		            post.wsId +
		            '">' +
		            pinSpan +
		            post.title +
		            replySpan +
		            '</a>' +
		            '<span class="board-date">' +
		            post.regDt +
		            '</span>';

		        targetUl.appendChild(li);
		    });
		}

        function searchUser() {
            const emailInput = document.getElementById('searchEmail');
            const email = emailInput.value.trim();
            const userListDiv = document.getElementById('userList');
            if (email.length < 2) { alert("검색어를 2자 이상 입력해주세요."); return; }
            
            fetch('/workspace/api/search-member?email=' + encodeURIComponent(email))
                .then(res => res.json())
                .then(data => {
                    userListDiv.innerHTML = ''; 
                    if (data.length === 0) { userListDiv.innerHTML = '<p style="padding:10px;">검색 결과가 없습니다.</p>'; return; }
                    data.forEach(user => {
                        const userItem = document.createElement('div');
                        userItem.style = "border-bottom: 1px solid #eee; padding: 10px; display: flex; justify-content: space-between; align-items: center;";
                        userItem.innerHTML = `
                            <span>\${user.userName} (\${user.email})</span>
                            <button type="button" onclick="inviteUser('\${user.email}')" style="padding: 5px 10px; cursor:pointer;">초대</button>
                        `;
                        userListDiv.appendChild(userItem);
                    });
                });
        }

		function openInviteModal() {
		    const modal = document.getElementById('inviteModal');
		    const overlay = document.getElementById('inviteOverlay');
		    
		    // modal과 overlay가 존재하는지 먼저 확인
		    if (modal && overlay) {
		        const isVisible = (modal.style.display === 'block');
		        
		        // 반대 상태로 전환
		        modal.style.display = isVisible ? 'none' : 'block';
		        overlay.style.display = isVisible ? 'none' : 'block';
		    } else {
		        console.error("초대 모달 요소를 찾을 수 없습니다. HTML 구조를 확인하세요.");
		    }
		}

        // 🚨 윤재 님의 원래 API 경로인 /workspace/api/ 규칙 유지
        function inviteUser(inviteeEmail) {
            const wsId = "${workspace.wsId}";
            fetch('/workspace/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wsId: parseInt(wsId), email: inviteeEmail })
            })
            .then(res => res.json())
            .then(result => {
                if(result.status === 'SUCCESS') { alert('초대장을 보냈습니다!'); openInviteModal(); } 
                else if(result.status === 'ALREADY_EXISTS') { alert('이미 멤버이거나 초대 대기 중인 사용자입니다.'); }
            });
        }

        function removeMember(userId, userName) {
            if(!confirm("정말 " + userName + " 님을 그룹에서 제외하시겠습니까?")) return;
            const wsId = "${workspace.wsId}";
            const params = new URLSearchParams();
            params.append('wsId', wsId);
            params.append('userId', userId);

           fetch('/workspace/api/remove-member', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params })
            .then(res => res.text()).then(result => { if(result === 'success') { alert('제외 완료되었습니다.'); location.reload(); } });
        }

        function transferAdmin(userId, userName) {
            if(!confirm("정말 " + userName + " 님에게 리더 권한을 넘기시겠습니까?\n위임 후에는 관리자 기능을 사용할 수 없습니다.")) return;
            const wsId = "${workspace.wsId}";
            const params = new URLSearchParams();
            params.append('wsId', wsId);
            params.append('newAdminId', userId);

            fetch('/workspace/api/transfer-admin', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params })
            .then(res => res.text()).then(result => { if(result === 'success') { alert('리더 권한이 위임되었습니다.'); location.reload(); } });
        }

		function leaveWorkspace() {
		    if(!confirm("정말 이 그룹을 탈퇴하시겠습니까?")) return;
		    const wsId = "${workspace.wsId}";
		    const params = new URLSearchParams();
		    params.append('wsId', wsId);

		    fetch('/workspace/api/leave', { 
		        method: 'POST', 
		        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
		        body: params 
		    })
		    .then(res => res.text())
		    .then(result => { 
		        if(result === 'SUCCESS') { 
		            alert('탈퇴 완료되었습니다.'); 
		            
		            // 💡 여기서 경로를 변경하세요!
		            // 1. 달력 페이지로 보내고 싶다면:
		            location.href = '/calendar'; 
		            
		            // 2. 만약 그룹 목록 페이지가 더 익숙하다면 (권장):
		            // location.href = '/workspace/list'; 
		        } else {
		            alert('탈퇴 처리 중 오류가 발생했습니다.');
		        }
		    });
		}
		// [수정된 부분: loadCalendarEvents 함수 내]
		function loadCalendarEvents() {
		    const wsId = "${workspace.wsId}";
		    fetch('/api/workspace/' + wsId + '/calendar-events')
		        .then(res => res.json())
		        .then(data => {
		            const currentYear = myWorkspaceDate.getFullYear();
		            const currentMonth = myWorkspaceDate.getMonth() + 1;

		            data.forEach(event => {
		                // 🚨 핵심 수정: 캘린더 표시 조건 추가 (TYPE이 'NOTICE'인 경우 제외)
		                if (event.TYPE === 'NOTICE') return; // 공지사항이면 캘린더에 표시하지 않고 건너뜀

		                const dateStr = event.EVENT_DATE; 
		                if (!dateStr) return; 

		                const dateParts = dateStr.split('-');
		                const eventYear = parseInt(dateParts[0], 10);
		                const eventMonth = parseInt(dateParts[1], 10);
		                const eventDay = parseInt(dateParts[2], 10);

		                if (eventYear === currentYear && eventMonth === currentMonth) {
		                    const dayCells = document.querySelectorAll('.day-num');
		                    dayCells.forEach(cell => {
		                        if (parseInt(cell.innerText) === eventDay) {
		                            cell.classList.add('has-event');
		                            const title = event.TITLE || "일정"; 
		                            cell.setAttribute('title', title);
		                            cell.onclick = function() { alert(title + " 일정이 있습니다."); };
		                        }
		                    });
		                }
		            });
		        })
		        .catch(err => console.error("캘린더 로딩 에러:", err));
		}
		// [수정된 달력 생성 함수]
		function generateCalendar() {

		    const grid = document.getElementById('calendarGrid');
		    const title = document.getElementById('calendarTitle');

		    const currentYear = myWorkspaceDate.getFullYear();
		    const currentMonth = myWorkspaceDate.getMonth();

		    title.textContent = currentYear + "년 " + (currentMonth + 1) + "월";

		    grid.querySelectorAll('.day-num, .empty-slot')
		        .forEach(el => el.remove());

		    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
		    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

		    for(let i = 0; i < firstDay; i++) {
		        const emptyDiv = document.createElement('div');
		        emptyDiv.className = 'empty-slot';
		        grid.appendChild(emptyDiv);
		    }

		    for(let d = 1; d <= lastDate; d++) {

		        const div = document.createElement('div');

		        div.className = 'day-num';
		        div.innerText = d;

		        const today = new Date();

		        if(
		            d === today.getDate() &&
		            currentMonth === today.getMonth() &&
		            currentYear === today.getFullYear()
		        ) {
		            div.classList.add('today');
		        }

		        grid.appendChild(div);
		    }
		}

		function changeMonth(delta) {

		    myWorkspaceDate = new Date(
		        myWorkspaceDate.getFullYear(),
		        myWorkspaceDate.getMonth() + delta,
		        1
		    );

		    generateCalendar();
		    loadCalendarEvents();
		}
		// 기존 DOMContentLoaded에 추가
		document.addEventListener("DOMContentLoaded", function() {
		    loadDashboardWidgets();
		    generateCalendar();     // 1. 먼저 달력 격자를 생성하고
		    loadCalendarEvents();   // 2. 그 위에 데이터를 얹어야 합니다.
		});
		// [모달 제어 함수]
		// 기존 모달을 여는 대신, 파라미터를 들고 전체 캘린더 페이지로 이동시킵니다.
		function openCalendarModal() {
		    const wsId = "${workspace.wsId}";
		    // calendar.jsp로 이동하면서 현재 워크스페이스 ID와 그룹 일정 등록 모드(예: mode=group)를 전달
		    location.href = "${pageContext.request.contextPath}/calendar?wsId=" + wsId + "&mode=GROUP_REG";
		}

		function closeCalendarModal() {
		    document.getElementById('calendarModal').style.display = 'none';
		    document.getElementById('modalOverlay').style.display = 'none';
		    
		    // 대시보드 모달 내부의 input ID인 eventTitle 초기화
		    document.getElementById('eventTitle').value = '';
		}

		// [방장 전용 비동기 일정 등록 연동]
		function submitGroupEvent() {
		    const titleInput = document.getElementById('eventTitle');
		    const dateInput = document.getElementById('eventDate');
		    
		    const title = titleInput ? titleInput.value.trim() : '';
		    const eventDate = dateInput ? dateInput.value : '';
		    const wsId = "${workspace.wsId}";

		    if (!title) return alert("일정 명칭을 입력해 주세요.");
		    if (!eventDate) return alert("날짜를 선택해 주세요.");

		    // 오라클 및 기존 API 스펙에 맞춘 간결한 데이터 바인딩
		    const data = {
		        wsId: parseInt(wsId),
		        title: title,
		        eventDate: eventDate 
		    };

		    fetch('/api/workspace/' + wsId + '/calendar-events/register', {
		        method: 'POST',
		        headers: { 'Content-Type': 'application/json' },
		        body: JSON.stringify(data)
		    })
		    .then(res => {
		        if (!res.ok) throw new Error("일정 서버 저장 실패");
		        return res.json();
		    })
		    .then(result => {
		        alert("새로운 그룹 일정이 등록되었습니다.");
		        closeCalendarModal();
		        
		        // 화면 리로드 없이 미니달력 격자 재생성 및 이벤트 즉시 리로드
		        generateCalendar();
		        loadCalendarEvents();
		    })
		    .catch(err => {
		        console.error("일정 등록 에러:", err);
		        alert("일정 저장 중 오류가 발생했습니다.");
		    });
		}
		let workspaceActivePollId = null;

		function loadActivePoll() {
		    const wsId = "${workspace.wsId}";
            const area = document.getElementById('activePollArea');

            if (!area) return;

		    fetch('/api/polls/active?scope=WORKSPACE&wsId=' + encodeURIComponent(wsId))
		        .then(function(res) {
                    if (!res.ok) throw new Error('투표 API 응답 오류: ' + res.status);
                    return res.json();
                })
		        .then(function(data) {
		            if (!data || !data.question) {
                        workspaceActivePollId = null;
		                area.innerHTML =
                            '<p style="color:#aaa; text-align:center; font-size:13px; margin:20px 0 8px;">진행 중인 투표가 없습니다.</p>' +
                            '<div style="text-align:center;"><a href="/poll/list?scope=WORKSPACE&wsId=' + encodeURIComponent(wsId) + '" style="color:#4A90E2; font-size:12px; font-weight:900; text-decoration:none;">투표 만들기 / 더보기</a></div>';
		                return;
		            }

                    workspaceActivePollId = data.pollId;

                    const options = Array.isArray(data.options) ? data.options : [];
                    const showResults = !!data.showResults;
                    const isClosed = !!data.isClosed;
                    const myOptionId = data.myOptionId;
                    const total = showResults ? options.reduce(function(sum, option) {
                        return sum + Number(option.COUNT || option.count || 0);
                    }, 0) : 0;

                    let html = '';
                    html += '<div style="font-weight:900; margin-bottom:7px; color:#111827;">' + escapeWorkspacePollHtml(data.question) + '</div>';
                    html += '<div style="color:#94a3b8; font-size:11px; font-weight:800; margin-bottom:8px;">' + formatWorkspacePollDeadline(data.endDt, isClosed);
                    if (showResults) {
                        html += ' · 총 ' + total + '표';
                    } else {
                        html += ' · 투표 전 결과 비공개';
                    }
                    html += '</div>';

                    options.forEach(function(option) {
                        const optionId = option.OPTION_ID || option.optionId;
                        const text = option.TEXT || option.text || '';
                        const imagePath = option.IMAGE_PATH || option.imagePath || '';
                        const count = option.COUNT || option.count || 0;
                        const selected = String(myOptionId || '') === String(optionId || '');

                        html += '<button type="button" onclick="voteWorkspacePoll(' + optionId + ')" ' + (isClosed ? 'disabled' : '') + ' style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:center; width:100%; margin:6px 0; padding:8px 10px; border:1px solid ' + (selected ? '#4A90E2' : '#e4ebf2') + '; border-radius:11px; background:#fff; cursor:' + (isClosed ? 'not-allowed' : 'pointer') + '; text-align:left; font-family:inherit;">';
                        html += '   <span style="min-width:0; display:flex; align-items:center; gap:8px;">';
                        if (imagePath) {
                            html += '       <img src="' + escapeWorkspacePollHtml(imagePath) + '" alt="" style="width:44px; height:34px; object-fit:cover; border-radius:8px; background:#f8fafc;">';
                        }
                        html += '       <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; font-weight:900; color:#334155;">' + escapeWorkspacePollHtml(text || '이미지 선택지') + '</span>';
                        html += '   </span>';
                        if (showResults) {
                            html += '   <span style="padding:2px 7px; border-radius:999px; background:#eef6ff; color:#2563eb; font-size:11px; font-weight:900;">' + count + '표</span>';
                        }
                        html += '</button>';
                    });

                    area.innerHTML = html;
		        })
		        .catch(function(err) {
		            console.error('워크스페이스 투표 로딩 실패:', err);
		            area.innerHTML = '<p style="color:#ef4444; text-align:center; font-size:13px;">투표를 불러오지 못했습니다.</p>';
		        });
		}

        function formatWorkspacePollDeadline(value, isClosed) {
            if (isClosed) return '투표 종료';
            if (!value) return '마감 없음';

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return String(value).substring(0, 16) + ' 마감';

            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');

            return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ' 마감';
        }

		function voteWorkspacePoll(optionId) {
            if (!workspaceActivePollId || !optionId) {
                alert('투표 정보를 찾을 수 없습니다.');
                return;
            }

		    fetch('/api/polls/vote', {
		        method: 'POST',
		        headers: { 'Content-Type': 'application/json' },
		        body: JSON.stringify({
		            pollId: workspaceActivePollId,
		            optionId: optionId
		        })
		    })
            .then(function(res) {
                if (!res.ok) throw new Error('투표 저장 실패: ' + res.status);
                return res.json();
            })
            .then(function(result) {
                if (!result || result.success === false) {
                    alert(result && result.message === 'LOGIN_REQUIRED' ? '로그인이 필요합니다.' : '투표 반영에 실패했습니다.');
                    return;
                }
                loadActivePoll();
            })
            .catch(function(err) {
                console.error('워크스페이스 투표 반영 실패:', err);
                alert('투표 반영 중 오류가 발생했습니다.');
            });
		}

        function escapeWorkspacePollHtml(value) {
            return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }
    </script>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    
    <div class="container" style="max-width: 1280px; margin: 0 auto; padding: 30px 20px;">
        <c:set var="isWorkspaceAdmin" value="false" />
        <c:forEach var="m" items="${memberList}">
            <c:if test="${m.USER_ID == user.userId && m.WS_ROLE == 'ADMIN'}">
                <c:set var="isWorkspaceAdmin" value="true" />
            </c:if>
        </c:forEach>

        <div class="ws-hero" style="background: #fff; padding: 30px 40px; border-radius: 20px; border: 1px solid #eef0f2; margin-bottom: 30px; display: flex; gap: 30px; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.01); box-sizing: border-box; width: 100%;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background: #f8f9fa; border: 1px solid #e9ecef; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <img src="${workspace.wsImagePath}" alt="그룹 이미지" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='/images/default-ws.png';">
            </div>
            <div style="flex: 1; min-width: 0;">
                <h1 style="margin: 0 0 8px 0; font-size: 26px; color: #111; font-weight: bold;">${workspace.wsName}</h1>
                <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.5;">${workspace.wsDescription}</p>
            </div>
            <c:if test="${isWorkspaceAdmin}">
                <div style="flex-shrink: 0;">
                    <a href="/workspace/settings?wsId=${workspace.wsId}" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; text-decoration: none; color: #495057; font-weight: bold; font-size: 13px;">⚙️ 그룹 설정 관리</a>
                </div>
            </c:if>
        </div>

        <div class="header-area" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 26px; color: #111;">🎈 ${workspace.wsName} 그룹 공간</h2>
            <c:if test="${isWorkspaceAdmin}">
                <button type="button" class="btn-invite" onclick="openInviteModal()" style="padding: 12px 22px; background-color: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(74,144,226,0.2);">👥 새 멤버 초대</button>
            </c:if>
        </div>

        <div class="dashboard-container">
            <div class="main-content">
                <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                    <div class="section-card" style="flex: 2; min-height: 140px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #4A90E2;">🗓 오늘의 일정</h3>
                        <ul id="todayScheduleList" style="list-style: none; padding: 0; margin: 0;"></ul>
                    </div>
					<div class="section-card" style="flex: 1; min-height: 140px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
                            <h3 style="margin:0; font-size:16px; color:#ff9f43;">🗳 진행 중인 투표</h3>
                            <a href="/poll/list?scope=WORKSPACE&wsId=${workspace.wsId}" style="color:#94a3b8; text-decoration:none; font-size:12px; font-weight:800;">더보기</a>
                        </div>
					    <div id="activePollArea">
					        <p style="color:#999; font-size:13px; text-align:center; margin-top:20px;">불러오는 중...</p>
					    </div>
					</div>
                </div>

                <div class="section-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; font-size: 18px; color: #222;">🔥 진행 중인 이벤트</h3>
                        <c:if test="${isWorkspaceAdmin}">
                            <a href="/project/create?wsId=${workspace.wsId}" style="text-decoration: none; color: #4A90E2; font-weight: bold; font-size: 13px;">[+] 이벤트 생성</a>
                        </c:if>
                    </div>
                    <div class="event-grid">
                        <c:choose>
                            <c:when test="${not empty projectList}">
                                <c:forEach var="project" items="${projectList}">
                                    <div class="event-card">
                                        <h4>🎉 ${project.projName}</h4>
                                        <p style="color:#999; font-size:11px;">EVENT NO. ${project.projId}</p>
                                        <a href="/project/main?projId=${project.projId}&wsId=${workspace.wsId}" style="color:#4A90E2; font-weight:bold; font-size:13px;">입장 →</a>
                                    </div>
                                </c:forEach>
                            </c:when>
                            <c:otherwise>
                                <p style="text-align:center; color:#999; padding:20px 0;">진행 중인 이벤트가 없습니다.</p>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </div>

				<div class="widget-grid" style="display: flex; gap: 20px; width: 100%;">
				    <div class="widget-card">
				        <div class="board-title">
				            <span>📢 공지사항</span>
				            <a href="/group/board/list?wsId=${workspace.wsId}&type=NOTICE">더보기</a>
				        </div>
				        <ul id="noticeList" class="board-list"></ul>
				    </div>
				    <div class="widget-card">
				        <div class="board-title">
				            <span>💬 자유 피드</span>
				            <a href="/group/board/list?wsId=${workspace.wsId}&type=FREE">더보기</a>
				        </div>
				        <ul id="freeList" class="board-list"></ul>
				    </div>
				    <div class="widget-card">
				        <div class="board-title">
				            <span style="font-weight:bold;">📁 자료실</span>
				            <a href="/group/board/list?wsId=${workspace.wsId}&type=FILE">더보기</a>
				        </div>
				        <ul id="fileList" class="board-list"></ul>
				    </div>
				</div>
            </div>

            <div class="side-content">
                <div class="mini-calendar">
                    <div class="calendar-header">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="cursor:pointer;" onclick="changeMonth(-1)">◀</span>
                            <span id="calendarTitle"></span>
                            <span style="cursor:pointer;" onclick="changeMonth(1)">▶</span>
                        </div>
                        <span style="font-size:11px; color:#4A90E2; cursor:pointer; font-weight:bold;" onclick="location.href='${pageContext.request.contextPath}/calendar?wsId=${workspace.wsId}'">전체보기 ></span>
                    </div>
                    <div class="calendar-grid" id="calendarGrid">
                        <div class="day-name" style="color: #ff4d4d;">일</div>
                        <div class="day-name">월</div><div class="day-name">화</div>
                        <div class="day-name">수</div><div class="day-name">목</div>
                        <div class="day-name">금</div><div class="day-name" style="color: #4a90e2;">토</div>
                    </div>
                    <c:if test="${isWorkspaceAdmin}">
                        <button type="button" onclick="openCalendarModal()" style="width: 100%; margin-top: 15px; padding: 8px; background-color: #f4f4f4; color: #555; border: 1px dashed #ccc; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;">➕ 그룹 일정 등록</button>
                    </c:if>
                </div>
                
                <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 16px; color: #333;">👥 그룹 멤버 <span style="background: #4A90E2; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 5px;">${memberList.size()}</span></h3>
                <div class="member-list">
                    <c:forEach var="mem" items="${memberList}">
                        <div style="padding: 12px 0; border-bottom: 1px solid #f1f3f5; display: flex; align-items: center; gap: 12px;">
                            <div style="width: 34px; height: 34px; background: #4A90E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; flex-shrink: 0; font-size: 13px;">${mem.USER_NAME.substring(0,1)}</div>
                            <div style="flex: 1; overflow: hidden;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div style="font-weight: bold; font-size: 13px; color: #444;">${mem.USER_NAME}
                                        <c:if test="${mem.WS_ROLE eq 'ADMIN'}"><span style="font-size: 9px; background: #E1F5FE; color: #0288D1; padding: 1px 5px; border-radius: 4px; display: block; margin-top: 2px; width: fit-content;">리더</span></c:if>
                                    </div>
                                    <c:if test="${isWorkspaceAdmin && mem.WS_ROLE ne 'ADMIN'}">
                                        <div style="display: flex; gap: 6px; align-items: center;">
                                            <button type="button" onclick="transferAdmin('${mem.USER_ID}', '${mem.USER_NAME}')" style="background: white; border: 1px solid #ddd; color: #666; cursor: pointer; font-size: 10px; padding: 2px 5px; border-radius: 4px;">위임</button>
                                            <button type="button" onclick="removeMember('${mem.USER_ID}', '${mem.USER_NAME}')" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 10px; font-weight: bold; padding: 0;">제외</button>
                                        </div>
                                    </c:if>
                                </div>
                                <div style="font-size: 11px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px;">${mem.EMAIL}</div>
                            </div>
                        </div>
                    </c:forEach>
                </div>
                <c:if test="${not isWorkspaceAdmin}">
                    <div style="margin-top: 25px; border-top: 1px dashed #e9ecef; padding-top: 15px;">
                        <button type="button" onclick="leaveWorkspace()" style="width: 100%; padding: 10px; background: white; border: 1px solid #ff4d4d; color: #ff4d4d; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px;">🏃 그룹 탈퇴하기</button>
                    </div>
                </c:if>
            </div>
        </div>
    </div>
	<div id="inviteOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:1999;" onclick="openInviteModal()"></div>
	<div id="inviteModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:400px; background:white; padding:25px; border-radius:16px; z-index:2000; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
	    <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
	        <h3 style="margin:0; font-size:18px;">멤버 초대</h3>
	        <button onclick="openInviteModal()" style="border:none; background:none; cursor:pointer; font-size:20px;">&times;</button>
	    </div>
	    <div style="display:flex; gap:5px; margin-bottom:15px;">
	        <input type="text" id="searchEmail" placeholder="이메일을 입력하세요" style="flex:1; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">
	        <button type="button" onclick="searchUser()" style="padding:10px 15px; background:#4A90E2; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">검색</button>
	    </div>
	    <div id="userList" style="max-height:200px; overflow-y:auto; border:1px solid #eee; border-radius:8px; padding:5px;"></div>
	</div>
</body>
</html>