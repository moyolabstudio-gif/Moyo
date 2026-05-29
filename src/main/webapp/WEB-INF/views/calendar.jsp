<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MOYO - 협업 캘린더</title>
	<script src='https://cdn.jsdelivr.net/npm/rrule@2.7.2/dist/es5/rrule.min.js'></script>
	<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'></script>
	<script src='https://cdn.jsdelivr.net/npm/@fullcalendar/rrule@6.1.10/index.global.min.js'></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background-color: #f4f7f9; font-family: 'Pretendard', sans-serif; overflow-x: hidden; }
        .moyo-wrapper { display: flex !important; flex-direction: row; width: 100%; max-width: 1600px; margin: 20px auto; gap: 20px; padding: 0 20px; align-items: flex-start; }
        .sidebar { flex: 0 0 280px; background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; height: fit-content; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .calendar-content { flex: 1; min-width: 0; background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        
        #calendar { width: 100%; height: 800px; }

        .color-palette-container { display: flex; flex-direction: column; gap: 12px; margin-top: 5px; }
        .palette-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .palette-label { font-size: 0.75rem; color: #888; margin-bottom: 4px; display: block; }
        .color-chip { width: 26px; height: 26px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: 0.2s; display: flex; align-items: center; justify-content: center; position: relative; }
        .color-chip:hover { transform: scale(1.1); }
        .color-chip.active { border-color: #333; box-shadow: 0 0 4px rgba(0,0,0,0.2); }
        .color-chip.active::after { content: '\f00c'; font-family: 'Font Awesome 6 Free'; font-weight: 900; font-size: 11px; color: white; }
        .chip-delete-btn { position: absolute; top: -6px; right: -6px; width: 14px; height: 14px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; font-size: 9px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; cursor: pointer; border: none; padding: 0; }
        .color-chip:hover .chip-delete-btn { opacity: 1; }
        .chip-delete-btn:hover { background: #dc3545; }
        .custom-color-trigger { width: 26px; height: 26px; border-radius: 50%; border: 1px dashed #aaa; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #888; font-size: 12px; }

        .fc-daygrid-event { margin-top: 2px !important; margin-bottom: 1px !important; border-radius: 4px !important; padding: 1px 4px !important; }
        .fc-more-link { font-size: 0.75rem !important; color: #3788d8 !important; font-weight: bold; }

        .modal { display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
        .modal-content { background: #fff; margin: 5% auto; padding: 25px; border-radius: 12px; width: 440px; position: relative; }
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; margin-bottom: 6px; font-weight: bold; font-size: 0.9rem; }
        .input-group input, .input-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
        .modal-buttons { text-align: right; margin-top: 25px; display: flex; justify-content: flex-end; gap: 8px; }
        .btn-save { background: #3788d8; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-close { background: #eeeff1; color: #666; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; }
    </style>
</head>
<body>
<%@ include file="common/header.jsp"%>

<main class="moyo-wrapper">
    <aside class="sidebar">
        <h3>📅 일정 필터</h3>
        <ul style="list-style:none; padding:0;">
            <li style="padding:10px;"><input type="checkbox" id="chk-private" value="PRIVATE" checked> 개인 일정</li>
            <li style="padding:10px;"><input type="checkbox" id="chk-ws" value="WS" checked> 워크스페이스</li>
            <li style="padding:10px;"><input type="checkbox" id="chk-proj" value="PROJ" checked> 프로젝트</li>
            <li style="padding:10px;"><input type="checkbox" id="chk-holiday" value="HOLIDAY" checked> <span style="color: #e74c3c;">🚩 공휴일</span></li>
        </ul>
    </aside>

    <section class="calendar-content">
        <div id='calendar'></div>
    </section>

    <div id="eventModal" class="modal">
        <div class="modal-content">
            <h3 id="modalTitle" style="margin-top:0;">일정 상세</h3>
            <hr style="border: 0.5px solid #eee; margin-bottom: 20px;">
            <div class="input-group">
                <label>일정 구분</label>
                <select id="itemType">
                    <option value="PRIVATE">👤 개인</option>
                    <option value="WS">🏢 워크스페이스</option>
                    <option value="PROJ">📁 프로젝트</option>
                </select>
            </div>
            <div class="input-group" id="spaceSelectGroup" style="display: none;">
                <label id="spaceLabel">소속 선택</label>
                <select id="spaceId"></select>
            </div>
            <div class="input-group">
                <label>🎨 일정 색상</label>
                <div class="color-palette-container">
                    <div>
                        <span class="palette-label">기본 색상</span>
                        <div class="palette-row" id="defaultPalette">
                            <div class="color-chip" style="background:#3788d8;" data-color="#3788d8"></div>
                            <div class="color-chip" style="background:#e74c3c;" data-color="#e74c3c"></div>
                            <div class="color-chip" style="background:#2ecc71;" data-color="#2ecc71"></div>
                            <div class="color-chip" style="background:#f39c12;" data-color="#f39c12"></div>
                            <div class="color-chip" style="background:#9b59b6;" data-color="#9b59b6"></div>
                            <div class="color-chip" style="background:#1abc9c;" data-color="#1abc9c"></div>
                            <div class="color-chip" style="background:#e91e63;" data-color="#e91e63"></div>
                            <div class="color-chip" style="background:#34495e;" data-color="#34495e"></div>
                            <div class="color-chip" style="background:#7f8c8d;" data-color="#7f8c8d"></div>
                            <div class="color-chip" style="background:#f1c40f;" data-color="#f1c40f"></div>
                            <div class="custom-color-trigger" id="customColorBtn" title="새 색상 추가"><i class="fa-solid fa-plus"></i></div>
                        </div>
                    </div>
                    <div id="recentSection" style="display:none;">
                        <span class="palette-label">최근 사용 (최대 10개)</span>
                        <div class="palette-row" id="recentColors"></div>
                    </div>
                </div>
                <input type="color" id="eventColor" style="display:none;" value="#3788d8">
            </div>
            <div class="input-group">
                <label>일정 제목</label>
                <input type="text" id="eventTitle" placeholder="제목을 입력하세요">
            </div>
			<div class="input-group" style="background: #fdf2f2; padding:10px; border-radius:6px; margin-top: 10px;">
			    <div style="display:flex; align-items:center; gap:10px;">
			        <input type="checkbox" id="isRecurringCheck" style="width:auto;">
			        <label for="isRecurringCheck" style="margin-bottom:0; color:#e74c3c; font-weight:bold;">🔁 일정 반복하기</label>
			    </div>
			    <div id="recurringDetails" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed #e74c3c;">
			        <div style="margin-bottom:8px;">
			            <label style="font-size:12px; color:#666;">반복 주기</label>
			            <select id="recurFreq" class="form-control" style="width:100%;">
			                <option value="DAILY">매일</option>
			                <option value="WEEKLY" selected>매주</option>
			                <option value="MONTHLY">매월</option>
			                <option value="YEARLY">매년</option>
			            </select>
			        </div>
			        <div>
			            <label style="font-size:12px; color:#666;">반복 종료일</label>
			            <input type="date" id="untilDt" class="form-control" style="width:100%;">
			        </div>
			    </div>
			</div>
            <div class="input-group" style="background: #f8f9fa; padding:10px; border-radius:6px; display:flex; align-items:center; gap:10px;">
                <input type="checkbox" id="allDayCheck" style="width:auto;">
                <label for="allDayCheck" style="margin-bottom:0; color:#3788d8;">🗓 종일 일정</label>
            </div>
			<div id="lunarSetting" style="display:none; margin-top:10px; padding-left:25px;">
			    <input type="checkbox" id="isLunarCheck"> 
			    <label for="isLunarCheck" style="color:#8e44ad; font-weight:bold;">🌙 음력으로 반복</label>
			</div>
            <div class="input-group">
                <label id="startLabel">시작 일시</label>
                <input type="datetime-local" id="eventStart">
            </div>
            <div class="input-group">
                <label id="endLabel">종료 일시</label>
                <input type="datetime-local" id="eventEnd">
            </div>
			<div class="modal-buttons">
			    <button type="button" id="deleteEvent" class="btn-save" style="background:#dc3545; display:none; margin-right:auto;">삭제</button>
			    <button type="button" id="saveEvent" class="btn-save">등록</button>
			    <button type="button" id="editModeBtn" class="btn-save" style="background:#f39c12; display:none;">수정</button> <button type="button" id="updateEvent" class="btn-save" style="background:#28a745; display:none;">저장</button>
			    <button type="button" id="cancelModal" class="btn-close">취소</button>
			</div>
        </div>
    </div>
</main>

<script>
	let paramWsId, paramMode, sessionUserId, calendar;
	function toggleReadOnly(isRead) {
			    // 필드 상태 변경
			    $('#eventTitle, #itemType, #spaceId, #isRecurringCheck, #recurFreq, #untilDt, #allDayCheck, #isLunarCheck, #eventStart, #eventEnd').prop('disabled', isRead);
			    
			    // 색상 팔레트 클릭 이벤트 제어
			    if (isRead) {
			        $('.color-chip, .custom-color-trigger').css('pointer-events', 'none').css('opacity', '0.7');
			    } else {
			        $('.color-chip, .custom-color-trigger').css('pointer-events', 'auto').css('opacity', '1');
			    }
			}
    document.addEventListener('DOMContentLoaded', function() {
		let holidayCache = {};
        let userSpaces = { workspaces: [], projects: [] }; 
        sessionUserId = "${sessionScope.user.userId}";
        const calendarEl = document.getElementById('calendar');

        // [컬러 로직]
        const defaultColors = ["#3788d8", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e91e63", "#34495e", "#7f8c8d", "#f1c40f"];
        function renderRecentColors() {
            const recents = JSON.parse(localStorage.getItem('moyo_recent_colors') || "[]");
            const $section = $('#recentSection'); const $container = $('#recentColors');
            if (recents.length === 0) { $section.hide(); return; }
            $section.show(); $container.empty();
            recents.forEach(color => {
                const $chip = $('<div class="color-chip recent-chip" style="background:' + color + ';" data-color="' + color + '"></div>');
                const $delBtn = $('<button type="button" class="chip-delete-btn"><i class="fa-solid fa-x"></i></button>');
                $delBtn.on('click', function(e) { e.stopPropagation(); deleteRecentColor(color); });
                $chip.append($delBtn); $container.append($chip);
            });
            $('.recent-chip').off('click').on('click', function() { selectColor($(this).data('color'), false); });
        }
        function deleteRecentColor(color) {
            if(!confirm("이 색상을 삭제하시겠습니까?")) return;
            let recents = JSON.parse(localStorage.getItem('moyo_recent_colors') || "[]");
            recents = recents.filter(c => c.toLowerCase() !== color.toLowerCase());
            localStorage.setItem('moyo_recent_colors', JSON.stringify(recents));
            renderRecentColors();
            if($('#eventColor').val().toLowerCase() === color.toLowerCase()) selectColor('#3788d8', false);
        }
        function saveToRecent(color) {
            const lc = color.toLowerCase();
            if (defaultColors.some(c => c.toLowerCase() === lc)) return;
            let recents = JSON.parse(localStorage.getItem('moyo_recent_colors') || "[]");
            if (recents.some(c => c.toLowerCase() === lc)) return;
            if (recents.length >= 10) return;
            recents.unshift(color);
            localStorage.setItem('moyo_recent_colors', JSON.stringify(recents));
            renderRecentColors();
        }
        function selectColor(color, isNew) {
            $('#eventColor').val(color); $('.color-chip').removeClass('active');
            $('.color-chip').each(function() { if ($(this).data('color').toLowerCase() === color.toLowerCase()) $(this).addClass('active'); });
            if (isNew) { saveToRecent(color); renderRecentColors(); }
        }
        renderRecentColors();
        $('.color-chip').on('click', function() { selectColor($(this).data('color'), false); });
        $('#customColorBtn').on('click', function() { $('#eventColor').click(); });
        $('#eventColor').on('change', function() { selectColor($(this).val(), true); });

        // [FullCalendar 설정]
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            selectable: true,
            editable: true,
            height: 800,
            dayMaxEvents: true,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
			events: function(info, successCallback, failureCallback) {
			    let types = $('.sidebar input[type="checkbox"]:checked')
			        .map(function() { return $(this).val(); })
			        .get();

			    $.ajax({
			        url: '${pageContext.request.contextPath}/api/calendar/monthly',
			        type: 'GET',
			        data: {
			            types: types.join(','),
			            startDate: info.startStr.split('T')[0],
			            endDate: info.endStr.split('T')[0],
			            userId: sessionUserId
			        },
			        success: function(data) {
						console.log("캘린더 원본 데이터", data);
						
			            const events = data.map(item => {
							const itemType = item.itemType || item.itemtype;

							        if(itemType === 'TASK'){
							            console.log("TASK 원본 =", item);
							        }

							        const isHoliday = (item.itemType === 'HOLIDAY' || item.itemtype === 'HOLIDAY');
			                const eventColor = isHoliday ? '#e74c3c' : (item.color || '#3788d8');

			                let startVal = item.startDt || item.startdt || item.STARTDT;
			                let endVal   = item.endDt   || item.enddt   || item.ENDDT;
			                const isLunar = (item.isLunar === 'Y');

			                if(startVal && startVal.includes(' ')) startVal = startVal.replace(' ', 'T');
			                if(endVal && endVal.includes(' ')) endVal = endVal.replace(' ', 'T');

			                const isAllDay = item.allDay === 'Y' || isLunar || isHoliday || (startVal && startVal.includes('00:00:00'));

			                // 기본 이벤트 객체
			                let eventObj = {
			                    id: item.id,
			                    title: item.title || '제목 없음',
			                    backgroundColor: eventColor,
			                    borderColor: eventColor,
			                    allDay: isAllDay,
			                    extendedProps: {
			                        type: item.itemType || item.itemtype,
			                        isRecurring: item.isRecurring || 'N',
			                        recurGroupId: item.recurGroupId,
			                        isLunar: item.isLunar,
			                        untilDt: item.untilDt,
			                        recurType: item.recurType,
			                        wsId: item.wsId,
			                        projId: item.projId
			                    }
			                };

			                // 💡 분기 처리: 반복 일정이면서 RRule 처리가 필요한 경우에만 추가
			                if (item.isRecurring === 'Y' && item.recurType && !isLunar) {
			                    let rruleUntil = item.untilDt;
			                    if (rruleUntil && !rruleUntil.includes('T')) rruleUntil += 'T23:59:59';
			                    
			                    eventObj.rrule = { 
			                        freq: item.recurType.toLowerCase(), 
			                        dtstart: startVal, 
			                        until: rruleUntil, 
			                        interval: 1 
			                    };
							} else {

							    const itemType = item.itemType || item.itemtype;

							    eventObj.start = startVal;

							    if (itemType === 'TASK' && endVal) {

							        let endDate = new Date(endVal);
							        endDate.setDate(endDate.getDate() + 1);

							        eventObj.end = endDate;

							    } else {

							        eventObj.end = endVal || startVal;
							    }
							}
			                return eventObj;
			            });
			            successCallback(events);
			        },
			        error: function(xhr, status, error) {
			            console.error("일정 데이터를 가져오는데 실패:", error);
			            failureCallback(error);
			        }
			    });
			},

			select: function(info) {
			    $('#eventModal').show(); 
			    $('#modalTitle').text('새 일정 등록');
			    $('#eventTitle').val('');
			    $('#isRecurringCheck').prop('checked', false);
			    $('#recurringDetails').hide();
			    $('#lunarSetting').hide();
			    $('#isLunarCheck').prop('checked', false);

			    const lastUsed = JSON.parse(localStorage.getItem('moyo_recent_colors') || "[]")[0] || '#3788d8';
			    selectColor(lastUsed, false);

			    const isAllDay = info.allDay; 
			    $('#allDayCheck').prop('checked', isAllDay);
			    toggleDateTimeMode(isAllDay);

			    // 💡 시작일은 info.startStr 그대로 사용
			    let startVal = isAllDay ? info.startStr : info.startStr.substring(0, 16);
			    
			    // 💡 종료일 계산:
			    // FullCalendar는 드래그 시 endStr을 '선택한 마지막 날의 다음 날'로 반환합니다.
			    // 종일 일정일 때만 하루를 빼서 보여줘야 사용자가 선택한 범위와 일치합니다.
			    let endVal;
			    if (isAllDay) {
			        let endDate = new Date(info.endStr);
			        endDate.setDate(endDate.getDate() - 1); // 하루 전으로 조정
			        endVal = endDate.toISOString().split('T')[0];
			    } else {
			        endVal = info.endStr ? info.endStr.substring(0, 16) : startVal;
			    }

			    $('#eventStart').val(startVal);
			    $('#eventEnd').val(endVal); 

			    $('#saveEvent').show(); 
			    $('#updateEvent, #deleteEvent').hide();
			    $('#itemType').trigger('change');
			},
			eventClick: function(info) {

			    if (info.event.extendedProps.type === 'HOLIDAY') return;

			    const props = info.event.extendedProps;

			    console.log("========== EVENT CLICK ==========");
			    console.log("event.id =", info.event.id);
			    console.log("event.title =", info.event.title);
			    console.log("props =", props);
			    console.log("props.type =", props.type);
			    console.log("props.wsId =", props.wsId);
			    console.log("props.projId =", props.projId);
			    console.log("allDay =", info.event.allDay);
			    console.log("start =", info.event.start);
			    console.log("end =", info.event.end);

			    // 날짜 변환 함수
			    function toISO(d, all) {

			        console.log("d =", d);
			        console.log("isDate =", d instanceof Date);

			        if (!d) return '';

			        const year = d.getFullYear();
			        const month = String(d.getMonth() + 1).padStart(2, '0');
			        const day = String(d.getDate()).padStart(2, '0');

			        if (all) {
			            return year + '-' + month + '-' + day;
			        }

			        const hours = String(d.getHours()).padStart(2, '0');
			        const mins = String(d.getMinutes()).padStart(2, '0');

			        return year + '-' + month + '-' + day + 'T' + hours + ':' + mins;
			    }

			    $('#eventModal').data('selectedId', info.event.id);
			    $('#eventModal').data('recurGroupId', props.recurGroupId);
			    $('#eventModal').data('isRecurring', props.isRecurring);

			    $('#eventModal').show();
			    $('#modalTitle').text('일정 상세');
			    $('#eventTitle').val(info.event.title).prop('disabled', true);

			    toggleReadOnly(true);

			    const isRecur = props.isRecurring === 'Y';

			    $('#isRecurringCheck')
			        .prop('checked', isRecur)
			        .prop('disabled', true);

			    if (isRecur) {

			        $('#recurringDetails').show();

			        $('#recurFreq')
			            .val(props.recurType || 'WEEKLY')
			            .prop('disabled', true);

			        if (props.recurType === 'YEARLY') {
			            $('#lunarSetting').show();
			        }

			        $('#untilDt')
			            .val(props.untilDt || '')
			            .prop('disabled', true);

			    } else {

			        $('#recurringDetails').hide();
			        $('#lunarSetting').hide();
			    }

			    $('#isLunarCheck')
			        .prop('checked', props.isLunar === 'Y')
			        .prop('disabled', true);

			    selectColor(info.event.backgroundColor || '#3788d8', false);

			    $('#allDayCheck')
			        .prop('checked', info.event.allDay)
			        .prop('disabled', true);

			    toggleDateTimeMode(info.event.allDay);

			    let startValue = toISO(info.event.start, info.event.allDay);

			    $('#eventStart')
			        .val(startValue)
			        .prop('disabled', true);

			    if (info.event.end) {

			        let endDate = new Date(info.event.end);

			        if (info.event.allDay) {
			            endDate.setDate(endDate.getDate() - 1);
			        }

			        let endValue = toISO(endDate, info.event.allDay);

			        $('#eventEnd')
			            .val(endValue)
			            .prop('disabled', true);

			    } else {

			        $('#eventEnd')
			            .val(toISO(info.event.start, info.event.allDay))
			            .prop('disabled', true);
			    }

			    let displayType = props.type;

			    if (props.type === 'TASK') {
			        if (props.projId) {
			            displayType = 'PROJ';
			        } else if (props.wsId) {
			            displayType = 'WS';
			        }
			    }

			    $('#itemType')
			        .val(displayType)
			        .trigger('change')
			        .prop('disabled', true);

			    $('#saveEvent').hide();
			    $('#updateEvent').hide();
			    $('#editModeBtn').show();
			    $('#deleteEvent').show();
			},
        });
		$('#editModeBtn').on('click', function() {
		    $('#modalTitle').text('일정 수정');
		    toggleReadOnly(false); // 💡 필드 잠금 해제
		    $(this).hide();
		    $('#updateEvent').show();
		});
        calendar.render();
		// URL 파라미터 파싱 유틸리티
		const urlParams = new URLSearchParams(window.location.search);
		paramWsId = urlParams.get('wsId');
		paramMode = urlParams.get('mode');

		// 대시보드에서 관리자가 "그룹 일정 등록"을 타고 넘어왔을 때의 분기 처리
		if (paramMode === 'GROUP_REG' && paramWsId) {
		    
		    // 1. 강제로 모달 레이어 팝업 열기
		    $('#eventModal').show(); 
		    $('#modalTitle').text('🏢 새 그룹 일정 등록');
		    $('#eventTitle').val('');
		    
		    // 2. 기본 날짜 세팅 (오늘 날짜 종일 기준 또는 현재 타임스탬프)
		    const todayStr = new Date().toISOString().substring(0, 10);
		    $('#allDayCheck').prop('checked', true);
		    toggleDateTimeMode(true);
		    $('#eventStart').val(todayStr);
		    $('#eventEnd').val(todayStr);

		    // 3. 일정 구분 고정 및 비활성화 (개인 일정으로 변조 방지)
		    $('#itemType').val('WS').prop('disabled', true);
		    $('#spaceSelectGroup').show();
		    $('#spaceLabel').text("🏢 워크스페이스"); 

		    // 4. 비동기로 가져온 공간 목록이 세팅되는 시점과 동기화하여 해당 wsId 강제 고정
		    // $.get('/api/calendar/user-spaces') 완료 콜백 내부나 렌더링 이후 시점에 바인딩 보장
		    setTimeout(function() {
		        $('#spaceId').val(paramWsId).prop('disabled', true); // 다른 그룹 선택 금지 락
		    }, 300);

		    $('#saveEvent').show(); 
		    $('#updateEvent, #deleteEvent').hide();
		}
		
        // [UI 헬퍼 로직]
        function toggleDateTimeMode(isAllDay) {
            const s = $('#eventStart'), e = $('#eventEnd');
            let sVal = s.val(), eVal = e.val();
            if (isAllDay) {
                s.attr('type', 'date'); e.attr('type', 'date');
                if(sVal.includes('T')) s.val(sVal.split('T')[0]);
                if(eVal.includes('T')) e.val(eVal.split('T')[0]);
            } else {
                s.attr('type', 'datetime-local'); e.attr('type', 'datetime-local');
                s.val(sVal.length <= 10 ? sVal + 'T09:00' : sVal);
                e.val(eVal.length <= 10 ? eVal + 'T10:00' : eVal);
            }
        }

        $('#allDayCheck').on('change', function() { toggleDateTimeMode($(this).is(':checked')); });
        $('#isRecurringCheck').on('change', function() { $(this).is(':checked') ? $('#recurringDetails').slideDown(200) : $('#recurringDetails').slideUp(200); });
        $('#recurFreq').on('change', function() { $(this).val() === 'YEARLY' ? $('#lunarSetting').slideDown(200) : $('#lunarSetting').hide(); });

		
        
        $('#updateEvent').on('click', function() { 
            var d = getProcessData(); 
            $.ajax({ url: '${pageContext.request.contextPath}/api/calendar/update-all', type: 'POST', contentType: 'application/json', data: JSON.stringify(d), success: function() { $('#eventModal').hide(); calendar.refetchEvents(); } }); 
        });

		$('#deleteEvent').on('click', function() {
		    const eventId = $('#eventModal').data('selectedId');
		    const recurGroupId = $('#eventModal').data('recurGroupId'); // 💡 ID 가져오기
		    const isRecurring = $('#eventModal').data('isRecurring');
		    
		    if (!confirm(isRecurring === 'Y' ? "모든 반복 일정을 삭제하시겠습니까?" : "정말 삭제하시겠습니까?")) return;

		    // 💡 URL 파라미터에 recurGroupId 추가
		    let deleteUrl = '${pageContext.request.contextPath}/api/calendar/delete?eventId=' + eventId + 
		                    '&deleteSeries=' + (isRecurring === 'Y' ? 'Y' : 'N');
		    
		    if (isRecurring === 'Y' && recurGroupId) {
		        deleteUrl += '&recurGroupId=' + recurGroupId;
		    }

		    $.ajax({
		        url: deleteUrl,
		        type: 'DELETE',
		        success: function() { 
		            $('#eventModal').hide(); 
		            calendar.refetchEvents(); 
		        },
		        error: function(xhr) {
		            alert("삭제 중 오류가 발생했습니다.");
		            console.error(xhr);
		        }
		    });
		});

        $('#cancelModal').on('click', () => $('#eventModal').hide());
		$('#itemType').on('change', function() {
		    var type = $(this).val(), $g = $('#spaceSelectGroup'), $s = $('#spaceId'); $s.empty();
		    if (type === 'PRIVATE') {
		        $g.hide();
		    } else { 
		        $g.show(); 
		        var list = (type === 'WS') ? userSpaces.workspaces : userSpaces.projects; 
		        $('#spaceLabel').text(type === 'WS' ? "🏢 워크스페이스" : "📁 프로젝트"); 
		        
		        var hasAdminSpace = false;
		        
				list.forEach(item => { 
				            // 🚨 수정된 부분: 프로젝트(PROJ) 타입이면 role이 없어도 ADMIN으로 간주
				            var role = item.wsRole || item.WS_ROLE || item.projRole || item.PROJ_ROLE;
				            
				            // 데이터에 role이 없는 경우 프로젝트면 ADMIN으로 강제 설정
				            if (type === 'PROJ' && !role) {
				                role = 'ADMIN';
				            }
				            
				            if (role === 'ADMIN') {
				                var id = (type === 'WS') ? item.wsId : item.projId; 
				                var name = (type === 'WS') ? item.wsName : item.projName; 
				                $s.append('<option value="' + id + '">' + name + '</option>'); 
				                hasAdminSpace = true;
				            }
				        });
		        if (!hasAdminSpace) {
		            $s.append('<option value="">관리자 권한이 있는 공간이 없습니다.</option>');
		            $('#saveEvent').prop('disabled', true);
		        } else {
		            $('#saveEvent').prop('disabled', false);
		        }
		    }
		});
        $('.sidebar input[type="checkbox"]').on('change', function() { calendar.refetchEvents(); });
		function loadUserSpaces() {
		    $.get('${pageContext.request.contextPath}/api/calendar/user-spaces', function(data) { 
		        userSpaces = data; 
		        $('#itemType').trigger('change'); 
		    });
		}
		loadUserSpaces(); // 로딩 시 1번 호출

		// 💡 캘린더 일정 등록 모달이 열릴 때마다 무조건 권한을 새로 긁어오도록 추가
		// 이게 있으면 프로젝트를 새로 만들고 돌아와도 항상 최신 권한으로 업데이트됩니다.
		$('.fc-daygrid-day').on('click', function() {
		    loadUserSpaces();
		});
    });
	function getProcessData() {
			    let s = $('#eventStart').val();
			    let e = $('#eventEnd').val();
			    const isLunar = $('#isLunarCheck').is(':checked') ? 'Y' : 'N';
			    const isRecurring = $('#isRecurringCheck').is(':checked') ? 'Y' : 'N';
			    const allDayVal = (isLunar === 'Y' || $('#allDayCheck').is(':checked')) ? 'Y' : 'N';

			    // disabled 되어 있어도 쿼리 파라미터나 원래 목적값을 강제 바인딩하도록 보정
			    const currentItemType = $('#itemType').val() || (paramMode === 'GROUP_REG' ? 'WS' : 'PRIVATE');
			    const currentSpaceId = $('#spaceId').val() || paramWsId;

			    return {
			        id: $('#eventModal').data('selectedId'),
			        title: $('#eventTitle').val().trim(),
			        isLunar: isLunar,
			        startDt: s,
			        endDt: e,
			        allDay: allDayVal,
			        itemType: currentItemType,
			        color: $('#eventColor').val(),
			        wsId: currentItemType === 'WS' ? currentSpaceId : null,
			        projId: currentItemType === 'PROJ' ? currentSpaceId : null,
			        userId: sessionUserId,
			        isRecurring: isRecurring,
			        recurType: isRecurring === 'Y' ? $('#recurFreq').val() : null,
			        untilDt: isRecurring === 'Y' ? $('#untilDt').val() : null,
			        recurInterval: 1
			    };
			}
			$(document).on('click', '#saveEvent', function() {
			    console.log("버튼 클릭 감지됨!");
			    
			    // 💡 유효성 검사 로직 (제목 필수)
			    var titleVal = $('#eventTitle').val();
			    if (!titleVal || titleVal.trim() === "") {
			        alert("일정 제목을 반드시 입력해주세요.");
			        $('#eventTitle').focus(); // 제목창으로 커서 이동
			        return; // 여기서 함수 종료 (등록 진행 안 함)
			    }
			    
			    // 💡 시작일/종료일 검사 (선택 사항이지만 추가하면 좋습니다)
			    if (!$('#eventStart').val() || !$('#eventEnd').val()) {
			        alert("시작 일시와 종료 일시를 모두 선택해주세요.");
			        return;
			    }

			    var d = getProcessData(); 
			    
			    $.ajax({ 
			        url: '${pageContext.request.contextPath}/api/calendar/register', 
			        type: 'POST', 
			        contentType: 'application/json', 
			        data: JSON.stringify(d), 
			        success: function() { 
			            $('#eventModal').hide(); 
			            calendar.refetchEvents(); 
			        },
			        error: function(xhr) {
			            alert("서버 오류로 등록에 실패했습니다.");
			            console.error(xhr);
			        }
			    }); 
			});
			// 수정 버튼 클릭 시 편집 모드 전환
			$('#editModeBtn').on('click', function() {
			    $('#modalTitle').text('일정 수정');
			    toggleReadOnly(false); // 잠금 해제
			    $(this).hide();
			    $('#updateEvent').show();
			});

			// 모달 닫을 때 다시 조회 모드로 초기화 (필수)
			$('#cancelModal').on('click', function() {
			    $('#eventModal').hide();
			    
			    // 모달을 닫을 때 반드시 조회 모드 해제(모든 필드 활성화)
			    toggleReadOnly(false); 
			    
			    // 버튼 초기화
			    $('#editModeBtn').hide();
			    $('#updateEvent').hide();
			    $('#saveEvent').show();
			});
</script>
</body>
</html>