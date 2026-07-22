(() => {
    const shell = document.querySelector('.profile-shell');
    const contextPath = shell?.dataset.contextPath || '';

    let profileEditSession = { begin() {}, cancel() {}, commit() {} };

    const panels = {
        edit: document.getElementById('profileEditPanel'),
        privacy: document.getElementById('profilePrivacyPanel'),
        notification: document.getElementById('profileNotificationPanel'),
        settings: document.getElementById('profileSettingsPanel')
    };

    const openPanel = key => {
        const panel = panels[key];
        if (!panel) return;
        Object.values(panels).forEach(item => {
            if (item && item !== panel) item.hidden = true;
        });
        if (key === 'edit') profileEditSession.begin();
        panel.hidden = false;
        document.body.classList.add('profile-sheet-open');
        panel.querySelector('input, button, [href]')?.focus({ preventScroll: true });
    };

    const closePanels = () => {
        if (panels.edit && !panels.edit.hidden) profileEditSession.cancel();
        Object.values(panels).forEach(panel => {
            if (panel) panel.hidden = true;
        });
        document.body.classList.remove('profile-sheet-open');
    };

    const menuToggle = document.querySelector('[data-profile-menu-toggle]');
    const profileMenu = document.querySelector('[data-profile-menu]');

    const closeProfileMenu = () => {
        if (!profileMenu || !menuToggle) return;
        profileMenu.hidden = true;
        menuToggle.setAttribute('aria-expanded', 'false');
    };

    const toggleProfileMenu = event => {
        event.stopPropagation();
        if (!profileMenu || !menuToggle) return;
        const willOpen = profileMenu.hidden;
        profileMenu.hidden = !willOpen;
        menuToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };

    menuToggle?.addEventListener('click', toggleProfileMenu);

    document.addEventListener('click', event => {
        if (!profileMenu || profileMenu.hidden) return;
        if (event.target.closest('.profile-more-wrap')) return;
        closeProfileMenu();
    });

    document.querySelectorAll('[data-open-panel]').forEach(button => {
        button.addEventListener('click', () => {
            closeProfileMenu();
            openPanel(button.dataset.openPanel);
        });
    });

    document.querySelectorAll('[data-close-panel]').forEach(button => {
        button.addEventListener('click', closePanels);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const cropModal = document.getElementById('profileCropModal');
            if (cropModal && !cropModal.hidden) return;
            closeProfileMenu();
            closeRelationMenu();
            closePanels();
        }
    });

    const initProfileBirthPicker = () => {
        const picker = document.querySelector('[data-birth-picker]');
        if (!picker) return;

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
        const parseValue = value => {
            if (!value) return null;
            const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const now = new Date();
        let selectedDate = parseValue(valueInput.value);
        let viewYear = selectedDate ? selectedDate.getFullYear() : now.getFullYear();
        let viewMonth = selectedDate ? selectedDate.getMonth() : now.getMonth();
        let birthType = typeInput?.value || 'SOLAR';
        let yearPageStart = Math.floor(viewYear / 12) * 12;

        const updateMonthTitle = () => {
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

        const closeJumpPanel = () => setJumpOpen(false);
        const toggleJumpPanel = () => {
            const shouldOpen = jumpPanel?.hidden;
            if (shouldOpen) {
                yearPageStart = Math.floor(viewYear / 12) * 12;
                renderJumpPanel();
            }
            setJumpOpen(Boolean(shouldOpen));
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
            calendar.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            render();
        };

        const closeCalendar = () => {
            picker.classList.remove('is-open');
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
        picker.addEventListener('profile-birth-reset', () => {
            selectedDate = parseValue(valueInput.value);
            birthType = typeInput?.value || 'SOLAR';
            viewYear = selectedDate ? selectedDate.getFullYear() : now.getFullYear();
            viewMonth = selectedDate ? selectedDate.getMonth() : now.getMonth();
            yearPageStart = Math.floor(viewYear / 12) * 12;
            syncDisplay();
            render();
            closeCalendar();
        });

        syncDisplay();
    };

    initProfileBirthPicker();

    const fileInput = document.getElementById('profileFile');
    const canvas = document.getElementById('profileCanvas');
    const viewport = document.getElementById('profileViewport');
    const fallback = document.getElementById('avatarFallback');
    const currentProfileImage = document.getElementById('currentProfileImage');
    const form = document.getElementById('profileForm');
    const introInput = document.getElementById('profileIntro');
    const introCount = document.querySelector('[data-profile-intro-count]');
    const syncIntroCount = () => {
        if (introCount && introInput) introCount.textContent = String(introInput.value.length);
    };
    introInput?.addEventListener('input', syncIntroCount);
    syncIntroCount();

    const profileLinkList = document.getElementById('profileLinkList');
    const profileLinkAddButton = document.querySelector('[data-profile-link-add]');

    const createProfileLinkRow = (name = '', url = '') => {
        const row = document.createElement('div');
        row.className = 'profile-link-row';
        row.innerHTML = `
            <input type="text" class="profile-link-name" maxlength="50" placeholder="링크 이름">
            <input type="text" class="profile-link-url" maxlength="500" placeholder="https://...">
            <button type="button" class="profile-link-remove" data-profile-link-remove aria-label="링크 삭제">×</button>
        `;
        row.querySelector('.profile-link-name').value = name;
        row.querySelector('.profile-link-url').value = url;
        return row;
    };

    const syncProfileLinkAddState = () => {
        if (!profileLinkAddButton || !profileLinkList) return;
        const count = profileLinkList.querySelectorAll('.profile-link-row').length;
        profileLinkAddButton.disabled = count >= 5;
    };

    profileLinkAddButton?.addEventListener('click', () => {
        if (!profileLinkList || profileLinkList.querySelectorAll('.profile-link-row').length >= 5) return;
        const row = createProfileLinkRow();
        profileLinkList.appendChild(row);
        row.querySelector('.profile-link-name')?.focus();
        syncProfileLinkAddState();
    });

    profileLinkList?.addEventListener('click', event => {
        const removeButton = event.target.closest('[data-profile-link-remove]');
        if (!removeButton) return;
        removeButton.closest('.profile-link-row')?.remove();
        syncProfileLinkAddState();
    });

    const collectProfileLinks = () => {
        if (!profileLinkList) return [];
        return Array.from(profileLinkList.querySelectorAll('.profile-link-row')).map(row => ({
            linkName: row.querySelector('.profile-link-name')?.value.trim() || '',
            linkUrl: row.querySelector('.profile-link-url')?.value.trim() || ''
        })).filter(link => link.linkName || link.linkUrl);
    };

    syncProfileLinkAddState();
    const nameInput = form?.querySelector('#profileUserName');
    const hidden = document.getElementById('profileImageData');
    const originalHidden = document.getElementById('profileOriginalImageData');
    const cropScaleHidden = document.getElementById('profileCropScaleHidden');
    const cropXHidden = document.getElementById('profileCropX');
    const cropYHidden = document.getElementById('profileCropY');
    const avatarTypeHidden = document.getElementById('profileAvatarType');
    const removeButton = document.getElementById('removeProfile');
    const restoreButton = document.getElementById('restoreProfileImage');
    const historyModal = document.getElementById('profileHistoryModal');
    const historyList = document.getElementById('profileImageHistoryList');
    const historyCloseButtons = Array.from(document.querySelectorAll('[data-profile-history-close]'));
    const historyIdHidden = document.getElementById('profileImageHistoryId');
    const imageButton = document.querySelector('.signup-profile-editor .signup-image-button');

    const modal = document.getElementById('profileCropModal');
    const modalViewport = document.getElementById('profileCropViewport');
    const modalCanvas = document.getElementById('profileCropCanvas');
    const modalScale = document.getElementById('profileCropScaleRange');
    const modalScaleValue = document.getElementById('profileCropScaleValue');
    const applyButton = document.querySelector('[data-profile-modal-apply]');
    const closeButtons = Array.from(document.querySelectorAll('[data-profile-modal-close]'));

    if (!fileInput || !canvas || !viewport || !fallback || !nameInput || !hidden ||
        !originalHidden || !cropScaleHidden || !cropXHidden || !cropYHidden ||
        !avatarTypeHidden || !removeButton || !form || !historyIdHidden) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const PROFILE_PREVIEW_BACKGROUND = '#ffffff';

    let image = null;
    let scale = 1.15;
    let offsetX = 0;
    let offsetY = 0;
    let profileChanged = false;
    let defaultSelected = avatarTypeHidden.value !== 'IMAGE';

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
    let profileImageHistoryLoaded = false;
    let profileImageHistoryLoading = false;
    const initialProfileImageUrl = currentProfileImage?.getAttribute('src') || '';

    const updateFallback = () => {
        const value = nameInput.value.trim();
        const initial = value ? Array.from(value)[0].toUpperCase() : '모';
        fallback.textContent = initial;
        document.querySelectorAll('[data-avatar-initial]').forEach(item => { item.textContent = initial; });
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
        targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        targetCtx.save();
        // 투명 PNG/WEBP의 알파 채널을 최종 크롭 이미지에도 유지한다.
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

    const restoreInitialProfileImage = () => {
        if (!initialProfileImageUrl) return false;
        const restoredImage = new Image();
        restoredImage.onload = () => {
            image = restoredImage;
            committedImageUrl = initialProfileImageUrl;
            committedOriginalDataUrl = '';
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            hidden.value = '';
            originalHidden.value = '';
            historyIdHidden.value = '';
            cropScaleHidden.value = '';
            cropXHidden.value = '';
            cropYHidden.value = '';
            avatarTypeHidden.value = 'IMAGE';
            defaultSelected = false;
            profileChanged = false;

            currentProfileImage?.remove();
            canvas.hidden = false;
            fallback.hidden = true;
            viewport.classList.add('has-image');
            viewport.closest('.signup-profile-editor')?.classList.add('has-photo-selected');
            if (imageButton) imageButton.textContent = '사진 조정';
            drawCommitted();
            updateCommittedBackground();
            closeProfileHistoryModal();
        };
        restoredImage.onerror = () => alert('기존 프로필 사진을 불러오지 못했습니다.');
        restoredImage.src = initialProfileImageUrl;
        return true;
    };

    const updateDraftScaleText = () => {
        if (!modalScaleValue || !modalScale) return;
        modalScaleValue.textContent = `${modalScale.value}%`;
    };

    const syncProfileHiddenFields = () => {
        const hasImage = Boolean(image);
        if (hasImage) {
            avatarTypeHidden.value = 'IMAGE';
            originalHidden.value = committedOriginalDataUrl;
            if (historyIdHidden.value) {
                hidden.value = '';
                originalHidden.value = '';
            }
            cropScaleHidden.value = String(scale);
            cropXHidden.value = String(offsetX);
            cropYHidden.value = String(offsetY);
            return;
        }
        if (defaultSelected) {
            avatarTypeHidden.value = 'DEFAULT';
        }
        originalHidden.value = '';
        cropScaleHidden.value = '';
        cropXHidden.value = '';
        cropYHidden.value = '';
    };

    const showImage = () => {
        currentProfileImage?.remove();
        canvas.hidden = false;
        fallback.hidden = true;
        viewport.classList.add('has-image');
        viewport.closest('.signup-profile-editor')?.classList.add('has-photo-selected');
        if (imageButton) imageButton.textContent = '사진 조정';
        defaultSelected = false;
        profileChanged = true;
    };


    const resolveProfileImageUrl = path => {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        if (path.startsWith('/')) return `${contextPath}${path}`;
        return `${contextPath}/${path}`;
    };

    const pickHistoryValue = (item, keys, fallback = '') => {
        if (!item || !keys) return fallback;
        for (const key of keys) {
            const value = item[key];
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return fallback;
    };

    const toHistoryNumber = (value, fallback) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : fallback;
    };

    const applyHistoryProfileImage = item => {
        const croppedPath = pickHistoryValue(item, [
            'profileImagePath', 'croppedImagePath', 'CROPPED_IMAGE_PATH', 'PROFILE_IMAGE_PATH', 'profile_image_path'
        ]);
        const originalPath = pickHistoryValue(item, [
            'profileOriginalImagePath', 'originalImagePath', 'ORIGINAL_IMAGE_PATH', 'PROFILE_ORIGINAL_IMAGE_PATH', 'profile_original_image_path'
        ]);
        const imageId = pickHistoryValue(item, ['profileImageId', 'PROFILE_IMAGE_ID', 'profile_image_id']);
        // 이전 사진 선택 직후에는 서버에 저장돼 있는 완성 크롭 이미지를 그대로 사용한다.
        // 원본 이미지와 과거 크롭 좌표를 현재 편집 캔버스에 다시 적용하면
        // 캔버스 크기 차이 때문에 선택한 사진이 즉시 바뀌지 않거나 위치가 달라질 수 있다.
        const previewPath = croppedPath || originalPath;
        const url = resolveProfileImageUrl(previewPath);
        if (!url || !imageId) return;

        const restoredImage = new Image();
        restoredImage.onload = () => {
            if (committedImageUrl && committedImageUrl.startsWith('blob:')) URL.revokeObjectURL(committedImageUrl);
            image = restoredImage;
            committedImageUrl = url;
            committedOriginalDataUrl = '';

            // 완성 크롭 이미지는 현재 편집 영역에 1:1 중앙 배치한다.
            // 저장 시에는 historyId를 전달하므로 서버가 해당 이력의 원본/크롭값을 복원한다.
            scale = 1;
            offsetX = 0;
            offsetY = 0;

            hidden.value = '';
            originalHidden.value = '';
            historyIdHidden.value = String(imageId);
            avatarTypeHidden.value = 'IMAGE';
            defaultSelected = false;
            profileChanged = true;
            showImage();
            drawCommitted();
            updateCommittedBackground();
            syncProfileHiddenFields();
            closeProfileHistoryModal();
        };
        restoredImage.onerror = () => alert('이전 프로필 사진을 불러오지 못했습니다.');
        restoredImage.src = url;
    };

    const openProfileHistoryModal = () => {
        if (!historyModal) return;
        historyModal.hidden = false;
        document.body.classList.add('signup-modal-open');
    };

    const closeProfileHistoryModal = () => {
        if (!historyModal) return;
        historyModal.hidden = true;
        document.body.classList.remove('signup-modal-open');
    };

    historyCloseButtons.forEach(button => button.addEventListener('click', closeProfileHistoryModal));

    const renderProfileImageHistory = items => {
        if (!historyList || !historyModal) return;
        historyList.innerHTML = '';
        if (!items || items.length === 0) {
            historyList.innerHTML = '<p class="profile-image-history-empty">다시 사용할 이전 프로필 사진이 없습니다.</p>';
            openProfileHistoryModal();
            return;
        }
        if (initialProfileImageUrl && !defaultSelected) {
            const currentButton = document.createElement('button');
            currentButton.type = 'button';
            currentButton.className = 'profile-image-history-item is-current';
            currentButton.innerHTML = `<img src="${initialProfileImageUrl}" alt="현재 프로필 사진"><span>현재 사용 중</span>`;
            currentButton.addEventListener('click', restoreInitialProfileImage);
            historyList.appendChild(currentButton);
        }
        const maxHistoryItems = 5;
        const normalizedInitialUrl = initialProfileImageUrl ? new URL(initialProfileImageUrl, window.location.origin).href : '';
        items
            .filter(item => {
                const imagePath = item.profileImagePath || item.croppedImagePath || item.CROPPED_IMAGE_PATH || '';
                const url = resolveProfileImageUrl(imagePath);
                if (!url) return false;
                const normalizedUrl = new URL(url, window.location.origin).href;
                const isCurrent = String(item.isCurrent || item.IS_CURRENT || '').toUpperCase() === 'Y';
                return defaultSelected || (!isCurrent && normalizedUrl !== normalizedInitialUrl);
            })
            .slice(0, maxHistoryItems)
            .forEach(item => {
                const imagePath = item.profileImagePath || item.croppedImagePath || item.CROPPED_IMAGE_PATH || '';
                const url = resolveProfileImageUrl(imagePath);
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'profile-image-history-item';
                button.innerHTML = `<img src="${url}" alt="이전 프로필 사진"><span>${item.createdAt || item.CREATED_AT || ''}</span>`;
                button.addEventListener('click', () => applyHistoryProfileImage(item));
                historyList.appendChild(button);
            });
        if (!historyList.children.length) {
            historyList.innerHTML = '<p class="profile-image-history-empty">다시 사용할 이전 프로필 사진이 없습니다.</p>';
        }
        openProfileHistoryModal();
    };

    const loadProfileImageHistory = async () => {
        if (!historyModal || !historyList || profileImageHistoryLoading) return;
        if (profileImageHistoryLoaded) {
            openProfileHistoryModal();
            return;
        }
        profileImageHistoryLoading = true;
        openProfileHistoryModal();
        historyList.innerHTML = '<p class="profile-image-history-empty">이전 사진을 불러오는 중입니다.</p>';
        try {
            const response = await fetch(`${contextPath}/users/profile/images`, { credentials: 'same-origin' });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message || '이전 사진을 불러오지 못했습니다.');
            profileImageHistoryLoaded = true;
            renderProfileImageHistory(result.images || []);
        } catch (error) {
            console.error(error);
            historyList.innerHTML = '<p class="profile-image-history-empty">이전 사진을 불러오지 못했습니다.</p>';
        } finally {
            profileImageHistoryLoading = false;
        }
    };

    const showFallback = () => {
        image = null;
        scale = 1.15;
        offsetX = 0;
        offsetY = 0;
        fileInput.value = '';
        historyIdHidden.value = '';
        hidden.value = '';
        originalHidden.value = '';
        cropScaleHidden.value = '';
        cropXHidden.value = '';
        cropYHidden.value = '';
        avatarTypeHidden.value = 'DEFAULT';
        committedOriginalDataUrl = '';
        draftOriginalDataUrl = '';
        draftUsesCommitted = false;
        historyIdHidden.value = '';
        defaultSelected = true;
        profileChanged = true;
        if (imageButton) imageButton.textContent = '사진 선택';
        if (committedImageUrl) URL.revokeObjectURL(committedImageUrl);
        committedImageUrl = '';
        currentProfileImage?.remove();
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
            };

            nextImage.src = objectUrl;
        };
        reader.onerror = () => alert('선택한 이미지를 읽지 못했습니다.');
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

    restoreButton?.addEventListener('click', () => {
        if (defaultSelected && initialProfileImageUrl) {
            restoreInitialProfileImage();
            return;
        }
        loadProfileImageHistory();
    });
    removeButton.addEventListener('click', showFallback);
    nameInput.addEventListener('input', updateFallback);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const userName = nameInput.value.trim();
        const profileIntro = introInput?.value.trim() || '';
        if (!userName) {
            alert('이름을 입력해주세요.');
            nameInput.focus();
            return;
        }

        if (image && historyIdHidden.value) {
            hidden.value = '';
        } else if (image) {
            drawCommitted();
            hidden.value = canvas.toDataURL('image/png');
        } else if (!profileChanged && avatarTypeHidden.dataset.initialAvatarType === 'IMAGE') {
            avatarTypeHidden.value = 'IMAGE';
            hidden.value = '';
        }
        syncProfileHiddenFields();

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${contextPath}/users/updateProfile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName,
                    profileIntro,
                    profileLinks: collectProfileLinks(),
                    birthDate: document.getElementById('birthDate')?.value || '',
                    birthCalendarType: document.getElementById('birthCalendarType')?.value || 'SOLAR',
                    birthPublicYn: document.getElementById('birthPublicYn')?.checked ? 'Y' : 'N',
                    profileAvatarType: avatarTypeHidden.value,
                    profileImageHistoryId: historyIdHidden.value,
                    profileImageData: hidden.value,
                    profileOriginalImageData: originalHidden.value,
                    profileCropScale: cropScaleHidden.value,
                    profileCropX: cropXHidden.value,
                    profileCropY: cropYHidden.value
                })
            });
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || '프로필 저장에 실패했습니다.');
            }
            profileEditSession.commit();
            location.reload();
        } catch (error) {
            alert(error.message || '프로필 저장 중 오류가 발생했습니다.');
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });


    let profileEditSnapshot = null;

    const snapshotProfileLinks = () => collectProfileLinks().map(link => ({ ...link }));

    const restoreProfileLinks = links => {
        if (!profileLinkList) return;
        profileLinkList.innerHTML = '';
        (links || []).forEach(link => {
            profileLinkList.appendChild(createProfileLinkRow(link.linkName || '', link.linkUrl || ''));
        });
        syncProfileLinkAddState();
    };

    const formatBirthDateLabel = value => {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
        return match ? `${match[1]}년 ${match[2]}월 ${match[3]}일` : '';
    };

    const restoreBirthFields = snapshot => {
        const birthDateInput = document.getElementById('birthDate');
        const birthTypeInput = document.getElementById('birthCalendarType');
        const birthDisplay = document.getElementById('birthDateDisplay');
        const birthPublic = document.getElementById('birthPublicYn');
        if (birthDateInput) birthDateInput.value = snapshot.birthDate;
        if (birthTypeInput) birthTypeInput.value = snapshot.birthCalendarType;
        if (birthDisplay) birthDisplay.value = formatBirthDateLabel(snapshot.birthDate);
        if (birthPublic) birthPublic.checked = snapshot.birthPublic;
        document.querySelectorAll('[data-birth-type]').forEach(button => {
            const isActive = button.dataset.birthType === snapshot.birthCalendarType;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
        document.querySelector('[data-birth-picker]')?.dispatchEvent(new CustomEvent('profile-birth-reset'));
    };

    const removeRenderedProfileImage = () => {
        viewport.querySelector('#currentProfileImage')?.remove();
    };

    const renderSnapshotProfileImage = snapshot => {
        removeRenderedProfileImage();
        viewport.removeAttribute('style');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (committedImageUrl && committedImageUrl.startsWith('blob:') && committedImageUrl !== snapshot.committedImageUrl) {
            URL.revokeObjectURL(committedImageUrl);
        }
        image = snapshot.image;
        scale = snapshot.scale;
        offsetX = snapshot.offsetX;
        offsetY = snapshot.offsetY;
        profileChanged = snapshot.profileChanged;
        defaultSelected = snapshot.defaultSelected;
        committedImageUrl = snapshot.committedImageUrl;
        committedOriginalDataUrl = snapshot.committedOriginalDataUrl;

        if (snapshot.renderedImageSrc && !snapshot.image) {
            const restored = document.createElement('img');
            restored.id = 'currentProfileImage';
            restored.src = snapshot.renderedImageSrc;
            restored.alt = nameInput.value.trim();
            viewport.appendChild(restored);
            canvas.hidden = true;
            fallback.hidden = true;
            viewport.classList.add('has-image');
            viewport.closest('.signup-profile-editor')?.classList.add('has-photo-selected');
            if (imageButton) imageButton.textContent = '사진 조정';
            return;
        }

        if (snapshot.image) {
            canvas.hidden = false;
            fallback.hidden = true;
            viewport.classList.add('has-image');
            viewport.closest('.signup-profile-editor')?.classList.add('has-photo-selected');
            if (imageButton) imageButton.textContent = '사진 조정';
            drawCommitted();
            updateCommittedBackground();
            return;
        }

        canvas.hidden = true;
        fallback.hidden = false;
        viewport.classList.remove('has-image');
        viewport.closest('.signup-profile-editor')?.classList.remove('has-photo-selected');
        if (imageButton) imageButton.textContent = '사진 선택';
        updateFallback();
    };

    const captureProfileEditSnapshot = () => ({
        userName: nameInput.value,
        profileIntro: introInput?.value || '',
        links: snapshotProfileLinks(),
        birthDate: document.getElementById('birthDate')?.value || '',
        birthCalendarType: document.getElementById('birthCalendarType')?.value || 'SOLAR',
        birthPublic: Boolean(document.getElementById('birthPublicYn')?.checked),
        image,
        scale,
        offsetX,
        offsetY,
        profileChanged,
        defaultSelected,
        committedImageUrl,
        committedOriginalDataUrl,
        renderedImageSrc: viewport.querySelector('#currentProfileImage')?.getAttribute('src') || '',
        hiddenValue: hidden.value,
        originalHiddenValue: originalHidden.value,
        cropScaleValue: cropScaleHidden.value,
        cropXValue: cropXHidden.value,
        cropYValue: cropYHidden.value,
        avatarTypeValue: avatarTypeHidden.value,
        historyIdValue: historyIdHidden.value
    });

    const restoreProfileEditSnapshot = snapshot => {
        if (!snapshot) return;
        cancelDraft();
        closeProfileHistoryModal();
        fileInput.value = '';
        nameInput.value = snapshot.userName;
        if (introInput) introInput.value = snapshot.profileIntro;
        restoreProfileLinks(snapshot.links);
        restoreBirthFields(snapshot);
        hidden.value = snapshot.hiddenValue;
        originalHidden.value = snapshot.originalHiddenValue;
        cropScaleHidden.value = snapshot.cropScaleValue;
        cropXHidden.value = snapshot.cropXValue;
        cropYHidden.value = snapshot.cropYValue;
        avatarTypeHidden.value = snapshot.avatarTypeValue;
        historyIdHidden.value = snapshot.historyIdValue;
        renderSnapshotProfileImage(snapshot);
        syncIntroCount();
        updateFallback();
    };

    profileEditSession = {
        begin() {
            if (!profileEditSnapshot) profileEditSnapshot = captureProfileEditSnapshot();
        },
        cancel() {
            if (!profileEditSnapshot) return;
            restoreProfileEditSnapshot(profileEditSnapshot);
            profileEditSnapshot = null;
        },
        commit() {
            profileEditSnapshot = null;
        }
    };

    const privacyForm = document.getElementById('profilePrivacyForm');
    privacyForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const submitButton = privacyForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        try {
            const response = await fetch(`${contextPath}/users/updateProfile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profilePhotosPublicYn: document.getElementById('profilePhotosPublicYn')?.checked ? 'Y' : 'N',
                    profileNotesPublicYn: document.getElementById('profileNotesPublicYn')?.checked ? 'Y' : 'N',
                    profileCalendarPublicYn: document.getElementById('profileCalendarPublicYn')?.checked ? 'Y' : 'N',
                    profileGroupsPublicYn: document.getElementById('profileGroupsPublicYn')?.checked ? 'Y' : 'N'
                })
            });
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || '공개 설정 저장에 실패했습니다.');
            }
            location.reload();
        } catch (error) {
            alert(error.message || '공개 설정 저장 중 오류가 발생했습니다.');
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });


    const notificationForm = document.getElementById('profileNotificationForm');
    notificationForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const submitButton = notificationForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        try {
            const response = await fetch(`${contextPath}/users/updateProfile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notifyScheduleYn: document.getElementById('notifyScheduleYn')?.checked ? 'Y' : 'N',
                    notifyShareYn: document.getElementById('notifyShareYn')?.checked ? 'Y' : 'N',
                    notifyRequestYn: document.getElementById('notifyRequestYn')?.checked ? 'Y' : 'N',
                    notifyCommentYn: document.getElementById('notifyCommentYn')?.checked ? 'Y' : 'N',
                    notifyLikeYn: document.getElementById('notifyLikeYn')?.checked ? 'Y' : 'N'
                })
            });
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || '알림 설정 저장에 실패했습니다.');
            }
            location.reload();
        } catch (error) {
            alert(error.message || '알림 설정 저장 중 오류가 발생했습니다.');
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });



    const passwordForm = document.getElementById('profilePasswordForm');
    const passwordCard = document.querySelector('.profile-password-card');
    const passwordToggleButton = document.querySelector('[data-toggle-password-form]');
    const passwordCancelButton = document.querySelector('[data-cancel-password-form]');

    const setPasswordFormOpen = open => {
        if (!passwordForm || !passwordToggleButton) return;
        passwordForm.hidden = !open;
        passwordCard?.classList.toggle('is-open', open);
        passwordToggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        passwordToggleButton.textContent = open ? '접기' : '변경하기';
        if (open) {
            window.setTimeout(() => document.getElementById('currentPassword')?.focus(), 80);
        }
    };

    passwordToggleButton?.addEventListener('click', () => {
        const isOpen = passwordToggleButton.getAttribute('aria-expanded') === 'true';
        setPasswordFormOpen(!isOpen);
    });

    passwordCancelButton?.addEventListener('click', () => {
        passwordForm?.reset();
        setPasswordFormOpen(false);
    });

    passwordForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const currentPassword = currentPasswordInput?.value.trim() || '';
        const newPassword = newPasswordInput?.value.trim() || '';
        const confirmPassword = confirmPasswordInput?.value.trim() || '';

        if (!currentPassword) {
            alert('현재 비밀번호를 입력해주세요.');
            currentPasswordInput?.focus();
            return;
        }
        if (newPassword.length < 4) {
            alert('새 비밀번호는 4자리 이상 입력해주세요.');
            newPasswordInput?.focus();
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호 확인이 일치하지 않습니다.');
            confirmPasswordInput?.focus();
            return;
        }
        if (currentPassword === newPassword) {
            alert('현재 비밀번호와 다른 비밀번호를 입력해주세요.');
            newPasswordInput?.focus();
            return;
        }

        const submitButton = passwordForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${contextPath}/users/profile/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            });
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || '비밀번호를 변경하지 못했습니다.');
            }
            alert('비밀번호가 변경되었습니다.');
            passwordForm.reset();
            setPasswordFormOpen(false);
        } catch (error) {
            alert(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });

    const withdrawModal = document.getElementById('withdrawConfirmModal');
    const withdrawPasswordInput = document.getElementById('withdrawConfirmPassword');
    const withdrawSubmitButton = document.getElementById('withdrawConfirmSubmit');

    const closeWithdrawModal = () => {
        if (!withdrawModal) return;
        withdrawModal.hidden = true;
        document.body.classList.remove('profile-confirm-open');
        if (withdrawPasswordInput) withdrawPasswordInput.value = '';
    };

    const openWithdrawModal = () => {
        if (!withdrawModal) return;
        withdrawModal.hidden = false;
        document.body.classList.add('profile-confirm-open');
        setTimeout(() => withdrawPasswordInput?.focus(), 30);
    };

    const withdrawButtons = Array.from(document.querySelectorAll('#mypageWithdrawButton'));
    withdrawButtons.forEach(withdrawButton => withdrawButton?.addEventListener('click', openWithdrawModal));

    Array.from(document.querySelectorAll('[data-withdraw-close]')).forEach(button => {
        button.addEventListener('click', closeWithdrawModal);
    });

    withdrawPasswordInput?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            withdrawSubmitButton?.click();
        }
    });

    withdrawSubmitButton?.addEventListener('click', async () => {
        const currentPassword = withdrawPasswordInput?.value.trim() || '';

        if (!currentPassword) {
            alert('회원 탈퇴 신청을 위해 현재 비밀번호를 입력해주세요.');
            withdrawPasswordInput?.focus();
            return;
        }

        withdrawSubmitButton.disabled = true;
        try {
            const response = await fetch(`${contextPath}/users/withdraw`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword })
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert('탈퇴 신청이 완료되었습니다.\n30일 안에 로그인하면 계정을 복구할 수 있습니다.');
                location.href = `${contextPath}/users/loginForm`;
                return;
            }
            alert(result.message || '회원 탈퇴를 처리하지 못했습니다.');
        } catch (error) {
            alert('회원 탈퇴 중 오류가 발생했습니다.');
        } finally {
            withdrawSubmitButton.disabled = false;
        }
    });

    const withdrawCancelButton = document.getElementById('mypageWithdrawCancelButton');
    withdrawCancelButton?.addEventListener('click', async () => {
        if (!confirm('탈퇴 신청을 취소하고 계정을 다시 사용하시겠습니까?')) return;

        withdrawCancelButton.disabled = true;
        try {
            const response = await fetch(`${contextPath}/users/withdraw/cancel`, {
                method: 'POST',
                credentials: 'same-origin'
            });
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || '탈퇴 신청을 취소하지 못했습니다.');
            }
            alert(result.message || '탈퇴 신청이 취소되었습니다.');
            location.reload();
        } catch (error) {
            alert(error.message || '탈퇴 신청 취소 중 오류가 발생했습니다.');
        } finally {
            withdrawCancelButton.disabled = false;
        }
    });
})();
