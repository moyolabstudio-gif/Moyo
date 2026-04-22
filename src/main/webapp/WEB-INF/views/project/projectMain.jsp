<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<html>
<head>
<title>프로젝트 대시보드</title>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script>
    // 1. 모달 열기 및 초대 가능 멤버 목록 조회
    function openAssignModal() {
        const urlParams = new URLSearchParams(window.location.search);
        const wsId = urlParams.get('wsId'); 
        const projId = urlParams.get('projId');

        if (!wsId || !projId) {
            alert("ID 정보를 가져올 수 없습니다. URL을 확인해주세요.");
            return;
        }

        fetch(`/project/api/assignable-members?wsId=${wsId}&projId=${projId}`)
            .then(res => res.json())
            .then(data => {
                console.log("서버에서 받은 데이터:", data);
                
                const listDiv = document.getElementById('assignableList');
                listDiv.innerHTML = ''; // 기존 목록을 깨끗이 비워 '공윤재' 유령을 제거합니다.

                if (!data || data.length === 0) {
                    listDiv.innerHTML = '<p class="text-center p-3">초대할 수 있는 멤버가 없습니다.</p>';
                } else {
                    data.forEach(user => {
                        // DB 키값이 대문자(USER_ID, USER_NAME)이므로 정확히 매핑합니다.
						listDiv.innerHTML += `
						    <label class="list-group-item">
						        <input class="form-check-input me-1 member-check" type="checkbox" value="\${user.USER_ID}">
						        \${user.USER_NAME} (\${user.EMAIL})
						    </label>
						`;
                    });
                }

                const modalElement = document.getElementById('assignMemberModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            })
            .catch(err => {
                console.error("로드 실패:", err);
                alert("멤버 목록을 불러오는 중 오류가 발생했습니다.");
            });
    }

    // 2. 선택한 멤버 서버로 전송
    function submitAssign() {
        const urlParams = new URLSearchParams(window.location.search);
        const projId = urlParams.get('projId'); 
        
        const selectedUsers = Array.from(document.querySelectorAll('.member-check:checked')).map(el => el.value);
        
        if (selectedUsers.length === 0) {
            alert("멤버를 한 명 이상 선택해주세요.");
            return;
        }

        const params = new URLSearchParams();
        params.append('projId', projId);
        selectedUsers.forEach(id => params.append('userIds', id));

        fetch('/project/api/add-members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        })
        .then(res => res.text())
		.then(result => {
		    if (result === 'SUCCESS') {
		        alert('멤버가 성공적으로 추가되었습니다.');
		        location.reload(); 
		    } else if (result === 'ALREADY_EXISTS') {
		        alert('이미 프로젝트에 참여 중인 멤버입니다.');
		    } else {
		        alert('멤버 추가 중 알 수 없는 오류가 발생했습니다.');
		    }
		});
    }
</script>
</head>
<body>
    <div class="container mt-4">
        <h1>🚀 프로젝트 상세 페이지 (# ${projId})</h1>
        <p class="text-muted">Moyo 프로젝트의 협업 공간입니다.</p>
        
        <div class="d-flex justify-content-between align-items-center mb-4">
            <a href="/workspace/main?wsId=${wsId}" class="btn btn-outline-secondary">← 워크스페이스로 돌아가기</a>
            <button type="button" class="btn btn-primary" onclick="openAssignModal()">+ 프로젝트 멤버 추가</button>
        </div>

        <div class="row">
            <div class="col-md-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">👥 참여 멤버</h5>
                    </div>
                    <ul class="list-group list-group-flush">
                        <c:forEach var="member" items="${projectMemberList}">
                            <li class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${member.USER_NAME}</strong>
                                        <div class="small text-muted">${member.EMAIL}</div>
                                    </div>
                                    <span class="badge bg-info text-dark rounded-pill">${member.PROJ_ROLE}</span>
                                </div>
                            </li>
                        </c:forEach>
                        <c:if test="${empty projectMemberList}">
                            <li class="list-group-item text-center text-muted py-4">참여 중인 멤버가 없습니다.</li>
                        </c:if>
                    </ul>
                </div>
            </div>

            <div class="col-md-8">
                <div class="card shadow-sm p-5 text-center text-muted">
                    <h4 class="mb-3">업무 및 칸반 보드</h4>
                    <p>이곳에 프로젝트의 상세 업무(Task) 목록이 구현될 예정입니다.</p>
                    <div class="mt-4 p-5 border border-dashed rounded text-secondary" style="border-style: dashed !important;">
                        준비 중인 영역입니다.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="assignMemberModal" tabindex="-1" aria-labelledby="assignMemberModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="assignMemberModalLabel">프로젝트 멤버 초대</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="small text-muted mb-3">워크스페이스 멤버 중 초대할 사람을 선택하세요.</p>
                    <div id="assignableList" class="list-group" style="max-height: 300px; overflow-y: auto;">
                        <p class="text-center">목록을 불러오는 중...</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                    <button type="button" class="btn btn-primary" onclick="submitAssign()">추가하기</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>