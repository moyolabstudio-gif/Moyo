<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<section id="projectTimelineCard"
         class="project-timeline-card project-plan-guide moyo-scope-widget moyo-scope-widget--project-plan is-loading is-collapsed"
         data-project-plan-guide
         aria-busy="true"
         aria-labelledby="projectPlanGuideTitle">
    <div class="project-plan-guide__summary">
        <div class="project-plan-guide__summary-main">
            <span class="project-plan-guide__icon" aria-hidden="true"><i class="fa-regular fa-calendar-check"></i></span>
            <span class="project-plan-guide__copy">
                <strong id="projectPlanGuideTitle">프로젝트 계획</strong>
                <span id="projectPlanGuideDescription">필요한 방식으로 프로젝트 계획을 만들어 관리합니다.</span>
            </span>
        </div>

        <div class="project-plan-guide__controls">
            <span id="projectPlanMeta" class="project-plan-guide__meta" aria-live="polite" hidden>
                <span id="projectPlanPeriod" class="project-plan-guide__period">
                    <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
                    <span class="project-plan-guide__period-text"></span>
                </span>
                <span id="projectPlanDeadline" class="project-plan-guide__deadline" aria-label="D-Day"></span>
            </span>

            <div class="project-plan-guide__create-actions" hidden>
                <button type="button" id="openProjectPlanTypeChooserBtn" class="project-plan-create-btn" hidden onclick="openProjectPlanTypeChooser()">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                    <span>계획 추가</span>
                </button>
            </div>

            <button type="button"
                    id="projectTimelineToggle"
                    class="project-plan-guide__icon-toggle"
                    hidden
                    aria-expanded="false"
                    aria-controls="projectTimelineExpandable"
                    aria-label="프로젝트 계획 펼치기"
                    onclick="toggleProjectPlanGuide()">
                <span class="project-plan-guide__chevron" aria-hidden="true"></span>
            </button>
        </div>
    </div>

    <div id="projectTimelineExpandable" class="project-plan-guide__expandable">
        <div id="projectPlanEmpty" class="project-plan-empty-state" hidden>
            <strong>아직 만든 프로젝트 계획이 없습니다.</strong>
            <span>기간별 계획, 시간별 계획표, 주간 계획표 중 필요한 방식을 선택해 시작할 수 있습니다.</span>
        </div>

        <div id="projectPlanWorkspace" hidden>
            <div class="project-plan-view-tabs" role="tablist" aria-label="프로젝트 계획 보기">
                <button type="button" id="ganttPlanTab" class="project-plan-view-tab" data-plan-tab="GANTT" role="tab" aria-selected="false" onclick="selectProjectPlanTab('GANTT')" hidden>기간별 계획</button>
                <button type="button" id="timeScheduleTab" class="project-plan-view-tab" data-plan-tab="TIME_SCHEDULE" role="tab" aria-selected="false" onclick="selectProjectPlanTab('TIME_SCHEDULE')" hidden>시간별 계획표</button>
                <button type="button" id="weeklyPlanTab" class="project-plan-view-tab" data-plan-tab="WEEKLY" role="tab" aria-selected="false" onclick="selectProjectPlanTab('WEEKLY')" hidden>주간 계획표</button>
            </div>
            <%@ include file="projectPeriodPlanPanel.jspf" %>
            <%@ include file="projectTimeSchedulePanel.jspf" %>
            <%@ include file="projectWeeklyPlanPanel.jspf" %>
        </div>
    </div>
</section>



<div id="projectPlanTypeChooser" class="project-plan-type-modal" hidden>
    <section class="project-plan-type-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="projectPlanTypeChooserTitle">
        <header class="project-plan-type-modal__header">
            <div>
                <h3 id="projectPlanTypeChooserTitle">어떤 계획을 만들까요?</h3>
                <p>프로젝트에 어울리는 방식을 선택하세요.</p>
            </div>
            <button type="button" class="project-plan-type-modal__close" onclick="closeProjectPlanTypeChooser()" aria-label="닫기">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </header>
        <div class="project-plan-type-modal__options">
            <article class="project-plan-type-option" data-plan-type-option="GANTT">
                <span class="project-plan-type-option__icon"><i class="fa-solid fa-chart-gantt" aria-hidden="true"></i></span>
                <span class="project-plan-type-option__copy">
                    <span class="project-plan-type-option__title-row"><strong>기간별 계획</strong><em data-plan-type-status>미생성</em></span>
                    <span>여러 날에 걸친 큰 흐름을 정리해요.</span>
                </span>
                <span class="project-plan-type-option__actions">
                    <button type="button" class="project-plan-type-option__primary" data-plan-create onclick="chooseProjectPlanType('GANTT')">생성하기</button>
                    <button type="button" class="project-plan-type-option__remove" data-plan-remove onclick="removeProjectPlanFeature('GANTT')" hidden>계획표 제거</button>
                </span>
            </article>
            <article class="project-plan-type-option" data-plan-type-option="TIME_SCHEDULE">
                <span class="project-plan-type-option__icon"><i class="fa-regular fa-clock" aria-hidden="true"></i></span>
                <span class="project-plan-type-option__copy">
                    <span class="project-plan-type-option__title-row"><strong>시간별 계획표</strong><em data-plan-type-status>미생성</em></span>
                    <span>여행이나 행사처럼 짧은 일정을 시간순으로 정리해요.</span>
                </span>
                <span class="project-plan-type-option__actions">
                    <button type="button" class="project-plan-type-option__primary" data-plan-create onclick="chooseProjectPlanType('TIME_SCHEDULE')">생성하기</button>
                    <button type="button" class="project-plan-type-option__remove" data-plan-remove onclick="removeProjectPlanFeature('TIME_SCHEDULE')" hidden>계획표 제거</button>
                </span>
            </article>
            <article class="project-plan-type-option" data-plan-type-option="WEEKLY">
                <span class="project-plan-type-option__icon"><i class="fa-regular fa-calendar-days" aria-hidden="true"></i></span>
                <span class="project-plan-type-option__copy">
                    <span class="project-plan-type-option__title-row"><strong>주간 계획표</strong><em data-plan-type-status>미생성</em></span>
                    <span>공부나 운동처럼 요일마다 반복할 계획을 정리해요.</span>
                </span>
                <span class="project-plan-type-option__actions">
                    <button type="button" class="project-plan-type-option__primary" data-plan-create onclick="chooseProjectPlanType('WEEKLY')">생성하기</button>
                    <button type="button" class="project-plan-type-option__remove" data-plan-remove onclick="removeProjectPlanFeature('WEEKLY')" hidden>계획표 제거</button>
                </span>
            </article>
        </div>
    </section>
</div>

<div id="timePlanRangeModal" class="project-plan-type-modal" hidden>
    <section class="project-plan-type-modal__dialog time-plan-range-dialog" role="dialog" aria-modal="true" aria-labelledby="timePlanRangeTitle">
        <header class="project-plan-type-modal__header">
            <div>
                <h3 id="timePlanRangeTitle">시간별 계획 기간</h3>
                <p>프로젝트 기간 안에서 최대 28일까지 선택할 수 있어요.</p>
            </div>
            <button type="button" class="project-plan-type-modal__close" onclick="closeTimePlanRangeModal()" aria-label="닫기">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </header>
        <div class="time-plan-range-body">
            <input type="hidden" id="timePlanRangeStart">
            <input type="hidden" id="timePlanRangeEnd">
            <div class="time-plan-range-calendars">
                <section class="time-plan-calendar" aria-labelledby="timePlanStartCalendarLabel">
                    <div class="time-plan-calendar__label">
                        <span id="timePlanStartCalendarLabel">시작일</span>
                        <strong id="timePlanStartSelected">-</strong>
                    </div>
                    <div id="timePlanStartCalendar" class="time-plan-calendar__panel"></div>
                </section>
                <section class="time-plan-calendar" aria-labelledby="timePlanEndCalendarLabel">
                    <div class="time-plan-calendar__label">
                        <span id="timePlanEndCalendarLabel">종료일</span>
                        <strong id="timePlanEndSelected">-</strong>
                    </div>
                    <div id="timePlanEndCalendar" class="time-plan-calendar__panel"></div>
                </section>
            </div>
            <p id="timePlanRangeError" class="time-plan-range-error" hidden></p>
        </div>
        <footer class="time-plan-range-actions">
            <button type="button" class="project-plan-settings-save" onclick="saveTimePlanRange()">적용</button>
        </footer>
    </section>
</div>

<%@ include file="projectPlanModal.jspf" %>
