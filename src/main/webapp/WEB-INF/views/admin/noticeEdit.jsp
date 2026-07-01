<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>공지사항 수정</title>
    <link rel="stylesheet" href="/css/moyoUi.css?v=moyo-ui-scope-20260617">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonRichContent.css?v=rich-content-v3">
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/ckeditor.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/super-build/translations/ko.js"></script>
    <script src="/js/commonCkeditor.js?v=moyo-editor-v1"></script>

    <style>
        .write-container { max-width: 800px; margin: 120px auto 50px; padding: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 800; color: #344054; }
        input[type="text"] { 
            width: 100%; padding: 15px; border: 1px solid #e9eef4; 
            border-radius: 12px; box-sizing: border-box; font-size: 14px;
        }
        /* 에디터가 적용될 공간을 위해 스타일 조정 */
        .ck-editor__editable { min-height: 300px; }
        
        .btn-submit { 
            background: #2878d0; color: #fff; padding: 15px 30px; 
            border: none; border-radius: 12px; font-weight: 900; cursor: pointer;
            float: right; transition: background 0.2s;
        }
        .btn-submit:hover { background: #1f65b5; }
    </style>
</head>
<body>

<header>
    <%@ include file="../common/header.jsp"%>
</header>

<div class="write-container">
    <h2>공지사항 수정</h2>

<form action="/admin/notice/noticeUpdate" method="post">
    
    <input type="hidden" name="noticeId" value="${notice.noticeId}">
    
    <div class="form-group">
        <label>제목</label>
        <input type="text" name="title" value="${notice.title}" required>
    </div>
    
    <div class="form-group">
        <label>내용</label>
        <textarea id="memo" name="content">${notice.content}</textarea>
    </div>
    
    <div class="form-group">
        <label>
            <input type="checkbox" name="isPinned" value="Y" 
            <c:if test="${notice.isPinned eq 'Y'}">checked</c:if>> 상단 고정 여부
        </label>
    </div>
    
    <button type="submit" class="btn-submit">공지 수정하기</button>
</form>
</div>
<script>
    document.addEventListener("DOMContentLoaded", function() {
        MoyoCkeditor.create('#memo', {
            uploadUrl: '/admin/notice/image-upload'
        }).then(editor => {
            // 서버에서 넘어온 기존 데이터를 에디터에 로드
            const existingContent = `${notice.content}`; 
            editor.setData(existingContent);
        }).catch(error => {
            console.error('에디터 초기화 실패:', error);
        });
    });
</script>
</body>
</html>