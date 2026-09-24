(function(window, document) {
    'use strict';

    const cfg = window.WORKSPACE_SETTINGS_CONFIG || {};
    const $ = (selector, root) => (root || document).querySelector(selector);
    const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

    const TYPE_LABELS = {
        ORGANIZATION: '회사 · 조직', TEAM: '팀 · 프로젝트', STUDY: '스터디 · 연구',
        COMMUNITY: '모임 · 커뮤니티', CLUB: '동아리 · 취미', LIFE: '가족 · 생활', ETC: '기타'
    };
    const JOIN_LABELS = { OPEN: '자유 가입', APPROVAL: '승인 후 가입', INVITE_ONLY: '초대 전용' };

    let infoInitial = '';
    const workspaceImageEditor = { blob: null, originalFile: null, sourceUrl: '', previewUrl: '', temporaryUrl: '', scale: 1.15, x: 0, y: 0, baseWidth: 0, baseHeight: 0, dragging: false, lastX: 0, lastY: 0, initialSourceUrl: '', initialScale: 1.15, initialX: 0, initialY: 0, initialOriginalPath: '' };
    let activeMemberRow = null;
    let confirmResolver = null;

    function api(path, options) {
        return fetch((cfg.contextPath || '') + path, Object.assign({ credentials: 'same-origin' }, options || {}));
    }

    function textResponse(path, params) {
        const body = new URLSearchParams();
        Object.entries(params || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) body.append(key, String(value));
        });
        return api(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body
        }).then(r => r.text()).then(v => v.trim());
    }

    function syncContextLabels() {
        const typeInput = $('#wsType');
        const typeLabel = $('[data-workspace-type-label]');
        if (typeLabel && typeInput) typeLabel.textContent = TYPE_LABELS[typeInput.value] || typeInput.value || '그룹';
        const checkedJoin = $('input[name="joinType"]:checked');
        const joinLabel = $('[data-workspace-join-label]');
        if (joinLabel && checkedJoin) joinLabel.textContent = JOIN_LABELS[checkedJoin.value] || checkedJoin.value;
    }

    function setupTypePicker() {
        const input = $('#wsType');
        if (!input) return;
        const buttons = $$('[data-workspace-type]');
        function sync() {
            buttons.forEach(button => {
                const selected = button.dataset.workspaceType === input.value;
                button.classList.toggle('is-selected', selected);
                button.setAttribute('aria-pressed', selected ? 'true' : 'false');
            });
            syncContextLabels();
        }
        buttons.forEach(button => {
            if (!cfg.canOperate) button.disabled = true;
            button.addEventListener('click', () => {
                if (button.disabled) return;
                input.value = button.dataset.workspaceType || 'COMMUNITY';
                sync();
                refreshInfoDirty();
            });
        });
        sync();
    }

    function setupDescriptionCounter() {
        const textarea = $('#wsDescription');
        const counter = $('[data-description-count]');
        if (!textarea || !counter) return;
        const sync = () => counter.textContent = textarea.value.length + ' / 300';
        textarea.addEventListener('input', sync);
        sync();
    }

    function serializeInfo() {
        const form = $('#workspaceInfoForm');
        if (!form) return '';
        const rows = [];
        const elements = Array.from(form.elements).filter(el => el.name && el.type !== 'file' && !el.disabled);
        elements.forEach(el => {
            if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
            rows.push(el.name + '=' + String(el.value || '').trim());
        });
        return rows.sort().join('&') + '|remove=' + ($('#removeWorkspaceImage')?.value || 'N') + '|file=' + ($('#wsImage')?.files?.[0]?.name || '');
    }

    function refreshInfoDirty() {
        const save = $('[data-save-workspace]');
        const state = $('[data-info-dirty-text]');
        if (!save) return;
        const dirty = serializeInfo() !== infoInitial;
        save.disabled = !dirty || !cfg.canOperate;
        if (state) state.textContent = dirty ? '저장하지 않은 변경사항이 있습니다.' : '변경사항이 없습니다.';
    }

    function setupWorkspaceImageEditor(imageInput, preview) {
        const modal = $('#workspaceImageCropModal');
        const viewport = $('#workspaceImageCropViewport');
        const image = $('#workspaceImageCropImage');
        const range = $('#workspaceImageScale');
        const value = $('#workspaceImageScaleValue');
        const adjust = $('#workspaceImageAdjustButton');
        const apply = $('#workspaceImageApplyButton');
        if (!imageInput || !preview || !modal || !viewport || !image || !range || !apply) return;
        const currentImage = preview.querySelector('img:not([hidden])');
        workspaceImageEditor.sourceUrl = currentImage?.src || '';
        workspaceImageEditor.scale = Number($('#wsImageCropScale')?.value) || 1.15;
        workspaceImageEditor.x = Number($('#wsImageCropX')?.value) || 0;
        workspaceImageEditor.y = Number($('#wsImageCropY')?.value) || 0;
        workspaceImageEditor.initialSourceUrl = workspaceImageEditor.sourceUrl;
        workspaceImageEditor.initialScale = workspaceImageEditor.scale;
        workspaceImageEditor.initialX = workspaceImageEditor.x;
        workspaceImageEditor.initialY = workspaceImageEditor.y;
        workspaceImageEditor.initialOriginalPath = $('#workspaceImageOriginalPath')?.value || '';
        const revertButton = $('[data-revert-workspace-image]');
        const syncRevertButton = () => {
            if (!revertButton) return;
            const changed = workspaceImageEditor.blob || workspaceImageEditor.originalFile || workspaceImageEditor.sourceUrl !== workspaceImageEditor.initialSourceUrl || ($('#removeWorkspaceImage')?.value || 'N') === 'Y' || workspaceImageEditor.scale !== workspaceImageEditor.initialScale || workspaceImageEditor.x !== workspaceImageEditor.initialX || workspaceImageEditor.y !== workspaceImageEditor.initialY;
            revertButton.hidden = !changed;
        };
        workspaceImageEditor.syncRevertButton = syncRevertButton;
        if (adjust) adjust.disabled = !workspaceImageEditor.sourceUrl || !cfg.canOperate;
        const viewportSize = () => viewport.clientWidth || 250;
        const minimumScale = () => {
            const size = viewportSize();
            if (!workspaceImageEditor.baseWidth || !workspaceImageEditor.baseHeight) return 1;
            return Math.max(size / workspaceImageEditor.baseWidth, size / workspaceImageEditor.baseHeight, 1);
        };
        const syncCropState = () => {
            if ($('#wsImageCropScale')) $('#wsImageCropScale').value = String(workspaceImageEditor.scale);
            if ($('#wsImageCropX')) $('#wsImageCropX').value = String(workspaceImageEditor.x);
            if ($('#wsImageCropY')) $('#wsImageCropY').value = String(workspaceImageEditor.y);
        };
        const clamp = () => {
            const size = viewportSize();
            workspaceImageEditor.scale = Math.max(minimumScale(), workspaceImageEditor.scale);
            const maxX = Math.max(0, (workspaceImageEditor.baseWidth * workspaceImageEditor.scale - size) / 2);
            const maxY = Math.max(0, (workspaceImageEditor.baseHeight * workspaceImageEditor.scale - size) / 2);
            workspaceImageEditor.x = Math.max(-maxX, Math.min(maxX, workspaceImageEditor.x));
            workspaceImageEditor.y = Math.max(-maxY, Math.min(maxY, workspaceImageEditor.y));
            range.value = String(Math.round(workspaceImageEditor.scale * 100));
            if (value) value.textContent = Math.round(workspaceImageEditor.scale * 100) + '%';
            syncCropState();
        };
        const base = () => {
            const size = viewportSize();
            if (!image.naturalWidth) return;
            const ratio = image.naturalWidth / image.naturalHeight;
            if (ratio >= 1) { workspaceImageEditor.baseHeight = size; workspaceImageEditor.baseWidth = size * ratio; }
            else { workspaceImageEditor.baseWidth = size; workspaceImageEditor.baseHeight = size / ratio; }
            image.style.width = workspaceImageEditor.baseWidth + 'px';
            image.style.height = workspaceImageEditor.baseHeight + 'px';
            clamp();
        };
        const render = () => { clamp(); image.style.transform = 'translate(-50%,-50%) translate(' + workspaceImageEditor.x + 'px,' + workspaceImageEditor.y + 'px) scale(' + workspaceImageEditor.scale + ')'; };
        const open = reset => {
            if (!workspaceImageEditor.sourceUrl || !cfg.canOperate) return;
            if (reset) { workspaceImageEditor.scale = 1.15; workspaceImageEditor.x = 0; workspaceImageEditor.y = 0; }
            image.onload = () => { base(); render(); modal.hidden = false; document.body.classList.add('ws-settings-image-open'); };
            image.onerror = () => alert('원본 이미지를 불러오지 못했습니다. 이미지를 다시 선택해 주세요.');
            if (image.src !== workspaceImageEditor.sourceUrl) image.src = workspaceImageEditor.sourceUrl;
            else if (image.complete && image.naturalWidth) image.onload();
        };
        const close = () => { modal.hidden = true; document.body.classList.remove('ws-settings-image-open'); };
        const createBlob = async () => {
            if (!image.naturalWidth) return null;
            clamp();
            const size = viewportSize();
            const dw = workspaceImageEditor.baseWidth * workspaceImageEditor.scale;
            const dh = workspaceImageEditor.baseHeight * workspaceImageEditor.scale;
            const dx = (size - dw) / 2 + workspaceImageEditor.x;
            const dy = (size - dh) / 2 + workspaceImageEditor.y;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 600;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 600, 600);
            ctx.scale(600 / size, 600 / size);
            ctx.drawImage(image, dx, dy, dw, dh);
            return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        };
        imageInput.addEventListener('change', () => {
            const file = imageInput.files?.[0];
            if (!file) return;
            if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.'); imageInput.value = ''; return; }
            if (workspaceImageEditor.temporaryUrl) URL.revokeObjectURL(workspaceImageEditor.temporaryUrl);
            workspaceImageEditor.originalFile = file;
            workspaceImageEditor.temporaryUrl = URL.createObjectURL(file);
            workspaceImageEditor.sourceUrl = workspaceImageEditor.temporaryUrl;
            $('#removeWorkspaceImage').value = 'N';
            syncRevertButton();
            open(true);
        });
        adjust?.addEventListener('click', () => open(false));
        $$('[data-workspace-image-close]', modal).forEach(el => el.addEventListener('click', close));
        range.addEventListener('input', () => { workspaceImageEditor.scale = Math.max(minimumScale(), Number(range.value) / 100); render(); });
        viewport.addEventListener('pointerdown', event => { workspaceImageEditor.dragging = true; viewport.classList.add('is-dragging'); workspaceImageEditor.lastX = event.clientX; workspaceImageEditor.lastY = event.clientY; viewport.setPointerCapture?.(event.pointerId); });
        viewport.addEventListener('pointermove', event => { if (!workspaceImageEditor.dragging) return; workspaceImageEditor.x += event.clientX - workspaceImageEditor.lastX; workspaceImageEditor.y += event.clientY - workspaceImageEditor.lastY; workspaceImageEditor.lastX = event.clientX; workspaceImageEditor.lastY = event.clientY; render(); });
        const endDrag = event => { workspaceImageEditor.dragging = false; viewport.classList.remove('is-dragging'); if (event?.pointerId !== undefined && viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId); };
        viewport.addEventListener('pointerup', endDrag); viewport.addEventListener('pointercancel', endDrag);
        apply.addEventListener('click', async () => {
            const blob = await createBlob();
            if (!blob) return;
            workspaceImageEditor.blob = blob;
            if (workspaceImageEditor.previewUrl) URL.revokeObjectURL(workspaceImageEditor.previewUrl);
            workspaceImageEditor.previewUrl = URL.createObjectURL(blob);
            preview.innerHTML = '<img id="workspacePreviewImage" alt="그룹 대표 이미지" src="' + workspaceImageEditor.previewUrl + '">';
            preview.classList.add('has-image');
            imageInput.value = '';
            $('#removeWorkspaceImage').value = 'N';
            if (adjust) adjust.disabled = false;
            syncCropState();
            close();
            syncRevertButton();
            refreshInfoDirty();
        });
    }

    function setupInfoForm() {
        const form = $('#workspaceInfoForm');
        if (!form) return;
        infoInitial = serializeInfo();
        const syncCounts = () => {
            const nameCount = $('[data-name-count]'), descCount = $('[data-description-count]');
            if (nameCount) nameCount.textContent = String(($('#wsName')?.value || '').length);
            if (descCount) descCount.textContent = String(($('#wsDescription')?.value || '').length) + ' / 300';
        };
        syncCounts();
        form.addEventListener('input', () => { syncCounts(); refreshInfoDirty(); });
        form.addEventListener('change', () => { syncContextLabels(); refreshInfoDirty(); });

        const imageInput = $('#wsImage');
        const preview = $('[data-workspace-image-preview]');
        setupWorkspaceImageEditor(imageInput, preview);
        $('[data-remove-workspace-image]')?.addEventListener('click', () => {
            if (!cfg.canOperate) return;
            const hasImage = preview?.classList.contains('has-image') || !!workspaceImageEditor.sourceUrl || !!workspaceImageEditor.blob;
            if (!hasImage) return;
            if (!confirm('그룹 대표 이미지를 기본 이미지로 변경할까요?\n변경사항 저장 후 실제 이미지가 변경됩니다.')) return;
            workspaceImageEditor.blob = null;
            workspaceImageEditor.originalFile = null;
            workspaceImageEditor.sourceUrl = '';
            if (workspaceImageEditor.temporaryUrl) URL.revokeObjectURL(workspaceImageEditor.temporaryUrl);
            workspaceImageEditor.temporaryUrl = '';
            if (imageInput) imageInput.value = '';
            $('#removeWorkspaceImage').value = 'Y';
            if ($('#workspaceImageOriginalPath')) $('#workspaceImageOriginalPath').value = '';
            if ($('#wsImageCropScale')) $('#wsImageCropScale').value = '';
            if ($('#wsImageCropX')) $('#wsImageCropX').value = '';
            if ($('#wsImageCropY')) $('#wsImageCropY').value = '';
            if (preview) {
                preview.classList.remove('has-image');
                preview.innerHTML = '<span data-workspace-image-placeholder>' + (($('#wsName')?.value || cfg.workspaceName || '그룹').trim().charAt(0) || '그') + '</span>';
            }
            const adjust = $('#workspaceImageAdjustButton');
            if (adjust) adjust.disabled = true;
            workspaceImageEditor.syncRevertButton?.();
            refreshInfoDirty();
        });
        $('[data-revert-workspace-image]')?.addEventListener('click', () => {
            if (!cfg.canOperate) return;
            workspaceImageEditor.blob = null;
            workspaceImageEditor.originalFile = null;
            if (workspaceImageEditor.previewUrl) URL.revokeObjectURL(workspaceImageEditor.previewUrl);
            if (workspaceImageEditor.temporaryUrl) URL.revokeObjectURL(workspaceImageEditor.temporaryUrl);
            workspaceImageEditor.previewUrl = '';
            workspaceImageEditor.temporaryUrl = '';
            workspaceImageEditor.sourceUrl = workspaceImageEditor.initialSourceUrl;
            workspaceImageEditor.scale = workspaceImageEditor.initialScale;
            workspaceImageEditor.x = workspaceImageEditor.initialX;
            workspaceImageEditor.y = workspaceImageEditor.initialY;
            if (imageInput) imageInput.value = '';
            $('#removeWorkspaceImage').value = 'N';
            if ($('#workspaceImageOriginalPath')) $('#workspaceImageOriginalPath').value = workspaceImageEditor.initialOriginalPath;
            if ($('#wsImageCropScale')) $('#wsImageCropScale').value = String(workspaceImageEditor.initialScale);
            if ($('#wsImageCropX')) $('#wsImageCropX').value = String(workspaceImageEditor.initialX);
            if ($('#wsImageCropY')) $('#wsImageCropY').value = String(workspaceImageEditor.initialY);
            if (preview) {
                if (workspaceImageEditor.initialSourceUrl) {
                    preview.classList.add('has-image');
                    preview.innerHTML = '<img id="workspacePreviewImage" alt="그룹 대표 이미지" src="' + workspaceImageEditor.initialSourceUrl + '">';
                } else {
                    preview.classList.remove('has-image');
                    preview.innerHTML = '<span data-workspace-image-placeholder>' + (($('#wsName')?.value || cfg.workspaceName || '그룹').trim().charAt(0) || '그') + '</span>';
                }
            }
            if (adjust) adjust.disabled = !workspaceImageEditor.initialSourceUrl;
            workspaceImageEditor.syncRevertButton?.();
            refreshInfoDirty();
        });

        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!cfg.canOperate) return;
            const name = ($('#wsName')?.value || '').trim().replace(/\s+/g, ' ');
            if (!name) return alert('그룹 이름을 입력해 주세요.');
            if (name.length > 60) return alert('그룹 이름은 60자 이하로 입력해 주세요.');
            $('#wsName').value = name;

            const rows = $$('.ws-settings-link-row', form);
            const seen = new Set();
            for (const row of rows) {
                const nameInput = $('input[name="linkName"]', row);
                const urlInput = $('input[name="linkUrl"]', row);
                const linkName = (nameInput?.value || '').trim();
                const linkUrl = (urlInput?.value || '').trim();
                if (!linkName && !linkUrl) continue;
                if (!linkName || !linkUrl) return alert('링크 이름과 주소를 모두 입력해 주세요.');
                try {
                    const parsed = new URL(linkUrl);
                    if (!/^https?:$/.test(parsed.protocol)) throw new Error();
                    const key = parsed.href.toLowerCase();
                    if (seen.has(key)) return alert('같은 링크 주소는 중복해서 등록할 수 없습니다.');
                    seen.add(key);
                    urlInput.value = parsed.href;
                } catch (e) { return alert('외부 링크는 http:// 또는 https:// 주소를 입력해 주세요.'); }
            }

            const save = $('[data-save-workspace]');
            const state = $('[data-info-dirty-text]');
            save.disabled = true;
            save.textContent = '저장 중...';
            if (state) state.textContent = '변경사항을 저장하고 있습니다.';
            try {
                const formData = new FormData(form);
                if (workspaceImageEditor.blob) {
                    formData.set('wsImage', workspaceImageEditor.blob, 'workspace-image.png');
                    if (workspaceImageEditor.originalFile) formData.set('wsImageOriginal', workspaceImageEditor.originalFile, workspaceImageEditor.originalFile.name);
                }
                const response = await api('/workspace/api/update', { method: 'POST', body: formData });
                const result = await response.json();
                if (!result || result.success !== true) throw new Error(result?.message || '그룹 정보를 저장하지 못했습니다.');
                infoInitial = serializeInfo();
                workspaceImageEditor.initialSourceUrl = preview?.querySelector('img:not([hidden])')?.src || '';
                workspaceImageEditor.initialScale = Number($('#wsImageCropScale')?.value) || 1.15;
                workspaceImageEditor.initialX = Number($('#wsImageCropX')?.value) || 0;
                workspaceImageEditor.initialY = Number($('#wsImageCropY')?.value) || 0;
                workspaceImageEditor.initialOriginalPath = $('#workspaceImageOriginalPath')?.value || '';
                workspaceImageEditor.blob = null;
                workspaceImageEditor.originalFile = null;
                workspaceImageEditor.syncRevertButton?.();
                if (state) state.textContent = '저장되었습니다.';
                setTimeout(() => { if (state) state.textContent = '변경사항이 없습니다.'; }, 1500);
            } catch (error) {
                alert(error.message || '그룹 정보 저장 중 오류가 발생했습니다.');
                if (state) state.textContent = '저장에 실패했습니다.';
            } finally {
                save.textContent = '변경사항 저장';
                refreshInfoDirty();
            }
        });
    }

    function addLinkRow() {
        const list = $('[data-workspace-link-list]');
        if (!list || !cfg.canOperate) return;
        if ($$('.ws-settings-link-row', list).length >= 5) return alert('외부 링크는 최대 5개까지 등록할 수 있습니다.');
        const row = document.createElement('div');
        row.className = 'ws-settings-link-row';
        row.innerHTML = '<input type="text" name="linkName" maxlength="50" placeholder="링크 이름">'
            + '<input type="url" name="linkUrl" maxlength="500" placeholder="https://example.com">'
            + '<button type="button" data-remove-link aria-label="링크 삭제">×</button>';
        list.querySelector('[data-workspace-link-empty]')?.remove();
        list.appendChild(row);
        syncLinkCount();
        refreshInfoDirty();
    }

    function syncLinkCount() {
        const list = $('[data-workspace-link-list]');
        const count = $('[data-link-count]');
        if (count && list) count.textContent = String($$('.ws-settings-link-row', list).length);
    }

    function setupLinks() {
        syncLinkCount();
        $('[data-add-workspace-link]')?.addEventListener('click', addLinkRow);
        document.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-link]');
            if (!button || !cfg.canOperate) return;
            const list = $('[data-workspace-link-list]');
            button.closest('.ws-settings-link-row')?.remove();
            if (list && !list.querySelector('.ws-settings-link-row') && !list.querySelector('[data-workspace-link-empty]')) {
                const empty = document.createElement('p');
                empty.className = 'ws-settings-link-empty';
                empty.dataset.workspaceLinkEmpty = '';
                empty.textContent = '등록된 링크가 없습니다.';
                list.appendChild(empty);
            }
            syncLinkCount();
            refreshInfoDirty();
        });
    }

    function setupMembers() {
        const search = $('[data-member-search]');
        const filterButtons = $$('[data-member-filter] button');
        let roleFilter = 'ALL';
        const apply = () => {
            const keyword = (search?.value || '').trim().toLowerCase();
            $$('[data-member-row]').forEach(row => {
                const role = row.dataset.memberRole || 'MEMBER';
                const normalized = role === 'OWNER' ? 'ADMIN' : role;
                const matchesRole = roleFilter === 'ALL' || normalized === roleFilter;
                const matchesText = !keyword || (row.dataset.search || '').includes(keyword);
                row.classList.toggle('is-hidden', !(matchesRole && matchesText));
            });
        };
        search?.addEventListener('input', apply);
        filterButtons.forEach(button => button.addEventListener('click', () => {
            roleFilter = button.dataset.role || 'ALL';
            filterButtons.forEach(item => item.classList.toggle('is-active', item === button));
            apply();
        }));

        document.addEventListener('click', event => {
            const editButton = event.target.closest('[data-edit-member]');
            if (editButton) {
                event.preventDefault();
                event.stopPropagation();
                openMemberSheet(editButton.closest('[data-member-row]'));
                return;
            }

            const row = event.target.closest('[data-member-row]');
            if (!row) return;
            const id = Number(row.dataset.userId);
            if (id && typeof window.openWorkspaceMemberActivityProfile === 'function') {
                window.openWorkspaceMemberActivityProfile(id);
            }
        });
    }

    async function loadMemberProfile(userId) {
        const response = await api('/workspace/api/' + cfg.wsId + '/members/' + userId + '/profile');
        if (!response.ok) throw new Error('멤버 정보를 불러오지 못했습니다.');
        return response.json();
    }

    async function openMemberSheet(row) {
        if (!row || !cfg.canOperate) return;
        activeMemberRow = row;
        const sheet = $('[data-member-sheet]');
        const userId = Number(row.dataset.userId);
        const role = row.dataset.memberRole || 'MEMBER';
        const save = $('[data-sheet-save]');
        const remove = $('[data-sheet-remove]');
        const roleSelect = $('#sheetRole');
        const positionInput = $('#sheetPosition');
        const hint = $('[data-sheet-hint]');
        sheet.hidden = false;
        document.body.style.overflow = 'hidden';
        $('[data-sheet-member-name]').textContent = $('.ws-settings-person-copy strong', row)?.textContent?.trim() || '멤버 관리';
        roleSelect.value = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
        positionInput.value = '';
        save.disabled = true;
        remove.hidden = role === 'OWNER' || userId === cfg.currentUserId;
        roleSelect.disabled = role === 'OWNER' || userId === cfg.currentUserId || !cfg.canOperate;
        hint.textContent = role === 'OWNER' ? '그룹장 권한은 이 화면에서 변경할 수 없습니다. 관리 탭의 그룹장 위임을 사용하세요.' : '';
        try {
            const profile = await loadMemberProfile(userId);
            positionInput.value = profile.POSITION_NAME || profile.positionName || '';
            save.disabled = role === 'OWNER' || !cfg.canOperate;
            row.__memberProfile = profile;
        } catch (error) {
            hint.textContent = error.message;
        }
    }

    function closeMemberSheet() {
        const sheet = $('[data-member-sheet]');
        if (sheet) sheet.hidden = true;
        activeMemberRow = null;
        document.body.style.overflow = '';
    }

    function setupMemberSheet() {
        $$('[data-close-member-sheet]').forEach(button => button.addEventListener('click', closeMemberSheet));
        $('[data-sheet-save]')?.addEventListener('click', async () => {
            if (!activeMemberRow || !cfg.canOperate) return;
            const userId = Number(activeMemberRow.dataset.userId);
            const role = activeMemberRow.dataset.memberRole;
            const payload = { userId, positionName: ($('#sheetPosition')?.value || '').trim() };
            if (role !== 'OWNER' && userId !== cfg.currentUserId) payload.role = $('#sheetRole').value;
            const result = await textResponse('/workspace/api/update-members', { wsId: cfg.wsId, changes: JSON.stringify([payload]) });
            if (result !== 'success') return alert(memberErrorMessage(result));
            window.location.reload();
        });
        $('[data-sheet-remove]')?.addEventListener('click', async () => {
            if (!activeMemberRow || !cfg.canOperate) return;
            const userId = Number(activeMemberRow.dataset.userId);
            const name = $('.ws-settings-person-copy strong', activeMemberRow)?.textContent?.trim() || '이 멤버';
            const ok = await confirmDialog('멤버 내보내기', name + '님을 그룹에서 내보내시겠어요? 참여 중인 하위 프로젝트 관계도 정리됩니다.');
            if (!ok) return;
            const result = await textResponse('/workspace/api/remove-members', { wsId: cfg.wsId, userIds: String(userId) });
            if (result !== 'success') return alert(memberErrorMessage(result));
            window.location.reload();
        });
    }

    function memberErrorMessage(code) {
        const map = {
            forbidden: '권한이 없습니다.', owner_role_locked: '그룹장 권한은 직접 변경할 수 없습니다.',
            self_role_locked: '내 권한은 직접 변경할 수 없습니다.', owner_protected: '그룹장은 내보낼 수 없습니다.',
            project_leader_transfer_required: '이 멤버가 팀장인 프로젝트가 있습니다. 먼저 프로젝트 팀장을 위임해 주세요.',
            workspace_unavailable: '현재 그룹 상태에서는 멤버를 변경할 수 없습니다.'
        };
        return map[code] || '멤버 변경에 실패했습니다. (' + code + ')';
    }

    function confirmDialog(title, message, inputPlaceholder) {
        const modal = $('[data-confirm-modal]');
        if (!modal) return Promise.resolve(window.confirm(message));
        $('[data-confirm-title]').textContent = title;
        $('[data-confirm-message]').textContent = message;
        const input = $('[data-confirm-input]');
        if (inputPlaceholder) { input.hidden = false; input.value = ''; input.placeholder = inputPlaceholder; }
        else { input.hidden = true; input.value = ''; }
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        return new Promise(resolve => { confirmResolver = { resolve, inputRequired: Boolean(inputPlaceholder) }; });
    }

    function setupConfirm() {
        $$('[data-confirm-cancel]').forEach(button => button.addEventListener('click', () => closeConfirm(false)));
        $('[data-confirm-ok]')?.addEventListener('click', () => closeConfirm(true));
    }
    function closeConfirm(ok) {
        const modal = $('[data-confirm-modal]');
        const input = $('[data-confirm-input]');
        if (ok && confirmResolver?.inputRequired && !(input?.value || '').trim()) return;
        if (modal) modal.hidden = true;
        document.body.style.overflow = '';
        const resolver = confirmResolver;
        confirmResolver = null;
        if (resolver) resolver.resolve(ok ? (resolver.inputRequired ? input.value.trim() : true) : false);
    }

    function setupInvites() {
        document.addEventListener('click', async event => {
            const button = event.target.closest('[data-cancel-invite]');
            if (!button || !cfg.canOperate) return;
            const id = button.dataset.cancelInvite;
            const ok = await confirmDialog('초대 취소', '아직 수락하지 않은 이 초대를 취소하시겠어요?');
            if (!ok) return;
            const response = await api('/workspace/api/invitations/' + encodeURIComponent(id) + '/cancel', { method: 'POST' });
            const result = await response.json();
            if (!response.ok || result?.success !== true) {
                const message = result?.status === 'FORBIDDEN' ? '초대를 취소할 권한이 없습니다.'
                    : result?.status === 'ALREADY_PROCESSED' ? '이미 처리된 초대입니다.'
                    : '초대를 취소하지 못했습니다.';
                return alert(message);
            }
            button.closest('[data-invite-id]')?.remove();
        });
    }

    function setupManagement() {
        $('[data-request-delete]')?.addEventListener('click', async () => {
            const typed = await confirmDialog('그룹 삭제', '삭제를 진행하려면 그룹 이름을 정확히 입력해 주세요. 그룹장만 남아 있으면 즉시 삭제되며, 다른 멤버가 있으면 그룹과 하위 프로젝트가 30일간 삭제 예정 상태로 전환됩니다.', cfg.workspaceName);
            if (!typed) return;
            if (typed !== cfg.workspaceName) return alert('그룹 이름이 일치하지 않습니다.');
            const result = await textResponse('/workspace/api/delete-policy', { wsId: cfg.wsId, workspaceName: typed });
            if (result === 'deleted') return window.location.href = (cfg.contextPath || '') + '/workspace/list';
            if (result === 'pending' || result === 'already_pending') return window.location.reload();
            alert('그룹 삭제 요청에 실패했습니다. (' + result + ')');
        });
        $('[data-cancel-delete]')?.addEventListener('click', async () => {
            const ok = await confirmDialog('삭제 신청 취소', '그룹 삭제 신청을 취소하시겠어요?');
            if (!ok) return;
            const result = await textResponse('/workspace/api/delete/cancel', { wsId: cfg.wsId });
            if (!['success', 'SUCCESS', 'cancelled'].includes(result)) return alert('삭제 신청을 취소하지 못했습니다. (' + result + ')');
            window.location.reload();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupTypePicker();
        setupDescriptionCounter();
        setupInfoForm();
        setupLinks();
        setupConfirm();
        setupManagement();
        syncContextLabels();
    });
})(window, document);
