<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${workspace.wsName} - 그룹 설정</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/commonMemberProfile.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        var WORKSPACE_CONFIG = {
            wsId: Number('${workspace.wsId}'),
            currentUserId: Number('${currentUserId}'),
            isAdmin: ${isWorkspaceAdmin ? 'true' : 'false'},
            isOwner: ${currentUserIsOwner ? 'true' : 'false'},
            contextPath: '${pageContext.request.contextPath}'
        };
    </script>
    <script defer
            src="${pageContext.request.contextPath}/js/commonMemberProfile.js"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonWorkspaceInvite.js"></script>
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/workspaceSettings.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonWorkspaceInvite.css">

    <script>
        const WORKSPACE_CONTEXT_PATH = '${pageContext.request.contextPath}';
        const workspaceSettingsImageEditor = (function(){
            let api={
                getBlob:()=>Promise.resolve(null),
                getOriginalFile:()=>null
            };
            function init(){
                const fileInput=document.getElementById('wsImage');
                const preview=document.getElementById('workspacePreviewImage');
                const placeholder=document.getElementById('workspaceImagePlaceholder');
                const selectLabel=document.getElementById('workspaceImageSelectLabel');
                const adjust=document.getElementById('workspaceImageAdjustButton');
                const def=document.getElementById('workspaceImageDefaultButton');
                const modal=document.getElementById('workspaceImageCropModal');
                const viewport=document.getElementById('workspaceImageCropViewport');
                const image=document.getElementById('workspaceImageCropImage');
                const range=document.getElementById('workspaceImageScale');
                const value=document.getElementById('workspaceImageScaleValue');
                const apply=document.getElementById('workspaceImageApplyButton');
                const originalPathInput=document.getElementById('workspaceImageOriginalPath');
                const scaleInput=document.getElementById('wsImageCropScale');
                const xInput=document.getElementById('wsImageCropX');
                const yInput=document.getElementById('wsImageCropY');
                if(!fileInput||!modal) return;

                const initialPreviewUrl=preview && !preview.hidden ? preview.src : '';
                const initialOriginalUrl=(originalPathInput?.value||'').trim();
                let sourceUrl=initialOriginalUrl || initialPreviewUrl;
                let originalFile=null;
                let temporaryOriginalUrl='';
                let committedBlob=null;
                let committedPreviewUrl='';
                let pendingSelection=false;
                let scale=Number(scaleInput?.value)||1.15;
                let offsetX=Number(xInput?.value)||0;
                let offsetY=Number(yInput?.value)||0;
                let baseWidth=0,baseHeight=0,dragging=false,lastX=0,lastY=0;

                adjust.disabled=!sourceUrl;

                function viewportSize(){return viewport.clientWidth||250}
                function minimumScale(){
                    const size=viewportSize();
                    if(!baseWidth||!baseHeight)return 1;
                    return Math.max(size/baseWidth,size/baseHeight,1);
                }
                function syncState(){
                    if(scaleInput) scaleInput.value=String(scale);
                    if(xInput) xInput.value=String(offsetX);
                    if(yInput) yInput.value=String(offsetY);
                }
                function clampCrop(){
                    const size=viewportSize();
                    const minScale=minimumScale();
                    if(scale<minScale) scale=minScale;
                    const maxX=Math.max(0,(baseWidth*scale-size)/2);
                    const maxY=Math.max(0,(baseHeight*scale-size)/2);
                    offsetX=Math.max(-maxX,Math.min(maxX,offsetX));
                    offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
                    range.value=String(Math.round(scale*100));
                    value.textContent=Math.round(scale*100)+'%';
                    syncState();
                }
                function base(){
                    const size=viewportSize();
                    if(!image.naturalWidth)return;
                    const ratio=image.naturalWidth/image.naturalHeight;
                    if(ratio>=1){baseHeight=size;baseWidth=size*ratio}
                    else{baseWidth=size;baseHeight=size/ratio}
                    image.style.width=baseWidth+'px';
                    image.style.height=baseHeight+'px';
                    clampCrop();
                }
                function render(){
                    clampCrop();
                    image.style.transform='translate(-50%,-50%) translate('+offsetX+'px,'+offsetY+'px) scale('+scale+')';
                }
                let openRequestId=0;
                function open(reset){
                    if(!sourceUrl)return;
                    if(reset){scale=1.15;offsetX=0;offsetY=0}

                    const requestId=++openRequestId;
                    modal.hidden=true;
                    document.body.classList.remove('profile-crop-open');

                    function revealAfterRestore(){
                        if(requestId!==openRequestId||!image.naturalWidth)return;
                        base();
                        render();
                        requestAnimationFrame(function(){
                            if(requestId!==openRequestId)return;
                            modal.hidden=false;
                            document.body.classList.add('profile-crop-open');
                        });
                    }

                    image.onload=revealAfterRestore;
                    image.onerror=function(){
                        if(requestId!==openRequestId)return;
                        alert('원본 이미지를 불러오지 못했습니다. 이미지를 다시 선택해 주세요.');
                    };

                    if(image.src!==sourceUrl){
                        image.src=sourceUrl;
                    }else if(image.complete&&image.naturalWidth){
                        revealAfterRestore();
                    }
                }
                function discardPendingSelection(){
                    if(!pendingSelection)return;
                    if(temporaryOriginalUrl){
                        URL.revokeObjectURL(temporaryOriginalUrl);
                        temporaryOriginalUrl='';
                    }
                    originalFile=null;
                    sourceUrl=initialOriginalUrl || initialPreviewUrl;
                    fileInput.value='';
                    pendingSelection=false;
                    scale=Number(scaleInput?.defaultValue)||Number(scaleInput?.value)||1.15;
                    offsetX=Number(xInput?.defaultValue)||Number(xInput?.value)||0;
                    offsetY=Number(yInput?.defaultValue)||Number(yInput?.value)||0;
                }
                function close(){
                    discardPendingSelection();
                    modal.hidden=true;
                    document.body.classList.remove('profile-crop-open');
                }
                async function blob(){
                    if(!image.naturalWidth)return null;
                    clampCrop();
                    const size=viewportSize();
                    const dw=baseWidth*scale,dh=baseHeight*scale;
                    const dx=(size-dw)/2+offsetX,dy=(size-dh)/2+offsetY;
                    const c=document.createElement('canvas');
                    c.width=c.height=600;
                    const ctx=c.getContext('2d');
                    ctx.clearRect(0,0,600,600);
                    ctx.scale(600/size,600/size);
                    ctx.drawImage(image,dx,dy,dw,dh);
                    return await new Promise(r=>c.toBlob(r,'image/png'));
                }

                fileInput.addEventListener('change',()=>{
                    const selected=fileInput.files&&fileInput.files[0];
                    if(!selected)return;
                    if(!/^image\/(png|jpeg|webp)$/.test(selected.type)){
                        alert('PNG, JPG, WEBP 이미지만 선택할 수 있습니다.');
                        fileInput.value='';
                        return;
                    }
                    if(temporaryOriginalUrl)URL.revokeObjectURL(temporaryOriginalUrl);
                    originalFile=selected;
                    temporaryOriginalUrl=URL.createObjectURL(selected);
                    sourceUrl=temporaryOriginalUrl;
                    pendingSelection=true;
                    document.getElementById('removeWorkspaceImage').value='N';
                    def.disabled=false;
                    open(true);
                });
                adjust.addEventListener('click',()=>open(false));
                def.addEventListener('click',()=>{
                    const hasWorkspaceImage = Boolean(
                        sourceUrl || committedBlob || (preview && !preview.hidden && preview.getAttribute('src'))
                    );
                    if (!hasWorkspaceImage) return;
                    if (!confirm('그룹 대표 이미지를 삭제하고 기본 아바타로 변경할까요?\n변경사항 저장 후 실제 이미지가 삭제됩니다.')) {
                        return;
                    }

                    committedBlob=null;
                    originalFile=null;
                    pendingSelection=false;
                    fileInput.value='';
                    if(temporaryOriginalUrl)URL.revokeObjectURL(temporaryOriginalUrl);
                    if(committedPreviewUrl)URL.revokeObjectURL(committedPreviewUrl);
                    temporaryOriginalUrl='';committedPreviewUrl='';sourceUrl='';
                    preview.hidden=true;preview.removeAttribute('src');placeholder.hidden=false;
                    adjust.disabled=true;def.disabled=true;selectLabel.textContent='이미지 선택';
                    document.getElementById('removeWorkspaceImage').value='Y';
                    if(originalPathInput) originalPathInput.value='';
                    scaleInput.value='';xInput.value='';yInput.value='';
                });
                document.querySelectorAll('[data-workspace-image-close]').forEach(el=>el.addEventListener('click',close));
                range.addEventListener('input',()=>{scale=Math.max(minimumScale(),Number(range.value)/100);render()});
                viewport.addEventListener('pointerdown',e=>{dragging=true;viewport.classList.add('is-dragging');lastX=e.clientX;lastY=e.clientY;viewport.setPointerCapture?.(e.pointerId)});
                viewport.addEventListener('pointermove',e=>{if(!dragging)return;offsetX+=e.clientX-lastX;offsetY+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;render()});
                function end(e){dragging=false;viewport.classList.remove('is-dragging');if(e?.pointerId!==undefined&&viewport.hasPointerCapture?.(e.pointerId))viewport.releasePointerCapture(e.pointerId)}
                viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
                apply.addEventListener('click',async()=>{
                    const cropped=await blob();
                    if(!cropped)return;
                    committedBlob=cropped;
                    if(committedPreviewUrl)URL.revokeObjectURL(committedPreviewUrl);
                    committedPreviewUrl=URL.createObjectURL(cropped);
                    pendingSelection=false;
                    fileInput.value='';
                    preview.src=committedPreviewUrl;preview.hidden=false;placeholder.hidden=true;
                    adjust.disabled=false;selectLabel.textContent='이미지 다시 선택';
                    document.getElementById('removeWorkspaceImage').value='N';
                    def.disabled=false;
                    syncState();
                    modal.hidden=true;
                    document.body.classList.remove('profile-crop-open');
                });
                api.getBlob=()=>Promise.resolve(committedBlob);
                api.getOriginalFile=()=>originalFile;
            }
            document.addEventListener('DOMContentLoaded',init);
            return api;
        })();
        const WORKSPACE_LINK_MAX_COUNT = 5;

        function getWorkspaceLinkRows() {
            const list = document.getElementById('workspaceLinkList');
            return list ? Array.from(list.querySelectorAll('.workspace-link-row')) : [];
        }

        function syncWorkspaceLinkControls() {
            const rows = getWorkspaceLinkRows();
            const addButton = document.getElementById('workspaceLinkAddButton');
            const count = document.getElementById('workspaceLinkCount');
            const reachedLimit = rows.length >= WORKSPACE_LINK_MAX_COUNT;

            if (addButton) {
                addButton.disabled = reachedLimit;
                addButton.setAttribute('aria-disabled', String(reachedLimit));
                addButton.title = reachedLimit ? '외부 링크는 최대 5개까지 등록할 수 있어요.' : '';
            }
            if (count) {
                count.textContent = rows.length + ' / ' + WORKSPACE_LINK_MAX_COUNT;
            }
        }

        function addWorkspaceLink(name, url) {
            const list = document.getElementById('workspaceLinkList');
            if (!list) return;

            const rows = getWorkspaceLinkRows();
            if (rows.length >= WORKSPACE_LINK_MAX_COUNT) {
                alert('외부 링크는 최대 5개까지 등록할 수 있어요.');
                return;
            }

            const row = document.createElement('div');
            row.className = 'workspace-link-row';
            row.innerHTML =
                '<input type="text" name="linkName" class="form-control" maxlength="50" placeholder="링크 이름" autocomplete="off">' +
                '<input type="url" name="linkUrl" class="form-control" maxlength="500" placeholder="https://example.com" inputmode="url" autocomplete="url">' +
                '<button type="button" class="workspace-link-remove" onclick="removeWorkspaceLink(this)" aria-label="링크 삭제">×</button>';
            row.querySelector('[name="linkName"]').value = name || '';
            row.querySelector('[name="linkUrl"]').value = url || '';
            list.appendChild(row);
            syncWorkspaceLinkControls();
            row.querySelector('[name="linkName"]').focus();
        }

        function removeWorkspaceLink(button) {
            const row = button ? button.closest('.workspace-link-row') : null;
            if (!row) return;
            row.remove();
            syncWorkspaceLinkControls();
        }

        document.addEventListener('DOMContentLoaded', syncWorkspaceLinkControls);


        function saveWorkspaceMemberPosition(userId) {
            const row = document.querySelector(
                '.workspace-member-manage-row[data-user-id="' + userId + '"]'
            );
            if (!row) return;

            const positionInput = row.querySelector('.workspace-member-position-input');
            const saveButton = row.querySelector('.workspace-member-position-save');
            const params = new URLSearchParams();

            params.append('wsId', '${workspace.wsId}');
            params.append('userId', userId);
            params.append('positionName', positionInput.value.trim());

            saveButton.disabled = true;
            saveButton.textContent = '저장 중';

            fetch(WORKSPACE_CONTEXT_PATH + '/workspace/api/update-member-position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                if (result === 'success') {
                    alert('워크스페이스 역할을 저장했습니다.');
                    return;
                }
                alert('워크스페이스 역할 저장에 실패했습니다.');
            })
            .catch(function(error) {
                console.error('워크스페이스 역할 저장 실패:', error);
                alert('워크스페이스 역할 저장 중 오류가 발생했습니다.');
            })
            .finally(function() {
                saveButton.disabled = false;
                saveButton.textContent = '역할 저장';
            });
        }

        function transferWorkspaceLeaderFromSettings(userId, memberName, select, previousRole) {
            if (!confirm(memberName + ' 멤버에게 그룹장 권한을 넘기시겠습니까?\n기존 그룹장은 관리자로 변경됩니다.')) {
                if (select) select.value = previousRole || 'MEMBER';
                return;
            }

            if (select) {
                select.disabled = true;
            }

            const params = new URLSearchParams();
            params.append('wsId', '${workspace.wsId}');
            params.append('newAdminId', userId);

            fetch(WORKSPACE_CONTEXT_PATH + '/workspace/api/transfer-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                if (result === 'success') {
                    alert('그룹장을 위임했습니다.');
                    location.reload();
                    return;
                }

                if (select) {
                    select.disabled = false;
                    select.value = previousRole || 'MEMBER';
                }

                if (result === 'owner_only') {
                    alert('현재 그룹장만 그룹장 권한을 넘길 수 있습니다.');
                } else {
                    alert('그룹장 위임에 실패했습니다.');
                }
            })
            .catch(function(error) {
                console.error('그룹장 위임 실패:', error);
                if (select) {
                    select.disabled = false;
                    select.value = previousRole || 'MEMBER';
                }
                alert('그룹장 위임 중 오류가 발생했습니다.');
            });
        }

        function changeWorkspaceMemberRole(select, userId) {
            const previousRole = select.dataset.previousRole || 'MEMBER';
            const role = select.value;
            const row = select.closest('.workspace-member-manage-row');
            const memberNameElement = row ? row.querySelector('.workspace-member-manage-name') : null;
            const memberName = memberNameElement ? memberNameElement.textContent.trim() : '선택한';

            if (role === 'OWNER') {
                transferWorkspaceLeaderFromSettings(userId, memberName, select, previousRole);
                return;
            }

            if (!confirm('이 멤버의 권한을 변경하시겠습니까?')) {
                select.value = previousRole;
                return;
            }

            select.disabled = true;

            const params = new URLSearchParams();
            params.append('wsId', '${workspace.wsId}');
            params.append('userId', userId);
            params.append('role', role);

            fetch(WORKSPACE_CONTEXT_PATH + '/workspace/api/update-member-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                select.disabled = false;

                if (result === 'success') {
                    select.dataset.previousRole = role;
                    alert('멤버 권한을 변경했습니다.');
                    return;
                }

                select.value = previousRole;
                if (result === 'owner_role_locked') {
                    alert('그룹장 권한은 선택 즉시 위임 방식으로만 변경할 수 있습니다.');
                } else {
                    alert('멤버 권한 변경에 실패했습니다.');
                }
            })
            .catch(function(error) {
                console.error('워크스페이스 권한 변경 실패:', error);
                select.disabled = false;
                select.value = previousRole;
                alert('멤버 권한 변경 중 오류가 발생했습니다.');
            });
        }

        function removeWorkspaceMemberFromSettings(userId, memberName) {
            if (!confirm(memberName + ' 멤버를 워크스페이스에서 내보내시겠습니까?')) return;

            const params = new URLSearchParams();
            params.append('wsId', '${workspace.wsId}');
            params.append('userId', userId);

            fetch(WORKSPACE_CONTEXT_PATH + '/workspace/api/remove-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                if (result === 'success') {
                    const row = document.querySelector(
                        '.workspace-member-manage-row[data-user-id="' + userId + '"]'
                    );
                    if (row) row.remove();
                    alert('멤버를 그룹에서 내보냈습니다.');
                    return;
                }

                if (result === 'owner_protected') {
                    alert('그룹장은 내보낼 수 없습니다. 그룹장 위임 후 탈퇴할 수 있습니다.');
                    location.reload();
                    return;
                }

                if (result === 'forbidden') {
                    alert('이 멤버를 내보낼 권한이 없습니다.');
                    location.reload();
                    return;
                }

                if (result === 'member_not_found') {
                    alert('그룹 멤버 정보를 찾을 수 없습니다.');
                    location.reload();
                    return;
                }

                alert('멤버 내보내기에 실패했습니다.');
            })
            .catch(function(error) {
                console.error('워크스페이스 멤버 내보내기 실패:', error);
                alert('멤버 내보내기 중 오류가 발생했습니다.');
            });
        }

        let workspaceSettingsSaving = false;
        let workspaceSettingsRedirecting = false;

        window.addEventListener('pageshow', function(event) {
            // 뒤로/앞으로 가기 캐시로 페이지가 복원돼도 저장 버튼이 잠긴 채 남지 않게 한다.
            if (!workspaceSettingsRedirecting) {
                setWorkspaceSettingsSaving(false);
            }
        });

        document.addEventListener('DOMContentLoaded', function() {
            const settingsForm = document.getElementById('settingsForm');
            if (settingsForm) {
                settingsForm.addEventListener('submit', function(event) {
                    event.preventDefault();
                    updateWorkspaceSetting();
                });
            }
        });

        function setWorkspaceSettingsSaving(saving) {
            const button = document.getElementById('workspaceSettingsSaveButton');
            workspaceSettingsSaving = saving;

            if (!button) return;

            if (!button.dataset.defaultText) {
                button.dataset.defaultText = button.textContent.trim();
            }

            button.disabled = saving;
            button.setAttribute('aria-busy', saving ? 'true' : 'false');
            button.classList.toggle('is-saving', saving);
            button.textContent = saving ? '저장 중...' : button.dataset.defaultText;
        }

        // 그룹 정보 수정 (UPDATE) AJAX 호출
        function normalizeWorkspaceName(value) {
            return String(value || '')
                .replace(/\u00A0/g, ' ')
                .replace(/[\u200B\uFEFF]/g, '')
                .trim()
                .replace(/\s+/g, ' ');
        }

        async function updateWorkspaceSetting() {
            if (workspaceSettingsSaving) return;

            const wsNameInput = document.getElementById('wsName');
            const wsName = normalizeWorkspaceName(wsNameInput ? wsNameInput.value : '');
            if (!wsName) {
                alert("그룹 이름을 입력해 주세요.");
                wsNameInput?.focus();
                return;
            }
            if (wsName.length > 60) {
                alert("그룹 이름은 60자 이하로 입력해 주세요.");
                wsNameInput?.focus();
                return;
            }
            if (wsNameInput) {
                wsNameInput.value = wsName;
            }

            const linkRows = document.querySelectorAll('#settingsForm .workspace-link-row');
            if (linkRows.length > WORKSPACE_LINK_MAX_COUNT) {
                alert('외부 링크는 최대 5개까지 등록할 수 있어요.');
                return;
            }

            const validatedWorkspaceLinkUrls = new Set();

            for (let i = 0; i < linkRows.length; i++) {
                const nameInput = linkRows[i].querySelector('[name="linkName"]');
                const urlInput = linkRows[i].querySelector('[name="linkUrl"]');
                const name = nameInput ? nameInput.value.trim().replace(/\s+/g, ' ') : '';
                const url = urlInput ? urlInput.value.trim() : '';

                if (nameInput) nameInput.value = name;
                if (urlInput) urlInput.value = url;

                if (!name && !url) continue;
                if (!name || !url) {
                    alert('링크 이름과 주소를 모두 입력해 주세요.');
                    (!name ? nameInput : urlInput)?.focus();
                    return;
                }

                if (!/^https?:\/\//i.test(url)) {
                    alert('링크 주소는 http:// 또는 https://로 시작해야 해요.');
                    urlInput?.focus();
                    return;
                }

                let normalizedUrl;
                try {
                    const parsed = new URL(url);
                    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) {
                        throw new Error('invalid');
                    }
                    normalizedUrl = parsed.href;
                    urlInput.value = normalizedUrl;
                } catch (error) {
                    alert('올바른 외부 링크 주소를 입력해 주세요.');
                    urlInput?.focus();
                    return;
                }

                const duplicateKey = normalizedUrl.toLowerCase();
                if (validatedWorkspaceLinkUrls.has(duplicateKey)) {
                    alert('같은 링크 주소는 중복해서 등록할 수 없어요.');
                    urlInput?.focus();
                    return;
                }
                validatedWorkspaceLinkUrls.add(duplicateKey);
            }

            setWorkspaceSettingsSaving(true);

            let formData;
            try {
                const form = $('#settingsForm')[0];
                formData = new FormData(form);
                const editedImageBlob = await workspaceSettingsImageEditor.getBlob();
                if (editedImageBlob) {
                    formData.set('wsImage', editedImageBlob, 'workspace-image.png');
                    const originalImageFile = workspaceSettingsImageEditor.getOriginalFile();
                    if (originalImageFile) {
                        formData.set('wsImageOriginal', originalImageFile, originalImageFile.name);
                    }
                }
            } catch (error) {
                console.error('그룹 설정 저장 준비 실패:', error);
                setWorkspaceSettingsSaving(false);
                alert('이미지 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
                return;
            }

            $.ajax({
                url: WORKSPACE_CONTEXT_PATH + '/workspace/api/update',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
                success: function(res) {
                    if (res && res.success === true) {
                        workspaceSettingsRedirecting = true;
                        const successMessage = res.message || '그룹 정보가 수정되었습니다.';

                        try {
                            sessionStorage.setItem(
                                'moyoWorkspaceSettingsSuccess',
                                successMessage
                            );
                        } catch (storageError) {
                        }

                        // 설정 페이지를 현재 히스토리 항목에서 교체해
                        // 뒤로 가기로 수정 폼이 다시 열리지 않게 한다.
                        window.location.replace(
                            WORKSPACE_CONTEXT_PATH
                            + '/workspace/main?wsId=${workspace.wsId}'
                            + '&updated=' + Date.now()
                        );
                        return;
                    }

                    const message = res && res.message
                            ? res.message
                            : "수정에 실패했습니다. 입력값을 확인해 주세요.";
                    alert(message);

                    if (res && res.code === 'LOGIN_REQUIRED') {
                        location.href = WORKSPACE_CONTEXT_PATH + '/login';
                    }
                },
                error: function(xhr) {
                    console.error("수정 중 오류 발생:", xhr);
                    const response = xhr.responseJSON;
                    alert(response && response.message
                            ? response.message
                            : "서버 통신 오류가 발생했습니다.");
                },
                complete: function() {
                    if (!workspaceSettingsRedirecting) {
                        setWorkspaceSettingsSaving(false);
                    }
                }
            });
        }

        // 그룹 완전 삭제 (DELETE) AJAX 호출
        function deleteWorkspace() {
            if (confirm("정말로 이 그룹을 삭제하시겠습니까?\n삭제 후 프로젝트, 게시글, 멤버십을 포함한 모든 데이터가 복구 불가능하게 파괴됩니다.")) {
                $.ajax({
                    url: WORKSPACE_CONTEXT_PATH + '/workspace/api/delete',
                    type: 'POST',
                    data: { wsId: "${workspace.wsId}" },
                    success: function(res) {
                        if (res === 'success') {
                            alert("그룹이 안전하게 폐쇄 및 완전히 삭제되었습니다.");
                            location.href = WORKSPACE_CONTEXT_PATH + '/workspace/list'; 
                        } else {
                            alert("그룹 삭제 처리에 실패했습니다. 권한을 확인하세요.");
                        }
                    },
                    error: function(err) {
                        console.error("삭제 중 오류 발생:", err);
                        alert("서버 통신 오류가 발생했습니다.");
                    }
                });
            }
        }

        function switchWorkspaceSettingsTab(tabName) {
            const basic = document.getElementById('settingsTabBasic');
            const members = document.getElementById('settingsTabMembers');

            basic.classList.toggle('is-active', tabName === 'basic');
            members.classList.toggle('is-active', tabName === 'members');

            document.querySelectorAll('.settings-tab-button').forEach(function(button) {
                button.classList.toggle('is-active', button.dataset.tab === tabName);
            });

            const url = new URL(window.location.href);
            if (tabName === 'members') {
                url.searchParams.set('tab', 'members');
            } else {
                url.searchParams.delete('tab');
            }
            history.replaceState(null, '', url);
        }

        function cancelWorkspacePendingInvitation(inviteId, button) {
            if (!inviteId) return;
            if (!confirm('보낸 그룹 초대를 취소하시겠습니까?')) return;

            const row = button ? button.closest('.workspace-pending-invite-row') : null;
            if (button) {
                button.disabled = true;
                button.textContent = '취소 중';
            }

            fetch(WORKSPACE_CONTEXT_PATH + '/workspace/api/invitations/' + encodeURIComponent(inviteId) + '/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .then(function(response) {
                if (!response.ok) throw new Error('CANCEL_FAILED');
                return response.json();
            })
            .then(function(result) {
                if (!result.success) {
                    if (result.status === 'LOGIN_REQUIRED') {
                        alert('로그인이 필요합니다.');
                    } else if (result.status === 'FORBIDDEN') {
                        alert('초대를 취소할 권한이 없습니다.');
                    } else if (result.status === 'ALREADY_PROCESSED') {
                        alert('이미 처리된 초대입니다.');
                    } else {
                        alert('초대 취소에 실패했습니다.');
                    }
                    return;
                }

                if (row) row.remove();
                updateWorkspacePendingInviteState();
            })
            .catch(function(error) {
                console.error(error);
                alert('초대 취소 중 오류가 발생했습니다.');
            })
            .finally(function() {
                if (button && document.body.contains(button)) {
                    button.disabled = false;
                    button.textContent = '취소';
                }
            });
        }

        function updateWorkspacePendingInviteState() {
            const section = document.getElementById('workspacePendingInviteSection');
            const list = document.getElementById('workspacePendingInviteList');
            const count = document.getElementById('workspacePendingInviteCount');
            if (!list) return;

            const rows = list.querySelectorAll('.workspace-pending-invite-row');
            if (count) count.textContent = rows.length + '건';

            if (rows.length === 0 && section) {
                section.remove();
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            const params = new URLSearchParams(window.location.search);
            switchWorkspaceSettingsTab(
                params.get('tab') === 'members' ? 'members' : 'basic'
            );
        });

    </script>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="workspace-settings-page">
        <section class="settings-hero">
            <div class="settings-hero-main">
                <div class="settings-hero-avatar" aria-hidden="true">
                    <c:choose>
                        <c:when test="${not empty workspace.wsImagePath}"><img src="${workspace.wsImagePath}" alt=""></c:when>
                        <c:otherwise>${fn:toUpperCase(fn:substring(workspace.wsName, 0, 1))}</c:otherwise>
                    </c:choose>
                </div>
                <div class="settings-hero-copy">
                    <span class="settings-kicker">그룹 설정</span>
                    <h1>${workspace.wsName}</h1>
                    <p>그룹 정보와 가입 방식, 외부 링크를 관리합니다.</p>
                </div>
            </div>
            <div class="settings-hero-actions">
                <a href="${pageContext.request.contextPath}/workspace/main?wsId=${workspace.wsId}"
                   class="settings-back-link">그룹 홈</a>
            </div>
        </section>

        <div class="settings-tabs" role="tablist">
            <button type="button"
                    class="settings-tab-button"
                    data-tab="basic"
                    onclick="switchWorkspaceSettingsTab('basic')">기본 설정</button>
            <button type="button"
                    class="settings-tab-button"
                    data-tab="members"
                    onclick="switchWorkspaceSettingsTab('members')">멤버 관리</button>
        </div>

        <div class="settings-layout">
            <div id="settingsTabBasic" class="settings-tab-panel">
            <section class="settings-card">
                <form id="settingsForm">
<input type="hidden" id="removeWorkspaceImage" name="removeWorkspaceImage" value="N">
                    <input type="hidden" id="workspaceImageOriginalPath" value="<c:out value='${workspace.wsImageOriginalPath}'/>">
                    <input type="hidden" id="wsImageCropScale" name="wsImageCropScale" value="${empty workspace.wsImageCropScale ? 1.15 : workspace.wsImageCropScale}">
                    <input type="hidden" id="wsImageCropX" name="wsImageCropX" value="${empty workspace.wsImageCropX ? 0 : workspace.wsImageCropX}">
                    <input type="hidden" id="wsImageCropY" name="wsImageCropY" value="${empty workspace.wsImageCropY ? 0 : workspace.wsImageCropY}">
                    <input type="hidden" name="wsId" value="${workspace.wsId}">

                    <div class="settings-section">
                        <div class="settings-section-head">
                            <h2>기본 정보</h2>
                            <p>그룹 이름, 유형과 소개를 수정합니다.</p>
                        </div>

                        <div class="settings-form-grid">
                            <div class="form-group">
                                <label for="wsName">그룹 이름</label>
                                <input type="text"
                                       id="wsName"
                                       name="wsName"
                                       class="form-control"
                                       value="<c:out value='${workspace.wsName}'/>"
                                       maxlength="60"
                                       placeholder="그룹 이름">
                            </div>

                            <div class="form-group">
                                <label for="wsType">그룹 유형</label>
                                <select id="wsType" name="wsType" class="form-control">
                                    <option value="ORGANIZATION" ${workspace.wsType eq 'ORGANIZATION' ? 'selected' : ''}>회사 · 조직</option>
                                    <option value="TEAM" ${workspace.wsType eq 'TEAM' ? 'selected' : ''}>팀 · 협업</option>
                                    <option value="STUDY" ${workspace.wsType eq 'STUDY' ? 'selected' : ''}>스터디 · 연구</option>
                                    <option value="COMMUNITY" ${empty workspace.wsType or workspace.wsType eq 'COMMUNITY' ? 'selected' : ''}>모임 · 커뮤니티</option>
                                    <option value="CLUB" ${workspace.wsType eq 'CLUB' ? 'selected' : ''}>동아리 · 취미</option>
                                    <option value="LIFE" ${workspace.wsType eq 'LIFE' ? 'selected' : ''}>가족 · 생활</option>
                                    <option value="ETC" ${workspace.wsType eq 'ETC' ? 'selected' : ''}>기타</option>
                                </select>
                            </div>

                            <div class="form-group full">
                                <label for="wsDescription">그룹 소개</label>
                                <textarea id="wsDescription"
                                          name="wsDescription"
                                          class="form-control"
                                          maxlength="300"
                                          placeholder="그룹을 소개해주세요"><c:out value="${workspace.wsDescription}"/></textarea>
                            </div>
                        </div>

                        <div class="form-group full" style="margin-top:14px;">
                            <span class="field-label">가입 방식</span>
                            <div class="join-type-options" role="radiogroup" aria-label="그룹 가입 방식">
                                <label class="join-type-option">
                                    <input type="radio" name="joinType" value="OPEN" ${empty workspace.joinType or workspace.joinType eq 'OPEN' ? 'checked' : ''}>
                                    <span class="join-type-card"><span class="join-type-badge">자유 가입</span><strong>누구나 바로 참여</strong><p>공개된 그룹을 확인한 사용자가 승인 없이 바로 참여할 수 있어요.</p></span>
                                </label>
                                <label class="join-type-option">
                                    <input type="radio" name="joinType" value="APPROVAL" ${workspace.joinType eq 'APPROVAL' ? 'checked' : ''}>
                                    <span class="join-type-card"><span class="join-type-badge">승인제</span><strong>승인 후 참여</strong><p>참여 요청을 그룹장 또는 그룹 관리자가 승인해야 참여해요.</p></span>
                                </label>
                                <label class="join-type-option">
                                    <input type="radio" name="joinType" value="INVITE_ONLY" ${workspace.joinType eq 'INVITE_ONLY' ? 'checked' : ''}>
                                    <span class="join-type-card"><span class="join-type-badge">초대 전용</span><strong>초대받은 사용자만 참여</strong><p>그룹장이나 그룹 관리자의 초대로만 참여해요.</p></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section settings-media-section">
                        <div class="settings-media-grid">
                            <div class="settings-media-panel">
                                <div class="settings-section-head">
                                    <h2>대표 이미지</h2>
                                    <p>그룹 메인과 사이드바에 표시됩니다.</p>
                                </div>

                                <div class="workspace-image-summary settings-workspace-image-summary">
                                    <div class="workspace-image-preview" aria-label="그룹 대표 이미지 미리보기">
                                        <c:choose>
                                            <c:when test="${not empty workspace.wsImagePath}">
                                                <img id="workspacePreviewImage" src="${workspace.wsImagePath}" alt="그룹 대표 이미지">
                                            </c:when>
                                            <c:otherwise>
                                                <img id="workspacePreviewImage" hidden alt="그룹 대표 이미지">
                                            </c:otherwise>
                                        </c:choose>
                                        <span id="workspaceImagePlaceholder" <c:if test="${not empty workspace.wsImagePath}">hidden</c:if>>${fn:toUpperCase(fn:substring(workspace.wsName, 0, 1))}</span>
                                    </div>
                                    <div class="workspace-image-copy">
                                        <strong>그룹 대표 이미지</strong>
                                        <div class="profile-account-actions">
                                            <label id="workspaceImageSelectLabel" for="wsImage" class="profile-account-button is-primary">이미지 선택</label>
                                            <input type="file" id="wsImage" name="wsImage" accept="image/png,image/jpeg,image/webp" hidden>
                                            <button type="button" id="workspaceImageAdjustButton" class="profile-account-button" <c:if test="${empty workspace.wsImagePath}">disabled</c:if>>이미지 조정</button>
                                            <button type="button"
                                                    id="workspaceImageDefaultButton"
                                                    class="profile-account-button"
                                                    <c:if test="${empty workspace.wsImagePath}">disabled</c:if>>이미지 삭제</button>
                                        </div>
                                        <p>이미지를 선택한 뒤 위치와 크기를 조정할 수 있어요.</p>
                                    </div>
                                </div>
                            </div>

                            <div class="settings-media-panel">
                                <div class="settings-section-head settings-section-head-with-action">
                                    <div>
                                        <h2>외부 링크</h2>
                                        <p>등록된 링크는 그룹 히어로 영역에 표시됩니다.</p>
                                    </div>
                                    <div class="workspace-link-head-actions">
                                        <span id="workspaceLinkCount" class="workspace-link-count" aria-live="polite"></span>
                                        <button type="button" id="workspaceLinkAddButton" class="workspace-link-add" onclick="addWorkspaceLink()">+ 링크 추가</button>
                                    </div>
                                </div>

                                <div id="workspaceLinkList" class="workspace-link-list">
                                    <c:choose>
                                        <c:when test="${not empty workspaceLinks}">
                                            <c:forEach var="link" items="${workspaceLinks}">
                                                <div class="workspace-link-row">
                                                    <input type="text"
                                                           name="linkName"
                                                           class="form-control"
                                                           maxlength="50"
                                                           value="<c:out value='${link.LINK_NAME}'/>"
                                                           placeholder="링크 이름">
                                                    <input type="text"
                                                           name="linkUrl"
                                                           type="url"
                                                           inputmode="url"
                                                           autocomplete="url"
                                                           class="form-control"
                                                           maxlength="500"
                                                           value="<c:out value='${link.LINK_URL}'/>"
                                                           placeholder="https://example.com">
                                                    <button type="button"
                                                            class="workspace-link-remove"
                                                            onclick="removeWorkspaceLink(this)"
                                                            aria-label="링크 삭제">×</button>
                                                </div>
                                            </c:forEach>
                                        </c:when>
                                        <c:otherwise>
                                            <div class="workspace-link-row">
                                                <input type="text" name="linkName" class="form-control" maxlength="50" placeholder="링크 이름">
                                                <input type="url" name="linkUrl" class="form-control" maxlength="500" inputmode="url" autocomplete="url" placeholder="https://example.com">
                                                <button type="button"
                                                        class="workspace-link-remove"
                                                        onclick="removeWorkspaceLink(this)"
                                                        aria-label="링크 삭제">×</button>
                                            </div>
                                        </c:otherwise>
                                    </c:choose>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div class="settings-save-bar">
                        <a href="${pageContext.request.contextPath}/workspace/main?wsId=${workspace.wsId}" class="settings-btn">취소</a>
                        <button type="submit" id="workspaceSettingsSaveButton" class="settings-btn settings-btn-primary" aria-busy="false">변경사항 저장</button>
                    </div>
                </form>
            </section>

            <section class="settings-side-card danger-zone">
                <div class="danger-zone-copy">
                    <h3>위험 구역</h3>
                    <p>그룹을 삭제하면 프로젝트, 게시글, 멤버 정보가 모두 삭제되며 복구할 수 없습니다.</p>
                </div>
                <button type="button" class="btn-delete" onclick="deleteWorkspace()">그룹 삭제</button>
            </section>
            </div>

            <div id="settingsTabMembers" class="settings-tab-panel">
                <section class="settings-card">
                    <div class="member-tab-head">
                        <div>
                            <h2>멤버 관리</h2>
                            <p>권한과 그룹 내 역할을 관리합니다.</p>
                        </div>
                        <button type="button"
                                class="member-tab-invite"
                                onclick="openTabInviteModal()">+ 멤버 초대</button>
                    </div>

                    <div class="member-search-box">
                        <input type="text"
                               id="workspaceMemberSearchInput"
                               placeholder="이름, 이메일, 역할로 검색"
                               oninput="filterWorkspaceMembers()">
                    </div>


                    <div class="workspace-member-manage-list" id="workspaceMemberManageList">
                        <c:forEach var="member" items="${memberList}">
                            <div class="workspace-member-manage-row"
                                 data-user-id="${member.USER_ID}"
                                 data-search="${fn:toLowerCase(member.DISPLAY_NAME)} ${fn:toLowerCase(member.EMAIL)} ${fn:toLowerCase(member.WS_ROLE)} ${fn:toLowerCase(member.POSITION_NAME)}">
                                <div class="workspace-member-manage-info">
                                    <button type="button"
                                            class="workspace-member-manage-avatar workspace-member-profile-trigger ${not empty member.PROFILE_IMAGE_PATH ? 'has-image' : 'is-default-profile'}"
                                            aria-label="<c:out value='${member.DISPLAY_NAME}'/> 프로필 보기"
                                            onclick="openWorkspaceMemberProfile(${member.USER_ID})">
                                        <c:choose>
                                            <c:when test="${not empty member.PROFILE_IMAGE_PATH}">
                                                <img src="<c:out value='${member.PROFILE_IMAGE_PATH}'/>"
                                                     alt="<c:out value='${member.DISPLAY_NAME}'/> 프로필"
                                                     onerror="
                                                         const avatar = this.closest('.workspace-member-manage-avatar');
                                                         if (avatar) {
                                                             avatar.classList.remove('has-image');
                                                             avatar.classList.add('is-default-profile');
                                                         }
                                                         this.remove();
                                                     ">
                                                <span class="workspace-member-manage-avatar-fallback">
                                                    <c:out value="${fn:substring(member.DISPLAY_NAME,0,1)}"/>
                                                </span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="workspace-member-manage-avatar-fallback">
                                                    <c:out value="${fn:substring(member.DISPLAY_NAME,0,1)}"/>
                                                </span>
                                            </c:otherwise>
                                        </c:choose>
                                    </button>
                                    <div class="workspace-member-manage-text">
                                        <button type="button"
                                                class="workspace-member-profile-name-trigger"
                                                aria-label="<c:out value='${member.DISPLAY_NAME}'/> 프로필 보기"
                                                onclick="openWorkspaceMemberProfile(${member.USER_ID})">
                                            <span class="workspace-member-manage-name">
                                                <c:out value="${member.DISPLAY_NAME}"/>
                                            </span>
                                        </button>
                                        <span class="workspace-member-manage-email">
                                            <c:out value="${member.EMAIL}"/>
                                        </span>
                                        <c:if test="${not empty member.JOINED_AT}">
                                            <span class="workspace-member-manage-joined">
                                                <c:out value="${member.JOINED_AT}"/> 가입
                                            </span>
                                        </c:if>
                                    </div>
                                </div>

                                <c:choose>
                                    <c:when test="${member.USER_ID eq workspace.ownerId}">
                                        <select class="workspace-member-role-select" disabled>
                                            <option>그룹장</option>
                                        </select>
                                    </c:when>
                                    <c:otherwise>
                                        <select class="workspace-member-role-select"
                                                data-previous-role="${member.WS_ROLE}"
                                                onchange="changeWorkspaceMemberRole(this, ${member.USER_ID})">
                                            <c:if test="${currentUserIsOwner}">
                                                <option value="OWNER">그룹장</option>
                                            </c:if>
                                            <option value="ADMIN" ${member.WS_ROLE eq 'ADMIN' ? 'selected' : ''}>관리자</option>
                                            <option value="MEMBER" ${member.WS_ROLE ne 'ADMIN' ? 'selected' : ''}>멤버</option>
                                        </select>
                                    </c:otherwise>
                                </c:choose>

                                <input type="text"
                                       class="workspace-member-position-input"
                                       maxlength="50"
                                       value="<c:out value='${member.POSITION_NAME}'/>"
                                       placeholder="담당 역할을 입력하세요">

                                <button type="button"
                                        class="workspace-member-position-save"
                                        onclick="saveWorkspaceMemberPosition(${member.USER_ID})">역할 저장</button>

                                <div class="workspace-member-actions">
                                    <c:choose>
                                        <c:when test="${member.USER_ID eq workspace.ownerId}">
                                            <span class="workspace-member-owner-protected">그룹장 보호</span>
                                        </c:when>
                                        <c:when test="${member.USER_ID ne currentUserId}">
                                            <button type="button"
                                                    class="workspace-member-kick-button"
                                                    onclick="removeWorkspaceMemberFromSettings(${member.USER_ID}, '<c:out value="${member.DISPLAY_NAME}"/>')">
                                                내보내기
                                            </button>
                                        </c:when>
                                    </c:choose>
                                </div>
                            </div>
                        </c:forEach>
                    </div>
                    <div id="workspaceMemberEmpty" class="workspace-member-empty">검색된 멤버가 없습니다.</div>

                    <p class="workspace-member-role-note">
                        그룹장은 권한 선택에서 그룹장을 선택해 바로 위임할 수 있습니다. 기존 그룹장은 관리자로 변경됩니다.
                    </p>

                    <c:if test="${not empty pendingInvitationList}">
                        <section class="workspace-pending-invites" id="workspacePendingInviteSection">
                            <div class="workspace-pending-invite-head">
                                <div>
                                    <h3>초대 대기</h3>
                                    <p>아직 수락하지 않은 초대만 관리합니다.</p>
                                </div>
                                <span class="workspace-pending-invite-count" id="workspacePendingInviteCount">
                                    <c:out value="${fn:length(pendingInvitationList)}"/>건
                                </span>
                            </div>

                            <div class="workspace-pending-invite-list" id="workspacePendingInviteList">
                                <c:forEach var="invite" items="${pendingInvitationList}">
                                    <div class="workspace-pending-invite-row" data-invite-id="${invite.INVITE_ID}">
                                        <div class="workspace-pending-invite-info">
                                            <div class="workspace-pending-invite-avatar">
                                                <c:choose>
                                                    <c:when test="${not empty invite.INVITEE_PROFILE_IMAGE_PATH}">
                                                        <img src="${invite.INVITEE_PROFILE_IMAGE_PATH}" alt="" onerror="this.remove();">
                                                    </c:when>
                                                    <c:otherwise>
                                                        <c:out value="${fn:substring(invite.INVITEE_NAME,0,1)}"/>
                                                    </c:otherwise>
                                                </c:choose>
                                            </div>
                                            <div class="workspace-pending-invite-text">
                                                <span class="workspace-pending-invite-name"><c:out value="${invite.INVITEE_NAME}"/></span>
                                                <span class="workspace-pending-invite-email"><c:out value="${invite.INVITEE_EMAIL}"/></span>
                                                <c:if test="${not empty invite.SENT_AT}">
                                                    <span class="workspace-pending-invite-date"><c:out value="${invite.SENT_AT}"/> 초대</span>
                                                </c:if>
                                            </div>
                                        </div>
                                        <button type="button"
                                                class="workspace-pending-invite-cancel"
                                                onclick="cancelWorkspacePendingInvitation(${invite.INVITE_ID}, this)">초대 취소</button>
                                    </div>
                                </c:forEach>
                            </div>
                        </section>
                    </c:if>
                </section>
            </div>
        </div>
    </main>
    <jsp:include page="/WEB-INF/views/common/commonWorkspaceInvite.jsp" />

<div id="workspaceImageCropModal" class="signup-profile-modal" hidden role="dialog" aria-modal="true" aria-labelledby="workspaceImageCropTitle">
    <div class="signup-profile-modal-backdrop" data-workspace-image-close></div>
    <div class="signup-profile-modal-dialog">
        <div class="signup-profile-modal-head">
            <div>
                <span class="signup-profile-modal-kicker">그룹 이미지 조정</span>
                <h3 id="workspaceImageCropTitle">영역 안에 이미지를 맞춰주세요</h3>
            </div>
            <button type="button" class="signup-profile-modal-close" data-workspace-image-close aria-label="닫기">×</button>
        </div>
        <div id="workspaceImageCropViewport" class="workspace-image-modal-viewport">
            <img id="workspaceImageCropImage" alt="그룹 이미지 조정 미리보기">
        </div>
        <div class="signup-profile-crop-control">
            <div class="signup-profile-crop-head"><span>이미지 크기</span><output id="workspaceImageScaleValue">115%</output></div>
            <input id="workspaceImageScale" type="range" min="100" max="200" step="1" value="115">
        </div>
        <p class="signup-profile-modal-hint">드래그로 위치를 맞추고 크기를 조정하세요.</p>
        <div class="signup-profile-modal-actions signup-profile-modal-actions--simple">
            <label for="wsImage" class="signup-secondary-button">이미지 다시 선택</label>
            <button type="button" id="workspaceImageApplyButton" class="signup-primary-button signup-profile-apply">적용</button>
        </div>
    </div>
</div>
<jsp:include page="/WEB-INF/views/common/commonMemberProfile.jsp">
    <jsp:param name="profileScope" value="group"/>
    <jsp:param name="scopeId" value="${workspace.wsId}"/>
    <jsp:param name="ownerLabel" value="그룹장"/>
    <jsp:param name="adminLabel" value="관리자"/>
    <jsp:param name="memberLabel" value="멤버"/>
</jsp:include>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
