<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>프로젝트 설정</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectSettings.css?v=project-settings-remove-button-align-v1">
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="settings-page project-settings-page">
        <header class="settings-hero project-settings-hero">
            <div class="settings-hero-main project-settings-hero-main">
                <div class="settings-hero-copy">
                    <span class="settings-kicker">프로젝트 설정</span>
                    <h1><c:out value="${projectDetail.projName}"/></h1>
                    <p>프로젝트 정보, 외부 링크와 멤버 권한을 관리합니다.</p>
                </div>
            </div>

            <div class="settings-hero-actions">
                <button type="button" class="settings-back-link" onclick="goProjectMain()">프로젝트 홈</button>
            </div>
        </header>

        <nav class="settings-tabs" aria-label="프로젝트 설정 메뉴">
            <button type="button"
                    class="settings-tab-button"
                    data-tab="basic"
                    onclick="switchProjectSettingsTab('basic')">기본 설정</button>
            <button type="button"
                    class="settings-tab-button"
                    data-tab="members"
                    onclick="switchProjectSettingsTab('members')">멤버 관리</button>
        </nav>

        <main class="settings-layout">
            <section id="projectSettingsBasic" class="settings-tab-panel">
                <div class="settings-card">
                    <div class="settings-card-head">
                        <div>
                            <h2>기본 정보</h2>
                            <p>프로젝트 이름, 카테고리, 기간과 설명을 관리합니다.</p>
                        </div>
                    </div>

                    <div class="settings-form-grid">
                        <div class="field">
                            <label for="settingProjName">프로젝트명</label>
                            <input type="text"
                                   id="settingProjName"
                                   value="<c:out value='${projectDetail.projName}'/>"
                                   <c:if test="${!canManageProject}">disabled</c:if>>
                        </div>

                        <div class="field">
                            <label for="settingProjCategory">프로젝트 유형</label>
                            <select id="settingProjCategory" <c:if test="${!canManageProject}">disabled</c:if>>
                                <option value="WORK" ${projectDetail.projCategory eq 'WORK' ? 'selected' : ''}>업무</option>
                                <option value="TRAVEL" ${projectDetail.projCategory eq 'TRAVEL' ? 'selected' : ''}>여행</option>
                                <option value="EVENT" ${projectDetail.projCategory eq 'EVENT' ? 'selected' : ''}>모임·행사</option>
                                <option value="STUDY" ${projectDetail.projCategory eq 'STUDY' ? 'selected' : ''}>학습·연구</option>
                                <option value="LIFE" ${projectDetail.projCategory eq 'LIFE' ? 'selected' : ''}>생활·가정</option>
                                <option value="HOBBY" ${projectDetail.projCategory eq 'HOBBY' ? 'selected' : ''}>취미·창작</option>
                                <option value="ETC" ${empty projectDetail.projCategory or projectDetail.projCategory eq 'ETC' ? 'selected' : ''}>기타</option>
                            </select>
                        </div>

                        <div id="settingCustomCategoryField"
                             class="field full"
                             <c:if test="${projectDetail.projCategory ne 'ETC'}">style="display:none;"</c:if>>
                            <label for="settingProjCategoryDetail">기타 유형명</label>
                            <input type="text"
                                   id="settingProjCategoryDetail"
                                   maxlength="30"
                                   value="<c:out value='${projectDetail.projCategoryDetail}'/>"
                                   placeholder="기타 유형명을 입력하세요."
                                   <c:if test="${!canManageProject}">disabled</c:if>>
                        </div>

                        <div class="field">
                            <label for="settingStartDate">시작일</label>
                            <input type="date"
                                   id="settingStartDate"
                                   value="${projectDetail.startDate}"
                                   <c:if test="${!canManageProject}">disabled</c:if>>
                        </div>

                        <div class="field">
                            <label for="settingEndDate">마감일</label>
                            <input type="date"
                                   id="settingEndDate"
                                   value="${projectDetail.endDate}"
                                   <c:if test="${!canManageProject}">disabled</c:if>>
                        </div>

                        <div class="field full">
                            <label for="settingProjDesc">프로젝트 설명</label>
                            <textarea id="settingProjDesc"
                                      maxlength="1000"
                                      placeholder="프로젝트 설명을 입력하세요."
                                      <c:if test="${!canManageProject}">disabled</c:if>><c:out value="${projectDetail.projDesc}"/></textarea>
                        </div>
                    </div>

                    <div class="settings-section-divider"></div>

                    <div class="project-settings-link-head">
                        <div>
                            <h2>외부 링크</h2>
                            <p>Git, Notion, 문서 등 자주 사용하는 주소를 자유롭게 등록합니다.</p>
                        </div>
                        <c:if test="${canManageProject}">
                            <button type="button" class="btn mini" onclick="addProjectSettingLink()">+ 링크 추가</button>
                        </c:if>
                    </div>

                    <div id="projectSettingLinkList" class="project-settings-link-list">
                        <c:choose>
                            <c:when test="${not empty projectLinks}">
                                <c:forEach var="link" items="${projectLinks}">
                                    <div class="project-settings-link-row">
                                        <input type="text"
                                               class="project-setting-link-name"
                                               maxlength="50"
                                               value="<c:out value='${link.LINK_NAME}'/>"
                                               placeholder="링크 이름"
                                               <c:if test="${!canManageProject}">disabled</c:if>>
                                        <input type="text"
                                               class="project-setting-link-url"
                                               maxlength="500"
                                               value="<c:out value='${link.LINK_URL}'/>"
                                               placeholder="https://..."
                                               <c:if test="${!canManageProject}">disabled</c:if>>
                                        <c:if test="${canManageProject}">
                                            <button type="button"
                                                    class="project-setting-link-remove"
                                                    onclick="removeProjectSettingLink(this)">×</button>
                                        </c:if>
                                    </div>
                                </c:forEach>
                            </c:when>
                            <c:otherwise>
                                <div class="project-settings-link-row">
                                    <input type="text"
                                           class="project-setting-link-name"
                                           maxlength="50"
                                           placeholder="링크 이름"
                                           <c:if test="${!canManageProject}">disabled</c:if>>
                                    <input type="text"
                                           class="project-setting-link-url"
                                           maxlength="500"
                                           placeholder="https://..."
                                           <c:if test="${!canManageProject}">disabled</c:if>>
                                    <c:if test="${canManageProject}">
                                        <button type="button"
                                                class="project-setting-link-remove"
                                                onclick="removeProjectSettingLink(this)">×</button>
                                    </c:if>
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </div>

                    <c:if test="${canManageProject}">
                        <div class="settings-actions">
                            <button type="button" class="btn primary" onclick="saveProjectInfo()">변경사항 저장</button>
                        </div>
                    </c:if>
                </div>

                <c:if test="${isProjectLeader}">
                    <section class="settings-card danger-card">
                        <div class="settings-card-head">
                            <div>
                                <h2>위험 구역</h2>
                                <p>프로젝트 삭제는 팀장만 가능하며 삭제 후 복구할 수 없습니다.</p>
                            </div>
                        </div>
                        <div class="danger-actions">
                            <button type="button"
                                    class="btn danger"
                                    onclick="deleteProjectFromSettings()">프로젝트 삭제</button>
                        </div>
                    </section>
                </c:if>
            </section>

            <section id="projectSettingsMembers" class="settings-tab-panel">
                <div class="settings-card">
                    <div class="member-tab-head">
                        <div>
                            <h2>멤버 관리</h2>
                            <p>권한과 프로젝트 내 역할을 관리합니다.</p>
                        </div>
                        <c:if test="${canManageProject}">
                            <button type="button"
                                    class="member-tab-invite"
                                    onclick="openProjectMemberAddModal()">+ 멤버 추가</button>
                        </c:if>
                    </div>

                    <div class="member-search-box">
                        <input type="text"
                               id="projectMemberSearchInput"
                               placeholder="이름, 이메일, 역할로 검색"
                               autocomplete="off">
                    </div>

                    <div id="projectMemberEmpty" class="workspace-member-empty">
                        검색 결과가 없습니다.
                    </div>

                    <div class="member-role-list workspace-member-manage-list">
                        <c:forEach var="member" items="${projectMemberList}">
                            <div class="member-role-row workspace-member-manage-row" data-user-id="${member.USER_ID}">
                                <div class="member-profile workspace-member-manage-info">
                                    <div class="member-avatar workspace-member-manage-avatar">
                                        <c:out value="${fn:substring(member.USER_NAME, 0, 1)}"/>
                                    </div>
                                    <div class="member-meta workspace-member-manage-text">
                                        <strong class="workspace-member-manage-name"><c:out value="${member.USER_NAME}"/></strong>
                                        <span class="workspace-member-manage-email"><c:out value="${member.EMAIL}"/></span>
                                    </div>
                                </div>

                                <c:choose>
                                    <c:when test="${member.USER_ID eq projectDetail.leaderId}">
                                        <select class="proj-role-select workspace-member-role-select" disabled>
                                            <option value="LEADER" selected>팀장</option>
                                        </select>
                                    </c:when>
                                    <c:otherwise>
                                        <select class="proj-role-select workspace-member-role-select"
                                                <c:if test="${!canManageProject}">disabled</c:if>>
                                            <option value="MEMBER" ${member.PROJ_ROLE ne 'ADMIN' ? 'selected' : ''}>멤버</option>
                                            <option value="ADMIN" ${member.PROJ_ROLE eq 'ADMIN' ? 'selected' : ''}>관리자</option>
                                            <c:if test="${isProjectLeader}">
                                                <option value="LEADER">팀장 위임</option>
                                            </c:if>
                                        </select>
                                    </c:otherwise>
                                </c:choose>

                                <input type="text"
                                       class="proj-position-input workspace-member-position-input"
                                       value="<c:out value='${member.PROJ_POSITION}'/>"
                                       placeholder="예: 백엔드, 일정 관리"
                                       maxlength="100"
                                       <c:if test="${!canManageProject}">disabled</c:if>>

                                <c:choose>
                                    <c:when test="${canManageProject and (member.USER_ID ne projectDetail.leaderId or isProjectLeader)}">
                                        <button type="button"
                                                class="member-save-btn workspace-member-position-save"
                                                onclick="saveProjectMemberSetting(this)">
                                            역할 저장
                                        </button>
                                    </c:when>
                                    <c:otherwise>
                                        <span class="workspace-member-position-save-placeholder"></span>
                                    </c:otherwise>
                                </c:choose>

                                <div class="member-row-actions workspace-member-actions">
                                    <c:if test="${canManageProject and member.USER_ID ne projectDetail.leaderId}">
                                        <button type="button"
                                                class="member-remove-btn workspace-member-kick-button"
                                                onclick="removeProjectMember(${member.USER_ID}, '<c:out value="${member.USER_NAME}"/>')">
                                            내보내기
                                        </button>
                                    </c:if>
                                </div>
                            </div>
                        </c:forEach>
                    </div>
                    <p class="workspace-member-role-note">팀장만 권한과 역할을 수정할 수 있습니다. 팀장 위임은 권한 선택에서 팀장을 선택하면 바로 위임됩니다.</p>

                </div>
            </section>
        </main>
    </div>


    <div id="projectMemberAddOverlay"
         class="project-member-add-overlay"
         onclick="closeProjectMemberAddModal()"></div>

    <section id="projectMemberAddModal"
             class="project-member-add-modal"
             role="dialog"
             aria-modal="true"
             aria-labelledby="projectMemberAddTitle">
        <div class="project-member-add-head">
            <div>
                <span>프로젝트 멤버</span>
                <h3 id="projectMemberAddTitle">멤버 추가</h3>
            </div>
            <button type="button"
                    onclick="closeProjectMemberAddModal()"
                    aria-label="닫기">×</button>
        </div>

        <div class="project-member-add-body">
            <div class="project-member-add-summary">
                <span>그룹 멤버 중 프로젝트에 추가할 멤버를 선택하세요.</span>
                <strong id="projectMemberSelectedCount">0명 선택</strong>
            </div>

            <div id="projectMemberCandidateList"
                 class="project-member-candidate-list">
                <div class="project-member-candidate-empty">멤버를 불러오는 중입니다.</div>
            </div>
        </div>

        <div class="project-member-add-actions">
            <button type="button"
                    class="btn ghost"
                    onclick="closeProjectMemberAddModal()">취소</button>
            <button type="button"
                    class="btn primary"
                    onclick="addCheckedProjectMembers()">선택 멤버 추가</button>
        </div>
    </section>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        window.PROJECT_SETTINGS_CONFIG = {
            contextPath: '${pageContext.request.contextPath}',
            wsId: '${wsId}',
            projId: '${projId}',
            canManageProject: ${canManageProject},
            isProjectLeader: ${isProjectLeader}
        };
    </script>
    <script src="${pageContext.request.contextPath}/js/projectSettings.js?v=project-settings-ws-exact-v1"></script>
</body>
</html>
