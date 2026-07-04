(() => {
    'use strict';

    const pickerButtons = document.querySelectorAll('[data-picker]');
    const pickerPanels = document.querySelectorAll('[data-picker-panel]');

    const listSection = document.querySelector('.nl-list-section');

    function syncListVisibility() {
        const emptyPickerOpen = [...pickerPanels].some((panel) => (
            !panel.hidden && panel.dataset.empty === 'true'
        ));
        if (listSection) listSection.hidden = emptyPickerOpen;
    }

    function closePickers(exceptName) {
        pickerPanels.forEach((panel) => {
            if (panel.dataset.pickerPanel !== exceptName) panel.hidden = true;
        });
    }

    pickerButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const name = button.dataset.picker;
            const panel = document.querySelector(`[data-picker-panel="${name}"]`);
            if (!panel) return;

            const willOpen = panel.hidden;
            closePickers(name);
            panel.hidden = !willOpen;
            syncListVisibility();
        });
    });

    const list = document.getElementById('noteList');
    const sort = document.getElementById('noteListSort');
    if (list && sort) {
        sort.addEventListener('change', () => {
            const rows = [...list.querySelectorAll('.nl-note-card')];
            rows.sort((a, b) => {
                if (sort.value === 'title') {
                    return (a.dataset.title || '').localeCompare(b.dataset.title || '', 'ko');
                }
                const aDate = Number(a.dataset.date || 0);
                const bDate = Number(b.dataset.date || 0);
                return sort.value === 'oldest' ? aDate - bDate : bDate - aDate;
            });
            rows.forEach((row) => list.appendChild(row));
        });
    }

    document.querySelectorAll('.nl-pin-button').forEach((button) => {
        button.addEventListener('click', async () => {
            if (button.disabled) return;
            button.disabled = true;
            const wasPinned = button.classList.contains('is-pinned');
            const endpoint = wasPinned ? '/note/api/unpin' : '/note/api/pin';
            const body = new URLSearchParams({ noteId: button.dataset.noteId });

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body
                });
                const result = await response.json();
                if (!result.success) throw new Error(result.message || '중요 표시를 변경하지 못했습니다.');

                button.classList.toggle('is-pinned', !wasPinned);
                button.setAttribute('aria-label', wasPinned ? '중요 표시' : '중요 해제');
                button.title = wasPinned ? '중요 표시' : '중요 해제';

                // 중요 탭에서는 중요 해제한 카드를 즉시 목록에서 제거한다.
                const shell = document.querySelector('.nl-shell');
                if (wasPinned && document.querySelector('.nl-important-filter.is-active')) {
                    const card = button.closest('.nl-note-card');
                    if (card) card.remove();

                    const countNode = document.querySelector('.nl-list-count');
                    if (countNode) {
                        const current = Number.parseInt(countNode.dataset.count || countNode.textContent, 10);
                        if (Number.isFinite(current)) {
                            const next = Math.max(current - 1, 0);
                            countNode.dataset.count = String(next);
                            countNode.textContent = `${next}개의 노트`;
                        }
                    }
                }
            } catch (error) {
                window.alert(error.message || '잠시 후 다시 시도해 주세요.');
            } finally {
                button.disabled = false;
            }
        });
    });
})();


(() => {
    'use strict';

    const scrollers = document.querySelectorAll('[data-horizontal-scroller]');

    scrollers.forEach((scroller) => {
        const viewport = scroller.querySelector('[data-scroll-viewport]');
        const prev = scroller.querySelector('[data-scroll-prev]');
        const next = scroller.querySelector('[data-scroll-next]');
        if (!viewport || !prev || !next) return;

        const updateButtons = () => {
            const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
            prev.disabled = viewport.scrollLeft <= 2;
            next.disabled = viewport.scrollLeft >= maxScroll - 2;
            scroller.classList.toggle('has-overflow', maxScroll > 2);
        };

        const scrollByPage = (direction) => {
            const distance = Math.max(180, viewport.clientWidth * 0.78);
            viewport.scrollBy({ left: distance * direction, behavior: 'smooth' });
        };

        prev.addEventListener('click', () => scrollByPage(-1));
        next.addEventListener('click', () => scrollByPage(1));
        viewport.addEventListener('scroll', updateButtons, { passive: true });

        viewport.addEventListener('wheel', (event) => {
            if (viewport.scrollWidth <= viewport.clientWidth + 2) return;
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            if (!delta) return;

            const maxScroll = viewport.scrollWidth - viewport.clientWidth;
            const movingLeftAtStart = delta < 0 && viewport.scrollLeft <= 0;
            const movingRightAtEnd = delta > 0 && viewport.scrollLeft >= maxScroll - 1;
            if (movingLeftAtStart || movingRightAtEnd) return;

            event.preventDefault();
            viewport.scrollLeft += delta;
        }, { passive: false });

        const selected = viewport.querySelector('.is-selected');
        if (selected) {
            requestAnimationFrame(() => {
                const viewportRect = viewport.getBoundingClientRect();
                const selectedRect = selected.getBoundingClientRect();
                const edgeGap = 12;

                if (selectedRect.left < viewportRect.left + edgeGap) {
                    viewport.scrollLeft -= (viewportRect.left + edgeGap) - selectedRect.left;
                } else if (selectedRect.right > viewportRect.right - edgeGap) {
                    viewport.scrollLeft += selectedRect.right - (viewportRect.right - edgeGap);
                }

                updateButtons();
            });
        } else {
            requestAnimationFrame(updateButtons);
        }

        if ('ResizeObserver' in window) {
            new ResizeObserver(updateButtons).observe(viewport);
        } else {
            window.addEventListener('resize', updateButtons);
        }

        requestAnimationFrame(updateButtons);
    });
})();


(() => {
    'use strict';

    const getNoteMoveModal = () => ({
        modal: document.getElementById('noteMoveModal'),
        folderList: document.getElementById('noteMoveFolderList')
    });

    const noteMoveModalParts = getNoteMoveModal();
    const modal = noteMoveModalParts.modal;
    const folderList = noteMoveModalParts.folderList;
    const selectModeButton = document.getElementById('noteSelectModeButton');
    const bulkBar = document.getElementById('noteBulkBar');
    const selectAll = document.getElementById('noteSelectAll');
    const selectedCount = document.getElementById('noteSelectedCount');
    const bulkMove = document.getElementById('noteBulkMove');
    const bulkTrash = document.getElementById('noteBulkTrash');
    const bulkShare = document.getElementById('noteBulkShare');
    const restoreAllTrash = document.getElementById('noteRestoreAllTrash');
    const permanentDeleteAllTrash = document.getElementById('notePermanentDeleteAllTrash');
    const folderManageConfig = document.getElementById('noteFolderManageConfig');
    const canManageFolders = folderManageConfig?.dataset.canManage === 'true' || folderManageConfig?.dataset.canManage === '1';
    const folderContext = {
        scope: folderManageConfig?.dataset.scope || document.querySelector('.nl-shell')?.dataset.scope || 'PRIVATE',
        wsId: folderManageConfig?.dataset.wsId || '',
        projId: folderManageConfig?.dataset.projId || ''
    };

    let activeCards = [];
    let selectionMode = false;
    let folderListChanged = false;
    let modalFolderManageAllowed = false;

    const post = async (url, params) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams(params)
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || '요청을 처리하지 못했습니다.');
        return result;
    };

    const manageableCards = () => [...document.querySelectorAll('.nl-note-card[data-can-manage="true"], .nl-note-card[data-can-manage="1"]')]
        .filter(card => card.offsetParent !== null);

    const selectedCards = () => [...document.querySelectorAll('.nl-card-select-input:checked:not(:disabled)')]
        .map(input => input.closest('.nl-note-card'))
        .filter(Boolean);

    const trashCards = () => [...document.querySelectorAll('.nl-note-card')]
        .filter(card => Boolean(card.dataset.noteId));

    const clearCardSelection = () => {
        document.querySelectorAll('.nl-card-select-input:not(:disabled)').forEach(input => { input.checked = false; });
    };

    const setCardDraggableState = () => {
        document.querySelectorAll('.nl-note-card').forEach(card => {
            const canManage = card.dataset.canManage === 'true' || card.dataset.canManage === '1';
            const input = card.querySelector('.nl-card-select-input:not(:disabled)');
            card.draggable = Boolean(selectionMode && canManage && input?.checked);
            card.querySelectorAll('.nl-note-link').forEach(link => { link.draggable = false; });
        });
    };

    const updateBulkState = () => {
        if (!selectionMode) return;
        document.querySelectorAll('.nl-card-select-input:disabled').forEach(input => { input.checked = false; });
        const manageable = manageableCards();
        const selected = selectedCards();
        const scopeKeys = new Set(selected.map(card => card.dataset.scopeKey || ''));

        selectedCount.textContent = `${selected.length}개 선택됨`;
        bulkTrash.disabled = selected.length === 0;
        if (bulkShare) bulkShare.disabled = selected.length === 0;
        bulkMove.disabled = selected.length === 0 || scopeKeys.size !== 1;
        bulkMove.title = scopeKeys.size > 1 ? '같은 영역의 노트만 함께 이동할 수 있습니다.' : '';

        if (manageable.length === 0 || selected.length === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (selected.length === manageable.length) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        }

        document.querySelectorAll('.nl-note-card').forEach(card => {
            const input = card.querySelector('.nl-card-select-input');
            card.classList.toggle('is-selected', Boolean(input?.checked));
        });
        setCardDraggableState();
    };

    const setSelectionMode = (enabled) => {
        selectionMode = enabled;
        document.body.classList.toggle('nl-selection-mode', enabled);
        bulkBar.hidden = !enabled;
        selectModeButton?.setAttribute('aria-pressed', String(enabled));
        if (selectModeButton) {
            selectModeButton.classList.toggle('is-active', enabled);
            const label = selectModeButton.querySelector('span');
            if (label) label.textContent = enabled ? '선택 해제' : '선택';
            selectModeButton.title = enabled ? '선택 모드 종료' : '노트 선택';
        }

        setCardDraggableState();

        if (!enabled) {
            document.querySelectorAll('.nl-card-select-input').forEach(input => { input.checked = false; });
            document.querySelectorAll('.nl-note-card.is-selected').forEach(card => card.classList.remove('is-selected'));
            if (selectAll) {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            }
        }
        updateBulkState();
    };

    selectModeButton?.addEventListener('click', () => setSelectionMode(!selectionMode));

    selectAll?.addEventListener('change', () => {
        manageableCards().forEach(card => {
            const input = card.querySelector('.nl-card-select-input');
            if (input && !input.disabled) input.checked = selectAll.checked;
        });
        updateBulkState();
    });

    document.addEventListener('change', event => {
        if (event.target.matches('.nl-card-select-input')) updateBulkState();
    });

    document.addEventListener('click', event => {
        if (!selectionMode) return;
        if (Date.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const card = event.target.closest('.nl-note-card');
        if (!card) return;

        // 체크박스/라벨은 브라우저의 기본 체크 동작을 그대로 사용한다.
        // 여기서 preventDefault()를 먼저 호출하면 체크 버튼이 눌리지 않는다.
        const selector = event.target.closest('.nl-card-select');
        if (selector) {
            event.stopPropagation();
            return;
        }

        // 선택 모드에서는 권한 유무와 관계없이 카드 상세 링크 이동을 막는다.
        event.preventDefault();

        // 선택 모드에서는 별표, 메뉴 등 카드 내부 개별 액션도 실행하지 않는다.
        if (event.target.closest('button, .nl-card-menu')) {
            event.stopPropagation();
            return;
        }

        // 관리 권한이 있는 카드만 선택 상태를 바꾼다.
        const input = card.querySelector('.nl-card-select-input:not(:disabled)');
        if (!input) {
            event.stopPropagation();
            return;
        }

        input.checked = !input.checked;
        updateBulkState();
    }, true);



    // 선택 모드 드래그(마우스) 영역 선택
    const noteGrid = document.getElementById('noteList');
    let dragState = null;
    let suppressClickUntil = 0;

    const ensureDragBox = () => {
        let box = document.getElementById('noteDragSelectBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'noteDragSelectBox';
            box.className = 'nl-drag-select-box';
            box.hidden = true;
            document.body.appendChild(box);
        }
        return box;
    };

    const intersects = (a, b) => !(
        a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom
    );

    const selectionRect = (x1, y1, x2, y2) => ({
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        right: Math.max(x1, x2),
        bottom: Math.max(y1, y2)
    });

    const paintDragSelection = (rect) => {
        if (!dragState) return;
        dragState.cards.forEach(({ card, input, initialChecked }) => {
            if (input.disabled) {
                input.checked = false;
                return;
            }
            const hit = intersects(rect, card.getBoundingClientRect());
            input.checked = dragState.additive ? (initialChecked || hit) : hit;
        });
        updateBulkState();
    };

    const finishDragSelection = () => {
        if (!dragState) return;
        const box = dragState.box;
        if (dragState.moved) suppressClickUntil = Date.now() + 120;
        box.hidden = true;
        document.body.classList.remove('nl-drag-selecting');
        dragState = null;
        updateBulkState();
    };

    noteGrid?.addEventListener('mousedown', (event) => {
        if (!selectionMode || event.button !== 0) return;
        if (event.target.closest('button, input, label, .nl-card-menu, .nl-pin-button')) return;

        const pressedCard = event.target.closest('.nl-note-card');
        // 이미 선택된 카드를 끄는 동작은 카드 묶음 이동 드래그에 양보한다.
        if (pressedCard?.draggable && pressedCard.classList.contains('is-selected')) return;

        // 카드 본문과 제목 링크 위에서도 영역 선택을 시작할 수 있어야 한다.
        const box = ensureDragBox();
        const cards = [...noteGrid.querySelectorAll('.nl-note-card')]
            .filter(card => card.offsetParent !== null)
            .map(card => ({
                card,
                input: card.querySelector('.nl-card-select-input'),
                initialChecked: Boolean(card.querySelector('.nl-card-select-input:not(:disabled)')?.checked)
            }))
            .filter(item => item.input);

        dragState = {
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
            additive: event.ctrlKey || event.metaKey,
            cards,
            box
        };

        box.style.left = `${event.clientX}px`;
        box.style.top = `${event.clientY}px`;
        box.style.width = '0px';
        box.style.height = '0px';
        box.hidden = false;
        document.body.classList.add('nl-drag-selecting');
        event.preventDefault();
    });

    document.addEventListener('mousemove', (event) => {
        if (!dragState) return;
        const rect = selectionRect(dragState.startX, dragState.startY, event.clientX, event.clientY);
        if (!dragState.moved && (rect.right - rect.left > 4 || rect.bottom - rect.top > 4)) {
            dragState.moved = true;
        }
        if (!dragState.moved) return;

        dragState.box.style.left = `${rect.left}px`;
        dragState.box.style.top = `${rect.top}px`;
        dragState.box.style.width = `${rect.right - rect.left}px`;
        dragState.box.style.height = `${rect.bottom - rect.top}px`;
        paintDragSelection(rect);
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('mouseup', finishDragSelection);
    window.addEventListener('blur', finishDragSelection);

    // 선택한 카드 묶음을 선택 작업 줄의 폴더 이동/휴지통 이동 버튼으로 드래그한다.
    let cardDragState = null;

    const dragCardsFor = (card) => {
        const current = selectedCards();
        if (current.includes(card)) return current;

        clearCardSelection();
        const input = card.querySelector('.nl-card-select-input:not(:disabled)');
        if (input) input.checked = true;
        updateBulkState();
        return input ? [card] : [];
    };

    const makeDragGhost = (count) => {
        const ghost = document.createElement('div');
        ghost.className = 'nl-card-drag-ghost';
        ghost.innerHTML = `<i class="fa-regular fa-note-sticky" aria-hidden="true"></i><strong>${count}개 노트 이동</strong>`;
        document.body.appendChild(ghost);
        return ghost;
    };

    const clearDropTargets = () => {
        document.querySelectorAll('.nl-drop-target-active, .nl-drop-target-invalid').forEach(target => {
            target.classList.remove('nl-drop-target-active', 'nl-drop-target-invalid');
        });
    };

    const canDropToFolder = (target, cards) => {
        if (!target || !cards.length) return false;
        const scopeKeys = new Set(cards.map(card => card.dataset.scopeKey || ''));
        return scopeKeys.size === 1 && [...scopeKeys][0] === (target.dataset.scopeKey || '');
    };

    const moveCardsToFolder = async (cards, folderId) => {
        for (const card of cards) {
            await post('/note/api/folder/move-note', {
                noteId: card.dataset.noteId,
                folderId: folderId || ''
            });
        }
        window.location.reload();
    };

    const moveCardsToTrash = async (cards) => {
        for (const card of cards) {
            await post('/note/api/note/trash', { noteId: card.dataset.noteId });
            removeCard(card);
        }
        setSelectionMode(false);
    };

    document.addEventListener('dragstart', event => {
        const card = event.target.closest('.nl-note-card');
        if (!selectionMode || !card || !card.draggable) return;

        const cards = dragCardsFor(card);
        if (!cards.length) {
            event.preventDefault();
            return;
        }

        const ghost = makeDragGhost(cards.length);
        cardDragState = { cards, ghost };
        document.body.classList.add('nl-card-dragging');
        cards.forEach(item => item.classList.add('is-dragging'));

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', cards.map(item => item.dataset.noteId).join(','));
        event.dataTransfer.setDragImage(ghost, 18, 18);
        requestAnimationFrame(() => { ghost.hidden = true; });
    });

    document.addEventListener('dragover', event => {
        if (!cardDragState) return;
        const folderTarget = event.target.closest('[data-note-folder-drop]');
        const moveTarget = event.target.closest('[data-note-bulk-move-drop]');
        const trashTarget = event.target.closest('[data-note-bulk-trash-drop]');
        const shareTarget = event.target.closest('[data-note-bulk-share-drop]');
        const target = folderTarget || moveTarget || trashTarget || shareTarget;
        if (!target) return;

        const scopeKeys = new Set(cardDragState.cards.map(card => card.dataset.scopeKey || ''));
        const valid = Boolean(trashTarget)
            || Boolean(shareTarget)
            || (Boolean(folderTarget) && canDropToFolder(folderTarget, cardDragState.cards))
            || (Boolean(moveTarget) && scopeKeys.size === 1);
        clearDropTargets();
        target.classList.add(valid ? 'nl-drop-target-active' : 'nl-drop-target-invalid');
        if (valid) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        }
    });

    document.addEventListener('dragleave', event => {
        const target = event.target.closest('[data-note-folder-drop], [data-note-bulk-move-drop], [data-note-bulk-trash-drop], [data-note-bulk-share-drop]');
        if (!target || target.contains(event.relatedTarget)) return;
        target.classList.remove('nl-drop-target-active', 'nl-drop-target-invalid');
    });

    document.addEventListener('drop', async event => {
        if (!cardDragState) return;
        const folderTarget = event.target.closest('[data-note-folder-drop]');
        const moveTarget = event.target.closest('[data-note-bulk-move-drop]');
        const trashTarget = event.target.closest('[data-note-bulk-trash-drop]');
        const shareTarget = event.target.closest('[data-note-bulk-share-drop]');
        if (!folderTarget && !moveTarget && !trashTarget && !shareTarget) return;

        event.preventDefault();
        const cards = [...cardDragState.cards];
        clearDropTargets();

        try {
            if (folderTarget) {
                if (!canDropToFolder(folderTarget, cards)) {
                    window.alert('같은 영역의 폴더로만 이동할 수 있습니다.');
                    return;
                }

                const folderName = folderTarget.querySelector('span')?.textContent?.trim() || '선택한 폴더';
                const currentFolderIds = new Set(cards.map(card => card.dataset.folderId || ''));
                const targetFolderId = folderTarget.dataset.folderId || '';
                if (currentFolderIds.size === 1 && currentFolderIds.has(targetFolderId)) {
                    window.alert('이미 해당 폴더에 있는 노트입니다.');
                    return;
                }

                if (!window.confirm(`선택한 ${cards.length}개 노트를 '${folderName}' 폴더로 이동할까요?`)) return;
                await moveCardsToFolder(cards, targetFolderId);
            } else if (moveTarget) {
                const scopeKeys = new Set(cards.map(card => card.dataset.scopeKey || ''));
                if (scopeKeys.size !== 1) {
                    window.alert('같은 영역의 노트만 함께 이동할 수 있습니다.');
                    return;
                }
                await openMoveModal(cards);
            } else if (trashTarget) {
                if (!window.confirm(`선택한 ${cards.length}개 노트를 휴지통으로 이동할까요?`)) return;
                await moveCardsToTrash(cards);
            } else if (shareTarget) {
                clearCardSelection();
                cards.forEach(card => {
                    const input = card.querySelector('.nl-card-select-input:not(:disabled)');
                    if (input) input.checked = true;
                });
                updateBulkState();
                await openSelectedNotesShareModal();
            }
        } catch (error) {
            window.alert(error.message || '노트 작업을 처리하지 못했습니다.');
            updateBulkState();
        }
    });

    document.addEventListener('dragend', () => {
        clearDropTargets();
        document.body.classList.remove('nl-card-dragging');
        document.querySelectorAll('.nl-note-card.is-dragging').forEach(card => card.classList.remove('is-dragging'));
        cardDragState?.ghost?.remove();
        cardDragState = null;
    });

    const closeMenus = (except) => {
        document.querySelectorAll('.nl-card-menu').forEach(menu => {
            if (menu !== except) menu.hidden = true;
        });
        document.querySelectorAll('.nl-card-menu-button').forEach(button => {
            if (!except || button.nextElementSibling !== except) button.setAttribute('aria-expanded', 'false');
        });
    };

    document.addEventListener('click', (event) => {
        const menuButton = event.target.closest('.nl-card-menu-button');
        if (menuButton) {
            event.preventDefault();
            event.stopPropagation();
            const menu = menuButton.nextElementSibling;
            const open = menu.hidden;
            closeMenus(menu);
            menu.hidden = !open;
            menuButton.setAttribute('aria-expanded', String(open));
            return;
        }
        if (!event.target.closest('.nl-card-menu')) closeMenus();
    });

    const syncTrashBulkActions = () => {
        const actions = document.getElementById('noteTrashBulkActions');
        if (!actions) return;
        const hasTrashCards = trashCards().length > 0;
        actions.hidden = !hasTrashCards;
        if (restoreAllTrash) restoreAllTrash.disabled = !hasTrashCards;
        if (permanentDeleteAllTrash) permanentDeleteAllTrash.disabled = !hasTrashCards;
    };

    const removeCard = (card) => {
        card.remove();
        const countNode = document.querySelector('.nl-list-count');
        if (countNode) {
            const current = Number.parseInt(countNode.dataset.count || countNode.textContent, 10);
            if (Number.isFinite(current)) {
                const next = Math.max(0, current - 1);
                countNode.dataset.count = String(next);
                countNode.textContent = `${next}개의 노트`;
            }
        }
        syncTrashBulkActions();
    };

    const folderRequestParams = () => {
        const params = new URLSearchParams({ scope: folderContext.scope });
        if (folderContext.wsId) params.set('wsId', folderContext.wsId);
        if (folderContext.projId) params.set('projId', folderContext.projId);
        return params;
    };

    const promptFolderName = (message, initialValue = '') => {
        const value = window.prompt(message, initialValue);
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

    const createFolder = async (fromModal = false) => {
        if (fromModal ? !modalFolderManageAllowed : !canManageFolders) return;
        const folderName = promptFolderName('새 폴더 이름을 입력해 주세요.');
        if (!folderName) return;
        const params = {
            scope: folderContext.scope,
            folderName
        };
        if (folderContext.wsId) params.wsId = folderContext.wsId;
        if (folderContext.projId) params.projId = folderContext.projId;
        await post('/note/api/folder/create', params);
        if (fromModal) {
            folderListChanged = true;
            await loadMoveFolders();
        } else {
            window.location.reload();
        }
    };

    const renameFolder = async (folderId, currentName, fromModal = false) => {
        if ((fromModal ? !modalFolderManageAllowed : !canManageFolders) || !folderId) return;
        const folderName = promptFolderName('수정할 폴더 이름을 입력해 주세요.', currentName || '');
        if (!folderName || folderName === currentName) return;
        await post('/note/api/folder/rename', { folderId, folderName });
        if (fromModal) {
            folderListChanged = true;
            await loadMoveFolders();
        } else {
            window.location.reload();
        }
    };

    const deleteFolder = async (folderId, folderName, fromModal = false) => {
        if ((fromModal ? !modalFolderManageAllowed : !canManageFolders) || !folderId) return;
        if (!window.confirm(`'${folderName}' 폴더를 삭제할까요?\n하위 폴더나 노트가 있으면 삭제할 수 없습니다.`)) return;
        await post('/note/api/folder/delete', { folderId });
        if (fromModal) {
            folderListChanged = true;
            await loadMoveFolders();
        } else {
            window.location.reload();
        }
    };

    const loadMoveFolders = async () => {
        const response = await fetch(`/note/api/folders?${folderRequestParams().toString()}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message || '폴더 목록을 불러오지 못했습니다.');

        const currentFolders = new Set(activeCards.map(card => card.dataset.folderId || ''));
        const singleCurrent = currentFolders.size === 1 ? [...currentFolders][0] : null;
        const folders = result.folders || [];
        folderList.innerHTML = '';

        const renderChoice = (id, name, depth = 0) => {
            const row = document.createElement('div');
            const isCurrent = singleCurrent !== null && String(id == null ? '' : id) === singleCurrent;
            row.className = 'nl-folder-choice-row' + (isCurrent ? ' is-current' : '');
            row.dataset.folderId = id == null ? '' : String(id);
            row.dataset.folderName = name;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'nl-folder-choice';
            button.dataset.folderId = id == null ? '' : String(id);
            button.disabled = isCurrent;
            button.innerHTML = `<span class="nl-folder-choice-main" style="--folder-depth:${Math.max(0, depth)}"><i class="${id == null ? 'fa-regular fa-folder' : 'fa-solid fa-folder'}"></i><span class="nl-folder-choice-name">${name}</span></span>${isCurrent ? '<em class="nl-folder-choice-badge">현재 위치</em>' : ''}`;
            row.appendChild(button);

            if (id != null && modalFolderManageAllowed) {
                const actions = document.createElement('div');
                actions.className = 'nl-modal-folder-actions';
                actions.innerHTML = `
                    <button type="button" data-modal-folder-rename title="폴더 이름 수정" aria-label="${name} 이름 수정"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i></button>
                    <button type="button" data-modal-folder-delete title="폴더 삭제" aria-label="${name} 삭제"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>`;
                row.appendChild(actions);
            }

            folderList.appendChild(row);
        };
        renderChoice(null, '미분류');
        folders.forEach(folder => renderChoice(folder.folderId, folder.folderName, folder.depth || 0));
    };

    const openMoveModal = async (cards) => {
        activeCards = Array.isArray(cards) ? cards : [cards];
        if (!activeCards.length) return;
        if (!modal || !folderList) {
            window.alert('폴더 이동 모달을 찾지 못했습니다. noteList.jsp의 noteMoveModal 영역을 확인해 주세요.');
            return;
        }

        const scopeKeys = new Set(activeCards.map(card => card.dataset.scopeKey || ''));
        if (scopeKeys.size !== 1) {
            window.alert('같은 영역의 노트만 함께 이동할 수 있습니다.');
            return;
        }

        const baseCard = activeCards[0];
        folderContext.scope = baseCard.dataset.noteScope || folderContext.scope;
        folderContext.wsId = baseCard.dataset.wsId || '';
        folderContext.projId = baseCard.dataset.projId || '';
        modalFolderManageAllowed = activeCards.every(card => card.dataset.canManage === 'true' || card.dataset.canManage === '1');
        const modalCreateButton = document.querySelector('[data-modal-folder-create]');
        if (modalCreateButton) modalCreateButton.hidden = !modalFolderManageAllowed;
        await loadMoveFolders();

        const title = document.getElementById('noteMoveModalTitle');
        if (title) title.textContent = activeCards.length > 1 ? `${activeCards.length}개 노트 폴더 이동` : '폴더 이동';
        modal.hidden = false;
        document.body.classList.add('nl-modal-open');
    };

    const closeMoveModal = () => {
        if (modal) modal.hidden = true;
        document.body.classList.remove('nl-modal-open');
        activeCards = [];
        if (folderListChanged) window.location.reload();
    };

    document.querySelectorAll('[data-move-close]').forEach(button => button.addEventListener('click', closeMoveModal));
    modal?.addEventListener('click', event => { if (event.target === modal) closeMoveModal(); });

    folderList?.addEventListener('click', async (event) => {
        const row = event.target.closest('.nl-folder-choice-row');
        if (!row) return;
        try {
            const renameButton = event.target.closest('[data-modal-folder-rename]');
            const deleteButton = event.target.closest('[data-modal-folder-delete]');
            if (renameButton || deleteButton) {
                event.preventDefault();
                event.stopPropagation();
                const folderId = row.dataset.folderId || '';
                const folderName = row.dataset.folderName || '';
                if (renameButton) await renameFolder(folderId, folderName, true);
                if (deleteButton) await deleteFolder(folderId, folderName, true);
                return;
            }

            const button = event.target.closest('.nl-folder-choice');
            if (!button || button.disabled || activeCards.length === 0) return;
            button.disabled = true;
            for (const card of activeCards) {
                await post('/note/api/folder/move-note', {
                    noteId: card.dataset.noteId,
                    folderId: button.dataset.folderId
                });
            }
            window.location.reload();
        } catch (error) {
            window.alert(error.message || '폴더 작업을 처리하지 못했습니다.');
            const button = event.target.closest('.nl-folder-choice');
            if (button) button.disabled = false;
        }
    });

    document.querySelector('[data-modal-folder-create]')?.addEventListener('click', async () => {
        try {
            await createFolder(true);
        } catch (error) {
            window.alert(error.message || '폴더를 만들지 못했습니다.');
        }
    });

    document.addEventListener('click', async (event) => {
        const createButton = event.target.closest('[data-folder-create]');
        const renameButton = event.target.closest('[data-folder-rename]');
        const deleteButton = event.target.closest('[data-folder-delete]');
        if (!createButton && !renameButton && !deleteButton) return;
        event.preventDefault();
        event.stopPropagation();
        try {
            if (createButton) {
                await createFolder(false);
                return;
            }
            const wrap = event.target.closest('[data-folder-wrap]');
            if (!wrap) return;
            if (renameButton) await renameFolder(wrap.dataset.folderId, wrap.dataset.folderName, false);
            if (deleteButton) await deleteFolder(wrap.dataset.folderId, wrap.dataset.folderName, false);
        } catch (error) {
            window.alert(error.message || '폴더 작업을 처리하지 못했습니다.');
        }
    });

    const noteEscapeHtml = (value) => String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const currentUserId = () => String(
        document.body?.dataset.userId
        || document.getElementById('userId')?.value
        || document.querySelector('[data-current-user-id]')?.dataset.currentUserId
        || ''
    ).trim();

    const selectedNoteIds = () => selectedCards()
        .map(card => String(card.dataset.noteId || '').trim())
        .filter(Boolean);

    const noteShareModalMarkup = (uid) => `
        <button type="button" id="${noteEscapeHtml(uid)}Open" hidden>공유 열기</button>
        <button type="button" id="${noteEscapeHtml(uid)}PermissionDummy" hidden></button>
        <div id="${noteEscapeHtml(uid)}InitialSource" hidden></div>
        <div id="${noteEscapeHtml(uid)}Modal" class="note-write-share-modal moyo-share-modal" data-current-user-id="${noteEscapeHtml(currentUserId())}" data-share-mode-type="PERMISSION" hidden>
            <div class="note-write-share-backdrop" data-note-share-close></div>
            <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="${noteEscapeHtml(uid)}Title">
                <div class="note-write-share-modal-head">
                    <div>
                        <h3 id="${noteEscapeHtml(uid)}Title">공유</h3>
                        <p>선택한 노트를 받을 사람에게 공유 요청을 보냅니다.</p>
                    </div>
                    <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
                </div>
                <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
                    <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
                    <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">그룹</button>
                    <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
                </div>
                <div class="note-write-share-toolbar">
                    <select id="${noteEscapeHtml(uid)}Context" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
                    <input type="text" id="${noteEscapeHtml(uid)}Keyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
                </div>
                <div class="note-write-share-body note-write-share-body-simple">
                    <div>
                        <div class="note-write-share-subtitle">받는 대상</div>
                        <div id="${noteEscapeHtml(uid)}Candidates" class="note-write-share-list"></div>
                    </div>
                    <div>
                        <div class="note-write-share-subtitle" hidden>공유 목록 <span id="${noteEscapeHtml(uid)}ModalCount" class="note-share-modal-count" hidden>0</span></div>
                        <div id="${noteEscapeHtml(uid)}Selected" class="note-write-share-selected"></div>
                    </div>
                </div>
                <div class="note-write-share-modal-actions">
                    <div>
                        <button type="button" class="note-soft-btn" data-note-share-close>취소</button>
                        <button type="button" id="${noteEscapeHtml(uid)}Apply" class="note-gradient-btn">보내기</button>
                    </div>
                </div>
            </section>
        </div>`;

    const openSelectedNotesShareModal = async () => {
        const cards = selectedCards();
        const noteIds = cards.map(card => String(card.dataset.noteId || '').trim()).filter(Boolean);
        if (!noteIds.length) return;
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') {
            window.alert('공유 모달 스크립트를 불러오지 못했습니다.');
            return;
        }
        const mount = document.getElementById('noteListShareMount') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'noteListShareMount' }));
        const uid = `noteListShare${noteIds[0]}_${Date.now()}`;
        mount.innerHTML = noteShareModalMarkup(uid);
        const openButton = document.getElementById(`${uid}Open`);
        window.MoyoShareModal.init({
            contentType: 'NOTE',
            contentId: noteIds[0],
            contentIds: noteIds,
            shareMode: 'PERMISSION',
            persist: true,
            reloadOnPersist: false,
            bodyOpenClass: 'note-share-modal-open',
            currentUserId: currentUserId(),
            ids: {
                openButton: `${uid}Open`,
                permissionButton: `${uid}PermissionDummy`,
                modal: `${uid}Modal`,
                keyword: `${uid}Keyword`,
                applyButton: `${uid}Apply`,
                title: `${uid}Title`,
                context: `${uid}Context`,
                candidates: `${uid}Candidates`,
                selected: `${uid}Selected`,
                hiddenFields: 'noteListShareHiddenFields',
                modalCount: `${uid}ModalCount`,
                initialSharesSource: `${uid}InitialSource`,
                workspaceMemberSource: 'noteListWorkspaceMemberSource',
                projectMemberSource: 'noteListProjectMemberSource',
                workspaceTargetSource: 'noteListWorkspaceTargetSource',
                projectTargetSource: 'noteListProjectTargetSource'
            },
            onPersistSuccess: () => {
                window.alert(noteIds.length > 1 ? `노트 ${noteIds.length}개 공유 요청을 보냈습니다.` : '공유 요청을 보냈습니다.');
                setSelectionMode(false);
            }
        });
        setTimeout(() => openButton?.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true })), 0);
    };

    bulkShare?.addEventListener('click', async () => {
        try {
            await openSelectedNotesShareModal();
        } catch (error) {
            window.alert(error.message || '공유 모달을 열지 못했습니다.');
        }
    });

    bulkMove?.addEventListener('click', async () => {
        try {
            await openMoveModal(selectedCards());
        } catch (error) {
            window.alert(error.message || '폴더 목록을 불러오지 못했습니다.');
        }
    });

    bulkTrash?.addEventListener('click', async () => {
        const cards = selectedCards();
        if (!cards.length) return;
        if (!window.confirm(`선택한 ${cards.length}개 노트를 휴지통으로 이동할까요?`)) return;
        bulkTrash.disabled = true;
        bulkMove.disabled = true;
        if (bulkShare) bulkShare.disabled = true;
        try {
            await moveCardsToTrash(cards);
        } catch (error) {
            window.alert(error.message || '일부 노트를 휴지통으로 이동하지 못했습니다.');
            updateBulkState();
        }
    });


    restoreAllTrash?.addEventListener('click', async () => {
        const cards = trashCards();
        if (!cards.length) return;
        if (!window.confirm(`휴지통의 노트 ${cards.length}개를 모두 복원할까요?`)) return;
        restoreAllTrash.disabled = true;
        if (permanentDeleteAllTrash) permanentDeleteAllTrash.disabled = true;
        let success = 0;
        let fail = 0;
        for (const card of cards) {
            try {
                await post('/note/api/note/restore', { noteId: card.dataset.noteId });
                removeCard(card);
                success += 1;
            } catch (error) {
                fail += 1;
            }
        }
        syncTrashBulkActions();
        if (fail > 0) window.alert(`전체 복원 처리 완료: 성공 ${success}개 / 실패 ${fail}개`);
    });

    permanentDeleteAllTrash?.addEventListener('click', async () => {
        const cards = trashCards();
        if (!cards.length) return;
        if (!window.confirm(`휴지통의 노트 ${cards.length}개를 모두 영구 삭제할까요? 영구 삭제하면 복원할 수 없습니다.`)) return;
        permanentDeleteAllTrash.disabled = true;
        if (restoreAllTrash) restoreAllTrash.disabled = true;
        let success = 0;
        let fail = 0;
        for (const card of cards) {
            try {
                await post('/note/api/note/permanent-delete', { noteId: card.dataset.noteId });
                removeCard(card);
                success += 1;
            } catch (error) {
                fail += 1;
            }
        }
        syncTrashBulkActions();
        if (fail > 0) window.alert(`전체 영구 삭제 처리 완료: 성공 ${success}개 / 실패 ${fail}개`);
    });

    document.addEventListener('click', async (event) => {
        const actionButton = event.target.closest('[data-note-action]');
        if (!actionButton) return;
        event.preventDefault();
        event.stopPropagation();
        const card = actionButton.closest('.nl-note-card');
        const action = actionButton.dataset.noteAction;
        closeMenus();
        try {
            if (action === 'move') {
                await openMoveModal(card);
            } else if (action === 'trash') {
                if (!window.confirm('이 노트를 휴지통으로 이동할까요?')) return;
                await post('/note/api/note/trash', { noteId: card.dataset.noteId });
                removeCard(card);
            } else if (action === 'restore') {
                await post('/note/api/note/restore', { noteId: card.dataset.noteId });
                removeCard(card);
            } else if (action === 'permanent-delete') {
                if (!window.confirm('영구 삭제하면 복원할 수 없습니다. 계속할까요?')) return;
                await post('/note/api/note/permanent-delete', { noteId: card.dataset.noteId });
                removeCard(card);
            }
        } catch (error) {
            window.alert(error.message || '잠시 후 다시 시도해 주세요.');
        }
    });

    document.querySelectorAll('.nl-note-link.is-trash-card').forEach(link => link.addEventListener('click', event => event.preventDefault()));
})();
