package com.springboot.project.config.security;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

import com.springboot.project.dto.usersDto;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * MOYO의 기존 session["user"]와 Spring Security 인증 상태를 한 곳에서 동기화한다.
 *
 * 현재 JSP/Controller가 session["user"]를 많이 사용하므로 세션 구조는 유지하고,
 * 인증 생성/갱신/해제만 이 서비스로 중앙화한다.
 */
@Service
public class MoyoAuthenticationService {

    /**
     * 실제 로그인/회원가입 자동로그인/탈퇴복구 성공처럼
     * 인증 경계가 바뀌는 순간에만 기존 세션 ID를 회전시킨다.
     * 세션 고정(Session Fixation) 공격 방어용이다.
     */
    public void establishFreshAuthentication(usersDto user, HttpServletRequest request) {
        if (user == null || request == null) {
            clearSecurityContext();
            return;
        }

        HttpSession session = request.getSession(true);
        request.changeSessionId();
        establishAuthentication(user, session);
    }

    /**
     * 이미 인증된 사용자의 세션 사용자/권한 정보만 갱신한다.
     * 프로필 조회·수정 같은 일반 요청에서는 세션 ID를 회전시키지 않는다.
     */
    public void establishAuthentication(usersDto user, HttpSession session) {
        if (user == null || session == null) {
            clearSecurityContext();
            return;
        }

        UsernamePasswordAuthenticationToken authentication = createAuthentication(user);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);

        SecurityContextHolder.setContext(context);
        session.setAttribute("user", user);
        session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context);
    }

    public void clearAuthentication(HttpSession session) {
        clearSecurityContext();
        if (session != null) {
            session.invalidate();
        }
    }

    /**
     * 세션 자체는 유지하되 기존 MOYO/Spring Security 로그인 상태만 제거한다.
     * 탈퇴 대기 계정의 복구용 임시 세션을 만들 때 사용한다.
     */
    public void clearAuthenticationKeepingSession(HttpSession session) {
        clearSecurityContext();
        if (session != null) {
            session.removeAttribute("user");
            session.removeAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
        }
    }

    public UsernamePasswordAuthenticationToken createAuthentication(usersDto user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        String userRole = user == null ? null : user.getUserRole();

        if (userRole != null && !userRole.isBlank()) {
            String normalizedRole = userRole.trim().toUpperCase();
            if (!normalizedRole.startsWith("ROLE_")) {
                normalizedRole = "ROLE_" + normalizedRole;
            }
            authorities.add(new SimpleGrantedAuthority(normalizedRole));
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, null, authorities);
        if (user != null) {
            authentication.setDetails(user.getUserId());
        }
        return authentication;
    }

    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
}
