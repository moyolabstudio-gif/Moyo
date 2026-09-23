<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><c:choose><c:when test="${personalMode}">개인 프로젝트</c:when><c:otherwise><c:out value="${workspace.wsName}"/> 프로젝트</c:otherwise></c:choose> - MOYO</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=css-structure-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonScopeList.css?v=css-structure-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectList.css?v=friend-concept-v5-20260922">
    <script defer src="${pageContext.request.contextPath}/js/projectList.js?v=project-list-friend-concept-v3"></script>
</head>
<body class="moyo-app-sidebar-enabled project-list-body"
      data-initial-status="${empty param.status ? 'ALL' : param.status}" data-list-mode="${listMode}">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <c:set var="scheduledCount" value="0" />
    <c:set var="progressCount" value="0" />
    <c:set var="completedCount" value="0" />
    <c:forEach var="project" items="${projects}">
        <c:choose>
            <c:when test="${project.PROJECT_STATUS eq 'SCHEDULED'}"><c:set var="scheduledCount" value="${scheduledCount + 1}" /></c:when>
            <c:when test="${project.PROJECT_STATUS eq 'COMPLETED'}"><c:set var="completedCount" value="${completedCount + 1}" /></c:when>
            <c:otherwise><c:set var="progressCount" value="${progressCount + 1}" /></c:otherwise>
        </c:choose>
    </c:forEach>

    <main class="project-list-container moyo-scope-list moyo-scope-list--project">
        <section class="project-list-hero">
            <div class="project-list-hero-copy">
                <span class="project-list-type">MOYO PROJECT</span>
                <div class="project-list-title-row">
                    <div>
                        <h1>프로젝트</h1>
                        <p><c:choose><c:when test="${personalMode}">혼자 진행하는 프로젝트의 일정과 업무를 관리합니다.</c:when><c:otherwise>진행 중인 프로젝트부터 예정·완료 기록까지 한곳에서 관리합니다.</c:otherwise></c:choose></p>
                    </div>
                    <div class="project-list-hero-actions">
                        <c:if test="${personalMode or canCreateGroupProject}">
                            <a class="project-list-create" href="${pageContext.request.contextPath}/project/create${personalMode ? '' : '?wsId='}${personalMode ? '' : wsId}"><span aria-hidden="true">＋</span> 프로젝트 생성</a>
                        </c:if>
                    </div>
                </div>
            </div>
        </section>

        <section class="project-list-card">
            <div class="project-list-card-head">
                <div>
                    <span class="project-list-card-label">내 프로젝트</span>
                    <div class="project-list-section-title-row">
                        <h2>프로젝트 목록</h2>
                        <span class="project-list-section-count" aria-label="프로젝트 수"><strong>${projects.size()}</strong></span>
                    </div>
                    <p>프로젝트를 상태별로 찾고 바로 관리합니다.</p>
                </div>
                <c:if test="${not personalMode}"><a class="project-list-back" href="${pageContext.request.contextPath}/workspace/main?wsId=${wsId}">그룹 홈</a></c:if>
            </div>

            <div class="project-list-toolbar-card">
                <div class="project-list-filter-group">
                    <div class="project-list-tabs" role="tablist" aria-label="프로젝트 상태 필터">
                        <button type="button" class="project-list-tab is-active" data-status="ALL">전체 <span>${projects.size()}</span></button>
                        <button type="button" class="project-list-tab" data-status="IN_PROGRESS">진행 중 <span>${progressCount}</span></button>
                        <button type="button" class="project-list-tab" data-status="SCHEDULED">예정 <span>${scheduledCount}</span></button>
                        <button type="button" class="project-list-tab" data-status="COMPLETED">완료 <span>${completedCount}</span></button>
                    </div>
                </div>
                <div class="project-list-tools">
                    <label class="project-list-search">
                        <span class="project-list-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="M16 16L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
                        <input id="projectListSearch" type="search" placeholder="${personalMode ? '프로젝트명 또는 설명 검색' : '프로젝트명 또는 멤버 검색'}" autocomplete="off">
                    </label>
                    <select id="projectListSort" aria-label="프로젝트 정렬"><option value="DEFAULT">기본 정렬</option><option value="NEWEST">최근 생성순</option><option value="START_ASC">시작일 빠른순</option><option value="END_DESC">종료일 최근순</option><option value="NAME_ASC">이름순</option></select>
                </div>
            </div>

            <div id="projectListGroups" class="project-list-groups">
                <section class="project-status-section is-progress" data-section-status="IN_PROGRESS">
                    <div class="project-status-section-head moyo-scope-list__section-head">
                        <h3>진행 중 <span>${progressCount}</span></h3>
                        <p>현재 진행 중인 프로젝트입니다.</p>
                    </div>
                    <div class="project-list-grid moyo-scope-list__grid" data-project-grid="IN_PROGRESS">
                        <c:forEach var="project" items="${projects}">
                            <c:if test="${project.PROJECT_STATUS ne 'SCHEDULED' and project.PROJECT_STATUS ne 'COMPLETED'}">
                                <article class="project-list-item is-progress"
                                         data-status="IN_PROGRESS"
                                         data-name="${project.PROJ_NAME}"
                                         data-desc="${project.PROJ_DESC}"
                                         data-type="${empty project.PROJ_TYPE ? 'ETC' : project.PROJ_TYPE}"
                                         data-members="${project.MEMBER_NAMES}"
                                         data-id="${project.PROJ_ID}"
                                         data-start="${project.START_DATE}"
                                         data-end="${project.END_DATE}"
                                         data-icon="${empty project.PROJ_ICON ? 'shapes' : project.PROJ_ICON}"
                                         data-period-enabled="${empty project.PERIOD_ENABLED_YN ? 'N' : project.PERIOD_ENABLED_YN}"
                                         data-task-total="${empty project.TASK_TOTAL ? 0 : project.TASK_TOTAL}"
                                         data-task-done="${empty project.TASK_DONE ? 0 : project.TASK_DONE}"
                                         data-progress="${project.PROGRESS_PERCENT}"
                                         data-member-count="${empty project.MEMBER_COUNT ? 0 : project.MEMBER_COUNT}"
                                         data-access-state="${personalMode ? 'MANAGE' : (empty project.ACCESS_STATE ? 'LOCKED' : project.ACCESS_STATE)}"
                                         data-can-enter="${personalMode ? 'Y' : (empty project.CAN_ENTER_YN ? 'N' : project.CAN_ENTER_YN)}">
                                    <a class="project-list-link moyo-scope-list-card" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}${personalMode ? '' : '&wsId='}${personalMode ? '' : wsId}">
                                        <div class="project-card-top">
                                            <span class="project-status-text is-progress moyo-scope-list-card__badge">진행 중</span>
                                            <span class="project-card-type moyo-scope-list-card__badge moyo-scope-list-card__badge--quiet">
                                                <c:choose>
                                                    <c:when test="${project.PROJ_TYPE eq 'WORK' or project.PROJ_TYPE eq '업무'}">업무</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'TRAVEL' or project.PROJ_TYPE eq '여행'}">여행</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'MEETING' or project.PROJ_TYPE eq '모임·행사' or project.PROJ_TYPE eq '모임 · 행사'}">모임 · 행사</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'STUDY' or project.PROJ_TYPE eq '학습·연구' or project.PROJ_TYPE eq '학습 · 연구'}">학습 · 연구</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'LIFE' or project.PROJ_TYPE eq '생활·가정' or project.PROJ_TYPE eq '생활 · 가정'}">생활 · 가정</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'HOBBY' or project.PROJ_TYPE eq '취미·창작' or project.PROJ_TYPE eq '취미 · 창작'}">취미 · 창작</c:when>
                                                    <c:otherwise>${empty project.PROJ_TYPE ? '기타' : project.PROJ_TYPE}</c:otherwise>
                                                </c:choose>
                                            </span>
                                            <span class="project-access-badge" hidden></span>
                                            <span class="project-card-enter-icon" aria-hidden="true">→</span>
                                        </div>
                                        <h3 class="moyo-scope-list-card__title">${project.PROJ_NAME}</h3>
                                        <p class="project-description moyo-scope-list-card__description">${empty project.PROJ_DESC ? '등록된 프로젝트 설명이 없습니다.' : project.PROJ_DESC}</p>
                                        <dl class="project-meta moyo-scope-list-card__meta">
                                            <div class="project-period-row"><dt>기간</dt><dd class="project-period-value"><c:choose><c:when test="${project.PERIOD_ENABLED_YN eq 'Y'}">${project.START_DATE} ~ ${project.END_DATE}</c:when><c:otherwise>기간 없음</c:otherwise></c:choose></dd><c:if test="${project.PERIOD_ENABLED_YN eq 'Y' and not empty project.DDAY and project.DDAY ge 0}"><span class="project-dday"><c:choose><c:when test="${project.DDAY eq 0}">D-Day</c:when><c:otherwise>D-${project.DDAY}</c:otherwise></c:choose></span></c:if></div>
                                            <c:choose>
                                                <c:when test="${personalMode}">
                                                    <div><dt>업무</dt><dd><c:choose><c:when test="${project.TASK_TOTAL gt 0}">${project.TASK_DONE} / ${project.TASK_TOTAL} 완료</c:when><c:otherwise>등록된 업무 없음</c:otherwise></c:choose></dd></div>
                                                </c:when>
                                                <c:otherwise>
                                                    <div class="project-leader-row"><dt>팀장</dt><dd><span class="project-leader-avatar"><c:choose><c:when test="${not empty project.LEADER_PROFILE_IMAGE_PATH}"><img src="<c:out value='${project.LEADER_PROFILE_IMAGE_PATH}'/>" alt="" onerror="this.remove();"></c:when><c:otherwise><span>${empty project.LEADER_NAME ? '?' : fn:substring(project.LEADER_NAME, 0, 1)}</span></c:otherwise></c:choose></span><span class="project-leader-name">${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</span></dd></div>
                                                    <div><dt>인원</dt><dd>${project.MEMBER_COUNT}명</dd></div>
                                                    <div class="project-member-row"><dt>멤버</dt><dd class="project-member-names">${empty project.MEMBER_NAMES ? '-' : project.MEMBER_NAMES}</dd></div>
                                                </c:otherwise>
                                            </c:choose>
                                        </dl>
                                        <div class="project-progress" hidden>
                                            <div class="project-progress-head">
                                                <span>진행률</span>
                                                <strong class="project-progress-value"></strong>
                                            </div>
                                            <div class="project-progress-track" aria-hidden="true">
                                                <span class="project-progress-fill"></span>
                                            </div>
                                            <span class="project-progress-empty" hidden>아직 등록된 업무가 없습니다.</span>
                                        </div>
                                        <span class="project-enter moyo-scope-list-card__action">프로젝트 열기 →</span>
                                    </a>
                                </article>
                            </c:if>
                        </c:forEach>
                    </div>
                    <div class="project-section-empty moyo-scope-list__empty-inline" data-empty-for="IN_PROGRESS" hidden>진행 중인 프로젝트가 없습니다.</div>
                </section>

                <section class="project-status-section is-scheduled" data-section-status="SCHEDULED">
                    <div class="project-status-section-head moyo-scope-list__section-head">
                        <h3>예정 <span>${scheduledCount}</span></h3>
                        <p>시작 전인 프로젝트입니다.</p>
                    </div>
                    <div class="project-list-grid moyo-scope-list__grid" data-project-grid="SCHEDULED">
                        <c:forEach var="project" items="${projects}">
                            <c:if test="${project.PROJECT_STATUS eq 'SCHEDULED'}">
                                <article class="project-list-item is-scheduled"
                                         data-status="SCHEDULED"
                                         data-name="${project.PROJ_NAME}"
                                         data-desc="${project.PROJ_DESC}"
                                         data-type="${empty project.PROJ_TYPE ? 'ETC' : project.PROJ_TYPE}"
                                         data-members="${project.MEMBER_NAMES}"
                                         data-id="${project.PROJ_ID}"
                                         data-start="${project.START_DATE}"
                                         data-end="${project.END_DATE}"
                                         data-icon="${empty project.PROJ_ICON ? 'shapes' : project.PROJ_ICON}"
                                         data-period-enabled="${empty project.PERIOD_ENABLED_YN ? 'N' : project.PERIOD_ENABLED_YN}"
                                         data-task-total="${empty project.TASK_TOTAL ? 0 : project.TASK_TOTAL}"
                                         data-task-done="${empty project.TASK_DONE ? 0 : project.TASK_DONE}"
                                         data-progress="${project.PROGRESS_PERCENT}"
                                         data-member-count="${empty project.MEMBER_COUNT ? 0 : project.MEMBER_COUNT}"
                                         data-access-state="${personalMode ? 'MANAGE' : (empty project.ACCESS_STATE ? 'LOCKED' : project.ACCESS_STATE)}"
                                         data-can-enter="${personalMode ? 'Y' : (empty project.CAN_ENTER_YN ? 'N' : project.CAN_ENTER_YN)}">
                                    <a class="project-list-link moyo-scope-list-card" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}${personalMode ? '' : '&wsId='}${personalMode ? '' : wsId}">
                                        <div class="project-card-top">
                                            <span class="project-status-text is-scheduled moyo-scope-list-card__badge">예정</span>
                                            <span class="project-card-type moyo-scope-list-card__badge moyo-scope-list-card__badge--quiet">
                                                <c:choose>
                                                    <c:when test="${project.PROJ_TYPE eq 'WORK' or project.PROJ_TYPE eq '업무'}">업무</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'TRAVEL' or project.PROJ_TYPE eq '여행'}">여행</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'MEETING' or project.PROJ_TYPE eq '모임·행사' or project.PROJ_TYPE eq '모임 · 행사'}">모임 · 행사</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'STUDY' or project.PROJ_TYPE eq '학습·연구' or project.PROJ_TYPE eq '학습 · 연구'}">학습 · 연구</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'LIFE' or project.PROJ_TYPE eq '생활·가정' or project.PROJ_TYPE eq '생활 · 가정'}">생활 · 가정</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'HOBBY' or project.PROJ_TYPE eq '취미·창작' or project.PROJ_TYPE eq '취미 · 창작'}">취미 · 창작</c:when>
                                                    <c:otherwise>${empty project.PROJ_TYPE ? '기타' : project.PROJ_TYPE}</c:otherwise>
                                                </c:choose>
                                            </span>
                                            <span class="project-access-badge" hidden></span>
                                            <span class="project-card-enter-icon" aria-hidden="true">→</span>
                                        </div>
                                        <h3 class="moyo-scope-list-card__title">${project.PROJ_NAME}</h3>
                                        <p class="project-description moyo-scope-list-card__description">${empty project.PROJ_DESC ? '등록된 프로젝트 설명이 없습니다.' : project.PROJ_DESC}</p>
                                        <dl class="project-meta moyo-scope-list-card__meta">
                                            <div class="project-period-row"><dt>기간</dt><dd class="project-period-value"><c:choose><c:when test="${project.PERIOD_ENABLED_YN eq 'Y'}">${project.START_DATE} ~ ${project.END_DATE}</c:when><c:otherwise>기간 없음</c:otherwise></c:choose></dd><c:if test="${project.PERIOD_ENABLED_YN eq 'Y' and not empty project.DDAY and project.DDAY ge 0}"><span class="project-dday"><c:choose><c:when test="${project.DDAY eq 0}">D-Day</c:when><c:otherwise>D-${project.DDAY}</c:otherwise></c:choose></span></c:if></div>
                                            <c:choose>
                                                <c:when test="${personalMode}">
                                                    <div><dt>업무</dt><dd><c:choose><c:when test="${project.TASK_TOTAL gt 0}">${project.TASK_DONE} / ${project.TASK_TOTAL} 완료</c:when><c:otherwise>등록된 업무 없음</c:otherwise></c:choose></dd></div>
                                                </c:when>
                                                <c:otherwise>
                                                    <div class="project-leader-row"><dt>팀장</dt><dd><span class="project-leader-avatar"><c:choose><c:when test="${not empty project.LEADER_PROFILE_IMAGE_PATH}"><img src="<c:out value='${project.LEADER_PROFILE_IMAGE_PATH}'/>" alt="" onerror="this.remove();"></c:when><c:otherwise><span>${empty project.LEADER_NAME ? '?' : fn:substring(project.LEADER_NAME, 0, 1)}</span></c:otherwise></c:choose></span><span class="project-leader-name">${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</span></dd></div>
                                                    <div><dt>인원</dt><dd>${project.MEMBER_COUNT}명</dd></div>
                                                    <div class="project-member-row"><dt>멤버</dt><dd class="project-member-names">${empty project.MEMBER_NAMES ? '-' : project.MEMBER_NAMES}</dd></div>
                                                </c:otherwise>
                                            </c:choose>
                                        </dl>
                                        <div class="project-progress" hidden>
                                            <div class="project-progress-head">
                                                <span>진행률</span>
                                                <strong class="project-progress-value"></strong>
                                            </div>
                                            <div class="project-progress-track" aria-hidden="true">
                                                <span class="project-progress-fill"></span>
                                            </div>
                                            <span class="project-progress-empty" hidden>아직 등록된 업무가 없습니다.</span>
                                        </div>
                                        <span class="project-enter moyo-scope-list-card__action">프로젝트 열기 →</span>
                                    </a>
                                </article>
                            </c:if>
                        </c:forEach>
                    </div>
                    <div class="project-section-empty moyo-scope-list__empty-inline" data-empty-for="SCHEDULED" hidden>예정된 프로젝트가 없습니다.</div>
                </section>

                <section class="project-status-section is-completed" data-section-status="COMPLETED">
                    <div class="project-status-section-head moyo-scope-list__section-head">
                        <h3>완료 <span>${completedCount}</span></h3>
                        <p>종료된 프로젝트 기록입니다.</p>
                    </div>
                    <div class="project-list-grid moyo-scope-list__grid" data-project-grid="COMPLETED">
                        <c:forEach var="project" items="${projects}">
                            <c:if test="${project.PROJECT_STATUS eq 'COMPLETED'}">
                                <article class="project-list-item is-completed"
                                         data-status="COMPLETED"
                                         data-name="${project.PROJ_NAME}"
                                         data-desc="${project.PROJ_DESC}"
                                         data-type="${empty project.PROJ_TYPE ? 'ETC' : project.PROJ_TYPE}"
                                         data-members="${project.MEMBER_NAMES}"
                                         data-id="${project.PROJ_ID}"
                                         data-start="${project.START_DATE}"
                                         data-end="${project.END_DATE}"
                                         data-icon="${empty project.PROJ_ICON ? 'shapes' : project.PROJ_ICON}"
                                         data-period-enabled="${empty project.PERIOD_ENABLED_YN ? 'N' : project.PERIOD_ENABLED_YN}"
                                         data-task-total="${empty project.TASK_TOTAL ? 0 : project.TASK_TOTAL}"
                                         data-task-done="${empty project.TASK_DONE ? 0 : project.TASK_DONE}"
                                         data-progress="${project.PROGRESS_PERCENT}"
                                         data-member-count="${empty project.MEMBER_COUNT ? 0 : project.MEMBER_COUNT}"
                                         data-access-state="${personalMode ? 'MANAGE' : (empty project.ACCESS_STATE ? 'LOCKED' : project.ACCESS_STATE)}"
                                         data-can-enter="${personalMode ? 'Y' : (empty project.CAN_ENTER_YN ? 'N' : project.CAN_ENTER_YN)}">
                                    <a class="project-list-link moyo-scope-list-card" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}${personalMode ? '' : '&wsId='}${personalMode ? '' : wsId}">
                                        <div class="project-card-top">
                                            <span class="project-status-text is-completed moyo-scope-list-card__badge">완료</span>
                                            <span class="project-card-type moyo-scope-list-card__badge moyo-scope-list-card__badge--quiet">
                                                <c:choose>
                                                    <c:when test="${project.PROJ_TYPE eq 'WORK' or project.PROJ_TYPE eq '업무'}">업무</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'TRAVEL' or project.PROJ_TYPE eq '여행'}">여행</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'MEETING' or project.PROJ_TYPE eq '모임·행사' or project.PROJ_TYPE eq '모임 · 행사'}">모임 · 행사</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'STUDY' or project.PROJ_TYPE eq '학습·연구' or project.PROJ_TYPE eq '학습 · 연구'}">학습 · 연구</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'LIFE' or project.PROJ_TYPE eq '생활·가정' or project.PROJ_TYPE eq '생활 · 가정'}">생활 · 가정</c:when>
                                                    <c:when test="${project.PROJ_TYPE eq 'HOBBY' or project.PROJ_TYPE eq '취미·창작' or project.PROJ_TYPE eq '취미 · 창작'}">취미 · 창작</c:when>
                                                    <c:otherwise>${empty project.PROJ_TYPE ? '기타' : project.PROJ_TYPE}</c:otherwise>
                                                </c:choose>
                                            </span>
                                            <span class="project-access-badge" hidden></span>
                                            <span class="project-card-enter-icon" aria-hidden="true">→</span>
                                        </div>
                                        <h3 class="moyo-scope-list-card__title">${project.PROJ_NAME}</h3>
                                        <p class="project-description moyo-scope-list-card__description">${empty project.PROJ_DESC ? '등록된 프로젝트 설명이 없습니다.' : project.PROJ_DESC}</p>
                                        <dl class="project-meta moyo-scope-list-card__meta">
                                            <div class="project-period-row"><dt>기간</dt><dd class="project-period-value"><c:choose><c:when test="${project.PERIOD_ENABLED_YN eq 'Y'}">${project.START_DATE} ~ ${project.END_DATE}</c:when><c:otherwise>기간 없음</c:otherwise></c:choose></dd><c:if test="${project.PERIOD_ENABLED_YN eq 'Y' and not empty project.DDAY and project.DDAY ge 0}"><span class="project-dday"><c:choose><c:when test="${project.DDAY eq 0}">D-Day</c:when><c:otherwise>D-${project.DDAY}</c:otherwise></c:choose></span></c:if></div>
                                            <c:choose>
                                                <c:when test="${personalMode}">
                                                    <div><dt>업무</dt><dd><c:choose><c:when test="${project.TASK_TOTAL gt 0}">${project.TASK_DONE} / ${project.TASK_TOTAL} 완료</c:when><c:otherwise>등록된 업무 없음</c:otherwise></c:choose></dd></div>
                                                </c:when>
                                                <c:otherwise>
                                                    <div class="project-leader-row"><dt>팀장</dt><dd><span class="project-leader-avatar"><c:choose><c:when test="${not empty project.LEADER_PROFILE_IMAGE_PATH}"><img src="<c:out value='${project.LEADER_PROFILE_IMAGE_PATH}'/>" alt="" onerror="this.remove();"></c:when><c:otherwise><span>${empty project.LEADER_NAME ? '?' : fn:substring(project.LEADER_NAME, 0, 1)}</span></c:otherwise></c:choose></span><span class="project-leader-name">${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</span></dd></div>
                                                    <div><dt>인원</dt><dd>${project.MEMBER_COUNT}명</dd></div>
                                                    <div class="project-member-row"><dt>멤버</dt><dd class="project-member-names">${empty project.MEMBER_NAMES ? '-' : project.MEMBER_NAMES}</dd></div>
                                                </c:otherwise>
                                            </c:choose>
                                        </dl>
                                        <div class="project-progress" hidden>
                                            <div class="project-progress-head">
                                                <span>진행률</span>
                                                <strong class="project-progress-value"></strong>
                                            </div>
                                            <div class="project-progress-track" aria-hidden="true">
                                                <span class="project-progress-fill"></span>
                                            </div>
                                            <span class="project-progress-empty" hidden>아직 등록된 업무가 없습니다.</span>
                                        </div>
                                        <span class="project-enter moyo-scope-list-card__action">프로젝트 열기 →</span>
                                    </a>
                                </article>
                            </c:if>
                        </c:forEach>
                    </div>
                    <div class="project-section-empty moyo-scope-list__empty-inline" data-empty-for="COMPLETED" hidden>완료된 프로젝트가 없습니다.</div>
                </section>
            </div>

            <div id="projectListEmpty" class="project-empty-state moyo-scope-list__empty" hidden>
                <span>🧭</span>
                <strong>조건에 맞는 프로젝트가 없습니다.</strong>
                <p>다른 상태를 선택하거나 검색어를 변경해보세요.</p>
            </div>
        </section>
    </main>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
