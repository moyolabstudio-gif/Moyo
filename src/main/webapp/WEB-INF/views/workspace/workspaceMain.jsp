<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>워크스페이스</title>
    <script>
		function searchUser() {
		    // 1. 인풋 박스 엘리먼트를 정확히 가져오는지 확인
		    const emailInput = document.getElementById('searchEmail');
		    const email = emailInput.value.trim(); // trim()으로 앞뒤 공백 제거
		    
		    const userListDiv = document.getElementById('userList');
		    
		    // 2. 검색어가 없으면 요청조차 보내지 않도록 방어 코드 추가
		    if (email.length < 2) {
		        alert("검색어를 2자 이상 입력해주세요.");
		        return;
		    }
		    
		    console.log("검색 시작:", email); // 브라우저 콘솔에서 확인용

		   fetch(`/workspace/api/search-member?email=\${encodeURIComponent(email)}`)
		        .then(res => {
		            if (!res.ok) throw new Error("네트워크 응답 에러");
		            return res.json();
		        })
		        .then(data => {
		            userListDiv.innerHTML = ''; 
		            
		            if (data.length === 0) {
		                userListDiv.innerHTML = '<p style="padding:10px;">검색 결과가 없습니다.</p>';
		                return;
		            }

		            data.forEach(user => {
		                const userItem = document.createElement('div');
		                userItem.style = "border-bottom: 1px solid #eee; padding: 10px; display: flex; justify-content: space-between; align-items: center;";
						userItem.innerHTML = `
						    <span>\${user.userName} (\${user.email})</span>
						    <button type="button" onclick="inviteUser('\${user.email}')" style="padding: 5px 10px; cursor:pointer;">초대</button>
						`;
		                userListDiv.appendChild(userItem);
		            });
		        })
		        .catch(err => {
		            console.error("검색 중 오류 발생:", err);
		            userListDiv.innerHTML = '<p style="color:red; padding:10px;">서버 통신 오류가 발생했습니다.</p>';
		        });
		}

        function openInviteModal() {
            const modal = document.getElementById('inviteModal');
            modal.style.display = (modal.style.display === 'none') ? 'block' : 'none';
        }

		function inviteUser(inviteeEmail) {
		    const wsId = "${workspace.wsId}";
		    
		    // 아까 성공했던 fetch 주소와 설정 그대로 적용!
		    fetch('/workspace/api/invite', {
		        method: 'POST',
		        headers: { 'Content-Type': 'application/json' },
		        body: JSON.stringify({ 
		            wsId: parseInt(wsId), // 숫자로 확실히 변환
		            email: inviteeEmail 
		        })
		    })
		    .then(res => res.json())
		    .then(result => {
		        if(result.status === 'SUCCESS') {
		            alert('초대장을 보냈습니다!');
		            openInviteModal(); 
		            // location.reload(); // 초대는 대기 상태이므로 굳이 리로드 안 해도 됨
		        } else if(result.status === 'ALREADY_EXISTS') {
		            alert('이미 멤버이거나 초대 대기 중인 사용자입니다.');
		        } else {
		            alert('초대 처리 중 오류가 발생했습니다.');
		        }
		    })
		    .catch(err => {
		        console.error("초대 중 에러:", err);
		        alert("서버 통신 오류가 발생했습니다.");
		    });
		}
		function removeMember(userId, userName) {
		    // 백틱 대신 일반 문자열(+)로 연결해서 확실하게 출력
		   if(!confirm("정말 " + userName + " 님을 워크스페이스에서 제외하시겠습니까?")) return;

		    const wsId = "${workspace.wsId}";
		    const params = new URLSearchParams();
		    params.append('wsId', wsId);
		    params.append('userId', userId);

		    fetch(`/workspace/api/remove-member`, {
		        method: 'POST',
		        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		        body: params
		    })
		    .then(res => res.text())
		    .then(result => {
		        if(result === 'success') {
		            alert('제외 완료되었습니다.');
		            location.reload();
		        } else {
		            alert('제외 처리 중 오류가 발생했습니다.');
		        }
		    });
		}
		function transferAdmin(userId, userName) {
		    // 백틱(`)을 사용하고 변수 앞에 \를 붙였습니다.
		    if(!confirm(`정말 \${userName} 님에게 관리자 권한을 넘기시겠습니까?\n위임 후에는 관리자 기능을 사용할 수 없습니다.`)) return;

		    const wsId = "${workspace.wsId}"; // 이건 서버 데이터니까 \ 없이 그대로 둡니다.
		    
		    const params = new URLSearchParams();
		    params.append('wsId', wsId);
		    params.append('newAdminId', userId);

		    fetch('/workspace/api/transfer-admin', { 
		        method: 'POST', 
		        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		        body: params
		    })
		    .then(res => {
		        if(res.status === 405) {
		            alert("서버 설정 오류(405): POST 방식을 지원하지 않습니다.");
		        }
		        return res.text();
		    })
		    .then(result => {
		        if(result === 'success') {
		            alert('관리자 권한이 위임되었습니다.');
		            location.reload();
		        } else {
		            alert('위임 처리 중 오류가 발생했습니다.');
		        }
		    })
		    .catch(err => console.error("Error:", err));
		}
		function leaveWorkspace() {
		           if(!confirm("정말 이 워크스페이스를 탈퇴하시겠습니까?")) return;
		           const wsId = "${workspace.wsId}";
		           const params = new URLSearchParams();
		           params.append('wsId', wsId);

				   fetch('/workspace/api/leave', { // 위 방법 1로 컨트롤러를 고쳤을 때 이 주소를 사용하세요
				       method: 'POST',
				       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				       body: params
				   })
		           .then(res => res.text())
		           .then(result => {
		               if(result === 'SUCCESS') {
		                   alert('탈퇴 완료되었습니다.');
		                   location.href = '/workspace/list';
		               } else {
		                   alert('탈퇴 처리 중 오류가 발생했습니다.');
		               }
		           });
		       }
	</script>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    
    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        
        <%-- 권한 체크 로직 --%>
        <c:set var="isWorkspaceAdmin" value="false" />
        <c:forEach var="m" items="${memberList}">
            <c:if test="${m.USER_ID == user.userId && m.WS_ROLE == 'ADMIN'}">
                <c:set var="isWorkspaceAdmin" value="true" />
            </c:if>
        </c:forEach>

        <div class="header-area" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h2 style="margin: 0;">🚀 ${workspace.wsName} 작업 공간</h2>
            <c:if test="${isWorkspaceAdmin}">
                <button type="button" class="btn-invite" onclick="openInviteModal()" 
                        style="padding: 10px 20px; background-color: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    👥 멤버 초대하기
                </button>
            </c:if>
        </div>
        <hr style="border: 0; height: 1px; background: #eee; margin-bottom: 30px;">

        <div id="inviteModal" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px; border-radius: 12px; border: 1px solid #ddd; z-index: 1000; width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">👥 멤버 초대</h3>
                <button type="button" onclick="openInviteModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <input type="text" id="searchEmail" placeholder="초대할 유저 이메일 입력" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <button type="button" onclick="searchUser()" style="padding: 10px 15px; background: #333; color: white; border: none; border-radius: 4px; cursor:pointer;">검색</button>
            </div>
            <div id="userList" style="max-height: 250px; overflow-y: auto; border-top: 1px solid #eee; padding-top: 10px;"></div>
        </div>

        <div style="display: flex; gap: 40px; align-items: flex-start;">
            <div style="flex: 3;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 20px;">📂 프로젝트 목록</h3>
                    <c:if test="${isWorkspaceAdmin}">
                        <a href="/project/create?wsId=${workspace.wsId}" style="text-decoration: none; color: #4A90E2; font-weight: bold; font-size: 14px;">[+] 새 프로젝트 추가</a>
                    </c:if>
                </div>
                <div class="project-grid" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <c:choose>
                        <c:when test="${not empty projectList}">
                            <c:forEach var="project" items="${projectList}">
                                <div class="project-card" style="border: 1px solid #eee; padding: 25px; border-radius: 12px; width: calc(50% - 10px); min-width: 250px; box-sizing: border-box; background: #fff;">
                                    <h4 style="margin-top: 0; font-size: 18px; color: #333;">${project.projName}</h4>
                                    <p style="color: #888; font-size: 12px; margin-bottom: 20px;">ID: ${project.projId}</p>
									<%-- ?projId 뒤에 &wsId=${workspace.wsId}를 추가합니다 --%>
									<a href="/project/main?projId=${project.projId}&wsId=${workspace.wsId}" style="display: inline-block; color: #4A90E2; text-decoration: none; font-weight: bold; font-size: 14px;">작업실 입장 →</a>
                                </div>
                            </c:forEach>
                        </c:when>
                        <c:otherwise>
                            <p style="color: #999;">아직 등록된 프로젝트가 없습니다.</p>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>

            <div style="flex: 1; min-width: 300px; background: #f8f9fa; border-radius: 15px; padding: 25px; border: 1px solid #eee;">
                <h3 style="margin-top: 0; margin-bottom: 25px; font-size: 18px;">👥 참여 멤버 <span style="background: #4A90E2; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">${memberList.size()}</span></h3>
                <div class="member-list">
                    <c:forEach var="mem" items="${memberList}">
                        <div style="padding: 15px 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px;">
                            <div style="width: 38px; height: 38px; background: #4A90E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; flex-shrink: 0;">
                                ${mem.USER_NAME.substring(0,1)}
                            </div>
                            <div style="flex: 1; overflow: hidden;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div style="font-weight: bold; font-size: 14px;">
                                        ${mem.USER_NAME}
                                        <c:if test="${mem.WS_ROLE eq 'ADMIN'}">
                                            <span style="font-size: 10px; background: #E1F5FE; color: #0288D1; padding: 2px 6px; border-radius: 4px; display: block; margin-top: 2px; width: fit-content;">관리자</span>
                                        </c:if>
                                    </div>
                                    <c:if test="${isWorkspaceAdmin && mem.WS_ROLE ne 'ADMIN'}">
                                        <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-end;">
                                            <button type="button" onclick="transferAdmin('${mem.USER_ID}', '${mem.USER_NAME}')" 
                                                    style="background: white; border: 1px solid #4A90E2; color: #4A90E2; cursor: pointer; font-size: 11px; padding: 2px 6px; border-radius: 3px;">위임</button>
                                            <button type="button" onclick="removeMember('${mem.USER_ID}', '${mem.USER_NAME}')" 
                                                    style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 11px; font-weight: bold; padding: 0;">제외</button>
                                        </div>
                                    </c:if>
                                </div>
                                <div style="font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 5px;">
                                    ${mem.EMAIL}
                                </div>
                            </div>
                        </div>
                    </c:forEach>
                </div>

                <%-- 탈퇴 버튼 --%>
                <c:if test="${not isWorkspaceAdmin}">
                    <div style="margin-top: 25px; border-top: 1px dashed #ddd; padding-top: 15px;">
                        <button type="button" onclick="leaveWorkspace()" 
                                style="width: 100%; padding: 10px; background: white; border: 1px solid #ff4d4d; color: #ff4d4d; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px;">
                            🏃 워크스페이스 탈퇴하기
                        </button>
                    </div>
                </c:if>
            </div>
        </div>
    </div>
</body>
</html>