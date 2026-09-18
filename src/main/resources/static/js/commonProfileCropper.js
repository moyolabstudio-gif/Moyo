'use strict';

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

        // 프로필 편집 프레임의 안전한 기본 크기.
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


window.createProfileCropper = createProfileCropper;
