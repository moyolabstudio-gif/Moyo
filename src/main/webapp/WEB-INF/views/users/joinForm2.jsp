<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO 프로필 설정</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260609-profile-fix2">
</head>
<body class="signup-body">
<main class="signup-shell">
    <section class="signup-brand-panel" aria-label="MOYO 소개">
<div class="signup-brand-copy">
            <span class="signup-eyebrow">MOYO PROFILE</span>
            <h1>모두가 알아볼 수 있는<br>나만의 프로필을 만들어보세요</h1>
            <p>계정 기본 프로필을 만들고,<br>워크스페이스에서 사용할 프로필을 선택할 수 있어요.</p>
        </div>
        <div class="signup-feature-row" aria-hidden="true">
            <span>친근하게</span><span>간결하게</span><span>한눈에</span>
        </div>
    </section>

    <section class="signup-card signup-card-profile">
            <a class="signup-card-logo-link" href="${pageContext.request.contextPath}/">
                <img class="signup-card-logo" src="${pageContext.request.contextPath}/brand/moyo_logo.png" alt="MOYO">
            </a>
        <div class="signup-progress" aria-label="회원가입 진행 단계">
            <span class="signup-step is-done">✓</span>
            <span class="signup-progress-line is-done"></span>
            <span class="signup-step is-active">2</span>
        </div>

        <div class="signup-card-heading signup-card-heading-compact">
            <span class="signup-section-label">STEP 2</span>
            <h2>프로필을 완성해주세요</h2>
            <p>사진을 움직여 보이는 위치를 조정할 수 있어요.</p>
        </div>

        <c:if test="${param.error eq 'required'}">
            <div class="signup-alert is-error">사용할 이름을 입력해주세요.</div>
        </c:if>

        <form id="profileForm" action="${pageContext.request.contextPath}/users/completeJoin"
              method="post" enctype="multipart/form-data">
            <div class="signup-profile-editor">
                <div id="profileViewport" class="signup-profile-viewport">
                    <canvas id="profileCanvas" width="500" height="500" aria-label="프로필 사진 미리보기"></canvas>
                    <span id="avatarFallback" class="signup-avatar-preview">M</span>
                </div>

                <div class="signup-profile-actions">
                    <label for="profileFile" class="signup-secondary-button signup-image-button">사진 선택</label>
                    <input id="profileFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>
                    <button id="removeProfile" type="button" class="signup-text-button">기본 아바타</button>
                </div>

                <div class="signup-position-controls">
                    <label for="profileZoom">사진 크기</label>
                    <input id="profileZoom" type="range" min="1" max="3" step="0.01" value="1" disabled>
                    <p>사진을 드래그해서 위치를 맞춰주세요.</p>
                </div>

                <input id="profileImageData" type="hidden" name="profileImageData">
            </div>

            <div class="signup-field">
                <label for="userName">사용할 이름</label>
                <input id="userName" type="text" name="userName" maxlength="30"
                       autocomplete="nickname" placeholder="예: 디제이콩" required autofocus>
                <p class="signup-field-hint">사진을 등록하지 않으면 이름의 첫 글자가 아바타로 표시됩니다.</p>
            </div>

            <button id="completeJoinButton" type="submit" class="signup-primary-button">MOYO 시작하기</button>
        </form>

        <a class="signup-back-link" href="${pageContext.request.contextPath}/users/joinForm">← 이전 단계로</a>
    </section>
</main>

<script src="${pageContext.request.contextPath}/js/signupProfile.js?v=20260609-profile-fix2"></script>
</body>
</html>
