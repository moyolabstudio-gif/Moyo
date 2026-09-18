package com.springboot.project.config.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * URL 보안 외에 Controller/Service 메서드 단위 권한 검증을 활성화한다.
 */
@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig {
}
