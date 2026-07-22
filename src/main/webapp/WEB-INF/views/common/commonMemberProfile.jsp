<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="isProjectProfileScope" value="${param.profileScope eq 'project'}" />
<c:set var="profileScopeLabel" value="${isProjectProfileScope ? '프로젝트' : '그룹'}" />

<div id="memberProfileComponent"
     class="common-member-profile" hidden
     data-profile-scope="${param.profileScope}"
     data-scope-id="${param.scopeId}"
     data-owner-label="${param.ownerLabel}"
     data-admin-label="${param.adminLabel}"
     data-member-label="${param.memberLabel}"
     data-scope-label="${profileScopeLabel}">
<div id="memberProfileOverlay" class="workspace-modal-overlay workspace-member-profile-overlay" onclick="closeWorkspaceMemberProfile()"></div>
    <div id="memberProfileModal" class="workspace-modal workspace-member-profile-modal"
         role="dialog" aria-modal="true" aria-labelledby="memberProfileModalTitle">
        <div class="workspace-modal-head">
            <div>
                <span class="workspace-profile-kicker">그룹 프로필</span>
                <h3 id="memberProfileModalTitle">멤버 프로필</h3>
            </div>
            <button type="button" class="workspace-modal-close" onclick="closeWorkspaceMemberProfile()">&times;</button>
        </div>

        <div id="memberProfileLoading" class="workspace-profile-loading">프로필을 불러오는 중입니다.</div>

        <div id="memberProfileContent" class="workspace-profile-content is-view-mode" hidden>
            <div class="workspace-profile-summary">
                <div id="memberProfileAvatar" class="workspace-profile-avatar">
                    <canvas id="memberProfilePreviewCanvas" width="160" height="160" hidden></canvas>
                </div>
                <div class="workspace-profile-summary-text">
                    <div class="workspace-profile-name-role">
                        <strong id="memberProfileName"></strong>
                        <span id="memberProfileRole" class="workspace-profile-role"></span>
                    </div>
                    <span id="memberProfilePosition"></span>
                </div>
                <div id="memberProfileActionMenu"
                     class="workspace-profile-action-menu"
                     hidden>
                    <button type="button"
                            id="memberProfileActionMenuButton"
                            class="workspace-profile-action-menu-button"
                            aria-label="프로필 메뉴"
                            aria-haspopup="menu"
                            aria-expanded="false"
                            onclick="toggleWorkspaceMemberProfileActionMenu(event)">
                        <span aria-hidden="true">•••</span>
                    </button>
                    <div id="memberProfileActionMenuPanel"
                         class="workspace-profile-action-menu-panel"
                         role="menu"
                         hidden></div>
                </div>
            </div>

            <div id="memberProfileView" class="workspace-profile-view">
                <dl class="workspace-profile-detail-list">
                    <div><dt>이메일</dt><dd id="memberProfileEmail"></dd></div>
                    <div id="memberProfilePhoneRow"><dt>연락처</dt><dd id="memberProfilePhone"></dd></div>
                    <div><dt>가입일</dt><dd id="memberProfileJoinedAt"></dd></div>
                    <div id="memberProfileBirthRow" hidden>
                        <dt>생일</dt>
                        <dd id="memberProfileBirth"></dd>
                    </div>
                </dl>
            </div>

            <form id="memberProfileEdit" class="workspace-profile-edit" hidden onsubmit="saveWorkspaceMemberProfile(event)">
                <label class="workspace-profile-switch-row">
                    <span>
                        <strong>계정 기본 프로필 사용</strong>
                        <small class="workspace-profile-helper-text">켜면 계정 이름과 계정 프로필 사진을 사용합니다. 그룹 전용 정보는 보존됩니다.</small>
                    </span>
                    <input type="checkbox" id="profileUseAccount">
                </label>

                <div class="profile-image-editor workspace-profile-image-editor">
                    <div id="modalProfileViewport" class="profile-image-viewport">
                        <div id="modalProfilePlaceholder" class="profile-image-placeholder"></div>
                        <img id="modalProfileCropImage" hidden alt="">
                    </div>
                    <div class="profile-image-tools">
                        <strong>${profileScopeLabel}용 프로필 이미지</strong>
                        <div class="workspace-profile-image-buttons">
                            <button type="button"
                                    id="modalProfileImageSelectButton"
                                    class="profile-image-button">이미지 선택</button>
                            <button type="button"
                                    id="modalProfileDefaultAvatarButton"
                                    class="profile-image-button is-secondary">기본 아바타</button>
                        </div>
                        <input type="file"
                               id="modalProfileImageInput"
                               accept="image/png,image/jpeg,image/webp"
                               class="workspace-profile-file-input"
                               tabindex="-1"
                               aria-hidden="true">
                        <small class="workspace-profile-helper-text">이미지를 선택한 뒤 위치와 크기를 조정하거나 기본 아바타로 전환할 수 있습니다.</small>
                        <input type="range" id="modalProfileZoom" min="1" max="3" step="0.05" value="1">
                    </div>
                </div>

                <div class="workspace-profile-form-grid">
                    <label>
                        <span>${profileScopeLabel} 표시 이름</span>
                        <input type="text" id="profileDisplayName" maxlength="50">
                    </label>
                    <label>
                        <span>${profileScopeLabel}에서의 역할</span>
                        <input type="text"
                               id="profilePositionName"
                               maxlength="50"
                               placeholder="${isProjectProfileScope ? '예: 기획, 디자인' : '예: 운영진, 발표 담당'}">
                    </label>
                    <label class="workspace-profile-full-field">
                        <span>${profileScopeLabel} 이메일</span>
                        <input type="email"
                               id="profileContactEmail"
                               maxlength="100"
                               autocomplete="email"
                               required>
                        <small class="workspace-profile-helper-text">${profileScopeLabel} 멤버에게 표시되는 활동용 이메일입니다.</small>
                    </label>
                    <label class="workspace-profile-full-field">
                        <span>전화번호</span>
                        <input type="tel"
                               id="profilePhoneNumber"
                               maxlength="30"
                               inputmode="tel"
                               autocomplete="tel"
                               placeholder="예: 010-0000-0000">
                    </label>
                    <div class="workspace-profile-privacy-options workspace-profile-full-field">
                        <label class="workspace-profile-check-row">
                            <input type="checkbox" id="profileShowPhone">
                            <span>다른 ${profileScopeLabel} 멤버에게 전화번호 공개</span>
                        </label>
                        <label class="workspace-profile-check-row">
                            <input type="checkbox" id="profileShowBirth">
                            <span>다른 ${profileScopeLabel} 멤버에게 생일 공개</span>
                        </label>
                    </div>
                </div>
            </form>

            <div id="memberProfileActions" class="workspace-profile-actions"></div>
        </div>
    </div>
</div>
