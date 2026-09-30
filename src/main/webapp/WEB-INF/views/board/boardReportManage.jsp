<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>신고 관리</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardReportManage.css?v=board-report-manage-final-20260928">
</head>
<body class="moyo-board-body board-report-manage-body">
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="board-page board-report-page">
        <c:choose>
            <c:when test="${not empty projId}">
                <a href="/project/board/list?projId=${projId}&wsId=${wsId}&type=NOTICE" class="board-report-context-link">
                    <span class="board-report-context-icon" aria-hidden="true">&#128172;</span><span>게시판</span>
                </a>
            </c:when>
            <c:otherwise>
                <a href="/group/board/list?wsId=${wsId}&type=NOTICE" class="board-report-context-link">
                    <span class="board-report-context-icon" aria-hidden="true">&#128172;</span><span>게시판</span>
                </a>
            </c:otherwise>
        </c:choose>

        <section class="board-report-hero-v3">
            <div>
                <h1>신고 관리 <span class="board-report-title-count">${totalCount}건</span></h1>
                <p>접수된 신고를 확인하고 필요한 조치를 처리해요.</p>
            </div>
        </section>

        <section class="board-report-filter-panel-v3">
            <form class="board-report-filter-form-v3" method="get" action="/group/board/reports" id="reportFilterForm">
                <input type="hidden" name="wsId" value="${wsId}">
                <input type="hidden" name="page" value="1">
                <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>

                <select name="status" class="board-report-auto-filter board-report-custom-select-source" aria-label="신고 상태">
                    <option value="ALL" ${status eq 'ALL' ? 'selected' : ''}>상태 전체</option>
                    <option value="WAITING" ${status eq 'WAITING' ? 'selected' : ''}>대기</option>
                    <option value="CHECKING" ${status eq 'CHECKING' ? 'selected' : ''}>확인 중</option>
                    <option value="RESOLVED" ${status eq 'RESOLVED' ? 'selected' : ''}>조치 완료</option>
                    <option value="REJECTED" ${status eq 'REJECTED' ? 'selected' : ''}>반려</option>
                </select>

                <select name="contentType" class="board-report-auto-filter board-report-custom-select-source" aria-label="신고 대상">
                    <option value="ALL" ${contentType eq 'ALL' ? 'selected' : ''}>대상 전체</option>
                    <option value="NOTICE" ${contentType eq 'NOTICE' ? 'selected' : ''}>공지</option>
                    <option value="BOARD" ${contentType eq 'BOARD' ? 'selected' : ''}>게시글</option>
                    <option value="REPLY" ${contentType eq 'REPLY' ? 'selected' : ''}>댓글</option>
                </select>

                <div class="board-report-search-box-v3">
                    <span aria-hidden="true">⌕</span>
                    <input type="search" name="keyword" value="${keyword}" placeholder="제목, 내용, 신고자, 작성자 검색" aria-label="신고 검색">
                    <button type="submit">검색</button>
                </div>
            </form>
        </section>

        <section class="board-report-list-v3">
            <c:choose>
                <c:when test="${not empty reportList}">
                    <c:forEach var="report" items="${reportList}" varStatus="loop">
                        <article class="board-report-item-v3" id="report-card-${report.REPORT_ID}" data-report-card>
                            <c:url var="reportTargetUrl" value="/group/board/detail">
                                <c:param name="postId" value="${report.POST_ID}" />
                                <c:param name="wsId" value="${wsId}" />
                                <c:if test="${not empty projId}"><c:param name="projId" value="${projId}" /></c:if>
                            </c:url>

                            <div class="board-report-item-head-v3" data-report-toggle data-target="report-detail-${report.REPORT_ID}" role="button" tabindex="0" aria-expanded="false">
                                <div class="board-report-item-main-v3">
                                    <div class="board-report-title-line-v3">
                                        <div class="board-report-badges-v3">
                                            <span class="board-report-status status-${report.STATUS}">
                                                <c:choose>
                                                    <c:when test="${report.STATUS eq 'WAITING'}">대기</c:when>
                                                    <c:when test="${report.STATUS eq 'CHECKING'}">확인 중</c:when>
                                                    <c:when test="${report.STATUS eq 'RESOLVED'}">조치 완료</c:when>
                                                    <c:when test="${report.STATUS eq 'REJECTED'}">반려</c:when>
                                                    <c:otherwise>${report.STATUS}</c:otherwise>
                                                </c:choose>
                                            </span>
                                            <span class="board-report-type">
                                                <c:choose>
                                                    <c:when test="${report.CONTENT_TYPE eq 'NOTICE'}">공지</c:when>
                                                    <c:when test="${report.CONTENT_TYPE eq 'REPLY'}">댓글</c:when>
                                                    <c:otherwise>게시글</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </div>
                                        <c:choose>
                                            <c:when test="${report.TARGET_DELETED_YN eq 'Y'}">
                                                <span class="board-report-title-link-v3 is-disabled" aria-disabled="true">
                                                    <c:out value="${empty report.TARGET_TITLE ? '삭제되었거나 확인할 수 없는 콘텐츠' : report.TARGET_TITLE}" />
                                                </span>
                                            </c:when>
                                            <c:when test="${report.CONTENT_TYPE eq 'REPLY' and not empty report.REPLY_ID}">
                                                <a class="board-report-title-link-v3" href="${reportTargetUrl}#reply-item-${report.REPLY_ID}">
                                                    <c:out value="${empty report.TARGET_TITLE ? '삭제되었거나 확인할 수 없는 콘텐츠' : report.TARGET_TITLE}" />
                                                </a>
                                            </c:when>
                                            <c:otherwise>
                                                <a class="board-report-title-link-v3" href="${reportTargetUrl}">
                                                    <c:out value="${empty report.TARGET_TITLE ? '삭제되었거나 확인할 수 없는 콘텐츠' : report.TARGET_TITLE}" />
                                                </a>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>

                                    <div class="board-report-summary-v3">
                                        <span><em>사유</em>
                                            <strong>
                                                <c:choose>
                                                    <c:when test="${report.REASON eq 'SPAM'}">스팸/홍보성 내용</c:when>
                                                    <c:when test="${report.REASON eq 'ABUSE'}">욕설/비방</c:when>
                                                    <c:when test="${report.REASON eq 'INAPPROPRIATE' or report.REASON eq 'ADULT'}">부적절한 내용</c:when>
                                                    <c:when test="${report.REASON eq 'PRIVACY'}">개인정보 노출</c:when>
                                                    <c:when test="${report.REASON eq 'ETC'}">기타</c:when>
                                                    <c:otherwise><c:out value="${report.REASON}" /></c:otherwise>
                                                </c:choose>
                                            </strong>
                                        </span>
                                        <span><em>신고자</em><strong><c:out value="${report.REPORTER_NAME}" /></strong></span>
                                        <span><em>작성자</em><strong><c:out value="${report.TARGET_WRITER_NAME}" /></strong></span>
                                        <c:if test="${report.TARGET_DELETED_YN eq 'Y'}"><span class="is-deleted"><em>대상</em><strong>삭제됨</strong></span></c:if>
                                    </div>
                                </div>

                                <div class="board-report-item-side-v3">
                                    <time>${report.REG_DT}</time>
                                    <button type="button" class="board-report-chevron-v3" data-report-chevron aria-label="신고 상세 펼치기" tabindex="-1"><span></span></button>
                                </div>
                            </div>

                            <div class="board-report-item-actions-v3">
                                <form method="post" action="/group/board/reports/status" class="board-report-inline-form-v3">
                                    <input type="hidden" name="reportId" value="${report.REPORT_ID}">
                                    <input type="hidden" name="wsId" value="${wsId}">
                                    <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                                    <input type="hidden" name="filterStatus" value="${status}">
                                    <input type="hidden" name="contentType" value="${contentType}">
                                    <input type="hidden" name="keyword" value="${keyword}">
                                    <input type="hidden" name="page" value="${page}">
                                    <label>처리 상태</label>
                                    <select name="status" class="board-report-status-select-v3 board-report-custom-select-source" data-report-status="${report.STATUS}" onchange="this.form.submit();">
                                        <option value="WAITING" ${report.STATUS eq 'WAITING' ? 'selected' : ''}>대기</option>
                                        <option value="CHECKING" ${report.STATUS eq 'CHECKING' ? 'selected' : ''}>확인 중</option>
                                        <option value="RESOLVED" ${report.STATUS eq 'RESOLVED' ? 'selected' : ''}>조치 완료</option>
                                        <option value="REJECTED" ${report.STATUS eq 'REJECTED' ? 'selected' : ''}>반려</option>
                                    </select>
                                </form>
                            </div>

                            <div class="board-report-detail-v3 is-collapsed" id="report-detail-${report.REPORT_ID}">
                                <div class="board-report-detail-grid-v3">
                                    <section>
                                        <span>신고 상세 내용</span>
                                        <p><c:out value="${empty report.DETAIL ? '상세 내용이 입력되지 않았습니다.' : report.DETAIL}" /></p>
                                    </section>
                                    <c:choose>
                                        <c:when test="${report.TARGET_DELETED_YN eq 'Y'}">
                                            <section class="board-report-target-link-v3 is-disabled" aria-disabled="true">
                                                <span>신고 대상 내용 <b>삭제된 콘텐츠</b></span>
                                                <p><c:out value="${empty report.TARGET_CONTENT ? '삭제되어 내용을 확인할 수 없습니다.' : report.TARGET_CONTENT}" /></p>
                                            </section>
                                        </c:when>
                                        <c:when test="${report.CONTENT_TYPE eq 'REPLY' and not empty report.REPLY_ID}">
                                            <a class="board-report-target-link-v3" href="${reportTargetUrl}#reply-item-${report.REPLY_ID}">
                                                <span>신고 대상 내용 <b>원문 보기 →</b></span>
                                                <p><c:out value="${empty report.TARGET_CONTENT ? '내용을 확인할 수 없습니다.' : report.TARGET_CONTENT}" /></p>
                                            </a>
                                        </c:when>
                                        <c:otherwise>
                                            <a class="board-report-target-link-v3" href="${reportTargetUrl}">
                                                <span>신고 대상 내용 <b>원문 보기 →</b></span>
                                                <p><c:out value="${empty report.TARGET_CONTENT ? '내용을 확인할 수 없습니다.' : report.TARGET_CONTENT}" /></p>
                                            </a>
                                        </c:otherwise>
                                    </c:choose>
                                </div>

                                <div class="board-report-detail-footer-v3">
                                    <div class="board-report-process-v3">
                                        <c:choose>
                                            <c:when test="${not empty report.PROC_DT}">
                                                <span>최근 처리</span><strong><c:out value="${report.PROC_USER_NAME}" /> · ${report.PROC_DT}</strong>
                                            </c:when>
                                            <c:otherwise><span>최근 처리</span><strong>아직 처리되지 않았어요.</strong></c:otherwise>
                                        </c:choose>
                                    </div>

                                    <c:choose>
                                        <c:when test="${report.TARGET_DELETED_YN eq 'Y'}">
                                            <span class="board-report-deleted-note">대상 콘텐츠가 삭제되었습니다.</span>
                                        </c:when>
                                        <c:otherwise>
                                            <form method="post" action="/group/board/reports/delete-content" class="board-report-delete-form-v3" data-report-delete-form>
                                                <input type="hidden" name="reportId" value="${report.REPORT_ID}">
                                                <input type="hidden" name="wsId" value="${wsId}">
                                                <c:if test="${not empty projId}"><input type="hidden" name="projId" value="${projId}"></c:if>
                                                <input type="hidden" name="filterStatus" value="${status}">
                                                <input type="hidden" name="contentType" value="${contentType}">
                                                <input type="hidden" name="keyword" value="${keyword}">
                                                <input type="hidden" name="page" value="${page}">
                                                <button type="submit">대상 삭제</button>
                                            </form>
                                        </c:otherwise>
                                    </c:choose>
                                </div>
                            </div>
                        </article>
                    </c:forEach>
                </c:when>
                <c:otherwise>
                    <div class="board-report-empty-v3">
                        <strong>조건에 맞는 신고가 없어요.</strong>
                        <span>필터를 바꾸거나 다른 검색어로 확인해보세요.</span>
                    </div>
                </c:otherwise>
            </c:choose>
        </section>

        <c:if test="${totalPages > 1}">
            <nav class="board-pagination" aria-label="신고 관리 페이지">
                <c:choose>
                    <c:when test="${not empty projId}">
                        <a class="page-btn ${!hasPrev ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&projId=${projId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page - 1}&size=${size}">이전</a>
                        <c:forEach var="p" begin="${startPage}" end="${endPage}"><a class="page-number ${p == page ? 'active' : ''}" href="/group/board/reports?wsId=${wsId}&projId=${projId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${p}&size=${size}">${p}</a></c:forEach>
                        <a class="page-btn ${!hasNext ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&projId=${projId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page + 1}&size=${size}">다음</a>
                    </c:when>
                    <c:otherwise>
                        <a class="page-btn ${!hasPrev ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page - 1}&size=${size}">이전</a>
                        <c:forEach var="p" begin="${startPage}" end="${endPage}"><a class="page-number ${p == page ? 'active' : ''}" href="/group/board/reports?wsId=${wsId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${p}&size=${size}">${p}</a></c:forEach>
                        <a class="page-btn ${!hasNext ? 'disabled' : ''}" href="/group/board/reports?wsId=${wsId}&status=${status}&contentType=${contentType}&keyword=${keyword}&page=${page + 1}&size=${size}">다음</a>
                    </c:otherwise>
                </c:choose>
            </nav>
        </c:if>
    </main>

    <div class="board-report-confirm" data-report-confirm hidden>
        <button type="button" class="board-report-confirm-backdrop" data-report-confirm-cancel aria-label="닫기"></button>
        <section class="board-report-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="boardReportConfirmTitle">
            <h2 id="boardReportConfirmTitle">신고 대상 삭제</h2>
            <p>대상 콘텐츠를 삭제하고 이 신고를 <strong>조치 완료</strong>로 변경할까요?</p>
            <div class="board-report-confirm-actions">
                <button type="button" class="is-cancel" data-report-confirm-cancel>취소</button>
                <button type="button" class="is-danger" data-report-confirm-ok>삭제하기</button>
            </div>
        </section>
    </div>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            function closeReportSelects(except) {
                document.querySelectorAll('.board-report-select-ui.is-open').forEach(function (ui) {
                    if (ui === except) return;
                    ui.classList.remove('is-open');
                    var button = ui.querySelector('.board-report-select-button');
                    if (button) button.setAttribute('aria-expanded', 'false');
                });
            }

            function enhanceReportSelect(select) {
                if (!select || select.dataset.enhanced === 'Y') return;
                select.dataset.enhanced = 'Y';
                select.classList.add('is-enhanced');
                select.setAttribute('aria-hidden', 'true');
                select.tabIndex = -1;

                var ui = document.createElement('div');
                ui.className = 'board-report-select-ui ' + (select.classList.contains('board-report-status-select-v3') ? 'is-status' : 'is-filter');

                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'board-report-select-button';
                button.setAttribute('aria-haspopup', 'listbox');
                button.setAttribute('aria-expanded', 'false');

                var valueText = document.createElement('span');
                valueText.className = 'board-report-select-value';
                var arrow = document.createElement('span');
                arrow.className = 'board-report-select-arrow';
                arrow.setAttribute('aria-hidden', 'true');
                button.append(valueText, arrow);

                var menu = document.createElement('div');
                menu.className = 'board-report-select-menu';
                menu.setAttribute('role', 'listbox');

                var optionButtons = [];
                Array.from(select.options).forEach(function (option, index) {
                    var item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'board-report-select-option';
                    item.dataset.value = option.value;
                    item.setAttribute('role', 'option');
                    item.innerHTML = '<span></span><b aria-hidden="true">✓</b>';
                    item.querySelector('span').textContent = option.textContent;
                    item.addEventListener('click', function (event) {
                        event.stopPropagation();
                        var changed = select.value !== option.value;
                        select.value = option.value;
                        sync();
                        ui.classList.remove('is-open');
                        button.setAttribute('aria-expanded', 'false');
                        button.focus();
                        if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                    item.addEventListener('keydown', function (event) {
                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                            event.preventDefault();
                            var next = event.key === 'ArrowDown' ? Math.min(optionButtons.length - 1, index + 1) : Math.max(0, index - 1);
                            optionButtons[next]?.focus();
                        } else if (event.key === 'Escape') {
                            event.preventDefault();
                            ui.classList.remove('is-open');
                            button.setAttribute('aria-expanded', 'false');
                            button.focus();
                        }
                    });
                    optionButtons.push(item);
                    menu.appendChild(item);
                });

                function sync() {
                    var current = select.options[select.selectedIndex] || select.options[0];
                    valueText.textContent = current ? current.textContent : '';
                    optionButtons.forEach(function (item) {
                        var active = item.dataset.value === select.value;
                        item.classList.toggle('is-selected', active);
                        item.setAttribute('aria-selected', active ? 'true' : 'false');
                    });
                    if (ui.classList.contains('is-status')) {
                        var terminal = select.value === 'RESOLVED' || select.value === 'REJECTED';
                        ui.classList.toggle('is-terminal', terminal);
                    }
                }

                button.addEventListener('click', function (event) {
                    event.stopPropagation();
                    var open = !ui.classList.contains('is-open');
                    closeReportSelects(ui);
                    ui.classList.toggle('is-open', open);
                    button.setAttribute('aria-expanded', open ? 'true' : 'false');
                });
                button.addEventListener('keydown', function (event) {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        closeReportSelects(ui);
                        ui.classList.add('is-open');
                        button.setAttribute('aria-expanded', 'true');
                        var selectedIndex = Math.max(0, Array.from(select.options).findIndex(function (option) { return option.value === select.value; }));
                        var focusIndex = event.key === 'ArrowDown' ? Math.min(optionButtons.length - 1, selectedIndex + 1) : Math.max(0, selectedIndex - 1);
                        optionButtons[focusIndex]?.focus();
                    }
                });

                ui.append(button, menu);
                select.insertAdjacentElement('afterend', ui);
                sync();
            }

            document.querySelectorAll('.board-report-custom-select-source').forEach(enhanceReportSelect);
            document.addEventListener('click', function () { closeReportSelects(); });
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') closeReportSelects();
            });

            document.querySelectorAll('.board-report-auto-filter').forEach(function (select) {
                select.addEventListener('change', function () {
                    var form = document.getElementById('reportFilterForm');
                    if (form) form.submit();
                });
            });

            function toggleReportCard(toggle) {
                var row = document.getElementById(toggle.getAttribute('data-target'));
                if (!row) return;
                var willOpen = row.classList.contains('is-collapsed');
                row.classList.toggle('is-collapsed', !willOpen);
                toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                var card = toggle.closest('[data-report-card]');
                if (card) card.classList.toggle('is-open', willOpen);
            }

            document.querySelectorAll('[data-report-toggle]').forEach(function (toggle) {
                toggle.addEventListener('click', function (event) {
                    if (event.target.closest('a, button, select, input, form, label')) return;
                    toggleReportCard(toggle);
                });
                toggle.addEventListener('keydown', function (event) {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    if (event.target !== toggle) return;
                    event.preventDefault();
                    toggleReportCard(toggle);
                });
                var chevron = toggle.querySelector('[data-report-chevron]');
                if (chevron) {
                    chevron.addEventListener('click', function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleReportCard(toggle);
                    });
                }
            });

            var openReportId = new URLSearchParams(window.location.search).get('openReportId');
            if (openReportId) {
                var openCard = document.getElementById('report-card-' + openReportId);
                if (openCard) {
                    var openToggle = openCard.querySelector('[data-report-toggle]');
                    if (openToggle && openToggle.getAttribute('aria-expanded') !== 'true') {
                        toggleReportCard(openToggle);
                    }
                    window.setTimeout(function () {
                        openCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 80);
                }
            }

            var confirmModal = document.querySelector('[data-report-confirm]');
            var pendingDeleteForm = null;
            function closeDeleteConfirm() {
                if (!confirmModal) return;
                confirmModal.hidden = true;
                document.body.classList.remove('board-report-confirm-open');
                pendingDeleteForm = null;
            }
            document.querySelectorAll('[data-report-delete-form]').forEach(function (form) {
                form.addEventListener('submit', function (event) {
                    event.preventDefault();
                    pendingDeleteForm = form;
                    if (confirmModal) {
                        confirmModal.hidden = false;
                        document.body.classList.add('board-report-confirm-open');
                    }
                });
            });
            document.querySelectorAll('[data-report-confirm-cancel]').forEach(function (button) {
                button.addEventListener('click', closeDeleteConfirm);
            });
            var confirmOk = document.querySelector('[data-report-confirm-ok]');
            if (confirmOk) {
                confirmOk.addEventListener('click', function () {
                    var form = pendingDeleteForm;
                    if (!form) return closeDeleteConfirm();
                    confirmOk.disabled = true;
                    form.submit();
                });
            }
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && confirmModal && !confirmModal.hidden) closeDeleteConfirm();
            });
        });
    </script>
</body>
</html>
