<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO - 새 프로젝트 생성</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=moyo-ui-controls-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonProjectForm.css?v=20260921-project-form-common-1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectCreate.css?v=20260923-member-step-detail-finish-1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoCreate.css?v=20260923-project-step1-simple-1">
</head>
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<div class="project-create-page"
     data-context-path="${pageContext.request.contextPath}"
     data-ws-id="${wsId}"
     data-initial-scope="${initialScope}"
     data-personal-entry="${personalEntry}"
     data-group-entry="${groupEntry}"
     data-current-user-id="${sessionScope.user.userId}"
     data-current-user-name="${sessionScope.user.userName}"
     data-current-user-profile-image="${sessionScope.user.profileImagePath}"
     data-can-create-group-project="${canCreateGroupProject}">

    <main class="project-create-shell moyo-create-shell">
        <section class="project-create-card moyo-create-card">
            <c:if test="${groupEntry and not canCreateGroupProject}">
                <div class="project-create-permission-notice" role="alert">
                    <strong>그룹 프로젝트를 만들 수 없어요.</strong>
                    <p>그룹 프로젝트는 그룹장 또는 관리자만 만들 수 있어요.</p>
                    <button type="button" class="btn primary" onclick="history.back()">그룹으로 돌아가기</button>
                </div>
            </c:if>
            <div class="project-create-content${groupEntry and not canCreateGroupProject ? ' is-blocked' : ''}">
            <div class="create-step moyo-create-step" id="createStepLabel">1 / 2</div>

            <div class="create-title-row moyo-create-header">
                <div>
                    <h1 id="createTitle">새 프로젝트 만들기</h1>
                    <p id="createSubTitle">함께 진행할 프로젝트를 만들어보세요.</p>
                </div>
                <div class="project-create-title-actions">
                    <c:if test="${groupEntry}">
                        <div class="project-create-group-mini" title="<c:out value='${workspace.wsName}'/>">
                            <span class="project-create-group-mini__avatar${empty workspace.wsImagePath ? ' is-default' : ' has-image'}">
                                <c:if test="${not empty workspace.wsImagePath}">
                                    <img src="<c:out value='${workspace.wsImagePath}'/>" alt="" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
                                </c:if>
                                <span class="project-create-group-mini__fallback" ${not empty workspace.wsImagePath ? 'hidden' : ''}><c:choose><c:when test="${not empty workspace.wsName}"><c:out value="${fn:toUpperCase(fn:substring(fn:trim(workspace.wsName), 0, 1))}"/></c:when><c:otherwise>G</c:otherwise></c:choose></span>
                            </span>
                            <span class="project-create-group-mini__copy"><strong><c:out value="${workspace.wsName}"/></strong></span>
                        </div>
                    </c:if>
                    <button type="button" id="btnCancelTop" class="btn ghost small moyo-create-back-button">돌아가기</button>
                </div>
            </div>

            <section id="stepBasic" class="project-step-panel moyo-create-panel is-active" data-step="1">
                <section class="create-card basic-card" data-project-form-common>

                    <div class="create-form-grid">
                        <div class="moyo-project-form__group field full project-create-type-field moyo-create-field" data-project-field="type">
                            <div class="moyo-project-form__label-row project-create-type-label-row moyo-create-label-row">
                                <span class="moyo-project-form__label moyo-create-label">프로젝트 유형 <span class="moyo-project-form__required moyo-create-required">*</span></span>
                                <span class="moyo-project-form__help moyo-create-help">가장 가까운 유형을 선택하세요.</span>
                            </div>
                            <input type="hidden" id="projType" data-project-type-input value="WORK">
                            <input type="hidden" id="projIcon" data-project-icon-input value="briefcase">
                            <div class="moyo-project-type-picker project-create-type-picker moyo-create-type-picker" data-project-type-picker>
                                <div class="moyo-project-type-grid project-create-type-grid moyo-create-type-grid moyo-create-type-grid--project">
                                    <c:forEach items="${projectTypeGroups}" var="group">
                                        <c:forEach items="${group.types}" var="type">
                                            <c:if test="${type.code ne 'LIFE' and type.code ne 'RECORD'}">
                                            <button type="button" class="moyo-project-type-option project-create-type-option moyo-create-type-option"
                                                    data-project-type="${type.code}"
                                                    data-project-default-icon="${type.defaultIcon}"
                                                    data-project-recommended-icons="${type.recommendedIcons}"
                                                    aria-pressed="false"
                                                    title="${type.label}">
                                                <span class="moyo-project-type-option__icon moyo-create-type-option__icon"><i class="fa-solid fa-${type.defaultIcon}" aria-hidden="true"></i></span>
                                                <span class="moyo-project-type-option__name moyo-create-type-option__name"><c:out value="${type.label}" /></span>
                                            </button>
                                            </c:if>
                                        </c:forEach>
                                    </c:forEach>
                                </div>
                            </div>
                            <p class="moyo-project-form__error moyo-create-error" data-project-form-error="type" hidden></p>
                        </div>


                        <div class="moyo-project-form__group field full moyo-create-field" data-project-field="name">
                            <div class="moyo-project-form__label-row moyo-create-label-row">
                                <label class="moyo-project-form__label moyo-create-label" for="projName">프로젝트명 <span class="moyo-project-form__required moyo-create-required">*</span></label>
                                <span class="project-name-count moyo-create-count"><span id="projectNameCount">0</span> / 80</span>
                            </div>
                            <input class="moyo-project-form__control moyo-create-control" type="text" id="projName" maxlength="80" data-project-name placeholder="예: 여름 제주도 가족여행">
                            <p class="moyo-project-form__error moyo-create-error" data-project-form-error="name" hidden></p>
                        </div>
                        <div class="moyo-project-form__group field full moyo-create-field" data-project-field="description">
                            <div class="moyo-project-form__label-row moyo-create-label-row">
                                <label class="moyo-project-form__label moyo-create-label" for="projDesc">프로젝트 설명</label>
                                <span class="moyo-project-form__help moyo-create-help">목표나 준비할 내용을 간단히 적어두세요.</span>
                            </div>
                            <div class="moyo-project-description-wrap moyo-create-textarea-wrap">
                                <textarea class="moyo-project-form__control moyo-create-control" id="projDesc" rows="3" maxlength="1000" data-project-description placeholder="프로젝트 목표나 준비할 내용을 간단히 입력하세요."></textarea>
                                <span class="moyo-project-description-count moyo-create-count" data-project-description-count>0 / 1000</span>
                            </div>
                        </div>

                        <div class="moyo-project-form__group field full moyo-create-field project-period-field" data-project-field="period">
                            <div class="moyo-project-form__label-row moyo-create-label-row project-period-label-row">
                                <div>
                                    <span class="moyo-project-form__label moyo-create-label">프로젝트 기간</span>
                                    <span class="moyo-project-form__help moyo-create-help project-period-help">필요할 때만 시작일과 종료일을 지정하세요.</span>
                                </div>
                                <input type="hidden" id="periodEnabledYn" data-project-period-enabled-input value="N">
                                <div class="project-period-mode" role="group" aria-label="프로젝트 기간 설정">
                                    <button type="button" class="project-period-mode__button" data-project-period-mode="N" aria-pressed="true">
                                        <i class="fa-regular fa-calendar-xmark" aria-hidden="true"></i><span>기간 없음</span>
                                    </button>
                                    <button type="button" class="project-period-mode__button" data-project-period-mode="Y" aria-pressed="false">
                                        <i class="fa-regular fa-calendar-check" aria-hidden="true"></i><span>기간 지정</span>
                                    </button>
                                </div>
                            </div>
                            <div class="moyo-project-period-picker project-period-picker" data-project-period-picker>
                                <div class="moyo-project-period-fields project-period-dates" data-project-period-fields hidden>
                                    <label class="project-period-input" for="startDate">
                                        <span class="project-period-input__icon"><i class="fa-regular fa-calendar" aria-hidden="true"></i></span>
                                        <span class="project-period-input__copy">
                                            <span class="project-period-input__label">시작일</span>
                                            <input type="text" id="startDate" class="moyo-project-form__control project-date-input project-period-date-input" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-project-period-start data-project-date-picker readonly>
                                        </span>
                                    </label>
                                    <span class="moyo-project-period-separator project-period-separator" aria-hidden="true">—</span>
                                    <label class="project-period-input" for="endDate">
                                        <span class="project-period-input__icon"><i class="fa-regular fa-calendar" aria-hidden="true"></i></span>
                                        <span class="project-period-input__copy">
                                            <span class="project-period-input__label">종료일</span>
                                            <input type="text" id="endDate" class="moyo-project-form__control project-date-input project-period-date-input" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-project-period-end data-project-date-picker readonly>
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <p class="moyo-project-form__error moyo-create-error" data-project-form-error="period" hidden></p>
                        </div>

                        <c:choose>
                            <c:when test="${groupEntry}">
                                <div class="moyo-project-form__group field full moyo-create-field" data-project-field="access">
                                    <div class="moyo-project-form__label-row moyo-create-label-row">
                                        <span class="moyo-project-form__label moyo-create-label">프로젝트 공개 범위</span>
                                        <span class="moyo-project-form__help moyo-create-help">프로젝트를 볼 수 있는 범위를 선택하세요.</span>
                                    </div>
                                    <input type="hidden" id="accessScope" data-project-access-input value="PARTICIPANTS">
                                    <div class="moyo-project-access-picker" data-project-access-picker>
                                        <div class="moyo-project-choice-grid moyo-create-choice-grid moyo-create-choice-grid--2">
                                            <button type="button" class="moyo-project-choice moyo-create-choice" data-project-access-scope="PARTICIPANTS" aria-pressed="true">
                                                <span class="moyo-project-choice__icon moyo-create-choice__icon"><i class="fa-solid fa-lock" aria-hidden="true"></i></span>
                                                <span class="moyo-project-choice__copy moyo-create-choice__copy"><strong>참여자만</strong><span>참여 멤버만 프로젝트에 들어올 수 있어요.</span></span>
                                            </button>
                                            <button type="button" class="moyo-project-choice moyo-create-choice" data-project-access-scope="WORKSPACE_READ" aria-pressed="false">
                                                <span class="moyo-project-choice__icon moyo-create-choice__icon"><i class="fa-solid fa-eye" aria-hidden="true"></i></span>
                                                <span class="moyo-project-choice__copy moyo-create-choice__copy"><strong>그룹 멤버 전체 읽기</strong><span>그룹 멤버는 읽기 전용으로 볼 수 있어요.</span></span>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="moyo-project-form__error moyo-create-error" data-project-form-error="access" hidden></p>
                                </div>
                            </c:when>
                            <c:otherwise>
                                <input type="hidden" id="accessScope" data-project-access-input value="OWNER_ONLY">
                            </c:otherwise>
                        </c:choose>

                        <div class="field full link-field moyo-create-field moyo-create-link-field">
                            <div class="moyo-create-link-head">
                                <div class="moyo-create-link-title">
                                    <span class="field-label moyo-create-label">외부 링크</span>
                                    <span class="moyo-create-link-count" id="projectCreateLinkCount">0 / 5</span>
                                </div>
                                <button type="button" id="projectCreateLinkAdd" class="moyo-create-link-add" onclick="addProjectCreateLink()">
                                    <i class="fa-solid fa-plus" aria-hidden="true"></i><span>링크 추가</span>
                                </button>
                            </div>
                            <div id="projectCreateLinkList" class="project-link-list moyo-create-link-list"></div>
                            <div id="projectCreateLinkEmpty" class="moyo-create-link-empty">
                                <i class="fa-solid fa-link" aria-hidden="true"></i>
                                <span>등록된 링크가 없습니다.</span>
                            </div>
                            <small class="moyo-create-help">Git, Notion, 문서 등 필요한 링크를 최대 5개까지 등록할 수 있어요.</small>
                            <p id="projectCreateLinkError" class="moyo-create-error moyo-create-link-error" hidden></p>
                        </div>
                    </div>
                </section>
            </section>

            <section id="stepMembers" class="project-step-panel moyo-create-panel" data-step="2">
                <section id="memberSection" class="create-card member-card">
                    <div class="create-card-head member-head member-head--compact">
                        <div class="member-head__copy">
                            <strong>참여 멤버</strong>
                            <span>함께할 멤버를 선택하고 역할을 정하세요.</span>
                        </div>
                        <div class="role-guide" aria-label="멤버 역할 안내">
                            <span><i class="fa-solid fa-crown" aria-hidden="true"></i> 팀장 1명</span>
                            <span><i class="fa-solid fa-user-shield" aria-hidden="true"></i> 관리자 지정 가능</span>
                        </div>
                    </div>

                    <div class="member-tools moyo-create-field-group">
                        <label class="member-search moyo-create-field" for="memberSearchInput">
                            <i class="fa-solid fa-magnifying-glass member-search-icon" aria-hidden="true"></i>
                            <input class="moyo-create-control" type="search" id="memberSearchInput" placeholder="이름 또는 이메일로 멤버 검색" autocomplete="off">
                        </label>
                        <button type="button" id="memberSelectedFilter" class="member-filter-btn" aria-pressed="false"><i class="fa-solid fa-user-check" aria-hidden="true"></i><span>선택한 멤버만</span></button>
                        <span id="memberSelectedCount" class="member-selected-count" aria-live="polite"><i class="fa-solid fa-users" aria-hidden="true"></i><span>참여 멤버 1명</span></span>
                    </div>
                    <div class="member-list-head" aria-hidden="true">
                        <span>멤버</span><span>담당</span><span>권한</span>
                    </div>
                    <div id="memberList" class="member-list">
                        <div class="member-loading">그룹 멤버를 불러오는 중입니다.</div>
                    </div>
                    <div id="memberFilterEmpty" class="member-filter-empty" hidden>검색 조건에 맞는 멤버가 없습니다.</div>
                </section>
            </section>
            <div class="create-actions moyo-create-actions">
                <button type="button" id="btnPrevStep" class="create-btn ghost" hidden>이전</button>
                <button type="button" id="btnNextStep" class="create-btn primary">다음</button>
                <button type="button" id="btnSubmit" class="create-btn primary" hidden>프로젝트 생성</button>
            </div>
            </div>
        </section>
    </main>
</div>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="${pageContext.request.contextPath}/js/commonProjectForm.js?v=20260923-project-period-ui-1"></script>
<script src="${pageContext.request.contextPath}/js/projectCreate.js?v=20260923-member-step-detail-finish-1"></script>
</body>
</html>
