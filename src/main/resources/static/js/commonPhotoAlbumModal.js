(function () {
    function $(id) { return document.getElementById(id); }
    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
    }
    function pick(object, ...keys) {
        if (!object) return '';
        for (const key of keys) {
            if (object[key] !== undefined && object[key] !== null) return object[key];
        }
        return '';
    }
    function numberOrNull(value) {
        if (value === undefined || value === null || value === '') return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function createAlbumModal(options) {
        const config = Object.assign({
            modalId: 'commonPhotoAlbumModal',
            contextPath: '',
            scopeType: 'PERSONAL',
            scopeId: '',
            currentUserId: null,
            selectedAlbumId: '',
            onApply: null,
            onChange: null,
            toast: null
        }, options || {});
        const root = $(config.modalId);
        if (!root) return null;

        const el = {
            panel: root.querySelector('.moyo-album-panel'),
            closeButtons: root.querySelectorAll('[data-album-modal-close]'),
            list: root.querySelector('[data-album-list]'),
            search: root.querySelector('[data-album-search]'),
            count: root.querySelector('[data-album-count]'),
            selectedText: root.querySelector('[data-album-selected-text]'),
            createToggle: root.querySelector('[data-album-create-toggle]'),
            createPanel: root.querySelector('[data-album-create-panel]'),
            createName: root.querySelector('[data-album-create-name]'),
            createButton: root.querySelector('[data-album-create-submit]'),
            createCancel: root.querySelector('[data-album-create-cancel]'),
            apply: root.querySelector('[data-album-apply]')
        };

        const state = {
            albums: [],
            selectedAlbumId: numberOrNull(config.selectedAlbumId),
            editingAlbumId: null,
            loading: false
        };

        function notify(message, error) {
            if (typeof config.toast === 'function') config.toast(message, error);
            else if (message) alert(message);
        }
        function request(url, options) {
            return fetch((config.contextPath || '') + url, options || {}).then(async response => {
                const text = await response.text();
                let data = null;
                try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
                if (!response.ok) throw new Error((data && data.message) || '요청을 처리하지 못했습니다.');
                return data;
            });
        }
        function albumId(album) { return numberOrNull(pick(album, 'albumId', 'ALBUM_ID')); }
        function albumName(album) { return pick(album, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범'; }
        function albumDesc(album) { return pick(album, 'albumDescription', 'ALBUM_DESCRIPTION') || ''; }
        function albumCreator(album) { return numberOrNull(pick(album, 'createdBy', 'CREATED_BY')); }
        function canManage(album) {
            const creator = albumCreator(album);
            const current = numberOrNull(config.currentUserId);
            return creator == null || current == null || creator === current;
        }
        function selectedAlbum() {
            if (state.selectedAlbumId == null) return null;
            return state.albums.find(album => albumId(album) === state.selectedAlbumId) || null;
        }
        function selectedLabel() {
            const album = selectedAlbum();
            return album ? albumName(album) : '앨범 없이 등록';
        }
        function applySelectedText() {
            if (el.selectedText) el.selectedText.textContent = selectedLabel();
            if (typeof config.onChange === 'function') {
                const album = selectedAlbum();
                config.onChange({ albumId: state.selectedAlbumId, albumName: selectedLabel(), album, albumCount: state.albums.length, albums: state.albums.slice() });
            }
        }
        function showCreatePanel(show) {
            if (!el.createPanel || !el.createToggle) return;
            el.createPanel.hidden = !show;
            el.createToggle.hidden = !!show;
            if (show && el.createName) {
                el.createName.value = '';
                setTimeout(() => el.createName.focus(), 0);
            }
        }
        async function load() {
            state.loading = true;
            try {
                state.albums = await request(`/api/photo-albums?scopeType=${encodeURIComponent(config.scopeType)}&scopeId=${encodeURIComponent(config.scopeId)}`) || [];
                render();
                applySelectedText();
                return state.albums;
            } finally {
                state.loading = false;
            }
        }
        function render() {
            const keyword = (el.search ? el.search.value : '').trim().toLowerCase();
            const filtered = state.albums.filter(album => albumName(album).toLowerCase().includes(keyword));
            if (el.count) el.count.textContent = String(state.albums.length);
            const options = [{ id: null, name: '앨범 없이 등록', description: '사진첩의 최근 사진에만 표시됩니다.', empty: true }].concat(filtered.map(album => {
                const photoCount = Number(pick(album, 'photoCount', 'PHOTO_COUNT') || 0);
                return {
                    id: albumId(album),
                    name: albumName(album),
                    description: albumDesc(album) || `${photoCount}장`,
                    album,
                    canManage: canManage(album)
                };
            }));
            if (!el.list) return;
            el.list.innerHTML = options.map(option => {
                const selected = (option.id == null && state.selectedAlbumId == null) || option.id === state.selectedAlbumId;
                const editing = option.id != null && option.id === state.editingAlbumId;
                const manageButtons = option.canManage && !editing
                    ? `<button type="button" class="moyo-album-icon-button" data-album-edit="${option.id}" aria-label="앨범 이름 수정"><i class="fa-regular fa-pen-to-square"></i></button><button type="button" class="moyo-album-icon-button danger" data-album-delete="${option.id}" aria-label="앨범 삭제"><i class="fa-regular fa-trash-can"></i></button>`
                    : '';
                const title = editing
                    ? `<span class="moyo-album-inline-edit"><input type="text" data-album-edit-name value="${esc(option.name)}" maxlength="100" aria-label="앨범 이름"><button type="button" data-album-edit-save="${option.id}">저장</button><button type="button" data-album-edit-cancel>취소</button></span>`
                    : `<span class="moyo-album-title-line"><strong>${esc(option.name)}</strong>${manageButtons}</span>`;
                return `<article class="moyo-album-option${selected ? ' selected' : ''}${editing ? ' is-editing' : ''}" data-album-option="${option.id == null ? '' : option.id}">
                    <span class="moyo-album-option-icon"><i class="${option.empty ? 'fa-regular fa-folder-open' : 'fa-solid fa-folder'}"></i></span>
                    <span class="moyo-album-option-text">${title}<small>${esc(option.description)}</small></span>
                    <span class="moyo-album-option-check"><i class="fa-solid fa-check"></i></span>
                </article>`;
            }).join('');
        }
        function open() {
            root.hidden = false;
            document.body.classList.add('moyo-album-modal-open');
            showCreatePanel(false);
            load().catch(e => notify(e.message, true));
            setTimeout(() => el.search && el.search.focus(), 0);
        }
        function close() {
            root.hidden = true;
            document.body.classList.remove('moyo-album-modal-open');
            state.editingAlbumId = null;
        }
        async function createAlbum() {
            const name = (el.createName ? el.createName.value : '').trim();
            if (!name) {
                if (el.createName) el.createName.focus();
                return notify('앨범 이름을 입력해주세요.', true);
            }
            if (el.createButton) el.createButton.disabled = true;
            try {
                const result = await request('/api/photo-albums', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ scopeType: config.scopeType, scopeId: config.scopeId, albumName: name, albumDescription: '' })
                });
                state.selectedAlbumId = numberOrNull(pick(result, 'albumId', 'ALBUM_ID'));
                showCreatePanel(false);
                await load();
                notify('새 앨범을 만들고 선택했습니다.');
            } catch (e) {
                notify(e.message, true);
            } finally {
                if (el.createButton) el.createButton.disabled = false;
            }
        }
        async function saveAlbumName(albumId) {
            const id = numberOrNull(albumId);
            const album = state.albums.find(item => albumId(item) === id);
            const input = el.list ? el.list.querySelector('[data-album-edit-name]') : null;
            const name = (input ? input.value : '').trim();
            if (!id || !album) return;
            if (!name) {
                if (input) input.focus();
                return notify('앨범 이름을 입력해주세요.', true);
            }
            try {
                await request(`/api/photo-albums/${id}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ albumName: name, albumDescription: albumDesc(album) })
                });
                state.editingAlbumId = null;
                await load();
                notify('앨범 이름을 수정했습니다.');
            } catch (e) {
                notify(e.message, true);
            }
        }
        async function deleteAlbum(albumIdValue) {
            const id = numberOrNull(albumIdValue);
            const album = state.albums.find(item => albumId(item) === id);
            if (!id || !album) return;
            if (!confirm(`'${albumName(album)}' 앨범을 삭제할까요?\n사진은 삭제되지 않고 앨범 없이 남습니다.`)) return;
            try {
                await request(`/api/photo-albums/${id}`, { method: 'DELETE' });
                if (state.selectedAlbumId === id) state.selectedAlbumId = null;
                await load();
                notify('앨범을 삭제했습니다.');
            } catch (e) {
                notify(e.message, true);
            }
        }
        function setSelected(albumIdValue) {
            state.selectedAlbumId = numberOrNull(albumIdValue);
            render();
            applySelectedText();
        }
        function setScope(scopeType, scopeId, selectedAlbumId) {
            config.scopeType = scopeType || 'PERSONAL';
            config.scopeId = scopeId == null ? '' : String(scopeId);
            state.selectedAlbumId = numberOrNull(selectedAlbumId);
            state.editingAlbumId = null;
            state.albums = [];
            render();
            applySelectedText();
        }
        function getSelected() {
            const album = selectedAlbum();
            return { albumId: state.selectedAlbumId, albumName: selectedLabel(), album, albumCount: state.albums.length, albums: state.albums.slice() };
        }

        el.closeButtons.forEach(button => button.addEventListener('click', close));
        if (el.search) el.search.addEventListener('input', render);
        if (el.createToggle) el.createToggle.addEventListener('click', () => showCreatePanel(true));
        if (el.createCancel) el.createCancel.addEventListener('click', () => showCreatePanel(false));
        if (el.createButton) el.createButton.addEventListener('click', createAlbum);
        if (el.createName) el.createName.addEventListener('keydown', e => { if (e.key === 'Enter') createAlbum(); });
        if (el.apply) el.apply.addEventListener('click', () => {
            applySelectedText();
            if (typeof config.onApply === 'function') config.onApply(getSelected());
            close();
        });
        if (el.list) {
            el.list.addEventListener('click', e => {
                const edit = e.target.closest('[data-album-edit]');
                if (edit) {
                    e.preventDefault();
                    e.stopPropagation();
                    state.editingAlbumId = numberOrNull(edit.dataset.albumEdit);
                    render();
                    const input = el.list.querySelector('[data-album-edit-name]');
                    if (input) { input.focus(); input.select(); }
                    return;
                }
                const del = e.target.closest('[data-album-delete]');
                if (del) {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteAlbum(del.dataset.albumDelete);
                    return;
                }
                const save = e.target.closest('[data-album-edit-save]');
                if (save) {
                    e.preventDefault();
                    e.stopPropagation();
                    saveAlbumName(save.dataset.albumEditSave);
                    return;
                }
                if (e.target.closest('[data-album-edit-cancel]')) {
                    e.preventDefault();
                    e.stopPropagation();
                    state.editingAlbumId = null;
                    render();
                    return;
                }
                const option = e.target.closest('[data-album-option]');
                if (!option) return;
                setSelected(option.dataset.albumOption);
            });
            el.list.addEventListener('keydown', e => {
                if (e.key !== 'Enter') return;
                const save = e.target.closest('[data-album-edit-name]');
                if (save) {
                    const row = e.target.closest('.moyo-album-option');
                    const button = row && row.querySelector('[data-album-edit-save]');
                    if (button) saveAlbumName(button.dataset.albumEditSave);
                }
            });
        }
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !root.hidden) close();
        });

        return { open, close, load, setSelected, setScope, getSelected, render };
    }

    window.MoyoPhotoAlbumModal = { create: createAlbumModal };
})();
