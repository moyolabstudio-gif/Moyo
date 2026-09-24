<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>새 그룹 만들기 - MOYO</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=moyo-ui-controls-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/workspaceCreate.css?v=20260923-mobile-step2-final">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoCreate.css?v=20260923-linkhelp">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

</head>
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<div class="create-wrap moyo-create-page"
     data-account-name="<c:out value='${accountDisplayName}'/>"
     data-account-email="<c:out value='${accountEmail}'/>"
     data-account-birth="<c:out value='${accountBirthDate}'/>"
     data-account-birth-type="<c:out value='${accountBirthCalendarType}'/>">
    <div class="create-card moyo-create-card">
        <div class="moyo-create-header">
            <div class="moyo-create-title">
                <span class="create-step-label moyo-create-step" id="workspaceCreateStepLabel">1 / 2</span>
                <h2 id="workspaceCreateTitle">새 그룹 만들기</h2>
                <p class="create-desc" id="workspaceCreateSubTitle">그룹 정보를 입력한 다음, 이 그룹에서 사용할 프로필을 선택합니다.</p>
            </div>
            <div class="moyo-create-title-actions">
                <button type="button" class="moyo-create-back-button" onclick="history.back()">돌아가기</button>
            </div>
        </div>

        <section id="workspaceStep" class="create-panel moyo-create-panel is-active" data-step="1">

            <div class="form-group moyo-create-field moyo-create-type-field">
                <div class="moyo-create-label-row">
                    <span class="moyo-create-label">그룹 유형 <span class="moyo-create-required">*</span></span>
                    <span class="moyo-create-help">가장 가까운 유형을 선택하세요.</span>
                </div>
                <input type="hidden" id="wsType" value="COMMUNITY">
                <div class="moyo-create-type-picker" data-workspace-type-picker role="radiogroup" aria-label="그룹 유형">
                    <div class="moyo-create-type-grid moyo-create-type-grid--workspace">
                        <button type="button" class="moyo-create-type-option" data-workspace-type="ORGANIZATION" aria-pressed="false">
                            <span class="moyo-create-type-option__icon"><i class="fa-solid fa-building" aria-hidden="true"></i></span>
                            <span class="moyo-create-type-option__name">회사 · 조직</span>
                        </button>
                        <button type="button" class="moyo-create-type-option" data-workspace-type="TEAM" aria-pressed="false">
                            <span class="moyo-create-type-option__icon"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span>
                            <span class="moyo-create-type-option__name">팀 · 프로젝트</span>
                        </button>
                        <button type="button" class="moyo-create-type-option" data-workspace-type="STUDY" aria-pressed="false">
                            <span class="moyo-create-type-option__icon"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span>
                            <span class="moyo-create-type-option__name">스터디 · 연구</span>
                        </button>
                        <button type="button" class="moyo-create-type-option" data-workspace-type="COMMUNITY" aria-pressed="true">
                            <span class="moyo-create-type-option__icon"><i class="fa-solid fa-comments" aria-hidden="true"></i></span>
                            <span class="moyo-create-type-option__name">모임 · 커뮤니티</span>
                        </button>
                        <button type="button" class="moyo-create-type-option" data-workspace-type="CLUB" aria-pressed="false">
                            <span class="moyo-create-type-option__icon"><i class="fa-solid fa-palette" aria-hidden="true"></i></span>
                            <span class="moyo-create-type-option__name">동아리 · 취미</span>
                        </button>
                        <button type="button" class="moyo-create-type-option" data-workspace-type="LIFE" aria-pressed="false">
                            <span class="moyo-create-type-option__icon"><i class="fa-solid fa-house" aria-hidden="true"></i></span>
                            <span class="moyo-create-type-option__name">가족 · 생활</span>
                        </button>
                        <button type="button" class="moyo-create-type-option" data-workspace-type="ETC" aria-pressed="false">
                            <span class="moyo-create-type-option__icon"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></span>
                            <span class="moyo-create-type-option__name">기타</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="form-group moyo-create-field">
                <div class="moyo-create-label-row">
                    <label class="moyo-create-label" for="wsName">그룹 이름 <span class="moyo-create-required">*</span></label>
                    <span class="moyo-create-count"><span id="workspaceNameCount">0</span> / 60</span>
                </div>
                <input class="moyo-create-control" type="text" id="wsName" maxlength="60" placeholder="그룹 이름을 입력하세요">
            </div>
            <div class="form-group moyo-create-field">
                <div class="moyo-create-label-row">
                    <label class="moyo-create-label" for="wsDesc">그룹 소개</label>
                    <span class="moyo-create-help">그룹의 목적이나 분위기를 간단히 적어주세요.</span>
                </div>
                <div class="moyo-create-textarea-wrap">
                    <textarea class="moyo-create-control" id="wsDesc" rows="3" maxlength="300" placeholder="그룹을 소개해주세요"></textarea>
                    <span class="moyo-create-count"><span id="workspaceDescCount">0</span> / 300</span>
                </div>
            </div>
            <div class="form-group moyo-create-field">
                <span class="field-title moyo-create-label">가입 방식 <span class="moyo-create-required">*</span></span>
                <div class="moyo-create-choice-grid moyo-create-choice-grid--3" role="radiogroup" aria-label="그룹 가입 방식">
                    <label class="moyo-create-choice-option">
                        <input class="moyo-create-choice-input" type="radio" name="joinType" value="OPEN" checked>
                        <span class="moyo-create-choice">
                            <span class="moyo-create-choice__icon"><i class="fa-solid fa-door-open" aria-hidden="true"></i></span>
                            <span class="moyo-create-choice__copy">
                                <strong>자유 가입</strong>
                                <span>승인 없이 바로 참여할 수 있어요.</span>
                            </span>
                        </span>
                    </label>
                    <label class="moyo-create-choice-option">
                        <input class="moyo-create-choice-input" type="radio" name="joinType" value="APPROVAL">
                        <span class="moyo-create-choice">
                            <span class="moyo-create-choice__icon"><i class="fa-solid fa-user-check" aria-hidden="true"></i></span>
                            <span class="moyo-create-choice__copy">
                                <strong>승인 후 가입</strong>
                                <span>그룹장 또는 관리자의 승인 후 참여해요.</span>
                            </span>
                        </span>
                    </label>
                    <label class="moyo-create-choice-option">
                        <input class="moyo-create-choice-input" type="radio" name="joinType" value="INVITE_ONLY">
                        <span class="moyo-create-choice">
                            <span class="moyo-create-choice__icon"><i class="fa-solid fa-envelope" aria-hidden="true"></i></span>
                            <span class="moyo-create-choice__copy">
                                <strong>초대 전용</strong>
                                <span>초대받은 사용자만 참여할 수 있어요.</span>
                            </span>
                        </span>
                    </label>
                </div>
            </div>

            <div class="form-group moyo-create-field">
                <span class="field-title moyo-create-label">대표 이미지</span>
                <div class="workspace-image-summary">
                    <div class="workspace-image-preview" aria-label="그룹 대표 이미지 미리보기">
                        <img id="workspacePreviewImage" hidden alt="그룹 대표 이미지">
                        <img id="workspaceDefaultMascot" src="${pageContext.request.contextPath}/brand/moyo_mark.png" alt="" aria-hidden="true">
                        <span id="workspaceImagePlaceholder" hidden></span>
                    </div>
                    <div class="workspace-image-copy">
                        <div class="profile-account-actions">
                            <label id="workspaceImageSelectLabel" for="wsImage" class="profile-account-button is-primary">이미지 변경</label>
                            <input type="file" id="wsImage" accept="image/png,image/jpeg,image/webp" hidden>
                            <button type="button" id="workspaceImageAdjustButton" class="profile-account-button" hidden>이미지 조정</button>
                            <button type="button" id="workspaceImageDefaultButton" class="profile-account-button">기본 이미지</button>
                        </div>
                        <p>선택한 이미지는 조정 화면에서 위치와 크기를 맞출 수 있어요.</p>
                    </div>
                </div>
            </div>
            <div class="form-group moyo-create-field moyo-create-link-field">
                <div class="moyo-create-link-head">
                    <div class="moyo-create-link-title">
                        <span class="field-title moyo-create-label">외부 링크</span>
                        <span class="moyo-create-link-count" id="workspaceLinkCount">0 / 5</span>
                    </div>
                    <button type="button" id="workspaceLinkAdd" class="moyo-create-link-add" >
                        <i class="fa-solid fa-plus" aria-hidden="true"></i><span>링크 추가</span>
                    </button>
                </div>
                <div id="workspaceLinkList" class="workspace-link-list moyo-create-link-list"></div>
                <div id="workspaceLinkEmpty" class="moyo-create-link-empty">
                    <i class="fa-solid fa-link" aria-hidden="true"></i>
                    <span>등록된 링크가 없습니다.</span>
                </div>
                <p class="workspace-link-help moyo-create-help moyo-create-link-help">Git, Notion, 문서 등 필요한 링크를 최대 5개까지 등록할 수 있어요.</p>
                <p id="workspaceLinkError" class="moyo-create-error moyo-create-link-error" hidden></p>
            </div>
            <div class="create-actions moyo-create-actions">
                <button type="button" id="btnNext" class="create-btn primary">다음</button>
            </div>
        </section>

        <section id="profileStep" class="create-panel moyo-create-panel" data-step="2" hidden>

            <div class="profile-choice" role="radiogroup" aria-label="그룹 프로필 사용 방식">
                <label class="profile-mode-card">
                    <input type="radio" name="profileMode" value="Y" checked>
                    <span class="profile-mode-icon" aria-hidden="true"><i class="fa-regular fa-user"></i></span>
                    <span class="profile-mode-copy">
                        <strong>계정 프로필 사용</strong>
                        <small>현재 계정의 이름과 프로필을 그대로 사용해요.</small>
                    </span>
                </label>
                <label class="profile-mode-card">
                    <input type="radio" name="profileMode" value="N">
                    <span class="profile-mode-icon" aria-hidden="true"><i class="fa-solid fa-user-pen"></i></span>
                    <span class="profile-mode-copy">
                        <strong>그룹 전용 프로필</strong>
                        <small>이 그룹에서만 사용할 프로필을 따로 만들어요.</small>
                    </span>
                </label>
            </div>

            <div id="profileAccountSummary" class="profile-account-summary" aria-live="polite">
                <div id="profileAccountSummaryAvatar" class="profile-account-summary-avatar ${not empty sessionScope.user.profileImagePath ? 'has-image' : 'is-default'}" aria-hidden="true">
                    <c:if test="${not empty sessionScope.user.profileImagePath}">
                        <img id="profileAccountSummaryAvatarImage" src="<c:out value='${sessionScope.user.profileImagePath}'/>" alt="" onerror="this.hidden=true; this.parentElement.classList.remove('has-image'); this.parentElement.classList.add('is-default'); this.nextElementSibling.hidden=false;">
                    </c:if>
                    <span id="profileAccountSummaryAvatarFallback" class="profile-account-summary-avatar-fallback" ${not empty sessionScope.user.profileImagePath ? 'hidden' : ''}></span>
                </div>
                <div class="profile-account-summary-copy">
                    <span class="profile-account-summary-label">현재 계정 프로필</span>
                    <strong id="profileAccountSummaryName"><c:out value='${accountDisplayName}'/></strong>
                    <span id="profileAccountSummaryEmail"><c:out value='${accountEmail}'/></span>
                </div>
                <span class="profile-account-summary-state"><i class="fa-solid fa-check" aria-hidden="true"></i> 그대로 사용</span>
            </div>

            <div id="profileCustomFields" class="profile-custom-fields" hidden>
                <div class="profile-identity-card">
                    <div id="profileAccountEditor" class="profile-account-editor">
                        <div class="profile-account-preview" aria-label="그룹 프로필 이미지 미리보기">
                            <img id="groupProfilePreviewImage" hidden alt="그룹 프로필 이미지">
                            <span id="groupProfileFallback" class="profile-account-fallback"></span>
                        </div>
                        <div class="profile-account-copy">
                            <div class="profile-account-actions">
                                <label id="groupProfileSelectLabel" for="createProfileImageInput" class="profile-account-button is-primary">사진 선택</label>
                                <input type="file" id="createProfileImageInput" accept="image/png,image/jpeg,image/webp" hidden>
                                <button type="button" id="groupProfileAdjustButton" class="profile-account-button" hidden>사진 조정</button>
                                <button type="button" id="groupProfileDefaultButton" class="profile-account-button">기본 아바타</button>
                            </div>
                            <p class="profile-account-hint">그룹에서 사용할 프로필 사진을 설정해요.</p>
                        </div>
                    </div>

                    <div class="form-grid profile-identity-form">
                        <div class="form-group moyo-create-field profile-identity-name">
                            <label class="moyo-create-label" for="profileDisplayName">표시 이름 <span class="moyo-create-required">*</span></label>
                            <input class="moyo-create-control" type="text" id="profileDisplayName" maxlength="50"
                                   value="<c:out value='${accountDisplayName}'/>">
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-grid profile-group-meta-fields">
                <div class="form-group moyo-create-field">
                    <label class="moyo-create-label" for="profilePositionName">그룹 직책 · 담당</label>
                    <input class="moyo-create-control" type="text" id="profilePositionName" maxlength="50" placeholder="예: 개발, 운영, 기록, 발표 등">
                </div>
                <div class="form-group moyo-create-field">
                    <label class="moyo-create-label" for="profileIntroText">한 줄 소개</label>
                    <input class="moyo-create-control" type="text" id="profileIntroText" maxlength="120" placeholder="나를 간단히 소개해보세요">
                </div>
            </div>

                <div class="profile-detail-list" aria-label="그룹 프로필 공개 정보">
                    <div class="profile-detail-row profile-contact-block">
                        <div class="profile-detail-head">
                            <label class="moyo-create-label profile-detail-label" for="profileContactEmail"><i class="fa-regular fa-envelope" aria-hidden="true"></i><span>이메일</span></label>
                            <label class="profile-visibility-toggle" for="profileShowEmail">
                                <input type="checkbox" id="profileShowEmail" checked>
                                <span class="profile-visibility-switch" aria-hidden="true"></span>
                                <span class="profile-visibility-text">멤버 공개</span>
                            </label>
                        </div>
                        <div class="profile-contact-control">
                            <input class="moyo-create-control" type="email" id="profileContactEmail" maxlength="100"
                                   value="<c:out value='${accountEmail}'/>" autocomplete="email">
                            <span id="profileEmailStatus" class="profile-contact-status is-verified"><i class="fa-solid fa-check" aria-hidden="true"></i> 인증됨</span>
                            <button type="button" id="profileEmailVerifyButton" class="profile-contact-verify" hidden>인증하기</button>
                        </div>
                        <div id="profileEmailCodeRow" class="profile-contact-code" hidden>
                            <input class="moyo-create-control" type="text" id="profileEmailCode" inputmode="numeric" maxlength="6" placeholder="인증번호 6자리">
                            <button type="button" id="profileEmailCodeVerifyButton" class="profile-contact-verify">확인</button>
                        </div>
                        <p id="profileEmailMessage" class="profile-contact-note">계정 이메일은 추가 인증 없이 사용할 수 있어요.</p>
                    </div>

                    <div class="profile-detail-row">
                        <div class="profile-detail-head">
                            <span class="moyo-create-label profile-detail-label"><i class="fa-solid fa-cake-candles" aria-hidden="true"></i><span>생일</span></span>
                            <label class="profile-visibility-toggle" for="profileShowBirth">
                                <input type="checkbox" id="profileShowBirth" checked>
                                <span class="profile-visibility-switch" aria-hidden="true"></span>
                                <span class="profile-visibility-text">멤버 공개</span>
                            </label>
                        </div>
                        <div class="profile-birth-value">
                            <span id="profileBirthValue">등록된 생일 없음</span>
                            <span id="profileBirthType" class="profile-birth-type" aria-label="양력"></span>
                        </div>
                    </div>

                    <div class="profile-detail-row profile-phone-field profile-contact-block">
                        <div class="profile-detail-head">
                            <label class="moyo-create-label profile-detail-label" for="profilePhoneNumber"><i class="fa-solid fa-phone" aria-hidden="true"></i><span>연락처</span></label>
                            <label class="profile-visibility-toggle" for="profileShowPhone">
                                <input type="checkbox" id="profileShowPhone">
                                <span class="profile-visibility-switch" aria-hidden="true"></span>
                                <span class="profile-visibility-text">멤버 공개</span>
                            </label>
                        </div>
                        <div class="profile-contact-control">
                            <input class="moyo-create-control" type="tel" id="profilePhoneNumber" maxlength="30" placeholder="예: 010-0000-0000" autocomplete="tel">
                        </div>
                        <p class="profile-contact-note">연락처는 선택 사항입니다.</p>
                    </div>
                </div>

            <div class="create-actions moyo-create-actions">
                <button type="button" id="btnBack" class="create-btn">이전</button>
                <button type="button" id="btnCreate" class="create-btn primary">그룹 생성</button>
            </div>
        </section>
    </div>
</div>

<div id="workspaceImageCropModal" class="signup-profile-modal" hidden role="dialog" aria-modal="true" aria-labelledby="workspaceImageCropTitle">
    <div class="signup-profile-modal-backdrop" data-workspace-image-close></div>
    <div class="signup-profile-modal-dialog">
        <div class="signup-profile-modal-head">
            <div>
                <span class="signup-profile-modal-kicker">그룹 이미지 조정</span>
                <h3 id="workspaceImageCropTitle">영역 안에 이미지를 맞춰주세요</h3>
            </div>
            <button type="button" class="signup-profile-modal-close" data-workspace-image-close aria-label="닫기">×</button>
        </div>
        <div id="workspaceImageCropViewport" class="workspace-image-modal-viewport">
            <img id="workspaceImageCropImage" alt="그룹 이미지 조정 미리보기">
        </div>
        <div class="signup-profile-crop-control">
            <div class="signup-profile-crop-head">
                <span>이미지 크기</span>
                <output id="workspaceImageScaleValue">115%</output>
            </div>
            <input id="workspaceImageScale" type="range" min="70" max="200" step="1" value="115">
        </div>
        <p class="signup-profile-modal-hint">드래그로 위치를 맞추고 크기를 조정하세요.</p>
        <div class="signup-profile-modal-actions signup-profile-modal-actions--simple">
            <label for="wsImage" class="signup-secondary-button">이미지 다시 선택</label>
            <button type="button" id="workspaceImageApplyButton" class="signup-primary-button signup-profile-apply">적용</button>
        </div>
    </div>
</div>

<div id="groupProfileCropModal" class="signup-profile-modal" hidden role="dialog" aria-modal="true" aria-labelledby="groupProfileCropTitle">
    <div class="signup-profile-modal-backdrop" data-group-profile-close></div>
    <div class="signup-profile-modal-dialog">
        <div class="signup-profile-modal-head">
            <div>
                <span class="signup-profile-modal-kicker">프로필 사진 조정</span>
                <h3 id="groupProfileCropTitle">원형 안에 사진을 맞춰주세요</h3>
            </div>
            <button type="button" class="signup-profile-modal-close" data-group-profile-close aria-label="닫기">×</button>
        </div>
        <div id="groupProfileCropViewport" class="signup-profile-crop-viewport">
            <img id="groupProfileCropImage" alt="프로필 사진 조정 미리보기">
        </div>
        <div class="signup-profile-crop-control">
            <div class="signup-profile-crop-head">
                <span>사진 크기</span>
                <output id="groupProfileScaleValue">115%</output>
            </div>
            <input id="groupProfileScale" type="range" min="70" max="200" step="1" value="115">
        </div>
        <p class="signup-profile-modal-hint">드래그로 위치를 맞추고 크기를 조정하세요.</p>
        <div class="signup-profile-modal-actions signup-profile-modal-actions--simple">
            <label for="createProfileImageInput" class="signup-secondary-button">사진 다시 선택</label>
            <button type="button" id="groupProfileApplyButton" class="signup-primary-button signup-profile-apply">적용</button>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/js/moyoCreate.js?v=20260923-responsive-conflict-fix"></script>
<script src="${pageContext.request.contextPath}/js/workspaceCreate.js?v=20260923-responsive-conflict-fix"></script>


<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
