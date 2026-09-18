(function () {
    'use strict';

    function root() { return document.querySelector('[data-common-content-scope-type]'); }
    function text(value) { return value === null || value === undefined ? '' : String(value); }
    function escapeHtml(value) {
        return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function contextPath() {
        var bodyValue = document.body && document.body.dataset ? document.body.dataset.contextPath : '';
        return bodyValue && bodyValue !== '/' ? bodyValue.replace(/\/$/, '') : '';
    }
    function config() {
        var el = root();
        if (!el) return null;
        return {
            el: el,
            scopeType: text(el.dataset.commonContentScopeType || '').toUpperCase(),
            scopeId: text(el.dataset.commonContentScopeId || ''),
            wsId: text(el.dataset.commonContentWsId || ''),
            canWrite: /^(true|y|1)$/i.test(text(el.dataset.commonContentCanWrite || ''))
        };
    }
    function stripHtml(value) {
        var holder = document.createElement('div');
        holder.innerHTML = text(value);
        return text(holder.textContent || holder.innerText).replace(/\s+/g, ' ').trim();
    }
    function first(obj, keys) {
        for (var i = 0; i < keys.length; i++) {
            var value = obj && obj[keys[i]];
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return '';
    }
    function normalizeList(payload, keys) {
        if (Array.isArray(payload)) return payload;
        if (!payload || typeof payload !== 'object') return [];
        for (var i = 0; i < keys.length; i++) if (Array.isArray(payload[keys[i]])) return payload[keys[i]];
        return [];
    }
    function formatDate(value) {
        if (!value) return '';
        var date = value instanceof Date ? value : new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, '0') + '.' + String(date.getDate()).padStart(2, '0');
        }
        var match = text(value).match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        return match ? match[1] + '.' + String(match[2]).padStart(2, '0') + '.' + String(match[3]).padStart(2, '0') : '';
    }
    function noteQuery(cfg) {
        var query = new URLSearchParams();
        if (cfg.scopeType === 'WORKSPACE') {
            query.set('scope', 'WS');
            query.set('wsId', cfg.scopeId);
        } else {
            query.set('scope', 'PROJ');
            query.set('projId', cfg.scopeId);
            if (cfg.wsId) query.set('wsId', cfg.wsId);
        }
        return query;
    }
    function noteWriteUrl(cfg) { return contextPath() + '/note/write?' + noteQuery(cfg).toString(); }
    function noteDetailUrl(cfg, noteId) {
        var query = noteQuery(cfg);
        query.set('noteId', noteId);
        return contextPath() + '/note/detail?' + query.toString();
    }
    function setBusy(target, busy) {
        if (target) target.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
    var contentLoadState = { note: 'loading', photo: 'loading' };
    var contentRowClasses = ['is-all-empty', 'has-note-only', 'has-photo-only', 'has-both', 'has-load-error'];

    function updateContentRowState() {
        var row = root();
        if (!row) return;

        contentRowClasses.forEach(function (name) { row.classList.remove(name); });

        var noteDone = contentLoadState.note !== 'loading';
        var photoDone = contentLoadState.photo !== 'loading';
        if (!noteDone || !photoDone) {
            row.classList.add('is-content-loading');
            return;
        }

        row.classList.remove('is-content-loading');
        var noteReady = contentLoadState.note === 'ready';
        var photoReady = contentLoadState.photo === 'ready';
        var noteEmpty = contentLoadState.note === 'empty';
        var photoEmpty = contentLoadState.photo === 'empty';

        if (noteReady && photoReady) row.classList.add('has-both');
        else if (noteReady && photoEmpty) row.classList.add('has-note-only');
        else if (noteEmpty && photoReady) row.classList.add('has-photo-only');
        else if (noteEmpty && photoEmpty) row.classList.add('is-all-empty');
        else row.classList.add('has-load-error');
    }

    function setWidgetState(target, state) {
        if (!target) return;
        ['is-loading', 'is-empty', 'is-error', 'is-ready'].forEach(function (name) {
            target.classList.remove(name);
        });
        target.classList.add('is-' + state);

        if (target.matches('[data-common-note-list]')) contentLoadState.note = state;
        if (target.matches('[data-common-photo-list]')) contentLoadState.photo = state;
        updateContentRowState();
    }
    function renderNoteState(target, cfg, type) {
        setBusy(target, type === 'loading');
        setWidgetState(target, type);
        var copy = type === 'loading'
            ? ['노트를 불러오는 중입니다.', '잠시만 기다려주세요.']
            : type === 'error'
                ? ['공유 노트를 불러오지 못했습니다.', '잠시 후 다시 시도해주세요.']
                : ['아직 작성된 노트가 없습니다.', '공유된 노트가 생기면 여기에 표시됩니다.'];
        var action = '';
        if (type === 'error') action = '<button type="button" class="moyo-content-empty__action" data-common-note-retry>다시 시도</button>';
        else if (type === 'empty' && cfg.canWrite) action = '<button type="button" class="moyo-content-empty__action" data-common-note-create>첫 노트 작성</button>';
        target.innerHTML = '<div class="moyo-content-empty moyo-content-empty--' + type + ' project-note-state project-note-' + type + '" ' + (type === 'error' ? 'role="alert"' : 'role="status"') + '>' +
            '<span class="moyo-content-empty__icon" aria-hidden="true">📝</span><div class="moyo-content-empty__copy"><strong class="moyo-content-empty__title">' + copy[0] + '</strong><span class="moyo-content-empty__description">' + copy[1] + '</span>' + action.replace('moyo-content-empty__action', 'workspace-content-empty__action') + '</div></div>';
    }
    function noteCount(note, keys) {
        var value = Number(first(note, keys) || 0);
        return Number.isFinite(value) ? value : 0;
    }
    function noteLiked(note) {
        return /^(1|true|y)$/i.test(text(first(note, ['likedByMe', 'LIKED_BY_ME', 'liked', 'LIKED'])));
    }
    function getCommonNoteModal(noteId) {
        return document.getElementById('profileNoteDetail-' + noteId);
    }
    function resolveNoteWriter(noteId, note) {
        var writer = text(first(note, ['authorName', 'AUTHOR_NAME', 'userName', 'USER_NAME'])).trim();
        if (writer) return writer;
        var modal = getCommonNoteModal(noteId);
        var writerNode = modal && modal.querySelector('.profile-note-detail-author-name-link strong');
        return writerNode ? text(writerNode.textContent).trim() : '';
    }
    function openUnifiedNote(noteId) {
        var cfg = config();
        if (!noteId || !cfg) return false;
        if (!window.MoyoNoteModal || typeof window.MoyoNoteModal.open !== 'function') {
            window.location.href = noteDetailUrl(cfg, noteId);
            return true;
        }
        window.MoyoNoteModal.open({
            noteId: Number(noteId),
            scopeType: cfg.scopeType === 'WORKSPACE' ? 'GROUP' : 'PROJECT',
            scopeId: cfg.scopeId || null,
            wsId: cfg.scopeType === 'WORKSPACE' ? (cfg.scopeId || null) : (cfg.wsId || null),
            projId: cfg.scopeType === 'PROJECT' ? (cfg.scopeId || null) : null
        });
        return true;
    }
    function openUnifiedNoteCreate() {
        var cfg = config();
        if (!cfg) return false;
        if (!window.MoyoNoteModal || typeof window.MoyoNoteModal.open !== 'function') {
            window.location.href = noteWriteUrl(cfg);
            return true;
        }
        window.MoyoNoteModal.open({
            scopeType: cfg.scopeType === 'WORKSPACE' ? 'GROUP' : 'PROJECT',
            scopeId: cfg.scopeId || null,
            wsId: cfg.scopeType === 'WORKSPACE' ? (cfg.scopeId || null) : (cfg.wsId || null),
            projId: cfg.scopeType === 'PROJECT' ? (cfg.scopeId || null) : null,
            libraryName: cfg.scopeType === 'WORKSPACE' ? '그룹 노트' : '프로젝트 노트'
        });
        return true;
    }
    function renderNotes(target, cfg, payload) {
        var list = normalizeList(payload, ['notes', 'noteList', 'recentNotes', 'data', 'list', 'items', 'content'])
            .filter(function (item) { return item && first(item, ['noteId', 'NOTE_ID']); }).slice(0, 3);
        if (!list.length) { renderNoteState(target, cfg, 'empty'); return; }
        if (!window.MoyoContentCard || typeof window.MoyoContentCard.notePaper !== 'function') {
            renderNoteState(target, cfg, 'error');
            return;
        }

        setBusy(target, false); setWidgetState(target, 'ready');
        target.innerHTML = '<div class="moyo-content-note-grid">' + list.map(function (note) {
            var noteId = first(note, ['noteId', 'NOTE_ID']);
            var title = first(note, ['noteTitle', 'NOTE_TITLE', 'title', 'TITLE']) || '제목 없는 노트';
            var writer = resolveNoteWriter(noteId, note);
            var preview = stripHtml(first(note, ['previewContent', 'PREVIEW_CONTENT', 'previewText', 'PREVIEW_TEXT', 'memo', 'MEMO', 'content', 'CONTENT', 'noteContent', 'NOTE_CONTENT'])) || '작성된 내용이 없습니다.';
            var date = formatDate(first(note, ['moyoPublicAt','MOYO_PUBLIC_AT','updDt','UPD_DT','regDt', 'REG_DT', 'createdAt', 'CREATED_AT'])) || '날짜 정보 없음';
            var modalId = 'profileNoteDetail-' + noteId;

            return window.MoyoContentCard.notePaper({
                id: noteId,
                title: title,
                preview: preview,
                author: writer,
                date: date,
                imageCount: noteCount(note, ['imageCount','IMAGE_COUNT']),
                tableCount: noteCount(note, ['tableCount','TABLE_COUNT']),
                linkCount: noteCount(note, ['linkCount','LINK_COUNT']),
                videoCount: noteCount(note, ['videoCount','VIDEO_COUNT']),
                viewCount: noteCount(note, ['viewCount','VIEW_COUNT']),
                likeCount: noteCount(note, ['likeCount','LIKE_COUNT']),
                commentCount: noteCount(note, ['feedbackCount','FEEDBACK_COUNT','commentCount','COMMENT_COUNT']),
                likedByMe: noteLiked(note)
            }, {
                outerClass: 'workspace-note-paper-card project-note-paper-card common-note-paper-card--compact',
                outerTag: 'article',
                buttonClass: 'workspace-note-paper-button project-note-paper-button',
                paperClass: 'workspace-note-paper project-note-paper',
                innerClass: 'workspace-note-paper-inner project-note-paper-inner moyo-content-note-inner',
                titleClass: 'workspace-note-paper-title project-note-paper-title moyo-content-note-title',
                metaClass: 'profile-note-content-meta workspace-note-content-meta project-note-content-meta moyo-content-note-meta',
                metaItemClass: 'profile-note-content-meta-item workspace-note-content-meta-item project-note-content-meta-item',
                lineClass: 'workspace-note-paper-line project-note-paper-line moyo-content-note-rule is-strong',
                bodyClass: 'workspace-note-paper-body project-note-paper-body moyo-content-note-body',
                linesClass: 'workspace-note-paper-lines project-note-paper-lines moyo-content-note-lines',
                hoverClass: 'workspace-note-paper-hover project-note-paper-hover profile-note-hover',
                hoverMainClass: 'workspace-note-hover-main profile-note-hover-main',
                hoverMetaClass: 'workspace-note-hover-meta profile-note-hover-meta',
                hoverDotClass: 'workspace-note-hover-dot profile-note-hover-dot',
                hoverDateClass: 'workspace-note-hover-date profile-note-hover-date',
                actionWrapClass: 'workspace-note-hover-actions profile-note-feed-actions',
                actionClass: 'workspace-note-hover-action profile-note-feed-action',
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
                ariaLabel: title + ' 노트 보기'
            });
        }).join('') + '</div>';
    }

    function loadNotes() {
        var cfg = config(), target = document.querySelector('[data-common-note-list]');
        if (!cfg || !target || !cfg.scopeId) return;
        renderNoteState(target, cfg, 'loading');
        var query = noteQuery(cfg); query.set('limit', '100');
        fetch(contextPath() + '/note/api/main?' + query.toString(), { cache: 'no-store', headers: { Accept: 'application/json' } })
            .then(function (response) { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
            .then(function (payload) {
                renderNotes(target, cfg, payload);
                var notes = normalizeList(payload, ['notes', 'noteList', 'recentNotes', 'data', 'list', 'items', 'content']);
                document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: {
                    scope: cfg.scopeType === 'PROJECT' ? 'PROJECT' : 'WORKSPACE',
                    scopeId: cfg.scopeId,
                    wsId: cfg.scopeType === 'WORKSPACE' ? cfg.scopeId : cfg.wsId,
                    projId: cfg.scopeType === 'PROJECT' ? cfg.scopeId : '',
                    contextPath: contextPath(),
                    notes: notes
                }}));
            })
            .catch(function () {
                renderNoteState(target, cfg, 'error');
                document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: {
                    scope: cfg.scopeType === 'PROJECT' ? 'PROJECT' : 'WORKSPACE',
                    scopeId: cfg.scopeId,
                    wsId: cfg.scopeType === 'WORKSPACE' ? cfg.scopeId : cfg.wsId,
                    projId: cfg.scopeType === 'PROJECT' ? cfg.scopeId : '',
                    contextPath: contextPath(),
                    notes: []
                }}));
            });
    }
    function normalizePhotoPath(value) {
        var path = text(value).trim();
        if (!path) return '';
        if (/^(https?:|data:|blob:)/i.test(path)) return path;
        return contextPath() + (path.charAt(0) === '/' ? path : '/' + path);
    }
    function photoAlbumUrl(cfg, postId) {
        var query = new URLSearchParams({ scopeType: cfg.scopeType, scopeId: cfg.scopeId });
        if (postId) query.set('postId', postId);
        return contextPath() + '/photo-album?' + query.toString();
    }
    function photoWriteUrl(cfg) {
        return contextPath() + '/photo-post/write?' + new URLSearchParams({ scopeType: cfg.scopeType, scopeId: cfg.scopeId }).toString();
    }
    function renderPhotoState(target, cfg, type) {
        setBusy(target, type === 'loading');
        setWidgetState(target, type);
        var copy = type === 'loading' ? ['사진을 불러오는 중입니다.', '잠시만 기다려주세요.'] : type === 'error'
            ? ['사진을 불러오지 못했습니다.', '잠시 후 다시 시도해주세요.'] : ['아직 공유된 사진이 없습니다.', '사진을 바로 공유해보세요.'];
        var action = type === 'error' ? '<button type="button" class="moyo-content-empty__action" data-common-photo-retry>다시 시도</button>'
            : (type === 'empty' && cfg.canWrite ? '<a class="moyo-content-empty__action" href="' + photoWriteUrl(cfg) + '">첫 사진 공유</a>' : '');
        target.innerHTML = '<div class="moyo-content-empty moyo-content-empty--' + type + ' project-photo-empty project-photo-state project-photo-' + type + '" ' + (type === 'error' ? 'role="alert"' : 'role="status"') + '>' +
            '<span class="moyo-content-empty__icon" aria-hidden="true">📷</span><div class="moyo-content-empty__copy"><strong class="moyo-content-empty__title">' + copy[0] + '</strong><span class="moyo-content-empty__description">' + copy[1] + '</span>' + action.replace('moyo-content-empty__action', 'workspace-content-empty__action') + '</div></div>';
    }
    function photoLiked(post) {
        return /^(1|true|y)$/i.test(text(first(post, ['likedByMe', 'LIKED_BY_ME', 'liked', 'LIKED'])));
    }
    function photoCount(post, keys) {
        var value = Number(first(post, keys) || 0);
        return Number.isFinite(value) ? value : 0;
    }
    function openPhotoDetail(postId) {
        if (window.MoyoPhotoPostDetail && typeof window.MoyoPhotoPostDetail.open === 'function') {
            window.MoyoPhotoPostDetail.open(postId);
            return true;
        }
        var cfg = config();
        if (!postId || !cfg) return false;
        window.location.href = photoAlbumUrl(cfg, postId);
        return true;
    }
    function renderPhotos(target, cfg, payload) {
        var posts = normalizeList(payload, ['posts', 'photoPosts', 'recentPosts', 'data', 'list', 'items', 'content'])
            .filter(function (post) { return post && first(post, ['postId', 'POST_ID', 'id']); }).slice(0, 2);
        if (!posts.length) { renderPhotoState(target, cfg, 'empty'); return; }
        setBusy(target, false);
        setWidgetState(target, 'ready');
        target.innerHTML = posts.map(function (post) {
            var postId = first(post, ['postId', 'POST_ID', 'id']);
            var title = first(post, ['title', 'TITLE', 'postTitle', 'POST_TITLE', 'description', 'DESCRIPTION']) || '사진 게시물';
            var coverPhotoId = first(post, ['coverPhotoId', 'COVER_PHOTO_ID']);
            var image = coverPhotoId
                ? contextPath() + '/photo/media/' + encodeURIComponent(String(coverPhotoId))
                : normalizePhotoPath(first(post, ['thumbnailPath', 'THUMBNAIL_PATH', 'coverPath', 'COVER_PATH', 'filePath', 'FILE_PATH', 'photoPath', 'PHOTO_PATH']));
            var count = photoCount(post, ['photoCount', 'PHOTO_COUNT']);
            var author = first(post, ['creatorName', 'CREATOR_NAME', 'userName', 'USER_NAME', 'authorName', 'AUTHOR_NAME']) || '작성자';
            var date = formatDate(first(post, ['createdAt', 'CREATED_AT', 'regDt', 'REG_DT', 'writeDate', 'WRITE_DATE'])) || '작성일 없음';
            var liked = photoLiked(post);
            var likeCount = photoCount(post, ['likeCount', 'LIKE_COUNT']);
            var commentCount = photoCount(post, ['commentCount', 'COMMENT_COUNT']);
            return '<article class="moyo-content-photo-card" data-common-photo-post="' + escapeHtml(postId) + '" tabindex="0" role="button" aria-label="' + escapeHtml(title) + ' 사진 상세 보기">' +
                '<span class="moyo-content-photo-thumb"' + (image ? ' style="background-image:url(&quot;' + escapeHtml(image) + '&quot;)"' : '') + '>' +
                (count > 1 ? '<span class="moyo-content-photo-count"><i class="fa-regular fa-images" aria-hidden="true"></i> ' + count + '</span>' : '') +
                '<span class="moyo-content-photo-overlay">' +
                    '<span class="moyo-content-photo-meta"><strong>' + escapeHtml(author) + '</strong><small>' + escapeHtml(date) + '</small></span>' +
                    '<span class="moyo-content-photo-actions" aria-label="사진 반응">' +
                        '<button type="button" class="moyo-content-photo-like-button' + (liked ? ' is-liked' : '') + '" data-common-photo-like="' + escapeHtml(postId) + '" aria-pressed="' + (liked ? 'true' : 'false') + '" aria-label="좋아요">' +
                            '<i class="' + (liked ? 'fa-solid' : 'fa-regular') + ' fa-heart" aria-hidden="true"></i><span>' + likeCount + '</span>' +
                        '</button>' +
                        '<button type="button" class="moyo-content-photo-comment-button" data-common-photo-comment="' + escapeHtml(postId) + '" aria-label="댓글 보기">' +
                            '<i class="fa-regular fa-comment" aria-hidden="true"></i><span>' + commentCount + '</span>' +
                        '</button>' +
                    '</span>' +
                '</span></span></article>';
        }).join('');
    }
    function loadPhotos() {
        var cfg = config(), target = document.querySelector('[data-common-photo-list]');
        if (!cfg || !target || !cfg.scopeId) return;
        renderPhotoState(target, cfg, 'loading');
        var query = new URLSearchParams({ scopeType: cfg.scopeType, scopeId: cfg.scopeId, limit: '100' });
        fetch(contextPath() + '/api/photo-posts/recent?' + query.toString(), { headers: { Accept: 'application/json' } })
            .then(function (response) { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
            .then(function (payload) {
                renderPhotos(target, cfg, payload);
                document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: {
                    scope: cfg.scopeType, scopeId: cfg.scopeId, wsId: cfg.wsId, contextPath: contextPath(),
                    photos: normalizeList(payload, ['posts', 'photoPosts', 'recentPosts', 'data', 'list', 'items', 'content'])
                }}));
            })
            .catch(function () {
                renderPhotoState(target, cfg, 'error');
                document.dispatchEvent(new CustomEvent('moyo:content-activity', { detail: {
                    scope: cfg.scopeType,
                    scopeId: cfg.scopeId,
                    wsId: cfg.wsId,
                    projId: cfg.scopeType === 'PROJECT' ? cfg.scopeId : '',
                    contextPath: contextPath(),
                    photos: []
                }}));
            });
    }
    // 공유 노트 위젯은 구형 commonNoteDetail보다 먼저 새 통합 노트 모달로 라우팅한다.
    // capture 단계에서 막아야 먼저 등록된 legacy document click handler가 옛 상세 모달을 열지 않는다.
    document.addEventListener('click', function (event) {
        var list = event.target.closest && event.target.closest('[data-common-note-list]');
        if (!list) return;

        // 좋아요는 기존 반응 처리기를 그대로 사용한다.
        if (event.target.closest('[data-profile-note-card-like-toggle]')) return;

        var comment = event.target.closest('[data-profile-note-card-comment-open]');
        var card = event.target.closest('[data-profile-note-open]');
        var trigger = comment || card;
        if (!trigger) return;

        var raw = comment
            ? (comment.getAttribute('data-profile-note-card-comment-open') || '')
            : (card.getAttribute('data-profile-note-open') || '');
        var noteId = raw.replace('profileNoteDetail-', '');
        if (!noteId) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openUnifiedNote(noteId);
    }, true);

    document.addEventListener('click', function (event) {
        if (event.target.closest('[data-common-note-retry]')) { event.preventDefault(); loadNotes(); return; }
        if (event.target.closest('[data-common-note-create]')) { event.preventDefault(); openUnifiedNoteCreate(); return; }
        if (event.target.closest('[data-common-photo-retry]')) { event.preventDefault(); loadPhotos(); return; }

        var noteReactionControl = event.target.closest('[data-profile-note-card-like-toggle], [data-profile-note-card-comment-open]');
        if (noteReactionControl && noteReactionControl.closest('[data-common-note-list]')) {
            // 좋아요/댓글은 기존 commonNoteDetail.js의 공통 이벤트가 처리한다.
            return;
        }

        var noteCard = event.target.closest('[data-profile-note-open]');
        if (noteCard && noteCard.closest('[data-common-note-list]')) {
            event.preventDefault();
            openUnifiedNote((noteCard.dataset.profileNoteOpen || '').replace('profileNoteDetail-', ''));
            return;
        }

        var likeButton = event.target.closest('[data-common-photo-like]');
        if (likeButton) {
            event.preventDefault();
            event.stopPropagation();
            var likePostId = likeButton.dataset.commonPhotoLike;
            if (window.MoyoPhotoPostDetail && typeof window.MoyoPhotoPostDetail.toggleLike === 'function') {
                window.MoyoPhotoPostDetail.toggleLike(likePostId);
            }
            return;
        }

        var commentButton = event.target.closest('[data-common-photo-comment]');
        if (commentButton) {
            event.preventDefault();
            event.stopPropagation();
            openPhotoDetail(commentButton.dataset.commonPhotoComment);
            return;
        }

        var postCard = event.target.closest('[data-common-photo-post]');
        if (postCard) {
            event.preventDefault();
            openPhotoDetail(postCard.dataset.commonPhotoPost);
        }
    });
    document.addEventListener('keydown', function (event) {
        var noteCard = event.target.closest && event.target.closest('[data-profile-note-open]');
        if (noteCard && noteCard.closest('[data-common-note-list]') && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopImmediatePropagation(); openUnifiedNote((noteCard.dataset.profileNoteOpen || '').replace('profileNoteDetail-', '')); return; }
        var postCard = event.target.closest && event.target.closest('[data-common-photo-post]');
        if (!postCard || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        openPhotoDetail(postCard.dataset.commonPhotoPost);
    });
    document.addEventListener('moyo:photo-post-updated', function (event) {
        var detail = event.detail || {};
        var button = document.querySelector('[data-common-photo-like="' + detail.postId + '"]');
        if (button && detail.liked !== undefined) {
            var liked = !!detail.liked;
            button.classList.toggle('is-liked', liked);
            button.setAttribute('aria-pressed', liked ? 'true' : 'false');
            var icon = button.querySelector('i');
            if (icon) icon.className = (liked ? 'fa-solid' : 'fa-regular') + ' fa-heart';
        }
        if (button && detail.likeCount !== undefined) {
            var count = button.querySelector('span');
            if (count) count.textContent = String(Number(detail.likeCount || 0));
        }
        var commentButton = document.querySelector('[data-common-photo-comment="' + detail.postId + '"]');
        if (commentButton && detail.commentCount !== undefined) {
            var commentCount = commentButton.querySelector('span');
            if (commentCount) commentCount.textContent = String(Number(detail.commentCount || 0));
        }
        if (detail.albumId !== undefined || detail.visibilityType !== undefined || detail.deleted || detail.refresh) {
            loadPhotos();
        }
    });
    document.addEventListener('moyo:photo-post-deleted', loadPhotos);
    document.addEventListener('moyo:note-saved', loadNotes);
    document.addEventListener('moyo:note-updated', loadNotes);
    document.addEventListener('moyo:note-deleted', loadNotes);
    document.addEventListener('moyo:content-record-availability-changed', function () {
        // 기록 ON/OFF 변경 직후 서버의 최신 노출 조건으로 두 위젯을 함께 다시 그린다.
        loadNotes();
        loadPhotos();
    });
    document.addEventListener('DOMContentLoaded', function () { loadNotes(); loadPhotos(); });
    // 탐색기/상세 페이지에서 수정한 뒤 브라우저 뒤로가기로 메인에 복귀하면
    // bfcache 때문에 DOMContentLoaded가 다시 발생하지 않는다. pageshow에서 최신 데이터를 다시 조회한다.
    window.addEventListener('pageshow', function (event) {
        if (event.persisted || (window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0]?.type === 'back_forward')) {
            loadNotes();
            loadPhotos();
        }
    });
    window.MoyoCommonContentWidgets = { reloadNotes: loadNotes, reloadPhotos: loadPhotos };
})();
