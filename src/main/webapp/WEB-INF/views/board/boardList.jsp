<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>게시판</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css?v=board-report-empty-final-v1">
</head>
<body class="moyo-board-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css?v=board-report-empty-final-v1">

    <main class="board-page ${boardType eq 'FILE' ? 'board-page-file' : ''}">
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

            <div class="board-hero-actions">
                <c:if test="${canManageBoard}">
                    <c:choose>
                        <c:when test="${not empty projId}">
                            <a href="/group/board/reports?wsId=${wsId}&projId=${projId}" class="board-report-manage-btn">🚨 신고 관리</a>
                        </c:when>
                        <c:otherwise>
                            <a href="/group/board/reports?wsId=${wsId}" class="board-report-manage-btn">🚨 신고 관리</a>
                        </c:otherwise>
                    </c:choose>
                </c:if>
                <c:choose>
                    <c:when test="${not empty projId}">
                        <a href="/group/board/write?wsId=${wsId}&projId=${projId}&type=${boardType}" class="board-write-btn">
                            <c:choose><c:when test="${boardType eq 'FILE'}">+ 자료 등록</c:when><c:otherwise>+ 글쓰기</c:otherwise></c:choose>
                        </a>
                    </c:when>
                    <c:otherwise>
                        <a href="/group/board/write?wsId=${wsId}&type=${boardType}" class="board-write-btn">
                            <c:choose><c:when test="${boardType eq 'FILE'}">+ 자료 등록</c:when><c:otherwise>+ 글쓰기</c:otherwise></c:choose>
                        </a>
                    </c:otherwise>
                </c:choose>
            </div>
        </section>

        <section class="board-search-panel">
            <div class="board-list-summary">
                <strong>
                    <c:choose>
                        <c:when test="${boardType eq 'NOTICE'}">공지</c:when>
                        <c:when test="${boardType eq 'FILE'}">자료</c:when>
                        <c:otherwise>게시글</c:otherwise>
                    </c:choose>
                    ${totalCount}
                </strong>
                <span>페이지 ${page} / ${totalPages}</span>
            </div>

            <c:choose>
                <c:when test="${not empty projId}">
                    <form class="board-search-form" method="get" action="/project/board/list">
                        <input type="hidden" name="projId" value="${projId}">
                        <input type="hidden" name="wsId" value="${wsId}">
                        <input type="hidden" name="type" value="${boardType}">
                        <input type="hidden" name="size" value="${size}">
                        <select name="searchType" class="board-search-select">
                            <option value="all" ${searchType eq 'all' ? 'selected' : ''}>전체</option>
                            <option value="title" ${searchType eq 'title' ? 'selected' : ''}>${boardType eq 'FILE' ? '자료명' : '제목'}</option>
                            <option value="content" ${searchType eq 'content' ? 'selected' : ''}>${boardType eq 'FILE' ? '설명' : '내용'}</option>
                            <option value="writer" ${searchType eq 'writer' ? 'selected' : ''}>작성자</option>
                            <c:if test="${boardType eq 'FILE'}"><option value="fileName" ${searchType eq 'fileName' ? 'selected' : ''}>파일명</option></c:if>
                        </select>
                        <input type="text" name="keyword" value="${keyword}" class="board-search-input" placeholder="${boardType eq 'FILE' ? '자료명, 설명, 파일명으로 검색' : '제목, 내용, 작성자로 검색'}">
                        <button type="submit" class="board-search-btn">검색</button>
                        <c:if test="${not empty keyword}">
                            <a class="board-search-reset" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}">초기화</a>
                        </c:if>
                    </form>
                </c:when>
                <c:otherwise>
                    <form class="board-search-form" method="get" action="/group/board/list">
                        <input type="hidden" name="wsId" value="${wsId}">
                        <input type="hidden" name="type" value="${boardType}">
                        <input type="hidden" name="size" value="${size}">
                        <select name="searchType" class="board-search-select">
                            <option value="all" ${searchType eq 'all' ? 'selected' : ''}>전체</option>
                            <option value="title" ${searchType eq 'title' ? 'selected' : ''}>${boardType eq 'FILE' ? '자료명' : '제목'}</option>
                            <option value="content" ${searchType eq 'content' ? 'selected' : ''}>${boardType eq 'FILE' ? '설명' : '내용'}</option>
                            <option value="writer" ${searchType eq 'writer' ? 'selected' : ''}>작성자</option>
                            <c:if test="${boardType eq 'FILE'}"><option value="fileName" ${searchType eq 'fileName' ? 'selected' : ''}>파일명</option></c:if>
                        </select>
                        <input type="text" name="keyword" value="${keyword}" class="board-search-input" placeholder="${boardType eq 'FILE' ? '자료명, 설명, 파일명으로 검색' : '제목, 내용, 작성자로 검색'}">
                        <button type="submit" class="board-search-btn">검색</button>
                        <c:if test="${not empty keyword}">
                            <a class="board-search-reset" href="/group/board/list?wsId=${wsId}&type=${boardType}">초기화</a>
                        </c:if>
                    </form>
                </c:otherwise>
            </c:choose>
        </section>

        <section class="board-panel ${boardType eq 'FILE' ? 'board-file-panel' : ''}">
            <table class="board-table ${boardType eq 'FILE' ? 'board-file-table' : ''}">
                <thead>
                    <c:choose>
                        <c:when test="${boardType eq 'FILE'}">
                            <tr>
                                <th>자료명</th>
                                <th>작성자</th>
                                <th>파일</th>
                                <th>조회</th>
                                <th>댓글</th>
                                <th>좋아요</th>
                                <th>등록일</th>
                            </tr>
                        </c:when>
                        <c:otherwise>
                            <tr>
                                <th>게시글</th>
                                <th>작성자</th>
                                <th>조회</th>
                                <th>댓글</th>
                                <th>좋아요</th>
                                <th>첨부</th>
                                <th>등록일</th>
                            </tr>
                        </c:otherwise>
                    </c:choose>
                </thead>
                <tbody>
                    <c:choose>
                        <c:when test="${not empty boardList}">
                            <c:forEach var="post" items="${boardList}">
                                <tr class="${boardType eq 'FILE' ? 'board-file-row' : ''}">
                                    <c:choose>
                                        <c:when test="${boardType eq 'FILE'}">
                                            <td>
                                                <div class="board-title-line board-file-title-line">
                                                    <span class="board-file-icon">📁</span>
                                                    <c:if test="${post.isPinned eq 'Y'}"><span class="board-badge fixed">고정</span></c:if>
                                                    <c:choose>
                                                        <c:when test="${not empty projId}">
                                                            <a class="board-post-link" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}&projId=${projId}">${post.title}</a>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <a class="board-post-link" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}">${post.title}</a>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </div>
                                            </td>
                                            <td><span class="board-writer">${post.writerName}</span></td>
                                            <td class="board-count-cell board-file-count-cell">
                                                <c:choose>
                                                    <c:when test="${post.hasFile}"><span class="board-file-count-badge">${post.fileCount}</span></c:when>
                                                    <c:otherwise><span class="board-file-missing">-</span></c:otherwise>
                                                </c:choose>
                                            </td>
                                            <td class="board-count-cell">${post.viewCount}</td>
                                            <td class="board-count-cell">${post.replyCount}</td>
                                            <td class="board-count-cell">${post.likeCount}</td>
                                            <td class="board-date-cell">${post.regDt}</td>
                                        </c:when>
                                        <c:otherwise>
                                            <td>
                                                <div class="board-title-line board-title-line-one">
                                                    <c:if test="${boardType eq 'NOTICE'}"><span class="board-badge notice">공지</span></c:if>
                                                    <c:if test="${post.isPinned eq 'Y'}"><span class="board-badge fixed">고정</span></c:if>
                                                    <c:choose>
                                                        <c:when test="${not empty projId}">
                                                            <a class="board-post-link" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}&projId=${projId}">${post.title}</a>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <a class="board-post-link" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}">${post.title}</a>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </div>
                                            </td>
                                            <td><span class="board-writer">${post.writerName}</span></td>
                                            <td class="board-count-cell">${post.viewCount}</td>
                                            <td class="board-count-cell">${post.replyCount}</td>
                                            <td class="board-count-cell">${post.likeCount}</td>
                                            <td class="board-count-cell">
                                                <c:choose><c:when test="${post.hasFile}">${post.fileCount}</c:when><c:otherwise>-</c:otherwise></c:choose>
                                            </td>
                                            <td class="board-date-cell">${post.regDt}</td>
                                        </c:otherwise>
                                    </c:choose>
                                </tr>
                            </c:forEach>
                        </c:when>
                        <c:otherwise>
                            <tr>
                                <td colspan="7" class="board-empty-cell">
                                    <div class="board-empty board-empty-rich ${boardType eq 'NOTICE' ? 'board-empty-notice' : boardType eq 'FILE' ? 'board-empty-file' : 'board-empty-free'}">
                                        <div class="board-empty-icon">
                                            <c:choose>
                                                <c:when test="${not empty keyword}">&#128269;</c:when>
                                                <c:when test="${boardType eq 'NOTICE'}">&#128226;</c:when>
                                                <c:when test="${boardType eq 'FILE'}">&#128193;</c:when>
                                                <c:otherwise>&#128172;</c:otherwise>
                                            </c:choose>
                                        </div>
                                        <div class="board-empty-copy">
                                            <strong>
                                                <c:choose>
                                                    <c:when test="${not empty keyword}">조건에 맞는 결과가 없습니다.</c:when>
                                                    <c:when test="${boardType eq 'NOTICE'}">아직 등록된 공지사항이 없습니다.</c:when>
                                                    <c:when test="${boardType eq 'FILE'}">아직 등록된 자료가 없습니다.</c:when>
                                                    <c:otherwise>아직 작성된 글이 없습니다.</c:otherwise>
                                                </c:choose>
                                            </strong>
                                            <span>
                                                <c:choose>
                                                    <c:when test="${not empty keyword}">검색어를 바꾸거나 필터를 초기화해 다시 확인해보세요.</c:when>
                                                    <c:when test="${boardType eq 'NOTICE'}">중요한 안내나 팀 공지를 첫 게시글로 남겨보세요.</c:when>
                                                    <c:when test="${boardType eq 'FILE'}">회의 자료, 문서, 참고 파일을 이곳에 모아보세요.</c:when>
                                                    <c:otherwise>가벼운 이야기나 공유하고 싶은 내용을 남겨보세요.</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </div>

                                        <c:choose>
                                            <c:when test="${not empty keyword}">
                                                <c:choose>
                                                    <c:when test="${not empty projId}">
                                                        <a class="board-empty-action ghost" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}">검색 초기화</a>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <a class="board-empty-action ghost" href="/group/board/list?wsId=${wsId}&type=${boardType}">검색 초기화</a>
                                                    </c:otherwise>
                                                </c:choose>
                                            </c:when>
                                            <c:otherwise>
                                                <c:choose>
                                                    <c:when test="${not empty projId}">
                                                        <a class="board-empty-action" href="/group/board/write?wsId=${wsId}&projId=${projId}&type=${boardType}">
                                                            <c:choose>
                                                                <c:when test="${boardType eq 'NOTICE'}">공지 작성하기</c:when>
                                                                <c:when test="${boardType eq 'FILE'}">자료 등록하기</c:when>
                                                                <c:otherwise>첫 글 작성하기</c:otherwise>
                                                            </c:choose>
                                                        </a>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <a class="board-empty-action" href="/group/board/write?wsId=${wsId}&type=${boardType}">
                                                            <c:choose>
                                                                <c:when test="${boardType eq 'NOTICE'}">공지 작성하기</c:when>
                                                                <c:when test="${boardType eq 'FILE'}">자료 등록하기</c:when>
                                                                <c:otherwise>첫 글 작성하기</c:otherwise>
                                                            </c:choose>
                                                        </a>
                                                    </c:otherwise>
                                                </c:choose>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                </td>
                            </tr>
                        </c:otherwise>
                    </c:choose>
                </tbody>
            </table>
        </section>

        <c:if test="${totalPages > 1}">
            <nav class="board-pagination" aria-label="게시판 페이지">
                <c:choose>
                    <c:when test="${not empty projId}">
                        <a class="page-btn ${!hasPrev ? 'disabled' : ''}" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&page=${page - 1}&size=${size}&searchType=${searchType}&keyword=${keyword}">이전</a>
                        <c:forEach var="p" begin="${startPage}" end="${endPage}">
                            <a class="page-number ${p == page ? 'active' : ''}" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&page=${p}&size=${size}&searchType=${searchType}&keyword=${keyword}">${p}</a>
                        </c:forEach>
                        <a class="page-btn ${!hasNext ? 'disabled' : ''}" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&page=${page + 1}&size=${size}&searchType=${searchType}&keyword=${keyword}">다음</a>
                    </c:when>
                    <c:otherwise>
                        <a class="page-btn ${!hasPrev ? 'disabled' : ''}" href="/group/board/list?wsId=${wsId}&type=${boardType}&page=${page - 1}&size=${size}&searchType=${searchType}&keyword=${keyword}">이전</a>
                        <c:forEach var="p" begin="${startPage}" end="${endPage}">
                            <a class="page-number ${p == page ? 'active' : ''}" href="/group/board/list?wsId=${wsId}&type=${boardType}&page=${p}&size=${size}&searchType=${searchType}&keyword=${keyword}">${p}</a>
                        </c:forEach>
                        <a class="page-btn ${!hasNext ? 'disabled' : ''}" href="/group/board/list?wsId=${wsId}&type=${boardType}&page=${page + 1}&size=${size}&searchType=${searchType}&keyword=${keyword}">다음</a>
                    </c:otherwise>
                </c:choose>
            </nav>
        </c:if>
    </main>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
