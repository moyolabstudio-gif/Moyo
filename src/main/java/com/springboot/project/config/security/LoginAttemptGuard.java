package com.springboot.project.config.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 단일 애플리케이션 인스턴스에서 과도한 로그인 시도를 IP 기준으로 제한한다.
 * 계정 단위 잠금은 DB(UserService)에서 별도로 처리한다.
 */
@Service
public class LoginAttemptGuard {

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    @Value("${moyo.security.login.ip-window-minutes:10}")
    private long windowMinutes;

    @Value("${moyo.security.login.ip-max-failures:20}")
    private int maxFailures;

    @Value("${moyo.security.login.ip-block-minutes:10}")
    private long blockMinutes;

    public boolean isBlocked(HttpServletRequest request) {
        AttemptState state = attempts.get(clientKey(request));
        if (state == null) return false;

        synchronized (state) {
            Instant now = Instant.now();
            if (state.blockedUntil != null) {
                if (state.blockedUntil.isAfter(now)) return true;
                attempts.remove(clientKey(request), state);
                return false;
            }
            if (state.windowStartedAt.plus(Duration.ofMinutes(windowMinutes)).isBefore(now)) {
                attempts.remove(clientKey(request), state);
            }
            return false;
        }
    }

    public boolean recordFailure(HttpServletRequest request) {
        String key = clientKey(request);
        Instant now = Instant.now();

        AttemptState state = attempts.computeIfAbsent(key, ignored -> new AttemptState(now));
        synchronized (state) {
            if (state.blockedUntil != null && state.blockedUntil.isAfter(now)) {
                return true;
            }

            if (state.windowStartedAt.plus(Duration.ofMinutes(windowMinutes)).isBefore(now)) {
                state.windowStartedAt = now;
                state.failures = 0;
                state.blockedUntil = null;
            }

            state.failures++;
            if (state.failures >= maxFailures) {
                state.blockedUntil = now.plus(Duration.ofMinutes(blockMinutes));
                return true;
            }
        }

        cleanupIfNeeded(now);
        return false;
    }

    public void recordSuccess(HttpServletRequest request) {
        attempts.remove(clientKey(request));
    }

    private String clientKey(HttpServletRequest request) {
        if (request == null || request.getRemoteAddr() == null) {
            return "unknown";
        }
        return request.getRemoteAddr();
    }

    private void cleanupIfNeeded(Instant now) {
        if (attempts.size() < 2048) return;

        Duration retention = Duration.ofMinutes(windowMinutes + blockMinutes + 5);
        attempts.entrySet().removeIf(entry -> {
            AttemptState state = entry.getValue();
            synchronized (state) {
                Instant lastRelevant = state.blockedUntil != null
                        ? state.blockedUntil
                        : state.windowStartedAt;
                return lastRelevant.plus(retention).isBefore(now);
            }
        });
    }

    private static final class AttemptState {
        private Instant windowStartedAt;
        private int failures;
        private Instant blockedUntil;

        private AttemptState(Instant now) {
            this.windowStartedAt = now;
        }
    }
}
