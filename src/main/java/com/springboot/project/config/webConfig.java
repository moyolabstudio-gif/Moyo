package com.springboot.project.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class webConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. 기존 워크스페이스 대표 이미지 설정 (그대로 유지)
        registry.addResourceHandler("/uploads/workspace/**")
                .addResourceLocations("file:///C:/uploads/workspace/"); 

        // 계정 기본 프로필 이미지
        registry.addResourceHandler("/uploads/users/**")
                .addResourceLocations("file:///C:/uploads/users/");

        // 워크스페이스/개인/프로젝트 공통 사진첩 이미지
        registry.addResourceHandler("/uploads/photos/**")
                .addResourceLocations("file:///C:/uploads/photos/");
        
        // 🚀 2. [추가] CKEditor 블로그/게시판 본문 이미지 업로드 경로 매핑
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:///C:/MoyoLab.Studio/upload/");
    }
}