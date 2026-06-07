<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO - 새 프로젝트 생성</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/projectCreate.css">
</head>
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<div class="project-create-page"
     data-context-path="${pageContext.request.contextPath}"
     data-ws-id="${wsId}"
     data-current-user-id="${sessionScope.user.userId}">

    <header class="create-hero">
        <div>
            <h1>새 프로젝트 생성</h1>
            <p>프로젝트 기본 정보와 참여 멤버를 설정합니다.</p>
        </div>
        <div class="create-hero-actions">
            <button type="button" id="btnCancelTop" class="btn ghost">돌아가기</button>
        </div>
    </header>

    <main class="create-layout">
        <section class="create-card">
            <div class="create-card-head">
                <div>
                    <h2>기본 정보</h2>
                    <p>프로젝트 이름, 참여 방식, 카테고리, 기간과 설명을 입력합니다.</p>
                </div>
            </div>

            <div class="create-form-grid">
                <div class="field full">
                    <label for="projName">프로젝트명 <span class="required">*</span></label>
                    <input type="text" id="projName" maxlength="100" placeholder="예: 여름 제주도 가족여행">
                </div>

                <div class="field full">
                    <span class="field-label">참여 방식 <span class="required">*</span></span>
                    <div class="scope-options" role="radiogroup" aria-label="참여 방식">
                        <label class="scope-card">
                            <input type="radio" name="projScope" value="PERSONAL">
                            <span class="scope-icon">👤</span>
                            <span class="scope-copy">
                                <strong>나만 사용</strong>
                                <small>개인 일정과 목표를 혼자 관리합니다.</small>
                            </span>
                        </label>
                        <label class="scope-card active">
                            <input type="radio" name="projScope" value="GROUP" checked>
                            <span class="scope-icon">👥</span>
                            <span class="scope-copy">
                                <strong>함께 사용</strong>
                                <small>멤버를 선택하고 팀장과 관리자를 지정합니다.</small>
                            </span>
                        </label>
                    </div>
                </div>

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

                <div class="field">
                    <label for="startDate">시작일 <span class="required">*</span></label>
                    <input type="date" id="startDate">
                </div>

                <div class="field">
                    <label for="endDate">종료일 <span class="required">*</span></label>
                    <input type="date" id="endDate">
                </div>

                <div class="field full">
                    <label for="projDesc">프로젝트 설명</label>
                    <textarea id="projDesc" rows="4" maxlength="1000" placeholder="프로젝트 목표나 준비할 내용을 간단히 입력하세요."></textarea>
                </div>
            </div>
        </section>

        <section id="memberSection" class="create-card">
            <div class="create-card-head member-head">
                <div>
                    <h2>참여 멤버 관리</h2>
                    <p>참여 멤버를 선택하고 팀장 1명과 관리자를 지정합니다.</p>
                </div>
                <div class="role-guide">
                    <span>팀장 1명</span>
                    <span>관리자 여러 명 가능</span>
                </div>
            </div>

            <div id="memberList" class="member-list">
                <div class="member-loading">워크스페이스 멤버를 불러오는 중입니다.</div>
            </div>
        </section>
    </main>

    <div class="create-actions">
        <button type="button" id="btnCancel" class="btn ghost">취소</button>
        <button type="button" id="btnSubmit" class="btn primary">프로젝트 생성</button>
    </div>
</div>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script src="${pageContext.request.contextPath}/js/projectCreate.js"></script>
</body>
</html>
