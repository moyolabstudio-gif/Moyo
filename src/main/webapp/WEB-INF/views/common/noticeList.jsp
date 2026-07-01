<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>

<style>
    /* 공지사항 전용 스타일 */
    .notice-container { max-width: 900px; margin: 100px auto 50px; padding: 0 20px; }
    .notice-header { margin-bottom: 30px; }
    .notice-header h2 { color: #243041; font-weight: 900; font-size: 28px; }
    .notice-item { cursor: pointer; flex-direction: column; align-items: flex-start; }
    .notice-body { font-size: 14px; }
    .notice-list { list-style: none; padding: 0; }
    .notice-item { 
        background: #fff; padding: 20px; margin-bottom: 12px; 
        border-radius: 16px; border: 1px solid #e9eef4;
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex; justify-content: space-between; align-items: center;
    }
    .notice-item:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
    
    .notice-info { display: flex; flex-direction: column; gap: 6px; }
    .notice-title { font-weight: 800; color: #344054; font-size: 16px; }
    .notice-date { font-size: 12px; color: #8a94a3; font-weight: 700; }
    
    .badge-pin { 
        background: #f5f9ff; color: #2878d0; padding: 4px 8px; 
        border-radius: 6px; font-size: 10px; font-weight: 900; margin-right: 8px;
    }
    
</style>
<header>
    <%@ include file="../common/header.jsp"%>
</header>

<div class="notice-container">
    <%-- 상단 헤더와 버튼을 한 줄로 배치 --%>
    <div class="notice-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2>공지사항</h2>
        <c:if test="${sessionScope.user.userRole == 'ADMIN'}">
            <a href="/admin/notice/writeForm" 
               style="background: #243041; color: #fff; padding: 10px 20px; border-radius: 12px; 
                      font-weight: 800; text-decoration: none; font-size: 14px;">
                공지 작성하기
            </a>
        </c:if>
    </div>

    <ul class="notice-list">
        <c:forEach var="notice" items="${noticeList}">
            <li class="notice-item" id="notice-${notice.noticeId}" onclick="toggleNotice(this)">
                <div style="width: 100%;">
                    <div class="notice-info">
                        <div class="notice-title">
                            <c:if test="${notice.isPinned == 'Y'}"><span class="badge-pin">고정</span></c:if>
                            ${notice.title}
                        </div>
                        <div class="notice-date">
                            <fmt:formatDate value="${notice.regDt}" pattern="yyyy.MM.dd" />
                        </div>
                    </div>
                    <div class="notice-body" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0; color: #667085; line-height: 1.6;">
                        ${notice.content}
                    </div>
                    <c:if test="${sessionScope.user.userRole == 'ADMIN'}">
                        <div class="notice-admin-actions" style="margin-top: 10px;">
                            <a href="/admin/notice/noticeEdit?noticeId=${notice.noticeId}" 
                             style="font-size: 12px; color: #2878d0; margin-right: 10px; text-decoration: none;">수정</a>
                            <button type="button" onclick="deleteNotice(${notice.noticeId}, event)" 
                                    style="font-size: 12px; color: #e71d36; border: none; background: none; cursor: pointer;">삭제</button>
                        </div>
                    </c:if>
                    
                    
                </div>
            </li>
        </c:forEach>
    </ul>
</div>

<script>
function toggleNotice(element) {
    // 모든 다른 아이템의 내용을 닫음 (원한다면)
    // $('.notice-body').not($(element).find('.notice-body')).slideUp();
    
    // 클릭한 아이템의 내용만 열고 닫음
    $(element).find('.notice-body').slideToggle(300);
}

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const openId = urlParams.get('openId');

    if (openId) {
        // 1. ID가 notice-10 같은 형태인 요소를 찾습니다.
        const $target = $('#notice-' + openId); 
        
        if ($target.length > 0) {
            // 2. 화면을 해당 위치로 이동
            $('html, body').animate({
                scrollTop: $target.offset().top - 100 
            }, 500);

            // 3. 해당 요소를 파라미터로 넘겨 직접 함수 호출 (trigger 대신 함수 직접 호출이 확실합니다)
            toggleNotice($target[0]); 
        }
    }
});
//클릭시 열고 닫기 함수 유지
function toggleNotice(element) {
    $(element).find('.notice-body').slideToggle(300);
}

// 삭제 함수 추가
function deleteNotice(noticeId, event) {
    event.stopPropagation(); // 중요: 부모의 toggleNotice가 실행되지 않게 막음
    
    if (confirm("정말 이 공지사항을 삭제하시겠습니까?")) {
        // 폼을 동적으로 생성하거나, 간단하게 location 이동 방식으로 처리
        window.location.href = "/admin/notice/delete?noticeId=" + noticeId;
    }
}
</script>