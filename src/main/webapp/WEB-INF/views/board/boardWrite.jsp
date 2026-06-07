<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>글쓰기</title>
	<script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/classic/ckeditor.js"></script>
	<script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/decoupled-document/translations/ko.js"></script>
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        .write-container { max-width: 900px; margin: 40px auto; padding: 25px; background: #fff; border-radius: 12px; box-shadow: 0 2px 15px rgba(0,0,0,0.05); }
        .form-label { font-weight: 700; color: #444; margin-bottom: 10px; display: block; font-size: 15px; }
        .title-input { width: 100%; padding: 14px; margin-bottom: 25px; border: 1px solid #e1e1e1; border-radius: 8px; font-size: 16px; box-sizing: border-box; transition: 0.3s; }
        .title-input:focus { border-color: #4A90E2; outline: none; }
		textarea { 
		    width: 100%; 
		    height: 80px; 
		    padding: 10px; 
		    border: 1px solid #ccc; 
		    border-radius: 4px; 
		    box-sizing: border-box; 
		    resize: none; /* 🚀 이 라인을 추가하여 크기 조절 핸들을 비활성화하고 고정합니다. */
		}
        /* 🎨 CKEditor 에디터 스타일 커스텀 */
        .ck.ck-editor__editable_inline { min-height: 450px !important; border: 1px solid #e1e1e1 !important; border-radius: 0 0 8px 8px !important; padding: 0 20px !important; }
        .ck.ck-toolbar { border: 1px solid #e1e1e1 !important; border-radius: 8px 8px 0 0 !important; background: #f9f9f9 !important; }
        
        .btn-submit { padding: 12px 30px; background: #4A90E2; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; float: right; margin-top: 20px; }
    </style>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />
    <div class="write-container">
       <form id="writeForm">
		    <input type="hidden" id="wsId" value="${wsId}">
		    <input type="hidden" id="boardType" value="${boardType}">
			<input type="hidden" id="projId" value="${projId}">
		    
		    <label class="form-label">제목</label>
		    <input type="text" id="title" class="title-input" placeholder="제목을 입력하세요" required>
		    
		    <label class="form-label">파일 첨부</label>
		    <input type="file" id="fileInput" name="files" multiple> <label class="form-label">내용</label>
		    <textarea id="editor" name="content"></textarea>
		    
		    <button type="button" class="btn-submit" onclick="submitPost()">등록하기</button>
		</form>
    </div>

	<script>
	    let myEditor;

	    // 📸 CKEditor 5 순정 빌드에서 동작하는 커스텀 업로드 어댑터 정의
	    function MyCustomUploadAdapterPlugin(editor) {
	        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
	            return {
	                upload() {
	                    return loader.file
	                        .then(file => new Promise((resolve, reject) => {
	                            const formData = new FormData();
	                            formData.append('upload', file); // 컨트롤러의 @RequestParam("upload")과 매칭

	                            $.ajax({
	                                url: '/api/workspace/board/image-upload',
	                                type: 'POST',
	                                data: formData,
	                                processData: false,
	                                contentType: false,
	                                success: function(res) {
	                                    if (res.uploaded) {
	                                        resolve({ default: res.url }); // 에디터 본문에 이미지 주소 주입
	                                    } else {
	                                        reject(res.error ? res.error.message : '업로드 실패');
	                                    }
	                                },
	                                error: function(err) {
	                                    reject('서버 통신 오류');
	                                }
	                            });
	                        }));
	                },
	                abort() {
	                    // 업로드 취소 시 처리 (필요 시 구현)
	                }
	            };
	        };
	    }

	    // 🚀 의존성 에러 없는 순정 ClassicEditor 구동
	    ClassicEditor
	        .create(document.querySelector('#editor'), {
	            language: 'ko',
	            // 순정 빌드에 존재하는 안전한 툴바 아이템만 구성
	            toolbar: [
	                'heading', '|', 
	                'bold', 'italic', '|',
	                'numberedList', 'bulletedList', '|',
	                'link', 'uploadImage', 'insertTable', 'blockQuote', 'undo', 'redo'
	            ],
	            // 🔥 위에서 만든 커스텀 업로드 플러그인을 엔진에 주입
	            extraPlugins: [MyCustomUploadAdapterPlugin]
	        })
	        .then(editor => {
	            myEditor = editor;
	        })
	        .catch(error => { 
	            console.error("에디터 초기화 실패:", error); 
	        });

	    // [데이터 정합성 보정] Form Submit 전 데이터 동기화
	    document.querySelector('form').addEventListener('submit', function(e) {
	        if (myEditor) {
	            const editorData = myEditor.getData();
	            
	            if (!editorData.trim() || editorData === '<p>&nbsp;</p>') {
	                alert('내용을 입력해 주세요.');
	                e.preventDefault(); 
	                return false;
	            }
	            
	            document.querySelector('#editor').value = editorData;
	        }
	    });
		function submitPost() {
		        // 1. 데이터 준비
		        const formData = new FormData();
				const projIdValue = document.getElementById('projId').value;
				const postData = {
				    wsId: document.getElementById('wsId').value,
				    boardType: document.getElementById('boardType').value,
				    title: document.getElementById('title').value,
				    content: myEditor.getData()
				};

				// 💡 projId가 있을 때만 객체에 추가 (비어있으면 서버로 보내지 않음)
				if (projIdValue && projIdValue !== "") {
				    postData.projId = projIdValue;
				}

		        // 2. JSON 데이터를 Blob으로 변환하여 추가 (필수)
		        formData.append("post", new Blob([JSON.stringify(postData)], { type: "application/json" }));

		        // 3. 파일들 추가
		        const fileInput = document.getElementById('fileInput');
		        for (let i = 0; i < fileInput.files.length; i++) {
		            formData.append("files", fileInput.files[i]);
		        }

		        // 4. 전송
		        const wsId = document.getElementById('wsId').value;
				$.ajax({
				        url: '/api/board/file/' + wsId + '/write', 
				        type: 'POST',
				        data: formData,
				        processData: false, 
				        contentType: false, 
						success: function(res) {
						            if(res.status === 'SUCCESS') {
						                alert('등록 완료!');
						                const projId = document.getElementById('projId').value;
						                // 프로젝트 ID가 있다면 프로젝트 메인으로, 없으면 게시판 목록으로
						                if (projId) {
						                    location.href = '/group/project/main?wsId=' + wsId + '&projId=' + projId;
						                } else {
						                    location.href = '/group/board/list?wsId=' + wsId + '&type=' + boardType;
						                }
						            }
						        }
				    });
		    }
	</script>
</body>
</html>