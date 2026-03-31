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
      
      // 서버에서 데이터를 가져오는 설정
      events: function(info, successCallback, failureCallback) {
        $.ajax({
          url: '/api/calendar/monthly',
          type: 'GET',
          data: {
            projId: 1, // 테스트용 ID (나중에 세션 등에서 가져오도록 수정)
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
</style>
</head>
<body>
<main>
 HI
</main>
<footer>
</footer>
</body>
</html>