(function () {
    'use strict';
    const page = document.querySelector('.photo-page');
    if (!page) return;

    const scopeType = String(page.dataset.scopeType || '').toUpperCase();
    const scopeId = Number(page.dataset.scopeId);
    const currentUserId = Number(page.dataset.currentUserId);
    const isAdmin = page.dataset.admin === 'true';
    const state = { posts: [], albums: [], album: null, albumPosts: [], activePost: null, photos: [], photoIndex: 0, editingAlbum: false, selectedAlbumId: null, selectedFiles: [], previewUrls: [], moveAlbumId: null, editingMoveAlbumId: null };
    const $ = id => document.getElementById(id);
    const el = {
        postsView: $('postsView'), albumsView: $('albumsView'), albumDetailView: $('albumDetailView'), postGrid: $('postGrid'), albumGrid: $('albumGrid'), albumPostGrid: $('albumPostGrid'),
        postCountText: $('postCountText'), albumCountText: $('albumCountText'), postSearchInput: $('postSearchInput'), albumSearchInput: $('albumSearchInput'),
        openPostModalButton: $('openPostModalButton'), openAlbumModalButton: $('openAlbumModalButton'), postModal: $('postModal'), albumModal: $('albumModal'),
        postFilesInput: $('postFilesInput'), photoDropZone: $('photoDropZone'), selectedFileCount: $('selectedFileCount'), clearSelectedFilesButton: $('clearSelectedFilesButton'), postPreview: $('postPreview'), postTitleInput: $('postTitleInput'), postDescriptionInput: $('postDescriptionInput'), postAlbumSelect: $('postAlbumSelect'), savePostButton: $('savePostButton'),
        albumModalTitle: $('albumModalTitle'), albumNameInput: $('albumNameInput'), albumDescriptionInput: $('albumDescriptionInput'), saveAlbumButton: $('saveAlbumButton'), deleteAlbumButton: $('deleteAlbumButton'),
        backToAlbumsButton: $('backToAlbumsButton'), detailAlbumName: $('detailAlbumName'), detailAlbumDescription: $('detailAlbumDescription'), detailAlbumMeta: $('detailAlbumMeta'), editAlbumButton: $('editAlbumButton'), shareToAlbumButton: $('shareToAlbumButton'),
        lightbox: $('postLightbox'), lightboxImage: $('lightboxImage'), lightboxTitle: $('lightboxTitle'), lightboxDescription: $('lightboxDescription'), lightboxMeta: $('lightboxMeta'), lightboxPrevButton: $('lightboxPrevButton'), lightboxNextButton: $('lightboxNextButton'), closeLightboxButton: $('closeLightboxButton'), deletePostButton: $('deletePostButton'), editPostButton: $('editPostButton'), movePostButton: $('movePostButton'), likePostButton: $('likePostButton'), lightboxLikeCount: $('lightboxLikeCount'), editPostModal: $('editPostModal'), editPostTitleInput: $('editPostTitleInput'), editPostDescriptionInput: $('editPostDescriptionInput'), editPostDescriptionCount: $('editPostDescriptionCount'), saveEditPostButton: $('saveEditPostButton'), moveAlbumModal: $('moveAlbumModal'), moveAlbumList: $('moveAlbumList'), confirmMoveAlbumButton: $('confirmMoveAlbumButton'), openMoveAlbumCreateButton: $('openMoveAlbumCreateButton'), moveAlbumCreatePanel: $('moveAlbumCreatePanel'), moveNewAlbumName: $('moveNewAlbumName'), cancelMoveAlbumCreateButton: $('cancelMoveAlbumCreateButton'), createMoveAlbumButton: $('createMoveAlbumButton'), moveAlbumEditPanel: $('moveAlbumEditPanel'), moveEditAlbumName: $('moveEditAlbumName'), cancelMoveAlbumEditButton: $('cancelMoveAlbumEditButton'), saveMoveAlbumEditButton: $('saveMoveAlbumEditButton'), toast: $('photoToast')
    };

    function pick(obj, ...keys) { for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key]; return null; }
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
    async function request(url, options) { const r = await fetch(url, options); const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.message || body.error || '요청을 처리하지 못했습니다.'); return body; }
    let toastTimer;
    function toast(message, error) { clearTimeout(toastTimer); el.toast.textContent = message; el.toast.classList.toggle('error', !!error); el.toast.classList.add('show'); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2500); }
    function openModal(modal) { modal.hidden = false; document.body.style.overflow = 'hidden'; }
    function closeModal(modal) { modal.hidden = true; const modalOpen = Array.from(document.querySelectorAll('.photo-modal-backdrop')).some(item => !item.hidden); const lightboxOpen = el.lightbox && !el.lightbox.hidden; document.body.style.overflow = modalOpen || lightboxOpen ? 'hidden' : ''; }

    async function loadAll() {
        try {
            [state.posts, state.albums] = await Promise.all([
                request(`/api/photo-posts?scopeType=${encodeURIComponent(scopeType)}&scopeId=${scopeId}`),
                request(`/api/photo-albums?scopeType=${encodeURIComponent(scopeType)}&scopeId=${scopeId}`)
            ]);
            renderPosts(state.posts, el.postGrid); renderAlbums(); fillAlbumSelect();
        } catch (e) { toast(e.message, true); }
    }

    function parseCreatedDate(value) {
        if (!value) return null;
        const normalized = String(value).trim().replace(/\./g, '-').replace(' ', 'T');
        const date = new Date(normalized);
        if (!Number.isNaN(date.getTime())) return date;
        const match = String(value).match(/(\d{4})[-./](\d{1,2})/);
        return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : null;
    }

    function monthGroup(post) {
        const raw = pick(post, 'createdAt', 'CREATED_AT');
        const date = parseCreatedDate(raw);
        if (!date) return { key: 'unknown', label: '날짜 미상' };
        return {
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`
        };
    }

    function postCardMarkup(post) {
        const id = Number(pick(post, 'postId', 'POST_ID'));
        const cover = pick(post, 'coverPath', 'COVER_PATH');
        const count = Number(pick(post, 'photoCount', 'PHOTO_COUNT') || 0);
        const title = pick(post, 'title', 'TITLE');
        const desc = pick(post, 'description', 'DESCRIPTION');
        const album = pick(post, 'albumName', 'ALBUM_NAME');
        const creator = pick(post, 'creatorName', 'CREATOR_NAME') || '';
        const created = pick(post, 'createdAt', 'CREATED_AT') || '';
        const displayTitle = title || (desc ? desc.slice(0, 30) : '사진 공유');
        const liked = Number(pick(post, 'likedByMe', 'LIKED_BY_ME') || 0) === 1;
        const likeCount = Number(pick(post, 'likeCount', 'LIKE_COUNT') || 0);
        return `<article class="post-card" data-post-id="${id}" tabindex="0">
            <div class="post-cover"><img src="${esc(cover)}" alt="${esc(displayTitle)}" loading="lazy">${count > 1 ? `<span class="post-count"><i class="fa-regular fa-images"></i> ${count}</span>` : ''}</div>
            <div class="post-card-body">${album ? `<span class="post-album"><i class="fa-regular fa-folder"></i> ${esc(album)}</span>` : '<span class="post-album unfiled">앨범 없음</span>'}<h3>${esc(displayTitle)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}<div class="post-card-footer"><span class="post-meta">${esc(creator)} · ${esc(created)}</span><button type="button" class="post-like-button${liked ? ' liked' : ''}" data-like-post-id="${id}" aria-pressed="${liked}"><i class="${liked ? 'fa-solid' : 'fa-regular'} fa-heart"></i><span>${likeCount}</span></button></div></div>
        </article>`;
    }

    function renderPosts(posts, target, isSearch) {
        const list = Array.isArray(posts) ? posts : [];
        if (target === el.postGrid) el.postCountText.textContent = `사진 공유 ${list.length}개`;
        if (!list.length) {
            target.innerHTML = isSearch
                ? '<div class="photo-empty photo-search-empty"><i class="fa-solid fa-magnifying-glass"></i><h3>검색 결과가 없습니다.</h3><p>다른 제목이나 설명으로 다시 검색해보세요.</p></div>'
                : '<div class="photo-empty"><i class="fa-regular fa-images"></i><h3>아직 공유된 사진이 없습니다.</h3><p>앨범을 만들지 않아도 바로 여러 장을 공유할 수 있습니다.</p><button class="photo-primary-button" data-action="open-post">첫 사진 공유</button></div>';
            return;
        }

        const grouped = new Map();
        list.forEach(post => {
            const group = monthGroup(post);
            if (!grouped.has(group.key)) grouped.set(group.key, { label: group.label, posts: [] });
            grouped.get(group.key).posts.push(post);
        });

        target.innerHTML = Array.from(grouped.values()).map(group => `
            <section class="photo-month-group">
                <div class="photo-month-heading"><h3>${esc(group.label)}</h3><span>${group.posts.length}개 공유</span></div>
                <div class="photo-month-grid">${group.posts.map(postCardMarkup).join('')}</div>
            </section>
        `).join('');
    }

    function renderAlbums() {
        const q = (el.albumSearchInput.value || '').trim().toLowerCase();
        const list = state.albums.filter(a => String(pick(a, 'albumName', 'ALBUM_NAME') || '').toLowerCase().includes(q));
        el.albumCountText.textContent = `앨범 ${list.length}개`;
        if (!list.length) {
            el.albumGrid.innerHTML = '<div class="photo-empty"><i class="fa-regular fa-folder-open"></i><h3>아직 앨범이 없습니다.</h3><p>워크숍이나 프로젝트처럼 계속 모아볼 사진만 앨범으로 정리하세요.</p><button class="photo-secondary-button" data-action="open-album">새 앨범</button></div>';
            return;
        }
        el.albumGrid.innerHTML = list.map(a => {
            const id = Number(pick(a, 'albumId', 'ALBUM_ID'));
            const cover = pick(a, 'coverPath', 'COVER_PATH');
            const count = Number(pick(a, 'photoCount', 'PHOTO_COUNT') || 0);
            return `<article class="album-card" data-album-id="${id}" tabindex="0"><div class="album-cover">${cover ? `<img src="${esc(cover)}" alt="">` : '<i class="fa-regular fa-images"></i>'}</div><div><h3>${esc(pick(a,'albumName','ALBUM_NAME'))}</h3><p>${count}장 · ${Number(pick(a,'postCount','POST_COUNT') || 0)}개 공유</p></div></article>`;
        }).join('');
    }

    function fillAlbumSelect() {
        el.postAlbumSelect.innerHTML = '<option value="">앨범 없이 공유</option>' + state.albums.map(a => `<option value="${Number(pick(a,'albumId','ALBUM_ID'))}">${esc(pick(a,'albumName','ALBUM_NAME'))}</option>`).join('');
    }

    function switchView(name) {
        document.querySelectorAll('.photo-view-tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
        el.postsView.hidden = name !== 'posts'; el.albumsView.hidden = name !== 'albums'; el.albumDetailView.hidden = true;
    }

    function resetSelectedFiles() {
        state.previewUrls.forEach(url => URL.revokeObjectURL(url));
        state.previewUrls = [];
        state.selectedFiles = [];
        el.postFilesInput.value = '';
        renderSelectedFiles();
    }

    function showPostModal(albumId) {
        state.selectedAlbumId = albumId || null;
        resetSelectedFiles();
        el.postTitleInput.value = '';
        el.postDescriptionInput.value = '';
        el.postAlbumSelect.value = albumId ? String(albumId) : '';
        openModal(el.postModal);
    }

    function fileKey(file) {
        return [file.name, file.size, file.lastModified].join(':');
    }

    function addSelectedFiles(files) {
        const imageFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
        if (!imageFiles.length) {
            toast('이미지 파일만 올릴 수 있습니다.', true);
            return;
        }
        const existing = new Set(state.selectedFiles.map(fileKey));
        imageFiles.forEach(file => {
            const key = fileKey(file);
            if (!existing.has(key)) {
                state.selectedFiles.push(file);
                existing.add(key);
            }
        });
        renderSelectedFiles();
    }

    function renderSelectedFiles() {
        state.previewUrls.forEach(url => URL.revokeObjectURL(url));
        state.previewUrls = [];
        const count = state.selectedFiles.length;
        el.selectedFileCount.textContent = count ? `사진 ${count}장 선택됨` : '선택된 사진 없음';
        el.clearSelectedFilesButton.hidden = count === 0;
        el.photoDropZone.classList.toggle('has-files', count > 0);
        el.postPreview.innerHTML = state.selectedFiles.map((file, index) => {
            const url = URL.createObjectURL(file);
            state.previewUrls.push(url);
            return `<div class="preview-item"><img src="${url}" alt="선택한 사진 ${index + 1}"><button type="button" class="preview-remove" data-remove-file="${index}" aria-label="사진 제거"><i class="fa-solid fa-xmark"></i></button></div>`;
        }).join('');
    }

    async function savePost() {
        if (!state.selectedFiles.length) return toast('공유할 사진을 선택해주세요.', true);
        const fd = new FormData(); fd.append('scopeType', scopeType); fd.append('scopeId', scopeId); fd.append('title', el.postTitleInput.value.trim()); fd.append('description', el.postDescriptionInput.value.trim());
        if (el.postAlbumSelect.value) fd.append('albumId', el.postAlbumSelect.value);
        state.selectedFiles.forEach(f => fd.append('files', f));
        el.savePostButton.disabled = true;
        try { await request('/api/photo-posts', { method: 'POST', body: fd }); closeModal(el.postModal); toast('사진을 공유했습니다.'); await loadAll(); switchView(state.selectedAlbumId ? 'albums' : 'posts'); if (state.selectedAlbumId) await openAlbum(state.selectedAlbumId); }
        catch (e) { toast(e.message, true); } finally { el.savePostButton.disabled = false; }
    }

    function showAlbumModal(editing) {
        state.editingAlbum = editing; el.albumModalTitle.textContent = editing ? '앨범 수정' : '새 앨범'; el.albumNameInput.value = editing ? pick(state.album,'albumName','ALBUM_NAME') || '' : ''; el.albumDescriptionInput.value = editing ? pick(state.album,'albumDescription','ALBUM_DESCRIPTION') || '' : ''; el.deleteAlbumButton.hidden = !editing; openModal(el.albumModal);
    }
    async function saveAlbum() {
        const name = el.albumNameInput.value.trim(); if (!name) return toast('앨범 이름을 입력해주세요.', true);
        const payload = { scopeType, scopeId, albumName: name, albumDescription: el.albumDescriptionInput.value.trim() };
        try { if (state.editingAlbum) await request(`/api/photo-albums/${pick(state.album,'albumId','ALBUM_ID')}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); else await request('/api/photo-albums',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); closeModal(el.albumModal); toast(state.editingAlbum ? '앨범을 수정했습니다.' : '앨범을 만들었습니다.'); await loadAll(); if (state.editingAlbum) await openAlbum(pick(state.album,'albumId','ALBUM_ID')); }
        catch(e){ toast(e.message,true); }
    }
    async function deleteAlbum() {
        if (!confirm('앨범만 삭제할까요? 앨범 안의 사진 공유는 삭제되지 않고 최근 공유에 남습니다.')) return;
        try { await request(`/api/photo-albums/${pick(state.album,'albumId','ALBUM_ID')}`,{method:'DELETE'}); closeModal(el.albumModal); toast('앨범을 삭제했습니다. 사진은 그대로 유지됩니다.'); await loadAll(); switchView('albums'); }
        catch(e){ toast(e.message,true); }
    }
    async function openAlbum(id) {
        try { const data = await request(`/api/photo-albums/${id}`); state.album = data.album; state.albumPosts = data.posts || []; el.postsView.hidden = true; el.albumsView.hidden = true; el.albumDetailView.hidden = false; el.detailAlbumName.textContent = pick(state.album,'albumName','ALBUM_NAME') || '앨범'; el.detailAlbumDescription.textContent = pick(state.album,'albumDescription','ALBUM_DESCRIPTION') || '앨범 설명이 없습니다.'; el.detailAlbumMeta.textContent = `${Number(pick(state.album,'photoCount','PHOTO_COUNT') || 0)}장 · ${Number(pick(state.album,'postCount','POST_COUNT') || 0)}개 공유`; renderPosts(state.albumPosts, el.albumPostGrid); }
        catch(e){ toast(e.message,true); }
    }

    async function openPost(id) {
        try { const data = await request(`/api/photo-posts/${id}`); state.activePost = data.post; state.photos = data.photos || []; state.photoIndex = 0; renderLightbox(); el.lightbox.hidden = false; document.body.style.overflow='hidden'; }
        catch(e){ toast(e.message,true); }
    }
    function renderLightbox() {
        const photo = state.photos[state.photoIndex]; if (!photo) return;
        el.lightboxImage.src = pick(photo,'filePath','FILE_PATH'); el.lightboxTitle.textContent = pick(state.activePost,'title','TITLE') || '사진 공유'; el.lightboxDescription.textContent = pick(state.activePost,'description','DESCRIPTION') || ''; const albumName = pick(state.activePost,'albumName','ALBUM_NAME'); el.lightboxMeta.textContent = `${pick(state.activePost,'creatorName','CREATOR_NAME') || ''} · ${pick(state.activePost,'createdAt','CREATED_AT') || ''}${albumName ? ` · ${albumName}` : ' · 앨범 없음'}`; el.lightboxPrevButton.hidden = state.photos.length < 2; el.lightboxNextButton.hidden = state.photos.length < 2; const liked = Number(pick(state.activePost,'likedByMe','LIKED_BY_ME') || 0) === 1; const likeCount = Number(pick(state.activePost,'likeCount','LIKE_COUNT') || 0); el.likePostButton.classList.toggle('liked', liked); el.likePostButton.setAttribute('aria-pressed', String(liked)); el.likePostButton.querySelector('i').className = `${liked ? 'fa-solid' : 'fa-regular'} fa-heart`; el.lightboxLikeCount.textContent = String(likeCount); const creatorId = Number(pick(state.activePost,'createdBy','CREATED_BY')); const canManage = isAdmin || creatorId === currentUserId; el.deletePostButton.hidden = !canManage; el.editPostButton.hidden = !canManage; el.movePostButton.hidden = !canManage;
    }
    function movePhoto(step){ state.photoIndex = (state.photoIndex + step + state.photos.length) % state.photos.length; renderLightbox(); }


    function updatePostLikeState(postId, liked, likeCount) {
        const apply = post => {
            if (Number(pick(post, 'postId', 'POST_ID')) !== Number(postId)) return;
            post.likedByMe = liked ? 1 : 0;
            post.LIKED_BY_ME = liked ? 1 : 0;
            post.likeCount = likeCount;
            post.LIKE_COUNT = likeCount;
        };
        state.posts.forEach(apply);
        state.albumPosts.forEach(apply);
        if (state.activePost) apply(state.activePost);
    }

    async function togglePostLike(postId) {
        try {
            const result = await request('/api/reactions/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentType: 'PHOTO_POST', contentId: postId, reactionType: 'LIKE' }) });
            const liked = !!result.liked;
            const likeCount = Number(result.likeCount || 0);
            updatePostLikeState(postId, liked, likeCount);
            renderPosts(state.posts, el.postGrid, !!el.postSearchInput.value.trim());
            if (state.album && !el.albumDetailView.hidden) renderPosts(state.albumPosts, el.albumPostGrid);
            if (state.activePost && Number(pick(state.activePost,'postId','POST_ID')) === Number(postId)) renderLightbox();
        } catch (e) {
            toast(e.message, true);
        }
    }

    function showEditPostModal() {
        if (!state.activePost) return;
        el.editPostTitleInput.value = pick(state.activePost, 'title', 'TITLE') || '';
        el.editPostDescriptionInput.value = pick(state.activePost, 'description', 'DESCRIPTION') || '';
        el.editPostDescriptionCount.textContent = String(el.editPostDescriptionInput.value.length);
        openModal(el.editPostModal);
        setTimeout(() => el.editPostTitleInput.focus(), 0);
    }

    async function saveEditedPost() {
        if (!state.activePost) return;
        const postId = Number(pick(state.activePost, 'postId', 'POST_ID'));
        const albumIdValue = pick(state.activePost, 'albumId', 'ALBUM_ID');
        const albumId = albumIdValue == null || albumIdValue === '' ? null : Number(albumIdValue);
        el.saveEditPostButton.disabled = true;
        try {
            await request(`/api/photo-posts/${postId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    albumId,
                    title: el.editPostTitleInput.value.trim(),
                    description: el.editPostDescriptionInput.value.trim()
                })
            });
            const data = await request(`/api/photo-posts/${postId}`);
            state.activePost = data.post;
            state.photos = data.photos || state.photos;
            renderLightbox();
            closeModal(el.editPostModal);
            toast('게시물 내용을 수정했습니다.');
            const openedAlbumId = state.album ? Number(pick(state.album, 'albumId', 'ALBUM_ID')) : null;
            await loadAll();
            if (openedAlbumId && !el.albumDetailView.hidden) await openAlbum(openedAlbumId);
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.saveEditPostButton.disabled = false;
        }
    }

    function renderMoveAlbumOptions(selectedAlbumId) {
        const options = [{ id: null, name: '앨범 없음', description: '최근 공유에만 표시됩니다.' }].concat(
            state.albums.map(album => ({
                id: Number(pick(album, 'albumId', 'ALBUM_ID')),
                name: pick(album, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범',
                albumDescription: pick(album, 'albumDescription', 'ALBUM_DESCRIPTION') || '',
                createdBy: Number(pick(album, 'createdBy', 'CREATED_BY')),
                description: `${Number(pick(album, 'photoCount', 'PHOTO_COUNT') || 0)}장 · ${Number(pick(album, 'postCount', 'POST_COUNT') || 0)}개 공유`
            }))
        );
        el.moveAlbumList.innerHTML = options.map(option => {
            const checked = option.id === selectedAlbumId;
            const value = option.id == null ? '' : String(option.id);
            const canEditAlbum = option.id != null && (isAdmin || option.createdBy === currentUserId);
            const editing = option.id != null && Number(state.editingMoveAlbumId) === Number(option.id);
            const titleContent = editing
                ? `<span class="move-album-inline-edit"><input type="text" class="move-album-inline-input" data-inline-album-name value="${esc(option.name)}" maxlength="100" aria-label="앨범 이름"><button type="button" class="move-album-inline-save" data-save-inline-album="${option.id}">저장</button><button type="button" class="move-album-inline-cancel" data-cancel-inline-album>취소</button></span>`
                : `<span class="move-album-title-row"><strong>${esc(option.name)}</strong>${canEditAlbum ? `<button type="button" class="move-album-edit-button" data-edit-album-id="${option.id}" aria-label="${esc(option.name)} 이름 수정"><i class="fa-regular fa-pen-to-square"></i></button>` : ''}</span>`;
            return `<div class="move-album-option${checked ? ' selected' : ''}${canEditAlbum ? ' has-edit-button' : ''}${editing ? ' is-editing' : ''}" data-album-option><input type="radio" name="moveAlbum" value="${value}" ${checked ? 'checked' : ''}><span class="move-album-icon"><i class="${option.id == null ? 'fa-regular fa-folder-open' : 'fa-solid fa-folder'}"></i></span><span class="move-album-text">${titleContent}<small>${esc(option.description)}</small></span><span class="move-album-check"><i class="fa-solid fa-check"></i></span></div>`;
        }).join('');
    }

    function closeMoveAlbumCreate() {
        el.moveAlbumCreatePanel.hidden = true;
        el.moveNewAlbumName.value = '';
        el.openMoveAlbumCreateButton.hidden = false;
    }

    function closeMoveAlbumEdit() {
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        const selectedAlbumId = selected && selected.value ? Number(selected.value) : null;
        state.editingMoveAlbumId = null;
        if (el.moveAlbumEditPanel) el.moveAlbumEditPanel.hidden = true;
        if (el.moveEditAlbumName) el.moveEditAlbumName.value = '';
        renderMoveAlbumOptions(selectedAlbumId);
    }

    function showMoveAlbumEdit(albumId) {
        const album = state.albums.find(item => Number(pick(item, 'albumId', 'ALBUM_ID')) === Number(albumId));
        if (!album) return toast('앨범 정보를 찾을 수 없습니다.', true);
        const creatorId = Number(pick(album, 'createdBy', 'CREATED_BY'));
        if (!isAdmin && creatorId !== currentUserId) return toast('앨범 이름을 수정할 권한이 없습니다.', true);
        closeMoveAlbumCreate();
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        const selectedAlbumId = selected && selected.value ? Number(selected.value) : null;
        state.editingMoveAlbumId = Number(albumId);
        renderMoveAlbumOptions(selectedAlbumId);
        setTimeout(() => {
            const input = el.moveAlbumList.querySelector('[data-inline-album-name]');
            if (input) { input.focus(); input.select(); }
        }, 0);
    }

    async function saveMoveAlbumName() {
        const albumId = state.editingMoveAlbumId;
        const inlineInput = el.moveAlbumList.querySelector('[data-inline-album-name]');
        const albumName = (inlineInput ? inlineInput.value : el.moveEditAlbumName.value).trim();
        if (!albumId) return;
        if (!albumName) {
            el.moveEditAlbumName.focus();
            return toast('앨범 이름을 입력해주세요.', true);
        }
        const album = state.albums.find(item => Number(pick(item, 'albumId', 'ALBUM_ID')) === Number(albumId));
        if (!album) return toast('앨범 정보를 찾을 수 없습니다.', true);
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        const selectedAlbumId = selected && selected.value ? Number(selected.value) : null;
        el.saveMoveAlbumEditButton.disabled = true;
        try {
            await request(`/api/photo-albums/${albumId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    scopeType,
                    scopeId,
                    albumName,
                    albumDescription: pick(album, 'albumDescription', 'ALBUM_DESCRIPTION') || ''
                })
            });
            state.albums = await request(`/api/photo-albums?scopeType=${encodeURIComponent(scopeType)}&scopeId=${scopeId}`);
            renderAlbums();
            fillAlbumSelect();
            state.editingMoveAlbumId = null;
            renderMoveAlbumOptions(selectedAlbumId);
            toast('앨범 이름을 수정했습니다.');
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.saveMoveAlbumEditButton.disabled = false;
        }
    }

    function showMoveAlbumModal() {
        if (!state.activePost) return;
        const currentAlbumId = Number(pick(state.activePost, 'albumId', 'ALBUM_ID')) || null;
        state.moveAlbumId = currentAlbumId;
        closeMoveAlbumCreate();
        closeMoveAlbumEdit();
        renderMoveAlbumOptions(currentAlbumId);
        openModal(el.moveAlbumModal);
    }

    async function createAlbumFromMoveModal() {
        const albumName = el.moveNewAlbumName.value.trim();
        if (!albumName) {
            el.moveNewAlbumName.focus();
            return toast('앨범 이름을 입력해주세요.', true);
        }
        el.createMoveAlbumButton.disabled = true;
        try {
            const result = await request('/api/photo-albums', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({scopeType, scopeId, albumName, albumDescription: ''})
            });
            const newAlbumId = Number(pick(result, 'albumId', 'ALBUM_ID'));
            state.albums = await request(`/api/photo-albums?scopeType=${encodeURIComponent(scopeType)}&scopeId=${scopeId}`);
            renderAlbums();
            fillAlbumSelect();
            renderMoveAlbumOptions(newAlbumId);
            closeMoveAlbumCreate();
            toast('새 앨범을 만들고 선택했습니다.');
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.createMoveAlbumButton.disabled = false;
        }
    }

    async function movePostAlbum() {
        if (!state.activePost) return;
        const selected = el.moveAlbumList.querySelector('input[name="moveAlbum"]:checked');
        if (!selected) return toast('이동할 앨범을 선택해주세요.', true);
        const nextAlbumId = selected.value ? Number(selected.value) : null;
        const currentAlbumId = Number(pick(state.activePost, 'albumId', 'ALBUM_ID')) || null;
        if (nextAlbumId === currentAlbumId) {
            closeModal(el.moveAlbumModal);
            return toast('현재 선택된 앨범입니다.');
        }
        el.confirmMoveAlbumButton.disabled = true;
        const openedAlbumId = state.album ? Number(pick(state.album, 'albumId', 'ALBUM_ID')) : null;
        try {
            await request(`/api/photo-posts/${pick(state.activePost,'postId','POST_ID')}/album`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({albumId: nextAlbumId})
            });
            closeModal(el.moveAlbumModal);
            el.lightbox.hidden = true;
            document.body.style.overflow = '';
            toast(nextAlbumId ? '선택한 앨범으로 이동했습니다.' : '앨범에서 꺼냈습니다.');
            await loadAll();
            if (openedAlbumId && !el.albumDetailView.hidden) await openAlbum(openedAlbumId);
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.confirmMoveAlbumButton.disabled = false;
        }
    }

    async function deletePost(){ if(!confirm('이 사진 공유와 포함된 사진을 모두 삭제할까요?')) return; try{ await request(`/api/photo-posts/${pick(state.activePost,'postId','POST_ID')}`,{method:'DELETE'}); el.lightbox.hidden=true; document.body.style.overflow=''; toast('사진 공유를 삭제했습니다.'); await loadAll(); }catch(e){toast(e.message,true);} }

    document.querySelectorAll('.photo-view-tabs button').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal($(b.dataset.close))));
    el.openPostModalButton.addEventListener('click', () => showPostModal()); el.openAlbumModalButton.addEventListener('click', () => showAlbumModal(false)); el.postFilesInput.addEventListener('change', e => addSelectedFiles(e.target.files)); el.savePostButton.addEventListener('click', savePost); el.saveAlbumButton.addEventListener('click', saveAlbum); el.deleteAlbumButton.addEventListener('click', deleteAlbum); el.editAlbumButton.addEventListener('click', () => showAlbumModal(true)); el.shareToAlbumButton.addEventListener('click', () => showPostModal(pick(state.album,'albumId','ALBUM_ID'))); el.backToAlbumsButton.addEventListener('click', () => switchView('albums'));

    el.photoDropZone.addEventListener('click', () => el.postFilesInput.click());
    el.photoDropZone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.postFilesInput.click();
        }
    });
    ['dragenter', 'dragover'].forEach(type => el.photoDropZone.addEventListener(type, e => {
        e.preventDefault();
        e.stopPropagation();
        el.photoDropZone.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach(type => el.photoDropZone.addEventListener(type, e => {
        e.preventDefault();
        e.stopPropagation();
        el.photoDropZone.classList.remove('is-dragover');
    }));
    el.photoDropZone.addEventListener('drop', e => addSelectedFiles(e.dataTransfer.files));
    el.clearSelectedFilesButton.addEventListener('click', resetSelectedFiles);
    el.postPreview.addEventListener('click', e => {
        const button = e.target.closest('[data-remove-file]');
        if (!button) return;
        state.selectedFiles.splice(Number(button.dataset.removeFile), 1);
        renderSelectedFiles();
    });

    el.postSearchInput.addEventListener('input', () => { const q=el.postSearchInput.value.trim().toLowerCase(); renderPosts(state.posts.filter(p => [pick(p,'title','TITLE'),pick(p,'description','DESCRIPTION'),pick(p,'creatorName','CREATOR_NAME')].join(' ').toLowerCase().includes(q)), el.postGrid, !!q); });
    el.albumSearchInput.addEventListener('input', renderAlbums);
    [el.postGrid, el.albumPostGrid].forEach(grid => grid.addEventListener('click', e => { const likeButton=e.target.closest('[data-like-post-id]'); if(likeButton){ e.preventDefault(); e.stopPropagation(); return togglePostLike(Number(likeButton.dataset.likePostId)); } const action=e.target.closest('[data-action="open-post"]'); if(action) return showPostModal(); const card=e.target.closest('[data-post-id]'); if(card) openPost(Number(card.dataset.postId)); }));
    el.albumGrid.addEventListener('click', e => { const action=e.target.closest('[data-action="open-album"]'); if(action) return showAlbumModal(false); const card=e.target.closest('[data-album-id]'); if(card) openAlbum(Number(card.dataset.albumId)); });
    el.closeLightboxButton.addEventListener('click',()=>{el.lightbox.hidden=true;document.body.style.overflow='';}); el.lightboxPrevButton.addEventListener('click',()=>movePhoto(-1)); el.lightboxNextButton.addEventListener('click',()=>movePhoto(1)); el.movePostButton.addEventListener('click',showMoveAlbumModal); el.confirmMoveAlbumButton.addEventListener('click',movePostAlbum); el.openMoveAlbumCreateButton.addEventListener('click',()=>{closeMoveAlbumEdit();el.moveAlbumCreatePanel.hidden=false;el.openMoveAlbumCreateButton.hidden=true;setTimeout(()=>el.moveNewAlbumName.focus(),0);}); el.cancelMoveAlbumCreateButton.addEventListener('click',closeMoveAlbumCreate); el.createMoveAlbumButton.addEventListener('click',createAlbumFromMoveModal); el.cancelMoveAlbumEditButton.addEventListener('click',closeMoveAlbumEdit); el.saveMoveAlbumEditButton.addEventListener('click',saveMoveAlbumName); el.moveNewAlbumName.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();createAlbumFromMoveModal();}if(e.key==='Escape'){e.preventDefault();closeMoveAlbumCreate();}}); el.moveEditAlbumName.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveMoveAlbumName();}if(e.key==='Escape'){e.preventDefault();closeMoveAlbumEdit();}}); el.moveAlbumList.addEventListener('click', e => { const editButton = e.target.closest('[data-edit-album-id]'); if (editButton) { e.preventDefault(); e.stopPropagation(); showMoveAlbumEdit(Number(editButton.dataset.editAlbumId)); return; } const saveButton = e.target.closest('[data-save-inline-album]'); if (saveButton) { e.preventDefault(); e.stopPropagation(); saveMoveAlbumName(); return; } const cancelButton = e.target.closest('[data-cancel-inline-album]'); if (cancelButton) { e.preventDefault(); e.stopPropagation(); closeMoveAlbumEdit(); return; } if (e.target.closest('.move-album-inline-edit')) return; const option = e.target.closest('[data-album-option]'); if (!option) return; const radio = option.querySelector('input[name="moveAlbum"]'); if (!radio) return; radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }); el.moveAlbumList.addEventListener('keydown', e => { if (!e.target.matches('[data-inline-album-name]')) return; if (e.key === 'Enter') { e.preventDefault(); saveMoveAlbumName(); } else if (e.key === 'Escape') { e.preventDefault(); closeMoveAlbumEdit(); } }); el.moveAlbumList.addEventListener('change', () => { el.moveAlbumList.querySelectorAll('.move-album-option').forEach(option => option.classList.toggle('selected', option.querySelector('input').checked)); }); el.editPostButton.addEventListener('click', showEditPostModal); el.saveEditPostButton.addEventListener('click', saveEditedPost); el.editPostDescriptionInput.addEventListener('input', () => { el.editPostDescriptionCount.textContent = String(el.editPostDescriptionInput.value.length); }); el.likePostButton.addEventListener('click',()=>{ if(state.activePost) togglePostLike(Number(pick(state.activePost,'postId','POST_ID'))); }); el.deletePostButton.addEventListener('click',deletePost);
    document.addEventListener('keydown',e=>{
        if (!el.editPostModal.hidden) {
            if (e.key === 'Escape') closeModal(el.editPostModal);
            return;
        }
        if (!el.moveAlbumModal.hidden) {
            if (e.key === 'Escape') closeModal(el.moveAlbumModal);
            return;
        }
        if(!el.lightbox.hidden){
            if(e.key==='Escape')el.closeLightboxButton.click();
            if(e.key==='ArrowLeft')movePhoto(-1);
            if(e.key==='ArrowRight')movePhoto(1);
        }
    });
    const initialPostId = Number(new URLSearchParams(location.search).get('postId'));
    const initialAlbumId = Number(new URLSearchParams(location.search).get('albumId'));
    loadAll().then(function () { if (initialPostId) openPost(initialPostId); else if (initialAlbumId) openAlbum(initialAlbumId); });
})();
