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
        startY: 0
    };

    function revokeLocalUrl() {
        if (state.localUrl) {
            URL.revokeObjectURL(state.localUrl);
            state.localUrl = '';
        }
    }

    function calculateBaseSize() {
        const viewWidth = viewport.clientWidth || 112;
        const viewHeight = viewport.clientHeight || viewWidth;
        if (!image.naturalWidth || !image.naturalHeight) return;

        const imageRatio = image.naturalWidth / image.naturalHeight;
        const viewRatio = viewWidth / viewHeight;

        // 확대값 1에서는 미리보기 영역을 빈 공간 없이 정확히 채우는 cover 기준.
        if (imageRatio >= viewRatio) {
            state.baseHeight = viewHeight;
            state.baseWidth = viewHeight * imageRatio;
        } else {
            state.baseWidth = viewWidth;
            state.baseHeight = viewWidth / imageRatio;
        }

        image.style.width = state.baseWidth + 'px';
        image.style.height = state.baseHeight + 'px';
        image.style.minWidth = '0';
        image.style.minHeight = '0';
        image.style.maxWidth = 'none';
        image.style.maxHeight = 'none';
        image.style.objectFit = 'cover';
    }

    function render() {
        if (image.hidden) return;
        image.style.transform =
            'translate(-50%, -50%) translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')';
    }

    function showPlaceholder() {
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

        const applyReady = function() {
            calculateBaseSize();
            image.hidden = false;
            placeholder.hidden = true;
            viewport.classList.add('has-image');
            viewport.style.cursor = state.mode === 'custom' ? 'grab' : 'default';
            requestAnimationFrame(render);
        };

        image.onload = applyReady;
        image.src = src;

        if (image.complete && image.naturalWidth) {
            applyReady();
        }
    }

    function refreshDisplay() {
        if (state.mode === 'account') {
            showPlaceholder();
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
        if (fallbackText !== undefined) state.fallbackText = fallbackText || '?';
        if (fileInput) fileInput.disabled = state.mode === 'account';
        if (zoom) zoom.disabled = state.mode === 'account';
        refreshDisplay();
    }

    function setFallbackText(text) {
        state.fallbackText = text || '?';
        if (state.mode === 'account' || (!state.localUrl && !state.externalSrc)) {
            showPlaceholder();
        }
    }

    function setExistingImage(src) {
        state.externalSrc = src || '';
        if (!state.localUrl) refreshDisplay();
    }

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;

            revokeLocalUrl();
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
            render();
        });
    }

    function onPointerMove(e) {
        if (!state.dragging || state.mode !== 'custom') return;
        state.x = state.startX + (e.clientX - state.startPointerX);
        state.y = state.startY + (e.clientY - state.startPointerY);
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

    async function getBlob() {
        if (image.hidden || !image.naturalWidth) return null;

        const outputWidth = config.outputWidth || 512;
        const outputHeight = config.outputHeight || outputWidth;
        const viewWidth = viewport.clientWidth || 112;
        const viewHeight = viewport.clientHeight || viewWidth;
        const drawWidth = state.baseWidth * state.scale;
        const drawHeight = state.baseHeight * state.scale;
        const drawX = (viewWidth - drawWidth) / 2 + state.x;
        const drawY = (viewHeight - drawHeight) / 2 + state.y;

        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');
        const ratioX = outputWidth / viewWidth;
        const ratioY = outputHeight / viewHeight;
        ctx.scale(ratioX, ratioY);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        return await new Promise(function(resolve) {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    return {
        getBlob: getBlob,
        setMode: setMode,
        setFallbackText: setFallbackText,
        setExistingImage: setExistingImage
    };
}



function createWorkspaceImageEditor() {
    const fileInput = document.getElementById('wsImage');
    const previewImage = document.getElementById('workspacePreviewImage');
    const placeholder = document.getElementById('workspaceImagePlaceholder');
    const defaultMascot = document.getElementById('workspaceDefaultMascot');
    const selectLabel = document.getElementById('workspaceImageSelectLabel');
    const adjustButton = document.getElementById('workspaceImageAdjustButton');
    const defaultButton = document.getElementById('workspaceImageDefaultButton');
    const modal = document.getElementById('workspaceImageCropModal');
    const viewport = document.getElementById('workspaceImageCropViewport');
    const image = document.getElementById('workspaceImageCropImage');
    const scaleRange = document.getElementById('workspaceImageScale');
    const scaleValue = document.getElementById('workspaceImageScaleValue');
    const applyButton = document.getElementById('workspaceImageApplyButton');

    let sourceUrl = '', committedBlob = null, committedPreviewUrl = '';
    let scale = 1.15, offsetX = 0, offsetY = 0, baseWidth = 0, baseHeight = 0;
    let dragging = false, lastX = 0, lastY = 0;

    function calculateBaseSize() {
        const size = viewport.clientWidth || 250;
        if (!image.naturalWidth || !image.naturalHeight) return;
        const ratio = image.naturalWidth / image.naturalHeight;
        if (ratio >= 1) { baseHeight = size; baseWidth = size * ratio; }
        else { baseWidth = size; baseHeight = size / ratio; }
        image.style.width = baseWidth + 'px'; image.style.height = baseHeight + 'px';
    }
    function render() { image.style.transform = 'translate(-50%, -50%) translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')'; }
    function open(reset) {
        if (!sourceUrl) return;
        if (reset) { scale = 1.15; offsetX = 0; offsetY = 0; scaleRange.value = '115'; }
        scaleValue.textContent = Math.round(scale * 100) + '%';
        image.onload = function(){ calculateBaseSize(); render(); };
        image.src = sourceUrl;
        if (image.complete && image.naturalWidth) { calculateBaseSize(); render(); }
        modal.hidden = false; document.body.classList.add('profile-crop-open');
    }
    function close(){ modal.hidden = true; document.body.classList.remove('profile-crop-open'); }
    function reset(){
        committedBlob = null; fileInput.value = '';
        if (sourceUrl.startsWith('blob:')) URL.revokeObjectURL(sourceUrl); sourceUrl = '';
        if (committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl); committedPreviewUrl = '';
        previewImage.hidden = true; previewImage.removeAttribute('src');
        adjustButton.hidden = true; selectLabel.textContent = '이미지 변경';
        syncWorkspaceFallback();
    }
    async function createBlob(){
        if (!image.naturalWidth) return null;
        const size = viewport.clientWidth || 250;
        const drawWidth = baseWidth * scale, drawHeight = baseHeight * scale;
        const drawX = (size - drawWidth) / 2 + offsetX, drawY = (size - drawHeight) / 2 + offsetY;
        const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
        const ctx = canvas.getContext('2d'); const ratio = 600 / size; ctx.scale(ratio, ratio);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }
    fileInput.addEventListener('change', function(){
        const file = fileInput.files && fileInput.files[0]; if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.'); fileInput.value=''; return; }
        if (sourceUrl.startsWith('blob:')) URL.revokeObjectURL(sourceUrl);
        sourceUrl = URL.createObjectURL(file); open(true);
    });
    adjustButton.addEventListener('click', () => open(false));
    defaultButton.addEventListener('click', reset);
    const workspaceNameInput = document.getElementById('wsName');
    function syncWorkspaceFallback(){
        const name = (workspaceNameInput?.value || '').trim();
        const hasName = name.length > 0;
        placeholder.textContent = hasName ? Array.from(name)[0].toUpperCase() : '';
        placeholder.hidden = !hasName;
        if (defaultMascot) defaultMascot.hidden = hasName;
    }
    workspaceNameInput?.addEventListener('input', syncWorkspaceFallback);
    syncWorkspaceFallback();
    document.querySelectorAll('[data-workspace-image-close]').forEach(el => el.addEventListener('click', close));
    scaleRange.addEventListener('input', function(){ scale = Number(scaleRange.value || 115)/100; scaleValue.textContent = scaleRange.value + '%'; render(); });
    viewport.addEventListener('pointerdown', function(e){ dragging=true; viewport.classList.add('is-dragging'); lastX=e.clientX; lastY=e.clientY; viewport.setPointerCapture?.(e.pointerId); });
    viewport.addEventListener('pointermove', function(e){ if(!dragging)return; offsetX += e.clientX-lastX; offsetY += e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; render(); });
    function end(e){ dragging=false; viewport.classList.remove('is-dragging'); if(e?.pointerId!==undefined&&viewport.hasPointerCapture?.(e.pointerId)) viewport.releasePointerCapture(e.pointerId); }
    viewport.addEventListener('pointerup', end); viewport.addEventListener('pointercancel', end);
    applyButton.addEventListener('click', async function(){
        const blob = await createBlob(); if(!blob)return; committedBlob=blob;
        if(committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl); committedPreviewUrl=URL.createObjectURL(blob);
        previewImage.src=committedPreviewUrl; previewImage.hidden=false; placeholder.hidden=true; if(defaultMascot) defaultMascot.hidden=true;
        adjustButton.hidden=false; selectLabel.textContent='이미지 변경'; close();
    });
    return { getBlob(){ return Promise.resolve(committedBlob); } };
}

function createAccountStyleProfileEditor() {
    const fileInput = document.getElementById('createProfileImageInput');
    const previewImage = document.getElementById('groupProfilePreviewImage');
    const fallback = document.getElementById('groupProfileFallback');
    const selectLabel = document.getElementById('groupProfileSelectLabel');
    const adjustButton = document.getElementById('groupProfileAdjustButton');
    const defaultButton = document.getElementById('groupProfileDefaultButton');
    const modal = document.getElementById('groupProfileCropModal');
    const cropViewport = document.getElementById('groupProfileCropViewport');
    const cropImage = document.getElementById('groupProfileCropImage');
    const scaleRange = document.getElementById('groupProfileScale');
    const scaleValue = document.getElementById('groupProfileScaleValue');
    const applyButton = document.getElementById('groupProfileApplyButton');

    let mode = 'custom';
    let fallbackText = '?';
    let sourceUrl = '';
    let committedBlob = null;
    let committedPreviewUrl = '';
    let scale = 1.15;
    let offsetX = 0;
    let offsetY = 0;
    let baseWidth = 0;
    let baseHeight = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function updateFallback() {
        fallback.textContent = fallbackText || '?';
        if (!committedPreviewUrl) {
            fallback.hidden = false;
            previewImage.hidden = true;
        }
    }

    function calculateBaseSize() {
        const size = cropViewport.clientWidth || 320;
        if (!cropImage.naturalWidth || !cropImage.naturalHeight) return;
        const ratio = cropImage.naturalWidth / cropImage.naturalHeight;
        if (ratio >= 1) {
            baseHeight = size;
            baseWidth = size * ratio;
        } else {
            baseWidth = size;
            baseHeight = size / ratio;
        }
        cropImage.style.width = baseWidth + 'px';
        cropImage.style.height = baseHeight + 'px';
    }

    function renderCrop() {
        cropImage.style.transform = 'translate(-50%, -50%) translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')';
    }

    function openModal(reset) {
        if (!sourceUrl || mode !== 'custom') return;
        if (reset) {
            scale = 1.15;
            offsetX = 0;
            offsetY = 0;
            scaleRange.value = '115';
        }
        scaleValue.textContent = Math.round(scale * 100) + '%';
        cropImage.onload = function() {
            calculateBaseSize();
            renderCrop();
        };
        cropImage.src = sourceUrl;
        if (cropImage.complete && cropImage.naturalWidth) {
            calculateBaseSize();
            renderCrop();
        }
        modal.hidden = false;
        document.body.classList.add('profile-crop-open');
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove('profile-crop-open');
    }

    function resetToAvatar() {
        committedBlob = null;
        sourceUrl = '';
        fileInput.value = '';
        if (committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl);
        committedPreviewUrl = '';
        previewImage.removeAttribute('src');
        previewImage.hidden = true;
        fallback.hidden = false;
        adjustButton.hidden = true;
        selectLabel.textContent = '사진 선택';
        updateFallback();
    }

    async function createBlob() {
        if (!cropImage.naturalWidth) return null;
        const viewSize = cropViewport.clientWidth || 320;
        const drawWidth = baseWidth * scale;
        const drawHeight = baseHeight * scale;
        const drawX = (viewSize - drawWidth) / 2 + offsetX;
        const drawY = (viewSize - drawHeight) / 2 + offsetY;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const ratio = 512 / viewSize;
        ctx.scale(ratio, ratio);
        // 계정 프로필 생성과 동일하게 투명 이미지의 빈 영역은 흰색으로 저장한다.
        ctx.clearRect(0, 0, viewSize, viewSize);
        ctx.drawImage(cropImage, drawX, drawY, drawWidth, drawHeight);
        return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }

    fileInput.addEventListener('change', function() {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
            alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.');
            fileInput.value = '';
            return;
        }
        if (sourceUrl && sourceUrl.startsWith('blob:')) URL.revokeObjectURL(sourceUrl);
        sourceUrl = URL.createObjectURL(file);
        openModal(true);
    });

    adjustButton.addEventListener('click', function() { openModal(false); });
    defaultButton.addEventListener('click', resetToAvatar);
    document.querySelectorAll('[data-group-profile-close]').forEach(el => el.addEventListener('click', closeModal));

    scaleRange.addEventListener('input', function() {
        scale = Number(scaleRange.value || 115) / 100;
        scaleValue.textContent = scaleRange.value + '%';
        renderCrop();
    });

    cropViewport.addEventListener('pointerdown', function(event) {
        dragging = true;
        cropViewport.classList.add('is-dragging');
        lastX = event.clientX;
        lastY = event.clientY;
        cropViewport.setPointerCapture?.(event.pointerId);
    });
    cropViewport.addEventListener('pointermove', function(event) {
        if (!dragging) return;
        offsetX += event.clientX - lastX;
        offsetY += event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        renderCrop();
    });
    function endDrag(event) {
        dragging = false;
        cropViewport.classList.remove('is-dragging');
        if (event?.pointerId !== undefined && cropViewport.hasPointerCapture?.(event.pointerId)) {
            cropViewport.releasePointerCapture(event.pointerId);
        }
    }
    cropViewport.addEventListener('pointerup', endDrag);
    cropViewport.addEventListener('pointercancel', endDrag);

    applyButton.addEventListener('click', async function() {
        const blob = await createBlob();
        if (!blob) return;
        committedBlob = blob;
        if (committedPreviewUrl) URL.revokeObjectURL(committedPreviewUrl);
        committedPreviewUrl = URL.createObjectURL(blob);
        previewImage.src = committedPreviewUrl;
        previewImage.hidden = false;
        fallback.hidden = true;
        adjustButton.hidden = false;
        selectLabel.textContent = '사진 다시 선택';
        closeModal();
    });

    return {
        setMode(nextMode, text) {
            mode = nextMode === 'account' ? 'account' : 'custom';
            fallbackText = text || '?';
            document.getElementById('profileAccountEditor').classList.toggle('is-disabled', mode === 'account');
            updateFallback();
        },
        setFallbackText(text) {
            fallbackText = text || '?';
            updateFallback();
        },
        getBlob() { return Promise.resolve(committedBlob); }
    };
}

const workspaceLinkController = window.MoyoCreate.createLinkList({
    list: '#workspaceLinkList',
    count: '#workspaceLinkCount',
    empty: '#workspaceLinkEmpty',
    addButton: '#workspaceLinkAdd',
    error: '#workspaceLinkError',
    rowSelector: '.workspace-link-row',
    rowClass: 'workspace-link-row moyo-create-link-row',
    nameSelector: '.workspace-link-name',
    nameClass: 'workspace-link-name moyo-create-control moyo-create-link-name',
    urlSelector: '.workspace-link-url',
    urlClass: 'workspace-link-url moyo-create-control moyo-create-link-url',
    removeClass: 'workspace-link-remove moyo-create-link-remove',
    max: 5
});

function validateWorkspaceLinks() {
    return workspaceLinkController ? workspaceLinkController.validate() : true;
}

(function() {
    const workspaceStep = document.getElementById('workspaceStep');
    const profileStep = document.getElementById('profileStep');
    const createStepLabel = document.getElementById('workspaceCreateStepLabel');
    const createTitle = document.getElementById('workspaceCreateTitle');
    const createSubTitle = document.getElementById('workspaceCreateSubTitle');
    const createWrap = document.querySelector('.create-wrap');
    const accountName = createWrap.dataset.accountName || '';
    const accountEmail = createWrap.dataset.accountEmail || '';
    const accountBirthDate = createWrap.dataset.accountBirth || '';
    const accountBirthType = (createWrap.dataset.accountBirthType || 'SOLAR').toUpperCase();
    const workspaceImageEditor = createWorkspaceImageEditor();
    const cropper = createAccountStyleProfileEditor();

    // MOYO 사람 기본 아바타 정책: 실제 사진 우선, 없으면 원형 MOYO 그라데이션 + 이름 첫 글자.
    document.getElementById('groupProfileFallback').textContent =
        accountName ? Array.from(accountName)[0] : '?';
    document.getElementById('profileDisplayName').value = accountName;
    document.getElementById('profileContactEmail').value = accountEmail;


    const emailInput = document.getElementById('profileContactEmail');
    const emailStatus = document.getElementById('profileEmailStatus');
    const emailVerifyButton = document.getElementById('profileEmailVerifyButton');
    const emailCodeRow = document.getElementById('profileEmailCodeRow');
    const emailCodeInput = document.getElementById('profileEmailCode');
    const emailCodeVerifyButton = document.getElementById('profileEmailCodeVerifyButton');
    const emailMessage = document.getElementById('profileEmailMessage');
    const phoneInput = document.getElementById('profilePhoneNumber');
    const showEmailInput = document.getElementById('profileShowEmail');
    const showPhoneInput = document.getElementById('profileShowPhone');
    const showBirthInput = document.getElementById('profileShowBirth');
    const birthValue = document.getElementById('profileBirthValue');
    const birthType = document.getElementById('profileBirthType');

    let verifiedProfileEmail = accountEmail.trim().toLowerCase();

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function setEmailState() {
        const email = normalizeEmail(emailInput?.value);
        const account = normalizeEmail(accountEmail);
        const verified = !!email && (email === account || email === verifiedProfileEmail);

        if (!emailStatus || !emailVerifyButton || !emailMessage) return verified;
        emailStatus.classList.toggle('is-verified', verified);
        emailStatus.classList.toggle('is-warning', !!email && !verified);

        if (!email) {
            emailStatus.className = 'profile-contact-status';
            emailStatus.textContent = '미입력';
            emailVerifyButton.hidden = true;
            emailCodeRow.hidden = true;
            emailMessage.textContent = '이메일을 입력하면 그룹 멤버 공개 여부를 선택할 수 있어요.';
            return false;
        }

        if (verified) {
            emailStatus.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> 인증됨';
            emailVerifyButton.hidden = true;
            emailCodeRow.hidden = true;
            emailMessage.textContent = email === account
                ? '계정 이메일은 추가 인증 없이 사용할 수 있어요.'
                : '인증된 이메일입니다.';
            return true;
        }

        emailStatus.textContent = '인증 필요';
        emailVerifyButton.hidden = false;
        emailCodeRow.hidden = true;
        emailMessage.textContent = '계정과 다른 이메일은 인증 후 그룹 프로필에 반영됩니다.';
        return false;
    }

    function renderBirth() {
        if (!birthValue || !birthType) return;
        const raw = String(accountBirthDate || '').trim();
        if (!raw) {
            birthValue.textContent = '등록된 생일 없음';
            birthType.textContent = '';
            if (showBirthInput) { showBirthInput.checked = false; showBirthInput.disabled = true; }
            return;
        }
        if (showBirthInput) showBirthInput.disabled = false;
        const matched = raw.match(/^(?:\d{4}[-./])?(\d{1,2})[-./](\d{1,2})/);
        birthValue.textContent = matched
            ? String(Number(matched[1])).padStart(2, '0') + '.' + String(Number(matched[2])).padStart(2, '0')
            : raw;
        birthType.innerHTML = accountBirthType === 'LUNAR'
            ? '<i class="fa-regular fa-moon" aria-hidden="true"></i>'
            : '<i class="fa-regular fa-sun" aria-hidden="true"></i>';
        birthType.setAttribute('aria-label', accountBirthType === 'LUNAR' ? '음력' : '양력');
    }

    emailInput?.addEventListener('input', function() {
        const email = normalizeEmail(this.value);
        if (email !== normalizeEmail(verifiedProfileEmail)) {
            emailCodeInput.value = '';
        }
        setEmailState();
    });

    emailVerifyButton?.addEventListener('click', function() {
        const email = normalizeEmail(emailInput.value);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailMessage.textContent = '올바른 이메일 형식을 입력해주세요.';
            emailMessage.classList.add('is-error');
            emailInput.focus();
            return;
        }
        emailMessage.classList.remove('is-error');
        emailVerifyButton.disabled = true;
        fetch('/users/email-verification/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
            body: new URLSearchParams({email})
        }).then(async function(res) {
            const data = await res.json().catch(function(){ return {}; });
            if (!res.ok || !data.success) throw new Error(data.message || '인증번호 발송에 실패했습니다.');
            emailCodeRow.hidden = false;
            emailMessage.textContent = data.message || '인증번호를 발송했습니다.';
            emailCodeInput.focus();
        }).catch(function(error) {
            emailMessage.textContent = error.message || '인증번호 발송에 실패했습니다.';
            emailMessage.classList.add('is-error');
        }).finally(function() {
            emailVerifyButton.disabled = false;
        });
    });

    emailCodeVerifyButton?.addEventListener('click', function() {
        const email = normalizeEmail(emailInput.value);
        const code = String(emailCodeInput.value || '').trim();
        if (!/^\d{6}$/.test(code)) {
            emailMessage.textContent = '인증번호 6자리를 입력해주세요.';
            emailMessage.classList.add('is-error');
            emailCodeInput.focus();
            return;
        }
        emailCodeVerifyButton.disabled = true;
        fetch('/users/email-verification/verify', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
            body: new URLSearchParams({email, code})
        }).then(async function(res) {
            const data = await res.json().catch(function(){ return {}; });
            if (!res.ok || !data.success) throw new Error(data.message || '이메일 인증에 실패했습니다.');
            verifiedProfileEmail = email;
            emailMessage.classList.remove('is-error');
            setEmailState();
        }).catch(function(error) {
            emailMessage.textContent = error.message || '이메일 인증에 실패했습니다.';
            emailMessage.classList.add('is-error');
        }).finally(function() {
            emailCodeVerifyButton.disabled = false;
        });
    });

    phoneInput?.addEventListener('input', function() {
        if (showPhoneInput && !this.value.trim()) showPhoneInput.checked = false;
    });


    renderBirth();
    setEmailState();

    window.MoyoCreate.bindCounter('#wsName', '#workspaceNameCount');
    window.MoyoCreate.bindCounter('#wsDesc', '#workspaceDescCount');

    window.MoyoCreate.bindSingleSelect({
        input: '#wsType',
        buttons: '[data-workspace-type]',
        dataAttribute: 'data-workspace-type',
        defaultValue: 'COMMUNITY'
    });



    function syncProfileMode() {
        const useAccount = $('input[name="profileMode"]:checked').val() === 'Y';
        const avatarText = accountName ? Array.from(accountName)[0].toUpperCase() : '?';
        const accountSummary = document.getElementById('profileAccountSummary');
        const customFields = document.getElementById('profileCustomFields');
        const summaryAvatarFallback = document.getElementById('profileAccountSummaryAvatarFallback');

        if (accountSummary) accountSummary.hidden = !useAccount;
        if (customFields) customFields.hidden = useAccount;
        if (summaryAvatarFallback) summaryAvatarFallback.textContent = avatarText;
        if (emailInput) emailInput.readOnly = useAccount;

        cropper.setMode(useAccount ? 'account' : 'custom', avatarText);

        if (useAccount) {
            $('#profileDisplayName').val(accountName);
            $('#profileContactEmail').val(accountEmail);
            verifiedProfileEmail = normalizeEmail(accountEmail);
            setEmailState();
        } else {
            if (!$('#profileDisplayName').val().trim()) $('#profileDisplayName').val(accountName);
            if (!$('#profileContactEmail').val().trim()) $('#profileContactEmail').val(accountEmail);
        }
    }

    $('input[name="profileMode"]').on('change', syncProfileMode);
    $('#profileDisplayName').on('input', function() {
        const value = $(this).val().trim();
        cropper.setFallbackText(value ? value.substring(0, 1) : (accountName ? accountName.substring(0, 1) : '?'));
    });
    syncProfileMode();

    function setCreateStep(step) {
        const isProfileStep = step === 2;
        workspaceStep.hidden = isProfileStep;
        profileStep.hidden = !isProfileStep;
        workspaceStep.classList.toggle('is-active', !isProfileStep);
        profileStep.classList.toggle('is-active', isProfileStep);
        createStepLabel.textContent = isProfileStep ? '2 / 2' : '1 / 2';
        createTitle.textContent = isProfileStep ? '그룹에서 사용할 프로필' : '새 그룹 만들기';
        createSubTitle.textContent = isProfileStep
            ? '계정 프로필을 그대로 사용하거나, 이 그룹에서 사용할 별도 프로필을 만들 수 있어요.'
            : '그룹 정보를 입력한 다음, 이 그룹에서 사용할 프로필을 선택합니다.';
    }

    $('#btnNext').on('click', function() {
        if (!$('#wsName').val().trim()) {
            alert('그룹 이름을 입력해주세요.');
            $('#wsName').focus();
            return;
        }
        if (!validateWorkspaceLinks()) return;
        setCreateStep(2);
    });

    $('#btnBack').on('click', function() {
        setCreateStep(1);
    });

    $('#btnCreate').on('click', async function() {
        const useAccount = $('input[name="profileMode"]:checked').val();
        const displayName = $('#profileDisplayName').val().trim();
        const contactEmail = $('#profileContactEmail').val().trim();
        const emailVerified = useAccount === 'Y' || setEmailState();

        if (useAccount === 'N' && !displayName) {
            alert('그룹 표시 이름을 입력해주세요.');
            $('#profileDisplayName').focus();
            return;
        }

        if (!validateWorkspaceLinks()) return;

        const formData = new FormData();
        formData.append('wsName', $('#wsName').val().trim());
        formData.append('wsDescription', $('#wsDesc').val().trim());
        formData.append('wsType', $('#wsType').val());
        formData.append('joinType', $('input[name="joinType"]:checked').val() || 'OPEN');
        (workspaceLinkController ? workspaceLinkController.collect() : []).forEach(function(link) {
            formData.append('linkName', link.linkName);
            formData.append('linkUrl', link.linkUrl);
        });
        formData.append('useAccountProfile', useAccount);
        formData.append('displayName', displayName);
        formData.append('contactEmail', emailVerified ? contactEmail : '');
        formData.append('positionName', $('#profilePositionName').val().trim());
        formData.append('introText', $('#profileIntroText').val().trim());
        formData.append('phoneNumber', $('#profilePhoneNumber').val().trim());
        formData.append('showEmail', $('#profileShowEmail').is(':checked') ? 'Y' : 'N');
        formData.append('showPhone', $('#profileShowPhone').is(':checked') && $('#profilePhoneNumber').val().trim() ? 'Y' : 'N');
        formData.append('showBirth', $('#profileShowBirth').is(':checked') && !!accountBirthDate ? 'Y' : 'N');

        const workspaceBlob = await workspaceImageEditor.getBlob();
        if (workspaceBlob) {
            formData.append('wsImage', workspaceBlob, 'workspace_image.png');
        }

        if (useAccount === 'N') {
            const blob = await cropper.getBlob();
            if (blob) formData.append('profileImage', blob, 'workspace_profile.png');
        }

        const button = this;
        window.MoyoCreate.setButtonBusy(button, true, { busy: '생성 중...', idle: '그룹 생성' });

        $.ajax({
            url: '/workspace/api/create',
            type: 'POST',
            processData: false,
            contentType: false,
            data: formData,
            success: function(res) {
                if (res.status === 'success') {
                    location.href = res.redirectUrl || ('/workspace/main?wsId=' + res.wsId);
                    return;
                }
                alert(res.message || '그룹 생성에 실패했습니다.');
            },
            error: function(xhr) {
                const message = xhr.responseJSON?.message || '그룹 생성 중 서버 오류가 발생했습니다.';
                alert(message);
            },
            complete: function() {
                window.MoyoCreate.setButtonBusy(button, false, { idle: '그룹 생성' });
            }
        });
    });
})();
