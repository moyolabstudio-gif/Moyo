<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO 비밀번호 재설정</title>
    <link id="moyo-fontawesome-css" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" referrerpolicy="no-referrer">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260906-password-reset-brand">
    <script src="${pageContext.request.contextPath}/js/moyoCsrf.js?v=csrf-v1"></script>
</head>
<body class="signup-body">
<main class="signup-shell">
    <section class="signup-brand-panel" aria-label="MOYO 소개">
        <div class="signup-brand-copy">
            <span class="signup-eyebrow">MOYO에 모여</span>
            <h1>다시 안전하게<br>MOYO를 이어가요</h1>
            <p>이메일 본인 확인 후<br>새 비밀번호를 설정할 수 있어요.</p>
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

    <section class="signup-card login-card-panel password-reset-card">
        <a class="signup-card-logo-link" href="${pageContext.request.contextPath}/">
            <img class="signup-card-logo"
                 src="${pageContext.request.contextPath}/brand/moyo_logo.png"
                 alt="MOYO">
        </a>

        <div class="login-heading">
            <span class="signup-section-label">PASSWORD RESET</span>
            <h2>비밀번호를 다시 설정할까요?</h2>
            <p id="resetDescription">가입한 이메일로 본인 확인을 진행해주세요.</p>
        </div>

        <div id="resetMessage" class="signup-alert password-reset-message" hidden></div>

        <div id="resetStepEmail">
            <div class="signup-field">
                <label for="resetEmail">이메일</label>
                <div class="signup-inline-control">
                    <input id="resetEmail" type="email" autocomplete="email"
                           placeholder="name@example.com" required>
                    <button id="sendResetCode" type="button" class="signup-secondary-button">인증번호 받기</button>
                </div>
            </div>

            <div id="resetCodeArea" class="signup-field" hidden>
                <label for="resetCode">인증번호</label>
                <div class="signup-inline-control">
                    <input id="resetCode" type="text" inputmode="numeric"
                           maxlength="6" autocomplete="one-time-code"
                           placeholder="6자리 인증번호">
                    <button id="verifyResetCode" type="button" class="signup-secondary-button">확인</button>
                </div>
                <p class="signup-field-help">인증번호는 5분 동안 유효합니다.</p>
            </div>
        </div>

        <form id="resetPasswordForm" hidden>
            <div class="signup-field">
                <label for="newPassword">새 비밀번호</label>
                <input id="newPassword" name="newPassword" type="password"
                       autocomplete="new-password" minlength="8" maxlength="72"
                       placeholder="8자 이상 영문·숫자·특수문자 조합" required>
                <p class="signup-field-help">8자 이상, 영문·숫자·특수문자를 각각 1자 이상 포함해주세요.</p>
            </div>

            <div class="signup-field">
                <label for="confirmPassword">새 비밀번호 확인</label>
                <input id="confirmPassword" name="confirmPassword" type="password"
                       autocomplete="new-password" minlength="8" maxlength="72"
                       placeholder="새 비밀번호를 다시 입력해주세요" required>
            </div>

            <button type="submit" class="signup-primary-button">비밀번호 변경</button>
        </form>

        <a class="login-home-link" href="${pageContext.request.contextPath}/users/loginForm">
            ← 로그인으로 돌아가기
        </a>
    </section>
</main>

<script>
(() => {
    const contextPath = '${pageContext.request.contextPath}';
    const email = document.getElementById('resetEmail');
    const codeArea = document.getElementById('resetCodeArea');
    const code = document.getElementById('resetCode');
    const sendButton = document.getElementById('sendResetCode');
    const verifyButton = document.getElementById('verifyResetCode');
    const passwordForm = document.getElementById('resetPasswordForm');
    const emailStep = document.getElementById('resetStepEmail');
    const message = document.getElementById('resetMessage');
    const description = document.getElementById('resetDescription');

    let resendTimer = null;
    let lastSentEmail = '';

    function showMessage(text, error) {
        message.hidden = false;
        message.textContent = text || '';
        message.className = 'signup-alert password-reset-message' + (error ? ' is-error' : ' login-success');
    }

    function hideMessage() {
        message.hidden = true;
        message.textContent = '';
    }

    function stopCooldown() {
        if (resendTimer) {
            window.clearInterval(resendTimer);
            resendTimer = null;
        }
    }

    function startCooldown(seconds) {
        stopCooldown();
        let remaining = Math.max(1, Number(seconds) || 60);
        sendButton.disabled = true;

        const render = () => {
            sendButton.textContent = '재발송 ' + remaining + '초';
        };
        render();

        resendTimer = window.setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                stopCooldown();
                sendButton.disabled = false;
                sendButton.textContent = '인증번호 재발송';
                return;
            }
            render();
        }, 1000);
    }

    function resetCodeStep() {
        stopCooldown();
        codeArea.hidden = true;
        code.value = '';
        lastSentEmail = '';
        sendButton.disabled = false;
        sendButton.textContent = '인증번호 받기';
    }

    async function post(url, data) {
        const body = new URLSearchParams(data);
        const response = await fetch(contextPath + url, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
            credentials: 'same-origin',
            body
        });
        let result = {};
        try { result = await response.json(); } catch (_) {}
        return {response, result};
    }

    email.addEventListener('input', () => {
        const currentEmail = email.value.trim().toLowerCase();
        if (lastSentEmail && currentEmail !== lastSentEmail) {
            resetCodeStep();
            hideMessage();
        }
    });

    sendButton.addEventListener('click', async () => {
        const value = email.value.trim();
        if (!value) {
            showMessage('이메일을 입력해주세요.', true);
            return;
        }

        sendButton.disabled = true;
        try {
            const {response, result} = await post('/users/password-reset/send', {email: value});

            if (response.ok && result.success) {
                lastSentEmail = value.toLowerCase();
                codeArea.hidden = false;
                code.value = '';
                showMessage(result.message || '인증번호를 발송했습니다. 메일함을 확인해주세요.', false);
                startCooldown(result.retryAfterSeconds || 60);
                code.focus();
                return;
            }

            if (response.status === 404) {
                resetCodeStep();
                showMessage(result.message || '가입된 이메일이 없습니다.', true);
                email.focus();
                return;
            }

            if (response.status === 429) {
                lastSentEmail = value.toLowerCase();
                codeArea.hidden = false;
                showMessage('이미 인증번호를 발송했습니다. 받은 인증번호를 입력해주세요.', false);
                startCooldown(result.retryAfterSeconds || 60);
                code.focus();
                return;
            }

            showMessage(result.message || '인증 메일을 발송하지 못했습니다.', true);
            sendButton.disabled = false;
        } catch (_) {
            showMessage('인증 메일 요청 중 오류가 발생했습니다.', true);
            sendButton.disabled = false;
        }
    });

    async function verifyCode() {
        const emailValue = email.value.trim();
        const codeValue = code.value.trim();
        if (!/^\d{6}$/.test(codeValue)) {
            showMessage('6자리 인증번호를 입력해주세요.', true);
            return;
        }

        verifyButton.disabled = true;
        try {
            const {response, result} = await post('/users/password-reset/verify', {
                email: emailValue,
                code: codeValue
            });
            showMessage(result.message, !response.ok);
            if (response.ok && result.success) {
                stopCooldown();
                email.readOnly = true;
                emailStep.hidden = true;
                passwordForm.hidden = false;
                description.textContent = '본인 확인이 완료되었습니다. 새 비밀번호를 입력해주세요.';
                document.getElementById('newPassword').focus();
            }
        } catch (_) {
            showMessage('인증번호 확인 중 오류가 발생했습니다.', true);
        } finally {
            verifyButton.disabled = false;
        }
    }

    verifyButton.addEventListener('click', verifyCode);

    code.addEventListener('input', () => {
        const digits = code.value.replace(/\D/g, '').slice(0, 6);
        if (code.value !== digits) code.value = digits;
    });

    code.addEventListener('paste', (event) => {
        const pasted = (event.clipboardData || window.clipboardData).getData('text');
        const digits = pasted.replace(/\D/g, '').slice(0, 6);
        if (!digits) return;
        event.preventDefault();
        code.value = digits;
        if (digits.length === 6) {
            window.setTimeout(verifyCode, 0);
        }
    });

    passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const passwordValid = newPassword.length >= 8
            && newPassword.length <= 72
            && /[A-Za-z]/.test(newPassword)
            && /[0-9]/.test(newPassword)
            && /[^A-Za-z0-9\s]/.test(newPassword);
        if (!passwordValid) {
            showMessage('새 비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 각각 1자 이상 포함해주세요.', true);
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage('새 비밀번호 확인이 일치하지 않습니다.', true);
            return;
        }

        const submit = passwordForm.querySelector('button[type="submit"]');
        submit.disabled = true;
        try {
            const {response, result} = await post('/users/password-reset/complete', {
                email: email.value.trim(),
                newPassword,
                confirmPassword
            });
            if (!response.ok || !result.success) {
                showMessage(result.message || '비밀번호를 변경하지 못했습니다.', true);
                return;
            }
            location.href = contextPath + '/users/loginForm?status=passwordReset';
        } catch (_) {
            showMessage('비밀번호 변경 중 오류가 발생했습니다.', true);
        } finally {
            submit.disabled = false;
        }
    });
})();
</script>
</body>
</html>
