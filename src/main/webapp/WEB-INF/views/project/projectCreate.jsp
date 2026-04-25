<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>새 프로젝트 생성</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <style>
        .container { margin-top: 50px; max-width: 600px; }
        .form-group { margin-bottom: 15px; }
        .form-control { width: 100%; padding: 8px; box-sizing: border-box; }
        .btn { padding: 10px 20px; cursor: pointer; }
    </style>
</head>
<body>
<div class="container">
    <h2>새 프로젝트 생성</h2>
    <div class="form-group">
        <label>프로젝트 명</label>
        <input type="text" id="projName" class="form-control" placeholder="예: 404MUSIC 개발팀">
    </div>
    <div class="form-group">
        <label>프로젝트 설명</label>
        <textarea id="projDesc" class="form-control" placeholder="프로젝트에 대한 간단한 설명을 적어주세요."></textarea>
    </div>
    <button id="btnSubmit" class="btn btn-primary">프로젝트 생성하기</button>
</div>

<script>
	// 서버 세션이나 URL에서 wsId를 가져옵니다.
	const currentWsId = "${sessionScope.currentWsId}"; // 세션에 저장된 경우

	$('#btnSubmit').on('click', function() {
	    const projectData = {
	        projName: $('#projName').val(),
	        projDesc: $('#projDesc').val(),
	        wsId: currentWsId // 어떤 워크스페이스 소속인지 명시!
	    };

    $.ajax({
        url: '/project/api/create', // 우리가 만들 컨트롤러 주소
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(projectData),
        success: function(res) {
            alert("프로젝트가 생성되었습니다!");
            location.href = "/calendar"; // 생성 후 달력으로 이동
        },
        error: function(err) {
            alert("생성 실패: " + err.responseText);
        }
    });
});
</script>

