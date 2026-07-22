let sessionUserId, calendar;

    document.addEventListener('DOMContentLoaded', function() {
        const contextPath = window.MOYO_CALENDAR_CONTEXT_PATH || '';
        const moyoMascotPath = contextPath + '/brand/moyo_mark.png?v=moyo-mark-v34';
        sessionUserId = window.MOYO_CALENDAR_SESSION_USER_ID || '';
        const currentUserMeta = {
            id: sessionUserId,
            name: '나',
            image: ''
        };
        resolveCurrentUserMetaFromPage();

        const state = {
            scope: 'ALL',
            targetId: 'ALL',
            selection: createCalendarSelection('ALL'),
            selectedDate: new Date(),
            userSpaces: { workspaces: [], projects: [] },
            friends: [],
            allScopeFilters: {
                PRIVATE: true,
                FRIEND: true,
                MOYO_PUBLIC: true,
                WS: true,
                PROJ: true
            },
            allTypeFilters: {},
            projectDisplayFilters: {
                PROJECT_PERIOD: true,
                PROJECT_EVENT: true,
                MILESTONE: true,
                TASK_DUE: true,
                TASK_ASSIGNED: true
            },
            projectTaskFilter: {
                assigneeMode: 'ALL',
                assigneeId: 'ALL',
                status: 'ALL',
                showSchedule: true,
                showTask: true
            },
            searchKeyword: '',
            calendarSourceEvents: []
        };


        function createCalendarSelection(scope) {
            return {
                scope: String(scope || 'ALL').toUpperCase(),
                friendId: null,
                wsId: null,
                projectScope: null,
                projId: null,
                label: ''
            };
        }

        function setCalendarSelectionScope(scope) {
            const nextScope = String(scope || 'ALL').toUpperCase();
            state.selection = createCalendarSelection(nextScope);
            state.scope = nextScope;
            state.targetId = 'ALL';
        }

        function normalizeSelectionId(value) {
            if (value == null || value === '' || String(value).toUpperCase() === 'ALL') return null;
            return String(value);
        }

        function normalizeProjectScope(value) {
            const scope = String(value || '').toUpperCase();
            return scope === 'PERSONAL' || scope === 'GROUP' ? scope : null;
        }

        function getLegacyTargetId(selection) {
            const current = selection || state.selection || createCalendarSelection(state.scope);
            if (current.scope === 'FRIEND') return current.friendId || 'ALL';
            if (current.scope === 'WS') return current.wsId || 'ALL';
            if (current.scope === 'PROJ') return current.projId || 'ALL';
            return 'ALL';
        }

        function getSelectedTargetId() {
            return getLegacyTargetId(state.selection);
        }

        function setCalendarSelectionTarget(target) {
            const current = state.selection || createCalendarSelection(state.scope);
            const next = Object.assign(createCalendarSelection(state.scope), current, target || {});
            next.scope = String(state.scope || next.scope || 'ALL').toUpperCase();

            if (next.scope === 'FRIEND') {
                next.friendId = normalizeSelectionId(next.friendId);
            } else if (next.scope === 'WS') {
                next.wsId = normalizeSelectionId(next.wsId);
            } else if (next.scope === 'PROJ') {
                next.projectScope = normalizeProjectScope(next.projectScope);
                next.wsId = normalizeSelectionId(next.wsId);
                next.projId = normalizeSelectionId(next.projId);
                if (next.projectScope === 'PERSONAL') next.wsId = null;
            }

            state.selection = next;
            state.targetId = getLegacyTargetId(next);
        }

        function inferProjectScope(project) {
            if (!project) return null;
            const explicit = normalizeProjectScope(project.projectScope || project.PROJECT_SCOPE || project.projScope || project.PROJ_SCOPE);
            if (explicit) return explicit;
            const wsId = project.wsId || project.WS_ID || project.workspaceId || project.WORKSPACE_ID;
            return wsId ? 'GROUP' : 'PERSONAL';
        }

        function syncSelectionFromLegacyTarget(targetId, item) {
            const normalized = normalizeSelectionId(targetId);
            if (state.scope === 'FRIEND') {
                setCalendarSelectionTarget({ friendId: normalized, label: item ? item.name || '' : '' });
                return;
            }
            if (state.scope === 'WS') {
                setCalendarSelectionTarget({ wsId: normalized, label: item ? item.name || '' : '' });
                return;
            }
            if (state.scope === 'PROJ') {
                const project = item && item.raw ? item.raw : findProjectMetaById(normalized);
                setCalendarSelectionTarget({
                    projectScope: project ? inferProjectScope(project) : null,
                    wsId: project ? (project.wsId || project.WS_ID || project.workspaceId || project.WORKSPACE_ID || null) : null,
                    projId: normalized,
                    label: item ? item.name || '' : ''
                });
                return;
            }
            setCalendarSelectionTarget({});
        }


        function getCalendarScopeSelectorFriends() {
            return (state.friends || []).map(function(friend) {
                const name = friend.userName || friend.friendName || friend.name || friend.email || '이름 없음';
                return {
                    id: friend.friendId || friend.userId || friend.id || friend.USER_ID,
                    name: name,
                    image: friend.profileImagePath || friend.PROFILE_IMAGE_PATH || friend.profileImage || friend.avatarUrl || '',
                    meta: friend.email || ''
                };
            }).filter(function(item) { return item.id && friendHasVisibleCalendarEvent(item.id); });
        }

        function getCalendarScopeSelectorWorkspaces() {
            return (state.userSpaces.workspaces || []).map(function(item) {
                return {
                    id: item.wsId || item.WS_ID || item.workspaceId || item.WORKSPACE_ID || item.groupId || item.GROUP_ID || item.id || item.ID,
                    name: item.wsName || item.WS_NAME || item.workspaceName || item.WORKSPACE_NAME || item.groupName || item.GROUP_NAME || item.name || item.NAME || '이름 없음',
                    image: item.wsImagePath || item.WS_IMAGE_PATH || item.workspaceImagePath || item.WORKSPACE_IMAGE_PATH || item.imagePath || item.IMAGE_PATH || item.profileImagePath || item.PROFILE_IMAGE_PATH || ''
                };
            }).filter(function(item) { return item.id; });
        }

        function getCalendarScopeSelectorProjects() {
            return (state.userSpaces.projects || []).map(function(item) {
                return {
                    id: item.projId || item.PROJ_ID || item.projectId || item.PROJECT_ID || item.id || item.ID,
                    name: item.projName || item.PROJ_NAME || item.projectName || item.PROJECT_NAME || item.name || item.NAME || '이름 없음',
                    wsId: item.wsId || item.WS_ID || item.workspaceId || item.WORKSPACE_ID || item.groupId || item.GROUP_ID || null,
                    projectScope: inferProjectScope(item),
                    status: item.projStatus || item.PROJ_STATUS || item.projectStatus || item.PROJECT_STATUS || item.status || item.STATUS || '',
                    completed: item.completed === true || item.isCompleted === true,
                    completedYn: item.completedYn || item.COMPLETED_YN || item.completeYn || item.COMPLETE_YN || ''
                };
            }).filter(function(item) { return item.id; });
        }

        function applyCalendarScopeSelection(selection) {
            setCalendarSelectionTarget(selection || {});
            renderTargetFilters();
            renderProjectSummary();
            renderProjectTaskFilter();
            renderAllProjectOverview();
            calendar.refetchEvents();
            renderSelectedDatePanel();
        }

        function openCalendarTargetModal() {
            if (state.scope === 'ALL' || state.scope === 'PRIVATE') return;
            if (!window.MoyoScopeSelector || typeof window.MoyoScopeSelector.open !== 'function') {
                console.error('공통 대상 선택 모달 스크립트를 불러오지 못했습니다.');
                return;
            }
            window.MoyoScopeSelector.open({
                scope: state.scope,
                selection: Object.assign({}, state.selection),
                friends: getCalendarScopeSelectorFriends(),
                workspaces: getCalendarScopeSelectorWorkspaces(),
                projects: getCalendarScopeSelectorProjects(),
                contextLabel: '일정',
                imageResolver: normalizeImagePath,
                onSelect: applyCalendarScopeSelection
            });
        }

        function matchesProjectSelection(props) {
            const selection = state.selection || {};
            if (selection.projId) return String(props.projId || props.PROJ_ID || '') === String(selection.projId);
            if (selection.projectScope === 'PERSONAL') return !String(props.wsId || props.WS_ID || '').trim();
            if (selection.projectScope === 'GROUP') {
                const eventWsId = props.wsId || props.WS_ID || props.workspaceId || props.WORKSPACE_ID;
                if (selection.wsId) return String(eventWsId || '') === String(selection.wsId);
                return !!eventWsId;
            }
            return true;
        }

        function isSpecificProjectSelection() {
            return state.scope === 'PROJ' && !!(state.selection && state.selection.projId);
        }

        function resolveCurrentUserMetaFromPage() {
            const nameCandidates = [
                '.moyo-user-name', '.user-name', '.top-user-name', '.header-user-name',
                '[data-current-user-name]', '[data-login-user-name]'
            ];
            for (let i = 0; i < nameCandidates.length; i += 1) {
                const el = document.querySelector(nameCandidates[i]);
                const value = el ? (el.getAttribute('data-current-user-name') || el.getAttribute('data-login-user-name') || el.textContent || '').trim() : '';
                if (value) {
                    currentUserMeta.name = value;
                    break;
                }
            }
            const imageCandidates = [
                '.moyo-user-avatar img', '.user-avatar img', '.top-user-avatar img', '.header-user-avatar img',
                '[data-current-user-avatar]', '[data-login-user-avatar]'
            ];
            for (let i = 0; i < imageCandidates.length; i += 1) {
                const el = document.querySelector(imageCandidates[i]);
                const value = el ? (el.getAttribute('src') || el.getAttribute('data-current-user-avatar') || el.getAttribute('data-login-user-avatar') || '').trim() : '';
                if (value) {
                    currentUserMeta.image = value;
                    break;
                }
            }
        }

        const typeColors = {
            PRIVATE: '#3f7cff',
            FRIEND: '#f6b642',
            MOYO: '#45cfd0',
            WS: '#55d8c6',
            PROJ: '#8b63f6',
            HOLIDAY: '#ff6b6b',
            TASK: '#3f7cff'
        };


        let calendarViewDeleteState = null;

        const calendarEl = document.getElementById('moyoCalendar');

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            headerToolbar: false,
            selectable: true,
            editable: false,
            height: '100%',
            contentHeight: '100%',
            fixedWeekCount: false,
            handleWindowResize: true,
            windowResizeDelay: 120,
            dayMaxEventRows: 6,
            moreLinkClick: function(arg) {
                setTimeout(function() {
                    renderProjectPeriodsInMorePopover(arg && arg.date);
                }, 0);
                setTimeout(function() {
                    renderProjectPeriodsInMorePopover(arg && arg.date);
                }, 80);
                return 'popover';
            },
            nowIndicator: true,
            navLinks: false,
            expandRows: true,
            slotMinTime: '06:00:00',
            slotMaxTime: '24:00:00',
            eventOrder: compareCalendarEvents,
            dayCellContent: function(arg) {
                return { html: '<span>' + arg.date.getDate() + '</span>' };
            },
            dayCellDidMount: function() {
                renderProjectPeriodStatusSoon();
                renderAllProjectOverview();
            },
            eventClassNames: function(arg) {
                const props = arg.event.extendedProps || {};
                const type = props.displayType || getDisplayType(props.type, props);
                const classes = ['moyo-event-' + type];
                const projectKind = getProjectCalendarKind(props);
                if (projectKind) classes.push('moyo-project-kind-' + projectKind);
                if (props.isMoyoPublic) classes.push('moyo-public-event');
                if (props.isReceivedPrivateEvent) classes.push('moyo-received-private-event');
                if (!arg.event.allDay && type !== 'HOLIDAY') classes.push('moyo-timed-calendar-event');
                if (arg.event.allDay && type !== 'HOLIDAY' && projectKind !== 'PROJECT_PERIOD') classes.push('moyo-all-day-calendar-event');
                return classes;
            },
            eventContent: function(arg) {
                const props = arg.event.extendedProps || {};
                const type = props.displayType || getDisplayType(props.type, props);
                if (type === 'HOLIDAY') return { html: '' };
                const displayTitle = getCalendarDisplayTitle(arg.event);
                const safeTitle = escapeHtml(displayTitle);
                const projectKind = getProjectCalendarKind(props);
                if (projectKind === 'PROJECT_PERIOD') {
                    const fullPath = getProjectCalendarPathText(props);
                    return { html: '<div class="moyo-fc-event moyo-fc-project-period" title="' + escapeHtml(fullPath || displayTitle) + '"><span class="moyo-fc-event-title">' + safeTitle + '</span></div>' };
                }
                if (projectKind === 'MILESTONE') {
                    return { html: '<div class="moyo-fc-event moyo-fc-project-marker"><span class="moyo-project-marker-icon" aria-hidden="true">◆</span><span class="moyo-fc-event-title">' + safeTitle + '</span></div>' };
                }
                if (projectKind === 'TASK_DUE' || projectKind === 'TASK_ASSIGNED') {
                    const statusInfo = getProjectTaskStatusInfo(props);
                    const assignee = props.assigneeName ? '<span class="moyo-project-task-assignee">' + escapeHtml(props.assigneeName) + '</span>' : '';
                    const delayed = isProjectTaskDelayed(props) ? '<span class="moyo-project-task-delay">지연</span>' : '';
                    return { html: '<div class="moyo-fc-event moyo-fc-task-due is-' + statusInfo.key.toLowerCase() + (isProjectTaskDelayed(props) ? ' is-delayed' : '') + '"><span class="moyo-project-task-status-dot" aria-hidden="true"></span><span class="moyo-fc-event-title">' + safeTitle + '</span>' + assignee + delayed + '</div>' };
                }
                const timePrefix = getCalendarEventTimePrefix(arg.event);
                const eventAvatar = renderCalendarEventAvatar(props, type);
                const eventTypeIcon = renderCalendarEventTypeIcon(props);
                const mascot = arg.event.extendedProps.isMoyoPublic ? '<img class="moyo-event-mascot" src="' + moyoMascotPath + '" alt="MOYO 공개">' : '';
                const avatarClass = eventAvatar ? ' has-owner-avatar' : '';
                return { html: '<div class="moyo-fc-event' + avatarClass + '">' + eventAvatar + '<span class="moyo-fc-event-title">' + timePrefix + safeTitle + '</span>' + eventTypeIcon + mascot + '</div>' };
            },
            eventDidMount: function(info) {
                const props = info.event.extendedProps || {};
                const projectKind = getProjectCalendarKind(props);
                if (projectKind === 'PROJECT_PERIOD') {
                    const periodText = projectPeriodText(info.event);
                    const pathText = getProjectCalendarPathText(props) || getCalendarDisplayTitle(info.event);
                    info.el.setAttribute('title', pathText + (periodText ? '\n프로젝트 기간 · ' + periodText : ''));
                    return;
                }
                const type = props.displayType || getDisplayType(props.type, props);
                if (projectKind === 'TASK_DUE' || projectKind === 'TASK_ASSIGNED') {
                    const statusInfo = getProjectTaskStatusInfo(props);
                    const tooltip = [
                        getCalendarDisplayTitle(info.event),
                        '상태 · ' + statusInfo.label,
                        '담당자 · ' + (props.assigneeName || '미지정'),
                        '예정 · ' + getProjectTaskPeriodText(info.event),
                        '실제 시작 · ' + formatProjectTaskDate(props.actualStartDt),
                        '실제 완료 · ' + formatProjectTaskDate(props.actualDoneDt)
                    ];
                    if (isProjectTaskDelayed(props)) tooltip.push('지연 · ' + Math.max(0, Number(props.delayedDays || 0)) + '일');
                    info.el.setAttribute('title', tooltip.join('\n'));
                }
                if (type === 'HOLIDAY') {
                    info.el.classList.add('moyo-holiday-hidden');
                    const harness = info.el.closest('.fc-daygrid-event-harness');
                    if (harness) harness.classList.add('moyo-holiday-hidden');
                    renderHolidayBadgesSoon();
                }
            },
            datesSet: function(info) {
                updateCalendarTitle(info);
                stabilizeCalendarWidth();
                stabilizeCalendarRows();
                highlightSelectedDate();
                renderSelectedDatePanel();
                renderHolidayBadgesSoon();
                renderProjectPeriodStatusSoon();
            },
            dateClick: function(info) {
                state.selectedDate = parseLocalDate(info.dateStr);
                highlightSelectedDate();
                renderSelectedDatePanel();
                openQuickCreateModal({ startDate: info.dateStr });
            },
            select: function(info) {
                state.selectedDate = info.start;
                highlightSelectedDate();
                renderSelectedDatePanel();
                openQuickCreateModal(getQuickCreateOptionsFromSelection(info));
                calendar.unselect();
            },
            eventClick: function(info) {
                handleEventOpen(info.event);
            },
            events: function(info, successCallback, failureCallback) {
                $.ajax({
                    url: contextPath + '/api/calendar/monthly',
                    type: 'GET',
                    data: getCalendarRequestData(info),
                    success: function(data) {
                        const sourceEvents = (data || []).map(mapServerEvent);
                        state.calendarSourceEvents = sourceEvents;
                        const events = sourceEvents.filter(matchesCalendarDisplayFilter);
                        successCallback(events);
                        setTimeout(function() {
                            renderTargetFilters();
                            stabilizeCalendarRows();
                            highlightSelectedDate();
                            renderSelectedDatePanel();
                            renderHolidayBadgesSoon();
                            renderProjectPeriodStatusSoon();
                            renderProjectSummary();
                            renderProjectTaskFilter();
                            renderAllProjectOverview();
                        }, 0);
                    },
                    error: function(xhr, status, error) {
                        console.error('일정 데이터를 가져오는데 실패했습니다.', error || xhr);
                        failureCallback(error || xhr);
                    }
                });
            }
        });

        calendar.render();
        stabilizeCalendarWidth();
        loadUserSpaces();
        loadFriends();
        renderTargetFilters();
        updateAllFilterButtonVisibility();
        renderProjectSummary();
        renderProjectTaskFilter();
        bindProjectTaskFilter();
        renderSelectedDateHeader();
        bindCalendarViewModal();
        bindCalendarViewDeleteModal();
        initCalendarViewShareModal();
        openEventFromQuery();

        if (window.ResizeObserver) {
            const calendarResizeObserver = new ResizeObserver(function() {
                stabilizeCalendarWidth();
            });
            calendarResizeObserver.observe(document.querySelector('.moyo-calendar-board'));
        }

        window.addEventListener('resize', function() {
            stabilizeCalendarWidth();
        });

        let calendarWheelLocked = false;
        const calendarWheelArea = document.querySelector('.moyo-calendar-board');
        if (calendarWheelArea) {
            calendarWheelArea.addEventListener('wheel', function(event) {
                if (!calendar || event.ctrlKey || event.metaKey) return;

                const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
                if (Math.abs(delta) < 18) return;

                event.preventDefault();
                if (calendarWheelLocked) return;
                calendarWheelLocked = true;

                if (delta > 0) {
                    calendar.next();
                } else {
                    calendar.prev();
                }

                setTimeout(function() {
                    calendarWheelLocked = false;
                }, 420);
            }, { passive: false });
        }

        $('#calendarPrev').on('click', function() { calendar.prev(); });
        $('#calendarNext').on('click', function() { calendar.next(); });
        $('#calendarToday').on('click', function() {
            calendar.today();
            state.selectedDate = new Date();
            highlightSelectedDate();
            renderSelectedDatePanel();
        });

        $('.moyo-chip[data-scope]').on('click', function() {
            setCalendarSelectionScope($(this).data('scope'));
            $('.moyo-chip[data-scope]').removeClass('is-active');
            $(this).addClass('is-active');
            renderTargetFilters();
            updateAllFilterButtonVisibility();
            renderProjectSummary();
            renderProjectTaskFilter();
            calendar.refetchEvents();
        });

        $('#calendarTargetSelectOpen').on('click', openCalendarTargetModal);

        $('#openCreateEvent').on('click', function() {
            window.location.href = buildEventFormUrl();
        });


        const QUICK_EVENT_TYPES = [
            { value: '', icon: '🗓️', label: '일반' },
            { value: 'APPOINTMENT', icon: '🤝', label: '약속' },
            { value: 'MEETING', icon: '👥', label: '회의' },
            { value: 'DEADLINE', icon: '🚨', label: '마감' },
            { value: 'TASK', icon: '✅', label: '업무' },
            { value: 'REMINDER', icon: '🔔', label: '알림' },
            { value: 'BIRTHDAY', icon: '🎂', label: '생일' },
            { value: 'ANNIVERSARY', icon: '💝', label: '기념일' },
            { value: 'TRAVEL', icon: '✈️', label: '여행' },
            { value: 'MEAL', icon: '🍽️', label: '식사' },
            { value: 'CAFE', icon: '☕', label: '카페' },
            { value: 'HOSPITAL', icon: '🏥', label: '병원' },
            { value: 'EXERCISE', icon: '🏃', label: '운동' },
            { value: 'STUDY', icon: '📚', label: '공부' },
            { value: 'PAYMENT', icon: '💳', label: '결제' },
            { value: 'DELIVERY', icon: '🚀', label: '배포' },
            { value: 'CLASS', icon: '🏫', label: '수업' },
            { value: 'EXAM', icon: '📝', label: '시험' },
            { value: 'SHOPPING', icon: '🛒', label: '쇼핑' },
            { value: 'PARCEL', icon: '📦', label: '택배' },
            { value: 'FAMILY', icon: '🏠', label: '가족' },
            { value: 'FRIEND', icon: '👫', label: '친구' },
            { value: 'REST', icon: '🌙', label: '휴식' },
            { value: 'CLEANING', icon: '🧹', label: '청소' },
            { value: 'REPAIR', icon: '🛠️', label: '정비' }
        ];
        const ALL_FILTER_SCOPE_OPTIONS = [
            { key: 'PRIVATE', label: '개인', dot: true },
            { key: 'FRIEND', label: '친구', dot: true },
            { key: 'WS', label: '그룹', dot: true },
            { key: 'PROJ', label: '프로젝트', dot: true },
            { key: 'MOYO_PUBLIC', label: 'MOYO 공개', icon: '<img class="moyo-mascot-tab" src="' + moyoMascotPath + '" alt="" aria-hidden="true">' }
        ];
        const ALL_FILTER_TYPE_OPTIONS = QUICK_EVENT_TYPES.map(function(item) {
            return { key: normalizeCalendarEventTypeKey(item.value), icon: item.icon, label: item.label };
        });
        const PROJECT_DISPLAY_FILTER_OPTIONS = [
            { key: 'PROJECT_PERIOD', label: '프로젝트 기간', icon: '━' },
            { key: 'PROJECT_EVENT', label: '프로젝트 일정', icon: '📌' },
            { key: 'MILESTONE', label: '마일스톤', icon: '◆' },
            { key: 'TASK_DUE', label: '마감 있는 할 일', icon: '✓' },
            { key: 'TASK_ASSIGNED', label: '내 담당 할 일', icon: '👤' }
        ];
        resetAllTypeFilters();
        renderAllFilterMenu();

        let quickCreateEventType = '';
        let quickCreateSaving = false;
        let quickDatePickerMenu = null;
        let quickTimePickerMenu = null;
        let quickActiveDateInput = null;
        let quickActiveDateView = null;
        let quickActiveTimeInput = null;
        let quickActiveTimeState = null;
        const QUICK_DATE_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
        const QUICK_TIME_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

        bindQuickCreateModal();
        bindAllFilterMenu();
        bindCalendarSearch();

        function normalizeCalendarEventTypeKey(value) {
            const raw = String(value == null ? '' : value).trim().toUpperCase();
            return raw || 'GENERAL';
        }

        function getEventTypeFilterKey(props) {
            const rawType = props && (props.eventType || props.calendarEventType || props.EVENT_TYPE || props.CALENDAR_EVENT_TYPE);
            return normalizeCalendarEventTypeKey(rawType);
        }

        function resetAllTypeFilters() {
            state.allTypeFilters = {};
            (ALL_FILTER_TYPE_OPTIONS || []).forEach(function(item) {
                state.allTypeFilters[item.key] = true;
            });
        }

        function resetAllScopeFilters() {
            state.allScopeFilters = {
                PRIVATE: true,
                FRIEND: true,
                MOYO_PUBLIC: true,
                WS: true,
                PROJ: true
            };
        }

        function resetProjectDisplayFilters() {
            state.projectDisplayFilters = {
                PROJECT_PERIOD: true,
                PROJECT_EVENT: true,
                MILESTONE: true,
                TASK_DUE: false,
                TASK_ASSIGNED: false
            };
        }

        function shouldShowProjectDisplayFilterSection() {
            return state.scope === 'ALL' || state.scope === 'PROJ';
        }

        function getVisibleScopeFilterOptions() {
            if (state.scope === 'ALL') return ALL_FILTER_SCOPE_OPTIONS;
            if (state.scope === 'PRIVATE' || state.scope === 'FRIEND') {
                return ALL_FILTER_SCOPE_OPTIONS.filter(function(item) { return item.key === 'MOYO_PUBLIC'; });
            }
            return [];
        }

        function renderAllFilterMenu() {
            const menu = document.getElementById('calendarAllFilterMenu');
            const title = menu ? menu.querySelector('.moyo-filter-title') : null;
            const scopeSection = menu ? menu.querySelector('[data-filter-section="scope"]') : null;
            const scopeLabel = menu ? menu.querySelector('[data-filter-scope-label]') : null;
            const scopeList = document.getElementById('calendarScopeFilterList');
            const typeList = document.getElementById('calendarTypeFilterList');
            const projectSection = menu ? menu.querySelector('[data-filter-section="project-display"]') : null;
            const projectList = document.getElementById('calendarProjectDisplayFilterList');
            const visibleScopes = getVisibleScopeFilterOptions();
            const showProjectFilters = shouldShowProjectDisplayFilterSection();

            if (title) {
                title.textContent = state.scope === 'ALL' ? '전체 필터' : '필터';
            }

            if (scopeSection) {
                scopeSection.hidden = visibleScopes.length === 0;
            }
            if (scopeLabel) {
                scopeLabel.textContent = state.scope === 'ALL' ? '범위' : '공개';
            }

            if (scopeList) {
                scopeList.innerHTML = visibleScopes.map(function(item) {
                    const active = state.allScopeFilters && state.allScopeFilters[item.key];
                    const icon = item.icon ? item.icon : '<span class="moyo-filter-dot" aria-hidden="true"></span>';
                    return '<label class="moyo-filter-check' + (active ? ' is-active' : '') + '" data-filter-scope="' + escapeHtml(item.key) + '">'
                        + '<input type="checkbox"' + (active ? ' checked' : '') + ' aria-label="' + escapeHtml(item.label) + '">'
                        + '<span class="moyo-filter-checkbox-ui" aria-hidden="true"><i class="fa-solid fa-check"></i></span>'
                        + '<span class="moyo-filter-option-icon" aria-hidden="true">' + icon + '</span>'
                        + '<span class="moyo-filter-option-text">' + escapeHtml(item.label) + '</span>'
                        + '</label>';
                }).join('');
            }
            if (typeList) {
                typeList.innerHTML = ALL_FILTER_TYPE_OPTIONS.map(function(item) {
                    const active = state.allTypeFilters && state.allTypeFilters[item.key];
                    return '<button type="button" class="moyo-filter-type-option' + (active ? ' is-active' : '') + '" data-filter-type="' + escapeHtml(item.key) + '" aria-pressed="' + (active ? 'true' : 'false') + '" title="' + escapeHtml(item.label) + '">'
                        + '<span class="moyo-filter-type-icon" aria-hidden="true">' + escapeHtml(item.icon) + '</span>'
                        + '<span class="moyo-filter-type-label">' + escapeHtml(item.label) + '</span>'
                        + '</button>';
                }).join('');
            }
            if (projectSection) {
                projectSection.hidden = !showProjectFilters;
            }
            if (projectList) {
                projectList.innerHTML = showProjectFilters ? PROJECT_DISPLAY_FILTER_OPTIONS.map(function(item) {
                    const active = state.projectDisplayFilters && state.projectDisplayFilters[item.key];
                    return '<label class="moyo-filter-check moyo-project-display-check' + (active ? ' is-active' : '') + '" data-project-display-filter="' + escapeHtml(item.key) + '">'
                        + '<input type="checkbox"' + (active ? ' checked' : '') + ' aria-label="' + escapeHtml(item.label) + '">'
                        + '<span class="moyo-filter-checkbox-ui" aria-hidden="true"><i class="fa-solid fa-check"></i></span>'
                        + '<span class="moyo-filter-option-icon" aria-hidden="true">' + escapeHtml(item.icon) + '</span>'
                        + '<span class="moyo-filter-option-text">' + escapeHtml(item.label) + '</span>'
                        + '</label>';
                }).join('') : '';
            }
        }

        function closeAllFilterMenu() {
            const menu = document.getElementById('calendarAllFilterMenu');
            const btn = document.getElementById('calendarAllFilterBtn');
            if (menu) menu.hidden = true;
            if (btn) {
                btn.classList.remove('is-active');
                btn.setAttribute('aria-expanded', 'false');
            }
        }

        function toggleAllFilterMenu() {
            const menu = document.getElementById('calendarAllFilterMenu');
            const btn = document.getElementById('calendarAllFilterBtn');
            if (!menu || !btn) return;
            const nextOpen = !!menu.hidden;
            menu.hidden = !nextOpen;
            btn.classList.toggle('is-active', nextOpen);
            btn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
            if (nextOpen) renderAllFilterMenu();
        }

        function updateAllFilterButtonVisibility() {
            const btn = document.getElementById('calendarAllFilterBtn');
            if (!btn) return;
            btn.hidden = false;
        }

        function bindAllFilterMenu() {
            $('#calendarAllFilterBtn').on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                toggleAllFilterMenu();
            });
            $('#calendarAllFilterMenu').on('click', function(event) {
                event.stopPropagation();
            });
            $('#calendarAllFilterReset').on('click', function() {
                resetAllScopeFilters();
                resetAllTypeFilters();
                resetProjectDisplayFilters();
                renderAllFilterMenu();
                calendar.refetchEvents();
            });
            $('#calendarAllFilterMenu').on('click', '[data-filter-bulk]', function(event) {
                event.preventDefault();
                const target = $(this).attr('data-filter-bulk');
                const action = $(this).attr('data-filter-action');
                setCalendarFilterBulk(target, action !== 'none');
            });
            $('#calendarScopeFilterList').on('click', '.moyo-filter-check', function(event) {
                event.preventDefault();
                const key = $(this).attr('data-filter-scope');
                if (!key) return;
                state.allScopeFilters[key] = !state.allScopeFilters[key];
                renderAllFilterMenu();
                calendar.refetchEvents();
            });
            $('#calendarTypeFilterList').on('click', '.moyo-filter-type-option', function(event) {
                event.preventDefault();
                const key = $(this).attr('data-filter-type');
                if (!key) return;
                state.allTypeFilters[key] = !state.allTypeFilters[key];
                renderAllFilterMenu();
                calendar.refetchEvents();
            });
            $('#calendarProjectDisplayFilterList').on('click', '.moyo-filter-check', function(event) {
                event.preventDefault();
                const key = $(this).attr('data-project-display-filter');
                if (!key) return;
                state.projectDisplayFilters[key] = !state.projectDisplayFilters[key];
                renderAllFilterMenu();
                calendar.refetchEvents();
            });
            $(document).on('click', closeAllFilterMenu);
        }

        function setCalendarFilterBulk(target, checked) {
            if (target === 'type') {
                Object.keys(state.allTypeFilters || {}).forEach(function(key) { state.allTypeFilters[key] = checked; });
            } else if (target === 'project') {
                PROJECT_DISPLAY_FILTER_OPTIONS.forEach(function(item) { state.projectDisplayFilters[item.key] = checked; });
            } else {
                getVisibleScopeFilterOptions().forEach(function(item) { state.allScopeFilters[item.key] = checked; });
            }
            renderAllFilterMenu();
            calendar.refetchEvents();
        }

        function bindCalendarSearch() {
            const $input = $('#calendarSearchInput');
            const $clear = $('#calendarSearchClear');
            if (!$input.length) return;
            let searchTimer = null;
            const sync = function(value, immediate) {
                state.searchKeyword = normalizeCalendarSearchText(value);
                $clear.toggleClass('is-visible', !!state.searchKeyword);
                clearTimeout(searchTimer);
                searchTimer = setTimeout(function() {
                    calendar.refetchEvents();
                }, immediate ? 0 : 140);
            };
            $input.on('input', function() { sync(this.value, false); });
            $clear.on('click', function() {
                $input.val('').focus();
                sync('', true);
            });
        }

        function bindQuickCreateModal() {
            const modal = document.getElementById('calendarQuickCreateModal');
            const panel = modal ? modal.querySelector('.moyo-quick-create-panel') : null;
            if (!modal || !panel) return;

            renderQuickTypeOptions();
            renderQuickSelectMenus();
            bindQuickDateTimePickers();
            $('#quickCreateClose').on('click', closeQuickCreateModal);
            $('#quickCreateSave').on('click', saveQuickCreateEvent);
            $('#quickCreateDetailBtn').on('click', goQuickCreateDetailForm);
            $('#quickCreateTypeButton').on('click', function(event) {
                event.stopPropagation();
                toggleQuickTypePopover();
            });
            $('#quickCreateTypePopover').on('click', function(event) { event.stopPropagation(); });
            $('#quickCreateTypeClose').on('click', closeQuickTypePopover);
            $('#quickCreateTypeGrid').on('click', '.moyo-quick-type-option', function() {
                setQuickEventType($(this).data('type') || '');
                closeQuickTypePopover();
            });
            $('#quickCreateMoyoToggle').on('click', function() {
                const active = !$(this).hasClass('is-active');
                setQuickMoyoPublic(active);
            });
            $('#quickCreateAllDay').on('change', syncQuickAllDayState);
            $('#quickCreateStartDate, #quickCreateStartTime').on('change', normalizeQuickEndByStart);
            $('#quickCreateEndDate, #quickCreateEndTime').on('change', normalizeQuickEndByStart);
            modal.addEventListener('click', function(event) {
                if (event.target === modal) closeQuickCreateModal();
            });
            panel.addEventListener('click', function(event) {
                const target = event.target;
                if (!target.closest('.moyo-quick-type-wrap')) closeQuickTypePopover();
                if (!target.closest('[data-quick-select-wrap]')) closeQuickSelectMenus();
                if (!target.closest('.moyo-quick-date-field') && !target.closest('.moyo-quick-date-trigger')) closeQuickDatePicker();
                if (!target.closest('.moyo-quick-time-field') && !target.closest('.moyo-quick-time-trigger')) closeQuickTimePicker();
                event.stopPropagation();
            });
            document.addEventListener('keydown', function(event) {
                if (!modal.hidden && event.key === 'Escape') closeQuickCreateModal();
                else if (event.key === 'Escape') closeQuickFloaters();
            });
            document.addEventListener('click', function() {
                closeQuickFloaters();
            });
            window.addEventListener('resize', function() {
                if (quickActiveDateInput) positionQuickDatePicker(quickActiveDateInput);
                if (quickActiveTimeInput) positionQuickTimePicker(quickActiveTimeInput);
            });
            window.addEventListener('scroll', function() {
                if (quickActiveDateInput) positionQuickDatePicker(quickActiveDateInput);
                if (quickActiveTimeInput) positionQuickTimePicker(quickActiveTimeInput);
            }, true);
        }

        function closeQuickFloaters(except) {
            const exceptKey = except || '';
            if (exceptKey !== 'type') closeQuickTypePopover();
            if (exceptKey !== 'date') closeQuickDatePicker();
            if (exceptKey !== 'time') closeQuickTimePicker();
            if (exceptKey.indexOf('select:') === 0) {
                closeQuickSelectMenus(exceptKey.slice(7));
            } else {
                closeQuickSelectMenus();
            }
        }

        function bindQuickDateTimePickers() {
            bindQuickCustomSelectMenus();

            document.querySelectorAll('[data-quick-date-picker]').forEach(function(input) {
                input.addEventListener('focus', function() { openQuickDatePicker(input); });
                input.addEventListener('click', function(event) { event.stopPropagation(); openQuickDatePicker(input); });
                input.addEventListener('blur', function() { setTimeout(function() { normalizeQuickDateInputValue(input); }, 120); });
                input.addEventListener('keydown', function(event) {
                    if (event.key === 'Escape') { closeQuickDatePicker(); input.blur(); }
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        normalizeQuickDateInputValue(input);
                        closeQuickDatePicker();
                        input.blur();
                    }
                });
            });
            document.querySelectorAll('.moyo-quick-date-trigger').forEach(function(button) {
                button.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const input = document.getElementById(button.dataset.quickDateTarget);
                    if (quickDatePickerMenu && !quickDatePickerMenu.hidden && quickActiveDateInput === input) closeQuickDatePicker();
                    else openQuickDatePicker(input);
                    button.blur();
                });
            });
            document.querySelectorAll('[data-quick-time-picker]').forEach(function(input) {
                const fallback = input.id === 'quickCreateEndTime' ? '10:00' : '09:00';
                setQuickTimeInputValue(input, input.dataset.timeValue || input.value || fallback, fallback);
                input.addEventListener('focus', function() { openQuickTimePicker(input); });
                input.addEventListener('click', function(event) { event.stopPropagation(); openQuickTimePicker(input); });
                input.addEventListener('blur', function() { setTimeout(function() { normalizeQuickTimeInputValue(input); }, 120); });
                input.addEventListener('keydown', function(event) {
                    if (event.key === 'Escape') { closeQuickTimePicker(); input.blur(); }
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        normalizeQuickTimeInputValue(input);
                        closeQuickTimePicker();
                        input.blur();
                    }
                });
            });
            document.querySelectorAll('.moyo-quick-time-trigger').forEach(function(button) {
                button.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const input = document.getElementById(button.dataset.quickTimeTarget);
                    if (quickTimePickerMenu && !quickTimePickerMenu.hidden && quickActiveTimeInput === input) closeQuickTimePicker();
                    else openQuickTimePicker(input);
                });
            });
        }


        function renderQuickSelectMenus() {
            document.querySelectorAll('[data-quick-select-wrap]').forEach(function(wrap) {
                const select = wrap.querySelector('select.moyo-quick-select');
                const menu = wrap.querySelector('[data-quick-select-menu]');
                if (!select || !menu) return;
                menu.innerHTML = Array.from(select.options).map(function(option) {
                    return '<button type="button" role="option" data-quick-select-value="' + escapeHtml(option.value || '') + '">' + escapeHtml(option.textContent || '') + '</button>';
                }).join('');
                syncQuickSelectButton(select.id);
            });
        }

        function bindQuickCustomSelectMenus() {
            document.querySelectorAll('[data-quick-select-button]').forEach(function(button) {
                button.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const selectId = button.dataset.quickSelectButton;
                    const menu = document.querySelector('[data-quick-select-menu="' + selectId + '"]');
                    if (!menu) return;
                    const willOpen = menu.hidden;
                    closeQuickFloaters('select:' + selectId);
                    menu.hidden = !willOpen;
                    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                    syncQuickSelectButton(selectId);
                });
            });
            document.querySelectorAll('[data-quick-select-menu]').forEach(function(menu) {
                menu.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const optionBtn = event.target.closest('[data-quick-select-value]');
                    if (!optionBtn) return;
                    const selectId = menu.dataset.quickSelectMenu;
                    const select = document.getElementById(selectId);
                    if (!select) return;
                    select.value = optionBtn.dataset.quickSelectValue || '';
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    syncQuickSelectButton(selectId);
                    closeQuickSelectMenus();
                });
            });
            document.querySelectorAll('.moyo-quick-select').forEach(function(select) {
                select.addEventListener('change', function() {
                    syncQuickSelectButton(select.id);
                });
            });
        }

        function syncQuickSelectButton(selectId) {
            const select = document.getElementById(selectId);
            const button = document.querySelector('[data-quick-select-button="' + selectId + '"]');
            const menu = document.querySelector('[data-quick-select-menu="' + selectId + '"]');
            if (!select || !button) return;
            const selectedOption = select.options[select.selectedIndex] || select.options[0];
            const selectedText = selectedOption ? (selectedOption.textContent || '') : '';
            button.textContent = getQuickSelectButtonLabel(selectId, selectedOption);
            button.title = selectedText;
            if (menu) {
                menu.querySelectorAll('[data-quick-select-value]').forEach(function(optionBtn) {
                    const selected = String(optionBtn.dataset.quickSelectValue || '') === String(select.value || '');
                    optionBtn.classList.toggle('is-selected', selected);
                    optionBtn.setAttribute('aria-selected', selected ? 'true' : 'false');
                });
            }
        }

        function getQuickSelectButtonLabel(selectId, option) {
            if (!option) return '';
            const text = option.textContent || '';
            if (selectId !== 'quickCreateTimezone') return text;
            const value = option.value || '';
            if (!value || value === 'Asia/Seoul') return '서울(GMT+09:00)';
            return text;
        }

        function syncAllQuickSelectButtons() {
            document.querySelectorAll('.moyo-quick-select').forEach(function(select) {
                syncQuickSelectButton(select.id);
            });
        }

        function closeQuickSelectMenus(exceptSelectId) {
            document.querySelectorAll('[data-quick-select-menu]').forEach(function(menu) {
                const selectId = menu.dataset.quickSelectMenu;
                if (exceptSelectId && selectId === exceptSelectId) return;
                menu.hidden = true;
                const button = document.querySelector('[data-quick-select-button="' + selectId + '"]');
                if (button) button.setAttribute('aria-expanded', 'false');
            });
        }

        function parseQuickDateInput(value) {
            const raw = String(value || '').trim();
            const match = raw.match(/^(\d{4})[-.\/년\s]?(\d{1,2})[-.\/월\s]?(\d{1,2})일?$/);
            if (!match) return null;
            const y = Number(match[1]);
            const m = Number(match[2]);
            const d = Number(match[3]);
            if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;
            const test = new Date(y, m - 1, d);
            if (test.getFullYear() !== y || test.getMonth() !== m - 1 || test.getDate() !== d) return null;
            return { year: y, month: m, day: d, value: y + '-' + pad(m) + '-' + pad(d) };
        }

        function getQuickDatePickerState(input) {
            const parsed = parseQuickDateInput(input && input.value) || parseQuickDateInput(formatDateOnly(new Date()));
            return { year: parsed.year, month: parsed.month };
        }

        function ensureQuickDatePickerMenu() {
            if (quickDatePickerMenu) return quickDatePickerMenu;
            quickDatePickerMenu = document.createElement('div');
            quickDatePickerMenu.id = 'quickDatePickerMenu';
            quickDatePickerMenu.className = 'moyo-quick-picker-menu moyo-quick-date-picker-menu';
            quickDatePickerMenu.hidden = true;
            quickDatePickerMenu.addEventListener('click', function(event) {
                event.stopPropagation();
                const nav = event.target.closest('[data-quick-date-nav]');
                const day = event.target.closest('[data-quick-date-value]');
                const today = event.target.closest('[data-quick-date-action="today"]');
                if (!quickActiveDateInput) return;
                if (nav) {
                    const delta = Number(nav.dataset.quickDateNav) || 0;
                    const base = new Date(quickActiveDateView.year, quickActiveDateView.month - 1 + delta, 1);
                    quickActiveDateView = { year: base.getFullYear(), month: base.getMonth() + 1 };
                    renderQuickDatePicker();
                    return;
                }
                if (today) {
                    setQuickDateInputValue(quickActiveDateInput, formatDateOnly(new Date()));
                    closeQuickDatePicker();
                    return;
                }
                if (day) {
                    setQuickDateInputValue(quickActiveDateInput, day.dataset.quickDateValue);
                    closeQuickDatePicker();
                }
            });
            document.body.appendChild(quickDatePickerMenu);
            return quickDatePickerMenu;
        }

        function renderQuickDatePicker() {
            const menu = ensureQuickDatePickerMenu();
            if (!quickActiveDateInput) return;
            const view = quickActiveDateView || getQuickDatePickerState(quickActiveDateInput);
            const selected = parseQuickDateInput(quickActiveDateInput.value);
            const todayValue = formatDateOnly(new Date());
            const first = new Date(view.year, view.month - 1, 1);
            const start = new Date(view.year, view.month - 1, 1 - first.getDay());
            const days = [];
            for (let index = 0; index < 42; index += 1) {
                const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
                const value = current.getFullYear() + '-' + pad(current.getMonth() + 1) + '-' + pad(current.getDate());
                const classes = ['moyo-quick-date-picker-day'];
                if (current.getMonth() !== view.month - 1) classes.push('is-muted');
                if (value === todayValue) classes.push('is-today');
                if (selected && value === selected.value) classes.push('is-selected');
                days.push('<button type="button" class="' + classes.join(' ') + '" data-quick-date-value="' + value + '">' + current.getDate() + '</button>');
            }
            menu.innerHTML = ''
                + '<div class="moyo-quick-date-picker-head">'
                + '  <div class="moyo-quick-date-picker-title">' + view.year + '년 ' + view.month + '월</div>'
                + '  <div class="moyo-quick-date-picker-nav">'
                + '    <button type="button" data-quick-date-nav="-1" aria-label="이전 달">‹</button>'
                + '    <button type="button" data-quick-date-nav="1" aria-label="다음 달">›</button>'
                + '  </div>'
                + '</div>'
                + '<div class="moyo-quick-date-picker-weekdays">' + QUICK_DATE_WEEKDAYS.map(function(day){ return '<span>' + day + '</span>'; }).join('') + '</div>'
                + '<div class="moyo-quick-date-picker-days">' + days.join('') + '</div>'
                + '<div class="moyo-quick-date-picker-foot"><button type="button" class="moyo-quick-date-picker-today" data-quick-date-action="today">오늘</button></div>';
        }

        function positionQuickDatePicker(input) {
            const menu = ensureQuickDatePickerMenu();
            const rect = input.closest('.moyo-quick-date-field').getBoundingClientRect();
            const menuWidth = 248;
            const gap = 2;
            const left = Math.min(Math.max(10, rect.left), window.innerWidth - menuWidth - 10);
            const estimatedHeight = 288;
            const belowTop = rect.bottom + gap;
            const top = belowTop + estimatedHeight > window.innerHeight - 10 ? Math.max(10, rect.top - estimatedHeight - gap) : belowTop;
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
        }

        function openQuickDatePicker(input) {
            if (!input || input.disabled || input.readOnly) return;
            closeQuickFloaters('date');
            quickActiveDateInput = input;
            quickActiveDateView = getQuickDatePickerState(input);
            renderQuickDatePicker();
            positionQuickDatePicker(input);
            ensureQuickDatePickerMenu().hidden = false;
        }

        function closeQuickDatePicker() {
            if (quickDatePickerMenu) quickDatePickerMenu.hidden = true;
            quickActiveDateInput = null;
        }

        function setQuickDateInputValue(input, value) {
            if (!input) return;
            const parsed = parseQuickDateInput(value);
            if (!parsed) return;
            input.value = parsed.value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function normalizeQuickDateInputValue(input) {
            if (!input) return;
            const parsed = parseQuickDateInput(input.value);
            if (parsed) input.value = parsed.value;
        }

        function parseQuickTimeText(value) {
            const raw = String(value || '').trim();
            if (!raw) return null;
            let match = raw.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
            if (!match) {
                const compact = raw.replace(/\D/g, '');
                if (compact.length === 3) match = [compact, compact.slice(0, 1), compact.slice(1)];
                else if (compact.length === 4) match = [compact, compact.slice(0, 2), compact.slice(2)];
            }
            if (!match) return null;
            const hour = Number(match[1]);
            const minute = Number(match[2]);
            if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
            return { hour: hour, minute: minute };
        }

        function formatQuickTimeParts(hour, minute) {
            return pad(Math.max(0, Math.min(23, Number(hour) || 0))) + ':' + pad(Math.max(0, Math.min(59, Number(minute) || 0)));
        }

        function getQuickTimePickerState(value, fallback) {
            const parsed = parseQuickTimeText(value) || parseQuickTimeText(fallback) || { hour: 9, minute: 0 };
            const meridiem = parsed.hour >= 12 ? 'PM' : 'AM';
            const hour12 = parsed.hour % 12 || 12;
            const minute = QUICK_TIME_MINUTES.reduce(function(best, current) {
                return Math.abs(current - parsed.minute) < Math.abs(best - parsed.minute) ? current : best;
            }, 0);
            return { meridiem: meridiem, hour12: hour12, minute: minute };
        }

        function quickTimeStateToValue(state) {
            let hour = Number(state.hour12) || 12;
            if (state.meridiem === 'AM') hour = hour === 12 ? 0 : hour;
            else hour = hour === 12 ? 12 : hour + 12;
            return formatQuickTimeParts(hour, Number(state.minute) || 0);
        }

        function setQuickTimeInputValue(input, value, fallback) {
            if (!input) return;
            const parsed = parseQuickTimeText(value) || parseQuickTimeText(fallback) || { hour: input.id === 'quickCreateEndTime' ? 10 : 9, minute: 0 };
            const canonical = formatQuickTimeParts(parsed.hour, parsed.minute);
            const meridiem = parsed.hour >= 12 ? 'PM' : 'AM';
            const hour12 = parsed.hour % 12 || 12;
            input.dataset.timeValue = canonical;
            input.dataset.prevValue = canonical;
            input.dataset.meridiem = meridiem;
            input.value = pad(hour12) + ':' + pad(parsed.minute);
            updateQuickTimeMeridiem(input);
        }

        function getQuickTimeInputValue(input, fallback) {
            if (!input) return fallback || '';
            const stored = parseQuickTimeText(input.dataset.timeValue);
            if (stored) return formatQuickTimeParts(stored.hour, stored.minute);
            const parsed = parseQuickTimeText(input.value);
            if (!parsed) return fallback || '';
            let hour = parsed.hour;
            if (hour <= 12) {
                const meridiem = input.dataset.meridiem || (hour >= 12 ? 'PM' : 'AM');
                if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
                else hour = hour === 12 ? 12 : hour + 12;
            }
            return formatQuickTimeParts(hour, parsed.minute);
        }

        function updateQuickTimeMeridiem(input) {
            if (!input) return;
            const chip = document.querySelector('[data-quick-time-meridiem-for="' + input.id + '"]');
            if (!chip) return;
            const value = getQuickTimeInputValue(input, input.id === 'quickCreateEndTime' ? '10:00' : '09:00');
            const parsed = parseQuickTimeText(value) || { hour: 9, minute: 0 };
            const meridiem = parsed.hour >= 12 ? 'PM' : 'AM';
            chip.textContent = meridiem === 'PM' ? '오후' : '오전';
            chip.classList.toggle('is-am', meridiem === 'AM');
            chip.classList.toggle('is-pm', meridiem === 'PM');
            input.dataset.meridiem = meridiem;
        }

        function ensureQuickTimePickerMenu() {
            if (quickTimePickerMenu) return quickTimePickerMenu;
            quickTimePickerMenu = document.createElement('div');
            quickTimePickerMenu.id = 'quickTimePickerMenu';
            quickTimePickerMenu.className = 'moyo-quick-picker-menu moyo-quick-time-picker-menu';
            quickTimePickerMenu.hidden = true;
            quickTimePickerMenu.addEventListener('click', function(event) {
                event.stopPropagation();
                const button = event.target.closest('button[data-quick-time-action], button[data-quick-meridiem], button[data-quick-hour], button[data-quick-minute]');
                if (!button || !quickActiveTimeInput) return;
                if (button.dataset.quickTimeAction === 'now') {
                    const now = new Date();
                    const rounded = Math.round(now.getMinutes() / 5) * 5;
                    if (rounded >= 60) {
                        now.setHours(now.getHours() + 1);
                        now.setMinutes(0, 0, 0);
                    } else {
                        now.setMinutes(rounded, 0, 0);
                    }
                    quickActiveTimeState = getQuickTimePickerState(formatQuickTimeParts(now.getHours(), now.getMinutes()), '09:00');
                    commitQuickActiveTimeValue();
                    renderQuickTimePicker();
                    return;
                }
                if (button.dataset.quickMeridiem) quickActiveTimeState.meridiem = button.dataset.quickMeridiem;
                if (button.dataset.quickHour) quickActiveTimeState.hour12 = Number(button.dataset.quickHour);
                if (button.dataset.quickMinute) quickActiveTimeState.minute = Number(button.dataset.quickMinute);
                commitQuickActiveTimeValue();
                renderQuickTimePicker();
            });
            document.body.appendChild(quickTimePickerMenu);
            return quickTimePickerMenu;
        }

        function renderQuickTimePicker() {
            const menu = ensureQuickTimePickerMenu();
            const hourButtons = Array.from({ length: 12 }, function(_, index) {
                const hour = index + 1;
                return '<button type="button" data-quick-hour="' + hour + '" class="' + (quickActiveTimeState.hour12 === hour ? 'is-selected' : '') + '">' + pad(hour) + '</button>';
            }).join('');
            const minuteButtons = QUICK_TIME_MINUTES.map(function(minute) {
                return '<button type="button" data-quick-minute="' + minute + '" class="' + (quickActiveTimeState.minute === minute ? 'is-selected' : '') + '">' + pad(minute) + '</button>';
            }).join('');
            menu.innerHTML = ''
                + '<div class="moyo-quick-time-picker-head">'
                + '  <div class="moyo-quick-time-picker-title">시간 선택</div>'
                + '  <button type="button" class="moyo-quick-time-picker-now" data-quick-time-action="now">현재 시간</button>'
                + '</div>'
                + '<div class="moyo-quick-time-picker-ampm" aria-label="오전 오후 선택">'
                + '  <button type="button" data-quick-meridiem="AM" class="' + (quickActiveTimeState.meridiem === 'AM' ? 'is-selected' : '') + '">오전</button>'
                + '  <button type="button" data-quick-meridiem="PM" class="' + (quickActiveTimeState.meridiem === 'PM' ? 'is-selected' : '') + '">오후</button>'
                + '</div>'
                + '<div class="moyo-quick-time-picker-section">'
                + '  <div class="moyo-quick-time-picker-label">시</div>'
                + '  <div class="moyo-quick-time-picker-grid">' + hourButtons + '</div>'
                + '</div>'
                + '<div class="moyo-quick-time-picker-section">'
                + '  <div class="moyo-quick-time-picker-label">분 · 5분 단위</div>'
                + '  <div class="moyo-quick-time-picker-grid">' + minuteButtons + '</div>'
                + '</div>'
                + '<div class="moyo-quick-time-picker-foot">직접 입력도 가능합니다.</div>';
        }

        function positionQuickTimePicker(input) {
            const menu = ensureQuickTimePickerMenu();
            const field = input.closest('.moyo-quick-time-field') || input;
            const rect = field.getBoundingClientRect();
            const menuWidth = 268;
            const gap = 2;
            const left = Math.min(Math.max(10, rect.left), window.innerWidth - menuWidth - 10);
            const estimatedHeight = 276;
            const belowTop = rect.bottom + gap;
            const top = belowTop + estimatedHeight > window.innerHeight - 10 ? Math.max(10, rect.top - estimatedHeight - gap) : belowTop;
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
        }

        function openQuickTimePicker(input) {
            if (!input || input.disabled) return;
            closeQuickFloaters('time');
            quickActiveTimeInput = input;
            quickActiveTimeState = getQuickTimePickerState(getQuickTimeInputValue(input, input.id === 'quickCreateEndTime' ? '10:00' : '09:00'), input.id === 'quickCreateEndTime' ? '10:00' : '09:00');
            renderQuickTimePicker();
            positionQuickTimePicker(input);
            ensureQuickTimePickerMenu().hidden = false;
        }

        function closeQuickTimePicker() {
            if (quickTimePickerMenu) quickTimePickerMenu.hidden = true;
            quickActiveTimeInput = null;
        }

        function commitQuickActiveTimeValue() {
            if (!quickActiveTimeInput) return;
            setQuickTimeInputValue(quickActiveTimeInput, quickTimeStateToValue(quickActiveTimeState), quickActiveTimeInput.id === 'quickCreateEndTime' ? '10:00' : '09:00');
            quickActiveTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function normalizeQuickTimeInputValue(input) {
            if (!input) return;
            const fallback = input.dataset.prevValue || (input.id === 'quickCreateEndTime' ? '10:00' : '09:00');
            const parsed = parseQuickTimeText(input.value);
            if (!parsed) {
                setQuickTimeInputValue(input, fallback, fallback);
            } else {
                let hour = parsed.hour;
                if (hour <= 12) {
                    const meridiem = input.dataset.meridiem || (hour >= 12 ? 'PM' : 'AM');
                    if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
                    else hour = hour === 12 ? 12 : hour + 12;
                }
                setQuickTimeInputValue(input, formatQuickTimeParts(hour, parsed.minute), fallback);
            }
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function renderQuickTypeOptions() {
            const grid = document.getElementById('quickCreateTypeGrid');
            if (!grid) return;
            grid.innerHTML = QUICK_EVENT_TYPES.map(function(item) {
                return '<button type="button" class="moyo-quick-type-option" data-type="' + escapeHtml(item.value) + '">' +
                    '<span class="emoji">' + item.icon + '</span><span>' + escapeHtml(item.label) + '</span></button>';
            }).join('');
            setQuickEventType('');
        }

        function setQuickEventType(type) {
            quickCreateEventType = type || '';
            const meta = QUICK_EVENT_TYPES.find(function(item) { return item.value === quickCreateEventType; }) || QUICK_EVENT_TYPES[0];
            $('#quickCreateTypeIcon').text(meta.icon || '');
            $('#quickCreateTypeText').text(meta.label || '일반');
            $('#quickCreateTypeGrid .moyo-quick-type-option').each(function() {
                $(this).toggleClass('is-active', String($(this).data('type') || '') === quickCreateEventType);
            });
        }

        function toggleQuickTypePopover() {
            const popover = document.getElementById('quickCreateTypePopover');
            const button = document.getElementById('quickCreateTypeButton');
            if (!popover || !button) return;
            const willOpen = popover.hidden;
            closeQuickFloaters('type');
            popover.hidden = !willOpen;
            button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        }

        function closeQuickTypePopover() {
            const popover = document.getElementById('quickCreateTypePopover');
            const button = document.getElementById('quickCreateTypeButton');
            if (popover) popover.hidden = true;
            if (button) button.setAttribute('aria-expanded', 'false');
        }

        function openQuickCreateModal(options) {
            if (state.scope === 'FRIEND') {
                alert('친구 탭에서는 친구의 일정을 확인만 할 수 있습니다. 개인 일정으로 등록하려면 개인 탭에서 등록해 주세요.');
                return;
            }
            const modal = document.getElementById('calendarQuickCreateModal');
            if (!modal) return;
            closeQuickFloaters();
            resetQuickCreateForm(options || {});
            modal.hidden = false;
            document.body.classList.add('moyo-event-view-open');
            setTimeout(function() { $('#quickCreateTitleInput').trigger('focus'); }, 30);
        }

        function closeQuickCreateModal() {
            const modal = document.getElementById('calendarQuickCreateModal');
            if (!modal) return;
            modal.hidden = true;
            closeQuickFloaters();
            document.body.classList.remove('moyo-event-view-open');
        }

        function resetQuickCreateForm(options) {
            const scopeInfo = getCreateScopeInfo();
            const dateStr = options.startDate || formatDateOnly(state.selectedDate || new Date());
            const endDateStr = options.endDate || dateStr;
            const range = getQuickDefaultRange(dateStr);
            $('#quickCreateTitleInput').val('');
            $('#quickCreateStartDate').val(dateStr);
            $('#quickCreateEndDate').val(endDateStr);
            setQuickTimeInputValue(document.getElementById('quickCreateStartTime'), options.startTime || range.startTime, '09:00');
            setQuickTimeInputValue(document.getElementById('quickCreateEndTime'), options.endTime || range.endTime, '10:00');
            $('#quickCreateAllDay').prop('checked', !!options.allDay);
            $('#quickCreateLunar').val('N');
            $('#quickCreateRepeat').val('');
            const quickTimezoneSelect = document.getElementById('quickCreateTimezone');
            if (quickTimezoneSelect) {
                quickTimezoneSelect.value = 'Asia/Seoul';
                if (quickTimezoneSelect.value !== 'Asia/Seoul') quickTimezoneSelect.selectedIndex = 0;
            }
            $('#quickCreateReminder').val('');
            syncAllQuickSelectButtons();
            setQuickEventType('');
            setQuickMoyoPublic(!!scopeInfo.moyoPublic);
            syncQuickScopeText(scopeInfo);
            syncQuickAllDayState();
        }

        function syncQuickScopeText(scopeInfo) {
            let text = '개인 일정으로 등록됩니다.';
            if (scopeInfo.scopeType === 'WS') text = '선택한 그룹 일정으로 등록됩니다.';
            if (scopeInfo.scopeType === 'PROJ') text = '선택한 프로젝트 일정으로 등록됩니다.';
            if (scopeInfo.moyoPublic) text = 'MOYO 공개 개인 일정으로 등록됩니다.';
            $('#quickCreateScopeText').text(text);
            $('#quickCreatePublicRow').toggle(scopeInfo.scopeType === 'PRIVATE');
        }

        function setQuickMoyoPublic(active) {
            const $toggle = $('#quickCreateMoyoToggle');
            $toggle.toggleClass('is-active', !!active);
            $toggle.attr('aria-pressed', active ? 'true' : 'false');
        }

        function syncQuickAllDayState() {
            const allDay = $('#quickCreateAllDay').is(':checked');
            $('#quickCreateStartTime, #quickCreateEndTime').prop('disabled', allDay);
            $('#quickCreateStartTime, #quickCreateEndTime').closest('.moyo-quick-time-field').find('.moyo-quick-time-trigger').prop('disabled', allDay);
            $('#quickCreateStartTime, #quickCreateEndTime').closest('.moyo-quick-time-grid').toggleClass('is-all-day', allDay);
            if (allDay) closeQuickTimePicker();
        }

        function normalizeQuickEndByStart() {
            const startDate = $('#quickCreateStartDate').val();
            const endDate = $('#quickCreateEndDate').val();
            const startTime = getQuickTimeInputValue(document.getElementById('quickCreateStartTime'), '09:00');
            const endTime = getQuickTimeInputValue(document.getElementById('quickCreateEndTime'), '10:00');
            if (startDate && (!endDate || endDate < startDate)) $('#quickCreateEndDate').val(startDate);
            if (startDate && $('#quickCreateEndDate').val() === startDate && startTime && (!endTime || endTime <= startTime)) {
                const next = addMinutesToTime(startTime, 60);
                setQuickTimeInputValue(document.getElementById('quickCreateEndTime'), next.time, '10:00');
                if (next.dayOffset > 0) $('#quickCreateEndDate').val(addDaysToDate(startDate, next.dayOffset));
            }
        }

        function collectQuickCreateDraft() {
            const scopeInfo = getCreateScopeInfo();
            const title = String($('#quickCreateTitleInput').val() || '').trim();
            const startDate = $('#quickCreateStartDate').val();
            const endDate = $('#quickCreateEndDate').val();
            const allDay = $('#quickCreateAllDay').is(':checked');
            const startTime = allDay ? null : (getQuickTimeInputValue(document.getElementById('quickCreateStartTime'), '09:00') || '00:00');
            const endTime = allDay ? null : (getQuickTimeInputValue(document.getElementById('quickCreateEndTime'), '10:00') || '23:59');
            const repeat = $('#quickCreateRepeat').val() || '';
            const isLunar = $('#quickCreateLunar').val() === 'Y';
            const reminder = $('#quickCreateReminder').val();
            const moyoPublic = scopeInfo.scopeType === 'PRIVATE' && $('#quickCreateMoyoToggle').hasClass('is-active');
            return {
                title: title,
                scopeInfo: scopeInfo,
                startDate: startDate,
                endDate: endDate,
                startTime: startTime,
                endTime: endTime,
                allDay: allDay,
                isLunar: isLunar,
                repeat: repeat,
                timezone: allDay ? 'Asia/Seoul' : ($('#quickCreateTimezone').val() || 'Asia/Seoul'),
                reminderMinutes: reminder === '' ? null : Number(reminder),
                moyoPublic: moyoPublic,
                eventType: quickCreateEventType || null
            };
        }

        function buildQuickCreatePayload(draft) {
            const itemType = draft.scopeInfo.scopeType || 'PRIVATE';
            const startDt = draft.allDay ? draft.startDate + 'T00:00:00' : draft.startDate + 'T' + draft.startTime + ':00';
            const endDt = draft.allDay ? draft.endDate + 'T23:59:59' : draft.endDate + 'T' + draft.endTime + ':00';
            const payload = {
                title: draft.title,
                startDt: startDt,
                endDt: endDt,
                itemType: itemType,
                eventType: draft.eventType || null,
                isPrivate: draft.moyoPublic ? 'N' : 'Y',
                visibilityType: draft.moyoPublic ? 'MOYO' : 'PRIVATE',
                reminderYn: draft.reminderMinutes == null ? 'N' : 'Y',
                reminderMinutes: draft.reminderMinutes,
                userId: Number(sessionUserId) || null,
                wsId: itemType === 'WS' || itemType === 'PROJ' ? (Number(draft.scopeInfo.wsId) || null) : null,
                projId: itemType === 'PROJ' ? (Number(draft.scopeInfo.projId) || null) : null,
                color: null,
                allDay: draft.allDay ? 'Y' : 'N',
                timezone: draft.timezone,
                isRecurring: draft.repeat ? 'Y' : 'N',
                recurType: draft.repeat || null,
                recurInterval: 1,
                untilDt: null,
                recurDays: draft.repeat === 'WEEKLY' ? getWeekdayCode(draft.startDate) : null,
                recurGroupId: null,
                isLunar: draft.isLunar ? 'Y' : 'N',
                lunarMonth: draft.isLunar ? Number(draft.startDate.slice(5, 7)) : null,
                lunarDay: draft.isLunar ? Number(draft.startDate.slice(8, 10)) : null,
                locationText: null,
                locationAddress: null,
                locationLat: null,
                locationLng: null,
                locationPlaceId: null,
                descriptionText: null,
                shareTargets: [],
                attendeeUserIds: []
            };
            if (itemType !== 'PRIVATE') {
                payload.isPrivate = 'Y';
                payload.visibilityType = 'PRIVATE';
            }
            return payload;
        }

        function validateQuickCreateDraft(draft) {
            if (!draft.title) return '제목을 입력하세요.';
            if (!draft.startDate || !draft.endDate) return '시작/종료 날짜를 입력하세요.';
            if (!draft.allDay && (!draft.startTime || !draft.endTime)) return '시작/종료 시간을 입력하세요.';
            if (draft.isLunar && draft.repeat && draft.repeat !== 'YEARLY') return '음력 일정은 반복 안 함 또는 매년 반복만 사용할 수 있습니다.';
            const start = new Date(draft.startDate + 'T' + (draft.allDay ? '00:00:00' : draft.startTime + ':00'));
            const end = new Date(draft.endDate + 'T' + (draft.allDay ? '23:59:00' : draft.endTime + ':00'));
            if (end < start) return '종료 일시는 시작 일시보다 빠를 수 없습니다.';
            if (draft.scopeInfo.scopeType === 'WS' && !draft.scopeInfo.wsId) return '그룹을 선택한 뒤 등록해 주세요.';
            if (draft.scopeInfo.scopeType === 'PROJ' && !draft.scopeInfo.projId) return '프로젝트를 선택한 뒤 등록해 주세요.';
            return '';
        }

        function saveQuickCreateEvent() {
            if (quickCreateSaving) return;
            const draft = collectQuickCreateDraft();
            const message = validateQuickCreateDraft(draft);
            if (message) {
                alert(message);
                return;
            }
            const payload = buildQuickCreatePayload(draft);
            quickCreateSaving = true;
            $('#quickCreateSave').prop('disabled', true).text('등록 중...');
            fetch(contextPath + '/api/calendar/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            })
            .then(function(response) {
                return response.text().then(function(text) {
                    let data = null;
                    try { data = JSON.parse(text); } catch (e) { data = null; }
                    if (!response.ok) throw new Error((data && data.message) || text || '저장 실패');
                    return data || { success: text === 'SUCCESS', message: text };
                });
            })
            .then(function(result) {
                if (result && result.success === false) throw new Error(result.message || '저장 실패');
                closeQuickCreateModal();
                calendar.refetchEvents();
                renderSelectedDatePanel();
            })
            .catch(function(error) {
                alert(error && error.message ? error.message : '저장 실패');
            })
            .finally(function() {
                quickCreateSaving = false;
                $('#quickCreateSave').prop('disabled', false).text('등록');
            });
        }

        function goQuickCreateDetailForm() {
            const draft = collectQuickCreateDraft();
            try {
                sessionStorage.setItem('moyoCalendarQuickDraft', JSON.stringify(draft));
            } catch (e) {}
            const params = {
                startDate: draft.startDate,
                quickDraft: 'Y'
            };
            window.location.href = buildEventFormUrl(params);
        }

        function getQuickCreateOptionsFromSelection(info) {
            const startDate = formatDateOnly(info.start || new Date());
            const options = { startDate: startDate };
            if (info.allDay) {
                const endBase = info.end ? new Date(info.end.getTime()) : new Date(info.start.getTime());
                endBase.setDate(endBase.getDate() - 1);
                options.endDate = formatDateOnly(endBase);
                options.allDay = true;
                return options;
            }
            if (info.start) {
                options.startTime = pad(info.start.getHours()) + ':' + pad(info.start.getMinutes());
            }
            if (info.end) {
                options.endDate = formatDateOnly(info.end);
                options.endTime = pad(info.end.getHours()) + ':' + pad(info.end.getMinutes());
            }
            return options;
        }

        function getQuickDefaultRange(dateStr) {
            const today = formatDateOnly(new Date());
            if (dateStr !== today) return { startTime: '09:00', endTime: '10:00' };
            const now = new Date();
            const rounded = new Date(now.getTime());
            rounded.setSeconds(0, 0);
            const minutes = rounded.getMinutes();
            const add = minutes === 0 || minutes === 30 ? 0 : (minutes < 30 ? 30 - minutes : 60 - minutes);
            rounded.setMinutes(minutes + add);
            const startTime = pad(rounded.getHours()) + ':' + pad(rounded.getMinutes());
            const end = new Date(rounded.getTime() + 60 * 60 * 1000);
            return { startTime: startTime, endTime: pad(end.getHours()) + ':' + pad(end.getMinutes()) };
        }

        function addMinutesToTime(time, minutesToAdd) {
            const parts = String(time || '00:00').split(':').map(Number);
            const total = (parts[0] * 60 + parts[1] + minutesToAdd);
            const dayOffset = Math.floor(total / 1440);
            const mins = ((total % 1440) + 1440) % 1440;
            return { time: pad(Math.floor(mins / 60)) + ':' + pad(mins % 60), dayOffset: dayOffset };
        }

        function addDaysToDate(dateStr, dayOffset) {
            const date = parseLocalDate(dateStr);
            date.setDate(date.getDate() + dayOffset);
            return formatDateOnly(date);
        }

        function getWeekdayCode(dateStr) {
            const codes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return codes[parseLocalDate(dateStr).getDay()];
        }

        function buildEventFormUrl(extraParams) {
            const params = new URLSearchParams(extraParams || {});
            const scopeInfo = getCreateScopeInfo();
            params.set('scopeType', scopeInfo.scopeType);
            if (scopeInfo.wsId) params.set('wsId', scopeInfo.wsId);
            if (scopeInfo.projId) params.set('projId', scopeInfo.projId);
            if (scopeInfo.moyoPublic) params.set('moyoPublic', 'Y');
            const query = params.toString();
            return contextPath + '/calendar/event/form' + (query ? '?' + query : '');
        }

        function getCreateScopeInfo() {
            if (state.scope === 'WS' && getSelectedTargetId() !== 'ALL') {
                return { scopeType: 'WS', wsId: getSelectedTargetId() };
            }

            if (state.scope === 'PROJ' && getSelectedTargetId() !== 'ALL') {
                const project = (state.userSpaces.projects || []).find(function(item) {
                    return String(item.projId || item.PROJ_ID || '') === String(getSelectedTargetId());
                });
                return {
                    scopeType: 'PROJ',
                    projId: getSelectedTargetId(),
                    wsId: project ? (project.wsId || project.WS_ID || '') : ''
                };
            }

            return { scopeType: 'PRIVATE' };
        }

        function normalizeProjectTaskStatus(value) {
            const status = String(value || '').trim().toUpperCase();
            if (status === 'IN_PROGRESS' || status === 'PROGRESS' || status === 'DOING') return 'IN_PROGRESS';
            if (status === 'DONE' || status === 'COMPLETED' || status === 'COMPLETE') return 'DONE';
            return 'TODO';
        }

        function isTruthyCalendarFlag(value) {
            const normalized = String(value == null ? '' : value).trim().toUpperCase();
            return normalized === 'Y' || normalized === 'TRUE' || normalized === '1';
        }

        function getProjectSummaryTasks() {
            const taskMap = new Map();
            (state.calendarSourceEvents || []).forEach(function(event) {
                if (!event) return;
                const props = event.extendedProps || {};
                const itemType = String(props.itemType || props.type || '').toUpperCase();
                if (itemType !== 'TASK' || !(props.projId || props.PROJ_ID)) return;
                if (getSelectedTargetId() !== 'ALL' && String(props.projId || props.PROJ_ID || '') !== String(getSelectedTargetId())) return;
                if (!matchesProjectTaskFilter(event)) return;

                const key = String(props.taskId || props.TASK_ID || event.id || [
                    props.projId || props.PROJ_ID || '',
                    props.rawTitle || event.title || '',
                    props.originalStartDt || '',
                    props.originalEndDt || ''
                ].join('|'));
                if (!taskMap.has(key)) taskMap.set(key, event);
            });
            return Array.from(taskMap.values());
        }

        function renderProjectSummary() {
            const summary = document.getElementById('calendarProjectSummary');
            if (!summary) return;

            const isProjectScope = state.scope === 'PROJ';
            const contextArea = document.getElementById('calendarContextArea');
            if (contextArea) contextArea.classList.toggle('is-project-mode', isProjectScope);
            summary.hidden = !isProjectScope;
            if (!isProjectScope) return;

            const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0, DELAYED: 0 };
            const tasks = getProjectSummaryTasks();
            tasks.forEach(function(event) {
                const props = event.extendedProps || {};
                const status = normalizeProjectTaskStatus(props.status);
                counts[status] += 1;
                if (isTruthyCalendarFlag(props.delayedYn) || isTruthyCalendarFlag(props.delayedCompletedYn)) {
                    counts.DELAYED += 1;
                }
            });

            const total = counts.TODO + counts.IN_PROGRESS + counts.DONE;
            const rate = total > 0 ? Math.round((counts.DONE / total) * 100) : 0;
            $('#projectSummaryTodo').text(counts.TODO);
            $('#projectSummaryProgress').text(counts.IN_PROGRESS);
            $('#projectSummaryDone').text(counts.DONE);
            $('#projectSummaryDelayed').text(counts.DELAYED);
            $('#projectSummaryRate').text(rate + '%');
            $('#projectSummaryRateBar').css('width', rate + '%');
            summary.setAttribute('data-empty', total === 0 ? 'true' : 'false');
        }


        function getProjectFilterAssignees() {
            const assigneeMap = new Map();
            (state.calendarSourceEvents || []).forEach(function(event) {
                const props = (event && event.extendedProps) || {};
                if (String(props.itemType || props.type || '').toUpperCase() !== 'TASK') return;
                if (getSelectedTargetId() !== 'ALL' && String(props.projId || '') !== String(getSelectedTargetId())) return;
                const id = String(props.assigneeUserId || '').trim();
                if (!id || assigneeMap.has(id)) return;
                assigneeMap.set(id, {
                    id: id,
                    name: String(props.assigneeName || props.assigneeEmail || '이름 없음'),
                    email: String(props.assigneeEmail || '')
                });
            });
            return Array.from(assigneeMap.values()).sort(function(a, b) {
                return a.name.localeCompare(b.name, 'ko');
            });
        }

        function renderProjectTaskFilter() {
            const section = document.getElementById('calendarProjectTaskFilter');
            if (!section) return;
            const visible = isSpecificProjectSelection();
            section.hidden = !visible;
            if (!visible) return;

            const filter = state.projectTaskFilter || {};
            section.querySelectorAll('[data-project-assignee-mode]').forEach(function(button) {
                button.classList.toggle('is-active', button.getAttribute('data-project-assignee-mode') === filter.assigneeMode);
            });
            section.querySelectorAll('[data-project-status]').forEach(function(button) {
                button.classList.toggle('is-active', button.getAttribute('data-project-status') === filter.status);
            });
            section.querySelectorAll('[data-project-display-kind]').forEach(function(button) {
                const kind = button.getAttribute('data-project-display-kind');
                const active = kind === 'TASK' ? filter.showTask !== false : filter.showSchedule !== false;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
            });

            const select = document.getElementById('calendarProjectAssigneeSelect');
            if (select) {
                const assignees = getProjectFilterAssignees();
                const previous = String(filter.assigneeId || 'ALL');
                select.innerHTML = '<option value="ALL">담당자 전체</option>' + assignees.map(function(item) {
                    const label = item.email ? item.name + ' · ' + item.email : item.name;
                    return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(label) + '</option>';
                }).join('');
                const exists = previous === 'ALL' || assignees.some(function(item) { return item.id === previous; });
                filter.assigneeId = exists ? previous : 'ALL';
                select.value = filter.assigneeId;
                select.hidden = filter.assigneeMode !== 'ASSIGNEE';
            }
        }

        function bindProjectTaskFilter() {
            const section = document.getElementById('calendarProjectTaskFilter');
            if (!section || section.dataset.bound === 'true') return;
            section.dataset.bound = 'true';

            section.addEventListener('click', function(event) {
                const assigneeModeButton = event.target.closest('[data-project-assignee-mode]');
                const statusButton = event.target.closest('[data-project-status]');
                const displayButton = event.target.closest('[data-project-display-kind]');
                const resetButton = event.target.closest('#calendarProjectFilterReset');
                const filter = state.projectTaskFilter;

                if (assigneeModeButton) {
                    filter.assigneeMode = assigneeModeButton.getAttribute('data-project-assignee-mode') || 'ALL';
                    if (filter.assigneeMode !== 'ASSIGNEE') filter.assigneeId = 'ALL';
                } else if (statusButton) {
                    filter.status = statusButton.getAttribute('data-project-status') || 'ALL';
                } else if (displayButton) {
                    const kind = displayButton.getAttribute('data-project-display-kind');
                    if (kind === 'TASK') filter.showTask = !filter.showTask;
                    else filter.showSchedule = !filter.showSchedule;
                } else if (resetButton) {
                    filter.assigneeMode = 'ALL';
                    filter.assigneeId = 'ALL';
                    filter.status = 'ALL';
                    filter.showSchedule = true;
                    filter.showTask = true;
                } else {
                    return;
                }
                renderProjectTaskFilter();
                renderProjectSummary();
                calendar.refetchEvents();
                renderSelectedDatePanel();
            });

            $('#calendarProjectAssigneeSelect').on('change', function() {
                state.projectTaskFilter.assigneeId = String(this.value || 'ALL');
                renderProjectSummary();
                calendar.refetchEvents();
                renderSelectedDatePanel();
            });
        }

        function matchesProjectTaskFilter(eventObj) {
            if (state.scope !== 'PROJ') return true;
            const props = (eventObj && eventObj.extendedProps) || {};
            const kind = getProjectCalendarKind(props);
            const isTask = kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED' || String(props.itemType || props.type || '').toUpperCase() === 'TASK';
            const filter = state.projectTaskFilter || {};

            if (isTask) {
                if (filter.showTask === false) return false;
                const assigneeId = String(props.assigneeUserId || '').trim();
                if (filter.assigneeMode === 'MINE' && assigneeId !== String(sessionUserId || '')) return false;
                if (filter.assigneeMode === 'ASSIGNEE' && filter.assigneeId !== 'ALL' && assigneeId !== String(filter.assigneeId || '')) return false;

                const status = normalizeProjectTaskStatus(props.status);
                if (filter.status === 'DELAYED') return isProjectTaskDelayed(props);
                if (filter.status && filter.status !== 'ALL' && status !== filter.status) return false;
                return true;
            }

            return filter.showSchedule !== false;
        }

        function getCalendarRequestData(info) {
            const data = {
                types: getRequestTypes().join(','),
                startDate: info.startStr.split('T')[0],
                endDate: info.endStr.split('T')[0],
                userId: getRequestUserId()
            };

            if (state.scope === 'WS' && getSelectedTargetId() !== 'ALL') data.wsId = getSelectedTargetId();
            if (state.scope === 'PROJ' && getSelectedTargetId() !== 'ALL') data.projId = getSelectedTargetId();
            return data;
        }

        function getRequestUserId() {
            return sessionUserId;
        }

        function getProjectCalendarKind(props) {
            if (!props) return '';
            const displayType = String(props.displayType || props.type || '').toUpperCase();
            const itemType = String(props.type || props.itemType || props.ITEM_TYPE || '').toUpperCase();
            const eventType = normalizeCalendarEventTypeKey(props.eventType || props.calendarEventType || props.EVENT_TYPE || props.CALENDAR_EVENT_TYPE);
            if (eventType === 'PROJECT_PERIOD') return 'PROJECT_PERIOD';
            if (eventType === 'MILESTONE' || eventType === 'PROJECT_MILESTONE') return 'MILESTONE';
            if (itemType === 'TASK') {
                const ownerId = String(props.ownerUserId || props.userId || props.USER_ID || '');
                if (state.scope === 'PROJ' && ownerId && String(sessionUserId || '') === ownerId) return 'TASK_ASSIGNED';
                return 'TASK_DUE';
            }
            if (displayType === 'PROJ' || itemType === 'PROJ') {
                const title = String(props.rawTitle || props.title || '').trim();
                const projectName = String(props.projName || props.projectName || '').trim();
                const isLegacyPeriod = !!projectName && (title === projectName || title === projectName + ' 시작');
                const explicitNone = eventType === 'NONE' || eventType === 'GENERAL' || !eventType;
                if (isLegacyPeriod && explicitNone) return 'PROJECT_PERIOD';
                return 'PROJECT_EVENT';
            }
            return '';
        }

        function getProjectDisplayFilterKey(props) {
            const kind = getProjectCalendarKind(props);
            if (kind === 'TASK_ASSIGNED') {
                return state.projectDisplayFilters && state.projectDisplayFilters.TASK_ASSIGNED ? 'TASK_ASSIGNED' : 'TASK_DUE';
            }
            return kind;
        }

        function isProjectCalendarDisplayAllowed(props) {
            const kind = getProjectDisplayFilterKey(props);
            if (!kind) return true;

            // 전체 탭에서는 일반 일정은 유지하고, 프로젝트 업무와 개별 기간 바는 숨긴다.
            // 프로젝트 기간은 달력 헤더의 축약 정보로만 안내한다.
            if (state.scope === 'ALL' && (kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED' || kind === 'PROJECT_PERIOD')) return false;

            // 프로젝트 전체/개인 프로젝트 전체/그룹 프로젝트 전체는 기간만 보여준다.
            if (state.scope === 'PROJ' && !isSpecificProjectSelection()) {
                return kind === 'PROJECT_PERIOD';
            }

            const filters = state.projectDisplayFilters || {};
            return filters[kind] !== false;
        }

        function getProjectTaskStatusInfo(props) {
            const status = String((props && props.status) || 'TODO').trim().toUpperCase();
            if (status === 'IN_PROGRESS') return { key: 'IN_PROGRESS', label: '진행 중' };
            if (status === 'DONE') return { key: 'DONE', label: '완료' };
            return { key: 'TODO', label: '할 일' };
        }

        function isProjectTaskDelayed(props) {
            return isTruthyCalendarFlag(props && props.delayedYn) || isTruthyCalendarFlag(props && props.delayedCompletedYn);
        }

        function formatProjectTaskDate(value) {
            if (!value) return '-';
            const text = String(value).replace('T', ' ');
            const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return match ? match[1] + '.' + match[2] + '.' + match[3] : text;
        }

        function getProjectTaskPeriodText(event) {
            const props = (event && event.extendedProps) || {};
            const start = formatProjectTaskDate(props.originalStartDt || (event && event.start));
            const end = formatProjectTaskDate(props.originalEndDt || (event && event.end) || props.originalStartDt);
            if (start === '-' && end === '-') return '-';
            if (start === end || end === '-') return start;
            return start + ' ~ ' + end;
        }

        function buildProjectTaskDetailMarkup(event) {
            const props = (event && event.extendedProps) || {};
            const statusInfo = getProjectTaskStatusInfo(props);
            const delayed = isProjectTaskDelayed(props);
            const delayedDays = Math.max(0, Number(props.delayedDays || 0));
            const actualStart = formatProjectTaskDate(props.actualStartDt);
            const actualDone = formatProjectTaskDate(props.actualDoneDt);
            let html = '<div class="moyo-project-task-detail">';
            html += '<div class="moyo-project-task-detail-head"><span class="moyo-project-task-status is-' + statusInfo.key.toLowerCase() + '">' + statusInfo.label + '</span>';
            if (delayed) html += '<span class="moyo-project-task-status is-delayed">지연' + (delayedDays ? ' ' + delayedDays + '일' : '') + '</span>';
            html += '</div>';
            html += '<dl class="moyo-project-task-detail-grid">';
            html += '<div><dt>담당자</dt><dd>' + escapeHtml(props.assigneeName || '미지정') + '</dd></div>';
            html += '<div><dt>예정 기간</dt><dd>' + escapeHtml(getProjectTaskPeriodText(event)) + '</dd></div>';
            html += '<div><dt>실제 시작</dt><dd>' + escapeHtml(actualStart) + '</dd></div>';
            html += '<div><dt>실제 완료</dt><dd>' + escapeHtml(actualDone) + '</dd></div>';
            html += '</dl></div>';
            return html;
        }

        function getCalendarDisplayTitle(event) {
            const props = event && event.extendedProps ? event.extendedProps : {};
            const kind = getProjectCalendarKind(props);
            const projectName = props.projName || props.projectName || '';
            const rawTitle = event && event.title ? String(event.title) : '제목 없음';
            if (kind === 'PROJECT_PERIOD' && projectName) return projectName;
            if ((kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED') && rawTitle.indexOf('마감') < 0) return rawTitle + ' 마감';
            return rawTitle;
        }

        function matchesCalendarDisplayFilter(eventObj) {
            return matchesTargetFilter(eventObj) && matchesCalendarSearch(eventObj);
        }

        function normalizeCalendarSearchText(value) {
            return String(value == null ? '' : value).trim().toLowerCase();
        }

        function matchesCalendarSearch(eventObj) {
            const keyword = normalizeCalendarSearchText(state.searchKeyword);
            if (!keyword) return true;
            const props = eventObj && eventObj.extendedProps ? eventObj.extendedProps : {};
            const haystack = [
                eventObj && eventObj.title,
                props.title,
                props.eventTitle,
                props.description,
                props.content,
                props.location,
                props.eventLocation,
                props.ownerName,
                props.writerName,
                props.creatorName,
                props.friendName,
                props.wsName,
                props.workspaceName,
                props.groupName,
                props.projName,
                props.projectName,
                props.projectWorkspaceName,
                props.projectCalendarKind,
                props.projectScope,
                props.projectItemKind,
                props.assigneeName,
                props.assigneeEmail,
                props.status,
                props.albumName,
                props.eventType,
                props.calendarEventType
            ].map(function(value) { return normalizeCalendarSearchText(value); }).join(' ');
            return haystack.indexOf(keyword) !== -1;
        }

        function matchesTargetFilter(eventObj) {
            const props = eventObj.extendedProps || {};
            const type = props.displayType || props.type;
            if (type === 'HOLIDAY') return true;
            if (!isProjectCalendarDisplayAllowed(props)) return false;
            if (!matchesProjectTaskFilter(eventObj)) return false;

            const typeFilterKey = getEventTypeFilterKey(props);
            if (state.allTypeFilters && state.allTypeFilters[typeFilterKey] === false) return false;

            if (state.scope === 'ALL') {
                return matchesAllCalendarScope(props, type);
            }

            if (state.scope === 'PRIVATE') {
                const isFriendRelated = isReceivedPrivateCalendarEvent(props) || isFriendOwnedEvent(props);
                const isMyPrivate = (type === 'PRIVATE' || type === 'MOYO') && !isFriendRelated;
                if (!isMyPrivate) return false;
                if (isMoyoSharedEvent(props) && state.allScopeFilters && state.allScopeFilters.MOYO_PUBLIC === false) return false;
                return true;
            }

            if (state.scope === 'FRIEND') {
                return matchesFriendCalendarScope(props, type);
            }

            if (state.scope === 'PROJ') return matchesProjectSelection(props);
            if (getSelectedTargetId() === 'ALL') return true;
            if (state.scope === 'WS') return String(props.wsId || '') === String(getSelectedTargetId());
            return true;
        }

        function matchesAllCalendarScope(props, displayType) {
            const filters = state.allScopeFilters || {};
            const type = String(displayType || props.displayType || props.type || '').toUpperCase();
            const typeFilterKey = getEventTypeFilterKey(props);
            if (state.allTypeFilters && state.allTypeFilters[typeFilterKey] === false) return false;
            const isMoyoPublic = isMoyoSharedEvent(props);
            const isFriendRelated = type === 'FRIEND' || isReceivedPrivateCalendarEvent(props) || (isMoyoPublic && isFriendOwnedEvent(props));
            const isPrivateOwned = type === 'PRIVATE' && !isFriendRelated && !isFriendOwnedEvent(props);
            const isGroup = type === 'WS';
            const isProject = type === 'PROJ' || type === 'TASK';

            if (isMoyoPublic) return !!filters.MOYO_PUBLIC;
            if (filters.PRIVATE && isPrivateOwned) return true;
            if (filters.FRIEND && isFriendRelated) return true;
            if (filters.WS && isGroup) return true;
            if (filters.PROJ && isProject) return true;
            return false;
        }

        function matchesFriendCalendarScope(props, displayType) {
            if (!props) return false;
            const type = String(displayType || props.displayType || props.type || '').toUpperCase();
            const isFriendMoyo = isMoyoSharedEvent(props) && isFriendOwnedEvent(props);
            const friendRelated = type === 'FRIEND' || isReceivedPrivateCalendarEvent(props) || isFriendMoyo;
            if (!friendRelated) return false;
            if (isFriendMoyo && state.allScopeFilters && state.allScopeFilters.MOYO_PUBLIC === false) return false;
            if (getSelectedTargetId() === 'ALL') return true;
            return isEventMatchedToSelectedFriend(props, getSelectedTargetId());
        }

        function isEventMatchedToSelectedFriend(props, targetId) {
            if (!props || !targetId || String(targetId) === 'ALL') return true;
            const targetFriend = findFriendMetaById(targetId);
            const eventFriend = findCalendarOwnerFriendMeta(props);
            const ids = [
                getCalendarOwnerId(props),
                props.ownerUserId, props.OWNER_USER_ID,
                props.userId, props.USER_ID,
                props.ownerId, props.OWNER_ID,
                props.writerId, props.WRITER_ID,
                props.sharedByUserId, props.SHARED_BY_USER_ID,
                props.shareOwnerId, props.SHARE_OWNER_ID
            ].filter(function(id) { return id != null && String(id).trim() !== ''; }).map(function(id) { return String(id); });
            if (ids.indexOf(String(targetId)) >= 0) return true;

            const targetEmail = String(getFriendEmail(targetFriend) || '').trim().toLowerCase();
            const eventEmail = String(getCalendarEventOwnerEmail(props) || getFriendEmail(eventFriend) || '').trim().toLowerCase();
            if (targetEmail && eventEmail && targetEmail === eventEmail) return true;

            const targetName = String(getFriendName(targetFriend) || '').trim();
            const eventName = String(getCalendarEventOwnerName(props) || getFriendName(eventFriend) || '').trim();
            return !!(targetName && eventName && targetName === eventName);
        }

        function getRequestTypes() {
            const types = [];
            if (state.scope === 'ALL') {
                types.push('PRIVATE', 'MOYO', 'WS', 'PROJ', 'TASK');
            } else if (state.scope === 'PRIVATE') {
                types.push('PRIVATE', 'MOYO');
            } else if (state.scope === 'FRIEND') {
                // 친구 탭에서는 친구가 직접 공유한 개인 일정과 MOYO 공개 일정을 함께 조회한다.
                types.push('PRIVATE', 'MOYO');
            } else {
                types.push(state.scope);
                if (state.scope === 'PROJ') types.push('TASK');
            }
            types.push('HOLIDAY');
            return types;
        }

        function normalizeRecurDays(value) {
            if (!value) return [];
            const dayMap = {
                SUN: 'su',
                MON: 'mo',
                TUE: 'tu',
                WED: 'we',
                THU: 'th',
                FRI: 'fr',
                SAT: 'sa'
            };
            return String(value).split(',')
                .map(function(day) { return dayMap[String(day).trim().toUpperCase()]; })
                .filter(Boolean);
        }


        function buildRRuleExDates(exceptionDateList, startVal) {
            if (!exceptionDateList) return [];
            const startTime = startVal && startVal.includes('T') ? startVal.split('T')[1].slice(0, 8) : '00:00:00';
            return String(exceptionDateList).split(',')
                .map(function(date) { return date.trim(); })
                .filter(Boolean)
                .map(function(date) { return date + 'T' + startTime; });
        }

        function extractTimePart(value) {
            if (!value) return '';
            const normalized = String(value).replace(' ', 'T');
            const match = normalized.match(/T(\d{2}:\d{2})(?::(\d{2}))?/);
            if (!match) return '';
            return match[1] + ':' + (match[2] || '00');
        }

        function toDateOnly(value) {
            if (!value) return '';
            return String(value).replace(' ', 'T').slice(0, 10);
        }

        function addDaysToDateOnly(value, days) {
            const dateOnly = toDateOnly(value);
            if (!dateOnly) return '';
            const parts = dateOnly.split('-').map(Number);
            if (parts.length !== 3 || parts.some(isNaN)) return dateOnly;
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            date.setDate(date.getDate() + days);
            return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
        }

        function getInclusiveAllDayDuration(startVal, endVal) {
            const startDate = toDateOnly(startVal);
            const endDate = toDateOnly(endVal || startVal);
            if (!startDate || !endDate) return 1;
            const startParts = startDate.split('-').map(Number);
            const endParts = endDate.split('-').map(Number);
            if (startParts.length !== 3 || endParts.length !== 3 || startParts.some(isNaN) || endParts.some(isNaN)) return 1;
            const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
            const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
            return Math.max(diffDays + 1, 1);
        }


        function getEventSortDateValue(event, key) {
            if (!event) return 0;
            const value = event[key] || (event._instance && event._instance.range ? event._instance.range[key] : null);
            if (!value) return 0;
            if (value instanceof Date) return value.getTime();
            const time = new Date(value).getTime();
            return isNaN(time) ? 0 : time;
        }

        function getCalendarEventSortPriority(event) {
            const props = event && event.extendedProps ? event.extendedProps : {};
            const displayType = props.displayType || getDisplayType(props.type, props);
            if (displayType === 'HOLIDAY') return -20;
            const projectKind = getProjectCalendarKind(props);
            if (projectKind === 'PROJECT_PERIOD') return -5;
            if (projectKind === 'MILESTONE') return 4;
            if (projectKind === 'TASK_DUE' || projectKind === 'TASK_ASSIGNED') return 5;

            const startTime = getEventSortDateValue(event, 'start');
            const endTime = getEventSortDateValue(event, 'end');
            const isMultiDay = startTime && endTime && toDateOnly(event.start) !== toDateOnly(event.end);
            if (event && event.allDay) return isMultiDay ? 0 : 1;
            if (isMultiDay) return 2;
            return 10;
        }

        function compareCalendarEvents(a, b) {
            const priorityDiff = getCalendarEventSortPriority(a) - getCalendarEventSortPriority(b);
            if (priorityDiff !== 0) return priorityDiff;

            const startDiff = getEventSortDateValue(a, 'start') - getEventSortDateValue(b, 'start');
            if (startDiff !== 0) return startDiff;

            const titleA = (a && a.title ? a.title : '').toString();
            const titleB = (b && b.title ? b.title : '').toString();
            return titleA.localeCompare(titleB, 'ko');
        }

        function mapServerEvent(item) {
            const itemType = item.itemType || item.itemtype || item.ITEMTYPE || 'PRIVATE';
            const isMoyoPublic = isMoyoSharedEvent(item);
            let displayType = getDisplayType(itemType, item);
            const isReceivedPrivateEvent = displayType === 'PRIVATE' && isReceivedPrivateCalendarEvent(item);
            if (isReceivedPrivateEvent) displayType = 'FRIEND';
            const isHoliday = displayType === 'HOLIDAY';
            let startVal = item.startDt || item.startdt || item.STARTDT;
            let endVal = item.endDt || item.enddt || item.ENDDT;
            const isLunar = (item.isLunar || item.IS_LUNAR) === 'Y';

            if (startVal && startVal.includes(' ')) startVal = startVal.replace(' ', 'T');
            if (endVal && endVal.includes(' ')) endVal = endVal.replace(' ', 'T');
            const originalStartDt = startVal || '';
            const originalEndDt = endVal || '';

            const explicitAllDay = String(item.allDay || item.ALL_DAY || '').toUpperCase() === 'Y';
            const startTimePart = extractTimePart(startVal);
            const endTimePart = extractTimePart(endVal);
            const looksAllDayRange = startTimePart === '00:00:00' && (
                endTimePart === '23:59:00' ||
                endTimePart === '23:59:59' ||
                (endTimePart === '00:00:00' && startVal && endVal && startVal.slice(0, 10) !== endVal.slice(0, 10))
            );
            const isAllDay = explicitAllDay || isLunar || isHoliday || looksAllDayRange;
            const color = typeColors[displayType] || item.color || typeColors.PRIVATE;

            const eventObj = {
                id: item.id,
                title: item.title || '제목 없음',
                allDay: isAllDay,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: '#1f2a44',
                extendedProps: {
                    type: itemType,
                    displayType: displayType,
                    sourceColor: item.color || color,
                    rawTitle: item.title || item.TITLE || '',
                    itemType: itemType,
                    eventType: item.eventType || item.EVENT_TYPE || item.calendarEventType || item.CALENDAR_EVENT_TYPE,
                    visibilityType: item.visibilityType || item.VISIBILITY_TYPE,
                    isPrivate: item.isPrivate || item.IS_PRIVATE,
                    allDay: item.allDay || item.ALL_DAY,
                    timezone: item.timezone || item.TIMEZONE || 'Asia/Seoul',
                    locationText: item.locationText || item.LOCATION_TEXT,
                    locationAddress: item.locationAddress || item.LOCATION_ADDRESS,
                    locationLat: item.locationLat || item.LOCATION_LAT,
                    locationLng: item.locationLng || item.LOCATION_LNG,
                    locationPlaceId: item.locationPlaceId || item.LOCATION_PLACE_ID,
                    descriptionText: item.descriptionText || item.DESCRIPTION_TEXT,
                    isMoyoPublic: isMoyoPublic,
                    isReceivedPrivateEvent: isReceivedPrivateEvent,
                    ownerUserId: item.userId || item.USER_ID || item.ownerId || item.OWNER_ID || item.writerId || item.WRITER_ID,
                    ownerName: item.ownerName || item.OWNER_NAME || item.writerName || item.WRITER_NAME || item.creatorName || item.CREATOR_NAME || item.userName || item.USER_NAME || item.name || item.NAME,
                    ownerProfileImagePath: item.ownerProfileImagePath || item.OWNER_PROFILE_IMAGE_PATH || item.ownerImagePath || item.OWNER_IMAGE_PATH || item.writerProfileImagePath || item.WRITER_PROFILE_IMAGE_PATH || item.profileImagePath || item.PROFILE_IMAGE_PATH || item.userImagePath || item.USER_IMAGE_PATH || item.avatarUrl || item.AVATAR_URL || item.imagePath || item.IMAGE_PATH,
                    ownerEmail: item.ownerEmail || item.OWNER_EMAIL || item.writerEmail || item.WRITER_EMAIL || item.userEmail || item.USER_EMAIL || item.email || item.EMAIL,
                    sharedByUserId: item.sharedByUserId || item.SHARED_BY_USER_ID || item.shareOwnerId || item.SHARE_OWNER_ID || item.sharedUserId || item.SHARED_USER_ID,
                    sharedByName: item.sharedByName || item.SHARED_BY_NAME || item.shareOwnerName || item.SHARE_OWNER_NAME,
                    sharedByEmail: item.sharedByEmail || item.SHARED_BY_EMAIL || item.shareOwnerEmail || item.SHARE_OWNER_EMAIL,
                    sharedByProfileImagePath: item.sharedByProfileImagePath || item.SHARED_BY_PROFILE_IMAGE_PATH || item.shareOwnerProfileImagePath || item.SHARE_OWNER_PROFILE_IMAGE_PATH,
                    shareRelation: item.shareRelation || item.SHARE_RELATION,
                    shareStatus: item.shareStatus || item.SHARE_STATUS,
                    shareId: item.shareId || item.SHARE_ID || item.receivedShareId || item.RECEIVED_SHARE_ID,
                    canEditYn: item.canEditYn || item.CAN_EDIT_YN,
                    isRecurring: item.isRecurring || item.IS_RECURRING || 'N',
                    recurGroupId: item.recurGroupId || item.RECUR_GROUP_ID,
                    isLunar: item.isLunar || item.IS_LUNAR,
                    lunarMonth: item.lunarMonth || item.LUNAR_MONTH,
                    lunarDay: item.lunarDay || item.LUNAR_DAY,
                    untilDt: item.untilDt || item.UNTIL_DT,
                    recurType: item.recurType || item.RECUR_TYPE,
                    recurInterval: item.recurInterval || item.RECUR_INTERVAL || 1,
                    recurDays: item.recurDays || item.RECUR_DAYS || '',
                    exceptionDateList: item.exceptionDateList || item.EXCEPTION_DATE_LIST || '',
                    originalStartDt: originalStartDt,
                    originalEndDt: originalEndDt,
                    wsId: item.wsId || item.WS_ID,
                    wsName: item.wsName || item.WS_NAME || item.workspaceName || item.WORKSPACE_NAME || item.groupName || item.GROUP_NAME,
                    wsImagePath: item.wsImagePath || item.WS_IMAGE_PATH || item.workspaceImagePath || item.WORKSPACE_IMAGE_PATH || item.groupImagePath || item.GROUP_IMAGE_PATH || item.wsProfileImagePath || item.WS_PROFILE_IMAGE_PATH || item.workspaceProfileImagePath || item.WORKSPACE_PROFILE_IMAGE_PATH || item.groupProfileImagePath || item.GROUP_PROFILE_IMAGE_PATH || item.wsLogoPath || item.WS_LOGO_PATH || item.workspaceLogoPath || item.WORKSPACE_LOGO_PATH || item.groupLogoPath || item.GROUP_LOGO_PATH || item.logoPath || item.LOGO_PATH,
                    projId: item.projId || item.PROJ_ID,
                    projName: item.projName || item.PROJ_NAME || item.projectName || item.PROJECT_NAME || item.projectTitle || item.PROJECT_TITLE,
                    projectWorkspaceName: item.projectWorkspaceName || item.PROJECT_WORKSPACE_NAME,
                    projectWorkspaceImagePath: item.projectWorkspaceImagePath || item.PROJECT_WORKSPACE_IMAGE_PATH || item.wsImagePath || item.WS_IMAGE_PATH,
                    projectScope: item.projectScope || item.PROJECT_SCOPE,
                    projectItemKind: item.projectItemKind || item.PROJECT_ITEM_KIND,
                    status: item.status || item.STATUS,
                    assigneeUserId: item.assigneeUserId || item.ASSIGNEE_USER_ID || item.userId || item.USER_ID,
                    assigneeName: item.assigneeName || item.ASSIGNEE_NAME || item.userName || item.USER_NAME,
                    assigneeEmail: item.assigneeEmail || item.ASSIGNEE_EMAIL,
                    assigneeProfileImagePath: item.assigneeProfileImagePath || item.ASSIGNEE_PROFILE_IMAGE_PATH,
                    actualStartDt: item.actualStartDt || item.ACTUAL_START_DT || item.actualStartDate || item.ACTUAL_START_DATE,
                    actualDoneDt: item.actualDoneDt || item.ACTUAL_DONE_DT || item.actualDoneDate || item.ACTUAL_DONE_DATE,
                    delayedYn: item.delayedYn || item.DELAYED_YN || 'N',
                    delayedCompletedYn: item.delayedCompletedYn || item.DELAYED_COMPLETED_YN || 'N',
                    delayedDays: Number(item.delayedDays || item.DELAYED_DAYS || 0),
                    startTimeSlot: item.startTimeSlot || item.START_TIME_SLOT,
                    endTimeSlot: item.endTimeSlot || item.END_TIME_SLOT
                }
            };
            eventObj.extendedProps.projectCalendarKind = getProjectCalendarKind(eventObj.extendedProps);
            if (eventObj.extendedProps.projectCalendarKind === 'PROJECT_PERIOD') {
                eventObj.title = eventObj.extendedProps.projName || eventObj.title;
                eventObj.allDay = true;
            }

            if ((item.isRecurring || item.IS_RECURRING) === 'Y' && (item.recurType || item.RECUR_TYPE) && !isLunar) {
                let rruleUntil = item.untilDt || item.UNTIL_DT;
                if (rruleUntil && !rruleUntil.includes('T')) rruleUntil += 'T23:59:59';
                const recurType = String(item.recurType || item.RECUR_TYPE || '').toLowerCase();
                const rrule = {
                    freq: recurType,
                    dtstart: startVal,
                    until: rruleUntil,
                    interval: Number(item.recurInterval || item.RECUR_INTERVAL || 1) || 1
                };
                const recurDays = normalizeRecurDays(item.recurDays || item.RECUR_DAYS || '');
                if (recurType === 'weekly' && recurDays.length) {
                    rrule.byweekday = recurDays;
                }
                eventObj.rrule = rrule;
                if (isAllDay) {
                    eventObj.duration = { days: getInclusiveAllDayDuration(startVal, endVal) };
                }
                const exdates = buildRRuleExDates(item.exceptionDateList || item.EXCEPTION_DATE_LIST, startVal);
                if (exdates.length) eventObj.exdate = exdates;
            } else {
                if (isAllDay) {
                    eventObj.start = toDateOnly(startVal);
                    eventObj.end = addDaysToDateOnly(endVal || startVal, 1);
                } else {
                    eventObj.start = startVal;
                    if (itemType === 'TASK' && endVal) {
                        const endDate = new Date(endVal);
                        endDate.setDate(endDate.getDate() + 1);
                        eventObj.end = endDate;
                    } else {
                        eventObj.end = endVal || startVal;
                    }
                }
            }

            return eventObj;
        }

        function getDisplayType(type, props) {
            if (type === 'HOLIDAY') return 'HOLIDAY';
            if (type === 'MOYO') return 'PRIVATE';
            if (type === 'FRIEND') return 'FRIEND';
            if (type === 'WS') return 'WS';
            if (type === 'PROJ') return 'PROJ';
            if (type === 'TASK') {
                if (props && (props.projId || props.PROJ_ID)) return 'PROJ';
                if (props && (props.wsId || props.WS_ID)) return 'WS';
            }
            return 'PRIVATE';
        }

        function isMoyoSharedEvent(props) {
            if (!props) return false;
            const visibility = String(
                props.visibilityType || props.VISIBILITY_TYPE ||
                props.visibility || props.VISIBILITY ||
                props.shareScope || props.SHARE_SCOPE ||
                props.publicScope || props.PUBLIC_SCOPE || ''
            ).toUpperCase();
            const publicFlag = String(
                props.moyoPublicYn || props.MOYO_PUBLIC_YN ||
                props.isMoyoPublic || props.IS_MOYO_PUBLIC ||
                props.moyoYn || props.MOYO_YN || ''
            ).toUpperCase();
            const itemType = String(props.itemType || props.ITEM_TYPE || props.type || props.TYPE || '').toUpperCase();
            const isPrivateValue = String(props.isPrivate || props.IS_PRIVATE || '').toUpperCase();
            return visibility === 'MOYO' || visibility === 'MOYO_PUBLIC' || visibility === 'PUBLIC_MOYO' || publicFlag === 'Y' || publicFlag === 'TRUE' || (itemType === 'PRIVATE' && isPrivateValue === 'N');
        }

        function getCalendarOwnerId(props) {
            if (!props) return '';
            return props.sharedByUserId || props.SHARED_BY_USER_ID || props.shareOwnerId || props.SHARE_OWNER_ID ||
                props.userId || props.USER_ID || props.ownerId || props.OWNER_ID || props.writerId || props.WRITER_ID || props.ownerUserId || '';
        }

        function getCalendarEventOwnerEmail(props) {
            if (!props) return '';
            return props.sharedByEmail || props.SHARED_BY_EMAIL || props.shareOwnerEmail || props.SHARE_OWNER_EMAIL ||
                props.ownerEmail || props.OWNER_EMAIL || props.writerEmail || props.WRITER_EMAIL || props.userEmail || props.USER_EMAIL || props.email || props.EMAIL || '';
        }

        function getFriendName(friend) {
            if (!friend) return '';
            return friend.userName || friend.USER_NAME || friend.friendName || friend.FRIEND_NAME || friend.name || friend.NAME ||
                friend.nickName || friend.NICK_NAME || friend.nickname || friend.NICKNAME || friend.displayName || friend.DISPLAY_NAME || '';
        }

        function getFriendEmail(friend) {
            if (!friend) return '';
            return friend.userEmail || friend.USER_EMAIL || friend.friendEmail || friend.FRIEND_EMAIL || friend.email || friend.EMAIL || '';
        }

        function getFriendImage(friend) {
            if (!friend) return '';
            return friend.profileImagePath || friend.PROFILE_IMAGE_PATH || friend.profileImage || friend.PROFILE_IMAGE ||
                friend.userProfileImagePath || friend.USER_PROFILE_IMAGE_PATH || friend.friendProfileImagePath || friend.FRIEND_PROFILE_IMAGE_PATH ||
                friend.userImagePath || friend.USER_IMAGE_PATH || friend.friendImagePath || friend.FRIEND_IMAGE_PATH ||
                friend.imagePath || friend.IMAGE_PATH || friend.avatarUrl || friend.AVATAR_URL || '';
        }

        function findFriendMetaById(userId) {
            if (!userId) return null;
            const targetId = String(userId);
            const friends = state && state.friends ? state.friends : [];
            for (let i = 0; i < friends.length; i++) {
                const friend = friends[i] || {};
                const ids = [
                    friend.friendId, friend.FRIEND_ID,
                    friend.userId, friend.USER_ID,
                    friend.friendUserId, friend.FRIEND_USER_ID,
                    friend.targetUserId, friend.TARGET_USER_ID,
                    friend.memberId, friend.MEMBER_ID,
                    friend.id, friend.ID
                ];
                if (ids.some(function(id) { return id != null && String(id) === targetId; })) return friend;
            }
            return null;
        }

        function findFriendMetaByEmail(email) {
            if (!email) return null;
            const targetEmail = String(email).trim().toLowerCase();
            if (!targetEmail) return null;
            const friends = state && state.friends ? state.friends : [];
            for (let i = 0; i < friends.length; i++) {
                const friend = friends[i] || {};
                const friendEmail = String(getFriendEmail(friend) || '').trim().toLowerCase();
                if (friendEmail && friendEmail === targetEmail) return friend;
            }
            return null;
        }

        function findFriendMetaByName(name) {
            if (!name) return null;
            const targetName = String(name).trim();
            if (!targetName || targetName === '친구') return null;
            const friends = state && state.friends ? state.friends : [];
            for (let i = 0; i < friends.length; i++) {
                const friend = friends[i] || {};
                if (String(getFriendName(friend) || '').trim() === targetName) return friend;
            }
            return null;
        }

        function findCalendarOwnerFriendMeta(props) {
            if (!props) return null;
            return findFriendMetaById(props.sharedByUserId || props.SHARED_BY_USER_ID || props.shareOwnerId || props.SHARE_OWNER_ID) ||
                findFriendMetaById(props.ownerUserId || props.OWNER_USER_ID || props.userId || props.USER_ID || props.ownerId || props.OWNER_ID || props.writerId || props.WRITER_ID) ||
                findFriendMetaByEmail(getCalendarEventOwnerEmail(props)) ||
                findFriendMetaByName(props.sharedByName || props.SHARED_BY_NAME || props.shareOwnerName || props.SHARE_OWNER_NAME || props.ownerName || props.OWNER_NAME || props.writerName || props.WRITER_NAME || props.userName || props.USER_NAME || props.name || props.NAME);
        }

        function getCalendarEventOwnerName(props) {
            if (!props) return '';
            const friend = findCalendarOwnerFriendMeta(props);
            const friendName = getFriendName(friend);
            const directName = props.sharedByName || props.SHARED_BY_NAME || props.shareOwnerName || props.SHARE_OWNER_NAME ||
                props.ownerName || props.OWNER_NAME || props.writerName || props.WRITER_NAME || props.creatorName || props.CREATOR_NAME ||
                props.userName || props.USER_NAME || props.name || props.NAME || '';
            if (friendName && (!directName || directName === '친구')) return friendName;
            return directName || friendName || '';
        }

        function getCalendarEventOwnerImage(props) {
            if (!props) return '';
            const directImage = props.sharedByProfileImagePath || props.SHARED_BY_PROFILE_IMAGE_PATH || props.shareOwnerProfileImagePath || props.SHARE_OWNER_PROFILE_IMAGE_PATH ||
                props.ownerProfileImagePath || props.OWNER_PROFILE_IMAGE_PATH || props.ownerImagePath || props.OWNER_IMAGE_PATH || props.writerProfileImagePath || props.WRITER_PROFILE_IMAGE_PATH ||
                props.profileImagePath || props.PROFILE_IMAGE_PATH || props.userImagePath || props.USER_IMAGE_PATH || props.avatarUrl || props.AVATAR_URL || props.imagePath || props.IMAGE_PATH || '';
            if (directImage) return directImage;
            return getFriendImage(findCalendarOwnerFriendMeta(props));
        }

        function getCalendarGroupName(props) {
            if (!props) return '';
            const directName = props.wsName || props.WS_NAME || props.workspaceName || props.WORKSPACE_NAME || props.groupName || props.GROUP_NAME || '';
            if (directName) return directName;
            const wsId = props.wsId || props.WS_ID || props.workspaceId || props.WORKSPACE_ID || props.groupId || props.GROUP_ID;
            const ws = findWorkspaceMetaById(wsId);
            return ws ? (ws.wsName || ws.WS_NAME || ws.workspaceName || ws.WORKSPACE_NAME || ws.groupName || ws.GROUP_NAME || ws.name || ws.NAME || '') : '';
        }

        function getCalendarProjectName(props) {
            if (!props) return '';
            const directName = props.projName || props.PROJ_NAME || props.projectName || props.PROJECT_NAME || '';
            if (directName) return directName;
            const proj = findProjectMetaById(props.projId || props.PROJ_ID || props.projectId || props.PROJECT_ID);
            return proj ? (proj.projName || proj.PROJ_NAME || proj.projectName || proj.PROJECT_NAME || proj.name || proj.NAME || '') : '';
        }

        function getCalendarProjectFullName(props) {
            if (!props) return '';
            const proj = findProjectMetaById(props.projId || props.PROJ_ID || props.projectId || props.PROJECT_ID);
            const groupName = getCalendarGroupName(props) || (proj ? (proj.wsName || proj.WS_NAME || proj.workspaceName || proj.WORKSPACE_NAME || proj.groupName || proj.GROUP_NAME || '') : '');
            const projectName = getCalendarProjectName(props);
            return [groupName, projectName].filter(Boolean).join(' · ');
        }

        function findWorkspaceMetaById(wsId) {
            if (!wsId) return null;
            const targetId = String(wsId);
            const spaces = state && state.userSpaces ? (state.userSpaces.workspaces || []) : [];
            for (let i = 0; i < spaces.length; i++) {
                const ws = spaces[i] || {};
                const currentId = ws.wsId || ws.WS_ID || ws.workspaceId || ws.WORKSPACE_ID || ws.groupId || ws.GROUP_ID || ws.id || ws.ID;
                if (currentId != null && String(currentId) === targetId) return ws;
            }
            return null;
        }

        function findProjectMetaById(projId) {
            if (!projId) return null;
            const targetId = String(projId);
            const projects = state && state.userSpaces ? (state.userSpaces.projects || []) : [];
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i] || {};
                const currentId = project.projId || project.PROJ_ID || project.projectId || project.PROJECT_ID || project.id || project.ID;
                if (currentId != null && String(currentId) === targetId) return project;
            }
            return null;
        }

        function getCalendarGroupImage(props) {
            if (!props) return '';
            const directImage = props.projectWorkspaceImagePath || props.PROJECT_WORKSPACE_IMAGE_PATH ||
                props.wsImagePath || props.WS_IMAGE_PATH ||
                props.workspaceImagePath || props.WORKSPACE_IMAGE_PATH ||
                props.groupImagePath || props.GROUP_IMAGE_PATH ||
                props.wsProfileImagePath || props.WS_PROFILE_IMAGE_PATH ||
                props.workspaceProfileImagePath || props.WORKSPACE_PROFILE_IMAGE_PATH ||
                props.groupProfileImagePath || props.GROUP_PROFILE_IMAGE_PATH ||
                props.wsLogoPath || props.WS_LOGO_PATH ||
                props.workspaceLogoPath || props.WORKSPACE_LOGO_PATH ||
                props.groupLogoPath || props.GROUP_LOGO_PATH ||
                props.logoPath || props.LOGO_PATH ||
                props.profileImagePath || props.PROFILE_IMAGE_PATH ||
                props.imagePath || props.IMAGE_PATH ||
                props.avatarUrl || props.AVATAR_URL || '';
            if (directImage) return directImage;

            const wsId = props.wsId || props.WS_ID || props.workspaceId || props.WORKSPACE_ID || props.groupId || props.GROUP_ID;
            const ws = findWorkspaceMetaById(wsId);
            if (!ws) return '';
            return ws.wsImagePath || ws.WS_IMAGE_PATH ||
                ws.workspaceImagePath || ws.WORKSPACE_IMAGE_PATH ||
                ws.groupImagePath || ws.GROUP_IMAGE_PATH ||
                ws.wsProfileImagePath || ws.WS_PROFILE_IMAGE_PATH ||
                ws.workspaceProfileImagePath || ws.WORKSPACE_PROFILE_IMAGE_PATH ||
                ws.groupProfileImagePath || ws.GROUP_PROFILE_IMAGE_PATH ||
                ws.wsLogoPath || ws.WS_LOGO_PATH ||
                ws.workspaceLogoPath || ws.WORKSPACE_LOGO_PATH ||
                ws.groupLogoPath || ws.GROUP_LOGO_PATH ||
                ws.logoPath || ws.LOGO_PATH ||
                ws.profileImagePath || ws.PROFILE_IMAGE_PATH ||
                ws.imagePath || ws.IMAGE_PATH ||
                ws.avatarUrl || ws.AVATAR_URL || '';
        }

        function renderCalendarEventAvatarMarkup(options) {
            const name = options.name || '';
            const image = normalizeImagePath(options.image || '');
            const title = escapeHtml(options.title || name || '프로필');
            const extraClass = options.extraClass ? ' ' + options.extraClass : '';
            if (image) {
                return '<span class="moyo-calendar-event-avatar' + extraClass + '" title="' + title + '" aria-label="' + title + '"><img src="' + escapeHtml(image) + '" alt=""></span>';
            }
            if (options.genericIcon) {
                return '<span class="moyo-calendar-event-avatar' + extraClass + '" title="' + title + '" aria-label="' + title + '"><i class="fa-solid fa-user" aria-hidden="true"></i></span>';
            }
            return '<span class="moyo-calendar-event-avatar' + extraClass + '" title="' + title + '" aria-label="' + title + '"><b>' + escapeHtml(String(name || '?').slice(0, 1)) + '</b></span>';
        }

        function shouldShowPrivateEventAvatar(props) {
            const scope = String((state && state.scope) || '').toUpperCase();
            return scope === 'ALL' || scope === 'MOYO';
        }

        function getCurrentUserAvatarName() {
            return currentUserMeta.name || '나';
        }

        function getCurrentUserAvatarImage() {
            return currentUserMeta.image || '';
        }

        function renderCalendarEventAvatar(props, displayType) {
            if (displayType === 'PRIVATE' && shouldShowPrivateEventAvatar(props)) {
                const userName = getCurrentUserAvatarName();
                return renderCalendarEventAvatarMarkup({
                    name: userName,
                    image: getCurrentUserAvatarImage(),
                    title: userName,
                    extraClass: 'is-private-avatar'
                });
            }
            if (displayType === 'FRIEND') {
                const ownerName = getCalendarEventOwnerName(props);
                const titleName = ownerName || '친구';
                const title = titleName;
                return renderCalendarEventAvatarMarkup({
                    name: ownerName,
                    image: getCalendarEventOwnerImage(props),
                    title: title,
                    genericIcon: !ownerName
                });
            }
            if (displayType === 'WS') {
                const groupName = getCalendarGroupName(props) || '그룹';
                return renderCalendarEventAvatarMarkup({
                    name: groupName,
                    image: getCalendarGroupImage(props),
                    title: groupName,
                    extraClass: 'is-group-avatar'
                });
            }
            if (displayType === 'PROJ') {
                const project = findProjectMetaById(props.projId || props.PROJ_ID || props.projectId || props.PROJECT_ID);
                const projectWsId = project ? (project.wsId || project.WS_ID || project.workspaceId || project.WORKSPACE_ID || project.groupId || project.GROUP_ID) : '';
                const groupProps = Object.assign({}, project || {}, props || {});
                if (!getCalendarGroupName(groupProps) && projectWsId) groupProps.wsId = projectWsId;
                const groupName = getCalendarGroupName(groupProps) || getCalendarGroupName(props) || '그룹';
                return renderCalendarEventAvatarMarkup({
                    name: groupName,
                    image: getCalendarGroupImage(groupProps),
                    title: groupName,
                    extraClass: 'is-group-avatar is-project-group-avatar'
                });
            }
            return '';
        }

        function isFriendOwnedEvent(props) {
            const ownerId = getCalendarOwnerId(props);
            return ownerId && sessionUserId && String(ownerId) !== String(sessionUserId);
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

            if (ownerYn === 'Y') return false;
            if (relation === 'DIRECT_RECEIVED' || relation === 'SCOPE_RECEIVED') return true;
            if (shareId && (shareStatus === '' || shareStatus === 'ACCEPTED' || shareStatus === 'PENDING')) return true;
            if (canEditYn === 'Y' && ownerYn === 'N') return true;
            return isFriendOwnedEvent(props);
        }

        function stabilizeCalendarRows() {
            if (!calendarEl) return;
            const viewEl = calendarEl.querySelector('.fc-dayGridMonth-view');
            if (!viewEl) return;

            const rows = viewEl.querySelectorAll('.fc-daygrid-body tbody tr');
            const rowCount = rows.length || 5;
            calendarEl.style.setProperty('--moyo-calendar-week-count', String(rowCount));

            const bodyTable = viewEl.querySelector('.fc-daygrid-body table');
            const bodyEl = viewEl.querySelector('.fc-daygrid-body');
            const bodyHeight = Math.floor((bodyTable || bodyEl || viewEl).getBoundingClientRect().height || 0);
            if (!bodyHeight || !rowCount) return;

            const rowHeight = Math.floor(bodyHeight / rowCount);
            if (rowHeight > 0) {
                calendarEl.style.setProperty('--moyo-calendar-row-height', rowHeight + 'px');
                rows.forEach(function(row) {
                    row.style.height = rowHeight + 'px';
                    row.style.maxHeight = rowHeight + 'px';
                    Array.prototype.forEach.call(row.children || [], function(cell) {
                        cell.style.height = rowHeight + 'px';
                        cell.style.maxHeight = rowHeight + 'px';
                    });
                });
                updateMonthDayMaxEventRows(rowHeight);
            }
        }


        function updateMonthDayMaxEventRows(rowHeight) {
            if (!calendar || !rowHeight) return;

            // 프로젝트 기간선은 하단 보조 정보라서 일정 수 계산을 과하게 잡아먹으면 안 된다.
            // 실제 셀 높이가 넉넉하면 일정을 더 보여주고, 좁을 때만 more가 뜨도록 보정한다.
            const nextRows = Math.max(4, Math.min(8, Math.floor((rowHeight - 4) / 21)));
            if (state.dynamicDayMaxEventRows === nextRows) return;
            state.dynamicDayMaxEventRows = nextRows;
            if (calendar.getOption('dayMaxEventRows') === nextRows) return;
            calendar.setOption('dayMaxEventRows', nextRows);
        }

        function updateCalendarTitle(info) {
            const current = calendar.getDate();
            const y = current.getFullYear();
            const m = current.getMonth() + 1;
            $('#calendarCurrentTitle').text(y + '년 ' + m + '월');
        }

        function highlightSelectedDate() {
            $('.fc-daygrid-day').removeClass('moyo-date-selected');
            const dateStr = formatDateOnly(state.selectedDate || new Date());
            $('.fc-daygrid-day[data-date="' + dateStr + '"]').addClass('moyo-date-selected');
        }

        function renderHolidayBadgesSoon() {
            requestAnimationFrame(function() {
                renderHolidayBadges();
            });
        }

        function renderHolidayBadges() {
            $('.moyo-holiday-date-badge').remove();
            $('.fc-daygrid-day').removeClass('moyo-holiday-day');
            if (!calendar) return;

            const added = new Set();
            calendar.getEvents().forEach(function(event) {
                const type = event.extendedProps.displayType || getDisplayType(event.extendedProps.type, event.extendedProps);
                if (type !== 'HOLIDAY') return;

                const startDate = event.start;
                if (!startDate) return;
                const dateStr = formatDateOnly(startDate);
                if (added.has(dateStr + '|' + event.title)) return;
                added.add(dateStr + '|' + event.title);

                const $cell = $('.fc-daygrid-day[data-date="' + dateStr + '"]');
                const $top = $cell.find('.fc-daygrid-day-top').first();
                if (!$top.length) return;

                $cell.addClass('moyo-holiday-day');
                const $badge = $('<span class="moyo-holiday-date-badge"></span>').text(event.title || '공휴일');
                $top.prepend($badge);
            });
        }

        function stabilizeCalendarWidth() {
            if (!calendar) return;
            requestAnimationFrame(function() {
                calendar.updateSize();
                renderHolidayBadges();
                renderProjectPeriodStatus();
                setTimeout(function() { calendar.updateSize(); renderHolidayBadges(); renderProjectPeriodStatus(); }, 80);
            });
        }


        function getVisibleMonthProjectPeriods() {
            if (!calendar || state.scope !== 'ALL') return [];
            if (state.allScopeFilters && state.allScopeFilters.PROJ === false) return [];

            const view = calendar.view || {};
            const viewStart = view.currentStart || view.activeStart;
            const viewEnd = view.currentEnd || view.activeEnd;
            if (!viewStart || !viewEnd) return [];

            const seen = new Set();
            const results = [];
            (state.calendarSourceEvents || []).forEach(function(event) {
                const props = event.extendedProps || {};
                if (getProjectCalendarKind(props) !== 'PROJECT_PERIOD') return;

                const start = event.start instanceof Date ? event.start : parseLocalDate(event.start);
                const endValue = event.end || event.start;
                const end = endValue instanceof Date ? endValue : parseLocalDate(endValue);
                if (!start || !end) return;
                if (end < viewStart || start >= viewEnd) return;

                const projectId = props.projId || props.PROJ_ID || props.projectId || props.PROJECT_ID;
                const projectName = props.projName || props.projectName || event.title || '프로젝트';
                const key = projectId ? 'ID:' + projectId : 'NAME:' + projectName;
                if (seen.has(key)) return;
                seen.add(key);
                results.push(event);
            });
            return results;
        }

        function renderAllProjectOverview() {
            const $toolbar = $('.moyo-calendar-board .fc-header-toolbar').first();
            if (!$toolbar.length) return;

            $toolbar.find('.moyo-all-project-overview').remove();
            if (state.scope !== 'ALL') return;

            const periods = getVisibleMonthProjectPeriods();
            if (!periods.length) return;

            const count = periods.length;
            const label = '진행 중인 프로젝트 ' + count + '개';
            const $item = $('<button type="button" class="moyo-all-project-overview" title="프로젝트 탭에서 기간을 확인하세요."></button>');
            $item.append('<span class="moyo-all-project-overview-dot" aria-hidden="true"></span>');
            $item.append('<span class="moyo-all-project-overview-text">' + escapeHtml(label) + '</span>');
            $item.on('click', function() {
                const $projectTab = $('.moyo-chip[data-scope="PROJ"]');
                if ($projectTab.length) $projectTab.trigger('click');
            });

            const $leftChunk = $toolbar.find('.fc-toolbar-chunk').first();
            $leftChunk.append($item);
        }

        function renderProjectPeriodStatusSoon() {
            clearTimeout(state.projectPeriodStatusTimer);
            state.projectPeriodStatusTimer = setTimeout(function() {
                renderProjectPeriodStatus();
                // FullCalendar가 successCallback 이후 내부 DOM을 한 번 더 정리하는 경우가 있어
                // 하단 프로젝트 상태 표시가 먼저 붙었다가 지워질 수 있다. 렌더 완료 후 재부착한다.
                setTimeout(renderProjectPeriodStatus, 80);
                setTimeout(renderProjectPeriodStatus, 220);
            }, 0);
        }


        function renderProjectPeriodsInMorePopover(date) {
            const dateStr = formatDateOnly(date);
            if (!dateStr) return;
            const periods = getProjectPeriodsOnDate(dateStr);
            if (!periods.length) return;

            const $popover = $('.fc-popover').last();
            const $body = $popover.find('.fc-popover-body').first();
            if (!$body.length) return;
            if ($body.find('.moyo-more-project-periods').length) return;

            const title = periods.length === 1 ? '진행 중인 프로젝트' : '진행 중인 프로젝트 ' + periods.length;
            const $wrap = $('<div class="moyo-more-project-periods"></div>');
            $wrap.append('<div class="moyo-more-project-periods-title">' + escapeHtml(title) + '</div>');

            periods.forEach(function(event) {
                const props = event.extendedProps || {};
                const projectTitle = getCalendarDisplayTitle(event);
                const path = getProjectCalendarPathText(props) || projectTitle;
                const period = projectPeriodText(event);
                const groupName = getCalendarGroupName(props) || projectTitle;
                const groupImage = getCalendarGroupImage(props);
                const avatar = renderCalendarEventAvatarMarkup({
                    name: groupName,
                    image: groupImage,
                    title: path,
                    extraClass: 'is-group-avatar is-more-project-avatar'
                });
                const $row = $('<button type="button" class="moyo-more-project-period-row" title="' + escapeHtml(path + (period ? '\n프로젝트 기간 · ' + period : '')) + '"></button>');
                $row.append(avatar + '<span class="moyo-more-project-period-text"><strong>' + escapeHtml(projectTitle) + '</strong><small>' + escapeHtml(period ? '프로젝트 기간 · ' + period : path) + '</small></span>');
                $row.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    state.selectedDate = parseLocalDate(dateStr);
                    highlightSelectedDate();
                    renderSelectedDatePanel();
                    $('.fc-popover').remove();
                    handleEventOpen(event);
                });
                $wrap.append($row);
            });

            $body.prepend($wrap);
        }

        function renderProjectPeriodStatus() {
            // 프로젝트 기간은 FullCalendar의 다중일정 바로 직접 렌더링한다.
            $('.moyo-calendar-board .moyo-day-project-status').remove();
            $('.moyo-project-period-row-line').remove();
            return;
            const $cells = $('.moyo-calendar-board .fc-daygrid-day[data-date]');
            if (!$cells.length) return;

            $cells.find('.moyo-day-project-status').remove();
            $('.moyo-project-period-row-line').remove();
            const activeProjectPeriodDateMap = {};

            $cells.each(function() {
                const $cell = $(this);
                const dateStr = $cell.attr('data-date');
                if (!dateStr) return;

                const periods = getProjectPeriodsOnDate(dateStr);
                if (!periods.length) return;
                activeProjectPeriodDateMap[dateStr] = periods;

                const previousDateStr = addDaysToDate(dateStr, -1);
                const previousPeriods = getProjectPeriodsOnDate(previousDateStr);
                const changeInfo = getProjectPeriodChangeInfo(periods, previousPeriods);
                const shouldShowProjectLabel = changeInfo.changed || periods.some(function(event) {
                    return isProjectPeriodLabelDate(event, dateStr);
                });

                const first = periods[0];
                const firstProps = first.extendedProps || {};
                const title = getCalendarDisplayTitle(first);
                const projectText = getProjectPeriodStatusText(periods, changeInfo, shouldShowProjectLabel);
                const projectPath = periods.map(function(event) {
                    return getProjectCalendarPathText(event.extendedProps || {}) || getCalendarDisplayTitle(event);
                }).join('\n');
                const periodText = periods.length === 1 ? projectPeriodText(first) : '';
                const tooltip = projectPath + (periodText ? '\n프로젝트 기간 · ' + periodText : '') + (changeInfo.changeText ? '\n변경 · ' + changeInfo.changeText : '');
                const $status = $('<button type="button" class="moyo-day-project-status" title="' + escapeHtml(tooltip) + '"></button>');

                if (shouldShowProjectLabel) {
                    $status.addClass('has-label');
                    if (changeInfo.changeText && previousPeriods.length) {
                        $status.addClass('is-change-only');
                        $status.append('<span class="moyo-project-status-change-mark" aria-hidden="true">' + escapeHtml(changeInfo.changeText) + '</span>');
                    } else {
                        const groupImage = periods.length === 1 ? getCalendarGroupImage(firstProps) : '';
                        const groupName = periods.length === 1 ? getCalendarGroupName(firstProps) : '프로젝트';
                        const avatar = periods.length === 1 ? renderCalendarEventAvatarMarkup({
                            name: groupName || title,
                            image: groupImage,
                            title: projectPath || title,
                            extraClass: 'is-group-avatar is-project-status-avatar'
                        }) : '<span class="moyo-project-status-count-dot" aria-hidden="true"></span>';
                        $status.append(avatar + '<span class="moyo-day-project-status-text">' + escapeHtml(projectText) + '</span>');
                    }
                } else {
                    $status.addClass('is-line-only');
                    $status.attr('aria-label', (periods.length === 1 ? title : '프로젝트 ' + periods.length) + ' 진행 중');
                }
                $status.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    state.selectedDate = parseLocalDate(dateStr);
                    highlightSelectedDate();
                    renderSelectedDatePanel();
                });
                const $frame = $cell.find('.fc-daygrid-day-frame').first();
                $frame.append($status);
                applyProjectStatusLabelWidth($status[0], $cell[0]);
            });

            renderProjectPeriodRowLines(activeProjectPeriodDateMap);
        }

        function applyProjectStatusLabelWidth(statusEl, cellEl) {
            if (!statusEl || !cellEl) return;
            const textEl = statusEl.querySelector('.moyo-day-project-status-text');
            if (!textEl) return;
            const rowEl = cellEl.closest('tr');
            const frameEl = cellEl.querySelector('.fc-daygrid-day-frame') || cellEl;
            const rowRect = (rowEl || frameEl).getBoundingClientRect();
            const textRect = textEl.getBoundingClientRect();
            if (!rowRect.width || !textRect.left) return;
            const rightLimit = rowRect.right - 8;
            const available = Math.floor(rightLimit - textRect.left);
            const max = Math.max(46, Math.min(260, available));
            textEl.style.maxWidth = max + 'px';
        }

        function renderProjectPeriodRowLines(activeDateMap) {
            $('.moyo-project-period-row-line').remove();
            const calendarRoot = document.getElementById('moyoCalendar');
            if (!calendarRoot || !activeDateMap) return;

            const rootRect = calendarRoot.getBoundingClientRect();
            const rows = document.querySelectorAll('.moyo-calendar-board .fc-daygrid-body tbody tr');
            rows.forEach(function(row) {
                const cells = Array.prototype.slice.call(row.querySelectorAll('.fc-daygrid-day[data-date]'));
                let startCell = null;
                let endCell = null;

                const flushLine = function() {
                    if (!startCell || !endCell) return;
                    const startFrame = startCell.querySelector('.fc-daygrid-day-frame') || startCell;
                    const endFrame = endCell.querySelector('.fc-daygrid-day-frame') || endCell;
                    const startRect = startFrame.getBoundingClientRect();
                    const endRect = endFrame.getBoundingClientRect();
                    if (!startRect.width || !endRect.width) {
                        startCell = null;
                        endCell = null;
                        return;
                    }

                    const lineTop = Math.round(startRect.bottom - rootRect.top - 18);
                    const lineStart = Math.round(startRect.left - rootRect.left);
                    const lineEnd = Math.round(endRect.right - rootRect.left);
                    const blockers = cells.filter(function(cell) {
                        const dateStr = cell.getAttribute('data-date');
                        if (!dateStr || !activeDateMap[dateStr]) return false;
                        return !!cell.querySelector('.moyo-day-project-status.has-label, .moyo-day-project-status.is-change-only');
                    }).map(function(cell) {
                        const status = cell.querySelector('.moyo-day-project-status.has-label, .moyo-day-project-status.is-change-only');
                        if (!status) return null;

                        // 라벨/변경표시 버튼은 셀 전체 폭을 갖지만, 선이 피해야 하는 영역은
                        // 실제로 보이는 프로필/텍스트/+1/-1 부분뿐이다. status 전체 rect를 쓰면
                        // 해당 셀 전체가 빈칸처럼 잘려 보여서 선이 끊긴다.
                        const visibleParts = Array.prototype.slice.call(status.querySelectorAll(
                            '.moyo-calendar-event-avatar, .moyo-day-project-status-text, .moyo-project-status-count-dot, .moyo-project-status-change-mark'
                        )).filter(function(part) {
                            const style = window.getComputedStyle(part);
                            const rect = part.getBoundingClientRect();
                            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
                        });
                        if (!visibleParts.length) return null;

                        let left = Infinity;
                        let right = -Infinity;
                        visibleParts.forEach(function(part) {
                            const rect = part.getBoundingClientRect();
                            left = Math.min(left, rect.left);
                            right = Math.max(right, rect.right);
                        });
                        if (!isFinite(left) || !isFinite(right) || right <= left) return null;

                        const pad = 4;
                        return {
                            left: Math.max(lineStart, Math.round(left - rootRect.left) - pad),
                            right: Math.min(lineEnd, Math.round(right - rootRect.left) + pad)
                        };
                    }).filter(Boolean).sort(function(a, b) { return a.left - b.left; });

                    let cursor = lineStart;
                    const appendLine = function(from, to) {
                        if (to - from < 2) return;
                        const line = document.createElement('span');
                        line.className = 'moyo-project-period-row-line';
                        line.setAttribute('aria-hidden', 'true');
                        line.style.left = from + 'px';
                        line.style.top = lineTop + 'px';
                        line.style.width = Math.max(1, to - from) + 'px';
                        calendarRoot.appendChild(line);
                    };

                    blockers.forEach(function(blocker) {
                        appendLine(cursor, blocker.left);
                        cursor = Math.max(cursor, blocker.right);
                    });
                    appendLine(cursor, lineEnd);

                    startCell = null;
                    endCell = null;
                };

                cells.forEach(function(cell) {
                    const dateStr = cell.getAttribute('data-date');
                    if (dateStr && activeDateMap[dateStr]) {
                        if (!startCell) startCell = cell;
                        endCell = cell;
                    } else {
                        flushLine();
                    }
                });
                flushLine();
            });
        }

        function getProjectPeriodsOnDate(dateStr) {
            if (!dateStr) return [];
            return (state.calendarSourceEvents || []).filter(function(event) {
                const props = event.extendedProps || {};
                return getProjectCalendarKind(props) === 'PROJECT_PERIOD'
                    && isProjectCalendarDisplayAllowed(props)
                    && matchesTargetFilter(event)
                    && eventOccursOnDate(event, dateStr);
            }).sort(compareCalendarEvents);
        }

        function getProjectPeriodKey(event) {
            const props = event && event.extendedProps ? event.extendedProps : {};
            const explicitId = props.projId || props.PROJ_ID || props.projectId || props.PROJECT_ID || props.id || props.ID;
            if (explicitId != null && explicitId !== '') return 'P:' + explicitId;
            return 'T:' + (getProjectCalendarPathText(props) || getCalendarDisplayTitle(event));
        }

        function getProjectPeriodChangeInfo(currentPeriods, previousPeriods) {
            const currentKeys = currentPeriods.map(getProjectPeriodKey).sort();
            const previousKeys = previousPeriods.map(getProjectPeriodKey).sort();
            const added = currentKeys.filter(function(key) { return previousKeys.indexOf(key) === -1; });
            const removed = previousKeys.filter(function(key) { return currentKeys.indexOf(key) === -1; });
            const changed = added.length > 0 || removed.length > 0;
            let changeText = '';
            if (previousPeriods.length) {
                if (added.length && !removed.length) changeText = '+' + added.length;
                else if (removed.length && !added.length) changeText = '-' + removed.length;
                else if (changed) changeText = '변경';
            }
            return { changed: changed, added: added, removed: removed, changeText: changeText };
        }

        function getProjectPeriodStatusText(periods, changeInfo, shouldShowProjectLabel) {
            if (!periods || !periods.length) return '';
            if (!shouldShowProjectLabel) return '';
            // 변경 지점은 월간 본문에서 +1 / -1 / 변경만 짧게 보여주고,
            // 상세 정보는 hover/title과 오른쪽 패널에서 확인한다.
            if (changeInfo && changeInfo.changeText && changeInfo.changed) {
                return '';
            }
            if (periods.length === 1) {
                const title = getCalendarDisplayTitle(periods[0]);
                const period = projectPeriodText(periods[0]);
                return period ? title + ' · ' + period : title;
            }
            return '프로젝트 ' + periods.length;
        }

        function renderSelectedDateHeader() {
            const d = state.selectedDate || new Date();
            $('#selectedDateTitle').text((d.getMonth() + 1) + '월 ' + d.getDate() + '일');
            $('#selectedDateSub').text(['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + '요일');
        }

        function renderSelectedDatePanel() {
            renderSelectedDateHeader();
            const selected = state.selectedDate || new Date();
            const selectedStr = formatDateOnly(selected);
            const calendarEvents = calendar ? calendar.getEvents().filter(function(event) {
                return eventOccursOnDate(event, selectedStr) && matchesCalendarDisplayFilter(event);
            }) : [];
            const projectPeriodEvents = (state.calendarSourceEvents || []).filter(function(event) {
                const props = (event && event.extendedProps) || {};
                return getProjectCalendarKind(props) === 'PROJECT_PERIOD'
                    && eventOccursOnDate(event, selectedStr)
                    && matchesCalendarDisplayFilter(event);
            });
            const events = uniqueSelectedDateEvents(projectPeriodEvents.concat(calendarEvents).sort(compareCalendarEvents));

            const $list = $('#selectedDateEvents');
            $list.empty();

            if (!events.length) {
                $list.append('<div class="moyo-day-empty">이 날짜에는 등록된 일정이 없습니다.<br>필요한 일정만 추가해 주세요.</div>');
                return;
            }

            if (state.scope === 'PROJ') {
                renderProjectSelectedDateSummary($list, events, selectedStr);
                return;
            }

            const groups = [
                { key: 'PROJECT_PERIOD', title: '진행 중인 프로젝트', events: [] },
                { key: 'MILESTONE', title: '마일스톤', events: [] },
                { key: 'TASK', title: '오늘 마감 할 일', events: [] },
                { key: 'SCHEDULE', title: '오늘 일정', events: [] }
            ];
            const groupMap = groups.reduce(function(map, group) {
                map[group.key] = group;
                return map;
            }, {});

            events.forEach(function(event) {
                const props = event.extendedProps || {};
                const kind = getProjectCalendarKind(props);
                if (kind === 'PROJECT_PERIOD') groupMap.PROJECT_PERIOD.events.push(event);
                else if (kind === 'MILESTONE') groupMap.MILESTONE.events.push(event);
                else if (kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED') groupMap.TASK.events.push(event);
                else groupMap.SCHEDULE.events.push(event);
            });

            groups.forEach(function(group) {
                appendSelectedDateGroup($list, group, group.key === 'SCHEDULE' ? 8 : 5);
            });
        }

        function renderProjectSelectedDateSummary($list, events, selectedStr) {
            const groups = [
                { key: 'DELAYED', title: '지연 업무', icon: 'fa-triangle-exclamation', events: [] },
                { key: 'IN_PROGRESS', title: '진행 중 업무', icon: 'fa-spinner', events: [] },
                { key: 'DUE_TODAY', title: '오늘 마감 업무', icon: 'fa-flag-checkered', events: [] },
                { key: 'DONE_TODAY', title: '오늘 완료 업무', icon: 'fa-circle-check', events: [] },
                { key: 'PROJECT_EVENT', title: '프로젝트 일정', icon: 'fa-calendar-day', events: [] }
            ];
            const groupMap = groups.reduce(function(map, group) {
                map[group.key] = group;
                return map;
            }, {});

            events.forEach(function(event) {
                const props = event.extendedProps || {};
                const kind = getProjectCalendarKind(props);
                const isTask = kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED';

                if (isTask) {
                    const status = getProjectTaskStatusInfo(props).key;
                    if (isProjectTaskDelayed(props)) groupMap.DELAYED.events.push(event);
                    if (status === 'IN_PROGRESS') groupMap.IN_PROGRESS.events.push(event);
                    if (projectTaskDateEquals(props.originalEndDt || event.end || event.start, selectedStr, !!event.allDay)) {
                        groupMap.DUE_TODAY.events.push(event);
                    }
                    if (status === 'DONE' && projectTaskDateEquals(props.actualDoneDt, selectedStr, false)) {
                        groupMap.DONE_TODAY.events.push(event);
                    }
                    return;
                }

                if (kind === 'PROJECT_EVENT' || kind === 'PROJECT_PERIOD' || kind === 'MILESTONE') {
                    groupMap.PROJECT_EVENT.events.push(event);
                }
            });

            groups.forEach(function(group) {
                group.events = uniqueSelectedDateEvents(group.events).sort(compareCalendarEvents);
                appendSelectedDateGroup($list, group, 6, true);
            });

            if (!$list.children().length) {
                $list.append('<div class="moyo-day-empty">선택한 조건에 해당하는 프로젝트 업무나 일정이 없습니다.</div>');
            }
        }

        function projectTaskDateEquals(value, selectedStr, allDayExclusiveEnd) {
            const date = normalizeCalendarDateValue(value);
            if (!date) return false;
            if (allDayExclusiveEnd) date.setDate(date.getDate() - 1);
            return formatDateOnly(date) === selectedStr;
        }

        function uniqueSelectedDateEvents(events) {
            const seen = {};
            return (events || []).filter(function(event) {
                const props = (event && event.extendedProps) || {};
                const kind = getProjectCalendarKind(props);
                const taskId = props.taskId || props.TASK_ID || props.eventId || props.EVENT_ID || event.id;
                const key = (kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED')
                    ? 'TASK:' + String(taskId || getCalendarDisplayTitle(event))
                    : String(kind || 'EVENT') + ':' + String(event.id || '') + ':' + formatDateOnly(event.start || new Date()) + ':' + getCalendarDisplayTitle(event);
                if (seen[key]) return false;
                seen[key] = true;
                return true;
            });
        }

        function appendSelectedDateGroup($list, group, limit, projectSummary) {
            if (!group || !group.events || !group.events.length) return;
            const visibleEvents = group.events.slice(0, limit || 5);
            const icon = projectSummary && group.icon ? '<i class="fa-solid ' + group.icon + '"></i>' : '';
            $list.append('<div class="moyo-day-section-title' + (projectSummary ? ' is-project-summary is-' + group.key.toLowerCase() : '') + '"><span>' + icon + escapeHtml(group.title) + '</span><strong>' + group.events.length + '</strong></div>');
            visibleEvents.forEach(function(event) {
                $list.append(buildSelectedDateEventCard(event, projectSummary ? group.key : ''));
            });
            if (group.events.length > visibleEvents.length) {
                $list.append('<div class="moyo-day-more-text">외 ' + (group.events.length - visibleEvents.length) + '개가 더 있습니다.</div>');
            }
        }

        function buildSelectedDateEventCard(event, summaryGroupKey) {
            const props = event.extendedProps || {};
            const type = props.displayType || getDisplayType(props.type, props);
            const kind = getProjectCalendarKind(props);
            const meta = selectedDateEventMeta(event, type);
            const title = getCalendarDisplayTitle(event);
            const kindClass = kind ? ' kind-' + kind : '';
            const cardTitle = kind === 'PROJECT_PERIOD' ? (getProjectCalendarPathText(props) || title) : title;
            const summaryClass = summaryGroupKey ? ' summary-' + String(summaryGroupKey).toLowerCase() : '';
            const $card = $('<div class="moyo-day-card type-' + type + kindClass + summaryClass + (props.isMoyoPublic ? ' is-moyo-public' : '') + '" title="' + escapeHtml(cardTitle) + '"></div>');
            const mascot = props.isMoyoPublic ? '<img class="moyo-day-mascot" src="' + moyoMascotPath + '" alt="MOYO 공개">' : '';
            const typeIcon = selectedDateEventTypeIcon(props);
            const projectPath = getProjectCalendarPathText(props);
            const projectAvatar = kind ? renderCalendarEventAvatarMarkup({
                name: getCalendarGroupName(props) || getCalendarProjectName(props) || title,
                image: getCalendarGroupImage(props),
                title: projectPath || title,
                extraClass: 'is-group-avatar is-day-project-avatar'
            }) : '';
            $card.append('<div class="moyo-day-card-title">' + projectAvatar + '<span class="moyo-day-card-title-text">' + escapeHtml(title) + (kind === 'PROJECT_PERIOD' ? '' : typeIcon) + '</span>' + mascot + '</div>');
            if (projectPath) {
                $card.append('<div class="moyo-day-card-path">' + escapeHtml(projectPath) + '</div>');
            }
            $card.append('<div class="moyo-day-card-meta"><i class="fa-regular fa-clock"></i><span>' + escapeHtml(meta) + '</span></div>');
            if (kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED') {
                $card.addClass('is-project-task-card');
                $card.append(buildProjectTaskDetailMarkup(event));
            }
            if (type !== 'HOLIDAY') {
                $card.on('click', function() { handleEventOpen(event); });
            }
            return $card;
        }

        function getProjectCalendarPathText(props) {
            const kind = getProjectCalendarKind(props);
            if (!kind) return '';
            const wsName = props.projectWorkspaceName || props.wsName || props.workspaceName || props.groupName || '';
            const projName = props.projName || props.projectName || '';
            if (wsName && projName) return wsName + ' · ' + projName;
            return projName || wsName || '';
        }

        function renderCalendarEventTypeIcon(props) {
            const rawType = String((props && (props.eventType || props.calendarEventType || props.EVENT_TYPE || props.CALENDAR_EVENT_TYPE)) || '').trim().toUpperCase();
            if (!rawType) return '';
            const meta = getCalendarEventTypeMeta(rawType);
            if (!meta || !meta.icon) return '';
            return '<span class="moyo-calendar-event-type-icon" title="' + escapeHtml(meta.label) + '" aria-label="' + escapeHtml(meta.label) + '">' + escapeHtml(meta.icon) + '</span>';
        }

        function selectedDateEventTypeIcon(props) {
            const rawType = String((props && (props.eventType || props.calendarEventType || props.EVENT_TYPE || props.CALENDAR_EVENT_TYPE)) || '').trim().toUpperCase();
            if (!rawType) return '';
            const meta = getCalendarEventTypeMeta(rawType);
            if (!meta || !meta.icon) return '';
            return '<span class="moyo-day-card-type-icon" title="' + escapeHtml(meta.label) + '" aria-label="' + escapeHtml(meta.label) + '">' + escapeHtml(meta.icon) + '</span>';
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
                HEALTH: { icon: '🏥', label: '병원' },
                MEDICAL: { icon: '🏥', label: '병원' },
                EXERCISE: { icon: '🏃', label: '운동' },
                WORKOUT: { icon: '🏃', label: '운동' },
                STUDY: { icon: '📚', label: '공부' },
                PAYMENT: { icon: '💳', label: '결제' },
                PAY: { icon: '💳', label: '결제' },
                BILL: { icon: '💳', label: '결제' },
                DELIVERY: { icon: '🚀', label: '배포' },
                DEPLOY: { icon: '🚀', label: '배포' },
                DEPLOYMENT: { icon: '🚀', label: '배포' },
                CLASS: { icon: '🏫', label: '수업' },
                LESSON: { icon: '🏫', label: '수업' },
                EXAM: { icon: '📝', label: '시험' },
                TEST: { icon: '📝', label: '시험' },
                SHOPPING: { icon: '🛒', label: '쇼핑' },
                PARCEL: { icon: '📦', label: '택배' },
                PACKAGE: { icon: '📦', label: '택배' },
                FAMILY: { icon: '🏠', label: '가족' },
                FRIEND: { icon: '👫', label: '친구' },
                REST: { icon: '🌙', label: '휴식' },
                BREAK: { icon: '🌙', label: '휴식' },
                VACATION: { icon: '🌙', label: '휴식' },
                CLEANING: { icon: '🧹', label: '청소' },
                CLEAN: { icon: '🧹', label: '청소' },
                REPAIR: { icon: '🛠️', label: '정비' },
                MAINTENANCE: { icon: '🛠️', label: '정비' },
                FIX: { icon: '🛠️', label: '정비' },
                '일반': { icon: '🗓️', label: '일반' },
                '약속': { icon: '🤝', label: '약속' },
                '회의': { icon: '👥', label: '회의' },
                '마감': { icon: '🚨', label: '마감' },
                '업무': { icon: '✅', label: '업무' },
                '할 일': { icon: '✅', label: '업무' },
                '알림': { icon: '🔔', label: '알림' },
                '생일': { icon: '🎂', label: '생일' },
                '기념일': { icon: '💝', label: '기념일' },
                '여행': { icon: '✈️', label: '여행' },
                '식사': { icon: '🍽️', label: '식사' },
                '카페': { icon: '☕', label: '카페' },
                '병원': { icon: '🏥', label: '병원' },
                '운동': { icon: '🏃', label: '운동' },
                '공부': { icon: '📚', label: '공부' },
                '결제': { icon: '💳', label: '결제' },
                '배포': { icon: '🚀', label: '배포' },
                '수업': { icon: '🏫', label: '수업' },
                '시험': { icon: '📝', label: '시험' },
                '쇼핑': { icon: '🛒', label: '쇼핑' },
                '택배': { icon: '📦', label: '택배' },
                '가족': { icon: '🏠', label: '가족' },
                '친구': { icon: '👫', label: '친구' },
                '휴식': { icon: '🌙', label: '휴식' },
                '청소': { icon: '🧹', label: '청소' },
                '정비': { icon: '🛠️', label: '정비' }
            };
            return map[key] || null;
        }

        function selectedDateEventMeta(event, type) {
            const props = event.extendedProps || {};
            const kind = getProjectCalendarKind(props);
            const parts = [];
            if (kind === 'PROJECT_PERIOD') {
                parts.push('프로젝트 기간');
                parts.push(projectPeriodText(event));
                return parts.filter(Boolean).join(' · ');
            }
            if (kind === 'MILESTONE') {
                parts.push('마일스톤');
            } else if (kind === 'TASK_DUE' || kind === 'TASK_ASSIGNED') {
                parts.push(kind === 'TASK_ASSIGNED' ? '내 담당 할 일' : '할 일 마감');
            } else if (props.isReceivedPrivateEvent) {
                parts.push(getCalendarEventOwnerName(props) || typeLabel(type));
            } else if (type === 'WS') {
                parts.push(getCalendarGroupName(props) || typeLabel(type));
            } else if (type === 'PROJ') {
                parts.push(getCalendarProjectFullName(props) || getCalendarProjectName(props) || typeLabel(type));
            } else {
                parts.push(typeLabel(type));
            }
            if (props.isMoyoPublic) parts.push('MOYO 공개');
            parts.push(eventTimeText(event));
            return parts.filter(Boolean).join(' · ');
        }

        function projectPeriodText(event) {
            const start = normalizeCalendarDateValue(event && event.start);
            if (!start) return '';
            let end = normalizeCalendarDateValue(event && event.end) || new Date(start.getTime());
            if (event && event.allDay && end > start) end.setDate(end.getDate() - 1);
            const startText = formatMonthDay(start);
            const endText = formatMonthDay(end);
            return startText === endText ? startText : startText + ' - ' + endText;
        }

        function isProjectPeriodLabelDate(event, dateStr) {
            const start = normalizeCalendarDateValue(event && event.start);
            if (!start || !dateStr) return false;
            const startStr = formatDateOnly(start);

            const visibleStart = getCurrentCalendarVisibleStart();
            const visibleStartStr = visibleStart ? formatDateOnly(visibleStart) : '';
            const labelDateStr = visibleStartStr && startStr < visibleStartStr ? visibleStartStr : startStr;

            // 프로젝트가 이전 달부터 이어지면 현재 달력에 보이는 첫 칸에서 한 번만 표시한다.
            // 예: 6/28~7/10 프로젝트를 7월 달력에서 볼 때 6/28 회색 칸에 라벨을 둔다.
            return dateStr === labelDateStr && eventOccursOnDate(event, dateStr);
        }

        function getCurrentCalendarVisibleStart() {
            if (!calendar || !calendar.view) return null;
            const activeStart = normalizeCalendarDateValue(calendar.view.activeStart);
            if (activeStart) return activeStart;
            const currentStart = normalizeCalendarDateValue(calendar.view.currentStart);
            if (currentStart) return currentStart;
            const currentDate = normalizeCalendarDateValue(calendar.getDate && calendar.getDate());
            if (!currentDate) return null;
            return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        }

        function getCurrentCalendarMonthStart() {
            if (!calendar || !calendar.view) return null;
            const currentStart = normalizeCalendarDateValue(calendar.view.currentStart);
            if (currentStart) return currentStart;
            const currentDate = normalizeCalendarDateValue(calendar.getDate && calendar.getDate());
            if (!currentDate) return null;
            return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        }

        function formatMonthDay(date) {
            const normalized = normalizeCalendarDateValue(date);
            if (!normalized) return '';
            return (normalized.getMonth() + 1) + '.' + normalized.getDate();
        }

        function eventOccursOnDate(event, dateStr) {
            const start = normalizeCalendarDateValue(event && event.start);
            if (!start || !dateStr) return false;
            let end = normalizeCalendarDateValue(event && event.end) || new Date(start.getTime());

            if (event && event.allDay && end > start) end.setDate(end.getDate() - 1);

            const startStr = formatDateOnly(start);
            const endStr = formatDateOnly(end);
            return dateStr >= startStr && dateStr <= endStr;
        }

        function normalizeCalendarDateValue(value) {
            if (!value) return null;
            if (value instanceof Date) return new Date(value.getTime());
            if (typeof value === 'string') {
                const normalized = value.indexOf(' ') > -1 ? value.replace(' ', 'T') : value;
                if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return parseLocalDate(normalized);
                const parsed = new Date(normalized);
                return isNaN(parsed.getTime()) ? null : parsed;
            }
            if (typeof value.getTime === 'function') {
                const parsed = new Date(value.getTime());
                return isNaN(parsed.getTime()) ? null : parsed;
            }
            return null;
        }

        function getCalendarEventTimePrefix(event) {
            if (!event || event.allDay || !event.start) return '';
            return pad(event.start.getHours()) + ':' + pad(event.start.getMinutes()) + ' ';
        }

        function eventTimeText(event) {
            if (event.allDay) return '종일';
            if (!event.start) return '시간 미정';
            const s = pad(event.start.getHours()) + ':' + pad(event.start.getMinutes());
            if (!event.end) return s;
            const e = pad(event.end.getHours()) + ':' + pad(event.end.getMinutes());
            return s + ' - ' + e;
        }

        function typeLabel(type) {
            if (type === 'MOYO') return 'MOYO 공개';
            if (type === 'FRIEND') return '친구';
            if (type === 'WS') return '그룹';
            if (type === 'PROJ') return '프로젝트';
            if (type === 'HOLIDAY') return '휴일';
            return '개인';
        }

        function handleEventOpen(event) {
            if (!event) return;
            const props = event.extendedProps || {};
            const type = props.displayType || getDisplayType(props.type, props);
            if (type === 'HOLIDAY') return;
            openCalendarEventByPermission(event);
        }

        function openCalendarEventByPermission(event) {
            const eventId = event && event.id;
            if (!eventId) return;
            if (window.MoyoCalendarEventPreview && typeof window.MoyoCalendarEventPreview.open === 'function') {
                window.MoyoCalendarEventPreview.open(eventId, {
                    source: 'calendar',
                    showActions: true,
                    onDeleted: function() {
                        if (calendar) calendar.refetchEvents();
                    },
                    onEdit: function(id) {
                        window.location.href = contextPath + '/calendar/event/form?mode=edit&eventId=' + encodeURIComponent(id || '');
                    }
                });
                return;
            }
            fetchEventDetail(eventId)
                .then(function(detail) {
                    showCalendarViewModal(detail, event);
                })
                .catch(function(error) {
                    alert(error && error.message ? error.message : '일정 정보를 불러오지 못했습니다.');
                });
        }

        function buildEventEditUrl(event) {
            const params = new URLSearchParams(buildEventEditParams(event));
            const query = params.toString();
            return contextPath + '/calendar/event/form' + (query ? '?' + query : '');
        }

        function fetchEventDetail(eventId) {
            return fetch(contextPath + '/api/calendar/detail?eventId=' + encodeURIComponent(eventId), { credentials: 'same-origin' })
                .then(function(response) {
                    if (!response.ok) throw new Error('일정 정보를 불러오지 못했습니다.');
                    return response.json();
                });
        }

        function buildEventEditParams(event) {
            const props = event.extendedProps || {};
            const itemType = props.type || props.itemType || 'PRIVATE';
            const params = {
                mode: 'edit',
                eventId: event.id || '',
                id: event.id || '',
                title: event.title || '',
                scopeType: itemType,
                itemType: itemType,
                startDt: props.originalStartDt || formatDateTimeParam(event.start),
                endDt: props.originalEndDt || formatDateTimeParam(event.end || event.start),
                allDay: event.allDay ? 'Y' : 'N',
                isLunar: props.isLunar || 'N',
                lunarMonth: props.lunarMonth || '',
                lunarDay: props.lunarDay || '',
                isRecurring: props.isRecurring || 'N',
                recurType: props.recurType || '',
                recurDays: props.recurDays || '',
                recurGroupId: props.recurGroupId || '',
                occurrenceDate: formatDateOnly(event.start),
                untilDt: props.untilDt || '',
                eventType: props.eventType || props.calendarEventType || 'APPOINTMENT',
                timezone: props.timezone || 'Asia/Seoul',
                locationText: props.locationText || '',
                locationAddress: props.locationAddress || '',
                locationLat: props.locationLat || '',
                locationLng: props.locationLng || '',
                locationPlaceId: props.locationPlaceId || '',
                descriptionText: props.descriptionText || ''
            };
            if (props.isMoyoPublic || props.visibilityType === 'MOYO' || props.isPrivate === 'N') {
                params.moyoPublic = 'Y';
                params.visibilityType = 'MOYO';
                params.isPrivate = 'N';
            }
            if (props.wsId) params.wsId = props.wsId;
            if (props.projId) params.projId = props.projId;
            return params;
        }

        function formatDateTimeParam(date) {
            if (!date) return '';
            return formatDateOnly(date) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
        }

        function showCalendarViewModal(detail, sourceEvent) {
            const modal = document.getElementById('calendarViewModal');
            if (!modal || !detail) return;
            const get = function() {
                return getDetailValue.apply(null, [detail].concat(Array.prototype.slice.call(arguments)));
            };
            const title = get('title', 'TITLE') || (sourceEvent && sourceEvent.title) || '제목 없는 일정';
            const itemType = get('itemType', 'ITEM_TYPE') || (sourceEvent && sourceEvent.extendedProps && sourceEvent.extendedProps.type) || 'PRIVATE';
            let displayType = getDisplayType(itemType, detail);
            if (displayType === 'PRIVATE' && isReceivedPrivateCalendarEvent(detail)) displayType = 'FRIEND';
            const isMoyoPublic = isMoyoSharedEvent(detail);
            const isCompactDetail = isCalendarViewCompactDetail(detail);
            const canEdit = get('canEditYn', 'CAN_EDIT_YN') === 'Y';
            const eventId = get('eventId', 'EVENT_ID') || (sourceEvent && sourceEvent.id);
            const accent = typeColors[displayType] || typeColors.PRIVATE;
            const card = modal.querySelector('.moyo-event-view-card');
            if (card) {
                card.style.setProperty('--event-accent', accent);
                card.style.setProperty('--event-accent-soft', hexToRgba(accent, 0.10));
                card.style.setProperty('--event-accent-border', hexToRgba(accent, 0.26));
                card.classList.remove('scope-PRIVATE', 'scope-FRIEND', 'scope-WS', 'scope-PROJ');
                card.classList.add('scope-' + displayType);
                card.classList.toggle('is-compact-detail', isCompactDetail);
            }

            document.getElementById('calendarViewTitle').textContent = title;
            const typeMeta = getCalendarViewTypeMeta(detail);
            const typeIconEl = document.getElementById('calendarViewTypeIcon');
            if (typeIconEl) {
                typeIconEl.textContent = typeMeta.icon;
                typeIconEl.setAttribute('title', typeMeta.label + ' 일정');
                typeIconEl.setAttribute('aria-label', typeMeta.label + ' 일정');
            }
            const metaEl = document.getElementById('calendarViewMeta');
            if (metaEl) {
                metaEl.textContent = '';
                const metaWrap = metaEl.closest('.moyo-event-view-kicker');
                if (metaWrap) metaWrap.hidden = true;
            }
            const mascot = document.getElementById('calendarViewMascot');
            const moyoBadge = document.getElementById('calendarViewMoyoBadge');
            if (mascot) mascot.src = moyoMascotPath;
            if (moyoBadge) moyoBadge.hidden = true;
            renderCalendarViewAuthor(detail, displayType, isMoyoPublic);
            renderCalendarViewTime(detail);
            renderCalendarViewLocation(detail);
            renderCalendarViewAttendees(detail);
            renderCalendarViewDescription(detail);


            const editBtn = document.getElementById('calendarViewEdit');
            if (editBtn) {
                editBtn.hidden = !canEdit;
                editBtn.onclick = function() {
                    window.location.href = contextPath + '/calendar/event/form?mode=edit&eventId=' + encodeURIComponent(eventId || '');
                };
            }
            setupCalendarViewDeleteButton(detail, eventId, canEdit);
            setupCalendarViewShareButton(detail, eventId);
            modal.hidden = false;
            document.body.classList.add('moyo-event-view-open');
        }

        function closeCalendarViewModal() {
            const modal = document.getElementById('calendarViewModal');
            if (modal) modal.hidden = true;
            document.body.classList.remove('moyo-event-view-open');
        }

        function bindCalendarViewModal() {
            const modal = document.getElementById('calendarViewModal');
            const closeBtn = document.getElementById('calendarViewClose');
            if (closeBtn) closeBtn.addEventListener('click', closeCalendarViewModal);
            if (modal) {
                modal.addEventListener('click', function(event) {
                    if (event.target === modal) closeCalendarViewModal();
                });
            }
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') closeCalendarViewModal();
            });
        }


        function initCalendarViewShareModal() {
            if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') return;
            if (!document.getElementById('calendarViewShareModal')) return;
            window.MoyoShareModal.init({
                contentType: 'CALENDAR',
                persist: true,
                shareMode: 'PERMISSION',
                enablePermission: true,
                bodyOpenClass: 'note-share-modal-open',
                reloadOnPersist: false,
                currentUserId: String(sessionUserId || ''),
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
                },
                onPersistSuccess: function() {
                    closeCalendarViewModal();
                    if (calendar) {
                        calendar.refetchEvents();
                        setTimeout(renderSelectedDatePanel, 220);
                    }
                }
            });
        }

        function openEventFromQuery() {
            const params = new URLSearchParams(window.location.search || '');
            const eventId = params.get('viewEventId') || params.get('eventId');
            if (!eventId) return;
            if (window.MoyoCalendarEventPreview && typeof window.MoyoCalendarEventPreview.open === 'function') {
                window.MoyoCalendarEventPreview.open(eventId, {
                    source: 'calendar',
                    showActions: true,
                    silent: true,
                    onDeleted: function() {
                        if (calendar) calendar.refetchEvents();
                    },
                    onEdit: function(id) {
                        window.location.href = contextPath + '/calendar/event/form?mode=edit&eventId=' + encodeURIComponent(id || '');
                    }
                });
                return;
            }
            fetchEventDetail(eventId)
                .then(function(detail) {
                    showCalendarViewModal(detail, null);
                })
                .catch(function(error) {
                    console.warn(error && error.message ? error.message : error);
                });
        }

        function calendarViewOwnerName(detail) {
            return getDetailValue(detail, 'ownerName', 'OWNER_NAME', 'writerName', 'WRITER_NAME', 'creatorName', 'CREATOR_NAME', 'userName', 'USER_NAME', 'name', 'NAME') || '';
        }

        function calendarViewOwnerImage(detail) {
            return getDetailValue(
                detail,
                'ownerProfileImagePath', 'OWNER_PROFILE_IMAGE_PATH',
                'ownerImagePath', 'OWNER_IMAGE_PATH',
                'writerProfileImagePath', 'WRITER_PROFILE_IMAGE_PATH',
                'writerImagePath', 'WRITER_IMAGE_PATH',
                'creatorProfileImagePath', 'CREATOR_PROFILE_IMAGE_PATH',
                'profileImagePath', 'PROFILE_IMAGE_PATH',
                'userProfileImagePath', 'USER_PROFILE_IMAGE_PATH',
                'userImagePath', 'USER_IMAGE_PATH',
                'imagePath', 'IMAGE_PATH'
            ) || '';
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

        function renderCalendarViewAuthor(detail, displayType, isMoyoPublic) {
            const row = document.getElementById('calendarViewAuthorRow');
            const avatar = document.getElementById('calendarViewAuthorAvatar');
            const nameEl = document.getElementById('calendarViewAuthorName');
            const scopeEl = document.getElementById('calendarViewAuthorScope');
            if (!row || !avatar || !nameEl || !scopeEl) return;
            const ownerName = calendarViewOwnerName(detail) || '작성자';
            const ownerImage = normalizeImagePath(calendarViewOwnerImage(detail));
            const scopeLabel = buildCalendarViewScopeLabel(detail, displayType);
            const showMoyoScope = isMoyoPublic && (displayType === 'PRIVATE' || displayType === 'FRIEND');
            row.hidden = false;
            nameEl.textContent = ownerName;
            nameEl.title = ownerName;
            scopeEl.classList.toggle('is-moyo-public', showMoyoScope);
            if (showMoyoScope) {
                scopeEl.innerHTML = '<img src="' + escapeHtml(moyoMascotPath) + '" alt="" aria-hidden="true"><span class="moyo-public-text">MOYO 공개</span>';
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

        function renderCalendarViewTime(detail) {
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
                periodHtml = '' +
                    '<div class="moyo-event-view-time-line start is-all-day-single">' +
                        '<span class="time-label">일자</span>' +
                        '<strong class="time-main">' + escapeHtml(start.date) + '<span class="time-clock all-day">종일</span></strong>' +
                    '</div>';
            } else if (isAllDay) {
                periodHtml = '' +
                    '<div class="moyo-event-view-time-line start is-all-day">' +
                        '<span class="time-label">시작</span>' +
                        '<strong class="time-main">' + escapeHtml(start.date) + '</strong>' +
                    '</div>' +
                    '<div class="moyo-event-view-time-line end is-all-day">' +
                        '<span class="time-label">종료</span>' +
                        '<strong class="time-main">' + escapeHtml(end.date) + '</strong>' +
                    '</div>';
            } else {
                periodHtml = '' +
                    '<div class="moyo-event-view-time-line start">' +
                        '<span class="time-label">시작</span>' +
                        '<strong class="time-main">' + escapeHtml(start.date) + '<span class="time-clock">' + escapeHtml(start.ampm + ' ' + start.time) + '</span></strong>' +
                    '</div>' +
                    '<div class="moyo-event-view-time-line end">' +
                        '<span class="time-label">종료</span>' +
                        '<strong class="time-main">' + escapeHtml(end.date) + '<span class="time-clock">' + escapeHtml(end.ampm + ' ' + end.time) + '</span></strong>' +
                    '</div>';
            }

            box.innerHTML = '' +
                '<div class="moyo-event-view-time-list">' +
                    '<div class="moyo-event-view-time-period">' + periodHtml + '</div>' +
                    '<div class="moyo-event-view-time-meta">' + chips.join('') + '</div>' +
                '</div>';
        }

        function renderCalendarViewLocation(detail) {
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
            box.innerHTML = ''
                + '<span class="moyo-event-view-location-text">' + escapeHtml(text) + '</span>'
                + '<button type="button" class="moyo-event-view-map-link" data-map-query="' + escapeHtml(query) + '" aria-label="지도에서 위치 확인">'
                + '<span>지도 보기</span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>'
                + '</button>';
        }

        function calendarViewMapExternalUrl(query) {
            const encoded = encodeURIComponent(String(query || '').trim());
            return encoded ? 'https://www.google.com/maps/search/?api=1&query=' + encoded : '';
        }

        function openCalendarViewMap(query) {
            const url = calendarViewMapExternalUrl(query);
            if (!url) return;
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        function calendarViewAttendeeName(item) {
            return item.userName || item.USER_NAME || item.wsName || item.WS_NAME || item.projName || item.PROJ_NAME || item.name || item.NAME || item.email || item.EMAIL || '참석자';
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
            const imagePath = calendarViewAttendeeImage(item);
            if (imagePath) {
                return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + '"><img src="' + escapeHtml(imagePath) + '" alt=""></span>';
            }
            return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + ' is-fallback"><b>' + escapeHtml(String(name || '?').slice(0, 1)) + '</b></span>';
        }

        function renderCalendarViewAttendees(detail) {
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
                return '<span class="moyo-event-view-person note-share-chip moyo-attendee-chip ' + typeClass + '" title="' + escapeHtml(name) + '">'
                    + calendarViewAttendeeAvatar(item, name)
                    + '<span class="note-share-chip-name moyo-attendee-chip-name" title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</span>'
                    + '</span>';
            }).join('');
        }

        function renderCalendarViewDescription(detail) {
            const section = document.getElementById('calendarViewDescriptionSection');
            const box = document.getElementById('calendarViewDescription');
            if (!box) return;
            const text = getDetailValue(detail, 'descriptionText', 'DESCRIPTION_TEXT') || '';
            if (section) section.hidden = !text;
            box.textContent = text;
        }

        document.addEventListener('click', function(event) {
            if (window.MoyoCalendarEventPreview && typeof window.MoyoCalendarEventPreview.open === 'function') return;
            const mapButton = event.target && event.target.closest ? event.target.closest('.moyo-event-view-map-link') : null;
            if (!mapButton) return;
            const query = mapButton.dataset.mapQuery || '';
            openCalendarViewMap(query);
        });

        function calendarViewIsRecurring(detail) {
            return getDetailValue(detail, 'isRecurring', 'IS_RECURRING') === 'Y'
                || !!getDetailValue(detail, 'recurGroupId', 'RECUR_GROUP_ID')
                || !!getDetailValue(detail, 'recurType', 'RECUR_TYPE');
        }

        function calendarViewOccurrenceDate(detail) {
            const value = getDetailValue(detail, 'occurrenceDate', 'OCCURRENCE_DATE')
                || getDetailValue(detail, 'startDt', 'START_DT')
                || '';
            const match = String(value).replace('T', ' ').match(/^(\d{4}-\d{2}-\d{2})/);
            return match ? match[1] : '';
        }

        function setupCalendarViewDeleteButton(detail, eventId, canEdit) {
            const deleteBtn = document.getElementById('calendarViewDelete');
            if (!deleteBtn) return;
            deleteBtn.hidden = true;
            deleteBtn.onclick = null;
            if (!eventId || !canEdit) return;
            deleteBtn.hidden = false;
            deleteBtn.onclick = function(event) {
                event.preventDefault();
                event.stopPropagation();
                openCalendarViewDeleteModal(detail, eventId);
            };
        }

        function openCalendarViewDeleteModal(detail, eventId) {
            const modal = document.getElementById('calendarViewDeleteModal');
            const message = document.getElementById('calendarViewDeleteMessage');
            const repeatBody = document.getElementById('calendarViewDeleteRepeatBody');
            if (!modal || !eventId) return;
            const recurring = calendarViewIsRecurring(detail);
            calendarViewDeleteState = {
                eventId: eventId,
                recurring: recurring,
                occurrenceDate: calendarViewOccurrenceDate(detail)
            };
            if (message) message.textContent = recurring ? '반복 일정입니다. 삭제할 범위를 선택해 주세요.' : '이 일정을 정말 삭제하시겠습니까?';
            if (repeatBody) repeatBody.hidden = !recurring;
            const oneRadio = modal.querySelector('input[name="calendarViewDeleteScope"][value="ONE"]');
            if (oneRadio) oneRadio.checked = true;
            modal.hidden = false;
        }

        function closeCalendarViewDeleteModal() {
            const modal = document.getElementById('calendarViewDeleteModal');
            if (modal) modal.hidden = true;
        }

        function getCalendarViewDeleteScope() {
            const checked = document.querySelector('input[name="calendarViewDeleteScope"]:checked');
            return checked ? checked.value : 'ONE';
        }

        function performCalendarViewDelete() {
            if (!calendarViewDeleteState || !calendarViewDeleteState.eventId) return;
            const scope = calendarViewDeleteState.recurring ? getCalendarViewDeleteScope() : 'ONE';
            const params = new URLSearchParams();
            params.set('eventId', calendarViewDeleteState.eventId);
            params.set('deleteScope', scope);
            params.set('deleteSeries', scope === 'ALL' ? 'Y' : 'N');
            if (calendarViewDeleteState.occurrenceDate) params.set('occurrenceDate', calendarViewDeleteState.occurrenceDate);
            fetch(contextPath + '/api/calendar/delete?' + params.toString(), {
                method: 'DELETE',
                credentials: 'same-origin'
            }).then(function(response) {
                if (!response.ok) throw new Error('일정을 삭제하지 못했습니다.');
                return response.text();
            }).then(function() {
                closeCalendarViewDeleteModal();
                closeCalendarViewModal();
                calendarViewDeleteState = null;
                if (calendar) calendar.refetchEvents();
            }).catch(function(error) {
                alert(error && error.message ? error.message : '일정을 삭제하지 못했습니다.');
            });
        }

        function bindCalendarViewDeleteModal() {
            document.querySelectorAll('[data-calendar-view-delete-close]').forEach(function(btn) {
                btn.addEventListener('click', closeCalendarViewDeleteModal);
            });
            const modal = document.getElementById('calendarViewDeleteModal');
            if (modal) {
                modal.addEventListener('click', function(event) {
                    if (event.target === modal) closeCalendarViewDeleteModal();
                });
            }
            const confirmBtn = document.getElementById('calendarViewDeleteConfirm');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', performCalendarViewDelete);
            }
        }

        function setupCalendarViewShareButton(detail, eventId) {
            const shareBtn = document.getElementById('calendarViewShareBtn');
            const hiddenOpen = document.getElementById('calendarViewShareOpenHidden');
            const modal = document.getElementById('calendarViewShareModal');
            if (!shareBtn || !hiddenOpen || !modal) return;
            shareBtn.hidden = true;
            shareBtn.onclick = null;
            if (!eventId) return;
            const ownerYn = getDetailValue(detail, 'ownerYn', 'OWNER_YN') === 'Y';
            const canEdit = getDetailValue(detail, 'canEditYn', 'CAN_EDIT_YN') === 'Y';
            const relation = String(getDetailValue(detail, 'shareRelation', 'SHARE_RELATION') || 'NORMAL').toUpperCase();
            const shareStatus = String(getDetailValue(detail, 'shareStatus', 'SHARE_STATUS') || '').toUpperCase();
            const shareId = String(getDetailValue(detail, 'shareId', 'SHARE_ID') || '').trim();
            const receivedShare = !ownerYn && (relation !== 'NORMAL' && relation !== 'OWNER' || !!shareId || shareStatus === 'ACCEPTED' || shareStatus === 'PENDING' || canEdit);
            const visible = ownerYn || receivedShare;
            if (!visible) return;

            // 작성자가 아닌 사용자는 편집 권한이 있어도 공유 관리자가 아니라 공유받은 사용자다.
            // 따라서 공유 버튼은 항상 "내 공유 해지" 화면으로 열어 일반 공유 관리 모달이 뜨거나 무반응처럼 보이는 문제를 막는다.
            const readonlyShare = !ownerYn;

            function syncCalendarViewShareDataset() {
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

            syncCalendarViewShareDataset();
            shareBtn.hidden = false;
            shareBtn.onclick = function(event) {
                event.preventDefault();
                event.stopPropagation();
                syncCalendarViewShareDataset();
                if (typeof hiddenOpen.click === 'function') {
                    hiddenOpen.click();
                } else {
                    hiddenOpen.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                }
            };
        }

        function getCalendarViewTypeMeta(detail) {
            const eventType = String(getDetailValue(detail, 'eventType', 'EVENT_TYPE', 'calendarEventType', 'CALENDAR_EVENT_TYPE') || '').toUpperCase();
            return getCalendarEventTypeMeta(eventType) || { icon: '🗓️', label: '일반' };
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


        function buildCalendarViewMeta(detail, displayType) {
            const ownerName = getDetailValue(detail, 'ownerName', 'OWNER_NAME', 'writerName', 'WRITER_NAME', 'userName', 'USER_NAME') || '';
            const wsName = getDetailValue(detail, 'projectWorkspaceName', 'PROJECT_WORKSPACE_NAME', 'wsName', 'WS_NAME', 'workspaceName', 'WORKSPACE_NAME') || '';
            const projName = getDetailValue(detail, 'projName', 'PROJ_NAME', 'projectName', 'PROJECT_NAME') || '';
            if (displayType === 'PROJ') return [ownerName, wsName, projName].filter(Boolean).join(' · ') || '프로젝트 일정';
            if (displayType === 'WS') return [ownerName, wsName || '그룹'].filter(Boolean).join(' · ') || '그룹 일정';
            if (displayType === 'FRIEND') return ownerName ? ownerName + ' · 친구 일정' : '친구 일정';
            return '';
        }

        function buildDetailScopeText(detail, displayType, isMoyoPublic) {
            if (isMoyoPublic) return 'MOYO 공개 일정';
            if (displayType === 'WS') return getDetailValue(detail, 'wsName', 'WS_NAME') || '그룹 일정';
            if (displayType === 'PROJ') {
                const wsName = getDetailValue(detail, 'projectWorkspaceName', 'PROJECT_WORKSPACE_NAME', 'wsName', 'WS_NAME');
                const projName = getDetailValue(detail, 'projName', 'PROJ_NAME');
                return [wsName, projName].filter(Boolean).join(' · ') || '프로젝트 일정';
            }
            return '개인 일정';
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

        function formatDetailDateTimeParts(value) {
            if (!value) return { date: '-', ampm: '', time: '-' };
            const normalized = String(value).replace('T', ' ');
            const match = normalized.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
            if (!match) return { date: normalized, ampm: '', time: '' };
            const hour = Number(match[2]);
            return {
                date: match[1],
                ampm: hour < 12 ? '오전' : '오후',
                time: match[2] + ':' + match[3]
            };
        }
        function isDetailAllDayEvent(detail) {
            const explicit = String(getDetailValue(detail, 'allDay', 'ALL_DAY', 'allDayYn', 'ALL_DAY_YN') || '').toUpperCase();
            if (explicit === 'Y' || explicit === 'TRUE' || explicit === '1') return true;
            if (explicit === 'N' || explicit === 'FALSE' || explicit === '0') return false;

            const start = formatDetailDateTimeParts(getDetailValue(detail, 'startDt', 'START_DT') || '');
            const end = formatDetailDateTimeParts(getDetailValue(detail, 'endDt', 'END_DT') || '');
            return start.time === '00:00' && (end.time === '23:59' || end.time === '23:59:59');
        }


        function formatDetailDateTime(value) {
            if (!value) return '-';
            const normalized = String(value).replace('T', ' ');
            const match = normalized.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
            if (!match) return normalized;
            const hour = Number(match[2]);
            return match[1] + ' ' + (hour < 12 ? '오전' : '오후') + ' ' + match[2] + ':' + match[3];
        }

        function formatTimezoneLabel(value) {
            if (!value) return '서울(GMT+09:00)';
            if (value === 'Asia/Seoul') return '서울(GMT+09:00)';
            return value;
        }

        function normalizeDetailArray(value) {
            if (Array.isArray(value)) return value;
            return [];
        }

        function getDetailValue(obj) {
            if (!obj) return '';
            for (let i = 1; i < arguments.length; i++) {
                const key = arguments[i];
                if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) return obj[key];
            }
            return '';
        }

        function loadUserSpaces() {
            $.get(contextPath + '/api/calendar/user-spaces', function(data) {
                state.userSpaces = data || { workspaces: [], projects: [] };
                renderTargetFilters();
            }).fail(function() {
                state.userSpaces = { workspaces: [], projects: [] };
                renderTargetFilters();
            });
        }

        function loadFriends() {
            $.get(contextPath + '/friends/api/list', function(data) {
                state.friends = (data && data.friends) ? data.friends : [];
                renderTargetFilters();
                if (calendar) {
                    calendar.refetchEvents();
                    setTimeout(renderSelectedDatePanel, 80);
                }
            }).fail(function() {
                state.friends = [];
                renderTargetFilters();
            });
        }

        function friendHasVisibleCalendarEvent(friendId) {
            const sourceEvents = state.calendarSourceEvents || [];
            if (!sourceEvents.length) return true;
            return sourceEvents.some(function(eventObj) {
                const props = eventObj.extendedProps || {};
                const type = props.displayType || props.type;
                return matchesFriendCalendarScopeForTarget(props, type, friendId);
            });
        }

        function matchesFriendCalendarScopeForTarget(props, displayType, targetId) {
            if (!props) return false;
            const type = String(displayType || props.displayType || props.type || '').toUpperCase();
            const isFriendMoyo = isMoyoSharedEvent(props) && isFriendOwnedEvent(props);
            const friendRelated = type === 'FRIEND' || isReceivedPrivateCalendarEvent(props) || isFriendMoyo;
            if (!friendRelated) return false;
            return isEventMatchedToSelectedFriend(props, targetId);
        }

        function refreshCalendarLayout() {
            if (!calendar || typeof calendar.updateSize !== 'function') return;
            window.requestAnimationFrame(function() {
                calendar.updateSize();
            });
        }

        function renderTargetFilters() {
            const $bar = $('#calendarTargetBar');
            const $label = $('#calendarTargetLabel');
            const $current = $('#calendarTargetCurrent');
            const $openButton = $('#calendarTargetSelectOpen');

            if (state.scope === 'ALL' || state.scope === 'PRIVATE') {
                $bar.attr('hidden', true).removeAttr('data-scope');
                $openButton.attr('hidden', true);
                refreshCalendarLayout();
                return;
            }

            const scopeLabel = state.scope === 'FRIEND' ? '친구' : state.scope === 'WS' ? '그룹' : '프로젝트';
            $bar.removeAttr('hidden').attr('data-scope', state.scope);
            $label.text(scopeLabel);
            $current.text(resolveCalendarSelectionLabel());
            $openButton.removeAttr('hidden');
            refreshCalendarLayout();
        }

        function resolveCalendarSelectionLabel() {
            const selection = state.selection || createCalendarSelection(state.scope);
            if (selection.label) return String(selection.label);

            if (state.scope === 'FRIEND') {
                if (!selection.friendId) return '친구 전체';
                const friend = getCalendarScopeSelectorFriends().find(function(item) {
                    return String(item.id) === String(selection.friendId);
                });
                return friend ? friend.name : '선택한 친구';
            }

            if (state.scope === 'WS') {
                if (!selection.wsId) return '그룹 전체';
                const workspace = getCalendarScopeSelectorWorkspaces().find(function(item) {
                    return String(item.id) === String(selection.wsId);
                });
                return workspace ? workspace.name : '선택한 그룹';
            }

            if (state.scope === 'PROJ') {
                if (!selection.projectScope && !selection.projId) return '프로젝트 전체';
                if (selection.projectScope === 'PERSONAL' && !selection.projId) return '개인 프로젝트 전체';
                if (selection.projectScope === 'GROUP' && selection.wsId && !selection.projId) {
                    const workspace = getCalendarScopeSelectorWorkspaces().find(function(item) {
                        return String(item.id) === String(selection.wsId);
                    });
                    return workspace ? workspace.name + ' · 프로젝트 전체' : '그룹 프로젝트 전체';
                }
                if (selection.projId) {
                    const project = getCalendarScopeSelectorProjects().find(function(item) {
                        return String(item.id) === String(selection.projId);
                    });
                    return project ? project.name : '선택한 프로젝트';
                }
            }

            return '전체';
        }

        function normalizeImagePath(path) {
            if (!path) return '';
            const value = String(path).trim();
            if (!value) return '';
            if (/^(https?:)?\/\//i.test(value) || value.indexOf('data:') === 0 || value.indexOf('blob:') === 0) return value;
            if (value.charAt(0) === '/') return value;
            return contextPath + '/' + value.replace(/^\/+/, '');
        }

        function getInitial(text) {
            const value = String(text || '').trim();
            return value ? value.substring(0, 1) : '?';
        }

        function getProjectFilterName(project) {
            const groupName = project.wsName || project.WS_NAME || project.workspaceName || project.WORKSPACE_NAME;
            const projectName = project.projName || project.PROJ_NAME || '이름 없음';
            return groupName ? groupName + ' · ' + projectName : projectName;
        }

        function parseLocalDate(dateStr) {
            const parts = dateStr.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }

        function formatDateOnly(date) {
            return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
        }


        function pad(n) {
            return String(n).padStart(2, '0');
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    });
