<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>노트</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="/css/moyoUi.css?v=moyo-ui-scope-20260617">
    <link rel="stylesheet" href="/css/noteList.css?v=note-list-header-bg-cut-v1">
<link rel="stylesheet" href="/css/commonFolderModal.css?v=common-folder-modal-final-v15">
</head>
<body class="note-list-page">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<c:set var="effectiveWsId" value="${wsId}" />
<c:if test="${empty effectiveWsId and not empty param.wsId}"><c:set var="effectiveWsId" value="${param.wsId}" /></c:if>
<c:set var="effectiveProjId" value="${projId}" />
<c:if test="${empty effectiveProjId and not empty param.projId}"><c:set var="effectiveProjId" value="${param.projId}" /></c:if>
<c:set var="effectiveFriendUserId" value="${friendUserId}" />
<c:if test="${empty effectiveFriendUserId and not empty param.friendUserId}"><c:set var="effectiveFriendUserId" value="${param.friendUserId}" /></c:if>

<c:set var="currentScopeQuery" value="scope=${scope}" />
<c:if test="${not empty effectiveWsId}"><c:set var="currentScopeQuery" value="${currentScopeQuery}&amp;wsId=${effectiveWsId}" /></c:if>
<c:if test="${not empty effectiveProjId}"><c:set var="currentScopeQuery" value="${currentScopeQuery}&amp;projId=${effectiveProjId}" /></c:if>
<c:if test="${scope eq 'FRIEND' and not empty effectiveFriendUserId}"><c:set var="currentScopeQuery" value="${currentScopeQuery}&amp;friendUserId=${effectiveFriendUserId}" /></c:if>

<c:set var="writeScope" value="${scope}" />
<c:if test="${scope eq 'ALL' or scope eq 'FRIEND' or scope eq 'TRASH'}"><c:set var="writeScope" value="PRIVATE" /></c:if>
<%-- 그룹/프로젝트가 특정되지 않은 탭 상태에서는 비활성화하지 않고 개인 노트 작성으로 보냅니다. --%>
<c:if test="${scope eq 'WS' and empty effectiveWsId}"><c:set var="writeScope" value="PRIVATE" /></c:if>
<c:if test="${scope eq 'PROJ' and empty effectiveProjId}"><c:set var="writeScope" value="PRIVATE" /></c:if>
<c:set var="writeQuery" value="scope=${writeScope}" />
<c:if test="${writeScope eq 'WS' and not empty effectiveWsId}"><c:set var="writeQuery" value="${writeQuery}&amp;wsId=${effectiveWsId}" /></c:if>
<c:if test="${writeScope eq 'PROJ' and not empty effectiveWsId}"><c:set var="writeQuery" value="${writeQuery}&amp;wsId=${effectiveWsId}" /></c:if>
<c:if test="${writeScope eq 'PROJ' and not empty effectiveProjId}"><c:set var="writeQuery" value="${writeQuery}&amp;projId=${effectiveProjId}" /></c:if>
<c:if test="${not empty selectedFolderId}"><c:set var="writeQuery" value="${writeQuery}&amp;folderId=${selectedFolderId}" /></c:if>

<c:set var="canWriteInCurrentContext" value="true" />

<c:set var="workspaceTabUrl" value="/note/list?scope=WS" />
<c:if test="${not empty effectiveWsId}"><c:set var="workspaceTabUrl" value="${workspaceTabUrl}&amp;wsId=${effectiveWsId}" /></c:if>
<c:set var="projectTabUrl" value="/note/list?scope=PROJ" />
<c:if test="${not empty effectiveWsId}"><c:set var="projectTabUrl" value="${projectTabUrl}&amp;wsId=${effectiveWsId}" /></c:if>
<c:if test="${not empty effectiveProjId}"><c:set var="projectTabUrl" value="${projectTabUrl}&amp;projId=${effectiveProjId}" /></c:if>

<main class="nl-shell" data-scope="${scope}" data-ws-id="${effectiveWsId}" data-proj-id="${effectiveProjId}" data-friend-user-id="${effectiveFriendUserId}">
    <section class="nl-page-header">
        <div class="nl-hero">
        <div>
            <h1>노트</h1>
            <p>필요한 기록을 빠르게 찾고 이어서 작성하세요.</p>
        </div>
        <c:choose>
            <c:when test="${canWriteInCurrentContext}">
                <a class="nl-create-button" href="/note/write?${writeQuery}">
                    <span aria-hidden="true">＋</span> 새 노트
                </a>
            </c:when>
            <c:otherwise>
                <button type="button" class="nl-create-button is-disabled" disabled title="먼저 그룹 또는 프로젝트를 선택해 주세요.">
                    <span aria-hidden="true">＋</span> 새 노트
                </button>
            </c:otherwise>
        </c:choose>
        </div>

        <div class="nl-toolbar" aria-label="노트 목록 도구">
        <nav class="nl-scope-tabs" aria-label="노트 범위">
            <a class="nl-scope-tab ${scope eq 'ALL' ? 'is-active' : ''}" href="/note/list?scope=ALL">
                전체
            </a>
            <a class="nl-scope-tab ${scope eq 'PRIVATE' ? 'is-active' : ''}" href="/note/list?scope=PRIVATE">
                개인
            </a>
            <a class="nl-scope-tab nl-friend-tab ${scope eq 'FRIEND' ? 'is-active' : ''}" href="/note/list?scope=FRIEND">
                친구
            </a>
            <a class="nl-scope-tab ${scope eq 'WS' ? 'is-active' : ''}" href="${workspaceTabUrl}">
                그룹
            </a>
            <a class="nl-scope-tab ${scope eq 'PROJ' ? 'is-active' : ''}" href="${projectTabUrl}">
                프로젝트
            </a>
        </nav>

        <c:if test="${scope ne 'TRASH'}">
            <c:set var="importantFilterQuery" value="scope=${scope}" />
            <c:if test="${not empty effectiveWsId}"><c:set var="importantFilterQuery" value="${importantFilterQuery}&amp;wsId=${effectiveWsId}" /></c:if>
            <c:if test="${not empty effectiveProjId}"><c:set var="importantFilterQuery" value="${importantFilterQuery}&amp;projId=${effectiveProjId}" /></c:if>
            <c:if test="${scope eq 'FRIEND' and not empty effectiveFriendUserId}"><c:set var="importantFilterQuery" value="${importantFilterQuery}&amp;friendUserId=${effectiveFriendUserId}" /></c:if>
            <c:if test="${not empty selectedFolderId}"><c:set var="importantFilterQuery" value="${importantFilterQuery}&amp;folderId=${selectedFolderId}" /></c:if>
            <c:if test="${not empty keyword}"><c:set var="importantFilterQuery" value="${importantFilterQuery}&amp;keyword=${keyword}" /></c:if>
            <c:if test="${not importantOnly}"><c:set var="importantFilterQuery" value="${importantFilterQuery}&amp;importantOnly=true" /></c:if>
            <a class="nl-important-filter ${importantOnly ? 'is-active' : ''}"
               href="/note/list?${importantFilterQuery}" role="checkbox" aria-checked="${importantOnly}"
               aria-label="중요 노트만 보기" title="중요 노트만 보기">
                <i class="fa-${importantOnly ? 'solid' : 'regular'} fa-star" aria-hidden="true"></i>
            </a>
        </c:if>

        <a class="nl-trash-button ${scope eq 'TRASH' ? 'is-active' : ''}" href="/note/list?scope=TRASH" aria-label="노트 휴지통" title="휴지통">
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
        </a>

        <form class="nl-search" method="get" action="/note/list">
            <input type="hidden" name="scope" value="${scope}">
            <c:if test="${not empty effectiveWsId}"><input type="hidden" name="wsId" value="${effectiveWsId}"></c:if>
            <c:if test="${not empty effectiveProjId}"><input type="hidden" name="projId" value="${effectiveProjId}"></c:if>
            <c:if test="${scope eq 'FRIEND' and not empty effectiveFriendUserId}"><input type="hidden" name="friendUserId" value="${effectiveFriendUserId}"></c:if>
            <c:if test="${not empty selectedFolderId}"><input type="hidden" name="folderId" value="${selectedFolderId}"></c:if>
            <c:if test="${importantOnly}"><input type="hidden" name="importantOnly" value="true"></c:if>
            <span class="nl-search-icon" aria-hidden="true">⌕</span>
            <input type="search" name="keyword" value="${keyword}" placeholder="노트 검색" aria-label="노트 검색">
            <button type="submit" class="sr-only">검색</button>
        </form>

        </div>
    </section>

    <c:if test="${scope eq 'FRIEND'}">
        <div class="nl-space-picker nl-space-picker-friend">
            <div class="nl-space-picker-head">
                <div class="nl-space-picker-title">
                    <strong>친구</strong>
                    <span>공유받은 노트를 친구별로 먼저 확인합니다.</span>
                </div>
            </div>
            <div class="nl-horizontal-scroller nl-friend-scroller" data-horizontal-scroller>
                <button type="button" class="nl-scroll-button is-prev" data-scroll-prev aria-label="이전 친구">
                    <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <div class="nl-scroll-viewport" data-scroll-viewport>
                    <div class="nl-space-options nl-friend-options">
                        <c:if test="${not empty friendList}">
                            <a href="/note/list?scope=FRIEND" class="nl-space-option nl-friend-option nl-space-option-all ${empty effectiveFriendUserId ? 'is-selected' : ''}">
                                <span class="nl-space-avatar nl-friend-avatar nl-friend-avatar-all" aria-hidden="true"><i class="fa-solid fa-users"></i></span>
                                <span class="nl-friend-name-wrap">
                                    <span class="nl-space-name">전체 친구</span>
                                    <small>공유받은 전체 노트</small>
                                </span>
                            </a>
                        </c:if>
                        <c:forEach var="friend" items="${friendList}">
                            <a href="/note/list?scope=FRIEND&amp;friendUserId=${friend.userId}" class="nl-space-option nl-friend-option ${effectiveFriendUserId eq friend.userId ? 'is-selected' : ''}">
                                <span class="nl-space-avatar nl-friend-avatar">
                                    <c:choose>
                                        <c:when test="${not empty friend.profileImagePath}">
                                            <img src="${friend.profileImagePath}" alt="" loading="lazy" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
                                            <span class="nl-space-avatar-fallback" hidden aria-hidden="true"><c:out value="${fn:substring(friend.userName, 0, 1)}" /></span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="nl-space-avatar-fallback" aria-hidden="true"><c:out value="${fn:substring(friend.userName, 0, 1)}" /></span>
                                        </c:otherwise>
                                    </c:choose>
                                </span>
                                <span class="nl-friend-name-wrap">
                                    <span class="nl-space-name"><c:out value="${friend.userName}" /></span>
                                    <small><c:out value="${friend.noteCount}" />개의 노트</small>
                                </span>
                            </a>
                        </c:forEach>
                        <c:if test="${empty friendList}">
                            <div class="nl-picker-empty">
                                <strong>공유받은 친구 노트가 없습니다.</strong>
                                <span>친구가 공유한 개인 노트가 있으면 여기에서 확인할 수 있습니다.</span>
                            </div>
                        </c:if>
                    </div>
                </div>
                <button type="button" class="nl-scroll-button is-next" data-scroll-next aria-label="다음 친구">
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    </c:if>

    <c:if test="${scope eq 'WS'}">
        <div class="nl-space-picker nl-space-picker-ws">
            <div class="nl-space-picker-head">
                <div class="nl-space-picker-title">
                    <strong>그룹</strong>
                    <span>참여 중인 그룹에 작성되거나 공유된 노트를 확인합니다.</span>
                </div>
            </div>
            <div class="nl-horizontal-scroller nl-workspace-scroller" data-horizontal-scroller>
                <button type="button" class="nl-scroll-button is-prev" data-scroll-prev aria-label="이전 그룹">
                    <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <div class="nl-scroll-viewport" data-scroll-viewport>
                    <div class="nl-space-options" data-workspace-options>
                        <c:if test="${not empty noteWorkspaceList}">
                            <a href="/note/list?scope=WS" class="nl-space-option nl-space-option-all ${empty effectiveWsId ? 'is-selected' : ''}" data-workspace-item>
                                <span class="nl-space-avatar nl-space-avatar-all" aria-hidden="true"><i class="fa-solid fa-layer-group"></i></span>
                                <span class="nl-space-name">전체 그룹</span>
                            </a>
                        </c:if>
                        <c:forEach var="workspace" items="${noteWorkspaceList}">
                            <a href="/note/list?scope=WS&amp;wsId=${workspace.wsId}" class="nl-space-option ${effectiveWsId eq workspace.wsId ? 'is-selected' : ''}" data-workspace-item>
                                <span class="nl-space-avatar">
                                    <c:choose>
                                        <c:when test="${not empty workspace.wsImagePath}">
                                            <img src="${workspace.wsImagePath}" alt="" loading="lazy" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
                                            <span class="nl-space-avatar-fallback" hidden aria-hidden="true"><c:out value="${fn:substring(workspace.wsName, 0, 1)}" /></span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="nl-space-avatar-fallback" aria-hidden="true"><c:out value="${fn:substring(workspace.wsName, 0, 1)}" /></span>
                                        </c:otherwise>
                                    </c:choose>
                                </span>
                                <span class="nl-space-name"><c:out value="${workspace.wsName}" /></span>
                            </a>
                        </c:forEach>
                        <c:if test="${empty noteWorkspaceList}">
                            <div class="nl-picker-empty">
                                <strong>참여 중인 그룹이 없습니다.</strong>
                                <span>그룹에 참여하면 구성원과 공유된 노트를 확인할 수 있습니다.</span>
                            </div>
                        </c:if>
                    </div>
                </div>
                <button type="button" class="nl-scroll-button is-next" data-scroll-next aria-label="다음 그룹">
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    </c:if>

    <c:if test="${scope eq 'PROJ'}">
        <div class="nl-space-picker nl-space-picker-ws nl-project-group-picker">
            <div class="nl-space-picker-head">
                <div class="nl-space-picker-title">
                    <strong>그룹</strong>
                    <span>프로젝트를 확인할 그룹을 선택하세요.</span>
                </div>
            </div>
            <div class="nl-horizontal-scroller nl-workspace-scroller" data-horizontal-scroller>
                <button type="button" class="nl-scroll-button is-prev" data-scroll-prev aria-label="이전 그룹"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                <div class="nl-scroll-viewport" data-scroll-viewport>
                    <div class="nl-space-options">
                        <a href="/note/list?scope=PROJ" class="nl-space-option nl-space-option-all ${empty effectiveWsId ? 'is-selected' : ''}">
                            <span class="nl-space-avatar nl-space-avatar-all" aria-hidden="true"><i class="fa-solid fa-layer-group"></i></span>
                            <span class="nl-space-name">전체 그룹</span>
                        </a>
                        <c:forEach var="workspace" items="${noteWorkspaceList}">
                            <a href="/note/list?scope=PROJ&amp;wsId=${workspace.wsId}" class="nl-space-option ${effectiveWsId eq workspace.wsId ? 'is-selected' : ''}">
                                <span class="nl-space-avatar">
                                    <c:choose>
                                        <c:when test="${not empty workspace.wsImagePath}">
                                            <img src="${workspace.wsImagePath}" alt="" loading="lazy" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
                                            <span class="nl-space-avatar-fallback" hidden aria-hidden="true"><c:out value="${fn:substring(workspace.wsName, 0, 1)}" /></span>
                                        </c:when>
                                        <c:otherwise><span class="nl-space-avatar-fallback" aria-hidden="true"><c:out value="${fn:substring(workspace.wsName, 0, 1)}" /></span></c:otherwise>
                                    </c:choose>
                                </span>
                                <span class="nl-space-name"><c:out value="${workspace.wsName}" /></span>
                            </a>
                        </c:forEach>
                    </div>
                </div>
                <button type="button" class="nl-scroll-button is-next" data-scroll-next aria-label="다음 그룹"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
            </div>
        </div>

        <div class="nl-space-picker nl-space-picker-project">
            <div class="nl-space-picker-head">
                <div class="nl-space-picker-title">
                    <strong>프로젝트</strong>
                    <span>${empty effectiveWsId ? '확인 가능한 전체 프로젝트입니다.' : '선택한 그룹의 프로젝트입니다.'}</span>
                </div>
            </div>
            <div class="nl-horizontal-scroller nl-project-scroller" data-horizontal-scroller>
                <button type="button" class="nl-scroll-button is-prev" data-scroll-prev aria-label="이전 프로젝트"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                <div class="nl-scroll-viewport" data-scroll-viewport>
                    <div class="nl-space-options nl-project-options">
                        <c:set var="hasVisibleProject" value="false" />
                        <c:forEach var="project" items="${noteProjectList}">
                            <c:if test="${empty effectiveWsId or project.wsId eq effectiveWsId}">
                                <c:set var="hasVisibleProject" value="true" />
                            </c:if>
                        </c:forEach>

                        <c:choose>
                            <c:when test="${hasVisibleProject}">
                                <c:set var="projectAllQuery" value="scope=PROJ" />
                                <c:if test="${not empty effectiveWsId}"><c:set var="projectAllQuery" value="scope=PROJ&amp;wsId=${effectiveWsId}" /></c:if>
                                <a href="/note/list?${projectAllQuery}" class="nl-space-option nl-project-option nl-space-option-all ${empty effectiveProjId ? 'is-selected' : ''}">
                                    <span class="nl-project-inline-avatar" aria-hidden="true"><i class="fa-solid fa-diagram-project"></i></span>
                                    <span class="nl-space-name">전체 프로젝트</span>
                                </a>
                                <c:forEach var="project" items="${noteProjectList}">
                                    <c:if test="${empty effectiveWsId or project.wsId eq effectiveWsId}">
                                        <a href="/note/list?scope=PROJ&amp;wsId=${project.wsId}&amp;projId=${project.projId}" class="nl-space-option nl-project-option ${effectiveProjId eq project.projId ? 'is-selected' : ''}">
                                            <span class="nl-project-inline-avatar" aria-hidden="true"><c:out value="${fn:substring(project.projName, 0, 1)}" /></span>
                                            <span class="nl-project-name-wrap">
                                                <span class="nl-space-name"><c:out value="${project.projName}" /></span>
                                                <c:if test="${empty effectiveWsId and not empty project.wsName}"><small><c:out value="${project.wsName}" /></small></c:if>
                                            </span>
                                        </a>
                                    </c:if>
                                </c:forEach>
                            </c:when>
                            <c:otherwise>
                                <div class="nl-project-empty-row">
                                    <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
                                    <span>이 그룹에서 확인 가능한 프로젝트가 없습니다.</span>
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </div>
                <button type="button" class="nl-scroll-button is-next" data-scroll-next aria-label="다음 프로젝트"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
            </div>
        </div>
    </c:if>

    <c:set var="canManageFolders" value="false" />
    <c:if test="${scope eq 'PRIVATE'}"><c:set var="canManageFolders" value="true" /></c:if>
    <c:if test="${scope eq 'WS' and not empty effectiveWsId}">
        <c:forEach var="workspace" items="${noteWorkspaceList}">
            <c:set var="workspaceCanManageText" value="${fn:toLowerCase(workspace.canManage)}" />
            <c:if test="${workspace.wsId eq effectiveWsId and (workspaceCanManageText eq 'true' or workspaceCanManageText eq '1' or workspaceCanManageText eq 'y')}"><c:set var="canManageFolders" value="true" /></c:if>
        </c:forEach>
    </c:if>
    <c:if test="${scope eq 'PROJ' and not empty effectiveProjId}">
        <c:forEach var="project" items="${noteProjectList}">
            <c:set var="projectCanManageText" value="${fn:toLowerCase(project.canManage)}" />
            <c:if test="${project.projId eq effectiveProjId and (projectCanManageText eq 'true' or projectCanManageText eq '1' or projectCanManageText eq 'y')}"><c:set var="canManageFolders" value="true" /></c:if>
        </c:forEach>
    </c:if>

    <c:if test="${scope eq 'PRIVATE' or (scope eq 'FRIEND' and not empty effectiveFriendUserId) or (scope eq 'WS' and not empty effectiveWsId) or (scope eq 'PROJ' and not empty effectiveProjId)}">
        <c:set var="folderBaseQuery" value="scope=${scope}" />
        <c:if test="${importantOnly}"><c:set var="folderBaseQuery" value="${folderBaseQuery}&amp;importantOnly=true" /></c:if>
        <c:if test="${scope eq 'WS'}"><c:set var="folderBaseQuery" value="${folderBaseQuery}&amp;wsId=${effectiveWsId}" /></c:if>
        <c:if test="${scope eq 'PROJ'}"><c:set var="folderBaseQuery" value="${folderBaseQuery}&amp;wsId=${effectiveWsId}&amp;projId=${effectiveProjId}" /></c:if>
        <c:if test="${scope eq 'FRIEND' and not empty effectiveFriendUserId}"><c:set var="folderBaseQuery" value="${folderBaseQuery}&amp;friendUserId=${effectiveFriendUserId}" /></c:if>
        <c:set var="folderScopeName" value="개인" />
        <c:if test="${scope eq 'FRIEND'}"><c:set var="folderScopeName" value="공유받은" /></c:if>
        <c:if test="${scope eq 'WS'}"><c:set var="folderScopeName" value="선택한 그룹의" /></c:if>
        <c:if test="${scope eq 'PROJ'}"><c:set var="folderScopeName" value="선택한 프로젝트의" /></c:if>
        <c:set var="folderDropScopeKey" value="PRIVATE" />
        <c:if test="${scope eq 'WS'}"><c:set var="folderDropScopeKey" value="WS:${effectiveWsId}" /></c:if>
        <c:if test="${scope eq 'PROJ'}"><c:set var="folderDropScopeKey" value="PROJ:${effectiveProjId}" /></c:if>
        <section class="nl-folder-explorer nl-folder-explorer-${scope}" data-note-scope-content>
            <div class="nl-folder-head">
                <div>
                    <strong>폴더</strong>
                    <span>${folderScopeName} 노트를 폴더별로 확인합니다.</span>
                </div>
                <c:if test="${canManageFolders}">
                    <button type="button" class="nl-folder-create-button" data-folder-create>
                        <i class="fa-solid fa-plus" aria-hidden="true"></i>
                        새 폴더
                    </button>
                </c:if>
            </div>
            <span hidden id="noteFolderManageConfig" data-can-manage="${canManageFolders}" data-scope="${scope}" data-ws-id="${effectiveWsId}" data-proj-id="${effectiveProjId}"></span>
            <div class="nl-horizontal-scroller nl-folder-scroller" data-horizontal-scroller>
                <button type="button" class="nl-scroll-button is-prev" data-scroll-prev aria-label="이전 폴더">
                    <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <div class="nl-scroll-viewport" data-scroll-viewport>
                    <div class="nl-folder-list">
                        <a href="/note/list?${folderBaseQuery}" class="nl-folder-item ${empty selectedFolderId ? 'is-selected' : ''}">
                            <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
                            <span>전체</span>
                        </a>
                        <a href="/note/list?${folderBaseQuery}&folderId=0" class="nl-folder-item ${selectedFolderId eq 0 ? 'is-selected' : ''}" data-folder-unclassified data-note-folder-drop data-folder-id="" data-scope-key="${folderDropScopeKey}">
                            <i class="fa-regular fa-folder" aria-hidden="true"></i>
                            <span>미분류</span>
                        </a>
                        <c:forEach var="folder" items="${folderList}">
                            <div class="nl-folder-item-wrap ${canManageFolders ? '' : 'is-readonly'}" data-folder-wrap data-folder-id="${folder.folderId}" data-folder-name="${fn:escapeXml(folder.folderName)}">
                                <a href="/note/list?${folderBaseQuery}&folderId=${folder.folderId}"
                                   class="nl-folder-item ${selectedFolderId eq folder.folderId ? 'is-selected' : ''}"
                                   data-note-folder-drop data-folder-id="${folder.folderId}" data-scope-key="${folderDropScopeKey}"
                                   style="--folder-depth:${empty folder.depth ? 0 : folder.depth}">
                                    <i class="fa-solid fa-folder" aria-hidden="true"></i>
                                    <span><c:out value="${folder.folderName}" /></span>
                                </a>
                                <c:if test="${canManageFolders}">
                                    <div class="nl-folder-inline-actions" aria-label="폴더 관리">
                                        <button type="button" data-folder-rename title="폴더 이름 수정" aria-label="${fn:escapeXml(folder.folderName)} 이름 수정"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i></button>
                                        <button type="button" data-folder-delete title="폴더 삭제" aria-label="${fn:escapeXml(folder.folderName)} 삭제"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
                                    </div>
                                </c:if>
                            </div>
                        </c:forEach>
                    </div>
                </div>
                <button type="button" class="nl-scroll-button is-next" data-scroll-next aria-label="다음 폴더">
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
            </div>
        </section>
    </c:if>

    <c:set var="hasManageableNote" value="false" />
    <c:forEach var="manageCheckNote" items="${noteList}">
        <c:set var="manageCheckCanManageText" value="${fn:toLowerCase(manageCheckNote.canManage)}" />
        <c:if test="${manageCheckCanManageText eq 'true' or manageCheckCanManageText eq '1' or manageCheckCanManageText eq 'y'}"><c:set var="hasManageableNote" value="true" /></c:if>
    </c:forEach>

    <section data-note-scope-content class="nl-list-section ${(scope eq 'WS' and empty noteWorkspaceList) or (scope eq 'PROJ' and empty noteProjectList) ? 'is-workspace-empty' : ''}">
        <div class="nl-section-head">
            <div class="nl-section-title-wrap">
                <h2><c:out value="${scopeLabel}" /></h2>
                <span class="nl-list-count" data-count="${fn:length(noteList)}">${fn:length(noteList)}개의 노트</span>
                <c:if test="${scope eq 'TRASH' and not empty noteList}">
                    <div class="nl-trash-bulk-actions" id="noteTrashBulkActions" aria-label="휴지통 전체 작업">
                        <button type="button" class="nl-trash-bulk-button" id="noteRestoreAllTrash">
                            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
                            전체 복원
                        </button>
                        <button type="button" class="nl-trash-bulk-button is-danger" id="notePermanentDeleteAllTrash">
                            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                            전체 영구 삭제
                        </button>
                    </div>
                </c:if>
            </div>
            <div class="nl-list-head-actions">
                <label class="nl-sort nl-sort-list">
                    <span class="sr-only">정렬</span>
                    <select id="noteListSort">
                        <option value="recent">최근 수정순</option>
                        <option value="oldest">오래된 순</option>
                        <option value="title">제목순</option>
                    </select>
                </label>
                <c:if test="${scope ne 'TRASH' and hasManageableNote}">
                    <button type="button" class="nl-select-mode-button" id="noteSelectModeButton">
                        <i class="fa-regular fa-square-check" aria-hidden="true"></i>
                        <span>선택</span>
                    </button>
                </c:if>
            </div>
        </div>

        <c:if test="${scope ne 'TRASH' and hasManageableNote}">
            <div class="nl-bulk-bar" id="noteBulkBar" hidden>
                <label class="nl-bulk-select-all">
                    <input type="checkbox" id="noteSelectAll">
                    <span>전체 선택</span>
                </label>
                <strong class="nl-bulk-count" id="noteSelectedCount">0개 선택됨</strong>
                <div class="nl-bulk-actions">
                    <button type="button" id="noteBulkMove" data-note-bulk-move-drop disabled>
                        <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
                        폴더 이동
                    </button>
                    <button type="button" class="is-danger" id="noteBulkTrash" data-note-bulk-trash-drop disabled>
                        <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                        휴지통 이동
                    </button>
                </div>
            </div>
        </c:if>

        <c:choose>
            <c:when test="${empty noteList}">
                <div class="nl-empty-state">
                    <div class="nl-empty-mark">M</div>
                    <strong>${empty keyword ? '아직 노트가 없습니다.' : '검색 결과가 없습니다.'}</strong>
                    <p>${empty keyword ? '첫 기록을 가볍게 시작해 보세요.' : '다른 검색어로 다시 찾아보세요.'}</p>
                    <c:if test="${empty keyword and canWriteInCurrentContext}"><a href="/note/write?${writeQuery}">새 노트 만들기</a></c:if>
                </div>
            </c:when>
            <c:otherwise>
                <jsp:useBean id="now" class="java.util.Date" />
                <fmt:formatDate var="todayKey" value="${now}" pattern="yyyyMMdd" />

                <div class="nl-note-grid" id="noteList">
                    <c:forEach var="note" items="${noteList}">
                        <fmt:formatDate var="noteDateKey" value="${empty note.updDt ? note.regDt : note.updDt}" pattern="yyyyMMdd" />
                        <c:set var="noteCanManageText" value="${fn:toLowerCase(note.canManage)}" />
                        <c:set var="noteCanManage" value="${noteCanManageText eq 'true' or noteCanManageText eq '1' or noteCanManageText eq 'y'}" />
                        <article class="nl-note-card ${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? 'nl-card-FRIEND' : 'nl-card-'}${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? '' : note.scopeType}"
                                 data-note-id="${note.noteId}"
                                 data-note-scope="${note.scopeType}"
                                 data-ws-id="${note.wsId}"
                                 data-proj-id="${note.projId}"
                                 data-folder-id="${note.folderId}"
                                 data-can-manage="${noteCanManage}"
                                 data-title="${note.noteTitle}"
                                 data-scope-key="${note.scopeType eq 'WS' ? 'WS:' : note.scopeType eq 'PROJ' ? 'PROJ:' : 'PRIVATE'}${note.scopeType eq 'WS' ? note.wsId : note.scopeType eq 'PROJ' ? note.projId : ''}"
                                 data-date="<fmt:formatDate value='${empty note.updDt ? note.regDt : note.updDt}' pattern='yyyyMMddHHmmss' />">
                            <c:if test="${scope ne 'TRASH'}">
                                <label class="nl-card-select ${noteCanManage ? '' : 'is-disabled'}"
                                       title="${noteCanManage ? '노트 선택' : '이동·삭제 권한 없음'}">
                                    <input type="checkbox"
                                           class="nl-card-select-input"
                                           value="${note.noteId}"
                                           aria-label="${noteCanManage ? note.noteTitle.concat(' 선택') : note.noteTitle.concat(' 선택 불가: 이동·삭제 권한 없음')}"
                                           ${noteCanManage ? '' : 'disabled'}>
                                    <span aria-hidden="true"></span>
                                </label>
                            </c:if>
                            <c:choose>
                                <c:when test="${scope eq 'TRASH'}">
                                    <div class="nl-card-menu-wrap">
                                        <button type="button" class="nl-card-menu-button" aria-label="노트 메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                        <div class="nl-card-menu" hidden>
                                            <button type="button" data-note-action="restore"><i class="fa-solid fa-rotate-left"></i> 복원</button>
                                            <button type="button" class="is-danger" data-note-action="permanent-delete"><i class="fa-regular fa-trash-can"></i> 영구 삭제</button>
                                        </div>
                                    </div>
                                </c:when>
                                <c:otherwise>
                                    <button type="button"
                                            class="nl-pin-button ${note.pinned ? 'is-pinned' : ''}"
                                            data-note-id="${note.noteId}"
                                            aria-label="${note.pinned ? '중요 해제' : '중요 표시'}"
                                            title="${note.pinned ? '중요 해제' : '중요 표시'}">★</button>
                                    <c:if test="${noteCanManage}">
                                        <div class="nl-card-menu-wrap">
                                            <button type="button" class="nl-card-menu-button" aria-label="노트 메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                            <div class="nl-card-menu" hidden>
                                                <button type="button" data-note-action="move"><i class="fa-regular fa-folder-open"></i> 폴더 이동</button>
                                                <button type="button" class="is-danger" data-note-action="trash"><i class="fa-regular fa-trash-can"></i> 휴지통으로 이동</button>
                                            </div>
                                        </div>
                                    </c:if>
                                </c:otherwise>
                            </c:choose>
                            <a class="nl-note-link ${scope eq 'TRASH' ? 'is-trash-card' : ''}" href="${scope eq 'TRASH' ? '#' : '/note/detail?noteId='}${scope eq 'TRASH' ? '' : note.noteId}${scope eq 'TRASH' ? '' : '&'}${scope eq 'TRASH' ? '' : scopeQuery}">
                                <div class="nl-card-row nl-card-head-row">
                                    <h3 class="nl-card-title">
                                        <span class="nl-title-icon" aria-hidden="true"><c:out value="${empty note.icon ? '📝' : note.icon}" /></span>
                                        <span class="nl-title-text"><c:out value="${empty note.noteTitle ? '제목 없음' : note.noteTitle}" /></span>
                                        <c:if test="${not note.ownedByMe}">
                                            <span class="nl-permission-badge nl-title-permission ${note.canEdit ? 'is-editable' : 'is-shared'}">
                                                ${note.canEdit ? '편집' : '공유'}
                                            </span>
                                        </c:if>
                                    </h3>
                                    <div class="nl-card-head-actions">
                                        <c:if test="${not (scope eq 'FRIEND' and note.scopeType eq 'PRIVATE' and not note.ownedByMe)}">
                                            <span class="nl-scope-badge ${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? 'nl-scope-FRIEND' : 'nl-scope-'}${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? '' : note.scopeType}">
                                                <c:choose>
                                                    <c:when test="${note.scopeType eq 'WS'}">그룹</c:when>
                                                    <c:when test="${note.scopeType eq 'PROJ'}">프로젝트</c:when>
                                                    <c:when test="${note.scopeType eq 'PRIVATE' and not note.ownedByMe}">친구</c:when>
                                                    <c:otherwise>개인</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </c:if>
                                    </div>
                                </div>

                                <div class="nl-card-row nl-card-meta-row">
                                    <div class="nl-card-author">
                                        <span class="nl-author-label">작성자</span>
                                        <strong><c:out value="${empty note.userName ? '알 수 없음' : note.userName}" /></strong>
                                    </div>
                                    <div class="nl-card-counts" aria-label="노트 부가 정보">
                                        <c:if test="${note.tableCount gt 0}">
                                            <span class="nl-card-count" title="표 ${note.tableCount}개"><i class="fa-solid fa-table-cells" aria-hidden="true"></i><b>${note.tableCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.imageCount gt 0}">
                                            <span class="nl-card-count" title="이미지 ${note.imageCount}개"><i class="fa-regular fa-image" aria-hidden="true"></i><b>${note.imageCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.videoCount gt 0}">
                                            <span class="nl-card-count" title="영상 ${note.videoCount}개"><i class="fa-regular fa-circle-play" aria-hidden="true"></i><b>${note.videoCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.attachmentCount gt 0}">
                                            <span class="nl-card-count" title="첨부파일 ${note.attachmentCount}개"><i class="fa-solid fa-paperclip" aria-hidden="true"></i><b>${note.attachmentCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.feedbackCount gt 0}">
                                            <span class="nl-card-count" title="피드백 ${note.feedbackCount}개"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i><b>${note.feedbackCount}</b></span>
                                        </c:if>
                                    </div>
                                </div>

                                <p class="nl-card-preview"><c:out value="${note.previewContent}" /></p>

                                <div class="nl-card-row nl-card-foot-row">
                                    <div class="nl-card-location">
                                        <c:choose>
                                            <c:when test="${note.scopeType eq 'PRIVATE' and not note.ownedByMe}">
                                                <strong><c:out value="${empty note.userName ? '알 수 없음' : note.userName}" /></strong>
                                                <span>/</span>
                                                <span><c:out value="${empty note.folderPath ? '미분류' : note.folderPath}" /></span>
                                            </c:when>
                                            <c:when test="${note.scopeType eq 'WS'}">
                                                <strong><c:out value="${empty note.workspaceName ? '그룹' : note.workspaceName}" /></strong>
                                                <span>/</span>
                                                <span><c:out value="${empty note.folderPath ? '미분류' : note.folderPath}" /></span>
                                            </c:when>
                                            <c:when test="${note.scopeType eq 'PROJ'}">
                                                <strong><c:out value="${empty note.projectName ? '프로젝트' : note.projectName}" /></strong>
                                                <span>/</span>
                                                <span><c:out value="${empty note.folderPath ? '미분류' : note.folderPath}" /></span>
                                            </c:when>
                                            <c:otherwise>
                                                <strong>개인</strong>
                                                <span>/</span>
                                                <span><c:out value="${empty note.folderPath ? '미분류' : note.folderPath}" /></span>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                    <div class="nl-card-update-meta">
                                        <c:if test="${not empty note.updatedBy and note.updatedBy ne note.userId and not empty note.updatedByName}">
                                            <span class="nl-card-updater" title="마지막 수정자"><span class="nl-card-updater-label">수정</span><span class="nl-card-updater-name"><c:out value="${note.updatedByName}" /></span></span><span class="nl-card-update-dot" aria-hidden="true">·</span>
                                        </c:if>
                                        <time datetime="<fmt:formatDate value="${empty note.updDt ? note.regDt : note.updDt}" pattern="yyyy-MM-dd'T'HH:mm:ss" />">
                                            <c:choose>
                                                <c:when test="${noteDateKey eq todayKey}">
                                                    오늘 <fmt:formatDate value="${empty note.updDt ? note.regDt : note.updDt}" pattern="HH:mm" />
                                                </c:when>
                                                <c:otherwise>
                                                    <fmt:formatDate value="${empty note.updDt ? note.regDt : note.updDt}" pattern="yyyy.MM.dd" />
                                                </c:otherwise>
                                            </c:choose>
                                        </time>
                                    </div>
                                </div>
                            </a>
                        </article>
                    </c:forEach>
                </div>
            </c:otherwise>
        </c:choose>
    </section>
</main>


<div class="nl-modal-backdrop common-folder-modal" id="noteMoveModal" hidden>
    <section class="nl-move-modal" role="dialog" aria-modal="true" aria-labelledby="noteMoveModalTitle">
        <div class="nl-modal-head">
            <div>
                <h2 id="noteMoveModalTitle">폴더 이동</h2>
                <p id="noteMoveModalDescription">같은 영역의 폴더로만 이동할 수 있습니다.</p>
            </div>
            <div class="nl-modal-head-actions">
                <button type="button" class="nl-modal-folder-create" data-modal-folder-create hidden>
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> 새 폴더
                </button>
                <button type="button" class="nl-modal-close" data-move-close aria-label="닫기">×</button>
            </div>
        </div>
        <div class="nl-folder-choice-list" id="noteMoveFolderList"></div>
    </section>
</div>


<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="/js/noteList.js?v=note-list-route-context-v3"></script>
</body>
</html>
