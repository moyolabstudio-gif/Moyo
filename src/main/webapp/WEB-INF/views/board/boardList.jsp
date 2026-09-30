<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>${currentChannelName} · 게시판</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=stage3-list-ui">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardList.css?v=board-final-20260928">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardChannelManage.css?v=board-channel-final-20260928">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberActivityProfile.css?v=member-profile-v6-24-20260924">
</head>
<body class="moyo-board-v2-body" data-context-path="${pageContext.request.contextPath}" data-ws-id="${wsId}" data-current-user-id="${user.USER_ID}" data-member-activity-mode="${not empty projId ? 'PROJECT' : 'GROUP'}">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="board-v2-page">
    <section class="board-v2-shell" aria-labelledby="boardPageTitle">
        <header class="board-v2-head">
            <div class="board-v2-title-row">
                <div class="board-v2-title-copy">
                    <div class="board-v2-kicker">
                        <span class="board-v2-kicker-icon" aria-hidden="true"><c:choose><c:when test="${boardType eq 'NOTICE'}">&#x1F4E2;</c:when><c:otherwise>&#x1F4AC;</c:otherwise></c:choose></span>
                        <span class="board-v2-section-name">게시판</span>
                    </div>
                    <h1 id="boardPageTitle">${currentChannelName}</h1>
                    <p>
                        <c:choose>
                            <c:when test="${boardType eq 'NOTICE'}">구성원이 꼭 알아야 할 소식과 안내를 확인해요.</c:when>
                            <c:otherwise>함께 나누고 싶은 이야기와 정보를 편하게 남겨요.</c:otherwise>
                        </c:choose>
                    </p>
                </div>

                <div class="board-v2-actions">
                    <c:if test="${canManageBoard}">
                        <button type="button" class="board-v2-sub-action" data-board-channel-open>
                            <span class="board-v2-manage-glyph" aria-hidden="true">≡</span>
                            <span>게시판 관리</span>
                        </button>
                        <c:choose>
                            <c:when test="${not empty projId}">
                                <a href="/group/board/reports?wsId=${wsId}&projId=${projId}" class="board-v2-report-action ${reportWaitingCount > 0 ? 'has-pending' : ''}">
                                    <span class="board-v2-report-glyph" aria-hidden="true">!</span>
                                    <span>신고 관리</span>
                                    <c:if test="${reportWaitingCount > 0}"><span class="board-v2-report-count" aria-label="대기 신고 ${reportWaitingCount}건">${reportWaitingCount}</span></c:if>
                                </a>
                            </c:when>
                            <c:otherwise>
                                <a href="/group/board/reports?wsId=${wsId}" class="board-v2-report-action ${reportWaitingCount > 0 ? 'has-pending' : ''}">
                                    <span class="board-v2-report-glyph" aria-hidden="true">!</span>
                                    <span>신고 관리</span>
                                    <c:if test="${reportWaitingCount > 0}"><span class="board-v2-report-count" aria-label="대기 신고 ${reportWaitingCount}건">${reportWaitingCount}</span></c:if>
                                </a>
                            </c:otherwise>
                        </c:choose>
                    </c:if>

                    <c:if test="${boardType ne 'NOTICE' or canManageBoard}">
                        <c:choose>
                            <c:when test="${not empty projId}">
                                <c:if test="${not projectReadOnly}">
                                    <a href="/group/board/write?wsId=${wsId}&projId=${projId}&type=${boardType}&channelId=${channelId}" class="board-v2-write-btn">
                                        <span aria-hidden="true">＋</span><span>글쓰기</span>
                                    </a>
                                </c:if>
                            </c:when>
                            <c:otherwise>
                                <a href="/group/board/write?wsId=${wsId}&type=${boardType}&channelId=${channelId}" class="board-v2-write-btn">
                                    <span aria-hidden="true">＋</span><span>글쓰기</span>
                                </a>
                            </c:otherwise>
                        </c:choose>
                    </c:if>
                </div>
            </div>
        </header>

        <div class="board-v2-channel-row">
            <nav class="board-v2-tabs" aria-label="게시판 분류">
                <div class="board-v2-tabs-scroll">
                    <c:forEach var="channel" items="${boardChannels}">
                        <c:set var="tabType" value="${channel.CHANNEL_TYPE eq 'NOTICE' ? 'NOTICE' : 'FREE'}" />
                        <c:choose>
                            <c:when test="${not empty projId}">
                                <a class="board-v2-tab ${channel.CHANNEL_ID eq channelId ? 'active' : ''} ${channel.CHANNEL_TYPE eq 'NOTICE' ? 'notice' : ''}"
                                   href="/project/board/list?projId=${projId}&wsId=${wsId}&channelId=${channel.CHANNEL_ID}&type=${tabType}">
                                    <c:if test="${channel.CHANNEL_TYPE eq 'NOTICE'}"><span class="board-v2-tab-dot" aria-hidden="true"></span></c:if>
                                    <span>${channel.CHANNEL_NAME}</span>
                                </a>
                            </c:when>
                            <c:otherwise>
                                <a class="board-v2-tab ${channel.CHANNEL_ID eq channelId ? 'active' : ''} ${channel.CHANNEL_TYPE eq 'NOTICE' ? 'notice' : ''}"
                                   href="/group/board/list?wsId=${wsId}&channelId=${channel.CHANNEL_ID}&type=${tabType}">
                                    <c:if test="${channel.CHANNEL_TYPE eq 'NOTICE'}"><span class="board-v2-tab-dot" aria-hidden="true"></span></c:if>
                                    <span>${channel.CHANNEL_NAME}</span>
                                </a>
                            </c:otherwise>
                        </c:choose>
                    </c:forEach>
                </div>
            </nav>
        </div>
    </section>

    <section class="board-v2-toolbar">
        <div class="board-v2-count">
            <span class="board-v2-count-label">이야기</span>
            <span class="board-v2-count-number">${totalCount}</span>
            <c:if test="${not empty keyword}"><span class="board-v2-search-result">‘${keyword}’ 검색 결과</span></c:if>
        </div>

        <c:choose>
            <c:when test="${not empty projId}">
                <form class="board-v2-search" method="get" action="/project/board/list">
                    <input type="hidden" name="projId" value="${projId}">
                    <input type="hidden" name="wsId" value="${wsId}">
                    <input type="hidden" name="type" value="${boardType}">
                    <input type="hidden" name="channelId" value="${channelId}">
                    <input type="hidden" name="size" value="${size}">
                    <div class="board-v2-search-scope" data-search-scope>
                        <input type="hidden" name="searchType" value="${empty searchType ? 'all' : searchType}" data-search-scope-input>
                        <button class="board-v2-search-scope-toggle" type="button" aria-haspopup="listbox" aria-expanded="false" data-search-scope-toggle>
                            <span data-search-scope-label>
                                <c:choose>
                                    <c:when test="${searchType eq 'title'}">제목</c:when>
                                    <c:when test="${searchType eq 'content'}">내용</c:when>
                                    <c:when test="${searchType eq 'writer'}">작성자</c:when>
                                    <c:otherwise>전체</c:otherwise>
                                </c:choose>
                            </span>
                            <span class="board-v2-search-scope-chevron" aria-hidden="true"></span>
                        </button>
                        <div class="board-v2-search-scope-menu" role="listbox" aria-label="검색 범위" hidden data-search-scope-menu>
                            <button type="button" role="option" data-value="all" class="${empty searchType or searchType eq 'all' ? 'active' : ''}">전체</button>
                            <button type="button" role="option" data-value="title" class="${searchType eq 'title' ? 'active' : ''}">제목</button>
                            <button type="button" role="option" data-value="content" class="${searchType eq 'content' ? 'active' : ''}">내용</button>
                            <button type="button" role="option" data-value="writer" class="${searchType eq 'writer' ? 'active' : ''}">작성자</button>
                        </div>
                    </div>
                    <span class="board-v2-search-divider" aria-hidden="true"></span>
                    <span class="board-v2-search-symbol" aria-hidden="true"></span>
                    <input class="board-v2-search-input" type="search" name="keyword" value="${keyword}" placeholder="${currentChannelName}에서 검색" autocomplete="off">
                    <button class="board-v2-search-submit" type="submit">검색</button>
                    <c:if test="${not empty keyword}">
                        <a class="board-v2-search-reset" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&channelId=${channelId}">초기화</a>
                    </c:if>
                </form>
            </c:when>
            <c:otherwise>
                <form class="board-v2-search" method="get" action="/group/board/list">
                    <input type="hidden" name="wsId" value="${wsId}">
                    <input type="hidden" name="type" value="${boardType}">
                    <input type="hidden" name="channelId" value="${channelId}">
                    <input type="hidden" name="size" value="${size}">
                    <div class="board-v2-search-scope" data-search-scope>
                        <input type="hidden" name="searchType" value="${empty searchType ? 'all' : searchType}" data-search-scope-input>
                        <button class="board-v2-search-scope-toggle" type="button" aria-haspopup="listbox" aria-expanded="false" data-search-scope-toggle>
                            <span data-search-scope-label>
                                <c:choose>
                                    <c:when test="${searchType eq 'title'}">제목</c:when>
                                    <c:when test="${searchType eq 'content'}">내용</c:when>
                                    <c:when test="${searchType eq 'writer'}">작성자</c:when>
                                    <c:otherwise>전체</c:otherwise>
                                </c:choose>
                            </span>
                            <span class="board-v2-search-scope-chevron" aria-hidden="true"></span>
                        </button>
                        <div class="board-v2-search-scope-menu" role="listbox" aria-label="검색 범위" hidden data-search-scope-menu>
                            <button type="button" role="option" data-value="all" class="${empty searchType or searchType eq 'all' ? 'active' : ''}">전체</button>
                            <button type="button" role="option" data-value="title" class="${searchType eq 'title' ? 'active' : ''}">제목</button>
                            <button type="button" role="option" data-value="content" class="${searchType eq 'content' ? 'active' : ''}">내용</button>
                            <button type="button" role="option" data-value="writer" class="${searchType eq 'writer' ? 'active' : ''}">작성자</button>
                        </div>
                    </div>
                    <span class="board-v2-search-divider" aria-hidden="true"></span>
                    <span class="board-v2-search-symbol" aria-hidden="true"></span>
                    <input class="board-v2-search-input" type="search" name="keyword" value="${keyword}" placeholder="${currentChannelName}에서 검색" autocomplete="off">
                    <button class="board-v2-search-submit" type="submit">검색</button>
                    <c:if test="${not empty keyword}">
                        <a class="board-v2-search-reset" href="/group/board/list?wsId=${wsId}&type=${boardType}&channelId=${channelId}">초기화</a>
                    </c:if>
                </form>
            </c:otherwise>
        </c:choose>
    </section>

    <section class="board-v2-feed ${empty boardList ? 'is-empty' : ''}" aria-label="게시글 목록">
        <c:choose>
            <c:when test="${not empty boardList}">
                <c:forEach var="post" items="${boardList}">
                    <article class="board-v2-post ${post.isPinned eq 'Y' ? 'pinned' : ''} ${boardType eq 'NOTICE' ? 'notice-post' : ''}">
                        <c:choose>
                            <c:when test="${not empty projId}">
                                <a class="board-v2-post-overlay" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}&projId=${projId}" aria-label="${post.title}"></a>
                            </c:when>
                            <c:otherwise>
                                <a class="board-v2-post-overlay" href="/group/board/detail?postId=${post.postId}&wsId=${wsId}" aria-label="${post.title}"></a>
                            </c:otherwise>
                        </c:choose>

                        <div class="board-v2-post-main">
                            <c:if test="${boardType eq 'NOTICE' or post.isPinned eq 'Y'}">
                                <div class="board-v2-badges">
                                    <c:if test="${boardType eq 'NOTICE'}"><span class="board-v2-badge notice">공지</span></c:if>
                                    <c:if test="${post.isPinned eq 'Y'}"><span class="board-v2-badge pinned">고정</span></c:if>
                                </div>
                            </c:if>

                            <div class="board-v2-post-heading">
                                <div class="board-v2-post-heading-left">
                                    <h2 class="board-v2-post-title">${post.title}</h2>
                                    <c:if test="${post.imageCount gt 0 or post.drawingCount gt 0 or post.videoCount gt 0 or post.linkCount gt 0 or post.documentCount gt 0}">
                                        <div class="board-v2-content-meta" aria-label="게시글 구성 정보">
                                            <c:if test="${post.imageCount gt 0}"><span title="사진 ${post.imageCount}개"><i class="fa-regular fa-image" aria-hidden="true"></i><span>${post.imageCount}</span></span></c:if>
                                            <c:if test="${post.drawingCount gt 0}"><span title="그림 ${post.drawingCount}개"><i class="fa-regular fa-image" aria-hidden="true"></i><span>${post.drawingCount}</span></span></c:if>
                                            <c:if test="${post.videoCount gt 0}"><span title="영상 ${post.videoCount}개"><i class="fa-regular fa-circle-play" aria-hidden="true"></i><span>${post.videoCount}</span></span></c:if>
                                            <c:if test="${post.linkCount gt 0}"><span title="링크 ${post.linkCount}개"><i class="fa-solid fa-link" aria-hidden="true"></i><span>${post.linkCount}</span></span></c:if>
                                            <c:if test="${post.documentCount gt 0}"><span title="파일 ${post.documentCount}개"><i class="fa-solid fa-paperclip" aria-hidden="true"></i><span>${post.documentCount}</span></span></c:if>
                                        </div>
                                    </c:if>
                                </div>
                                <time class="board-v2-date">${post.regDt}</time>
                            </div>

                            <div class="board-v2-post-bottom">
                                <div class="board-v2-post-meta-left">
                                    <button type="button" class="board-v2-author js-board-profile-link" data-user-id="${post.userId}" aria-label="${post.writerName} 프로필 보기">
                                        <c:choose>
                                            <c:when test="${not empty post.writerProfileImagePath}">
                                                <c:url var="writerProfileUrl" value="${post.writerProfileImagePath}"/>
                                                <span class="board-v2-avatar has-image" aria-hidden="true">
                                                    <img src="${writerProfileUrl}" alt="" loading="lazy">
                                                </span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="board-v2-avatar" aria-hidden="true">${fn:substring(post.writerName, 0, 1)}</span>
                                            </c:otherwise>
                                        </c:choose>
                                        <span class="board-v2-author-name">${post.writerName}</span>
                                    </button>
                                </div>
                                <ul class="board-v2-metrics" aria-label="게시글 반응 정보">
                                    <li class="board-v2-metric board-v2-metric-view" title="조회">
                                        <i class="board-v2-eye" aria-hidden="true"></i><span>${post.viewCount}</span>
                                    </li>
                                    <li class="board-v2-metric board-v2-metric-like" title="좋아요">
                                        <i class="board-v2-heart" aria-hidden="true"></i><span>${post.likeCount}</span>
                                    </li>
                                    <li class="board-v2-metric board-v2-metric-comment" title="댓글">
                                        <i class="board-v2-comment" aria-hidden="true"></i><span>${post.replyCount}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <span class="board-v2-chevron" aria-hidden="true">›</span>
                    </article>
                </c:forEach>
            </c:when>
            <c:otherwise>
                <div class="board-v2-empty ${boardType eq 'NOTICE' ? 'notice' : ''}">
                    <div class="board-v2-empty-mark" aria-hidden="true">
                        <c:choose>
                            <c:when test="${not empty keyword}"><span class="board-v2-empty-search"></span></c:when>
                            <c:when test="${boardType eq 'NOTICE'}"><span class="board-v2-empty-megaphone">!</span></c:when>
                            <c:otherwise><span class="board-v2-empty-bubble"></span></c:otherwise>
                        </c:choose>
                    </div>
                    <strong>
                        <c:choose>
                            <c:when test="${not empty keyword}">검색 결과가 없어요</c:when>
                            <c:when test="${boardType eq 'NOTICE'}">아직 등록된 공지가 없어요</c:when>
                            <c:otherwise>아직 작성된 글이 없어요</c:otherwise>
                        </c:choose>
                    </strong>
                    <p>
                        <c:choose>
                            <c:when test="${not empty keyword}">다른 검색어로 다시 찾아보거나 검색을 초기화해보세요.</c:when>
                            <c:when test="${boardType eq 'NOTICE' and canManageBoard}">구성원에게 전할 첫 공지를 등록해보세요.</c:when>
                            <c:when test="${boardType eq 'NOTICE'}">새 공지가 등록되면 이곳에서 바로 확인할 수 있어요.</c:when>
                            <c:otherwise>이 공간의 첫 이야기를 남겨보세요.</c:otherwise>
                        </c:choose>
                    </p>

                    <c:if test="${not empty keyword}">
                        <c:choose>
                            <c:when test="${not empty projId}">
                                <a class="board-v2-empty-btn secondary" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&channelId=${channelId}">검색 초기화</a>
                            </c:when>
                            <c:otherwise>
                                <a class="board-v2-empty-btn secondary" href="/group/board/list?wsId=${wsId}&type=${boardType}&channelId=${channelId}">검색 초기화</a>
                            </c:otherwise>
                        </c:choose>
                    </c:if>
                </div>
            </c:otherwise>
        </c:choose>
    </section>

    <c:if test="${totalPages > 1}">
        <nav class="board-v2-pagination" aria-label="게시판 페이지">
            <c:choose>
                <c:when test="${not empty projId}">
                    <a class="board-v2-page-nav ${!hasPrev ? 'disabled' : ''}" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&channelId=${channelId}&page=${page - 1}&size=${size}&searchType=${searchType}&keyword=${keyword}" aria-label="이전 페이지">‹</a>
                    <c:forEach var="p" begin="${startPage}" end="${endPage}">
                        <a class="board-v2-page-number ${p == page ? 'active' : ''}" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&channelId=${channelId}&page=${p}&size=${size}&searchType=${searchType}&keyword=${keyword}">${p}</a>
                    </c:forEach>
                    <a class="board-v2-page-nav ${!hasNext ? 'disabled' : ''}" href="/project/board/list?projId=${projId}&wsId=${wsId}&type=${boardType}&channelId=${channelId}&page=${page + 1}&size=${size}&searchType=${searchType}&keyword=${keyword}" aria-label="다음 페이지">›</a>
                </c:when>
                <c:otherwise>
                    <a class="board-v2-page-nav ${!hasPrev ? 'disabled' : ''}" href="/group/board/list?wsId=${wsId}&type=${boardType}&channelId=${channelId}&page=${page - 1}&size=${size}&searchType=${searchType}&keyword=${keyword}" aria-label="이전 페이지">‹</a>
                    <c:forEach var="p" begin="${startPage}" end="${endPage}">
                        <a class="board-v2-page-number ${p == page ? 'active' : ''}" href="/group/board/list?wsId=${wsId}&type=${boardType}&channelId=${channelId}&page=${p}&size=${size}&searchType=${searchType}&keyword=${keyword}">${p}</a>
                    </c:forEach>
                    <a class="board-v2-page-nav ${!hasNext ? 'disabled' : ''}" href="/group/board/list?wsId=${wsId}&type=${boardType}&channelId=${channelId}&page=${page + 1}&size=${size}&searchType=${searchType}&keyword=${keyword}" aria-label="다음 페이지">›</a>
                </c:otherwise>
            </c:choose>
        </nav>
    </c:if>
</main>

<c:if test="${canManageBoard}">
<c:set var="generalChannelCount" value="0" />
<c:forEach var="channelCountItem" items="${manageChannels}">
    <c:if test="${channelCountItem.CHANNEL_TYPE eq 'GENERAL'}">
        <c:set var="generalChannelCount" value="${generalChannelCount + 1}" />
    </c:if>
</c:forEach>
<div class="board-channel-modal" data-board-channel-modal hidden
     data-ws-id="${wsId}" data-proj-id="${projId}" data-general-count="${generalChannelCount}">
    <div class="board-channel-backdrop" data-board-channel-close></div>
    <section class="board-channel-dialog" role="dialog" aria-modal="true" aria-labelledby="boardChannelTitle">
        <header class="board-channel-dialog-head">
            <div class="board-channel-dialog-title">
                <strong id="boardChannelTitle">게시판 관리</strong>
                <span>공지와 일반 게시판을 정리할 수 있어요.</span>
            </div>
            <button type="button" class="board-channel-close" data-board-channel-close aria-label="닫기">×</button>
        </header>

        <div class="board-channel-create-block">
            <div class="board-channel-create-head">
                <div>
                    <strong>새 게시판</strong>
                    <span>자유게시판 · 이벤트 · 공략 · 건의사항처럼 필요한 분류를 추가해보세요.</span>
                </div>
                <span class="board-channel-limit"><b data-board-channel-count>${generalChannelCount}</b>/5</span>
            </div>
            <div class="board-channel-create">
                <div class="board-channel-create-input-wrap">
                    <input type="text" maxlength="20" placeholder="게시판 이름" data-board-channel-new autocomplete="off">
                    <span class="board-channel-char-count"><b data-board-channel-char-count>0</b>/20</span>
                </div>
                <button type="button" data-board-channel-create ${generalChannelCount ge 5 ? 'disabled' : ''}>추가</button>
            </div>
            <p class="board-channel-feedback" data-board-channel-feedback role="status" aria-live="polite" hidden></p>
        </div>

        <div class="board-channel-section board-channel-notice-section">
            <div class="board-channel-section-head">
                <div>
                    <strong>공지</strong>
                    <span>항상 맨 앞에 표시되며 이름 변경·숨김·삭제가 불가능합니다.</span>
                </div>
            </div>
            <c:forEach var="channel" items="${manageChannels}">
                <c:if test="${channel.CHANNEL_TYPE eq 'NOTICE'}">
                    <div class="board-channel-system-row">
                        <span class="board-channel-system-icon" aria-hidden="true">!</span>
                        <div class="board-channel-system-line">
                            <strong>${channel.CHANNEL_NAME}</strong>
                            <span>관리자 전용</span>
                        </div>
                        <span class="board-channel-system-chip">고정</span>
                    </div>
                </c:if>
            </c:forEach>
        </div>

        <div class="board-channel-section board-channel-general-section">
            <div class="board-channel-section-head">
                <div>
                    <strong>일반 게시판</strong>
                    <span>드래그해서 노출 순서를 바꿀 수 있어요.</span>
                </div>
            </div>

            <div class="board-channel-manage-list" data-board-channel-list>
                <c:forEach var="channel" items="${manageChannels}">
                    <c:if test="${channel.CHANNEL_TYPE eq 'GENERAL'}">
                        <div class="board-channel-manage-row ${channel.ACTIVE_YN eq 'N' ? 'inactive' : ''}"
                             draggable="true"
                             data-channel-id="${channel.CHANNEL_ID}"
                             data-channel-type="GENERAL"
                             data-original-name="${fn:escapeXml(channel.CHANNEL_NAME)}">
                            <div class="board-channel-row-main">
                                <button type="button" class="board-channel-drag" aria-label="${channel.CHANNEL_NAME} 순서 이동" title="드래그해서 순서 변경">⋮⋮</button>
                                <div class="board-channel-name-field">
                                    <input class="board-channel-name-input" type="text" maxlength="20" value="${fn:escapeXml(channel.CHANNEL_NAME)}" aria-label="게시판 이름">
                                </div>
                                <div class="board-channel-row-actions">
                                    <button type="button" class="board-channel-save-btn" data-action="rename" hidden>저장</button>
                                    <div class="board-channel-visibility-control">
                                        <span class="board-channel-row-state" data-board-channel-state>${channel.ACTIVE_YN eq 'Y' ? '표시 중' : '숨김'}</span>
                                        <button type="button" class="board-channel-visibility-toggle ${channel.ACTIVE_YN eq 'Y' ? 'on' : ''}"
                                            data-action="toggle" aria-pressed="${channel.ACTIVE_YN eq 'Y' ? 'true' : 'false'}"
                                            aria-label="${channel.CHANNEL_NAME} ${channel.ACTIVE_YN eq 'Y' ? '숨기기' : '표시하기'}">
                                            <span class="board-channel-toggle-track"><i></i></span>
                                        </button>
                                    </div>
                                    <button type="button" class="board-channel-delete-btn" data-action="delete-open" aria-label="${channel.CHANNEL_NAME} 삭제">삭제</button>
                                </div>
                            </div>

                            <div class="board-channel-delete-panel" hidden>
                                <div class="board-channel-delete-copy">
                                    <strong data-delete-title>이 게시판을 삭제할까요?</strong>
                                    <span data-delete-message>삭제 기록은 남고, 게시글이 있으면 다른 게시판으로 옮긴 뒤 삭제해요.</span>
                                </div>
                                <div class="board-channel-delete-actions">
                                    <select class="board-channel-move-target" title="삭제 전 게시글 이동 대상" hidden>
                                        <option value="">이동할 게시판 선택</option>
                                        <c:forEach var="target" items="${manageChannels}">
                                            <c:if test="${target.CHANNEL_ID ne channel.CHANNEL_ID && target.ACTIVE_YN eq 'Y' && target.CHANNEL_TYPE eq 'GENERAL'}">
                                                <option value="${target.CHANNEL_ID}">${target.CHANNEL_NAME}</option>
                                            </c:if>
                                        </c:forEach>
                                    </select>
                                    <button type="button" class="board-channel-panel-btn" data-action="delete-cancel">취소</button>
                                    <button type="button" class="board-channel-panel-btn danger" data-action="delete-confirm">삭제</button>
                                </div>
                            </div>
                        </div>
                    </c:if>
                </c:forEach>
            </div>
        </div>

        <footer class="board-channel-dialog-foot">
            <span>숨김은 게시글을 삭제하지 않으며, 삭제·이동·순서 변경은 최근활동에 기록돼요.</span>
        </footer>
    </section>
</div>
</c:if>

<script>
(() => {
    const scopes = document.querySelectorAll('[data-search-scope]');
    if (!scopes.length) return;

    const closeAll = (except) => {
        scopes.forEach((scope) => {
            if (scope === except) return;
            const menu = scope.querySelector('[data-search-scope-menu]');
            const toggle = scope.querySelector('[data-search-scope-toggle]');
            if (menu) menu.hidden = true;
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
            scope.classList.remove('open');
        });
    };

    scopes.forEach((scope) => {
        const toggle = scope.querySelector('[data-search-scope-toggle]');
        const menu = scope.querySelector('[data-search-scope-menu]');
        const input = scope.querySelector('[data-search-scope-input]');
        const label = scope.querySelector('[data-search-scope-label]');
        const options = [...menu.querySelectorAll('[data-value]')];

        toggle.addEventListener('click', () => {
            const willOpen = menu.hidden;
            closeAll(scope);
            menu.hidden = !willOpen;
            toggle.setAttribute('aria-expanded', String(willOpen));
            scope.classList.toggle('open', willOpen);
            if (willOpen) {
                const active = menu.querySelector('.active') || options[0];
                active?.focus();
            }
        });

        options.forEach((option) => {
            option.addEventListener('click', () => {
                input.value = option.dataset.value;
                label.textContent = option.textContent.trim();
                options.forEach((item) => item.classList.toggle('active', item === option));
                menu.hidden = true;
                toggle.setAttribute('aria-expanded', 'false');
                scope.classList.remove('open');
                toggle.focus();
            });
        });

        scope.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                menu.hidden = true;
                toggle.setAttribute('aria-expanded', 'false');
                scope.classList.remove('open');
                toggle.focus();
                return;
            }
            if (menu.hidden || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
            event.preventDefault();
            const current = options.indexOf(document.activeElement);
            const delta = event.key === 'ArrowDown' ? 1 : -1;
            const next = current < 0 ? 0 : (current + delta + options.length) % options.length;
            options[next].focus();
        });
    });

    document.addEventListener('click', (event) => {
        if (![...scopes].some((scope) => scope.contains(event.target))) closeAll();
    });
})();
</script>

<script src="${pageContext.request.contextPath}/js/boardChannelManage.js?v=board-channel-v2-20260928"></script>
<%@ include file="../common/commonMemberActivityProfile.jspf" %>
<script defer src="${pageContext.request.contextPath}/js/commonMemberActivityProfile.js?v=member-profile-v6-24-20260924"></script>
<script>
(function(){
  function openBoardProfile(userId){
    const id=String(userId||'').trim(); if(!id) return;
    const wsId=String(document.body.dataset.wsId||'').trim();
    if(wsId && window.MemberActivityProfile && typeof window.MemberActivityProfile.open==='function'){ window.MemberActivityProfile.open(id); return; }
    location.href=(document.body.dataset.contextPath||'')+'/users/profile?userId='+encodeURIComponent(id);
  }
  document.addEventListener('click',function(e){ const el=e.target.closest('.js-board-profile-link'); if(!el) return; e.preventDefault(); e.stopPropagation(); openBoardProfile(el.dataset.userId); });
})();
</script>
<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
