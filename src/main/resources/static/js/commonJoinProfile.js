"use strict";

(function () {
    const modal = document.getElementById("joinProfileModal");
    if (!modal) return;

    const overlay = document.getElementById("joinProfileOverlay");
    const cropModal = document.getElementById("joinProfileCropModal");
    const preview = document.getElementById("joinProfilePreview");
    const fileInput = document.getElementById("joinProfileFile");
    const adjustButton = document.getElementById("joinProfileAdjust");
    const defaultButton = document.getElementById("joinProfileDefault");
    const cropStage = document.getElementById("joinProfileCropStage");
    const cropImage = document.getElementById("joinProfileCropImage");
    const zoom = document.getElementById("joinProfileCropZoom");
    const percent = document.getElementById("joinProfileCropPercent");
    const useAccountInput = document.getElementById("joinProfileUseAccount");
    const displayNameInput = document.getElementById("joinProfileDisplayName");
    const emailInput = document.getElementById("joinProfileEmail");
    const positionInput = document.getElementById("joinProfilePosition");
    const introInput = document.getElementById("joinProfileIntro");
    const phoneInput = document.getElementById("joinProfilePhone");
    const avatarColumn = document.querySelector(".join-profile-avatar-column");
    const workspaceMark = document.getElementById("joinProfileWorkspaceMark");
    const workspaceImage = document.getElementById("joinProfileWorkspaceImage");
    const workspaceFallback = document.getElementById("joinProfileWorkspaceFallback");
    const showEmailInput = document.getElementById("joinProfileShowEmail");
    const showPhoneInput = document.getElementById("joinProfileShowPhone");
    const showBirthInput = document.getElementById("joinProfileShowBirth");
    const submitButton = document.getElementById("joinProfileSubmit");
    const emailVerifyBadge = document.getElementById("joinProfileEmailVerifyBadge");
    const emailVerifyButton = document.getElementById("joinProfileEmailVerifyButton");
    const emailCodeRow = document.getElementById("joinProfileEmailCodeRow");
    const emailCodeInput = document.getElementById("joinProfileEmailCode");
    const emailCodeVerifyButton = document.getElementById("joinProfileEmailCodeVerifyButton");
    const emailVerifyText = document.getElementById("joinProfileEmailVerifyText");
    const birthValue = document.getElementById("joinProfileBirthValue");
    const birthHelp = document.getElementById("joinProfileBirthHelp");
    const birthTypeBadge = document.getElementById("joinProfileBirthTypeBadge");

    const accountEmail = (modal.dataset.accountEmail || "").trim();
    const accountBirth = (modal.dataset.accountBirth || "").trim();
    const accountBirthType = (modal.dataset.accountBirthType || "SOLAR").trim().toUpperCase();
    const accountBirthPublic = (modal.dataset.accountBirthPublic || "N").trim().toUpperCase();
    let verifiedJoinEmail = accountEmail.toLowerCase();

    const contextPath = modal.dataset.contextPath || "";
    const accountName = preview.dataset.accountName || "사용자";
    const rawAccountImage = preview.dataset.accountImage || "";

    let state = {
        mode: "invite",
        invitationId: null,
        requestId: null,
        workspaceId: null,
        workspaceName: "",
        workspaceImagePath: "",
        onSuccess: null,
        sourceUrl: "",
        finalBlob: null,
        x: 0,
        y: 0,
        scale: 1,
        dragging: false,
        lastX: 0,
        lastY: 0,
        baseWidth: 0,
        baseHeight: 0
    };



    function syncWorkspaceMark() {
        if (!workspaceMark) return;
        const name = String(state.workspaceName || "그룹").trim();
        const fallbackText = name ? name.substring(0, 1).toUpperCase() : "그";
        if (workspaceFallback) workspaceFallback.textContent = fallbackText;

        const imagePath = String(state.workspaceImagePath || "").trim();
        if (!workspaceImage || !imagePath) {
            if (workspaceImage) {
                workspaceImage.hidden = true;
                workspaceImage.removeAttribute("src");
            }
            if (workspaceFallback) workspaceFallback.hidden = false;
            workspaceMark.classList.remove("has-image");
            workspaceMark.classList.add("is-default");
            return;
        }

        const resolved = MoyoProfileUtils.resolvePath(imagePath, contextPath);
        workspaceImage.onload = function () {
            workspaceImage.hidden = false;
            if (workspaceFallback) workspaceFallback.hidden = true;
            workspaceMark.classList.add("has-image");
            workspaceMark.classList.remove("is-default");
        };
        workspaceImage.onerror = function () {
            workspaceImage.hidden = true;
            if (workspaceFallback) workspaceFallback.hidden = false;
            workspaceMark.classList.remove("has-image");
            workspaceMark.classList.add("is-default");
        };
        workspaceImage.src = resolved;
    }

    async function loadWorkspaceContext() {
        const params = new URLSearchParams();
        if (state.invitationId) params.set("inviteId", state.invitationId);
        if (state.requestId) params.set("requestId", state.requestId);
        if (!params.toString()) {
            syncWorkspaceMark();
            return;
        }

        try {
            const response = await fetch(
                contextPath + "/workspace/api/join-profile-context?" + params.toString(),
                {credentials: "same-origin"}
            );
            if (!response.ok) {
                syncWorkspaceMark();
                return;
            }
            const payload = await response.json();
            if (!payload || payload.success !== true) {
                syncWorkspaceMark();
                return;
            }
            if (payload.workspaceName) state.workspaceName = payload.workspaceName;
            state.workspaceImagePath = payload.workspaceImagePath || "";

            const workspaceNameEl = document.getElementById("joinProfileWorkspaceName");
            const subtitleEl = document.getElementById("joinProfileSubtitle");
            if (workspaceNameEl) workspaceNameEl.textContent = state.workspaceName;
            if (subtitleEl) {
                subtitleEl.textContent = state.workspaceName + "에서 사용할 프로필과 공개 정보를 확인해주세요.";
            }
            syncWorkspaceMark();
        } catch (error) {
            syncWorkspaceMark();
        }
    }

    function syncImageActions() {
        if (!avatarColumn) return;
        const hasCustomImage = !useAccount() && Boolean(state.sourceUrl || state.finalBlob);
        avatarColumn.classList.toggle("has-custom-image", hasCustomImage);
    }

    function normalizeEmail(value) {
        return String(value || "").trim().toLowerCase();
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
    }

    function syncEmailVerification() {
        if (!emailVerifyBadge || !emailVerifyText) return false;
        const email = normalizeEmail(emailInput.value);
        const verified = !!email && (email === normalizeEmail(accountEmail) || email === normalizeEmail(verifiedJoinEmail));
        emailVerifyBadge.hidden = !verified;
        emailVerifyBadge.classList.toggle("is-verified", verified);
        if (emailVerifyButton) emailVerifyButton.hidden = !email || verified;
        if (!email) {
            emailVerifyText.textContent = "이메일을 입력해주세요.";
            if (emailCodeRow) emailCodeRow.hidden = true;
            return false;
        }
        if (verified) {
            emailVerifyBadge.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> 인증됨';
            emailVerifyText.textContent = email === normalizeEmail(accountEmail)
                ? "계정 이메일은 추가 인증 없이 사용할 수 있어요."
                : "인증된 이메일입니다.";
            if (emailCodeRow) emailCodeRow.hidden = true;
            return true;
        }
        emailVerifyText.textContent = "계정과 다른 이메일은 인증 후 사용할 수 있어요.";
        return false;
    }

    function formatBirthMonthDay(raw) {
        if (!raw) return "";
        const match = String(raw).match(/(?:\d{4}[-/.])?(\d{1,2})[-/.](\d{1,2})/);
        if (!match) return "";
        return String(Number(match[1])).padStart(2, "0") + "." + String(Number(match[2])).padStart(2, "0");
    }

    function syncBirthInfo() {
        if (!birthValue || !showBirthInput) return;
        const formatted = formatBirthMonthDay(accountBirth);
        const hasBirth = Boolean(formatted);
        birthValue.textContent = hasBirth ? formatted : "등록된 생일 없음";
        showBirthInput.disabled = !hasBirth;
        if (!hasBirth) showBirthInput.checked = false;
        if (birthTypeBadge) {
            birthTypeBadge.innerHTML = accountBirthType === "LUNAR"
                ? '<i class="fa-regular fa-moon" aria-hidden="true"></i>'
                : '<i class="fa-regular fa-sun" aria-hidden="true"></i>';
            birthTypeBadge.setAttribute("aria-label", accountBirthType === "LUNAR" ? "음력" : "양력");
        }
        if (birthHelp) birthHelp.textContent = hasBirth
            ? "생일은 연도 없이 월/일만 다른 그룹 멤버에게 표시됩니다."
            : "마이페이지에 생일을 등록하면 그룹에서 공개 여부를 선택할 수 있습니다.";
    }

    function syncPrivacyAvailability() {
        if (showEmailInput) showEmailInput.disabled = !emailInput.value.trim();
        if (showPhoneInput) {
            showPhoneInput.disabled = !phoneInput.value.trim();
            if (showPhoneInput.disabled) showPhoneInput.checked = false;
        }
    }
    function resolvedAccountImage() {
        return MoyoProfileUtils.resolvePath(rawAccountImage, contextPath);
    }

    function renderPreview(src, text) {
        MoyoProfileUtils.renderAvatar(preview, {
            src: src,
            fallbackText: text,
            alt: '프로필',
            imageClass: 'has-image',
            fallbackClass: 'is-fallback'
        });
    }

    function useAccount() {
        return Boolean(useAccountInput && useAccountInput.checked);
    }

    function resetCropState() {
        state.x = 0;
        state.y = 0;
        state.scale = 1;
        zoom.value = "1";
        percent.textContent = "100%";
    }

    function syncMode() {
        const accountMode = useAccount();

        displayNameInput.readOnly = accountMode;
        emailInput.readOnly = accountMode;
        fileInput.disabled = accountMode;
        defaultButton.disabled = accountMode;
        adjustButton.disabled = accountMode || !state.sourceUrl;
        syncImageActions();

        if (accountMode && accountEmail) {
            emailInput.value = accountEmail;
        }

        const fileLabel = document.querySelector('label[for="joinProfileFile"]');
        if (fileLabel) fileLabel.style.opacity = accountMode ? ".45" : "1";

        if (accountMode) {
            displayNameInput.value = accountName;
            renderPreview(resolvedAccountImage(), accountName);
            syncImageActions();
            return;
        }

        if (state.finalBlob) {
            renderPreview(URL.createObjectURL(state.finalBlob), displayNameInput.value);
        } else if (state.sourceUrl) {
            renderPreview(state.sourceUrl, displayNameInput.value);
        } else {
            renderPreview("", displayNameInput.value || accountName);
        }
        syncImageActions();
    }

    async function loadSavedProfile(workspaceId) {
        if (!workspaceId) return false;

        try {
            const response = await fetch(
                contextPath + "/workspace/api/saved-member-profile?wsId="
                    + encodeURIComponent(workspaceId),
                {credentials: "same-origin"}
            );

            if (!response.ok) return false;

            const payload = await response.json();
            const profile = payload && payload.profile ? payload.profile : null;

            if (!payload || payload.success !== true
                || !payload.hasSavedProfile || !profile) {
                return false;
            }

            const value = function (camel, upper, fallback) {
                if (profile[camel] != null) return profile[camel];
                if (profile[upper] != null) return profile[upper];
                return fallback;
            };

            const accountMode = String(
                value("useAccountProfile", "USE_ACCOUNT_PROFILE", "Y")
            ).toUpperCase() === "Y";

            useAccountInput.checked = accountMode;
            displayNameInput.value =
                value("customDisplayName", "CUSTOM_DISPLAY_NAME", accountName)
                || accountName;
            emailInput.value =
                value("contactEmail", "CONTACT_EMAIL", emailInput.value) || "";
            verifiedJoinEmail = normalizeEmail(emailInput.value);
            positionInput.value =
                value("positionName", "POSITION_NAME", "") || "";
            introInput.value =
                value("introText", "INTRO_TEXT", "") || "";
            phoneInput.value =
                value("phoneNumber", "PHONE_NUMBER", "") || "";
            showEmailInput.checked = String(
                value("showEmail", "SHOW_EMAIL", "N")
            ).toUpperCase() === "Y";
            showPhoneInput.checked = String(
                value("showPhone", "SHOW_PHONE", "N")
            ).toUpperCase() === "Y";
            showBirthInput.checked = String(
                value("showBirth", "SHOW_BIRTH", "N")
            ).toUpperCase() === "Y";

            state.sourceUrl = "";
            state.finalBlob = null;
            fileInput.value = "";

            const savedImage = value(
                "customProfileImagePath",
                "CUSTOM_PROFILE_IMAGE_PATH",
                ""
            );

            if (!accountMode && savedImage) {
                state.sourceUrl = MoyoProfileUtils.resolvePath(savedImage, contextPath);
                renderPreview(
                    state.sourceUrl,
                    displayNameInput.value || accountName
                );
                adjustButton.disabled = false;
        syncImageActions();
            }

            syncMode();
            syncEmailVerification();
            syncBirthInfo();
            syncPrivacyAvailability();
            return true;
        } catch (error) {
            return false;
        }
    }

    function layoutCrop() {
        if (!cropImage.naturalWidth) return;

        const size = cropStage.clientWidth;
        state.baseWidth = size;
        state.baseHeight =
            size * cropImage.naturalHeight / cropImage.naturalWidth;

        if (state.baseHeight < size) {
            state.baseHeight = size;
            state.baseWidth =
                size * cropImage.naturalWidth / cropImage.naturalHeight;
        }

        applyTransform();
    }

    function applyTransform() {
        cropImage.style.width = state.baseWidth + "px";
        cropImage.style.height = state.baseHeight + "px";
        cropImage.style.transform =
            "translate(calc(-50% + " + state.x + "px),"
            + "calc(-50% + " + state.y + "px)) "
            + "scale(" + state.scale + ")";
        percent.textContent = Math.round(state.scale * 100) + "%";
    }

    function openCrop() {
        if (!state.sourceUrl) return;
        cropModal.style.display = "block";
        layoutCrop();
    }

    function closeCrop() {
        cropModal.style.display = "none";
    }

    function closeModal() {
        modal.style.display = "none";
        overlay.style.display = "none";
        cropModal.style.display = "none";
        document.body.style.overflow = "";

        state.mode = "invite";
        state.invitationId = null;
        state.requestId = null;
        state.workspaceId = null;
        state.workspaceName = "";
        state.onSuccess = null;
    }

    function resetForm() {
        useAccountInput.checked = true;
        displayNameInput.value = accountName;
        positionInput.value = "";
        introInput.value = "";
        phoneInput.value = "";
        showEmailInput.checked = true;
        showPhoneInput.checked = false;
        showBirthInput.checked = Boolean(formatBirthMonthDay(accountBirth));

        state.sourceUrl = "";
        state.finalBlob = null;
        fileInput.value = "";
        resetCropState();
        syncMode();
        syncEmailVerification();
        syncBirthInfo();
        syncPrivacyAvailability();
    }

    async function openModal(options) {
        const config = options || {};

        state.mode = config.mode || "invite";
        state.invitationId = config.invitationId || config.inviteId || null;
        state.requestId = config.requestId || null;
        state.workspaceId = config.workspaceId || config.wsId || null;
        state.workspaceName = config.workspaceName || config.wsName || "그룹";
        state.workspaceImagePath = config.workspaceImagePath || config.wsImagePath || "";
        state.onSuccess =
            typeof config.onSuccess === "function" ? config.onSuccess : null;

        resetForm();

        document.getElementById("joinProfileTitle").textContent = "그룹 참여 설정";
        const workspaceNameEl = document.getElementById("joinProfileWorkspaceName");
        const subtitleEl = document.getElementById("joinProfileSubtitle");
        if (workspaceNameEl) workspaceNameEl.textContent = state.workspaceName;
        syncWorkspaceMark();
        if (subtitleEl) {
            subtitleEl.textContent = state.workspaceName + "에서 사용할 프로필과 공개 정보를 확인해주세요.";
        }
        submitButton.textContent = submitLabel();

        overlay.style.display = "block";
        modal.style.display = "block";
        document.body.style.overflow = "hidden";

        await Promise.all([
            loadWorkspaceContext(),
            loadSavedProfile(state.workspaceId)
        ]);
    }

    window.openJoinProfileModal = openModal;

    window.openGroupInviteProfileModal = function (
        invitationId,
        workspaceName,
        workspaceId,
        onSuccess
    ) {
        return openModal({
            mode: "invite",
            invitationId: invitationId,
            workspaceName: workspaceName,
            workspaceId: workspaceId,
            onSuccess: onSuccess
        });
    };

    window.openApprovedJoinProfileModal = function (
        requestId,
        workspaceName,
        workspaceId,
        onSuccess
    ) {
        return openModal({
            mode: "approved",
            requestId: requestId,
            workspaceName: workspaceName,
            workspaceId: workspaceId,
            onSuccess: onSuccess
        });
    };

    useAccountInput.addEventListener("change", syncMode);
    emailInput.addEventListener("input", function () {
        if (normalizeEmail(this.value) !== normalizeEmail(verifiedJoinEmail)) {
            if (emailCodeInput) emailCodeInput.value = "";
        }
        syncEmailVerification();
        syncPrivacyAvailability();
    });
    emailVerifyButton?.addEventListener("click", async function () {
        const email = normalizeEmail(emailInput.value);
        if (!isValidEmail(email)) {
            emailVerifyText.textContent = "올바른 이메일 형식을 입력해주세요.";
            emailInput.focus();
            return;
        }
        emailVerifyButton.disabled = true;
        try {
            const response = await fetch(contextPath + "/users/email-verification/send", {
                method: "POST",
                credentials: "same-origin",
                headers: {"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
                body: new URLSearchParams({email: email})
            });
            const data = await response.json().catch(function(){ return {}; });
            if (!response.ok || !data.success) throw new Error(data.message || "인증번호 발송에 실패했습니다.");
            emailCodeRow.hidden = false;
            emailVerifyText.textContent = data.message || "인증번호를 발송했습니다.";
            emailCodeInput.focus();
        } catch (error) {
            emailVerifyText.textContent = error.message || "인증번호 발송에 실패했습니다.";
        } finally { emailVerifyButton.disabled = false; }
    });
    emailCodeVerifyButton?.addEventListener("click", async function () {
        const email = normalizeEmail(emailInput.value);
        const code = String(emailCodeInput.value || "").trim();
        if (!/^\d{6}$/.test(code)) {
            emailVerifyText.textContent = "인증번호 6자리를 입력해주세요.";
            emailCodeInput.focus();
            return;
        }
        emailCodeVerifyButton.disabled = true;
        try {
            const response = await fetch(contextPath + "/users/email-verification/verify", {
                method: "POST", credentials: "same-origin",
                headers: {"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
                body: new URLSearchParams({email: email, code: code})
            });
            const data = await response.json().catch(function(){ return {}; });
            if (!response.ok || !data.success) throw new Error(data.message || "이메일 인증에 실패했습니다.");
            verifiedJoinEmail = email;
            syncEmailVerification();
        } catch (error) { emailVerifyText.textContent = error.message || "이메일 인증에 실패했습니다."; }
        finally { emailCodeVerifyButton.disabled = false; }
    });
    phoneInput.addEventListener("input", syncPrivacyAvailability);

    displayNameInput.addEventListener("input", function () {
        if (!state.sourceUrl && !useAccount()) {
            renderPreview("", displayNameInput.value || accountName);
        }
    });

    fileInput.addEventListener("change", function () {
        const file = this.files && this.files[0];
        if (!file) return;

        const validation = MoyoProfileUtils.validateImageFile(file, {
            maxBytes: 10 * 1024 * 1024
        });
        if (!validation.valid) {
            alert(validation.message);
            this.value = "";
            return;
        }

        if (state.sourceUrl.startsWith("blob:")) {
            URL.revokeObjectURL(state.sourceUrl);
        }

        state.sourceUrl = URL.createObjectURL(file);
        state.finalBlob = null;
        resetCropState();

        cropImage.onload = function () {
            layoutCrop();
            openCrop();
        };
        cropImage.src = state.sourceUrl;
        adjustButton.disabled = false;
        syncImageActions();
    });

    adjustButton.addEventListener("click", openCrop);

    defaultButton.addEventListener("click", function () {
        if (state.sourceUrl.startsWith("blob:")) {
            URL.revokeObjectURL(state.sourceUrl);
        }

        state.sourceUrl = "";
        state.finalBlob = null;
        fileInput.value = "";
        adjustButton.disabled = true;
        resetCropState();
        renderPreview("", displayNameInput.value || accountName);
        syncImageActions();
    });

    zoom.addEventListener("input", function () {
        state.scale = Number(this.value);
        applyTransform();
    });

    cropStage.addEventListener("pointerdown", function (event) {
        state.dragging = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        cropStage.setPointerCapture(event.pointerId);
    });

    cropStage.addEventListener("pointermove", function (event) {
        if (!state.dragging) return;

        state.x += event.clientX - state.lastX;
        state.y += event.clientY - state.lastY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        applyTransform();
    });

    cropStage.addEventListener("pointerup", function () {
        state.dragging = false;
    });

    cropStage.addEventListener("pointercancel", function () {
        state.dragging = false;
    });

    document.getElementById("joinProfileCropApply")
        .addEventListener("click", function () {
            const outputSize = 500;
            const canvas = document.createElement("canvas");
            canvas.width = outputSize;
            canvas.height = outputSize;

            const context = canvas.getContext("2d");
            context.clearRect(0, 0, outputSize, outputSize);

            const factor = outputSize / cropStage.clientWidth;
            const drawWidth = state.baseWidth * state.scale * factor;
            const drawHeight = state.baseHeight * state.scale * factor;

            context.drawImage(
                cropImage,
                outputSize / 2 + state.x * factor - drawWidth / 2,
                outputSize / 2 + state.y * factor - drawHeight / 2,
                drawWidth,
                drawHeight
            );

            canvas.toBlob(function (blob) {
                state.finalBlob = blob;
                renderPreview(
                    URL.createObjectURL(blob),
                    displayNameInput.value || accountName
                );
                closeCrop();
            }, "image/png");
        });

    function submitLabel() {
        if (state.mode === "invite") return "초대 수락";
        if (state.mode === "approved") return "참여 완료";
        return "참여하기";
    }

    submitButton.addEventListener("click", async function () {
        if (state.mode === "invite" && !state.invitationId) return;
        if (state.mode === "approved" && !state.requestId) return;

        const accountMode = useAccount();
        const displayName = displayNameInput.value.trim();
        const email = emailInput.value.trim();

        if (!email) {
            alert("그룹 이메일을 입력해주세요.");
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            alert("이메일 형식을 확인해주세요.");
            emailInput.focus();
            return;
        }

        if (!syncEmailVerification()) {
            alert("계정과 다른 이메일은 인증 후 사용할 수 있습니다.");
            emailInput.focus();
            return;
        }

        if (showPhoneInput.checked && !phoneInput.value.trim()) {
            showPhoneInput.checked = false;
        }
        if (showBirthInput.checked && !formatBirthMonthDay(accountBirth)) {
            showBirthInput.checked = false;
        }

        if (!accountMode && !displayName) {
            alert("그룹 표시 이름을 입력해주세요.");
            displayNameInput.focus();
            return;
        }

        const formData = new FormData();

        if (state.mode === "approved") {
            formData.append("requestId", state.requestId);
        } else if (state.mode === "open") {
            formData.append("wsId", state.workspaceId);
        } else {
            formData.append("inviteId", state.invitationId);
            formData.append("status", "ACCEPTED");
        }

        formData.append("useAccountProfile", accountMode ? "Y" : "N");
        formData.append("displayName", displayName);
        formData.append("contactEmail", email);
        formData.append("positionName", positionInput.value.trim());
        formData.append("introText", introInput.value.trim());
        formData.append("phoneNumber", phoneInput.value.trim());
        formData.append(
            "showEmail",
            showEmailInput.checked ? "Y" : "N"
        );
        formData.append(
            "showPhone",
            showPhoneInput.checked ? "Y" : "N"
        );
        formData.append(
            "showBirth",
            showBirthInput.checked ? "Y" : "N"
        );
        formData.append("removeProfileImage", "N");

        if (!accountMode && state.finalBlob) {
            formData.append(
                "profileImage",
                state.finalBlob,
                "workspace_profile.png"
            );
        }

        submitButton.disabled = true;
        submitButton.textContent = "처리 중...";

        try {
            const endpoint = state.mode === "approved"
                ? contextPath + "/workspace/api/join-request/complete"
                : state.mode === "open"
                    ? contextPath + "/workspace/api/join-open"
                    : contextPath + "/workspace/api/invitation/process";

            const response = await fetch(endpoint, {
                method: "POST",
                credentials: "same-origin",
                body: formData
            });

            const data = await response.json();

            if (!(data.success === true || data.success === "true")) {
                throw new Error(data.status || data.message || "처리 실패");
            }

            const targetWorkspaceId =
                data.wsId
                || data.ws_id
                || data.workspaceId
                || data.workspace_id
                || state.workspaceId;

            const callback = state.onSuccess;
            closeModal();

            if (typeof window.refreshHeaderNotifications === "function") {
                try {
                    await window.refreshHeaderNotifications();
                } catch (ignore) {
                    // 알림 새로고침 실패는 참여 완료를 막지 않는다.
                }
            }

            if (targetWorkspaceId) {
                window.location.href =
                    contextPath + "/workspace/main?wsId="
                    + encodeURIComponent(targetWorkspaceId);
                return;
            }

            if (callback) callback(data);
        } catch (error) {
            alert(
                state.mode === "approved" || state.mode === "open"
                    ? "그룹 참여 중 오류가 발생했습니다."
                    : "초대 수락 중 오류가 발생했습니다."
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = submitLabel();
        }
    });

    [
        overlay,
        document.getElementById("joinProfileClose")
    ].filter(Boolean).forEach(function (element) {
        element.addEventListener("click", closeModal);
    });

    document.getElementById("joinProfileCropClose")
        .addEventListener("click", closeCrop);

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;

        if (cropModal.style.display === "block") {
            closeCrop();
        } else if (modal.style.display === "block") {
            closeModal();
        }
    });

    syncMode();
    syncEmailVerification();
    syncBirthInfo();
    syncPrivacyAvailability();
})();
