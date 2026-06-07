<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>게시판</title>
    <style>
        body {
            margin: 0;
            background: #f6f8fa;
            color: #111827;
            font-family: 'Pretendard', sans-serif;
        }

        .board-page {
            width: 100%;
            margin: 30px auto 72px;
            padding: 0 28px;
            box-sizing: border-box;
        }

        .board-top-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 18px;
            color: #64748b;
            text-decoration: none;
            font-size: 14px;
            font-weight: 800;
        }

        .board-top-link:hover {
            color: #4A90E2;
        }

        .board-hero {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 22px;
            padding: 28px 32px;
            border: 1px solid #e4ebf2;
            border-radius: 24px;
            background:
                radial-gradient(circle at 92% 16%, rgba(85, 221, 191, .18), transparent 28%),
                radial-gradient(circle at 6% 100%, rgba(74, 144, 226, .12), transparent 32%),
                #fff;
            box-shadow: 0 10px 30px rgba(32, 48, 64, .045);
            overflow: hidden;
        }

        .board-hero::before {
            content: '';
            position: absolute;
            left: 0;
            top: 26px;
            bottom: 26px;
            width: 5px;
            border-radius: 0 999px 999px 0;
            background: #4A90E2;
        }

        .board-hero-copy {
            position: relative;
            z-index: 1;
        }

        .board-hero h2 {
            margin: 0;
            color: #111827;
            font-size: 29px;
            font-weight: 900;
            line-height: 1.2;
            letter-spacing: -.04em;
        }

        .board-hero p {
            margin: 9px 0 0;
            color: #64748b;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.55;
        }

        .board-write-btn {
            position: relative;
            z-index: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 42px;
            padding: 0 18px;
            border-radius: 12px;
            background: #4A90E2;
            color: #fff;
            text-decoration: none;
            font-size: 13px;
            font-weight: 900;
            box-shadow: 0 8px 18px rgba(74, 144, 226, .20);
            transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
            white-space: nowrap;
        }

        .board-write-btn:hover {
            background: #3f83d6;
            transform: translateY(-1px);
            box-shadow: 0 10px 22px rgba(74, 144, 226, .24);
        }

        .board-panel {
            overflow: hidden;
            border: 1px solid #e4ebf2;
            border-radius: 20px;
            background: #fff;
            box-shadow: 0 8px 22px rgba(32, 48, 64, .035);
        }

        .board-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .board-table th,
        .board-table td {
            padding: 16px 18px;
            border-bottom: 1px solid #edf1f5;
            vertical-align: middle;
            font-size: 14px;
        }

        .board-table th {
            background: #f8fafc;
            color: #475569;
            font-size: 13px;
            font-weight: 900;
            text-align: left;
        }

        .board-table tbody tr:last-child td {
            border-bottom: 0;
        }

        .board-table tbody tr:hover td {
            background: #f8fbff;
        }

        .board-table th:nth-child(2),
        .board-table td:nth-child(2),
        .board-table th:nth-child(3),
        .board-table td:nth-child(3),
        .board-table th:nth-child(4),
        .board-table td:nth-child(4) {
            width: 130px;
            text-align: center;
        }

        .board-post-link {
            display: block;
            min-width: 0;
            overflow: hidden;
            color: #1f2937;
            font-weight: 800;
            text-decoration: none;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .board-post-link:hover {
            color: #4A90E2;
        }

        .board-file-link {
            color: #4A90E2;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
        }

        .board-empty-cell {
            padding: 22px !important;
            background: #fff;
        }

        .board-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 130px;
            border: 1px dashed #dce3ea;
            border-radius: 16px;
            background: #fafbfc;
            color: #94a3b8;
            font-size: 14px;
            font-weight: 800;
            text-align: center;
        }

        @media (max-width: 760px) {
            .board-page {
                padding: 0 16px;
                margin-top: 22px;
            }

            .board-hero {
                flex-direction: column;
                align-items: flex-start;
                padding: 24px 22px;
            }

            .board-write-btn {
                width: 100%;
                box-sizing: border-box;
            }

            .board-panel {
                overflow-x: auto;
            }

            .board-table {
                min-width: 720px;
            }
        }
    </style>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css">
</head>
<body class="moyo-board-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="board-page">
        <c:choose>
            <c:when test="${not empty projId}">
                <a href="/project/main?projId=${projId}&wsId=${wsId}" class="board-top-link">← 프로젝트로 돌아가기</a>
            </c:when>
            <c:otherwise>
                <a href="/workspace/main?wsId=${wsId}" class="board-top-link">← 워크스페이스로 돌아가기</a>
            </c:otherwise>
        </c:choose>

        <section class="board-hero">
            <div class="board-hero-copy">
                <h2>
                    <c:choose>
                        <c:when test="${not empty projId && boardType eq 'NOTICE'}">프로젝트 공지사항</c:when>
                        <c:when test="${not empty projId && boardType eq 'FILE'}">프로젝트 자료실</c:when>
                        <c:when test="${not empty projId}">프로젝트 자유 게시판</c:when>
                        <c:when test="${boardType eq 'NOTICE'}">워크스페이스 공지사항</c:when>
                        <c:when test="${boardType eq 'FILE'}">워크스페이스 자료실</c:when>
                        <c:otherwise>워크스페이스 자유 게시판</c:otherwise>
                    </c:choose>
                </h2>
                <p>
                    <c:choose>
                        <c:when test="${boardType eq 'NOTICE'}">중요한 소식과 안내를 구성원들과 공유합니다.</c:when>
                        <c:when test="${boardType eq 'FILE'}">업무와 모임에 필요한 파일과 자료를 한곳에서 관리합니다.</c:when>
                        <c:otherwise>자유롭게 의견과 이야기를 나누는 공간입니다.</c:otherwise>
                    </c:choose>
                </p>
            </div>

            <c:choose>
                <c:when test="${not empty projId}">
                    <a href="/group/board/write?wsId=${wsId}&projId=${projId}&type=${boardType}" class="board-write-btn">+ 글쓰기</a>
                </c:when>
                <c:otherwise>
                    <a href="/group/board/write?wsId=${wsId}&type=${boardType}" class="board-write-btn">+ 글쓰기</a>
                </c:otherwise>
            </c:choose>
        </section>

        <section class="board-panel">
            <table class="board-table">
                <thead>
                    <tr>
                        <th>제목</th>
                        <th>작성자</th>
                        <th>등록일</th>
                        <c:if test="${boardType eq 'FILE'}">
                            <th>파일</th>
                        </c:if>
                    </tr>
                </thead>
                <tbody>
                    <c:choose>
                        <c:when test="${not empty boardList}">
                            <c:forEach var="post" items="${boardList}">
                                <tr>
                                    <td>
                                        <c:choose>
                                            <c:when test="${not empty projId}">
                                                <a class="board-post-link" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}&projId=${projId}">${post.title}</a>
                                            </c:when>
                                            <c:otherwise>
                                                <a class="board-post-link" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}">${post.title}</a>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td>${post.writerName}</td>
                                    <td>${post.regDt}</td>
                                    <c:if test="${boardType eq 'FILE'}">
                                        <td>
                                            <c:choose>
                                                <c:when test="${post.hasFile}">
                                                    <a class="board-file-link" href="/download?path=${post.filePath}">첨부파일</a>
                                                </c:when>
                                                <c:otherwise>-</c:otherwise>
                                            </c:choose>
                                        </td>
                                    </c:if>
                                </tr>
                            </c:forEach>
                        </c:when>
                        <c:otherwise>
                            <tr>
                                <td colspan="${boardType eq 'FILE' ? 4 : 3}" class="board-empty-cell">
                                    <div class="board-empty">
                                        <c:choose>
                                            <c:when test="${boardType eq 'NOTICE'}">등록된 공지사항이 없습니다.</c:when>
                                            <c:when test="${boardType eq 'FILE'}">등록된 자료가 없습니다.</c:when>
                                            <c:otherwise>등록된 글이 없습니다.</c:otherwise>
                                        </c:choose>
                                    </div>
                                </td>
                            </tr>
                        </c:otherwise>
                    </c:choose>
                </tbody>
            </table>
        </section>
    </main>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
