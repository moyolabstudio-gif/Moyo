<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MOYO - 캘린더</title>
    <script src="https://cdn.jsdelivr.net/npm/rrule@2.7.2/dist/es5/rrule.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@fullcalendar/rrule@6.1.10/index.global.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonShareModal.css?v=calendar-share-release-plane-v1">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonScopeSelector.css?v=common-scope-selector-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/calendar.css?v=calendar-common-scope-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonCalendarEventPreview.css?v=calendar-preview-common-v7">

</head>
<body>
<%@ include file="../common/header.jsp"%>

<main class="moyo-calendar-page">
    <section class="moyo-calendar-hero">
        <div class="moyo-calendar-heading">
            <h1 class="moyo-calendar-title"><span class="moyo-calendar-mark" aria-hidden="true"></span>캘린더</h1>
            <p class="moyo-calendar-desc">개인부터 프로젝트까지, 일정을 한 곳에서 정리합니다.</p>
        </div>
        <button type="button" class="moyo-calendar-primary" id="openCreateEvent"><i class="fa-solid fa-plus"></i> 일정 등록</button>
    </section>

    <section class="moyo-calendar-command" aria-label="캘린더 필터와 검색">
        <div class="moyo-calendar-scopes">
            <button type="button" class="moyo-chip is-active" data-scope="ALL">전체</button>
            <button type="button" class="moyo-chip" data-scope="PRIVATE">개인</button>
            <button type="button" class="moyo-chip" data-scope="FRIEND">친구</button>
            <button type="button" class="moyo-chip" data-scope="WS">그룹</button>
            <button type="button" class="moyo-chip" data-scope="PROJ">프로젝트</button>
        </div>
        <div class="moyo-calendar-filter-box moyo-calendar-command-search">
            <i class="fa-solid fa-magnifying-glass moyo-calendar-search-icon" aria-hidden="true"></i>
            <input type="search" class="moyo-calendar-search" id="calendarSearchInput" placeholder="일정 검색" autocomplete="off">
            <button type="button" class="moyo-calendar-search-clear" id="calendarSearchClear" aria-label="검색어 지우기"><i class="fa-solid fa-xmark"></i></button>
        </div>
    </section>

    <section class="moyo-calendar-context" id="calendarContextArea" aria-label="캘린더 상세 범위">
        <section class="moyo-calendar-targetbar" id="calendarTargetBar" hidden aria-label="현재 선택 대상">
                <div class="moyo-calendar-target-current">
                    <span class="moyo-calendar-target-label" id="calendarTargetLabel">현재 선택</span>
                    <strong class="moyo-calendar-target-name" id="calendarTargetCurrent">전체</strong>
                </div>
                <button type="button" class="moyo-target-select-open" id="calendarTargetSelectOpen">
                    <i class="fa-solid fa-sliders" aria-hidden="true"></i><span>대상 변경</span>
                </button>
            </section>

        <section class="moyo-project-summary" id="calendarProjectSummary" hidden aria-label="프로젝트 업무 요약">
                <article class="moyo-project-summary-card is-todo">
                    <span class="moyo-project-summary-label">해야 할 일</span>
                    <strong class="moyo-project-summary-value" id="projectSummaryTodo">0</strong>
                </article>
                <article class="moyo-project-summary-card is-progress">
                    <span class="moyo-project-summary-label">진행 중</span>
                    <strong class="moyo-project-summary-value" id="projectSummaryProgress">0</strong>
                </article>
                <article class="moyo-project-summary-card is-done">
                    <span class="moyo-project-summary-label">완료</span>
                    <strong class="moyo-project-summary-value" id="projectSummaryDone">0</strong>
                </article>
                <article class="moyo-project-summary-card is-delayed">
                    <span class="moyo-project-summary-label">지연</span>
                    <strong class="moyo-project-summary-value" id="projectSummaryDelayed">0</strong>
                </article>
                <article class="moyo-project-summary-card is-rate">
                    <div class="moyo-project-summary-rate-head">
                        <span class="moyo-project-summary-label">진행률</span>
                        <strong class="moyo-project-summary-percent" id="projectSummaryRate">0%</strong>
                    </div>
                    <div class="moyo-project-summary-progress" aria-hidden="true">
                        <span id="projectSummaryRateBar" style="width:0%"></span>
                    </div>
                </article>
            </section>

        <section class="moyo-project-task-filter" id="calendarProjectTaskFilter" hidden aria-label="프로젝트 업무 필터">
                <div class="moyo-project-filter-group">
                    <span class="moyo-project-filter-label">업무 범위</span>
                    <div class="moyo-project-filter-options">
                        <button type="button" class="moyo-project-filter-chip is-active" data-project-assignee-mode="ALL">전체 업무</button>
                        <button type="button" class="moyo-project-filter-chip" data-project-assignee-mode="MINE">내 업무</button>
                        <button type="button" class="moyo-project-filter-chip" data-project-assignee-mode="ASSIGNEE">담당자별</button>
                        <select class="moyo-project-filter-select" id="calendarProjectAssigneeSelect" hidden aria-label="담당자 선택">
                            <option value="ALL">담당자 전체</option>
                        </select>
                    </div>
                </div>
                <div class="moyo-project-filter-group">
                    <span class="moyo-project-filter-label">상태</span>
                    <div class="moyo-project-filter-options">
                        <button type="button" class="moyo-project-filter-chip is-active" data-project-status="ALL">전체</button>
                        <button type="button" class="moyo-project-filter-chip" data-project-status="TODO">할 일</button>
                        <button type="button" class="moyo-project-filter-chip" data-project-status="IN_PROGRESS">진행 중</button>
                        <button type="button" class="moyo-project-filter-chip" data-project-status="DONE">완료</button>
                        <button type="button" class="moyo-project-filter-chip is-delay" data-project-status="DELAYED">지연</button>
                    </div>
                </div>
                <div class="moyo-project-filter-group is-display">
                    <span class="moyo-project-filter-label">표시</span>
                    <div class="moyo-project-filter-options">
                        <button type="button" class="moyo-project-filter-chip is-active" data-project-display-kind="SCHEDULE" aria-pressed="true">일정</button>
                        <button type="button" class="moyo-project-filter-chip is-active" data-project-display-kind="TASK" aria-pressed="true">업무</button>
                    </div>
                </div>
                <button type="button" class="moyo-project-filter-reset" id="calendarProjectFilterReset">초기화</button>
            </section>

    </section>

    <section class="moyo-calendar-stage">
        <div class="moyo-calendar-board">
            <div class="moyo-calendar-board-head">
                <div class="moyo-calendar-board-filter">
                    <div class="moyo-calendar-filter-wrap">
                        <button type="button" class="moyo-calendar-filter-btn" id="calendarAllFilterBtn" aria-expanded="false" aria-controls="calendarAllFilterMenu">
                            <i class="fa-solid fa-sliders"></i> 필터
                        </button>
                        <div class="moyo-calendar-filter-popover" id="calendarAllFilterMenu" hidden>
                            <div class="moyo-filter-head">
                                <div class="moyo-filter-title">전체 필터</div>
                                <button type="button" class="moyo-filter-reset" id="calendarAllFilterReset">초기화</button>
                            </div>
                            <div class="moyo-filter-section" data-filter-section="scope">
                                <div class="moyo-filter-section-head">
                                    <div class="moyo-filter-label" data-filter-scope-label>범위</div>
                                    <div class="moyo-filter-mini-actions">
                                        <button type="button" class="moyo-filter-mini-btn" data-filter-bulk="scope" data-filter-action="all">전체 선택</button>
                                        <span class="moyo-filter-mini-sep">/</span>
                                        <button type="button" class="moyo-filter-mini-btn" data-filter-bulk="scope" data-filter-action="none">해제</button>
                                    </div>
                                </div>
                                <div class="moyo-filter-chip-list" id="calendarScopeFilterList"></div>
                            </div>
                            <div class="moyo-filter-section">
                                <div class="moyo-filter-section-head">
                                    <div class="moyo-filter-label">유형</div>
                                    <div class="moyo-filter-mini-actions">
                                        <button type="button" class="moyo-filter-mini-btn" data-filter-bulk="type" data-filter-action="all">전체 선택</button>
                                        <span class="moyo-filter-mini-sep">/</span>
                                        <button type="button" class="moyo-filter-mini-btn" data-filter-bulk="type" data-filter-action="none">해제</button>
                                    </div>
                                </div>
                                <div class="moyo-filter-type-grid" id="calendarTypeFilterList"></div>
                            </div>
                            <div class="moyo-filter-section" data-filter-section="project-display">
                                <div class="moyo-filter-section-head">
                                    <div class="moyo-filter-label">프로젝트 표시</div>
                                    <div class="moyo-filter-mini-actions">
                                        <button type="button" class="moyo-filter-mini-btn" data-filter-bulk="project" data-filter-action="all">전체 선택</button>
                                        <span class="moyo-filter-mini-sep">/</span>
                                        <button type="button" class="moyo-filter-mini-btn" data-filter-bulk="project" data-filter-action="none">해제</button>
                                    </div>
                                </div>
                                <div class="moyo-filter-chip-list" id="calendarProjectDisplayFilterList"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="moyo-calendar-month-nav">
                    <button type="button" class="moyo-icon-btn" id="calendarPrev" aria-label="이전"><i class="fa-solid fa-chevron-left"></i></button>
                    <h2 class="moyo-calendar-current" id="calendarCurrentTitle">캘린더</h2>
                    <button type="button" class="moyo-icon-btn" id="calendarNext" aria-label="다음"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <div class="moyo-calendar-board-actions">
                    <button type="button" class="moyo-today-btn" id="calendarToday">오늘</button>
                </div>
            </div>
            <div class="moyo-calendar-canvas">
                <div id="moyoCalendar"></div>
            </div>
        </div>

        <aside class="moyo-day-panel" aria-label="선택한 날짜 일정">
            <div class="moyo-day-panel-top">
                <div class="moyo-panel-label"><i class="fa-regular fa-clock"></i> 선택한 날짜</div>
                <div class="moyo-selected-date" id="selectedDateTitle">오늘</div>
                <div class="moyo-selected-weekday" id="selectedDateSub">일정을 선택해 주세요</div>
            </div>
            <div class="moyo-day-list" id="selectedDateEvents">
                <div class="moyo-day-empty">날짜를 선택하면<br>그날의 일정만 정리해서 보여줍니다.</div>
            </div>
        </aside>
    </section>

</main>


<div class="moyo-quick-create-overlay" id="calendarQuickCreateModal" hidden>
    <section class="moyo-quick-create-panel" role="dialog" aria-modal="true" aria-labelledby="quickCreateTitle">
        <header class="moyo-quick-create-head">
            <button type="button" class="moyo-quick-head-detail" id="quickCreateDetailBtn">상세 작성</button>
            <div class="moyo-quick-create-brand">
                <div class="moyo-quick-create-titlebox">
                    <h2 id="quickCreateTitle">간편 일정 등록</h2>
                </div>
            </div>
            <div class="moyo-quick-head-actions">
                <button type="button" class="moyo-quick-create-close" id="quickCreateClose" aria-label="닫기"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
        </header>

        <div class="moyo-quick-create-body">
            <section class="moyo-quick-section">
                <label class="moyo-quick-label" for="quickCreateTitleInput">일정 제목</label>
                <div class="moyo-quick-title-row">
                    <input type="text" class="moyo-quick-input" id="quickCreateTitleInput" placeholder="예: 친구 약속, 병원 예약, 가족 모임" autocomplete="off">
                    <div class="moyo-quick-type-wrap">
                        <button type="button" class="moyo-quick-type-button" id="quickCreateTypeButton" aria-label="일정 유형 선택" aria-haspopup="true" aria-expanded="false"><span class="moyo-quick-type-icon" id="quickCreateTypeIcon" aria-hidden="true"></span><span class="moyo-quick-type-text" id="quickCreateTypeText">일반</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
                        <div class="moyo-quick-type-popover" id="quickCreateTypePopover" hidden>
                            <div class="moyo-quick-type-popover-head">
                                <strong class="moyo-quick-type-popover-title">일정 유형 선택</strong>
                                <button type="button" class="moyo-quick-type-popover-close" id="quickCreateTypeClose" aria-label="일정 유형 선택 닫기"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
                            </div>
                            <div class="moyo-quick-type-grid" id="quickCreateTypeGrid"></div>
                        </div>
                    </div>
                </div>
                <div class="moyo-quick-public-row" id="quickCreatePublicRow">
                    <button type="button" class="moyo-quick-public-toggle" id="quickCreateMoyoToggle" aria-pressed="false">
                        <img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" aria-hidden="true"><span>MOYO 공개</span>
                    </button>
                    <span class="moyo-quick-help">MOYO 피드에 공개하면 친구들이 이 일정을 함께 볼 수 있습니다.</span>
                </div>
            </section>

            <section class="moyo-quick-section">
                <span class="moyo-quick-label">일정 시간</span>
                <div class="moyo-quick-time-grid">
                    <span class="moyo-quick-row-label">시작</span>
                    <div class="moyo-quick-date-field">
                        <input type="text" class="moyo-quick-input moyo-quick-date-input" id="quickCreateStartDate" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-quick-date-picker>
                        <button type="button" class="moyo-quick-date-trigger" data-quick-date-target="quickCreateStartDate" aria-label="시작 날짜 선택"><i class="fa-regular fa-calendar" aria-hidden="true"></i></button>
                    </div>
                    <div class="moyo-quick-time-field moyo-quick-time-input">
                        <span class="moyo-quick-time-meridiem is-am" data-quick-time-meridiem-for="quickCreateStartTime">오전</span>
                        <input type="text" class="moyo-quick-input moyo-quick-time-text" id="quickCreateStartTime" inputmode="numeric" autocomplete="off" placeholder="09:00" data-quick-time-picker>
                        <button type="button" class="moyo-quick-time-trigger" data-quick-time-target="quickCreateStartTime" aria-label="시작 시간 선택"><i class="fa-regular fa-clock" aria-hidden="true"></i></button>
                    </div>
                </div>
                <div class="moyo-quick-time-grid">
                    <span class="moyo-quick-row-label">종료</span>
                    <div class="moyo-quick-date-field">
                        <input type="text" class="moyo-quick-input moyo-quick-date-input" id="quickCreateEndDate" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-quick-date-picker>
                        <button type="button" class="moyo-quick-date-trigger" data-quick-date-target="quickCreateEndDate" aria-label="종료 날짜 선택"><i class="fa-regular fa-calendar" aria-hidden="true"></i></button>
                    </div>
                    <div class="moyo-quick-time-field moyo-quick-time-input">
                        <span class="moyo-quick-time-meridiem is-am" data-quick-time-meridiem-for="quickCreateEndTime">오전</span>
                        <input type="text" class="moyo-quick-input moyo-quick-time-text" id="quickCreateEndTime" inputmode="numeric" autocomplete="off" placeholder="10:00" data-quick-time-picker>
                        <button type="button" class="moyo-quick-time-trigger" data-quick-time-target="quickCreateEndTime" aria-label="종료 시간 선택"><i class="fa-regular fa-clock" aria-hidden="true"></i></button>
                    </div>
                </div>
                <div class="moyo-quick-setting-grid">
                    <label class="moyo-quick-check-pill"><input type="checkbox" id="quickCreateAllDay"><span>종일</span></label>
                    <div class="moyo-quick-select-wrap" data-quick-select-wrap>
                        <select class="moyo-quick-select moyo-quick-select-native" id="quickCreateLunar" tabindex="-1" aria-hidden="true">
                            <option value="N">양력</option>
                            <option value="Y">음력</option>
                        </select>
                        <button type="button" class="moyo-quick-select-button" data-quick-select-button="quickCreateLunar" aria-haspopup="listbox" aria-expanded="false">양력</button>
                        <div class="moyo-quick-select-menu" data-quick-select-menu="quickCreateLunar" role="listbox" hidden></div>
                    </div>
                    <div class="moyo-quick-select-wrap" data-quick-select-wrap>
                        <select class="moyo-quick-select moyo-quick-select-native" id="quickCreateRepeat" tabindex="-1" aria-hidden="true">
                            <option value="">반복 안 함</option>
                            <option value="DAILY">매일</option>
                            <option value="WEEKLY">매주</option>
                            <option value="MONTHLY">매월</option>
                            <option value="YEARLY">매년</option>
                        </select>
                        <button type="button" class="moyo-quick-select-button" data-quick-select-button="quickCreateRepeat" aria-haspopup="listbox" aria-expanded="false">반복 안 함</button>
                        <div class="moyo-quick-select-menu" data-quick-select-menu="quickCreateRepeat" role="listbox" hidden></div>
                    </div>
                    <div class="moyo-quick-select-wrap" data-quick-select-wrap>
                        <select class="moyo-quick-select moyo-quick-select-native" id="quickCreateTimezone" tabindex="-1" aria-hidden="true">
                            <option value="Asia/Seoul">서울(GMT+09:00)</option>
                            <option value="Asia/Tokyo">도쿄(GMT+09:00)</option>
                            <option value="Asia/Shanghai">상하이(GMT+08:00)</option>
                            <option value="Asia/Hong_Kong">홍콩(GMT+08:00)</option>
                            <option value="Asia/Singapore">싱가포르(GMT+08:00)</option>
                            <option value="Asia/Bangkok">방콕(GMT+07:00)</option>
                            <option value="Asia/Dubai">두바이(GMT+04:00)</option>
                            <option value="Europe/London">런던(GMT+00:00)</option>
                            <option value="Europe/Paris">파리(GMT+01:00)</option>
                            <option value="Europe/Berlin">베를린(GMT+01:00)</option>
                            <option value="America/New_York">뉴욕(GMT-05:00)</option>
                            <option value="America/Chicago">시카고(GMT-06:00)</option>
                            <option value="America/Denver">덴버(GMT-07:00)</option>
                            <option value="America/Los_Angeles">로스앤젤레스(GMT-08:00)</option>
                            <option value="America/Vancouver">밴쿠버(GMT-08:00)</option>
                            <option value="America/Toronto">토론토(GMT-05:00)</option>
                            <option value="Australia/Sydney">시드니(GMT+10:00)</option>
                            <option value="Pacific/Auckland">오클랜드(GMT+12:00)</option>
                            <option value="UTC">UTC(GMT+00:00)</option>
                        </select>
                        <button type="button" class="moyo-quick-select-button" data-quick-select-button="quickCreateTimezone" aria-haspopup="listbox" aria-expanded="false">서울(GMT+09:00)</button>
                        <div class="moyo-quick-select-menu" data-quick-select-menu="quickCreateTimezone" role="listbox" hidden></div>
                    </div>
                </div>
            </section>

            <section class="moyo-quick-section">
                <label class="moyo-quick-label" for="quickCreateReminder">알림</label>
                <div class="moyo-quick-alert-row">
                    <div class="moyo-quick-select-wrap" data-quick-select-wrap>
                        <select class="moyo-quick-select moyo-quick-select-native" id="quickCreateReminder" tabindex="-1" aria-hidden="true">
                            <option value="">알림 없음</option>
                            <option value="5">5분 전</option>
                            <option value="10">10분 전</option>
                            <option value="30">30분 전</option>
                            <option value="60">1시간 전</option>
                            <option value="1440">하루 전</option>
                        </select>
                        <button type="button" class="moyo-quick-select-button" data-quick-select-button="quickCreateReminder" aria-haspopup="listbox" aria-expanded="false">알림 없음</button>
                        <div class="moyo-quick-select-menu" data-quick-select-menu="quickCreateReminder" role="listbox" hidden></div>
                    </div>
                    <span class="moyo-quick-help">알림을 설정하면 일정 시작 전에 알려줍니다.</span>
                </div>
            </section>
        </div>

        <footer class="moyo-quick-create-actions">
            <button type="button" class="moyo-quick-btn is-primary" id="quickCreateSave">등록</button>
        </footer>
    </section>
</div>

<%@ include file="../common/commonScopeSelector.jspf"%>

<%@ include file="../common/commonCalendarEventPreview.jspf"%>

<button type="button" id="calendarViewShareOpenHidden" data-share-content-id="" hidden>공유</button>
<span id="calendarViewShareCount" hidden>0</span>
<span id="calendarViewPermissionCount" hidden>0</span>
<button type="button" id="calendarViewPermissionOpenHidden" hidden>권한</button>
<div id="calendarViewShareHiddenFields" hidden></div>
<div id="calendarViewShareInitialSource" hidden></div>
<div id="calendarViewWorkspaceMemberSource" hidden></div>
<div id="calendarViewProjectMemberSource" hidden></div>
<div id="calendarViewWorkspaceTargetSource" hidden></div>
<div id="calendarViewProjectTargetSource" hidden></div>
<div id="calendarViewShareModal" class="note-write-share-modal moyo-share-modal" data-current-user-id="${sessionScope.user.userId}" hidden>
    <div class="note-write-share-backdrop" data-note-share-close></div>
    <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="calendarViewShareModalTitle">
        <div class="note-write-share-modal-head">
            <div>
                <h3 id="calendarViewShareModalTitle">공유</h3>
                <p>일정 공유 상태를 확인합니다.</p>
            </div>
            <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
        </div>
        <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
            <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
            <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">그룹</button>
            <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
        </div>
        <div class="note-write-share-toolbar">
            <select id="calendarViewShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
            <input type="text" id="calendarViewShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
        </div>
        <div class="note-write-share-body note-write-share-body-simple">
            <div>
                <div class="note-write-share-subtitle">받는 대상</div>
                <div id="calendarViewShareCandidates" class="note-write-share-list"></div>
            </div>
            <div>
                <div class="note-write-share-subtitle">공유 목록 <span id="calendarViewShareModalCount" class="note-share-modal-count" hidden>0</span></div>
                <div id="calendarViewShareSelected" class="note-write-share-selected"></div>
            </div>
        </div>
        <div class="note-write-share-modal-actions">
            <div>
                <button type="button" class="note-soft-btn" data-note-share-close>닫기</button>
                <button type="button" id="calendarViewShareApply" class="note-gradient-btn">확인</button>
            </div>
        </div>
    </section>
</div>

<script src="${pageContext.request.contextPath}/js/commonShareModal.js?v=calendar-share-release-plane-v1"></script>
<script>
    window.MOYO_CALENDAR_CONTEXT_PATH = '${pageContext.request.contextPath}';
    window.MOYO_CALENDAR_SESSION_USER_ID = '${sessionScope.user.userId}';
</script>
<script src="${pageContext.request.contextPath}/js/commonCalendarEventPreview.js?v=calendar-preview-common-v6"></script>
<script src="${pageContext.request.contextPath}/js/commonScopeSelector.js?v=common-scope-selector-v2"></script>
<script src="${pageContext.request.contextPath}/js/calendar.js?v=calendar-common-scope-v2"></script>
</body>
</html>
