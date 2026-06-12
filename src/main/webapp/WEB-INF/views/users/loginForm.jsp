<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO 로그인</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260609-login1">
</head>
<body class="signup-body">
    <main class="signup-shell">
        <section class="signup-brand-panel" aria-label="MOYO 소개">
            <div class="signup-brand-copy">
                <span class="signup-eyebrow">함께 모여 완성하는 협업</span>
                <h1>다시 만나서<br>반가워요</h1>
                <p>MOYO에 로그인하고,<br>팀원과 함께하던 업무를 이어가세요.</p>
            </div>

            <div class="signup-feature-row" aria-hidden="true">
                <span>워크스페이스</span>
                <span>프로젝트</span>
                <span>캘린더</span>
            </div>
        </section>

        <section class="signup-card login-card-panel">
            <a class="signup-card-logo-link" href="${pageContext.request.contextPath}/">
                <img class="signup-card-logo"
                     src="${pageContext.request.contextPath}/brand/moyo_logo.png"
                     alt="MOYO">
            </a>

            <div class="login-heading">
                <span class="signup-section-label">WELCOME BACK</span>
                <h2>MOYO에 로그인하세요</h2>
                <p>등록한 이메일과 비밀번호를 입력해주세요.</p>
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
