package com.springboot.project.controller;

import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import com.springboot.project.dto.noteFolderDTO;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.dao.InoteFolderDAO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.InoteService;
import com.springboot.project.service.IcontentShareService;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Controller
@RequestMapping("/note")
public class noteController {

    private static final String NOTE_UPLOAD_PATH = "C:/MoyoLab.Studio/note/";

    @Autowired
    private InoteService inoteService;

    @Autowired
    private InoteFolderDAO noteFolderDAO;

    @Autowired
    private IcontentShareService contentShareService;

    @GetMapping("/list")
    public String noteList(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "keyword", required = false) String keyword,
            Model model,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        // 리스트는 완전 초기화: 개인/워크스페이스/프로젝트 탐색기를 붙이지 않고,
        // 권한이 있는 최근 노트만 noteList 하나로 렌더링한다.
        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if ("WS".equals(normalizedScope) && wsId == null) normalizedScope = "PRIVATE";
        if ("PROJ".equals(normalizedScope) && (wsId == null || projId == null)) normalizedScope = "PRIVATE";

        List<noteDTO> noteList = inoteService.getNoteList(normalizedScope, wsId, projId, loginUser.getUserId(), keyword);
        addScopeModel(model, normalizedScope, wsId, projId);
        model.addAttribute("noteList", noteList);
        model.addAttribute("keyword", keyword == null ? "" : keyword.trim());
        model.addAttribute("loginUserId", loginUser.getUserId());

        return "note/noteList";
    }

    @GetMapping("/dual")
    public String dualNote(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "leftNoteId", required = false) Long leftNoteId,
            @RequestParam(value = "rightNoteId", required = false) Long rightNoteId,
            Model model,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if (!isValidScopeContext(normalizedScope, wsId, projId)) return "redirect:/";

        List<noteDTO> noteList = inoteService.getNoteList(normalizedScope, wsId, projId, loginUser.getUserId(), null);
        noteDTO leftNote = leftNoteId == null ? null : inoteService.getNoteDetail(leftNoteId, loginUser.getUserId());
        noteDTO rightNote = rightNoteId == null ? null : inoteService.getNoteDetail(rightNoteId, loginUser.getUserId());

        if (leftNote != null && !normalizedScope.equalsIgnoreCase(leftNote.getScopeType())) leftNote = null;
        if (rightNote != null && !normalizedScope.equalsIgnoreCase(rightNote.getScopeType())) rightNote = null;

        addScopeModel(model, normalizedScope, wsId, projId);
        model.addAttribute("folderList", getFolderList(normalizedScope, wsId, projId, loginUser.getUserId()));
        addNoteNavigationModel(model, loginUser.getUserId());
        model.addAttribute("noteList", noteList);
        model.addAttribute("leftNote", leftNote);
        model.addAttribute("rightNote", rightNote);
        model.addAttribute("loginUserId", loginUser.getUserId());
        return "note/noteDual";
    }

    @GetMapping("/write")
    public String noteWriteForm(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            Model model,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if (!isValidScopeContext(normalizedScope, wsId, projId)) {
            return "redirect:/";
        }

        addScopeModel(model, normalizedScope, wsId, projId);
        model.addAttribute(
                "folderList",
                getFolderList(
                        normalizedScope,
                        wsId,
                        projId,
                        loginUser.getUserId()
                )
        );
        model.addAttribute("selectedFolderId", folderId);
        addNoteNavigationModel(model, loginUser.getUserId());
        return "note/noteWrite";
    }

    @GetMapping("/detail")
    public String noteDetail(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (note == null) {
            return "redirect:/note/list?" + buildScopeQuery(normalizedScope, wsId, projId);
        }

        normalizedScope = note.getScopeType() == null ? normalizedScope : note.getScopeType();
        wsId = note.getWsId();
        projId = note.getProjId();

        boolean canEdit = note.isCanEdit();
        boolean canManageShare = note.getUserId() != null && note.getUserId().equals(loginUser.getUserId());
        boolean canDelete = inoteService.canDeleteNote(noteId, loginUser.getUserId());

        addScopeModel(model, normalizedScope, wsId, projId);
        model.addAttribute("folderList", getFolderList(normalizedScope, wsId, projId, loginUser.getUserId()));
        addNoteNavigationModel(model, loginUser.getUserId());
        model.addAttribute("note", note);
        model.addAttribute("replyList", inoteService.getNoteReplyList(noteId));
        model.addAttribute("canEdit", canEdit);
        model.addAttribute("canManageShare", canManageShare);
        model.addAttribute("canDelete", canDelete);
        model.addAttribute("loginUserId", loginUser.getUserId());
        model.addAttribute("noteShareList", canManageShare ? contentShareService.getShares("NOTE", noteId, loginUser.getUserId()) : java.util.Collections.emptyList());

        return "note/noteDetail";
    }

    @GetMapping("/edit")
    public String noteEditForm(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            Model model,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (note == null) {
            return "redirect:/note/list?" + buildScopeQuery(normalizedScope, wsId, projId);
        }
        if (!note.isCanEdit()) {
            return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(note.getScopeType(), note.getWsId(), note.getProjId()) + "&authError=edit";
        }

        boolean canManageShare = note.getUserId() != null && note.getUserId().equals(loginUser.getUserId());

        addScopeModel(model, note.getScopeType(), note.getWsId(), note.getProjId());
        model.addAttribute("folderList", getFolderList(note.getScopeType(), note.getWsId(), note.getProjId(), loginUser.getUserId()));
        addNoteNavigationModel(model, loginUser.getUserId());
        model.addAttribute("note", note);
        model.addAttribute("canManageShare", canManageShare);
        model.addAttribute("loginUserId", loginUser.getUserId());
        model.addAttribute("noteShareList", canManageShare ? contentShareService.getShares("NOTE", noteId, loginUser.getUserId()) : java.util.Collections.emptyList());
        return "note/noteEdit";
    }


    @GetMapping("/api/folders")
    @ResponseBody
    public Map<String, Object> getNoteFolders(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session) {

        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if (!isValidScopeContext(normalizedScope, wsId, projId)) {
            response.put("success", false);
            response.put("message", "노트 위치를 먼저 선택해 주세요.");
            return response;
        }

        response.put("success", true);
        response.put("folders", getFolderList(normalizedScope, wsId, projId, loginUser.getUserId()));
        return response;
    }

    @PostMapping("/add")
    public String addNote(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("noteTitle") String noteTitle,
            @RequestParam(value = "memo", required = false) String memo,
            @RequestParam(value = "category", defaultValue = "GENERAL") String category,
            @RequestParam(value = "icon", defaultValue = "📝") String icon,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "redirectTo", required = false) String redirectTo,
            @RequestParam(value = "shareTargetType", required = false) List<String> shareTargetTypes,
            @RequestParam(value = "shareTargetId", required = false) List<Long> shareTargetIds,
            @RequestParam(value = "sharePermissionType", required = false) List<String> sharePermissionTypes,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if (!isValidScopeContext(normalizedScope, wsId, projId)) {
            return "redirect:/";
        }

        noteDTO note = new noteDTO();
        note.setScopeType(normalizedScope);
        note.setWsId(wsId);
        note.setProjId(projId);
        note.setUserId(loginUser.getUserId());
        note.setNoteTitle(noteTitle);
        note.setMemo(memo);
        note.setCategory(category);
        note.setIcon(icon);
        note.setFolderId(folderId);
        note.setDoneContent(memo); // 기존 컬럼 호환용. 화면에서는 memo만 사용합니다.
        note.setNextContent(null);
        note.setIssueContent(null);
        note.setChangeLog(null);

        inoteService.registerNoteWithFiles(note, saveNoteFiles(files));
        saveInitialShares(note.getNoteId(), loginUser.getUserId(), shareTargetTypes, shareTargetIds, sharePermissionTypes);

        return "redirect:/note/detail?noteId=" + note.getNoteId() + "&" + buildScopeQuery(normalizedScope, wsId, projId);
    }

    @PostMapping("/modify")
    public String modifyNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("noteTitle") String noteTitle,
            @RequestParam(value = "memo", required = false) String memo,
            @RequestParam(value = "category", defaultValue = "GENERAL") String category,
            @RequestParam(value = "icon", defaultValue = "📝") String icon,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        noteDTO savedNote = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (savedNote == null) {
            return "redirect:/note/list?" + buildScopeQuery(normalizedScope, wsId, projId);
        }
        if (!savedNote.isCanEdit()) {
            return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(savedNote.getScopeType(), savedNote.getWsId(), savedNote.getProjId()) + "&authError=edit";
        }

        noteDTO note = new noteDTO();
        note.setNoteId(noteId);
        note.setScopeType(savedNote.getScopeType());
        note.setWsId(savedNote.getWsId());
        note.setProjId(savedNote.getProjId());
        note.setNoteTitle(noteTitle);
        note.setMemo(memo);
        note.setCategory(category);
        note.setIcon(icon);
        note.setFolderId(folderId);
        note.setDoneContent(memo); // 기존 컬럼 호환용
        inoteService.modifyNote(note);

        List<noteFileDTO> fileList = saveNoteFiles(files);
        if (fileList != null && !fileList.isEmpty()) {
            for (noteFileDTO file : fileList) {
                file.setNoteId(noteId);
                inoteService.registerNoteFile(file);
            }
        }

        return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(savedNote.getScopeType(), savedNote.getWsId(), savedNote.getProjId());
    }


    @PostMapping("/image-upload")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> uploadNoteEditorImage(
            @RequestParam("upload") MultipartFile uploadFile,
            HttpSession session) {

        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "로그인이 필요합니다."));
            return ResponseEntity.status(401).body(response);
        }
        if (uploadFile == null || uploadFile.isEmpty()) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "업로드할 이미지가 없습니다."));
            return ResponseEntity.badRequest().body(response);
        }
        if (uploadFile.getSize() > 5L * 1024L * 1024L) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "본문 이미지는 5MB 이하만 업로드할 수 있습니다."));
            return ResponseEntity.badRequest().body(response);
        }

        String originalFileName = uploadFile.getOriginalFilename();
        String extension = getSafeNoteImageExtension(originalFileName);
        String contentType = uploadFile.getContentType();
        if (extension == null || contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "jpg, jpeg, png, gif, webp 이미지만 업로드할 수 있습니다."));
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String uploadPath = "C:/MoyoLab.Studio/upload/note-editor/";
            File folder = new File(uploadPath);
            if (!folder.exists() && !folder.mkdirs()) {
                throw new IOException("업로드 폴더를 생성할 수 없습니다.");
            }
            String savedFileName = UUID.randomUUID().toString().replace("-", "") + extension;
            uploadFile.transferTo(new File(folder, savedFileName));
            response.put("uploaded", true);
            response.put("url", "/upload/note-editor/" + savedFileName);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("uploaded", false);
            response.put("error", Map.of("message", "이미지 저장 중 오류가 발생했습니다."));
            return ResponseEntity.status(500).body(response);
        }
    }

    private String getSafeNoteImageExtension(String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) return null;
        String extension = originalFileName.substring(originalFileName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        return Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp").contains(extension) ? extension : null;
    }

    @PostMapping("/autosave")
    @ResponseBody
    public Map<String, Object> autosaveNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam("noteTitle") String noteTitle,
            @RequestParam(value = "memo", required = false) String memo,
            @RequestParam(value = "category", defaultValue = "GENERAL") String category,
            @RequestParam(value = "icon", defaultValue = "📝") String icon,
            @RequestParam(value = "folderId", required = false) Long folderId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        noteDTO savedNote = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (savedNote == null || !savedNote.isCanEdit()) {
            response.put("success", false);
            response.put("message", "편집 권한이 없습니다.");
            return response;
        }
        noteDTO note = new noteDTO();
        note.setNoteId(noteId);
        note.setNoteTitle(noteTitle == null || noteTitle.isBlank() ? "제목 없음" : noteTitle.trim());
        note.setMemo(memo);
        note.setDoneContent(memo);
        note.setCategory(category);
        note.setIcon(icon);
        note.setFolderId(folderId != null ? folderId : savedNote.getFolderId());
        response.put("success", inoteService.modifyNote(note));
        return response;
    }

    @PostMapping("/delete")
    public String deleteNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (note == null) {
            return "redirect:/note/list?" + buildScopeQuery(normalizedScope, wsId, projId);
        }
        if (!inoteService.canDeleteNote(noteId, loginUser.getUserId())) {
            return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(note.getScopeType(), note.getWsId(), note.getProjId()) + "&authError=delete";
        }

        if (note.getFileList() != null) {
            for (noteFileDTO file : note.getFileList()) deletePhysicalFile(file.getFilePath());
        }
        inoteService.removeNote(noteId);
        return "redirect:/note/list?" + buildScopeQuery(note.getScopeType(), note.getWsId(), note.getProjId());
    }

    @PostMapping("/file/delete")
    @ResponseBody
    public Map<String, Object> deleteNoteFile(
            @RequestParam("fileId") Long fileId,
            @RequestParam("noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (note == null || note.getUserId() == null || !note.getUserId().equals(loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "작성자만 첨부파일을 삭제할 수 있습니다.");
            return response;
        }
        noteFileDTO file = inoteService.getNoteFile(fileId);
        if (file != null && noteId.equals(file.getNoteId())) {
            deletePhysicalFile(file.getFilePath());
            response.put("success", inoteService.removeNoteFile(fileId));
        } else {
            response.put("success", false);
            response.put("message", "첨부파일을 찾을 수 없습니다.");
        }
        return response;
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadNoteFile(@RequestParam("fileId") Long fileId, HttpSession session) throws Exception {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(401).build();
        noteFileDTO file = inoteService.getNoteFile(fileId);
        if (file == null || file.getFilePath() == null) return ResponseEntity.notFound().build();
        Path filePath = Path.of(file.getFilePath());
        if (!Files.exists(filePath)) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(filePath.toUri());
        String encodedFileName = URLEncoder.encode(file.getOriginFileName(), StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(encodedFileName, StandardCharsets.UTF_8).build().toString())
                .body(resource);
    }

    @GetMapping("/view")
    public ResponseEntity<Resource> viewNoteFile(@RequestParam("fileId") Long fileId, HttpSession session) throws Exception {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(401).build();
        noteFileDTO file = inoteService.getNoteFile(fileId);
        if (file == null || file.getFilePath() == null) return ResponseEntity.notFound().build();
        Path filePath = Path.of(file.getFilePath());
        if (!Files.exists(filePath)) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType)).header(HttpHeaders.CONTENT_DISPOSITION, "inline").body(resource);
    }

    @GetMapping("/api/main")
    @ResponseBody
    public List<noteDTO> mainNoteApi(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "limit", defaultValue = "3") int limit,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return new ArrayList<>();
        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        return inoteService.getMainNoteList(normalizedScope, wsId, projId, loginUser.getUserId(), limit);
    }

    @GetMapping("/api/list")
    @ResponseBody
    public List<noteDTO> noteListApi(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "keyword", required = false) String keyword,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return new ArrayList<>();
        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        return inoteService.getNoteList(normalizedScope, wsId, projId, loginUser.getUserId(), keyword);
    }

    @PostMapping("/reply/add")
    public String addNoteReply(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("replyContent") String replyContent,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";
        if (replyContent != null && !replyContent.trim().isEmpty()) {
            noteReplyDTO reply = new noteReplyDTO();
            reply.setNoteId(noteId);
            reply.setUserId(loginUser.getUserId());
            reply.setReplyContent(replyContent.trim());
            inoteService.registerNoteReply(reply);
        }
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        String normalizedScope = note != null ? note.getScopeType() : normalizeScope(scope, scopeType, wsId, projId);
        Long noteWsId = note != null ? note.getWsId() : wsId;
        Long noteProjId = note != null ? note.getProjId() : projId;
        return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(normalizedScope, noteWsId, noteProjId);
    }

    @PostMapping("/reply/update")
    public String updateNoteReply(
            @RequestParam("replyId") Long replyId,
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam("replyContent") String replyContent,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        if (replyContent != null && !replyContent.trim().isEmpty()) {
            noteReplyDTO reply = new noteReplyDTO();
            reply.setReplyId(replyId);
            reply.setNoteId(noteId);
            reply.setUserId(loginUser.getUserId());
            reply.setReplyContent(replyContent.trim());
            inoteService.modifyNoteReply(reply);
        }

        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        String normalizedScope = note != null ? note.getScopeType() : normalizeScope(scope, scopeType, wsId, projId);
        Long noteWsId = note != null ? note.getWsId() : wsId;
        Long noteProjId = note != null ? note.getProjId() : projId;
        return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(normalizedScope, noteWsId, noteProjId);
    }

    @PostMapping("/reply/delete")
    public String deleteNoteReply(
            @RequestParam("replyId") Long replyId,
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";
        inoteService.removeNoteReply(replyId, loginUser.getUserId());
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        String normalizedScope = note != null ? note.getScopeType() : normalizeScope(scope, scopeType, wsId, projId);
        Long noteWsId = note != null ? note.getWsId() : wsId;
        Long noteProjId = note != null ? note.getProjId() : projId;
        return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(normalizedScope, noteWsId, noteProjId);
    }

    @PostMapping("/api/pin")
    @ResponseBody
    public Map<String, Object> pinNote(
            @RequestParam("noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        try {
            inoteService.pinNote(loginUser.getUserId(), noteId);
            response.put("success", true);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    @PostMapping("/api/unpin")
    @ResponseBody
    public Map<String, Object> unpinNote(
            @RequestParam("noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        response.put("success", inoteService.unpinNote(loginUser.getUserId(), noteId));
        return response;
    }

    @PostMapping("/api/note/rename")
    @ResponseBody
    public Map<String, Object> renameNoteFromExplorer(
            @RequestParam(name = "noteId") Long noteId,
            @RequestParam(name = "noteTitle") String noteTitle,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        String title = noteTitle == null ? "" : noteTitle.trim();
        if (loginUser == null || title.isEmpty()) {
            response.put("success", false);
            response.put("message", loginUser == null ? "로그인이 필요합니다." : "노트명을 입력하세요.");
            return response;
        }
        noteDTO saved = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (saved == null || !inoteService.canDeleteNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "작성자 또는 해당 공간의 관리자만 노트명을 수정할 수 있습니다.");
            return response;
        }
        noteDTO update = new noteDTO();
        update.setNoteId(saved.getNoteId());
        update.setScopeType(saved.getScopeType());
        update.setWsId(saved.getWsId());
        update.setProjId(saved.getProjId());
        update.setNoteTitle(title);
        update.setMemo(saved.getMemo());
        update.setDoneContent(saved.getDoneContent());
        update.setCategory(saved.getCategory());
        update.setIcon(saved.getIcon());
        update.setFolderId(saved.getFolderId());
        response.put("success", inoteService.modifyNote(update));
        return response;
    }

    @PostMapping("/api/note/delete")
    @ResponseBody
    public Map<String, Object> deleteNoteFromExplorer(
            @RequestParam(name = "noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (note == null || !inoteService.canDeleteNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "작성자 또는 해당 공간의 관리자만 노트를 삭제할 수 있습니다.");
            return response;
        }
        if (note.getFileList() != null) {
            for (noteFileDTO file : note.getFileList()) deletePhysicalFile(file.getFilePath());
        }
        response.put("success", inoteService.removeNote(noteId));
        return response;
    }

    @PostMapping("/api/folder/create")
    @ResponseBody
    public Map<String,Object> createFolder(
            @RequestParam(name = "scope") String scope,
            @RequestParam(name = "wsId", required = false) Long wsId,
            @RequestParam(name = "projId", required = false) Long projId,
            @RequestParam(name = "parentFolderId", required = false) Long parentFolderId,
            @RequestParam(name = "folderName") String folderName,
            HttpSession session) {
        Map<String,Object> r=new HashMap<>(); usersDto u=getLoginUser(session);
        if(u==null){r.put("success",false);r.put("message","로그인이 필요합니다.");return r;}
        String name=folderName==null?"":folderName.trim();
        if(name.isEmpty()||name.length()>100){r.put("success",false);r.put("message","폴더 이름은 1~100자로 입력하세요.");return r;}
        String folderScope=normalizeScope(scope,null,wsId,projId);
        if("ALL".equals(folderScope)){r.put("success",false);r.put("message","전체 영역에는 폴더를 만들 수 없습니다. 개인·워크스페이스·프로젝트를 먼저 선택하세요.");return r;}
        noteFolderDTO folder=new noteFolderDTO(); folder.setScopeType(folderScope);
        folder.setWsId(wsId);folder.setProjId(projId);folder.setParentFolderId(parentFolderId);folder.setOwnerUserId(u.getUserId());folder.setFolderName(name);folder.setSortOrder(0);
        r.put("success",noteFolderDAO.insertFolder(folder)>0);r.put("folderId",folder.getFolderId());return r;
    }

    @PostMapping("/api/folder/rename")
    @ResponseBody
    public Map<String,Object> renameFolder(
            @RequestParam(name = "folderId") Long folderId,
            @RequestParam(name = "folderName") String folderName,
            HttpSession session) {
        Map<String,Object> r=new HashMap<>();usersDto u=getLoginUser(session);String name=folderName==null?"":folderName.trim();
        r.put("success",u!=null&&!name.isEmpty()&&noteFolderDAO.updateFolderName(folderId,name,u.getUserId())>0);return r;
    }

    @PostMapping("/api/folder/delete")
    @ResponseBody
    public Map<String,Object> deleteFolder(
            @RequestParam(name = "folderId") Long folderId,
            HttpSession session) {
        Map<String,Object> r=new HashMap<>();usersDto u=getLoginUser(session);
        if(u==null){r.put("success",false);return r;}
        if(noteFolderDAO.countChildFolders(folderId)>0||noteFolderDAO.countFolderNotes(folderId)>0){r.put("success",false);r.put("message","하위 폴더나 노트가 있어 삭제할 수 없습니다.");return r;}
        r.put("success",noteFolderDAO.deleteFolder(folderId,u.getUserId())>0);return r;
    }

    @PostMapping("/api/folder/move-note")
    @ResponseBody
    public Map<String,Object> moveNoteFolder(
            @RequestParam(name = "noteId") Long noteId,
            @RequestParam(name = "folderId", required = false) Long folderId,
            HttpSession session) {
        Map<String,Object> r=new HashMap<>();usersDto u=getLoginUser(session);
        r.put("success",u!=null&&noteFolderDAO.moveNote(noteId,folderId,u.getUserId())>0);return r;
    }


    private void saveInitialShares(Long noteId,
                                   Long loginUserId,
                                   List<String> targetTypes,
                                   List<Long> targetIds,
                                   List<String> permissionTypes) {
        if (noteId == null || loginUserId == null || targetTypes == null || targetIds == null) return;
        int size = Math.min(targetTypes.size(), targetIds.size());
        for (int i = 0; i < size; i++) {
            String targetType = targetTypes.get(i);
            Long targetId = targetIds.get(i);
            if (targetType == null || targetType.isBlank() || targetId == null) continue;
            String permission = "VIEW";
            if (permissionTypes != null && i < permissionTypes.size() && permissionTypes.get(i) != null && !permissionTypes.get(i).isBlank()) {
                permission = permissionTypes.get(i);
            }
            try {
                contentShareDTO share = new contentShareDTO();
                share.setContentType("NOTE");
                share.setContentId(noteId);
                share.setTargetType(targetType);
                share.setTargetId(targetId);
                share.setPermissionType(permission);
                contentShareService.saveShare(share, loginUserId);
            } catch (RuntimeException ignored) {
                // 한 대상 공유가 실패해도 노트 작성 자체는 유지합니다.
                // 상세 화면의 공유 관리에서 다시 설정할 수 있습니다.
            }
        }
    }

    private List<noteFolderDTO> getFolderList(String scopeType,Long wsId,Long projId,Long userId){
        if ("ALL".equals(scopeType)) return new ArrayList<>();
        Map<String,Object> p=new HashMap<>();p.put("scopeType",scopeType);p.put("wsId",wsId);p.put("projId",projId);p.put("userId",userId);
        return noteFolderDAO.selectFolderList(p);
    }


    private void addNoteNavigationModel(Model model, Long userId) {
        // 공유 모달은 작성/상세/수정/리스트/사진첩/일정에서 공통으로 쓰는 데이터만 받는다.
        // MyBatis resultType=map 은 환경에 따라 key 가 wsId / WSID / WS_ID 처럼 달라질 수 있어서
        // JSP 에 넘기기 전에 camelCase 로 한번 고정한다.
        List<Map<String, Object>> workspaceList = normalizeWorkspaceRows(noteFolderDAO.selectAccessibleWorkspaces(userId));
        List<Map<String, Object>> projectList = normalizeProjectRows(noteFolderDAO.selectAccessibleProjects(userId));
        List<Map<String, Object>> workspaceMemberList = normalizeWorkspaceMemberRows(noteFolderDAO.selectShareWorkspaceMembers(userId));
        List<Map<String, Object>> projectMemberList = normalizeProjectMemberRows(noteFolderDAO.selectShareProjectMembers(userId));

        model.addAttribute("noteWorkspaceList", workspaceList);
        model.addAttribute("noteProjectList", projectList);
        model.addAttribute("noteWorkspaceMemberList", workspaceMemberList);
        model.addAttribute("noteProjectMemberList", projectMemberList);
        model.addAttribute("noteNavigationList", new ArrayList<noteDTO>());
        model.addAttribute("notePrivateFolderList", new ArrayList<noteFolderDTO>());
        model.addAttribute("noteWorkspaceFolderMap", new HashMap<Object, List<noteFolderDTO>>());
        model.addAttribute("noteProjectFolderMap", new HashMap<Object, List<noteFolderDTO>>());
    }

    private List<Map<String, Object>> normalizeWorkspaceRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("wsImagePath", firstMapValue(row, "wsImagePath", "WS_IMAGE_PATH", "WSIMAGEPATH"));
            item.put("canManage", firstMapValue(row, "canManage", "CAN_MANAGE", "CANMANAGE"));
            if (item.get("wsId") != null) result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> normalizeProjectRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("projId", firstMapValue(row, "projId", "PROJ_ID", "PROJID"));
            item.put("projName", firstMapValue(row, "projName", "PROJ_NAME", "PROJNAME"));
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("canManage", firstMapValue(row, "canManage", "CAN_MANAGE", "CANMANAGE"));
            if (item.get("projId") != null) result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> normalizeWorkspaceMemberRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("userId", firstMapValue(row, "userId", "USER_ID", "USERID"));
            item.put("userName", firstMapValue(row, "userName", "USER_NAME", "USERNAME"));
            item.put("email", firstMapValue(row, "email", "EMAIL"));
            item.put("profileImagePath", firstMapValue(row, "profileImagePath", "PROFILE_IMAGE_PATH", "PROFILEIMAGEPATH"));
            item.put("roleName", firstMapValue(row, "roleName", "ROLE_NAME", "ROLENAME", "WS_ROLE"));
            if (item.get("wsId") != null && item.get("userId") != null) result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> normalizeProjectMemberRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (rows == null) return result;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("projId", firstMapValue(row, "projId", "PROJ_ID", "PROJID"));
            item.put("projName", firstMapValue(row, "projName", "PROJ_NAME", "PROJNAME"));
            item.put("wsId", firstMapValue(row, "wsId", "WS_ID", "WSID"));
            item.put("wsName", firstMapValue(row, "wsName", "WS_NAME", "WSNAME"));
            item.put("userId", firstMapValue(row, "userId", "USER_ID", "USERID"));
            item.put("userName", firstMapValue(row, "userName", "USER_NAME", "USERNAME"));
            item.put("email", firstMapValue(row, "email", "EMAIL"));
            item.put("profileImagePath", firstMapValue(row, "profileImagePath", "PROFILE_IMAGE_PATH", "PROFILEIMAGEPATH"));
            item.put("roleName", firstMapValue(row, "roleName", "ROLE_NAME", "ROLENAME", "PROJ_ROLE"));
            if (item.get("projId") != null && item.get("userId") != null) result.add(item);
        }
        return result;
    }

    private Object firstMapValue(Map<String, Object> row, String... keys) {
        if (row == null) return null;
        for (String key : keys) {
            if (row.containsKey(key) && row.get(key) != null) return row.get(key);
        }
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (entry.getKey() == null || entry.getValue() == null) continue;
            String normalized = entry.getKey().replace("_", "").toLowerCase(Locale.ROOT);
            for (String key : keys) {
                if (normalized.equals(key.replace("_", "").toLowerCase(Locale.ROOT))) return entry.getValue();
            }
        }
        return null;
    }

    private void addNavigationNotes(
            Map<Long, noteDTO> target,
            List<noteDTO> notes) {

        if (notes == null) return;

        for (noteDTO note : notes) {
            if (note == null || note.getNoteId() == null) continue;
            target.put(note.getNoteId(), note);
        }
    }

    private Long toLong(Object value) {
        if (value == null) return null;

        if (value instanceof Number) {
            return ((Number) value).longValue();
        }

        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private usersDto getLoginUser(HttpSession session) {
        return (usersDto) session.getAttribute("user");
    }

    private void addScopeModel(Model model, String scopeType, Long wsId, Long projId) {
        model.addAttribute("scope", scopeType);
        model.addAttribute("scopeType", scopeType);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("scopeQuery", buildScopeQuery(scopeType, wsId, projId));
        model.addAttribute("scopeLabel", getScopeLabel(scopeType));
    }

    private String normalizeScope(String scope, String scopeType, Long wsId, Long projId) {
        String value = scopeType != null && !scopeType.isBlank() ? scopeType : scope;
        if (value == null || value.isBlank()) {
            if (projId != null) return "PROJ";
            if (wsId != null) return "WS";
            return "PRIVATE";
        }
        value = value.trim().toUpperCase();
        if ("PROJECT".equals(value)) return "PROJ";
        if ("WORKSPACE".equals(value)) return "WS";
        if (!"ALL".equals(value) && !"PRIVATE".equals(value) && !"WS".equals(value) && !"PROJ".equals(value)) return "PRIVATE";
        return value;
    }

    private boolean isValidScopeContext(String scopeType, Long wsId, Long projId) {
        if ("ALL".equals(scopeType)) return true;
        if ("PRIVATE".equals(scopeType)) return true;
        if ("WS".equals(scopeType)) return wsId != null;
        if ("PROJ".equals(scopeType)) return wsId != null && projId != null;
        return false;
    }

    private String buildScopeQuery(String scopeType, Long wsId, Long projId) {
        StringBuilder query = new StringBuilder("scope=").append(scopeType == null ? "PRIVATE" : scopeType);
        if (wsId != null) query.append("&wsId=").append(wsId);
        if (projId != null) query.append("&projId=").append(projId);
        return query.toString();
    }

    private String getScopeLabel(String scopeType) {
        if ("ALL".equals(scopeType)) return "전체 노트";
        if ("PROJ".equals(scopeType)) return "프로젝트 공유 노트";
        if ("WS".equals(scopeType)) return "워크스페이스 공유 노트";
        return "개인 노트";
    }

    private List<noteFileDTO> saveNoteFiles(List<MultipartFile> files) {
        List<noteFileDTO> fileList = new ArrayList<>();
        if (files == null || files.isEmpty()) return fileList;
        File folder = new File(NOTE_UPLOAD_PATH);
        if (!folder.exists()) folder.mkdirs();
        for (MultipartFile multipartFile : files) {
            if (multipartFile == null || multipartFile.isEmpty()) continue;
            try {
                String originFileName = multipartFile.getOriginalFilename();
                String ext = "";
                if (originFileName != null && originFileName.lastIndexOf('.') > -1) {
                    ext = originFileName.substring(originFileName.lastIndexOf('.') + 1).toLowerCase();
                }
                String storedFileName = UUID.randomUUID().toString().replace("-", "") + (ext.isEmpty() ? "" : "." + ext);
                File saveFile = new File(folder, storedFileName);
                multipartFile.transferTo(saveFile);
                noteFileDTO file = new noteFileDTO();
                file.setOriginFileName(originFileName);
                file.setStoredFileName(storedFileName);
                file.setFilePath(saveFile.getAbsolutePath());
                file.setFileSize(multipartFile.getSize());
                file.setFileExt(ext);
                fileList.add(file);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return fileList;
    }

    private void deletePhysicalFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            File file = new File(filePath);
            if (file.exists()) file.delete();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
