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
       value="${empty sessionScope.user.birthPublicYn ? 'Y' : sessionScope.user.birthPublicYn}" />
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
     data-context-path="${pageContext.request.contextPath}">
    <div class="join-profile-head">
        <div>
            <span class="join-profile-kicker">그룹 프로필</span>
            <h3 id="joinProfileTitle" class="join-profile-title">그룹 참여 프로필</h3>
        </div>
        <button type="button"
                class="join-profile-close"
                id="joinProfileClose"
                aria-label="닫기">×</button>
    </div>

    <label class="join-profile-switch-row">
        <span>
            <strong>계정 기본 프로필 사용</strong>
            <small>켜면 계정 이름과 계정 프로필 사진을 사용합니다. 그룹 전용 정보는 보존됩니다.</small>
        </span>
        <input type="checkbox" id="joinProfileUseAccount" checked>
    </label>

    <div class="join-profile-image-row">
        <div id="joinProfilePreview"
             class="join-profile-preview"
             data-account-image="<c:out value='${joinProfileAccountImage}'/>"
             data-account-name="<c:out value='${joinProfileAccountName}'/>">
            <span><c:out value="${fn:substring(joinProfileAccountName,0,1)}"/></span>
        </div>

        <div class="join-profile-image-tools">
            <strong>그룹용 프로필 이미지</strong>
            <div class="join-profile-image-buttons">
                <label for="joinProfileFile"
                       class="join-profile-secondary">이미지 선택</label>
                <input id="joinProfileFile"
                       type="file"
                       accept="image/png,image/jpeg,image/webp"
                       hidden>
                <button type="button"
                        id="joinProfileAdjust"
                        class="join-profile-secondary"
                        disabled>이미지 조정</button>
                <button type="button"
                        id="joinProfileDefault"
                        class="join-profile-secondary">기본 아바타</button>
            </div>
            <p class="join-profile-hint">
                이미지를 선택한 뒤 위치와 크기를 조정하거나 기본 아바타로 전환할 수 있습니다.
            </p>
        </div>
    </div>

    <div class="join-profile-fields">
        <div class="join-profile-field">
            <label for="joinProfileDisplayName">그룹 표시 이름 *</label>
            <input id="joinProfileDisplayName"
                   maxlength="50"
                   value="<c:out value='${joinProfileAccountName}'/>">
        </div>

        <div class="join-profile-field">
            <label for="joinProfilePosition">그룹에서의 역할</label>
            <input id="joinProfilePosition"
                   maxlength="50"
                   placeholder="예: 운영진, 발표 담당">
        </div>

        <div class="join-profile-field full">
            <label for="joinProfileEmail">그룹 이메일 *</label>
            <input id="joinProfileEmail"
                   maxlength="100"
                   value="<c:out value='${joinProfileAccountEmail}'/>">
            <small class="join-profile-field-help">
                그룹 멤버에게 표시되는 활동용 이메일입니다.
            </small>
        </div>

        <div class="join-profile-field full">
            <label for="joinProfilePhone">전화번호</label>
            <input id="joinProfilePhone"
                   maxlength="30"
                   placeholder="예: 010-0000-0000">
        </div>

        <div class="join-profile-field full join-profile-privacy-options">
            <label class="join-profile-check">
                <input type="checkbox" id="joinProfileShowPhone">
                다른 그룹 멤버에게 전화번호 공개
            </label>
            <label class="join-profile-check">
                <input type="checkbox"
                       id="joinProfileShowBirth"
                       ${joinProfileBirthPublic ne 'N' ? 'checked' : ''}>
                다른 그룹 멤버에게 생일 공개
            </label>
        </div>
    </div>

    <div class="join-profile-actions is-single">
        <button type="button"
                id="joinProfileSubmit"
                class="join-profile-primary">참여하기</button>
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
