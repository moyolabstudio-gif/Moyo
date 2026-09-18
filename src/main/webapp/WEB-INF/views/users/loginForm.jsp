<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO 로그인</title>
    <link id="moyo-fontawesome-css" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" referrerpolicy="no-referrer">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260906-brand-feature-icons">
    <script src="${pageContext.request.contextPath}/js/moyoCsrf.js?v=csrf-v1"></script>
</head>
<body class="signup-body">
    <main class="signup-shell">
        <section class="signup-brand-panel" aria-label="MOYO 소개">
            <div class="signup-brand-copy">
                <span class="signup-eyebrow">MOYO에 모여</span>
                <h1>함께하던 순간을<br>다시 이어가요</h1>
                <p>일정, 노트, 사진과 파일을<br>MOYO에서 계속 이어가세요.</p>
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

        <section class="signup-card login-card-panel">
            <a class="signup-card-logo-link" href="${pageContext.request.contextPath}/">
                <img class="signup-card-logo"
                     src="${pageContext.request.contextPath}/brand/moyo_logo.png"
                     alt="MOYO">
            </a>

            <c:choose>
                <c:when test="${param.status eq 'withdrawPending'}">
                    <div class="login-heading">
                        <span class="signup-section-label">ACCOUNT RECOVERY</span>
                        <h2>탈퇴 신청 중인 계정입니다</h2>
                        <p class="recovery-description">
                            <span class="line">아직 복구 기간이 남아 있어요.</span>
                            <span class="line recovery-description-main">탈퇴 신청을 취소하면 기존 계정과 기록을 그대로 이어서 이용할 수 있습니다.</span>
                        </p>
                    </div>

                    <div class="signup-alert recovery-deadline-alert">
                        <c:choose>
                            <c:when test="${not empty sessionScope.withdrawPendingDeadline}">
                                <fmt:parseDate value="${sessionScope.withdrawPendingDeadline}"
                                               pattern="yyyy-MM-dd"
                                               var="withdrawDeadlineDate" />
                                복구 가능 기한: <strong><fmt:formatDate value="${withdrawDeadlineDate}" pattern="yyyy년 M월 d일" />까지</strong>
                            </c:when>
                            <c:otherwise>
                                탈퇴 신청 후 30일 이내에는 계정을 복구할 수 있습니다.
                            </c:otherwise>
                        </c:choose>
                    </div>

                    <form action="${pageContext.request.contextPath}/users/withdraw/cancel"
                          method="post"
                          class="login-withdraw-cancel-form">
                        <button type="submit" class="signup-primary-button">
                            탈퇴 신청 취소하고 계속 이용하기
                        </button>
                    </form>

                    <a class="login-home-link" href="${pageContext.request.contextPath}/">
                        ← 홈으로 돌아가기
                    </a>
                </c:when>

                <c:otherwise>
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


                    <c:if test="${param.status eq 'loginLimited'}">
                        <div class="signup-alert is-error login-error">
                            로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.
                        </div>
                    </c:if>
                    <c:if test="${param.status eq 'locked'}">
                        <div class="signup-alert is-error login-error">
                            로그인이 일시적으로 제한된 계정입니다. 잠시 후 다시 시도해주세요.
                        </div>
                    </c:if>

                    <c:if test="${param.status eq 'suspended'}">
                        <div class="signup-alert is-error login-error">
                            이용이 제한된 계정입니다. 문의하기를 통해 확인해주세요.
                        </div>
                    </c:if>

                    <c:if test="${param.status eq 'unavailable'}">
                        <div class="signup-alert is-error login-error">
                            현재 사용할 수 없는 계정입니다.
                        </div>
                    </c:if>

                    <c:if test="${param.status eq 'passwordReset'}">
                        <div class="signup-alert login-success">
                            비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.
                        </div>
                    </c:if>

                    <c:if test="${param.status eq 'sessionExpired'}">
                        <div class="signup-alert is-error login-error">
                            보안 정보가 변경되어 다시 로그인이 필요합니다.
                        </div>
                    </c:if>

                    <form class="login-form"
                          id="loginForm"
                          action="${pageContext.request.contextPath}/users/login"
                          method="post">
                        <div class="signup-field">
                            <div class="login-email-label-row">
                                <label for="email">이메일</label>
                                <label class="login-remember-email" for="rememberEmail">
                                    <span>이메일 기억하기</span>
                                    <input id="rememberEmail" type="checkbox">
                                    <span class="login-remember-check" aria-hidden="true">
                                        <i class="fa-solid fa-check"></i>
                                    </span>
                                </label>
                            </div>
                            <input id="email"
                                   type="email"
                                   name="email"
                                   autocomplete="username"
                                   value="<c:out value='${loginAttemptEmail}'/>"
                                   data-attempted-email="<c:out value='${loginAttemptEmail}'/>"
                                   placeholder="name@example.com"
                                   required>
                        </div>

                        <div class="signup-field">
                            <div class="login-password-label-row">
                                <label for="pwdHash">비밀번호</label>
                                <a href="${pageContext.request.contextPath}/users/password-reset">비밀번호 찾기</a>
                            </div>
                            <div class="login-password-input-wrap">
                                <input id="pwdHash"
                                       type="password"
                                       name="pwdHash"
                                       autocomplete="current-password"
                                       placeholder="비밀번호를 입력해주세요"
                                       required>
                                <button type="button"
                                        class="login-password-toggle"
                                        id="loginPasswordToggle"
                                        aria-label="비밀번호 보기"
                                        aria-pressed="false">
                                    <svg class="login-password-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path class="login-password-eye__shape" d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z"></path>
                                        <circle class="login-password-eye__pupil" cx="12" cy="12" r="2.15"></circle>
                                        <path class="login-password-eye__slash" d="M5 5 19 19"></path>
                                    </svg>
                                </button>
                            </div>
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
                </c:otherwise>
            </c:choose>
        </section>
    </main>

    <script>
        (() => {
            const form = document.getElementById('loginForm');
            const emailInput = document.getElementById('email');
            const rememberEmail = document.getElementById('rememberEmail');
            const passwordInput = document.getElementById('pwdHash');
            const passwordToggle = document.getElementById('loginPasswordToggle');
            const storageKey = 'moyo.rememberedLoginEmail';

            if (!form || !emailInput || !rememberEmail || !passwordInput || !passwordToggle) return;

            const attemptedEmail = (emailInput.dataset.attemptedEmail || '').trim();

            try {
                const savedEmail = localStorage.getItem(storageKey);

                // 로그인 실패 후 돌아온 경우에는 방금 시도한 이메일을 최우선으로 유지한다.
                // 저장된 이메일이나 브라우저 자동완성이 실패한 계정을 덮어쓰지 못하게 한다.
                if (attemptedEmail) {
                    emailInput.value = attemptedEmail;
                    rememberEmail.checked = Boolean(savedEmail && savedEmail === attemptedEmail);

                    // 일부 브라우저가 페이지 렌더 후 저장 계정을 다시 채우는 경우를 한 번 더 보정한다.
                    window.setTimeout(() => {
                        if (emailInput.value !== attemptedEmail) {
                            emailInput.value = attemptedEmail;
                        }
                    }, 80);
                } else if (!emailInput.value.trim() && savedEmail) {
                    emailInput.value = savedEmail;
                    rememberEmail.checked = true;
                    passwordInput.focus();
                }
            } catch (error) {}

            rememberEmail.addEventListener('change', () => {
                if (!rememberEmail.checked) {
                    try { localStorage.removeItem(storageKey); } catch (error) {}
                }
            });

            form.addEventListener('submit', () => {
                const email = emailInput.value.trim();

                // "이메일 기억하기"는 사용자가 입력한 로그인 이메일을 브라우저에 저장하는 옵션이다.
                // submit 이벤트는 페이지 이동 전에 실행되므로 로그인 성공/실패와 관계없이
                // 사용자가 체크한 현재 입력값을 저장해 다음 로그인 화면에서 그대로 복원한다.
                try {
                    if (rememberEmail.checked && email) {
                        localStorage.setItem(storageKey, email);
                    } else {
                        localStorage.removeItem(storageKey);
                    }
                } catch (error) {}
            });

            passwordToggle.addEventListener('click', () => {
                const willShow = passwordInput.type === 'password';
                passwordInput.type = willShow ? 'text' : 'password';
                passwordToggle.setAttribute('aria-pressed', String(willShow));
                passwordToggle.setAttribute('aria-label', willShow ? '비밀번호 숨기기' : '비밀번호 보기');

                passwordToggle.classList.toggle('is-visible', willShow);

                passwordInput.focus({ preventScroll: true });
                try {
                    const length = passwordInput.value.length;
                    passwordInput.setSelectionRange(length, length);
                } catch (error) {}
            });
        })();
    </script>

    <script>
        document.querySelector('.login-withdraw-cancel-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const button = form.querySelector('button[type="submit"]');
            if (button) button.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                const result = await response.json();
                if (result.status !== 'success') {
                    alert(result.message || '탈퇴 신청을 취소하지 못했습니다.');
                    location.href = '${pageContext.request.contextPath}/users/loginForm';
                    return;
                }
                alert(result.message || '탈퇴 신청이 취소되었습니다.');
                location.href = '${pageContext.request.contextPath}/calendar?scope=PRIVATE&calendarContext=PERSONAL';
            } catch (error) {
                alert('탈퇴 신청 취소 중 오류가 발생했습니다. 다시 로그인해주세요.');
                location.href = '${pageContext.request.contextPath}/users/loginForm';
            } finally {
                if (button) button.disabled = false;
            }
        });
    </script>
</body>
</html>
