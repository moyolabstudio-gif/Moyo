<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="effectiveWorkspaceId" value="${workspace.wsId}" />
<c:if test="${empty effectiveWorkspaceId and not empty wsId}"><c:set var="effectiveWorkspaceId" value="${wsId}" /></c:if>
<c:if test="${empty effectiveWorkspaceId and not empty param.wsId}"><c:set var="effectiveWorkspaceId" value="${param.wsId}" /></c:if>
<c:set var="workspaceNoteQuery" value="scope=WS" />
<c:if test="${not empty effectiveWorkspaceId}"><c:set var="workspaceNoteQuery" value="${workspaceNoteQuery}&amp;wsId=${effectiveWorkspaceId}" /></c:if>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><c:out value="${workspace.wsName}"/> 커뮤니티 홈</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceMain.css?v=project-quick-density-v4">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonWorkspaceInvite.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberProfile.css">
    <script defer src="${pageContext.request.contextPath}/js/workspaceMain.js"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonWorkspaceInvite.js"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberProfile.js"></script>
</head>
<body class="moyo-app-sidebar-enabled workspace-community-body"
      data-ws-id="${effectiveWorkspaceId}"
      data-context-path="${pageContext.request.contextPath}"
      data-current-user-id="${user.userId}"
      data-workspace-admin="${isWorkspaceAdmin}"
      data-workspace-owner="${currentUserIsOwner}"
      data-workspace-member="${isWorkspaceMember}"
      data-workspace-name="<c:out value='${workspace.wsName}'/>"
      data-join-type="${workspace.joinType}"
      data-join-request-status="${joinRequestStatus}">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="container workspace-community-container">
        <c:set var="hasWorkspaceDescription" value="${not empty fn:trim(workspace.wsDescription)}" />
        <c:set var="hasWorkspaceLinks" value="${not empty workspaceLinks}" />
        <div class="workspace-hero${hasWorkspaceDescription ? ' has-description' : ''}${hasWorkspaceLinks ? ' has-links' : ''}">
            <div class="workspace-avatar${empty workspace.wsImagePath ? ' is-default' : ''}">
                <c:if test="${not empty workspace.wsImagePath}">
                    <img src="<c:out value='${workspace.wsImagePath}'/>"
                         alt="<c:out value='${workspace.wsName}'/> 그룹 이미지"
                         onerror="this.hidden=true; this.parentElement.classList.add('is-default'); this.nextElementSibling.hidden=false;">
                </c:if>
                <span class="workspace-avatar-fallback"
                      aria-hidden="true"
                      ${not empty workspace.wsImagePath ? 'hidden' : ''}>
                    <c:choose>
                        <c:when test="${not empty workspace.wsName}"><c:out value="${fn:toUpperCase(fn:substring(fn:trim(workspace.wsName), 0, 1))}"/></c:when>
                        <c:otherwise>G</c:otherwise>
                    </c:choose>
                </span>
            </div>
            <div class="workspace-hero-info">
                <div class="workspace-type-status" aria-label="그룹 유형과 가입 방식">
                    <span class="workspace-type-label">
                        <c:choose>
                            <c:when test="${workspace.wsType eq 'ORGANIZATION'}">회사 · 조직</c:when>
                            <c:when test="${workspace.wsType eq 'TEAM'}">팀 · 협업</c:when>
                            <c:when test="${workspace.wsType eq 'STUDY'}">스터디 · 연구</c:when>
                            <c:when test="${workspace.wsType eq 'CLUB'}">동아리 · 취미</c:when>
                            <c:when test="${workspace.wsType eq 'LIFE'}">가족 · 생활</c:when>
                            <c:when test="${workspace.wsType eq 'ETC'}">기타</c:when>
                            <c:otherwise>모임 · 커뮤니티</c:otherwise>
                        </c:choose>
                    </span>
                    <c:choose>
                        <c:when test="${workspace.joinType eq 'INVITE_ONLY'}">
                            <span class="workspace-join-status-badge is-invite">비공개 · 초대 전용</span>
                        </c:when>
                        <c:when test="${workspace.joinType eq 'APPROVAL'}">
                            <span class="workspace-join-status-badge is-approval">공개 · 승인제</span>
                        </c:when>
                        <c:otherwise>
                            <span class="workspace-join-status-badge is-open">공개 · 자유 가입</span>
                        </c:otherwise>
                    </c:choose>
                </div>
                <h1 title="<c:out value='${workspace.wsName}'/>"><c:out value="${workspace.wsName}"/></h1>
                <c:if test="${hasWorkspaceDescription or hasWorkspaceLinks}">
                    <div class="workspace-hero-meta-line${hasWorkspaceDescription ? ' has-description' : ''}${hasWorkspaceLinks ? ' has-links' : ''}">
                        <c:if test="${hasWorkspaceDescription}">
                            <p class="workspace-hero-description"><c:out value="${workspace.wsDescription}"/></p>
                        </c:if>
                        <c:if test="${hasWorkspaceLinks}">
                            <div class="workspace-external-links" aria-label="그룹 외부 링크">
                                <c:forEach var="link" items="${workspaceLinks}">
                                    <a href="<c:out value='${link.LINK_URL}'/>"
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       class="workspace-external-link"
                                       title="<c:out value='${link.LINK_NAME}'/>">
                                        <span class="workspace-external-link-icon" aria-hidden="true">🔗</span>
                                        <c:out value="${link.LINK_NAME}"/>
                                        <span class="workspace-external-link-arrow" aria-hidden="true">↗</span>
                                    </a>
                                </c:forEach>
                            </div>
                        </c:if>
                    </div>
                </c:if>
            </div>
            <c:if test="${isWorkspaceMember}">
            <div class="workspace-hero-actions">
                <div class="workspace-group-menu-wrap">
                    <button type="button"
                            class="workspace-group-menu-trigger"
                            id="workspaceGroupMenuTrigger"
                            data-menu-bound="true"
                            aria-label="그룹 메뉴"
                            aria-haspopup="true"
                            aria-expanded="false"
                            onclick="event.preventDefault(); event.stopPropagation(); var menu=this.nextElementSibling; var willOpen=menu.hidden; menu.hidden=!willOpen; this.setAttribute('aria-expanded', willOpen ? 'true' : 'false'); if(willOpen){ var rect=this.getBoundingClientRect(); var width=menu.offsetWidth || 168; var gap=12; menu.style.left=Math.min(window.innerWidth-width-gap, Math.max(gap, rect.right-width))+'px'; menu.style.top=(rect.bottom+8)+'px'; menu.style.right='auto'; } else { menu.style.left=''; menu.style.top=''; menu.style.right=''; }">⋯</button>
                    <div class="workspace-group-menu" id="workspaceGroupMenu" hidden>
                        <c:if test="${isWorkspaceAdmin}">
                            <a class="workspace-group-menu-item" href="${pageContext.request.contextPath}/workspace/settings?wsId=${workspace.wsId}">
                                그룹 설정
                            </a>
                            <a class="workspace-group-menu-item" href="${pageContext.request.contextPath}/workspace/settings?wsId=${workspace.wsId}&amp;tab=members">
                                멤버 관리
                            </a>
                        </c:if>
                        <button type="button" class="workspace-group-menu-item" onclick="openMyWorkspaceProfileFromMenu()">
                            내 그룹 프로필
                        </button>
                        <c:choose>
                            <c:when test="${currentUserIsOwner}">
                                <button type="button" class="workspace-group-menu-item" onclick="goToOwnerTransfer()">
                                    그룹장 권한 위임
                                </button>
                            </c:when>
                            <c:otherwise>
                                <button type="button" class="workspace-group-menu-item is-danger" onclick="leaveWorkspace()">
                                    그룹 탈퇴
                                </button>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </div>
            </div>
            </c:if>
        </div>

        <c:if test="${not isWorkspaceMember}">
            <section class="workspace-rejoin-card" aria-label="그룹 재참여 안내">
                <div class="workspace-rejoin-copy">
                    <span class="workspace-rejoin-kicker">그룹 둘러보기</span>
                    <h2><c:out value="${workspace.wsName}"/>에 다시 참여할까요?</h2>
                    <p>현재는 그룹 멤버가 아니므로 그룹 내부 게시물과 일정은 볼 수 없습니다. 그룹 정보는 그대로 확인하고 다시 참여할 수 있습니다.</p>
                    <span class="workspace-rejoin-member-count">현재 멤버 <strong><c:out value="${memberCount}"/></strong>명</span>
                </div>
                <div class="workspace-rejoin-actions">
                    <c:choose>
                        <c:when test="${workspace.joinType eq 'OPEN'}">
                            <button type="button" id="workspaceOpenJoinBtn" class="workspace-rejoin-primary">참여하기</button>
                        </c:when>
                        <c:when test="${joinRequestStatus eq 'PENDING'}">
                            <button type="button" id="workspaceCancelRequestBtn" class="workspace-rejoin-secondary">참여 요청 취소</button>
                        </c:when>
                        <c:when test="${joinRequestStatus eq 'APPROVED'}">
                            <a class="workspace-rejoin-primary" href="${pageContext.request.contextPath}/requests">참여 완료하기</a>
                        </c:when>
                        <c:otherwise>
                            <button type="button" id="workspaceRequestJoinBtn" class="workspace-rejoin-primary">참여 요청</button>
                        </c:otherwise>
                    </c:choose>
                    <a class="workspace-rejoin-back" href="${pageContext.request.contextPath}/users/mypage">내 프로필로 돌아가기</a>
                </div>
            </section>
        </c:if>

        <c:if test="${isWorkspaceMember}">
        <c:if test="${isWorkspaceAdmin and empty projectOverview and memberList.size() le 1}">
            <section class="workspace-start-guide" aria-label="그룹 시작 안내">
                <div class="workspace-start-guide-copy">
                    <span class="workspace-start-guide-icon">✨</span>
                    <div>
                        <strong>그룹을 만들었어요.</strong>
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
                            <a class="ws-more-link" href="${pageContext.request.contextPath}/poll/list?scope=WORKSPACE&amp;wsId=${workspace.wsId}">더보기</a>
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
                            <a href="${pageContext.request.contextPath}/group/board/list?wsId=${workspace.wsId}&amp;type=NOTICE">더보기</a>
                        </div>
                        <ul id="noticeList" class="board-list"></ul>
                    </div>

                    <div class="workspace-widget-card workspace-board-card free-widget-card workspace-free-feed-card">
                        <div class="board-title">
                            <span>💬 자유 피드</span>
                            <a href="${pageContext.request.contextPath}/group/board/list?wsId=${workspace.wsId}&amp;type=FREE">더보기</a>
                        </div>
                        <ul id="freeList" class="board-list free-board-list"></ul>
                    </div>

                    <div class="workspace-widget-card workspace-board-card resource-widget-card">
                        <div class="board-title">
                            <span>📁 자료실</span>
                            <a href="${pageContext.request.contextPath}/group/board/list?wsId=${workspace.wsId}&amp;type=FILE">더보기</a>
                        </div>
                        <ul id="fileList" class="board-list"></ul>
                    </div>
                </div>
                <div class="workspace-community-strip workspace-participation-row">
                    <section class="ws-card workspace-note-card workspace-compact-community-card workspace-feature-card workspace-note-feature-card">
                        <div class="board-title">
                            <span>📝 공유 노트</span>
                            <a href="${pageContext.request.contextPath}/note/list?${workspaceNoteQuery}">더보기</a>
                        </div>
                        <div id="workspaceRecentNoteList"
                             class="workspace-note-preview workspace-note-list"
                             data-ws-id="${effectiveWorkspaceId}">
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
                            <span><span class="workspace-camera-icon" aria-hidden="true">📷</span> 사진첩</span>
                            <a href="${pageContext.request.contextPath}/photo-album?scopeType=WORKSPACE&scopeId=${workspace.wsId}">더보기</a>
                        </div>
                        <div id="photoAlbumList" class="workspace-photo-grid">
                            <div class="workspace-feature-empty workspace-photo-empty"><span class="workspace-feature-empty-icon workspace-camera-icon">📷</span><div><strong>사진을 불러오는 중입니다.</strong><span>잠시만 기다려주세요.</span></div></div>
                        </div>
                    </section>
                </div>

                <section class="ws-card workspace-project-shortcut-section workspace-project-quick-widget">
                    <c:set var="scheduledCount" value="0" />
                    <c:set var="progressCount" value="0" />
                    <c:set var="completedCount" value="0" />
                    <c:forEach var="project" items="${projectOverview}">
                        <c:choose>
                            <c:when test="${project.PROJECT_STATUS eq 'SCHEDULED'}">
                                <c:set var="scheduledCount" value="${scheduledCount + 1}" />
                            </c:when>
                            <c:when test="${project.PROJECT_STATUS eq 'COMPLETED'}">
                                <c:set var="completedCount" value="${completedCount + 1}" />
                            </c:when>
                            <c:otherwise>
                                <c:set var="progressCount" value="${progressCount + 1}" />
                            </c:otherwise>
                        </c:choose>
                    </c:forEach>
                    <c:set var="totalProjectCount" value="${scheduledCount + progressCount + completedCount}" />

                    <div class="workspace-project-quick-head">
                        <div class="workspace-project-quick-heading">
                            <div class="workspace-project-quick-title">
                                <h3>🧭 프로젝트 바로가기</h3>
                                <span class="workspace-project-quick-total">${totalProjectCount}</span>
                            </div>
                            <p>진행 중인 프로젝트를 확인하고 바로 입장할 수 있어요.</p>
                        </div>
                        <div class="workspace-project-quick-actions">
                            <a class="workspace-project-quick-more"
                               href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}">더보기</a>
                        </div>
                    </div>

                    <div class="workspace-project-quick-toolbar">
                        <div class="workspace-project-quick-summary" aria-label="프로젝트 상태 요약">
                            <a class="workspace-project-quick-summary-item is-progress"
                               href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}&amp;status=IN_PROGRESS">
                                <span>진행 중</span><strong>${progressCount}</strong>
                            </a>
                            <a class="workspace-project-quick-summary-item is-scheduled"
                               href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}&amp;status=SCHEDULED">
                                <span>예정</span><strong>${scheduledCount}</strong>
                            </a>
                            <a class="workspace-project-quick-summary-item is-completed"
                               href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}&amp;status=COMPLETED">
                                <span>완료</span><strong>${completedCount}</strong>
                            </a>
                        </div>
                        <c:if test="${isWorkspaceAdmin}">
                            <a class="workspace-project-create-btn workspace-project-quick-create"
                               href="${pageContext.request.contextPath}/project/create?wsId=${workspace.wsId}">+ 프로젝트 생성</a>
                        </c:if>
                    </div>

                    <c:choose>
                        <c:when test="${totalProjectCount eq 0}">
                            <div class="workspace-project-empty-start workspace-project-quick-empty">
                                <div class="workspace-project-empty-icon">🧭</div>
                                <div class="workspace-project-empty-copy">
                                    <strong>아직 프로젝트가 없습니다.</strong>
                                    <span>첫 프로젝트를 만들면 업무와 일정을 프로젝트 단위로 관리할 수 있습니다.</span>
                                </div>
                                <c:if test="${isWorkspaceAdmin}">
                                    <a class="workspace-project-empty-btn"
                                       href="${pageContext.request.contextPath}/project/create?wsId=${workspace.wsId}">첫 프로젝트 만들기</a>
                                </c:if>
                            </div>
                        </c:when>
                        <c:when test="${progressCount eq 0}">
                            <a class="workspace-project-quick-no-progress"
                               href="${pageContext.request.contextPath}/project/list?wsId=${workspace.wsId}">
                                <strong>진행 중인 프로젝트가 없습니다.</strong>
                                <span>예정 및 완료 프로젝트는 전체 목록에서 확인하세요.</span>
                                <em>프로젝트 목록 보기 →</em>
                            </a>
                        </c:when>
                        <c:otherwise>
                            <div class="workspace-project-quick-list count-${progressCount}">
                                <c:forEach var="project" items="${projectOverview}">
                                    <c:if test="${project.PROJECT_STATUS ne 'SCHEDULED'
                                                and project.PROJECT_STATUS ne 'COMPLETED'}">
                                        <a class="workspace-project-quick-card"
                                           href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}&amp;wsId=${workspace.wsId}">
                                            <span class="workspace-project-quick-accent" aria-hidden="true"></span>

                                            <div class="workspace-project-quick-badges">
                                                <span class="workspace-project-quick-status">진행 중</span>
                                                <span class="workspace-project-quick-type">
                                                    <c:choose>
                                                        <c:when test="${project.PROJ_TYPE eq 'WORK' or project.PROJ_TYPE eq '업무'}">업무</c:when>
                                                        <c:when test="${project.PROJ_TYPE eq 'TRAVEL' or project.PROJ_TYPE eq '여행'}">여행</c:when>
                                                        <c:when test="${project.PROJ_TYPE eq 'MEETING' or project.PROJ_TYPE eq '모임·행사' or project.PROJ_TYPE eq '모임 · 행사'}">모임</c:when>
                                                        <c:when test="${project.PROJ_TYPE eq 'STUDY' or project.PROJ_TYPE eq '학습·연구' or project.PROJ_TYPE eq '학습 · 연구'}">학습</c:when>
                                                        <c:when test="${project.PROJ_TYPE eq 'LIFE' or project.PROJ_TYPE eq '생활·가정' or project.PROJ_TYPE eq '생활 · 가정'}">생활</c:when>
                                                        <c:when test="${project.PROJ_TYPE eq 'HOBBY' or project.PROJ_TYPE eq '취미·창작' or project.PROJ_TYPE eq '취미 · 창작'}">취미</c:when>
                                                        <c:otherwise>${empty project.PROJ_TYPE ? '기타' : project.PROJ_TYPE}</c:otherwise>
                                                    </c:choose>
                                                </span>
                                            </div>

                                            <h4>
                                                <c:choose>
                                                    <c:when test="${not empty project.PROJ_NAME}">${project.PROJ_NAME}</c:when>
                                                    <c:when test="${not empty project.projName}">${project.projName}</c:when>
                                                    <c:otherwise>프로젝트</c:otherwise>
                                                </c:choose>
                                            </h4>

                                            <c:if test="${not empty project.PROJ_DESC}">
                                                <p class="workspace-project-quick-desc">${project.PROJ_DESC}</p>
                                            </c:if>

                                            <dl class="workspace-project-quick-info">
                                                <div class="workspace-project-quick-period">
                                                    <dt>기간</dt>
                                                    <dd>
                                                        <c:choose>
                                                            <c:when test="${not empty project.START_DATE}">${project.START_DATE}</c:when>
                                                            <c:otherwise>미설정</c:otherwise>
                                                        </c:choose>
                                                        <span>~</span>
                                                        <c:choose>
                                                            <c:when test="${not empty project.END_DATE}">${project.END_DATE}</c:when>
                                                            <c:otherwise>미정</c:otherwise>
                                                        </c:choose>
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt>팀장</dt>
                                                    <dd>${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</dd>
                                                </div>
                                                <div>
                                                    <dt>인원</dt>
                                                    <dd>
                                                        <c:choose>
                                                            <c:when test="${not empty project.MEMBER_COUNT}">${project.MEMBER_COUNT}명</c:when>
                                                            <c:when test="${not empty project.memberCount}">${project.memberCount}명</c:when>
                                                            <c:otherwise>-</c:otherwise>
                                                        </c:choose>
                                                    </dd>
                                                </div>
                                            </dl>

                                            <span class="workspace-project-quick-enter">프로젝트 열기 <b>→</b></span>
                                        </a>
                                    </c:if>
                                </c:forEach>
                            </div>
                        </c:otherwise>
                    </c:choose>
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
                                <a href="${pageContext.request.contextPath}/workspace/settings/members?wsId=${workspace.wsId}"
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
                                    <div class="workspace-member-avatar ${not empty mem.PROFILE_IMAGE_PATH ? 'has-image' : 'is-default-profile'}">
                                        <c:choose>
                                            <c:when test="${not empty mem.PROFILE_IMAGE_PATH}">
                                                <img src="<c:out value='${mem.PROFILE_IMAGE_PATH}'/>"
                                                     alt="<c:out value='${mem.DISPLAY_NAME}'/> 프로필"
                                                     onerror="
                                                         const avatar = this.closest('.workspace-member-avatar');
                                                         if (avatar) {
                                                             avatar.classList.remove('has-image');
                                                             avatar.classList.add('is-default-profile');
                                                         }
                                                         this.remove();
                                                     ">
                                                <span class="workspace-member-avatar-fallback"><c:out value="${mem.DISPLAY_NAME.substring(0,1)}"/></span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="workspace-member-avatar-fallback"><c:out value="${mem.DISPLAY_NAME.substring(0,1)}"/></span>
                                            </c:otherwise>
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
        </c:if>
    </div>

    <c:if test="${isWorkspaceMember}">
    <jsp:include page="/WEB-INF/views/common/commonWorkspaceInvite.jsp" />
    </c:if>


    <jsp:include page="/WEB-INF/views/common/commonMemberProfile.jsp">
        <jsp:param name="profileScope" value="group"/>
        <jsp:param name="scopeId" value="${workspace.wsId}"/>
        <jsp:param name="ownerLabel" value="그룹장"/>
        <jsp:param name="adminLabel" value="관리자"/>
        <jsp:param name="memberLabel" value="멤버"/>
    </jsp:include>

    <div class="workspace-owner-leave-modal" id="ownerLeaveGuideModal" hidden
         onclick="if (event.target === this) closeOwnerLeaveGuideModal()">
        <section class="workspace-owner-leave-dialog" role="dialog" aria-modal="true"
                 aria-labelledby="ownerLeaveGuideTitle">
            <button type="button" class="workspace-owner-leave-close" aria-label="닫기"
                    onclick="closeOwnerLeaveGuideModal()">&times;</button>
            <span class="workspace-owner-leave-kicker">그룹 탈퇴 안내</span>
            <h3 id="ownerLeaveGuideTitle">그룹장은 탈퇴할 수 없습니다</h3>
            <p>그룹장 권한을 다른 멤버에게 위임한 뒤 탈퇴할 수 있습니다.</p>
            <div class="workspace-owner-leave-actions">
                <button type="button" class="workspace-owner-leave-cancel"
                        data-owner-leave-cancel onclick="closeOwnerLeaveGuideModal()">취소</button>
                <button type="button" class="workspace-owner-leave-transfer"
                        onclick="goToOwnerTransfer()">그룹장 위임</button>
            </div>
        </section>
    </div>

    <script>
    (function () {
        let message = null;
        try {
            message = sessionStorage.getItem('moyoWorkspaceSettingsSuccess');
            if (message) {
                sessionStorage.removeItem('moyoWorkspaceSettingsSuccess');
            }
        } catch (storageError) {
        }

        if (message) {
            window.setTimeout(function () {
                alert(message);
            }, 0);
        }
    })();
    </script>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
