<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>노트 상세</title>
    <style>
        body {
            margin: 0;
            background: #f8f9fa;
            color: #333;
            font-family: 'Pretendard', sans-serif;
        }

        .detail-container {
            max-width: 960px;
            margin: 36px auto 60px;
            padding: 0 24px;
            box-sizing: border-box;
        }

        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
            color: #666;
            font-size: 14px;
            margin-bottom: 22px;
        }

        .back-btn:hover {
            color: #4A90E2;
        }

        .detail-card,
        .feedback-card {
            position: relative;
            background: #fff;
            border: 1px solid #e9eef2;
            border-radius: 18px;
            padding: 36px 42px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            overflow: hidden;
            box-sizing: border-box;
        }

        .detail-card::before,
        .feedback-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 32px;
            bottom: 32px;
            width: 4px;
            border-radius: 0 999px 999px 0;
            background: linear-gradient(180deg, #4A90E2, #55DDBF);
        }

        .detail-card > *,
        .feedback-card > * {
            position: relative;
            z-index: 1;
        }

        .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            border-bottom: 1px solid #eef0f2;
            padding-bottom: 22px;
            margin-bottom: 26px;
        }

        .detail-title {
            margin: 0 0 12px;
            color: #111;
            font-size: 30px;
            line-height: 1.25;
            letter-spacing: -0.04em;
        }

        .detail-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            color: #777;
            font-size: 13px;
        }

        .meta-pill {
            display: inline-flex;
            align-items: center;
            height: 24px;
            padding: 0 10px;
            border-radius: 999px;
            background: #f8fafc;
            border: 1px solid #eef0f2;
            color: #666;
            font-size: 12px;
            font-weight: 700;
        }

        .action-row {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
        }

        .action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 34px;
            padding: 0 13px;
            border-radius: 999px;
            border: 1px solid #dde3ea;
            background: #fff;
            color: #555;
            font-size: 13px;
            font-weight: 800;
            text-decoration: none;
            cursor: pointer;
            font-family: inherit;
            white-space: nowrap;
        }

        .action-btn:hover {
            background: #f8fafc;
        }

        .list-btn {
            color: #4A90E2;
            border-color: #dcebf8;
            background: #f7fbff;
        }

        .list-btn:hover {
            background: #eef7ff;
        }

        .edit-btn {
            color: #4A90E2;
            border-color: #dcebf8;
            background: #f7fbff;
        }

        .edit-btn:hover {
            background: #eef7ff;
        }

        .delete-btn {
            color: #dc3545;
            border-color: #ffd1d6;
        }

        .delete-btn:hover {
            background: #fff5f5;
        }

        .section {
            margin-bottom: 24px;
        }

        .section-title {
            margin: 0 0 10px;
            color: #4A90E2;
            font-size: 15px;
            font-weight: 900;
            letter-spacing: -0.02em;
        }

        .content-box {
            background: #fafbfc;
            border: 1px solid #eef0f2;
            border-radius: 14px;
            padding: 18px;
            min-height: 48px;
            white-space: pre-line;
            color: #444;
            line-height: 1.65;
            font-size: 14px;
        }

        
        .image-preview-grid {
            display:grid;
            grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));
            gap:10px;
            margin:12px 0 16px;
        }

        .image-preview-link {
            display:block;
            aspect-ratio:4 / 3;
            border-radius:12px;
            overflow:hidden;
            border:1px solid #eef0f2;
            background:#f3f6f9;
        }

        .image-preview-link img {
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
            transition:transform .18s ease;
        }

        .image-preview-link:hover img {
            transform:scale(1.04);
        }

        .file-section {
            background: #fafbfc;
            border: 1px solid #eef0f2;
            border-radius: 14px;
            padding: 18px;
            margin-top: 28px;
        }

        .file-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
        }

        .file-link {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 11px 13px;
            border-radius: 12px;
            background: #fff;
            border: 1px solid #eef0f2;
            text-decoration: none;
            color: #333;
            font-size: 14px;
        }

        .file-link:hover {
            border-color: #dcebf8;
            color: #4A90E2;
        }

        .file-size {
            color: #999;
            font-size: 12px;
            white-space: nowrap;
        }

        .feedback-card {
            margin-top: 22px;
        }

        .feedback-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            margin-bottom: 18px;
        }

        .feedback-header h3 {
            margin: 0;
            font-size: 19px;
            color: #111;
            letter-spacing: -0.03em;
        }

        .feedback-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 24px;
            padding: 0 8px;
            border-radius: 999px;
            background: #EAF4FF;
            color: #4A90E2;
            font-size: 12px;
            font-weight: 900;
        }

        .feedback-form {
            display: grid;
            grid-template-columns: 1fr 78px;
            gap: 10px;
            align-items: stretch;
            margin-bottom: 20px;
        }

        .feedback-form textarea {
            width: 100%;
            height: 76px;
            min-height: 76px;
            max-height: 76px;
            resize: none;
            border: 1px solid #dbe3ea;
            border-radius: 13px;
            padding: 12px 14px;
            font-size: 14px;
            font-family: inherit;
            line-height: 1.55;
            box-sizing: border-box;
            overflow-y: auto;
            background: #fff;
        }

        .feedback-form textarea:focus {
            outline: none;
            border-color: #55DDBF;
            box-shadow: 0 0 0 3px rgba(85,221,191,0.12);
        }

        .feedback-submit {
            width: 78px;
            height: 76px;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #4A90E2 0%, #39CDB5 100%);
            color: #fff;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 5px 12px rgba(57,205,181,0.16);
        }

        .feedback-submit:hover {
            filter: brightness(0.98);
            transform: translateY(-1px);
        }

        .feedback-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .feedback-item {
            background: #fafbfc;
            border: 1px solid #eef0f2;
            border-radius: 14px;
            padding: 14px 16px;
        }

        .feedback-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .feedback-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 7px;
            color: #777;
            font-size: 12px;
            font-weight: 700;
        }

        .feedback-content {
            white-space: pre-line;
            line-height: 1.6;
            color: #444;
            font-size: 14px;
        }

        .reply-delete-btn {
            border: none;
            background: #fff5f5;
            color: #ff4d4d;
            border-radius: 999px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
        }

        .empty-feedback {
            border: 1px dashed #dce3ea;
            border-radius: 14px;
            padding: 22px 14px;
            text-align: center;
            color: #999;
            background: #fafbfc;
            font-size: 13px;
        }

        @media(max-width: 760px) {
            .detail-container {
                padding: 0 16px;
            }

            .detail-card,
            .feedback-card {
                padding: 30px 24px;
            }

            .detail-header {
                flex-direction: column;
            }

            .action-row {
                width: 100%;
            }

            .action-btn {
                flex: 1;
            }

            .feedback-form {
                grid-template-columns: 1fr;
            }

            .feedback-form textarea {
                height: 92px;
                min-height: 92px;
                max-height: 92px;
            }

            .feedback-submit {
                width: 100%;
                height: 42px;
                border-radius: 999px;
            }
        }
    
        .detail-top-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 22px;
        }

        .detail-top-nav .back-btn {
            margin-bottom: 0;
        }

        .top-list-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 34px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid #dcebf8;
            background: #f7fbff;
            color: #4A90E2;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
            white-space: nowrap;
        }

        .top-list-btn:hover {
            background: #eef7ff;
        }

</style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="detail-container">
        <div class="detail-top-nav">
            <a href="#" class="back-btn" onclick="goBackSmart(); return false;">⬅ 뒤로가기</a>
            <a href="/project/note/list?wsId=${wsId}&projId=${projId}" class="top-list-btn">노트 목록</a>
        </div>

        <section class="detail-card">
            <div class="detail-header">
                <div>
                    <h2 class="detail-title">${note.noteTitle}</h2>
                    <div class="detail-meta">
                        <span class="meta-pill">작성자 ${note.userName}</span>
                        <span class="meta-pill"><fmt:formatDate value="${note.regDt}" pattern="yyyy년 MM월 dd일 HH:mm"/></span>
                    </div>
                </div>

                <div class="action-row">
                    <c:if test="${canEdit}">
                        <a class="action-btn edit-btn" href="/project/note/edit?noteId=${note.noteId}&wsId=${wsId}&projId=${projId}">수정</a>
                    </c:if>
                    <c:if test="${canDelete}">
                        <form action="/project/note/delete" method="post" onsubmit="return confirm('이 노트를 삭제할까요?');">
                            <input type="hidden" name="noteId" value="${note.noteId}">
                            <input type="hidden" name="wsId" value="${wsId}">
                            <input type="hidden" name="projId" value="${projId}">
                            <button type="submit" class="action-btn delete-btn">삭제</button>
                        </form>
                    </c:if>
                </div>
            </div>

            <c:if test="${not empty note.memo}">
                <div class="section">
                    <h3 class="section-title">메모</h3>
                    <div class="content-box">${note.memo}</div>
                </div>
            </c:if>

            <c:if test="${not empty note.fileList}">
                <div class="file-section">
                    <h3 class="section-title">첨부파일</h3>
                    
                    <div class="image-preview-grid">
                        <c:forEach var="file" items="${note.fileList}">
                            <c:if test="${file.fileExt eq 'jpg' or file.fileExt eq 'jpeg' or file.fileExt eq 'png' or file.fileExt eq 'gif' or file.fileExt eq 'webp' or file.fileExt eq 'JPG' or file.fileExt eq 'JPEG' or file.fileExt eq 'PNG' or file.fileExt eq 'GIF' or file.fileExt eq 'WEBP'}">
                                <a class="image-preview-link" href="/project/note/view?fileId=${file.fileId}" target="_blank">
                                    <img src="/project/note/view?fileId=${file.fileId}" alt="${file.originFileName}">
                                </a>
                            </c:if>
                        </c:forEach>
                    </div>

                    <div class="file-list">
                        <c:forEach var="file" items="${note.fileList}">
                            <a class="file-link" href="/project/note/download?fileId=${file.fileId}">
                                <span>📎 ${file.originFileName}</span>
                                <span class="file-size">${file.fileSize} bytes</span>
                            </a>
                        </c:forEach>
                    </div>
                </div>
            </c:if>
        </section>

        <section class="feedback-card">
            <div class="feedback-header">
                <h3>💬 피드백</h3>
                <span class="feedback-count">${empty replyList ? 0 : replyList.size()}</span>
            </div>

            <form class="feedback-form" action="/project/note/reply/add" method="post">
                <input type="hidden" name="noteId" value="${note.noteId}">
                <input type="hidden" name="wsId" value="${wsId}">
                <input type="hidden" name="projId" value="${projId}">
                <textarea name="replyContent" placeholder="확인한 메모이나 의견을 남겨주세요." required></textarea>
                <button type="submit" class="feedback-submit">등록</button>
            </form>

            <div class="feedback-list">
                <c:choose>
                    <c:when test="${not empty replyList}">
                        <c:forEach var="reply" items="${replyList}">
                            <div class="feedback-item">
                                <div class="feedback-top">
                                    <div class="feedback-meta">
                                        <span>${reply.userName}</span>
                                        <span><fmt:formatDate value="${reply.regDt}" pattern="yyyy-MM-dd HH:mm"/></span>
                                    </div>

                                    <form action="/project/note/reply/delete" method="post" onsubmit="return confirm('피드백을 삭제할까요?');">
                                        <input type="hidden" name="replyId" value="${reply.replyId}">
                                        <input type="hidden" name="noteId" value="${note.noteId}">
                                        <input type="hidden" name="wsId" value="${wsId}">
                                        <input type="hidden" name="projId" value="${projId}">
                                        <button type="submit" class="reply-delete-btn">삭제</button>
                                    </form>
                                </div>
                                <div class="feedback-content">${reply.replyContent}</div>
                            </div>
                        </c:forEach>
                    </c:when>

                    <c:otherwise>
                        <div class="empty-feedback">아직 피드백이 없습니다. 확인한 메모이나 의견을 남겨보세요.</div>
                    </c:otherwise>
                </c:choose>
            </div>
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
    </script>


    <c:if test="${param.authError eq 'edit'}">
        <script>alert('노트 수정은 작성자만 할 수 있습니다.');</script>
    </c:if>
    <c:if test="${param.authError eq 'delete'}">
        <script>alert('이 노트를 삭제할 권한이 없습니다.');</script>
    </c:if>
    <c:if test="${param.authError eq 'file'}">
        <script>alert('첨부파일 수정은 노트 작성자만 할 수 있습니다.');</script>
    </c:if>
</body>
</html>
