(function () {
    'use strict';

    const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

    function readCookie(name) {
        const prefix = encodeURIComponent(name) + '=';
        const parts = document.cookie ? document.cookie.split(';') : [];
        for (const part of parts) {
            const item = part.trim();
            if (item.indexOf(prefix) === 0) {
                return decodeURIComponent(item.substring(prefix.length));
            }
        }
        return '';
    }

    function csrfToken() {
        return readCookie('XSRF-TOKEN');
    }

    function normalizeMethod(method) {
        return String(method || 'GET').toUpperCase();
    }

    function isUnsafe(method) {
        return !SAFE_METHODS.has(normalizeMethod(method));
    }

    function isSameOrigin(url) {
        if (!url) return true;
        try {
            return new URL(url, window.location.href).origin === window.location.origin;
        } catch (e) {
            return true;
        }
    }

    function addTokenToForm(form) {
        if (!form || !isUnsafe(form.method || 'GET')) return;
        if (!isSameOrigin(form.action || window.location.href)) return;

        const token = csrfToken();
        if (!token) return;

        let input = form.querySelector('input[name="_csrf"]');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_csrf';
            form.appendChild(input);
        }
        input.value = token;
    }

    // 정적/동적 form 모두 submit 직전에 토큰을 넣는다.
    document.addEventListener('submit', function (event) {
        addTokenToForm(event.target);
    }, true);

    // form.submit()은 submit 이벤트를 발생시키지 않으므로 prototype도 감싼다.
    if (window.HTMLFormElement) {
        const originalFormSubmit = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = function () {
            addTokenToForm(this);
            return originalFormSubmit.apply(this, arguments);
        };
    }

    // fetch()를 사용하는 모든 same-origin unsafe 요청에 헤더를 자동 주입한다.
    if (window.fetch) {
        const originalFetch = window.fetch.bind(window);
        window.fetch = function (input, init) {
            const options = Object.assign({}, init || {});
            const requestMethod = options.method || (input instanceof Request ? input.method : 'GET');
            const requestUrl = input instanceof Request ? input.url : String(input || '');

            if (isUnsafe(requestMethod) && isSameOrigin(requestUrl)) {
                const token = csrfToken();
                if (token) {
                    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
                    headers.set('X-XSRF-TOKEN', token);
                    options.headers = headers;
                }
            }
            return originalFetch(input, options);
        };
    }

    // jQuery.ajax 등 XMLHttpRequest 기반 요청도 자동 보호한다.
    if (window.XMLHttpRequest) {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this.__moyoCsrfMethod = normalizeMethod(method);
            this.__moyoCsrfUrl = url;
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function () {
            if (isUnsafe(this.__moyoCsrfMethod) && isSameOrigin(this.__moyoCsrfUrl)) {
                const token = csrfToken();
                if (token) {
                    try { this.setRequestHeader('X-XSRF-TOKEN', token); } catch (e) { /* noop */ }
                }
            }
            return originalSend.apply(this, arguments);
        };
    }

    // redirect가 필요한 POST 동작(삭제/로그아웃 등)을 위한 공통 helper.
    window.moyoPostNavigate = function (url, params) {
        const form = document.createElement('form');
        form.method = 'post';
        form.action = url;
        form.style.display = 'none';

        Object.entries(params || {}).forEach(function (entry) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = entry[0];
            input.value = entry[1] == null ? '' : String(entry[1]);
            form.appendChild(input);
        });

        addTokenToForm(form);
        document.body.appendChild(form);
        form.submit();
    };

    // 기존 GET 로그아웃 링크를 POST + CSRF로 투명하게 전환한다.
    document.addEventListener('click', function (event) {
        const link = event.target.closest('a[href]');
        if (!link) return;
        let path;
        try { path = new URL(link.href, window.location.href).pathname; } catch (e) { return; }
        if (!path.endsWith('/users/logout')) return;

        event.preventDefault();
        window.moyoPostNavigate(link.href, {});
    }, true);
})();
