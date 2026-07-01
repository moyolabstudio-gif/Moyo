(function () {
    const page = document.querySelector('.photo-post-form-page');
    if (!page) return;

    const $ = id => document.getElementById(id);
    const contextPath = page.dataset.contextPath || '';
    const mode = page.dataset.mode || 'write';
    const postId = page.dataset.postId || '';
    const initialScopeType = page.dataset.scopeType || 'PERSONAL';
    const initialScopeId = page.dataset.scopeId || '';
    const currentUserId = page.dataset.currentUserId || '';
    const entryTarget = page.dataset.entryTarget || '';
    let activeScopeType = initialScopeType;
    let activeScopeId = initialScopeId;
    const selectedAlbumId = page.dataset.selectedAlbumId || '';
    const backUrl = page.dataset.backUrl || `/photo-album?scopeType=${encodeURIComponent(initialScopeType)}&scopeId=${encodeURIComponent(initialScopeId)}`;
    const defaultMoyoPublic = page.dataset.defaultMoyoPublic === 'true';
    const MAX_PHOTO_COUNT = 10;

    const el = {
        files: $('photoFormFiles'),
        drop: $('photoFormDrop'),
        editorToolbar: $('photoEditorToolbar'),
        editorFooter: $('photoEditorFooter'),
        editorUnderbar: $('photoEditorUnderbar'),
        editorThumbs: $('photoEditorThumbs'),
        editorCounter: $('photoEditorCounter'),
        editorZoom: $('photoEditorZoom'),
        editorZoomValue: $('photoEditorZoomValue'),
        editorOffsetX: $('photoEditorOffsetX'),
        editorOffsetXValue: $('photoEditorOffsetXValue'),
        editorOffsetY: $('photoEditorOffsetY'),
        editorOffsetYValue: $('photoEditorOffsetYValue'),
        previewGrid: $('photoFormPreviewGrid'),
        description: $('photoFormDescription'),
        descriptionCount: $('photoFormDescriptionCount'),
        formTitle: $('photoFormTitle'),
        formHeroDescription: $('photoFormHeroDescription'),
        targetField: $('photoFormTargetField'),
        targetButtons: Array.from(document.querySelectorAll('[data-photo-target]')),
        targetGuide: $('photoFormTargetGuide'),
        workspaceTargetRow: $('photoWorkspaceTargetRow'),
        workspaceTargetSelect: $('photoWorkspaceTargetSelect'),
        projectWorkspaceTargetRow: $('photoProjectWorkspaceTargetRow'),
        projectWorkspaceTargetSelect: $('photoProjectWorkspaceTargetSelect'),
        projectTargetRow: $('photoProjectTargetRow'),
        projectTargetSelect: $('photoProjectTargetSelect'),
        visibilityField: $('photoFormVisibilityField'),
        visibilityLabel: $('photoFormVisibilityLabel'),
        visibility: $('photoFormVisibility'),
        moyoBox: $('photoFormMoyoBox'),
        moyoPublic: $('photoFormMoyoPublic'),
        visibilityGuide: $('photoFormVisibilityGuide'),
        album: $('photoFormAlbum'),
        albumLabel: $('photoFormAlbumLabel'),
        albumCount: $('photoFormAlbumCount'),
        openAlbumModal: $('openPhotoAlbumModal'),
        shareHiddenFields: $('photoPostShareHiddenFields'),
        submit: $('photoFormSubmit'),
        toast: $('photoToast')
    };

    const state = { files: [], edits: [], activeIndex: 0, previewUrls: [], post: null, photos: [], albums: [], albumModal: null, targetMode: 'PERSONAL', workspaces: [], projects: [] };

    function toast(message, error) {
        if (!el.toast) {
            alert(message);
            return;
        }
        el.toast.textContent = message;
        el.toast.classList.toggle('error', !!error);
        el.toast.classList.add('show');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => el.toast.classList.remove('show'), 2200);
    }

    function request(url, options) {
        return fetch(contextPath + url, options || {}).then(async response => {
            const text = await response.text();
            let data = null;
            try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
            if (!response.ok) throw new Error((data && data.message) || '요청을 처리하지 못했습니다.');
            return data;
        });
    }

    function pick(object, ...keys) {
        if (!object) return '';
        for (const key of keys) {
            if (object[key] !== undefined && object[key] !== null) return object[key];
        }
        return '';
    }

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
    }

    function resolvePath(path) {
        const value = String(path || '').trim();
        if (!value) return '';
        if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/')) return value;
        return `${contextPath}/${value.replace(/^\/+/, '')}`;
    }

    function goBack() {
        window.location.href = contextPath + backUrl;
    }


    function normalizeTargetMode(value) {
        const v = String(value || '').trim().toUpperCase();
        if (v === 'GROUP' || v === 'WS') return 'WORKSPACE';
        if (v === 'PROJ') return 'PROJECT';
        if (['PERSONAL', 'FRIEND', 'WORKSPACE', 'PROJECT'].includes(v)) return v;
        const scope = String(initialScopeType || '').toUpperCase();
        if (scope === 'WORKSPACE' || scope === 'PROJECT') return scope;
        return 'PERSONAL';
    }

    function collectWorkspaces() {
        return Array.from(document.querySelectorAll('#photoPostWorkspaceTargetSource [data-ws-id]')).map(node => ({
            id: node.dataset.wsId || '',
            name: node.dataset.wsName || '이름 없는 그룹',
            imagePath: node.dataset.wsImagePath || ''
        })).filter(item => item.id);
    }

    function collectProjects() {
        return Array.from(document.querySelectorAll('#photoPostProjectTargetSource [data-proj-id]')).map(node => ({
            id: node.dataset.projId || '',
            name: node.dataset.projName || '이름 없는 프로젝트',
            wsId: node.dataset.wsId || '',
            wsName: node.dataset.wsName || ''
        })).filter(item => item.id);
    }

    function renderTargetOptions() {
        state.workspaces = collectWorkspaces();
        state.projects = collectProjects();
        if (el.workspaceTargetSelect) {
            el.workspaceTargetSelect.innerHTML = state.workspaces.length
                ? state.workspaces.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')
                : '<option value="">선택 가능한 그룹 없음</option>';
            if (String(initialScopeType).toUpperCase() === 'WORKSPACE' && initialScopeId) el.workspaceTargetSelect.value = String(initialScopeId);
        }
        if (el.projectWorkspaceTargetSelect) {
            const projectWorkspaceMap = new Map();
            state.projects.forEach(project => {
                if (!project.wsId) return;
                if (!projectWorkspaceMap.has(project.wsId)) projectWorkspaceMap.set(project.wsId, project.wsName || '그룹');
            });
            const projectWorkspaces = Array.from(projectWorkspaceMap.entries());
            el.projectWorkspaceTargetSelect.innerHTML = projectWorkspaces.length
                ? projectWorkspaces.map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join('')
                : '<option value="">선택 가능한 그룹 없음</option>';
            if (String(initialScopeType).toUpperCase() === 'PROJECT' && initialScopeId) {
                const currentProject = state.projects.find(project => String(project.id) === String(initialScopeId));
                if (currentProject && currentProject.wsId) el.projectWorkspaceTargetSelect.value = String(currentProject.wsId);
            }
        }
    }

    function renderProjectOptions() {
        if (!el.projectTargetSelect) return;
        const wsId = el.projectWorkspaceTargetSelect ? el.projectWorkspaceTargetSelect.value : '';
        const filtered = state.projects.filter(project => !wsId || String(project.wsId) === String(wsId));
        el.projectTargetSelect.innerHTML = filtered.length
            ? filtered.map(project => `<option value="${esc(project.id)}" data-ws-id="${esc(project.wsId)}">${esc(project.name)}</option>`).join('')
            : '<option value="">선택 가능한 프로젝트 없음</option>';
        if (String(initialScopeType).toUpperCase() === 'PROJECT' && initialScopeId && filtered.some(project => String(project.id) === String(initialScopeId))) {
            el.projectTargetSelect.value = String(initialScopeId);
        }
    }

    function resetAlbumForTarget() {
        if (el.album) el.album.value = '';
        if (el.albumLabel) el.albumLabel.textContent = '앨범 없이 등록';
        if (el.albumCount) {
            el.albumCount.textContent = '0';
            el.albumCount.classList.add('is-empty');
        }
        if (state.albumModal && typeof state.albumModal.setScope === 'function') {
            state.albumModal.setScope(activeScopeType, activeScopeId, '');
        }
        loadAlbums().catch(() => {});
    }

    function syncTargetScope(resetAlbum) {
        const target = state.targetMode;
        if (target === 'WORKSPACE') {
            activeScopeType = 'WORKSPACE';
            activeScopeId = el.workspaceTargetSelect && el.workspaceTargetSelect.value ? el.workspaceTargetSelect.value : initialScopeId;
        } else if (target === 'PROJECT') {
            activeScopeType = 'PROJECT';
            activeScopeId = el.projectTargetSelect && el.projectTargetSelect.value ? el.projectTargetSelect.value : initialScopeId;
        } else {
            activeScopeType = 'PERSONAL';
            activeScopeId = currentUserId || initialScopeId;
        }
        page.dataset.activeScopeType = activeScopeType;
        page.dataset.activeScopeId = activeScopeId;
        updateFormCopy();
        fillVisibility();
        updateTargetGuide();
        if (resetAlbum) resetAlbumForTarget();
    }


    function updateFormCopy() {
        if (mode === 'edit') return;
        const action = '등록';
        const copy = {
            PERSONAL: ['개인 사진', '큰 화면에서 사진을 확인하면서 설명과 앨범, MOYO 공개 여부를 정리합니다.'],
            FRIEND: ['개인 사진', '친구 탭에서 시작한 사진도 개인 사진으로 등록합니다.'],
            WORKSPACE: ['그룹 사진', '현재 선택한 그룹 공간에 사진을 등록합니다.'],
            PROJECT: ['프로젝트 사진', '현재 선택한 프로젝트 공간에 사진을 등록합니다.']
        }[state.targetMode] || ['개인 사진', '큰 화면에서 사진을 확인하면서 설명과 앨범을 정리합니다.'];
        if (el.formTitle) el.formTitle.textContent = `${copy[0]} ${action}`;
        if (el.formHeroDescription) el.formHeroDescription.textContent = copy[1];
    }

    function updateTargetGuide() {
        if (!el.targetGuide) return;
        if (state.targetMode === 'FRIEND') {
            el.targetGuide.textContent = '친구를 선택하면 등록 완료 후 공유 요청이 전송됩니다.';
            return;
        }
        if (state.targetMode === 'WORKSPACE') {
            const name = el.workspaceTargetSelect && el.workspaceTargetSelect.selectedOptions[0] ? el.workspaceTargetSelect.selectedOptions[0].textContent : '그룹';
            el.targetGuide.textContent = `${name} 그룹 공간에 사진을 등록합니다.`;
            return;
        }
        if (state.targetMode === 'PROJECT') {
            const name = el.projectTargetSelect && el.projectTargetSelect.selectedOptions[0] ? el.projectTargetSelect.selectedOptions[0].textContent : '프로젝트';
            el.targetGuide.textContent = `${name} 프로젝트 공간에 사진을 등록합니다.`;
            return;
        }
        el.targetGuide.textContent = '지정하지 않으면 개인 사진으로 등록됩니다.';
    }

    function setTargetMode(targetMode, resetAlbum) {
        const target = normalizeTargetMode(targetMode);
        state.targetMode = target;
        if (el.targetButtons) {
            el.targetButtons.forEach(button => {
                const active = normalizeTargetMode(button.dataset.photoTarget) === target;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-selected', active ? 'true' : 'false');
            });
        }
        if (el.workspaceTargetRow) el.workspaceTargetRow.hidden = target !== 'WORKSPACE';
        if (el.projectWorkspaceTargetRow) el.projectWorkspaceTargetRow.hidden = target !== 'PROJECT';
        if (el.projectTargetRow) el.projectTargetRow.hidden = target !== 'PROJECT';
        const shareField = document.querySelector('.photo-share-field');
        if (shareField) {
            shareField.hidden = target === 'WORKSPACE' || target === 'PROJECT';
            const label = shareField.querySelector(':scope > span');
            const small = shareField.querySelector('small');
            const buttonText = shareField.querySelector('#openPhotoPostShareModal span:nth-child(2)');
            if (label) label.textContent = target === 'FRIEND' ? '공유 대상' : '공유';
            if (buttonText) buttonText.textContent = target === 'FRIEND' ? '친구 선택' : '공유 대상';
            if (small) small.textContent = target === 'FRIEND'
                ? '등록 완료 후 선택한 친구에게 공유 요청이 전송됩니다.'
                : '친구, 그룹, 프로젝트를 선택해 이 사진을 함께 볼 수 있습니다.';
        }
        if (target === 'PROJECT') renderProjectOptions();
        syncTargetScope(resetAlbum !== false);
    }

    function validateTargetBeforeSubmit() {
        if (state.targetMode === 'WORKSPACE' && !activeScopeId) {
            toast('사진을 등록할 그룹을 선택해주세요.', true);
            return false;
        }
        if (state.targetMode === 'PROJECT' && !activeScopeId) {
            toast('사진을 등록할 프로젝트를 선택해주세요.', true);
            return false;
        }
        return true;
    }

    function setVisibilityTitle(title, chip) {
        if (!el.visibilityLabel) return;
        el.visibilityLabel.innerHTML = chip
            ? `${esc(title)} <span class="post-visibility-chip photo-feed-public-title-chip">${esc(chip)}</span>`
            : esc(title);
    }

    function fillVisibility() {
        if (!el.visibility) return;
        if (el.visibilityField) el.visibilityField.hidden = false;
        if (state.targetMode === 'FRIEND') {
            if (el.visibilityField) el.visibilityField.hidden = true;
            if (el.moyoPublic) el.moyoPublic.checked = false;
            return;
        }
        if (mode === 'edit') {
            el.visibility.disabled = true;
            const label = pick(state.post, 'visibilityType', 'VISIBILITY_TYPE') || (activeScopeType === 'WORKSPACE' ? 'WORKSPACE' : activeScopeType === 'PROJECT' ? 'PROJECT' : 'PRIVATE');
            el.visibility.innerHTML = `<option>${esc(visibilityText(label))}</option>`;
            if (el.moyoBox) el.moyoBox.hidden = true;
            if (el.visibilityGuide) el.visibilityGuide.textContent = '공개 범위 변경은 다음 단계에서 공유/권한 모달과 함께 정리합니다.';
            return;
        }
        if (activeScopeType === 'WORKSPACE') {
            setVisibilityTitle('등록 범위', '그룹');
            el.visibility.innerHTML = '<option value="WORKSPACE">그룹 공개</option>';
            el.visibility.hidden = false;
            if (el.moyoBox) el.moyoBox.hidden = true;
            if (el.visibilityGuide) el.visibilityGuide.textContent = '현재 그룹 구성원이 함께 볼 수 있습니다.';
            return;
        }
        if (activeScopeType === 'PROJECT') {
            setVisibilityTitle('등록 범위', '프로젝트');
            el.visibility.innerHTML = '<option value="PROJECT">프로젝트 공개</option>';
            el.visibility.hidden = false;
            if (el.moyoBox) el.moyoBox.hidden = true;
            if (el.visibilityGuide) el.visibilityGuide.textContent = '현재 프로젝트 팀원이 함께 볼 수 있습니다.';
            return;
        }
        setVisibilityTitle('피드 공개', 'MOYO');
        el.visibility.innerHTML = '<option value="PRIVATE">나만 보기</option>';
        el.visibility.hidden = true;
        const friendTarget = state.targetMode === 'FRIEND';
        if (el.moyoBox) el.moyoBox.hidden = friendTarget;
        if (el.moyoPublic) el.moyoPublic.checked = friendTarget ? false : defaultMoyoPublic;
        if (el.visibilityGuide) el.visibilityGuide.textContent = friendTarget
            ? '친구 공유는 등록 완료 후 요청으로 전송되고, 상대가 수락하면 함께 볼 수 있습니다.'
            : 'MOYO 공개를 체크하면 친구들이 MOYO 피드에서 볼 수 있습니다.';
    }

    function visibilityText(value) {
        const v = String(value || '').toUpperCase();
        if (v === 'FRIENDS') return 'MOYO 공개';
        if (v === 'SELECTED') return '선택 친구';
        if (v === 'WORKSPACE' || v === 'WS') return '그룹 공개';
        if (v === 'PROJECT' || v === 'PROJ') return '프로젝트 공개';
        return '나만 보기';
    }

    function initAlbumModal() {
        if (!window.MoyoPhotoAlbumModal || !el.openAlbumModal) return;
        state.albumModal = window.MoyoPhotoAlbumModal.create({
            modalId: 'commonPhotoAlbumModal',
            contextPath,
            scopeType: activeScopeType,
            scopeId: activeScopeId,
            currentUserId: document.getElementById('commonPhotoAlbumModal')?.dataset.currentUserId || '',
            selectedAlbumId: selectedAlbumId || (el.album ? el.album.value : ''),
            toast,
            onChange(selection) {
                state.albums = selection.albums || state.albums;
                setAlbumSelection(selection.albumId, selection.albumName, selection.albumCount);
            },
            onApply(selection) {
                state.albums = selection.albums || state.albums;
                setAlbumSelection(selection.albumId, selection.albumName, selection.albumCount);
            }
        });
        el.openAlbumModal.addEventListener('click', () => state.albumModal.open());
    }

    function setAlbumSelection(albumId, albumName, albumCount) {
        const value = albumId == null || albumId === '' ? '' : String(albumId);
        if (el.album) el.album.value = value;
        if (el.albumLabel) el.albumLabel.textContent = albumName || '앨범 없이 등록';
        if (el.albumCount && albumCount != null) {
            el.albumCount.textContent = String(albumCount);
            el.albumCount.classList.toggle('is-empty', Number(albumCount) <= 0);
        }
    }

    async function loadAlbums() {
        if (!activeScopeId) {
            state.albums = [];
            setAlbumSelection('', '앨범 없이 등록', 0);
            return state.albums;
        }
        if (state.albumModal && typeof state.albumModal.load === 'function') {
            const albums = await state.albumModal.load();
            state.albums = albums || [];
            const currentAlbumId = el.album && el.album.value ? Number(el.album.value) : (selectedAlbumId ? Number(selectedAlbumId) : null);
            const currentAlbum = currentAlbumId ? state.albums.find(album => Number(pick(album, 'albumId', 'ALBUM_ID')) === currentAlbumId) : null;
            if (currentAlbum) {
                state.albumModal.setSelected(currentAlbumId);
                setAlbumSelection(currentAlbumId, pick(currentAlbum, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범', state.albums.length);
            } else {
                state.albumModal.setSelected(null);
                setAlbumSelection('', '앨범 없이 등록', state.albums.length);
            }
            return albums;
        }
        const albums = await request(`/api/photo-albums?scopeType=${encodeURIComponent(activeScopeType)}&scopeId=${encodeURIComponent(activeScopeId)}`);
        state.albums = albums || [];
        setAlbumSelection(selectedAlbumId || '', '앨범 없이 등록', state.albums.length);
        return state.albums;
    }

    async function loadPost() {
        if (mode !== 'edit' || !postId) return;
        const data = await request(`/api/photo-posts/${postId}`);
        state.post = data.post || {};
        state.photos = data.photos || [];
        el.description.value = pick(state.post, 'description', 'DESCRIPTION') || pick(state.post, 'title', 'TITLE') || '';
        updateCount();
        const albumId = pick(state.post, 'albumId', 'ALBUM_ID');
        if (albumId) {
            const currentAlbum = state.albums.find(album => Number(pick(album, 'albumId', 'ALBUM_ID')) === Number(albumId));
            const name = currentAlbum ? (pick(currentAlbum, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범') : '선택된 앨범';
            if (state.albumModal) state.albumModal.setSelected(albumId);
            setAlbumSelection(albumId, name, state.albums.length);
        }
        await loadExistingPhotosIntoEditor();
    }

    function fileNameFromPath(path, index) {
        const value = String(path || '').split('?')[0].split('#')[0];
        const name = value.substring(value.lastIndexOf('/') + 1) || `photo_${index + 1}.jpg`;
        return name.includes('.') ? name : `${name}.jpg`;
    }

    async function imageUrlToFile(path, index, originalName) {
        const url = resolvePath(path);
        if (!url) return null;
        const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw new Error('기존 사진을 불러오지 못했습니다.');
        const blob = await response.blob();
        const type = blob.type || 'image/jpeg';
        const name = originalName || fileNameFromPath(path, index);
        return new File([blob], name, { type, lastModified: Date.now() - (state.photos.length - index) });
    }

    async function loadExistingPhotosIntoEditor() {
        const photos = Array.isArray(state.photos) ? state.photos : [];
        state.files = [];
        state.edits = [];
        state.activeIndex = 0;
        if (!photos.length) {
            renderSelectedFiles();
            toast('기존 사진이 없어 새 사진을 추가해주세요.', true);
            return;
        }
        try {
            const files = await Promise.all(photos.slice(0, MAX_PHOTO_COUNT).map((photo, index) => imageUrlToFile(
                pick(photo, 'filePath', 'FILE_PATH'),
                index,
                pick(photo, 'originalName', 'ORIGINAL_NAME') || ''
            )));
            files.filter(Boolean).forEach(file => {
                state.files.push(file);
                state.edits.push(defaultEdit());
            });
            renderSelectedFiles();
        } catch (error) {
            toast(error.message || '기존 사진을 편집기로 불러오지 못했습니다. 새 사진을 추가해주세요.', true);
            state.files = [];
            state.edits = [];
            renderSelectedFiles();
        }
    }

    function updateCount() {
        if (el.descriptionCount) el.descriptionCount.textContent = String((el.description.value || '').length);
    }

    function fileKey(file) {
        return [file.name, file.size, file.lastModified].join(':');
    }

    function defaultEdit() {
        return { rotation: 0, crop: 'original', scale: 1, offsetX: 0, offsetY: 0, filter: 'none' };
    }

    function normalRotation(value) {
        const normalized = value % 360;
        return normalized < 0 ? normalized + 360 : normalized;
    }

    function addFiles(files) {
        const images = Array.from(files || []).filter(file => file.type && file.type.startsWith('image/'));
        if (!images.length) return toast('이미지 파일만 올릴 수 있습니다.', true);
        if (state.files.length >= MAX_PHOTO_COUNT) {
            toast(`사진은 최대 ${MAX_PHOTO_COUNT}장까지 등록할 수 있습니다.`, true);
            return;
        }
        const existing = new Set(state.files.map(fileKey));
        const accepted = [];
        let skipped = 0;
        images.forEach(file => {
            const key = fileKey(file);
            if (existing.has(key)) return;
            if (state.files.length + accepted.length >= MAX_PHOTO_COUNT) {
                skipped += 1;
                return;
            }
            accepted.push(file);
            existing.add(key);
        });
        accepted.forEach(file => {
            state.files.push(file);
            state.edits.push(defaultEdit());
        });
        if (skipped > 0 || images.length > accepted.length) {
            toast(`사진은 최대 ${MAX_PHOTO_COUNT}장까지 등록할 수 있어요.`, skipped > 0 || state.files.length >= MAX_PHOTO_COUNT);
        }
        if (!accepted.length) return;
        if (state.activeIndex >= state.files.length) state.activeIndex = Math.max(0, state.files.length - 1);
        renderSelectedFiles();
    }

    function clearPreviewUrls() {
        state.previewUrls.forEach(url => URL.revokeObjectURL(url));
        state.previewUrls = [];
    }

    function currentEdit(index) {
        if (!state.edits[index]) state.edits[index] = defaultEdit();
        return state.edits[index];
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function updateEditorState() {
        const total = state.files.length;
        const edit = currentEdit(state.activeIndex);
        const zoom = Math.round((edit.scale || 1) * 100);
        const offsetX = Math.round(edit.offsetX || 0);
        const offsetY = Math.round(edit.offsetY || 0);
        if (el.editorCounter) el.editorCounter.textContent = total ? `${state.activeIndex + 1} / ${total}` : '0 / 0';
        if (el.editorZoom) el.editorZoom.value = String(zoom);
        if (el.editorZoomValue) el.editorZoomValue.textContent = `${zoom}%`;
        if (el.editorOffsetX) el.editorOffsetX.value = String(offsetX);
        if (el.editorOffsetXValue) el.editorOffsetXValue.textContent = String(offsetX);
        if (el.editorOffsetY) el.editorOffsetY.value = String(offsetY);
        if (el.editorOffsetYValue) el.editorOffsetYValue.textContent = String(offsetY);
        if (el.editorToolbar) {
            el.editorToolbar.classList.toggle('has-multiple-files', total > 1);
            if (el.editorFooter) el.editorFooter.classList.toggle('has-multiple-files', total > 1);
            if (el.editorUnderbar) el.editorUnderbar.hidden = !total;
            el.editorToolbar.dataset.crop = edit.crop || 'original';
            el.editorToolbar.dataset.filter = edit.filter || 'none';
            el.editorToolbar.querySelectorAll('[data-editor-action^="filter-"]').forEach(button => {
                button.classList.toggle('is-active', button.dataset.editorAction === `filter-${edit.filter || 'none'}`);
            });
        }
    }

    function editorTransform(edit) {
        const scale = edit.scale || 1;
        const offsetX = edit.offsetX || 0;
        const offsetY = edit.offsetY || 0;
        return `translate(${offsetX}%, ${offsetY}%) rotate(${normalRotation(edit.rotation)}deg) scale(${scale})`;
    }

    function editorFilter(filter) {
        switch (String(filter || 'none')) {
            case 'vivid': return 'saturate(1.28) contrast(1.06)';
            case 'warm': return 'sepia(.18) saturate(1.12) hue-rotate(-6deg) brightness(1.03)';
            case 'cool': return 'saturate(1.08) hue-rotate(8deg) brightness(1.02)';
            case 'mono': return 'grayscale(1) contrast(1.03)';
            default: return 'none';
        }
    }


    function activeFrameElements() {
        const item = el.previewGrid ? el.previewGrid.querySelector('.photo-form-preview-item.is-active') : null;
        return {
            item,
            stage: item ? item.querySelector('[data-editor-stage]') : null,
            frame: item ? item.querySelector('[data-editor-frame]') : null,
            img: item ? item.querySelector('img') : null
        };
    }

    function fitEditorFrame() {
        const parts = activeFrameElements();
        if (!parts.stage || !parts.frame || !parts.img) return;
        const edit = currentEdit(state.activeIndex);
        let naturalWidth = parts.img.naturalWidth || 1;
        let naturalHeight = parts.img.naturalHeight || 1;
        const rotation = normalRotation(edit.rotation);
        if (rotation === 90 || rotation === 270) {
            const temp = naturalWidth;
            naturalWidth = naturalHeight;
            naturalHeight = temp;
        }
        const aspect = edit.crop === 'square' ? 1 : Math.max(.2, naturalWidth / Math.max(1, naturalHeight));
        const stageWidth = Math.max(1, parts.stage.clientWidth);
        const stageHeight = Math.max(1, parts.stage.clientHeight);
        const compact = window.matchMedia('(max-width: 900px)').matches;
        const sidePadding = compact ? 28 : 56;
        const maxFrameWidth = Math.max(220, Math.min(stageWidth - sidePadding, compact ? stageWidth - sidePadding : 760));
        const maxFrameHeight = Math.max(220, Math.min(stageHeight - sidePadding, compact ? stageHeight - sidePadding : 460));
        const frameBoxAspect = maxFrameWidth / maxFrameHeight;
        let frameWidth;
        let frameHeight;
        if (frameBoxAspect > aspect) {
            frameHeight = maxFrameHeight;
            frameWidth = frameHeight * aspect;
        } else {
            frameWidth = maxFrameWidth;
            frameHeight = frameWidth / aspect;
        }
        const roundedFrameWidth = Math.round(frameWidth);
        const roundedFrameHeight = Math.round(frameHeight);
        parts.frame.style.width = `${roundedFrameWidth}px`;
        parts.frame.style.height = `${roundedFrameHeight}px`;
        parts.frame.style.setProperty('--photo-frame-aspect', String(aspect));
        const frameLeft = Math.round((stageWidth - roundedFrameWidth) / 2);
        const frameTop = Math.round((stageHeight - roundedFrameHeight) / 2);
        const arrowSize = 38;
        const arrowGap = 18;
        const arrowCenterY = Math.max(arrowSize / 2 + 8, Math.min(stageHeight - arrowSize / 2 - 8, Math.round(frameTop + roundedFrameHeight / 2)));
        const prevCenterX = Math.max(arrowSize / 2 + 8, Math.round(frameLeft - arrowGap));
        const nextCenterX = Math.min(stageWidth - arrowSize / 2 - 8, Math.round(frameLeft + roundedFrameWidth + arrowGap));
        const removeLeft = Math.min(stageWidth - 14, Math.max(14, Math.round(frameLeft + roundedFrameWidth)));
        const removeTop = Math.min(stageHeight - 14, Math.max(14, Math.round(frameTop)));
        const cssVars = {
            '--photo-arrow-top': `${arrowCenterY}px`,
            '--photo-arrow-prev-left': `${prevCenterX}px`,
            '--photo-arrow-next-left': `${nextCenterX}px`,
            '--photo-remove-left': `${removeLeft}px`,
            '--photo-remove-top': `${removeTop}px`
        };
        [parts.stage, parts.item].filter(Boolean).forEach(node => {
            Object.entries(cssVars).forEach(([key, value]) => node.style.setProperty(key, value));
        });
        const preview = document.getElementById('photoFormPreview');
        if (preview) preview.style.setProperty('--photo-editor-footer-width', `${Math.max(240, Math.min(stageWidth, roundedFrameWidth + 96))}px`);
    }

    function updateActivePreviewTransform() {
        const edit = currentEdit(state.activeIndex);
        const img = el.previewGrid ? el.previewGrid.querySelector('.photo-form-preview-item img') : null;
        const caption = el.previewGrid ? el.previewGrid.querySelector('.photo-form-preview-item figcaption') : null;
        if (img) {
            img.style.transform = editorTransform(edit);
            img.style.filter = editorFilter(edit.filter);
        }
        if (caption) caption.textContent = `${edit.crop === 'square' ? '정사각형' : '원본 비율'} · ${normalRotation(edit.rotation)}° · ${Math.round((edit.scale || 1) * 100)}%`;
        fitEditorFrame();
        updateEditorState();
    }

    function renderEditorThumbs() {
        if (!el.editorThumbs) return;
        if (!state.files.length) {
            el.editorThumbs.innerHTML = '';
            return;
        }
        const total = state.files.length;
        const hasMultiple = total > 1;
        const urls = state.files.map(file => URL.createObjectURL(file));
        const html = state.files.map((file, index) => {
            const active = index === state.activeIndex ? ' is-active' : '';
            const cover = hasMultiple && index === 0;
            return `<button type="button" class="photo-editor-thumb${active}${cover ? ' is-cover' : ''}" data-thumb-index="${index}" draggable="${hasMultiple ? 'true' : 'false'}" aria-label="${index + 1}번째 사진${cover ? ' 대표사진' : ''}">
                <span class="photo-editor-thumb-order">${index + 1}</span>
                <img src="${esc(urls[index])}" alt="${esc(file.name)}">
                ${cover ? '<span class="photo-editor-thumb-cover">대표</span>' : ''}
                <span class="photo-editor-thumb-remove" data-remove-file="${index}" role="button" tabindex="0" aria-label="${index + 1}번째 사진 삭제"><i class="fa-solid fa-xmark" aria-hidden="true"></i></span>
            </button>`;
        }).join('');
        el.editorThumbs.innerHTML = html;
        requestAnimationFrame(() => urls.forEach(url => URL.revokeObjectURL(url)));
    }

    function renderSelectedFiles() {
        clearPreviewUrls();
        const preview = document.getElementById('photoFormPreview');
        const hasFiles = state.files.length > 0;
        if (preview) {
            preview.classList.toggle('has-files', hasFiles);
            preview.classList.toggle('is-single-file', state.files.length === 1);
            preview.classList.toggle('has-multiple-files', state.files.length > 1);
        }
        if (el.editorToolbar) el.editorToolbar.hidden = !hasFiles;
        if (el.editorFooter) el.editorFooter.hidden = !hasFiles;
        if (el.editorUnderbar) el.editorUnderbar.hidden = !hasFiles;
        if (!hasFiles) {
            state.activeIndex = 0;
            el.previewGrid.innerHTML = '';
            renderEditorThumbs();
            el.drop.classList.remove('has-files');
            updateEditorState();
            el.files.value = '';
            return;
        }
        state.activeIndex = clamp(state.activeIndex, 0, state.files.length - 1);
        const file = state.files[state.activeIndex];
        const url = URL.createObjectURL(file);
        const edit = currentEdit(state.activeIndex);
        state.previewUrls.push(url);
        const cropLabel = edit.crop === 'square' ? '정사각형' : '원본 비율';
        el.previewGrid.innerHTML = `<figure class="photo-form-preview-item is-active${edit.crop === 'square' ? ' is-square-crop' : ''}" data-preview-index="${state.activeIndex}">
            <div class="photo-form-image-stage" data-editor-stage>
                <div class="photo-crop-frame" data-editor-frame>
                    <button type="button" class="photo-editor-side-arrow photo-editor-side-arrow--prev" data-editor-action="prev" aria-label="이전 사진"><i class="fa-solid fa-chevron-left"></i></button>
                    <span class="photo-editor-drag-hint"><i class="fa-solid fa-hand-pointer"></i> 사진을 드래그해 위치 조절</span>
                    <img src="${esc(url)}" alt="${esc(file.name)}" draggable="false" style="transform:${editorTransform(edit)};filter:${editorFilter(edit.filter)}">
                    <button type="button" class="photo-editor-side-arrow photo-editor-side-arrow--next" data-editor-action="next" aria-label="다음 사진"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <button type="button" class="photo-editor-remove" data-remove-file="${state.activeIndex}" aria-label="삭제"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <figcaption>${cropLabel} · ${normalRotation(edit.rotation)}° · ${Math.round((edit.scale || 1) * 100)}%</figcaption>
        </figure>`;
        const activeImg = el.previewGrid.querySelector('.photo-form-preview-item.is-active img');
        if (activeImg) {
            activeImg.addEventListener('load', fitEditorFrame, { once: true });
            if (activeImg.complete) fitEditorFrame();
        }
        el.drop.classList.toggle('has-files', hasFiles);
        if (el.drop && hasFiles) {
            const strong = el.drop.querySelector('strong');
            const span = el.drop.querySelector('span');
            if (strong) strong.textContent = '사진을 선택하거나 끌어다 놓으세요';
            if (span) span.textContent = 'JPG, PNG, GIF, WEBP · 최대 10장 선택 가능';
        }
        renderEditorThumbs();
        updateEditorState();
        el.files.value = '';
    }

    function setActiveIndex(index) {
        if (!state.files.length) return;
        state.activeIndex = (index + state.files.length) % state.files.length;
        renderSelectedFiles();
    }

    function setEditorAction(action) {
        if (!state.files.length) return;
        if (action === 'prev') return setActiveIndex(state.activeIndex - 1);
        if (action === 'next') return setActiveIndex(state.activeIndex + 1);
        const edit = currentEdit(state.activeIndex);
        if (action === 'rotate-left') edit.rotation = normalRotation(edit.rotation - 90);
        if (action === 'rotate-right') edit.rotation = normalRotation(edit.rotation + 90);
        if (action === 'square') edit.crop = 'square';
        if (action === 'original') edit.crop = 'original';
        if (action === 'zoom-out') edit.scale = clamp((edit.scale || 1) - 0.1, 1, 2.2);
        if (action === 'zoom-in') edit.scale = clamp((edit.scale || 1) + 0.1, 1, 2.2);
        if (action && action.startsWith('filter-')) edit.filter = action.replace('filter-', '') || 'none';
        if (action === 'reset') state.edits[state.activeIndex] = defaultEdit();
        renderSelectedFiles();
    }

    function loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('사진 편집 처리에 실패했습니다.'));
            };
            image.src = url;
        });
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise(resolve => canvas.toBlob(resolve, type, quality));
    }

    function drawRotatedImage(image, rotation) {
        const angle = normalRotation(rotation);
        const rad = angle * Math.PI / 180;
        const swap = angle === 90 || angle === 270;
        const canvas = document.createElement('canvas');
        canvas.width = swap ? image.naturalHeight : image.naturalWidth;
        canvas.height = swap ? image.naturalWidth : image.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
        return canvas;
    }

    function cropEditedCanvas(source, edit) {
        const scale = clamp(edit.scale || 1, 1, 2.2);
        const targetAspect = edit.crop === 'square' ? 1 : source.width / source.height;
        const maxOutput = 1600;
        const canvas = document.createElement('canvas');

        if (targetAspect >= 1) {
            canvas.width = Math.min(maxOutput, Math.max(1, Math.round(source.width)));
            canvas.height = Math.max(1, Math.round(canvas.width / targetAspect));
        } else {
            canvas.height = Math.min(maxOutput, Math.max(1, Math.round(source.height)));
            canvas.width = Math.max(1, Math.round(canvas.height * targetAspect));
        }

        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = editorFilter(edit.filter);

        const fitScale = Math.min(canvas.width / source.width, canvas.height / source.height) * scale;
        const drawWidth = source.width * fitScale;
        const drawHeight = source.height * fitScale;
        const offsetX = clamp(edit.offsetX || 0, -50, 50) / 100 * drawWidth;
        const offsetY = clamp(edit.offsetY || 0, -50, 50) / 100 * drawHeight;
        const dx = (canvas.width - drawWidth) / 2 + offsetX;
        const dy = (canvas.height - drawHeight) / 2 + offsetY;

        ctx.drawImage(source, dx, dy, drawWidth, drawHeight);
        ctx.restore();
        return canvas;
    }

    async function buildUploadFile(file, edit) {
        const safeEdit = edit || defaultEdit();
        const changed = normalRotation(safeEdit.rotation) !== 0 || safeEdit.crop === 'square' || (safeEdit.scale || 1) !== 1 || (safeEdit.offsetX || 0) !== 0 || (safeEdit.offsetY || 0) !== 0 || (safeEdit.filter || 'none') !== 'none';
        if (!changed) return file;
        if (/image\/gif/i.test(file.type)) {
            toast('GIF는 애니메이션 보존을 위해 원본으로 등록합니다.', true);
            return file;
        }
        const image = await loadImageFromFile(file);
        const rotatedCanvas = drawRotatedImage(image, safeEdit.rotation);
        const canvas = cropEditedCanvas(rotatedCanvas, safeEdit);
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(canvas, type, .92);
        if (!blob) return file;
        const ext = type === 'image/png' ? '.png' : '.jpg';
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
        return new File([blob], `${baseName}_edited${ext}`, { type, lastModified: Date.now() });
    }

    function appendShareFields(fd) {
        if (!fd || !el.shareHiddenFields) return;
        const types = Array.from(el.shareHiddenFields.querySelectorAll('input[name="shareTargetType"]')).map(input => input.value);
        const ids = Array.from(el.shareHiddenFields.querySelectorAll('input[name="shareTargetId"]')).map(input => input.value);
        const permissions = Array.from(el.shareHiddenFields.querySelectorAll('input[name="sharePermissionType"]')).map(input => input.value || 'VIEW');
        types.forEach((type, index) => {
            if (!type || !ids[index]) return;
            if (state.targetMode === 'FRIEND' && String(type).toUpperCase() !== 'FRIEND') return;
            fd.append('shareTargetType', type);
            fd.append('shareTargetId', ids[index]);
            fd.append('sharePermissionType', permissions[index] || 'VIEW');
        });
    }

    function initPhotoShareModal() {
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') return;
        if (!document.getElementById('photoPostShareModal')) return;
        window.MoyoShareModal.init({
            contentType: 'PHOTO',
            contentId: postId,
            persist: mode === 'edit' && !!postId,
            reloadOnPersist: false,
            bodyOpenClass: 'note-share-modal-open',
            currentUserId: document.getElementById('photoPostShareModal')?.dataset.currentUserId || document.body?.dataset.userId || '',
            ids: {
                openButton: 'openPhotoPostShareModal',
                permissionButton: 'openPhotoPostPermissionModal',
                modal: 'photoPostShareModal',
                keyword: 'photoPostShareKeyword',
                applyButton: 'applyPhotoPostShareModal',
                title: 'photoPostShareModalTitle',
                context: 'photoPostShareContext',
                candidates: 'photoPostShareCandidates',
                selected: 'photoPostShareSelected',
                hiddenFields: 'photoPostShareHiddenFields',
                count: 'photoPostShareCount',
                permissionCount: 'photoPostPermissionCount',
                modalCount: 'photoPostShareModalCount',
                initialSharesSource: 'photoPostShareInitialSource',
                workspaceMemberSource: 'photoPostWorkspaceMemberSource',
                projectMemberSource: 'photoPostProjectMemberSource',
                workspaceTargetSource: 'photoPostWorkspaceTargetSource',
                projectTargetSource: 'photoPostProjectTargetSource'
            }
        });
    }

    async function submit() {
        if (el.submit.disabled) return;
        el.submit.disabled = true;
        try {
            if (mode === 'edit') {
                if (!state.files.length) {
                    toast('사진을 한 장 이상 남겨주세요.', true);
                    return;
                }
                const fd = new FormData();
                fd.append('title', '');
                fd.append('description', el.description.value.trim());
                if (el.album.value) fd.append('albumId', el.album.value);
                const uploadFiles = await Promise.all(state.files.map((file, index) => buildUploadFile(file, currentEdit(index))));
                uploadFiles.forEach(file => fd.append('files', file));
                await request(`/api/photo-posts/${postId}/edit`, { method: 'POST', body: fd });
                toast('사진을 수정했습니다.');
                setTimeout(goBack, 350);
                return;
            }
            if (!state.files.length) {
                toast('등록할 사진을 선택해주세요.', true);
                return;
            }
            if (!validateTargetBeforeSubmit()) return;
            const fd = new FormData();
            fd.append('scopeType', activeScopeType);
            fd.append('scopeId', activeScopeId);
            fd.append('title', '');
            fd.append('description', el.description.value.trim());
            const visibilityValue = (activeScopeType === 'PERSONAL' && el.moyoPublic && el.moyoPublic.checked) ? 'FRIENDS' : (el.visibility && el.visibility.value ? el.visibility.value : 'PRIVATE');
            if (visibilityValue) fd.append('visibilityType', visibilityValue);
            if (el.album.value) fd.append('albumId', el.album.value);
            appendShareFields(fd);
            const uploadFiles = await Promise.all(state.files.map((file, index) => buildUploadFile(file, currentEdit(index))));
            uploadFiles.forEach(file => fd.append('files', file));
            await request('/api/photo-posts', { method: 'POST', body: fd });
            toast('사진을 등록했습니다.');
            setTimeout(goBack, 350);
        } catch (e) {
            toast(e.message, true);
        } finally {
            el.submit.disabled = false;
        }
    }

    if (el.targetButtons) el.targetButtons.forEach(button => button.addEventListener('click', () => setTargetMode(button.dataset.photoTarget, true)));
    if (el.workspaceTargetSelect) el.workspaceTargetSelect.addEventListener('change', () => syncTargetScope(true));
    if (el.projectWorkspaceTargetSelect) el.projectWorkspaceTargetSelect.addEventListener('change', () => { renderProjectOptions(); syncTargetScope(true); });
    if (el.projectTargetSelect) el.projectTargetSelect.addEventListener('change', () => syncTargetScope(true));

    el.description.addEventListener('input', updateCount);
    el.submit.addEventListener('click', submit);
    el.drop.addEventListener('click', () => el.files.click());
    el.files.addEventListener('change', e => addFiles(e.target.files));
    ['dragenter', 'dragover'].forEach(type => el.drop.addEventListener(type, e => {
        e.preventDefault();
        el.drop.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach(type => el.drop.addEventListener(type, e => {
        e.preventDefault();
        el.drop.classList.remove('is-dragover');
        if (type === 'drop') addFiles(e.dataTransfer.files);
    }));
    el.previewGrid.addEventListener('click', e => {
        const actionButton = e.target.closest('[data-editor-action]');
        if (actionButton) {
            e.preventDefault();
            e.stopPropagation();
            setEditorAction(actionButton.dataset.editorAction);
            return;
        }
        const removeButton = e.target.closest('[data-remove-file]');
        if (removeButton) {
            const index = Number(removeButton.dataset.removeFile);
            state.files.splice(index, 1);
            state.edits.splice(index, 1);
            state.activeIndex = Math.min(state.activeIndex, Math.max(0, state.files.length - 1));
            renderSelectedFiles();
            return;
        }
        const item = e.target.closest('[data-preview-index]');
        if (!item) return;
        state.activeIndex = Number(item.dataset.previewIndex) || 0;
        renderSelectedFiles();
    });
    if (el.editorToolbar) {
        el.editorToolbar.addEventListener('click', e => {
            const button = e.target.closest('[data-editor-action]');
            if (!button) return;
            setEditorAction(button.dataset.editorAction);
        });
    }
    if (el.editorFooter) {
        el.editorFooter.addEventListener('click', e => {
            const actionButton = e.target.closest('[data-editor-action]');
            if (actionButton) {
                setEditorAction(actionButton.dataset.editorAction);
                return;
            }
            const removeButton = e.target.closest('[data-remove-file]');
            if (removeButton) {
                e.preventDefault();
                e.stopPropagation();
                const index = Number(removeButton.dataset.removeFile);
                state.files.splice(index, 1);
                state.edits.splice(index, 1);
                state.activeIndex = Math.min(state.activeIndex, Math.max(0, state.files.length - 1));
                renderSelectedFiles();
                return;
            }
            const thumb = e.target.closest('[data-thumb-index]');
            if (!thumb) return;
            setActiveIndex(Number(thumb.dataset.thumbIndex) || 0);
        });
        el.editorFooter.addEventListener('keydown', e => {
            const removeButton = e.target.closest('[data-remove-file]');
            if (!removeButton || (e.key !== 'Enter' && e.key !== ' ')) return;
            e.preventDefault();
            removeButton.click();
        });
    }
    if (el.editorThumbs) {
        let dragFromIndex = null;
        el.editorThumbs.addEventListener('dragstart', e => {
            const thumb = e.target.closest('[data-thumb-index]');
            if (!thumb) return;
            dragFromIndex = Number(thumb.dataset.thumbIndex) || 0;
            thumb.classList.add('is-dragging');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(dragFromIndex));
            }
        });
        el.editorThumbs.addEventListener('dragover', e => {
            const thumb = e.target.closest('[data-thumb-index]');
            if (!thumb) return;
            e.preventDefault();
            el.editorThumbs.querySelectorAll('.is-drag-over').forEach(node => node.classList.remove('is-drag-over'));
            thumb.classList.add('is-drag-over');
        });
        el.editorThumbs.addEventListener('drop', e => {
            const thumb = e.target.closest('[data-thumb-index]');
            if (!thumb) return;
            e.preventDefault();
            const from = dragFromIndex == null && e.dataTransfer ? Number(e.dataTransfer.getData('text/plain')) : dragFromIndex;
            const to = Number(thumb.dataset.thumbIndex) || 0;
            el.editorThumbs.querySelectorAll('.is-drag-over,.is-dragging').forEach(node => node.classList.remove('is-drag-over','is-dragging'));
            dragFromIndex = null;
            if (!Number.isFinite(from) || from === to || from < 0 || from >= state.files.length) return;
            const [file] = state.files.splice(from, 1);
            const [edit] = state.edits.splice(from, 1);
            state.files.splice(to, 0, file);
            state.edits.splice(to, 0, edit);
            state.activeIndex = to;
            renderSelectedFiles();
        });
        el.editorThumbs.addEventListener('dragend', () => {
            dragFromIndex = null;
            el.editorThumbs.querySelectorAll('.is-drag-over,.is-dragging').forEach(node => node.classList.remove('is-drag-over','is-dragging'));
        });
    }
    if (el.editorZoom) {
        el.editorZoom.addEventListener('input', e => {
            if (!state.files.length) return;
            const edit = currentEdit(state.activeIndex);
            edit.scale = clamp(Number(e.target.value || 100) / 100, 1, 2.2);
            updateActivePreviewTransform();
        });
    }
    if (el.editorOffsetX) {
        el.editorOffsetX.addEventListener('input', e => {
            if (!state.files.length) return;
            const edit = currentEdit(state.activeIndex);
            edit.offsetX = clamp(Number(e.target.value || 0), -50, 50);
            updateActivePreviewTransform();
        });
    }
    if (el.editorOffsetY) {
        el.editorOffsetY.addEventListener('input', e => {
            if (!state.files.length) return;
            const edit = currentEdit(state.activeIndex);
            edit.offsetY = clamp(Number(e.target.value || 0), -50, 50);
            updateActivePreviewTransform();
        });
    }

    let dragState = null;
    el.previewGrid.addEventListener('pointerdown', e => {
        if (e.target.closest('button,[data-remove-file],[data-editor-action]')) return;
        const stage = e.target.closest('[data-editor-stage]');
        if (!stage || !state.files.length) return;
        const edit = currentEdit(state.activeIndex);
        dragState = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: edit.offsetX || 0,
            offsetY: edit.offsetY || 0,
            width: Math.max(1, stage.clientWidth),
            height: Math.max(1, stage.clientHeight)
        };
        stage.setPointerCapture(e.pointerId);
        stage.classList.add('is-dragging');
        e.preventDefault();
    });
    el.previewGrid.addEventListener('pointermove', e => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        const edit = currentEdit(state.activeIndex);
        edit.offsetX = clamp(dragState.offsetX + ((e.clientX - dragState.startX) / dragState.width) * 100, -50, 50);
        edit.offsetY = clamp(dragState.offsetY + ((e.clientY - dragState.startY) / dragState.height) * 100, -50, 50);
        updateActivePreviewTransform();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
        el.previewGrid.addEventListener(type, e => {
            if (!dragState || e.pointerId !== dragState.pointerId) return;
            const stage = e.target.closest('[data-editor-stage]') || el.previewGrid.querySelector('[data-editor-stage]');
            if (stage) stage.classList.remove('is-dragging');
            dragState = null;
            renderSelectedFiles();
        });
    });

    window.addEventListener('resize', () => {
        clearTimeout(fitEditorFrame.timer);
        fitEditorFrame.timer = setTimeout(fitEditorFrame, 80);
    });

    renderTargetOptions();
    setTargetMode(entryTarget, false);
    initAlbumModal();
    initPhotoShareModal();
    loadAlbums().then(loadPost).then(fillVisibility).catch(e => toast(e.message, true));
    updateCount();
})();
