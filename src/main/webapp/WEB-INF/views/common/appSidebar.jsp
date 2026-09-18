<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:if test="${not empty sessionScope.user}">
<aside id="moyoAppSidebar"
       class="moyo-app-sidebar"
       aria-label="공간 바로가기"
       data-current-ws-id="${not empty wsId ? wsId : param.wsId}"
       data-current-proj-id="${not empty projId ? projId : param.projId}"
       data-context-path="${pageContext.request.contextPath}">
    <div class="moyo-app-sidebar-layout">
        <div class="moyo-app-sidebar-scroll">
            <section class="moyo-app-sidebar-section moyo-app-sidebar-projects-section">
                <div class="moyo-app-sidebar-section-heading">
                    <a href="${pageContext.request.contextPath}/project/manage"
                       class="moyo-app-sidebar-section-title moyo-app-sidebar-section-title-link"
                       data-app-path="/project/manage">개인 프로젝트</a>
                    <a href="${pageContext.request.contextPath}/project/create?scope=PERSONAL"
                       class="moyo-app-sidebar-add-action"
                       aria-label="개인 프로젝트 추가"
                       title="개인 프로젝트 추가">+</a>
                </div>

                <nav class="moyo-app-sidebar-personal-project-list" aria-label="개인 프로젝트 바로가기">
                    <c:choose>
                        <c:when test="${not empty sidebarPersonalProjects}">
                            <c:forEach var="project" items="${sidebarPersonalProjects}">
                                <a href="${pageContext.request.contextPath}/project/main?projId=${project.projId}"
                                   class="moyo-app-project-link moyo-app-personal-project-link"
                                   data-proj-id="${project.projId}">
                                    <span class="moyo-app-project-dot personal"></span>
                                    <span class="moyo-app-project-name"><c:out value="${project.projName}"/></span>
                                </a>
                            </c:forEach>
                        </c:when>
                        <c:otherwise>
                            <div class="moyo-app-sidebar-empty nested">진행 중이거나 예정된 프로젝트가 없습니다.</div>
                        </c:otherwise>
                    </c:choose>
                </nav>
            </section>

            <section class="moyo-app-sidebar-section moyo-app-sidebar-friends-section">
                <div class="moyo-app-sidebar-section-heading">
                    <a href="${pageContext.request.contextPath}/friends"
                       class="moyo-app-sidebar-section-title moyo-app-sidebar-section-title-link">업데이트한 친구</a>
                    <button type="button"
                            class="moyo-app-sidebar-add-action"
                            data-moyo-friend-add-open
                            aria-label="친구 추가"
                            title="친구 추가">+</button>
                </div>

                <div id="moyoSidebarFriendPreview"
                     class="moyo-app-sidebar-friend-preview"
                     aria-label="업데이트한 친구">
                    <div id="moyoSidebarUpdatedFriends" class="moyo-app-sidebar-friend-avatar-strip">
                        <button type="button" class="moyo-app-sidebar-friend-chip skeleton">
                            <span class="moyo-app-sidebar-friend-avatar">👥</span>
                            <span>불러오는 중</span>
                        </button>
                    </div>
                </div>
            </section>

            <section class="moyo-app-sidebar-section moyo-app-sidebar-groups-section">
                <div class="moyo-app-sidebar-section-heading">
                    <a href="${pageContext.request.contextPath}/workspace/list"
                       class="moyo-app-sidebar-section-title moyo-app-sidebar-section-title-link"
                       data-app-path="/workspace/list">그룹</a>
                    <a href="${pageContext.request.contextPath}/workspace/create"
                       class="moyo-app-sidebar-add-action"
                       aria-label="그룹 추가"
                       title="그룹 추가">+</a>
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
                                    <a href="${pageContext.request.contextPath}/workspace/main?wsId=${workspace.wsId}"
                                       class="moyo-app-workspace-home"
                                       data-ws-id="${workspace.wsId}">
                                        <span class="moyo-app-project-dot home"></span>
                                        <span>그룹 홈</span>
                                    </a>

                                    <c:set var="hasGroupProject" value="false" />
                                    <c:forEach var="project" items="${sidebarProjects[workspace.wsId]}">
                                        <c:if test="${project.projScope ne 'PERSONAL'}">
                                            <c:set var="hasGroupProject" value="true" />
                                            <a href="${pageContext.request.contextPath}/project/main?wsId=${workspace.wsId}&projId=${project.projId}"
                                               class="moyo-app-project-link"
                                               data-proj-id="${project.projId}"
                                               data-ws-id="${workspace.wsId}">
                                                <span class="moyo-app-project-dot"></span>
                                                <span class="moyo-app-project-name"><c:out value="${project.projName}"/></span>
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

        <div class="moyo-app-sidebar-bottom" aria-label="서비스 메뉴">
            <nav class="moyo-app-sidebar-bottom-links">
                <a href="${pageContext.request.contextPath}/common/noticeList" class="moyo-app-sidebar-bottom-link" data-app-path="/common/noticeList" aria-label="공지사항" title="공지사항">공지</a>
                <a href="${pageContext.request.contextPath}/common/inquiry" class="moyo-app-sidebar-bottom-link" data-app-path="/common/inquiry" aria-label="문의하기" title="문의하기">문의</a>
                <a href="${pageContext.request.contextPath}/common/privacyPolicy" class="moyo-app-sidebar-bottom-link" data-app-path="/common/privacyPolicy" aria-label="개인정보처리방침" title="개인정보처리방침">개인정보</a>
                <c:if test="${fn:toUpperCase(sessionScope.user.userRole) eq 'ADMIN'}">
                    <a href="${pageContext.request.contextPath}/admin" class="moyo-app-sidebar-bottom-link moyo-app-sidebar-admin-link" data-app-path="/admin" aria-label="관리자 센터" title="관리자 센터">관리자</a>
                </c:if>
            </nav>
            <div class="moyo-app-sidebar-bottom-copy">© MOYO</div>
        </div>
    </div>
</aside>
<div id="moyoAppSidebarBackdrop" class="moyo-app-sidebar-backdrop"></div>
</c:if>

<%-- 채팅 기능 임시 비활성화: 기능 안정화 후 보안 정리와 함께 재개 --%>
