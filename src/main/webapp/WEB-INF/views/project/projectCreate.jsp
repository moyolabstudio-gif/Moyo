<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO - 새 프로젝트 생성</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectCreate.css?v=project-create-member-display-v6">
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
     data-can-create-group-project="${canCreateGroupProject}">

    <main class="project-create-shell">
        <section class="project-create-card">
            <c:if test="${groupEntry and not canCreateGroupProject}">
                <div class="project-create-permission-notice" role="alert">
                    <strong>그룹 프로젝트를 만들 수 없어요.</strong>
                    <p>그룹 프로젝트는 그룹장 또는 관리자만 만들 수 있어요.</p>
                    <button type="button" class="btn primary" onclick="history.back()">그룹으로 돌아가기</button>
                </div>
            </c:if>
            <div class="project-create-content${groupEntry and not canCreateGroupProject ? ' is-blocked' : ''}">
            <div class="create-step" id="createStepLabel">1 / 2</div>

            <div class="create-title-row">
                <div>
                    <h1 id="createTitle">새 프로젝트 만들기</h1>
                    <p id="createSubTitle">프로젝트 정보를 먼저 입력한 다음, 다음 단계에서 참여 멤버를 설정합니다.</p>
                </div>
                <button type="button" id="btnCancelTop" class="btn ghost small">돌아가기</button>
            </div>

            <section id="stepBasic" class="project-step-panel is-active" data-step="1">
                <section class="create-card basic-card">
                    <div class="create-card-head compact-head">
                        <div>
                            <h2>기본 정보</h2>
                            <p>프로젝트 이름, 유형, 기간과 설명을 입력합니다.</p>
                        </div>
                    </div>

                    <div class="create-form-grid">
                        <div class="field full">
                            <label for="projName">프로젝트명 <span class="required">*</span></label>
                            <input type="text" id="projName" maxlength="100" placeholder="예: 여름 제주도 가족여행">
                        </div>

                        <c:if test="${groupEntry}">
                            <div class="field full project-context-field">
                                <span class="field-label">그룹 프로젝트</span>
                                <div class="project-context-summary">
                                    <strong><c:out value="${workspace.wsName}" /></strong>
                                    <small>현재 그룹에 프로젝트가 생성됩니다.</small>
                                </div>
                            </div>
                        </c:if>

                        <div class="field category-field">
                            <label for="projCategory">프로젝트 카테고리 <span class="required">*</span></label>
                            <select id="projCategory">
                                <option value="WORK">업무</option>
                                <option value="TRAVEL">여행</option>
                                <option value="EVENT">모임·행사</option>
                                <option value="STUDY">학습·연구</option>
                                <option value="LIFE">생활·가정</option>
                                <option value="HOBBY">취미·창작</option>
                                <option value="ETC">기타</option>
                            </select>
                        </div>

                        <div id="customCategoryField" class="field full" hidden>
                            <label for="projCategoryDetail">기타 카테고리명 <span class="required">*</span></label>
                            <input type="text" id="projCategoryDetail" maxlength="30"
                                   placeholder="예: 가족여행 준비, 동호회 공연, 이사 준비">
                        </div>

                        <div class="date-row field full">
                            <div class="field">
                                <label for="startDate">시작일 <span class="required">*</span></label>
                                <input type="text" id="startDate" class="project-date-input" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-project-date-picker readonly>
                            </div>
                            <div class="field">
                                <label for="endDate">종료일 <span class="required">*</span></label>
                                <input type="text" id="endDate" class="project-date-input" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-project-date-picker readonly>
                            </div>
                        </div>

                        <div class="field full">
                            <label for="projDesc">프로젝트 설명</label>
                            <textarea id="projDesc" rows="3" maxlength="1000" placeholder="프로젝트 목표나 준비할 내용을 간단히 입력하세요."></textarea>
                        </div>

                        <div class="field full link-field">
                            <div class="project-link-field-head">
                                <div>
                                    <span class="field-label">외부 링크</span>
                                    <small>Git, Notion, 문서 등 자주 사용하는 주소를 등록합니다.</small>
                                </div>
                                <button type="button" class="project-link-add-btn" onclick="addProjectCreateLink()">+ 링크 추가</button>
                            </div>
                            <div id="projectCreateLinkList" class="project-link-list">
                                <div class="project-link-row">
                                    <input type="text" class="project-link-name" maxlength="50" placeholder="링크 이름">
                                    <input type="text" class="project-link-url" maxlength="500" placeholder="https://...">
                                    <button type="button" class="project-link-remove-btn" onclick="removeProjectCreateLink(this)" aria-label="링크 삭제">×</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </section>

            <section id="stepMembers" class="project-step-panel" data-step="2">
                <section id="memberSection" class="create-card member-card">
                    <div class="create-card-head member-head">
                        <div>
                            <h2>참여 멤버</h2>
                            <p>함께할 멤버를 선택하고 프로젝트 팀장 1명을 지정합니다.</p>
                        </div>
                        <div class="role-guide">
                            <span>팀장 1명</span>
                            <span>관리자 가능</span>
                        </div>
                    </div>

                    <div class="member-tools">
                        <label class="member-search" for="memberSearchInput">
                            <span class="member-search-icon" aria-hidden="true">⌕</span>
                            <input type="search" id="memberSearchInput" placeholder="이름 또는 이메일로 검색" autocomplete="off">
                        </label>
                        <button type="button" id="memberSelectedFilter" class="member-filter-btn" aria-pressed="false">선택한 멤버만</button>
                        <span id="memberSelectedCount" class="member-selected-count" aria-live="polite">참여 멤버 1명</span>
                    </div>
                    <div id="memberList" class="member-list">
                        <div class="member-loading">그룹 멤버를 불러오는 중입니다.</div>
                    </div>
                    <div id="memberFilterEmpty" class="member-filter-empty" hidden>조건에 맞는 멤버가 없습니다.</div>
                </section>
            </section>
            <div class="create-actions">
                <button type="button" id="btnPrevStep" class="btn ghost" hidden>이전</button>
                <button type="button" id="btnCancel" class="btn ghost">취소</button>
                <button type="button" id="btnNextStep" class="btn primary">다음</button>
                <button type="button" id="btnSubmit" class="btn primary" hidden>프로젝트 생성</button>
            </div>
            </div>
        </section>
    </main>
</div>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="${pageContext.request.contextPath}/js/projectCreate.js?v=project-create-member-display-v6"></script>
</body>
</html>
