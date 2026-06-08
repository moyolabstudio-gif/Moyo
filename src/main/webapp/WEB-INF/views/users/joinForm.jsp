<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>회원가입 - MOYO</title>
    <style>
        body { font-family: 'Pretendard', sans-serif; background-color: #f4f7f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .join-card { 
            background: white; padding: 40px; border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 400px; 
        }
        h2 { text-align: center; color: #333; margin-bottom: 30px; }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; margin-bottom: 8px; color: #666; font-size: 14px; }
        .input-group input { 
            width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; 
            box-sizing: border-box; font-size: 16px;
        }
        .btn-submit { 
            width: 100%; padding: 14px; background: #4A90E2; color: white; 
            border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;
            transition: background 0.3s;
        }
        .btn-submit:hover { background: #357ABD; }
    </style>
</head>
<body>

<div class="join-card">
    <h2>회원가입</h2>
    <form action="/users/join" method="post">
        <div class="input-group">
            <label>이메일</label>
            <input type="email" name="email" required placeholder="example@moyo.com">
        </div>
        <div class="input-group">
            <label>비밀번호</label>
            <input type="password" name="pwdHash" required placeholder="비밀번호를 입력하세요">
        </div>
        <button type="submit" class="btn-submit">가입하기</button>
    </form>
</div>

</body>
</html>