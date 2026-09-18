<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MOYO | 오류</title>
    <style>
        :root{
            --moyo-mint:#59dccf;
            --moyo-blue:#3f78f3;
            --moyo-violet:#7466f0;
            --text:#26324b;
            --muted:#8b95aa;
            --line:#e8edf5;
            --surface:#ffffff;
        }
        *{box-sizing:border-box}
        html,body{margin:0;min-height:100%}
        body{
            min-height:100vh;
            overflow:hidden;
            font-family:Arial,"Noto Sans KR",sans-serif;
            color:var(--text);
            background:
                radial-gradient(circle at 18% 18%, rgba(89,220,207,.13), transparent 28%),
                radial-gradient(circle at 82% 22%, rgba(63,120,243,.11), transparent 30%),
                linear-gradient(180deg,#fbfdff 0%,#f7f9ff 100%);
        }
        .moyo-error{
            min-height:100vh;
            position:relative;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:32px 20px;
            isolation:isolate;
        }
        .moyo-error::before,
        .moyo-error::after{
            content:"";
            position:absolute;
            border-radius:999px;
            filter:blur(2px);
            z-index:-1;
            pointer-events:none;
        }
        .moyo-error::before{
            width:260px;height:260px;
            left:-90px;bottom:-85px;
            background:linear-gradient(135deg,rgba(89,220,207,.22),rgba(116,102,240,.12));
        }
        .moyo-error::after{
            width:230px;height:230px;
            right:-72px;top:-65px;
            background:linear-gradient(135deg,rgba(63,120,243,.16),rgba(116,102,240,.10));
        }
        .moyo-error__card{
            width:min(560px,100%);
            padding:42px 38px 34px;
            background:rgba(255,255,255,.93);
            border:1px solid rgba(227,233,244,.92);
            border-radius:28px;
            box-shadow:0 28px 70px rgba(42,57,92,.12);
            text-align:center;
            position:relative;
            overflow:hidden;
        }
        .moyo-error__card::before{
            content:"";
            position:absolute;
            left:0;right:0;top:0;
            height:5px;
            background:linear-gradient(90deg,var(--moyo-mint),var(--moyo-blue),var(--moyo-violet));
        }
        .moyo-error__brand{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            margin-bottom:18px;
        }
        .moyo-error__brand img{
            width:126px;
            height:auto;
            display:block;
        }
        .moyo-error__status{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:7px;
            min-height:28px;
            padding:0 12px;
            margin-bottom:15px;
            border-radius:999px;
            background:linear-gradient(90deg,rgba(89,220,207,.13),rgba(63,120,243,.10));
            color:#4d69c7;
            font-size:12px;
            font-weight:800;
            letter-spacing:.06em;
        }
        .moyo-error__title{
            margin:0;
            font-size:28px;
            line-height:1.38;
            letter-spacing:-.045em;
            color:#24314b;
        }
        .moyo-error__message{
            margin:13px auto 0;
            max-width:400px;
            color:var(--muted);
            font-size:14px;
            line-height:1.7;
            word-break:keep-all;
        }
        .moyo-error__actions{
            display:flex;
            align-items:center;
            justify-content:center;
            gap:10px;
            margin-top:28px;
        }
        .moyo-error__btn{
            min-width:116px;
            height:42px;
            padding:0 17px;
            border-radius:12px;
            border:1px solid var(--line);
            background:#fff;
            color:#526078;
            font-size:13px;
            font-weight:800;
            cursor:pointer;
            text-decoration:none;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease;
        }
        .moyo-error__btn:hover{
            transform:translateY(-1px);
            border-color:#d7dfec;
            box-shadow:0 7px 18px rgba(47,63,96,.08);
        }
        .moyo-error__btn--primary{
            border:0;
            color:#fff;
            background:linear-gradient(110deg,var(--moyo-mint) 0%,var(--moyo-blue) 55%,var(--moyo-violet) 100%);
            box-shadow:0 10px 22px rgba(74,112,224,.22);
        }
        .moyo-error__btn--primary:hover{
            box-shadow:0 13px 26px rgba(74,112,224,.28);
        }
        @media(max-width:560px){
            .moyo-error{padding:20px 14px}
            .moyo-error__card{padding:36px 22px 28px;border-radius:24px}
            .moyo-error__brand img{width:112px}
            .moyo-error__title{font-size:24px}
            .moyo-error__actions{flex-direction:column-reverse}
            .moyo-error__btn{width:100%}
        }
    </style>
</head>
<body>
<main class="moyo-error">
    <section class="moyo-error__card" aria-labelledby="moyoErrorTitle">
        <div class="moyo-error__brand">
            <img src="${pageContext.request.contextPath}/brand/moyo_logo.png" alt="MOYO">
        </div>

        <div class="moyo-error__status">${statusCode}</div>

        <h1 class="moyo-error__title" id="moyoErrorTitle">${errorTitle}</h1>
        <p class="moyo-error__message">${errorMessage}</p>

        <div class="moyo-error__actions">
            <button class="moyo-error__btn" type="button" onclick="history.back()">이전으로</button>
            <a class="moyo-error__btn moyo-error__btn--primary"
               href="${pageContext.request.contextPath}/">MOYO 홈</a>
        </div>
    </section>
</main>
</body>
</html>
