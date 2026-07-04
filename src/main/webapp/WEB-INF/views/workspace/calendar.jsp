<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO - 캘린더</title>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/rrule@2.7.2/dist/es5/rrule.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@fullcalendar/rrule@6.1.10/index.global.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <style>
        :root {
            --moyo-cal-bg: #f7f8fb;
            --moyo-cal-surface: #ffffff;
            --moyo-cal-line: #e6e9ef;
            --moyo-cal-soft: #f1f4f8;
            --moyo-cal-text: #20242a;
            --moyo-cal-muted: #7a8391;
            --moyo-cal-primary: #4f7cff;
            --moyo-cal-personal: #4f7cff;
            --moyo-cal-group: #20bfa9;
            --moyo-cal-project: #8b5cf6;
            --moyo-cal-holiday: #ef4444;
            --moyo-cal-shadow: 0 18px 48px rgba(20, 28, 42, 0.08);
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: var(--moyo-cal-bg);
            color: var(--moyo-cal-text);
            font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            overflow-x: hidden;
        }

        .moyo-calendar-page {
            width: min(1480px, calc(100% - 40px));
            margin: 22px auto 42px;
        }

        .moyo-calendar-hero {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            padding: 6px 2px 16px;
            border-bottom: 1px solid var(--moyo-cal-line);
        }

        .moyo-calendar-kicker {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            margin-bottom: 7px;
            color: var(--moyo-cal-primary);
            font-size: 13px;
            font-weight: 800;
            letter-spacing: -0.01em;
        }

        .moyo-calendar-title {
            margin: 0;
            font-size: 27px;
            font-weight: 850;
            letter-spacing: -0.04em;
        }

        .moyo-calendar-desc {
            margin: 7px 0 0;
            color: var(--moyo-cal-muted);
            font-size: 14px;
            line-height: 1.45;
        }

        .moyo-calendar-create-btn,
        .moyo-calendar-primary-btn,
        .moyo-calendar-ghost-btn,
        .moyo-calendar-danger-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 38px;
            padding: 0 15px;
            border-radius: 12px;
            border: 1px solid transparent;
            font-size: 14px;
            font-weight: 750;
            cursor: pointer;
            transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
            white-space: nowrap;
        }

        .moyo-calendar-create-btn,
        .moyo-calendar-primary-btn {
            background: var(--moyo-cal-primary);
            color: #fff;
        }

        .moyo-calendar-ghost-btn {
            background: #fff;
            color: #4b5563;
            border-color: var(--moyo-cal-line);
        }

        .moyo-calendar-danger-btn {
            background: #fff;
            color: var(--moyo-cal-holiday);
            border-color: #fecaca;
        }

        .moyo-calendar-create-btn:hover,
        .moyo-calendar-primary-btn:hover,
        .moyo-calendar-ghost-btn:hover,
        .moyo-calendar-danger-btn:hover {
            transform: translateY(-1px);
        }

        .moyo-calendar-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 16px 0 14px;
            flex-wrap: wrap;
        }

        .moyo-calendar-tabs,
        .moyo-calendar-view-tabs,
        .moyo-calendar-toggle-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .moyo-calendar-tab,
        .moyo-calendar-view-btn,
        .moyo-calendar-toggle {
            border: 1px solid var(--moyo-cal-line);
            background: #fff;
            color: #525b68;
            border-radius: 999px;
            min-height: 34px;
            padding: 0 13px;
            font-size: 13px;
            font-weight: 750;
            cursor: pointer;
        }

        .moyo-calendar-tab.is-active,
        .moyo-calendar-view-btn.is-active,
        .moyo-calendar-toggle.is-active {
            border-color: rgba(79, 124, 255, 0.28);
            background: rgba(79, 124, 255, 0.1);
            color: #2f5ee8;
        }

        .moyo-calendar-toggle[data-type="HOLIDAY"].is-active {
            border-color: rgba(239, 68, 68, 0.22);
            background: rgba(239, 68, 68, 0.08);
            color: #dc2626;
        }

        .moyo-calendar-shell {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 320px;
            gap: 18px;
            align-items: start;
        }

        .moyo-calendar-main,
        .moyo-calendar-day-panel {
            background: var(--moyo-cal-surface);
            border: 1px solid var(--moyo-cal-line);
            border-radius: 22px;
            box-shadow: var(--moyo-cal-shadow);
        }

        .moyo-calendar-main {
            padding: 18px;
            min-width: 0;
        }

        #moyoCalendar {
            min-height: 760px;
        }

        .moyo-calendar-day-panel {
            position: sticky;
            top: 18px;
            padding: 18px;
        }

        .moyo-calendar-panel-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
        }

        .moyo-calendar-panel-title h2 {
            margin: 0;
            font-size: 17px;
            font-weight: 850;
            letter-spacing: -0.03em;
        }

        .moyo-calendar-panel-date {
            color: var(--moyo-cal-muted);
            font-size: 13px;
            font-weight: 700;
        }

        .moyo-calendar-selected-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 660px;
            overflow: auto;
            padding-right: 2px;
        }

        .moyo-calendar-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 180px;
            border: 1px dashed var(--moyo-cal-line);
            border-radius: 16px;
            color: var(--moyo-cal-muted);
            font-size: 14px;
            text-align: center;
            line-height: 1.5;
            background: #fafbfc;
        }

        .moyo-calendar-event-card {
            border: 1px solid var(--moyo-cal-line);
            border-radius: 15px;
            padding: 12px;
            background: #fff;
            cursor: pointer;
        }

        .moyo-calendar-event-card:hover {
            border-color: rgba(79, 124, 255, 0.32);
            background: #fbfcff;
        }

        .moyo-calendar-event-head {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 7px;
        }

        .moyo-calendar-event-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            flex: 0 0 auto;
        }

        .moyo-calendar-event-title {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            font-weight: 800;
        }

        .moyo-calendar-event-meta {
            color: var(--moyo-cal-muted);
            font-size: 12px;
            font-weight: 650;
        }

        .fc .fc-toolbar-title {
            font-size: 22px;
            font-weight: 850;
            letter-spacing: -0.04em;
        }

        .fc .fc-button-primary {
            background: #fff;
            border-color: var(--moyo-cal-line);
            color: #475569;
            border-radius: 10px;
            font-weight: 750;
            box-shadow: none !important;
        }

        .fc .fc-button-primary:not(:disabled):hover,
        .fc .fc-button-primary:not(:disabled).fc-button-active {
            background: var(--moyo-cal-primary);
            border-color: var(--moyo-cal-primary);
            color: #fff;
        }

        .fc .fc-daygrid-day.fc-day-today,
        .fc .fc-timegrid-col.fc-day-today {
            background: rgba(79, 124, 255, 0.055);
        }

        .fc .fc-daygrid-day-number,
        .fc .fc-col-header-cell-cushion {
            color: #384152;
            text-decoration: none;
            font-weight: 750;
        }

        .fc .fc-event {
            border: 0 !important;
            border-radius: 8px !important;
            padding: 2px 5px !important;
            font-weight: 750;
            cursor: pointer;
        }

        .fc .fc-more-link {
            color: var(--moyo-cal-primary);
            font-size: 12px;
            font-weight: 800;
        }

        .moyo-calendar-modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: rgba(15, 23, 42, 0.38);
            padding: 28px 16px;
            overflow: auto;
        }

        .moyo-calendar-modal.is-open {
            display: block;
        }

        .moyo-calendar-dialog {
            width: min(640px, 100%);
            margin: 0 auto;
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 28px 80px rgba(15, 23, 42, 0.22);
            overflow: hidden;
        }

        .moyo-calendar-modal-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            padding: 22px 24px 16px;
            border-bottom: 1px solid var(--moyo-cal-line);
        }

        .moyo-calendar-modal-title {
            margin: 0;
            font-size: 20px;
            font-weight: 850;
            letter-spacing: -0.04em;
        }

        .moyo-calendar-modal-subtitle {
            margin: 6px 0 0;
            color: var(--moyo-cal-muted);
            font-size: 13px;
        }

        .moyo-calendar-icon-btn {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            border: 1px solid var(--moyo-cal-line);
            background: #fff;
            color: #64748b;
            cursor: pointer;
        }

        .moyo-calendar-form {
            padding: 20px 24px 24px;
        }

        .moyo-calendar-field {
            margin-bottom: 15px;
        }

        .moyo-calendar-field label {
            display: block;
            margin-bottom: 7px;
            color: #374151;
            font-size: 13px;
            font-weight: 800;
        }

        .moyo-calendar-field input,
        .moyo-calendar-field select,
        .moyo-calendar-field textarea {
            width: 100%;
            min-height: 42px;
            border: 1px solid var(--moyo-cal-line);
            border-radius: 13px;
            padding: 0 12px;
            background: #fff;
            color: var(--moyo-cal-text);
            font: inherit;
            outline: none;
        }

        .moyo-calendar-field textarea {
            min-height: 86px;
            padding: 11px 12px;
            resize: vertical;
        }

        .moyo-calendar-field input:focus,
        .moyo-calendar-field select:focus,
        .moyo-calendar-field textarea:focus {
            border-color: rgba(79, 124, 255, 0.55);
            box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.12);
        }

        .moyo-calendar-grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        .moyo-calendar-check-line {
            display: flex;
            align-items: center;
            gap: 9px;
            min-height: 40px;
            padding: 0 12px;
            border: 1px solid var(--moyo-cal-line);
            border-radius: 13px;
            background: #fbfcfe;
            color: #4b5563;
            font-size: 13px;
            font-weight: 750;
        }

        .moyo-calendar-check-line input {
            width: auto;
            min-height: auto;
        }

        .moyo-calendar-repeat-box {
            display: none;
            margin-top: 10px;
            padding: 12px;
            border-radius: 15px;
            background: #f8fafc;
            border: 1px solid var(--moyo-cal-line);
        }

        .moyo-calendar-repeat-box.is-open {
            display: block;
        }

        .moyo-calendar-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding-top: 8px;
        }

        .moyo-calendar-modal-actions .moyo-calendar-danger-btn {
            margin-right: auto;
        }

        @media (max-width: 1120px) {
            .moyo-calendar-shell { grid-template-columns: 1fr; }
            .moyo-calendar-day-panel { position: static; }
        }

        @media (max-width: 720px) {
            .moyo-calendar-page { width: min(100% - 24px, 1480px); margin-top: 14px; }
            .moyo-calendar-hero { align-items: flex-start; flex-direction: column; }
            .moyo-calendar-toolbar { align-items: stretch; flex-direction: column; }
            .moyo-calendar-grid-2 { grid-template-columns: 1fr; }
            #moyoCalendar { min-height: 650px; }
        }
    </style>
</head>
<body>
<%@ include file="common/header.jsp"%>

<main class="moyo-calendar-page">
    <section class="moyo-calendar-hero" aria-label="캘린더 소개">
        <div>
            <div class="moyo-calendar-kicker"><i class="fa-regular fa-calendar-check"></i> MOYO Calendar</div>
            <h1 class="moyo-calendar-title">캘린더</h1>
            <p class="moyo-calendar-desc">개인, 그룹, 프로젝트 일정을 한 곳에서 정리합니다.</p>
        </div>
        <button type="button" class="moyo-calendar-create-btn" id="moyoCalendarCreateBtn">
            <i class="fa-solid fa-plus"></i> 일정 등록
        </button>
    </section>

    <section class="moyo-calendar-toolbar" aria-label="캘린더 필터">
        <div class="moyo-calendar-tabs" role="tablist" aria-label="일정 범위">
            <button type="button" class="moyo-calendar-tab is-active" data-scope="ALL">전체</button>
            <button type="button" class="moyo-calendar-tab" data-scope="PRIVATE">개인</button>
            <button type="button" class="moyo-calendar-tab" data-scope="WS">그룹</button>
            <button type="button" class="moyo-calendar-tab" data-scope="PROJ">프로젝트</button>
        </div>
        <div class="moyo-calendar-toggle-row" aria-label="표시 옵션">
            <button type="button" class="moyo-calendar-toggle is-active" data-type="HOLIDAY">
                <i class="fa-solid fa-flag"></i> 휴일 표시
            </button>
            <div class="moyo-calendar-view-tabs" aria-label="캘린더 보기">
                <button type="button" class="moyo-calendar-view-btn is-active" data-view="dayGridMonth">월간</button>
                <button type="button" class="moyo-calendar-view-btn" data-view="timeGridWeek">주간</button>
                <button type="button" class="moyo-calendar-view-btn" data-view="timeGridDay">일간</button>
                <button type="button" class="moyo-calendar-view-btn" data-view="listWeek">목록</button>
            </div>
        </div>
    </section>

    <section class="moyo-calendar-shell">
        <div class="moyo-calendar-main">
            <div id="moyoCalendar"></div>
        </div>

        <aside class="moyo-calendar-day-panel" aria-label="선택 날짜 일정">
            <div class="moyo-calendar-panel-title">
                <div>
                    <h2>선택한 날짜</h2>
                    <div class="moyo-calendar-panel-date" id="moyoSelectedDateText">오늘</div>
                </div>
            </div>
            <div class="moyo-calendar-selected-list" id="moyoSelectedEventList">
                <div class="moyo-calendar-empty">날짜를 선택하면<br>해당 날짜의 일정이 표시됩니다.</div>
            </div>
        </aside>
    </section>

    <div id="moyoEventModal" class="moyo-calendar-modal" aria-hidden="true">
        <div class="moyo-calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="moyoEventModalTitle">
            <div class="moyo-calendar-modal-head">
                <div>
                    <h2 class="moyo-calendar-modal-title" id="moyoEventModalTitle">일정 등록</h2>
                    <p class="moyo-calendar-modal-subtitle" id="moyoEventModalSubtitle">캘린더 화면을 유지한 채 빠르게 일정을 등록합니다.</p>
                </div>
                <button type="button" class="moyo-calendar-icon-btn" id="moyoModalCloseBtn" aria-label="닫기">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form class="moyo-calendar-form" id="moyoEventForm">
                <div class="moyo-calendar-field">
                    <label for="moyoEventTitle">일정 제목</label>
                    <input type="text" id="moyoEventTitle" placeholder="제목을 입력하세요" autocomplete="off">
                </div>

                <div class="moyo-calendar-grid-2">
                    <div class="moyo-calendar-field">
                        <label for="moyoEventType">일정 구분</label>
                        <select id="moyoEventType">
                            <option value="PRIVATE">개인</option>
                            <option value="WS">그룹</option>
                            <option value="PROJ">프로젝트</option>
                        </select>
                    </div>
                    <div class="moyo-calendar-field" id="moyoSpaceField" style="display:none;">
                        <label for="moyoSpaceId" id="moyoSpaceLabel">소속 선택</label>
                        <select id="moyoSpaceId"></select>
                    </div>
                </div>

                <div class="moyo-calendar-grid-2">
                    <div class="moyo-calendar-field">
                        <label for="moyoEventStart">시작</label>
                        <input type="datetime-local" id="moyoEventStart">
                    </div>
                    <div class="moyo-calendar-field">
                        <label for="moyoEventEnd">종료</label>
                        <input type="datetime-local" id="moyoEventEnd">
                    </div>
                </div>

                <div class="moyo-calendar-grid-2">
                    <label class="moyo-calendar-check-line" for="moyoAllDayCheck">
                        <input type="checkbox" id="moyoAllDayCheck"> 종일 일정
                    </label>
                    <label class="moyo-calendar-check-line" for="moyoRecurringCheck">
                        <input type="checkbox" id="moyoRecurringCheck"> 반복 일정
                    </label>
                </div>

                <div class="moyo-calendar-repeat-box" id="moyoRepeatBox">
                    <div class="moyo-calendar-grid-2">
                        <div class="moyo-calendar-field">
                            <label for="moyoRecurFreq">반복 주기</label>
                            <select id="moyoRecurFreq">
                                <option value="DAILY">매일</option>
                                <option value="WEEKLY" selected>매주</option>
                                <option value="MONTHLY">매월</option>
                                <option value="YEARLY">매년</option>
                            </select>
                        </div>
                        <div class="moyo-calendar-field">
                            <label for="moyoUntilDt">반복 종료일</label>
                            <input type="date" id="moyoUntilDt">
                        </div>
                    </div>
                    <label class="moyo-calendar-check-line" for="moyoLunarCheck" id="moyoLunarLine" style="display:none;">
                        <input type="checkbox" id="moyoLunarCheck"> 음력으로 반복
                    </label>
                </div>

                <div class="moyo-calendar-field">
                    <label for="moyoEventMemo">메모</label>
                    <textarea id="moyoEventMemo" placeholder="장소나 간단한 메모를 남겨둘 수 있습니다."></textarea>
                </div>

                <input type="hidden" id="moyoEventColor" value="#4f7cff">

                <div class="moyo-calendar-modal-actions">
                    <button type="button" class="moyo-calendar-danger-btn" id="moyoDeleteEventBtn" style="display:none;">삭제</button>
                    <button type="button" class="moyo-calendar-ghost-btn" id="moyoEditEventBtn" style="display:none;">수정</button>
                    <button type="button" class="moyo-calendar-ghost-btn" id="moyoCancelBtn">취소</button>
                    <button type="submit" class="moyo-calendar-primary-btn" id="moyoSaveEventBtn">등록</button>
                </div>
            </form>
        </div>
    </div>
</main>

<script>
    let calendar;
    let sessionUserId = "${sessionScope.user.userId}";
    let paramWsId = null;
    let paramMode = null;

    document.addEventListener('DOMContentLoaded', function() {
        const contextPath = '${pageContext.request.contextPath}';
        const calendarEl = document.getElementById('moyoCalendar');
        const $modal = $('#moyoEventModal');
        const $form = $('#moyoEventForm');
        const $selectedList = $('#moyoSelectedEventList');
        const $selectedDateText = $('#moyoSelectedDateText');

        const scopeColors = {
            PRIVATE: '#4f7cff',
            WS: '#20bfa9',
            PROJ: '#8b5cf6',
            TASK: '#8b5cf6',
            HOLIDAY: '#ef4444'
        };

        let currentScope = 'ALL';
        let showHoliday = true;
        let selectedDate = new Date();
        let userSpaces = { workspaces: [], projects: [] };
        let modalMode = 'create';

        const urlParams = new URLSearchParams(window.location.search);
        paramWsId = urlParams.get('wsId');
        paramMode = urlParams.get('mode');

        function getVisibleTypes() {
            const types = [];
            if (currentScope === 'ALL' || currentScope === 'PRIVATE') types.push('PRIVATE');
            if (currentScope === 'ALL' || currentScope === 'WS') types.push('WS');
            if (currentScope === 'ALL' || currentScope === 'PROJ') types.push('PROJ', 'TASK');
            if (showHoliday) types.push('HOLIDAY');
            return Array.from(new Set(types));
        }

        function normalizeType(item) {
            const rawType = item.itemType || item.itemtype || item.type || 'PRIVATE';
            if (rawType === 'TASK') {
                if (item.projId || item.projid) return 'PROJ';
                if (item.wsId || item.wsid) return 'WS';
            }
            return rawType;
        }

        function getEventColor(item) {
            const type = normalizeType(item);
            return item.color || scopeColors[type] || scopeColors.PRIVATE;
        }

        function toDateTimeInputValue(date) {
            const d = new Date(date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            return yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + mi;
        }

        function toDateInputValue(date) {
            const d = new Date(date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return yyyy + '-' + mm + '-' + dd;
        }

        function parseApiDate(value) {
            if (!value) return null;
            if (typeof value === 'string' && value.indexOf(' ') > -1) return value.replace(' ', 'T');
            return value;
        }

        function formatDateText(date) {
            return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(date));
        }

        function formatEventTime(event) {
            if (event.allDay) return '종일';
            const start = event.start ? new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(event.start) : '';
            const end = event.end ? new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(event.end) : '';
            return end ? start + ' - ' + end : start;
        }

        function setFormReadonly(readonly) {
            $('#moyoEventTitle, #moyoEventType, #moyoSpaceId, #moyoEventStart, #moyoEventEnd, #moyoAllDayCheck, #moyoRecurringCheck, #moyoRecurFreq, #moyoUntilDt, #moyoLunarCheck, #moyoEventMemo')
                .prop('disabled', readonly);
        }

        function setDateInputMode(isAllDay) {
            const $start = $('#moyoEventStart');
            const $end = $('#moyoEventEnd');
            const startValue = $start.val();
            const endValue = $end.val();

            if (isAllDay) {
                $start.attr('type', 'date');
                $end.attr('type', 'date');
                if (startValue.indexOf('T') > -1) $start.val(startValue.split('T')[0]);
                if (endValue.indexOf('T') > -1) $end.val(endValue.split('T')[0]);
            } else {
                $start.attr('type', 'datetime-local');
                $end.attr('type', 'datetime-local');
                if (startValue && startValue.indexOf('T') === -1) $start.val(startValue + 'T09:00');
                if (endValue && endValue.indexOf('T') === -1) $end.val(endValue + 'T10:00');
            }
        }

        function resetForm() {
            $form[0].reset();
            $('#moyoEventColor').val(scopeColors.PRIVATE);
            $('#moyoRepeatBox').removeClass('is-open');
            $('#moyoLunarLine').hide();
            $('#moyoSpaceField').hide();
            $('#moyoEventModal').removeData('selectedId').removeData('recurGroupId').removeData('isRecurring');
            setFormReadonly(false);
            setDateInputMode(false);
            $('#moyoDeleteEventBtn, #moyoEditEventBtn').hide();
            $('#moyoSaveEventBtn').show().text('등록');
        }

        function openModal(mode, event) {
            modalMode = mode;
            resetForm();
            $modal.addClass('is-open').attr('aria-hidden', 'false');

            if (mode === 'create') {
                $('#moyoEventModalTitle').text('일정 등록');
                $('#moyoEventModalSubtitle').text('캘린더 화면을 유지한 채 빠르게 일정을 등록합니다.');
                $('#moyoSaveEventBtn').text('등록');
                $('#moyoEventStart').val(toDateTimeInputValue(selectedDate));
                const end = new Date(selectedDate);
                end.setHours(end.getHours() + 1);
                $('#moyoEventEnd').val(toDateTimeInputValue(end));
                applyDefaultTypeByScope();
            }

            if (mode === 'read' && event) {
                const props = event.extendedProps || {};
                const displayType = props.type === 'TASK' ? (props.projId ? 'PROJ' : 'WS') : (props.type || 'PRIVATE');

                $('#moyoEventModalTitle').text('일정 상세');
                $('#moyoEventModalSubtitle').text('일정을 확인한 뒤 필요한 경우 수정할 수 있습니다.');
                $('#moyoEventTitle').val(event.title || '');
                $('#moyoEventType').val(displayType).trigger('change');
                $('#moyoSpaceId').val(displayType === 'WS' ? props.wsId : props.projId);
                $('#moyoEventColor').val(event.backgroundColor || scopeColors[displayType] || scopeColors.PRIVATE);
                $('#moyoEventModal').data('selectedId', event.id).data('recurGroupId', props.recurGroupId).data('isRecurring', props.isRecurring);
                $('#moyoAllDayCheck').prop('checked', event.allDay);
                setDateInputMode(event.allDay);

                if (event.allDay) {
                    $('#moyoEventStart').val(toDateInputValue(event.start));
                    const endDate = event.end ? new Date(event.end) : new Date(event.start);
                    if (event.end) endDate.setDate(endDate.getDate() - 1);
                    $('#moyoEventEnd').val(toDateInputValue(endDate));
                } else {
                    $('#moyoEventStart').val(toDateTimeInputValue(event.start));
                    $('#moyoEventEnd').val(toDateTimeInputValue(event.end || event.start));
                }

                const isRecurring = props.isRecurring === 'Y';
                $('#moyoRecurringCheck').prop('checked', isRecurring);
                $('#moyoRepeatBox').toggleClass('is-open', isRecurring);
                $('#moyoRecurFreq').val(props.recurType || 'WEEKLY').trigger('change');
                $('#moyoUntilDt').val(props.untilDt || '');
                $('#moyoLunarCheck').prop('checked', props.isLunar === 'Y');
                $('#moyoEventMemo').val(props.memo || '');

                setFormReadonly(true);
                $('#moyoEditEventBtn, #moyoDeleteEventBtn').show();
                $('#moyoSaveEventBtn').hide();
            }
        }

        function closeModal() {
            $modal.removeClass('is-open').attr('aria-hidden', 'true');
            resetForm();
        }

        function applyDefaultTypeByScope() {
            const type = currentScope === 'WS' || currentScope === 'PROJ' ? currentScope : 'PRIVATE';
            $('#moyoEventType').val(type).trigger('change');
        }

        function renderSelectedDateEvents(date) {
            selectedDate = new Date(date);
            $selectedDateText.text(formatDateText(selectedDate));

            if (!calendar) return;
            const dayStart = new Date(selectedDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const events = calendar.getEvents().filter(function(event) {
                if (!event.start) return false;
                const start = new Date(event.start);
                const end = event.end ? new Date(event.end) : new Date(start);
                if (event.allDay && event.end) end.setDate(end.getDate() - 1);
                return start < dayEnd && end >= dayStart;
            }).sort(function(a, b) {
                return (a.start || 0) - (b.start || 0);
            });

            if (!events.length) {
                $selectedList.html('<div class="moyo-calendar-empty">선택한 날짜에<br>표시할 일정이 없습니다.</div>');
                return;
            }

            const html = events.map(function(event) {
                const color = event.backgroundColor || scopeColors.PRIVATE;
                const type = event.extendedProps.type || 'PRIVATE';
                const label = type === 'WS' ? '그룹' : type === 'PROJ' || type === 'TASK' ? '프로젝트' : type === 'HOLIDAY' ? '휴일' : '개인';
                return '<article class="moyo-calendar-event-card" data-event-id="' + event.id + '">' +
                    '<div class="moyo-calendar-event-head">' +
                        '<span class="moyo-calendar-event-dot" style="background:' + color + '"></span>' +
                        '<div class="moyo-calendar-event-title">' + escapeHtml(event.title || '제목 없음') + '</div>' +
                    '</div>' +
                    '<div class="moyo-calendar-event-meta">' + label + ' · ' + formatEventTime(event) + '</div>' +
                '</article>';
            }).join('');
            $selectedList.html(html);
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function loadUserSpaces() {
            return $.get(contextPath + '/api/calendar/user-spaces')
                .done(function(data) {
                    userSpaces = data || { workspaces: [], projects: [] };
                    $('#moyoEventType').trigger('change');
                });
        }

        function buildEventPayload() {
            const itemType = $('#moyoEventType').val() || 'PRIVATE';
            const spaceId = $('#moyoSpaceId').val() || paramWsId;
            const isRecurring = $('#moyoRecurringCheck').is(':checked') ? 'Y' : 'N';
            const isLunar = $('#moyoLunarCheck').is(':checked') ? 'Y' : 'N';
            const allDay = ($('#moyoAllDayCheck').is(':checked') || isLunar === 'Y') ? 'Y' : 'N';

            return {
                id: $('#moyoEventModal').data('selectedId'),
                title: $.trim($('#moyoEventTitle').val()),
                startDt: $('#moyoEventStart').val(),
                endDt: $('#moyoEventEnd').val(),
                allDay: allDay,
                itemType: itemType,
                color: $('#moyoEventColor').val() || scopeColors[itemType] || scopeColors.PRIVATE,
                wsId: itemType === 'WS' ? spaceId : null,
                projId: itemType === 'PROJ' ? spaceId : null,
                userId: sessionUserId,
                isRecurring: isRecurring,
                recurType: isRecurring === 'Y' ? $('#moyoRecurFreq').val() : null,
                untilDt: isRecurring === 'Y' ? $('#moyoUntilDt').val() : null,
                recurInterval: 1,
                isLunar: isLunar
            };
        }

        function saveEvent() {
            const payload = buildEventPayload();
            if (!payload.title) {
                alert('일정 제목을 입력해주세요.');
                $('#moyoEventTitle').focus();
                return;
            }
            if (!payload.startDt || !payload.endDt) {
                alert('시작과 종료 일시를 모두 선택해주세요.');
                return;
            }
            if ((payload.itemType === 'WS' || payload.itemType === 'PROJ') && !$('#moyoSpaceId').val()) {
                alert('소속을 선택해주세요.');
                return;
            }

            const url = modalMode === 'edit' ? contextPath + '/api/calendar/update-all' : contextPath + '/api/calendar/register';
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload)
            }).done(function() {
                closeModal();
                calendar.refetchEvents();
            }).fail(function(xhr) {
                console.error(xhr);
                alert('일정 저장 중 오류가 발생했습니다.');
            });
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            height: 'auto',
            selectable: true,
            editable: true,
            dayMaxEvents: true,
            nowIndicator: true,
            slotMinTime: '06:00:00',
            slotMaxTime: '24:00:00',
            slotDuration: '00:10:00',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            },
            events: function(info, successCallback, failureCallback) {
                $.ajax({
                    url: contextPath + '/api/calendar/monthly',
                    type: 'GET',
                    data: {
                        types: getVisibleTypes().join(','),
                        startDate: info.startStr.split('T')[0],
                        endDate: info.endStr.split('T')[0],
                        userId: sessionUserId
                    }
                }).done(function(data) {
                    const events = (data || []).map(function(item) {
                        const type = normalizeType(item);
                        const rawType = item.itemType || item.itemtype || item.type || type;
                        let startVal = parseApiDate(item.startDt || item.startdt || item.STARTDT);
                        let endVal = parseApiDate(item.endDt || item.enddt || item.ENDDT);
                        const isHoliday = rawType === 'HOLIDAY' || type === 'HOLIDAY';
                        const isLunar = item.isLunar === 'Y';
                        const isAllDay = item.allDay === 'Y' || isLunar || isHoliday || (startVal && String(startVal).indexOf('00:00:00') > -1);
                        const eventColor = getEventColor(item);
                        const eventObj = {
                            id: item.id,
                            title: item.title || '제목 없음',
                            backgroundColor: eventColor,
                            borderColor: eventColor,
                            allDay: isAllDay,
                            extendedProps: {
                                type: type,
                                rawType: rawType,
                                isRecurring: item.isRecurring || 'N',
                                recurGroupId: item.recurGroupId,
                                isLunar: item.isLunar,
                                untilDt: item.untilDt,
                                recurType: item.recurType,
                                wsId: item.wsId || item.wsid,
                                projId: item.projId || item.projid,
                                memo: item.memo || item.description || ''
                            }
                        };

                        if (item.isRecurring === 'Y' && item.recurType && !isLunar) {
                            let until = item.untilDt;
                            if (until && String(until).indexOf('T') === -1) until += 'T23:59:59';
                            eventObj.rrule = {
                                freq: String(item.recurType).toLowerCase(),
                                dtstart: startVal,
                                until: until,
                                interval: 1
                            };
                        } else {
                            eventObj.start = startVal;
                            if (rawType === 'TASK' && endVal) {
                                const taskEnd = new Date(endVal);
                                taskEnd.setDate(taskEnd.getDate() + 1);
                                eventObj.end = taskEnd;
                            } else {
                                eventObj.end = endVal || startVal;
                            }
                        }
                        return eventObj;
                    });
                    successCallback(events);
                    setTimeout(function() { renderSelectedDateEvents(selectedDate); }, 0);
                }).fail(function(xhr, status, error) {
                    console.error(xhr);
                    failureCallback(error);
                });
            },
            dateClick: function(info) {
                selectedDate = new Date(info.date);
                renderSelectedDateEvents(selectedDate);
            },
            select: function(info) {
                selectedDate = new Date(info.start);
                openModal('create');

                const isAllDay = info.allDay;
                $('#moyoAllDayCheck').prop('checked', isAllDay);
                setDateInputMode(isAllDay);

                if (isAllDay) {
                    $('#moyoEventStart').val(info.startStr);
                    const endDate = new Date(info.endStr);
                    endDate.setDate(endDate.getDate() - 1);
                    $('#moyoEventEnd').val(toDateInputValue(endDate));
                } else {
                    $('#moyoEventStart').val(info.startStr.substring(0, 16));
                    $('#moyoEventEnd').val(info.endStr ? info.endStr.substring(0, 16) : info.startStr.substring(0, 16));
                }
            },
            eventClick: function(info) {
                if (info.event.extendedProps.type === 'HOLIDAY') return;
                openModal('read', info.event);
            },
            eventDrop: function(info) {
                $('#moyoEventModal').data('selectedId', info.event.id);
                const payload = buildEventPayload();
                payload.id = info.event.id;
                payload.title = info.event.title;
                payload.itemType = info.event.extendedProps.type || 'PRIVATE';
                payload.wsId = info.event.extendedProps.wsId || null;
                payload.projId = info.event.extendedProps.projId || null;
                payload.startDt = info.event.allDay ? toDateInputValue(info.event.start) : toDateTimeInputValue(info.event.start);
                payload.endDt = info.event.end ? (info.event.allDay ? toDateInputValue(info.event.end) : toDateTimeInputValue(info.event.end)) : payload.startDt;
                payload.allDay = info.event.allDay ? 'Y' : 'N';

                $.ajax({
                    url: contextPath + '/api/calendar/update-all',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload)
                }).fail(function() {
                    info.revert();
                    alert('일정 이동 중 오류가 발생했습니다.');
                });
            }
        });

        calendar.render();
        renderSelectedDateEvents(selectedDate);
        loadUserSpaces();

        if (paramMode === 'GROUP_REG' && paramWsId) {
            currentScope = 'WS';
            $('.moyo-calendar-tab').removeClass('is-active');
            $('.moyo-calendar-tab[data-scope="WS"]').addClass('is-active');
            openModal('create');
            $('#moyoEventModalTitle').text('그룹 일정 등록');
            $('#moyoEventType').val('WS').prop('disabled', true).trigger('change');
            setTimeout(function() {
                $('#moyoSpaceId').val(paramWsId).prop('disabled', true);
            }, 300);
        }

        $('#moyoCalendarCreateBtn').on('click', function() {
            selectedDate = new Date();
            openModal('create');
        });

        $('.moyo-calendar-tab').on('click', function() {
            currentScope = $(this).data('scope');
            $('.moyo-calendar-tab').removeClass('is-active');
            $(this).addClass('is-active');
            calendar.refetchEvents();
        });

        $('.moyo-calendar-toggle').on('click', function() {
            showHoliday = !showHoliday;
            $(this).toggleClass('is-active', showHoliday);
            calendar.refetchEvents();
        });

        $('.moyo-calendar-view-btn').on('click', function() {
            const view = $(this).data('view');
            $('.moyo-calendar-view-btn').removeClass('is-active');
            $(this).addClass('is-active');
            calendar.changeView(view);
        });

        $('#moyoEventType').on('change', function() {
            const type = $(this).val();
            const $field = $('#moyoSpaceField');
            const $space = $('#moyoSpaceId');
            $space.empty();
            $('#moyoEventColor').val(scopeColors[type] || scopeColors.PRIVATE);

            if (type === 'PRIVATE') {
                $field.hide();
                return;
            }

            $field.show();
            $('#moyoSpaceLabel').text(type === 'WS' ? '그룹 선택' : '프로젝트 선택');

            const list = type === 'WS' ? (userSpaces.workspaces || []) : (userSpaces.projects || []);
            let hasOption = false;
            list.forEach(function(item) {
                let role = item.wsRole || item.WS_ROLE || item.projRole || item.PROJ_ROLE;
                if (type === 'PROJ' && !role) role = 'ADMIN';
                if (role === 'ADMIN') {
                    const id = type === 'WS' ? item.wsId : item.projId;
                    const name = type === 'WS' ? item.wsName : item.projName;
                    $space.append('<option value="' + id + '">' + escapeHtml(name || '이름 없음') + '</option>');
                    hasOption = true;
                }
            });

            if (!hasOption) {
                $space.append('<option value="">관리자 권한이 있는 항목이 없습니다.</option>');
            }
        });

        $('#moyoAllDayCheck').on('change', function() {
            setDateInputMode($(this).is(':checked'));
        });

        $('#moyoRecurringCheck').on('change', function() {
            $('#moyoRepeatBox').toggleClass('is-open', $(this).is(':checked'));
        });

        $('#moyoRecurFreq').on('change', function() {
            $('#moyoLunarLine').toggle($(this).val() === 'YEARLY');
        });

        $('#moyoEditEventBtn').on('click', function() {
            modalMode = 'edit';
            $('#moyoEventModalTitle').text('일정 수정');
            $('#moyoEventModalSubtitle').text('수정 후 저장하면 캘린더에 바로 반영됩니다.');
            setFormReadonly(false);
            $(this).hide();
            $('#moyoSaveEventBtn').show().text('저장');
        });

        $('#moyoDeleteEventBtn').on('click', function() {
            const eventId = $('#moyoEventModal').data('selectedId');
            const recurGroupId = $('#moyoEventModal').data('recurGroupId');
            const isRecurring = $('#moyoEventModal').data('isRecurring');

            if (!eventId) return;
            if (!confirm(isRecurring === 'Y' ? '모든 반복 일정을 삭제하시겠습니까?' : '정말 삭제하시겠습니까?')) return;

            let deleteUrl = contextPath + '/api/calendar/delete?eventId=' + eventId + '&deleteSeries=' + (isRecurring === 'Y' ? 'Y' : 'N');
            if (isRecurring === 'Y' && recurGroupId) deleteUrl += '&recurGroupId=' + recurGroupId;

            $.ajax({ url: deleteUrl, type: 'DELETE' })
                .done(function() {
                    closeModal();
                    calendar.refetchEvents();
                })
                .fail(function(xhr) {
                    console.error(xhr);
                    alert('일정 삭제 중 오류가 발생했습니다.');
                });
        });

        $form.on('submit', function(e) {
            e.preventDefault();
            saveEvent();
        });

        $('#moyoModalCloseBtn, #moyoCancelBtn').on('click', closeModal);

        $modal.on('click', function(e) {
            if (e.target === this) closeModal();
        });

        $selectedList.on('click', '.moyo-calendar-event-card', function() {
            const event = calendar.getEventById(String($(this).data('event-id')));
            if (event && event.extendedProps.type !== 'HOLIDAY') openModal('read', event);
        });
    });
</script>
</body>
</html>
