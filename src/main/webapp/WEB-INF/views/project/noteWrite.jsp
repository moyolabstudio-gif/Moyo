<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>노트 작성</title>
    <style>
        body { margin:0; background:#f8f9fa; color:#333; font-family:'Pretendard', sans-serif; }
        .write-page { max-width:920px; margin:36px auto 70px; padding:0 24px; box-sizing:border-box; }
        .top-nav { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:22px; }
        .back-btn { display:inline-flex; align-items:center; gap:6px; text-decoration:none; color:#666; font-size:14px; }
        .back-btn:hover { color:#4A90E2; }
        .list-btn { display:inline-flex; align-items:center; justify-content:center; min-height:34px; padding:0 14px; border-radius:999px; border:1px solid #dcebf8; background:#f7fbff; color:#4A90E2; text-decoration:none; font-size:13px; font-weight:800; white-space:nowrap; }
        .list-btn:hover { background:#eef7ff; }

        .write-card { position:relative; background:#fff; border:1px solid #e9eef2; border-radius:18px; padding:38px 46px; box-shadow:0 4px 15px rgba(0,0,0,.03); overflow:hidden; box-sizing:border-box; }
        .write-card::before { content:''; position:absolute; left:0; top:34px; bottom:34px; width:4px; border-radius:0 999px 999px 0; background:linear-gradient(180deg,#4A90E2,#55DDBF); }
        .write-card > * { position:relative; z-index:1; }
        .write-title { margin:0; font-size:30px; color:#111; letter-spacing:-.04em; }
        .write-desc { margin:10px 0 30px; color:#777; font-size:14px; }
        .form-group { margin-bottom:22px; }
        .form-label { display:block; margin-bottom:9px; font-size:14px; font-weight:800; color:#333; }
        input[type="text"], textarea { width:100%; border:1px solid #dbe3ea; border-radius:12px; padding:13px 14px; font-size:14px; font-family:inherit; box-sizing:border-box; background:#fff; transition:border-color .18s ease, box-shadow .18s ease; }
        input[type="text"]:focus, textarea:focus { outline:none; border-color:#55DDBF; box-shadow:0 0 0 3px rgba(85,221,191,.12); }
        textarea { height:170px; min-height:170px; max-height:170px; resize:none; line-height:1.65; overflow-y:auto; }
        .memo-textarea {
            height: 220px;
            min-height: 220px;
            max-height: 220px;
            resize: none;
            overflow-y: auto;
        }
        .template-help { margin-top:8px; color:#888; font-size:12px; line-height:1.5; }

        .drop-zone { position:relative; border:1.5px dashed #c9d7e4; background:#fafbfc; border-radius:16px; padding:26px 18px; text-align:center; cursor:pointer; transition:background .18s ease, border-color .18s ease, box-shadow .18s ease; user-select:none; }
        .drop-zone:hover, .drop-zone.drag-over { background:#f5fffb; border-color:#55DDBF; box-shadow:0 0 0 3px rgba(85,221,191,.10); }
        .drop-zone-icon { font-size:26px; margin-bottom:8px; }
        .drop-zone-title { color:#333; font-size:14px; font-weight:900; margin-bottom:5px; }
        .drop-zone-desc { color:#888; font-size:12px; line-height:1.5; }
        .file-input { display:none; }
        
        .selected-image-preview {
            display: none;
            grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
            gap: 10px;
            margin-top: 12px;
        }

        .selected-image-preview.active {
            display: grid;
        }

        .selected-image-card {
            position: relative;
            aspect-ratio: 1 / 1;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e9eef2;
            background: #f3f6f9;
        }

        .selected-image-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .selected-image-name {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 6px 7px;
            background: linear-gradient(180deg, transparent, rgba(0,0,0,0.58));
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .selected-file-list { display:none; flex-direction:column; gap:8px; margin-top:12px; }
        .selected-file-list.active { display:flex; }
        .selected-file-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border:1px solid #e9eef2; border-radius:12px; background:#fff; font-size:13px; }
        .selected-file-name { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#333; font-weight:700; }
        .selected-file-size { flex-shrink:0; color:#999; font-size:12px; }
        .file-remove-btn { flex-shrink:0; border:none; background:#fff5f5; color:#ff4d4d; border-radius:999px; padding:4px 8px; font-size:12px; font-weight:800; cursor:pointer; }

        .button-row { display:flex; justify-content:flex-end; gap:10px; margin-top:30px; }
        .cancel-btn,.submit-btn { display:inline-flex; align-items:center; justify-content:center; min-height:42px; padding:0 20px; border-radius:999px; font-size:14px; font-weight:800; text-decoration:none; cursor:pointer; border:1px solid transparent; font-family:inherit; }
        .cancel-btn { background:#fff; color:#555; border-color:#dde3ea; }
        .cancel-btn:hover { background:#f8fafc; }
        .submit-btn { background:linear-gradient(135deg,#4A90E2 0%,#39CDB5 100%); color:#fff; box-shadow:0 6px 14px rgba(57,205,181,.18); }
        .submit-btn:hover { filter:brightness(.98); transform:translateY(-1px); }

        @media(max-width:760px) {
            .write-page { padding:0 16px; }
            .top-nav { align-items:flex-start; flex-direction:column; }
            .list-btn { width:100%; }
            .write-card { padding:30px 24px; }
            textarea { height:150px; min-height:150px; max-height:150px; }
            .button-row { flex-direction:column-reverse; }
            .cancel-btn,.submit-btn { width:100%; }
        }
    </style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="write-page">
        <div class="top-nav">
            <a href="#" class="back-btn" onclick="goBackSmart(); return false;">⬅ 뒤로가기</a>
            <a href="/project/note/list?wsId=${wsId}&projId=${projId}" class="list-btn">노트 목록</a>
        </div>

        <section class="write-card">
            <h2 class="write-title">노트 작성</h2>
            <p class="write-desc">내용과 참고할 파일을 팀원에게 간단히 남겨보세요.</p>

            <form action="/project/note/add" method="post" enctype="multipart/form-data" id="noteForm">
                <input type="hidden" name="wsId" value="${wsId}">
                <input type="hidden" name="projId" value="${projId}">
                <input type="hidden" id="doneContent" name="doneContent" value="">
                <input type="hidden" name="nextContent" value="">
                <input type="hidden" name="issueContent" value="">
                <input type="hidden" name="changeLog" value="">

                <div class="form-group">
                    <label class="form-label" for="noteTitle">제목</label>
                    <input type="text" id="noteTitle" name="noteTitle" placeholder="예: 회의 내용 정리" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="memo">메모</label>
                    <textarea id="memo" name="memo" class="memo-textarea" placeholder="회의 내용, 아이디어, 다음 할 일, 참고사항 등을 자유롭게 적어주세요."></textarea>
                    <div class="template-help">참고 자료나 캡처 이미지가 있다면 아래 첨부파일에 같이 넣으면 됩니다.</div>
                </div>

                <div class="form-group">
                    <label class="form-label">첨부파일</label>
                    <div class="drop-zone" id="dropZone">
                        <div class="drop-zone-icon">📎</div>
                        <div class="drop-zone-title">파일을 여기에 끌어다 놓거나 클릭해서 선택하세요</div>
                        <div class="drop-zone-desc">이미지, 문서, 압축파일 등을 여러 개 첨부할 수 있습니다.</div>
                        <input type="file" id="files" name="files" class="file-input" multiple>
                    </div>
                    <div id="selectedImagePreview" class="selected-image-preview"></div>
                    <div id="selectedFileList" class="selected-file-list"></div>
                </div>

                <div class="button-row">
                    <a href="/project/note/list?wsId=${wsId}&projId=${projId}" class="cancel-btn">취소</a>
                    <button type="submit" class="submit-btn">등록</button>
                </div>
            </form>
        </section>
    </main>

    <script>
        function goBackSmart() {
            const fallbackUrl = "/project/main?projId=${projId}&wsId=${wsId}";
            if (window.history.length > 1 && document.referrer) {
                window.history.back();
                return;
            }
            window.location.href = fallbackUrl;
        }

        const noteForm = document.getElementById('noteForm');
        const memoField = document.getElementById('memo');
        const doneContentField = document.getElementById('doneContent');

        function syncMemoToDoneContent() {
            if (memoField && doneContentField) {
                doneContentField.value = memoField.value;
            }
        }

        if (noteForm) {
            noteForm.addEventListener('submit', syncMemoToDoneContent);
        }

        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('files');
        const selectedFileList = document.getElementById('selectedFileList');
        const selectedImagePreview = document.getElementById('selectedImagePreview');
        let selectedFiles = [];

        dropZone.addEventListener('click', function() { fileInput.click(); });
        fileInput.addEventListener('change', function(e) { addFiles(e.target.files); });
        dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
        dropZone.addEventListener('drop', function(e) { e.preventDefault(); dropZone.classList.remove('drag-over'); addFiles(e.dataTransfer.files); });

        function addFiles(fileList) {
            if (!fileList || fileList.length === 0) return;
            Array.from(fileList).forEach(function(file) {
                const alreadyExists = selectedFiles.some(function(existing) {
                    return existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified;
                });
                if (!alreadyExists) selectedFiles.push(file);
            });
            syncFileInput();
            renderSelectedFiles();
            renderSelectedImages();
        }

        function removeFile(index) {
            selectedFiles.splice(index, 1);
            syncFileInput();
            renderSelectedFiles();
            renderSelectedImages();
        }

        function syncFileInput() {
            const dataTransfer = new DataTransfer();
            selectedFiles.forEach(function(file) { dataTransfer.items.add(file); });
            fileInput.files = dataTransfer.files;
        }

        function renderSelectedFiles() {
            if (selectedFiles.length === 0) {
                selectedFileList.classList.remove('active');
                selectedFileList.innerHTML = '';
                return;
            }
            selectedFileList.classList.add('active');
            let html = '';
            selectedFiles.forEach(function(file, index) {
                html += '<div class="selected-file-item">';
                html += '<span class="selected-file-name">📄 ' + escapeHtml(file.name) + '</span>';
                html += '<span class="selected-file-size">' + formatFileSize(file.size) + '</span>';
                html += '<button type="button" class="file-remove-btn" onclick="removeFile(' + index + ')">삭제</button>';
                html += '</div>';
            });
            selectedFileList.innerHTML = html;
        }


        function renderSelectedImages() {
            if (!selectedImagePreview) return;

            const imageFiles = selectedFiles.filter(function(file) {
                return file.type && file.type.indexOf('image/') === 0;
            });

            if (imageFiles.length === 0) {
                selectedImagePreview.classList.remove('active');
                selectedImagePreview.innerHTML = '';
                return;
            }

            selectedImagePreview.classList.add('active');

            let html = '';
            imageFiles.forEach(function(file) {
                const imageUrl = URL.createObjectURL(file);
                html += '<div class="selected-image-card">';
                html += '<img src="' + imageUrl + '" alt="' + escapeHtml(file.name) + '">';
                html += '<div class="selected-image-name">' + escapeHtml(file.name) + '</div>';
                html += '</div>';
            });

            selectedImagePreview.innerHTML = html;
        }

        function formatFileSize(size) {
            if (size < 1024) return size + ' B';
            if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
            return (size / (1024 * 1024)).toFixed(1) + ' MB';
        }

        function escapeHtml(value) {
            return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
        }
    </script>
</body>
</html>
