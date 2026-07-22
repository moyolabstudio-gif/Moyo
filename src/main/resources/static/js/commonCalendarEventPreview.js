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

    function contextPath() {
        return window.MOYO_CALENDAR_CONTEXT_PATH
            || document.querySelector('[data-context-path]')?.dataset.contextPath
            || document.body?.dataset.contextPath
            || '';
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
        renderTypeIcon(detail);
        hideKicker();
        renderMoyoBadge(false);
        renderAuthor(detail, displayType, isMoyoPublic);
        renderTime(detail);
        renderLocation(detail);
        renderAttendees(detail);
        renderDescription(detail);
        setupEditButton(eventId, canEdit, options);
        setupDeleteButton(detail, eventId, canDelete, options);
        setupShareButton(detail, eventId, options);

        modal.hidden = false;
        document.body.classList.add('moyo-event-view-open');
    }

    function close() {
        const modal = document.getElementById('calendarViewModal');
        if (modal) modal.hidden = true;
        document.body.classList.remove('moyo-event-view-open');
    }

    function renderTypeIcon(detail) {
        const typeMeta = getCalendarViewTypeMeta(detail);
        const typeIconEl = document.getElementById('calendarViewTypeIcon');
        if (!typeIconEl) return;
        typeIconEl.textContent = typeMeta.icon;
        typeIconEl.setAttribute('title', typeMeta.label + ' 일정');
        typeIconEl.setAttribute('aria-label', typeMeta.label + ' 일정');
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

    function renderAuthor(detail, displayType, isMoyoPublic) {
        const row = document.getElementById('calendarViewAuthorRow');
        const avatar = document.getElementById('calendarViewAuthorAvatar');
        const nameEl = document.getElementById('calendarViewAuthorName');
        const scopeEl = document.getElementById('calendarViewAuthorScope');
        if (!row || !avatar || !nameEl || !scopeEl) return;

        const ownerName = calendarViewOwnerName(detail) || '작성자';
        const ownerImage = normalizeImagePath(calendarViewOwnerImage(detail));
        const ownerId = calendarViewOwnerId(detail);
        const scopeLabel = buildCalendarViewScopeLabel(detail, displayType);
        const showMoyoScope = isMoyoPublic && (displayType === 'PRIVATE' || displayType === 'FRIEND');
        const authorMain = row.querySelector('.moyo-event-view-author-main');

        row.hidden = false;
        nameEl.textContent = ownerName;
        nameEl.title = ownerName;
        scopeEl.classList.toggle('is-moyo-public', showMoyoScope);

        if (authorMain) {
            authorMain.classList.toggle('is-profile-link', !!ownerId);
            authorMain.setAttribute('role', ownerId ? 'link' : 'presentation');
            authorMain.tabIndex = ownerId ? 0 : -1;
            authorMain.onclick = ownerId ? function(event) {
                event.preventDefault();
                event.stopPropagation();
                window.location.href = contextPath() + '/users/profile?userId=' + encodeURIComponent(ownerId);
            } : null;
            authorMain.onkeydown = ownerId ? function(event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                window.location.href = contextPath() + '/users/profile?userId=' + encodeURIComponent(ownerId);
            } : null;
            authorMain.title = ownerId ? ownerName + ' 프로필 보기' : '';
        }

        if (showMoyoScope) {
            scopeEl.innerHTML = '<img src="' + escapeHtml(mascotPath()) + '" alt="" aria-hidden="true"><span class="moyo-public-text">MOYO 공개</span>';
            scopeEl.title = 'MOYO 공개';
        } else {
            scopeEl.textContent = scopeLabel;
            scopeEl.title = scopeLabel;
        }

        if (ownerImage) {
            avatar.innerHTML = '<img src="' + escapeHtml(ownerImage) + '" alt="" loading="lazy">';
            const img = avatar.querySelector('img');
            if (img) {
                img.onerror = function() {
                    avatar.innerHTML = '<b>' + escapeHtml(String(ownerName || '?').slice(0, 1)) + '</b>';
                };
            }
        } else {
            avatar.innerHTML = '<b>' + escapeHtml(String(ownerName || '?').slice(0, 1)) + '</b>';
        }
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
        const chips = [];
        if (isAllDay) chips.push('<span class="moyo-event-view-time-chip all-day">종일</span>');
        chips.push('<span class="moyo-event-view-time-chip">' + escapeHtml(isLunar ? '음력' : '양력') + '</span>');
        chips.push('<span class="moyo-event-view-time-chip">' + escapeHtml(formatTimezoneLabel(timezone)) + '</span>');
        if (repeat) chips.push('<span class="moyo-event-view-time-chip repeat">' + escapeHtml(repeat) + '</span>');

        let periodHtml = '';
        if (isAllDay && start.date === end.date) {
            periodHtml = '<div class="moyo-event-view-time-line start is-all-day-single">'
                + '<span class="time-label">일자</span>'
                + '<strong class="time-main">' + escapeHtml(start.date) + '<span class="time-clock all-day">종일</span></strong>'
                + '</div>';
        } else if (isAllDay) {
            periodHtml = '<div class="moyo-event-view-time-line start is-all-day">'
                + '<span class="time-label">시작</span>'
                + '<strong class="time-main">' + escapeHtml(start.date) + '</strong>'
                + '</div>'
                + '<div class="moyo-event-view-time-line end is-all-day">'
                + '<span class="time-label">종료</span>'
                + '<strong class="time-main">' + escapeHtml(end.date) + '</strong>'
                + '</div>';
        } else {
            periodHtml = '<div class="moyo-event-view-time-line start">'
                + '<span class="time-label">시작</span>'
                + '<strong class="time-main">' + escapeHtml(start.date) + '<span class="time-clock">' + escapeHtml(start.ampm + ' ' + start.time) + '</span></strong>'
                + '</div>'
                + '<div class="moyo-event-view-time-line end">'
                + '<span class="time-label">종료</span>'
                + '<strong class="time-main">' + escapeHtml(end.date) + '<span class="time-clock">' + escapeHtml(end.ampm + ' ' + end.time) + '</span></strong>'
                + '</div>';
        }

        box.innerHTML = '<div class="moyo-event-view-time-list">'
            + '<div class="moyo-event-view-time-period">' + periodHtml + '</div>'
            + '<div class="moyo-event-view-time-meta">' + chips.join('') + '</div>'
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
        if (!box) return;
        const attendees = normalizeDetailArray(getDetailValue(detail, 'attendees', 'ATTENDEES'));
        if (section) section.hidden = !attendees.length;
        if (!attendees.length) {
            box.innerHTML = '';
            return;
        }
        box.innerHTML = attendees.map(function(item) {
            const name = calendarViewAttendeeName(item);
            const typeClass = calendarViewAttendeeTypeClass(item);
            const userId = calendarViewAttendeeUserId(item);
            const linkAttrs = userId
                ? ' data-profile-user-id="' + escapeHtml(userId) + '" role="link" tabindex="0" aria-label="' + escapeHtml(name) + ' 프로필 보기"'
                : '';
            const linkClass = userId ? ' is-profile-link' : '';
            return '<span class="moyo-event-view-person note-share-chip moyo-attendee-chip ' + typeClass + linkClass + '" title="' + escapeHtml(userId ? name + ' 프로필 보기' : name) + '"' + linkAttrs + '>'
                + calendarViewAttendeeAvatar(item, name)
                + '<span class="note-share-chip-name moyo-attendee-chip-name" title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</span>'
                + '</span>';
        }).join('');
        bindAttendeeProfileLinks(box);
    }

    function renderDescription(detail) {
        const section = document.getElementById('calendarViewDescriptionSection');
        const box = document.getElementById('calendarViewDescription');
        if (!box) return;
        const text = getDetailValue(detail, 'descriptionText', 'DESCRIPTION_TEXT') || '';
        if (section) section.hidden = !text;
        box.textContent = text;
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
        shareBtn.hidden = true;
        shareBtn.onclick = null;
        if (!eventId || options.showActions === false) return;

        const hiddenOpen = document.getElementById('calendarViewShareOpenHidden');
        const modal = document.getElementById('calendarViewShareModal');
        if (!hiddenOpen || !modal) return;

        const ownerYn = getDetailValue(detail, 'ownerYn', 'OWNER_YN') === 'Y';
        const canEdit = getDetailValue(detail, 'canEditYn', 'CAN_EDIT_YN') === 'Y';
        const relation = String(getDetailValue(detail, 'shareRelation', 'SHARE_RELATION') || 'NORMAL').toUpperCase();
        const shareStatus = String(getDetailValue(detail, 'shareStatus', 'SHARE_STATUS') || '').toUpperCase();
        const shareId = String(getDetailValue(detail, 'shareId', 'SHARE_ID') || '').trim();
        const receivedShare = !ownerYn && (relation !== 'NORMAL' && relation !== 'OWNER' || !!shareId || shareStatus === 'ACCEPTED' || shareStatus === 'PENDING' || canEdit);
        const visible = ownerYn || receivedShare;
        if (!visible) return;

        const readonlyShare = !ownerYn;
        function syncDataset() {
            hiddenOpen.dataset.shareContentId = String(eventId);
            hiddenOpen.dataset.readonlyShare = readonlyShare ? 'true' : 'false';
            hiddenOpen.dataset.shareRelation = relation;
            hiddenOpen.dataset.shareStatus = shareStatus;
            hiddenOpen.dataset.shareId = shareId;
            modal.dataset.contentId = String(eventId);
            modal.dataset.readonlyShare = readonlyShare ? 'true' : 'false';
            modal.dataset.shareRelation = relation;
            modal.dataset.shareStatus = shareStatus;
            modal.dataset.shareId = shareId;
            modal.classList.toggle('is-calendar-received-share', readonlyShare);
        }

        syncDataset();
        shareBtn.hidden = false;
        shareBtn.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();
            syncDataset();
            hiddenOpen.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        };
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

    function bindAttendeeProfileLinks(box) {
        box.querySelectorAll('.moyo-attendee-chip.is-profile-link[data-profile-user-id]').forEach(function(chip) {
            const userId = chip.getAttribute('data-profile-user-id');
            if (!userId) return;
            chip.onclick = function(event) {
                event.preventDefault();
                event.stopPropagation();
                window.location.href = contextPath() + '/users/profile?userId=' + encodeURIComponent(userId);
            };
            chip.onkeydown = function(event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                window.location.href = contextPath() + '/users/profile?userId=' + encodeURIComponent(userId);
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
        const imagePath = normalizeImagePath(calendarViewAttendeeImage(item));
        if (imagePath) {
            return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + '"><img src="' + escapeHtml(imagePath) + '" alt=""></span>';
        }
        return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + ' is-fallback"><b>' + escapeHtml(String(name || '?').slice(0, 1)) + '</b></span>';
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
