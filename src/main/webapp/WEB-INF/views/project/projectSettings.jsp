<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="moyoTabFaviconManaged" value="true" scope="request" />
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><c:out value="${projectDetail.projName}"/> 설정 | MOYO</title>
    <c:choose>
        <c:when test="${groupProject and not empty projectWorkspace.wsImagePath}">
            <link rel="icon" href="<c:out value='${projectWorkspace.wsImagePath}'/>">
        </c:when>
        <c:otherwise>
            <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
            <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
            <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
        </c:otherwise>
    </c:choose>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=primary-gradient-135-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonProjectForm.css?v=project-form-common-v1-20260921">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectSettings.css?v=project-settings-v6-21-20260924">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/collabSettings.css?v=collab-settings-v1-20260924">
    <script>
        window.PROJECT_SETTINGS_CONFIG = {
            contextPath: '${pageContext.request.contextPath}',
            projId: Number('${projId}'),
            wsId: ${groupProject ? wsId : 'null'},
            groupProject: ${groupProject ? 'true' : 'false'},
            canManage: ${canManageProject ? 'true' : 'false'},
            canManageProject: ${canManageProject ? 'true' : 'false'},
            readOnly: ${readOnlyProjectSettings ? 'true' : 'false'},
            isLeader: ${isProjectLeader ? 'true' : 'false'},
            currentUserId: Number('${currentUserId}'),
            projectName: '<c:out value="${fn:escapeXml(projectDetail.projName)}"/>',
            startDate: '<c:out value="${projectSettingsStartDate}"/>',
            endDate: '<c:out value="${projectSettingsEndDate}"/>',
            periodEnabledYn: '<c:out value="${projectDetail.periodEnabledYn}"/>',
            status: '<c:out value="${projectDetail.status}"/>'
        };
    </script>
    <script defer src="${pageContext.request.contextPath}/js/commonProjectForm.js?v=project-form-common-v1-20260921"></script>
    <script defer src="${pageContext.request.contextPath}/js/projectSettings.js?v=project-settings-v6-21-20260924"></script>
</head>
<body class="${readOnlyProjectSettings ? 'project-settings-readonly' : 'project-settings-editable'} ${groupProject ? 'group-project-settings' : 'personal-project-settings'}"
      data-context-path="${pageContext.request.contextPath}"
      data-member-activity-mode="PROJECT"
      data-main-shell-mode="${groupProject ? 'GROUP_PROJECT' : 'PERSONAL_PROJECT'}"
      data-project-scope="${groupProject ? 'GROUP' : 'PERSONAL'}"
      data-ws-id="${groupProject ? wsId : ''}"
      data-proj-id="${projId}"
      data-current-user-id="${currentUserId}"
      data-scope-status="<c:out value='${projectDetail.status}'/>">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="project-settings-shell">
    <section class="project-settings-context">
        <div class="project-settings-context__identity">
            <span class="project-settings-context__icon"><i class="fa-solid fa-<c:out value='${projectDetail.projIcon}'/>" aria-hidden="true"></i></span>
            <div>
                <span class="project-settings-kicker">프로젝트 설정</span>
                <h1><c:out value="${projectDetail.projName}"/></h1>
                <c:set var="projectTypeDisplayLabel" value="${projectDetail.projType}" />
                <c:forEach items="${projectTypeGroups}" var="typeGroup">
                    <c:forEach items="${typeGroup.types}" var="typeOption">
                        <c:if test="${typeOption.code eq projectDetail.projType}">
                            <c:set var="projectTypeDisplayLabel" value="${typeOption.label}" />
                        </c:if>
                    </c:forEach>
                </c:forEach>
                <div class="project-settings-context__meta">
                    <c:if test="${groupProject and not empty projectWorkspace}"><span><c:out value="${projectWorkspace.wsName}"/></span><span>·</span></c:if>
                    <span data-project-type-label><c:out value="${projectTypeDisplayLabel}"/></span>
                </div>
            </div>
        </div>
        <div class="project-settings-context__actions">
            <c:if test="${canManageProject and not readOnlyProjectSettings}">
                <button type="submit" form="projectInfoForm" class="project-settings-btn project-settings-btn--primary" data-save-project disabled>변경사항 저장</button>
            </c:if>
        </div>
    </section>
    <div class="project-settings-content">
        <section class="project-settings-panel">
            <c:if test="${readOnlyProjectSettings}">
                <div class="project-settings-notice">현재 권한에서는 프로젝트 정보를 읽기 전용으로 확인할 수 있습니다.</div>
            </c:if>

            <form id="projectInfoForm" class="project-settings-form" data-project-form-common>
                <div class="project-settings-section">
                    <div class="moyo-project-form__group project-settings-field project-settings-field--wide" data-project-field="name">
                        <div class="project-settings-label-row"><label for="settingProjName">프로젝트명</label><small>생성 화면과 같은 기준</small></div>
                        <input type="text" id="settingProjName" maxlength="80" data-project-name value="<c:out value='${projectDetail.projName}'/>" placeholder="프로젝트명을 입력하세요.">
                        <p class="moyo-project-form__error" data-project-form-error="name" hidden></p>
                    </div>

                    <div class="moyo-project-form__group project-settings-field project-settings-field--wide" data-project-field="type">
                        <div class="project-settings-label-row"><span>프로젝트 유형</span><small>프로젝트 카드와 기능에서 함께 사용됩니다.</small></div>
                        <input type="hidden" data-project-type-input value="<c:out value='${projectDetail.projType}'/>">
                        <div class="moyo-project-type-picker" data-project-type-picker>
                            <div class="project-settings-type-grid">
                                <c:forEach items="${projectTypeGroups}" var="group">
                                    <c:forEach items="${group.types}" var="type">
                                        <c:if test="${type.code ne 'LIFE' and type.code ne 'RECORD'}">
                                            <button type="button" class="moyo-project-type-option"
                                                    data-project-type="${type.code}"
                                                    data-project-default-icon="${type.defaultIcon}"
                                                    data-project-recommended-icons="${type.recommendedIcons}"
                                                    title="${type.label}">
                                                <span><i class="fa-solid fa-${type.defaultIcon}" aria-hidden="true"></i></span>
                                                <strong><c:out value="${type.label}"/></strong>
                                            </button>
                                        </c:if>
                                    </c:forEach>
                                </c:forEach>
                            </div>
                        </div>
                        <p class="moyo-project-form__error" data-project-form-error="type" hidden></p>
                    </div>

                    <div class="moyo-project-form__group project-settings-field project-settings-field--wide" data-project-field="icon">
                        <div class="project-settings-label-row"><span>프로젝트 아이콘</span><small>유형과 별개로 원하는 아이콘을 선택할 수 있습니다.</small></div>
                        <input type="hidden" data-project-icon-input value="<c:out value='${projectDetail.projIcon}'/>">
                        <div class="moyo-project-icon-picker" data-project-icon-picker>
                            <div class="project-settings-icon-summary">
                                <span class="project-settings-icon-current" data-project-icon-current></span>
                                <div><strong>현재 아이콘</strong><small>프로젝트를 구분하는 아이콘입니다.</small></div>
                                <button type="button" data-project-icon-toggle data-open-label="아이콘 변경" data-close-label="닫기">아이콘 변경</button>
                            </div>
                            <div class="project-settings-icon-options" data-project-icon-options hidden>
                                <c:forEach items="${projectIconOptions}" var="icon">
                                    <button type="button" data-project-icon="${icon.key}" data-project-icon-label="${icon.label}" title="${icon.label}"><i class="fa-solid fa-${icon.key}"></i></button>
                                </c:forEach>
                            </div>
                        </div>
                        <p class="moyo-project-form__error" data-project-form-error="icon" hidden></p>
                    </div>

                    <div class="moyo-project-form__group project-settings-field project-settings-field--wide" data-project-field="description">
                        <div class="project-settings-label-row"><label for="settingProjDesc">프로젝트 설명</label><small>목표나 준비할 내용을 간단히 적어두세요.</small></div>
                        <div class="project-settings-description-wrap">
                            <textarea id="settingProjDesc" maxlength="1000" rows="4" data-project-description><c:out value="${projectDetail.projDesc}"/></textarea>
                            <span data-project-description-count>0 / 1000</span>
                        </div>
                    </div>

                    <div class="moyo-project-form__group project-settings-field project-settings-field--wide" data-project-field="period">
                        <div class="project-settings-label-row"><span>프로젝트 기간</span><small>기간이 없는 프로젝트는 언제든 다시 지정할 수 있습니다.</small></div>
                        <input type="hidden" data-project-period-enabled-input value="<c:out value='${projectDetail.periodEnabledYn}'/>">
                        <div class="moyo-project-period-picker" data-project-period-picker>
                            <div class="project-settings-choice-grid">
                                <button type="button" data-project-period-mode="N"><i class="fa-regular fa-calendar-xmark"></i><span><strong>기간 없음</strong><small>종료 시점을 정하지 않고 진행</small></span></button>
                                <button type="button" data-project-period-mode="Y"><i class="fa-regular fa-calendar-check"></i><span><strong>기간 지정</strong><small>시작일과 종료일을 사용</small></span></button>
                            </div>
                            <div class="project-settings-period-fields" data-project-period-fields hidden>
                                <label class="project-settings-date-field"><span>시작일</span><input type="hidden" data-project-period-start value="<c:out value='${projectSettingsStartDate}'/>"><button type="button" class="project-settings-date-control" data-project-date-picker="start"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span class="project-date-value">시작일 선택</span></button></label>
                                <span class="project-settings-date-separator" aria-hidden="true">—</span>
                                <label class="project-settings-date-field"><span>종료일</span><input type="hidden" data-project-period-end value="<c:out value='${projectSettingsEndDate}'/>"><button type="button" class="project-settings-date-control" data-project-date-picker="end"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span class="project-date-value">종료일 선택</span></button></label>
                            </div>
                        </div>
                        <p class="moyo-project-form__error" data-project-form-error="period" hidden></p>
                    </div>

                    <c:choose>
                        <c:when test="${groupProject}">
                            <div class="moyo-project-form__group project-settings-field project-settings-field--wide" data-project-field="access">
                                <div class="project-settings-label-row"><span>프로젝트 공개 범위</span><small>비참여 그룹 멤버의 읽기 가능 여부입니다.</small></div>
                                <input type="hidden" data-project-access-input value="<c:out value='${projectDetail.accessScope}'/>">
                                <div class="moyo-project-access-picker project-settings-choice-grid" data-project-access-picker>
                                    <button type="button" data-project-access-scope="PARTICIPANTS"><i class="fa-solid fa-lock"></i><span><strong>참여자만</strong><small>프로젝트 참여자만 진입</small></span></button>
                                    <button type="button" data-project-access-scope="WORKSPACE_READ"><i class="fa-solid fa-eye"></i><span><strong>그룹 멤버 전체 읽기</strong><small>비참여 멤버는 읽기 전용</small></span></button>
                                </div>
                                <p class="moyo-project-form__error" data-project-form-error="access" hidden></p>
                            </div>
                        </c:when>
                        <c:otherwise><input type="hidden" data-project-access-input value="OWNER_ONLY"></c:otherwise>
                    </c:choose>
                </div>

                <div class="project-settings-section project-settings-links">
                    <div class="project-settings-subhead">
                        <div><h3>외부 링크</h3><p>Git, Notion, 문서 등 프로젝트에 필요한 링크입니다.</p></div>
                        <button type="button" class="project-settings-text-btn" data-add-project-link ${readOnlyProjectSettings ? 'disabled' : ''}>+ 링크 추가</button>
                    </div>
                    <div data-project-link-list>
                        <c:forEach var="link" items="${projectLinks}">
                            <div class="project-settings-link-row">
                                <input type="text" data-link-name maxlength="50" value="<c:out value='${link.LINK_NAME}'/>" placeholder="링크 이름" ${readOnlyProjectSettings ? 'disabled' : ''}>
                                <input type="url" data-link-url maxlength="500" value="<c:out value='${link.LINK_URL}'/>" placeholder="https://example.com" ${readOnlyProjectSettings ? 'disabled' : ''}>
                                <button type="button" data-remove-project-link ${readOnlyProjectSettings ? 'disabled' : ''}>×</button>
                            </div>
                        </c:forEach>
                    </div>
                </div>

            </form>

            <c:if test="${isProjectLeader}">
                <div class="project-settings-danger-zone">
                    <div>
                        <h3>프로젝트 삭제</h3>
                        <c:choose>
                            <c:when test="${projectDetail.status eq 'DELETE_PENDING'}"><p><c:out value="${projectDetail.deleteDeadlineDate}"/>에 최종 삭제될 예정입니다. 삭제 전까지 신청을 취소할 수 있습니다.</p></c:when>
                            <c:otherwise><p>그룹 프로젝트에서 팀장만 남아 있으면 즉시 삭제됩니다. 다른 참여자가 있거나 개인 프로젝트인 경우 30일간 삭제 예정 상태로 전환되며, 30일 안에는 삭제를 취소할 수 있습니다.</p></c:otherwise>
                        </c:choose>
                    </div>
                    <c:choose>
                        <c:when test="${projectDetail.status eq 'DELETE_PENDING'}"><button type="button" class="project-settings-btn project-settings-btn--danger-ghost" data-cancel-project-delete>삭제 신청 취소</button></c:when>
                        <c:otherwise><button type="button" class="project-settings-btn project-settings-btn--danger" data-request-project-delete>프로젝트 삭제</button></c:otherwise>
                    </c:choose>
                </div>
            </c:if>
        </section>
    </div>
</main>

<div class="project-settings-confirm" data-project-confirm hidden>
    <button type="button" class="project-settings-confirm__backdrop" data-project-confirm-cancel></button>
    <section class="project-settings-confirm__dialog"><h3 data-project-confirm-title>확인</h3><p data-project-confirm-message></p><input type="text" data-project-confirm-input hidden><div><button type="button" class="project-settings-btn project-settings-btn--ghost" data-project-confirm-cancel>취소</button><button type="button" class="project-settings-btn project-settings-btn--danger" data-project-confirm-ok>확인</button></div></section>
</div>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
