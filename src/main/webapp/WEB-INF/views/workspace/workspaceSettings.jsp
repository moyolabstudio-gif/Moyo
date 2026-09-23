<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="moyoTabFaviconManaged" value="true" scope="request" />
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><c:out value="${workspace.wsName}"/> | MOYO</title>
    <c:choose>
        <c:when test="${not empty workspace.wsImagePath}">
            <link rel="icon" href="<c:out value='${workspace.wsImagePath}'/>">
        </c:when>
        <c:otherwise>
            <link rel="icon" type="image/png" href="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-tab-mascot-v1">
        </c:otherwise>
    </c:choose>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=primary-gradient-135-v1-20260910">
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/commonMemberProfile.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberActivityProfile.css?v=step25-regression-restore-20260911">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        var WORKSPACE_CONFIG = {
            wsId: Number('${workspace.wsId}'),
            currentUserId: Number('${currentUserId}'),
            isAdmin: ${isWorkspaceAdmin ? 'true' : 'false'},
            isOwner: ${currentUserIsOwner ? 'true' : 'false'},
            workspaceStatus: '<c:out value="${workspace.status}"/>',
            deleteStatus: '<c:out value="${workspace.status}"/>',
            contextPath: '${pageContext.request.contextPath}'
        };
    </script>
    <script defer
            src="${pageContext.request.contextPath}/js/commonMemberProfile.js?v=20260908-group-leave-v1"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonMemberActivityProfile.js?v=step25-regression-restore-20260911"></script>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonPeopleModal.css?v=primary-gradient-135-v1-20260910">
    <script defer src="${pageContext.request.contextPath}/js/commonPeopleModal.js?v=202608081545-unified-people-shell"></script>
    <script defer src="${pageContext.request.contextPath}/js/commonWorkspaceInvite.js?v=workspace-invite-common-people-v1"></script>
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/workspaceSettings.css?v=workspace-settings-css-cleanup-20260908">
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/css/common/commonSettings.css?v=member-trigger-fix-v1-20260910">

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
                    markWorkspaceSettingsImageChanged();
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
                    markWorkspaceSettingsImageChanged();
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
            refreshWorkspaceSettingsDirtyState();
            row.querySelector('[name="linkName"]').focus();
        }

        function removeWorkspaceLink(button) {
            const row = button ? button.closest('.workspace-link-row') : null;
            if (!row) return;
            row.remove();
            syncWorkspaceLinkControls();
            refreshWorkspaceSettingsDirtyState();
        }

        document.addEventListener('DOMContentLoaded', syncWorkspaceLinkControls);



        function getWorkspaceMemberRows() {
            return Array.from(document.querySelectorAll('#workspaceMemberManageList .ws-member-row'));
        }

        let workspaceMemberMode = 'view';
        let workspaceMemberSaving = false;

        function getChangedWorkspaceMemberRows() {
            return getWorkspaceMemberRows().filter(function(row) {
                const roleSelect = row.querySelector('.workspace-member-role-edit');
                const positionInput = row.querySelector('.workspace-member-position-edit');
                const nextRole = roleSelect ? roleSelect.value : (row.dataset.role || 'MEMBER');
                const nextPosition = positionInput ? positionInput.value.trim() : '';
                return nextRole !== (row.dataset.role || 'MEMBER')
                    || nextPosition !== (row.dataset.position || '');
            });
        }

        function refreshWorkspaceMemberDirtyState() {
            const saveButton = document.getElementById('workspaceMemberSaveButton');
            if (!saveButton) return;

            const hasChanges = workspaceMemberMode === 'edit' && getChangedWorkspaceMemberRows().length > 0;
            saveButton.disabled = workspaceMemberSaving || !hasChanges;
            saveButton.textContent = workspaceMemberSaving ? '저장 중...' : '변경사항 저장';
        }

        function getSelectedWorkspaceMemberRows() {
            if (workspaceMemberMode !== 'remove') return [];
            return getWorkspaceMemberRows().filter(function(row) {
                const checkbox = row.querySelector('.workspace-member-select');
                return checkbox && checkbox.checked && !checkbox.disabled && !row.hidden;
            });
        }

        function setWorkspaceMemberMode(mode, restore) {
            const memberTab = document.getElementById('settingsTabMembers');
            if (!memberTab) return;

            if (restore) {
                getWorkspaceMemberRows().forEach(function(row) {
                    const roleSelect = row.querySelector('.workspace-member-role-edit');
                    const positionInput = row.querySelector('.workspace-member-position-edit');
                    if (roleSelect) roleSelect.value = row.dataset.originalRole || row.dataset.role || 'MEMBER';
                    if (positionInput) positionInput.value = row.dataset.originalPosition || row.dataset.position || '';
                });
            }

            workspaceMemberMode = mode;
            memberTab.classList.toggle('is-member-editing', mode === 'edit');
            memberTab.classList.toggle('is-member-removing', mode === 'remove');

            getWorkspaceMemberRows().forEach(function(row) {
                const checkbox = row.querySelector('.workspace-member-select');
                if (checkbox) checkbox.checked = false;
                row.classList.remove('is-selected');

                const roleSelect = row.querySelector('.workspace-member-role-edit');
                const positionInput = row.querySelector('.workspace-member-position-edit');
                const isOwner = row.dataset.isOwner === 'true';
                const isCurrentUser = row.dataset.isCurrentUser === 'true';
                if (roleSelect) roleSelect.disabled = mode !== 'edit' || isOwner || isCurrentUser;
                if (positionInput) positionInput.disabled = mode !== 'edit';
            });

            syncWorkspaceMemberSelection();
            refreshWorkspaceMemberDirtyState();
        }

        function enterWorkspaceMemberEditMode() {
            getWorkspaceMemberRows().forEach(function(row) {
                row.dataset.originalRole = row.dataset.role || 'MEMBER';
                row.dataset.originalPosition = row.dataset.position || '';
            });
            setWorkspaceMemberMode('edit', false);
        }

        function enterWorkspaceMemberRemoveMode() {
            setWorkspaceMemberMode('remove', false);
        }

        function exitWorkspaceMemberMode(restore) {
            setWorkspaceMemberMode('view', Boolean(restore));
        }

        function getSelectableWorkspaceMemberCheckboxes() {
            return getWorkspaceMemberRows()
                .filter(function(row) {
                    if (row.hidden || row.dataset.isOwner === 'true' || row.dataset.isCurrentUser === 'true') return false;
                    if (!WORKSPACE_CONFIG.isOwner && String(row.dataset.role || '').toUpperCase() === 'ADMIN') return false;
                    return true;
                })
                .map(function(row) { return row.querySelector('.workspace-member-select'); })
                .filter(function(checkbox) { return checkbox && !checkbox.disabled; });
        }

        function syncWorkspaceMemberModeNote() {
            const note = document.getElementById('workspaceMemberRoleNote');
            if (!note) return;

            if (workspaceMemberMode === 'edit') {
                note.textContent = '권한과 직책 · 담당을 수정한 뒤 변경사항 저장을 눌러 한 번에 반영하세요.';
                return;
            }

            if (workspaceMemberMode === 'remove') {
                note.textContent = '내보낼 멤버를 선택하세요. 그룹장은 선택할 수 없습니다.';
                return;
            }

            note.textContent = '';
        }

        function syncWorkspaceMemberSelection() {
            const rows = getWorkspaceMemberRows().filter(function(row) { return !row.hidden; });
            const selectable = getSelectableWorkspaceMemberCheckboxes();
            const selected = selectable.filter(function(box) { return box.checked; });
            const selectAll = document.getElementById('workspaceMemberSelectAll');
            const count = document.getElementById('workspaceMemberSelected');
            const removeButton = document.getElementById('workspaceMemberRemoveConfirmButton');

            if (selectAll) {
                const allSelected = selectable.length > 0 && selected.length === selectable.length;
                const partiallySelected = selected.length > 0 && selected.length < selectable.length;
                selectAll.checked = allSelected;
                selectAll.indeterminate = partiallySelected;
                selectAll.disabled = workspaceMemberMode !== 'remove' || selectable.length === 0;
                selectAll.setAttribute('aria-checked', partiallySelected ? 'mixed' : String(allSelected));
            }
            if (count) count.textContent = '선택 ' + selected.length + '명';
            if (removeButton) {
                removeButton.disabled = selected.length === 0;
                removeButton.textContent = selected.length > 0
                    ? selected.length + '명 내보내기'
                    : '선택 내보내기';
            }
            rows.forEach(function(row) {
                const checkbox = row.querySelector('.workspace-member-select');
                row.classList.toggle('is-selected', workspaceMemberMode === 'remove' && checkbox && checkbox.checked);
            });
            syncWorkspaceMemberModeNote();
        }

        function toggleAllWorkspaceMembers(checked) {
            if (workspaceMemberMode !== 'remove') return;
            getSelectableWorkspaceMemberCheckboxes().forEach(function(checkbox) {
                checkbox.checked = checked;
            });
            syncWorkspaceMemberSelection();
        }

        function filterWorkspaceMembers() {
            const input = document.getElementById('workspaceMemberSearchInput');
            const keyword = String(input ? input.value : '').trim().toLowerCase();
            let visibleCount = 0;
            getWorkspaceMemberRows().forEach(function(row) {
                const matched = !keyword || String(row.dataset.search || '').includes(keyword);
                row.hidden = !matched;
                if (matched) visibleCount += 1;
                const checkbox = row.querySelector('.workspace-member-select');
                if (!matched && checkbox) checkbox.checked = false;
            });
            const empty = document.getElementById('workspaceMemberEmpty');
            if (empty) empty.classList.toggle('is-visible', visibleCount === 0);
            syncWorkspaceMemberSelection();
        }

        function postWorkspaceMemberForm(url, values) {
            const params = new URLSearchParams();
            Object.keys(values).forEach(function(key) { params.append(key, values[key]); });
            return fetch(WORKSPACE_CONTEXT_PATH + url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            }).then(function(response) { return response.text(); });
        }

        async function saveWorkspaceMemberChanges() {
            if (workspaceMemberSaving) return;
            const changedRows = getChangedWorkspaceMemberRows();

            if (!changedRows.length) {
                refreshWorkspaceMemberDirtyState();
                return;
            }
            if (!confirm(changedRows.length + '명의 변경사항을 저장하시겠습니까?')) return;

            const changes = changedRows.map(function(row) {
                const roleSelect = row.querySelector('.workspace-member-role-edit');
                const positionInput = row.querySelector('.workspace-member-position-edit');
                const nextRole = roleSelect ? roleSelect.value : (row.dataset.role || 'MEMBER');
                const nextPosition = positionInput ? positionInput.value.trim() : '';
                const item = { userId: Number(row.dataset.userId) };

                if (roleSelect && nextRole !== (row.dataset.role || 'MEMBER')) {
                    item.role = nextRole;
                }
                if (positionInput && nextPosition !== (row.dataset.position || '')) {
                    item.positionName = nextPosition;
                }
                return item;
            });

            const saveButton = document.getElementById('workspaceMemberSaveButton');
            workspaceMemberSaving = true;
            refreshWorkspaceMemberDirtyState();

            try {
                const result = await postWorkspaceMemberForm('/workspace/api/update-members', {
                    wsId: '${workspace.wsId}',
                    changes: JSON.stringify(changes)
                });
                if (result !== 'success') throw new Error(result || 'MEMBER_UPDATE_FAILED');

                changedRows.forEach(function(row) {
                    const roleSelect = row.querySelector('.workspace-member-role-edit');
                    const positionInput = row.querySelector('.workspace-member-position-edit');
                    const nextRole = roleSelect ? roleSelect.value : (row.dataset.role || 'MEMBER');
                    const nextPosition = positionInput ? positionInput.value.trim() : '';

                    if (roleSelect && nextRole !== row.dataset.role) {
                        row.dataset.role = nextRole;
                        const roleSummary = row.querySelector('.ws-member-role-summary');
                        if (roleSummary) {
                            roleSummary.textContent = nextRole === 'ADMIN' ? '관리자' : '멤버';
                            roleSummary.classList.toggle('is-admin', nextRole === 'ADMIN');
                        }
                    }
                    if (positionInput && nextPosition !== (row.dataset.position || '')) {
                        row.dataset.position = nextPosition;
                        const positionSummary = row.querySelector('.ws-member-position-summary');
                        if (positionSummary) {
                            positionSummary.textContent = nextPosition || '미지정';
                            positionSummary.classList.toggle('is-empty', !nextPosition);
                        }
                    }
                    row.dataset.originalRole = row.dataset.role || 'MEMBER';
                    row.dataset.originalPosition = row.dataset.position || '';
                });

                workspaceMemberSaving = false;
                exitWorkspaceMemberMode(false);
            } catch (error) {
                console.error('멤버 변경사항 저장 실패:', error);
                const code = error && error.message ? error.message : '';
                const messages = {
                    self_role_locked: '내 권한은 멤버 관리에서 직접 변경할 수 없습니다.',
                    owner_role_locked: '그룹장 권한은 멤버 관리에서 변경할 수 없습니다.',
                    member_not_found: '현재 그룹에 없는 멤버가 포함되어 있습니다.',
                    workspace_unavailable: '현재 그룹 상태에서는 멤버 정보를 변경할 수 없습니다.',
                    forbidden: '멤버 정보를 변경할 권한이 없습니다.'
                };
                alert(messages[code] || '변경사항을 저장하지 못했습니다. 입력값을 확인한 뒤 다시 시도해 주세요.');
            } finally {
                workspaceMemberSaving = false;
                refreshWorkspaceMemberDirtyState();
            }
        }

        async function removeSelectedWorkspaceMembers() {
            const rows = getSelectedWorkspaceMemberRows();
            if (!rows.length) return;
            const names = rows.map(function(row) { return row.dataset.memberName; }).filter(Boolean);
            if (!confirm((names.length <= 3 ? names.join(', ') : names.slice(0, 3).join(', ') + ' 외 ' + (names.length - 3) + '명') + '을 그룹에서 내보내시겠습니까?')) return;

            const removeButton = document.getElementById('workspaceMemberRemoveConfirmButton');
            if (removeButton) {
                removeButton.disabled = true;
                removeButton.textContent = '내보내는 중...';
            }

            try {
                const result = await postWorkspaceMemberForm('/workspace/api/remove-members', {
                    wsId: '${workspace.wsId}',
                    userIds: rows.map(function(row) { return row.dataset.userId; }).join(',')
                });
                if (result !== 'success') throw new Error(result || 'REMOVE_FAILED');

                rows.forEach(function(row) { row.remove(); });
                updateWorkspaceMemberTotal();
                exitWorkspaceMemberMode(false);
            } catch (error) {
                console.error('멤버 일괄 내보내기 실패:', error);
                const code = error && error.message ? error.message : '';
                const messages = {
                    self_remove_locked: '본인은 멤버 관리에서 내보낼 수 없습니다.',
                    owner_protected: '그룹장은 내보낼 수 없습니다.',
                    member_not_found: '현재 그룹에 없는 멤버가 포함되어 있습니다.',
                    project_leader_transfer_required: '진행 중인 그룹 프로젝트의 팀장은 먼저 프로젝트 팀장을 다른 멤버에게 위임해야 합니다.',
                    workspace_unavailable: '현재 그룹 상태에서는 멤버를 내보낼 수 없습니다.',
                    forbidden: '선택한 멤버를 내보낼 권한이 없습니다.'
                };
                alert(messages[code] || '멤버를 내보내지 못했습니다. 목록을 확인한 뒤 다시 시도해 주세요.');
                syncWorkspaceMemberSelection();
            }
        }

        function updateWorkspaceMemberTotal() {
            const total = getWorkspaceMemberRows().length;
            const element = document.getElementById('workspaceMemberTotal');
            if (element) element.innerHTML = '전체 <strong>' + total + '</strong>명';
        }

        document.addEventListener('DOMContentLoaded', function() {
            updateWorkspaceMemberTotal();
            setWorkspaceMemberMode('view', false);
        });

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
                } else if (result === 'unavailable') {
                    alert('삭제 예정 또는 사용할 수 없는 그룹에서는 그룹장을 위임할 수 없습니다.');
                } else if (result === 'member_not_found') {
                    alert('현재 그룹 멤버에게만 그룹장 권한을 넘길 수 있습니다.');
                } else if (result === 'conflict') {
                    alert('그룹장 정보가 이미 변경되었습니다. 화면을 새로고침한 뒤 다시 확인해 주세요.');
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
            const memberNameElement = row ? row.querySelector('.ws-member-name') : null;
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
                        '.ws-member-row[data-user-id="' + userId + '"]'
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

                if (result === 'project_leader_transfer_required') {
                    alert('진행 중인 그룹 프로젝트의 팀장은 먼저 다른 멤버에게 팀장을 위임해야 합니다.');
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
        let workspaceSettingsDirty = false;
        let workspaceSettingsInitialSnapshot = '';
        let workspaceSettingsImageRevision = 0;

        function normalizeWorkspaceSettingsSnapshotValue(value) {
            return String(value == null ? '' : value).replace(/\r\n/g, '\n');
        }

        function getWorkspaceSettingsSnapshot() {
            const form = document.getElementById('settingsForm');
            if (!form) return '';

            const selectedJoinType = form.querySelector('input[name="joinType"]:checked');
            const links = Array.from(form.querySelectorAll('.workspace-link-row')).map(function(row) {
                const name = row.querySelector('[name="linkName"]')?.value.trim().replace(/\s+/g, ' ') || '';
                const url = row.querySelector('[name="linkUrl"]')?.value.trim() || '';
                return { name: name, url: url };
            }).filter(function(link) {
                return link.name || link.url;
            });

            return JSON.stringify({
                wsName: normalizeWorkspaceSettingsSnapshotValue(document.getElementById('wsName')?.value),
                wsType: normalizeWorkspaceSettingsSnapshotValue(document.getElementById('wsType')?.value),
                wsDescription: normalizeWorkspaceSettingsSnapshotValue(document.getElementById('wsDescription')?.value),
                joinType: selectedJoinType ? selectedJoinType.value : '',
                removeWorkspaceImage: normalizeWorkspaceSettingsSnapshotValue(document.getElementById('removeWorkspaceImage')?.value),
                wsImageCropScale: normalizeWorkspaceSettingsSnapshotValue(document.getElementById('wsImageCropScale')?.value),
                wsImageCropX: normalizeWorkspaceSettingsSnapshotValue(document.getElementById('wsImageCropX')?.value),
                wsImageCropY: normalizeWorkspaceSettingsSnapshotValue(document.getElementById('wsImageCropY')?.value),
                imageRevision: workspaceSettingsImageRevision,
                links: links
            });
        }

        function setWorkspaceSettingsDirty(dirty) {
            workspaceSettingsDirty = Boolean(dirty);
            const button = document.getElementById('workspaceSettingsSaveButton');
            if (!button) return;

            button.classList.toggle('is-dirty', workspaceSettingsDirty);
            button.disabled = workspaceSettingsSaving || !workspaceSettingsDirty;
            button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
        }

        function refreshWorkspaceSettingsDirtyState() {
            if (!workspaceSettingsInitialSnapshot) return;
            setWorkspaceSettingsDirty(getWorkspaceSettingsSnapshot() !== workspaceSettingsInitialSnapshot);
        }

        function markWorkspaceSettingsImageChanged() {
            workspaceSettingsImageRevision += 1;
            refreshWorkspaceSettingsDirtyState();
        }

        window.addEventListener('pageshow', function() {
            if (!workspaceSettingsRedirecting) {
                setWorkspaceSettingsSaving(false);
                refreshWorkspaceSettingsDirtyState();
            }
        });

        document.addEventListener('DOMContentLoaded', function() {
            const settingsForm = document.getElementById('settingsForm');
            if (!settingsForm) return;

            workspaceSettingsInitialSnapshot = getWorkspaceSettingsSnapshot();
            setWorkspaceSettingsDirty(false);

            settingsForm.addEventListener('submit', function(event) {
                event.preventDefault();
                updateWorkspaceSetting();
            });
            settingsForm.addEventListener('input', refreshWorkspaceSettingsDirtyState);
            settingsForm.addEventListener('change', refreshWorkspaceSettingsDirtyState);
        });

        function setWorkspaceSettingsSaving(saving) {
            const button = document.getElementById('workspaceSettingsSaveButton');
            workspaceSettingsSaving = saving;

            if (!button) return;

            if (!button.dataset.defaultText) {
                button.dataset.defaultText = button.textContent.trim();
            }

            button.disabled = saving || !workspaceSettingsDirty;
            button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
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
            if (workspaceSettingsSaving || !workspaceSettingsDirty) return;

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

            refreshWorkspaceSettingsDirtyState();
            if (!workspaceSettingsDirty) return;

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

        function openWorkspaceDeleteRequestModal() {
            const modal = document.getElementById('workspaceDeleteRequestModal');
            const input = document.getElementById('workspaceDeleteConfirmName');
            if (!modal) return;
            if (input) input.value = '';
            modal.hidden = false;
            document.body.classList.add('workspace-delete-modal-open');
            setTimeout(function(){ if (input) input.focus(); }, 0);
        }

        function closeWorkspaceDeleteRequestModal() {
            const modal = document.getElementById('workspaceDeleteRequestModal');
            if (modal) modal.hidden = true;
            document.body.classList.remove('workspace-delete-modal-open');
        }

        function requestWorkspaceDeletion() {
            const workspaceName = "${fn:escapeXml(workspace.wsName)}";
            const input = document.getElementById('workspaceDeleteConfirmName');
            const submit = document.getElementById('workspaceDeleteRequestSubmit');
            const typedName = input ? input.value.trim() : '';

            if (typedName !== workspaceName.trim()) {
                alert("그룹 이름을 정확히 입력해 주세요.");
                if (input) input.focus();
                return;
            }

            if (submit) submit.disabled = true;

            $.ajax({
                url: WORKSPACE_CONTEXT_PATH + '/workspace/api/delete-policy',
                type: 'POST',
                data: { wsId: "${workspace.wsId}", workspaceName: typedName },
                success: function(res) {
                    if (res === 'deleted') {
                        closeWorkspaceDeleteRequestModal();
                        alert("그룹장 한 명만 남아 있어 그룹을 바로 삭제했습니다.");
                        location.href = WORKSPACE_CONTEXT_PATH + '/workspace/list';
                    } else if (res === 'pending' || res === 'already_pending') {
                        closeWorkspaceDeleteRequestModal();
                        alert(res === 'already_pending'
                            ? "이미 삭제 신청된 그룹입니다."
                            : "다른 멤버가 있어 삭제 예정 상태로 전환했습니다. 30일 안에는 취소할 수 있습니다.");
                        location.reload();
                    } else if (res === 'name_mismatch') {
                        alert("그룹 이름이 일치하지 않습니다.");
                    } else if (res === 'owner_only') {
                        alert("그룹 삭제 신청은 그룹장만 가능합니다.");
                    } else if (res === 'login_required') {
                        alert("로그인이 필요합니다.");
                    } else if (res === 'not_found') {
                        alert("그룹 정보를 찾을 수 없습니다.");
                    } else {
                        alert("그룹 삭제 신청에 실패했습니다.");
                    }
                },
                error: function(xhr) {
                    console.error("그룹 삭제 신청 오류:", xhr);
                    alert("그룹 삭제 신청 중 서버 통신 오류가 발생했습니다.");
                },
                complete: function() {
                    if (submit) submit.disabled = false;
                }
            });
        }

        function cancelWorkspaceDeletion() {
            if (!confirm("그룹 삭제 신청을 취소할까요?")) return;

            $.ajax({
                url: WORKSPACE_CONTEXT_PATH + '/workspace/api/delete/cancel',
                type: 'POST',
                data: { wsId: "${workspace.wsId}" },
                success: function(res) {
                    if (res === 'success') {
                        alert("그룹 삭제 신청이 취소되었습니다.");
                        location.reload();
                    } else if (res === 'owner_only') {
                        alert("그룹 삭제 신청 취소는 그룹장만 가능합니다.");
                    } else {
                        alert("그룹 삭제 신청 취소에 실패했습니다.");
                    }
                },
                error: function(xhr) {
                    console.error("그룹 삭제 신청 취소 오류:", xhr);
                    alert("그룹 삭제 신청 취소 중 서버 통신 오류가 발생했습니다.");
                }
            });
        }

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') closeWorkspaceDeleteRequestModal();
        });

        function switchWorkspaceSettingsTab(tabName) {
            const basic = document.getElementById('settingsTabBasic');
            const members = document.getElementById('settingsTabMembers');

            // 탭을 이동할 때 저장하지 않은 멤버 편집/내보내기 상태를 초기화한다.
            if (workspaceMemberMode !== 'view') {
                exitWorkspaceMemberMode(true);
            }
            const memberSearchInput = document.getElementById('workspaceMemberSearchInput');
            if (memberSearchInput && memberSearchInput.value) {
                memberSearchInput.value = '';
                filterWorkspaceMembers();
            }

            basic.classList.toggle('is-active', tabName === 'basic');
            members.classList.toggle('is-active', tabName === 'members');

            document.querySelectorAll('.settings-tab-button').forEach(function(button) {
                button.classList.toggle('is-active', button.dataset.tab === tabName);
            });

            const pageActions = document.getElementById('workspaceSettingsPageActions');
            if (pageActions) {
                pageActions.hidden = tabName === 'members';
            }

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
<body data-member-activity-mode="GROUP" data-main-shell-mode="WORKSPACE" data-ws-id="${workspace.wsId}" data-context-path="${pageContext.request.contextPath}" data-current-user-id="${currentUserId}" data-scope-status="<c:out value='${workspace.status}'/>">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="workspace-settings-page moyo-settings-page moyo-settings-page--workspace">
        <header class="settings-page-header">
            <div class="settings-page-heading">
                <a href="#" onclick="history.back(); return false;"
                   class="settings-page-back-link" aria-label="이전 화면으로 돌아가기">
                    <span aria-hidden="true">←</span> 뒤로
                </a>
                <h1>그룹 설정</h1>
                <p><c:out value="${workspace.wsName}"/>의 정보와 가입 방식, 외부 링크를 관리합니다.</p>
            </div>
            <div id="workspaceSettingsPageActions" class="settings-page-actions">
                <button type="submit"
                        form="settingsForm"
                        id="workspaceSettingsSaveButton"
                        class="settings-btn settings-btn-primary"
                        aria-busy="false"
                        aria-disabled="true"
                        disabled>변경사항 저장</button>
            </div>
        </header>

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
            <section class="settings-card settings-main-panel">
                <form id="settingsForm" class="moyo-settings-form">
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

                        <div class="form-group full settings-join-section">
                            <span class="field-label">가입 방식</span>
                            <div class="join-type-options" role="radiogroup" aria-label="그룹 가입 방식">
                                <label class="join-type-option">
                                    <input type="radio" name="joinType" value="OPEN" ${empty workspace.joinType or workspace.joinType eq 'OPEN' ? 'checked' : ''}>
                                    <span class="join-type-card"><span class="join-type-badge">자유 가입</span><strong>누구나 바로 참여</strong><p>공개된 그룹을 확인한 사용자가 바로 참여할 수 있어요.</p></span>
                                </label>
                                <label class="join-type-option">
                                    <input type="radio" name="joinType" value="APPROVAL" ${workspace.joinType eq 'APPROVAL' ? 'checked' : ''}>
                                    <span class="join-type-card"><span class="join-type-badge">승인제</span><strong>승인 후 참여</strong><p>참여 요청을 보내면 그룹장 또는 관리자가 승인해요.</p></span>
                                </label>
                                <label class="join-type-option">
                                    <input type="radio" name="joinType" value="INVITE_ONLY" ${workspace.joinType eq 'INVITE_ONLY' ? 'checked' : ''}>
                                    <span class="join-type-card"><span class="join-type-badge">초대 전용</span><strong>초대받은 사용자만 참여</strong><p>그룹장이나 관리자가 초대한 사용자만 참여할 수 있어요.</p></span>
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

                </form>
            </section>

            <section class="settings-side-card danger-zone ${workspace.status eq 'DELETE_PENDING' ? 'is-delete-pending' : ''}">
                <div class="danger-zone-copy">
                    <h3>위험 구역</h3>
                    <c:choose>
                        <c:when test="${workspace.status eq 'DELETE_PENDING'}">
                            <p>
                                이 그룹은 삭제 예정 상태입니다.
                                <strong><c:out value="${workspace.deleteDeadlineDate}"/></strong>
                            </p>
                        </c:when>
                        <c:otherwise>
                            <p>그룹장 혼자 남아 있으면 바로 삭제됩니다. 다른 멤버가 있으면 30일 삭제 예정 상태로 전환됩니다.</p>
                        </c:otherwise>
                    </c:choose>
                </div>
                <c:choose>
                    <c:when test="${workspace.status eq 'DELETE_PENDING'}">
                        <button type="button" class="btn-delete-cancel" onclick="cancelWorkspaceDeletion()">삭제 신청 취소</button>
                    </c:when>
                    <c:otherwise>
                        <button type="button" class="btn-delete" onclick="openWorkspaceDeleteRequestModal()">그룹 삭제</button>
                    </c:otherwise>
                </c:choose>
            </section>
            </div>

            <div id="settingsTabMembers" class="settings-tab-panel">
                <section class="settings-card moyo-member-manage">
                    <div class="member-tab-head">
                        <div>
                            <h2>멤버 관리</h2>
                            <p>권한과 그룹 내 역할을 관리합니다.</p>
                        </div>
                    </div>

                    <div class="workspace-member-toolbar wsmt-toolbar moyo-member-toolbar">
                        <div class="member-search-box moyo-member-search">
                            <input type="text"
                                   id="workspaceMemberSearchInput"
                                   placeholder="이름, 이메일, 역할로 검색"
                                   oninput="filterWorkspaceMembers()">
                        </div>
                        <div class="workspace-member-toolbar-actions moyo-member-toolbar-actions">
                            <span class="workspace-member-total moyo-member-total" id="workspaceMemberTotal">전체 <strong><c:out value="${fn:length(memberList)}"/></strong>명</span>
                            <c:if test="${workspace.status ne 'DELETE_PENDING'}">
                                <div class="workspace-member-view-actions moyo-member-view-actions">
                                    <button type="button" class="workspace-member-toolbar-button moyo-member-action" onclick="enterWorkspaceMemberEditMode()">권한 수정</button>
                                    <button type="button" class="workspace-member-toolbar-button moyo-member-action is-danger-ghost" onclick="enterWorkspaceMemberRemoveMode()">내보내기</button>
                                    <button type="button" class="member-tab-invite moyo-member-invite" onclick="openTabInviteModal()">+ 멤버 초대</button>
                                </div>
                            </c:if>
                            <div class="workspace-member-edit-actions moyo-member-edit-actions">
                                <button type="button" class="workspace-member-toolbar-button moyo-member-action" onclick="exitWorkspaceMemberMode(true)">취소</button>
                                <button type="button" class="workspace-member-toolbar-button moyo-member-action is-primary" id="workspaceMemberSaveButton" onclick="saveWorkspaceMemberChanges()" disabled>변경사항 저장</button>
                            </div>
                            <div class="workspace-member-remove-actions moyo-member-remove-actions">
                                <span class="workspace-member-selected moyo-member-selected" id="workspaceMemberSelected">선택 0명</span>
                                <button type="button" class="workspace-member-toolbar-button moyo-member-action" onclick="exitWorkspaceMemberMode(false)">취소</button>
                                <button type="button" class="workspace-member-toolbar-button moyo-member-action is-danger" id="workspaceMemberRemoveConfirmButton" onclick="removeSelectedWorkspaceMembers()" disabled>선택 내보내기</button>
                            </div>
                        </div>
                    </div>

                    <div class="wsmt-wrap moyo-member-table-wrap">
                        <table class="wsmt-table moyo-member-table">
                            <colgroup>
                                <col class="workspace-member-col-check">
                                <col class="workspace-member-col-person">
                                <col class="workspace-member-col-role">
                                <col class="workspace-member-col-position">
                                <col class="workspace-member-col-date">
                            </colgroup>
                            <thead>
                                <tr>
                                    <th class="workspace-member-check-cell wsmt-check-cell moyo-member-check-cell">
                                        <input type="checkbox" id="workspaceMemberSelectAll" aria-label="검색된 멤버 전체 선택" onchange="toggleAllWorkspaceMembers(this.checked)">
                                    </th>
                                    <th>멤버</th>
                                    <th>권한</th>
                                    <th>직책 · 담당</th>
                                    <th>가입일</th>
                                </tr>
                            </thead>
                            <tbody id="workspaceMemberManageList">
                                <c:forEach var="member" items="${memberList}">
                                    <tr class="ws-member-row wsmt-row moyo-member-row"
                                        data-user-id="${member.USER_ID}"
                                        data-member-name="<c:out value='${member.DISPLAY_NAME}'/>"
                                        data-is-owner="${member.USER_ID eq workspace.ownerId}"
                                        data-is-current-user="${member.USER_ID eq currentUserId}"
                                        data-role="${member.USER_ID eq workspace.ownerId ? 'OWNER' : member.WS_ROLE}"
                                        data-position="<c:out value='${member.POSITION_NAME}'/>"
                                        data-search="${fn:toLowerCase(member.DISPLAY_NAME)} ${fn:toLowerCase(member.EMAIL)} ${fn:toLowerCase(member.WS_ROLE)} ${fn:toLowerCase(member.POSITION_NAME)}">
                                        <td class="workspace-member-check-cell wsmt-check-cell moyo-member-check-cell">
                                            <input type="checkbox"
                                                   class="workspace-member-select"
                                                   value="${member.USER_ID}"
                                                   aria-label="<c:out value='${member.DISPLAY_NAME}'/> 선택"
                                                   <c:choose>
                                                       <c:when test="${member.USER_ID eq workspace.ownerId}">disabled title="그룹장은 내보낼 수 없습니다."</c:when>
                                                       <c:when test="${member.USER_ID eq currentUserId}">disabled title="본인은 내보낼 수 없습니다."</c:when>
                                                       <c:when test="${not currentUserIsOwner and member.WS_ROLE eq 'ADMIN'}">disabled title="관리자는 다른 관리자를 내보낼 수 없습니다."</c:when>
                                                   </c:choose>
                                                   onchange="syncWorkspaceMemberSelection()">
                                        </td>
                                        <td class="wsmt-person-cell moyo-member-person-cell">
                                            <div class="ws-member-person moyo-member-person">
                                                <button type="button"
                                                        class="ws-member-avatar workspace-member-profile-trigger moyo-member-avatar ${not empty member.PROFILE_IMAGE_PATH ? 'has-image' : 'is-default-profile'}"
                                                        aria-label="<c:out value='${member.DISPLAY_NAME}'/> 프로필 보기"
                                                        onclick="openWorkspaceMemberActivityProfile(${member.USER_ID})">
                                                    <c:choose>
                                                        <c:when test="${not empty member.PROFILE_IMAGE_PATH}">
                                                            <img src="<c:out value='${member.PROFILE_IMAGE_PATH}'/>" alt="" onerror="this.closest('.moyo-member-avatar').classList.remove('has-image'); this.closest('.moyo-member-avatar').classList.add('is-default-profile'); this.remove();">
                                                            <span class="ws-member-avatar-fallback moyo-member-avatar-fallback"><c:out value="${fn:substring(member.DISPLAY_NAME,0,1)}"/></span>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="ws-member-avatar-fallback moyo-member-avatar-fallback"><c:out value="${fn:substring(member.DISPLAY_NAME,0,1)}"/></span>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </button>
                                                <div class="ws-member-person-copy moyo-member-copy">
                                                    <button type="button" class="ws-member-name-button" onclick="openWorkspaceMemberActivityProfile(${member.USER_ID})">
                                                        <span class="ws-member-name moyo-member-name"><c:out value="${member.DISPLAY_NAME}"/></span>
                                                    </button>
                                                    <span class="ws-member-email moyo-member-email"><c:out value="${member.EMAIL}"/></span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="wsmt-role-cell moyo-member-role-cell">
                                            <span class="ws-member-role-summary moyo-member-role ${member.USER_ID eq workspace.ownerId ? 'is-owner' : (member.WS_ROLE eq 'ADMIN' ? 'is-admin' : '')}">
                                                <c:choose>
                                                    <c:when test="${member.USER_ID eq workspace.ownerId}">그룹장</c:when>
                                                    <c:when test="${member.WS_ROLE eq 'ADMIN'}">관리자</c:when>
                                                    <c:otherwise>멤버</c:otherwise>
                                                </c:choose>
                                            </span>
                                            <c:if test="${member.USER_ID ne workspace.ownerId}">
                                                <select class="workspace-member-role-edit moyo-member-role-edit" disabled onchange="refreshWorkspaceMemberDirtyState()" aria-label="<c:out value='${member.DISPLAY_NAME}'/> 권한">
                                                    <option value="MEMBER" ${member.WS_ROLE ne 'ADMIN' ? 'selected' : ''}>멤버</option>
                                                    <option value="ADMIN" ${member.WS_ROLE eq 'ADMIN' ? 'selected' : ''}>관리자</option>
                                                </select>
                                            </c:if>
                                        </td>
                                        <td class="wsmt-position-cell moyo-member-position-cell">
                                            <span class="ws-member-position-summary moyo-member-position ${empty member.POSITION_NAME ? 'is-empty' : ''}">
                                                <c:choose>
                                                    <c:when test="${not empty member.POSITION_NAME}"><c:out value="${member.POSITION_NAME}"/></c:when>
                                                    <c:otherwise>미지정</c:otherwise>
                                                </c:choose>
                                            </span>
                                            <input type="text"
                                                   class="workspace-member-position-edit moyo-member-position-edit"
                                                   maxlength="50"
                                                   oninput="refreshWorkspaceMemberDirtyState()"
                                                   disabled
                                                   value="<c:out value='${member.POSITION_NAME}'/>"
                                                   placeholder="예: 개발, 운영, 기록 등">
                                        </td>
                                        <td class="ws-member-joined-cell wsmt-date-cell moyo-member-date-cell">
                                            <c:choose>
                                                <c:when test="${not empty member.JOINED_AT}"><c:out value="${member.JOINED_AT}"/></c:when>
                                                <c:otherwise>-</c:otherwise>
                                            </c:choose>
                                        </td>
                                    </tr>
                                </c:forEach>
                            </tbody>
                        </table>
                    </div>
                    <div id="workspaceMemberEmpty" class="workspace-member-empty moyo-member-empty">검색된 멤버가 없습니다.</div>

                    <p class="workspace-member-role-note moyo-member-note" id="workspaceMemberRoleNote" aria-live="polite"></p>

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
                                                        <img src="${invite.INVITEE_PROFILE_IMAGE_PATH}" alt="" onerror="this.closest('.moyo-member-avatar').classList.remove('has-image'); this.closest('.moyo-member-avatar').classList.add('is-default-profile'); this.remove();">
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
<%@ include file="../common/commonMemberActivityProfile.jspf" %>
<jsp:include page="/WEB-INF/views/common/commonMemberProfile.jsp">
    <jsp:param name="profileScope" value="group"/>
    <jsp:param name="scopeId" value="${workspace.wsId}"/>
    <jsp:param name="ownerLabel" value="그룹장"/>
    <jsp:param name="adminLabel" value="관리자"/>
    <jsp:param name="memberLabel" value="멤버"/>
</jsp:include>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <div id="workspaceDeleteRequestModal" class="workspace-delete-request-modal" hidden>
        <div class="workspace-delete-request-backdrop" onclick="closeWorkspaceDeleteRequestModal()"></div>
        <section class="workspace-delete-request-dialog" role="dialog" aria-modal="true" aria-labelledby="workspaceDeleteRequestTitle">
            <button type="button" class="workspace-delete-request-close" aria-label="닫기" onclick="closeWorkspaceDeleteRequestModal()">×</button>
            <span class="workspace-delete-request-eyebrow">그룹 삭제</span>
            <h2 id="workspaceDeleteRequestTitle"><c:out value="${workspace.wsName}"/> 그룹을 삭제할까요?</h2>
            <p class="workspace-delete-request-description">
                그룹장 외 멤버가 없으면 즉시 삭제됩니다.
                다른 멤버가 있으면 30일 동안 취소 가능한 삭제 예정 상태로 전환됩니다.
            </p>
            <div class="workspace-delete-request-notice">
                <strong>삭제 정책</strong><span>멤버 유무에 따라 즉시 삭제 또는 30일 유예</span>
            </div>
            <label class="workspace-delete-confirm-field">
                <span>확인을 위해 그룹 이름을 입력하세요.</span>
                <input type="text" id="workspaceDeleteConfirmName" autocomplete="off" placeholder="<c:out value='${workspace.wsName}'/>">
            </label>
            <div class="workspace-delete-request-actions">
                <button type="button" class="workspace-delete-request-secondary" onclick="closeWorkspaceDeleteRequestModal()">닫기</button>
                <button type="button" id="workspaceDeleteRequestSubmit" class="workspace-delete-request-primary" onclick="requestWorkspaceDeletion()">삭제 확인</button>
            </div>
        </section>
    </div>

</body>
</html>
