<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<jsp:useBean id="now" class="java.util.Date" />
<fmt:formatDate var="todayKey" value="${now}" pattern="yyyyMMdd" />
                    <c:forEach var="note" items="${noteList}">
                        <fmt:formatDate var="noteDateKey" value="${empty note.updDt ? note.regDt : note.updDt}" pattern="yyyyMMdd" />
                        <article class="nl-note-card ${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? 'nl-card-FRIEND' : 'nl-card-'}${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? '' : note.scopeType}"
                                 data-note-id="${note.noteId}"
                                 data-note-scope="${note.scopeType}"
                                 data-ws-id="${note.wsId}"
                                 data-proj-id="${note.projId}"
                                 data-folder-id="${note.folderId}"
                                 data-can-manage="${note.canManage}"
                                 data-title="${note.noteTitle}"
                                 data-scope-key="${note.scopeType eq 'WS' ? 'WS:' : note.scopeType eq 'PROJ' ? 'PROJ:' : 'PRIVATE'}${note.scopeType eq 'WS' ? note.wsId : note.scopeType eq 'PROJ' ? note.projId : ''}"
                                 data-date="<fmt:formatDate value='${empty note.updDt ? note.regDt : note.updDt}' pattern='yyyyMMddHHmmss' />">
                            <label class="nl-card-select ${note.canManage ? '' : 'is-disabled'}"
                                   title="${note.canManage ? '노트 선택' : '이동·삭제 권한 없음'}">
                                <input type="checkbox"
                                       class="nl-card-select-input"
                                       value="${note.noteId}"
                                       aria-label="${note.canManage ? note.noteTitle.concat(' 선택') : note.noteTitle.concat(' 선택 불가: 이동·삭제 권한 없음')}"
                                       ${note.canManage ? '' : 'disabled'}>
                                <span aria-hidden="true"></span>
                            </label>
                            <c:choose>
                                <c:when test="${scope eq 'TRASH'}">
                                    <div class="nl-card-menu-wrap">
                                        <button type="button" class="nl-card-menu-button" aria-label="노트 메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                        <div class="nl-card-menu" hidden>
                                            <button type="button" data-note-action="restore"><i class="fa-solid fa-rotate-left"></i> 복원</button>
                                            <button type="button" class="is-danger" data-note-action="permanent-delete"><i class="fa-regular fa-trash-can"></i> 영구 삭제</button>
                                        </div>
                                    </div>
                                </c:when>
                                <c:otherwise>
                                    <button type="button"
                                            class="nl-pin-button ${note.pinned ? 'is-pinned' : ''}"
                                            data-note-id="${note.noteId}"
                                            aria-label="${note.pinned ? '중요 해제' : '중요 표시'}"
                                            title="${note.pinned ? '중요 해제' : '중요 표시'}">★</button>
                                    <c:if test="${note.canManage}">
                                        <div class="nl-card-menu-wrap">
                                            <button type="button" class="nl-card-menu-button" aria-label="노트 메뉴" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                            <div class="nl-card-menu" hidden>
                                                <button type="button" data-note-action="move"><i class="fa-regular fa-folder-open"></i> 폴더 이동</button>
                                                <button type="button" class="is-danger" data-note-action="trash"><i class="fa-regular fa-trash-can"></i> 휴지통으로 이동</button>
                                            </div>
                                        </div>
                                    </c:if>
                                </c:otherwise>
                            </c:choose>
                            <a class="nl-note-link ${scope eq 'TRASH' ? 'is-trash-card' : ''}" href="${scope eq 'TRASH' ? '#' : '/note/detail?noteId='}${scope eq 'TRASH' ? '' : note.noteId}${scope eq 'TRASH' ? '' : '&'}${scope eq 'TRASH' ? '' : scopeQuery}">
                                <div class="nl-card-row nl-card-head-row">
                                    <h3 class="nl-card-title">
                                        <span class="nl-title-icon" aria-hidden="true"><c:out value="${empty note.icon ? '📝' : note.icon}" /></span>
                                        <span class="nl-title-text"><c:out value="${empty note.noteTitle ? '제목 없음' : note.noteTitle}" /></span>
                                        <c:if test="${scope eq 'TRASH'}">
                                            <span class="nl-trash-retention-badge ${note.trashRemainingDays le 1 ? 'is-urgent' : ''}"><c:out value="${note.trashRemainingLabel}" /></span>
                                        </c:if>
                                        <c:if test="${not (scope eq 'FRIEND' and note.scopeType eq 'PRIVATE' and not note.ownedByMe)}">
                                            <span class="nl-scope-badge nl-title-scope ${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? 'nl-scope-FRIEND' : 'nl-scope-'}${note.scopeType eq 'PRIVATE' and not note.ownedByMe ? '' : note.scopeType}">
                                                <c:choose>
                                                    <c:when test="${note.scopeType eq 'WS'}">그룹</c:when>
                                                    <c:when test="${note.scopeType eq 'PROJ'}">프로젝트</c:when>
                                                    <c:when test="${note.scopeType eq 'PRIVATE' and not note.ownedByMe}">친구</c:when>
                                                    <c:otherwise>개인</c:otherwise>
                                                </c:choose>
                                            </span>
                                        </c:if>
                                        <c:if test="${not note.ownedByMe}">
                                            <span class="nl-permission-badge nl-title-permission ${note.canEdit ? 'is-editable' : 'is-shared'}">
                                                ${note.canEdit ? '편집' : '공유'}
                                            </span>
                                        </c:if>
                                    </h3>
                                </div>

                                <div class="nl-card-row nl-card-meta-row">
                                    <div class="nl-card-author">
                                        <span class="nl-author-label">작성자</span>
                                        <strong><c:out value="${empty note.userName ? '알 수 없음' : note.userName}" /></strong>
                                    </div>
                                    <div class="nl-card-counts" aria-label="노트 부가 정보">
                                        <c:if test="${note.tableCount gt 0}">
                                            <span class="nl-card-count" title="표 ${note.tableCount}개"><i class="fa-solid fa-table-cells" aria-hidden="true"></i><b>${note.tableCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.imageCount gt 0}">
                                            <span class="nl-card-count" title="이미지 ${note.imageCount}개"><i class="fa-regular fa-image" aria-hidden="true"></i><b>${note.imageCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.videoCount gt 0}">
                                            <span class="nl-card-count" title="영상 ${note.videoCount}개"><i class="fa-regular fa-circle-play" aria-hidden="true"></i><b>${note.videoCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.attachmentCount gt 0}">
                                            <span class="nl-card-count" title="첨부파일 ${note.attachmentCount}개"><i class="fa-solid fa-paperclip" aria-hidden="true"></i><b>${note.attachmentCount}</b></span>
                                        </c:if>
                                        <c:if test="${note.feedbackCount gt 0}">
                                            <span class="nl-card-count" title="피드백 ${note.feedbackCount}개"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i><b>${note.feedbackCount}</b></span>
                                        </c:if>
                                    </div>
                                </div>

                                <p class="nl-card-preview"><c:out value="${note.previewContent}" /></p>

                                <div class="nl-card-row nl-card-foot-row">
                                    <div class="nl-card-location">
                                        <c:choose>
                                            <c:when test="${note.scopeType eq 'PRIVATE' and not note.ownedByMe}">
                                                <strong><c:out value="${empty note.userName ? '알 수 없음' : note.userName}" /></strong>
                                            </c:when>
                                            <c:when test="${note.scopeType eq 'WS'}">
                                                <strong><c:out value="${empty note.workspaceName ? '그룹' : note.workspaceName}" /></strong>
                                                <span>/</span>
                                                <span><c:out value="${empty note.folderPath ? '미분류' : note.folderPath}" /></span>
                                            </c:when>
                                            <c:when test="${note.scopeType eq 'PROJ'}">
                                                <strong><c:out value="${empty note.projectName ? '프로젝트' : note.projectName}" /></strong>
                                                <span>/</span>
                                                <span><c:out value="${empty note.folderPath ? '미분류' : note.folderPath}" /></span>
                                            </c:when>
                                            <c:otherwise>
                                                <strong>개인</strong>
                                                <span>/</span>
                                                <span><c:out value="${empty note.folderPath ? '미분류' : note.folderPath}" /></span>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                    <div class="nl-card-update-meta">
                                        <c:if test="${not empty note.updatedBy and note.updatedBy ne note.userId and not empty note.updatedByName}">
                                            <span class="nl-card-updater" title="마지막 수정자"><span class="nl-card-updater-label">수정</span><span class="nl-card-updater-name"><c:out value="${note.updatedByName}" /></span></span><span class="nl-card-update-dot" aria-hidden="true">·</span>
                                        </c:if>
                                        <time datetime="<fmt:formatDate value="${empty note.updDt ? note.regDt : note.updDt}" pattern="yyyy-MM-dd'T'HH:mm:ss" />">
                                            <c:choose>
                                                <c:when test="${noteDateKey eq todayKey}">
                                                    오늘 <fmt:formatDate value="${empty note.updDt ? note.regDt : note.updDt}" pattern="HH:mm" />
                                                </c:when>
                                                <c:otherwise>
                                                    <fmt:formatDate value="${empty note.updDt ? note.regDt : note.updDt}" pattern="yyyy.MM.dd" />
                                                </c:otherwise>
                                            </c:choose>
                                        </time>
                                    </div>
                                </div>
                            </a>
                        </article>
                    </c:forEach>
