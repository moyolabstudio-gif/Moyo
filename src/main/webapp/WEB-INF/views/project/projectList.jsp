<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><c:choose><c:when test="${personalMode}">개인 프로젝트</c:when><c:otherwise><c:out value="${workspace.wsName}"/> 프로젝트</c:otherwise></c:choose> - MOYO</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectList.css?v=project-list-final-density-v16">
    <script defer src="${pageContext.request.contextPath}/js/projectList.js?v=project-list-final-density-v16"></script>
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

    <main class="project-list-container">
        <section class="project-list-hero">
            <div>
                <span class="project-list-type"><c:choose><c:when test="${personalMode}">나만의 프로젝트</c:when><c:otherwise><c:out value="${workspace.wsName}"/></c:otherwise></c:choose></span>
                <h1><c:choose><c:when test="${personalMode}">개인 프로젝트</c:when><c:otherwise>프로젝트 목록</c:otherwise></c:choose></h1>
                <p><c:choose><c:when test="${personalMode}">혼자 진행하는 프로젝트의 일정과 업무를 관리합니다.</c:when><c:otherwise>진행 중인 프로젝트부터 예정·완료 기록까지 한곳에서 관리합니다.</c:otherwise></c:choose></p>
            </div>
            <div class="project-list-hero-actions">
                <c:if test="${not personalMode}"><a class="project-list-back" href="${pageContext.request.contextPath}/workspace/main?wsId=${wsId}">그룹 홈</a></c:if>
                <a class="project-list-create" href="${pageContext.request.contextPath}/project/create${personalMode ? '' : '?wsId='}${personalMode ? '' : wsId}"><c:choose><c:when test="${personalMode}">+ 새 프로젝트 만들기</c:when><c:otherwise>+ 프로젝트 생성</c:otherwise></c:choose></a>
            </div>
        </section>

        <section class="project-list-toolbar-card">
            <div class="project-list-filter-group">
                <div class="project-list-tabs" role="tablist" aria-label="프로젝트 상태 필터">
                    <button type="button" class="project-list-tab is-active" data-status="ALL">전체 <span>${projects.size()}</span></button>
                    <button type="button" class="project-list-tab" data-status="IN_PROGRESS">진행 중 <span>${progressCount}</span></button>
                    <button type="button" class="project-list-tab" data-status="SCHEDULED">예정 <span>${scheduledCount}</span></button>
                    <button type="button" class="project-list-tab" data-status="COMPLETED">완료 <span>${completedCount}</span></button>
                </div>
                <span class="project-list-filter-divider" aria-hidden="true"></span>
                <label class="project-list-type-filter">
                    <span class="sr-only">유형</span>
                    <select id="projectListType" aria-label="프로젝트 유형 필터">
                        <option value="ALL">전체 유형</option>
                        <option value="WORK">업무</option>
                        <option value="TRAVEL">여행</option>
                        <option value="MEETING">모임 · 행사</option>
                        <option value="STUDY">학습 · 연구</option>
                        <option value="LIFE">생활 · 가정</option>
                        <option value="HOBBY">취미 · 창작</option>
                        <option value="ETC">기타</option>
                    </select>
                </label>
            </div>
            <div class="project-list-tools">
                <label class="project-list-search">
                    <span class="project-list-search-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/>
                            <path d="M16 16L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                    </span>
                    <input id="projectListSearch" type="search" placeholder="${personalMode ? '프로젝트명 또는 설명 검색' : '프로젝트명 또는 멤버 검색'}" autocomplete="off">
                </label>
                <select id="projectListSort" aria-label="프로젝트 정렬">
                    <option value="DEFAULT">기본 정렬</option>
                    <option value="NEWEST">최근 생성순</option>
                    <option value="START_ASC">시작일 빠른순</option>
                    <option value="END_DESC">종료일 최근순</option>
                    <option value="NAME_ASC">이름순</option>
                </select>
            </div>
        </section>

        <section class="project-list-card">
            <div id="projectListGroups" class="project-list-groups">
                <section class="project-status-section is-progress" data-section-status="IN_PROGRESS">
                    <div class="project-status-section-head">
                        <h3>진행 중 <span>${progressCount}</span></h3>
                        <p>현재 진행 중인 프로젝트입니다.</p>
                    </div>
                    <div class="project-list-grid" data-project-grid="IN_PROGRESS">
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
                                         data-end="${project.END_DATE}">
                                    <a class="project-list-link" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}${personalMode ? '' : '&wsId='}${personalMode ? '' : wsId}">
                                        <div class="project-card-top">
                                            <span class="project-status-text is-progress">진행 중</span>
                                            <span class="project-card-type">
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
                                        </div>
                                        <h3>${project.PROJ_NAME}</h3>
                                        <p class="project-description">${empty project.PROJ_DESC ? '등록된 프로젝트 설명이 없습니다.' : project.PROJ_DESC}</p>
                                        <dl class="project-meta">
                                            <div><dt>기간</dt><dd>${empty project.START_DATE ? '미설정' : project.START_DATE} ~ ${empty project.END_DATE ? '미정' : project.END_DATE}</dd></div>
                                            <c:choose>
                                                <c:when test="${personalMode}">
                                                    <div><dt>업무</dt><dd><c:choose><c:when test="${project.TASK_TOTAL gt 0}">${project.TASK_DONE} / ${project.TASK_TOTAL} 완료</c:when><c:otherwise>등록된 업무 없음</c:otherwise></c:choose></dd></div>
                                                </c:when>
                                                <c:otherwise>
                                                    <div><dt>팀장</dt><dd>${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</dd></div>
                                                    <div><dt>인원</dt><dd>${project.MEMBER_COUNT}명</dd></div>
                                                    <div class="project-member-row"><dt>멤버</dt><dd class="project-member-names">${empty project.MEMBER_NAMES ? '-' : project.MEMBER_NAMES}</dd></div>
                                                </c:otherwise>
                                            </c:choose>
                                        </dl>
                                        <span class="project-enter">프로젝트 열기 →</span>
                                    </a>
                                </article>
                            </c:if>
                        </c:forEach>
                    </div>
                    <div class="project-section-empty" data-empty-for="IN_PROGRESS" hidden>진행 중인 프로젝트가 없습니다.</div>
                </section>

                <section class="project-status-section is-scheduled" data-section-status="SCHEDULED">
                    <div class="project-status-section-head">
                        <h3>예정 <span>${scheduledCount}</span></h3>
                        <p>시작 전인 프로젝트입니다.</p>
                    </div>
                    <div class="project-list-grid" data-project-grid="SCHEDULED">
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
                                         data-end="${project.END_DATE}">
                                    <a class="project-list-link" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}${personalMode ? '' : '&wsId='}${personalMode ? '' : wsId}">
                                        <div class="project-card-top">
                                            <span class="project-status-text is-scheduled">예정</span>
                                            <span class="project-card-type">
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
                                        </div>
                                        <h3>${project.PROJ_NAME}</h3>
                                        <p class="project-description">${empty project.PROJ_DESC ? '등록된 프로젝트 설명이 없습니다.' : project.PROJ_DESC}</p>
                                        <dl class="project-meta">
                                            <div><dt>기간</dt><dd>${empty project.START_DATE ? '미설정' : project.START_DATE} ~ ${empty project.END_DATE ? '미정' : project.END_DATE}</dd></div>
                                            <c:choose>
                                                <c:when test="${personalMode}">
                                                    <div><dt>업무</dt><dd><c:choose><c:when test="${project.TASK_TOTAL gt 0}">${project.TASK_DONE} / ${project.TASK_TOTAL} 완료</c:when><c:otherwise>등록된 업무 없음</c:otherwise></c:choose></dd></div>
                                                </c:when>
                                                <c:otherwise>
                                                    <div><dt>팀장</dt><dd>${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</dd></div>
                                                    <div><dt>인원</dt><dd>${project.MEMBER_COUNT}명</dd></div>
                                                    <div class="project-member-row"><dt>멤버</dt><dd class="project-member-names">${empty project.MEMBER_NAMES ? '-' : project.MEMBER_NAMES}</dd></div>
                                                </c:otherwise>
                                            </c:choose>
                                        </dl>
                                        <span class="project-enter">프로젝트 열기 →</span>
                                    </a>
                                </article>
                            </c:if>
                        </c:forEach>
                    </div>
                    <div class="project-section-empty" data-empty-for="SCHEDULED" hidden>예정된 프로젝트가 없습니다.</div>
                </section>

                <section class="project-status-section is-completed" data-section-status="COMPLETED">
                    <div class="project-status-section-head">
                        <h3>완료 <span>${completedCount}</span></h3>
                        <p>종료된 프로젝트 기록입니다.</p>
                    </div>
                    <div class="project-list-grid" data-project-grid="COMPLETED">
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
                                         data-end="${project.END_DATE}">
                                    <a class="project-list-link" href="${pageContext.request.contextPath}/project/main?projId=${project.PROJ_ID}${personalMode ? '' : '&wsId='}${personalMode ? '' : wsId}">
                                        <div class="project-card-top">
                                            <span class="project-status-text is-completed">완료</span>
                                            <span class="project-card-type">
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
                                        </div>
                                        <h3>${project.PROJ_NAME}</h3>
                                        <p class="project-description">${empty project.PROJ_DESC ? '등록된 프로젝트 설명이 없습니다.' : project.PROJ_DESC}</p>
                                        <dl class="project-meta">
                                            <div><dt>기간</dt><dd>${empty project.START_DATE ? '미설정' : project.START_DATE} ~ ${empty project.END_DATE ? '미정' : project.END_DATE}</dd></div>
                                            <c:choose>
                                                <c:when test="${personalMode}">
                                                    <div><dt>업무</dt><dd><c:choose><c:when test="${project.TASK_TOTAL gt 0}">${project.TASK_DONE} / ${project.TASK_TOTAL} 완료</c:when><c:otherwise>등록된 업무 없음</c:otherwise></c:choose></dd></div>
                                                </c:when>
                                                <c:otherwise>
                                                    <div><dt>팀장</dt><dd>${empty project.LEADER_NAME ? '-' : project.LEADER_NAME}</dd></div>
                                                    <div><dt>인원</dt><dd>${project.MEMBER_COUNT}명</dd></div>
                                                    <div class="project-member-row"><dt>멤버</dt><dd class="project-member-names">${empty project.MEMBER_NAMES ? '-' : project.MEMBER_NAMES}</dd></div>
                                                </c:otherwise>
                                            </c:choose>
                                        </dl>
                                        <span class="project-enter">프로젝트 열기 →</span>
                                    </a>
                                </article>
                            </c:if>
                        </c:forEach>
                    </div>
                    <div class="project-section-empty" data-empty-for="COMPLETED" hidden>완료된 프로젝트가 없습니다.</div>
                </section>
            </div>

            <div id="projectListEmpty" class="project-empty-state" hidden>
                <span>🧭</span>
                <strong>조건에 맞는 프로젝트가 없습니다.</strong>
                <p>다른 상태를 선택하거나 검색어를 변경해보세요.</p>
            </div>
        </section>
    </main>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
