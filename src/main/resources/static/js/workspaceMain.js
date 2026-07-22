'use strict';

const workspaceRoot = document.body;
const WORKSPACE_WIDGET_LIMITS = Object.freeze({
board: 3,
    todaySchedule: 3,
    photo: 2,
    poll: 2,
    note: 3
});

const WORKSPACE_CONFIG = {
    wsId: workspaceRoot.dataset.wsId || '',
    contextPath: workspaceRoot.dataset.contextPath || '',
    currentUserId: Number(workspaceRoot.dataset.currentUserId || 0),
    isAdmin: workspaceRoot.dataset.workspaceAdmin === 'true',
    isOwner: workspaceRoot.dataset.workspaceOwner === 'true',
    isMember: workspaceRoot.dataset.workspaceMember === 'true'
};

function workspacePath(path) {
    const contextPath = String(WORKSPACE_CONFIG.contextPath || '').replace(/\/$/, '');
    const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : '/' + String(path || '');
    return contextPath + normalizedPath;
}
        const today = new Date();
        let myWorkspaceDate = new Date(today.getFullYear(), today.getMonth(), 1);
        let workspaceActivePollId = null;


        async function postWorkspaceGuestAction(path, values) {
            const form = new URLSearchParams();
            Object.keys(values || {}).forEach(function (key) {
                if (values[key] != null) form.append(key, values[key]);
            });
            const response = await fetch(workspacePath(path), {
                method: 'POST', credentials: 'same-origin',
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
                body: form.toString()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.status || '요청 처리 실패');
            return data;
        }

        function initWorkspaceGuestJoin() {
            if (WORKSPACE_CONFIG.isMember) return;
            const wsName = document.body.dataset.workspaceName || '그룹';
            const openButton = document.getElementById('workspaceOpenJoinBtn');
            const requestButton = document.getElementById('workspaceRequestJoinBtn');
            const cancelButton = document.getElementById('workspaceCancelRequestBtn');
            if (openButton) openButton.addEventListener('click', function () {
                if (typeof window.openJoinProfileModal === 'function') {
                    window.openJoinProfileModal({mode: 'open', workspaceId: WORKSPACE_CONFIG.wsId, workspaceName: wsName});
                }
            });
            if (requestButton) requestButton.addEventListener('click', async function () {
                requestButton.disabled = true;
                try {
                    const data = await postWorkspaceGuestAction('/workspace/api/join-request', {wsId: WORKSPACE_CONFIG.wsId});
                    if (!(data.success === true || data.status === 'SUCCESS' || data.status === 'ALREADY_PENDING')) throw new Error('참여 요청 실패');
                    window.location.reload();
                } catch (error) { alert('참여 요청을 처리하지 못했습니다.'); requestButton.disabled = false; }
            });
            if (cancelButton) cancelButton.addEventListener('click', async function () {
                cancelButton.disabled = true;
                try {
                    const data = await postWorkspaceGuestAction('/workspace/api/join-request/cancel', {wsId: WORKSPACE_CONFIG.wsId});
                    if (!(data.success === true || data.status === 'SUCCESS')) throw new Error('취소 실패');
                    window.location.reload();
                } catch (error) { alert('참여 요청을 취소하지 못했습니다.'); cancelButton.disabled = false; }
            });
        }

        function escapeWorkspaceHtml(value) {
            return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        function toSafeNumber(value) {
            const num = Number(value);
            return Number.isFinite(num) ? num : 0;
        }

        function workspaceRetryButton(label, handlerName) {
            return '<button type="button" class="workspace-load-retry" onclick="' + handlerName + '()">' + label + '</button>';
        }

        function renderBoardWidgetError(targetId) {
            const target = document.getElementById(targetId);
            if (!target) return;
            target.innerHTML = '<li class="workspace-empty-state workspace-board-empty-line is-error"><span>내용을 불러오지 못했습니다.</span>' +
                workspaceRetryButton('다시 시도', 'loadBoardWidgets') + '</li>';
        }

        function renderTodayScheduleError() {
            const listEl = document.getElementById('todayScheduleList');
            const toggleBtn = document.getElementById('todayScheduleToggle');
            if (toggleBtn) toggleBtn.style.display = 'none';
            if (!listEl) return;
            listEl.innerHTML = '<li class="workspace-empty-state compact-empty is-error">오늘 일정을 불러오지 못했습니다. ' +
                workspaceRetryButton('다시 시도', 'loadTodaySchedule') + '</li>';
        }

        function setWorkspaceFeatureState(target, state) {
            if (!target) return;
            target.classList.remove('is-empty', 'is-ready', 'is-error');
            target.classList.add(state === 'ready' ? 'is-ready' : state === 'error' ? 'is-error' : 'is-empty');
            var card = target.closest('.workspace-note-feature-card, .workspace-photo-feature-card');
            if (card) {
                card.classList.remove('has-preview', 'has-empty', 'has-error');
                card.classList.add(state === 'ready' ? 'has-preview' : state === 'error' ? 'has-error' : 'has-empty');
            }
        }

        function renderPhotoAlbumError() {
            const target = document.getElementById('photoAlbumList');
            if (!target) return;
            setWorkspaceFeatureState(target, 'error');
            target.innerHTML = '<div class="workspace-feature-empty workspace-photo-empty is-error"><span class="workspace-feature-empty-icon workspace-camera-icon">!</span><div><strong>사진을 불러오지 못했습니다.</strong><span>잠시 후 다시 시도해주세요.</span>' +
                workspaceRetryButton('다시 시도', 'loadRecentPhotos') + '</div></div>';
        }


        function toggleRecentActivities(button) {
            const card = button.closest('.workspace-activity-card');
            if (!card) return;
            const hiddenRows = card.querySelectorAll('.workspace-activity-item.is-hidden-extra');
            const expanded = button.getAttribute('data-expanded') === 'true';
            card.classList.toggle('activity-expanded', !expanded);
            button.setAttribute('data-expanded', expanded ? 'false' : 'true');
            button.textContent = expanded ? '더보기' : '접기';
        }

        function updateSummaryCard(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = toSafeNumber(value);
        }

        function loadCommunitySummary() {
            fetch(workspacePath('/workspace/api/' + WORKSPACE_CONFIG.wsId + '/community-summary'))
                .then(function(res) { return res.ok ? res.json() : null; })
                .then(function(data) {
                    if (!data) return;
                    updateSummaryCard('noticeCount', data.noticeCount);
                    updateSummaryCard('freeCount', data.freeCount);
                    updateSummaryCard('activePollCount', data.activePollCount);
                    updateSummaryCard('activePollHeaderCount', data.activePollCount);
                    updateSummaryCard('fileCount', data.fileCount);
                    updateSummaryCard('workspaceMemberCount', data.memberCount);
                })
                .catch(function(err) {
                    console.error('커뮤니티 요약 로딩 실패:', err);
                    ['noticeCount', 'freeCount', 'activePollCount', 'activePollHeaderCount', 'fileCount', 'workspaceMemberCount'].forEach(function(id) {
                        const el = document.getElementById(id);
                        if (el) el.textContent = '-';
                    });
                });
        }


        function getWorkspaceEventTypeLabel(ev) {
            const rawType = String(ev.itemType || ev.ITEM_TYPE || ev.type || ev.TYPE || '').toUpperCase();
            const rawLabel = String(ev.typeLabel || ev.TYPE_LABEL || ev.scopeLabel || ev.SCOPE_LABEL || '').trim();
            const projId = ev.projId || ev.PROJ_ID || ev.projectId || ev.PROJECT_ID;
            const wsId = ev.wsId || ev.WS_ID || ev.workspaceId || ev.WORKSPACE_ID;
            if (rawType === 'PROJ' || rawType === 'PROJECT' || rawType === 'TASK' || projId) return '프로젝트';
            if (rawType === 'WS' || rawType === 'WORKSPACE' || wsId) return '그룹';
            if (rawLabel.includes('프로젝트')) return '프로젝트';
            if (rawLabel.includes('그룹') || rawLabel.includes('워크스페이스')) return '그룹';
            return '그룹';
        }

        function isWorkspaceVisibleTodayEvent(ev) {
            const rawType = String(ev.itemType || ev.ITEM_TYPE || ev.type || ev.TYPE || '').toUpperCase();
            const rawLabel = String(ev.typeLabel || ev.TYPE_LABEL || ev.scopeLabel || ev.SCOPE_LABEL || '').trim();
            if (rawType === 'PRIVATE' || rawLabel.includes('개인')) return false;
            if (rawType === 'HOLIDAY' || rawLabel.includes('공휴일')) return false;
            return true;
        }

        function formatWorkspaceEventTime(ev) {
            const allDayValue = String(ev.allDay || ev.ALL_DAY || ev.allday || '').toUpperCase();
            const rawTime = String(ev.time || ev.TIME || '').trim();
            if (allDayValue === 'Y' || allDayValue === 'TRUE' || rawTime === '종일') return '종일';
            if (!rawTime) return '';
            return rawTime;
        }

        function renderTodaySchedule(events, expanded) {
            const listEl = document.getElementById('todayScheduleList');
            const toggleBtn = document.getElementById('todayScheduleToggle');
            if (!listEl) return;

            window.workspaceTodayEvents = events || [];
            if (toggleBtn) {
                if (!events || events.length <= WORKSPACE_WIDGET_LIMITS.todaySchedule) {
                    toggleBtn.style.display = 'none';
                } else {
                    toggleBtn.style.display = 'inline-flex';
                    toggleBtn.textContent = expanded ? '접기' : '더보기';
                    toggleBtn.setAttribute('data-expanded', expanded ? 'true' : 'false');
                }
            }

            if (!events || events.length === 0) {
                listEl.innerHTML = '' +
                    '<li class="workspace-compact-empty-state workspace-schedule-empty-state">' +
                        '<strong>오늘 예정된 일정이 없습니다.</strong>' +
                        '<span>새 일정을 등록하거나 그룹 일정을 확인해보세요.</span>' +
                        '<a href="' + workspacePath('/calendar?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId)) + '">일정 보기</a>' +
                    '</li>';
                return;
            }

            const limit = WORKSPACE_WIDGET_LIMITS.todaySchedule;
            const visibleEvents = expanded ? events : events.slice(0, limit);
            const scheduleHtml = visibleEvents.map(function(ev) {
                const title = escapeWorkspaceHtml(ev.title || ev.TITLE);
                const typeLabel = escapeWorkspaceHtml(getWorkspaceEventTypeLabel(ev));
                const timeText = escapeWorkspaceHtml(formatWorkspaceEventTime(ev));
                return '<li class="today-schedule-item">' +
                    '<span class="schedule-main"><em class="schedule-type-text">' + typeLabel + '</em><span class="schedule-title">' + title + '</span></span>' +
                    '<strong>' + timeText + '</strong>' +
                '</li>';
            }).join('');

            listEl.innerHTML = scheduleHtml;
        }

        function toggleTodaySchedule(button) {
            const expanded = button.getAttribute('data-expanded') === 'true';
            renderTodaySchedule(window.workspaceTodayEvents || [], !expanded);
        }

        function loadBoardWidgets() {
            fetch(workspacePath('/api/workspace/' + WORKSPACE_CONFIG.wsId + '/dashboard-widgets'))
                .then(function(res) {
                    if (!res.ok) throw new Error('게시판 위젯 API 응답 오류: ' + res.status);
                    return res.json();
                })
                .then(function(data) {
                    data = data || {};
                    renderWidget('noticeList', data.notices, 'NOTICE');
                    renderWidget('freeList', data.freeBoards, 'FREE');
                    renderWidget('fileList', data.fileBoards, 'FILE');
                })
                .catch(function(err) {
                    console.error('워크스페이스 게시글 로딩 실패:', err);
                    renderBoardWidgetError('noticeList');
                    renderBoardWidgetError('freeList');
                    renderBoardWidgetError('fileList');
                });
        }

        function loadTodaySchedule() {
            fetch(workspacePath('/workspace/api/' + WORKSPACE_CONFIG.wsId + '/today-events'))
                .then(function(res) {
                    if (!res.ok) throw new Error('오늘 일정 API 응답 오류: ' + res.status);
                    return res.json();
                })
                .then(function(data) {
                    renderTodaySchedule((data || []).filter(isWorkspaceVisibleTodayEvent), false);
                })
                .catch(function(err) {
                    console.error('오늘 일정 로딩 실패:', err);
                    renderTodayScheduleError();
                });
        }

        function loadRecentPhotos() {
            fetch(workspacePath('/api/photo-posts/recent?scopeType=WORKSPACE&scopeId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&limit=' + WORKSPACE_WIDGET_LIMITS.photo))
                .then(function(res) {
                    if (!res.ok) throw new Error('사진첩 API 응답 오류: ' + res.status);
                    return res.json();
                })
                .then(renderPhotoAlbum)
                .catch(function(err) {
                    console.error('최근 사진 로딩 실패:', err);
                    renderPhotoAlbumError();
                });
        }

        function loadDashboardWidgets() {
            loadBoardWidgets();
            loadTodaySchedule();
            loadRecentPhotos();
            loadActivePoll();
            loadCommunitySummary();
        }

        function renderWidget(targetId, list, type) {
            const targetUl = document.getElementById(targetId);
            if (!targetUl) return;
            targetUl.innerHTML = '';

            if (!list || list.length === 0) {
                const canManageNotice = WORKSPACE_CONFIG.isAdmin || WORKSPACE_CONFIG.isOwner;
                const listUrl = workspacePath('/group/board/list?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&type=' + encodeURIComponent(type));
                const writeUrl = workspacePath('/group/board/write?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&type=' + encodeURIComponent(type));
                const emptyMap = {
                    NOTICE: canManageNotice
                        ? { text: '아직 공지사항이 없습니다.', description: '그룹에 필요한 소식을 가장 먼저 알려보세요.', action: '공지 작성하기', href: writeUrl }
                        : { text: '아직 공지사항이 없습니다.', description: '새로운 공지가 등록되면 이곳에서 확인할 수 있습니다.', action: '공지사항 보기', href: listUrl },
                    FREE: { text: '아직 자유 피드가 없습니다.', description: '멤버들과 가볍게 이야기를 시작해보세요.', action: '첫 글 남기기', href: writeUrl },
                    FILE: { text: '아직 자료가 없습니다.', description: '함께 사용할 자료를 그룹에 공유해보세요.', action: '자료 올리기', href: writeUrl }
                };
                const empty = emptyMap[type] || { text: '등록된 글이 없습니다.', description: '새로운 글이 등록되면 이곳에서 확인할 수 있습니다.', action: '게시판 가기', href: listUrl };
                targetUl.innerHTML = '' +
                    '<li class="workspace-compact-empty-state workspace-board-compact-empty">' +
                        '<strong>' + empty.text + '</strong>' +
                        '<span>' + empty.description + '</span>' +
                        '<a href="' + empty.href + '">' + empty.action + '</a>' +
                    '</li>';
                return;
            }

            list.slice(0, WORKSPACE_WIDGET_LIMITS.board).forEach(function(post) {
                const li = document.createElement('li');
                li.className = 'board-item';

                let pinSpan = '';
                if (post.isPinned === 'Y' && type === 'NOTICE') {
                    pinSpan = '<span class="pin-badge">고정</span>';
                }

                let replySpan = '';
                if (post.replyCount > 0) {
                    replySpan = '<span class="reply-badge">' + escapeWorkspaceHtml(post.replyCount) + '</span>';
                }

                li.innerHTML =
                    '<a href="' + workspacePath('/group/board/detail?postId=' + encodeURIComponent(post.postId) + '&wsId=' + encodeURIComponent(post.wsId)) + '">' +
                    pinSpan +
                    '<span>' + escapeWorkspaceHtml(post.title) + '</span>' +
                    replySpan +
                    '</a>' +
                    '<span class="board-date">' + escapeWorkspaceHtml(post.regDt) + '</span>';

                targetUl.appendChild(li);
            });
        }


        function renderPhotoAlbum(list) {
            const target = document.getElementById('photoAlbumList');
            if (!target) return;

            const albumUrl = workspacePath('/photo-album?scopeType=WORKSPACE&scopeId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId));
            const writeUrl = workspacePath('/photo-post/write?scopeType=WORKSPACE&scopeId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId));
            if (!list || list.length === 0) {
                setWorkspaceFeatureState(target, 'empty');
                target.innerHTML = '<div class="workspace-feature-empty workspace-photo-empty"><span class="workspace-feature-empty-icon workspace-camera-icon">📷</span><div><strong>아직 공유된 사진이 없습니다.</strong><span>앨범을 만들지 않아도 사진을 바로 공유할 수 있습니다.</span><a class="workspace-feature-empty-action" href="' + writeUrl + '">첫 사진 공유</a></div></div>';
                return;
            }

            setWorkspaceFeatureState(target, 'ready');
            target.innerHTML = list.slice(0, WORKSPACE_WIDGET_LIMITS.photo).map(function(post) {
                const postId = post.postId || post.POST_ID || '';
                const imageUrl = post.coverPath || post.COVER_PATH || '';
                const title = post.title || post.TITLE || '';
                const description = post.description || post.DESCRIPTION || '';
                const creator = post.creatorName || post.CREATOR_NAME || '';
                const photoCount = Number(post.photoCount || post.PHOTO_COUNT || 0);
                const displayTitle = title || (description ? description.substring(0, 24) : '사진 공유');
                const href = albumUrl + '&postId=' + encodeURIComponent(postId);
                return '<a class="workspace-photo-post" href="' + href + '" aria-label="' + escapeWorkspaceHtml(displayTitle) + '">' +
                    '<span class="workspace-photo-post-thumb" style="background-image:url(&quot;' + escapeWorkspaceHtml(imageUrl) + '&quot;)">' +
                        (photoCount > 1 ? '<span class="workspace-photo-post-count">▣ ' + photoCount + '</span>' : '') +
                        '<span class="workspace-photo-post-overlay"><strong>' + escapeWorkspaceHtml(displayTitle) + '</strong><small>' + escapeWorkspaceHtml(creator) + '</small></span>' +
                    '</span>' +
                '</a>';
            }).join('');
        }

        function loadActivePoll() {
            const area = document.getElementById('activePollArea');
            if (!area) return;

            const pollListUrl = workspacePath('/poll/list?scope=WORKSPACE&wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId));
            const listApiUrl = workspacePath('/api/polls/list?scope=WORKSPACE&wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId));

            fetch(listApiUrl)
                .then(function(res) {
                    if (!res.ok) throw new Error('투표 목록 API 응답 오류: ' + res.status);
                    return res.json();
                })
                .then(function(list) {
                    list = Array.isArray(list) ? list : [];

                    const activePolls = list.filter(function(poll) {
                        return !isWorkspacePollClosed(poll);
                    }).sort(sortWorkspacePollsNewest);

                    const countTarget = document.getElementById('activePollHeaderCount');
                    if (countTarget) countTarget.textContent = activePolls.length;

                    // 대시보드에는 현재 행동이 필요한 진행 중 투표만 최대 2개 표시합니다.
                    const previewPolls = activePolls.slice(0, WORKSPACE_WIDGET_LIMITS.poll).map(function(poll) {
                        return { poll: poll, section: 'active' };
                    });

                    if (previewPolls.length === 0) {
                        workspaceActivePollId = null;
                        area.innerHTML = '' +
                            '<div class="workspace-compact-empty-state workspace-poll-summary-empty">' +
                                '<strong>등록된 투표가 없습니다.</strong>' +
                                '<span>의견을 모아야 할 때 새 투표를 시작해보세요.</span>' +
                                '<a href="' + pollListUrl + '">새 투표 만들기</a>' +
                            '</div>';
                        return;
                    }

                    return Promise.all(previewPolls.map(function(item) {
                        const pollId = item.poll.POLL_ID || item.poll.pollId;
                        return fetch(workspacePath('/api/polls/detail?pollId=' + encodeURIComponent(pollId)))
                            .then(function(res) {
                                if (!res.ok) throw new Error('투표 상세 API 응답 오류: ' + res.status);
                                return res.json();
                            })
                            .then(function(detail) {
                                return { summary: item.poll, detail: detail || {}, section: item.section };
                            })
                            .catch(function() {
                                return { summary: item.poll, detail: {}, section: item.section };
                            });
                    })).then(function(items) {
                        renderWorkspacePollSummary(area, items, pollListUrl);
                    });
                })
                .catch(function(err) {
                    console.error('워크스페이스 투표 로딩 실패:', err);
                    area.innerHTML = '<div class="workspace-poll-summary-error"><span>투표를 불러오지 못했습니다.</span>' + workspaceRetryButton('다시 시도', 'loadActivePoll') + '</div>';
                });
        }

        function renderWorkspacePollSummary(area, items, pollListUrl) {
            let html = '<div class="workspace-poll-summary-list">';
            html += items.map(function(item) {
                return createWorkspacePollSummaryItem(item, pollListUrl);
            }).join('');
            html += '</div>';
            area.innerHTML = html;
        }

        function createWorkspacePollSummaryItem(item, pollListUrl) {
            const summary = item.summary || {};
            const detail = item.detail || {};
            const pollId = summary.POLL_ID || summary.pollId || detail.pollId || '';
            const question = detail.question || summary.QUESTION || summary.question || '질문 없음';
            const creatorName = detail.creatorName || summary.CREATOR_NAME || summary.creatorName || '작성자 미상';
            const endDt = detail.endDt || summary.END_DT || summary.endDt;
            const hasVoted = !!detail.hasVoted || (detail.myOptionId !== null && detail.myOptionId !== undefined && String(detail.myOptionId) !== '');
            const href = pollListUrl + '&pollId=' + encodeURIComponent(pollId);
            const statusText = hasVoted ? '참여 완료' : '참여 필요';
            const statusClass = hasVoted ? 'is-complete' : 'is-open';

            return '' +
                '<a class="workspace-poll-summary-item" href="' + href + '">' +
                    '<span class="workspace-poll-summary-main">' +
                        '<strong>' + escapeWorkspaceHtml(question) + '</strong>' +
                        '<small>작성자 ' + escapeWorkspaceHtml(creatorName) + ' · ' + escapeWorkspaceHtml(formatWorkspacePollDeadline(endDt, false)) + '</small>' +
                    '</span>' +
                    '<span class="workspace-poll-summary-side">' +
                        '<em class="workspace-poll-summary-status ' + statusClass + '">' + statusText + '</em>' +
                    '</span>' +
                '</a>';
        }

        function isWorkspacePollClosed(poll) {
            const status = String(poll.STATUS || poll.status || '').toUpperCase();
            if (status === 'CLOSED') return true;
            const value = poll.END_DT || poll.endDt;
            if (!value) return false;
            const date = new Date(value);
            return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
        }

        function sortWorkspacePollsNewest(a, b) {
            const aValue = a.END_DT || a.endDt || a.CREATED_AT || a.createdAt || 0;
            const bValue = b.END_DT || b.endDt || b.CREATED_AT || b.createdAt || 0;
            const aTime = new Date(aValue).getTime();
            const bTime = new Date(bValue).getTime();
            return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
        }

        function formatWorkspacePollDeadline(value, isClosed) {
            if (!value) return isClosed ? '종료' : '마감 없음';
            if (!value) return '마감 없음';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return String(value).substring(0, 16) + ' 마감';
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ' 마감';
        }

        function voteWorkspacePoll(optionId) {
            if (!workspaceActivePollId || !optionId) {
                alert('투표 정보를 찾을 수 없습니다.');
                return;
            }

            fetch(workspacePath('/api/polls/vote'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId: workspaceActivePollId, optionId: optionId })
            })
            .then(function(res) {
                if (!res.ok) throw new Error('투표 저장 실패: ' + res.status);
                return res.json();
            })
            .then(function(result) {
                if (!result || result.success === false) {
                    alert(result && result.message === 'LOGIN_REQUIRED' ? '로그인이 필요합니다.' : '투표 반영에 실패했습니다.');
                    return;
                }
                loadActivePoll();
                loadCommunitySummary();
            })
            .catch(function(err) {
                console.error('워크스페이스 투표 반영 실패:', err);
                alert('투표 반영 중 오류가 발생했습니다.');
            });
        }




        function leaveWorkspace() {
            setWorkspaceGroupMenuOpen(false);

            if (WORKSPACE_CONFIG.isOwner) {
                openOwnerLeaveGuideModal();
                return;
            }

            if (!confirm('정말 이 그룹을 탈퇴하시겠습니까?')) return;
            const params = new URLSearchParams();
            params.append('wsId', WORKSPACE_CONFIG.wsId);
            fetch(workspacePath('/workspace/api/leave'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
                .then(function(res) { return res.text(); })
                .then(function(result) {
                    if (result === 'SUCCESS') {
                        alert('그룹에서 탈퇴했습니다.');
                        location.href = workspacePath('/workspace/list');
                        return;
                    }
                    if (result === 'OWNER_CANNOT_LEAVE') {
                        openOwnerLeaveGuideModal();
                        return;
                    }
                    if (result === 'LOGIN_REQUIRED') {
                        location.href = workspacePath('/login');
                        return;
                    }
                    alert('탈퇴 처리 중 오류가 발생했습니다.');
                })
                .catch(function(error) {
                    console.error('그룹 탈퇴 실패:', error);
                    alert('탈퇴 처리 중 오류가 발생했습니다.');
                });
        }

        function openOwnerLeaveGuideModal() {
            const modal = document.getElementById('ownerLeaveGuideModal');
            if (!modal) return;
            modal.hidden = false;
            document.body.classList.add('workspace-modal-open');
            const cancelButton = modal.querySelector('[data-owner-leave-cancel]');
            if (cancelButton) cancelButton.focus();
        }

        function closeOwnerLeaveGuideModal() {
            const modal = document.getElementById('ownerLeaveGuideModal');
            if (!modal) return;
            modal.hidden = true;
            document.body.classList.remove('workspace-modal-open');
        }

        function goToOwnerTransfer() {
            location.href = workspacePath('/workspace/settings?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&tab=members');
        }

        function loadCalendarEvents() {
            const grid = document.getElementById('calendarGrid');
            if (!grid) return;

            fetch(workspacePath('/api/workspace/' + WORKSPACE_CONFIG.wsId + '/calendar-events'))
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    grid.classList.remove('is-load-error');
                    grid.removeAttribute('data-load-error');
                    const events = Array.isArray(data) ? data : [];
                    const currentYear = myWorkspaceDate.getFullYear();
                    const currentMonth = myWorkspaceDate.getMonth() + 1;
                    const groupedByDay = {};

                    events.forEach(function(event) {
                        if (!event || event.TYPE === 'NOTICE') return;
                        const dateStr = event.EVENT_DATE || event.START_DT || event.startDate;
                        if (!dateStr) return;
                        const dateParts = String(dateStr).substring(0, 10).split('-');
                        if (dateParts.length < 3) return;
                        const eventYear = parseInt(dateParts[0], 10);
                        const eventMonth = parseInt(dateParts[1], 10);
                        const eventDay = parseInt(dateParts[2], 10);
                        if (eventYear === currentYear && eventMonth === currentMonth) {
                            groupedByDay[eventDay] = groupedByDay[eventDay] || [];
                            groupedByDay[eventDay].push(event.TITLE || event.title || '일정');
                        }
                    });

                    grid.querySelectorAll('.day-num').forEach(function(cell) {
                        const day = parseInt(cell.innerText, 10);
                        const titles = groupedByDay[day] || [];
                        if (titles.length === 0) return;
                        cell.classList.add('has-event');
                        cell.setAttribute('title', titles.join('\n'));
                        cell.onclick = function() {
                            alert(day + '일 일정\n\n' + titles.join('\n'));
                        };
                    });
                })
                .catch(function(err) {
                    console.error('캘린더 로딩 에러:', err);
                    grid.classList.add('is-load-error');
                    grid.setAttribute('data-load-error', '일정을 불러오지 못했습니다.');
                });
        }

        function generateCalendar() {
            const grid = document.getElementById('calendarGrid');
            const title = document.getElementById('calendarTitle');
            if (!grid || !title) return;
            const currentYear = myWorkspaceDate.getFullYear();
            const currentMonth = myWorkspaceDate.getMonth();
            title.textContent = currentYear + '.' + String(currentMonth + 1).padStart(2, '0');
            grid.querySelectorAll('.day-num, .empty-slot').forEach(function(el) { el.remove(); });
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
            for (let i = 0; i < firstDay; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-slot';
                grid.appendChild(emptyDiv);
            }
            for (let d = 1; d <= lastDate; d++) {
                const div = document.createElement('div');
                div.className = 'day-num';
                div.innerText = d;
                const now = new Date();
                if (d === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
                    div.classList.add('today');
                }
                grid.appendChild(div);
            }
        }

        function changeMonth(delta) {
            myWorkspaceDate = new Date(myWorkspaceDate.getFullYear(), myWorkspaceDate.getMonth() + delta, 1);
            generateCalendar();
            loadCalendarEvents();
        }

        function openCalendarModal() {
            location.href = workspacePath('/calendar?wsId=' + WORKSPACE_CONFIG.wsId + '&mode=GROUP_REG');
        }



        /* ===== Workspace shared note widget ===== */
        function escapeWorkspaceNoteHtml(value) {
            if (value === null || value === undefined) return '';
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function stripWorkspaceNoteHtml(value) {
            if (!value) return '';
            var temp = document.createElement('div');
            temp.innerHTML = String(value);
            return (temp.textContent || temp.innerText || '').replace(/\s+/g, ' ').trim();
        }

        function getWorkspaceNoteQuery() {
            var target = document.getElementById('workspaceRecentNoteList');
            var wsId = '';
            if (target && target.dataset) wsId = target.dataset.wsId || '';
            if (!wsId && typeof WORKSPACE_CONFIG !== 'undefined') wsId = WORKSPACE_CONFIG.wsId || WORKSPACE_CONFIG.workspaceId || '';
            var params = new URLSearchParams();
            params.set('scope', 'WS');
            if (wsId) params.set('wsId', wsId);
            return params.toString();
        }

        function getWorkspaceNoteListUrl() {
            return workspacePath('/note/list?' + getWorkspaceNoteQuery());
        }

        function getWorkspaceNoteWriteUrl() {
            return workspacePath('/note/write?' + getWorkspaceNoteQuery());
        }

        function getWorkspaceNoteDetailUrl(noteId) {
            return workspacePath('/note/detail?noteId=' + encodeURIComponent(noteId) + '&' + getWorkspaceNoteQuery());
        }

        function renderWorkspaceNoteEmpty(target) {
            setWorkspaceFeatureState(target, 'empty');
            target.innerHTML = '<a class="workspace-note-empty-link" href="' + getWorkspaceNoteWriteUrl() + '">' +
                '<span class="workspace-note-placeholder-icon">📝</span>' +
                '<span class="workspace-note-placeholder-copy">' +
                '<strong>아직 작성된 노트가 없습니다.</strong>' +
                '<span>첫 공유 노트를 작성해 멤버들과 함께 확인하세요.</span>' +
                '<em>첫 노트 작성</em>' +
                '</span></a>';
        }

        function normalizeWorkspaceNoteList(payload) {
            if (Array.isArray(payload)) return payload;
            if (!payload || typeof payload !== 'object') return [];
            var candidates = [
                payload.notes,
                payload.noteList,
                payload.recentNotes,
                payload.data,
                payload.list,
                payload.items,
                payload.content
            ];
            for (var i = 0; i < candidates.length; i++) {
                if (Array.isArray(candidates[i])) return candidates[i];
            }
            return [];
        }

        function isWorkspaceNotePinned(note) {
            var value = note.pinned;
            if (value === undefined) value = note.PINNED;
            if (value === undefined) value = note.pinnedYn;
            if (value === undefined) value = note.PINNED_YN;
            if (value === undefined) value = note.isPinned;
            return value === true || value === 1 || String(value || '').toUpperCase() === 'Y';
        }

        function getWorkspaceNoteFileCount(note) {
            var files = note.fileList || note.FILE_LIST || note.files || note.FILES;
            if (Array.isArray(files)) return files.length;
            var count = note.fileCount;
            if (count === undefined) count = note.FILE_COUNT;
            if (count === undefined) count = note.attachCount;
            if (count === undefined) count = note.ATTACH_COUNT;
            count = Number(count || 0);
            return Number.isFinite(count) ? count : 0;
        }

        function formatWorkspaceNoteDate(note) {
            var raw = note.regDt || note.REG_DT || note.createdAt || note.CREATED_AT || note.writeDate || note.WRITE_DATE || '';
            if (!raw) return '';

            var date = raw instanceof Date ? raw : new Date(raw);
            if (Number.isNaN(date.getTime())) {
                var text = String(raw).trim();
                var match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
                if (!match) return '';
                return match[1] + '.' + String(match[2]).padStart(2, '0') + '.' + String(match[3]).padStart(2, '0');
            }

            return date.getFullYear() + '.' +
                String(date.getMonth() + 1).padStart(2, '0') + '.' +
                String(date.getDate()).padStart(2, '0');
        }

        function renderWorkspaceNotes(payload) {
            var target = document.getElementById('workspaceRecentNoteList');
            if (!target) return;

            var list = normalizeWorkspaceNoteList(payload);
            if (list.length === 0) {
                renderWorkspaceNoteEmpty(target);
                return;
            }

            setWorkspaceFeatureState(target, 'ready');
            var visible = list.filter(function(note) { return note && (note.noteId || note.NOTE_ID); }).slice(0, 3);
            if (visible.length === 0) {
                renderWorkspaceNoteEmpty(target);
                return;
            }
            var html = '<div class="workspace-note-items workspace-note-paper-grid">';
            visible.forEach(function(note) {
                var noteId = note.noteId || note.NOTE_ID || '';
                var title = escapeWorkspaceNoteHtml(note.noteTitle || note.NOTE_TITLE || note.title || note.TITLE || '제목 없는 노트');
                var userName = escapeWorkspaceNoteHtml(note.userName || note.USER_NAME || note.writerName || note.WRITER_NAME || '작성자');
                var content = note.previewContent || note.PREVIEW_CONTENT || note.previewText || note.PREVIEW_TEXT || note.memo || note.MEMO || note.content || note.CONTENT || note.noteContent || note.NOTE_CONTENT || '';
                var previewText = stripWorkspaceNoteHtml(content) || '작성된 내용이 없습니다.';
                var preview = escapeWorkspaceNoteHtml(previewText);
                var noteDate = escapeWorkspaceNoteHtml(formatWorkspaceNoteDate(note) || '날짜 정보 없음');

                html += '<a class="workspace-note-paper-card" href="' + getWorkspaceNoteDetailUrl(noteId) + '" aria-label="' + title + ' 노트 보기">' +
                    '<span class="workspace-note-paper">' +
                        '<span class="workspace-note-paper-inner">' +
                            '<strong class="workspace-note-paper-title">' + title + '</strong>' +
                            '<span class="workspace-note-paper-line is-strong"></span>' +
                            '<span class="workspace-note-paper-body">' + preview + '</span>' +
                            '<span class="workspace-note-paper-lines" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>' +
                        '</span>' +
                        '<span class="workspace-note-paper-hover">' +
                            '<strong>' + userName + '</strong>' +
                            '<span>' + noteDate + '</span>' +
                        '</span>' +
                    '</span>' +
                '</a>';
            });
            html += '</div>';
            target.innerHTML = html;
        }

        function renderWorkspaceNoteError(target) {
            if (!target) return;
            setWorkspaceFeatureState(target, 'error');
            target.innerHTML = '<div class="workspace-feature-empty workspace-note-empty is-error"><div><strong>공유 노트를 불러오지 못했습니다.</strong><span>잠시 후 다시 시도해주세요.</span>' +
                workspaceRetryButton('다시 시도', 'loadWorkspaceNotes') + '</div></div>';
        }

        function loadWorkspaceNotes() {
            var target = document.getElementById('workspaceRecentNoteList');
            if (!target) return;
            fetch(workspacePath('/note/api/main?' + getWorkspaceNoteQuery() + '&limit=3'))
                .then(function(response) {
                    if (!response.ok) throw new Error('워크스페이스 노트 API 응답 오류: ' + response.status);
                    return response.json();
                })
                .then(function(payload) { renderWorkspaceNotes(payload); })
                .catch(function(error) {
                    console.error('워크스페이스 공유 노트 로딩 실패:', error);
                    renderWorkspaceNoteError(target);
                });
        }

        document.addEventListener('DOMContentLoaded', function() {
            initWorkspaceGuestJoin();
            if (!WORKSPACE_CONFIG.isMember) return;
            loadDashboardWidgets();
            loadWorkspaceNotes();
            generateCalendar();
            loadCalendarEvents();
        });


/* ===== Group hero menu ===== */
function setWorkspaceGroupMenuOpen(open) {
    const menu = document.getElementById('workspaceGroupMenu');
    const trigger = document.getElementById('workspaceGroupMenuTrigger');
    if (!menu || !trigger) return;

    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) {
        const triggerRect = trigger.getBoundingClientRect();
        const menuWidth = menu.offsetWidth || 168;
        const viewportGap = 12;
        const left = Math.min(
            window.innerWidth - menuWidth - viewportGap,
            Math.max(viewportGap, triggerRect.right - menuWidth)
        );

        menu.style.left = left + 'px';
        menu.style.top = (triggerRect.bottom + 8) + 'px';
        menu.style.right = 'auto';
    } else {
        menu.style.left = '';
        menu.style.top = '';
        menu.style.right = '';
    }
}

function toggleWorkspaceGroupMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('workspaceGroupMenu');
    setWorkspaceGroupMenuOpen(menu ? menu.hidden : false);
}

function initWorkspaceGroupMenu() {
    const trigger = document.getElementById('workspaceGroupMenuTrigger');
    if (!trigger || trigger.dataset.menuBound === 'true') return;

    trigger.dataset.menuBound = 'true';

    // workspaceMain.jsp의 onclick을 우선 사용한다.
    // 인라인 핸들러가 없는 구형 화면에서만 JS 이벤트를 보조로 연결한다.
    if (!trigger.hasAttribute('onclick')) {
        trigger.addEventListener('click', function(event) {
            event.preventDefault();
            toggleWorkspaceGroupMenu(event);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkspaceGroupMenu, { once: true });
} else {
    initWorkspaceGroupMenu();
}

function openMyWorkspaceProfileFromMenu() {
    setWorkspaceGroupMenuOpen(false);
    if (typeof openWorkspaceMemberProfile === 'function' && WORKSPACE_CONFIG.currentUserId) {
        openWorkspaceMemberProfile(WORKSPACE_CONFIG.currentUserId);
    }
}

document.addEventListener('click', function(event) {
    const wrap = document.querySelector('.workspace-group-menu-wrap');
    if (wrap && !wrap.contains(event.target)) {
        setWorkspaceGroupMenuOpen(false);
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        setWorkspaceGroupMenuOpen(false);
    }
});


document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const ownerLeaveModal = document.getElementById('ownerLeaveGuideModal');
        if (ownerLeaveModal && !ownerLeaveModal.hidden) {
            closeOwnerLeaveGuideModal();
        }
    }
});