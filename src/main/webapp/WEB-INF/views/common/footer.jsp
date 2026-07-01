<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<style>
    .moyo-footer {
        position: relative;
        z-index: 1;
        width: 100%;
        margin: 48px 0 0;
        padding: 0;
        box-sizing: border-box;
        border-top: 0;
        background: transparent;
        overflow: visible;
        color: #7b8491;
        font-family: 'Pretendard', sans-serif;
    }

    .moyo-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        width: 100vw;
        height: 1px;
        transform: translateX(-50%);
        background: #e4e9ef;
        pointer-events: none;
    }

    .moyo-footer-inner {
        width: 100%;
        min-height: 76px;
        margin: 0;
        padding: 0 28px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
    }

    .moyo-footer-message {
        min-width: 0;
        color: #667085;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.5;
        white-space: nowrap;
    }

    .moyo-footer-right {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 22px;
        flex-shrink: 0;
    }

    .moyo-footer-links {
        display: flex;
        align-items: center;
        gap: 18px;
    }

    .moyo-footer-links a {
        color: #7b8491;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.5;
        text-decoration: none;
        white-space: nowrap;
    }

    .moyo-footer-links a:hover {
        color: #2878d0;
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    .moyo-footer-copy {
        color: #a0a8b3;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
    }

    @media (max-width: 820px) {
        .moyo-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        width: 100vw;
        height: 1px;
        transform: translateX(-50%);
        background: #e4e9ef;
        pointer-events: none;
    }

    .moyo-footer-inner {
            min-height: 92px;
            padding: 18px;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            gap: 10px;
        }

        .moyo-footer-message {
            white-space: normal;
        }

        .moyo-footer-right {
            width: 100%;
            justify-content: space-between;
            gap: 14px;
        }
    }

    @media (max-width: 520px) {
        .moyo-footer-right {
            flex-direction: column;
            align-items: flex-start;
        }

        .moyo-footer-links {
            gap: 14px;
            flex-wrap: wrap;
        }
    }
</style>

<footer class="moyo-footer">
    <div class="moyo-footer-inner">
        <div class="moyo-footer-message">
            일정부터 모임과 프로젝트까지, 함께하는 모든 계획을 MOYO에서 이어보세요.
        </div>

        <div class="moyo-footer-right">
            <nav class="moyo-footer-links" aria-label="푸터 메뉴">
                <a href="/calendar">내 캘린더</a>
                <a href="/workspace/invitations">초대함</a>
                <a href="/users/mypage">내 정보</a>
            </nav>
            <div class="moyo-footer-copy">© 2026 MOYO. All rights reserved.</div>
        </div>
    </div>
</footer>


