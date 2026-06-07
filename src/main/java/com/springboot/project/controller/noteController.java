package com.springboot.project.controller;

import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.noteFileDTO;
import com.springboot.project.dto.noteReplyDTO;
import com.springboot.project.service.InoteService;

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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/project/note")
public class noteController {

    private static final String NOTE_UPLOAD_PATH = "C:/MoyoLab.Studio/note/";

    @Autowired
    private InoteService inoteService;

    /*
     * 프로젝트 노트 목록
     * /project/note/list?wsId=1&projId=22
     */
    @GetMapping("/list")
    public String noteList(
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            Model model,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        List<noteDTO> noteList = inoteService.getNoteList(wsId, projId, loginUser.getUserId());

        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("noteList", noteList);

        return "project/noteList";
    }

    /*
     * 노트 작성 화면
     * /project/note/write?wsId=1&projId=22
     */
    @GetMapping("/write")
    public String noteWriteForm(
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            Model model,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);

        return "project/noteWrite";
    }

    /*
     * 노트 상세
     * /project/note/detail?noteId=1&wsId=1&projId=22
     */
    @GetMapping("/detail")
    public String noteDetail(
            @RequestParam("noteId") Long noteId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            Model model,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        noteDTO note = inoteService.getNoteDetail(noteId);

        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        if (note == null) {
            return "redirect:/project/note/list?wsId=" + wsId + "&projId=" + projId;
        }

        boolean canEdit = note.getUserId() != null && note.getUserId().equals(loginUser.getUserId());
        boolean canDelete = inoteService.canDeleteNote(noteId, loginUser.getUserId());

        model.addAttribute("note", note);
        model.addAttribute("replyList", inoteService.getNoteReplyList(noteId));
        model.addAttribute("canEdit", canEdit);
        model.addAttribute("canDelete", canDelete);

        return "project/noteDetail";
    }


    /*
     * 노트 수정 화면
     * /project/note/edit?noteId=1&wsId=1&projId=22
     */
    @GetMapping("/edit")
    public String noteEditForm(
            @RequestParam("noteId") Long noteId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            Model model,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        noteDTO note = inoteService.getNoteDetail(noteId);

        if (note == null) {
            return "redirect:/project/note/list?wsId=" + wsId + "&projId=" + projId;
        }

        if (note.getUserId() == null || !note.getUserId().equals(loginUser.getUserId())) {
            return "redirect:/project/note/detail?noteId=" + noteId
                    + "&wsId=" + wsId + "&projId=" + projId + "&authError=edit";
        }

        model.addAttribute("wsId", wsId);
        model.addAttribute("projId", projId);
        model.addAttribute("note", note);

        return "project/noteEdit";
    }

    /*
     * 노트 등록
     */
    @PostMapping("/add")
    public String addNote(
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            @RequestParam("noteTitle") String noteTitle,
            @RequestParam(value = "doneContent", required = false) String doneContent,
            @RequestParam(value = "nextContent", required = false) String nextContent,
            @RequestParam(value = "issueContent", required = false) String issueContent,
            @RequestParam(value = "changeLog", required = false) String changeLog,
            @RequestParam(value = "memo", required = false) String memo,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        noteDTO note = new noteDTO();
        note.setWsId(wsId);
        note.setProjId(projId);
        note.setUserId(loginUser.getUserId());
        note.setNoteTitle(noteTitle);
        note.setDoneContent(doneContent);
        note.setNextContent(nextContent);
        note.setIssueContent(issueContent);
        note.setChangeLog(changeLog);
        note.setMemo(memo);

        List<noteFileDTO> fileList = saveNoteFiles(files);

        inoteService.registerNoteWithFiles(note, fileList);

        return "redirect:/project/note/detail?noteId=" + note.getNoteId()
                + "&wsId=" + wsId
                + "&projId=" + projId;
    }

    /*
     * 노트 수정
     */
    @PostMapping("/modify")
    public String modifyNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            @RequestParam("noteTitle") String noteTitle,
            @RequestParam(value = "doneContent", required = false) String doneContent,
            @RequestParam(value = "nextContent", required = false) String nextContent,
            @RequestParam(value = "issueContent", required = false) String issueContent,
            @RequestParam(value = "changeLog", required = false) String changeLog,
            @RequestParam(value = "memo", required = false) String memo,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        noteDTO savedNote = inoteService.getNoteDetail(noteId);
        if (savedNote == null) {
            return "redirect:/project/note/list?wsId=" + wsId + "&projId=" + projId;
        }
        if (savedNote.getUserId() == null || !savedNote.getUserId().equals(loginUser.getUserId())) {
            return "redirect:/project/note/detail?noteId=" + noteId
                    + "&wsId=" + wsId + "&projId=" + projId + "&authError=edit";
        }

        noteDTO note = new noteDTO();
        note.setNoteId(noteId);
        note.setWsId(wsId);
        note.setProjId(projId);
        note.setNoteTitle(noteTitle);
        note.setDoneContent(doneContent);
        note.setNextContent(nextContent);
        note.setIssueContent(issueContent);
        note.setChangeLog(changeLog);
        note.setMemo(memo);

        inoteService.modifyNote(note);

        List<noteFileDTO> fileList = saveNoteFiles(files);
        if (fileList != null && !fileList.isEmpty()) {
            for (noteFileDTO file : fileList) {
                file.setNoteId(noteId);
                inoteService.registerNoteFile(file);
            }
        }

        return "redirect:/project/note/detail?noteId=" + noteId
                + "&wsId=" + wsId
                + "&projId=" + projId;
    }

    /*
     * 노트 삭제
     */
    @PostMapping("/delete")
    public String deleteNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        noteDTO note = inoteService.getNoteDetail(noteId);

        if (note == null) {
            return "redirect:/project/note/list?wsId=" + wsId + "&projId=" + projId;
        }

        if (!inoteService.canDeleteNote(noteId, loginUser.getUserId())) {
            return "redirect:/project/note/detail?noteId=" + noteId
                    + "&wsId=" + wsId + "&projId=" + projId + "&authError=delete";
        }

        if (note.getFileList() != null) {
            for (noteFileDTO file : note.getFileList()) {
                deletePhysicalFile(file.getFilePath());
            }
        }

        inoteService.removeNote(noteId);

        return "redirect:/project/note/list?wsId=" + wsId + "&projId=" + projId;
    }

    /*
     * 기존 첨부파일 삭제 - 노트 작성자만 가능
     */
    @PostMapping("/file/delete")
    public String deleteNoteFile(
            @RequestParam("fileId") Long fileId,
            @RequestParam("noteId") Long noteId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        noteDTO note = inoteService.getNoteDetail(noteId);
        if (note == null || note.getUserId() == null || !note.getUserId().equals(loginUser.getUserId())) {
            return "redirect:/project/note/detail?noteId=" + noteId
                    + "&wsId=" + wsId + "&projId=" + projId + "&authError=file";
        }

        noteFileDTO file = inoteService.getNoteFile(fileId);
        if (file != null && noteId.equals(file.getNoteId())) {
            deletePhysicalFile(file.getFilePath());
            inoteService.removeNoteFile(fileId);
        }

        return "redirect:/project/note/edit?noteId=" + noteId
                + "&wsId=" + wsId + "&projId=" + projId;
    }

    /*
     * 노트 파일 다운로드
     * /project/note/download?fileId=1
     */
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadNoteFile(
            @RequestParam("fileId") Long fileId,
            HttpSession session) throws Exception {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).build();
        }

        noteFileDTO file = inoteService.getNoteFile(fileId);

        if (file == null || file.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Path.of(file.getFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());

        String encodedFileName = URLEncoder.encode(file.getOriginFileName(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(encodedFileName, StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(resource);
    }


    /*
     * 노트 이미지/파일 미리보기
     * 이미지 파일은 브라우저에서 바로 표시됩니다.
     * /project/note/view?fileId=1
     */
    @GetMapping("/view")
    public ResponseEntity<Resource> viewNoteFile(
            @RequestParam("fileId") Long fileId,
            HttpSession session) throws Exception {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return ResponseEntity.status(401).build();
        }

        noteFileDTO file = inoteService.getNoteFile(fileId);

        if (file == null || file.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Path.of(file.getFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }

    /*
     * 프로젝트 메인 위젯용 최근 노트 API
     * /project/note/api/main?wsId=1&projId=22&limit=3
     */
    @GetMapping("/api/main")
    @ResponseBody
    public List<noteDTO> mainNoteApi(
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            @RequestParam(value = "limit", defaultValue = "3") int limit,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return new ArrayList<>();
        }

        return inoteService.getMainNoteList(wsId, projId, loginUser.getUserId(), limit);
    }

    /*
     * 프로젝트 노트 목록 API
     */
    @GetMapping("/api/list")
    @ResponseBody
    public List<noteDTO> noteListApi(
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return new ArrayList<>();
        }

        return inoteService.getNoteList(wsId, projId, loginUser.getUserId());
    }


    /*
     * 노트 피드백 등록
     */
    @PostMapping("/reply/add")
    public String addNoteReply(
            @RequestParam("noteId") Long noteId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            @RequestParam("replyContent") String replyContent,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        if (replyContent != null && !replyContent.trim().isEmpty()) {
            noteReplyDTO reply = new noteReplyDTO();
            reply.setNoteId(noteId);
            reply.setUserId(loginUser.getUserId());
            reply.setReplyContent(replyContent);

            inoteService.registerNoteReply(reply);
        }

        return "redirect:/project/note/detail?noteId=" + noteId
                + "&wsId=" + wsId
                + "&projId=" + projId;
    }

    /*
     * 노트 피드백 삭제
     */
    @PostMapping("/reply/delete")
    public String deleteNoteReply(
            @RequestParam("replyId") Long replyId,
            @RequestParam("noteId") Long noteId,
            @RequestParam("wsId") Long wsId,
            @RequestParam("projId") Long projId,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/users/loginForm";
        }

        inoteService.removeNoteReply(replyId, loginUser.getUserId());

        return "redirect:/project/note/detail?noteId=" + noteId
                + "&wsId=" + wsId
                + "&projId=" + projId;
    }


    @PostMapping("/api/pin")
    @ResponseBody
    public Map<String, Object> pinNote(
            @RequestParam("noteId") Long noteId,
            @RequestParam("projId") Long projId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        try {
            inoteService.pinNote(loginUser.getUserId(), projId, noteId);
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
            @RequestParam("projId") Long projId,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return response;
        }
        response.put("success", inoteService.unpinNote(loginUser.getUserId(), projId, noteId));
        return response;
    }

    private List<noteFileDTO> saveNoteFiles(List<MultipartFile> files) {
        List<noteFileDTO> fileList = new ArrayList<>();

        if (files == null || files.isEmpty()) {
            return fileList;
        }

        File folder = new File(NOTE_UPLOAD_PATH);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        for (MultipartFile multipartFile : files) {
            if (multipartFile == null || multipartFile.isEmpty()) {
                continue;
            }

            try {
                String originalFileName = multipartFile.getOriginalFilename();
                if (originalFileName == null || originalFileName.trim().isEmpty()) {
                    originalFileName = "unknown";
                }

                String ext = getFileExt(originalFileName);
                String storedFileName = UUID.randomUUID().toString() + ext;
                String fullPath = NOTE_UPLOAD_PATH + storedFileName;

                multipartFile.transferTo(new File(fullPath));

                noteFileDTO fileDTO = new noteFileDTO();
                fileDTO.setOriginFileName(originalFileName);
                fileDTO.setStoredFileName(storedFileName);
                fileDTO.setFilePath(fullPath);
                fileDTO.setFileSize(multipartFile.getSize());
                fileDTO.setFileExt(ext.replace(".", ""));

                fileList.add(fileDTO);
            } catch (Exception e) {
                throw new RuntimeException("노트 파일 저장 실패", e);
            }
        }

        return fileList;
    }

    private String getFileExt(String fileName) {
        int lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return "";
        }
        return fileName.substring(lastDotIndex);
    }

    private void deletePhysicalFile(String filePath) {
        if (filePath == null || filePath.trim().isEmpty()) {
            return;
        }

        try {
            File file = new File(filePath);
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
