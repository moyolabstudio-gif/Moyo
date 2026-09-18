package com.springboot.project.service;

public class LoginTemporarilyBlockedException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public LoginTemporarilyBlockedException() {
        super("로그인 시도가 일시적으로 제한되었습니다.");
    }
}
