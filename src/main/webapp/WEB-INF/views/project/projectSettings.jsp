<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>프로젝트 설정</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectSettings.css">
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <div class="settings-page">
        <header class="settings-hero">
            <div>
                <h1>프로젝트 설정</h1>
                <p>프로젝트 정보와 멤버별 역할을 관리합니다.</p>
            </div>

            <div class="settings-hero-actions">
                <button type="button" class="btn ghost" onclick="goProjectMain()">돌아가기</button>
            </div>
        </header>

        <main class="settings-layout">
            <section class="settings-card">
                <div class="settings-card-head">
                    <div>
                        <h2>기본 정보</h2>
                        <p>프로젝트 이름, 카테고리, 기간과 설명을 관리합니다.</p>
                    </div>
                </div>

                <div class="settings-form-grid">
                    <div class="field full">
                        <label for="settingProjName">프로젝트명</label>
                        <input type="text" id="settingProjName" value="${projectDetail.projName}" <c:if test="${!canManageProject}">disabled</c:if>>
                    </div>

                    <div class="field">
                        <label for="settingProjCategory">프로젝트 카테고리</label>
                        <select id="settingProjCategory" <c:if test="${!canManageProject}">disabled</c:if>>
                            <option value="WORK" <c:if test="${projectDetail.projCategory == 'WORK'}">selected</c:if>>업무</option>
                            <option value="TRAVEL" <c:if test="${projectDetail.projCategory == 'TRAVEL'}">selected</c:if>>여행</option>
                            <option value="EVENT" <c:if test="${projectDetail.projCategory == 'EVENT'}">selected</c:if>>모임·행사</option>
                            <option value="STUDY" <c:if test="${projectDetail.projCategory == 'STUDY'}">selected</c:if>>학습·연구</option>
                            <option value="LIFE" <c:if test="${projectDetail.projCategory == 'LIFE'}">selected</c:if>>생활·가정</option>
                            <option value="HOBBY" <c:if test="${projectDetail.projCategory == 'HOBBY'}">selected</c:if>>취미·창작</option>
                            <option value="ETC" <c:if test="${projectDetail.projCategory == 'ETC' || empty projectDetail.projCategory}">selected</c:if>>기타</option>
                        </select>
                    </div>

                    <div id="settingCustomCategoryField" class="field"
                         <c:if test="${projectDetail.projCategory != 'ETC'}">style="display:none;"</c:if>>
                        <label for="settingProjCategoryDetail">기타 카테고리명</label>
                        <input type="text" id="settingProjCategoryDetail" maxlength="30"
                               value="${projectDetail.projCategoryDetail}"
                               placeholder="기타 카테고리명을 입력하세요."
                               <c:if test="${!canManageProject}">disabled</c:if>>
                    </div>

                    <div class="date-fields">
                        <div class="field">
                            <label for="settingStartDate">시작일</label>
                            <input type="date" id="settingStartDate" value="${projectDetail.startDate}" <c:if test="${!canManageProject}">disabled</c:if>>
                        </div>

                        <div class="field">
                            <label for="settingEndDate">마감일</label>
                            <input type="date" id="settingEndDate" value="${projectDetail.endDate}" <c:if test="${!canManageProject}">disabled</c:if>>
                        </div>
                    </div>

                    <div class="field full">
                        <label for="settingProjDesc">설명</label>
                        <textarea id="settingProjDesc" rows="4" placeholder="프로젝트 설명을 입력하세요." <c:if test="${!canManageProject}">disabled</c:if>>${projectDetail.projDesc}</textarea>
                    </div>
                </div>

                <c:if test="${canManageProject}">
                    <div class="settings-actions">
                        <button type="button" class="btn primary" onclick="saveProjectInfo()">기본 정보 저장</button>
                    </div>
                </c:if>
            </section>

            <section class="settings-card">
                <div class="settings-card-head member-manage-head">
                    <div>
                        <h2>멤버 관리</h2>
                        <p>권한과 역할을 관리합니다.</p>
                    </div>
                    <div class="member-head-actions">
                        <span class="member-count">${projectMemberList.size()}명</span>
                        <c:if test="${canManageProject}">
                            <button type="button" class="btn mini" onclick="toggleAddMemberPanel()">+ 멤버 추가</button>
                        </c:if>
                    </div>
                </div>

                <c:if test="${canManageProject}">
                    <div id="memberAddPanel" class="member-add-panel" style="display:none;">
                        <select id="assignableMemberSelect">
                            <option value="">추가할 멤버를 선택하세요</option>
                        </select>
                        <button type="button" class="btn primary mini" onclick="addSelectedProjectMember()">추가</button>
                    </div>
                </c:if>

                <div class="member-role-list">
                    <c:forEach var="member" items="${projectMemberList}">
                        <div class="member-role-row" data-user-id="${member.USER_ID}">
                            <div class="member-profile">
                                <div class="member-avatar">${member.USER_NAME.substring(0,1)}</div>
                                <div class="member-meta">
                                    <div class="member-name-row">
                                        <strong>${member.USER_NAME}</strong>
                                        <c:choose>
                                            <c:when test="${member.USER_ID == projectDetail.leaderId}">
                                                <span class="role-badge leader">팀장</span>
                                            </c:when>
                                            <c:when test="${member.PROJ_ROLE == 'ADMIN'}">
                                                <span class="role-badge admin">관리자</span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="role-badge">멤버</span>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                    <span>${member.EMAIL}</span>
                                </div>
                            </div>

                            <div class="member-permission-field">
                                <label>권한</label>
                                <select class="proj-role-select" <c:if test="${!canManageProject}">disabled</c:if>>
                                    <option value="MEMBER"
                                        <c:if test="${member.USER_ID != projectDetail.leaderId && member.PROJ_ROLE != 'ADMIN'}">selected</c:if>
                                    >멤버</option>
                                    <option value="ADMIN"
                                        <c:if test="${member.USER_ID != projectDetail.leaderId && member.PROJ_ROLE == 'ADMIN'}">selected</c:if>
                                    >관리자</option>
                                    <option value="LEADER"
                                        <c:if test="${member.USER_ID == projectDetail.leaderId}">selected</c:if>
                                    >팀장</option>
                                </select>
                            </div>

                            <div class="member-position-field">
                                <label>역할</label>
                                <input
                                    type="text"
                                    class="proj-position-input"
                                    value="${member.PROJ_POSITION}"
                                    placeholder="예: 백엔드 / 일정관리"
                                    maxlength="100"
                                    <c:if test="${!canManageProject}">disabled</c:if>
                                >
                            </div>

                            <c:if test="${canManageProject && member.USER_ID != projectDetail.leaderId}">
                                <button type="button" class="member-remove-btn" onclick="removeProjectMember(${member.USER_ID}, '${member.USER_NAME}')">삭제</button>
                            </c:if>
                        </div>
                    </c:forEach>
                </div>

                <c:if test="${canManageProject}">
                    <div class="settings-actions">
                        <button type="button" class="btn primary" onclick="saveMemberPositions()">멤버 설정 저장</button>
                    </div>
                </c:if>
            </section>
        </main>

        <c:if test="${canManageProject}">
            <section class="settings-card danger-card">
                <div class="settings-card-head">
                    <div>
                        <h2>프로젝트 삭제</h2>
                        <p>삭제하면 프로젝트와 관련 데이터가 제거됩니다.</p>
                    </div>
                </div>

                <div class="danger-actions">
                    <button type="button" class="btn danger" onclick="deleteProjectFromSettings()">프로젝트 삭제</button>
                </div>
            </section>
        </c:if>

    </div>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        window.PROJECT_SETTINGS_CONFIG = {
            contextPath: '${pageContext.request.contextPath}',
            wsId: '${wsId}',
            projId: '${projId}',
            canManageProject: ${canManageProject}
        };
    </script>
    <script src="${pageContext.request.contextPath}/js/projectSettings.js"></script>
</body>
</html>
