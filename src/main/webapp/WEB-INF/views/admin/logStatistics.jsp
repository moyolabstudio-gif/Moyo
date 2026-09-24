<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="${pageContext.request.contextPath}/brand/favicon-32x32.png?v=moyo-favicon-v2">
    <link rel="icon" type="image/png" sizes="16x16" href="${pageContext.request.contextPath}/brand/favicon-16x16.png?v=moyo-favicon-v2">
    <link rel="shortcut icon" href="${pageContext.request.contextPath}/brand/favicon.ico?v=moyo-favicon-v2">
<title>MOYO | 로그·통계</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/moyoUi.css">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/adminShell.css?v=admin-center-v1">
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/adminLogStats.css?v=admin-log-stats-v2">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
</head>
<body class="moyo-admin-shell">
<%@ include file="../common/header.jsp"%>

<aside class="admin-shell-sidebar" aria-label="관리자 메뉴">
    <div class="admin-shell-brand">
        <small>MOYO ADMIN</small>
        <strong>관리자 센터</strong>
    </div>
    <nav class="admin-shell-nav">
        <a href="${pageContext.request.contextPath}/admin"><i class="fa-solid fa-chart-pie"></i><span>대시보드</span></a>
        <a href="${pageContext.request.contextPath}/admin#users"><i class="fa-regular fa-user"></i><span>사용자 관리</span></a>
        <a href="${pageContext.request.contextPath}/admin/inquiries"><i class="fa-regular fa-comments"></i><span>문의 관리</span></a>
        <a href="${pageContext.request.contextPath}/common/noticeList"><i class="fa-regular fa-rectangle-list"></i><span>공지사항 관리</span></a>
        <span class="is-disabled"><i class="fa-solid fa-triangle-exclamation"></i><span>신고·제재 관리</span><span class="admin-shell-badge">준비중</span></span>
        <span class="is-disabled"><i class="fa-solid fa-sliders"></i><span>서비스 운영</span><span class="admin-shell-badge">준비중</span></span>
        <a href="${pageContext.request.contextPath}/admin/logs" class="is-active"><i class="fa-solid fa-chart-line"></i><span>로그·통계</span></a>
        <div class="admin-shell-exit">
            <a href="${pageContext.request.contextPath}/"><i class="fa-solid fa-arrow-left"></i><span>MOYO로 돌아가기</span></a>
        </div>
    </nav>
</aside>

<main class="admin-shell-main">
    <section class="admin-shell-hero">
        <div>
            <p class="admin-shell-kicker">MOYO 관리자</p>
            <h1>로그·통계</h1>
            <p>사용자들이 어떤 메뉴를 많이 쓰고, 언제 가장 많이 접속하는지 확인합니다. (관리자 계정 접속은 집계에서 제외됩니다)</p>
        </div>
    </section>

    <div class="admin-log-toolbar">
        <div class="admin-log-range" role="group" aria-label="조회 기간">
            <button type="button" data-range="1">오늘</button>
            <button type="button" data-range="7" class="is-active">7일</button>
            <button type="button" data-range="30">30일</button>
        </div>
        <span class="admin-log-updated" id="admin-log-updated"></span>
    </div>

    <section class="admin-shell-summary" aria-label="이용 현황 요약">
        <div class="admin-shell-card"><span>오늘 방문자</span><strong id="stat-today-users">-</strong></div>
        <div class="admin-shell-card"><span>일평균 방문자</span><strong id="stat-avg-users">-</strong></div>
        <div class="admin-shell-card is-ok"><span>가장 많이 쓰는 메뉴</span><strong id="stat-top-menu">-</strong></div>
        <div class="admin-shell-card"><span>가장 붐비는 시간대</span><strong id="stat-peak-hour">-</strong></div>
    </section>

    <section class="admin-shell-panel" style="margin-bottom:14px;">
        <div class="admin-shell-panel-head">
            <div><h2>요일 · 시간대별 접속 현황</h2><p>진한 색일수록 접속이 많은 시간대예요.</p></div>
        </div>
        <div class="admin-log-heatmap-wrap">
            <div id="heatmap" class="admin-log-heatmap"></div>
        </div>
    </section>

    <div class="admin-log-grid">
        <section class="admin-shell-panel">
            <div class="admin-shell-panel-head">
                <div><h2>일별 방문자 추이</h2><p>순 방문자수(막대)와 페이지 조회수(선)</p></div>
            </div>
            <div class="admin-log-chart-wrap"><canvas id="chart-daily"></canvas></div>
        </section>
        <section class="admin-shell-panel">
            <div class="admin-shell-panel-head">
                <div><h2>접속 기기</h2></div>
            </div>
            <div class="admin-log-chart-wrap"><canvas id="chart-device"></canvas></div>
        </section>
    </div>

    <section class="admin-shell-panel">
        <div class="admin-shell-panel-head">
            <div><h2>메뉴별 이용 현황</h2><p>기간 내 페이지 이동 기준 TOP 12</p></div>
        </div>
        <div class="admin-log-menu-body">
            <div class="admin-log-chart-wrap admin-log-menu-chart"><canvas id="chart-menu"></canvas></div>
            <div class="admin-shell-table-wrap">
                <table class="admin-shell-table">
                    <thead><tr><th>메뉴</th><th>접속 수</th><th>이용자 수</th></tr></thead>
                    <tbody id="table-menu"></tbody>
                </table>
            </div>
        </div>
    </section>
</main>

<script>
(function () {
    var contextPath = '${pageContext.request.contextPath}';
    var state = { range: 7 };
    var charts = {};
    var WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
    var PALETTE = { teal: '#46d2cd', blue: '#5377f4', amber: '#f0ad4e', purple: '#9b7bf0', gray: '#c3cbd6' };
    var MENU_COLORS = ['#5377f4', '#46d2cd', '#f0ad4e', '#9b7bf0', '#e0616b', '#6fb2e8', '#7bd389', '#f0899b', '#c7a15a', '#8f9bd6', '#54c1a0', '#d68fd6'];

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function fmtNumber(n) { return (n == null ? 0 : n).toLocaleString('ko-KR'); }

    function api(path, params) {
        var url = contextPath + path;
        if (params) {
            var qs = Object.keys(params)
                .filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
                .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
                .join('&');
            if (qs) url += '?' + qs;
        }
        return fetch(url).then(function (res) {
            if (!res.ok) throw new Error('요청 실패: ' + res.status);
            return res.json();
        });
    }

    function renderSummary(data) {
        document.getElementById('stat-today-users').textContent = fmtNumber(data.todayActiveUsers) + '명';
        document.getElementById('stat-avg-users').textContent = fmtNumber(data.avgDailyActiveUsers) + '명';
        document.getElementById('stat-top-menu').textContent = data.topMenuLabel && data.topMenuLabel !== '-' ? (data.topMenuLabel + ' (' + fmtNumber(data.topMenuCount) + ')') : '데이터 없음';
        document.getElementById('stat-peak-hour').textContent = data.peakHourLabel && data.peakHourLabel !== '-' ? (data.peakHourLabel + ' (' + fmtNumber(data.peakHourCount) + '건)') : '데이터 없음';
    }

    function upsertChart(key, ctxId, config) {
        if (charts[key]) charts[key].destroy();
        var el = document.getElementById(ctxId);
        charts[key] = new Chart(el.getContext('2d'), config);
    }

    function renderHeatmap(rows) {
        var el = document.getElementById('heatmap');
        var byKey = {};
        var max = 0;
        rows.forEach(function (r) {
            byKey[r.weekday + '-' + r.hour] = r.count || 0;
            if ((r.count || 0) > max) max = r.count;
        });

        var html = '<div class="admin-log-heatmap-grid">';
        html += '<div class="admin-log-heatmap-corner"></div>';
        for (var h = 0; h < 24; h++) {
            html += '<div class="admin-log-heatmap-hour">' + (h % 3 === 0 ? h : '') + '</div>';
        }
        for (var w = 1; w <= 7; w++) {
            html += '<div class="admin-log-heatmap-day">' + WEEKDAY_LABELS[w - 1] + '</div>';
            for (var hh = 0; hh < 24; hh++) {
                var count = byKey[w + '-' + hh] || 0;
                var opacity = max > 0 ? (0.06 + 0.88 * (count / max)) : 0.06;
                var bg = count > 0 ? ('rgba(83,119,244,' + opacity.toFixed(2) + ')') : '#f3f5f8';
                html += '<div class="admin-log-heatmap-cell" style="background:' + bg + ';" title="' +
                    WEEKDAY_LABELS[w - 1] + '요일 ' + hh + '시 · ' + fmtNumber(count) + '건"></div>';
            }
        }
        html += '</div>';

        if (max === 0) {
            el.innerHTML = '<div class="admin-log-empty">이 기간에는 접속 데이터가 없습니다.</div>';
        } else {
            el.innerHTML = html;
        }
    }

    function renderDailyChart(rows) {
        var labels = rows.map(function (r) { return r.logDate ? r.logDate.slice(5) : ''; });
        upsertChart('daily', 'chart-daily', {
            data: {
                labels: labels,
                datasets: [
                    { type: 'bar', label: '방문자수', data: rows.map(function (r) { return r.activeUsers || 0; }), backgroundColor: 'rgba(83,119,244,.55)', borderRadius: 6, yAxisID: 'y' },
                    { type: 'line', label: '페이지 조회수', data: rows.map(function (r) { return r.pageViews || 0; }), borderColor: PALETTE.amber, backgroundColor: PALETTE.amber, tension: .35, yAxisID: 'y1', pointRadius: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { beginAtZero: true, position: 'left', title: { display: true, text: '방문자수' } },
                    y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '조회수' } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    function renderDeviceChart(rows) {
        upsertChart('device', 'chart-device', {
            type: 'doughnut',
            data: {
                labels: rows.map(function (r) { return r.label; }),
                datasets: [{ data: rows.map(function (r) { return r.count || 0; }), backgroundColor: [PALETTE.blue, PALETTE.teal, PALETTE.gray] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
        });
    }

    function renderMenuChart(rows) {
        upsertChart('menu', 'chart-menu', {
            type: 'bar',
            data: {
                labels: rows.map(function (r) { return r.label; }),
                datasets: [{ data: rows.map(function (r) { return r.count || 0; }), backgroundColor: rows.map(function (r, i) { return MENU_COLORS[i % MENU_COLORS.length]; }), borderRadius: 6 }]
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    function renderMenuTable(rows) {
        var body = document.getElementById('table-menu');
        if (!rows.length) { body.innerHTML = '<tr><td colspan="3" class="admin-log-empty">데이터가 없습니다.</td></tr>'; return; }
        body.innerHTML = rows.map(function (r) {
            return '<tr>' +
                '<td>' + escapeHtml(r.label) + '</td>' +
                '<td>' + fmtNumber(r.count) + '</td>' +
                '<td>' + fmtNumber(r.uniqueUsers) + '명</td>' +
                '</tr>';
        }).join('');
    }

    function loadAll() {
        document.getElementById('admin-log-updated').textContent = '갱신: ' + new Date().toLocaleTimeString('ko-KR');

        api('/admin/logs/summary', { range: state.range }).then(renderSummary).catch(console.error);
        api('/admin/logs/heatmap', { range: state.range }).then(renderHeatmap).catch(console.error);
        api('/admin/logs/daily-active', { range: state.range }).then(renderDailyChart).catch(console.error);
        api('/admin/logs/device-dist', { range: state.range }).then(renderDeviceChart).catch(console.error);
        api('/admin/logs/menu-ranking', { range: state.range, limit: 12 }).then(function (rows) {
            renderMenuChart(rows);
            renderMenuTable(rows);
        }).catch(console.error);
    }

    document.querySelectorAll('.admin-log-range button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            state.range = Number(btn.dataset.range);
            document.querySelectorAll('.admin-log-range button').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
            loadAll();
        });
    });

    loadAll();
})();
</script>
</body>
</html>
