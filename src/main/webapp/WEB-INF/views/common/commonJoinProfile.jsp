<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>

<c:if test="${not empty sessionScope.user}">
<c:set var="joinProfileAccountName"
       value="${empty sessionScope.user.userName ? '사용자' : sessionScope.user.userName}" />
<c:set var="joinProfileAccountEmail"
       value="${empty sessionScope.user.EMAIL ? sessionScope.user.email : sessionScope.user.EMAIL}" />
<c:set var="joinProfileAccountImage"
       value="${sessionScope.user.profileImagePath}" />
<c:set var="joinProfileBirthPublic"
       value="${empty sessionScope.user.birthPublicYn ? 'N' : sessionScope.user.birthPublicYn}" />
<c:set var="joinProfileBirthDate" value="${sessionScope.user.birthDate}" />
<c:set var="joinProfileBirthCalendarType" value="${sessionScope.user.birthCalendarType}" />
<c:if test="${empty joinProfileAccountImage}">
    <c:set var="joinProfileAccountImage"
           value="${sessionScope.user.PROFILE_IMAGE_PATH}" />
</c:if>

<div id="joinProfileOverlay" class="join-profile-overlay"></div>

<div id="joinProfileModal"
     class="join-profile-modal"
     role="dialog"
     aria-modal="true"
     aria-labelledby="joinProfileTitle"
     data-context-path="${pageContext.request.contextPath}"
     data-account-email="<c:out value='${joinProfileAccountEmail}'/>"
     data-account-birth="<c:out value='${joinProfileBirthDate}'/>"
     data-account-birth-type="<c:out value='${joinProfileBirthCalendarType}'/>"
     data-account-birth-public="<c:out value='${joinProfileBirthPublic}'/>">
    <div class="join-profile-head">
        <div class="join-profile-head-copy">
            <div class="join-profile-context-row">
                <span id="joinProfileWorkspaceMark" class="join-profile-workspace-mark" aria-hidden="true">
                    <img id="joinProfileWorkspaceImage" class="join-profile-workspace-image" alt="" hidden>
                    <span id="joinProfileWorkspaceFallback" class="join-profile-workspace-fallback">그</span>
                </span>
                <span id="joinProfileWorkspaceName" class="join-profile-kicker">그룹 참여</span>
            </div>
            <h3 id="joinProfileTitle" class="join-profile-title">그룹 참여 설정</h3>
            <p id="joinProfileSubtitle" class="join-profile-subtitle">그룹에서 사용할 프로필과 공개 정보를 확인해주세요.</p>
        </div>
        <button type="button" class="join-profile-close" id="joinProfileClose" aria-label="닫기">×</button>
    </div>

    <section class="join-profile-panel join-profile-main-panel">
        <div class="join-profile-panel-head">
            <div>
                <strong>그룹에서 사용할 프로필</strong>
                <span>이 그룹에서 보일 이름과 역할을 설정합니다.</span>
            </div>
            <label class="join-profile-account-option">
                <input type="checkbox" id="joinProfileUseAccount" checked>
                <span class="join-profile-account-check" aria-hidden="true"></span>
                <span>내 기본 프로필 사용</span>
            </label>
        </div>

        <div class="join-profile-profile-grid">
            <div class="join-profile-avatar-column">
                <div id="joinProfilePreview"
                     class="join-profile-preview"
                     data-account-image="<c:out value='${joinProfileAccountImage}'/>"
                     data-account-name="<c:out value='${joinProfileAccountName}'/>">
                    <span><c:out value="${fn:substring(joinProfileAccountName,0,1)}"/></span>
                </div>
                <div class="join-profile-image-buttons">
                    <label for="joinProfileFile" class="join-profile-image-pick">이미지 변경</label>
                    <input id="joinProfileFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>
                    <div class="join-profile-image-subactions is-secondary-image-action">
                        <button type="button" id="joinProfileAdjust" class="join-profile-image-text-action" disabled title="이미지 조정">조정</button>
                        <span class="join-profile-image-action-divider" aria-hidden="true">·</span>
                        <button type="button" id="joinProfileDefault" class="join-profile-image-text-action" title="기본 프로필로 되돌리기">기본 프로필로</button>
                    </div>
                </div>
            </div>

            <div class="join-profile-fields join-profile-compact-fields">
                <div class="join-profile-field">
                    <label for="joinProfileDisplayName">표시 이름 *</label>
                    <input id="joinProfileDisplayName" maxlength="50" value="<c:out value='${joinProfileAccountName}'/>">
                </div>
                <div class="join-profile-field">
                    <label for="joinProfilePosition">그룹 직책 · 담당</label>
                    <input id="joinProfilePosition" maxlength="50" placeholder="예: 개발, 운영, 기록, 발표 등">
                </div>
                <div class="join-profile-field full">
                    <label for="joinProfileIntro">한 줄 소개 <span class="join-profile-optional">선택</span></label>
                    <input id="joinProfileIntro" maxlength="120" placeholder="나를 간단히 소개해보세요">
                </div>
            </div>
        </div>
    </section>

    <section class="join-profile-panel join-profile-privacy-panel">
        <div class="join-profile-panel-head">
            <div>
                <strong>공개 정보</strong>
                <span>그룹 멤버에게 공개할 정보를 선택하세요.</span>
            </div>
        </div>

        <div class="join-profile-privacy-list">
            <div class="join-profile-privacy-card">
                <div class="join-profile-privacy-head">
                    <label class="join-profile-privacy-label" for="joinProfileEmail">
                        <i class="fa-regular fa-envelope" aria-hidden="true"></i><strong>이메일</strong>
                    </label>
                    <label class="join-profile-toggle" for="joinProfileShowEmail">
                        <input type="checkbox" id="joinProfileShowEmail" checked>
                        <span class="join-profile-toggle-ui" aria-hidden="true"></span>
                        <span class="join-profile-toggle-text">멤버 공개</span>
                    </label>
                </div>
                <div class="join-profile-privacy-value">
                    <div class="join-profile-contact-control">
                        <input id="joinProfileEmail" maxlength="100" type="email" value="<c:out value='${joinProfileAccountEmail}'/>" autocomplete="email">
                        <span id="joinProfileEmailVerifyBadge" class="join-profile-verify-badge is-verified"><i class="fa-solid fa-check" aria-hidden="true"></i> 인증됨</span>
                        <button type="button" id="joinProfileEmailVerifyButton" class="join-profile-inline-action" hidden>인증하기</button>
                    </div>
                    <div id="joinProfileEmailCodeRow" class="join-profile-email-code" hidden>
                        <input id="joinProfileEmailCode" maxlength="6" inputmode="numeric" placeholder="인증번호 6자리">
                        <button type="button" id="joinProfileEmailCodeVerifyButton" class="join-profile-inline-action">확인</button>
                    </div>
                    <small id="joinProfileEmailVerifyText" class="join-profile-field-help">계정 이메일은 추가 인증 없이 사용할 수 있어요.</small>
                </div>
            </div>

            <div id="joinProfileBirthCard" class="join-profile-privacy-card is-static">
                <div class="join-profile-privacy-head">
                    <div class="join-profile-privacy-label">
                        <i class="fa-solid fa-cake-candles" aria-hidden="true"></i><strong>생일</strong>
                    </div>
                    <label class="join-profile-toggle" for="joinProfileShowBirth">
                        <input type="checkbox" id="joinProfileShowBirth" checked>
                        <span class="join-profile-toggle-ui" aria-hidden="true"></span>
                        <span class="join-profile-toggle-text">멤버 공개</span>
                    </label>
                </div>
                <div class="join-profile-privacy-value">
                    <div class="join-profile-birth-value">
                        <span id="joinProfileBirthValue" class="join-profile-readonly-value">등록된 생일 없음</span>
                        <span id="joinProfileBirthTypeBadge" class="join-profile-birth-type" aria-label="양력"></span>
                    </div>
                    <small id="joinProfileBirthHelp" class="join-profile-field-help">생일은 연도 없이 월/일만 공개됩니다.</small>
                </div>
            </div>

            <div class="join-profile-privacy-card">
                <div class="join-profile-privacy-head">
                    <label class="join-profile-privacy-label" for="joinProfilePhone">
                        <i class="fa-solid fa-phone" aria-hidden="true"></i><strong>연락처</strong>
                    </label>
                    <label class="join-profile-toggle" for="joinProfileShowPhone">
                        <input type="checkbox" id="joinProfileShowPhone">
                        <span class="join-profile-toggle-ui" aria-hidden="true"></span>
                        <span class="join-profile-toggle-text">멤버 공개</span>
                    </label>
                </div>
                <div class="join-profile-privacy-value">
                    <input id="joinProfilePhone" maxlength="30" inputmode="tel" autocomplete="tel" placeholder="예: 010-0000-0000">
                    <small class="join-profile-field-help">연락처는 선택 사항입니다.</small>
                </div>
            </div>
        </div>
    </section>

    <div class="join-profile-actions join-profile-sticky-actions is-single">
        <button type="button" id="joinProfileSubmit" class="join-profile-primary">참여하기</button>
    </div>
</div>

<div id="joinProfileCropModal"
     class="join-profile-crop-modal"
     role="dialog"
     aria-modal="true">
    <button type="button"
            id="joinProfileCropClose"
            class="join-profile-crop-close"
            aria-label="이미지 조정 닫기">×</button>

    <span class="join-profile-kicker">프로필 이미지 조정</span>
    <h3 class="join-profile-title join-profile-crop-title">
        원형 안에 이미지를 맞춰주세요
    </h3>

    <div id="joinProfileCropStage" class="join-profile-crop-stage">
        <img id="joinProfileCropImage" alt="">
    </div>

    <div class="join-profile-crop-label">
        <span>이미지 크기</span>
        <span id="joinProfileCropPercent">100%</span>
    </div>

    <input id="joinProfileCropZoom"
           class="join-profile-crop-range"
           type="range"
           min="1"
           max="3"
           step="0.01"
           value="1">

    <div class="join-profile-crop-help">
        드래그로 위치를 맞추고 크기를 조정하세요.
    </div>

    <div class="join-profile-crop-actions">
        <label for="joinProfileFile"
               class="join-profile-secondary">이미지 다시 선택</label>
        <button type="button"
                id="joinProfileCropApply"
                class="join-profile-primary">적용</button>
    </div>
</div>
</c:if>
