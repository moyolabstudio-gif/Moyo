<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>공지사항 작성</title>
    <style>
        .write-container { max-width: 800px; margin: 120px auto 50px; padding: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 800; color: #344054; }
        input[type="text"], textarea { 
            width: 100%; padding: 15px; border: 1px solid #e9eef4; 
            border-radius: 12px; box-sizing: border-box; font-size: 14px;
        }
        textarea { height: 300px; resize: none; }
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
    <h2>공지사항 작성</h2>
    <form action="/admin/notice/save" method="post">
        <div class="form-group">
            <label>제목</label>
            <input type="text" name="title" placeholder="제목을 입력하세요" required>
        </div>
        
        <div class="form-group">
            <label>내용</label>
            <textarea name="content" placeholder="공지 내용을 입력하세요" required></textarea>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" name="isPinned" value="Y"> 상단 고정 여부
            </label>
            <label>
                <input type="checkbox" name="isPush" value="Y" checked> 
                사용자에게 알림 보내기
            </label>
        </div>
        
        <button type="submit" class="btn-submit">공지 등록하기</button>
    </form>
</div>

</body>
</html>