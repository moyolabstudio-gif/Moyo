<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${workspace.wsName} - 워크스페이스 설정</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <style>
        * { box-sizing: border-box; }

        body {
            margin: 0;
            background: #f7f9fc;
            color: #172033;
            font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .workspace-settings-page {
            width: calc(100% - 48px) !important;
            max-width: 1040px !important;
            margin: 28px auto 72px !important;
        }

        .settings-hero {
            position: relative;
            overflow: hidden;
            min-height: 116px;
            padding: 24px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            border: 1px solid #e5edf7;
            border-radius: 20px;
            background: linear-gradient(135deg, #fff 0%, #f7fbff 100%);
            box-shadow: 0 10px 28px rgba(34, 91, 155, .05);
        }

        .settings-hero::before {
            content: "";
            position: absolute;
            left: 0;
            top: 22px;
            bottom: 22px;
            width: 4px;
            border-radius: 0 999px 999px 0;
            background: linear-gradient(180deg, #4a90e2, #39cdb5);
        }

        .settings-hero::after {
            content: "";
            position: absolute;
            right: -66px;
            top: -96px;
            width: 210px;
            height: 210px;
            border-radius: 50%;
            background: rgba(74, 144, 226, .045);
        }

        .settings-hero-copy {
            position: relative;
            z-index: 1;
            min-width: 0;
        }

        .settings-kicker {
            display: block;
            margin-bottom: 5px;
            color: #8a94a6;
            font-size: 12px;
            font-style: italic;
            font-weight: 600;
        }

        .settings-hero h1 {
            margin: 0 0 7px;
            color: #111827;
            font-size: 25px;
            font-weight: 900;
            letter-spacing: -.035em;
        }

        .settings-hero p {
            margin: 0;
            color: #7b8798;
            font-size: 13px;
        }

        .settings-hero-actions {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .settings-back-link {
            position: relative;
            z-index: 1;
            min-height: 38px;
            padding: 0 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #dbe5ef;
            border-radius: 10px;
            background: #fff;
            color: #516173;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
        }

        .settings-layout {
            margin-top: 18px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .settings-card {
            padding: 24px;
            border: 1px solid #e7edf4;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 8px 22px rgba(15, 23, 42, .035);
        }

        .settings-section + .settings-section {
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid #eef2f6;
        }

        .settings-section-head {
            margin-bottom: 16px;
        }

        .settings-section-head h2 {
            margin: 0 0 5px;
            color: #1d2939;
            font-size: 16px;
            font-weight: 900;
        }

        .settings-section-head p {
            margin: 0;
            color: #8a94a6;
            font-size: 11px;
            line-height: 1.5;
        }

        .settings-media-section {
            margin-top: 24px;
        }

        .settings-media-grid {
            display: grid;
            grid-template-columns: 390px minmax(0, 1fr);
            gap: 22px;
            align-items: start;
        }

        .settings-media-panel {
            min-width: 0;
        }

        .settings-media-panel .settings-section-head {
            margin-bottom: 12px;
        }

        .settings-media-panel .settings-section-head h2 {
            font-size: 15px;
        }


        .settings-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        .form-group {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-group.full {
            grid-column: 1 / -1;
        }

        .form-group label,
        .field-label {
            color: #475569;
            font-size: 12px;
            font-weight: 800;
        }

        .form-control {
            width: 100%;
            min-height: 42px;
            padding: 0 12px;
            border: 1px solid #dfe7ef;
            border-radius: 10px;
            background: #fff;
            color: #263244;
            font: 13px inherit;
            outline: none;
            transition: border-color .16s ease, box-shadow .16s ease;
        }

        textarea.form-control {
            min-height: 90px;
            height: 90px;
            padding-top: 11px;
            resize: none;
            line-height: 1.55;
        }

        .form-control:focus {
            border-color: #73aae9;
            box-shadow: 0 0 0 3px rgba(74, 144, 226, .1);
        }

        .workspace-link-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .workspace-link-row {
            display: grid;
            grid-template-columns: 138px minmax(0, 1fr) 34px;
            gap: 8px;
            align-items: center;
        }

        .workspace-link-row .form-control {
            min-height: 40px;
        }

        .workspace-link-remove {
            width: 34px;
            height: 34px;
            border: 1px solid #e1e8ef;
            border-radius: 9px;
            background: #fff;
            color: #98a2b3;
            font-size: 18px;
            cursor: pointer;
        }

        .workspace-link-remove:hover {
            border-color: #f0b8bf;
            color: #d85c68;
            background: #fff8f8;
        }

        .workspace-link-add {
            margin-top: 9px;
            padding: 0;
            border: 0;
            background: transparent;
            color: #347fcf;
            font: 800 12px inherit;
            cursor: pointer;
        }

        .workspace-link-help {
            margin: 7px 0 0;
            color: #98a2b3;
            font-size: 10.5px;
        }

        .image-editor {
            display: grid;
            grid-template-columns: 92px minmax(0, 1fr);
            align-items: center;
            gap: 14px;
            width: 100%;
            min-width: 0;
            max-width: 390px;
            padding: 14px;
            border: 1px solid #e5ecf3;
            border-radius: 14px;
            background: #fafcff;
        }

        .preview-box {
            position: relative;
            width: 92px;
            height: 92px;
            flex: 0 0 92px;
            overflow: hidden;
            border: 1px solid #dce6f0;
            border-radius: 17px;
            background: #f3f6f9;
            box-shadow: 0 5px 13px rgba(15, 23, 42, .05);
            cursor: grab;
            touch-action: none;
        }

        .preview-box:active {
            cursor: grabbing;
        }

        .preview-box img {
            position: absolute;
            left: 50%;
            top: 50%;
            display: block;
            width: auto;
            height: auto;
            min-width: 0;
            min-height: 0;
            max-width: none;
            max-height: none;
            user-select: none;
            pointer-events: none;
            transform-origin: center;
        }

        .image-editor-info {
            min-width: 0;
            flex: 1;
        }

        .image-zoom-row {
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .image-zoom-row span {
            flex: 0 0 auto;
            color: #7b8798;
            font-size: 10.5px;
            font-weight: 800;
        }

        .image-zoom-row input[type="range"] {
            width: 170px;
            max-width: 100%;
            accent-color: #4A90E2;
        }

        .file-custom-container {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .file-upload-btn {
            min-height: 36px;
            padding: 0 12px;
            display: inline-flex;
            align-items: center;
            border: 1px solid #dce5ee;
            border-radius: 9px;
            background: #fff;
            color: #536274;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
        }

        .file-name-display {
            min-width: 0;
            max-width: 130px;
            overflow: hidden;
            color: #8793a5;
            font-size: 11px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .image-help {
            margin: 7px 0 0;
            color: #98a2b3;
            font-size: 10.5px;
        }

        .settings-save-bar {
            margin-top: 22px;
            padding-top: 18px;
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            border-top: 1px solid #eef2f6;
        }

        .settings-btn {
            min-height: 40px;
            padding: 0 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            border: 1px solid #dce5ee;
            background: #fff;
            color: #536274;
            font: 800 12px inherit;
            text-decoration: none;
            cursor: pointer;
        }

        .settings-btn-primary {
            border: 0;
            color: #fff;
            background: linear-gradient(135deg, #4a90e2, #39cdb5);
            box-shadow: 0 8px 18px rgba(57, 205, 181, .2);
        }

        .settings-side-card {
            width: 100%;
            padding: 19px 22px;
            border: 1px solid #e7edf4;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 8px 22px rgba(15, 23, 42, .035);
        }

        .settings-side-card h3 {
            margin: 0 0 8px;
            color: #1d2939;
            font-size: 14px;
            font-weight: 900;
        }

        .settings-side-card p {
            margin: 0 0 15px;
            color: #8a94a6;
            font-size: 11px;
            line-height: 1.55;
        }


        .workspace-member-manage-list {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }

        .workspace-member-manage-row {
            min-height: 66px;
            padding: 11px 13px;
            display: grid;
            grid-template-columns:
                minmax(230px, 1fr)
                108px
                minmax(170px, 210px)
                82px
                146px;
            align-items: center;
            column-gap: 10px;
            border: 1px solid #e6edf4;
            border-radius: 12px;
            background: #fbfdff;
        }

        .workspace-member-manage-info {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 11px;
        }

        .workspace-member-manage-avatar {
            width: 40px;
            height: 40px;
            flex: 0 0 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: 50%;
            background: linear-gradient(135deg, #4a90e2, #39cdb5);
            color: #fff;
            font-size: 14px;
            font-weight: 700;
        }

        .workspace-member-manage-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .workspace-member-manage-text {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .workspace-member-manage-name {
            overflow: hidden;
            color: #263244;
            font-size: 13px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .workspace-member-manage-email {
            overflow: hidden;
            color: #8a94a6;
            font-size: 10.5px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .workspace-member-role-select {
            width: 100%;
            min-width: 0;
            height: 36px;
            padding: 0 9px;
            border: 1px solid #dfe7ef;
            border-radius: 9px;
            background: #fff;
            color: #475569;
            font: 12px inherit;
            outline: none;
        }

        .workspace-member-role-select:disabled {
            background: #f2f5f8;
            color: #8a94a6;
            cursor: default;
        }

        .workspace-member-position-input {
            width: 100%;
            min-width: 0;
            height: 36px;
            padding: 0 10px;
            border: 1px solid #dfe7ef;
            border-radius: 9px;
            background: #fff;
            color: #475569;
            font: 12px inherit;
            outline: none;
        }

        .workspace-member-position-input {
            max-width: 260px;
        }

        .workspace-member-position-input:focus {
            border-color: #79ace7;
            box-shadow: 0 0 0 3px rgba(74, 144, 226, .09);
        }

        .workspace-member-position-save {
            width: 82px;
            min-width: 82px;
            min-height: 36px;
            padding: 0 11px;
            border: 1px solid #c9ddf1;
            border-radius: 9px;
            background: #f7fbff;
            color: #347fcf;
            font: 600 11px inherit;
            white-space: nowrap;
            cursor: pointer;
        }

        .workspace-member-actions {
            width: 146px;
            min-width: 72px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            white-space: nowrap;
        }

        .workspace-member-transfer-button {
            min-height: 34px;
            padding: 0 9px;
            border: 1px solid #bdd8f1;
            border-radius: 9px;
            background: #f5faff;
            color: #347fcf;
            font: 600 11px inherit;
            white-space: nowrap;
            cursor: pointer;
        }

        .workspace-member-kick-button {
            min-height: 34px;
            padding: 0 9px;
            border: 1px solid #efc9ce;
            border-radius: 9px;
            background: #fffafa;
            color: #d85864;
            font: 600 11px inherit;
            cursor: pointer;
        }

        .workspace-member-kick-button:hover {
            border-color: #e7abb3;
            background: #fff2f3;
        }

        .workspace-member-role-note {
            margin: 9px 0 0;
            color: #98a2b3;
            font-size: 10.5px;
            line-height: 1.5;
        }

        /* 설정 화면 폭 고정: 공통 레이아웃/사이드바 CSS보다 우선 적용 */
        body.moyo-app-sidebar-enabled .workspace-settings-page,
        body .workspace-settings-page {
            width: calc(100% - 48px) !important;
            max-width: 1040px !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }

        .settings-card,
        .settings-hero,
        .settings-tabs {
            max-width: 100%;
        }

        .settings-form-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        }

        .workspace-image-uploader {
            padding: 14px;
        }

        @media (max-width: 1280px) {
            body.moyo-app-sidebar-enabled .workspace-settings-page,
            body .workspace-settings-page {
                max-width: 980px !important;
            }

            .workspace-member-manage-row {
                grid-template-columns:
                    minmax(220px, 1fr)
                    108px
                    minmax(160px, 200px)
                    82px
                    146px;
            }

            .workspace-member-actions {
                width: 146px;
                min-width: 146px;
            }
        }


        @media (max-width: 980px) {
            .settings-media-grid {
                grid-template-columns: 1fr;
            }

            .image-editor {
                max-width: 100%;
            }
        }

        @media (max-width: 980px) {
            .workspace-member-manage-row {
                grid-template-columns: minmax(220px, 1fr) 118px 88px;
                row-gap: 9px;
            }

            .workspace-member-position-input {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .workspace-member-position-save {
                grid-column: 3 / 4;
                grid-row: 2;
            }

            .workspace-member-actions {
                grid-column: 1 / -1;
                grid-row: 3;
                width: 100%;
                min-width: 0;
                justify-content: flex-end;
            }
        }

        @media (max-width: 680px) {
            .image-editor {
                display: grid;
                grid-template-columns: 78px minmax(0, 1fr);
                min-width: 0;
                width: 100%;
            }

            .preview-box {
                width: 78px;
                height: 78px;
                flex-basis: 78px;
            }

            .image-zoom-row input[type="range"] {
                width: 150px;
                max-width: 100%;
            }

            .workspace-member-manage-row {
                grid-template-columns: minmax(0, 1fr) 104px;
            }

            .workspace-member-position-input {
                grid-column: 1 / -1;
                grid-row: auto;
            }

            .workspace-member-position-save {
                grid-column: 1 / -1;
                grid-row: auto;
                width: 100%;
            }

            .workspace-member-actions {
                grid-column: 1 / -1;
                justify-content: stretch;
            }

            .workspace-member-actions button {
                flex: 1;
            }
        }

        .danger-zone {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            border-color: #f1d7da;
            background: #fffafa;
        }

        .danger-zone-copy {
            min-width: 0;
        }

        .danger-zone h3 {
            margin-bottom: 5px;
            color: #d85864;
        }

        .danger-zone p {
            margin-bottom: 0;
        }

        .btn-delete {
            width: auto;
            min-width: 150px;
            min-height: 38px;
            border: 1px solid #efc6cb;
            border-radius: 10px;
            background: #fff;
            color: #d85864;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
        }

        .btn-delete:hover {
            background: #fff2f3;
        }

        @media (max-width: 820px) {
            .danger-zone {
                align-items: flex-start;
                flex-direction: column;
            }

            .btn-delete {
                width: 100%;
            }
        }

        @media (max-width: 600px) {
            .workspace-settings-page {
                width: min(100% - 20px, 1180px);
                margin-top: 18px;
            }

            .settings-hero {
                padding: 21px 20px;
            }

            .settings-form-grid {
                grid-template-columns: 1fr;
            }

            .form-group.full {
                grid-column: auto;
            }

            .workspace-link-row {
                grid-template-columns: 1fr 34px;
            }

            .workspace-link-row input:first-child {
                grid-column: 1 / 2;
            }

            .workspace-link-row input:nth-child(2) {
                grid-column: 1 / 2;
            }

            .workspace-link-remove {
                grid-column: 2 / 3;
                grid-row: 1 / span 2;
                align-self: stretch;
                height: auto;
            }
        }

        .settings-tabs {
            margin-top: 15px;
            padding: 5px;
            display: inline-flex;
            gap: 4px;
            border: 1px solid #e4ebf3;
            border-radius: 12px;
            background: #f4f7fb;
        }

        .settings-tab-button {
            min-height: 36px;
            padding: 0 15px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: #667085;
            font: 600 12px inherit;
            cursor: pointer;
        }

        .settings-tab-button.is-active {
            background: #fff;
            color: #347fcf;
            box-shadow: 0 4px 12px rgba(15,23,42,.07);
        }

        .settings-tab-panel {
            display: none;
        }

        .settings-tab-panel.is-active {
            display: block;
        }

        .member-tab-head {
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
        }

        .member-tab-head h2 {
            margin: 0 0 4px;
            font-size: 16px;
        }

        .member-tab-head p {
            margin: 0;
            color: #8a94a6;
            font-size: 11px;
        }

        .member-tab-invite {
            min-height: 36px;
            padding: 0 13px;
            border: 0;
            border-radius: 9px;
            background: linear-gradient(135deg,#4a90e2,#39cdb5);
            color: #fff;
            font: 600 11px inherit;
            cursor: pointer;
        }

        .member-search-box {
            margin: 0 0 12px;
            position: relative;
        }

        .member-search-box input {
            width: 100%;
            height: 40px;
            padding: 0 14px 0 38px;
            border: 1px solid #dfe7ef;
            border-radius: 11px;
            background: #fff;
            color: #172033;
            font: 12px inherit;
            outline: none;
            transition: border-color .15s ease, box-shadow .15s ease;
        }

        .member-search-box input:focus {
            border-color: #91bff0;
            box-shadow: 0 0 0 3px rgba(74,144,226,.12);
        }

        .member-search-box::before {
            content: '🔎';
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 12px;
            opacity: .62;
            pointer-events: none;
        }

        .workspace-member-empty {
            display: none;
            padding: 22px 14px;
            border: 1px dashed #dbe6f2;
            border-radius: 12px;
            background: #fbfdff;
            color: #8a94a6;
            font-size: 12px;
            text-align: center;
        }

        .workspace-member-empty.is-visible {
            display: block;
        }

        .workspace-member-manage-list {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }

        .workspace-member-manage-row {
            min-height: 66px;
            padding: 11px 13px;
            display: grid;
            grid-template-columns: minmax(260px,1fr) 110px 260px 82px 72px;
            align-items: center;
            column-gap: 10px;
            border: 1px solid #e6edf4;
            border-radius: 12px;
            background: #fbfdff;
        }

        .workspace-member-manage-info {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 11px;
        }

        .workspace-member-manage-avatar {
            width: 40px;
            height: 40px;
            flex: 0 0 40px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: linear-gradient(135deg,#4a90e2,#39cdb5);
            color: #fff;
            font-size: 14px;
            font-weight: 700;
        }

        .workspace-member-manage-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .workspace-member-manage-text {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .workspace-member-manage-name,
        .workspace-member-manage-email {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .workspace-member-manage-name {
            font-size: 13px;
            font-weight: 700;
        }

        .workspace-member-manage-email {
            color: #8a94a6;
            font-size: 10.5px;
        }

        .workspace-member-manage-joined {
            display: none;
        }

        .workspace-member-role-select,
        .workspace-member-position-input {
            width: 100%;
            min-width: 0;
            height: 36px;
            padding: 0 10px;
            border: 1px solid #dfe7ef;
            border-radius: 9px;
            background: #fff;
            color: #475569;
            font: 12px inherit;
        }

        .workspace-member-role-select:disabled {
            background: #f2f5f8;
            color: #8a94a6;
        }

        .workspace-member-position-save,
        .workspace-member-transfer-button,
        .workspace-member-kick-button {
            min-height: 36px;
            padding: 0 10px;
            border-radius: 9px;
            font: 600 11px inherit;
            white-space: nowrap;
            cursor: pointer;
        }

        .workspace-member-position-save,
        .workspace-member-transfer-button {
            border: 1px solid #c9ddf1;
            background: #f7fbff;
            color: #347fcf;
        }

        .workspace-member-position-save {
            width: 82px;
        }

        .workspace-member-actions {
            width: 72px;
            display: flex;
            justify-content: flex-end;
            gap: 6px;
        }

        .workspace-member-kick-button {
            border: 1px solid #efc9ce;
            background: #fffafa;
            color: #d85864;
        }

        .workspace-member-role-note {
            margin: 10px 0 0;
            color: #98a2b3;
            font-size: 10.5px;
            line-height: 1.5;
        }

        .tab-invite-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 3000;
            background: rgba(15,23,42,.48);
        }

        .tab-invite-modal {
            display: none;
            position: fixed;
            z-index: 3001;
            left: 50%;
            top: 50%;
            width: min(520px,calc(100vw - 28px));
            transform: translate(-50%,-50%);
            border: 1px solid #e5ebf2;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 26px 70px rgba(15,23,42,.24);
        }

        .tab-invite-head {
            min-height: 72px;
            padding: 18px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eef2f6;
        }

        .tab-invite-head span {
            display: block;
            margin-bottom: 3px;
            color: #8b96a8;
            font-size: 10.5px;
        }

        .tab-invite-head h3 {
            margin: 0;
            font-size: 18px;
        }

        .tab-invite-head button {
            width: 32px;
            height: 32px;
            border: 0;
            background: transparent;
            color: #98a2b3;
            font-size: 23px;
            cursor: pointer;
        }

        .tab-invite-body {
            padding: 18px 20px 20px;
        }

        .tab-invite-search {
            display: grid;
            grid-template-columns: minmax(0,1fr) 70px;
            gap: 8px;
        }

        .tab-invite-search input {
            height: 40px;
            padding: 0 11px;
            border: 1px solid #dfe7ef;
            border-radius: 10px;
        }

        .tab-invite-search button,
        .tab-invite-user button {
            border: 0;
            border-radius: 9px;
            background: linear-gradient(135deg,#4a90e2,#39cdb5);
            color: #fff;
            font: 600 11px inherit;
            cursor: pointer;
        }

        .tab-invite-results {
            max-height: 300px;
            margin-top: 14px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .tab-invite-empty {
            padding: 36px 14px;
            border: 1px dashed #dfe7ef;
            border-radius: 12px;
            color: #98a2b3;
            font-size: 12px;
            text-align: center;
        }

        .tab-invite-user {
            min-height: 58px;
            padding: 9px 10px;
            display: grid;
            grid-template-columns: 38px minmax(0,1fr) 58px;
            align-items: center;
            gap: 10px;
            border: 1px solid #e6edf4;
            border-radius: 11px;
            background: #fbfdff;
        }

        .tab-invite-avatar {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: linear-gradient(135deg,#4a90e2,#39cdb5);
            color: #fff;
            font-weight: 700;
        }

        .tab-invite-info {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .tab-invite-info strong,
        .tab-invite-info span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .tab-invite-info strong { font-size: 12px; }
        .tab-invite-info span { color: #8a94a6; font-size: 10.5px; }

        .tab-invite-user button {
            width: 66px;
            height: 34px;
            padding: 0 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 7px 16px rgba(57,205,181,.16);
        }

        .tab-invite-user button:disabled {
            border: 1px solid #d9e3ee;
            background: #f3f6fa;
            color: #98a2b3;
            box-shadow: none;
            cursor: default;
        }

        .tab-invite-search button {
            height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 800;
        }

        @media (max-width: 980px) {
            .workspace-member-manage-row {
                grid-template-columns: minmax(220px,1fr) 118px 88px;
                row-gap: 9px;
            }

            .workspace-member-position-input {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .workspace-member-position-save {
                grid-column: 3 / 4;
                grid-row: 2;
            }

            .workspace-member-actions {
                grid-column: 1 / -1;
                grid-row: 3;
                width: 100%;
            }
        }

        @media (max-width: 720px) {
            .image-editor {
                grid-template-columns: 1fr;
            }

            .preview-box {
                width: 112px;
                height: 112px;
            }
        }


        /* 설정 페이지: 히어로는 공통 톤 유지, 카드 내부만 한 화면용으로 압축 */
        .workspace-settings-page {
            margin-bottom: 28px !important;
        }

        .settings-tabs {
            margin-top: 12px;
            padding: 4px;
        }

        .settings-tab-button {
            min-height: 34px;
            padding: 0 14px;
        }

        .settings-layout {
            margin-top: 12px;
            gap: 12px;
        }

        .settings-card {
            padding: 18px 22px;
            border-radius: 16px;
        }

        .settings-section-head {
            margin-bottom: 10px;
        }

        .settings-section-head h2 {
            margin-bottom: 3px;
            font-size: 15px;
        }

        .settings-section-head p {
            line-height: 1.35;
        }

        .settings-form-grid {
            gap: 10px 14px;
        }

        .form-group {
            gap: 5px;
        }

        .form-control {
            min-height: 38px;
            border-radius: 9px;
            font-size: 12px;
        }

        textarea.form-control {
            min-height: 62px;
            height: 62px;
            padding-top: 9px;
            line-height: 1.4;
            resize: none;
        }

        .settings-media-section {
            margin-top: 14px;
            padding-top: 14px;
        }

        .settings-media-grid {
            grid-template-columns: 350px minmax(0, 1fr);
            gap: 18px;
        }

        .settings-media-panel .settings-section-head {
            margin-bottom: 8px;
        }

        .settings-media-panel .settings-section-head h2 {
            font-size: 14px;
        }

        .image-editor {
            grid-template-columns: 84px minmax(0, 1fr);
            max-width: 350px;
            gap: 12px;
            padding: 11px;
            border-radius: 13px;
        }

        .preview-box {
            width: 84px;
            height: 84px;
            flex-basis: 84px;
            border-radius: 15px;
        }

        .file-upload-btn {
            min-height: 32px;
            padding: 0 10px;
            font-size: 10.5px;
            border-radius: 8px;
        }

        .file-name-display,
        .image-help,
        .workspace-link-help,
        .image-zoom-row span {
            font-size: 10px;
        }

        .image-help {
            margin-top: 5px;
        }

        .image-zoom-row {
            margin-top: 5px;
            gap: 7px;
        }

        .image-zoom-row input[type="range"] {
            width: 155px;
        }

        .workspace-link-list {
            gap: 6px;
        }

        .workspace-link-row {
            grid-template-columns: 118px minmax(0, 1fr) 32px;
            gap: 6px;
        }

        .workspace-link-row .form-control {
            min-height: 36px;
            font-size: 12px;
        }

        .workspace-link-remove {
            width: 32px;
            height: 32px;
            border-radius: 8px;
        }

        .workspace-link-add {
            margin-top: 7px;
            font-size: 11px;
        }

        .workspace-link-help {
            margin-top: 5px;
        }

        .settings-save-bar {
            margin-top: 14px;
            padding-top: 12px;
            gap: 8px;
        }

        .settings-btn {
            min-height: 36px;
            padding: 0 13px;
            border-radius: 9px;
            font-size: 11px;
        }

        .settings-side-card.danger-zone {
            margin-top: 0;
            padding: 12px 16px;
            min-height: 52px;
            border-radius: 14px;
        }

        .danger-zone h3 {
            margin: 0 0 2px;
            font-size: 13px;
        }

        .danger-zone p {
            font-size: 10.5px;
            line-height: 1.35;
        }

        .btn-delete {
            min-width: 120px;
            min-height: 34px;
            border-radius: 9px;
            font-size: 10.5px;
        }

        @media (min-width: 981px) and (max-height: 880px) {
            .workspace-settings-page {
                margin-top: 18px !important;
                margin-bottom: 18px !important;
            }

            .settings-tabs {
                margin-top: 10px;
            }

            .settings-layout {
                margin-top: 10px;
            }

            .settings-card {
                padding: 15px 18px;
            }

            textarea.form-control {
                min-height: 54px;
                height: 54px;
            }

            .settings-media-section {
                margin-top: 12px;
                padding-top: 12px;
            }

            .preview-box {
                width: 74px;
                height: 74px;
                flex-basis: 74px;
            }

            .image-editor {
                grid-template-columns: 74px minmax(0, 1fr);
                padding: 10px;
            }

            .settings-side-card.danger-zone {
                display: none;
            }
        }


        /* 최종 조정: 히어로는 유지하고 풋터는 화면 하단으로, 이미지 편집 영역은 조금 넓게 */
        body .workspace-settings-page {
            min-height: calc(100vh - 214px) !important;
            margin-bottom: 22px !important;
        }

        .settings-media-grid {
            grid-template-columns: 420px minmax(0, 1fr) !important;
            gap: 20px !important;
            align-items: start;
        }

        .image-editor {
            grid-template-columns: 96px minmax(0, 1fr) !important;
            max-width: 420px !important;
            width: 100% !important;
            gap: 14px !important;
            padding: 12px 14px !important;
        }

        .preview-box {
            width: 96px !important;
            height: 96px !important;
            flex-basis: 96px !important;
        }

        .image-zoom-row input[type="range"] {
            width: 230px !important;
            max-width: min(230px, 100%) !important;
        }

        .image-help {
            white-space: nowrap;
        }

        @media (min-width: 981px) and (max-height: 880px) {
            body .workspace-settings-page {
                min-height: calc(100vh - 196px) !important;
            }

            .settings-media-grid {
                grid-template-columns: 400px minmax(0, 1fr) !important;
                gap: 18px !important;
            }

            .image-editor {
                grid-template-columns: 88px minmax(0, 1fr) !important;
                max-width: 400px !important;
                padding: 11px 13px !important;
            }

            .preview-box {
                width: 88px !important;
                height: 88px !important;
                flex-basis: 88px !important;
            }

            .image-zoom-row input[type="range"] {
                width: 210px !important;
                max-width: min(210px, 100%) !important;
            }
        }

        @media (max-width: 980px) {
            body .workspace-settings-page {
                min-height: auto !important;
            }

            .settings-media-grid {
                grid-template-columns: 1fr !important;
            }

            .image-editor {
                max-width: 100% !important;
            }
        }

    </style>

    <script>
        const workspaceSettingImageEditor = {
            file: null,
            objectUrl: '',
            dirty: false,
            x: 0,
            y: 0,
            scale: 1,
            baseWidth: 0,
            baseHeight: 0,
            dragging: false,
            startPointerX: 0,
            startPointerY: 0,
            startX: 0,
            startY: 0
        };

        function revokeWorkspaceSettingImageUrl() {
            if (workspaceSettingImageEditor.objectUrl) {
                URL.revokeObjectURL(workspaceSettingImageEditor.objectUrl);
                workspaceSettingImageEditor.objectUrl = '';
            }
        }

        function calculateWorkspaceSettingImageBaseSize() {
            const viewport = document.getElementById('imagePreviewBox');
            const image = document.getElementById('imagePreview');
            if (!viewport || !image || !image.naturalWidth || !image.naturalHeight) return;

            const viewWidth = viewport.clientWidth || 104;
            const viewHeight = viewport.clientHeight || 104;
            const imageRatio = image.naturalWidth / image.naturalHeight;
            const viewRatio = viewWidth / viewHeight;

            if (imageRatio >= viewRatio) {
                workspaceSettingImageEditor.baseHeight = viewHeight;
                workspaceSettingImageEditor.baseWidth = viewHeight * imageRatio;
            } else {
                workspaceSettingImageEditor.baseWidth = viewWidth;
                workspaceSettingImageEditor.baseHeight = viewWidth / imageRatio;
            }

            image.style.width = workspaceSettingImageEditor.baseWidth + 'px';
            image.style.height = workspaceSettingImageEditor.baseHeight + 'px';
        }

        function renderWorkspaceSettingImage() {
            const image = document.getElementById('imagePreview');
            if (!image) return;
            image.style.transform =
                'translate(-50%, -50%) translate(' + workspaceSettingImageEditor.x + 'px, ' + workspaceSettingImageEditor.y + 'px) scale(' + workspaceSettingImageEditor.scale + ')';
        }

        function loadWorkspaceSettingImage(src, reset) {
            const image = document.getElementById('imagePreview');
            const zoom = document.getElementById('imageZoom');
            if (!image || !src) return;

            if (reset) {
                workspaceSettingImageEditor.x = 0;
                workspaceSettingImageEditor.y = 0;
                workspaceSettingImageEditor.scale = 1;
                if (zoom) zoom.value = '1';
            }

            image.onload = function() {
                calculateWorkspaceSettingImageBaseSize();
                requestAnimationFrame(renderWorkspaceSettingImage);
            };
            image.src = src;

            if (image.complete && image.naturalWidth) {
                calculateWorkspaceSettingImageBaseSize();
                requestAnimationFrame(renderWorkspaceSettingImage);
            }
        }

        // 파일 선택 시 프리뷰 반영 및 드래그/확대 편집 준비
        function previewImage(input) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                workspaceSettingImageEditor.file = file;
                workspaceSettingImageEditor.dirty = true;

                $('#fileNameText').text(file.name);
                revokeWorkspaceSettingImageUrl();
                workspaceSettingImageEditor.objectUrl = URL.createObjectURL(file);
                loadWorkspaceSettingImage(workspaceSettingImageEditor.objectUrl, true);
            } else {
                $('#fileNameText').text("선택된 파일 없음");
            }
        }

        function initWorkspaceSettingImageEditor() {
            const viewport = document.getElementById('imagePreviewBox');
            const image = document.getElementById('imagePreview');
            const zoom = document.getElementById('imageZoom');
            if (!viewport || !image || !zoom) return;

            function startDrag(e) {
                if (!image.src) return;
                e.preventDefault();
                workspaceSettingImageEditor.dragging = true;
                workspaceSettingImageEditor.startPointerX = e.clientX;
                workspaceSettingImageEditor.startPointerY = e.clientY;
                workspaceSettingImageEditor.startX = workspaceSettingImageEditor.x;
                workspaceSettingImageEditor.startY = workspaceSettingImageEditor.y;
                if (viewport.setPointerCapture) {
                    try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
                }
            }

            function moveDrag(e) {
                if (!workspaceSettingImageEditor.dragging) return;
                workspaceSettingImageEditor.x = workspaceSettingImageEditor.startX + (e.clientX - workspaceSettingImageEditor.startPointerX);
                workspaceSettingImageEditor.y = workspaceSettingImageEditor.startY + (e.clientY - workspaceSettingImageEditor.startPointerY);
                workspaceSettingImageEditor.dirty = true;
                renderWorkspaceSettingImage();
            }

            function endDrag() {
                workspaceSettingImageEditor.dragging = false;
            }

            viewport.addEventListener('pointerdown', startDrag);
            viewport.addEventListener('pointermove', moveDrag);
            viewport.addEventListener('pointerup', endDrag);
            viewport.addEventListener('pointercancel', endDrag);
            viewport.addEventListener('lostpointercapture', endDrag);
            document.addEventListener('pointermove', moveDrag);
            document.addEventListener('pointerup', endDrag);

            zoom.addEventListener('input', function() {
                workspaceSettingImageEditor.scale = Number(zoom.value || '1');
                workspaceSettingImageEditor.dirty = true;
                renderWorkspaceSettingImage();
            });

            if (image.complete && image.naturalWidth) {
                calculateWorkspaceSettingImageBaseSize();
                renderWorkspaceSettingImage();
            } else {
                image.addEventListener('load', function() {
                    calculateWorkspaceSettingImageBaseSize();
                    renderWorkspaceSettingImage();
                });
            }
        }

        async function getWorkspaceSettingImageBlob() {
            const viewport = document.getElementById('imagePreviewBox');
            const image = document.getElementById('imagePreview');
            if (!viewport || !image || !image.naturalWidth || !workspaceSettingImageEditor.dirty) return null;

            const outputWidth = 600;
            const outputHeight = 600;
            const viewWidth = viewport.clientWidth || 104;
            const viewHeight = viewport.clientHeight || 104;
            const drawWidth = workspaceSettingImageEditor.baseWidth * workspaceSettingImageEditor.scale;
            const drawHeight = workspaceSettingImageEditor.baseHeight * workspaceSettingImageEditor.scale;
            const drawX = (viewWidth - drawWidth) / 2 + workspaceSettingImageEditor.x;
            const drawY = (viewHeight - drawHeight) / 2 + workspaceSettingImageEditor.y;

            const canvas = document.createElement('canvas');
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputWidth, outputHeight);
            ctx.scale(outputWidth / viewWidth, outputHeight / viewHeight);
            ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

            return await new Promise(function(resolve) {
                canvas.toBlob(resolve, 'image/png');
            });
        }

        function addWorkspaceLink(name, url) {
            const list = document.getElementById('workspaceLinkList');
            const row = document.createElement('div');
            row.className = 'workspace-link-row';
            row.innerHTML =
                '<input type="text" name="linkName" class="form-control" maxlength="50" placeholder="링크 이름">' +
                '<input type="text" name="linkUrl" class="form-control" maxlength="500" placeholder="https://...">' +
                '<button type="button" class="workspace-link-remove" onclick="removeWorkspaceLink(this)">×</button>';
            row.querySelector('[name="linkName"]').value = name || '';
            row.querySelector('[name="linkUrl"]').value = url || '';
            list.appendChild(row);
        }

        function removeWorkspaceLink(button) {
            const list = document.getElementById('workspaceLinkList');
            const rows = list.querySelectorAll('.workspace-link-row');
            if (rows.length === 1) {
                rows[0].querySelectorAll('input').forEach(function(input) { input.value = ''; });
                return;
            }
            button.closest('.workspace-link-row').remove();
        }


        function saveWorkspaceMemberPosition(userId) {
            const row = document.querySelector(
                '.workspace-member-manage-row[data-user-id="' + userId + '"]'
            );
            if (!row) return;

            const positionInput = row.querySelector('.workspace-member-position-input');
            const saveButton = row.querySelector('.workspace-member-position-save');
            const params = new URLSearchParams();

            params.append('wsId', '${workspace.wsId}');
            params.append('userId', userId);
            params.append('positionName', positionInput.value.trim());

            saveButton.disabled = true;
            saveButton.textContent = '저장 중';

            fetch('/workspace/api/update-member-position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                if (result === 'success') {
                    alert('워크스페이스 역할을 저장했습니다.');
                    return;
                }
                alert('워크스페이스 역할 저장에 실패했습니다.');
            })
            .catch(function(error) {
                console.error('워크스페이스 역할 저장 실패:', error);
                alert('워크스페이스 역할 저장 중 오류가 발생했습니다.');
            })
            .finally(function() {
                saveButton.disabled = false;
                saveButton.textContent = '역할 저장';
            });
        }

        function transferWorkspaceLeaderFromSettings(userId, memberName, select, previousRole) {
            if (!confirm(memberName + ' 멤버에게 그룹장 권한을 넘기시겠습니까?\n기존 그룹장은 관리자로 변경됩니다.')) {
                if (select) select.value = previousRole || 'MEMBER';
                return;
            }

            if (select) {
                select.disabled = true;
            }

            const params = new URLSearchParams();
            params.append('wsId', '${workspace.wsId}');
            params.append('newAdminId', userId);

            fetch('/workspace/api/transfer-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                if (result === 'success') {
                    alert('그룹장을 위임했습니다.');
                    location.reload();
                    return;
                }

                if (select) {
                    select.disabled = false;
                    select.value = previousRole || 'MEMBER';
                }

                if (result === 'owner_only') {
                    alert('현재 그룹장만 그룹장 권한을 넘길 수 있습니다.');
                } else {
                    alert('그룹장 위임에 실패했습니다.');
                }
            })
            .catch(function(error) {
                console.error('그룹장 위임 실패:', error);
                if (select) {
                    select.disabled = false;
                    select.value = previousRole || 'MEMBER';
                }
                alert('그룹장 위임 중 오류가 발생했습니다.');
            });
        }

        function changeWorkspaceMemberRole(select, userId) {
            const previousRole = select.dataset.previousRole || 'MEMBER';
            const role = select.value;
            const row = select.closest('.workspace-member-manage-row');
            const memberNameElement = row ? row.querySelector('.workspace-member-manage-name') : null;
            const memberName = memberNameElement ? memberNameElement.textContent.trim() : '선택한';

            if (role === 'OWNER') {
                transferWorkspaceLeaderFromSettings(userId, memberName, select, previousRole);
                return;
            }

            if (!confirm('이 멤버의 권한을 변경하시겠습니까?')) {
                select.value = previousRole;
                return;
            }

            select.disabled = true;

            const params = new URLSearchParams();
            params.append('wsId', '${workspace.wsId}');
            params.append('userId', userId);
            params.append('role', role);

            fetch('/workspace/api/update-member-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                select.disabled = false;

                if (result === 'success') {
                    select.dataset.previousRole = role;
                    alert('멤버 권한을 변경했습니다.');
                    return;
                }

                select.value = previousRole;
                if (result === 'owner_role_locked') {
                    alert('그룹장 권한은 선택 즉시 위임 방식으로만 변경할 수 있습니다.');
                } else {
                    alert('멤버 권한 변경에 실패했습니다.');
                }
            })
            .catch(function(error) {
                console.error('워크스페이스 권한 변경 실패:', error);
                select.disabled = false;
                select.value = previousRole;
                alert('멤버 권한 변경 중 오류가 발생했습니다.');
            });
        }

        function removeWorkspaceMemberFromSettings(userId, memberName) {
            if (!confirm(memberName + ' 멤버를 워크스페이스에서 내보내시겠습니까?')) return;

            const params = new URLSearchParams();
            params.append('wsId', '${workspace.wsId}');
            params.append('userId', userId);

            fetch('/workspace/api/remove-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(response) { return response.text(); })
            .then(function(result) {
                if (result === 'success') {
                    const row = document.querySelector(
                        '.workspace-member-manage-row[data-user-id="' + userId + '"]'
                    );
                    if (row) row.remove();
                    alert('멤버를 워크스페이스에서 내보냈습니다.');
                    return;
                }

                alert('멤버 내보내기에 실패했습니다.');
            })
            .catch(function(error) {
                console.error('워크스페이스 멤버 내보내기 실패:', error);
                alert('멤버 내보내기 중 오류가 발생했습니다.');
            });
        }

        // 그룹 정보 수정 (UPDATE) AJAX 호출
        async function updateWorkspaceSetting() {
            const wsName = $('#wsName').val().trim();
            if(!wsName) {
                alert("그룹 이름을 입력해 주세요.");
                return;
            }

            const form = $('#settingsForm')[0];
            const formData = new FormData(form);
            const editedImageBlob = await getWorkspaceSettingImageBlob();
            if (editedImageBlob) {
                formData.set('wsImage', editedImageBlob, 'workspace-image.png');
            }

            $.ajax({
                url: '/workspace/api/update',
                type: 'POST',
                data: formData,
                processData: false, 
                contentType: false, 
                success: function(res) {
                    if(res === 'success') {
                        alert("그룹 정보가 수정되었습니다.");
                        location.href = "/workspace/main?wsId=${workspace.wsId}";
                    } else {
                        alert("수정에 실패했습니다. 입력값을 확인해 주세요.");
                    }
                },
                error: function(err) {
                    console.error("수정 중 오류 발생:", err);
                    alert("서버 통신 오류가 발생했습니다.");
                }
            });
        }

        // 그룹 완전 삭제 (DELETE) AJAX 호출
        function deleteWorkspace() {
            if (confirm("정말로 이 그룹을 삭제하시겠습니까?\n삭제 후 프로젝트, 게시글, 멤버십을 포함한 모든 데이터가 복구 불가능하게 파괴됩니다.")) {
                $.ajax({
                    url: '/workspace/api/delete',
                    type: 'POST',
                    data: { wsId: "${workspace.wsId}" },
                    success: function(res) {
                        if (res === 'success') {
                            alert("그룹이 안전하게 폐쇄 및 완전히 삭제되었습니다.");
                            location.href = "/workspace/list"; 
                        } else {
                            alert("그룹 삭제 처리에 실패했습니다. 권한을 확인하세요.");
                        }
                    },
                    error: function(err) {
                        console.error("삭제 중 오류 발생:", err);
                        alert("서버 통신 오류가 발생했습니다.");
                    }
                });
            }
        }

        function switchWorkspaceSettingsTab(tabName) {
            const basic = document.getElementById('settingsTabBasic');
            const members = document.getElementById('settingsTabMembers');

            basic.classList.toggle('is-active', tabName === 'basic');
            members.classList.toggle('is-active', tabName === 'members');

            document.querySelectorAll('.settings-tab-button').forEach(function(button) {
                button.classList.toggle('is-active', button.dataset.tab === tabName);
            });

            const url = new URL(window.location.href);
            if (tabName === 'members') {
                url.searchParams.set('tab', 'members');
            } else {
                url.searchParams.delete('tab');
            }
            history.replaceState(null, '', url);
        }

        function openTabInviteModal() {
            document.getElementById('tabInviteOverlay').style.display = 'block';
            document.getElementById('tabInviteModal').style.display = 'block';
            setTimeout(function() {
                document.getElementById('tabInviteEmail').focus();
            }, 60);
        }

        function closeTabInviteModal() {
            document.getElementById('tabInviteOverlay').style.display = 'none';
            document.getElementById('tabInviteModal').style.display = 'none';
            document.getElementById('tabInviteEmail').value = '';
            document.getElementById('tabInviteResults').innerHTML =
                '<div class="tab-invite-empty">이메일로 멤버를 검색하세요.</div>';
        }

        function escapeTabHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;')
                .replace(/'/g,'&#039;');
        }

        function filterWorkspaceMembers() {
            const input = document.getElementById('workspaceMemberSearchInput');
            const empty = document.getElementById('workspaceMemberEmpty');
            const rows = document.querySelectorAll('.workspace-member-manage-row');
            const keyword = (input && input.value ? input.value : '').trim().toLowerCase();
            let visibleCount = 0;

            rows.forEach(function(row) {
                const haystack = (row.dataset.search || row.innerText || '').toLowerCase();
                const visible = keyword === '' || haystack.indexOf(keyword) > -1;
                row.style.display = visible ? '' : 'none';
                if (visible) visibleCount++;
            });

            if (empty) {
                empty.classList.toggle('is-visible', rows.length > 0 && visibleCount === 0);
            }
        }

        function searchTabInviteUser() {
            const email = document.getElementById('tabInviteEmail').value.trim();
            const results = document.getElementById('tabInviteResults');
            const wsId = Number('${workspace.wsId}');

            if (email.length < 2) {
                alert('검색할 이메일을 2자 이상 입력해주세요.');
                return;
            }

            if (!wsId) {
                results.innerHTML = '<div class="tab-invite-empty">워크스페이스 정보를 확인할 수 없습니다.</div>';
                return;
            }

            results.innerHTML = '<div class="tab-invite-empty">검색 중입니다.</div>';

            fetch('/workspace/api/search-member?wsId=' + encodeURIComponent(wsId) +
                  '&email=' + encodeURIComponent(email))
                .then(function(response) {
                    if (!response.ok) throw new Error('SEARCH_FAILED');
                    return response.json();
                })
                .then(function(users) {
                    if (!Array.isArray(users) || users.length === 0) {
                        results.innerHTML = '<div class="tab-invite-empty">검색된 사용자가 없습니다.</div>';
                        return;
                    }

                    results.innerHTML = users.map(function(user) {
                        const userEmail = user.email || user.EMAIL || '';
                        const userName = user.userName || user.USER_NAME || userEmail;
                        const initial = userName ? userName.substring(0,1) : '?';
                        const status = user.memberStatus || user.MEMBER_STATUS || 'AVAILABLE';
                        let actionHtml = '';

                        if (status === 'SELF') {
                            actionHtml = '<button type="button" disabled>본인</button>';
                        } else if (status === 'ALREADY_MEMBER') {
                            actionHtml = '<button type="button" disabled>이미 가입됨</button>';
                        } else if (status === 'PENDING') {
                            actionHtml = '<button type="button" disabled>초대 대기</button>';
                        } else {
                            actionHtml = '<button type="button" data-email="' + escapeTabHtml(userEmail) +
                                '" onclick="inviteTabMember(this.dataset.email)">초대</button>';
                        }

                        return '<div class="tab-invite-user">' +
                            '<div class="tab-invite-avatar">' + escapeTabHtml(initial) + '</div>' +
                            '<div class="tab-invite-info">' +
                                '<strong>' + escapeTabHtml(userName) + '</strong>' +
                                '<span>' + escapeTabHtml(userEmail) + '</span>' +
                            '</div>' +
                            actionHtml +
                        '</div>';
                    }).join('');
                })
                .catch(function(error) {
                    console.error(error);
                    results.innerHTML = '<div class="tab-invite-empty">검색 중 오류가 발생했습니다.</div>';
                });
        }

        function inviteTabMember(email) {
            fetch('/workspace/api/invite', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    wsId: Number('${workspace.wsId}'),
                    email: email
                })
            })
            .then(function(response) {
                if (!response.ok) throw new Error('INVITE_FAILED');
                return response.json();
            })
            .then(function(result) {
                if (result.status === 'SUCCESS') {
                    alert('초대장을 보냈습니다.');
                    closeTabInviteModal();
                } else if (result.status === 'ALREADY_EXISTS') {
                    alert('이미 멤버이거나 초대 대기 중인 사용자입니다.');
                } else {
                    alert('초대 처리 중 오류가 발생했습니다.');
                }
            })
            .catch(function(error) {
                console.error(error);
                alert('초대 처리 중 오류가 발생했습니다.');
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            const params = new URLSearchParams(window.location.search);
            switchWorkspaceSettingsTab(
                params.get('tab') === 'members' ? 'members' : 'basic'
            );
            initWorkspaceSettingImageEditor();
        });

    </script>
</head>
<body>
    <jsp:include page="/WEB-INF/views/common/header.jsp" />

    <main class="workspace-settings-page">
        <section class="settings-hero">
            <div class="settings-hero-copy">
                <span class="settings-kicker">워크스페이스 설정</span>
                <h1>${workspace.wsName}</h1>
                <p>워크스페이스 정보와 외부 링크를 관리합니다.</p>
            </div>
            <div class="settings-hero-actions">
                <a href="/workspace/main?wsId=${workspace.wsId}"
                   class="settings-back-link">워크스페이스 홈</a>
            </div>
        </section>

        <div class="settings-tabs" role="tablist">
            <button type="button"
                    class="settings-tab-button"
                    data-tab="basic"
                    onclick="switchWorkspaceSettingsTab('basic')">기본 설정</button>
            <button type="button"
                    class="settings-tab-button"
                    data-tab="members"
                    onclick="switchWorkspaceSettingsTab('members')">멤버 관리</button>
        </div>

        <div class="settings-layout">
            <div id="settingsTabBasic" class="settings-tab-panel">
            <section class="settings-card">
                <form id="settingsForm">
                    <input type="hidden" name="wsId" value="${workspace.wsId}">

                    <div class="settings-section">
                        <div class="settings-section-head">
                            <h2>기본 정보</h2>
                            <p>워크스페이스 이름, 유형과 소개를 수정합니다.</p>
                        </div>

                        <div class="settings-form-grid">
                            <div class="form-group">
                                <label for="wsName">워크스페이스 이름</label>
                                <input type="text"
                                       id="wsName"
                                       name="wsName"
                                       class="form-control"
                                       value="<c:out value='${workspace.wsName}'/>"
                                       maxlength="60"
                                       placeholder="워크스페이스 이름">
                            </div>

                            <div class="form-group">
                                <label for="wsType">워크스페이스 유형</label>
                                <select id="wsType" name="wsType" class="form-control">
                                    <option value="ORGANIZATION" ${workspace.wsType eq 'ORGANIZATION' ? 'selected' : ''}>회사 · 조직</option>
                                    <option value="TEAM" ${workspace.wsType eq 'TEAM' ? 'selected' : ''}>팀 · 프로젝트</option>
                                    <option value="STUDY" ${workspace.wsType eq 'STUDY' ? 'selected' : ''}>스터디 · 연구</option>
                                    <option value="COMMUNITY" ${empty workspace.wsType or workspace.wsType eq 'COMMUNITY' ? 'selected' : ''}>모임 · 커뮤니티</option>
                                    <option value="CLUB" ${workspace.wsType eq 'CLUB' ? 'selected' : ''}>동아리 · 취미</option>
                                    <option value="LIFE" ${workspace.wsType eq 'LIFE' ? 'selected' : ''}>가족 · 생활</option>
                                    <option value="ETC" ${workspace.wsType eq 'ETC' ? 'selected' : ''}>기타</option>
                                </select>
                            </div>

                            <div class="form-group full">
                                <label for="wsDescription">워크스페이스 소개</label>
                                <textarea id="wsDescription"
                                          name="wsDescription"
                                          class="form-control"
                                          maxlength="300"
                                          placeholder="워크스페이스를 소개해주세요"><c:out value="${workspace.wsDescription}"/></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section settings-media-section">
                        <div class="settings-media-grid">
                            <div class="settings-media-panel">
                                <div class="settings-section-head">
                                    <h2>대표 이미지</h2>
                                    <p>사이드바와 워크스페이스 메인에 표시됩니다.</p>
                                </div>

                                <div class="image-editor">
                                    <div id="imagePreviewBox" class="preview-box" title="이미지를 드래그해서 위치를 조절하세요">
                                        <img id="imagePreview"
                                             src="${not empty workspace.wsImagePath ? workspace.wsImagePath : '/images/default-ws.png'}"
                                             alt="워크스페이스 이미지 미리보기">
                                    </div>
                                    <div class="image-editor-info">
                                        <div class="file-custom-container">
                                            <label for="wsImage" class="file-upload-btn">이미지 변경</label>
                                            <span id="fileNameText" class="file-name-display">선택된 파일 없음</span>
                                            <input type="file"
                                                   id="wsImage"
                                                   name="wsImage"
                                                   accept="image/*"
                                                   onchange="previewImage(this)"
                                                   hidden>
                                        </div>
                                        <p class="image-help">드래그로 위치 조절</p>
                                        <div class="image-zoom-row">
                                            <span>크기</span>
                                            <input type="range" id="imageZoom" min="1" max="4" step="0.05" value="1">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="settings-media-panel">
                                <div class="settings-section-head">
                                    <h2>외부 링크</h2>
                                    <p>홈페이지, Git, Notion 등 자주 쓰는 주소를 추가합니다.</p>
                                </div>

                                <div id="workspaceLinkList" class="workspace-link-list">
                                    <c:choose>
                                        <c:when test="${not empty workspaceLinks}">
                                            <c:forEach var="link" items="${workspaceLinks}">
                                                <div class="workspace-link-row">
                                                    <input type="text"
                                                           name="linkName"
                                                           class="form-control"
                                                           maxlength="50"
                                                           value="<c:out value='${link.LINK_NAME}'/>"
                                                           placeholder="링크 이름">
                                                    <input type="text"
                                                           name="linkUrl"
                                                           class="form-control"
                                                           maxlength="500"
                                                           value="<c:out value='${link.LINK_URL}'/>"
                                                           placeholder="https://...">
                                                    <button type="button"
                                                            class="workspace-link-remove"
                                                            onclick="removeWorkspaceLink(this)"
                                                            aria-label="링크 삭제">×</button>
                                                </div>
                                            </c:forEach>
                                        </c:when>
                                        <c:otherwise>
                                            <div class="workspace-link-row">
                                                <input type="text" name="linkName" class="form-control" maxlength="50" placeholder="링크 이름">
                                                <input type="text" name="linkUrl" class="form-control" maxlength="500" placeholder="https://...">
                                                <button type="button"
                                                        class="workspace-link-remove"
                                                        onclick="removeWorkspaceLink(this)"
                                                        aria-label="링크 삭제">×</button>
                                            </div>
                                        </c:otherwise>
                                    </c:choose>
                                </div>

                                <button type="button" class="workspace-link-add" onclick="addWorkspaceLink()">+ 링크 추가</button>
                                <p class="workspace-link-help">등록된 링크는 워크스페이스 히어로 영역에 표시됩니다.</p>
                            </div>
                        </div>
                    </div>

                    <div class="settings-save-bar">
                        <a href="/workspace/main?wsId=${workspace.wsId}" class="settings-btn">취소</a>
                        <button type="button" class="settings-btn settings-btn-primary" onclick="updateWorkspaceSetting()">변경사항 저장</button>
                    </div>
                </form>
            </section>

            <section class="settings-side-card danger-zone">
                <div class="danger-zone-copy">
                    <h3>위험 구역</h3>
                    <p>워크스페이스를 삭제하면 프로젝트, 게시글, 멤버 정보가 모두 삭제되며 복구할 수 없습니다.</p>
                </div>
                <button type="button" class="btn-delete" onclick="deleteWorkspace()">워크스페이스 삭제</button>
            </section>
            </div>

            <div id="settingsTabMembers" class="settings-tab-panel">
                <section class="settings-card">
                    <div class="member-tab-head">
                        <div>
                            <h2>멤버 관리</h2>
                            <p>권한과 워크스페이스 내 역할을 관리합니다.</p>
                        </div>
                        <button type="button"
                                class="member-tab-invite"
                                onclick="openTabInviteModal()">+ 멤버 초대</button>
                    </div>

                    <div class="member-search-box">
                        <input type="text"
                               id="workspaceMemberSearchInput"
                               placeholder="이름, 이메일, 역할로 검색"
                               oninput="filterWorkspaceMembers()">
                    </div>

                    <div class="workspace-member-manage-list" id="workspaceMemberManageList">
                        <c:forEach var="member" items="${memberList}">
                            <div class="workspace-member-manage-row"
                                 data-user-id="${member.USER_ID}"
                                 data-search="${fn:toLowerCase(member.DISPLAY_NAME)} ${fn:toLowerCase(member.EMAIL)} ${fn:toLowerCase(member.WS_ROLE)} ${fn:toLowerCase(member.POSITION_NAME)}">
                                <div class="workspace-member-manage-info">
                                    <div class="workspace-member-manage-avatar">
                                        <c:choose>
                                            <c:when test="${not empty member.PROFILE_IMAGE_PATH}">
                                                <img src="${member.PROFILE_IMAGE_PATH}" alt="" onerror="this.remove();">
                                            </c:when>
                                            <c:otherwise>
                                                <c:out value="${fn:substring(member.DISPLAY_NAME,0,1)}"/>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                    <div class="workspace-member-manage-text">
                                        <span class="workspace-member-manage-name">
                                            <c:out value="${member.DISPLAY_NAME}"/>
                                        </span>
                                        <span class="workspace-member-manage-email">
                                            <c:out value="${member.EMAIL}"/>
                                        </span>
                                        <c:if test="${not empty member.JOINED_AT}">
                                            <span class="workspace-member-manage-joined">
                                                <c:out value="${member.JOINED_AT}"/> 가입
                                            </span>
                                        </c:if>
                                    </div>
                                </div>

                                <c:choose>
                                    <c:when test="${member.USER_ID eq workspace.ownerId}">
                                        <select class="workspace-member-role-select" disabled>
                                            <option>그룹장</option>
                                        </select>
                                    </c:when>
                                    <c:otherwise>
                                        <select class="workspace-member-role-select"
                                                data-previous-role="${member.WS_ROLE}"
                                                onchange="changeWorkspaceMemberRole(this, ${member.USER_ID})">
                                            <c:if test="${currentUserIsOwner}">
                                                <option value="OWNER">그룹장</option>
                                            </c:if>
                                            <option value="ADMIN" ${member.WS_ROLE eq 'ADMIN' ? 'selected' : ''}>관리자</option>
                                            <option value="MEMBER" ${member.WS_ROLE ne 'ADMIN' ? 'selected' : ''}>멤버</option>
                                        </select>
                                    </c:otherwise>
                                </c:choose>

                                <input type="text"
                                       class="workspace-member-position-input"
                                       maxlength="50"
                                       value="<c:out value='${member.POSITION_NAME}'/>"
                                       placeholder="예: 총괄, 백엔드, 디자인">

                                <button type="button"
                                        class="workspace-member-position-save"
                                        onclick="saveWorkspaceMemberPosition(${member.USER_ID})">역할 저장</button>

                                <div class="workspace-member-actions">
                                    <c:if test="${member.USER_ID ne workspace.ownerId and member.USER_ID ne currentUserId}">
                                        <button type="button"
                                                class="workspace-member-kick-button"
                                                onclick="removeWorkspaceMemberFromSettings(${member.USER_ID}, '<c:out value="${member.DISPLAY_NAME}"/>')">
                                            내보내기
                                        </button>
                                    </c:if>
                                </div>
                            </div>
                        </c:forEach>
                    </div>
                    <div id="workspaceMemberEmpty" class="workspace-member-empty">검색된 멤버가 없습니다.</div>

                    <p class="workspace-member-role-note">
                        그룹장은 권한 선택에서 그룹장을 선택해 바로 위임할 수 있습니다. 기존 그룹장은 관리자로 변경됩니다.
                    </p>
                </section>
            </div>
        </div>
    </main>


    <div id="tabInviteOverlay" class="tab-invite-overlay" onclick="closeTabInviteModal()"></div>
    <section id="tabInviteModal" class="tab-invite-modal" role="dialog" aria-modal="true">
        <div class="tab-invite-head">
            <div>
                <span>워크스페이스 멤버</span>
                <h3>멤버 초대</h3>
            </div>
            <button type="button" onclick="closeTabInviteModal()" aria-label="닫기">×</button>
        </div>
        <div class="tab-invite-body">
            <div class="tab-invite-search">
                <input type="text"
                       id="tabInviteEmail"
                       placeholder="초대할 멤버 이메일을 입력하세요"
                       onkeydown="if(event.key==='Enter'){event.preventDefault();searchTabInviteUser();}">
                <button type="button" onclick="searchTabInviteUser()">검색</button>
            </div>
            <div id="tabInviteResults" class="tab-invite-results">
                <div class="tab-invite-empty">이메일로 멤버를 검색하세요.</div>
            </div>
        </div>
    </section>

    <jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>
