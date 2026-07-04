<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>일정 작성</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/commonShareModal.css?v=calendar-share-v3">
<style>

:root{
    --moyo-blue:#3f7cff;
    --moyo-mint:#0a2b27;
    --moyo-purple:#8b5cf6;
    --moyo-ink:#14213d;
    --moyo-muted:#7b8aa3;
    --moyo-line:#dfe8f5;
    --moyo-soft:#f3f8ff;
    --moyo-bg:#f7fbff;
    --moyo-left-line-width:640px;
    --moyo-left-control-width:640px;
    --moyo-left-label-col:44px;
    --moyo-left-col-gap:9px;
    --moyo-date-col-width:170px;
    --moyo-time-col-width:142px;
    --moyo-all-day-width:76px;
    --moyo-date-type-width:86px;
    --moyo-repeat-choice-width:142px;
    --moyo-repeat-align-width:350px;
    --moyo-repeat-control-width:297px;
    --moyo-repeat-type-width:108px;
    --moyo-repeat-interval-width:118px;
    --moyo-repeat-unit-width:46px;
    --moyo-repeat-end-check-width:104px;
    --moyo-repeat-end-date-width:184px;
}
*{box-sizing:border-box;}
html,body{
    margin:0;
    min-height:100%;
    background:var(--moyo-bg);
    color:var(--moyo-ink);
    font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    overflow-x:hidden;
}
button,input,select,textarea{font:inherit;}
button{cursor:pointer;}
button:disabled{cursor:not-allowed;opacity:.55;}
[hidden],.moyo-event-hidden,.moyo-repeat-detail[hidden],.moyo-native-hidden{display:none!important;}

.moyo-event-page{
    width:100%;
    margin:0;
    padding:0 32px 42px;
}
.moyo-event-form{margin:0;}
.moyo-event-head{
    min-height:96px;
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:24px;
    margin:0 -32px 20px;
    padding:22px 32px 16px;
    border-bottom:1px solid rgba(211,224,241,.92);
    background:linear-gradient(135deg,#eef8ff 0%,#f4f1ff 100%);
}
.moyo-event-head-main{min-width:0;}
.moyo-event-back{
    display:inline-flex;
    align-items:center;
    gap:6px;
    margin:0 0 11px;
    padding:0;
    border:0;
    background:transparent;
    color:#64758d;
    font-size:13px;
    font-weight:600;
    line-height:1.2;
}
.moyo-event-back:hover{color:var(--moyo-blue);}
.moyo-event-titleline{
    display:flex;
    align-items:flex-end;
    flex-wrap:wrap;
    gap:12px;
    min-width:0;
}
.moyo-event-titleline h1{
    margin:0;
    color:#071a33;
    font-size:28px;
    line-height:1.12;
    font-weight:700;
    letter-spacing:-.8px;
}
.moyo-event-titleline p{
    margin:0 0 3px;
    color:#65758d;
    font-size:14px;
    line-height:1.45;
}
.moyo-event-actions{
    display:flex;
    align-items:center;
    justify-content:flex-end;
    gap:8px;
    flex:0 0 auto;
    padding-top:18px;
}
.moyo-event-btn{
    height:40px;
    min-width:74px;
    padding:0 17px;
    border:1px solid #d6e3f4;
    border-radius:14px;
    background:rgba(255,255,255,.8);
    color:#31425c;
    font-size:13px;
    font-weight:700;
    line-height:40px;
    box-shadow:none;
}
.moyo-event-btn.primary{
    min-width:96px;
    height:40px;
    border:0;
    color:#fff;
    background:linear-gradient(135deg,#48d0cf,#5968ee);
    box-shadow:0 10px 22px rgba(67,108,231,.22);
}
.moyo-event-btn.danger{
    border-color:#ffd3d7;
    background:#fff;
    color:#ef4452;
}

.moyo-event-layout{
    display:grid;
    grid-template-columns:minmax(760px,900px) 360px;
    gap:36px;
    align-items:start;
    justify-content:space-between;
}
.moyo-event-primary{min-width:0;}
.moyo-event-secondary{
    min-width:0;
    padding-left:22px;
    border-left:1px solid rgba(216,226,241,.78);
}
.moyo-event-block{
    width:100%;
    margin:0 0 16px;
    padding:0 0 16px;
    border-bottom:1px solid rgba(211,224,241,.9);
}
.moyo-event-primary .moyo-event-block{
    width:min(100%,var(--moyo-left-line-width));
}
.moyo-event-primary .moyo-event-block:first-child{
    padding-top:0;
}
.moyo-event-block:last-child{margin-bottom:0;}
.moyo-event-secondary .moyo-event-block{
    margin:0;
    padding:0;
    border-bottom:0;
}
.moyo-event-block-title{
    margin:0 0 10px;
    color:#21334e;
    font-size:13px;
    font-weight:700;
    line-height:1.25;
    letter-spacing:-.2px;
}
.moyo-event-label{
    display:block;
    margin:0 0 7px;
    color:#263851;
    font-size:13px;
    font-weight:700;
    letter-spacing:-.2px;
}
.moyo-event-primary>.moyo-event-block>.moyo-event-label{
    margin:0 0 10px;
    color:#21334e;
    font-size:13px;
    font-weight:700;
    line-height:1.25;
}
.moyo-event-grid{display:grid;gap:12px;}
.moyo-event-field{min-width:0;}

.moyo-event-input,
.moyo-event-select,
.moyo-event-textarea,
.moyo-date-compact-select,
.moyo-date-compact-button{
    width:100%;
    min-width:0;
    border:1px solid #d5e2f2;
    border-radius:13px;
    background:rgba(255,255,255,.84);
    color:#1a2a42;
    outline:0;
    box-shadow:none;
}
.moyo-event-input,
.moyo-event-select,
.moyo-date-compact-select,
.moyo-date-compact-button{
    height:40px;
    padding:0 13px;
    font-size:13px;
}
.moyo-event-textarea{
    height:126px;
    min-height:126px;
    max-height:126px;
    padding:13px 14px;
    resize:none;
    overflow:auto;
    font-size:13px;
    line-height:1.5;
}
.moyo-event-input::placeholder,
.moyo-event-textarea::placeholder{color:#9aa8bc;font-weight:400;}
.moyo-event-input:focus,
.moyo-event-select:focus,
.moyo-event-textarea:focus,
.moyo-date-compact-select:focus,
.moyo-date-compact-button:focus{
    border-color:#96b8ff;
    background:#fff;
    box-shadow:0 0 0 3px rgba(63,124,255,.1);
}

.moyo-title-compose{
    width:min(100%,var(--moyo-left-control-width));
    display:grid;
    grid-template-columns:minmax(0,1fr) 42px;
    align-items:center;
    justify-content:start;
    gap:10px;
}
.moyo-title-type-button{
    width:42px;
    height:36px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:0;
    padding:0;
    border:1px solid #d5e2f2;
    border-radius:13px;
    background:#fff;
    color:#1f3555;
    font-size:12px;
    font-weight:850;
    letter-spacing:-.2px;
    white-space:nowrap;
    cursor:pointer;
    transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease,transform .16s ease;
}
.moyo-title-type-button:hover,
.moyo-title-type-button.is-open{
    border-color:#b7c9e6;
    background:#f8fbff;
    color:#2563eb;
}
.moyo-title-type-icon{
    width:20px;
    height:20px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border-radius:8px;
    background:#eef5ff;
    color:#3f7cff;
    font-size:13px;
    line-height:1;
    flex:0 0 auto;
}
.moyo-title-type-label{
    position:absolute;
    width:1px;
    height:1px;
    margin:-1px;
    padding:0;
    border:0;
    overflow:hidden;
    clip:rect(0 0 0 0);
    white-space:nowrap;
}
.moyo-title-type-button.is-empty{
    color:#31435e;
    border-color:#dbe5f2;
    background:#fff;
}
.moyo-title-type-button:not(.is-empty){
    border-color:#9dbaff;
    background:#f3f7ff;
}
.moyo-public-inline{
    margin-top:8px;
    max-width:var(--moyo-left-control-width);
}
.moyo-public-setting{
    display:flex;
    align-items:center;
    justify-content:flex-start;
    gap:10px;
    min-height:32px;
    padding:0;
    border:0;
    border-radius:0;
    background:transparent;
}
.moyo-public-setting-copy{
    min-width:0;
    display:flex;
    align-items:center;
    color:#8797ad;
    font-size:12px;
    font-weight:600;
    line-height:1.35;
}
.moyo-public-setting-desc{
    color:#8797ad;
    font-size:12px;
    font-weight:600;
    line-height:1.35;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
}
.moyo-public-check{
    min-height:32px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:6px;
    padding:0 13px;
    border:1px solid #d7e2ef;
    border-radius:999px;
    background:#fff;
    color:#7b8da5;
    font-size:12px;
    font-weight:850;
    white-space:nowrap;
    cursor:pointer;
    flex:0 0 auto;
    transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease,transform .16s ease;
}
.moyo-public-check:hover{
    border-color:#b8c9de;
    background:#f8fbff;
    color:#64748b;
}
.moyo-public-mascot{
    width:18px;
    height:18px;
    object-fit:contain;
    flex:0 0 auto;
    opacity:.55;
    filter:grayscale(1);
    transition:opacity .16s ease,filter .16s ease;
}
.moyo-public-check::after{
    content:'✓';
    display:none;
    align-items:center;
    justify-content:center;
    width:auto;
    height:auto;
    margin-left:1px;
    color:#408bff;
    font-size:12px;
    font-weight:900;
    line-height:1;
}
.moyo-public-check input{
    position:absolute;
    width:1px;
    height:1px;
    margin:-1px;
    padding:0;
    border:0;
    overflow:hidden;
    clip:rect(0 0 0 0);
    white-space:nowrap;
}
#moyoVisibilityField.is-active .moyo-public-check{
    border-color:rgba(64,139,255,.55);
    background:rgba(64,139,255,.06);
    color:#2563eb;
    box-shadow:none;
}
#moyoVisibilityField.is-active .moyo-public-mascot{
    opacity:1;
    filter:none;
}
#moyoVisibilityField.is-active .moyo-public-check::after{
    display:inline-flex;
}
.moyo-event-scope-warning{
    margin:10px 0 0;
    padding:10px 12px;
    border:1px solid #ffe2b8;
    border-radius:13px;
    background:#fff8ed;
    color:#b66700;
    font-size:12px;
    font-weight:600;
}

.moyo-date-time-stack{
    width:min(100%,var(--moyo-left-control-width));
    display:grid;
    gap:7px;
}
.moyo-date-time-row{
    display:grid;
    grid-template-columns:var(--moyo-left-label-col) var(--moyo-date-col-width) var(--moyo-time-col-width);
    align-items:center;
    gap:9px;
}
.moyo-date-time-row>.moyo-event-label{
    margin:0;
    height:36px;
    display:flex;
    align-items:center;
    color:#566780;
    font-size:13px;
    font-weight:700;
    line-height:1;
    letter-spacing:-.2px;
}
.moyo-date-time-fields{display:contents;}

.moyo-time-picker-field{
    position:relative;
    min-width:0;
    display:flex;
    align-items:center;
    height:36px;
    border:1px solid #d7e4f5;
    border-radius:14px;
    background:#fff;
    transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;
}
.moyo-time-picker-field:focus-within{
    border-color:#8fb2ff;
    box-shadow:0 0 0 3px rgba(79,124,255,.12);
}
.moyo-time-meridiem{
    flex:0 0 auto;
    margin-left:7px;
    padding:3px 6px;
    border-radius:999px;
    background:#eef5ff;
    color:#245eea;
    font-size:11px;
    font-weight:900;
    line-height:1;
    letter-spacing:-.2px;
    transition:background .14s ease,color .14s ease,border-color .14s ease;
}
.moyo-time-meridiem.is-am{
    background:#e9fbf7;
    color:#0f9f8f;
}
.moyo-time-meridiem.is-pm{
    background:#eef4ff;
    color:#245eea;
}
.moyo-time-picker-field .moyo-time-input{
    height:34px;
    min-width:0;
    flex:0 0 46px;
    width:46px;
    padding:0 3px 0 6px;
    border:0;
    background:transparent;
    box-shadow:none;
    font-variant-numeric:tabular-nums;
}
.moyo-time-picker-field .moyo-time-input:focus{box-shadow:none;outline:0;}
.moyo-time-picker-trigger{
    flex:0 0 auto;
    width:24px;
    height:24px;
    margin-left:auto;
    margin-right:6px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border:0;
    border-radius:999px;
    background:transparent;
    color:#6f829b;
    font-size:0;
    line-height:1;
    cursor:pointer;
    transition:background .14s ease,color .14s ease;
}
.moyo-time-picker-trigger::before{
    content:"";
    width:16px;
    height:16px;
    display:block;
    background:currentColor;
    -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='8.4'/%3E%3Cpath d='M12 7.2v4.9l3 1.8'/%3E%3C/svg%3E") center/16px 16px no-repeat;
    mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='8.4'/%3E%3Cpath d='M12 7.2v4.9l3 1.8'/%3E%3C/svg%3E") center/16px 16px no-repeat;
}
.moyo-time-picker-field:focus-within .moyo-time-picker-trigger{color:#4f7cff;}
.moyo-time-picker-trigger:hover{background:#eef5ff;color:#2f6dff;}
.moyo-time-picker-trigger:focus{outline:0;box-shadow:none;}
.moyo-time-picker-trigger:disabled{cursor:default;opacity:.45;background:transparent;}
.moyo-time-picker-field.is-disabled{opacity:.55;background:#f6f9fd;}
.moyo-time-picker-menu{
    position:fixed;
    z-index:1400;
    width:268px;
    padding:11px;
    border:1px solid #d6e3f4;
    border-radius:18px;
    background:#fff;
    box-shadow:0 14px 34px rgba(22,48,86,.14);
}
.moyo-time-picker-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:10px;
}
.moyo-time-picker-title{
    color:#20324d;
    font-size:13px;
    font-weight:850;
    letter-spacing:-.2px;
}
.moyo-time-picker-now{
    height:26px;
    padding:0 9px;
    border:1px solid #d7e4f5;
    border-radius:999px;
    background:#f8fbff;
    color:#55708f;
    font-size:12px;
    font-weight:800;
    cursor:pointer;
}
.moyo-time-picker-now:hover{border-color:#a9c5ff;color:#2563eb;background:#f3f7ff;}
.moyo-time-picker-ampm{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:6px;
    margin-bottom:9px;
}
.moyo-time-picker-ampm button,
.moyo-time-picker-grid button{
    border:1px solid #d8e5f5;
    background:#fff;
    color:#263951;
    cursor:pointer;
    font-weight:800;
    transition:background .14s ease,border-color .14s ease,color .14s ease,box-shadow .14s ease;
}
.moyo-time-picker-ampm button{
    height:30px;
    border-radius:10px;
    font-size:13px;
}
.moyo-time-picker-grid button{
    height:30px;
    border-radius:10px;
    font-size:12px;
    font-variant-numeric:tabular-nums;
}
.moyo-time-picker-ampm button:hover,
.moyo-time-picker-grid button:hover{border-color:#aac7ff;background:#f5f8ff;color:#2563eb;}
.moyo-time-picker-ampm button[data-meridiem="AM"]{
    background:#fbfffe;
}
.moyo-time-picker-ampm button[data-meridiem="PM"]{
    background:#fbfcff;
}
.moyo-time-picker-ampm button[data-meridiem="AM"]:hover{
    border-color:#8adfd2;
    background:#effdfa;
    color:#0f9f8f;
}
.moyo-time-picker-ampm button[data-meridiem="PM"]:hover{
    border-color:#aac7ff;
    background:#f3f7ff;
    color:#245eea;
}
.moyo-time-picker-ampm button.is-selected,
.moyo-time-picker-grid button.is-selected{
    border-color:#5d86ff;
    background:#eef4ff;
    color:#245eea;
    box-shadow:inset 0 0 0 1px rgba(93,134,255,.18);
}
.moyo-time-picker-ampm button[data-meridiem="AM"].is-selected{
    border-color:#5ad0c0;
    background:#e9fbf7;
    color:#0f9f8f;
    box-shadow:inset 0 0 0 1px rgba(90,208,192,.20);
}
.moyo-time-picker-ampm button[data-meridiem="PM"].is-selected{
    border-color:#5d86ff;
    background:#eef4ff;
    color:#245eea;
    box-shadow:inset 0 0 0 1px rgba(93,134,255,.18);
}
.moyo-time-picker-section{margin-top:8px;}
.moyo-time-picker-label{
    margin:0 0 6px;
    color:#6a7a90;
    font-size:12px;
    font-weight:850;
    letter-spacing:-.2px;
}
.moyo-time-picker-grid{
    display:grid;
    grid-template-columns:repeat(6,1fr);
    gap:5px;
}
.moyo-time-picker-foot{
    margin-top:8px;
    color:#8a98ab;
    font-size:11px;
    line-height:1.35;
}

.moyo-date-picker-menu{
    position:fixed;
    z-index:1390;
    width:248px;
    padding:10px;
    border:1px solid rgba(126,164,255,.28);
    border-radius:17px;
    background:#fff;
    box-shadow:0 14px 28px rgba(30,64,122,.12);
    overflow:hidden;
}
.moyo-date-picker-head{
    position:relative;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:7px;
    margin:0 0 9px;
}
.moyo-date-picker-title{
    min-width:0;
    display:inline-flex;
    align-items:center;
    gap:6px;
    color:#162842;
    font-size:13px;
    font-weight:950;
    letter-spacing:-.35px;
}
.moyo-date-picker-title-text{white-space:nowrap;}
.moyo-date-picker-nav{
    display:flex;
    gap:4px;
}
.moyo-date-picker-nav button,
.moyo-date-picker-today{
    border:1px solid #d7e4f5;
    background:rgba(255,255,255,.78);
    color:#55708f;
    cursor:pointer;
    font-weight:900;
    transition:background .14s ease,border-color .14s ease,color .14s ease,box-shadow .14s ease;
}
.moyo-date-picker-nav button{
    width:25px;
    height:25px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border-radius:999px;
    font-size:13px;
    line-height:1;
}
.moyo-date-picker-nav button:hover,
.moyo-date-picker-today:hover{
    border-color:#9fc0ff;
    background:#f3f7ff;
    color:#2563eb;
    box-shadow:0 5px 12px rgba(79,124,255,.12);
}
.moyo-date-picker-weekdays,
.moyo-date-picker-days{
    position:relative;
    display:grid;
    grid-template-columns:repeat(7,1fr);
    gap:3px;
}
.moyo-date-picker-weekdays{
    margin-bottom:4px;
}
.moyo-date-picker-weekdays span{
    height:20px;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#7c8aa0;
    font-size:11px;
    font-weight:900;
}
.moyo-date-picker-weekdays span:first-child{color:#ff6b87;}
.moyo-date-picker-weekdays span:last-child{color:#4f7cff;}
.moyo-date-picker-day{
    height:27px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border:1px solid transparent;
    border-radius:10px;
    background:transparent;
    color:#24364f;
    font-size:12px;
    font-weight:850;
    font-variant-numeric:tabular-nums;
    cursor:pointer;
    transition:background .14s ease,border-color .14s ease,color .14s ease,box-shadow .14s ease,transform .14s ease;
}
.moyo-date-picker-day:nth-child(7n+1){color:#ff5d7a;}
.moyo-date-picker-day:nth-child(7n){color:#4f7cff;}
.moyo-date-picker-day:hover{
    border-color:#aac7ff;
    background:#f5f8ff;
    color:#2563eb;
    transform:translateY(-1px);
}
.moyo-date-picker-day.is-muted{color:#b1bdca!important;font-weight:750;}
.moyo-date-picker-day.is-today{
    border-color:#64d6ca;
    color:#0f9f8f;
    background:#eefcf9;
}
.moyo-date-picker-day.is-selected{
    border-color:transparent;
    background:#5d7cff;
    color:#fff!important;
    box-shadow:0 7px 14px rgba(79,124,255,.18);
}
.moyo-date-picker-day.is-selected.is-muted{color:#fff!important;}
.moyo-date-picker-foot{
    position:relative;
    margin-top:8px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:6px;
}
.moyo-date-picker-today{
    height:25px;
    padding:0 9px;
    border-radius:999px;
    font-size:11px;
}
.moyo-date-input{
    cursor:pointer;
    padding-right:36px;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2355708f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='4'/%3E%3Cpath d='M16 2v4M8 2v4M3 10h18'/%3E%3C/svg%3E");
    background-repeat:no-repeat;
    background-position:right 13px center;
    background-size:15px 15px;
}
.moyo-date-input:focus{
    border-color:#a9c5ff;
    box-shadow:0 0 0 2px rgba(79,124,255,.07);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%234f7cff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='4'/%3E%3Cpath d='M16 2v4M8 2v4M3 10h18'/%3E%3C/svg%3E");
    background-repeat:no-repeat;
    background-position:right 13px center;
    background-size:15px 15px;
}

.moyo-date-option-wrap{
    width:min(100%,var(--moyo-left-control-width));
    display:grid;
    grid-template-columns:var(--moyo-left-label-col) minmax(0,1fr);
    align-items:center;
    gap:9px;
    margin-top:10px;
}
.moyo-inline-label{
    height:34px;
    display:flex;
    align-items:center;
    color:#566780;
    font-size:13px;
    font-weight:800;
    letter-spacing:-.2px;
}
.moyo-date-option-row{
    width:100%;
    display:grid;
    grid-template-columns:var(--moyo-all-day-width) var(--moyo-date-type-width) var(--moyo-repeat-choice-width) minmax(0,1fr);
    align-items:center;
    gap:8px;
    margin-top:0;
    min-width:0;
}
.moyo-date-check{
    height:34px;
    display:inline-flex;
    align-items:center;
    gap:6px;
    margin:0;
    padding:0 12px;
    border:1px solid #d5e2f2;
    border-radius:999px;
    background:#fff;
    color:#273a55;
    font-size:13px;
    font-weight:750;
    white-space:nowrap;
    flex:0 0 auto;
}
.moyo-date-check input{width:15px;height:15px;margin:0;accent-color:var(--moyo-blue);}
.moyo-date-option-row .moyo-date-check{
    width:var(--moyo-all-day-width);
    justify-content:center;
    padding:0 10px;
}
.moyo-date-option-row .date-type-field,
.moyo-date-option-row .moyo-repeat-picker-wrap,
.moyo-date-option-row .timezone-field{
    width:100%;
    min-width:0;
}
.moyo-date-option-row .date-type-field .moyo-date-type-button{
    width:100%;
    min-width:0;
}
.moyo-date-option-row #repeatBtn{
    width:100%;
    min-width:0;
    max-width:none;
}
.moyo-date-check.is-locked{opacity:.58;}
.moyo-date-compact-field{position:relative;flex:0 0 auto;min-width:0;}
.moyo-date-compact-select,
.moyo-date-compact-button{
    width:auto;
    min-width:88px;
    height:34px;
    border-radius:999px;
    background:#fff;
    font-size:13px;
}
.date-type-field .moyo-date-compact-select,
.timezone-field .moyo-date-compact-select{display:none;}

.moyo-date-type-button{
    width:max-content;
    min-width:86px;
    flex:0 0 auto;
    display:inline-flex;
    align-items:center;
    justify-content:flex-start;
    position:relative;
    padding:0 30px 0 14px;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    text-align:left;
}
.moyo-date-type-button::after{
    content:'▾';
    position:absolute;
    right:12px;
    top:50%;
    transform:translateY(-50%);
    color:#6f7f95;
    font-size:11px;
    pointer-events:none;
}
.moyo-date-type-menu{
    position:absolute;
    z-index:80;
    top:calc(100% + 6px);
    left:0;
    min-width:100%;
    padding:6px;
    border:1px solid #d6e3f4;
    border-radius:14px;
    background:#fff;
    box-shadow:0 14px 34px rgba(30,64,104,.16);
}
.moyo-date-type-menu button{
    width:100%;
    min-height:30px;
    display:flex;
    align-items:center;
    padding:0 10px;
    border:0;
    border-radius:10px;
    background:transparent;
    color:#25364e;
    font-size:12.6px;
    font-weight:560;
    text-align:left;
    cursor:pointer;
}
.moyo-date-type-menu button:hover,
.moyo-date-type-menu button.is-selected{
    background:#eef5ff;
    color:#2563eb;
}
.moyo-timezone-button{
    width:100%;
    min-width:0;
    max-width:none;
    display:inline-flex;
    align-items:center;
    justify-content:flex-start;
    position:relative;
    padding:0 32px 0 14px;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    text-align:left;
}
.moyo-timezone-button::after{
    content:'▾';
    position:absolute;
    right:13px;
    top:50%;
    transform:translateY(-50%);
    color:#6f7f95;
    font-size:11px;
    pointer-events:none;
}
.moyo-timezone-menu{
    position:absolute;
    z-index:70;
    top:calc(100% + 6px);
    left:0;
    width:max-content;
    min-width:100%;
    max-width:248px;
    max-height:156px;
    overflow-y:auto;
    overscroll-behavior:contain;
    padding:6px;
    border:1px solid #d6e3f4;
    border-radius:14px;
    background:#fff;
    box-shadow:0 14px 34px rgba(30,64,104,.16);
    scrollbar-width:thin;
    scrollbar-color:#b8c6d8 transparent;
}
.moyo-timezone-menu::-webkit-scrollbar{width:6px;}
.moyo-timezone-menu::-webkit-scrollbar-thumb{background:#b8c6d8;border-radius:999px;}
.moyo-timezone-menu::-webkit-scrollbar-track{background:transparent;}
.moyo-timezone-menu button{
    width:100%;
    min-height:30px;
    display:flex;
    align-items:center;
    padding:0 10px;
    border:0;
    border-radius:10px;
    background:transparent;
    color:#25364e;
    font-size:12.6px;
    font-weight:560;
    text-align:left;
    cursor:pointer;
}
.moyo-timezone-menu button:hover,
.moyo-timezone-menu button.is-selected{
    background:#eef5ff;
    color:#2563eb;
}
.timezone-field.is-disabled .moyo-timezone-button{opacity:.58;pointer-events:none;}
.moyo-date-time-stack.is-all-day .moyo-time-picker-field{visibility:hidden;}
.moyo-event-note{
    margin:7px 0 0;
    color:#8795a8;
    font-size:12px;
    line-height:1.45;
    font-weight:400;
}
.moyo-side-note{
    margin:6px 0 0;
    color:#8795a8;
    font-size:11.8px;
    line-height:1.42;
}
.moyo-alarm-note{
    margin:0;
    color:#8795a8;
    font-size:12px;
    line-height:1.35;
}

.moyo-repeat-picker-wrap{position:relative;overflow:visible!important;}

.moyo-form-select-wrap{position:relative;overflow:visible!important;}
.moyo-form-select-native{display:none!important;}
.moyo-form-select-button{
    width:max-content;
    min-width:108px;
    max-width:232px;
    height:34px;
    display:inline-flex;
    align-items:center;
    justify-content:flex-start;
    position:relative;
    padding:0 32px 0 14px;
    border:1px solid #d5e2f2;
    border-radius:999px;
    background:#fff;
    color:#1a2a42;
    font-size:13px;
    font-weight:650;
    line-height:1;
    text-align:left;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    outline:0;
}
.moyo-form-select-button::after{
    content:'▾';
    position:absolute;
    right:13px;
    top:50%;
    transform:translateY(-50%);
    color:#6f7f95;
    font-size:11px;
    pointer-events:none;
}
.moyo-form-select-button:hover{border-color:#bfd0ea;background:#fff;}
.moyo-form-select-button:focus,
.moyo-form-select-button[aria-expanded="true"]{
    border-color:#96b8ff;
    background:#fff;
    box-shadow:0 0 0 3px rgba(63,124,255,.1);
}
.moyo-form-select-button.is-active{color:#2563eb;border-color:#b8ccff;background:#f7fbff;}
.moyo-form-select-menu{
    position:absolute;
    z-index:90;
    top:calc(100% + 6px);
    left:0;
    width:max-content;
    min-width:100%;
    max-width:248px;
    max-height:176px;
    overflow-y:auto;
    overscroll-behavior:contain;
    padding:6px;
    border:1px solid #d6e3f4;
    border-radius:14px;
    background:#fff;
    box-shadow:0 14px 34px rgba(30,64,104,.16);
    scrollbar-width:thin;
    scrollbar-color:#b8c6d8 transparent;
}
.moyo-form-select-menu::-webkit-scrollbar{width:6px;}
.moyo-form-select-menu::-webkit-scrollbar-thumb{background:#b8c6d8;border-radius:999px;}
.moyo-form-select-menu::-webkit-scrollbar-track{background:transparent;}
.moyo-form-select-menu button{
    width:100%;
    min-height:30px;
    display:flex;
    align-items:center;
    padding:0 10px;
    border:0;
    border-radius:10px;
    background:transparent;
    color:#25364e;
    font-size:12.6px;
    font-weight:560;
    text-align:left;
    cursor:pointer;
    white-space:nowrap;
}
.moyo-form-select-menu button:hover,
.moyo-form-select-menu button.is-selected{background:#eef5ff;color:#2563eb;}
.moyo-form-select-menu button[hidden]{display:none!important;}

.moyo-repeat-menu,
.moyo-type-popover{
    position:absolute;
    z-index:80;
    top:calc(100% + 6px);
    left:0;
    min-width:210px;
    border:1px solid #d6e3f4;
    border-radius:14px;
    background:#fff;
    box-shadow:0 14px 34px rgba(30,64,104,.16);
    overflow:hidden;
}
.moyo-repeat-menu{
    padding:6px;
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow:visible!important;
    overflow-y:visible!important;
    scrollbar-width:none;
}
.moyo-repeat-menu::-webkit-scrollbar{width:0;height:0;display:none;}
.moyo-repeat-menu::-webkit-scrollbar-thumb{background:transparent;}
.moyo-repeat-menu::-webkit-scrollbar-track{background:transparent;}
.moyo-repeat-menu button{
    width:100%;
    min-height:30px;
    padding:0 10px;
    border:0;
    border-radius:10px;
    background:transparent;
    color:#25364e;
    text-align:left;
    font-size:12.6px;
    font-weight:560;
    cursor:pointer;
}
.moyo-repeat-menu button:hover,
.moyo-repeat-menu button.active{background:#eef5ff;color:#2563eb;}
.moyo-repeat-menu button[hidden]{display:none!important;}
.moyo-repeat-detail{
    margin-top:-2px;
    margin-bottom:12px;
    padding-bottom:10px;
}
.moyo-repeat-detail-grid{
    width:var(--moyo-repeat-align-width);
    max-width:100%;
    display:grid;
    grid-template-columns:var(--moyo-left-label-col) var(--moyo-repeat-type-width) var(--moyo-left-label-col) var(--moyo-repeat-interval-width);
    align-items:center;
    column-gap:9px;
    row-gap:7px;
}
.moyo-repeat-detail .moyo-event-label{
    margin:0;
    height:34px;
    display:flex;
    align-items:center;
    padding-top:0;
    color:#566780;
    font-size:13px;
    font-weight:700;
    line-height:1;
    letter-spacing:-.2px;
}
.moyo-repeat-interval-wrap{
    width:var(--moyo-repeat-interval-width);
    height:34px;
    display:grid;
    grid-template-columns:58px var(--moyo-repeat-unit-width);
    align-items:center;
    column-gap:8px;
}
#recurType{width:var(--moyo-repeat-type-width);}
#recurInterval{
    width:58px;
    height:34px;
    text-align:center;
    font-weight:600;
}
.moyo-repeat-interval-wrap .moyo-event-label{
    width:var(--moyo-repeat-unit-width);
    white-space:nowrap;
}
.moyo-repeat-weekday-field,
.moyo-repeat-end-option{
    width:var(--moyo-repeat-align-width);
    max-width:100%;
    display:grid;
    align-items:center;
    column-gap:9px;
    row-gap:5px;
    margin-top:10px;
}
.moyo-repeat-weekday-field{
    grid-template-columns:var(--moyo-left-label-col) var(--moyo-repeat-control-width);
}
.moyo-repeat-end-option{
    grid-template-columns:var(--moyo-left-label-col) var(--moyo-repeat-end-check-width) var(--moyo-repeat-end-date-width);
}
.moyo-repeat-end-option>.moyo-event-label,
.moyo-repeat-weekday-field>.moyo-event-label{
    margin:0;
    height:34px;
    display:flex;
    align-items:center;
    padding-top:0;
    color:#566780;
    font-size:13px;
    font-weight:700;
    line-height:1;
    letter-spacing:-.2px;
}
.moyo-repeat-end-check{
    width:var(--moyo-repeat-end-check-width);
    max-width:var(--moyo-repeat-end-check-width);
    height:34px;
    padding:0 10px;
    flex:0 0 auto;
    justify-content:center;
}
.moyo-repeat-end-field{
    display:flex;
    align-items:center;
    min-width:0;
    min-height:34px;
}
#untilDt{width:var(--moyo-repeat-end-date-width);}
.moyo-repeat-weekday-row{
    width:var(--moyo-repeat-control-width);
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:0;
    flex-wrap:nowrap;
    min-height:34px;
}
.moyo-repeat-weekday-chip{
    width:32px;
    height:32px;
    border:1px solid #d5e2f2;
    border-radius:999px;
    background:#fff;
    color:#44546a;
    font-size:13px;
    font-weight:750;
}
.moyo-repeat-weekday-chip.active,
.moyo-repeat-weekday-chip.is-active{
    border-color:#8fb4ff;
    background:#eef5ff;
    color:#2563eb;
}
.moyo-alarm-block{
    margin-top:-8px;
    padding-top:0;
    padding-bottom:0;
    border-bottom:0;
}
.moyo-alarm-row{
    display:flex;
    align-items:center;
    flex-wrap:wrap;
    gap:10px;
}
.moyo-alarm-select{
    width:auto;
    min-width:148px;
    border-radius:999px;
    background:#fff;
}
.moyo-type-picker-wrap{position:relative;}
.moyo-type-popover{min-width:330px;padding:14px;}
.moyo-type-popover-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:10px;
    color:#20304a;
    font-size:13px;
    font-weight:800;
}
.moyo-type-popover-close{border:0;background:transparent;color:#8b98aa;font-size:20px;font-weight:700;}
.moyo-icon-type-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;}
.moyo-icon-type{
    min-height:56px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:4px;
    border:1px solid #dce8f8;
    border-radius:13px;
    background:#fff;
    color:#344762;
    font-size:12px;
    font-weight:800;
}
.moyo-icon-type .type-icon{font-size:18px;line-height:1;}
.moyo-icon-type:hover,
.moyo-icon-type.active{border-color:#9dbaff;background:#f1f6ff;color:#2f63d9;}

.moyo-event-secondary .moyo-event-grid{gap:0;}
.moyo-event-secondary .moyo-event-field{
    padding:0 0 10px;
    margin:0 0 10px;
    border-bottom:1px solid rgba(216,226,241,.68);
}
.moyo-event-secondary .moyo-event-field:last-child{margin-bottom:0;border-bottom:0;}
.moyo-event-secondary .moyo-event-label{
    margin-bottom:5px;
    color:#25364f;
    font-size:12.2px;
    font-weight:700;
}
.moyo-event-secondary .moyo-event-input,
.moyo-event-secondary .moyo-event-textarea,
.moyo-event-secondary .moyo-form-select-button{
    min-height:34px;
    font-size:12.2px;
    font-weight:560;
    border-color:#d8e4f4;
    box-shadow:none;
}
.moyo-event-secondary .moyo-event-textarea{
    min-height:84px;
    padding:9px 11px;
    line-height:1.45;
}
.moyo-event-secondary .moyo-description-field{
    margin-top:4px;
    padding-top:4px;
    padding-bottom:2px;
}
.moyo-event-secondary .moyo-description-field .moyo-event-label{
    margin-bottom:7px;
}
.moyo-event-secondary .moyo-description-field .moyo-event-textarea{
    height:92px;
    min-height:92px;
    max-height:92px;
    padding:9px 12px;
    background:rgba(255,255,255,.78);
}
.moyo-event-secondary .moyo-side-note{
    margin-top:5px;
    color:#8290a4;
    font-size:11.2px;
    line-height:1.38;
}

.moyo-event-location-wrap{
    display:grid;
    grid-template-columns:minmax(0,1fr) 58px;
    gap:6px;
}
.moyo-event-location-button{
    height:34px;
    border:1px solid #d8e4f4;
    border-radius:12px;
    background:#fff;
    color:#2f63d9;
    font-size:11.5px;
    font-weight:650;
}
.moyo-event-location-detail-wrap{margin-top:6px;}
.moyo-location-summary{
    margin:5px 0 0;
    color:#728198;
    font-size:11.2px;
    font-weight:560;
    line-height:1.38;
}
.moyo-location-preview{
    margin-top:7px;
    border:1px solid #dfe9f7;
    border-radius:15px;
    background:#fff;
    overflow:hidden;
}
.moyo-location-preview-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:9px;
    padding:7px 10px;
    border-bottom:1px solid #e8eff8;
}
.moyo-location-preview-title{display:block;color:#263851;font-size:11.2px;font-weight:700;}
.moyo-location-preview-address{display:block;margin-top:1px;color:#8190a4;font-size:10.5px;line-height:1.3;}
.moyo-location-map-link{border:0;background:transparent;color:#2f63d9;font-size:11.2px;font-weight:650;white-space:nowrap;}
.moyo-location-map-frame{display:block;width:100%;height:138px;border:0;}
.moyo-location-empty{
    min-height:68px;
    margin-top:9px;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    border:1px dashed #d8e4f4;
    border-radius:15px;
    background:rgba(255,255,255,.5);
    color:#93a0b2;
    font-size:11.5px;
    font-weight:600;
    text-align:center;
}
.moyo-location-empty[hidden]{display:none;}
.moyo-location-empty-icon{font-size:16px;line-height:1;}

.moyo-event-action-row{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:6px;
}
.moyo-event-action-card{
    min-height:35px;
    width:100%;
    min-width:0;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:6px;
    padding:0 8px;
    border:1px solid #d8e4f4;
    border-radius:12px;
    background:rgba(255,255,255,.92);
    color:#263851;
    font-size:12px;
    font-weight:640;
}
.moyo-event-action-card:hover{border-color:#b8caf3;background:#f8fbff;}
.attendee-card{max-width:none;}
.action-main{display:inline-flex;align-items:center;gap:6px;min-width:0;}
.action-icon{font-size:14px;line-height:1;}
.action-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.count-badge,.note-share-count{
    min-width:17px;
    height:16px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding:0 5px;
    border-radius:999px;
    background:#eef5ff;
    color:#4f73d9;
    font-size:9.5px;
    font-weight:680;
}
/* 오른쪽 공유/편집 권한 버튼은 2열을 유지하되 카운트 유무에 따라 정렬을 나눈다. */
.moyo-event-action-row .moyo-event-action-card{
    gap:5px;
    padding:0 7px;
    justify-content:center;
}
.moyo-event-action-row .moyo-event-action-card.has-count{
    justify-content:space-between;
}
.moyo-event-action-row .action-main{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    flex:0 0 auto;
    gap:4px;
    min-width:0;
}
.moyo-event-action-row .moyo-event-action-card.has-count .action-main{
    justify-content:flex-start;
}
.moyo-event-action-row .action-icon{
    font-size:13px;
}
.moyo-event-action-row .action-text{
    flex:0 0 auto;
    max-width:none;
    overflow:visible;
    text-overflow:clip;
    font-size:11.5px;
    font-weight:640;
    letter-spacing:-.04em;
}
.moyo-event-action-row .note-share-count{
    flex:0 0 auto;
    min-width:16px;
    height:16px;
    padding:0 5px;
    font-size:9.2px;
}
.moyo-event-selected-tags,
.moyo-attendee-selected-tags,
.note-write-share-selected{
    display:flex;
    align-items:center;
    flex-wrap:wrap;
    gap:6px;
}
.moyo-attendee-form-tags{margin-top:6px;}
.note-share-chip,
.moyo-attendee-chip{
    display:inline-flex;
    align-items:center;
    gap:5px;
    min-height:24px;
    padding:0 7px;
    border:1px solid #dfe9f7;
    border-radius:999px;
    background:#fff;
    color:#31425c;
    font-size:11.2px;
    font-weight:700;
}
.note-share-chip-remove,
.moyo-attendee-chip-remove{
    width:18px;
    height:18px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border:0;
    border-radius:999px;
    background:#f1f5fb;
    color:#738299;
    font-size:12px;
}
.note-share-chip .note-share-avatar,
.moyo-attendee-chip .note-share-avatar{
    flex:0 0 20px;
    width:20px;
    height:20px;
    min-width:20px;
    min-height:20px;
    max-width:20px;
    max-height:20px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
    border-radius:999px;
}
.note-share-chip .note-share-avatar img,
.moyo-attendee-chip .note-share-avatar img{
    width:100%;
    height:100%;
    display:block;
    object-fit:cover;
}
.note-share-chip .note-share-avatar b,
.moyo-attendee-chip .note-share-avatar b{
    font-size:10px;
    line-height:1;
}

/* 참석자 선택 태그는 공유/편집 권한 모달의 chip 흐름과 동일하게 강제 정렬 */
#calendarAttendeeModal .moyo-attendee-selected-tags.note-share-chip-list{
    display:flex!important;
    flex-direction:row!important;
    flex-wrap:wrap!important;
    align-content:flex-start!important;
    align-items:flex-start!important;
    justify-content:flex-start!important;
    gap:7px!important;
    min-height:46px!important;
    max-height:124px!important;
    padding:7px 10px!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    border-radius:16px!important;
    border:1px solid var(--moyo-share-border, #dbe8ff)!important;
    background:rgba(248,251,255,.86)!important;
    box-sizing:border-box!important;
}
#calendarAttendeeModal .moyo-attendee-selected-tags.note-share-chip-list .note-share-chip{
    flex:0 0 auto!important;
    max-width:172px!important;
    height:30px!important;
    min-height:30px!important;
    padding:3px 6px 3px 4px!important;
    gap:6px!important;
}
#calendarAttendeeModal .moyo-attendee-selected-tags.note-share-chip-list .note-share-chip-name{
    max-width:108px!important;
}
#calendarAttendeeModal .moyo-attendee-selected-tags.note-share-chip-list .note-share-chip-remove{
    flex:0 0 18px!important;
}
#calendarAttendeeFormSelected.note-share-chip-list{
    display:flex!important;
    flex-direction:row!important;
    flex-wrap:wrap!important;
    align-items:flex-start!important;
    justify-content:flex-start!important;
    gap:7px!important;
    margin-top:10px!important;
    padding:0!important;
    border:0!important;
    background:transparent!important;
    min-height:0!important;
    max-height:none!important;
    overflow:visible!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip{
    flex:0 0 auto!important;
    height:30px!important;
    min-height:30px!important;
    max-width:100%!important;
    padding:3px 6px 3px 4px!important;
    gap:6px!important;
}
/* 오른쪽 참석자 선택 칩도 공유/편집 권한 모달의 아바타 디자인을 그대로 사용 */
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip{
    max-width:172px!important;
    border:1px solid #cfe0ff!important;
    background:#fff!important;
    color:#1f2d45!important;
    box-shadow:none!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-type-ws{
    --share-accent:var(--moyo-share-mint, #58cfd0)!important;
    --share-soft:#eafffb!important;
    border-color:rgba(89,210,194,.48)!important;
    background:#f8fffd!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-type-proj{
    --share-accent:var(--moyo-share-violet, #6b65f6)!important;
    --share-soft:#f2efff!important;
    border-color:rgba(125,107,255,.38)!important;
    background:#fbfaff!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-scope-ws-member{
    --share-accent:var(--moyo-share-mint, #58cfd0)!important;
    --share-soft:#eafffb!important;
    border-color:rgba(89,210,194,.48)!important;
    background:#f8fffd!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-scope-proj-member{
    --share-accent:var(--moyo-share-violet, #6b65f6)!important;
    --share-soft:#f2efff!important;
    border-color:rgba(125,107,255,.38)!important;
    background:#fbfaff!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-type-user:not(.note-share-scope-ws-member):not(.note-share-scope-proj-member){
    --share-accent:var(--moyo-share-blue, #4f7cff)!important;
    --share-soft:#eef4ff!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip .note-write-share-avatar,
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip .note-share-avatar{
    flex:0 0 24px!important;
    width:24px!important;
    height:24px!important;
    min-width:24px!important;
    min-height:24px!important;
    max-width:24px!important;
    max-height:24px!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    overflow:hidden!important;
    border-radius:999px!important;
    background:var(--share-soft, #eef4ff)!important;
    color:var(--share-accent, #4f7cff)!important;
    font-size:10px!important;
    font-weight:900!important;
    line-height:1!important;
    box-shadow:none!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-type-ws .note-share-avatar,
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-type-proj .note-share-avatar{
    border-radius:12px!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-scope-ws-member .note-share-avatar,
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-scope-proj-member .note-share-avatar,
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip.note-share-type-user .note-share-avatar{
    border-radius:999px!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip .note-share-avatar img{
    width:100%!important;
    height:100%!important;
    display:block!important;
    object-fit:cover!important;
    border-radius:inherit!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip .note-share-avatar b{
    font-size:10px!important;
    font-weight:900!important;
    line-height:1!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip-name{
    max-width:108px!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
    font-size:12px!important;
    font-weight:800!important;
    letter-spacing:-.03em!important;
}
#calendarAttendeeFormSelected.note-share-chip-list .note-share-chip-remove{
    width:18px!important;
    height:18px!important;
    flex:0 0 18px!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    border:0!important;
    border-radius:999px!important;
    background:#fff!important;
    color:var(--moyo-share-blue, #4f7cff)!important;
    box-shadow:0 1px 5px rgba(31,51,84,.09)!important;
}

/* 공유/참석자 모달은 공통 모달 구조를 유지하되 캘린더 폼 안에서만 필요한 높이만 보정 */
#calendarAttendeeModal .note-write-share-body,
#calendarShareModal .note-write-share-body,
#calendarPermissionModal .note-write-share-body{
    min-height:0;
}
#calendarAttendeeModal .note-write-share-list,
#calendarShareModal .note-write-share-list,
#calendarPermissionModal .note-write-share-list{
    max-height:260px;
}
.moyo-share-quick-options{
    margin:0 22px 14px;
    padding:12px 13px;
    border:1px solid #dce8f8;
    border-radius:15px;
    background:#f8fbff;
}
.moyo-share-quick-check{display:flex;align-items:center;gap:8px;color:#263851;font-size:13px;font-weight:700;}
.moyo-share-quick-check input{width:15px;height:15px;accent-color:var(--moyo-blue);}
.moyo-share-quick-guide{margin:6px 0 0;color:#7b8aa0;font-size:12px;line-height:1.4;}

/* 확인 모달 */
.moyo-delete-modal{
    position:fixed;
    inset:0;
    z-index:1300;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px;
}
.moyo-delete-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.34);backdrop-filter:blur(2px);}
.moyo-delete-panel{
    position:relative;
    width:min(430px,100%);
    border:1px solid #dbe7f7;
    border-radius:22px;
    background:rgba(255,255,255,.98);
    box-shadow:0 24px 70px rgba(31,42,68,.2);
    overflow:hidden;
}
.moyo-delete-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:22px 22px 14px;}
.moyo-delete-head h3{margin:0 0 7px;color:#14213d;font-size:18px;font-weight:800;}
.moyo-delete-head p{margin:0;color:#718198;font-size:13px;line-height:1.45;}
.moyo-delete-close{border:0;background:transparent;color:#8b98aa;font-size:22px;font-weight:700;line-height:1;}
.moyo-delete-body{padding:2px 22px 8px;}
.moyo-delete-options{display:grid;gap:9px;}
.moyo-delete-option{display:flex;align-items:flex-start;gap:8px;padding:12px 13px;border:1px solid #dce8f8;border-radius:15px;background:#fff;}
.moyo-delete-option input{margin-top:3px;accent-color:var(--moyo-blue);}
.moyo-delete-option strong{display:block;color:#20304a;font-size:13px;font-weight:800;}
.moyo-delete-option span span{display:block;margin-top:3px;color:#7b8aa0;font-size:12px;line-height:1.35;}
.moyo-delete-actions{display:flex;justify-content:flex-end;gap:7px;padding:16px 22px 22px;}
.moyo-delete-btn{height:36px;padding:0 16px;border:1px solid #d8e5f6;border-radius:13px;background:#fff;color:#52627a;font-size:13px;font-weight:700;}
.moyo-delete-btn.danger{border-color:#ffd2d8;background:#fff6f7;color:#ff4d5b;}

@media (max-width:1180px){
    .moyo-event-primary .moyo-event-block{width:100%;}
    .moyo-event-layout{grid-template-columns:minmax(0,1fr);gap:22px;}
    .moyo-event-secondary{max-width:420px;padding-left:0;border-left:0;}
}
@media (max-width:720px){
    .moyo-event-page{padding:0 20px 36px;}
    .moyo-event-head{margin:0 -20px 18px;padding:18px 20px;flex-direction:column;gap:12px;}
    .moyo-event-actions{padding-top:0;justify-content:flex-start;}
    .moyo-event-titleline{display:block;}
    .moyo-event-titleline p{margin-top:7px;}
    .moyo-title-compose{grid-template-columns:minmax(0,1fr) 42px;}
    .moyo-title-type-button{width:42px;height:36px;padding:0;}
    .moyo-public-inline{max-width:none;}
    .moyo-public-setting{align-items:center;flex-direction:row;flex-wrap:wrap;gap:8px;}
    .moyo-public-setting-desc{white-space:normal;}
    .moyo-date-time-row{grid-template-columns:1fr;gap:6px;}
    .moyo-date-time-fields{display:grid;grid-template-columns:1fr 120px;gap:8px;}
    .moyo-repeat-detail-grid{grid-template-columns:1fr;gap:6px;}
    .moyo-repeat-end-option{grid-template-columns:1fr;gap:7px;}
    .moyo-repeat-end-option>.moyo-event-label{height:auto;}
    .moyo-repeat-end-field{align-items:flex-start;}
    .moyo-repeat-weekday-field{grid-template-columns:1fr;gap:6px;}
    .moyo-event-action-row{grid-template-columns:1fr;}
    .moyo-event-action-card{width:100%;}
    .attendee-card{max-width:none;width:100%;}
    .moyo-icon-type-grid{grid-template-columns:repeat(3,1fr);}
    .moyo-type-popover{min-width:280px;}
}

</style>
</head>
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<main class="moyo-event-page">
    <form id="calendarEventForm" class="moyo-event-form">
        <input type="hidden" name="id" id="id">
        <input type="hidden" name="userId" id="userId">
        <input type="hidden" name="recurGroupId" id="recurGroupId">
        <input type="hidden" name="occurrenceDate" id="occurrenceDate">
        <input type="hidden" name="recurDays" id="recurDays">
        <input type="hidden" name="visibilityType" id="visibilityType" value="PRIVATE">
        <input type="hidden" name="isPrivate" id="isPrivate" value="Y">
        <input type="hidden" name="eventType" id="eventType" value="">
        <input type="hidden" name="locationAddress" id="locationAddress">
        <input type="hidden" name="locationLat" id="locationLat">
        <input type="hidden" name="locationLng" id="locationLng">
        <input type="hidden" name="locationPlaceId" id="locationPlaceId">
        <select name="itemType" id="itemType" class="moyo-native-hidden" aria-hidden="true">
            <option value="PRIVATE">개인</option>
            <option value="WS">그룹</option>
            <option value="PROJ">프로젝트</option>
        </select>
        <select name="allDay" id="allDay" class="moyo-native-hidden" aria-hidden="true">
            <option value="N">N</option>
            <option value="Y">Y</option>
        </select>
        <select name="isRecurring" id="isRecurring" class="moyo-native-hidden" aria-hidden="true">
            <option value="N">N</option>
            <option value="Y">Y</option>
        </select>
        <input type="hidden" name="isLunar" id="isLunar" value="N">
        <input type="hidden" name="lunarMonth" id="lunarMonth">
        <input type="hidden" name="lunarDay" id="lunarDay">
        <input type="hidden" name="lunarSolarStartDate" id="lunarSolarStartDate">
        <input type="hidden" name="lunarSolarEndDate" id="lunarSolarEndDate">

        <div class="moyo-event-head">
            <div class="moyo-event-head-main">
                <button type="button" id="cancelBtn" class="moyo-event-back">← 캘린더</button>
                <div class="moyo-event-titleline">
                    <h1 id="eventFormTitle">일정 작성</h1>
                    <p id="routeLocationText" data-type="PRIVATE">개인 일정으로 등록됩니다.</p>
                </div>
            </div>
            <div class="moyo-event-actions">
                <button type="button" id="deleteBtn" class="moyo-event-btn danger">삭제</button>
                <button type="button" id="updateBtn" class="moyo-event-btn primary">수정 완료</button>
                <button type="button" id="saveBtn" class="moyo-event-btn primary">등록 완료</button>
            </div>
        </div>

        <div class="moyo-event-layout">
            <div class="moyo-event-primary">
                <section class="moyo-event-block">
                    <div class="moyo-event-grid">
                        <div class="moyo-event-field">
                            <div class="moyo-title-field-head">
                                <label for="title" class="moyo-event-label">일정 제목</label>
                            </div>
                            <div class="moyo-title-compose">
                                <input type="text" name="title" id="title" class="moyo-event-input" placeholder="예: 친구 약속, 병원 예약, 가족 모임" required>
                                <div class="moyo-type-picker-wrap">
                                    <button type="button" id="eventTypePickerBtn" class="moyo-title-type-button is-empty" aria-label="일정 유형 선택: 일반" aria-haspopup="true" aria-expanded="false" title="일정 유형: 일반">
                                        <span id="eventTypeIcon" class="moyo-title-type-icon" aria-hidden="true">📅</span>
                                        <span id="eventTypeLabel" class="moyo-title-type-label">일반</span>
                                    </button>
                                    <div id="eventTypePopover" class="moyo-type-popover" hidden>
                                        <div class="moyo-type-popover-head">
                                            <span>일정 유형 선택</span>
                                            <button type="button" id="eventTypePopoverClose" class="moyo-type-popover-close" aria-label="닫기">×</button>
                                        </div>
                                        <div class="moyo-icon-type-grid" role="group" aria-label="일정 유형">
                                        <button type="button" class="moyo-icon-type active is-default" data-event-type=""><span class="type-icon">📅</span><span>일반</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="APPOINTMENT"><span class="type-icon">🤝</span><span>약속</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="MEETING"><span class="type-icon">👥</span><span>회의</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="DEADLINE"><span class="type-icon">🚨</span><span>마감</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="TASK"><span class="type-icon">✅</span><span>업무</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="REMINDER"><span class="type-icon">🔔</span><span>알림</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="BIRTHDAY"><span class="type-icon">🎂</span><span>생일</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="ANNIVERSARY"><span class="type-icon">💝</span><span>기념일</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="TRAVEL"><span class="type-icon">✈️</span><span>여행</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="MEAL"><span class="type-icon">🍽️</span><span>식사</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="CAFE"><span class="type-icon">☕</span><span>카페</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="HEALTH"><span class="type-icon">🏥</span><span>병원</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="EXERCISE"><span class="type-icon">🏃</span><span>운동</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="STUDY"><span class="type-icon">📚</span><span>공부</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="PAYMENT"><span class="type-icon">💳</span><span>결제</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="DEPLOY"><span class="type-icon">🚀</span><span>배포</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="CLASS"><span class="type-icon">🏫</span><span>수업</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="EXAM"><span class="type-icon">📝</span><span>시험</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="SHOPPING"><span class="type-icon">🛒</span><span>쇼핑</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="DELIVERY"><span class="type-icon">📦</span><span>택배</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="FAMILY"><span class="type-icon">🏠</span><span>가족</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="FRIENDS"><span class="type-icon">🧑‍🤝‍🧑</span><span>친구</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="REST"><span class="type-icon">🌙</span><span>휴식</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="CLEANING"><span class="type-icon">🧹</span><span>청소</span></button>
                                        <button type="button" class="moyo-icon-type" data-event-type="REPAIR"><span class="type-icon">🛠️</span><span>정비</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="moyoVisibilityField" class="moyo-public-inline">
                                <div class="moyo-public-setting">
                                    <label class="moyo-public-check" for="moyoPublicCheckbox">
                                        <input type="checkbox" id="moyoPublicCheckbox" aria-label="MOYO 공개 여부">
                                        <img class="moyo-public-mascot" src="${pageContext.request.contextPath}/brand/moyo_feed_mark.png" alt="" aria-hidden="true" onerror="this.style.display='none';">
                                        <span>MOYO 공개</span>
                                    </label>
                                    <div class="moyo-public-setting-copy">
                                        <div class="moyo-public-setting-desc">MOYO 피드에 공개하면 친구들이 이 일정을 함께 볼 수 있습니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="moyo-event-hidden" hidden aria-hidden="true">
                            <select name="wsId" id="wsId"><option value="">선택 안 함</option></select>
                            <select name="projId" id="projId"><option value="">선택 안 함</option></select>
                        </div>
                        <p class="moyo-event-scope-warning" id="scopePermissionWarning" hidden></p>
                    </div>
                </section>

                <section class="moyo-event-block">
                    <div class="moyo-event-subline">
                        <div class="moyo-event-block-title">일정 시간</div>
                    </div>
                    <input type="hidden" name="startDt" id="startDt">
                    <input type="hidden" name="endDt" id="endDt">
                    <div class="moyo-date-time-stack" id="dateTimeGrid">
                        <div class="moyo-date-time-row">
                            <label for="startDate" class="moyo-event-label">시작</label>
                            <div class="moyo-date-time-fields">
                                <input type="text" id="startDate" class="moyo-event-input moyo-date-input" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-moyo-date-picker required>
                                <div class="moyo-time-picker-field" data-time-picker-field="startTime">
                                    <span class="moyo-time-meridiem" data-time-meridiem-for="startTime">오전</span>
                                    <input type="text" id="startTime" class="moyo-event-input moyo-time-input" inputmode="numeric" autocomplete="off" placeholder="09:00" pattern="[0-9]{1,2}:[0-9]{2}" required>
                                    <button type="button" class="moyo-time-picker-trigger" data-time-picker-target="startTime" aria-label="시작 시간 선택"></button>
                                </div>
                            </div>
                        </div>
                        <div class="moyo-date-time-row">
                            <label for="endDate" class="moyo-event-label">종료</label>
                            <div class="moyo-date-time-fields">
                                <input type="text" id="endDate" class="moyo-event-input moyo-date-input" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-moyo-date-picker required>
                                <div class="moyo-time-picker-field" data-time-picker-field="endTime">
                                    <span class="moyo-time-meridiem" data-time-meridiem-for="endTime">오전</span>
                                    <input type="text" id="endTime" class="moyo-event-input moyo-time-input" inputmode="numeric" autocomplete="off" placeholder="10:00" pattern="[0-9]{1,2}:[0-9]{2}" required>
                                    <button type="button" class="moyo-time-picker-trigger" data-time-picker-target="endTime" aria-label="종료 시간 선택"></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="moyo-date-option-wrap">
                        <div class="moyo-inline-label">설정</div>
                        <div class="moyo-date-option-row" aria-label="일시 옵션">
                            <label class="moyo-date-check" for="allDayCheckbox">
                                <input type="checkbox" id="allDayCheckbox">
                                <span>종일</span>
                            </label>
                            <div class="moyo-date-compact-field date-type-field" id="dateTypeField" title="날짜 기준">
                                <select name="dateType" id="dateType" class="moyo-date-compact-select" aria-label="날짜 기준" tabindex="-1">
                                    <option value="SOLAR">양력</option>
                                    <option value="LUNAR">음력</option>
                                </select>
                                <button type="button" class="moyo-date-compact-button moyo-date-type-button" id="dateTypeBtn" aria-haspopup="listbox" aria-expanded="false">양력</button>
                                <div class="moyo-date-type-menu" id="dateTypeMenu" role="listbox" hidden>
                                    <button type="button" role="option" data-date-type="SOLAR">양력</button>
                                    <button type="button" role="option" data-date-type="LUNAR">음력</button>
                                </div>
                            </div>
                            <div class="moyo-date-compact-field moyo-repeat-picker-wrap">
                                <button type="button" class="moyo-date-compact-button moyo-form-select-button" id="repeatBtn" aria-expanded="false" aria-haspopup="true">반복 안 함</button>
                                <div class="moyo-repeat-menu" id="repeatMenu" hidden>
                                    <button type="button" data-repeat-choice="">반복 안 함</button>
                                    <button type="button" data-repeat-choice="DAILY">매일</button>
                                    <button type="button" data-repeat-choice="WEEKLY">매주</button>
                                    <button type="button" data-repeat-choice="MONTHLY">매월</button>
                                    <button type="button" data-repeat-choice="YEARLY">매년</button>
                                    <button type="button" data-repeat-choice="WEEKDAY">주중 매일(월~금)</button>
                                    <button type="button" data-repeat-choice="CUSTOM">사용자 설정...</button>
                                </div>
                            </div>
                            <div class="moyo-date-compact-field timezone-field" id="timezoneField" title="시간대">
                                <select name="timezone" id="timezone" class="moyo-date-compact-select" aria-label="시간대" tabindex="-1">
                                    <option value="Asia/Seoul">서울(GMT+09:00)</option>
                                    <option value="Asia/Tokyo">도쿄(GMT+09:00)</option>
                                    <option value="Asia/Shanghai">상하이(GMT+08:00)</option>
                                    <option value="Asia/Hong_Kong">홍콩(GMT+08:00)</option>
                                    <option value="Asia/Singapore">싱가포르(GMT+08:00)</option>
                                    <option value="Asia/Bangkok">방콕(GMT+07:00)</option>
                                    <option value="Asia/Dubai">두바이(GMT+04:00)</option>
                                    <option value="Europe/London">런던(GMT+00:00)</option>
                                    <option value="Europe/Paris">파리(GMT+01:00)</option>
                                    <option value="Europe/Berlin">베를린(GMT+01:00)</option>
                                    <option value="America/New_York">뉴욕(GMT-05:00)</option>
                                    <option value="America/Chicago">시카고(GMT-06:00)</option>
                                    <option value="America/Denver">덴버(GMT-07:00)</option>
                                    <option value="America/Los_Angeles">로스앤젤레스(GMT-08:00)</option>
                                    <option value="America/Vancouver">밴쿠버(GMT-08:00)</option>
                                    <option value="America/Toronto">토론토(GMT-05:00)</option>
                                    <option value="Australia/Sydney">시드니(GMT+10:00)</option>
                                    <option value="Pacific/Auckland">오클랜드(GMT+12:00)</option>
                                    <option value="UTC">UTC(GMT+00:00)</option>
                                </select>
                                <button type="button" class="moyo-date-compact-button moyo-timezone-button" id="timezoneBtn" aria-haspopup="listbox" aria-expanded="false">서울(GMT+09:00)</button>
                                <div class="moyo-timezone-menu" id="timezoneMenu" role="listbox" hidden>
                                    <button type="button" role="option" data-timezone="Asia/Seoul">서울(GMT+09:00)</button>
                                    <button type="button" role="option" data-timezone="Asia/Tokyo">도쿄(GMT+09:00)</button>
                                    <button type="button" role="option" data-timezone="Asia/Shanghai">상하이(GMT+08:00)</button>
                                    <button type="button" role="option" data-timezone="Asia/Hong_Kong">홍콩(GMT+08:00)</button>
                                    <button type="button" role="option" data-timezone="Asia/Singapore">싱가포르(GMT+08:00)</button>
                                    <button type="button" role="option" data-timezone="Asia/Bangkok">방콕(GMT+07:00)</button>
                                    <button type="button" role="option" data-timezone="Asia/Dubai">두바이(GMT+04:00)</button>
                                    <button type="button" role="option" data-timezone="Europe/London">런던(GMT+00:00)</button>
                                    <button type="button" role="option" data-timezone="Europe/Paris">파리(GMT+01:00)</button>
                                    <button type="button" role="option" data-timezone="Europe/Berlin">베를린(GMT+01:00)</button>
                                    <button type="button" role="option" data-timezone="America/New_York">뉴욕(GMT-05:00)</button>
                                    <button type="button" role="option" data-timezone="America/Chicago">시카고(GMT-06:00)</button>
                                    <button type="button" role="option" data-timezone="America/Denver">덴버(GMT-07:00)</button>
                                    <button type="button" role="option" data-timezone="America/Los_Angeles">로스앤젤레스(GMT-08:00)</button>
                                    <button type="button" role="option" data-timezone="America/Vancouver">밴쿠버(GMT-08:00)</button>
                                    <button type="button" role="option" data-timezone="America/Toronto">토론토(GMT-05:00)</button>
                                    <button type="button" role="option" data-timezone="Australia/Sydney">시드니(GMT+10:00)</button>
                                    <button type="button" role="option" data-timezone="Pacific/Auckland">오클랜드(GMT+12:00)</button>
                                    <button type="button" role="option" data-timezone="UTC">UTC(GMT+00:00)</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="moyo-event-note moyo-lunar-conversion-note" id="lunarConversionNote" hidden></p>
                </section>

                <section class="moyo-event-block moyo-repeat-detail moyo-event-hidden" id="repeatLine" hidden>
                    <div class="moyo-event-block-title" id="repeatDetailTitle">반복 설정</div>
                    <div class="moyo-repeat-detail-grid" id="repeatDetailGrid">
                        <label for="recurType" class="moyo-event-label">방식</label>
                        <div class="moyo-form-select-wrap" id="recurTypeField">
                            <select name="recurType" id="recurType" class="moyo-event-select moyo-form-select-native" tabindex="-1" aria-hidden="true">
                                <option value="DAILY">매일</option>
                                <option value="WEEKLY">매주</option>
                                <option value="MONTHLY">매월</option>
                                <option value="YEARLY">매년</option>
                            </select>
                            <button type="button" class="moyo-form-select-button" id="recurTypeBtn" aria-haspopup="listbox" aria-expanded="false">매주</button>
                            <div class="moyo-form-select-menu" id="recurTypeMenu" role="listbox" hidden>
                                <button type="button" role="option" data-recur-type="DAILY">매일</button>
                                <button type="button" role="option" data-recur-type="WEEKLY">매주</button>
                                <button type="button" role="option" data-recur-type="MONTHLY">매월</button>
                                <button type="button" role="option" data-recur-type="YEARLY">매년</button>
                            </div>
                        </div>

                        <label for="recurInterval" class="moyo-event-label">간격</label>
                        <div class="moyo-repeat-interval-wrap">
                            <input type="number" name="recurInterval" id="recurInterval" class="moyo-event-input" value="1" min="1">
                            <span id="repeatIntervalUnit" class="moyo-event-label">주마다</span>
                        </div>

                    </div>
                    <div class="moyo-repeat-weekday-field" id="repeatWeekdayField" hidden>
                        <div class="moyo-event-label">요일</div>
                        <div class="moyo-repeat-weekday-row" id="repeatWeekdayRow" aria-label="반복 요일 선택">
                            <button type="button" class="moyo-repeat-weekday-chip" data-repeat-day="MON">월</button>
                            <button type="button" class="moyo-repeat-weekday-chip" data-repeat-day="TUE">화</button>
                            <button type="button" class="moyo-repeat-weekday-chip" data-repeat-day="WED">수</button>
                            <button type="button" class="moyo-repeat-weekday-chip" data-repeat-day="THU">목</button>
                            <button type="button" class="moyo-repeat-weekday-chip" data-repeat-day="FRI">금</button>
                            <button type="button" class="moyo-repeat-weekday-chip" data-repeat-day="SAT">토</button>
                            <button type="button" class="moyo-repeat-weekday-chip" data-repeat-day="SUN">일</button>
                        </div>
                    </div>
                    <div class="moyo-repeat-end-option" id="repeatEndOption">
                        <div class="moyo-event-label">종료</div>
                        <label class="moyo-date-check moyo-repeat-end-check" for="repeatEndEnabled">
                            <input type="checkbox" id="repeatEndEnabled">
                            <span>종료일 설정</span>
                        </label>
                        <div class="moyo-repeat-end-field moyo-event-hidden" id="repeatEndField" hidden>
                            <input type="text" name="untilDt" id="untilDt" class="moyo-event-input moyo-date-input" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" data-moyo-date-picker aria-label="반복 종료일">
                        </div>
                    </div>
                </section>

                <section class="moyo-event-block moyo-alarm-block" id="alarmLine">
                    <div class="moyo-event-block-title">알림</div>
                    <div class="moyo-alarm-row">
                        <select name="reminderMinutes" id="reminderMinutes" class="moyo-event-select moyo-alarm-select" aria-label="알림 시간">
                            <option value="">알림 없음</option>
                            <option value="0">시작 시간</option>
                            <option value="5">5분 전</option>
                            <option value="10">10분 전</option>
                            <option value="30">30분 전</option>
                            <option value="60">1시간 전</option>
                            <option value="1440">하루 전</option>
                        </select>
                        <span class="moyo-event-note moyo-alarm-note" id="reminderSummaryNote">알림을 설정하면 일정 시작 전에 알려줍니다.</span>
                    </div>
                </section>
            </div>

            <aside class="moyo-event-secondary">
                <section class="moyo-event-block">
                    <div class="moyo-event-grid">
                        <div class="moyo-event-field moyo-location-field">
                            <label for="locationText" class="moyo-event-label">장소</label>
                            <div class="moyo-event-location-wrap">
                                <input type="text" name="locationText" id="locationText" class="moyo-event-input" placeholder="장소명 또는 주소">
                                <button type="button" class="moyo-event-location-button is-pending" id="openLocationPickerBtn" title="주소 검색" aria-label="주소 검색">검색</button>
                            </div>
                            <div class="moyo-event-location-detail-wrap" id="locationDetailWrap" hidden>
                                <input type="text" id="locationDetailText" class="moyo-event-input" placeholder="상세 위치">
                            </div>
                            <p class="moyo-location-summary" id="locationSelectedNote" hidden></p>
                            <p class="moyo-side-note">장소를 지정하면 상세 화면에서 위치를 바로 확인할 수 있습니다.</p>
                            <div class="moyo-location-empty" id="locationEmptyState">
                                <span class="moyo-location-empty-icon" aria-hidden="true">📍</span>
                                <span>장소를 검색하면 지도 미리보기가 표시됩니다.</span>
                            </div>
                            <div class="moyo-location-preview" id="locationPreview" hidden>
                                <div class="moyo-location-preview-head">
                                    <span>
                                        <strong class="moyo-location-preview-title">지도 미리보기</strong>
                                        <span class="moyo-location-preview-address" id="locationPreviewAddress"></span>
                                    </span>
                                    <button type="button" class="moyo-location-map-link" id="openLocationMapBtn">지도보기</button>
                                </div>
                                <iframe class="moyo-location-map-frame" id="locationMapPreview" title="장소 지도 미리보기" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                            </div>
                        </div>
                        <div class="moyo-event-field">
                            <span class="moyo-event-label">참석자</span>
                            <button type="button" class="moyo-event-action-card attendee-card" id="openAttendeePickerBtn">
                                <span class="action-main"><span class="action-icon">👥</span><span class="action-text">참석자 선택</span></span>
                                <span class="count-badge" id="calendarAttendeeCount" hidden>0</span>
                            </button>
                            <div id="calendarAttendeeFormSelected" class="moyo-event-selected-tags moyo-attendee-form-tags note-share-chip-list" hidden></div>
                            <p class="moyo-side-note">참석자는 일정 알림을 함께 받을 수 있습니다.</p>
                        </div>
                        <div class="moyo-event-field">
                            <span class="moyo-event-label">공유 및 편집 권한</span>
                            <div class="moyo-event-action-row">
                                <button type="button" class="moyo-event-action-card share-card" id="openCalendarShareModal">
                                    <span class="action-main"><span class="action-icon">🔗</span><span class="action-text">공유 대상 선택</span></span>
                                    <span id="calendarShareCount" class="note-share-count" hidden>0</span>
                                </button>
                                <button type="button" id="openCalendarPermissionModal" class="moyo-event-action-card permission-card">
                                    <span class="action-main"><span class="action-icon">✏️</span><span class="action-text">편집 권한 설정</span></span>
                                    <span id="calendarPermissionCount" class="note-share-count" hidden>0</span>
                                </button>
                            </div>
                            <p class="moyo-side-note">공유 대상과 편집 가능 대상을 따로 관리합니다.</p>
                        </div>
                        <div class="moyo-event-field moyo-description-field">
                            <label for="descriptionText" class="moyo-event-label">설명</label>
                            <textarea name="descriptionText" id="descriptionText" class="moyo-event-textarea" placeholder="일정에 필요한 설명을 남겨주세요."></textarea>
                        </div>

                    </div>
                </section>

            </aside>
        </div>
    </form>
</main>


<div id="calendarDeleteModal" class="moyo-delete-modal" hidden>
    <div class="moyo-delete-backdrop" data-delete-close></div>
    <section class="moyo-delete-panel" role="dialog" aria-modal="true" aria-labelledby="calendarDeleteTitle">
        <div class="moyo-delete-head">
            <div>
                <h3 id="calendarDeleteTitle">일정 삭제</h3>
                <p id="calendarDeleteMessage">이 일정을 정말 삭제하시겠습니까?</p>
            </div>
            <button type="button" class="moyo-delete-close" data-delete-close aria-label="닫기">×</button>
        </div>
        <div id="calendarDeleteRepeatBody" class="moyo-delete-body" hidden>
            <div class="moyo-delete-options" role="radiogroup" aria-label="반복 일정 삭제 범위">
                <label class="moyo-delete-option">
                    <input type="radio" name="deleteScope" value="ONE" checked>
                    <span><strong>이 일정만 삭제</strong><span>선택한 날짜의 일정만 삭제하고 반복 규칙은 유지합니다.</span></span>
                </label>
                <label class="moyo-delete-option">
                    <input type="radio" name="deleteScope" value="FUTURE">
                    <span><strong>이 날짜 이후 삭제</strong><span>선택한 날짜부터 이후 반복 일정을 삭제합니다.</span></span>
                </label>
                <label class="moyo-delete-option">
                    <input type="radio" name="deleteScope" value="ALL">
                    <span><strong>전체 반복 일정 삭제</strong><span>이 반복 일정 전체를 삭제합니다.</span></span>
                </label>
            </div>
        </div>
        <div class="moyo-delete-actions">
            <button type="button" class="moyo-delete-btn" data-delete-close>취소</button>
            <button type="button" id="confirmDeleteBtn" class="moyo-delete-btn danger">삭제</button>
        </div>
    </section>
</div>


<div id="calendarUpdateScopeModal" class="moyo-delete-modal" hidden>
    <div class="moyo-delete-backdrop" data-update-close></div>
    <section class="moyo-delete-panel" role="dialog" aria-modal="true" aria-labelledby="calendarUpdateScopeTitle">
        <div class="moyo-delete-head">
            <div>
                <h3 id="calendarUpdateScopeTitle">반복 일정 수정</h3>
                <p id="calendarUpdateScopeMessage">이 반복 일정을 어떤 범위로 수정할까요?</p>
            </div>
            <button type="button" class="moyo-delete-close" data-update-close aria-label="닫기">×</button>
        </div>
        <div class="moyo-delete-body">
            <div class="moyo-delete-options" role="radiogroup" aria-label="반복 일정 수정 범위">
                <label class="moyo-delete-option">
                    <input type="radio" name="updateScope" value="ONE" checked>
                    <span><strong>이 일정만 수정</strong><span>선택한 날짜의 일정만 따로 수정하고 반복 규칙은 유지합니다.</span></span>
                </label>
                <label class="moyo-delete-option">
                    <input type="radio" name="updateScope" value="FUTURE">
                    <span><strong>이 날짜 이후 수정</strong><span>선택한 날짜부터 이후 반복 일정에 변경 내용을 적용합니다.</span></span>
                </label>
                <label class="moyo-delete-option">
                    <input type="radio" name="updateScope" value="ALL">
                    <span><strong>전체 반복 일정 수정</strong><span>이 반복 일정 전체에 변경 내용을 적용합니다.</span></span>
                </label>
            </div>
        </div>
        <div class="moyo-delete-actions">
            <button type="button" class="moyo-delete-btn" data-update-close>취소</button>
            <button type="button" id="confirmUpdateScopeBtn" class="moyo-delete-btn">수정</button>
        </div>
    </section>
</div>

<div id="calendarAttendeeHiddenFields"></div>
<div id="calendarShareHiddenFields"></div>

<div id="calendarWorkspaceTargetSource" hidden></div>
<div id="calendarProjectTargetSource" hidden></div>
<div id="calendarWorkspaceMemberSource" hidden></div>
<div id="calendarProjectMemberSource" hidden></div>


<div id="calendarAttendeeModal" class="note-write-share-modal moyo-share-modal" data-share-mode="share" hidden>
    <div class="note-write-share-backdrop" data-attendee-close></div>
    <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="calendarAttendeeModalTitle">
        <div class="note-write-share-modal-head">
            <div>
                <h3 id="calendarAttendeeModalTitle">참석자 선택</h3>
            </div>
            <button type="button" class="note-write-share-close" data-attendee-close aria-label="닫기">×</button>
        </div>
        <div class="note-write-share-tabs" role="tablist" aria-label="참석자 유형">
            <button type="button" class="note-write-share-tab is-active" data-attendee-tab="FRIEND">친구</button>
            <button type="button" class="note-write-share-tab" data-attendee-tab="WORKSPACE">그룹</button>
            <button type="button" class="note-write-share-tab" data-attendee-tab="PROJECT">프로젝트</button>
        </div>
        <div class="note-write-share-toolbar">
            <select id="calendarAttendeeContext" class="note-write-share-select" aria-label="참석자 범위 선택" hidden></select>
            <input type="text" id="calendarAttendeeKeyword" class="note-write-share-input" placeholder="참석자 이름 또는 이메일 검색">
        </div>
        <div class="note-write-share-body">
            <div>
                <div class="note-write-share-subtitle">참석 대상</div>
                <div id="calendarAttendeeCandidates" class="note-write-share-list"></div>
            </div>
            <div>
                <div class="note-write-share-subtitle note-write-share-subtitle-with-count">참석자 <span id="calendarAttendeeModalCount" class="note-share-modal-count" hidden>0</span></div>
                <div id="calendarAttendeeSelected" class="note-write-share-selected note-share-chip-list moyo-attendee-selected-tags"></div>
            </div>
        </div>
        <div class="moyo-share-quick-options moyo-attendee-quick-options" aria-label="참석자 추가 옵션">
            <label class="moyo-share-quick-check">
                <input type="checkbox" id="calendarAttendeeShareOption">
                <span>참석자에게 공유 요청도 보내기</span>
            </label>
            <label class="moyo-share-quick-check">
                <input type="checkbox" id="calendarAttendeeEditOption">
                <span>편집 권한 포함</span>
            </label>
            <p class="moyo-share-quick-guide">참석자만 지정하면 확인 알림만 전송되고, 공유를 체크하면 수락 요청으로 묶어 전송됩니다.</p>
        </div>
        <div class="note-write-share-modal-actions">
            <div>
                <button type="button" class="note-soft-btn" data-attendee-close>취소</button>
                <button type="button" id="applyCalendarAttendeeModal" class="note-gradient-btn">선택 완료</button>
            </div>
        </div>
    </section>
</div>

<div id="calendarShareModal" class="note-write-share-modal moyo-share-modal" data-current-user-id="${sessionScope.user.userId}" hidden>
    <div class="note-write-share-backdrop" data-note-share-close></div>
    <section class="note-write-share-panel" role="dialog" aria-modal="true" aria-labelledby="calendarShareModalTitle">
        <div class="note-write-share-modal-head">
            <div>
                <h3 id="calendarShareModalTitle">공유하기</h3>
                <p>일정을 공유할 친구/그룹/프로젝트를 선택합니다.</p>
            </div>
            <button type="button" class="note-write-share-close" data-note-share-close aria-label="닫기">×</button>
        </div>
        <div class="note-write-share-tabs" role="tablist" aria-label="공유 대상 유형">
            <button type="button" class="note-write-share-tab is-active" data-share-tab="FRIEND">친구</button>
            <button type="button" class="note-write-share-tab" data-share-tab="WORKSPACE">그룹</button>
            <button type="button" class="note-write-share-tab" data-share-tab="PROJECT">프로젝트</button>
        </div>
        <div class="note-write-share-toolbar">
            <select id="calendarShareContext" class="note-write-share-select" aria-label="공유 범위 선택" hidden></select>
            <input type="text" id="calendarShareKeyword" class="note-write-share-input" placeholder="친구 이름 또는 이메일 검색">
        </div>
        <div class="note-write-share-body note-write-share-body-simple">
            <div>
                <div class="note-write-share-subtitle">공유 대상</div>
                <div id="calendarShareCandidates" class="note-write-share-list"></div>
            </div>
            <div>
                <div class="note-write-share-subtitle">공유 목록 <span id="calendarShareModalCount" class="note-share-modal-count" hidden>0</span></div>
                <div id="calendarShareSelected" class="note-write-share-selected"></div>
            </div>
        </div>
        <div class="moyo-share-quick-options" aria-label="공유 요청 옵션">
            <label class="moyo-share-quick-check">
                <input type="checkbox" id="calendarShareEditOption">
                <span>선택한 대상에게 편집 권한 포함</span>
            </label>
            <p class="moyo-share-quick-guide">체크하지 않으면 공유 수락 후 보기만 가능합니다.</p>
        </div>
        <div class="note-write-share-modal-actions">
            <div>
                <button type="button" class="note-soft-btn" data-note-share-close>취소</button>
                <button type="button" id="applyCalendarShareModal" class="note-gradient-btn">적용</button>
            </div>
        </div>
    </section>
</div>

<script src="${pageContext.request.contextPath}/js/commonShareModal.js?v=calendar-share-v3"></script>
<script>
(function () {
    const form = document.getElementById('calendarEventForm');
    const itemType = document.getElementById('itemType');
    const wsSelect = document.getElementById('wsId');
    const projSelect = document.getElementById('projId');
    const routeLocationText = document.getElementById('routeLocationText');
    const scopePermissionWarning = document.getElementById('scopePermissionWarning');
    const saveBtn = document.getElementById('saveBtn');
    const updateBtn = document.getElementById('updateBtn');
    const moyoVisibilityField = document.getElementById('moyoVisibilityField');
    const moyoPublicCheckbox = document.getElementById('moyoPublicCheckbox');
    const allDaySelect = document.getElementById('allDay');
    const repeatSelect = document.getElementById('isRecurring');
    const allDayCheckbox = document.getElementById('allDayCheckbox');
    const repeatBtn = document.getElementById('repeatBtn');
    const repeatMenu = document.getElementById('repeatMenu');
    const repeatLine = document.getElementById('repeatLine');
    const repeatDetailTitle = document.getElementById('repeatDetailTitle');
    const repeatDetailGrid = document.getElementById('repeatDetailGrid');
    const recurTypeSelect = document.getElementById('recurType');
    const recurTypeField = document.getElementById('recurTypeField');
    const recurTypeBtn = document.getElementById('recurTypeBtn');
    const recurTypeMenu = document.getElementById('recurTypeMenu');
    const recurIntervalInput = document.getElementById('recurInterval');
    const untilDtInput = document.getElementById('untilDt');
    const repeatDaysInput = document.getElementById('recurDays');
    const occurrenceDateInput = document.getElementById('occurrenceDate');
    const repeatWeekdayField = document.getElementById('repeatWeekdayField');
    const repeatWeekdayRow = document.getElementById('repeatWeekdayRow');
    const repeatIntervalUnit = document.getElementById('repeatIntervalUnit');
    const repeatSummaryNote = document.getElementById('repeatSummaryNote');
    const repeatEndEnabled = document.getElementById('repeatEndEnabled');
    const repeatEndField = document.getElementById('repeatEndField');
    const repeatEndOption = document.getElementById('repeatEndOption');
    let repeatMode = '';
    const dateTypeSelect = document.getElementById('dateType');
    const dateTypeField = document.getElementById('dateTypeField');
    const dateTypeBtn = document.getElementById('dateTypeBtn');
    const dateTypeMenu = document.getElementById('dateTypeMenu');
    const isLunarInput = document.getElementById('isLunar');
    const lunarMonthInput = document.getElementById('lunarMonth');
    const lunarDayInput = document.getElementById('lunarDay');
    const lunarSolarStartInput = document.getElementById('lunarSolarStartDate');
    const lunarSolarEndInput = document.getElementById('lunarSolarEndDate');
    const lunarConversionNote = document.getElementById('lunarConversionNote');
    const lunarConvertCache = {};
    const timezoneSelect = document.getElementById('timezone');
    const timezoneField = document.getElementById('timezoneField');
    const timezoneBtn = document.getElementById('timezoneBtn');
    const timezoneMenu = document.getElementById('timezoneMenu');
    const reminderMinutesSelect = document.getElementById('reminderMinutes');
    const reminderSummaryNote = document.getElementById('reminderSummaryNote');
    const eventScopeSummary = document.getElementById('eventScopeSummary');
    const eventVisibilitySummary = document.getElementById('eventVisibilitySummary');
    const eventRepeatSummary = document.getElementById('eventRepeatSummary');
    const eventReminderSummary = document.getElementById('eventReminderSummary');
    const startDtInput = document.getElementById('startDt');
    const endDtInput = document.getElementById('endDt');
    const startDateInput = document.getElementById('startDate');
    const startTimeInput = document.getElementById('startTime');
    const endDateInput = document.getElementById('endDate');
    const endTimeInput = document.getElementById('endTime');
    const dateTimeGrid = document.getElementById('dateTimeGrid');
    let rememberedTimedRange = null;
    const visibilityType = document.getElementById('visibilityType');
    const isPrivate = document.getElementById('isPrivate');
    const eventType = document.getElementById('eventType');
    const calendarShareHiddenFields = document.getElementById('calendarShareHiddenFields');
    window.__moyoWorkspaces = window.__moyoWorkspaces || [];
    window.__moyoProjects = window.__moyoProjects || [];

    const EVENT_TYPE_META = {
        NONE: { icon: '📅', label: '일반' },
        APPOINTMENT: { icon: '🤝', label: '약속' },
        MEETING: { icon: '👥', label: '회의' },
        DEADLINE: { icon: '🚨', label: '마감' },
        TASK: { icon: '✅', label: '업무' },
        REMINDER: { icon: '🔔', label: '알림' },
        BIRTHDAY: { icon: '🎂', label: '생일' },
        ANNIVERSARY: { icon: '💝', label: '기념일' },
        TRAVEL: { icon: '✈️', label: '여행' },
        MEAL: { icon: '🍽️', label: '식사' },
        CAFE: { icon: '☕', label: '카페' },
        HEALTH: { icon: '🏥', label: '병원' },
        EXERCISE: { icon: '🏃', label: '운동' },
        STUDY: { icon: '📚', label: '공부' },
        PAYMENT: { icon: '💳', label: '결제' },
        DEPLOY: { icon: '🚀', label: '배포' },
        CLASS: { icon: '🏫', label: '수업' },
        EXAM: { icon: '📝', label: '시험' },
        SHOPPING: { icon: '🛒', label: '쇼핑' },
        DELIVERY: { icon: '📦', label: '택배' },
        FAMILY: { icon: '🏠', label: '가족' },
        FRIENDS: { icon: '🧑‍🤝‍🧑', label: '친구' },
        REST: { icon: '🌙', label: '휴식' },
        CLEANING: { icon: '🧹', label: '청소' },
        REPAIR: { icon: '🛠️', label: '정비' }
    };

    const eventTypePickerBtn = document.getElementById('eventTypePickerBtn');
    const eventTypePopover = document.getElementById('eventTypePopover');
    const eventTypePopoverClose = document.getElementById('eventTypePopoverClose');
    const eventTypeIcon = document.getElementById('eventTypeIcon');
    const eventTypeLabel = document.getElementById('eventTypeLabel');

    function pad(n) {
        return String(n).padStart(2, '0');
    }


    const TIME_PICKER_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    let moyoTimePickerMenu = null;
    let activeTimeInput = null;
    let activeTimeState = { meridiem: 'AM', hour12: 9, minute: 0 };
    let moyoDatePickerMenu = null;
    let activeDateInput = null;
    let activeDateView = null;
    const DATE_PICKER_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];



    function parseDateInputValue(value) {
        const raw = String(value || '').trim();
        if (!raw) return null;
        let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!match) {
            const compact = raw.replace(/\D/g, '');
            if (compact.length === 8) match = [compact, compact.slice(0, 4), compact.slice(4, 6), compact.slice(6, 8)];
        }
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return { year: year, month: month, day: day, value: year + '-' + pad(month) + '-' + pad(day) };
    }

    function getDatePickerState(input) {
        const parsed = parseDateInputValue(input && input.value) || parseDateInputValue(getTodayLocalDate());
        return { year: parsed.year, month: parsed.month };
    }

    function ensureDatePickerMenu() {
        if (moyoDatePickerMenu) return moyoDatePickerMenu;
        moyoDatePickerMenu = document.createElement('div');
        moyoDatePickerMenu.id = 'moyoDatePickerMenu';
        moyoDatePickerMenu.className = 'moyo-date-picker-menu';
        moyoDatePickerMenu.hidden = true;
        moyoDatePickerMenu.addEventListener('click', function(event) {
            event.stopPropagation();
            const prevNext = event.target.closest('[data-date-nav]');
            const dayButton = event.target.closest('[data-date-value]');
            const todayButton = event.target.closest('[data-date-action="today"]');
            if (!activeDateInput) return;
            if (prevNext) {
                const delta = Number(prevNext.dataset.dateNav) || 0;
                const base = new Date(activeDateView.year, activeDateView.month - 1 + delta, 1);
                activeDateView = { year: base.getFullYear(), month: base.getMonth() + 1 };
                renderDatePickerMenu();
                return;
            }
            if (todayButton) {
                setDateInputValue(activeDateInput, getTodayLocalDate());
                closeDatePicker();
                return;
            }
            if (dayButton) {
                setDateInputValue(activeDateInput, dayButton.dataset.dateValue);
                closeDatePicker();
            }
        });
        document.body.appendChild(moyoDatePickerMenu);
        return moyoDatePickerMenu;
    }

    function renderDatePickerMenu() {
        const menu = ensureDatePickerMenu();
        if (!activeDateInput) return;
        const view = activeDateView || getDatePickerState(activeDateInput);
        const selected = parseDateInputValue(activeDateInput.value);
        const todayValue = getTodayLocalDate();
        const first = new Date(view.year, view.month - 1, 1);
        const start = new Date(view.year, view.month - 1, 1 - first.getDay());
        const weeks = [];
        for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
            const week = [];
            for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
                const index = weekIndex * 7 + dayIndex;
                const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
                const isCurrentMonth = current.getFullYear() === view.year && current.getMonth() === view.month - 1;
                week.push({ current, isCurrentMonth });
            }
            weeks.push(week);
        }
        while (weeks.length > 5 && weeks[weeks.length - 1].every(function(day) { return !day.isCurrentMonth; })) {
            weeks.pop();
        }
        const days = [];
        weeks.forEach(function(week) {
            week.forEach(function(day) {
                const current = day.current;
                const value = current.getFullYear() + '-' + pad(current.getMonth() + 1) + '-' + pad(current.getDate());
                const classes = ['moyo-date-picker-day'];
                if (!day.isCurrentMonth) classes.push('is-muted');
                if (value === todayValue) classes.push('is-today');
                if (selected && value === selected.value) classes.push('is-selected');
                days.push('<button type="button" class="' + classes.join(' ') + '" data-date-value="' + value + '">' + current.getDate() + '</button>');
            });
        });
        menu.innerHTML = ''
            + '<div class="moyo-date-picker-head">'
            + '  <div class="moyo-date-picker-title"><span class="moyo-date-picker-title-text">' + view.year + '년 ' + view.month + '월</span></div>'
            + '  <div class="moyo-date-picker-nav">'
            + '    <button type="button" data-date-nav="-1" aria-label="이전 달">‹</button>'
            + '    <button type="button" data-date-nav="1" aria-label="다음 달">›</button>'
            + '  </div>'
            + '</div>'
            + '<div class="moyo-date-picker-weekdays">' + DATE_PICKER_WEEKDAYS.map(function(day){ return '<span>' + day + '</span>'; }).join('') + '</div>'
            + '<div class="moyo-date-picker-days">' + days.join('') + '</div>'
            + '<div class="moyo-date-picker-foot"><button type="button" class="moyo-date-picker-today" data-date-action="today">오늘</button></div>';
    }

    function positionDatePickerMenu(input) {
        const menu = ensureDatePickerMenu();
        const rect = input.getBoundingClientRect();
        const menuWidth = menu.offsetWidth || 248;
        const gap = 4;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - menuWidth - 10);
        const top = rect.bottom + gap;
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    function openDatePicker(input) {
        if (!input || input.disabled || input.readOnly) return;
        closeTimePicker();
        setRepeatMenuOpen(false);
        closeDateTypeMenu();
        closeTimezoneMenu();
        activeDateInput = input;
        activeDateView = getDatePickerState(input);
        renderDatePickerMenu();
        positionDatePickerMenu(input);
        ensureDatePickerMenu().hidden = false;
    }

    function closeDatePicker() {
        if (moyoDatePickerMenu) moyoDatePickerMenu.hidden = true;
        activeDateInput = null;
    }

    function setDateInputValue(input, value) {
        if (!input) return;
        const parsed = parseDateInputValue(value);
        if (!parsed) return;
        input.value = parsed.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function normalizeDateInputValue(input) {
        if (!input) return;
        const parsed = parseDateInputValue(input.value);
        if (parsed) input.value = parsed.value;
    }

    function parseTimeText(value) {
        const raw = String(value || '').trim();
        if (!raw) return null;
        let match = raw.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
        if (!match) {
            const compact = raw.replace(/\D/g, '');
            if (compact.length === 3) {
                match = [compact, compact.slice(0, 1), compact.slice(1)];
            } else if (compact.length === 4) {
                match = [compact, compact.slice(0, 2), compact.slice(2)];
            }
        }
        if (!match) return null;
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return { hour: hour, minute: minute };
    }

    function formatTimeParts(hour, minute) {
        return pad(Math.max(0, Math.min(23, Number(hour) || 0))) + ':' + pad(Math.max(0, Math.min(59, Number(minute) || 0)));
    }

    function getTimePickerState(value, fallback) {
        const parsed = parseTimeText(value) || parseTimeText(fallback) || { hour: 9, minute: 0 };
        const meridiem = parsed.hour >= 12 ? 'PM' : 'AM';
        const hour12 = parsed.hour % 12 || 12;
        const minute = TIME_PICKER_MINUTES.reduce(function(best, current) {
            return Math.abs(current - parsed.minute) < Math.abs(best - parsed.minute) ? current : best;
        }, 0);
        return { meridiem: meridiem, hour12: hour12, minute: minute };
    }

    function timeStateToValue(state) {
        let hour = Number(state.hour12) || 12;
        if (state.meridiem === 'AM') hour = hour === 12 ? 0 : hour;
        else hour = hour === 12 ? 12 : hour + 12;
        return formatTimeParts(hour, Number(state.minute) || 0);
    }

    function toDisplayHour12(value, fallback) {
        const parsed = parseTimeText(value) || parseTimeText(fallback) || { hour: 9, minute: 0 };
        return {
            meridiem: parsed.hour >= 12 ? 'PM' : 'AM',
            hour12: parsed.hour % 12 || 12,
            minute: parsed.minute
        };
    }

    function setTimeInputValue(input, value, fallback) {
        if (!input) return;
        const parsed = parseTimeText(value) || parseTimeText(fallback) || { hour: input.id === 'endTime' ? 10 : 9, minute: 0 };
        const canonical = formatTimeParts(parsed.hour, parsed.minute);
        const display = toDisplayHour12(canonical, fallback);
        input.dataset.timeValue = canonical;
        input.dataset.prevValue = canonical;
        input.dataset.meridiem = display.meridiem;
        input.value = pad(display.hour12) + ':' + pad(display.minute);
        updateTimeMeridiem(input);
    }

    function getTimeInputValue(input, fallback) {
        if (!input) return fallback || '';
        const stored = parseTimeText(input.dataset.timeValue);
        if (stored) return formatTimeParts(stored.hour, stored.minute);
        const parsed = parseTimeText(input.value);
        if (!parsed) return fallback || '';
        let hour = parsed.hour;
        if (hour <= 12) {
            const meridiem = input.dataset.meridiem || (hour >= 12 ? 'PM' : 'AM');
            if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
            else hour = hour === 12 ? 12 : hour + 12;
        }
        return formatTimeParts(hour, parsed.minute);
    }

    function updateTimeMeridiem(input) {
        if (!input) return;
        const chip = document.querySelector('[data-time-meridiem-for="' + input.id + '"]');
        if (!chip) return;
        const value = getTimeInputValue(input, input.id === 'endTime' ? '10:00' : '09:00');
        const state = toDisplayHour12(value, input.id === 'endTime' ? '10:00' : '09:00');
        chip.textContent = state.meridiem === 'PM' ? '오후' : '오전';
        chip.classList.toggle('is-am', state.meridiem === 'AM');
        chip.classList.toggle('is-pm', state.meridiem === 'PM');
        input.dataset.meridiem = state.meridiem;
    }

    function refreshTimeInputsDisplay() {
        setTimeInputValue(startTimeInput, getTimeInputValue(startTimeInput, '09:00'), '09:00');
        setTimeInputValue(endTimeInput, getTimeInputValue(endTimeInput, '10:00'), '10:00');
    }

    function ensureTimePickerMenu() {
        if (moyoTimePickerMenu) return moyoTimePickerMenu;
        moyoTimePickerMenu = document.createElement('div');
        moyoTimePickerMenu.id = 'moyoTimePickerMenu';
        moyoTimePickerMenu.className = 'moyo-time-picker-menu';
        moyoTimePickerMenu.hidden = true;
        moyoTimePickerMenu.addEventListener('click', function(event) {
            event.stopPropagation();
            const button = event.target.closest('button[data-time-action], button[data-meridiem], button[data-hour], button[data-minute]');
            if (!button || !activeTimeInput) return;
            if (button.dataset.timeAction === 'now') {
                const now = new Date();
                const rounded = Math.round(now.getMinutes() / 5) * 5;
                if (rounded >= 60) {
                    now.setHours(now.getHours() + 1);
                    now.setMinutes(0, 0, 0);
                } else {
                    now.setMinutes(rounded, 0, 0);
                }
                activeTimeState = getTimePickerState(formatTimeParts(now.getHours(), now.getMinutes()), '09:00');
                commitActiveTimePickerValue();
                renderTimePickerMenu();
                return;
            }
            if (button.dataset.meridiem) activeTimeState.meridiem = button.dataset.meridiem;
            if (button.dataset.hour) activeTimeState.hour12 = Number(button.dataset.hour);
            if (button.dataset.minute) activeTimeState.minute = Number(button.dataset.minute);
            commitActiveTimePickerValue();
            renderTimePickerMenu();
        });
        document.body.appendChild(moyoTimePickerMenu);
        return moyoTimePickerMenu;
    }

    function renderTimePickerMenu() {
        const menu = ensureTimePickerMenu();
        const hourButtons = Array.from({ length: 12 }, function(_, index) {
            const hour = index + 1;
            return '<button type="button" data-hour="' + hour + '" class="' + (activeTimeState.hour12 === hour ? 'is-selected' : '') + '">' + pad(hour) + '</button>';
        }).join('');
        const minuteButtons = TIME_PICKER_MINUTES.map(function(minute) {
            return '<button type="button" data-minute="' + minute + '" class="' + (activeTimeState.minute === minute ? 'is-selected' : '') + '">' + pad(minute) + '</button>';
        }).join('');
        menu.innerHTML = ''
            + '<div class="moyo-time-picker-head">'
            + '  <div class="moyo-time-picker-title">시간 선택</div>'
            + '  <button type="button" class="moyo-time-picker-now" data-time-action="now">현재 시간</button>'
            + '</div>'
            + '<div class="moyo-time-picker-ampm" aria-label="오전 오후 선택">'
            + '  <button type="button" data-meridiem="AM" class="' + (activeTimeState.meridiem === 'AM' ? 'is-selected' : '') + '">오전</button>'
            + '  <button type="button" data-meridiem="PM" class="' + (activeTimeState.meridiem === 'PM' ? 'is-selected' : '') + '">오후</button>'
            + '</div>'
            + '<div class="moyo-time-picker-section">'
            + '  <div class="moyo-time-picker-label">시</div>'
            + '  <div class="moyo-time-picker-grid">' + hourButtons + '</div>'
            + '</div>'
            + '<div class="moyo-time-picker-section">'
            + '  <div class="moyo-time-picker-label">분 · 5분 단위</div>'
            + '  <div class="moyo-time-picker-grid">' + minuteButtons + '</div>'
            + '</div>'
            + '<div class="moyo-time-picker-foot">직접 입력도 가능합니다.</div>';
    }

    function positionTimePickerMenu(input) {
        const menu = ensureTimePickerMenu();
        const field = input.closest('.moyo-time-picker-field') || input;
        const rect = field.getBoundingClientRect();
        const menuWidth = 268;
        const gap = 2;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - menuWidth - 10);
        const estimatedHeight = 276;
        const belowTop = rect.bottom + gap;
        const top = belowTop + estimatedHeight > window.innerHeight - 10 ? Math.max(10, rect.top - estimatedHeight - gap) : belowTop;
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    function openTimePicker(input) {
        if (!input || input.disabled) return;
        closeDatePicker();
        activeTimeInput = input;
        activeTimeState = getTimePickerState(getTimeInputValue(input, input.id === 'endTime' ? '10:00' : '09:00'), input.id === 'endTime' ? '10:00' : '09:00');
        renderTimePickerMenu();
        const menu = ensureTimePickerMenu();
        positionTimePickerMenu(input);
        menu.hidden = false;
    }

    function closeTimePicker() {
        if (moyoTimePickerMenu) moyoTimePickerMenu.hidden = true;
        activeTimeInput = null;
    }

    function commitActiveTimePickerValue() {
        if (!activeTimeInput) return;
        setTimeInputValue(activeTimeInput, timeStateToValue(activeTimeState), activeTimeInput.id === 'endTime' ? '10:00' : '09:00');
        activeTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function normalizeTimeInputValue(input) {
        if (!input) return;
        const fallback = input.dataset.prevValue || (input.id === 'endTime' ? '10:00' : '09:00');
        const parsed = parseTimeText(input.value);
        if (!parsed) {
            setTimeInputValue(input, fallback, fallback);
        } else {
            let hour = parsed.hour;
            if (hour <= 12) {
                const meridiem = input.dataset.meridiem || (hour >= 12 ? 'PM' : 'AM');
                if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
                else hour = hour === 12 ? 12 : hour + 12;
            }
            setTimeInputValue(input, formatTimeParts(hour, parsed.minute), fallback);
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function ensureEndAfterStart() {
        if (!startDateInput || !endDateInput || !startTimeInput || !endTimeInput || allDaySelect.value === 'Y') return;
        const startValue = getTimeInputValue(startTimeInput, '09:00');
        const endValue = getTimeInputValue(endTimeInput, '10:00');
        const start = new Date((startDateInput.value || getTodayLocalDate()) + 'T' + startValue + ':00');
        const end = new Date((endDateInput.value || startDateInput.value || getTodayLocalDate()) + 'T' + endValue + ':00');
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end > start) return;
        const next = addMinutesToParts(startDateInput.value || getTodayLocalDate(), startValue, 60);
        endDateInput.value = next.date;
        setTimeInputValue(endTimeInput, next.time, '10:00');
    }

    function toDatetimeLocal(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function toDateLocal(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }

    function toTimeLocal(date) {
        return pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function getTodayLocalDate() {
        return toDateLocal(new Date());
    }

    function normalizeDateParam(value) {
        if (!value) return null;
        const decoded = decodeURIComponent(String(value)).trim();
        if (!decoded) return null;

        const dateOnlyMatch = decoded.match(/^(\d{4}-\d{2}-\d{2})$/);
        if (dateOnlyMatch) {
            return { date: dateOnlyMatch[1], time: '09:00' };
        }

        const localMatch = decoded.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
        const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(decoded) || /(?:Z|[+-]\d{2}:?\d{2})["']?$/i.test(decoded);
        if (localMatch && !hasZone) {
            return { date: localMatch[1], time: localMatch[2] };
        }

        const parsed = new Date(decoded);
        if (!Number.isNaN(parsed.getTime())) {
            return { date: toDateLocal(parsed), time: toTimeLocal(parsed) };
        }

        return null;
    }

    function getInitialStartParts() {
        const params = new URLSearchParams(location.search);
        const dateParam = params.get('date') || params.get('start') || params.get('startDt') || params.get('startDate');
        const parsed = normalizeDateParam(dateParam);
        if (parsed) return parsed;

        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        return { date: toDateLocal(now), time: toTimeLocal(now) };
    }

    function addMinutesToParts(dateValue, timeValue, minutes) {
        const base = new Date((dateValue || getTodayLocalDate()) + 'T' + (timeValue || '09:00') + ':00');
        if (Number.isNaN(base.getTime())) {
            return { date: dateValue || getTodayLocalDate(), time: '10:00' };
        }
        base.setMinutes(base.getMinutes() + minutes);
        return { date: toDateLocal(base), time: toTimeLocal(base) };
    }

    function isAllDayBoundaryTime(value, fallback) {
        const time = value || fallback || '';
        return time === '00:00' || time === '23:59' || time === '23:59:00' || time === '23:59:59';
    }

    function isAllDayDateRangeValue(startValue, endValue) {
        const start = normalizeDateParam(startValue);
        const end = normalizeDateParam(endValue);
        if (!start || !end) return true;
        const startTime = start.time || '00:00';
        const endTime = end.time || '23:59';
        if (startTime !== '00:00') return false;
        if (endTime === '23:59' || endTime === '23:59:00' || endTime === '23:59:59') return true;
        return endTime === '00:00' && start.date !== end.date;
    }

    function resetTimeInputsForTimedEvent(force) {
        if (startTimeInput && (force || isAllDayBoundaryTime(getTimeInputValue(startTimeInput, '00:00'), '00:00'))) {
            setTimeInputValue(startTimeInput, '09:00', '09:00');
        }
        if (endTimeInput && (force || isAllDayBoundaryTime(getTimeInputValue(endTimeInput, '00:00'), '00:00') || getTimeInputValue(endTimeInput, '10:00') === getTimeInputValue(startTimeInput, '09:00'))) {
            setTimeInputValue(endTimeInput, '10:00', '10:00');
        }
    }

    function getRoundedCurrentTimedRange() {
        const base = new Date();
        base.setSeconds(0, 0);
        const roundedMinutes = Math.ceil(base.getMinutes() / 5) * 5;
        if (roundedMinutes >= 60) {
            base.setHours(base.getHours() + 1, 0, 0, 0);
        } else {
            base.setMinutes(roundedMinutes);
        }
        const startDate = startDateInput && startDateInput.value ? startDateInput.value : toDateLocal(base);
        const startTime = toTimeLocal(base);
        const next = addMinutesToParts(startDate, startTime, 60);
        return { startTime: startTime, endTime: next.time, endDate: next.date };
    }

    function rememberCurrentTimedRange() {
        if (!startTimeInput || !endTimeInput) return;
        const startTime = getTimeInputValue(startTimeInput, '');
        const endTime = getTimeInputValue(endTimeInput, '');
        if (!parseTimeText(startTime) || !parseTimeText(endTime)) return;
        if (isAllDayBoundaryTime(startTime, '') || isAllDayBoundaryTime(endTime, '')) return;
        rememberedTimedRange = {
            startTime: startTime,
            endTime: endTime,
            endDate: endDateInput && endDateInput.value ? endDateInput.value : ''
        };
    }

    function restoreTimedRangeAfterAllDay() {
        const range = rememberedTimedRange || getRoundedCurrentTimedRange();
        if (startTimeInput) setTimeInputValue(startTimeInput, range.startTime || '09:00', '09:00');
        if (endTimeInput) setTimeInputValue(endTimeInput, range.endTime || '10:00', '10:00');
        if (endDateInput && range.endDate) endDateInput.value = range.endDate;
        ensureEndAfterStart();
    }

    function syncDateTimeHidden() {
        const allDay = allDaySelect.value === 'Y';
        const isLunar = dateTypeSelect && dateTypeSelect.value === 'LUNAR';
        const visibleStartDate = startDateInput ? startDateInput.value : '';
        const visibleEndDate = endDateInput ? endDateInput.value : '';
        const startDate = isLunar && lunarSolarStartInput && lunarSolarStartInput.value ? lunarSolarStartInput.value : visibleStartDate;
        const endDate = isLunar && lunarSolarEndInput && lunarSolarEndInput.value ? lunarSolarEndInput.value : visibleEndDate;
        const startTime = startTimeInput ? getTimeInputValue(startTimeInput, '00:00') : '00:00';
        const endTime = endTimeInput ? getTimeInputValue(endTimeInput, '23:59') : '23:59';

        startDtInput.value = startDate ? startDate + 'T' + (allDay ? '00:00' : startTime) : '';
        endDtInput.value = endDate ? endDate + 'T' + (allDay ? '23:59' : endTime) : '';
    }

    function parseDateParts(dateValue) {
        const match = String(dateValue || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    }


    function daysBetweenDateValues(startDate, endDate) {
        const s = parseDateParts(startDate);
        const e = parseDateParts(endDate);
        if (!s || !e) return 0;
        const startUtc = Date.UTC(s.year, s.month - 1, s.day);
        const endUtc = Date.UTC(e.year, e.month - 1, e.day);
        return Math.floor((endUtc - startUtc) / 86400000);
    }

    function addDaysToDateValue(dateValue, days) {
        const parts = parseDateParts(dateValue);
        if (!parts) return dateValue || '';
        const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
        next.setUTCDate(next.getUTCDate() + Math.max(0, Number(days) || 0));
        return next.getUTCFullYear() + '-' + pad(next.getUTCMonth() + 1) + '-' + pad(next.getUTCDate());
    }

    function getInclusiveDateOffset(startValue, endValue, allDayValue) {
        const start = normalizeDateParam(startValue);
        const end = normalizeDateParam(endValue);
        if (!start || !end) return 0;
        let offset = daysBetweenDateValues(start.date, end.date);
        if (offset < 0) return 0;

        // FullCalendar는 종일 일정의 end를 다음날 00:00(exclusive)로 들고 있는 경우가 있다.
        // 수정 화면에서는 사용자가 입력한 종료일(포함일)로 보여줘야 하므로 하루를 보정한다.
        const rawEnd = String(endValue || '');
        const isExclusiveAllDayEnd = allDayValue === 'Y' && offset > 0 && (end.time === '00:00' || /(?:T| )00:00(?::00)?$/.test(rawEnd));
        if (isExclusiveAllDayEnd) offset -= 1;
        return Math.max(0, offset);
    }

    function formatKoreanDate(dateValue) {
        const parts = parseDateParts(dateValue);
        if (!parts) return dateValue || '';
        return parts.year + '년 ' + parts.month + '월 ' + parts.day + '일';
    }

    function formatDotDate(dateValue) {
        const parts = parseDateParts(dateValue);
        if (!parts) return dateValue || '';
        return parts.year + '.' + pad(parts.month) + '.' + pad(parts.day);
    }

    function setLunarOriginalFields() {
        const parts = parseDateParts(startDateInput && startDateInput.value);
        if (!parts) {
            if (lunarMonthInput) lunarMonthInput.value = '';
            if (lunarDayInput) lunarDayInput.value = '';
            return;
        }
        if (lunarMonthInput) lunarMonthInput.value = parts.month;
        if (lunarDayInput) lunarDayInput.value = parts.day;
    }

    async function convertLunarDate(dateValue) {
        const parts = parseDateParts(dateValue);
        if (!parts) return '';
        const cacheKey = parts.year + '-' + pad(parts.month) + '-' + pad(parts.day);
        if (lunarConvertCache[cacheKey]) return lunarConvertCache[cacheKey];
        const query = new URLSearchParams({ year: parts.year, month: parts.month, day: parts.day });
        const response = await fetch('/api/calendar/lunar-to-solar?' + query.toString());
        if (!response.ok) throw new Error('음력 날짜 변환 실패');
        const data = await response.json();
        const solarDate = data && data.solarDate ? data.solarDate : '';
        if (!solarDate) throw new Error('음력 날짜 변환 실패');
        lunarConvertCache[cacheKey] = solarDate;
        return solarDate;
    }

    async function syncLunarConversion() {
        const isLunar = dateTypeSelect && dateTypeSelect.value === 'LUNAR';
        if (!isLunar) {
            if (lunarSolarStartInput) lunarSolarStartInput.value = '';
            if (lunarSolarEndInput) lunarSolarEndInput.value = '';
            if (lunarConversionNote) {
                lunarConversionNote.hidden = true;
                lunarConversionNote.textContent = '';
            }
            syncDateTimeHidden();
            return true;
        }

        setLunarOriginalFields();
        const startVisible = startDateInput ? startDateInput.value : '';
        const endVisible = endDateInput ? endDateInput.value : startVisible;
        if (!startVisible) {
            syncDateTimeHidden();
            return false;
        }

        try {
            const solarStart = await convertLunarDate(startVisible);
            const solarEnd = endVisible ? await convertLunarDate(endVisible) : solarStart;
            if (lunarSolarStartInput) lunarSolarStartInput.value = solarStart;
            if (lunarSolarEndInput) lunarSolarEndInput.value = solarEnd || solarStart;
            if (lunarConversionNote) {
                lunarConversionNote.hidden = false;
                const sameDate = startVisible === endVisible;
                lunarConversionNote.textContent = sameDate
                    ? '양력 변환일: ' + formatDotDate(solarStart)
                    : '양력 변환일: ' + formatDotDate(solarStart) + ' ~ ' + formatDotDate(solarEnd);
            }
            syncDateTimeHidden();
            return true;
        } catch (error) {
            if (lunarConversionNote) {
                lunarConversionNote.hidden = false;
                lunarConversionNote.textContent = '음력 날짜를 양력으로 변환하지 못했습니다. 날짜를 다시 확인해 주세요.';
            }
            syncDateTimeHidden();
            return false;
        }
    }

    function formValue(name) {
        const element = form.elements[name];
        return element ? element.value : '';
    }

    function numberOrNull(value) {
        return value === '' || value == null ? null : Number(value);
    }

    function getReminderLabel(minutes) {
        const value = String(minutes == null ? '' : minutes);
        const map = {
            '': '알림 없음',
            '0': '시작 시간',
            '5': '5분 전',
            '10': '10분 전',
            '30': '30분 전',
            '60': '1시간 전',
            '1440': '하루 전'
        };
        return map[value] || value + '분 전';
    }

    function syncReminderSummary() {
        if (!reminderMinutesSelect || !reminderSummaryNote) return;
        const value = reminderMinutesSelect.value;
        const label = getReminderLabel(value);
        reminderSummaryNote.textContent = value === ''
            ? '알림을 설정하면 일정 시작 전에 알려줍니다.'
            : label + '에 알림을 받습니다.';
        if (eventReminderSummary) eventReminderSummary.textContent = label;
    }

    function syncEventFormSummary() {
        if (eventScopeSummary) {
            const type = String(itemType ? itemType.value : 'PERSONAL').toUpperCase();
            if (type === 'PROJECT') eventScopeSummary.textContent = '프로젝트 캘린더';
            else if (type === 'WORKSPACE' || type === 'WS') eventScopeSummary.textContent = '그룹 캘린더';
            else eventScopeSummary.textContent = '개인 캘린더';
        }
        if (eventVisibilitySummary) {
            eventVisibilitySummary.textContent = moyoPublicCheckbox && moyoPublicCheckbox.checked ? 'MOYO 공개 켜짐' : 'MOYO 공개 꺼짐';
        }
        if (eventRepeatSummary) {
            const repeatText = repeatBtn ? repeatBtn.textContent.trim() : '반복 없음';
            eventRepeatSummary.textContent = repeatText || '반복 없음';
        }
    }

    function setReminderValue(minutes, enabled) {
        if (!reminderMinutesSelect) return;
        const useAlarm = String(enabled || '').toUpperCase() === 'Y';
        const value = minutes !== undefined && minutes !== null ? String(minutes) : '';
        reminderMinutesSelect.value = useAlarm || value !== '' ? value : '';
        if (reminderMinutesSelect.value !== value && value !== '') {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = getReminderLabel(value);
            reminderMinutesSelect.appendChild(option);
            reminderMinutesSelect.value = value;
        }
        syncReminderSummary();
    }

    function setInitialDate() {
        const start = getInitialStartParts();
        const end = addMinutesToParts(start.date, start.time, 60);

        startDateInput.value = start.date;
        setTimeInputValue(startTimeInput, start.time, '09:00');
        endDateInput.value = end.date;
        setTimeInputValue(endTimeInput, end.time, '10:00');
        syncDateTimeHidden();
    }

    function setVisibility(value) {
        const nextValue = value === 'MOYO' ? 'MOYO' : 'PRIVATE';
        visibilityType.value = nextValue;
        isPrivate.value = nextValue === 'MOYO' ? 'N' : 'Y';
        if (moyoPublicCheckbox) moyoPublicCheckbox.checked = nextValue === 'MOYO';
        if (moyoVisibilityField) moyoVisibilityField.classList.toggle('is-active', nextValue === 'MOYO');
    }

    function normalizeVisibilityForScope(type) {
        const isPersonal = type === 'PRIVATE';
        if (moyoVisibilityField) moyoVisibilityField.classList.toggle('moyo-event-hidden', !isPersonal);
        if (!isPersonal && visibilityType.value === 'MOYO') {
            setVisibility('PRIVATE');
        }
    }

    function getProjectById(projectId) {
        const id = String(projectId || '');
        return (window.__moyoProjects || []).find(function(project) {
            return String(project.projId || project.PROJ_ID || '') === id;
        });
    }

    function getWorkspaceById(wsId) {
        const id = String(wsId || '');
        return (window.__moyoWorkspaces || []).find(function(ws) {
            return String(ws.wsId || ws.WS_ID || '') === id;
        });
    }

    function getWorkspaceName(wsId) {
        const ws = getWorkspaceById(wsId);
        return ws ? (ws.wsName || ws.WS_NAME || '그룹') : '그룹';
    }

    function upperRole(value) {
        return String(value || '').trim().toUpperCase();
    }

    function isManagerRole(role) {
        return ['ADMIN', 'OWNER', 'LEADER', 'MANAGER'].includes(upperRole(role));
    }

    function getProjectRole(project) {
        if (!project) return '';
        return upperRole(project.projRole || project.PROJ_ROLE || project.roleName || project.ROLE_NAME || project.role || project.ROLE || '');
    }

    function canWriteCurrentScope() {
        const type = itemType.value || 'PRIVATE';
        const eventTypeValue = String(eventType ? eventType.value : formValue('eventType')).toUpperCase();
        if (type === 'PRIVATE' || eventTypeValue === 'TASK') return true;
        if (type === 'WS') {
            const ws = getWorkspaceById(wsSelect.value);
            return ws ? isManagerRole(ws.wsRole || ws.WS_ROLE || ws.roleName || ws.ROLE_NAME) : false;
        }
        if (type === 'PROJ') {
            const project = getProjectById(projSelect.value);
            return project ? isManagerRole(getProjectRole(project)) : false;
        }
        return true;
    }

    function scopePermissionMessage() {
        const type = itemType.value || 'PRIVATE';
        if (type === 'WS') return '그룹 일정은 그룹장 또는 관리자만 등록할 수 있습니다.';
        if (type === 'PROJ') return '프로젝트 일정은 팀장 또는 관리자만 등록할 수 있습니다.';
        return '';
    }

    function updateScopeWriteGuard() {
        const allowed = canWriteCurrentScope();
        const message = allowed ? '' : scopePermissionMessage();
        if (scopePermissionWarning) {
            scopePermissionWarning.textContent = message;
            scopePermissionWarning.hidden = !message;
        }
        const editing = !!formValue('id');
        if (saveBtn && !editing) {
            saveBtn.disabled = !allowed;
            saveBtn.title = allowed ? '' : message;
        }
        if (updateBtn && editing) {
            updateBtn.disabled = !allowed;
            updateBtn.title = allowed ? '' : message;
        }
    }

    function updateRouteLocationLabel() {
        const type = itemType.value || 'PRIVATE';
        let label = '개인 일정으로 등록됩니다.';

        if (type === 'WS') {
            label = getWorkspaceName(wsSelect.value) + ' · 그룹 캘린더에 등록됩니다.';
        } else if (type === 'PROJ') {
            const project = getProjectById(projSelect.value);
            if (project) {
                const wsName = project.wsName || project.WS_NAME || getWorkspaceName(project.wsId || project.WS_ID || wsSelect.value);
                const projName = project.projName || project.PROJ_NAME || '프로젝트';
                label = wsName ? wsName + ' · ' + projName + ' 캘린더에 등록됩니다.' : projName + ' 캘린더에 등록됩니다.';
            } else {
                label = '프로젝트 캘린더에 등록됩니다.';
            }
        }

        if (routeLocationText) {
            routeLocationText.textContent = label;
            routeLocationText.dataset.type = type;
        }
    }

    function setScope(type) {
        itemType.value = type || 'PRIVATE';
        updateRouteLocationLabel();
        normalizeVisibilityForScope(itemType.value);
        updateScopeWriteGuard();
    }


    function getDateTypeLabel(value) {
        if (!dateTypeSelect) return '양력';
        const option = Array.from(dateTypeSelect.options).find(opt => opt.value === value) || dateTypeSelect.options[0];
        return option ? option.textContent.trim() : '양력';
    }

    function syncDateTypeButton() {
        if (!dateTypeSelect || !dateTypeBtn) return;
        dateTypeBtn.textContent = getDateTypeLabel(dateTypeSelect.value || 'SOLAR');
        if (dateTypeMenu) {
            dateTypeMenu.querySelectorAll('[data-date-type]').forEach(btn => {
                const selected = btn.dataset.dateType === dateTypeSelect.value;
                btn.classList.toggle('is-selected', selected);
                btn.setAttribute('aria-selected', selected ? 'true' : 'false');
            });
        }
    }

    function closeDateTypeMenu() {
        if (!dateTypeMenu || !dateTypeBtn) return;
        dateTypeMenu.hidden = true;
        dateTypeBtn.setAttribute('aria-expanded', 'false');
    }

    function openDateTypeMenu() {
        if (!dateTypeMenu || !dateTypeBtn || dateTypeBtn.disabled) return;
        setRepeatMenuOpen(false);
        closeTimezoneMenu();
        closeRecurTypeMenu();
        closeDatePicker();
        dateTypeMenu.hidden = false;
        dateTypeBtn.setAttribute('aria-expanded', 'true');
    }

    if (dateTypeBtn && dateTypeMenu && dateTypeSelect) {
        dateTypeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dateTypeMenu.hidden ? openDateTypeMenu() : closeDateTypeMenu();
        });
        dateTypeMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            const option = e.target.closest('[data-date-type]');
            if (!option) return;
            dateTypeSelect.value = option.dataset.dateType || 'SOLAR';
            dateTypeSelect.dispatchEvent(new Event('change', { bubbles:true }));
            syncDateTypeButton();
            closeDateTypeMenu();
        });
        dateTypeSelect.addEventListener('change', syncDateTypeButton);
        syncDateTypeButton();
    }

    function getTimezoneLabel(value) {
        if (!timezoneSelect) return '서울(GMT+09:00)';
        const option = Array.from(timezoneSelect.options).find(opt => opt.value === value) || timezoneSelect.options[0];
        return option ? option.textContent.trim() : '서울(GMT+09:00)';
    }

    function syncTimezoneButton() {
        if (!timezoneSelect || !timezoneBtn) return;
        const label = getTimezoneLabel(timezoneSelect.value || 'Asia/Seoul');
        timezoneBtn.textContent = label;
        if (timezoneMenu) {
            timezoneMenu.querySelectorAll('[data-timezone]').forEach(btn => {
                const selected = btn.dataset.timezone === timezoneSelect.value;
                btn.classList.toggle('is-selected', selected);
                btn.setAttribute('aria-selected', selected ? 'true' : 'false');
            });
        }
    }

    function closeTimezoneMenu() {
        if (!timezoneMenu || !timezoneBtn) return;
        timezoneMenu.hidden = true;
        timezoneBtn.setAttribute('aria-expanded', 'false');
    }

    function openTimezoneMenu() {
        if (!timezoneMenu || !timezoneBtn || timezoneBtn.disabled) return;
        closeDateTypeMenu();
        setRepeatMenuOpen(false);
        closeRecurTypeMenu();
        closeDatePicker();
        timezoneMenu.hidden = false;
        timezoneBtn.setAttribute('aria-expanded', 'true');
        const selected = timezoneMenu.querySelector('.is-selected');
        if (selected) selected.scrollIntoView({block:'nearest'});
    }

    if (timezoneBtn && timezoneMenu && timezoneSelect) {
        timezoneBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            timezoneMenu.hidden ? openTimezoneMenu() : closeTimezoneMenu();
        });
        timezoneMenu.addEventListener('click', function(e) {
            const option = e.target.closest('[data-timezone]');
            if (!option) return;
            timezoneSelect.value = option.dataset.timezone || 'Asia/Seoul';
            timezoneSelect.dispatchEvent(new Event('change', { bubbles:true }));
            syncTimezoneButton();
            closeTimezoneMenu();
        });
        document.addEventListener('click', function(e) {
            if (timezoneField && timezoneField.contains(e.target)) return;
            closeTimezoneMenu();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeTimezoneMenu();
        });
        timezoneSelect.addEventListener('change', syncTimezoneButton);
        syncTimezoneButton();
    }


    function getRecurTypeLabel(value) {
        if (!recurTypeSelect) return '매주';
        const option = Array.from(recurTypeSelect.options).find(opt => opt.value === value) || recurTypeSelect.options[1] || recurTypeSelect.options[0];
        return option ? option.textContent.trim() : '매주';
    }

    function syncRecurTypeButton() {
        if (!recurTypeSelect || !recurTypeBtn) return;
        const value = recurTypeSelect.value || 'WEEKLY';
        recurTypeBtn.textContent = getRecurTypeLabel(value);
        if (recurTypeMenu) {
            recurTypeMenu.querySelectorAll('[data-recur-type]').forEach(function(btn) {
                const selected = btn.dataset.recurType === value;
                btn.classList.toggle('is-selected', selected);
                btn.setAttribute('aria-selected', selected ? 'true' : 'false');
            });
        }
    }

    function closeRecurTypeMenu() {
        if (!recurTypeMenu || !recurTypeBtn) return;
        recurTypeMenu.hidden = true;
        recurTypeBtn.setAttribute('aria-expanded', 'false');
    }

    function openRecurTypeMenu() {
        if (!recurTypeMenu || !recurTypeBtn || recurTypeBtn.disabled) return;
        closeDateTypeMenu();
        closeTimezoneMenu();
        setRepeatMenuOpen(false);
        closeDatePicker();
        recurTypeMenu.hidden = false;
        recurTypeBtn.setAttribute('aria-expanded', 'true');
    }

    if (recurTypeBtn && recurTypeMenu && recurTypeSelect) {
        recurTypeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            recurTypeMenu.hidden ? openRecurTypeMenu() : closeRecurTypeMenu();
        });
        recurTypeMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            const option = e.target.closest('[data-recur-type]');
            if (!option) return;
            recurTypeSelect.value = option.dataset.recurType || 'WEEKLY';
            recurTypeSelect.dispatchEvent(new Event('change', { bubbles:true }));
            syncRecurTypeButton();
            closeRecurTypeMenu();
        });
        document.addEventListener('click', function(e) {
            if (recurTypeField && recurTypeField.contains(e.target)) return;
            closeRecurTypeMenu();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeRecurTypeMenu();
        });
        recurTypeSelect.addEventListener('change', syncRecurTypeButton);
        syncRecurTypeButton();
    }

    function setAllDay(enabled, options) {
        options = options || {};
        const wasAllDay = allDaySelect && allDaySelect.value === 'Y';
        if (enabled && options.rememberTime) rememberCurrentTimedRange();
        allDaySelect.value = enabled ? 'Y' : 'N';
        allDayCheckbox.checked = enabled;
        if (dateTimeGrid) dateTimeGrid.classList.toggle('is-all-day', enabled);
        if (!enabled && !options.skipRestore && (options.restoreTime || wasAllDay)) {
            restoreTimedRangeAfterAllDay();
        }
        if (startTimeInput) {
            startTimeInput.disabled = enabled;
            const field = startTimeInput.closest('.moyo-time-picker-field');
            if (field) field.classList.toggle('is-disabled', enabled);
        }
        if (endTimeInput) {
            endTimeInput.disabled = enabled;
            const field = endTimeInput.closest('.moyo-time-picker-field');
            if (field) field.classList.toggle('is-disabled', enabled);
        }
        document.querySelectorAll('.moyo-time-picker-trigger').forEach(function(button) {
            button.disabled = enabled;
        });
        if (enabled) closeTimePicker();
        if (timezoneField) {
            timezoneField.hidden = enabled;
            timezoneField.classList.toggle('is-disabled', enabled);
            timezoneField.title = enabled ? '' : '시간대';
        }
        if (timezoneSelect) {
            timezoneSelect.disabled = enabled;
            timezoneSelect.setAttribute('aria-disabled', enabled ? 'true' : 'false');
            if (enabled) timezoneSelect.value = 'Asia/Seoul';
        }
        if (timezoneBtn) {
            timezoneBtn.disabled = enabled;
            timezoneBtn.setAttribute('aria-disabled', enabled ? 'true' : 'false');
        }
        if (enabled) closeTimezoneMenu();
        syncTimezoneButton();
        syncDateTimeHidden();
    }

    const REPEAT_DAY_LABELS = {
        SUN: '일요일',
        MON: '월요일',
        TUE: '화요일',
        WED: '수요일',
        THU: '목요일',
        FRI: '금요일',
        SAT: '토요일'
    };
    const REPEAT_WEEKDAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

    function getStartDatePartsForRepeat() {
        const dateText = startDateInput && startDateInput.value ? startDateInput.value : '';
        const parts = dateText.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) {
            const today = new Date();
            return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate(), date: today };
        }
        return { year: parts[0], month: parts[1], day: parts[2], date: new Date(parts[0], parts[1] - 1, parts[2]) };
    }

    function getKoreanWeekdayName(dateText) {
        const code = getDayCodeFromDate(dateText || (startDateInput && startDateInput.value));
        return REPEAT_DAY_LABELS[code] || '월요일';
    }

    function getMonthlyOrdinalLabel(dateText) {
        const parts = getStartDatePartsForRepeat(dateText);
        const weekday = getKoreanWeekdayName(dateText || (startDateInput && startDateInput.value));
        const order = Math.ceil(parts.day / 7);
        const orderLabels = ['', '첫 번째', '두 번째', '세 번째', '네 번째', '다섯 번째'];
        const nextWeek = new Date(parts.year, parts.month - 1, parts.day + 7);
        if (nextWeek.getMonth() !== parts.month - 1) {
            return '매월 마지막 ' + weekday;
        }
        return '매월 ' + (orderLabels[order] || order + '번째') + ' ' + weekday;
    }

    function splitDateParts(dateText) {
        if (!dateText) return null;
        const parts = String(dateText).split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        return { year: parts[0], month: parts[1], day: parts[2] };
    }

    function isLunarMode() {
        return dateTypeSelect && dateTypeSelect.value === 'LUNAR';
    }

    function isMultiDayRange() {
        return !!(startDateInput && endDateInput && startDateInput.value && endDateInput.value && startDateInput.value !== endDateInput.value);
    }

    function formatCompactMonthDay(parts) {
        if (!parts) return '';
        return parts.month + '.' + String(parts.day).padStart(2, '0');
    }

    function getLunarRangeLabel() {
        const startParts = splitDateParts(startDateInput && startDateInput.value);
        const endParts = splitDateParts(endDateInput && endDateInput.value);
        if (!startParts) return '매년 음력 반복';
        if (endParts && (startParts.month !== endParts.month || startParts.day !== endParts.day)) {
            return '매년 음력 ' + formatCompactMonthDay(startParts) + '~' + formatCompactMonthDay(endParts);
        }
        return '매년 음력 ' + startParts.month + '월 ' + startParts.day + '일';
    }

    function getYearlyDateLabel() {
        const parts = getStartDatePartsForRepeat();
        const isLunar = isLunarMode();
        if (isLunar) return getLunarRangeLabel();
        if (isMultiDayRange()) {
            const endParts = splitDateParts(endDateInput && endDateInput.value);
            if (endParts && (parts.month !== endParts.month || parts.day !== endParts.day)) {
                return '매년 ' + parts.month + '월 ' + parts.day + '일~' + endParts.month + '월 ' + endParts.day + '일';
            }
        }
        return '매년 ' + parts.month + '월 ' + parts.day + '일';
    }

    function isRepeatChoiceAllowed(type) {
        const nextType = type || '';
        if (!nextType) return true;
        if (isLunarMode()) {
            return nextType === 'YEARLY';
        }
        if (isMultiDayRange()) {
            return nextType !== 'WEEKDAY';
        }
        return true;
    }

    function getRepeatLabel(type) {
        if (type === 'DAILY') return isMultiDayRange() ? '매일 같은 기간' : '매일';
        if (type === 'WEEKLY') return isMultiDayRange() ? '매주 같은 기간' : '매주 ' + getKoreanWeekdayName();
        if (type === 'MONTHLY') return isMultiDayRange() ? '매월 같은 기간' : getMonthlyOrdinalLabel();
        if (type === 'YEARLY') return getYearlyDateLabel();
        if (type === 'WEEKDAY') return '주중 매일(월~금)';
        if (type === 'CUSTOM') return '사용자 설정';
        return '반복 안 함';
    }

    function normalizeRepeatForDateRules() {
        if (!isRepeatChoiceAllowed(repeatMode)) {
            setRepeatType('', false, true);
            return;
        }
        if (repeatMode === 'WEEKLY' && !isMultiDayRange()) {
            // 수정 화면에서 복원된 월/수/금 같은 다중 요일 선택을
            // 시작 날짜 요일로 다시 덮어쓰지 않는다.
            ensureWeeklyRepeatDay();
        }
        updateRepeatMenuLabels();
    }

    function updateRepeatMenuLabels() {
        if (!repeatMenu) return;
        repeatMenu.querySelectorAll('[data-repeat-choice]').forEach(function (btn) {
            const choice = btn.dataset.repeatChoice || '';
            const allowed = isRepeatChoiceAllowed(choice);
            btn.hidden = !allowed;
            btn.disabled = !allowed;
            btn.textContent = choice === 'CUSTOM' ? '사용자 설정...' : getRepeatLabel(choice);
        });
        if (repeatBtn) repeatBtn.textContent = getRepeatLabel(repeatMode);
    }

    function getRepeatIntervalUnit(type) {
        const units = {
            DAILY: '일마다',
            WEEKLY: '주마다',
            MONTHLY: '개월마다',
            YEARLY: '년마다'
        };
        return units[type] || '주마다';
    }

    function setRepeatMenuOpen(open) {
        if (!repeatMenu || !repeatBtn) return;
        if (open) {
            closeDateTypeMenu();
            closeTimezoneMenu();
            closeRecurTypeMenu();
            updateRepeatMenuLabels();
        }
        repeatMenu.hidden = !open;
        repeatBtn.setAttribute('aria-expanded', String(open));
    }

    function getDayCodeFromDate(dateText) {
        if (!dateText) return 'MON';
        const parts = dateText.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return 'MON';
        const day = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
        return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][day] || 'MON';
    }

    function getSelectedRepeatDays() {
        if (!repeatWeekdayRow) return [];
        return Array.from(repeatWeekdayRow.querySelectorAll('.moyo-repeat-weekday-chip.active'))
            .map(function (btn) { return btn.dataset.repeatDay; })
            .filter(Boolean);
    }

    function syncRepeatDaysInput() {
        if (!repeatDaysInput) return;
        repeatDaysInput.value = getSelectedRepeatDays().join(',');
    }

    function setRepeatDaySelection(days) {
        if (!repeatWeekdayRow) return;
        const selected = Array.isArray(days) && days.length ? days : [getDayCodeFromDate(startDateInput && startDateInput.value)];
        repeatWeekdayRow.querySelectorAll('.moyo-repeat-weekday-chip').forEach(function (btn) {
            btn.classList.toggle('active', selected.indexOf(btn.dataset.repeatDay) >= 0);
        });
        syncRepeatDaysInput();
    }

    function ensureWeeklyRepeatDay() {
        if (getSelectedRepeatDays().length === 0) {
            setRepeatDaySelection([getDayCodeFromDate(startDateInput && startDateInput.value)]);
        } else {
            syncRepeatDaysInput();
        }
    }

    function toggleRepeatWeekdayField(type) {
        if (!repeatWeekdayField) return;
        const isWeekly = type === 'WEEKLY';
        repeatWeekdayField.hidden = !isWeekly;
        repeatWeekdayField.classList.toggle('moyo-event-hidden', !isWeekly);
        if (isWeekly) ensureWeeklyRepeatDay();
        else if (repeatDaysInput) repeatDaysInput.value = '';
    }

    function syncRepeatDetailText() {
        const type = recurTypeSelect && recurTypeSelect.value ? recurTypeSelect.value : 'WEEKLY';
        if (repeatIntervalUnit) repeatIntervalUnit.textContent = getRepeatIntervalUnit(type);
        toggleRepeatWeekdayField(type);
        syncRecurTypeButton();
    }

    function getRepeatEndDefaultDate() {
        const base = (endDateInput && endDateInput.value) || (startDateInput && startDateInput.value) || '';
        if (base) return base;
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function setRepeatEndEnabled(enabled, clearValue) {
        const active = Boolean(enabled);
        if (repeatEndEnabled) repeatEndEnabled.checked = active;
        if (repeatEndField) {
            repeatEndField.hidden = !active;
            repeatEndField.classList.toggle('moyo-event-hidden', !active);
        }
        if (active && untilDtInput && !untilDtInput.value) untilDtInput.value = getRepeatEndDefaultDate();
        if (!active && clearValue !== false && untilDtInput) untilDtInput.value = '';
    }

    function setRepeatDetailVisible(visible) {
        if (!repeatLine) return;
        repeatLine.hidden = !visible;
        repeatLine.classList.toggle('moyo-event-hidden', !visible);
    }

    function setCustomRepeatFieldsVisible(visible) {
        if (repeatDetailTitle) repeatDetailTitle.hidden = !visible;
        if (repeatDetailGrid) repeatDetailGrid.hidden = !visible;
        if (repeatEndOption) repeatEndOption.hidden = !visible;
        if (!visible) setRepeatEndEnabled(false);
    }

    function setRepeatType(type, forceDetail, silent) {
        const nextType = type || '';
        if (!isRepeatChoiceAllowed(nextType)) {
            if (!silent) {
                alert(isLunarMode()
                    ? '음력 일정에서는 반복 안 함 또는 매년 음력 반복만 선택할 수 있습니다.'
                    : '기간 일정에서는 주중 매일(월~금) 반복을 사용할 수 없습니다.');
            }
            setRepeatMenuOpen(false);
            return;
        }
        const enabled = nextType !== '';
        const isCustom = nextType === 'CUSTOM' || forceDetail === true;

        repeatMode = nextType;
        repeatSelect.value = enabled ? 'Y' : 'N';
        repeatBtn.classList.toggle('active', enabled);

        if (!enabled) {
            if (recurTypeSelect) recurTypeSelect.value = 'WEEKLY';
            if (recurIntervalInput) recurIntervalInput.value = 1;
            setRepeatEndEnabled(false);
            toggleRepeatWeekdayField('');
            setCustomRepeatFieldsVisible(false);
            setRepeatDetailVisible(false);
        } else if (isCustom) {
            if (recurTypeSelect && !recurTypeSelect.value) recurTypeSelect.value = 'WEEKLY';
            if (recurIntervalInput && !recurIntervalInput.value) recurIntervalInput.value = 1;
            setRepeatDetailVisible(true);
            setCustomRepeatFieldsVisible(true);
            syncRepeatDetailText();
        } else {
            if (recurIntervalInput) recurIntervalInput.value = 1;
            setRepeatEndEnabled(false);
            setCustomRepeatFieldsVisible(false);
            setRepeatDetailVisible(false);

            if (nextType === 'WEEKDAY') {
                if (recurTypeSelect) recurTypeSelect.value = 'WEEKLY';
                setRepeatDaySelection(REPEAT_WEEKDAY_CODES);
            } else {
                if (recurTypeSelect) recurTypeSelect.value = nextType;
                if (nextType === 'WEEKLY' && !isMultiDayRange()) {
                    setRepeatDaySelection([getDayCodeFromDate(startDateInput && startDateInput.value)]);
                } else if (repeatDaysInput) {
                    repeatDaysInput.value = '';
                }
            }
        }

        syncRecurTypeButton();
        updateRepeatMenuLabels();
        if (repeatMenu) {
            repeatMenu.querySelectorAll('[data-repeat-choice]').forEach(function (btn) {
                btn.classList.toggle('active', (btn.dataset.repeatChoice || '') === nextType);
            });
        }
        setRepeatMenuOpen(false);
    }

    function syncDateType() {
        syncDateTypeButton();
        const isLunar = dateTypeSelect.value === 'LUNAR';
        isLunarInput.value = isLunar ? 'Y' : 'N';
        if (allDayCheckbox) {
            allDayCheckbox.disabled = isLunar;
            const allDayLabel = allDayCheckbox.closest('.moyo-date-check');
            if (allDayLabel) allDayLabel.classList.toggle('is-locked', isLunar);
        }
        if (isLunar) {
            setAllDay(true);
        } else if (allDayCheckbox) {
            allDayCheckbox.disabled = false;
            const allDayLabel = allDayCheckbox.closest('.moyo-date-check');
            if (allDayLabel) allDayLabel.classList.remove('is-locked');
        }
        if (!isLunar && lunarConversionNote) {
            lunarConversionNote.hidden = true;
            lunarConversionNote.textContent = '';
        }
        syncRepeatDetailText();
        normalizeRepeatForDateRules();
        syncLunarConversion();
    }

    function setEventType(value) {
        const normalized = value ? String(value).toUpperCase() : '';
        eventType.value = normalized;
        updateScopeWriteGuard();
        const meta = normalized ? (EVENT_TYPE_META[normalized] || EVENT_TYPE_META.NONE) : EVENT_TYPE_META.NONE;
        document.querySelectorAll('[data-event-type]').forEach(function (btn) {
            btn.classList.toggle('active', (btn.dataset.eventType || '') === eventType.value);
        });
        if (eventTypeIcon) eventTypeIcon.textContent = meta.icon;
        if (eventTypeLabel) eventTypeLabel.textContent = meta.label;
        if (eventTypePickerBtn) {
            eventTypePickerBtn.classList.toggle('is-empty', !normalized);
            eventTypePickerBtn.title = '일정 유형: ' + meta.label;
            eventTypePickerBtn.setAttribute('aria-label', '일정 유형 선택: ' + meta.label);
        }
    }

    function setEventTypePopover(open) {
        if (!eventTypePopover || !eventTypePickerBtn) return;
        eventTypePopover.hidden = !open;
        eventTypePickerBtn.classList.toggle('is-open', open);
        eventTypePickerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function applyPageMode() {
        const hasEventId = !!formValue('id');
        const deleteBtn = document.getElementById('deleteBtn');
        const updateBtn = document.getElementById('updateBtn');
        const saveBtn = document.getElementById('saveBtn');

        if (!hasEventId) {
            deleteBtn.hidden = true;
            updateBtn.hidden = true;
            saveBtn.hidden = false;
            saveBtn.textContent = '등록 완료';
            const eventFormTitle = document.getElementById('eventFormTitle');
            if (eventFormTitle) eventFormTitle.textContent = '일정 작성';
            updateScopeWriteGuard();
            return;
        }

        deleteBtn.hidden = false;
        updateBtn.hidden = false;
        saveBtn.hidden = true;
        const eventFormTitle = document.getElementById('eventFormTitle');
        if (eventFormTitle) eventFormTitle.textContent = '일정 수정';
        updateScopeWriteGuard();
    }

    function setDateTimeParts(startValue, endValue, allDayValue) {
        const start = normalizeDateParam(startValue);
        const end = normalizeDateParam(endValue);
        const isAllDayEvent = allDayValue === 'Y' && isAllDayDateRangeValue(startValue, endValue);
        if (start) {
            startDateInput.value = start.date;
            setTimeInputValue(startTimeInput, isAllDayEvent ? '09:00' : (start.time || '09:00'), '09:00');
        }
        if (end) {
            endDateInput.value = end.date;
            setTimeInputValue(endTimeInput, isAllDayEvent ? '10:00' : (end.time || '10:00'), '10:00');
        } else if (start) {
            const next = addMinutesToParts(start.date, start.time, 60);
            endDateInput.value = next.date;
            setTimeInputValue(endTimeInput, isAllDayEvent ? '10:00' : next.time, '10:00');
        }
        if (!isAllDayEvent && startTimeInput && endTimeInput && getTimeInputValue(startTimeInput, '09:00') === getTimeInputValue(endTimeInput, '10:00')) {
            const next = addMinutesToParts(startDateInput.value, getTimeInputValue(startTimeInput, '09:00'), 60);
            endDateInput.value = next.date;
            setTimeInputValue(endTimeInput, next.time, '10:00');
        }
        setAllDay(isAllDayEvent, { skipRestore: true });
        syncDateTimeHidden();
    }

    function setTextValue(id, value) {
        const el = document.getElementById(id);
        if (el && value != null && value !== '') el.value = value;
    }

    function applyQueryDefaults() {
        const params = new URLSearchParams(location.search);
        const scopeType = params.get('scopeType') || params.get('itemType');
        const wsId = params.get('wsId');
        const projId = params.get('projId');
        const moyoPublic = params.get('moyoPublic');
        const title = params.get('title');
        const eventId = params.get('eventId') || params.get('id');
        const startValue = params.get('startDt') || params.get('start') || params.get('startDate');
        const endValue = params.get('endDt') || params.get('end') || params.get('endDate');
        const allDayValue = params.get('allDay');
        const isLunarValue = params.get('isLunar');
        const lunarMonthValue = params.get('lunarMonth');
        const lunarDayValue = params.get('lunarDay');
        const isRecurringValue = params.get('isRecurring');
        const recurTypeValue = params.get('recurType');
        const recurDaysValue = params.get('recurDays');
        const untilValue = params.get('untilDt');
        const eventTypeValue = params.get('eventType');
        const timezoneValue = params.get('timezone');
        const reminderMinutesValue = params.get('reminderMinutes');
        const reminderYnValue = params.get('reminderYn');
        const visibilityValue = params.get('visibilityType') || params.get('visibility');
        const isPrivateValue = params.get('isPrivate');

        if (eventId) setTextValue('id', eventId);
        if (title) setTextValue('title', title);
        setTextValue('locationText', params.get('locationText'));
        setTextValue('locationAddress', params.get('locationAddress'));
        setTextValue('locationLat', params.get('locationLat'));
        setTextValue('locationLng', params.get('locationLng'));
        setTextValue('locationPlaceId', params.get('locationPlaceId'));
        setTextValue('descriptionText', params.get('descriptionText'));
        setTextValue('recurGroupId', params.get('recurGroupId'));
        setTextValue('occurrenceDate', params.get('occurrenceDate') || (startValue ? startValue.slice(0, 10) : ''));

        if (wsId) wsSelect.value = wsId;
        if (projId) {
            projSelect.value = projId;
            const project = getProjectById(projId);
            if (project && !wsSelect.value) wsSelect.value = project.wsId || project.WS_ID || '';
        }
        if (scopeType) setScope(scopeType);
        else updateRouteLocationLabel();
        const shouldUseMoyoPublic = moyoPublic === 'Y' || visibilityValue === 'MOYO' || isPrivateValue === 'N';
        setVisibility(shouldUseMoyoPublic ? 'MOYO' : 'PRIVATE');

        const lunarRangeOffsetDays = getInclusiveDateOffset(startValue, endValue, allDayValue);
        if (startValue || endValue || allDayValue) setDateTimeParts(startValue, endValue, allDayValue);
        if (isLunarValue === 'Y' && lunarMonthValue && lunarDayValue && startDateInput) {
            const baseYear = (startDateInput.value || startValue || getTodayLocalDate()).slice(0, 4) || String(new Date().getFullYear());
            const lunarVisibleDate = baseYear + '-' + pad(lunarMonthValue) + '-' + pad(lunarDayValue);
            const lunarVisibleEndDate = addDaysToDateValue(lunarVisibleDate, lunarRangeOffsetDays);
            startDateInput.value = lunarVisibleDate;
            if (endDateInput) endDateInput.value = lunarVisibleEndDate || lunarVisibleDate;
            if (lunarMonthInput) lunarMonthInput.value = Number(lunarMonthValue);
            if (lunarDayInput) lunarDayInput.value = Number(lunarDayValue);
        }
        if (timezoneValue && timezoneSelect && allDayValue !== 'Y') { timezoneSelect.value = timezoneValue; syncTimezoneButton(); }
        if (reminderMinutesValue !== null || reminderYnValue) setReminderValue(reminderMinutesValue, reminderYnValue);
        if (isLunarValue === 'Y') dateTypeSelect.value = 'LUNAR';
        if (isLunarValue === 'N') dateTypeSelect.value = 'SOLAR';
        syncDateType();
        if (eventTypeValue) setEventType(eventTypeValue);
        if (recurTypeValue && recurTypeSelect) recurTypeSelect.value = recurTypeValue;
        const restoredRecurDays = recurDaysValue ? recurDaysValue.split(',').map(function (day) {
            return String(day || '').trim().toUpperCase();
        }).filter(Boolean) : [];
        if (untilValue && untilDtInput) untilDtInput.value = untilValue;
        const shouldOpenCustomRepeat = Boolean(untilValue) || restoredRecurDays.length > 1;
        setRepeatType(isRecurringValue === 'Y' ? (recurTypeValue || 'WEEKLY') : '', shouldOpenCustomRepeat);
        setRepeatEndEnabled(Boolean(untilValue), false);
        if (restoredRecurDays.length) {
            setRepeatDaySelection(restoredRecurDays);
            if (recurTypeSelect && recurTypeSelect.value === 'WEEKLY') {
                toggleRepeatWeekdayField('WEEKLY');
            }
        }
        applyPageMode();
        if (typeof splitLocationDetailFromText === 'function') splitLocationDetailFromText();
        if (typeof updateLocationState === 'function') updateLocationState();
    }





    function applyQuickCreateDraftDefaults() {
        const params = new URLSearchParams(location.search);
        if (params.get('quickDraft') !== 'Y') return;
        let draft = null;
        try {
            draft = JSON.parse(sessionStorage.getItem('moyoCalendarQuickDraft') || 'null');
            sessionStorage.removeItem('moyoCalendarQuickDraft');
        } catch (e) {
            draft = null;
        }
        if (!draft) return;

        const scopeInfo = draft.scopeInfo || {};
        const scopeType = scopeInfo.scopeType || 'PRIVATE';
        if (scopeInfo.wsId && wsSelect) wsSelect.value = String(scopeInfo.wsId);
        if (scopeInfo.projId && projSelect) {
            projSelect.value = String(scopeInfo.projId);
            const project = getProjectById(scopeInfo.projId);
            if (project && wsSelect && !wsSelect.value) wsSelect.value = project.wsId || project.WS_ID || '';
        }
        setScope(scopeType);

        if (draft.title) setTextValue('title', draft.title);
        const startDate = draft.startDate || getTodayLocalDate();
        const endDate = draft.endDate || startDate;
        const startTime = draft.startTime || '09:00';
        const endTime = draft.endTime || '10:00';
        setDateTimeParts(startDate + 'T' + startTime, endDate + 'T' + endTime, draft.allDay ? 'Y' : 'N');
        setAllDay(!!draft.allDay, { skipRestore: true });

        setVisibility(draft.moyoPublic ? 'MOYO' : 'PRIVATE');
        if (draft.eventType) setEventType(draft.eventType);
        else setEventType('');

        if (dateTypeSelect) dateTypeSelect.value = draft.isLunar ? 'LUNAR' : 'SOLAR';
        syncDateType();
        if (draft.isLunar) {
            if (lunarMonthInput) lunarMonthInput.value = Number(startDate.slice(5, 7));
            if (lunarDayInput) lunarDayInput.value = Number(startDate.slice(8, 10));
        }

        if (timezoneSelect && draft.timezone && !draft.allDay) {
            timezoneSelect.value = draft.timezone;
            syncTimezoneButton();
        }
        if (draft.reminderMinutes != null) setReminderValue(String(draft.reminderMinutes), 'Y');
        else setReminderValue('', 'N');

        const repeatType = draft.repeat || '';
        setRepeatType(repeatType, false);
        if (repeatType === 'WEEKLY') {
            setRepeatDaySelection([getDayCodeFromDate(startDate)]);
        }
        applyPageMode();
        syncDateTimeHidden();
        syncEventFormSummary();
    }

    function valueFromEventDetail(data) {
        return function() {
            for (let i = 0; i < arguments.length; i++) {
                const key = arguments[i];
                if (data && data[key] !== undefined && data[key] !== null) return String(data[key]);
            }
            return '';
        };
    }

    function applyExistingEventDetail(data) {
        if (!data) return;
        const get = valueFromEventDetail(data);
        const eventId = get('eventId', 'EVENT_ID') || resolveCalendarEventId();
        if (eventId) setTextValue('id', eventId);
        setTextValue('title', get('title', 'TITLE'));
        setTextValue('locationText', get('locationText', 'LOCATION_TEXT'));
        setTextValue('locationAddress', get('locationAddress', 'LOCATION_ADDRESS'));
        setTextValue('locationLat', get('locationLat', 'LOCATION_LAT'));
        setTextValue('locationLng', get('locationLng', 'LOCATION_LNG'));
        setTextValue('locationPlaceId', get('locationPlaceId', 'LOCATION_PLACE_ID'));
        setTextValue('descriptionText', get('descriptionText', 'DESCRIPTION_TEXT'));
        setTextValue('recurGroupId', get('recurGroupId', 'RECUR_GROUP_ID'));

        const loadedItemType = get('itemType', 'ITEM_TYPE') || 'PRIVATE';
        const loadedWsId = get('wsId', 'WS_ID');
        const loadedProjId = get('projId', 'PROJ_ID');
        if (loadedWsId && wsSelect) wsSelect.value = loadedWsId;
        if (loadedProjId && projSelect) {
            projSelect.value = loadedProjId;
            const project = getProjectById(loadedProjId);
            if (project && wsSelect && !wsSelect.value) wsSelect.value = project.wsId || project.WS_ID || '';
        }
        setScope(loadedItemType);
        setVisibility(get('visibilityType', 'VISIBILITY_TYPE') === 'MOYO' ? 'MOYO' : 'PRIVATE');
        setEventType(get('eventType', 'EVENT_TYPE') || '');

        setDateTimeParts(get('startDt', 'START_DT'), get('endDt', 'END_DT'), get('allDay', 'ALL_DAY'));
        if (timezoneSelect && get('timezone', 'TIMEZONE')) { timezoneSelect.value = get('timezone', 'TIMEZONE'); syncTimezoneButton(); }
        setReminderValue(get('reminderMinutes', 'REMINDER_MINUTES'), get('reminderYn', 'REMINDER_YN'));

        if (get('isLunar', 'IS_LUNAR') === 'Y') {
            dateTypeSelect.value = 'LUNAR';
            if (lunarMonthInput) lunarMonthInput.value = get('lunarMonth', 'LUNAR_MONTH') || '';
            if (lunarDayInput) lunarDayInput.value = get('lunarDay', 'LUNAR_DAY') || '';
        } else {
            dateTypeSelect.value = 'SOLAR';
        }
        syncDateType();

        const loadedRecurring = get('isRecurring', 'IS_RECURRING') === 'Y';
        const loadedRecurType = get('recurType', 'RECUR_TYPE') || 'WEEKLY';
        const loadedRecurInterval = get('recurInterval', 'RECUR_INTERVAL');
        const loadedUntil = get('untilDt', 'UNTIL_DT');
        const loadedDays = get('recurDays', 'RECUR_DAYS');
        if (recurTypeSelect && loadedRecurType) recurTypeSelect.value = loadedRecurType;
        if (recurIntervalInput && loadedRecurInterval) recurIntervalInput.value = loadedRecurInterval;
        if (untilDtInput) untilDtInput.value = loadedUntil || '';
        setRepeatType(loadedRecurring ? loadedRecurType : '', Boolean(loadedUntil || loadedDays));
        setRepeatEndEnabled(Boolean(loadedUntil), false);
        if (loadedDays) {
            setRepeatDaySelection(loadedDays.split(',').map(function(day) { return String(day || '').trim().toUpperCase(); }).filter(Boolean));
            if (recurTypeSelect && recurTypeSelect.value === 'WEEKLY') toggleRepeatWeekdayField('WEEKLY');
        }

        if (typeof splitLocationDetailFromText === 'function') splitLocationDetailFromText();
        if (typeof updateLocationState === 'function') updateLocationState();
        restoreAttendeesFromDetail(data);
        applyPageMode();
        updateScopeWriteGuard();
    }

    function restoreAttendeesFromDetail(data) {
        const hidden = document.getElementById('calendarAttendeeHiddenFields');
        if (!hidden) return;
        const attendees = data && (data.attendees || data.ATTENDEES);
        if (!Array.isArray(attendees)) return;
        hidden.innerHTML = attendees.map(function(item) {
            const userId = item.userId || item.USER_ID || item.id || item.ID;
            return userId ? '<input type="hidden" name="attendeeUserId" value="' + escapeAttr(userId) + '">' : '';
        }).join('');
        const rows = attendees.map(function(item) {
            return {
                type: 'USER',
                id: item.userId || item.USER_ID || item.id || item.ID,
                name: item.userName || item.USER_NAME || item.name || item.NAME || '참석자',
                email: item.email || item.EMAIL || '',
                imagePath: item.profileImagePath || item.PROFILE_IMAGE_PATH || item.imagePath || item.IMAGE_PATH || '',
                source: item.sourceName || item.SOURCE_NAME || item.email || item.EMAIL || '참석자'
            };
        }).filter(function(item) { return item.id; });
        if (typeof window.__moyoSetCalendarAttendees === 'function') {
            window.__moyoSetCalendarAttendees(rows);
        } else {
            const countEl = document.getElementById('calendarAttendeeCount');
            if (countEl) {
                countEl.textContent = String(rows.length);
                countEl.hidden = rows.length === 0;
            }
        }
    }

    function loadExistingEventForEdit() {
        const eventId = resolveCalendarEventId();
        if (!eventId) return Promise.resolve(null);
        return fetch('/api/calendar/detail?eventId=' + encodeURIComponent(eventId), { credentials: 'same-origin' })
            .then(function(response) {
                if (!response.ok) throw new Error('일정 정보를 불러오지 못했습니다.');
                return response.json();
            })
            .then(function(data) {
                const get = valueFromEventDetail(data);
                if (get('canEditYn', 'CAN_EDIT_YN') !== 'Y') {
                    location.href = '/calendar?viewEventId=' + encodeURIComponent(eventId);
                    return null;
                }
                applyExistingEventDetail(data);
                return data;
            })
            .catch(function(error) {
                alert(error && error.message ? error.message : '일정 정보를 불러오지 못했습니다.');
                return null;
            });
    }

    function loadSpaces() {
        return fetch('/api/calendar/user-spaces')
            .then(function (response) {
                if (!response.ok) throw new Error('공간 조회 실패');
                return response.json();
            })
            .then(function (data) {
                const workspaces = data.workspaces || [];
                const projects = data.projects || [];
                window.__moyoWorkspaces = workspaces;
                window.__moyoProjects = projects;

                workspaces.forEach(function (ws) {
                    const option = document.createElement('option');
                    option.value = ws.wsId || ws.WS_ID || '';
                    option.textContent = ws.wsName || ws.WS_NAME || option.value;
                    wsSelect.appendChild(option);
                });

                projects.forEach(function (project) {
                    const option = document.createElement('option');
                    option.value = project.projId || project.PROJ_ID || '';
                    const wsName = project.wsName || project.WS_NAME || '';
                    const projName = project.projName || project.PROJ_NAME || option.value;
                    option.textContent = wsName ? wsName + ' · ' + projName : projName;
                    projSelect.appendChild(option);
                });
                updateRouteLocationLabel();
                populateCalendarShareSources();
                updateScopeWriteGuard();
            })
            .catch(function (error) {
                console.error(error);
            });
    }

    function validateRepeatRules() {
        const selectedRepeat = repeatMode || '';
        if (isLunarMode() && selectedRepeat && selectedRepeat !== 'YEARLY') {
            alert('음력 일정에서는 반복 안 함 또는 매년 음력 반복만 선택할 수 있습니다.');
            return false;
        }
        if (!isLunarMode() && isMultiDayRange() && selectedRepeat === 'WEEKDAY') {
            alert('기간 일정에서는 주중 매일(월~금) 반복을 사용할 수 없습니다.');
            return false;
        }
        return true;
    }

    function buildPayload() {
        syncDateTimeHidden();
        syncRepeatDaysInput();
        const type = formValue('itemType');
        const currentVisibility = type === 'PRIVATE' && moyoPublicCheckbox && moyoPublicCheckbox.checked ? 'MOYO' : 'PRIVATE';
        setVisibility(currentVisibility);
        return {
            id: numberOrNull(formValue('id')),
            title: formValue('title'),
            startDt: formValue('startDt'),
            endDt: formValue('endDt'),
            itemType: type,
            eventType: formValue('eventType') || null,
            isPrivate: currentVisibility === 'MOYO' ? 'N' : 'Y',
            visibilityType: currentVisibility,
            locationText: getDisplayLocationText() || null,
            locationAddress: formValue('locationAddress') || null,
            locationLat: numberOrNull(formValue('locationLat')),
            locationLng: numberOrNull(formValue('locationLng')),
            locationPlaceId: formValue('locationPlaceId') || null,
            descriptionText: formValue('descriptionText') || null,
            reminderYn: formValue('reminderMinutes') === '' ? 'N' : 'Y',
            reminderMinutes: formValue('reminderMinutes') === '' ? null : numberOrNull(formValue('reminderMinutes')),
            shareTargets: collectShareTargets(),
            attendeeUserIds: collectAttendeeUserIds(),
            userId: numberOrNull(formValue('userId')),
            wsId: type === 'WS' || type === 'PROJ' ? numberOrNull(formValue('wsId')) : null,
            projId: type === 'PROJ' ? numberOrNull(formValue('projId')) : null,
            color: null,
            allDay: formValue('allDay') || 'N',
            timezone: formValue('allDay') === 'Y' ? 'Asia/Seoul' : (formValue('timezone') || 'Asia/Seoul'),
            isRecurring: formValue('isRecurring') || 'N',
            recurType: formValue('isRecurring') === 'Y' ? (formValue('recurType') || 'WEEKLY') : null,
            recurInterval: formValue('isRecurring') === 'Y' ? (numberOrNull(formValue('recurInterval')) || 1) : 1,
            untilDt: formValue('isRecurring') === 'Y' && repeatEndEnabled && repeatEndEnabled.checked ? (formValue('untilDt') || null) : null,
            recurDays: formValue('isRecurring') === 'Y' ? (formValue('recurDays') || null) : null,
            recurGroupId: formValue('recurGroupId') || null,
            isLunar: formValue('isLunar') || 'N',
            lunarMonth: formValue('isLunar') === 'Y' ? (numberOrNull(formValue('lunarMonth')) || numberOrNull((startDateInput && startDateInput.value || '').slice(5, 7))) : null,
            lunarDay: formValue('isLunar') === 'Y' ? (numberOrNull(formValue('lunarDay')) || numberOrNull((startDateInput && startDateInput.value || '').slice(8, 10))) : null,
            recurFreq: null
        };
    }


    function populateCalendarShareSources() {
        const wsSource = document.getElementById('calendarWorkspaceTargetSource');
        const projSource = document.getElementById('calendarProjectTargetSource');
        if (wsSource) {
            wsSource.innerHTML = (window.__moyoWorkspaces || []).map(function(ws) {
                const wsId = ws.wsId || ws.WS_ID || '';
                const wsName = ws.wsName || ws.WS_NAME || '그룹';
                const wsImagePath = ws.wsImagePath || ws.WS_IMAGE_PATH || '';
                return '<div data-ws-id="' + escapeAttr(wsId) + '" data-ws-name="' + escapeAttr(wsName) + '" data-ws-image-path="' + escapeAttr(wsImagePath) + '"></div>';
            }).join('');
        }
        if (projSource) {
            projSource.innerHTML = (window.__moyoProjects || []).map(function(project) {
                const projId = project.projId || project.PROJ_ID || '';
                const projName = project.projName || project.PROJ_NAME || '프로젝트';
                const wsId = project.wsId || project.WS_ID || '';
                const wsName = project.wsName || project.WS_NAME || '';
                return '<div data-proj-id="' + escapeAttr(projId) + '" data-proj-name="' + escapeAttr(projName) + '" data-ws-id="' + escapeAttr(wsId) + '" data-ws-name="' + escapeAttr(wsName) + '"></div>';
            }).join('');
        }
    }

    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function collectAttendeeUserIds() {
        const hidden = document.getElementById('calendarAttendeeHiddenFields');
        if (!hidden) return [];
        return Array.from(hidden.querySelectorAll('input[name="attendeeUserId"]'))
            .map(function(input) { return numberOrNull(input.value); })
            .filter(function(value) { return value != null; });
    }

    function collectAttendeeTargetsForShare() {
        const shareOption = document.getElementById('calendarAttendeeShareOption');
        const hidden = document.getElementById('calendarAttendeeHiddenFields');
        if (!shareOption || !shareOption.checked || !hidden) return [];
        const editOption = document.getElementById('calendarAttendeeEditOption');
        const permissionType = editOption && editOption.checked ? 'EDIT' : 'VIEW';
        const types = Array.from(hidden.querySelectorAll('input[name="attendeeTargetType"]'));
        const ids = Array.from(hidden.querySelectorAll('input[name="attendeeTargetId"]'));
        return types.map(function(input, index) {
            return {
                targetType: normalizeShareTargetType(input.value),
                targetId: numberOrNull(ids[index] && ids[index].value),
                permissionType: permissionType,
                fromAttendee: true
            };
        }).filter(function(row) { return row.targetType && row.targetId; });
    }

    function normalizeShareTargetType(value) {
        const type = String(value || '').trim().toUpperCase();
        if (type === 'WORKSPACE') return 'WS';
        if (type === 'PROJECT') return 'PROJ';
        if (type === 'FRIEND') return 'USER';
        return ['USER', 'WS', 'PROJ'].includes(type) ? type : '';
    }

    function mergeShareTargetRows(rows) {
        const merged = new Map();
        (Array.isArray(rows) ? rows : []).forEach(function(row) {
            const type = normalizeShareTargetType(row && row.targetType);
            const id = numberOrNull(row && row.targetId);
            if (!type || id == null) return;
            const key = type + ':' + id;
            const old = merged.get(key);
            const permissionType = String(row.permissionType || 'VIEW').toUpperCase() === 'EDIT' ? 'EDIT' : 'VIEW';
            merged.set(key, {
                targetType: type,
                targetId: id,
                permissionType: old && old.permissionType === 'EDIT' ? 'EDIT' : permissionType,
                fromAttendee: Boolean((old && old.fromAttendee) || row.fromAttendee)
            });
        });
        return Array.from(merged.values());
    }

    function collectShareTargets() {
        const rows = [];
        if (calendarShareHiddenFields) {
            const types = Array.from(calendarShareHiddenFields.querySelectorAll('input[name="shareTargetType"]'));
            const ids = Array.from(calendarShareHiddenFields.querySelectorAll('input[name="shareTargetId"]'));
            const perms = Array.from(calendarShareHiddenFields.querySelectorAll('input[name="sharePermissionType"]'));
            types.forEach(function(input, index) {
                rows.push({
                    targetType: input.value,
                    targetId: numberOrNull(ids[index] && ids[index].value),
                    permissionType: (perms[index] && perms[index].value) || 'VIEW'
                });
            });
        }
        return mergeShareTargetRows(rows.concat(collectAttendeeTargetsForShare()));
    }

    function setCalendarBadgeCount(el, count) {
        if (!el) return;
        const value = Number(count) || 0;
        el.textContent = String(value);
        el.hidden = value === 0;

        const actionBtn = el.closest('.moyo-event-action-card');
        if (actionBtn) {
            actionBtn.classList.toggle('has-count', value > 0);
        }
    }

    function updateCalendarSharePermissionCounts() {
        const rows = collectShareTargets();
        const editCount = rows.filter(function(row) {
            return String(row && row.permissionType || '').toUpperCase() === 'EDIT';
        }).length;
        setCalendarBadgeCount(document.getElementById('calendarShareCount'), rows.length);
        setCalendarBadgeCount(document.getElementById('calendarPermissionCount'), editCount);
    }

    function initCalendarSharePermissionCountSync() {
        ['calendarAttendeeShareOption', 'calendarAttendeeEditOption'].forEach(function(id) {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.addEventListener('change', updateCalendarSharePermissionCounts);
        });
        ['calendarShareHiddenFields', 'calendarAttendeeHiddenFields'].forEach(function(id) {
            const target = document.getElementById(id);
            if (!target || !window.MutationObserver) return;
            new MutationObserver(updateCalendarSharePermissionCounts).observe(target, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        });
        updateCalendarSharePermissionCounts();
    }

    function syncCalendarShares(contentId) {
        // 신규 일정의 참석자/공유/권한은 register payload의 shareTargets로 함께 저장한다.
        // 프론트에서 다시 /share/api/save를 호출하면 같은 대상에게 요청/알림이 중복될 수 있으므로 유지용 no-op.
        return Promise.resolve();
    }

    function resolveCalendarEventId() {
        const idFieldValue = String(document.getElementById('id')?.value || '').trim();
        if (idFieldValue && idFieldValue !== '0') return idFieldValue;
        const params = new URLSearchParams(window.location.search || '');
        const queryEventId = String(params.get('eventId') || params.get('id') || '').trim();
        return queryEventId && queryEventId !== '0' ? queryEventId : '';
    }

    function isExistingCalendarEvent() {
        return !!resolveCalendarEventId();
    }

    function initCalendarShareModal() {
        if (!window.MoyoShareModal || typeof window.MoyoShareModal.init !== 'function') return;
        if (!document.getElementById('calendarShareModal')) return;
        const calendarEventId = resolveCalendarEventId();
        const isCalendarEditMode = !!calendarEventId;
        window.MoyoShareModal.init({
            contentType: 'CALENDAR',
            contentId: calendarEventId,
            persist: isCalendarEditMode,
            reloadOnPersist: false,
            enablePermission: true,
            bodyOpenClass: 'note-share-modal-open',
            currentUserId: document.getElementById('calendarShareModal')?.dataset.currentUserId || document.body?.dataset.userId || document.getElementById('userId')?.value || '',
            ids: {
                openButton: 'openCalendarShareModal',
                modal: 'calendarShareModal',
                keyword: 'calendarShareKeyword',
                applyButton: 'applyCalendarShareModal',
                title: 'calendarShareModalTitle',
                context: 'calendarShareContext',
                candidates: 'calendarShareCandidates',
                selected: 'calendarShareSelected',
                hiddenFields: 'calendarShareHiddenFields',
                count: 'calendarShareCount',
                modalCount: 'calendarShareModalCount',
                permissionButton: 'openCalendarPermissionModal',
                permissionCount: 'calendarPermissionCount',
                quickEditCheckbox: 'calendarShareEditOption',
                workspaceTargetSource: 'calendarWorkspaceTargetSource',
                projectTargetSource: 'calendarProjectTargetSource',
                workspaceMemberSource: 'calendarWorkspaceMemberSource',
                projectMemberSource: 'calendarProjectMemberSource'
            }
        });
    }

    async function saveEvent() {
        const lunarReady = await syncLunarConversion();
        if (formValue('isLunar') === 'Y' && !lunarReady) return;
        if (!validateRepeatRules()) return;
        const payload = buildPayload();
        if (!payload.title) {
            alert('제목을 입력하세요.');
            return;
        }
        if (!payload.startDt || !payload.endDt) {
            alert('시작/종료 일시를 입력하세요.');
            return;
        }
        if (new Date(payload.endDt) < new Date(payload.startDt)) {
            alert('종료 일시는 시작 일시보다 빠를 수 없습니다.');
            return;
        }
        if (payload.itemType === 'WS' && !payload.wsId) {
            alert('그룹 일정은 그룹 정보가 필요합니다.');
            return;
        }
        if (payload.itemType === 'PROJ' && !payload.projId) {
            alert('프로젝트 일정은 프로젝트 정보가 필요합니다.');
            return;
        }
        if (!canWriteCurrentScope()) {
            alert(scopePermissionMessage() || '일정 등록 권한이 없습니다.');
            updateScopeWriteGuard();
            return;
        }
        fetch('/api/calendar/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (response) {
            return response.text().then(function(text) {
                let data = null;
                try { data = JSON.parse(text); } catch (e) { data = null; }
                if (!response.ok) throw new Error((data && data.message) || text || '저장 실패');
                return data || { success: text === 'SUCCESS', eventId: null, message: text };
            });
        })
        .then(function (result) {
            if (!result || result.success === false) throw new Error(result && result.message ? result.message : '저장 실패');
            return syncCalendarShares(result.eventId || result.id).then(function() { location.href = '/calendar'; });
        })
        .catch(function (error) { alert(error && error.message ? error.message : '저장 실패'); });
    }

    async function validateAndBuildUpdatePayload() {
        const lunarReady = await syncLunarConversion();
        if (formValue('isLunar') === 'Y' && !lunarReady) return null;
        if (!validateRepeatRules()) return null;
        const payload = buildPayload();
        if (!payload.id) {
            alert('수정할 일정 ID가 없습니다.');
            return null;
        }
        if (!payload.title) {
            alert('제목을 입력하세요.');
            return null;
        }
        if (!payload.startDt || !payload.endDt) {
            alert('시작/종료 일시를 입력하세요.');
            return null;
        }
        if (new Date(payload.endDt) < new Date(payload.startDt)) {
            alert('종료 일시는 시작 일시보다 빠를 수 없습니다.');
            return null;
        }
        return payload;
    }

    function getUpdateOccurrenceDate() {
        const original = occurrenceDateInput && occurrenceDateInput.value ? occurrenceDateInput.value : '';
        const visibleDate = startDateInput && startDateInput.value ? startDateInput.value : '';
        const hiddenDate = formValue('startDt') ? formValue('startDt').slice(0, 10) : '';
        return original || visibleDate || hiddenDate || getTodayLocalDate();
    }

    function openUpdateScopeModal() {
        const modal = document.getElementById('calendarUpdateScopeModal');
        const message = document.getElementById('calendarUpdateScopeMessage');
        const title = (document.getElementById('title') && document.getElementById('title').value) || '이 일정';
        if (!modal || !message) {
            performUpdate('ALL');
            return;
        }
        message.textContent = '“' + title + '”은 반복 일정입니다. 수정할 범위를 선택해 주세요.';
        const firstRadio = modal.querySelector('input[name="updateScope"][value="ONE"]');
        if (firstRadio) firstRadio.checked = true;
        modal.hidden = false;
        document.body.classList.add('note-share-modal-open');
    }

    function closeUpdateScopeModal() {
        const modal = document.getElementById('calendarUpdateScopeModal');
        if (modal) modal.hidden = true;
        document.body.classList.remove('note-share-modal-open');
    }

    function getSelectedUpdateScope() {
        if (!isEditingRecurringEvent()) return 'ONE';
        const checked = document.querySelector('input[name="updateScope"]:checked');
        return checked ? checked.value : 'ONE';
    }

    async function performUpdate(scope) {
        const payload = await validateAndBuildUpdatePayload();
        if (!payload) return;
        payload.updateScope = scope || 'ONE';
        payload.occurrenceDate = getUpdateOccurrenceDate();
        payload.originalEventId = payload.id;
        if (formValue('recurGroupId')) payload.recurGroupId = formValue('recurGroupId');

        fetch('/api/calendar/update-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (response) {
            return response.text().then(function(text) {
                let data = null;
                try { data = JSON.parse(text); } catch (e) { data = null; }
                if (!response.ok) throw new Error((data && data.message) || text || '수정 실패');
                return data || { success: /^(SUCCESS|Success)$/i.test(text), message: text };
            });
        })
        .then(function (result) {
            if (!result || result.success === false) {
                throw new Error(result && result.message ? result.message : '수정 실패');
            }
            location.href = '/calendar';
        })
        .catch(function (error) { alert(error && error.message ? error.message : '수정 실패'); });
    }

    function updateEvent() {
        if (isEditingRecurringEvent()) {
            openUpdateScopeModal();
            return;
        }
        performUpdate('ONE');
    }

    let pendingDelete = false;

    function isEditingRecurringEvent() {
        return formValue('isRecurring') === 'Y' || !!formValue('recurGroupId');
    }

    function getDeleteOccurrenceDate() {
        const visibleDate = startDateInput && startDateInput.value ? startDateInput.value : '';
        const hiddenDate = formValue('startDt') ? formValue('startDt').slice(0, 10) : '';
        return visibleDate || hiddenDate || getTodayLocalDate();
    }

    function openDeleteModal() {
        const modal = document.getElementById('calendarDeleteModal');
        const message = document.getElementById('calendarDeleteMessage');
        const repeatBody = document.getElementById('calendarDeleteRepeatBody');
        const title = (document.getElementById('title') && document.getElementById('title').value) || '이 일정';
        const recurring = isEditingRecurringEvent();

        if (!modal || !message || !repeatBody) {
            if (confirm('이 일정을 정말 삭제하시겠습니까?')) performDelete(recurring ? 'ALL' : 'ONE');
            return;
        }

        if (recurring) {
            message.textContent = '“' + title + '”은 반복 일정입니다. 삭제할 범위를 선택해 주세요.';
            repeatBody.hidden = false;
            const firstRadio = repeatBody.querySelector('input[name="deleteScope"][value="ONE"]');
            if (firstRadio) firstRadio.checked = true;
        } else {
            message.textContent = '“' + title + '” 일정을 정말 삭제하시겠습니까?';
            repeatBody.hidden = true;
        }

        modal.hidden = false;
        document.body.classList.add('note-share-modal-open');
    }

    function closeDeleteModal() {
        const modal = document.getElementById('calendarDeleteModal');
        if (modal) modal.hidden = true;
        document.body.classList.remove('note-share-modal-open');
    }

    function getSelectedDeleteScope() {
        if (!isEditingRecurringEvent()) return 'ONE';
        const checked = document.querySelector('input[name="deleteScope"]:checked');
        return checked ? checked.value : 'ONE';
    }

    function performDelete(scope) {
        const id = formValue('id');
        if (!id) {
            alert('삭제할 일정 ID가 없습니다.');
            return;
        }
        if (pendingDelete) return;
        pendingDelete = true;

        const recurGroupId = formValue('recurGroupId');
        const params = new URLSearchParams();
        params.set('eventId', id);
        params.set('deleteScope', scope || 'ONE');
        params.set('occurrenceDate', getDeleteOccurrenceDate());
        params.set('deleteSeries', scope === 'ALL' ? 'Y' : 'N');
        if (recurGroupId) params.set('recurGroupId', recurGroupId);

        fetch('/api/calendar/delete?' + params.toString(), { method: 'DELETE' })
        .then(function (response) {
            return response.text().then(function(text) {
                if (!response.ok) throw new Error(text || '삭제 실패');
                return text;
            });
        })
        .then(function (text) {
            alert(text || '삭제되었습니다.');
            location.href = '/calendar';
        })
        .catch(function (error) {
            alert(error && error.message ? error.message : '삭제 실패');
        })
        .finally(function () {
            pendingDelete = false;
        });
    }

    function deleteEvent() {
        openDeleteModal();
    }

    if (moyoPublicCheckbox) {
        moyoPublicCheckbox.addEventListener('change', function () {
            setVisibility(moyoPublicCheckbox.checked ? 'MOYO' : 'PRIVATE');
        });
    }
    document.querySelectorAll('[data-event-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            setEventType(btn.dataset.eventType);
            setEventTypePopover(false);
        });
    });
    if (eventTypePickerBtn) {
        eventTypePickerBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            setEventTypePopover(eventTypePopover ? eventTypePopover.hidden : false);
        });
    }
    if (eventTypePopover) {
        eventTypePopover.addEventListener('click', function (event) { event.stopPropagation(); });
    }
    if (eventTypePopoverClose) {
        eventTypePopoverClose.addEventListener('click', function () { setEventTypePopover(false); });
    }
    document.addEventListener('click', function () {
        setEventTypePopover(false);
        closeDateTypeMenu();
        setRepeatMenuOpen(false);
        closeTimezoneMenu();
        closeTimePicker();
        closeDatePicker();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setEventTypePopover(false);
            closeDateTypeMenu();
            setRepeatMenuOpen(false);
            closeTimezoneMenu();
            closeTimePicker();
            closeDatePicker();
        }
    });
    window.addEventListener('resize', function() { if (activeTimeInput) positionTimePickerMenu(activeTimeInput); if (activeDateInput) positionDatePickerMenu(activeDateInput); });
    window.addEventListener('scroll', function() { if (activeTimeInput) positionTimePickerMenu(activeTimeInput); if (activeDateInput) positionDatePickerMenu(activeDateInput); }, true);
    document.querySelectorAll('.moyo-time-picker-trigger').forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            const input = document.getElementById(button.dataset.timePickerTarget);
            if (moyoTimePickerMenu && !moyoTimePickerMenu.hidden && activeTimeInput === input) closeTimePicker();
            else openTimePicker(input);
        });
    });
    [startTimeInput, endTimeInput].forEach(function(input) {
        if (!input) return;
        setTimeInputValue(input, input.value || (input === endTimeInput ? '10:00' : '09:00'), input === endTimeInput ? '10:00' : '09:00');
        input.addEventListener('focus', function() { openTimePicker(input); });
        input.addEventListener('click', function(event) { event.stopPropagation(); openTimePicker(input); });
        input.addEventListener('blur', function() { setTimeout(function() { normalizeTimeInputValue(input); }, 120); });
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') { closeTimePicker(); input.blur(); }
            if (event.key === 'Enter') { event.preventDefault(); normalizeTimeInputValue(input); closeTimePicker(); input.blur(); }
        });
    });


    document.querySelectorAll('[data-moyo-date-picker]').forEach(function(input) {
        input.addEventListener('focus', function() { openDatePicker(input); });
        input.addEventListener('click', function(event) { event.stopPropagation(); openDatePicker(input); });
        input.addEventListener('blur', function() { setTimeout(function() { normalizeDateInputValue(input); }, 120); });
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') { closeDatePicker(); input.blur(); }
            if (event.key === 'Enter') { event.preventDefault(); normalizeDateInputValue(input); closeDatePicker(); input.blur(); input.dispatchEvent(new Event('change', { bubbles: true })); }
        });
    });

    [startDateInput, startTimeInput, endDateInput, endTimeInput].forEach(function (input) {
        if (input) input.addEventListener('change', function () {
            ensureEndAfterStart();
            syncDateTimeHidden();
            if (input === startDateInput || input === endDateInput) syncLunarConversion();
            if (input === startDateInput || input === endDateInput) {
                normalizeRepeatForDateRules();
            }
        });
    });
    allDayCheckbox.addEventListener('change', function () {
        if (dateTypeSelect && dateTypeSelect.value === 'LUNAR') {
            setAllDay(true);
            return;
        }
        setAllDay(allDayCheckbox.checked, { rememberTime: allDayCheckbox.checked, restoreTime: !allDayCheckbox.checked });
    });
    repeatBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        setRepeatMenuOpen(repeatMenu ? repeatMenu.hidden : false);
    });
    if (repeatMenu) {
        repeatMenu.addEventListener('click', function (event) {
            event.stopPropagation();
            const choice = event.target.closest('[data-repeat-choice]');
            if (!choice) return;
            setRepeatType(choice.dataset.repeatChoice || '');
        });
    }
    if (repeatWeekdayRow) {
        repeatWeekdayRow.addEventListener('click', function (event) {
            const chip = event.target.closest('.moyo-repeat-weekday-chip');
            if (!chip) return;
            chip.classList.toggle('active');
            if (getSelectedRepeatDays().length === 0) chip.classList.add('active');
            syncRepeatDaysInput();
        });
    }
    if (repeatEndEnabled) {
        repeatEndEnabled.addEventListener('change', function () {
            setRepeatEndEnabled(repeatEndEnabled.checked);
        });
    }
    [startDateInput, endDateInput].forEach(function(input){
        if (!input) return;
        input.addEventListener('change', function(){
            if (repeatEndEnabled && repeatEndEnabled.checked && untilDtInput && !untilDtInput.value) {
                untilDtInput.value = getRepeatEndDefaultDate();
            }
        });
    });
    if (recurTypeSelect) recurTypeSelect.addEventListener('change', syncRepeatDetailText);
    if (dateTypeSelect) dateTypeSelect.addEventListener('change', syncDateType);

    document.getElementById('saveBtn').addEventListener('click', saveEvent);
    document.getElementById('updateBtn').addEventListener('click', updateEvent);
    document.getElementById('deleteBtn').addEventListener('click', deleteEvent);
    document.querySelectorAll('[data-update-close]').forEach(function (btn) {
        btn.addEventListener('click', closeUpdateScopeModal);
    });
    const confirmUpdateScopeBtn = document.getElementById('confirmUpdateScopeBtn');
    if (confirmUpdateScopeBtn) {
        confirmUpdateScopeBtn.addEventListener('click', function () {
            const scope = getSelectedUpdateScope();
            closeUpdateScopeModal();
            performUpdate(scope);
        });
    }
    document.getElementById('cancelBtn').addEventListener('click', function () { location.href = '/calendar'; });
    document.querySelectorAll('[data-delete-close]').forEach(function (btn) {
        btn.addEventListener('click', closeDeleteModal);
    });
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            closeDeleteModal();
            performDelete(getSelectedDeleteScope());
        });
    }

    const locationTextInput = document.getElementById('locationText');
    const locationAddressInput = document.getElementById('locationAddress');
    const locationLatInput = document.getElementById('locationLat');
    const locationLngInput = document.getElementById('locationLng');
    const locationPlaceIdInput = document.getElementById('locationPlaceId');
    const locationDetailWrap = document.getElementById('locationDetailWrap');
    const locationDetailInput = document.getElementById('locationDetailText');
    const locationSelectedNote = document.getElementById('locationSelectedNote');
    const locationPickerBtn = document.getElementById('openLocationPickerBtn');
    const locationPreview = document.getElementById('locationPreview');
    const locationEmptyState = document.getElementById('locationEmptyState');
    const locationPreviewAddress = document.getElementById('locationPreviewAddress');
    const locationMapPreview = document.getElementById('locationMapPreview');
    const openLocationMapBtn = document.getElementById('openLocationMapBtn');

    function loadDaumPostcode(callback) {
        if (window.daum && window.daum.Postcode) {
            callback();
            return;
        }
        const existing = document.getElementById('daumPostcodeScript');
        if (existing) {
            existing.addEventListener('load', callback, { once: true });
            return;
        }
        const script = document.createElement('script');
        script.id = 'daumPostcodeScript';
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.onload = callback;
        script.onerror = function() {
            alert('주소 검색을 불러오지 못했습니다. 장소는 텍스트로 직접 입력할 수 있습니다.');
        };
        document.head.appendChild(script);
    }

    function encodeLocationQuery(query) {
        return encodeURIComponent(String(query || '').trim());
    }

    function getLocationDetailText() {
        return locationDetailInput ? locationDetailInput.value.trim() : '';
    }

    function combineLocationText(address, detail) {
        const base = String(address || '').trim();
        const extra = String(detail || '').trim();
        return [base, extra].filter(Boolean).join(' ');
    }

    function getDisplayLocationText() {
        const address = locationAddressInput ? locationAddressInput.value.trim() : '';
        const text = locationTextInput ? locationTextInput.value.trim() : '';
        const detail = getLocationDetailText();
        return address ? combineLocationText(address, detail) : text;
    }

    function splitLocationDetailFromText() {
        const address = locationAddressInput ? locationAddressInput.value.trim() : '';
        const text = locationTextInput ? locationTextInput.value.trim() : '';
        if (!address || !text || !text.startsWith(address) || !locationDetailInput) return;
        const detail = text.slice(address.length).trim();
        locationTextInput.value = address;
        locationDetailInput.value = detail;
    }

    function syncLocationTextForSubmit() {
        if (!locationTextInput) return;
        const address = locationAddressInput ? locationAddressInput.value.trim() : '';
        if (!address) return;
        locationTextInput.value = combineLocationText(address, getLocationDetailText());
    }

    function getLocationMapQuery() {
        const address = locationAddressInput ? locationAddressInput.value.trim() : '';
        const text = locationTextInput ? locationTextInput.value.trim() : '';
        return address || text;
    }

    function clearPickedLocation() {
        if (locationAddressInput) locationAddressInput.value = '';
        if (locationLatInput) locationLatInput.value = '';
        if (locationLngInput) locationLngInput.value = '';
        if (locationPlaceIdInput) locationPlaceIdInput.value = '';
        if (locationDetailInput) locationDetailInput.value = '';
    }

    function mapPreviewUrl(query) {
        const encoded = encodeLocationQuery(query);
        return encoded ? 'https://maps.google.com/maps?q=' + encoded + '&output=embed' : '';
    }

    function mapExternalUrl(query) {
        const encoded = encodeLocationQuery(query);
        return encoded ? 'https://www.google.com/maps/search/?api=1&query=' + encoded : '';
    }

    function openMapSearch(query) {
        const url = mapExternalUrl(query);
        if (!url) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    function updateLocationState() {
        const text = locationTextInput ? locationTextInput.value.trim() : '';
        const address = locationAddressInput ? locationAddressInput.value.trim() : '';
        const hasPickedAddress = !!address;
        const previewQuery = address || text;

        if (locationDetailWrap) {
            locationDetailWrap.hidden = !hasPickedAddress;
        }
        if (locationSelectedNote) {
            locationSelectedNote.hidden = true;
            locationSelectedNote.textContent = '';
            locationSelectedNote.classList.toggle('is-picked', false);
        }
        if (locationPickerBtn) {
            locationPickerBtn.classList.toggle('is-pending', !hasPickedAddress);
            locationPickerBtn.classList.toggle('is-attached', hasPickedAddress);
            locationPickerBtn.textContent = '검색';
            locationPickerBtn.title = text ? '입력한 장소로 주소 검색' : '주소 검색';
        }
        if (locationPreview) {
            locationPreview.hidden = !hasPickedAddress;
        }
        if (locationEmptyState) {
            locationEmptyState.hidden = hasPickedAddress;
        }
        if (locationPreviewAddress) {
            locationPreviewAddress.textContent = hasPickedAddress ? address : '';
        }
        if (locationMapPreview) {
            const nextSrc = hasPickedAddress ? mapPreviewUrl(previewQuery) : '';
            if (locationMapPreview.getAttribute('src') !== nextSrc) {
                locationMapPreview.setAttribute('src', nextSrc);
            }
        }
        return { text: text, address: address };
    }

    function applyPickedLocation(data) {
        const roadAddress = String(data.roadAddress || '').trim();
        const jibunAddress = String(data.jibunAddress || '').trim();
        const address = roadAddress || jibunAddress;
        const visibleText = address;

        if (locationTextInput) locationTextInput.value = visibleText;
        if (locationDetailInput) locationDetailInput.value = '';
        if (locationAddressInput) locationAddressInput.value = address;
        if (locationLatInput) locationLatInput.value = '';
        if (locationLngInput) locationLngInput.value = '';
        if (locationPlaceIdInput) locationPlaceIdInput.value = data.zonecode || 'DAUM_POSTCODE';
        updateLocationState();
    }

    function openLocationSearch() {
        const state = updateLocationState();
        loadDaumPostcode(function() {
            new window.daum.Postcode({
                oncomplete: applyPickedLocation
            }).open({
                q: state.text || state.address || ''
            });
        });
    }

    if (locationPickerBtn) {
        locationPickerBtn.addEventListener('click', openLocationSearch);
    }
    if (openLocationMapBtn) {
        openLocationMapBtn.addEventListener('click', function() {
            openMapSearch(getLocationMapQuery());
        });
    }
    if (locationTextInput) {
        locationTextInput.addEventListener('input', function() {
            const text = locationTextInput.value.trim();
            // 주소 검색으로 고른 기준 주소는 숨김 필드에 유지한다.
            // 기준 주소 입력칸을 완전히 비웠을 때만 지도 기준 주소를 제거한다.
            if (!text) {
                clearPickedLocation();
            }
            updateLocationState();
        });
    }
    if (locationDetailInput) {
        locationDetailInput.addEventListener('input', updateLocationState);
    }
    splitLocationDetailFromText();
    updateLocationState();
    syncReminderSummary();
    syncEventFormSummary();
    if (reminderMinutesSelect) reminderMinutesSelect.addEventListener('change', syncReminderSummary);
    if (moyoPublicCheckbox) moyoPublicCheckbox.addEventListener('change', syncEventFormSummary);
    if (repeatBtn) repeatBtn.addEventListener('DOMSubtreeModified', syncEventFormSummary);

    if (wsSelect) wsSelect.addEventListener('change', function() {
        updateRouteLocationLabel();
        updateScopeWriteGuard();
        syncEventFormSummary();
    });
    if (projSelect) projSelect.addEventListener('change', function() {
        const project = getProjectById(projSelect.value);
        if (project && wsSelect && !wsSelect.value) wsSelect.value = project.wsId || project.WS_ID || '';
        updateRouteLocationLabel();
        updateScopeWriteGuard();
        syncEventFormSummary();
    });

    function initCalendarAttendeeModal() {
        const openBtn = document.getElementById('openAttendeePickerBtn');
        const modal = document.getElementById('calendarAttendeeModal');
        const keyword = document.getElementById('calendarAttendeeKeyword');
        const contextSelect = document.getElementById('calendarAttendeeContext');
        const candidatesBox = document.getElementById('calendarAttendeeCandidates');
        const selectedBox = document.getElementById('calendarAttendeeSelected');
        const formSelectedBox = document.getElementById('calendarAttendeeFormSelected');
        const countBadge = document.getElementById('calendarAttendeeCount');
        const modalCount = document.getElementById('calendarAttendeeModalCount');
        const hidden = document.getElementById('calendarAttendeeHiddenFields');
        const shareOption = document.getElementById('calendarAttendeeShareOption');
        const editOption = document.getElementById('calendarAttendeeEditOption');
        const applyBtn = document.getElementById('applyCalendarAttendeeModal');
        if (!openBtn || !modal || !keyword || !candidatesBox || !selectedBox) return;

        const selected = new Map();
        const attendeeMemberCache = new Map();
        const attendeeMemberLoading = new Set();
        let activeTab = 'FRIEND';
        let attendeeDetailMode = 'TARGET';
        let cachedCandidates = [];

        function currentUserId() {
            return String(document.getElementById('userId')?.value || document.body?.dataset.userId || '${sessionScope.user.userId}' || '').trim();
        }

        function makeKey(type, id) { return String(type || 'USER').toUpperCase() + '_' + String(id || '').trim(); }

        function normalizeMember(row, sourceLabel, parent) {
            const id = String(row.userId || row.USER_ID || row.id || row.ID || '').trim();
            if (!id || id === currentUserId()) return null;
            const parentType = parent ? String(parent.type || '').toUpperCase() : '';
            const imagePath = parentType
                ? (row.memberProfileImagePath || row.MEMBER_PROFILE_IMAGE_PATH || row.profileImagePath || row.PROFILE_IMAGE_PATH || row.profileImage || row.imagePath || row.IMAGE_PATH || '')
                : (row.profileImagePath || row.PROFILE_IMAGE_PATH || row.profileImage || row.profileImg || row.profileImageUrl || row.profilePath || row.imagePath || row.IMAGE_PATH || '');
            return {
                type: 'USER',
                id,
                name: row.userName || row.USER_NAME || row.displayName || row.DISPLAY_NAME || row.name || row.NAME || row.email || row.EMAIL || '이름 없음',
                email: row.email || row.EMAIL || row.contactEmail || row.CONTACT_EMAIL || '',
                imagePath: imagePath || '',
                subText: sourceLabel || row.roleName || row.WS_ROLE || row.PROJ_ROLE || row.role || row.ROLE || '멤버',
                tabType: parentType === 'WS' ? 'WORKSPACE' : (parentType === 'PROJ' ? 'PROJECT' : 'FRIEND'),
                parentType: parentType,
                parentId: parent ? String(parent.id || '').trim() : ''
            };
        }

        function scopeTargetToAttendee(row, type) {
            const isWorkspace = type === 'WS';
            const id = String(isWorkspace ? (row.wsId || row.WS_ID || row.id || '') : (row.projId || row.PROJ_ID || row.id || '')).trim();
            if (!id) return null;
            const wsName = row.wsName || row.WS_NAME || '';
            const name = isWorkspace ? (row.wsName || row.WS_NAME || row.name || '그룹') : (row.projName || row.PROJ_NAME || row.name || '프로젝트');
            return {
                type: type,
                id: id,
                name: name,
                email: '',
                imagePath: isWorkspace ? (row.wsImagePath || row.WS_IMAGE_PATH || row.imagePath || '') : '',
                subText: isWorkspace ? '그룹 전체' : (wsName ? wsName + ' · 프로젝트 전체' : '프로젝트 전체'),
                tabType: isWorkspace ? 'WORKSPACE' : 'PROJECT',
                wsName: wsName
            };
        }

        function attendeeAvatar(item) {
            const typeClass = attendeeTypeClass(item);
            if (item.imagePath) return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + '"><img src="' + escapeAttr(item.imagePath) + '" alt=""></span>';
            return '<span class="note-write-share-avatar note-share-avatar ' + typeClass + ' is-fallback"><b>' + escapeHtml(String(item.name || '?').slice(0, 1)) + '</b></span>';
        }

        function attendeeTypeClass(item) {
            const type = String(item.type || '').toUpperCase();
            const parentType = String(item.parentType || '').toUpperCase();
            const tabType = String(item.tabType || '').toUpperCase();
            if (type === 'WS') return 'note-share-type-ws';
            if (type === 'PROJ') return 'note-share-type-proj';
            if (parentType === 'WS' || tabType === 'WORKSPACE') return 'note-share-type-user note-share-scope-ws-member';
            if (parentType === 'PROJ' || tabType === 'PROJECT') return 'note-share-type-user note-share-scope-proj-member';
            return 'note-share-type-user';
        }

        function parentSelectionKeyFor(item) {
            const parentType = String(item.parentType || '').toUpperCase();
            const parentId = String(item.parentId || '').trim();
            if (!parentType || !parentId) return '';
            return makeKey(parentType, parentId);
        }

        function isCoveredByParentAttendee(item) {
            const key = parentSelectionKeyFor(item);
            return !!key && selected.has(key);
        }

        function removeCoveredChildAttendees(parentItem) {
            const parentType = String(parentItem.type || '').toUpperCase();
            const parentId = String(parentItem.id || '').trim();
            if (!parentType || !parentId || (parentType !== 'WS' && parentType !== 'PROJ')) return;
            const members = parentType === 'WS' ? getAttendeeWorkspaceMembers(parentId) : getAttendeeProjectMembers(parentId);
            const memberIds = new Set(members.map(function(member) { return String(member.id || '').trim(); }).filter(Boolean));
            Array.from(selected.entries()).forEach(function(entry) {
                const key = entry[0];
                const item = entry[1];
                const sameParent = String(item.parentType || '').toUpperCase() === parentType && String(item.parentId || '') === parentId;
                const sameMember = String(item.type || '').toUpperCase() === 'USER' && memberIds.has(String(item.id || ''));
                if (sameParent || sameMember) selected.delete(key);
            });
        }

        function updateAttendeeModeSwitcher() {
            const subtitle = modal.querySelector('.note-write-share-subtitle');
            if (!subtitle) return;
            let switcher = subtitle.querySelector('.note-share-permission-scope-toggle');
            if (activeTab === 'FRIEND') {
                if (switcher) switcher.remove();
                return;
            }
            if (!switcher) {
                switcher = document.createElement('span');
                switcher.className = 'note-share-permission-scope-toggle';
                subtitle.appendChild(switcher);
            }
            const targetLabel = activeTab === 'PROJECT' ? '프로젝트별' : '그룹별';
            switcher.innerHTML = '<button type="button" class="note-share-permission-scope-btn ' + (attendeeDetailMode === 'TARGET' ? 'is-active' : '') + '" data-attendee-scope="TARGET">' + escapeHtml(targetLabel) + '</button>'
                + '<button type="button" class="note-share-permission-scope-btn ' + (attendeeDetailMode === 'MEMBER' ? 'is-active' : '') + '" data-attendee-scope="MEMBER">멤버별</button>';
            switcher.querySelectorAll('[data-attendee-scope]').forEach(function(button) {
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    const next = String(button.dataset.attendeeScope || 'TARGET').toUpperCase() === 'MEMBER' ? 'MEMBER' : 'TARGET';
                    if (attendeeDetailMode === next) return;
                    attendeeDetailMode = next;
                    keyword.value = '';
                    updateAttendeePlaceholder();
                    loadCandidates(false);
                });
            });
        }

        function updateAttendeePlaceholder() {
            if (activeTab === 'FRIEND') keyword.placeholder = '참석자 이름 또는 이메일 검색';
            else if (activeTab === 'WORKSPACE') keyword.placeholder = attendeeDetailMode === 'MEMBER' ? '그룹 멤버 검색' : '그룹 검색';
            else keyword.placeholder = attendeeDetailMode === 'MEMBER' ? '프로젝트 멤버 검색' : '프로젝트 검색';
        }

        function attendeeSubText(item) {
            const parentType = String(item && item.parentType || '').toUpperCase();
            const tabType = String(item && item.tabType || '').toUpperCase();
            const isScopedMember = parentType === 'WS' || parentType === 'PROJ' || tabType === 'WORKSPACE' || tabType === 'PROJECT';
            const affiliation = String(item && item.subText || '').trim();
            const email = String(item && item.email || '').trim();
            if (isScopedMember) return affiliation || email || '멤버';
            return email || affiliation || '친구';
        }

        function renderRows(items, emptyMessage) {
            if (!items.length) {
                candidatesBox.innerHTML = '<div class="note-write-share-empty">' + escapeHtml(emptyMessage || '선택할 참석자가 없습니다.') + '</div>';
                return;
            }
            items = items.filter(function(item) { return !isCoveredByParentAttendee(item); });
            if (!items.length) {
                candidatesBox.innerHTML = '<div class="note-write-share-empty">' + escapeHtml(emptyMessage || '선택할 참석자가 없습니다.') + '</div>';
                return;
            }
            candidatesBox.innerHTML = items.map(function(item) {
                const key = makeKey(item.type || 'USER', item.id);
                const added = selected.has(key);
                return '<button type="button" class="note-write-share-card ' + attendeeTypeClass(item) + ' ' + (added ? 'is-selected' : '') + '" data-attendee-type="' + escapeAttr(item.type || 'USER') + '" data-attendee-id="' + escapeAttr(item.id) + '">'
                    + attendeeAvatar(item)
                    + '<span class="note-write-share-main"><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(attendeeSubText(item)) + '</small></span>'
                    + '<span class="note-write-share-check" aria-hidden="true"></span>'
                    + '</button>';
            }).join('');
            candidatesBox.querySelectorAll('[data-attendee-id]').forEach(function(row) {
                row.addEventListener('click', function() {
                    const id = makeKey(row.dataset.attendeeType || 'USER', row.dataset.attendeeId);
                    const item = cachedCandidates.find(function(candidate) { return makeKey(candidate.type || 'USER', candidate.id) === id; });
                    if (!item) return;
                    if (selected.has(id)) selected.delete(id);
                    else {
                        if (String(item.type || '').toUpperCase() === 'WS' || String(item.type || '').toUpperCase() === 'PROJ') {
                            fetchAttendeeMembersForParent(item);
                            removeCoveredChildAttendees(item);
                        }
                        selected.set(id, item);
                    }
                    renderCandidates();
                    renderSelected();
                });
            });
        }

        function attendeeTabLabel(tabValue) {
            const value = String(tabValue || '').toUpperCase();
            if (value === 'WORKSPACE') return '그룹';
            if (value === 'PROJECT') return '프로젝트';
            return '친구';
        }

        function attendeeTabCount(tabValue) {
            const value = String(tabValue || '').toUpperCase();
            let count = 0;
            selected.forEach(function(item) {
                const type = String(item.tabType || item.type || '').toUpperCase();
                if (value === 'FRIEND' && (!type || type === 'FRIEND' || type === 'USER')) count += 1;
                if (value === 'WORKSPACE' && type === 'WORKSPACE') count += 1;
                if (value === 'PROJECT' && type === 'PROJECT') count += 1;
            });
            return count;
        }

        function updateAttendeeTabCounts() {
            modal.querySelectorAll('[data-attendee-tab]').forEach(function(tab) {
                const tabValue = tab.dataset.attendeeTab || 'FRIEND';
                const count = attendeeTabCount(tabValue);
                tab.innerHTML = '<span class="note-share-tab-label">' + escapeHtml(attendeeTabLabel(tabValue)) + '</span>'
                    + (count > 0 ? '<span class="note-share-tab-count">' + escapeHtml(count) + '</span>' : '');
            });
        }

        function attendeeChipLabel(item) {
            const type = String(item && item.type || '').toUpperCase();
            const parentType = String(item && item.parentType || '').toUpperCase();
            const tabType = String(item && item.tabType || '').toUpperCase();
            const name = String(item && item.name || '참석자').trim();
            const affiliation = String(item && item.subText || '')
                .replace(/\s*·\s*(그룹|프로젝트)\s*멤버\s*$/, '')
                .trim();
            if (type === 'USER' && (parentType === 'WS' || parentType === 'PROJ' || tabType === 'WORKSPACE' || tabType === 'PROJECT') && affiliation) {
                return name + ' · ' + affiliation;
            }
            return name;
        }

        function renderAttendeeChips(rows, includeRemove) {
            if (!rows.length) return '';
            return rows.map(function(item) {
                const label = attendeeChipLabel(item);
                const remove = includeRemove
                    ? '<button type="button" class="note-share-chip-remove moyo-attendee-chip-remove" data-remove-attendee="' + escapeAttr(makeKey(item.type || 'USER', item.id)) + '" aria-label="' + escapeAttr(label) + ' 제거">×</button>'
                    : '';
                return '<span class="note-share-chip moyo-attendee-chip ' + attendeeTypeClass(item) + '" title="' + escapeAttr(label) + '">'
                    + attendeeAvatar(item)
                    + '<span class="note-share-chip-name moyo-attendee-chip-name" title="' + escapeAttr(label) + '">' + escapeHtml(label) + '</span>'
                    + remove
                    + '</span>';
            }).join('');
        }

        function bindAttendeeRemove(container) {
            if (!container) return;
            container.querySelectorAll('[data-remove-attendee]').forEach(function(button) {
                button.addEventListener('click', function(event) {
                    event.stopPropagation();
                    selected.delete(button.dataset.removeAttendee || '');
                    renderCandidates();
                    renderSelected();
                });
            });
        }

        function renderSelected() {
            const rows = Array.from(selected.values());
            updateAttendeeTabCounts();
            if (countBadge) {
                countBadge.textContent = String(rows.length);
                countBadge.hidden = rows.length === 0;
            }
            if (modalCount) {
                modalCount.textContent = '(' + rows.length + ')';
                modalCount.hidden = rows.length === 0;
            }
            if (hidden) {
                const userIds = expandAttendeeUserIds(rows);
                hidden.innerHTML = userIds.map(function(id) {
                    return '<input type="hidden" name="attendeeUserId" value="' + escapeAttr(id) + '">';
                }).join('') + rows.map(function(item) {
                    return '<input type="hidden" name="attendeeTargetType" value="' + escapeAttr(item.type || 'USER') + '">'
                        + '<input type="hidden" name="attendeeTargetId" value="' + escapeAttr(item.id) + '">';
                }).join('');
            }
            if (formSelectedBox) {
                formSelectedBox.hidden = rows.length === 0;
                formSelectedBox.innerHTML = rows.length ? renderAttendeeChips(rows, true) : '';
                bindAttendeeRemove(formSelectedBox);
            }
            updateCalendarSharePermissionCounts();
            if (!rows.length) {
                selectedBox.innerHTML = '<div class="note-write-share-empty note-write-share-empty-compact">아직 선택된 참석자가 없습니다.</div>';
                return;
            }
            selectedBox.innerHTML = renderAttendeeChips(rows, true);
            bindAttendeeRemove(selectedBox);
        }

        window.__moyoSetCalendarAttendees = function(rows) {
            selected.clear();
            (Array.isArray(rows) ? rows : []).forEach(function(item) {
                const normalized = {
                    type: item.type || 'USER',
                    id: String(item.id || item.userId || item.USER_ID || '').trim(),
                    name: item.name || item.userName || item.USER_NAME || '참석자',
                    email: item.email || item.EMAIL || '',
                    imagePath: item.imagePath || item.profileImagePath || item.PROFILE_IMAGE_PATH || '',
                    subText: item.source || item.sourceName || item.SOURCE_NAME || item.email || item.EMAIL || '참석자',
                    tabType: item.tabType || 'FRIEND',
                    parentType: item.parentType || '',
                    parentId: item.parentId || ''
                };
                if (!normalized.id) return;
                selected.set(makeKey(normalized.type, normalized.id), normalized);
            });
            renderSelected();
        };

        function filterKeyword(items) {
            const q = String(keyword.value || '').trim().toLowerCase();
            if (!q) return items;
            return items.filter(function(item) {
                return [item.name, item.email, item.subText].some(function(value) {
                    return String(value || '').toLowerCase().includes(q);
                });
            });
        }

        function loadFriends() {
            fetch('/friends/api/list?keyword=' + encodeURIComponent(keyword.value || ''), { credentials: 'same-origin' })
                .then(function(res) { return res.ok ? res.json() : { friends: [] }; })
                .then(function(data) {
                    cachedCandidates = (data.friends || []).map(function(row) { return normalizeMember(row, '친구'); }).filter(Boolean);
                    renderCandidates();
                })
                .catch(function() { renderRows([], '친구 목록을 불러오지 못했습니다.'); });
        }

        function getAttendeeWorkspaceTargets() {
            return (window.__moyoWorkspaces || []).map(function(row) { return scopeTargetToAttendee(row, 'WS'); }).filter(Boolean);
        }

        function getAttendeeProjectTargets() {
            return (window.__moyoProjects || []).map(function(row) { return scopeTargetToAttendee(row, 'PROJ'); }).filter(Boolean);
        }

        function attendeeMemberCacheKey(type, id) {
            return String(type || '').toUpperCase() + '_' + String(id || '').trim();
        }

        function fetchAttendeeMembersForParent(parent) {
            const type = String(parent.type || '').toUpperCase();
            const id = String(parent.id || '').trim();
            if (!id || (type !== 'WS' && type !== 'PROJ')) return;
            const key = attendeeMemberCacheKey(type, id);
            if (attendeeMemberCache.has(key) || attendeeMemberLoading.has(key)) return;
            attendeeMemberLoading.add(key);
            const url = type === 'WS' ? '/workspace/api/members?wsId=' + encodeURIComponent(id) : '/project/api/members?projId=' + encodeURIComponent(id);
            fetch(url, { credentials: 'same-origin' })
                .then(function(res) { return res.ok ? res.json() : []; })
                .then(function(data) {
                    const list = Array.isArray(data) ? data : (data.members || data.list || []);
                    const sourceLabel = type === 'WS'
                        ? (parent.name || '그룹') + ' · 그룹 멤버'
                        : ((parent.wsName ? parent.wsName + ' · ' : '') + (parent.name || '프로젝트') + ' · 프로젝트 멤버');
                    attendeeMemberCache.set(key, list.map(function(row) { return normalizeMember(row, sourceLabel, parent); }).filter(Boolean));
                })
                .catch(function() { attendeeMemberCache.set(key, []); })
                .finally(function() {
                    attendeeMemberLoading.delete(key);
                    if ((type === 'WS' && activeTab === 'WORKSPACE') || (type === 'PROJ' && activeTab === 'PROJECT')) {
                        renderCandidates();
                        renderSelected();
                    }
                });
        }

        function getAttendeeWorkspaceMembers(wsId) {
            const key = attendeeMemberCacheKey('WS', wsId);
            return attendeeMemberCache.get(key) || [];
        }

        function getAttendeeProjectMembers(projId) {
            const key = attendeeMemberCacheKey('PROJ', projId);
            return attendeeMemberCache.get(key) || [];
        }

        function expandAttendeeUserIds(rows) {
            const ids = new Set();
            rows.forEach(function(item) {
                const type = String(item.type || 'USER').toUpperCase();
                if (type === 'USER') ids.add(String(item.id));
                else if (type === 'WS') {
                    fetchAttendeeMembersForParent(item);
                    getAttendeeWorkspaceMembers(item.id).forEach(function(member) { if (member.id) ids.add(String(member.id)); });
                } else if (type === 'PROJ') {
                    fetchAttendeeMembersForParent(item);
                    getAttendeeProjectMembers(item.id).forEach(function(member) { if (member.id) ids.add(String(member.id)); });
                }
            });
            return Array.from(ids);
        }

        function loadScopeCandidates() {
            const isWorkspace = activeTab === 'WORKSPACE';
            const parents = isWorkspace ? getAttendeeWorkspaceTargets() : getAttendeeProjectTargets();
            if (attendeeDetailMode === 'TARGET') {
                cachedCandidates = parents;
                renderCandidates();
                parents.forEach(fetchAttendeeMembersForParent);
                return;
            }
            parents.forEach(fetchAttendeeMembersForParent);
            const map = new Map();
            parents.forEach(function(parent) {
                const members = isWorkspace ? getAttendeeWorkspaceMembers(parent.id) : getAttendeeProjectMembers(parent.id);
                members.forEach(function(member) {
                    const key = makeKey('USER', member.id);
                    if (!map.has(key)) map.set(key, member);
                });
            });
            cachedCandidates = Array.from(map.values());
            renderCandidates();
        }

        function renderCandidates() {
            updateAttendeeModeSwitcher();
            renderRows(filterKeyword(cachedCandidates));
        }

        function loadCandidates(preferCurrentScope) {
            if (contextSelect) {
                contextSelect.hidden = true;
                contextSelect.innerHTML = '';
            }
            updateAttendeeModeSwitcher();
            updateAttendeePlaceholder();
            if (activeTab === 'FRIEND') loadFriends();
            else loadScopeCandidates();
        }

        function syncAttendeeQuickOptions() {
            if (!shareOption || !editOption) return;
            editOption.disabled = !shareOption.checked;
            if (!shareOption.checked) editOption.checked = false;
        }

        function openModal() {
            modal.hidden = false;
            document.body.classList.add('note-share-modal-open');
            keyword.value = '';
            syncAttendeeQuickOptions();
            updateAttendeePlaceholder();
            loadCandidates();
            renderSelected();
            updateAttendeeTabCounts();
            setTimeout(function() { keyword.focus(); }, 30);
        }

        function closeModal() {
            modal.hidden = true;
            document.body.classList.remove('note-share-modal-open');
            if (openBtn) openBtn.focus();
        }

        openBtn.addEventListener('click', openModal);
        modal.querySelectorAll('[data-attendee-close]').forEach(function(node) { node.addEventListener('click', closeModal); });
        if (applyBtn) applyBtn.addEventListener('click', closeModal);
        if (shareOption) shareOption.addEventListener('change', syncAttendeeQuickOptions);
        syncAttendeeQuickOptions();
        keyword.addEventListener('input', function() {
            if (activeTab === 'FRIEND') loadFriends();
            else renderCandidates();
        });
        if (contextSelect) {
            contextSelect.addEventListener('change', function() {
                keyword.value = '';
                loadCandidates(false);
            });
        }
        modal.querySelectorAll('[data-attendee-tab]').forEach(function(tab) {
            tab.addEventListener('click', function() {
                activeTab = tab.dataset.attendeeTab || 'FRIEND';
                attendeeDetailMode = 'TARGET';
                modal.querySelectorAll('[data-attendee-tab]').forEach(function(item) { item.classList.toggle('is-active', item === tab); });
                keyword.value = '';
                updateAttendeePlaceholder();
                loadCandidates(true);
                updateAttendeeTabCounts();
            });
        });
        renderSelected();
        updateAttendeeTabCounts();
    }

    setInitialDate();
    setScope(itemType.value || 'PRIVATE');
    applyPageMode();
    setVisibility(visibilityType.value || 'PRIVATE');
    setEventType(eventType.value || '');
    setAllDay(false);
    setRepeatType('');
    syncDateType();
    loadSpaces().then(function() {
        populateCalendarShareSources();
        applyQueryDefaults();
        applyQuickCreateDraftDefaults();
        initCalendarAttendeeModal();
        return loadExistingEventForEdit();
    }).then(function() {
        initCalendarShareModal();
        initCalendarSharePermissionCountSync();
    });
})();
</script>

<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
