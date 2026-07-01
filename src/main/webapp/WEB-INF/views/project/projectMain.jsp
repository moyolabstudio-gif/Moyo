<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<c:set var="effectiveProjectWsId" value="${wsId}" />
<c:if test="${empty effectiveProjectWsId and not empty param.wsId}"><c:set var="effectiveProjectWsId" value="${param.wsId}" /></c:if>
<c:if test="${empty effectiveProjectWsId and not empty projectDetail.wsId}"><c:set var="effectiveProjectWsId" value="${projectDetail.wsId}" /></c:if>
<c:set var="effectiveProjectId" value="${projId}" />
<c:if test="${empty effectiveProjectId and not empty param.projId}"><c:set var="effectiveProjectId" value="${param.projId}" /></c:if>
<c:if test="${empty effectiveProjectId and not empty projectDetail.projId}"><c:set var="effectiveProjectId" value="${projectDetail.projId}" /></c:if>
<c:set var="projectNoteQuery" value="scope=PROJ" />
<c:if test="${not empty effectiveProjectWsId}"><c:set var="projectNoteQuery" value="${projectNoteQuery}&amp;wsId=${effectiveProjectWsId}" /></c:if>
<c:if test="${not empty effectiveProjectId}"><c:set var="projectNoteQuery" value="${projectNoteQuery}&amp;projId=${effectiveProjectId}" /></c:if>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
	    <title>🎈 프로젝트 대시보드</title>
		<link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectMain.css?v=project-note-route-context-v2">
    <script>
        window.PROJECT_MAIN_CONFIG = {
            projectLeaderId: '<c:out value="${projectDetail.leaderId}"/>',
            loginUserId: '<c:out value="${sessionScope.user.userId}"/>',
            projectStartDate: '<c:out value="${projectDetail.startDate}"/>',
            projectEndDate: '<c:out value="${projectDetail.endDate}"/>',
            projectId: '<c:out value="${effectiveProjectId}"/>',
            paramProjId: '<c:out value="${param.projId}"/>',
            wsId: '<c:out value="${effectiveProjectWsId}"/>',
            paramWsId: '<c:out value="${param.wsId}"/>',
            canManageProject: <c:choose><c:when test="${canManageProject eq true}">true</c:when><c:otherwise>false</c:otherwise></c:choose>
        };
    </script>
    <script src="${pageContext.request.contextPath}/js/projectMain.js?v=project-note-route-context-v2"></script>

</head>
<body data-user-id="${sessionScope.user.userId}">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="container">

        <div class="project-hero">
			<div class="project-hero-info">
                <span class="project-type-label">프로젝트</span>
                <h1>${projectDetail.projName}</h1>
                <div class="project-hero-meta-line">
                    <p class="project-hero-description">${projectDetail.projDesc}</p>
                    <c:if test="${not empty projectLinks}">
                        <div class="project-external-links" aria-label="프로젝트 외부 링크">
                            <c:forEach var="link" items="${projectLinks}">
                                <a href="<c:out value='${link.LINK_URL}'/>"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   class="project-external-link"
                                   title="<c:out value='${link.LINK_NAME}'/>">
                                    <c:out value="${link.LINK_NAME}"/>
                                    <span aria-hidden="true">↗</span>
                                </a>
                            </c:forEach>
                        </div>
                    </c:if>
                </div>
            </div>

			<div class="hero-actions project-hero-right">
                <c:if test="${projectDetail.leaderId == sessionScope.user.userId}">
                    <button type="button" class="project-setting-btn project-setting-text-btn" onclick="goProjectSettings()" title="프로젝트 설정">⚙️ 프로젝트 설정</button>
                </c:if>
            </div>
        </div>

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

        <div class="dashboard-container">
            <div class="main-content">

                <div class="widget-grid project-widget-notice-poll">
                    <div class="widget-card notice-widget-card">
                        <div class="board-title">
                            <span>📢 공지사항</span>
                            <a href="/project/board/list?projId=${param.projId}&type=NOTICE&wsId=${param.wsId}">더보기</a>
                        </div>
                        <div id="noticeBoard" class="board-list"></div>
                    </div>

                    <div class="widget-card project-poll-widget-card">
                        <div class="board-title">
                            <span class="project-poll-title-wrap">
                                <span>📊 진행 중인 투표</span>
                                <span id="projectActivePollCount" class="project-poll-title-count">0</span>
                            </span>
                            <a href="/poll/list?scope=PROJECT&wsId=${param.wsId}&projId=${param.projId}">더보기</a>
                        </div>
                        <div id="projectActivePollArea" class="project-active-poll-area">
                            <div class="project-poll-empty">진행 중인 투표 목록을 불러오는 중입니다.</div>
                        </div>
                    </div>

                    <div class="widget-card resource-widget-card">
                        <div class="board-title">
                            <span>📁 자료실</span>
                            <a href="/project/board/list?projId=${param.projId}&type=FILE&wsId=${param.wsId}">더보기</a>
                        </div>
                        <div id="fileBoard" class="board-list"></div>
                    </div>
                </div>

                <div class="section-card schedule-section">
                    <div class="section-header">
                        <div>
                            <h3>🗓 프로젝트 일정</h3>
                            <p class="schedule-help">프로젝트 일정은 간트차트 기준으로 먼저 확인하고, 아래에서 상세 목록을 관리합니다.</p>
                        </div>
                        <button onclick="openAddScheduleModal()" class="btn btn-primary btn-sm">+ 일정 추가</button>
                    </div>

                    <div class="gantt-preview">
                        <div class="gantt-preview-header">
                            <div>
                                <h4 class="gantt-preview-title">간트 미리보기</h4>
                                <p class="gantt-preview-help">8일 이내는 시간별, 30일 이내는 일 단위, 90일 이내는 주 단위, 그 이상은 월 단위로 자동 표시됩니다.</p>
                            </div>
                            <span class="gantt-scale-badge">자동</span>
                        </div>
                        <div id="projectGanttPreview" class="gantt-box">
                            <div class="gantt-empty">프로젝트 일정을 불러오는 중...</div>
                        </div>
                    </div>

                    <div class="schedule-list-title">
                        <h4>상세 일정</h4>
                        <span>카드를 클릭하면 수정할 수 있습니다.</span>
                    </div>
                    <div id="projectScheduleList" class="schedule-list compact">
                        <div class="schedule-empty">프로젝트 일정을 불러오는 중...</div>
                    </div>
                </div>

                <!-- ===== 노트 섹션 ===== -->
                <div class="section-card work-note-section note-main-section">
                    <div class="section-header note-section-header">
                        <div>
                            <h3>📝 공유 노트</h3>
                            <p>회의 기록, 작업 메모, 첨부파일을 공유합니다.</p>
                        </div>
                        <div class="note-section-actions">
                            <a href="${pageContext.request.contextPath}/note/list?${projectNoteQuery}" class="section-more-link">더보기</a>
                        </div>
                    </div>

                    <div id="recentNoteList" class="work-note-list note-main-list">
                        <div class="work-note-empty">
                            <div class="work-note-empty-left">
                                <div class="work-note-empty-icon">📝</div>
                                <div>
                                    <strong>아직 작성된 노트가 없습니다.</strong>
                                    <span>회의 기록이나 작업 메모를 첫 노트로 남기고<br>프로젝트 메인에서 바로 확인해보세요.</span>
                                </div>
                            </div>
                            <a class="empty-note-write-link" href="${pageContext.request.contextPath}/note/write?${projectNoteQuery}">+ 첫 노트 작성</a>
                        </div>
                    </div>
                    <div class="note-write-bottom-actions">
                        <button type="button" id="noteWidgetToggle" class="note-widget-toggle" aria-expanded="false">내용 펼치기</button>
                        <a href="${pageContext.request.contextPath}/note/write?${projectNoteQuery}" class="note-write-link">+ 노트 작성</a>
                    </div>
                </div>
                <!-- ===== End 노트 섹션 ===== -->

                <div class="section-card work-board-section">
					<div class="section-header work-board-header">
                        <div>
					        <h3>📌 업무 현황</h3>
                            <p class="work-board-help">진행 상태를 확인하고 드래그해서 상태를 변경합니다.</p>
                        </div>
                        <div class="work-board-actions"><button type="button" class="section-more-link work-board-more-btn" onclick="goProjectWorkList()">더보기</button></div>
                    </div>

                    <div class="work-board-summary">
                        <div class="work-summary-card total">
                            <span>전체</span>
                            <strong id="task-total-count">${(taskSummary.TODO_CNT == null ? 0 : taskSummary.TODO_CNT) + (taskSummary.IN_PROGRESS_CNT == null ? 0 : taskSummary.IN_PROGRESS_CNT) + (taskSummary.DONE_CNT == null ? 0 : taskSummary.DONE_CNT)}</strong>
                        </div>
                        <div class="work-summary-card todo">
                            <span>할 일</span>
                            <strong id="task-todo-summary">${taskSummary.TODO_CNT == null ? 0 : taskSummary.TODO_CNT}</strong>
                        </div>
                        <div class="work-summary-card progress">
                            <span>진행 중</span>
                            <strong id="task-progress-summary">${taskSummary.IN_PROGRESS_CNT == null ? 0 : taskSummary.IN_PROGRESS_CNT}</strong>
                        </div>
                        <div class="work-summary-card done">
                            <span>완료</span>
                            <strong id="task-done-summary">${taskSummary.DONE_CNT == null ? 0 : taskSummary.DONE_CNT}</strong>
                        </div>
                        <div class="work-summary-card delay">
                            <span>지연</span>
                            <strong id="task-delay-count">0</strong>
                        </div>
                    </div>

                    <div class="kanban-wrapper">
                        <div class="kanban-column">
                            <div class="kanban-header todo-header">
                                할 일 (<span id="todo-count">${taskSummary.TODO_CNT == null ? 0 : taskSummary.TODO_CNT}</span>)
                            </div>
                            <div id="todo-list" class="task-list" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
                        </div>

                        <div class="kanban-column">
                            <div class="kanban-header progress-header">
                                진행 중 (<span id="progress-count">${taskSummary.IN_PROGRESS_CNT == null ? 0 : taskSummary.IN_PROGRESS_CNT}</span>)
                            </div>
                            <div id="inprogress-list" class="task-list" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
                        </div>

                        <div class="kanban-column">
                            <div class="kanban-header done-header">
                                완료 (<span id="done-count">${taskSummary.DONE_CNT == null ? 0 : taskSummary.DONE_CNT}</span>)
                            </div>
                            <div id="done-list" class="task-list" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
                        </div>
                    </div>
                    <div class="work-add-bottom-actions">
                        <button type="button" onclick="openAddTaskModal()" class="work-add-bottom-btn">+ 업무 추가</button>
                    </div>
                </div>
</div>

            <div class="side-content">
                <div class="mini-calendar project-calendar-panel moyo-calendar-widget">
                    <div class="calendar-header moyo-calendar-head">
                        <div class="calendar-month-control moyo-calendar-title-row">
                            <button type="button" class="calendar-arrow moyo-calendar-nav-btn" onclick="changeProjectMonth(-1)" aria-label="이전 달">‹</button>
                            <span id="projectCalendarTitle" class="moyo-calendar-month-title"></span>
                            <button type="button" class="calendar-arrow moyo-calendar-nav-btn" onclick="changeProjectMonth(1)" aria-label="다음 달">›</button>
                        </div>
                        <a class="moyo-calendar-more" href="${pageContext.request.contextPath}/calendar?projId=${param.projId}&wsId=${param.wsId}">전체보기</a>
                    </div>

                    <div class="calendar-grid moyo-calendar-grid" id="projectCalendarGrid">
                        <div class="day-name sun">일</div>
                        <div class="day-name">월</div>
                        <div class="day-name">화</div>
                        <div class="day-name">수</div>
                        <div class="day-name">목</div>
                        <div class="day-name">금</div>
                        <div class="day-name sat">토</div>
                    </div>
                    <div class="calendar-legend moyo-calendar-legend">
                        <span class="calendar-legend-item period-legend"><span class="legend-box"></span>기간</span>
                        <span class="calendar-legend-item schedule-legend"><span class="legend-box schedule"></span>일정</span>
                        <span class="calendar-legend-item task-legend"><span class="legend-dot task"></span>마감</span>
                    </div>

                    <div class="project-side-summary">
                        <div class="project-side-summary-item">
                            <span class="side-summary-label">프로젝트 기간</span>
                            <strong>${projectDetail.startDate} ~ ${projectDetail.endDate}</strong>
                        </div>
                        <div class="project-side-summary-item dday-summary">
                            <span class="side-summary-label">마감까지</span>
                            <strong id="projectDdayBadge" class="side-dday">D-Day 계산 중</strong>
                        </div>
                    </div>
</div>

                <div>

            <div class="project-member-panel">
                <div class="project-member-head">
                    <div class="project-member-title">
                        <span>👥</span>
                        <strong>프로젝트 멤버</strong>
                        <span id="projectMemberCount" class="project-member-count">0</span>
                    </div>
                    <button type="button" class="project-member-invite-btn" onclick="openAssignModal()">초대</button>
                </div>

                <div id="projectMemberList" class="project-member-list">
                    <div class="project-member-empty">멤버 정보를 불러오는 중입니다.</div>
                </div>
            </div>

            </div>
        </div>
    </div>
    <div id="assignMemberModal" class="project-member-add-overlay"
         onclick="if(event.target === this) closeModal('assignMemberModal')">
        <section class="project-member-add-modal"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="assignMemberModalTitle"
                 onclick="event.stopPropagation()">
            <div class="project-member-add-head">
                <div>
                    <span>프로젝트 멤버</span>
                    <h3 id="assignMemberModalTitle">멤버 추가</h3>
                </div>
                <button type="button"
                        onclick="closeModal('assignMemberModal')"
                        aria-label="닫기">×</button>
            </div>

            <div class="project-member-add-body">
                <div class="project-member-add-summary">
                    <span>워크스페이스 멤버 중 프로젝트에 추가할 멤버를 선택하세요.</span>
                    <strong id="assignSelectedCount">0명 선택</strong>
                </div>

                <div id="assignableList" class="project-member-candidate-list">
                    <div class="project-member-candidate-empty">멤버를 불러오는 중입니다.</div>
                </div>
            </div>

            <div class="project-member-add-actions">
                <button type="button"
                        class="project-member-add-btn ghost"
                        onclick="closeModal('assignMemberModal')">취소</button>
                <button type="button"
                        class="project-member-add-btn primary"
                        onclick="submitAssign()">선택 멤버 추가</button>
            </div>
        </section>
    </div>

<div id="addTaskModal" class="my-modal-overlay">
	        <div class="my-modal-content task-polish-modal">
                <div class="task-polish-head">
	                <h3 id="taskModalTitle">업무 추가</h3>
                    <p>업무명과 기간, 상태만 정하면 됩니다.</p>
                </div>

                <div class="task-polish-body">
                    <div class="task-polish-field">
                        <label for="taskTitle">업무명</label>
	                    <input type="text" id="taskTitle" class="modal-input" placeholder="예: 메인 화면 정리">
                    </div>

                    <div class="task-polish-field admin-only-task-field">
                        <label for="taskAssignedUserId">담당자</label>
                        <select id="taskAssignedUserId" class="modal-select">
                            <option value="">담당자 선택</option>
                        </select>
                    </div>

                    <div class="task-period-card">
                        <label class="task-time-toggle">
                            <input type="checkbox" id="taskUseTime" onchange="toggleTaskTimeFields(this.checked)">
                            <span>시간 선택</span>
                            <small>체크하면 시작/마감 시간을 직접 지정합니다.</small>
                        </label>

                        <div class="task-period-row">
                            <div class="task-polish-field">
                                <label for="taskStartDate">시작일</label>
                                <input type="date" id="taskStartDate" class="modal-input">
                            </div>

                            <div class="task-polish-field task-time-field">
                                <label for="taskStartTime">시작 시간</label>
                                <input type="time" id="taskStartTime" class="modal-input" value="09:00" disabled>
                            </div>
                        </div>

                        <div class="task-period-row">
                            <div class="task-polish-field">
                                <label for="taskEndDate">마감일</label>
                                <input type="date" id="taskEndDate" class="modal-input">
                            </div>

                            <div class="task-polish-field task-time-field">
                                <label for="taskEndTime">마감 시간</label>
                                <input type="time" id="taskEndTime" class="modal-input" value="18:00" disabled>
                            </div>
                        </div>
                    </div>

                    <div class="task-polish-field">
                        <label>상태</label>
                        <div class="task-status-pills">
                            <button type="button" class="task-status-pill active" data-status="TODO" onclick="setTaskStatusValue('TODO')">할 일</button>
                            <button type="button" class="task-status-pill" data-status="IN_PROGRESS" onclick="setTaskStatusValue('IN_PROGRESS')">진행 중</button>
                            <button type="button" class="task-status-pill" data-status="DONE" onclick="setTaskStatusValue('DONE')">완료</button>
                        </div>
                        <select id="taskStatus" class="modal-select task-status-hidden">
                            <option value="TODO">할 일</option>
                            <option value="IN_PROGRESS">진행 중</option>
                            <option value="DONE">완료</option>
                        </select>
                    </div>
                </div>

	            <div class="modal-footer task-polish-footer">
	                <button type="button" class="task-ui-btn ghost" onclick="closeModal('addTaskModal')">취소</button>
	                <button type="button" class="task-ui-btn primary" id="addBtn" onclick="addTask()">추가</button>
	                <button type="button" class="task-ui-btn secondary" id="editBtn" style="display:none;" onclick="enableEdit()">수정</button>
	                <button type="button" class="task-ui-btn primary" id="saveBtn" style="display:none;" onclick="updateTask(currentTaskId)">저장</button>
	                <button type="button" class="task-ui-btn danger" id="deleteBtn" style="display:none;" onclick="deleteTask()">삭제</button>
	            </div>
	        </div>
	    </div>

        <div id="addScheduleModal" class="my-modal-overlay">
            <div class="my-modal-content task-polish-modal schedule-polish-modal">
                <div class="task-polish-head">
                    <h3>프로젝트 일정 추가</h3>
                    <p>일정명과 기간을 정하고 색상을 선택합니다.</p>
                </div>

                <div class="task-polish-body">
                    <div class="task-polish-field">
                        <label for="scheduleTitle">일정명</label>
                        <input type="text" id="scheduleTitle" class="modal-input" placeholder="예: 기획 단계, 디자인 단계">
                    </div>

                    <div class="task-period-card schedule-period-card">
                        <label class="schedule-time-toggle">
                            <input type="checkbox" id="scheduleUseTime" onchange="toggleScheduleTimeFields(this.checked, false)">
                            <span>시간 계획</span>
                            <small>1주 이내 타임라인에서 시간 막대로 표시됩니다.</small>
                        </label>

                        <div class="schedule-datetime-grid schedule-polish-grid">
                            <div class="task-polish-field">
                                <label for="scheduleStartDate">시작일</label>
                                <input type="date" id="scheduleStartDate" class="modal-input">
                            </div>
                            <div class="task-polish-field schedule-time-field-wrap">
                                <label>시작 시간</label>
                                <div class="schedule-time-split-wrap" data-target-time="scheduleStartTime">
                                    <select id="scheduleStartTimeHour" class="modal-input schedule-time-hour" disabled></select>
                                    <span class="schedule-time-unit">시</span>
                                    <select id="scheduleStartTimeMinute" class="modal-input schedule-time-minute" disabled></select>
                                    <span class="schedule-time-unit">분</span>
                                    <input type="hidden" id="scheduleStartTime" value="09:00">
                                </div>
                            </div>
                            <div class="task-polish-field">
                                <label for="scheduleEndDate">종료일</label>
                                <input type="date" id="scheduleEndDate" class="modal-input">
                            </div>
                            <div class="task-polish-field schedule-time-field-wrap">
                                <label>종료 시간</label>
                                <div class="schedule-time-split-wrap" data-target-time="scheduleEndTime">
                                    <select id="scheduleEndTimeHour" class="modal-input schedule-time-hour" disabled></select>
                                    <span class="schedule-time-unit">시</span>
                                    <select id="scheduleEndTimeMinute" class="modal-input schedule-time-minute" disabled></select>
                                    <span class="schedule-time-unit">분</span>
                                    <input type="hidden" id="scheduleEndTime" value="18:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <input type="hidden" id="scheduleStatus" value="TODO">

                    <div class="task-polish-field schedule-color-field">
                        <input type="hidden" id="scheduleColor" value="#4A90E2">
                        <label>색상</label>
                        <div id="scheduleColorRow" class="schedule-modal-color-row"></div>
                    </div>
                </div>

                <div class="modal-footer task-polish-footer">
                    <button type="button" class="task-ui-btn ghost" onclick="closeModal('addScheduleModal')">취소</button>
                    <button type="button" class="task-ui-btn primary" onclick="addProjectSchedule()">추가</button>
                </div>
            </div>
        </div>

        <div id="editScheduleModal" class="my-modal-overlay">
            <div class="my-modal-content task-polish-modal schedule-polish-modal">
                <div class="task-polish-head">
                    <h3>프로젝트 일정 수정</h3>
                    <p>일정명과 기간, 색상을 변경할 수 있습니다.</p>
                </div>

                <div class="task-polish-body">
                    <div class="task-polish-field">
                        <label for="editScheduleTitle">일정명</label>
                        <input type="text" id="editScheduleTitle" class="modal-input" placeholder="예: 기획 단계, 디자인 단계">
                    </div>

                    <div class="task-period-card schedule-period-card">
                        <label class="schedule-time-toggle">
                            <input type="checkbox" id="editScheduleUseTime" onchange="toggleScheduleTimeFields(this.checked, true)">
                            <span>시간 계획</span>
                            <small>1주 이내 타임라인에서 시간 막대로 표시됩니다.</small>
                        </label>

                        <div class="schedule-datetime-grid schedule-polish-grid">
                            <div class="task-polish-field">
                                <label for="editScheduleStartDate">시작일</label>
                                <input type="date" id="editScheduleStartDate" class="modal-input">
                            </div>
                            <div class="task-polish-field schedule-time-field-wrap">
                                <label>시작 시간</label>
                                <div class="schedule-time-split-wrap" data-target-time="editScheduleStartTime">
                                    <select id="editScheduleStartTimeHour" class="modal-input schedule-time-hour" disabled></select>
                                    <span class="schedule-time-unit">시</span>
                                    <select id="editScheduleStartTimeMinute" class="modal-input schedule-time-minute" disabled></select>
                                    <span class="schedule-time-unit">분</span>
                                    <input type="hidden" id="editScheduleStartTime" value="09:00">
                                </div>
                            </div>
                            <div class="task-polish-field">
                                <label for="editScheduleEndDate">종료일</label>
                                <input type="date" id="editScheduleEndDate" class="modal-input">
                            </div>
                            <div class="task-polish-field schedule-time-field-wrap">
                                <label>종료 시간</label>
                                <div class="schedule-time-split-wrap" data-target-time="editScheduleEndTime">
                                    <select id="editScheduleEndTimeHour" class="modal-input schedule-time-hour" disabled></select>
                                    <span class="schedule-time-unit">시</span>
                                    <select id="editScheduleEndTimeMinute" class="modal-input schedule-time-minute" disabled></select>
                                    <span class="schedule-time-unit">분</span>
                                    <input type="hidden" id="editScheduleEndTime" value="18:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <input type="hidden" id="editScheduleStatus" value="TODO">

                    <div class="task-polish-field schedule-color-field">
                        <input type="hidden" id="editScheduleColor" value="#4A90E2">
                        <label>색상</label>
                        <div id="editScheduleColorRow" class="schedule-modal-color-row"></div>
                    </div>
                </div>

                <div class="modal-footer task-polish-footer schedule-edit-footer">
                    <button type="button" class="task-ui-btn danger schedule-delete-btn" onclick="deleteProjectSchedule()">삭제</button>
                    <div class="schedule-edit-actions">
                        <button type="button" class="task-ui-btn ghost" onclick="closeModal('editScheduleModal')">취소</button>
                        <button type="button" class="task-ui-btn primary" onclick="updateProjectSchedule()">저장</button>
                    </div>
                </div>
            </div>
        </div>

		<div id="editProjectModal" class="my-modal-overlay">
		    <div class="my-modal-content project-edit-modal moyo-project-modal">
		        <div class="modal-title-row moyo-project-modal-head">
		            <div><h3>프로젝트 수정</h3><p>프로젝트 기본 정보와 기간을 수정합니다.</p></div>
		            <button type="button" class="modal-close-btn" onclick="closeModal('editProjectModal')">&times;</button>
		        </div>

		        <div class="moyo-project-modal-body">
                <div class="form-field">
		            <label>프로젝트명</label>
		            <input type="text" id="editProjName" class="modal-input" value="${projectDetail.projName}">
		        </div>

		        <div class="form-field">
		            <label>프로젝트 유형</label>
		            <select id="editProjType" class="modal-select">
		                <option value="EVENT" ${projectDetail.projType == 'EVENT' ? 'selected' : ''}>행사/이벤트</option>
		                <option value="TASK" ${projectDetail.projType == 'TASK' ? 'selected' : ''}>업무 프로젝트</option>
		                <option value="RESEARCH" ${projectDetail.projType == 'RESEARCH' ? 'selected' : ''}>연구/조사</option>
		            </select>
		        </div>

		        <div class="form-field">
		            <label>프로젝트 기간</label>
		            <div class="date-row">
		                <div class="date-col">
		                    <div class="field-sub-label">시작일</div>
		                    <input type="date" id="editStartDate" class="modal-input" value="${projectDetail.startDate}">
		                </div>
		                <div class="date-col">
		                    <div class="field-sub-label">종료일</div>
		                    <input type="date" id="editEndDate" class="modal-input" value="${projectDetail.endDate}">
		                </div>
		            </div>
		        </div>

		        <div class="form-field">
		            <label>상세 설명</label>
		            <textarea id="editProjDesc" class="modal-input" rows="4">${projectDetail.projDesc}</textarea>
		        </div>

		        </div>

		        <div class="modal-footer modal-footer-between moyo-project-modal-footer">
		            <button type="button" class="btn-delete-text" onclick="deleteProject()">프로젝트 삭제</button>

		            <div class="modal-footer-actions">
		                <button type="button" class="moyo-modal-btn ghost" onclick="closeModal('editProjectModal')">취소</button>
		                <button type="button" class="moyo-modal-btn primary" onclick="updateProject()">저장</button>
		            </div>
		        </div>
		    </div>
		</div>

    <div id="projectMemberProfileOverlay"
         class="project-member-profile-overlay"
         onclick="closeProjectMemberProfile()"></div>

    <section id="projectMemberProfileModal"
             class="project-member-profile-modal"
             role="dialog"
             aria-modal="true"
             aria-labelledby="projectMemberProfileTitle">
        <div class="project-member-profile-head">
            <div>
                <span>프로젝트 멤버 프로필</span>
                <h3 id="projectMemberProfileTitle">멤버 프로필</h3>
            </div>
            <button type="button"
                    onclick="closeProjectMemberProfile()"
                    aria-label="닫기">×</button>
        </div>

        <div id="projectMemberProfileBody" class="project-member-profile-body">
            <div class="project-member-profile-loading">프로필을 불러오는 중입니다.</div>
        </div>
    </section>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
