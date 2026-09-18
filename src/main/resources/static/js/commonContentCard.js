(() => {
    'use strict';

    const esc = value => String(value ?? '')
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

    const num = value => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    };

    function noteMeta(item, options = {}) {
        const classes = options.metaClass || 'profile-note-content-meta';
        const itemClasses = options.metaItemClass || 'profile-note-content-meta-item';
        const entries = [
            ['imageCount', 'fa-regular fa-image', '이미지'],
            ['tableCount', 'fa-solid fa-table-cells', '표'],
            ['linkCount', 'fa-solid fa-link', '링크'],
            ['videoCount', 'fa-regular fa-circle-play', '동영상']
        ].map(([key, icon, label]) => ({ count: num(item[key]), icon, label }))
            .filter(entry => entry.count > 0);

        const emptyClass = entries.length ? '' : ' is-empty';
        const aria = entries.length ? ' aria-label="노트 구성 정보"' : ' aria-hidden="true"';
        return `<span class="${esc(classes)}${emptyClass}"${aria}>${
            entries.map(entry =>
                `<span class="${esc(itemClasses)}" title="${esc(entry.label)} ${entry.count}개">` +
                `<i class="${esc(entry.icon)}" aria-hidden="true"></i><span>${entry.count}</span></span>`
            ).join('')
        }</span>`;
    }

    function noteReactions(item, options = {}) {
        if (options.showReactions === false) return '';
        const id = item.id ?? item.noteId ?? '';
        const liked = Boolean(item.likedByMe);
        const actionClass = options.actionClass || 'profile-note-feed-action';
        const actionWrapClass = options.actionWrapClass || 'profile-note-feed-actions';
        const viewAttr = options.viewAttr || 'data-note-view-count';
        const likeToggleAttr = options.likeToggleAttr || 'data-note-like-toggle';
        const likeCountAttr = options.likeCountAttr || 'data-note-like-count';
        const commentCountAttr = options.commentCountAttr || 'data-note-comment-count';
        const commentButton = options.commentButton === true;
        const likeModalId = options.likeModalId || '';

        const likeExtra = [
            options.likeClass || '',
            liked ? 'is-active' : ''
        ].filter(Boolean).join(' ');

        const commentOpenAttr = options.commentOpenAttr
            ? ` ${options.commentOpenAttr}="${esc(options.commentOpenValue || '')}"`
            : '';

        return `<span class="${esc(actionWrapClass)}" aria-label="노트 반응 정보">` +
            `<span class="${esc(actionClass)}" title="조회수"><i class="fa-regular fa-eye" aria-hidden="true"></i><span ${viewAttr}>${num(item.viewCount)}</span></span>` +
            `<button type="button" class="${esc(actionClass)} ${esc(likeExtra)}" ${likeToggleAttr} data-note-id="${esc(id)}"${likeModalId ? ` data-modal-id="${esc(likeModalId)}"` : ''} aria-pressed="${liked}" title="${liked ? '좋아요 취소' : '좋아요'}"><i class="${liked ? 'fa-solid' : 'fa-regular'} fa-heart" aria-hidden="true"></i><span ${likeCountAttr}>${num(item.likeCount)}</span></button>` +
            (commentButton
                ? `<button type="button" class="${esc(actionClass)}"${commentOpenAttr} title="댓글 보기"><i class="fa-regular fa-comment" aria-hidden="true"></i><span ${commentCountAttr}>${num(item.commentCount)}</span></button>`
                : `<span class="${esc(actionClass)}" title="댓글"><i class="fa-regular fa-comment" aria-hidden="true"></i><span ${commentCountAttr}>${num(item.commentCount)}</span></span>`) +
            (options.showSharedState
                ? `<button type="button" class="${esc(actionClass)} is-shared-state is-icon-only" data-explorer-share-open data-content-id="${esc(id)}" title="친구 공유" aria-label="친구 공유"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button>`
                : '') +
            (options.showShare
                ? (options.shareAction === 'friend-send'
                    ? `<button type="button" class="${esc(actionClass)} is-friend-send is-icon-only" data-explorer-friend-send data-profile-note-card-friend-send data-content-id="${esc(id)}" title="${esc(options.shareTitle || '친구에게 보내기')}" aria-label="${esc(options.shareAriaLabel || options.shareTitle || '친구에게 보내기')}"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i></button>`
                    : `<button type="button" class="${esc(actionClass)} is-icon-only" data-profile-note-card-share data-note-id="${esc(id)}" title="${esc(options.shareTitle || '공유')}" aria-label="${esc(options.shareAriaLabel || options.shareTitle || '공유')}"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i></button>`)
                : '') +
            (options.showCollect
                ? `<button type="button" class="${esc(actionClass)} is-icon-only" data-profile-note-card-collect data-profile-note-collect data-note-id="${esc(id)}" title="담기" aria-pressed="false"><i class="fa-regular fa-bookmark" aria-hidden="true"></i></button>`
                : '') +
            `</span>`;
    }

    function notePaper(item, options = {}) {
        const id = item.id ?? item.noteId ?? '';
        const title = item.title || '제목 없는 노트';
        const preview = item.preview || '작성된 내용이 없습니다.';
        const author = item.author || '';
        const date = item.date || '';
        const outerClass = options.outerClass || 'profile-note-paper-card';
        const buttonClass = options.buttonClass || 'profile-note-paper-button';
        const paperClass = options.paperClass || 'profile-note-paper';
        const innerClass = options.innerClass || 'profile-note-paper-inner';
        const titleClass = options.titleClass || 'profile-note-paper-title';
        const lineClass = options.lineClass || 'profile-note-paper-line is-strong';
        const bodyClass = options.bodyClass || 'profile-note-paper-body';
        const linesClass = options.linesClass || 'profile-note-paper-lines';
        const hoverClass = options.hoverClass || 'profile-note-hover';
        const hoverMainClass = options.hoverMainClass || 'profile-note-hover-main';
        const hoverMetaClass = options.hoverMetaClass || 'profile-note-hover-meta';
        const hoverDotClass = options.hoverDotClass || 'profile-note-hover-dot';
        const hoverDateClass = options.hoverDateClass || 'profile-note-hover-date';
        const modalId = options.modalId || '';
        const outerTag = options.outerTag === 'article' ? 'article' : 'div';
        const buttonTag = options.buttonTag === 'article' ? 'article' : 'div';
        const meta = noteMeta(item, {
            metaClass: options.metaClass,
            metaItemClass: options.metaItemClass
        });
        const reactions = noteReactions(item, options);

        const moyoMark = options.showMoyoMark && item.moyoPublic
            ? `<span class="${esc(options.moyoMarkClass || 'profile-note-moyo-mark')}" title="MOYO 공개"><img src="${esc(options.moyoMarkSrc || '')}" alt="MOYO 공개"></span>`
            : '';

        const wrapperAttrs = [
            modalId ? `data-profile-note-open="${esc(modalId)}"` : '',
            options.tabindex != null ? `tabindex="${esc(options.tabindex)}"` : '',
            options.role ? `role="${esc(options.role)}"` : '',
            options.ariaLabel ? `aria-label="${esc(options.ariaLabel)}"` : ''
        ].filter(Boolean).join(' ');

        return `<${outerTag} class="${esc(outerClass)}"${wrapperAttrs ? ' '+wrapperAttrs : ''}>` +
            `<${buttonTag} class="${esc(buttonClass)}">` +
            `<span class="${esc(paperClass)}"${options.paperAriaHidden === false ? '' : ' aria-hidden="true"'}>` +
            `<span class="${esc(innerClass)}">` +
            `<span class="${esc(titleClass)}">${esc(title)}</span>` +
            meta +
            `<span class="${esc(lineClass)}"></span>` +
            `<span class="${esc(bodyClass)}">${esc(preview)}</span>` +
            `<span class="${esc(linesClass)}" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>` +
            `</span>${moyoMark}` +
            `<span class="${esc(hoverClass)}"><span class="${esc(hoverMainClass)}">` +
            `<span class="${esc(hoverMetaClass)}">${author ? `<strong>${esc(author)}</strong><span class="${esc(hoverDotClass)}" aria-hidden="true">·</span>` : ''}<span class="${esc(hoverDateClass)}">${esc(date)}</span></span>` +
            reactions +
            `</span></span>` +
            `</span></${buttonTag}></${outerTag}>`;
    }

    function photo(item) {
        const id = item.id ?? item.postId ?? '';
        const title = item.title || '사진';
        const image = item.imageUrl || item.thumbnailUrl || item.fileUrl || '';
        return `<article class="content-card content-card--photo" data-content-id="${esc(id)}" tabindex="0">
            <div class="content-card__visual">${image ? `<img src="${esc(image)}" alt="${esc(title)}">` : '<i class="fa-regular fa-image"></i>'}</div>
            <div class="content-card__body"><strong class="content-card__title">${esc(title)}</strong></div>
        </article>`;
    }

    function note(item) {
        return notePaper(item, item.options || {});
    }

    function render(container, type, items) {
        if (!container) return;
        const list = Array.isArray(items) ? items : [];
        const maker = String(type).toUpperCase() === 'PHOTO' ? photo : note;
        container.innerHTML = list.map(maker).join('');
        const empty = container.parentElement?.querySelector('[data-explorer-role="empty"]');
        if (empty) empty.hidden = list.length > 0;
        container.hidden = list.length === 0;
        const count = container.closest('[data-content-explorer]')?.querySelector('[data-explorer-role="count"]');
        if (count) count.textContent = `${list.length}개 항목`;
    }

    window.MoyoContentCard = { render, photo, note, notePaper, noteMeta, noteReactions };
})();
