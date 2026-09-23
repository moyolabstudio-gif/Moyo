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
        targetButtons: Array.from(document.querySelectorAll('[data-photo-target]')),
        workspaceTargetSelect: $('photoWorkspaceTargetSelect'),
        projectWorkspaceTargetSelect: $('photoProjectWorkspaceTargetSelect'),
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
        albumPath: $('photoFormAlbumPath'),
        openAlbumModal: $('openPhotoAlbumModal'),
        togetherButton: $('openPhotoTogetherPeople'),
        togetherTitle: $('photoFormTogetherTitle'),
        togetherGuide: $('photoTogetherGuide'),
        togetherSummary: $('photoTogetherSummary'),
        togetherViewAll: $('photoTogetherViewAll'),
        togetherAction: $('photoTogetherAction'),
        togetherExpandedList: $('photoTogetherExpandedList'),
        togetherAvatarStack: $('photoTogetherAvatarStack'),
        togetherIcon: $('photoFormTogetherIcon'),
        submit: $('photoFormSubmit'),
        toast: $('photoToast')
    };

    const state = { files: [], edits: [], activeIndex: 0, previewUrls: [], post: null, photos: [], albums: [], targetMode: 'PERSONAL', workspaces: [], projects: [], togetherPeople: [], togetherExpanded: false };

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


    function getActiveWorkspace() {
        const id = String(activeScopeId || initialScopeId || '');
        const selected = el.workspaceTargetSelect && el.workspaceTargetSelect.selectedOptions && el.workspaceTargetSelect.selectedOptions[0]
            ? { id: el.workspaceTargetSelect.value || '', name: el.workspaceTargetSelect.selectedOptions[0].textContent.trim() }
            : null;
        return state.workspaces.find(item => String(item.id) === id)
            || (selected && selected.id ? selected : null)
            || null;
    }

    function getActiveProject() {
        const id = String(activeScopeId || initialScopeId || '');
        const selected = el.projectTargetSelect && el.projectTargetSelect.selectedOptions && el.projectTargetSelect.selectedOptions[0]
            ? { id: el.projectTargetSelect.value || '', name: el.projectTargetSelect.selectedOptions[0].textContent.trim(), wsName: '' }
            : null;
        const project = state.projects.find(item => String(item.id) === id) || (selected && selected.id ? selected : null);
        if (!project) return null;
        if (!project.wsName && el.projectWorkspaceTargetSelect && el.projectWorkspaceTargetSelect.selectedOptions && el.projectWorkspaceTargetSelect.selectedOptions[0]) {
            project.wsName = el.projectWorkspaceTargetSelect.selectedOptions[0].textContent.trim();
        }
        return project;
    }

    function activeScopeDisplayName() {
        const scope = String(activeScopeType || state.targetMode || initialScopeType || '').toUpperCase();
        if (scope === 'WORKSPACE' || scope === 'GROUP' || scope === 'WS') {
            const workspace = getActiveWorkspace();
            return workspace && workspace.name ? `${workspace.name} 그룹` : '선택한 그룹';
        }
        if (scope === 'PROJECT' || scope === 'PROJ') {
            const project = getActiveProject();
            if (project && project.name) {
                return project.wsName ? `${project.wsName} · ${project.name} 프로젝트` : `${project.name} 프로젝트`;
            }
            return '선택한 프로젝트';
        }
        return '개인 공간';
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
        if (el.albumLabel) {
            el.albumLabel.textContent = '앨범 없이 등록';
            el.albumLabel.hidden = true;
        }
        if (el.albumCount) el.albumCount.hidden = true;
        renderAlbumPath('');
        if (el.albumCount) {
            el.albumCount.textContent = '0';
            el.albumCount.classList.add('is-empty');
        }
        state.togetherPeople = [];
        renderTogetherField();
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
        if (resetAlbum) resetAlbumForTarget();
    }


    function updateFormCopy() {
        const action = mode === 'edit' ? '수정' : '등록';
        const scopeName = activeScopeDisplayName();
        const copy = {
            PERSONAL: ['개인 사진', mode === 'edit' ? '사진을 확인하고 편집하면서 사진 내용과 함께한 사람, 사진 위치를 정리합니다.' : '큰 화면에서 사진을 확인하면서 사진 내용과 함께한 사람, 사진 위치를 정리합니다.'],
            FRIEND: ['개인 사진', '친구 탭에서 시작한 사진도 개인 사진으로 등록합니다.'],
            WORKSPACE: ['그룹 사진', `${scopeName} 공간에 사진을 ${action}합니다.`],
            PROJECT: ['프로젝트 사진', `${scopeName} 공간에 사진을 ${action}합니다.`]
        }[state.targetMode] || ['개인 사진', mode === 'edit' ? '사진을 확인하고 편집하면서 사진 내용과 함께한 사람, 사진 위치를 정리합니다.' : '큰 화면에서 사진을 확인하면서 사진 내용과 함께한 사람, 사진 위치를 정리합니다.'];
        if (el.formTitle) el.formTitle.textContent = `${copy[0]} ${action}`;
        if (el.formHeroDescription) el.formHeroDescription.textContent = copy[1];
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

    function setVisibilityTitle(title) {
        if (!el.visibilityLabel) return;
        el.visibilityLabel.textContent = title || '공개 상태';
    }

    function fillVisibility() {
        if (!el.visibility) return;
        if (el.visibilityField) {
            el.visibilityField.hidden = false;
            el.visibilityField.classList.remove('is-scope-fixed');
            delete el.visibilityField.dataset.fixedScope;
        }
        if (state.targetMode === 'FRIEND') {
            if (el.visibilityField) el.visibilityField.hidden = true;
            if (el.moyoPublic) el.moyoPublic.checked = false;
            return;
        }
        if (mode === 'edit') {
            const label = pick(state.post, 'visibilityType', 'VISIBILITY_TYPE') || (activeScopeType === 'WORKSPACE' ? 'WORKSPACE' : activeScopeType === 'PROJECT' ? 'PROJECT' : 'PRIVATE');
            if (activeScopeType === 'PERSONAL') {
                setVisibilityTitle('공개 상태', '');
                el.visibility.innerHTML = '<option value="PRIVATE">나만 보기</option>';
                el.visibility.hidden = true;
                el.visibility.disabled = false;
                if (el.moyoBox) el.moyoBox.hidden = false;
                if (el.moyoPublic) el.moyoPublic.checked = String(label).toUpperCase() === 'FRIENDS';
                if (el.visibilityGuide) el.visibilityGuide.textContent = '체크하면 친구들의 MOYO 피드에도 함께 표시됩니다.';
                return;
            }
            el.visibility.innerHTML = `<option value="${esc(String(label).toUpperCase())}">${esc(visibilityText(label))}</option>`;
            el.visibility.hidden = true;
            el.visibility.disabled = false;
            if (el.visibilityField) {
                el.visibilityField.hidden = true;
                el.visibilityField.classList.add('is-scope-fixed');
                el.visibilityField.dataset.fixedScope = 'true';
            }
            if (el.moyoBox) el.moyoBox.hidden = true;
            if (el.visibilityGuide) el.visibilityGuide.textContent = `${activeScopeDisplayName()} 구성원이 함께 볼 수 있습니다.`;
            return;
        }
        if (activeScopeType === 'WORKSPACE') {
            setVisibilityTitle('등록 범위', '그룹');
            el.visibility.innerHTML = '<option value="WORKSPACE">그룹 공개</option>';
            el.visibility.value = 'WORKSPACE';
            el.visibility.hidden = true;
            el.visibility.disabled = false;
            if (el.visibilityField) {
                el.visibilityField.hidden = true;
                el.visibilityField.classList.add('is-scope-fixed');
                el.visibilityField.dataset.fixedScope = 'true';
            }
            if (el.moyoBox) el.moyoBox.hidden = true;
            if (el.visibilityGuide) el.visibilityGuide.textContent = `${activeScopeDisplayName()} 구성원이 함께 볼 수 있습니다.`;
            return;
        }
        if (activeScopeType === 'PROJECT') {
            setVisibilityTitle('등록 범위', '프로젝트');
            el.visibility.innerHTML = '<option value="PROJECT">프로젝트 공개</option>';
            el.visibility.value = 'PROJECT';
            el.visibility.hidden = true;
            el.visibility.disabled = false;
            if (el.visibilityField) {
                el.visibilityField.hidden = true;
                el.visibilityField.classList.add('is-scope-fixed');
                el.visibilityField.dataset.fixedScope = 'true';
            }
            if (el.moyoBox) el.moyoBox.hidden = true;
            if (el.visibilityGuide) el.visibilityGuide.textContent = `${activeScopeDisplayName()} 팀원이 함께 볼 수 있습니다.`;
            return;
        }
        setVisibilityTitle('공개 상태', '');
        el.visibility.innerHTML = '<option value="PRIVATE">나만 보기</option>';
        el.visibility.hidden = true;
        el.visibility.disabled = false;
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

    function ensureAlbumSelectOptions() {
        if (!el.album) return;
        const selectedValue = String(el.album.value || '');
        el.album.innerHTML = '';

        const root = document.createElement('option');
        root.value = '';
        root.textContent = '내 사진';
        root.dataset.depth = '0';
        root.dataset.root = 'true';
        el.album.appendChild(root);

        (state.albums || []).forEach(album => {
            const id = String(pick(album, 'albumId', 'ALBUM_ID') || '');
            if (!id) return;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = String(pick(album, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범');
            option.dataset.depth = String(Number(pick(album, 'depth', 'DEPTH') || 0));
            const parentId = pick(album, 'parentAlbumId', 'PARENT_ALBUM_ID');
            option.dataset.parentId = parentId == null ? '' : String(parentId);
            el.album.appendChild(option);
        });

        const preferredValue = selectedValue || String(selectedAlbumId || '');
        el.album.value = Array.from(el.album.options).some(option => option.value === preferredValue)
            ? preferredValue
            : '';
    }

    function albumModalAdapter() {
        return {
            create: async (context, payload) => {
                const albumName = String(payload.folderName || '').trim();
                const result = await request('/api/photo-albums', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({
                        scopeType: activeScopeType,
                        scopeId: activeScopeId,
                        albumName,
                        albumDescription: ''
                    })
                });
                await loadAlbums();
                return {
                    folderId: String(pick(result, 'albumId', 'ALBUM_ID') || ''),
                    folderName: albumName,
                    depth: 0
                };
            },
            rename: async (context, payload) => {
                const id = Number(payload.folderId || 0);
                if (!id) return;
                const album = (state.albums || []).find(item => Number(pick(item, 'albumId', 'ALBUM_ID')) === id);
                await request(`/api/photo-albums/${id}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({
                        albumName: String(payload.folderName || '').trim(),
                        albumDescription: pick(album, 'albumDescription', 'ALBUM_DESCRIPTION') || ''
                    })
                });
                await loadAlbums();
            },
            remove: async (context, payload) => {
                const id = Number(payload.folderId || 0);
                if (!id) return;
                await request(`/api/photo-albums/${id}`, { method: 'DELETE' });
                if (String(el.album?.value || '') === String(id)) {
                    setAlbumSelection('', '내 사진', state.albums.length);
                }
                await loadAlbums();
            }
        };
    }

    function openAlbumSelector() {
        if (!window.CommonFolderModal || typeof window.CommonFolderModal.openSelect !== 'function') {
            toast('공통 선택 모달을 불러오지 못했습니다.', true);
            return;
        }
        if (!el.album || el.album.tagName !== 'SELECT') {
            toast('사진 위치 선택 요소를 초기화하지 못했습니다.', true);
            return;
        }
        ensureAlbumSelectOptions();
        window.CommonFolderModal.openSelect({
            selectElement: el.album,
            trigger: el.openAlbumModal,
            adapter: albumModalAdapter(),
            context: {
                scopeType: activeScopeType,
                scopeId: activeScopeId
            },
            title: '사진 위치 선택',
            description: '사진이 저장될 위치를 선택하세요.',
            confirmLabel: '선택',
            canManage: true,
            showManageActions: true,
            instantSelect: false,
            showCurrent: true,
            showCloseButton: true,
            treeMode: false,
            unclassifiedLabel: '내 사진',
            unclassifiedDescription: '앨범 없이 사진 영역에 보관',
            folderDescription: '이 앨범에 저장',
            rootIcon: 'fa-regular fa-images',
            folderIcon: 'fa-regular fa-folder',
            itemDescription: ({ folderId, isCurrent }) => {
                if (isCurrent) return '현재 사진 위치';
                if (!folderId) return '앨범 없이 사진 영역에 보관';
                return '이 앨범에 저장';
            },
            onConfirm: ({ folderId, folderName }) => {
                setAlbumSelection(folderId || '', folderName || '내 사진', state.albums.length);
            }
        });
    }

    function initAlbumModal() {
        if (!el.openAlbumModal) return;
        el.openAlbumModal.addEventListener('click', openAlbumSelector);
    }


    const FORM_ICONS = {
        user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
        users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    };

    function activeProjectInfo() {
        return state.projects.find(item => String(item.id) === String(activeScopeId)) || null;
    }

    function togetherPolicy() {
        const project = activeScopeType === 'PROJECT' ? activeProjectInfo() : null;
        const isGroupScope = activeScopeType === 'WORKSPACE';
        const isGroupProject = activeScopeType === 'PROJECT' && !!String(project?.wsId || '').trim();
        const useMembers = isGroupScope || isGroupProject;

        return {
            group: useMembers,
            peopleLabel: useMembers ? '멤버' : '친구',
            togetherLabel: useMembers ? '함께 찍은 멤버' : '함께 찍은 친구'
        };
    }

    function togetherAvatarMarkup(person, extraClass) {
        const item = person || {};
        const name = String(item.name || '사용자').trim() || '사용자';
        const profile = resolvePath(item.profile || '');
        const initial = Array.from(name)[0] || '사';
        const extra = extraClass ? ` ${extraClass}` : '';
        return profile
            ? `<span class="photo-together-avatar${extra}"><img src="${esc(profile)}" alt="${esc(name)}"></span>`
            : `<span class="photo-together-avatar is-fallback${extra}" aria-hidden="true">${esc(initial)}</span>`;
    }

    function renderTogetherExpandedList(people) {
        if (!el.togetherExpandedList) return;
        const list = Array.isArray(people) ? people : [];
        if (!list.length || !state.togetherExpanded) {
            el.togetherExpandedList.hidden = true;
            el.togetherExpandedList.innerHTML = '';
            return;
        }

        el.togetherExpandedList.hidden = false;
        el.togetherExpandedList.innerHTML = list.map(person => {
            const name = String(person?.name || '사용자').trim() || '사용자';
            const email = String(person?.email || '').trim();
            return `<div class="photo-together-expanded-item">
                ${togetherAvatarMarkup(person, 'is-list')}
                <span class="photo-together-expanded-copy">
                    <strong>${esc(name)}</strong>
                    ${email ? `<small>${esc(email)}</small>` : ''}
                </span>
            </div>`;
        }).join('');
    }

    function renderTogetherField() {
        const policy = togetherPolicy();
        if (el.togetherTitle) el.togetherTitle.textContent = policy.togetherLabel;
        if (el.togetherGuide) el.togetherGuide.textContent = `사진에 함께 나온 ${policy.peopleLabel}를 선택할 수 있습니다.`;
        if (el.togetherIcon) el.togetherIcon.innerHTML = FORM_ICONS[policy.group ? 'users' : 'user'];

        const people = state.togetherPeople || [];
        const hasPeople = people.length > 0;

        if (people.length < 2) state.togetherExpanded = false;

        if (el.togetherSummary) {
            el.togetherSummary.textContent = hasPeople
                ? `선택한 ${policy.peopleLabel} ${people.length}명`
                : `함께 찍은 ${policy.peopleLabel}를 선택하세요`;
        }

        if (el.togetherViewAll) {
            el.togetherViewAll.hidden = people.length < 2;
            el.togetherViewAll.setAttribute('aria-expanded', state.togetherExpanded ? 'true' : 'false');
            el.togetherViewAll.innerHTML = state.togetherExpanded
                ? '접기 <span aria-hidden="true">⌃</span>'
                : '펼치기 <span aria-hidden="true">⌄</span>';
        }

        if (el.togetherAction) {
            el.togetherAction.textContent = hasPeople ? '변경' : '선택';
        }

        if (el.togetherAvatarStack) {
            const visible = people.slice(0, 3).map((person, index) =>
                `<span class="photo-together-avatar-wrap" style="z-index:${10-index}">${togetherAvatarMarkup(person, '')}</span>`
            );
            if (people.length > 3) {
                visible.push(`<span class="photo-together-avatar photo-together-avatar-more" style="z-index:6">+${people.length - 3}</span>`);
            }
            el.togetherAvatarStack.innerHTML = visible.join('');
            el.togetherAvatarStack.classList.toggle('is-empty', !hasPeople);
        }

        if (el.togetherButton) {
            el.togetherButton.textContent = hasPeople ? '변경' : '선택';
        }

        renderTogetherExpandedList(people);
    }

    function toggleTogetherExpanded(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if ((state.togetherPeople || []).length < 2) return;
        state.togetherExpanded = !state.togetherExpanded;
        renderTogetherField();
    }

    function normalizeTogetherPerson(source) {
        source = source || {};
        const raw = source.raw || source;
        return {
            id: String(source.id || raw.userId || raw.USER_ID || '').trim(),
            name: String(source.name || raw.name || raw.displayName || raw.DISPLAY_NAME || raw.userName || raw.USER_NAME || '사용자').trim(),
            email: String(source.email || raw.email || raw.EMAIL || '').trim(),
            profile: String(source.profile || source.profileImagePath || raw.profileImage || raw.profileImagePath || raw.PROFILE_IMAGE_PATH || '').trim(),
            raw
        };
    }

    function photoMetaOf(photo) {
        let raw = pick(photo, 'editMeta', 'EDIT_META', 'photoEditMeta', 'PHOTO_EDIT_META');
        if (!raw) return {};
        if (typeof raw === 'object') return raw;
        try {
            const parsed = JSON.parse(String(raw));
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function loadTogetherFromPhotos() {
        const first = (state.photos || [])[0];
        const meta = photoMetaOf(first);
        const people = Array.isArray(meta.people) ? meta.people : [];
        state.togetherPeople = people.map(normalizeTogetherPerson).filter(person => person.id);
        renderTogetherField();
    }

    async function loadTogetherCandidates() {
        const policy = togetherPolicy();
        let source = [];
        if (policy.group && activeScopeType === 'PROJECT' && activeScopeId) {
            source = await request(`/project/api/members?projId=${encodeURIComponent(activeScopeId)}`);
        } else if (policy.group && activeScopeType === 'WORKSPACE' && activeScopeId) {
            source = await request(`/workspace/api/members?wsId=${encodeURIComponent(activeScopeId)}`);
        } else {
            if (!window.CommonFriendAdapter || typeof window.CommonFriendAdapter.fetchList !== 'function') {
                throw new Error('친구 목록을 불러오지 못했습니다.');
            }
            source = await window.CommonFriendAdapter.fetchList(contextPath);
        }
        const rows = Array.isArray(source) ? source : (Array.isArray(source?.members) ? source.members : []);
        return rows.map(normalizeTogetherPerson)
            .filter(person => person.id && String(person.id) !== String(currentUserId));
    }

    async function openTogetherSelector() {
        if (!window.CommonPeopleModal || typeof window.CommonPeopleModal.open !== 'function') {
            toast('친구/멤버 선택 모달을 불러오지 못했습니다.', true);
            return;
        }
        try {
            const policy = togetherPolicy();
            const people = await loadTogetherCandidates();
            window.CommonPeopleModal.open({
                title: policy.togetherLabel,
                description: `사진에 함께 나온 ${policy.peopleLabel}를 선택하세요.`,
                mode: 'SELECT_MULTIPLE',
                people,
                selectedIds: state.togetherPeople.map(person => person.id),
                selectedPeople: state.togetherPeople,
                confirmText: '선택 완료',
                searchPlaceholder: `${policy.peopleLabel} 이름 또는 이메일 검색`,
                emptyText: `선택할 ${policy.peopleLabel}가 없습니다.`,
                emptySubText: `${policy.peopleLabel} 목록을 확인해주세요.`,
                onSelect(selected) {
                    state.togetherPeople = (Array.isArray(selected) ? selected : [])
                        .map(normalizeTogetherPerson)
                        .filter(person => person.id);
                    renderTogetherField();
                }
            });
        } catch (e) {
            toast(e.message || '친구/멤버 목록을 불러오지 못했습니다.', true);
        }
    }

    function scopeRootParts() {
        if (activeScopeType === 'WORKSPACE') {
            const ws = state.workspaces.find(item => String(item.id) === String(activeScopeId));
            return ['그룹'].concat(ws?.name ? [ws.name] : []).concat(['사진']);
        }
        if (activeScopeType === 'PROJECT') {
            const project = activeProjectInfo();
            return ['프로젝트'].concat(project?.name ? [project.name] : []).concat(['사진']);
        }
        return ['개인', '내 사진'];
    }

    function albumPathParts(albumId) {
        const parts = [];
        const byId = new Map();
        (state.albums || []).forEach(album => {
            const id = Number(pick(album, 'albumId', 'ALBUM_ID') || 0);
            if (id) byId.set(id, album);
        });
        let cursor = Number(albumId || 0) || null;
        const seen = new Set();
        while (cursor && byId.has(cursor) && !seen.has(cursor)) {
            seen.add(cursor);
            const album = byId.get(cursor);
            parts.push(String(pick(album, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범'));
            cursor = Number(pick(album, 'parentAlbumId', 'PARENT_ALBUM_ID') || 0) || null;
        }
        parts.reverse();
        return scopeRootParts().concat(parts);
    }

    function renderAlbumPath(albumId) {
        if (!el.albumPath) return;
        const parts = albumPathParts(albumId);
        el.albumPath.title = parts.join(' > ');
        el.albumPath.innerHTML = parts.map((part, index) =>
            `${index ? '<span class="photo-location-path-sep" aria-hidden="true">›</span>' : ''}<span class="photo-location-path-part${index === parts.length - 1 ? ' is-current' : ''}">${esc(part)}</span>`
        ).join('');
    }

    async function syncTogetherPeopleMetadata(targetPostId) {
        const id = Number(targetPostId || 0);
        if (!id) return;
        const detail = await request(`/api/photo-posts/${id}`);
        const photos = Array.isArray(detail?.photos) ? detail.photos : [];
        const people = (state.togetherPeople || []).map(person => ({
            id: person.id,
            name: person.name,
            email: person.email || '',
            profile: person.profile || ''
        }));
        await Promise.all(photos.map(photo => {
            const photoId = Number(pick(photo, 'photoId', 'PHOTO_ID') || 0);
            if (!photoId) return Promise.resolve();
            const meta = photoMetaOf(photo);
            const capture = meta && meta.capture && typeof meta.capture === 'object' ? meta.capture : {};
            return request(`/api/photo-posts/${id}/photos/${photoId}/metadata`, {
                method: 'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ capture, people })
            });
        }));
    }

    function setAlbumSelection(albumId, albumName, albumCount) {
        const value = albumId == null || albumId === '' ? '' : String(albumId);
        if (el.album) el.album.value = value;
        if (el.albumLabel) {
            el.albumLabel.textContent = albumName || '앨범 없이 등록';
            el.albumLabel.hidden = true;
        }
        if (el.albumCount) el.albumCount.hidden = true;
        renderAlbumPath(value);
        if (el.albumCount && albumCount != null) {
            el.albumCount.textContent = String(albumCount);
            el.albumCount.classList.toggle('is-empty', Number(albumCount) <= 0);
        }
    }

    async function loadAlbums() {
        if (!activeScopeId) {
            state.albums = [];
            setAlbumSelection('', '내 사진', 0);
            ensureAlbumSelectOptions();
            return state.albums;
        }
        const albums = await request(`/api/photo-albums?scopeType=${encodeURIComponent(activeScopeType)}&scopeId=${encodeURIComponent(activeScopeId)}`);
        state.albums = Array.isArray(albums) ? albums : [];
        ensureAlbumSelectOptions();

        const currentAlbumId = String(el.album?.value || selectedAlbumId || '');
        const currentAlbum = currentAlbumId
            ? state.albums.find(album => String(pick(album, 'albumId', 'ALBUM_ID')) === currentAlbumId)
            : null;

        if (currentAlbum) {
            setAlbumSelection(
                currentAlbumId,
                pick(currentAlbum, 'albumName', 'ALBUM_NAME') || '이름 없는 앨범',
                state.albums.length
            );
        } else {
            setAlbumSelection('', '내 사진', state.albums.length);
        }
        ensureAlbumSelectOptions();
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
            setAlbumSelection(albumId, name, state.albums.length);
        }
        loadTogetherFromPhotos();
        await loadExistingPhotosIntoEditor();
    }

    function fileNameFromPath(path, index) {
        const value = String(path || '').split('?')[0].split('#')[0];
        const name = value.substring(value.lastIndexOf('/') + 1) || `photo_${index + 1}.jpg`;
        return name.includes('.') ? name : `${name}.jpg`;
    }

    function extensionForImageType(type) {
        const normalized = String(type || '').toLowerCase();
        if (normalized === 'image/png') return '.png';
        if (normalized === 'image/gif') return '.gif';
        if (normalized === 'image/webp') return '.webp';
        return '.jpg';
    }

    function fileNameForBlob(path, index, originalName, type) {
        const fallback = originalName || fileNameFromPath(path, index);
        const baseName = String(fallback || `photo_${index + 1}`)
            .replace(/[\\/]/g, '_')
            .replace(/\.[^.]+$/, '') || `photo_${index + 1}`;
        return `${baseName}${extensionForImageType(type)}`;
    }

    async function imageUrlToFile(path, index, originalName) {
        const url = resolvePath(path);
        if (!url) return null;
        const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw new Error('기존 사진을 불러오지 못했습니다.');
        const blob = await response.blob();
        const type = blob.type || 'image/jpeg';
        const name = fileNameForBlob(path, index, originalName, type);
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
            const targets = photos.slice(0, MAX_PHOTO_COUNT);
            const files = await Promise.all(targets.map((photo, index) => imageUrlToFile(
                pick(photo, 'rawFilePath', 'RAW_FILE_PATH') || pick(photo, 'filePath', 'FILE_PATH'),
                index,
                pick(photo, 'originalName', 'ORIGINAL_NAME') || ''
            )));
            files.forEach((file, index) => {
                if (!file) return;
                const photo = targets[index] || {};
                state.files.push(file);
                state.edits.push(normalizeEditMeta(pick(photo, 'editMeta', 'EDIT_META', 'edit_meta', 'photoEditMeta', 'PHOTO_EDIT_META', 'photo_edit_meta'), index));
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
        return { rotation: 0, flipX: 1, crop: 'original', scale: 1, offsetX: 0, offsetY: 0, filter: 'none' };
    }

    function normalizeEditMeta(meta, index) {
        const base = defaultEdit();
        let source = meta;
        if (typeof source === 'string') {
            const trimmed = source.trim();
            try { source = trimmed ? JSON.parse(trimmed) : {}; } catch (e) { source = {}; }
        }
        if (Array.isArray(source)) {
            const safeIndex = Number.isFinite(Number(index)) ? Number(index) : 0;
            source = source[safeIndex] || source[0] || {};
        }
        if (!source || typeof source !== 'object') source = {};

        const rawCrop = source.crop ?? source.cropType ?? source.ratioType ?? source.mode ?? base.crop;
        const cropText = String(rawCrop || '').toLowerCase();
        const crop = (cropText === 'square' || cropText === '1:1' || cropText === 'crop_square') ? 'square' : 'original';

        let scale = source.scale ?? source.zoomScale ?? source.editorScale;
        if (scale == null && source.zoom != null) scale = Number(source.zoom) > 10 ? Number(source.zoom) / 100 : Number(source.zoom);
        if (scale == null && source.zoomPercent != null) scale = Number(source.zoomPercent) / 100;
        if (scale == null && source.scalePercent != null) scale = Number(source.scalePercent) / 100;

        const offsetX = source.offsetX ?? source.positionX ?? source.posX ?? source.x ?? source.translateX ?? 0;
        const offsetY = source.offsetY ?? source.positionY ?? source.posY ?? source.y ?? source.translateY ?? 0;
        const rotation = source.rotation ?? source.rotate ?? source.angle ?? 0;

        const flipX = Number(source.flipX ?? source.flipHorizontal ?? source.mirrorX ?? 1) === -1 ? -1 : 1;

        return {
            rotation: normalRotation(Number(rotation || 0)),
            flipX,
            crop,
            scale: clamp(Number(scale == null ? 1 : scale), 1, 2.2),
            offsetX: clamp(Number(offsetX || 0), -50, 50),
            offsetY: clamp(Number(offsetY || 0), -50, 50),
            filter: String(source.filter || source.filterType || 'none')
        };
    }

    function editMetaForSubmit(index) {
        return JSON.stringify(normalizeEditMeta(currentEdit(index)));
    }

    function encodeEditMetaBase64(json) {
        try {
            return btoa(unescape(encodeURIComponent(json || '{}')));
        } catch (e) {
            return btoa(json || '{}');
        }
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
            const flipButton = el.editorToolbar.querySelector('[data-editor-action="flip-horizontal"]');
            if (flipButton) {
                const flipped = Number(edit.flipX) === -1;
                flipButton.classList.toggle('is-active', flipped);
                flipButton.setAttribute('aria-pressed', flipped ? 'true' : 'false');
            }
        }
    }

    function editorTransform(edit) {
        const scale = edit.scale || 1;
        const flipX = Number(edit.flipX) === -1 ? -1 : 1;
        const offsetX = edit.offsetX || 0;
        const offsetY = edit.offsetY || 0;
        return `translate(${offsetX}%, ${offsetY}%) rotate(${normalRotation(edit.rotation)}deg) scale(${scale}) scaleX(${flipX})`;
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
        // 데스크톱에서는 체커보드 여백보다 실제 사진 프레임을 우선한다.
        // 모바일 규격은 기존 값을 유지해 화면 가장자리와 조작 영역을 보호한다.
        const sidePadding = compact ? 28 : 40;
        const maxFrameWidth = Math.max(220, Math.min(
            stageWidth - sidePadding,
            compact ? stageWidth - sidePadding : 820
        ));
        const maxFrameHeight = Math.max(220, Math.min(
            stageHeight - sidePadding,
            compact ? stageHeight - sidePadding : 520
        ));
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

    function updateSubmitAvailability() {
        if (!el.submit) return;
        // CREATE는 실제 등록할 사진이 있을 때만 완료 액션을 활성화한다.
        // EDIT는 기존 사진을 불러오는 흐름을 유지한다.
        el.submit.disabled = mode === 'create' && state.files.length === 0;
        el.submit.setAttribute('aria-disabled', el.submit.disabled ? 'true' : 'false');
    }

    function renderSelectedFiles() {
        clearPreviewUrls();
        const preview = document.getElementById('photoFormPreview');
        const hasFiles = state.files.length > 0;
        updateSubmitAvailability();
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
        if (action === 'flip-horizontal') edit.flipX = Number(edit.flipX) === -1 ? 1 : -1;
        if (action === 'square') edit.crop = 'square';
        if (action === 'original') {
            state.edits[state.activeIndex] = defaultEdit();
            return renderSelectedFiles();
        }
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


    function cropEditedCanvas(image, edit) {
        const safeEdit = normalizeEditMeta(edit);
        const rotation = normalRotation(safeEdit.rotation);
        const swap = rotation === 90 || rotation === 270;
        const rotatedWidth = swap ? image.naturalHeight : image.naturalWidth;
        const rotatedHeight = swap ? image.naturalWidth : image.naturalHeight;
        const targetAspect = safeEdit.crop === 'square' ? 1 : Math.max(.2, rotatedWidth / Math.max(1, rotatedHeight));
        const maxOutput = 1600;
        const canvas = document.createElement('canvas');
        if (targetAspect >= 1) {
            canvas.width = Math.min(maxOutput, Math.max(1, Math.round(rotatedWidth)));
            canvas.height = Math.max(1, Math.round(canvas.width / targetAspect));
        } else {
            canvas.height = Math.min(maxOutput, Math.max(1, Math.round(rotatedHeight)));
            canvas.width = Math.max(1, Math.round(canvas.height * targetAspect));
        }

        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = editorFilter(safeEdit.filter);

        // The editor preview fits the original image inside the crop frame and then applies
        // translate(%) + rotate + scale from the image center. Save with the same coordinate basis.
        const baseScale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
        const drawWidth = image.naturalWidth * baseScale;
        const drawHeight = image.naturalHeight * baseScale;
        const translateX = (safeEdit.offsetX / 100) * drawWidth;
        const translateY = (safeEdit.offsetY / 100) * drawHeight;

        ctx.translate(canvas.width / 2 + translateX, canvas.height / 2 + translateY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.scale(safeEdit.scale * (Number(safeEdit.flipX) === -1 ? -1 : 1), safeEdit.scale);
        ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
        return canvas;
    }

    async function buildUploadFile(file, edit) {
        const safeEdit = normalizeEditMeta(edit);
        if (/image\/gif/i.test(file.type)) {
            toast('GIF는 애니메이션 보존을 위해 원본으로 등록합니다.', true);
            return file;
        }
        const image = await loadImageFromFile(file);
        const canvas = cropEditedCanvas(image, safeEdit);
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(canvas, type, .92);
        if (!blob) return file;
        const ext = type === 'image/png' ? '.png' : '.jpg';
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
        return new File([blob], `${baseName}_display${ext}`, { type, lastModified: Date.now() });
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
                if (activeScopeType === 'PERSONAL' && el.moyoPublic) {
                    fd.append('visibilityType', el.moyoPublic.checked ? 'FRIENDS' : 'PRIVATE');
                }
                if (el.album.value) fd.append('albumId', el.album.value);
                const uploadFiles = await Promise.all(state.files.map((file, index) => buildUploadFile(file, currentEdit(index))));
                uploadFiles.forEach((file, index) => {
                    fd.append('files', file);
                    fd.append('rawFiles', state.files[index]);
                    const metaJson = editMetaForSubmit(index);
                    fd.append('editMetaB64', encodeEditMetaBase64(metaJson));
                    fd.append('editMetas', metaJson);
                    fd.append('editMeta', metaJson);
                    fd.append('photoEditMetas', metaJson);
                });
                await request(`/api/photo-posts/${postId}/edit`, { method: 'POST', body: fd });
                await syncTogetherPeopleMetadata(postId);
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
            const uploadFiles = await Promise.all(state.files.map((file, index) => buildUploadFile(file, currentEdit(index))));
            uploadFiles.forEach((file, index) => {
                fd.append('files', file);
                fd.append('rawFiles', state.files[index]);
                const metaJson = editMetaForSubmit(index);
                    fd.append('editMetaB64', encodeEditMetaBase64(metaJson));
                    fd.append('editMetas', metaJson);
                    fd.append('editMeta', metaJson);
                    fd.append('photoEditMetas', metaJson);
            });
            const created = await request('/api/photo-posts', { method: 'POST', body: fd });
            if (created && created.postId) await syncTogetherPeopleMetadata(created.postId);
            toast('사진을 등록했습니다.');
            setTimeout(goBack, 350);
        } catch (e) {
            toast(e.message, true);
        } finally {
            updateSubmitAvailability();
        }
    }

    if (el.targetButtons) el.targetButtons.forEach(button => button.addEventListener('click', () => setTargetMode(button.dataset.photoTarget, true)));
    if (el.workspaceTargetSelect) el.workspaceTargetSelect.addEventListener('change', () => syncTargetScope(true));
    if (el.projectWorkspaceTargetSelect) el.projectWorkspaceTargetSelect.addEventListener('change', () => { renderProjectOptions(); syncTargetScope(true); });
    if (el.projectTargetSelect) el.projectTargetSelect.addEventListener('change', () => syncTargetScope(true));

    if (el.togetherButton) el.togetherButton.addEventListener('click', openTogetherSelector);
    if (el.togetherViewAll) el.togetherViewAll.addEventListener('click', toggleTogetherExpanded);
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

    updateSubmitAvailability();
    renderTargetOptions();
    setTargetMode(entryTarget, false);
    initAlbumModal();
    renderTogetherField();
    renderAlbumPath(el.album ? el.album.value : '');
    loadAlbums().then(loadPost).then(fillVisibility).catch(e => toast(e.message, true));
    updateCount();
})();
