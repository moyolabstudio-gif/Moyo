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
      locale: 'ko', // 한국어 설정
      
	  selectable: true, // 1. 날짜 선택 가능하게 추가
	  select: function(info) { // 2. 날짜 클릭(드래그) 시 모달 띄우기
	      $('#eventModal').show();
	      $('#eventTitle').val(''); // 입력창 초기화
	      $('#eventStart').val(info.startStr);
	      
	      // 종료일은 FullCalendar 특성상 선택한 다음날 자정으로 잡히므로 
	      // 하루를 빼거나 그대로 사용 (보통은 그대로 사용해도 무관)
	      $('#eventEnd').val(info.endStr); 
		  let endDate = new Date(info.endStr);
		      endDate.setDate(endDate.getDate() - 1);
		      $('#eventEnd').val(endDate.toISOString().split('T')[0]);
	  },
	  
      // 서버에서 데이터를 가져오는 설정
      events: function(info, successCallback, failureCallback) {
        $.ajax({
          url: '/api/calendar/monthly',
          type: 'GET',
          data: {
            projId: 2, // 테스트용 ID (나중에 세션 등에서 가져오도록 수정)
            startDate: info.startStr.split('T')[0],
            endDate: info.endStr.split('T')[0]
          },
          success: function(data) {
            // 서버 데이터를 FullCalendar 형식에 맞게 변환
            var events = data.map(function(item) {
              return {
                id: item.id,
                title: item.title,
                start: item.startDt,
                end: item.endDt,
                // 공휴일과 일반 일정 색상 구분
                backgroundColor: item.itemType === 'HOLIDAY' ? '#ff9f89' : '#3788d8',
                borderColor: item.itemType === 'HOLIDAY' ? '#ff9f89' : '#3788d8',
                textColor: '#ffffff',
                allDay: true,
                extendedProps: {
                  type: item.itemType
                }
              };
            });
            successCallback(events);
          },
          error: function() {
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
          }
        });
      },
      
      // 공휴일인 경우 날짜 번호 색상 변경 (CSS 처리용)
      dayCellDidMount: function(info) {
        // 일요일이나 공휴일 데이터가 있을 경우 처리 로직 추가 가능
      }
    });
    
    calendar.render();
	// 3. 모달 제어용 jQuery 코드 추가 (render 호출 아래에)
	$('#closeModal').on('click', function() {
	    $('#eventModal').hide();
	});

	$('#saveEvent').on('click', function() {
	    var eventData = {
	        title: $('#eventTitle').val(),
	        startDt: $('#eventStart').val(),
	        endDt: $('#eventEnd').val()
	    };

	    if (!eventData.title) {
	        alert("일정 내용을 입력해주세요.");
	        return;
	    }

	    $.ajax({
	        url: '/api/calendar/register',
	        type: 'POST',
	        contentType: 'application/json',
	        data: JSON.stringify(eventData),
	        success: function(res) {
	            alert(res);
	            $('#eventModal').hide();
	            calendar.refetchEvents(); // 달력 데이터 새로고침!
	        },
	        error: function(err) {
	            alert("저장 실패: " + err.responseText);
	        }
	    });
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
	        <h3>일정 등록</h3>
	        <hr>
	        <div class="input-group">
	            <label>일정 내용</label>
	            <input type="text" id="eventTitle" placeholder="할 일을 입력하세요">
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
	            <button type="button" id="saveEvent" class="btn-save">저장</button>
	            <button type="button" id="closeModal" class="btn-close">취소</button>
	        </div>
	    </div>
	</div>
</main>
<footer>
</footer>
</body>
</html>