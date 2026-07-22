(() => {
    const NOTE_PAGE_WIDTH = 794;
    const NOTE_PAGE_HEIGHT = 1123;
    const NOTE_PAGE_SPREAD_GAP = 0;
    const NOTE_VIEW_SIZE_DEFAULT = 'fit';
    const NOTE_VIEW_SIZE_SCALE = {
        fit: { label: '기본' },
        large: { label: '크게' }
    };

    const closeProfileNoteDetail = modal => {
        const target = modal || document.querySelector('[data-profile-note-detail]:not([hidden])');
        if (!target) return;
        target.hidden = true;
        target.classList.remove('profile-note-printing', 'is-note-scroll-mode', 'is-note-fit-mode', 'is-note-basic-mode', 'is-note-large-mode', 'is-note-dual-mode');
        document.documentElement.classList.remove('profile-note-modal-open');
        document.body.classList.remove('profile-note-modal-open');
    };

    const getProfileNoteStage = element => {
        const modal = element?.closest?.('[data-profile-note-detail]') || document.querySelector('[data-profile-note-detail]:not([hidden])');
        return modal ? modal.querySelector('[data-profile-note-page-stage]') : null;
    };

    const makeContinuationPage = pageNo => {
        const page = document.createElement('article');
        page.className = 'profile-note-document profile-note-page is-continuation';
        page.dataset.profileNotePage = String(pageNo);

        const body = document.createElement('div');
        body.className = 'profile-note-document-body common-rich-content';
        body.dataset.profileNotePageBody = 'true';
        page.appendChild(body);

        return page;
    };

    const getFirstPageFromTemplate = stage => {
        if (!stage._noteTemplateHtml) {
            const template = stage.querySelector('[data-profile-note-page-template]');
            const sourceBody = template?.querySelector('[data-profile-note-source-body]');
            stage._noteTemplateHtml = template ? template.outerHTML : '';
            stage._noteSourceHtml = sourceBody ? sourceBody.innerHTML : '';
        }

        const holder = document.createElement('div');
        holder.innerHTML = stage._noteTemplateHtml;
        const page = holder.firstElementChild;
        if (!page) return null;
        page.removeAttribute('data-profile-note-page-template');
        page.dataset.profileNotePage = '1';
        const body = page.querySelector('[data-profile-note-source-body]');
        if (body) {
            body.dataset.profileNotePageBody = 'true';
            body.removeAttribute('data-profile-note-source-body');
            body.innerHTML = '';
        }
        return page;
    };

    const paginateProfileNote = stage => {
        const stack = stage?.querySelector?.('[data-profile-note-page-stack]');
        if (!stage || !stack) return 1;

        const currentBefore = Math.max(0, parseInt(stage.dataset.profileNoteCurrentPage || '0', 10) || 0);
        const firstPage = getFirstPageFromTemplate(stage);
        if (!firstPage) return 1;

        const sourceHolder = document.createElement('div');
        sourceHolder.innerHTML = stage._noteSourceHtml || '';
        const sourceNodes = Array.from(sourceHolder.childNodes).filter(node => {
            return node.nodeType !== Node.TEXT_NODE || node.textContent.trim();
        });
        stack.innerHTML = '';
        stack.appendChild(firstPage);

        let page = firstPage;
        let body = page.querySelector('[data-profile-note-page-body]') || page.querySelector('.profile-note-document-body');
        let pageNo = 1;
        const nodes = sourceNodes.length ? sourceNodes : Array.from(sourceHolder.childNodes);

        nodes.forEach(originalNode => {
            const node = originalNode.cloneNode(true);
            body.appendChild(node);

            if (page.scrollHeight > NOTE_PAGE_HEIGHT + 2 && body.childNodes.length > 1) {
                body.removeChild(node);
                pageNo += 1;
                page = makeContinuationPage(pageNo);
                stack.appendChild(page);
                body = page.querySelector('[data-profile-note-page-body]');
                body.appendChild(node);
            }
        });

        const pages = Array.from(stack.querySelectorAll('[data-profile-note-page]'));
        pages.forEach((pageEl, index) => {
            pageEl.dataset.profileNotePage = String(index + 1);

        });

        stage.dataset.profileNoteCurrentPage = String(Math.min(currentBefore, Math.max(0, pages.length - 1)));

        stack.querySelectorAll('img').forEach(image => {
            if (!image.complete) {
                image.addEventListener('load', () => fitProfileNotePages(stage.closest('[data-profile-note-detail]')), { once: true });
            }
        });

        return Math.max(1, pages.length);
    };

    const isProfileNoteSpreadAllowed = () => window.innerWidth >= 980 && window.innerWidth >= window.innerHeight;

    const isProfileNoteSpreadMode = stage => stage?.dataset?.profileNoteViewMode === 'spread' && isProfileNoteSpreadAllowed();

    const ensureProfileNoteViewMode = stage => {
        if (stage?.dataset?.profileNoteViewMode === 'spread' && !isProfileNoteSpreadAllowed()) {
            stage.dataset.profileNoteViewMode = 'single';
        }
    };

    const getProfileNoteViewSize = stage => {
        const value = stage?.dataset?.profileNoteViewSize || NOTE_VIEW_SIZE_DEFAULT;
        return NOTE_VIEW_SIZE_SCALE[value] ? value : NOTE_VIEW_SIZE_DEFAULT;
    };

    const getProfileNoteScale = (stage, availableWidth, availableHeight, naturalWidth) => {
        const spread = isProfileNoteSpreadMode(stage);
        const size = getProfileNoteViewSize(stage);
        const widthScale = availableWidth / naturalWidth;
        const heightScale = availableHeight / NOTE_PAGE_HEIGHT;
        const fitScale = Math.min(widthScale, heightScale);

        // 듀얼은 별도 보기 모드: 두 장 전체가 스크롤 없이 화면 안에 들어와야 한다.
        if (spread) {
            return Math.max(.28, Math.min(1, fitScale));
        }

        // 전체보기: A4 한 장이 상하 가용 영역을 최대한 채우는 기준.
        if (size === 'fit') {
            return Math.max(.3, Math.min(1, fitScale));
        }

        // 크게: 유일하게 스크롤을 허용하는 읽기 확대 모드.
        // 전체 문서 맞춤보다 확실히 크게 보여 주되, 가로는 화면 안에 유지한다.
        return Math.max(.38, Math.min(1.55, widthScale, fitScale * 1.42));
    };

    const getProfileNoteDualScale = (availableWidth, availableHeight) => {
        const naturalWidth = (NOTE_PAGE_WIDTH * 2 + NOTE_PAGE_SPREAD_GAP);
        return Math.max(.28, Math.min(1, availableWidth / naturalWidth, availableHeight / NOTE_PAGE_HEIGHT));
    };

    const getProfileNoteStep = stage => isProfileNoteSpreadMode(stage) ? 2 : 1;

    const normalizeProfileNotePageIndex = (stage, index, pageCount) => {
        const max = Math.max(0, pageCount - 1);
        let next = Math.min(Math.max(index, 0), max);
        if (isProfileNoteSpreadMode(stage)) {
            next = Math.floor(next / 2) * 2;
            if (next > max) next = Math.max(0, Math.floor(max / 2) * 2);
        }
        return next;
    };

    const getProfileNotePageLabel = (stage, current, pageCount) => {
        if (isProfileNoteSpreadMode(stage) && current + 1 < pageCount) {
            return `${current + 1}-${current + 2} / ${pageCount}`;
        }
        return `${current + 1} / ${pageCount}`;
    };

    const updateProfileNoteSpreadToggle = (modal, stage) => {
        const spread = isProfileNoteSpreadMode(stage);
        modal?.querySelectorAll('[data-profile-note-spread-toggle]').forEach(button => {
            button.setAttribute('aria-pressed', spread ? 'true' : 'false');
            const label = button.querySelector('span');
            if (label) label.textContent = '듀얼';
            button.classList.toggle('is-active', spread);
        });
    };

    const updateProfileNoteSizeToggle = (modal, stage) => {
        const size = getProfileNoteViewSize(stage);
        const spread = isProfileNoteSpreadMode(stage);
        modal?.querySelectorAll('[data-profile-note-size-toggle]').forEach(button => {
            const active = !spread && button.dataset.noteViewSize === size;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    };

    const updateProfileNotePageView = stage => {
        if (!stage) return;
        const stack = stage.querySelector('[data-profile-note-page-stack]');
        const pages = stack ? Array.from(stack.querySelectorAll('[data-profile-note-page]')) : [];
        const pageCount = Math.max(1, pages.length);
        const rawCurrent = parseInt(stage.dataset.profileNoteCurrentPage || '0', 10) || 0;
        const current = normalizeProfileNotePageIndex(stage, rawCurrent, pageCount);
        const spread = isProfileNoteSpreadMode(stage);
        const gap = spread ? NOTE_PAGE_SPREAD_GAP : 0;
        const offset = current * (NOTE_PAGE_WIDTH + gap);
        stage.dataset.profileNoteCurrentPage = String(current);
        stage.style.setProperty('--note-page-index', String(current));
        stage.style.setProperty('--note-page-offset', `${offset}px`);
        stage.style.setProperty('--note-page-gap', `${gap}px`);
        stage.classList.toggle('is-spread-mode', spread);

        const modal = stage.closest('[data-profile-note-detail]');
        const status = modal?.querySelector('[data-profile-note-page-status]');
        const count = modal?.querySelector('[data-profile-note-page-count]');
        const label = getProfileNotePageLabel(stage, current, pageCount);
        if (status) status.textContent = label;
        if (count) count.textContent = label;
        updateProfileNoteSpreadToggle(modal, stage);
        updateProfileNoteSizeToggle(modal, stage);

        modal?.querySelectorAll('[data-profile-note-page-prev]').forEach(button => {
            button.disabled = current <= 0;
        });
        modal?.querySelectorAll('[data-profile-note-page-next]').forEach(button => {
            button.disabled = current + getProfileNoteStep(stage) >= pageCount;
        });
    };

    const fitProfileNotePages = root => {
        const scope = root || document;
        scope.querySelectorAll('[data-profile-note-page-stage]').forEach(stage => {
            if (!stage.offsetParent) return;
            ensureProfileNoteViewMode(stage);
            const pageCount = paginateProfileNote(stage);
            const modal = stage.closest('[data-profile-note-detail]');
            const wrap = modal?.querySelector('.profile-note-document-wrap') || stage.parentElement;
            const footer = modal?.querySelector('.profile-note-bottom-dock');
            const spread = isProfileNoteSpreadMode(stage);
            const naturalWidth = spread ? (NOTE_PAGE_WIDTH * 2 + NOTE_PAGE_SPREAD_GAP) : NOTE_PAGE_WIDTH;
            const viewSize = getProfileNoteViewSize(stage);
            const wrapWidth = Math.max(320, wrap?.clientWidth || stage.clientWidth || window.innerWidth);
            const wrapHeight = Math.max(420, wrap?.clientHeight || stage.clientHeight || window.innerHeight);
            const footerHeight = footer ? Math.ceil(footer.getBoundingClientRect().height) : 32;
            const horizontalRoomForControls = spread ? 112 : 104;
            const verticalRoomForControls = footerHeight + 28;
            const availableWidth = Math.max(280, wrapWidth - horizontalRoomForControls);
            const availableHeight = Math.max(360, wrapHeight - verticalRoomForControls);
            const reviewOpen = modal ? !modal.classList.contains('is-review-collapsed') : false;
            const reviewWidth = parseInt(getComputedStyle(modal || document.documentElement).getPropertyValue('--note-review-panel-width'), 10) || 326;
            const reviewGap = parseInt(getComputedStyle(modal || document.documentElement).getPropertyValue('--note-review-panel-gap'), 10) || 18;
            const dualWidthRoom = Math.max(280, window.innerWidth - reviewWidth - reviewGap - 104);
            const dualHeightRoom = Math.max(360, window.innerHeight - 88);
            const reviewScale = getProfileNoteDualScale(dualWidthRoom, dualHeightRoom);
            let scale = getProfileNoteScale(stage, availableWidth, availableHeight, naturalWidth);

            // 듀얼 모드는 댓글 패널의 열림/닫힘과 관계없이 항상
            // 댓글 패널이 열린 상태의 가용 폭을 기준으로 같은 크기를 유지한다.
            // 패널을 여닫을 때 문서가 커졌다 작아지는 시각적 흔들림을 막는다.
            if (spread) {
                scale = Math.min(scale, reviewScale * .98);
            }

            const displayWidth = Math.round(naturalWidth * scale);
            const displayHeight = Math.round(NOTE_PAGE_HEIGHT * scale);
            const reviewHeight = Math.round(NOTE_PAGE_HEIGHT * reviewScale);

            const scrollMode = viewSize === 'large' && !spread;

            stage.style.setProperty('--note-page-scale', String(scale));
            stage.style.setProperty('--note-spread-width', `${naturalWidth}px`);
            stage.style.setProperty('--note-page-display-width', `${displayWidth}px`);
            stage.style.setProperty('--note-page-display-height', `${displayHeight}px`);
            if (modal) {
                modal.style.setProperty('--note-page-display-width', `${displayWidth}px`);
                modal.style.setProperty('--note-page-display-height', `${displayHeight}px`);
                modal.style.setProperty('--note-review-display-height', `${reviewHeight}px`);
                modal.classList.toggle('is-note-scroll-mode', scrollMode);
                modal.classList.toggle('is-note-fit-mode', viewSize === 'fit' && !spread);
                modal.classList.toggle('is-note-basic-mode', false);
                modal.classList.toggle('is-note-large-mode', viewSize === 'large' && !spread);
                modal.classList.toggle('is-note-dual-mode', spread);
            }
            stage.classList.toggle('is-scaled', scale < .99);
            stage.classList.toggle('has-multiple-pages', pageCount > 1);
            stage.classList.toggle('is-fit-size', viewSize === 'fit' && !spread);
            stage.classList.toggle('is-basic-size', false);
            stage.classList.toggle('is-read-size', false);
            stage.classList.toggle('is-large-size', viewSize === 'large' && !spread);
            updateProfileNotePageView(stage);
        });
    };



    const scrollProfileNoteDetail = (modal, delta) => {
        if (!modal || !modal.classList.contains('is-note-large-mode')) return false;
        const wrap = modal.querySelector('.profile-note-document-wrap');
        if (!wrap) return false;
        const maxScroll = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
        if (maxScroll <= 0) return false;
        const nextTop = Math.min(Math.max(wrap.scrollTop + delta, 0), maxScroll);
        if (Math.abs(nextTop - wrap.scrollTop) < 1) return false;
        wrap.scrollTo({ top: nextTop, behavior: 'auto' });
        return true;
    };

    const getProfileNoteWheelDelta = event => {
        let delta = event.deltaY || 0;
        if (event.deltaMode === 1) delta *= 40;
        if (event.deltaMode === 2) delta *= window.innerHeight;
        const direction = delta < 0 ? -1 : 1;
        const absDelta = Math.abs(delta);
        const amplified = Math.max(360, absDelta * 2.8);
        return direction * Math.min(amplified, Math.max(520, window.innerHeight * .72));
    };

    const moveProfileNotePage = (stage, direction) => {
        if (!stage) return;
        const pageCount = stage.querySelectorAll('[data-profile-note-page]').length || paginateProfileNote(stage);
        const current = parseInt(stage.dataset.profileNoteCurrentPage || '0', 10) || 0;
        const step = getProfileNoteStep(stage);
        const next = normalizeProfileNotePageIndex(stage, current + (direction * step), pageCount);
        if (next === current) return;
        stage.dataset.profileNoteCurrentPage = String(next);
        updateProfileNotePageView(stage);
    };


    const profileNoteApiUrl = (modal, path) => `${modal?.dataset?.contextPath || ''}${path}`;

    const profileNoteFormatCommentDate = value => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const now = new Date();
        const diff = Math.max(0, now.getTime() - date.getTime());
        if (diff < 60_000) return '방금 전';
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
        const sameYear = now.getFullYear() === date.getFullYear();
        const pad = number => String(number).padStart(2, '0');
        return sameYear
            ? `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
            : `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
    };

    const profileNoteResolveImagePath = (modal, path) => {
        const value = String(path || '').trim();
        if (!value) return '';
        if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
        const contextPath = modal?.dataset?.contextPath || '';
        return `${contextPath}${value.startsWith('/') ? value : `/${value}`}`;
    };

    const formatProfileNoteCompactCount = value => {
        const count = Math.max(0, Number(value) || 0);
        const trim = number => {
            if (number >= 100) return String(Math.floor(number));
            if (number >= 10) return String(Math.floor(number * 10) / 10).replace(/\.0$/, '');
            return number.toFixed(1).replace(/\.0$/, '');
        };

        if (count < 1000) return String(Math.floor(count));
        if (count < 10000) return `${trim(count / 1000)}천`;
        if (count < 100000000) return `${trim(count / 10000)}만`;
        return `${trim(count / 100000000)}억`;
    };

    const setProfileNoteCompactCount = (node, value) => {
        if (!node) return;
        const count = Math.max(0, Number(value) || 0);
        node.textContent = formatProfileNoteCompactCount(count);
        node.title = count.toLocaleString('ko-KR');
        node.setAttribute('aria-label', count.toLocaleString('ko-KR'));
    };

    const updateProfileNoteCommentCount = (modal, count) => {
        const safeCount = Math.max(0, Number(count) || 0);
        modal?.querySelectorAll('[data-profile-note-comment-count], [data-profile-note-panel-comment-count]').forEach(node => {
            setProfileNoteCompactCount(node, safeCount);
        });
        const noteId = String(modal?.dataset?.noteId || '');
        if (noteId) {
            document.querySelectorAll(`[data-profile-note-card-comment-count="${CSS.escape(noteId)}"]`).forEach(node => {
                setProfileNoteCompactCount(node, safeCount);
            });
        }
    };

    const makeProfileNoteCommentAvatar = (modal, reply) => {
        const avatar = document.createElement('span');
        avatar.className = 'profile-note-comment-avatar';
        const imagePath = profileNoteResolveImagePath(modal, reply.profileImagePath);
        if (imagePath) {
            const image = document.createElement('img');
            image.src = imagePath;
            image.alt = `${reply.userName || '사용자'} 프로필`;
            image.addEventListener('error', () => image.remove(), { once: true });
            avatar.appendChild(image);
        }
        const fallback = document.createElement('span');
        fallback.textContent = String(reply.userName || 'M').trim().charAt(0) || 'M';
        avatar.appendChild(fallback);
        return avatar;
    };

    const createProfileNoteInlineComposer = (modal, parentReplyId, placeholder) => {
        const form = document.createElement('form');
        form.className = 'profile-note-comment-inline-form';
        form.dataset.profileNoteCommentForm = 'true';
        form.dataset.parentReplyId = String(parentReplyId || '');

        const textarea = document.createElement('textarea');
        textarea.rows = 1;
        textarea.maxLength = 1000;
        textarea.placeholder = placeholder || '답글을 입력하세요';
        textarea.dataset.profileNoteCommentInput = 'true';

        const controls = document.createElement('div');
        controls.className = 'profile-note-comment-inline-controls';

        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.textContent = '취소';
        cancel.dataset.profileNoteInlineCancel = 'true';

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = '등록';
        submit.dataset.profileNoteCommentSubmit = 'true';

        controls.append(cancel, submit);
        form.append(textarea, controls);
        return form;
    };

    const beginProfileNoteInlineEdit = item => {
        if (!item || item.classList.contains('is-editing')) return;
        const content = item.querySelector('.profile-note-comment-content');
        const actions = item.querySelector('.profile-note-comment-actions');
        if (!content) return;

        item.classList.add('is-editing');
        const editor = document.createElement('div');
        editor.className = 'profile-note-comment-inline-editor';

        const textarea = document.createElement('textarea');
        textarea.rows = 1;
        textarea.maxLength = 1000;
        textarea.value = content.textContent || '';
        textarea.dataset.profileNoteCommentInput = 'true';

        const controls = document.createElement('div');
        controls.className = 'profile-note-comment-inline-controls';

        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.textContent = '취소';
        cancel.dataset.profileNoteEditCancel = 'true';

        const save = document.createElement('button');
        save.type = 'button';
        save.textContent = '저장';
        save.dataset.profileNoteEditSave = 'true';

        controls.append(cancel, save);
        editor.append(textarea, controls);
        content.hidden = true;
        if (actions) actions.hidden = true;
        content.after(editor);
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 84)}px`;
        textarea.style.overflowY = textarea.scrollHeight > 84 ? 'auto' : 'hidden';
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    };

    const cancelProfileNoteInlineEdit = item => {
        if (!item) return;
        item.classList.remove('is-editing');
        item.querySelector('.profile-note-comment-inline-editor')?.remove();
        const content = item.querySelector('.profile-note-comment-content');
        const actions = item.querySelector('.profile-note-comment-actions');
        if (content) content.hidden = false;
        if (actions) actions.hidden = false;
    };

    const resetProfileNoteCommentComposer = modal => {
        const form = modal?.querySelector('[data-profile-note-comment-form]');
        const input = form?.querySelector('[data-profile-note-comment-input]');
        if (!form || !input) return;
        form.dataset.composerMode = 'create';
        delete form.dataset.replyId;
        delete form.dataset.parentReplyId;
        delete form.dataset.replyMention;
        input.value = '';
        input.placeholder = '댓글을 입력하세요';
        input.style.height = '';
        form.querySelector('[data-profile-note-composer-status]')?.remove();
        closeProfileNoteMentionList(modal);
    };

    const setProfileNoteCommentComposer = (modal, options = {}) => {
        const form = modal?.querySelector('[data-profile-note-comment-form]');
        const input = form?.querySelector('[data-profile-note-comment-input]');
        if (!form || !input) return;

        const mode = options.mode === 'edit' ? 'edit' : 'reply';
        const targetName = String(options.targetName || '').trim();
        form.dataset.composerMode = mode;
        form.dataset.replyId = String(options.replyId || '');
        form.dataset.parentReplyId = String(options.parentReplyId || '');
        form.dataset.replyMention = targetName;

        let status = form.querySelector('[data-profile-note-composer-status]');
        if (!status) {
            status = document.createElement('div');
            status.className = 'profile-note-comment-composer-status';
            status.dataset.profileNoteComposerStatus = 'true';
            const text = document.createElement('span');
            text.dataset.profileNoteComposerStatusText = 'true';
            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.textContent = '취소';
            cancel.dataset.profileNoteComposerCancel = 'true';
            status.append(text, cancel);
            form.prepend(status);
        }

        const statusText = status.querySelector('[data-profile-note-composer-status-text]');
        if (mode === 'edit') {
            if (statusText) statusText.textContent = '댓글 수정 중';
            input.value = String(options.content || '');
            input.placeholder = '댓글을 수정하세요';
        } else {
            if (statusText) statusText.textContent = `${targetName ? `@${targetName}` : '댓글'}에게 답글 작성 중`;
            input.value = '';
            input.placeholder = targetName ? `@${targetName} 답글을 입력하세요.` : '답글을 입력하세요.';
        }
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    };

    const appendProfileNoteMentionContent = (node, value) => {
        const text = String(value || '');
        const match = text.match(/^(@[^\s]+)(?:\s+([\s\S]*))?$/);
        if (!match) {
            node.textContent = text;
            return;
        }
        const mention = document.createElement('span');
        mention.className = 'profile-note-comment-mention';
        mention.textContent = match[1];
        node.appendChild(mention);
        if (match[2]) node.append(document.createTextNode(' '), document.createTextNode(match[2]));
    };

    const profileNoteMentionText = name => {
        const value = String(name || '').trim();
        return value ? `@${value}` : '';
    };

    const currentProfileNoteMentionQuery = input => {
        if (!input) return null;
        const value = input.value || '';
        const caret = input.selectionStart == null ? value.length : input.selectionStart;
        const before = value.slice(0, caret);
        const match = before.match(/(^|\s)@([^@\s]*)$/);
        if (!match) return null;
        return {
            start: before.length - match[2].length - 1,
            end: caret,
            keyword: match[2] || ''
        };
    };

    const profileNoteMentionUsers = modal => {
        const users = new Map();
        const add = reply => {
            const name = String(reply?.userName || '').trim();
            if (!name) return;
            const id = String(reply?.userId || name);
            if (!users.has(id)) users.set(id, {
                id,
                name,
                profileImagePath: reply?.profileImagePath || ''
            });
        };
        (modal?.__profileNoteReplies || []).forEach(add);
        return Array.from(users.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    };

    const ensureProfileNoteMentionList = modal => {
        const form = modal?.querySelector('[data-profile-note-comment-form]');
        if (!form) return null;
        let list = form.querySelector('[data-profile-note-mention-list]');
        if (!list) {
            list = document.createElement('div');
            list.className = 'profile-note-comment-mention-list';
            list.dataset.profileNoteMentionList = 'true';
            list.hidden = true;
            form.appendChild(list);
        }
        return list;
    };

    const closeProfileNoteMentionList = modal => {
        const list = modal?.querySelector('[data-profile-note-mention-list]');
        if (!list) return;
        list.hidden = true;
        list.innerHTML = '';
    };

    const renderProfileNoteMentionList = input => {
        const modal = input?.closest('[data-profile-note-detail]');
        const list = ensureProfileNoteMentionList(modal);
        const query = currentProfileNoteMentionQuery(input);
        if (!modal || !list || !query) {
            closeProfileNoteMentionList(modal);
            return;
        }
        const keyword = query.keyword.trim().toLowerCase();
        const users = profileNoteMentionUsers(modal)
            .filter(user => !keyword || user.name.toLowerCase().includes(keyword))
            .slice(0, 8);
        list.innerHTML = '';
        if (!users.length) {
            const empty = document.createElement('div');
            empty.className = 'profile-note-comment-mention-empty';
            empty.textContent = '일치하는 사용자가 없습니다.';
            list.appendChild(empty);
            list.hidden = false;
            return;
        }
        users.forEach((user, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `profile-note-comment-mention-option${index === 0 ? ' is-active' : ''}`;
            button.dataset.profileNoteMentionUser = user.name;

            const avatar = document.createElement('span');
            avatar.className = 'profile-note-comment-mention-avatar';
            if (user.profileImagePath) {
                const img = document.createElement('img');
                img.src = `${modal.dataset.contextPath || ''}${user.profileImagePath}`;
                img.alt = user.name;
                img.addEventListener('error', () => img.remove(), { once: true });
                avatar.appendChild(img);
            } else {
                avatar.textContent = user.name.charAt(0) || '?';
            }

            const name = document.createElement('strong');
            name.textContent = profileNoteMentionText(user.name);
            button.append(avatar, name);
            list.appendChild(button);
        });
        list.hidden = false;
    };

    const applyProfileNoteMention = (input, name) => {
        const query = currentProfileNoteMentionQuery(input);
        const mention = profileNoteMentionText(name);
        if (!query || !mention) return;
        const value = input.value || '';
        input.value = `${value.slice(0, query.start)}${mention} ${value.slice(query.end)}`;
        const caret = query.start + mention.length + 1;
        input.focus();
        input.setSelectionRange(caret, caret);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        closeProfileNoteMentionList(input.closest('[data-profile-note-detail]'));
    };

    const renderProfileNoteComments = (modal, replies, currentUserId) => {
        const list = modal?.querySelector('[data-profile-note-comment-list]');
        const empty = modal?.querySelector('[data-profile-note-comment-empty]');
        if (!list || !empty) return;

        const items = Array.isArray(replies) ? replies : [];
        modal.__profileNoteReplies = items;
        const roots = items.filter(reply => !reply.parentReplyId);
        const childrenByParent = new Map();
        items.filter(reply => reply.parentReplyId).forEach(reply => {
            const key = String(reply.parentReplyId);
            if (!childrenByParent.has(key)) childrenByParent.set(key, []);
            childrenByParent.get(key).push(reply);
        });

        list.innerHTML = '';
        empty.hidden = items.length > 0;
        list.hidden = items.length === 0;

        const appendComment = (reply, isChild = false) => {
            const item = document.createElement('article');
            item.className = `profile-note-comment-item${isChild ? ' is-reply' : ''}`;
            item.dataset.replyId = String(reply.replyId || '');
            item.dataset.parentReplyId = String(reply.parentReplyId || '');

            const profileLink = document.createElement('a');
            profileLink.className = 'profile-note-comment-profile';
            profileLink.href = `${modal.dataset.contextPath || ''}/users/profile?userId=${encodeURIComponent(reply.userId || '')}`;
            profileLink.appendChild(makeProfileNoteCommentAvatar(modal, reply));

            const body = document.createElement('div');
            body.className = 'profile-note-comment-body';

            const head = document.createElement('div');
            head.className = 'profile-note-comment-head';

            const nameLink = document.createElement('a');
            nameLink.href = profileLink.href;
            nameLink.className = 'profile-note-comment-name';
            nameLink.textContent = reply.userName || '사용자';

            const time = document.createElement('time');
            time.textContent = profileNoteFormatCommentDate(reply.updDt || reply.regDt);
            if (reply.updDt) time.title = '수정됨';

            head.append(nameLink, time);

            const content = document.createElement('p');
            content.className = 'profile-note-comment-content';
            appendProfileNoteMentionContent(content, reply.replyContent || '');

            const actions = document.createElement('div');
            actions.className = 'profile-note-comment-actions';

            const like = document.createElement('button');
            like.type = 'button';
            like.dataset.profileNoteCommentLike = 'true';
            like.classList.toggle('is-active', Boolean(reply.likedByMe));
            like.setAttribute('aria-pressed', reply.likedByMe ? 'true' : 'false');
            const likeIcon = reply.likedByMe ? '♥' : '♡';
            like.innerHTML = `<span class="profile-note-comment-like-icon" aria-hidden="true">${likeIcon}</span> 좋아요${Number(reply.likeCount) > 0 ? ` ${Number(reply.likeCount)}` : ''}`;
            like.setAttribute('aria-label', reply.likedByMe ? '댓글 좋아요 취소' : '댓글 좋아요');
            like.title = reply.likedByMe ? '좋아요 취소' : '좋아요';
            actions.appendChild(like);

            const replyButton = document.createElement('button');
            replyButton.type = 'button';
            replyButton.dataset.profileNoteCommentReply = 'true';
            replyButton.dataset.replyTargetName = reply.userName || '사용자';
            replyButton.dataset.rootReplyId = String(isChild ? (reply.parentReplyId || '') : (reply.replyId || ''));
            replyButton.textContent = '답글';
            actions.appendChild(replyButton);

            if (String(reply.userId || '') === String(currentUserId || '')) {
                const edit = document.createElement('button');
                edit.type = 'button';
                edit.dataset.profileNoteCommentEdit = 'true';
                edit.textContent = '수정';

                const remove = document.createElement('button');
                remove.type = 'button';
                remove.dataset.profileNoteCommentDelete = 'true';
                remove.textContent = '삭제';

                actions.append(edit, remove);
            }

            body.append(head, content, actions);
            item.append(profileLink, body);
            list.appendChild(item);
            return item;
        };

        roots.forEach(root => {
            const rootItem = appendComment(root, false);
            const repliesForRoot = childrenByParent.get(String(root.replyId)) || [];
            repliesForRoot.forEach(child => appendComment(child, true));
            rootItem.dataset.replyCount = String(repliesForRoot.length);
        });

        updateProfileNoteCommentCount(modal, items.length);
    };

    const setProfileNoteCommentLoading = (modal, loading) => {
        const indicator = modal?.querySelector('[data-profile-note-comment-loading]');
        const list = modal?.querySelector('[data-profile-note-comment-list]');
        const empty = modal?.querySelector('[data-profile-note-comment-empty]');
        if (indicator) indicator.hidden = !loading;
        if (loading) {
            if (list) list.hidden = true;
            if (empty) empty.hidden = true;
        }
    };

    const loadProfileNoteComments = async (modal, force = false) => {
        if (!modal || (modal.dataset.commentsLoaded === 'true' && !force)) return;
        const noteId = modal.dataset.noteId;
        if (!noteId) return;
        setProfileNoteCommentLoading(modal, true);
        try {
            const response = await fetch(`${profileNoteApiUrl(modal, '/note/api/replies')}?noteId=${encodeURIComponent(noteId)}`, {
                headers: { Accept: 'application/json' }
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || '댓글을 불러오지 못했습니다.');
            modal.dataset.commentsLoaded = 'true';
            modal.dataset.currentUserId = String(data.currentUserId || modal.dataset.currentUserId || '');
            renderProfileNoteComments(modal, data.replies, data.currentUserId);
            const list = modal.querySelector('[data-profile-note-comment-list]');
            if (list) list.scrollTop = 0;
        } catch (error) {
            const empty = modal.querySelector('[data-profile-note-comment-empty]');
            if (empty) {
                empty.hidden = false;
                const title = empty.querySelector('p');
                const description = empty.querySelector('small');
                if (title) title.textContent = '댓글을 불러오지 못했어요.';
                if (description) description.textContent = error.message || '잠시 후 다시 시도해주세요.';
            }
        } finally {
            setProfileNoteCommentLoading(modal, false);
        }
    };

    const submitProfileNoteComment = async form => {
        const modal = form?.closest('[data-profile-note-detail]');
        const input = form?.querySelector('[data-profile-note-comment-input]');
        const submit = form?.querySelector('[data-profile-note-comment-submit]');
        let content = String(input?.value || '').trim();
        if (!modal || !input || !content) return;

        const mode = form.dataset.composerMode || 'create';
        const replyId = form.dataset.replyId || '';
        const parentReplyId = form.dataset.parentReplyId || '';
        const replyMention = String(form.dataset.replyMention || '').trim();
        if (mode === 'reply' && replyMention && !content.startsWith('@')) {
            content = `@${replyMention} ${content}`.trim();
        }

        submit?.setAttribute('disabled', 'disabled');
        try {
            if (mode === 'edit') {
                if (!replyId) return;
                await mutateProfileNoteComment(modal, replyId, 'update', content);
            } else {
                const body = new URLSearchParams({ noteId: modal.dataset.noteId || '', replyContent: content });
                if (mode === 'reply' && parentReplyId) body.set('parentReplyId', parentReplyId);
                const response = await fetch(profileNoteApiUrl(modal, '/note/api/replies/add'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
                    body
                });
                const data = await response.json();
                if (!response.ok || !data.success) throw new Error(data.message || '댓글을 등록하지 못했습니다.');
                modal.dataset.commentsLoaded = 'true';
                renderProfileNoteComments(modal, data.replies, data.currentUserId);
            }
            resetProfileNoteCommentComposer(modal);
            const commentList = modal.querySelector('[data-profile-note-comment-list]');
            if (commentList) {
                requestAnimationFrame(() => {
                    const items = commentList.querySelectorAll('.profile-note-comment-item');
                    const target = items[items.length - 1];
                    if (!target) {
                        commentList.scrollTop = 0;
                        return;
                    }
                    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                });
            }
        } catch (error) {
            window.alert(error.message || '댓글을 등록하지 못했습니다.');
        } finally {
            submit?.removeAttribute('disabled');
        }
    };

    const mutateProfileNoteComment = async (modal, replyId, action, replyContent = '') => {
        const body = new URLSearchParams({ noteId: modal.dataset.noteId || '', replyId: String(replyId || '') });
        if (action === 'update') body.set('replyContent', replyContent);
        const response = await fetch(profileNoteApiUrl(modal, `/note/api/replies/${action}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
            body
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || '댓글을 처리하지 못했습니다.');
        renderProfileNoteComments(modal, data.replies, data.currentUserId);
    };

    const toggleProfileNoteCommentLike = async (modal, replyId) => {
        const body = new URLSearchParams({
            noteId: modal.dataset.noteId || '',
            replyId: String(replyId || '')
        });
        const response = await fetch(profileNoteApiUrl(modal, '/note/api/replies/like'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
            body
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || '댓글 좋아요를 처리하지 못했습니다.');
        renderProfileNoteComments(modal, data.replies, data.currentUserId);
    };

    const updateProfileNoteCardReactionUi = (noteId, data = {}) => {
        const safeNoteId = String(noteId || '').trim();
        if (!safeNoteId) return;
        const viewCount = Math.max(0, Number(data.viewCount ?? 0) || 0);
        const likeCount = Math.max(0, Number(data.likeCount ?? 0) || 0);
        const liked = data.liked === true || data.liked === 'true';

        document.querySelectorAll(`[data-profile-note-card-view-count="${CSS.escape(safeNoteId)}"]`).forEach(node => {
            setProfileNoteCompactCount(node, viewCount);
        });
        document.querySelectorAll(`[data-profile-note-card-like-count="${CSS.escape(safeNoteId)}"]`).forEach(node => {
            setProfileNoteCompactCount(node, likeCount);
        });
        document.querySelectorAll(`[data-profile-note-card-like-toggle][data-note-id="${CSS.escape(safeNoteId)}"]`).forEach(button => {
            button.classList.toggle('is-active', liked);
            button.setAttribute('aria-pressed', liked ? 'true' : 'false');
            button.setAttribute('title', liked ? '좋아요 취소' : '좋아요');
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-solid', liked);
                icon.classList.toggle('fa-regular', !liked);
            }
        });
    };

    const updateProfileNoteReactionUi = (modal, data = {}) => {
        if (!modal) return;
        const viewCount = Number(data.viewCount ?? 0);
        const likeCount = Number(data.likeCount ?? 0);
        const liked = data.liked === true || data.liked === 'true';
        modal.querySelectorAll('[data-profile-note-view-count]').forEach(node => { setProfileNoteCompactCount(node, viewCount); });
        modal.querySelectorAll('[data-profile-note-like-count]').forEach(node => { setProfileNoteCompactCount(node, likeCount); });
        modal.querySelectorAll('[data-profile-note-like-toggle]').forEach(button => {
            button.classList.toggle('is-active', liked);
            button.setAttribute('aria-pressed', liked ? 'true' : 'false');
            button.setAttribute('aria-label', liked ? '좋아요 취소' : '좋아요');
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-solid', liked);
                icon.classList.toggle('fa-regular', !liked);
            }
        });
        updateProfileNoteCardReactionUi(modal.dataset.noteId, { viewCount, likeCount, liked });
    };

    const loadProfileNoteReaction = async (modal, recordView = false) => {
        if (!modal) return;
        const noteId = modal.dataset.noteId || '';
        if (!noteId) return;
        try {
            if (recordView && modal.dataset.viewRecorded !== 'true') {
                const viewBody = new URLSearchParams({ noteId });
                const viewResponse = await fetch(profileNoteApiUrl(modal, '/note/api/public/view'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
                    body: viewBody
                });
                const viewData = await viewResponse.json();
                if (viewResponse.ok && viewData.success) {
                    modal.dataset.viewRecorded = 'true';
                    const nextViewCount = Number(viewData.viewCount || 0);
                    modal.querySelectorAll('[data-profile-note-view-count]').forEach(node => {
                        setProfileNoteCompactCount(node, nextViewCount);
                    });
                    updateProfileNoteCardReactionUi(noteId, {
                        viewCount: nextViewCount,
                        likeCount: Number(modal.querySelector('[data-profile-note-like-count]')?.title?.replace(/,/g, '') || 0),
                        liked: modal.querySelector('[data-profile-note-like-toggle]')?.classList.contains('is-active')
                    });
                }
            }
            const response = await fetch(profileNoteApiUrl(modal, `/note/api/public/reaction?noteId=${encodeURIComponent(noteId)}`), {
                headers: { Accept: 'application/json' }
            });
            const data = await response.json();
            if (response.ok && data.success) updateProfileNoteReactionUi(modal, data);
        } catch (error) {
            console.warn('노트 반응 정보를 불러오지 못했습니다.', error);
        }
    };

    const toggleProfileNoteLike = async modal => {
        if (!modal) return;
        const body = new URLSearchParams({ noteId: modal.dataset.noteId || '' });
        const response = await fetch(profileNoteApiUrl(modal, '/note/api/public/like'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
            body
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || '좋아요를 처리하지 못했습니다.');
        updateProfileNoteReactionUi(modal, data);
    };

    const openProfileNoteDetail = modalId => {
        if (!modalId) return;
        const modal = document.getElementById(modalId);
        if (!modal) return;
        document.querySelectorAll('[data-profile-note-detail]:not([hidden])').forEach(opened => {
            opened.hidden = true;
            opened.classList.remove('profile-note-printing', 'is-note-scroll-mode', 'is-note-fit-mode', 'is-note-basic-mode', 'is-note-large-mode', 'is-note-dual-mode');
        });
        modal.hidden = false;
        modal.classList.add('is-review-collapsed');
        modal.classList.remove('is-note-scroll-mode', 'is-note-fit-mode', 'is-note-basic-mode', 'is-note-large-mode', 'is-note-dual-mode');
        const reviewToggle = modal.querySelector('[data-profile-note-review-toggle]');
        reviewToggle?.setAttribute('aria-expanded', 'false');
        const reviewLabel = reviewToggle?.querySelector('[data-profile-note-review-toggle-label]');
        if (reviewLabel) reviewLabel.textContent = '반응 보기';
        document.documentElement.classList.add('profile-note-modal-open');
        document.body.classList.add('profile-note-modal-open');
        modal.querySelectorAll('[data-profile-note-page-stage]').forEach(stage => {
            stage.dataset.profileNoteCurrentPage = '0';
            stage.dataset.profileNoteViewSize = NOTE_VIEW_SIZE_DEFAULT;
            stage.dataset.profileNoteViewMode = 'single';
        });
        const wrap = modal.querySelector('.profile-note-document-wrap');
        if (wrap) {
            wrap.scrollTop = 0;
            wrap.setAttribute('tabindex', '-1');
            setTimeout(() => wrap.focus({ preventScroll: true }), 0);
        }
        setTimeout(() => fitProfileNotePages(modal), 0);
        setTimeout(() => fitProfileNotePages(modal), 250);
        loadProfileNoteComments(modal);
        loadProfileNoteReaction(modal, true);
    };


    let profileNoteShareMounted = false;
    let profileNoteShareApi = null;

    function initProfileNoteShareModal() {
        if (profileNoteShareMounted) return;
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') return;
        if (!document.getElementById('profileNoteShareModal')) return;
        profileNoteShareApi = window.MoyoShareModal.init({
            contentType: 'NOTE',
            persist: true,
            shareMode: 'PERMISSION',
            enablePermission: true,
            bodyOpenClass: 'note-share-modal-open',
            reloadOnPersist: false,
            currentUserId: document.getElementById('profileNoteShareModal')?.dataset.currentUserId || document.body?.dataset.userId || '',
            ids: {
                openButton: 'profileNoteShareOpenHidden',
                permissionButton: 'profileNotePermissionOpenHidden',
                modal: 'profileNoteShareModal',
                keyword: 'profileNoteShareKeyword',
                applyButton: 'profileNoteShareApply',
                title: 'profileNoteShareModalTitle',
                context: 'profileNoteShareContext',
                candidates: 'profileNoteShareCandidates',
                selected: 'profileNoteShareSelected',
                hiddenFields: 'profileNoteShareHiddenFields',
                count: 'profileNoteShareCount',
                permissionCount: 'profileNotePermissionCount',
                modalCount: 'profileNoteShareModalCount',
                initialSharesSource: 'profileNoteShareInitialSource',
                workspaceMemberSource: 'profileNoteWorkspaceMemberSource',
                projectMemberSource: 'profileNoteProjectMemberSource',
                workspaceTargetSource: 'profileNoteWorkspaceTargetSource',
                projectTargetSource: 'profileNoteProjectTargetSource'
            }
        });
        profileNoteShareMounted = true;
    }

    function openProfileNoteShare(button, permissionMode) {
        const noteId = String(button?.dataset.noteId || button?.closest('[data-profile-note-detail]')?.dataset.noteId || '').trim();
        if (!noteId) return;

        const hidden = document.getElementById(permissionMode ? 'profileNotePermissionOpenHidden' : 'profileNoteShareOpenHidden');
        const shareOpen = document.getElementById('profileNoteShareOpenHidden');
        if (!hidden || !shareOpen) return;

        shareOpen.dataset.shareContentId = noteId;
        hidden.dataset.shareContentId = noteId;

        // 카드에서 바로 열 때도 공통 공유 모달이 로드된 뒤 확실히 마운트되도록 한다.
        initProfileNoteShareModal();
        if (permissionMode && profileNoteShareApi && typeof profileNoteShareApi.openPermission === 'function') {
            profileNoteShareApi.openPermission();
            return;
        }
        if (!permissionMode && profileNoteShareApi && typeof profileNoteShareApi.openShare === 'function') {
            profileNoteShareApi.openShare();
            return;
        }

        // 공통 모달 스크립트가 늦게 로드된 경우 한 프레임 뒤 다시 초기화한다.
        window.setTimeout(() => {
            initProfileNoteShareModal();
            if (permissionMode && profileNoteShareApi && typeof profileNoteShareApi.openPermission === 'function') {
                profileNoteShareApi.openPermission();
            } else if (!permissionMode && profileNoteShareApi && typeof profileNoteShareApi.openShare === 'function') {
                profileNoteShareApi.openShare();
            } else {
                hidden.click();
            }
        }, 0);
    }

    async function toggleProfileNotePin(button) {
        if (!button || button.disabled) return;
        const noteId = String(button.dataset.noteId || '').trim();
        if (!noteId) return;
        const pinned = button.dataset.pinned === 'true';
        button.disabled = true;
        try {
            const contextPath = String(window.MOYO_CONTEXT_PATH || '').replace(/\/$/, '');
            const response = await fetch(contextPath + (pinned ? '/note/api/unpin' : '/note/api/pin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: new URLSearchParams({ noteId })
            });
            const result = await response.json();
            if (!response.ok || !result || result.success !== true) throw new Error(result?.message || '중요 표시를 변경하지 못했습니다.');
            const next = !pinned;
            button.dataset.pinned = String(next);
            button.classList.toggle('is-pinned', next);
            button.setAttribute('aria-pressed', String(next));
            button.setAttribute('aria-label', next ? '중요 해제' : '중요 표시');
            button.title = next ? '중요 해제' : '중요 표시';
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-solid', next);
                icon.classList.toggle('fa-regular', !next);
            }
        } catch (error) {
            window.alert(error.message || '중요 표시를 변경하지 못했습니다.');
        } finally {
            button.disabled = false;
        }
    }

    const getContextPath = () => String(window.MOYO_CONTEXT_PATH || '').replace(/\/$/, '');

    const normalizeFolderDisplayName = value => {
        const text = String(value == null ? '' : value).trim();
        return text.replace(/^\/\s*/, '') || '미분류';
    };


    async function openProfileNoteCollect(button) {
        const noteId = String(button?.dataset.noteId || button?.closest('[data-profile-note-detail]')?.dataset.noteId || '').trim();
        if (!noteId || !window.CommonFolderModal || !window.NoteFolderAdapter) return;

        button.disabled = true;
        try {
            const response = await fetch(getContextPath() + '/note/api/folders?scope=PRIVATE', { headers: { Accept: 'application/json' } });
            const result = await response.json();
            if (!response.ok || !result || result.success !== true) throw new Error(result?.message || '폴더 목록을 불러오지 못했습니다.');

            let select = document.getElementById('profileNoteCollectFolderSelect');
            if (!select) {
                select = document.createElement('select');
                select.id = 'profileNoteCollectFolderSelect';
                select.className = 'note-folder-native-select';
                select.setAttribute('aria-hidden', 'true');
                document.body.appendChild(select);
            }
            select.innerHTML = '';
            const unclassified = document.createElement('option');
            unclassified.value = '';
            unclassified.textContent = '미분류';
            select.appendChild(unclassified);
            (Array.isArray(result.folders) ? result.folders : []).forEach(folder => {
                const option = document.createElement('option');
                option.value = String(folder.folderId || '');
                option.textContent = normalizeFolderDisplayName(folder.folderPath || folder.folderName || '폴더');
                option.dataset.depth = String(folder.depth || 0);
                select.appendChild(option);
            });
            select.value = '';

            window.CommonFolderModal.openSelect({
                title: '내 노트에 담기',
                description: '담아둘 개인 폴더를 선택하세요.',
                confirmLabel: '담기',
                instantSelect: false,
                showCurrent: false,
                unclassifiedLabel: '미분류',
                unclassifiedDescription: '폴더 없이 보관',
                folderDescription: '이 폴더에 담기',
                selectElement: select,
                trigger: button,
                adapter: window.NoteFolderAdapter,
                context: { scope: 'PRIVATE' },
                canManage: true,
                showManageActions: false,
                onConfirm: async function (folder) {
                    const collectResponse = await fetch(getContextPath() + '/note/api/collect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        body: new URLSearchParams({ noteId: noteId, folderId: folder.folderId || '' })
                    });
                    const collectResult = await collectResponse.json();
                    if (!collectResponse.ok || !collectResult || collectResult.success !== true) {
                        throw new Error(collectResult?.message || '노트를 담지 못했습니다.');
                    }
                    document.querySelectorAll('[data-profile-note-collect][data-note-id="' + CSS.escape(noteId) + '"]').forEach(node => {
                        node.classList.add('is-collected');
                        node.setAttribute('aria-pressed', 'true');
                        const span = node.querySelector('span');
                        if (span) span.textContent = '담음';
                    });
                    window.alert('내 노트에 담았습니다.');
                }
            });
        } catch (error) {
            window.alert(error.message || '폴더 목록을 불러오지 못했습니다.');
        } finally {
            button.disabled = false;
        }
    }

    async function deleteProfileNote(button) {
        const modal = button?.closest('[data-profile-note-detail]');
        const noteId = String(button?.dataset.noteId || modal?.dataset.noteId || '').trim();
        if (!noteId || !window.confirm('이 노트를 휴지통으로 이동할까요?')) return;
        button.disabled = true;
        try {
            const response = await fetch('/note/api/note/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: new URLSearchParams({ noteId })
            });
            const result = await response.json();
            if (!response.ok || !result || result.success !== true) throw new Error(result?.message || '노트를 삭제하지 못했습니다.');
            closeProfileNoteDetail(modal);
            document.querySelector('[data-profile-note-open="profileNoteDetail-' + CSS.escape(noteId) + '"]')?.closest('.profile-note-paper-card')?.remove();
        } catch (error) {
            window.alert(error.message || '노트를 삭제하지 못했습니다.');
        } finally {
            button.disabled = false;
        }
    }

    async function openProfileNoteFolderMove(button) {
        const modal = button?.closest('[data-profile-note-detail]');
        const noteId = String(button?.dataset.noteId || modal?.dataset.noteId || '').trim();
        if (!noteId || !modal || !window.CommonFolderModal || !window.NoteFolderAdapter) return;

        const scope = String(modal.dataset.noteScope || 'PRIVATE').toUpperCase();
        const params = new URLSearchParams({ scope });
        if (modal.dataset.noteWsId) params.set('wsId', modal.dataset.noteWsId);
        if (modal.dataset.noteProjId) params.set('projId', modal.dataset.noteProjId);

        button.disabled = true;
        try {
            const response = await fetch(getContextPath() + '/note/api/folders?' + params.toString(), { headers: { Accept: 'application/json' } });
            const result = await response.json();
            if (!response.ok || !result || result.success !== true) {
                throw new Error(result?.message || '폴더 목록을 불러오지 못했습니다.');
            }

            let select = document.getElementById('profileNoteMoveFolderSelect');
            if (!select) {
                select = document.createElement('select');
                select.id = 'profileNoteMoveFolderSelect';
                select.className = 'note-folder-native-select';
                select.setAttribute('aria-hidden', 'true');
                document.body.appendChild(select);
            }

            select.innerHTML = '';
            const unclassified = document.createElement('option');
            unclassified.value = '';
            unclassified.textContent = '미분류';
            select.appendChild(unclassified);

            (Array.isArray(result.folders) ? result.folders : []).forEach(folder => {
                const option = document.createElement('option');
                option.value = String(folder.folderId || '');
                option.textContent = normalizeFolderDisplayName(folder.folderPath || folder.folderName || '폴더');
                option.dataset.depth = String(folder.depth || 0);
                select.appendChild(option);
            });

            const currentFolderId = String(modal.dataset.noteFolderId || '');
            select.value = Array.from(select.options).some(option => String(option.value || '') === currentFolderId)
                ? currentFolderId
                : '';

            window.CommonFolderModal.openSelect({
                title: '폴더로 이동',
                description: '이동할 폴더를 선택하세요.',
                confirmLabel: '이동',
                instantSelect: false,
                showCurrent: true,
                unclassifiedLabel: '미분류',
                unclassifiedDescription: currentFolderId === '' ? '현재 위치' : '폴더 없이 보관',
                folderDescription: '이 폴더로 이동',
                selectElement: select,
                trigger: button,
                adapter: window.NoteFolderAdapter,
                context: {
                    scope,
                    wsId: modal.dataset.noteWsId || '',
                    projId: modal.dataset.noteProjId || ''
                },
                canManage: true,
                showManageActions: false,
                itemDescription: function (folder) {
                    if (folder.isCurrent) return '현재 위치';
                    if (!folder.folderId) return '폴더 없이 보관';
                    return '이 폴더로 이동';
                },
                onConfirm: async function (folder) {
                    const selectedId = String(folder.folderId || '');
                    if (selectedId === currentFolderId) return;

                    const moveResponse = await fetch(getContextPath() + '/note/api/folder/move-note', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        body: new URLSearchParams({ noteId, folderId: selectedId })
                    });
                    const moveResult = await moveResponse.json();
                    if (!moveResponse.ok || !moveResult || moveResult.success !== true) {
                        throw new Error(moveResult?.message || '폴더를 이동하지 못했습니다.');
                    }

                    modal.dataset.noteFolderId = selectedId;
                    const folderNode = modal.querySelector('[data-profile-note-folder-name]')
                        || modal.querySelector('.profile-note-detail-meta-item:not(.is-public)');
                    if (folderNode) {
                        const nameNode = folderNode.querySelector('[data-folder-name]');
                        if (nameNode) nameNode.textContent = folder.folderName;
                        else if (folderNode.querySelector('i')) {
                            const textNode = Array.from(folderNode.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                            if (textNode) textNode.nodeValue = ' ' + folder.folderName;
                            else folderNode.append(document.createTextNode(' ' + folder.folderName));
                        } else {
                            folderNode.textContent = folder.folderName;
                        }
                    }
                    window.alert('폴더를 이동했습니다.');
                }
            });
        } catch (error) {
            window.alert(error.message || '폴더를 이동하지 못했습니다.');
        } finally {
            button.disabled = false;
        }
    }


    function printProfileNotePages(modal) {
        const stage = modal.querySelector('[data-profile-note-page-stage]');
        const stack = stage?.querySelector('[data-profile-note-page-stack]');
        if (!stack) return;

        // 화면 모드와 관계없이 분리된 전체 A4 페이지를 순서대로 인쇄한다.
        const pageCount = stack.querySelectorAll('[data-profile-note-page]').length || paginateProfileNote(stage);
        if (!pageCount) return;

        const pages = Array.from(stack.querySelectorAll('[data-profile-note-page]'));
        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        Object.assign(iframe.style, {
            position: 'fixed',
            width: '0',
            height: '0',
            right: '0',
            bottom: '0',
            border: '0',
            visibility: 'hidden'
        });
        document.body.appendChild(iframe);

        const printDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (!printDocument) {
            iframe.remove();
            return;
        }

        const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(node => node.outerHTML)
            .join('\n');

        const pageMarkup = pages.map(page => {
            const clone = page.cloneNode(true);
            clone.removeAttribute('data-profile-note-page-template');
            clone.classList.remove('is-active', 'is-left-page', 'is-right-page');
            clone.querySelectorAll('[hidden]').forEach(node => node.removeAttribute('hidden'));
            return clone.outerHTML;
        }).join('');

        printDocument.open();
        printDocument.write(`<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>노트 인쇄</title>
${styleNodes}
<style>
    @page { size: A4 portrait; margin: 0; }
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        min-height: 297mm !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    body { overflow: visible !important; }
    .profile-note-print-pages {
        display: block !important;
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
    }
    .profile-note-print-pages .profile-note-page,
    .profile-note-print-pages .profile-note-document {
        position: relative !important;
        display: block !important;
        visibility: visible !important;
        box-sizing: border-box !important;
        width: 210mm !important;
        min-width: 210mm !important;
        max-width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 72px 68px !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
        transform: none !important;
        inset: auto !important;
        opacity: 1 !important;
        overflow: hidden !important;
        break-after: page !important;
        page-break-after: always !important;
    }
    .profile-note-print-pages .profile-note-document.is-continuation {
        padding-top: 66px !important;
    }
    .profile-note-print-pages .profile-note-page:last-child,
    .profile-note-print-pages .profile-note-document:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
    }
    .profile-note-print-pages .profile-note-document-body {
        box-sizing: border-box !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: hidden !important;
        transform: none !important;
    }
    .profile-note-page-footer,
    .profile-note-page-nav,
    .profile-note-page-turn,
    .profile-note-page-toolbar,
    .profile-note-detail-head,
    .profile-note-review-panel,
    .profile-note-review-toggle { display: none !important; }
</style>
</head>
<body><main class="profile-note-print-pages">${pageMarkup}</main></body>
</html>`);
        printDocument.close();

        const cleanup = () => setTimeout(() => iframe.remove(), 500);
        const runPrint = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } finally {
                cleanup();
            }
        };

        // 외부 CSS와 이미지가 인쇄 문서에 반영될 시간을 확보한다.
        const images = Array.from(printDocument.images || []);
        const imageReady = images.map(image => image.complete
            ? Promise.resolve()
            : new Promise(resolve => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
            }));

        Promise.all(imageReady).then(() => setTimeout(runPrint, 120));
    }

    document.addEventListener('click', event => {
        // 더보기 메뉴는 바깥 영역을 누르거나 다른 더보기 메뉴를 누르면 닫는다.
        document.querySelectorAll('details.profile-note-detail-more[open]').forEach(details => {
            if (!details.contains(event.target)) details.removeAttribute('open');
        });

        const cardLikeToggle = event.target.closest && event.target.closest('[data-profile-note-card-like-toggle]');
        if (cardLikeToggle) {
            event.preventDefault();
            event.stopPropagation();
            if (cardLikeToggle.classList.contains('is-loading')) return;
            const modalId = cardLikeToggle.dataset.modalId || `profileNoteDetail-${cardLikeToggle.dataset.noteId || ''}`;
            const modal = document.getElementById(modalId);
            if (!modal) return;
            cardLikeToggle.classList.add('is-loading');
            toggleProfileNoteLike(modal)
                .catch(error => window.alert(error.message))
                .finally(() => cardLikeToggle.classList.remove('is-loading'));
            return;
        }

        const cardCommentOpen = event.target.closest && event.target.closest('[data-profile-note-card-comment-open]');
        if (cardCommentOpen) {
            event.preventDefault();
            event.stopPropagation();
            const modalId = cardCommentOpen.dataset.profileNoteCardCommentOpen;
            openProfileNoteDetail(modalId);
            const modal = document.getElementById(modalId);
            const reviewToggle = modal?.querySelector('[data-profile-note-review-toggle]');
            if (modal?.classList.contains('is-review-collapsed')) reviewToggle?.click();
            return;
        }

        const cardShare = event.target.closest && event.target.closest('[data-profile-note-card-share]');
        if (cardShare) {
            event.preventDefault();
            event.stopPropagation();
            openProfileNoteShare(cardShare, false);
            return;
        }

        const cardCollect = event.target.closest && event.target.closest('[data-profile-note-card-collect]');
        if (cardCollect) {
            event.preventDefault();
            event.stopPropagation();
            openProfileNoteCollect(cardCollect);
            return;
        }

        const opener = event.target.closest && event.target.closest('[data-profile-note-open]');
        if (opener) {
            event.preventDefault();
            openProfileNoteDetail(opener.dataset.profileNoteOpen);
            return;
        }

        if (event.target.closest && event.target.closest('[data-profile-note-close]')) {
            event.preventDefault();
            closeProfileNoteDetail(event.target.closest('[data-profile-note-detail]'));
            return;
        }

        const noteLikeToggle = event.target.closest && event.target.closest('[data-profile-note-like-toggle]');
        if (noteLikeToggle) {
            event.preventDefault();
            const modal = noteLikeToggle.closest('[data-profile-note-detail]');
            noteLikeToggle.disabled = true;
            toggleProfileNoteLike(modal)
                .catch(error => window.alert(error.message))
                .finally(() => { noteLikeToggle.disabled = false; });
            return;
        }

        const reviewToggle = event.target.closest && event.target.closest('[data-profile-note-review-toggle]');
        if (reviewToggle) {
            event.preventDefault();
            const modal = reviewToggle.closest('[data-profile-note-detail]');
            const stage = getProfileNoteStage(reviewToggle);
            const willOpen = modal.classList.contains('is-review-collapsed');
            if (willOpen) loadProfileNoteComments(modal);
            const collapsed = modal.classList.toggle('is-review-collapsed');
            reviewToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            const label = reviewToggle.querySelector('[data-profile-note-review-toggle-label]');
            if (label) label.textContent = collapsed ? '반응 보기' : '반응 닫기';
            setTimeout(() => fitProfileNotePages(modal), 230);
            return;
        }

        const mentionOption = event.target.closest && event.target.closest('[data-profile-note-mention-user]');
        if (mentionOption) {
            event.preventDefault();
            const modal = mentionOption.closest('[data-profile-note-detail]');
            const input = modal?.querySelector('[data-profile-note-comment-input]');
            if (input) applyProfileNoteMention(input, mentionOption.dataset.profileNoteMentionUser || '');
            return;
        }

        const commentDelete = event.target.closest && event.target.closest('[data-profile-note-comment-delete]');
        if (commentDelete) {
            event.preventDefault();
            const modal = commentDelete.closest('[data-profile-note-detail]');
            const item = commentDelete.closest('[data-reply-id]');
            if (modal && item && window.confirm('댓글을 삭제할까요?')) {
                mutateProfileNoteComment(modal, item.dataset.replyId, 'delete').catch(error => window.alert(error.message));
            }
            return;
        }

        const commentLike = event.target.closest && event.target.closest('[data-profile-note-comment-like]');
        if (commentLike) {
            event.preventDefault();
            const modal = commentLike.closest('[data-profile-note-detail]');
            const item = commentLike.closest('[data-reply-id]');
            if (modal && item) {
                toggleProfileNoteCommentLike(modal, item.dataset.replyId)
                    .catch(error => window.alert(error.message));
            }
            return;
        }

        const commentReply = event.target.closest && event.target.closest('[data-profile-note-comment-reply]');
        if (commentReply) {
            event.preventDefault();
            const modal = commentReply.closest('[data-profile-note-detail]');
            const item = commentReply.closest('[data-reply-id]');
            if (!modal || !item) return;
            setProfileNoteCommentComposer(modal, {
                mode: 'reply',
                replyId: item.dataset.replyId,
                parentReplyId: commentReply.dataset.rootReplyId || item.dataset.parentReplyId || item.dataset.replyId,
                targetName: commentReply.dataset.replyTargetName || item.querySelector('.profile-note-comment-name')?.textContent?.trim() || ''
            });
            return;
        }

        const composerCancel = event.target.closest && event.target.closest('[data-profile-note-composer-cancel]');
        if (composerCancel) {
            event.preventDefault();
            resetProfileNoteCommentComposer(composerCancel.closest('[data-profile-note-detail]'));
            return;
        }

        const commentEdit = event.target.closest && event.target.closest('[data-profile-note-comment-edit]');
        if (commentEdit) {
            event.preventDefault();
            const modal = commentEdit.closest('[data-profile-note-detail]');
            const item = commentEdit.closest('[data-reply-id]');
            const content = item?.querySelector('.profile-note-comment-content')?.textContent || '';
            if (!modal || !item) return;
            setProfileNoteCommentComposer(modal, {
                mode: 'edit',
                replyId: item.dataset.replyId,
                content
            });
            return;
        }

        const sizeToggle = event.target.closest && event.target.closest('[data-profile-note-size-toggle]');
        if (sizeToggle) {
            event.preventDefault();
            const stage = getProfileNoteStage(sizeToggle);
            if (!stage) return;
            const modal = sizeToggle.closest('[data-profile-note-detail]');
            const requested = sizeToggle.dataset.noteViewSize || NOTE_VIEW_SIZE_DEFAULT;
            stage.dataset.profileNoteViewSize = NOTE_VIEW_SIZE_SCALE[requested] ? requested : NOTE_VIEW_SIZE_DEFAULT;
            stage.dataset.profileNoteViewMode = 'single';
            fitProfileNotePages(modal);
            return;
        }

        const spreadToggle = event.target.closest && event.target.closest('[data-profile-note-spread-toggle]');
        if (spreadToggle) {
            event.preventDefault();
            const stage = getProfileNoteStage(spreadToggle);
            if (!stage) return;
            if (!isProfileNoteSpreadAllowed()) {
                stage.dataset.profileNoteViewMode = 'single';
                fitProfileNotePages(spreadToggle.closest('[data-profile-note-detail]'));
                return;
            }
            const modal = spreadToggle.closest('[data-profile-note-detail]');
            const pageCount = stage.querySelectorAll('[data-profile-note-page]').length || paginateProfileNote(stage);
            const current = parseInt(stage.dataset.profileNoteCurrentPage || '0', 10) || 0;
            stage.dataset.profileNoteViewMode = 'spread';
            stage.dataset.profileNoteCurrentPage = String(normalizeProfileNotePageIndex(stage, current, pageCount));
            fitProfileNotePages(modal);
            return;
        }

        if (event.target.closest && event.target.closest('[data-profile-note-page-prev]')) {
            event.preventDefault();
            moveProfileNotePage(getProfileNoteStage(event.target), -1);
            return;
        }

        if (event.target.closest && event.target.closest('[data-profile-note-page-next]')) {
            event.preventDefault();
            moveProfileNotePage(getProfileNoteStage(event.target), 1);
            return;
        }

        const collectButton = event.target.closest && event.target.closest('[data-profile-note-collect]');
        if (collectButton) {
            event.preventDefault();
            openProfileNoteCollect(collectButton);
            return;
        }

        if (event.target.closest && event.target.closest('[data-profile-note-collect-close]')) {
            event.preventDefault();
            closeProfileNoteCollect();
            return;
        }

        const collectApply = event.target.closest && event.target.closest('[data-profile-note-collect-apply]');
        if (collectApply) {
            event.preventDefault();
            applyProfileNoteCollect(collectApply);
            return;
        }

        const shareButton = event.target.closest && event.target.closest('[data-profile-note-share]');
        if (shareButton) {
            event.preventDefault();
            openProfileNoteShare(shareButton, false);
            shareButton.closest('details')?.removeAttribute('open');
            return;
        }

        const permissionButton = event.target.closest && event.target.closest('[data-profile-note-permission]');
        if (permissionButton) {
            event.preventDefault();
            openProfileNoteShare(permissionButton, true);
            permissionButton.closest('details')?.removeAttribute('open');
            return;
        }

        const pinButton = event.target.closest && event.target.closest('[data-profile-note-pin]');
        if (pinButton) {
            event.preventDefault();
            toggleProfileNotePin(pinButton);
            return;
        }

        const folderMoveButton = event.target.closest && event.target.closest('[data-profile-note-folder-move]');
        if (folderMoveButton) {
            event.preventDefault();
            folderMoveButton.closest('details')?.removeAttribute('open');
            openProfileNoteFolderMove(folderMoveButton);
            return;
        }

        const deleteButton = event.target.closest && event.target.closest('[data-profile-note-delete]');
        if (deleteButton) {
            event.preventDefault();
            deleteButton.closest('details')?.removeAttribute('open');
            deleteProfileNote(deleteButton);
            return;
        }

        const printButton = event.target.closest && event.target.closest('[data-profile-note-print]');
        if (printButton) {
            event.preventDefault();
            const modal = printButton.closest('[data-profile-note-detail]');
            if (!modal) return;
            printProfileNotePages(modal);
            return;
        }

        const notePlaceholderAction = event.target.closest && event.target.closest('[data-profile-note-placeholder]');
        if (notePlaceholderAction) {
            event.preventDefault();
            event.stopPropagation();
        }
    });

    document.addEventListener('keydown', event => {
        const modal = document.querySelector('[data-profile-note-detail]:not([hidden])');
        if (!modal) return;
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isTyping = ['input', 'textarea', 'select'].includes(activeTag) || document.activeElement?.isContentEditable;
        if (event.key === 'Escape') {
            const openedMoreMenus = Array.from(modal.querySelectorAll('details.profile-note-detail-more[open]'));
            if (openedMoreMenus.length) {
                openedMoreMenus.forEach(details => details.removeAttribute('open'));
                event.preventDefault();
                return;
            }
            const shareModal = document.getElementById('profileNoteShareModal');
            if (shareModal && !shareModal.hidden) return;
            closeProfileNoteDetail(modal);
        }
        if (isTyping) return;
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveProfileNotePage(getProfileNoteStage(modal), -1);
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveProfileNotePage(getProfileNoteStage(modal), 1);
        }
        if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
            const step = event.key === 'ArrowDown' ? 420 : Math.floor(window.innerHeight * .92);
            if (scrollProfileNoteDetail(modal, step)) event.preventDefault();
        }
        if (['ArrowUp', 'PageUp'].includes(event.key)) {
            const step = event.key === 'ArrowUp' ? -420 : -Math.floor(window.innerHeight * .92);
            if (scrollProfileNoteDetail(modal, step)) event.preventDefault();
        }
        if (event.key === 'Home' && modal.classList.contains('is-note-large-mode')) {
            const wrap = modal.querySelector('.profile-note-document-wrap');
            if (wrap) { event.preventDefault(); wrap.scrollTo({ top: 0, behavior: 'auto' }); }
        }
        if (event.key === 'End' && modal.classList.contains('is-note-large-mode')) {
            const wrap = modal.querySelector('.profile-note-document-wrap');
            if (wrap) { event.preventDefault(); wrap.scrollTo({ top: wrap.scrollHeight, behavior: 'auto' }); }
        }
    });

    document.addEventListener('wheel', event => {
        const modal = document.querySelector('[data-profile-note-detail]:not([hidden])');
        if (!modal || !modal.classList.contains('is-note-large-mode')) return;
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isTyping = ['input', 'textarea', 'select'].includes(activeTag) || document.activeElement?.isContentEditable;
        if (isTyping) return;
        const delta = getProfileNoteWheelDelta(event);
        if (scrollProfileNoteDetail(modal, delta)) {
            event.preventDefault();
        }
    }, { passive: false });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initProfileNoteShareModal, { once: true });
    else initProfileNoteShareModal();


    document.addEventListener('click', event => {
        if (event.target.closest?.('[data-profile-note-comment-form]')) return;
        document.querySelectorAll('[data-profile-note-mention-list]:not([hidden])').forEach(list => {
            list.hidden = true;
            list.innerHTML = '';
        });
    });

    document.addEventListener('submit', event => {
        const form = event.target.closest && event.target.closest('[data-profile-note-comment-form]');
        if (!form) return;
        event.preventDefault();
        submitProfileNoteComment(form);
    });

    document.addEventListener('input', event => {
        const input = event.target.closest && event.target.closest('[data-profile-note-comment-input]');
        if (!input) return;
        input.style.height = 'auto';
        const maxHeight = 96;
        input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
        input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
        renderProfileNoteMentionList(input);
    });

    document.addEventListener('keydown', event => {
        const cardOpener = event.target.closest && event.target.closest('[data-profile-note-open]');
        if (cardOpener && event.target === cardOpener && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openProfileNoteDetail(cardOpener.dataset.profileNoteOpen);
            return;
        }

        const input = event.target.closest && event.target.closest('[data-profile-note-comment-input]');
        if (!input || event.isComposing) return;
        const modal = input.closest('[data-profile-note-detail]');
        const mentionList = modal?.querySelector('[data-profile-note-mention-list]');
        const mentionOptions = mentionList && !mentionList.hidden
            ? Array.from(mentionList.querySelectorAll('[data-profile-note-mention-user]'))
            : [];
        if (mentionOptions.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            const current = Math.max(0, mentionOptions.findIndex(option => option.classList.contains('is-active')));
            const next = event.key === 'ArrowDown'
                ? (current + 1) % mentionOptions.length
                : (current - 1 + mentionOptions.length) % mentionOptions.length;
            mentionOptions.forEach(option => option.classList.remove('is-active'));
            mentionOptions[next].classList.add('is-active');
            mentionOptions[next].scrollIntoView({ block: 'nearest' });
            return;
        }
        if (mentionOptions.length && event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const active = mentionOptions.find(option => option.classList.contains('is-active')) || mentionOptions[0];
            applyProfileNoteMention(input, active.dataset.profileNoteMentionUser || '');
            return;
        }
        if (event.key === 'Escape' && mentionList && !mentionList.hidden) {
            event.preventDefault();
            closeProfileNoteMentionList(modal);
            return;
        }
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitProfileNoteComment(input.closest('[data-profile-note-comment-form]'));
        }
    });

    window.addEventListener('resize', () => fitProfileNotePages(document.querySelector('[data-profile-note-detail]:not([hidden])')));

    window.addEventListener('afterprint', () => {
        document.querySelectorAll('.profile-note-printing').forEach(modal => modal.classList.remove('profile-note-printing'));
    });
})();
