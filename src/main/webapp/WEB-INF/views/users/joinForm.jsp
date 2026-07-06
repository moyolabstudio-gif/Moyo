<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO 회원가입</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260706-auth-ui63">
</head>
<body class="signup-body" data-context-path="${pageContext.request.contextPath}">
    <main class="signup-shell">
        <section class="signup-brand-panel" aria-label="MOYO 소개">
            <div class="signup-brand-copy">
                <span class="signup-eyebrow">MOYO에 모여</span>
                <h1>친구와 그룹,<br>프로젝트까지<br>함께하는 순간을<br>한 곳에서</h1>
                <p>일정부터 기록과 사진까지<br>MOYO에서 함께 모아보세요.</p>
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

        <section class="signup-card">
            <a class="signup-card-logo-link" href="${pageContext.request.contextPath}/">
                <img class="signup-card-logo" src="${pageContext.request.contextPath}/brand/moyo_logo.png" alt="MOYO">
            </a>
            <div class="signup-progress" aria-label="회원가입 진행 단계">
                <span class="signup-step is-active">1</span>
                <span class="signup-progress-line"></span>
                <span class="signup-step">2</span>
            </div>

            <div class="signup-card-heading">
                <span class="signup-section-label">STEP 1</span>
                <h2>계정을 만들어볼까요?</h2>
                <p>로그인에 사용할 이메일과 비밀번호를 입력해주세요.</p>
            </div>

            <c:if test="${param.error eq 'duplicate'}">
                <div class="signup-alert is-error">이미 가입된 이메일입니다.</div>
            </c:if>
            <c:if test="${param.error eq 'required'}">
                <div class="signup-alert is-error">이메일과 비밀번호를 모두 입력해주세요.</div>
            </c:if>

            <form id="joinForm" action="${pageContext.request.contextPath}/users/join" method="post" novalidate>
                <div class="signup-field">
                    <label for="email">이메일</label>
                    <div class="signup-inline-control">
                        <input id="email" type="email" name="email" autocomplete="email"
                               placeholder="name@example.com" required>
                        <button type="button" id="checkEmailButton" class="signup-secondary-button">중복 확인</button>
                    </div>
                    <p id="emailMessage" class="signup-field-message" aria-live="polite"></p>
                </div>

                <div class="signup-field">
                    <label for="pwdHash">비밀번호</label>
                    <input id="pwdHash" type="password" name="pwdHash" autocomplete="new-password"
                           minlength="4" placeholder="비밀번호를 입력해주세요" required>
                    <p class="signup-field-hint">4자 이상 입력해주세요.</p>
                </div>

                <button type="submit" class="signup-primary-button">다음 단계로</button>
            </form>

            <p class="signup-login-link">이미 계정이 있나요?
                <a href="${pageContext.request.contextPath}/users/loginForm">로그인</a>
            </p>
        </section>
    </main>

<script>
(() => {
    const contextPath = document.body.dataset.contextPath || '';
    const form = document.getElementById('joinForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('pwdHash');
    const checkButton = document.getElementById('checkEmailButton');
    const message = document.getElementById('emailMessage');
    let checkedEmail = '';
    let emailAvailable = false;

    const setEmailState = (type) => {
        emailInput.classList.remove('is-error', 'is-success');
        emailInput.removeAttribute('aria-invalid');
        if (type === 'error') {
            emailInput.classList.add('is-error');
            emailInput.setAttribute('aria-invalid', 'true');
        } else if (type === 'success') {
            emailInput.classList.add('is-success');
        }
    };

    const setMessage = (text, type) => {
        message.textContent = text;
        message.className = 'signup-field-message' + (type ? ' is-' + type : '');
        setEmailState(type === 'error' || type === 'success' ? type : '');
    };

    emailInput.addEventListener('input', () => {
        checkedEmail = '';
        emailAvailable = false;
        setMessage('', '');
    });

    passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('is-error');
        passwordInput.removeAttribute('aria-invalid');
    });

    checkButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email || !emailInput.checkValidity()) {
            setMessage('올바른 이메일 형식을 입력해주세요.', 'error');
            emailInput.focus();
            return;
        }

        checkButton.disabled = true;
        setMessage('이메일을 확인하고 있습니다.', 'pending');

        try {
            const response = await fetch(contextPath + '/users/check-email?email=' + encodeURIComponent(email));
            if (!response.ok) throw new Error('email check failed');
            const data = await response.json();

            checkedEmail = email.toLowerCase();
            emailAvailable = Boolean(data.available);
            setMessage(
                emailAvailable ? '사용할 수 있는 이메일입니다.' : '이미 가입된 이메일입니다.',
                emailAvailable ? 'success' : 'error'
            );
        } catch (error) {
            checkedEmail = '';
            emailAvailable = false;
            setMessage('이메일 확인 중 오류가 발생했습니다.', 'error');
        } finally {
            checkButton.disabled = false;
        }
    });

    form.addEventListener('submit', (event) => {
        const email = emailInput.value.trim().toLowerCase();
        if (!emailInput.checkValidity()) {
            event.preventDefault();
            setMessage('올바른 이메일 형식을 입력해주세요.', 'error');
            emailInput.focus();
            return;
        }
        passwordInput.classList.remove('is-error');
        passwordInput.removeAttribute('aria-invalid');
        if (passwordInput.value.trim().length < 4) {
            event.preventDefault();
            passwordInput.classList.add('is-error');
            passwordInput.setAttribute('aria-invalid', 'true');
            passwordInput.focus();
            return;
        }
        if (checkedEmail === email && !emailAvailable) {
            event.preventDefault();
            setMessage('이미 가입된 이메일입니다.', 'error');
            emailInput.focus();
            return;
        }
    });
})();
</script>
</body>
</html>
