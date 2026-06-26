(function () {
    'use strict';

    const escapeHtml = function (value) {
        return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[char];
        });
    };

    const ensureModalElement = function () {
        let modal = document.getElementById('noteMoveModal');
        let list = document.getElementById('noteMoveFolderList');

        if (!modal || !list) {
            const wrap = document.createElement('div');
            wrap.innerHTML = `
<div class="nl-modal-backdrop common-folder-modal" id="noteMoveModal" hidden>
    <section class="nl-move-modal" role="dialog" aria-modal="true" aria-labelledby="noteMoveModalTitle">
        <div class="nl-modal-head">
            <div>
                <h2 id="noteMoveModalTitle">폴더 선택</h2>
                <p id="noteMoveModalDescription">노트 저장 위치를 선택합니다.</p>
            </div>
            <div class="nl-modal-head-actions">
                <button type="button" class="nl-modal-folder-create" data-modal-folder-create>
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> 새 폴더
                </button>
                <button type="button" class="nl-modal-close" data-move-close aria-label="닫기">×</button>
            </div>
        </div>
        <div class="nl-folder-choice-list" id="noteMoveFolderList"></div>
    </section>
</div>`;
            document.body.appendChild(wrap.firstElementChild);
        }

        return document.getElementById('noteMoveModal');
    };

    const getModalParts = function () {
        const modal = ensureModalElement();
        return {
            modal: modal,
            list: modal ? modal.querySelector('#noteMoveFolderList') : null,
            title: modal ? modal.querySelector('#noteMoveModalTitle') : null,
            description: modal ? modal.querySelector('#noteMoveModalDescription') : null,
            createButton: modal ? modal.querySelector('[data-modal-folder-create]') : null
        };
    };

    const setOpen = function (modal, open) {
        if (!modal) return;
        modal.hidden = !open;
        document.body.classList.toggle('nl-modal-open', open);
    };

    window.CommonFolderModal = {
        openSelect: function (options) {
            const parts = getModalParts();
            const modal = parts.modal;
            const list = parts.list;
            if (!modal || !list || !options || !options.selectElement || !options.adapter) return;

            const select = options.selectElement;
            const trigger = options.trigger || null;
            const label = options.label || null;
            const adapter = options.adapter;
            const context = options.context || {};
            const canManage = options.canManage !== false;
            const showManageActions = options.showManageActions !== false;

            if (parts.title) parts.title.textContent = options.title || '폴더 선택';
            if (parts.description) parts.description.textContent = options.description || '노트 저장 위치를 선택합니다.';
            if (parts.createButton) parts.createButton.hidden = !canManage;

            const promptFolderName = function (message, initialValue) {
                const value = window.prompt(message, initialValue || '');
                if (value == null) return null;
                const name = value.trim();
                if (!name) {
                    window.alert('폴더 이름을 입력해 주세요.');
                    return null;
                }
                if (name.length > 100) {
                    window.alert('폴더 이름은 100자 이하로 입력해 주세요.');
                    return null;
                }
                return name;
            };

            const currentOption = function () {
                return select.options[select.selectedIndex] || select.options[0];
            };

            const syncLabel = function () {
                if (!label) return;
                const option = currentOption();
                label.textContent = option ? option.textContent.trim() : (options.unclassifiedLabel || '미분류');
            };

            const ensureOption = function (folderId, folderName, depth) {
                const id = folderId == null ? '' : String(folderId);
                let option = Array.from(select.options).find(function (item) {
                    return String(item.value || '') === id;
                });
                if (!option && id) {
                    option = document.createElement('option');
                    option.value = id;
                    option.textContent = folderName || '새 폴더';
                    option.dataset.depth = String(depth || 0);
                    select.appendChild(option);
                }
                return option;
            };

            const chooseFolder = function (folderId, folderName, depth) {
                const id = folderId == null ? '' : String(folderId);
                ensureOption(id, folderName, depth);
                select.value = id;
                syncLabel();
                select.dispatchEvent(new Event('change', { bubbles: true }));
                if (typeof options.onSelect === 'function') {
                    options.onSelect({ folderId: id, folderName: folderName || (options.unclassifiedLabel || '미분류'), depth: depth || 0 });
                }
            };

            const render = function () {
                const currentValue = String(select.value || '');
                list.innerHTML = '';

                Array.from(select.options).forEach(function (option) {
                    const folderId = option.value == null ? '' : String(option.value);
                    const folderName = option.textContent.trim() || (options.unclassifiedLabel || '미분류');
                    const depth = Math.max(0, Number(option.dataset.depth || 0));
                    const isCurrent = folderId === currentValue;

                    const row = document.createElement('div');
                    row.className = 'nl-folder-choice-row' + (isCurrent ? ' is-current' : '');
                    row.dataset.folderId = folderId;
                    row.dataset.folderName = folderName;
                    row.dataset.depth = String(depth);

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'nl-folder-choice';
                    button.dataset.folderId = folderId;
                    button.dataset.folderName = folderName;
                    button.disabled = isCurrent;
                    button.innerHTML =
                        '<span class="nl-folder-choice-main" style="--folder-depth:' + depth + '"><i class="' +
                        (folderId ? 'fa-solid fa-folder' : 'fa-regular fa-folder') +
                        '" aria-hidden="true"></i><span class="nl-folder-choice-name">' +
                        escapeHtml(folderName) +
                        '</span></span>' +
                        (isCurrent ? '<em class="nl-folder-choice-badge">현재 위치</em>' : '');
                    row.appendChild(button);

                    if (folderId && canManage && showManageActions) {
                        const actions = document.createElement('div');
                        actions.className = 'nl-modal-folder-actions';
                        actions.innerHTML =
                            '<button type="button" data-modal-folder-rename title="폴더 이름 수정" aria-label="' + escapeHtml(folderName) + ' 이름 수정"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i></button>' +
                            '<button type="button" data-modal-folder-delete title="폴더 삭제" aria-label="' + escapeHtml(folderName) + ' 삭제"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>';
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
                modal.querySelectorAll('[data-move-close]').forEach(function (button) {
                    button.onclick = null;
                });
                const createBtn = modal.querySelector('[data-modal-folder-create]');
                if (createBtn) createBtn.onclick = null;
            };

            const createBtn = modal.querySelector('[data-modal-folder-create]');
            if (createBtn) {
                createBtn.onclick = async function () {
                    if (!canManage || !adapter.create) return;
                    const folderName = promptFolderName((options.createPrompt || '현재 영역의 최상위에 새 폴더를 만듭니다.\n새 폴더 이름을 입력해 주세요.'));
                    if (!folderName) return;
                    try {
                        const created = await adapter.create(context, { folderName: folderName });
                        const folderId = String(created.folderId || '');
                        if (!folderId) throw new Error('생성된 폴더 ID를 확인하지 못했습니다.');
                        ensureOption(folderId, created.folderName || folderName, created.depth || 0);
                        chooseFolder(folderId, created.folderName || folderName, created.depth || 0);
                        render();
                    } catch (error) {
                        window.alert(error.message || '폴더를 만들지 못했습니다.');
                    }
                };
            }

            list.onclick = async function (event) {
                const row = event.target.closest('.nl-folder-choice-row');
                if (!row) return;
                const folderId = row.dataset.folderId || '';
                const folderName = row.dataset.folderName || '';
                const depth = Math.max(0, Number(row.dataset.depth || 0));

                if (event.target.closest('[data-modal-folder-rename]')) {
                    if (!showManageActions || !canManage || !adapter.rename) return;
                    const nextName = promptFolderName('수정할 폴더 이름을 입력해 주세요.', folderName);
                    if (!nextName || nextName === folderName) return;
                    try {
                        await adapter.rename(context, { folderId: folderId, folderName: nextName });
                        const option = ensureOption(folderId, nextName, depth);
                        if (option) option.textContent = nextName;
                        syncLabel();
                        render();
                    } catch (error) {
                        window.alert(error.message || '폴더 이름을 수정하지 못했습니다.');
                    }
                    return;
                }

                if (event.target.closest('[data-modal-folder-delete]')) {
                    if (!showManageActions || !canManage || !adapter.remove) return;
                    if (!window.confirm("'" + folderName + "' 폴더를 삭제할까요?\n하위 폴더나 항목이 있으면 삭제할 수 없습니다.")) return;
                    try {
                        await adapter.remove(context, { folderId: folderId, folderName: folderName });
                        const option = Array.from(select.options).find(function (item) {
                            return String(item.value || '') === String(folderId);
                        });
                        if (String(select.value || '') === String(folderId)) chooseFolder('', options.unclassifiedLabel || '미분류', 0);
                        if (option) option.remove();
                        render();
                    } catch (error) {
                        window.alert(error.message || '폴더를 삭제하지 못했습니다.');
                    }
                    return;
                }

                const choice = event.target.closest('.nl-folder-choice');
                if (!choice || choice.disabled) return;
                chooseFolder(choice.dataset.folderId || '', choice.dataset.folderName || (options.unclassifiedLabel || '미분류'), depth);
                close();
            };

            modal.onclick = function (event) {
                if (event.target === modal) close();
            };
            modal.querySelectorAll('[data-move-close]').forEach(function (button) {
                button.onclick = close;
            });

            syncLabel();
            render();
            setOpen(modal, true);
            trigger?.setAttribute?.('aria-expanded', 'true');
        }
    };
})();
