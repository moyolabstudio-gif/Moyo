<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>마이페이지 - MOYO</title>
<style>
    /* 전체 레이아웃 설정 */
    .mypage-container {
        display: flex;
        max-width: 1200px;
        margin: 30px auto;
        min-height: 500px;
        border: 1px solid #eee;
        border-radius: 10px;
        overflow: hidden;
        background-color: #fff;
    }

    /* 좌측 사이드바 스타일 */
    .sidebar {
        width: 250px;
        background-color: #f9f9f9;
        border-right: 1px solid #eee;
        padding: 20px 0;
    }

    .sidebar h3 {
        padding: 0 25px;
        color: #333;
        margin-bottom: 20px;
    }

    .sidebar ul {
        list-style: none;
        padding: 0;
    }

    .sidebar li button {
        width: 100%;
        padding: 15px 25px;
        text-align: left;
        border: none;
        background: none;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        transition: 0.3s;
    }

    .sidebar li button:hover {
        background-color: #4A90E2;
        color: white;
    }

    /* 우측 콘텐츠 영역 스타일 */
    .content-area {
        flex: 1;
        padding: 40px;
    }

    .section-title {
        border-bottom: 2px solid #4A90E2;
        padding-bottom: 10px;
        margin-bottom: 25px;
    }

    input[type="text"] {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 10px;
        width: 300px;
    }

    .save-btn {
        background-color: #4A90E2;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
    }
</style>
</head>
<body>

<header>
    <%@ include file="../common/header.jsp"%>
</header>

<div class="mypage-container">
    <div class="sidebar">
        <h3>${sessionScope.user.userName} 님</h3>
        <ul>
            <li><button onclick="changeTab('profile')">프로필 관리</button></li>
            <li><button onclick="changeTab('account')">계정 정보</button></li>
            <li><button onclick="changeTab('workspace')">워크스페이스 목록</button></li>
            <li><button onclick="changeTab('activity')">활동 기록</button></li>
            
            <!-- 관리자일 때만 보이는 메뉴 -->
            <c:if test="${sessionScope.user.userRole eq 'ADMIN'}">
                <li style="margin-top: 20px; border-top: 1px solid #ddd;">
                    <button onclick="location.href='/admin/main'" style="color: #d9534f; font-weight: bold;">
                        ⚙ 관리자 페이지
                    </button>
                </li>
            </c:if>
        </ul>
    </div>

    <div class="content-area" id="content-area">
        
        <div id="profile-section">
            <h2 class="section-title">프로필 관리</h2>
            <p>닉네임: <br>
                <!-- id 추가!! -->
                <input type="text" id="userNameInput" value="${sessionScope.user.userName}">
            </p>
            <p>한 줄 소개: <br>
                <input type="text" id="userIntroInput" placeholder="소개를 입력해주세요.">
            </p>
            <button class="save-btn" onclick="updateProfile()">저장하기</button>
        </div>

        <div id="account-section" style="display:none;">
            <h2 class="section-title">계정 정보</h2>
            <p>이메일: <strong>${sessionScope.user["EMAIL"]}</strong></p>
            <p>가입 상태: ${sessionScope.user.status}</p>
            <button class="save-btn" style="background-color: #666;">비밀번호 변경</button>
        </div>

        <div id="workspace-section" style="display:none;">
            <h2 class="section-title">워크스페이스 목록</h2>
            <ul id="workspace-list" style="list-style: none; padding: 0;">
                <c:choose>
                    <c:when test="${not empty wsList}">
                        <c:forEach var="ws" items="${wsList}">
                            <li style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                                <span><strong>${ws.wsName}</strong> (ID: ${ws.wsId})</span>
                                <a href="/workspace/detail?wsId=${ws.wsId}" style="color: #4A90E2; text-decoration: none; font-size: 14px;">입장하기</a>
                            </li>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <li>참여 중인 워크스페이스가 없습니다.</li>
                    </c:otherwise>
                </c:choose>
            </ul>
        </div>

        <div id="activity-section" style="display:none;">
            <h2 class="section-title">활동 기록</h2>
            <p>최근 활동 내역이 없습니다.</p>
        </div>

    </div>
</div>

<footer>
    <%@ include file="../common/footer.jsp"%>
</footer>


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
    
    function updateProfile() {
        const nameElement = document.getElementById('userNameInput');
        if (!nameElement) return; // 안전장치

        const newName = nameElement.value;
        
        if(!newName.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        fetch('/users/updateProfile', { // 컨트롤러 맵핑 경로 확인!
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userName: newName,
                email: "${sessionScope.user.EMAIL}" // 업데이트 기준값
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'success') { // 컨트롤러 결과 키값 확인 (success 또는 status)
                alert("프로필이 수정되었습니다.");
                location.reload();
            } else {
                alert("수정에 실패했습니다.");
            }
        }) 
        .catch(err => console.error("Error:", err));
    }
</script>

</body>
</html>