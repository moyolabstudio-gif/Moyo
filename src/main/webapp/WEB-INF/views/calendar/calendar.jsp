<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>MOYO Calendar</title>

    <!-- Existing common modal/function dependencies only.
         Intentionally does NOT load legacy calendar.css/calendar.js. -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=20260810-inline-share-state-popover-2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonScopeSelector.css?v=common-scope-selector-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonQuickCalendarCreate.css?v=attendee-share-avatar-v40">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=moyo-ui-v3">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentRecordModal.css?v=record-readonly-upload-hide-v85-20260920">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectTask.css?v=update-dot-layout-v13-20260920">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectTimeline.css?v=time-plan-picker-bound-color-v1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonCalendarEventPreview.css?v=event-header-actions-unified-v1">

    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/calendar.css">
</head>
<body
    data-context-path="${pageContext.request.contextPath}"
    data-current-user-id="${sessionScope.user.userId}">
    <%@ include file="../common/header.jsp"%>
    <main id="moyoCalendarV2" class="moyo-cal2-page" data-calendar-version="2">
        <div class="moyo-cal2-root" aria-label="MOYO Calendar">
            <%-- Step 31: MOYO Calendar V2 header + scope navigation + current-month integrated search. --%>
            <header class="moyo-cal2-header" aria-label="달력 상단 영역">
                <div class="moyo-cal2-header-main">
                    <div class="moyo-cal2-month-nav" aria-label="달력 월 이동">
                        <button type="button" id="moyoCal2Prev" class="moyo-cal2-icon-btn" aria-label="이전 달" title="이전 달">
                            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                        </button>

                        <div class="moyo-cal2-month-heading">
                            <strong id="moyoCal2MonthLabel" class="moyo-cal2-month-label" aria-live="polite"></strong>
                        </div>

                        <button type="button" id="moyoCal2Next" class="moyo-cal2-icon-btn" aria-label="다음 달" title="다음 달">
                            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </button>

                        <button type="button" id="moyoCal2Today" class="moyo-cal2-today-btn">오늘</button>

                        <div id="moyoCal2Context" class="moyo-cal2-context moyo-cal2-context-inline" aria-label="현재 프로젝트" hidden>
                            <div class="moyo-cal2-project-context-copy">
                                <span class="moyo-cal2-project-context-kicker">현재 프로젝트</span>
                                <div class="moyo-cal2-project-context-main">
                                    <strong id="moyoCal2ProjectContextName" class="moyo-cal2-project-context-name">프로젝트</strong>
                                    <span id="moyoCal2ProjectContextMeta" class="moyo-cal2-project-context-meta"></span>
                                </div>
                            </div>
                            <button type="button" id="moyoCal2ProjectContextChange" class="moyo-cal2-project-context-change" hidden>프로젝트 변경</button>
                        </div>
                    </div>

                    <nav id="moyoCal2ScopeSlot" class="moyo-cal2-scope-nav" data-cal2-slot="scope" aria-label="달력 1차 필터">
                        <button type="button" id="moyoCal2MoyoOnly" class="moyo-cal2-scope-mascot" aria-pressed="false" aria-label="모요 공개 일정 숨기기" title="모요 공개 일정 숨기기" hidden>
                            <img src="${pageContext.request.contextPath}/brand/moyo_mark.png" alt="" aria-hidden="true">
                        </button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="ALL" aria-pressed="false">전체</button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="PRIVATE" aria-pressed="false">개인</button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="FRIEND" aria-pressed="false">친구</button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="WS" aria-pressed="false">그룹</button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="PROJ" aria-pressed="false">프로젝트</button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="EVENT" aria-pressed="false">일정</button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="TASK" aria-pressed="false">업무</button>
                        <button type="button" class="moyo-cal2-scope-tab" data-cal2-scope="PLAN" aria-pressed="false">계획</button>
                    </nav>

                    <div class="moyo-cal2-header-actions" aria-label="달력 기능">
                        <div class="moyo-cal2-search-wrap">
                            <div class="moyo-cal2-search-input-wrap">
                                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                                <input type="search" id="moyoCal2SearchInput" class="moyo-cal2-search-input" placeholder="일정, 업무, 계획 검색" autocomplete="off" spellcheck="false" aria-label="달력 내용 검색" aria-controls="moyoCal2SearchPanel" aria-expanded="false">
                                <button type="button" id="moyoCal2SearchClear" class="moyo-cal2-search-clear" aria-label="검색어 지우기" hidden>
                                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                                </button>
                            </div>
                            <section id="moyoCal2SearchPanel" class="moyo-cal2-search-panel" aria-label="달력 검색 결과" hidden>
                                <p id="moyoCal2SearchStatus" class="moyo-cal2-search-status">현재 달에 불러온 일정·업무·계획에서 검색해요.</p>
                                <div id="moyoCal2SearchResults" class="moyo-cal2-search-results" role="list"></div>
                            </section>
                        </div>

                        <button type="button" id="moyoCal2Create" class="moyo-cal2-header-btn moyo-cal2-header-btn-primary" aria-disabled="true">
                            <i class="fa-solid fa-plus" aria-hidden="true"></i>
                            <span>일정 추가</span>
                        </button>
                    </div>
                </div>

            </header>

            <div class="moyo-cal2-workspace">
                <section class="moyo-cal2-main" aria-label="달력 본체">
                    <div class="moyo-cal2-calendar-board">
                        <div id="moyoCal2Calendar" class="moyo-cal2-calendar" aria-label="월간 달력"></div>
                        <div id="moyoCal2CalendarStatus" class="moyo-cal2-calendar-status" role="status" aria-live="polite" hidden>
                            <span class="moyo-cal2-calendar-status-spinner" aria-hidden="true"></span>
                            <div class="moyo-cal2-calendar-status-copy">
                                <strong id="moyoCal2CalendarStatusTitle">달력을 불러오는 중이에요.</strong>
                                <span id="moyoCal2CalendarStatusText">잠시만 기다려 주세요.</span>
                            </div>
                            <button type="button" id="moyoCal2CalendarRetry" class="moyo-cal2-calendar-retry" hidden>다시 불러오기</button>
                        </div>
                        <div id="moyoCal2CalendarNotice" class="moyo-cal2-calendar-notice" role="status" aria-live="polite" hidden></div>
                    </div>
                </section>

                <aside id="moyoCal2DayPanel" class="moyo-cal2-day-panel" aria-label="선택한 날짜와 이번 달 요약">
                    <div class="moyo-cal2-day-panel-inner">
                        <div class="moyo-cal2-side-pane moyo-cal2-side-pane-top">
                            <section class="moyo-cal2-side-section moyo-cal2-side-day" aria-label="선택한 날짜">
                                <div class="moyo-cal2-day-panel-head">
                                    <div class="moyo-cal2-day-panel-date-copy">
                                        <div class="moyo-cal2-day-panel-label">
                                            <span class="moyo-cal2-day-panel-label-icon" aria-hidden="true"><i class="fa-regular fa-calendar"></i></span>
                                            <span class="moyo-cal2-day-panel-kicker">선택한 날</span>
                                        </div>
                                        <h2 id="moyoCal2DayDate" class="moyo-cal2-day-panel-date">날짜를 선택해 주세요</h2>
                                        <p id="moyoCal2DayMeta" class="moyo-cal2-day-panel-meta" aria-live="polite">달력에서 하루를 골라보세요.</p>
                                    </div>
                                    <span id="moyoCal2DayToday" class="moyo-cal2-day-panel-today" hidden>오늘</span>
                                </div>
                                <div id="moyoCal2DayCategoryTabs" class="moyo-cal2-day-category-tabs" aria-label="선택한 날 항목 필터" hidden>
                                    <button type="button" class="is-active" data-day-category="ALL">전체 <span data-day-count="ALL">0</span></button>
                                    <button type="button" data-day-category="SCHEDULE">일정 <span data-day-count="SCHEDULE">0</span></button>
                                    <button type="button" data-day-category="PLAN">계획 <span data-day-count="PLAN">0</span></button>
                                    <button type="button" data-day-category="TASK">업무 <span data-day-count="TASK">0</span></button>
                                </div>
                                <div id="moyoCal2DayPanelBody" class="moyo-cal2-day-panel-body" aria-live="polite">
                                    <div class="moyo-cal2-day-panel-empty">
                                        <span class="moyo-cal2-day-panel-empty-icon" aria-hidden="true"><i class="fa-regular fa-calendar"></i></span>
                                        <p>날짜를 선택하면 하루 내용을 한눈에 볼 수 있어요.</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div class="moyo-cal2-side-pane moyo-cal2-side-pane-bottom" aria-label="이번 달 요약">
                            <section class="moyo-cal2-side-section moyo-cal2-month-summary">
                                <div class="moyo-cal2-month-summary-head">
                                    <div>
                                        <span class="moyo-cal2-day-panel-kicker">이번 달</span>
                                        <h2 class="moyo-cal2-side-title">월간 요약</h2>
                                    </div>
                                </div>

                                <section id="moyoCal2FilterRow" class="moyo-cal2-month-block moyo-cal2-side-filter" aria-label="달력 세부 필터" hidden>
                                    <span class="moyo-cal2-month-block-title">보기 설정</span>
                                    <div id="moyoCal2SecondaryFilters" class="moyo-cal2-secondary-filters" aria-label="달력 2차 필터"></div>
                                    <button type="button" id="moyoCal2ScopeTarget" class="moyo-cal2-scope-target" hidden>
                                        <span id="moyoCal2ScopeTargetLabel">대상 선택</span>
                                        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                                    </button>
                                </section>

                                <section id="moyoCal2BirthdaySection" class="moyo-cal2-month-block moyo-cal2-side-birthdays" aria-label="이번 달 생일" hidden>
                                    <div class="moyo-cal2-month-block-head">
                                        <span class="moyo-cal2-month-block-title" id="moyoCal2BirthdayTitle">친구 생일</span>
                                        <span id="moyoCal2BirthdayCount" class="moyo-cal2-birthday-count"></span>
                                    </div>
                                    <div id="moyoCal2BirthdayList" class="moyo-cal2-birthday-list"></div>
                                </section>

                                <section id="moyoCal2HolidaySection" class="moyo-cal2-month-block" aria-label="이번 달 공휴일" hidden>
                                    <div class="moyo-cal2-month-block-head">
                                        <span class="moyo-cal2-month-block-title">공휴일</span>
                                        <span id="moyoCal2HolidayCount" class="moyo-cal2-birthday-count"></span>
                                    </div>
                                    <div id="moyoCal2HolidayList" class="moyo-cal2-holiday-list"></div>
                                </section>

                                <section id="moyoCal2MonthProjectsSection" class="moyo-cal2-month-block" aria-label="이번 달 프로젝트" hidden>
                                    <div class="moyo-cal2-month-block-head">
                                        <span class="moyo-cal2-month-block-title">프로젝트</span>
                                        <span id="moyoCal2MonthProjectsCount" class="moyo-cal2-birthday-count"></span>
                                    </div>
                                    <div id="moyoCal2MonthProjects" class="moyo-cal2-month-projects"></div>
                                </section>

                                <section id="moyoCal2ProjectProgressSection" class="moyo-cal2-project-progress" aria-label="프로젝트 진행률" hidden>
                                    <div class="moyo-cal2-project-progress-head">
                                        <span>프로젝트 진행률</span>
                                        <strong id="moyoCal2ProjectProgressRate">0%</strong>
                                    </div>
                                    <div class="moyo-cal2-project-progress-track"
                                         role="progressbar"
                                         aria-label="프로젝트 진행률"
                                         aria-valuemin="0"
                                         aria-valuemax="100"
                                         aria-valuenow="0">
                                        <span id="moyoCal2ProjectProgressBar" class="moyo-cal2-project-progress-bar"></span>
                                    </div>
                                </section>
                            </section>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </main>

    <%-- Existing modal DOM only. Calendar V2 owns no modal markup. --%>
    <%@ include file="../project/projectTaskModal.jspf" %>
    <%@ include file="../project/projectPlanModal.jspf" %>
    <%@ include file="../common/commonQuickCalendarCreate.jspf" %>
    <jsp:include page="/WEB-INF/views/common/commonContentRecordModal.jsp" />
    <%@ include file="../common/commonScopeSelector.jspf" %>
    <%@ include file="../common/commonCalendarEventPreview.jspf" %>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        window.MOYO_CALENDAR_CONTEXT_PATH = '${pageContext.request.contextPath}';
        window.MOYO_CALENDAR_SESSION_USER_ID = '${sessionScope.user.userId}';

        // Compatibility context used by existing project task/plan modals only.
        // Calendar V2 state remains independent from this object.
        window.PROJECT_MAIN_CONFIG = window.PROJECT_MAIN_CONFIG || {};
        window.PROJECT_MAIN_CONFIG.contextPath = '${pageContext.request.contextPath}';
        window.PROJECT_MAIN_CONFIG.loginUserId = '${sessionScope.user.userId}';
        window.PROJECT_MAIN_CONFIG.canManageTasks = false;
        window.PROJECT_MAIN_CONFIG.canManageProject = false;
        window.PROJECT_MAIN_CONFIG.isPersonalProject = false;

        window.MOYO_CALENDAR_V2_CONTEXT = Object.freeze({
            contextPath: '${pageContext.request.contextPath}',
            loginUserId: '${sessionScope.user.userId}'
        });
    </script>

    <script src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=20260810-share-status-tdz-fix"></script>
    <script src="${pageContext.request.contextPath}/js/commonCalendarEventPreview.js?v=calendar-preview-avatar-policy-v12"></script>
    <script src="${pageContext.request.contextPath}/js/commonScopeSelector.js?v=common-scope-selector-v2"></script>
    <script src="${pageContext.request.contextPath}/js/commonMemberDataAdapter.js?v=calendar-attendee-fetch-only-v2"></script>
    <script src="${pageContext.request.contextPath}/js/friendPeopleAdapter.js?v=calendar-attendee-v1"></script>
    <script src="${pageContext.request.contextPath}/js/common/commonContentRecordModal.js"></script>
    <script src="${pageContext.request.contextPath}/js/commonQuickCalendarCreate.js?v=attendee-share-avatar-v29"></script>
    <script src="${pageContext.request.contextPath}/js/projectPlanLoader.js?v=time-plan-picker-bound-color-v1"></script>
    <script src="${pageContext.request.contextPath}/js/projectTask.js?v=update-dot-layout-v24-20260920"></script>

    <%-- Calendar V2 engine only. Legacy calendar.js/calendar.css remain intentionally excluded. --%>
    <script src="https://cdn.jsdelivr.net/npm/rrule@2.7.2/dist/es5/rrule.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@fullcalendar/rrule@6.1.10/index.global.min.js"></script>

    <script src="${pageContext.request.contextPath}/js/calendarBridge.js"></script>
    <script src="${pageContext.request.contextPath}/js/calendar.js"></script>
</body>
</html>
