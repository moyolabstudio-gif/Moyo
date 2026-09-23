<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="moyoTabFaviconManaged" value="true" scope="request" />
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><c:out value="${projectDetail.projName}"/> | MOYO</title>
    <c:choose>
        <c:when test="${groupProject and not empty projectWorkspace.wsImagePath}">
            <link rel="icon" href="<c:out value='${projectWorkspace.wsImagePath}'/>">
        </c:when>
        <c:otherwise>
            <link rel="icon" type="image/png" href="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-tab-mascot-v1">
        </c:otherwise>
    </c:choose>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=primary-gradient-135-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectSettings.css?v=project-settings-group-parity-20260909">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonProjectForm.css?v=project-form-common-v1-20260921">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonSettings.css?v=member-trigger-fix-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberActivityProfile.css?v=step25-regression-restore-20260911">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonProjectTaskStatus.css?v=project-task-status-settings-fix-v1-20260910">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=primary-gradient-135-v1-20260910">
    <script defer src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=202608081545-unified-people-shell"></script>
    <script defer src="${pageContext.request.contextPath}/js/projectMemberPeopleAdapter.js?v=project-scope-branch-v1-20260910"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberActivityProfile.js?v=step25-regression-restore-20260911"></script>
</head>
<body class="${readOnlyProjectSettings ? 'project-settings-readonly' : 'project-settings-editable'} ${groupProject ? 'group-project-settings' : 'personal-project-settings'}" data-context-path="${pageContext.request.contextPath}" data-member-activity-mode="PROJECT" data-main-shell-mode="${groupProject ? 'GROUP_PROJECT' : 'PERSONAL_PROJECT'}" data-project-scope="${groupProject ? 'GROUP' : 'PERSONAL'}" data-ws-id="${groupProject ? wsId : ''}" data-proj-id="${projId}" data-current-user-id="${sessionScope.user.userId}" data-scope-status="<c:out value='${projectDetail.status}'/>">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="project-settings-page moyo-settings-page moyo-settings-page--project">
        <header class="settings-page-header">
            <div class="settings-page-heading">
                <a href="#" onclick="history.back(); return false;"
                   class="settings-page-back-link" aria-label="이전 화면으로 돌아가기">
                    <span aria-hidden="true">←</span> 뒤로
                </a>
                <h1>프로젝트 설정</h1>
                <p>
                    <c:out value="${projectDetail.projName}"/>의 정보, 기간, 외부 링크<c:if test="${groupProject}">와 멤버 권한</c:if>을 관리합니다.
                </p>
            </div>
            <c:if test="${canManageProject}">
                <div id="projectSettingsPageActions" class="settings-page-actions">
                    <button type="button"
                            id="projectSettingsSaveButton"
                            class="settings-btn settings-btn-primary"
                            aria-busy="false"
                            onclick="saveProjectInfo()">변경사항 저장</button>
                </div>
            </c:if>
        </header>

        <c:if test="${readOnlyProjectSettings}">
            <section class="project-settings-readonly-notice"
                     role="status"
                     aria-label="읽기 전용 안내">
                <div>
                    <strong>읽기 전용으로 보고 있습니다.</strong>
                    <p>프로젝트 팀장과 관리자만 기본 정보와 멤버 설정을 변경할 수 있습니다.</p>
                </div>
                <span class="project-settings-role-badge">
                    <c:choose>
                        <c:when test="${currentProjectRole eq 'LEADER'}">팀장</c:when>
                        <c:when test="${currentProjectRole eq 'ADMIN'}">관리자</c:when>
                        <c:when test="${currentProjectRole eq 'GROUP_MEMBER'}">그룹 멤버</c:when>
                        <c:otherwise>멤버</c:otherwise>
                    </c:choose>
                </span>
            </section>
        </c:if>

        <div class="settings-tabs" role="tablist" aria-label="프로젝트 설정 메뉴">
            <button type="button"
                    class="settings-tab-button"
                    data-tab="basic"
                    onclick="switchProjectSettingsTab('basic')">기본 설정</button>
            <c:if test="${groupProject}">
                <button type="button"
                        class="settings-tab-button"
                        data-tab="members"
                        onclick="switchProjectSettingsTab('members')">멤버 관리</button>
            </c:if>
        </div>

        <div class="settings-layout">
            <section id="projectSettingsBasic" class="settings-tab-panel">
                <div class="settings-card settings-main-panel">
                    <form id="projectSettingsForm"
                          class="moyo-settings-form"
                          data-project-form-common
                          data-readonly="${readOnlyProjectSettings}"
                          aria-readonly="${readOnlyProjectSettings}"
                          onsubmit="return false;">
                        <section class="settings-section">
                            <div class="settings-section-head">
                                <h2>기본 정보</h2>
                                <p>프로젝트 이름, 유형, 기간과 설명을 수정합니다.</p>
                            </div>

                            <div class="settings-form-grid">
                                <div class="moyo-project-form__group form-group full" data-project-field="name">
                                    <div class="moyo-project-form__label-row">
                                        <label class="moyo-project-form__label" for="settingProjName">프로젝트 이름 <span class="moyo-project-form__required">*</span></label>
                                        <span class="moyo-project-form__help">80자 이내로 입력하세요.</span>
                                    </div>
                                    <input type="text"
                                           id="settingProjName"
                                           class="form-control moyo-project-form__control"
                                           maxlength="80"
                                           data-project-name
                                           value="<c:out value='${projectDetail.projName}'/>"
                                           placeholder="프로젝트 이름">
                                    <p class="moyo-project-form__error" data-project-form-error="name" hidden></p>
                                </div>

                                <div class="moyo-project-form__group form-group full" data-project-field="type">
                                    <div class="moyo-project-form__label-row">
                                        <span class="moyo-project-form__label">프로젝트 유형 <span class="moyo-project-form__required">*</span></span>
                                        <span class="moyo-project-form__help">생성 화면과 같은 유형 체계를 사용합니다.</span>
                                    </div>
                                    <input type="hidden" id="settingProjType" data-project-type-input value="<c:out value='${projectDetail.projType}'/>">
                                    <div class="moyo-project-type-picker" data-project-type-picker>
                                        <c:forEach items="${projectTypeGroups}" var="group">
                                            <div class="moyo-project-type-group">
                                                <span class="moyo-project-type-group__title"><c:out value="${group.label}" /></span>
                                                <div class="moyo-project-type-grid">
                                                    <c:forEach items="${group.types}" var="type">
                                                        <button type="button" class="moyo-project-type-option"
                                                                data-project-type="${type.code}"
                                                                data-project-default-icon="${type.defaultIcon}"
                                                                data-project-recommended-icons="${type.recommendedIcons}"
                                                                aria-pressed="false">
                                                            <span class="moyo-project-type-option__icon"><i class="fa-solid fa-${type.defaultIcon}" aria-hidden="true"></i></span>
                                                            <span class="moyo-project-type-option__copy">
                                                                <span class="moyo-project-type-option__name"><c:out value="${type.label}" /></span>
                                                                <span class="moyo-project-type-option__description"><c:out value="${type.description}" /></span>
                                                            </span>
                                                        </button>
                                                    </c:forEach>
                                                </div>
                                            </div>
                                        </c:forEach>
                                    </div>
                                    <p class="moyo-project-form__error" data-project-form-error="type" hidden></p>
                                </div>

                                <div class="moyo-project-form__group form-group full" data-project-field="icon">
                                    <div class="moyo-project-form__label-row">
                                        <span class="moyo-project-form__label">프로젝트 아이콘</span>
                                        <span class="moyo-project-form__help">프로젝트 카드와 달력에서 함께 사용됩니다.</span>
                                    </div>
                                    <input type="hidden" id="settingProjIcon" data-project-icon-input value="<c:out value='${projectDetail.projIcon}'/>">
                                    <div class="moyo-project-icon-picker" data-project-icon-picker>
                                        <div class="moyo-project-icon-summary">
                                            <span class="moyo-project-icon-current" data-project-icon-current></span>
                                            <span class="moyo-project-icon-summary__copy">
                                                <strong data-project-icon-current-label>선택한 아이콘</strong>
                                                <span>유형에 맞는 아이콘을 선택할 수 있습니다.</span>
                                            </span>
                                            <button type="button" class="moyo-project-icon-toggle" data-project-icon-toggle aria-expanded="false" data-open-label="아이콘 변경" data-close-label="닫기">아이콘 변경</button>
                                        </div>
                                        <div class="moyo-project-icon-options" data-project-icon-options hidden>
                                            <c:forEach items="${projectIconOptions}" var="icon">
                                                <button type="button" class="moyo-project-icon-option" data-project-icon="${icon.key}" data-project-icon-label="${icon.label}" aria-pressed="false" title="${icon.label}">
                                                    <span class="moyo-project-icon-option__icon"><i class="fa-solid fa-${icon.key}" aria-hidden="true"></i></span>
                                                </button>
                                            </c:forEach>
                                        </div>
                                    </div>
                                    <p class="moyo-project-form__error" data-project-form-error="icon" hidden></p>
                                </div>

                                <div class="moyo-project-form__group form-group full" data-project-field="description">
                                    <div class="moyo-project-form__label-row">
                                        <label class="moyo-project-form__label" for="settingProjDesc">프로젝트 설명</label>
                                        <span class="moyo-project-form__help">목표나 준비할 내용을 간단히 적어두세요.</span>
                                    </div>
                                    <div class="moyo-project-description-wrap">
                                        <textarea id="settingProjDesc"
                                                  class="form-control moyo-project-form__control"
                                                  maxlength="1000"
                                                  rows="3"
                                                  data-project-description
                                                  placeholder="프로젝트 설명을 입력하세요."><c:out value="${projectDetail.projDesc}"/></textarea>
                                        <span class="moyo-project-description-count" data-project-description-count>0 / 1000</span>
                                    </div>
                                </div>

                                <div class="moyo-project-form__group form-group full" data-project-field="period">
                                    <div class="moyo-project-form__label-row">
                                        <span class="moyo-project-form__label">프로젝트 기간</span>
                                        <span class="moyo-project-form__help">기간이 없는 프로젝트는 언제든 다시 지정할 수 있습니다.</span>
                                    </div>
                                    <input type="hidden" id="settingPeriodEnabledYn" data-project-period-enabled-input value="<c:out value='${projectDetail.periodEnabledYn}'/>">
                                    <div class="moyo-project-period-picker" data-project-period-picker>
                                        <div class="moyo-project-choice-grid">
                                            <button type="button" class="moyo-project-choice" data-project-period-mode="N" aria-pressed="false">
                                                <span class="moyo-project-choice__icon"><i class="fa-regular fa-calendar-xmark" aria-hidden="true"></i></span>
                                                <span class="moyo-project-choice__copy"><strong>기간 없음</strong><span>종료 시점을 정하지 않고 진행합니다.</span></span>
                                            </button>
                                            <button type="button" class="moyo-project-choice" data-project-period-mode="Y" aria-pressed="false">
                                                <span class="moyo-project-choice__icon"><i class="fa-regular fa-calendar-check" aria-hidden="true"></i></span>
                                                <span class="moyo-project-choice__copy"><strong>기간 지정</strong><span>시작일과 종료일을 캘린더에 표시합니다.</span></span>
                                            </button>
                                        </div>
                                        <div class="moyo-project-period-fields" data-project-period-fields hidden>
                                            <div class="moyo-project-period-field">
                                                <label for="settingStartDate">시작일</label>
                                                <input type="text" id="settingStartDate" class="form-control moyo-project-form__control project-date-input" value="${projectDetail.startDate}" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-project-period-start data-project-date-picker readonly>
                                            </div>
                                            <span class="moyo-project-period-separator">→</span>
                                            <div class="moyo-project-period-field">
                                                <label for="settingEndDate">종료일</label>
                                                <input type="text" id="settingEndDate" class="form-control moyo-project-form__control project-date-input" value="${projectDetail.endDate}" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-project-period-end data-project-date-picker readonly>
                                            </div>
                                        </div>
                                        <div class="moyo-project-period-summary" data-project-period-summary></div>
                                    </div>
                                    <p class="moyo-project-form__error" data-project-form-error="period" hidden></p>
                                </div>

                                <c:choose>
                                    <c:when test="${groupProject}">
                                        <div class="moyo-project-form__group form-group full" data-project-field="access">
                                            <div class="moyo-project-form__label-row">
                                                <span class="moyo-project-form__label">프로젝트 공개 범위</span>
                                                <span class="moyo-project-form__help">참여하지 않은 그룹 멤버의 진입 가능 여부를 정합니다.</span>
                                            </div>
                                            <input type="hidden" id="settingAccessScope" data-project-access-input value="<c:out value='${projectDetail.accessScope}'/>">
                                            <div class="moyo-project-access-picker" data-project-access-picker>
                                                <div class="moyo-project-choice-grid">
                                                    <button type="button" class="moyo-project-choice" data-project-access-scope="PARTICIPANTS" aria-pressed="false">
                                                        <span class="moyo-project-choice__icon"><i class="fa-solid fa-lock" aria-hidden="true"></i></span>
                                                        <span class="moyo-project-choice__copy"><strong>참여자만</strong><span>팀장·관리자·참여 멤버만 프로젝트에 들어올 수 있습니다.</span></span>
                                                    </button>
                                                    <button type="button" class="moyo-project-choice" data-project-access-scope="WORKSPACE_READ" aria-pressed="false">
                                                        <span class="moyo-project-choice__icon"><i class="fa-solid fa-eye" aria-hidden="true"></i></span>
                                                        <span class="moyo-project-choice__copy"><strong>그룹 멤버 전체 읽기</strong><span>비참여 멤버도 읽기 전용으로 프로젝트를 볼 수 있습니다.</span></span>
                                                    </button>
                                                </div>
                                            </div>
                                            <p class="moyo-project-form__error" data-project-form-error="access" hidden></p>
                                        </div>
                                    </c:when>
                                    <c:otherwise>
                                        <input type="hidden" id="settingAccessScope" data-project-access-input value="OWNER_ONLY">
                                    </c:otherwise>
                                </c:choose>
                            </div>
                        </section>

                        <section class="settings-section settings-link-section">
                            <div class="settings-section-head settings-section-head-with-action">
                                <div>
                                    <h2>외부 링크</h2>
                                    <p>등록된 링크는 프로젝트 히어로 영역에 표시됩니다.</p>
                                </div>
                                <div class="project-link-head-actions">
                                    <span class="project-link-count-wrap">
                                        
                                        <strong id="projectSettingLinkCount" class="project-link-count">${fn:length(projectLinks)} / 5</strong>
                                    </span>
                                    <c:if test="${canManageProject}">
                                        <button type="button" id="projectSettingLinkAddButton" class="project-link-add" onclick="addProjectSettingLink()">+ 링크 추가</button>
                                    </c:if>
                                </div>
                            </div>

                            <div id="projectSettingLinkList" class="project-settings-link-list">
                                <c:choose>
                                    <c:when test="${not empty projectLinks}">
                                        <c:forEach var="link" items="${projectLinks}">
                                            <div class="project-settings-link-row">
                                                <input type="text"
                                                       class="project-setting-link-name form-control"
                                                       maxlength="50"
                                                       value="<c:out value='${link.LINK_NAME}'/>"
                                                       placeholder="링크 이름"
                                                       <c:if test="${!canManageProject}">disabled</c:if>>
                                                <input type="url"
                                                       class="project-setting-link-url form-control"
                                                       maxlength="500"
                                                       value="<c:out value='${link.LINK_URL}'/>"
                                                       placeholder="https://example.com"
                                                       inputmode="url"
                                                       autocomplete="url"
                                                       <c:if test="${!canManageProject}">disabled</c:if>>
                                                <c:if test="${canManageProject}">
                                                    <button type="button"
                                                            class="project-setting-link-remove"
                                                            aria-label="링크 삭제"
                                                            onclick="removeProjectSettingLink(this)">×</button>
                                                </c:if>
                                            </div>
                                        </c:forEach>
                                    </c:when>
                                    <c:otherwise>
                                        <div class="project-settings-link-row">
                                            <input type="text" class="project-setting-link-name form-control" maxlength="50" placeholder="링크 이름" <c:if test="${!canManageProject}">disabled</c:if>>
                                            <input type="url" class="project-setting-link-url form-control" maxlength="500" placeholder="https://example.com" inputmode="url" autocomplete="url" <c:if test="${!canManageProject}">disabled</c:if>>
                                            <c:if test="${canManageProject}">
                                                <button type="button" class="project-setting-link-remove" aria-label="링크 삭제" onclick="removeProjectSettingLink(this)">×</button>
                                            </c:if>
                                        </div>
                                    </c:otherwise>
                                </c:choose>
                            </div>
                            <p class="project-link-help">외부 링크는 최대 5개까지 등록할 수 있습니다.</p>
                        </section>
                    </form>
                </div>

                <c:if test="${isProjectLeader}">
                    <section class="settings-side-card danger-zone ${projectDetail.status eq 'DELETE_PENDING' ? 'is-delete-pending' : ''}">
                        <div class="danger-zone-copy">
                            <h3>위험 구역</h3>
                            <c:choose>
                                <c:when test="${projectDetail.status eq 'DELETE_PENDING'}">
                                    <p>
                                        이 프로젝트는 삭제 신청 상태입니다.
                                        <strong><c:out value="${projectDetail.deleteDeadlineDate}"/></strong>에 최종 삭제될 예정입니다.
                                    </p>
                                </c:when>
                                <c:otherwise>
                                    <p>팀장 혼자 참여 중이면 바로 삭제됩니다. 다른 참여자가 있으면 30일 삭제 예정 상태로 전환됩니다.</p>
                                </c:otherwise>
                            </c:choose>
                        </div>
                        <c:choose>
                            <c:when test="${projectDetail.status eq 'DELETE_PENDING'}">
                                <button type="button" class="btn-delete-cancel" onclick="cancelProjectDeletionFromSettings()">삭제 신청 취소</button>
                            </c:when>
                            <c:otherwise>
                                <button type="button" class="btn-delete" onclick="openProjectDeleteRequestModal()">삭제 신청</button>
                            </c:otherwise>
                        </c:choose>
                    </section>
                </c:if>
            </section>

            <c:if test="${groupProject}">
            <section id="projectSettingsMembers" class="settings-tab-panel">
                <div class="settings-card moyo-member-manage">
                    <div class="member-tab-head">
                        <div>
                            <h2>멤버 관리</h2>
                            <p>권한과 프로젝트 내 담당 역할을 관리합니다.</p>
                        </div>
                    </div>

                    <div class="project-member-toolbar project-wsmt-toolbar moyo-member-toolbar">
                        <div class="member-search-box moyo-member-search">
                            <input type="text"
                                   id="projectMemberSearchInput"
                                   placeholder="이름, 이메일, 역할로 검색"
                                   autocomplete="off"
                                   oninput="filterProjectSettingMembers()">
                        </div>

                        <div class="project-member-toolbar-actions moyo-member-toolbar-actions">
                            <span class="project-member-total moyo-member-total"
                                  id="projectMemberTotal">
                                전체 <strong><c:out value="${fn:length(projectMemberList)}"/></strong>명
                            </span>

                            <c:if test="${canManageProject and not readOnlyProjectSettings}">
                                <div class="project-member-view-actions moyo-member-view-actions">
                                    <button type="button"
                                            class="project-member-toolbar-button moyo-member-action"
                                            onclick="enterProjectMemberEditMode()">권한 수정</button>
                                    <button type="button"
                                            class="project-member-toolbar-button moyo-member-action is-danger-ghost"
                                            onclick="enterProjectMemberRemoveMode()">내보내기</button>
                                    <c:if test="${groupProject}">
                                        <button type="button"
                                                class="member-tab-invite moyo-member-invite"
                                                onclick="openProjectMemberAddModal()">+ 멤버 추가</button>
                                    </c:if>
                                </div>

                                <div class="project-member-edit-actions moyo-member-edit-actions">
                                    <button type="button"
                                            class="project-member-toolbar-button moyo-member-action"
                                            onclick="exitProjectMemberMode(true)">취소</button>
                                    <button type="button"
                                            id="projectMemberSaveButton"
                                            class="project-member-toolbar-button moyo-member-action is-primary"
                                            onclick="saveProjectMemberChanges()">변경사항 저장</button>
                                </div>

                                <div class="project-member-remove-actions moyo-member-remove-actions">
                                    <span id="projectMemberSelected"
                                          class="project-member-selected moyo-member-selected">선택 0명</span>
                                    <button type="button"
                                            class="project-member-toolbar-button moyo-member-action"
                                            onclick="exitProjectMemberMode(false)">취소</button>
                                    <button type="button"
                                            id="projectMemberRemoveConfirmButton"
                                            class="project-member-toolbar-button moyo-member-action is-danger"
                                            onclick="removeSelectedProjectMembers()"
                                            disabled>선택 내보내기</button>
                                </div>
                            </c:if>
                        </div>
                    </div>

                    <div class="project-wsmt-wrap moyo-member-table-wrap">
                        <table class="project-wsmt-table moyo-member-table">
                            <colgroup>
                                <col class="project-member-col-check">
                                <col class="project-member-col-person">
                                <col class="project-member-col-role">
                                <col class="project-member-col-position">
                                <col class="project-member-col-date">
                            </colgroup>
                            <thead>
                                <tr>
                                    <th class="project-member-check-cell moyo-member-check-cell">
                                        <input type="checkbox"
                                               id="projectMemberSelectAll"
                                               aria-label="검색된 멤버 전체 선택"
                                               onchange="toggleAllProjectMembers(this.checked)">
                                    </th>
                                    <th>멤버</th>
                                    <th>권한</th>
                                    <th>담당 역할</th>
                                    <th>프로젝트 참여일</th>
                                </tr>
                            </thead>
                            <tbody id="projectMemberManageList">
                                <c:forEach var="member" items="${projectMemberList}">
                                    <tr class="project-wsmt-row moyo-member-row"
                                        data-user-id="${member.USER_ID}"
                                        data-member-name="<c:out value='${member.USER_NAME}'/>"
                                        data-is-leader="${member.USER_ID eq projectDetail.leaderId}"
                                        data-is-current-user="${member.USER_ID eq sessionScope.user.userId}"
                                        data-role="${member.USER_ID eq projectDetail.leaderId ? 'LEADER' : member.PROJ_ROLE}"
                                        data-position="<c:out value='${member.PROJ_POSITION}'/>"
                                        data-search="${fn:toLowerCase(member.USER_NAME)} ${fn:toLowerCase(member.EMAIL)} ${fn:toLowerCase(member.PROJ_ROLE)} ${fn:toLowerCase(member.PROJ_POSITION)}">

                                        <td class="project-member-check-cell moyo-member-check-cell">
                                            <input type="checkbox"
                                                   class="project-member-select"
                                                   value="${member.USER_ID}"
                                                   aria-label="<c:out value='${member.USER_NAME}'/> 선택"
                                                   <c:choose>
                                                       <c:when test="${member.USER_ID eq projectDetail.leaderId}">disabled title="팀장은 내보낼 수 없습니다."</c:when>
                                                       <c:when test="${member.USER_ID eq sessionScope.user.userId}">disabled title="본인은 내보낼 수 없습니다."</c:when>
                                                       <c:when test="${not isProjectLeader and member.PROJ_ROLE eq 'ADMIN'}">disabled title="관리자는 다른 관리자를 내보낼 수 없습니다."</c:when>
                                                   </c:choose>
                                                   onchange="syncProjectMemberSelection()">
                                        </td>

                                        <td class="project-wsmt-person-cell moyo-member-person-cell">
                                            <div class="project-wsmt-person moyo-member-person">
                                                <button type="button"
                                                        class="project-member-profile-trigger moyo-member-profile-trigger"
                                                        aria-label="<c:out value='${member.USER_NAME}'/> 프로젝트 프로필 보기"
                                                        onclick="openProjectMemberProfile(${member.USER_ID})">
                                                    <span class="project-wsmt-avatar moyo-member-avatar ${not empty member.PROFILE_IMAGE_PATH ? 'has-image' : 'is-default-profile'}">
                                                    <c:choose>
                                                        <c:when test="${not empty member.PROFILE_IMAGE_PATH}">
                                                            <img src="<c:out value='${member.PROFILE_IMAGE_PATH}'/>"
                                                                 alt="<c:out value='${member.USER_NAME}'/> 프로필"
                                                                 onerror="this.closest('.project-wsmt-avatar').classList.remove('has-image'); this.closest('.project-wsmt-avatar').classList.add('is-default-profile'); this.remove();">
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="project-wsmt-avatar-fallback moyo-member-avatar-fallback">
                                                                <c:out value="${fn:substring(member.USER_NAME,0,1)}"/>
                                                            </span>
                                                        </c:otherwise>
                                                    </c:choose>
                                                    </span>
                                                </button>

                                                <div class="project-wsmt-person-copy moyo-member-copy">
                                                    <button type="button" class="project-member-name-button moyo-member-name-button" onclick="openProjectMemberProfile(${member.USER_ID})">
                                                        <strong class="project-wsmt-name moyo-member-name">
                                                            <c:out value="${member.USER_NAME}"/>
                                                        </strong>
                                                    </button>
                                                    <span class="project-wsmt-email moyo-member-email">
                                                        <c:out value="${member.EMAIL}"/>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td class="project-wsmt-role-cell moyo-member-role-cell">
                                            <span class="project-member-role-summary moyo-member-role
                                                ${member.USER_ID eq projectDetail.leaderId ? 'is-leader' : (member.PROJ_ROLE eq 'ADMIN' ? 'is-admin' : '')}">
                                                <c:choose>
                                                    <c:when test="${member.USER_ID eq projectDetail.leaderId}">팀장</c:when>
                                                    <c:when test="${member.PROJ_ROLE eq 'ADMIN'}">관리자</c:when>
                                                    <c:otherwise>멤버</c:otherwise>
                                                </c:choose>
                                            </span>

                                            <c:if test="${member.USER_ID ne projectDetail.leaderId}">
                                                <select class="project-member-role-edit moyo-member-role-edit"
                                                        disabled
                                                        aria-label="<c:out value='${member.USER_NAME}'/> 권한">
                                                    <option value="MEMBER"
                                                            ${member.PROJ_ROLE ne 'ADMIN' ? 'selected' : ''}>멤버</option>
                                                    <option value="ADMIN"
                                                            ${member.PROJ_ROLE eq 'ADMIN' ? 'selected' : ''}>관리자</option>
                                                    <c:if test="${isProjectLeader}">
                                                        <option value="LEADER">팀장 위임</option>
                                                    </c:if>
                                                </select>
                                            </c:if>
                                        </td>

                                        <td class="project-wsmt-position-cell moyo-member-position-cell">
                                            <span class="project-member-position-summary moyo-member-position
                                                ${empty member.PROJ_POSITION ? 'is-empty' : ''}">
                                                <c:choose>
                                                    <c:when test="${not empty member.PROJ_POSITION}">
                                                        <c:out value="${member.PROJ_POSITION}"/>
                                                    </c:when>
                                                    <c:otherwise>미지정</c:otherwise>
                                                </c:choose>
                                            </span>

                                            <input type="text"
                                                   class="project-member-position-edit moyo-member-position-edit"
                                                   value="<c:out value='${member.PROJ_POSITION}'/>"
                                                   placeholder="담당 역할"
                                                   maxlength="100"
                                                   disabled>
                                        </td>

                                        <td class="project-wsmt-date-cell moyo-member-date-cell">
                                            <c:choose>
                                                <c:when test="${not empty member.PROJ_JOINED_AT}">
                                                    <c:out value="${member.PROJ_JOINED_AT}"/>
                                                </c:when>
                                                <c:otherwise>-</c:otherwise>
                                            </c:choose>
                                        </td>
                                    </tr>
                                </c:forEach>
                            </tbody>
                        </table>
                    </div>

                    <div id="projectMemberEmpty"
                         class="project-member-empty moyo-member-empty">검색 결과가 없습니다.</div>

                    <p id="projectMemberModeNote"
                       class="project-member-role-note moyo-member-note">
                        <c:choose>
                            <c:when test="${projectDetail.status eq 'DELETE_PENDING'}">
                                삭제 예정 상태에서는 프로젝트 멤버 권한 변경·추가·내보내기를 할 수 없습니다. 삭제 신청 취소 후 다시 관리할 수 있습니다.
                            </c:when>
                            <c:when test="${isProjectLeader}">
                                프로젝트 멤버의 권한과 담당 역할을 관리합니다. 팀장 위임은 권한 수정에서 새 팀장을 선택해 진행합니다.
                            </c:when>
                            <c:when test="${canManageProject}">
                                프로젝트 멤버의 권한과 담당 역할을 관리합니다. 본인의 권한은 직접 변경할 수 없습니다.
                            </c:when>
                            <c:otherwise>
                                멤버 정보는 조회만 가능하며 변경할 수 없습니다.
                            </c:otherwise>
                        </c:choose>
                    </p>
                </div>
            </section>
            </c:if>
        </div>
    </main>


    <div id="projectDeleteRequestModal" class="project-delete-request-modal" hidden>
        <div class="project-delete-request-backdrop" onclick="closeProjectDeleteRequestModal()"></div>
        <section class="project-delete-request-dialog"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="projectDeleteRequestTitle">
            <button type="button"
                    class="project-delete-request-close"
                    aria-label="닫기"
                    onclick="closeProjectDeleteRequestModal()">×</button>

            <span class="project-delete-request-eyebrow">프로젝트 삭제</span>
            <h2 id="projectDeleteRequestTitle">
                <c:out value="${projectDetail.projName}"/>을 삭제할까요?
            </h2>
            <p class="project-delete-request-description">
                팀장 외 참여자가 없으면 즉시 삭제됩니다.
                다른 참여자가 있으면 30일 동안 취소 가능한 삭제 예정 상태로 전환됩니다.
            </p>

            <div class="project-delete-request-notice">
                <strong>삭제 정책</strong>
                <span id="projectDeleteExpectedDate">참여자 유무에 따라 즉시 삭제 또는 30일 유예</span>
            </div>

            <label class="project-delete-confirm-field">
                <span>확인을 위해 프로젝트 이름을 입력하세요.</span>
                <input type="text"
                       id="projectDeleteConfirmName"
                       autocomplete="off"
                       placeholder="<c:out value='${projectDetail.projName}'/>">
            </label>

            <div class="project-delete-request-actions">
                <button type="button"
                        class="project-delete-request-secondary"
                        onclick="closeProjectDeleteRequestModal()">닫기</button>
                <button type="button"
                        id="projectDeleteRequestSubmit"
                        class="project-delete-request-primary"
                        onclick="requestProjectDeletionFromSettings()">삭제 신청</button>
            </div>
        </section>
    </div>

    <%@ include file="../common/commonMemberActivityProfile.jspf" %>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        window.PROJECT_SETTINGS_CONFIG = {
            contextPath: '${pageContext.request.contextPath}',
            wsId: '${groupProject ? wsId : ''}',
            projId: '${projId}',
            projectScope: '${groupProject ? 'GROUP' : 'PERSONAL'}',
            groupProject: ${groupProject},
            isPersonalProject: ${!groupProject},
            currentUserId: Number('${sessionScope.user.userId}'),
            canManageProject: ${canManageProject},
            readOnlyProjectSettings: ${readOnlyProjectSettings},
            currentProjectRole: '${currentProjectRole}',
            isProjectLeader: ${isProjectLeader},
            projectName: '<c:out value="${fn:escapeXml(projectDetail.projName)}"/>',
            deleteStatus: '<c:out value="${projectDetail.status}"/>',
            deleteDeadlineDate: '<c:out value="${projectDetail.deleteDeadlineDate}"/>'
        };
    </script>
    <script src="${pageContext.request.contextPath}/js/commonProjectForm.js?v=project-form-common-v1-20260921"></script>
    <script src="${pageContext.request.contextPath}/js/projectSettings.js?v=20260921-common-project-form-recovery-1"></script>
</body>
</html>
