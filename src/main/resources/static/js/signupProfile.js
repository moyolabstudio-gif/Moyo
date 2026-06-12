(() => {
    const fileInput = document.getElementById('profileFile');
    const canvas = document.getElementById('profileCanvas');
    const viewport = document.getElementById('profileViewport');
    const zoom = document.getElementById('profileZoom');
    const fallback = document.getElementById('avatarFallback');
    const nameInput = document.getElementById('userName');
    const hidden = document.getElementById('profileImageData');
    const removeButton = document.getElementById('removeProfile');
    const form = document.getElementById('profileForm');

    if (!fileInput || !canvas || !viewport || !zoom || !fallback ||
        !nameInput || !hidden || !removeButton || !form) {
        console.error('[MOYO 회원가입] 프로필 편집 요소를 찾지 못했습니다.');
        return;
    }

    const ctx = canvas.getContext('2d');
    let image = null;
    let scale = 1;
    let minScale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const updateFallback = () => {
        const value = nameInput.value.trim();
        fallback.textContent = value ? Array.from(value)[0].toUpperCase() : 'M';
    };

    const clampOffsets = () => {
        if (!image) return;
        const drawW = image.naturalWidth * scale;
        const drawH = image.naturalHeight * scale;
        const maxX = Math.max(0, (drawW - canvas.width) / 2);
        const maxY = Math.max(0, (drawH - canvas.height) / 2);
        offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
        offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
    };

    const draw = () => {
        if (!image) return;
        clampOffsets();

        const drawW = image.naturalWidth * scale;
        const drawH = image.naturalHeight * scale;
        const x = (canvas.width - drawW) / 2 + offsetX;
        const y = (canvas.height - drawH) / 2 + offsetY;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, x, y, drawW, drawH);
    };

    const showImage = () => {
        canvas.hidden = false;
        fallback.hidden = true;
        viewport.classList.add('has-image');
        zoom.disabled = false;
    };

    const showFallback = () => {
        image = null;
        fileInput.value = '';
        hidden.value = '';
        zoom.value = '1';
        zoom.disabled = true;
        canvas.hidden = true;
        fallback.hidden = false;
        viewport.classList.remove('has-image', 'is-dragging');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateFallback();
    };

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
            alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.');
            showFallback();
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const nextImage = new Image();

        nextImage.onload = () => {
            URL.revokeObjectURL(objectUrl);
            image = nextImage;
            minScale = Math.max(
                canvas.width / image.naturalWidth,
                canvas.height / image.naturalHeight
            );
            scale = minScale;
            offsetX = 0;
            offsetY = 0;
            zoom.value = '1';
            showImage();
            draw();
        };

        nextImage.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            alert('선택한 이미지를 불러오지 못했습니다.');
            showFallback();
        };

        nextImage.src = objectUrl;
    });

    zoom.addEventListener('input', () => {
        if (!image) return;
        scale = minScale * Number(zoom.value);
        draw();
    });

    viewport.addEventListener('pointerdown', event => {
        if (!image) return;
        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener('pointermove', event => {
        if (!dragging || !image) return;
        const ratio = canvas.width / viewport.clientWidth;
        offsetX += (event.clientX - lastX) * ratio;
        offsetY += (event.clientY - lastY) * ratio;
        lastX = event.clientX;
        lastY = event.clientY;
        draw();
    });

    const endDrag = event => {
        dragging = false;
        viewport.classList.remove('is-dragging');
        if (event?.pointerId !== undefined && viewport.hasPointerCapture(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId);
        }
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    removeButton.addEventListener('click', showFallback);
    nameInput.addEventListener('input', updateFallback);

    form.addEventListener('submit', () => {
        hidden.value = image ? canvas.toDataURL('image/jpeg', 0.9) : '';
    });

    showFallback();
})();
