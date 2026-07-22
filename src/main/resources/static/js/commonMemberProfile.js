'use strict';

document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('memberProfileComponent');
    if (root) root.hidden = true;
});

function commonMemberProfileConfig() {
    const root = document.getElementById('memberProfileComponent');
    return {
        scope: root?.dataset.profileScope || 'group',
        scopeId: root?.dataset.scopeId || (typeof WORKSPACE_CONFIG !== 'undefined' ? WORKSPACE_CONFIG.wsId : ''),
        ownerLabel: root?.dataset.ownerLabel || '그룹장',
        adminLabel: root?.dataset.adminLabel || '관리자',
        memberLabel: root?.dataset.memberLabel || '멤버',
        scopeLabel: root?.dataset.scopeLabel
            || ((root?.dataset.profileScope || 'group') === 'project'
                ? '프로젝트'
                : '그룹')
    };
}

function createProfileCropper(config) {
    const fileInput = document.getElementById(config.fileInputId);
    const viewport = document.getElementById(config.viewportId);
    const image = document.getElementById(config.imageId);
    const placeholder = document.getElementById(config.placeholderId);
    const zoom = document.getElementById(config.zoomId);

    const state = {
        localFile: null,
        localUrl: '',
        externalSrc: '',
        mode: 'custom',
        fallbackText: '?',
        x: 0,
        y: 0,
        scale: 1,
        baseWidth: 0,
        baseHeight: 0,
        dragging: false,
        startPointerX: 0,
        startPointerY: 0,
        startX: 0,
        startY: 0,
        onChange: null,
        removeRequested: false,
        imageLoadToken: 0
    };

    function revokeLocalUrl() {
        if (state.localUrl) {
            URL.revokeObjectURL(state.localUrl);
            state.localUrl = '';
        }
    }

    function getViewportSize() {
        const clientSize = Number(viewport.clientWidth);
        if (clientSize > 0) return clientSize;

        const rectSize = Number(viewport.getBoundingClientRect().width);
        if (rectSize > 0) return rectSize;

        const computedSize = parseFloat(window.getComputedStyle(viewport).width);
        if (Number.isFinite(computedSize) && computedSize > 0) return computedSize;

        // commonMemberProfile.css의 편집 프레임 기본 크기와 동일하게 유지한다.
        return 84;
    }

    function calculateBaseSize(naturalWidth, naturalHeight) {
        const viewSize = getViewportSize();
        const sourceWidth = Number(naturalWidth) || image.naturalWidth;
        const sourceHeight = Number(naturalHeight) || image.naturalHeight;
        if (!sourceWidth || !sourceHeight) return;

        const imageRatio = sourceWidth / sourceHeight;

        if (state.mode === 'account') {
            // 개인 프로필 편집기와 동일한 기준:
            // 원본 이미지의 너비를 기준으로 배율을 적용하고 저장된 X/Y를 재현한다.
            state.baseWidth = viewSize;
            state.baseHeight = viewSize / imageRatio;

            if (zoom) {
                zoom.value = String(state.scale);
                zoom.disabled = true;
            }

            image.style.objectFit = 'fill';
        } else {
            // 그룹 전용 프로필만 원형 편집 영역을 채우는 cover 기준을 사용한다.
            if (imageRatio >= 1) {
                state.baseHeight = viewSize;
                state.baseWidth = viewSize * imageRatio;
            } else {
                state.baseWidth = viewSize;
                state.baseHeight = viewSize / imageRatio;
            }

            if (zoom) zoom.disabled = false;
            image.style.objectFit = 'cover';
        }

        image.style.width = state.baseWidth + 'px';
        image.style.height = state.baseHeight + 'px';
        image.style.minWidth = '0';
        image.style.minHeight = '0';
        image.style.maxWidth = 'none';
        image.style.maxHeight = 'none';
    }

    function clampCustomPosition() {
        if (state.mode !== 'custom' || !state.baseWidth || !state.baseHeight) return;

        const viewSize = getViewportSize();
        const drawWidth = state.baseWidth * state.scale;
        const drawHeight = state.baseHeight * state.scale;
        const maxX = Math.max(0, (drawWidth - viewSize) / 2);
        const maxY = Math.max(0, (drawHeight - viewSize) / 2);

        state.x = Math.max(-maxX, Math.min(maxX, state.x));
        state.y = Math.max(-maxY, Math.min(maxY, state.y));
    }

    function getRenderGeometry() {
        const viewSize = getViewportSize();
        const drawWidth = state.baseWidth * state.scale;
        const drawHeight = state.baseHeight * state.scale;

        return {
            viewSize: viewSize,
            drawWidth: drawWidth,
            drawHeight: drawHeight,
            drawX: (viewSize - drawWidth) / 2 + state.x,
            drawY: (viewSize - drawHeight) / 2 + state.y
        };
    }

    function render() {
        if (image.hidden) return;

        clampCustomPosition();
        const geometry = getRenderGeometry();
        image.style.left = '0';
        image.style.top = '0';
        image.style.width = geometry.drawWidth + 'px';
        image.style.height = geometry.drawHeight + 'px';
        image.style.transform =
            'translate(' + geometry.drawX + 'px, ' + geometry.drawY + 'px)';

        if (typeof state.onChange === 'function') {
            state.onChange();
        }
    }

    function showPlaceholder() {
        state.imageLoadToken += 1;
        image.onload = null;
        image.hidden = true;
        placeholder.hidden = false;
        placeholder.textContent = state.fallbackText || '?';
        viewport.classList.remove('has-image');
        viewport.style.cursor = 'default';
    }

    function showImage(src, resetPosition) {
        if (!src) {
            showPlaceholder();
            return;
        }

        if (resetPosition) {
            state.x = 0;
            state.y = 0;
            state.scale = 1;
            if (zoom) zoom.value = '1';
        }

        const loadToken = ++state.imageLoadToken;
        const requestedMode = state.mode;
        const requestedSrc = src;
        const loader = new Image();

        loader.onload = function() {
            if (loadToken !== state.imageLoadToken
                || requestedMode !== state.mode
                || requestedSrc !== src) {
                return;
            }

            image.onload = null;
            image.src = requestedSrc;
            calculateBaseSize(loader.naturalWidth, loader.naturalHeight);
            image.hidden = false;
            placeholder.hidden = true;
            viewport.classList.add('has-image');
            viewport.style.cursor = state.mode === 'custom' ? 'grab' : 'default';

            requestAnimationFrame(function() {
                if (loadToken !== state.imageLoadToken
                    || requestedMode !== state.mode) {
                    return;
                }
                render();
                if (typeof state.onChange === 'function') {
                    state.onChange();
                }
            });
        };

        loader.onerror = function() {
            if (loadToken !== state.imageLoadToken
                || requestedMode !== state.mode) {
                return;
            }
            showPlaceholder();
        };

        loader.src = requestedSrc;
    }

    function refreshDisplay() {
        if (state.mode === 'account') {
            if (state.externalSrc) {
                // setExistingImage에서 복원한 계정 프로필의 scale/x/y를 유지한다.
                showImage(state.externalSrc, false);
            } else {
                showPlaceholder();
            }
            return;
        }
        if (state.localUrl) {
            showImage(state.localUrl, false);
            return;
        }
        if (state.externalSrc) {
            showImage(state.externalSrc, false);
            return;
        }
        showPlaceholder();
    }

    function setMode(mode, fallbackText) {
        state.mode = mode === 'account' ? 'account' : 'custom';

        if (fallbackText !== undefined) {
            state.fallbackText = fallbackText || '?';
        }

        if (fileInput) {
            fileInput.disabled = state.mode === 'account';
        }

        if (zoom) {
            zoom.disabled = state.mode === 'account';
        }

        if (state.mode === 'account') {
            // 계정 프로필의 저장된 배율/X/Y 값은 setExistingImage에서 복원한다.
            // 그룹 전용 로컬 파일만 제거하고 계정 설정값은 유지한다.
            refreshDisplay();
            return;
        }

        // 그룹 전용 모드는 선택 중인 로컬 이미지가 있으면 그대로 복원한다.
        refreshDisplay();
    }

    function setFallbackText(text) {
        state.fallbackText = text || '?';
        if (state.mode === 'account' || (!state.localUrl && !state.externalSrc)) {
            showPlaceholder();
        }
    }

    function setExistingImage(src, cropState) {
        state.removeRequested = false;
        state.externalSrc = src ? workspacePath(src) : '';

        if (state.mode === 'account') {
            revokeLocalUrl();
            state.localFile = null;
        }

        if (cropState) {
            const restoredScale = Number(cropState.scale);
            const restoredX = Number(cropState.x);
            const restoredY = Number(cropState.y);

            const minimumScale = state.mode === 'account' ? 0.1 : 1;
            state.scale = Number.isFinite(restoredScale)
                && restoredScale >= minimumScale
                ? restoredScale
                : 1;
            state.x = Number.isFinite(restoredX) ? restoredX : 0;
            state.y = Number.isFinite(restoredY) ? restoredY : 0;

            if (zoom) {
                zoom.value = String(state.scale);
            }
        }

        if (!state.localUrl) refreshDisplay();
    }

    function getState() {
        return {
            scale: state.scale,
            x: state.x,
            y: state.y
        };
    }

    function getOriginalFile() {
        return state.localFile;
    }

    function setOnChange(callback) {
        state.onChange = typeof callback === 'function' ? callback : null;
    }

    function drawCurrentCropToCanvas(canvas) {
        if (!canvas || image.hidden || !image.naturalWidth) return false;

        const context = canvas.getContext('2d');
        if (!context) return false;

        // 편집 화면에서 실제 적용된 범위 제한과 좌표를 그대로 사용한다.
        clampCustomPosition();
        const geometry = getRenderGeometry();
        const outputWidth = canvas.width || 160;
        const outputHeight = canvas.height || outputWidth;
        const scaleX = outputWidth / geometry.viewSize;
        const scaleY = outputHeight / geometry.viewSize;

        context.clearRect(0, 0, outputWidth, outputHeight);
        context.save();
        context.scale(scaleX, scaleY);
        context.drawImage(
            image,
            geometry.drawX,
            geometry.drawY,
            geometry.drawWidth,
            geometry.drawHeight
        );
        context.restore();
        return true;
    }

    function renderToCanvas(canvas) {
        return drawCurrentCropToCanvas(canvas);
    }

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;

            revokeLocalUrl();
            state.removeRequested = false;
            state.localFile = file;
            state.localUrl = URL.createObjectURL(file);
            state.x = 0;
            state.y = 0;
            state.scale = 1;
            if (zoom) zoom.value = '1';
            showImage(state.localUrl, true);
        });
    }

    if (zoom) {
        zoom.addEventListener('input', function() {
            state.scale = Number(zoom.value || '1');
            clampCustomPosition();
            render();
        });
    }

    function onPointerMove(e) {
        if (!state.dragging || state.mode !== 'custom') return;
        state.x = state.startX + (e.clientX - state.startPointerX);
        state.y = state.startY + (e.clientY - state.startPointerY);
        clampCustomPosition();
        render();
    }

    function endDrag() {
        state.dragging = false;
        if (!image.hidden && state.mode === 'custom') viewport.style.cursor = 'grab';
    }

    viewport.addEventListener('pointerdown', function(e) {
        if (state.mode !== 'custom' || image.hidden) return;
        e.preventDefault();
        state.dragging = true;
        state.startPointerX = e.clientX;
        state.startPointerY = e.clientY;
        state.startX = state.x;
        state.startY = state.y;
        viewport.style.cursor = 'grabbing';
        if (viewport.setPointerCapture) {
            try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
        }
    });

    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endDrag);

    function resetToDefault() {
        revokeLocalUrl();
        state.localFile = null;
        state.externalSrc = '';
        state.removeRequested = true;
        state.x = 0;
        state.y = 0;
        state.scale = 1;

        if (fileInput) fileInput.value = '';
        if (zoom) zoom.value = '1';

        showPlaceholder();

        if (typeof state.onChange === 'function') {
            state.onChange();
        }
    }

    function isRemoveRequested() {
        return state.removeRequested;
    }

    async function getBlob() {
        if (image.hidden || !image.naturalWidth) return null;

        const outputSize = 512;
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;

        // 상단 미리보기와 동일한 렌더 함수를 사용해 저장 결과의 위치 차이를 없앤다.
        if (!drawCurrentCropToCanvas(canvas)) return null;

        return await new Promise(function(resolve) {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    return {
        getBlob: getBlob,
        getState: getState,
        getOriginalFile: getOriginalFile,
        renderToCanvas: renderToCanvas,
        setOnChange: setOnChange,
        setMode: setMode,
        setFallbackText: setFallbackText,
        setExistingImage: setExistingImage,
        resetToDefault: resetToDefault,
        isRemoveRequested: isRemoveRequested
    };
}


let modalWorkspaceProfileCropper = null;
let openedWorkspaceMemberProfile = null;
let workspaceMemberProfileEditMode = false;

function setWorkspaceMemberProfileMode(editMode) {
    const content = document.getElementById('memberProfileContent');
    const view = document.getElementById('memberProfileView');
    const edit = document.getElementById('memberProfileEdit');

    workspaceMemberProfileEditMode = Boolean(editMode);

    if (content) {
        content.classList.toggle('is-view-mode', !workspaceMemberProfileEditMode);
        content.classList.toggle('is-edit-mode', workspaceMemberProfileEditMode);
    }
    if (view) view.hidden = workspaceMemberProfileEditMode;
    if (edit) edit.hidden = !workspaceMemberProfileEditMode;

    if (openedWorkspaceMemberProfile) {
        const userId = Number(workspaceProfileValue(
            openedWorkspaceMemberProfile, 'userId', 'USER_ID') || 0);
        const isMe = userId === WORKSPACE_CONFIG.currentUserId;
        const role = workspaceProfileValue(
            openedWorkspaceMemberProfile, 'workspaceRole', 'WS_ROLE') || 'MEMBER';
        const isOwner = String(workspaceProfileValue(
            openedWorkspaceMemberProfile, 'isOwner', 'IS_OWNER') || 'N') === 'Y';

        renderWorkspaceMemberProfileActionMenu(
            openedWorkspaceMemberProfile,
            isMe,
            role,
            isOwner,
            workspaceMemberProfileEditMode
        );

        renderWorkspaceProfileActions(
            openedWorkspaceMemberProfile,
            isMe,
            role,
            isOwner,
            workspaceMemberProfileEditMode
        );
    }
}

function enterWorkspaceMemberProfileEdit() {
    if (!openedWorkspaceMemberProfile) return;
    setWorkspaceMemberProfileMode(true);
    window.requestAnimationFrame(updateWorkspaceMemberProfilePreview);
}

function cancelWorkspaceMemberProfileEdit() {
    if (!openedWorkspaceMemberProfile) return;
    renderWorkspaceMemberProfile(openedWorkspaceMemberProfile);
    setWorkspaceMemberProfileMode(false);
}

function setWorkspaceProfileModalVisible(visible) {
    const root = document.getElementById('memberProfileComponent');
    const modal = document.getElementById('memberProfileModal');
    const overlay = document.getElementById('memberProfileOverlay');
    if (!root || !modal || !overlay) return;

    root.hidden = !visible;
    modal.style.display = visible ? 'block' : 'none';
    overlay.style.display = visible ? 'block' : 'none';
    document.body.classList.toggle('workspace-modal-open', visible);
}

function closeWorkspaceMemberProfile() {
    closeWorkspaceMemberProfileActionMenu();
    setWorkspaceProfileModalVisible(false);
    workspaceMemberProfileEditMode = false;
    openedWorkspaceMemberProfile = null;
}

function workspaceProfileValue(data, camel, upper) {
    return data && data[camel] != null ? data[camel] : (data ? data[upper] : null);
}

function workspacePath(path) {
    const contextPath = (
        typeof WORKSPACE_CONFIG !== 'undefined'
        && WORKSPACE_CONFIG
        && WORKSPACE_CONFIG.contextPath
    ) ? WORKSPACE_CONFIG.contextPath : '';
    return MoyoProfileUtils.resolvePath(path, contextPath);
}

function openWorkspaceMemberProfile(userId) {
    const loading = document.getElementById('memberProfileLoading');
    const content = document.getElementById('memberProfileContent');
    if (!loading || !content) return;

    openedWorkspaceMemberProfile = null;
    loading.hidden = false;
    content.hidden = true;
    setWorkspaceProfileModalVisible(true);

    fetch(workspacePath('/workspace/api/' + encodeURIComponent(WORKSPACE_CONFIG.wsId)
        + '/members/' + encodeURIComponent(userId) + '/profile'))
        .then(function(res) {
            if (res.status === 401) throw new Error('LOGIN_REQUIRED');
            if (res.status === 403) throw new Error('FORBIDDEN');
            if (!res.ok) throw new Error('PROFILE_LOAD_FAILED');
            return res.json();
        })
        .then(function(data) {
            openedWorkspaceMemberProfile = data;
            renderWorkspaceMemberProfile(data);
            loading.hidden = true;
            content.hidden = false;
        })
        .catch(function(err) {
            console.error('멤버 프로필 로딩 실패:', err);
            loading.textContent = err.message === 'LOGIN_REQUIRED'
                ? '로그인이 필요합니다.'
                : '프로필을 불러오지 못했습니다.';
        });
}

function ensureWorkspaceProfilePreviewCanvas() {
    const avatar = document.getElementById('memberProfileAvatar');
    if (!avatar) return null;

    let canvas = document.getElementById('memberProfilePreviewCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'memberProfilePreviewCanvas';
        canvas.width = 160;
        canvas.height = 160;
        canvas.hidden = true;
    }

    if (canvas.parentElement !== avatar) {
        avatar.appendChild(canvas);
    }

    return canvas;
}

function clearWorkspaceProfilePreviewAvatar(keepCanvas) {
    const avatar = document.getElementById('memberProfileAvatar');
    if (!avatar) return null;

    const canvas = keepCanvas
        ? ensureWorkspaceProfilePreviewCanvas()
        : document.getElementById('memberProfilePreviewCanvas');

    Array.from(avatar.children).forEach(function(child) {
        if (canvas && child === canvas) return;
        child.remove();
    });

    Array.from(avatar.childNodes).forEach(function(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.remove();
        }
    });

    return canvas;
}

function setWorkspaceProfilePreviewAvatar(imagePath, fallbackText) {
    const avatar = document.getElementById('memberProfileAvatar');
    if (!avatar) return;

    const canvas = clearWorkspaceProfilePreviewAvatar(true);
    if (canvas) canvas.hidden = true;

    MoyoProfileUtils.renderAvatar(avatar, {
        src: imagePath ? workspacePath(imagePath) : '',
        fallbackText: fallbackText,
        alt: '',
        imageClass: 'has-image',
        fallbackClass: 'is-fallback',
        beforeNode: canvas,
        preserve: function(node) {
            return Boolean(canvas && node === canvas);
        }
    });
}

function updateWorkspaceMemberProfilePreview() {
    if (!openedWorkspaceMemberProfile || !workspaceMemberProfileEditMode) return;

    const useAccountInput = document.getElementById('profileUseAccount');
    const displayNameInput = document.getElementById('profileDisplayName');
    const positionInput = document.getElementById('profilePositionName');
    const emailInput = document.getElementById('profileContactEmail');
    const phoneInput = document.getElementById('profilePhoneNumber');
    const showPhoneInput = document.getElementById('profileShowPhone');
    if (!useAccountInput || !displayNameInput) return;

    const useAccount = useAccountInput.checked;
    const accountName = workspaceProfileValue(
        openedWorkspaceMemberProfile, 'accountName', 'ACCOUNT_NAME') || '';
    const effectiveImage = workspaceProfileValue(
        openedWorkspaceMemberProfile,
        'profileImagePath',
        'PROFILE_IMAGE_PATH') || '';
    const accountImage = workspaceProfileValue(
        openedWorkspaceMemberProfile,
        'accountProfileImagePath',
        'ACCOUNT_PROFILE_IMAGE_PATH') || (useAccount ? effectiveImage : '');
    const customImage = workspaceProfileValue(
        openedWorkspaceMemberProfile,
        'customProfileImagePath',
        'CUSTOM_PROFILE_IMAGE_PATH') || (!useAccount ? effectiveImage : '');

    const previewName = useAccount
        ? accountName
        : (displayNameInput.value.trim() || accountName || '이름 미입력');
    const previewPosition = positionInput
        ? positionInput.value.trim()
        : '';
    const previewEmail = emailInput ? emailInput.value.trim() : '';
    const previewPhone = phoneInput ? phoneInput.value.trim() : '';
    const showPhone = Boolean(previewPhone && showPhoneInput && showPhoneInput.checked);

    document.getElementById('memberProfileName').textContent = previewName;

    const previewRoleElement = document.getElementById('memberProfilePosition');
    if (previewRoleElement) {
        previewRoleElement.textContent = previewPosition;
        previewRoleElement.hidden = !previewPosition;
    }
    document.getElementById('memberProfilePreviewEmail').textContent =
        previewEmail || '이메일 미입력';

    const previewPhoneElement = document.getElementById('memberProfilePreviewPhone');
    previewPhoneElement.hidden = !showPhone;
    previewPhoneElement.textContent = previewPhone;

    const previewCanvas = ensureWorkspaceProfilePreviewCanvas();

    if (useAccount) {
        if (previewCanvas) previewCanvas.hidden = true;
        setWorkspaceProfilePreviewAvatar(
            accountImage,
            previewName.substring(0, 1) || '?'
        );
    } else if (modalWorkspaceProfileCropper
            && previewCanvas
            && modalWorkspaceProfileCropper.renderToCanvas(previewCanvas)) {
        const avatar = document.getElementById('memberProfileAvatar');
        clearWorkspaceProfilePreviewAvatar(true);
        previewCanvas.hidden = false;
        avatar.classList.remove('is-fallback');
    } else {
        if (previewCanvas) previewCanvas.hidden = true;
        setWorkspaceProfilePreviewAvatar(
            customImage || effectiveImage,
            previewName.substring(0, 1) || '?'
        );
    }
}

function bindWorkspaceMemberProfilePreview() {
    const ids = [
        'profileUseAccount',
        'profileDisplayName',
        'profilePositionName',
        'profileContactEmail',
        'profilePhoneNumber',
        'profileShowPhone',
        'modalProfileZoom',
        'modalProfileImageInput'
    ];

    ids.forEach(function(id) {
        const element = document.getElementById(id);
        if (!element || element.dataset.previewBound === 'Y') return;
        element.addEventListener('input', updateWorkspaceMemberProfilePreview);
        element.addEventListener('change', function() {
            window.requestAnimationFrame(updateWorkspaceMemberProfilePreview);
        });
        element.dataset.previewBound = 'Y';
    });

    const imageSelectButton = document.getElementById('modalProfileImageSelectButton');
    const imageInput = document.getElementById('modalProfileImageInput');
    if (imageSelectButton && imageSelectButton.dataset.filePickerBound !== 'Y') {
        imageSelectButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const useAccountInput = document.getElementById('profileUseAccount');
            if ((useAccountInput && useAccountInput.checked)
                    || imageSelectButton.disabled
                    || !imageInput) {
                return;
            }

            imageInput.value = '';
            imageInput.click();
        });
        imageSelectButton.dataset.filePickerBound = 'Y';
    }

    const cropImage = document.getElementById('modalProfileCropImage');
    if (cropImage && cropImage.dataset.previewBound !== 'Y') {
        cropImage.addEventListener('load', function() {
            window.requestAnimationFrame(updateWorkspaceMemberProfilePreview);
        });
        cropImage.dataset.previewBound = 'Y';
    }

    const viewport = document.getElementById('modalProfileViewport');
    if (viewport && viewport.dataset.previewBound !== 'Y') {
        ['pointermove', 'pointerup', 'mousemove', 'mouseup', 'touchmove', 'touchend']
            .forEach(function(eventName) {
                viewport.addEventListener(eventName, function() {
                    window.requestAnimationFrame(updateWorkspaceMemberProfilePreview);
                }, { passive: true });
            });
        viewport.dataset.previewBound = 'Y';
    }
}

function workspaceAccountCropState(data) {
    const viewport = document.getElementById('modalProfileViewport');
    let viewSize = 84;

    if (viewport) {
        const clientSize = Number(viewport.clientWidth);
        const rectSize = Number(viewport.getBoundingClientRect().width);
        const computedSize = parseFloat(window.getComputedStyle(viewport).width);

        if (clientSize > 0) {
            viewSize = clientSize;
        } else if (rectSize > 0) {
            viewSize = rectSize;
        } else if (Number.isFinite(computedSize) && computedSize > 0) {
            viewSize = computedSize;
        }
    }

    // 계정 프로필의 크롭 좌표는 마이페이지의 500px canvas 기준으로 저장된다.
    // 편집기가 숨겨진 상태에서도 CSS 실제 프레임(84px)을 기준으로 환산한다.
    const sourceCanvasSize = 500;
    const ratio = viewSize / sourceCanvasSize;

    return {
        scale: Number(workspaceProfileValue(
            data,
            'accountProfileCropScale',
            'ACCOUNT_PROFILE_CROP_SCALE'
        ) || 1),
        x: Number(workspaceProfileValue(
            data,
            'accountProfileCropX',
            'ACCOUNT_PROFILE_CROP_X'
        ) || 0) * ratio,
        y: Number(workspaceProfileValue(
            data,
            'accountProfileCropY',
            'ACCOUNT_PROFILE_CROP_Y'
        ) || 0) * ratio
    };
}

function renderWorkspaceMemberProfile(data) {
    const userId = Number(workspaceProfileValue(data, 'userId', 'USER_ID') || 0);
    const isMe = userId === WORKSPACE_CONFIG.currentUserId;
    const displayName = workspaceProfileValue(data, 'displayName', 'DISPLAY_NAME') || '';
    const positionName = workspaceProfileValue(data, 'positionName', 'POSITION_NAME') || '';
    const role = workspaceProfileValue(data, 'workspaceRole', 'WS_ROLE') || 'MEMBER';
    const isOwner = String(workspaceProfileValue(data, 'isOwner', 'IS_OWNER') || 'N') === 'Y';
    const phone = workspaceProfileValue(data, 'phoneNumber', 'PHONE_NUMBER') || '';
    const showPhone = String(
        workspaceProfileValue(data, 'showPhone', 'SHOW_PHONE') || 'N'
    ) === 'Y';
    const showBirth = String(
        workspaceProfileValue(data, 'showBirth', 'SHOW_BIRTH') || 'Y'
    ) === 'Y';
    const useAccount = String(workspaceProfileValue(data, 'useAccountProfile', 'USE_ACCOUNT_PROFILE') || 'Y') === 'Y';
    const imagePath = workspaceProfileValue(data, 'profileImagePath', 'PROFILE_IMAGE_PATH') || '';
    const accountImagePath = workspaceProfileValue(
        data, 'accountProfileImagePath', 'ACCOUNT_PROFILE_IMAGE_PATH') || '';
    const accountOriginalImagePath = workspaceProfileValue(
        data,
        'accountProfileOriginalImagePath',
        'ACCOUNT_PROFILE_ORIGINAL_IMAGE_PATH'
    ) || '';
    const accountCropScale = Number(workspaceProfileValue(
        data, 'accountProfileCropScale', 'ACCOUNT_PROFILE_CROP_SCALE') || 1);
    const accountCropX = Number(workspaceProfileValue(
        data, 'accountProfileCropX', 'ACCOUNT_PROFILE_CROP_X') || 0);
    const accountCropY = Number(workspaceProfileValue(
        data, 'accountProfileCropY', 'ACCOUNT_PROFILE_CROP_Y') || 0);
    const accountAvatarType = String(workspaceProfileValue(
        data,
        'accountProfileAvatarType',
        'ACCOUNT_PROFILE_AVATAR_TYPE'
    ) || 'DEFAULT').toUpperCase();
    const customImagePath = workspaceProfileValue(
        data, 'customProfileImagePath', 'CUSTOM_PROFILE_IMAGE_PATH') || '';
    const customOriginalImagePath = workspaceProfileValue(
        data, 'customProfileImageOriginalPath', 'CUSTOM_PROFILE_IMAGE_ORIGINAL_PATH') || '';
    const customCropScale = Number(workspaceProfileValue(
        data, 'customProfileImageCropScale', 'CUSTOM_PROFILE_IMAGE_CROP_SCALE') || 1);
    const customCropX = Number(workspaceProfileValue(
        data, 'customProfileImageCropX', 'CUSTOM_PROFILE_IMAGE_CROP_X') || 0);
    const customCropY = Number(workspaceProfileValue(
        data, 'customProfileImageCropY', 'CUSTOM_PROFILE_IMAGE_CROP_Y') || 0);
    const contactEmail = workspaceProfileValue(data, 'email', 'EMAIL') || '';
    const accountEmail = workspaceProfileValue(data, 'accountEmail', 'ACCOUNT_EMAIL') || contactEmail;

    const profileConfig = commonMemberProfileConfig();
    document.getElementById('memberProfileModalTitle').textContent =
        isMe
            ? '내 ' + profileConfig.scopeLabel + ' 프로필'
            : '멤버 프로필';
    data.profileImagePath = imagePath;
    data.accountProfileImagePath = accountImagePath;
    data.accountProfileOriginalImagePath = accountOriginalImagePath;
    data.accountProfileCropScale = accountCropScale;
    data.accountProfileCropX = accountCropX;
    data.accountProfileCropY = accountCropY;
    data.accountProfileAvatarType = accountAvatarType;
    data.customProfileImagePath = customImagePath;
    data.customProfileImageOriginalPath = customOriginalImagePath;
    data.customProfileImageCropScale = customCropScale;
    data.customProfileImageCropX = customCropX;
    data.customProfileImageCropY = customCropY;

    document.getElementById('memberProfileName').textContent = displayName;

    const roleDescriptionElement = document.getElementById('memberProfilePosition');
    if (roleDescriptionElement) {
        roleDescriptionElement.textContent = positionName;
        roleDescriptionElement.hidden = !positionName;
    }

    document.getElementById('memberProfileRole').textContent =
        isOwner
            ? profileConfig.ownerLabel
            : (role === 'ADMIN'
                ? profileConfig.adminLabel
                : profileConfig.memberLabel);
    document.getElementById('memberProfileEmail').textContent = contactEmail || '-';
    document.getElementById('memberProfileJoinedAt').textContent =
        workspaceProfileValue(data, 'joinedAt', 'JOINED_AT') || '-';

    const phoneRow = document.getElementById('memberProfilePhoneRow');
    const canSeePhone = showPhone;
    phoneRow.hidden = !canSeePhone || !phone;
    document.getElementById('memberProfilePhone').textContent =
        canSeePhone && phone ? phone : '';

    const birthRow = document.getElementById('memberProfileBirthRow');
    const birthElement = document.getElementById('memberProfileBirth');
    const birthDate = workspaceProfileValue(
        data,
        'birthDate',
        'BIRTH_DATE'
    ) || '';
    const birthCalendarType = String(workspaceProfileValue(
        data,
        'birthCalendarType',
        'BIRTH_CALENDAR_TYPE'
    ) || 'SOLAR').toUpperCase();

    if (birthRow && birthElement) {
        birthRow.hidden = !birthDate;
        birthElement.textContent = birthDate
            ? birthDate + (birthCalendarType === 'LUNAR' ? ' · 음력' : '')
            : '';
    }

    const detailList = document.querySelector(
        '.common-member-profile .workspace-profile-detail-list'
    );
    if (detailList) {
        const secondaryRows = [
            phoneRow,
            document.getElementById('memberProfileJoinedAt')?.closest('div'),
            birthRow
        ].filter(function(row) {
            return row && !row.hidden;
        });

        detailList.classList.remove(
            'has-secondary-1',
            'has-secondary-2',
            'has-secondary-3'
        );
        detailList.classList.add(
            'has-secondary-' + Math.max(1, secondaryRows.length)
        );
    }

    if (!modalWorkspaceProfileCropper) {
        modalWorkspaceProfileCropper = createProfileCropper({
            fileInputId: 'modalProfileImageInput',
            viewportId: 'modalProfileViewport',
            imageId: 'modalProfileCropImage',
            placeholderId: 'modalProfilePlaceholder',
            zoomId: 'modalProfileZoom'
        });
    }
    modalWorkspaceProfileCropper.setFallbackText(displayName ? displayName.substring(0, 1) : '?');
    const hasCustomOriginalImage = Boolean(customOriginalImagePath);
    const customEditorImagePath =
        customOriginalImagePath || customImagePath || imagePath;
    const customEditorCropState = hasCustomOriginalImage
        ? {
            scale: customCropScale,
            x: customCropX,
            y: customCropY
        }
        : {
            // 예전 데이터처럼 원본이 없으면 이미 잘린 결과에
            // 기존 크롭값을 다시 적용하지 않아 이중 크롭을 막는다.
            scale: 1,
            x: 0,
            y: 0
        };

    const hasAccountOriginal = Boolean(accountOriginalImagePath);
    const accountEditorImagePath = hasAccountOriginal
        ? accountOriginalImagePath
        : (accountImagePath || imagePath);
    const accountEditorCropState = hasAccountOriginal
        ? workspaceAccountCropState(data)
        : { scale: 1, x: 0, y: 0 };

    modalWorkspaceProfileCropper.setMode(
        useAccount ? 'account' : 'custom',
        displayName ? displayName.substring(0, 1) : '?'
    );
    modalWorkspaceProfileCropper.setExistingImage(
        useAccount
            ? accountEditorImagePath
            : customEditorImagePath,
        useAccount
            ? accountEditorCropState
            : customEditorCropState
    );
    modalWorkspaceProfileCropper.setOnChange(function() {
        window.requestAnimationFrame(updateWorkspaceMemberProfilePreview);
    });

    const defaultAvatarButton =
        document.getElementById('modalProfileDefaultAvatarButton');
    if (defaultAvatarButton && !defaultAvatarButton.dataset.bound) {
        defaultAvatarButton.addEventListener('click', function() {
            const useAccount =
                document.getElementById('profileUseAccount');
            if (useAccount && useAccount.checked) return;

            const displayNameInput =
                document.getElementById('profileDisplayName');
            const fallbackText = displayNameInput
                ? (displayNameInput.value || '').trim().substring(0, 1) || '?'
                : '?';

            modalWorkspaceProfileCropper.setFallbackText(fallbackText);
            modalWorkspaceProfileCropper.resetToDefault();
            window.requestAnimationFrame(updateWorkspaceMemberProfilePreview);
        });
        defaultAvatarButton.dataset.bound = 'Y';
    }

    setWorkspaceProfilePreviewAvatar(
        imagePath,
        displayName.substring(0, 1) || '?'
    );

    const view = document.getElementById('memberProfileView');
    const edit = document.getElementById('memberProfileEdit');
    workspaceMemberProfileEditMode = false;
    view.hidden = false;
    edit.hidden = true;

    if (isMe) {
        document.getElementById('profileUseAccount').checked = useAccount;
        document.getElementById('profileDisplayName').value =
            workspaceProfileValue(data, 'customDisplayName', 'CUSTOM_DISPLAY_NAME') || displayName;
        document.getElementById('profilePositionName').value = positionName;
        const contactEmailInput = document.getElementById('profileContactEmail');
        contactEmailInput.value = contactEmail || accountEmail || '';
        contactEmailInput.dataset.accountEmail = accountEmail || '';
        document.getElementById('profilePhoneNumber').value = phone;
        document.getElementById('profileShowPhone').checked = showPhone;
        const showBirthInput = document.getElementById('profileShowBirth');
        if (showBirthInput) showBirthInput.checked = showBirth;
        const displayNameInput = document.getElementById('profileDisplayName');
        if (displayNameInput && !displayNameInput.dataset.cropperBound) {
            displayNameInput.addEventListener('input', function() {
                if (modalWorkspaceProfileCropper) {
                    const text = (this.value || '').trim().substring(0, 1) || '?';
                    modalWorkspaceProfileCropper.setFallbackText(text);
                }
            });
            displayNameInput.dataset.cropperBound = 'Y';
        }
        syncWorkspaceProfileAccountMode();
        bindWorkspaceMemberProfilePreview();
    }

    setWorkspaceMemberProfileMode(false);
}

function syncWorkspaceProfileAccountMode() {
    const useAccount = document.getElementById('profileUseAccount');
    const displayName = document.getElementById('profileDisplayName');
    const editor = document.querySelector('.workspace-profile-image-editor');
    if (!useAccount || !displayName) return;

    const accountMode = useAccount.checked;
    const accountName = openedWorkspaceMemberProfile
        ? (workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'accountName',
            'ACCOUNT_NAME'
        ) || '')
        : '';
    const customDisplayName = openedWorkspaceMemberProfile
        ? (workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'customDisplayName',
            'CUSTOM_DISPLAY_NAME'
        ) || '')
        : '';

    if (accountMode && accountName) {
        displayName.value = accountName;
    } else if (!accountMode && customDisplayName) {
        displayName.value = customDisplayName;
    }

    const avatarText = (displayName.value || '').trim().substring(0, 1) || '?';
    displayName.disabled = accountMode;
    displayName.setAttribute('aria-disabled', accountMode ? 'true' : 'false');

    if (editor) {
        editor.classList.toggle('is-account-mode', accountMode);

        const imageInput = document.getElementById('modalProfileImageInput');
        const imageSelectButton = document.getElementById('modalProfileImageSelectButton');
        const defaultAvatarButton = document.getElementById('modalProfileDefaultAvatarButton');
        const zoomInput = document.getElementById('modalProfileZoom');

        if (imageInput) imageInput.disabled = accountMode;
        [imageSelectButton, defaultAvatarButton].forEach(function(button) {
            if (!button) return;
            button.disabled = accountMode;
            button.setAttribute(
                'aria-disabled',
                accountMode ? 'true' : 'false'
            );
        });
        if (zoomInput) zoomInput.disabled = accountMode;
    }

    if (modalWorkspaceProfileCropper && openedWorkspaceMemberProfile) {
        const accountName = workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'accountName',
            'ACCOUNT_NAME'
        ) || '';

        const accountImagePath = workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'accountProfileImagePath',
            'ACCOUNT_PROFILE_IMAGE_PATH'
        ) || '';

        const customImagePath = workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'customProfileImagePath',
            'CUSTOM_PROFILE_IMAGE_PATH'
        ) || '';

        const customOriginalImagePath = workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'customProfileImageOriginalPath',
            'CUSTOM_PROFILE_IMAGE_ORIGINAL_PATH'
        ) || '';

        const customCropScale = Number(workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'customProfileImageCropScale',
            'CUSTOM_PROFILE_IMAGE_CROP_SCALE'
        ) || 1);

        const customCropX = Number(workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'customProfileImageCropX',
            'CUSTOM_PROFILE_IMAGE_CROP_X'
        ) || 0);

        const customCropY = Number(workspaceProfileValue(
            openedWorkspaceMemberProfile,
            'customProfileImageCropY',
            'CUSTOM_PROFILE_IMAGE_CROP_Y'
        ) || 0);

        if (accountMode) {
            const savedAccountOriginalPath = workspaceProfileValue(
                openedWorkspaceMemberProfile,
                'accountProfileOriginalImagePath',
                'ACCOUNT_PROFILE_ORIGINAL_IMAGE_PATH'
            ) || '';
            const savedAccountAvatarType = String(workspaceProfileValue(
                openedWorkspaceMemberProfile,
                'accountProfileAvatarType',
                'ACCOUNT_PROFILE_AVATAR_TYPE'
            ) || 'DEFAULT').toUpperCase();
            const savedAccountImagePath = workspaceProfileValue(
                openedWorkspaceMemberProfile,
                'accountProfileImagePath',
                'ACCOUNT_PROFILE_IMAGE_PATH'
            ) || workspaceProfileValue(
                openedWorkspaceMemberProfile,
                'profileImagePath',
                'PROFILE_IMAGE_PATH'
            ) || '';
            const hasSavedAccountOriginal =
                Boolean(savedAccountOriginalPath);

            modalWorkspaceProfileCropper.setMode(
                'account',
                accountName.substring(0, 1) || '?'
            );
            modalWorkspaceProfileCropper.setExistingImage(
                hasSavedAccountOriginal
                    ? savedAccountOriginalPath
                    : savedAccountImagePath,
                hasSavedAccountOriginal
                    ? workspaceAccountCropState(openedWorkspaceMemberProfile)
                    : { scale: 1, x: 0, y: 0 }
            );
        } else {
            const hasCustomOriginalImage = Boolean(customOriginalImagePath);
            modalWorkspaceProfileCropper.setMode(
                'custom',
                avatarText
            );
            modalWorkspaceProfileCropper.setExistingImage(
                customOriginalImagePath || customImagePath,
                hasCustomOriginalImage
                    ? {
                        scale: customCropScale,
                        x: customCropX,
                        y: customCropY
                    }
                    : {
                        // 원본이 없는 예전 프로필은 결과 이미지 자체를
                        // 새 기준으로 사용해 반복 크롭을 방지한다.
                        scale: 1,
                        x: 0,
                        y: 0
                    }
            );
        }
    }

    window.requestAnimationFrame(updateWorkspaceMemberProfilePreview);
}

function renderWorkspaceProfileActions(data, isMe, role, isOwner, editMode) {
    const actions = document.getElementById('memberProfileActions');
    if (!actions) return;

    actions.innerHTML = '';
    actions.classList.remove(
        'is-empty',
        'is-edit-actions',
        'is-self-leave-only'
    );

    if (!editMode) {
        actions.classList.add('is-empty');
        return;
    }

    actions.classList.add('is-edit-actions');

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'workspace-profile-save-button';
    save.textContent = '저장';
    save.setAttribute('form', 'memberProfileEdit');

    actions.appendChild(save);
}

function closeWorkspaceMemberProfileActionMenu() {
    const panel = document.getElementById('memberProfileActionMenuPanel');
    const button = document.getElementById('memberProfileActionMenuButton');

    if (panel) panel.hidden = true;
    if (button) button.setAttribute('aria-expanded', 'false');
}

function toggleWorkspaceMemberProfileActionMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const panel = document.getElementById('memberProfileActionMenuPanel');
    const button = document.getElementById('memberProfileActionMenuButton');
    if (!panel || !button) return;

    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

function appendWorkspaceMemberProfileMenuItem(
    panel,
    label,
    className,
    handler,
    separated
) {
    if (!panel) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'workspace-profile-action-menu-item'
        + (className ? ' ' + className : '')
        + (separated ? ' is-separated' : '');
    button.textContent = label;
    button.setAttribute('role', 'menuitem');
    button.onclick = function() {
        closeWorkspaceMemberProfileActionMenu();
        handler();
    };
    panel.appendChild(button);
}

function renderWorkspaceMemberProfileActionMenu(
    data,
    isMe,
    role,
    isOwner,
    editMode
) {
    const menu = document.getElementById('memberProfileActionMenu');
    const panel = document.getElementById('memberProfileActionMenuPanel');
    if (!menu || !panel) return;

    panel.innerHTML = '';
    closeWorkspaceMemberProfileActionMenu();

    if (editMode) {
        menu.hidden = true;
        return;
    }

    const userId = Number(
        workspaceProfileValue(data, 'userId', 'USER_ID') || 0
    );
    const normalizedRole = String(role || 'MEMBER').toUpperCase();

    if (isMe) {
        appendWorkspaceMemberProfileMenuItem(
            panel,
            '프로필 수정',
            '',
            enterWorkspaceMemberProfileEdit,
            false
        );

        if (!isOwner) {
            appendWorkspaceMemberProfileMenuItem(
                panel,
                '그룹 나가기',
                'is-danger',
                leaveWorkspace,
                true
            );
        }

        menu.hidden = false;
        return;
    }

    if (WORKSPACE_CONFIG.isOwner && !isOwner) {
        appendWorkspaceMemberProfileMenuItem(
            panel,
            '권한 넘기기',
            '',
            function() {
                transferWorkspaceAdminFromProfile(userId);
            },
            false
        );

        appendWorkspaceMemberProfileMenuItem(
            panel,
            '내보내기',
            'is-danger',
            function() {
                removeWorkspaceMemberFromProfile(userId);
            },
            true
        );

        menu.hidden = false;
        return;
    }

    if (
        WORKSPACE_CONFIG.isAdmin
        && !isOwner
        && normalizedRole === 'MEMBER'
    ) {
        appendWorkspaceMemberProfileMenuItem(
            panel,
            '내보내기',
            'is-danger',
            function() {
                removeWorkspaceMemberFromProfile(userId);
            },
            false
        );

        menu.hidden = false;
        return;
    }

    menu.hidden = true;
}

document.addEventListener('click', function(event) {
    const menu = document.getElementById('memberProfileActionMenu');
    if (menu && !menu.contains(event.target)) {
        closeWorkspaceMemberProfileActionMenu();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeWorkspaceMemberProfileActionMenu();
    }
});

let workspaceMemberProfileSaving = false;

async function saveWorkspaceMemberProfile(event) {
    event.preventDefault();
    if (workspaceMemberProfileSaving) return;

    const useAccount = document.getElementById('profileUseAccount').checked ? 'Y' : 'N';
    const displayName = document.getElementById('profileDisplayName').value.trim();
    const contactEmail = document.getElementById('profileContactEmail').value.trim();
    const positionName = document.getElementById('profilePositionName').value.trim();
    const phoneNumber = document.getElementById('profilePhoneNumber').value.trim();

    if (useAccount === 'N' && !displayName) {
        alert('그룹 표시 이름을 입력해주세요.');
        document.getElementById('profileDisplayName').focus();
        return;
    }
    if (!contactEmail) {
        alert('그룹 이메일을 입력해주세요.');
        document.getElementById('profileContactEmail').focus();
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        alert('올바른 이메일 주소를 입력해주세요.');
        document.getElementById('profileContactEmail').focus();
        return;
    }
    if (phoneNumber && !/^[0-9+()\-\s]{7,30}$/.test(phoneNumber)) {
        alert('전화번호 형식을 확인해주세요.');
        document.getElementById('profilePhoneNumber').focus();
        return;
    }

    const formData = new FormData();
    formData.append('useAccountProfile', useAccount);
    formData.append('displayName', displayName);
    formData.append('contactEmail', contactEmail);
    formData.append('positionName', positionName);
    formData.append('phoneNumber', phoneNumber);
    formData.append(
        'showPhone',
        phoneNumber && document.getElementById('profileShowPhone').checked
            ? 'Y'
            : 'N'
    );
    formData.append(
        'showBirth',
        document.getElementById('profileShowBirth')?.checked ? 'Y' : 'N'
    );

    if (useAccount === 'N' && modalWorkspaceProfileCropper) {
        const removeProfileImage =
            modalWorkspaceProfileCropper.isRemoveRequested();
        const blob = removeProfileImage
            ? null
            : await modalWorkspaceProfileCropper.getBlob();
        const originalFile = removeProfileImage
            ? null
            : modalWorkspaceProfileCropper.getOriginalFile();
        const cropState = modalWorkspaceProfileCropper.getState();

        formData.append(
            'removeProfileImage',
            removeProfileImage ? 'Y' : 'N'
        );

        if (blob) {
            formData.append('profileImage', blob, 'workspace_profile.png');
        }
        if (originalFile) {
            formData.append('profileImageOriginal', originalFile, originalFile.name);
        }

        formData.append('profileImageCropScale', String(cropState.scale));
        formData.append('profileImageCropX', String(cropState.x));
        formData.append('profileImageCropY', String(cropState.y));
    }

    const saveButton = document.querySelector('.workspace-profile-save-button');
    workspaceMemberProfileSaving = true;
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = '저장 중...';
        saveButton.setAttribute('aria-busy', 'true');
    }

    try {
        const res = await fetch(workspacePath('/workspace/api/'
            + encodeURIComponent(WORKSPACE_CONFIG.wsId) + '/members/me/profile'), {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        });
        const result = await res.json().catch(function() { return null; });
        if (!res.ok || !result || result.success !== true) {
            throw new Error(result && result.message ? result.message : '프로필 저장에 실패했습니다.');
        }
        alert('그룹 프로필을 저장했습니다.');
        window.location.reload();
    } catch (err) {
        console.error('프로필 저장 실패:', err);
        alert(err.message || '프로필 저장 중 오류가 발생했습니다.');
        workspaceMemberProfileSaving = false;
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = '저장';
            saveButton.setAttribute('aria-busy', 'false');
        }
    }
}

function transferWorkspaceAdminFromProfile(userId) {
    if (!confirm('이 멤버에게 그룹장 권한을 넘기시겠습니까? 권한을 넘기면 본인은 일반 멤버가 됩니다.')) return;
    const params = new URLSearchParams();
    params.append('wsId', WORKSPACE_CONFIG.wsId);
    params.append('newAdminId', userId);
    fetch(workspacePath('/workspace/api/transfer-admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'success') {
            alert('그룹장 권한을 넘겼습니다.');
            location.reload();
        } else {
            alert('권한 변경에 실패했습니다.');
        }
    });
}

function removeWorkspaceMemberFromProfile(userId) {
    if (!confirm('이 멤버를 그룹에서 내보내시겠습니까?')) return;
    const params = new URLSearchParams();
    params.append('wsId', WORKSPACE_CONFIG.wsId);
    params.append('userId', userId);
    fetch(workspacePath('/workspace/api/remove-member'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(function(res) { return res.text(); })
    .then(function(result) {
        if (result === 'success') {
            alert('멤버를 그룹에서 내보냈습니다.');
            location.reload();
        } else if (result === 'owner_protected') {
            alert('그룹장은 내보낼 수 없습니다.');
        } else if (result === 'forbidden') {
            alert('이 멤버를 내보낼 권한이 없습니다.');
        } else if (result === 'member_not_found') {
            alert('그룹 멤버 정보를 찾을 수 없습니다.');
        } else {
            alert('멤버 내보내기에 실패했습니다.');
        }
    });
}

document.addEventListener('change', function(event) {
    if (event.target && event.target.id === 'profileUseAccount') {
        syncWorkspaceProfileAccountMode();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;

    const inviteModal = document.getElementById('inviteModal');
    if (inviteModal && inviteModal.style.display === 'block') {
        closeInviteModal();
        return;
    }

    closeWorkspaceMemberProfile();
});
