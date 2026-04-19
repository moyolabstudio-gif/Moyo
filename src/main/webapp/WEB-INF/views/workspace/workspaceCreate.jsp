<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>새 워크스페이스 생성</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
<div class="container">
    <h2>새 팀(워크스페이스) 만들기</h2>
    <div class="form-group">
        <label>팀 이름</label>
        <input type="text" id="wsName" class="form-control" placeholder="예: 무적의 404MUSIC팀">
    </div>
    <button id="btnWsSubmit" class="btn btn-primary">워크스페이스 생성</button>
</div>

<script>
$('#btnWsSubmit').on('click', function() {
    const wsData = {
        wsName: $('#wsName').val()
    };

    $.ajax({
        url: '/workspace/api/create',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(wsData),
        success: function(res) {
            alert("팀이 생성되었습니다!");
            // 생성된 워크스페이스 ID를 가지고 프로젝트 생성 페이지로 이동
            location.href = "/project/create?wsId=" + res.wsId;
        },
        error: function(err) {
            alert("생성 실패: " + err.responseText);
        }
    });
});
</script>
</body>
</html>