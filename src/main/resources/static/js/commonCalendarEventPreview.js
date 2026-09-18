(function(window, document) {
    'use strict';

    const DEFAULT_TYPE_COLORS = {
        PRIVATE: '#3f7cff',
        FRIEND: '#f6b642',
        MOYO: '#45cfd0',
        WS: '#55d8c6',
        PROJ: '#8b63f6',
        HOLIDAY: '#ff6b6b',
        TASK: '#3f7cff'
    };

    let deleteState = null;
    let lastOptions = {};
    let initialized = false;
    let calendarRecordModal = null;
    let currentCalendarRecordDetail = null;
    let currentCalendarRecordEventId = null;

    function contextPath() {
        return window.MOYO_CALENDAR_CONTEXT_PATH
            || document.querySelector('[data-context-path]')?.dataset.contextPath
            || document.body?.dataset.contextPath
            || '';
    }

    function openCalendarScopedUserProfile(userId, detail) {
        const id = String(userId || '').trim();
        if (!id) return;

        const detailWsId = String(
            getDetailValue(detail || {}, 'profileWsId', 'PROFILE_WS_ID', 'projectWsId', 'PROJECT_WS_ID', 'wsId', 'WS_ID') || ''
        ).trim();
        const pageWsId = String(
            document.body?.dataset?.wsId
            || window.PROJECT_MAIN_CONFIG?.wsId
            || window.PROJECT_MAIN_CONFIG?.paramWsId
            || ''
        ).trim();
        const wsId = detailWsId || pageWsId;

        if (wsId) {
            const activeWsId = String(
                window.WORKSPACE_CONFIG?.wsId
                || window.PROJECT_MAIN_CONFIG?.wsId
                || window.PROJECT_MAIN_CONFIG?.paramWsId
                || document.body?.dataset?.wsId
                || ''
            ).trim();
            if (activeWsId === wsId && typeof window.openWorkspaceMemberProfile === 'function') {
                window.openWorkspaceMemberProfile(id);
                return;
            }
            if (typeof window.openProjectMemberProfile === 'function' && window.PROJECT_MAIN_CONFIG?.wsId && String(window.PROJECT_MAIN_CONFIG.wsId) === wsId) {
                window.openProjectMemberProfile(id);
                return;
            }
            // 일정 상세은 그룹 프로필 데이터를 이미 사용한다. 현재 화면에 그룹 프로필 모달 컨텍스트가 없으면
            // 잘못된 개인 프로필로 보내지 않고 현재 표시만 유지한다.
            return;
        }

        window.location.href = contextPath() + '/users/profile?userId=' + encodeURIComponent(id);
    }

    function canOpenCalendarScopedUserProfile(detail) {
        const wsId = String(
            getDetailValue(detail || {}, 'profileWsId', 'PROFILE_WS_ID', 'projectWsId', 'PROJECT_WS_ID', 'wsId', 'WS_ID') || ''
        ).trim();
        if (!wsId) return true;
        const activeWsId = String(
            window.WORKSPACE_CONFIG?.wsId
            || window.PROJECT_MAIN_CONFIG?.wsId
            || window.PROJECT_MAIN_CONFIG?.paramWsId
            || document.body?.dataset?.wsId
            || ''
        ).trim();
        return !!activeWsId && activeWsId === wsId
            && (typeof window.openWorkspaceMemberProfile === 'function' || typeof window.openProjectMemberProfile === 'function');
    }

    function mascotPath() {
        return contextPath() + '/brand/moyo_mark.png?v=moyo-mark-v34';
    }

    function typeColors() {
        return Object.assign({}, DEFAULT_TYPE_COLORS, window.MOYO_CALENDAR_TYPE_COLORS || {});
    }

    function fetchEventDetail(eventId) {
        return fetch(contextPath() + '/api/calendar/detail?eventId=' + encodeURIComponent(eventId), {
            credentials: 'same-origin'
        }).then(function(response) {
            if (!response.ok) throw new Error('일정 정보를 불러오지 못했습니다.');
            return response.json();
        });
    }

    function open(eventId, options) {
        if (!eventId) return Promise.resolve(null);
        lastOptions = Object.assign({ source: 'common', showActions: true }, options || {});
        return fetchEventDetail(eventId)
            .then(function(detail) {
                render(detail, eventId, lastOptions);
                return detail;
            })
            .catch(function(error) {
                if (lastOptions.silent) {
                    console.warn(error && error.message ? error.message : error);
                } else {
                    alert(error && error.message ? error.message : '일정 정보를 불러오지 못했습니다.');
                }
                return null;
            });
    }

    function render(detail, sourceEventId, options) {
        const modal = document.getElementById('calendarViewModal');
        if (!modal || !detail) return;

        const title = getDetailValue(detail, 'title', 'TITLE') || '제목 없는 일정';
        const itemType = getDetailValue(detail, 'itemType', 'ITEM_TYPE', 'type', 'TYPE') || 'PRIVATE';
        let displayType = getDisplayType(itemType, detail);
        if (displayType === 'PRIVATE' && isReceivedPrivateCalendarEvent(detail)) displayType = 'FRIEND';

        const isMoyoPublic = isMoyoSharedEvent(detail);
        const isCompactDetail = isCalendarViewCompactDetail(detail);
        const canEdit = getDetailValue(detail, 'canEditYn', 'CAN_EDIT_YN') === 'Y';
        const canDelete = getDetailValue(detail, 'canDeleteYn', 'CAN_DELETE_YN') === 'Y';
        const eventId = getDetailValue(detail, 'eventId', 'EVENT_ID', 'id', 'ID') || sourceEventId;
        const accent = typeColors()[displayType] || DEFAULT_TYPE_COLORS.PRIVATE;
        const card = modal.querySelector('.moyo-event-view-card');

        if (card) {
            card.style.setProperty('--event-accent', accent);
            card.style.setProperty('--event-accent-soft', hexToRgba(accent, 0.10));
            card.style.setProperty('--event-accent-border', hexToRgba(accent, 0.26));
            card.classList.remove('scope-PRIVATE', 'scope-FRIEND', 'scope-WS', 'scope-PROJ');
            card.classList.add('scope-' + displayType);
            card.classList.toggle('is-compact-detail', isCompactDetail);
        }

        setText('calendarViewTitle', title);
        renderScopeBadge(detail, displayType, isMoyoPublic);
        hideKicker();
        renderMoyoBadge(false);
        renderAuthor(detail);
        renderAffiliation(detail, displayType);
        renderTime(detail);
        renderLocation(detail);
        renderAttendees(detail);
        renderDescription(detail);
        renderCalendarRecordSection(detail, eventId);
        setupEditButton(eventId, canEdit, options);
        setupDeleteButton(detail, eventId, canDelete, options);
        setupShareButton(detail, eventId, options);

        modal.hidden = false;
        document.body.classList.add('moyo-event-view-open');
    }

    function close() {
        const modal = document.getElementById('calendarViewModal');
        if (modal) modal.hidden = true;
        currentCalendarRecordDetail = null;
        currentCalendarRecordEventId = null;
        document.body.classList.remove('moyo-event-view-open');
    }

    function renderScopeBadge(detail, displayType, isMoyoPublic) {
        const badge = document.getElementById('calendarViewScopeBadge');
        if (!badge) return;
        let label = '개인';
        if (displayType === 'FRIEND') label = '친구';
        if (displayType === 'WS') label = '그룹';
        if (displayType === 'PROJ') label = '프로젝트';
        if (isMoyoPublic && (displayType === 'PRIVATE' || displayType === 'FRIEND')) label = 'MOYO 공개';
        badge.textContent = label;
        badge.className = 'moyo-event-view-scope-badge scope-' + displayType + (isMoyoPublic ? ' is-moyo-public' : '');
    }

    function hideKicker() {
        const metaEl = document.getElementById('calendarViewMeta');
        if (!metaEl) return;
        metaEl.textContent = '';
        const metaWrap = metaEl.closest('.moyo-event-view-kicker');
        if (metaWrap) metaWrap.hidden = true;
    }

    function renderMoyoBadge(visible) {
        const mascot = document.getElementById('calendarViewMascot');
        const moyoBadge = document.getElementById('calendarViewMoyoBadge');
        if (mascot) mascot.src = mascotPath();
        if (moyoBadge) moyoBadge.hidden = !visible;
    }

    function renderAuthor(detail) {
        const row = document.getElementById('calendarViewAuthorRow');
        const avatar = document.getElementById('calendarViewAuthorAvatar');
        const nameEl = document.getElementById('calendarViewAuthorName');
        const scopeEl = document.getElementById('calendarViewAuthorScope');
        if (!row || !avatar || !nameEl) return;

        const ownerName = calendarViewOwnerName(detail) || '작성자';
        const ownerImageRaw = calendarViewOwnerImage(detail);
        const ownerAvatarType = calendarViewOwnerAvatarType(detail);
        const ownerImage = ownerAvatarType === 'IMAGE' && isMoyoPersonProfileImage(ownerImageRaw)
            ? normalizeImagePath(ownerImageRaw)
            : '';
        const ownerId = calendarViewOwnerId(detail);
        const authorMain = row.querySelector('.moyo-event-view-author-main');
        const profileLinkEnabled = !!ownerId && canOpenCalendarScopedUserProfile(detail);

        row.hidden = false;
        nameEl.textContent = ownerName;
        nameEl.title = ownerName;
        if (scopeEl) {
            scopeEl.hidden = true;
            scopeEl.textContent = '';
        }

        if (authorMain) {
            authorMain.classList.toggle('is-profile-link', profileLinkEnabled);
            authorMain.setAttribute('role', profileLinkEnabled ? 'link' : 'presentation');
            authorMain.tabIndex = profileLinkEnabled ? 0 : -1;
            authorMain.onclick = profileLinkEnabled ? function(event) {
                event.preventDefault();
                event.stopPropagation();
                openCalendarScopedUserProfile(ownerId, detail);
            } : null;
            authorMain.onkeydown = profileLinkEnabled ? function(event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openCalendarScopedUserProfile(ownerId, detail);
            } : null;
            authorMain.title = profileLinkEnabled ? ownerName + ' 프로필 보기' : '';
        }

        const initial = escapeHtml(String(ownerName || '?').trim().slice(0, 1) || '?');
        avatar.classList.remove('has-image', 'is-default-profile');
        avatar.classList.add(ownerImage ? 'has-image' : 'is-default-profile');
        avatar.innerHTML = (ownerImage
            ? '<img src="' + escapeHtml(ownerImage) + '" alt="' + escapeHtml(ownerName) + ' 프로필" loading="lazy" decoding="async">'
            : '')
            + '<span class="moyo-member-avatar-fallback">' + initial + '</span>';
        const img = avatar.querySelector('img');
        if (img) {
            img.onload = function() {
                if (window.CommonMemberWidget && typeof window.CommonMemberWidget.applyAvatarImagePolicy === 'function') {
                    window.CommonMemberWidget.applyAvatarImagePolicy(img);
                    return;
                }
                avatar.classList.add('has-image');
                avatar.classList.remove('is-default-profile');
            };
            img.onerror = function() {
                if (window.CommonMemberWidget && typeof window.CommonMemberWidget.handleAvatarError === 'function') {
                    window.CommonMemberWidget.handleAvatarError(img);
                    return;
                }
                img.remove();
                avatar.classList.remove('has-image');
                avatar.classList.add('is-default-profile');
            };
        }
    }

    function renderAffiliation(detail, displayType) {
        const section = document.getElementById('calendarViewAffiliationSection');
        const box = document.getElementById('calendarViewAffiliation');
        if (!section || !box) return;
        if (displayType !== 'WS' && displayType !== 'PROJ') {
            section.hidden = true;
            box.textContent = '';
            return;
        }
        const wsName = getDetailValue(detail, 'projectWorkspaceName', 'PROJECT_WORKSPACE_NAME', 'wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME') || '';
        const projName = getDetailValue(detail, 'projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME') || '';
        const text = displayType === 'PROJ'
            ? [wsName, projName].filter(Boolean).join(' > ')
            : wsName;
        box.textContent = text || (displayType === 'PROJ' ? '프로젝트' : '그룹');
        section.hidden = false;
    }

    function renderTime(detail) {
        const box = document.getElementById('calendarViewTimeInfo');
        if (!box) return;
        const start = formatDetailDateTimeParts(getDetailValue(detail, 'startDt', 'START_DT') || '');
        const end = formatDetailDateTimeParts(getDetailValue(detail, 'endDt', 'END_DT') || '');
        const isAllDay = isDetailAllDayEvent(detail);
        const isLunar = getDetailValue(detail, 'isLunar', 'IS_LUNAR') === 'Y';
        const timezone = getDetailValue(detail, 'timezone', 'TIMEZONE') || 'Asia/Seoul';
        const repeat = buildRepeatSummary(detail);

        let dateMain = '';
        let timeSub = '';
        if (isAllDay && start.date === end.date) {
            dateMain = start.date;
            timeSub = '종일';
        } else if (isAllDay) {
            dateMain = start.date + ' ~ ' + end.date;
            timeSub = '종일';
        } else if (start.date === end.date) {
            dateMain = start.date;
            timeSub = start.ampm + ' ' + start.time + ' ~ ' + end.ampm + ' ' + end.time;
        } else {
            dateMain = start.date + ' ~ ' + end.date;
            timeSub = start.ampm + ' ' + start.time + ' ~ ' + end.ampm + ' ' + end.time;
        }

        const meta = [];
        if (timezone && timezone !== 'Asia/Seoul') meta.push(formatTimezoneLabel(timezone));
        if (repeat) meta.push(repeat);

        const calendarLabel = isLunar ? '음력' : '양력';
        const calendarTypeIcon = isLunar ? 'fa-regular fa-moon' : 'fa-regular fa-sun';
        const subItems = [];
        if (timeSub) subItems.push('<span>' + escapeHtml(timeSub) + '</span>');
        if (meta.length) subItems.push('<span>' + escapeHtml(meta.join(' · ')) + '</span>');

        box.innerHTML = '<div class="moyo-event-view-time-compact">'
            + '<span class="moyo-event-view-calendar-icon" aria-hidden="true"><i class="fa-regular fa-calendar"></i></span>'
            + '<span class="moyo-event-view-time-copy">'
            + '<span class="moyo-event-view-date-main">'
            + '<strong>' + escapeHtml(dateMain || '-') + '</strong>'
            + '<span class="moyo-event-view-calendar-type" title="' + calendarLabel + '" aria-label="' + calendarLabel + '"><i class="' + calendarTypeIcon + '" aria-hidden="true"></i></span>'
            + '</span>'
            + (subItems.length ? '<small>' + subItems.join('<span class="moyo-event-view-time-separator">·</span>') + '</small>' : '')
            + '</span>'
            + '</div>';
    }

    function renderLocation(detail) {
        const section = document.getElementById('calendarViewLocationSection');
        const box = document.getElementById('calendarViewLocation');
        if (!box) return;
        const text = getDetailValue(detail, 'locationText', 'LOCATION_TEXT') || getDetailValue(detail, 'locationAddress', 'LOCATION_ADDRESS') || '';
        const query = getDetailValue(detail, 'locationAddress', 'LOCATION_ADDRESS') || text;
        if (section) section.hidden = !text;
        if (!text) {
            box.innerHTML = '';
            return;
        }
        box.innerHTML = '<span class="moyo-event-view-location-text">' + escapeHtml(text) + '</span>'
            + '<button type="button" class="moyo-event-view-map-link" data-map-query="' + escapeHtml(query) + '" aria-label="지도에서 위치 확인">'
            + '<span>지도 보기</span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>'
            + '</button>';
    }

    function renderAttendees(detail) {
        const section = document.getElementById('calendarViewAttendeesSection');
        const box = document.getElementById('calendarViewAttendees');
        const moreButton = document.getElementById('calendarViewAttendeeMore');
        const list = document.getElementById('calendarViewAttendeeList');
        if (!box) return;
        const attendees = normalizeDetailArray(getDetailValue(detail, 'attendees', 'ATTENDEES'));
        if (section) section.hidden = !attendees.length;
        if (!attendees.length) {
            box.innerHTML = '';
            if (moreButton) moreButton.hidden = true;
            if (list) { list.hidden = true; list.innerHTML = ''; }
            return;
        }

        const representative = attendees[0];
        const representativeName = calendarViewAttendeeName(representative);
        const visiblePeople = attendees.slice(0, 3);
        const remainCount = Math.max(0, attendees.length - visiblePeople.length);
        const summaryName = attendees.length > 1
            ? representativeName + ' 외 ' + (attendees.length - 1) + '명'
            : representativeName;
        const summaryMeta = attendees.length + '명 참석';

        const stackHtml = '<span class="moyo-event-view-attendee-stack">'
            + visiblePeople.map(function(item) {
                const name = calendarViewAttendeeName(item);
                const userId = calendarViewAttendeeUserId(item);
                const profileLinkEnabled = !!userId && canOpenCalendarScopedUserProfile(detail);
                const attrs = profileLinkEnabled
                    ? ' data-profile-user-id="' + escapeHtml(userId) + '" role="button" tabindex="0" aria-label="' + escapeHtml(name) + ' 프로필 보기" title="' + escapeHtml(name) + ' 프로필 보기"'
                    : ' title="' + escapeHtml(name) + '"';
                return '<span class="moyo-event-view-attendee-avatar-link' + (profileLinkEnabled ? ' is-profile-link' : '') + '"' + attrs + '>'
                    + calendarViewAttendeeAvatar(item, name)
                    + '</span>';
            }).join('')
            + (remainCount ? '<span class="moyo-event-view-attendee-remain">+' + remainCount + '</span>' : '')
            + '</span>';

        box.innerHTML = stackHtml
            + '<span class="moyo-event-view-attendee-copy">'
            + '<b>' + escapeHtml(summaryName) + '</b>'
            + '<small>' + escapeHtml(summaryMeta) + '</small>'
            + '</span>';

        if (moreButton) {
            const showMore = attendees.length > 1;
            moreButton.hidden = !showMore;
            moreButton.style.display = showMore ? '' : 'none';
            moreButton.textContent = '전체 보기';
            moreButton.setAttribute('aria-expanded', 'false');
        }

        if (list) {
            list.hidden = true;
            list.innerHTML = attendees.map(function(item) {
                const name = calendarViewAttendeeName(item);
                const userId = calendarViewAttendeeUserId(item);
                const profileLinkEnabled = !!userId && canOpenCalendarScopedUserProfile(detail);
                const linkAttrs = profileLinkEnabled
                    ? ' data-profile-user-id="' + escapeHtml(userId) + '" role="button" tabindex="0" aria-label="' + escapeHtml(name) + ' 프로필 보기"'
                    : '';
                return '<div class="moyo-event-view-attendee-person' + (profileLinkEnabled ? ' is-profile-link' : '') + '"' + linkAttrs + '>'
                    + calendarViewAttendeeAvatar(item, name)
                    + '<span><b>' + escapeHtml(name) + '</b><small>참석자</small></span>'
                    + '</div>';
            }).join('');
        }
        bindAttendeeProfileLinks(box, detail);
        if (list) bindAttendeeProfileLinks(list, detail);
    }

    function toggleCalendarViewAttendeeList() {
        const list = document.getElementById('calendarViewAttendeeList');
        const button = document.getElementById('calendarViewAttendeeMore');
        if (!list || !button) return;
        const willOpen = list.hidden;
        list.hidden = !willOpen;
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        button.textContent = willOpen ? '접기' : '전체 보기';
    }

    function renderDescription(detail) {
        const section = document.getElementById('calendarViewDescriptionSection');
        const box = document.getElementById('calendarViewDescription');
        if (!box) return;
        const text = getDetailValue(detail, 'descriptionText', 'DESCRIPTION_TEXT') || '';
        if (section) section.hidden = !text;
        box.textContent = text;
    }


    function calendarRecordValue(detail, camel, upper) {
        return getDetailValue(detail, camel, upper);
    }

    function isCalendarRecordEnabled(detail) {
        return String(calendarRecordValue(detail, 'recordEnabledYn', 'RECORD_ENABLED_YN') || 'N').toUpperCase() === 'Y';
    }

    function calendarRecordContext(detail) {
        const projId = Number(calendarRecordValue(detail, 'projId', 'PROJ_ID') || 0);
        const wsId = Number(calendarRecordValue(detail, 'wsId', 'WS_ID') || 0);
        if (projId > 0) return { contextType: 'PROJECT', contextId: projId, photoScopeType: 'PROJECT', photoScopeId: projId, visibilityType: 'PROJECT' };
        if (wsId > 0) return { contextType: 'GROUP', contextId: wsId, photoScopeType: 'WORKSPACE', photoScopeId: wsId, visibilityType: 'WORKSPACE' };
        const ownerId = Number(calendarViewOwnerId(detail) || window.MOYO_CALENDAR_SESSION_USER_ID || document.body?.dataset?.currentUserId || 0);
        return { contextType: 'PERSONAL', contextId: null, photoScopeType: 'PERSONAL', photoScopeId: ownerId, visibilityType: 'PRIVATE' };
    }

    function calendarRecordType(item) {
        const raw = String(getDetailValue(item, 'recordType', 'RECORD_TYPE', 'contentType', 'CONTENT_TYPE') || '').toUpperCase();
        return raw === 'PHOTO_POST' ? 'PHOTO' : raw;
    }

    function emptyCalendarRecordCounts() {
        return { NOTE: 0, PHOTO: 0, FILE: 0, LINK: 0, LOCATION: 0 };
    }

    function renderCalendarRecordCounts(items) {
        const wrap = document.getElementById('calendarViewRecordCounts');
        if (!wrap) return;
        const counts = emptyCalendarRecordCounts();
        (Array.isArray(items) ? items : []).forEach(function(item) {
            const type = calendarRecordType(item);
            if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type] += 1;
        });
        const defs = [
            ['NOTE', 'fa-regular fa-note-sticky', '노트'],
            ['PHOTO', 'fa-regular fa-image', '사진'],
            ['FILE', 'fa-solid fa-paperclip', '파일'],
            ['LINK', 'fa-solid fa-link', '링크'],
            ['LOCATION', 'fa-solid fa-location-dot', '장소']
        ];
        wrap.innerHTML = defs.map(function(def) {
            return '<button type="button" class="moyo-event-view-record-shortcut" data-calendar-record-type="' + def[0]
                + '" title="' + def[2] + ' 바로 열기" aria-label="' + def[2] + ' ' + counts[def[0]] + '개, 바로 열기">'
                + '<i class="' + def[1] + '" aria-hidden="true"></i><b>' + counts[def[0]] + '</b></button>';
        }).join('');
    }

    async function getExistingCalendarRecordTarget(eventId) {
        const response = await fetch(contextPath() + '/api/content-records/target?targetType=EVENT&targetId=' + encodeURIComponent(eventId), {
            credentials: 'same-origin'
        });
        if (!response.ok) return null;
        return response.json().catch(function() { return null; });
    }

    async function ensureCalendarRecordTarget(detail, eventId) {
        const context = calendarRecordContext(detail);
        const response = await fetch(contextPath() + '/api/content-records/target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                targetType: 'EVENT',
                targetId: Number(eventId),
                contextType: context.contextType,
                contextId: context.contextId
            })
        });
        const body = await response.json().catch(function() { return null; });
        if (!response.ok) throw new Error((body && (body.message || body.error)) || '일정 기록 대상을 준비하지 못했습니다.');
        return body;
    }

    async function loadCalendarRecordSummary(detail, eventId) {
        const section = document.getElementById('calendarViewRecordSection');
        if (!section || !eventId) return;
        renderCalendarRecordCounts([]);
        try {
            const target = await getExistingCalendarRecordTarget(eventId);
            if (!target) return;
            const recordTargetId = Number(getDetailValue(target, 'recordTargetId', 'RECORD_TARGET_ID') || 0);
            if (!recordTargetId) return;
            const response = await fetch(contextPath() + '/api/content-records/' + encodeURIComponent(recordTargetId) + '/items', {
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error('일정 기록을 불러오지 못했습니다.');
            const items = await response.json();
            if (String(currentCalendarRecordEventId) === String(eventId)) renderCalendarRecordCounts(items);
        } catch (error) {
            console.warn('[일정 상세] 기록 개수 조회 실패:', error);
            if (String(currentCalendarRecordEventId) === String(eventId)) renderCalendarRecordCounts([]);
        }
    }

    function renderCalendarRecordSection(detail, eventId) {
        const section = document.getElementById('calendarViewRecordSection');
        if (!section) return;
        const available = !!eventId;
        currentCalendarRecordDetail = available ? detail : null;
        currentCalendarRecordEventId = available ? eventId : null;
        section.hidden = !available;
        renderCalendarRecordCounts([]);
        if (available) loadCalendarRecordSummary(detail, eventId);
    }

    async function openCalendarRecordViewer(recordType) {
        if (!currentCalendarRecordDetail || !currentCalendarRecordEventId) return;
        try {
            initCalendarRecordModal();
            if (!calendarRecordModal) throw new Error('공통 기록 모달을 불러오지 못했습니다.');
            const target = await ensureCalendarRecordTarget(currentCalendarRecordDetail, currentCalendarRecordEventId);
            const recordTargetId = Number(getDetailValue(target, 'recordTargetId', 'RECORD_TARGET_ID') || 0);
            if (!recordTargetId) throw new Error('일정 기록 대상을 확인할 수 없습니다.');
            const title = getDetailValue(currentCalendarRecordDetail, 'title', 'TITLE') || '일정';
            calendarRecordModal.open({
                recordTargetId: recordTargetId,
                targetLabel: String(title),
                activeType: String(recordType || 'NOTE').toUpperCase()
            });
        } catch (error) {
            alert(error && error.message ? error.message : '기록을 열지 못했습니다.');
        }
    }

    function initCalendarRecordModal() {
        if (calendarRecordModal || !window.CommonContentRecordModal?.create) return;
        calendarRecordModal = window.CommonContentRecordModal.create({
            contextPath: contextPath(),
            onChanged: async function() {
                if (currentCalendarRecordDetail && currentCalendarRecordEventId) {
                    await loadCalendarRecordSummary(currentCalendarRecordDetail, currentCalendarRecordEventId);
                }
            },
            onCreatePhoto: async function(payload) {
                if (!currentCalendarRecordDetail || !currentCalendarRecordEventId) throw new Error('일정 정보를 확인할 수 없습니다.');
                const recordTargetId = Number(payload && payload.recordTargetId || 0);
                const formData = payload && payload.formData;
                const context = calendarRecordContext(currentCalendarRecordDetail);
                if (!recordTargetId || !context.photoScopeId) throw new Error('사진 저장 위치를 확인할 수 없습니다.');
                const files = formData ? formData.getAll('files').filter(function(file) { return file instanceof File && file.size > 0; }) : [];
                if (!files.length) throw new Error('등록할 사진을 선택해주세요.');

                const requestJson = async function(url, options) {
                    const response = await fetch(contextPath() + url, Object.assign({ credentials: 'same-origin' }, options || {}));
                    const body = await response.json().catch(function() { return null; });
                    if (!response.ok) throw new Error((body && (body.message || body.error)) || '사진을 저장하지 못했습니다.');
                    return body;
                };

                const title = String(getDetailValue(currentCalendarRecordDetail, 'title', 'TITLE') || '일정').trim();
                const album = await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/photo-album', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ albumName: title })
                });
                const albumId = Number(album && (album.albumId || album.ALBUM_ID));
                if (!albumId) throw new Error('기록 사진 앨범을 준비하지 못했습니다.');

                const upload = new FormData();
                upload.append('scopeType', context.photoScopeType);
                upload.append('scopeId', String(context.photoScopeId));
                upload.append('albumId', String(albumId));
                upload.append('title', title);
                upload.append('description', '');
                upload.append('visibilityType', context.visibilityType);
                files.forEach(function(file) { upload.append('files', file); });

                const post = await requestJson('/api/photo-posts', { method: 'POST', body: upload });
                const postId = Number(post && (post.postId || post.POST_ID));
                if (!postId) throw new Error('사진 게시물 정보를 확인하지 못했습니다.');

                await requestJson('/api/content-records/' + encodeURIComponent(recordTargetId) + '/contents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recordType: 'PHOTO', contentId: postId, title: title })
                });
            }
        });
        window.moyoCommonContentRecordModal = calendarRecordModal;
    }

    function setupEditButton(eventId, canEdit, options) {
        const editBtn = document.getElementById('calendarViewEdit');
        if (!editBtn) return;
        editBtn.hidden = true;
        editBtn.onclick = null;
        if (!eventId || !canEdit || options.showActions === false) return;
        editBtn.hidden = false;
        editBtn.onclick = function() {
            if (typeof options.onEdit === 'function') {
                options.onEdit(eventId);
                return;
            }
            window.location.href = contextPath() + '/calendar/event/form?mode=edit&eventId=' + encodeURIComponent(eventId || '');
        };
    }

    function setupDeleteButton(detail, eventId, canDelete, options) {
        const deleteBtn = document.getElementById('calendarViewDelete');
        if (!deleteBtn) return;
        deleteBtn.hidden = true;
        deleteBtn.onclick = null;
        if (!eventId || !canDelete || options.showActions === false) return;
        deleteBtn.hidden = false;
        deleteBtn.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();
            openDeleteModal(detail, eventId, options);
        };
    }

    function setupShareButton(detail, eventId, options) {
        const shareBtn = document.getElementById('calendarViewShareBtn');
        if (!shareBtn) return;

        // 일정의 공유 대상/편집 권한은 "참석자"에서 한 번에 관리한다.
        // 개인 일정: 참석자 = 공유 대상, 참석자 권한(VIEW/EDIT) = 일정/기록 권한.
        // 그룹/프로젝트 일정: 공간 멤버는 기본 조회 가능하며 참석자의 EDIT만 추가 권한이다.
        // 따라서 일정 상세에서 별도 공유 모달을 열지 않는다.
        shareBtn.hidden = true;
        shareBtn.onclick = null;
    }

    function openDeleteModal(detail, eventId, options) {
        const modal = document.getElementById('calendarViewDeleteModal');
        const message = document.getElementById('calendarViewDeleteMessage');
        const repeatBody = document.getElementById('calendarViewDeleteRepeatBody');
        if (!modal || !eventId) return;
        const recurring = calendarViewIsRecurring(detail);
        deleteState = {
            eventId: eventId,
            recurring: recurring,
            occurrenceDate: calendarViewOccurrenceDate(detail),
            options: options || {}
        };
        if (message) message.textContent = recurring ? '반복 일정입니다. 삭제할 범위를 선택해 주세요.' : '이 일정을 정말 삭제하시겠습니까?';
        if (repeatBody) repeatBody.hidden = !recurring;
        const oneRadio = modal.querySelector('input[name="calendarViewDeleteScope"][value="ONE"]');
        if (oneRadio) oneRadio.checked = true;
        modal.hidden = false;
    }

    function closeDeleteModal() {
        const modal = document.getElementById('calendarViewDeleteModal');
        if (modal) modal.hidden = true;
    }

    function performDelete() {
        if (!deleteState || !deleteState.eventId) return;
        const scope = deleteState.recurring ? getDeleteScope() : 'ONE';
        const params = new URLSearchParams();
        params.set('eventId', deleteState.eventId);
        params.set('deleteScope', scope);
        params.set('deleteSeries', scope === 'ALL' ? 'Y' : 'N');
        if (deleteState.occurrenceDate) params.set('occurrenceDate', deleteState.occurrenceDate);
        fetch(contextPath() + '/api/calendar/delete?' + params.toString(), {
            method: 'DELETE',
            credentials: 'same-origin'
        }).then(function(response) {
            if (!response.ok) throw new Error('일정을 삭제하지 못했습니다.');
            return response.text();
        }).then(function() {
            const options = deleteState.options || {};
            closeDeleteModal();
            close();
            deleteState = null;
            if (typeof options.onDeleted === 'function') options.onDeleted();
            document.dispatchEvent(new CustomEvent('moyo:calendar-event-deleted', {
                detail: { eventId: deleteState?.eventId || '' }
            }));
        }).catch(function(error) {
            alert(error && error.message ? error.message : '일정을 삭제하지 못했습니다.');
        });
    }

    function init() {
        if (initialized) return;
        initialized = true;

        const closeBtn = document.getElementById('calendarViewClose');
        if (closeBtn) closeBtn.addEventListener('click', close);

        const modal = document.getElementById('calendarViewModal');
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) close();
            });
        }

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeDeleteModal();
                close();
            }
        });

        document.querySelectorAll('[data-calendar-view-delete-close]').forEach(function(btn) {
            btn.addEventListener('click', closeDeleteModal);
        });

        const deleteModal = document.getElementById('calendarViewDeleteModal');
        if (deleteModal) {
            deleteModal.addEventListener('click', function(event) {
                if (event.target === deleteModal) closeDeleteModal();
            });
        }

        const confirmBtn = document.getElementById('calendarViewDeleteConfirm');
        if (confirmBtn) confirmBtn.addEventListener('click', performDelete);

        initCalendarRecordModal();
        const recordButton = document.getElementById('calendarViewRecordBtn');
        if (recordButton) recordButton.addEventListener('click', function() { openCalendarRecordViewer('NOTE'); });
        const attendeeMoreButton = document.getElementById('calendarViewAttendeeMore');
        if (attendeeMoreButton) attendeeMoreButton.addEventListener('click', toggleCalendarViewAttendeeList);

        const recordCounts = document.getElementById('calendarViewRecordCounts');
        if (recordCounts) {
            recordCounts.addEventListener('click', function(event) {
                const shortcut = event.target.closest('[data-calendar-record-type]');
                if (!shortcut) return;
                openCalendarRecordViewer(shortcut.dataset.calendarRecordType);
            });
        }

        document.addEventListener('click', function(event) {
            const opener = event.target && event.target.closest ? event.target.closest('[data-open-calendar-event-preview], [data-open-calendar-event-detail]') : null;
            if (opener) {
                const eventId = opener.dataset.openCalendarEventPreview || opener.dataset.openCalendarEventDetail || opener.dataset.eventId || '';
                if (eventId) {
                    event.preventDefault();
                    open(eventId, { source: opener.dataset.previewSource || 'profile', showActions: true });
                    return;
                }
            }

            const mapButton = event.target && event.target.closest ? event.target.closest('.moyo-event-view-map-link') : null;
            if (!mapButton) return;
            const query = mapButton.dataset.mapQuery || '';
            const url = calendarViewMapExternalUrl(query);
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
        });
    }

    function getDeleteScope() {
        const checked = document.querySelector('input[name="calendarViewDeleteScope"]:checked');
        return checked ? checked.value : 'ONE';
    }

    function getDisplayType(type, props) {
        const normalized = String(type || '').toUpperCase();
        if (normalized === 'HOLIDAY') return 'HOLIDAY';
        if (normalized === 'MOYO') return 'PRIVATE';
        if (normalized === 'FRIEND') return 'FRIEND';
        if (normalized === 'WS' || normalized === 'WORKSPACE' || normalized === 'GROUP') return 'WS';
        if (normalized === 'PROJ' || normalized === 'PROJECT') return 'PROJ';
        if (normalized === 'TASK') {
            if (props && (props.projId || props.PROJ_ID)) return 'PROJ';
            if (props && (props.wsId || props.WS_ID)) return 'WS';
        }
        return 'PRIVATE';
    }

    function isMoyoSharedEvent(props) {
        if (!props) return false;
        const visibility = String(props.visibilityType || props.VISIBILITY_TYPE || props.visibility || props.VISIBILITY || props.shareScope || props.SHARE_SCOPE || props.publicScope || props.PUBLIC_SCOPE || '').toUpperCase();
        const publicFlag = String(props.moyoPublicYn || props.MOYO_PUBLIC_YN || props.isMoyoPublic || props.IS_MOYO_PUBLIC || props.moyoYn || props.MOYO_YN || '').toUpperCase();
        const itemType = String(props.itemType || props.ITEM_TYPE || props.type || props.TYPE || '').toUpperCase();
        const isPrivateValue = String(props.isPrivate || props.IS_PRIVATE || '').toUpperCase();
        return visibility === 'MOYO' || visibility === 'MOYO_PUBLIC' || visibility === 'PUBLIC_MOYO' || publicFlag === 'Y' || publicFlag === 'TRUE' || (itemType === 'PRIVATE' && isPrivateValue === 'N');
    }

    function isReceivedPrivateCalendarEvent(props) {
        if (!props) return false;
        const itemType = String(props.itemType || props.ITEM_TYPE || props.type || props.TYPE || '').toUpperCase();
        const displayType = getDisplayType(itemType || 'PRIVATE', props);
        if (displayType !== 'PRIVATE') return false;
        const relation = String(props.shareRelation || props.SHARE_RELATION || '').toUpperCase();
        const shareStatus = String(props.shareStatus || props.SHARE_STATUS || '').toUpperCase();
        const shareId = props.shareId || props.SHARE_ID || props.receivedShareId || props.RECEIVED_SHARE_ID;
        const ownerYn = String(props.ownerYn || props.OWNER_YN || '').toUpperCase();
        const canEditYn = String(props.canEditYn || props.CAN_EDIT_YN || '').toUpperCase();
        return ownerYn !== 'Y' && (relation || shareStatus || shareId || canEditYn === 'Y');
    }

    function calendarViewOwnerId(detail) {
        return getDetailValue(detail, 'ownerId', 'OWNER_ID', 'userId', 'USER_ID', 'writerId', 'WRITER_ID', 'creatorId', 'CREATOR_ID', 'authorId', 'AUTHOR_ID') || '';
    }

    function calendarViewOwnerName(detail) {
        return getDetailValue(detail, 'ownerName', 'OWNER_NAME', 'writerName', 'WRITER_NAME', 'creatorName', 'CREATOR_NAME', 'userName', 'USER_NAME', 'name', 'NAME') || '';
    }

    function calendarViewOwnerImage(detail) {
        return getDetailValue(detail, 'ownerProfileImagePath', 'OWNER_PROFILE_IMAGE_PATH', 'ownerImagePath', 'OWNER_IMAGE_PATH', 'writerProfileImagePath', 'WRITER_PROFILE_IMAGE_PATH', 'writerImagePath', 'WRITER_IMAGE_PATH', 'creatorProfileImagePath', 'CREATOR_PROFILE_IMAGE_PATH', 'profileImagePath', 'PROFILE_IMAGE_PATH', 'userProfileImagePath', 'USER_PROFILE_IMAGE_PATH', 'userImagePath', 'USER_IMAGE_PATH', 'imagePath', 'IMAGE_PATH') || '';
    }

    function calendarViewOwnerAvatarType(detail) {
        return String(getDetailValue(detail, 'ownerAvatarType', 'OWNER_AVATAR_TYPE', 'profileAvatarType', 'PROFILE_AVATAR_TYPE') || 'DEFAULT').toUpperCase();
    }

    function buildCalendarViewScopeLabel(detail, displayType) {
        const wsName = getDetailValue(detail, 'projectWorkspaceName', 'PROJECT_WORKSPACE_NAME', 'wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME') || '';
        const projName = getDetailValue(detail, 'projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME') || '';
        if (displayType === 'PROJ') return [wsName, projName].filter(Boolean).join(' · ') || '프로젝트 일정';
        if (displayType === 'WS') return wsName || '그룹 일정';
        if (displayType === 'FRIEND') return '친구 일정';
        return '개인 일정';
    }

    function isCalendarViewCompactDetail(detail) {
        const start = formatDetailDateTimeParts(getDetailValue(detail, 'startDt', 'START_DT') || '');
        const end = formatDetailDateTimeParts(getDetailValue(detail, 'endDt', 'END_DT') || '');
        const isAllDay = isDetailAllDayEvent(detail);
        const hasLocation = !!(getDetailValue(detail, 'locationText', 'LOCATION_TEXT') || getDetailValue(detail, 'locationAddress', 'LOCATION_ADDRESS'));
        const hasDescription = !!getDetailValue(detail, 'descriptionText', 'DESCRIPTION_TEXT');
        const attendees = normalizeDetailArray(getDetailValue(detail, 'attendees', 'ATTENDEES'));
        return isAllDay && start.date && start.date === end.date && !hasLocation && !hasDescription && !attendees.length;
    }

    function getCalendarViewTypeMeta(detail) {
        const eventType = String(getDetailValue(detail, 'eventType', 'EVENT_TYPE', 'calendarEventType', 'CALENDAR_EVENT_TYPE') || '').toUpperCase();
        return getCalendarEventTypeMeta(eventType) || { icon: '🗓️', label: '일반' };
    }

    function getCalendarEventTypeMeta(eventType) {
        const key = String(eventType || '').trim().toUpperCase();
        const map = {
            '': { icon: '🗓️', label: '일반' },
            GENERAL: { icon: '🗓️', label: '일반' },
            NORMAL: { icon: '🗓️', label: '일반' },
            DEFAULT: { icon: '🗓️', label: '일반' },
            APPOINTMENT: { icon: '🤝', label: '약속' },
            PROMISE: { icon: '🤝', label: '약속' },
            MEETING: { icon: '👥', label: '회의' },
            DEADLINE: { icon: '🚨', label: '마감' },
            DUE: { icon: '🚨', label: '마감' },
            TASK: { icon: '✅', label: '업무' },
            WORK: { icon: '✅', label: '업무' },
            TODO: { icon: '✅', label: '업무' },
            REMINDER: { icon: '🔔', label: '알림' },
            ALERT: { icon: '🔔', label: '알림' },
            BIRTHDAY: { icon: '🎂', label: '생일' },
            ANNIVERSARY: { icon: '💝', label: '기념일' },
            TRAVEL: { icon: '✈️', label: '여행' },
            TRIP: { icon: '✈️', label: '여행' },
            MEAL: { icon: '🍽️', label: '식사' },
            FOOD: { icon: '🍽️', label: '식사' },
            CAFE: { icon: '☕', label: '카페' },
            COFFEE: { icon: '☕', label: '카페' },
            HOSPITAL: { icon: '🏥', label: '병원' },
            HEALTH: { icon: '🏥', label: '병원' }
        };
        return map[key] || map.GENERAL;
    }

    function buildRepeatSummary(detail) {
        if (getDetailValue(detail, 'isRecurring', 'IS_RECURRING') !== 'Y') return '';
        const type = String(getDetailValue(detail, 'recurType', 'RECUR_TYPE') || '').toUpperCase();
        const interval = Number(getDetailValue(detail, 'recurInterval', 'RECUR_INTERVAL') || 1) || 1;
        const until = getDetailValue(detail, 'untilDt', 'UNTIL_DT') || '';
        const names = { DAILY: '매일', WEEKLY: '매주', MONTHLY: '매월', YEARLY: '매년' };
        let label = names[type] || '반복';
        if (interval > 1) label = interval + '주기 ' + label;
        if (type === 'WEEKLY') {
            const days = String(getDetailValue(detail, 'recurDays', 'RECUR_DAYS') || '').split(',').map(function(day) {
                return ({ MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일' })[String(day).trim().toUpperCase()] || '';
            }).filter(Boolean);
            if (days.length) label += ' ' + days.join('·') + '요일';
        }
        return until ? label + ' · ' + until + '까지' : label;
    }

    function isDetailAllDayEvent(detail) {
        const explicit = String(getDetailValue(detail, 'allDay', 'ALL_DAY', 'allDayYn', 'ALL_DAY_YN') || '').toUpperCase();
        if (explicit === 'Y' || explicit === 'TRUE' || explicit === '1') return true;
        if (explicit === 'N' || explicit === 'FALSE' || explicit === '0') return false;
        const start = formatDetailDateTimeParts(getDetailValue(detail, 'startDt', 'START_DT') || '');
        const end = formatDetailDateTimeParts(getDetailValue(detail, 'endDt', 'END_DT') || '');
        return start.time === '00:00' && (end.time === '23:59' || end.time === '23:59:59');
    }

    function formatDetailDateTimeParts(value) {
        if (!value) return { date: '-', ampm: '', time: '-' };
        const normalized = String(value).replace('T', ' ');
        const match = normalized.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
        if (!match) return { date: normalized, ampm: '', time: '' };
        const hour = Number(match[2]);
        return { date: match[1], ampm: hour < 12 ? '오전' : '오후', time: match[2] + ':' + match[3] };
    }

    function formatTimezoneLabel(value) {
        if (!value) return '서울(GMT+09:00)';
        if (value === 'Asia/Seoul') return '서울(GMT+09:00)';
        return value;
    }

    function calendarViewIsRecurring(detail) {
        return getDetailValue(detail, 'isRecurring', 'IS_RECURRING') === 'Y'
            || !!getDetailValue(detail, 'recurGroupId', 'RECUR_GROUP_ID')
            || !!getDetailValue(detail, 'recurType', 'RECUR_TYPE');
    }

    function calendarViewOccurrenceDate(detail) {
        const value = getDetailValue(detail, 'occurrenceDate', 'OCCURRENCE_DATE') || getDetailValue(detail, 'startDt', 'START_DT') || '';
        const match = String(value).replace('T', ' ').match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : '';
    }

    function calendarViewMapExternalUrl(query) {
        const encoded = encodeURIComponent(String(query || '').trim());
        return encoded ? 'https://www.google.com/maps/search/?api=1&query=' + encoded : '';
    }

    function calendarViewAttendeeName(item) {
        return item.userName || item.USER_NAME || item.wsName || item.WS_NAME || item.projName || item.PROJ_NAME || item.name || item.NAME || item.email || item.EMAIL || '참석자';
    }

    function calendarViewAttendeeUserId(item) {
        return item.userId || item.USER_ID || item.memberId || item.MEMBER_ID || item.attendeeUserId || item.ATTENDEE_USER_ID || item.targetUserId || item.TARGET_USER_ID || '';
    }

    function bindAttendeeProfileLinks(box, detail) {
        box.querySelectorAll('.moyo-attendee-chip.is-profile-link[data-profile-user-id]').forEach(function(chip) {
            const userId = chip.getAttribute('data-profile-user-id');
            if (!userId) return;
            chip.onclick = function(event) {
                event.preventDefault();
                event.stopPropagation();
                openCalendarScopedUserProfile(userId, detail);
            };
            chip.onkeydown = function(event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                openCalendarScopedUserProfile(userId, detail);
            };
        });
    }

    function calendarViewAttendeeImage(item) {
        return item.imagePath || item.IMAGE_PATH || item.profileImagePath || item.PROFILE_IMAGE_PATH || item.userImagePath || item.USER_IMAGE_PATH || item.wsImagePath || item.WS_IMAGE_PATH || item.groupImagePath || item.GROUP_IMAGE_PATH || '';
    }

    function calendarViewAttendeeTypeClass(item) {
        const type = String(item.type || item.TYPE || item.attendeeType || item.ATTENDEE_TYPE || item.targetType || item.TARGET_TYPE || '').toUpperCase();
        const parentType = String(item.parentType || item.PARENT_TYPE || item.scopeType || item.SCOPE_TYPE || '').toUpperCase();
        if (type === 'WS' || type === 'WORKSPACE' || type === 'GROUP') return 'note-share-type-ws';
        if (type === 'PROJ' || type === 'PROJECT') return 'note-share-type-proj';
        if (parentType === 'WS' || parentType === 'WORKSPACE' || parentType === 'GROUP') return 'note-share-type-user note-share-scope-ws-member';
        if (parentType === 'PROJ' || parentType === 'PROJECT') return 'note-share-type-user note-share-scope-proj-member';
        return 'note-share-type-user';
    }

    function calendarViewAttendeeAvatar(item, name) {
        const typeClass = calendarViewAttendeeTypeClass(item);
        const rawImagePath = calendarViewAttendeeImage(item);
        const avatarType = String(item.profileAvatarType || item.PROFILE_AVATAR_TYPE || item.avatarType || item.AVATAR_TYPE || 'DEFAULT').toUpperCase();
        const imagePath = avatarType === 'IMAGE' && isMoyoPersonProfileImage(rawImagePath)
            ? normalizeImagePath(rawImagePath)
            : '';
        if (imagePath) {
            return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + '"><img src="' + escapeHtml(imagePath) + '" alt="" loading="lazy" decoding="async" onload="window.CommonMemberWidget&&CommonMemberWidget.applyAvatarImagePolicy(this)" onerror="window.CommonMemberWidget?CommonMemberWidget.handleAvatarError(this):this.remove()"></span>';
        }
        return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + ' is-fallback"><b>' + escapeHtml(String(name || '?').slice(0, 1)) + '</b></span>';
    }

    function isMoyoPersonProfileImage(path) {
        if (!path) return false;
        const value = String(path).trim();
        if (!value) return false;
        // 현재 MOYO 사람 프로필 이미지는 사용자/그룹 프로필 업로드 경로만 사용한다.
        // 과거 기본 인물 이미지(/images/... 등)는 실제 사용자 사진으로 취급하지 않는다.
        return /(?:^|\/)uploads\/(?:users|workspace)\//i.test(value);
    }

    function normalizeImagePath(path) {
        if (!path) return '';
        const value = String(path).trim();
        if (!value) return '';
        if (/^(https?:)?\/\//i.test(value) || value.indexOf('data:') === 0) return value;
        if (value.charAt(0) === '/') return value;
        return contextPath() + '/' + value.replace(/^\/+/, '');
    }

    function normalizeDetailArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getDetailValue(obj) {
        if (!obj) return '';
        for (let i = 1; i < arguments.length; i += 1) {
            const key = arguments[i];
            if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) return obj[key];
        }
        return '';
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '';
    }

    function hexToRgba(hex, alpha) {
        const value = String(hex || '').replace('#', '').trim();
        if (value.length !== 6) return 'rgba(63, 124, 255, ' + alpha + ')';
        const r = parseInt(value.slice(0, 2), 16);
        const g = parseInt(value.slice(2, 4), 16);
        const b = parseInt(value.slice(4, 6), 16);
        if ([r, g, b].some(function(num) { return Number.isNaN(num); })) return 'rgba(63, 124, 255, ' + alpha + ')';
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    window.MoyoCalendarEventPreview = {
        open: open,
        close: close,
        init: init,
        fetchEventDetail: fetchEventDetail
    };

    document.addEventListener('DOMContentLoaded', init);
})(window, document);
