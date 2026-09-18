
    function toPreviewText(value, maxLength) {
        const raw = String(value || "");
        const textarea = document.createElement("textarea");
        textarea.innerHTML = raw;

        const decoded = textarea.value;
        const doc = document.implementation.createHTMLDocument("");
        const holder = doc.createElement("div");
        holder.innerHTML = decoded;

        const text = (holder.textContent || holder.innerText || "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const limit = Number(maxLength) > 0 ? Number(maxLength) : 120;
        return text.length > limit ? text.slice(0, limit).trimEnd() + "…" : text;
    }

(() => {
    'use strict';

    const root = document.querySelector('.file-explorer[data-content-type="NOTE"]');
    if (!root) return;

    const value = (row, ...keys) => {
        for (const key of keys) if (row && row[key] != null) return row[key];
        return null;
    };
    const number = input => input == null || input === '' ? null : Number(input);
    const list = data => Array.isArray(data) ? data : (data?.items || data?.notes || data?.folders || []);
    const encode = params => new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
    const noteScope = scope => {
        const type = String(scope?.scopeType || '').toUpperCase();
        if (type === 'PROJECT') return { scope: 'PROJ', wsId: number(scope.wsId), projId: number(scope.projId ?? scope.scopeId) };
        if (type === 'GROUP' || type === 'WORKSPACE') return { scope: 'WS', wsId: number(scope.wsId ?? scope.scopeId) };
        return { scope: 'PRIVATE' };
    };
    const formBody = params => new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
    const contextPath = root.dataset.context || document.body?.dataset?.contextPath || '';
    const countValue = (row, ...keys) => {
        const picked = value(row, ...keys);
        const parsed = Number(picked);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const isYes = input => String(input ?? '').toUpperCase() === 'Y' || input === true;
    const plainText = input => String(input ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const postForm = (api, url, params) => api(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: formBody(params)
    });
    const noteCard = noteId => root.querySelector(`.file-item--note[data-id="${Number(noteId)}"]`);
    const setReactionCount = (noteId, type, nextValue) => {
        const card = noteCard(noteId);
        if (!card) return;
        const count = Math.max(0, Number(nextValue) || 0);
        card.querySelectorAll(`[data-note-${type}-count]`).forEach(node => { node.textContent = String(count); });
    };
    const setLikeState = (noteId, liked, likeCount) => {
        const card = noteCard(noteId);
        if (!card) return;
        card.querySelectorAll('[data-note-like-toggle]').forEach(button => {
            button.classList.toggle('is-active', Boolean(liked));
            button.setAttribute('aria-pressed', String(Boolean(liked)));
            button.title = liked ? '좋아요 취소' : '좋아요';
            const icon = button.querySelector('i');
            if (icon) icon.className = `${liked ? 'fa-solid' : 'fa-regular'} fa-heart`;
        });
        setReactionCount(noteId, 'like', likeCount);
    };
    async function each(ids, task) {
        for (const id of ids || []) await task(Number(id));
    }

    function renderFolderCard(item, { trashMode, escapeHtml }) {
        return `<article class="file-item explorer-list-row note-library-row" data-kind="folder" data-id="${item.id}" tabindex="0" aria-selected="false" draggable="${!trashMode}">
            <div class="file-item__icon explorer-list-slot explorer-list-slot--preview is-folder note-library-row__preview"><span class="file-folder-mark" aria-hidden="true"></span></div>
            <div class="file-item__name explorer-list-slot explorer-list-slot--name note-library-row__name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
            <div class="file-item__uploader explorer-list-slot explorer-list-slot--uploader note-library-row__uploader" aria-hidden="true"></div>
            <span class="file-item__date explorer-list-slot explorer-list-slot--date note-library-row__date">${escapeHtml(item.uploadedAt || '')}</span>
            <span class="file-item__size explorer-list-slot explorer-list-slot--specific note-library-row__count"><span class="file-item__count">${escapeHtml(item.count)}</span></span>
            <span class="file-item__status explorer-list-slot explorer-list-slot--status note-library-row__status" aria-hidden="true"></span>
            <span class="explorer-list-slot explorer-list-slot--download note-library-row__download" aria-hidden="true"></span>
            <div class="file-item__actions explorer-list-slot explorer-list-slot--menu note-library-row__menu"><button class="file-item__menu" type="button" data-more="1" aria-label="더보기"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button></div>
        </article>`;
    }

    function buildNoteCardModel(item, escapeHtml) {
        const raw = item.raw || {};
        const author = value(raw, 'userName', 'USER_NAME', 'authorName', 'AUTHOR_NAME') || item.uploader || '알 수 없음';

        return {
            raw,
            id: item.id,
            name: item.name,
            uploadedAt: item.uploadedAt,
            preview: escapeHtml(toPreviewText(raw.previewContent || raw.content || raw.noteContent || "", 120)),
            author,
            profileImagePath: value(raw, 'profileImagePath', 'PROFILE_IMAGE_PATH'),
            viewCount: countValue(raw, 'viewCount', 'VIEW_COUNT'),
            likeCount: countValue(raw, 'likeCount', 'LIKE_COUNT'),
            likedByMe: isYes(value(raw, 'likedByMe', 'LIKED_BY_ME', 'liked', 'LIKED')),
            feedbackCount: countValue(raw, 'feedbackCount', 'FEEDBACK_COUNT'),
            imageCount: countValue(raw, 'imageCount', 'IMAGE_COUNT'),
            tableCount: countValue(raw, 'tableCount', 'TABLE_COUNT'),
            linkCount: countValue(raw, 'linkCount', 'LINK_COUNT'),
            videoCount: countValue(raw, 'videoCount', 'VIDEO_COUNT'),
            moyoPublic: isYes(value(raw, 'moyoPublicYn', 'MOYO_PUBLIC_YN', 'moyoPublic', 'MOYO_PUBLIC')),
            shared: isYes(value(raw, 'shared', 'isShared', 'IS_SHARED')) || countValue(raw, 'shared', 'isShared', 'IS_SHARED') > 0,
            ownedByMe: isYes(value(raw, 'ownedByMe', 'OWNED_BY_ME')) || Number(value(raw, 'userId', 'USER_ID') || 0) === Number(root.dataset.currentUserId || document.body?.dataset?.currentUserId || 0)
        };
    }

    function renderNotePaper(model) {
        const notePaper = window.MoyoContentCard?.notePaper({
            id: model.id,
            title: model.name || '제목 없는 노트',
            preview: model.preview,
            author: model.author,
            date: model.uploadedAt,
            imageCount: model.imageCount,
            tableCount: model.tableCount,
            linkCount: model.linkCount,
            videoCount: model.videoCount,
            viewCount: model.viewCount,
            likeCount: model.likeCount,
            commentCount: model.feedbackCount,
            likedByMe: model.likedByMe,
            moyoPublic: model.moyoPublic
        }, {
            outerClass: 'profile-note-paper-card explorer-note-paper-card',
            buttonClass: 'profile-note-paper-button explorer-note-paper-button',
            paperClass: 'profile-note-paper explorer-note-paper',
            innerClass: 'profile-note-paper-inner',
            titleClass: 'profile-note-paper-title',
            metaClass: 'explorer-note-content-meta',
            metaItemClass: 'explorer-note-content-meta__item',
            lineClass: 'profile-note-paper-line is-strong',
            bodyClass: 'profile-note-paper-body',
            linesClass: 'profile-note-paper-lines',
            hoverClass: 'profile-note-hover explorer-note-hover',
            hoverMainClass: 'profile-note-hover-main',
            hoverMetaClass: 'profile-note-hover-meta',
            hoverDotClass: 'profile-note-hover-dot',
            hoverDateClass: 'profile-note-hover-date',
            actionWrapClass: 'profile-note-feed-actions',
            actionClass: 'profile-note-feed-action',
            likeClass: 'explorer-note-like-toggle',
            viewAttr: 'data-note-view-count',
            likeToggleAttr: 'data-note-like-toggle',
            likeCountAttr: 'data-note-like-count',
            commentCountAttr: 'data-note-comment-count',
            showSharedState: model.shared,
            showShare: model.moyoPublic,
            shareAction: 'friend-send',
            shareTitle: '친구에게 보내기',
            shareAriaLabel: '친구에게 보내기',
            showCollect: model.moyoPublic && !model.ownedByMe,
            showMoyoMark: true,
            moyoMarkClass: 'profile-note-moyo-mark explorer-note-moyo-mark',
            moyoMarkSrc: contextPath + '/brand/moyo_mark.png'
        });

        if (!notePaper) throw new Error('MoyoContentCard.notePaper renderer is required.');
        return notePaper;
    }

    function renderNoteListContentMeta(model) {
        const items = [
            { key: 'image', icon: 'fa-regular fa-image', label: '이미지', count: model.imageCount },
            { key: 'table', icon: 'fa-solid fa-table-cells', label: '표', count: model.tableCount },
            { key: 'link', icon: 'fa-solid fa-link', label: '링크', count: model.linkCount },
            { key: 'video', icon: 'fa-regular fa-circle-play', label: '동영상', count: model.videoCount }
        ].filter(item => item.count > 0);

        if (!items.length) return '';

        return `<span class="explorer-note-list-content-meta" aria-label="노트 구성 정보">${items.map(item =>
            `<span class="explorer-note-list-content-meta__item" data-content-kind="${item.key}" title="${item.label} ${item.count}개"><i class="${item.icon}" aria-hidden="true"></i><span>${item.count}</span></span>`
        ).join('')}</span>`;
    }

    function renderNoteListReactions(model) {
        return `<span class="explorer-note-list-reactions" aria-label="노트 반응 정보">
            <span class="explorer-note-list-reaction" title="조회수"><i class="fa-regular fa-eye" aria-hidden="true"></i><span data-note-view-count>${model.viewCount}</span></span>
            <button type="button" class="explorer-note-list-reaction explorer-note-like-toggle${model.likedByMe ? ' is-active' : ''}" data-note-like-toggle data-note-id="${model.id}" aria-pressed="${model.likedByMe ? 'true' : 'false'}" title="${model.likedByMe ? '좋아요 취소' : '좋아요'}"><i class="${model.likedByMe ? 'fa-solid' : 'fa-regular'} fa-heart" aria-hidden="true"></i><span data-note-like-count>${model.likeCount}</span></button>
            <span class="explorer-note-list-reaction" title="댓글"><i class="fa-regular fa-comment" aria-hidden="true"></i><span data-note-comment-count>${model.feedbackCount}</span></span>
        </span>`;
    }

    function renderNoteListMobileReactions(model) {
        return `<span class="explorer-note-list-mobile-reactions" aria-label="노트 반응 정보">
            <button type="button" class="explorer-note-list-reaction explorer-note-like-toggle${model.likedByMe ? ' is-active' : ''}" data-note-like-toggle data-note-id="${model.id}" aria-pressed="${model.likedByMe ? 'true' : 'false'}" title="${model.likedByMe ? '좋아요 취소' : '좋아요'}"><i class="${model.likedByMe ? 'fa-solid' : 'fa-regular'} fa-heart" aria-hidden="true"></i><span data-note-like-count>${model.likeCount}</span></button>
            <span class="explorer-note-list-reaction" title="댓글"><i class="fa-regular fa-comment" aria-hidden="true"></i><span data-note-comment-count>${model.feedbackCount}</span></span>
        </span>`;
    }

    function renderNoteListActions(model) {
        const shareTitle = model.shared ? '공유 중' : '공유 안 됨';
        const moyoTitle = 'MOYO 공개';
        const sendMarkup = model.moyoPublic
            ? `<button type="button" class="explorer-note-list-action is-send profile-note-feed-action is-icon-only" data-explorer-friend-send data-content-id="${model.id}" title="친구에게 보내기" aria-label="친구에게 보내기"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i></button>`
            : '';
        const collectMarkup = model.moyoPublic && !model.ownedByMe
            ? `<button type="button" class="explorer-note-list-action is-collect profile-note-feed-action is-icon-only" data-profile-note-card-collect data-profile-note-collect data-note-id="${model.id}" title="담기" aria-label="담기" aria-pressed="false"><i class="fa-regular fa-bookmark" aria-hidden="true"></i></button>`
            : '';

        const shareMarkup = model.shared
            ? `<button type="button" class="explorer-note-list-action is-share-state is-active" data-explorer-share-open style="cursor: pointer;" data-content-id="${model.id}" title="친구 공유" aria-label="친구 공유"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button>`
            : '';

        return `<span class="explorer-note-list-actions${model.moyoPublic ? ' is-moyo-public' : ''}" aria-label="노트 공유 및 공개 상태">
            ${shareMarkup}
            ${sendMarkup}
            ${collectMarkup}
            ${model.moyoPublic ? `<span class="explorer-note-list-action is-moyo is-active" title="${moyoTitle}" aria-label="${moyoTitle}"><img src="${contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" aria-hidden="true"></span>` : ''}
        </span>`;
    }

    function renderNoteCard(item, { trashMode, view, escapeHtml, uploaderMarkup, renderListRow }) {
        const model = buildNoteCardModel(item, escapeHtml);
        const notePaper = renderNotePaper(model);
        const title = escapeHtml(model.name || '제목 없는 노트');
        const contentMeta = renderNoteListContentMeta(model);
        const reactions = renderNoteListReactions(model);
        const listActions = renderNoteListActions(model);
        const mobileReactions = renderNoteListMobileReactions(model);
        const mobileMoyoMark = model.moyoPublic
            ? `<span class="explorer-note-list-mobile-moyo" title="MOYO 공개" aria-label="MOYO 공개"><img src="${contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" aria-hidden="true"></span>`
            : '';

        if (view === 'list' && typeof renderListRow === 'function') {
            return renderListRow({
                kind: 'file',
                id: model.id,
                draggable: !trashMode,
                classes: 'file-item--note',
                preview: '<span class="explorer-note-list-preview-icon" aria-hidden="true"><i class="fa-regular fa-note-sticky"></i></span>',
                name: `<div class="file-item__name explorer-note-list-main" title="${title}"><div class="explorer-note-list-heading"><span class="explorer-note-list-title">${title}</span>${mobileMoyoMark}${contentMeta}</div><div class="explorer-note-list-preview">${model.preview || '<span class="is-empty">내용 없음</span>'}</div></div>`,
                uploader: `<div class="file-item__uploader">${uploaderMarkup({ ...model.raw, creatorName: model.author, creatorProfileImagePath: model.profileImagePath, creatorProfileAvatarType: model.profileImagePath ? 'IMAGE' : 'DEFAULT' })}</div>`,
                date: `<span class="file-item__date">${escapeHtml(model.uploadedAt)}</span>`,
                specific: `<span class="file-item__size"><span class="explorer-note-list-desktop-reactions">${reactions}</span>${mobileReactions}</span>`,
                status: `<span class="file-item__status">${listActions}</span>`
            });
        }

        return `<article class="file-item explorer-list-row file-item--note" data-kind="file" data-id="${model.id}" tabindex="0" aria-selected="false" draggable="${!trashMode}">
            <div class="explorer-note-paper-slot explorer-list-slot explorer-list-slot--preview">
                <span class="explorer-note-list-preview-icon" aria-hidden="true"><i class="fa-regular fa-note-sticky"></i></span>
                ${notePaper}
            </div>
            <div class="file-item__name explorer-list-slot explorer-list-slot--name explorer-note-list-main explorer-note-list-only" title="${title}">
                <div class="explorer-note-list-heading">
                    <span class="explorer-note-list-title">${title}</span>
                    ${mobileMoyoMark}
                    ${contentMeta}
                </div>
                <div class="explorer-note-list-preview">${model.preview || '<span class="is-empty">내용 없음</span>'}</div>
            </div>
            <div class="file-item__uploader explorer-list-slot explorer-list-slot--uploader explorer-note-list-only">${uploaderMarkup({
                ...model.raw,
                creatorName: model.author,
                creatorProfileImagePath: model.profileImagePath,
                creatorProfileAvatarType: model.profileImagePath ? 'IMAGE' : 'DEFAULT'
            })}</div>
            <span class="file-item__date explorer-list-slot explorer-list-slot--date explorer-note-list-only">${escapeHtml(model.uploadedAt)}</span>
            <span class="file-item__size explorer-list-slot explorer-list-slot--specific explorer-note-list-only">${reactions}</span>
            <span class="file-item__status explorer-list-slot explorer-list-slot--status explorer-note-list-only">${listActions}</span>
            <span class="explorer-list-slot explorer-list-slot--download explorer-note-list-only" aria-hidden="true"></span>
            <div class="file-item__actions explorer-list-slot explorer-list-slot--menu"><button class="file-item__menu" type="button" data-more="1" aria-label="더보기"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button></div>
        </article>`;
    }

    root.addEventListener('click', async event => {
        const likeButton = event.target.closest('[data-note-like-toggle]');
        if (!likeButton) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const noteId = Number(likeButton.dataset.noteId);
        if (!noteId || likeButton.disabled) return;

        const currentLiked = likeButton.classList.contains('is-active');
        const currentCount = Number(likeButton.querySelector('[data-note-like-count]')?.textContent || 0) || 0;
        const optimisticLiked = !currentLiked;
        const optimisticCount = Math.max(0, currentCount + (optimisticLiked ? 1 : -1));

        likeButton.disabled = true;
        setLikeState(noteId, optimisticLiked, optimisticCount);

        try {
            const response = await fetch(`${contextPath}/note/api/public/like`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: formBody({ noteId })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) throw new Error(data.message || '좋아요를 처리하지 못했습니다.');
            setLikeState(noteId, Boolean(data.liked), data.likeCount);
            if (data.viewCount != null) setReactionCount(noteId, 'view', data.viewCount);
        } catch (error) {
            setLikeState(noteId, currentLiked, currentCount);
            console.error('[NOTE explorer] 좋아요 처리 실패:', error);
            alert(error.message || '좋아요를 처리하지 못했습니다.');
        } finally {
            likeButton.disabled = false;
        }
    });

    window.MoyoContentExplorerAdapter = {
        labels: { newContainerTitle: '새 라이브러리', item: '노트' },
        endpoints: {
            friendShareOwners: '/share/api/friend-owners?contentType=NOTE',
            friendShareItems: '/note/api/friend-shares/notes'
        },
        scopeParams(scope) { return noteScope(scope); },
        rootLabel(scope) {
            const type = String(scope?.scopeType || '').toUpperCase();
            if (type === 'PROJECT') return scope.projectName || '프로젝트';
            if (type === 'GROUP') return '그룹 라이브러리';
            return '내 라이브러리';
        },
        async loadContainers({ api, query, scope }) {
            const rows = list(await api('/note/api/folders?' + query(noteScope(scope))));
            return rows.map(row => ({
                ...row,
                folderId: number(value(row, 'folderId', 'FOLDER_ID')),
                parentFolderId: number(value(row, 'parentFolderId', 'PARENT_FOLDER_ID')),
                folderName: value(row, 'folderName', 'FOLDER_NAME') || '라이브러리',
                childFolderCount: 0,
                fileCount: number(value(row, 'noteCount', 'NOTE_COUNT')) || 0
            }));
        },
        async loadFriendShareItems({ api, query, ownerId, keyword, sort }) {
            let notes = list(await api('/note/api/friend-shares/notes?' + query({ ownerId })));
            const term = String(keyword || '').trim().toLowerCase();
            if (term) {
                notes = notes.filter(row => String(value(row, 'noteTitle', 'NOTE_TITLE') || '').toLowerCase().includes(term));
            }
            if (sort === 'LATEST') {
                notes.sort((a, b) => String(value(b, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '').localeCompare(String(value(a, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '')));
            } else if (sort === 'OLDEST') {
                notes.sort((a, b) => String(value(a, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '').localeCompare(String(value(b, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '')));
            } else {
                notes.sort((a, b) => String(value(a, 'noteTitle', 'NOTE_TITLE') || '').localeCompare(String(value(b, 'noteTitle', 'NOTE_TITLE') || ''), 'ko'));
            }
            return { containers: [], items: notes };
        },
        async loadItems({ api, query, scope, containerId, trashMode, recentMode, keyword, sort }) {
            const params = trashMode
                ? { scope: 'TRASH', folderId: null, keyword: keyword || '', size: 500 }
                : { ...noteScope(scope), folderId: containerId, keyword: keyword || '', size: 500 };
            let notes = list(await api('/note/api/explorer?' + query(params)));
            if (sort === 'LATEST') {
                notes.sort((a, b) => String(value(b, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '').localeCompare(String(value(a, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '')));
            } else if (sort === 'OLDEST') {
                notes.sort((a, b) => String(value(a, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '').localeCompare(String(value(b, 'updDt', 'UPD_DT', 'regDt', 'REG_DT') || '')));
            } else {
                notes.sort((a, b) => String(value(a, 'noteTitle', 'NOTE_TITLE') || '').localeCompare(String(value(b, 'noteTitle', 'NOTE_TITLE') || ''), 'ko'));
            }
            let containers = [];
            if (!trashMode && !recentMode) {
                const allContainers = await this.loadContainers({ api, query, scope });
                containers = allContainers.filter(row => (row.parentFolderId ?? null) === (containerId ?? null));
            }
            return { containers, items: notes };
        },
        mapContainers(rows, { formatDate }) {
            return rows.map(row => ({
                kind: 'folder',
                id: number(row.folderId),
                name: row.folderName || '라이브러리',
                count: `${number(row.fileCount) || 0}개 항목`,
                uploadedAt: formatDate(value(row, 'updDt', 'UPD_DT', 'regDt', 'REG_DT')),
                raw: row
            }));
        },
        mapItems(rows, { formatDate }) {
            return rows.map(row => ({
                kind: 'file',
                id: number(value(row, 'noteId', 'NOTE_ID')),
                name: value(row, 'noteTitle', 'NOTE_TITLE') || '노트',
                uploader: value(row, 'userName', 'USER_NAME', 'authorName', 'AUTHOR_NAME') || '',
                uploadedAt: formatDate(value(row, 'updDt', 'UPD_DT', 'regDt', 'REG_DT')),
                fileSize: '',
                raw: row
            }));
        },
        renderCard(item, { trashMode, view, escapeHtml, uploaderMarkup, renderListRow }) {
            if (item.kind === 'folder') {
                if (view === 'list' && typeof renderListRow === 'function') {
                    return renderListRow({
                        kind: 'folder',
                        id: item.id,
                        draggable: !trashMode,
                        classes: 'note-library-row',
                        preview: '<span class="file-item__icon is-folder"><span class="file-folder-mark" aria-hidden="true"></span></span>',
                        name: `<span class="file-item__name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>`,
                        date: `<span class="file-item__date">${escapeHtml(item.uploadedAt || '')}</span>`,
                        specific: `<span class="file-item__size"><span class="file-item__count">${escapeHtml(item.count)}</span></span>`
                    });
                }
                return renderFolderCard(item, { trashMode, escapeHtml });
            }
            return renderNoteCard(item, { trashMode, view, escapeHtml, uploaderMarkup, renderListRow });
        },
        async createContainer({ api, name, scope, parentContainerId }) {
            await postForm(api, '/note/api/folder/create', { ...noteScope(scope), parentFolderId: parentContainerId, folderName: name });
        },
        async renameSelected({ api, selected, name }) {
            if (selected.kind === 'folder') await postForm(api, '/note/api/folder/rename', { folderId: selected.id, folderName: name });
            else await postForm(api, '/note/api/note/rename', { noteId: selected.id, noteTitle: name });
        },
        async moveSelection({ api, selected, targetContainerId }) {
            await each(selected.fileIds, id => postForm(api, '/note/api/folder/move-note', { noteId: id, folderId: targetContainerId }));
        },
        async batchAction({ action, payload, api }) {
            const noteIds = payload.fileIds || [];
            const libraryIds = payload.folderIds || [];
            if (action === 'trash') {
                await each(noteIds, id => postForm(api, '/note/api/note/trash', { noteId: id }));
                await each(libraryIds, id => postForm(api, '/note/api/folder/delete', { folderId: id }));
                return;
            }
            if (action === 'restore') { await each(noteIds, id => postForm(api, '/note/api/note/restore', { noteId: id })); return; }
            if (action === 'permanent') { await each(noteIds, id => postForm(api, '/note/api/note/permanent-delete', { noteId: id })); return; }
        },
        openUpload({ containerId, containerName, scope }) {
            if (!window.MoyoNoteModal || typeof window.MoyoNoteModal.open !== 'function') {
                throw new Error('노트 작성 모달을 불러오지 못했습니다.');
            }
            const rootName = this.rootLabel(scope || {});
            window.MoyoNoteModal.open({
                scopeType: scope?.scopeType || 'PERSONAL',
                scopeId: scope?.scopeId || null,
                wsId: scope?.wsId || null,
                projId: scope?.projId || null,
                folderId: containerId ?? null,
                libraryName: String(containerName || rootName || '라이브러리').trim()
            });
        },
        uploadItems(args) { this.openUpload(args); },
        async openItem({ id, api, contextPath, scope }) {
            try {
                if (typeof api === 'function') {
                    const result = await postForm(api, '/note/api/public/view', { noteId: id });
                    if (result?.success !== false && result?.viewCount != null) {
                        setReactionCount(id, 'view', result.viewCount);
                    }
                }
            } catch (error) {
                console.warn('[NOTE explorer] 조회수 반영 실패:', error);
            }
            if (!window.MoyoNoteModal || typeof window.MoyoNoteModal.open !== 'function') {
                window.location.href = contextPath + `/note/detail?noteId=${id}`;
                return;
            }
            window.MoyoNoteModal.open({
                noteId: Number(id),
                scopeType: scope?.scopeType || null,
                scopeId: scope?.scopeId || null,
                wsId: scope?.wsId || null,
                projId: scope?.projId || null
            });
        }
    };
})();
