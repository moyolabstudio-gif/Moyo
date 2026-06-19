<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${workspace.wsName} 커뮤니티 홈</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceMain.css?v=workspace-note-widget-v5">
    <script defer src="${pageContext.request.contextPath}/js/workspaceMain.js?v=workspace-note-widget-v5"></script>
</head>
<body class="moyo-app-sidebar-enabled workspace-community-body"
      data-ws-id="${workspace.wsId}"
      data-context-path="${pageContext.request.contextPath}"
      data-current-user-id="${user.userId}"
      data-workspace-admin="${isWorkspaceAdmin}"
      data-workspace-owner="${currentUserIsOwner}">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="container workspace-community-container">
<div class="workspace-hero">
            <div class="workspace-avatar">
                <img src="${workspace.wsImagePath}" alt="그룹 이미지" onerror="this.onerror=null; this.src='${pageContext.request.contextPath}/images/default-ws.png';">
            </div>
            <div class="workspace-hero-info">
                <span class="workspace-type-label">
                    <c:choose>
                        <c:when test="${workspace.wsType eq 'ORGANIZATION'}">회사 · 조직</c:when>
                        <c:when test="${workspace.wsType eq 'TEAM'}">팀 · 프로젝트</c:when>
                        <c:when test="${workspace.wsType eq 'STUDY'}">스터디 · 연구</c:when>
                        <c:when test="${workspace.wsType eq 'CLUB'}">동아리 · 취미</c:when>
                        <c:when test="${workspace.wsType eq 'LIFE'}">가족 · 생활</c:when>
                        <c:when test="${workspace.wsType eq 'ETC'}">기타</c:when>
                        <c:otherwise>모임 · 커뮤니티</c:otherwise>
                    </c:choose>
                </span>
                <h1>${workspace.wsName}</h1>
                <div class="workspace-hero-meta-line">
                    <p class="workspace-hero-description">${workspace.wsDescription}</p>
                    <c:if test="${not empty workspaceLinks}">
                        <div class="workspace-external-links" aria-label="워크스페이스 외부 링크">
                            <c:forEach var="link" items="${workspaceLinks}">
                                <a href="<c:out value='${link.LINK_URL}'/>"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   class="workspace-external-link"
                                   title="<c:out value='${link.LINK_NAME}'/>">
                                    <c:out value="${link.LINK_NAME}"/>
                                    <span aria-hidden="true">↗</span>
                                </a>
                            </c:forEach>
                        </div>
                    </c:if>
                </div>
            </div>
            <div class="workspace-hero-actions">
                <c:if test="${isWorkspaceAdmin}">
                    <a href="/workspace/settings?wsId=${workspace.wsId}" class="ws-btn">⚙️ 그룹 설정</a>
                </c:if>
                <c:if test="${not isWorkspaceAdmin}">
                    <button type="button" class="ws-btn ws-btn-danger" onclick="leaveWorkspace()">그룹 탈퇴</button>
                </c:if>
            </div>
        </div>

        <c:if test="${isWorkspaceAdmin and empty projectOverview and memberList.size() le 1}">
            <section class="workspace-start-guide" aria-label="워크스페이스 시작 안내">
                <div class="workspace-start-guide-copy">
                    <span class="workspace-start-guide-icon">✨</span>
                    <div>
                        <strong>워크스페이스를 만들었어요.</strong>
                        <p>멤버를 초대하거나 첫 프로젝트를 만들어 협업을 시작해보세요.</p>
                    </div>
                </div>
                <div class="workspace-start-guide-actions">
                    <button type="button" class="workspace-start-btn is-invite" onclick="openInviteModal()">멤버 초대</button>
                    <a class="workspace-start-btn is-project" href="${pageContext.request.contextPath}/project/create?wsId=${workspace.wsId}">프로젝트 만들기</a>
                </div>
            </section>
        </c:if>

        <div class="workspace-dashboard">
            <main class="workspace-main-content">
                <div class="workspace-core-row">
                    <section class="ws-card workspace-core-card workspace-main-today-card">
                        <div class="workspace-core-head">
                            <div>
                                <h3>🗓 오늘의 일정</h3>
                            </div>
                            <div class="workspace-core-actions">
                                <button id="todayScheduleToggle" type="button" class="ws-more-link workspace-inline-toggle" onclick="toggleTodaySchedule(this)" style="display:none;">더보기</button>
                            </div>
                        </div>
                        <ul id="todayScheduleList" class="today-schedule-list workspace-main-schedule-list">
                            <li class="workspace-empty-state">오늘 일정을 불러오는 중입니다.</li>
                        </ul>
                    </section>

                    <section class="ws-card workspace-core-card workspace-main-poll-card">
                        <div class="workspace-core-head">
                            <div class="workspace-core-titleline">
                                <h3>📊 진행 중인 투표</h3>
                                <span id="activePollHeaderCount" class="workspace-title-count">${communitySummary.activePollCount}</span>
                            </div>
                            <a class="ws-more-link" href="/poll/list?scope=WORKSPACE&wsId=${workspace.wsId}">더보기</a>
                        </div>
                        <div id="activePollArea" class="workspace-active-poll-area workspace-poll-summary-area">
                            <div class="workspace-poll-summary-loading">투표를 불러오는 중입니다.</div>
                        </div>
                    </section>
                </div>

                <div class="workspace-widget-grid workspace-project-card-row">
                    <div class="workspace-widget-card workspace-board-card notice-widget-card">
                        <div class="board-title">
                            <span>📢 공지사항</span>
                            <a href="/group/board/list?wsId=${workspace.wsId}&type=NOTICE">더보기</a>
                        </div>
                        <ul id="noticeList" class="board-list"></ul>
                    </div>

                    <div class="workspace-widget-card workspace-board-card free-widget-card workspace-free-feed-card">
                        <div class="board-title">
                            <span>💬 자유 피드</span>
                            <a href="/group/board/list?wsId=${workspace.wsId}&type=FREE">더보기</a>
                        </div>
                        <ul id="freeList" class="board-list free-board-list"></ul>
                    </div>

                    <div class="workspace-widget-card workspace-board-card resource-widget-card">
                        <div class="board-title">
                            <span>📁 자료실</span>
                            <a href="/group/board/list?wsId=${workspace.wsId}&type=FILE">더보기</a>
                        </div>
                        <ul id="fileList" class="board-list"></ul>
                    </div>
                </div>
                <div class="workspace-community-strip workspace-participation-row">
                    <section class="ws-card workspace-note-card workspace-compact-community-card workspace-feature-card workspace-note-feature-card">
                        <div class="board-title">
                            <span>📝 공유 노트</span>
                            <a href="${pageContext.request.contextPath}/note/list?scope=WS&amp;wsId=${workspace.wsId}">더보기</a>
                        </div>
                        <div id="workspaceRecentNoteList"
                             class="workspace-note-preview workspace-note-list"
                             data-ws-id="${workspace.wsId}">
                            <div class="workspace-note-loading">
                                <div class="workspace-note-placeholder-icon">📝</div>
                                <div class="workspace-note-placeholder-copy">
                                    <strong>노트를 불러오는 중입니다.</strong>
                                    <span>잠시만 기다려주세요.</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="ws-card workspace-photo-card workspace-compact-community-card workspace-feature-card workspace-photo-feature-card">
                        <div class="board-title">
                            <span>📷 사진첩</span>
                            <a href="${pageContext.request.contextPath}/photo-album?scopeType=WORKSPACE&scopeId=${workspace.wsId}">더보기</a>
                        </div>
                        <div id="photoAlbumList" class="workspace-photo-grid">
                            <div class="workspace-feature-empty workspace-photo-empty"><span class="workspace-feature-empty-icon">📷</span><div><strong>사진을 불러오는 중입니다.</strong><span>잠시만 기다려주세요.</span></div></div>
                        </div>
                    </section>
                </div>

                <section class="ws-card workspace-project-shortcut-section">
                    <div class="ws-card-header workspace-project-section-head">
                        <div class="workspace-project-head-main">
                            <div class="workspace-project-titleline">
                                <h3>🧭 프로젝트 바로가기</h3>
                            </div>
                            <div class="workspace-project-desc-row">
                                <p>진행 중 프로젝트는 모두 표시하고, 예정과 완료는 필요한 만큼만 요약합니다.</p>
                            </div>
                        </div>
                        <div class="workspace-project-head-actions">
                            <a class="ws-more-link" href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}">더보기</a>
                        </div>
                    </div>

                    <c:set var="scheduledCount" value="0" />
                    <c:set var="progressCount" value="0" />
                    <c:set var="completedCount" value="0" />
                    <c:forEach var="project" items="${projectOverview}">
                        <c:choose>
                            <c:when test="${project.PROJECT_STATUS eq 'SCHEDULED'}"><c:set var="scheduledCount" value="${scheduledCount + 1}" /></c:when>
                            <c:when test="${project.PROJECT_STATUS eq 'COMPLETED'}"><c:set var="completedCount" value="${completedCount + 1}" /></c:when>
                            <c:otherwise><c:set var="progressCount" value="${progressCount + 1}" /></c:otherwise>
                        </c:choose>
                    </c:forEach>
                    <c:set var="totalProjectCount" value="${scheduledCount + progressCount + completedCount}" />

                    <c:choose>
                        <c:when test="${totalProjectCount eq 0}">
                            <div class="workspace-project-empty-start">
                                <div class="workspace-project-empty-icon">🧭</div>
                                <div class="workspace-project-empty-copy">
                                    <strong>아직 프로젝트가 없습니다.</strong>
                                    <span>첫 프로젝트를 만들면 업무, 일정, 게시글을 프로젝트 단위로 관리할 수 있습니다.</span>
                                </div>
                                <c:if test="${isWorkspaceAdmin}">
                                    <a class="workspace-project-empty-btn" href="${pageContext.request.contextPath}/project/create?wsId=${workspace.wsId}">첫 프로젝트 만들기</a>
                                </c:if>
                            </div>
                        </c:when>
                        <c:otherwise>
                    <div class="workspace-project-status-groups">
                        <div class="workspace-project-status-group is-progress">
                            <div class="workspace-project-status-title">
                                <span>진행 중</span>
                                <em>${progressCount}</em>
                            </div>
                            <div class="workspace-project-grid workspace-project-grid-progress">
                                <c:forEach var="project" items="${projectOverview}">
                                    <c:if test="${project.PROJECT_STATUS ne 'SCHEDULED' and project.PROJECT_STATUS ne 'COMPLETED'}">
                                        <a class="workspace-project-card is-progress" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}&wsId=${workspace.wsId}">
                                            <span class="project-state-text is-progress">진행 중</span>
                                            <h4>
                                                <c:choose>
                                                    <c:when test="${not empty project.PROJ_NAME}">${project.PROJ_NAME}</c:when>
                                                    <c:when test="${not empty project.projName}">${project.projName}</c:when>
                                                    <c:when test="${not empty project.PROJECT_NAME}">${project.PROJECT_NAME}</c:when>
                                                    <c:when test="${not empty project.projectName}">${project.projectName}</c:when>
                                                    <c:otherwise>프로젝트</c:otherwise>
                                                </c:choose>
                                            </h4>
<div class="workspace-project-meta">
                                                <span class="project-meta-pill">
                                                    <em>유형</em>
                                                    <b>
                                                        <c:choose>
                                                            <c:when test="${project.PROJ_TYPE eq 'WORK' or project.PROJ_TYPE eq '업무'}">업무</c:when>
                                                            <c:when test="${project.PROJ_TYPE eq 'TRAVEL' or project.PROJ_TYPE eq '여행'}">여행</c:when>
                                                            <c:when test="${project.PROJ_TYPE eq 'MEETING' or project.PROJ_TYPE eq '모임·행사' or project.PROJ_TYPE eq '모임 · 행사'}">모임</c:when>
                                                            <c:when test="${project.PROJ_TYPE eq 'STUDY' or project.PROJ_TYPE eq '학습·연구' or project.PROJ_TYPE eq '학습 · 연구'}">학습</c:when>
                                                            <c:when test="${project.PROJ_TYPE eq 'LIFE' or project.PROJ_TYPE eq '생활·가정' or project.PROJ_TYPE eq '생활 · 가정'}">생활</c:when>
                                                            <c:when test="${project.PROJ_TYPE eq 'HOBBY' or project.PROJ_TYPE eq '취미·창작' or project.PROJ_TYPE eq '취미 · 창작'}">취미</c:when>
                                                            <c:otherwise>${empty project.PROJ_TYPE ? '기타' : project.PROJ_TYPE}</c:otherwise>
                                                        </c:choose>
                                                    </b>
                                                </span>
                                                <span class="project-meta-pill">
                                                    <em>팀장</em>
                                                    <b>${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</b>
                                                </span>
                                                <span class="project-meta-pill project-meta-count">
                                                    <em>인원</em>
                                                    <b>
                                                        <c:choose>
                                                            <c:when test="${not empty project.MEMBER_COUNT}">${project.MEMBER_COUNT}명</c:when>
                                                            <c:when test="${not empty project.memberCount}">${project.memberCount}명</c:when>
                                                            <c:otherwise>-</c:otherwise>
                                                        </c:choose>
                                                    </b>
                                                </span>
                                            </div>
                                            <p class="workspace-project-period"><em>기간</em> <span>
                                                <c:choose>
                                                    <c:when test="${not empty project.START_DATE}">${project.START_DATE}</c:when>
                                                    <c:when test="${not empty project.startDate}">${project.startDate}</c:when>
                                                    <c:when test="${not empty project.PROJ_START_DATE}">${project.PROJ_START_DATE}</c:when>
                                                    <c:otherwise>기간 미설정</c:otherwise>
                                                </c:choose>
                                                ~
                                                <c:choose>
                                                    <c:when test="${not empty project.END_DATE}">${project.END_DATE}</c:when>
                                                    <c:when test="${not empty project.endDate}">${project.endDate}</c:when>
                                                    <c:when test="${not empty project.PROJ_END_DATE}">${project.PROJ_END_DATE}</c:when>
                                                    <c:otherwise>미정</c:otherwise>
                                                </c:choose>
                                                </span>
                                            </p>
                                            <span class="enter">입장하기 →</span>
                                        </a>
                                    </c:if>
                                </c:forEach>
                                <c:if test="${progressCount eq 0}">
                                    <div class="workspace-project-empty compact">진행 중인 프로젝트가 없습니다.</div>
                                </c:if>
                            </div>
                        </div>

                        <div class="workspace-project-secondary-row">
                            <div class="workspace-project-status-group is-scheduled">
                                <div class="workspace-project-status-title">
                                    <span>예정</span>
                                    <em>${scheduledCount}</em>
                                </div>
                                <div class="workspace-project-grid workspace-project-grid-secondary">
                                    <c:set var="shownScheduled" value="0" />
                                    <c:forEach var="project" items="${projectOverview}">
                                        <c:if test="${project.PROJECT_STATUS eq 'SCHEDULED' and shownScheduled lt 3}">
                                            <a class="workspace-project-card is-scheduled" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}&wsId=${workspace.wsId}">
                                                <span class="project-state-text is-scheduled">예정</span>
                                                <h4>
                                                <c:choose>
                                                    <c:when test="${not empty project.PROJ_NAME}">${project.PROJ_NAME}</c:when>
                                                    <c:when test="${not empty project.projName}">${project.projName}</c:when>
                                                    <c:when test="${not empty project.PROJECT_NAME}">${project.PROJECT_NAME}</c:when>
                                                    <c:when test="${not empty project.projectName}">${project.projectName}</c:when>
                                                    <c:otherwise>프로젝트</c:otherwise>
                                                </c:choose>
                                            </h4>
<div class="workspace-project-meta">
                                                    <span class="project-meta-pill">
                                                        <em>유형</em>
                                                        <b>
                                                            <c:choose>
                                                                <c:when test="${project.PROJ_TYPE eq 'WORK' or project.PROJ_TYPE eq '업무'}">업무</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'TRAVEL' or project.PROJ_TYPE eq '여행'}">여행</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'MEETING' or project.PROJ_TYPE eq '모임·행사' or project.PROJ_TYPE eq '모임 · 행사'}">모임</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'STUDY' or project.PROJ_TYPE eq '학습·연구' or project.PROJ_TYPE eq '학습 · 연구'}">학습</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'LIFE' or project.PROJ_TYPE eq '생활·가정' or project.PROJ_TYPE eq '생활 · 가정'}">생활</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'HOBBY' or project.PROJ_TYPE eq '취미·창작' or project.PROJ_TYPE eq '취미 · 창작'}">취미</c:when>
                                                                <c:otherwise>${empty project.PROJ_TYPE ? '기타' : project.PROJ_TYPE}</c:otherwise>
                                                            </c:choose>
                                                        </b>
                                                    </span>
                                                    <span class="project-meta-pill">
                                                        <em>팀장</em>
                                                        <b>${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</b>
                                                    </span>
                                                    <span class="project-meta-pill project-meta-count">
                                                        <em>인원</em>
                                                        <b>
                                                            <c:choose>
                                                                <c:when test="${not empty project.MEMBER_COUNT}">${project.MEMBER_COUNT}명</c:when>
                                                                <c:when test="${not empty project.memberCount}">${project.memberCount}명</c:when>
                                                                <c:otherwise>-</c:otherwise>
                                                            </c:choose>
                                                        </b>
                                                    </span>
                                                </div>
                                                <p class="workspace-project-period"><em>기간</em> <span>${empty project.START_DATE ? '기간 미설정' : project.START_DATE} 시작</span></p>
                                                <span class="enter">입장하기 →</span>
                                            </a>
                                            <c:set var="shownScheduled" value="${shownScheduled + 1}" />
                                        </c:if>
                                    </c:forEach>
                                    <c:if test="${scheduledCount eq 0}">
                                        <div class="workspace-project-empty compact">예정된 프로젝트가 없습니다.</div>
                                    </c:if>
                                </div>
                                <c:if test="${scheduledCount gt 3}">
                                    <a class="workspace-project-group-more" href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}&status=SCHEDULED">예정 프로젝트 더보기</a>
                                </c:if>
                            </div>

                            <div class="workspace-project-status-group is-completed">
                                <div class="workspace-project-status-title">
                                    <span>완료</span>
                                    <em>${completedCount}</em>
                                </div>
                                <div class="workspace-project-grid workspace-project-grid-secondary">
                                    <c:set var="shownCompleted" value="0" />
                                    <c:forEach var="project" items="${projectOverview}">
                                        <c:if test="${project.PROJECT_STATUS eq 'COMPLETED' and shownCompleted lt 2}">
                                            <a class="workspace-project-card is-completed" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}&wsId=${workspace.wsId}">
                                                <span class="project-state-text is-completed">완료</span>
                                                <h4>
                                                <c:choose>
                                                    <c:when test="${not empty project.PROJ_NAME}">${project.PROJ_NAME}</c:when>
                                                    <c:when test="${not empty project.projName}">${project.projName}</c:when>
                                                    <c:when test="${not empty project.PROJECT_NAME}">${project.PROJECT_NAME}</c:when>
                                                    <c:when test="${not empty project.projectName}">${project.projectName}</c:when>
                                                    <c:otherwise>프로젝트</c:otherwise>
                                                </c:choose>
                                            </h4>
<div class="workspace-project-meta">
                                                    <span class="project-meta-pill">
                                                        <em>유형</em>
                                                        <b>
                                                            <c:choose>
                                                                <c:when test="${project.PROJ_TYPE eq 'WORK' or project.PROJ_TYPE eq '업무'}">업무</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'TRAVEL' or project.PROJ_TYPE eq '여행'}">여행</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'MEETING' or project.PROJ_TYPE eq '모임·행사' or project.PROJ_TYPE eq '모임 · 행사'}">모임</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'STUDY' or project.PROJ_TYPE eq '학습·연구' or project.PROJ_TYPE eq '학습 · 연구'}">학습</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'LIFE' or project.PROJ_TYPE eq '생활·가정' or project.PROJ_TYPE eq '생활 · 가정'}">생활</c:when>
                                                                <c:when test="${project.PROJ_TYPE eq 'HOBBY' or project.PROJ_TYPE eq '취미·창작' or project.PROJ_TYPE eq '취미 · 창작'}">취미</c:when>
                                                                <c:otherwise>${empty project.PROJ_TYPE ? '기타' : project.PROJ_TYPE}</c:otherwise>
                                                            </c:choose>
                                                        </b>
                                                    </span>
                                                    <span class="project-meta-pill">
                                                        <em>팀장</em>
                                                        <b>${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</b>
                                                    </span>
                                                    <span class="project-meta-pill project-meta-count">
                                                        <em>인원</em>
                                                        <b>
                                                            <c:choose>
                                                                <c:when test="${not empty project.MEMBER_COUNT}">${project.MEMBER_COUNT}명</c:when>
                                                                <c:when test="${not empty project.memberCount}">${project.memberCount}명</c:when>
                                                                <c:otherwise>-</c:otherwise>
                                                            </c:choose>
                                                        </b>
                                                    </span>
                                                </div>
                                                <p class="workspace-project-period"><em>기간</em> <span>${empty project.END_DATE ? '종료일 미설정' : project.END_DATE} 완료</span></p>
                                                <span class="enter">입장하기 →</span>
                                            </a>
                                            <c:set var="shownCompleted" value="${shownCompleted + 1}" />
                                        </c:if>
                                    </c:forEach>
                                    <c:if test="${completedCount eq 0}">
                                        <div class="workspace-project-empty compact">완료된 프로젝트가 없습니다.</div>
                                    </c:if>
                                </div>
                                <c:if test="${completedCount gt 2}">
                                    <a class="workspace-project-group-more" href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}&status=COMPLETED">완료 프로젝트 더보기</a>
                                </c:if>
                            </div>
                        </div>
                    </div>
                        </c:otherwise>
                    </c:choose>
                    <c:if test="${isWorkspaceAdmin and totalProjectCount gt 0}">
                        <div class="workspace-project-section-footer">
                            <a class="workspace-project-create-btn" href="${pageContext.request.contextPath}/project/create?wsId=${workspace.wsId}">+ 프로젝트 생성</a>
                        </div>
                    </c:if>
                </section>
            </main>

            <aside class="workspace-side-content">
                <section class="mini-calendar workspace-calendar-panel moyo-calendar-widget">
                    <div class="calendar-header workspace-calendar-head moyo-calendar-head">
                        <div class="workspace-calendar-title-row moyo-calendar-title-row">
                            <button type="button" class="calendar-nav workspace-calendar-nav moyo-calendar-nav-btn" onclick="changeMonth(-1)" aria-label="이전 달">‹</button>
                            <span id="calendarTitle" class="moyo-calendar-month-title"></span>
                            <button type="button" class="calendar-nav workspace-calendar-nav moyo-calendar-nav-btn" onclick="changeMonth(1)" aria-label="다음 달">›</button>
                        </div>
                        <a class="workspace-calendar-more moyo-calendar-more" href="${pageContext.request.contextPath}/calendar?wsId=${workspace.wsId}">전체보기</a>
                    </div>
                    <div class="calendar-grid moyo-calendar-grid" id="calendarGrid">
                        <div class="day-name sun">일</div>
                        <div class="day-name">월</div>
                        <div class="day-name">화</div>
                        <div class="day-name">수</div>
                        <div class="day-name">목</div>
                        <div class="day-name">금</div>
                        <div class="day-name sat">토</div>
                    </div>
                    <div class="calendar-legend workspace-calendar-legend moyo-calendar-legend">
                        <span class="today-legend">오늘</span>
                        <span class="event-legend">일정 있음</span>
                    </div>
                    <c:if test="${isWorkspaceAdmin}">
                        <button type="button" class="ws-btn ws-btn-primary workspace-calendar-add-btn" onclick="openCalendarModal()">+ 그룹 일정 등록</button>
                    </c:if>
                </section>

                <section class="workspace-side-card workspace-member-panel">
                    <div class="project-member-head workspace-member-head">
                        <div class="project-member-title workspace-member-title">
                            <span>👥</span>
                            <strong>그룹 멤버</strong>
                            <span id="workspaceMemberCount" class="project-member-count workspace-member-count">${memberList.size()}</span>
                        </div>
                        <c:if test="${isWorkspaceAdmin}">
                            <div class="workspace-member-head-actions">
                                <a href="/workspace/settings/members?wsId=${workspace.wsId}"
                                   class="workspace-member-manage-btn">관리</a>
                                <button type="button"
                                        class="workspace-member-invite-btn"
                                        onclick="openInviteModal()">초대</button>
                            </div>
                        </c:if>
                    </div>
                    <div class="project-member-list workspace-member-list">
                        <c:forEach var="mem" items="${memberList}" varStatus="status">
                            <button type="button"
                                    class="moyo-member-card workspace-member-item workspace-member-profile-trigger"
                                    data-user-id="${mem.USER_ID}"
                                    onclick="openWorkspaceMemberProfile(${mem.USER_ID})">
                                <div class="moyo-member-top">
                                    <div class="workspace-member-avatar">
                                        <c:choose>
                                            <c:when test="${not empty mem.PROFILE_IMAGE_PATH}">
                                                <img src="${mem.PROFILE_IMAGE_PATH}" alt="" onerror="this.remove();">
                                            </c:when>
                                            <c:otherwise>${mem.DISPLAY_NAME.substring(0,1)}</c:otherwise>
                                        </c:choose>
                                    </div>
                                    <div class="moyo-member-main">
                                        <div class="moyo-member-name-line">
                                            <span class="moyo-member-name" title="${mem.DISPLAY_NAME}">${mem.DISPLAY_NAME}</span>
                                            <span class="moyo-member-role">
                                                <c:choose>
                                                    <c:when test="${mem.USER_ID eq workspace.ownerId}">그룹장</c:when>
                                                    <c:when test="${mem.WS_ROLE eq 'ADMIN'}">관리자</c:when>
                                                    <c:otherwise>멤버</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </div>
                                        <div class="moyo-member-position workspace-member-email">
                                            <c:choose>
                                                <c:when test="${not empty mem.POSITION_NAME}">${mem.POSITION_NAME}</c:when>
                                                <c:otherwise>${mem.EMAIL}</c:otherwise>
                                            </c:choose>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </c:forEach>
                    </div>
                </section>
            </aside>
        </div>
    </div>

    <div id="inviteOverlay"
         class="workspace-modal-overlay workspace-main-invite-overlay"
         onclick="closeInviteModal()"></div>

    <section id="inviteModal"
             class="workspace-modal workspace-main-invite-modal"
             role="dialog"
             aria-modal="true"
             aria-labelledby="workspaceInviteModalTitle">
        <div class="workspace-main-invite-head">
            <div>
                <span>워크스페이스 멤버</span>
                <h3 id="workspaceInviteModalTitle">멤버 초대</h3>
            </div>
            <button type="button"
                    class="workspace-main-invite-close"
                    onclick="closeInviteModal()"
                    aria-label="닫기">×</button>
        </div>

        <div class="workspace-main-invite-body">
            <div class="workspace-main-invite-search">
                <input type="email"
                       id="searchEmail"
                       placeholder="초대할 멤버 이메일을 입력하세요"
                       autocomplete="off"
                       onkeydown="if(event.key==='Enter'){event.preventDefault();searchUser();}">
                <button type="button" onclick="searchUser()">검색</button>
            </div>

            <div id="userList" class="workspace-main-invite-results">
                <div class="workspace-main-invite-empty">이메일로 멤버를 검색하세요.</div>
            </div>
        </div>
    </section>


    <div id="memberProfileOverlay" class="workspace-modal-overlay workspace-member-profile-overlay" onclick="closeWorkspaceMemberProfile()"></div>
    <div id="memberProfileModal" class="workspace-modal workspace-member-profile-modal"
         role="dialog" aria-modal="true" aria-labelledby="memberProfileModalTitle">
        <div class="workspace-modal-head">
            <div>
                <span class="workspace-profile-kicker">워크스페이스 프로필</span>
                <h3 id="memberProfileModalTitle">멤버 프로필</h3>
            </div>
            <button type="button" class="workspace-modal-close" onclick="closeWorkspaceMemberProfile()">&times;</button>
        </div>

        <div id="memberProfileLoading" class="workspace-profile-loading">프로필을 불러오는 중입니다.</div>

        <div id="memberProfileContent" class="workspace-profile-content" hidden>
            <div class="workspace-profile-summary">
                <div id="memberProfileAvatar" class="workspace-profile-avatar"></div>
                <div class="workspace-profile-summary-text">
                    <strong id="memberProfileName"></strong>
                    <span id="memberProfilePosition"></span>
                    <span id="memberProfileRole" class="workspace-profile-role"></span>
                </div>
            </div>

            <div id="memberProfileView" class="workspace-profile-view">
                <dl class="workspace-profile-detail-list">
                    <div><dt>이메일</dt><dd id="memberProfileEmail"></dd></div>
                    <div id="memberProfilePhoneRow"><dt>연락처</dt><dd id="memberProfilePhone"></dd></div>
                    <div><dt>가입일</dt><dd id="memberProfileJoinedAt"></dd></div>
                </dl>
            </div>

            <form id="memberProfileEdit" class="workspace-profile-edit" hidden onsubmit="saveWorkspaceMemberProfile(event)">
                <label class="workspace-profile-switch-row">
                    <span>
                        <strong>계정 기본 프로필 사용</strong>
                        <small>켜면 계정 이름과 기본 이미지를 사용합니다.</small>
                    </span>
                    <input type="checkbox" id="profileUseAccount">
                </label>

                <div class="profile-image-editor workspace-profile-image-editor">
                    <div id="modalProfileViewport" class="profile-image-viewport">
                        <div id="modalProfilePlaceholder" class="profile-image-placeholder"></div>
                        <img id="modalProfileCropImage" hidden alt="">
                    </div>
                    <div class="profile-image-tools">
                        <strong>프로필 이미지</strong>
                        <label for="modalProfileImageInput" class="profile-image-button">이미지 선택</label>
                        <input type="file" id="modalProfileImageInput" accept="image/*" hidden>
                        <small>전용 프로필에서 드래그와 확대 기능을 사용할 수 있습니다.</small>
                        <input type="range" id="modalProfileZoom" min="1" max="3" step="0.05" value="1">
                    </div>
                </div>

                <div class="workspace-profile-form-grid">
                    <label>
                        <span>워크스페이스 표시 이름</span>
                        <input type="text" id="profileDisplayName" maxlength="50">
                    </label>
                    <label>
                        <span>직책 또는 담당 분야</span>
                        <input type="text" id="profilePositionName" maxlength="50" placeholder="예: 백엔드 개발자">
                    </label>
                    <label class="workspace-profile-full-field">
                        <span>워크스페이스 이메일</span>
                        <input type="text" id="profileContactEmail" maxlength="100">
                    </label>
                    <label class="workspace-profile-full-field">
                        <span>연락처 <em>선택</em></span>
                        <input type="tel" id="profilePhoneNumber" maxlength="30" placeholder="예: 010-0000-0000">
                    </label>
                    <label class="workspace-profile-check-row workspace-profile-full-field">
                        <input type="checkbox" id="profileShowPhone">
                        <span>다른 워크스페이스 멤버에게 연락처 공개</span>
                    </label>
                </div>
            </form>

            <div id="memberProfileActions" class="workspace-profile-actions"></div>
        </div>
    </div>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
