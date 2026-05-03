<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MOYO</title>
<body>
<header>
	<%@ include file="common/header.jsp"%>
</header>
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'></script>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<div id='calendar'></div>

<script>
	document.addEventListener('DOMContentLoaded', function() {
	    var calendarEl = document.getElementById('calendar');
	    var calendar = new FullCalendar.Calendar(calendarEl, {
	        initialView: 'dayGridMonth',
	        locale: 'ko',
	        selectable: true,
	        editable: true, // 드래그 앤 드롭 활성화
	        
	        // 1. [데이터 로딩] - 서버에서 일정을 가져와 화면에 표시
	        events: function(info, successCallback, failureCallback) {
	            const urlParams = new URLSearchParams(window.location.search);
	            const projId = urlParams.get('projId') || 2;
	            const wsId = urlParams.get('wsId');

	            $.ajax({
	                url: '/api/calendar/monthly',
	                type: 'GET',
	                data: {
	                    projId: projId,
	                    wsId: wsId,
	                    startDate: info.startStr.split('T')[0],
	                    endDate: info.endStr.split('T')[0]
	                },
	                success: function(data) {
	                    var events = data.map(function(item) {
	                        return {
	                            id: item.id,
	                            title: item.title,
	                            start: item.startDt, // FullCalendar 규격 매핑
	                            end: item.endDt,     // FullCalendar 규격 매핑
	                            backgroundColor: item.itemType === 'HOLIDAY' ? '#ff9f89' : (item.color || '#3788d8'),
	                            borderColor: item.itemType === 'HOLIDAY' ? '#ff9f89' : (item.color || '#3788d8'),
	                            allDay: true,
	                            extendedProps: { type: item.itemType }
	                        };
	                    });
	                    successCallback(events);
	                },
	                error: function(err) {
	                    console.error("데이터 로드 실패", err);
	                    failureCallback(err);
	                }
	            });
	        },

	        // 2. [드래그 앤 드롭] - 날짜 이동 수정
	        eventDrop: function(info) {
	            if (info.event.extendedProps.type === 'HOLIDAY') {
	                alert("공휴일은 수정할 수 없습니다.");
	                info.revert();
	                return;
	            }
	            if (!confirm("일정을 이동하시겠습니까?")) {
	                info.revert();
	                return;
	            }
	            var updateData = {
	                id: info.event.id,
	                startDt: info.event.startStr.split('T')[0],
	                endDt: (info.event.endStr || info.event.startStr).split('T')[0]
	            };
	            // 종료일 보정 (-1일)
	            if(info.event.endStr) {
	                let end = new Date(info.event.endStr);
	                end.setDate(end.getDate() - 1);
	                updateData.endDt = end.toISOString().split('T')[0];
	            }
	            $.ajax({
	                url: '/api/calendar/update-date',
	                type: 'POST',
	                contentType: 'application/json',
	                data: JSON.stringify(updateData),
	                success: function() { alert("이동 완료"); },
	                error: function() { info.revert(); }
	            });
	        },

	        // 3. [날짜 클릭] - 등록 모달 오픈
	        select: function(info) {
	            $('#eventModal').show();
	            $('#modalTitle').text('일정 등록');
	            $('#eventTitle').val('');
	            $('#eventStart').val(info.startStr);
	            let endDate = new Date(info.endStr);
	            endDate.setDate(endDate.getDate() - 1);
	            $('#eventEnd').val(endDate.toISOString().split('T')[0]);
	            
	            $('#saveEvent').show();     // 등록 버튼 표시
	            $('#updateEvent').hide();   // 수정 버튼 숨김
	            $('#deleteEvent').hide();   // 삭제 버튼 숨김
	        },

	        // 4. [이벤트 클릭] - 수정/삭제 모달 오픈
	        eventClick: function(info) {
	            if (info.event.extendedProps.type === 'HOLIDAY') {
	                alert("공휴일은 조회만 가능합니다.");
	                return;
	            }
	            $('#eventModal').show();
	            $('#modalTitle').text('일정 수정/삭제');
	            $('#eventTitle').val(info.event.title);
	            $('#eventStart').val(info.event.startStr.split('T')[0]);
	            let end = new Date(info.event.endStr || info.event.startStr);
	            if(info.event.endStr) end.setDate(end.getDate() - 1);
	            $('#eventEnd').val(end.toISOString().split('T')[0]);

	            $('#eventModal').data('selectedId', info.event.id); // ID 저장
	            
	            $('#saveEvent').hide();     // 등록 버튼 숨김
	            $('#updateEvent').show();   // 수정 버튼 표시
	            $('#deleteEvent').show();   // 삭제 버튼 표시
	        }
	    });

	    calendar.render();

	    // 취소 버튼
	    $('#closeModal').on('click', function() { $('#eventModal').hide(); });

	    // [등록 처리 AJAX]
	    $('#saveEvent').on('click', function() {
	        const projId = new URLSearchParams(window.location.search).get('projId') || 2;
	        $.ajax({
	            url: '/api/calendar/register',
	            type: 'POST',
	            contentType: 'application/json',
	            data: JSON.stringify({
	                title: $('#eventTitle').val(),
	                startDt: $('#eventStart').val(),
	                endDt: $('#eventEnd').val(),
	                projId: projId,
	                itemType: 'PROJ'
	            }),
	            success: function() { 
	                $('#eventModal').hide(); 
	                calendar.refetchEvents(); 
	            }
	        });
	    });

	    // [전체 수정 처리 AJAX (제목 포함)]
	    $('#updateEvent').on('click', function() {
	        $.ajax({
	            url: '/api/calendar/update-all',
	            type: 'POST',
	            contentType: 'application/json',
	            data: JSON.stringify({
	                id: $('#eventModal').data('selectedId'),
	                title: $('#eventTitle').val(),
	                startDt: $('#eventStart').val(),
	                endDt: $('#eventEnd').val()
	            }),
	            success: function() { 
	                alert("수정되었습니다."); 
	                $('#eventModal').hide(); 
	                calendar.refetchEvents(); 
	            }
	        });
	    });

	    // [삭제 처리 AJAX]
	    $('#deleteEvent').on('click', function() {
	        const id = $('#eventModal').data('selectedId');
	        if (confirm("삭제하시겠습니까?")) {
	            $.ajax({
	                url: '/api/calendar/delete/' + id,
	                type: 'DELETE',
	                success: function() { 
	                    $('#eventModal').hide(); 
	                    calendar.refetchEvents(); 
	                }
	            });
	        }
	    });
	});
</script>

<style>
  /* 캘린더 크기 조절 */
  #calendar {
    max-width: 900px;
    margin: 40px auto;
  }
  /* 공휴일 이벤트 스타일 (커스텀) */
  .fc-event[data-type="HOLIDAY"] {
    cursor: default;
    font-weight: bold;
  }
  
  /* 모달 배경 */
  .modal {
      display: none; position: fixed; z-index: 1000; left: 0; top: 0;
      width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);
  }
  /* 모달 박스 */
  .modal-content {
      background-color: #fff; margin: 15% auto; padding: 20px;
      border-radius: 8px; width: 350px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  .input-group { margin-bottom: 15px; }
  .input-group label { display: block; margin-bottom: 5px; font-weight: bold; }
  .input-group input { width: 100%; padding: 8px; box-sizing: border-box; }
  .modal-buttons { text-align: right; }
  .btn-save { background: #3788d8; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; }
  .btn-close { background: #ccc; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; }
</style>
</head>
<body>
<main>
	<div id="eventModal" class="modal">
	    <div class="modal-content">
	        <h3 id="modalTitle">일정 등록</h3> <!-- ID 추가 -->
	        <hr>
	        <div class="input-group">
	            <label>일정 내용</label>
	            <input type="text" id="eventTitle">
	        </div>
	        <div class="input-group">
	            <label>시작 날짜</label>
	            <input type="date" id="eventStart">
	        </div>
	        <div class="input-group">
	            <label>종료 날짜</label>
	            <input type="date" id="eventEnd">
	        </div>
			<div class="modal-buttons">
			    <button type="button" id="saveEvent" class="btn-save">등록</button>
			    <button type="button" id="updateEvent" class="btn-update" style="display:none; background:#28a745; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">수정</button>
			    <button type="button" id="deleteEvent" class="btn-delete" style="display:none; background:#dc3545; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">삭제</button>
			    <button type="button" id="closeModal" class="btn-close">취소</button>
			</div>
	    </div>
	</div>
</main>
<footer>
</footer>
</body>
</html>