<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO 프로필 설정</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/signup.css?v=20260706-auth-ui63">
</head>
<body class="signup-body">
<main class="signup-shell">
    <section class="signup-brand-panel" aria-label="MOYO 소개">
<div class="signup-brand-copy">
            <span class="signup-eyebrow">MOYO에 모여</span>
            <h1>나를 보여주는<br>프로필을 만들어요</h1>
            <p>친구, 그룹, 프로젝트에서<br>함께 사용할 정보예요.</p>
        </div>
        <div class="signup-feature-row" aria-hidden="true">
            <span>친구</span><span>그룹</span><span>프로젝트</span><span>일정</span><span>기록</span><span>사진</span>
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
            <p>이름과 기본 정보를 설정해주세요.</p>
        </div>

        <c:if test="${param.error eq 'required' || param.error eq 'name'}">
            <div class="signup-alert is-error">사용할 이름을 입력해주세요.</div>
        </c:if>
        <c:if test="${param.error eq 'image'}">
            <div class="signup-alert is-error">프로필 이미지를 처리하지 못했습니다. 다시 선택해주세요.</div>
        </c:if>
        <c:if test="${param.error eq 'save'}">
            <div class="signup-alert is-error">프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.</div>
        </c:if>

        <form id="profileForm" action="${pageContext.request.contextPath}/users/completeJoin"
              method="post" enctype="multipart/form-data">
            <div class="signup-field">
                <label for="userName">사용할 이름</label>
                <input id="userName" type="text" name="userName" maxlength="30"
                       autocomplete="nickname" placeholder="이름을 입력해주세요" required autofocus>
                <p class="signup-field-hint">MOYO 기본 이름이에요. 그룹/프로젝트 닉네임은 따로 설정할 수 있어요.</p>
            </div>

            <div class="signup-field signup-birth-field">
                <div class="signup-birth-label-row">
                    <label for="birthDateDisplay" class="signup-birth-label">
                        <span>생일</span>
                        <span class="signup-optional-label">선택</span>
                    </label>
                    <div class="signup-birth-type-toggle" role="group" aria-label="생일 양력 음력 선택">
                        <button type="button" class="is-active" data-birth-type="SOLAR">양력</button>
                        <button type="button" data-birth-type="LUNAR">음력</button>
                    </div>
                </div>
                <div class="signup-birth-picker" data-birth-picker>
                    <input id="birthDateDisplay" type="text" class="signup-birth-display"
                           placeholder="연도-월-일" autocomplete="off" readonly>
                    <input id="birthDate" type="hidden" name="birthDate" autocomplete="bday">
                    <input id="birthCalendarType" type="hidden" name="birthCalendarType" value="SOLAR">
                    <button type="button" class="signup-birth-trigger" aria-label="생일 날짜 선택"
                            aria-expanded="false" aria-controls="birthCalendar">
                        <span class="signup-birth-icon" aria-hidden="true"></span>
                    </button>
                    <div id="birthCalendar" class="signup-birth-calendar" hidden>
                        <div class="signup-birth-calendar-head">
                            <button type="button" class="signup-birth-nav" data-birth-prev aria-label="이전 달">‹</button>
                            <button type="button" class="signup-birth-month" data-birth-month aria-expanded="false" aria-controls="birthJumpPanel"></button>
                            <button type="button" class="signup-birth-nav" data-birth-next aria-label="다음 달">›</button>
                        </div>
                        <div id="birthJumpPanel" class="signup-birth-jump" data-birth-jump hidden>
                            <div class="signup-birth-jump-head">
                                <button type="button" class="signup-birth-jump-nav" data-birth-year-prev aria-label="이전 연도 범위">‹</button>
                                <strong data-birth-year-range></strong>
                                <button type="button" class="signup-birth-jump-nav" data-birth-year-next aria-label="다음 연도 범위">›</button>
                            </div>
                            <div class="signup-birth-year-grid" data-birth-year-grid aria-label="연도 선택"></div>
                            <div class="signup-birth-month-grid" data-birth-month-grid aria-label="월 선택"></div>
                        </div>
                        <div class="signup-birth-weekdays" aria-hidden="true">
                            <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
                        </div>
                        <div class="signup-birth-days" data-birth-days></div>
                        <div class="signup-birth-calendar-foot">
                            <button type="button" data-birth-clear>삭제</button>
                            <button type="button" data-birth-today>오늘</button>
                        </div>
                    </div>
                </div>
                <p class="signup-field-hint">캘린더 표시와 생일 알림에 사용돼요. 비공개는 마이페이지에서 설정할 수 있어요.</p>
            </div>

            <div class="signup-profile-editor signup-profile-editor-bottom">
                <div id="profileViewport" class="signup-profile-viewport">
                    <canvas id="profileCanvas" width="500" height="500" aria-label="프로필 사진 미리보기"></canvas>
                    <span id="avatarFallback" class="signup-avatar-preview">모</span>
                </div>

                <div class="signup-profile-actions">
                    <label for="profileFile" class="signup-secondary-button signup-image-button is-active">사진 선택</label>
                    <input id="profileFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>
                    <button id="removeProfile" type="button" class="signup-secondary-button signup-avatar-button">기본 아바타</button>
                </div>


                <p class="signup-profile-hint">프로필 사진은 나중에 마이페이지에서 변경할 수 있어요.</p>
                <input id="profileImageData" type="hidden" name="profileImageData">
                <input id="profileOriginalImageData" type="hidden" name="profileOriginalImageData">
                <input id="profileCropScaleHidden" type="hidden" name="profileCropScale">
                <input id="profileCropX" type="hidden" name="profileCropX">
                <input id="profileCropY" type="hidden" name="profileCropY">
                <input id="profileAvatarType" type="hidden" name="profileAvatarType" value="DEFAULT">
            </div>
            <button id="completeJoinButton" type="submit" class="signup-primary-button">MOYO 시작하기</button>
        </form>

        <a class="signup-back-link" href="${pageContext.request.contextPath}/users/joinForm">← 이전 단계로</a>
    </section>
</main>

<div id="profileCropModal" class="signup-profile-modal" hidden role="dialog" aria-modal="true" aria-labelledby="profileCropTitle">
    <div class="signup-profile-modal-backdrop" data-profile-modal-close></div>
    <div class="signup-profile-modal-dialog">
        <div class="signup-profile-modal-head">
            <div>
                <span class="signup-profile-modal-kicker">프로필 사진 조정</span>
                <h3 id="profileCropTitle">원형 안에 사진을 맞춰주세요</h3>
            </div>
            <button type="button" class="signup-profile-modal-close" data-profile-modal-close aria-label="닫기">×</button>
        </div>

        <div id="profileCropViewport" class="signup-profile-crop-viewport">
            <canvas id="profileCropCanvas" width="500" height="500" aria-label="프로필 사진 조정 미리보기"></canvas>
        </div>

        <div class="signup-profile-crop-control">
            <div class="signup-profile-crop-head">
                <span>사진 크기</span>
                <output id="profileCropScaleValue" for="profileCropScaleRange">115%</output>
            </div>
            <input id="profileCropScaleRange" type="range" min="70" max="200" step="1" value="115">
        </div>

        <p class="signup-profile-modal-hint">드래그로 위치를 맞추고, 크기를 조정하세요.</p>

        <div class="signup-profile-modal-actions signup-profile-modal-actions--simple">
            <label for="profileFile" class="signup-secondary-button">사진 다시 선택</label>
            <button type="button" class="signup-primary-button signup-profile-apply" data-profile-modal-apply>적용</button>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/js/signupProfile.js?v=20260706-auth-ui63"></script>
</body>
</html>
