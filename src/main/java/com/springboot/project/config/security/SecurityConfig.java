package com.springboot.project.config.security;

import java.io.IOException;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.beans.factory.annotation.Value;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Arrays;
import java.nio.charset.StandardCharsets;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
public class SecurityConfig {

    private final LegacySessionAuthenticationFilter legacySessionAuthenticationFilter;
    private final CsrfCookieFilter csrfCookieFilter;
    private final String allowedOrigins;

    public SecurityConfig(
            LegacySessionAuthenticationFilter legacySessionAuthenticationFilter,
            CsrfCookieFilter csrfCookieFilter,
            @Value("${moyo.security.cors.allowed-origins:}") String allowedOrigins) {
        this.legacySessionAuthenticationFilter = legacySessionAuthenticationFilter;
        this.csrfCookieFilter = csrfCookieFilter;
        this.allowedOrigins = allowedOrigins == null ? "" : allowedOrigins.trim();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .authorizeHttpRequests(auth -> auth

                // JSP 내부 렌더링 및 오류 처리용 디스패치는 허용한다.
                .dispatcherTypeMatchers(
                    DispatcherType.FORWARD,
                    DispatcherType.INCLUDE,
                    DispatcherType.ERROR
                ).permitAll()

                // 비로그인 공개 화면
                .requestMatchers(HttpMethod.GET,
                    "/",
                    "/login",
                    "/users/loginForm",
                    "/users/joinForm",
                    "/users/step2",
                    "/users/check-email",
                    "/users/withdraw/cancel",
                    "/users/password-reset",
                    "/common/privacyPolicy",
                    "/common/noticeList"
                ).permitAll()

                // 비로그인 상태에서 필요한 인증/가입 처리
                .requestMatchers(HttpMethod.POST,
                    "/users/login",
                    "/users/join",
                    "/users/completeJoin",
                    "/users/email-verification/send",
                    "/users/email-verification/verify",
                    "/users/password-reset/send",
                    "/users/password-reset/verify",
                    "/users/password-reset/complete",
                    "/users/withdraw/cancel"
                ).permitAll()

                // Spring Boot 오류 처리 경로
                .requestMatchers("/error").permitAll()

                // 애플리케이션 정적 리소스만 공개한다.
                // 사용자 업로드 경로(/uploads/**, /upload/**)는 포함하지 않는다.
                .requestMatchers(
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/brand/**",
                    "/favicon.ico"
                ).permitAll()

                // 운영에서 노출할 필요가 없는 개발/진단 엔드포인트는 의존성이 추가되더라도 기본 차단한다.
                .requestMatchers(
                    "/actuator",
                    "/actuator/**",
                    "/swagger-ui",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/h2-console",
                    "/h2-console/**"
                ).denyAll()

                // 채팅 기능은 현재 출시 범위에서 비활성화한다.
                // UI뿐 아니라 직접 URL 및 SockJS/WebSocket handshake 우회도 차단한다.
                .requestMatchers(
                    "/chat/**",
                    "/ws-stomp",
                    "/ws-stomp/**"
                ).denyAll()

                // 서비스 전역 관리자 기능
                .requestMatchers("/admin/**").hasRole("ADMIN")

                // 그 외 모든 MOYO 화면/API는 로그인 필수.
                .anyRequest().authenticated()
            )

            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    if (isApiRequest(request)) {
                        writeJsonError(response, HttpServletResponse.SC_UNAUTHORIZED,
                                "UNAUTHORIZED", "로그인이 필요합니다.");
                        return;
                    }
                    response.sendRedirect(request.getContextPath() + "/users/loginForm");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    if (isApiRequest(request)) {
                        writeJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                                "FORBIDDEN", "접근 권한이 없습니다.");
                        return;
                    }
                    response.sendError(HttpServletResponse.SC_FORBIDDEN);
                })
            )

            // 브라우저 보안 헤더.
            // 기존 JSP/CKEditor/CDN 사용을 깨지 않도록 CSP는 현재 구조에 맞춘 호환 정책으로 적용한다.
            .headers(headers -> headers
                .contentTypeOptions(Customizer.withDefaults())
                .frameOptions(frame -> frame.sameOrigin())
                .referrerPolicy(referrer -> referrer
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; "
                    + "base-uri 'self'; "
                    + "object-src 'none'; "
                    + "frame-ancestors 'self'; "
                    + "form-action 'self'; "
                    + "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
                    + "https://cdn.ckeditor.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://code.jquery.com; "
                    + "style-src 'self' 'unsafe-inline' https://cdn.ckeditor.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
                    + "img-src 'self' data: blob: https:; "
                    + "font-src 'self' data: https:; "
                    + "connect-src 'self' ws: wss: https:; "
                    + "media-src 'self' blob: https:; "
                    + "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://maps.google.com"
                ))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Permissions-Policy",
                    "camera=(), microphone=(), geolocation=()"
                ))
            )

            // 기존 MOYO 로그인/로그아웃 Controller를 유지한다.
            .formLogin(form -> form.disable())
            .logout(logout -> logout.disable())

            // MOYO는 기본적으로 same-origin 구조다.
            // 별도 Origin을 허용할 때만 환경변수 MOYO_ALLOWED_ORIGINS에 명시한다.
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // MOYO는 JSP form + fetch + jQuery Ajax가 혼재하므로
            // 읽기 가능한 XSRF-TOKEN 쿠키를 발급하고 공통 JS에서 unsafe 요청에 자동 주입한다.
            .csrf(csrf -> {
                CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
                repository.setCookiePath("/");

                CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
                csrf
                    .csrfTokenRepository(repository)
                    .csrfTokenRequestHandler(requestHandler);
            })

            // 기존 session["user"]를 Spring SecurityContext와 연결하는 호환 필터.
            .addFilterBefore(
                legacySessionAuthenticationFilter,
                AnonymousAuthenticationFilter.class
            )

            // 지연 생성되는 CSRF 토큰을 실제로 읽어 XSRF-TOKEN 쿠키를 보장한다.
            .addFilterAfter(csrfCookieFilter, CsrfFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .filter(value -> value.startsWith("https://") || value.startsWith("http://"))
                .distinct()
                .collect(Collectors.toList());

        configuration.setAllowedOrigins(origins);
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Accept",
                "Content-Type",
                "X-Requested-With",
                "X-XSRF-TOKEN"));
        configuration.setExposedHeaders(List.of(
                "Content-Disposition"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static boolean isApiRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri != null && (uri.startsWith(request.getContextPath() + "/api/")
                || uri.startsWith(request.getContextPath() + "/note/api/")
                || uri.startsWith(request.getContextPath() + "/users/email-verification/")
                || uri.startsWith(request.getContextPath() + "/users/password-reset/"))) {
            return true;
        }
        String requestedWith = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equalsIgnoreCase(requestedWith)) return true;
        String accept = request.getHeader("Accept");
        return accept != null && accept.toLowerCase().contains("application/json");
    }

    private static void writeJsonError(
            HttpServletResponse response,
            int status,
            String code,
            String message) throws IOException {

        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(
                "{\"success\":false,\"status\":" + status
                + ",\"code\":\"" + code
                + "\",\"message\":\"" + message + "\"}"
        );
    }

}
