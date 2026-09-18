<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><c:choose><c:when test="${empty isOwnProfile or isOwnProfile}">내 프로필 - MOYO</c:when><c:otherwise><c:out value="${empty mypageUser.userName ? '사용자' : mypageUser.userName}" />님의 프로필 - MOYO</c:otherwise></c:choose></title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=profile-relation-menu-compact-20260707">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/myPage.css?v=20260907-friend-responsive-73">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentCard.css?v=20260907-profile-responsive-73">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/myPage-tabs.css?v=20260907-profile-responsive-73">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/myPage-settings.css?v=settings-cleanup-20260906">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=20260906-avatar-isolation-59">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPhotoPostDetail.css?v=20260809-fit-atomic">
    
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonCalendarEventPreview.css?v=event-header-actions-unified-v1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonContentRecordModal.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonGroupPreview.css?v=profile-group-preview-v1">
	<link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonNoteDetail.css?v=profile-note-actions-v1">
	<link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonFolderModal.css?v=common-folder-card-v2">
</head>
<body class="mypage-body moyo-app-sidebar-enabled">
<%@ include file="../common/header.jsp"%>

<c:set var="currentUser" value="${empty mypageUser ? sessionScope.user : mypageUser}" />
<c:set var="profileImage" value="${currentUser.profileImagePath}" />
<c:if test="${empty profileImage}">
    <c:set var="profileImage" value="${currentUser.PROFILE_IMAGE_PATH}" />
</c:if>
<c:if test="${not empty profileImage and not fn:startsWith(profileImage, 'http') and not fn:startsWith(profileImage, '/')}">
    <c:set var="profileImage" value="/${profileImage}" />
</c:if>
<c:set var="displayName" value="${empty currentUser.userName ? '사용자' : currentUser.userName}" />
<c:set var="profileInitial" value="${fn:substring(displayName, 0, 1)}" />
<c:set var="profileIntro" value="${currentUser.profileIntro}" />
<c:set var="birthType" value="${empty currentUser.birthCalendarType ? 'SOLAR' : currentUser.birthCalendarType}" />
<c:set var="birthPublic" value="${empty currentUser.birthPublicYn ? 'Y' : currentUser.birthPublicYn}" />
<c:set var="groupCount" value="${empty wsList ? 0 : fn:length(wsList)}" />
<c:set var="friendCount" value="${empty profileFriendCount ? 0 : profileFriendCount}" />
<c:set var="accountStatus" value="${empty sessionScope.user.status ? 'ACTIVE' : sessionScope.user.status}" />
<c:set var="withdrawDeadlineAt" value="${sessionScope.user.withdrawDeadlineAt}" />
<c:set var="photosPublic" value="${empty currentUser.profilePhotosPublicYn ? 'Y' : currentUser.profilePhotosPublicYn}" />
<c:set var="notesPublic" value="${empty currentUser.profileNotesPublicYn ? 'Y' : currentUser.profileNotesPublicYn}" />
<c:set var="calendarPublic" value="${empty currentUser.profileCalendarPublicYn ? 'Y' : currentUser.profileCalendarPublicYn}" />
<c:set var="groupsPublic" value="${empty currentUser.profileGroupsPublicYn ? 'Y' : currentUser.profileGroupsPublicYn}" />
<c:set var="friendsPublic" value="${empty currentUser.profileFriendsPublicYn ? 'Y' : currentUser.profileFriendsPublicYn}" />
<c:set var="notifySchedule" value="${empty currentUser.notifyScheduleYn ? 'Y' : currentUser.notifyScheduleYn}" />
<c:set var="notifyShare" value="${empty currentUser.notifyShareYn ? 'Y' : currentUser.notifyShareYn}" />
<c:set var="notifyRequest" value="${empty currentUser.notifyRequestYn ? 'Y' : currentUser.notifyRequestYn}" />
<c:set var="notifyComment" value="${empty currentUser.notifyCommentYn ? 'Y' : currentUser.notifyCommentYn}" />
<c:set var="notifyLike" value="${empty currentUser.notifyLikeYn ? 'Y' : currentUser.notifyLikeYn}" />
<c:set var="isOwnerProfile" value="${empty isOwnProfile ? true : isOwnProfile}" />
<c:set var="relationStatus" value="${empty friendRelationStatus ? 'NONE' : friendRelationStatus}" />
<c:set var="relationDirection" value="${empty friendRelationDirection ? 'NONE' : friendRelationDirection}" />
<c:set var="relationId" value="${friendRelationId}" />
<c:set var="profileOwnerIdValue" value="${empty profileOwnerId ? currentUser.userId : profileOwnerId}" />
<c:set var="showGroups" value="${empty groupsVisible ? true : groupsVisible}" />
<c:set var="showFriends" value="${empty friendsVisible ? true : friendsVisible}" />

<main class="profile-shell ${isOwnerProfile ? 'is-personal-profile' : 'is-friend-profile'}" data-context-path="${pageContext.request.contextPath}" data-current-user-id="${sessionScope.user.userId}" data-profile-owner-id="${profileOwnerIdValue}" data-is-owner-profile="${isOwnerProfile}">
    <section class="profile-masthead" aria-labelledby="profileTitle">
        <div class="profile-avatar-wrap">
            <div class="moyo-profile-avatar ${not empty profileImage ? 'has-image' : ''}" data-profile-preview>
                <c:if test="${not empty profileImage}">
                    <c:choose>
                        <c:when test="${fn:startsWith(profileImage, 'http')}">
                            <img src="${profileImage}" alt="${displayName}" onerror="this.parentElement.classList.remove('has-image'); this.remove();">
                        </c:when>
                        <c:otherwise>
                            <img src="${pageContext.request.contextPath}${profileImage}" alt="${displayName}" onerror="this.parentElement.classList.remove('has-image'); this.remove();">
                        </c:otherwise>
                    </c:choose>
                </c:if>
                <span data-avatar-initial><c:out value="${profileInitial}" /></span>
            </div>
        </div>

        <div class="profile-main-info">
            <div class="profile-name-row">
                <div>
                    <span class="profile-eyebrow">MOYO PROFILE</span>
                    <h1 id="profileTitle" data-profile-name><c:out value="${displayName}" /></h1>
                </div>
                <div class="profile-actions">
                    <c:choose>
                        <c:when test="${isOwnerProfile}">
                            <div class="profile-more-wrap">
                                <button type="button" class="profile-icon-action profile-gear-action" data-profile-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="프로필 설정 메뉴 열기">
                                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.6 7.6 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5A8.3 8.3 0 0 0 4.5 12c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"/>
                                    </svg>
                                </button>
                                <div class="profile-more-menu" data-profile-menu hidden role="menu">
                                    <button type="button" role="menuitem" data-open-panel="edit">
                                        <strong>프로필 편집</strong>
                                        <small>사진 · 이름 · 소개 · 생일 · 링크</small>
                                    </button>
                                    <button type="button" role="menuitem" data-open-panel="privacy">
                                        <strong>공개 설정</strong>
                                        <small>생일 · 사진 · 노트 · 일정 · 그룹 · 친구</small>
                                    </button>
                                    <button type="button" role="menuitem" data-open-panel="notification">
                                        <strong>알림 설정</strong>
                                        <small>일정 · 공유 · 요청 · 댓글 · 좋아요</small>
                                    </button>
                                    <button type="button" role="menuitem" data-open-panel="settings">
                                        <strong>계정 설정</strong>
                                        <small>이메일 · 비밀번호 · 탈퇴</small>
                                    </button>
                                    <div class="profile-menu-divider" role="separator"></div>
                                    <a href="${pageContext.request.contextPath}/users/logout" role="menuitem" class="profile-menu-link">
                                        <strong>로그아웃</strong>
                                        <small>현재 계정에서 나가기</small>
                                    </a>
                                </div>
                            </div>
                        </c:when>
                        <c:otherwise>
                            <c:choose>
                                <c:when test="${relationStatus eq 'ACCEPTED'}">
                                    <div class="profile-relation-wrap">
                                        <button type="button" class="profile-action is-friend" data-relation-menu-toggle aria-haspopup="true" aria-expanded="false">친구</button>
                                        <div class="profile-relation-menu" data-relation-menu hidden role="menu">
                                            <button type="button" role="menuitem" class="is-danger" data-friend-action="delete" data-friend-id="${relationId}">친구 해제</button>
                                        </div>
                                    </div>
                                </c:when>
                                <c:when test="${relationStatus eq 'PENDING' and relationDirection eq 'SENT'}">
                                    <div class="profile-relation-actions" aria-label="보낸 친구 요청 관리">
                                        <span class="profile-action is-muted" aria-label="친구 요청을 보낸 상태">요청 보냄</span>
                                        <button type="button" class="profile-action is-secondary" data-friend-action="cancel" data-friend-id="${relationId}">요청 취소</button>
                                    </div>
                                </c:when>
                                <c:when test="${relationStatus eq 'PENDING' and relationDirection eq 'RECEIVED'}">
                                    <div class="profile-relation-actions" aria-label="받은 친구 요청 관리">
                                        <button type="button" class="profile-action is-primary" data-friend-action="accept" data-friend-id="${relationId}">요청 수락</button>
                                        <button type="button" class="profile-action is-secondary" data-friend-action="reject" data-friend-id="${relationId}">거절</button>
                                    </div>
                                </c:when>
                                <c:when test="${relationStatus eq 'BLOCKED'}">
                                    <span class="profile-action is-muted" aria-label="현재 친구 요청을 보낼 수 없는 상태">친구 요청 불가</span>
                                </c:when>
                                <c:when test="${relationStatus eq 'NONE'}">
                                    <button type="button" class="profile-action is-primary" data-friend-action="request" data-target-user-id="${profileOwnerIdValue}">친구 요청</button>
                                </c:when>
                                <c:otherwise>
                                    <span class="profile-action is-muted">관계 확인 중</span>
                                </c:otherwise>
                            </c:choose>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>

            <p class="profile-intro"><c:choose><c:when test="${not empty profileIntro}"><c:out value="${profileIntro}" /></c:when><c:otherwise><c:out value="${displayName}" />님의 MOYO 프로필입니다.</c:otherwise></c:choose></p>

            <c:if test="${not empty profileLinks}">
                <div class="profile-external-links" aria-label="프로필 외부 링크">
                    <c:forEach var="profileLink" items="${profileLinks}">
                        <c:if test="${not empty profileLink.LINK_URL}">
                            <a class="profile-external-link"
                               href="${fn:escapeXml(profileLink.LINK_URL)}"
                               title="${fn:escapeXml(profileLink.LINK_URL)}"
                               target="_blank"
                               rel="noopener noreferrer">
                                <span aria-hidden="true">↗</span>
                                <c:out value="${empty profileLink.LINK_NAME ? profileLink.LINK_URL : profileLink.LINK_NAME}" />
                            </a>
                        </c:if>
                    </c:forEach>
                </div>
            </c:if>

            <div class="profile-stats" aria-label="${isOwnerProfile ? '내 활동 요약' : '프로필 활동 요약'}">
                <button type="button" data-profile-tab="photos"><strong><c:out value="${profilePhotoCount}" /></strong><span>사진</span></button>
                <button type="button" data-profile-tab="notes"><strong><c:out value="${profileNoteCount}" /></strong><span>노트</span></button>
                <button type="button" data-profile-tab="calendar"><strong><c:out value="${profileCalendarCount}" /></strong><span>일정</span></button>
                <button type="button" data-profile-tab="groups"><strong><c:out value="${groupCount}" /></strong><span>그룹</span></button>
                <c:choose>
                    <c:when test="${showFriends}">
                        <button type="button" data-profile-friends><strong><c:out value="${friendCount}" /></strong><span>친구</span></button>
                    </c:when>
                    <c:otherwise>
                        <button type="button"
                                class="is-private"
                                data-profile-friends-locked
                                aria-label="친구 목록 비공개">
                            <strong>—</strong><span>친구</span>
                        </button>
                    </c:otherwise>
                </c:choose>
            </div>

            <div class="profile-meta-line">
                <c:if test="${isOwnerProfile or showProfileEmail}">
                    <span><c:out value="${currentUser.email}" /></span>
                </c:if>
                <c:if test="${not empty currentUser.birthDate && birthPublic ne 'N'}">
                    <span>
                        <c:if test="${birthType eq 'LUNAR'}">음력 </c:if><c:out value="${currentUser.birthDate}" />
                    </span>
                </c:if>
                <c:if test="${isOwnerProfile and birthPublic eq 'N'}">
                    <span>생일 비공개</span>
                </c:if>
            </div>
        </div>
    </section>

    <nav class="profile-tabs" aria-label="프로필 콘텐츠 탭">
        <button type="button" class="is-active" data-profile-tab="photos">사진</button>
        <button type="button" data-profile-tab="notes">노트</button>
        <button type="button" data-profile-tab="calendar">일정</button>
        <button type="button" data-profile-tab="groups">그룹</button>
    </nav>

    <section class="profile-content">
        <div class="profile-panel is-active" data-profile-panel="photos">
            <%@ include file="profileTabs/photos.jspf" %>
        </div>

        <div class="profile-panel" data-profile-panel="notes">
            <%@ include file="profileTabs/notes.jspf" %>
        </div>

        <div class="profile-panel" data-profile-panel="calendar">
            <%@ include file="profileTabs/calendar.jspf" %>
        </div>

        <div class="profile-panel" data-profile-panel="groups">
            <%@ include file="profileTabs/groups.jspf" %>
        </div>
    </section>
</main>

<c:if test="${isOwnerProfile}">
<section id="profileEditPanel" class="profile-sheet" hidden aria-labelledby="profileEditTitle">
    <div class="profile-sheet-backdrop" data-close-panel></div>
    <div class="profile-sheet-dialog">
        <div class="profile-sheet-head">
            <div>
                <span>PROFILE</span>
                <h2 id="profileEditTitle">프로필 편집</h2>
            </div>
            <button type="button" class="profile-sheet-close" data-close-panel aria-label="닫기">×</button>
        </div>

        <form id="profileForm" class="profile-edit-form" autocomplete="off">
            <div class="signup-profile-editor signup-profile-editor-bottom profile-edit-avatar">
                <div id="profileViewport" class="signup-profile-viewport ${not empty profileImage ? 'has-image' : ''}">
                    <canvas id="profileCanvas" width="500" height="500" aria-label="프로필 사진 미리보기" ${not empty profileImage ? 'hidden' : ''}></canvas>
                    <c:if test="${not empty profileImage}">
                        <c:choose>
                            <c:when test="${fn:startsWith(profileImage, 'http')}">
                                <img id="currentProfileImage" src="${profileImage}" alt="${displayName}">
                            </c:when>
                            <c:otherwise>
                                <img id="currentProfileImage" src="${pageContext.request.contextPath}${profileImage}" alt="${displayName}">
                            </c:otherwise>
                        </c:choose>
                    </c:if>
                    <span id="avatarFallback" class="signup-avatar-preview" ${not empty profileImage ? 'hidden' : ''}><c:out value="${profileInitial}" /></span>
                </div>

                <div class="profile-avatar-control">
                    <div class="signup-profile-actions">
                        <label for="profileFile" class="signup-secondary-button signup-image-button is-active">사진 선택</label>
                        <input id="profileFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>
                        <button id="restoreProfileImage" type="button" class="signup-secondary-button signup-avatar-button">이전 사진</button>
                        <button id="removeProfile" type="button" class="signup-secondary-button signup-avatar-button">기본 아바타</button>
                    </div>
                    <p class="signup-profile-hint">프로필 사진을 변경하거나 기본 아바타로 전환할 수 있습니다.</p>
                </div>
            </div>

            <label class="profile-field">
                <span>이름</span>
                <input id="profileUserName" type="text" maxlength="30" value="${fn:escapeXml(displayName)}" placeholder="이름을 입력해주세요" required>
            </label>

            <label class="profile-field profile-intro-field">
                <span>자기소개</span>
                <textarea id="profileIntro" maxlength="100" rows="3" placeholder="나를 소개하는 문장을 입력해주세요"><c:out value="${profileIntro}" /></textarea>
                <p class="profile-field-note"><span data-profile-intro-count>${fn:length(profileIntro)}</span>/100</p>
            </label>

            <div class="profile-field profile-links-field">
                <div class="profile-links-field-head">
                    <div>
                        <span>링크</span>
                        <p class="profile-field-note">블로그, 포트폴리오, SNS 등 최대 5개까지 추가할 수 있습니다.</p>
                    </div>
                    <button type="button" class="profile-link-add" data-profile-link-add>+ 링크 추가</button>
                </div>
                <div id="profileLinkList" class="profile-link-list">
                    <c:forEach var="profileLink" items="${profileLinks}">
                        <div class="profile-link-row">
                            <input type="text" class="profile-link-name" maxlength="50"
                                   value="${fn:escapeXml(profileLink.LINK_NAME)}" placeholder="링크 이름">
                            <input type="text" class="profile-link-url" maxlength="500"
                                   value="${fn:escapeXml(profileLink.LINK_URL)}" placeholder="https://...">
                            <button type="button" class="profile-link-remove" data-profile-link-remove aria-label="링크 삭제">×</button>
                        </div>
                    </c:forEach>
                </div>
            </div>

            <div class="profile-field signup-birth-field profile-birth-field">
                <div class="signup-birth-label-row">
                    <label for="birthDateDisplay" class="signup-birth-label">
                        <span>생일</span>
                    </label>
                    <div class="signup-birth-type-toggle" role="group" aria-label="생일 양력 음력 선택">
                        <button type="button" class="${birthType eq 'SOLAR' ? 'is-active' : ''}" data-birth-type="SOLAR">양력</button>
                        <button type="button" class="${birthType eq 'LUNAR' ? 'is-active' : ''}" data-birth-type="LUNAR">음력</button>
                    </div>
                </div>
                <div class="signup-birth-picker" data-birth-picker>
                    <input id="birthDateDisplay" type="text" class="signup-birth-display"
                           placeholder="생일을 선택해주세요" readonly value="">
                    <input id="birthDate" type="hidden" value="${currentUser.birthDate}">
                    <input id="birthCalendarType" type="hidden" value="${birthType}">
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
            </div>

            <input id="profileImageData" type="hidden" name="profileImageData">
            <input id="profileOriginalImageData" type="hidden" name="profileOriginalImageData">
            <input id="profileCropScaleHidden" type="hidden" name="profileCropScale">
            <input id="profileCropX" type="hidden" name="profileCropX">
            <input id="profileCropY" type="hidden" name="profileCropY">
            <input id="profileAvatarType" type="hidden" name="profileAvatarType" value="${empty profileImage ? 'DEFAULT' : 'IMAGE'}" data-initial-avatar-type="${empty profileImage ? 'DEFAULT' : 'IMAGE'}">
            <input id="profileImageHistoryId" type="hidden" name="profileImageHistoryId">

            <div class="profile-sheet-actions">
                <button type="button" class="profile-action" data-close-panel>취소</button>
                <button type="submit" class="profile-action is-primary">저장</button>
            </div>
        </form>
    </div>
</section>

<section id="profilePrivacyPanel" class="profile-sheet" hidden aria-labelledby="profilePrivacyTitle">
    <div class="profile-sheet-backdrop" data-close-panel></div>
    <div class="profile-sheet-dialog profile-sheet-dialog--settings">
        <div class="profile-sheet-head">
            <div>
                <span>PRIVACY</span>
                <h2 id="profilePrivacyTitle">공개 설정</h2>
            </div>
            <button type="button" class="profile-sheet-close" data-close-panel aria-label="닫기">×</button>
        </div>

        <form id="profilePrivacyForm" class="profile-privacy-form" autocomplete="off">
            <div class="profile-privacy-guide">
                <strong>프로필 공개 기준</strong>
                <p><span>프로필에 보여줄 개인정보와 공개 콘텐츠를 설정합니다.</span><span>MOYO 공개 사진·노트·일정은 설정에 따라 친구에게만 표시됩니다. 그룹도 친구에게만 표시됩니다.</span></p>
            </div>

            <div class="profile-privacy-list">
                <div class="profile-privacy-row">
                    <div>
                        <strong>생일 공개</strong>
                        <p>켜면 로그인한 MOYO 사용자의 프로필 화면에 생일을 표시합니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="birthPublicYn" type="checkbox" ${birthPublic ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>사진 공개</strong>
                        <p>켜면 MOYO 공개로 저장한 사진을 친구에게 표시합니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="profilePhotosPublicYn" type="checkbox" ${photosPublic ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>노트 공개</strong>
                        <p>켜면 MOYO 공개로 저장한 개인 노트를 친구에게 표시합니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="profileNotesPublicYn" type="checkbox" ${notesPublic ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>일정 공개</strong>
                        <p>켜면 MOYO 공개로 저장한 개인 일정을 친구에게 표시합니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="profileCalendarPublicYn" type="checkbox" ${calendarPublic ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>그룹 공개</strong>
                        <p>친구에게 참여 그룹을 표시합니다. 초대 전용 그룹은 제외합니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="profileGroupsPublicYn" type="checkbox" ${groupsPublic ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>친구 목록 공개</strong>
                        <p>켜면 로그인한 MOYO 사용자에게 친구 수와 친구 목록을 표시합니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="profileFriendsPublicYn" type="checkbox" ${friendsPublic ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
            </div>

            <div class="profile-sheet-actions">
                <button type="button" class="profile-action" data-close-panel>취소</button>
                <button type="submit" class="profile-action is-primary">저장</button>
            </div>
        </form>
    </div>
</section>

<section id="profileNotificationPanel" class="profile-sheet" hidden aria-labelledby="profileNotificationTitle">
    <div class="profile-sheet-backdrop" data-close-panel></div>
    <div class="profile-sheet-dialog profile-sheet-dialog--settings">
        <div class="profile-sheet-head">
            <div>
                <span>NOTIFICATION</span>
                <h2 id="profileNotificationTitle">알림 설정</h2>
            </div>
            <button type="button" class="profile-sheet-close" data-close-panel aria-label="닫기">×</button>
        </div>

        <form id="profileNotificationForm" class="profile-privacy-form profile-notification-form" autocomplete="off">
            <div class="profile-privacy-guide">
                <strong>서비스 내 알림 기준</strong>
                <p><span>MOYO에서 받을 알림을 설정합니다.</span><span>꺼둔 항목은 알림 목록에 표시되지 않습니다.</span></p>
            </div>

            <div class="profile-privacy-list profile-notification-list">
                <div class="profile-privacy-row">
                    <div>
                        <strong>일정 알림</strong>
                        <p>내 일정과 참여 중인 일정 알림을 받습니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="notifyScheduleYn" type="checkbox" ${notifySchedule ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>공유/권한 알림</strong>
                        <p>콘텐츠 공유 요청과 권한 변경 알림을 받습니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="notifyShareYn" type="checkbox" ${notifyShare ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>친구/그룹 요청 알림</strong>
                        <p>친구 요청, 그룹 초대, 참여 요청 알림을 받습니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="notifyRequestYn" type="checkbox" ${notifyRequest ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>댓글/답글 알림</strong>
                        <p>내 콘텐츠의 댓글과 답글 알림을 받습니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="notifyCommentYn" type="checkbox" ${notifyComment ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
                <div class="profile-privacy-row">
                    <div>
                        <strong>좋아요 알림</strong>
                        <p>내 콘텐츠에 남겨진 좋아요 알림을 받습니다.</p>
                    </div>
                    <label class="profile-switch">
                        <input id="notifyLikeYn" type="checkbox" ${notifyLike ne 'N' ? 'checked' : ''}>
                        <span></span>
                    </label>
                </div>
            </div>

            <div class="profile-sheet-actions">
                <button type="button" class="profile-action" data-close-panel>취소</button>
                <button type="submit" class="profile-action is-primary">저장</button>
            </div>
        </form>
    </div>
</section>

<section id="profileSettingsPanel" class="profile-sheet" hidden aria-labelledby="profileSettingsTitle">
    <div class="profile-sheet-backdrop" data-close-panel></div>
    <div class="profile-sheet-dialog profile-sheet-dialog--settings profile-sheet-dialog--account">
        <div class="profile-sheet-head">
            <div>
                <span>ACCOUNT</span>
                <h2 id="profileSettingsTitle">계정 설정</h2>
            </div>
            <button type="button" class="profile-sheet-close" data-close-panel aria-label="닫기">×</button>
        </div>

        <div class="profile-account-section">
            <div class="profile-settings-section-title">
                <strong>계정 정보</strong>
                <p>로그인과 계정 보안에 사용하는 정보를 관리합니다.</p>
            </div>
            <div class="profile-field profile-field--readonly profile-account-email">
                <span>이메일</span>
                <div class="profile-readonly-value"><c:out value="${currentUser.email}" /></div>
                <p class="profile-field-note">로그인 아이디와 계정 안내에 사용되는 이메일입니다.</p>
            </div>

            <c:if test="${accountStatus eq 'WITHDRAW_PENDING'}">
                <div class="profile-withdraw-pending">
                    <strong>탈퇴 대기 중</strong>
                    <p>
                        이 계정은 탈퇴 신청 상태입니다.
                        <c:if test="${not empty withdrawDeadlineAt}">
                            <b><c:out value="${withdrawDeadlineAt}" /></b>까지 복구할 수 있습니다.
                        </c:if>
                    </p>
                    <button type="button" class="profile-action is-primary" id="mypageWithdrawCancelButton">탈퇴 신청 취소</button>
                </div>
            </c:if>
        </div>

        <section class="profile-account-card profile-password-card" aria-labelledby="profilePasswordTitle">
            <div class="profile-account-card-head">
                <div class="profile-account-title">
                    <strong id="profilePasswordTitle">비밀번호 변경</strong>
                    <p>현재 비밀번호 확인 후 새 비밀번호로 변경합니다.</p>
                </div>
                <button type="button" class="profile-account-toggle" data-toggle-password-form aria-expanded="false" aria-controls="profilePasswordForm">변경하기</button>
            </div>

            <form id="profilePasswordForm" class="profile-password-form" autocomplete="off" hidden>
                <p class="profile-password-policy">새 비밀번호 조건을 모두 충족하면 변경할 수 있습니다.</p>

                <div class="profile-field">
                    <label for="currentPassword">현재 비밀번호</label>
                    <div class="profile-password-input-wrap">
                        <input id="currentPassword" type="password" maxlength="30" placeholder="현재 비밀번호를 입력해주세요" autocomplete="current-password" required>
                        <button type="button" class="profile-password-visibility" data-password-visibility="currentPassword" aria-label="현재 비밀번호 보기" aria-pressed="false">
                            <svg class="profile-password-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path class="profile-password-eye__shape" d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z"></path>
                                <circle class="profile-password-eye__pupil" cx="12" cy="12" r="2.15"></circle>
                                <path class="profile-password-eye__slash" d="M5 5 19 19"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="profile-field">
                    <label for="newPassword">새 비밀번호</label>
                    <div class="profile-password-input-wrap">
                        <input id="newPassword" type="password" minlength="8" maxlength="72" placeholder="새 비밀번호를 입력해주세요" autocomplete="new-password" required>
                        <button type="button" class="profile-password-visibility" data-password-visibility="newPassword" aria-label="새 비밀번호 보기" aria-pressed="false">
                            <svg class="profile-password-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path class="profile-password-eye__shape" d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z"></path>
                                <circle class="profile-password-eye__pupil" cx="12" cy="12" r="2.15"></circle>
                                <path class="profile-password-eye__slash" d="M5 5 19 19"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="profile-password-rules" id="profilePasswordRules" aria-live="polite">
                        <span data-password-rule="length">8자 이상</span>
                        <span data-password-rule="letter">영문</span>
                        <span data-password-rule="number">숫자</span>
                        <span data-password-rule="special">특수문자</span>
                    </div>
                </div>

                <div class="profile-field">
                    <label for="confirmPassword">새 비밀번호 확인</label>
                    <div class="profile-password-input-wrap">
                        <input id="confirmPassword" type="password" minlength="8" maxlength="72" placeholder="새 비밀번호를 다시 입력해주세요" autocomplete="new-password" required>
                        <button type="button" class="profile-password-visibility" data-password-visibility="confirmPassword" aria-label="새 비밀번호 확인 보기" aria-pressed="false">
                            <svg class="profile-password-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path class="profile-password-eye__shape" d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z"></path>
                                <circle class="profile-password-eye__pupil" cx="12" cy="12" r="2.15"></circle>
                                <path class="profile-password-eye__slash" d="M5 5 19 19"></path>
                            </svg>
                        </button>
                    </div>
                    <p class="profile-password-match" id="profilePasswordMatch" aria-live="polite"></p>
                </div>

                <div class="profile-sheet-actions profile-password-actions">
                    <button type="button" class="profile-action" data-cancel-password-form>취소</button>
                    <button type="submit" class="profile-action is-primary">비밀번호 변경</button>
                </div>
            </form>
        </section>

        <c:if test="${accountStatus ne 'WITHDRAW_PENDING'}">
            <div class="profile-danger-zone profile-danger-zone--account">
                <div class="profile-danger-content">
                    <strong>회원 탈퇴</strong>
                    <p>30일간 복구 가능하며,<br>이후 탈퇴가 확정됩니다.<br>비밀번호 확인 후 진행합니다.</p>
                </div>
                <button type="button" class="profile-danger-button" id="mypageWithdrawButton">탈퇴 신청</button>
            </div>
        </c:if>
    </div>
</section>

<div id="withdrawConfirmModal" class="profile-confirm-modal" hidden role="dialog" aria-modal="true" aria-labelledby="withdrawConfirmTitle">
    <div class="profile-confirm-backdrop" data-withdraw-close></div>
    <div class="profile-confirm-dialog profile-confirm-dialog--danger">
        <div class="profile-confirm-head">
            <div>
                <span>ACCOUNT</span>
                <h3 id="withdrawConfirmTitle">회원 탈퇴 신청</h3>
            </div>
            <button type="button" class="profile-confirm-close" data-withdraw-close aria-label="닫기">×</button>
        </div>
        <div class="profile-confirm-body">
            <p class="profile-confirm-desc profile-confirm-desc--withdraw">
                <span>30일 동안 계정을 복구할 수 있습니다.</span>
                <span>30일이 지나면 탈퇴가 최종 처리되며 개인정보는 삭제 또는 익명화됩니다. 이후에는 복구할 수 없습니다.</span>
            </p>
            <div class="profile-field profile-confirm-password">
                <label for="withdrawConfirmPassword">현재 비밀번호</label>
                <div class="profile-password-input-wrap">
                    <input id="withdrawConfirmPassword" type="password" maxlength="30" placeholder="현재 비밀번호를 입력해주세요" autocomplete="current-password">
                    <button type="button" class="profile-password-visibility" data-password-visibility="withdrawConfirmPassword" aria-label="현재 비밀번호 보기" aria-pressed="false">
                        <svg class="profile-password-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path class="profile-password-eye__shape" d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z"></path>
                            <circle class="profile-password-eye__pupil" cx="12" cy="12" r="2.15"></circle>
                            <path class="profile-password-eye__slash" d="M5 5 19 19"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <div class="profile-confirm-actions">
            <button type="button" class="profile-action" data-withdraw-close>취소</button>
            <button type="button" class="profile-danger-button is-solid" id="withdrawConfirmSubmit">탈퇴 신청</button>
        </div>
    </div>
</div>

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


<div id="profileHistoryModal" class="signup-profile-modal profile-history-modal" hidden role="dialog" aria-modal="true" aria-labelledby="profileHistoryTitle">
    <div class="signup-profile-modal-backdrop" data-profile-history-close></div>
    <div class="signup-profile-modal-dialog profile-history-modal-dialog">
        <div class="signup-profile-modal-head">
            <div>
                <span class="signup-profile-modal-kicker">프로필 사진</span>
                <h3 id="profileHistoryTitle">이전 프로필 사진</h3>
            </div>
            <button type="button" class="signup-profile-modal-close" data-profile-history-close aria-label="닫기">×</button>
        </div>

        <p class="profile-history-modal-hint">현재 사용 중인 사진 외 최근 프로필 사진 5개 안에서 다시 사용할 사진을 선택해주세요. 기본 아바타로 바꿔도 이전 사진 기록은 유지됩니다.</p>
        <div id="profileImageHistoryList" class="profile-image-history-list"></div>
    </div>
</div>
</c:if>

<%@ include file="../common/commonPeopleModal.jspf"%>
<%@ include file="../common/commonPhotoPostDetail.jspf"%>
<%@ include file="../common/commonCalendarEventPreview.jspf"%>
<jsp:include page="/WEB-INF/views/common/commonContentRecordModal.jsp" />

<button type="button" id="calendarViewShareOpenHidden" data-share-content-id="" hidden>공유</button>
<span id="calendarViewShareCount" hidden>0</span>
<span id="calendarViewPermissionCount" hidden>0</span>
<button type="button" id="calendarViewPermissionOpenHidden" hidden>권한</button>

<div id="calendarViewShareHiddenFields" hidden></div>
<div id="calendarViewShareInitialSource" hidden></div>
<div id="calendarViewWorkspaceMemberSource" hidden></div>
<div id="calendarViewProjectMemberSource" hidden></div>
<div id="calendarViewWorkspaceTargetSource" hidden></div>
<div id="calendarViewProjectTargetSource" hidden></div>
<div id="calendarViewShareModal" class="note-write-share-modal moyo-share-modal" data-current-user-id="${sessionScope.user.userId}" hidden>
    <div class="note-write-share-backdrop" data-note-share-close></div>
    <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="calendarViewShareModalTitle">
        <div class="note-write-share-modal-head">
            <div>
                <h3 id="calendarViewShareModalTitle">공유</h3>
                <p>일정 공유 상태를 확인합니다.</p>
            </div>
            <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
        </div>
        <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
            <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
            <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">그룹</button>
            <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
        </div>
        <div class="note-write-share-toolbar">
            <select id="calendarViewShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
            <input type="text" id="calendarViewShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
        </div>
        <div class="note-write-share-body note-write-share-body-simple">
            <div>
                <div class="note-write-share-subtitle">받는 대상</div>
                <div id="calendarViewShareCandidates" class="note-write-share-list"></div>
            </div>
            <div>
                <div class="note-write-share-subtitle">공유 목록 <span id="calendarViewShareModalCount" class="note-share-modal-count" hidden>0</span></div>
                <div id="calendarViewShareSelected" class="note-write-share-selected"></div>
            </div>
        </div>
        <div class="note-write-share-modal-actions">
            <div>
                <button type="button" class="note-soft-btn" data-note-share-close>닫기</button>
                <button type="button" id="calendarViewShareApply" class="note-gradient-btn">확인</button>
            </div>
        </div>
    </section>
</div>

<script src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=20260906-avatar-isolation-59"></script>
<script src="${pageContext.request.contextPath}/js/friendPeopleAdapter.js?v=20260907-friend-relation-3"></script>
<script>
    window.MOYO_CONTEXT_PATH = '${pageContext.request.contextPath}';
    window.MOYO_CALENDAR_CONTEXT_PATH = '${pageContext.request.contextPath}';
    window.MOYO_CALENDAR_SESSION_USER_ID = '${sessionScope.user.userId}';
</script>

<script>
    (function() {
        if (!window.CommonPeopleModal || typeof window.CommonPeopleModal.init !== 'function') return;
        if (!document.getElementById('calendarViewShareModal')) return;
        window.CommonPeopleModal.init({
            contentType: 'CALENDAR',
            persist: true,
            shareMode: 'PERMISSION',
            enablePermission: true,
            bodyOpenClass: 'note-share-modal-open',
            reloadOnPersist: false,
            currentUserId: String(window.MOYO_CALENDAR_SESSION_USER_ID || ''),
            ids: {
                openButton: 'calendarViewShareOpenHidden',
                modal: 'calendarViewShareModal',
                keyword: 'calendarViewShareKeyword',
                applyButton: 'calendarViewShareApply',
                title: 'calendarViewShareModalTitle',
                context: 'calendarViewShareContext',
                candidates: 'calendarViewShareCandidates',
                selected: 'calendarViewShareSelected',
                hiddenFields: 'calendarViewShareHiddenFields',
                count: 'calendarViewShareCount',
                modalCount: 'calendarViewShareModalCount',
                permissionButton: 'calendarViewPermissionOpenHidden',
                permissionCount: 'calendarViewPermissionCount',
                initialSharesSource: 'calendarViewShareInitialSource',
                workspaceMemberSource: 'calendarViewWorkspaceMemberSource',
                projectMemberSource: 'calendarViewProjectMemberSource',
                workspaceTargetSource: 'calendarViewWorkspaceTargetSource',
                projectTargetSource: 'calendarViewProjectTargetSource'
            }
        });
    })();
</script>
<script src="${pageContext.request.contextPath}/js/commonPhotoPostDetail.js?v=20260907-profile-photo-collect-media"></script>
<script src="${pageContext.request.contextPath}/js/common/commonContentRecordModal.js"></script>
<script src="${pageContext.request.contextPath}/js/commonCalendarEventPreview.js?v=calendar-preview-avatar-policy-v12"></script>
<script src="${pageContext.request.contextPath}/js/myPage.js?v=20260907-friend-count-guide-1"></script>
<script src="${pageContext.request.contextPath}/js/commonContentCard.js?v=20260907-profile-note-send-card-fix-1"></script>
<script src="${pageContext.request.contextPath}/js/myPage-tabs.js?v=20260907-friend-activity-open-1"></script>
<script src="${pageContext.request.contextPath}/js/myPage-settings.js?v=settings-cleanup-20260906"></script>
<script src="${pageContext.request.contextPath}/js/noteFolderAdapter.js?v=common-folder-card-v2"></script>
<script src="${pageContext.request.contextPath}/js/commonFolderModal.js?v=common-folder-card-v2"></script>
<script src="${pageContext.request.contextPath}/js/commonNoteDetail.js?v=20260907-profile-note-send-card-fix-1"></script>
</body>
</html>
