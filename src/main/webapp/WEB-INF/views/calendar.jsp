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
<header><%@ include file="common/header.jsp"%></header>

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
                <button type="button" id="updateEvent" class="btn-save" style="background:#28a745; display:none;">수정 완료</button>
                <button type="button" id="cancelModal" class="btn-close">취소</button>
            </div>
        </div>
    </div>
</main>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        let userSpaces = { workspaces: [], projects: [] }; 
        const sessionUserId = "${sessionScope.user.userId}";
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
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            selectable: true,
            editable: true,
            height: 800,
            dayMaxEvents: true,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
            events: function(info, successCallback, failureCallback) {
                let types = $('.sidebar input[type="checkbox"]:checked').map(function() { return $(this).val(); }).get();
                $.ajax({
                    url: '${pageContext.request.contextPath}/api/calendar/monthly',
                    type: 'GET',
                    data: { types: types.join(','), startDate: info.startStr.split('T')[0], endDate: info.endStr.split('T')[0], userId: sessionUserId },
                    success: function(data) {
                        const events = data.map(item => {
                            // 오라클 대소문자 방어 코드
                            let startVal = item.startDt || item.startdt || item.STARTDT;
                            let endVal = item.endDt || item.enddt || item.ENDDT;
                            const isLunar = (item.isLunar === 'Y');
                            
                            // ISO 포맷 보정 (공백을 T로 치환하여 RRule 파싱 에러 사전 방지)
                            if(startVal && startVal.includes(' ')) startVal = startVal.replace(' ', 'T');
                            if(endVal && endVal.includes(' ')) endVal = endVal.replace(' ', 'T');

                            const isAllDay = item.allDay === 'Y' || isLunar || (startVal && startVal.includes('00:00:00'));

                            let eventObj = {
                                id: item.id,
                                title: item.title || '제목 없음',
                                backgroundColor: item.color || '#3788d8',
                                borderColor: item.color || '#3788d8',
                                allDay: isAllDay,
                                extendedProps: { 
                                    type: item.itemType || item.itemtype,
                                    isRecurring: item.isRecurring || 'N',
                                    recurGroupId: item.recurGroupId,
                                    isLunar: item.isLunar,
                                    untilDt: item.untilDt,
                                    recurType: item.recurType
                                }
                            };

                            // [핵심 변경] 양력 반복(rrule 사용) 처리 최적화
                            if (item.isRecurring === 'Y' && item.recurType && !isLunar) {
                                let rruleUntil = item.untilDt;
                                // rrule 'until'은 시분초가 있어야 정확히 마감기한을 인식함
                                if(rruleUntil && !rruleUntil.includes('T')) {
                                    rruleUntil = rruleUntil + 'T23:59:59';
                                }
                                
                                eventObj.rrule = {
                                    freq: item.recurType.toLowerCase(),
                                    dtstart: startVal,
                                    until: rruleUntil,
                                    interval: 1
                                };
                            } else {
                                // 단일 일정이거나 '음력 반복' 일정일 때
                                // 음력 반복은 Java에서 현재 연도에 대응하는 단일 양력 날짜로 변경해서 던져주므로 start/end 바인딩을 해야 함
                                eventObj.start = startVal;
                                eventObj.end = endVal || startVal;
                            }
                            return eventObj;
                        });
                        successCallback(events);
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

                $('#eventStart').val(isAllDay ? info.startStr : info.startStr.substring(0, 16));
                $('#eventEnd').val(isAllDay ? (info.endStr || info.startStr) : (info.endStr || info.startStr).substring(0, 16));

                $('#saveEvent').show(); 
                $('#updateEvent, #deleteEvent').hide();
                $('#itemType').trigger('change');
            },
            eventClick: function(info) {
                if (info.event.extendedProps.type === 'HOLIDAY') return;
                const props = info.event.extendedProps;
                $('#eventModal').data('selectedId', info.event.id);
                $('#eventModal').data('recurGroupId', props.recurGroupId);
                $('#eventModal').data('isRecurring', props.isRecurring);
                
                $('#eventModal').show(); $('#modalTitle').text('일정 수정');
                $('#eventTitle').val(info.event.title);
                
                const isRecur = props.isRecurring === 'Y';
                $('#isRecurringCheck').prop('checked', isRecur);
                if (isRecur) {
                    $('#recurringDetails').show();
                    $('#recurFreq').val(props.recurType || 'WEEKLY');
                    if(props.recurType === 'YEARLY') $('#lunarSetting').show();
                    $('#untilDt').val(props.untilDt || '');
                } else {
                    $('#recurringDetails').hide();
                    $('#lunarSetting').hide();
                }

                $('#isLunarCheck').prop('checked', props.isLunar === 'Y');

                selectColor(info.event.backgroundColor || '#3788d8', false);
                $('#allDayCheck').prop('checked', info.event.allDay); 
                toggleDateTimeMode(info.event.allDay);
                
                // 음력 클릭 시에도 화면상의 양력 일자를 Input 창에 뿌려주는 보정 로직
                const toISO = (d, all) => {
                    let off = d.getTimezoneOffset() * 60000;
                    let i = new Date(d.getTime() - off).toISOString();
                    return all ? i.substring(0, 10) : i.substring(0, 16);
                };
                $('#eventStart').val(toISO(info.event.start, info.event.allDay));
                $('#eventEnd').val(info.event.end ? toISO(info.event.end, info.event.allDay) : toISO(info.event.start, info.event.allDay));
                
                $('#itemType').val(props.type).trigger('change');
                $('#saveEvent').hide(); $('#updateEvent, #deleteEvent').show();
            }
        });
        calendar.render();

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

        function getProcessData() {
            let s = $('#eventStart').val();
            let e = $('#eventEnd').val();
            const isLunar = $('#isLunarCheck').is(':checked') ? 'Y' : 'N';
            const isRecurring = $('#isRecurringCheck').is(':checked') ? 'Y' : 'N';
            const allDayVal = (isLunar === 'Y' || $('#allDayCheck').is(':checked')) ? 'Y' : 'N';

            return {
                id: $('#eventModal').data('selectedId'),
                title: $('#eventTitle').val().trim(),
                isLunar: isLunar,
                startDt: s,
                endDt: e,
                allDay: allDayVal,
                itemType: $('#itemType').val(),
                color: $('#eventColor').val(),
                wsId: $('#itemType').val() === 'WS' ? $('#spaceId').val() : null,
                projId: $('#itemType').val() === 'PROJ' ? $('#spaceId').val() : null,
                userId: sessionUserId,
                isRecurring: isRecurring,
                recurType: isRecurring === 'Y' ? $('#recurFreq').val() : null,
                untilDt: isRecurring === 'Y' ? $('#untilDt').val() : null,
                recurInterval: 1
            };
        }

        $('#saveEvent').on('click', function() { 
            var d = getProcessData(); if (!d.title) return; 
            $.ajax({ url: '${pageContext.request.contextPath}/api/calendar/register', type: 'POST', contentType: 'application/json', data: JSON.stringify(d), success: function() { $('#eventModal').hide(); calendar.refetchEvents(); } }); 
        });
        
        $('#updateEvent').on('click', function() { 
            var d = getProcessData(); 
            $.ajax({ url: '${pageContext.request.contextPath}/api/calendar/update-all', type: 'POST', contentType: 'application/json', data: JSON.stringify(d), success: function() { $('#eventModal').hide(); calendar.refetchEvents(); } }); 
        });

        $('#deleteEvent').on('click', function() {
            const eventId = $('#eventModal').data('selectedId');
            const isRecurring = $('#eventModal').data('isRecurring');
            if (!confirm(isRecurring === 'Y' ? "모든 반복 일정을 삭제하시겠습니까?" : "정말 삭제하시겠습니까?")) return;
            $.ajax({
                url: '${pageContext.request.contextPath}/api/calendar/delete?eventId=' + eventId + '&deleteSeries=' + (isRecurring === 'Y' ? 'Y' : 'N'),
                type: 'DELETE',
                success: function() { $('#eventModal').hide(); calendar.refetchEvents(); }
            });
        });

        $('#cancelModal').on('click', () => $('#eventModal').hide());
        $('#itemType').on('change', function() {
            var type = $(this).val(), $g = $('#spaceSelectGroup'), $s = $('#spaceId'); $s.empty();
            if (type === 'PRIVATE') $g.hide();
            else { 
                $g.show(); 
                var list = (type === 'WS') ? userSpaces.workspaces : userSpaces.projects; 
                $('#spaceLabel').text(type === 'WS' ? "🏢 워크스페이스" : "📁 프로젝트"); 
                list.forEach(item => { 
                    var id = (type === 'WS') ? item.wsId : item.projId; 
                    var name = (type === 'WS') ? item.wsName : item.projName; 
                    $s.append('<option value="' + id + '">' + name + '</option>'); 
                }); 
            }
        });
        $('.sidebar input[type="checkbox"]').on('change', function() { calendar.refetchEvents(); });
        $.get('${pageContext.request.contextPath}/api/calendar/user-spaces', function(data) { userSpaces = data; $('#itemType').trigger('change'); });
    });
</script>
</body>
</html>