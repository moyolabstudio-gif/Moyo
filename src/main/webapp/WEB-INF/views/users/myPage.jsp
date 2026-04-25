<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>마이페이지</title>
</head>
<header>
	<%@ include file="../common/header.jsp"%>
</header>
<body>

<div>
    <div>
        <h3>${userName}님</h3>
        <hr>
        <ul>
            <li><button onclick="changeTab('profile')">프로필 관리</button></li>
            <li><button onclick="changeTab('account')">계정 정보</button></li>
            <li><button onclick="changeTab('workspace')">워크스페이스 목록</button></li>
            <li><button onclick="changeTab('activity')">활동 기록</button></li>
        </ul>
    </div>

    <div id="content-area">
        
        <div id="profile-section">
            <h2>프로필 관리</h2>
            닉네임: <input type="text" value="${userName}"><br>
            한 줄 소개: <input type="text"><br>
            <button>저장</button>
        </div>

        <div id="account-section" style="display:none;">
            <h2>계정 정보</h2>
            이메일: ${userEmail}<br>
            <button>비밀번호 변경</button>
        </div>

        <div id="workspace-section" style="display:none;">
            <h2>워크스페이스 목록</h2>
            <ul id="workspace-list">
                <li>기본 프로젝트</li>
            </ul>
        </div>

        <div id="activity-section" style="display:none;">
            <h2>활동 기록</h2>
            <p>활동 내역이 여기에 표시됩니다.</p>
        </div>

    </div>
</div>

<script>
    function changeTab(tabName) {
        // 모든 섹션 숨기기
        document.getElementById('profile-section').style.display = 'none';
        document.getElementById('account-section').style.display = 'none';
        document.getElementById('workspace-section').style.display = 'none';
        document.getElementById('activity-section').style.display = 'none';

        // 클릭한 섹션만 보여주기
        document.getElementById(tabName + '-section').style.display = 'block';
    }
</script>


</body>
</html>