<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<body>
<c:if test="${not empty sessionScope.user}">
<aside id="moyoAppSidebar"
       class="moyo-app-sidebar"
       aria-label="공간 바로가기"
       data-current-ws-id="${not empty wsId ? wsId : param.wsId}"
       data-current-proj-id="${not empty projId ? projId : param.projId}">
    <div class="moyo-app-sidebar-scroll">
        <section class="moyo-app-sidebar-section">
            <div class="moyo-app-sidebar-section-heading">
                <span class="moyo-app-sidebar-section-title">개인</span>
            </div>

            <a href="/calendar"
               class="moyo-app-sidebar-main-link"
               data-app-path="/calendar">
                <span class="moyo-app-sidebar-link-icon">📅</span>
                <span class="moyo-app-sidebar-link-text">내 캘린더</span>
            </a>

            <div class="moyo-app-personal-projects">
                <c:set var="hasPersonalProject" value="false" />
                <c:forEach var="workspace" items="${userWorkspaces}">
                    <c:forEach var="project" items="${sidebarProjects[workspace.wsId]}">
                        <c:if test="${project.projScope eq 'PERSONAL'}">
                            <c:set var="hasPersonalProject" value="true" />
                            <a href="/project/main?wsId=${workspace.wsId}&projId=${project.projId}"
                               class="moyo-app-project-link"
                               data-proj-id="${project.projId}"
                               data-ws-id="${workspace.wsId}">
                                <span class="moyo-app-project-dot personal"></span>
                                <span class="moyo-app-project-name">${project.projName}</span>
                            </a>
                        </c:if>
                    </c:forEach>
                </c:forEach>

                <c:if test="${not hasPersonalProject}">
                    <div class="moyo-app-sidebar-empty">개인 프로젝트가 없습니다.</div>
                </c:if>
            </div>
        </section>

        <section class="moyo-app-sidebar-section">
            <div class="moyo-app-sidebar-section-heading">
                <span class="moyo-app-sidebar-section-title">그룹</span>
                <a href="/workspace/create" class="moyo-app-sidebar-section-action">+ 만들기</a>
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
                                            <img src="${workspace.wsImagePath}"
                                                 alt="${workspace.wsName}"
                                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                            <span class="moyo-app-workspace-avatar-fallback">${workspace.wsName.substring(0,1)}</span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="moyo-app-workspace-avatar-fallback show">${workspace.wsName.substring(0,1)}</span>
                                        </c:otherwise>
                                    </c:choose>
                                </span>
                                <span class="moyo-app-workspace-name">${workspace.wsName}</span>
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

                                <c:if test="${not hasGroupProject}">
                                    <div class="moyo-app-sidebar-empty nested">프로젝트가 없습니다.</div>
                                </c:if>

                                <a href="/project/create?wsId=${workspace.wsId}"
                                   class="moyo-app-create-project">
                                    <span>＋</span>
                                    <span>프로젝트 만들기</span>
                                </a>
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
    <div class="moyo-app-sidebar-bottom">
        <a href="/workspace/create" class="moyo-app-sidebar-bottom-link">＋ 그룹 만들기</a>
        <a href="/workspace/invitations" class="moyo-app-sidebar-bottom-link">✉ 초대함</a>
    </div>
</aside>
<div id="moyoAppSidebarBackdrop" class="moyo-app-sidebar-backdrop"></div>
</c:if>
</body>
    
    <%@ include file="/WEB-INF/views/common/chat.jsp" %>
