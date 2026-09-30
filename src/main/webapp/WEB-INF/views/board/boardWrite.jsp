<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>게시글 작성</title>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    <script src="${pageContext.request.contextPath}/js/commonCkeditor.js?v=20260907-image-guard-1"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonCkeditor.css?v=moyo-ckeditor-common-v2">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardForm.css?v=board-final-20260928">
    <script src="${pageContext.request.contextPath}/js/boardDateRangePicker.js?v=board-date-range-final-v2"></script>
    <script src="${pageContext.request.contextPath}/js/common/commonContentExplorer.js?v=board-file-ui-v2"></script>
</head>
<body class="moyo-board-form-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <main class="board-form-page">
        <c:url var="boardFormListUrl" value="${empty projId ? '/group/board/list' : '/project/board/list'}">
            <c:if test="${not empty wsId}"><c:param name="wsId" value="${wsId}" /></c:if>
            <c:if test="${not empty boardType}"><c:param name="type" value="${boardType}" /></c:if>
            <c:if test="${not empty channelId}"><c:param name="channelId" value="${channelId}" /></c:if>
            <c:if test="${not empty projId}"><c:param name="projId" value="${projId}" /></c:if>
        </c:url>
        <header class="board-form-head">
            <div class="board-form-head-copy">
                <a id="boardFormListLink" class="board-form-kicker" href="${boardFormListUrl}" aria-label="게시판 목록으로 이동"><span class="board-form-kicker-icon" aria-hidden="true"><c:choose><c:when test="${boardType eq 'NOTICE'}">&#128226;</c:when><c:otherwise>&#128172;</c:otherwise></c:choose></span><span>게시판</span></a>
                <h1><c:choose><c:when test="${boardType eq 'NOTICE'}">공지 작성</c:when><c:otherwise>새 글 작성</c:otherwise></c:choose></h1>
                <p><strong id="currentChannelLabel">${currentChannelName}</strong>에 새로운 이야기를 남겨보세요.</p>
            </div>
        </header>

        <form id="writeForm" class="board-form-shell" autocomplete="off">
            <input type="hidden" id="wsId" value="${wsId}">
            <input type="hidden" id="boardType" value="${boardType}">
            <input type="hidden" id="channelId" value="${channelId}">
            <input type="hidden" id="projId" value="${projId}">

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>게시판</h2><p>글이 등록될 공간을 선택합니다.</p></div>
                <div class="board-form-field">
                    <div class="board-channel-options">
                        <c:forEach var="channel" items="${boardChannels}">
                            <c:if test="${canManageBoard or channel.CHANNEL_TYPE ne 'NOTICE'}">
                                <button type="button" class="board-channel-option ${channel.CHANNEL_TYPE eq 'NOTICE' ? 'notice' : ''} ${channel.CHANNEL_ID eq channelId ? 'is-active' : ''}"
                                    data-channel-id="${channel.CHANNEL_ID}" data-channel-type="${channel.CHANNEL_TYPE}" onclick="selectBoardChannel(this)"><c:out value="${channel.CHANNEL_NAME}"/></button>
                            </c:if>
                        </c:forEach>
                    </div>
                </div>
            </section>

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>제목</h2><p>내용을 한눈에 알 수 있게 적어주세요.</p></div>
                <div class="board-form-field"><input type="text" id="title" class="board-form-input" placeholder="제목을 입력하세요" required></div>
            </section>

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>내용</h2><p>텍스트와 이미지를 자유롭게 정리할 수 있어요.</p></div>
                <div class="board-form-field board-editor-wrap"><textarea id="editor" name="content" autocomplete="off" spellcheck="false"></textarea></div>
            </section>

            <c:if test="${canManageBoard}">
                <section id="noticeSettingsSection" class="board-form-section board-notice-settings ${boardType eq 'NOTICE' ? '' : 'is-hidden'}">
                    <div class="board-form-section-head"><h2>공지 설정</h2><p>공지에 필요한 옵션만 선택해서 사용합니다.</p></div>
                    <div class="board-form-field">
                        <div class="board-notice-panel">
                            <div class="board-setting-row">
                                <div class="board-setting-copy"><strong>상단 고정</strong><span>공지 목록 상단에 고정해서 보여줍니다.</span></div>
                                <label class="board-switch"><input type="checkbox" id="isPinned" value="Y"><span class="board-switch-track"><i></i></span></label>
                            </div>
                            <div id="pinDateArea" class="board-pin-dates is-hidden">
                                <div id="pinDateRangePicker" class="board-date-range-picker" data-start="" data-end="">
                                    <input type="hidden" id="pinStartDt" value="" disabled>
                                    <input type="hidden" id="pinEndDt" value="" disabled>
                                    <button type="button" class="board-date-range-trigger" aria-haspopup="dialog" aria-expanded="false">
                                        <span class="board-date-range-icon" aria-hidden="true"></span>
                                        <span class="board-date-range-label">기간을 선택하세요</span>
                                        <span class="board-date-range-caret" aria-hidden="true"></span>
                                    </button>
                                </div>
                                <p>기간을 비우면 계속 고정됩니다.</p>
                            </div>
                            <div class="board-setting-row board-setting-row-divided">
                                <div class="board-setting-copy"><strong>멤버에게 알림 보내기</strong><span>이 공지를 그룹 또는 프로젝트 멤버에게 한 번 알려줍니다.</span></div>
                                <label class="board-switch"><input type="checkbox" id="notifyMembers" value="Y"><span class="board-switch-track"><i></i></span></label>
                            </div>
                        </div>
                    </div>
                </section>
            </c:if>

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>파일 첨부</h2><p>여러 파일을 한 번에 추가할 수 있어요.</p></div>
                <div class="board-form-field">
                    <div id="fileDropZone" class="board-file-dropzone">
                        <input type="file" id="fileInput" name="files" multiple class="file-input board-file-hidden">
                        <div class="dropzone-icon">📎</div><div><div class="dropzone-main">파일을 끌어다 놓거나 클릭해서 선택하세요</div><div class="dropzone-sub">선택한 파일은 등록 전에 다시 확인할 수 있습니다.</div></div>
                    </div>
                    <ul id="selectedFileList" class="selected-file-list"></ul>
                </div>
            </section>

            <div class="board-form-actions"><a id="cancelLink" href="javascript:history.back();" class="btn-cancel">취소</a><button type="button" class="btn-submit" onclick="submitPost()">등록하기</button></div>
        </form>
    </main>
    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
<script>
        let myEditor;

        let selectedBoardFiles = [];

        function initializeBoardFileDropZone() {
            const dropZone = document.getElementById('fileDropZone');
            const fileInput = document.getElementById('fileInput');
            const selectedFileList = document.getElementById('selectedFileList');
            if (!dropZone || !fileInput || !selectedFileList) return;

            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => addSelectedFiles(fileInput.files));

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.add('is-dragover');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.remove('is-dragover');
                });
            });

            dropZone.addEventListener('drop', function(e) {
                addSelectedFiles(e.dataTransfer.files);
            });
        }

        function addSelectedFiles(files) {
            Array.from(files || []).forEach(file => {
                const exists = selectedBoardFiles.some(item =>
                    item.name === file.name && item.size === file.size && item.lastModified === file.lastModified
                );
                if (!exists) selectedBoardFiles.push(file);
            });
            syncBoardFileInput();
            renderSelectedFiles();
        }

        function removeSelectedFile(index) {
            selectedBoardFiles.splice(index, 1);
            syncBoardFileInput();
            renderSelectedFiles();
        }

        function syncBoardFileInput() {
            const fileInput = document.getElementById('fileInput');
            if (!fileInput) return;
            const dataTransfer = new DataTransfer();
            selectedBoardFiles.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
        }

        function renderSelectedFiles() {
            const selectedFileList = document.getElementById('selectedFileList');
            if (!selectedFileList) return;
            selectedFileList.innerHTML = '';
            selectedBoardFiles.forEach((file, index) => {
                const li = document.createElement('li');
                const fileMeta = window.MoyoContentFileUi;
                li.innerHTML = '<div class="board-file-meta">' +
                               '<span class="board-file-icon" aria-hidden="true">' + fileMeta.fileIcon({ name: file.name, contentType: file.type }) + '</span>' +
                               fileMeta.fileNameHtml(file.name) +
                               '<span class="board-file-size">' + formatFileSize(file.size) + '</span>' +
                               '</div>' +
                               '<button type="button" onclick="removeSelectedFile(' + index + ')">삭제</button>';
                selectedFileList.appendChild(li);
            });
        }


        function hydrateExistingBoardFileNames() {
            document.querySelectorAll('[data-board-file-name]').forEach(function(item) {
                const ui = window.MoyoContentFileUi;
                if (!ui) return;
                const raw = item.getAttribute('data-board-file-name') || '';
                const icon = item.querySelector('[data-board-file-icon]');
                const slot = item.querySelector('[data-board-file-name-slot]');
                if (icon) icon.textContent = ui.fileIcon({ originalName: raw });
                if (slot) slot.outerHTML = ui.fileNameHtml(raw);
            });
            document.querySelectorAll('.js-board-file-size').forEach(function(el) {
                const size = Number(el.dataset.fileSize || 0);
                el.textContent = size > 0 ? formatFileSize(size) : '';
            });
        }

        function formatFileSize(size) {
            if (size < 1024) return size + 'B';
            if (size < 1024 * 1024) return Math.round(size / 1024) + 'KB';
            return (size / 1024 / 1024).toFixed(1) + 'MB';
        }

        function escapeHtml(value) {
            return String(value || '').replace(/[&<>'"]/g, function(char) {
                return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
            });
        }


        const BOARD_EDITOR_MAX_IMAGE_SIZE = 5 * 1024 * 1024;
        const BOARD_EDITOR_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        function sanitizeInlineStyle(styleValue) {
            if (!styleValue) return '';
            const allowed = new Set([
                'color', 'background-color', 'text-align', 'font-size',
                'width', 'height', 'border', 'border-color', 'border-style', 'border-width',
                'vertical-align', 'padding', 'margin-left', 'margin-right'
            ]);
            return styleValue.split(';')
                .map(rule => rule.trim())
                .filter(rule => {
                    const idx = rule.indexOf(':');
                    if (idx < 1) return false;
                    const prop = rule.slice(0, idx).trim().toLowerCase();
                    const value = rule.slice(idx + 1).trim().toLowerCase();
                    if (!allowed.has(prop)) return false;
                    if (value.includes('javascript:') || value.includes('expression(') || value.includes('url(')) return false;
                    return true;
                })
                .join('; ');
        }

        function sanitizeEditorHtml(html) {
            if (!html) return '';

            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;

            wrapper.querySelectorAll('script, style, iframe, object, embed, form, input, button, meta, link').forEach(el => el.remove());

            wrapper.querySelectorAll('*').forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    const name = attr.name.toLowerCase();
                    const value = (attr.value || '').trim().toLowerCase();

                    if (name.startsWith('on')) {
                        el.removeAttribute(attr.name);
                        return;
                    }

                    if (name === 'style') {
                        const safeStyle = sanitizeInlineStyle(attr.value);
                        if (safeStyle) el.setAttribute('style', safeStyle);
                        else el.removeAttribute('style');
                        return;
                    }

                    if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
                        el.removeAttribute(attr.name);
                        return;
                    }
                });
            });

            wrapper.querySelectorAll('a[href]').forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });

            return wrapper.innerHTML.trim();
        }


        document.addEventListener("DOMContentLoaded", function() {
            const urlParams = new URLSearchParams(window.location.search);

            const wsIdParam = urlParams.get('wsId');
            const projIdParam = urlParams.get('projId');
            const channelIdParam = urlParams.get('channelId');
            const typeParam = urlParams.get('type');

            if (wsIdParam) {
                document.getElementById('wsId').value = wsIdParam;
            }

            if (projIdParam) {
                document.getElementById('projId').value = projIdParam;
            }
            if (channelIdParam) {
                document.getElementById('channelId').value = channelIdParam;
            }

            if (typeParam) {
                document.getElementById('boardType').value = typeParam;
            }

            const wsId = document.getElementById('wsId').value;
            const projId = document.getElementById('projId').value;
            const boardType = document.getElementById('boardType').value;
            const channelId = document.getElementById('channelId').value;

            const backUrl = projId
                ? '/project/board/list?projId=' + projId + '&type=' + boardType + '&wsId=' + wsId + (channelId ? '&channelId=' + channelId : '')
                : '/group/board/list?wsId=' + wsId + '&type=' + boardType + (channelId ? '&channelId=' + channelId : '');

            document.getElementById('cancelLink').href = backUrl;

            initializeBoardFileDropZone();
            hydrateExistingBoardFileNames();
            if (window.MoyoDateRangePicker) {
                window.MoyoDateRangePicker.create('pinDateRangePicker', 'pinStartDt', 'pinEndDt');
            }
            initializeBoardPinToggle();

            console.log("글쓰기 wsId =", wsId);
            console.log("글쓰기 projId =", projId);
            console.log("글쓰기 boardType =", boardType);
        });



        function selectBoardChannel(button) {
            const channelId = button ? button.dataset.channelId : '';
            const channelType = button ? button.dataset.channelType : 'GENERAL';
            const channelName = button ? button.textContent.trim() : '게시판';
            const channelInput = document.getElementById('channelId');
            const typeInput = document.getElementById('boardType');
            if (channelInput) channelInput.value = channelId || '';
            if (typeInput) typeInput.value = channelType === 'NOTICE' ? 'NOTICE' : 'FREE';
            document.querySelectorAll('.board-channel-option').forEach(el => el.classList.remove('is-active'));
            if (button) button.classList.add('is-active');
            const current = document.getElementById('currentChannelLabel');
            if (current) current.textContent = channelName || '게시판';
            syncNoticeSettingsVisibility(channelType === 'NOTICE');
            const wsId = document.getElementById('wsId')?.value || '';
            const projId = document.getElementById('projId')?.value || '';
            const boardType = typeInput ? typeInput.value : 'FREE';
            const listUrl = projId
                ? '/project/board/list?projId=' + encodeURIComponent(projId) + '&wsId=' + encodeURIComponent(wsId) + '&type=' + encodeURIComponent(boardType) + (channelId ? '&channelId=' + encodeURIComponent(channelId) : '')
                : '/group/board/list?wsId=' + encodeURIComponent(wsId) + '&type=' + encodeURIComponent(boardType) + (channelId ? '&channelId=' + encodeURIComponent(channelId) : '');
            const cancel = document.getElementById('cancelLink');
            if (cancel) cancel.href = listUrl;
            const listLink = document.getElementById('boardFormListLink');
            if (listLink) listLink.href = listUrl;
        }

        function syncNoticeSettingsVisibility(isNotice) {
            const section = document.getElementById('noticeSettingsSection');
            const isPinnedEl = document.getElementById('isPinned');
            const notifyEl = document.getElementById('notifyMembers');
            if (section) section.classList.toggle('is-hidden', !isNotice);
            if (!isNotice) {
                if (isPinnedEl) isPinnedEl.checked = false;
                if (notifyEl) notifyEl.checked = false;
            }
            syncPinState();
        }

        function syncPinState() {
            const isPinnedEl = document.getElementById('isPinned');
            const pinStartEl = document.getElementById('pinStartDt');
            const pinEndEl = document.getElementById('pinEndDt');
            const pinDateArea = document.getElementById('pinDateArea');
            if (!isPinnedEl || !pinStartEl || !pinEndEl) return;

            const enabled = isPinnedEl.checked && !document.getElementById('noticeSettingsSection')?.classList.contains('is-hidden');
            pinStartEl.disabled = !enabled;
            pinEndEl.disabled = !enabled;
            if (!enabled) {
                pinStartEl.value = '';
                pinEndEl.value = '';
            }
            if (pinDateArea) pinDateArea.classList.toggle('is-hidden', !enabled);
            if (window.MoyoDateRangePicker) {
                window.MoyoDateRangePicker.setDisabled('pinDateRangePicker', !enabled);
                if (!enabled) window.MoyoDateRangePicker.clear('pinDateRangePicker');
            }
        }

        function initializeBoardPinToggle() {
            const isPinnedEl = document.getElementById('isPinned');
            if (isPinnedEl) isPinnedEl.addEventListener('change', syncPinState);
            const currentType = document.getElementById('boardType')?.value || 'FREE';
            syncNoticeSettingsVisibility(currentType === 'NOTICE');
        }


        window.MoyoCkeditor.create(document.querySelector('#editor'), {
            profile: 'BOARD',
            uploadUrl: '/api/workspace/board/image-upload',
            placeholder: '내용을 입력하세요.',
            initialData: ''
        }).then(function (editor) {
            myEditor = editor;
        }).catch(function (error) {
            console.error('에디터 초기화 실패:', error);
        });

        document.querySelector('form').addEventListener('submit', function(e) {
            if (myEditor) {
                const editorData = sanitizeEditorHtml(myEditor.getData());

                if (!editorData.trim() || editorData === '<p>&nbsp;</p>') {
                    alert('내용을 입력해 주세요.');
                    e.preventDefault();
                    return false;
                }

                document.querySelector('#editor').value = editorData;
            }
        });

        async function submitPost() {
            let wsId = document.getElementById('wsId').value;
            let projId = document.getElementById('projId').value;
            let boardType = document.getElementById('boardType').value;
            let channelId = document.getElementById('channelId').value;

            const title = document.getElementById('title').value.trim();
            const submitButton = document.querySelector('.btn-submit');
            const originalSubmitText = submitButton ? submitButton.textContent : '';

            if (myEditor && myEditor._boardUploadCount > 0) {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = '이미지 업로드 중...';
                }
                await myEditor.waitForBoardUploads();
            }

            if (myEditor && typeof myEditor.flushBoardDataImages === 'function') {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = '이미지 업로드 중...';
                }
                try {
                    await myEditor.flushBoardDataImages();
                } catch (error) {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalSubmitText;
                    }
                    alert(error && error.message ? error.message : '이미지 업로드에 실패했습니다.');
                    return;
                }
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalSubmitText;
            }

            const content = sanitizeEditorHtml(myEditor ? myEditor.getData() : '');
            if (/src\s*=\s*["']data:image\//i.test(content)) {
                alert('이미지 업로드가 아직 완료되지 않았습니다. 잠시 후 다시 등록해 주세요.');
                return;
            }

            if (!title) {
                alert("제목을 입력해 주세요.");
                return;
            }

            if (!content || content.trim() === '' || content === '<p>&nbsp;</p>') {
                alert("내용을 입력해 주세요.");
                return;
            }

            if ((!wsId || wsId === "") && (!projId || projId === "")) {
                alert("그룹 또는 프로젝트 정보가 없습니다.");
                return;
            }

            const formData = new FormData();

            const isPinnedEl = document.getElementById('isPinned');
            const pinStartEl = document.getElementById('pinStartDt');
            const pinEndEl = document.getElementById('pinEndDt');
            const isPinned = isPinnedEl && isPinnedEl.checked ? 'Y' : 'N';
            const pinStartDt = pinStartEl ? pinStartEl.value : '';
            const pinEndDt = pinEndEl ? pinEndEl.value : '';
            const notifyMembersEl = document.getElementById('notifyMembers');
            const notifyMembers = boardType === 'NOTICE' && notifyMembersEl && notifyMembersEl.checked ? 'Y' : 'N';

            if (isPinned === 'Y' && pinStartDt && pinEndDt && pinStartDt > pinEndDt) {
                alert('상단 고정 종료일은 시작일보다 빠를 수 없습니다.');
                return;
            }

            const postData = {
                wsId: wsId,
                boardType: boardType,
                channelId: channelId || null,
                title: title,
                content: content,
                isPinned: boardType === 'NOTICE' ? isPinned : 'N',
                pinStartDt: boardType === 'NOTICE' ? pinStartDt : '',
                pinEndDt: boardType === 'NOTICE' ? pinEndDt : '',
                notifyMembers: notifyMembers
            };

            if (projId && projId !== "") {
                postData.projId = projId;
            }

            formData.append(
                "post",
                new Blob([JSON.stringify(postData)], { type: "application/json" })
            );

            selectedBoardFiles.forEach(file => formData.append("files", file));

            $.ajax({
                url: '/api/workspace/' + wsId + '/board/write',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(res) {
                    if (res.status === 'SUCCESS') {
                        alert('등록 완료!');

                        if (projId && projId !== "") {
                            location.href = '/project/board/list?projId=' + encodeURIComponent(projId)
                                + '&wsId=' + encodeURIComponent(wsId)
                                + '&type=' + encodeURIComponent(boardType)
                                + (channelId ? '&channelId=' + encodeURIComponent(channelId) : '');
                        } else {
                            location.href = '/group/board/list?wsId=' + encodeURIComponent(wsId)
                                + '&type=' + encodeURIComponent(boardType)
                                + (channelId ? '&channelId=' + encodeURIComponent(channelId) : '');
                        }
                    } else {
                        alert('등록 실패: ' + (res.message || '알 수 없는 오류'));
                    }
                },
                error: function(xhr, status, error) {
                    console.error("AJAX Error:", status, error);
                    console.error("Response:", xhr.responseText);
                    alert("서버 통신 중 오류가 발생했습니다.");
                }
            });
        }
    </script>
</body>
</html>
