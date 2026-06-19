<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>글쓰기</title>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <style>
        body {
            margin: 0;
            background: #f8f9fa;
            color: #333;
            font-family: 'Pretendard', sans-serif;
        }

        .write-page {
            max-width: 1120px;
            margin: 34px auto 60px;
            padding: 0 24px;
            box-sizing: border-box;
        }

        .write-card {
            background: #fff;
            border: 1px solid #eef0f2;
            border-radius: 18px;
            padding: 38px 46px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            box-sizing: border-box;
        }

        .write-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #222;
        }

        .write-title {
            margin: 0;
            font-size: 28px;
            color: #111;
            font-weight: 800;
            letter-spacing: -0.03em;
            line-height: 1.25;
        }

        .write-desc {
            margin: 8px 0 0;
            font-size: 13px;
            color: #888;
        }

        .back-link {
            flex-shrink: 0;
            text-decoration: none;
            color: #666;
            font-size: 13px;
            font-weight: 700;
            padding: 8px 10px;
            border-radius: 8px;
        }

        .back-link:hover {
            color: #4A90E2;
            background: #f8f9fa;
        }

        .form-group {
            margin-bottom: 22px;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 800;
            color: #444;
        }

        .title-input {
            width: 100%;
            padding: 13px 14px;
            border: 1px solid #ddd;
            border-radius: 10px;
            font-size: 15px;
            box-sizing: border-box;
            outline: none;
            font-family: inherit;
            transition: border-color .2s, box-shadow .2s;
        }

        .title-input:focus {
            border-color: #4A90E2;
            box-shadow: 0 0 0 3px rgba(74,144,226,0.12);
        }

        .file-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px dashed #ccc;
            border-radius: 10px;
            background: #f8f9fa;
            box-sizing: border-box;
            font-size: 13px;
        }

        textarea {
            width: 100%;
            height: 80px;
            resize: none;
            box-sizing: border-box;
        }

        .ck.ck-editor__editable_inline {
            min-height: 420px !important;
            border: 1px solid #ddd !important;
            border-radius: 0 0 10px 10px !important;
            padding: 0 20px !important;
            box-sizing: border-box;
        }

        .ck.ck-toolbar {
            border: 1px solid #ddd !important;
            border-radius: 10px 10px 0 0 !important;
            background: #f8f9fa !important;
        }

        .action-row {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid #eef0f2;
        }

        .btn-cancel,
        .btn-submit {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 11px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            text-decoration: none;
            box-sizing: border-box;
        }

        .btn-cancel {
            color: #495057;
            background: #fff;
            border: 1px solid #dee2e6;
        }

        .btn-cancel:hover {
            background: #f8f9fa;
        }

        .btn-submit {
            background: #4A90E2;
            color: white;
            border: 1px solid #4A90E2;
            box-shadow: 0 4px 10px rgba(74,144,226,0.2);
        }

        .btn-submit:hover {
            background: #357ABD;
        }

        @media(max-width: 760px) {
            .write-page {
                margin: 24px auto 40px;
                padding: 0 14px;
            }

            .write-card {
                padding: 28px 22px;
                border-radius: 16px;
            }

            .write-header {
                flex-direction: column;
            }

            .write-title {
                font-size: 24px;
            }

            .action-row {
                justify-content: stretch;
            }

            .btn-cancel,
            .btn-submit {
                flex: 1;
            }
        }

        /* ===== MOYO Board Point Theme - subtle ===== */
        :root {
            --moyo-blue: #4A90E2;
            --moyo-mint: #55DDBF;
            --moyo-mint-dark: #12BFA6;
            --moyo-border: #e9eef2;
            --moyo-soft-mint: #F5FFFB;
            --moyo-text: #222;
            --moyo-muted: #7b8491;
        }

        body {
            background: #f8f9fa !important;
            color: var(--moyo-text) !important;
        }

        .detail-card,
        .write-card,
        .form-card,
        .list-table-wrap,
        .comment-box,
        .attachment-box,
        .file-box {
            border-color: var(--moyo-border) !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03) !important;
        }

        .list-header {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: visible !important;
        }

        .list-header::before,
        .list-header::after {
            display: none !important;
        }

        .detail-card::before,
        .write-card::before,
        .form-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 34px;
            bottom: 34px;
            width: 4px;
            border-radius: 0 999px 999px 0;
            background: linear-gradient(180deg, var(--moyo-blue), var(--moyo-mint));
        }

        .detail-card::after,
        .write-card::after,
        .form-card::after {
            display: none !important;
        }

        .detail-card,
        .write-card,
        .form-card {
            position: relative;
            overflow: hidden;
        }

        .detail-card > *,
        .write-card > *,
        .form-card > * {
            position: relative;
            z-index: 1;
        }

        .page-title,
        .detail-title,
        .modify-title,
        .write-title,
        .list-header h2 {
            color: #111 !important;
            letter-spacing: -0.03em !important;
        }

        .back-btn {
            color: #666 !important;
        }

        .back-btn:hover {
            color: var(--moyo-blue) !important;
        }

        .write-btn,
        .primary-btn,
        .submit-btn,
        .save-btn,
        .btn-save,
        .comment-submit-btn,
        .comment-btn,
        button[type="submit"],
        input[type="submit"] {
            background: var(--moyo-blue) !important;
            border-color: var(--moyo-blue) !important;
            color: #fff !important;
            box-shadow: 0 5px 12px rgba(74,144,226,0.18) !important;
            transition: transform .18s ease, background .18s ease, box-shadow .18s ease !important;
        }

        .write-btn:hover,
        .primary-btn:hover,
        .submit-btn:hover,
        .save-btn:hover,
        .btn-save:hover,
        .comment-submit-btn:hover,
        .comment-btn:hover,
        button[type="submit"]:hover,
        input[type="submit"]:hover {
            background: #3f83d6 !important;
            transform: translateY(-1px);
            box-shadow: 0 7px 15px rgba(74,144,226,0.22) !important;
        }

        .cancel-btn,
        .btn-cancel,
        .secondary-btn {
            background: #fff !important;
            border: 1px solid #dde3ea !important;
            color: #555 !important;
            box-shadow: none !important;
        }

        .cancel-btn:hover,
        .btn-cancel:hover,
        .secondary-btn:hover {
            background: #f8fafc !important;
            border-color: #cfd8e3 !important;
            color: #333 !important;
        }

        .delete-btn,
        .btn-delete,
        .danger-btn {
            background: #fff !important;
            border: 1px solid #ffd1d6 !important;
            color: #dc3545 !important;
            box-shadow: none !important;
        }

        .delete-btn:hover,
        .btn-delete:hover,
        .danger-btn:hover {
            background: #fff5f5 !important;
            color: #c82333 !important;
            transform: translateY(-1px);
        }

        input[type="text"],
        input[type="date"],
        input[type="file"],
        select,
        textarea {
            border-color: #dbe3ea !important;
            border-radius: 12px !important;
        }

        input[type="text"]:focus,
        input[type="date"]:focus,
        input[type="file"]:focus,
        select:focus,
        textarea:focus {
            outline: none !important;
            border-color: var(--moyo-mint) !important;
            box-shadow: 0 0 0 3px rgba(85,221,191,0.12) !important;
        }

        .ck.ck-editor__main > .ck-editor__editable,
        .ck.ck-toolbar {
            border-color: #dbe3ea !important;
        }

        .ck.ck-editor__editable:focus {
            border-color: var(--moyo-mint) !important;
            box-shadow: 0 0 0 3px rgba(85,221,191,0.10) !important;
        }

        .list-table th {
            background: #f8fafc !important;
            color: #333 !important;
        }

        .list-table tbody tr:hover {
            background: #fbfffd !important;
        }

        .list-table a:hover,
        .post-title-link:hover {
            color: var(--moyo-blue) !important;
        }

        .attachment-box,
        .file-box,
        .comment-box,
        .comment-form {
            background: #fafbfc !important;
        }

        .meta,
        .post-meta,
        .detail-meta,
        .list-date,
        .empty-text,
        .comment-date,
        .file-empty {
            color: var(--moyo-muted) !important;
        }
        /* ===== End MOYO Board Point Theme - subtle ===== */

</style>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css?v=board-editor-picker-v10">
</head>
<body class="moyo-board-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css?v=board-editor-picker-v10">

    <div class="write-page ${boardType eq 'FILE' ? 'board-file-form-page' : ''}">
        <div class="write-card">
            <div class="write-header">
                <div>
                    <h1 class="write-title">
                        <c:choose>
                            <c:when test="${boardType eq 'NOTICE'}">공지사항 작성</c:when>
                            <c:when test="${boardType eq 'FILE'}">자료 등록</c:when>
                            <c:otherwise>게시글 작성</c:otherwise>
                        </c:choose>
                    </h1>
                    <p class="write-desc">
                        <c:choose>
                            <c:when test="${boardType eq 'NOTICE'}">중요한 소식과 안내를 구성원들과 공유합니다.</c:when>
                            <c:when test="${boardType eq 'FILE'}">필요한 자료와 설명을 함께 등록합니다.</c:when>
                            <c:otherwise>구성원들과 자유롭게 의견을 나눕니다.</c:otherwise>
                        </c:choose>
                    </p>
                </div>
                <a id="backLink" href="javascript:history.back();" class="back-link">← 돌아가기</a>
            </div>

            <form id="writeForm" autocomplete="off">
                <input type="hidden" id="wsId" value="${wsId}">
                <input type="hidden" id="boardType" value="${boardType}">
                <input type="hidden" id="projId" value="${projId}">

                <div class="form-group">
                    <label class="form-label" for="title"><c:choose><c:when test="${boardType eq 'FILE'}">자료명</c:when><c:otherwise>제목</c:otherwise></c:choose></label>
                    <input type="text" id="title" class="title-input" placeholder="<c:choose><c:when test='${boardType eq "FILE"}'>자료명을 입력하세요</c:when><c:otherwise>제목을 입력하세요</c:otherwise></c:choose>" required>
                </div>



                <c:if test="${canManageBoard}">
                    <div class="form-group board-pin-panel is-inactive">
                        <div class="board-pin-head">
                            <label class="board-pin-toggle">
                                <input type="checkbox" id="isPinned" value="Y">
                                <span>상단 고정</span>
                            </label>
                            <p>그룹장/팀장 또는 관리자만 사용할 수 있습니다. 기간을 비우면 계속 고정됩니다.</p>
                        </div>
                        <div class="board-pin-dates">
                            <label>시작일
                                <input type="date" id="pinStartDt" class="pin-date-input" disabled>
                            </label>
                            <label>종료일
                                <input type="date" id="pinEndDt" class="pin-date-input" disabled>
                            </label>
                        </div>
                    </div>
                </c:if>

                <div class="form-group">
                    <label class="form-label" for="editor"><c:choose><c:when test="${boardType eq 'FILE'}">자료 설명</c:when><c:otherwise>내용</c:otherwise></c:choose></label>
                    <textarea id="editor" name="content" autocomplete="off" spellcheck="false"></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label" for="fileInput"><c:choose><c:when test="${boardType eq 'FILE'}">자료 파일</c:when><c:otherwise>파일 첨부</c:otherwise></c:choose></label>
                    <div id="fileDropZone" class="board-file-dropzone ${boardType eq 'FILE' ? 'is-file-board' : ''}">
                        <input type="file" id="fileInput" name="files" multiple class="file-input board-file-hidden">
                        <div class="dropzone-icon">📎</div>
                        <div class="dropzone-main"><c:choose><c:when test="${boardType eq 'FILE'}">자료 파일을 끌어다 놓거나 클릭해서 선택하세요</c:when><c:otherwise>파일을 끌어다 놓거나 클릭해서 선택하세요</c:otherwise></c:choose></div>
                        <div class="dropzone-sub"><c:choose><c:when test="${boardType eq 'FILE'}">자료실 글은 파일 첨부를 권장합니다.</c:when><c:otherwise>여러 파일을 한 번에 추가할 수 있습니다.</c:otherwise></c:choose></div>
                    </div>
                    <ul id="selectedFileList" class="selected-file-list"></ul>
                </div>

                <div class="action-row">
                    <a id="cancelLink" href="javascript:history.back();" class="btn-cancel">취소</a>
                    <button type="button" class="btn-submit" onclick="submitPost()"><c:choose><c:when test="${boardType eq 'FILE'}">자료 등록</c:when><c:otherwise>등록하기</c:otherwise></c:choose></button>
                </div>
            </form>
        </div>
    </div>

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
                li.innerHTML = '<span>📄 ' + escapeHtml(file.name) + ' <em>' + formatFileSize(file.size) + '</em></span>' +
                               '<button type="button" onclick="removeSelectedFile(' + index + ')">삭제</button>';
                selectedFileList.appendChild(li);
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
            const typeParam = urlParams.get('type');

            if (wsIdParam) {
                document.getElementById('wsId').value = wsIdParam;
            }

            if (projIdParam) {
                document.getElementById('projId').value = projIdParam;
            }

            if (typeParam) {
                document.getElementById('boardType').value = typeParam;
            }

            const wsId = document.getElementById('wsId').value;
            const projId = document.getElementById('projId').value;
            const boardType = document.getElementById('boardType').value;

            const backUrl = projId
                ? '/project/board/list?projId=' + projId + '&type=' + boardType + '&wsId=' + wsId
                : '/group/board/list?wsId=' + wsId + '&type=' + boardType;

            document.getElementById('backLink').href = backUrl;
            document.getElementById('cancelLink').href = backUrl;

            initializeBoardFileDropZone();
            initializeBoardPinToggle();

            console.log("글쓰기 wsId =", wsId);
            console.log("글쓰기 projId =", projId);
            console.log("글쓰기 boardType =", boardType);
        });


        function initializeBoardPinToggle() {
            const isPinnedEl = document.getElementById('isPinned');
            const pinStartEl = document.getElementById('pinStartDt');
            const pinEndEl = document.getElementById('pinEndDt');
            if (!isPinnedEl || !pinStartEl || !pinEndEl) return;

            const panel = isPinnedEl.closest('.board-pin-panel');
            const syncPinState = () => {
                const enabled = isPinnedEl.checked;
                [pinStartEl, pinEndEl].forEach(input => {
                    input.disabled = !enabled;
                    if (!enabled) input.value = '';
                });
                if (panel) {
                    panel.classList.toggle('is-active', enabled);
                    panel.classList.toggle('is-inactive', !enabled);
                }
            };

            isPinnedEl.addEventListener('change', syncPinState);
            syncPinState();
        }

        function MyCustomUploadAdapterPlugin(editor) {
            editor._boardUploadCount = 0;
            editor._boardUploadWaiters = [];

            editor.waitForBoardUploads = function() {
                if (editor._boardUploadCount === 0) return Promise.resolve();
                return new Promise(resolve => editor._boardUploadWaiters.push(resolve));
            };

            function completeUpload() {
                editor._boardUploadCount = Math.max(0, editor._boardUploadCount - 1);
                if (editor._boardUploadCount !== 0) return;
                editor._boardUploadWaiters.splice(0).forEach(resolve => resolve());
            }

            editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                let xhr = null;
                let active = false;

                return {
                    upload() {
                        if (!active) {
                            active = true;
                            editor._boardUploadCount += 1;
                        }

                        return loader.file.then(file => new Promise((resolve, reject) => {
                            if (!BOARD_EDITOR_IMAGE_TYPES.includes(file.type)) {
                                reject('본문 이미지는 jpg, png, gif, webp 형식만 업로드할 수 있습니다.');
                                return;
                            }
                            if (file.size > BOARD_EDITOR_MAX_IMAGE_SIZE) {
                                reject('본문 이미지는 5MB 이하만 업로드할 수 있습니다.');
                                return;
                            }

                            const formData = new FormData();
                            formData.append('upload', file);

                            xhr = $.ajax({
                                url: '/api/workspace/board/image-upload',
                                type: 'POST',
                                data: formData,
                                processData: false,
                                contentType: false,
                                success: function(res) {
                                    if (res.uploaded && res.url) resolve({ default: res.url });
                                    else reject(res.error ? res.error.message : '이미지 업로드에 실패했습니다.');
                                },
                                error: function(xhr) {
                                    const message = xhr.responseJSON && xhr.responseJSON.error
                                        ? xhr.responseJSON.error.message
                                        : '이미지 업로드 중 서버 통신 오류가 발생했습니다.';
                                    reject(message);
                                }
                            });
                        })).finally(() => {
                            if (active) {
                                active = false;
                                completeUpload();
                            }
                        });
                    },
                    abort() {
                        if (xhr && typeof xhr.abort === 'function') xhr.abort();
                    }
                };
            };
        }

        const BoardClassicEditor = window.CKEDITOR && window.CKEDITOR.ClassicEditor ? window.CKEDITOR.ClassicEditor : window.ClassicEditor;

        const boardEditorConfig = {
            language: 'ko',
            placeholder: '내용을 입력하세요.',
            toolbar: {
                items: [
                    'heading', '|',
                    'bold', 'italic', 'underline', '|',
                    'fontColor', 'fontBackgroundColor', '|',
                    'alignment', '|',
                    'numberedList', 'bulletedList', '|',
                    'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', '|',
                    'removeFormat', 'undo', 'redo'
                ],
                shouldNotGroupWhenFull: false
            },
            fontColor: {
                columns: 6,
                documentColors: 12
            },
            fontBackgroundColor: {
                columns: 6,
                documentColors: 12
            },
            image: {
                upload: { types: ['jpeg', 'jpg', 'png', 'gif', 'webp'] },
                resizeUnit: '%',
                styles: [ 'inline', 'alignLeft', 'alignCenter', 'alignRight', 'side' ],
                toolbar: [
                    'imageTextAlternative', 'toggleImageCaption', '|',
                    'imageStyle:inline', 'imageStyle:alignLeft', 'imageStyle:alignCenter', 'imageStyle:alignRight', 'imageStyle:side', '|',
                    'resizeImage'
                ]
            },
            table: {
                contentToolbar: [
                    'tableColumn', 'tableRow', 'mergeTableCells', '|',
                    'tableProperties', 'tableCellProperties'
                ],
                defaultHeadings: { rows: 0, columns: 0 }
            },
            link: {
                addTargetToExternalLinks: true,
                defaultProtocol: 'https://'
            },
            extraPlugins: [MyCustomUploadAdapterPlugin],
            removePlugins: [
                'CKBox', 'CKFinder', 'EasyImage', 'RealTimeCollaborativeComments',
                'RealTimeCollaborativeTrackChanges', 'RealTimeCollaborativeRevisionHistory',
                'PresenceList', 'Comments', 'TrackChanges', 'TrackChangesData',
                'RevisionHistory', 'Pagination', 'WProofreader', 'MathType',
                'SlashCommand', 'Template', 'DocumentOutline', 'FormatPainter',
                'TableOfContents', 'PasteFromOfficeEnhanced',
                'AIAssistant', 'AIAdapter', 'OpenAITextAdapter', 'AzureOpenAITextAdapter',
                'CKBoxImageEdit', 'ExportPdf', 'ExportWord', 'ImportWord', 'ImportFromWord',
                'MultiLevelList', 'CaseChange',
                'ListProperties', 'TodoList',
                'TableColumnResize', 'TableCaption'
            ]
        };

        BoardClassicEditor
            .create(document.querySelector('#editor'), boardEditorConfig)
            .then(editor => {
                myEditor = editor;
                myEditor.setData('');
            })
            .catch(error => {
                console.error("에디터 초기화 실패:", error);
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

            const title = document.getElementById('title').value.trim();
            const submitButton = document.querySelector('.btn-submit');
            const originalSubmitText = submitButton ? submitButton.textContent : '';

            if (myEditor && myEditor._boardUploadCount > 0) {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = '이미지 업로드 중...';
                }
                await myEditor.waitForBoardUploads();
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalSubmitText;
                }
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
                alert("워크스페이스 또는 프로젝트 정보가 없습니다.");
                return;
            }

            const formData = new FormData();

            const isPinnedEl = document.getElementById('isPinned');
            const pinStartEl = document.getElementById('pinStartDt');
            const pinEndEl = document.getElementById('pinEndDt');
            const isPinned = isPinnedEl && isPinnedEl.checked ? 'Y' : 'N';
            const pinStartDt = pinStartEl ? pinStartEl.value : '';
            const pinEndDt = pinEndEl ? pinEndEl.value : '';

            if (isPinned === 'Y' && pinStartDt && pinEndDt && pinStartDt > pinEndDt) {
                alert('상단 고정 종료일은 시작일보다 빠를 수 없습니다.');
                return;
            }

            const postData = {
                wsId: wsId,
                boardType: boardType,
                title: title,
                content: content,
                isPinned: isPinned,
                pinStartDt: pinStartDt,
                pinEndDt: pinEndDt
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
                            location.href = '/project/main?projId=' + projId + '&wsId=' + wsId;
                        } else {
                            location.href = '/group/board/list?wsId=' + wsId + '&type=' + boardType;
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
