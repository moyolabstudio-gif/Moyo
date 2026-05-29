<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>⚙️ ${workspace.wsName} - 그룹 설정 수정</title>
    <style>
        .settings-container {
            max-width: 600px;
            margin: 50px auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 40px;
            border: 1px solid #eef0f2;
            box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            box-sizing: border-box;
        }
        
        .settings-title {
            font-size: 24px;
            font-weight: bold;
            color: #111;
            margin-top: 0;
            margin-bottom: 30px;
            border-bottom: 2px solid #eef0f2;
            padding-bottom: 15px;
        }
        
        .form-group {
            margin-bottom: 25px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-group label {
            font-weight: bold;
            font-size: 14px;
            color: #444;
        }
        
        .form-control {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        
        .form-control:focus {
            border-color: #4A90E2;
            outline: none;
        }
        
        textarea.form-control {
            height: 120px;
            resize: none;
        }
        
        /* 🐼 [생성 페이지 싱크] 대시보드와 일치하는 정원형 프로필 미리보기 */
        .image-preview-wrapper {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-top: 5px;
        }
        
        .preview-box {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .preview-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* 📁 [생성 페이지 싱크] 투박한 기본 input태그를 숨기고 감각적으로 커스텀한 파일 버튼 */
        .file-custom-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .file-upload-btn {
            padding: 10px 16px;
            background-color: #f1f3f5;
            border: 1px solid #ced4da;
            border-radius: 6px;
            color: #495057;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
        }

        .file-upload-btn:hover {
            background-color: #e9ecef;
        }

        .file-name-display {
            font-size: 13px;
            color: #6c757d;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
        }
        
        /* 버튼 스타일 */
        .btn-group {
            display: flex;
            gap: 12px;
            margin-top: 35px;
        }
        
        .btn {
            flex: 1;
            padding: 14px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 15px;
            cursor: pointer;
            border: none;
            text-align: center;
            text-decoration: none;
        }
        
        .btn-submit {
            background-color: #4A90E2;
            color: white;
            box-shadow: 0 4px 10px rgba(74,144,226,0.2);
        }
        
        .btn-cancel {
            background-color: #f1f3f5;
            color: #666;
            border: 1px solid #dee2e6;
        }

        /* ⚠️ 무결점 서비스를 위한 위험 구역 (그룹 완전 삭제 레이아웃) */
        .danger-zone {
            margin-top: 50px;
            padding: 25px;
            border: 1px dashed #e53e3e;
            border-radius: 12px;
            background-color: #fff5f5;
            box-sizing: border-box;
        }

        .danger-title {
            margin: 0 0 10px 0;
            color: #e53e3e;
            font-size: 16px;
            font-weight: bold;
        }

        .danger-desc {
            margin: 0 0 15px 0;
            color: #666;
            font-size: 13px;
            line-height: 1.5;
        }

        .btn-delete {
            width: 100%;
            background-color: #e53e3e;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
        }

        .btn-delete:hover {
            background-color: #c53030;
        }
    </style>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        // 파일 선택 시 원형 프리뷰 반영 및 파일명 실시간 노출 처리
        function previewImage(input) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                
                // 1. 파일명 바인딩
                $('#fileNameText').text(file.name);

                // 2. 이미지 미리보기 처리
                const reader = new FileReader();
                reader.onload = function(e) {
                    $('#imagePreview').attr('src', e.target.result);
                }
                reader.readAsDataURL(file);
            } else {
                $('#fileNameText').text("선택된 파일 없음");
            }
        }

        // 그룹 정보 수정 (UPDATE) AJAX 호출
        function updateWorkspaceSetting() {
            const wsName = $('#wsName').val().trim();
            if(!wsName) {
                alert("그룹 이름을 입력해 주세요.");
                return;
            }

            const form = $('#settingsForm')[0];
            const formData = new FormData(form);

            $.ajax({
                url: '/workspace/api/update',
                type: 'POST',
                data: formData,
                processData: false, 
                contentType: false, 
                success: function(res) {
                    if(res === 'success') {
                        alert("그룹 정보가 수정되었습니다.");
                        location.href = "/workspace/main?wsId=${workspace.wsId}";
                    } else {
                        alert("수정에 실패했습니다. 입력값을 확인해 주세요.");
                    }
                },
                error: function(err) {
                    console.error("수정 중 오류 발생:", err);
                    alert("서버 통신 오류가 발생했습니다.");
                }
            });
        }

        // 그룹 완전 삭제 (DELETE) AJAX 호출
        function deleteWorkspace() {
            if (confirm("정말로 이 그룹을 삭제하시겠습니까?\n삭제 후 프로젝트, 게시글, 멤버십을 포함한 모든 데이터가 복구 불가능하게 파괴됩니다.")) {
                $.ajax({
                    url: '/workspace/api/delete',
                    type: 'POST',
                    data: { wsId: "${workspace.wsId}" },
                    success: function(res) {
                        if (res === 'success') {
                            alert("그룹이 안전하게 폐쇄 및 완전히 삭제되었습니다.");
                            location.href = "/workspace/list"; 
                        } else {
                            alert("그룹 삭제 처리에 실패했습니다. 권한을 확인하세요.");
                        }
                    },
                    error: function(err) {
                        console.error("삭제 중 오류 발생:", err);
                        alert("서버 통신 오류가 발생했습니다.");
                    }
                });
            }
        }
    </script>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    
    <div class="settings-container">
        <h2 class="settings-title">⚙️ 그룹 정보 수정</h2>
        
        <form id="settingsForm">
            <input type="hidden" name="wsId" value="${workspace.wsId}">
            
            <div class="form-group">
                <label for="wsName">그룹 이름</label>
                <input type="text" id="wsName" name="wsName" class="form-control" value="${workspace.wsName}" placeholder="그룹 이름을 입력하세요">
            </div>
            
            <div class="form-group">
                <label for="wsDescription">그룹 설명</label>
                <textarea id="wsDescription" name="wsDescription" class="form-control" placeholder="우리 그룹을 소개해 주세요">${workspace.wsDescription}</textarea>
            </div>
            
            <div class="form-group">
                <label>그룹 대표 사진</label>
                <div class="image-preview-wrapper">
                    <div class="preview-box">
                        <img id="imagePreview" src="${not empty workspace.wsImagePath ? workspace.wsImagePath : '/images/default-ws.png'}" alt="미리보기">
                    </div>
                    <div style="flex: 1;">
                        <div class="file-custom-container">
                            <label for="wsImage" class="file-upload-btn">파일 선택</label>
                            <span id="fileNameText" class="file-name-display">선택된 파일 없음</span>
                            <input type="file" id="wsImage" name="wsImage" accept="image/*" onchange="previewImage(this)" style="display: none;">
                        </div>
                        <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">새 이미지를 선택하면 원형 프리뷰에 즉시 반영됩니다.</p>
                    </div>
                </div>
            </div>
            
            <div class="btn-group">
                <a href="/workspace/main?wsId=${workspace.wsId}" class="btn btn-cancel">취소</a>
                <button type="button" class="btn btn-submit" onclick="updateWorkspaceSetting()">변경사항 저장</button>
            </div>
        </form>

        <div class="danger-zone">
            <h3 class="danger-title">⚠️ 위험 구역</h3>
            <p class="danger-desc">이 워크스페이스를 영구적으로 폐쇄합니다. 삭제 시 복구 체크포인트가 존재하지 않으며, 초대되거나 협업 중이던 모든 팀원들의 접속 권한이 상실됩니다.</p>
            <button type="button" class="btn-delete" onclick="deleteWorkspace()">이 그룹 폐쇄 및 완전 삭제</button>
        </div>
    </div>
</body>
</html>