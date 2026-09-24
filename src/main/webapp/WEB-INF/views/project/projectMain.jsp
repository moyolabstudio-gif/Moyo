<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<c:set var="moyoTabFaviconManaged" value="true" scope="request" />
<c:set var="effectiveProjectWsId" value="${wsId}" />
<c:if test="${empty effectiveProjectWsId and not empty param.wsId}"><c:set var="effectiveProjectWsId" value="${param.wsId}" /></c:if>
<c:if test="${empty effectiveProjectWsId and not empty projectDetail.wsId}"><c:set var="effectiveProjectWsId" value="${projectDetail.wsId}" /></c:if>
<c:set var="effectiveProjectScope" value="${projectDetail.projScope}" />
<c:if test="${empty effectiveProjectScope and empty effectiveProjectWsId}"><c:set var="effectiveProjectScope" value="PERSONAL" /></c:if>
<c:set var="isPersonalProject" value="${effectiveProjectScope eq 'PERSONAL'}" />
<c:set var="effectiveProjectId" value="${projId}" />
<c:if test="${empty effectiveProjectId and not empty param.projId}"><c:set var="effectiveProjectId" value="${param.projId}" /></c:if>
<c:if test="${empty effectiveProjectId and not empty projectDetail.projId}"><c:set var="effectiveProjectId" value="${projectDetail.projId}" /></c:if>
<c:set var="projectRouteQuery" value="projId=${effectiveProjectId}" />
<c:if test="${not isPersonalProject and not empty effectiveProjectWsId}"><c:set var="projectRouteQuery" value="${projectRouteQuery}&amp;wsId=${effectiveProjectWsId}" /></c:if>
<c:set var="showProjectGroupWidgets" value="${not isPersonalProject}" />
<c:set var="showProjectMembers" value="${not isPersonalProject}" />
<c:set var="showProjectOwnerCard" value="${isPersonalProject}" />
<c:set var="showProjectNotes" value="true" />
<c:set var="showProjectPhotos" value="true" />
<c:set var="showProjectMiniCalendar" value="true" />
<c:set var="projectNoteQuery" value="scope=PROJ" />
<c:if test="${not isPersonalProject and not empty effectiveProjectWsId}"><c:set var="projectNoteQuery" value="${projectNoteQuery}&amp;wsId=${effectiveProjectWsId}" /></c:if>
<c:if test="${not empty effectiveProjectId}"><c:set var="projectNoteQuery" value="${projectNoteQuery}&amp;projId=${effectiveProjectId}" /></c:if>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <title><c:out value="${projectDetail.projName}"/> | MOYO</title>
        <c:choose>
            <c:when test="${not isPersonalProject and not empty projectWorkspace.wsImagePath}">
                <link rel="icon" href="<c:out value='${projectWorkspace.wsImagePath}'/>">
            </c:when>
            <c:otherwise>
                <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
                <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
                <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
            </c:otherwise>
        </c:choose>
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentCard.css?v=note-card-common-meta-v1">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceMain.css?v=collab-activity-v1-20260919">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectMain.css?v=person-avatar-policy-v2-20260913">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMainShell.css?v=person-avatar-policy-v2-20260913">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMainDashboard.css?v=person-avatar-policy-v2-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMainHero.css?v=project-icon-design-v6-22-20260924">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonCommunityWidgets.css?v=mobile-widget-heights-cumulative-final-20260918">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentWidgets.css?v=content-empty-center-v14-20260922">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectTask.css?v=task-responsive-autoheight-v83-20260920">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentRecordModal.css?v=record-readonly-upload-hide-v85-20260920">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectMember.css?v=project-member-avatar-policy-v3">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMemberWidget.css?v=person-avatar-policy-v4-20260913">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberActivityProfile.css?v=member-profile-v6-24-20260924">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectWidget.css?v=project-note-photo-height-21-7">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonFolderModal.css?v=20260809-photo-location-common">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPhotoPostDetail.css?v=20260809-fit-atomic">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonCkeditor.css?v=moyo-ckeditor-common-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonNoteModal.css?v=20260822-toolbar-fix-5">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonNoteHistoryModal.css?v=common-note-history-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonNoteDetail.css?v=common-note-widget-v4">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectTimeline.css?v=project-plan-meta-order-v3-20260921">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonWidgetBase.css?v=widget-more-link-v1-20260910">
    <script>
        window.PROJECT_MAIN_CONFIG = {
            contextPath: '<c:out value="${pageContext.request.contextPath}"/>',
            projectLeaderId: '<c:out value="${projectDetail.leaderId}"/>',
            loginUserId: '<c:out value="${sessionScope.user.userId}"/>',
            projectStartDate: '<c:out value="${projectDetail.startDate}"/>',
            projectEndDate: '<c:out value="${projectDetail.endDate}"/>',
            projectId: '<c:out value="${effectiveProjectId}"/>',
            projectName: '<c:out value="${projectDetail.projName}"/>',
            workspaceName: '<c:out value="${projectWorkspace.wsName}"/>',
            deleteStatus: '<c:out value="${projectDetail.status}"/>',
            paramProjId: '<c:out value="${param.projId}"/>',
            wsId: '<c:out value="${effectiveProjectWsId}"/>',
            paramWsId: '<c:out value="${param.wsId}"/>',
            isPersonalProject: ${isPersonalProject ? 'true' : 'false'},
            groupProject: ${isPersonalProject ? 'false' : 'true'},
            projectScope: '<c:out value="${effectiveProjectScope}"/>',
            projectReadOnly: <c:choose><c:when test="${projectReadOnly eq true}">true</c:when><c:otherwise>false</c:otherwise></c:choose>,
            canManageProject: <c:choose><c:when test="${canManageProject eq true}">true</c:when><c:otherwise>false</c:otherwise></c:choose>,
            canCreateTasks: <c:choose><c:when test="${projectReadOnly ne true}">true</c:when><c:otherwise>false</c:otherwise></c:choose>,
            canManageTasks: <c:choose><c:when test="${projectReadOnly ne true and (isPersonalProject or canManageProject eq true)}">true</c:when><c:otherwise>false</c:otherwise></c:choose>,
            canWriteProjectNote: <c:choose><c:when test="${projectReadOnly ne true and (isPersonalProject or canManageProject eq true)}">true</c:when><c:otherwise>false</c:otherwise></c:choose>,
            showGroupWidgets: ${showProjectGroupWidgets ? 'true' : 'false'},
            showMembers: ${showProjectMembers ? 'true' : 'false'},
            showOwnerCard: ${showProjectOwnerCard ? 'true' : 'false'}
        };
    </script>
    <script src="${pageContext.request.contextPath}/js/projectPlanLoader.js?v=time-plan-picker-bound-color-v1"></script>
    <script src="${pageContext.request.contextPath}/js/projectMain.js?v=project-main-hero-detail-v1"></script>
    <script src="${pageContext.request.contextPath}/js/projectTaskData.js?v=project-task-hover-clip-fix-v6"></script>
    <script src="${pageContext.request.contextPath}/js/commonProfileCropper.js?v=profile-cropper-20260924"></script>
    <script src="${pageContext.request.contextPath}/js/commonMemberActivityProfile.js?v=member-profile-v6-24-20260924"></script>
    <script src="${pageContext.request.contextPath}/js/projectMember.js?v=common-member-activity-v5-20260910"></script>
    <script src="${pageContext.request.contextPath}/js/common/commonContentRecordModal.js?v=record-location-readonly-preview-v41-20260920"></script>
    <script src="${pageContext.request.contextPath}/js/projectTask.js?v=task-status-detail-v80-20260920"></script>
    <script src="${pageContext.request.contextPath}/js/commonCommunityWidgets.js?v=task-card-indicators-v1-20260919"></script>
    <script src="${pageContext.request.contextPath}/js/projectWidget.js?v=project-widget-data-connect-v1"></script>
    <script src="${pageContext.request.contextPath}/js/commonFolderModal.js?v=20260809-photo-location-common"></script>
    <script src="${pageContext.request.contextPath}/js/commonPhotoPostDetail.js?v=20260809-fit-atomic"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    <script src="${pageContext.request.contextPath}/js/commonCkeditor.js?v=20260907-image-guard-1"></script>
    <script src="${pageContext.request.contextPath}/js/common/commonNoteHistoryModal.js?v=common-note-history-v2"></script>
    <script defer src="${pageContext.request.contextPath}/js/common/commonNoteModal.js?v=20260822-widget-init-fix-1"></script>
    <script src="${pageContext.request.contextPath}/js/commonNoteDetail.js?v=common-note-widget-v4"></script>

    <script defer src="${pageContext.request.contextPath}/js/commonCalendarEventPreview.js?v=calendar-preview-avatar-policy-v12"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonQuickCalendarCreate.js?v=attendee-share-avatar-v29"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMiniCalendar.js?v=common-mini-calendar-v11"></script>
    <script defer src="${pageContext.request.contextPath}/js/projectMiniCalendarAdapter.js?v=project-scope-calendar-v1"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=20260809-photo-full-cleanup"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberDataAdapter.js?v=project-member-avatar-policy-v3"></script>
    <script defer src="${pageContext.request.contextPath}/js/projectMemberPeopleAdapter.js?v=project-scope-branch-v1-20260910"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberWidget.js?v=person-avatar-policy-v4"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonContentCard.js?v=20260906-global-path-fix-65"></script>
<script defer src="${pageContext.request.contextPath}/js/commonContentWidgets.js?v=common-widget-title-safe-v11-20260917"></script>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMiniCalendar.css?v=person-avatar-policy-v2-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonProjectTaskStatus.css?v=project-task-status-contract-v1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=person-avatar-policy-v2-20260913">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonQuickCalendarCreate.css?v=attendee-share-avatar-v40">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonCalendarEventPreview.css?v=event-header-actions-unified-v1">
</head>
<body class="${isPersonalProject ? 'personal-project-main' : 'group-project-main'}${projectReadOnly eq true ? ' project-read-only' : ''}" data-user-id="${sessionScope.user.userId}" data-current-user-id="${sessionScope.user.userId}" data-context-path="${pageContext.request.contextPath}" data-project-scope="${effectiveProjectScope}" data-project-read-only="${projectReadOnly eq true ? 'true' : 'false'}" data-project-name="<c:out value="${projectDetail.projName}"/>" data-scope-status="<c:out value='${projectDetail.status}'/>" data-main-shell-mode="${isPersonalProject ? 'PERSONAL_PROJECT' : 'GROUP_PROJECT'}"
      data-show-group-widgets="${showProjectGroupWidgets}"
      data-show-project-members="${showProjectMembers}"
      data-show-owner-card="${showProjectOwnerCard}">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <c:set var="mainShellMode" value="${isPersonalProject ? 'PERSONAL_PROJECT' : 'GROUP_PROJECT'}" />
    <%@ include file="../common/commonMainShell.jspf" %>

    <%@ include file="../common/commonMemberActivityProfile.jspf" %>

    <%@ include file="../common/commonPhotoPostDetail.jspf"%>

    <%@ include file="../common/commonNoteModal.jspf" %>

    <%@ include file="../common/commonNoteDetail.jspf" %>

    <%@ include file="../common/commonQuickCalendarCreate.jspf" %>

    <%@ include file="../common/commonCalendarEventPreview.jspf"%>



    <jsp:include page="/WEB-INF/views/common/commonContentRecordModal.jsp" />

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
