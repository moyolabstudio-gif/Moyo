<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>회원가입</title>
</head>
<body>
<header>
</header>
<main>
<form action="/users/completeJoin" method="post">
	<input type="hidden" name="status" value="ACTIVE">
	<table border=1>
		<tr>
			<td>
				닉네임
			</td>
			<td>
				<input type = "text" name="userName" placeholder="사용하실 이름을 작성해주세요">
			</td>
		</tr>
	</table>
	<div>
		구독 플랜 광고 + 가입 무료 혜택 설명...
	</div>
	<input type="submit"value="가입하기">
</form>
</main>
<footer>
</footer>
</body>
</html>