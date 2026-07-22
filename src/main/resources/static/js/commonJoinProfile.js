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
    const phoneInput = document.getElementById("joinProfilePhone");
    const showPhoneInput = document.getElementById("joinProfileShowPhone");
    const showBirthInput = document.getElementById("joinProfileShowBirth");
    const submitButton = document.getElementById("joinProfileSubmit");

    const contextPath = modal.dataset.contextPath || "";
    const accountName = preview.dataset.accountName || "사용자";
    const rawAccountImage = preview.dataset.accountImage || "";

    let state = {
        mode: "invite",
        invitationId: null,
        requestId: null,
        workspaceId: null,
        workspaceName: "",
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
        fileInput.disabled = accountMode;
        defaultButton.disabled = accountMode;
        adjustButton.disabled = accountMode || !state.sourceUrl;

        const fileLabel = document.querySelector('label[for="joinProfileFile"]');
        if (fileLabel) fileLabel.style.opacity = accountMode ? ".45" : "1";

        if (accountMode) {
            displayNameInput.value = accountName;
            renderPreview(resolvedAccountImage(), accountName);
            return;
        }

        if (state.finalBlob) {
            renderPreview(URL.createObjectURL(state.finalBlob), displayNameInput.value);
        } else if (state.sourceUrl) {
            renderPreview(state.sourceUrl, displayNameInput.value);
        } else {
            renderPreview("", displayNameInput.value || accountName);
        }
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
            positionInput.value =
                value("positionName", "POSITION_NAME", "") || "";
            phoneInput.value =
                value("phoneNumber", "PHONE_NUMBER", "") || "";
            showPhoneInput.checked = String(
                value("showPhone", "SHOW_PHONE", "N")
            ).toUpperCase() === "Y";
            showBirthInput.checked = String(
                value("showBirth", "SHOW_BIRTH", "Y")
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
                state.sourceUrl = resolvePath(savedImage);
                renderPreview(
                    state.sourceUrl,
                    displayNameInput.value || accountName
                );
                adjustButton.disabled = false;
            }

            syncMode();
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
        phoneInput.value = "";
        showPhoneInput.checked = false;

        state.sourceUrl = "";
        state.finalBlob = null;
        fileInput.value = "";
        resetCropState();
        syncMode();
    }

    async function openModal(options) {
        const config = options || {};

        state.mode = config.mode || "invite";
        state.invitationId = config.invitationId || config.inviteId || null;
        state.requestId = config.requestId || null;
        state.workspaceId = config.workspaceId || config.wsId || null;
        state.workspaceName = config.workspaceName || config.wsName || "그룹";
        state.onSuccess =
            typeof config.onSuccess === "function" ? config.onSuccess : null;

        resetForm();

        document.getElementById("joinProfileTitle").textContent =
            state.workspaceName + " 참여 프로필";

        overlay.style.display = "block";
        modal.style.display = "block";
        document.body.style.overflow = "hidden";

        await loadSavedProfile(state.workspaceId);
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
        formData.append("phoneNumber", phoneInput.value.trim());
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
        submitButton.textContent = "참여 중...";

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
            submitButton.textContent = "참여하기";
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
})();
