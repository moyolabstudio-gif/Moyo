package com.springboot.project.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dao.IcsDAO;
import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryAttachmentDTO;
import com.springboot.project.dto.csInquiryDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IcsService;
import com.springboot.project.service.InquiryAttachmentStorageService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class adminController {

    @Autowired
    private IusersDao usersDao;

    @Autowired
    private IcsDAO csDAO;

    @Autowired
    private IcsService csService;

    @Autowired
    private InquiryAttachmentStorageService attachmentStorageService;

    @GetMapping({"", "/", "/main"})
    public String adminMain(Model model) {
        List<usersDto> allUsers = usersDao.findAll();
        model.addAttribute("userList", allUsers);
        return "admin/adminMain";
    }

    @GetMapping("/getCsHistory")
    @ResponseBody
    public List<csDTO> getCsHistory(@RequestParam("userId") Long userId) {
        return csDAO.findCsByUserId(userId);
    }

    @GetMapping("/inquiries")
    public String inquiryManagement() {
        return "admin/inquiryManagement";
    }

    @GetMapping("/inquiries/list")
    @ResponseBody
    public ResponseEntity<List<csDTO>> getInquiryList() {
        return ResponseEntity.ok(csService.getAdminInquiryList());
    }

    @GetMapping("/inquiries/messages")
    @ResponseBody
    public ResponseEntity<List<csInquiryDTO>> getInquiryMessages(@RequestParam("csId") Long csId) {
        return ResponseEntity.ok(csService.getAdminMessages(csId));
    }

    @PostMapping(value = "/inquiries/reply", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> replyInquiry(@RequestBody csInquiryDTO reply, HttpSession session) {
        usersDto adminUser = (usersDto) session.getAttribute("user");
        if (adminUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("login_required");
        try {
            csService.replyInquiry(reply.getCsId(), adminUser.getUserId(), reply.getContent());
            return ResponseEntity.ok("ok");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("fail");
        }
    }

    @PostMapping(value = "/inquiries/reply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public ResponseEntity<?> replyInquiryWithFiles(
            @RequestParam("csId") Long csId,
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {
        usersDto adminUser = (usersDto) session.getAttribute("user");
        if (adminUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("login_required");
        try {
            csService.replyInquiry(csId, adminUser.getUserId(), content, files);
            return ResponseEntity.ok("ok");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("fail");
        }
    }

    @PostMapping("/inquiries/status")
    @ResponseBody
    public ResponseEntity<?> updateInquiryStatus(@RequestBody Map<String, Object> payload) {
        try {
            Object csIdValue = payload.get("csId");
            Object statusValue = payload.get("status");
            if (csIdValue == null || statusValue == null) {
                return ResponseEntity.badRequest().body("문의 번호와 상태가 필요합니다.");
            }
            Long csId = Long.valueOf(String.valueOf(csIdValue));
            csService.updateInquiryStatus(csId, String.valueOf(statusValue));
            return ResponseEntity.ok("ok");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("fail");
        }
    }

    @GetMapping("/inquiries/attachments/download")
    public ResponseEntity<Resource> downloadInquiryAttachment(@RequestParam("attachmentId") Long attachmentId) {
        csInquiryAttachmentDTO attachment = csService.getAdminAttachment(attachmentId);
        if (attachment == null) return ResponseEntity.notFound().build();
        try {
            Resource resource = attachmentStorageService.load(attachment.getStoredName());
            String contentType = attachment.getContentType() == null || attachment.getContentType().isBlank()
                    ? MediaType.APPLICATION_OCTET_STREAM_VALUE : attachment.getContentType();
            ContentDisposition disposition = ContentDisposition.attachment()
                    .filename(attachment.getOriginalName(), StandardCharsets.UTF_8)
                    .build();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(attachment.getFileSize() == null ? resource.contentLength() : attachment.getFileSize())
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
