package com.springboot.project.config.security;

import java.io.IOException;
import java.util.Objects;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.usersDto;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * 4단계 이전에 생성된 기존 MOYO 세션과의 호환용 fallback 필터.
 *
 * 신규 로그인/회원가입 자동로그인은 MoyoAuthenticationService가 즉시
 * SecurityContext까지 생성한다. 이 필터는 session["user"]만 남아 있는
 * 기존 세션을 발견했을 때 한 번 Spring Security 인증 상태로 승격한다.
 */
@Component
public class LegacySessionAuthenticationFilter extends OncePerRequestFilter {

    private final MoyoAuthenticationService authenticationService;
    private final IusersDao usersDao;

    public LegacySessionAuthenticationFilter(
            MoyoAuthenticationService authenticationService,
            IusersDao usersDao) {
        this.authenticationService = authenticationService;
        this.usersDao = usersDao;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        HttpSession session = request.getSession(false);

        if (session != null) {
            Object sessionUser = session.getAttribute("user");
            if (sessionUser instanceof usersDto user && user.getUserId() != null) {
                Long currentVersion = usersDao.findSecurityVersionByUserId(user.getUserId());

                // 비밀번호 재설정 등 보안 자격증명이 변경되면 기존 로그인 세션을 즉시 폐기한다.
                if (currentVersion == null || !Objects.equals(currentVersion, user.getSecurityVersion())) {
                    authenticationService.clearAuthentication(session);

                    if (request.getRequestURI().startsWith(request.getContextPath() + "/api/")) {
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                    } else {
                        response.sendRedirect(request.getContextPath() + "/users/loginForm?status=sessionExpired");
                    }
                    return;
                }

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    authenticationService.establishAuthentication(user, session);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
