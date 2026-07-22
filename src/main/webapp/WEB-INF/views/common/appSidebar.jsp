<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:if test="${not empty sessionScope.user}">
<aside id="moyoAppSidebar"
       class="moyo-app-sidebar"
       aria-label="공간 바로가기"
       data-current-ws-id="${not empty wsId ? wsId : param.wsId}"
       data-current-proj-id="${not empty projId ? projId : param.projId}">
    <div class="moyo-app-sidebar-layout">
        <div class="moyo-app-sidebar-scroll">
            <section class="moyo-app-sidebar-section moyo-app-sidebar-friends-section moyo-app-sidebar-friends-top">
                <div class="moyo-app-sidebar-section-heading">
                    <span class="moyo-app-sidebar-section-title">친구</span>
                    <button type="button"
                            class="moyo-app-sidebar-section-action moyo-app-sidebar-text-action"
                            data-moyo-friend-modal-open>관리</button>
                </div>

                <div id="moyoSidebarFriendPreview"
                     class="moyo-app-sidebar-friend-preview moyo-app-sidebar-friend-summary"
                     aria-label="친구 요약">
                    <div class="moyo-app-sidebar-friend-block moyo-app-sidebar-friend-updated" data-moyo-friend-section="updated">
                        <div class="moyo-app-sidebar-friend-section-label">업데이트한 친구</div>
                        <div id="moyoSidebarUpdatedFriends" class="moyo-app-sidebar-friend-avatar-strip">
                            <button type="button" class="moyo-app-sidebar-friend-chip skeleton" data-moyo-friend-modal-open>
                                <span class="moyo-app-sidebar-friend-avatar">👥</span>
                                <span>불러오는 중</span>
                            </button>
                        </div>
                    </div>

                    <div class="moyo-app-sidebar-friend-block moyo-app-sidebar-friend-birthday" data-moyo-friend-section="birthday" hidden>
                        <div class="moyo-app-sidebar-friend-section-label">생일인 친구</div>
                        <div id="moyoSidebarBirthdayFriends" class="moyo-app-sidebar-friend-mini-list"></div>
                    </div>

                    <div class="moyo-app-sidebar-friend-block moyo-app-sidebar-friend-list-block" data-moyo-friend-section="list">
                        <div class="moyo-app-sidebar-friend-section-label">친구 목록</div>
                        <div id="moyoSidebarFriendList" class="moyo-app-sidebar-friend-mini-list">
                            <button type="button"
                                    class="moyo-app-sidebar-friend-item skeleton"
                                    data-moyo-friend-modal-open>
                                <span class="moyo-app-sidebar-friend-avatar">👥</span>
                                <span class="moyo-app-sidebar-friend-text">
                                    <strong>친구를 불러오는 중</strong>
                                    <em>잠시만 기다려 주세요</em>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section class="moyo-app-sidebar-section moyo-app-sidebar-projects-section">
                <div class="moyo-app-sidebar-section-heading">
                    <span class="moyo-app-sidebar-section-title">프로젝트</span>
                </div>

                <nav class="moyo-app-sidebar-project-nav" aria-label="프로젝트 바로가기">
                    <a href="/project/manage"
                       class="moyo-app-sidebar-main-link moyo-app-sidebar-project-entry personal"
                       data-app-path="/project/manage">
                        <span class="moyo-app-sidebar-link-icon moyo-app-sidebar-project-icon personal" aria-hidden="true"></span>
                        <span>개인 프로젝트</span>
                    </a>
                </nav>
            </section>

            <section class="moyo-app-sidebar-section moyo-app-sidebar-groups-section">
                <div class="moyo-app-sidebar-section-heading">
                    <span class="moyo-app-sidebar-section-title">그룹</span>
                    <a href="/workspace/list"
                       class="moyo-app-sidebar-section-action moyo-app-sidebar-text-action"
                       data-app-path="/workspace/list">관리</a>
                </div>

                <c:choose>
                    <c:when test="${not empty userWorkspaces}">
                        <c:forEach var="workspace" items="${userWorkspaces}">
                            <div class="moyo-app-workspace" data-ws-id="${workspace.wsId}">
                                <button type="button"
                                        class="moyo-app-workspace-toggle"
                                        aria-expanded="false">
                                    <span class="moyo-app-workspace-avatar">
                                        <c:choose>
                                            <c:when test="${not empty workspace.wsImagePath}">
                                                <img src="<c:out value='${workspace.wsImagePath}'/>"
                                                     alt="<c:out value='${workspace.wsName}'/>"
                                                     onerror="this.hidden=true; this.nextElementSibling.classList.add('show');">
                                                <span class="moyo-app-workspace-avatar-fallback"><c:choose><c:when test="${not empty workspace.wsName}"><c:out value="${fn:toUpperCase(fn:substring(fn:trim(workspace.wsName), 0, 1))}"/></c:when><c:otherwise>G</c:otherwise></c:choose></span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="moyo-app-workspace-avatar-fallback show"><c:choose><c:when test="${not empty workspace.wsName}"><c:out value="${fn:toUpperCase(fn:substring(fn:trim(workspace.wsName), 0, 1))}"/></c:when><c:otherwise>G</c:otherwise></c:choose></span>
                                            </c:otherwise>
                                        </c:choose>
                                    </span>
                                    <span class="moyo-app-workspace-name"><c:out value="${workspace.wsName}"/></span>
                                    <span class="moyo-app-workspace-chevron">⌄</span>
                                </button>

                                <div class="moyo-app-workspace-menu">
                                    <a href="/workspace/main?wsId=${workspace.wsId}"
                                       class="moyo-app-workspace-home"
                                       data-ws-id="${workspace.wsId}">
                                        <span class="moyo-app-project-dot home"></span>
                                        <span>그룹 홈</span>
                                    </a>

                                    <c:set var="hasGroupProject" value="false" />
                                    <c:forEach var="project" items="${sidebarProjects[workspace.wsId]}">
                                        <c:if test="${project.projScope ne 'PERSONAL'}">
                                            <c:set var="hasGroupProject" value="true" />
                                            <a href="/project/main?wsId=${workspace.wsId}&projId=${project.projId}"
                                               class="moyo-app-project-link"
                                               data-proj-id="${project.projId}"
                                               data-ws-id="${workspace.wsId}">
                                                <span class="moyo-app-project-dot"></span>
                                                <span class="moyo-app-project-name">${project.projName}</span>
                                            </a>
                                        </c:if>
                                    </c:forEach>
                                </div>
                            </div>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <div class="moyo-app-sidebar-empty workspace-empty">
                            참여 중인 그룹이 없습니다.
                        </div>
                    </c:otherwise>
                </c:choose>
            </section>
        </div>
    </div>
</aside>
<div id="moyoAppSidebarBackdrop" class="moyo-app-sidebar-backdrop"></div>
</c:if>

<div id="moyoFriendModal" class="moyo-friend-modal" aria-hidden="true">
    <div class="moyo-friend-modal-dim" data-moyo-friend-modal-close></div>
    <section class="moyo-friend-modal-panel" role="dialog" aria-modal="true" aria-labelledby="moyoFriendModalTitle" tabindex="-1">
        <header class="moyo-friend-modal-head">
            <div>
                <span class="moyo-friend-modal-eyebrow">MOYO FRIEND</span>
                <h2 id="moyoFriendModalTitle">친구 관리</h2>
                <p>친구 목록, 친구 추가, 요청 관리를 한 곳에서 확인합니다.</p>
            </div>
            <button type="button" class="moyo-friend-modal-close" aria-label="친구 관리 닫기" data-moyo-friend-modal-close>×</button>
        </header>

        <div class="moyo-friend-modal-summary" aria-label="친구 현황">
            <span>친구 <strong id="moyoFriendModalTotalCount">0</strong></span>
            <span>받은 요청 <strong id="moyoFriendModalPendingCount">0</strong></span>
        </div>

        <nav class="moyo-friend-modal-tabs" role="tablist" aria-label="친구 관리 탭">
            <button type="button" class="active" data-moyo-friend-tab="list" role="tab" aria-selected="true">친구 목록</button>
            <button type="button" data-moyo-friend-tab="add" role="tab" aria-selected="false">친구 추가</button>
            <button type="button" data-moyo-friend-tab="requests" role="tab" aria-selected="false">요청</button>
        </nav>

        <div class="moyo-friend-modal-body">
            <div class="moyo-friend-panel active" data-moyo-friend-panel="list" role="tabpanel">
                <div class="moyo-friend-panel-head">
                    <strong>친구 목록</strong>
                    <button type="button" class="moyo-friend-ghost-btn" data-moyo-friend-refresh>새로고침</button>
                </div>
                <div id="moyoFriendModalFriendList" class="moyo-friend-modal-list"></div>
            </div>

            <div class="moyo-friend-panel" data-moyo-friend-panel="add" role="tabpanel">
                <div class="moyo-friend-search-row">
                    <input type="text" id="moyoFriendModalSearchInput" placeholder="이름 또는 이메일로 검색">
                    <button type="button" id="moyoFriendModalSearchButton">검색</button>
                </div>
                <div id="moyoFriendModalSearchResult" class="moyo-friend-modal-list"></div>
            </div>

            <div class="moyo-friend-panel" data-moyo-friend-panel="requests" role="tabpanel">
                <div class="moyo-friend-request-grid">
                    <article>
                        <div class="moyo-friend-panel-head"><strong>받은 요청</strong></div>
                        <div id="moyoFriendModalReceivedList" class="moyo-friend-modal-list compact"></div>
                    </article>
                    <article>
                        <div class="moyo-friend-panel-head"><strong>보낸 요청</strong></div>
                        <div id="moyoFriendModalSentList" class="moyo-friend-modal-list compact"></div>
                    </article>
                </div>
            </div>
        </div>
    </section>
</div>

<%@ include file="/WEB-INF/views/common/chat.jsp" %>
