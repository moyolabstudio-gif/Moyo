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
    const wsName = $('#wsName').val();
    
    if(!wsName) {
        alert("팀 이름을 입력해주세요!");
        return;
    }

    const wsData = {
        wsName: wsName
    };

    $.ajax({
        url: '/workspace/api/create',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(wsData),
        success: function(res) {
            alert("팀이 생성되었습니다!");
            
            // [수정 포인트] 프로젝트 생성(/project/create)이 아니라 워크스페이스 메인으로!
            // 컨트롤러가 Map에 "wsId"라는 키로 값을 담아 보내주므로 res.wsId를 쓰면 됩니다.
            location.href = "/workspace/main?wsId=" + res.wsId;
        },
        error: function(err) {
            alert("생성 실패: 세션이 만료되었거나 서버 오류가 발생했습니다.");
        }
    });
});
</script>
</body>
</html>