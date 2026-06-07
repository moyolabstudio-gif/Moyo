<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %> 
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>게시글 상세</title>
    <style>
        .page-container { padding: 40px 0; background-color: #f9f9f9; }
        .detail-card { max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; color: #333; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .info-row { font-size: 14px; color: #888; margin-bottom: 30px; }
        .content-body { min-height: 300px; font-size: 16px; line-height: 1.7; color: #444; margin-bottom: 40px; }
        
        /* 댓글 레이아웃 및 디자인 고도화 */
        .reply-list-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        #replyList { list-style: none; padding-left: 0; }
        #replyList li { padding: 15px 0; border-bottom: 1px dashed #eee; font-size: 15px; display: flex; justify-content: space-between; align-items: center; }
        .reply-content-area { flex: 1; margin-right: 20px; }
        
        /* 댓글 수정 인풋창 스타일 */
        .reply-edit-input { width: 80%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
        
        /* 미니 액션 버튼 스타일 */
        .reply-actions a { font-size: 12px; color: #888; text-decoration: none; margin-left: 8px; cursor: pointer; }
        .reply-actions a:hover { color: #333; text-decoration: underline; }
        .reply-actions a.delete-action:hover { color: #d9534f; }

        .reply-box { background: #f4f4f4; padding: 20px; border-radius: 8px; margin-top: 20px; }
        textarea { width: 100%; height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; resize: none; }
        .btn-submit { display: block; margin: 10px 0 0 auto; background: #333; color: #fff; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>

    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="page-container">
        <div class="detail-card">
            <h1>${post.title}</h1>
            <div class="info-row">
                작성자: ${post.writerName} | 조회수: ${post.viewCount} | 작성일: ${post.regDt}
            </div>
            
            <div class="content-body">
                ${post.content}
            </div>
			<div class="file-section" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
			    <label style="font-weight:bold; color:#555;">📎 첨부파일</label>
			    <ul style="list-style: none; padding: 0; margin-top: 10px;">
			        <c:choose>
			            <c:when test="${not empty fileList}">
			                <c:forEach var="file" items="${fileList}">
			                    <li style="margin-bottom: 5px;">
			                        <a href="/download?fileId=${file.FILE_ID}" style="text-decoration:none; color:#4A90E2;">
			                            💾 ${file.FILE_ORIGINAL_NAME} (${file.FILE_SIZE} bytes)
			                        </a>
			                    </li>
			                </c:forEach>
			            </c:when>
			            <c:otherwise>
			                <li style="color:#999; font-size:13px;">첨부된 파일이 없습니다.</li>
			            </c:otherwise>
			        </c:choose>
			    </ul>
			</div>
            <c:if test="${user.USER_ID == post.userId}">
                <div class="btn-group" style="margin-top: 20px; float: right; margin-bottom: 20px;">
                    <a href="/group/board/modifyForm?postId=${post.postId}&wsId=${post.wsId}" class="btn-modify" style="padding: 10px 20px; background: #f0ad4e; color: #fff; text-decoration: none; border-radius: 5px; margin-right: 10px;">수정하기</a>
                    <a href="javascript:void(0);" onclick="confirmDelete('${post.postId}', '${post.wsId}', '${post.boardType}')" class="btn-delete" style="padding: 10px 20px; background: #d9534f; color: #fff; text-decoration: none; border-radius: 5px;">삭제하기</a>
                </div>
                <div style="clear:both;"></div>
            </c:if>

            <div class="reply-list-section">
                <h3>댓글 목록</h3>
                <ul id="replyList"></ul>
            </div>

            <div class="reply-box">
                <textarea id="replyContent" placeholder="댓글을 입력하세요."></textarea>
                <button class="btn-submit" onclick="submitReply()">댓글 등록</button>
            </div>
        </div>
    </div>
	
    <script>
		// 1. 새 댓글 등록
		function submitReply() {
		    const content = document.getElementById("replyContent").value.trim();
		    if (!content) return alert("내용을 입력하세요.");

		    const data = {
		        postId: parseInt("${post.postId}"),
		        content: content,
		        userId: "${user.USER_ID}"
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
		        alert("등록 성공!");
		        document.getElementById("replyContent").value = "";
		        loadReplies();
		    })
		    .catch(err => {
		        console.error("에러 발생:", err);
		        alert("서버 에러 발생!");
		    });
		}

		window.onload = function() {
		    loadReplies();
		};


		// 3. 댓글 수정 모드 토글 (인라인 체인지)
		function toggleEditReply(replyId) {
		    const textWrap = document.getElementById("reply-text-wrap-" + replyId);
		    const btnWrap = document.getElementById("reply-btn-wrap-" + replyId);
		    
		    // 기존에 채워져 있던 텍스트 컨텐트 그대로 추출
		    const currentContent = document.getElementById("reply-raw-text-" + replyId).textContent;
		    
		    // 인풋창 양식으로 체인지
		    textWrap.innerHTML = "<input type='text' id='edit-input-" + replyId + "' class='reply-edit-input'>";
		    document.getElementById("edit-input-" + replyId).value = currentContent; // 안전하게 값 대입
		    
		    // 버튼 상태를 [완료/취소]로 전환
		    btnWrap.innerHTML = "<a onclick='submitEditReply(" + replyId + ")' style='color:#5cb85c; font-weight:bold;'>완료</a>" +
		                         "<a onclick='loadReplies()' style='color:#aaa;'>취소</a>";
		}

		// 4. 댓글 수정 실행 (API 요청)
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
		        loadReplies(); // 완벽하게 새로고침
		    })
		    .catch(err => {
		        alert("댓글 수정 중 에러가 발생했습니다.");
		        console.error(err);
		    });
		}

		// 5. 댓글 삭제 실행 (API 요청)
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
		        loadReplies(); // 완벽하게 새로고침
		    })
		    .catch(err => {
		        alert("댓글 삭제 중 에러가 발생했습니다.");
		        console.error(err);
		    });
		}

		// 게시글 삭제용 원본 함수
		function confirmDelete(postId, wsId, boardType) {
		    if (confirm("정말로 이 게시글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
		        location.href = "/group/board/delete?postId=" + postId + "&wsId=" + wsId + "&boardType=" + boardType;
		    }
		}
		function loadReplies() {
		    const postId = "${post.postId}";
		    // 💡 세션 유저 ID와 댓글 작성자 ID 비교를 위해 확실하게 trim 및 String 처리
		    const currentUserId = String("${user.USER_ID}").trim(); 

		    fetch('/api/workspace/${post.wsId}/board/' + postId + '/replies')
		    .then(res => res.json())
		    .then(data => {
		        const list = document.getElementById("replyList");
		        list.innerHTML = ""; 
		        
		        data.forEach(reply => {
		            const replyId = reply.REPLY_ID;
		            const author = reply.USER_NAME || "익명";
		            const content = reply.CONTENT || "";
		            const date = reply.REG_DT || "";
		            // 🚀 이제 XML에서 USER_ID를 주기 때문에 정상적으로 읽힙니다.
		            const replyUserId = reply.USER_ID ? String(reply.USER_ID).trim() : ""; 

		            const li = document.createElement("li");
		            li.id = "reply-item-" + replyId;
		            
		            let html = "<div class='reply-content-area' id='reply-text-wrap-" + replyId + "'>" +
		                       "<strong>" + author + "</strong>: <span class='reply-text-content' id='reply-raw-text-" + replyId + "'></span>" +
		                       " <small style='color:#aaa; margin-left:10px;'>(" + date + ")</small>" +
		                       "</div>";
		            
		            // 🛡️ 두 ID가 모두 존재하고 일치할 때 버튼 노출
		            if (currentUserId && replyUserId && currentUserId === replyUserId) {
		                html += "<div class='reply-actions' id='reply-btn-wrap-" + replyId + "'>" +
		                        "<a onclick='toggleEditReply(" + replyId + ")'>수정</a>" +
		                        "<a class='delete-action' onclick='deleteReply(" + replyId + ")'>삭제</a>" +
		                        "</div>";
		            }
		            
		            li.innerHTML = html;
		            list.appendChild(li);

		            document.getElementById("reply-raw-text-" + replyId).textContent = content;
		        });
		    })
		    .catch(err => console.error("댓글 로딩 실패:", err));
		}
    </script>
</body>
</html>