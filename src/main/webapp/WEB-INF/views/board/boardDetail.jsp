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
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css?v=board-1st-v4">
</head>
<body class="moyo-board-body">

    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css?v=board-1st-v4-after-sidebar">

    <div class="detail-container ${post.boardType eq 'FILE' ? 'board-file-detail-page' : ''}">
        <c:choose>
            <c:when test="${not empty projId}">
                <a href="/project/board/list?projId=${projId}&type=${post.boardType}&wsId=${post.wsId}" class="board-top-link">← 목록으로 돌아가기</a>
            </c:when>
            <c:otherwise>
                <a href="/group/board/list?wsId=${post.wsId}&type=${post.boardType}" class="board-top-link">← 목록으로 돌아가기</a>
            </c:otherwise>
        </c:choose>
        <div class="detail-card">
            <div class="detail-kicker">
                <c:if test="${post.isPinned eq 'Y'}"><span class="board-badge fixed">고정</span></c:if>
                <c:if test="${post.boardType eq 'NOTICE'}"><span class="board-badge notice">공지</span></c:if>
                <c:if test="${post.boardType eq 'FILE'}"><span class="board-badge file">자료</span></c:if>
                <c:if test="${post.hasFile}"><span class="board-badge file">첨부 ${post.fileCount}</span></c:if>
            </div>

            <c:if test="${post.isPinned eq 'Y'}">
                <div class="board-pin-info">
                    상단 고정
                    <c:if test="${not empty post.pinStartDt or not empty post.pinEndDt}">
                        · ${empty post.pinStartDt ? '시작 제한 없음' : post.pinStartDt} ~ ${empty post.pinEndDt ? '종료 제한 없음' : post.pinEndDt}
                    </c:if>
                </div>
            </c:if>

            <div class="detail-title-row">
                <h1 class="detail-title">${post.title}</h1>

                <c:if test="${user.USER_ID == post.userId}">
                    <div class="post-actions post-actions-top">
                        <c:choose>
                            <c:when test="${not empty projId}">
                                <a href="/group/board/modifyForm?postId=${post.postId}&wsId=${post.wsId}&projId=${projId}" class="board-detail-action edit">수정</a>
                            </c:when>
                            <c:otherwise>
                                <a href="/group/board/modifyForm?postId=${post.postId}&wsId=${post.wsId}" class="board-detail-action edit">수정</a>
                            </c:otherwise>
                        </c:choose>
                        <a href="javascript:void(0);" onclick="confirmDelete('${post.postId}', '${post.wsId}', '${post.boardType}')" class="board-detail-action delete">삭제</a>
                    </div>
                </c:if>
            </div>

            <div class="info-row detail-meta-grid">
                <span>작성자 <strong>${post.writerName}</strong></span>
                <span>작성일 <strong>${post.regDt}</strong></span>
                <span>조회 <strong>${post.viewCount}</strong></span>
                <span>댓글 <strong>${post.replyCount}</strong></span>
                <button type="button" class="board-report-meta-btn" onclick="openReportModal('POST', '${post.postId}')">
                    <span class="board-report-icon" aria-hidden="true">🚨</span> 신고
                </button>
            </div>

            <div class="content-body board-detail-content ${post.boardType eq 'FILE' ? 'board-file-description' : ''}">
                <c:if test="${post.boardType eq 'FILE'}"><div class="section-mini-title">자료 설명</div></c:if>
                ${post.content}
            </div>

            <div class="board-reaction-bar board-reaction-bar-bottom board-detail-action-line">
                <button type="button" id="boardLikeBtn" class="board-like-btn board-like-btn-bottom-right" onclick="toggleBoardLike()">
                    <span id="boardLikeIcon">♡</span> 좋아요 <strong id="boardLikeCount">${post.likeCount}</strong>
                </button>
            </div>

            <c:if test="${not empty fileList}">
                <div class="file-section">
                    <label><c:choose><c:when test="${post.boardType eq 'FILE'}">📎 자료 파일</c:when><c:otherwise>📎 첨부파일</c:otherwise></c:choose></label>
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


    <div id="boardReportModal" class="board-report-modal" aria-hidden="true">
        <div class="board-report-dim" onclick="closeReportModal()"></div>
        <div class="board-report-card">
            <div class="board-report-head">
                <h3>신고하기</h3>
                <button type="button" onclick="closeReportModal()">×</button>
            </div>
            <input type="hidden" id="reportContentType">
            <input type="hidden" id="reportContentId">
            <label class="board-report-label">신고 사유</label>
            <select id="reportReason" class="board-report-select">
                <option value="SPAM">스팸/홍보성 내용</option>
                <option value="ABUSE">욕설/비방</option>
                <option value="INAPPROPRIATE">부적절한 내용</option>
                <option value="PRIVACY">개인정보 노출</option>
                <option value="ETC">기타</option>
            </select>
            <label class="board-report-label">상세 내용</label>
            <textarea id="reportDetail" class="board-report-textarea" placeholder="신고 내용을 간단히 입력하세요."></textarea>
            <div class="board-report-actions">
                <button type="button" class="post-action-btn" onclick="closeReportModal()">취소</button>
                <button type="button" class="post-action-btn danger" onclick="submitReport()">신고 접수</button>
            </div>
        </div>
    </div>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        function submitReply(parentReplyId) {
            const isChild = !!parentReplyId;
            const input = isChild
                ? document.getElementById("nestedReplyInput-" + parentReplyId)
                : document.getElementById("replyContent");

            const content = input ? input.value.trim() : "";
            if (!content) return alert("내용을 입력하세요.");

            const data = {
                postId: parseInt("${post.postId}"),
                content: content,
                userId: "${user.USER_ID}",
                parentReplyId: isChild ? Number(parentReplyId) : null
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
                input.value = "";
                loadReplies();
            })
            .catch(err => {
                console.error("에러 발생:", err);
                alert("댓글 등록 중 서버 에러가 발생했습니다.");
            });
        }

        const boardReactionContentType = "${post.boardType}" === "NOTICE" ? "NOTICE" : "BOARD";

        window.onload = function() {
            loadReplies();
            loadBoardReactionStatus();
        };

        function loadBoardReactionStatus() {
            fetch('/api/reactions/status?contentType=' + boardReactionContentType + '&contentId=${post.postId}&reactionType=LIKE')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                updateBoardLikeButton(data.liked || data.reacted, data.likeCount || data.reactionCount || 0);
            })
            .catch(err => console.warn('게시글 좋아요 상태 조회 실패:', err));
        }

        function toggleBoardLike() {
            fetch('/api/reactions/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType: boardReactionContentType,
                    contentId: Number('${post.postId}'),
                    reactionType: 'LIKE'
                })
            })
            .then(res => {
                if (!res.ok) return res.json().then(data => { throw new Error(data.message || '좋아요 처리 실패'); });
                return res.json();
            })
            .then(data => {
                updateBoardLikeButton(data.liked || data.reacted, data.likeCount || data.reactionCount || 0);
            })
            .catch(err => {
                console.error('게시글 좋아요 처리 실패:', err);
                alert(err.message || '좋아요 처리 중 오류가 발생했습니다.');
            });
        }

        function updateBoardLikeButton(liked, count) {
            const btn = document.getElementById('boardLikeBtn');
            const icon = document.getElementById('boardLikeIcon');
            const countEl = document.getElementById('boardLikeCount');
            if (!btn || !icon || !countEl) return;
            btn.classList.toggle('liked', !!liked);
            icon.textContent = liked ? '♥' : '♡';
            countEl.textContent = count;
        }


        function openReportModal(contentType, contentId) {
            const modal = document.getElementById('boardReportModal');
            document.getElementById('reportContentType').value = contentType === 'REPLY' ? 'REPLY' : boardReactionContentType;
            document.getElementById('reportContentId').value = contentId;
            document.getElementById('reportReason').value = 'SPAM';
            document.getElementById('reportDetail').value = '';
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
        }

        function closeReportModal() {
            const modal = document.getElementById('boardReportModal');
            if (!modal) return;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
        }

        function submitReport() {
            const contentType = document.getElementById('reportContentType').value;
            const contentId = document.getElementById('reportContentId').value;
            const reason = document.getElementById('reportReason').value;
            const detail = document.getElementById('reportDetail').value.trim();

            fetch('/api/workspace/${post.wsId}/board/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType: contentType,
                    contentId: Number(contentId),
                    reason: reason,
                    detail: detail
                })
            })
            .then(res => res.json().then(data => ({ ok: res.ok, data: data })))
            .then(result => {
                if (!result.ok || result.data.status === 'FAIL') {
                    alert(result.data.message || '신고 접수에 실패했습니다.');
                    return;
                }
                if (result.data.status === 'DUPLICATE') {
                    alert(result.data.message || '이미 신고한 항목입니다.');
                    closeReportModal();
                    return;
                }
                alert('신고가 접수되었습니다.');
                closeReportModal();
            })
            .catch(err => {
                console.error('신고 접수 실패:', err);
                alert('신고 접수 중 오류가 발생했습니다.');
            });
        }

        function toggleEditReply(replyId) {
            const textWrap = document.getElementById("reply-text-wrap-" + replyId);
            const btnWrap = document.getElementById("reply-btn-wrap-" + replyId);
            const currentContent = document.getElementById("reply-raw-text-" + replyId).textContent;

            textWrap.innerHTML = "<textarea id='edit-input-" + replyId + "' class='reply-edit-input reply-edit-textarea'></textarea>";
            document.getElementById("edit-input-" + replyId).value = currentContent;

            btnWrap.innerHTML = "<button type='button' class='reply-action-btn save' onclick='submitEditReply(" + replyId + ")'>완료</button>" +
                                "<button type='button' class='reply-action-btn muted' onclick='loadReplies()'>취소</button>";
        }

        function openInlineReplyForm(parentReplyId, author) {
            closeInlineReplyForm();
            const parentItem = document.getElementById("reply-item-" + parentReplyId);
            if (!parentItem) return;

            const form = document.createElement("div");
            form.className = "nested-reply-form";
            form.id = "nestedReplyForm-" + parentReplyId;
            form.innerHTML =
                "<div class='nested-reply-guide'>" + author + "님에게 답글 작성</div>" +
                "<textarea id='nestedReplyInput-" + parentReplyId + "' placeholder='답글을 입력하세요.'></textarea>" +
                "<div class='nested-reply-actions'>" +
                    "<button type='button' class='reply-action-btn muted' onclick='closeInlineReplyForm()'>취소</button>" +
                    "<button type='button' class='reply-action-btn save' onclick='submitReply(" + parentReplyId + ")'>답글 등록</button>" +
                "</div>";
            parentItem.appendChild(form);
            document.getElementById("nestedReplyInput-" + parentReplyId).focus();
        }

        function closeInlineReplyForm() {
            const opened = document.querySelector(".nested-reply-form");
            if (opened) opened.remove();
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
                    list.innerHTML = "<li class='reply-empty'>등록된 댓글이 없습니다.</li>";
                    return;
                }

                const replyMap = {};
                const rootReplies = [];
                data.forEach(reply => {
                    const replyId = Number(reply.REPLY_ID);
                    reply._children = [];
                    replyMap[replyId] = reply;
                });

                data.forEach(reply => {
                    const parentReplyId = reply.PARENT_REPLY_ID ? Number(reply.PARENT_REPLY_ID) : null;
                    if (parentReplyId && replyMap[parentReplyId]) {
                        replyMap[parentReplyId]._children.push(reply);
                    } else {
                        rootReplies.push(reply);
                    }
                });

                rootReplies.forEach(reply => {
                    list.appendChild(createReplyElement(reply, false, currentUserId));
                    (reply._children || []).forEach(child => {
                        list.appendChild(createReplyElement(child, true, currentUserId));
                    });
                });
            })
            .catch(err => console.error("댓글 로딩 실패:", err));
        }

        function createReplyElement(reply, isChild, currentUserId) {
            const replyId = reply.REPLY_ID;
            const author = reply.USER_NAME || "익명";
            const content = reply.CONTENT || "";
            const date = reply.REG_DT || "";
            const replyUserId = reply.USER_ID ? String(reply.USER_ID).trim() : "";

            const li = document.createElement("li");
            li.id = "reply-item-" + replyId;
            li.className = isChild ? "reply-item reply-child" : "reply-item";

            const body = document.createElement("div");
            body.className = "reply-content-area";
            body.id = "reply-text-wrap-" + replyId;

            const meta = document.createElement("div");
            meta.className = "reply-meta-line";
            if (isChild) {
                const marker = document.createElement("span");
                marker.className = "reply-child-marker";
                marker.textContent = "↳";
                meta.appendChild(marker);
            }
            const name = document.createElement("strong");
            name.textContent = author;
            const dateEl = document.createElement("small");
            dateEl.textContent = date;
            meta.appendChild(name);
            meta.appendChild(dateEl);

            const reportMetaBtn = document.createElement("button");
            reportMetaBtn.type = "button";
            reportMetaBtn.className = "reply-meta-report-btn";
            reportMetaBtn.innerHTML = "<span aria-hidden='true'>🚨</span> 신고";
            reportMetaBtn.onclick = function() { openReportModal('REPLY', replyId); };
            meta.appendChild(reportMetaBtn);

            const text = document.createElement("div");
            text.className = "reply-text-content";
            text.id = "reply-raw-text-" + replyId;
            text.textContent = content;

            body.appendChild(meta);
            body.appendChild(text);

            const actions = document.createElement("div");
            actions.className = "reply-actions";
            actions.id = "reply-btn-wrap-" + replyId;

            if (!isChild) {
                actions.innerHTML += "<button type='button' class='reply-action-btn reply' onclick=\"openInlineReplyForm(" + replyId + ", '" + escapeJs(author) + "')\">답글</button>";
            }
            if (currentUserId && replyUserId && currentUserId === replyUserId) {
                actions.innerHTML += "<button type='button' class='reply-action-btn edit' onclick='toggleEditReply(" + replyId + ")'>수정</button>" +
                                     "<button type='button' class='reply-action-btn delete' onclick='deleteReply(" + replyId + ")'>삭제</button>";
            }
            actions.innerHTML += "<button type='button' class='reply-action-btn report' onclick=\"openReportModal('REPLY', " + replyId + ")\"><span>🚨</span> 신고</button>";

            li.appendChild(body);
            li.appendChild(actions);
            return li;
        }

        function escapeJs(value) {
            return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"');
        }
    </script>
</body>
</html>
