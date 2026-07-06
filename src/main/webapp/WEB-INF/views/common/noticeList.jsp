<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>

<style>
    :root {
        --notice-blue: #4A90E2;
        --notice-mint: #39CDB5;
        --notice-purple: #8B5CF6;
        --notice-ink: #162033;
        --notice-text: #334155;
        --notice-muted: #7b8798;
        --notice-line: #e6edf7;
        --notice-soft: #f6f9ff;
        --notice-card: rgba(255, 255, 255, 0.92);
    }

    body {
        background:
            radial-gradient(circle at 12% 16%, rgba(57, 205, 181, 0.15), transparent 32%),
            radial-gradient(circle at 88% 10%, rgba(74, 144, 226, 0.12), transparent 34%),
            linear-gradient(180deg, #f8fbff 0%, #ffffff 54%);
    }

    .notice-page {
        min-height: calc(100vh - 70px);
        padding: 110px 20px 56px;
    }

    .notice-shell {
        width: min(100%, 980px);
        margin: 0 auto;
    }

    .notice-hero {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
    }

    .notice-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #2878d0;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: -0.02em;
    }

    .notice-eyebrow::before {
        content: "";
        width: 4px;
        height: 18px;
        border-radius: 999px;
        background: linear-gradient(180deg, var(--notice-blue), var(--notice-mint));
        box-shadow: 0 6px 14px rgba(74, 144, 226, 0.2);
    }

    .notice-title-main {
        margin: 0;
        color: var(--notice-ink);
        font-size: 32px;
        font-weight: 950;
        line-height: 1.18;
        letter-spacing: -0.045em;
    }

    .notice-subtitle {
        margin: 10px 0 0;
        color: #64748b;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.65;
        letter-spacing: -0.025em;
    }

    .notice-admin-write {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 42px;
        padding: 0 18px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--notice-mint), #4f6ff7);
        color: #fff;
        font-size: 14px;
        font-weight: 900;
        text-decoration: none;
        box-shadow: 0 14px 28px rgba(74, 144, 226, 0.22);
        transition: transform .18s ease, box-shadow .18s ease;
    }

    .notice-admin-write:hover {
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 18px 34px rgba(74, 144, 226, 0.28);
    }

    .notice-panel {
        border: 1px solid rgba(221, 231, 246, 0.96);
        border-radius: 26px;
        background: var(--notice-card);
        box-shadow: 0 24px 58px rgba(74, 85, 104, 0.08);
        overflow: hidden;
        backdrop-filter: blur(10px);
        margin-bottom: 14px;
    }

    .notice-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .notice-item {
        position: relative;
        background: transparent;
        cursor: pointer;
        transition: background .18s ease;
    }

    .notice-item + .notice-item {
        border-top: 1px solid #edf2f8;
    }

    .notice-item:hover {
        background: linear-gradient(90deg, rgba(74, 144, 226, 0.055), rgba(57, 205, 181, 0.04));
    }

    .notice-summary {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 16px;
        width: 100%;
        padding: 22px 26px;
    }

    .notice-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .notice-title-row {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
    }

    .badge-pin {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 22px;
        padding: 0 9px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(255, 211, 92, 0.22), rgba(255, 244, 210, 0.75));
        border: 1px solid rgba(255, 202, 66, 0.36);
        color: #b7791f;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: -0.02em;
    }

    .notice-title {
        min-width: 0;
        color: var(--notice-ink);
        font-size: 17px;
        font-weight: 900;
        line-height: 1.35;
        letter-spacing: -0.035em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .notice-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #8793a6;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: -0.02em;
    }

    .notice-meta-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #cbd5e1;
    }

    .notice-toggle-icon {
        width: 34px;
        height: 34px;
        border-radius: 12px;
        border: 1px solid #dce7f5;
        background: #fff;
        color: #7a8aa0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        transition: transform .2s ease, background .18s ease, color .18s ease;
    }

    .notice-item.is-open .notice-toggle-icon {
        transform: rotate(180deg);
        color: #2878d0;
        background: #eef6ff;
    }

    .notice-body {
        display: none;
        padding: 0 26px 24px 26px;
    }

    .notice-body-inner {
        padding: 18px 20px;
        border-radius: 18px;
        background: linear-gradient(180deg, #f8fbff, #ffffff);
        border: 1px solid #e9f0fa;
        color: #475569;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.75;
        letter-spacing: -0.02em;
        white-space: pre-line;
    }

    .notice-admin-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
    }

    .notice-admin-link,
    .notice-admin-delete {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 10px;
        border: 1px solid transparent;
        background: transparent;
        font-size: 12px;
        font-weight: 900;
        text-decoration: none;
        cursor: pointer;
    }

    .notice-admin-link {
        color: #2878d0;
        background: #eef6ff;
        border-color: #d8eaff;
    }

    .notice-admin-delete {
        color: #e11d48;
        background: #fff1f4;
        border-color: #ffd4de;
    }

    .notice-empty {
        padding: 64px 24px;
        text-align: center;
        color: #7b8798;
    }

    .notice-empty-mark {
        width: 54px;
        height: 54px;
        margin: 0 auto 14px;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(57, 205, 181, 0.14), rgba(74, 144, 226, 0.12));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }

    .notice-empty-title {
        color: var(--notice-ink);
        font-size: 17px;
        font-weight: 900;
        margin-bottom: 6px;
    }

    .notice-empty-desc {
        font-size: 13px;
        font-weight: 700;
        line-height: 1.6;
    }



    .notice-guide {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        margin-top: 0;
        padding: 14px 16px;
        border: 1px solid rgba(221, 231, 246, 0.68);
        border-radius: 20px;
        background:
            radial-gradient(circle at 0% 0%, rgba(57, 205, 181, 0.065), transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,251,255,0.72));
        box-shadow: 0 12px 30px rgba(74, 85, 104, 0.035);
    }

    .notice-guide-mark {
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(57, 205, 181, 0.12), rgba(74, 144, 226, 0.1));
        color: #2878d0;
        font-size: 18px;
        box-shadow: inset 0 0 0 1px rgba(74, 144, 226, 0.06);
    }

    .notice-guide-title {
        margin: 0 0 4px;
        color: #243149;
        font-size: 14px;
        font-weight: 900;
        letter-spacing: -0.035em;
    }

    .notice-guide-desc {
        margin: 0;
        color: #728096;
        font-size: 12.5px;
        font-weight: 650;
        line-height: 1.58;
        letter-spacing: -0.025em;
    }

    .notice-guide-points {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 9px;
    }

    .notice-guide-chip {
        display: inline-flex;
        align-items: center;
        height: 23px;
        padding: 0 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.64);
        border: 1px solid rgba(229, 237, 248, 0.86);
        color: #3c82cf;
        font-size: 11.5px;
        font-weight: 850;
        letter-spacing: -0.025em;
    }

    @media (max-width: 768px) {
        .notice-page {
            padding: 92px 16px 42px;
        }
        .notice-hero {
            align-items: flex-start;
            flex-direction: column;
            gap: 16px;
        }
        .notice-title-main {
            font-size: 28px;
        }
        .notice-admin-write {
            width: 100%;
        }
        .notice-summary {
            padding: 20px 18px;
            gap: 12px;
        }
        .notice-body {
            padding: 0 18px 20px;
        }
        .notice-guide {
            grid-template-columns: 1fr;
            padding: 14px;
        }
    }
</style>

<%@ include file="../common/header.jsp"%>

<main class="notice-page">
    <div class="notice-shell">
        <section class="notice-hero">
            <div>
                <div class="notice-eyebrow">MOYO 안내</div>
                <h1 class="notice-title-main">공지사항</h1>
                <p class="notice-subtitle">MOYO의 업데이트, 운영 안내, 중요한 소식을 한 곳에서 확인하세요.</p>
            </div>
            <c:if test="${sessionScope.user.userRole == 'ADMIN'}">
                <a href="/admin/notice/writeForm" class="notice-admin-write">+ 공지 작성</a>
            </c:if>
        </section>

        <section class="notice-panel" aria-label="공지사항 목록">
            <c:choose>
                <c:when test="${empty noticeList}">
                    <div class="notice-empty">
                        <div class="notice-empty-mark">📢</div>
                        <div class="notice-empty-title">등록된 공지사항이 없습니다.</div>
                        <div class="notice-empty-desc">새로운 안내가 등록되면 이곳에서 확인할 수 있어요.</div>
                    </div>
                </c:when>
                <c:otherwise>
                    <ul class="notice-list">
                        <c:forEach var="notice" items="${noticeList}">
                            <li class="notice-item" id="notice-${notice.noticeId}">
                                <div class="notice-summary" onclick="toggleNotice(this)">
                                    <div class="notice-info">
                                        <div class="notice-title-row">
                                            <c:if test="${notice.isPinned == 'Y'}"><span class="badge-pin">고정</span></c:if>
                                            <div class="notice-title">${notice.title}</div>
                                        </div>
                                        <div class="notice-meta">
                                            <span>공지사항</span>
                                            <span class="notice-meta-dot"></span>
                                            <span><fmt:formatDate value="${notice.regDt}" pattern="yyyy.MM.dd" /></span>
                                        </div>
                                    </div>
                                    <span class="notice-toggle-icon">⌄</span>
                                </div>
                                <div class="notice-body">
                                    <div class="notice-body-inner">${notice.content}</div>
                                    <c:if test="${sessionScope.user.userRole == 'ADMIN'}">
                                        <div class="notice-admin-actions">
                                            <a href="/admin/notice/noticeEdit?noticeId=${notice.noticeId}" class="notice-admin-link" onclick="event.stopPropagation();">수정</a>
                                            <button type="button" onclick="deleteNotice(${notice.noticeId}, event)" class="notice-admin-delete">삭제</button>
                                        </div>
                                    </c:if>
                                </div>
                            </li>
                        </c:forEach>
                    </ul>
                </c:otherwise>
            </c:choose>
        </section>

        <aside class="notice-guide" aria-label="공지사항 안내">
            <div class="notice-guide-mark">💡</div>
            <div>
                <div class="notice-guide-title">MOYO 공지사항은 이렇게 안내돼요.</div>
                <p class="notice-guide-desc">서비스 업데이트, 운영 안내, 중요한 변경 사항을 한 곳에서 확인할 수 있습니다. 필요한 경우 알림과 함께 안내돼요.</p>
                <div class="notice-guide-points">
                    <span class="notice-guide-chip">서비스 업데이트</span>
                    <span class="notice-guide-chip">운영 안내</span>
                    <span class="notice-guide-chip">중요 변경사항</span>
                    <span class="notice-guide-chip">사용자 안내</span>
                </div>
            </div>
        </aside>
    </div>
</main>

<%@ include file="../common/footer.jsp"%>

<script>
function toggleNotice(summaryElement) {
    const $item = $(summaryElement).closest('.notice-item');
    const $body = $item.find('.notice-body');

    $body.stop(true, true).slideToggle(220);
    $item.toggleClass('is-open');
}

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const openId = urlParams.get('openId');

    if (openId) {
        const $target = $('#notice-' + openId);
        if ($target.length > 0) {
            $('html, body').animate({
                scrollTop: $target.offset().top - 110
            }, 450);
            const summary = $target.find('.notice-summary')[0];
            if (summary) {
                toggleNotice(summary);
            }
        }
    }
});

function deleteNotice(noticeId, event) {
    event.stopPropagation();
    if (confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
        window.location.href = '/admin/notice/delete?noticeId=' + noticeId;
    }
}
</script>
