<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>게시글 수정</title>
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
            <c:if test="${not empty post.channelId}"><c:param name="channelId" value="${post.channelId}" /></c:if>
            <c:if test="${not empty projId}"><c:param name="projId" value="${projId}" /></c:if>
        </c:url>
        <header class="board-form-head">
            <div class="board-form-head-copy">
                <a class="board-form-kicker" href="${boardFormListUrl}" aria-label="게시판 목록으로 이동"><span class="board-form-kicker-icon" aria-hidden="true"><c:choose><c:when test="${boardType eq 'NOTICE'}">&#128226;</c:when><c:otherwise>&#128172;</c:otherwise></c:choose></span><span>게시판</span></a>
                <h1>게시글 수정</h1>
                <p><strong>${currentChannelName}</strong>에 등록된 글을 수정합니다.</p>
            </div>
        </header>

        <form class="board-form-shell" action="/group/board/modify" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="postId" value="${post.postId}">
            <input type="hidden" name="wsId" value="${wsId}">
            <input type="hidden" name="boardType" value="${boardType}">
            <input type="hidden" name="projId" value="${projId}">

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>게시판</h2><p>현재 글이 등록된 공간입니다.</p></div>
                <div class="board-form-field"><span class="board-current-channel">${currentChannelName}</span></div>
            </section>

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>제목</h2><p>내용을 한눈에 알 수 있게 적어주세요.</p></div>
                <div class="board-form-field"><input type="text" id="title" name="title" class="board-form-input" value="${post.title}" required></div>
            </section>

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>내용</h2><p>텍스트와 이미지를 자유롭게 정리할 수 있어요.</p></div>
                <div class="board-form-field board-editor-wrap"><textarea id="editor" name="content" autocomplete="off" spellcheck="false">${post.content}</textarea></div>
            </section>

            <c:if test="${canManageBoard and boardType eq 'NOTICE'}">
                <section class="board-form-section board-notice-settings">
                    <div class="board-form-section-head"><h2>공지 설정</h2><p>공지에 필요한 옵션만 선택해서 변경합니다.</p></div>
                    <div class="board-form-field">
                        <div class="board-notice-panel">
                            <div class="board-setting-row">
                                <div class="board-setting-copy"><strong>상단 고정</strong><span>공지 목록 상단에 고정해서 보여줍니다.</span></div>
                                <label class="board-switch"><input type="checkbox" name="isPinned" id="isPinned" value="Y" ${post.isPinned eq 'Y' ? 'checked' : ''}><span class="board-switch-track"><i></i></span></label>
                            </div>
                            <div id="pinDateArea" class="board-pin-dates ${post.isPinned eq 'Y' ? '' : 'is-hidden'}">
                                <div id="pinDateRangePicker" class="board-date-range-picker" data-start="${post.pinStartDt}" data-end="${post.pinEndDt}">
                                    <input type="hidden" name="pinStartDt" id="pinStartDt" value="${post.pinStartDt}" ${post.isPinned eq 'Y' ? '' : 'disabled'}>
                                    <input type="hidden" name="pinEndDt" id="pinEndDt" value="${post.pinEndDt}" ${post.isPinned eq 'Y' ? '' : 'disabled'}>
                                    <button type="button" class="board-date-range-trigger" aria-haspopup="dialog" aria-expanded="false">
                                        <span class="board-date-range-icon" aria-hidden="true"></span>
                                        <span class="board-date-range-label">기간을 선택하세요</span>
                                        <span class="board-date-range-caret" aria-hidden="true"></span>
                                    </button>
                                </div>
                                <p>기간을 비우면 계속 고정됩니다.</p>
                            </div>
                            <div class="board-setting-row board-setting-row-divided">
                                <div class="board-setting-copy"><strong>변경 내용을 다시 알림</strong><span>필요할 때만 멤버에게 수정된 공지를 다시 알려줍니다.</span></div>
                                <label class="board-switch"><input type="checkbox" name="resendNotification" id="resendNotification" value="Y"><span class="board-switch-track"><i></i></span></label>
                            </div>
                        </div>
                    </div>
                </section>
            </c:if>

            <section class="board-form-section">
                <div class="board-form-section-head"><h2>파일 첨부</h2><p>기존 파일을 정리하거나 새 파일을 추가할 수 있어요.</p></div>
                <div class="board-form-field">
                    <c:if test="${not empty fileList}">
                        <div id="existingFiles" class="file-panel">
                            <c:forEach var="file" items="${fileList}">
                                <div class="file-item js-board-file-item" id="file-${file.FILE_ID}" data-board-file-name="<c:out value='${file.FILE_ORIGINAL_NAME}'/>">
                                    <div class="board-file-meta">
                                        <span class="board-file-icon" data-board-file-icon aria-hidden="true">📄</span>
                                        <span class="board-file-name-wrap" data-board-file-name-slot title="<c:out value='${file.FILE_ORIGINAL_NAME}'/>">
                                            <span class="board-file-stem"><c:out value="${file.FILE_ORIGINAL_NAME}"/></span>
                                        </span>
                                        <span class="board-file-size js-board-file-size" data-file-size="${file.FILE_SIZE}"></span>
                                    </div>
                                    <button type="button" class="file-delete-btn" onclick="deleteFile(${file.FILE_ID})">삭제</button>
                                </div>
                            </c:forEach>
                        </div>
                    </c:if>
                    <div id="fileDropZone" class="board-file-dropzone">
                        <input type="file" id="fileInput" name="files" multiple class="file-input board-file-hidden">
                        <div class="dropzone-icon">📎</div><div><div class="dropzone-main">새 파일을 끌어다 놓거나 클릭해서 선택하세요</div><div class="dropzone-sub">기존 파일은 유지하면서 새 파일을 추가할 수 있습니다.</div></div>
                    </div>
                    <ul id="selectedFileList" class="selected-file-list"></ul>
                </div>
            </section>

            <div class="board-form-actions"><a id="cancelLink" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}" class="btn-cancel">취소</a><button type="submit" class="btn-save">수정 완료</button></div>
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

        const wsId = ${wsId};

        document.addEventListener("DOMContentLoaded", function() {
            const projId = "${projId}";
            const detailUrl = projId && projId !== ""
                ? "/group/board/detail?postId=${post.postId}&wsId=${wsId}&projId=" + projId
                : "/group/board/detail?postId=${post.postId}&wsId=${wsId}";

            document.getElementById("cancelLink").href = detailUrl;
            initializeBoardFileDropZone();
            hydrateExistingBoardFileNames();
            if (window.MoyoDateRangePicker) {
                window.MoyoDateRangePicker.create('pinDateRangePicker', 'pinStartDt', 'pinEndDt');
            }
            initializeBoardPinToggle();
        });


        function syncPinState() {
            const isPinnedEl = document.getElementById('isPinned');
            const pinStartEl = document.getElementById('pinStartDt');
            const pinEndEl = document.getElementById('pinEndDt');
            const pinDateArea = document.getElementById('pinDateArea');
            if (!isPinnedEl || !pinStartEl || !pinEndEl) return;

            const enabled = isPinnedEl.checked;
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
            syncPinState();
        }


        window.MoyoCkeditor.create(document.querySelector('#editor'), {
            profile: 'BOARD',
            uploadUrl: '/api/workspace/board/image-upload',
            placeholder: '내용을 입력하세요.'
        }).then(function (editor) {
            myEditor = editor;
        }).catch(function (error) {
            console.error('에디터 초기화 실패:', error);
        });

        document.querySelector('form').addEventListener('submit', function(e) {
            const form = this;

            const isPinnedEl = document.getElementById('isPinned');
            const pinStartEl = document.getElementById('pinStartDt');
            const pinEndEl = document.getElementById('pinEndDt');
            if (isPinnedEl && isPinnedEl.checked && pinStartEl && pinEndEl && pinStartEl.value && pinEndEl.value && pinStartEl.value > pinEndEl.value) {
                alert('상단 고정 종료일은 시작일보다 빠를 수 없습니다.');
                e.preventDefault();
                return false;
            }

            if (!myEditor) return;

            const finalHtml = sanitizeEditorHtml(myEditor.getData());
            if (!finalHtml.trim() || finalHtml === '<p>&nbsp;</p>') {
                alert('내용을 입력해 주세요.');
                e.preventDefault();
                return false;
            }

            // 이미지 업로드 대기는 commonCkeditor.js의 공통 submit guard가 전담한다.
            // 수정 화면에서 별도로 waitForBoardUploads/requestSubmit을 반복하면
            // 같은 폼이 두 번 가드되어 "이미지 업로드 중..." 상태에서 멈출 수 있다.
            document.querySelector('#editor').value = finalHtml;
        });



        function deleteFile(fileId) {
            console.log("🔥 전달받은 fileId:", fileId);

            const url = "/api/workspace/" + wsId + "/board/file/" + fileId;

            console.log("🔥 최종 호출 URL:", url);

            fetch(url, {
                method: "DELETE"
            })
            .then(res => res.text())
            .then(result => {
                console.log("🔥 결과:", result);
                if (result === "SUCCESS") {
                    const target = document.getElementById("file-" + fileId);
                    if (target) target.remove();

                    const existingFiles = document.getElementById("existingFiles");
                    if (existingFiles && existingFiles.children.length === 0) {
                        existingFiles.closest(".form-group").remove();
                    }
                } else {
                    alert("삭제 실패");
                }
            })
            .catch(err => console.error("통신 에러:", err));
        }
    </script>
</body>
</html>
