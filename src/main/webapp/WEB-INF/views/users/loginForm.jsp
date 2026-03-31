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
<form action="/users/login" method="post">
	<table border=1>
		<tr>
			<td>
				이메일
			</td>
			<td>
				<input type = "email" name="email">
			</td>
		</tr>
		<tr>
			<td>
				비밀번호
			</td>
			<td>
				<input type="password" name="pwdHash">
			</td>
		</tr>
		<tr>
			<td>
				<input type="submit"value="로그인">
			</td>
		</tr>
	</table>
</form>
</main>
<footer>
</footer>
</body>
</html>