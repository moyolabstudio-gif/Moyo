<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<header>
    <%@ include file="../common/header.jsp"%>
</header>

<style>
    html,
    body {
        min-height: 100%;
        background:
            radial-gradient(circle at 12% 8%, rgba(57, 205, 181, .10), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, #ffffff 56%);
    }

    .moyo-policy-page {
        min-height: calc(100vh - 70px);
        padding: 104px clamp(28px, 4vw, 64px) 30px;
        box-sizing: border-box;
        background: transparent;
        color: #1f2a3d;
        font-family: 'Pretendard', sans-serif;
    }

    .moyo-policy-wrap {
        width: min(980px, 100%);
        margin: 0 auto;
    }

    .moyo-policy-hero {
        margin-bottom: 16px;
    }

    .moyo-policy-kicker {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 12px;
        color: #2878d0;
        font-size: 13px;
        font-weight: 900;
    }

    .moyo-policy-kicker::before {
        content: '';
        width: 4px;
        height: 18px;
        border-radius: 999px;
        background: linear-gradient(180deg, #39cdb5, #4a90e2);
    }

    .moyo-policy-title {
        margin: 0;
        color: #111827;
        font-size: 30px;
        font-weight: 950;
        letter-spacing: -0.04em;
    }

    .moyo-policy-desc {
        margin: 10px 0 0;
        color: #667085;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.7;
    }

    .moyo-policy-card {
        overflow: hidden;
        border: 1px solid #e4eaf3;
        border-radius: 22px;
        background: rgba(255, 255, 255, .94);
        box-shadow: 0 18px 44px rgba(27, 43, 76, .07);
    }

    .moyo-policy-section {
        padding: 18px 28px;
        border-bottom: 1px solid #edf1f7;
    }

    .moyo-policy-section:last-child {
        border-bottom: 0;
    }

    .moyo-policy-section h3 {
        margin: 0 0 10px;
        color: #243041;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: -0.02em;
    }

    .moyo-policy-section p,
    .moyo-policy-section li {
        color: #5f6b7a;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.75;
    }

    .moyo-policy-section p {
        margin: 0;
    }

    .moyo-policy-section ul {
        margin: 0;
        padding-left: 18px;
    }

    .moyo-policy-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
    }

    .moyo-policy-link-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 15px;
        border: 1px solid #cfe0ff;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(57, 205, 181, .12), rgba(74, 144, 226, .12));
        color: #2878d0;
        font-size: 13px;
        font-weight: 900;
        text-decoration: none;
        transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
    }

    .moyo-policy-link-btn:hover {
        transform: translateY(-1px);
        border-color: #9ec4ff;
        box-shadow: 0 10px 22px rgba(74, 144, 226, .13);
    }

    .moyo-policy-note {
        margin-top: 12px;
        color: #8a94a3;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.6;
    }

    /* 로그인 후 앱 shell에서는 사이드바와 헤더는 유지하고, 배경은 body 전역에서 이어지게 둔다. */
    body.moyo-app-sidebar-enabled .moyo-policy-page {
        min-height: calc(100vh - var(--moyo-header-height, 70px));
        padding: 28px clamp(28px, 3.2vw, 56px) 28px;
        background: transparent;
    }

    body.moyo-app-sidebar-enabled .moyo-policy-wrap {
        width: min(1040px, 100%);
        margin-left: auto;
        margin-right: auto;
    }

    body.moyo-app-sidebar-enabled .moyo-policy-card {
        box-shadow: 0 16px 40px rgba(27, 43, 76, .06);
    }

    @media (max-width: 720px) {
        .moyo-policy-page {
            padding: 94px 18px 28px;
        }
        body.moyo-app-sidebar-enabled .moyo-policy-page {
            padding: 24px 18px 28px;
        }
        .moyo-policy-title {
            font-size: 25px;
        }
        .moyo-policy-section {
            padding: 20px 20px;
        }
    }
</style>

<main class="moyo-policy-page">
    <div class="moyo-policy-wrap">
        <section class="moyo-policy-hero" aria-labelledby="privacyPolicyTitle">
            <div class="moyo-policy-kicker">MOYO 안내</div>
            <h1 id="privacyPolicyTitle" class="moyo-policy-title">개인정보처리방침</h1>
            <p class="moyo-policy-desc">
                MOYO는 일정, 기록, 사진, 그룹과 프로젝트를 함께 이어가기 위해 필요한 최소한의 개인정보만 수집하고 관리합니다.
            </p>
        </section>

        <section class="moyo-policy-card" aria-label="개인정보처리방침 내용">
            <div class="moyo-policy-section">
                <h3>1. 수집하는 개인정보</h3>
                <ul>
                    <li>회원 정보: 이름, 이메일, 프로필 이미지, 닉네임 등 계정 식별에 필요한 정보</li>
                    <li>서비스 이용 정보: 일정, 노트, 사진, 그룹, 프로젝트, 공유 및 권한 설정 정보</li>
                    <li>관계 및 알림 정보: 친구 요청, 그룹/프로젝트 초대, 댓글, 공유 요청, 알림 내역</li>
                    <li>기술 정보: 서비스 이용 과정에서 생성되는 접속 기록, 오류 기록, 기기 및 브라우저 정보</li>
                </ul>
            </div>

            <div class="moyo-policy-section">
                <h3>2. 개인정보의 이용 목적</h3>
                <ul>
                    <li>회원 식별, 로그인, 계정 관리</li>
                    <li>일정, 노트, 사진, 그룹, 프로젝트 기능 제공</li>
                    <li>친구 요청, 공유 요청, 권한 관리, 알림 제공</li>
                    <li>서비스 안정성 확인, 오류 개선, 사용자 경험 개선</li>
                </ul>
            </div>

            <div class="moyo-policy-section">
                <h3>3. 개인정보의 보관 및 삭제</h3>
                <ul>
                    <li>MOYO는 서비스 제공에 필요한 기간 동안 개인정보를 보관합니다.</li>
                    <li>회원 탈퇴 또는 삭제 요청이 있는 경우 관련 법령에 따라 보관이 필요한 정보를 제외하고 지체 없이 삭제합니다.</li>
                    <li>사용자가 작성한 일정, 노트, 사진, 댓글 등은 공유 관계나 그룹/프로젝트 이용 이력에 따라 삭제 또는 비식별 처리될 수 있습니다.</li>
                </ul>
            </div>

            <div class="moyo-policy-section">
                <h3>4. 개인정보의 제3자 제공</h3>
                <p>
                    MOYO는 사용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만 법령에 따라 필요한 경우 또는 수사기관의 적법한 요청이 있는 경우에는 예외적으로 제공될 수 있습니다.
                </p>
            </div>

            <div class="moyo-policy-section">
                <h3>5. 개인정보 처리 위탁</h3>
                <p>
                    안정적인 서비스 운영을 위해 서버 운영, 데이터 보관, 알림 발송 등 일부 업무를 외부 서비스에 위탁할 수 있습니다. 위탁이 발생하는 경우 위탁 업체와 업무 범위를 본 방침 또는 별도 안내를 통해 고지합니다.
                </p>
            </div>

            <div class="moyo-policy-section">
                <h3>6. 이용자의 권리</h3>
                <ul>
                    <li>사용자는 본인의 개인정보 열람, 수정, 삭제, 처리 정지를 요청할 수 있습니다.</li>
                    <li>프로필, 친구, 공유, 알림 등 일부 정보는 서비스 내 설정 또는 문의하기를 통해 변경을 요청할 수 있습니다.</li>
                    <li>그룹/프로젝트에서 공유된 정보는 권한과 참여 상태에 따라 표시 범위가 달라질 수 있습니다.</li>
                </ul>
            </div>

            <div class="moyo-policy-section">
                <h3>7. 안전성 확보 조치</h3>
                <ul>
                    <li>개인정보 접근 권한을 필요한 사용자와 기능으로 제한합니다.</li>
                    <li>공유, 편집 권한, 그룹/프로젝트 참여 정보를 기준으로 접근 범위를 관리합니다.</li>
                    <li>오류 기록과 접속 기록은 서비스 안정성 확인과 보안 점검 목적으로만 활용합니다.</li>
                </ul>
            </div>

            <div class="moyo-policy-section">
                <h3>8. 방침 변경</h3>
                <p>
                    본 개인정보처리방침은 서비스 정책, 기능 변경, 법령 개정에 따라 수정될 수 있습니다. 중요한 변경 사항이 있는 경우 공지사항을 통해 안내합니다.
                </p>
            </div>

            <div class="moyo-policy-section">
                <h3>9. 문의</h3>
                <p>
                    개인정보 처리와 관련한 문의는 문의하기 메뉴를 통해 접수할 수 있습니다. 접수된 문의는 확인 후 가능한 범위에서 안내드립니다.
                </p>
                <div class="moyo-policy-actions">
                    <a class="moyo-policy-link-btn" href="/common/inquiry">문의하기로 이동</a>
                </div>
                <div class="moyo-policy-note">
                    본 페이지는 서비스 준비 단계의 기본 개인정보처리방침이며, 실제 운영 정책과 법률 검토 결과에 따라 수정될 수 있습니다.
                </div>
            </div>
        </section>
    </div>
</main>

<%@ include file="../common/footer.jsp"%>
