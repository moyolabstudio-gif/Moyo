<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
    <title>문의하기 | MOYO</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css?v=moyo-ui">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/inquiry.css?v=inquiry-brand-v24">
    <script src="${pageContext.request.contextPath}/js/moyoCsrf.js?v=csrf-v1"></script>
</head>
<body class="moyo-app-sidebar-enabled">
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="moyo-inquiry-page">
    <div class="moyo-inquiry-wrap">
        <section class="moyo-inquiry-hero" aria-labelledby="inquiry-page-title">
            <div class="moyo-inquiry-kicker">MOYO 안내</div>
            <h1 id="inquiry-page-title" class="moyo-inquiry-title">문의하기</h1>
            <p class="moyo-inquiry-desc">MOYO 이용 중 궁금한 점이나 불편한 점을 남겨주세요. 확인 후 답변을 이어서 안내해드릴게요.</p>
        </section>

        <section class="moyo-inquiry-panel" aria-label="문의하기">
            <div class="moyo-inquiry-main moyo-chat-container" id="main-chat-container">
                <div class="moyo-inquiry-section-head">
                    <div class="moyo-inquiry-section-copy">
                        <h2>현재 문의</h2>
                        <p>문의 작성부터 답변 확인까지 한 대화에서 이어서 확인할 수 있어요.</p>
                    </div>
                    <button type="button" class="moyo-inquiry-status-chip" id="new-inquiry-button">새 문의</button>
                </div>

                <div class="moyo-inquiry-detail" id="inquiry-detail" aria-live="polite">
                    <div class="moyo-inquiry-detail-top">
                        <div class="moyo-inquiry-detail-copy">
                            <div class="moyo-inquiry-detail-eyebrow" id="inquiry-detail-category">문의</div>
                            <h3 class="moyo-inquiry-detail-title" id="inquiry-detail-title">문의 제목</h3>
                            <div class="moyo-inquiry-detail-meta">
                                <span id="inquiry-detail-owner">내 문의</span>
                                <span id="inquiry-detail-date" hidden></span>
                            </div>
                        </div>
                        <span class="moyo-inquiry-detail-status" id="inquiry-detail-status">진행 중</span>
                    </div>
                </div>

                <div id="chat-messages" class="moyo-conversation">
                    <div class="moyo-chat-empty" id="chat-empty-state">
                        <div class="moyo-chat-empty-mark" aria-hidden="true">💬</div>
                        <p class="moyo-chat-empty-title">새 문의를 시작해보세요.</p>
                        <p class="moyo-chat-empty-desc">MOYO 이용 중 궁금하거나 불편한 점을 남겨주세요.<br>답변이 등록되면 이 공간에서 대화가 이어집니다.</p>
                        <div class="moyo-chat-empty-flow" aria-hidden="true">
                            <span class="moyo-chat-empty-step">문의 작성</span>
                            <span class="moyo-chat-empty-arrow">→</span>
                            <span class="moyo-chat-empty-step">답변 확인</span>
                        </div>
                    </div>
                </div>

                <div class="moyo-chat-compose" id="inquiry-compose">
                    <div class="moyo-chat-compose-head">
                        <span class="moyo-chat-compose-title" id="inquiry-compose-title">문의 작성</span>
                        <span class="moyo-chat-compose-help" id="inquiry-compose-help">필수 항목을 입력한 뒤 문의를 보내주세요.</span>
                    </div>

                    <div class="moyo-inquiry-form" id="inquiry-form">
                        <div class="moyo-inquiry-form-grid">
                            <label class="moyo-inquiry-field">
                                <span class="moyo-inquiry-field-label">문의 유형 <span class="moyo-inquiry-field-required">필수</span></span>
                                <select class="moyo-inquiry-select" id="inquiry-category" aria-label="문의 유형">
                                    <c:choose>
                                        <c:when test="${not empty categoryList}">
                                            <c:forEach var="category" items="${categoryList}">
                                                <option value="${category.categoryId}"><c:out value="${category.categoryName}" /></option>
                                            </c:forEach>
                                        </c:when>
                                        <c:otherwise>
                                            <option value="1">일반 문의</option>
                                        </c:otherwise>
                                    </c:choose>
                                </select>
                            </label>

                            <label class="moyo-inquiry-field">
                                <span class="moyo-inquiry-field-label">제목 <span class="moyo-inquiry-field-required">필수</span></span>
                                <input class="moyo-inquiry-title-input" id="inquiry-title" type="text" maxlength="100" placeholder="문의 내용을 한눈에 알 수 있게 적어주세요.">
                            </label>
                        </div>

                        <label class="moyo-inquiry-field moyo-inquiry-content-field">
                            <span class="moyo-inquiry-field-label">문의 내용 <span class="moyo-inquiry-field-required">필수</span></span>
                            <span class="moyo-chat-input-box">
                                <textarea class="moyo-chat-input" rows="3" maxlength="2000" placeholder="궁금한 점이나 불편한 내용을 자세히 입력하세요."></textarea>
                            </span>
                        </label>

                        <div class="moyo-inquiry-attachment-preview" id="inquiry-attachment-preview" hidden></div>

                        <div class="moyo-inquiry-form-foot">
                            <span class="moyo-inquiry-form-note">비밀번호, 주민등록번호 등 민감한 개인정보는 입력하지 마세요.</span>
                            <label class="moyo-inquiry-attachment-button" for="inquiry-files">
                                <span aria-hidden="true">📎</span> 파일 첨부
                            </label>
                            <input id="inquiry-files" class="moyo-inquiry-file-input" type="file" multiple>
                            <button class="moyo-inquiry-send-btn primary" type="button">문의 보내기</button>
                        </div>
                    </div>
                </div>
            </div>

            <aside class="moyo-inquiry-side" aria-label="내 문의">
                <section class="moyo-inquiry-side-block" aria-labelledby="my-inquiry-title">
                    <div class="moyo-inquiry-side-head">
                        <h2 id="my-inquiry-title">내 문의</h2>
                        <p>이전 문의를 선택하면 왼쪽에서 내용을 이어서 확인할 수 있어요.</p>
                    </div>
                    <div class="moyo-inquiry-list-shell">
                        <div class="moyo-inquiry-list-meta">
                            <span>최근 문의</span>
                            <span class="moyo-inquiry-count" id="my-inquiry-count">0건</span>
                        </div>

                        <div class="moyo-inquiry-list" id="my-inquiry-list" aria-live="polite">
                            <div class="moyo-inquiry-empty" id="my-inquiry-empty">
                                <div class="moyo-inquiry-empty-icon" aria-hidden="true">💬</div>
                                <strong>아직 문의 내역이 없습니다.</strong>
                                <span>첫 문의를 남기면<br>문의 목록이 이곳에 쌓여요.</span>
                            </div>
                        </div>
                    </div>

                    <%--
                        내 문의 목록 UI 골격.
                        이후 조회 API를 연결할 때 아래 구조를 반복 렌더링합니다.
                        상태 클래스: is-waiting / is-answered / is-closed
                        선택 문의: button에 is-selected 추가
                    --%>
                    <template id="my-inquiry-item-template">
                        <button type="button" class="moyo-inquiry-item">
                            <span class="moyo-inquiry-item-top">
                                <span class="moyo-inquiry-item-type"></span>
                                <span class="moyo-inquiry-item-status"></span>
                            </span>
                            <strong class="moyo-inquiry-item-title"></strong>
                            <span class="moyo-inquiry-item-summary"></span>
                            <time class="moyo-inquiry-item-date"></time>
                        </button>
                    </template>
                </section>
            </aside>
        </section>

        <aside class="moyo-inquiry-guide-card" aria-label="MOYO 문의 안내">
            <div class="moyo-inquiry-guide-icon" aria-hidden="true">💡</div>
            <div class="moyo-inquiry-guide-content">
                <div class="moyo-inquiry-guide-title">문의 이용 안내</div>
                <p class="moyo-inquiry-guide-text">서비스 이용 중 궁금한 점이나 오류를 남겨주세요. 접수된 문의는 순차적으로 답변하며, 답변이 등록되면 같은 화면에서 이어서 확인할 수 있어요.</p>
            </div>
        </aside>
    </div>
</main>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<script>
const currentUserId = Number('${currentUserId}');
const contextPath = '${pageContext.request.contextPath}';
let selectedCsId = null;
let inquiryListCache = [];
let inquiryPollingTimer = null;
let inquirySyncInFlight = false;
let lastConversationSignature = '';
let lastInquiryStateSignature = '';
const INQUIRY_POLL_INTERVAL = 4000;
const requestedCsId = (function() {
    const raw = new URLSearchParams(window.location.search).get('csId');
    if (raw == null || raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
})();

document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.querySelector('.moyo-inquiry-send-btn');
    const newButton = document.getElementById('new-inquiry-button');

    if (sendButton) sendButton.addEventListener('click', sendInquiryMessage);
    const fileInput = document.getElementById('inquiry-files');
    if (fileInput) fileInput.addEventListener('change', updateInquiryAttachmentPreview);
    if (newButton) newButton.addEventListener('click', startNewInquiry);

    loadInquiryList(true);

    document.addEventListener('visibilitychange', handleInquiryVisibilityChange);
    window.addEventListener('pagehide', stopInquiryPolling);
    window.addEventListener('beforeunload', stopInquiryPolling);
});

function getConversationSignature(messages) {
    if (!messages || !messages.length) return 'empty';
    return messages.map(function(message) {
        return [
            message.msgId || '',
            message.senderType || '',
            message.senderId || '',
            message.createdAt || '',
            message.content || ''
        ].join('|');
    }).join('||');
}

function getInquiryStateSignature(inquiry) {
    if (!inquiry) return 'none';
    return [
        inquiry.csId || '',
        inquiry.csStatus || '',
        inquiry.lastSenderType || '',
        inquiry.lastContent || '',
        inquiry.updatedAt || ''
    ].join('|');
}

function stopInquiryPolling() {
    if (inquiryPollingTimer != null) {
        window.clearInterval(inquiryPollingTimer);
        inquiryPollingTimer = null;
    }
}

function startInquiryPolling() {
    stopInquiryPolling();
    if (selectedCsId == null || document.hidden) return;

    inquiryPollingTimer = window.setInterval(function() {
        syncSelectedInquiry();
    }, INQUIRY_POLL_INTERVAL);
}

function handleInquiryVisibilityChange() {
    if (document.hidden) {
        stopInquiryPolling();
        return;
    }

    if (selectedCsId != null) {
        syncSelectedInquiry(true);
        startInquiryPolling();
    }
}

async function fetchInquiryListData() {
    const response = await fetch(contextPath + '/common/inquiry/list', { cache: 'no-store' });
    if (response.status === 401) {
        window.location.href = contextPath + '/users/loginForm';
        return null;
    }
    if (!response.ok) throw new Error('문의 목록을 불러오지 못했습니다.');
    return await response.json();
}

async function syncSelectedInquiry(force) {
    if (selectedCsId == null || document.hidden || inquirySyncInFlight) return;

    inquirySyncInFlight = true;
    const syncCsId = Number(selectedCsId);

    try {
        const responses = await Promise.all([
            fetch(contextPath + '/common/inquiry/messages?csId=' + encodeURIComponent(syncCsId), { cache: 'no-store' }),
            fetchInquiryListData()
        ]);

        const messageResponse = responses[0];
        const latestList = responses[1];
        if (latestList == null) return;

        if (messageResponse.status === 401) {
            window.location.href = contextPath + '/users/loginForm';
            return;
        }
        if (!messageResponse.ok) throw new Error('문의 내역을 불러오지 못했습니다.');

        const messages = await messageResponse.json();
        if (Number(selectedCsId) !== syncCsId) return;

        const selectedInquiry = latestList.find(function(item) {
            return Number(item.csId) === syncCsId;
        }) || null;

        const conversationSignature = getConversationSignature(messages);
        const inquiryStateSignature = getInquiryStateSignature(selectedInquiry);
        const hasChanged = force ||
            conversationSignature !== lastConversationSignature ||
            inquiryStateSignature !== lastInquiryStateSignature;

        if (!hasChanged) return;

        inquiryListCache = latestList;
        renderInquiryList(inquiryListCache);
        renderConversation(messages, selectedInquiry, true);
    } catch (error) {
        console.error('문의 실시간 동기화 실패:', error);
    } finally {
        inquirySyncInFlight = false;
    }
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getCategoryName(categoryId) {
    const select = document.getElementById('inquiry-category');
    if (!select) return '문의';
    const option = Array.from(select.options).find(function(item) {
        return Number(item.value) === Number(categoryId);
    });
    return option ? option.textContent.trim() : '문의';
}

function formatMessageTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

function formatInquiryDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

function getInquiryStatus(item) {
    const status = String(item && item.csStatus ? item.csStatus : 'OPEN').toUpperCase();
    if (status === 'CLOSED') {
        return { label: '종료', className: 'is-closed' };
    }
    if (String(item && item.lastSenderType ? item.lastSenderType : 'USER').toUpperCase() === 'ADMIN') {
        return { label: '답변 완료', className: 'is-answered' };
    }
    return { label: '답변 대기', className: 'is-waiting' };
}

function setConversationMode(firstMessage, inquiry) {
    const detail = document.getElementById('inquiry-detail');
    const detailTitle = document.getElementById('inquiry-detail-title');
    const detailCategory = document.getElementById('inquiry-detail-category');
    const detailDate = document.getElementById('inquiry-detail-date');
    const detailStatus = document.getElementById('inquiry-detail-status');
    const form = document.getElementById('inquiry-form');
    const compose = document.getElementById('inquiry-compose');
    const composeTitle = document.getElementById('inquiry-compose-title');
    const composeHelp = document.getElementById('inquiry-compose-help');
    const titleInput = document.getElementById('inquiry-title');
    const categorySelect = document.getElementById('inquiry-category');

    if (detail) detail.classList.add('is-visible');
    if (detailTitle) detailTitle.textContent = (inquiry && inquiry.title) || (firstMessage && firstMessage.title) || '문의';
    if (detailCategory) detailCategory.textContent = (inquiry && inquiry.categoryName) || (firstMessage && firstMessage.categoryName) || getCategoryName(firstMessage && firstMessage.categoryId);

    const formattedDate = formatMessageTime((inquiry && inquiry.createdAt) || (firstMessage && firstMessage.createdAt));
    if (detailDate) {
        detailDate.textContent = formattedDate ? ('접수 ' + formattedDate) : '';
        detailDate.hidden = !formattedDate;
    }

    const inquiryStatus = getInquiryStatus(inquiry || {});
    if (detailStatus) {
        detailStatus.textContent = inquiryStatus.label;
        detailStatus.className = 'moyo-inquiry-detail-status ' + inquiryStatus.className;
    }

    const isClosed = inquiryStatus.className === 'is-closed';
    if (compose) compose.hidden = isClosed;
    if (form) form.classList.add('is-reply-mode');
    if (compose) compose.classList.add('is-reply-mode');
    if (composeTitle) composeTitle.textContent = '추가 메시지';
    if (composeHelp) composeHelp.textContent = '답변을 기다리는 동안 내용을 추가로 남길 수 있어요.';

    if (titleInput && firstMessage && firstMessage.title) titleInput.value = firstMessage.title;
    if (categorySelect && firstMessage && firstMessage.categoryId) categorySelect.value = String(firstMessage.categoryId);
}

function setNewInquiryMode() {
    const detail = document.getElementById('inquiry-detail');
    const form = document.getElementById('inquiry-form');
    const compose = document.getElementById('inquiry-compose');
    const composeTitle = document.getElementById('inquiry-compose-title');
    const composeHelp = document.getElementById('inquiry-compose-help');

    if (detail) detail.classList.remove('is-visible');
    if (form) form.classList.remove('is-reply-mode');
    if (compose) {
        compose.classList.remove('is-reply-mode');
        compose.hidden = false;
    }
    if (composeTitle) composeTitle.textContent = '문의 작성';
    if (composeHelp) composeHelp.textContent = '필수 항목을 입력한 뒤 문의를 보내주세요.';
}

function renderEmptyConversation() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    chatMessages.innerHTML =
        '<div class="moyo-chat-empty" id="chat-empty-state">' +
            '<div class="moyo-chat-empty-mark" aria-hidden="true">💬</div>' +
            '<p class="moyo-chat-empty-title">새 문의를 시작해보세요.</p>' +
            '<p class="moyo-chat-empty-desc">MOYO 이용 중 궁금하거나 불편한 점을 남겨주세요.<br>답변이 등록되면 이 공간에서 대화가 이어집니다.</p>' +
            '<div class="moyo-chat-empty-flow" aria-hidden="true">' +
                '<span class="moyo-chat-empty-step">문의 작성</span>' +
                '<span class="moyo-chat-empty-arrow">→</span>' +
                '<span class="moyo-chat-empty-step">답변 확인</span>' +
            '</div>' +
        '</div>';
}

function startNewInquiry() {
    stopInquiryPolling();
    selectedCsId = null;
    lastConversationSignature = '';
    lastInquiryStateSignature = '';
    document.querySelectorAll('.moyo-inquiry-item.is-selected').forEach(function(item) {
        item.classList.remove('is-selected');
    });

    const titleInput = document.getElementById('inquiry-title');
    const contentInput = document.querySelector('.moyo-chat-input');
    const categorySelect = document.getElementById('inquiry-category');
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    if (categorySelect && categorySelect.options.length) categorySelect.selectedIndex = 0;
    clearInquiryAttachments();

    setNewInquiryMode();
    renderEmptyConversation();
    if (titleInput) titleInput.focus();
}

function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

function updateInquiryAttachmentPreview() {
    const input = document.getElementById('inquiry-files');
    const preview = document.getElementById('inquiry-attachment-preview');
    if (!input || !preview) return;

    const files = Array.from(input.files || []);
    if (files.length > 5) {
        alert('첨부파일은 메시지당 최대 5개까지 등록할 수 있습니다.');
        input.value = '';
        preview.hidden = true;
        preview.innerHTML = '';
        return;
    }
    const tooLarge = files.find(function(file) { return file.size > 10 * 1024 * 1024; });
    if (tooLarge) {
        alert('첨부파일은 파일당 최대 10MB까지 등록할 수 있습니다.');
        input.value = '';
        preview.hidden = true;
        preview.innerHTML = '';
        return;
    }

    preview.innerHTML = '';
    files.forEach(function(file) {
        const item = document.createElement('span');
        item.className = 'moyo-inquiry-selected-file';
        item.textContent = file.name + ' · ' + formatFileSize(file.size);
        preview.appendChild(item);
    });
    preview.hidden = files.length === 0;
}

function clearInquiryAttachments() {
    const input = document.getElementById('inquiry-files');
    const preview = document.getElementById('inquiry-attachment-preview');
    if (input) input.value = '';
    if (preview) {
        preview.innerHTML = '';
        preview.hidden = true;
    }
}

function getInquiryAttachmentDisplayName(attachment) {
    if (!attachment) return '첨부파일';

    const candidates = [
        attachment.originalName,
        attachment.originalFileName,
        attachment.fileName,
        attachment.name
    ];

    let fileName = '';
    for (const candidate of candidates) {
        if (candidate == null) continue;
        const value = String(candidate).trim();
        if (value) {
            fileName = value;
            break;
        }
    }

    if (!fileName) return '첨부파일';
    fileName = fileName.replace(/\\/g, '/').split('/').pop().trim();
    if (!fileName) return '첨부파일';

    const storedName = String(attachment.storedName || '').trim();
    const looksLikeStoredName = storedName && fileName === storedName;
    const looksLikeGeneratedToken = /^[A-Za-z0-9_-]{32,}(?:\.[A-Za-z0-9]{1,10})?$/.test(fileName);

    return (looksLikeStoredName || looksLikeGeneratedToken) ? '첨부파일' : fileName;
}

function renderMessageAttachments(message, card) {
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    if (!attachments.length || !card) return;

    const box = document.createElement('div');
    box.className = 'moyo-message-attachments';
    attachments.forEach(function(attachment) {
        const originalName = getInquiryAttachmentDisplayName(attachment);
        const link = document.createElement('a');
        link.className = 'moyo-message-attachment';
        link.href = contextPath + '/common/inquiry/attachments/download?attachmentId=' + encodeURIComponent(attachment.attachmentId);
        link.title = originalName;

        const icon = document.createElement('span');
        icon.className = 'moyo-message-attachment-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '📎';

        const name = document.createElement('span');
        name.className = 'moyo-message-attachment-name';
        name.textContent = originalName;

        const size = document.createElement('span');
        size.className = 'moyo-message-attachment-size';
        size.textContent = formatFileSize(attachment.fileSize);

        const download = document.createElement('span');
        download.className = 'moyo-message-attachment-download';
        download.setAttribute('aria-hidden', 'true');
        download.textContent = '↓';

        link.appendChild(icon);
        link.appendChild(name);
        link.appendChild(size);
        link.appendChild(download);
        box.appendChild(link);
    });
    card.appendChild(box);
}

function renderMessage(message) {
    const isUser = String(message.senderType || 'USER').toUpperCase() !== 'ADMIN';
    const wrapper = document.createElement('article');
    wrapper.className = 'moyo-message ' + (isUser ? 'is-user' : 'is-admin');

    const timeText = formatMessageTime(message.createdAt);
    const author = isUser ? '나' : 'MOYO 운영팀';
    const avatar = isUser ? 'ME' : 'M';

    wrapper.innerHTML =
        '<div class="moyo-message-avatar" aria-hidden="true">' + escapeHtml(avatar) + '</div>' +
        '<div class="moyo-message-content">' +
            '<div class="moyo-message-meta">' +
                '<span class="moyo-message-author">' + escapeHtml(author) + '</span>' +
                (timeText ? '<time>' + escapeHtml(timeText) + '</time>' : '') +
            '</div>' +
            '<div class="moyo-message-card"></div>' +
        '</div>';

    const messageCard = wrapper.querySelector('.moyo-message-card');
    messageCard.textContent = message.content || '';
    renderMessageAttachments(message, messageCard);
    return wrapper;
}

function appendReplyWaiting(chatMessages, messages, inquiry) {
    if (!messages || messages.length === 0) return;
    if (String(inquiry && inquiry.csStatus ? inquiry.csStatus : 'OPEN').toUpperCase() === 'CLOSED') return;
    const lastMessage = messages[messages.length - 1];
    if (String(lastMessage.senderType || 'USER').toUpperCase() === 'ADMIN') return;

    const waiting = document.createElement('div');
    waiting.className = 'moyo-reply-wait';
    waiting.innerHTML = '<span class="moyo-reply-wait-mark" aria-hidden="true"></span><span>문의가 접수되었습니다. MOYO 운영팀의 답변을 기다리고 있어요.</span>';
    chatMessages.appendChild(waiting);
}

function renderInquiryList(items) {
    const list = document.getElementById('my-inquiry-list');
    const count = document.getElementById('my-inquiry-count');
    const template = document.getElementById('my-inquiry-item-template');
    if (!list || !template) return;

    list.innerHTML = '';
    if (count) count.textContent = String(items.length) + '건';

    if (!items.length) {
        list.innerHTML =
            '<div class="moyo-inquiry-empty" id="my-inquiry-empty">' +
                '<div class="moyo-inquiry-empty-icon" aria-hidden="true">💬</div>' +
                '<strong>아직 문의 내역이 없습니다.</strong>' +
                '<span>첫 문의를 남기면<br>문의 목록이 이곳에 쌓여요.</span>' +
            '</div>';
        return;
    }

    items.forEach(function(item) {
        const fragment = template.content.cloneNode(true);
        const button = fragment.querySelector('.moyo-inquiry-item');
        const type = fragment.querySelector('.moyo-inquiry-item-type');
        const status = fragment.querySelector('.moyo-inquiry-item-status');
        const title = fragment.querySelector('.moyo-inquiry-item-title');
        const summary = fragment.querySelector('.moyo-inquiry-item-summary');
        const date = fragment.querySelector('.moyo-inquiry-item-date');
        const statusInfo = getInquiryStatus(item);

        button.dataset.csId = String(item.csId);
        if (Number(item.csId) === Number(selectedCsId)) button.classList.add('is-selected');
        type.textContent = item.categoryName || getCategoryName(item.categoryId);
        status.textContent = statusInfo.label;
        status.classList.add(statusInfo.className);
        title.textContent = item.title || '문의';
        summary.textContent = item.lastContent || '';
        date.textContent = formatInquiryDate(item.updatedAt || item.createdAt);
        if (item.updatedAt || item.createdAt) date.setAttribute('datetime', item.updatedAt || item.createdAt);

        button.addEventListener('click', function() {
            selectInquiry(item.csId);
        });
        list.appendChild(fragment);
    });
}

async function loadInquiryList(selectFirst) {
    try {
        const latestList = await fetchInquiryListData();
        if (latestList == null) return;

        inquiryListCache = latestList;
        renderInquiryList(inquiryListCache);

        if (selectFirst && inquiryListCache.length > 0) {
            const requested = requestedCsId == null ? null : inquiryListCache.find(function(item) {
                return Number(item.csId) === Number(requestedCsId);
            });
            await selectInquiry(requested ? requested.csId : inquiryListCache[0].csId);
        } else if (inquiryListCache.length === 0) {
            startNewInquiry();
        } else if (selectedCsId != null) {
            const selected = inquiryListCache.find(function(item) {
                return Number(item.csId) === Number(selectedCsId);
            });
            if (selected) await loadChatMessages(selectedCsId, selected);
        }
    } catch (e) {
        console.error('문의 목록 로드 실패:', e);
    }
}

async function selectInquiry(csId) {
    selectedCsId = Number(csId);
    renderInquiryList(inquiryListCache);
    const inquiry = inquiryListCache.find(function(item) {
        return Number(item.csId) === Number(selectedCsId);
    });
    await loadChatMessages(selectedCsId, inquiry || null);
    startInquiryPolling();
}

function renderConversation(messages, inquiry, preserveScroll) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const previousScrollTop = chatMessages.scrollTop;
    const distanceFromBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight;
    const wasNearBottom = distanceFromBottom <= 96;

    if (!messages || messages.length === 0) {
        startNewInquiry();
        return;
    }

    const lastMessage = messages[messages.length - 1];
    const conversationInfo = inquiry || {
        csStatus: 'OPEN',
        lastSenderId: lastMessage ? lastMessage.senderId : null,
        lastSenderType: lastMessage ? lastMessage.senderType : null,
        title: messages[0] ? messages[0].title : '문의',
        categoryId: messages[0] ? messages[0].categoryId : null,
        categoryName: messages[0] ? messages[0].categoryName : null,
        createdAt: messages[0] ? messages[0].createdAt : null
    };

    chatMessages.innerHTML = '';
    setConversationMode(messages[0], conversationInfo);
    messages.forEach(function(message) {
        chatMessages.appendChild(renderMessage(message));
    });
    appendReplyWaiting(chatMessages, messages, conversationInfo);

    lastConversationSignature = getConversationSignature(messages);
    lastInquiryStateSignature = getInquiryStateSignature(conversationInfo);

    if (!preserveScroll || wasNearBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        chatMessages.scrollTop = previousScrollTop;
    }
}

async function loadChatMessages(csId, inquiry) {
    if (csId == null || Number.isNaN(Number(csId))) {
        return;
    }

    try {
        const response = await fetch(contextPath + '/common/inquiry/messages?csId=' + encodeURIComponent(csId), { cache: 'no-store' });
        if (response.status === 401) {
            window.location.href = contextPath + '/users/loginForm';
            return;
        }
        if (!response.ok) throw new Error('문의 내역을 불러오지 못했습니다.');

        const messages = await response.json();
        renderConversation(messages, inquiry, false);
    } catch (e) {
        console.error('대화 내역 로드 실패:', e);
    }
}

async function sendInquiryMessage() {
    const input = document.querySelector('.moyo-chat-input');
    const categorySelect = document.getElementById('inquiry-category');
    const titleInput = document.getElementById('inquiry-title');
    const isReplyMode = selectedCsId != null;

    const content = input.value.trim();
    const title = titleInput.value.trim();
    const categoryId = Number(categorySelect.value || 1);

    if (!isReplyMode && title === '') {
        titleInput.focus();
        return;
    }
    if (content === '') {
        input.focus();
        return;
    }

    const sendButton = document.querySelector('.moyo-inquiry-send-btn');
    if (sendButton) sendButton.disabled = true;

    try {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('categoryId', String(categoryId));
        formData.append('title', title || '문의');
        if (selectedCsId != null) formData.append('csId', String(selectedCsId));

        const fileInput = document.getElementById('inquiry-files');
        Array.from(fileInput && fileInput.files ? fileInput.files : []).forEach(function(file) {
            formData.append('files', file);
        });

        const response = await fetch(contextPath + '/common/inquiry/send', {
            method: 'POST',
            body: formData
        });

        if (response.status === 401) {
            window.location.href = contextPath + '/users/loginForm';
            return;
        }

        if (response.ok) {
            const savedCsId = Number(await response.text());
            if (!Number.isFinite(savedCsId) || savedCsId <= 0) {
                throw new Error('저장된 문의 번호를 확인할 수 없습니다.');
            }

            selectedCsId = savedCsId;
            input.value = '';
            clearInquiryAttachments();
            await loadInquiryList(false);

            const savedInquiry = inquiryListCache.find(function(item) {
                return Number(item.csId) === Number(savedCsId);
            });
            if (savedInquiry) {
                await selectInquiry(savedCsId);
            } else {
                await loadChatMessages(savedCsId, null);
                startInquiryPolling();
            }
        } else {
            const message = await response.text();
            alert(message || '문의 전송에 실패했습니다.');
        }
    } catch (error) {
        console.error('문의 전송 오류:', error);
        alert('문의 전송 중 오류가 발생했습니다.');
    } finally {
        if (sendButton) sendButton.disabled = false;
    }
}
</script>

</body>
</html>
