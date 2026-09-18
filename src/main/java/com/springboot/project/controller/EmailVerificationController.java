package com.springboot.project.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.service.EmailVerificationService;
import com.springboot.project.service.EmailVerificationService.SendResult;
import com.springboot.project.service.EmailVerificationService.VerifyResult;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Controller
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    public EmailVerificationController(EmailVerificationService emailVerificationService) {
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/users/email-verification/send")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> send(
            @RequestParam("email") String email,
            HttpServletRequest request,
            HttpSession session) {

        SendResult result = emailVerificationService.sendCode(email, request, session);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", result.success());
        body.put("message", result.message());
        if (result.expiresInSeconds() > 0) body.put("expiresInSeconds", result.expiresInSeconds());
        if (result.retryAfterSeconds() > 0) body.put("retryAfterSeconds", result.retryAfterSeconds());
        return ResponseEntity.status(HttpStatus.valueOf(result.status())).body(body);
    }

    @PostMapping("/users/email-verification/verify")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> verify(
            @RequestParam("email") String email,
            @RequestParam("code") String code,
            HttpSession session) {

        VerifyResult result = emailVerificationService.verifyCode(email, code, session);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", result.success());
        body.put("message", result.message());
        return result.success()
                ? ResponseEntity.ok(body)
                : ResponseEntity.badRequest().body(body);
    }
}
