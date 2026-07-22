<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<!--
    프로젝트 간트차트 · 주간계획표 공통 영역
    projectMain.js가 프로젝트 기간/선택 단위에 따라
    #projectGanttPreview 내부를 간트차트 또는 주간계획표로 렌더링합니다.
-->
<div id="projectTimelineCard" class="project-timeline-card">
            <div class="project-timeline-header">
                <div class="project-timeline-title-wrap">
                    <div class="timeline-title-line">
                        <h3>🗓 프로젝트 타임라인</h3>
                    </div>
                    <p>8일 이내는 시간별, 30일 이내는 일 단위, 90일 이내는 주 단위, 그 이상은 월 단위로 자동 표시됩니다.</p>
                </div>
                <div class="project-timeline-actions">
                    <div class="timeline-scale-group" role="group" aria-label="타임라인 단위 선택">
                        <button type="button" class="timeline-scale-btn" data-scale="HOUR" onclick="setProjectTimelineScale('HOUR')">시간</button>
                        <button type="button" class="timeline-scale-btn" data-scale="DAY" onclick="setProjectTimelineScale('DAY')">일</button>
                        <button type="button" class="timeline-scale-btn" data-scale="WEEK" onclick="setProjectTimelineScale('WEEK')">주</button>
                        <button type="button" class="timeline-scale-btn" data-scale="MONTH" onclick="setProjectTimelineScale('MONTH')">월</button>
                    </div>
                    <button onclick="openAddScheduleModal()" class="btn btn-primary btn-sm">+ 일정 추가</button>
                </div>
            </div>

            <div id="projectTimelineBody" class="project-timeline-body">
                <div class="gantt-preview">
                    <div class="gantt-preview-header">
                        <div>
                            <h4 class="gantt-preview-title">간트 미리보기</h4>
                            <p class="gantt-preview-help">8일 이내는 시간별, 30일 이내는 일 단위, 90일 이내는 주 단위, 그 이상은 월 단위로 자동 표시됩니다.</p>
                        </div>
                    </div>
                    <div id="projectGanttPreview" class="gantt-box">
                        <div class="gantt-empty">프로젝트 일정을 불러오는 중...</div>
                    </div>

                </div>
            </div>
            <div class="gantt-drag-tip timeline-bottom-actions">
                <span>빈 날짜 칸은 <strong>드래그</strong>로 새 일정을 만들고, 일정 막대는 이동하거나 양끝을 <strong class="resize-word">드래그</strong>해서 기간을 수정할 수 있습니다.</span>
            </div>
        </div>
