package com.springboot.project.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryAttachmentDTO;
import com.springboot.project.dto.csInquiryDTO;
import com.springboot.project.dto.usersDto;
import com.springboot.project.service.IcsService;
import com.springboot.project.service.InquiryAttachmentStorageService;

import jakarta.servlet.http.HttpSession;

@Controller
public class commonPageController {

    @Autowired
    private IcsService csService;

    @Autowired
    private InquiryAttachmentStorageService attachmentStorageService;

    @GetMapping("/common/privacyPolicy")
    public String privacyPolicy() {
        return "common/privacyPolicy";
    }

    @GetMapping("/common/inquiry")
    public String inquiryForm(HttpSession session, Model model) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return "redirect:/users/loginForm";

        model.addAttribute("categoryList", csService.getCategoryList());
        model.addAttribute("currentUserId", loginUser.getUserId());
        return "common/inquiry";
    }

    @PostMapping(value = "/common/inquiry/send", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> sendInquiry(@RequestBody csInquiryDTO inquiry, HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("login_required");
        try {
            return ResponseEntity.ok(csService.registerInquiry(inquiry, loginUser.getUserId()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("fail");
        }
    }

    @PostMapping(value = "/common/inquiry/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public ResponseEntity<?> sendInquiryWithFiles(
            @RequestParam(value = "csId", required = false) Long csId,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("login_required");

        try {
            csInquiryDTO inquiry = new csInquiryDTO();
            inquiry.setCsId(csId);
            inquiry.setCategoryId(categoryId);
            inquiry.setTitle(title);
            inquiry.setContent(content);
            return ResponseEntity.ok(csService.registerInquiry(inquiry, loginUser.getUserId(), files));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("fail");
        }
    }

    @GetMapping("/common/inquiry/list")
    @ResponseBody
    public ResponseEntity<List<csDTO>> getInquiryList(HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(csService.getInquiryList(loginUser.getUserId()));
    }

    @GetMapping("/common/inquiry/messages")
    @ResponseBody
    public ResponseEntity<List<csInquiryDTO>> getMessages(
            @RequestParam(value = "csId", required = false) Long csId,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(csService.getMessages(loginUser.getUserId(), csId));
    }

    @GetMapping("/common/inquiry/attachments/download")
    public ResponseEntity<Resource> downloadInquiryAttachment(
            @RequestParam("attachmentId") Long attachmentId,
            HttpSession session) {
        usersDto loginUser = getLoginUser(session);
        if (loginUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        csInquiryAttachmentDTO attachment = csService.getUserAttachment(loginUser.getUserId(), attachmentId);
        if (attachment == null) return ResponseEntity.notFound().build();
        return downloadResponse(attachment);
    }

    private ResponseEntity<Resource> downloadResponse(csInquiryAttachmentDTO attachment) {
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

    private usersDto getLoginUser(HttpSession session) {
        return (usersDto) session.getAttribute("user");
    }
}
