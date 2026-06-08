<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>시스템 관리자 대시보드</title>
<style>
    /* 기본 설정 */
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f7f6; padding: 20px; color: #333; }
    .admin-container { max-width: 1000px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    h2 { border-left: 5px solid #4A90E2; padding-left: 15px; margin-bottom: 25px; }
    
    /* 통계 카드 */
    .stats-cards { margin-bottom: 30px; }
    .card { background: #4A90E2; color: white; padding: 15px 20px; border-radius: 8px; font-weight: 600; display: inline-block; }

    /* 테이블 스타일 */
    .admin-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .admin-table th { background: #f8f9fa; color: #555; text-align: left; padding: 12px; border-bottom: 2px solid #e1e8ed; }
    .admin-table td { padding: 12px; border-bottom: 1px solid #eee; }
    
    /* 버튼 스타일 */
    button { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #fff; font-size: 12px; transition: 0.2s; }
    button:hover { background: #f1f1f1; border-color: #bbb; }
    button.btn-primary { background: #4A90E2; color: white; border: none; }
    button.btn-danger { color: #d9534f; border-color: #d9534f; }

    /* 상세 섹션 */
    .admin-detail { margin-top: 40px; padding: 25px; border: 1px solid #e1e8ed; border-radius: 12px; background: #fafafa; }
    .detail-grid { display: flex; gap: 20px; }
    .detail-left { flex: 1; padding: 20px; background: #fff; border: 1px solid #eee; border-radius: 8px; }
    .detail-right { flex: 2; padding: 20px; background: #fff; border: 1px solid #eee; border-radius: 8px; }
    
    /* 상태 뱃지 */
    .status-OPEN { color: #28a745; font-weight: bold; }
    .status-CLOSED { color: #6c757d; }
</style>
</head>
<body>
<header>
    <%@ include file="../common/header.jsp"%>
</header>

<div class="admin-container">
    <h2>⚙ 시스템 관리자 대시보드</h2>
    
    <div class="stats-cards">
        <div class="card">총 사용자: ${userList.size()}명</div>
    </div>

    <table class="admin-table">
        <thead>
            <tr>
                <th>ID</th><th>이메일</th><th>이름</th><th>권한</th><th>상태</th><th>관리</th>
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
                        <button class="btn-danger" onclick="deleteUser('${u.EMAIL}')">차단</button>
                        <button class="btn-primary" onclick="showUserDetail('${u.USER_ID}', '${u.USER_NAME}', '${u.EMAIL}')">상세보기</button>
                    </td>
                </tr>
            </c:forEach>
        </tbody>
    </table>
    
    <div id="detail-section" class="admin-detail" style="display:none;">
        <h3 id="detail-title">사용자 상세 정보</h3>
        <div class="detail-grid">
            <div class="detail-left">
                <h4>기본 정보</h4>
                <p><strong>이름:</strong> <span id="detail-name"></span></p>
                <p><strong>이메일:</strong> <span id="detail-email"></span></p>
            </div>
            <div class="detail-right">
                <h4>상담 이력</h4>
                <div id="cs-history-list"></div>
            </div>
        </div>
    </div>
</div>

<footer>
    <%@ include file="../common/footer.jsp"%>
</footer>


<script>
function showUserDetail(userId, userName, email) {
    const detailSection = document.getElementById('detail-section');
    detailSection.style.display = 'block';
    document.getElementById('detail-title').innerText = "관리 대상: " + userName;
    document.getElementById('detail-name').innerText = userName;
    document.getElementById('detail-email').innerText = email;

    fetch('/admin/getCsHistory?userId=' + userId)
        .then(res => res.json())
        .then(data => {
            const listDiv = document.getElementById('cs-history-list');
            if (data.length === 0) {
                listDiv.innerHTML = "<p style='color:#999;'>등록된 상담 기록이 없습니다.</p>";
            } else {
                let html = '<table class="admin-table">';
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
            detailSection.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(err => console.error("로드 실패:", err));
}
</script>
</body>
</html>