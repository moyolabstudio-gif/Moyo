<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>투표</title>
<link rel="icon" href="data:,">
<style>
body{margin:0;background:#f6f8fa;color:#111827;font-family:'Pretendard',sans-serif}
.poll-page{max-width:1120px;margin:34px auto 72px;padding:0 24px;box-sizing:border-box}
.poll-top-link{display:inline-flex;margin-bottom:18px;color:#64748b;text-decoration:none;font-size:14px;font-weight:800}
.poll-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:28px 32px;margin-bottom:22px;background:radial-gradient(circle at 92% 16%,rgba(85,221,191,.18),transparent 28%),radial-gradient(circle at 6% 100%,rgba(74,144,226,.12),transparent 32%),#fff;border:1px solid #e4ebf2;border-radius:24px;box-shadow:0 10px 30px rgba(32,48,64,.045)}
.poll-hero h2{margin:0;font-size:28px;font-weight:900;letter-spacing:-.04em}.poll-hero p{margin:8px 0 0;color:#64748b;font-size:14px;font-weight:700}
.poll-scope-badge{display:inline-flex;align-items:center;height:28px;padding:0 11px;border-radius:999px;border:1px solid #dbeafe;background:#eef6ff;color:#2563eb;font-size:12px;font-weight:900}
.poll-layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:18px;align-items:start}
.poll-card{background:#fff;border:1px solid #e4ebf2;border-radius:20px;box-shadow:0 8px 22px rgba(32,48,64,.035);padding:22px;box-sizing:border-box}
.poll-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.poll-card h3{margin:0;font-size:18px;font-weight:900}

.active-poll-question{margin:0 0 8px;font-size:18px;font-weight:900}.active-poll-meta{margin-bottom:12px;color:#94a3b8;font-size:12px;font-weight:800}
.poll-option-list{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.poll-option-btn{display:flex;flex-direction:column;gap:8px;min-height:48px;padding:10px;border:1px solid #e4ebf2;border-radius:14px;background:#fff;font-family:inherit;font-weight:900;color:#334155;cursor:pointer;text-align:left;overflow:hidden}
.poll-option-btn:hover{background:#f8fbff;border-color:#bfdbfe}.poll-option-btn.selected{border-color:#4A90E2;box-shadow:0 0 0 3px rgba(74,144,226,.12)}.poll-option-btn.winner{border-color:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.08)}.poll-option-btn.selected.winner{border-color:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.08)}.poll-option-btn:disabled{cursor:default;opacity:1}
.poll-option-image{width:100%;aspect-ratio:16/10;object-fit:contain;object-position:center;border-radius:10px;background:#f8fafc;padding:8px;box-sizing:border-box}
.poll-option-bottom{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;width:100%}
.option-number{display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900}.text-option-number-group{display:inline-flex;align-items:center}.text-option-label-group{display:flex;align-items:center;gap:6px;min-width:0}.text-winner-crown{flex:0 0 auto;color:#f59e0b;font-size:17px;line-height:1;transform:translateY(-1px);filter:drop-shadow(0 1px 1px rgba(180,105,0,.16))}.text-choice-label{display:inline-flex;align-items:center;color:#2563eb;font-size:11px;font-weight:900;white-space:nowrap}.poll-winner-text{color:#d97706;font-size:11px;font-weight:900;white-space:nowrap;margin-right:8px}.poll-result-meta{display:inline-flex;align-items:center;justify-content:flex-end;gap:6px;white-space:nowrap}
.poll-option-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.poll-count{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:22px;padding:0 7px;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900}
.poll-empty{min-height:110px;display:flex;align-items:center;justify-content:center;border:1px dashed #dce3ea;border-radius:15px;background:#fafbfc;color:#94a3b8;font-size:13px;font-weight:800;text-align:center}
.poll-history-list{display:flex;flex-direction:column;gap:9px}.poll-history-item{display:block;padding:12px 13px;border:1px solid #eef2f6;border-radius:14px;background:#fff;cursor:pointer}
.poll-history-item:hover,.poll-history-item.active{border-color:#bfdbfe;background:#f8fbff}.poll-history-item strong{display:block;min-width:0;font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.poll-history-item span{display:block;margin-top:4px;color:#94a3b8;font-size:11px;font-weight:800}
.poll-status{display:inline-flex;align-items:center;height:23px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:900}.poll-status.active{background:#eff6ff;border:1px solid #bfdbfe;color:#2563eb}.poll-status.closed{background:#f8fafc;border:1px solid #e4ebf2;color:#64748b}
.poll-form-row{margin-bottom:14px}.form-label-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.form-label-row label,.poll-form-row>label{color:#334155;font-size:12px;font-weight:900}
.poll-input{width:100%;min-height:40px;padding:0 12px;border:1px solid #d8e0e8;border-radius:12px;box-sizing:border-box;font-family:inherit;font-weight:800;outline:none}.poll-input:focus{border-color:#4A90E2;box-shadow:0 0 0 3px rgba(74,144,226,.12)}
.poll-deadline-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(92px,.55fr) minmax(92px,.55fr);gap:10px}.time-unit-wrap{display:grid;grid-template-columns:1fr auto;gap:5px;align-items:center}.time-unit{color:#64748b;font-size:12px;font-weight:900}
.poll-option-input-list{display:flex;flex-direction:column;gap:9px}.poll-option-edit-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:start;padding:10px;border:1px solid #e4ebf2;border-radius:14px;background:#fbfdff}
.poll-option-edit-main{display:flex;flex-direction:column;gap:8px;min-width:0}.poll-option-image-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.poll-file-label{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 10px;border:1px solid #dbeafe;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900;cursor:pointer}.poll-file-label input{display:none}
.poll-image-preview{display:none;width:88px;height:58px;object-fit:contain;object-position:center;padding:4px;box-sizing:border-box;background:#f8fafc;border-radius:9px;border:1px solid #e4ebf2}.poll-image-preview.visible{display:block}.poll-image-name{max-width:150px;color:#64748b;font-size:11px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.poll-add-option{width:30px;height:30px;border:1px solid #dbeafe;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:18px;font-weight:900;cursor:pointer}
.poll-create-btn{width:100%;height:42px;border:0;border-radius:999px;background:linear-gradient(135deg,#4A90E2,#39CDB5);color:#fff;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;box-shadow:0 10px 22px rgba(57,205,181,.22)}
.notice-readonly{margin-top:10px;color:#94a3b8;font-size:11px;font-weight:800;line-height:1.5}
@media(max-width:900px){.poll-layout{grid-template-columns:1fr}.poll-option-list{grid-template-columns:1fr}.poll-deadline-grid{grid-template-columns:minmax(0,1.45fr) minmax(82px,.55fr) minmax(82px,.55fr)}}

.poll-option-toolbar{display:flex;align-items:center;gap:6px}
.global-option-type-switch{display:flex;align-items:center;gap:9px;margin-right:2px}
.global-option-type-switch label{display:inline-flex;align-items:center;gap:4px;color:#64748b;font-size:11px;font-weight:900;cursor:pointer}
.global-option-type-switch input{accent-color:#4A90E2}
.poll-remove-last{width:30px;height:30px;border:1px solid #fecdd3;border-radius:999px;background:#fff1f2;color:#e11d48;font-size:18px;font-weight:900;cursor:pointer}
.poll-option-image-block{display:none;align-items:center;gap:8px;flex-wrap:wrap}
.poll-option-edit-row.image-mode .poll-option-text-input{display:none}
.poll-option-edit-row.image-mode .poll-option-image-block{display:flex}
.poll-manage-actions{display:flex;justify-content:flex-end;gap:7px}
.poll-manage-btn{height:30px;padding:0 11px;border:1px solid #dbeafe;border-radius:999px;background:#eef6ff;color:#2563eb;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer}
.poll-manage-btn.delete{border-color:#fecdd3;background:#fff1f2;color:#e11d48}
.poll-form-actions{display:flex;gap:8px}
.poll-form-actions .poll-create-btn{flex:1}
.poll-hero-actions{display:flex;align-items:center;gap:10px}
.poll-open-create-btn{height:38px;padding:0 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#4A90E2,#39CDB5);color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px rgba(57,205,181,.2)}
.poll-page-content{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.75fr);gap:18px;align-items:start}
.poll-detail-card{min-width:0;width:100%}
.poll-side-lists{display:flex;flex-direction:column;gap:18px;min-width:0}
.poll-side-lists .poll-card{min-width:0}
.poll-side-lists .poll-history-list{max-height:330px;overflow-y:auto;padding-right:2px}
.poll-list-count{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:0 7px;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900}
.poll-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
.poll-modal.open{display:flex}
.poll-modal-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.48);backdrop-filter:blur(3px)}
.poll-modal-dialog{position:relative;z-index:1;width:min(520px,100%);max-height:calc(100vh - 48px);overflow:auto;border:1px solid #e4ebf2;border-radius:24px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.22)}
.poll-modal-body{padding:28px}
.poll-modal-header{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}
.poll-modal-header h3{margin:0;font-size:21px;font-weight:900}
.poll-modal-close{position:static;flex-shrink:0;width:32px;height:32px;border:0;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:22px;font-weight:900;cursor:pointer}
body.poll-modal-open{overflow:hidden}
@media(max-width:980px){.poll-page-content{grid-template-columns:1fr}.poll-side-lists{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.poll-side-lists{grid-template-columns:1fr}.poll-hero{align-items:flex-start}.poll-hero-actions{flex-wrap:wrap;justify-content:flex-end}}


.poll-option-image-block.has-image .poll-file-label{display:none}
.poll-option-image-frame{position:relative;display:none;width:88px;height:58px}
.poll-option-image-frame.visible{display:block}
.poll-option-image-frame .poll-image-preview{display:block;width:100%;height:100%}
.poll-option-image-remove{position:absolute;top:-7px;right:-7px;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:2px solid #fff;border-radius:999px;background:#ef4444;color:#fff;font-size:15px;font-weight:900;line-height:1;cursor:pointer;box-shadow:0 3px 8px rgba(15,23,42,.2)}
.poll-option-image-block.has-image .poll-image-name{display:none}


.poll-author{display:inline-flex;align-items:center;gap:5px;color:#64748b;font-size:11px;font-weight:900}
.poll-author::before{content:'작성자';color:#94a3b8;font-weight:800}


.poll-selected-state{display:inline-flex;align-items:center;justify-content:center;height:26px;padding:0 10px;border-radius:999px;background:#f8fafc;border:1px solid #e4ebf2;color:#64748b;font-size:11px;font-weight:900;white-space:nowrap}
.poll-selected-state.active{background:#e9fff9;border-color:#a7f3d0;color:#059669}
.poll-selected-state.closed{background:#f8fafc;border-color:#d8e0e8;color:#64748b}


.poll-detail-status-row{display:flex;justify-content:flex-end;margin-bottom:8px}
.poll-detail-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:6px}
.poll-detail-title-row .active-poll-question{margin:0;min-width:0}
.poll-detail-title-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}


.poll-title-with-status{display:flex;align-items:center;gap:8px;min-width:0}
.poll-title-with-status .active-poll-question{margin:0;min-width:0}
.poll-list-title-row{display:flex;align-items:center;gap:7px;min-width:0}
.poll-list-title-row strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}



/* 투표 페이지 정보 구조 개선 */
.poll-page{max-width:1280px}
.poll-hero{padding:26px 32px}
.poll-page-content{grid-template-columns:minmax(0,1.65fr) minmax(340px,.72fr);gap:20px}
.poll-detail-card{padding:0;overflow:hidden;min-height:430px}
.poll-detail-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 22px;border-bottom:1px solid #edf2f7;background:#fff}
.poll-detail-header h3{margin:0;font-size:17px;font-weight:900;letter-spacing:-.02em}
.poll-detail-guide{color:#94a3b8;font-size:11px;font-weight:800}
#activePollArea:not(.poll-empty-state):not(.poll-loading-state){padding:24px 22px 26px}
.poll-side-panel{padding:0;overflow:hidden;position:sticky;top:84px}
.poll-tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #e8eef4;background:#fbfdff}
.poll-tab{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;height:58px;border:0;background:transparent;color:#64748b;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer}
.poll-tab::after{content:'';position:absolute;left:22px;right:22px;bottom:-1px;height:3px;border-radius:99px;background:transparent}
.poll-tab.active{color:#111827;background:#fff}.poll-tab.active::after{background:linear-gradient(90deg,#4A90E2,#39CDB5)}
.poll-tab .poll-list-count{height:21px;min-width:21px;padding:0 6px;font-size:10px}
.poll-tab-content{display:none;padding:16px}.poll-tab-content.active{display:block}
.poll-side-panel .poll-history-list{max-height:520px;overflow-y:auto;padding-right:2px}
.poll-history-item{padding:14px 14px;border-radius:14px;transition:.18s ease}
.poll-history-item.active{border-color:#93c5fd;background:#f3f8ff;box-shadow:inset 3px 0 0 #4A90E2}
.poll-history-item:hover{transform:translateY(-1px)}
.poll-history-item span{margin-top:6px}
.poll-empty-state,.poll-loading-state{min-height:370px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:34px;text-align:center;box-sizing:border-box;background:linear-gradient(180deg,#fff,#fbfdff)}
.poll-empty-icon{display:flex;align-items:center;justify-content:center;width:64px;height:64px;margin-bottom:16px;border-radius:22px;background:linear-gradient(135deg,#eef6ff,#e9fff9);font-size:29px;box-shadow:0 10px 25px rgba(74,144,226,.1)}
.poll-empty-title{margin:0;color:#334155;font-size:17px;font-weight:900;letter-spacing:-.02em}
.poll-empty-description{max-width:360px;margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:700;line-height:1.65}
.poll-empty-action{display:inline-flex;align-items:center;justify-content:center;height:38px;margin-top:18px;padding:0 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#4A90E2,#39CDB5);color:#fff;font-family:inherit;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 9px 20px rgba(57,205,181,.18)}
.poll-list-empty{min-height:205px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px 18px;text-align:center;border:1px dashed #dce6ef;border-radius:16px;background:#fafcff;box-sizing:border-box}
.poll-list-empty .poll-empty-icon{width:50px;height:50px;margin-bottom:12px;border-radius:17px;font-size:22px}
.poll-list-empty .poll-empty-title{font-size:14px}.poll-list-empty .poll-empty-description{margin-top:6px;font-size:11px;line-height:1.55}
.poll-list-empty .poll-empty-action{height:34px;margin-top:14px;padding:0 13px;font-size:11px}
.poll-detail-title-row{margin-bottom:10px}.active-poll-question{font-size:20px;line-height:1.4}
.active-poll-meta{padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid #edf2f7;line-height:1.6}
@media(max-width:980px){.poll-page-content{grid-template-columns:1fr}.poll-detail-card{min-height:360px}.poll-side-panel{position:static}.poll-side-panel .poll-history-list{max-height:380px}}



/* 투표 생성·수정 모달 정렬 및 밀도 개선 */
.poll-modal-dialog{width:min(540px,100%)}
.poll-modal-body{padding:26px 26px 24px}
.poll-modal-header{margin-bottom:20px}
.poll-modal-header h3{font-size:22px;letter-spacing:-.03em}
.poll-form-row{margin-bottom:17px}
.poll-form-row>label,.form-label-row label{display:block;margin-bottom:8px;color:#334155;font-size:12px;font-weight:900}
.form-label-row{align-items:flex-end;margin-bottom:9px}
.form-label-row label{margin-bottom:0}
.poll-input{height:42px;min-height:42px;background:#fff;border-color:#d7e1ec;border-radius:12px;font-size:13px}
#pollQuestionInput{font-size:14px}
.poll-input::placeholder{color:#a7b3c3}

.poll-deadline-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
.poll-time-group{display:grid;grid-template-columns:76px 12px 76px;gap:5px;align-items:center}
.poll-time-select{width:76px;padding:0 10px;text-align:center;text-align-last:center}
.poll-time-colon{color:#64748b;font-size:16px;font-weight:900;text-align:center}

.poll-option-toolbar{gap:7px}
.global-option-type-switch{display:inline-grid;grid-template-columns:1fr 1fr;gap:3px;margin:0;padding:3px;border:1px solid #dfe7f0;border-radius:11px;background:#f5f8fb}
.global-option-type-switch .poll-type-option{position:relative;display:block;margin:0;cursor:pointer}
.global-option-type-switch .poll-type-option input{position:absolute;opacity:0;pointer-events:none}
.global-option-type-switch .poll-type-option span{display:flex;align-items:center;justify-content:center;height:28px;padding:0 11px;border-radius:8px;color:#64748b;font-size:11px;font-weight:900;white-space:nowrap;transition:.16s ease}
.global-option-type-switch .poll-type-option input:checked+span{background:#fff;color:#2563eb;box-shadow:0 1px 5px rgba(15,23,42,.10)}
.global-option-type-switch .poll-type-option input:focus-visible+span{outline:2px solid rgba(74,144,226,.35);outline-offset:1px}
.poll-add-option,.poll-remove-last{width:32px;height:32px;font-size:18px}

.poll-option-input-list{gap:8px}
.poll-option-edit-row{display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;align-items:center;padding:9px 10px;border-color:#e2eaf2;border-radius:14px;background:#fbfdff}
.poll-option-edit-row .option-number{align-self:center;width:24px;height:24px;line-height:24px;font-size:11px}
.poll-option-edit-main{gap:7px}
.poll-option-text-input{height:40px;min-height:40px}
.poll-option-edit-row.image-mode{align-items:center}
.poll-option-image-block{min-height:40px}
.poll-file-label{height:32px}
.poll-option-image-frame{width:76px;height:52px}
.poll-image-preview{width:76px;height:52px}

.poll-form-actions{margin-top:4px}
.poll-create-btn{height:46px;font-size:14px}

@media(max-width:620px){
  .poll-modal{padding:12px}
  .poll-modal-body{padding:22px 20px 20px}
  .poll-deadline-grid{grid-template-columns:1fr;gap:8px}
  .poll-time-group{grid-template-columns:minmax(0,1fr) 14px minmax(0,1fr)}
  .poll-time-select{width:100%}
  .form-label-row{align-items:flex-start;gap:10px}
  .poll-option-toolbar{flex-wrap:wrap;justify-content:flex-end}
}


/* 이미지 선택지 일괄 드롭 */
.poll-image-bulk-drop{display:none;margin-top:10px;padding:18px 14px;border:1.5px dashed #b9ccec;border-radius:14px;background:#f7fbff;text-align:center;cursor:pointer;transition:.18s ease}
.poll-image-bulk-drop.visible{display:block}
.poll-image-bulk-drop.dragover{border-color:#3b82f6;background:#edf6ff;box-shadow:0 0 0 3px rgba(59,130,246,.10)}
.poll-image-bulk-drop strong{display:block;color:#27476f;font-size:13px;font-weight:900}
.poll-image-bulk-drop span{display:block;margin-top:4px;color:#8393aa;font-size:11px;font-weight:700}
.poll-image-bulk-input{display:none}
.poll-option-image-block.row-dragover{outline:2px dashed #60a5fa;outline-offset:4px;border-radius:10px;background:#eff6ff}

/* 이미지 투표: 후보 비교에 맞춘 2열 카드형 */
.poll-image-guide{display:flex;align-items:center;gap:6px;margin:0 0 12px;padding:0 2px;color:#7b8da6;font-size:11px;font-weight:700}
.poll-option-list.image-poll-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.image-poll-grid .poll-option-btn{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;padding:9px;gap:0;border-radius:16px;background:#fff;transition:.18s ease}
.image-poll-grid .poll-option-btn:hover{transform:translateY(-1px);border-color:#93c5fd;box-shadow:0 8px 20px rgba(37,99,235,.08)}
.image-poll-grid .poll-option-btn.selected{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 2px rgba(59,130,246,.08)}
.image-poll-grid .poll-option-btn.winner{border-color:#f59e0b;background:#fff;box-shadow:0 0 0 2px rgba(245,158,11,.08)}
.image-poll-grid .poll-option-btn.selected.winner{border-color:#f59e0b;background:#fff;box-shadow:0 0 0 2px rgba(245,158,11,.08)}
.image-poll-grid .poll-option-btn:disabled{opacity:1;cursor:default}
.image-poll-grid .poll-option-image-wrap{position:relative;display:block;width:100%;height:260px;overflow:hidden;border-radius:12px;background:#f5f7fa;flex:0 0 260px}
.image-poll-grid .poll-option-image{width:100%;height:100%;aspect-ratio:auto;padding:0;border-radius:0;object-fit:contain;background:transparent;box-sizing:border-box;filter:none;opacity:1}
.image-poll-grid .poll-option-badges{position:absolute;top:10px;right:10px;z-index:3;display:flex;align-items:flex-end;pointer-events:none}
.image-poll-grid .poll-choice-badge{display:none;align-items:center;justify-content:center;width:34px;height:34px;padding:0;border:3px solid #fff;border-radius:50%;background:#2563eb;color:#fff;font-size:16px;font-weight:900;box-shadow:0 4px 12px rgba(37,99,235,.24)}
.image-poll-grid .poll-option-btn.selected .poll-choice-badge{display:inline-flex}
.image-poll-grid .poll-image-labels{position:absolute;top:10px;left:10px;z-index:3;display:flex;align-items:center;gap:7px;pointer-events:none}
.image-poll-grid .poll-image-number{display:flex;align-items:center;justify-content:center;min-width:28px;height:24px;padding:0 8px;border:1px solid #dbeafe;border-radius:7px;background:rgba(255,255,255,.96);color:#2563eb;font-size:12px;font-weight:900;box-shadow:0 2px 6px rgba(15,23,42,.08)}
.image-poll-grid .poll-winner-crown{display:none;color:#f59e0b;font-size:20px;line-height:1;transform:translateY(-1px);filter:drop-shadow(0 1px 2px rgba(180,105,0,.2))}
.image-poll-grid .poll-option-btn.winner .poll-winner-crown{display:inline-block}
.image-poll-grid .poll-winner-text{display:none;color:#d97706;font-size:11px;font-weight:900;white-space:nowrap;margin-right:8px}
.image-poll-grid .poll-option-btn.winner .poll-winner-text{display:inline}
.image-poll-grid .poll-option-btn.vote-saving{pointer-events:none;opacity:.72}
.image-poll-grid .poll-option-bottom{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:11px 3px 2px;min-height:42px}
.image-poll-grid .poll-option-text{font-size:13px;font-weight:900;color:#334155}
.image-poll-grid .poll-result-meta{display:inline-flex;align-items:center;justify-content:flex-end;gap:4px;color:#64748b;font-size:11px;font-weight:800;white-space:nowrap}
.image-poll-grid .poll-result-meta .poll-count{display:inline;min-width:0;height:auto;padding:0;border:0;border-radius:0;background:transparent;color:#64748b;font-size:11px;font-weight:800}
.image-poll-grid .poll-percentage{color:#64748b;font-size:11px;font-weight:800}
.poll-vote-submit-wrap{display:flex;justify-content:center;margin-top:16px}
.poll-vote-submit{width:100%;height:46px;border:0;border-radius:13px;background:linear-gradient(90deg,#4a90e2,#35c9b8);color:#fff;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;box-shadow:0 8px 18px rgba(53,201,184,.16)}
.poll-vote-submit:disabled{cursor:not-allowed;opacity:.5;box-shadow:none}
@media(max-width:680px){.poll-option-list.image-poll-grid{grid-template-columns:1fr}.image-poll-grid .poll-option-image-wrap{height:220px;flex-basis:220px}}


/* 투표 상세 핵심 상태 요약 */
.poll-detail-summary{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px}
.poll-summary-chip{display:inline-flex;align-items:center;gap:5px;min-height:32px;padding:0 11px;border:1px solid #e3eaf2;border-radius:10px;background:#fff;color:#52637a;font-size:12px;font-weight:900}
.poll-summary-chip.participated{border-color:#b7ead9;background:#effcf7;color:#07966c}
.poll-summary-chip.people{border-color:#cfe1ff;background:#f3f8ff;color:#2563eb}
.poll-summary-chip.deadline{border-color:#ffe0b2;background:#fff8ed;color:#d97706}
.poll-summary-chip.closed{border-color:#e2e8f0;background:#f8fafc;color:#64748b}
.poll-detail-author{margin:0 0 16px;padding:0 2px 15px;border-bottom:1px solid #edf2f7;color:#8a9ab0;font-size:11px;font-weight:800}
.poll-detail-author strong{color:#52637a;font-weight:900}
.active-poll-meta{display:none}

/* 이미지 선택지 생성·수정: 썸네일 관리형 그리드 */
.poll-modal-dialog.image-edit-mode{width:min(650px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:hidden}
.poll-modal-dialog.image-edit-mode .poll-modal-body{display:flex;flex-direction:column;height:calc(100vh - 32px);max-height:860px;overflow:hidden;padding-bottom:0}
.poll-modal-dialog.image-edit-mode .poll-form-row:last-of-type{display:flex;flex:1;flex-direction:column;min-height:0;margin-bottom:0;overflow:hidden}
.poll-modal-dialog.image-edit-mode .poll-option-input-list{flex:1;min-height:0;overflow-y:auto;padding-right:5px;padding-bottom:8px}
.poll-option-input-list.image-edit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:10px}
.poll-option-input-list.image-edit-grid .poll-option-edit-row{position:relative;display:block;min-width:0;height:170px;padding:8px;border:1px solid #dbe5f1;border-radius:14px;background:#f8fafc;box-sizing:border-box;overflow:hidden}
.poll-option-input-list.image-edit-grid .poll-option-edit-row .option-number{position:absolute;top:8px;left:8px;z-index:4;display:flex;align-items:center;justify-content:center;width:27px;height:25px;border:1px solid #dbeafe;border-radius:7px;background:rgba(255,255,255,.96);color:#2563eb;box-shadow:0 2px 7px rgba(15,23,42,.08)}
.poll-option-input-list.image-edit-grid .poll-option-edit-main,
.poll-option-input-list.image-edit-grid .poll-option-image-block{width:100%;height:100%;min-height:0}
.poll-option-input-list.image-edit-grid .poll-option-image-block{position:relative;display:flex;align-items:center;justify-content:center;border-radius:10px;background:#f1f5f9;overflow:hidden}
.poll-option-input-list.image-edit-grid .poll-option-image-frame{display:none;width:100%;height:100%;border-radius:10px;overflow:hidden}
.poll-option-input-list.image-edit-grid .poll-option-image-frame.visible{display:block}
.poll-option-input-list.image-edit-grid .poll-image-preview{width:100%;height:100%;object-fit:contain;padding:10px;box-sizing:border-box;background:#f1f5f9}
.poll-option-input-list.image-edit-grid .poll-option-image-remove{top:7px;right:7px;z-index:5;width:25px;height:25px;font-size:16px}
.poll-option-input-list.image-edit-grid .poll-file-label{width:100%;height:100%;padding:0;border:1.5px dashed #9fc2ee;border-radius:10px;background:#f7fbff;color:#3b6ea8;text-align:center;box-sizing:border-box;transition:.18s ease}
.poll-option-input-list.image-edit-grid .poll-file-label:hover{border-color:#4a90e2;background:#eef7ff}
.poll-option-input-list.image-edit-grid .poll-file-label .poll-upload-tile-content{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;pointer-events:none}
.poll-option-input-list.image-edit-grid .poll-file-label .poll-upload-plus{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:11px;background:#e7f1ff;color:#2563eb;font-size:23px;font-weight:700;line-height:1}
.poll-option-input-list.image-edit-grid .poll-file-label strong{color:#315e91;font-size:12px;font-weight:900}
.poll-option-input-list.image-edit-grid .poll-file-label .poll-upload-help{color:#8a9ab0;font-size:10px;font-weight:700;line-height:1.4}
.poll-option-input-list.image-edit-grid .poll-image-name{display:none}
.poll-option-input-list.image-edit-grid .poll-option-text-input{display:none}
.poll-image-bulk-drop{display:none}
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop{position:relative;display:flex;align-items:center;justify-content:center;min-width:0;height:170px;margin:0;padding:8px;border:1px solid #dbe5f1;border-radius:14px;background:#f8fafc;color:#3b6ea8;text-align:center;cursor:pointer;box-sizing:border-box;transition:.18s ease;overflow:hidden}
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop::before{content:'';position:absolute;inset:8px;border:1.5px dashed #9fc2ee;border-radius:10px;background:#f7fbff;transition:.18s ease}
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop .poll-upload-tile-content{position:relative;z-index:1}
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop:hover{border-color:#b9ccec;transform:translateY(-1px)}
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop:hover::before{border-color:#4a90e2;background:#eef7ff}
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop.dragover{border-color:#93baf0;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop.dragover::before{border-color:#2563eb;background:#eaf4ff}
.poll-image-bulk-drop .poll-upload-tile-content{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;pointer-events:none}
.poll-image-bulk-drop .poll-upload-plus{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:11px;background:#e7f1ff;color:#2563eb;font-size:23px;font-weight:700;line-height:1}
.poll-image-bulk-drop strong{color:#315e91;font-size:12px;font-weight:900}
.poll-image-bulk-drop span{color:#8a9ab0;font-size:10px;font-weight:700;line-height:1.4}
.poll-modal-dialog.image-edit-mode .poll-form-actions{position:relative;flex:0 0 auto;z-index:8;margin:12px -26px 0;padding:14px 26px 18px;border-top:1px solid #edf2f7;background:#fff}
@media(max-width:720px){
 .poll-option-input-list.image-edit-grid{grid-template-columns:1fr}
 .poll-modal-dialog.image-edit-mode{width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 24px)}
 .poll-modal-dialog.image-edit-mode .poll-modal-body{height:calc(100vh - 24px)}
 .poll-modal-dialog.image-edit-mode .poll-modal-body{padding-left:18px;padding-right:18px}
 .poll-modal-dialog.image-edit-mode .poll-form-actions{margin-left:-18px;margin-right:-18px;padding-left:18px;padding-right:18px}
}


/* 2026-06-10 이미지 모달 폭/스크롤 최종 보정 */
.poll-modal-dialog.image-edit-mode{
    width:min(540px,calc(100vw - 32px));
    max-height:calc(100dvh - 32px);
    overflow:hidden;
}
.poll-modal-dialog.image-edit-mode .poll-modal-body{
    display:flex;
    flex-direction:column;
    width:100%;
    height:auto;
    max-height:calc(100dvh - 32px);
    padding:26px 26px 0;
    overflow:hidden;
    box-sizing:border-box;
}
.poll-modal-dialog.image-edit-mode .poll-form-row:last-of-type{
    display:flex;
    flex:1 1 auto;
    flex-direction:column;
    min-height:0;
    margin-bottom:0;
    overflow:hidden;
}
.poll-modal-dialog.image-edit-mode .poll-option-input-list{
    flex:1 1 auto;
    min-height:180px;
    max-height:min(430px,calc(100dvh - 330px));
    overflow-y:auto;
    overflow-x:hidden;
    padding:0 6px 10px 0;
    scrollbar-gutter:stable;
    overscroll-behavior:contain;
}
.poll-modal-dialog.image-edit-mode .poll-option-input-list::-webkit-scrollbar{width:7px}
.poll-modal-dialog.image-edit-mode .poll-option-input-list::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}
.poll-modal-dialog.image-edit-mode .poll-option-input-list::-webkit-scrollbar-track{background:transparent}
.poll-option-input-list.image-edit-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px;
}
.poll-option-input-list.image-edit-grid .poll-option-edit-row,
.poll-option-input-list.image-edit-grid .poll-image-bulk-drop{
    height:150px;
}
.poll-modal-dialog.image-edit-mode .poll-form-actions{
    position:relative;
    flex:0 0 auto;
    z-index:10;
    margin:12px -26px 0;
    padding:14px 26px 18px;
    border-top:1px solid #edf2f7;
    background:#fff;
    box-shadow:0 -8px 18px rgba(15,23,42,.04);
}
@media(max-width:600px){
    .poll-modal{padding:12px}
    .poll-modal-dialog.image-edit-mode{width:min(540px,calc(100vw - 24px));max-height:calc(100dvh - 24px)}
    .poll-modal-dialog.image-edit-mode .poll-modal-body{max-height:calc(100dvh - 24px);padding-left:18px;padding-right:18px}
    .poll-modal-dialog.image-edit-mode .poll-option-input-list{max-height:calc(100dvh - 330px)}
    .poll-modal-dialog.image-edit-mode .poll-form-actions{margin-left:-18px;margin-right:-18px;padding-left:18px;padding-right:18px}
}
@media(max-width:430px){
    .poll-option-input-list.image-edit-grid{grid-template-columns:1fr}
}


/* 2026-06-10 텍스트 선택지 영역만 스크롤 */
.poll-modal-dialog.text-edit-mode{
    width:min(540px,calc(100vw - 32px));
    max-height:calc(100dvh - 32px);
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-modal-body{
    display:flex;
    flex-direction:column;
    width:100%;
    max-height:calc(100dvh - 32px);
    padding:26px 26px 0;
    overflow:hidden;
    box-sizing:border-box;
}
.poll-modal-dialog.text-edit-mode .poll-form-row:last-of-type{
    display:flex;
    flex:1 1 auto;
    flex-direction:column;
    min-height:0;
    margin-bottom:0;
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-option-input-list{
    flex:1 1 auto;
    min-height:160px;
    max-height:min(430px,calc(100dvh - 330px));
    overflow-y:auto;
    overflow-x:hidden;
    padding:0 6px 10px 0;
    scrollbar-gutter:stable;
    overscroll-behavior:contain;
}
.poll-modal-dialog.text-edit-mode .poll-option-input-list::-webkit-scrollbar{width:7px}
.poll-modal-dialog.text-edit-mode .poll-option-input-list::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}
.poll-modal-dialog.text-edit-mode .poll-option-input-list::-webkit-scrollbar-track{background:transparent}
.poll-modal-dialog.text-edit-mode .poll-form-actions{
    position:relative;
    flex:0 0 auto;
    z-index:10;
    margin:12px -26px 0;
    padding:14px 26px 18px;
    border-top:1px solid #edf2f7;
    background:#fff;
    box-shadow:0 -8px 18px rgba(15,23,42,.04);
}
@media(max-width:600px){
    .poll-modal-dialog.text-edit-mode{width:min(540px,calc(100vw - 24px));max-height:calc(100dvh - 24px)}
    .poll-modal-dialog.text-edit-mode .poll-modal-body{max-height:calc(100dvh - 24px);padding-left:18px;padding-right:18px}
    .poll-modal-dialog.text-edit-mode .poll-option-input-list{max-height:calc(100dvh - 330px)}
    .poll-modal-dialog.text-edit-mode .poll-form-actions{margin-left:-18px;margin-right:-18px;padding-left:18px;padding-right:18px}
}



/* 2026-06-10 낮은 화면에서도 하단 저장 버튼 고정 */
.poll-modal-dialog.text-edit-mode,
.poll-modal-dialog.image-edit-mode{
    height:min(760px,calc(100dvh - 24px));
    max-height:calc(100dvh - 24px);
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-modal-body,
.poll-modal-dialog.image-edit-mode .poll-modal-body{
    height:100%;
    max-height:none;
    min-height:0;
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-form-row:last-of-type,
.poll-modal-dialog.image-edit-mode .poll-form-row:last-of-type{
    flex:1 1 0;
    min-height:0;
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-option-input-list,
.poll-modal-dialog.image-edit-mode .poll-option-input-list{
    flex:1 1 0;
    min-height:0;
    max-height:none;
    overflow-y:auto;
    overscroll-behavior:contain;
}
.poll-modal-dialog.text-edit-mode .poll-form-actions,
.poll-modal-dialog.image-edit-mode .poll-form-actions{
    flex:0 0 auto;
    margin-top:10px;
}
@media(max-height:720px){
    .poll-modal{padding:8px}
    .poll-modal-dialog.text-edit-mode,
    .poll-modal-dialog.image-edit-mode{
        height:calc(100dvh - 16px);
        max-height:calc(100dvh - 16px);
    }
    .poll-modal-dialog.text-edit-mode .poll-modal-body,
    .poll-modal-dialog.image-edit-mode .poll-modal-body{
        padding-top:18px;
    }
    .poll-modal-header{margin-bottom:12px}
    .poll-form-row{margin-bottom:12px}
}


/* 2026-06-10 투표 모달 높이 최종 보정
   - 내용이 적으면 필요한 높이만 사용
   - 내용이 많으면 선택지 목록만 스크롤
   - 하단 생성/저장 버튼은 항상 표시 */
.poll-modal-dialog.text-edit-mode,
.poll-modal-dialog.image-edit-mode{
    height:auto;
    max-height:calc(100dvh - 24px);
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-modal-body,
.poll-modal-dialog.image-edit-mode .poll-modal-body{
    display:grid;
    grid-template-rows:auto auto auto minmax(0,1fr) auto;
    height:auto;
    max-height:calc(100dvh - 24px);
    min-height:0;
    padding:26px 26px 0;
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-form-row:last-of-type,
.poll-modal-dialog.image-edit-mode .poll-form-row:last-of-type{
    display:flex;
    flex-direction:column;
    min-height:0;
    margin-bottom:0;
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode .poll-option-input-list,
.poll-modal-dialog.image-edit-mode .poll-option-input-list{
    flex:0 1 auto;
    min-height:0;
    max-height:min(420px,calc(100dvh - 350px));
    overflow-y:auto;
    overflow-x:hidden;
    overscroll-behavior:contain;
    scrollbar-gutter:stable;
}
.poll-modal-dialog.text-edit-mode .poll-form-actions,
.poll-modal-dialog.image-edit-mode .poll-form-actions{
    position:relative;
    z-index:10;
    margin:12px -26px 0;
    padding:14px 26px 18px;
    border-top:1px solid #edf2f7;
    background:#fff;
    box-shadow:0 -8px 18px rgba(15,23,42,.04);
}
@media(max-height:720px){
    .poll-modal-dialog.text-edit-mode .poll-modal-body,
    .poll-modal-dialog.image-edit-mode .poll-modal-body{
        max-height:calc(100dvh - 16px);
        padding-top:18px;
    }
    .poll-modal-dialog.text-edit-mode .poll-option-input-list,
    .poll-modal-dialog.image-edit-mode .poll-option-input-list{
        max-height:calc(100dvh - 330px);
    }
}
@media(max-width:600px){
    .poll-modal-dialog.text-edit-mode .poll-modal-body,
    .poll-modal-dialog.image-edit-mode .poll-modal-body{
        padding-left:18px;
        padding-right:18px;
    }
    .poll-modal-dialog.text-edit-mode .poll-form-actions,
    .poll-modal-dialog.image-edit-mode .poll-form-actions{
        margin-left:-18px;
        margin-right:-18px;
        padding-left:18px;
        padding-right:18px;
    }
}


/* 2026-06-10 선택지가 많은 경우 목록 스크롤 강제 보정
   auto 높이 상태에서는 flex 영역이 줄어들지 않아 스크롤이 멈추는 문제를 해결한다. */
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(6)) .poll-modal-body,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(5)) .poll-modal-body{
    height:calc(100dvh - 24px);
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(6)) .poll-form-row:last-of-type,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(5)) .poll-form-row:last-of-type{
    min-height:0;
    overflow:hidden;
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(6)) .poll-option-input-list,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(5)) .poll-option-input-list{
    flex:1 1 0;
    height:0;
    max-height:none;
    overflow-y:scroll !important;
    overscroll-behavior:contain;
    touch-action:pan-y;
    scrollbar-gutter:stable;
}
@media(max-height:720px){
    .poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(4)) .poll-modal-body,
    .poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(3)) .poll-modal-body{
        height:calc(100dvh - 16px);
    }
    .poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(4)) .poll-option-input-list,
    .poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(3)) .poll-option-input-list{
        flex:1 1 0;
        height:0;
        max-height:none;
        overflow-y:scroll !important;
        touch-action:pan-y;
    }
}



/* 2026-06-10 투표 모달 스크롤 안정화 최종 보정
   이전 height:0 강제 규칙을 무효화하고, 선택지가 많은 경우에만 목록 영역을 flex 스크롤로 전환한다. */
.poll-modal-dialog.text-edit-mode,
.poll-modal-dialog.image-edit-mode{
    height:auto !important;
    max-height:calc(100dvh - 24px) !important;
    overflow:hidden !important;
}
.poll-modal-dialog.text-edit-mode .poll-modal-body,
.poll-modal-dialog.image-edit-mode .poll-modal-body{
    display:flex !important;
    flex-direction:column !important;
    height:auto !important;
    max-height:calc(100dvh - 24px) !important;
    min-height:0 !important;
    overflow:hidden !important;
}
.poll-modal-dialog.text-edit-mode .poll-form-row:last-of-type,
.poll-modal-dialog.image-edit-mode .poll-form-row:last-of-type{
    display:flex !important;
    flex:0 1 auto !important;
    flex-direction:column !important;
    min-height:0 !important;
    overflow:hidden !important;
}
.poll-modal-dialog.text-edit-mode .poll-option-input-list,
.poll-modal-dialog.image-edit-mode .poll-option-input-list{
    display:grid;
    flex:0 1 auto !important;
    height:auto !important;
    min-height:0 !important;
    max-height:min(420px,calc(100dvh - 350px)) !important;
    overflow-x:hidden !important;
    overflow-y:auto !important;
    overscroll-behavior:contain;
    touch-action:pan-y;
    scrollbar-gutter:stable;
}
/* 텍스트 6개 이상 / 이미지 카드 5개 이상이면 모달 높이를 화면에 맞추고 목록만 스크롤 */
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(6)),
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(5)){
    height:calc(100dvh - 24px) !important;
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(6)) .poll-modal-body,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(5)) .poll-modal-body{
    height:100% !important;
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(6)) .poll-form-row:last-of-type,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(5)) .poll-form-row:last-of-type{
    flex:1 1 auto !important;
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(6)) .poll-option-input-list,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(5)) .poll-option-input-list{
    flex:1 1 auto !important;
    height:auto !important;
    max-height:none !important;
    overflow-y:auto !important;
}
.poll-modal-dialog.text-edit-mode .poll-form-actions,
.poll-modal-dialog.image-edit-mode .poll-form-actions{
    flex:0 0 auto !important;
}
@media(max-height:720px){
    .poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(4)),
    .poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(3)){
        height:calc(100dvh - 16px) !important;
    }
    .poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(4)) .poll-modal-body,
    .poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(3)) .poll-modal-body{
        height:100% !important;
    }
    .poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(4)) .poll-form-row:last-of-type,
    .poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(3)) .poll-form-row:last-of-type{
        flex:1 1 auto !important;
    }
    .poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(4)) .poll-option-input-list,
    .poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(3)) .poll-option-input-list{
        flex:1 1 auto !important;
        height:auto !important;
        max-height:none !important;
        overflow-y:auto !important;
    }
}


/* 2026-06-10 투표 모달 레이아웃 최종 정리
   모달 전체 높이를 강제로 늘리지 않고, 선택지 목록만 화면 높이에 맞춰 스크롤한다. */
.poll-modal-dialog.text-edit-mode,
.poll-modal-dialog.image-edit-mode{
    width:min(540px,calc(100vw - 24px)) !important;
    height:auto !important;
    max-height:calc(100dvh - 24px) !important;
    overflow:hidden !important;
}
.poll-modal-dialog.text-edit-mode .poll-modal-body,
.poll-modal-dialog.image-edit-mode .poll-modal-body{
    display:flex !important;
    flex-direction:column !important;
    width:100% !important;
    height:auto !important;
    max-height:calc(100dvh - 24px) !important;
    min-height:0 !important;
    overflow:hidden !important;
}
.poll-modal-dialog.text-edit-mode .poll-form-row,
.poll-modal-dialog.image-edit-mode .poll-form-row{
    flex:0 0 auto !important;
}
.poll-modal-dialog.text-edit-mode .poll-form-row:last-of-type,
.poll-modal-dialog.image-edit-mode .poll-form-row:last-of-type{
    display:flex !important;
    flex:0 1 auto !important;
    flex-direction:column !important;
    min-height:0 !important;
    overflow:hidden !important;
}
.poll-modal-dialog.text-edit-mode .poll-option-input-list,
.poll-modal-dialog.image-edit-mode .poll-option-input-list{
    display:grid !important;
    flex:0 1 auto !important;
    width:100% !important;
    height:auto !important;
    min-height:0 !important;
    max-height:min(390px,calc(100dvh - 410px)) !important;
    overflow-x:hidden !important;
    overflow-y:auto !important;
    overscroll-behavior:contain;
    touch-action:pan-y;
    scrollbar-gutter:stable;
    padding-right:6px !important;
}
.poll-modal-dialog.text-edit-mode .poll-form-actions,
.poll-modal-dialog.image-edit-mode .poll-form-actions{
    position:relative !important;
    bottom:auto !important;
    flex:0 0 auto !important;
    z-index:20 !important;
    margin-top:12px !important;
    background:#fff !important;
}
/* 과거 :has 기반 고정 높이 규칙을 전부 무효화 */
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(n)),
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(n)){
    height:auto !important;
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-modal-body,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-modal-body{
    height:auto !important;
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-form-row:last-of-type,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-form-row:last-of-type{
    flex:0 1 auto !important;
}
.poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-option-input-list,
.poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-option-input-list{
    flex:0 1 auto !important;
    height:auto !important;
    max-height:min(390px,calc(100dvh - 410px)) !important;
}
@media(max-height:720px){
    .poll-modal-dialog.text-edit-mode .poll-option-input-list,
    .poll-modal-dialog.image-edit-mode .poll-option-input-list,
    .poll-modal-dialog.text-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-option-input-list,
    .poll-modal-dialog.image-edit-mode:has(.poll-option-input-list > :nth-child(n)) .poll-option-input-list{
        max-height:max(150px,calc(100dvh - 390px)) !important;
    }
}


/* media poll fixes */
.global-option-type-switch{display:flex!important;grid-template-columns:none!important;flex-wrap:nowrap!important;gap:3px!important;white-space:nowrap}
.global-option-type-switch .poll-type-option{flex:0 0 auto}
.global-option-type-switch .poll-type-option span{padding:0 10px!important}
.poll-option-audio-block{position:relative}
.poll-media-upload{flex-direction:column;gap:3px;padding:10px 12px;transition:.16s ease}
.poll-audio-upload-text{font-weight:900;color:#2563eb}
.poll-audio-upload-help{font-size:11px;color:#94a3b8;font-weight:700}
.poll-option-audio-block.audio-dragover .poll-media-upload{border-color:#2563eb;background:#eff6ff;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
.poll-option-audio-block.has-audio .poll-media-upload{min-height:38px}

/* 음악 선택지 입력/상세 압축 */
.poll-option-edit-row.audio-mode{padding:9px 10px!important;min-height:0!important}
.poll-option-edit-row.audio-mode .poll-option-audio-block{display:grid!important;grid-template-columns:112px minmax(0,1fr);align-items:center;gap:8px;width:100%}
.poll-option-edit-row.audio-mode .poll-media-upload{height:38px;min-height:38px!important;padding:4px 8px;flex-direction:row;gap:6px;overflow:hidden}
.poll-option-edit-row.audio-mode .poll-audio-upload-help{display:none}
.poll-option-edit-row.audio-mode .poll-audio-upload-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.poll-option-edit-row.audio-mode .poll-media-title{height:38px;min-width:0}
.poll-option-edit-row.audio-mode .poll-audio-preview{grid-column:1/-1;height:32px;margin:0}
.poll-option-list.audio-poll-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}
.poll-option-list.audio-poll-grid .poll-option-btn{height:auto!important;min-height:94px!important;padding:10px 12px!important;display:grid;grid-template-columns:1fr;gap:8px;align-content:center}
.audio-poll-grid .poll-media-card{min-height:0;padding:0 0 0 38px;background:transparent;border-radius:0;display:block;position:relative}
.audio-poll-grid .poll-media-card audio{display:block;width:100%;height:36px}
.audio-poll-grid .poll-media-number{left:0;top:3px;padding:4px 8px}
.audio-poll-grid .poll-option-bottom{padding:0!important;min-height:24px}
.audio-poll-grid .poll-option-text{font-weight:900;color:#0f172a}
@media(max-width:760px){.poll-option-edit-row.audio-mode .poll-option-audio-block{grid-template-columns:1fr}.poll-option-edit-row.audio-mode .poll-audio-preview{grid-column:1}.poll-option-list.audio-poll-grid{grid-template-columns:1fr}}

</style>

<style>
/* 텍스트 투표 선택지: 데스크톱 2열, 작은 화면 1열 */
.poll-option-list:not(.image-poll-grid){
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px 12px;
}
.poll-option-list:not(.image-poll-grid) .poll-option-btn{
    min-width:0;
    height:48px;
    min-height:48px;
}
.poll-option-list:not(.image-poll-grid) .poll-option-bottom{
    min-width:0;
}
.poll-option-list:not(.image-poll-grid) .poll-option-text{
    display:-webkit-box;
    min-width:0;
    overflow:hidden;
    white-space:normal;
    text-overflow:ellipsis;
    -webkit-box-orient:vertical;
    -webkit-line-clamp:2;
    line-height:1.35;
}
@media(max-width:760px){
    .poll-option-list:not(.image-poll-grid){
        grid-template-columns:1fr;
    }
}


/* ===== 투표 페이지 최종 밀도/선택 강조 보정 (2026-06-10) ===== */
/* 상세 상단은 정보 간격만 줄이고 결과 수치는 계속 노출한다. */
.poll-detail-header{
    padding:16px 20px;
}
#activePollArea:not(.poll-empty-state):not(.poll-loading-state){
    padding:18px 20px 22px;
}
.poll-detail-title-row{
    margin-bottom:6px;
}
.poll-detail-summary{
    gap:6px;
    margin-bottom:7px;
}
.poll-detail-author{
    margin-bottom:11px;
    padding-bottom:11px;
}
.active-poll-question{
    line-height:1.32;
}

/* 진행 중 투표의 내 선택은 얇은 테두리와 옅은 배경만 사용한다. */
.poll-option-btn.selected:not(.winner){
    border-color:#93c5fd;
    background:#f8fbff;
    box-shadow:0 0 0 1px rgba(59,130,246,.10);
}
.image-poll-grid .poll-option-btn.selected:not(.winner){
    border-color:#93c5fd;
    background:#fff;
    box-shadow:0 0 0 1px rgba(59,130,246,.10);
}
.poll-option-btn.selected .poll-count{
    background:#f1f6fc;
    color:#2563eb;
}


.poll-option-audio-block,.poll-option-video-block{display:none;gap:8px;flex-direction:column;width:100%}.poll-option-edit-row.audio-mode .poll-option-audio-block,.poll-option-edit-row.video-mode .poll-option-video-block{display:flex}.poll-option-edit-row.audio-mode .poll-option-text-input,.poll-option-edit-row.audio-mode .poll-option-image-block,.poll-option-edit-row.video-mode .poll-option-text-input,.poll-option-edit-row.video-mode .poll-option-image-block{display:none}.poll-media-upload{display:flex;align-items:center;justify-content:center;min-height:48px;border:1px dashed #93c5fd;border-radius:12px;color:#2563eb;font-weight:800;cursor:pointer}.poll-media-upload input{display:none}.poll-audio-preview{width:100%;display:none}.poll-media-card{position:relative;display:flex;align-items:center;justify-content:center;min-height:116px;padding:24px 18px;background:#f8fafc;border-radius:14px}.poll-media-card audio{width:100%}.poll-media-card.video{display:block;min-height:0;padding:0;background:#0f172a;overflow:hidden}.poll-video-frame{display:block;width:100%;aspect-ratio:16/9;border:0;background:#0f172a}.poll-video-native{display:block;width:100%;aspect-ratio:16/9;background:#0f172a}.poll-video-open{display:inline-flex;align-items:center;justify-content:center;min-height:116px;width:100%;padding:12px 18px;box-sizing:border-box;color:#2563eb;font-weight:800;text-decoration:none;background:linear-gradient(135deg,#eff6ff,#ecfeff)}.poll-media-number{position:absolute;left:12px;top:12px;background:#fff;color:#2563eb;padding:5px 10px;border-radius:8px;font-weight:900}.poll-status.extended{color:#7c3aed;background:#f5f3ff;border-color:#ddd6fe}.poll-manage-btn.extend{color:#7c3aed;background:#f5f3ff;border-color:#ddd6fe}.poll-extend-dialog{max-width:520px}.poll-static-value{padding:12px 14px;background:#f8fafc;border:1px solid #dbe5f1;border-radius:12px;color:#64748b;font-weight:700}

/* 영상/음악 투표 카드: 기존 재생 렌더링은 유지하고 배치만 정리 */
.poll-option-list.video-poll-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:14px;
}
.video-poll-grid .poll-option-btn{
    display:flex !important;
    flex-direction:column;
    width:100%;
    height:auto !important;
    min-height:0 !important;
    padding:10px !important;
    gap:0;
    border-radius:16px;
    box-sizing:border-box;
}
.video-poll-grid .poll-media-card.video{
    display:block;
    position:relative;
    width:100%;
    min-height:0;
    padding:0;
    border-radius:12px;
    overflow:hidden;
    background:#0f172a;
}
.video-poll-grid .poll-video-frame,
.video-poll-grid .poll-video-native{
    display:block;
    width:100%;
    aspect-ratio:16/9;
    border:0;
}
.video-poll-grid .poll-option-bottom{
    display:grid;
    grid-template-columns:minmax(0,1fr) auto;
    gap:8px;
    align-items:center;
    width:100%;
    min-height:42px;
    padding:10px 3px 1px;
    box-sizing:border-box;
}
.video-poll-grid .poll-option-text{
    color:#334155;
    font-size:13px;
    font-weight:900;
}
.video-poll-grid .poll-result-meta{
    justify-self:end;
}
.video-poll-grid .poll-media-number{
    z-index:2;
}
.poll-option-list.audio-poll-grid .poll-option-btn[role="button"],
.poll-option-list.video-poll-grid .poll-option-btn[role="button"]{
    cursor:pointer;
}
.poll-option-list.audio-poll-grid .poll-option-btn[aria-disabled="true"],
.poll-option-list.video-poll-grid .poll-option-btn[aria-disabled="true"]{
    cursor:default;
}
@media(max-width:760px){
    .poll-option-list.video-poll-grid{grid-template-columns:1fr}
}

</style>

<style>
/* 영상 투표 마감 디테일 보정: 재생/저장 로직은 변경하지 않음 */
.video-poll-grid .poll-media-number{
    left:8px;
    top:8px;
    z-index:4;
    min-width:28px;
    height:26px;
    padding:0 8px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border:1px solid #dbeafe;
    border-radius:8px;
    background:rgba(255,255,255,.96);
    box-shadow:0 2px 7px rgba(15,23,42,.10);
}
.video-poll-grid .poll-option-bottom{
    min-height:34px;
    padding:7px 3px 0;
}
.video-poll-grid .poll-option-btn.selected:not(.winner){
    background:#fbfdff;
    border-color:#a7c7f7;
    box-shadow:0 0 0 1px rgba(59,130,246,.07);
}
.video-poll-grid .poll-option-btn.selected:not(.winner):hover{
    background:#fbfdff;
}
</style>
</head>
<body class="poll-page-body">
<jsp:include page="/WEB-INF/views/common/header.jsp"/>
<main class="poll-page">
<a class="poll-top-link" id="backLink" href="#">⬅ 돌아가기</a>
<section class="poll-hero">
    <div>
        <h2 id="pageTitle">투표</h2>
        <p id="pageDescription">의사결정을 투표로 정리합니다.</p>
    </div>
    <div class="poll-hero-actions">
<button type="button" class="poll-open-create-btn" onclick="openPollCreateModal()">+ 투표 만들기</button>
    </div>
</section>

<div class="poll-page-content">
    <section class="poll-card poll-detail-card">
        <div class="poll-detail-header">
            <h3>선택한 투표</h3>
            <span class="poll-detail-guide">목록에서 투표를 선택해 확인하세요.</span>
        </div>
        <div id="activePollArea" class="poll-loading-state">
            <div class="poll-empty-icon">📊</div>
            <p class="poll-empty-title">투표를 불러오는 중입니다.</p>
        </div>
    </section>

    <aside class="poll-card poll-side-panel">
        <div class="poll-tabs" role="tablist" aria-label="투표 목록 구분">
            <button type="button" id="activePollTab" class="poll-tab active" role="tab" aria-selected="true" onclick="switchPollTab('active')">
                진행 중 <span id="activePollCount" class="poll-list-count">0</span>
            </button>
            <button type="button" id="pastPollTab" class="poll-tab" role="tab" aria-selected="false" onclick="switchPollTab('past')">
                지난 투표 <span id="pastPollCount" class="poll-list-count">0</span>
            </button>
        </div>
        <div id="activePollPanel" class="poll-tab-content active" role="tabpanel">
            <div id="activePollList" class="poll-history-list">
                <div class="poll-list-empty"><div class="poll-empty-icon">📊</div><p class="poll-empty-title">진행 중인 투표를 불러오는 중입니다.</p></div>
            </div>
        </div>
        <div id="pastPollPanel" class="poll-tab-content" role="tabpanel">
            <div id="pastPollList" class="poll-history-list">
                <div class="poll-list-empty"><div class="poll-empty-icon">🗂️</div><p class="poll-empty-title">지난 투표를 불러오는 중입니다.</p></div>
            </div>
        </div>
    </aside>
</div>

<div id="pollFormModal" class="poll-modal" aria-hidden="true" inert>
    <div class="poll-modal-backdrop" onclick="closePollFormModal()"></div>
    <div class="poll-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="pollFormTitle">
        <div class="poll-modal-body">
            <div class="poll-modal-header">
                <h3 id="pollFormTitle">투표 만들기</h3>
                <button type="button" class="poll-modal-close" onclick="closePollFormModal()" aria-label="닫기">×</button>
            </div>
<div class="poll-form-row"><label>질문</label><input id="pollQuestionInput" class="poll-input" placeholder="예: 회의 시간은 언제가 좋을까요?"></div>
<div class="poll-form-row">
    <label>투표 마감</label>
    <div class="poll-deadline-grid">
        <input id="pollEndDateInput" type="date" class="poll-input poll-date-input">
        <div class="poll-time-group">
            <select id="pollEndHourInput" class="poll-input poll-time-select" aria-label="마감 시"></select>
            <span class="poll-time-colon">:</span>
            <select id="pollEndMinuteInput" class="poll-input poll-time-select" aria-label="마감 분"></select>
        </div>
    </div>
</div>
<div class="poll-form-row">
    <div class="form-label-row">
        <label>선택지</label>
        <div class="poll-option-toolbar">
            <div class="global-option-type-switch" role="radiogroup" aria-label="선택지 유형">
                <label class="poll-type-option"><input type="radio" name="pollGlobalOptionType" value="TEXT" checked onchange="switchGlobalPollOptionType(this.value)"><span>텍스트</span></label>
                <label class="poll-type-option"><input type="radio" name="pollGlobalOptionType" value="IMAGE" onchange="switchGlobalPollOptionType(this.value)"><span>이미지</span></label>
                <label class="poll-type-option"><input type="radio" name="pollGlobalOptionType" value="AUDIO" onchange="switchGlobalPollOptionType(this.value)"><span>음악</span></label>
                <label class="poll-type-option"><input type="radio" name="pollGlobalOptionType" value="VIDEO" onchange="switchGlobalPollOptionType(this.value)"><span>영상</span></label>
            </div>
            <button type="button" class="poll-add-option" onclick="addPollOptionRow()" title="선택지 추가">+</button>
            <button type="button" class="poll-remove-last" onclick="removeLastPollOptionRow()" title="마지막 선택지 삭제">−</button>
        </div>
    </div>
    <div id="pollOptionInputs" class="poll-option-input-list"></div>
    <input id="pollImageBulkInput" class="poll-image-bulk-input" type="file" accept="image/*" multiple hidden>
</div>
<div class="poll-form-actions">
    <button type="button" id="pollSubmitButton" class="poll-create-btn" onclick="savePoll()">투표 생성</button>
</div>
        </div>
    </div>
</div>

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
    initializeImageBulkDrop();
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
    if(event.key==='Escape')closePollFormModal();
});

function initializePollPage(){
    const isProject=scope==='PROJECT';
    document.getElementById('pageTitle').innerText=isProject?'프로젝트 투표':'워크스페이스 투표';
    document.getElementById('pageDescription').innerText=isProject?'프로젝트 안에서 필요한 의사결정을 투표로 정리합니다.':'워크스페이스 전체 구성원이 참여하는 의사결정을 투표로 정리합니다.';
    const back=document.getElementById('backLink');
    back.href=isProject?'/project/main?wsId='+encodeURIComponent(wsId||'')+'&projId='+encodeURIComponent(projId||''):'/workspace/main?wsId='+encodeURIComponent(wsId||'');
    back.innerText=isProject?'⬅ 프로젝트로 돌아가기':'⬅ 워크스페이스로 돌아가기';
}

function initializeDeadlineDefaults(){
    const date=new Date();
    date.setDate(date.getDate()+1);
    document.getElementById('pollEndDateInput').value=formatDateInput(date);

    const hour=document.getElementById('pollEndHourInput');
    const minute=document.getElementById('pollEndMinuteInput');
    for(let h=0;h<24;h++){const v=String(h).padStart(2,'0');hour.insertAdjacentHTML('beforeend','<option value="'+v+'" '+(v==='18'?'selected':'')+'>'+v+'</option>');}
    for(let m=0;m<60;m+=10){const v=String(m).padStart(2,'0');minute.insertAdjacentHTML('beforeend','<option value="'+v+'" '+(v==='00'?'selected':'')+'>'+v+'</option>');}
}

function buildScopeQuery(){
    let q='scope='+encodeURIComponent(scope)+'&wsId='+encodeURIComponent(wsId||'');
    if(scope==='PROJECT')q+='&projId='+encodeURIComponent(projId||'');
    return q;
}

function addPollOptionRow(initialData){
    const list=document.getElementById('pollOptionInputs');
    const row=document.createElement('div');
    const text=initialData?(initialData.text||initialData.TEXT||''):'';
    const imagePath=initialData?(initialData.imagePath||initialData.IMAGE_PATH||''):'';
    const storedType=initialData
        ? String(initialData.optionType||initialData.OPTION_TYPE||'').toUpperCase()
        : '';

    // 과거 BOTH 데이터도 이미지 선택지로 취급
    if(initialData && ['IMAGE','AUDIO','VIDEO'].includes(storedType)){ globalOptionType=storedType; } else if(initialData && imagePath){ globalOptionType='IMAGE'; }

    row.className='poll-option-edit-row '+globalOptionType.toLowerCase()+'-mode';
    row.dataset.optionId=initialData?(initialData.optionId||initialData.OPTION_ID||''):'';
    row.dataset.existingImagePath=imagePath||'';
    row.innerHTML=
        '<span class="option-number"></span>'+
        '<div class="poll-option-edit-main">'+
            '<input class="poll-input poll-option-text-input" placeholder="선택지 내용" value="'+escapeHtml(globalOptionType==='TEXT'?text:'')+'">'+
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
    ensureImageUploadTile();
}

function updateImageEditorLayout(){
    const isImage=globalOptionType==='IMAGE';
    const list=document.getElementById('pollOptionInputs');
    const dialog=document.querySelector('#pollFormModal .poll-modal-dialog');
    if(list)list.classList.toggle('image-edit-grid',isImage);
    if(dialog){
        dialog.classList.toggle('image-edit-mode',isImage);
        dialog.classList.toggle('text-edit-mode',!isImage);
    }
    ensureImageUploadTile();
}

function switchGlobalPollOptionType(type){
    globalOptionType=['IMAGE','AUDIO','VIDEO'].includes(type)?type:'TEXT';
    updateImageBulkDropVisibility();
    updateImageEditorLayout();

    document.querySelectorAll('.poll-option-edit-row').forEach(function(row){
        row.classList.remove('text-mode','image-mode','audio-mode','video-mode'); row.classList.add(globalOptionType.toLowerCase()+'-mode');

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

function setGlobalOptionType(type){
    globalOptionType=['IMAGE','AUDIO','VIDEO'].includes(type)?type:'TEXT';
    updateImageBulkDropVisibility();
    updateImageEditorLayout();
    const input=document.querySelector('input[name="pollGlobalOptionType"][value="'+globalOptionType+'"]');
    if(input)input.checked=true;

    document.querySelectorAll('.poll-option-edit-row').forEach(function(row){
        row.classList.remove('text-mode','image-mode','audio-mode','video-mode'); row.classList.add(globalOptionType.toLowerCase()+'-mode');
    });
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
    });
    const minus=document.querySelector('.poll-remove-last');
    if(minus)minus.disabled=rows.length<=2;
    ensureImageUploadTile();
}

function ensureImageUploadTile(){
    const list=document.getElementById('pollOptionInputs');
    if(!list)return;

    let drop=document.getElementById('pollImageBulkDrop');
    if(globalOptionType!=='IMAGE'){
        if(drop)drop.remove();
        return;
    }

    if(!drop){
        drop=document.createElement('label');
        drop.id='pollImageBulkDrop';
        drop.className='poll-image-bulk-drop';
        drop.setAttribute('for','pollImageBulkInput');
        drop.innerHTML=
            '<div class="poll-upload-tile-content">'+
                '<span class="poll-upload-plus">＋</span>'+
                '<strong>이미지 추가</strong>'+
                '<span>클릭하거나 여러 장을<br>드래그하세요</span>'+
            '</div>';
        bindImageUploadTileEvents(drop);
    }

    // 생성 시 기본 이미지 2개 다음의 3번째 칸,
    // 수정 시 기존 마지막 이미지 바로 다음 칸에 항상 배치
    list.appendChild(drop);
}

function updateImageBulkDropVisibility(){
    ensureImageUploadTile();
}

function bindImageUploadTileEvents(drop){
    if(!drop || drop.dataset.bound==='true')return;
    drop.dataset.bound='true';

    ['dragenter','dragover'].forEach(function(name){
        drop.addEventListener(name,function(event){
            event.preventDefault();
            event.stopPropagation();
            if(globalOptionType==='IMAGE')drop.classList.add('dragover');
        });
    });

    ['dragleave','drop'].forEach(function(name){
        drop.addEventListener(name,function(event){
            event.preventDefault();
            event.stopPropagation();
            drop.classList.remove('dragover');
        });
    });

    drop.addEventListener('drop',function(event){
        if(globalOptionType!=='IMAGE')return;
        assignImageFilesToRows(Array.from(event.dataTransfer.files||[]));
    });
}

function initializeImageBulkDrop(){
    const input=document.getElementById('pollImageBulkInput');
    if(!input)return;

    ensureImageUploadTile();
    input.addEventListener('change',function(){
        assignImageFilesToRows(Array.from(input.files||[]));
        input.value='';
    });
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

function assignImageFilesToRows(files){
    const images=files.filter(function(file){return file.type&&file.type.startsWith('image/');});
    if(images.length===0){alert('이미지 파일만 넣을 수 있습니다.');return;}

    setGlobalOptionType('IMAGE');
    const targets=Array.from(document.querySelectorAll('.poll-option-edit-row')).filter(isPollOptionRowEmpty);

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
                if(type==='IMAGE'){
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
            endDt:endDate+' '+endHour+':'+endMinute
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

        const deadline=new Date(data.endDt);
        if(!Number.isNaN(deadline.getTime())){
            document.getElementById('pollEndDateInput').value=formatDateInput(deadline);
            document.getElementById('pollEndHourInput').value=String(deadline.getHours()).padStart(2,'0');
            document.getElementById('pollEndMinuteInput').value=String(Math.floor(deadline.getMinutes()/10)*10).padStart(2,'0');
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

        setGlobalOptionType(['IMAGE','AUDIO','VIDEO'].includes(firstType) ? firstType : ((firstType==='BOTH'||!!firstImagePath)?'IMAGE':'TEXT'));

        editOptions.forEach(function(option){addPollOptionRow(option);});
        while(list.children.length<2)addPollOptionRow();

        setOptionInputsDisabled(false);
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

function renderMainEmptyState(){
    const target=document.getElementById('activePollArea');
    target.className='poll-empty-state';
    target.innerHTML='<div class="poll-empty-icon">🗳️</div>'+ 
        '<p class="poll-empty-title">아직 선택된 투표가 없습니다.</p>'+ 
        '<p class="poll-empty-description">오른쪽 목록에서 투표를 선택하거나 새 투표를 만들어 구성원의 의견을 모아보세요.</p>'+ 
        '<button type="button" class="poll-empty-action" onclick="openPollCreateModal()">+ 새 투표 만들기</button>';
}

function renderListEmptyState(type){
    const active=type==='active';
    return '<div class="poll-list-empty">'+
        '<div class="poll-empty-icon">'+(active?'📊':'🗂️')+'</div>'+
        '<p class="poll-empty-title">'+(active?'진행 중인 투표가 없습니다.':'아직 종료된 투표가 없습니다.')+'</p>'+
        '<p class="poll-empty-description">'+(active?'의견을 모아야 할 주제가 생기면 새 투표를 시작해보세요.':'완료된 투표 결과가 이곳에 차곡차곡 쌓입니다.')+'</p>'+
        (active?'<button type="button" class="poll-empty-action" onclick="openPollCreateModal()">+ 새 투표 만들기</button>':'')+
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
        document.getElementById('activePollList').innerHTML='<div class="poll-list-empty"><div class="poll-empty-icon">⚠️</div><p class="poll-empty-title">투표 목록을 불러오지 못했습니다.</p></div>';
        document.getElementById('pastPollList').innerHTML='<div class="poll-list-empty"><div class="poll-empty-icon">⚠️</div><p class="poll-empty-title">투표 목록을 불러오지 못했습니다.</p></div>';
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

async function loadPollDetail(pollId){
    const target=document.getElementById('activePollArea');
    target.className='poll-loading-state';target.innerHTML='<div class="poll-empty-icon">📊</div><p class="poll-empty-title">투표를 불러오는 중입니다.</p>';
    try{
        const res=await fetch('/api/polls/detail?pollId='+encodeURIComponent(pollId));
        const data=await res.json();
        renderPollDetail(data);
    }catch(err){console.error(err);target.className='poll-empty-state';target.innerHTML='<div class="poll-empty-icon">⚠️</div><p class="poll-empty-title">투표를 불러오지 못했습니다.</p><p class="poll-empty-description">잠시 후 다시 시도해주세요.</p>';}
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
    const isImagePoll=firstOptionType==='IMAGE';
    const isAudioPoll=firstOptionType==='AUDIO';
    const isVideoPoll=firstOptionType==='VIDEO';
    pendingVoteOptionId=hasVoted?myOptionId:null;

    let html='';

    html+='<div class="poll-detail-title-row">';
    html+='<div class="poll-title-with-status">';
    html+='<p class="active-poll-question">'+escapeHtml(data.question)+'</p>';
    html+='<em class="poll-status '+(isClosed?'closed':'active')+'">'+(isClosed?'종료':'진행 중')+'</em>'; if(Number(data.extendCount||0)>0) html+='<em class="poll-status extended">연장 '+data.extendCount+'회</em>';
    html+='</div>';

    if(data.canManage||data.canExtend){
        html+='<div class="poll-detail-title-actions">';
        if(data.canManage){ html+='<button type="button" class="poll-manage-btn" onclick="startPollEdit('+data.pollId+')">수정</button>'; }
        if(data.canExtend){ html+='<button type="button" class="poll-manage-btn extend" onclick="openPollExtendModal('+data.pollId+',\''+String(data.endDt||'').replace(/'/g,'')+'\')">연장</button>'; }
        html+='<button type="button" class="poll-manage-btn delete" onclick="deletePollItem('+data.pollId+')">삭제</button>';
        html+='</div>';
    }

    html+='</div>';
    html+='<div class="poll-detail-summary">';
    if(hasVoted&&!isClosed){
        html+='<span class="poll-summary-chip participated">✓ 참여 완료</span>';
    }else if(!isClosed){
        html+='<span class="poll-summary-chip">참여 전</span>';
    }
    if(showResults){
        html+='<span class="poll-summary-chip people">👤 '+total+'명 참여</span>';
    }else{
        html+='<span class="poll-summary-chip people">👤 결과 비공개</span>';
    }
    html+='<span class="poll-summary-chip '+(isClosed?'closed':'deadline')+'">⏰ '+formatDeadline(data.endDt,isClosed)+'</span>';
    html+='</div>';
    if(data.creatorName)html+='<div class="poll-detail-author">작성자 <strong>'+escapeHtml(data.creatorName)+'</strong></div>';

    if(isImagePoll&&!isClosed){
        html+='<div class="poll-image-guide">이미지를 누르면 바로 투표되며, 다른 이미지를 누르면 선택이 변경됩니다.</div>';
    }

    html+='<div class="poll-option-list'+(isImagePoll?' image-poll-grid':(isAudioPoll?' audio-poll-grid':(isVideoPoll?' video-poll-grid':'')))+'" data-poll-id="'+data.pollId+'">';

    options.forEach(function(opt,index){
        const id=opt.OPTION_ID||opt.optionId;
        const rawText=opt.TEXT||opt.text||'';
        const image=opt.IMAGE_PATH||opt.imagePath||'';
        const count=Number(opt.COUNT||opt.count||0);
        const selected=String(myOptionId||'')===String(id||'');
        const winner=isClosed&&showResults&&maxCount>0&&count===maxCount;
        const disabled=isClosed;
        const displayText=isVideoPoll?('영상 '+(index+1)):(isImagePoll&&image?getImageOptionLabel(rawText,index):(rawText||((isAudioPoll?'음악 ':'후보 ')+(index+1))));
        const percentage=total>0?Math.round((count/total)*100):0;
        const clickHandler=isImagePoll&&!disabled?'choosePollOption('+id+',this)':'votePoll('+data.pollId+','+id+')';

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
            html+='<span class="poll-media-card video"><span class="poll-media-number">'+(index+1)+'</span>';
            if(videoInfo.kind==='iframe'){
                html+='<iframe class="poll-video-frame" src="'+escapeHtml(videoInfo.src)+'" title="영상 선택지 '+(index+1)+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen onclick="event.stopPropagation()"></iframe>';
            }else if(videoInfo.kind==='video'){
                html+='<video class="poll-video-native" controls preload="metadata" src="'+escapeHtml(videoInfo.src)+'" onclick="event.stopPropagation()"></video>';
            }else{
                html+='<a class="poll-video-open" href="'+escapeHtml(image)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">▶ 영상 열기</a>';
            }
            html+='</span>';
        }
        html+='<span class="poll-option-bottom">'+(image?'':'<span class="text-option-number-group"><span class="option-number">'+(index+1)+'</span></span>')+'<span class="text-option-label-group"><span class="poll-option-text">'+escapeHtml(displayText||('후보 '+(index+1)))+'</span>'+(!image&&winner?'<span class="text-winner-crown" aria-label="최다 득표">👑</span>':'')+'</span>';
        if(showResults){
            html+='<span class="poll-result-meta">'+(!image&&selected?'<span class="text-choice-label">✓ 내 선택</span>':'')+(winner?'<span class="poll-winner-text">최다 득표</span>':'')+'<span class="poll-count">'+count+'표</span>'+(isImagePoll?'<span aria-hidden="true">·</span><span class="poll-percentage">'+percentage+'%</span>':'')+'</span>';
        }
        html+='</span>'+(useMediaCard?'</div>':'</button>');
    });

    html+='</div>';
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
    if(voteInFlight)return;
    voteInFlight=true;
    try{
        const res=await fetch('/api/polls/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId:pollId,optionId:optionId})});
        const result=await res.json();
        if(!result||result.success===false){alert(result&&result.message==='LOGIN_REQUIRED'?'로그인이 필요합니다.':(result&&result.message?result.message:'투표 반영에 실패했습니다.'));return;}
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

        return '<div class="poll-history-item '+(String(selectedPollId)===String(id)?'active':'')+'" onclick="selectPollFromList('+id+')">'+
            '<div>'+
                '<div class="poll-list-title-row">'+
                    '<strong>'+escapeHtml(p.QUESTION||p.question||'질문 없음')+'</strong>'+
                '</div>'+
                '<span>'+((p.CREATOR_NAME||p.creatorName)?'작성자 '+escapeHtml(p.CREATOR_NAME||p.creatorName)+' · ':'')+formatDateTime(p.END_DT||p.endDt)+' 마감</span>'+
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
