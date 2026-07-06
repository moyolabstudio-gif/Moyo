<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO 로그인</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260706-auth-ui63">
</head>
<body class="signup-body">
    <main class="signup-shell">
        <section class="signup-brand-panel" aria-label="MOYO 소개">
            <div class="signup-brand-copy">
                <span class="signup-eyebrow">MOYO에 모여</span>
                <h1>함께하던 순간을<br>다시 이어가요</h1>
                <p>일정부터 기록과 사진까지<br>MOYO에서 계속 확인하세요.</p>
            </div>

            <div class="signup-feature-row" aria-hidden="true">
                <span>친구</span>
                <span>그룹</span>
                <span>프로젝트</span>
                <span>일정</span>
                <span>기록</span>
                <span>사진</span>
            </div>
        </section>

        <section class="signup-card login-card-panel">
            <a class="signup-card-logo-link" href="${pageContext.request.contextPath}/">
                <img class="signup-card-logo"
                     src="${pageContext.request.contextPath}/brand/moyo_logo.png"
                     alt="MOYO">
            </a>

            <div class="login-heading">
                <span class="signup-section-label">WELCOME</span>
                <h2>MOYO에 로그인하세요</h2>
                <p>이메일과 비밀번호로 MOYO를 이어서 이용하세요.</p>
            </div>

            <c:if test="${not empty param.error}">
                <div class="signup-alert is-error login-error">
                    이메일 또는 비밀번호를 확인해주세요.
                </div>
            </c:if>

            <form class="login-form"
                  action="${pageContext.request.contextPath}/users/login"
                  method="post">
                <div class="signup-field">
                    <label for="email">이메일</label>
                    <input id="email"
                           type="email"
                           name="email"
                           autocomplete="email"
                           placeholder="name@example.com"
                           required>
                </div>

                <div class="signup-field">
                    <label for="pwdHash">비밀번호</label>
                    <input id="pwdHash"
                           type="password"
                           name="pwdHash"
                           autocomplete="current-password"
                           placeholder="비밀번호를 입력해주세요"
                           required>
                </div>

                <button type="submit" class="signup-primary-button">
                    로그인
                </button>
            </form>

            <p class="login-footer">
                아직 계정이 없나요?
                <a href="${pageContext.request.contextPath}/users/joinForm">회원가입</a>
            </p>

            <a class="login-home-link" href="${pageContext.request.contextPath}/">
                ← 홈으로 돌아가기
            </a>
        </section>
    </main>
</body>
</html>
