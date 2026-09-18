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
            <div class="nl-modal-head-copy">
                <h2 id="noteMoveModalTitle">폴더 선택</h2>
                <p id="noteMoveModalDescription">저장할 폴더를 선택하세요.</p>
            </div>
            <div class="nl-modal-head-actions">
                <div class="nl-move-folder-tools" data-modal-folder-tools>
                    <button type="button" class="nl-modal-folder-create" data-modal-folder-create>
                        <i class="fa-solid fa-folder-plus" aria-hidden="true"></i> <span data-modal-folder-create-label>새 폴더</span>
                    </button>
                </div>
                <button type="button" class="nl-modal-close" data-move-close aria-label="닫기">×</button>
            </div>
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
            createLabel: modal.querySelector('[data-modal-folder-create-label]'),
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
            const { modal, list, title, description, createButton, createLabel, tools, confirmButton } = parts;
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
            const treeMode = options.treeMode === true;
            const showCloseButton = options.showCloseButton !== false;
            const rootIcon = options.rootIcon || 'fa-regular fa-folder-open';
            const folderIcon = options.folderIcon || 'fa-solid fa-folder';
            const expandedFolders = new Set();
            let pendingValue = String(select.value || '');

            title.textContent = options.title || '폴더 선택';
            description.textContent = options.description || '저장할 폴더를 선택하세요.';
            if (createLabel) createLabel.textContent = options.createLabel || '새 폴더';
            createButton.hidden = !canManage;
            tools.hidden = !canManage;
            confirmButton.hidden = instantSelect;
            confirmButton.textContent = options.confirmLabel || '선택';
            modal.querySelectorAll('[data-move-close]').forEach(function (button) {
                button.hidden = !showCloseButton;
            });

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
                list.classList.toggle('is-tree-mode', treeMode);
                modal.classList.toggle('is-tree-mode', treeMode);
                modal.classList.toggle('is-card-mode', !treeMode);

                const optionItems = Array.from(select.options).map(function (option) {
                    return {
                        option,
                        folderId: String(option.value || ''),
                        folderName: formatFolderName(option.textContent, unclassifiedLabel),
                        depth: Math.max(0, Number(option.dataset.depth || 0)),
                        parentId: String(option.dataset.parentId || ''),
                        isRoot: option.dataset.root === 'true' || String(option.value || '') === '',
                        disabled: option.disabled || option.dataset.disabled === 'true'
                    };
                });
                const childMap = new Map();
                optionItems.forEach(function (item) {
                    if (item.isRoot) return;
                    const key = item.parentId || '';
                    if (!childMap.has(key)) childMap.set(key, []);
                    childMap.get(key).push(item.folderId);
                });

                if (treeMode && expandedFolders.size === 0) {
                    optionItems.forEach(function (item) {
                        if (item.isRoot || childMap.has(item.folderId)) expandedFolders.add(item.folderId);
                    });
                }

                const isVisible = function (item) {
                    if (!treeMode || item.isRoot || !item.parentId) return true;
                    let parentId = item.parentId;
                    const visited = new Set();
                    while (parentId && !visited.has(parentId)) {
                        visited.add(parentId);
                        if (!expandedFolders.has(parentId)) return false;
                        const parent = optionItems.find(candidate => candidate.folderId === parentId);
                        parentId = parent ? parent.parentId : '';
                    }
                    return true;
                };

                optionItems.forEach(function (item) {
                    if (!isVisible(item)) return;
                    const { folderId, folderName, depth, isRoot, disabled } = item;
                    const isCurrent = folderId === String(select.value || '');
                    const isSelected = folderId === pendingValue;
                    const hasChildren = treeMode && childMap.has(folderId);
                    const isExpanded = expandedFolders.has(folderId);

                    const row = document.createElement('div');
                    row.className = 'nl-folder-choice-row' + (isSelected ? ' is-selected' : '') + (isCurrent ? ' is-current' : '') + (disabled ? ' is-disabled' : '');
                    row.dataset.folderId = folderId;
                    row.dataset.folderName = folderName;
                    row.dataset.depth = String(depth);
                    row.dataset.parentId = item.parentId;
                    row.style.setProperty('--folder-depth', String(treeMode && !isRoot ? depth + 1 : 0));

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'nl-folder-choice';
                    button.dataset.folderId = folderId;
                    button.dataset.folderName = folderName;
                    button.disabled = disabled;
                    button.setAttribute('aria-disabled', disabled ? 'true' : 'false');

                    // SELECT / MOVE 모두 같은 row markup을 사용한다.
                    // treeMode는 첫 번째 슬롯의 chevron 표시와 depth만 결정한다.
                    const treeToggleClass = 'nl-folder-tree-toggle' + (!treeMode || !hasChildren ? ' is-empty' : '');
                    const treeToggleIcon = treeMode && hasChildren
                        ? '<i class="fa-solid fa-chevron-' + (isExpanded ? 'down' : 'right') + '"></i>'
                        : '';
                    button.innerHTML =
                        '<span class="' + treeToggleClass + '" data-folder-tree-toggle aria-hidden="true">' + treeToggleIcon + '</span>' +
                        '<span class="nl-folder-choice-icon">' +
                            '<i class="' + escapeHtml(isRoot ? rootIcon : folderIcon) + '" aria-hidden="true"></i>' +
                        '</span>' +
                        '<span class="nl-folder-choice-copy">' +
                            '<span class="nl-folder-choice-title-line">' +
                                '<strong>' + escapeHtml(folderName) + '</strong>' +
                                '<span class="nl-modal-folder-actions" data-folder-inline-actions></span>' +
                            '</span>' +
                            '<small>' + escapeHtml(disabled ? '현재 위치' : getDescription(folderId, folderName, isCurrent)) + '</small>' +
                        '</span>' +
                        '<span class="nl-folder-choice-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>';
                    row.appendChild(button);

                    if (folderId && canManage && showManageActions) {
                        const actions = button.querySelector('[data-folder-inline-actions]');
                        if (actions) {
                            actions.innerHTML =
                                '<button type="button" class="nl-modal-folder-action" data-modal-folder-rename aria-label="폴더 이름 바꾸기" title="이름 바꾸기">' +
                                    '<i class="fa-solid fa-pen" aria-hidden="true"></i>' +
                                '</button>' +
                                '<button type="button" class="nl-modal-folder-action is-danger" data-modal-folder-delete aria-label="폴더를 휴지통으로 이동" title="휴지통으로 이동">' +
                                    '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>' +
                                '</button>';
                        }
                    }
                    list.appendChild(row);
                });
                confirmButton.disabled = !!optionItems.find(item => item.folderId === pendingValue && item.disabled);
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

            const promptFolderName = async function (message, initialValue) {
                let value;
                if (typeof options.requestFolderName === 'function') {
                    value = await options.requestFolderName({ message, initialValue: initialValue || '' });
                } else {
                    value = window.prompt(message, initialValue || '');
                }
                if (value == null) return null;
                const name = String(value).trim();
                if (!name) { window.alert('폴더 이름을 입력해 주세요.'); return null; }
                if (name.length > 100) { window.alert('폴더 이름은 100자 이하로 입력해 주세요.'); return null; }
                return name;
            };

            createButton.onclick = async function () {
                if (!canManage || !adapter.create) return;
                const name = await promptFolderName(options.createPrompt || '새 폴더 이름을 입력해 주세요.');
                if (!name) return;
                try {
                    const parentFolderId = pendingValue || '';
                    const parentOption = Array.from(select.options).find(item => String(item.value || '') === parentFolderId);
                    const parentDepth = parentOption ? Math.max(0, Number(parentOption.dataset.depth || 0)) : -1;
                    const created = await adapter.create(context, { folderName: name, parentFolderId: parentFolderId, depth: parentDepth + 1 });
                    const id = String(created.folderId || '');
                    if (!id) throw new Error('생성된 폴더를 확인하지 못했습니다.');
                    const createdOption = ensureOption(id, created.folderName || name, created.depth == null ? parentDepth + 1 : created.depth);
                    createdOption.dataset.parentId = parentFolderId;
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

                if (event.target.closest('[data-folder-tree-toggle]')) {
                    const toggle = event.target.closest('[data-folder-tree-toggle]');
                    if (toggle.classList.contains('is-empty')) return;
                    if (expandedFolders.has(folderId)) expandedFolders.delete(folderId);
                    else expandedFolders.add(folderId);
                    render();
                    return;
                }
                if (row.classList.contains('is-disabled')) return;

                if (event.target.closest('[data-modal-folder-more]')) {
                    event.stopPropagation();
                    const more = event.target.closest('[data-modal-folder-more]');
                    const menu = row.querySelector('[data-modal-folder-menu]');
                    list.querySelectorAll('[data-modal-folder-menu]').forEach(function (other) {
                        if (other !== menu) other.hidden = true;
                    });
                    list.querySelectorAll('[data-modal-folder-more]').forEach(function (other) {
                        if (other !== more) other.setAttribute('aria-expanded', 'false');
                    });
                    menu.hidden = !menu.hidden;
                    more.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
                    return;
                }
                if (event.target.closest('[data-modal-folder-child-create]')) {
                    event.stopPropagation();
                    if (!adapter.create) return;
                    const name = await promptFolderName(options.createPrompt || '새 하위 폴더 이름을 입력해 주세요.');
                    if (!name) return;
                    try {
                        const created = await adapter.create(context, { folderName: name, parentFolderId: folderId, depth: depth + 1 });
                        const id = String(created.folderId || '');
                        if (!id) throw new Error('생성된 폴더를 확인하지 못했습니다.');
                        const createdOption = ensureOption(id, created.folderName || name, created.depth == null ? depth + 1 : created.depth);
                        createdOption.dataset.parentId = folderId;
                        expandedFolders.add(folderId);
                        pendingValue = id;
                        render();
                    } catch (error) { window.alert(error.message || '폴더를 만들지 못했습니다.'); }
                    return;
                }
                if (event.target.closest('[data-modal-folder-rename]')) {
                    event.stopPropagation();
                    const nextName = await promptFolderName('수정할 폴더 이름을 입력해 주세요.', folderName);
                    if (!nextName || nextName === folderName || !adapter.rename) return;
                    try {
                        await adapter.rename(context, { folderId, folderName: nextName });
                        ensureOption(folderId, nextName, depth).textContent = nextName;
                        render();
                    } catch (error) { window.alert(error.message || '폴더 이름을 수정하지 못했습니다.'); }
                    return;
                }
                if (event.target.closest('[data-modal-folder-delete]')) {
                    event.stopPropagation();
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
                if (option && (option.disabled || option.dataset.disabled === 'true')) return;
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

            modal.onclick = function (event) {
                if (event.target === modal) { close(); return; }
                if (!event.target.closest('[data-modal-folder-more]') && !event.target.closest('[data-modal-folder-menu]')) {
                    list.querySelectorAll('[data-modal-folder-menu]').forEach(function (menu) { menu.hidden = true; });
                    list.querySelectorAll('[data-modal-folder-more]').forEach(function (button) { button.setAttribute('aria-expanded', 'false'); });
                }
            };
            modal.querySelectorAll('[data-move-close]').forEach(button => button.onclick = close);

            render();
            setOpen(modal, true);
            trigger?.setAttribute?.('aria-expanded', 'true');
        }
    };
})();
