<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MOYO - 우리들의 협업 공간</title>
    <style>
        .hero { 
            text-align: center; padding: 100px 20px; 
            background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%); 
        }
        .hero h1 { font-size: 48px; color: #333; margin-bottom: 20px; }
        .hero p { font-size: 18px; color: #666; margin-bottom: 40px; }
        .btn-start { 
            padding: 15px 40px; background: #4A90E2; color: white; 
            border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 18px;
            display: inline-block; transition: background 0.3s;
        }
        .btn-start:hover { background: #357ABD; }
        .btn-logged-in { background: #28a745 !important; }
        .btn-logged-in:hover { background: #218838 !important; }
        
        .features { 
            display: flex; justify-content: center; gap: 50px; 
            padding: 80px 20px; max-width: 1000px; margin: 0 auto; 
        }
        .feature-card { text-align: center; flex: 1; }
        .feature-card h3 { color: #4A90E2; }
    </style>
</head>
<body>
    <header>
        <%@ include file="common/header.jsp"%>
    </header>
    
    <main>
        <section class="hero">
            <h1>함께 만드는 즐거움, MOYO</h1>
            <p>우리 팀의 워크스페이스를 만들고, 일정을 공유하며<br>더 스마트하게 협업을 시작하세요.</p>
            
            <c:choose>
                <%-- 로그인된 상태일 경우 --%>
                <c:when test="${not empty sessionScope.user}">
                    <a href="javascript:void(0);" onclick="checkInvitations()" class="btn-start btn-logged-in">알림 확인하기</a>
                </c:when>
                <%-- 로그인되지 않은 상태일 경우 --%>
                <c:otherwise>
                    <a href="/users/loginForm" class="btn-start">지금 바로 시작하기</a>
                </c:otherwise>
            </c:choose>
        </section>

        <section class="features">
            <div class="feature-card">
                <h3>📅 내 캘린더</h3>
                <p>팀의 복잡한 일정들을 한눈에 확인하고 효율적으로 관리하세요.</p>
            </div>
            <div class="feature-card">
                <h3>👥 그룹 협업</h3>
                <p>워크스페이스를 통해 팀원들과 자유롭게 소통하고 프로젝트를 운영하세요.</p>
            </div>
            <div class="feature-card">
                <h3>🚀 편리한 초대</h3>
                <p>이메일 검색으로 팀원을 손쉽게 초대하고 합류시켜 보세요.</p>
            </div>
        </section>
    </main>
    
    <footer style="text-align: center; padding: 40px; color: #aaa; font-size: 12px; border-top: 1px solid #eee;">
        &copy; 2026 MOYO. All rights reserved.
        
    
        <%@ include file="common/footer.jsp"%>
    
    </footer>

    <script>
        function checkInvitations() {
            // 초대함 페이지로 즉시 이동
            location.href = "/workspace/invitations";
        }
    </script>
</body>
</html>