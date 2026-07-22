(function () {
    'use strict';

    const shell = document.querySelector('.profile-shell');
    if (!shell) return;

    const contextPath = shell.dataset.contextPath || '';
    const modal = document.getElementById('profilePhotoDetailModal');
    if (!modal) return;

    const nodes = {
        image: modal.querySelector('[data-profile-photo-image]'),
        title: modal.querySelector('[data-profile-photo-title]'),
        meta: modal.querySelector('[data-profile-photo-meta]'),
        desc: modal.querySelector('[data-profile-photo-desc]'),
        like: modal.querySelector('[data-profile-photo-like]'),
        comment: modal.querySelector('[data-profile-photo-comment]'),
        comments: modal.querySelector('[data-profile-photo-comments]'),
        count: modal.querySelector('[data-profile-photo-count]'),
        prev: modal.querySelector('[data-profile-photo-prev]'),
        next: modal.querySelector('[data-profile-photo-next]')
    };

    let activePost = null;
    let activePhotos = [];
    let activeIndex = 0;

    function pick(obj, ...keys) {
        if (!obj) return '';
        for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
        }
        return '';
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function resolvePath(path) {
        const raw = String(path || '').trim();
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        if (raw.startsWith('/')) return contextPath + raw;
        return contextPath + '/' + raw;
    }

    async function request(url) {
        const response = await fetch(contextPath + url, {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });
        if (!response.ok) {
            let message = '사진 정보를 불러오지 못했습니다.';
            try {
                const data = await response.json();
                message = data.message || data.error || message;
            } catch (e) {}
            throw new Error(message);
        }
        return response.json();
    }

    function normalizeDetail(data, requestedPostId) {
        const post = data && data.post ? data.post : {};
        const photos = Array.isArray(data && data.photos) ? data.photos : [];
        const coverPath = pick(post, 'coverPath', 'COVER_PATH');
        const normalizedPhotos = photos.length ? photos : [{ filePath: coverPath, FILE_PATH: coverPath }];
        return {
            post: Object.assign({ postId: requestedPostId, POST_ID: requestedPostId }, post),
            photos: normalizedPhotos.filter(photo => pick(photo, 'filePath', 'FILE_PATH') || coverPath)
        };
    }

    function updateImage() {
        if (!activePost || !activePhotos.length) return;
        const photo = activePhotos[activeIndex] || activePhotos[0] || {};
        const imagePath = pick(photo, 'filePath', 'FILE_PATH') || pick(activePost, 'coverPath', 'COVER_PATH');
        nodes.image.src = resolvePath(imagePath);
        nodes.image.alt = pick(activePost, 'title', 'TITLE', 'description', 'DESCRIPTION') || '공개 사진 상세';

        const multiple = activePhotos.length > 1;
        nodes.prev.hidden = !multiple;
        nodes.next.hidden = !multiple;
        nodes.count.hidden = !multiple;
        if (multiple) nodes.count.textContent = `${activeIndex + 1} / ${activePhotos.length}`;
    }

    function renderDetail() {
        const title = pick(activePost, 'title', 'TITLE') || '공개 사진';
        const albumName = pick(activePost, 'albumName', 'ALBUM_NAME') || '앨범 없음';
        const createdAt = pick(activePost, 'createdAt', 'CREATED_AT') || '';
        const creatorName = pick(activePost, 'creatorName', 'CREATOR_NAME') || '';
        const description = pick(activePost, 'description', 'DESCRIPTION');
        const likeCount = Number(pick(activePost, 'likeCount', 'LIKE_COUNT') || 0);
        const commentCount = Number(pick(activePost, 'commentCount', 'COMMENT_COUNT') || 0);

        nodes.title.textContent = title;
        nodes.meta.textContent = [creatorName, albumName, createdAt].filter(Boolean).join(' · ');
        nodes.desc.hidden = !description;
        nodes.desc.textContent = description || '';
        nodes.like.textContent = `♡ ${likeCount}`;
        nodes.comment.textContent = `💬 ${commentCount}`;
        updateImage();
    }

    function renderComments(comments) {
        if (!nodes.comments) return;
        if (!Array.isArray(comments) || !comments.length) {
            nodes.comments.textContent = '아직 댓글이 없어요.';
            return;
        }
        nodes.comments.innerHTML = comments.map(comment => {
            const name = pick(comment, 'userName', 'USER_NAME') || '사용자';
            const content = pick(comment, 'commentContent', 'COMMENT_CONTENT') || '';
            const createdAt = pick(comment, 'createdAt', 'CREATED_AT') || '';
            return `<article class="profile-photo-detail-comment"><strong>${esc(name)}</strong><p>${esc(content)}</p>${createdAt ? `<small>${esc(createdAt)}</small>` : ''}</article>`;
        }).join('');
    }

    async function loadComments(postId) {
        if (!nodes.comments) return;
        nodes.comments.textContent = '댓글을 불러오는 중입니다.';
        try {
            const data = await request(`/api/photo-posts/${encodeURIComponent(postId)}/comments`);
            renderComments(Array.isArray(data) ? data : (data.comments || []));
        } catch (e) {
            nodes.comments.textContent = '댓글을 불러오지 못했습니다.';
        }
    }

    function openModal() {
        modal.hidden = false;
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.hidden = true;
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        activePost = null;
        activePhotos = [];
        activeIndex = 0;
        if (nodes.image) nodes.image.removeAttribute('src');
    }

    async function openPhoto(postId) {
        if (!postId) return;
        try {
            openModal();
            nodes.title.textContent = '사진을 불러오는 중입니다';
            nodes.meta.textContent = '';
            nodes.desc.hidden = true;
            nodes.comments.textContent = '댓글을 불러오는 중입니다.';
            nodes.image.removeAttribute('src');
            nodes.prev.hidden = true;
            nodes.next.hidden = true;
            nodes.count.hidden = true;

            const data = await request(`/api/photo-posts/${encodeURIComponent(postId)}`);
            const detail = normalizeDetail(data, postId);
            activePost = detail.post;
            activePhotos = detail.photos;
            activeIndex = 0;
            renderDetail();
            await loadComments(postId);
        } catch (e) {
            nodes.title.textContent = '사진을 열지 못했습니다';
            nodes.meta.textContent = e.message || '잠시 후 다시 시도해주세요.';
            nodes.comments.textContent = '';
        }
    }

    function movePhoto(delta) {
        if (!activePhotos.length) return;
        activeIndex = (activeIndex + delta + activePhotos.length) % activePhotos.length;
        updateImage();
    }

    document.addEventListener('click', event => {
        const opener = event.target.closest('[data-profile-photo-open]');
        if (opener) {
            event.preventDefault();
            openPhoto(opener.dataset.profilePhotoOpen);
            return;
        }
        if (event.target.closest('[data-profile-photo-close]')) {
            closeModal();
            return;
        }
        if (event.target.closest('[data-profile-photo-prev]')) {
            movePhoto(-1);
            return;
        }
        if (event.target.closest('[data-profile-photo-next]')) {
            movePhoto(1);
        }
    });

    document.addEventListener('keydown', event => {
        if (modal.hidden) return;
        if (event.key === 'Escape') closeModal();
        if (event.key === 'ArrowLeft') movePhoto(-1);
        if (event.key === 'ArrowRight') movePhoto(1);
    });
})();
