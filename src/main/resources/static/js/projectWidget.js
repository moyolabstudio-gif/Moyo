/**
 * MOYO 프로젝트 위젯
 * 게시판, 노트, 투표, 사진 위젯과 공통 모달을 담당합니다.
 */

function loadAllWidgets(projId) {
                    if (window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.isPersonalProject) return;
				    if (!projId) {
				        console.warn("프로젝트 위젯 로딩 중단: projId가 없습니다.");
				        return;
				    }

				    fetch('/api/workspace/project/' + projId + '/dashboard-widgets')
				        .then(res => {
				            if (!res.ok) throw new Error('위젯 API 응답 오류: ' + res.status);
				            return res.json();
				        })
				        .then(data => {
				            console.log("프로젝트 위젯 데이터:", data);

				            renderWidget('noticeBoard', data.notice || data.notices || [], projId, 'NOTICE');
					            renderWidget('fileBoard', data.file || data.files || data.fileBoards || [], projId, 'FILE');

})
				        .catch(err => {
				            console.error("프로젝트 위젯 로딩 실패:", err);
				        });
				}

				function renderWidget(elementId, list, projId, type) {
				    const target = document.getElementById(elementId);
				    const wsId = new URLSearchParams(window.location.search).get('wsId');

				    if (!target) {
				        console.warn("위젯 영역을 찾을 수 없습니다:", elementId);
				        return;
				    }

				    target.innerHTML = '';

				    if (!list || list.length === 0) {
				        target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">등록된 글이 없습니다.</p>';
				        return;
				    }

				    let html = '<ul class="board-list-inner">';

				    list.slice(0, 3).forEach(post => {
				        const postId = post.postId || post.POST_ID;
				        const title = post.title || post.TITLE || '제목 없음';
				        const regDt = post.regDt || post.REG_DT || '';

				        html += '<li class="board-item">' +
				                    '<a href="/group/board/detail?postId=' + postId + '&projId=' + projId + '&wsId=' + wsId + '">' +
				                        title +
				                    '</a>' +
				                    '<span class="board-date">' + regDt + '</span>' +
				                '</li>';
				    });

				    html += '</ul>';
				    target.innerHTML = html;
				}
                document.addEventListener('DOMContentLoaded', function() {
                    const editStartDate = document.getElementById('editStartDate');
                    const editEndDate = document.getElementById('editEndDate');

                    if (editStartDate && editEndDate) {
                        editStartDate.addEventListener('change', function() {
                            const startDate = editStartDate.value;
                            const endDate = editEndDate.value;

                            if (!startDate) return;

                            editEndDate.setAttribute('min', startDate);

                            if (endDate && endDate < startDate) {
                                editEndDate.value = startDate;
                            }
                        });
                    }
                });
// 모달 열기
				function openModal(id) {
				    document.getElementById(id).style.display = 'flex';
				}

				// 모달 닫기
				function closeModal(id) {
				    document.getElementById(id).style.display = 'none';
				}

        /* ===== Work note widget script ===== */
        function renderSharedNotePlaceholder(target) {
            if (!target) return;
            target.innerHTML = '<div class="work-note-empty">' +
                '<div class="work-note-empty-left">' +
                '<div class="work-note-empty-icon">📝</div>' +
                '<div><strong>아직 작성된 노트가 없습니다.</strong><span>회의 기록이나 작업 메모를 첫 노트로 남기고<br>프로젝트 메인에서 바로 확인해보세요.</span></div>' +
                '</div>' +
                '<a class="empty-note-write-link" href="' + getProjectNoteWriteUrl() + '">+ 첫 노트 작성</a>' +
                '</div>';
        }

        function getProjectNoteScopeQuery() {
            const params = new URLSearchParams(window.location.search);
            const config = window.PROJECT_MAIN_CONFIG || {};
            const wsId = config.wsId || config.paramWsId || params.get('wsId') || '';
            const projId = config.projectId || config.paramProjId || params.get('projId') || '';
            const query = new URLSearchParams();
            query.set('scope', 'PROJ');
            if (wsId) query.set('wsId', wsId);
            if (projId) query.set('projId', projId);
            return query.toString();
        }

        function getProjectNoteWriteUrl() {
            return '/note/write?' + getProjectNoteScopeQuery();
        }

        function getProjectNoteDetailUrl(noteId) {
            return '/note/detail?noteId=' + encodeURIComponent(noteId) + '&' + getProjectNoteScopeQuery();
        }

        function normalizeSharedNoteSection() {
            var target = document.getElementById('recentNoteList');
            if (!target) return;
            var section = target.closest('.note-main-section, section, article, .widget-card, .dashboard-card, .content-section');
            if (!section) return;
            section.classList.add('shared-note-ready-section');
            var title = section.querySelector('h1, h2, h3, .section-title, .note-section-title');
            if (title) title.innerHTML = '📝 공유 노트';
            var desc = section.querySelector('.note-section-header p, .section-desc, .section-subtitle, p');
            if (desc) desc.textContent = '회의 기록, 작업 메모, 첨부파일을 공유합니다.';
        }

        function loadRecentNotes() {
            const target = document.getElementById('recentNoteList');
            if (!target) return;
            normalizeSharedNoteSection();
            target.innerHTML = '<div class="work-note-empty"><div class="work-note-empty-left"><div class="work-note-empty-icon">📝</div><div><strong>노트를 불러오는 중입니다.</strong><span>잠시만 기다려 주세요.</span></div></div></div>';
            fetch('/note/api/main?' + getProjectNoteScopeQuery() + '&limit=3')
                .then(function(response) { return response.ok ? response.json() : []; })
                .then(function(list) { renderRecentNotes(list || []); })
                .catch(function() { renderSharedNotePlaceholder(target); });
        }

        function renderRecentNotes(list) {
            const target = document.getElementById('recentNoteList');
            if (!target) return;
            if (!Array.isArray(list) || list.length === 0) {
                renderSharedNotePlaceholder(target);
                return;
            }
            var visible = list.slice(0, 2);
            var html = '<div class="project-note-items">';
            visible.forEach(function(note) {
                var noteId = note.noteId || note.NOTE_ID;
                var title = escapeNoteHtml(note.noteTitle || note.NOTE_TITLE || '제목 없음');
                var userName = escapeNoteHtml(note.userName || note.USER_NAME || '작성자');
                var memo = escapeNoteHtml((note.memo || note.MEMO || '작성된 내용이 없습니다.').replace(/<[^>]*>/g, ' '));
                var pinned = note.pinned || note.PINNED;
                var files = note.fileList || [];
                html += '<a class="project-note-row" href="' + getProjectNoteDetailUrl(noteId) + '">' +
                    '<span class="project-note-row-head">' +
                        '<strong class="project-note-row-title">' + title + '</strong>' +
                        (pinned ? '<span class="project-note-row-chip pin">고정</span>' : '') +
                    '</span>' +
                    '<span class="project-note-row-preview">' + memo + '</span>' +
                    '<span class="project-note-row-foot">' +
                        '<span class="project-note-row-writer">' + userName + '</span>' +
                        (files.length ? '<span class="project-note-row-chip file">첨부 ' + files.length + '</span>' : '') +
                    '</span>' +
                '</a>';
            });
            html += '</div>';
            target.innerHTML = html;
        }

        function escapeNoteHtml(value) {
            if (value === null || value === undefined) return '';
            return String(value)
                .replaceAll('&','&amp;')
                .replaceAll('<','&lt;')
                .replaceAll('>','&gt;')
                .replaceAll('"','&quot;')
                .replaceAll("'",'&#039;');
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadRecentNotes();
            setTimeout(loadRecentNotes, 150);
        });
        /* ===== End work note widget script ===== */


        function escapeHtml(value) {
            return String(value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }



/* ===== Project active poll widget ===== */
let projectActivePollId = null;

function getProjectMainWsId() {
    return new URLSearchParams(window.location.search).get('wsId') || '';
}

function getProjectMainProjId() {
    return new URLSearchParams(window.location.search).get('projId') || '';
}

function getProjectPollListUrl() {
    const wsId = encodeURIComponent(getProjectMainWsId());
    const projId = encodeURIComponent(getProjectMainProjId());
    return '/poll/list?scope=PROJECT&wsId=' + wsId + '&projId=' + projId;
}

function getProjectMainLoginUserId() {
    const fromBody = document.body ? (document.body.dataset.userId || '') : '';
    if (fromBody) return fromBody;
    return window.LOGIN_USER_ID || '';
}

function normalizeProjectPollData(data) {
    if (!data || Object.keys(data).length === 0) return null;

    const question = data.question || data.QUESTION;
    const pollId = data.pollId || data.POLL_ID || data.poll_id;

    if (!question || !pollId) return null;

    return {
        pollId: pollId,
        question: question,
        options: Array.isArray(data.options) ? data.options : []
    };
}

function loadProjectActivePoll() {
    if (window.PROJECT_MAIN_CONFIG && window.PROJECT_MAIN_CONFIG.isPersonalProject) return;
    const target = document.getElementById('projectActivePollArea');
    const wsId = getProjectMainWsId();
    const projId = getProjectMainProjId();

    if (!target) return;

    if (!wsId || !projId) {
        target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">프로젝트 정보를 찾을 수 없습니다.</p>';
        return;
    }

    target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">진행 중인 투표 목록을 불러오는 중입니다.</p>';

    fetch('/api/polls/list?scope=PROJECT&wsId=' + encodeURIComponent(wsId) + '&projId=' + encodeURIComponent(projId))
        .then(function(res) {
            if (!res.ok) throw new Error('투표 목록 API 응답 오류: ' + res.status);
            return res.json();
        })
        .then(function(list) {
            const activePolls = Array.isArray(list)
                ? list.filter(function(poll) {
                    return !isProjectPollClosed(poll);
                })
                : [];

            renderProjectActivePollList(activePolls);
        })
        .catch(function(err) {
            console.error('프로젝트 메인 투표 목록 조회 실패:', err);
            target.innerHTML = '<div class="project-poll-error">투표 목록을 불러오지 못했습니다.</div>';
        });
}

function isProjectPollClosed(poll) {
    const status = String(poll.STATUS || poll.status || '').toUpperCase();
    if (status === 'CLOSED') return true;

    const endValue = poll.END_DT || poll.endDt;
    if (!endValue) return false;

    const endDate = new Date(endValue);
    return !Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now();
}

function renderProjectActivePollList(polls) {
    const target = document.getElementById('projectActivePollArea');
    const countTarget = document.getElementById('projectActivePollCount');

    if (!target) return;

    const activePolls = Array.isArray(polls) ? polls : [];

    if (countTarget) {
        countTarget.textContent = String(activePolls.length);
    }

    if (activePolls.length === 0) {
        target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">등록된 글이 없습니다.</p>';
        return;
    }

    const visiblePolls = activePolls.slice(0, 4);
    let html = '<div class="project-poll-list">';

    visiblePolls.forEach(function(poll) {
        const pollId = poll.POLL_ID || poll.pollId;
        const question = poll.QUESTION || poll.question || '질문 없음';
        const endDt = poll.END_DT || poll.endDt || '';
        const href = getProjectPollListUrl() + '&pollId=' + encodeURIComponent(pollId);

        html += '<a class="project-poll-list-item" href="' + href + '">';
        html += '  <span class="project-poll-list-title">' + escapeWidgetHtml(question) + '</span>';
        html += '  <span class="project-poll-list-date">' + formatProjectPollListDate(endDt) + '</span>';
        html += '</a>';
    });

    if (activePolls.length > visiblePolls.length) {
        html += '<div class="project-poll-more">외 ' + (activePolls.length - visiblePolls.length) + '개의 투표가 더 있습니다.</div>';
    }

    html += '</div>';
    target.innerHTML = html;
}

function formatProjectPollListDate(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).substring(0, 10);
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return y + '-' + m + '-' + d;
}

function submitProjectActivePollVote(optionId) {
    if (!projectActivePollId || !optionId) {
        alert('투표 정보를 찾을 수 없습니다.');
        return;
    }

    const loginUserId = getProjectMainLoginUserId();
    const body = {
        pollId: projectActivePollId,
        optionId: optionId
    };

    if (loginUserId) {
        body.userId = loginUserId;
    }

    fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(function(res) {
        if (!res.ok) throw new Error('투표 저장 실패: ' + res.status);
        return res.text();
    })
    .then(function() {
        loadProjectActivePoll();
    })
    .catch(function(err) {
        console.error('투표 반영 실패:', err);
        alert('투표 반영 중 오류가 발생했습니다.');
    });
}
/* ===== End project active poll widget ===== */


function limitMainWidgetItems() {
    ['noticeBoard'].forEach(function(id) {
        const box = document.getElementById(id);
        if (!box) return;

        Array.from(box.children).forEach(function(child, index) {
            child.style.display = index >= 4 ? 'none' : '';
        });
    });
}


function renderRecentNoteWidget(list, projId) {
}

function loadRecentNotesFallback(projId) {
}

function formatWidgetDate(value) {
    if (!value) return '';

    const text = String(value);
    if (text.length >= 10) {
        return text.substring(0, 10);
    }

    return text;
}

function loadProjectNoteWidget(projId) {
    const target = document.getElementById('projectNoteBoard');
    if (!target) return;
    target.innerHTML = '<p class="text-muted" style="margin:0; padding-top:8px;">공유 노트가 들어갈 자리입니다.</p>';
}
function escapeWidgetHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');
}

/* ===== 프로젝트 메인 사진첩 위젯 추가 ===== */
(function () {
    'use strict';

    function getProjectId() {
        var params = new URLSearchParams(window.location.search);
        return params.get('projId')
            || (window.PROJECT_MAIN_CONFIG && (window.PROJECT_MAIN_CONFIG.projectId || window.PROJECT_MAIN_CONFIG.paramProjId))
            || '';
    }

    function escapeProjectPhotoHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function firstProjectPhotoValue(object, keys) {
        if (!object) return '';
        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            if (object[key] !== undefined && object[key] !== null && String(object[key]).trim() !== '') {
                return object[key];
            }
        }
        return '';
    }

    function normalizeProjectPhotoPath(path) {
        if (!path) return '';
        var value = String(path);
        if (/^https?:\/\//i.test(value)) return value;
        if (value.charAt(0) === '/') return value;
        return '/' + value;
    }

    function findProjectPhotoInsertTarget() {
        var noteSection = findProjectNoteSection();
        if (noteSection) return { parent: noteSection.parentElement, after: noteSection, noteSection: noteSection, mode: 'note-row' };

        var grids = Array.from(document.querySelectorAll('.widget-grid, .project-widget-grid, .dashboard-widget-grid, .main-content .widget-grid'));
        var bestGrid = grids.find(function (grid) {
            var text = (grid.textContent || '').replace(/\s+/g, ' ');
            return /공지|자료|노트|게시판|피드/.test(text);
        });
        if (bestGrid) return { parent: bestGrid, mode: 'append' };

        var main = document.querySelector('.main-content, .project-main-content, .dashboard-main, .container');
        if (!main) return null;
        return { parent: main, mode: 'append' };
    }

    function findProjectNoteSection() {
        var direct = document.querySelector('.note-main-section');
        if (direct) return direct;

        var list = document.getElementById('recentNoteList');
        if (list) {
            var section = list.closest('section, article, .widget-card, .dashboard-card, .content-section');
            if (section) return section;
        }

        var main = document.querySelector('.main-content, .project-main-content, .dashboard-main, .container');
        if (!main) return null;
        return Array.from(main.querySelectorAll('section, article, .widget-card, .dashboard-card')).find(function (card) {
            return /노트/.test(card.textContent || '');
        }) || null;
    }

    function arrangeNoteAndPhoto(noteSection, photoCard) {
        if (!noteSection || !photoCard || !noteSection.parentElement) return false;

        var currentRow = noteSection.closest('.project-note-photo-row') || photoCard.closest('.project-note-photo-row');
        var row = currentRow || document.createElement('div');
        if (!currentRow) {
            row.className = 'project-note-photo-row';
            noteSection.parentElement.insertBefore(row, noteSection);
        }

        if (!noteSection.classList.contains('project-note-panel')) {
            noteSection.classList.add('project-note-panel');
        }
        if (!photoCard.classList.contains('project-photo-panel')) {
            photoCard.classList.add('project-photo-panel');
        }

        if (noteSection.parentElement !== row) row.appendChild(noteSection);
        if (photoCard.parentElement !== row) row.appendChild(photoCard);
        return true;
    }

    function createProjectPhotoCard(projId) {
        var href = '/photo-album?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId);
        var card = document.createElement('section');
        card.id = 'projectPhotoWidget';
        card.className = 'widget-card project-photo-widget-card';
        card.innerHTML =
            '<div class="project-photo-widget-head">' +
                '<h3 class="project-photo-widget-title">📷 사진첩</h3>' +
                '<a class="project-photo-widget-more" href="' + href + '">더보기</a>' +
            '</div>' +
            '<div id="projectPhotoWidgetList" class="project-photo-grid">' +
                '<div class="project-photo-empty"><span class="project-photo-empty-icon">📷</span><div><strong>사진을 불러오는 중입니다.</strong><span>프로젝트에 공유된 사진을 확인하고 있습니다.</span></div></div>' +
            '</div>';
        return card;
    }

    function mountProjectPhotoCard() {
        var projId = getProjectId();
        if (!projId || document.getElementById('projectPhotoWidget')) return;

        var target = findProjectPhotoInsertTarget();
        if (!target || !target.parent) return;

        var card = createProjectPhotoCard(projId);
        if (target.mode === 'note-row' && target.noteSection) {
            target.noteSection.insertAdjacentElement('afterend', card);
            arrangeNoteAndPhoto(target.noteSection, card);
        } else if (target.mode === 'after' && target.after && target.after.parentElement) {
            target.after.insertAdjacentElement('afterend', card);
        } else {
            target.parent.appendChild(card);
        }
        loadProjectPhotoWidget(projId);

        // 노트 섹션이 늦게 렌더링되는 화면도 있어서, 짧게 한 번 더 재배치한다.
        var retryCount = 0;
        var retryTimer = window.setInterval(function () {
            retryCount += 1;
            var noteSection = findProjectNoteSection();
            var photoCard = document.getElementById('projectPhotoWidget');
            if ((noteSection && photoCard && arrangeNoteAndPhoto(noteSection, photoCard)) || retryCount >= 8) {
                window.clearInterval(retryTimer);
            }
        }, 120);
    }

    function renderProjectPhotoEmpty(list, projId) {
        var albumUrl = '/photo-album?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId);
        list.innerHTML =
            '<div class="project-photo-empty">' +
                '<span class="project-photo-empty-icon">📷</span>' +
                '<div>' +
                    '<strong>아직 공유된 사진이 없습니다.</strong>' +
                    '<span>프로젝트 자료와 현장 사진을 모아서 공유할 수 있습니다.</span>' +
                    '<a class="project-photo-empty-action" href="' + albumUrl + '">첫 사진 공유</a>' +
                '</div>' +
            '</div>';
    }

    function renderProjectPhotos(list, posts, projId) {
        var albumUrl = '/photo-album?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId);
        if (!Array.isArray(posts) || posts.length === 0) {
            renderProjectPhotoEmpty(list, projId);
            return;
        }

        list.innerHTML = posts.slice(0, 2).map(function (post) {
            var postId = firstProjectPhotoValue(post, ['postId', 'POST_ID', 'id']);
            var title = firstProjectPhotoValue(post, ['title', 'TITLE', 'postTitle', 'POST_TITLE']) || '사진 게시물';
            var creator = firstProjectPhotoValue(post, ['userName', 'USER_NAME', 'creatorName', 'CREATOR_NAME', 'email', 'EMAIL']) || '공유됨';
            var imageUrl = normalizeProjectPhotoPath(firstProjectPhotoValue(post, [
                'thumbnailPath', 'THUMBNAIL_PATH', 'filePath', 'FILE_PATH', 'coverPath', 'COVER_PATH', 'photoPath', 'PHOTO_PATH'
            ]));
            var photoCount = Number(firstProjectPhotoValue(post, ['photoCount', 'PHOTO_COUNT']) || 0);
            var href = postId ? (albumUrl + '&postId=' + encodeURIComponent(postId)) : albumUrl;

            return '<a class="project-photo-post" href="' + href + '" aria-label="' + escapeProjectPhotoHtml(title) + '">' +
                '<span class="project-photo-post-thumb" style="background-image:url(&quot;' + escapeProjectPhotoHtml(imageUrl) + '&quot;)">' +
                    (photoCount > 1 ? '<span class="project-photo-post-count">▣ ' + photoCount + '</span>' : '') +
                    '<span class="project-photo-post-overlay"><strong>' + escapeProjectPhotoHtml(title) + '</strong><small>' + escapeProjectPhotoHtml(creator) + '</small></span>' +
                '</span>' +
            '</a>';
        }).join('');
    }

    function loadProjectPhotoWidget(projId) {
        var list = document.getElementById('projectPhotoWidgetList');
        if (!list) return;

        fetch('/api/photo-posts/recent?scopeType=PROJECT&scopeId=' + encodeURIComponent(projId) + '&limit=2')
            .then(function (response) {
                if (!response.ok) throw new Error('프로젝트 사진 조회 실패: ' + response.status);
                return response.json();
            })
            .then(function (posts) { renderProjectPhotos(list, posts, projId); })
            .catch(function (error) {
                console.error(error);
                renderProjectPhotoEmpty(list, projId);
            });
    }

    document.addEventListener('DOMContentLoaded', mountProjectPhotoCard);
})();
/* ===== End 프로젝트 메인 사진첩 위젯 추가 ===== */
