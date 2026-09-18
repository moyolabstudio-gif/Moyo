(function (window, document) {
    'use strict';

    let activeOverlay = null;

    function pick(source) {
        if (!source) return null;
        for (let i = 1; i < arguments.length; i += 1) {
            const key = arguments[i];
            if (source[key] !== undefined && source[key] !== null) return source[key];
        }
        return null;
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeRichContentForDisplay(html, contextPath) {
        const text = String(html || '');
        const base = String(contextPath || '').replace(/\/$/, '');
        if (!text || !base || !text.includes('/upload/')) return text;

        const wrap = document.createElement('div');
        wrap.innerHTML = text;
        wrap.querySelectorAll('[src],[href]').forEach(function (node) {
            ['src', 'href'].forEach(function (attr) {
                if (!node.hasAttribute(attr)) return;
                const value = String(node.getAttribute(attr) || '').trim();
                if (value.startsWith('/upload/')) {
                    node.setAttribute(attr, base + value);
                }
            });
        });
        return wrap.innerHTML;
    }

    function typeLabel(type) {
        const value = String(type || '').toUpperCase();
        if (value === 'CREATE') return '최초 작성';
        if (value === 'RESTORE') return '복원';
        return '수정';
    }

    function toDate(value) {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function pad(value) { return String(value).padStart(2, '0'); }

    function fullDate(value) {
        const date = toDate(value);
        if (!date) return '';
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function listDate(value) {
        const date = toDate(value);
        if (!date) return '';
        return pad(date.getMonth() + 1) + '.' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function close() {
        if (activeOverlay) activeOverlay.remove();
        activeOverlay = null;
        document.documentElement.classList.remove('moyo-note-history-open');
        document.body.classList.remove('moyo-note-history-open');
    }

    async function defaultRequest(url, options) {
        const response = await fetch(url, Object.assign({
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        }, options || {}));
        const text = await response.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (ignore) { data = text; }
        }
        if (!response.ok) {
            throw new Error((data && (data.message || data.error)) || '요청을 처리하지 못했습니다.');
        }
        return data;
    }

    function currentVersionId(versions) {
        if (!versions.length) return '';
        const explicit = versions.find(function (version) {
            return pick(version, 'current', 'CURRENT', 'isCurrent', 'IS_CURRENT') === true ||
                String(pick(version, 'currentYn', 'CURRENT_YN') || '').toUpperCase() === 'Y';
        });
        const current = explicit || versions.reduce(function (latest, version) {
            const latestNo = Number(pick(latest, 'versionNo', 'VERSION_NO') || 0);
            const versionNo = Number(pick(version, 'versionNo', 'VERSION_NO') || 0);
            return versionNo > latestNo ? version : latest;
        }, versions[0]);
        return String(pick(current, 'noteVersionId', 'NOTE_VERSION_ID') || '');
    }

    async function open(options) {
        const config = Object.assign({
            contextPath: '',
            noteTitle: '노트',
            canRestore: false,
            request: defaultRequest,
            confirmRestore: true
        }, options || {});
        const noteId = String(config.noteId || '').trim();
        if (!noteId) throw new Error('노트 ID가 없습니다.');

        const apiBase = String(config.contextPath || '').replace(/\/$/, '');
        const versions = await config.request(apiBase + '/api/notes/' + encodeURIComponent(noteId) + '/versions');
        const items = Array.isArray(versions) ? versions.slice() : [];
        items.sort(function (a, b) {
            return Number(pick(b, 'versionNo', 'VERSION_NO') || 0) - Number(pick(a, 'versionNo', 'VERSION_NO') || 0);
        });
        const currentId = currentVersionId(items);

        close();
        const overlay = document.createElement('div');
        activeOverlay = overlay;
        overlay.className = 'moyo-note-history-overlay';
        overlay.setAttribute('data-common-note-history-modal', '');
        overlay.innerHTML = '<section class="moyo-note-history" role="dialog" aria-modal="true" aria-labelledby="moyoNoteHistoryTitle">' +
            '<header><div><h3 id="moyoNoteHistoryTitle">노트 이력</h3><p>' + esc(config.noteTitle) + '</p></div>' +
            '<button type="button" data-common-note-history-close aria-label="닫기"><i class="fa-solid fa-xmark"></i></button></header>' +
            '<div class="moyo-note-history__body"><nav data-common-note-version-list aria-label="노트 버전"></nav>' +
            '<article><h4 data-common-note-version-title></h4><div class="moyo-note-history__info" data-common-note-version-info></div>' +
            '<iframe sandbox="allow-same-origin" data-common-note-version-preview title="노트 버전 미리보기"></iframe>' +
            '<button type="button" class="moyo-note-history__restore" data-common-note-version-restore hidden>이 버전으로 복원</button></article></div>' +
            '</section>';
        document.body.appendChild(overlay);
        document.documentElement.classList.add('moyo-note-history-open');
        document.body.classList.add('moyo-note-history-open');

        const list = overlay.querySelector('[data-common-note-version-list]');
        const title = overlay.querySelector('[data-common-note-version-title]');
        const info = overlay.querySelector('[data-common-note-version-info]');
        const preview = overlay.querySelector('[data-common-note-version-preview]');
        const restore = overlay.querySelector('[data-common-note-version-restore]');
        let selected = null;

        function selectVersion(version, button) {
            selected = version;
            list.querySelectorAll('button').forEach(function (node) {
                node.classList.toggle('is-active', node === button);
            });
            const versionId = String(pick(version, 'noteVersionId', 'NOTE_VERSION_ID') || '');
            const no = pick(version, 'versionNo', 'VERSION_NO');
            const changeType = pick(version, 'changeType', 'CHANGE_TYPE');
            const userName = pick(version, 'changedByName', 'CHANGED_BY_NAME') || '알 수 없음';
            const changedAt = fullDate(pick(version, 'changedAt', 'CHANGED_AT'));
            const isCurrent = versionId !== '' && versionId === currentId;
            title.textContent = 'v' + no + ' · ' + (pick(version, 'noteTitle', 'NOTE_TITLE') || '새 노트');
            info.textContent = typeLabel(changeType) + ' · ' + userName + (changedAt ? ' · ' + changedAt : '');
            const content = normalizeRichContentForDisplay(
                String(pick(version, 'noteContent', 'NOTE_CONTENT') || ''),
                apiBase
            );
            const previewBase = window.location.origin + (apiBase || '') + '/';
            preview.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base href="' + esc(previewBase) + '"><style>body{font-family:Arial,sans-serif;padding:18px;color:#24324a;font-size:14px;line-height:1.65}img{max-width:100%;height:auto}table{border-collapse:collapse}td,th{border:1px solid #d9e2ef;padding:6px}</style></head><body>' + content + '</body></html>';
            restore.hidden = !config.canRestore || isCurrent;
            restore.dataset.noteVersionId = versionId;
        }

        if (!items.length) {
            list.innerHTML = '<div class="moyo-note-history__empty">저장된 이력이 없습니다.</div>';
            restore.hidden = true;
        } else {
            items.forEach(function (version) {
                const button = document.createElement('button');
                button.type = 'button';
                const versionId = String(pick(version, 'noteVersionId', 'NOTE_VERSION_ID') || '');
                const no = pick(version, 'versionNo', 'VERSION_NO');
                const type = pick(version, 'changeType', 'CHANGE_TYPE');
                const user = pick(version, 'changedByName', 'CHANGED_BY_NAME') || '알 수 없음';
                const date = listDate(pick(version, 'changedAt', 'CHANGED_AT'));
                const isCurrent = versionId !== '' && versionId === currentId;
                button.innerHTML = '<strong>v' + esc(no) + '</strong><span><b>' + esc(user) + '</b><small>' + esc(date) + '</small></span><em>' + esc(isCurrent ? '현재' : typeLabel(type)) + '</em>';
                button.addEventListener('click', function () { selectVersion(version, button); });
                list.appendChild(button);
                if (isCurrent) selectVersion(version, button);
            });
        }

        overlay.addEventListener('click', async function (event) {
            if (event.target === overlay || event.target.closest('[data-common-note-history-close]')) {
                close();
                return;
            }
            const restoreButton = event.target.closest('[data-common-note-version-restore]');
            if (!restoreButton || !selected || !config.canRestore || restoreButton.hidden) return;
            if (config.confirmRestore && !window.confirm('선택한 버전으로 복원할까요?\n현재 내용도 이력에 남고, 복원 내용이 새 최신 버전으로 저장됩니다.')) return;
            restoreButton.disabled = true;
            try {
                const result = await config.request(apiBase + '/api/notes/' + encodeURIComponent(noteId) + '/versions/' + encodeURIComponent(restoreButton.dataset.noteVersionId) + '/restore', { method: 'POST' });
                close();
                if (typeof config.onRestored === 'function') await config.onRestored(result, selected);
            } catch (error) {
                window.alert(error.message || '복원하지 못했습니다.');
                restoreButton.disabled = false;
            }
        });

        const currentButton = Array.from(list.querySelectorAll('button')).find(function (button) { return button.classList.contains('is-active'); });
        if (!currentButton && list.querySelector('button')) list.querySelector('button').click();
        return overlay;
    }

    window.CommonNoteHistoryModal = { open: open, close: close };
})(window, document);
