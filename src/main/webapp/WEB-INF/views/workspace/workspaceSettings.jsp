<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="moyoTabFaviconManaged" value="true" scope="request" />
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><c:out value="${workspace.wsName}"/> 설정 | MOYO</title>
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
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=primary-gradient-135-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceSettings.css?v=workspace-settings-v6-12-20260924">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/collabSettings.css?v=collab-settings-v1-20260924">
    <script>
        window.WORKSPACE_SETTINGS_CONFIG = {
            contextPath: '${pageContext.request.contextPath}',
            wsId: Number('${workspace.wsId}'),
            currentUserId: Number('${currentUserId}'),
            canManage: true,
            canOperate: true,
            isOwner: ${currentUserIsOwner ? 'true' : 'false'},
            status: '<c:out value="${workspace.status}"/>',
            workspaceName: '<c:out value="${fn:escapeXml(workspace.wsName)}"/>'
        };
        window.WORKSPACE_CONFIG = {
            contextPath: window.WORKSPACE_SETTINGS_CONFIG.contextPath,
            wsId: window.WORKSPACE_SETTINGS_CONFIG.wsId,
            currentUserId: window.WORKSPACE_SETTINGS_CONFIG.currentUserId,
            isAdmin: window.WORKSPACE_SETTINGS_CONFIG.canManage,
            isOwner: window.WORKSPACE_SETTINGS_CONFIG.isOwner,
            workspaceStatus: window.WORKSPACE_SETTINGS_CONFIG.status
        };
    </script>
    <script defer src="${pageContext.request.contextPath}/js/workspaceSettings.js?v=workspace-settings-v6-12-20260924"></script>
</head>
<body data-member-activity-mode="GROUP"
      data-main-shell-mode="WORKSPACE"
      data-ws-id="${workspace.wsId}"
      data-context-path="${pageContext.request.contextPath}"
      data-current-user-id="${currentUserId}"
      data-scope-status="<c:out value='${workspace.status}'/>">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="ws-settings-shell">
    <section class="ws-settings-context" aria-label="현재 그룹">
        <div class="ws-settings-context__identity">
            <div class="ws-settings-context__avatar${not empty workspace.wsImagePath ? ' has-image' : ''}">
                <c:choose>
                    <c:when test="${not empty workspace.wsImagePath}">
                        <img src="<c:out value='${workspace.wsImagePath}'/>" alt="">
                    </c:when>
                    <c:otherwise>
                        <span><c:out value="${fn:toUpperCase(fn:substring(workspace.wsName, 0, 1))}"/></span>
                    </c:otherwise>
                </c:choose>
            </div>
            <div class="ws-settings-context__copy">
                <span class="ws-settings-context__eyebrow">그룹 설정</span>
                <h1><c:out value="${workspace.wsName}"/></h1>
                <div class="ws-settings-context__meta">
                    <span data-workspace-type-label><c:out value="${workspace.wsType}"/></span>
                    <span aria-hidden="true">·</span>
                    <span data-workspace-join-label><c:out value="${workspace.joinType}"/></span>
                </div>
            </div>
        </div>
        <div class="ws-settings-context__status">
            <button type="submit" form="workspaceInfoForm" class="ws-settings-btn ws-settings-btn--primary" data-save-workspace disabled>변경사항 저장</button>
        </div>
    </section>
    <div class="ws-settings-content">
        <section class="ws-settings-panel">
                                <form id="workspaceInfoForm" class="ws-settings-form" enctype="multipart/form-data">
                    <input type="hidden" name="wsId" value="${workspace.wsId}">
                    <input type="hidden" id="wsType" name="wsType" value="<c:out value='${empty workspace.wsType ? "COMMUNITY" : workspace.wsType}'/>">
                    <input type="hidden" id="removeWorkspaceImage" name="removeWorkspaceImage" value="N">
                    <input type="hidden" id="workspaceImageOriginalPath" value="<c:out value='${workspace.wsImageOriginalPath}'/>">
                    <input type="hidden" id="wsImageCropScale" name="wsImageCropScale" value="${empty workspace.wsImageCropScale ? 1.15 : workspace.wsImageCropScale}">
                    <input type="hidden" id="wsImageCropX" name="wsImageCropX" value="${empty workspace.wsImageCropX ? 0 : workspace.wsImageCropX}">
                    <input type="hidden" id="wsImageCropY" name="wsImageCropY" value="${empty workspace.wsImageCropY ? 0 : workspace.wsImageCropY}">

                    <div class="ws-settings-section">
                        <div class="ws-settings-field ws-settings-field--wide">
                            <div class="ws-settings-label-row">
                                <label for="wsName">그룹 이름</label>
                                <span class="ws-settings-inline-count"><span data-name-count>0</span> / 60</span>
                            </div>
                            <input type="text" id="wsName" name="wsName" maxlength="60" value="<c:out value='${workspace.wsName}'/>" >
                        </div>

                        <div class="ws-settings-field ws-settings-field--wide">
                            <div class="ws-settings-label-row">
                                <span>그룹 유형</span>
                                <small>가장 가까운 유형을 선택하세요.</small>
                            </div>
                            <div class="ws-settings-type-grid" data-workspace-type-picker role="radiogroup" aria-label="그룹 유형">
                                <button type="button" data-workspace-type="ORGANIZATION"><span class="ws-settings-type-icon"><i class="fa-solid fa-building"></i></span><span>회사 · 조직</span></button>
                                <button type="button" data-workspace-type="TEAM"><span class="ws-settings-type-icon"><i class="fa-solid fa-people-group"></i></span><span>팀 · 프로젝트</span></button>
                                <button type="button" data-workspace-type="STUDY"><span class="ws-settings-type-icon"><i class="fa-solid fa-book-open"></i></span><span>스터디 · 연구</span></button>
                                <button type="button" data-workspace-type="COMMUNITY"><span class="ws-settings-type-icon"><i class="fa-solid fa-comments"></i></span><span>모임 · 커뮤니티</span></button>
                                <button type="button" data-workspace-type="CLUB"><span class="ws-settings-type-icon"><i class="fa-solid fa-palette"></i></span><span>동아리 · 취미</span></button>
                                <button type="button" data-workspace-type="LIFE"><span class="ws-settings-type-icon"><i class="fa-solid fa-house"></i></span><span>가족 · 생활</span></button>
                                <button type="button" data-workspace-type="ETC"><span class="ws-settings-type-icon"><i class="fa-solid fa-ellipsis"></i></span><span>기타</span></button>
                            </div>
                        </div>

                        <div class="ws-settings-field ws-settings-field--wide">
                            <div class="ws-settings-label-row"><label for="wsDescription">그룹 소개</label><small>그룹의 목적이나 분위기를 간단히 적어주세요.</small></div>
                            <div class="ws-settings-textarea-wrap">
                                <textarea id="wsDescription" name="wsDescription" maxlength="300" rows="3" ><c:out value="${workspace.wsDescription}"/></textarea>
                                <div class="ws-settings-counter" data-description-count>0 / 300</div>
                            </div>
                        </div>

                        <div class="ws-settings-field ws-settings-field--wide">
                            <div class="ws-settings-label-row"><span>가입 방식</span><small>기존 멤버 관계에는 영향을 주지 않습니다.</small></div>
                            <div class="ws-settings-choice-grid" data-join-picker role="radiogroup" aria-label="그룹 가입 방식">
                                <label><input type="radio" name="joinType" value="OPEN" ${empty workspace.joinType or workspace.joinType eq 'OPEN' ? 'checked' : ''} ><span><span class="ws-settings-choice-icon"><i class="fa-solid fa-door-open"></i></span><span class="ws-settings-choice-copy"><strong>자유 가입</strong><small>승인 없이 바로 참여할 수 있어요.</small></span></span></label>
                                <label><input type="radio" name="joinType" value="APPROVAL" ${workspace.joinType eq 'APPROVAL' ? 'checked' : ''} ><span><span class="ws-settings-choice-icon"><i class="fa-solid fa-user-check"></i></span><span class="ws-settings-choice-copy"><strong>승인 후 가입</strong><small>그룹장 또는 관리자의 승인 후 참여해요.</small></span></span></label>
                                <label><input type="radio" name="joinType" value="INVITE_ONLY" ${workspace.joinType eq 'INVITE_ONLY' ? 'checked' : ''} ><span><span class="ws-settings-choice-icon"><i class="fa-solid fa-envelope"></i></span><span class="ws-settings-choice-copy"><strong>초대 전용</strong><small>초대받은 사용자만 참여할 수 있어요.</small></span></span></label>
                            </div>
                        </div>
                    </div>

                    <div class="ws-settings-details-grid">
                        <section class="ws-settings-detail-section ws-settings-detail-section--image">
                            <div class="ws-settings-subsection__head"><div><h3>대표 이미지</h3></div></div>
                            <div class="ws-settings-image-summary">
                                <div class="ws-settings-image-preview${not empty workspace.wsImagePath ? ' has-image' : ''}" data-workspace-image-preview>
                                    <c:choose>
                                        <c:when test="${not empty workspace.wsImagePath}"><img id="workspacePreviewImage" src="<c:out value='${workspace.wsImagePath}'/>" alt="그룹 대표 이미지"></c:when>
                                        <c:otherwise><img id="workspacePreviewImage" hidden alt="그룹 대표 이미지"><span data-workspace-image-placeholder><c:out value="${fn:toUpperCase(fn:substring(workspace.wsName,0,1))}"/></span></c:otherwise>
                                    </c:choose>
                                </div>
                                <div class="ws-settings-image-copy">
                                    <div class="ws-settings-image-actions">
                                        <label id="workspaceImageSelectLabel" class="ws-settings-btn ws-settings-btn--primary-soft " for="wsImage">이미지 변경</label>
                                        <input type="file" id="wsImage" name="wsImage" accept="image/png,image/jpeg,image/webp" hidden >
                                        <button type="button" id="workspaceImageAdjustButton" class="ws-settings-btn ws-settings-btn--ghost" ${empty workspace.wsImagePath ? 'disabled' : ''}>이미지 조정</button>
                                        <button type="button" class="ws-settings-btn ws-settings-btn--ghost" data-remove-workspace-image >기본 이미지</button>
                                        <button type="button" class="ws-settings-btn ws-settings-btn--ghost ws-settings-btn--revert" data-revert-workspace-image hidden>되돌리기</button>
                                    </div>
                                    <p>선택한 이미지는 조정 화면에서 위치와 크기를 맞출 수 있어요.</p>
                                </div>
                            </div>
                        </section>

                        <section class="ws-settings-detail-section ws-settings-detail-section--links">
                            <div class="ws-settings-subsection__head ws-settings-subsection__head--links">
                                <div class="ws-settings-link-title"><h3>외부 링크</h3><span class="ws-settings-link-count"><span data-link-count>${fn:length(workspaceLinks)}</span> / 5</span></div>
                                <button type="button" class="ws-settings-link-add" data-add-workspace-link ><i class="fa-solid fa-plus"></i><span>링크 추가</span></button>
                            </div>
                            <div class="ws-settings-link-list" data-workspace-link-list>
                                <c:if test="${empty workspaceLinks}">
                                    <p class="ws-settings-link-empty" data-workspace-link-empty><i class="fa-solid fa-link"></i><span>등록된 링크가 없습니다.</span></p>
                                </c:if>
                                <c:forEach var="link" items="${workspaceLinks}">
                                    <div class="ws-settings-link-row">
                                        <input type="text" name="linkName" maxlength="50" value="<c:out value='${link.LINK_NAME}'/>" placeholder="링크 이름" >
                                        <input type="url" name="linkUrl" maxlength="500" value="<c:out value='${link.LINK_URL}'/>" placeholder="https://example.com" >
                                        <button type="button" data-remove-link aria-label="링크 삭제" >×</button>
                                    </div>
                                </c:forEach>
                            </div>
                            <p class="ws-settings-link-help">Git, Notion, 문서 등 필요한 링크를 최대 5개까지 등록할 수 있어요.</p>
                        </section>
                    </div>

                </form>

                <c:if test="${currentUserIsOwner}">
                    <div class="ws-settings-danger-zone">
                        <div>
                            <h3>그룹 삭제</h3>
                            <c:choose>
                                <c:when test="${workspace.status eq 'DELETE_PENDING'}">
                                    <p>현재 삭제 예정 상태입니다. <c:out value="${workspace.deleteDeadlineDate}"/>까지 삭제 신청을 취소할 수 있습니다.</p>
                                </c:when>
                                <c:otherwise>
                                    <p>그룹을 삭제하면 하위 프로젝트도 함께 삭제 절차에 들어갑니다.</p>
                                </c:otherwise>
                            </c:choose>
                        </div>
                        <c:choose>
                            <c:when test="${workspace.status eq 'DELETE_PENDING'}"><button type="button" class="ws-settings-btn ws-settings-btn--danger-ghost" data-cancel-delete>삭제 신청 취소</button></c:when>
                            <c:otherwise><button type="button" class="ws-settings-btn ws-settings-btn--danger" data-request-delete>그룹 삭제</button></c:otherwise>
                        </c:choose>
                    </div>
                </c:if>
            </section>
    </div>
</main>

<div class="ws-settings-image-modal" id="workspaceImageCropModal" hidden role="dialog" aria-modal="true" aria-labelledby="workspaceImageCropTitle">
    <button type="button" class="ws-settings-image-modal__backdrop" data-workspace-image-close aria-label="닫기"></button>
    <section class="ws-settings-image-modal__dialog">
        <div class="ws-settings-image-modal__head">
            <div><span>그룹 이미지 조정</span><h3 id="workspaceImageCropTitle">영역 안에 이미지를 맞춰주세요</h3></div>
            <button type="button" data-workspace-image-close aria-label="닫기">×</button>
        </div>
        <div id="workspaceImageCropViewport" class="ws-settings-image-crop-viewport"><img id="workspaceImageCropImage" alt="그룹 이미지 조정 미리보기"></div>
        <div class="ws-settings-image-scale"><div><span>이미지 크기</span><output id="workspaceImageScaleValue">115%</output></div><input id="workspaceImageScale" type="range" min="100" max="200" step="1" value="115"></div>
        <p class="ws-settings-image-modal__hint">드래그로 위치를 맞추고 크기를 조정하세요.</p>
        <div class="ws-settings-image-modal__actions"><label for="wsImage" class="ws-settings-btn ws-settings-btn--ghost">이미지 다시 선택</label><button type="button" id="workspaceImageApplyButton" class="ws-settings-btn ws-settings-btn--primary">적용</button></div>
    </section>
</div>

<div class="ws-settings-confirm" data-confirm-modal hidden>
    <button type="button" class="ws-settings-confirm__backdrop" data-confirm-cancel aria-label="닫기"></button>
    <section class="ws-settings-confirm__dialog" role="dialog" aria-modal="true">
        <h3 data-confirm-title>확인</h3>
        <p data-confirm-message></p>
        <input type="text" data-confirm-input hidden>
        <div><button type="button" class="ws-settings-btn ws-settings-btn--ghost" data-confirm-cancel>취소</button><button type="button" class="ws-settings-btn ws-settings-btn--danger" data-confirm-ok>확인</button></div>
    </section>
</div>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
