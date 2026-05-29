<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>게시글 수정</title>
    <style>
        /* 상세 및 글쓰기 폼과 일치시킨 깔끔한 스타일 */
        .page-container { padding: 40px 0; background-color: #f9f9f9; }
        .form-card { max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
        .form-control { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 15px; }
		textarea { 
		    width: 100%; 
		    height: 80px; 
		    padding: 10px; 
		    border: 1px solid #ccc; 
		    border-radius: 4px; 
		    box-sizing: border-box; 
		    resize: none; /* 🚀 이 라인을 추가하여 크기 조절 핸들을 비활성화하고 고정합니다. */
		}
        /* 💡 CKEditor 편집창 최소 높이 설정 */
        .ck-editor__editable { min-height: 400px; } 
        
        .btn-area { margin-top: 20px; text-align: right; }
        .btn-save { background: #333; color: #fff; border: none; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; }
        .btn-cancel { background: #ccc; color: #333; border: none; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-size: 16px; text-decoration: none; margin-right: 10px; display: inline-block; }
    </style>
    
    <script src="https://cdn.ckeditor.com/ckeditor5/41.1.0/classic/ckeditor.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>

    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <div class="page-container">
        <div class="form-card">
            <h2>게시글 수정</h2>
            <hr style="margin-bottom: 30px; border: 1px solid #333;">
            
			<form action="/group/board/modify" method="POST" enctype="multipart/form-data">
			    <input type="hidden" name="postId" value="${post.postId}">
			    <input type="hidden" name="wsId" value="${wsId}">
			    <input type="hidden" name="boardType" value="${boardType}">

			    <div class="form-group">
			        <label for="title">제목</label>
			        <input type="text" id="title" name="title" class="form-control" value="${post.title}" required>
			    </div>

			    <div class="form-group">
			        <label for="editor">내용</label>
			        <textarea id="editor" name="content">${post.content}</textarea>
			    </div>

			    <div class="form-group">
			        <label>기존 첨부 파일</label>
			        <div id="existingFiles">
						<c:forEach var="file" items="${fileList}">
						    <div class="file-item d-flex justify-content-between mb-2" id="file-${file.FILE_ID}">
						        <span>💾 ${file.FILE_ORIGINAL_NAME}</span>
								<button type="button" 
								        class="btn btn-sm btn-danger" 
								        onclick="deleteFile(${file.FILE_ID})">
								    삭제
								</button>
						    </div>
						</c:forEach>
			        </div>
			    </div>

			    <div class="form-group">
			        <label>새 파일 추가</label>
			        <input type="file" name="files" multiple class="form-control">
			    </div>

			    <div class="btn-area">
			        <a href="/group/board/detail?postId=${post.postId}&wsId=${wsId}" class="btn-cancel">취소</a>
			        <button type="submit" class="btn-save">수정 완료</button>
			    </div>
			</form>

        </div>
    </div>

    <script>
        let myEditor;
		const wsId = ${wsId};
        // 📸 이미지 서버 비동기 업로드 커스텀 어댑터 플러그인
        function MyCustomUploadAdapterPlugin(editor) {
            editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                return {
                    upload() {
                        return loader.file
                            .then(file => new Promise((resolve, reject) => {
                                const formData = new FormData();
                                formData.append('upload', file);

                                $.ajax({
                                    url: '/api/workspace/board/image-upload',
                                    type: 'POST',
                                    data: formData,
                                    processData: false,
                                    contentType: false,
                                    success: function(res) {
                                        if (res.uploaded) {
                                            resolve({ default: res.url });
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
                    abort() {}
                };
            };
        }

        // 🚀 에디터 엔진 구동 및 순정 플러그인 결합
        ClassicEditor
            .create(document.querySelector('#editor'), {
                language: 'ko',
                toolbar: [
                    'heading', '|', 
                    'bold', 'italic', '|',
                    'numberedList', 'bulletedList', '|',
                    'link', 'uploadImage', 'insertTable', 'blockQuote', 'undo', 'redo'
                ],
                extraPlugins: [MyCustomUploadAdapterPlugin]
            })
            .then(editor => {
                myEditor = editor;
            })
            .catch(error => { 
                console.error("에디터 인스턴스 초기화 실패:", error); 
            });

        // 🛡️ [데이터 정합성 보정] 전송 버튼(submit) 클릭 시 에디터 메모리의 HTML 소스를 textarea에 강제 동기화
		// 🛡️ 폼 전송 보정
		document.querySelector('form').addEventListener('submit', function(e) {
		    if (myEditor) {
		        const editorData = myEditor.getData();
		        
		        // CKEditor 에디터의 내용을 강제로 textarea 요소에 업데이트
		        document.querySelector('#editor').value = editorData;
		        
		        // 밸리데이션
		        if (editorData.trim().length === 0) {
		            alert('내용을 입력해 주세요.');
		            e.preventDefault(); 
		            return false;
		        }
		    }
		});
		function deleteFile(fileId) {
		    const wsId = ${wsId}; // JSP에서 wsId를 숫자로 가져옴

		    // 1. 여기서 확실하게 숫자가 나오는지 확인
		    console.log("🔥 전달받은 fileId:", fileId); 
		    
		    // 2. 문자열 더하기 방식으로 URL 생성 (백틱 대신)
		    const url = "/api/workspace/" + wsId + "/board/file/" + fileId;
		    
		    console.log("🔥 최종 호출 URL:", url);

		    fetch(url, { 
		        method: "DELETE" 
		    })
		    .then(res => res.text())
		    .then(result => {
		        console.log("🔥 결과:", result);
		        if (result === "SUCCESS") {
		            // 태그를 찾아서 제거
		            const target = document.getElementById("file-" + fileId);
		            if(target) target.remove();
		        } else {
		            alert("삭제 실패");
		        }
		    })
		    .catch(err => console.error("통신 에러:", err));
		}
    </script>
</body>
</html>