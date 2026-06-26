(function () {
    'use strict';

    const form = document.getElementById('noteForm');
    const memo = document.getElementById('memo');
    if (!form || !memo) return;

    const title = document.getElementById('noteTitle');
    const category = document.getElementById('noteCategory');
    const icon = document.getElementById('noteIcon');
    const folder = document.getElementById('noteFolder');
    const scopeInput = document.getElementById('noteScopeInput');
    const wsIdInput = document.getElementById('noteWsIdInput');
    const projIdInput = document.getElementById('noteProjIdInput');
    const status = document.getElementById('draftStatus');
    const noteId = form.dataset.noteId || '';
    const draftKey = form.dataset.draftKey || '';
    const isEdit = Boolean(noteId);
    let editor = null;
    let dirty = false;
    let submitting = false;
    let saveTimer = null;
    let selectedFiles = [];
    const initialMemoValue = memo.value || '';
    let editorReady = false;


    function ensurePrivateNoteContext() {
        if (scopeInput) scopeInput.value = 'PRIVATE';
        if (wsIdInput) wsIdInput.value = '';
        if (projIdInput) projIdInput.value = '';
    }


    const customTemplateStorageKey = 'moyo-note-custom-templates-v1';

    function loadCustomTemplates() {
        try {
            const parsed = JSON.parse(localStorage.getItem(customTemplateStorageKey) || '[]');
            return Array.isArray(parsed) ? parsed.filter(function (item) {
                return item && item.id && item.name && item.html;
            }) : [];
        } catch (e) {
            return [];
        }
    }

    function saveCustomTemplates(items) {
        localStorage.setItem(customTemplateStorageKey, JSON.stringify(items));
    }

    function renderCustomTemplates() {
        const wrap = document.getElementById('customTemplateButtons');
        if (!wrap) return;
        const items = loadCustomTemplates();
        wrap.innerHTML = '';
        items.forEach(function (item) {
            const group = document.createElement('span');
            group.className = 'note-custom-template-chip';

            const applyButton = document.createElement('button');
            applyButton.type = 'button';
            applyButton.className = 'note-template-btn note-template-btn-custom';
            applyButton.textContent = item.name;
            applyButton.addEventListener('click', function () { applyTemplateHtml(item.html); });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'note-template-delete-btn';
            deleteButton.setAttribute('aria-label', item.name + ' 템플릿 삭제');
            deleteButton.textContent = '×';
            deleteButton.addEventListener('click', function (event) {
                event.stopPropagation();
                if (!confirm('"' + item.name + '" 템플릿을 삭제할까요?')) return;
                saveCustomTemplates(items.filter(function (saved) { return saved.id !== item.id; }));
                renderCustomTemplates();
            });

            group.appendChild(applyButton);
            group.appendChild(deleteButton);
            wrap.appendChild(group);
        });
    }

    function applyTemplateHtml(html) {
        if (!html) return;
        const current = getData().trim();
        if (current && !confirm('현재 본문 뒤에 선택한 템플릿을 추가할까요?')) return;
        setData(current ? current + '<hr>' + html : html);
        markDirty();
        if (editor) editor.editing.view.focus();
    }

    function initTemplateSaveDialog() {
        const openButton = document.getElementById('saveAsTemplateButton');
        const dialog = document.getElementById('templateSaveDialog');
        const input = document.getElementById('templateNameInput');
        const confirmButton = document.getElementById('confirmTemplateSave');
        if (!openButton || !dialog || !input || !confirmButton) return;

        function closeDialog() {
            dialog.hidden = true;
            input.value = '';
        }

        openButton.addEventListener('click', function () {
            if (!getData().trim()) {
                alert('템플릿으로 저장할 본문을 먼저 작성해 주세요.');
                return;
            }
            dialog.hidden = false;
            setTimeout(function () { input.focus(); }, 0);
        });

        dialog.querySelectorAll('[data-template-dialog-close]').forEach(function (button) {
            button.addEventListener('click', closeDialog);
        });

        confirmButton.addEventListener('click', function () {
            const name = input.value.trim();
            if (!name) {
                input.focus();
                return;
            }
            const items = loadCustomTemplates();
            if (items.some(function (item) { return item.name.toLowerCase() === name.toLowerCase(); })) {
                alert('같은 이름의 템플릿이 이미 있습니다.');
                input.focus();
                return;
            }
            items.push({
                id: 'tpl-' + Date.now(),
                name: name,
                html: getData(),
                createdAt: Date.now()
            });
            saveCustomTemplates(items);
            renderCustomTemplates();
            closeDialog();
            setStatus('✓ 템플릿 저장됨', 'saved');
        });

        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                confirmButton.click();
            }
            if (event.key === 'Escape') closeDialog();
        });
    }


    function initNoteFolderPicker() {
        const openButton = document.getElementById('noteFolderPickerButton');
        const label = document.getElementById('noteFolderPickerLabel');
        if (!openButton || !folder) return;

        const syncLabel = function () {
            const option = folder.options[folder.selectedIndex] || folder.options[0];
            if (label) label.textContent = option ? option.textContent.trim() : '미분류';
        };

        const currentContext = function () {
            return {
                scope: scopeInput ? (scopeInput.value || 'PRIVATE') : 'PRIVATE',
                wsId: wsIdInput ? (wsIdInput.value || '') : '',
                projId: projIdInput ? (projIdInput.value || '') : ''
            };
        };

        openButton.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (!window.CommonFolderModal || !window.NoteFolderAdapter) {
                window.alert('폴더 모달 스크립트가 아직 로드되지 않았습니다.');
                return;
            }

            window.CommonFolderModal.openSelect({
                selectElement: folder,
                trigger: openButton,
                label: label,
                adapter: window.NoteFolderAdapter,
                context: currentContext(),
                title: '폴더 선택',
                description: '노트 저장 위치를 선택합니다.',
                createPrompt: '현재 노트 영역의 최상위에 새 폴더를 만듭니다.\n새 폴더 이름을 입력해 주세요.',
                unclassifiedLabel: '미분류',
                onSelect: function () {
                    syncLabel();
                    if (typeof markDirty === 'function') markDirty();
                }
            });
        });

        folder.addEventListener('change', syncLabel);
        syncLabel();
    }

    const templates = {
        meeting: '<h2>회의 개요</h2><ul><li><strong>일시:</strong>&nbsp;</li><li><strong>참석자:</strong>&nbsp;</li></ul><h2>논의 내용</h2><ul><li>&nbsp;</li></ul><h2>결정 사항</h2><ul><li>&nbsp;</li></ul><h2>다음 할 일</h2><ul><li>☐ 담당자 / 기한 / 할 일</li></ul>',
        checklist: '<h2>체크리스트</h2><ul><li>☐ 할 일 1</li><li>☐ 할 일 2</li><li>☐ 할 일 3</li></ul><h2>참고</h2><ul><li>&nbsp;</li></ul>',
        issue: '<h2>문제 상황</h2><p>&nbsp;</p><h2>발생 환경</h2><ul><li><strong>화면/기능:</strong>&nbsp;</li><li><strong>발생 시점:</strong>&nbsp;</li></ul><h2>원인</h2><p>&nbsp;</p><h2>해결 방법</h2><p>&nbsp;</p><h2>확인 항목</h2><ul><li>☐ 재현 테스트</li><li>☐ 영향 범위 확인</li><li>☐ 최종 동작 확인</li></ul>'
    };

    function setStatus(text, state) {
        if (!status) return;
        status.textContent = text;
        status.dataset.state = state || '';
    }

    function getData() {
        return editor ? editor.getData() : memo.value;
    }

    function setData(value) {
        if (editor) editor.setData(value || '');
        else memo.value = value || '';
    }

    function markDirty() {
        if (!editorReady && isEdit) return;
        dirty = true;
        setStatus('저장 대기', 'dirty');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(autoSave, 1500);
    }

    function autoSave() {
        if (!dirty || submitting) return;
        if (isEdit) saveToServer();
        else saveLocalDraft();
    }

    function saveLocalDraft() {
        if (!draftKey) return;
        localStorage.setItem(draftKey, JSON.stringify({
            title: title ? title.value : '',
            memo: getData(),
            category: category ? category.value : 'GENERAL',
            icon: icon ? icon.value : '📝',
            folderId: folder ? folder.value : '',
            savedAt: Date.now()
        }));
        dirty = false;
        setStatus('✓ 저장됨', 'saved');
    }

    function restoreLocalDraft() {
        if (!draftKey || isEdit) return;
        const raw = localStorage.getItem(draftKey);
        if (!raw) return;
        try {
            const draft = JSON.parse(raw);
            if (!draft || (!draft.title && !draft.memo)) return;
            if (confirm('이전에 자동 저장된 작성 내용을 불러올까요?')) {
                if (title) title.value = draft.title || '';
                setData(draft.memo || '');
                if (category && draft.category) category.value = draft.category;
                if (icon && draft.icon) {
                    icon.value = draft.icon;
                    if (iconPreview) iconPreview.textContent = icon.value;
                    if (iconButton) iconButton.textContent = icon.value;
                }
                if (folder && draft.folderId !== undefined) {
                    folder.value = draft.folderId || '';
                    folder.dispatchEvent(new Event('change', { bubbles: true }));
                }
                setStatus('✓ 임시저장 불러옴', 'saved');
            } else {
                localStorage.removeItem(draftKey);
            }
        } catch (e) {
            localStorage.removeItem(draftKey);
        }
    }

    function saveToServer() {
        if (!noteId) return;
        setStatus('저장 중...', 'saving');
        const body = new URLSearchParams();
        body.set('noteId', noteId);
        body.set('noteTitle', (title && title.value.trim()) || '제목 없음');
        body.set('memo', getData());
        body.set('category', category ? category.value : 'GENERAL');
        body.set('icon', icon ? icon.value : '📝');
        if (folder && folder.value) body.set('folderId', folder.value);
        fetch('/note/autosave', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            body: body.toString()
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).then(function (data) {
            if (!data || !data.success) throw new Error((data && data.message) || '자동저장 실패');
            dirty = false;
            setStatus('✓ 저장됨', 'saved');
        }).catch(function () {
            setStatus('저장 실패', 'error');
        });
    }

    function applyTemplate(type) {
        applyTemplateHtml(templates[type]);
    }

    document.querySelectorAll('.note-template-btn').forEach(function (button) {
        button.addEventListener('click', function () { applyTemplate(button.dataset.template); });
    });

    renderCustomTemplates();
    initTemplateSaveDialog();
    initNoteFolderPicker();
    ensurePrivateNoteContext();

    [title, category, folder].forEach(function (el) {
        if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', markDirty);
    });

    const iconButton = document.getElementById('noteIconButton');
    const iconMenu = document.getElementById('noteIconMenu');
    const iconPreview = document.getElementById('noteIconPreview');
    function closeIconMenu() {
        if (!iconMenu || !iconButton) return;
        iconMenu.hidden = true;
        iconButton.setAttribute('aria-expanded', 'false');
    }
    if (iconButton && iconMenu && icon) {
        iconButton.addEventListener('click', function (event) {
            event.stopPropagation();
            const willOpen = iconMenu.hidden;
            iconMenu.hidden = !willOpen;
            iconButton.setAttribute('aria-expanded', String(willOpen));
        });
        iconMenu.querySelectorAll('[data-note-icon], [data-icon]').forEach(function (button) {
            button.addEventListener('click', function () {
                const pickedIcon = button.dataset.noteIcon || button.dataset.icon || '📝';
                icon.value = pickedIcon;
                if (iconPreview) iconPreview.textContent = icon.value;
                if (iconButton) iconButton.textContent = icon.value;
                closeIconMenu();
                markDirty();
            });
        });
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.note-icon-picker')) closeIconMenu();
        });
    }

    if (window.MoyoCkeditor) {
        window.MoyoCkeditor.create(memo, {
            uploadUrl: '/note/image-upload',
            placeholder: '내용을 입력하세요.',
            initialData: initialMemoValue
        }).then(function (instance) {
            editor = instance;
            if (isEdit && initialMemoValue && !editor.getData()) {
                editor.setData(initialMemoValue);
            }
            editorReady = true;
            editor.model.document.on('change:data', markDirty);
            restoreLocalDraft();
        }).catch(function (error) {
            console.error('노트 CKEditor 초기화 실패:', error);
            editorReady = true;
            if (isEdit && initialMemoValue && !memo.value) memo.value = initialMemoValue;
            memo.addEventListener('input', markDirty);
            restoreLocalDraft();
        });
    } else {
        console.error('공통 CKEditor 설정 파일이 로드되지 않았습니다.');
        editorReady = true;
        memo.addEventListener('input', markDirty);
        restoreLocalDraft();
    }



    const dualButton = document.getElementById('openDualFromEditor');
    const redirectTo = document.getElementById('noteRedirectTo');

    if (dualButton) {
        dualButton.addEventListener('click', function () {
            if (submitting) return;

            if (redirectTo) redirectTo.value = 'dual';
            memo.value = getData();

            submitting = true;
            dirty = false;
            clearTimeout(saveTimer);
            setStatus('저장 후 듀얼 화면을 여는 중...', 'saving');

            if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
            } else {
                form.submit();
            }
        });
    }

    form.addEventListener('submit', function (event) {
        ensurePrivateNoteContext();
        submitting = true;
        clearTimeout(saveTimer);
        memo.value = getData();
        setStatus('저장 중...', 'saving');
        if (draftKey) localStorage.removeItem(draftKey);
        dirty = false;
    });

    window.addEventListener('beforeunload', function (event) {
        if (!dirty || submitting) return;
        event.preventDefault();
        event.returnValue = '';
    });

    // attachments
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('files');
    const selectedFileList = document.getElementById('selectedFileList');
    if (dropZone && fileInput && selectedFileList) {
        dropZone.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', function (e) { addFiles(e.target.files); });
        dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('drag-over'); });
        dropZone.addEventListener('drop', function (e) { e.preventDefault(); dropZone.classList.remove('drag-over'); addFiles(e.dataTransfer.files); });
    }

    function addFiles(files) {
        Array.from(files || []).forEach(function (file) {
            if (!selectedFiles.some(function (item) { return item.name === file.name && item.size === file.size && item.lastModified === file.lastModified; })) selectedFiles.push(file);
        });
        syncFiles(); renderFiles(); markDirty();
    }
    function syncFiles() {
        const dt = new DataTransfer();
        selectedFiles.forEach(function (file) { dt.items.add(file); });
        fileInput.files = dt.files;
    }
    function renderFiles() {
        selectedFileList.innerHTML = selectedFiles.map(function (file, index) {
            return '<div class="note-file-row"><span class="note-file-name">📎 ' + escapeHtml(file.name) + '</span><span class="note-file-size">' + formatFileSize(file.size) + '</span><button type="button" class="note-file-remove" data-remove-index="' + index + '">삭제</button></div>';
        }).join('');
        selectedFileList.classList.toggle('active', selectedFiles.length > 0);
        selectedFileList.querySelectorAll('[data-remove-index]').forEach(function (button) {
            button.addEventListener('click', function () { selectedFiles.splice(Number(button.dataset.removeIndex), 1); syncFiles(); renderFiles(); markDirty(); });
        });
    }
    function formatFileSize(size) { return size >= 1048576 ? (size / 1048576).toFixed(1) + ' MB' : size >= 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B'; }
    function escapeHtml(text) { return String(text || '').replace(/[&<>"']/g, function (ch) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }

    document.querySelectorAll('.existing-file-delete-btn').forEach(function (button) {
        button.addEventListener('click', function () {
            if (!confirm('첨부파일을 삭제할까요?')) return;
            const body = new URLSearchParams({fileId: button.dataset.fileId, noteId: noteId});
            fetch('/note/file/delete', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}, body: body.toString()})
                .then(function (res) { return res.json(); })
                .then(function (data) { if (data && data.success) button.closest('.note-existing-file').remove(); else alert((data && data.message) || '삭제 실패'); })
                .catch(function () { alert('삭제 중 오류가 발생했습니다.'); });
        });
    });
})();
