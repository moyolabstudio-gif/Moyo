package com.springboot.project.config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class webConfig implements WebMvcConfigurer {

    @Value("${moyo.upload.workspace-dir:C:/uploads/workspace/}")
    private String workspaceUploadDir;

    @Value("${moyo.upload.user-dir:C:/uploads/users/}")
    private String userUploadDir;

    @Value("${moyo.upload.board-editor-dir:C:/uploads/editor/}")
    private String boardEditorUploadDir;

    @Value("${moyo.upload.note-editor-dir:C:/uploads/note-editor/}")
    private String noteEditorUploadDir;

    @Value("${moyo.upload.poll-dir:C:/uploads/polls/}")
    private String pollUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 환경별 실제 업로드 경로를 설정값으로 받아 웹 경로에 연결한다.
        registry.addResourceHandler("/uploads/workspace/**")
                .addResourceLocations(toFileResourceLocation(workspaceUploadDir));

        // 계정 기본 프로필 이미지
        registry.addResourceHandler("/uploads/users/**")
                .addResourceLocations(toFileResourceLocation(userUploadDir));

        // 사진첩 원본은 /photo/media/{photoId} 컨트롤러에서 콘텐츠 권한 확인 후 제공한다.
        // task-records 직접 파일 매핑은 사용처가 없어 제거한다.

        // 본문 인라인 미디어만 서브디렉터리 단위로 노출한다.
        // 루트 /upload/** 매핑은 게시판 첨부파일까지 우회 접근이 가능하므로 사용하지 않는다.
        registry.addResourceHandler("/upload/editor/**")
                .addResourceLocations(toFileResourceLocation(boardEditorUploadDir));
        registry.addResourceHandler("/upload/note-editor/**")
                .addResourceLocations(toFileResourceLocation(noteEditorUploadDir));
        registry.addResourceHandler("/upload/polls/**")
                .addResourceLocations(toFileResourceLocation(pollUploadDir));
    }

    private String toFileResourceLocation(String directory) {
        String location = Path.of(directory).toAbsolutePath().normalize().toUri().toString();
        return location.endsWith("/") ? location : location + "/";
    }
}
