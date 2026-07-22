<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>공지사항 수정</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=moyo-ui-scope-20260617">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonRichContent.css?v=rich-content-v3">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/noticeForm.css?v=notice-form-v3">
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    <script src="${pageContext.request.contextPath}/js/commonCkeditor.js?v=moyo-editor-v1"></script>
</head>
<body>

<%@ include file="../common/header.jsp"%>

<main class="notice-form-page">
    <div class="notice-form-shell">
        <section class="notice-form-hero">
            <div class="notice-form-eyebrow">MOYO 안내</div>
            <h1 class="notice-form-title">공지사항 수정</h1>
            <p class="notice-form-subtitle">등록된 공지의 내용과 중요도 설정을 수정하세요.</p>
        </section>

        <form class="notice-form-card" action="${pageContext.request.contextPath}/admin/notice/noticeUpdate" method="post">
            <input type="hidden" name="noticeId" value="${notice.noticeId}">

            <section class="notice-form-section">
                <div class="notice-form-section-head">
                    <div>
                        <h2 class="notice-form-section-title">공지 내용</h2>
                    </div>
                </div>

                <div class="notice-form-field">
                    <label class="notice-form-label" for="noticeTitle">제목<span class="notice-form-required">*</span></label>
                    <input
                        id="noticeTitle"
                        class="notice-form-input"
                        type="text"
                        name="title"
                        value="${notice.title}"
                        placeholder="공지 제목을 입력하세요"
                        maxlength="200"
                        required>
                </div>

                <div class="notice-form-field">
                    <label class="notice-form-label" for="memo">내용<span class="notice-form-required">*</span></label>
                    <textarea id="memo" name="content" required><c:out value="${notice.content}"/></textarea>
                </div>
            </section>

            <section class="notice-form-section">
                <div class="notice-form-settings notice-form-settings-single">
                    <label class="notice-setting-row" for="noticePinned">
                        <span class="notice-setting-copy">
                            <span class="notice-setting-title">상단 고정</span>
                            <span class="notice-setting-desc">중요 공지를 목록 최상단에 고정합니다.</span>
                        </span>
                        <input
                            id="noticePinned"
                            class="notice-setting-check"
                            type="checkbox"
                            name="isPinned"
                            value="Y"
                            <c:if test="${notice.isPinned eq 'Y'}">checked</c:if>>
                        <span class="notice-setting-switch" aria-hidden="true"></span>
                    </label>
                </div>
            </section>

            <div class="notice-form-actions">
                <a class="notice-form-button notice-form-button-secondary" href="${pageContext.request.contextPath}/common/noticeList">목록으로</a>
                <button class="notice-form-button notice-form-button-primary" type="submit">수정 완료</button>
            </div>
        </form>
    </div>
</main>

<%@ include file="../common/footer.jsp"%>

<script>
document.addEventListener('DOMContentLoaded', function () {
    MoyoCkeditor.create('#memo', {
        uploadUrl: '${pageContext.request.contextPath}/admin/notice/image-upload',
        placeholder: '공지 내용을 입력하세요.'
    }).catch(function (error) {
        console.error('에디터 초기화 실패:', error);
    });
});
</script>
</body>
</html>
