<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>신고 관리</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardUi.css?v=board-report-empty-final-v1">
</head>
<body class="moyo-board-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <main class="board-page board-report-page">
        <c:choose>
            <c:when test="${not empty projId}">
                <a href="/project/board/list?projId=${projId}&wsId=${wsId}&type=NOTICE" class="board-top-link">← 프로젝트 게시판으로 돌아가기</a>
            </c:when>
            <c:otherwise>
                <a href="/group/board/list?wsId=${wsId}&type=NOTICE" class="board-top-link">← 그룹 게시판으로 돌아가기</a>
            </c:otherwise>
        </c:choose>

        <section class="board-hero board-report-hero">
            <div class="board-hero-copy">
                <h2>신고 관리</h2>
                <p>접수된 게시글과 댓글 신고를 확인하고 처리 상태를 관리합니다.</p>
            </div>
        </section>

        <section class="board-report-filter-panel">
            <div class="board-list-summary">
                <strong>신고 ${totalCount}</strong>
                <span>페이지 ${page} / ${totalPages}</span>
            </div>

            <form class="board-report-filter-form" method="get" action="/group/board/reports" id="reportFilterForm">
                <input type="hidden" name="wsId" value="${wsId}">
                <input type="hidden" name="page" value="1">
                <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                <select name="status" class="board-search-select board-report-auto-filter">
                    <option value="ALL" ${status eq 'ALL' ? 'selected' : ''}>상태 전체</option>
                    <option value="WAITING" ${status eq 'WAITING' ? 'selected' : ''}>대기</option>
                    <option value="CHECKING" ${status eq 'CHECKING' ? 'selected' : ''}>확인 중</option>
                    <option value="RESOLVED" ${status eq 'RESOLVED' ? 'selected' : ''}>조치 완료</option>
                    <option value="REJECTED" ${status eq 'REJECTED' ? 'selected' : ''}>반려</option>
                </select>
                <select name="contentType" class="board-search-select board-report-auto-filter">
                    <option value="ALL" ${contentType eq 'ALL' ? 'selected' : ''}>대상 전체</option>
                    <option value="NOTICE" ${contentType eq 'NOTICE' ? 'selected' : ''}>공지</option>
                    <option value="BOARD" ${contentType eq 'BOARD' ? 'selected' : ''}>게시글</option>
                    <option value="FILE" ${contentType eq 'FILE' ? 'selected' : ''}>자료</option>
                    <option value="REPLY" ${contentType eq 'REPLY' ? 'selected' : ''}>댓글</option>
                </select>
                <div class="board-report-search-box">
                    <input type="search" name="keyword" value="${keyword}" class="board-report-search-input" placeholder="제목, 내용, 신고자, 작성자 검색">
                    <button type="submit" class="board-report-search-btn">검색</button>
                </div>
            </form>
        </section>

        <section class="board-report-panel board-report-table-panel">
            <c:choose>
                <c:when test="${not empty reportList}">
                    <div class="board-report-table-wrap">
                        <table class="board-report-table">
                            <colgroup>
                                <col class="report-col-no">
                                <col class="report-col-status">
                                <col class="report-col-type">
                                <col class="report-col-title">
                                <col class="report-col-reason">
                                <col class="report-col-user">
                                <col class="report-col-user">
                                <col class="report-col-date">
                                <col class="report-col-detail">
                                <col class="report-col-action">
                            </colgroup>
                            <thead>
                                <tr>
                                    <th class="col-center">번호</th>
                                    <th class="col-center">상태</th>
                                    <th class="col-center">대상</th>
                                    <th class="col-left">제목</th>
                                    <th class="col-left">신고 사유</th>
                                    <th class="col-center">신고자</th>
                                    <th class="col-center">작성자</th>
                                    <th class="col-center">신고일</th>
                                    <th class="col-center">상세</th>
                                    <th class="col-center">처리</th>
                                </tr>
                            </thead>
                            <tbody>
                                <c:forEach var="report" items="${reportList}" varStatus="loop">
                                    <tr class="board-report-main-row">
                                        <td class="board-report-no-cell">
                                            ${totalCount - ((page - 1) * size) - loop.index}
                                        </td>
                                        <td class="col-center">
                                            <span class="board-report-status status-${report.STATUS}">
                                                <c:choose>
                                                    <c:when test="${report.STATUS eq 'WAITING'}">대기</c:when>
                                                    <c:when test="${report.STATUS eq 'CHECKING'}">확인 중</c:when>
                                                    <c:when test="${report.STATUS eq 'RESOLVED'}">조치 완료</c:when>
                                                    <c:when test="${report.STATUS eq 'REJECTED'}">반려</c:when>
                                                    <c:otherwise>${report.STATUS}</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </td>
                                        <td class="col-center">
                                            <span class="board-report-type">
                                                <c:choose>
                                                    <c:when test="${report.CONTENT_TYPE eq 'NOTICE'}">공지</c:when>
                                                    <c:when test="${report.CONTENT_TYPE eq 'FILE'}">자료</c:when>
                                                    <c:when test="${report.CONTENT_TYPE eq 'REPLY'}">댓글</c:when>
                                                    <c:otherwise>게시글</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </td>
                                        <td class="board-report-title-cell">
                                            <c:choose>
                                                <c:when test="${not empty projId}">
                                                    <a class="board-report-title-link" href="/group/board/detail?postId=${report.POST_ID}&wsId=${wsId}&projId=${projId}">
                                                        <c:out value="${report.TARGET_TITLE}" />
                                                    </a>
                                                </c:when>
                                                <c:otherwise>
                                                    <a class="board-report-title-link" href="/group/board/detail?postId=${report.POST_ID}&wsId=${wsId}">
                                                        <c:out value="${report.TARGET_TITLE}" />
                                                    </a>
                                                </c:otherwise>
                                            </c:choose>
                                        </td>
                                        <td class="board-report-reason-cell col-left">
                                            <span class="board-report-reason-text">
                                                <c:choose>
                                                    <c:when test="${report.REASON eq 'SPAM'}">스팸/홍보성 내용</c:when>
                                                    <c:when test="${report.REASON eq 'ABUSE'}">욕설/비방</c:when>
                                                    <c:when test="${report.REASON eq 'ADULT'}">부적절한 내용</c:when>
                                                    <c:when test="${report.REASON eq 'PRIVACY'}">개인정보 노출</c:when>
                                                    <c:when test="${report.REASON eq 'ETC'}">기타</c:when>
                                                    <c:otherwise><c:out value="${report.REASON}" /></c:otherwise>
                                                </c:choose>
                                            </span>
                                        </td>
                                        <td class="board-report-user-cell col-center"><c:out value="${report.REPORTER_NAME}" /></td>
                                        <td class="board-report-user-cell col-center"><c:out value="${report.TARGET_WRITER_NAME}" /></td>
                                        <td class="board-report-date-cell col-center">${report.REG_DT}</td>
                                        <td class="board-report-detail-cell col-center">
                                            <button type="button" class="board-report-detail-toggle" data-target="report-detail-${report.REPORT_ID}">상세</button>
                                        </td>
                                        <td class="board-report-action-cell col-center">
                                            <form method="post" action="/group/board/reports/status" class="board-report-inline-form">
                                                <input type="hidden" name="reportId" value="${report.REPORT_ID}">
                                                <input type="hidden" name="wsId" value="${wsId}">
                                                <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                                                <input type="hidden" name="filterStatus" value="${status}">
                                                <input type="hidden" name="contentType" value="${contentType}">
                                                <input type="hidden" name="keyword" value="${keyword}">
                                                <input type="hidden" name="page" value="${page}">
                                                <select name="status" class="board-report-status-select compact" onchange="this.form.submit();">
                                                    <option value="WAITING" ${report.STATUS eq 'WAITING' ? 'selected' : ''}>대기</option>
                                                    <option value="CHECKING" ${report.STATUS eq 'CHECKING' ? 'selected' : ''}>확인 중</option>
                                                    <option value="RESOLVED" ${report.STATUS eq 'RESOLVED' ? 'selected' : ''}>조치 완료</option>
                                                    <option value="REJECTED" ${report.STATUS eq 'REJECTED' ? 'selected' : ''}>반려</option>
                                                </select>
                                            </form>
                                        </td>
                                    </tr>
                                    <tr class="board-report-detail-row is-collapsed" id="report-detail-${report.REPORT_ID}">
                                        <td colspan="10">
                                            <div class="board-report-detail-box">
                                                <div>
                                                    <span>신고 상세 내용</span>
                                                    <p><c:out value="${empty report.DETAIL ? '신고 상세 내용 없음' : report.DETAIL}" /></p>
                                                </div>
                                                <div>
                                                    <span>신고 대상 본문</span>
                                                    <p><c:out value="${empty report.TARGET_CONTENT ? '본문 없음' : report.TARGET_CONTENT}" /></p>
                                                </div>
                                                <form method="post" action="/group/board/reports/delete-content" class="board-report-delete-form" onsubmit="return confirm('신고 대상 콘텐츠를 삭제하고 해당 신고를 조치 완료 처리할까요? 삭제 후 복구하기 어렵습니다.');">
                                                    <input type="hidden" name="reportId" value="${report.REPORT_ID}">
                                                    <input type="hidden" name="wsId" value="${wsId}">
                                                    <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                                                    <input type="hidden" name="filterStatus" value="${status}">
                                                    <input type="hidden" name="contentType" value="${contentType}">
                                                    <input type="hidden" name="keyword" value="${keyword}">
                                                    <input type="hidden" name="page" value="${page}">
                                                    <button type="submit" class="board-report-action-btn danger compact">대상 삭제</button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                </c:forEach>
                            </tbody>
                        </table>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="board-report-empty">조건에 맞는 신고가 없습니다.</div>
                </c:otherwise>
            </c:choose>
        </section>

        <c:if test="${totalPages > 1}">
            <nav class="board-pagination" aria-label="신고 관리 페이지">
                <c:choose>
                    <c:when test="${not empty projId}">
                        <a class="page-btn ${!hasPrev ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&projId=${projId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page - 1}&size=${size}">이전</a>
                        <c:forEach var="p" begin="${startPage}" end="${endPage}">
                            <a class="page-number ${p == page ? 'active' : ''}" href="/group/board/reports?wsId=${wsId}&projId=${projId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${p}&size=${size}">${p}</a>
                        </c:forEach>
                        <a class="page-btn ${!hasNext ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&projId=${projId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page + 1}&size=${size}">다음</a>
                    </c:when>
                    <c:otherwise>
                        <a class="page-btn ${!hasPrev ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page - 1}&size=${size}">이전</a>
                        <c:forEach var="p" begin="${startPage}" end="${endPage}">
                            <a class="page-number ${p == page ? 'active' : ''}" href="/group/board/reports?wsId=${wsId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${p}&size=${size}">${p}</a>
                        </c:forEach>
                        <a class="page-btn ${!hasNext ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page + 1}&size=${size}">다음</a>
                    </c:otherwise>
                </c:choose>
            </nav>
        </c:if>
    </main>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('.board-report-auto-filter').forEach(function (select) {
                select.addEventListener('change', function () {
                    var form = document.getElementById('reportFilterForm');
                    if (form) form.submit();
                });
            });

            document.querySelectorAll('.board-report-detail-toggle').forEach(function (button) {
                button.addEventListener('click', function () {
                    var targetId = button.getAttribute('data-target');
                    var row = document.getElementById(targetId);
                    if (!row) return;
                    var isCollapsed = row.classList.toggle('is-collapsed');
                    button.classList.toggle('is-open', !isCollapsed);
                    button.textContent = isCollapsed ? '상세' : '접기';
                });
            });
        });
    </script>
</body>
</html>
