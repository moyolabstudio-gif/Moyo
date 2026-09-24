<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>MOYO 회원가입</title>
    <link id="moyo-fontawesome-css" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" referrerpolicy="no-referrer">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260906-brand-feature-icons">
    <script src="${pageContext.request.contextPath}/js/moyoCsrf.js?v=csrf-v1"></script>
</head>
<body class="signup-body" data-context-path="${pageContext.request.contextPath}">
    <main class="signup-shell">
        <section class="signup-brand-panel" aria-label="MOYO 소개">
            <div class="signup-brand-copy">
                <span class="signup-eyebrow">MOYO에 모여</span>
                <h1>친구와 그룹,<br>프로젝트까지<br>함께하는 순간을<br>한 곳에서</h1>
                <p>일정, 노트, 사진과 파일까지<br>MOYO에 함께 기록해보세요.</p>
            </div>
            <div class="signup-feature-row signup-feature-row--structured" aria-hidden="true">
                <div class="signup-feature-spaces">
                    <span>친구</span>
                    <span>그룹</span>
                    <span>프로젝트</span>
                </div>
                <div class="signup-feature-records">
                    <div class="signup-feature-contents">
                    <span class="signup-feature-content">
                        <i class="fa-solid fa-calendar-days"></i>
                        <small>일정</small>
                    </span>
                    <span class="signup-feature-content">
                        <i class="fa-regular fa-note-sticky"></i>
                        <small>노트</small>
                    </span>
                    <span class="signup-feature-content">
                        <i class="fa-regular fa-images"></i>
                        <small>사진</small>
                    </span>
                    <span class="signup-feature-content">
                        <i class="fa-regular fa-folder-open"></i>
                        <small>파일</small>
                    </span>
                    </div>
                </div>
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
            <c:if test="${param.error eq 'emailVerification'}">
                <div class="signup-alert is-error">이메일 인증을 완료한 후 회원가입을 진행해주세요.</div>
            </c:if>
            <c:if test="${param.error eq 'passwordPolicy'}">
                <div class="signup-alert is-error">비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.</div>
            </c:if>

            <form id="joinForm" action="${pageContext.request.contextPath}/users/join" method="post" novalidate>
                <div class="signup-field">
                    <label for="email">이메일</label>
                    <div class="signup-inline-control">
                        <input id="email" type="email" name="email" autocomplete="email"
                               value="${fn:escapeXml(resumeVerifiedEmail)}"
                               data-resume-verified="${not empty resumeVerifiedEmail}"
                               placeholder="name@example.com" required>
                        <button type="button" id="sendEmailCodeButton" class="signup-secondary-button">인증번호 받기</button>
                    </div>
                    <p id="emailMessage" class="signup-field-message" aria-live="polite"></p>
                </div>

                <div id="emailVerificationField" class="signup-field signup-verification-field" hidden>
                    <label for="emailVerificationCode">인증번호</label>
                    <div class="signup-inline-control">
                        <input id="emailVerificationCode" type="text" inputmode="numeric"
                               autocomplete="one-time-code" enterkeyhint="done" maxlength="6" pattern="[0-9]{6}"
                               placeholder="6자리 인증번호">
                        <button type="button" id="verifyEmailCodeButton" class="signup-secondary-button">인증 확인</button>
                    </div>
                    <p id="verificationMessage" class="signup-field-message" aria-live="polite"></p>
                </div>

                <div id="passwordField" class="signup-field" hidden>
                    <label for="pwdHash">비밀번호</label>
                    <input id="pwdHash" type="password" name="pwdHash" autocomplete="new-password"
                           minlength="8" maxlength="72" placeholder="8자 이상 영문·숫자·특수문자 조합" required>
                    <p class="signup-field-hint">8자 이상, 영문·숫자·특수문자를 각각 1자 이상 포함해주세요.</p>
                </div>

                <button type="submit" id="nextStepButton" class="signup-primary-button" disabled>다음 단계로</button>
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
    const passwordField = document.getElementById('passwordField');
    const passwordInput = document.getElementById('pwdHash');
    const nextStepButton = document.getElementById('nextStepButton');
    const sendButton = document.getElementById('sendEmailCodeButton');
    const verificationField = document.getElementById('emailVerificationField');
    const codeInput = document.getElementById('emailVerificationCode');
    const verifyButton = document.getElementById('verifyEmailCodeButton');
    const emailMessage = document.getElementById('emailMessage');
    const verificationMessage = document.getElementById('verificationMessage');

    let verifiedEmail = '';
    let cooldownTimer = null;

    const normalizeEmail = () => emailInput.value.trim().toLowerCase();

    const isPasswordValid = () => {
        const password = passwordInput.value.trim();
        return password.length >= 8
            && password.length <= 72
            && /[A-Za-z]/.test(password)
            && /[0-9]/.test(password)
            && /[^A-Za-z0-9\s]/.test(password);
    };

    const hidePasswordStep = () => {
        passwordField.hidden = true;
        passwordInput.value = '';
        passwordInput.classList.remove('is-error');
        passwordInput.removeAttribute('aria-invalid');
        nextStepButton.disabled = true;
    };

    const showPasswordStep = () => {
        passwordField.hidden = false;
        nextStepButton.disabled = !isPasswordValid();
        passwordInput.focus();
    };

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

    const setEmailMessage = (text, type) => {
        emailMessage.textContent = text;
        emailMessage.className = 'signup-field-message' + (type ? ' is-' + type : '');
        setEmailState(type === 'error' || type === 'success' ? type : '');
    };

    const setVerificationMessage = (text, type) => {
        verificationMessage.textContent = text;
        verificationMessage.className = 'signup-field-message' + (type ? ' is-' + type : '');
        codeInput.classList.remove('is-error', 'is-success');
        codeInput.removeAttribute('aria-invalid');
        if (type === 'error') {
            codeInput.classList.add('is-error');
            codeInput.setAttribute('aria-invalid', 'true');
        } else if (type === 'success') {
            codeInput.classList.add('is-success');
        }
    };

    const stopCooldown = () => {
        if (cooldownTimer) window.clearInterval(cooldownTimer);
        cooldownTimer = null;
    };

    const startCooldown = (seconds) => {
        stopCooldown();
        let remain = Math.max(1, Number(seconds) || 60);
        sendButton.disabled = true;
        sendButton.textContent = '재발송 ' + remain + '초';
        cooldownTimer = window.setInterval(() => {
            remain -= 1;
            if (remain <= 0) {
                stopCooldown();
                sendButton.disabled = false;
                sendButton.textContent = '인증번호 재발송';
                return;
            }
            sendButton.textContent = '재발송 ' + remain + '초';
        }, 1000);
    };

    const resetVerification = () => {
        verifiedEmail = '';
        verificationField.hidden = true;
        codeInput.value = '';
        codeInput.disabled = false;
        verifyButton.disabled = false;
        verifyButton.textContent = '인증 확인';
        setVerificationMessage('', '');
        setEmailMessage('', '');
        stopCooldown();
        sendButton.disabled = false;
        sendButton.textContent = '인증번호 받기';
        hidePasswordStep();
    };

    const resumeVerifiedEmail = emailInput.dataset.resumeVerified === 'true'
        ? normalizeEmail()
        : '';
    if (resumeVerifiedEmail) {
        verifiedEmail = resumeVerifiedEmail;
        verificationField.hidden = true;
        sendButton.disabled = true;
        sendButton.textContent = '인증 완료';
        setEmailMessage('인증된 이메일입니다. 비밀번호를 다시 입력해주세요.', 'success');
        showPasswordStep();
    }

    emailInput.addEventListener('input', resetVerification);

    passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('is-error');
        passwordInput.removeAttribute('aria-invalid');
        nextStepButton.disabled = !isPasswordValid();
    });

    sendButton.addEventListener('click', async () => {
        const email = normalizeEmail();
        if (!email || !emailInput.checkValidity()) {
            setEmailMessage('올바른 이메일 형식을 입력해주세요.', 'error');
            emailInput.focus();
            return;
        }

        sendButton.disabled = true;
        setEmailMessage('인증 메일을 발송하고 있습니다.', 'pending');

        try {
            const body = new URLSearchParams({ email });
            const response = await fetch(contextPath + '/users/email-verification/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                if (response.status === 429 && data.retryAfterSeconds) {
                    verifiedEmail = '';
                    hidePasswordStep();
                    verificationField.hidden = false;
                    codeInput.disabled = false;
                    verifyButton.disabled = false;
                    verifyButton.textContent = '인증 확인';
                    setEmailMessage('이미 인증메일이 발송되었습니다. 메일함을 확인해주세요.', 'pending');
                    setVerificationMessage('메일로 받은 6자리 인증번호를 입력해주세요.', 'pending');
                    startCooldown(data.retryAfterSeconds);
                    codeInput.focus();
                } else {
                    setEmailMessage(data.message || '인증 메일 발송에 실패했습니다.', 'error');
                    sendButton.disabled = false;
                }
                return;
            }

            verifiedEmail = '';
            hidePasswordStep();
            verificationField.hidden = false;
            codeInput.value = '';
            codeInput.disabled = false;
            verifyButton.disabled = false;
            verifyButton.textContent = '인증 확인';
            setVerificationMessage('메일로 받은 6자리 인증번호를 입력해주세요.', 'pending');
            setEmailMessage('인증메일을 보냈습니다. 메일함을 확인해주세요.', 'success');
            startCooldown(data.retryAfterSeconds || 60);
            codeInput.focus();
        } catch (error) {
            sendButton.disabled = false;
            setEmailMessage('인증 메일 발송 중 오류가 발생했습니다.', 'error');
        }
    });

    verifyButton.addEventListener('click', async () => {
        const email = normalizeEmail();
        const code = codeInput.value.trim();
        if (!/^\d{6}$/.test(code)) {
            setVerificationMessage('6자리 인증번호를 입력해주세요.', 'error');
            codeInput.focus();
            return;
        }

        verifyButton.disabled = true;
        setVerificationMessage('인증번호를 확인하고 있습니다.', 'pending');

        try {
            const body = new URLSearchParams({ email, code });
            const response = await fetch(contextPath + '/users/email-verification/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                verifiedEmail = '';
                hidePasswordStep();
                verifyButton.disabled = false;
                setVerificationMessage(data.message || '인증번호를 확인할 수 없습니다.', 'error');
                return;
            }

            verifiedEmail = email;
            codeInput.disabled = true;
            verifyButton.disabled = true;
            verifyButton.textContent = '인증 완료';
            setVerificationMessage(data.message || '이메일 인증이 완료되었습니다.', 'success');
            setEmailMessage('인증된 이메일입니다.', 'success');
            showPasswordStep();
        } catch (error) {
            verifyButton.disabled = false;
            setVerificationMessage('인증번호 확인 중 오류가 발생했습니다.', 'error');
        }
    });

    codeInput.addEventListener('input', () => {
        codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
        if (verifiedEmail) {
            verifiedEmail = '';
            hidePasswordStep();
        }
        setVerificationMessage('', '');
    });

    codeInput.addEventListener('paste', (event) => {
        const clipboardText = event.clipboardData?.getData('text') || '';
        const pastedCode = clipboardText.replace(/\D/g, '').slice(0, 6);
        if (!pastedCode) return;

        event.preventDefault();
        codeInput.value = pastedCode;
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));

        if (pastedCode.length === 6 && !verifyButton.disabled) {
            setVerificationMessage('인증번호를 붙여넣었습니다. 확인하고 있습니다.', 'pending');
            window.setTimeout(() => verifyButton.click(), 80);
        }
    });

    form.addEventListener('submit', (event) => {
        const email = normalizeEmail();
        if (!emailInput.checkValidity()) {
            event.preventDefault();
            setEmailMessage('올바른 이메일 형식을 입력해주세요.', 'error');
            emailInput.focus();
            return;
        }
        if (verifiedEmail !== email) {
            event.preventDefault();
            setEmailMessage('이메일 인증을 완료해주세요.', 'error');
            if (verificationField.hidden) {
                sendButton.focus();
            } else {
                codeInput.focus();
            }
            return;
        }

        passwordInput.classList.remove('is-error');
        passwordInput.removeAttribute('aria-invalid');
        if (!isPasswordValid()) {
            event.preventDefault();
            passwordInput.classList.add('is-error');
            passwordInput.setAttribute('aria-invalid', 'true');
            passwordInput.focus();
        }
    });
})();
</script>
</body>
</html>
