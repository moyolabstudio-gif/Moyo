package com.springboot.project.service.impl;

import com.springboot.project.dao.InoteDAO;
import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.dao.IcontentRecordItemDAO;
import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import com.springboot.project.dto.noteVersionDTO;
import com.springboot.project.service.InoteService;
import com.springboot.project.service.IcontentShareService;
import com.springboot.project.service.ContentInputSecurityService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class noteServiceImpl implements InoteService {

    private static final Logger log = LoggerFactory.getLogger(noteServiceImpl.class);

    @Value("${moyo.upload.note-dir:C:/uploads/notes/}")
    private String noteUploadPath;

    @Autowired
    private InoteDAO inoteDAO;

    @Autowired
    private IcontentShareService contentShareService;

    @Autowired
    private IprojectDAO projectDAO;

    @Autowired
    private ContentInputSecurityService contentInputSecurityService;

    @Autowired
    private IcontentRecordItemDAO contentRecordItemDAO;

    @Override
    public List<noteDTO> getNoteList(String scopeType, Long wsId, Long projId, Long userId, String keyword) {
        String normalizedScope = normalizeScope(scopeType);
        if ("TRASH".equals(normalizedScope)) purgeExpiredTrashNotes();
        Map<String, Object> paramMap = createScopeParam(normalizedScope, wsId, projId, userId);
        paramMap.put("keyword", keyword == null || keyword.trim().isEmpty() ? null : keyword.trim());
        List<noteDTO> noteList = inoteDAO.selectNoteList(paramMap);
        preparePreviewText(noteList);
        attachEmptyFileList(noteList);
        return noteList;
    }

    @Override
    public List<noteDTO> getNoteListPage(String scopeType, Long wsId, Long projId, Long userId, String keyword,
                                         boolean importantOnly, Long friendUserId, Long folderId, int offset, int limit) {
        String normalizedScope = normalizeScope(scopeType);
        if ("TRASH".equals(normalizedScope)) purgeExpiredTrashNotes();
        Map<String, Object> paramMap = createScopeParam(normalizedScope, wsId, projId, userId);
        paramMap.put("keyword", keyword == null || keyword.trim().isEmpty() ? null : keyword.trim());
        paramMap.put("importantOnly", importantOnly);
        paramMap.put("friendUserId", friendUserId);
        paramMap.put("folderId", folderId);
        paramMap.put("startRow", Math.max(offset, 0));
        paramMap.put("endRow", Math.max(offset, 0) + Math.min(Math.max(limit, 1), 51));
        List<noteDTO> noteList = inoteDAO.selectNoteList(paramMap);
        preparePreviewText(noteList);
        attachEmptyFileList(noteList);
        return noteList;
    }

    @Override
    public List<noteDTO> getMainNoteList(String scopeType, Long wsId, Long projId, Long userId, int limit) {
        Map<String, Object> paramMap = createScopeParam(scopeType, wsId, projId, userId);
        paramMap.put("limit", Math.min(Math.max(limit, 1), 3));
        List<noteDTO> noteList = inoteDAO.selectMainNoteList(paramMap);
        attachEmptyFileList(noteList);
        return noteList;
    }

    @Override
    public List<noteDTO> getProfilePublicNotes(Long profileUserId, Long viewerUserId, int limit) {
        if (profileUserId == null) return Collections.emptyList();
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("profileUserId", profileUserId);
        paramMap.put("viewerUserId", viewerUserId);
        paramMap.put("limit", Math.min(Math.max(limit, 1), 12));
        List<noteDTO> noteList = inoteDAO.selectProfilePublicNotes(paramMap);
        preparePreviewText(noteList);
        attachEmptyFileList(noteList);
        return noteList;
    }

    @Override
    public int countProfilePublicNotes(Long profileUserId) {
        if (profileUserId == null) return 0;
        return inoteDAO.countProfilePublicNotes(profileUserId);
    }


    @Override
    @Transactional
    public boolean pinNote(Long userId, Long noteId) {
        noteDTO note = inoteDAO.selectNoteDetail(noteId, userId);
        if (note == null) throw new IllegalStateException("노트를 찾을 수 없습니다.");
        String pinScopeKey = buildPinScopeKey("IMPORTANT", null, null, userId);
        Integer pinOrder = inoteDAO.selectNextPinOrder(userId, pinScopeKey);
        if (pinOrder == null) pinOrder = 1;
        return inoteDAO.insertNotePin(userId, pinScopeKey, noteId, pinOrder) > 0;
    }

    @Override
    public boolean unpinNote(Long userId, Long noteId) {
        return inoteDAO.deleteNotePin(userId, noteId) > 0;
    }

    @Override
    public boolean canDeleteNote(Long noteId, Long userId) {
        if (noteId == null || userId == null) return false;
        return inoteDAO.countNoteDeletePermission(noteId, userId) > 0;
    }

    @Override
    public noteDTO getNoteDetail(Long noteId, Long userId) {
        noteDTO note = inoteDAO.selectNoteDetail(noteId, userId);
        if (note != null) note.setFileList(inoteDAO.selectNoteFileList(noteId));
        return note;
    }

    @Override
    @Transactional
    public boolean registerNote(noteDTO note) {
        normalizeNote(note);
        boolean inserted = inoteDAO.insertNote(note) > 0;
        if (inserted) recordInitialNoteVersionSafely(note.getNoteId(), note.getUserId());
        return inserted;
    }

    @Override
    @Transactional
    public void registerNoteWithFiles(noteDTO note, List<noteFileDTO> fileList) {
        normalizeNote(note);
        inoteDAO.insertNote(note);
        recordInitialNoteVersionSafely(note.getNoteId(), note.getUserId());
        if (fileList != null && !fileList.isEmpty()) {
            for (noteFileDTO file : fileList) {
                file.setNoteId(note.getNoteId());
                inoteDAO.insertNoteFile(file);
            }
        }
    }

    @Override
    @Transactional
    public boolean modifyNote(noteDTO note) {
        sanitizeEditableNote(note);
        noteVersionDTO before = inoteDAO.selectNoteSnapshot(note.getNoteId());
        boolean updated = inoteDAO.updateNote(note) > 0;
        if (!updated) return false;
        noteVersionDTO after = inoteDAO.selectNoteSnapshot(note.getNoteId());
        if (isVersionChanged(before, after)) {
            recordCurrentNoteVersion(note.getNoteId(), note.getUpdatedBy(), "UPDATE", null);
        }
        return true;
    }

    @Override
    @Transactional
    public boolean autosaveNote(noteDTO note) {
        sanitizeEditableNote(note);
        if (note == null || note.getNoteId() == null || note.getUpdatedBy() == null) return false;
        return inoteDAO.updateNoteAutosave(note) > 0;
    }

    @Override
    public List<noteVersionDTO> getNoteVersions(Long noteId, Long userId) {
        noteDTO readable = getNoteDetail(noteId, userId);
        if (readable == null) throw new IllegalArgumentException("노트를 찾을 수 없습니다.");
        return inoteDAO.selectNoteVersions(noteId);
    }

    @Override
    @Transactional
    public noteVersionDTO restoreNoteVersion(Long noteId, Long noteVersionId, Long userId) {
        noteDTO note = getNoteDetail(noteId, userId);
        if (note == null) throw new IllegalArgumentException("노트를 찾을 수 없습니다.");
        if (!note.isCanEdit()) throw new IllegalStateException("노트를 복원할 권한이 없습니다.");
        noteVersionDTO version = inoteDAO.selectNoteVersion(noteId, noteVersionId);
        if (version == null) throw new IllegalArgumentException("복원할 버전을 찾을 수 없습니다.");
        String safeTitle = contentInputSecurityService.singleLine(version.getNoteTitle(), 200, false);
        String safeContent = contentInputSecurityService.richHtml(version.getNoteContent());
        if (inoteDAO.restoreNoteVersion(noteId, safeTitle, safeContent, userId) <= 0) {
            throw new IllegalArgumentException("복원할 노트를 찾을 수 없습니다.");
        }
        recordCurrentNoteVersion(noteId, userId, "RESTORE", noteVersionId);
        return inoteDAO.selectNoteVersions(noteId).get(0);
    }

    @Override
    public void recordCurrentNoteVersion(Long noteId, Long changedBy, String changeType, Long restoredFromVersionId) {
        if (noteId == null || changedBy == null) return;
        noteVersionDTO current = inoteDAO.selectNoteSnapshot(noteId);
        if (current == null) return;
        current.setChangedBy(changedBy);
        current.setChangeType(changeType == null ? "UPDATE" : changeType.toUpperCase());
        current.setRestoredFromVersionId(restoredFromVersionId);
        inoteDAO.insertNoteVersion(current);
    }

    private void recordInitialNoteVersionSafely(Long noteId, Long changedBy) {
        try {
            recordCurrentNoteVersion(noteId, changedBy, "CREATE", null);
        } catch (RuntimeException ex) {
            // 버전 이력 저장소가 아직 배포되지 않았거나 일시적으로 실패해도
            // 노트 본문 생성 자체는 롤백하지 않는다. 이력 기능은 별도로 복구할 수 있다.
            log.warn("Initial note version save failed. noteId={}", noteId, ex);
        }
    }

    private boolean isVersionChanged(noteVersionDTO before, noteVersionDTO after) {
        if (before == null || after == null) return true;
        return !java.util.Objects.equals(before.getNoteTitle(), after.getNoteTitle())
                || !java.util.Objects.equals(before.getNoteContent(), after.getNoteContent());
    }

    @Override
    @Transactional
    public boolean moveNoteToTrash(Long noteId, Long userId) {
        int updated = inoteDAO.moveNoteToTrash(noteId, userId);
        if (updated > 0) contentRecordItemDAO.updateItemsDeletedByContent("NOTE", noteId, "Y");
        return updated > 0;
    }

    @Override
    @Transactional
    public boolean restoreNoteFromTrash(Long noteId, Long userId) {
        purgeExpiredTrashNotes();
        int updated = inoteDAO.restoreNoteFromTrash(noteId, userId);
        if (updated > 0) contentRecordItemDAO.updateItemsDeletedByContent("NOTE", noteId, "N");
        return updated > 0;
    }

    @Override
    public boolean canPermanentlyDeleteNote(Long noteId, Long userId) {
        purgeExpiredTrashNotes();
        return inoteDAO.countTrashOwner(noteId, userId) > 0;
    }

    @Override
    @Transactional
    public int purgeExpiredTrashNotes() {
        List<Long> noteIds = inoteDAO.selectExpiredTrashNoteIds();
        if (noteIds == null || noteIds.isEmpty()) return 0;

        int deletedCount = 0;
        for (Long noteId : noteIds) {
            if (noteId == null) continue;
            List<noteFileDTO> files = inoteDAO.selectNoteFileList(noteId);
            if (files != null) {
                for (noteFileDTO file : files) {
                    if (file != null) deletePhysicalFile(file.getFilePath());
                }
            }
            if (removeNote(noteId)) deletedCount++;
        }
        return deletedCount;
    }

    @Override
    @Transactional
    public boolean removeNoteForAccountWithdrawal(Long noteId) {
        if (noteId == null) return false;
        List<noteFileDTO> files = inoteDAO.selectNoteFileList(noteId);
        if (files != null) {
            for (noteFileDTO file : files) {
                if (file != null) deletePhysicalFile(file.getFilePath());
            }
        }
        return removeNote(noteId);
    }

    @Override
    @Transactional
    public boolean removeNote(Long noteId) {
        contentShareService.removeContentShares("NOTE", noteId);
        inoteDAO.deleteNotePinsByNoteId(noteId);
        inoteDAO.deleteNoteReplyReactionsByNoteId(noteId);
        inoteDAO.deleteNoteRepliesByNoteId(noteId);
        inoteDAO.deleteNoteFilesByNoteId(noteId);
        int deleted = inoteDAO.deleteNote(noteId);
        if (deleted > 0) contentRecordItemDAO.deleteItemsByContent("NOTE", noteId);
        return deleted > 0;
    }

    @Override
    public boolean registerNoteFile(noteFileDTO file) {
        return inoteDAO.insertNoteFile(file) > 0;
    }

    @Override
    public List<noteFileDTO> getNoteFileList(Long noteId) {
        return inoteDAO.selectNoteFileList(noteId);
    }

    @Override
    public noteFileDTO getNoteFile(Long fileId) {
        return inoteDAO.selectNoteFile(fileId);
    }

    @Override
    public boolean removeNoteFile(Long fileId) {
        return inoteDAO.deleteNoteFile(fileId) > 0;
    }

    @Override
    public boolean removeNoteFilesByNoteId(Long noteId) {
        return inoteDAO.deleteNoteFilesByNoteId(noteId) > 0;
    }

    @Override
    public boolean isMoyoPublicNote(Long noteId) {
        return noteId != null && inoteDAO.countMoyoPublicNote(noteId) > 0;
    }

    @Override
    @Transactional
    public boolean updateMoyoPublic(Long noteId, Long userId, boolean moyoPublic) {
        if (noteId == null || userId == null) return false;
        return inoteDAO.updateMoyoPublic(noteId, userId, moyoPublic ? "Y" : "N") > 0;
    }

    @Override
    @Transactional
    public int recordNoteView(Long noteId) {
        if (noteId == null) return 0;
        inoteDAO.incrementNoteViewCount(noteId);
        return inoteDAO.selectNoteViewCount(noteId);
    }

    @Override
    public Map<String, Object> getNoteReactionStatus(Long noteId, Long userId) {
        if (noteId == null) return Map.of("viewCount", 0, "likeCount", 0, "liked", false);
        return Map.of(
                "viewCount", inoteDAO.selectNoteViewCount(noteId),
                "likeCount", inoteDAO.countAllNoteLikes(noteId),
                "liked", userId != null && inoteDAO.countNoteLike(noteId, userId) > 0
        );
    }

    @Override
    @Transactional
    public Map<String, Object> toggleNoteLike(Long noteId, Long userId) {
        if (noteId == null || userId == null) {
            return Map.of("liked", false, "likeCount", 0, "viewCount", 0);
        }
        boolean liked = inoteDAO.countNoteLike(noteId, userId) > 0;
        if (liked) inoteDAO.deleteNoteLike(noteId, userId);
        else inoteDAO.insertNoteLike(noteId, userId);
        return Map.of(
                "liked", !liked,
                "likeCount", inoteDAO.countAllNoteLikes(noteId),
                "viewCount", inoteDAO.selectNoteViewCount(noteId)
        );
    }

    @Override
    public List<noteReplyDTO> getNoteReplyList(Long noteId) {
        return inoteDAO.selectNoteReplyList(noteId, null);
    }

    @Override
    public List<noteReplyDTO> getNoteReplyList(Long noteId, Long currentUserId) {
        return inoteDAO.selectNoteReplyList(noteId, currentUserId);
    }

    @Override
    public boolean canReplyToNoteReply(Long noteId, Long replyId) {
        return noteId != null && replyId != null && inoteDAO.countRootNoteReply(noteId, replyId) > 0;
    }

    @Override
    public boolean toggleNoteReplyLike(Long replyId, Long userId) {
        if (replyId == null || userId == null) return false;
        if (inoteDAO.countNoteReplyLike(replyId, userId) > 0) {
            return inoteDAO.deleteNoteReplyLike(replyId, userId) > 0;
        }
        return inoteDAO.insertNoteReplyLike(replyId, userId) > 0;
    }

    @Override
    public boolean registerNoteReply(noteReplyDTO reply) {
        return inoteDAO.insertNoteReply(reply) > 0;
    }

    @Override
    public boolean modifyNoteReply(noteReplyDTO reply) {
        if (reply == null || reply.getReplyId() == null || reply.getNoteId() == null || reply.getUserId() == null) return false;
        String content = reply.getReplyContent() == null ? "" : reply.getReplyContent().trim();
        if (content.isEmpty()) return false;
        reply.setReplyContent(content);
        return inoteDAO.updateNoteReply(reply) > 0;
    }

    @Override
    @Transactional
    public boolean removeNoteReply(Long replyId, Long userId) {
        if (replyId == null || userId == null) return false;

        // 본인 댓글(루트 또는 답글)만 삭제 대상이 된다. 루트 댓글이면
        // ON DELETE CASCADE로 함께 삭제될 답글들의 좋아요까지 먼저 정리한다.
        inoteDAO.deleteNoteReplyReactionsForOwnedThread(replyId, userId);
        return inoteDAO.deleteNoteReply(replyId, userId) > 0;
    }


    private void deletePhysicalFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            File file = new File(filePath);
            if (!file.isAbsolute()) file = new File(noteUploadPath, filePath);
            if (file.exists() && file.isFile()) file.delete();
        } catch (Exception ignored) {
            // 파일 삭제 실패가 DB 휴지통 정리를 막으면 안 된다.
        }
    }

    private Map<String, Object> createScopeParam(String scopeType, Long wsId, Long projId, Long userId) {
        String normalizedScope = normalizeScope(scopeType);
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("scopeType", normalizedScope);
        paramMap.put("wsId", wsId);
        paramMap.put("projId", projId);
        paramMap.put("userId", userId);
        paramMap.put("pinScopeKey", buildPinScopeKey(normalizedScope, wsId, projId, userId));
        return paramMap;
    }


    private void preparePreviewText(List<noteDTO> noteList) {
        if (noteList == null) return;
        for (noteDTO note : noteList) {
            if (note == null) continue;
            String originalHtml = note.getPreviewContent();
            // 표·이미지·영상 개수는 목록 쿼리에서 원본 CLOB 전체를 기준으로 계산한다.
            // PREVIEW_CONTENT는 앞부분만 잘라 오므로 여기서 다시 세면 뒤쪽 미디어가 누락된다.
            note.setPreviewContent(toPreviewText(originalHtml));
        }
    }

    private int countOpeningTags(String html, String tagName) {
        if (html == null || html.isBlank()) return 0;
        String decoded = decodeBasicHtmlEntities(html);
        Pattern pattern = Pattern.compile("(?i)<\\s*" + Pattern.quote(tagName) + "\\b");
        Matcher matcher = pattern.matcher(decoded);
        int count = 0;
        while (matcher.find()) count++;
        return count;
    }

    private int countVideoElements(String html) {
        if (html == null || html.isBlank()) return 0;
        String decoded = decodeBasicHtmlEntities(html);
        // CKEditor 영상은 video/iframe/oembed 중 하나로 저장될 수 있다.
        Pattern pattern = Pattern.compile("(?i)<\\s*(?:video|iframe|oembed)\\b");
        Matcher matcher = pattern.matcher(decoded);
        int count = 0;
        while (matcher.find()) count++;
        return count;
    }

    private String decodeBasicHtmlEntities(String html) {
        return html
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&apos;", "'")
                .replace("&amp;", "&");
    }

    private String toPreviewText(String html) {
        if (html == null || html.isBlank()) return null;

        // 목록 미리보기는 원문 HTML을 보여주는 영역이 아니다.
        // 문단/띄어쓰기는 유지하되 이미지·스타일·잘린 태그 조각은 완전히 제거한다.
        String text = decodeBasicHtmlEntities(html)
                .replaceAll("(?is)<script\\b[^>]*>.*?</script>", " ")
                .replaceAll("(?is)<table\\b[^>]*>.*?</table>", " ")
                .replaceAll("(?is)<(?:video|iframe|oembed)\\b[^>]*>.*?</(?:video|iframe|oembed)>", " ")
                .replaceAll("(?is)<(?:video|iframe|oembed)\\b[^>]*(?:/>|>|$)", " ")
                .replaceAll("(?is)<style\\b[^>]*>.*?</style>", " ")
                // include된 style 조각이 잘려서 본문 미리보기로 들어온 경우 제거한다.
                // 예: .moyo-footer { position: relative; ... }
                .replaceAll("(?is)@[a-z-]+\\s*[^{}]*\\{[^{}]*\\}", " ")
                .replaceAll("(?is)\\.[a-z0-9_-]+[^{}\\n]*\\{[^{}]*\\}", " ")
                .replaceAll("(?is)\\.[a-z0-9_-]+[^{}\\n]*\\{.*$", " ")
                .replaceAll("(?im)^\\s*(?:position|z-index|width|height|min-height|max-height|margin|padding|box-sizing|border|background|overflow|color|font|display|align-items|justify-content|gap|white-space|text-decoration|transform|content|left|right|top|bottom|flex|flex-direction)\\s*:[^\\n]*$", " ")
                .replaceAll("(?is)<(?:figure|picture)\\b[^>]*>.*?</(?:figure|picture)>", " ")
                .replaceAll("(?is)<(?:img|source)\\b[^>]*(?:>|$)", " ")
                .replaceAll("(?is)data:image/[^\\s\"'>]+", " ")
                .replaceAll("(?is)<li\\b[^>]*>\\s*(?:&nbsp;|&#160;|&#x0*a0;|<br\s*/?>|<p\b[^>]*>\s*(?:&nbsp;|&#160;|&#x0*a0;|<br\s*/?>)?\s*</p>|\s)*</li>", " ")
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</?(p|div|li|h[1-6]|tr|blockquote|pre)[^>]*>", "\n")
                .replaceAll("(?i)</?(td|th)[^>]*>", " ")
                .replaceAll("(?s)<[^>]+>", " ")
                // CLOB이 태그 중간에서 잘린 경우 남는 HTML 속성/이미지 조각 제거
                .replaceAll("(?is)<[a-z][^>]*$", " ")
                .replaceAll("(?is)(?:img|source|figure|picture)\b[^\n<>]*$", " ")
                .replaceAll("(?is)\b(?:src|srcset|style|alt|width|height)\s*=\s*[\"'][^\"']*$", " ")
                .replaceAll("(?i)&nbsp;|&#160;|&#x0*a0;", " ")
                .replace("\u00A0", " ")
                .replace("\u200B", "")
                .replace("\u200C", "")
                .replace("\u200D", "")
                .replace("\uFEFF", "")
                .replace("\uFFFD", "")
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replaceAll("[\t\f\u000B ]+", " ")
                .replaceAll(" *\n *", "\n")
                .replaceAll("\n{3,}", "\n\n")
                // 본문이 없는 노트에서 점만 한 줄 남는 현상 제거
                .replaceAll("(?m)^[.\u2026\s]+$", "")
                .replaceAll("(?m)^[\\s\u2022\u00B7\u25E6\u2043-]+$", "")
                // 목록 미리보기는 2줄만 사용하므로 빈 문단이 실제 내용을 밀어내지 않게 한다.
                // 실제 텍스트 줄바꿈은 유지하고, 연속된 빈 줄만 한 줄로 축소한다.
                .replaceAll("\n{2,}", "\n")
                .trim();

        if (text.isBlank()) return null;

        // CSS의 2줄 말줄임이 담당하므로 서버에서 임의의 '...'를 붙이지 않는다.
        return text.length() > 240 ? text.substring(0, 240).trim() : text;
    }

    private void attachEmptyFileList(List<noteDTO> noteList) {
        if (noteList == null) return;
        for (noteDTO note : noteList) {
            if (note != null && note.getFileList() == null) {
                note.setFileList(Collections.emptyList());
            }
        }
    }

    private void attachFiles(List<noteDTO> noteList) {
        if (noteList == null) return;
        for (noteDTO note : noteList) {
            List<noteFileDTO> files = inoteDAO.selectNoteFileList(note.getNoteId());
            note.setFileList(files);
            note.setAttachmentCount(files == null ? 0 : files.size());

            if (files == null || files.isEmpty()) continue;
            note.setFirstAttachmentName(files.get(0).getOriginFileName());
            for (noteFileDTO file : files) {
                if (file != null && file.isImageFile()) {
                    note.setPreviewImageFileId(file.getFileId());
                    break;
                }
            }
        }
    }

    private void normalizeNote(noteDTO note) {
        note.setScopeType(normalizeScope(note.getScopeType()));
        if ("PRIVATE".equals(note.getScopeType())) {
            note.setWsId(null);
            note.setProjId(null);
        } else if ("WS".equals(note.getScopeType())) {
            note.setProjId(null);
        } else if ("PROJ".equals(note.getScopeType())) {
            // NOTES의 프로젝트 범위는 CK_NOTES_SCOPE_IDS 제약조건상
            // PROJ_ID만 보관하고 WS_ID는 NULL이어야 한다.
            // 그룹 프로젝트 여부/소속 그룹은 PROJECTS.WS_ID를 단일 원본으로 조회한다.
            if (note.getProjId() == null) {
                throw new IllegalArgumentException("프로젝트 노트에는 프로젝트 ID가 필요합니다.");
            }
            projectRequestDTO project = projectDAO.selectProjectById(note.getProjId());
            if (project == null) {
                throw new IllegalArgumentException("프로젝트를 찾을 수 없습니다.");
            }
            note.setWsId(null);
        }
        sanitizeEditableNote(note);
    }

    private void sanitizeEditableNote(noteDTO note) {
        if (note == null) return;
        note.setNoteTitle(contentInputSecurityService.singleLine(note.getNoteTitle(), 200, false));
        String safeMemo = contentInputSecurityService.richHtml(note.getMemo());
        note.setMemo(safeMemo);
        note.setDoneContent(safeMemo);
    }

    private String normalizeScope(String scopeType) {
        if (scopeType == null || scopeType.isBlank()) return "PRIVATE";
        String value = scopeType.trim().toUpperCase();
        if ("PROJECT".equals(value)) return "PROJ";
        if ("WORKSPACE".equals(value)) return "WS";
        if (!"ALL".equals(value) && !"IMPORTANT".equals(value) && !"PRIVATE".equals(value) && !"FRIEND".equals(value) && !"WS".equals(value) && !"PROJ".equals(value) && !"TRASH".equals(value)) return "PRIVATE";
        return value;
    }

    private String buildPinScopeKey(noteDTO note) {
        return buildPinScopeKey(note.getScopeType(), note.getWsId(), note.getProjId(), note.getUserId());
    }

    private String buildPinScopeKey(String scopeType, Long wsId, Long projId, Long userId) {
        // 중요 표시는 탭/범위가 아니라 사용자와 노트 기준으로 하나만 유지한다.
        // ALL, 개인, 친구, 워크스페이스, 프로젝트 어디에서 보더라도 같은 상태가 보여야 한다.
        return "NOTE:" + userId;
    }
}
