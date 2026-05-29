<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MOYO - 새 프로젝트 생성</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        body { background-color: #f4f7f9; font-family: 'Pretendard', sans-serif; }
        .container { max-width: 600px; margin: 50px auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .form-group { margin-bottom: 20px; }
        .form-control { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
        
        #memberList { border: 1px solid #ddd; padding: 10px; height: 250px; overflow-y: auto; border-radius: 6px; background: #fafafa; }
        .member-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; background: #fff; margin-bottom: 5px; border-radius: 4px; }
        .member-left { display: flex; align-items: center; gap: 10px; }
        .member-name { font-size: 14px; color: #222; }
        .leader-label { font-size: 12px; color: #3788d8; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; }
        
        .btn-submit { width: 100%; padding: 15px; background: #3788d8; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .btn-submit:hover { background: #2874bd; }
    </style>
</head>
<body>

<header><jsp:include page="/WEB-INF/views/common/header.jsp" /></header>

<div class="container">
    <h2 style="margin-top:0;">새 프로젝트 생성</h2>
    
    <div class="form-group">
        <label><b>프로젝트 명</b></label>
        <input type="text" id="projName" class="form-control" placeholder="프로젝트 이름을 입력하세요">
    </div>

    <div class="form-group">
        <label><b>프로젝트 유형</b></label>
        <select id="projType" class="form-control">
            <option value="EVENT">행사/이벤트</option>
            <option value="TASK">업무 프로젝트</option>
            <option value="RESEARCH">연구/조사</option>
        </select>
    </div>

    <div class="form-group">
        <label><b>멤버 및 팀장 선택</b></label>
        <div id="memberList">불러오는 중...</div>
    </div>
	<div class="form-group">
	    <label><b>프로젝트 기간</b></label>
	    <div style="display:flex; gap:10px;">
	        <input type="date" id="startDate" class="form-control">
	        <input type="date" id="endDate" class="form-control">
	    </div>
	</div>
    <div class="form-group">
        <label><b>프로젝트 설명</b></label>
        <textarea id="projDesc" class="form-control" rows="4" placeholder="프로젝트 설명을 적어주세요."></textarea>
    </div>

    <button id="btnSubmit" class="btn-submit">프로젝트 생성하기</button>
</div>

<script>
    const currentWsId = "${sessionScope.currentWsId}";

    $(document).ready(function() {
        $.ajax({
            url: '${pageContext.request.contextPath}/workspace/api/members',
            type: 'GET',
            data: { wsId: currentWsId },
            success: function(members) {
                let html = '';
                if(members.length === 0) html = '<p style="padding:10px;">참여 가능한 멤버가 없습니다.</p>';
                else {
                    members.forEach(m => {
                        const uId = m.USER_ID || m.user_id;
                        const uName = m.USER_NAME || m.user_name;
						html += '<div class="member-item">'
												      +     '<div class="member-left">'
												      +         '<input type="checkbox" name="member" value="' + uId + '">'
												      +         '<span class="member-name">' + uName + '</span>'
												      +     '</div>'

												      +     '<label class="leader-label">'
												      +         '<input type="radio" name="leaderId" value="' + uId + '">'
												      +         '팀장 지정'
												      +     '</label>'
												      + '</div>';
                    });
                }
                $('#memberList').html(html);
            },
            error: () => $('#memberList').html('<p style="color:red; padding:10px;">불러오기 실패</p>')
        });
    });

    $('#btnSubmit').on('click', function() {
        const selectedMembers = $('input[name="member"]:checked').map(function() { return $(this).val(); }).get();
        const selectedLeader = $('input[name="leaderId"]:checked').val();

        if(!$('#projName').val()) { alert("프로젝트 이름을 입력하세요."); return; }
        if(!selectedLeader) { alert("팀장을 선택해주세요."); return; }

        const projectData = {
            projName: $('#projName').val(),
            projDesc: $('#projDesc').val(),
            projType: $('#projType').val(),
            leaderId: selectedLeader,
            wsId: currentWsId,
            memberIds: selectedMembers,
			startDate: $('#startDate').val(),
			endDate: $('#endDate').val()
        };

        $.ajax({
            url: '${pageContext.request.contextPath}/project/api/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(projectData),
            success: function(res) {
                if(res.status === "success") {
                    alert("프로젝트가 생성되었습니다!");
                    location.href = "${pageContext.request.contextPath}/calendar";
                } else {
                    alert("생성 실패: " + (res.message || "알 수 없는 오류"));
                }
            },
            error: function(err) {
                alert("통신 오류가 발생했습니다.");
            }
        });
    });
</script>

</body>
</html>