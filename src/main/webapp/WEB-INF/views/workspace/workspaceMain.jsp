<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="moyoTabFaviconManaged" value="true" scope="request" />
<c:set var="effectiveWorkspaceId" value="${workspace.wsId}" />
<c:if test="${empty effectiveWorkspaceId and not empty wsId}"><c:set var="effectiveWorkspaceId" value="${wsId}" /></c:if>
<c:if test="${empty effectiveWorkspaceId and not empty param.wsId}"><c:set var="effectiveWorkspaceId" value="${param.wsId}" /></c:if>
<c:set var="workspaceNoteQuery" value="scope=WS" />
<c:if test="${not empty effectiveWorkspaceId}"><c:set var="workspaceNoteQuery" value="${workspaceNoteQuery}&amp;wsId=${effectiveWorkspaceId}" /></c:if>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <title><c:out value="${workspace.wsName}"/> | MOYO</title>
    <c:choose>
        <c:when test="${not empty workspace.wsImagePath}">
            <link rel="icon" href="<c:out value='${workspace.wsImagePath}'/>">
        </c:when>
        <c:otherwise>
            <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
            <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
            <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
        </c:otherwise>
    </c:choose>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=person-avatar-policy-v2-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentCard.css?v=note-card-common-meta-v1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceMain.css?v=collab-activity-v1-20260919">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonWorkspaceInvite.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberProfile.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberActivityProfile.css?v=member-profile-v6-24-20260924">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMainShell.css?v=person-avatar-policy-v2-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMainDashboard.css?v=person-avatar-policy-v2-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMainHero.css?v=hero-mobile-actions-v4-20260918">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonWidgetBase.css?v=widget-more-link-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonCommunityWidgets.css?v=mobile-widget-heights-cumulative-final-20260918">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentWidgets.css?v=content-empty-center-v14-20260922">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMiniCalendar.css?v=person-avatar-policy-v2-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonQuickCalendarCreate.css?v=attendee-share-avatar-v40">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentRecordModal.css?v=record-readonly-upload-hide-v85-20260920">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonCalendarEventPreview.css?v=event-header-actions-unified-v1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonMemberWidget.css?v=person-avatar-policy-v4-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=person-avatar-policy-v2-20260913">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonFolderModal.css?v=20260809-photo-location-common">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPhotoPostDetail.css?v=20260809-fit-atomic">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonCkeditor.css?v=moyo-ckeditor-common-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonNoteModal.css?v=20260822-toolbar-fix-5">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonNoteHistoryModal.css?v=common-note-history-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonNoteDetail.css?v=common-note-widget-v4">

    <script defer src="${pageContext.request.contextPath}/js/commonMiniCalendar.js?v=common-mini-calendar-v4"></script>
    <script defer src="${pageContext.request.contextPath}/js/workspaceMiniCalendarAdapter.js?v=workspace-mini-calendar-adapter-v2"></script>
    <script defer src="${pageContext.request.contextPath}/js/common/commonContentRecordModal.js"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonCalendarEventPreview.js?v=calendar-preview-avatar-policy-v12"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonQuickCalendarCreate.js?v=attendee-share-avatar-v29"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonCommunityWidgets.js?v=collab-log-single-source-v6-20260919"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=20260809-photo-full-cleanup"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberWidget.js?v=person-avatar-policy-v4"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberDataAdapter.js?v=common-member-activity-v5-20260910"></script>
    <script defer src="${pageContext.request.contextPath}/js/workspaceMemberPeopleAdapter.js?v=common-member-activity-v5-20260910"></script>
    <script src="${pageContext.request.contextPath}/js/commonFolderModal.js?v=20260809-photo-location-common"></script>
    <script src="${pageContext.request.contextPath}/js/commonPhotoPostDetail.js?v=20260809-fit-atomic"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    <script src="${pageContext.request.contextPath}/js/commonCkeditor.js?v=20260907-image-guard-1"></script>
    <script src="${pageContext.request.contextPath}/js/common/commonNoteHistoryModal.js?v=common-note-history-v2"></script>
    <script defer src="${pageContext.request.contextPath}/js/common/commonNoteModal.js?v=20260822-widget-init-fix-1"></script>
    <script src="${pageContext.request.contextPath}/js/commonNoteDetail.js?v=common-note-widget-v4"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonContentCard.js?v=20260906-global-path-fix-65"></script>
<script defer src="${pageContext.request.contextPath}/js/commonContentWidgets.js?v=common-widget-title-safe-v11-20260917"></script>
    <script defer src="${pageContext.request.contextPath}/js/workspaceMain.js?v=common-member-activity-v5-20260910"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonWorkspaceInvite.js"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberProfile.js?v=profile-crop-export-v1-20260910"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberActivityProfile.js?v=member-profile-v6-24-20260924"></script>
</head>
<body class="moyo-app-sidebar-enabled workspace-community-body moyo-main-shell-page moyo-main-shell-page--workspace"
      data-ws-id="${effectiveWorkspaceId}"
      data-context-path="${pageContext.request.contextPath}"
      data-current-user-id="${user.userId}"
      data-workspace-admin="${isWorkspaceAdmin}"
      data-workspace-owner="${currentUserIsOwner}"
      data-workspace-owner-id="${workspace.ownerId}"
      data-workspace-member="${isWorkspaceMember}"
      data-workspace-name="<c:out value='${workspace.wsName}'/>"
      data-scope-status="<c:out value='${workspace.status}'/>"
      data-join-type="${workspace.joinType}"
      data-join-request-status="${joinRequestStatus}"
      data-main-shell-mode="WORKSPACE">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <c:set var="mainShellMode" value="WORKSPACE" />
    <%@ include file="../common/commonMainShell.jspf" %>

    <%@ include file="../common/commonQuickCalendarCreate.jspf" %>
    <jsp:include page="/WEB-INF/views/common/commonContentRecordModal.jsp" />

    <%@ include file="../common/commonCalendarEventPreview.jspf" %>

    <%@ include file="../common/commonPhotoPostDetail.jspf"%>

    <%@ include file="../common/commonNoteModal.jspf" %>

    <%@ include file="../common/commonNoteDetail.jspf" %>

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

    <%@ include file="../common/commonMemberActivityProfile.jspf" %>

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
