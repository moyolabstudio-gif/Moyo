<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
    <%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>
<div class="admin-container">
    <h2>⚙ 시스템 관리자 대시보드</h2>
    
    <div class="stats-cards">
        <div class="card">총 사용자: ${userList.size()}명</div>
    </div>

    <table class="admin-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>이메일</th>
                <th>이름</th>
                <th>권한</th>
                <th>상태</th>
                <th>관리</th>
            </tr>
        </thead>
        <tbody>
            <c:forEach var="u" items="${userList}">
                <tr>
                    <td>${u.USER_ID}</td>
                    <td>${u.EMAIL}</td>
                    <td>${u.USER_NAME}</td>
                    <td>${u.userRole}</td>
                    <td>${u.status}</td>
                    <td>
                        <button onclick="editUser('${u.EMAIL}')">수정</button>
                        <button onclick="deleteUser('${u.EMAIL}')" style="color:red;">차단</button>
                        <button type="button" onclick="showUserDetail('${u.USER_ID}', '${u.USER_NAME}', '${u.EMAIL}')">
                           상세보기
                        </button>
                    </td>
                </tr>
            </c:forEach>
        </tbody>
    </table>
    <!-- 기존 테이블 끝나는 지점 아래에 추가 -->
    <hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;">
    
    <div id="detail-section" class="admin-detail" style="display:none;">
        <h3 id="detail-title">사용자 상세 정보 및 상담 기록</h3>
        
        <div style="display: flex; gap: 20px;">
            <!-- 왼쪽: 기본 정보 요약 -->
            <div style="flex: 1; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                <h4>기본 정보</h4>
                <p><strong>이름:</strong> <span id="detail-name"></span></p>
                <p><strong>이메일:</strong> <span id="detail-email"></span></p>
            </div>
    
            <!-- 오른쪽: 상담 기록 리스트 -->
            <div style="flex: 2; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h4>상담 이력</h4>
                <div id="cs-history-list">
                    <!-- 상담 데이터가 여기에 그려짐 -->
                </div>
            </div>
        </div>
    </div>
</div>
</body>
<script>
function showUserDetail(userId, userName, email) {
    // 1. 하단 섹션 보이게 설정
    const detailSection = document.getElementById('detail-section');
    detailSection.style.display = 'block';

    // 2. 기본 정보 채우기
    document.getElementById('detail-title').innerText = "관리 대상: " + userName;
    document.getElementById('detail-name').innerText = userName;
    document.getElementById('detail-email').innerText = email;

    // 3. 비동기로 상담 기록 가져오기
    fetch('/admin/getCsHistory?userId=' + userId)
        .then(res => res.json())
        .then(data => {
            const listDiv = document.getElementById('cs-history-list');
            
            if (data.length === 0) {
                listDiv.innerHTML = "<p style='color:#999;'>등록된 상담 기록이 없습니다.</p>";
            } else {
                let html = '<table class="admin-table" style="font-size: 13px;">';
                html += '<thead><tr><th>번호</th><th>상태</th><th>참조키</th></tr></thead><tbody>';
                data.forEach(item => {
                    html += `<tr>
                        <td>${item.csId}</td>
                        <td><span class="status-${item.csStatus}">${item.csStatus}</span></td>
                        <td>${item.extKey}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                listDiv.innerHTML = html;
            }
            
            // 클릭 시 화면을 하단 상세 섹션으로 부드럽게 이동 (선택 사항)
            detailSection.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(err => console.error("데이터 로드 실패:", err));
}
</script>
</html>