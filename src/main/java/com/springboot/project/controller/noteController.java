package com.springboot.project.controller;

import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import com.springboot.project.dto.noteFolderDTO;
import com.springboot.project.dto.projectRequestDTO;
import com.springboot.project.dto.contentShareDTO;
import com.springboot.project.dao.InoteFolderDAO;
import com.springboot.project.dao.IcontentRecordItemDAO;
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.dao.IprojectDAO;
import com.springboot.project.dao.IfriendDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.friendDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.InoteService;
import com.springboot.project.service.IcontentShareService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.service.UserService;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.HtmlUtils;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Controller
@RequestMapping("/note")
public class noteController {

    @Value("${moyo.schema.runtime-ddl-enabled:false}")
    private boolean runtimeDdlEnabled;

    @Value("${moyo.upload.note-dir:C:/uploads/notes/}")
    private String noteUploadPath;

    @Value("${moyo.upload.note-editor-dir:C:/uploads/note-editor/}")
    private String noteEditorUploadPath;

    private Path noteUploadRoot() {
        return Path.of(noteUploadPath).toAbsolutePath().normalize();
    }

    @Autowired
    private InoteService inoteService;

    @Autowired
    private InoteFolderDAO noteFolderDAO;

    @Autowired
    private IcontentRecordItemDAO contentRecordItemDAO;

    @Autowired
    private IcontentShareService contentShareService;

    @Autowired
    private IworkspaceDAO workspaceDAO;

    @Autowired
    private IprojectDAO projectDAO;

    @Autowired
    private IprojectAuthorizationService projectAuthorizationService;

    @Autowired
    private UserService userService;

    @Autowired
    private IfriendDAO friendDAO;

    @Autowired
    private IuserNoticeDAO userNoticeDAO;

    @GetMapping("/list")
    public String noteList(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "friendUserId", required = false) Long friendUserId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "importantOnly", required = false, defaultValue = "false") boolean importantOnly,
            Model model,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if (!isValidScopeContext(normalizedScope, wsId, projId)) return "redirect:/";

        List<Map<String, Object>> workspaceList = normalizeWorkspaceRows(noteFolderDAO.selectAccessibleWorkspaces(loginUser.getUserId()));
        List<Map<String, Object>> projectList = normalizeProjectRows(noteFolderDAO.selectAccessibleProjects(loginUser.getUserId()));
        Map<String, Object> workspace = findRow(workspaceList, "wsId", wsId);
        Map<String, Object> projectDetail = findRow(projectList, "projId", projId);
        List<Map<String, Object>> personalProjects = new ArrayList<>();
        List<Map<String, Object>> groupProjects = new ArrayList<>();
        for (Map<String, Object> project : projectList) {
            Long projectWsId = toLong(project.get("wsId"));
            if (projectWsId == null) personalProjects.add(project);
            if (wsId != null && wsId.equals(projectWsId)) groupProjects.add(project);
        }

        String explorerScopeType = "PERSONAL";
        Long scopeId = loginUser.getUserId();
        if ("WS".equals(normalizedScope)) {
            explorerScopeType = "GROUP";
            scopeId = wsId;
        } else if ("PROJ".equals(normalizedScope)) {
            explorerScopeType = "PROJECT";
            scopeId = projId;
        }

        model.addAttribute("contentType", "NOTE");
        model.addAttribute("scopeType", explorerScopeType);
        model.addAttribute("scopeId", scopeId);
        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("workspace", workspace);
        model.addAttribute("projectDetail", projectDetail);
        model.addAttribute("personalRoot", "PRIVATE".equals(normalizedScope));
        model.addAttribute("personalProjects", personalProjects);
        model.addAttribute("groupProjects", groupProjects);
        model.addAttribute("pageTitle", switch (normalizedScope) {
            case "WS" -> "그룹 노트";
            case "PROJ" -> "프로젝트 노트";
            default -> "내 노트";
        });
        model.addAttribute("currentUserId", loginUser.getUserId());
        model.addAttribute("selectedFolderId", folderId);
        return "common/contentExplorer";
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
        if (!canAccessNoteScope(normalizedScope, wsId, projId, loginUser.getUserId())) {
            return "redirect:/?authError=note-scope";
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
        if (!canAccessNoteScope(normalizedScope, wsId, projId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "이 위치의 폴더를 볼 권한이 없습니다.");
            return response;
        }

        response.put("success", true);
        response.put("folders", getFolderList(normalizedScope, wsId, projId, loginUser.getUserId()));
        return response;
    }

    @GetMapping("/api/detail")
    @ResponseBody
    public ResponseEntity<?> getNoteModalDetail(
            @RequestParam("noteId") Long noteId,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (note == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "노트를 찾을 수 없거나 열람 권한이 없습니다."));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("noteId", note.getNoteId());
        response.put("noteTitle", note.getNoteTitle() == null ? "" : note.getNoteTitle());
        response.put("memo", note.getMemo() == null ? "" : note.getMemo());
        String detailScopeType = note.getScopeType() == null ? "PRIVATE" : note.getScopeType();
        Long effectiveWsId = note.getWsId();
        boolean groupContent = "WS".equalsIgnoreCase(detailScopeType) && effectiveWsId != null;
        if (("PROJ".equalsIgnoreCase(detailScopeType) || "PROJECT".equalsIgnoreCase(detailScopeType))
                && note.getProjId() != null) {
            // 과거 데이터에 NOTES.WS_ID가 비어 있어도 프로젝트의 실제 소속 그룹을 기준으로 판단한다.
            // 비밀글 가능 여부의 단일 원본은 PROJECTS.WS_ID다.
            projectRequestDTO project = projectDAO.selectProjectById(note.getProjId());
            if (project != null) {
                effectiveWsId = project.getWsId();
                groupContent = effectiveWsId != null;
            }
        }
        response.put("scopeType", detailScopeType);
        response.put("wsId", effectiveWsId);
        response.put("projId", note.getProjId());
        response.put("groupContent", groupContent);
        response.put("folderId", note.getFolderId());
        response.put("folderName", note.getFolderName() == null || note.getFolderName().isBlank() ? "라이브러리" : note.getFolderName());
        response.put("userId", note.getUserId());
        response.put("userName", note.getUserName() == null || note.getUserName().isBlank() ? "작성자" : note.getUserName());
        response.put("profileImagePath", note.getProfileImagePath());
        response.put("regDt", note.getRegDt());
        response.put("updDt", note.getUpdDt());
        response.put("moyoPublicYn", note.getMoyoPublicYn() == null ? "N" : note.getMoyoPublicYn());
        response.put("canEdit", note.isCanEdit());
        response.put("canManageShare", note.getUserId() != null && note.getUserId().equals(loginUser.getUserId()));
        response.put("canDelete", inoteService.canDeleteNote(noteId, loginUser.getUserId()));
        response.put("ownedByMe", note.isOwnedByMe());
        response.put("viewCount", note.getViewCount() == null ? 0 : note.getViewCount());
        response.put("likeCount", note.getLikeCount() == null ? 0 : note.getLikeCount());
        response.put("likedByMe", note.isLikedByMe());
        response.put("feedbackCount", note.getFeedbackCount());
        response.put("imageCount", note.getImageCount());
        response.put("tableCount", note.getTableCount());
        response.put("linkCount", note.getLinkCount());
        response.put("videoCount", note.getVideoCount());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/quick-create")
    @ResponseBody
    public ResponseEntity<?> quickCreateNote(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "noteTitle", required = false) String noteTitle,
            @RequestParam(value = "memo", required = false) String memo,
            HttpSession session) {

        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if (!isValidScopeContext(normalizedScope, wsId, projId)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "노트 위치를 확인해 주세요."));
        }
        if (!canAccessNoteScope(normalizedScope, wsId, projId, loginUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "이 위치에 노트를 작성할 권한이 없습니다."));
        }

        String safeMemo = memo == null ? "" : memo.trim();
        if (safeMemo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "작성된 내용이 없습니다."));
        }

        if (folderId != null) {
            boolean folderMatchesScope = getFolderList(normalizedScope, wsId, projId, loginUser.getUserId()).stream()
                    .anyMatch(folder -> folderId.equals(folder.getFolderId()));
            if (!folderMatchesScope) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "저장할 라이브러리를 확인해 주세요."));
            }
        }

        noteDTO note = new noteDTO();
        note.setScopeType(normalizedScope);
        note.setWsId(wsId);
        note.setProjId(projId);
        note.setUserId(loginUser.getUserId());
        note.setNoteTitle(normalizeAutoNoteTitle(noteTitle, memo));
        note.setMemo(memo);
        note.setDoneContent(memo);
        note.setCategory("GENERAL");
        note.setIcon("📝");
        note.setFolderId(folderId);
        note.setMoyoPublicYn("N");
        note.setNextContent(null);
        note.setIssueContent(null);
        note.setChangeLog(null);

        if (!inoteService.registerNote(note) || note.getNoteId() == null) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "노트를 만들지 못했습니다."));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("noteId", note.getNoteId());
        response.put("noteTitle", note.getNoteTitle());
        response.put("folderId", note.getFolderId());
        return ResponseEntity.ok(response);
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
            @RequestParam(value = "moyoPublicYn", required = false, defaultValue = "N") String moyoPublicYn,
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
        if (!canAccessNoteScope(normalizedScope, wsId, projId, loginUser.getUserId())) {
            return "redirect:/?authError=note-scope";
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
        note.setMoyoPublicYn(("PRIVATE".equalsIgnoreCase(normalizedScope) && "Y".equalsIgnoreCase(moyoPublicYn)) ? "Y" : "N");
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
            @RequestParam(value = "moyoPublicYn", required = false, defaultValue = "N") String moyoPublicYn,
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
        boolean canChangeMoyoPublic = savedNote.getUserId() != null
                && savedNote.getUserId().equals(loginUser.getUserId())
                && "PRIVATE".equalsIgnoreCase(savedNote.getScopeType());
        note.setMoyoPublicYn(canChangeMoyoPublic
                ? ("Y".equalsIgnoreCase(moyoPublicYn) ? "Y" : "N")
                : savedNote.getMoyoPublicYn());
        note.setDoneContent(memo); // 기존 컬럼 호환용
        note.setUpdatedBy(loginUser.getUserId());
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
            String uploadPath = noteEditorUploadPath;
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

    @PostMapping("/api/history/checkpoint")
    @ResponseBody
    public Map<String, Object> checkpointNoteHistory(
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
        if (note == null || !note.isCanEdit()) {
            response.put("success", false);
            response.put("message", "편집 권한이 없습니다.");
            return response;
        }
        inoteService.recordCurrentNoteVersion(noteId, loginUser.getUserId(), "UPDATE", null);
        response.put("success", true);
        return response;
    }

    @PostMapping("/autosave")
    @ResponseBody
    public Map<String, Object> autosaveNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam("noteTitle") String noteTitle,
            @RequestParam(value = "memo", required = false) String memo,
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
        note.setNoteTitle(normalizeAutoNoteTitle(noteTitle, memo));
        note.setMemo(memo);
        note.setDoneContent(memo);
        note.setFolderId(folderId != null ? folderId : savedNote.getFolderId());
        note.setUpdatedBy(loginUser.getUserId());
        boolean success = inoteService.autosaveNote(note);
        response.put("success", success);
        if (success) response.put("noteTitle", note.getNoteTitle());
        if (!success) response.put("message", "노트를 저장하지 못했습니다.");
        return response;
    }

    private String normalizeAutoNoteTitle(String requestedTitle, String memo) {
        String title = requestedTitle == null ? "" : requestedTitle.replaceAll("\\s+", " ").trim();
        if (title.isEmpty()) {
            String html = memo == null ? "" : memo;
            html = html.replaceAll("(?i)<br\\s*/?>", "\n")
                       .replaceAll("(?i)</(p|div|li|h[1-6]|blockquote|tr)>", "\n")
                       .replaceAll("<[^>]+>", " ");
            String text = HtmlUtils.htmlUnescape(html).replace('\u00A0', ' ');
            for (String line : text.split("\\R")) {
                String candidate = line.replaceAll("\\s+", " ").trim();
                if (!candidate.isEmpty()) {
                    title = candidate;
                    break;
                }
            }
        }
        if (title.isEmpty()) title = "새 노트";
        final int maxLength = 60;
        if (title.length() > maxLength) title = title.substring(0, maxLength).trim() + "…";
        return title;
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

        inoteService.moveNoteToTrash(noteId, loginUser.getUserId());
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
        if (file.getNoteId() == null || inoteService.getNoteDetail(file.getNoteId(), loginUser.getUserId()) == null) {
            return ResponseEntity.status(403).build();
        }
        Path filePath;
        try {
            filePath = resolveNoteAttachmentPath(file.getFilePath());
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        }
        if (!Files.isRegularFile(filePath)) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(filePath.toUri());
        String encodedFileName = URLEncoder.encode(file.getOriginFileName(), StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(encodedFileName, StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(resource);
    }

    @GetMapping("/view")
    public ResponseEntity<Resource> viewNoteFile(@RequestParam("fileId") Long fileId, HttpSession session) throws Exception {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(401).build();
        noteFileDTO file = inoteService.getNoteFile(fileId);
        if (file == null || file.getFilePath() == null) return ResponseEntity.notFound().build();
        if (file.getNoteId() == null || inoteService.getNoteDetail(file.getNoteId(), loginUser.getUserId()) == null) {
            return ResponseEntity.status(403).build();
        }
        Path filePath;
        try {
            filePath = resolveNoteAttachmentPath(file.getFilePath());
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        }
        if (!Files.isRegularFile(filePath)) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(resource);
    }

    @GetMapping("/api/main")
    @ResponseBody
    public ResponseEntity<?> mainNoteApi(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "limit", defaultValue = "3") int limit,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "LOGIN_REQUIRED"));
        }
        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if ("WS".equals(normalizedScope)
                && (wsId == null || workspaceDAO.isWorkspaceMember(wsId, loginUser.getUserId()) < 1)) {
            return ResponseEntity.status(403).body(Map.of("message", "WORKSPACE_MEMBER_REQUIRED"));
        }
        if ("PROJ".equals(normalizedScope) && projId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "PROJECT_ID_REQUIRED"));
        }
        int safeLimit = Math.min(Math.max(limit, 1), 51);

        // 전용 메인 쿼리(selectMainNoteList)에서 Oracle 500이 발생하므로,
        // 실제 노트 목록 화면에서 사용 중인 검증된 조회 경로를 그대로 사용합니다.
        // WS 범위와 wsId가 적용되고 previewContent도 서비스에서 가공됩니다.
        List<noteDTO> widgetNotes = inoteService.getNoteListPage(
                normalizedScope,
                wsId,
                projId,
                loginUser.getUserId(),
                null,
                false,
                null,
                null,
                0,
                safeLimit
        );
        if (widgetNotes == null) widgetNotes = java.util.Collections.emptyList();

        List<noteDTO> hydratedNotes = new java.util.ArrayList<>();
        for (int i = 0; i < widgetNotes.size(); i++) {
            noteDTO summary = widgetNotes.get(i);
            if (summary == null || summary.getNoteId() == null) continue;

            // 카드에 실제로 표시하는 상위 3건만 상세 조회한다.
            // 최근활동 계산용 추가 행까지 건별 상세 조회하면 limit이 커질수록 N+1이 발생한다.
            if (i >= 3) {
                hydratedNotes.add(summary);
                continue;
            }

            noteDTO detail = inoteService.getNoteDetail(summary.getNoteId(), loginUser.getUserId());
            if (detail == null) continue;
            if (detail.getPreviewContent() == null || detail.getPreviewContent().isBlank()) {
                detail.setPreviewContent(summary.getPreviewContent());
            }
            if (detail.getUserName() == null || detail.getUserName().isBlank()) {
                detail.setUserName(summary.getUserName());
            }
            if ((detail.getUserName() == null || detail.getUserName().isBlank()) && detail.getUserId() != null) {
                usersDto author = userService.findById(detail.getUserId());
                if (author != null && author.getUserName() != null && !author.getUserName().isBlank()) {
                    detail.setUserName(author.getUserName());
                }
            }
            if (detail.getProfileImagePath() == null || detail.getProfileImagePath().isBlank()) {
                detail.setProfileImagePath(summary.getProfileImagePath());
            }
            hydratedNotes.add(detail);
        }

        List<Map<String, Object>> noteItems = new java.util.ArrayList<>();
        for (noteDTO note : hydratedNotes) {
            if (note == null || note.getNoteId() == null) continue;

            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("noteId", note.getNoteId());
            item.put("noteTitle", note.getNoteTitle());
            item.put("previewContent", note.getPreviewContent());
            item.put("memo", note.getMemo());
            item.put("regDt", note.getRegDt());
            item.put("updDt", note.getUpdDt());
            item.put("moyoPublicAt", note.getMoyoPublicAt());
            item.put("viewCount", note.getViewCount() == null ? 0 : note.getViewCount());
            item.put("likeCount", note.getLikeCount() == null ? 0 : note.getLikeCount());
            item.put("feedbackCount", note.getFeedbackCount() == null ? 0 : note.getFeedbackCount());
            item.put("imageCount", note.getImageCount());
            item.put("tableCount", note.getTableCount());
            item.put("linkCount", note.getLinkCount());
            item.put("videoCount", note.getVideoCount());
            item.put("likedByMe", note.isLikedByMe());
            item.put("userId", note.getUserId());
            item.put("authorName", note.getUserName());
            item.put("userName", note.getUserName());
            item.put("profileImagePath", note.getProfileImagePath());
            noteItems.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("notes", noteItems);
        response.put("count", noteItems.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/explorer")
    @ResponseBody
    public ResponseEntity<?> noteExplorerApi(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "scopeType", required = false) String scopeType,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "size", defaultValue = "500") int size,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(401).body(Map.of("message", "로그인이 필요합니다."));
        String normalizedScope = normalizeScope(scope, scopeType, wsId, projId);
        if (!"TRASH".equals(normalizedScope) && !isValidScopeContext(normalizedScope, wsId, projId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "노트 위치를 먼저 선택해 주세요."));
        }
        int safeSize = Math.min(Math.max(size, 1), 1000);
        List<noteDTO> notes = inoteService.getNoteListPage(
                normalizedScope, wsId, projId, loginUser.getUserId(), keyword,
                false, null, "TRASH".equals(normalizedScope) ? null : folderId, 0, safeSize);
        return ResponseEntity.ok(Map.of("notes", notes == null ? java.util.Collections.emptyList() : notes));
    }

    @GetMapping("/api/friend-shares/notes")
    @ResponseBody
    public ResponseEntity<?> friendSharedNotes(
            @RequestParam("ownerId") Long ownerId,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(401).body(Map.of("message", "로그인이 필요합니다."));
        if (ownerId == null || ownerId <= 0) return ResponseEntity.badRequest().body(Map.of("message", "공유자를 선택해 주세요."));
        List<noteDTO> notes = inoteService.getNoteListPage(
                "FRIEND", null, null, loginUser.getUserId(), null,
                false, ownerId, null, 0, 500);
        return ResponseEntity.ok(Map.of("items", notes == null ? java.util.Collections.emptyList() : notes));
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
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            return "redirect:/note/list?scope=PRIVATE&authError=read";
        }
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
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            return "redirect:/note/list?scope=PRIVATE&authError=read";
        }

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
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            return "redirect:/note/list?scope=PRIVATE&authError=read";
        }
        inoteService.removeNoteReply(replyId, loginUser.getUserId());
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        String normalizedScope = note != null ? note.getScopeType() : normalizeScope(scope, scopeType, wsId, projId);
        Long noteWsId = note != null ? note.getWsId() : wsId;
        Long noteProjId = note != null ? note.getProjId() : projId;
        return "redirect:/note/detail?noteId=" + noteId + "&" + buildScopeQuery(normalizedScope, noteWsId, noteProjId);
    }


    @PostMapping("/api/public/view")
    @ResponseBody
    public Map<String, Object> recordPublicNoteView(
            @RequestParam("noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }
        noteDTO note = inoteService.getNoteDetail(noteId, loginUser.getUserId());
        if (note == null) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }

        final String viewedNoteIdsKey = "commonViewedNoteIdsV2";
        Object viewedValue = session.getAttribute(viewedNoteIdsKey);
        Set<Long> viewedNoteIds;
        if (viewedValue instanceof Set<?>) {
            viewedNoteIds = new HashSet<>();
            for (Object value : (Set<?>) viewedValue) {
                if (value instanceof Number) {
                    viewedNoteIds.add(((Number) value).longValue());
                }
            }
        } else {
            viewedNoteIds = new HashSet<>();
        }

        // 같은 세션에서는 같은 노트를 최초 한 번만 집계한다.
        if (viewedNoteIds.contains(noteId)) {
            response.put("success", true);
            response.put("counted", false);
            response.put("viewCount", inoteService.getNoteReactionStatus(noteId, loginUser.getUserId()).get("viewCount"));
            return response;
        }

        int viewCount = inoteService.recordNoteView(noteId);
        viewedNoteIds.add(noteId);
        session.setAttribute(viewedNoteIdsKey, viewedNoteIds);

        response.put("success", true);
        response.put("counted", true);
        response.put("viewCount", viewCount);
        return response;
    }

    @GetMapping("/api/public/reaction")
    @ResponseBody
    public Map<String, Object> getPublicNoteReaction(
            @RequestParam("noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }
        response.put("success", true);
        response.putAll(inoteService.getNoteReactionStatus(noteId, loginUser.getUserId()));
        return response;
    }

    @PostMapping("/api/public/like")
    @ResponseBody
    public Map<String, Object> togglePublicNoteLike(
            @RequestParam("noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }
        response.put("success", true);
        response.putAll(inoteService.toggleNoteLike(noteId, loginUser.getUserId()));
        return response;
    }

    @GetMapping("/api/replies")
    @ResponseBody
    public Map<String, Object> getPublicNoteReplies(
            @RequestParam("noteId") Long noteId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }

        List<noteReplyDTO> replies = inoteService.getNoteReplyList(noteId, loginUser.getUserId());
        response.put("success", true);
        response.put("replies", replies == null ? new ArrayList<noteReplyDTO>() : replies);
        response.put("count", replies == null ? 0 : replies.size());
        response.put("currentUserId", loginUser.getUserId());
        return response;
    }

    @PostMapping("/api/replies/add")
    @ResponseBody
    public Map<String, Object> addPublicNoteReply(
            @RequestParam("noteId") Long noteId,
            @RequestParam("replyContent") String replyContent,
            @RequestParam(value = "parentReplyId", required = false) Long parentReplyId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }
        String content = replyContent == null ? "" : replyContent.trim();
        if (content.isEmpty()) {
            response.put("success", false);
            response.put("message", "댓글 내용을 입력해주세요.");
            return response;
        }
        if (content.length() > 1000) {
            response.put("success", false);
            response.put("message", "댓글은 1000자 이하로 입력해주세요.");
            return response;
        }

        if (parentReplyId != null && !inoteService.canReplyToNoteReply(noteId, parentReplyId)) {
            response.put("success", false);
            response.put("message", "답글을 남길 수 없는 댓글입니다.");
            return response;
        }

        noteReplyDTO reply = new noteReplyDTO();
        reply.setNoteId(noteId);
        reply.setUserId(loginUser.getUserId());
        reply.setParentReplyId(parentReplyId);
        reply.setReplyContent(content);
        boolean saved = inoteService.registerNoteReply(reply);
        List<noteReplyDTO> replies = saved
                ? inoteService.getNoteReplyList(noteId, loginUser.getUserId())
                : new ArrayList<noteReplyDTO>();
        response.put("success", saved);
        response.put("message", saved ? "댓글이 등록되었습니다." : "댓글을 등록하지 못했습니다.");
        response.put("replies", replies);
        response.put("count", replies.size());
        response.put("currentUserId", loginUser.getUserId());
        return response;
    }

    @PostMapping("/api/replies/update")
    @ResponseBody
    public Map<String, Object> updatePublicNoteReply(
            @RequestParam("noteId") Long noteId,
            @RequestParam("replyId") Long replyId,
            @RequestParam("replyContent") String replyContent,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }
        String content = replyContent == null ? "" : replyContent.trim();
        if (content.isEmpty() || content.length() > 1000) {
            response.put("success", false);
            response.put("message", "댓글은 1자 이상 1000자 이하로 입력해주세요.");
            return response;
        }
        noteReplyDTO reply = new noteReplyDTO();
        reply.setReplyId(replyId);
        reply.setNoteId(noteId);
        reply.setUserId(loginUser.getUserId());
        reply.setReplyContent(content);
        boolean updated = inoteService.modifyNoteReply(reply);
        List<noteReplyDTO> replies = inoteService.getNoteReplyList(noteId, loginUser.getUserId());
        response.put("success", updated);
        response.put("message", updated ? "댓글이 수정되었습니다." : "수정할 수 있는 댓글이 아닙니다.");
        response.put("replies", replies);
        response.put("count", replies.size());
        response.put("currentUserId", loginUser.getUserId());
        return response;
    }

    @PostMapping("/api/replies/delete")
    @ResponseBody
    public Map<String, Object> deletePublicNoteReply(
            @RequestParam("noteId") Long noteId,
            @RequestParam("replyId") Long replyId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }
        List<noteReplyDTO> currentReplies = inoteService.getNoteReplyList(noteId, loginUser.getUserId());
        boolean ownsReply = currentReplies != null && currentReplies.stream().anyMatch(reply ->
                replyId.equals(reply.getReplyId()) && loginUser.getUserId().equals(reply.getUserId()));
        boolean deleted = ownsReply && inoteService.removeNoteReply(replyId, loginUser.getUserId());
        List<noteReplyDTO> replies = inoteService.getNoteReplyList(noteId, loginUser.getUserId());
        response.put("success", deleted);
        response.put("message", deleted ? "댓글이 삭제되었습니다." : "삭제할 수 있는 댓글이 아닙니다.");
        response.put("replies", replies);
        response.put("count", replies.size());
        response.put("currentUserId", loginUser.getUserId());
        return response;
    }

    @PostMapping("/api/replies/like")
    @ResponseBody
    public Map<String, Object> togglePublicNoteReplyLike(
            @RequestParam("noteId") Long noteId,
            @RequestParam("replyId") Long replyId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        if (!canAccessNote(noteId, loginUser.getUserId())) {
            response.put("success", false);
            response.put("message", "공개 노트를 찾을 수 없습니다.");
            return response;
        }

        List<noteReplyDTO> currentReplies = inoteService.getNoteReplyList(noteId, loginUser.getUserId());
        boolean belongsToNote = currentReplies != null && currentReplies.stream()
                .anyMatch(reply -> replyId.equals(reply.getReplyId()));
        boolean changed = belongsToNote && inoteService.toggleNoteReplyLike(replyId, loginUser.getUserId());
        List<noteReplyDTO> replies = inoteService.getNoteReplyList(noteId, loginUser.getUserId());

        response.put("success", changed);
        response.put("message", changed ? "댓글 좋아요가 반영되었습니다." : "댓글 좋아요를 처리하지 못했습니다.");
        response.put("replies", replies);
        response.put("count", replies.size());
        response.put("currentUserId", loginUser.getUserId());
        return response;
    }

    @PostMapping("/api/collect")
    @ResponseBody
    public Map<String, Object> collectPublicNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        try {
            noteDTO source = inoteService.getNoteDetail(noteId, loginUser.getUserId());
            if (source == null || !"Y".equalsIgnoreCase(source.getMoyoPublicYn())) {
                throw new IllegalStateException("담을 수 있는 공개 노트가 아닙니다.");
            }
            if (source.getUserId() != null && source.getUserId().equals(loginUser.getUserId())) {
                throw new IllegalStateException("내 노트는 담을 필요가 없습니다.");
            }

            noteDTO collected = new noteDTO();
            collected.setUserId(loginUser.getUserId());
            collected.setScopeType("PRIVATE");
            collected.setNoteTitle(source.getNoteTitle());
            collected.setMemo(source.getMemo());
            collected.setDoneContent(source.getDoneContent());
            collected.setNextContent(source.getNextContent());
            collected.setIssueContent(source.getIssueContent());
            collected.setChangeLog(source.getChangeLog());
            collected.setCategory(source.getCategory());
            // NOTES.ICON is NOT NULL. Preserve the source value even though the renewed UI no longer displays note icons.
            collected.setIcon(source.getIcon());
            collected.setFolderId(folderId);
            collected.setMoyoPublicYn("N");

            List<noteFileDTO> collectedFiles = new ArrayList<>();
            List<noteFileDTO> sourceFiles = inoteService.getNoteFileList(noteId);
            if (sourceFiles != null) {
                for (noteFileDTO sourceFile : sourceFiles) {
                    noteFileDTO copiedFile = new noteFileDTO();
                    copiedFile.setOriginFileName(sourceFile.getOriginFileName());
                    copiedFile.setStoredFileName(sourceFile.getStoredFileName());
                    copiedFile.setFilePath(sourceFile.getFilePath());
                    copiedFile.setFileSize(sourceFile.getFileSize());
                    copiedFile.setFileExt(sourceFile.getFileExt());
                    collectedFiles.add(copiedFile);
                }
            }
            inoteService.registerNoteWithFiles(collected, collectedFiles);
            response.put("success", true);
            response.put("noteId", collected.getNoteId());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
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
        response.put("success", inoteService.moveNoteToTrash(noteId, loginUser.getUserId()));
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
        boolean success = u != null && noteFolderDAO.moveNote(noteId, folderId, u.getUserId()) > 0;
        int recordLinkedCount = 0;
        if (success) {
            recordLinkedCount = contentRecordItemDAO.countActiveItemsByContent("NOTE", noteId);
            if (recordLinkedCount > 0) {
                // 탐색기 위치만 바꾸고 기록 연결(RECORD_TARGET_ID/CONTENT_ID)은 그대로 유지한다.
                contentRecordItemDAO.touchActiveItemsByContent("NOTE", noteId);
            }
        }
        r.put("success", success);
        r.put("recordLinkedCount", recordLinkedCount);
        r.put("recordLinkPreserved", success);
        return r;
    }

    @PostMapping("/api/note/trash")
    @ResponseBody
    public Map<String,Object> moveNoteToTrash(
            @RequestParam(name = "noteId") Long noteId,
            HttpSession session) {
        Map<String,Object> result = new HashMap<>();
        usersDto user = getLoginUser(session);
        if (user == null) { result.put("success", false); result.put("message", "로그인이 필요합니다."); return result; }
        boolean success = inoteService.moveNoteToTrash(noteId, user.getUserId());
        result.put("success", success);
        if (!success) result.put("message", "휴지통으로 이동할 권한이 없거나 노트를 찾을 수 없습니다.");
        return result;
    }

    @PostMapping("/api/note/restore")
    @ResponseBody
    public Map<String,Object> restoreNote(
            @RequestParam(name = "noteId") Long noteId,
            HttpSession session) {
        Map<String,Object> result = new HashMap<>();
        usersDto user = getLoginUser(session);
        if (user == null) { result.put("success", false); result.put("message", "로그인이 필요합니다."); return result; }
        boolean success = inoteService.restoreNoteFromTrash(noteId, user.getUserId());
        result.put("success", success);
        if (!success) result.put("message", "복원할 노트를 찾을 수 없습니다.");
        return result;
    }

    @PostMapping("/api/note/permanent-delete")
    @ResponseBody
    public Map<String,Object> permanentlyDeleteNote(
            @RequestParam(name = "noteId") Long noteId,
            HttpSession session) {
        Map<String,Object> result = new HashMap<>();
        usersDto user = getLoginUser(session);
        if (user == null) { result.put("success", false); result.put("message", "로그인이 필요합니다."); return result; }
        if (!inoteService.canPermanentlyDeleteNote(noteId, user.getUserId())) {
            result.put("success", false); result.put("message", "영구 삭제할 권한이 없습니다."); return result;
        }
        noteDTO note = inoteService.getNoteDetail(noteId, user.getUserId());
        if (note != null && note.getFileList() != null) {
            for (noteFileDTO file : note.getFileList()) deletePhysicalFile(file.getFilePath());
        }
        boolean success = inoteService.removeNote(noteId);
        result.put("success", success);
        if (!success) result.put("message", "노트를 영구 삭제하지 못했습니다.");
        return result;
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

    private List<Map<String, Object>> buildSharedFriendList(List<noteDTO> notes) {
        Map<Long, Map<String, Object>> uniqueFriends = new java.util.LinkedHashMap<>();
        if (notes == null) return new ArrayList<>();

        for (noteDTO note : notes) {
            if (note == null || note.getUserId() == null) continue;
            Map<String, Object> friend = uniqueFriends.computeIfAbsent(note.getUserId(), key -> {
                Map<String, Object> item = new HashMap<>();
                item.put("userId", key);
                item.put("userName", note.getUserName() == null || note.getUserName().trim().isEmpty() ? "이름 없음" : note.getUserName().trim());
                item.put("profileImagePath", note.getProfileImagePath());
                item.put("noteCount", 0);
                return item;
            });
            Number count = (Number) friend.get("noteCount");
            friend.put("noteCount", count == null ? 1 : count.intValue() + 1);
        }
        return new ArrayList<>(uniqueFriends.values());
    }

    private List<noteFolderDTO> buildSharedFolderList(List<noteDTO> notes) {
        Map<Long, noteFolderDTO> uniqueFolders = new java.util.LinkedHashMap<>();
        if (notes == null) return new ArrayList<>();

        for (noteDTO note : notes) {
            if (note == null || note.getFolderId() == null) continue;
            noteFolderDTO folder = new noteFolderDTO();
            folder.setFolderId(note.getFolderId());
            folder.setScopeType("FRIEND");
            folder.setDepth(0);
            folder.setFolderPath(note.getFolderPath());

            String folderName = note.getFolderName();
            if (folderName == null || folderName.trim().isEmpty()) {
                String path = note.getFolderPath();
                if (path != null && !path.trim().isEmpty()) {
                    String[] parts = path.split("\\s*/\\s*");
                    folderName = parts.length == 0 ? path : parts[parts.length - 1];
                }
            }
            folder.setFolderName(folderName == null || folderName.trim().isEmpty() ? "공유 폴더" : folderName.trim());
            uniqueFolders.putIfAbsent(folder.getFolderId(), folder);
        }
        return new ArrayList<>(uniqueFolders.values());
    }

    private List<noteFolderDTO> getFolderList(String scopeType,Long wsId,Long projId,Long userId){
        if ("ALL".equals(scopeType)) return new ArrayList<>();
        if (!canAccessNoteScope(scopeType, wsId, projId, userId)) return new ArrayList<>();
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
            item.put("projType", firstMapValue(row, "projType", "PROJ_TYPE", "PROJTYPE"));
            item.put("projCategory", firstMapValue(row, "projCategory", "PROJ_CATEGORY", "PROJCATEGORY"));
            item.put("projIcon", firstMapValue(row, "projIcon", "PROJ_ICON", "PROJICON"));
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

    private Map<String, Object> findRow(List<Map<String, Object>> rows, String key, Long id) {
        if (rows == null || id == null) return null;
        for (Map<String, Object> row : rows) {
            if (id.equals(toLong(row.get(key)))) return row;
        }
        return null;
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


    @PostMapping("/api/{noteId}/moyo-public")
    @ResponseBody
    public ResponseEntity<?> updateNoteMoyoPublic(@PathVariable("noteId") Long noteId,
                                                   @RequestBody(required = false) Map<String, Object> body,
                                                   HttpSession session) {
        usersDto user = getLoginUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "로그인이 필요합니다."));

        noteDTO note = inoteService.getNoteDetail(noteId, user.getUserId());
        if (note == null) return ResponseEntity.status(404).body(Map.of("message", "노트를 찾을 수 없습니다."));
        if (note.getUserId() == null || !note.getUserId().equals(user.getUserId()) || !isPersonalPermissionNote(note)) {
            return ResponseEntity.status(403).body(Map.of("message", "개인/개인 프로젝트 노트 작성자만 MOYO 공개 여부를 변경할 수 있습니다."));
        }

        Object raw = body == null ? null : body.get("moyoPublic");
        boolean moyoPublic = raw instanceof Boolean ? (Boolean) raw : "Y".equalsIgnoreCase(String.valueOf(raw)) || "TRUE".equalsIgnoreCase(String.valueOf(raw));
        boolean updated = inoteService.updateMoyoPublic(noteId, user.getUserId(), moyoPublic);
        if (!updated) return ResponseEntity.badRequest().body(Map.of("message", "MOYO 공개 상태를 변경하지 못했습니다."));
        return ResponseEntity.ok(Map.of("success", true, "moyoPublicYn", moyoPublic ? "Y" : "N"));
    }


    @PostMapping("/api/{noteId}/send")
    @ResponseBody
    public ResponseEntity<?> sendPublicNoteToFriends(@PathVariable("noteId") Long noteId,
                                                      @RequestBody(required = false) Map<String, Object> body,
                                                      HttpSession session) {
        usersDto user = (usersDto) session.getAttribute("loginUser");
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "로그인이 필요합니다."));

        noteDTO note = inoteService.getNoteDetail(noteId, user.getUserId());
        if (note == null) return ResponseEntity.status(404).body(Map.of("message", "노트를 찾을 수 없습니다."));
        if (!note.isMoyoPublic()) return ResponseEntity.badRequest().body(Map.of("message", "MOYO 공개 노트만 친구에게 보낼 수 있습니다."));

        Object rawIds = body == null ? null : body.get("targetUserIds");
        if (!(rawIds instanceof List<?> rawList) || rawList.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "보낼 친구를 선택해 주세요."));
        }

        List<Long> targetUserIds = new ArrayList<>();
        for (Object rawId : rawList) {
            Long targetUserId = null;
            if (rawId instanceof Number number) targetUserId = number.longValue();
            else try { targetUserId = Long.valueOf(String.valueOf(rawId)); } catch (Exception ignored) {}
            if (targetUserId == null || targetUserId.equals(user.getUserId()) || targetUserIds.contains(targetUserId)) continue;
            targetUserIds.add(targetUserId);
            if (targetUserIds.size() >= 100) break;
        }
        if (targetUserIds.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "보낼 친구를 선택해 주세요."));

        if (runtimeDdlEnabled) {
            try { userNoticeDAO.ensureUserNoticeCommonColumns(); } catch (Exception ignored) {}
        }
        String senderName = user.getUserName() == null || user.getUserName().isBlank() ? "친구" : user.getUserName().trim();
        String content = note.getPreviewContent();
        if (content == null || content.isBlank()) content = note.getNoteTitle();
        if (content == null || content.isBlank()) content = "MOYO 공개 노트를 확인해보세요.";
        if (content.length() > 500) content = content.substring(0, 500);
        String linkUrl = "/users/profile?userId=" + note.getUserId() + "&openNoteId=" + noteId;

        int sentCount = 0;
        for (Long targetUserId : targetUserIds) {
            friendDTO relation = friendDAO.selectRelation(user.getUserId(), targetUserId);
            if (relation == null || !"ACCEPTED".equalsIgnoreCase(relation.getStatus())) continue;
            userNoticeDAO.insertContentSendAlarm(targetUserId, "NOTE_SEND", "NOTE", noteId, senderName + "님이 노트를 보냈습니다.", content, linkUrl);
            sentCount++;
        }
        if (sentCount == 0) return ResponseEntity.badRequest().body(Map.of("message", "보낼 수 있는 친구를 찾지 못했습니다."));
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "sentCount", sentCount));
    }


    private boolean isPersonalPermissionNote(noteDTO note) {
        if (note == null) return false;
        String scope = note.getScopeType() == null ? "" : note.getScopeType().trim().toUpperCase();
        if ("PRIVATE".equals(scope) || "PERSONAL".equals(scope)) return true;
        if (("PROJ".equals(scope) || "PROJECT".equals(scope)) && note.getProjId() != null) {
            projectRequestDTO project = projectDAO.selectProjectById(note.getProjId());
            return project != null && project.getWsId() == null;
        }
        return false;
    }

    private boolean canAccessNoteScope(String scopeType, Long wsId, Long projId, Long userId) {
        if (scopeType == null || userId == null) return false;
        String normalized = scopeType.trim().toUpperCase();
        if ("PRIVATE".equals(normalized)) return true;
        if ("WS".equals(normalized)) {
            return wsId != null && workspaceDAO.isWorkspaceMember(wsId, userId) > 0;
        }
        if ("PROJ".equals(normalized)) {
            return projId != null && projectAuthorizationService.canAccessProject(projId, wsId, userId);
        }
        // ALL/IMPORTANT/FRIEND/TRASH are virtual browsing scopes, not native write/folder scopes.
        return false;
    }

    private boolean canAccessNote(Long noteId, Long userId) {
        if (noteId == null || userId == null) return false;
        // selectNoteDetail 자체가 작성자/공유/그룹/프로젝트 권한을 반영해
        // 접근 가능한 노트만 반환하므로 공개 여부가 아니라 실제 접근 권한으로 판단한다.
        return inoteService.getNoteDetail(noteId, userId) != null;
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
        if (!"ALL".equals(value) && !"IMPORTANT".equals(value) && !"PRIVATE".equals(value) && !"FRIEND".equals(value) && !"WS".equals(value) && !"PROJ".equals(value) && !"TRASH".equals(value)) return "PRIVATE";
        return value;
    }

    private boolean isValidScopeContext(String scopeType, Long wsId, Long projId) {
        if ("ALL".equals(scopeType) || "IMPORTANT".equals(scopeType) || "TRASH".equals(scopeType)) return true;
        if ("PRIVATE".equals(scopeType) || "FRIEND".equals(scopeType)) return true;
        if ("WS".equals(scopeType)) return wsId != null;
        if ("PROJ".equals(scopeType)) return projId != null;
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
        if ("IMPORTANT".equals(scopeType)) return "중요 노트";
        if ("TRASH".equals(scopeType)) return "휴지통";
        if ("FRIEND".equals(scopeType)) return "친구 노트";
        if ("PROJ".equals(scopeType)) return "프로젝트 노트";
        if ("WS".equals(scopeType)) return "그룹 노트";
        return "개인 노트";
    }

    private List<noteFileDTO> saveNoteFiles(List<MultipartFile> files) {
        List<noteFileDTO> fileList = new ArrayList<>();
        if (files == null || files.isEmpty()) return fileList;
        File folder = new File(noteUploadPath);
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

    private Path resolveNoteAttachmentPath(String filePath) {
        if (filePath == null || filePath.isBlank()) throw new IllegalArgumentException("파일 경로가 없습니다.");
        Path candidate = Path.of(filePath).toAbsolutePath().normalize();
        if (!candidate.startsWith(noteUploadRoot())) {
            throw new SecurityException("허용되지 않은 노트 첨부파일 경로입니다.");
        }
        return candidate;
    }

    private void deletePhysicalFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            Files.deleteIfExists(resolveNoteAttachmentPath(filePath));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
