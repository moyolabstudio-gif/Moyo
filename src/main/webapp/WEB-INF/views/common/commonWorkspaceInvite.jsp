<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<div id="workspaceInviteOverlay"
     class="workspace-invite-overlay"
     data-workspace-invite-close></div>

<section id="workspaceInviteModal"
         class="workspace-invite-modal"
         role="dialog"
         aria-modal="true"
         aria-labelledby="workspaceInviteTitle"
         data-workspace-id="${workspace.wsId}"
         data-context-path="${pageContext.request.contextPath}">
    <div class="workspace-invite-head">
        <div>
            <span>그룹 멤버</span>
            <h3 id="workspaceInviteTitle">멤버 초대</h3>
        </div>
        <button type="button"
                class="workspace-invite-close"
                data-workspace-invite-close
                aria-label="닫기">×</button>
    </div>

    <div class="workspace-invite-body">
        <label class="workspace-invite-search" for="workspaceInviteKeyword">
            <span class="workspace-invite-search-icon" aria-hidden="true">⌕</span>
            <input type="search"
                   id="workspaceInviteKeyword"
                   autocomplete="off"
                   placeholder="이름 또는 이메일로 검색">
        </label>

        <div id="workspaceInviteResults" class="workspace-invite-results" aria-live="polite">
            <div class="workspace-invite-empty">이름이나 이메일로 멤버를 검색하세요.</div>
        </div>
    </div>
</section>
