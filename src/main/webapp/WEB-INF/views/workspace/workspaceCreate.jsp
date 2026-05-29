<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>새 그룹 생성 - MOYO</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        .container { max-width: 600px; margin: 50px auto; padding: 20px; font-family: sans-serif; }
        .form-section { background: #fff; padding: 30px; border-radius: 20px; border: 1px solid #eee; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .form-group { margin-bottom: 25px; }
        label { display: block; font-weight: bold; margin-bottom: 8px; color: #444; }
        input[type="text"], textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
		textarea { 
		    width: 100%; 
		    padding: 12px; 
		    border: 1px solid #ddd; 
		    border-radius: 10px; 
		    box-sizing: border-box; 
		    resize: none; /* [핵심] 이 코드가 크기 조절을 막아줍니다 */
		}
        /* 이미지 업로드 영역 */
        .upload-box { display: flex; align-items: center; gap: 20px; margin-top: 10px; }
        #preview { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; display: none; }
        .file-btn { background: #f0f0f0; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
        
        .btn-submit { width: 100%; padding: 15px; background: #007bff; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1.1em; }
        .btn-submit:hover { background: #0056b3; }
    </style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="container">
        <div class="form-section">
            <h2>🎈 새 그룹 만들기</h2>
            
            <div class="form-group">
                <label>그룹 이름</label>
                <input type="text" id="wsName" placeholder="그룹 이름을 입력하세요">
            </div>

            <div class="form-group">
                <label>그룹 소개</label>
                <textarea id="wsDesc" rows="3" placeholder="그룹에 대해 소개해주세요"></textarea>
            </div>

            <div class="form-group">
                <label>그룹 대표 이미지</label>
                <div class="upload-box">
                    <img id="preview" src="#" alt="미리보기">
                    <label for="wsImage" class="file-btn">이미지 선택</label>
                    <input type="file" id="wsImage" accept="image/*" style="display:none;">
                </div>
            </div>

            <button id="btnWsSubmit" class="btn-submit">그룹 만들기 ✨</button>
        </div>
    </div>

    <script>
    // 이미지 선택 시 즉시 미리보기
    $('#wsImage').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#preview').attr('src', e.target.result).show();
            }
            reader.readAsDataURL(file);
        }
    });

    $('#btnWsSubmit').on('click', function() {
        const formData = new FormData();
        formData.append("wsName", $('#wsName').val());
        formData.append("wsDescription", $('#wsDesc').val());
        
        const imageFile = $('#wsImage')[0].files[0];
        if(imageFile) formData.append("wsImage", imageFile);

        $.ajax({
            url: '/workspace/api/create',
            type: 'POST',
            processData: false, contentType: false,
            data: formData,
            success: function(res) {
                alert("그룹이 성공적으로 생성되었습니다!");
                location.href = "/workspace/main?wsId=" + res.wsId;
            },
            error: function() { alert("생성 실패!"); }
        });
    });
    </script>
</body>
</html>