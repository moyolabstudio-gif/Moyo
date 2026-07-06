(() => {
    const fileInput = document.getElementById('profileFile');
    const canvas = document.getElementById('profileCanvas');
    const viewport = document.getElementById('profileViewport');
    const fallback = document.getElementById('avatarFallback');
    const nameInput = document.getElementById('userName');
    const hidden = document.getElementById('profileImageData');
    const originalHidden = document.getElementById('profileOriginalImageData');
    const cropScaleHidden = document.getElementById('profileCropScaleHidden');
    const cropXHidden = document.getElementById('profileCropX');
    const cropYHidden = document.getElementById('profileCropY');
    const avatarTypeHidden = document.getElementById('profileAvatarType');
    const removeButton = document.getElementById('removeProfile');
    const imageButton = document.querySelector('.signup-profile-editor .signup-image-button');
    const form = document.getElementById('profileForm');

    const modal = document.getElementById('profileCropModal');
    const modalViewport = document.getElementById('profileCropViewport');
    const modalCanvas = document.getElementById('profileCropCanvas');
    const modalScale = document.getElementById('profileCropScaleRange');
    const modalScaleValue = document.getElementById('profileCropScaleValue');
    const applyButton = document.querySelector('[data-profile-modal-apply]');
    const closeButtons = Array.from(document.querySelectorAll('[data-profile-modal-close]'));

    if (!fileInput || !canvas || !viewport || !fallback ||
        !nameInput || !hidden || !originalHidden || !cropScaleHidden ||
        !cropXHidden || !cropYHidden || !avatarTypeHidden || !removeButton || !form) {
        console.error('[MOYO 회원가입] 프로필 편집 요소를 찾지 못했습니다.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const PROFILE_PREVIEW_BACKGROUND = '#ffffff';

    let image = null;
    let scale = 1.15;
    let offsetX = 0;
    let offsetY = 0;

    let draftImage = null;
    let draftImageUrl = '';
    let draftOriginalDataUrl = '';
    let committedImageUrl = '';
    let committedOriginalDataUrl = '';
    let draftScale = 1.15;
    let draftOffsetX = 0;
    let draftOffsetY = 0;
    let draftUsesCommitted = false;
    let draftDragging = false;
    let draftLastX = 0;
    let draftLastY = 0;

    const updateFallback = () => {
        const value = nameInput.value.trim();
        fallback.textContent = value ? Array.from(value)[0].toUpperCase() : '모';
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const getImageDrawRect = (targetCanvas, targetImage, targetScale, offsets) => {
        const drawW = targetCanvas.width * targetScale;
        const drawH = drawW * (targetImage.naturalHeight / targetImage.naturalWidth);
        const maxX = Math.max(Math.abs(drawW - targetCanvas.width) / 2, targetCanvas.width * 0.42);
        const maxY = Math.max(Math.abs(drawH - targetCanvas.height) / 2, targetCanvas.height * 0.42);
        const xOffset = clamp(offsets.x, -maxX, maxX);
        const yOffset = clamp(offsets.y, -maxY, maxY);
        return {
            drawW,
            drawH,
            x: (targetCanvas.width - drawW) / 2 + xOffset,
            y: (targetCanvas.height - drawH) / 2 + yOffset,
            offsetX: xOffset,
            offsetY: yOffset
        };
    };

    const drawToCanvas = (targetCanvas, targetCtx, targetImage, targetScale, offsets) => {
        if (!targetCanvas || !targetCtx || !targetImage) return { x: 0, y: 0 };
        const rect = getImageDrawRect(targetCanvas, targetImage, targetScale, offsets);

        // 저장되는 최종 프로필 이미지는 회원가입 미리보기와 같은 기준으로 생성한다.
        // 투명 PNG/WEBP가 화면마다 검정/파랑 배경으로 비쳐 보이지 않도록,
        // 최종 crop 이미지 자체에 흰 배경을 포함한다.
        targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        targetCtx.save();
        targetCtx.fillStyle = PROFILE_PREVIEW_BACKGROUND;
        targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
        targetCtx.drawImage(targetImage, rect.x, rect.y, rect.drawW, rect.drawH);
        targetCtx.restore();

        return { x: rect.offsetX, y: rect.offsetY };
    };

    const drawCommitted = () => {
        if (!image) return;
        const clamped = drawToCanvas(canvas, ctx, image, scale, { x: offsetX, y: offsetY });
        offsetX = clamped.x;
        offsetY = clamped.y;
    };

    const applyCropBackground = (targetViewport, targetCanvas, imageUrl, targetScale, offsets) => {
        if (!targetViewport || !targetCanvas || !imageUrl) return;
        const ratio = targetViewport.clientWidth / targetCanvas.width;
        targetViewport.style.backgroundColor = PROFILE_PREVIEW_BACKGROUND;
        targetViewport.style.backgroundImage = `url("${imageUrl}")`;
        targetViewport.style.backgroundSize = `${targetScale * 100}% auto`;
        targetViewport.style.backgroundPosition = `calc(50% + ${offsets.x * ratio}px) calc(50% + ${offsets.y * ratio}px)`;
        targetViewport.style.backgroundRepeat = 'no-repeat';
    };

    const updateModalBackground = () => {
        if (!modalViewport || !draftImage || !modalCanvas) return;
        const clamped = getImageDrawRect(modalCanvas, draftImage, draftScale, { x: draftOffsetX, y: draftOffsetY });
        draftOffsetX = clamped.offsetX;
        draftOffsetY = clamped.offsetY;
        applyCropBackground(modalViewport, modalCanvas, draftImageUrl, draftScale, { x: draftOffsetX, y: draftOffsetY });
    };

    const updateCommittedBackground = () => {
        if (!viewport || !canvas || !image || !committedImageUrl) return;
        applyCropBackground(viewport, canvas, committedImageUrl, scale, { x: offsetX, y: offsetY });
    };

    const updateDraftScaleText = () => {
        if (!modalScaleValue || !modalScale) return;
        modalScaleValue.textContent = `${modalScale.value}%`;
    };
    const syncProfileHiddenFields = () => {
        const hasImage = Boolean(image);
        avatarTypeHidden.value = hasImage ? 'IMAGE' : 'DEFAULT';
        originalHidden.value = hasImage ? committedOriginalDataUrl : '';
        cropScaleHidden.value = hasImage ? String(scale) : '';
        cropXHidden.value = hasImage ? String(offsetX) : '';
        cropYHidden.value = hasImage ? String(offsetY) : '';
    };


    const showImage = () => {
        canvas.hidden = false;
        fallback.hidden = true;
        viewport.classList.add('has-image');
        viewport.closest('.signup-profile-editor')?.classList.add('has-photo-selected');
        if (imageButton) imageButton.textContent = '사진 조정';
    };

    const showFallback = () => {
        image = null;
        scale = 1.15;
        offsetX = 0;
        offsetY = 0;
        fileInput.value = '';
        hidden.value = '';
        originalHidden.value = '';
        cropScaleHidden.value = '';
        cropXHidden.value = '';
        cropYHidden.value = '';
        avatarTypeHidden.value = 'DEFAULT';
        committedOriginalDataUrl = '';
        draftOriginalDataUrl = '';
        draftUsesCommitted = false;
        if (imageButton) imageButton.textContent = '사진 선택';
        if (committedImageUrl) URL.revokeObjectURL(committedImageUrl);
        committedImageUrl = '';
        canvas.hidden = true;
        fallback.hidden = false;
        viewport.classList.remove('has-image');
        viewport.removeAttribute('style');
        viewport.closest('.signup-profile-editor')?.classList.remove('has-photo-selected');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateFallback();
    };

    const openModal = () => {
        if (!modal || !draftImage) return;
        modal.hidden = false;
        document.body.classList.add('signup-modal-open');
        updateModalBackground();
        modalScale?.focus({ preventScroll: true });
    };

    const closeModal = () => {
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove('signup-modal-open');
        modalViewport?.removeAttribute('style');
        if (!image) fileInput.value = '';
    };

    const clearDraftUrl = () => {
        if (draftImageUrl && !draftUsesCommitted) URL.revokeObjectURL(draftImageUrl);
        draftImageUrl = '';
        draftOriginalDataUrl = '';
        draftUsesCommitted = false;
    };

    const loadDraftImage = file => {
        clearDraftUrl();
        draftUsesCommitted = false;

        const reader = new FileReader();
        reader.onload = () => {
            draftOriginalDataUrl = String(reader.result || '');
            const objectUrl = URL.createObjectURL(file);
            const nextImage = new Image();

            nextImage.onload = () => {
                draftImage = nextImage;
                draftImageUrl = objectUrl;
                draftScale = 1.15;
                draftOffsetX = 0;
                draftOffsetY = 0;
                if (modalScale) modalScale.value = '115';
                updateDraftScaleText();
                openModal();
            };

            nextImage.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                alert('선택한 이미지를 불러오지 못했습니다.');
                if (!image) showFallback();
            };

            nextImage.src = objectUrl;
        };
        reader.onerror = () => {
            alert('선택한 이미지를 읽지 못했습니다.');
            if (!image) showFallback();
        };
        reader.readAsDataURL(file);
    };



    const openCommittedCrop = () => {
        if (!image || !committedImageUrl) return;
        draftImage = image;
        draftImageUrl = committedImageUrl;
        draftUsesCommitted = true;
        draftOriginalDataUrl = committedOriginalDataUrl;
        draftScale = scale;
        draftOffsetX = offsetX;
        draftOffsetY = offsetY;
        if (modalScale) modalScale.value = String(Math.round(draftScale * 100));
        updateDraftScaleText();
        openModal();
    };

    imageButton?.addEventListener('click', event => {
        if (!image || !committedImageUrl) return;
        event.preventDefault();
        openCommittedCrop();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
            alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.');
            fileInput.value = '';
            return;
        }

        loadDraftImage(file);
    });

    modalScale?.addEventListener('input', () => {
        if (!draftImage) return;
        draftScale = clamp(Number(modalScale.value || 115), 70, 200) / 100;
        updateDraftScaleText();
        updateModalBackground();
    });

    modalViewport?.addEventListener('pointerdown', event => {
        if (!draftImage || !modalCanvas) return;
        draftDragging = true;
        draftLastX = event.clientX;
        draftLastY = event.clientY;
        modalViewport.classList.add('is-dragging');
        modalViewport.setPointerCapture(event.pointerId);
    });

    modalViewport?.addEventListener('pointermove', event => {
        if (!draftDragging || !draftImage || !modalCanvas || !modalViewport) return;
        const ratio = modalCanvas.width / modalViewport.clientWidth;
        draftOffsetX += (event.clientX - draftLastX) * ratio;
        draftOffsetY += (event.clientY - draftLastY) * ratio;
        draftLastX = event.clientX;
        draftLastY = event.clientY;
        updateModalBackground();
    });

    const endDraftDrag = event => {
        draftDragging = false;
        modalViewport?.classList.remove('is-dragging');
        if (event?.pointerId !== undefined && modalViewport?.hasPointerCapture(event.pointerId)) {
            modalViewport.releasePointerCapture(event.pointerId);
        }
    };

    modalViewport?.addEventListener('pointerup', endDraftDrag);
    modalViewport?.addEventListener('pointercancel', endDraftDrag);

    applyButton?.addEventListener('click', () => {
        if (!draftImage) return;
        if (!draftUsesCommitted && committedImageUrl && committedImageUrl !== draftImageUrl) {
            URL.revokeObjectURL(committedImageUrl);
        }
        image = draftImage;
        committedImageUrl = draftImageUrl;
        committedOriginalDataUrl = draftOriginalDataUrl || committedOriginalDataUrl;
        draftImageUrl = '';
        draftOriginalDataUrl = '';
        draftUsesCommitted = false;
        scale = draftScale;
        offsetX = draftOffsetX;
        offsetY = draftOffsetY;
        showImage();
        drawCommitted();
        hidden.value = canvas.toDataURL('image/png');
        updateCommittedBackground();
        syncProfileHiddenFields();
        draftImage = null;
        closeModal();
    });

    const cancelDraft = () => {
        draftImage = null;
        draftScale = 1.15;
        draftOffsetX = 0;
        draftOffsetY = 0;
        draftOriginalDataUrl = '';
        clearDraftUrl();
        closeModal();
    };

    closeButtons.forEach(button => button.addEventListener('click', cancelDraft));

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal && !modal.hidden) cancelDraft();
    });

    removeButton.addEventListener('click', showFallback);
    nameInput.addEventListener('input', updateFallback);

    form.addEventListener('submit', () => {
        if (image) {
            drawCommitted();
            hidden.value = canvas.toDataURL('image/png');
        } else {
            hidden.value = '';
        }
        syncProfileHiddenFields();
    });

    const initBirthPicker = () => {
        const picker = document.querySelector('[data-birth-picker]');
        if (!picker) return;

        const profileCard = picker.closest('.signup-card-profile');
        const display = document.getElementById('birthDateDisplay');
        const valueInput = document.getElementById('birthDate');
        const typeInput = document.getElementById('birthCalendarType');
        const typeButtons = Array.from(document.querySelectorAll('[data-birth-type]'));
        const trigger = picker.querySelector('.signup-birth-trigger');
        const calendar = document.getElementById('birthCalendar');
        const monthButton = picker.querySelector('[data-birth-month]');
        const days = picker.querySelector('[data-birth-days]');
        const prev = picker.querySelector('[data-birth-prev]');
        const next = picker.querySelector('[data-birth-next]');
        const clear = picker.querySelector('[data-birth-clear]');
        const todayButton = picker.querySelector('[data-birth-today]');
        const jumpPanel = picker.querySelector('[data-birth-jump]');
        const yearGrid = picker.querySelector('[data-birth-year-grid]');
        const monthGrid = picker.querySelector('[data-birth-month-grid]');
        const yearRange = picker.querySelector('[data-birth-year-range]');
        const yearPrev = picker.querySelector('[data-birth-year-prev]');
        const yearNext = picker.querySelector('[data-birth-year-next]');
        const weekdays = picker.querySelector('.signup-birth-weekdays');
        const calendarFoot = picker.querySelector('.signup-birth-calendar-foot');

        if (!display || !valueInput || !trigger || !calendar || !monthButton ||
            !days || !prev || !next || !clear || !todayButton) return;

        const pad = number => String(number).padStart(2, '0');
        const toValue = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        const toLabel = date => `${date.getFullYear()}년 ${pad(date.getMonth() + 1)}월 ${pad(date.getDate())}일`;
        const sameDate = (a, b) => a && b &&
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();

        const now = new Date();
        let selectedDate = null;
        let viewYear = now.getFullYear();
        let viewMonth = now.getMonth();
        let birthType = typeInput?.value || 'SOLAR';

        let yearPageStart = Math.floor(viewYear / 12) * 12;

        const updateMonthTitle = () => {
            if (!monthButton) return;
            monthButton.textContent = `${viewYear}년 ${pad(viewMonth + 1)}월`;
        };

        const setJumpOpen = isOpen => {
            if (!jumpPanel) return;
            jumpPanel.hidden = !isOpen;
            if (weekdays) weekdays.hidden = isOpen;
            days.hidden = isOpen;
            if (calendarFoot) calendarFoot.hidden = isOpen;
            monthButton.setAttribute('aria-expanded', String(isOpen));
            calendar.classList.toggle('is-jump-open', isOpen);
        };

        const renderJumpPanel = () => {
            if (!jumpPanel || !yearGrid || !monthGrid || !yearRange) return;
            yearRange.textContent = `${yearPageStart}년 - ${yearPageStart + 11}년`;
            yearGrid.innerHTML = '';
            monthGrid.innerHTML = '';

            for (let year = yearPageStart; year < yearPageStart + 12; year += 1) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'signup-birth-jump-option';
                button.textContent = `${year}`;
                button.dataset.year = String(year);
                if (year === viewYear) button.classList.add('is-active');
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    viewYear = year;
                    updateMonthTitle();
                    renderJumpPanel();
                });
                yearGrid.appendChild(button);
            }

            for (let month = 0; month < 12; month += 1) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'signup-birth-jump-option signup-birth-jump-month';
                button.textContent = `${pad(month + 1)}월`;
                button.dataset.month = String(month);
                if (month === viewMonth) button.classList.add('is-active');
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    viewMonth = month;
                    updateMonthTitle();
                    setJumpOpen(false);
                    render();
                });
                monthGrid.appendChild(button);
            }
        };

        const closeJumpPanel = () => {
            setJumpOpen(false);
        };

        const toggleJumpPanel = () => {
            if (!jumpPanel) return;
            const shouldOpen = jumpPanel.hidden;
            if (shouldOpen) {
                yearPageStart = Math.floor(viewYear / 12) * 12;
                renderJumpPanel();
            }
            setJumpOpen(shouldOpen);
        };

        const syncBirthType = () => {
            if (typeInput) typeInput.value = birthType;
            typeButtons.forEach(button => {
                const isActive = button.dataset.birthType === birthType;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
        };

        const syncDisplay = () => {
            syncBirthType();
            if (selectedDate) {
                valueInput.value = toValue(selectedDate);
                display.value = toLabel(selectedDate);
            } else {
                valueInput.value = '';
                display.value = '';
            }
        };

        const render = () => {
            updateMonthTitle();
            days.innerHTML = '';
            setJumpOpen(false);

            const firstDate = new Date(viewYear, viewMonth, 1);
            const start = new Date(viewYear, viewMonth, 1 - firstDate.getDay());

            for (let i = 0; i < 42; i += 1) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'signup-birth-day';
                button.textContent = String(date.getDate());
                button.dataset.date = toValue(date);

                if (date.getMonth() !== viewMonth) button.classList.add('is-muted');
                if (sameDate(date, now)) button.classList.add('is-today');
                if (sameDate(date, selectedDate)) button.classList.add('is-selected');

                button.addEventListener('click', () => {
                    selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    viewYear = selectedDate.getFullYear();
                    viewMonth = selectedDate.getMonth();
                    syncDisplay();
                    render();
                    closeCalendar();
                });

                days.appendChild(button);
            }
        };

        const openCalendar = () => {
            picker.classList.add('is-open');
            profileCard?.classList.add('is-birth-open');
            calendar.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            render();
        };

        const closeCalendar = () => {
            picker.classList.remove('is-open');
            profileCard?.classList.remove('is-birth-open');
            calendar.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            closeJumpPanel();
        };

        const toggleCalendar = () => {
            calendar.hidden ? openCalendar() : closeCalendar();
        };

        typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                birthType = button.dataset.birthType || 'SOLAR';
                syncDisplay();
            });
        });

        display.addEventListener('click', toggleCalendar);
        trigger.addEventListener('click', toggleCalendar);
        calendar.addEventListener('click', event => event.stopPropagation());
        jumpPanel?.addEventListener('click', event => event.stopPropagation());
        monthButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            toggleJumpPanel();
        });

        yearPrev?.addEventListener('click', event => {
            event.stopPropagation();
            yearPageStart -= 12;
            renderJumpPanel();
        });

        yearNext?.addEventListener('click', event => {
            event.stopPropagation();
            yearPageStart += 12;
            renderJumpPanel();
        });

        prev.addEventListener('click', () => {
            closeJumpPanel();
            viewMonth -= 1;
            if (viewMonth < 0) {
                viewMonth = 11;
                viewYear -= 1;
            }
            render();
        });

        next.addEventListener('click', () => {
            closeJumpPanel();
            viewMonth += 1;
            if (viewMonth > 11) {
                viewMonth = 0;
                viewYear += 1;
            }
            render();
        });

        todayButton.addEventListener('click', () => {
            selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            viewYear = selectedDate.getFullYear();
            viewMonth = selectedDate.getMonth();
            syncDisplay();
            render();
            closeCalendar();
        });

        clear.addEventListener('click', () => {
            selectedDate = null;
            syncDisplay();
            render();
            closeCalendar();
        });

        document.addEventListener('click', event => {
            if (!picker.contains(event.target)) closeCalendar();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeCalendar();
        });

        syncDisplay();
    };

    initBirthPicker();
    showFallback();
})();

// auth-ui57: keep the adjusted profile crop identical across preview and saved image.
