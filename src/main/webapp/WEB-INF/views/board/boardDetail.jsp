<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
<title>${post.title} · 게시판</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=stage3-list-ui">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/boardDetail.css?v=report-modal-v4-20260928">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonReportModal.css?v=common-report-v1-20260928">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonMemberActivityProfile.css?v=member-profile-v6-24-20260924">
</head>
<body class="moyo-board-detail-body" data-context-path="${pageContext.request.contextPath}" data-ws-id="${post.wsId}" data-current-user-id="${user.USER_ID}" data-member-activity-mode="${not empty projId ? 'PROJECT' : 'GROUP'}">
<jsp:include page="/WEB-INF/views/common/header.jsp" />
<main class="board-detail-page">
<section class="board-detail-shell">
    <header class="board-detail-top">
        <div class="board-detail-heading-row">
            <div class="board-detail-heading-copy">
                <c:url var="boardListUrl" value="${empty projId ? '/group/board/list' : '/project/board/list'}">
                    <c:param name="wsId" value="${post.wsId}" />
                    <c:param name="type" value="${post.boardType}" />
                    <c:if test="${not empty post.channelId}"><c:param name="channelId" value="${post.channelId}" /></c:if>
                    <c:if test="${not empty projId}"><c:param name="projId" value="${projId}" /></c:if>
                </c:url>
                <a class="board-detail-kicker" href="${boardListUrl}" aria-label="${empty post.channelName ? (post.boardType eq 'NOTICE' ? '공지' : '게시판') : post.channelName} 목록으로 이동">
                    <span class="board-detail-kicker-icon" aria-hidden="true"><c:choose><c:when test="${post.boardType eq 'NOTICE'}">&#128226;</c:when><c:otherwise>&#128172;</c:otherwise></c:choose></span>
                    <span>${empty post.channelName ? (post.boardType eq 'NOTICE' ? '공지' : '게시판') : post.channelName}</span>
                </a>
                <c:if test="${post.boardType eq 'NOTICE' or post.isPinned eq 'Y'}">
                    <div class="board-detail-badges">
                        <c:if test="${post.boardType eq 'NOTICE'}"><span class="detail-badge notice">공지</span></c:if>
                        <c:if test="${post.isPinned eq 'Y'}"><span class="detail-badge pinned">고정</span></c:if>
                    </div>
                </c:if>
                <h1>${post.title}</h1>
                <div class="board-detail-meta-line">
                    <div class="board-detail-meta-author">
                        <button type="button" class="detail-author-profile js-board-profile-link" data-user-id="${post.userId}" aria-label="${post.writerName} 프로필 보기">
                            <c:choose>
                                <c:when test="${not empty post.writerProfileImagePath}">
                                    <c:url var="writerProfileUrl" value="${post.writerProfileImagePath}"/>
                                    <span class="detail-author-avatar has-image"><img src="${writerProfileUrl}" alt="" loading="lazy"></span>
                                </c:when>
                                <c:otherwise><span class="detail-author-avatar is-fallback">${fn:substring(post.writerName,0,1)}</span></c:otherwise>
                            </c:choose>
                            <span class="detail-author-name">${post.writerName}</span>
                        </button>
                        <time class="board-detail-meta-time">${post.regDt}</time>
                    </div>

                    <div class="board-detail-meta-reactions" aria-label="게시글 반응 정보">
                        <span class="board-detail-meta-item" title="조회 ${post.viewCount}"><i class="fa-regular fa-eye" aria-hidden="true"></i><b>${post.viewCount}</b></span>
                        <span class="board-detail-meta-item" title="좋아요 ${post.likeCount}"><i class="fa-regular fa-heart" aria-hidden="true"></i><b>${post.likeCount}</b></span>
                        <span class="board-detail-meta-item" title="댓글 ${post.replyCount}"><i class="fa-regular fa-comment" aria-hidden="true"></i><b>${post.replyCount}</b></span>
                    </div>

                    <c:if test="${post.imageCount gt 0 or post.drawingCount gt 0 or post.videoCount gt 0 or post.linkCount gt 0 or post.documentCount gt 0}">
                        <div class="board-detail-meta-contents" aria-label="게시글 구성 정보">
                            <c:if test="${post.imageCount gt 0}"><span class="board-detail-meta-item" title="사진 ${post.imageCount}개"><i class="fa-regular fa-image" aria-hidden="true"></i><b>${post.imageCount}</b></span></c:if>
                            <c:if test="${post.drawingCount gt 0}"><span class="board-detail-meta-item" title="그림 ${post.drawingCount}개"><i class="fa-solid fa-palette" aria-hidden="true"></i><b>${post.drawingCount}</b></span></c:if>
                            <c:if test="${post.videoCount gt 0}"><span class="board-detail-meta-item" title="영상 ${post.videoCount}개"><i class="fa-regular fa-circle-play" aria-hidden="true"></i><b>${post.videoCount}</b></span></c:if>
                            <c:if test="${post.linkCount gt 0}"><span class="board-detail-meta-item" title="링크 ${post.linkCount}개"><i class="fa-solid fa-link" aria-hidden="true"></i><b>${post.linkCount}</b></span></c:if>
                            <c:if test="${post.documentCount gt 0}"><span class="board-detail-meta-item" title="파일 ${post.documentCount}개"><i class="fa-solid fa-paperclip" aria-hidden="true"></i><b>${post.documentCount}</b></span></c:if>
                        </div>
                    </c:if>
                </div>
            </div>
            <div class="board-detail-top-actions">
                <c:if test="${user.USER_ID != post.userId}"><button type="button" class="detail-quiet-action" onclick="openReportModal('POST','${post.postId}')">신고</button></c:if>
                <c:if test="${user.USER_ID == post.userId}">
                    <c:choose><c:when test="${not empty projId}"><a class="detail-sub-action" href="/group/board/modifyForm?postId=${post.postId}&wsId=${post.wsId}&projId=${projId}">수정</a></c:when><c:otherwise><a class="detail-sub-action" href="/group/board/modifyForm?postId=${post.postId}&wsId=${post.wsId}">수정</a></c:otherwise></c:choose>
                </c:if>
                <c:if test="${user.USER_ID == post.userId or canManageBoard}"><button type="button" class="detail-danger-action" onclick="confirmDelete('${post.postId}','${post.wsId}','${post.boardType}')">삭제</button></c:if>
            </div>
        </div>
        <div class="board-detail-header-rule" aria-hidden="true"></div>
    </header>

    <article class="board-detail-article">
        <div class="board-detail-content"><c:out value="${post.content}" escapeXml="false" /></div>
        <c:if test="${not empty fileList}">
            <section class="detail-files" aria-label="첨부파일">
                <div class="detail-section-label">첨부파일 <span>${post.fileCount}</span></div>
                <div class="detail-file-list"><c:forEach var="file" items="${fileList}"><a class="detail-file-item" href="/download?fileId=${file.FILE_ID}" title="${fn:escapeXml(file.DISPLAY_NAME)}"><span class="detail-file-icon" aria-hidden="true">↧</span><span class="detail-file-name">${fn:escapeXml(file.DISPLAY_NAME)}</span><span class="detail-file-size">${file.DISPLAY_SIZE}</span></a></c:forEach></div>
            </section>
        </c:if>
        <div class="board-detail-reaction-row">
            <button type="button" id="boardLikeBtn" class="detail-like-btn" onclick="toggleBoardLike()"><span id="boardLikeIcon">♡</span><span>좋아요</span><strong id="boardLikeCount">${post.likeCount}</strong></button>
        </div>
    </article>

    <section class="board-detail-comments">
        <div class="detail-comments-head"><div><span class="detail-comments-label">댓글</span><strong>${post.replyCount}</strong></div></div>
        <div class="detail-reply-compose"><textarea id="replyContent" placeholder="이야기를 이어가 보세요."></textarea><div class="detail-compose-bottom"><span>서로 편하게, 존중하며 이야기해요.</span><button class="detail-reply-submit" onclick="submitReply()">댓글 등록</button></div></div>
        <ul id="replyList" class="detail-reply-list"></ul>
    </section>

</section>
</main>

<%@ include file="../common/commonReportModal.jspf" %>
<script src="${pageContext.request.contextPath}/js/common/commonReportModal.js?v=common-report-v1-20260928"></script>
<%@ include file="../common/commonMemberActivityProfile.jspf" %>
<script src="${pageContext.request.contextPath}/js/commonProfileCropper.js?v=profile-cropper-20260924"></script>
<script src="${pageContext.request.contextPath}/js/commonMemberActivityProfile.js?v=member-profile-v6-24-20260924"></script>
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
    <script>
        function submitReply(parentReplyId, inputKey, replyToName) {
            const isChild = !!parentReplyId;
            const input = isChild
                ? document.getElementById("nestedReplyInput-" + (inputKey || parentReplyId))
                : document.getElementById("replyContent");

            const content = input ? input.value.trim() : "";
            if (!content) return alert("내용을 입력하세요.");

            const replyContent = (isChild && replyToName)
                ? "@" + String(replyToName).trim() + " " + content
                : content;

            const data = {
                postId: parseInt("${post.postId}"),
                content: replyContent,
                userId: "${user.USER_ID}",
                parentReplyId: isChild ? Number(parentReplyId) : null
            };

            fetch('/api/workspace/${post.wsId}/board/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => {
                if (!res.ok) return res.text().then(text => { throw new Error(text); });
                return res.json();
            })
            .then(res => {
                input.value = "";
                loadReplies();
            })
            .catch(err => {
                console.error("에러 발생:", err);
                alert("댓글 등록 중 서버 에러가 발생했습니다.");
            });
        }

        const boardReactionContentType = "${post.boardType}" === "NOTICE" ? "NOTICE" : "BOARD";

        window.onload = function() {
            loadReplies();
            loadBoardReactionStatus();
        };

        function loadBoardReactionStatus() {
            fetch('/api/reactions/status?contentType=' + boardReactionContentType + '&contentId=${post.postId}&reactionType=LIKE')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                updateBoardLikeButton(data.liked || data.reacted, data.likeCount || data.reactionCount || 0);
            })
            .catch(err => console.warn('게시글 좋아요 상태 조회 실패:', err));
        }

        function toggleBoardLike() {
            fetch('/api/reactions/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType: boardReactionContentType,
                    contentId: Number('${post.postId}'),
                    reactionType: 'LIKE'
                })
            })
            .then(res => {
                if (!res.ok) return res.json().then(data => { throw new Error(data.message || '좋아요 처리 실패'); });
                return res.json();
            })
            .then(data => {
                updateBoardLikeButton(data.liked || data.reacted, data.likeCount || data.reactionCount || 0);
            })
            .catch(err => {
                console.error('게시글 좋아요 처리 실패:', err);
                alert(err.message || '좋아요 처리 중 오류가 발생했습니다.');
            });
        }

        function updateBoardLikeButton(liked, count) {
            const btn = document.getElementById('boardLikeBtn');
            const icon = document.getElementById('boardLikeIcon');
            const countEl = document.getElementById('boardLikeCount');
            if (!btn || !icon || !countEl) return;
            btn.classList.toggle('liked', !!liked);
            icon.textContent = liked ? '♥' : '♡';
            countEl.textContent = count;
        }
        function openReportModal(contentType, contentId) {
            const normalizedType = contentType === 'REPLY' ? 'REPLY' : boardReactionContentType;
            const targetLabel = normalizedType === 'REPLY' ? '댓글' : '게시글';
            if (!window.CommonReportModal) {
                console.error('공통 신고 모달을 불러오지 못했습니다.');
                return;
            }
            window.CommonReportModal.open({
                targetType: normalizedType,
                targetId: contentId,
                targetLabel: targetLabel,
                endpoint: '${pageContext.request.contextPath}/api/workspace/${post.wsId}/board/report',
                buildPayload: function (report) {
                    return {
                        contentType: normalizedType,
                        contentId: Number(contentId),
                        reason: report.reason,
                        detail: report.detail
                    };
                }
            });
        }

        function toggleEditReply(replyId) {
            const textWrap = document.getElementById("reply-text-wrap-" + replyId);
            const btnWrap = document.getElementById("reply-btn-wrap-" + replyId);
            const currentContent = document.getElementById("reply-raw-text-" + replyId).textContent;

            textWrap.innerHTML = "<textarea id='edit-input-" + replyId + "' class='reply-edit-input reply-edit-textarea'></textarea>";
            document.getElementById("edit-input-" + replyId).value = currentContent;

            btnWrap.innerHTML = "<button type='button' class='reply-action-btn save' onclick='submitEditReply(" + replyId + ")'>완료</button>" +
                                "<button type='button' class='reply-action-btn muted' onclick='loadReplies()'>취소</button>";
        }

        function openInlineReplyForm(targetReplyId, parentReplyId, author, fromChild) {
            closeInlineReplyForm();
            const targetItem = document.getElementById("reply-item-" + targetReplyId);
            if (!targetItem) return;

            const form = document.createElement("div");
            form.className = "nested-reply-form" + (fromChild ? " from-child" : "");
            form.id = "nestedReplyForm-" + targetReplyId;
            form.innerHTML =
                "<div class='nested-reply-guide'><span class='nested-reply-branch' aria-hidden='true'>↳</span><span>" + escapeHtml(author) + "님에게 답글</span></div>" +
                "<div class='nested-reply-compose'>" +
                    "<textarea id='nestedReplyInput-" + targetReplyId + "' placeholder='답글을 입력하세요.'></textarea>" +
                    "<div class='nested-reply-actions'>" +
                        "<button type='button' class='reply-action-btn muted' onclick='closeInlineReplyForm()'>취소</button>" +
                        "<button type='button' class='reply-action-btn save' onclick=\"submitReply(" + parentReplyId + ", " + targetReplyId + ", " + (fromChild ? "'" + escapeJs(author) + "'" : "null") + ")\">답글 등록</button>" +
                    "</div>" +
                "</div>";
            targetItem.appendChild(form);
            document.getElementById("nestedReplyInput-" + targetReplyId).focus();
        }

        function closeInlineReplyForm() {
            const opened = document.querySelector(".nested-reply-form");
            if (opened) opened.remove();
        }

        function submitEditReply(replyId) {
            const editContent = document.getElementById("edit-input-" + replyId).value.trim();
            if (!editContent) return alert("수정할 내용을 입력해 주세요.");

            const data = {
                replyId: replyId,
                content: editContent
            };

            fetch('/api/workspace/${post.wsId}/board/reply/modify', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => {
                if (!res.ok) throw new Error("수정 실패");
                return res.json();
            })
            .then(res => {
                loadReplies();
            })
            .catch(err => {
                alert("댓글 수정 중 에러가 발생했습니다.");
                console.error(err);
            });
        }

        function deleteReply(replyId) {
            if (!confirm("이 댓글을 삭제하시겠습니까?")) return;

            fetch('/api/workspace/${post.wsId}/board/reply/' + replyId, {
                method: 'DELETE'
            })
            .then(res => {
                if (!res.ok) throw new Error("삭제 실패");
                return res.json();
            })
            .then(res => {
                loadReplies();
            })
            .catch(err => {
                alert("댓글 삭제 중 에러가 발생했습니다.");
                console.error(err);
            });
        }

		function confirmDelete(postId, wsId, boardType) {
		    if (confirm("정말로 이 게시글을 삭제하시겠습니까?\n삭제 후에도 기록은 보관되며 목록에서는 보이지 않습니다.")) {
		        const projId = "${projId}";
		        const params = {
		            postId: postId,
		            wsId: wsId,
		            boardType: boardType
		        };
		        if (projId && projId !== "") {
		            params.projId = projId;
		        }
		        window.moyoPostNavigate("/group/board/delete", params);
		    }
		}

        function loadReplies() {
            const postId = "${post.postId}";
            const currentUserId = String("${user.USER_ID}").trim();

            fetch('/api/workspace/${post.wsId}/board/' + postId + '/replies')
            .then(res => res.json())
            .then(data => {
                const list = document.getElementById("replyList");
                list.innerHTML = "";

                if (!data || data.length === 0) {
                    list.innerHTML = "<li class='reply-empty'>등록된 댓글이 없습니다.</li>";
                    return;
                }

                const replyMap = {};
                const rootReplies = [];
                data.forEach(reply => {
                    const replyId = Number(reply.REPLY_ID);
                    reply._children = [];
                    replyMap[replyId] = reply;
                });

                data.forEach(reply => {
                    const parentReplyId = reply.PARENT_REPLY_ID ? Number(reply.PARENT_REPLY_ID) : null;
                    if (parentReplyId && replyMap[parentReplyId]) {
                        replyMap[parentReplyId]._children.push(reply);
                    } else {
                        rootReplies.push(reply);
                    }
                });

                rootReplies.forEach(reply => {
                    list.appendChild(createReplyElement(reply, false, currentUserId));
                    (reply._children || []).forEach(child => {
                        list.appendChild(createReplyElement(child, true, currentUserId));
                    });
                });
            })
            .catch(err => console.error("댓글 로딩 실패:", err));
        }

        function loadReplyLikeStatus(replyId) {
            fetch('/api/reactions/status?contentType=BOARD_REPLY&contentId=' + replyId + '&reactionType=LIKE')
                .then(res => {
                    if (!res.ok) throw new Error('댓글 좋아요 상태 조회 실패');
                    return res.json();
                })
                .then(data => updateReplyLikeButton(replyId, data.liked || data.reacted, data.likeCount || data.reactionCount || 0))
                .catch(err => console.warn('댓글 좋아요 상태 조회 실패:', err));
        }

        function toggleReplyLike(replyId) {
            fetch('/api/reactions/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType: 'BOARD_REPLY',
                    contentId: replyId,
                    reactionType: 'LIKE'
                })
            })
            .then(res => {
                if (!res.ok) return res.json().then(data => { throw new Error(data.message || '댓글 좋아요 처리 실패'); });
                return res.json();
            })
            .then(data => updateReplyLikeButton(replyId, data.liked || data.reacted, data.likeCount || data.reactionCount || 0))
            .catch(err => {
                console.error('댓글 좋아요 처리 실패:', err);
                alert(err.message || '댓글 좋아요 처리 중 오류가 발생했습니다.');
            });
        }

        function updateReplyLikeButton(replyId, liked, count) {
            const button = document.getElementById('reply-like-' + replyId);
            if (!button) return;
            button.classList.toggle('liked', !!liked);
            const icon = button.querySelector('.reply-like-icon');
            const countEl = button.querySelector('.reply-like-count');
            if (icon) icon.textContent = liked ? '♥' : '♡';
            if (countEl) countEl.textContent = Number(count || 0);
            button.setAttribute('aria-pressed', liked ? 'true' : 'false');
        }

        function createReplyElement(reply, isChild, currentUserId) {
            const replyId = reply.REPLY_ID;
            const author = reply.USER_NAME || "익명";
            const profileImagePath = reply.PROFILE_IMAGE_PATH || '';
            const content = reply.CONTENT || "";
            const date = reply.REG_DT || "";
            const replyUserId = reply.USER_ID ? String(reply.USER_ID).trim() : "";

            const li = document.createElement("li");
            li.id = "reply-item-" + replyId;
            li.className = isChild ? "reply-item reply-child" : "reply-item";

            const body = document.createElement("div");
            body.className = "reply-content-area";
            body.id = "reply-text-wrap-" + replyId;

            const meta = document.createElement("div");
            meta.className = "reply-meta-line";
            const profileBtn = document.createElement('button');
            profileBtn.type = 'button';
            profileBtn.className = 'detail-reply-profile js-board-profile-link';
            profileBtn.dataset.userId = replyUserId;
            profileBtn.setAttribute('aria-label', author + ' 프로필 보기');
            const avatar = document.createElement('span');
            avatar.className = 'detail-reply-avatar ' + (profileImagePath ? 'has-image' : 'is-fallback');
            if (profileImagePath) { const img = document.createElement('img'); img.src = profileImagePath; img.alt = ''; avatar.appendChild(img); }
            else { avatar.textContent = author.substring(0, 1); }
            profileBtn.appendChild(avatar);
            if (isChild) {
                const marker = document.createElement("span");
                marker.className = "reply-child-marker";
                marker.textContent = "↳";
                meta.appendChild(marker);
            }
            const name = document.createElement("strong");
            name.textContent = author;
            profileBtn.appendChild(name);
            const dateEl = document.createElement("small");
            dateEl.textContent = date;
            meta.appendChild(profileBtn);
            meta.appendChild(dateEl);

            const text = document.createElement("div");
            text.className = "reply-text-content";
            text.id = "reply-raw-text-" + replyId;
            if (isChild && /^@\S+\s+/.test(content)) {
                const matched = content.match(/^(@\S+)\s+(.*)$/s);
                if (matched) {
                    const mention = document.createElement("span");
                    mention.className = "reply-target-mention";
                    mention.textContent = matched[1];
                    text.appendChild(mention);
                    text.appendChild(document.createTextNode(" " + matched[2]));
                } else {
                    text.textContent = content;
                }
            } else {
                text.textContent = content;
            }

            body.appendChild(meta);
            body.appendChild(text);

            const actions = document.createElement("div");
            actions.className = "reply-actions";
            actions.id = "reply-btn-wrap-" + replyId;

            actions.innerHTML += "<button type='button' id='reply-like-" + replyId + "' class='reply-action-btn reply-like-btn' aria-pressed='false' onclick='toggleReplyLike(" + replyId + ")'><span class='reply-like-icon'>♡</span><span class='reply-like-count'>0</span></button>";
            const rootParentId = isChild && reply.PARENT_REPLY_ID ? Number(reply.PARENT_REPLY_ID) : Number(replyId);
            actions.innerHTML += "<button type='button' class='reply-action-btn reply' onclick=\"openInlineReplyForm(" + replyId + ", " + rootParentId + ", '" + escapeJs(author) + "', " + (isChild ? "true" : "false") + ")\">답글</button>";
            if (currentUserId && replyUserId && currentUserId === replyUserId) {
                actions.innerHTML += "<button type='button' class='reply-action-btn edit' onclick='toggleEditReply(" + replyId + ")'>수정</button>" +
                                     "<button type='button' class='reply-action-btn delete' onclick='deleteReply(" + replyId + ")'>삭제</button>";
            }
            if (!(currentUserId && replyUserId && currentUserId === replyUserId)) {
                actions.innerHTML += "<button type='button' class='reply-action-btn report' onclick=\"openReportModal('REPLY', " + replyId + ")\">신고</button>";
            }

            li.appendChild(body);
            li.appendChild(actions);
            window.setTimeout(() => loadReplyLikeStatus(replyId), 0);
            return li;
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function escapeJs(value) {
            return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"');
        }
    </script>

</body>
</html>
