<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>프로필 설정 - MOYO</title>
    <style>
        body { font-family: 'Pretendard', sans-serif; background-color: #f4f7f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .setup-card { 
            background: white; padding: 40px; border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 450px; 
        }
        h2 { color: #333; margin-bottom: 10px; }
        .sub-text { color: #888; font-size: 14px; margin-bottom: 30px; }
        
        .input-group { margin-bottom: 25px; }
        .input-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #444; }
        .input-group input { 
            width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; 
            box-sizing: border-box; font-size: 16px;
        }
        
        .benefit-box { 
            background: #f8fbff; border: 1px solid #d1e3ff; padding: 15px; 
            border-radius: 8px; margin-bottom: 25px; font-size: 14px; color: #4A90E2; 
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

<div class="setup-card">
    <h2>거의 다 왔어요!</h2>
    <p class="sub-text">팀원들에게 보여질 닉네임을 설정해주세요.</p>
    
    <form action="/users/completeJoin" method="post">
        <input type="hidden" name="status" value="ACTIVE">
        
        <div class="input-group">
            <label>닉네임</label>
            <input type="text" name="userName" required placeholder="예: MOYO 관리자">
        </div>
        
        <div class="benefit-box">
            <strong>🎁 MOYO 가입 환영 혜택</strong><br>
            지금 가입하시면 프로 플랜을 1개월 무료로 체험하실 수 있습니다!
        </div>
        
        <button type="submit" class="btn-submit">MOYO 시작하기</button>
    </form>
</div>

</body>
</html>