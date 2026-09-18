(function (window, document) {
    'use strict';

    if (window.MoyoProjectPlanLoader) return;

    const SCRIPT_PATHS = [
        '/js/projectPlanCommon.js?v=plan-detail-state-v3',
        '/js/projectScheduleGrid.js?v=schedule-grid-common-v2',
        '/js/projectPeriodPlan.js?v=plan-today-focus-v3',
        '/js/projectPlanModal.js?v=time-plan-picker-bound-color-v1',
        '/js/projectTimeSchedule.js?v=plan-detail-author-v1',
        '/js/projectWeeklyPlan.js?v=plan-detail-author-v1',
        '/js/projectTimeline.js?v=plan-detail-author-v1'
    ];

    let loadPromise = null;

    function contextPath() {
        const bodyPath = document.body && document.body.dataset
            ? String(document.body.dataset.contextPath || '')
            : '';
        if (bodyPath) return bodyPath.replace(/\/$/, '');

        const configPath = window.PROJECT_MAIN_CONFIG
            ? String(window.PROJECT_MAIN_CONFIG.contextPath || '')
            : '';
        return configPath.replace(/\/$/, '');
    }

    function loadScript(path) {
        const fullPath = contextPath() + path;
        const existing = Array.from(document.scripts).find(function (script) {
            return script.src && script.src.indexOf(path.split('?')[0]) !== -1;
        });
        if (existing) {
            if (existing.dataset.moyoLoaded === 'true') return Promise.resolve();
            return new Promise(function (resolve, reject) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
            });
        }

        return new Promise(function (resolve, reject) {
            const script = document.createElement('script');
            script.src = fullPath;
            script.async = false;
            script.dataset.moyoProjectPlan = 'true';
            script.addEventListener('load', function () {
                script.dataset.moyoLoaded = 'true';
                resolve();
            }, { once: true });
            script.addEventListener('error', function () {
                reject(new Error('프로젝트 계획 스크립트를 불러오지 못했습니다: ' + path));
            }, { once: true });
            document.head.appendChild(script);
        });
    }

    function load() {
        if (loadPromise) return loadPromise;

        loadPromise = SCRIPT_PATHS.reduce(function (promise, path) {
            return promise.then(function () {
                return loadScript(path);
            });
        }, Promise.resolve()).catch(function (error) {
            loadPromise = null;
            throw error;
        });

        return loadPromise;
    }

    function loadWhenIdle() {
        return new Promise(function (resolve, reject) {
            const start = function () {
                load().then(resolve).catch(reject);
            };
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(start, { timeout: 800 });
            } else {
                window.setTimeout(start, 120);
            }
        });
    }

    window.MoyoProjectPlanLoader = {
        load: load,
        loadWhenIdle: loadWhenIdle
    };
})(window, document);
