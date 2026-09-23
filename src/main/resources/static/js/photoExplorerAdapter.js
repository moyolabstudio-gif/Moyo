(() => {
    'use strict';

    const root = document.querySelector('.file-explorer[data-content-type="PHOTO"]');
    if (!root) return;

    let currentAlbumPostIds = [];

    const value = (row, ...keys) => {
        for (const key of keys) {
            if (row && row[key] != null) return row[key];
        }
        return null;
    };
    const number = input => input == null || input === '' ? null : Number(input);
    const plainText = input => String(input || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();
    const displayPhotoTitle = row => {
        const description = plainText(value(row, 'description', 'DESCRIPTION'));
        return description || '제목 없음';
    };
    const photoScope = scope => {
        const type = String(scope?.scopeType || '').toUpperCase();
        if (type === 'PROJECT') return { scopeType: 'PROJECT', scopeId: number(scope.projId ?? scope.scopeId) };
        if (type === 'GROUP' || type === 'WORKSPACE') return { scopeType: 'WORKSPACE', scopeId: number(scope.wsId ?? scope.scopeId) };
        return { scopeType: 'PERSONAL', scopeId: number(scope.scopeId) };
    };
    const list = data => Array.isArray(data) ? data : (data?.items || data?.posts || data?.albums || []);
    const encode = params => new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
    const contextPath = () => root.dataset.context || document.body?.dataset?.contextPath || '';
    const securePhotoUrl = (photoId, fallback = '') => {
        const id = number(photoId);
        return id ? `${contextPath()}/photo/media/${id}` : String(fallback || '');
    };

    async function each(ids, task) {
        for (const id of ids) await task(Number(id));
    }

    function safeDownloadName(input, fallback) {
        const name = String(input || '').split('/').pop().split('?')[0].trim();
        return name || fallback;
    }

    async function downloadBlob(url, fileName) {
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) throw new Error('사진 파일을 다운로드하지 못했습니다.');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }

    async function downloadPhotoPost({ id, api, contextPath }) {
        const detail = await api(`/api/photo-posts/${Number(id)}`);
        const photos = Array.isArray(detail?.photos) ? detail.photos : [];
        if (!photos.length) throw new Error('다운로드할 사진이 없습니다.');
        for (let index = 0; index < photos.length; index += 1) {
            const photo = photos[index] || {};
            const path = value(photo, 'filePath', 'FILE_PATH');
            if (!path) continue;
            const url = /^(https?:)?\/\//i.test(path) ? path : `${contextPath || ''}${String(path).startsWith('/') ? '' : '/'}${path}`;
            const fileName = safeDownloadName(value(photo, 'originalName', 'ORIGINAL_NAME', 'fileName', 'FILE_NAME') || path, `photo-${id}-${index + 1}`);
            await downloadBlob(url, fileName);
            if (photos.length > 1) await new Promise(resolve => setTimeout(resolve, 120));
        }
    }

    function openPhotoDetail(postId, focusComment = false) {
        const detail = window.MoyoPhotoPostDetail;
        if (!detail || typeof detail.open !== 'function') {
            throw new Error('공통 사진 상세 모듈을 불러오지 못했습니다.');
        }
        const currentId = Number(postId);
        const albumPostIds = currentAlbumPostIds.slice();
        if (currentId && !albumPostIds.includes(currentId)) albumPostIds.push(currentId);
        const opened = detail.open(currentId, { mode: 'VIEWER', albumPostIds });
        if (focusComment) {
            Promise.resolve(opened).then(() => {
                requestAnimationFrame(() => document.getElementById('photoRuntimeCommentInput')?.focus());
            });
        }
        return opened;
    }

    window.MoyoContentExplorerAdapter = {
        sortOptions: [
            { value: 'NAME_ASC', label: '이름순' },
            { value: 'LATEST', label: '최신순' },
            { value: 'OLDEST', label: '오래된순' },
            { value: 'LIKE_DESC', label: '좋아요순' },
            { value: 'COMMENT_DESC', label: '댓글순' }
        ],
        sortItems(rows, sort) {
            const dateOf = row => String(value(row, 'updatedAt', 'UPDATED_AT', 'createdAt', 'CREATED_AT') || '');
            const likes = row => number(value(row, 'likeCount', 'LIKE_COUNT')) || 0;
            const comments = row => number(value(row, 'commentCount', 'COMMENT_COUNT')) || 0;
            const byName = (a, b) => displayPhotoTitle(a).localeCompare(displayPhotoTitle(b), 'ko', { numeric: true, sensitivity: 'base' });
            if (sort === 'LATEST') return rows.sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || byName(a, b));
            if (sort === 'OLDEST') return rows.sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || byName(a, b));
            if (sort === 'LIKE_DESC') return rows.sort((a, b) => likes(b) - likes(a) || dateOf(b).localeCompare(dateOf(a)) || byName(a, b));
            if (sort === 'COMMENT_DESC') return rows.sort((a, b) => comments(b) - comments(a) || dateOf(b).localeCompare(dateOf(a)) || byName(a, b));
            return rows.sort(byName);
        },
        labels: {
            item: '사진',
            newContainerTitle: '새 앨범'
        },
        endpoints: {
            friendShareOwners: '/share/api/friend-owners?contentType=PHOTO',
            friendShareItems: '/api/photo-posts/friend-shares'
        },
        scopeParams(scope) {
            return photoScope(scope);
        },
        rootLabel(scope) {
            if (String(scope?.scopeType).toUpperCase() === 'PROJECT') return scope.projectName || '프로젝트';
            if (String(scope?.scopeType).toUpperCase() === 'GROUP') return '그룹 사진';
            return '내 사진';
        },
        async loadContainers({ api, query, scope }) {
            const rows = list(await api('/api/photo-albums?' + query(photoScope(scope))));
            return rows.map(row => ({
                ...row,
                folderId: number(value(row, 'albumId', 'ALBUM_ID')),
                parentFolderId: number(value(row, 'parentAlbumId', 'PARENT_ALBUM_ID')),
                folderName: value(row, 'albumName', 'ALBUM_NAME') || '앨범',
                childFolderCount: number(value(row, 'childAlbumCount', 'CHILD_ALBUM_COUNT')) || 0,
                fileCount: number(value(row, 'postCount', 'POST_COUNT', 'photoCount', 'PHOTO_COUNT')) || 0
            }));
        },
        async loadFriendShareItems({ api, query, ownerId, keyword, sort }) {
            let posts = list(await api('/api/photo-posts/friend-shares?' + query({ ownerId })));

            const term = String(keyword || '').trim().toLowerCase();
            if (term) posts = posts.filter(row => displayPhotoTitle(row).toLowerCase().includes(term));
            posts = this.sortItems(posts, sort);

            currentAlbumPostIds = posts
                .map(row => number(value(row, 'postId', 'POST_ID')))
                .filter(Boolean);

            const multiPhotoPosts = posts.filter(row => (number(value(row, 'photoCount', 'PHOTO_COUNT')) || 1) > 1);
            if (multiPhotoPosts.length) {
                await Promise.allSettled(multiPhotoPosts.map(async row => {
                    const postId = number(value(row, 'postId', 'POST_ID'));
                    if (!postId) return;
                    const detail = await api(`/api/photo-posts/${postId}`);
                    const photos = Array.isArray(detail?.photos) ? detail.photos : [];
                    row.__explorerPhotos = photos
                        .map(photo => value(photo, 'filePath', 'FILE_PATH'))
                        .filter(Boolean)
                        .slice(0, 4);
                }));
            }

            return { containers: [], items: posts };
        },
        async loadCollectionItems({ api, query, scope, keyword, sort, collectionType }) {
            let posts = list(await api('/api/photo-posts?' + query(photoScope(scope))));
            if (collectionType === 'MOYO') {
                posts = posts.filter(row => String(value(row, 'visibilityType', 'VISIBILITY_TYPE') || '').toUpperCase() === 'FRIENDS');
            } else {
                posts = posts.filter(row => Number(value(row, 'likedByMe', 'LIKED_BY_ME')) === 1 || value(row, 'likedByMe', 'LIKED_BY_ME') === true);
            }
            const term = String(keyword || '').trim().toLowerCase();
            if (term) posts = posts.filter(row => displayPhotoTitle(row).toLowerCase().includes(term));
            posts = this.sortItems(posts, sort);
            const multi = posts.filter(row => (number(value(row, 'photoCount', 'PHOTO_COUNT')) || 1) > 1);
            if (multi.length) {
                await Promise.allSettled(multi.map(async row => {
                    const postId = number(value(row, 'postId', 'POST_ID'));
                    if (!postId) return;
                    const detail = await api(`/api/photo-posts/${postId}`);
                    row.__explorerPhotos = (Array.isArray(detail?.photos) ? detail.photos : []).map(photo => value(photo, 'filePath', 'FILE_PATH')).filter(Boolean).slice(0, 4);
                }));
            }
            return { containers: [], items: posts };
        },
        async loadItems({ api, query, scope, containerId, trashMode, recentMode, keyword, sort }) {
            let posts;
            if (trashMode) {
                const scoped = photoScope(scope);
                posts = list(await api('/api/photo-posts/trash?' + query(scoped)));
            } else if (recentMode) {
                posts = list(await api('/api/photo-posts/recent?' + query({ ...photoScope(scope), limit: 50 })));
            } else {
                posts = list(await api('/api/photo-posts?' + query({ ...photoScope(scope), albumId: containerId })));
                if (containerId == null) {
                    posts = posts.filter(row => number(value(row, 'albumId', 'ALBUM_ID')) == null);
                }
            }

            const term = String(keyword || '').trim().toLowerCase();
            if (term) posts = posts.filter(row => displayPhotoTitle(row).toLowerCase().includes(term));
            posts = this.sortItems(posts, sort);

            currentAlbumPostIds = posts
                .map(row => number(value(row, 'postId', 'POST_ID')))
                .filter(Boolean);

            // 기존 카드 내부 배치는 유지하고, 다중 사진 게시물의 썸네일 경로만 보강한다.
            const multiPhotoPosts = posts.filter(row => (number(value(row, 'photoCount', 'PHOTO_COUNT')) || 1) > 1);
            if (multiPhotoPosts.length) {
                await Promise.allSettled(multiPhotoPosts.map(async row => {
                    const postId = number(value(row, 'postId', 'POST_ID'));
                    if (!postId) return;
                    const detail = await api(`/api/photo-posts/${postId}`);
                    const photos = Array.isArray(detail?.photos) ? detail.photos : [];
                    row.__explorerPhotos = photos
                        .map(photo => value(photo, 'filePath', 'FILE_PATH'))
                        .filter(Boolean)
                        .slice(0, 4);
                }));
            }

            let containers = [];
            if (!trashMode && !recentMode) {
                const allContainers = await this.loadContainers({ api, query, scope });
                containers = allContainers.filter(row => (row.parentFolderId ?? null) === (containerId ?? null));
            }
            return { containers, items: posts };
        },
        mapContainers(rows) {
            return rows.map(row => ({
                kind: 'folder',
                id: number(row.folderId),
                name: row.folderName || '앨범',
                count: `${number(row.fileCount) || 0}개 사진`,
                raw: row
            }));
        },
        mapItems(rows, { formatDate }) {
            return rows.map(row => ({
                kind: 'file',
                id: number(value(row, 'postId', 'POST_ID')),
                name: displayPhotoTitle(row),
                uploader: value(row, 'creatorName', 'CREATOR_NAME') || '',
                uploadedAt: formatDate(value(row, 'createdAt', 'CREATED_AT', 'updatedAt', 'UPDATED_AT')),
                fileSize: '',
                raw: row
            }));
        },
        renderCard(item, { trashMode, view, escapeHtml, uploaderMarkup, renderListRow }) {
            if (item.kind === 'folder') {
                const raw = item.raw || {};
                const cover = securePhotoUrl(value(raw, 'coverPhotoId', 'COVER_PHOTO_ID'), value(raw, 'coverPath', 'COVER_PATH'));
                if (view === 'list' && typeof renderListRow === 'function') {
                    const childCount = number(value(raw, 'childFolderCount', 'CHILD_FOLDER_COUNT')) || 0;
                    const postCount = number(value(raw, 'fileCount', 'postCount', 'POST_COUNT')) || 0;
                    return renderListRow({
                        kind: 'folder',
                        id: item.id,
                        draggable: !trashMode,
                        classes: 'photo-album-card',
                        preview: `<span class="file-item__icon is-folder photo-album-card__cover">${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : '<span class="photo-album-card__icon" aria-hidden="true"><i class="fa-regular fa-images"></i></span>'}</span>`,
                        name: `<div class="file-item__name photo-list-name photo-list-name--album" title="${escapeHtml(item.name)}"><strong>${escapeHtml(item.name)}</strong><span class="photo-list-name__sub"><i class="fa-solid fa-folder-open" aria-hidden="true"></i>앨범 · ${escapeHtml(`${childCount + postCount}개 항목`)}</span></div>`
                    });
                }
                return `<article class="file-item explorer-list-row photo-album-card" data-kind="folder" data-id="${item.id}" tabindex="0" aria-selected="false" draggable="${!trashMode}">
                    <div class="file-item__icon explorer-list-slot explorer-list-slot--preview is-folder photo-album-card__cover">
                        ${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : '<span class="photo-album-card__icon" aria-hidden="true"><i class="fa-regular fa-images"></i></span>'}
                    </div>
                    <div class="photo-album-card__footer" aria-hidden="true">
                        <span class="photo-album-card__footer-icon"><i class="fa-solid fa-folder-open"></i></span>
                        <span class="photo-album-card__footer-copy">
                            <strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong>
                            <small>${escapeHtml(item.count)}</small>
                        </span>
                    </div>
                    <div class="file-item__name explorer-list-slot explorer-list-slot--name photo-list-name photo-list-name--album" title="${escapeHtml(item.name)}">
                        <strong>${escapeHtml(item.name)}</strong>
                        <span class="photo-list-name__sub"><i class="fa-solid fa-folder-open" aria-hidden="true"></i>앨범 · ${escapeHtml((() => {
                            const childCount = number(value(raw, 'childFolderCount', 'CHILD_FOLDER_COUNT')) || 0;
                            const postCount = number(value(raw, 'fileCount', 'postCount', 'POST_COUNT')) || 0;
                            return `${childCount + postCount}개 항목`;
                        })())}</span>
                    </div>
                    <div class="file-item__uploader explorer-list-slot explorer-list-slot--uploader photo-list-uploader photo-list-album-empty" aria-hidden="true"></div>
                    <span class="file-item__date explorer-list-slot explorer-list-slot--date photo-list-date photo-list-album-empty" aria-hidden="true"></span>
                    <span class="file-item__size explorer-list-slot explorer-list-slot--specific photo-list-summary photo-list-summary--album photo-list-album-empty" aria-hidden="true"></span>
                    <span class="file-item__status explorer-list-slot explorer-list-slot--status" aria-hidden="true"></span>
                    <span class="explorer-list-slot explorer-list-slot--download" aria-hidden="true"></span>
                    <div class="file-item__actions explorer-list-slot explorer-list-slot--menu"><button class="file-item__menu" type="button" data-more="1" aria-label="더보기"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button></div>
                </article>`;
            }

            const raw = item.raw || {};
            const cover = securePhotoUrl(value(raw, 'coverPhotoId', 'COVER_PHOTO_ID'), value(raw, 'coverPath', 'COVER_PATH'));
            const author = value(raw, 'creatorName', 'CREATOR_NAME', 'userName', 'USER_NAME', 'authorName', 'AUTHOR_NAME') || '알 수 없음';
            const creatorProfileImagePath = value(
                raw,
                'creatorProfileImagePath', 'CREATOR_PROFILE_IMAGE_PATH',
                'profileImagePath', 'PROFILE_IMAGE_PATH',
                'userProfileImagePath', 'USER_PROFILE_IMAGE_PATH',
                'creatorImagePath', 'CREATOR_IMAGE_PATH'
            ) || '';
            const uploaderRow = {
                ...raw,
                creatorName: author,
                creatorProfileImagePath,
                creatorProfileAvatarType: creatorProfileImagePath ? 'IMAGE' : 'DEFAULT'
            };
            const createdAt = item.uploadedAt || '';
            const likeCount = number(value(raw, 'likeCount', 'LIKE_COUNT')) || 0;
            const commentCount = number(value(raw, 'commentCount', 'COMMENT_COUNT')) || 0;
            const likedByMe = /^(1|true|y)$/i.test(String(value(raw, 'likedByMe', 'LIKED_BY_ME', 'liked', 'LIKED') || ''));
            const photoCount = number(value(raw, 'photoCount', 'PHOTO_COUNT')) || 1;
            const scopeType = String(value(raw, 'scopeType', 'SCOPE_TYPE') || '').toUpperCase();
            const visibilityType = String(value(raw, 'visibilityType', 'VISIBILITY_TYPE') || '').toUpperCase();
            const isPersonal = scopeType === 'PERSONAL';
            const isMoyoPublic = isPersonal && visibilityType === 'FRIENDS';
            const isShared = isPersonal && (
                number(value(raw, 'isSharedByMe', 'IS_SHARED_BY_ME')) === 1 ||
                number(value(raw, 'isSharedToMe', 'IS_SHARED_TO_ME')) === 1 ||
                String(value(raw, 'shareTargetUserIds', 'SHARE_TARGET_USER_IDS') || '').trim() !== ''
            );
            const isCollectedCopy = number(value(raw, 'isCollectedCopy', 'IS_COLLECTED_COPY')) === 1;
            const collectedByMe = number(value(raw, 'collectedByMe', 'COLLECTED_BY_ME')) === 1;
            const ownerId = number(value(raw, 'userId', 'USER_ID', 'createdBy', 'CREATED_BY')) || 0;
            const currentUserId = number(root.dataset.currentUserId || document.body?.dataset?.currentUserId) || 0;
            const isOwner = !!ownerId && !!currentUserId && ownerId === currentUserId;
            const sourceCreatorName = String(value(raw, 'collectedSourceCreatorName', 'COLLECTED_SOURCE_CREATOR_NAME') || '').trim();
            const collectedSourceMarkup = isCollectedCopy
                ? `<span class="is-personal photo-grid-card__collected" title="${escapeHtml(sourceCreatorName ? sourceCreatorName + '에게서 담은 사진' : '담아온 사진')}" aria-label="${escapeHtml(sourceCreatorName ? sourceCreatorName + '에게서 담은 사진' : '담아온 사진')}"><i class="fa-solid fa-bookmark" aria-hidden="true"></i></span>`
                : '';
            const listStateMarkup = [
                isPersonal && isOwner ? `<span class="photo-list-state is-share-state${isShared ? ' is-active' : ''}" data-explorer-share-open data-content-id="${item.id}" role="button" tabindex="0" title="공유" aria-label="공유"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></span>` : '',
                isMoyoPublic && !isOwner ? `<span class="photo-list-state is-collect${collectedByMe || isCollectedCopy ? ' is-active' : ''}" title="${collectedByMe || isCollectedCopy ? '담김' : '담기'}" aria-label="${collectedByMe || isCollectedCopy ? '담김' : '담기'}"><i class="${collectedByMe || isCollectedCopy ? 'fa-solid' : 'fa-regular'} fa-bookmark" aria-hidden="true"></i></span>` : '',
                isMoyoPublic ? `<span class="photo-list-state is-moyo is-active" title="MOYO 공개" aria-label="MOYO 공개"><img src="${escapeHtml((root.dataset.context || document.body.dataset.contextPath || '') + '/brand/moyo_mark.png?v=moyo-mark-v34')}" alt="" aria-hidden="true"></span>` : ''
            ].filter(Boolean).join('');

            if (view === 'list' && typeof renderListRow === 'function') {
                return renderListRow({
                    kind: 'file',
                    id: item.id,
                    draggable: !trashMode,
                    classes: 'file-item--photo photo-grid-card',
                    ariaLabel: [author, createdAt].filter(Boolean).join(' · ') || '사진',
                    preview: `<span class="file-item__icon file-item__photo-preview">${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : '<span class="photo-grid-card__empty" aria-hidden="true"><i class="fa-regular fa-image"></i></span>'}</span>`,
                    name: `<div class="file-item__name photo-list-name" title="${escapeHtml(item.name)}"><span class="photo-list-name__title-row"><strong>${escapeHtml(item.name) || '제목 없음'}</strong>${isMoyoPublic ? `<span class="photo-list-name__moyo" title="MOYO 공개" aria-label="MOYO 공개"><img src="${escapeHtml((root.dataset.context || document.body.dataset.contextPath || '') + '/brand/moyo_mark.png?v=moyo-mark-v34')}" alt="" aria-hidden="true"></span>` : ''}</span><span class="photo-list-name__sub"><i class="fa-regular fa-image" aria-hidden="true"></i>${photoCount}장</span></div>`,
                    uploader: `<div class="file-item__uploader photo-list-uploader">${uploaderMarkup(uploaderRow)}</div>`,
                    date: `<span class="file-item__date photo-list-date">${escapeHtml(createdAt)}</span>`,
                    specific: `<span class="file-item__size photo-list-summary photo-list-reactions"><button type="button" class="photo-list-reaction photo-list-like${likedByMe ? ' is-liked' : ''}" data-photo-explorer-like="${item.id}" aria-pressed="${likedByMe ? 'true' : 'false'}" title="${likedByMe ? '좋아요 취소' : '좋아요'}"><i class="${likedByMe ? 'fa-solid' : 'fa-regular'} fa-heart" aria-hidden="true"></i><span data-photo-explorer-like-count>${likeCount}</span></button><span class="photo-list-reaction"><i class="fa-regular fa-comment" aria-hidden="true"></i>${commentCount}</span></span>`,
                    status: `<span class="file-item__status photo-list-states">${listStateMarkup}</span>`,
                    download: '<button class="file-item__download" type="button" data-download="1" aria-label="사진 다운로드" title="다운로드"><i class="fa-solid fa-download" aria-hidden="true"></i></button>'
                });
            }

            const explorerPhotos = Array.isArray(raw.__explorerPhotos)
                ? raw.__explorerPhotos.filter(Boolean).slice(0, 4)
                : [];
            if (!explorerPhotos.length && cover) explorerPhotos.push(cover);

            const mosaicCount = Math.max(1, Math.min(explorerPhotos.length, 4));
            const photoMarkup = explorerPhotos.length
                ? `<div class="photo-grid-card__mosaic is-count-${mosaicCount}">${explorerPhotos.map((path, index) => `<span class="photo-grid-card__tile is-tile-${index + 1}"><img src="${escapeHtml(path)}" alt="" loading="lazy"></span>`).join('')}</div>`
                : '<span class="photo-grid-card__empty" aria-hidden="true"><i class="fa-regular fa-image"></i></span>';

            return `<article class="file-item explorer-list-row file-item--photo photo-grid-card" data-kind="file" data-id="${item.id}" tabindex="0" aria-selected="false" aria-label="${escapeHtml([author, createdAt].filter(Boolean).join(' · ') || '사진')}" draggable="${!trashMode}">
                <div class="file-item__icon explorer-list-slot explorer-list-slot--preview file-item__photo-preview photo-grid-card__media">
                    ${photoMarkup}
                    ${photoCount > 1 ? `<span class="photo-grid-card__count"><i class="fa-regular fa-images" aria-hidden="true"></i>${photoCount}</span>` : ''}
                    <div class="photo-grid-card__overlay">
                        <div class="photo-grid-card__copy">
                            <div class="photo-grid-card__author-row">
                                <span>${escapeHtml(author)}</span>
                            </div>
                            <time>${escapeHtml(createdAt)}</time>
                        </div>
                        <div class="photo-grid-card__status">
                            <button type="button" class="photo-grid-card__reaction photo-grid-card__like${likedByMe ? ' is-liked' : ''}" data-photo-explorer-like="${item.id}" aria-pressed="${likedByMe ? 'true' : 'false'}" title="${likedByMe ? '좋아요 취소' : '좋아요'}">
                                <i class="${likedByMe ? 'fa-solid' : 'fa-regular'} fa-heart" aria-hidden="true"></i><span data-photo-explorer-like-count>${likeCount}</span>
                            </button>
                            <button type="button" class="photo-grid-card__reaction photo-grid-card__comment" data-photo-explorer-comment="${item.id}" title="댓글 보기">
                                <i class="fa-regular fa-comment" aria-hidden="true"></i><span data-photo-explorer-comment-count>${commentCount}</span>
                            </button>
                            ${isPersonal && isOwner ? `<span class="is-personal photo-grid-card__shared${isShared ? ' is-active' : ''}" data-explorer-share-open data-content-id="${item.id}" role="button" tabindex="0" title="공유" aria-label="공유"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></span>` : ''}
                            ${isMoyoPublic && !isOwner ? `<span class="is-personal photo-grid-card__collect${collectedByMe || isCollectedCopy ? ' is-active' : ''}" title="${collectedByMe || isCollectedCopy ? '담김' : '담기'}" aria-label="${collectedByMe || isCollectedCopy ? '담김' : '담기'}"><i class="${collectedByMe || isCollectedCopy ? 'fa-solid' : 'fa-regular'} fa-bookmark" aria-hidden="true"></i></span>` : ''}
                            ${collectedSourceMarkup}
                            ${isMoyoPublic ? `<span class="is-personal is-moyo" title="MOYO 공개" aria-label="MOYO 공개"><img src="${escapeHtml((root.dataset.context || document.body.dataset.contextPath || '') + '/brand/moyo_mark.png?v=moyo-mark-v34')}" alt="" aria-hidden="true"></span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="file-item__name explorer-list-slot explorer-list-slot--name photo-list-name" title="${escapeHtml(item.name)}">
                    <span class="photo-list-name__title-row">
                        <strong>${escapeHtml(item.name) || '제목 없음'}</strong>
                        ${isMoyoPublic ? `<span class="photo-list-name__moyo" title="MOYO 공개" aria-label="MOYO 공개"><img src="${escapeHtml((root.dataset.context || document.body.dataset.contextPath || '') + '/brand/moyo_mark.png?v=moyo-mark-v34')}" alt="" aria-hidden="true"></span>` : ''}
                    </span>
                    <span class="photo-list-name__sub"><i class="fa-regular fa-images" aria-hidden="true"></i>${photoCount}장</span>
                </div>
                <div class="file-item__uploader explorer-list-slot explorer-list-slot--uploader photo-list-uploader">${uploaderMarkup(uploaderRow)}</div>
                <span class="file-item__date explorer-list-slot explorer-list-slot--date photo-list-date">${escapeHtml(createdAt)}</span>
                <span class="file-item__size explorer-list-slot explorer-list-slot--specific photo-list-summary photo-list-reactions">
                    <button type="button" class="photo-list-reaction photo-grid-card__like${likedByMe ? ' is-liked' : ''}" data-photo-explorer-like="${item.id}" aria-pressed="${likedByMe ? 'true' : 'false'}" title="${likedByMe ? '좋아요 취소' : '좋아요'}"><i class="${likedByMe ? 'fa-solid' : 'fa-regular'} fa-heart" aria-hidden="true"></i><span data-photo-explorer-like-count>${likeCount}</span></button>
                    <button type="button" class="photo-list-reaction" data-photo-explorer-comment="${item.id}" title="댓글 보기"><i class="fa-regular fa-comment" aria-hidden="true"></i><span data-photo-explorer-comment-count>${commentCount}</span></button>
                </span>
                <span class="file-item__status explorer-list-slot explorer-list-slot--status photo-list-states">${listStateMarkup}</span>
                <button class="file-item__download explorer-list-slot explorer-list-slot--download" type="button" data-download="1" aria-label="사진 다운로드" title="다운로드"><i class="fa-solid fa-download" aria-hidden="true"></i></button>
                <div class="file-item__actions explorer-list-slot explorer-list-slot--menu"><button class="file-item__menu" type="button" data-more="1" aria-label="더보기"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button></div>
            </article>`;
        },
        afterRender({ grid, view }) {
            if (!grid) return;

            // 사진 수정/상세 URL에서 돌아온 경우 해당 게시물 VIEWER를 한 번만 자동 재오픈한다.
            if (!root.__photoPostDeepLinkHandled) {
                root.__photoPostDeepLinkHandled = true;
                const deepLinkPostId = Number(new URLSearchParams(window.location.search).get('postId') || 0);
                if (deepLinkPostId) {
                    requestAnimationFrame(() => {
                        try {
                            Promise.resolve(openPhotoDetail(deepLinkPostId, false)).catch(error => console.warn('사진 상세 자동 열기 실패', error));
                        } catch (error) {
                            console.warn('사진 상세 자동 열기 실패', error);
                        }
                    });
                }
            }

            grid.querySelector(':scope > .photo-list-header')?.remove();

            if (!grid.__photoExplorerReactionBound) {
                grid.__photoExplorerReactionBound = true;

                grid.addEventListener('click', event => {
                    const likeButton = event.target.closest('[data-photo-explorer-like]');
                    if (likeButton && grid.contains(likeButton)) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (likeButton.disabled) return;
                        const postId = Number(likeButton.dataset.photoExplorerLike);
                        const detail = window.MoyoPhotoPostDetail;
                        if (!postId || !detail || typeof detail.toggleLike !== 'function') return;
                        likeButton.disabled = true;
                        Promise.resolve(detail.toggleLike(postId)).finally(() => { likeButton.disabled = false; });
                        return;
                    }

                    const commentButton = event.target.closest('[data-photo-explorer-comment]');
                    if (commentButton && grid.contains(commentButton)) {
                        event.preventDefault();
                        event.stopPropagation();
                        openPhotoDetail(commentButton.dataset.photoExplorerComment, true);
                    }
                }, true);

                document.addEventListener('moyo:photo-post-updated', event => {
                    const detail = event.detail || {};
                    const postId = Number(detail.postId || 0);
                    if (!postId) return;
                    const card = grid.querySelector(`.photo-grid-card[data-id="${postId}"]`);
                    if (!card) return;

                    const likeButtons = Array.from(card.querySelectorAll('[data-photo-explorer-like]'));
                    if (likeButtons.length && detail.liked !== undefined) {
                        const liked = !!detail.liked;
                        document.dispatchEvent(new CustomEvent('moyo:explorer-collection-state-changed', {
                            detail: { contentType: 'PHOTO', id: postId, liked }
                        }));
                        likeButtons.forEach(likeButton => {
                            likeButton.classList.toggle('is-liked', liked);
                            likeButton.setAttribute('aria-pressed', liked ? 'true' : 'false');
                            likeButton.title = liked ? '좋아요 취소' : '좋아요';
                            const icon = likeButton.querySelector('i');
                            if (icon) icon.className = `${liked ? 'fa-solid' : 'fa-regular'} fa-heart`;
                        });
                    }
                    if (likeButtons.length && detail.likeCount !== undefined) {
                        likeButtons.forEach(likeButton => {
                            const count = likeButton.querySelector('[data-photo-explorer-like-count]');
                            if (count) count.textContent = String(Number(detail.likeCount || 0));
                        });
                    }
                    if (detail.commentCount !== undefined) {
                        card.querySelectorAll('[data-photo-explorer-comment-count]').forEach(count => {
                            count.textContent = String(Number(detail.commentCount || 0));
                        });
                    }
                });
            }

            const syncPhotoGridRows = () => {
                const isList = view === 'list' || grid.classList.contains('is-list');
                grid.classList.toggle('photo-browser-grid', !isList);

                if (isList) {
                    grid.style.removeProperty('grid-auto-rows');
                    grid.querySelectorAll(':scope > .photo-grid-card, :scope > .photo-album-card').forEach(card => {
                        card.style.removeProperty('height');
                        card.style.removeProperty('min-height');
                        card.style.removeProperty('max-height');
                    });
                    return;
                }

                const firstCard = grid.querySelector(':scope > .photo-grid-card, :scope > .photo-album-card');
                if (!firstCard) {
                    grid.style.removeProperty('grid-auto-rows');
                    return;
                }

                const cardWidth = Math.round(firstCard.getBoundingClientRect().width);
                if (!cardWidth) return;

                grid.style.setProperty('grid-auto-rows', `${cardWidth}px`, 'important');
                grid.querySelectorAll(':scope > .photo-grid-card, :scope > .photo-album-card').forEach(card => {
                    card.style.setProperty('height', `${cardWidth}px`, 'important');
                    card.style.setProperty('min-height', `${cardWidth}px`, 'important');
                    card.style.setProperty('max-height', `${cardWidth}px`, 'important');
                });
            };

            cancelAnimationFrame(grid.__photoGridFrame || 0);
            grid.__photoGridFrame = requestAnimationFrame(syncPhotoGridRows);

            if (!grid.__photoGridResizeObserver && 'ResizeObserver' in window) {
                grid.__photoGridResizeObserver = new ResizeObserver(() => {
                    cancelAnimationFrame(grid.__photoGridFrame || 0);
                    grid.__photoGridFrame = requestAnimationFrame(syncPhotoGridRows);
                });
                grid.__photoGridResizeObserver.observe(grid);
            }
        },
        async createContainer({ api, name, scope, parentContainerId }) {
            await api('/api/photo-albums', { method: 'POST', body: JSON.stringify({ ...photoScope(scope), parentAlbumId: parentContainerId, albumName: name, albumDescription: '' }) });
        },
        async renameSelected({ api, selected, name }) {
            if (selected.kind === 'folder') {
                await api(`/api/photo-albums/${selected.id}`, { method: 'PUT', body: JSON.stringify({ albumName: name, albumDescription: value(selected.data, 'albumDescription', 'ALBUM_DESCRIPTION') || '' }) });
            } else {
                await api(`/api/photo-posts/${selected.id}`, { method: 'PUT', body: JSON.stringify({ albumId: number(value(selected.data, 'albumId', 'ALBUM_ID')), title: '', description: name }) });
            }
        },
        async moveSelection({ api, selected, targetContainerId }) {
            await each(selected.folderIds || [], id => api(`/api/photo-albums/${id}/parent`, { method: 'PUT', body: JSON.stringify({ parentAlbumId: targetContainerId == null ? null : Number(targetContainerId) }) }));
            await each(selected.fileIds || [], id => api(`/api/photo-posts/${id}/album`, { method: 'PUT', body: JSON.stringify({ albumId: targetContainerId == null ? null : Number(targetContainerId) }) }));
        },
        async downloadItem({ id, api, contextPath }) {
            await downloadPhotoPost({ id, api, contextPath });
        },
        async batchAction({ action, payload, api }) {
            const postIds = payload.fileIds || [];
            const albumIds = payload.folderIds || [];
            if (action === 'trash') {
                await each(postIds, id => api(`/api/photo-posts/${id}`, { method: 'DELETE' }));
                await each(albumIds, id => api(`/api/photo-albums/${id}`, { method: 'DELETE' }));
                return;
            }
            if (action === 'restore') {
                await each(postIds, id => api(`/api/photo-posts/${id}/restore`, { method: 'POST' }));
                return;
            }
            if (action === 'permanent') {
                await each(postIds, id => api(`/api/photo-posts/${id}/permanent`, { method: 'DELETE' }));
                return;
            }
            if (action === 'download') {
                await each(postIds, id => downloadPhotoPost({ id, api, contextPath: root.dataset.context || document.body.dataset.contextPath || '' }));
                return;
            }
        },
        openUpload({ containerId, scope, contextPath }) {
            const params = { ...photoScope(scope) };
            if (containerId != null) params.albumId = containerId;
            window.location.href = contextPath + '/photo-post/write?' + encode(params);
        },
        supportsExternalDrop: true,
        async uploadItems({ files, containerId, scope, api }) {
            const images = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
            if (!images.length) throw new Error('이미지 파일만 업로드할 수 있습니다.');
            if (images.length > 10) throw new Error('사진은 한 번에 최대 10장까지 업로드할 수 있습니다.');

            const scoped = photoScope(scope);
            if (!scoped.scopeType || scoped.scopeId == null) throw new Error('사진 업로드 범위를 확인할 수 없습니다.');

            const formData = new FormData();
            formData.append('scopeType', scoped.scopeType);
            formData.append('scopeId', String(scoped.scopeId));
            if (containerId != null) formData.append('albumId', String(containerId));
            formData.append('title', '');
            formData.append('description', '');
            formData.append('visibilityType', 'PRIVATE');
            images.forEach(file => formData.append('files', file));

            await api('/api/photo-posts', { method: 'POST', body: formData });
        },
        openItem({ id }) {
            return openPhotoDetail(id, false);
        }
    };
})();
