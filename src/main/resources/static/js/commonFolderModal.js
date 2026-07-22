(function () {
    'use strict';

    const escapeHtml = function (value) {
        return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
        });
    };

    const formatFolderName = function (value, fallback) {
        const text = String(value == null ? '' : value).trim();
        if (!text) return fallback || '미분류';
        return text.replace(/^\/\s*/, '');
    };

    const ensureModalElement = function () {
        let modal = document.getElementById('noteMoveModal');
        if (!modal) {
            const wrap = document.createElement('div');
            wrap.innerHTML = `
<div class="nl-modal-backdrop common-folder-modal" id="noteMoveModal" hidden>
    <section class="nl-move-modal" role="dialog" aria-modal="true" aria-labelledby="noteMoveModalTitle">
        <div class="nl-modal-head">
            <div>
                <h2 id="noteMoveModalTitle">폴더 선택</h2>
                <p id="noteMoveModalDescription">저장할 폴더를 선택하세요.</p>
            </div>
            <button type="button" class="nl-modal-close" data-move-close aria-label="닫기">×</button>
        </div>
        <div class="nl-move-folder-tools" data-modal-folder-tools>
            <button type="button" class="nl-modal-folder-create" data-modal-folder-create>
                <i class="fa-solid fa-folder-plus" aria-hidden="true"></i> 새 폴더 만들기
            </button>
        </div>
        <div class="nl-folder-choice-list" id="noteMoveFolderList"></div>
        <div class="nl-modal-actions">
            <button type="button" class="nl-modal-confirm" data-folder-confirm>선택</button>
        </div>
    </section>
</div>`;
            document.body.appendChild(wrap.firstElementChild);
        }
        return document.getElementById('noteMoveModal');
    };

    const getParts = function () {
        const modal = ensureModalElement();
        return {
            modal,
            list: modal.querySelector('#noteMoveFolderList'),
            title: modal.querySelector('#noteMoveModalTitle'),
            description: modal.querySelector('#noteMoveModalDescription'),
            createButton: modal.querySelector('[data-modal-folder-create]'),
            tools: modal.querySelector('[data-modal-folder-tools]'),
            confirmButton: modal.querySelector('[data-folder-confirm]')
        };
    };

    const setOpen = function (modal, open) {
        modal.hidden = !open;
        document.body.classList.toggle('nl-modal-open', open);
    };

    window.CommonFolderModal = {
        openSelect: function (options) {
            const parts = getParts();
            const { modal, list, title, description, createButton, tools, confirmButton } = parts;
            if (!options || !options.selectElement || !options.adapter) return;

            const select = options.selectElement;
            const adapter = options.adapter;
            const context = options.context || {};
            const trigger = options.trigger || null;
            const label = options.label || null;
            const canManage = options.canManage !== false;
            const showManageActions = options.showManageActions === true;
            const instantSelect = options.instantSelect !== false;
            const showCurrent = options.showCurrent !== false;
            const unclassifiedLabel = options.unclassifiedLabel || '미분류';
            let pendingValue = String(select.value || '');

            title.textContent = options.title || '폴더 선택';
            description.textContent = options.description || '저장할 폴더를 선택하세요.';
            createButton.hidden = !canManage;
            tools.hidden = !canManage;
            confirmButton.hidden = instantSelect;
            confirmButton.textContent = options.confirmLabel || '선택';

            const currentOption = function () {
                return select.options[select.selectedIndex] || select.options[0];
            };

            const syncLabel = function () {
                if (!label) return;
                const option = currentOption();
                label.textContent = option ? formatFolderName(option.textContent, unclassifiedLabel) : unclassifiedLabel;
            };

            const ensureOption = function (folderId, folderName, depth) {
                const id = folderId == null ? '' : String(folderId);
                let option = Array.from(select.options).find(item => String(item.value || '') === id);
                if (!option) {
                    option = document.createElement('option');
                    option.value = id;
                    option.textContent = folderName || unclassifiedLabel;
                    option.dataset.depth = String(depth || 0);
                    select.appendChild(option);
                }
                return option;
            };

            const choose = function (folderId, folderName, depth, commit) {
                const id = folderId == null ? '' : String(folderId);
                ensureOption(id, folderName, depth);
                pendingValue = id;
                if (!commit) return;
                select.value = id;
                syncLabel();
                select.dispatchEvent(new Event('change', { bubbles: true }));
                if (typeof options.onSelect === 'function') {
                    options.onSelect({ folderId: id, folderName: folderName || unclassifiedLabel, depth: depth || 0 });
                }
            };

            const getDescription = function (folderId, folderName, isCurrent) {
                if (typeof options.itemDescription === 'function') {
                    return options.itemDescription({ folderId, folderName, isCurrent });
                }
                if (!folderId) return options.unclassifiedDescription || '폴더 없이 보관';
                if (isCurrent && showCurrent) return '현재 폴더';
                return options.folderDescription || '이 폴더를 선택';
            };

            const render = function () {
                list.innerHTML = '';
                Array.from(select.options).forEach(function (option) {
                    const folderId = String(option.value || '');
                    const folderName = formatFolderName(option.textContent, unclassifiedLabel);
                    const depth = Math.max(0, Number(option.dataset.depth || 0));
                    const isCurrent = folderId === String(select.value || '');
                    const isSelected = folderId === pendingValue;

                    const row = document.createElement('div');
                    row.className = 'nl-folder-choice-row' + (isSelected ? ' is-selected' : '') + (isCurrent ? ' is-current' : '');
                    row.dataset.folderId = folderId;
                    row.dataset.folderName = folderName;
                    row.dataset.depth = String(depth);

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'nl-folder-choice';
                    button.dataset.folderId = folderId;
                    button.dataset.folderName = folderName;
                    button.innerHTML =
                        '<span class="nl-folder-choice-icon"><i class="' + (folderId ? 'fa-solid fa-folder' : 'fa-regular fa-folder-open') + '" aria-hidden="true"></i></span>' +
                        '<span class="nl-folder-choice-copy"><strong>' + escapeHtml(folderName) + '</strong><small>' + escapeHtml(getDescription(folderId, folderName, isCurrent)) + '</small></span>' +
                        '<span class="nl-folder-choice-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>';
                    row.appendChild(button);

                    if (folderId && canManage && showManageActions) {
                        const actions = document.createElement('div');
                        actions.className = 'nl-modal-folder-actions';
                        actions.innerHTML =
                            '<button type="button" data-modal-folder-rename aria-label="폴더 이름 수정"><i class="fa-regular fa-pen-to-square"></i></button>' +
                            '<button type="button" data-modal-folder-delete aria-label="폴더 삭제"><i class="fa-regular fa-trash-can"></i></button>';
                        row.appendChild(actions);
                    }
                    list.appendChild(row);
                });
            };

            const close = function () {
                setOpen(modal, false);
                trigger?.setAttribute?.('aria-expanded', 'false');
                list.onclick = null;
                modal.onclick = null;
                createButton.onclick = null;
                confirmButton.onclick = null;
                modal.querySelectorAll('[data-move-close]').forEach(button => button.onclick = null);
            };

            const promptFolderName = function (message, initialValue) {
                const value = window.prompt(message, initialValue || '');
                if (value == null) return null;
                const name = value.trim();
                if (!name) { window.alert('폴더 이름을 입력해 주세요.'); return null; }
                if (name.length > 100) { window.alert('폴더 이름은 100자 이하로 입력해 주세요.'); return null; }
                return name;
            };

            createButton.onclick = async function () {
                if (!canManage || !adapter.create) return;
                const name = promptFolderName(options.createPrompt || '새 폴더 이름을 입력해 주세요.');
                if (!name) return;
                try {
                    const created = await adapter.create(context, { folderName: name });
                    const id = String(created.folderId || '');
                    if (!id) throw new Error('생성된 폴더를 확인하지 못했습니다.');
                    ensureOption(id, created.folderName || name, created.depth || 0);
                    pendingValue = id;
                    render();
                } catch (error) {
                    window.alert(error.message || '폴더를 만들지 못했습니다.');
                }
            };

            list.onclick = async function (event) {
                const row = event.target.closest('.nl-folder-choice-row');
                if (!row) return;
                const folderId = row.dataset.folderId || '';
                const folderName = row.dataset.folderName || unclassifiedLabel;
                const depth = Math.max(0, Number(row.dataset.depth || 0));

                if (event.target.closest('[data-modal-folder-rename]')) {
                    const nextName = promptFolderName('수정할 폴더 이름을 입력해 주세요.', folderName);
                    if (!nextName || nextName === folderName || !adapter.rename) return;
                    try {
                        await adapter.rename(context, { folderId, folderName: nextName });
                        ensureOption(folderId, nextName, depth).textContent = nextName;
                        render();
                    } catch (error) { window.alert(error.message || '폴더 이름을 수정하지 못했습니다.'); }
                    return;
                }
                if (event.target.closest('[data-modal-folder-delete]')) {
                    if (!adapter.remove || !window.confirm("'" + folderName + "' 폴더를 삭제할까요?")) return;
                    try {
                        await adapter.remove(context, { folderId, folderName });
                        const option = Array.from(select.options).find(item => String(item.value || '') === folderId);
                        if (option) option.remove();
                        if (pendingValue === folderId) pendingValue = '';
                        render();
                    } catch (error) { window.alert(error.message || '폴더를 삭제하지 못했습니다.'); }
                    return;
                }

                pendingValue = folderId;
                render();
                if (instantSelect) {
                    choose(folderId, folderName, depth, true);
                    close();
                }
            };

            confirmButton.onclick = async function () {
                const option = Array.from(select.options).find(item => String(item.value || '') === pendingValue) || select.options[0];
                const payload = {
                    folderId: pendingValue,
                    folderName: option ? formatFolderName(option.textContent, unclassifiedLabel) : unclassifiedLabel,
                    depth: option ? Math.max(0, Number(option.dataset.depth || 0)) : 0
                };
                confirmButton.disabled = true;
                try {
                    if (typeof options.onConfirm === 'function') await options.onConfirm(payload);
                    choose(payload.folderId, payload.folderName, payload.depth, true);
                    close();
                } catch (error) {
                    window.alert(error.message || '처리하지 못했습니다.');
                } finally {
                    confirmButton.disabled = false;
                }
            };

            modal.onclick = function (event) { if (event.target === modal) close(); };
            modal.querySelectorAll('[data-move-close]').forEach(button => button.onclick = close);

            render();
            setOpen(modal, true);
            trigger?.setAttribute?.('aria-expanded', 'true');
        }
    };
})();
