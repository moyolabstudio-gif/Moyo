<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>업무 현황</title>
    <style>
        body {
            margin: 0;
            background: #f6f8fa;
            color: #2d3339;
            font-family: 'Pretendard', sans-serif;
        }

        .work-page {
            max-width: 1280px;
            margin: 34px auto 72px;
            padding: 0 24px;
            box-sizing: border-box;
        }

        .top-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 20px;
            text-decoration: none;
            color: #667085;
            font-size: 14px;
            font-weight: 700;
        }

        .top-link:hover {
            color: #4A90E2;
        }

        .work-hero {
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 22px;
            padding: 30px 34px;
            margin-bottom: 24px;
            background:
                radial-gradient(circle at 92% 18%, rgba(85,221,191,.20), transparent 28%),
                radial-gradient(circle at 6% 100%, rgba(74,144,226,.12), transparent 32%),
                #fff;
            border: 1px solid #e4ebf2;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(32,48,64,.045);
            overflow: hidden;
        }

        .work-hero::before {
            content: '';
            position: absolute;
            left: 0;
            top: 28px;
            bottom: 28px;
            width: 5px;
            border-radius: 0 999px 999px 0;
            background: linear-gradient(180deg, #4A90E2, #55DDBF);
        }

        .work-hero-title {
            position: relative;
            z-index: 1;
        }

        .work-hero-title h2 {
            margin: 0;
            font-size: 32px;
            line-height: 1.2;
            letter-spacing: -0.05em;
            color: #111827;
        }

        .work-hero-title p {
            margin: 10px 0 0;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
        }

        .add-work-btn {
            position: relative;
            z-index: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            padding: 0 22px;
            background: linear-gradient(135deg, #4A90E2 0%, #39CDB5 100%);
            color: #fff;
            text-decoration: none;
            border: none;
            border-radius: 999px;
            font-weight: 900;
            font-size: 14px;
            font-family: inherit;
            cursor: pointer;
            box-shadow: 0 10px 22px rgba(57,205,181,.24);
            white-space: nowrap;
        }

        .work-summary {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 22px;
        }

        .summary-card {
            min-width: 0;
            padding: 16px 14px;
            border-radius: 18px;
            border: 1px solid #eef0f2;
            background: #fff;
            box-shadow: 0 4px 14px rgba(32,48,64,.035);
        }

        .summary-card span {
            display: block;
            margin-bottom: 7px;
            color: #777;
            font-size: 12px;
            font-weight: 800;
        }

        .summary-card strong {
            display: block;
            color: #111;
            font-size: 24px;
            font-weight: 900;
            line-height: 1;
        }

        .summary-card.total { background: #f7fbff; border-color: #dcebf8; }
        .summary-card.progress { background: #fff8eb; border-color: #ffe8b8; }
        .summary-card.done { background: #f5fffb; border-color: #d7f3ec; }
        .summary-card.delay { background: #fff5f5; border-color: #ffd6d6; }

        .kanban-board {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            padding: 20px;
            background: #eef5f8;
            border: 1px solid #dfeaf1;
            border-radius: 26px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
        }

        .kanban-column {
            min-width: 0;
            background: rgba(255,255,255,.68);
            border: 1px solid rgba(222,232,240,.95);
            border-radius: 22px;
            padding: 14px;
            box-sizing: border-box;
        }

        .kanban-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            padding: 13px 14px;
            background: rgba(255,255,255,.94);
            border: 1px solid #e7eef5;
            border-radius: 17px;
            box-shadow: 0 5px 14px rgba(32,48,64,.045);
        }

        .kanban-title strong {
            color: #111827;
            font-size: 15px;
            font-weight: 900;
        }

        .kanban-title span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 26px;
            height: 23px;
            border-radius: 999px;
            background: #f8fafc;
            color: #667085;
            font-size: 12px;
            font-weight: 900;
        }

        .task-list {
            min-height: 420px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .task-list.drag-over {
            outline: 2px dashed #55DDBF;
            outline-offset: 4px;
            border-radius: 16px;
            background: rgba(85,221,191,.08);
        }

        .task-card {
            position: relative;
            padding: 16px 16px 14px;
            background: #fff;
            border: 1px solid #e6edf4;
            border-radius: 16px;
            box-shadow: 0 7px 18px rgba(32,48,64,.045);
            cursor: grab;
            transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .task-card:active {
            cursor: grabbing;
        }

        .task-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 16px;
            bottom: 16px;
            width: 4px;
            border-radius: 0 999px 999px 0;
            background: linear-gradient(180deg, #4A90E2, #55DDBF);
        }

        .task-card:hover {
            transform: translateY(-2px);
            border-color: #d7e8f7;
            box-shadow: 0 12px 24px rgba(74,144,226,.09);
        }

        .task-card.delayed {
            border-color: #ffd6d6;
            background: #fffafa;
        }

        .task-title {
            color: #111827;
            font-size: 14px;
            font-weight: 900;
            line-height: 1.45;
            word-break: break-word;
            margin-bottom: 8px;
        }

        .task-meta {
            color: #8a96a3;
            font-size: 12px;
            font-weight: 700;
            line-height: 1.5;
        }

        .task-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
        }

        .task-badge {
            display: inline-flex;
            align-items: center;
            height: 22px;
            padding: 0 8px;
            border-radius: 999px;
            background: #f8fafc;
            color: #667085;
            border: 1px solid #eef0f2;
            font-size: 11px;
            font-weight: 900;
        }

        .task-badge.delay {
            background: #fff5f5;
            color: #ff4d4d;
            border-color: #ffd6d6;
        }

        .empty-column {
            padding: 30px 12px;
            text-align: center;
            color: #a0a8b3;
            font-size: 13px;
            border: 1px dashed #dce3ea;
            border-radius: 15px;
            background: rgba(255,255,255,.52);
        }

        .modal-backdrop-custom {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(17,24,39,.38);
            z-index: 999;
        }

        .modal-backdrop-custom.active {
            display: block;
        }

        .work-modal {
            display: none;
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: min(520px, calc(100vw - 32px));
            background: #fff;
            border-radius: 20px;
            border: 1px solid #e9eef2;
            box-shadow: 0 18px 40px rgba(17,24,39,.16);
            z-index: 1000;
            overflow: hidden;
        }

        .work-modal.active {
            display: block;
        }

        .work-modal-header {
            padding: 22px 24px;
            border-bottom: 1px solid #eef0f2;
        }

        .work-modal-header h3 {
            margin: 0;
            color: #111827;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.04em;
        }

        .work-modal-body {
            padding: 22px 24px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-size: 13px;
            font-weight: 900;
        }

        .form-control {
            width: 100%;
            min-height: 40px;
            border: 1px solid #dbe3ea;
            border-radius: 12px;
            padding: 10px 12px;
            box-sizing: border-box;
            font-size: 14px;
            font-family: inherit;
        }

        .form-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 16px 24px 22px;
            border-top: 1px solid #eef0f2;
        }

        .modal-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 38px;
            padding: 0 16px;
            border-radius: 999px;
            border: 1px solid transparent;
            font-size: 13px;
            font-weight: 900;
            font-family: inherit;
            cursor: pointer;
        }

        .modal-btn.cancel {
            background: #fff;
            color: #555;
            border-color: #dde3ea;
        }

        .modal-btn.primary {
            background: linear-gradient(135deg, #4A90E2 0%, #39CDB5 100%);
            color: #fff;
        }

        .modal-btn.danger {
            background: #fff5f5;
            color: #ff4d4d;
            border-color: #ffd6d6;
            margin-right: auto;
        }

        @media(max-width: 920px) {
            .kanban-board {
                grid-template-columns: 1fr;
            }

            .task-list {
                min-height: 180px;
            }

            .work-summary {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }

        @media(max-width: 640px) {
            .work-page {
                padding: 0 16px;
            }

            .work-hero {
                flex-direction: column;
                align-items: flex-start;
                padding: 26px 22px;
            }

            .add-work-btn {
                width: 100%;
            }

            .work-summary {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .form-row {
                grid-template-columns: 1fr;
            }

            .modal-actions {
                flex-direction: column-reverse;
            }

            .modal-btn {
                width: 100%;
            }

            .modal-btn.danger {
                margin-right: 0;
            }
        }
            .admin-only-work-field {
            display: none;
        }

        body.admin-mode .admin-only-work-field {
            display: block;
        }


        /* 업무 모달 AMPM only override */

        .work-modal-guide {
            margin: -4px 0 18px;
            color: #777;
            font-size: 13px;
            line-height: 1.5;
        }

        .work-field-help {
            margin: 5px 0 0;
            color: #8a96a3;
            font-size: 11px;
            line-height: 1.4;
        }

        .admin-only-work-field {
            display: none !important;
        }

        body.admin-mode .admin-only-work-field {
            display: block !important;
        }


        /* 업무 전체 페이지 모달 디자인 개선 v2 */
        .work-modal-guide {
            margin: -4px 0 18px;
            color: #777;
            font-size: 13px;
            line-height: 1.5;
        }

        .work-date-box {
            padding: 14px;
            margin-bottom: 14px;
            border: 1px solid #e8eef5;
            border-radius: 16px;
            background: #fbfdff;
        }

        .work-slot-radio-group {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
        }

        .work-slot-radio {
            margin: 0;
            cursor: pointer;
        }

        .work-slot-radio input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }

        .work-slot-radio span {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 38px;
            border: 1px solid #dbe3ea;
            border-radius: 12px;
            background: #fff;
            color: #667085;
            font-size: 12px;
            font-weight: 900;
            transition: .16s ease;
        }

        .work-slot-radio input:checked + span {
            border-color: #4A90E2;
            background: #eef7ff;
            color: #2f7dd1;
            box-shadow: 0 4px 12px rgba(74,144,226,.10);
        }

        .admin-only-work-field {
            display: none !important;
        }

        body.admin-mode .admin-only-work-field {
            display: block !important;
        }


        /* ===== 업무 전체 페이지 모달 안정형 ===== */
        .work-modal {
            width: min(460px, calc(100vw - 32px));
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid #e6edf4;
            box-shadow: 0 22px 50px rgba(17,24,39,.18);
        }

        .work-modal-header {
            padding: 22px 24px 16px;
            border-bottom: 1px solid #eef0f2;
            background:
                radial-gradient(circle at 95% 0%, rgba(85,221,191,.20), transparent 32%),
                linear-gradient(135deg, rgba(74,144,226,.10), rgba(255,255,255,.95));
        }

        .work-modal-header h3 {
            margin: 0;
            color: #111827;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -.04em;
        }

        .work-modal-body {
            padding: 19px 24px 18px;
        }

        .work-stable-body {
            width: 100%;
        }

        .work-field {
            margin-bottom: 13px;
        }

        .work-field label {
            display: block;
            margin-bottom: 7px;
            color: #374151;
            font-size: 12px;
            font-weight: 900;
        }

        .work-field .form-control {
            width: 100%;
            min-height: 40px;
            box-sizing: border-box;
            border: 1px solid #dbe3ea;
            border-radius: 12px;
            padding: 9px 11px;
            background: #fff;
            color: #222;
            font-size: 14px;
            font-family: inherit;
            outline: none;
        }

        .work-field .form-control:focus {
            border-color: #4A90E2;
            box-shadow: 0 0 0 4px rgba(74,144,226,.10);
        }

        .work-date-card {
            padding: 14px;
            margin-bottom: 13px;
            border: 1px solid #e8eef5;
            border-radius: 16px;
            background: #fbfdff;
        }

        .work-date-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 132px;
            gap: 9px;
            align-items: start;
        }

        .work-date-row + .work-date-row {
            margin-top: 10px;
        }

        .admin-only-work-field {
            display: none !important;
        }

        body.admin-mode .admin-only-work-field {
            display: block !important;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 16px 24px 22px;
            border-top: 1px solid #eef0f2;
            background: #fff;
        }

        .modal-btn {
            min-height: 36px;
            padding: 0 15px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 900;
        }

        .modal-btn.primary {
            background: linear-gradient(135deg, #4A90E2 0%, #39CDB5 100%);
            color: #fff;
            box-shadow: 0 8px 18px rgba(57,205,181,.20);
        }

        .modal-btn.cancel {
            background: #fff;
            color: #555;
            border-color: #dde3ea;
        }

        .modal-btn.danger {
            background: #fff5f5;
            color: #ff4d4d;
            border-color: #ffd6d6;
            margin-right: auto;
        }

        /* 업무 전체 페이지 카드 정보 정리 */
        .task-card .task-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
            color: #667085;
            font-size: 12px;
            line-height: 1.45;
        }

        .task-card .task-meta b {
            color: #4A90E2;
        }

        @media(max-width: 520px) {
            .work-date-row {
                grid-template-columns: 1fr;
                gap: 0;
            }
        }
        /* ===== End 업무 전체 페이지 모달 안정형 ===== */


        /* ===== 멤버별 진행 현황 ===== */
        .member-progress-section {
            margin-top: 22px;
            padding: 22px;
            background: #fff;
            border: 1px solid #e4ebf2;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(32,48,64,.045);
        }

        .member-progress-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 16px;
        }

        .member-progress-header h3 {
            margin: 0;
            color: #111827;
            font-size: 21px;
            font-weight: 900;
            letter-spacing: -0.045em;
        }

        .member-progress-header p {
            margin: 7px 0 0;
            color: #777;
            font-size: 13px;
        }

        .member-progress-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        .member-progress-card {
            min-width: 0;
            border: 1px solid #edf1f5;
            border-radius: 18px;
            background: #fbfdff;
            overflow: hidden;
        }

        .member-progress-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 15px 16px;
            background: #fff;
            border-bottom: 1px solid #edf1f5;
        }

        .member-profile {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .member-avatar {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 999px;
            background: linear-gradient(135deg, #4A90E2 0%, #39CDB5 100%);
            color: #fff;
            font-size: 13px;
            font-weight: 900;
        }

        .member-name {
            min-width: 0;
        }

        .member-name strong {
            display: block;
            color: #111827;
            font-size: 15px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .member-name span {
            display: block;
            margin-top: 3px;
            color: #98a2b3;
            font-size: 11px;
            font-weight: 800;
        }

        .member-counts {
            flex-shrink: 0;
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .member-count-pill {
            display: inline-flex;
            align-items: center;
            height: 22px;
            padding: 0 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
            border: 1px solid #edf1f5;
            background: #f8fafc;
            color: #667085;
        }

        .member-count-pill.progress {
            background: #fff8eb;
            border-color: #ffe8b8;
            color: #d98600;
        }

        .member-count-pill.done {
            background: #f5fffb;
            border-color: #d7f3ec;
            color: #0E9F8B;
        }

        .member-count-pill.delay {
            background: #fff5f5;
            border-color: #ffd6d6;
            color: #ff4d4d;
        }

        .member-task-list {
            padding: 10px 12px 13px;
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .member-task-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 9px 10px;
            border: 1px solid #eef2f6;
            border-radius: 12px;
            background: #fff;
            cursor: pointer;
        }

        .member-task-item:hover {
            background: #fbfdff;
            border-color: #dcebf8;
        }

        .member-task-title {
            min-width: 0;
            flex: 1;
        }

        .member-task-title strong {
            display: block;
            color: #222;
            font-size: 13px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .member-task-title span {
            display: block;
            margin-top: 3px;
            color: #98a2b3;
            font-size: 11px;
            font-weight: 800;
        }

        .member-task-status {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            height: 22px;
            padding: 0 8px;
            border-radius: 999px;
            background: #f8fafc;
            border: 1px solid #edf1f5;
            color: #667085;
            font-size: 11px;
            font-weight: 900;
        }

        .member-task-status.progress {
            background: #fff8eb;
            border-color: #ffe8b8;
            color: #d98600;
        }

        .member-task-status.done {
            background: #f5fffb;
            border-color: #d7f3ec;
            color: #0E9F8B;
        }

        .member-task-status.delay {
            background: #fff5f5;
            border-color: #ffd6d6;
            color: #ff4d4d;
        }

        .member-more-link {
            display: block;
            padding: 4px 2px 0;
            color: #4A90E2;
            font-size: 12px;
            font-weight: 900;
            text-align: center;
            text-decoration: none;
        }

        .member-progress-empty {
            grid-column: 1 / -1;
            padding: 28px 16px;
            border: 1px dashed #dce3ea;
            border-radius: 16px;
            background: #fafbfc;
            text-align: center;
            color: #999;
            font-size: 13px;
        }

        @media(max-width: 900px) {
            .member-progress-list {
                grid-template-columns: 1fr;
            }
        }

        @media(max-width: 560px) {
            .member-progress-top {
                flex-direction: column;
                align-items: flex-start;
            }

            .member-counts {
                justify-content: flex-start;
            }
        }
        /* ===== End 멤버별 진행 현황 ===== */


        /* ===== MOYO 상태 색상 통일 ===== */
        :root {
            --moyo-todo-bg: #FFF7E6;
            --moyo-todo-border: #FFE2A8;
            --moyo-todo-text: #D98600;

            --moyo-progress-bg: #EAF7FF;
            --moyo-progress-border: #BFE7FF;
            --moyo-progress-text: #1683D8;

            --moyo-done-bg: #EDFFF8;
            --moyo-done-border: #BDEEDC;
            --moyo-done-text: #0E9F8B;

            --moyo-delay-bg: #FFF1F1;
            --moyo-delay-border: #FFCACA;
            --moyo-delay-text: #F04444;
        }

        .status-todo {
            background: var(--moyo-todo-bg) !important;
            border-color: var(--moyo-todo-border) !important;
            color: var(--moyo-todo-text) !important;
        }

        .status-progress {
            background: var(--moyo-progress-bg) !important;
            border-color: var(--moyo-progress-border) !important;
            color: var(--moyo-progress-text) !important;
        }

        .status-done {
            background: var(--moyo-done-bg) !important;
            border-color: var(--moyo-done-border) !important;
            color: var(--moyo-done-text) !important;
        }

        .status-delay {
            background: var(--moyo-delay-bg) !important;
            border-color: var(--moyo-delay-border) !important;
            color: var(--moyo-delay-text) !important;
        }

        .kanban-column.todo .kanban-header,
        .task-column.todo .task-column-header {
            background: var(--moyo-todo-bg) !important;
            color: var(--moyo-todo-text) !important;
            border-color: var(--moyo-todo-border) !important;
        }

        .kanban-column.progress .kanban-header,
        .task-column.progress .task-column-header {
            background: var(--moyo-progress-bg) !important;
            color: var(--moyo-progress-text) !important;
            border-color: var(--moyo-progress-border) !important;
        }

        .kanban-column.done .kanban-header,
        .task-column.done .task-column-header {
            background: var(--moyo-done-bg) !important;
            color: var(--moyo-done-text) !important;
            border-color: var(--moyo-done-border) !important;
        }

        .main-task-status,
        .task-status-pill,
        .member-task-status,
        .member-count-pill,
        .task-badge {
            border-width: 1px;
            border-style: solid;
        }
        /* ===== End MOYO 상태 색상 통일 ===== */


        /* ===== workList 상태 색상 통일 보강 ===== */
        .task-badge,
        .member-task-status,
        .member-count-pill {
            border-width: 1px;
            border-style: solid;
        }

        .task-badge:not(.delay),
        .member-task-status:not(.progress):not(.done):not(.delay),
        .member-count-pill:not(.progress):not(.done):not(.delay) {
            background: var(--moyo-todo-bg) !important;
            border-color: var(--moyo-todo-border) !important;
            color: var(--moyo-todo-text) !important;
        }

        .task-badge.progress,
        .member-task-status.progress,
        .member-count-pill.progress {
            background: var(--moyo-progress-bg) !important;
            border-color: var(--moyo-progress-border) !important;
            color: var(--moyo-progress-text) !important;
        }

        .task-badge.done,
        .member-task-status.done,
        .member-count-pill.done {
            background: var(--moyo-done-bg) !important;
            border-color: var(--moyo-done-border) !important;
            color: var(--moyo-done-text) !important;
        }

        .task-badge.delay,
        .member-task-status.delay,
        .member-count-pill.delay {
            background: var(--moyo-delay-bg) !important;
            border-color: var(--moyo-delay-border) !important;
            color: var(--moyo-delay-text) !important;
        }
        /* ===== End workList 상태 색상 통일 보강 ===== */


        /* ===== workList 상태 색상 실제 적용 ===== */
        :root {
            --moyo-todo-bg: #FFF7E6;
            --moyo-todo-border: #FFE2A8;
            --moyo-todo-text: #D98600;

            --moyo-progress-bg: #EAF7FF;
            --moyo-progress-border: #BFE7FF;
            --moyo-progress-text: #1683D8;

            --moyo-done-bg: #EDFFF8;
            --moyo-done-border: #BDEEDC;
            --moyo-done-text: #0E9F8B;

            --moyo-delay-bg: #FFF1F1;
            --moyo-delay-border: #FFCACA;
            --moyo-delay-text: #F04444;
        }

        .summary-card.todo {
            background: var(--moyo-todo-bg) !important;
            border-color: var(--moyo-todo-border) !important;
        }

        .summary-card.todo span,
        .summary-card.todo strong {
            color: var(--moyo-todo-text) !important;
        }

        .summary-card.progress {
            background: var(--moyo-progress-bg) !important;
            border-color: var(--moyo-progress-border) !important;
        }

        .summary-card.progress span,
        .summary-card.progress strong {
            color: var(--moyo-progress-text) !important;
        }

        .summary-card.done {
            background: var(--moyo-done-bg) !important;
            border-color: var(--moyo-done-border) !important;
        }

        .summary-card.done span,
        .summary-card.done strong {
            color: var(--moyo-done-text) !important;
        }

        .summary-card.delay {
            background: var(--moyo-delay-bg) !important;
            border-color: var(--moyo-delay-border) !important;
        }

        .summary-card.delay span,
        .summary-card.delay strong {
            color: var(--moyo-delay-text) !important;
        }

        .kanban-column.todo .kanban-title {
            background: var(--moyo-todo-bg) !important;
            border-color: var(--moyo-todo-border) !important;
        }

        .kanban-column.todo .kanban-title strong,
        .kanban-column.todo .kanban-title span {
            color: var(--moyo-todo-text) !important;
        }

        .kanban-column.progress .kanban-title {
            background: var(--moyo-progress-bg) !important;
            border-color: var(--moyo-progress-border) !important;
        }

        .kanban-column.progress .kanban-title strong,
        .kanban-column.progress .kanban-title span {
            color: var(--moyo-progress-text) !important;
        }

        .kanban-column.done .kanban-title {
            background: var(--moyo-done-bg) !important;
            border-color: var(--moyo-done-border) !important;
        }

        .kanban-column.done .kanban-title strong,
        .kanban-column.done .kanban-title span {
            color: var(--moyo-done-text) !important;
        }

        .task-card.status-todo {
            border-color: var(--moyo-todo-border) !important;
        }

        .task-card.status-todo::before {
            background: linear-gradient(180deg, #F6A609, #FFD166) !important;
        }

        .task-card.status-progress {
            border-color: var(--moyo-progress-border) !important;
        }

        .task-card.status-progress::before {
            background: linear-gradient(180deg, #3BA7F5, #8BD5FF) !important;
        }

        .task-card.status-done {
            border-color: var(--moyo-done-border) !important;
        }

        .task-card.status-done::before {
            background: linear-gradient(180deg, #14B8A6, #55DDBF) !important;
        }

        .task-card.delayed {
            border-color: var(--moyo-delay-border) !important;
            background: #fffafa !important;
        }

        .task-card.delayed::before {
            background: linear-gradient(180deg, #F04444, #FF9F9F) !important;
        }

        .task-badge.status-todo,
        .member-task-status.status-todo,
        .member-count-pill.status-todo {
            background: var(--moyo-todo-bg) !important;
            border-color: var(--moyo-todo-border) !important;
            color: var(--moyo-todo-text) !important;
        }

        .task-badge.status-progress,
        .task-badge.progress,
        .member-task-status.status-progress,
        .member-task-status.progress,
        .member-count-pill.status-progress,
        .member-count-pill.progress {
            background: var(--moyo-progress-bg) !important;
            border-color: var(--moyo-progress-border) !important;
            color: var(--moyo-progress-text) !important;
        }

        .task-badge.status-done,
        .task-badge.done,
        .member-task-status.status-done,
        .member-task-status.done,
        .member-count-pill.status-done,
        .member-count-pill.done {
            background: var(--moyo-done-bg) !important;
            border-color: var(--moyo-done-border) !important;
            color: var(--moyo-done-text) !important;
        }

        .task-badge.delay,
        .member-task-status.delay,
        .member-count-pill.delay {
            background: var(--moyo-delay-bg) !important;
            border-color: var(--moyo-delay-border) !important;
            color: var(--moyo-delay-text) !important;
        }

        /* 카드 내부 텍스트도 상태별로 살짝 정리 */
        .task-card .task-meta b {
            color: #4A90E2;
        }
        /* ===== End workList 상태 색상 실제 적용 ===== */


        /* ===== workList 프로젝트 메인 스타일 적용 ===== */
        .work-page {
            max-width: 1240px;
        }

        .work-hero {
            position: relative;
            margin-bottom: 24px;
            padding: 30px 34px;
            border: 1px solid #dcebf8;
            border-radius: 26px;
            background:
                radial-gradient(circle at 96% 20%, rgba(85,221,191,.26), transparent 30%),
                linear-gradient(135deg, rgba(74,144,226,.10), rgba(255,255,255,.94));
            box-shadow: 0 12px 28px rgba(32,48,64,.045);
            overflow: hidden;
        }

        .work-hero::before {
            content: '';
            position: absolute;
            left: 0;
            top: 28px;
            width: 4px;
            height: 72px;
            border-radius: 0 999px 999px 0;
            background: linear-gradient(180deg, #4A90E2, #55DDBF);
        }

        .work-hero h1 {
            margin: 0;
            color: #0f172a;
            font-size: 30px;
            font-weight: 900;
            letter-spacing: -0.055em;
        }

        .work-hero p {
            margin: 8px 0 0;
            color: #667085;
            font-size: 14px;
            font-weight: 700;
        }

        .work-hero .add-work-btn {
            position: absolute;
            right: 34px;
            top: 50%;
            transform: translateY(-50%);
            min-height: 44px;
            padding: 0 22px;
            border-radius: 999px;
            background: linear-gradient(135deg, #4A90E2 0%, #39CDB5 100%);
            box-shadow: 0 10px 22px rgba(57,205,181,.22);
        }

        .work-summary {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
        }

        .summary-card {
            min-height: 76px;
            padding: 15px 16px;
            border-radius: 16px;
            background: #fff;
            border: 1px solid #e4ebf2;
            box-shadow: 0 8px 18px rgba(32,48,64,.035);
        }

        .summary-card span {
            display: block;
            margin-bottom: 9px;
            font-size: 12px;
            font-weight: 900;
            color: #667085;
        }

        .summary-card strong {
            font-size: 25px;
            line-height: 1;
            font-weight: 900;
        }

        .summary-card.total {
            background: #f7fbff !important;
            border-color: #dcebf8 !important;
        }

        .summary-card.total strong {
            color: #111827 !important;
        }

        .kanban-board {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            padding: 20px;
            border-radius: 26px;
            border: 1px solid #dfeaf1;
            background: #eef5f8;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
        }

        .kanban-column {
            min-width: 0;
            padding: 14px;
            border-radius: 22px;
            border: 1px solid rgba(222,232,240,.95);
            background: rgba(255,255,255,.66);
        }

        .kanban-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            min-height: 48px;
            margin-bottom: 12px;
            padding: 0 14px;
            border-radius: 17px;
            border: 1px solid #e7eef5;
            box-shadow: 0 5px 14px rgba(32,48,64,.045);
        }

        .kanban-title strong {
            font-size: 15px;
            font-weight: 900;
            letter-spacing: -0.03em;
        }

        .kanban-title span {
            min-width: 26px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: rgba(255,255,255,.75);
            font-size: 12px;
            font-weight: 900;
        }

        .task-list {
            min-height: 430px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .task-card {
            position: relative;
            min-height: 62px;
            padding: 12px 13px 11px 15px !important;
            border-radius: 14px !important;
            border: 1px solid #edf1f5 !important;
            background: #fff !important;
            box-shadow: 0 6px 16px rgba(32,48,64,.045);
            cursor: pointer;
            overflow: hidden;
            transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
        }

        .task-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 12px;
            bottom: 12px;
            width: 4px;
            border-radius: 0 999px 999px 0;
            background: linear-gradient(180deg, #4A90E2, #55DDBF);
        }

        .task-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 22px rgba(74,144,226,.11);
        }

        .task-card.status-todo::before {
            background: linear-gradient(180deg, #F6A609, #FFD166) !important;
        }

        .task-card.status-progress::before {
            background: linear-gradient(180deg, #3BA7F5, #8BD5FF) !important;
        }

        .task-card.status-done::before {
            background: linear-gradient(180deg, #14B8A6, #55DDBF) !important;
        }

        .task-card.delayed::before {
            background: linear-gradient(180deg, #F04444, #FF9F9F) !important;
        }

        .work-task-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding-left: 4px;
        }

        .work-task-title {
            min-width: 0;
            flex: 1;
            color: #111827;
            font-size: 13px;
            font-weight: 900;
            line-height: 1.35;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .work-task-status {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            height: 22px;
            padding: 0 8px;
            border-radius: 999px;
            border: 1px solid #edf1f5;
            font-size: 10px;
            font-weight: 900;
            white-space: nowrap;
        }

        .work-task-sub {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            margin-top: 8px;
            padding-left: 4px;
            color: #98a2b3;
            font-size: 11px;
            font-weight: 800;
            line-height: 1.35;
        }

        .work-task-assignee {
            flex-shrink: 0;
            max-width: 82px;
            height: 20px;
            padding: 0 7px;
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            background: #eef7ff;
            color: #2f7dd1;
            font-size: 10px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .work-task-period {
            min-width: 0;
            color: #98a2b3;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .empty-column {
            padding: 30px 12px;
            text-align: center;
            color: #a0a8b3;
            font-size: 13px;
            border: 1px dashed #dce3ea;
            border-radius: 15px;
            background: rgba(255,255,255,.52);
        }

        .member-progress-section {
            margin-top: 24px;
        }

        @media(max-width: 980px) {
            .work-summary {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .kanban-board {
                grid-template-columns: 1fr;
            }

            .work-hero .add-work-btn {
                position: static;
                transform: none;
                margin-top: 18px;
            }
        }
        /* ===== End workList 프로젝트 메인 스타일 적용 ===== */


        /* ===== workList 카드 배경 중립화 ===== */
        .task-card,
        .task-card.status-todo,
        .task-card.status-progress,
        .task-card.status-done,
        .task-card.delayed {
            background: #fff !important;
        }

        .task-card.status-todo {
            border-color: #edf1f5 !important;
        }

        .task-card.status-progress {
            border-color: #edf1f5 !important;
        }

        .task-card.status-done {
            border-color: #edf1f5 !important;
        }

        .task-card.delayed {
            border-color: #ffd6d6 !important;
            background: #fff !important;
        }

        .task-card.status-todo::before {
            background: linear-gradient(180deg, #F6A609, #FFD166) !important;
        }

        .task-card.status-progress::before {
            background: linear-gradient(180deg, #3BA7F5, #8BD5FF) !important;
        }

        .task-card.status-done::before {
            background: linear-gradient(180deg, #14B8A6, #55DDBF) !important;
        }

        .task-card.delayed::before {
            background: linear-gradient(180deg, #F04444, #FF9F9F) !important;
        }

        .work-task-status.status-todo,
        .task-badge.status-todo {
            background: #fff7e6 !important;
            border-color: #ffe2a8 !important;
            color: #d98600 !important;
        }

        .work-task-status.status-progress,
        .task-badge.status-progress {
            background: #eaf7ff !important;
            border-color: #bfe7ff !important;
            color: #1683d8 !important;
        }

        .work-task-status.status-done,
        .task-badge.status-done {
            background: #edfff8 !important;
            border-color: #bdeedc !important;
            color: #0e9f8b !important;
        }

        .work-task-status.status-delay,
        .task-badge.delay {
            background: #fff1f1 !important;
            border-color: #ffcaca !important;
            color: #f04444 !important;
        }

        .work-task-assignee {
            background: #f4f8fc !important;
            color: #4a6b8a !important;
        }

        .work-task-period {
            color: #8a96a3 !important;
        }

        /* 컬럼은 연한 헤더만 유지하고, 내부 영역은 중립 */
        .kanban-column {
            background: rgba(255,255,255,.72) !important;
        }

        .task-list {
            background: transparent !important;
        }
        /* ===== End workList 카드 배경 중립화 ===== */


        /* ===== 프로젝트 메인 변경사항 workList 반영 ===== */
        /* 요약: 전체 제거, 4개 카드 구성 */
        .work-summary {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }

        

        .summary-card {
            text-align: center !important;
        }

        .summary-card.todo {
            background: #fff8eb !important;
            border-color: #ffe0a3 !important;
        }

        .summary-card.todo span,
        .summary-card.todo strong {
            color: #d48806 !important;
        }

        .summary-card.progress {
            background: #f2f8ff !important;
            border-color: #cfe8ff !important;
        }

        .summary-card.progress span {
            color: #2378c9 !important;
        }

        .summary-card.progress strong {
            color: #1682e6 !important;
        }

        .summary-card.done {
            background: #f0fff8 !important;
            border-color: #b9efd9 !important;
        }

        .summary-card.done span,
        .summary-card.done strong {
            color: #10a36f !important;
        }

        .summary-card.delay {
            background: #fff5f5 !important;
            border-color: #ffcaca !important;
        }

        .summary-card.delay span,
        .summary-card.delay strong {
            color: #f04444 !important;
        }

        /* 칸반 컬럼/클릭 영역 높이 통일 */
        .kanban-board {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            align-items: stretch !important;
        }

        .kanban-column {
            display: flex !important;
            flex-direction: column !important;
            min-height: 0 !important;
        }

        .task-list {
            flex: 1 1 auto !important;
            min-height: 255px !important;
            max-height: none !important;
            overflow: visible !important;
            cursor: pointer !important;
        }

        .task-card {
            cursor: pointer !important;
            flex: 0 0 auto !important;
        }

        .empty-column {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 210px !important;
            padding: 0 12px !important;
            color: #9aa6b2 !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            border-style: dashed !important;
            cursor: pointer !important;
        }

        .kanban-column.todo .kanban-title,
        .kanban-column.todo .kanban-header {
            background: #fff7e6 !important;
            color: #d48806 !important;
            border-color: #ffe0a3 !important;
        }

        .kanban-column.progress .kanban-title,
        .kanban-column.progress .kanban-header {
            background: #eef8ff !important;
            color: #1682e6 !important;
            border-color: #d7efff !important;
        }

        .kanban-column.done .kanban-title,
        .kanban-column.done .kanban-header {
            background: #f0fff8 !important;
            color: #10a36f !important;
            border-color: #b9efd9 !important;
        }

        /* 카드 상태 뱃지는 지연만 표시 */
        .work-task-status {
            display: none !important;
        }

        .work-task-status.status-delay {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 22px !important;
            padding: 0 8px !important;
            border-radius: 999px !important;
            background: #fff5f5 !important;
            color: #f04444 !important;
            border: 1px solid #ffcaca !important;
            font-size: 11px !important;
            font-weight: 900 !important;
        }

        /* 업무 카드 날짜는 오전/오후 없이 날짜만 */
        .work-task-period {
            white-space: nowrap !important;
        }

        /* 모달 상태 select 색상 */
        #workStatus.status-todo {
            background: #fff8eb !important;
            border-color: #ffc96b !important;
            color: #d48806 !important;
            font-weight: 800 !important;
        }

        #workStatus.status-progress {
            background: #f2f8ff !important;
            border-color: #bfe3ff !important;
            color: #1682e6 !important;
            font-weight: 800 !important;
        }

        #workStatus.status-done {
            background: #f0fff8 !important;
            border-color: #b9efd9 !important;
            color: #10a36f !important;
            font-weight: 800 !important;
        }

        @media(max-width: 900px) {
            .work-summary {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .kanban-board {
                grid-template-columns: 1fr !important;
            }

            .task-list {
                min-height: 210px !important;
            }
        }
        /* ===== End 프로젝트 메인 변경사항 workList 반영 ===== */

</style>

<style>
/* ===== FINAL: workList 빈칸 클릭 제거 + 상태 색상/바 유지 ===== */
.task-list,
.kanban-list,
#todo-list,
#inprogress-list,
#done-list {
    cursor: default !important;
}

.task-list::after,
.kanban-list::after,
.clickable-task-list::after,
#todo-list::after,
#inprogress-list::after,
#done-list::after {
    content: none !important;
    display: none !important;
}

.task-card,
.main-task-card,
.work-card {
    cursor: pointer !important;
    position: relative !important;
    overflow: hidden !important;
}

.task-card::before,
.main-task-card::before,
.work-card::before {
    content: '' !important;
    position: absolute !important;
    left: 0 !important;
    top: 12px !important;
    bottom: 12px !important;
    width: 4px !important;
    border-radius: 0 999px 999px 0 !important;
    background: linear-gradient(180deg, #4A90E2 0%, #55DDBF 100%) !important;
}

.task-card.delayed-task::before,
.main-task-card.delayed-task::before,
.work-card.delayed-task::before {
    background: linear-gradient(180deg, #ff6b6b 0%, #ff9b9b 100%) !important;
}

/* 지연 외 상태 뱃지는 숨김 */
.main-task-status,
.task-status-badge,
.status-badge {
    display: none !important;
}

.main-task-status.delay,
.task-status-badge.delay,
.status-badge.delay {
    display: inline-flex !important;
}

/* 요약/헤더 색상 통일 */
.work-summary-card.todo,
.todo-header {
    background: #fff8eb !important;
    border-color: #ffe0a3 !important;
    color: #d48806 !important;
}

.work-summary-card.progress,
.progress-header {
    background: #f2f8ff !important;
    border-color: #cfe8ff !important;
    color: #1682e6 !important;
}

.work-summary-card.done,
.done-header {
    background: #f0fff8 !important;
    border-color: #b9efd9 !important;
    color: #10a36f !important;
}

.work-summary-card.delay {
    background: #fff5f5 !important;
    border-color: #ffcaca !important;
    color: #f04444 !important;
}

</style>
<!-- ===== End FINAL: workList 빈칸 클릭 제거 + 상태 색상/바 유지 ===== -->


<style>
/* ===== FINAL: workList 멤버별 진행 현황 가독성 개선 ===== */
/*
   멤버별 진행 현황은 "업무 카드 목록"을 길게 보여주기보다
   멤버별 담당 현황을 빠르게 비교하는 영역으로 정리합니다.
   - 멤버 카드 높이 축소
   - 통계 뱃지 우측 정렬
   - 업무 목록은 최대 2개만 미리보기
   - 카드형이지만 표처럼 한눈에 비교되도록 구성
*/

.member-progress-section,
.member-progress-board,
.member-status-section,
.member-work-section {
    margin-top: 22px !important;
}

.member-progress-section > h3,
.member-status-section > h3,
.member-work-section > h3 {
    margin-bottom: 6px !important;
}

.member-progress-section > p,
.member-status-section > p,
.member-work-section > p {
    color: #7d8790 !important;
    font-size: 13px !important;
    margin-bottom: 16px !important;
}

/* 멤버 카드 영역: 2열 유지하되 높이 과도하게 늘어나지 않게 */
.member-progress-grid,
.member-card-grid,
.member-work-grid,
.member-status-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 14px !important;
    align-items: start !important;
}

/* 멤버 카드 자체를 요약형으로 */
.member-progress-card,
.member-work-card,
.member-status-card,
.member-card {
    min-height: 0 !important;
    height: auto !important;
    border: 1px solid #e7eef5 !important;
    border-radius: 16px !important;
    background: #fff !important;
    overflow: hidden !important;
    box-shadow: 0 8px 20px rgba(15, 23, 42, .035) !important;
}

/* 카드 헤더: 프로필 + 이름 + 통계를 한 줄에 */
.member-progress-card-header,
.member-card-header,
.member-work-card-header,
.member-status-card-header {
    display: grid !important;
    grid-template-columns: auto minmax(0, 1fr) auto !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 14px 16px !important;
    border-bottom: 1px solid #edf2f7 !important;
    background: #fbfdff !important;
}

/* 이름/역할 영역 */
.member-progress-card-header h4,
.member-card-header h4,
.member-work-card-header h4,
.member-status-card-header h4,
.member-name {
    margin: 0 !important;
    font-size: 15px !important;
    font-weight: 900 !important;
    color: #111827 !important;
    line-height: 1.2 !important;
}

.member-progress-card-header p,
.member-card-header p,
.member-work-card-header p,
.member-status-card-header p,
.member-role,
.member-subtitle {
    margin: 4px 0 0 !important;
    color: #8a96a3 !important;
    font-size: 12px !important;
    font-weight: 600 !important;
}

/* 통계 뱃지는 한 줄에 작게 */
.member-progress-stats,
.member-card-stats,
.member-work-stats,
.member-status-stats,
.member-stat-list {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    flex-wrap: wrap !important;
    gap: 5px !important;
    min-width: 220px !important;
}

.member-progress-stats span,
.member-card-stats span,
.member-work-stats span,
.member-status-stats span,
.member-stat-list span,
.member-stat {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 22px !important;
    padding: 0 8px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    white-space: nowrap !important;
}

/* 상태 색상 */
.member-stat.todo,
.member-progress-stats .todo,
.member-card-stats .todo,
.member-work-stats .todo,
.member-status-stats .todo {
    background: #fff8eb !important;
    color: #d48806 !important;
    border: 1px solid #ffe0a3 !important;
}

.member-stat.progress,
.member-progress-stats .progress,
.member-card-stats .progress,
.member-work-stats .progress,
.member-status-stats .progress {
    background: #f2f8ff !important;
    color: #1682e6 !important;
    border: 1px solid #cfe8ff !important;
}

.member-stat.done,
.member-progress-stats .done,
.member-card-stats .done,
.member-work-stats .done,
.member-status-stats .done {
    background: #f0fff8 !important;
    color: #10a36f !important;
    border: 1px solid #b9efd9 !important;
}

.member-stat.delay,
.member-progress-stats .delay,
.member-card-stats .delay,
.member-work-stats .delay,
.member-status-stats .delay {
    background: #fff5f5 !important;
    color: #f04444 !important;
    border: 1px solid #ffcaca !important;
}

/* 멤버별 업무 목록은 길게 보여주지 않고 미리보기만 */
.member-progress-task-list,
.member-card-task-list,
.member-work-task-list,
.member-status-task-list,
.member-task-list {
    padding: 10px 12px 12px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 7px !important;
    max-height: none !important;
    overflow: hidden !important;
}

/* 3번째 업무부터는 숨겨서 한눈에 보기 좋게 */
.member-progress-task-list > *:nth-child(n+3),
.member-card-task-list > *:nth-child(n+3),
.member-work-task-list > *:nth-child(n+3),
.member-status-task-list > *:nth-child(n+3),
.member-task-list > *:nth-child(n+3) {
    display: none !important;
}

/* 멤버별 업무 미리보기 카드 압축 */
.member-progress-task-list .task-card,
.member-card-task-list .task-card,
.member-work-task-list .task-card,
.member-status-task-list .task-card,
.member-task-list .task-card,
.member-task-item {
    min-height: 42px !important;
    padding: 9px 12px 9px 16px !important;
    border-radius: 12px !important;
    box-shadow: none !important;
    border: 1px solid #edf2f7 !important;
    background: #fff !important;
    position: relative !important;
}

/* 미리보기 카드 왼쪽 상태 바는 유지 */
.member-progress-task-list .task-card::before,
.member-card-task-list .task-card::before,
.member-work-task-list .task-card::before,
.member-status-task-list .task-card::before,
.member-task-list .task-card::before,
.member-task-item::before {
    content: '' !important;
    position: absolute !important;
    left: 0 !important;
    top: 9px !important;
    bottom: 9px !important;
    width: 3px !important;
    border-radius: 0 999px 999px 0 !important;
    background: linear-gradient(180deg, #4A90E2, #55DDBF) !important;
}

.member-progress-task-list .task-card.delayed-task::before,
.member-card-task-list .task-card.delayed-task::before,
.member-work-task-list .task-card.delayed-task::before,
.member-status-task-list .task-card.delayed-task::before,
.member-task-list .task-card.delayed-task::before,
.member-task-item.delayed-task::before {
    background: linear-gradient(180deg, #ff6b6b, #ff9b9b) !important;
}

/* 멤버 카드 안 업무 상태 뱃지도 지연만 보이게 */
.member-progress-task-list .main-task-status:not(.delay),
.member-card-task-list .main-task-status:not(.delay),
.member-work-task-list .main-task-status:not(.delay),
.member-status-task-list .main-task-status:not(.delay),
.member-task-list .main-task-status:not(.delay) {
    display: none !important;
}

/* 업무가 많다는 암시용: 카드 하단 안내 */
.member-progress-card.has-more::after,
.member-work-card.has-more::after,
.member-status-card.has-more::after,
.member-card.has-more::after {
    content: '더 많은 업무는 상단 업무현황에서 확인';
    display: block;
    padding: 0 14px 12px;
    color: #9aa6b2;
    font-size: 11px;
    font-weight: 700;
}

/* 모바일 */
@media(max-width: 900px) {
    .member-progress-grid,
    .member-card-grid,
    .member-work-grid,
    .member-status-grid {
        grid-template-columns: 1fr !important;
    }

    .member-progress-card-header,
    .member-card-header,
    .member-work-card-header,
    .member-status-card-header {
        grid-template-columns: auto minmax(0, 1fr) !important;
    }

    .member-progress-stats,
    .member-card-stats,
    .member-work-stats,
    .member-status-stats,
    .member-stat-list {
        grid-column: 1 / -1;
        justify-content: flex-start !important;
        min-width: 0 !important;
    }
}
/* ===== End FINAL: workList 멤버별 진행 현황 가독성 개선 ===== */
</style>





<style>
/* ===== FINAL: workList 멤버별 진행 현황 표형식 - 멤버 행 기준 ===== */
/*
   멤버는 고정 개수가 아니므로 열로 두면 화면이 가로로 계속 길어집니다.
   행을 멤버로 두고, 열을 상태로 두면 멤버가 늘어나도 아래로 자연스럽게 확장됩니다.
*/

.member-progress-section {
    margin-top: 22px !important;
    padding: 22px !important;
    background: #fff !important;
    border: 1px solid #e4ebf2 !important;
    border-radius: 24px !important;
    box-shadow: 0 10px 30px rgba(32,48,64,.045) !important;
}

.member-progress-header {
    margin-bottom: 16px !important;
}

.member-progress-header h3 {
    margin: 0 !important;
    color: #111827 !important;
    font-size: 21px !important;
    font-weight: 900 !important;
    letter-spacing: -0.045em !important;
}

.member-progress-header p {
    margin: 7px 0 0 !important;
    color: #777 !important;
    font-size: 13px !important;
}

.member-progress-list {
    display: block !important;
}

.member-progress-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #edf2f7;
    border-radius: 18px;
    background: #fbfdff;
}

.member-progress-table {
    width: 100%;
    min-width: 680px;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
}

.member-progress-table th,
.member-progress-table td {
    border-bottom: 1px solid #edf2f7;
    border-right: 1px solid #edf2f7;
    text-align: center;
    vertical-align: middle;
}

.member-progress-table th:last-child,
.member-progress-table td:last-child {
    border-right: 0;
}

.member-progress-table tbody tr:last-child td {
    border-bottom: 0;
}

.member-row-table thead th {
    height: 46px;
    padding: 10px 12px;
    background: #fbfdff;
    color: #667085;
    font-size: 12px;
    font-weight: 900;
}

.member-row-table .member-head {
    width: 260px;
    text-align: left;
    padding-left: 18px;
}

.member-row-table .metric-head.todo {
    color: #d48806;
    background: #fffaf0;
}

.member-row-table .metric-head.progress {
    color: #1682e6;
    background: #f4faff;
}

.member-row-table .metric-head.done {
    color: #10a36f;
    background: #f4fffa;
}

.member-row-table .metric-head.delay {
    color: #f04444;
    background: #fff7f7;
}

.member-row-table .metric-head.total {
    color: #475467;
    background: #f8fafc;
}

.member-row-table tbody td {
    height: 58px;
    padding: 10px 12px;
    background: #fff;
}

.member-row-table tbody tr:hover td {
    background: #fcfdff;
}

.member-cell {
    text-align: left !important;
}

.member-table-profile {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    min-width: 0;
}

.member-avatar.small {
    width: 34px !important;
    height: 34px !important;
    font-size: 12px !important;
    flex-shrink: 0;
}

.member-table-profile strong {
    display: block;
    max-width: 160px;
    color: #111827;
    font-size: 14px;
    font-weight: 900;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
}

.member-table-profile span {
    display: block;
    margin-top: 3px;
    color: #98a2b3;
    font-size: 11px;
    font-weight: 800;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
}

.metric-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 38px;
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 900;
    background: #f8fafc;
    color: #98a2b3;
    border: 1px solid #edf2f7;
}

.metric-count.todo.has-count {
    background: #fff8eb;
    color: #d48806;
    border-color: #ffe0a3;
}

.metric-count.progress.has-count {
    background: #f2f8ff;
    color: #1682e6;
    border-color: #cfe8ff;
}

.metric-count.done.has-count {
    background: #f0fff8;
    color: #10a36f;
    border-color: #b9efd9;
}

.metric-count.delay.has-count {
    background: #fff5f5;
    color: #f04444;
    border-color: #ffcaca;
}

.metric-count.total.has-count {
    background: #f8fafc;
    color: #475467;
    border-color: #e4e7ec;
}

/* 표형식에서는 기존 멤버 카드/업무 미리보기 숨김 */
.member-progress-card,
.member-task-list,
.member-task-item,
.member-more-link {
    display: none !important;
}

@media(max-width: 760px) {
    .member-progress-section {
        padding: 18px !important;
    }

    .member-progress-table {
        min-width: 620px;
    }

    .member-row-table .member-head {
        width: 210px;
    }

    .member-table-profile strong,
    .member-table-profile span {
        max-width: 120px;
    }
}
/* ===== End FINAL: workList 멤버별 진행 현황 표형식 - 멤버 행 기준 ===== */
</style>


<style>
/* ===== FINAL: workList 전체 카운터 복구 + 멤버 표 전체 열 ===== */
/* 업무 상황표시에는 전체 카운터를 다시 노출합니다. */
.work-summary {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 12px !important;
}

.work-summary-card.total {
    display: flex !important;
    background: #f5faff !important;
    border-color: #d6eaff !important;
    color: #344054 !important;
}

.work-summary-card.total span {
    color: #475467 !important;
}

.work-summary-card.total strong {
    color: #111827 !important;
}

/* 멤버별 진행 현황 표 마지막 열은 '전체' 의미 */
.member-row-table .metric-head.total {
    color: #475467 !important;
    background: #f8fafc !important;
}

.metric-count.total.has-count {
    background: #f8fafc !important;
    color: #475467 !important;
    border-color: #e4e7ec !important;
}

@media(max-width: 900px) {
    .work-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .work-summary-card.total {
        grid-column: span 2;
    }
}
/* ===== End FINAL: workList 전체 카운터 복구 + 멤버 표 전체 열 ===== */
</style>


<style>
/* ===== FINAL: workList 전체 카운터 표시 강제 ===== */
.work-summary,
.work-summary-grid,
.summary-grid {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 12px !important;
}

.work-summary-card.total,
.summary-card.total {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 88px !important;
    background: #f5faff !important;
    border: 1px solid #d6eaff !important;
    color: #344054 !important;
}

.work-summary-card.total span,
.summary-card.total span {
    color: #475467 !important;
    font-size: 13px !important;
    font-weight: 800 !important;
}

.work-summary-card.total strong,
.summary-card.total strong {
    display: block !important;
    margin-top: 6px !important;
    color: #111827 !important;
    font-size: 25px !important;
    font-weight: 900 !important;
}

@media(max-width: 900px) {
    .work-summary,
    .work-summary-grid,
    .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .work-summary-card.total,
    .summary-card.total {
        grid-column: span 2;
    }
}
/* ===== End FINAL: workList 전체 카운터 표시 강제 ===== */
</style>


<style>
/* ===== FINAL: workList 전체 카드 디자인/숫자 정렬 보정 ===== */
/* 전체 카드도 다른 요약 카드와 같은 summary-card 규격을 사용 */
.work-summary {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 12px !important;
    align-items: stretch !important;
}

.work-summary .summary-card {
    min-width: 0 !important;
    min-height: 96px !important;
    padding: 16px 14px !important;
    border-radius: 18px !important;
    border: 1px solid #eef0f2 !important;
    box-shadow: 0 4px 14px rgba(32,48,64,.035) !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    gap: 8px !important;
}

.work-summary .summary-card span {
    display: block !important;
    margin: 0 !important;
    font-size: 12px !important;
    font-weight: 900 !important;
    line-height: 1.2 !important;
}

.work-summary .summary-card strong {
    display: block !important;
    margin: 0 !important;
    font-size: 25px !important;
    font-weight: 900 !important;
    line-height: 1 !important;
}

/* 전체 카드도 기존 카드들과 같은 톤 */
.work-summary .summary-card.total {
    background: #f7fbff !important;
    border-color: #dcebf8 !important;
}

.work-summary .summary-card.total span {
    color: #475467 !important;
}

.work-summary .summary-card.total strong {
    color: #111827 !important;
}

/* 상태 카드 색상 유지 */
.work-summary .summary-card.todo {
    background: #fff8eb !important;
    border-color: #ffe0a3 !important;
}

.work-summary .summary-card.todo span,
.work-summary .summary-card.todo strong {
    color: #d48806 !important;
}

.work-summary .summary-card.progress {
    background: #f2f8ff !important;
    border-color: #cfe8ff !important;
}

.work-summary .summary-card.progress span,
.work-summary .summary-card.progress strong {
    color: #1682e6 !important;
}

.work-summary .summary-card.done {
    background: #f0fff8 !important;
    border-color: #b9efd9 !important;
}

.work-summary .summary-card.done span,
.work-summary .summary-card.done strong {
    color: #10a36f !important;
}

.work-summary .summary-card.delay {
    background: #fff5f5 !important;
    border-color: #ffcaca !important;
}

.work-summary .summary-card.delay span,
.work-summary .summary-card.delay strong {
    color: #f04444 !important;
}

/* 이전에 total 숨김/다른 규격으로 들어간 경우 방어 */
.work-summary-card.total {
    display: none !important;
}

@media(max-width: 900px) {
    .work-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .work-summary .summary-card.total {
        grid-column: span 2;
    }
}
/* ===== End FINAL: workList 전체 카드 디자인/숫자 정렬 보정 ===== */
</style>


<style>
/* ===== FINAL: workList 멤버별 진행 현황 전체 열 앞쪽 배치 ===== */
/* 멤버별 표는 전체를 먼저 보고 세부 상태를 보는 흐름으로 정리 */
.member-row-table .metric-head.total {
    color: #475467 !important;
    background: #f8fafc !important;
}

.member-row-table tbody td:nth-child(2) {
    background: #fcfdff !important;
}

.member-row-table tbody tr:hover td:nth-child(2) {
    background: #f8fafc !important;
}

.metric-count.total.has-count {
    background: #f8fafc !important;
    color: #475467 !important;
    border-color: #e4e7ec !important;
}
/* ===== End FINAL: workList 멤버별 진행 현황 전체 열 앞쪽 배치 ===== */
</style>


<style>
.work-time-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e8eef5;
    color: #334155;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
}
.work-time-toggle input { width: 15px; height: 15px; margin: 0; accent-color: #4A90E2; }
.work-time-toggle small { margin-left: auto; color: #94a3b8; font-size: 11px; font-weight: 700; }
.work-time-field.disabled { opacity: .55; }
.work-time-field input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
</style>


<style>
/* FINAL FIX: workList 멤버별 현황을 숫자표가 아니라 업무 리스트 중심으로 변경 */
.member-progress-list.member-task-report-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.member-report-card {
    border: 1px solid #e4ebf2;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 8px 20px rgba(32,48,64,.04);
    overflow: hidden;
}

.member-report-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 15px 16px;
    background: #fbfdff;
    border-bottom: 1px solid #edf1f5;
}

.member-report-profile {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.member-report-profile strong {
    display: block;
    color: #111827;
    font-size: 15px;
    font-weight: 900;
    line-height: 1.2;
}

.member-report-profile span {
    display: block;
    margin-top: 3px;
    color: #98a2b3;
    font-size: 11px;
    font-weight: 800;
}

.member-report-summary {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5px;
}

.member-report-pill {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid #edf1f5;
    background: #f8fafc;
    color: #667085;
    font-size: 11px;
    font-weight: 900;
}

.member-report-pill.todo {
    background: var(--moyo-todo-bg);
    border-color: var(--moyo-todo-border);
    color: var(--moyo-todo-text);
}

.member-report-pill.progress {
    background: var(--moyo-progress-bg);
    border-color: var(--moyo-progress-border);
    color: var(--moyo-progress-text);
}

.member-report-pill.done {
    background: var(--moyo-done-bg);
    border-color: var(--moyo-done-border);
    color: var(--moyo-done-text);
}

.member-report-pill.delay {
    background: var(--moyo-delay-bg);
    border-color: var(--moyo-delay-border);
    color: var(--moyo-delay-text);
}

.member-report-body {
    padding: 14px 16px 16px;
}

.member-task-status-group + .member-task-status-group {
    margin-top: 14px;
}

.member-task-group-title {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
    color: #334155;
    font-size: 12px;
    font-weight: 900;
}

.member-task-group-title::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #cbd5e1;
}

.member-task-group-title.todo::before {
    background: var(--moyo-todo-text);
}

.member-task-group-title.progress::before {
    background: var(--moyo-progress-text);
}

.member-task-group-title.done::before {
    background: var(--moyo-done-text);
}

.member-task-detail-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.member-task-detail-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px 11px;
    border: 1px solid #eef2f6;
    border-radius: 13px;
    background: #ffffff;
    cursor: pointer;
    transition: background .15s ease, border-color .15s ease, transform .15s ease;
}

.member-task-detail-item:hover {
    background: #fbfdff;
    border-color: #dbeafe;
    transform: translateY(-1px);
}

.member-task-detail-main {
    min-width: 0;
}

.member-task-detail-title {
    display: block;
    color: #111827;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-task-detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 5px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 800;
}

.member-task-detail-meta span {
    display: inline-flex;
    align-items: center;
}

.member-task-detail-status {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    min-width: 58px;
    height: 24px;
    justify-content: center;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid #edf1f5;
    background: #f8fafc;
    color: #667085;
    font-size: 11px;
    font-weight: 900;
}

.member-task-detail-status.todo {
    background: var(--moyo-todo-bg);
    border-color: var(--moyo-todo-border);
    color: var(--moyo-todo-text);
}

.member-task-detail-status.progress {
    background: var(--moyo-progress-bg);
    border-color: var(--moyo-progress-border);
    color: var(--moyo-progress-text);
}

.member-task-detail-status.done {
    background: var(--moyo-done-bg);
    border-color: var(--moyo-done-border);
    color: var(--moyo-done-text);
}

.member-task-detail-status.delay {
    background: var(--moyo-delay-bg);
    border-color: var(--moyo-delay-border);
    color: var(--moyo-delay-text);
}

.member-report-empty {
    padding: 16px;
    border: 1px dashed #dce3ea;
    border-radius: 14px;
    background: #fafbfc;
    color: #98a2b3;
    font-size: 12px;
    font-weight: 800;
    text-align: center;
}

@media(max-width: 700px) {
    .member-report-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .member-report-summary {
        justify-content: flex-start;
    }

    .member-task-detail-item {
        grid-template-columns: 1fr;
    }

    .member-task-detail-status {
        justify-self: flex-start;
    }
}
</style>


<style>
/* FINAL FIX: 멤버별 업무 현황 필터 */
.member-report-filter-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 14px;
    border: 1px solid #eef2f6;
    border-radius: 16px;
    background: #fbfdff;
}

.member-report-filter-group {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
}

.member-report-filter-group strong {
    color: #334155;
    font-size: 12px;
    font-weight: 900;
    line-height: 28px;
}

.member-report-filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.member-report-check {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 28px;
    padding: 0 9px;
    border: 1px solid #e4ebf2;
    border-radius: 999px;
    background: #fff;
    color: #64748b;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    user-select: none;
}

.member-report-check input {
    width: 13px;
    height: 13px;
    margin: 0;
    accent-color: #4A90E2;
}

.member-report-check.todo {
    border-color: var(--moyo-todo-border);
    color: var(--moyo-todo-text);
    background: var(--moyo-todo-bg);
}

.member-report-check.progress {
    border-color: var(--moyo-progress-border);
    color: var(--moyo-progress-text);
    background: var(--moyo-progress-bg);
}

.member-report-check.done {
    border-color: var(--moyo-done-border);
    color: var(--moyo-done-text);
    background: var(--moyo-done-bg);
}

.member-report-check.delay {
    border-color: var(--moyo-delay-border);
    color: var(--moyo-delay-text);
    background: var(--moyo-delay-bg);
}

.member-report-filter-empty {
    padding: 20px 14px;
    border: 1px dashed #dce3ea;
    border-radius: 14px;
    background: #fafbfc;
    color: #98a2b3;
    font-size: 13px;
    font-weight: 800;
    text-align: center;
}

@media(max-width: 640px) {
    .member-report-filter-group {
        grid-template-columns: 1fr;
        gap: 6px;
    }

    .member-report-filter-group strong {
        line-height: 1.3;
    }
}
</style>


<style>
/* FINAL FIX: workList 필터 체크 동작/업무 카드 레이아웃 정리 */
.member-report-filter-box {
    gap: 10px !important;
}

.member-report-check {
    position: relative;
    transition: background .14s ease, border-color .14s ease, color .14s ease, opacity .14s ease;
}

.member-report-check input {
    pointer-events: none;
}

.member-report-check:not(.is-checked) {
    background: #ffffff !important;
    border-color: #e4ebf2 !important;
    color: #94a3b8 !important;
    opacity: .78;
}

.member-task-detail-item {
    grid-template-columns: minmax(180px, 1fr) auto auto !important;
    padding: 9px 10px !important;
}

.member-task-detail-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.member-task-detail-title {
    flex: 1 1 auto;
    min-width: 110px;
    margin: 0 !important;
}

.member-task-detail-meta {
    flex-shrink: 0;
    margin-top: 0 !important;
    display: inline-flex !important;
    align-items: center;
    gap: 6px !important;
    color: #64748b !important;
    font-size: 11px !important;
    white-space: nowrap;
}

.member-task-detail-meta span {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 7px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #eef2f6;
}

.member-task-detail-status {
    min-width: 56px !important;
}

@media(max-width: 760px) {
    .member-task-detail-item {
        grid-template-columns: 1fr !important;
    }

    .member-task-detail-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }

    .member-task-detail-meta {
        flex-wrap: wrap;
        white-space: normal;
    }
}
</style>


<style>
/* FINAL FIX: 멤버 역할을 이름 밑이 아니라 옆으로 배치 */
.member-report-profile > div {
    min-width: 0;
    display: flex !important;
    align-items: center !important;
    gap: 7px !important;
    flex-wrap: wrap;
}

.member-report-profile strong {
    display: inline-flex !important;
    align-items: center;
    margin: 0 !important;
    line-height: 1.2 !important;
}

.member-report-profile span {
    display: inline-flex !important;
    align-items: center;
    height: 20px;
    margin-top: 0 !important;
    padding: 0 7px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e4ebf2;
    color: #64748b !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    line-height: 20px !important;
    white-space: nowrap;
}

.member-report-top {
    padding: 13px 16px !important;
}
</style>


<style>
/* FINAL FIX: 멤버별 업무 현황판 */
.member-progress-list.member-task-report-list.member-role-board {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.member-role-card {
    min-width: 0;
    border: 1px solid #e4ebf2;
    border-radius: 20px;
    background:
        radial-gradient(circle at 92% 12%, rgba(85,221,191,.10), transparent 24%),
        #ffffff;
    box-shadow: 0 8px 20px rgba(32,48,64,.04);
    overflow: hidden;
}

.member-role-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #edf1f5;
    background: #fbfdff;
}

.member-role-profile {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 11px;
}

.member-role-profile-text {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
}

.member-role-profile-text strong {
    color: #111827;
    font-size: 15px;
    font-weight: 900;
    line-height: 1.2;
}

.member-role-badge {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    border-radius: 999px;
    border: 1px solid #e4ebf2;
    background: #f8fafc;
    color: #64748b;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
}

.member-role-counts {
    flex-shrink: 0;
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.member-role-counts .member-report-pill {
    height: 21px;
    padding: 0 7px;
    font-size: 10.5px;
}

.member-current-box {
    margin: 13px 16px 0;
    padding: 11px 12px;
    border: 1px solid #dbeafe;
    border-radius: 15px;
    background: linear-gradient(135deg, #f5fbff 0%, #f8fffd 100%);
}

.member-current-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 7px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 900;
}

.member-current-label::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #4A90E2;
}

.member-current-task {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    cursor: pointer;
}

.member-current-task strong {
    min-width: 0;
    color: #111827;
    font-size: 14px;
    font-weight: 900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-current-task span {
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
}

.member-current-empty {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 800;
}

.member-role-body {
    padding: 12px 16px 16px;
}

.member-duty-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    color: #334155;
    font-size: 12px;
    font-weight: 900;
}

.member-duty-title span {
    color: #94a3b8;
    font-size: 11px;
    font-weight: 800;
}

.member-duty-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.member-duty-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: center;
    padding: 9px 10px;
    border: 1px solid #eef2f6;
    border-radius: 13px;
    background: #fff;
    cursor: pointer;
    transition: background .15s ease, border-color .15s ease, transform .15s ease;
}

.member-duty-item:hover {
    background: #fbfdff;
    border-color: #dbeafe;
    transform: translateY(-1px);
}

.member-duty-name {
    min-width: 0;
    color: #111827;
    font-size: 13px;
    font-weight: 900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-duty-period {
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
}

.member-duty-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 54px;
    height: 23px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid #edf1f5;
    background: #f8fafc;
    color: #667085;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
}

.member-duty-status.todo {
    background: var(--moyo-todo-bg);
    border-color: var(--moyo-todo-border);
    color: var(--moyo-todo-text);
}

.member-duty-status.progress {
    background: var(--moyo-progress-bg);
    border-color: var(--moyo-progress-border);
    color: var(--moyo-progress-text);
}

.member-duty-status.done {
    background: var(--moyo-done-bg);
    border-color: var(--moyo-done-border);
    color: var(--moyo-done-text);
}

.member-duty-status.delay {
    background: var(--moyo-delay-bg);
    border-color: var(--moyo-delay-border);
    color: var(--moyo-delay-text);
}

.member-duty-more {
    margin-top: 8px;
    color: #4A90E2;
    font-size: 12px;
    font-weight: 900;
    text-align: center;
}

@media(max-width: 980px) {
    .member-progress-list.member-task-report-list.member-role-board {
        grid-template-columns: 1fr;
    }
}

@media(max-width: 640px) {
    .member-role-top,
    .member-current-task,
    .member-duty-item {
        grid-template-columns: 1fr;
    }

    .member-role-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .member-role-counts {
        justify-content: flex-start;
    }

    .member-duty-period,
    .member-duty-status {
        justify-self: flex-start;
    }
}
</style>

</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="work-page">
        <a href="/project/main?projId=${projId}&wsId=${wsId}" class="top-link">⬅ 프로젝트로 돌아가기</a>

        <section class="work-hero">
            <div class="work-hero-title">
                <h2>업무 현황</h2>
                <p>팀 전체 업무를 상태별로 확인하고 드래그해서 진행 상태를 변경합니다.</p>
            </div>

            <button type="button" class="add-work-btn" onclick="openAddWorkModal()">+ 업무 추가</button>
        </section>

        <section class="work-summary">
            <div class="summary-card total">
                <span>전체</span>
                <strong id="summaryTotal">0</strong>
            </div>
                <div class="summary-card todo">
                <span>할 일</span>
                <strong id="summaryTodo">0</strong>
            </div>
            <div class="summary-card progress">
                <span>진행 중</span>
                <strong id="summaryProgress">0</strong>
            </div>
            <div class="summary-card done">
                <span>완료</span>
                <strong id="summaryDone">0</strong>
            </div>
            <div class="summary-card delay">
                <span>지연</span>
                <strong id="summaryDelay">0</strong>
            </div>
        </section>

        <section class="kanban-board">
            <div class="kanban-column todo">
                <div class="kanban-title">
                    <strong>할 일</strong>
                    <span id="todoCount">0</span>
                </div>
                <div id="todoList" class="task-list" data-status="TODO"></div>
            </div>

            <div class="kanban-column progress">
                <div class="kanban-title">
                    <strong>진행 중</strong>
                    <span id="progressCount">0</span>
                </div>
                <div id="progressList" class="task-list" data-status="IN_PROGRESS"></div>
            </div>

            <div class="kanban-column done">
                <div class="kanban-title">
                    <strong>완료</strong>
                    <span id="doneCount">0</span>
                </div>
                <div id="doneList" class="task-list" data-status="DONE"></div>
            </div>
        </section>

        <section class="member-progress-section">
            <div class="member-progress-header">
                <div>
                    <h3>멤버별 업무 현황</h3>
                    <p>멤버별 역할과 현재 진행 업무, 담당 업무를 한눈에 확인합니다.</p>
                </div>
            </div>

            <div class="member-report-filter-box">
                <div class="member-report-filter-group">
                    <strong>멤버</strong>
                    <div id="memberReportMemberFilters" class="member-report-filter-options">
                        <label class="member-report-check"><input type="checkbox" value="ALL" checked> 전체</label>
                    </div>
                </div>

                <div class="member-report-filter-group">
                    <strong>진행상황</strong>
                    <div id="memberReportStatusFilters" class="member-report-filter-options">
                        <label class="member-report-check"><input type="checkbox" value="ALL" checked> 전체</label>
                        <label class="member-report-check todo"><input type="checkbox" value="TODO" checked> 할 일</label>
                        <label class="member-report-check progress"><input type="checkbox" value="IN_PROGRESS" checked> 진행 중</label>
                        <label class="member-report-check done"><input type="checkbox" value="DONE" checked> 완료</label>
                        <label class="member-report-check delay"><input type="checkbox" value="DELAY" checked> 지연</label>
                    </div>
                </div>
            </div>

            <div id="memberProgressList" class="member-progress-list">
                <div class="member-progress-empty">멤버별 현황을 불러오는 중입니다.</div>
            </div>
        </section>

    </main>

    <div id="modalBackdrop" class="modal-backdrop-custom" onclick="closeWorkModal()"></div>

    <div id="workModal" class="work-modal moyo-project-modal">
        <div class="work-modal-header moyo-project-modal-head">
            <div>
                <h3 id="workModalTitle">업무 추가</h3>
                <p>업무명과 담당자, 기간과 상태를 설정합니다.</p>
            </div>
        </div>

        <div class="work-modal-body moyo-project-modal-body">
            <input type="hidden" id="workTaskId">

            <div class="work-stable-body">
                <div class="work-field">
                    <label for="workTitle">업무명</label>
                    <input type="text" id="workTitle" class="form-control" placeholder="예: 메인 화면 정리">
                </div>

                <div class="work-field admin-only-work-field">
                    <label for="workAssignedUserId">담당자</label>
                    <select id="workAssignedUserId" class="form-control">
                        <option value="">담당자 선택</option>
                    </select>
                </div>

                <div class="work-date-card">
                    <label class="work-time-toggle">
                        <input type="checkbox" id="workUseTime" onchange="toggleWorkTimeFields(this.checked)">
                        <span>시간 선택</span>
                        <small>체크하면 시작/마감 시간을 직접 지정합니다.</small>
                    </label>

                    <div class="work-date-row">
                        <div class="work-field">
                            <label for="workStartDate">시작일</label>
                            <input type="date" id="workStartDate" class="form-control">
                        </div>

                        <div class="work-field work-time-field">
                            <label for="workStartTime">시작 시간</label>
                            <input type="time" id="workStartTime" class="form-control" value="09:00" disabled>
                        </div>
                    </div>

                    <div class="work-date-row">
                        <div class="work-field">
                            <label for="workEndDate">마감일</label>
                            <input type="date" id="workEndDate" class="form-control">
                        </div>

                        <div class="work-field work-time-field">
                            <label for="workEndTime">마감 시간</label>
                            <input type="time" id="workEndTime" class="form-control" value="18:00" disabled>
                        </div>
                    </div>
                </div>

                <div class="work-field work-status-field">
                    <label>상태</label>
                    <div class="work-status-pills" role="group" aria-label="업무 상태 선택">
                        <button type="button" class="work-status-pill active" data-status="TODO" onclick="setWorkStatusValue('TODO')">할 일</button>
                        <button type="button" class="work-status-pill" data-status="IN_PROGRESS" onclick="setWorkStatusValue('IN_PROGRESS')">진행 중</button>
                        <button type="button" class="work-status-pill" data-status="DONE" onclick="setWorkStatusValue('DONE')">완료</button>
                    </div>
                    <select id="workStatus" class="form-control work-status-hidden" aria-hidden="true" tabindex="-1">
                        <option value="TODO">할 일</option>
                        <option value="IN_PROGRESS">진행 중</option>
                        <option value="DONE">완료</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="modal-actions moyo-project-modal-footer">
            <button type="button" id="deleteWorkBtn" class="modal-btn danger moyo-modal-btn" onclick="deleteWork()" style="display:none;">삭제</button>
            <button type="button" class="modal-btn cancel moyo-modal-btn ghost" onclick="closeWorkModal()">취소</button>
            <button type="button" class="modal-btn primary moyo-modal-btn" onclick="saveWork()">저장</button>
        </div>
    </div>

    <script>
        const wsId = '${wsId}';
        const projId = '${projId}';
        const loginUserId = '${sessionScope.user.userId}';
        let workList = [];
        let workMemberList = [];
        let currentMode = 'ADD';

        document.addEventListener('DOMContentLoaded', function() {
            
            initDragDrop();
            loadWorkMemberOptions()
                .finally(function() {
                    loadWorkList();
                });
            const workStatusEl = document.getElementById('workStatus');
            if (workStatusEl) {
                setWorkStatusValue(workStatusEl.value || 'TODO');
                workStatusEl.addEventListener('change', function() { setWorkStatusValue(this.value); });
            }
        });



        function getTodayDateString() {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            return yyyy + '-' + mm + '-' + dd;
        }

        function normalizeWorkTime(value, fallback) {
            const raw = String(value || '').trim();
            if (/^\d{2}:\d{2}$/.test(raw)) return raw;
            if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw.substring(0, 5);
            if (raw.toUpperCase() === 'AM') return '09:00';
            if (raw.toUpperCase() === 'PM') return '18:00';
            return fallback || '09:00';
        }

        function formatWorkTimeText(value) {
            const time = normalizeWorkTime(value, '');
            return time || '';
        }

        function isWorkTimeEnabledFromData(task) {
            if (!task) return false;

            // 서버가 USE_TIME='Y'로 내려준 업무만 시간을 표시합니다.
            // 기존 AM/PM 데이터나 이전 패치에서 기본값으로 저장된 09:00 값은 날짜만 보여야 합니다.
            return String(task.USE_TIME || task.useTime || '').toUpperCase() === 'Y';
        }

        function toggleWorkTimeFields(enabled) {
            const useTimeEl = document.getElementById('workUseTime');
            const startTimeEl = document.getElementById('workStartTime');
            const endTimeEl = document.getElementById('workEndTime');

            if (useTimeEl) useTimeEl.checked = !!enabled;

            [startTimeEl, endTimeEl].forEach(function(el) {
                if (!el) return;
                el.disabled = !enabled;
                const wrap = el.closest('.work-time-field');
                if (wrap) wrap.classList.toggle('disabled', !enabled);
            });
        }

        function getWorkUseTimeValue() {
            const el = document.getElementById('workUseTime');
            return !!(el && el.checked);
        }


        function formatWorkLineDate(dateText, slotValue) {
            const shortDate = toShortDate(dateText);

            if (!dateText) {
                return '미정';
            }

            return shortDate;
        }

function loadWorkMemberOptions(selectedUserId) {
            const loginUserId = '${sessionScope.user.userId}';
            const projectLeaderId = '${projectDetail.leaderId}';

            return fetch('/project/api/members?projId=' + encodeURIComponent(projId))
                .then(function(res) { return res.json(); })
                .then(function(members) {
                    workMemberList = members || [];
                    const select = document.getElementById('workAssignedUserId');

                    if (!select) return;

                    let loginMember = null;

                    workMemberList.forEach(function(member) {
                        const userId = member.USER_ID || member.userId;

                        if (String(userId) === String(loginUserId)) {
                            loginMember = member;
                        }
                    });

                    const isAdmin = (String(loginUserId) === String(projectLeaderId)) || (loginMember && String(loginMember.PROJ_ROLE || '').toUpperCase() === 'ADMIN');

                    document.body.classList.toggle('admin-mode', !!isAdmin);

                    let defaultUserId = selectedUserId || loginUserId;
                    let html = '';

                    workMemberList.forEach(function(member) {
                        const userId = member.USER_ID || member.userId;
                        const userName = member.USER_NAME || member.userName || '이름 없음';
                        const selected = String(userId) === String(defaultUserId || '') ? ' selected' : '';

                        html += '<option value="' + userId + '"' + selected + '>' + userName + '</option>';
                    });

                    select.innerHTML = html;

                    if (!isAdmin) {
                        select.value = loginUserId;
                    }

                    if (Array.isArray(workList) && workList.length > 0) {
                        renderWorkBoard(workList);
                    }
                })
                .catch(function(err) {
                    console.error('담당자 목록 로딩 실패:', err);
                });
        }


function initDragDrop() {
            document.querySelectorAll('.task-list').forEach(function(list) {
                list.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    list.classList.add('drag-over');
                });

                list.addEventListener('dragleave', function() {
                    list.classList.remove('drag-over');
                });

                list.addEventListener('drop', function(e) {
                    e.preventDefault();
                    list.classList.remove('drag-over');

                    const taskId = e.dataTransfer.getData('text/plain');
                    const newStatus = list.dataset.status;

                    if (!taskId || !newStatus) return;

                    updateWorkStatus(taskId, newStatus);
                });

                list.addEventListener('click', function(e) {
                    if (e.target.closest('.task-card')) return;
                    openAddWorkModal(list.dataset.status || 'TODO');
                });
            });
        }

        function loadWorkList() {
            fetch('/project/api/tasks?projId=' + encodeURIComponent(projId))
                .then(function(res) {
                    if (!res.ok) throw new Error('업무 목록 조회 실패');
                    return res.json();
                })
                .then(function(data) {
                    workList = Array.isArray(data) ? data : [];
                    renderWorkBoard(workList);
                })
                .catch(function(err) {
                    console.error(err);
                    renderEmptyError();
                });
        }

        function renderWorkBoard(list) {
            const todoList = document.getElementById('todoList');
            const progressList = document.getElementById('progressList');
            const doneList = document.getElementById('doneList');

            todoList.innerHTML = '';
            progressList.innerHTML = '';
            doneList.innerHTML = '';

            let todoCount = 0;
            let progressCount = 0;
            let doneCount = 0;
            let delayCount = 0;

            list.forEach(function(task) {
                const status = normalizeStatus(task.STATUS || task.status);
                const taskUseTime = isWorkTimeEnabledFromData(task);
                const delayed = status !== 'DONE' && isDelayed(task.END_DATE || task.endDate, taskUseTime ? (task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot) : '18:00');
                const card = createTaskCard(task, delayed);

                if (status === 'TODO') {
                    todoCount++;
                    todoList.appendChild(card);
                } else if (status === 'IN_PROGRESS') {
                    progressCount++;
                    progressList.appendChild(card);
                } else if (status === 'DONE') {
                    doneCount++;
                    doneList.appendChild(card);
                }

                if (delayed) delayCount++;
            });

            fillEmpty(todoList);
            fillEmpty(progressList);
            fillEmpty(doneList);

            updateCounts(todoCount, progressCount, doneCount, delayCount);
            renderMemberProgress(list);
        }

        


        function getWorkMemberById(userId) {
            const targetId = String(userId || '');
            return (workMemberList || []).find(function(member) {
                return String(member.USER_ID || member.userId || '') === targetId;
            }) || null;
        }

        function getWorkMemberRoleName(userId, fallbackTask) {
            const member = getWorkMemberById(userId) || fallbackTask || {};

            const position =
                member.PROJ_POSITION || member.projPosition ||
                member.PROJ_ROLE_NAME || member.projRoleName ||
                member.ROLE_NAME || member.roleName ||
                member.POSITION || member.position;

            if (position) return position;

            const role = String(member.PROJ_ROLE || member.projRole || member.ROLE || member.role || '').toUpperCase();

            if (role === 'ADMIN') return '관리자';
            if (role === 'LEADER' || role === 'OWNER' || role === 'TEAM_LEADER') return '팀장';
            if (role === 'MEMBER') return '멤버';

            return '역할 미지정';
        }


        const memberReportFilterState = {
            members: new Set(['ALL']),
            statuses: new Set(['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'DELAY'])
        };

        function getCheckedValuesInFilter(containerId) {
            return new Set(Array.from(document.querySelectorAll('#' + containerId + ' input[type="checkbox"]:checked')).map(function(input) {
                return String(input.value);
            }));
        }

        function updateMemberReportFilterChipStyles(containerId) {
            const target = document.getElementById(containerId);
            if (!target) return;

            target.querySelectorAll('.member-report-check').forEach(function(label) {
                const input = label.querySelector('input[type="checkbox"]');
                label.classList.toggle('is-checked', !!(input && input.checked));
            });
        }

        function syncMemberReportFilterStateFromDom() {
            memberReportFilterState.members = getCheckedValuesInFilter('memberReportMemberFilters');
            memberReportFilterState.statuses = getCheckedValuesInFilter('memberReportStatusFilters');

            updateMemberReportFilterChipStyles('memberReportMemberFilters');
            updateMemberReportFilterChipStyles('memberReportStatusFilters');
        }

        function setAllCheckboxes(container, checked) {
            Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(function(input) {
                input.checked = checked;
            });
        }

        function normalizeFilterGroup(container, changedInput) {
            const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
            const allInput = inputs.find(function(input) {
                return input.value === 'ALL';
            });
            const specificInputs = inputs.filter(function(input) {
                return input.value !== 'ALL';
            });

            if (!allInput) return;

            if (changedInput && changedInput.value === 'ALL') {
                // 전체 체크: 모두 선택 / 전체 해제: 모두 해제
                setAllCheckboxes(container, changedInput.checked);
                return;
            }

            const checkedSpecificCount = specificInputs.filter(function(input) {
                return input.checked;
            }).length;

            // 개별 항목이 전부 선택되어 있을 때만 전체 체크
            allInput.checked = checkedSpecificCount === specificInputs.length;
        }

        function handleMemberReportFilterChange(type, changedInput) {
            const containerId = type === 'member' ? 'memberReportMemberFilters' : 'memberReportStatusFilters';
            const container = document.getElementById(containerId);
            if (!container) return;

            normalizeFilterGroup(container, changedInput);
            syncMemberReportFilterStateFromDom();
            renderMemberProgress(workList || []);
        }

        function bindMemberReportFilterEvents() {
            const memberTarget = document.getElementById('memberReportMemberFilters');
            const statusTarget = document.getElementById('memberReportStatusFilters');

            [memberTarget, statusTarget].forEach(function(target) {
                if (!target || target.dataset.filterBound === 'Y') return;

                target.dataset.filterBound = 'Y';
                target.addEventListener('change', function(event) {
                    const input = event.target;
                    if (!input || input.type !== 'checkbox') return;

                    const type = target.id === 'memberReportMemberFilters' ? 'member' : 'status';
                    handleMemberReportFilterChange(type, input);
                });
            });
        }

        function ensureMemberReportMemberFilters(members) {
            const target = document.getElementById('memberReportMemberFilters');
            if (!target) return;

            const previousChecked = getCheckedValuesInFilter('memberReportMemberFilters');
            const initialized = target.dataset.memberFilterInitialized === 'Y';
            const shouldCheckAll = !initialized || previousChecked.has('ALL');

            let html = '';
            html += '<label class="member-report-check"><input type="checkbox" value="ALL" ' + (shouldCheckAll ? 'checked' : '') + '> 전체</label>';

            members.forEach(function(member) {
                const value = String(member.userId);
                const checked = shouldCheckAll || previousChecked.has(value);
                html += '<label class="member-report-check"><input type="checkbox" value="' + escapeHtml(value) + '" ' + (checked ? 'checked' : '') + '> ' + escapeHtml(member.userName) + '</label>';
            });

            target.innerHTML = html;
            target.dataset.memberFilterInitialized = 'Y';
            updateMemberReportFilterChipStyles('memberReportMemberFilters');
            syncMemberReportFilterStateFromDom();
        }

        function isMemberReportTaskVisible(member, task) {
            if (!memberReportFilterState.members || memberReportFilterState.members.size === 0) {
                return false;
            }

            if (!memberReportFilterState.statuses || memberReportFilterState.statuses.size === 0) {
                return false;
            }

            const memberAllowed = memberReportFilterState.members.has('ALL') || memberReportFilterState.members.has(String(member.userId));
            if (!memberAllowed) return false;

            const status = task._normalizedStatus || normalizeStatus(task.STATUS || task.status);
            const delayed = !!task._delayed;

            if (memberReportFilterState.statuses.has('ALL')) return true;
            if (delayed && memberReportFilterState.statuses.has('DELAY')) return true;

            return memberReportFilterState.statuses.has(status);
        }


        function renderMemberProgress(list) {
            const target = document.getElementById('memberProgressList');
            if (!target) return;

            bindMemberReportFilterEvents();

            if (!list || list.length === 0) {
                target.innerHTML = '<div class="member-progress-empty">등록된 업무가 없습니다.</div>';
                return;
            }

            const grouped = {};

            list.forEach(function(task) {
                const userId = task.USER_ID || task.userId || task.ASSIGNED_USER_ID || task.assignedUserId || 'NONE';
                const userName = task.USER_NAME || task.userName || task.ASSIGNED_USER_NAME || task.assignedUserName || '담당자 없음';
                const key = String(userId);

                if (!grouped[key]) {
                    grouped[key] = {
                        userId: userId,
                        userName: userName,
                        roleName: getWorkMemberRoleName(userId, task),
                        todo: 0,
                        progress: 0,
                        done: 0,
                        delay: 0,
                        tasks: []
                    };
                }

                const status = normalizeStatus(task.STATUS || task.status);
                const delayedYn = task.DELAYED_YN || task.delayedYn;
                const taskUseTime = isWorkTimeEnabledFromData(task);
                const delayed = delayedYn === 'Y' || (
                    status !== 'DONE' &&
                    isDelayed(
                        task.END_DATE || task.endDate,
                        taskUseTime ? (task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot) : '18:00'
                    )
                );

                if (status === 'TODO') grouped[key].todo++;
                if (status === 'IN_PROGRESS') grouped[key].progress++;
                if (status === 'DONE') grouped[key].done++;
                if (delayed) grouped[key].delay++;

                grouped[key].tasks.push(Object.assign({}, task, {
                    _normalizedStatus: status,
                    _delayed: delayed,
                    _useTime: taskUseTime
                }));
            });

            const members = Object.values(grouped).sort(function(a, b) {
                if (b.progress !== a.progress) return b.progress - a.progress;
                if (b.todo !== a.todo) return b.todo - a.todo;
                if (b.delay !== a.delay) return b.delay - a.delay;
                return String(a.userName).localeCompare(String(b.userName), 'ko');
            });

            ensureMemberReportMemberFilters(members);
            syncMemberReportFilterStateFromDom();

            let html = '';
            html += '<div class="member-progress-list member-task-report-list member-role-board">';

            let visibleMemberCount = 0;

            members.forEach(function(member) {
                const visibleTasks = member.tasks
                    .filter(function(task) {
                        return isMemberReportTaskVisible(member, task);
                    })
                    .slice()
                    .sort(sortMemberRoleTasks);

                if (visibleTasks.length === 0) {
                    return;
                }

                visibleMemberCount++;

                const currentTasks = visibleTasks.filter(function(task) {
                    return task._normalizedStatus === 'IN_PROGRESS';
                });

                const primaryCurrentTask = currentTasks[0] || null;
                const visibleTodo = visibleTasks.filter(function(task) { return task._normalizedStatus === 'TODO'; }).length;
                const visibleProgress = visibleTasks.filter(function(task) { return task._normalizedStatus === 'IN_PROGRESS'; }).length;
                const visibleDone = visibleTasks.filter(function(task) { return task._normalizedStatus === 'DONE'; }).length;
                const visibleDelay = visibleTasks.filter(function(task) { return !!task._delayed; }).length;

                html += '<article class="member-role-card" data-report-member-id="' + escapeHtml(member.userId) + '">';
                html += '   <div class="member-role-top">';
                html += '       <div class="member-role-profile">';
                html += '           <div class="member-avatar">' + escapeHtml(getMemberInitial(member.userName)) + '</div>';
                html += '           <div class="member-role-profile-text">';
                html += '               <strong>' + escapeHtml(member.userName) + '</strong>';
                html += '               <span class="member-role-badge">' + escapeHtml(member.roleName || '역할 미지정') + '</span>';
                html += '           </div>';
                html += '       </div>';
                html += '       <div class="member-role-counts" aria-label="' + escapeHtml(member.userName) + ' 업무 요약">';
                html += '           <span class="member-report-pill">전체 ' + visibleTasks.length + '</span>';
                html += '           <span class="member-report-pill progress">진행 ' + visibleProgress + '</span>';
                html += '           <span class="member-report-pill todo">할 일 ' + visibleTodo + '</span>';
                html += '           <span class="member-report-pill done">완료 ' + visibleDone + '</span>';
                html += '           <span class="member-report-pill delay">지연 ' + visibleDelay + '</span>';
                html += '       </div>';
                html += '   </div>';

                html += '   <div class="member-current-box">';
                html += '       <div class="member-current-label">현재 진행</div>';

                if (primaryCurrentTask) {
                    html += renderMemberCurrentTask(primaryCurrentTask);
                } else {
                    html += '       <div class="member-current-empty">현재 진행 중인 업무가 없습니다.</div>';
                }

                html += '   </div>';

                html += '   <div class="member-role-body">';
                html += '       <div class="member-duty-title">담당 업무 <span>' + visibleTasks.length + '개</span></div>';
                html += '       <div class="member-duty-list">';

                visibleTasks.slice(0, 6).forEach(function(task) {
                    html += renderMemberDutyItem(task);
                });

                html += '       </div>';

                if (visibleTasks.length > 6) {
                    html += '   <div class="member-duty-more">외 ' + (visibleTasks.length - 6) + '개 업무 더 있음</div>';
                }

                html += '   </div>';
                html += '</article>';
            });

            if (visibleMemberCount === 0) {
                html += '<div class="member-report-filter-empty">선택한 멤버/진행상황에 해당하는 업무가 없습니다.</div>';
            }

            html += '</div>';
            target.innerHTML = html;
        }

        function sortMemberRoleTasks(a, b) {
            const aDelayed = a._delayed ? 1 : 0;
            const bDelayed = b._delayed ? 1 : 0;
            if (bDelayed !== aDelayed) return bDelayed - aDelayed;

            const order = { IN_PROGRESS: 0, TODO: 1, DONE: 2 };
            const aOrder = order[a._normalizedStatus] ?? 9;
            const bOrder = order[b._normalizedStatus] ?? 9;
            if (aOrder !== bOrder) return aOrder - bOrder;

            const aEnd = String(a.END_DATE || a.endDate || '');
            const bEnd = String(b.END_DATE || b.endDate || '');
            return aEnd.localeCompare(bEnd);
        }

        function renderMemberCurrentTask(task) {
            const taskId = task.TASK_ID || task.taskId || task.EVENT_ID || task.eventId || '';
            const title = task.TITLE || task.title || task.TASK_TITLE || task.taskTitle || '제목 없음';
            const useTime = task._useTime === true || isWorkTimeEnabledFromData(task);
            const period = formatWorkMainPeriod(
                task.START_DATE || task.startDate,
                task.START_TIME || task.startTime,
                task.END_DATE || task.endDate,
                task.END_TIME || task.endTime,
                useTime
            );

            let html = '';
            html += '<div class="member-current-task" onclick="openEditWorkModalById(' + escapeHtml(taskId) + ')" data-report-task-id="' + escapeHtml(taskId) + '">';
            html += '   <strong>' + escapeHtml(title) + '</strong>';
            html += '   <span>' + escapeHtml(period) + '</span>';
            html += '</div>';
            return html;
        }

        function renderMemberDutyItem(task) {
            const taskId = task.TASK_ID || task.taskId || task.EVENT_ID || task.eventId || '';
            const title = task.TITLE || task.title || task.TASK_TITLE || task.taskTitle || '제목 없음';
            const status = task._normalizedStatus || normalizeStatus(task.STATUS || task.status);
            const delayed = !!task._delayed;
            const useTime = task._useTime === true || isWorkTimeEnabledFromData(task);

            const period = formatWorkMainPeriod(
                task.START_DATE || task.startDate,
                task.START_TIME || task.startTime,
                task.END_DATE || task.endDate,
                task.END_TIME || task.endTime,
                useTime
            );

            const statusClass = delayed ? 'delay' : getMemberReportStatusClass(status);
            const statusText = delayed ? '지연' : getMemberStatusText(status);

            let html = '';
            html += '<div class="member-duty-item" onclick="openEditWorkModalById(' + escapeHtml(taskId) + ')" data-report-task-id="' + escapeHtml(taskId) + '" data-report-status="' + escapeHtml(status) + '" data-report-title="' + escapeHtml(title) + '">';
            html += '   <strong class="member-duty-name">' + escapeHtml(title) + '</strong>';
            html += '   <span class="member-duty-period">' + escapeHtml(period) + '</span>';
            html += '   <span class="member-duty-status ' + statusClass + '">' + escapeHtml(statusText) + '</span>';
            html += '</div>';
            return html;
        }

        function getMemberReportStatusClass(status) {
            if (status === 'IN_PROGRESS') return 'progress';
            if (status === 'DONE') return 'done';
            return 'todo';
        }

        function openEditWorkModalById(taskId) {
            const task = workList.find(function(item) {
                return String(item.TASK_ID || item.taskId || item.EVENT_ID || item.eventId) === String(taskId);
            });

            if (task) {
                openEditWorkModal(task);
            }
        }

        function getMemberInitial(name) {
            const text = String(name || '?').trim();
            return text.substring(0, 1);
        }

        function getMemberStatusText(status) {
            if (status === 'IN_PROGRESS') return '진행 중';
            if (status === 'DONE') return '완료';
            return '할 일';
        }

        function getMemberStatusClass(status) {
            if (status === 'IN_PROGRESS') return 'progress status-progress';
            if (status === 'DONE') return 'done status-done';
            return 'status-todo';
        }

        function formatMemberTaskDate(startDate, startSlot, endDate, endSlot) {
            const start = toShortDate(startDate);
            const end = toShortDate(endDate);

            if (start && end) {
                return start === end ? start : start + ' - ' + end;
            }

            if (end) return end + ' 마감';
            if (start) return start + ' 시작';
            return '기간 미정';
        }



        
        function formatWorkMainDate(dateText) {
            if (!dateText) return '미정';

            const value = String(dateText).substring(0, 10).replaceAll('.', '-').replaceAll('/', '-');
            const parts = value.split('-');

            if (parts.length >= 3) {
                return parts[1] + '/' + parts[2];
            }

            return value;
        }

        function formatWorkMainPeriod(startDate, startTime, endDate, endTime, useTime) {
            const start = formatWorkMainDate(startDate);
            const end = formatWorkMainDate(endDate);
            const showTime = useTime === true;
            const startClock = showTime ? formatWorkTimeText(startTime) : '';
            const endClock = showTime ? formatWorkTimeText(endTime) : '';

            if (start === '미정' && end === '미정') return '기간 미정';

            if (start !== '미정' && end !== '미정') {
                if (start === end) {
                    return showTime && (startClock || endClock)
                        ? start + (startClock ? ' ' + startClock : '') + (endClock ? ' ~ ' + endClock : '')
                        : start;
                }
                return start + (startClock ? ' ' + startClock : '') + ' ~ ' + end + (endClock ? ' ' + endClock : '');
            }

            if (start !== '미정') return start + (startClock ? ' ' + startClock : '') + ' 시작';
            return end + (endClock ? ' ' + endClock : '') + ' 마감';
        }

        function getWorkStatusShortText(status, delayed) {
            if (delayed) return '지연';
            return '';
        }


function getWorkStatusClass(status) {
            if (status === 'IN_PROGRESS') return 'status-progress';
            if (status === 'DONE') return 'status-done';
            return 'status-todo';
        }

function createTaskCard(task, delayed) {
            const taskId = task.TASK_ID || task.taskId || task.EVENT_ID || task.eventId;
            const title = task.TITLE || task.title || '제목 없음';
            const userName = task.USER_NAME || task.userName || '담당자 없음';
            const startDate = task.START_DATE || task.startDate || '';
            const endDate = task.END_DATE || task.endDate || '';
            const useTime = isWorkTimeEnabledFromData(task);
            const startTime = useTime ? normalizeWorkTime(task.START_TIME || task.startTime || task.START_TIME_SLOT || task.startTimeSlot, '09:00') : '';
            const endTime = useTime ? normalizeWorkTime(task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot, '18:00') : '';
            const status = normalizeStatus(task.STATUS || task.status);
            const delayedYn = task.DELAYED_YN || task.delayedYn || (delayed ? 'Y' : 'N');
            const isDelay = delayedYn === 'Y';

            const card = document.createElement('div');
            card.className = 'task-card ' + getWorkStatusClass(status) + (isDelay ? ' delayed' : '');
            card.draggable = true;
            card.dataset.taskId = taskId;

            card.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', String(taskId));
            });

            card.addEventListener('click', function() {
                openEditWorkModal(task);
            });

            card.innerHTML =
                '<div class="work-task-top">' +
                    '<div class="work-task-title" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</div>' +
                    (isDelay ? '<span class="work-task-status status-delay">지연</span>' : '') +
                '</div>' +
                '<div class="work-task-sub">' +
                    '<span class="work-task-assignee" title="' + escapeHtml(userName) + '">' + escapeHtml(userName) + '</span>' +
                    '<span class="work-task-period">' + escapeHtml(formatWorkMainPeriod(startDate, startTime, endDate, endTime, useTime)) + '</span>' +
                '</div>';

            return card;
        }

        function fillEmpty(listEl) {
            if (listEl.children.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-column';
                empty.textContent = '+ 빈 칸을 클릭해 업무 추가';
                listEl.appendChild(empty);
            }
        }

        function updateCounts(todo, progress, done, delay) {
            const total = todo + progress + done;

            setText('todoCount', todo);
            setText('progressCount', progress);
            setText('doneCount', done);

            setText('summaryTotal', total);
            setText('summaryTodo', todo);
            setText('summaryProgress', progress);
            setText('summaryDone', done);
            setText('summaryDelay', delay);
        }

        
        function setWorkStatusValue(status) {
            const value = status || 'TODO';
            const select = document.getElementById('workStatus');

            if (select) {
                select.value = value;
                select.dataset.status = value;
                select.classList.remove('status-todo', 'status-progress', 'status-done');
                select.classList.add(value === 'IN_PROGRESS' ? 'status-progress' : (value === 'DONE' ? 'status-done' : 'status-todo'));
            }

            document.querySelectorAll('#workModal .work-status-pill').forEach(function(button) {
                button.classList.toggle('active', button.dataset.status === value);
            });
        }

        function updateWorkStatus(taskId, newStatus) {
            const params = new URLSearchParams();
            params.append('taskId', taskId);
            params.append('status', newStatus);

            fetch('/project/api/update-task-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            })
            .then(function(res) {
                if (!res.ok) throw new Error('상태 변경 실패');
                return res.text();
            })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    loadWorkList();
                } else {
                    alert('상태 변경에 실패했습니다.');
                }
            })
            .catch(function(err) {
                console.error(err);
                alert('상태 변경 중 오류가 발생했습니다.');
            });
        }

        function openAddWorkModal(defaultStatus) {
            currentMode = 'ADD';
            document.getElementById('workModalTitle').textContent = '업무 추가';
            document.getElementById('workTaskId').value = '';
            document.getElementById('workTitle').value = '';
            document.getElementById('workStartDate').value = getTodayDateString();
            document.getElementById('workEndDate').value = getTodayDateString();
            setWorkStatusValue(defaultStatus || 'TODO');
            document.getElementById('workStartTime').value = '09:00';
            document.getElementById('workEndTime').value = '18:00';
            toggleWorkTimeFields(false);
            loadWorkMemberOptions();
            document.getElementById('deleteWorkBtn').style.display = 'none';
            openWorkModal();
        }

        function openEditWorkModal(task) {
            currentMode = 'EDIT';

            const taskId = task.TASK_ID || task.taskId || task.EVENT_ID || task.eventId;
            const title = task.TITLE || task.title || '';
            const startDate = toDateInputValue(task.START_DATE || task.startDate);
            const endDate = toDateInputValue(task.END_DATE || task.endDate);
            const status = normalizeStatus(task.STATUS || task.status);

            document.getElementById('workModalTitle').textContent = '업무 수정';
            document.getElementById('workTaskId').value = taskId;
            document.getElementById('workTitle').value = title;
            document.getElementById('workStartDate').value = startDate;
            document.getElementById('workEndDate').value = endDate;
            setWorkStatusValue(status);
            const detailUseTime = isWorkTimeEnabledFromData(task);
            document.getElementById('workStartTime').value = normalizeWorkTime(task.START_TIME || task.startTime || task.START_TIME_SLOT || task.startTimeSlot, '09:00');
            document.getElementById('workEndTime').value = normalizeWorkTime(task.END_TIME || task.endTime || task.END_TIME_SLOT || task.endTimeSlot, '18:00');
            toggleWorkTimeFields(detailUseTime);
            loadWorkMemberOptions(task.USER_ID || task.userId);
            document.getElementById('deleteWorkBtn').style.display = 'inline-flex';

            openWorkModal();
        }

        function openWorkModal() {
            document.getElementById('modalBackdrop').classList.add('active');
            document.getElementById('workModal').classList.add('active');
        }

        function closeWorkModal() {
            document.getElementById('modalBackdrop').classList.remove('active');
            document.getElementById('workModal').classList.remove('active');
        }

        function saveWork() {
            const taskId = document.getElementById('workTaskId').value;
            const title = document.getElementById('workTitle').value.trim();
            const startDate = document.getElementById('workStartDate').value;
            const endDate = document.getElementById('workEndDate').value;
            const status = document.getElementById('workStatus').value;
            const useTime = getWorkUseTimeValue();
            const startTime = useTime ? document.getElementById('workStartTime').value : '';
            const endTime = useTime ? document.getElementById('workEndTime').value : '';
            const assignedUserId = document.getElementById('workAssignedUserId') ? document.getElementById('workAssignedUserId').value : '';

            if (!title) {
                alert('업무명을 입력하세요.');
                return;
            }

            if (currentMode === 'ADD') {
                addWork(title, startDate, endDate, status, startTime, endTime, assignedUserId, useTime);
            } else {
                updateWork(taskId, title, startDate, endDate, status, startTime, endTime, assignedUserId, useTime);
            }
        }

        function addWork(title, startDate, endDate, status, startTime, endTime, assignedUserId, useTime) {
            const params = new URLSearchParams();
            params.append('projId', projId);
            params.append('wsId', wsId);
            params.append('title', title);
            params.append('loginUserId', loginUserId || '');
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }
            if (assignedUserId) {
                params.append('assignedUserId', assignedUserId);
            }

            fetch('/project/api/add-task', {
                method: 'POST',
                credentials: 'include',
                body: params
            })
            .then(function(res) { return res.text(); })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    closeWorkModal();
                    loadWorkList();
                } else {
                    alert('업무 추가에 실패했습니다: ' + result);
                }
            });
        }

        function updateWork(taskId, title, startDate, endDate, status, startTime, endTime, assignedUserId, useTime) {
            const params = new URLSearchParams();
            params.append('taskId', taskId);
            params.append('title', title);
            params.append('loginUserId', loginUserId || '');
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('status', status);
            params.append('useTime', useTime ? 'Y' : 'N');
            if (useTime) {
                params.append('startTime', startTime);
                params.append('endTime', endTime);
            }
            if (assignedUserId) {
                params.append('assignedUserId', assignedUserId);
            }

            fetch('/project/api/update-task', {
                method: 'POST',
                credentials: 'include',
                body: params
            })
            .then(function(res) { return res.text(); })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    closeWorkModal();
                    loadWorkList();
                } else {
                    alert('업무 수정에 실패했습니다: ' + result);
                }
            });
        }

        function deleteWork() {
            const taskId = document.getElementById('workTaskId').value;

            if (!taskId) {
                alert('업무를 선택해주세요.');
                return;
            }

            if (!confirm('정말 이 업무를 삭제하시겠습니까?')) return;

            fetch('/project/api/delete-task?taskId=' + encodeURIComponent(taskId), {
                method: 'POST'
            })
            .then(function(res) { return res.text(); })
            .then(function(result) {
                if (result === 'SUCCESS') {
                    closeWorkModal();
                    loadWorkList();
                } else {
                    alert('업무 삭제에 실패했습니다: ' + result);
                }
            });
        }

        function renderEmptyError() {
            ['todoList', 'progressList', 'doneList'].forEach(function(id) {
                const el = document.getElementById(id);
                if (el) {
                    el.innerHTML = '<div class="empty-column">업무를 불러오지 못했습니다.</div>';
                }
            });
        }

        function normalizeStatus(status) {
            const value = String(status || '').toUpperCase();
            if (value === 'IN_PROGRESS') return 'IN_PROGRESS';
            if (value === 'DONE') return 'DONE';
            return 'TODO';
        }

        function getStatusText(status) {
            if (status === 'IN_PROGRESS') return '진행 중';
            if (status === 'DONE') return '완료';
            return '진행 전';
        }

        function formatDateRange(startDate, endDate) {
            const start = toShortDate(startDate);
            const end = toShortDate(endDate);

            if (!start && !end) return '일정 미정';
            if (start && end) return start + ' ~ ' + end;
            if (start) return start + ' 시작';
            return end + ' 마감';
        }

        
        function formatWorkDeadline(dateText, endTime) {
            if (!dateText) return '미정';
            const shortDate = toShortDate(dateText);
            const clock = formatWorkTimeText(endTime);
            return shortDate + (clock ? ' ' + clock : '');
        }

function toShortDate(value) {
            const input = String(value || '').trim();
            if (!input) return '';

            const dateOnly = input.substring(0, 10).replaceAll('.', '-').replaceAll('/', '-');
            const parts = dateOnly.split('-');

            if (parts.length >= 3) {
                return parts[1] + '/' + parts[2];
            }

            return input;
        }

        function toDateInputValue(value) {
            const input = String(value || '').trim();
            if (!input) return '';

            return input.substring(0, 10).replaceAll('.', '-').replaceAll('/', '-');
        }

        function isDelayed(endDateText, endTime) {
            if (!endDateText) return false;

            const normalized = String(endDateText).replaceAll('.', '-').replaceAll('/', '-').trim();
            const dateOnly = normalized.substring(0, 10);
            const time = normalizeWorkTime(endTime, '18:00');
            const endDate = new Date(dateOnly + 'T' + time + ':59');

            if (Number.isNaN(endDate.getTime())) return false;

            return endDate < new Date();
        }

        function setText(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }

        function escapeHtml(value) {
            return String(value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }
    </script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(syncWorkListTotalCount, 200);
    setTimeout(syncWorkListTotalCount, 800);
});

function syncWorkListTotalCount() {
    const totalEl = document.getElementById('summaryTotal');
    if (!totalEl) return;

    const todo = parseInt((document.getElementById('summaryTodo') || document.getElementById('todoCount'))?.innerText || '0', 10) || 0;
    const progress = parseInt((document.getElementById('summaryProgress') || document.getElementById('progressCount'))?.innerText || '0', 10) || 0;
    const done = parseInt((document.getElementById('summaryDone') || document.getElementById('doneCount'))?.innerText || '0', 10) || 0;

    totalEl.innerText = todo + progress + done;
}
</script>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />

</body>
</html>
