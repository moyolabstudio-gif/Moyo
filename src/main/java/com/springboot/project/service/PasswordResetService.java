package com.springboot.project.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.usersDto;

import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Service
public class PasswordResetService {

    public static final String SESSION_KEY = "passwordResetVerification";

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    private final JavaMailSender mailSender;
    private final IusersDao usersDao;
    private final Map<String, SendWindow> sendWindows = new ConcurrentHashMap<>();

    @Value("${moyo.security.password-reset.code-expiry-minutes:5}")
    private long codeExpiryMinutes;

    @Value("${moyo.security.password-reset.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    @Value("${moyo.security.password-reset.max-verify-failures:5}")
    private int maxVerifyFailures;

    @Value("${moyo.security.password-reset.send-window-minutes:30}")
    private long sendWindowMinutes;

    @Value("${moyo.security.password-reset.max-sends-per-window:5}")
    private int maxSendsPerWindow;

    @Value("${moyo.security.password-reset.verified-valid-minutes:10}")
    private long verifiedValidMinutes;

    @Value("${moyo.mail.from:}")
    private String configuredFrom;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public PasswordResetService(JavaMailSender mailSender, IusersDao usersDao) {
        this.mailSender = mailSender;
        this.usersDao = usersDao;
    }

    public SendResult sendCode(String rawEmail, HttpServletRequest request, HttpSession session) {
        String email = normalizeEmail(rawEmail);
        if (!isValidEmail(email)) {
            return SendResult.badRequest("올바른 이메일 형식을 입력해주세요.");
        }

        usersDto user = usersDao.findByEmail(email);

        // 비밀번호 재설정 화면에서는 사용자가 계정 존재 여부를 명확히 알 수 있게 안내한다.
        if (user == null || user.getUserId() == null || "QUIT".equalsIgnoreCase(user.getStatus())) {
            session.removeAttribute(SESSION_KEY);
            return SendResult.notFound("가입된 이메일이 없습니다.");
        }

        String rateKey = email + "|" + clientIp(request);
        Instant now = Instant.now();
        long retryAfter = checkAndReserveSend(rateKey, now);
        if (retryAfter > 0) {
            return SendResult.tooManyRequests(
                    "인증 메일을 너무 자주 요청했습니다. 잠시 후 다시 시도해주세요.",
                    retryAfter);
        }

        String code = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
        VerificationState state = new VerificationState(
                user.getUserId(),
                email,
                hash(email, code, session.getId()),
                now.plus(Duration.ofMinutes(codeExpiryMinutes)),
                0,
                false,
                null);

        try {
            String from = configuredFrom == null || configuredFrom.isBlank()
                    ? mailUsername
                    : configuredFrom.trim();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, StandardCharsets.UTF_8.name());

            if (from != null && !from.isBlank()) {
                helper.setFrom(from, "MOYO");
            }

            helper.setTo(email);
            helper.setSubject("[MOYO] 비밀번호 재설정 인증번호");
            helper.setText(
                    buildPlainText(code),
                    buildHtmlText(code));
            helper.addInline(
                    "moyoLogo",
                    new ClassPathResource("static/brand/moyo_logo.png"),
                    "image/png");

            mailSender.send(message);
        } catch (Exception e) {
            rollbackSendReservation(rateKey);
            log.error("비밀번호 재설정 메일 발송 실패. to={}", email, e);
            return SendResult.serviceUnavailable(
                    "인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }

        session.setAttribute(SESSION_KEY, state);
        return SendResult.ok(
                "인증번호를 발송했습니다. 메일함을 확인해주세요.",
                codeExpiryMinutes * 60L,
                resendCooldownSeconds);
    }

    private String buildPlainText(String code) {
        return "MOYO 비밀번호 재설정을 진행해주세요.\n\n"
                + "계정 비밀번호 재설정을 위한 인증번호입니다.\n\n"
                + code + "\n\n"
                + "인증번호는 " + codeExpiryMinutes + "분 동안 유효합니다.\n"
                + "본인이 요청하지 않았다면 이 메일을 무시해주세요.";
    }

    private String buildHtmlText(String code) {
        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>MOYO 비밀번호 재설정</title>
                </head>
                <body style="margin:0;padding:0;background:#f5f8fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,'Noto Sans KR',sans-serif;color:#1e2736;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="width:100%%;background:#f5f8fc;margin:0;padding:0;">
                    <tr>
                      <td align="center" style="padding:32px 16px;">
                        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%%;max-width:560px;background:#ffffff;border:1px solid #e6ecf5;border-radius:20px;overflow:hidden;">
                          <tr>
                            <td style="height:6px;font-size:0;line-height:0;background:#55d5ce;background:linear-gradient(90deg,#55d5ce 0%%,#4288ef 55%%,#5a55ee 100%%);">&nbsp;</td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:38px 32px 12px;">
                              <img src="cid:moyoLogo" width="148" alt="MOYO" style="display:block;width:148px;max-width:100%%;height:auto;border:0;">
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:16px 32px 0;">
                              <h1 style="margin:0;font-size:26px;line-height:1.35;font-weight:800;letter-spacing:-0.5px;color:#111827;">비밀번호 재설정을 진행해주세요</h1>
                              <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#7b8799;">MOYO 계정의 비밀번호 재설정을 위한 인증번호입니다.</p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:28px 32px 8px;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                                <tr>
                                  <td align="center" style="min-width:260px;padding:18px 28px;background:#f4f7ff;border:1px solid #dce5ff;border-radius:14px;font-size:32px;line-height:1.2;font-weight:800;letter-spacing:4px;color:#426ff0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;cursor:text;user-select:all;">%s</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:14px 32px 34px;">
                              <p style="margin:0;font-size:14px;line-height:1.7;color:#5e6b7f;">인증번호는 <strong style="color:#334155;">%d분 동안 유효</strong>합니다.</p>
                              <p style="margin:8px 0 0;font-size:13px;line-height:1.7;color:#98a3b3;">본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:20px 24px;background:#fafbfd;border-top:1px solid #edf1f6;font-size:12px;line-height:1.6;color:#a2adbc;">© MOYO</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(code, codeExpiryMinutes);
    }

    public VerifyResult verifyCode(String rawEmail, String rawCode, HttpSession session) {
        String email = normalizeEmail(rawEmail);
        String code = rawCode == null ? "" : rawCode.trim();
        Object stored = session.getAttribute(SESSION_KEY);

        if (!(stored instanceof VerificationState state)
                || !state.email().equals(email)
                || Instant.now().isAfter(state.expiresAt())) {
            clear(session);
            return VerifyResult.fail("인증번호를 확인할 수 없습니다. 다시 발송해주세요.");
        }

        if (state.verifyFailures() >= maxVerifyFailures) {
            clear(session);
            return VerifyResult.fail("인증번호 입력 횟수를 초과했습니다. 다시 발송해주세요.");
        }

        if (!MessageDigest.isEqual(state.codeHash(), hash(email, code, session.getId()))) {
            int failures = state.verifyFailures() + 1;
            if (failures >= maxVerifyFailures) {
                clear(session);
                return VerifyResult.fail("인증번호 입력 횟수를 초과했습니다. 다시 발송해주세요.");
            }
            session.setAttribute(SESSION_KEY, state.withFailures(failures));
            return VerifyResult.fail("인증번호가 올바르지 않습니다.");
        }

        session.setAttribute(SESSION_KEY, state.asVerified(Instant.now()));
        return VerifyResult.ok("본인 확인이 완료되었습니다.");
    }

    public Long verifiedUserId(String rawEmail, HttpSession session) {
        String email = normalizeEmail(rawEmail);
        Object stored = session.getAttribute(SESSION_KEY);
        if (!(stored instanceof VerificationState state)) return null;
        if (!state.verified() || state.verifiedAt() == null) return null;
        if (!state.email().equals(email)) return null;

        if (Instant.now().isAfter(state.verifiedAt().plus(Duration.ofMinutes(verifiedValidMinutes)))) {
            clear(session);
            return null;
        }
        return state.userId();
    }

    public void clear(HttpSession session) {
        if (session != null) {
            session.removeAttribute(SESSION_KEY);
        }
    }

    private long checkAndReserveSend(String key, Instant now) {
        SendWindow window = sendWindows.computeIfAbsent(key, ignored -> new SendWindow(now));
        synchronized (window) {
            if (window.windowStartedAt.plus(Duration.ofMinutes(sendWindowMinutes)).isBefore(now)) {
                window.windowStartedAt = now;
                window.lastSentAt = null;
                window.sendCount = 0;
            }

            if (window.lastSentAt != null) {
                long elapsed = Duration.between(window.lastSentAt, now).getSeconds();
                if (elapsed < resendCooldownSeconds) {
                    return Math.max(1L, resendCooldownSeconds - elapsed);
                }
            }

            if (window.sendCount >= maxSendsPerWindow) {
                long remaining = Duration.between(
                        now,
                        window.windowStartedAt.plus(Duration.ofMinutes(sendWindowMinutes))).getSeconds();
                return Math.max(1L, remaining);
            }

            window.sendCount++;
            window.lastSentAt = now;
            return 0L;
        }
    }

    private void rollbackSendReservation(String key) {
        SendWindow window = sendWindows.get(key);
        if (window == null) return;
        synchronized (window) {
            if (window.sendCount > 0) window.sendCount--;
            if (window.sendCount == 0) window.lastSentAt = null;
        }
    }

    private byte[] hash(String email, String code, String sessionId) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest((email + ":" + code + ":" + sessionId)
                    .getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isValidEmail(String email) {
        return !email.isBlank() && email.length() <= 254 && email.matches(EMAIL_PATTERN);
    }

    private String clientIp(HttpServletRequest request) {
        return request == null || request.getRemoteAddr() == null
                ? "unknown"
                : request.getRemoteAddr();
    }

    private record VerificationState(
            Long userId,
            String email,
            byte[] codeHash,
            Instant expiresAt,
            int verifyFailures,
            boolean verified,
            Instant verifiedAt) {

        private VerificationState withFailures(int failures) {
            return new VerificationState(
                    userId, email, codeHash, expiresAt, failures, false, null);
        }

        private VerificationState asVerified(Instant now) {
            return new VerificationState(
                    userId, email, codeHash, expiresAt, verifyFailures, true, now);
        }
    }

    private static final class SendWindow {
        private Instant windowStartedAt;
        private Instant lastSentAt;
        private int sendCount;

        private SendWindow(Instant now) {
            this.windowStartedAt = now;
        }
    }

    public record SendResult(
            boolean success,
            int status,
            String message,
            long expiresInSeconds,
            long retryAfterSeconds) {

        static SendResult ok(String message, long expires, long retry) {
            return new SendResult(true, 200, message, expires, retry);
        }

        static SendResult badRequest(String message) {
            return new SendResult(false, 400, message, 0, 0);
        }

        static SendResult notFound(String message) {
            return new SendResult(false, 404, message, 0, 0);
        }

        static SendResult tooManyRequests(String message, long retry) {
            return new SendResult(false, 429, message, 0, retry);
        }

        static SendResult serviceUnavailable(String message) {
            return new SendResult(false, 503, message, 0, 0);
        }
    }

    public record VerifyResult(boolean success, String message) {
        static VerifyResult ok(String message) {
            return new VerifyResult(true, message);
        }

        static VerifyResult fail(String message) {
            return new VerifyResult(false, message);
        }
    }
}
