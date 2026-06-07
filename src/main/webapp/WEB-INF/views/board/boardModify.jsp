<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>게시글 수정</title>

    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/classic/ckeditor.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <style>
        body {
            margin: 0;
            background: #f8f9fa;
            color: #333;
            font-family: 'Pretendard', sans-serif;
        }

        .modify-page {
            max-width: 1120px;
            margin: 34px auto 60px;
            padding: 0 24px;
            box-sizing: border-box;
        }

        .form-card {
            background: #fff;
            border: 1px solid #eef0f2;
            border-radius: 18px;
            padding: 38px 46px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            box-sizing: border-box;
        }

        .modify-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #222;
        }

        .modify-title {
            margin: 0;
            font-size: 28px;
            color: #111;
            font-weight: 800;
            letter-spacing: -0.03em;
            line-height: 1.25;
        }

        .modify-desc {
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

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 800;
            color: #444;
        }

        .form-control {
            width: 100%;
            padding: 13px 14px;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-sizing: border-box;
            font-size: 15px;
            font-family: inherit;
            outline: none;
            transition: border-color .2s, box-shadow .2s;
        }

        .form-control:focus {
            border-color: #4A90E2;
            box-shadow: 0 0 0 3px rgba(74,144,226,0.12);
        }

        textarea {
            width: 100%;
            height: 80px;
            resize: none;
            box-sizing: border-box;
        }

        .ck.ck-editor__editable_inline,
        .ck-editor__editable {
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

        .file-panel {
            border: 1px solid #eef0f2;
            border-radius: 12px;
            background: #f8f9fa;
            padding: 16px 18px;
        }

        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid #eef0f2;
            font-size: 13px;
        }

        .file-item:last-child {
            border-bottom: none;
        }

        .file-delete-btn {
            border: 1px solid #ffd6d6;
            background: #fff;
            color: #ff4d4d;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
        }

        .file-delete-btn:hover {
            background: #fff5f5;
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

        .btn-area {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid #eef0f2;
        }

        .btn-save,
        .btn-cancel {
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

        .btn-save {
            background: #4A90E2;
            color: #fff;
            border: 1px solid #4A90E2;
            box-shadow: 0 4px 10px rgba(74,144,226,0.2);
        }

        .btn-save:hover {
            background: #357ABD;
        }

        @media(max-width: 760px) {
            .modify-page {
                margin: 24px auto 40px;
                padding: 0 14px;
            }

            .form-card {
                padding: 28px 22px;
                border-radius: 16px;
            }

            .modify-header {
                flex-direction: column;
            }

            .modify-title {
                font-size: 24px;
            }

            .btn-area {
                justify-content: stretch;
            }

            .btn-save,
            .btn-cancel {
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
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css">
</head>
<body class="moyo-board-body">

    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="modify-page">
        <div class="form-card">
            <div class="modify-header">
                <div>
                    <h1 class="modify-title">
                        <c:choose>
                            <c:when test="${boardType eq 'NOTICE'}">공지사항 수정</c:when>
                            <c:when test="${boardType eq 'FILE'}">자료 수정</c:when>
                            <c:otherwise>게시글 수정</c:otherwise>
                        </c:choose>
                    </h1>
                    <p class="modify-desc">제목, 내용, 첨부파일을 수정합니다.</p>
                </div>
                <a id="backLink" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}" class="back-link">← 상세로 돌아가기</a>
            </div>

            <form action="/group/board/modify" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="postId" value="${post.postId}">
                <input type="hidden" name="wsId" value="${wsId}">
                <input type="hidden" name="boardType" value="${boardType}">
                <input type="hidden" name="projId" value="${projId}">

                <div class="form-group">
                    <label for="title">제목</label>
                    <input type="text" id="title" name="title" class="form-control" value="${post.title}" required>
                </div>

                <div class="form-group">
                    <label for="editor">내용</label>
                    <textarea id="editor" name="content">${post.content}</textarea>
                </div>

                <c:if test="${not empty fileList}">
                    <div class="form-group">
                        <label>기존 첨부 파일</label>
                        <div id="existingFiles" class="file-panel">
                            <c:forEach var="file" items="${fileList}">
                                <div class="file-item" id="file-${file.FILE_ID}">
                                    <span>💾 ${file.FILE_ORIGINAL_NAME}</span>
                                    <button type="button" class="file-delete-btn" onclick="deleteFile(${file.FILE_ID})">삭제</button>
                                </div>
                            </c:forEach>
                        </div>
                    </div>
                </c:if>

                <div class="form-group">
                    <label>새 파일 추가</label>
                    <input type="file" name="files" multiple class="file-input">
                </div>

                <div class="btn-area">
                    <a id="cancelLink" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}" class="btn-cancel">취소</a>
                    <button type="submit" class="btn-save">수정 완료</button>
                </div>
            </form>
        </div>
    </div>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        let myEditor;
        const wsId = ${wsId};

        document.addEventListener("DOMContentLoaded", function() {
            const projId = "${projId}";
            const detailUrl = projId && projId !== ""
                ? "/group/board/detail?postId=${post.postId}&wsId=${wsId}&projId=" + projId
                : "/group/board/detail?postId=${post.postId}&wsId=${wsId}";

            document.getElementById("backLink").href = detailUrl;
            document.getElementById("cancelLink").href = detailUrl;
        });

        function MyCustomUploadAdapterPlugin(editor) {
            editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                return {
                    upload() {
                        return loader.file
                            .then(file => new Promise((resolve, reject) => {
                                const formData = new FormData();
                                formData.append('upload', file);

                                $.ajax({
                                    url: '/api/workspace/board/image-upload',
                                    type: 'POST',
                                    data: formData,
                                    processData: false,
                                    contentType: false,
                                    success: function(res) {
                                        if (res.uploaded) {
                                            resolve({ default: res.url });
                                        } else {
                                            reject(res.error ? res.error.message : '업로드 실패');
                                        }
                                    },
                                    error: function(err) {
                                        reject('서버 통신 오류');
                                    }
                                });
                            }));
                    },
                    abort() {}
                };
            };
        }

        ClassicEditor
            .create(document.querySelector('#editor'), {
                language: 'ko',
                toolbar: [
                    'heading', '|',
                    'bold', 'italic', '|',
                    'numberedList', 'bulletedList', '|',
                    'link', 'uploadImage', 'insertTable', 'blockQuote', 'undo', 'redo'
                ],
                extraPlugins: [MyCustomUploadAdapterPlugin]
            })
            .then(editor => {
                myEditor = editor;
            })
            .catch(error => {
                console.error("에디터 인스턴스 초기화 실패:", error);
            });

        document.querySelector('form').addEventListener('submit', function(e) {
            if (myEditor) {
                const editorData = myEditor.getData();

                document.querySelector('#editor').value = editorData;

                if (editorData.trim().length === 0) {
                    alert('내용을 입력해 주세요.');
                    e.preventDefault();
                    return false;
                }
            }
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
