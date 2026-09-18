package com.springboot.project.service;

/**
 * 비밀번호 검증까지 통과했지만 계정 상태 때문에 일반 로그인을 허용할 수 없을 때 사용한다.
 * 사용자 존재 여부를 노출하지 않기 위해 비밀번호 검증 후에만 발생시킨다.
 */
public class AccountStatusLoginException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final Long userId;
    private final String status;

    public AccountStatusLoginException(Long userId, String status) {
        super("Login blocked by account status: " + status);
        this.userId = userId;
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public String getStatus() {
        return status;
    }
}
