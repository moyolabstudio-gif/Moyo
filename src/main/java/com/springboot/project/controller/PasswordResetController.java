package com.springboot.project.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.config.security.MoyoAuthenticationService;
import com.springboot.project.config.security.SecurityAuditLogger;
import com.springboot.project.service.PasswordResetService;
import com.springboot.project.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Controller
public class PasswordResetController {

    private final PasswordResetService passwordResetService;
    private final UserService userService;
    private final MoyoAuthenticationService authenticationService;
    private final SecurityAuditLogger securityAuditLogger;

    public PasswordResetController(
            PasswordResetService passwordResetService,
            UserService userService,
            MoyoAuthenticationService authenticationService,
            SecurityAuditLogger securityAuditLogger) {
        this.passwordResetService = passwordResetService;
        this.userService = userService;
        this.authenticationService = authenticationService;
        this.securityAuditLogger = securityAuditLogger;
    }

    @GetMapping("/users/password-reset")
    public String form() {
        return "users/passwordReset";
    }

    @PostMapping("/users/password-reset/send")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> send(
            @RequestParam("email") String email,
            HttpServletRequest request,
            HttpSession session) {

        PasswordResetService.SendResult result =
                passwordResetService.sendCode(email, request, session);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", result.success());
        body.put("message", result.message());
        body.put("expiresInSeconds", result.expiresInSeconds());
        body.put("retryAfterSeconds", result.retryAfterSeconds());

        return ResponseEntity.status(result.status()).body(body);
    }

    @PostMapping("/users/password-reset/verify")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> verify(
            @RequestParam("email") String email,
            @RequestParam("code") String code,
            HttpSession session) {

        PasswordResetService.VerifyResult result =
                passwordResetService.verifyCode(email, code, session);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", result.success());
        body.put("message", result.message());

        return ResponseEntity.status(result.success() ? 200 : 400).body(body);
    }

    @PostMapping("/users/password-reset/complete")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> complete(
            @RequestParam("email") String email,
            @RequestParam("newPassword") String newPassword,
            @RequestParam("confirmPassword") String confirmPassword,
            HttpServletRequest request,
            HttpSession session) {

        Long userId = passwordResetService.verifiedUserId(email, session);
        if (userId == null) {
            securityAuditLogger.failure("PASSWORD_RESET", null, request, "verification_missing_or_expired");
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "본인 확인 시간이 만료되었습니다. 다시 인증해주세요."));
        }

        try {
            userService.resetPassword(userId, newPassword, confirmPassword);
            passwordResetService.clear(session);

            // 현재 브라우저에 로그인 세션이 남아 있다면 함께 제거한다.
            authenticationService.clearAuthentication(session);
            securityAuditLogger.success("PASSWORD_RESET", userId, request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요."));
        } catch (IllegalArgumentException e) {
            securityAuditLogger.failure("PASSWORD_RESET", userId, request, "validation_failed");
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }
}
