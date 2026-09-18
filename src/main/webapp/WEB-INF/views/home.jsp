<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOYO - MOYO에 모여</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/home.css?v=moyo-home-final-v38">
</head>
<body class="moyo-home-body ${empty sessionScope.user ? 'is-guest' : 'is-auth'}">
    <%@ include file="common/header.jsp"%>

    <main class="moyo-home-main">
        <section class="moyo-home-hero" aria-labelledby="moyoHomeTitle">
            <div class="moyo-home-hero-bg" aria-hidden="true">
                <span class="moyo-home-orb orb-blue"></span>
                <span class="moyo-home-orb orb-mint"></span>
                <span class="moyo-home-orb orb-purple"></span>
                <span class="moyo-home-grid-pattern"></span>
            </div>

            <div class="moyo-home-container moyo-home-hero-inner">
                <div class="moyo-home-hero-copy">
                    <div class="moyo-home-brand-chip">
                        <img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" class="moyo-home-chip-mark">
                        <span>MOYO에 모여</span>
                    </div>

                    <h1 id="moyoHomeTitle" class="moyo-home-title">
                        <span class="title-emphasis">MOYO에 모여,</span>
                        <span class="title-main">일정·기록·사람</span>
                        <span class="title-main">그룹과 프로젝트까지</span>
                        <span class="title-gradient">함께 이어지는 공간</span>
                    </h1>

                    <p class="moyo-home-subtitle">
                        일정과 기록부터 친구, 그룹, 프로젝트까지.<br>
                        필요한 사람과 자료, 소통과 실행의 흐름을 한곳에서 자연스럽게 이어보세요.
                    </p>

                    <div class="moyo-home-actions">
                        <c:choose>
                            <c:when test="${not empty sessionScope.user}">
                                <a href="${pageContext.request.contextPath}/calendar?scope=PRIVATE&amp;calendarContext=PERSONAL" class="moyo-home-btn primary">내 캘린더 열기</a>
                                <a href="${pageContext.request.contextPath}/requests" class="moyo-home-btn ghost">요청함 확인</a>
                            </c:when>
                            <c:otherwise>
                                <a href="${pageContext.request.contextPath}/users/joinForm" class="moyo-home-btn primary">지금 시작하기</a>
                                <a href="${pageContext.request.contextPath}/users/loginForm" class="moyo-home-btn ghost">로그인</a>
                            </c:otherwise>
                        </c:choose>
                    </div>

                    <div class="moyo-home-proof-row" aria-label="MOYO 주요 기능">
                        <span><b>Calendar</b> 일정·계획</span>
                        <span><b>Record</b> 기록·자료</span>
                        <span><b>Group</b> 친구·그룹</span>
                        <span><b>Project</b> 협업·실행</span>
                    </div>
                </div>

                <div class="moyo-home-visual" aria-label="MOYO 화면 미리보기">
                    <div class="moyo-home-logo-float">
                        <img src="${pageContext.request.contextPath}/brand/moyo_logo.png" alt="MOYO">
                    </div>

                    <div class="moyo-home-device-card">
                        <div class="moyo-home-device-top">
                            <span></span><span></span><span></span>
                            <strong>Today in MOYO</strong>
                        </div>

                        <div class="moyo-home-dashboard-grid">
                            <article class="moyo-home-preview-card calendar-card">
                                <div class="preview-head">
                                    <span class="preview-icon">📅</span>
                                    <strong>오늘의 일정</strong>
                                </div>
                                <div class="mini-calendar">
                                    <span></span><span></span><span class="active"></span><span></span><span></span><span class="mint"></span><span></span>
                                </div>
                                <p>오후 3:00 · 프로젝트 회의</p>
                            </article>

                            <article class="moyo-home-preview-card note-card">
                                <div class="preview-head">
                                    <span class="preview-icon">📝</span>
                                    <strong>기록과 자료</strong>
                                </div>
                                <div class="note-lines">
                                    <span></span><span></span><span></span>
                                </div>
                                <p>노트 · 파일 · 링크를 한곳에</p>
                            </article>

                            <article class="moyo-home-preview-card photo-card">
                                <div class="preview-head">
                                    <span class="preview-icon">🖼️</span>
                                    <strong>친구와 그룹</strong>
                                </div>
                                <div class="photo-stack">
                                    <span></span><span></span><span></span>
                                </div>
                                <p>필요한 사람들과 함께 연결</p>
                            </article>

                            <article class="moyo-home-preview-card project-card">
                                <div class="preview-head">
                                    <span class="preview-icon">🚀</span>
                                    <strong>프로젝트</strong>
                                </div>
                                <div class="project-progress"><span></span></div>
                                <p>그룹 안에서 목표를 구체적으로</p>
                            </article>
                        </div>
                    </div>

                    <div class="moyo-home-mascot-card">
                        <img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="MOYO 마스코트">
                        <span>모이면 더 쉬워져요</span>
                    </div>
                </div>
            </div>
        </section>

        <section id="moyo-experience" class="moyo-home-section moyo-home-scope-section">
            <div class="moyo-home-container">
                <div class="moyo-home-section-head centered">
                    <span class="moyo-home-eyebrow">MOYO SPACE</span>
                    <h2>혼자 기록하고, 친구와 나누고,<br>그룹과 프로젝트로 함께 이어져요.</h2>
                    <p>개인·친구·그룹·프로젝트라는 공간에 따라 일정, 기록, 자료와 소통의 맥락이 자연스럽게 달라집니다.</p>
                </div>

                <div class="moyo-home-scope-grid">
                    <article class="moyo-home-scope-card personal">
                        <div class="scope-visual"><span class="scope-icon calendar-icon" aria-hidden="true"></span></div>
                        <h3>개인</h3>
                        <p>나만의 일정과 기록을 조용히 정리하고,<br>필요한 순간에만 공유해요.</p>
                    </article>
                    <article class="moyo-home-scope-card friend">
                        <div class="scope-visual"><span class="scope-icon friend-icon" aria-hidden="true"></span></div>
                        <h3>친구</h3>
                        <p>사진과 추억을 가까운 사람들과<br>가볍게 나누고 함께 남겨요.</p>
                    </article>
                    <article class="moyo-home-scope-card group">
                        <div class="scope-visual"><span class="scope-icon group-icon" aria-hidden="true"></span></div>
                        <h3>그룹</h3>
                        <p>멤버들과 일정, 기록, 게시판과 투표를<br>한 공간에서 함께 관리해요.</p>
                    </article>
                    <article class="moyo-home-scope-card project">
                        <div class="scope-visual"><span class="scope-icon project-icon" aria-hidden="true"></span></div>
                        <h3>프로젝트</h3>
                        <p>그룹 안의 목표와 작업을 더 구체적인<br>실행 흐름으로 이어가요.</p>
                    </article>
                </div>

                <div class="moyo-home-scope-bridge">
                    <span></span>
                    <p>일정, 기록, 사람과 프로젝트가 하나의 흐름으로 이어집니다.</p>
                    <span></span>
                </div>
            </div>
        </section>

        <section class="moyo-home-section moyo-home-showcase-section">
            <div class="moyo-home-container moyo-home-showcase-inner">
                <div class="moyo-home-showcase-copy">
                    <span class="moyo-home-eyebrow">ALL IN ONE FLOW</span>
                    <h2>따로 흩어진 기능이 아니라,<br>하나의 흐름으로 모입니다.</h2>
                    <p>
                        일정에서 시작한 일이 기록과 자료로 남고,<br>
                        친구와 그룹의 소통을 거쳐 프로젝트 실행으로 이어집니다.<br>
                        MOYO는 그 흐름을 한곳에 연결합니다.
                    </p>
                </div>

                <div class="moyo-home-feature-wall">
                    <article class="moyo-home-feature-card big calendar">
                        <span class="feature-badge">Schedule</span>
                        <h3>일정과 계획</h3>
                        <p>개인·그룹·프로젝트 일정을 한 캘린더에서 구분하고 계획까지 이어가요.</p>
                        <div class="feature-art calendar-art" aria-hidden="true">
                            <div class="calendar-art-top">
                                <span></span><span></span><span></span>
                            </div>
                            <div class="calendar-art-days">
                                <span></span><span></span><span class="active"></span><span></span><span class="mint"></span>
                            </div>
                            <div class="calendar-art-list">
                                <i></i><em></em>
                                <i></i><em></em>
                            </div>
                        </div>
                    </article>
                    <article class="moyo-home-feature-card note">
                        <span class="feature-badge">Record</span>
                        <h3>기록과 자료</h3>
                        <p>노트·사진·파일·링크·장소를 폴더로 정리하고 필요한 범위에 공유해요.</p>
                        <div class="feature-art note-art" aria-hidden="true">
                            <span></span><span></span><span></span>
                            <em>기록</em><em>자료</em>
                        </div>
                    </article>
                    <article class="moyo-home-feature-card photo">
                        <span class="feature-badge">People</span>
                        <h3>친구와 그룹</h3>
                        <p>친구의 업데이트를 확인하고, 그룹에서는 멤버들과 같은 맥락으로 함께해요.</p>
                        <div class="feature-art photo-art" aria-hidden="true">
                            <span></span><span></span><span></span>
                        </div>
                    </article>
                    <article class="moyo-home-feature-card share">
                        <span class="feature-badge">Notice</span>
                        <h3>알림과 소통</h3>
                        <p>요청과 알림을 확인하고, 공지·자유글·자료실·투표로 의견과 소식을 나눠요.</p>
                        <div class="feature-art share-art" aria-hidden="true">
                            <span></span><i></i><span></span><i></i><span></span>
                        </div>
                    </article>
                    <article class="moyo-home-feature-card project-flow">
                        <span class="feature-badge">Project</span>
                        <h3>프로젝트 협업</h3>
                        <p>개인 프로젝트부터 그룹 프로젝트까지, 기간 계획·주간 계획·업무와 기록을 실제 실행 흐름으로 연결해요.</p>
                        <div class="feature-art project-flow-art" aria-hidden="true">
                            <span><i></i></span>
                            <span><i></i></span>
                            <span><i></i></span>
                        </div>
                    </article>
                </div>
            </div>
        </section>


        <section class="moyo-home-section moyo-home-depth-section">
            <div class="moyo-home-container">
                <div class="moyo-home-section-head centered">
                    <span class="moyo-home-eyebrow">COMMUNITY & WORK</span>
                    <h2>모임은 더 활발하게,<br>프로젝트는 더 구체적으로.</h2>
                    <p>그룹은 함께 소통하는 커뮤니티가 되고, 프로젝트는 목표와 작업을 실행하는 공간이 됩니다.</p>
                </div>

                <div class="moyo-home-depth-grid">
                    <article class="moyo-home-depth-card group-community">
                        <div class="depth-copy">
                            <span class="depth-label">Group Community</span>
                            <h3>그룹은 함께 소통하는<br>커뮤니티가 됩니다.</h3>
                            <p>
                                공지와 자유 피드, 자료실, 투표로<br>
                                소식을 나누고 의견을 모아요.
                            </p>
                            <div class="depth-tags" aria-label="그룹 주요 기능">
                                <span>공지</span>
                                <span>자유 피드</span>
                                <span>자료실</span>
                                <span>투표</span>
                            </div>
                        </div>
                        <div class="depth-visual community-visual" aria-hidden="true">
                            <div class="community-post notice">
                                <strong>공지</strong>
                                <span></span><span></span>
                            </div>
                            <div class="community-post feed">
                                <i></i>
                                <div><span></span><span></span></div>
                            </div>
                            <div class="community-poll">
                                <strong>투표</strong>
                                <em></em><em></em>
                            </div>
                        </div>
                    </article>

                    <article class="moyo-home-depth-card project-work">
                        <div class="depth-copy">
                            <span class="depth-label">Project Work</span>
                            <h3>프로젝트는 실행을 관리하는<br>작업 공간이 됩니다.</h3>
                            <p>
                                간트차트, 주간계획표, 할 일로<br>
                                공유하고 지시하며 진행을 확인해요.
                            </p>
                            <div class="depth-tags" aria-label="프로젝트 주요 기능">
                                <span>간트차트</span>
                                <span>주간계획표</span>
                                <span>할 일</span>
                                <span>공유·지시</span>
                            </div>
                        </div>
                        <div class="depth-visual project-visual" aria-hidden="true">
                            <div class="gantt-row"><span></span><em></em></div>
                            <div class="gantt-row"><span></span><em></em></div>
                            <div class="week-plan">
                                <i></i><i></i><i></i><i></i><i></i>
                            </div>
                            <div class="todo-mini">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section class="moyo-home-section moyo-home-flow-section">
            <div class="moyo-home-container">
                <div class="moyo-home-section-head">
                    <span class="moyo-home-eyebrow">HOW IT WORKS</span>
                    <h2>MOYO에 모이는 방식</h2>
                </div>

                <div class="moyo-home-flow-list">
                    <div class="moyo-home-flow-item personal">
                        <span class="flow-number">01</span>
                        <span class="flow-icon" aria-hidden="true"><i></i></span>
                        <strong>개인 공간에서 시작</strong>
                        <p>나만의 일정과 기록을 먼저 정리합니다.</p>
                    </div>
                    <div class="moyo-home-flow-item friend">
                        <span class="flow-number">02</span>
                        <span class="flow-icon" aria-hidden="true"><i></i></span>
                        <strong>친구와 가볍게 공유</strong>
                        <p>사진과 약속을 가까운 사람들과<br>가볍게 공유합니다.</p>
                    </div>
                    <div class="moyo-home-flow-item group">
                        <span class="flow-number">03</span>
                        <span class="flow-icon" aria-hidden="true"><i></i></span>
                        <strong>그룹으로 함께 관리</strong>
                        <p>멤버들과 일정, 노트, 앨범을 함께 봅니다.</p>
                    </div>
                    <div class="moyo-home-flow-item project">
                        <span class="flow-number">04</span>
                        <span class="flow-icon" aria-hidden="true"><i></i></span>
                        <strong>프로젝트로 실행</strong>
                        <p>목표와 작업을 프로젝트 단위로 구체화합니다.</p>
                    </div>
                </div>
                <p class="moyo-home-flow-bridge">작은 기록이 함께하는 흐름으로 이어집니다.</p>
            </div>
        </section>

        <section class="moyo-home-final-cta">
            <div class="moyo-home-container moyo-home-final-inner">
                <div class="moyo-home-final-message">
                    <img src="${pageContext.request.contextPath}/brand/moyo_mark.png?v=moyo-mark-v34" alt="" class="moyo-home-final-mark">
                    <div class="moyo-home-final-copy">
                        <span class="moyo-home-eyebrow">MOYO에 모여</span>
                        <h2>함께하는 모든 순간을<br>하나의 공간에 모아보세요.</h2>
                    </div>
                </div>
                <c:choose>
                    <c:when test="${not empty sessionScope.user}">
                        <a href="${pageContext.request.contextPath}/calendar?scope=PRIVATE&amp;calendarContext=PERSONAL" class="moyo-home-btn primary">내 캘린더 열기</a>
                    </c:when>
                    <c:otherwise>
                        <a href="${pageContext.request.contextPath}/users/joinForm" class="moyo-home-btn primary">MOYO 시작하기</a>
                    </c:otherwise>
                </c:choose>
            </div>
        </section>
    </main>

    <%@ include file="common/footer.jsp"%>
</body>
</html>
