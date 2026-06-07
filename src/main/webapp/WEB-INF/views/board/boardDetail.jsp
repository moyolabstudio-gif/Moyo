<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>게시글 상세</title>
    <style>
        body {
            margin: 0;
            background: #f8f9fa;
            color: #333;
            font-family: 'Pretendard', sans-serif;
        }

        .detail-container {
            max-width: 1120px;
            margin: 34px auto 60px;
            padding: 0 24px;
            box-sizing: border-box;
        }

        .detail-card {
            background: #fff;
            border: 1px solid #eef0f2;
            border-radius: 18px;
            padding: 40px 46px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            box-sizing: border-box;
        }

        .detail-title {
            margin: 0 0 12px 0;
            font-size: 30px;
            line-height: 1.25;
            color: #111;
            font-weight: 800;
            letter-spacing: -0.03em;
        }

        .info-row {
            padding-bottom: 18px;
            border-bottom: 1px solid #222;
            color: #777;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 28px;
        }

        .content-body {
            min-height: 260px;
            font-size: 15px;
            color: #333;
            line-height: 1.8;
            word-break: break-word;
            padding-bottom: 28px;
        }

        .file-section {
            margin: 12px 0 26px;
            padding: 18px 20px;
            background: #f8f9fa;
            border: 1px solid #eef0f2;
            border-radius: 12px;
        }

        .file-section label {
            display: block;
            font-weight: 800;
            color: #444;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .file-section ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .file-section li {
            padding: 6px 0;
            font-size: 13px;
        }

        .file-section a {
            color: #4A90E2;
            text-decoration: none;
            font-weight: 600;
        }

        .file-section a:hover {
            text-decoration: underline;
        }

        .post-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 8px;
            padding-top: 22px;
            border-top: 1px solid #eef0f2;
        }

        .post-action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 9px 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            background: #fff;
            color: #495057;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }

        .post-action-btn:hover {
            background: #f8f9fa;
        }

        .post-action-btn.danger {
            color: #ff4d4d;
            border-color: #ffd6d6;
        }

        .post-action-btn.danger:hover {
            background: #fff5f5;
        }

        .reply-list-section {
            margin-top: 34px;
            padding-top: 28px;
            border-top: 1px solid #eef0f2;
        }

        .reply-list-section h3 {
            margin: 0 0 18px 0;
            font-size: 18px;
            color: #111;
            font-weight: 800;
        }

        #replyList {
            list-style: none;
            margin: 0 0 18px 0;
            padding: 0;
        }

        #replyList li {
            display: flex;
            justify-content: space-between;
            gap: 14px;
            padding: 14px 0;
            border-bottom: 1px solid #f1f3f5;
            font-size: 14px;
        }

        .reply-content-area {
            flex: 1;
            min-width: 0;
            line-height: 1.6;
        }

        .reply-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
        }

        .reply-actions a {
            color: #4A90E2;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
        }

        .reply-actions a.delete-action {
            color: #ff4d4d;
        }

        .reply-edit-input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-sizing: border-box;
        }

        .reply-box {
            background: #f8f9fa;
            border: 1px solid #eef0f2;
            border-radius: 12px;
            padding: 18px;
        }

        #replyContent {
            width: 100%;
            height: 86px;
            resize: none;
            padding: 12px 14px;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-sizing: border-box;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            background: #fff;
        }

        #replyContent:focus {
            border-color: #4A90E2;
            box-shadow: 0 0 0 3px rgba(74,144,226,0.12);
        }

        .reply-submit-row {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }

        .btn-submit {
            padding: 10px 18px;
            background: #4A90E2;
            color: #fff;
            border: 1px solid #4A90E2;
            border-radius: 8px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(74,144,226,0.2);
        }

        .btn-submit:hover {
            background: #357ABD;
        }

        @media(max-width: 760px) {
            .detail-container {
                margin: 24px auto 40px;
                padding: 0 14px;
            }

            .detail-card {
                padding: 28px 22px;
                border-radius: 16px;
            }

            .detail-title {
                font-size: 24px;
            }

            .content-body {
                min-height: 180px;
            }

            .post-actions {
                justify-content: flex-start;
                flex-wrap: wrap;
            }

            #replyList li {
                flex-direction: column;
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

    <div class="detail-container">
        <c:choose>
            <c:when test="${not empty projId}">
                <a href="/project/board/list?projId=${projId}&type=${post.boardType}&wsId=${post.wsId}" class="board-top-link">← 목록으로 돌아가기</a>
            </c:when>
            <c:otherwise>
                <a href="/group/board/list?wsId=${post.wsId}&type=${post.boardType}" class="board-top-link">← 목록으로 돌아가기</a>
            </c:otherwise>
        </c:choose>
        <div class="detail-card">
            <h1 class="detail-title">${post.title}</h1>

            <div class="info-row">
                작성자: ${post.writerName} | 조회수: ${post.viewCount} | 작성일: ${post.regDt}
            </div>

            <div class="content-body">
                ${post.content}
            </div>

            <c:if test="${not empty fileList}">
                <div class="file-section">
                    <label>📎 첨부파일</label>
                    <ul>
                        <c:forEach var="file" items="${fileList}">
                            <li>
                                <a href="/download?fileId=${file.FILE_ID}">
                                    💾 ${file.FILE_ORIGINAL_NAME} (${file.FILE_SIZE} bytes)
                                </a>
                            </li>
                        </c:forEach>
                    </ul>
                </div>
            </c:if>

            <c:if test="${user.USER_ID == post.userId}">
                <div class="post-actions">
                    <c:choose>
                        <c:when test="${not empty projId}">
                            <a href="/group/board/modifyForm?postId=${post.postId}&wsId=${post.wsId}&projId=${projId}" class="post-action-btn">수정</a>
                        </c:when>
                        <c:otherwise>
                            <a href="/group/board/modifyForm?postId=${post.postId}&wsId=${post.wsId}" class="post-action-btn">수정</a>
                        </c:otherwise>
                    </c:choose>
                    <a href="javascript:void(0);" onclick="confirmDelete('${post.postId}', '${post.wsId}', '${post.boardType}')" class="post-action-btn danger">삭제</a>
                </div>
            </c:if>

            <div class="reply-list-section">
                <h3>댓글 목록</h3>
                <ul id="replyList"></ul>
            </div>

            <div class="reply-box">
                <textarea id="replyContent" placeholder="댓글을 입력하세요."></textarea>
                <div class="reply-submit-row">
                    <button class="btn-submit" onclick="submitReply()">댓글 등록</button>
                </div>
            </div>
        </div>
    </div>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        function submitReply() {
            const content = document.getElementById("replyContent").value.trim();
            if (!content) return alert("내용을 입력하세요.");

            const data = {
                postId: parseInt("${post.postId}"),
                content: content,
                userId: "${user.USER_ID}"
            };

            fetch('/api/workspace/${post.wsId}/board/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => {
                if (!res.ok) return res.text().then(text => { throw new Error(text); });
                return res.json();
            })
            .then(res => {
                alert("등록 성공!");
                document.getElementById("replyContent").value = "";
                loadReplies();
            })
            .catch(err => {
                console.error("에러 발생:", err);
                alert("서버 에러 발생!");
            });
        }

        window.onload = function() {
            loadReplies();
        };

        function toggleEditReply(replyId) {
            const textWrap = document.getElementById("reply-text-wrap-" + replyId);
            const btnWrap = document.getElementById("reply-btn-wrap-" + replyId);
            const currentContent = document.getElementById("reply-raw-text-" + replyId).textContent;

            textWrap.innerHTML = "<input type='text' id='edit-input-" + replyId + "' class='reply-edit-input'>";
            document.getElementById("edit-input-" + replyId).value = currentContent;

            btnWrap.innerHTML = "<a onclick='submitEditReply(" + replyId + ")' style='color:#5cb85c; font-weight:bold;'>완료</a>" +
                                "<a onclick='loadReplies()' style='color:#aaa;'>취소</a>";
        }

        function submitEditReply(replyId) {
            const editContent = document.getElementById("edit-input-" + replyId).value.trim();
            if (!editContent) return alert("수정할 내용을 입력해 주세요.");

            const data = {
                replyId: replyId,
                content: editContent
            };

            fetch('/api/workspace/${post.wsId}/board/reply/modify', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => {
                if (!res.ok) throw new Error("수정 실패");
                return res.json();
            })
            .then(res => {
                loadReplies();
            })
            .catch(err => {
                alert("댓글 수정 중 에러가 발생했습니다.");
                console.error(err);
            });
        }

        function deleteReply(replyId) {
            if (!confirm("이 댓글을 삭제하시겠습니까?")) return;

            fetch('/api/workspace/${post.wsId}/board/reply/' + replyId, {
                method: 'DELETE'
            })
            .then(res => {
                if (!res.ok) throw new Error("삭제 실패");
                return res.json();
            })
            .then(res => {
                loadReplies();
            })
            .catch(err => {
                alert("댓글 삭제 중 에러가 발생했습니다.");
                console.error(err);
            });
        }

		function confirmDelete(postId, wsId, boardType) {
		    if (confirm("정말로 이 게시글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
		        const projId = "${projId}";

		        let url = "/group/board/delete?postId=" + postId
		                + "&wsId=" + wsId
		                + "&boardType=" + boardType;

		        if (projId && projId !== "") {
		            url += "&projId=" + projId;
		        }

		        location.href = url;
		    }
		}

        function loadReplies() {
            const postId = "${post.postId}";
            const currentUserId = String("${user.USER_ID}").trim();

            fetch('/api/workspace/${post.wsId}/board/' + postId + '/replies')
            .then(res => res.json())
            .then(data => {
                const list = document.getElementById("replyList");
                list.innerHTML = "";

                if (!data || data.length === 0) {
                    list.innerHTML = "<li style='color:#999;'>등록된 댓글이 없습니다.</li>";
                    return;
                }

                data.forEach(reply => {
                    const replyId = reply.REPLY_ID;
                    const author = reply.USER_NAME || "익명";
                    const content = reply.CONTENT || "";
                    const date = reply.REG_DT || "";
                    const replyUserId = reply.USER_ID ? String(reply.USER_ID).trim() : "";

                    const li = document.createElement("li");
                    li.id = "reply-item-" + replyId;

                    let html = "<div class='reply-content-area' id='reply-text-wrap-" + replyId + "'>" +
                               "<strong>" + author + "</strong>: <span class='reply-text-content' id='reply-raw-text-" + replyId + "'></span>" +
                               " <small style='color:#aaa; margin-left:10px;'>(" + date + ")</small>" +
                               "</div>";

                    if (currentUserId && replyUserId && currentUserId === replyUserId) {
                        html += "<div class='reply-actions' id='reply-btn-wrap-" + replyId + "'>" +
                                "<a onclick='toggleEditReply(" + replyId + ")'>수정</a>" +
                                "<a class='delete-action' onclick='deleteReply(" + replyId + ")'>삭제</a>" +
                                "</div>";
                    }

                    li.innerHTML = html;
                    list.appendChild(li);

                    document.getElementById("reply-raw-text-" + replyId).textContent = content;
                });
            })
            .catch(err => console.error("댓글 로딩 실패:", err));
        }
    </script>
</body>
</html>
