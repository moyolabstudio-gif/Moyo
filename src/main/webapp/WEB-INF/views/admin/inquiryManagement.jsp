<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MOYO | 문의 관리</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/adminShell.css?v=admin-center-v1">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/adminInquiry.css?v=admin-inquiry-layout-v19">
<script src="${pageContext.request.contextPath}/js/moyoCsrf.js?v=csrf-v1"></script>
</head>
<body class="moyo-admin-shell">
<%@ include file="../common/header.jsp"%>

<aside class="admin-shell-sidebar" aria-label="관리자 메뉴">
    <div class="admin-shell-brand"><small>MOYO ADMIN</small><strong>관리자 센터</strong></div>
    <nav class="admin-shell-nav">
        <a href="${pageContext.request.contextPath}/admin"><i class="fa-solid fa-chart-pie"></i><span>대시보드</span></a>
        <a href="${pageContext.request.contextPath}/admin#users"><i class="fa-regular fa-user"></i><span>사용자 관리</span></a>
        <a href="${pageContext.request.contextPath}/admin/inquiries" class="is-active"><i class="fa-regular fa-comments"></i><span>문의 관리</span></a>
        <a href="${pageContext.request.contextPath}/common/noticeList"><i class="fa-regular fa-rectangle-list"></i><span>공지사항 관리</span></a>
        <span class="is-disabled"><i class="fa-solid fa-triangle-exclamation"></i><span>신고·제재 관리</span><span class="admin-shell-badge">준비중</span></span>
        <span class="is-disabled"><i class="fa-solid fa-sliders"></i><span>서비스 운영</span><span class="admin-shell-badge">준비중</span></span>
        <a href="${pageContext.request.contextPath}/admin/logs"><i class="fa-solid fa-chart-line"></i><span>로그·통계</span></a>
        <div class="admin-shell-exit"><a href="${pageContext.request.contextPath}/"><i class="fa-solid fa-arrow-left"></i><span>MOYO로 돌아가기</span></a></div>
    </nav>
</aside>

<main class="admin-inquiry-page">
    <section class="admin-inquiry-hero">
        <div>
            <p class="admin-inquiry-kicker">MOYO 관리자</p>
            <h1>문의 관리</h1>
            <p>접수된 문의를 확인하고 답변하거나 종료할 수 있어요.</p>
        </div>
        <a class="admin-inquiry-back" href="${pageContext.request.contextPath}/admin">관리자 센터</a>
    </section>

    <section class="admin-inquiry-shell">
        <aside class="admin-inquiry-list-panel">
            <div class="admin-inquiry-list-head">
                <div>
                    <h2>문의 목록</h2>
                    <span id="admin-inquiry-count">0건</span>
                </div>
                <button type="button" class="admin-inquiry-refresh" id="admin-inquiry-refresh">새로고침</button>
            </div>

            <div class="admin-inquiry-filters" role="group" aria-label="문의 상태 필터">
                <button type="button" class="is-active" data-filter="ALL">전체</button>
                <button type="button" data-filter="WAITING">답변 대기</button>
                <button type="button" data-filter="ANSWERED">답변 완료</button>
                <button type="button" data-filter="CLOSED">종료</button>
            </div>

            <div id="admin-inquiry-list" class="admin-inquiry-list">
                <div class="admin-inquiry-empty">문의 목록을 불러오는 중입니다.</div>
            </div>
        </aside>

        <section class="admin-inquiry-detail-panel">
            <div id="admin-inquiry-detail-empty" class="admin-inquiry-detail-empty">
                <div class="admin-inquiry-empty-icon">💬</div>
                <strong>확인할 문의를 선택해주세요.</strong>
                <span>왼쪽 문의 목록에서 항목을 선택하면 상세 대화가 표시됩니다.</span>
            </div>

            <div id="admin-inquiry-detail" class="admin-inquiry-detail" hidden>
                <div class="admin-inquiry-detail-head">
                    <div class="admin-inquiry-detail-meta">
                        <div class="admin-inquiry-detail-topline">
                            <span id="detail-category" class="admin-inquiry-category">일반 문의</span>
                            <span id="detail-status" class="admin-inquiry-status">답변 대기</span>
                        </div>
                        <h2 id="detail-title">문의 제목</h2>
                        <p>
                            <span id="detail-user">문의자</span>
                            <span class="admin-inquiry-dot">·</span>
                            <span id="detail-email">이메일</span>
                            <span class="admin-inquiry-dot">·</span>
                            <span id="detail-date">접수일</span>
                        </p>
                    </div>
                    <button type="button" id="detail-status-action" class="admin-inquiry-status-action">문의 종료</button>
                </div>

                <div id="admin-inquiry-messages" class="admin-inquiry-messages"></div>

                <div class="admin-inquiry-reply-box">
                    <div class="admin-inquiry-reply-head">
                        <strong>관리자 답변</strong>
                        <span>답변을 등록하면 사용자 화면에 바로 표시됩니다.</span>
                    </div>
                    <textarea id="admin-inquiry-reply" maxlength="3000" placeholder="답변 내용을 입력해주세요."></textarea>
                    <div id="admin-inquiry-attachment-preview" class="admin-inquiry-attachment-preview" hidden></div>
                    <div class="admin-inquiry-reply-actions">
                        <div class="admin-inquiry-reply-tools">
                            <label class="admin-inquiry-attachment-button" for="admin-inquiry-files">📎 파일 첨부</label>
                            <input id="admin-inquiry-files" class="admin-inquiry-file-input" type="file" multiple>
                            <span id="admin-inquiry-reply-state" class="admin-inquiry-reply-state"></span>
                        </div>
                        <button type="button" id="admin-inquiry-reply-button" class="admin-inquiry-reply-button">답변 등록</button>
                    </div>
                </div>
            </div>
        </section>
    </section>
</main>

<script>
(function () {
    'use strict';

    const contextPath = '${pageContext.request.contextPath}';
    let inquiryList = [];
    let selectedCsId = null;
    let activeFilter = 'ALL';

    const listEl = document.getElementById('admin-inquiry-list');
    const countEl = document.getElementById('admin-inquiry-count');
    const detailEmptyEl = document.getElementById('admin-inquiry-detail-empty');
    const detailEl = document.getElementById('admin-inquiry-detail');
    const messagesEl = document.getElementById('admin-inquiry-messages');
    const replyEl = document.getElementById('admin-inquiry-reply');
    const replyButton = document.getElementById('admin-inquiry-reply-button');
    const statusActionButton = document.getElementById('detail-status-action');
    const replyStateEl = document.getElementById('admin-inquiry-reply-state');
    const replyFilesEl = document.getElementById('admin-inquiry-files');
    const replyFilesPreviewEl = document.getElementById('admin-inquiry-attachment-preview');

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function parseDate(value) {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value, includeTime) {
        const date = parseDate(value);
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        if (!includeTime) return y + '. ' + m + '. ' + d + '.';
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return y + '. ' + m + '. ' + d + '. ' + hh + ':' + mm;
    }

    function inquiryState(item) {
        if (String(item.csStatus || '').toUpperCase() === 'CLOSED') {
            return { key: 'CLOSED', label: '종료', cls: 'is-closed' };
        }
        if (String(item.lastSenderType || 'USER').toUpperCase() === 'ADMIN') {
            return { key: 'ANSWERED', label: '답변 완료', cls: 'is-answered' };
        }
        return { key: 'WAITING', label: '답변 대기', cls: 'is-waiting' };
    }

    function filteredList() {
        if (activeFilter === 'ALL') return inquiryList;
        return inquiryList.filter(function (item) {
            return inquiryState(item).key === activeFilter;
        });
    }

    function renderList() {
        const items = filteredList();
        countEl.textContent = items.length + '건';
        listEl.innerHTML = '';

        if (!items.length) {
            listEl.innerHTML = '<div class="admin-inquiry-empty">해당 상태의 문의가 없습니다.</div>';
            return;
        }

        items.forEach(function (item) {
            const state = inquiryState(item);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'admin-inquiry-item' + (Number(item.csId) === Number(selectedCsId) ? ' is-selected' : '');
            button.innerHTML =
                '<div class="admin-inquiry-item-top">' +
                    '<span class="admin-inquiry-item-user">' + escapeHtml(item.userName || ('사용자 #' + item.userId)) + '</span>' +
                    '<span class="admin-inquiry-status ' + state.cls + '">' + state.label + '</span>' +
                '</div>' +
                '<strong>' + escapeHtml(item.title || '문의') + '</strong>' +
                '<p>' + escapeHtml(item.lastContent || '') + '</p>' +
                '<div class="admin-inquiry-item-foot">' +
                    '<span>' + escapeHtml(item.categoryName || '문의') + '</span>' +
                    '<span>' + escapeHtml(formatDate(item.updatedAt || item.createdAt, false)) + '</span>' +
                '</div>';
            button.addEventListener('click', function () {
                selectInquiry(item.csId);
            });
            listEl.appendChild(button);
        });
    }

    function showDetail() {
        detailEmptyEl.hidden = true;
        detailEmptyEl.style.display = 'none';
        detailEl.hidden = false;
        detailEl.style.display = 'flex';
    }

    function showDetailEmpty(message) {
        detailEl.hidden = true;
        detailEl.style.display = 'none';
        detailEmptyEl.hidden = false;
        detailEmptyEl.style.display = 'flex';
        if (message) {
            const strong = detailEmptyEl.querySelector('strong');
            const span = detailEmptyEl.querySelector('span');
            if (strong) strong.textContent = message;
            if (span) span.textContent = '왼쪽 문의 목록에서 다시 선택해주세요.';
        }
    }

    async function loadList(keepSelection) {
        const response = await fetch(contextPath + '/admin/inquiries/list');
        if (!response.ok) throw new Error('문의 목록을 불러오지 못했습니다.');
        inquiryList = await response.json();

        if (!inquiryList.length) {
            selectedCsId = null;
            renderList();
            clearDetail();
            return;
        }

        let selected = null;
        if (keepSelection && selectedCsId != null) {
            selected = inquiryList.find(function (item) {
                return Number(item.csId) === Number(selectedCsId);
            }) || null;
        }

        if (!selected) {
            selected = inquiryList[0];
            selectedCsId = Number(selected.csId);
        }

        renderList();
        await loadDetail(selected);
    }

    async function selectInquiry(csId) {
        const selected = inquiryList.find(function (item) {
            return Number(item.csId) === Number(csId);
        });
        if (!selected) {
            clearDetail();
            return;
        }

        selectedCsId = Number(selected.csId);
        renderList();
        try {
            await loadDetail(selected);
        } catch (error) {
            console.error(error);
            showDetailEmpty('문의 상세를 불러오지 못했습니다.');
        }
    }

    function clearDetail() {
        selectedCsId = null;
        showDetailEmpty();
        replyEl.value = '';
        clearReplyAttachments();
        messagesEl.innerHTML = '';
    }

    function formatFileSize(bytes) {
        const size = Number(bytes || 0);
        if (size < 1024) return size + ' B';
        if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
        return (size / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function updateReplyAttachmentPreview() {
        const files = Array.from(replyFilesEl && replyFilesEl.files ? replyFilesEl.files : []);
        if (files.length > 5) {
            alert('첨부파일은 메시지당 최대 5개까지 등록할 수 있습니다.');
            replyFilesEl.value = '';
            replyFilesPreviewEl.innerHTML = '';
            replyFilesPreviewEl.hidden = true;
            return;
        }
        const tooLarge = files.find(function(file) { return file.size > 10 * 1024 * 1024; });
        if (tooLarge) {
            alert('첨부파일은 파일당 최대 10MB까지 등록할 수 있습니다.');
            replyFilesEl.value = '';
            replyFilesPreviewEl.innerHTML = '';
            replyFilesPreviewEl.hidden = true;
            return;
        }
        replyFilesPreviewEl.innerHTML = '';
        files.forEach(function(file) {
            const item = document.createElement('span');
            item.className = 'admin-inquiry-selected-file';
            item.textContent = file.name + ' · ' + formatFileSize(file.size);
            replyFilesPreviewEl.appendChild(item);
        });
        replyFilesPreviewEl.hidden = files.length === 0;
    }

    function clearReplyAttachments() {
        if (replyFilesEl) replyFilesEl.value = '';
        if (replyFilesPreviewEl) {
            replyFilesPreviewEl.innerHTML = '';
            replyFilesPreviewEl.hidden = true;
        }
    }

    function getAdminInquiryAttachmentDisplayName(attachment) {
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

    function renderMessages(messages, inquiry) {
        messagesEl.innerHTML = '';
        messages.forEach(function (message) {
            const fromUser = String(message.senderType || 'USER').toUpperCase() !== 'ADMIN';
            const row = document.createElement('div');
            row.className = 'admin-inquiry-message ' + (fromUser ? 'is-user' : 'is-admin');
            row.innerHTML =
                '<div class="admin-inquiry-message-meta">' +
                    '<strong>' + (fromUser ? escapeHtml(inquiry.userName || '사용자') : 'MOYO 운영팀') + '</strong>' +
                    '<span>' + escapeHtml(formatDate(message.createdAt, true)) + '</span>' +
                '</div>' +
                '<div class="admin-inquiry-message-body">' + escapeHtml(message.content || '').replace(/\n/g, '<br>') + '</div>';

            const body = row.querySelector('.admin-inquiry-message-body');
            const attachments = Array.isArray(message.attachments) ? message.attachments : [];
            if (attachments.length && body) {
                const box = document.createElement('div');
                box.className = 'admin-inquiry-message-attachments';
                attachments.forEach(function(attachment) {
                    const displayName = getAdminInquiryAttachmentDisplayName(attachment);
                    const link = document.createElement('a');
                    link.className = 'admin-inquiry-message-attachment';
                    link.href = contextPath + '/admin/inquiries/attachments/download?attachmentId=' + encodeURIComponent(attachment.attachmentId);
                    link.title = displayName;

                    const icon = document.createElement('span');
                    icon.className = 'admin-inquiry-message-attachment-icon';
                    icon.setAttribute('aria-hidden', 'true');
                    icon.textContent = '📎';

                    const name = document.createElement('span');
                    name.className = 'admin-inquiry-message-attachment-name';
                    name.textContent = displayName;

                    const size = document.createElement('span');
                    size.className = 'admin-inquiry-message-attachment-size';
                    size.textContent = formatFileSize(attachment.fileSize);

                    const download = document.createElement('span');
                    download.className = 'admin-inquiry-message-attachment-download';
                    download.setAttribute('aria-hidden', 'true');
                    download.textContent = '↓';

                    link.appendChild(icon);
                    link.appendChild(name);
                    link.appendChild(size);
                    link.appendChild(download);
                    box.appendChild(link);
                });
                body.appendChild(box);
            }
            messagesEl.appendChild(row);
        });
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async function loadDetail(inquiry) {
        const response = await fetch(contextPath + '/admin/inquiries/messages?csId=' + encodeURIComponent(inquiry.csId));
        if (!response.ok) throw new Error('문의 상세를 불러오지 못했습니다.');
        const messages = await response.json();
        const state = inquiryState(inquiry);

        showDetail();
        document.getElementById('detail-category').textContent = inquiry.categoryName || '문의';
        document.getElementById('detail-title').textContent = inquiry.title || '문의';
        document.getElementById('detail-user').textContent = inquiry.userName || ('사용자 #' + inquiry.userId);
        document.getElementById('detail-email').textContent = inquiry.email || '';
        document.getElementById('detail-date').textContent = '접수 ' + formatDate(inquiry.createdAt, true);

        const statusEl = document.getElementById('detail-status');
        statusEl.className = 'admin-inquiry-status ' + state.cls;
        statusEl.textContent = state.label;

        const closed = String(inquiry.csStatus || '').toUpperCase() === 'CLOSED';
        statusActionButton.textContent = closed ? '문의 다시 열기' : '문의 종료';
        statusActionButton.dataset.status = closed ? 'OPEN' : 'CLOSED';
        replyEl.disabled = closed;
        replyButton.disabled = closed;
        replyEl.placeholder = closed ? '종료된 문의입니다. 다시 열면 답변할 수 있어요.' : '답변 내용을 입력해주세요.';
        replyStateEl.textContent = '';
        renderMessages(messages, inquiry);
    }

    async function sendReply() {
        const content = replyEl.value.trim();
        if (selectedCsId == null || !content) {
            if (!content) replyEl.focus();
            return;
        }

        replyButton.disabled = true;
        replyStateEl.textContent = '등록 중...';
        try {
            const formData = new FormData();
            formData.append('csId', String(selectedCsId));
            formData.append('content', content);
            Array.from(replyFilesEl && replyFilesEl.files ? replyFilesEl.files : []).forEach(function(file) {
                formData.append('files', file);
            });

            const response = await fetch(contextPath + '/admin/inquiries/reply', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(await response.text());
            replyEl.value = '';
            clearReplyAttachments();
            replyStateEl.textContent = '답변이 등록되었습니다.';
            await loadList(true);
        } catch (error) {
            replyStateEl.textContent = error.message || '답변 등록에 실패했습니다.';
        } finally {
            replyButton.disabled = false;
        }
    }

    async function changeStatus() {
        if (selectedCsId == null) return;
        const nextStatus = statusActionButton.dataset.status;
        statusActionButton.disabled = true;
        try {
            const response = await fetch(contextPath + '/admin/inquiries/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csId: selectedCsId, status: nextStatus })
            });
            if (!response.ok) throw new Error(await response.text());
            await loadList(true);
        } catch (error) {
            replyStateEl.textContent = error.message || '상태 변경에 실패했습니다.';
        } finally {
            statusActionButton.disabled = false;
        }
    }

    document.querySelectorAll('.admin-inquiry-filters button').forEach(function (button) {
        button.addEventListener('click', function () {
            activeFilter = button.dataset.filter;
            document.querySelectorAll('.admin-inquiry-filters button').forEach(function (item) {
                item.classList.toggle('is-active', item === button);
            });
            renderList();
        });
    });

    document.getElementById('admin-inquiry-refresh').addEventListener('click', function () {
        loadList(true).catch(console.error);
    });
    replyButton.addEventListener('click', sendReply);
    if (replyFilesEl) replyFilesEl.addEventListener('change', updateReplyAttachmentPreview);
    statusActionButton.addEventListener('click', changeStatus);

    loadList(false).catch(function (error) {
        console.error(error);
        listEl.innerHTML = '<div class="admin-inquiry-empty">문의 목록을 불러오지 못했습니다.</div>';
        showDetailEmpty('문의 상세를 불러오지 못했습니다.');
    });
})();
</script>
</body>
</html>
