(function (window, document) {
    'use strict';

    const TYPES = ['NOTE', 'PHOTO', 'FILE', 'LINK', 'LOCATION'];
    const TYPE_LABEL = { NOTE: '노트', PHOTO: '사진', FILE: '파일', LINK: '링크', LOCATION: '장소' };

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }
    function pick(obj) {
        const keys = Array.prototype.slice.call(arguments, 1);
        for (const key of keys) if (obj && obj[key] != null) return obj[key];
        return '';
    }
    function formatTargetLabel(value) {
        const label = String(value == null ? '' : value).trim();
        if (!label) return '일정과 관련된 내용을 한곳에 남깁니다.';
        if (label === '담당자 공개') return '공개 범위 · 담당자';
        if (label === '프로젝트 전체 공개') return '공개 범위 · 프로젝트 전체';
        if (label.endsWith(' 공개')) return '공개 범위 · ' + label.slice(0, -3).trim();
        return label;
    }
    function normalizeType(item) {
        const raw = String(pick(item, 'recordType', 'RECORD_TYPE', 'contentType', 'CONTENT_TYPE') || '').toUpperCase();
        return raw === 'PHOTO_POST' ? 'PHOTO' : raw;
    }
    function itemTitle(item, type) {
        return pick(item, 'title', 'TITLE', 'linkTitle', 'LINK_TITLE', 'locationText', 'LOCATION_TEXT', 'originalName', 'ORIGINAL_NAME') || TYPE_LABEL[type];
    }
    function itemPreview(item) {
        return pick(item, 'previewContent', 'PREVIEW_CONTENT', 'description', 'DESCRIPTION', 'memo', 'MEMO', 'locationAddress', 'LOCATION_ADDRESS');
    }
    function noteTabName(item, index) {
        const title = String(itemTitle(item, 'NOTE') || '').trim();
        if (title && title !== '노트') return title;
        const preview = String(itemPreview(item) || '').replace(/\s+/g, ' ').trim();
        return preview ? preview.slice(0, 14) : '노트 ' + (index + 1);
    }

    function create(options) {
        const config = Object.assign({
            modalId: 'commonContentRecordModal',
            contextPath: '',
            targetLabel: '',
            ensureDraft: null,
            onCreateNote: null,
            onCreatePhoto: null,
            onUploadFile: null,
            onSearchLocation: null,
            onChanged: null,
            onTypeViewed: null,
            onItemViewed: null
        }, options || {});

        const root = document.getElementById(config.modalId);
        if (!root) return null;
        if (root.__moyoRecordInstance) return root.__moyoRecordInstance;

        const el = {
            label: root.querySelector('[data-record-target-label]'),
            permission: root.querySelector('[data-record-permission-note]'),
            tabs: Array.from(root.querySelectorAll('[data-record-tab]')),
            counts: Array.from(root.querySelectorAll('[data-record-count]')),
            sections: Array.from(root.querySelectorAll('[data-record-section]')),
            forms: Array.from(root.querySelectorAll('[data-record-form]')),
            loading: root.querySelector('[data-record-loading]'),
            noteTabs: root.querySelector('[data-record-note-tabs]'),
            noteEditor: root.querySelector('[data-record-note-editor]'),
            photoList: root.querySelector('[data-record-photo-list]'),
            photoForm: root.querySelector('[data-record-form="PHOTO"]'),
            photoInput: root.querySelector('[data-record-photo-input]'),
            photoDropzone: root.querySelector('[data-record-photo-dropzone]'),
            fileList: root.querySelector('[data-record-file-list]'),
            fileListWrap: root.querySelector('[data-record-file-list-wrap]'),
            fileForm: root.querySelector('[data-record-form="FILE"]'),
            fileInput: root.querySelector('[data-record-file-input]'),
            fileDropzone: root.querySelector('[data-record-file-dropzone]'),
            linkList: root.querySelector('[data-record-link-list]'),
            linkListWrap: root.querySelector('[data-record-link-list-wrap]'),
            linkForm: root.querySelector('[data-record-form="LINK"]'),
            linkCancel: root.querySelector('[data-record-link-cancel]'),
            linkSubmit: root.querySelector('.moyo-record-link-submit'),
            linkSubmitLabel: root.querySelector('[data-record-link-submit-label]'),
            linkAdd: root.querySelector('[data-record-link-add]'),
            locationCurrent: root.querySelector('[data-record-location-current]'),
            locationListWrap: root.querySelector('[data-record-location-list-wrap]'),
            locationEmpty: root.querySelector('[data-record-empty="LOCATION"]'),
            locationForm: root.querySelector('[data-record-form="LOCATION"]'),
            locationSubmit: root.querySelector('[data-record-location-submit]'),
            locationCancel: root.querySelector('[data-record-location-cancel]'),
            locationDetail: root.querySelector('[data-record-location-detail]'),
            locationPreview: root.querySelector('[data-record-location-preview]'),
            locationPreviewAddress: root.querySelector('[data-record-location-preview-address]'),
            locationMap: root.querySelector('[data-record-location-map]'),
            locationMapOpen: root.querySelector('[data-record-location-map-open]'),
            locationAdd: root.querySelector('[data-record-location-add]')
        };

        const state = {
            recordTargetId: null,
            draftKey: null,
            activeType: 'NOTE',
            activeNoteIndex: 0,
            newNoteMode: false,
            newNoteTitle: '새 노트',
            newNoteManualTitle: false,
            items: [],
            permission: null,
            opened: false,
            noteEditorInstance: null,
            noteEditorToken: 0,
            noteSaveTimer: null,
            noteDirty: false,
            noteSaving: false,
            noteSavePromise: null,
            notePublishRequested: false,
            noteEditRevision: 0,
            noteLastFailedRevision: -1,
            noteComposing: false,
            noteLastSavedContent: '',
            noteBaseTitle: '',
            noteBaseContent: '',
            noteConflict: false,
            noteConflictNotified: false,
            noteRestoreSyncing: false,
            noteMenuOpen: false,
            openSequence: 0,
            openPromise: null,
            openingKey: '',
            actionMenuButton: null,
            actionMenuPanel: null,
            noteDragRecordItemId: null,
            noteDropRecordItemId: null,
            noteDropAfter: false,
            noteOrderSaving: false,
            noteDragSuppressClick: false,
            unreadItemIds: new Set(),
            unreadTypes: new Set(),
            noteToolbarResizeObserver: null,
            externalRefreshTimer: null
        };

        function dispatchContentMetadataUpdated(contentType, contentId, reason, extra) {
            const detail = Object.assign({
                contentType: String(contentType || '').toUpperCase(),
                contentId: contentId == null ? null : (Number(contentId) || contentId),
                reason: reason || 'update',
                source: 'record'
            }, extra || {});
            document.dispatchEvent(new CustomEvent('moyo:content-metadata-updated', { detail: detail }));
        }

        function unreadItemDot(item) {
            const id = String(pick(item, 'recordItemId', 'RECORD_ITEM_ID') || '');
            return id && state.unreadItemIds.has(id)
                ? '<span class="moyo-record-unread-dot" title="미확인 업데이트" aria-label="미확인 업데이트"></span>'
                : '';
        }

        function ensureNoteTabsLayout() {
            if (!el.noteTabs || el.noteTabs.closest('.moyo-record-note-tabs-shell')) return;
            const shell = document.createElement('div');
            shell.className = 'moyo-record-note-tabs-shell';
            el.noteTabs.parentNode.insertBefore(shell, el.noteTabs);
            shell.appendChild(el.noteTabs);

            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'moyo-record-note-tabs__add';
            addButton.setAttribute('data-note-add-fixed', '');
            addButton.setAttribute('aria-label', '노트 탭 추가');
            addButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
            shell.appendChild(addButton);
            el.noteAddButton = addButton;

            const menu = document.createElement('div');
            menu.className = 'moyo-record-note-tab-menu';
            menu.setAttribute('data-note-tab-menu', '');
            menu.hidden = true;
            menu.innerHTML = '<button type="button" data-note-menu-rename><i class="fa-regular fa-pen-to-square"></i><span>이름 수정</span></button>' +
                '<button type="button" class="is-danger" data-note-menu-delete><i class="fa-regular fa-trash-can"></i><span>노트 삭제</span></button>';
            document.body.appendChild(menu);
            el.noteMenu = menu;
        }

        ensureNoteTabsLayout();

        function bindNoteTabsScroller() {
            const tabs = el.noteTabs;
            if (!tabs || tabs.dataset.moyoTabsScrollBound === 'true') return;
            tabs.dataset.moyoTabsScrollBound = 'true';

            let dragging = false;
            let moved = false;
            let suppressClick = false;
            let pointerId = null;
            let startX = 0;
            let startScrollLeft = 0;

            tabs.addEventListener('wheel', function (event) {
                if (tabs.scrollWidth <= tabs.clientWidth) return;
                const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
                if (!delta) return;

                // 탭 영역에서 발생한 휠은 끝 지점에서도 페이지로 전달하지 않는다.
                event.preventDefault();
                event.stopPropagation();

                const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
                tabs.scrollLeft = Math.max(0, Math.min(maxScrollLeft, tabs.scrollLeft + delta));
            }, { passive: false });

            tabs.addEventListener('pointerdown', function (event) {
                if (event.target.closest('[data-note-draggable="true"]')) return;
                if (event.button !== 0 || tabs.scrollWidth <= tabs.clientWidth) return;
                dragging = true;
                moved = false;
                pointerId = event.pointerId;
                startX = event.clientX;
                startScrollLeft = tabs.scrollLeft;
                // 단순 탭 클릭은 원래 클릭 대상으로 전달되어야 하므로
                // 실제 드래그가 시작되기 전에는 pointer capture를 잡지 않는다.
            });

            tabs.addEventListener('pointermove', function (event) {
                if (!dragging || event.pointerId !== pointerId) return;
                const distance = event.clientX - startX;
                if (!moved && Math.abs(distance) < 4) return;
                if (!moved) {
                    moved = true;
                    tabs.classList.add('is-dragging');
                    try { tabs.setPointerCapture(pointerId); } catch (ignore) {}
                }
                const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
                tabs.scrollLeft = Math.max(0, Math.min(maxScrollLeft, startScrollLeft - distance));
                event.preventDefault();
                event.stopPropagation();
            });

            function finishDrag(event) {
                if (!dragging || (event && event.pointerId !== pointerId)) return;
                dragging = false;
                suppressClick = moved;
                tabs.classList.remove('is-dragging');
                try { tabs.releasePointerCapture(pointerId); } catch (ignore) {}
                pointerId = null;
                if (suppressClick) window.setTimeout(function () { suppressClick = false; }, 0);
            }

            tabs.addEventListener('pointerup', finishDrag);
            tabs.addEventListener('pointercancel', finishDrag);
            tabs.addEventListener('lostpointercapture', finishDrag);
            tabs.addEventListener('click', function (event) {
                if (!suppressClick) return;
                event.preventDefault();
                event.stopImmediatePropagation();
            }, true);
        }

        function revealActiveNoteTab(options) {
            const opts = Object.assign({ immediate: false }, options || {});
            window.requestAnimationFrame(function () {
                const tabs = el.noteTabs;
                const active = tabs && tabs.querySelector('.moyo-record-note-tab.is-active');
                if (!tabs || !active) return;

                const allTabs = Array.from(tabs.querySelectorAll('.moyo-record-note-tab'));
                const activeIndex = allTabs.indexOf(active);
                const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
                let nextScrollLeft = tabs.scrollLeft;

                if (activeIndex === 0) {
                    nextScrollLeft = 0;
                } else if (activeIndex === allTabs.length - 1) {
                    nextScrollLeft = maxScrollLeft;
                } else {
                    const left = active.offsetLeft;
                    const right = left + active.offsetWidth;
                    const viewportLeft = tabs.scrollLeft;
                    const viewportRight = viewportLeft + tabs.clientWidth;
                    const padding = 8;

                    if (left < viewportLeft + padding) {
                        nextScrollLeft = left - padding;
                    } else if (right > viewportRight - padding) {
                        nextScrollLeft = right - tabs.clientWidth + padding;
                    }
                }

                nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, nextScrollLeft));
                tabs.scrollTo({
                    left: nextScrollLeft,
                    behavior: opts.immediate ? 'auto' : 'smooth'
                });
            });
        }

        bindNoteTabsScroller();

        function api(path, init) {
            return fetch((config.contextPath || '') + path, Object.assign({ credentials: 'include' }, init || {})).then(async function (response) {
                const text = await response.text();
                let body = null;
                try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
                if (!response.ok) {
                    const error = new Error((body && body.message) || '요청을 처리하지 못했습니다.');
                    error.status = response.status;
                    error.code = body && body.code;
                    error.body = body;
                    throw error;
                }
                return body;
            });
        }
        function loadScriptOnce(src, test) {
            if (typeof test === 'function' && test()) return Promise.resolve();
            const existing = Array.from(document.scripts).find(function (script) { return script.src === src; });
            if (existing) {
                return new Promise(function (resolve, reject) {
                    if (typeof test === 'function' && test()) return resolve();
                    existing.addEventListener('load', resolve, { once: true });
                    existing.addEventListener('error', reject, { once: true });
                });
            }
            return new Promise(function (resolve, reject) {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.addEventListener('load', resolve, { once: true });
                script.addEventListener('error', function () { reject(new Error('에디터 스크립트를 불러오지 못했습니다.')); }, { once: true });
                document.head.appendChild(script);
            });
        }
        function ensureCkeditor() {
            if (window.MoyoCkeditor && (window.CKEDITOR || window.ClassicEditor)) return Promise.resolve();
            if (window.__moyoRecordCkeditorPromise) return window.__moyoRecordCkeditorPromise;
            const base = config.contextPath || '';
            window.__moyoRecordCkeditorPromise = loadScriptOnce(
                'https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js',
                function () { return !!(window.CKEDITOR || window.ClassicEditor); }
            ).then(function () {
                return loadScriptOnce(
                    'https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js',
                    function () { return !!(window.CKEDITOR_TRANSLATIONS && window.CKEDITOR_TRANSLATIONS.ko); }
                ).catch(function () { return null; });
            }).then(function () {
                return loadScriptOnce(base + '/js/commonCkeditor.js', function () { return !!window.MoyoCkeditor; });
            });
            return window.__moyoRecordCkeditorPromise;
        }
        function htmlText(value) {
            const box = document.createElement('div');
            box.innerHTML = String(value || '');
            return String(box.textContent || '').replace(/\s+/g, ' ').trim();
        }
        function noteAutoTitle(value) {
            const box = document.createElement('div');
            box.innerHTML = String(value || '');
            const blocks = Array.from(box.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,blockquote,td,th'));
            const first = blocks.map(function (node) { return String(node.textContent || '').replace(/\s+/g, ' ').trim(); }).find(Boolean);
            return String(first || box.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30) || '새 노트';
        }
        function formatAuditDate(value) {
            if (!value) return '';
            const text = String(value).replace('T', ' ');
            return text.length >= 16 ? text.slice(0, 16) : text;
        }
        function noteAuditHtml(item, showSaveStatus) {
            const statusHtml = showSaveStatus
                ? '<span class="moyo-record-note-audit__status" data-note-save-status></span>'
                : '';
            if (!item) {
                return '<div class="moyo-record-note-audit is-new">' +
                    '<div class="moyo-record-note-audit__meta"></div>' + statusHtml +
                    '</div>';
            }
            const creator = pick(item, 'userName', 'USER_NAME') || '알 수 없음';
            const createdAt = formatAuditDate(pick(item, 'regDt', 'REG_DT'));
            const updater = pick(item, 'updatedByName', 'UPDATED_BY_NAME');
            const updatedAt = formatAuditDate(pick(item, 'updDt', 'UPD_DT'));
            let meta = '<span><i class="fa-regular fa-user"></i> 작성 ' + esc(creator) + (createdAt ? ' · ' + esc(createdAt) : '') + '</span>';
            if (updatedAt) {
                meta += '<span><i class="fa-regular fa-pen-to-square"></i> 수정 ' + esc(updater || creator) + ' · ' + esc(updatedAt) + '</span>';
            }
            return '<div class="moyo-record-note-audit">' +
                '<div class="moyo-record-note-audit__meta">' + meta + '</div>' +
                '<button type="button" class="moyo-record-note-history-button" data-note-history><i class="fa-solid fa-clock-rotate-left"></i> 이력 보기</button>' + statusHtml +
                '</div>';
        }
        function setNoteStatus(text, type) {
            const node = el.noteEditor.querySelector('[data-note-save-status]');
            if (!node) return;
            node.textContent = text || '';
            node.dataset.status = type || '';
        }
        function refreshNoteAudit(item) {
            const form = el.noteEditor.querySelector('[data-dynamic-note-form]');
            if (!form) return;
            const current = form.querySelector('.moyo-record-note-audit');
            if (!current) return;
            const holder = document.createElement('div');
            holder.innerHTML = noteAuditHtml(item, canEdit());
            const next = holder.firstElementChild;
            if (next) current.replaceWith(next);
        }
        async function openNoteHistory() {
            if (state.newNoteMode) return;
            const notes = byType('NOTE');
            const item = notes[state.activeNoteIndex];
            const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
            const noteId = pick(item, 'contentId', 'CONTENT_ID');
            if (!recordItemId || !noteId || !window.CommonNoteHistoryModal) return;
            try {
                await window.CommonNoteHistoryModal.open({
                    contextPath: config.contextPath || '',
                    noteId: noteId,
                    noteTitle: itemTitle(item, 'NOTE'),
                    canRestore: canEdit(),
                    request: api,
                    onRestored: async function (result) {
                        state.noteRestoreSyncing = true;
                        window.clearTimeout(state.noteSaveTimer);
                        state.noteSaveTimer = null;
                        state.noteDirty = false;
                        const index = state.items.findIndex(function (candidate) {
                            return String(pick(candidate, 'recordItemId', 'RECORD_ITEM_ID')) === String(recordItemId);
                        });
                        if (index >= 0) state.items[index] = Object.assign({}, state.items[index], {
                            title: pick(result, 'noteTitle', 'NOTE_TITLE'),
                            previewContent: pick(result, 'noteContent', 'NOTE_CONTENT'),
                            updDt: pick(result, 'updDt', 'UPD_DT', 'updatedAt', 'UPDATED_AT'),
                            updatedBy: pick(result, 'updatedBy', 'UPDATED_BY'),
                            updatedByName: pick(result, 'updatedByName', 'UPDATED_BY_NAME')
                        });
                        try {
                            await renderNotes();
                            if (state.noteEditorInstance) {
                                state.noteLastSavedContent = state.noteEditorInstance.getData();
                            } else {
                                state.noteLastSavedContent = String(pick(result, 'noteContent', 'NOTE_CONTENT') || '');
                            }
                            state.noteDirty = false;
                            setNoteStatus('저장됨', 'saved');
                        } finally {
                            window.requestAnimationFrame(function () {
                                window.requestAnimationFrame(function () {
                                    state.noteRestoreSyncing = false;
                                    if (state.noteEditorInstance) {
                                        state.noteLastSavedContent = state.noteEditorInstance.getData();
                                    }
                                    state.noteDirty = false;
                                });
                            });
                        }
                        if (typeof config.onChanged === 'function') {
                            config.onChanged({ recordTargetId: state.recordTargetId, type: 'NOTE', action: 'RESTORE' });
                        }
                    }
                });
            } catch (error) {
                alert(error.message);
            }
        }
        async function destroyNoteEditor() {
            state.noteEditorToken += 1;
            window.clearTimeout(state.noteSaveTimer);
            state.noteSaveTimer = null;
            if (state.noteToolbarResizeObserver) {
                state.noteToolbarResizeObserver.disconnect();
                state.noteToolbarResizeObserver = null;
            }
            const editor = state.noteEditorInstance;
            state.noteEditorInstance = null;
            state.noteDirty = false;
            state.noteComposing = false;
            state.noteLastSavedContent = '';
            state.noteBaseTitle = '';
            state.noteBaseContent = '';
            state.noteConflict = false;
            state.noteConflictNotified = false;
            if (editor && typeof editor.destroy === 'function') {
                try { await editor.destroy(); } catch (error) { console.warn('기록 노트 에디터 해제 실패:', error); }
            }
        }
        function closeNoteTabMenu() {
            if (!el.noteMenu) return;
            el.noteMenu.hidden = true;
            state.noteMenuOpen = false;
        }

        function openNoteTabMenu(trigger) {
            if (!el.noteMenu || !trigger || (!canEdit() && !canDelete()) || state.newNoteMode) return;
            const renameButton = el.noteMenu.querySelector('[data-note-menu-rename]');
            const deleteButton = el.noteMenu.querySelector('[data-note-menu-delete]');
            if (renameButton) renameButton.hidden = !canEdit();
            if (deleteButton) deleteButton.hidden = !canDelete();
            const rect = trigger.getBoundingClientRect();
            el.noteMenu.style.left = Math.max(8, rect.right - 132) + 'px';
            el.noteMenu.style.top = (rect.bottom + 6) + 'px';
            el.noteMenu.hidden = false;
            state.noteMenuOpen = true;
        }

        function applyNoteTabAutoWidths() {
            if (!el.noteTabs) return;
            const tabs = el.noteTabs.querySelectorAll('.moyo-record-note-tab');
            tabs.forEach(function (tab) {
                const label = tab.querySelector('.moyo-record-note-tab__label') || tab.querySelector('.moyo-record-note-tab__select span');
                if (!label) return;
                const text = (label.childNodes[0] && label.childNodes[0].nodeType === Node.TEXT_NODE
                    ? label.childNodes[0].nodeValue
                    : label.textContent || '').trim();
                const style = window.getComputedStyle(label);
                const canvas = applyNoteTabAutoWidths._canvas || (applyNoteTabAutoWidths._canvas = document.createElement('canvas'));
                const context = canvas.getContext('2d');
                if (!context) return;
                context.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].filter(Boolean).join(' ');
                const textWidth = Math.ceil(context.measureText(text || '노트').width);
                const hasMenu = !!tab.querySelector('.moyo-record-note-tab__menu');
                const hasUnread = !!tab.querySelector('.moyo-record-update-dot');
                const width = Math.max(96, Math.min(220, textWidth + 24 + (hasMenu ? 36 : 0) + (hasUnread ? 12 : 0)));
                tab.style.setProperty('--moyo-note-tab-width', width + 'px');
            });
        }

        function renderNoteTabsOnly() {
            const notes = byType('NOTE');
            closeNoteTabMenu();
            let html = notes.map(function (item, index) {
                const active = !state.newNoteMode && index === state.activeNoteIndex;
                const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
                const draggable = canEdit() && recordItemId ? ' data-note-draggable="true" data-note-record-item-id="' + esc(recordItemId) + '"' : '';
                return '<div class="moyo-record-note-tab ' + (active ? 'is-active' : '') + '" data-note-index="' + index + '" data-record-item-id="' + esc(recordItemId) + '"' + draggable + '>' +
                    '<button type="button" class="moyo-record-note-tab__select" data-note-select title="' + (canEdit() && recordItemId ? '드래그하여 순서 변경' : '') + '"><span class="moyo-record-note-tab__label">' + esc(noteTabName(item, index)) + unreadItemDot(item) + '</span></button>' +
                    (active && (canEdit() || canDelete()) ? '<button type="button" class="moyo-record-note-tab__menu" data-note-menu-trigger aria-label="노트 메뉴" title="노트 메뉴"><span aria-hidden="true">⋮</span></button>' : '') +
                    '</div>';
            }).join('');
            if (state.newNoteMode && canEdit()) {
                html += '<div class="moyo-record-note-tab is-active is-draft" data-note-draft>' +
                    '<button type="button" class="moyo-record-note-tab__select" data-note-draft-select><span>' + esc(state.newNoteTitle || '새 노트') + '</span></button>' +
                    '<button type="button" class="moyo-record-note-tab__menu" data-note-draft-menu aria-label="노트 이름 수정" title="노트 이름 수정"><span aria-hidden="true">⋮</span></button>' +
                    '</div>';
            }
            el.noteTabs.innerHTML = html;
            applyNoteTabAutoWidths();
            if (el.noteAddButton) el.noteAddButton.hidden = !canEdit();
            revealActiveNoteTab();
            if (state.newNoteMode) {
                const editable = state.noteEditorInstance && state.noteEditorInstance.ui && typeof state.noteEditorInstance.ui.getEditableElement === 'function'
                    ? state.noteEditorInstance.ui.getEditableElement()
                    : null;
                if (editable) requestAnimationFrame(function () { editable.focus(); });
            }
        }
        function clearNoteDragState() {
            state.noteDragRecordItemId = null;
            state.noteDropRecordItemId = null;
            state.noteDropAfter = false;
            if (!el.noteTabs) return;
            el.noteTabs.classList.remove('is-reordering');
            el.noteTabs.querySelectorAll('.moyo-record-note-tab').forEach(function (tab) {
                tab.classList.remove('is-drag-source', 'is-drop-before', 'is-drop-after');
            });
        }

        async function persistNoteOrder(orderedIds, activeRecordItemId) {
            if (!canEdit() || !state.recordTargetId || state.noteOrderSaving) return;
            state.noteOrderSaving = true;
            try {
                await api('/api/content-records/' + state.recordTargetId + '/notes/order', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recordItemIds: orderedIds })
                });
                const noteMap = new Map(byType('NOTE').map(function (item) {
                    return [String(pick(item, 'recordItemId', 'RECORD_ITEM_ID')), item];
                }));
                const reorderedNotes = orderedIds.map(function (id) { return noteMap.get(String(id)); }).filter(Boolean);
                let noteCursor = 0;
                state.items = state.items.map(function (item) {
                    return String(pick(item, 'recordType', 'RECORD_TYPE')).toUpperCase() === 'NOTE'
                        ? reorderedNotes[noteCursor++]
                        : item;
                });
                state.activeNoteIndex = Math.max(0, reorderedNotes.findIndex(function (item) {
                    return String(pick(item, 'recordItemId', 'RECORD_ITEM_ID')) === String(activeRecordItemId);
                }));
                renderNoteTabsOnly();
                if (typeof config.onChanged === 'function') {
                    config.onChanged({ recordTargetId: state.recordTargetId, type: 'NOTE', action: 'REORDER' });
                }
            } catch (error) {
                alert(error.message || '노트 순서를 저장하지 못했습니다.');
                if (state.recordTargetId) {
                    const items = await api('/api/content-records/' + state.recordTargetId + '/items');
                    state.items = Array.isArray(items) ? items : [];
                    const notes = byType('NOTE');
                    state.activeNoteIndex = Math.max(0, notes.findIndex(function (item) {
                        return String(pick(item, 'recordItemId', 'RECORD_ITEM_ID')) === String(activeRecordItemId);
                    }));
                    renderNoteTabsOnly();
                }
            } finally {
                state.noteOrderSaving = false;
                clearNoteDragState();
            }
        }

        function noteDraftPrefix() {
            const targetKey = state.recordTargetId ? ('target-' + state.recordTargetId) : ('draft-' + (state.draftKey || 'pending'));
            return 'moyo:content-record-note:' + targetKey + ':';
        }
        function noteDraftStorageKey(recordItemId, noteMode) {
            return noteDraftPrefix() + (noteMode === 'create' || !recordItemId ? 'new' : String(recordItemId));
        }
        function readNoteDraft(recordItemId, noteMode) {
            try {
                const raw = window.localStorage.getItem(noteDraftStorageKey(recordItemId, noteMode));
                return raw ? JSON.parse(raw) : null;
            } catch (error) {
                console.warn('기록 노트 임시 저장 읽기 실패:', error);
                return null;
            }
        }
        function writeNoteDraft(draft) {
            try {
                window.localStorage.setItem(noteDraftStorageKey(draft.recordItemId, draft.noteMode), JSON.stringify(draft));
                return true;
            } catch (error) {
                console.warn('기록 노트 임시 저장 실패:', error);
                return false;
            }
        }
        function removeNoteDraft(recordItemId, noteMode) {
            try { window.localStorage.removeItem(noteDraftStorageKey(recordItemId, noteMode)); } catch (error) { /* noop */ }
        }
        function listNoteDrafts() {
            const prefix = noteDraftPrefix();
            const drafts = [];
            try {
                for (let index = 0; index < window.localStorage.length; index += 1) {
                    const key = window.localStorage.key(index);
                    if (!key || key.indexOf(prefix) !== 0) continue;
                    const raw = window.localStorage.getItem(key);
                    if (!raw) continue;
                    const draft = JSON.parse(raw);
                    const hasContent = !!(draft && htmlText(draft.content));
                    const hasTitle = !!(draft && String(draft.title || '').trim() && draft.manualTitle);
                    if (draft && (hasContent || hasTitle)) drafts.push(draft);
                }
            } catch (error) {
                console.warn('기록 노트 임시 저장 목록 읽기 실패:', error);
            }
            return drafts.sort(function (a, b) { return Number(a.savedAt || 0) - Number(b.savedAt || 0); });
        }
        async function publishNoteDrafts() {
            const drafts = listNoteDrafts();
            if (!drafts.length) return true;
            const id = await ensureTarget();
            for (const draft of drafts) {
                const recordItemId = draft.recordItemId;
                if (recordItemId && draft.conflict) continue;
                let result;
                try {
                    result = await api(recordItemId
                        ? '/api/content-records/' + id + '/notes/' + recordItemId
                        : '/api/content-records/' + id + '/notes', {
                        method: recordItemId ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(recordItemId
                            ? { title: draft.title, content: draft.content, baseTitle: draft.baseTitle, baseContent: draft.baseContent }
                            : { title: draft.title, content: draft.content })
                    });
                } catch (error) {
                    if (recordItemId && error && error.status === 409) {
                        draft.conflict = true;
                        writeNoteDraft(draft);
                        error.recordItemId = recordItemId;
                    }
                    throw error;
                }
                removeNoteDraft(recordItemId, draft.noteMode);
                if (recordItemId) {
                    const item = byType('NOTE').find(function (candidate) {
                        return String(pick(candidate, 'recordItemId', 'RECORD_ITEM_ID')) === String(recordItemId);
                    });
                    if (item) {
                        item.title = pick(result, 'title', 'TITLE') || draft.title;
                        item.noteTitle = item.title;
                        item.previewContent = draft.content;
                        item.updDt = pick(result, 'updDt', 'UPD_DT') || item.updDt;
                        item.updatedBy = pick(result, 'updatedBy', 'UPDATED_BY') || item.updatedBy;
                        item.updatedByName = pick(result, 'updatedByName', 'UPDATED_BY_NAME') || item.updatedByName;
                        dispatchContentMetadataUpdated('NOTE', pick(item, 'contentId', 'CONTENT_ID'), 'autosave', {
                            title: item.title,
                            previewContent: draft.content
                        });
                    }
                } else {
                    const createdItem = result || {};
                    const createdRecordItemId = pick(createdItem, 'recordItemId', 'RECORD_ITEM_ID');
                    if (createdRecordItemId) {
                        state.items.push(createdItem);
                        state.newNoteMode = false;
                        state.newNoteManualTitle = false;
                        state.activeNoteIndex = Math.max(0, byType('NOTE').length - 1);

                        const form = el.noteEditor.querySelector('[data-dynamic-note-form]');
                        if (form) {
                            form.setAttribute('data-note-mode', 'update');
                            form.setAttribute('data-record-item-id', String(createdRecordItemId));
                        }
                        refreshNoteAudit(createdItem);
                        renderNoteTabsOnly();
                        updateCounts();
                        dispatchContentMetadataUpdated('NOTE', pick(createdItem, 'contentId', 'CONTENT_ID'), 'create', {
                            title: pick(createdItem, 'title', 'TITLE') || draft.title,
                            previewContent: draft.content
                        });
                    }
                }
            }
            if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'NOTE' });
            return true;
        }
        async function performActiveNoteSave(options) {
            const opts = Object.assign({ silent: false, publish: false }, options || {});
            const form = el.noteEditor.querySelector('[data-dynamic-note-form]');
            const editor = state.noteEditorInstance;
            if (!form || !canEdit()) return false;

            const content = editor ? editor.getData() : String((form.elements.content && form.elements.content.value) || '');
            const noteMode = form.getAttribute('data-note-mode') || 'create';
            const recordItemId = form.getAttribute('data-record-item-id') || null;
            const notes = byType('NOTE');
            const currentNote = recordItemId ? notes[state.activeNoteIndex] : null;
            const currentTitle = currentNote ? String(itemTitle(currentNote, 'NOTE') || '').trim() : '';
            const title = noteMode === 'create'
                ? (String(state.newNoteTitle || '').trim() || noteAutoTitle(content))
                : (currentTitle || noteAutoTitle(content));
            const saveRevision = state.noteEditRevision;

            const hasContent = !!htmlText(content);
            const hasMeaningfulTitle = noteMode === 'create'
                ? !!(state.newNoteManualTitle && String(title || '').trim())
                : !!String(title || '').trim();
            if (!hasContent && !hasMeaningfulTitle) {
                removeNoteDraft(recordItemId, noteMode);
                if (state.noteEditRevision === saveRevision) state.noteDirty = false;
                state.noteLastSavedContent = '';
                setNoteStatus('', 'idle');
                return false;
            }
            if (!opts.publish && content === state.noteLastSavedContent && !state.noteDirty) {
                setNoteStatus(state.noteConflict ? '충돌 · 임시 저장됨' : '저장됨', state.noteConflict ? 'error' : 'saved');
                return true;
            }

            state.noteSaving = true;
            if (state.noteEditRevision === saveRevision) state.noteDirty = false;
            setNoteStatus(opts.publish ? '반영 중' : '저장 중', 'saving');
            try {
                await ensureTarget();
                const draft = {
                    recordItemId: recordItemId ? Number(recordItemId) : null,
                    noteMode: noteMode,
                    title: title,
                    manualTitle: noteMode === 'create' ? !!state.newNoteManualTitle : true,
                    content: content,
                    baseTitle: noteMode === 'update' ? state.noteBaseTitle : null,
                    baseContent: noteMode === 'update' ? state.noteBaseContent : null,
                    conflict: noteMode === 'update' ? !!state.noteConflict : false,
                    savedAt: Date.now()
                };
                if (!writeNoteDraft(draft)) throw new Error('임시 저장에 실패했습니다.');
                state.noteLastSavedContent = content;
                if (currentNote) {
                    currentNote.title = title;
                    currentNote.noteTitle = title;
                    currentNote.previewContent = content;
                }
                if (opts.publish && !state.noteConflict) {
                    await publishNoteDrafts();
                    state.noteBaseTitle = title;
                    state.noteBaseContent = content;
                    state.noteConflict = false;
                    state.noteConflictNotified = false;
                }
                state.noteLastFailedRevision = -1;
                if (state.noteEditRevision !== saveRevision) {
                    state.noteDirty = true;
                    setNoteStatus('저장 대기', 'waiting');
                } else {
                    setNoteStatus(state.noteConflict ? '충돌 · 임시 저장됨' : '저장됨', state.noteConflict ? 'error' : 'saved');
                }
                return true;
            } catch (error) {
                if (error && error.status === 409 && noteMode === 'update') {
                    state.noteConflict = true;
                    if (state.noteEditRevision === saveRevision) state.noteDirty = false;
                    const conflictDraft = readNoteDraft(recordItemId, noteMode) || {
                        recordItemId: Number(recordItemId),
                        noteMode: noteMode,
                        title: title,
                        manualTitle: true,
                        content: content,
                        baseTitle: state.noteBaseTitle,
                        baseContent: state.noteBaseContent,
                        savedAt: Date.now()
                    };
                    conflictDraft.conflict = true;
                    conflictDraft.savedAt = Date.now();
                    writeNoteDraft(conflictDraft);
                    setNoteStatus('충돌 · 임시 저장됨', 'error');
                    if (!state.noteConflictNotified) {
                        state.noteConflictNotified = true;
                        const latest = error.body && error.body.latest;
                        const who = latest ? String(pick(latest, 'updatedByName', 'UPDATED_BY_NAME') || '').trim() : '';
                        const when = latest ? formatAuditDate(pick(latest, 'updDt', 'UPD_DT')) : '';
                        alert('다른 사용자가 이 노트를 먼저 수정했습니다.' +
                            (who || when ? '\n최신 수정: ' + (who || '다른 사용자') + (when ? ' · ' + when : '') : '') +
                            '\n현재 작성 내용은 이 브라우저에 임시 저장되었고 서버 내용은 덮어쓰지 않았습니다.');
                    }
                    return true;
                }
                state.noteDirty = true;
                state.noteLastFailedRevision = saveRevision;
                setNoteStatus('저장 실패 · 임시 저장됨', 'error');
                if (!opts.silent) alert(error.message);
                return false;
            } finally {
                state.noteSaving = false;
            }
        }

        async function saveActiveNote(options) {
            let opts = Object.assign({ silent: false, publish: false }, options || {});
            if (!canEdit()) return false;

            window.clearTimeout(state.noteSaveTimer);
            state.noteSaveTimer = null;
            if (opts.publish) state.notePublishRequested = true;

            while (true) {
                if (state.noteConflict) return true;

                if (state.noteSavePromise) {
                    const pending = state.noteSavePromise;
                    await pending;
                    if (state.noteSavePromise === pending) state.noteSavePromise = null;
                    continue;
                }

                const publishNow = !!(opts.publish || state.notePublishRequested);
                const needsSave = state.noteDirty || publishNow;
                if (!needsSave) return true;

                state.notePublishRequested = false;
                const savePromise = performActiveNoteSave({ silent: opts.silent, publish: publishNow });
                state.noteSavePromise = savePromise;
                let result = false;
                try {
                    result = await savePromise;
                } finally {
                    if (state.noteSavePromise === savePromise) state.noteSavePromise = null;
                }

                if (state.noteConflict) return result;
                // 같은 편집 버전에서 실패한 저장은 자동으로 무한 재시도하지 않는다.
                // 다음 입력이나 명시적 flush(탭 이동/닫기) 때 다시 시도한다.
                if (!result && state.noteLastFailedRevision === state.noteEditRevision) return false;

                if (!state.noteDirty && !state.notePublishRequested) return result;
                opts = { silent: true, publish: !!state.notePublishRequested };
            }
        }

        async function flushActiveNoteSave() {
            window.clearTimeout(state.noteSaveTimer);
            state.noteSaveTimer = null;
            if (!canEdit()) return true;

            if (state.noteSavePromise) await state.noteSavePromise;
            if (state.noteConflict) return true;
            if (state.noteDirty || state.notePublishRequested) {
                return saveActiveNote({ silent: true, publish: true });
            }
            return true;
        }

        async function commitActiveNoteBeforeNavigation() {
            if (!canEdit()) return true;
            const form = el.noteEditor.querySelector('[data-dynamic-note-form]');
            if (!form) return true;

            const editor = state.noteEditorInstance;
            const content = editor ? editor.getData() : String((form.elements.content && form.elements.content.value) || '');
            const noteMode = form.getAttribute('data-note-mode') || 'create';
            const recordItemId = form.getAttribute('data-record-item-id') || null;

            const hasContent = !!htmlText(content);
            const hasManualTitle = noteMode === 'create'
                && state.newNoteManualTitle
                && !!String(state.newNoteTitle || '').trim();

            if (!hasContent && !hasManualTitle) {
                removeNoteDraft(recordItemId, noteMode);
                state.noteDirty = false;
                state.noteLastSavedContent = '';
                setNoteStatus('', 'idle');
                return true;
            }

            const saved = await flushActiveNoteSave();
            if (!saved) return false;

            if (state.recordTargetId) {
                const items = await api('/api/content-records/' + state.recordTargetId + '/items');
                state.items = Array.isArray(items) ? items : [];
                updateCounts();
            }
            return true;
        }

        async function renameActiveNote() {
            if (!canEdit() || state.newNoteMode) return;
            if (state.noteSavePromise || state.noteDirty || state.notePublishRequested) {
                const saved = await flushActiveNoteSave();
                if (!saved && !state.noteConflict) return;
            }
            if (state.noteConflict) return;
            const notes = byType('NOTE');
            const item = notes[state.activeNoteIndex];
            const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
            const tab = el.noteTabs.querySelector('[data-note-index="' + state.activeNoteIndex + '"]');
            const selectButton = tab && tab.querySelector('[data-note-select]');
            const label = selectButton && selectButton.querySelector('span');
            if (!item || !recordItemId || !label || !selectButton || tab.querySelector('input')) return;

            const before = String(itemTitle(item, 'NOTE') || noteTabName(item, state.activeNoteIndex)).trim();
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'moyo-record-note-tab-title-input';
            input.value = before;
            input.maxLength = 100;
            input.setAttribute('aria-label', '노트 이름 수정');
            tab.classList.add('is-renaming');
            selectButton.replaceChild(input, label);
            input.focus();
            input.select();

            let finished = false;
            async function finish(commit) {
                if (finished) return;
                finished = true;
                const nextTitle = input.value.trim();
                tab.classList.remove('is-renaming');
                if (input.parentNode) input.parentNode.replaceChild(label, input);
                if (!commit || !nextTitle || nextTitle === before) return;
                try {
                    const editor = state.noteEditorInstance;
                    const form = el.noteEditor.querySelector('[data-dynamic-note-form]');
                    const content = editor ? editor.getData() : String((form && form.elements.content && form.elements.content.value) || itemPreview(item) || '');

                    setNoteStatus('저장 중', 'saving');
                    const targetId = await ensureTarget();
                    const result = await api('/api/content-records/' + targetId + '/notes/' + recordItemId, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: nextTitle, content: content, baseTitle: state.noteBaseTitle, baseContent: state.noteBaseContent })
                    });

                    item.title = pick(result, 'title', 'TITLE') || nextTitle;
                    item.noteTitle = item.title;
                    item.previewContent = pick(result, 'previewContent', 'PREVIEW_CONTENT') || content;
                    item.updDt = pick(result, 'updDt', 'UPD_DT') || item.updDt;
                    item.updatedBy = pick(result, 'updatedBy', 'UPDATED_BY') || item.updatedBy;
                    item.updatedByName = pick(result, 'updatedByName', 'UPDATED_BY_NAME') || item.updatedByName;
                    removeNoteDraft(recordItemId, 'update');
                    state.noteLastSavedContent = content;
                    dispatchContentMetadataUpdated('NOTE', pick(item, 'contentId', 'CONTENT_ID'), 'rename', {
                        title: item.title,
                        previewContent: item.previewContent
                    });
                    state.noteBaseTitle = item.title;
                    state.noteBaseContent = item.previewContent;
                    state.noteConflict = false;
                    state.noteConflictNotified = false;
                    state.noteDirty = false;
                    renderNoteTabsOnly();
                    setNoteStatus('저장됨', 'saved');
                    if (typeof config.onChanged === 'function') {
                        config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'NOTE' });
                    }
                } catch (error) {
                    if (error && error.status === 409) {
                        state.noteConflict = true;
                        writeNoteDraft({
                            recordItemId: Number(recordItemId),
                            noteMode: 'update',
                            title: nextTitle,
                            manualTitle: true,
                            content: content,
                            baseTitle: state.noteBaseTitle,
                            baseContent: state.noteBaseContent,
                            conflict: true,
                            savedAt: Date.now()
                        });
                        setNoteStatus('충돌 · 임시 저장됨', 'error');
                        alert(error.message || '다른 사용자가 이 노트를 먼저 수정했습니다. 현재 작성 내용은 임시 저장되었습니다.');
                    } else {
                        setNoteStatus('저장 실패', 'error');
                        alert(error.message);
                    }
                    renderNoteTabsOnly();
                }
            }
            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') { event.preventDefault(); finish(true); }
                else if (event.key === 'Escape') { event.preventDefault(); finish(false); }
            });
            input.addEventListener('blur', function () { finish(true); }, { once: true });
        }

        async function deleteActiveNote() {
            if (!canDelete() || state.newNoteMode) return;
            if (state.noteSaving) return;
            const notes = byType('NOTE');
            const item = notes[state.activeNoteIndex];
            const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
            if (!item || !recordItemId) return;
            const title = noteTabName(item, state.activeNoteIndex);
            if (!window.confirm('「' + title + '」 노트를 삭제할까요?\n삭제한 노트는 기록과 노트 목록에서 함께 사라집니다.')) return;

            window.clearTimeout(state.noteSaveTimer);
            state.noteSaveTimer = null;
            state.noteDirty = false;
            removeNoteDraft(recordItemId, 'update');
            try {
                const id = await ensureTarget();
                await api('/api/content-records/' + id + '/notes/' + recordItemId, { method: 'DELETE' });
                state.items = state.items.filter(function (candidate) {
                    return String(pick(candidate, 'recordItemId', 'RECORD_ITEM_ID')) !== String(recordItemId);
                });
                const remaining = byType('NOTE');
                state.activeNoteIndex = Math.max(0, Math.min(state.activeNoteIndex, remaining.length - 1));
                state.newNoteMode = false;
                updateCounts();
                await renderNotes();
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'NOTE' });
            } catch (error) {
                alert(error.message);
            }
        }

        function scheduleNoteSave() {
            window.clearTimeout(state.noteSaveTimer);
            state.noteSaveTimer = null;
            if (!state.noteDirty || state.noteComposing || state.noteConflict) return;
            state.noteSaveTimer = window.setTimeout(function () {
                state.noteSaveTimer = null;
                // 서버 저장은 항상 직렬화한다. 저장 중 다시 수정되면 현재 요청 완료 후 최신 상태만 한 번 더 반영한다.
                saveActiveNote({ silent: true, publish: true });
            }, 900);
        }
        async function mountNoteEditor(source, initialData, editable) {
            const token = ++state.noteEditorToken;
            try {
                await ensureCkeditor();
                if (token !== state.noteEditorToken || !source.isConnected) return;
                const editor = await window.MoyoCkeditor.create(source, {
                    profile: 'RECORD',
                    uploadUrl: (config.contextPath || '') + '/note/image-upload',
                    placeholder: '내용을 입력하세요.',
                    initialData: initialData || ''
                });
                if (token !== state.noteEditorToken || !source.isConnected) {
                    await editor.destroy();
                    return;
                }
                state.noteEditorInstance = editor;
                state.noteLastSavedContent = editor.getData();
                state.noteDirty = false;
                if (!editable && typeof editor.enableReadOnlyMode === 'function') editor.enableReadOnlyMode('moyo-record');
                const editableElement = editor.ui && typeof editor.ui.getEditableElement === 'function' ? editor.ui.getEditableElement() : null;
                if (editableElement) {
                    editableElement.addEventListener('compositionstart', function () { state.noteComposing = true; });
                    editableElement.addEventListener('compositionend', function () {
                        state.noteComposing = false;
                        if (!state.noteDirty) return;
                        const currentContent = editor.getData();
                        if (htmlText(currentContent) || state.newNoteManualTitle || !state.newNoteMode) {
                            scheduleNoteSave();
                        }
                    });
                }
                if (editable) {
                    editor.model.document.on('change:data', function () {
                        const currentContent = editor.getData();
                        if (state.noteRestoreSyncing) {
                            window.clearTimeout(state.noteSaveTimer);
                            state.noteSaveTimer = null;
                            state.noteLastSavedContent = currentContent;
                            state.noteDirty = false;
                            setNoteStatus('저장됨', 'saved');
                            return;
                        }
                        if (currentContent === state.noteLastSavedContent) {
                            state.noteDirty = false;
                            window.clearTimeout(state.noteSaveTimer);
                            state.noteSaveTimer = null;
                            setNoteStatus('저장됨', 'saved');
                            return;
                        }
                        state.noteEditRevision += 1;
                        state.noteDirty = true;
                        state.noteLastFailedRevision = -1;
                        if (state.newNoteMode && !state.newNoteManualTitle) {
                            const nextAutoTitle = noteAutoTitle(currentContent);
                            if (nextAutoTitle !== state.newNoteTitle) {
                                state.newNoteTitle = nextAutoTitle;
                                renderNoteTabsOnly();
                            }
                        }
                        setNoteStatus('저장 대기', 'waiting');
                        if (!state.noteComposing) {
                            scheduleNoteSave();
                        }
                    });
                }
                setNoteStatus(editable ? '저장됨' : '읽기 전용', editable ? 'saved' : 'readonly');
            } catch (error) {
                console.error('기록 노트 CKEditor 초기화 실패:', error);
                if (token !== state.noteEditorToken || !source.isConnected) return;
                source.hidden = false;
                source.addEventListener('input', function () {
                    state.noteEditRevision += 1;
                    state.noteDirty = true;
                    state.noteLastFailedRevision = -1;
                    setNoteStatus('저장 대기', 'waiting');
                    scheduleNoteSave();
                });
                setNoteStatus('기본 입력기로 전환됨', 'error');
            }
        }

        function canEdit() {
            return !state.permission || String(pick(state.permission, 'canEditYn', 'CAN_EDIT_YN') || 'N').toUpperCase() === 'Y';
        }
        function canDelete() {
            return !state.permission || String(pick(state.permission, 'canDeleteYn', 'CAN_DELETE_YN') || 'N').toUpperCase() === 'Y';
        }
        function setBusy(flag) {
            root.classList.toggle('is-loading', !!flag);
            if (el.loading) el.loading.hidden = !flag;
        }
        function byType(type) {
            return state.items.filter(function (item) { return normalizeType(item) === type; });
        }
        function ensureActiveType(value) {
            const type = String(value || '').toUpperCase();
            return TYPES.includes(type) ? type : 'NOTE';
        }
        function activateType(type) {
            state.activeType = ensureActiveType(type);
            root.dataset.activeRecordType = state.activeType;
            el.tabs.forEach(function (tab) {
                const active = tab.getAttribute('data-record-tab') === state.activeType;
                tab.classList.toggle('is-active', active);
                tab.setAttribute('aria-selected', String(active));
                tab.setAttribute('tabindex', active ? '0' : '-1');
            });
            el.sections.forEach(function (section) {
                const active = section.getAttribute('data-record-section') === state.activeType;
                section.hidden = !active;
                section.classList.toggle('is-active', active);
            });
        }
        function updateCounts() {
            const counts = { NOTE: 0, PHOTO: 0, FILE: 0, LINK: 0, LOCATION: 0 };
            state.items.forEach(function (item) {
                const type = normalizeType(item);
                if (counts[type] != null) counts[type] += 1;
            });
            el.counts.forEach(function (node) {
                node.textContent = String(counts[node.getAttribute('data-record-count')] || 0);
            });

            // 타입 탭의 미확인 점은 숫자 배지에 귀속시킨다.
            // 탭 우측 끝에 독립 배치하면 다음 탭 사이에 떠 보이므로,
            // 각 타입의 count badge 우측 상단을 공통 anchor로 사용한다.
            el.tabs.forEach(function (tab) {
                const type = String(tab.getAttribute('data-record-tab') || '').toUpperCase();
                const countBadge = tab.querySelector('[data-record-count]');
                const oldDot = tab.querySelector('.moyo-record-tab-unread-dot');
                const hasUnread = state.unreadTypes.has(type);
                if (hasUnread && !oldDot) {
                    const anchor = countBadge || tab;
                    anchor.insertAdjacentHTML('beforeend',
                        '<span class="moyo-record-tab-unread-dot" title="미확인 업데이트" aria-label="미확인 업데이트"></span>');
                } else if (!hasUnread && oldDot) {
                    oldDot.remove();
                }
            });
        }
        function clearUnreadType(type) {
            const normalized = ensureActiveType(type);
            state.unreadTypes.delete(normalized);
            state.unreadItemIds = new Set(Array.from(state.unreadItemIds).filter(function (id) {
                const item = state.items.find(function (row) {
                    return String(pick(row, 'recordItemId', 'RECORD_ITEM_ID') || '') === String(id);
                });
                return !item || normalizeType(item) !== normalized;
            }));
            updateCounts();
            render();
        }

        function unreadTypeForItemId(recordItemId) {
            const id = String(recordItemId || '');
            const item = state.items.find(function (row) {
                return String(pick(row, 'recordItemId', 'RECORD_ITEM_ID') || '') === id;
            });
            return item ? normalizeType(item) : '';
        }

        function clearUnreadItem(recordItemId) {
            const id = String(recordItemId || '');
            if (!id || !state.unreadItemIds.has(id)) return;
            const type = unreadTypeForItemId(id);
            state.unreadItemIds.delete(id);

            if (type) {
                const hasUnreadOfType = Array.from(state.unreadItemIds).some(function (otherId) {
                    return unreadTypeForItemId(otherId) === type;
                });
                if (!hasUnreadOfType) state.unreadTypes.delete(type);
            }

            root.querySelectorAll(
                '[data-record-item-id="' + id + '"] .moyo-record-unread-dot,' +
                '[data-record-photo-item="' + id + '"] > .moyo-record-unread-dot,' +
                '[data-link-item="' + id + '"] .moyo-record-unread-dot,' +
                '[data-record-location-entry="' + id + '"] .moyo-record-unread-dot'
            ).forEach(function (dot) { dot.remove(); });
            updateCounts();
        }

        async function markUnreadItemViewed(recordItemId) {
            const id = String(recordItemId || '');
            if (!id || !state.unreadItemIds.has(id)) return true;
            if (typeof config.onItemViewed === 'function') {
                try {
                    const viewed = await config.onItemViewed(id, unreadTypeForItemId(id));
                    if (viewed === false) return false;
                } catch (error) {
                    console.error('[기록] 항목 읽음 처리 실패:', error);
                    return false;
                }
            }
            clearUnreadItem(id);
            return true;
        }

        function selectRecordItemCard(node, type, recordItemId) {
            if (!node) return;
            root.querySelectorAll('.moyo-record-file-item.is-selected, .moyo-record-link-item.is-selected, .moyo-record-location-card.is-selected').forEach(function (item) {
                item.classList.remove('is-selected');
                item.setAttribute('aria-selected', 'false');
            });
            node.classList.add('is-selected');
            node.setAttribute('aria-selected', 'true');
            const id = String(recordItemId || '');
            if (id) void markUnreadItemViewed(id);
        }

        function updatePermission() {
            const editable = canEdit();
            root.classList.toggle('is-read-only', !editable);
            root.classList.toggle('can-delete-record', canDelete());
            if (editable) {
                el.permission.hidden = true;
            } else {
                el.permission.hidden = false;
                el.permission.innerHTML = '<i class="fa-solid fa-lock"></i> 원본 일정의 권한에 따라 읽기 전용으로 표시됩니다.';
            }
            root.querySelectorAll('form input, form textarea, form button, [data-record-action]').forEach(function (node) {
                if (node.hasAttribute('data-record-location-search') || node.hasAttribute('data-note-history')) return;
                node.disabled = !editable;
            });
        }
        async function renderNotes() {
            await destroyNoteEditor();
            state.noteEditRevision = 0;
            state.noteLastFailedRevision = -1;
            state.notePublishRequested = false;
            const notes = byType('NOTE');
            if (state.activeNoteIndex >= notes.length) state.activeNoteIndex = Math.max(0, notes.length - 1);

            // 노트가 하나도 없으면 기존 메모장 구조처럼 '새 노트' 탭을 먼저 표시한다.
            if (notes.length === 0 && canEdit()) {
                state.newNoteMode = true;
                state.newNoteTitle = state.newNoteTitle || '새 노트';
            }
            renderNoteTabsOnly();

            if (state.newNoteMode || notes.length === 0) {
                if (!canEdit()) {
                    el.noteEditor.innerHTML = '<div class="moyo-record-section__empty"><i class="fa-regular fa-note-sticky"></i><strong>노트가 없습니다.</strong></div>';
                    return;
                }
                el.noteEditor.innerHTML = '<form class="moyo-record-note-form" data-dynamic-note-form data-note-mode="create">' +
                    '<textarea class="moyo-record-note-source" name="content" data-note-editor-source></textarea>' +
                    noteAuditHtml(null, true) +
                    '</form>';
                const newDraft = readNoteDraft(null, 'create');
                state.newNoteTitle = newDraft && newDraft.title ? newDraft.title : (state.newNoteTitle || '새 노트');
                state.newNoteManualTitle = !!(newDraft && newDraft.manualTitle);
                renderNoteTabsOnly();
                await mountNoteEditor(el.noteEditor.querySelector('[data-note-editor-source]'), newDraft ? newDraft.content : '', true);
                return;
            }

            const item = notes[state.activeNoteIndex];
            const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
            const localDraft = readNoteDraft(recordItemId, 'update');
            const serverTitle = String(itemTitle(item, 'NOTE') || '').trim();
            const serverContent = String(pick(item, 'previewContent', 'PREVIEW_CONTENT', 'memo', 'MEMO') || '');
            state.noteBaseTitle = localDraft && Object.prototype.hasOwnProperty.call(localDraft, 'baseTitle') ? String(localDraft.baseTitle || '') : serverTitle;
            state.noteBaseContent = localDraft && Object.prototype.hasOwnProperty.call(localDraft, 'baseContent') ? String(localDraft.baseContent || '') : serverContent;
            state.noteConflict = !!(localDraft && localDraft.conflict);
            state.noteConflictNotified = false;
            const content = localDraft ? localDraft.content : serverContent;
            if (localDraft && localDraft.title) { item.title = localDraft.title; item.noteTitle = localDraft.title; }
            el.noteEditor.innerHTML = '<form class="moyo-record-note-form" data-dynamic-note-form data-note-mode="update" data-record-item-id="' + esc(recordItemId) + '">' +
                '<textarea class="moyo-record-note-source" name="content" data-note-editor-source></textarea>' +
                noteAuditHtml(item, canEdit()) +
                '</form>';
            await mountNoteEditor(el.noteEditor.querySelector('[data-note-editor-source]'), content || '', canEdit());
            if (state.noteConflict) setNoteStatus('충돌 · 임시 저장됨', 'error');
        }
        function canDeletePhoto() {
            return String(pick(state.permission, 'canDeleteYn', 'CAN_DELETE_YN') || '').toUpperCase() === 'Y' || canEdit();
        }
        function photoPreviewMeta(item) {
            const name = pick(item,
                'creatorName', 'CREATOR_NAME',
                'authorName', 'AUTHOR_NAME',
                'userName', 'USER_NAME',
                'uploaderName', 'UPLOADER_NAME') || '';
            const date = pick(item, 'createdAt', 'CREATED_AT', 'regDt', 'REG_DT', 'uploadedAt', 'UPLOADED_AT');
            const likeCount = Number(pick(item, 'likeCount', 'LIKE_COUNT') || 0);
            const commentCount = Number(pick(item, 'commentCount', 'COMMENT_COUNT') || 0);
            const liked = /^(1|true|y)$/i.test(String(pick(item, 'likedByMe', 'LIKED_BY_ME', 'liked', 'LIKED') || ''));
            const postId = pick(item, 'contentId', 'CONTENT_ID');
            const dateText = date ? String(date).replace('T', ' ').slice(0, 16) : '';
            return (name ? '<span class="moyo-record-photo-item__writer">' + esc(name) + '</span>' : '') +
                (dateText ? '<span class="moyo-record-photo-item__date">' + esc(dateText) + '</span>' : '') +
                '<span class="moyo-record-photo-item__stats">' +
                    '<button type="button" class="moyo-record-photo-item__reaction' + (liked ? ' is-liked' : '') + '" data-record-photo-like="' + esc(postId) + '" aria-pressed="' + (liked ? 'true' : 'false') + '" aria-label="좋아요"><i class="' + (liked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i><span>' + likeCount + '</span></button>' +
                    '<button type="button" class="moyo-record-photo-item__reaction" data-record-photo-comment="' + esc(postId) + '" aria-label="댓글 보기"><i class="fa-regular fa-comment"></i><span>' + commentCount + '</span></button>' +
                '</span>';
        }
        function renderPhotos() {
            const photos = byType('PHOTO');
            const deletable = canDeletePhoto();
            el.photoList.innerHTML = photos.map(function (item) {
                const src = pick(item, 'thumbnailUrl', 'THUMBNAIL_URL', 'fileUrl', 'FILE_URL', 'imageUrl', 'IMAGE_URL');
                const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
                const postId = pick(item, 'contentId', 'CONTENT_ID');
                const photoCount = Number(pick(item, 'photoCount', 'PHOTO_COUNT') || 0);
                return '<article class="moyo-record-photo-item" data-record-photo-item="' + esc(recordItemId) + '">' + unreadItemDot(item) +
                    '<button type="button" class="moyo-record-photo-item__open" data-record-photo-open="' + esc(postId) + '" aria-label="사진 크게 보기">' +
                    (src ? '<img src="' + esc(src) + '" alt="">' : '<span class="moyo-record-photo-item__placeholder"><i class="fa-regular fa-image"></i></span>') +
                    '</button>' +
                    (photoCount > 1 ? '<span class="moyo-record-photo-item__count" aria-label="사진 ' + photoCount + '장"><i class="fa-regular fa-images"></i>' + photoCount + '</span>' : '') +
                    '<div class="moyo-record-photo-item__meta">' + photoPreviewMeta(item) + '</div>' +
                    (deletable ? '<button type="button" class="moyo-record-photo-item__delete" data-record-photo-delete="' + esc(recordItemId) + '" data-record-photo-post="' + esc(postId) + '" aria-label="사진 삭제"><i class="fa-regular fa-trash-can"></i></button>' : '') +
                    '</article>';
            }).join('');
            const empty = root.querySelector('[data-record-empty="PHOTO"]');
            if (empty) empty.hidden = photos.length > 0;
            const wrap = root.querySelector('[data-record-photo-list-wrap]');
            if (wrap) wrap.classList.toggle('is-empty', photos.length === 0);
        }
        function openPhoto(postId) {
            if (!postId) return;
            if (!window.MoyoPhotoPostDetail || typeof window.MoyoPhotoPostDetail.open !== 'function') {
                console.error('공통 포토 디테일이 초기화되지 않았습니다.', postId);
                alert('사진 상세 화면을 불러오지 못했습니다.');
                return;
            }
            window.MoyoPhotoPostDetail.open(postId);
        }
        async function deletePhoto(recordItemId, postId, button) {
            if (!state.recordTargetId || !recordItemId || !postId) return;
            if (!confirm('이 사진을 삭제할까요?')) return;
            if (button) button.disabled = true;
            try {
                // 사진 게시물 삭제 시 연결된 공통 기록 PHOTO 아이템도 백엔드에서 함께 삭제된다.
                // 동일 아이템을 다시 삭제하면 이미 삭제된 항목이라는 오류가 발생하므로 한 번만 요청한다.
                await api('/api/photo-posts/' + encodeURIComponent(postId), { method: 'DELETE' });
                await load();
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'PHOTO' });
            } catch (error) {
                alert(error.message || '사진을 삭제하지 못했습니다.');
                if (button) button.disabled = false;
            }
        }
        function fileVisualInfo(item) {
            const rawExtension = String(pick(item, 'fileExtension', 'FILE_EXTENSION') || '').trim().toLowerCase().replace(/^\./, '');
            const title = String(itemTitle(item, 'FILE') || '');
            const titleMatch = title.toLowerCase().match(/\.([a-z0-9]+)$/);
            const extension = rawExtension || (titleMatch ? titleMatch[1] : '');
            const groups = {
                image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tif', 'tiff', 'heic', 'avif'],
                pdf: ['pdf'],
                word: ['doc', 'docx', 'hwp', 'hwpx', 'odt', 'rtf'],
                sheet: ['xls', 'xlsx', 'csv', 'ods'],
                slide: ['ppt', 'pptx', 'odp'],
                archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
                code: ['java', 'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'json', 'xml', 'sql', 'py', 'php', 'c', 'cpp', 'cs', 'go', 'kt', 'kts', 'sh', 'yml', 'yaml'],
                video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'm4v'],
                audio: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma']
            };
            if (groups.image.includes(extension)) return { type: 'image', icon: 'fa-regular fa-file-image' };
            if (groups.pdf.includes(extension)) return { type: 'pdf', icon: 'fa-regular fa-file-pdf' };
            if (groups.word.includes(extension)) return { type: 'word', icon: 'fa-regular fa-file-word' };
            if (groups.sheet.includes(extension)) return { type: 'sheet', icon: 'fa-regular fa-file-excel' };
            if (groups.slide.includes(extension)) return { type: 'slide', icon: 'fa-regular fa-file-powerpoint' };
            if (groups.archive.includes(extension)) return { type: 'archive', icon: 'fa-regular fa-file-zipper' };
            if (groups.code.includes(extension)) return { type: 'code', icon: 'fa-regular fa-file-code' };
            if (groups.video.includes(extension)) return { type: 'video', icon: 'fa-regular fa-file-video' };
            if (groups.audio.includes(extension)) return { type: 'audio', icon: 'fa-regular fa-file-audio' };
            return { type: 'file', icon: 'fa-regular fa-file' };
        }
        function renderFiles() {
            const files = byType('FILE');
            el.fileList.innerHTML = files.map(function (item) {
                const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
                const contentId = pick(item, 'contentId', 'CONTENT_ID');
                const downloadUrl = pick(item, 'fileDownloadUrl', 'FILE_DOWNLOAD_URL') || ('/api/files/' + encodeURIComponent(contentId) + '/download');
                const size = Number(pick(item, 'fileSize', 'FILE_SIZE') || 0);
                const fileName = String(pick(item, 'fileOriginalName', 'FILE_ORIGINAL_NAME') || itemTitle(item, 'FILE') || '파일');
                const creator = String(pick(item, 'creatorName', 'CREATOR_NAME') || '').trim();
                const createdAt = pick(item, 'createdAt', 'CREATED_AT');
                const createdText = createdAt ? String(createdAt).replace('T', ' ').slice(0, 16) : '';
                const meta = [pick(item, 'fileExtension', 'FILE_EXTENSION'), size ? formatFileSize(size) : '', creator ? creator + ' 업로드' : '', createdText].filter(Boolean).join(' · ');
                const canRename = Number(pick(item, 'fileCanRename', 'FILE_CAN_RENAME') || 0) === 1;
                const visual = fileVisualInfo(item);
                return '<article class="moyo-record-file-item" data-record-item-id="' + esc(recordItemId) + '" data-record-file-select tabindex="0" role="button" aria-selected="false" aria-label="' + esc(fileName) + ' 선택"><span class="moyo-record-file-item__icon is-' + visual.type + '" aria-hidden="true"><i class="' + visual.icon + '"></i></span><div class="moyo-record-file-item__copy"><div class="moyo-record-item-title-row"><strong class="moyo-record-file-item__title" title="' + esc(fileName) + '">' +
                    esc(fileName) + '</strong>' + unreadItemDot(item) + '</div><small>' + esc(meta || createdText) +
                    '</small></div><div class="moyo-record-file-item__actions"><a href="' + esc((config.contextPath || '') + downloadUrl) + '" aria-label="파일 다운로드" title="다운로드"><i class="fa-solid fa-download"></i></a>' +
                    ((canRename || canDelete()) ? '<div class="moyo-record-file-menu"><button type="button" class="moyo-record-file-menu__toggle" data-record-action-menu-toggle="FILE" aria-label="파일 메뉴" title="더보기" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical"></i></button><div class="moyo-record-file-menu__panel" data-record-action-menu-panel hidden>' +
                        (canRename ? '<button type="button" data-record-file-rename="' + esc(contentId) + '" data-record-file-name="' + esc(fileName) + '"><i class="fa-regular fa-pen-to-square"></i><span>이름 변경</span></button>' : '') +
                        (canDelete() ? '<button type="button" class="is-danger" data-record-file-delete="' + esc(recordItemId) + '"><i class="fa-regular fa-trash-can"></i><span>파일 삭제</span></button>' : '') +
                    '</div></div>' : '') +
                    '</div></article>';
            }).join('');
            const empty = root.querySelector('[data-record-empty="FILE"]');
            if (empty) empty.hidden = files.length > 0;
            if (el.fileListWrap) el.fileListWrap.classList.toggle('is-empty', files.length === 0);
        }
        function formatFileSize(bytes) {
            const value = Number(bytes || 0);
            if (!value) return '';
            if (value < 1024) return value + ' B';
            if (value < 1048576) return (value / 1024).toFixed(value < 10240 ? 1 : 0) + ' KB';
            if (value < 1073741824) return (value / 1048576).toFixed(value < 10485760 ? 1 : 0) + ' MB';
            return (value / 1073741824).toFixed(1) + ' GB';
        }
        function fileBaseName(fileName) {
            const name = String(fileName || '').trim();
            const dot = name.lastIndexOf('.');
            return dot > 0 ? name.slice(0, dot) : name;
        }
        async function renameFile(contentId, currentName) {
            if (!contentId) return;
            const nextName = window.prompt('새 파일 이름을 입력하세요. (확장자는 유지됩니다.)', fileBaseName(currentName));
            if (nextName == null) return;
            const name = String(nextName).trim();
            if (!name) { alert('파일 이름을 입력하세요.'); return; }
            try {
                await api('/api/files/' + encodeURIComponent(contentId) + '/name', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name })
                });
                await load();
                dispatchContentMetadataUpdated('FILE', contentId, 'rename', { originalName: name });
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'FILE' });
            } catch (error) {
                alert(error.message || '파일 이름을 변경하지 못했습니다.');
            }
        }
        async function deleteFile(recordItemId, button) {
            if (!state.recordTargetId || !recordItemId || !canDelete()) return;
            if (!confirm('이 파일을 삭제할까요? 삭제한 파일은 복구할 수 없습니다.')) return;
            if (button) button.disabled = true;
            try {
                await api('/api/content-records/' + encodeURIComponent(state.recordTargetId) + '/files/' + encodeURIComponent(recordItemId), { method: 'DELETE' });
                await load();
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'FILE' });
            } catch (error) {
                alert(error.message || '파일을 삭제하지 못했습니다.');
                if (button) button.disabled = false;
            }
        }
        function linkHost(url) {
            try { return new URL(url).hostname.replace(/^www\./i, ''); } catch (ignore) { return url || ''; }
        }
        function linkDate(item) {
            const value = pick(item, 'updatedAt', 'UPDATED_AT', 'createdAt', 'CREATED_AT');
            return value ? String(value).replace('T', ' ').slice(0, 16) : '';
        }
        const linkFaviconCache = new Map();
        function linkFaviconUrl(url) {
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
                const host = parsed.hostname.toLowerCase();
                // localhost, test1 같은 내부·가상 주소는 favicon 요청 자체를 하지 않는다.
                if (!host || host === 'localhost' || !host.includes('.') || /\.(local|localhost|test|invalid)$/i.test(host)) return '';
                return parsed.origin + '/favicon.ico';
            } catch (ignore) {
                return '';
            }
        }
        function showLoadedLinkFavicon(image, faviconUrl) {
            if (!image || !image.isConnected) return;
            image.src = faviconUrl;
            image.hidden = false;
            const icon = image.closest('.moyo-record-link-item__icon');
            const fallback = icon && icon.querySelector('[data-record-link-favicon-fallback]');
            if (fallback) fallback.hidden = true;
        }
        function loadLinkFavicon(image) {
            const faviconUrl = image.dataset.recordLinkFaviconUrl || '';
            if (!faviconUrl) return;

            const cached = linkFaviconCache.get(faviconUrl);
            if (cached === false) return;
            if (typeof cached === 'string') {
                showLoadedLinkFavicon(image, cached);
                return;
            }

            const probe = new Image();
            let settled = false;
            const timer = window.setTimeout(function () {
                if (settled) return;
                settled = true;
                linkFaviconCache.set(faviconUrl, false);
                probe.src = '';
            }, 1200);

            probe.onload = function () {
                if (settled) return;
                settled = true;
                window.clearTimeout(timer);
                if (!probe.naturalWidth || !probe.naturalHeight) {
                    linkFaviconCache.set(faviconUrl, false);
                    return;
                }
                linkFaviconCache.set(faviconUrl, faviconUrl);
                showLoadedLinkFavicon(image, faviconUrl);
            };
            probe.onerror = function () {
                if (settled) return;
                settled = true;
                window.clearTimeout(timer);
                linkFaviconCache.set(faviconUrl, false);
            };
            probe.src = faviconUrl;
        }
        function bindLinkFavicons() {
            if (!el.linkList) return;
            const images = Array.from(el.linkList.querySelectorAll('[data-record-link-favicon-url]'));
            if (!images.length) return;
            const run = function () {
                images.forEach(loadLinkFavicon);
            };
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(run, { timeout: 350 });
            } else {
                window.setTimeout(run, 0);
            }
        }
        function updateLinkAddButton() {
            if (el.linkAdd) el.linkAdd.hidden = true;
        }
        function syncLinkFormVisibility() {
            if (!el.linkForm) return;
            el.linkForm.hidden = !canEdit();
            updateLinkAddButton();
        }
        function renderLinks() {
            const links = byType('LINK');
            const editable = canEdit();
            const deletable = canDelete();
            el.linkList.innerHTML = links.map(function (item) {
                const url = pick(item, 'linkUrl', 'LINK_URL') || '';
                const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
                const title = String(pick(item, 'title', 'TITLE', 'linkTitle', 'LINK_TITLE') || '').trim();
                const description = itemPreview(item);
                const creator = pick(item, 'creatorName', 'CREATOR_NAME') || '';
                const meta = [creator, linkDate(item)].filter(Boolean).join(' · ');
                const primaryText = title || url;
                const hostText = title ? linkHost(url) : '';
                const faviconUrl = linkFaviconUrl(url);
                const editingId = el.linkForm && el.linkForm.elements.recordItemId ? String(el.linkForm.elements.recordItemId.value || '') : '';
                const editingClass = editingId && editingId === String(recordItemId) ? ' is-editing' : '';
                return '<article class="moyo-record-link-item' + editingClass + '" data-link-item="' + esc(recordItemId) + '" aria-selected="false">' + unreadItemDot(item) +
                    '<button type="button" class="moyo-record-link-item__select" data-record-link-select aria-label="' + esc(primaryText) + ' 선택">' +
                        '<span class="moyo-record-link-item__icon">' +
                            (faviconUrl ? '<img alt="" hidden data-record-link-favicon-url="' + esc(faviconUrl) + '">' : '') +
                            '<i class="fa-solid fa-link" data-record-link-favicon-fallback></i>' +
                        '</span>' +
                        '<div class="moyo-record-link-item__content' + (title ? '' : ' is-url-only') + '">' +
                            '<div class="moyo-record-item-title-row">' +
                                (title ? '<strong class="moyo-record-link-item__title">' + esc(title) + '</strong>' : '<span class="moyo-record-link-item__url">' + esc(url) + '</span>') + unreadItemDot(item) +
                            '</div>' +
                            (title ? '<span class="moyo-record-link-item__host">' + esc(linkHost(url)) + '</span>' : '') +
                            (description ? '<p>' + esc(description) + '</p>' : '') +
                            (meta ? '<small>' + esc(meta) + '</small>' : '') +
                        '</div>' +
                    '</button>' +
                    '<a class="moyo-record-link-item__external-open" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(primaryText) + ' 새 창에서 열기" title="새 창에서 열기"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>' +
                    ((editable || deletable) ? '<div class="moyo-record-link-item__menu">' +
                        '<button type="button" class="moyo-record-link-item__menu-toggle" data-record-action-menu-toggle="LINK" aria-label="링크 메뉴" title="메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis"></i></button>' +
                        '<div class="moyo-record-link-item__menu-panel" data-record-action-menu-panel hidden>' +
                            (editable ? '<button type="button" data-record-link-edit="' + esc(recordItemId) + '"><i class="fa-regular fa-pen-to-square"></i><span>수정</span></button>' : '') +
                            (deletable ? '<button type="button" data-record-link-delete="' + esc(recordItemId) + '"><i class="fa-regular fa-trash-can"></i><span>삭제</span></button>' : '') +
                        '</div>' +
                    '</div>' : '') +
                '</article>';
            }).join('');
            bindLinkFavicons();
            const empty = root.querySelector('[data-record-empty="LINK"]');
            if (empty) empty.hidden = links.length > 0;
            if (el.linkListWrap) el.linkListWrap.classList.toggle('is-empty', links.length === 0);
            syncLinkFormVisibility();
        }
        function locationMapPreviewUrl(query) {
            const value = String(query || '').trim();
            return value ? 'https://www.google.com/maps?q=' + encodeURIComponent(value) + '&output=embed' : '';
        }
        function locationMapExternalUrl(query) {
            const value = String(query || '').trim();
            return value ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(value) : '';
        }
        function locationHasDraft() {
            if (!el.locationForm) return false;
            const form = el.locationForm.elements;
            return ['locationText', 'memo', 'locationDescription', 'locationAddress'].some(function (name) {
                return Boolean(form[name] && String(form[name].value || '').trim());
            });
        }
        function syncLocationEmptyState() {
            if (!el.locationEmpty) return;
            const noLocations = byType('LOCATION').length === 0;
            const showEmpty = noLocations && !locationHasDraft();
            el.locationEmpty.hidden = !showEmpty;
            if (el.locationListWrap) el.locationListWrap.classList.toggle('is-empty', showEmpty);
        }
        function syncLocationInlineCancel() {
            if (el.locationCancel) {
                el.locationCancel.hidden = false;
                el.locationCancel.style.removeProperty('display');
            }
            updateLocationAddButton();
        }
        function setLocationSearchState(address) {
            const value = String(address || '').trim();
            if (el.locationDetail) el.locationDetail.hidden = false;
            if (el.locationPreview) el.locationPreview.hidden = !value;
            if (el.locationPreviewAddress) el.locationPreviewAddress.textContent = value;
            if (el.locationMap) {
                const src = value ? locationMapPreviewUrl(value) : '';
                if (el.locationMap.getAttribute('src') !== src) el.locationMap.setAttribute('src', src);
            }
            syncLocationInlineCancel();
            syncLocationEmptyState();
        }
        function updateLocationAddButton() {
            if (el.locationAdd) el.locationAdd.hidden = true;
        }
        function resetLocationForm() {
            if (!el.locationForm) return;
            el.locationForm.reset();
            ['recordItemId', 'locationAddress', 'locationLat', 'locationLng', 'locationPlaceId'].forEach(function (name) {
                if (el.locationForm.elements[name]) el.locationForm.elements[name].value = '';
            });
            el.locationForm.classList.remove('is-editing');
            if (el.locationCancel) {
                el.locationCancel.hidden = false;
                el.locationCancel.style.removeProperty('display');
            }
            if (el.locationSubmit) el.locationSubmit.innerHTML = '<i class="fa-solid fa-plus"></i><span>장소 추가</span>';
            setLocationSearchState('');
            el.locationForm.hidden = !canEdit();
            syncLocationInlineCancel();
            syncLocationEmptyState();
            updateLocationAddButton();
        }
        function loadRecordPostcode(callback) {
            if ((window.kakao && window.kakao.Postcode) || (window.daum && window.daum.Postcode)) {
                callback();
                return;
            }

            const scriptId = 'moyoRecordPostcodeScript';
            const scriptUrl = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            let existing = document.getElementById(scriptId);

            if (existing) {
                if (existing.dataset.loadState === 'error') {
                    existing.remove();
                    existing = null;
                } else {
                    existing.addEventListener('load', function () {
                        if ((window.kakao && window.kakao.Postcode) || (window.daum && window.daum.Postcode)) callback();
                    }, { once: true });
                    return;
                }
            }

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = scriptUrl;
            script.async = true;
            script.dataset.loadState = 'loading';
            script.onload = function () {
                script.dataset.loadState = 'loaded';
                if ((window.kakao && window.kakao.Postcode) || (window.daum && window.daum.Postcode)) {
                    callback();
                    return;
                }
                script.dataset.loadState = 'error';
                script.remove();
                alert('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
            };
            script.onerror = function () {
                script.dataset.loadState = 'error';
                script.remove();
                alert('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
            };
            document.head.appendChild(script);
        }
        function openLocationSearch() {
            if (!el.locationForm) return;
            loadRecordPostcode(function () {
                const PostcodeCtor = (window.kakao && window.kakao.Postcode) || (window.daum && window.daum.Postcode);
                if (!PostcodeCtor) {
                    alert('주소 검색 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
                    return;
                }
                new PostcodeCtor({
                    oncomplete: function (data) {
                        const address = String(data.roadAddress || data.jibunAddress || '').trim();
                        if (!address) return;
                        el.locationForm.elements.locationText.value = address;
                        el.locationForm.elements.locationAddress.value = address;
                        el.locationForm.elements.locationPlaceId.value = String(data.zonecode || '').trim();
                        setLocationSearchState(address);
                        if (el.locationForm.elements.memo) el.locationForm.elements.memo.focus();
                    }
                }).open({ q: String(el.locationForm.elements.locationText.value || '').trim() });
            });
        }
        function renderLocation() {
            closeActionPortalMenu();
            const locations = byType('LOCATION').slice().sort(function (a, b) {
                const ap = String(pick(a, 'primaryYn', 'PRIMARY_YN') || 'N') === 'Y' ? 0 : 1;
                const bp = String(pick(b, 'primaryYn', 'PRIMARY_YN') || 'N') === 'Y' ? 0 : 1;
                return ap - bp;
            });
            if (!locations.length) {
                el.locationCurrent.innerHTML = '';
                if (el.locationForm) el.locationForm.hidden = !canEdit();
                syncLocationInlineCancel();
                syncLocationEmptyState();
                updateLocationAddButton();
                return;
            }
            if (el.locationEmpty) el.locationEmpty.hidden = true;
            if (el.locationListWrap) el.locationListWrap.classList.remove('is-empty');
            if (el.locationForm && !el.locationForm.classList.contains('is-editing')) el.locationForm.hidden = !canEdit();
            updateLocationAddButton();
            const editable = canEdit();
            const deletable = canDelete();
            el.locationCurrent.innerHTML = locations.map(function (item) {
                const recordItemId = pick(item, 'recordItemId', 'RECORD_ITEM_ID');
                const text = pick(item, 'locationText', 'LOCATION_TEXT') || '장소';
                const address = pick(item, 'locationAddress', 'LOCATION_ADDRESS') || '';
                const detail = pick(item, 'memo', 'MEMO') || '';
                const description = pick(item, 'locationDescription', 'LOCATION_DESCRIPTION', 'description', 'DESCRIPTION') || '';
                const primary = String(pick(item, 'primaryYn', 'PRIMARY_YN') || 'N') === 'Y';
                const mapQuery = address || text;
                const hasMap = Boolean(address);
                return '<div class="moyo-record-location-entry' + (primary ? ' is-primary' : '') + '" data-record-location-entry="' + esc(recordItemId) + '">' +
                    '<article class="moyo-record-location-card" data-record-location-select tabindex="0" role="button" aria-selected="false" aria-label="' + esc(text) + ' 선택"' +
                        (primary && hasMap ? ' data-record-location-primary-card' : '') + '>' +
                        '<span><i class="fa-solid fa-location-dot"></i></span>' +
                        '<div class="moyo-record-location-card__content"><div class="moyo-record-location-card__title">' +
                            (primary ? '<em>대표</em>' : '') + '<div class="moyo-record-item-title-row"><strong class="moyo-record-location-card__title-text">' + esc(text) + '</strong>' + unreadItemDot(item) + '</div></div>' +
                            (address && address !== text ? '<p>' + esc(address) + '</p>' : '') +
                            (detail ? '<small class="moyo-record-location-card__detail">' + esc(detail) + '</small>' : '') +
                            (description ? '<small class="moyo-record-location-card__description">' + esc(description) + '</small>' : '') +
                        '</div>' +
                        '<div class="moyo-record-location-card__actions">' +
                            ((!editable && hasMap) ? '<button type="button" class="moyo-record-location-card__preview-toggle" data-record-location-preview-toggle aria-label="지도 미리보기" title="지도 미리보기" aria-expanded="false"><i class="fa-solid fa-chevron-down moyo-record-location-card__toggle-icon" aria-hidden="true"></i></button>' : '') +
                            ((editable || deletable) ? '<div class="moyo-record-location-card__menu">' +
                                '<button type="button" class="moyo-record-location-card__menu-toggle" data-record-action-menu-toggle="LOCATION" data-record-location-menu-toggle="' + esc(recordItemId) + '" aria-label="장소 메뉴" title="메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis"></i></button>' +
                                '<div class="moyo-record-location-card__menu-panel" data-record-location-menu-panel="' + esc(recordItemId) + '" data-record-action-menu-panel hidden>' +
                                    (editable && !primary ? '<button type="button" data-record-location-primary="' + esc(recordItemId) + '"><i class="fa-solid fa-location-crosshairs"></i><span>대표 장소 설정</span></button>' : '') +
                                    (editable ? '<button type="button" data-record-location-edit="' + esc(recordItemId) + '"><i class="fa-regular fa-pen-to-square"></i><span>수정</span></button>' : '') +
                                    (deletable ? '<button type="button" data-record-location-delete="' + esc(recordItemId) + '"><i class="fa-regular fa-trash-can"></i><span>삭제</span></button>' : '') +
                                '</div></div>' : '') +
                        '</div>' +
                    '</article>' +
                    ((!editable && hasMap) ? '<div class="moyo-record-location-card-preview" data-record-location-card-preview hidden>' +
                        '<div class="moyo-record-location-card-preview__head"><div><strong>지도 미리보기</strong><span>' + esc(address) + '</span></div>' +
                        '<button type="button" data-record-location-current-map="' + esc(mapQuery) + '"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>지도보기</span></button></div>' +
                        '<iframe title="저장된 장소 지도 미리보기" loading="lazy" referrerpolicy="no-referrer-when-downgrade" data-record-location-card-map-src="' + esc(locationMapPreviewUrl(mapQuery)) + '"></iframe>' +
                    '</div>' : '') +
                '</div>';
            }).join('');
            updateLocationAddButton();
        }
        function editLocation(recordItemId) {
            if (!el.locationForm || !canEdit()) return;
            const item = byType('LOCATION').find(function (entry) {
                return String(pick(entry, 'recordItemId', 'RECORD_ITEM_ID')) === String(recordItemId);
            });
            if (!item) return;
            const form = el.locationForm.elements;
            form.recordItemId.value = recordItemId;
            form.locationText.value = pick(item, 'locationText', 'LOCATION_TEXT') || '';
            form.locationAddress.value = pick(item, 'locationAddress', 'LOCATION_ADDRESS') || '';
            form.locationLat.value = pick(item, 'locationLat', 'LOCATION_LAT') || '';
            form.locationLng.value = pick(item, 'locationLng', 'LOCATION_LNG') || '';
            form.locationPlaceId.value = pick(item, 'locationPlaceId', 'LOCATION_PLACE_ID') || '';
            form.memo.value = pick(item, 'memo', 'MEMO') || '';
            if (form.locationDescription) form.locationDescription.value = pick(item, 'locationDescription', 'LOCATION_DESCRIPTION', 'description', 'DESCRIPTION') || '';
            setLocationSearchState(form.locationAddress.value);
            el.locationForm.classList.add('is-editing');
            el.locationForm.hidden = false;
            if (el.locationCancel) {
                el.locationCancel.hidden = false;
                el.locationCancel.style.removeProperty('display');
            }
            if (el.locationSubmit) el.locationSubmit.innerHTML = '<i class="fa-regular fa-floppy-disk"></i><span>장소 수정</span>';
            updateLocationAddButton();
            form.locationText.focus();
        }
        async function setPrimaryLocation(recordItemId, button) {
            if (!canEdit()) return;
            if (button) button.disabled = true;
            try {
                await api('/api/content-records/' + encodeURIComponent(state.recordTargetId) + '/locations/' + encodeURIComponent(recordItemId) + '/primary', { method: 'PUT' });
                await load();
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'LOCATION' });
            } catch (error) {
                alert(error.message);
            } finally {
                if (button) button.disabled = false;
            }
        }
        async function deleteLocation(recordItemId, button) {
            if (!recordItemId || !canDelete() || !confirm('지정된 장소를 삭제할까요?')) return;
            if (button) button.disabled = true;
            try {
                await api('/api/content-records/' + encodeURIComponent(state.recordTargetId) + '/locations/' + encodeURIComponent(recordItemId), { method: 'DELETE' });
                resetLocationForm();
                await load();
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'LOCATION' });
            } catch (error) {
                alert(error.message);
            } finally {
                if (button && button.isConnected) button.disabled = false;
            }
        }
        async function render() {
            closeActionPortalMenu();
            updateCounts();
            renderPhotos();
            renderFiles();
            renderLinks();
            renderLocation();
            updatePermission();
            await renderNotes();
        }
        async function ensureTarget() {
            if (state.recordTargetId) return state.recordTargetId;
            if (typeof config.ensureDraft !== 'function') throw new Error('임시 기록 대상을 생성할 수 없습니다.');
            const result = await config.ensureDraft();
            state.recordTargetId = Number(pick(result, 'recordTargetId', 'RECORD_TARGET_ID'));
            state.draftKey = pick(result, 'draftKey', 'DRAFT_KEY');
            if (!state.recordTargetId) throw new Error('임시 기록 대상이 올바르지 않습니다.');
            return state.recordTargetId;
        }
        async function load() {
            if (!state.recordTargetId) {
                state.items = [];
                state.permission = { canEditYn: 'Y' };
                await render();
                return;
            }
            setBusy(true);
            try {
                const values = await Promise.all([
                    api('/api/content-records/' + state.recordTargetId + '/permission'),
                    api('/api/content-records/' + state.recordTargetId + '/items')
                ]);
                state.permission = values[0] || null;
                state.items = Array.isArray(values[1]) ? values[1] : [];
                await render();
            } finally {
                setBusy(false);
            }
        }
        async function submitCustom(type, form) {
            const id = await ensureTarget();
            const handler = type === 'PHOTO' ? config.onCreatePhoto : config.onUploadFile;
            const formData = new FormData(form);
            if (type === 'FILE') {
                formData.delete('originalNames');
                const fileInput = form.querySelector('input[type="file"][name="files"]');
                if (fileInput && fileInput.files) {
                    Array.from(fileInput.files).forEach(function (file) {
                        formData.append('originalNames', file.name);
                    });
                }
            }
            if (typeof handler === 'function') {
                await handler({ recordTargetId: id, draftKey: state.draftKey, form: form, formData: formData });
                dispatchContentMetadataUpdated(type, null, 'create');
                return;
            }
            if (type === 'FILE') {
                await api('/api/content-records/' + encodeURIComponent(id) + '/files', { method: 'POST', body: formData });
                dispatchContentMetadataUpdated('FILE', null, 'create');
                return;
            }
            throw new Error(TYPE_LABEL[type] + ' 저장 기능이 아직 연결되지 않았습니다.');
        }
        function resetLinkForm() {
            if (!el.linkForm) return;
            el.linkForm.reset();
            if (el.linkForm.elements.recordItemId) el.linkForm.elements.recordItemId.value = '';
            if (el.linkCancel) el.linkCancel.hidden = false;
            if (el.linkSubmit) {
                const icon = el.linkSubmit.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-plus';
                el.linkSubmit.setAttribute('aria-label', '링크 추가');
                el.linkSubmit.setAttribute('title', '링크 추가');
            }
            if (el.linkSubmitLabel) el.linkSubmitLabel.textContent = '링크 추가';
            el.linkForm.classList.remove('is-editing');
            if (el.linkList) {
                el.linkList.querySelectorAll('[data-link-item].is-editing').forEach(function (card) { card.classList.remove('is-editing'); });
            }
            syncLinkFormVisibility();
        }
        function editLink(recordItemId) {
            if (!el.linkForm || !canEdit()) return;
            const item = byType('LINK').find(function (entry) {
                return String(pick(entry, 'recordItemId', 'RECORD_ITEM_ID')) === String(recordItemId);
            });
            if (!item) return;
            el.linkForm.elements.recordItemId.value = recordItemId;
            el.linkForm.elements.title.value = pick(item, 'title', 'TITLE', 'linkTitle', 'LINK_TITLE') || '';
            el.linkForm.elements.linkUrl.value = pick(item, 'linkUrl', 'LINK_URL') || '';
            el.linkForm.elements.description.value = pick(item, 'description', 'DESCRIPTION') || '';
            if (el.linkCancel) el.linkCancel.hidden = false;
            if (el.linkSubmit) {
                const icon = el.linkSubmit.querySelector('i');
                if (icon) icon.className = 'fa-regular fa-floppy-disk';
                el.linkSubmit.setAttribute('aria-label', '링크 수정');
                el.linkSubmit.setAttribute('title', '링크 수정');
            }
            if (el.linkSubmitLabel) el.linkSubmitLabel.textContent = '링크 수정';
            el.linkForm.classList.add('is-editing');
            if (el.linkList) {
                el.linkList.querySelectorAll('[data-link-item]').forEach(function (card) {
                    card.classList.toggle('is-editing', String(card.dataset.linkItem) === String(recordItemId));
                });
            }
            el.linkForm.hidden = false;
            updateLinkAddButton();
            el.linkForm.elements.title.focus();
        }
        async function deleteLink(recordItemId, button) {
            if (!state.recordTargetId || !recordItemId || !canDelete()) return;
            if (!confirm('이 링크를 삭제할까요?')) return;
            if (button) button.disabled = true;
            try {
                await api('/api/content-records/' + encodeURIComponent(state.recordTargetId) + '/links/' + encodeURIComponent(recordItemId), { method: 'DELETE' });
                if (el.linkForm && String(el.linkForm.elements.recordItemId.value) === String(recordItemId)) resetLinkForm();
                await load();
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'LINK' });
            } catch (error) {
                alert(error.message || '링크를 삭제하지 못했습니다.');
                if (button) button.disabled = false;
            }
        }
        async function submitLink(form) {
            const id = await ensureTarget();
            const data = new FormData(form);
            const recordItemId = String(data.get('recordItemId') || '').trim();
            const payload = Object.fromEntries(data.entries());
            delete payload.recordItemId;
            await api('/api/content-records/' + id + '/links' + (recordItemId ? '/' + encodeURIComponent(recordItemId) : ''), {
                method: recordItemId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            resetLinkForm();
        }
        async function submitLocation(form) {
            const id = await ensureTarget();
            const data = new FormData(form);
            const recordItemId = String(data.get('recordItemId') || '').trim();
            const payload = Object.fromEntries(data.entries());
            delete payload.recordItemId;
            await api('/api/content-records/' + id + '/locations' + (recordItemId ? '/' + encodeURIComponent(recordItemId) : ''), {
                method: recordItemId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        async function handleSubmit(form, type) {
            const submit = form.querySelector('[type="submit"]');
            if (submit) submit.disabled = true;
            try {
                if (type === 'LINK') await submitLink(form);
                else if (type === 'LOCATION') await submitLocation(form);
                else await submitCustom(type, form);
                if (type === 'LOCATION') resetLocationForm();
                else if (type !== 'LINK') form.reset();
                state.newNoteMode = false;
                await load();
                if (typeof config.onChanged === 'function') config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: type });
            } catch (error) {
                alert(error.message);
            } finally {
                if (submit) submit.disabled = false;
            }
        }
        async function open(openOptions) {
            const next = openOptions || {};
            const key = String(next.recordTargetId || 'draft') + '|' + String(next.draftKey || '');
            if (state.openPromise && state.openingKey === key) return state.openPromise;

            const sequence = ++state.openSequence;
            state.openingKey = key;
            state.openPromise = (async function () {
                await destroyNoteEditor();
                if (sequence !== state.openSequence) return;
                closeNoteTabMenu();
                if (root.parentNode !== document.body) document.body.appendChild(root);

                state.recordTargetId = next.recordTargetId || null;
                state.draftKey = next.draftKey || null;
                state.activeType = ensureActiveType(next.activeType || next.recordType || 'NOTE');
                state.activeNoteIndex = 0;
                state.newNoteMode = false;
                state.newNoteTitle = '새 노트';
                state.newNoteManualTitle = false;
                state.items = [];
                state.unreadItemIds = new Set((Array.isArray(next.unreadItemIds) ? next.unreadItemIds : []).map(String));
                state.unreadTypes = new Set((Array.isArray(next.unreadTypes) ? next.unreadTypes : []).map(function (type) {
                    return String(type || '').toUpperCase();
                }));
                state.permission = null;
                window.clearTimeout(state.noteSaveTimer);
                state.noteSaveTimer = null;
                state.noteSavePromise = null;
                state.notePublishRequested = false;
                state.noteEditRevision = 0;
                state.noteLastFailedRevision = -1;
                state.opened = true;
                resetLinkForm();
                resetLocationForm();
                if (el.noteTabs) el.noteTabs.scrollLeft = 0;

                root.hidden = false;
                root.setAttribute('aria-hidden', 'false');
                document.body.classList.add('moyo-record-modal-open');
                if (el.label) el.label.textContent = formatTargetLabel(next.targetLabel || config.targetLabel);
                activateType(state.activeType);
                setBusy(true);

                try {
                    await load();
                    if (state.activeType === 'NOTE') {
                        const visibleNote = byType('NOTE')[state.activeNoteIndex];
                        const visibleRecordItemId = visibleNote ? pick(visibleNote, 'recordItemId', 'RECORD_ITEM_ID') : null;
                        if (visibleRecordItemId != null) await markUnreadItemViewed(visibleRecordItemId);
                    }
                } catch (error) {
                    if (sequence === state.openSequence) alert(error.message);
                } finally {
                    if (sequence === state.openSequence) setBusy(false);
                }
            })();

            try {
                return await state.openPromise;
            } finally {
                if (sequence === state.openSequence) {
                    state.openPromise = null;
                    state.openingKey = '';
                }
            }
        }
        async function close() {
            closeActionPortalMenu();
            state.openSequence += 1;
            state.openPromise = null;
            state.openingKey = '';
            setBusy(false);
            if (canEdit()) {
                try {
                    const flushed = await flushActiveNoteSave();
                    if (!flushed && !state.noteConflict) {
                        setNoteStatus('저장 실패 · 임시 저장됨', 'error');
                    }
                    if (!state.noteConflict) {
                        setNoteStatus('반영 중', 'saving');
                        await publishNoteDrafts();
                    }
                } catch (error) {
                    setNoteStatus('저장 실패 · 임시 저장됨', 'error');
                    alert(error.message);
                    return;
                }
            }
            closeNoteTabMenu();
            await destroyNoteEditor();
            state.opened = false;
            root.hidden = true;
            root.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('moyo-record-modal-open');
        }

        root.addEventListener('click', function (event) {
            let itemId = null;

            const photoOpen = event.target.closest('[data-record-photo-open]');
            if (photoOpen) {
                const row = photoOpen.closest('[data-record-photo-item]');
                itemId = row && row.getAttribute('data-record-photo-item');
            }

            if (!itemId) {
                const fileAction = event.target.closest('.moyo-record-file-item__actions a');
                if (fileAction) {
                    const row = fileAction.closest('[data-record-item-id]');
                    itemId = row && row.getAttribute('data-record-item-id');
                }
            }

            if (!itemId) {
                const linkOpen = event.target.closest('.moyo-record-link-item__external-open');
                if (linkOpen) {
                    const row = linkOpen.closest('[data-link-item]');
                    itemId = row && row.getAttribute('data-link-item');
                }
            }

            if (!itemId) {
                const locationOpen = event.target.closest('[data-record-location-current-map]');
                if (locationOpen) {
                    const row = locationOpen.closest('[data-record-location-entry]');
                    itemId = row && row.getAttribute('data-record-location-entry');
                }
            }

            if (itemId) void markUnreadItemViewed(itemId);
        }, true);

        root.addEventListener('click', function (event) {
            const fileCard = event.target.closest('[data-record-file-select]');
            if (fileCard && !event.target.closest('.moyo-record-file-item__actions')) {
                selectRecordItemCard(fileCard, 'FILE', fileCard.getAttribute('data-record-item-id'));
                return;
            }
            const linkSelect = event.target.closest('[data-record-link-select]');
            if (linkSelect) {
                const row = linkSelect.closest('[data-link-item]');
                const recordItemId = row && row.getAttribute('data-link-item');
                selectRecordItemCard(row, 'LINK', recordItemId);
                if (recordItemId && canEdit()) editLink(recordItemId);
                return;
            }
            const locationCard = event.target.closest('[data-record-location-select]');
            if (locationCard && !event.target.closest('.moyo-record-location-card__actions')) {
                const row = locationCard.closest('[data-record-location-entry]');
                const recordItemId = row && row.getAttribute('data-record-location-entry');
                selectRecordItemCard(locationCard, 'LOCATION', recordItemId);
                if (recordItemId && canEdit()) {
                    editLocation(recordItemId);
                } else if (recordItemId) {
                    toggleSavedLocationPreview(locationCard);
                }
            }
        });

        root.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const fileCard = event.target.closest('[data-record-file-select]');
            if (fileCard && event.target === fileCard) {
                event.preventDefault();
                selectRecordItemCard(fileCard, 'FILE', fileCard.getAttribute('data-record-item-id'));
                return;
            }
            const locationCard = event.target.closest('[data-record-location-select]');
            if (locationCard && event.target === locationCard) {
                event.preventDefault();
                const row = locationCard.closest('[data-record-location-entry]');
                const recordItemId = row && row.getAttribute('data-record-location-entry');
                selectRecordItemCard(locationCard, 'LOCATION', recordItemId);
                if (recordItemId && canEdit()) {
                    editLocation(recordItemId);
                } else if (recordItemId) {
                    toggleSavedLocationPreview(locationCard);
                }
            }
        });

        root.querySelectorAll('[data-record-modal-close]').forEach(function (button) { button.addEventListener('click', close); });
        root.querySelector('.moyo-record-modal__tabs').addEventListener('click', async function (event) {
            const tab = event.target.closest('[data-record-tab]');
            if (!tab) return;
            const nextType = tab.getAttribute('data-record-tab');
            if (state.activeType === 'NOTE' && nextType !== 'NOTE') {
                const committed = await commitActiveNoteBeforeNavigation();
                if (!committed) return;
            }
            activateType(nextType);
            // 상위 타입 탭을 눌렀다는 이유만으로 하위 항목을 전부 읽음 처리하지 않는다.
            // 실제 항목을 열거나 선택했을 때만 해당 항목의 점을 제거한다.
        });
        (function bindVisualNoteReorder() {
            let sourceTab = null;
            let ghost = null;
            let pointerId = null;
            let startX = 0;
            let startY = 0;
            let offsetX = 0;
            let offsetY = 0;
            let dragging = false;
            const DRAG_THRESHOLD = 5;

            function draggableTabs() {
                return Array.from(el.noteTabs.querySelectorAll('[data-note-draggable="true"]'));
            }

            function captureRects() {
                const rects = new Map();
                draggableTabs().forEach(function (tab) {
                    if (tab !== sourceTab) rects.set(tab, tab.getBoundingClientRect());
                });
                return rects;
            }

            function animateShift(beforeRects) {
                draggableTabs().forEach(function (tab) {
                    if (tab === sourceTab) return;
                    const before = beforeRects.get(tab);
                    if (!before) return;

                    const after = tab.getBoundingClientRect();
                    const deltaX = before.left - after.left;
                    if (Math.abs(deltaX) < 1) return;

                    tab.style.transition = 'none';
                    tab.style.transform = 'translateX(' + deltaX + 'px)';
                    requestAnimationFrame(function () {
                        tab.style.transition = 'transform 140ms ease';
                        tab.style.transform = 'translateX(0)';
                    });
                });
            }

            function movePlaceholder(clientX) {
                if (!sourceTab || !sourceTab.parentNode) return;

                const others = draggableTabs().filter(function (tab) {
                    return tab !== sourceTab;
                });
                if (!others.length) return;

                let target = null;
                let insertAfter = false;

                for (let i = 0; i < others.length; i += 1) {
                    const rect = others[i].getBoundingClientRect();
                    if (clientX < rect.left + rect.width / 2) {
                        target = others[i];
                        break;
                    }
                }

                if (!target) {
                    target = others[others.length - 1];
                    insertAfter = true;
                }

                const alreadyPlaced = insertAfter
                    ? target.nextElementSibling === sourceTab
                    : sourceTab.nextElementSibling === target;

                if (alreadyPlaced) return;

                const beforeRects = captureRects();
                if (insertAfter) {
                    el.noteTabs.insertBefore(sourceTab, target.nextElementSibling);
                } else {
                    el.noteTabs.insertBefore(sourceTab, target);
                }
                animateShift(beforeRects);
            }

            function updateGhost(clientX, clientY) {
                if (!ghost) return;
                ghost.style.left = (clientX - offsetX) + 'px';
                ghost.style.top = (clientY - offsetY) + 'px';
            }

            function beginDrag(event) {
                dragging = true;
                state.noteDragRecordItemId = sourceTab.getAttribute('data-note-record-item-id');
                closeNoteTabMenu();

                const rect = sourceTab.getBoundingClientRect();
                const title = sourceTab.querySelector('[data-note-select] span');

                offsetX = event.clientX - rect.left;
                offsetY = event.clientY - rect.top;

                ghost = document.createElement('div');
                ghost.className = 'moyo-record-note-drag-preview';
                ghost.textContent = title ? title.textContent.trim() : '';
                ghost.style.width = rect.width + 'px';
                ghost.style.height = rect.height + 'px';
                document.body.appendChild(ghost);

                sourceTab.classList.add('is-drag-placeholder');
                el.noteTabs.classList.add('is-reordering');
                document.body.classList.add('moyo-record-note-reordering');

                updateGhost(event.clientX, event.clientY);
                movePlaceholder(event.clientX);
            }

            function cleanupVisuals() {
                if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
                ghost = null;

                if (sourceTab) sourceTab.classList.remove('is-drag-placeholder');
                el.noteTabs.classList.remove('is-reordering');
                document.body.classList.remove('moyo-record-note-reordering');

                draggableTabs().forEach(function (tab) {
                    tab.style.transition = '';
                    tab.style.transform = '';
                });
            }

            function resetSession() {
                sourceTab = null;
                pointerId = null;
                dragging = false;
            }

            async function persistCurrentOrder(activeRecordItemId) {
                const orderedIds = draggableTabs().map(function (tab) {
                    return String(tab.getAttribute('data-note-record-item-id'));
                });
                clearNoteDragState();
                await persistNoteOrder(orderedIds, activeRecordItemId);
            }

            function cancelDrag() {
                cleanupVisuals();
                renderNoteTabsOnly();
                resetSession();
                clearNoteDragState();
            }

            el.noteTabs.addEventListener('pointerdown', function (event) {
                const select = event.target.closest('[data-note-select]');
                const tab = select && select.closest('[data-note-draggable="true"]');

                if (!tab ||
                    event.button !== 0 ||
                    !canEdit() ||
                    state.newNoteMode ||
                    state.noteOrderSaving ||
                    event.target.closest('[data-note-menu-trigger]')) {
                    return;
                }

                sourceTab = tab;
                pointerId = event.pointerId;
                startX = event.clientX;
                startY = event.clientY;
                dragging = false;
            });

            window.addEventListener('pointermove', function (event) {
                if (!sourceTab || event.pointerId !== pointerId) return;

                if (!dragging) {
                    const movedX = Math.abs(event.clientX - startX);
                    const movedY = Math.abs(event.clientY - startY);
                    if (Math.max(movedX, movedY) < DRAG_THRESHOLD) return;
                    beginDrag(event);
                }

                event.preventDefault();
                updateGhost(event.clientX, event.clientY);
                movePlaceholder(event.clientX);
            }, { passive: false });

            window.addEventListener('pointerup', function (event) {
                if (!sourceTab || event.pointerId !== pointerId) return;

                if (!dragging) {
                    resetSession();
                    return;
                }

                event.preventDefault();

                const notes = byType('NOTE');
                const activeNote = notes[state.activeNoteIndex];
                const activeRecordItemId = activeNote
                    ? pick(activeNote, 'recordItemId', 'RECORD_ITEM_ID')
                    : null;

                state.noteDragSuppressClick = true;
                window.setTimeout(function () {
                    state.noteDragSuppressClick = false;
                }, 0);

                cleanupVisuals();
                resetSession();
                persistCurrentOrder(activeRecordItemId);
            }, { passive: false });

            window.addEventListener('pointercancel', function (event) {
                if (!sourceTab || event.pointerId !== pointerId) return;
                cancelDrag();
            });

            window.addEventListener('blur', function () {
                if (sourceTab) cancelDrag();
            });
        })();

        el.noteTabs.addEventListener('click', async function (event) {
            if (state.noteDragSuppressClick) {
                event.preventDefault();
                event.stopPropagation();
                state.noteDragSuppressClick = false;
                return;
            }
            const draftMenu = event.target.closest('[data-note-draft-menu]');
            if (draftMenu && state.newNoteMode) {
                event.preventDefault();
                event.stopPropagation();
                renameNewDraftTitle();
                return;
            }
            const menuTrigger = event.target.closest('[data-note-menu-trigger]');
            if (menuTrigger) {
                event.preventDefault();
                event.stopPropagation();
                if (state.noteMenuOpen) closeNoteTabMenu();
                else openNoteTabMenu(menuTrigger);
                return;
            }
            const tab = event.target.closest('[data-note-index]');
            if (!tab) return;
            closeNoteTabMenu();
            const nextIndex = Number(tab.getAttribute('data-note-index')) || 0;
            if (!state.newNoteMode && nextIndex === state.activeNoteIndex) return;
            const targetNote = byType('NOTE')[nextIndex];
            const targetRecordItemId = targetNote ? pick(targetNote, 'recordItemId', 'RECORD_ITEM_ID') : null;
            const committed = await commitActiveNoteBeforeNavigation();
            if (!committed) return;
            state.newNoteMode = false;
            const refreshedNotes = byType('NOTE');
            const refreshedIndex = targetRecordItemId == null ? nextIndex : refreshedNotes.findIndex(function (item) {
                return String(pick(item, 'recordItemId', 'RECORD_ITEM_ID')) === String(targetRecordItemId);
            });
            state.activeNoteIndex = refreshedIndex >= 0 ? refreshedIndex : Math.min(nextIndex, Math.max(0, refreshedNotes.length - 1));
            await renderNotes();
            if (targetRecordItemId != null) await markUnreadItemViewed(targetRecordItemId);
        });
        function renameNewDraftTitle() {
            if (!canEdit() || !state.newNoteMode) return;
            const tab = el.noteTabs.querySelector('[data-note-draft]');
            const selectButton = tab && tab.querySelector('[data-note-draft-select]');
            const label = selectButton && selectButton.querySelector('span');
            if (!tab || !selectButton || !label || tab.querySelector('input')) return;
            const before = String(state.newNoteTitle || '새 노트');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'moyo-record-note-tab-title-input';
            input.value = before;
            input.maxLength = 100;
            input.setAttribute('aria-label', '새 노트 이름 수정');
            tab.classList.add('is-renaming');
            selectButton.replaceChild(input, label);
            input.focus();
            input.select();
            let finished = false;
            function finish(commit) {
                if (finished) return;
                finished = true;
                const nextTitle = input.value.trim();
                tab.classList.remove('is-renaming');
                if (commit && nextTitle) {
                    state.newNoteTitle = nextTitle;
                    state.newNoteManualTitle = true;
                    state.noteEditRevision += 1;
                    state.noteDirty = true;
                    state.noteLastFailedRevision = -1;
                    saveActiveNote({ silent: true, publish: true });
                }
                renderNoteTabsOnly();
            }
            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') { event.preventDefault(); finish(true); }
                else if (event.key === 'Escape') { event.preventDefault(); finish(false); }
            });
            input.addEventListener('blur', function () { finish(true); }, { once: true });
        }

        el.noteTabs.addEventListener('dblclick', function (event) {
            if (event.target.closest('[data-note-draft-select]') && state.newNoteMode) {
                event.preventDefault();
                event.stopPropagation();
                renameNewDraftTitle();
                return;
            }
            if (event.target.closest('[data-note-menu-trigger]')) return;
            const select = event.target.closest('[data-note-select]');
            const tab = select && select.closest('[data-note-index]');
            if (!tab || !canEdit()) return;
            const index = Number(tab.getAttribute('data-note-index')) || 0;
            if (index !== state.activeNoteIndex || state.newNoteMode) return;
            event.preventDefault();
            event.stopPropagation();
            closeNoteTabMenu();
            renameActiveNote();
        });
        if (el.noteAddButton) {
            el.noteAddButton.addEventListener('click', async function (event) {
                event.preventDefault();
                event.stopPropagation();
                const committed = await commitActiveNoteBeforeNavigation();
                if (!committed) return;
                const existingDraft = readNoteDraft(null, 'create');
                state.newNoteTitle = existingDraft && existingDraft.title ? existingDraft.title : '새 노트';
                state.newNoteManualTitle = !!(existingDraft && existingDraft.manualTitle);
                state.newNoteMode = true;
                state.noteDirty = false;
                state.noteLastSavedContent = '';
                await renderNotes();
                const editable = state.noteEditorInstance && state.noteEditorInstance.ui && typeof state.noteEditorInstance.ui.getEditableElement === 'function'
                    ? state.noteEditorInstance.ui.getEditableElement()
                    : null;
                if (editable) editable.focus();
            });
        }
        if (el.noteMenu) {
            el.noteMenu.addEventListener('click', function (event) {
                const renameButton = event.target.closest('[data-note-menu-rename]');
                const deleteButton = event.target.closest('[data-note-menu-delete]');
                if (!renameButton && !deleteButton) return;
                event.preventDefault();
                event.stopPropagation();
                closeNoteTabMenu();
                if (renameButton) renameActiveNote();
                else deleteActiveNote();
            });
        }
        document.addEventListener('pointerdown', function (event) {
            if (!state.noteMenuOpen || !el.noteMenu) return;
            if (el.noteMenu.contains(event.target) || event.target.closest('[data-note-menu-trigger]')) return;
            closeNoteTabMenu();
        });
        window.addEventListener('resize', closeNoteTabMenu);
        window.addEventListener('scroll', closeNoteTabMenu, true);

        el.noteEditor.addEventListener('click', function (event) {
            const historyButton = event.target.closest('[data-note-history]');
            if (!historyButton) return;
            event.preventDefault();
            openNoteHistory();
        });
        el.noteEditor.addEventListener('submit', function (event) {
            const form = event.target.closest('[data-dynamic-note-form]');
            if (!form) return;
            event.preventDefault();
            saveActiveNote({ silent: false });
        });
        const FILE_UPLOAD_MAX_COUNT = 10;
        const FILE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
        const FILE_UPLOAD_ALLOWED_EXTENSIONS = new Set([
            'jpg','jpeg','png','gif','webp','svg','bmp','tif','tiff','pdf','txt','md','csv','hwp','hwpx','doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp','zip','rar','7z','tar','gz',
            'java','kt','kts','groovy','js','mjs','cjs','ts','tsx','jsx','json','xml','yml','yaml','properties','gradle','sql','css','scss','sass','less','html','htm','vue','jsp','jspx','py','rb','php','c','h','cpp','hpp','cs','go','rs','swift','sh','bash','zsh','bat','cmd','ps1',
            'mp3','wav','flac','m4a','ogg','mp4','mov','avi','mkv','webm'
        ]);
        const FILE_UPLOAD_BLOCKED_EXTENSIONS = new Set(['exe','dll','msi','com','scr','pif','cpl','sys','drv','vbs','vbe','wsf','wsh','hta','jar','war','ear','class','apk','ipa','dmg','iso']);
        function fileExtension(name) {
            const match = String(name || '').toLowerCase().match(/\.([a-z0-9]{1,20})$/);
            return match ? match[1] : '';
        }
        function validateSelectedFile(file) {
            const ext = fileExtension(file.name);
            if (!ext) return '확장자가 없는 파일은 업로드할 수 없습니다: ' + file.name;
            const parts = String(file.name || '').toLowerCase().split('.');
            if (parts.slice(1, -1).some(function (part) { return FILE_UPLOAD_BLOCKED_EXTENSIONS.has(part); })) return '위험한 이중 확장자 파일은 업로드할 수 없습니다: ' + file.name;
            if (FILE_UPLOAD_BLOCKED_EXTENSIONS.has(ext)) return '보안상 허용되지 않는 파일 형식입니다: ' + file.name;
            if (!FILE_UPLOAD_ALLOWED_EXTENSIONS.has(ext)) return '지원하지 않는 파일 형식입니다: ' + file.name;
            if (file.size > FILE_UPLOAD_MAX_BYTES) return '파일당 최대 크기는 20MB입니다: ' + file.name;
            return '';
        }
        function setFileFiles(files) {
            if (!el.fileInput || !files || files.length === 0) return false;
            const selected = Array.from(files).filter(function (file) { return file instanceof File && file.size > 0; });
            if (selected.length === 0) { alert('추가할 파일을 선택해주세요.'); return false; }
            if (selected.length > FILE_UPLOAD_MAX_COUNT) { alert('한 번에 최대 10개 파일까지 업로드할 수 있습니다.'); return false; }
            for (const file of selected) {
                const message = validateSelectedFile(file);
                if (message) { alert(message); return false; }
            }
            const transfer = new DataTransfer();
            selected.forEach(function (file) { transfer.items.add(file); });
            el.fileInput.files = transfer.files;
            return true;
        }
        async function submitSelectedFiles() {
            if (!el.fileForm || !el.fileInput || !el.fileInput.files || el.fileInput.files.length === 0) return;
            if (el.fileDropzone) {
                el.fileDropzone.disabled = true;
                el.fileDropzone.classList.add('is-uploading');
            }
            try {
                await handleSubmit(el.fileForm, 'FILE');
            } finally {
                if (el.fileDropzone) {
                    el.fileDropzone.disabled = false;
                    el.fileDropzone.classList.remove('is-uploading');
                }
            }
        }
        root.querySelectorAll('[data-record-action]').forEach(function (button) {
            button.addEventListener('click', function () {
                const type = button.getAttribute('data-record-action');
                const form = root.querySelector('[data-record-form="' + type + '"]');
                if (form) form.hidden = !form.hidden;
            });
        });
        if (el.fileDropzone && el.fileInput) {
            el.fileDropzone.addEventListener('click', function () {
                if (el.fileDropzone.disabled) return;
                el.fileInput.click();
            });
            el.fileInput.addEventListener('change', function () {
                if (setFileFiles(el.fileInput.files)) submitSelectedFiles();
            });
            ['dragenter', 'dragover'].forEach(function (name) {
                el.fileDropzone.addEventListener(name, function (event) {
                    event.preventDefault();
                    if (!el.fileDropzone.disabled) el.fileDropzone.classList.add('is-dragover');
                });
            });
            ['dragleave', 'drop'].forEach(function (name) {
                el.fileDropzone.addEventListener(name, function (event) {
                    event.preventDefault();
                    el.fileDropzone.classList.remove('is-dragover');
                });
            });
            el.fileDropzone.addEventListener('drop', function (event) {
                if (el.fileDropzone.disabled) return;
                if (setFileFiles(event.dataTransfer && event.dataTransfer.files)) submitSelectedFiles();
            });
        }
        let heic2anyLoader = null;
        function isHeicPhoto(file) {
            if (!file) return false;
            const name = String(file.name || '').toLowerCase();
            const type = String(file.type || '').toLowerCase();
            return /\.(heic|heif)$/i.test(name)
                || type === 'image/heic' || type === 'image/heif'
                || type === 'image/heic-sequence' || type === 'image/heif-sequence';
        }
        function isSupportedPhoto(file) {
            if (!file) return false;
            const name = String(file.name || '').toLowerCase();
            const type = String(file.type || '').toLowerCase();
            if (isHeicPhoto(file)) return true;
            return /\.(jpe?g|png|gif|webp)$/i.test(name)
                || /^(image\/(jpeg|png|gif|webp))$/i.test(type);
        }
        function loadHeic2Any() {
            if (typeof window.heic2any === 'function') return Promise.resolve(window.heic2any);
            if (heic2anyLoader) return heic2anyLoader;
            heic2anyLoader = new Promise(function (resolve, reject) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
                script.async = true;
                script.onload = function () {
                    if (typeof window.heic2any === 'function') resolve(window.heic2any);
                    else reject(new Error('HEIC 변환 모듈을 불러오지 못했습니다.'));
                };
                script.onerror = function () {
                    reject(new Error('HEIC 변환 모듈을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.'));
                };
                document.head.appendChild(script);
            }).catch(function (error) {
                heic2anyLoader = null;
                throw error;
            });
            return heic2anyLoader;
        }
        async function convertHeicPhoto(file) {
            if (!isHeicPhoto(file)) return file;
            if (file.size > 10 * 1024 * 1024) {
                throw new Error(file.name + ': 사진 한 장은 최대 10MB까지 업로드할 수 있습니다.');
            }
            const converter = await loadHeic2Any();
            const converted = await converter({ blob: file, toType: 'image/jpeg', quality: 0.92 });
            const blob = Array.isArray(converted) ? converted[0] : converted;
            if (!(blob instanceof Blob)) throw new Error(file.name + ': HEIC/HEIF 사진을 JPG로 변환하지 못했습니다.');
            if (blob.size > 10 * 1024 * 1024) {
                throw new Error(file.name + ': JPG 변환 후 사진 크기가 10MB를 초과합니다.');
            }
            const baseName = String(file.name || 'photo.heic').replace(/\.(heic|heif)$/i, '') || 'photo';
            return new File([blob], baseName + '.jpg', {
                type: 'image/jpeg',
                lastModified: file.lastModified || Date.now()
            });
        }
        async function preparePhotoFiles(files) {
            if (!el.photoInput || !files || files.length === 0) return false;
            const selected = Array.from(files).slice(0, 10);
            const unsupported = selected.filter(function (file) { return !isSupportedPhoto(file); });
            if (unsupported.length > 0) {
                alert('JPG, PNG, GIF, WEBP, HEIC/HEIF 사진만 추가할 수 있습니다.');
                return false;
            }
            try {
                const images = [];
                for (const file of selected) images.push(await convertHeicPhoto(file));
                const transfer = new DataTransfer();
                images.forEach(function (file) { transfer.items.add(file); });
                el.photoInput.files = transfer.files;
                return true;
            } catch (error) {
                console.error('[MOYO record photo] HEIC conversion failed', error);
                alert(error && error.message ? error.message : 'HEIC/HEIF 사진을 JPG로 변환하지 못했습니다.');
                return false;
            }
        }
        async function submitSelectedPhotos() {
            if (!el.photoForm || !el.photoInput || !el.photoInput.files || el.photoInput.files.length === 0) return;
            await handleSubmit(el.photoForm, 'PHOTO');
        }
        if (el.photoDropzone && el.photoInput) {
            el.photoDropzone.addEventListener('click', function () {
                if (el.photoDropzone.disabled) return;
                el.photoInput.click();
            });
            el.photoInput.addEventListener('change', async function () {
                const picked = Array.from(el.photoInput.files || []);
                if (await preparePhotoFiles(picked)) await submitSelectedPhotos();
            });
            ['dragenter', 'dragover'].forEach(function (name) {
                el.photoDropzone.addEventListener(name, function (event) {
                    event.preventDefault();
                    if (!el.photoDropzone.disabled) el.photoDropzone.classList.add('is-dragover');
                });
            });
            ['dragleave', 'drop'].forEach(function (name) {
                el.photoDropzone.addEventListener(name, function (event) {
                    event.preventDefault();
                    el.photoDropzone.classList.remove('is-dragover');
                });
            });
            el.photoDropzone.addEventListener('drop', async function (event) {
                if (el.photoDropzone.disabled) return;
                if (await preparePhotoFiles(event.dataTransfer && event.dataTransfer.files)) await submitSelectedPhotos();
            });
        }
        if (el.photoList) {
            el.photoList.addEventListener('click', function (event) {
                const likeButton = event.target.closest('[data-record-photo-like]');
                if (likeButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (window.MoyoPhotoPostDetail && typeof window.MoyoPhotoPostDetail.toggleLike === 'function') {
                        window.MoyoPhotoPostDetail.toggleLike(likeButton.dataset.recordPhotoLike);
                    }
                    return;
                }
                const commentButton = event.target.closest('[data-record-photo-comment]');
                if (commentButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    openPhoto(commentButton.dataset.recordPhotoComment);
                    return;
                }
                const deleteButton = event.target.closest('[data-record-photo-delete]');
                if (deleteButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    deletePhoto(deleteButton.dataset.recordPhotoDelete, deleteButton.dataset.recordPhotoPost, deleteButton);
                    return;
                }
                const openButton = event.target.closest('[data-record-photo-open]');
                if (openButton) {
                    event.preventDefault();
                    openPhoto(openButton.dataset.recordPhotoOpen);
                }
            });
        }
        if (el.linkCancel) {
            el.linkCancel.addEventListener('click', function (event) {
                event.preventDefault();
                resetLinkForm();
            });
        }
        el.forms.forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                handleSubmit(form, form.getAttribute('data-record-form'));
            });
        });
        const locationSearch = root.querySelector('[data-record-location-search]');
        if (locationSearch) locationSearch.addEventListener('click', function () {
            if (typeof config.onSearchLocation === 'function') {
                config.onSearchLocation({ form: el.locationForm, addressInput: el.locationForm.elements.locationAddress, nameInput: el.locationForm.elements.locationText });
                return;
            }
            openLocationSearch();
        });
        if (el.locationForm) {
            el.locationForm.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' || event.isComposing) return;
                const target = event.target;
                if (!target || target.tagName === 'TEXTAREA' || target.closest('button')) return;
                event.preventDefault();
                event.stopPropagation();
                if (locationSearch) locationSearch.click();
            });
        }
        if (el.locationForm && el.locationForm.elements.locationText) {
            el.locationForm.elements.locationText.addEventListener('input', function () {
                const picked = String(el.locationForm.elements.locationAddress.value || '').trim();
                if (picked && this.value.trim() !== picked) {
                    el.locationForm.elements.locationAddress.value = '';
                    el.locationForm.elements.locationLat.value = '';
                    el.locationForm.elements.locationLng.value = '';
                    el.locationForm.elements.locationPlaceId.value = '';
                    setLocationSearchState('');
                }
                syncLocationInlineCancel();
                syncLocationEmptyState();
            });
        }
        if (el.locationForm) {
            ['memo', 'locationDescription'].forEach(function (name) {
                const input = el.locationForm.elements[name];
                if (!input) return;
                input.addEventListener('input', function () {
                    syncLocationInlineCancel();
                    syncLocationEmptyState();
                });
            });
        }
        if (el.locationMapOpen) el.locationMapOpen.addEventListener('click', function () {
            const address = el.locationForm ? el.locationForm.elements.locationAddress.value : '';
            const url = locationMapExternalUrl(address);
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
        });
        if (el.locationCancel) el.locationCancel.addEventListener('click', function () {
            resetLocationForm();
        });
        function closeSavedLocationPreviews(exceptPreview) {
            if (!el.locationCurrent) return;
            el.locationCurrent.querySelectorAll('[data-record-location-card-preview]:not([hidden])').forEach(function (preview) {
                if (exceptPreview && preview === exceptPreview) return;
                preview.hidden = true;
                const entry = preview.closest('.moyo-record-location-entry');
                const card = entry && entry.querySelector('[data-record-location-select]');
                if (card) {
                    card.classList.remove('is-expanded');
                    card.setAttribute('aria-expanded', 'false');
                    const toggle = card.querySelector('[data-record-location-preview-toggle]');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
        function toggleSavedLocationPreview(card) {
            if (!card || canEdit()) return;
            const entry = card.closest('.moyo-record-location-entry');
            const preview = entry && entry.querySelector('[data-record-location-card-preview]');
            if (!preview) return;
            const opening = preview.hidden;
            if (opening) closeSavedLocationPreviews(preview);
            preview.hidden = !opening;
            card.classList.toggle('is-expanded', opening);
            card.setAttribute('aria-expanded', opening ? 'true' : 'false');
            const toggle = card.querySelector('[data-record-location-preview-toggle]');
            if (toggle) toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
            if (opening) {
                const iframe = preview.querySelector('[data-record-location-card-map-src]');
                if (iframe && !iframe.getAttribute('src')) iframe.setAttribute('src', iframe.dataset.recordLocationCardMapSrc || '');
            }
        }

        function closeActionPortalMenu() {
            const panel = state.actionMenuPanel;
            const button = state.actionMenuButton;
            if (button) {
                button.setAttribute('aria-expanded', 'false');
                button.classList.remove('is-open');
            }
            if (panel) panel.remove();
            state.actionMenuButton = null;
            state.actionMenuPanel = null;
        }

        function positionActionPortalMenu() {
            const button = state.actionMenuButton;
            const panel = state.actionMenuPanel;
            const modal = root.querySelector('.moyo-record-modal__panel') || root;
            if (!button || !panel || !modal || !button.isConnected) {
                closeActionPortalMenu();
                return;
            }

            panel.style.display = 'block';
            panel.style.visibility = 'hidden';
            panel.style.position = 'fixed';
            panel.style.left = '0px';
            panel.style.top = '0px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            panel.style.zIndex = '30100';

            const buttonRect = button.getBoundingClientRect();
            const modalRect = modal.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            const width = Math.ceil(panelRect.width || panel.offsetWidth || 144);
            const height = Math.ceil(panelRect.height || panel.offsetHeight || 48);
            const gap = 6;
            const margin = 10;
            let left = buttonRect.right - width;
            left = Math.max(modalRect.left + margin, Math.min(left, modalRect.right - width - margin));
            const belowTop = buttonRect.bottom + gap;
            const canOpenBelow = belowTop + height <= modalRect.bottom - margin;
            const top = canOpenBelow ? belowTop : Math.max(modalRect.top + margin, buttonRect.top - gap - height);
            panel.classList.toggle('is-open-upward', !canOpenBelow);
            panel.style.left = Math.round(left) + 'px';
            panel.style.top = Math.round(top) + 'px';
            panel.style.visibility = 'visible';
        }

        function openActionPortalMenu(button) {
            if (!button) return;
            if (state.actionMenuButton === button && state.actionMenuPanel) {
                closeActionPortalMenu();
                return;
            }
            closeActionPortalMenu();
            const sourcePanel = button.nextElementSibling;
            if (!sourcePanel || !sourcePanel.hasAttribute('data-record-action-menu-panel')) return;
            const portalPanel = document.createElement('div');
            portalPanel.className = sourcePanel.className + ' moyo-record-action-menu-portal';
            portalPanel.setAttribute('role', 'menu');
            portalPanel.innerHTML = sourcePanel.innerHTML;
            state.actionMenuButton = button;
            state.actionMenuPanel = portalPanel;
            button.setAttribute('aria-expanded', 'true');
            button.classList.add('is-open');
            document.body.appendChild(portalPanel);
            positionActionPortalMenu();
        }

        root.addEventListener('click', function (event) {
            const menuToggle = event.target.closest('[data-record-action-menu-toggle]');
            if (!menuToggle || !root.contains(menuToggle)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            openActionPortalMenu(menuToggle);
        }, true);

        if (el.locationCurrent) el.locationCurrent.addEventListener('click', function (event) {
            if (event.target.closest('[data-record-action-menu-toggle]')) return;
            const previewToggle = event.target.closest('[data-record-location-preview-toggle]');
            if (previewToggle) {
                event.preventDefault();
                event.stopPropagation();
                const entry = previewToggle.closest('[data-record-location-entry]');
                const card = entry && entry.querySelector('[data-record-location-select]');
                if (card) toggleSavedLocationPreview(card);
                return;
            }
            const mapButton = event.target.closest('[data-record-location-current-map]');
            if (mapButton) {
                const url = locationMapExternalUrl(mapButton.dataset.recordLocationCurrentMap);
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                return;
            }
        });

        /* 포털 메뉴 바깥 클릭은 버블 단계까지 기다리지 않고 캡처 단계에서 닫는다.
           카드 내부의 다른 이벤트가 전파를 막아도 메뉴가 남지 않도록 한다. */
        document.addEventListener('click', function (event) {
            const panel = state.actionMenuPanel;
            if (!panel) return;

            if (panel.contains(event.target)) return;

            const toggle = event.target.closest && event.target.closest('[data-record-action-menu-toggle]');
            if (toggle) {
                /* 현재 버튼 재클릭은 root의 기존 토글 처리에 맡긴다.
                   다른 버튼이면 기존 메뉴만 먼저 닫고 새 메뉴가 열리게 한다. */
                if (toggle === state.actionMenuButton) return;
                closeActionPortalMenu();
                return;
            }

            closeActionPortalMenu();
        }, true);

        document.addEventListener('click', function (event) {
            const panel = state.actionMenuPanel;
            if (panel && panel.contains(event.target)) {
                const fileRename = event.target.closest('[data-record-file-rename]');
                if (fileRename) {
                    const contentId = fileRename.dataset.recordFileRename;
                    const currentName = fileRename.dataset.recordFileName || '';
                    closeActionPortalMenu();
                    renameFile(contentId, currentName);
                    return;
                }
                const fileDelete = event.target.closest('[data-record-file-delete]');
                if (fileDelete) {
                    const id = fileDelete.dataset.recordFileDelete;
                    closeActionPortalMenu();
                    deleteFile(id, null);
                    return;
                }
                const linkEdit = event.target.closest('[data-record-link-edit]');
                if (linkEdit) {
                    const id = linkEdit.dataset.recordLinkEdit;
                    closeActionPortalMenu();
                    editLink(id);
                    return;
                }
                const linkDelete = event.target.closest('[data-record-link-delete]');
                if (linkDelete) {
                    const id = linkDelete.dataset.recordLinkDelete;
                    closeActionPortalMenu();
                    deleteLink(id, null);
                    return;
                }
                const primaryButton = event.target.closest('[data-record-location-primary]');
                if (primaryButton) {
                    const id = primaryButton.dataset.recordLocationPrimary;
                    closeActionPortalMenu();
                    setPrimaryLocation(id, null);
                    return;
                }
                const locationEdit = event.target.closest('[data-record-location-edit]');
                if (locationEdit) {
                    const id = locationEdit.dataset.recordLocationEdit;
                    closeActionPortalMenu();
                    editLocation(id);
                    return;
                }
                const locationDelete = event.target.closest('[data-record-location-delete]');
                if (locationDelete) {
                    const id = locationDelete.dataset.recordLocationDelete;
                    closeActionPortalMenu();
                    deleteLocation(id, null);
                    return;
                }
                return;
            }
            if (event.target.closest('[data-record-action-menu-toggle]')) return;
            closeActionPortalMenu();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && state.actionMenuPanel) {
                event.preventDefault();
                closeActionPortalMenu();
            }
        });

        [el.fileListWrap, el.linkListWrap, el.locationListWrap].forEach(function (wrap) {
            if (!wrap) return;
            wrap.addEventListener('scroll', function () {
                if (state.actionMenuPanel) closeActionPortalMenu();
            }, { passive: true });
        });
        window.addEventListener('resize', function () {
            if (state.actionMenuPanel) positionActionPortalMenu();
        });

        document.addEventListener('moyo:content-metadata-updated', function (event) {
            const detail = event.detail || {};
            if (detail.source === 'record' || !state.opened || !state.recordTargetId) return;
            const changedType = String(detail.contentType || '').toUpperCase();
            const changedId = String(detail.contentId == null ? '' : detail.contentId);
            if (!changedType) return;
            const linked = state.items.some(function (entry) {
                if (String(pick(entry, 'recordType', 'RECORD_TYPE') || '').toUpperCase() !== changedType) return false;
                return !changedId || String(pick(entry, 'contentId', 'CONTENT_ID') || '') === changedId;
            });
            if (!linked) return;
            if (changedType === 'NOTE' && (state.noteDirty || state.noteSaving || state.noteConflict)) return;
            window.clearTimeout(state.externalRefreshTimer);
            state.externalRefreshTimer = window.setTimeout(function () {
                load().catch(function (error) { console.warn('탐색기 변경 후 기록 새로고침 실패:', error); });
            }, 120);
        });

        document.addEventListener('moyo:photo-post-updated', function (event) {
            const detail = event.detail || {};
            const postId = String(detail.postId || '');
            if (!postId) return;
            const item = state.items.find(function (entry) {
                return String(pick(entry, 'recordType', 'RECORD_TYPE') || '').toUpperCase() === 'PHOTO' &&
                    String(pick(entry, 'contentId', 'CONTENT_ID') || '') === postId;
            });
            if (!item) return;
            if (detail.likeCount !== undefined) {
                item.likeCount = Number(detail.likeCount || 0);
                item.LIKE_COUNT = item.likeCount;
            }
            if (detail.liked !== undefined) {
                item.likedByMe = detail.liked ? 1 : 0;
                item.LIKED_BY_ME = item.likedByMe;
            }
            if (detail.commentCount !== undefined) {
                item.commentCount = Number(detail.commentCount || 0);
                item.COMMENT_COUNT = item.commentCount;
            }
            renderPhotos();
            if (typeof config.onChanged === 'function') {
                config.onChanged({ recordTargetId: state.recordTargetId, draftKey: state.draftKey, type: 'PHOTO', postId: postId });
            }
        });
        document.addEventListener('moyo:photo-post-deleted', function (event) {
            const postId = String((event.detail || {}).postId || '');
            if (!postId) return;
            const before = state.items.length;
            state.items = state.items.filter(function (entry) {
                return !(String(pick(entry, 'recordType', 'RECORD_TYPE') || '').toUpperCase() === 'PHOTO' &&
                    String(pick(entry, 'contentId', 'CONTENT_ID') || '') === postId);
            });
            if (before !== state.items.length) {
                renderPhotos();
                renderCounts();
            }
        });
        document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && state.opened) close(); });

        const instance = {
            open: open,
            close: close,
            reload: load,
            clearUnreadType: clearUnreadType,
            clearUnreadItem: clearUnreadItem,
            getState: function () { return Object.assign({}, state); }
        };
        root.__moyoRecordInstance = instance;
        return instance;
    }

    window.CommonContentRecordModal = { create: create };
})(window, document);
