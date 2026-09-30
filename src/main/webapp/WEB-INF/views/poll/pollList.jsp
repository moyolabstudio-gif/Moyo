<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>투표 | MOYO</title>
<link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
<link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
<link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">

<style>
:root{
  --poll-ink:#18243a;
  --poll-text:#52627a;
  --poll-muted:#8996a9;
  --poll-line:#e4eaf2;
  --poll-line-soft:#edf1f6;
  --poll-surface:#fff;
  --poll-mint:#3fd4bf;
  --poll-blue:#4b8df8;
  --poll-purple:#7b63f6;
  --poll-danger:#ff6477;
  --poll-grad:linear-gradient(135deg,var(--poll-mint) 0%,var(--poll-blue) 54%,var(--poll-purple) 100%);
  --poll-shadow:0 8px 24px rgba(56,76,108,.055);
}
*{box-sizing:border-box}
html,body.poll-page-body{
  background:
    radial-gradient(circle at 10% 10%,rgba(63,212,191,.12) 0,rgba(63,212,191,0) 25%),
    radial-gradient(circle at 89% 8%,rgba(75,141,248,.12) 0,rgba(75,141,248,0) 24%),
    radial-gradient(circle at 92% 80%,rgba(123,99,246,.065) 0,rgba(123,99,246,0) 26%),
    linear-gradient(180deg,#fcfeff 0%,#fbfdff 50%,#fdfdff 100%)!important;
  background-attachment:fixed!important;
}
body.poll-page-body{margin:0;color:var(--poll-ink);font-family:'Pretendard','Noto Sans KR',Arial,sans-serif}
button,input,select{font:inherit}.poll-page button{outline:none}
.poll-page{width:min(1240px,calc(100% - 48px));margin:34px auto 72px}

/* ===== board-aligned page heading ===== */
.poll-hero{background:transparent;border:0;border-radius:0;box-shadow:none;margin:0;padding:0}
.poll-hero-copy{min-width:0}
.poll-eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:9px}
.poll-section-icon{display:inline-flex;align-items:center;justify-content:center;width:auto;height:auto;padding:0;background:none;box-shadow:none;border-radius:0;font-size:15px;line-height:1}
.poll-scope-badge{display:inline-flex;align-items:center;min-height:auto;padding:0;border:0;background:transparent;color:#71809a;font-size:11px;font-weight:850;letter-spacing:-.01em}
.poll-hero-title-row{display:block}
.poll-hero-icon{display:none}
.poll-hero-title-row>div{min-width:0}
.poll-hero h2{margin:0;padding:0;background:none!important;color:var(--poll-ink);font-size:34px;font-weight:900;line-height:1.12;letter-spacing:-.045em;text-decoration:none!important;border:0!important;border-bottom:0!important;box-shadow:none!important} .poll-hero h2::before,.poll-hero h2::after{content:none!important;display:none!important;border:0!important;background:none!important;box-shadow:none!important}
.poll-hero p{margin:8px 0 0;color:#63748d;font-size:13px;font-weight:620;line-height:1.55}
.poll-hero-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-bottom:1px;flex:0 0 auto}
.poll-open-create-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:96px;height:38px;padding:0 15px;border:0;border-radius:12px;background:var(--poll-grad);color:#fff;font-size:11px;font-weight:820;cursor:pointer;box-shadow:0 7px 16px rgba(75,141,248,.18);transition:.15s ease}
.poll-open-create-btn:hover{transform:translateY(-1px);box-shadow:0 10px 20px rgba(75,141,248,.23)}
.poll-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;min-height:108px;padding:4px 2px 20px;border-bottom:1px solid var(--poll-line)}

/* ===== workspace ===== */
.poll-page-content{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:28px;align-items:start;padding-top:14px}
.poll-detail-card{min-width:0;min-height:0;padding:0;background:transparent;border:0;border-radius:0;box-shadow:none}
.poll-detail-header{display:flex;align-items:center;justify-content:space-between;gap:18px;height:48px;margin:0;padding:0 2px;border-bottom:1px solid var(--poll-line)}
.poll-detail-header h3{margin:0;color:#485a74;font-size:14px;font-weight:850;letter-spacing:-.015em}
.poll-detail-guide{color:#8d99aa;font-size:11px;font-weight:680}
#activePollArea{min-height:0}
#activePollArea:not(.poll-empty-state):not(.poll-loading-state){padding:22px 2px 0;border:0;border-radius:0;background:transparent;box-shadow:none}

/* ===== side list ===== */
.poll-side-panel{position:sticky;top:18px;min-width:0;background:transparent;border:0;border-radius:0;box-shadow:none;overflow:visible}
.poll-tabs{display:flex;align-items:center;gap:22px;height:48px;padding:0;border:0;border-bottom:1px solid var(--poll-line)}
.poll-tab{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 2px;border:0;background:transparent;color:#748196;font-size:13px;font-weight:820;cursor:pointer}
.poll-tab:hover{color:#40506a}
.poll-tab.active{color:#1d2a42;font-weight:900}
.poll-tab:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:999px;background:transparent}
.poll-tab.active:after{background:linear-gradient(90deg,var(--poll-mint),var(--poll-blue),var(--poll-purple))}
.poll-list-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#f1f4f8;color:#7d899a;font-size:10px;font-weight:900}
.poll-tab.active .poll-list-count{background:#edf5ff;color:#4a7fca}
.poll-tab-content{display:none}.poll-tab-content.active{display:block}
.poll-history-list{display:flex;flex-direction:column;gap:0;max-height:610px;padding:8px 0 0;overflow:auto;scrollbar-width:thin;scrollbar-color:#d7dfe8 transparent}
.poll-history-item{position:relative;padding:17px 10px 16px 12px;border:0;border-bottom:1px solid var(--poll-line-soft);border-radius:0;background:transparent;box-shadow:none;cursor:pointer;transition:background .15s ease}
.poll-history-item:hover{background:rgba(255,255,255,.62)}
.poll-history-item.active{background:linear-gradient(90deg,rgba(64,205,188,.045),rgba(75,141,248,.035),transparent)}
.poll-history-item.active:before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:1px;border-radius:999px;background:var(--poll-grad)}
.poll-list-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
.poll-list-title{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#223149;font-size:14px;font-weight:900;letter-spacing:-.025em;line-height:1.35}
.poll-list-state{display:inline-flex;align-items:center;flex:0 0 auto;height:20px;padding:0 6px;border-radius:999px;background:#eef8f5;color:#27977f;font-size:9px;font-weight:850;white-space:nowrap}
.poll-history-item.is-past .poll-list-state{background:#f2f4f7;color:#7f8b9b}
.poll-list-subrow{display:flex;align-items:center;gap:5px;margin-top:8px;min-width:0;color:#7f8c9d;font-size:10.5px;font-weight:700;line-height:1.45}
.poll-list-author,.poll-list-deadline{min-width:0;white-space:nowrap}
.poll-list-author{overflow:hidden;text-overflow:ellipsis}
.poll-list-deadline{flex:0 0 auto;color:#7f8c9d;font-weight:700}
.poll-list-subrow-dot{flex:0 0 auto;color:#c0c8d2}
.poll-list-meta{display:flex;align-items:center;gap:7px;margin-top:7px;color:#8a96a6;font-size:10px;font-weight:750}
.poll-list-meta-item{display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
.poll-list-meta-dot{width:2px;height:2px;border-radius:50%;background:#c2cad4}
.poll-history-item.active .poll-list-title{color:#244a76}

/* ===== detail ===== */
.poll-detail-head{padding:0 0 14px;border-bottom:1px solid var(--poll-line-soft)}
.poll-detail-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}
.poll-title-with-status{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0}
.active-poll-question{margin:0;color:#1c2941;font-size:23px;font-weight:900;letter-spacing:-.04em;line-height:1.4}
.poll-status{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-style:normal;font-size:9.5px;font-weight:850;white-space:nowrap}
.poll-status.active{border:1px solid #c7eee5;background:#f3fbf9;color:#17977d}.poll-status.closed{border:1px solid #e3e8ee;background:#f7f9fb;color:#7f8b9a}.poll-status.extended{border:1px solid #dce6f5;background:#f4f8fd;color:#5f7da1}
.poll-detail-title-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.poll-manage-btn{height:30px;padding:0 10px;border:1px solid #dfe6ef;border-radius:9px;background:#fff;color:#66768a;font-size:10px;font-weight:820;cursor:pointer}.poll-manage-btn:hover{border-color:#cfd9e5;background:#fbfcfe}.poll-manage-btn.extend{color:#397fcf}.poll-manage-btn.delete{color:#d84d5d}
.poll-detail-summary-row{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:8px}
.poll-detail-summary{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:0}.poll-summary-chip{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border:1px solid #e5eaf0;border-radius:9px;background:#fafbfd;color:#69788c;font-size:10px;font-weight:820}.poll-summary-chip.participated{border-color:#ccefe5;background:#f2fbf8;color:#159578}.poll-summary-chip.people{border-color:#d8e9fb;background:#f6faff;color:#397fcf}.poll-summary-chip.deadline{border-color:#f3e1c3;background:#fffaf2;color:#c88323}.poll-summary-chip.closed{color:#7c8897}
.poll-detail-author{margin:0;color:#9aa6b5;font-size:10px;font-weight:700;white-space:nowrap;text-align:left}.poll-detail-author strong{color:#66768a;font-weight:850}.poll-author-sep{margin:0 4px;color:#c0c8d2}.poll-result-visibility-meta{color:#8190a3;font-weight:750}
.poll-options-section{padding-top:13px}
.poll-options-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:11px}
.poll-options-heading{display:flex;align-items:center;gap:8px;min-width:0}.poll-options-heading h4{margin:0;color:#304158;font-size:12px;font-weight:900;letter-spacing:-.02em}.poll-options-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#f1f5fa;color:#68809e;font-size:9px;font-weight:900}
.poll-options-guide{margin:0;color:#8794a4;font-size:10.5px;font-weight:650;text-align:right;line-height:1.45}

/* ===== options ===== */
.poll-option-list{display:grid;grid-template-columns:1fr;gap:9px}.poll-option-btn{position:relative;display:flex;flex-direction:column;gap:8px;width:100%;min-width:0;padding:12px 13px;border:1px solid #e2e8ee;border-radius:13px;background:#fff;color:#344256;text-align:left;cursor:pointer;transition:.15s ease}.poll-option-btn:hover:not(:disabled){border-color:#c6dcf3;background:#fbfdff;transform:translateY(-1px)}.poll-option-btn.selected{border-color:#8dbbed;background:#f8fbff;box-shadow:0 0 0 2px rgba(74,144,226,.07)}.poll-option-btn.winner{border-color:#efcc8b;background:#fffdfa}.poll-option-btn:disabled{cursor:default;opacity:1}
.poll-option-bottom{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px;width:100%}.option-number{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:8px;background:#f0f5fb;color:#4a7caf;font-size:9.5px;font-weight:900}.text-option-number-group,.text-option-label-group{display:flex;align-items:center;gap:6px;min-width:0}.poll-option-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;font-weight:850}.text-winner-crown{font-size:14px}.text-choice-label{color:#397fcf;font-size:9.5px;font-weight:850;white-space:nowrap}.poll-winner-text{color:#c48220;font-size:9.5px;font-weight:850;white-space:nowrap}.poll-result-meta{display:flex;align-items:center;justify-content:flex-end;gap:6px;white-space:nowrap;color:#7d8a9a;font-size:9.5px;font-weight:780}.poll-count{font-weight:900;color:#5d6d80}.poll-percentage{color:#8a97a6}

/* ===== text poll detail ===== */
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid){gap:8px}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-btn{
  min-height:54px;padding:0 14px;border-color:#e2e8ef;border-radius:12px;background:#fff;box-shadow:none;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-btn:hover:not(:disabled){
  border-color:#cbdced;background:#fbfdff;transform:none;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-btn.selected{
  border-color:#bfd9f5;background:linear-gradient(90deg,rgba(75,141,248,.055),rgba(63,212,191,.025));box-shadow:0 0 0 1px rgba(75,141,248,.035);
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-bottom{
  grid-template-columns:30px minmax(0,1fr) auto;gap:10px;min-height:52px;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .option-number{
  width:26px;height:26px;border-radius:8px;background:#f3f6fa;color:#71849c;font-size:10px;font-weight:900;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-btn.selected .option-number{
  background:#eaf4ff;color:#397fcf;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-text{
  font-size:12.5px;font-weight:850;color:#2d3d52;letter-spacing:-.015em;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-result-meta{
  min-width:78px;gap:7px;font-size:10.5px;color:#8795a6;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .text-choice-label{
  display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:999px;background:#edf6ff;color:#397fcf;font-size:9.5px;font-weight:900;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-count{
  min-width:28px;text-align:right;color:#66768a;font-size:10.5px;font-weight:900;
}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-btn.selected .poll-count{color:#397fcf}
.poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-winner-text{
  display:inline-flex;align-items:center;height:23px;padding:0 7px;border-radius:999px;background:#fff7e8;color:#b97818;font-size:9px;font-weight:900;
}
/* text option editor */
.poll-option-edit-row.text-mode{grid-template-columns:30px minmax(0,1fr);gap:9px;align-items:center}
.poll-option-edit-row.text-mode>.option-number{width:26px;height:26px;border-radius:8px;background:#f3f6fa;color:#71849c;font-size:10px}
.poll-option-edit-row.text-mode .poll-option-text-input{height:42px;padding:0 12px;border-radius:11px;font-size:11.5px}
.poll-option-edit-row.text-mode .poll-option-text-input::placeholder{color:#a1acb9}

.poll-option-list.image-poll-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.image-poll-grid .poll-option-btn{padding:7px;border-radius:14px}.image-poll-grid .poll-option-btn.selected{border-color:#b9d8f7;background:#fbfdff;box-shadow:0 0 0 1px rgba(74,144,226,.035)}.poll-option-image-wrap{position:relative;display:block;overflow:hidden;width:100%;height:210px;border-radius:10px;background:#f4f7fa}.poll-option-image{width:100%;height:100%;object-fit:contain;display:block}.image-poll-grid .poll-option-bottom{padding:1px 1px 0}.poll-image-labels,.poll-option-badges{position:absolute;z-index:2;display:flex;align-items:center;gap:6px}.poll-image-labels{left:9px;top:9px}.poll-option-badges{right:9px;top:9px}.poll-image-number,.poll-choice-badge{display:grid;place-items:center;min-width:25px;height:25px;padding:0 7px;border-radius:8px;background:rgba(255,255,255,.93);box-shadow:0 4px 12px rgba(23,38,58,.10);color:#335d8e;font-size:9.5px;font-weight:900}.poll-choice-badge{display:none}.poll-option-btn.selected .poll-choice-badge{display:grid}.poll-winner-crown{display:none}.poll-option-btn.winner .poll-winner-crown{display:inline}.audio-poll-grid{grid-template-columns:1fr;gap:8px}.video-poll-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.audio-poll-grid .poll-option-btn{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:9px 11px;border-radius:13px}.audio-poll-grid .poll-option-btn.selected{border-color:#c5ddf6;background:#f9fcff;box-shadow:0 0 0 1px rgba(74,144,226,.03)}.audio-poll-grid .poll-media-card{display:flex;align-items:center;gap:10px;min-width:0;width:100%}.audio-poll-grid .poll-media-card audio{min-width:0;width:100%;height:36px}.audio-poll-grid .poll-media-number{display:grid;place-items:center;width:28px;height:28px;flex:0 0 28px;border-radius:8px;background:#f0f5fb;color:#4a7caf;font-size:10px;font-weight:900}.audio-poll-grid .poll-option-bottom{display:flex;align-items:center;gap:8px;width:auto;min-width:0}.audio-poll-grid .text-option-label-group{min-width:0}.audio-poll-grid .poll-option-text{max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:850}.audio-poll-grid .poll-result-meta{min-width:auto}.poll-media-card{display:flex;align-items:center;gap:10px;width:100%}.poll-media-card audio{width:100%;height:38px}.poll-media-number{display:grid;place-items:center;width:28px;height:28px;flex:0 0 28px;border-radius:8px;background:#f0f5fb;color:#4a7caf;font-size:10px;font-weight:900}.video-poll-grid .poll-option-btn{display:flex;flex-direction:column;align-items:stretch;gap:0;padding:7px;border-radius:14px;overflow:hidden}.video-poll-grid .poll-option-btn.selected{border-color:#bdd9f6;background:#fbfdff;box-shadow:0 0 0 1px rgba(74,144,226,.03)}.video-poll-grid .poll-media-card.video{position:relative;display:block;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:10px;background:#10151c}.video-poll-grid .poll-media-number{position:absolute;z-index:3;left:9px;top:9px;background:rgba(255,255,255,.94);box-shadow:0 4px 12px rgba(23,38,58,.10)}.video-poll-grid .poll-choice-badge{position:absolute;z-index:3;right:9px;top:9px;display:none}.video-poll-grid .poll-option-btn.selected .poll-choice-badge{display:grid}.poll-video-frame,.poll-video-native{display:block;width:100%;height:100%;border:0;border-radius:10px;background:#10151c}.poll-video-open{display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:10px;background:#f5f7fa;color:#4e6482;text-decoration:none;font-size:11px;font-weight:850}.video-poll-grid .poll-option-bottom{display:flex;align-items:center;gap:8px;padding:8px 2px 2px;min-height:30px}.video-poll-grid .poll-option-text{font-weight:850}.video-poll-grid .poll-result-meta{margin-left:auto;display:flex;align-items:center;gap:5px;white-space:nowrap}.video-poll-grid .poll-count,.video-poll-grid .poll-percentage{font-size:10px;font-weight:900;color:#5f7188}


.schedule-poll-list{grid-template-columns:1fr;gap:8px}.schedule-poll-list .poll-option-btn{min-height:58px}.schedule-poll-list .poll-option-text{font-weight:850;color:#344861}.schedule-poll-list .poll-option-btn.selected{border-color:#bcdcf6;background:#f8fcff}.schedule-poll-list .text-option-number-group .option-number{background:#eef7ff;color:#3c7fc9}
.poll-schedule-final{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:12px 0 2px;padding:13px 15px;border:1px solid #dbe8f3;border-radius:14px;background:#fbfdff;color:#53677e;font-size:13px;font-weight:750}.poll-schedule-final strong{color:#21344b}.poll-schedule-final.registered{border-color:#cdeee6;background:#f7fffc}.poll-schedule-final.tie{border-color:#eadffb;background:#fcfaff}.poll-schedule-final .poll-manage-btn{flex:0 0 auto}.poll-tie-confirm{margin-left:8px;font-size:11px;font-weight:850;color:#6f57d9}

/* ===== empty / loading ===== */
.poll-empty-state,.poll-loading-state,.poll-list-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#7e8b9c}
.poll-empty-state,.poll-loading-state{min-height:190px;padding:38px 20px 24px;background:transparent;border:0;border-radius:0}
.poll-list-empty{min-height:160px;padding:38px 8px 24px}
.poll-empty-icon{display:grid;place-items:center;width:38px;height:38px;margin-bottom:10px;border-radius:11px;background:linear-gradient(135deg,rgba(63,212,191,.10),rgba(75,141,248,.10) 55%,rgba(123,99,246,.08));box-shadow:inset 0 0 0 1px rgba(92,132,203,.08);color:#6b8fc8}.poll-empty-icon svg{display:block;width:18px;height:18px}
.poll-empty-title{margin:0;color:#465873;font-size:14px;font-weight:880}
.poll-empty-description{max-width:100%;margin:8px 0 0;color:#8895a8;font-size:11.5px;font-weight:650;line-height:1.6}
@media(min-width:981px){.poll-empty-description{white-space:nowrap}}

/* ===== common poll modal styles live in /WEB-INF/views/common/pollFormModal.jspf ===== */

@media(max-width:980px){.poll-empty-description{white-space:normal}.poll-page{width:min(100% - 32px,900px);margin-top:24px}.poll-page-content{grid-template-columns:1fr}.poll-side-panel{position:static}.poll-history-list{max-height:none}.poll-side-panel{order:-1}.poll-detail-card{order:2}.poll-tabs{margin-top:2px}}

@media(max-width:680px){
  .poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-btn{min-height:56px;padding:0 12px}
  .poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-bottom{grid-template-columns:28px minmax(0,1fr) auto;gap:8px}
  .poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-result-meta{min-width:0}
}
@media(max-width:680px){.video-poll-grid{grid-template-columns:1fr}.poll-page{width:calc(100% - 24px);margin:16px auto 48px}.poll-hero{align-items:flex-end;gap:16px;min-height:92px;padding:0 0 16px}.poll-hero h2{font-size:27px}.poll-hero p{font-size:11.5px}.poll-open-create-btn{height:36px;min-width:0;padding:0 12px}.poll-page-content{padding-top:10px}.poll-detail-guide{display:none}#activePollArea:not(.poll-empty-state):not(.poll-loading-state){padding:18px 0 0}.active-poll-question{font-size:20px}.poll-detail-title-row{flex-direction:column}.poll-detail-title-actions{width:100%;justify-content:flex-end}.poll-detail-summary-row{align-items:flex-start;flex-direction:column;gap:8px}.poll-detail-author{white-space:normal}.poll-options-head{align-items:flex-start;flex-direction:column;gap:5px}.poll-options-guide{text-align:left}.poll-option-list.image-poll-grid{grid-template-columns:1fr}.poll-option-image-wrap{height:220px}.audio-poll-grid .poll-option-btn{grid-template-columns:1fr;gap:6px}.audio-poll-grid .poll-option-bottom{padding-left:38px;justify-content:space-between;width:100%}.audio-poll-grid .poll-option-text{max-width:none}}
@media(max-width:460px){.poll-hero{display:block}.poll-hero-actions{margin-top:14px}.poll-open-create-btn{width:100%}.poll-tabs{overflow-x:auto}.poll-tab{flex:1}.poll-option-bottom{grid-template-columns:auto minmax(0,1fr)}.poll-result-meta{grid-column:2;justify-content:flex-start;flex-wrap:wrap}.poll-option-image-wrap{height:195px}}

/* ===== mobile final regression ===== */
@media(max-width:680px){
  .poll-page{width:calc(100% - 20px);margin:12px auto 36px}
  .poll-hero{display:block;min-height:0;padding:0 0 14px}
  .poll-eyebrow{margin-bottom:7px}
  .poll-hero h2{font-size:25px;line-height:1.18}
  .poll-hero p{margin-top:6px;font-size:11px;line-height:1.45}
  .poll-hero-actions{margin-top:12px;padding:0}
  .poll-open-create-btn{width:100%;height:38px}

  .poll-page-content{gap:10px;padding-top:8px}
  /* Mobile flow: selected poll detail first, poll list below it. */
  .poll-detail-card{order:1}
  .poll-side-panel{order:2;position:static;margin-top:0}
  .poll-tabs{height:44px;gap:0}
  .poll-tab{flex:1;height:44px;font-size:12px}
  .poll-history-list{max-height:228px;padding-top:4px;overflow-y:auto;overscroll-behavior:contain}
  .poll-history-item{padding:13px 8px 12px 10px}
  .poll-history-item.active:before{top:10px;bottom:10px}
  .poll-list-title{font-size:13px}
  .poll-list-subrow{margin-top:6px;flex-wrap:wrap;font-size:10px}
  .poll-list-meta{margin-top:5px}

  .poll-detail-header{height:42px}
  .poll-detail-header h3{font-size:13px}
  #activePollArea:not(.poll-empty-state):not(.poll-loading-state){padding-top:14px}
  .poll-detail-head{padding-bottom:12px}
  .poll-detail-title-row{gap:10px;margin-bottom:10px}
  .active-poll-question{font-size:19px;line-height:1.35;overflow-wrap:anywhere}
  .poll-detail-title-actions{width:100%;justify-content:flex-start;flex-wrap:wrap}
  .poll-manage-btn{height:32px}
  .poll-detail-summary{gap:5px}
  .poll-summary-chip{min-height:27px;padding:0 8px}
  .poll-detail-author{line-height:1.5}

  .poll-options-section{padding-top:11px}
  .poll-options-head{margin-bottom:9px}
  .poll-option-list{gap:8px}
  .poll-option-btn{max-width:100%}
  .poll-option-text{overflow-wrap:anywhere}
  .poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-btn{min-height:54px;padding:8px 10px}
  .poll-option-list:not(.image-poll-grid):not(.audio-poll-grid):not(.video-poll-grid) .poll-option-bottom{width:100%;grid-template-columns:28px minmax(0,1fr) auto;gap:7px}
  .schedule-poll-list .poll-option-btn{min-height:54px}
  .schedule-poll-list .poll-option-text{line-height:1.45}

  .image-poll-grid .poll-option-btn{min-width:0}
  .poll-option-image-wrap{height:210px}

  .audio-poll-grid .poll-option-btn{grid-template-columns:1fr;padding:9px 10px}
  .audio-poll-grid .poll-media-card{gap:8px}
  .audio-poll-grid .poll-media-card audio{min-width:0;width:100%;max-width:100%}
  .audio-poll-grid .poll-option-bottom{padding-left:36px;gap:6px;flex-wrap:wrap}
  .audio-poll-grid .poll-option-text{max-width:100%}

  .video-poll-grid{grid-template-columns:1fr}
  .video-poll-grid .poll-option-bottom{min-width:0}
  .video-poll-grid .poll-option-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .poll-schedule-final{align-items:flex-start;flex-direction:column;gap:9px;padding:12px;font-size:11.5px;line-height:1.5}
  .poll-schedule-final .poll-manage-btn{width:100%}
  .poll-tie-confirm{display:block;margin:4px 0 0}
}
@media(max-width:420px){
  .poll-page{width:calc(100% - 16px)}
  .poll-history-list{max-height:210px}
  .poll-summary-chip{font-size:9.5px}
  .poll-option-image-wrap{height:190px}
  .poll-result-meta{flex-wrap:wrap}
}

</style>

</head>
<body class="poll-page-body">
<jsp:include page="/WEB-INF/views/common/header.jsp"/>
<main class="poll-page">
  <section class="poll-hero">
    <div class="poll-hero-copy">
      <div class="poll-eyebrow">
        <span class="poll-section-icon" aria-hidden="true">&#128202;</span>
        <span id="pollScopeBadge" class="poll-scope-badge">투표</span>
      </div>
      <div class="poll-hero-title-row">
        <span class="poll-hero-icon" aria-hidden="true">✓</span>
        <div>
          <h2 id="pageTitle">투표</h2>
          <p id="pageDescription">구성원의 의견을 한곳에서 모으고 결정합니다.</p>
        </div>
      </div>
    </div>
    <div class="poll-hero-actions">
      <c:if test="${not projectReadOnly}">
        <button type="button" class="poll-open-create-btn" onclick="openPollCreateModal()">+ 투표 만들기</button>
      </c:if>
    </div>
  </section>

  <div class="poll-page-content">
    <section class="poll-detail-card">
      <div class="poll-detail-header">
        <h3>투표 상세</h3>
        <span class="poll-detail-guide">목록에서 투표를 선택해 참여하거나 결과를 확인하세요.</span>
      </div>
      <div id="activePollArea" class="poll-loading-state">
        <span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5V14m5 4.5V10m5 8.5V6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 18.5h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
        <p class="poll-empty-title">투표를 불러오는 중입니다.</p>
      </div>
    </section>

    <aside class="poll-side-panel">
      <div class="poll-tabs" role="tablist" aria-label="투표 목록 구분">
        <button type="button" id="activePollTab" class="poll-tab active" role="tab" aria-selected="true" onclick="switchPollTab('active')">진행 중 <span id="activePollCount" class="poll-list-count">0</span></button>
        <button type="button" id="pastPollTab" class="poll-tab" role="tab" aria-selected="false" onclick="switchPollTab('past')">지난 투표 <span id="pastPollCount" class="poll-list-count">0</span></button>
      </div>
      <div id="activePollPanel" class="poll-tab-content active" role="tabpanel"><div id="activePollList" class="poll-history-list"><div class="poll-list-empty"><span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5V14m5 4.5V10m5 8.5V6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 18.5h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><p class="poll-empty-title">진행 중인 투표를 불러오는 중입니다.</p></div></div></div>
      <div id="pastPollPanel" class="poll-tab-content" role="tabpanel"><div id="pastPollList" class="poll-history-list"><div class="poll-list-empty"><span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6.5 7.5h11M6.5 12h8M6.5 16.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="1.6"/></svg></span><p class="poll-empty-title">지난 투표를 불러오는 중입니다.</p></div></div></div>
    </aside>
  </div>

  <%@ include file="/WEB-INF/views/common/pollFormModal.jspf" %>

  <div id="pollExtendModal" class="poll-modal" aria-hidden="true">
    <div class="poll-modal-backdrop" onclick="closePollExtendModal()"></div>
    <div class="poll-modal-dialog poll-extend-dialog" role="dialog" aria-modal="true">
      <div class="poll-modal-body">
        <div class="poll-modal-header"><h3>투표 기간 연장</h3><button type="button" class="poll-modal-close" onclick="closePollExtendModal()">×</button></div>
        <div class="poll-form-row"><label>기존 마감</label><div id="pollPrevDeadline" class="poll-static-value"></div></div>
        <div class="poll-form-row"><label>새 마감</label><div class="poll-deadline-grid"><input id="pollExtendDate" type="date" class="poll-input"><div class="poll-time-group"><select id="pollExtendHour" class="poll-input poll-time-select"></select><span class="poll-time-colon">:</span><select id="pollExtendMinute" class="poll-input poll-time-select"></select></div></div></div>
        <div class="poll-form-actions"><button type="button" class="poll-create-btn" onclick="submitPollExtend()">연장하기</button></div>
      </div>
    </div>
  </div>
</main>
<jsp:include page="/WEB-INF/views/common/footer.jsp"/>

<script>
const params=new URLSearchParams(window.location.search);
const rawScope=String(params.get('scope')||'WORKSPACE').toUpperCase();
const scope=rawScope==='PROJECT'?'PROJECT':'WORKSPACE';
const wsId=params.get('wsId');
const projId=params.get('projId');
const projectReadOnly=${projectReadOnly eq true ? 'true' : 'false'};
const requestedPollId=params.get('pollId');
let allPolls=[];
let pendingVoteOptionId=null;
let selectedPollId=null;
let editingPollId=null;
let editingCanEditOptions=true;
let globalOptionType='TEXT';
let pollModalReturnFocus=null;

document.addEventListener('DOMContentLoaded',function(){
    initializePollPage();
    initializeDeadlineDefaults();
    addPollOptionRow();
    addPollOptionRow();
    ['pollEndDateInput','pollEndHourInput','pollEndMinuteInput'].forEach(function(id){
        const el=document.getElementById(id);
        if(el)el.addEventListener('change',handlePollDeadlineChange);
    });
    loadPollList(requestedPollId);
});













function openPollCreateModal(){
    if(editingPollId){
        resetCreateForm();
    }
    openPollFormModal();
}

function openPollFormModal(){
    const modal=document.getElementById('pollFormModal');
    if(!modal)return;
    pollModalReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    modal.inert=false;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('poll-modal-open');
    updateImageEditorLayout();
    window.setTimeout(function(){
        const first=modal.querySelector('#pollQuestionInput, button, input, select');
        if(first instanceof HTMLElement)first.focus();
    },0);
}

function closePollFormModal() {
    const modal = document.getElementById('pollFormModal');
    if (!modal) return;

    // null 처리 전에 복귀할 요소를 별도 변수에 보관
    const returnFocus = pollModalReturnFocus;
    pollModalReturnFocus = null;

    const focused = document.activeElement;
    if (focused instanceof HTMLElement && modal.contains(focused)) {
        focused.blur();
    }

    modal.classList.remove('open');
    modal.inert = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('poll-modal-open');

    // 요소가 실제로 존재하고 focus 함수가 있을 때만 복귀
    window.setTimeout(function () {
        if (
            returnFocus instanceof HTMLElement &&
            document.contains(returnFocus) &&
            typeof returnFocus.focus === 'function'
        ) {
            returnFocus.focus();
        }
    }, 0);
}

document.addEventListener('keydown',function(event){
    if(event.key!=='Escape')return;
    const extendModal=document.getElementById('pollExtendModal');
    if(extendModal&&extendModal.classList.contains('open')){
        closePollExtendModal();
        return;
    }
    const formModal=document.getElementById('pollFormModal');
    if(formModal&&formModal.classList.contains('open'))closePollFormModal();
});

function initializePollPage(){
    const isProject=scope==='PROJECT';
    document.getElementById('pageTitle').innerText=isProject?'프로젝트 투표':'그룹 투표';
    document.getElementById('pageDescription').innerText=isProject?'프로젝트의 의견을 한곳에서 모으고 결정합니다.':'그룹 구성원의 의견을 한곳에서 모으고 결정합니다.';
    const badge=document.getElementById('pollScopeBadge');
    if(badge)badge.innerText='투표';
}


function initializeDeadlineDefaults(){
    const date=new Date();
    date.setDate(date.getDate()+1);
    document.getElementById('pollEndDateInput').value=formatDateInput(date);

    const hour=document.getElementById('pollEndHourInput');
    const minute=document.getElementById('pollEndMinuteInput');
    if(!hour||!minute)return;
    hour.innerHTML='';
    minute.innerHTML='';
    for(let h=0;h<24;h++){const v=String(h).padStart(2,'0');hour.insertAdjacentHTML('beforeend','<option value="'+v+'" '+(v==='18'?'selected':'')+'>'+v+'</option>');}
    for(let m=0;m<60;m+=10){const v=String(m).padStart(2,'0');minute.insertAdjacentHTML('beforeend','<option value="'+v+'" '+(v==='00'?'selected':'')+'>'+v+'</option>');}
    if(typeof window.syncPollDeadlinePicker==='function')window.syncPollDeadlinePicker();
}

function buildScopeQuery(){
    let q='scope='+encodeURIComponent(scope)+'&wsId='+encodeURIComponent(wsId||'');
    if(scope==='PROJECT')q+='&projId='+encodeURIComponent(projId||'');
    return q;
}

const SCHEDULE_OPTION_PREFIX='@MOYO_SCHEDULE@|';
let schedulePickerTarget=null;
let scheduleDateView=null;
let scheduleDateMenu=null;
let scheduleTimeMenu=null;
let scheduleTimeState={meridiem:'AM',hour12:9,minute:0};

function parseScheduleOptionText(value){
    const text=String(value||'');
    if(!text.startsWith(SCHEDULE_OPTION_PREFIX))return null;
    const parts=text.substring(SCHEDULE_OPTION_PREFIX.length).split('|');
    if(parts.length<3)return null;
    return {date:parts[0]||'',startTime:parts[1]||'',endTime:parts[2]||''};
}
function serializeScheduleOption(date,startTime,endTime){
    return SCHEDULE_OPTION_PREFIX+date+'|'+startTime+'|'+endTime;
}
function formatScheduleDateLabel(value){
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
    if(!m)return String(value||'');
    const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    if(Number.isNaN(d.getTime()))return value;
    return value+' ('+['일','월','화','수','목','금','토'][d.getDay()]+')';
}
function formatScheduleOptionLabel(value,index){
    const schedule=parseScheduleOptionText(value);
    if(!schedule)return String(value||('후보 '+(index+1)));
    return formatScheduleDateLabel(schedule.date)+' · '+schedule.startTime+' ~ '+schedule.endTime;
}
function scheduleDateValue(input){return input?String(input.dataset.value||''):'';}
function markScheduleRowEdited(input){
    const row=input&&input.closest?input.closest('.poll-option-edit-row.schedule-mode'):null;
    if(row)row.dataset.scheduleUserEdited='true';
}
function setScheduleDateValue(input,value,markEdited){
    if(!input)return;
    if(markEdited!==false)markScheduleRowEdited(input);
    input.dataset.value=value||'';
    input.value=value?formatScheduleDateLabel(value):'';
    validateScheduleRow(input.closest('.poll-option-edit-row'));
}
function setScheduleTimeValue(input,value,markEdited){
    if(!input)return;
    if(markEdited!==false)markScheduleRowEdited(input);
    const m=/^(\d{2}):(\d{2})$/.exec(String(value||''));
    if(!m){input.dataset.value='';input.value='';validateScheduleRow(input.closest('.poll-option-edit-row'));return;}
    const h=Number(m[1]),min=Number(m[2]);
    input.dataset.value=String(h).padStart(2,'0')+':'+String(min).padStart(2,'0');
    input.value=(h>=12?'오후 ':'오전 ')+String(h%12||12).padStart(2,'0')+':'+String(min).padStart(2,'0');
    validateScheduleRow(input.closest('.poll-option-edit-row'));
}
function pollDeadlineDateTime(){
    const date=document.getElementById('pollEndDateInput')?.value||'';
    const hour=document.getElementById('pollEndHourInput')?.value||'';
    const minute=document.getElementById('pollEndMinuteInput')?.value||'';
    if(!date||hour===''||minute==='')return null;
    const dt=new Date(date+'T'+hour+':'+minute+':00');
    return Number.isNaN(dt.getTime())?null:dt;
}
function scheduleStartDateTime(row){
    if(!row)return null;
    const date=row.querySelector('.poll-schedule-date')?.dataset.value||'';
    const time=row.querySelector('.poll-schedule-start')?.dataset.value||'';
    if(!date||!time)return null;
    const dt=new Date(date+'T'+time+':00');
    return Number.isNaN(dt.getTime())?null:dt;
}
function scheduleDefaultWindow(){
    const deadline=pollDeadlineDateTime();
    const base=deadline?new Date(deadline):new Date();
    if(!deadline){base.setDate(base.getDate()+1);base.setHours(18,0,0,0);}
    const start=new Date(base.getTime()+60*60*1000);
    const end=new Date(start.getTime()+60*60*1000);
    return {date:formatDateInput(start),startTime:String(start.getHours()).padStart(2,'0')+':'+String(start.getMinutes()).padStart(2,'0'),endTime:String(end.getHours()).padStart(2,'0')+':'+String(end.getMinutes()).padStart(2,'0')};
}
function applyScheduleDefaultWindow(row){
    if(!row)return;
    const values=scheduleDefaultWindow();
    row.dataset.scheduleUserEdited='false';
    setScheduleDateValue(row.querySelector('.poll-schedule-date'),values.date,false);
    setScheduleTimeValue(row.querySelector('.poll-schedule-start'),values.startTime,false);
    setScheduleTimeValue(row.querySelector('.poll-schedule-end'),values.endTime,false);
    row.dataset.scheduleUserEdited='false';
}
function refreshUntouchedScheduleDefaults(){
    document.querySelectorAll('#pollOptionInputs .poll-option-edit-row.schedule-mode').forEach(function(row){
        if(row.dataset.scheduleUserEdited!=='true')applyScheduleDefaultWindow(row);
    });
}
function handlePollDeadlineChange(){
    refreshUntouchedScheduleDefaults();
    validateAllScheduleRows();
}
function validateScheduleRow(row){
    if(!row||!row.classList.contains('schedule-mode'))return true;
    const start=row.querySelector('.poll-schedule-start')?.dataset.value||'';
    const end=row.querySelector('.poll-schedule-end')?.dataset.value||'';
    const error=row.querySelector('.poll-schedule-error');
    let message='';
    if(start&&end&&start>=end){
        message='종료 시간은 시작 시간보다 늦어야 합니다.';
    }else{
        const deadline=pollDeadlineDateTime();
        const scheduleStart=scheduleStartDateTime(row);
        if(deadline&&scheduleStart&&scheduleStart<=deadline){
            message='후보 일정은 투표 마감 이후로 설정해주세요.';
        }
    }
    row.classList.toggle('has-schedule-error',!!message);
    if(error)error.textContent=message;
    return !message;
}
function validateAllScheduleRows(){
    let valid=true;
    document.querySelectorAll('#pollOptionInputs .poll-option-edit-row.schedule-mode').forEach(function(row){
        if(!validateScheduleRow(row))valid=false;
    });
    return valid;
}
function closeSchedulePickers(){if(scheduleDateMenu)scheduleDateMenu.hidden=true;if(scheduleTimeMenu)scheduleTimeMenu.hidden=true;schedulePickerTarget=null;}
function positionSchedulePicker(menu,input,width,height){
    const r=input.getBoundingClientRect();
    let left=Math.min(Math.max(10,r.left),window.innerWidth-width-10),top=r.bottom+5;
    if(top+height>window.innerHeight-10)top=Math.max(10,r.top-height-5);
    menu.style.left=left+'px';menu.style.top=top+'px';
}
function ensureScheduleDateMenu(){
    if(scheduleDateMenu)return scheduleDateMenu;
    scheduleDateMenu=document.createElement('div');
    scheduleDateMenu.className='moyo-quick-picker-menu moyo-quick-date-picker-menu';scheduleDateMenu.hidden=true;
    scheduleDateMenu.addEventListener('click',function(e){e.stopPropagation();const b=e.target.closest('button');if(!b||!schedulePickerTarget)return;if(b.dataset.nav){scheduleDateView.setMonth(scheduleDateView.getMonth()+Number(b.dataset.nav));renderScheduleDateMenu();return;}if(b.dataset.date){setScheduleDateValue(schedulePickerTarget,b.dataset.date);closeSchedulePickers();return;}if(b.dataset.action==='today'){const n=new Date();setScheduleDateValue(schedulePickerTarget,formatDateInput(n));closeSchedulePickers();}});
    document.body.appendChild(scheduleDateMenu);return scheduleDateMenu;
}
function renderScheduleDateMenu(){
    const menu=ensureScheduleDateMenu(),selected=schedulePickerTarget?scheduleDateValue(schedulePickerTarget):'',first=new Date(scheduleDateView.getFullYear(),scheduleDateView.getMonth(),1),start=new Date(scheduleDateView.getFullYear(),scheduleDateView.getMonth(),1-first.getDay()),today=startOfLocalDay(new Date());let days='';
    for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);d.setHours(0,0,0,0);const val=formatDateInput(d),muted=d.getMonth()!==scheduleDateView.getMonth(),isToday=val===formatDateInput(today),isSel=val===selected;days+='<button type="button" class="moyo-quick-date-picker-day'+(muted?' is-muted':'')+(isToday?' is-today':'')+(isSel?' is-selected':'')+'" data-date="'+val+'">'+d.getDate()+'</button>';}
    menu.innerHTML='<div class="moyo-quick-date-picker-head"><div class="moyo-quick-date-picker-title">'+scheduleDateView.getFullYear()+'년 '+(scheduleDateView.getMonth()+1)+'월</div><div class="moyo-quick-date-picker-nav"><button type="button" data-nav="-1">‹</button><button type="button" data-nav="1">›</button></div></div><div class="moyo-quick-date-picker-weekdays">'+['일','월','화','수','목','금','토'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="moyo-quick-date-picker-days">'+days+'</div><div class="moyo-quick-date-picker-foot"><button type="button" class="moyo-quick-date-picker-today" data-action="today">오늘</button></div>';
}
function openScheduleDatePicker(input){
    closeSchedulePickers();schedulePickerTarget=input;const current=parsePollDateValue(scheduleDateValue(input));const n=current||new Date();scheduleDateView=new Date(n.getFullYear(),n.getMonth(),1);renderScheduleDateMenu();const menu=ensureScheduleDateMenu();positionSchedulePicker(menu,input,248,288);menu.hidden=false;
}
function ensureScheduleTimeMenu(){
    if(scheduleTimeMenu)return scheduleTimeMenu;
    scheduleTimeMenu=document.createElement('div');scheduleTimeMenu.className='moyo-quick-picker-menu moyo-quick-time-picker-menu';scheduleTimeMenu.hidden=true;
    scheduleTimeMenu.addEventListener('click',function(e){e.stopPropagation();const b=e.target.closest('button');if(!b||!schedulePickerTarget)return;if(b.dataset.meridiem)scheduleTimeState.meridiem=b.dataset.meridiem;if(b.dataset.hour)scheduleTimeState.hour12=Number(b.dataset.hour);if(b.dataset.minute)scheduleTimeState.minute=Number(b.dataset.minute);if(b.dataset.action==='now'){const n=new Date();scheduleTimeState={meridiem:n.getHours()>=12?'PM':'AM',hour12:n.getHours()%12||12,minute:Math.floor(n.getMinutes()/5)*5};}applyScheduleTime();renderScheduleTimeMenu();});
    document.body.appendChild(scheduleTimeMenu);return scheduleTimeMenu;
}
function applyScheduleTime(){const h=(scheduleTimeState.hour12%12)+(scheduleTimeState.meridiem==='PM'?12:0);setScheduleTimeValue(schedulePickerTarget,String(h).padStart(2,'0')+':'+String(scheduleTimeState.minute).padStart(2,'0'));}
function renderScheduleTimeMenu(){
    const menu=ensureScheduleTimeMenu(),hours=Array.from({length:12},(_,i)=>i+1).map(h=>'<button type="button" data-hour="'+h+'" class="'+(scheduleTimeState.hour12===h?'is-selected':'')+'">'+String(h).padStart(2,'0')+'</button>').join(''),mins=Array.from({length:12},(_,i)=>i*5).map(m=>'<button type="button" data-minute="'+m+'" class="'+(scheduleTimeState.minute===m?'is-selected':'')+'">'+String(m).padStart(2,'0')+'</button>').join('');
    menu.innerHTML='<div class="moyo-quick-time-picker-head"><div class="moyo-quick-time-picker-title">시간 선택</div><button type="button" class="moyo-quick-time-picker-now" data-action="now">현재 시간</button></div><div class="moyo-quick-time-picker-ampm"><button type="button" data-meridiem="AM" class="'+(scheduleTimeState.meridiem==='AM'?'is-selected':'')+'">오전</button><button type="button" data-meridiem="PM" class="'+(scheduleTimeState.meridiem==='PM'?'is-selected':'')+'">오후</button></div><div class="moyo-quick-time-picker-section"><div class="moyo-quick-time-picker-label">시</div><div class="moyo-quick-time-picker-grid">'+hours+'</div></div><div class="moyo-quick-time-picker-section"><div class="moyo-quick-time-picker-label">분 · 5분 단위</div><div class="moyo-quick-time-picker-grid">'+mins+'</div></div>';
}
function openScheduleTimePicker(input){
    closeSchedulePickers();schedulePickerTarget=input;const raw=String(input.dataset.value||'09:00'),m=/^(\d{2}):(\d{2})$/.exec(raw),h=m?Number(m[1]):9,min=m?Number(m[2]):0;scheduleTimeState={meridiem:h>=12?'PM':'AM',hour12:h%12||12,minute:Math.floor(min/5)*5};renderScheduleTimeMenu();const menu=ensureScheduleTimeMenu();positionSchedulePicker(menu,input,268,276);menu.hidden=false;
}

document.addEventListener('click',function(e){if(!e.target.closest('.moyo-quick-picker-menu')&&!e.target.closest('.poll-schedule-field'))closeSchedulePickers();});

function addPollOptionRow(initialData){
    const list=document.getElementById('pollOptionInputs');
    const row=document.createElement('div');
    const text=initialData?(initialData.text||initialData.TEXT||''):'';
    const imagePath=initialData?(initialData.imagePath||initialData.IMAGE_PATH||''):'';
    const storedType=initialData
        ? String(initialData.optionType||initialData.OPTION_TYPE||'').toUpperCase()
        : '';

    // 과거 BOTH 데이터도 이미지 선택지로 취급
    if(initialData && ['SCHEDULE','IMAGE','AUDIO','VIDEO'].includes(storedType)){ globalOptionType=storedType; } else if(initialData && imagePath){ globalOptionType='IMAGE'; }

    row.className='poll-option-edit-row '+globalOptionType.toLowerCase()+'-mode';
    row.dataset.optionId=initialData?(initialData.optionId||initialData.OPTION_ID||''):'';
    row.dataset.existingImagePath=imagePath||'';
    row.innerHTML=
        '<span class="option-number"></span>'+
        '<div class="poll-option-edit-main">'+
            '<input class="poll-input poll-option-text-input" placeholder="선택지 내용" value="'+escapeHtml(globalOptionType==='TEXT'?text:'')+'">'+
            '<div class="poll-option-schedule-block"><div class="poll-schedule-grid">'+
              '<div class="poll-schedule-field poll-schedule-date-field"><input type="text" class="poll-input poll-schedule-date" readonly placeholder="날짜 선택" onclick="openScheduleDatePicker(this)"><button type="button" class="poll-schedule-trigger" onclick="openScheduleDatePicker(this.previousElementSibling)" aria-label="날짜 선택"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 3.8v3.4M16 3.8v3.4M4 9.2h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></div>'+
              '<div class="poll-schedule-field"><input type="text" class="poll-input poll-schedule-start" readonly placeholder="시작 시간" onclick="openScheduleTimePicker(this)"><button type="button" class="poll-schedule-trigger" onclick="openScheduleTimePicker(this.previousElementSibling)" aria-label="시작 시간 선택"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.8v4.6l3 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></div>'+
              '<span class="poll-schedule-sep">~</span>'+
              '<div class="poll-schedule-field"><input type="text" class="poll-input poll-schedule-end" readonly placeholder="종료 시간" onclick="openScheduleTimePicker(this)"><button type="button" class="poll-schedule-trigger" onclick="openScheduleTimePicker(this.previousElementSibling)" aria-label="종료 시간 선택"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.8v4.6l3 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></div>'+
            '</div><div class="poll-schedule-error" role="status" aria-live="polite"></div></div>'+
            '<div class="poll-option-image-block'+(globalOptionType==='IMAGE'&&imagePath?' has-image':'')+'">'+
                '<label class="poll-file-label">'+
                    '<div class="poll-upload-tile-content">'+
                        '<span class="poll-upload-plus">＋</span>'+ 
                        '<strong>이미지 선택</strong>'+ 
                        '<span class="poll-upload-help">클릭하거나 이미지를<br>드래그하세요</span>'+ 
                    '</div>'+ 
                    '<input type="file" class="poll-option-image-input" accept="image/*" multiple onchange="handlePollOptionImageChange(this)">'+
                '</label>'+
                '<div class="poll-option-image-frame'+(globalOptionType==='IMAGE'&&imagePath?' visible':'')+'">'+
                    '<img class="poll-image-preview" '+(globalOptionType==='IMAGE'&&imagePath?'src="'+escapeHtml(imagePath)+'"':'')+' alt="미리보기">'+
                    '<button type="button" class="poll-option-image-remove" onclick="removePollOptionImage(this)" aria-label="이미지 제거">×</button>'+
                '</div>'+
                '<span class="poll-image-name">이미지 없음</span>'+
            '</div>'+
            '<div class="poll-option-audio-block">'+
              '<label class="poll-media-upload"><span class="poll-audio-upload-text">＋ 음악 파일 선택</span><span class="poll-audio-upload-help">클릭하거나 파일을 드래그하세요</span><input type="file" class="poll-option-audio-input" accept="audio/*" multiple onchange="handlePollOptionAudioChange(this)"></label>'+
              '<input class="poll-input poll-media-title" placeholder="음악 제목" value="">'+
              '<audio class="poll-audio-preview" controls preload="metadata"></audio>'+
            '</div>'+
            '<div class="poll-option-video-block">'+
              '<input class="poll-input poll-video-url" placeholder="YouTube, Vimeo 또는 직접 재생 가능한 영상 URL" value="">'+
            '</div>'+
        '</div>';

    list.appendChild(row);
    if(globalOptionType==='SCHEDULE'){
        const schedule=parseScheduleOptionText(text);
        if(schedule){
            row.dataset.scheduleUserEdited='true';
            setScheduleDateValue(row.querySelector('.poll-schedule-date'),schedule.date,false);
            setScheduleTimeValue(row.querySelector('.poll-schedule-start'),schedule.startTime,false);
            setScheduleTimeValue(row.querySelector('.poll-schedule-end'),schedule.endTime,false);
            row.dataset.scheduleUserEdited='true';
        }else{
            applyScheduleDefaultWindow(row);
        }
    }
    if(globalOptionType==='AUDIO' && initialData){
        const title=row.querySelector('.poll-option-audio-block .poll-media-title'); if(title)title.value=text||'';
        const audio=row.querySelector('.poll-audio-preview'); if(audio&&imagePath){audio.src=imagePath;audio.style.display='block';}
        const uploadText=row.querySelector('.poll-audio-upload-text'); if(uploadText&&text)uploadText.textContent=text;
        const audioBlock=row.querySelector('.poll-option-audio-block'); if(audioBlock)audioBlock.classList.toggle('has-audio',!!imagePath);
    }
    if(globalOptionType==='VIDEO' && initialData){
        const url=row.querySelector('.poll-video-url'); if(url)url.value=imagePath||'';
    }
    initializeOptionRowDrop(row);
    initializeAudioOptionRowDrop(row);
    updateOptionRows();
}

function updateImageEditorLayout(){
    const isImage=globalOptionType==='IMAGE';
    const isSchedule=globalOptionType==='SCHEDULE';
    const list=document.getElementById('pollOptionInputs');
    const dialog=document.querySelector('#pollFormModal .poll-modal-dialog');
    if(list){
        list.classList.toggle('image-edit-grid',isImage);
        list.classList.toggle('schedule-edit-list',isSchedule);
        if(!isSchedule)list.classList.remove('has-scroll');
    }
    if(dialog){
        dialog.classList.toggle('image-edit-mode',isImage);
        dialog.classList.toggle('text-edit-mode',!isImage);
    }
}

function applyGlobalOptionType(type,clearIncompatibleInputs){
    globalOptionType=['SCHEDULE','IMAGE','AUDIO','VIDEO'].includes(type)?type:'TEXT';
    updateImageEditorLayout();

    const input=document.querySelector('input[name="pollGlobalOptionType"][value="'+globalOptionType+'"]');
    if(input)input.checked=true;

    document.querySelectorAll('.poll-option-edit-row').forEach(function(row){
        row.classList.remove('text-mode','schedule-mode','image-mode','audio-mode','video-mode');
        row.classList.add(globalOptionType.toLowerCase()+'-mode');
        if(globalOptionType==='SCHEDULE'){
            const dateInput=row.querySelector('.poll-schedule-date');
            const startInput=row.querySelector('.poll-schedule-start');
            const endInput=row.querySelector('.poll-schedule-end');
            if(!dateInput?.dataset.value||!startInput?.dataset.value||!endInput?.dataset.value)applyScheduleDefaultWindow(row);
        }

        if(!clearIncompatibleInputs)return;
        if(globalOptionType==='TEXT'){
            const fileInput=row.querySelector('.poll-option-image-input');
            if(fileInput)fileInput.value='';
            row.dataset.existingImagePath='';
            removePollOptionImageFromRow(row);
        }else{
            const textInput=row.querySelector('.poll-option-text-input');
            if(textInput)textInput.value='';
        }
    });
}

function switchGlobalPollOptionType(type){
    applyGlobalOptionType(type,true);
}

function setGlobalOptionType(type){
    applyGlobalOptionType(type,false);
}

function removeLastPollOptionRow(){
    const rows=document.querySelectorAll('.poll-option-edit-row');
    if(rows.length<=2){alert('선택지는 최소 2개가 필요합니다.');return;}
    rows[rows.length-1].remove();
    updateOptionRows();
}

function updateOptionRows(){
    const rows=Array.from(document.querySelectorAll('.poll-option-edit-row'));
    rows.forEach(function(row,index){
        row.querySelector('.option-number').innerText=index+1;
        if(globalOptionType==='SCHEDULE')validateScheduleRow(row);
    });
    const list=document.getElementById('pollOptionInputs');
    if(list&&globalOptionType==='SCHEDULE')list.classList.toggle('has-scroll',rows.length>2);
    const minus=document.querySelector('.poll-remove-last');
    if(minus)minus.disabled=rows.length<=2;
}




function initializeOptionRowDrop(row){
    const block=row.querySelector('.poll-option-image-block');
    if(!block)return;

    ['dragenter','dragover'].forEach(function(name){
        block.addEventListener(name,function(event){
            if(globalOptionType!=='IMAGE')return;
            event.preventDefault();
            event.stopPropagation();
            block.classList.add('row-dragover');
        });
    });

    ['dragleave','drop'].forEach(function(name){
        block.addEventListener(name,function(event){
            if(globalOptionType!=='IMAGE')return;
            event.preventDefault();
            event.stopPropagation();
            block.classList.remove('row-dragover');
        });
    });

    block.addEventListener('drop',function(event){
        if(globalOptionType!=='IMAGE')return;
        const files=Array.from(event.dataTransfer.files||[]).filter(function(item){
            return item.type&&item.type.startsWith('image/');
        });
        if(files.length===0){alert('이미지 파일만 넣을 수 있습니다.');return;}
        assignImageFilesFromRow(row,files);
    });
}

function getLastPollOptionRow(){
    const rows=document.querySelectorAll('.poll-option-edit-row');
    return rows.length ? rows[rows.length-1] : null;
}

function isPollOptionRowEmpty(row){
    if(!row)return false;
    const input=row.querySelector('.poll-option-image-input');
    return !(input&&input.files&&input.files[0]) && !(row.dataset.existingImagePath||'');
}

function appendEmptyPollOptionRow(){
    addPollOptionRow();
    return getLastPollOptionRow();
}

function assignImageFilesFromRow(startRow,files){
    const images=files.filter(function(file){return file.type&&file.type.startsWith('image/');});
    if(images.length===0){alert('이미지 파일만 넣을 수 있습니다.');return;}

    setGlobalOptionType('IMAGE');
    const allRows=Array.from(document.querySelectorAll('.poll-option-edit-row'));
    const startIndex=Math.max(0,allRows.indexOf(startRow));
    const targets=[];

    // 사용자가 놓은 칸에는 첫 이미지를 적용하고,
    // 나머지는 뒤쪽의 빈 선택지부터 채운 뒤 부족한 만큼 자동 생성한다.
    targets.push(startRow||allRows[0]||appendEmptyPollOptionRow());
    allRows.slice(startIndex+1).forEach(function(row){
        if(isPollOptionRowEmpty(row))targets.push(row);
    });

    while(targets.length<images.length){
        targets.push(appendEmptyPollOptionRow());
    }

    images.forEach(function(file,index){setFileToOptionRow(targets[index],file);});
    updateOptionRows();
}


function setFileToOptionRow(row,file){
    if(!row||!file)return;
    const input=row.querySelector('.poll-option-image-input');
    if(!input)return;

    const transfer=new DataTransfer();
    transfer.items.add(file);
    input.files=transfer.files;
    handlePollOptionImageChange(input);
}

function handlePollOptionImageChange(input){
    const selectedFiles=Array.from(input.files||[]).filter(function(file){
        return file.type&&file.type.startsWith('image/');
    });
    const row=input.closest('.poll-option-edit-row');

    // 개별 선택 칸에서도 여러 장을 고르면 현재 칸부터 순서대로 배정한다.
    if(selectedFiles.length>1){
        assignImageFilesFromRow(row,selectedFiles);
        return;
    }

    const file=selectedFiles[0];
    const block=row.querySelector('.poll-option-image-block');
    const frame=row.querySelector('.poll-option-image-frame');
    const preview=row.querySelector('.poll-image-preview');
    const name=row.querySelector('.poll-image-name');

    if(preview.dataset.objectUrl){
        URL.revokeObjectURL(preview.dataset.objectUrl);
        delete preview.dataset.objectUrl;
    }

    if(!file){
        removePollOptionImageFromRow(row);
        return;
    }

    const objectUrl=URL.createObjectURL(file);
    preview.src=objectUrl;
    preview.dataset.objectUrl=objectUrl;
    frame.classList.add('visible');
    block.classList.add('has-image');
    name.innerText=file.name||'이미지 선택됨';
    row.dataset.existingImagePath='';
}

function removePollOptionImage(button){
    const row=button.closest('.poll-option-edit-row');
    removePollOptionImageFromRow(row);
}

function removePollOptionImageFromRow(row){
    const block=row.querySelector('.poll-option-image-block');
    const frame=row.querySelector('.poll-option-image-frame');
    const preview=row.querySelector('.poll-image-preview');
    const fileInput=row.querySelector('.poll-option-image-input');
    const name=row.querySelector('.poll-image-name');

    if(preview.dataset.objectUrl){
        URL.revokeObjectURL(preview.dataset.objectUrl);
        delete preview.dataset.objectUrl;
    }

    preview.removeAttribute('src');
    frame.classList.remove('visible');
    block.classList.remove('has-image');
    fileInput.value='';
    name.innerText='이미지 없음';
    row.dataset.existingImagePath='';
}

function audioTitleFromFileName(name){
    return String(name||'').replace(/\.[^.]+$/,'').trim();
}

function isAudioOptionRowEmpty(row){
    if(!row)return false;
    const input=row.querySelector('.poll-option-audio-input');
    return !(input&&input.files&&input.files[0]) && !(row.dataset.existingImagePath||'');
}

function setAudioFileToOptionRow(row,file){
    if(!row||!file)return;
    const input=row.querySelector('.poll-option-audio-input');
    if(!input)return;
    const transfer=new DataTransfer();
    transfer.items.add(file);
    input.files=transfer.files;
    previewSinglePollAudio(input,file);
}

function previewSinglePollAudio(input,file){
    const block=input.closest('.poll-option-audio-block');
    const audio=block.querySelector('.poll-audio-preview');
    const title=block.querySelector('.poll-media-title');
    if(audio.dataset.objectUrl){URL.revokeObjectURL(audio.dataset.objectUrl);delete audio.dataset.objectUrl;}
    if(!file){audio.removeAttribute('src');audio.style.display='none';return;}
    const objectUrl=URL.createObjectURL(file);
    audio.src=objectUrl;
    audio.dataset.objectUrl=objectUrl;
    audio.style.display='block';
    if(title) title.value=audioTitleFromFileName(file.name);
    const uploadText=block.querySelector('.poll-audio-upload-text');
    if(uploadText) uploadText.textContent=file.name;
    block.classList.add('has-audio');
}

function assignAudioFilesFromRow(startRow,files){
    const audios=files.filter(function(file){return file.type&&file.type.startsWith('audio/');});
    if(audios.length===0){alert('음악 파일만 넣을 수 있습니다.');return;}
    setGlobalOptionType('AUDIO');
    const allRows=Array.from(document.querySelectorAll('.poll-option-edit-row'));
    const startIndex=Math.max(0,allRows.indexOf(startRow));
    const targets=[];
    targets.push(startRow||allRows[0]||appendEmptyPollOptionRow());
    allRows.slice(startIndex+1).forEach(function(row){if(isAudioOptionRowEmpty(row))targets.push(row);});
    while(targets.length<audios.length)targets.push(appendEmptyPollOptionRow());
    audios.forEach(function(file,index){setAudioFileToOptionRow(targets[index],file);});
    updateOptionRows();
}

function handlePollOptionAudioChange(input){
    const files=Array.from(input.files||[]).filter(function(file){return file.type&&file.type.startsWith('audio/');});
    const row=input.closest('.poll-option-edit-row');
    if(files.length>1){assignAudioFilesFromRow(row,files);return;}
    previewSinglePollAudio(input,files[0]);
}

function initializeAudioOptionRowDrop(row){
    const block=row.querySelector('.poll-option-audio-block');
    if(!block)return;
    ['dragenter','dragover'].forEach(function(name){
        block.addEventListener(name,function(event){
            if(globalOptionType!=='AUDIO')return;
            event.preventDefault();event.stopPropagation();block.classList.add('audio-dragover');
        });
    });
    ['dragleave','drop'].forEach(function(name){
        block.addEventListener(name,function(event){
            if(globalOptionType!=='AUDIO')return;
            event.preventDefault();event.stopPropagation();block.classList.remove('audio-dragover');
        });
    });
    block.addEventListener('drop',function(event){
        if(globalOptionType!=='AUDIO')return;
        const files=Array.from(event.dataTransfer.files||[]).filter(function(file){return file.type&&file.type.startsWith('audio/');});
        if(files.length===0){alert('음악 파일만 넣을 수 있습니다.');return;}
        assignAudioFilesFromRow(row,files);
    });
}

async function uploadOptionAudio(file){ const fd=new FormData(); fd.append('media',file); const res=await fetch('/api/polls/option-media',{method:'POST',body:fd}); const result=await res.json(); if(!result||result.success===false) throw new Error(result&&result.message?result.message:'음악 업로드 실패'); return result.mediaPath; }

async function uploadOptionImage(file){
    if(!file)return null;
    const formData=new FormData();formData.append('image',file);
    const res=await fetch('/api/polls/option-image',{method:'POST',body:formData});
    const result=await res.json();
    if(!result||result.success===false)throw new Error(result&&result.message?result.message:'이미지 업로드 실패');
    return result.imagePath;
}

async function savePoll(){
    const question=document.getElementById('pollQuestionInput').value.trim();
    const endDate=document.getElementById('pollEndDateInput').value;
    const endHour=document.getElementById('pollEndHourInput').value;
    const endMinute=document.getElementById('pollEndMinuteInput').value;
    const rows=Array.from(document.querySelectorAll('.poll-option-edit-row'));

    if(!question){alert('질문을 입력해주세요.');return;}
    if(!endDate){alert('투표 마감일을 선택해주세요.');return;}

    try{
        const options=[];

        if(editingCanEditOptions){
            for(const row of rows){
                const type=globalOptionType;
                if(type==='SCHEDULE'){
                    const date=row.querySelector('.poll-schedule-date').dataset.value||'';
                    const startTime=row.querySelector('.poll-schedule-start').dataset.value||'';
                    const endTime=row.querySelector('.poll-schedule-end').dataset.value||'';
                    if(!date&&!startTime&&!endTime)continue;
                    if(!date||!startTime||!endTime){alert('일정 선택지의 날짜와 시간을 모두 선택해주세요.');return;}
                    if(!validateScheduleRow(row)){
                        const msg=row.querySelector('.poll-schedule-error')?.textContent||'일정 선택지를 확인해주세요.';
                        alert(msg);
                        return;
                    }
                    options.push({optionId:row.dataset.optionId||null,optionType:'SCHEDULE',scheduleDate:date,startTime:startTime,endTime:endTime,text:serializeScheduleOption(date,startTime,endTime),imagePath:null});
                }else if(type==='IMAGE'){
                    const file=row.querySelector('.poll-option-image-input').files[0];
                    let imagePath=row.dataset.existingImagePath||'';
                    if(file)imagePath=await uploadOptionImage(file);
                    if(!imagePath)continue;
                    options.push({optionId:row.dataset.optionId||null,optionType:'IMAGE',text:file&&file.name?file.name:'이미지 선택지',imagePath:imagePath});
                }else if(type==='AUDIO'){
                    const file=row.querySelector('.poll-option-audio-input').files[0];
                    let mediaPath=row.dataset.existingImagePath||'';
                    if(file)mediaPath=await uploadOptionAudio(file);
                    if(!mediaPath)continue;
                    const title=row.querySelector('.poll-option-audio-block .poll-media-title').value.trim() || (file?audioTitleFromFileName(file.name):'음악 선택지');
                    options.push({optionId:row.dataset.optionId||null,optionType:'AUDIO',text:title,imagePath:mediaPath});
                }else if(type==='VIDEO'){
                    const url=row.querySelector('.poll-video-url').value.trim();
                    if(!url)continue;
                    options.push({optionId:row.dataset.optionId||null,optionType:'VIDEO',text:'영상 '+(options.length+1),imagePath:url});
                }else{
                    const text=row.querySelector('.poll-option-text-input').value.trim();
                    if(!text)continue;
                    options.push({optionId:row.dataset.optionId||null,optionType:'TEXT',text:text,imagePath:null});
                }
            }

            if(options.length<2){alert('선택지는 2개 이상 입력해주세요.');return;}
        }

        const body={
            question:question,
            endDt:endDate+' '+endHour+':'+endMinute,
            showResultsYn:document.getElementById('pollShowResultsInput').checked?'Y':'N'
        };

        let url='/api/polls/create';

        if(editingPollId){
            url='/api/polls/update';
            body.pollId=editingPollId;
            if(editingCanEditOptions)body.options=options;
        }else{
            body.scope=scope;
            body.wsId=wsId;
            body.options=options;
            if(scope==='PROJECT')body.projId=projId;
        }

        const res=await fetch(url,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(body)
        });
        const responseText=await res.text();
        let result=null;
        try{ result=responseText?JSON.parse(responseText):null; }catch(ignore){}
        if(!res.ok){
            throw new Error(result&&result.message?result.message:('투표 생성 요청 실패 ('+res.status+')'));
        }

        if(!result||result.success===false){
            alert(result&&result.message==='LOGIN_REQUIRED'?'로그인이 필요합니다.':(result&&result.message?result.message:(editingPollId?'투표 수정에 실패했습니다.':'투표 생성에 실패했습니다.')));
            return;
        }

        const preferredId=editingPollId||result.pollId;
        resetCreateForm();
        closePollFormModal();
        await loadPollList(preferredId);
    }catch(err){
        console.error(err);
        alert(editingPollId?'투표 수정 중 오류가 발생했습니다.':'투표 생성 중 오류가 발생했습니다.');
    }
}

function resetCreateForm(){
    editingPollId=null;
    editingCanEditOptions=true;
    document.getElementById('pollFormTitle').innerText='투표 만들기';
    document.getElementById('pollSubmitButton').innerText='투표 생성';
    document.getElementById('pollQuestionInput').value='';
    document.getElementById('pollShowResultsInput').checked=false;
    document.getElementById('pollOptionInputs').innerHTML='';
    setGlobalOptionType('TEXT');
    addPollOptionRow();
    addPollOptionRow();
    initializeDeadlineDefaultsReset();
    setOptionInputsDisabled(false);
}

function cancelPollEdit(){
    resetCreateForm();
    closePollFormModal();
}

function setOptionInputsDisabled(disabled){
    document.querySelectorAll('#pollOptionInputs input,#pollOptionInputs button').forEach(function(el){
        el.disabled=disabled;
    });
    document.querySelectorAll('.poll-option-toolbar button,.global-option-type-switch input').forEach(function(el){
        el.disabled=disabled;
    });
}

async function startPollEdit(pollId){
    try{
        const res=await fetch('/api/polls/detail?pollId='+encodeURIComponent(pollId));
        const data=await res.json();

        if(!data||!data.canManage){
            alert('투표 작성자만 수정할 수 있습니다.');
            return;
        }

        editingPollId=data.pollId;
        editingCanEditOptions=!!data.canEditOptions;

        document.getElementById('pollFormTitle').innerText='투표 수정';
        document.getElementById('pollSubmitButton').innerText='수정 저장';
        document.getElementById('pollQuestionInput').value=data.question||'';
        document.getElementById('pollShowResultsInput').checked=String(data.showResultsYn||'N').toUpperCase()==='Y';

        const deadline=new Date(data.endDt);
        if(!Number.isNaN(deadline.getTime())){
            document.getElementById('pollEndDateInput').value=formatDateInput(deadline);
            document.getElementById('pollEndHourInput').value=String(deadline.getHours()).padStart(2,'0');
            document.getElementById('pollEndMinuteInput').value=String(Math.floor(deadline.getMinutes()/10)*10).padStart(2,'0');
            if(typeof window.syncPollDeadlinePicker==='function')window.syncPollDeadlinePicker();
        }

        const list=document.getElementById('pollOptionInputs');
        list.innerHTML='';

        const editOptions=Array.isArray(data.options)?data.options:[];
        const firstOption=editOptions.length>0?editOptions[0]:null;
        const firstType=firstOption
            ? String(firstOption.OPTION_TYPE||firstOption.optionType||'').toUpperCase()
            : '';
        const firstImagePath=firstOption
            ? (firstOption.IMAGE_PATH||firstOption.imagePath||'')
            : '';

        setGlobalOptionType(['SCHEDULE','IMAGE','AUDIO','VIDEO'].includes(firstType) ? firstType : ((firstType==='BOTH'||!!firstImagePath)?'IMAGE':'TEXT'));

        editOptions.forEach(function(option){addPollOptionRow(option);});
        while(list.children.length<2)addPollOptionRow();

        setOptionInputsDisabled(!editingCanEditOptions);
        openPollFormModal();
    }catch(err){
        console.error(err);
        alert('투표 정보를 불러오지 못했습니다.');
    }
}

async function deletePollItem(pollId){
    if(!confirm('이 투표를 삭제할까요?'))return;

    try{
        const res=await fetch('/api/polls/delete',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({pollId:pollId})
        });
        const result=await res.json();

        if(!result||result.success===false){
            alert(result&&result.message==='LOGIN_REQUIRED'?'로그인이 필요합니다.':(result&&result.message?result.message:'투표 삭제에 실패했습니다.'));
            return;
        }

        if(String(editingPollId)===String(pollId))cancelPollEdit();
        selectedPollId=null;
        await loadPollList();
    }catch(err){
        console.error(err);
        alert('투표 삭제 중 오류가 발생했습니다.');
    }
}

function initializeDeadlineDefaultsReset(){
    const date=new Date();
    date.setDate(date.getDate()+1);
    document.getElementById('pollEndDateInput').value=formatDateInput(date);
    document.getElementById('pollEndHourInput').value='18';
    document.getElementById('pollEndMinuteInput').value='00';
    if(typeof window.syncPollDeadlinePicker==='function')window.syncPollDeadlinePicker();
}

function switchPollTab(tabName){
    const isActive=tabName==='active';
    document.getElementById('activePollTab').classList.toggle('active',isActive);
    document.getElementById('pastPollTab').classList.toggle('active',!isActive);
    document.getElementById('activePollTab').setAttribute('aria-selected',String(isActive));
    document.getElementById('pastPollTab').setAttribute('aria-selected',String(!isActive));
    document.getElementById('activePollPanel').classList.toggle('active',isActive);
    document.getElementById('pastPollPanel').classList.toggle('active',!isActive);
}

function pollStateIcon(type){
    const icons={
        ballot:'<span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 9.5h3M8 13.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="m14.5 10 1.1 1.1 2-2.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
        chart:'<span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5V14m5 4.5V10m5 8.5V6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 18.5h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>',
        history:'<span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6.5 7.5h11M6.5 12h8M6.5 16.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="1.6"/></svg></span>',
        warning:'<span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5 20 18H4L12 4.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v4.5M12 16.5v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>'
    };
    return icons[type]||icons.chart;
}

function renderMainEmptyState(){
    const target=document.getElementById('activePollArea');
    target.className='poll-empty-state';
    target.innerHTML='<span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 9.5h3M8 13.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="m14.5 10 1.1 1.1 2-2.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'+ 
        '<p class="poll-empty-title">아직 선택된 투표가 없습니다.</p>'+ 
        '<p class="poll-empty-description">'+(projectReadOnly?'읽기 전용 프로젝트에서는 투표 결과만 확인할 수 있습니다.':'목록에서 투표를 선택하거나 새 투표를 만들어 구성원의 의견을 모아보세요.')+'</p>'+ 
        '';
}

function renderListEmptyState(type){
    const active=type==='active';
    return '<div class="poll-list-empty">'+
        pollStateIcon(active?'chart':'history')+
        '<p class="poll-empty-title">'+(active?'진행 중인 투표가 없습니다.':'아직 종료된 투표가 없습니다.')+'</p>'+
        '<p class="poll-empty-description">'+(active?'의견을 모아야 할 주제가 생기면 새 투표를 시작해보세요.':'완료된 투표 결과가 이곳에 차곡차곡 쌓입니다.')+'</p>'+
    '</div>';
}

async function loadPollList(preferredPollId){
    try{
        const res=await fetch('/api/polls/list?'+buildScopeQuery());
        allPolls=await res.json();
        if(!Array.isArray(allPolls))allPolls=[];

        renderPollHistory();
        selectInitialPoll(preferredPollId);
    }catch(err){
        console.error(err);
        document.getElementById('activePollList').innerHTML='<div class="poll-list-empty"><span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5 20 18H4L12 4.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v4.5M12 16.5v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><p class="poll-empty-title">투표 목록을 불러오지 못했습니다.</p></div>';
        document.getElementById('pastPollList').innerHTML='<div class="poll-list-empty"><span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5 20 18H4L12 4.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v4.5M12 16.5v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><p class="poll-empty-title">투표 목록을 불러오지 못했습니다.</p></div>';
        renderMainEmptyState();
    }
}

function selectInitialPoll(preferredPollId){
    if(allPolls.length===0){
        selectedPollId=null;
        const target=document.getElementById('activePollArea');
        renderMainEmptyState();
        updateSelectedPollState(null);
        return;
    }

    let selected=allPolls.find(function(p){
        return String(p.POLL_ID||p.pollId)===String(preferredPollId||selectedPollId||'');
    });

    if(!selected){
        selected=allPolls.find(function(p){return !isPollClosed(p);})||allPolls[0];
    }

    const pollId=selected.POLL_ID||selected.pollId;
    selectedPollId=String(pollId);
    switchPollTab(isPollClosed(selected)?'past':'active');
    updateSelectedPollState(selected);
    loadPollDetail(pollId);
    renderPollHistory();
}

function updateSelectedPollState(poll){
    // 상태 라벨은 상세 제목과 목록 제목 옆에서 직접 렌더링합니다.
}

let extendingPollId=null;
function openPollExtendModal(pollId,endDt){ extendingPollId=pollId; const m=document.getElementById('pollExtendModal'); document.getElementById('pollPrevDeadline').innerText=formatDeadline(endDt,true); const d=new Date(); d.setDate(d.getDate()+1); document.getElementById('pollExtendDate').value=formatDateInput(d); const h=document.getElementById('pollExtendHour'),mi=document.getElementById('pollExtendMinute'); if(!h.options.length){for(let i=0;i<24;i++){let v=String(i).padStart(2,'0');h.add(new Option(v,v));} for(let i=0;i<60;i+=10){let v=String(i).padStart(2,'0');mi.add(new Option(v,v));}} h.value='18';mi.value='00'; m.classList.add('open'); m.setAttribute('aria-hidden','false'); }
function closePollExtendModal(){ const m=document.getElementById('pollExtendModal'); if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true');} extendingPollId=null; }
async function submitPollExtend(){ const date=document.getElementById('pollExtendDate').value; const endDt=date+' '+document.getElementById('pollExtendHour').value+':'+document.getElementById('pollExtendMinute').value; if(!date){alert('새 마감일을 선택해주세요.');return;} const res=await fetch('/api/polls/extend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId:extendingPollId,endDt:endDt})}); const result=await res.json(); if(!result||result.success===false){alert(result&&result.message?result.message:'연장에 실패했습니다.');return;} const id=extendingPollId; closePollExtendModal(); await loadPollList(id); await loadPollDetail(id); }

async function finalizeScheduleTie(pollId,optionId){
    if(!confirm('이 일정을 최종 일정으로 확정하고 캘린더에 등록할까요?')) return;
    const res=await fetch('/api/polls/schedule/finalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId:pollId,optionId:optionId})});
    const result=await res.json();
    if(!result||result.success===false){alert(result&&result.message?result.message:'일정 확정에 실패했습니다.');return;}
    await loadPollList(pollId);
    await loadPollDetail(pollId);
}

async function loadPollDetail(pollId){
    const target=document.getElementById('activePollArea');
    target.className='poll-loading-state';target.innerHTML='<span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5V14m5 4.5V10m5 8.5V6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 18.5h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><p class="poll-empty-title">투표를 불러오는 중입니다.</p>';
    try{
        const res=await fetch('/api/polls/detail?pollId='+encodeURIComponent(pollId));
        const data=await res.json();
        renderPollDetail(data);
    }catch(err){console.error(err);target.className='poll-empty-state';target.innerHTML='<span class="poll-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5 20 18H4L12 4.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v4.5M12 16.5v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><p class="poll-empty-title">투표를 불러오지 못했습니다.</p><p class="poll-empty-description">잠시 후 다시 시도해주세요.</p>';}
}

function renderPollDetail(data){
    const target=document.getElementById('activePollArea');
    if(!data||!data.question){renderMainEmptyState();return;}

    const options=Array.isArray(data.options)?data.options:[];
    const showResults=!!data.showResults;
    const isClosed=!!data.isClosed;
    const hasVoted=!!data.hasVoted;
    const myOptionId=data.myOptionId;
    const total=showResults?options.reduce(function(sum,opt){return sum+Number(opt.COUNT||opt.count||0);},0):0;
    const maxCount=(isClosed&&showResults&&options.length)?Math.max.apply(null,options.map(function(opt){return Number(opt.COUNT||opt.count||0);})):0;
    const firstOptionType=options.length?String(options[0].OPTION_TYPE||options[0].optionType||'TEXT').toUpperCase():'TEXT';
    const isSchedulePoll=firstOptionType==='SCHEDULE';
    const isImagePoll=firstOptionType==='IMAGE';
    const isAudioPoll=firstOptionType==='AUDIO';
    const isVideoPoll=firstOptionType==='VIDEO';
    pendingVoteOptionId=hasVoted?myOptionId:null;

    let html='';

    html+='<section class="poll-detail-head">';
    html+='<div class="poll-detail-title-row">';
    html+='<div class="poll-title-with-status">';
    html+='<p class="active-poll-question">'+escapeHtml(data.question)+'</p>';
    html+='<em class="poll-status '+(isClosed?'closed':'active')+'">'+(isClosed?'종료':'진행 중')+'</em>'; if(Number(data.extendCount||0)>0) html+='<em class="poll-status extended">연장 '+data.extendCount+'회</em>';
    html+='</div>';

    if(!projectReadOnly&&(data.canEdit||data.canExtend||data.canDelete)){
        html+='<div class="poll-detail-title-actions">';
        if(data.canEdit){ html+='<button type="button" class="poll-manage-btn" onclick="startPollEdit('+data.pollId+')">수정</button>'; }
        if(data.canExtend){ html+='<button type="button" class="poll-manage-btn extend" onclick="openPollExtendModal('+data.pollId+',\''+String(data.endDt||'').replace(/'/g,'')+'\')">연장</button>'; }
        if(data.canDelete){ html+='<button type="button" class="poll-manage-btn delete" onclick="deletePollItem('+data.pollId+')">삭제</button>'; }
        html+='</div>';
    }
    html+='</div>';

    html+='<div class="poll-detail-summary-row">';
    html+='<div class="poll-detail-summary">';
    if(hasVoted&&!isClosed){
        html+='<span class="poll-summary-chip participated">✓ 참여 완료</span>';
    }else if(!isClosed){
        html+='<span class="poll-summary-chip">참여 전</span>';
    }
    html+='<span class="poll-summary-chip people">👤 '+Number(data.totalVoteCount||0)+'명 참여</span>';
    html+='<span class="poll-summary-chip '+(isClosed?'closed':'deadline')+'">⏰ '+formatDeadline(data.endDt,isClosed)+'</span>';
    html+='</div>';
    if(data.creatorName){
        html+='<div class="poll-detail-author">작성자 <strong>'+escapeHtml(data.creatorName)+'</strong>'+(!isClosed?' <span class="poll-author-sep">·</span> <span class="poll-result-visibility-meta">'+(showResults?'결과 공개':'결과 비공개')+'</span>':'')+'</div>';
    }
    html+='</div>';
    html+='</section>';

    if(isSchedulePoll&&isClosed){
        const finalStatus=String(data.scheduleFinalStatus||'');
        if(finalStatus==='REGISTERED'&&data.calendarEventId){
            html+='<div class="poll-schedule-final registered"><span><strong>📅 일정에 등록됨</strong> · 최종 일정이 캘린더에 자동 등록되었습니다.</span><button type="button" class="poll-manage-btn" onclick="location.href=\'/calendar?viewEventId='+data.calendarEventId+'\'">일정 보기</button></div>';
        }else if(finalStatus==='TIE'){
            html+='<div class="poll-schedule-final tie"><span><strong>동률 일정</strong> · 최다 득표 일정이 여러 개입니다.'+(data.canResolveScheduleTie?' 아래 후보 중 최종 일정을 선택해주세요.':' 작성자의 최종 확정을 기다리고 있습니다.')+'</span></div>';
        }else if(finalStatus==='NO_VOTES'){
            html+='<div class="poll-schedule-final"><span><strong>확정 일정 없음</strong> · 참여 표가 없어 캘린더에 등록되지 않았습니다.</span></div>';
        }else if(finalStatus==='PENDING'){
            html+='<div class="poll-schedule-final"><span><strong>일정 확정 중</strong> · 최종 결과를 캘린더에 반영하고 있습니다.</span></div>';
        }
    }

    const optionGuide=isClosed
        ? '마감된 투표의 최종 결과입니다.'
        : (!showResults?'마감 전에는 선택지별 결과가 공개되지 않습니다.':(projectReadOnly?'읽기 전용으로 결과만 확인할 수 있습니다.':(isImagePoll?'이미지를 누르면 바로 선택되며 다시 눌러 변경할 수 있습니다.':(isSchedulePoll?'가능한 일정을 하나 선택하세요.':'하나의 선택지를 골라 참여하세요.'))));
    html+='<section class="poll-options-section">';
    html+='<div class="poll-options-head"><div class="poll-options-heading"><h4>선택지</h4><span class="poll-options-count">'+options.length+'</span></div><p class="poll-options-guide">'+escapeHtml(optionGuide)+'</p></div>';
    html+='<div class="poll-option-list'+(isSchedulePoll?' schedule-poll-list':(isImagePoll?' image-poll-grid':(isAudioPoll?' audio-poll-grid':(isVideoPoll?' video-poll-grid':''))))+'" data-poll-id="'+data.pollId+'">';
    const scheduleTieIds=Array.isArray(data.scheduleTieOptionIds)?data.scheduleTieOptionIds.map(String):[];

    options.forEach(function(opt,index){
        const id=opt.OPTION_ID||opt.optionId;
        const rawText=opt.TEXT||opt.text||'';
        const image=opt.IMAGE_PATH||opt.imagePath||'';
        const count=Number(opt.COUNT||opt.count||0);
        const selected=String(myOptionId||'')===String(id||'');
        const winner=isClosed&&showResults&&maxCount>0&&count===maxCount;
        const canResolveTie=isSchedulePoll&&isClosed&&data.scheduleFinalStatus==='TIE'&&data.canResolveScheduleTie&&scheduleTieIds.includes(String(id));
        const disabled=(isClosed||projectReadOnly)&&!canResolveTie;
        const displayText=isSchedulePoll?formatScheduleOptionLabel(rawText,index):(isVideoPoll?('영상 '+(index+1)):(isImagePoll&&image?getImageOptionLabel(rawText,index):(rawText||((isAudioPoll?'음악 ':'후보 ')+(index+1)))));
        const percentage=total>0?Math.round((count/total)*100):0;
        const clickHandler=canResolveTie?'finalizeScheduleTie('+data.pollId+','+id+')':(isImagePoll&&!disabled?'choosePollOption('+id+',this)':'votePoll('+data.pollId+','+id+')');

        const useMediaCard=(isAudioPoll||isVideoPoll)&&!!image;
        if(useMediaCard){
            html+='<div class="poll-option-btn'+(selected?' selected':'')+(winner?' winner':'')+'" data-option-id="'+id+'" role="button" tabindex="'+(disabled?'-1':'0')+'" aria-disabled="'+String(disabled)+'" onclick="'+(disabled?'':clickHandler)+'" onkeydown="if(!'+String(disabled)+'&&(event.key===\'Enter\'||event.key===\' \')){event.preventDefault();'+clickHandler+'}">';
        }else{
            html+='<button type="button" class="poll-option-btn'+(selected?' selected':'')+(winner?' winner':'')+'" data-option-id="'+id+'" onclick="'+clickHandler+'" '+(disabled?'disabled':'')+'>';
        }
        if(isImagePoll&&image){
            html+='<span class="poll-option-image-wrap"><span class="poll-image-labels"><span class="poll-image-number">'+(index+1)+'</span><span class="poll-winner-crown" aria-label="최다 득표">👑</span></span><span class="poll-option-badges"><span class="poll-choice-badge" aria-label="내 선택">✓</span></span><img class="poll-option-image" src="'+escapeHtml(image)+'" alt="'+escapeHtml(displayText)+'"></span>';
        } else if(isAudioPoll&&image){
            html+='<span class="poll-media-card"><span class="poll-media-number">'+(index+1)+'</span><audio controls preload="metadata" src="'+escapeHtml(image)+'" onclick="event.stopPropagation()"></audio></span>';
        } else if(isVideoPoll&&image){
            const videoInfo=getVideoEmbedInfo(image);
            html+='<span class="poll-media-card video"><span class="poll-media-number">'+(index+1)+'</span><span class="poll-choice-badge" aria-label="내 선택">✓ 내 선택</span>';
            if(videoInfo.kind==='iframe'){
                html+='<iframe class="poll-video-frame" src="'+escapeHtml(videoInfo.src)+'" title="영상 선택지 '+(index+1)+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen onclick="event.stopPropagation()"></iframe>';
            }else if(videoInfo.kind==='video'){
                html+='<video class="poll-video-native" controls preload="metadata" src="'+escapeHtml(videoInfo.src)+'" onclick="event.stopPropagation()"></video>';
            }else{
                html+='<a class="poll-video-open" href="'+escapeHtml(image)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">▶ 영상 열기</a>';
            }
            html+='</span>';
        }
        html+='<span class="poll-option-bottom">'+(image?'':'<span class="text-option-number-group"><span class="option-number">'+(index+1)+'</span></span>')+'<span class="text-option-label-group"><span class="poll-option-text">'+(isSchedulePoll?'📅 ':'')+escapeHtml(displayText||('후보 '+(index+1)))+'</span>'+(!image&&winner?'<span class="text-winner-crown" aria-label="최다 득표">👑</span>':'')+'</span>';
        if(showResults){
            html+='<span class="poll-result-meta">'+(!image&&selected?'<span class="text-choice-label">✓ 내 선택</span>':'')+(winner?'<span class="poll-winner-text">최다 득표</span>':'')+(canResolveTie?'<span class="poll-tie-confirm">이 일정으로 확정</span>':'')+'<span class="poll-count">'+count+'표</span>'+((isImagePoll||isVideoPoll)?'<span aria-hidden="true">·</span><span class="poll-percentage">'+percentage+'%</span>':'')+'</span>';
        }else if(!image&&selected){
            html+='<span class="poll-result-meta"><span class="text-choice-label">✓ 내 선택</span></span>';
        }
        html+='</span>'+(useMediaCard?'</div>':'</button>');
    });

    html+='</div>';
    html+='</section>';
    target.className='';
    target.innerHTML=html;
}

function getImageOptionLabel(text,index){
    const value=String(text||'').trim();
    const looksLikeStoredFile=/^(?:\d+[_-])?[a-f0-9_-]{6,}.*\.(?:png|jpe?g|gif|webp)$/i.test(value)
        || /\.(?:png|jpe?g|gif|webp)$/i.test(value)
        || value==='이미지 선택지';
    return !value||looksLikeStoredFile?'후보 '+(index+1):value;
}

let voteInFlight=false;

async function choosePollOption(optionId,button){
    if(projectReadOnly)return;
    if(voteInFlight)return;

    pendingVoteOptionId=optionId;
    document.querySelectorAll('#activePollArea .image-poll-grid .poll-option-btn').forEach(function(item){
        item.classList.toggle('selected',String(item.dataset.optionId)===String(optionId));
        item.classList.toggle('vote-saving',String(item.dataset.optionId)===String(optionId));
    });

    const pollId=button.closest('.poll-option-list').dataset.pollId;
    await votePoll(pollId,optionId);
}

async function votePoll(pollId,optionId){
    if(projectReadOnly)return;
    if(voteInFlight)return;
    voteInFlight=true;
    try{
        const res=await fetch('/api/polls/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId:pollId,optionId:optionId})});
        const result=await res.json();
        if(!result||result.success===false){
            alert(result&&result.message==='LOGIN_REQUIRED'?'로그인이 필요합니다.':(result&&result.message?result.message:'투표 반영에 실패했습니다.'));
            await loadPollDetail(pollId);
            return;
        }
        await loadPollDetail(pollId);
        await loadPollList(pollId);
    }catch(err){
        console.error(err);
        alert('투표 반영 중 오류가 발생했습니다.');
        if(pollId)await loadPollDetail(pollId);
    }finally{
        voteInFlight=false;
    }
}

function renderPollHistory(){
    const activeTarget=document.getElementById('activePollList');
    const pastTarget=document.getElementById('pastPollList');
    const activePolls=allPolls.filter(function(p){return !isPollClosed(p);});
    const pastPolls=allPolls.filter(function(p){return isPollClosed(p);});

    document.getElementById('activePollCount').innerText=activePolls.length;
    document.getElementById('pastPollCount').innerText=pastPolls.length;

    activeTarget.innerHTML=renderPollListItems(activePolls,'active');
    pastTarget.innerHTML=renderPollListItems(pastPolls,'past');
}

function renderPollListItems(list,type){
    if(!list.length)return renderListEmptyState(type);

    return list.map(function(p){
        const id=p.POLL_ID||p.pollId;
        const closed=isPollClosed(p);

        const creator=p.CREATOR_NAME||p.creatorName||'작성자 미상';
        const voteCount=Number(p.VOTE_COUNT??p.voteCount??0);
        const optionCount=Number(p.OPTION_COUNT??p.optionCount??0);
        const deadline=p.END_DT||p.endDt;
        const deadlineText=deadline?formatDateTime(deadline)+(closed?' 종료':' 마감'):(closed?'종료됨':'마감 없음');
        const stateText=closed?'종료':'진행 중';

        return '<div class="poll-history-item '+(closed?'is-past ':'')+(String(selectedPollId)===String(id)?'active':'')+'" onclick="selectPollFromList('+id+')">'+
            '<div class="poll-list-title-row">'+
                '<strong class="poll-list-title">'+escapeHtml(p.QUESTION||p.question||'질문 없음')+'</strong>'+
                '<span class="poll-list-state">'+stateText+'</span>'+
            '</div>'+
            '<div class="poll-list-subrow">'+
                '<span class="poll-list-author">'+escapeHtml(creator)+'</span>'+
                '<span class="poll-list-subrow-dot" aria-hidden="true">·</span>'+
                '<span class="poll-list-deadline">'+escapeHtml(deadlineText)+'</span>'+
            '</div>'+
            '<div class="poll-list-meta">'+
                '<span class="poll-list-meta-item">참여 '+voteCount+'명</span>'+
                '<span class="poll-list-meta-dot" aria-hidden="true"></span>'+
                '<span class="poll-list-meta-item">선택지 '+optionCount+'개</span>'+
            '</div>'+
        '</div>';
    }).join('');
}

function selectPollFromList(id){
    const poll=allPolls.find(function(p){return String(p.POLL_ID||p.pollId)===String(id);});
    if(!poll)return;

    selectedPollId=String(id);
    switchPollTab(isPollClosed(poll)?'past':'active');
    updateSelectedPollState(poll);
    loadPollDetail(id);
    renderPollHistory();
    document.querySelector('.poll-detail-card').scrollIntoView({behavior:'smooth',block:'start'});
}

function isPollClosed(p){return String(p.STATUS||p.status||'').toUpperCase()==='CLOSED'||isPastDeadline(p.END_DT||p.endDt)}
function isPastDeadline(v){if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&d.getTime()<Date.now()}
function formatDeadline(v,closed){return v?formatDateTime(v)+' 마감':(closed?'마감 완료':'마감 없음')}
function formatDateInput(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function formatDateTime(v){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v).substring(0,16);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function getVideoEmbedInfo(rawUrl){
    const value=String(rawUrl||'').trim();
    if(!value)return {kind:'link',src:''};
    try{
        const url=new URL(value,window.location.origin);
        const host=url.hostname.toLowerCase().replace(/^www\./,'');
        if(host==='youtu.be'){
            const id=url.pathname.split('/').filter(Boolean)[0];
            if(id)return {kind:'iframe',src:'https://www.youtube.com/embed/'+encodeURIComponent(id)};
        }
        if(host.endsWith('youtube.com')){
            let id=url.searchParams.get('v');
            if(!id){
                const parts=url.pathname.split('/').filter(Boolean);
                const marker=parts.findIndex(function(v){return v==='embed'||v==='shorts'||v==='live';});
                if(marker>=0)id=parts[marker+1];
            }
            if(id)return {kind:'iframe',src:'https://www.youtube.com/embed/'+encodeURIComponent(id)};
        }
        if(host==='vimeo.com'||host.endsWith('.vimeo.com')){
            const id=url.pathname.split('/').filter(Boolean).find(function(v){return /^\d+$/.test(v);});
            if(id)return {kind:'iframe',src:'https://player.vimeo.com/video/'+id};
        }
        if(/\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(url.pathname+url.search))return {kind:'video',src:url.href};
        return {kind:'link',src:url.href};
    }catch(e){
        return {kind:'link',src:value};
    }
}

function escapeHtml(v){return String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
</script>
</body>
</html>
