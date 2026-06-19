
function createProfileCropper(config) {
    const fileInput = document.getElementById(config.fileInputId);
    const viewport = document.getElementById(config.viewportId);
    const image = document.getElementById(config.imageId);
    const placeholder = document.getElementById(config.placeholderId);
    const zoom = document.getElementById(config.zoomId);

    const state = {
        localFile: null,
        localUrl: '',
        externalSrc: '',
        mode: 'custom',
        fallbackText: '?',
        x: 0,
        y: 0,
        scale: 1,
        baseWidth: 0,
        baseHeight: 0,
        dragging: false,
        startPointerX: 0,
        startPointerY: 0,
        startX: 0,
        startY: 0
    };

    function revokeLocalUrl() {
        if (state.localUrl) {
            URL.revokeObjectURL(state.localUrl);
            state.localUrl = '';
        }
    }

    function calculateBaseSize() {
        const viewSize = viewport.clientWidth || 112;
        if (!image.naturalWidth || !image.naturalHeight) return;

        const imageRatio = image.naturalWidth / image.naturalHeight;

        // 확대값 1에서는 원형 영역을 빈 공간 없이 정확히 채우는 cover 기준.
        // 가로 사진은 높이를, 세로 사진은 너비를 원형 크기에 맞춘다.
        if (imageRatio >= 1) {
            state.baseHeight = viewSize;
            state.baseWidth = viewSize * imageRatio;
        } else {
            state.baseWidth = viewSize;
            state.baseHeight = viewSize / imageRatio;
        }

        image.style.width = state.baseWidth + 'px';
        image.style.height = state.baseHeight + 'px';
        image.style.minWidth = '0';
        image.style.minHeight = '0';
        image.style.maxWidth = 'none';
        image.style.maxHeight = 'none';
        image.style.objectFit = 'cover';
    }

    function render() {
        if (image.hidden) return;
        image.style.transform =
            'translate(-50%, -50%) translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')';
    }

    function showPlaceholder() {
        image.hidden = true;
        placeholder.hidden = false;
        placeholder.textContent = state.fallbackText || '?';
        viewport.classList.remove('has-image');
        viewport.style.cursor = 'default';
    }

    function showImage(src, resetPosition) {
        if (!src) {
            showPlaceholder();
            return;
        }

        if (resetPosition) {
            state.x = 0;
            state.y = 0;
            state.scale = 1;
            if (zoom) zoom.value = '1';
        }

        const applyReady = function() {
            calculateBaseSize();
            image.hidden = false;
            placeholder.hidden = true;
            viewport.classList.add('has-image');
            viewport.style.cursor = state.mode === 'custom' ? 'grab' : 'default';
            requestAnimationFrame(render);
        };

        image.onload = applyReady;
        image.src = src;

        if (image.complete && image.naturalWidth) {
            applyReady();
        }
    }

    function refreshDisplay() {
        if (state.mode === 'account') {
            showPlaceholder();
            return;
        }
        if (state.localUrl) {
            showImage(state.localUrl, false);
            return;
        }
        if (state.externalSrc) {
            showImage(state.externalSrc, false);
            return;
        }
        showPlaceholder();
    }

    function setMode(mode, fallbackText) {
        state.mode = mode === 'account' ? 'account' : 'custom';
        if (fallbackText !== undefined) state.fallbackText = fallbackText || '?';
        if (fileInput) fileInput.disabled = state.mode === 'account';
        if (zoom) zoom.disabled = state.mode === 'account';
        refreshDisplay();
    }

    function setFallbackText(text) {
        state.fallbackText = text || '?';
        if (state.mode === 'account' || (!state.localUrl && !state.externalSrc)) {
            showPlaceholder();
        }
    }

    function setExistingImage(src) {
        state.externalSrc = src || '';
        if (!state.localUrl) refreshDisplay();
    }

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;

            revokeLocalUrl();
            state.localFile = file;
            state.localUrl = URL.createObjectURL(file);
            state.x = 0;
            state.y = 0;
            state.scale = 1;
            if (zoom) zoom.value = '1';
            showImage(state.localUrl, true);
        });
    }

    if (zoom) {
        zoom.addEventListener('input', function() {
            state.scale = Number(zoom.value || '1');
            render();
        });
    }

    function onPointerMove(e) {
        if (!state.dragging || state.mode !== 'custom') return;
        state.x = state.startX + (e.clientX - state.startPointerX);
        state.y = state.startY + (e.clientY - state.startPointerY);
        render();
    }

    function endDrag() {
        state.dragging = false;
        if (!image.hidden && state.mode === 'custom') viewport.style.cursor = 'grab';
    }

    viewport.addEventListener('pointerdown', function(e) {
        if (state.mode !== 'custom' || image.hidden) return;
        e.preventDefault();
        state.dragging = true;
        state.startPointerX = e.clientX;
        state.startPointerY = e.clientY;
        state.startX = state.x;
        state.startY = state.y;
        viewport.style.cursor = 'grabbing';
        if (viewport.setPointerCapture) {
            try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
        }
    });

    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endDrag);

    async function getBlob() {
        if (image.hidden || !image.naturalWidth) return null;

        const outputSize = 512;
        const viewSize = viewport.clientWidth || 112;
        const drawWidth = state.baseWidth * state.scale;
        const drawHeight = state.baseHeight * state.scale;
        const drawX = (viewSize - drawWidth) / 2 + state.x;
        const drawY = (viewSize - drawHeight) / 2 + state.y;

        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        const ratio = outputSize / viewSize;
        ctx.scale(ratio, ratio);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        return await new Promise(function(resolve) {
            canvas.toBlob(resolve, 'image/jpeg', 0.92);
        });
    }

    return {
        getBlob: getBlob,
        setMode: setMode,
        setFallbackText: setFallbackText,
        setExistingImage: setExistingImage
    };
}


let modalWorkspaceProfileCropper = null;
'use strict';

const workspaceRoot = document.body;
const WORKSPACE_CONFIG = {
    wsId: workspaceRoot.dataset.wsId || '',
    contextPath: workspaceRoot.dataset.contextPath || '',
    currentUserId: Number(workspaceRoot.dataset.currentUserId || 0),
    isAdmin: workspaceRoot.dataset.workspaceAdmin === 'true',
    isOwner: workspaceRoot.dataset.workspaceOwner === 'true'
};
let openedWorkspaceMemberProfile = null;
        const today = new Date();
        let myWorkspaceDate = new Date(today.getFullYear(), today.getMonth(), 1);
        let workspaceActivePollId = null;

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
            fetch('/workspace/api/' + WORKSPACE_CONFIG.wsId + '/community-summary')
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
                .catch(function(err) { console.error('커뮤니티 요약 로딩 실패:', err); });
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
                if (!events || events.length <= 3) {
                    toggleBtn.style.display = 'none';
                } else {
                    toggleBtn.style.display = 'inline-flex';
                    toggleBtn.textContent = expanded ? '접기' : '더보기';
                    toggleBtn.setAttribute('data-expanded', expanded ? 'true' : 'false');
                }
            }

            if (!events || events.length === 0) {
                listEl.innerHTML = '<li class="workspace-empty-state compact-empty">오늘 예정된 일정이 없습니다. <a class="workspace-empty-inline-link" href="/calendar?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '">일정 보기</a></li>';
                return;
            }

            const limit = 3;
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

        function loadDashboardWidgets() {
            fetch('/api/workspace/' + WORKSPACE_CONFIG.wsId + '/dashboard-widgets')
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    renderWidget('noticeList', data.notices, 'NOTICE');
                    renderWidget('freeList', data.freeBoards, 'FREE');
                    renderWidget('fileList', data.fileBoards, 'FILE');
                })
                .catch(function(err) { console.error('워크스페이스 게시글 로딩 실패:', err); });

            fetch('/workspace/api/' + WORKSPACE_CONFIG.wsId + '/today-events')
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    renderTodaySchedule((data || []).filter(isWorkspaceVisibleTodayEvent), false);
                })
                .catch(function(err) { console.error('오늘 일정 로딩 실패:', err); });

            fetch('/api/photo-posts/recent?scopeType=WORKSPACE&scopeId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&limit=2')
                .then(function(res) {
                    if (!res.ok) throw new Error('사진첩 API 응답 오류: ' + res.status);
                    return res.json();
                })
                .then(renderPhotoAlbum)
                .catch(function(err) {
                    console.error('최근 사진 로딩 실패:', err);
                    renderPhotoAlbum([]);
                });

            loadActivePoll();
            loadCommunitySummary();
        }

        function renderWidget(targetId, list, type) {
            const targetUl = document.getElementById(targetId);
            if (!targetUl) return;
            targetUl.innerHTML = '';

            if (!list || list.length === 0) {
                const emptyMap = {
                    NOTICE: { text: '아직 공지사항이 없습니다.', action: '공지 작성하기' },
                    FREE: { text: '아직 자유 피드가 없습니다.', action: '첫 글 남기기' },
                    FILE: { text: '아직 자료가 없습니다.', action: '자료 올리기' }
                };
                const empty = emptyMap[type] || { text: '등록된 글이 없습니다.', action: '게시판 가기' };
                const boardUrl = '/group/board/list?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&type=' + encodeURIComponent(type);
                targetUl.innerHTML = '<li class="workspace-empty-state workspace-board-empty-line"><span>' + empty.text + '</span><a href="' + boardUrl + '">' + empty.action + '</a></li>';
                return;
            }

            list.slice(0, 3).forEach(function(post) {
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
                    '<a href="/group/board/detail?postId=' + encodeURIComponent(post.postId) + '&wsId=' + encodeURIComponent(post.wsId) + '">' +
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

            const albumUrl = '/photo-album?scopeType=WORKSPACE&scopeId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId);
            if (!list || list.length === 0) {
                target.innerHTML = '<div class="workspace-feature-empty workspace-photo-empty"><span class="workspace-feature-empty-icon">📷</span><div><strong>아직 공유된 사진이 없습니다.</strong><span>앨범을 만들지 않아도 사진을 바로 공유할 수 있습니다.</span><a class="workspace-feature-empty-action" href="' + albumUrl + '">첫 사진 공유</a></div></div>';
                return;
            }

            target.innerHTML = list.slice(0, 2).map(function(post) {
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

            const pollListUrl = '/poll/list?scope=WORKSPACE&wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId);
            const listApiUrl = '/api/polls/list?scope=WORKSPACE&wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId);

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
                    const previewPolls = activePolls.slice(0, 2).map(function(poll) {
                        return { poll: poll, section: 'active' };
                    });

                    if (previewPolls.length === 0) {
                        workspaceActivePollId = null;
                        area.innerHTML = '' +
                            '<div class="workspace-poll-summary-empty">' +
                                '<div><strong>등록된 투표가 없습니다.</strong><span>의견을 모아야 할 때 새 투표를 시작해보세요.</span></div>' +
                                '<a href="' + pollListUrl + '">새 투표 만들기</a>' +
                            '</div>';
                        return;
                    }

                    return Promise.all(previewPolls.map(function(item) {
                        const pollId = item.poll.POLL_ID || item.poll.pollId;
                        return fetch('/api/polls/detail?pollId=' + encodeURIComponent(pollId))
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
                    area.innerHTML = '<div class="workspace-poll-summary-error">투표를 불러오지 못했습니다.</div>';
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

            fetch('/api/polls/vote', {
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


function setWorkspaceProfileModalVisible(visible) {
    const modal = document.getElementById('memberProfileModal');
    const overlay = document.getElementById('memberProfileOverlay');
    if (!modal || !overlay) return;
    modal.style.display = visible ? 'block' : 'none';
    overlay.style.display = visible ? 'block' : 'none';
    document.body.classList.toggle('workspace-modal-open', visible);
}

function closeWorkspaceMemberProfile() {
    setWorkspaceProfileModalVisible(false);
    openedWorkspaceMemberProfile = null;
}

function workspaceProfileValue(data, camel, upper) {
    return data && data[camel] != null ? data[camel] : (data ? data[upper] : null);
}

function openWorkspaceMemberProfile(userId) {
    const loading = document.getElementById('memberProfileLoading');
    const content = document.getElementById('memberProfileContent');
    if (!loading || !content) return;

    openedWorkspaceMemberProfile = null;
    loading.hidden = false;
    content.hidden = true;
    setWorkspaceProfileModalVisible(true);

    fetch('/workspace/api/' + encodeURIComponent(WORKSPACE_CONFIG.wsId)
        + '/members/' + encodeURIComponent(userId) + '/profile')
        .then(function(res) {
            if (res.status === 401) throw new Error('LOGIN_REQUIRED');
            if (res.status === 403) throw new Error('FORBIDDEN');
            if (!res.ok) throw new Error('PROFILE_LOAD_FAILED');
            return res.json();
        })
        .then(function(data) {
            openedWorkspaceMemberProfile = data;
            renderWorkspaceMemberProfile(data);
            loading.hidden = true;
            content.hidden = false;
        })
        .catch(function(err) {
            console.error('멤버 프로필 로딩 실패:', err);
            loading.textContent = err.message === 'LOGIN_REQUIRED'
                ? '로그인이 필요합니다.'
                : '프로필을 불러오지 못했습니다.';
        });
}

function renderWorkspaceMemberProfile(data) {
    const userId = Number(workspaceProfileValue(data, 'userId', 'USER_ID') || 0);
    const isMe = userId === WORKSPACE_CONFIG.currentUserId;
    const displayName = workspaceProfileValue(data, 'displayName', 'DISPLAY_NAME') || '';
    const positionName = workspaceProfileValue(data, 'positionName', 'POSITION_NAME') || '';
    const role = workspaceProfileValue(data, 'workspaceRole', 'WS_ROLE') || 'MEMBER';
    const isOwner = String(workspaceProfileValue(data, 'isOwner', 'IS_OWNER') || 'N') === 'Y';
    const phone = workspaceProfileValue(data, 'phoneNumber', 'PHONE_NUMBER') || '';
    const showPhone = String(workspaceProfileValue(data, 'showPhone', 'SHOW_PHONE') || 'N') === 'Y';
    const useAccount = String(workspaceProfileValue(data, 'useAccountProfile', 'USE_ACCOUNT_PROFILE') || 'Y') === 'Y';
    const imagePath = workspaceProfileValue(data, 'profileImagePath', 'PROFILE_IMAGE_PATH') || '';

    document.getElementById('memberProfileModalTitle').textContent = isMe ? '내 워크스페이스 프로필' : '멤버 프로필';
    document.getElementById('memberProfileName').textContent = displayName;
    document.getElementById('memberProfilePosition').textContent = positionName || '직책 미입력';
    document.getElementById('memberProfileRole').textContent =
        isOwner ? '그룹장' : (role === 'ADMIN' ? '관리자' : '멤버');
    document.getElementById('memberProfileEmail').textContent = workspaceProfileValue(data, 'email', 'EMAIL') || '-';
    document.getElementById('memberProfileJoinedAt').textContent =
        workspaceProfileValue(data, 'joinedAt', 'JOINED_AT') || '-';

    const phoneRow = document.getElementById('memberProfilePhoneRow');
    const canSeePhone = isMe || showPhone;
    phoneRow.hidden = !canSeePhone || !phone;
    document.getElementById('memberProfilePhone').textContent = phone || '-';

    if (!modalWorkspaceProfileCropper) {
        modalWorkspaceProfileCropper = createProfileCropper({
            fileInputId: 'modalProfileImageInput',
            viewportId: 'modalProfileViewport',
            imageId: 'modalProfileCropImage',
            placeholderId: 'modalProfilePlaceholder',
            zoomId: 'modalProfileZoom'
        });
    }
    modalWorkspaceProfileCropper.setFallbackText(displayName ? displayName.substring(0, 1) : '?');
    modalWorkspaceProfileCropper.setExistingImage(imagePath);

    const avatar = document.getElementById('memberProfileAvatar');
    avatar.innerHTML = '';
    if (imagePath) {
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = '';
        img.onerror = function() {
            avatar.textContent = displayName.substring(0, 1);
            img.remove();
        };
        avatar.appendChild(img);
    } else {
        avatar.textContent = displayName.substring(0, 1);
    }

    const view = document.getElementById('memberProfileView');
    const edit = document.getElementById('memberProfileEdit');
    view.hidden = isMe;
    edit.hidden = !isMe;

    if (isMe) {
        document.getElementById('profileUseAccount').checked = useAccount;
        document.getElementById('profileDisplayName').value =
            workspaceProfileValue(data, 'customDisplayName', 'CUSTOM_DISPLAY_NAME') || displayName;
        document.getElementById('profilePositionName').value = positionName;
        document.getElementById('profileContactEmail').value =
            workspaceProfileValue(data, 'email', 'EMAIL') || '';
        document.getElementById('profilePhoneNumber').value = phone;
        document.getElementById('profileShowPhone').checked = showPhone;
        const displayNameInput = document.getElementById('profileDisplayName');
        if (displayNameInput && !displayNameInput.dataset.cropperBound) {
            displayNameInput.addEventListener('input', function() {
                if (modalWorkspaceProfileCropper) {
                    const text = (this.value || '').trim().substring(0, 1) || '?';
                    modalWorkspaceProfileCropper.setFallbackText(text);
                }
            });
            displayNameInput.dataset.cropperBound = 'Y';
        }
        syncWorkspaceProfileAccountMode();
    }

    renderWorkspaceProfileActions(data, isMe, role, isOwner);
}

function syncWorkspaceProfileAccountMode() {
    const useAccount = document.getElementById('profileUseAccount');
    const displayName = document.getElementById('profileDisplayName');
    if (!useAccount || !displayName) return;

    const avatarText = (displayName.value || '').trim().substring(0, 1) || '?';
    displayName.disabled = useAccount.checked;
    const editor = document.querySelector('.workspace-profile-image-editor');
    if (editor) editor.style.opacity = useAccount.checked ? '.55' : '1';
    if (modalWorkspaceProfileCropper) {
        modalWorkspaceProfileCropper.setMode(useAccount.checked ? 'account' : 'custom', avatarText);
    }
}

function renderWorkspaceProfileActions(data, isMe, role, isOwner) {
    const actions = document.getElementById('memberProfileActions');
    const userId = Number(workspaceProfileValue(data, 'userId', 'USER_ID') || 0);
    actions.innerHTML = '';
    actions.classList.remove('is-empty');

    if (isMe) {
        if (!isOwner) {
            const leave = document.createElement('button');
            leave.type = 'button';
            leave.className = 'workspace-profile-danger-link';
            leave.textContent = '워크스페이스 나가기';
            leave.onclick = leaveWorkspace;
            actions.appendChild(leave);
        } else {
            const guide = document.createElement('span');
            guide.className = 'workspace-profile-owner-guide';
            guide.textContent = '그룹장은 다른 멤버에게 그룹장 권한을 넘긴 뒤 나갈 수 있습니다.';
            actions.appendChild(guide);
        }

        const right = document.createElement('div');
        right.className = 'workspace-profile-action-right';

        const save = document.createElement('button');
        save.type = 'submit';
        save.className = 'workspace-profile-save-button';
        save.textContent = '저장';
        save.setAttribute('form', 'memberProfileEdit');

        right.appendChild(save);
        actions.appendChild(right);
        return;
    }

    if (WORKSPACE_CONFIG.isAdmin) {
        const right = document.createElement('div');
        right.className = 'workspace-profile-action-right';

        if (WORKSPACE_CONFIG.isOwner && !isOwner) {
            const transfer = document.createElement('button');
            transfer.type = 'button';
            transfer.className = 'workspace-profile-manage-button';
            transfer.textContent = '그룹장 권한 넘기기';
            transfer.onclick = function() { transferWorkspaceAdminFromProfile(userId); };
            right.appendChild(transfer);
        }

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'workspace-profile-manage-button is-danger';
        remove.textContent = '내보내기';
        remove.onclick = function() { removeWorkspaceMemberFromProfile(userId); };
        right.appendChild(remove);
        actions.appendChild(right);
    } else {
        // 조회 전용 화면은 우측 상단 X 버튼으로만 닫는다.
        actions.classList.add('is-empty');
    }
}

async function saveWorkspaceMemberProfile(event) {
    event.preventDefault();

    const useAccount = document.getElementById('profileUseAccount').checked ? 'Y' : 'N';
    const displayName = document.getElementById('profileDisplayName').value.trim();
    const contactEmail = document.getElementById('profileContactEmail').value.trim();

    if (!contactEmail) {
        alert('워크스페이스 이메일을 입력해주세요.');
        return;
    }
    if (useAccount === 'N' && !displayName) {
        alert('워크스페이스 표시 이름을 입력해주세요.');
        return;
    }

    const formData = new FormData();
    formData.append('useAccountProfile', useAccount);
    formData.append('displayName', displayName);
    formData.append('contactEmail', contactEmail);
    formData.append('positionName', document.getElementById('profilePositionName').value.trim());
    formData.append('phoneNumber', document.getElementById('profilePhoneNumber').value.trim());
    formData.append('showPhone',
        document.getElementById('profileShowPhone').checked ? 'Y' : 'N');

    if (useAccount === 'N' && modalWorkspaceProfileCropper) {
        const blob = await modalWorkspaceProfileCropper.getBlob();
        if (blob) formData.append('profileImage', blob, 'workspace_profile.jpg');
    }

    fetch('/workspace/api/' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '/members/me/profile', {
        method: 'POST',
        body: formData
    })
    .then(function(res) { return res.ok ? res.json() : Promise.reject(new Error('SAVE_FAILED')); })
    .then(function(result) {
        if (!result || result.success !== true) {
            alert(result && result.message ? result.message : '프로필 저장에 실패했습니다.');
            return;
        }
        alert('워크스페이스 프로필을 저장했습니다.');
        location.reload();
    })
    .catch(function(err) {
        console.error('프로필 저장 실패:', err);
        alert('프로필 저장 중 오류가 발생했습니다.');
    });
}

function transferWorkspaceAdminFromProfile(userId) {
    if (!confirm('이 멤버에게 그룹장 권한을 넘기시겠습니까? 권한을 넘기면 본인은 일반 멤버가 됩니다.')) return;
    const params = new URLSearchParams();
    params.append('wsId', WORKSPACE_CONFIG.wsId);
    params.append('newAdminId', userId);
    fetch('/workspace/api/transfer-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'success') {
            alert('그룹장 권한을 넘겼습니다.');
            location.reload();
        } else {
            alert('권한 변경에 실패했습니다.');
        }
    });
}

function removeWorkspaceMemberFromProfile(userId) {
    if (!confirm('이 멤버를 워크스페이스에서 내보내시겠습니까?')) return;
    const params = new URLSearchParams();
    params.append('wsId', WORKSPACE_CONFIG.wsId);
    params.append('userId', userId);
    fetch('/workspace/api/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'success') {
            alert('멤버를 워크스페이스에서 내보냈습니다.');
            location.reload();
        } else {
            alert('멤버 내보내기에 실패했습니다.');
        }
    });
}

document.addEventListener('change', function(event) {
    if (event.target && event.target.id === 'profileUseAccount') {
        syncWorkspaceProfileAccountMode();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;

    const inviteModal = document.getElementById('inviteModal');
    if (inviteModal && inviteModal.style.display === 'block') {
        closeInviteModal();
        return;
    }

    closeWorkspaceMemberProfile();
});


        function setInviteModalVisible(visible) {
            const modal = document.getElementById('inviteModal');
            const overlay = document.getElementById('inviteOverlay');
            if (!modal || !overlay) return;

            modal.style.display = visible ? 'block' : 'none';
            overlay.style.display = visible ? 'block' : 'none';
            document.body.classList.toggle('workspace-main-invite-open', visible);

            if (visible) {
                const input = document.getElementById('searchEmail');
                if (input) {
                    window.setTimeout(function() { input.focus(); }, 80);
                }
                return;
            }

            const input = document.getElementById('searchEmail');
            const list = document.getElementById('userList');
            if (input) input.value = '';
            if (list) {
                list.innerHTML =
                    '<div class="workspace-main-invite-empty">이메일로 멤버를 검색하세요.</div>';
            }
        }

        function openInviteModal() {
            setInviteModalVisible(true);
        }

        function closeInviteModal() {
            setInviteModalVisible(false);
        }

        function searchUser() {
            const emailInput = document.getElementById('searchEmail');
            const email = emailInput ? emailInput.value.trim() : '';
            const userListDiv = document.getElementById('userList');

            if (email.length < 2) {
                alert('검색할 이메일을 2자 이상 입력해주세요.');
                if (emailInput) emailInput.focus();
                return;
            }

            userListDiv.innerHTML =
                '<div class="workspace-main-invite-empty">검색 중입니다.</div>';

            fetch('/workspace/api/search-member?wsId=' + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '&email=' + encodeURIComponent(email))
                .then(function(res) {
                    if (!res.ok) throw new Error('SEARCH_FAILED');
                    return res.json();
                })
                .then(function(data) {
                    if (!Array.isArray(data) || data.length === 0) {
                        userListDiv.innerHTML =
                            '<div class="workspace-main-invite-empty">검색된 사용자가 없습니다.</div>';
                        return;
                    }

                    userListDiv.innerHTML = data.map(function(user) {
                        const userEmail = user.email || user.EMAIL || '';
                        const userName = user.userName || user.USER_NAME || userEmail;
                        const profileImage =
                            user.profileImagePath ||
                            user.PROFILE_IMAGE_PATH ||
                            user.profileImage ||
                            user.PROFILE_IMAGE ||
                            '';
                        const initial = userName ? userName.substring(0, 1) : '?';
                        const memberStatus = user.memberStatus || 'AVAILABLE';

                        const avatar = profileImage
                            ? '<img src="' + escapeWorkspaceHtml(profileImage) + '" alt="">'
                            : escapeWorkspaceHtml(initial);

                        let actionButton = '';
                        if (memberStatus === 'AVAILABLE') {
                            actionButton =
                                '<button type="button" data-email="' +
                                escapeWorkspaceHtml(userEmail) +
                                '" onclick="inviteUser(this.dataset.email, this)">초대</button>';
                        } else if (memberStatus === 'ALREADY_MEMBER') {
                            actionButton =
                                '<button type="button" class="is-disabled" disabled>가입됨</button>';
                        } else if (memberStatus === 'PENDING') {
                            actionButton =
                                '<button type="button" class="is-disabled" disabled>초대 대기</button>';
                        } else {
                            actionButton =
                                '<button type="button" class="is-disabled" disabled>내 계정</button>';
                        }

                        return '<div class="workspace-main-invite-user-row">' +
                            '<div class="workspace-main-invite-avatar">' + avatar + '</div>' +
                            '<div class="workspace-main-invite-user-info">' +
                                '<strong>' + escapeWorkspaceHtml(userName) + '</strong>' +
                                '<span>' + escapeWorkspaceHtml(userEmail) + '</span>' +
                            '</div>' +
                            actionButton +
                        '</div>';
                    }).join('');
                })
                .catch(function(error) {
                    console.error('초대 사용자 검색 실패:', error);
                    userListDiv.innerHTML =
                        '<div class="workspace-main-invite-empty">검색 중 오류가 발생했습니다.</div>';
                });
        }

        function inviteUser(inviteeEmail, button) {
            if (button) {
                button.disabled = true;
                button.textContent = '처리 중';
            }

            fetch('/workspace/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wsId: parseInt(WORKSPACE_CONFIG.wsId, 10),
                    email: inviteeEmail
                })
            })
            .then(function(res) {
                if (!res.ok) throw new Error('INVITE_FAILED');
                return res.json();
            })
            .then(function(result) {
                if (result.status === 'SUCCESS') {
                    alert('초대장을 보냈습니다.');
                    searchUser();
                } else if (result.status === 'ALREADY_MEMBER') {
                    alert('이미 워크스페이스에 참여 중인 사용자입니다.');
                } else if (result.status === 'ALREADY_EXISTS') {
                    alert('이미 초대 대기 중인 사용자입니다.');
                } else if (result.status === 'SELF_INVITE') {
                    alert('본인은 초대할 수 없습니다.');
                } else if (result.status === 'NOT_FOUND'
                        || result.status === 'USER_NOT_FOUND') {
                    alert('해당 이메일의 사용자를 찾지 못했습니다.');
                } else if (result.status === 'LOGIN_REQUIRED') {
                    alert('로그인이 필요합니다.');
                } else if (result.status === 'ERROR') {
                    console.error('워크스페이스 초대 서버 오류:', result);
                    alert('초대 저장 중 오류가 발생했습니다. 서버 로그를 확인해주세요.');
                } else {
                    alert('초대 처리 중 오류가 발생했습니다.');
                }

                if (button && result.status !== 'SUCCESS') {
                    button.disabled = false;
                    button.textContent = '초대';
                }
            })
            .catch(function(error) {
                console.error('워크스페이스 초대 실패:', error);
                alert('초대 처리 중 오류가 발생했습니다.');
                if (button) {
                    button.disabled = false;
                    button.textContent = '초대';
                }
            });
        }

        function leaveWorkspace() {
            if (!confirm('정말 이 그룹을 탈퇴하시겠습니까?')) return;
            const params = new URLSearchParams();
            params.append('wsId', WORKSPACE_CONFIG.wsId);
            fetch('/workspace/api/leave', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params })
                .then(function(res) { return res.text(); })
                .then(function(result) {
                    if (result === 'SUCCESS') { alert('탈퇴 완료되었습니다.'); location.href = '/calendar'; }
                    else { alert('탈퇴 처리 중 오류가 발생했습니다.'); }
                });
        }

        function loadCalendarEvents() {
            const grid = document.getElementById('calendarGrid');
            if (!grid) return;

            fetch('/api/workspace/' + WORKSPACE_CONFIG.wsId + '/calendar-events')
                .then(function(res) { return res.json(); })
                .then(function(data) {
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
                .catch(function(err) { console.error('캘린더 로딩 에러:', err); });
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
            location.href = WORKSPACE_CONFIG.contextPath + '/calendar?wsId=' + WORKSPACE_CONFIG.wsId + '&mode=GROUP_REG';
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
            var wsId = target && target.dataset ? target.dataset.wsId : '';
            if (!wsId && typeof WORKSPACE_CONFIG !== 'undefined') wsId = WORKSPACE_CONFIG.wsId || '';
            return 'scope=WS&wsId=' + encodeURIComponent(wsId);
        }

        function getWorkspaceNoteListUrl() {
            return '/note/list?' + getWorkspaceNoteQuery();
        }

        function getWorkspaceNoteWriteUrl() {
            return '/note/write?' + getWorkspaceNoteQuery();
        }

        function getWorkspaceNoteDetailUrl(noteId) {
            return '/note/detail?noteId=' + encodeURIComponent(noteId) + '&' + getWorkspaceNoteQuery();
        }

        function renderWorkspaceNoteEmpty(target) {
            target.innerHTML = '<a class="workspace-note-empty-link" href="' + getWorkspaceNoteWriteUrl() + '">' +
                '<span class="workspace-note-placeholder-icon">📝</span>' +
                '<span class="workspace-note-placeholder-copy">' +
                '<strong>아직 작성된 노트가 없습니다.</strong>' +
                '<span>첫 공유 노트를 작성해 멤버들과 함께 확인하세요.</span>' +
                '<em>첫 노트 작성 →</em>' +
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

        function renderWorkspaceNotes(payload) {
            var target = document.getElementById('workspaceRecentNoteList');
            if (!target) return;

            var list = normalizeWorkspaceNoteList(payload);
            if (list.length === 0) {
                renderWorkspaceNoteEmpty(target);
                return;
            }

            var visible = list.slice(0, 2);
            var html = '<div class="workspace-note-items">';
            visible.forEach(function(note) {
                var noteId = note.noteId || note.NOTE_ID || '';
                var title = escapeWorkspaceNoteHtml(note.noteTitle || note.NOTE_TITLE || note.title || note.TITLE || '제목 없음');
                var userName = escapeWorkspaceNoteHtml(note.userName || note.USER_NAME || note.writerName || note.WRITER_NAME || '작성자');
                var content = note.memo || note.MEMO || note.content || note.CONTENT || note.noteContent || note.NOTE_CONTENT || '';
                var previewText = stripWorkspaceNoteHtml(content) || '작성된 내용이 없습니다.';
                var preview = escapeWorkspaceNoteHtml(previewText);
                var pinned = isWorkspaceNotePinned(note);
                var fileCount = getWorkspaceNoteFileCount(note);

                html += '<a class="workspace-note-item" href="' + getWorkspaceNoteDetailUrl(noteId) + '">' +
                    '<span class="workspace-note-item-title-row">' +
                        '<strong class="workspace-note-item-title">' + title + '</strong>' +
                        (pinned ? '<span class="workspace-note-mini-chip pin">고정</span>' : '') +
                    '</span>' +
                    '<span class="workspace-note-item-preview">' + preview + '</span>' +
                    '<span class="workspace-note-item-footer">' +
                        '<span class="workspace-note-author">' + userName + '</span>' +
                        (fileCount > 0 ? '<span class="workspace-note-mini-chip">첨부 ' + fileCount + '</span>' : '') +
                    '</span>' +
                '</a>';
            });
            if (list.length > 2) {
                html += '<a class="workspace-note-more-row" href="' + getWorkspaceNoteListUrl() + '">+' + (list.length - 2) + '개 노트 더 보기</a>';
            }
            html += '</div>';
            target.innerHTML = html;
        }

        function loadWorkspaceNotes() {
            var target = document.getElementById('workspaceRecentNoteList');
            if (!target) return;
            fetch('/note/api/main?' + getWorkspaceNoteQuery() + '&limit=3')
                .then(function(response) {
                    if (!response.ok) throw new Error('워크스페이스 노트 API 응답 오류: ' + response.status);
                    return response.json();
                })
                .then(function(payload) { renderWorkspaceNotes(payload); })
                .catch(function(error) {
                    console.error('워크스페이스 공유 노트 로딩 실패:', error);
                    renderWorkspaceNoteEmpty(target);
                });
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadDashboardWidgets();
            loadWorkspaceNotes();
            generateCalendar();
            loadCalendarEvents();
        });
