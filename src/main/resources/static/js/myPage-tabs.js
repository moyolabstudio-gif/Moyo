(() => {
    const selectProfileTab = tabName => {
        if (!tabName) return;
        document.querySelectorAll('[data-profile-tab]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.profileTab === tabName);
        });
        document.querySelectorAll('[data-profile-panel]').forEach(panel => {
            panel.classList.toggle('is-active', panel.dataset.profilePanel === tabName);
        });
    };


    function openRequestedProfileContent() {
        const params = new URLSearchParams(window.location.search || '');
        const photoId = Number(params.get('openPhotoId') || 0);
        const noteId = Number(params.get('openNoteId') || 0);

        if (photoId > 0) {
            selectProfileTab('photos');
            if (window.MoyoPhotoPostDetail && typeof window.MoyoPhotoPostDetail.open === 'function') {
                window.MoyoPhotoPostDetail.open(photoId);
            }
            return;
        }

        if (noteId > 0) {
            selectProfileTab('notes');
            if (window.MoyoCommonNoteDetail && typeof window.MoyoCommonNoteDetail.open === 'function') {
                window.MoyoCommonNoteDetail.open('profileNoteDetail-' + noteId);
            }
        }
    }

    // 통계 영역은 실시간 갱신될 수 있으므로 직접 바인딩 대신 위임한다.
    document.addEventListener('click', event => {
        const button = event.target.closest?.('[data-profile-tab]');
        if (!button) return;
        selectProfileTab(button.dataset.profileTab);
    });

    function renderProfileNoteCards(scope = document) {
        if (!window.MoyoContentCard || typeof window.MoyoContentCard.notePaper !== 'function') return;

        scope.querySelectorAll('[data-profile-note-card-render]').forEach(function (host) {
            if (host.dataset.noteCardRendered === 'true') return;

            var noteId = host.dataset.noteId || '';
            var title = host.querySelector('[data-note-card-title]')?.textContent?.trim() || '제목 없는 노트';
            var preview = host.querySelector('[data-note-card-preview]')?.textContent?.trim() || '';
            var author = host.querySelector('[data-note-card-author]')?.textContent?.trim() || '';
            var date = host.querySelector('[data-note-card-date]')?.textContent?.trim() || '';
            var liked = /^(true|1|y)$/i.test(host.dataset.noteLiked || '');
            var owned = /^(true|1|y)$/i.test(host.dataset.noteOwned || '');
            var ownerId = document.querySelector('.profile-shell')?.dataset.profileOwnerId || '';
            var modalId = 'profileNoteDetail-' + noteId;

            var html = window.MoyoContentCard.notePaper({
                id: noteId,
                title: title,
                preview: preview,
                author: author,
                date: date,
                imageCount: Number(host.dataset.noteImageCount || 0),
                tableCount: Number(host.dataset.noteTableCount || 0),
                linkCount: Number(host.dataset.noteLinkCount || 0),
                videoCount: Number(host.dataset.noteVideoCount || 0),
                viewCount: Number(host.dataset.noteViewCountValue || 0),
                likeCount: Number(host.dataset.noteLikeCountValue || 0),
                commentCount: Number(host.dataset.noteCommentCountValue || 0),
                likedByMe: liked,
                moyoPublic: true
            }, {
                outerClass: 'profile-note-paper-card',
                outerTag: 'article',
                buttonClass: 'profile-note-paper-button',
                paperClass: 'profile-note-paper',
                innerClass: 'profile-note-paper-inner',
                titleClass: 'profile-note-paper-title',
                metaClass: 'profile-note-content-meta',
                metaItemClass: 'profile-note-content-meta-item',
                lineClass: 'profile-note-paper-line is-strong',
                bodyClass: 'profile-note-paper-body',
                linesClass: 'profile-note-paper-lines',
                hoverClass: 'profile-note-hover',
                hoverMainClass: 'profile-note-hover-main',
                hoverMetaClass: 'profile-note-hover-meta',
                hoverDotClass: 'profile-note-hover-dot',
                hoverDateClass: 'profile-note-hover-date',
                actionWrapClass: 'profile-note-feed-actions',
                actionClass: 'profile-note-feed-action',
                likeClass: 'is-like',
                viewAttr: 'data-profile-note-card-view-count="' + noteId + '"',
                likeToggleAttr: 'data-profile-note-card-like-toggle',
                likeCountAttr: 'data-profile-note-card-like-count="' + noteId + '"',
                commentCountAttr: 'data-profile-note-card-comment-count="' + noteId + '"',
                commentButton: true,
                commentOpenAttr: 'data-profile-note-card-comment-open',
                commentOpenValue: modalId,
                likeModalId: modalId,
                modalId: modalId,
                tabindex: 0,
                role: 'button',
                ariaLabel: title + ' 노트 보기',
                showMoyoMark: true,
                moyoMarkClass: 'profile-note-moyo-mark',
                moyoMarkSrc: (document.querySelector('.profile-shell')?.dataset.contextPath || '') + '/brand/moyo_mark.png',
                showSharedState: true,
                showShare: true,
                shareAction: 'friend-send',
                shareTitle: '친구에게 보내기',
                showCollect: !owned
            });

            var replacement = document.createElement('div');
            replacement.innerHTML = html;
            var card = replacement.firstElementChild;
            if (!card) return;
            card.dataset.noteOwned = owned ? 'true' : 'false';
            card.dataset.noteOwnerId = String(ownerId || '');
            host.replaceWith(card);
        });
    }

    const refreshTimers = new Map();
    let refreshSequence = 0;

    function updateStatCounts(sourceDocument) {
        ['photos', 'notes', 'calendar', 'groups'].forEach(tab => {
            const source = sourceDocument.querySelector(`.profile-stats [data-profile-tab="${tab}"] strong`);
            const target = document.querySelector(`.profile-stats [data-profile-tab="${tab}"] strong`);
            if (source && target) target.textContent = source.textContent;
        });
    }

    async function refreshProfileSnapshot(kind) {
        const normalized = String(kind || '').trim().toLowerCase();
        if (!['photos', 'notes', 'calendar', 'groups'].includes(normalized)) return;

        const target = document.querySelector(`[data-profile-live-region="${normalized}"]`);
        if (!target) return;

        const seq = ++refreshSequence;
        const response = await fetch(window.location.href, {
            method: 'GET',
            headers: { 'Accept': 'text/html', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('프로필 최신 정보를 불러오지 못했습니다.');

        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const source = parsed.querySelector(`[data-profile-live-region="${normalized}"]`);
        if (!source || seq !== refreshSequence) return;

        target.innerHTML = source.innerHTML;
        updateStatCounts(parsed);

        if (normalized === 'notes') renderProfileNoteCards(target);

        document.dispatchEvent(new CustomEvent('moyo:profile-content-refreshed', {
            detail: { kind: normalized }
        }));
    }

    function scheduleProfileRefresh(kind, delay = 350) {
        const normalized = String(kind || '').trim().toLowerCase();
        if (!normalized) return;
        const previous = refreshTimers.get(normalized);
        if (previous) window.clearTimeout(previous);
        const timer = window.setTimeout(() => {
            refreshTimers.delete(normalized);
            refreshProfileSnapshot(normalized).catch(error => {
                console.warn('[MOYO Profile] 콘텐츠 즉시 반영 실패:', error);
            });
        }, Math.max(0, Number(delay) || 0));
        refreshTimers.set(normalized, timer);
    }

    document.addEventListener('moyo:note-saved', () => scheduleProfileRefresh('notes', 900));
    document.addEventListener('moyo:note-deleted', () => scheduleProfileRefresh('notes', 120));
    document.addEventListener('moyo:note-updated', () => scheduleProfileRefresh('notes', 350));

    document.addEventListener('moyo:photo-post-deleted', () => scheduleProfileRefresh('photos', 120));
    document.addEventListener('moyo:photo-post-updated', event => {
        const detail = event.detail || {};
        // 좋아요/댓글 수는 기존 상세 JS가 카드에 바로 반영하므로 불필요한 전체 재조회는 피한다.
        const reactionOnly =
            (detail.liked !== undefined || detail.likeCount !== undefined || detail.commentCount !== undefined) &&
            detail.visibilityType === undefined &&
            detail.refresh !== true &&
            detail.restored !== true &&
            Object.keys(detail).every(key => ['postId', 'liked', 'likeCount', 'commentCount'].includes(key));
        if (!reactionOnly) scheduleProfileRefresh('photos', 350);
    });

    document.addEventListener('moyo:content-access-changed', event => {
        const type = String(event.detail?.contentType || '').toUpperCase();
        if (type === 'NOTE') scheduleProfileRefresh('notes', 180);
        if (type === 'PHOTO') scheduleProfileRefresh('photos', 180);
    });

    document.addEventListener('moyo:calendar-event-deleted', () => scheduleProfileRefresh('calendar', 120));
    document.addEventListener('moyo:calendar-event-updated', () => scheduleProfileRefresh('calendar', 300));

    document.addEventListener('DOMContentLoaded', () => {
        renderProfileNoteCards(document);
        // 최근 활동/친구에게 보내기 링크는 프로필 진입 후 현재 공통 상세 UI를 바로 연다.
        window.setTimeout(openRequestedProfileContent, 0);
    });

    window.MoyoProfileLiveRefresh = {
        refresh: refreshProfileSnapshot,
        schedule: scheduleProfileRefresh,
        renderNotes: renderProfileNoteCards
    };
})();
