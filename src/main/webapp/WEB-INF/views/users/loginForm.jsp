<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>로그인 - MOYO</title>
    <style>
        body { 
            background-color: #f4f7f9; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            font-family: 'Pretendard', sans-serif; 
        }
        .login-card { 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
            width: 100%; 
            max-width: 360px;
        }
        .login-card h2 { 
            text-align: center; 
            color: #4A90E2; 
            margin-bottom: 30px; 
            cursor: pointer;
            font-weight: 800;
            letter-spacing: -1px;
        }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 13px; color: #666; margin-bottom: 8px; }
        .input-group input { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid #ddd; 
            border-radius: 10px; 
            font-size: 14px; 
            box-sizing: border-box; 
            transition: 0.3s;
        }
        .input-group input:focus { border-color: #4A90E2; outline: none; }
        .btn-login { 
            width: 100%; 
            padding: 14px; 
            background: #4A90E2; 
            color: white; 
            border: none; 
            border-radius: 10px; 
            font-size: 16px; 
            font-weight: bold; 
            cursor: pointer;
        }
        .btn-login:hover { background: #357ABD; }
        .footer-links { text-align: center; margin-top: 20px; font-size: 13px; color: #888; }
        .footer-links a { color: #4A90E2; text-decoration: none; font-weight: bold; margin: 0 5px; }
        .footer-links .divider { color: #ddd; }
    </style>
</head>
<body>

<div class="login-card">
    <h2 onclick="location.href='/'">MOYO</h2>
    
    <form action="/users/login" method="post">
        <div class="input-group">
            <label>이메일</label>
            <input type="email" name="email" required placeholder="이메일을 입력하세요">
        </div>
        <div class="input-group">
            <label>비밀번호</label>
            <input type="password" name="pwdHash" required placeholder="비밀번호를 입력하세요">
        </div>
        <button type="submit" class="btn-login">로그인</button>
    </form>
    
    <div class="footer-links">
        <a href="/">홈으로</a>
        <span class="divider">|</span>
        <a href="/users/joinForm">회원가입</a>
    </div>
</div>

</body>
</html>