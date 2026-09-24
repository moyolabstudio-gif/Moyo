(function(window, document) {
    'use strict';

    function q(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qa(selector, root) {
        return Array.from((root || document).querySelectorAll(selector));
    }

    function normalizeUrl(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        return 'https://' + raw;
    }

    function isValidHttpUrl(value) {
        if (!value) return true;
        try {
            const parsed = new URL(value);
            return /^https?:$/.test(parsed.protocol);
        } catch (e) {
            return false;
        }
    }

    function createLinkList(options) {
        const opts = Object.assign({ max: 5, errorMessage: '링크 주소를 확인해주세요.' }, options || {});
        const list = q(opts.list);
        if (!list) return null;
        const countEl = q(opts.count);
        const emptyEl = q(opts.empty);
        const addButton = q(opts.addButton);
        const errorEl = q(opts.error);

        function rows() { return qa(opts.rowSelector, list); }
        function clearError() {
            if (!errorEl) return;
            errorEl.hidden = true;
            errorEl.textContent = '';
        }
        function update() {
            const count = rows().length;
            if (countEl) countEl.textContent = count + ' / ' + opts.max;
            if (emptyEl) emptyEl.hidden = count > 0;
            if (addButton) {
                addButton.disabled = count >= opts.max;
                addButton.setAttribute('aria-disabled', count >= opts.max ? 'true' : 'false');
            }
        }
        function remove(button) {
            const row = button && button.closest(opts.rowSelector);
            if (row) row.remove();
            clearError();
            update();
        }
        function add(name, url) {
            if (rows().length >= opts.max) return null;
            const row = document.createElement('div');
            row.className = opts.rowClass;

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = opts.nameClass;
            nameInput.maxLength = 50;
            nameInput.placeholder = '링크 이름';
            nameInput.setAttribute('aria-label', '링크 이름');
            nameInput.value = name || '';

            const urlInput = document.createElement('input');
            urlInput.type = 'url';
            urlInput.className = opts.urlClass;
            urlInput.maxLength = 500;
            urlInput.placeholder = 'https://...';
            urlInput.setAttribute('aria-label', '링크 주소');
            urlInput.value = normalizeUrl(url || '');
            urlInput.addEventListener('blur', function() {
                this.value = normalizeUrl(this.value);
                clearError();
            });

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = opts.removeClass;
            removeButton.setAttribute('aria-label', '링크 삭제');
            removeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
            removeButton.addEventListener('click', function() { remove(removeButton); });

            row.append(nameInput, urlInput, removeButton);
            list.appendChild(row);
            clearError();
            update();
            if (!name && !url) nameInput.focus();
            return row;
        }
        function validate() {
            for (const row of rows()) {
                const nameInput = q(opts.nameSelector, row);
                const urlInput = q(opts.urlSelector, row);
                const name = nameInput ? nameInput.value.trim() : '';
                const normalized = normalizeUrl(urlInput ? urlInput.value : '');
                if (urlInput) urlInput.value = normalized;
                if (!name && !normalized) continue;
                if (!isValidHttpUrl(normalized)) {
                    if (errorEl) {
                        errorEl.textContent = opts.errorMessage;
                        errorEl.hidden = false;
                    }
                    if (urlInput) urlInput.focus();
                    return false;
                }
            }
            clearError();
            return true;
        }
        function collect() {
            return rows().map(function(row) {
                const nameInput = q(opts.nameSelector, row);
                const urlInput = q(opts.urlSelector, row);
                return {
                    linkName: nameInput ? nameInput.value.trim() : '',
                    linkUrl: urlInput ? normalizeUrl(urlInput.value) : ''
                };
            }).filter(function(link) { return link.linkName || link.linkUrl; });
        }

        if (addButton && !addButton.dataset.moyoCreateBound) {
            addButton.dataset.moyoCreateBound = 'true';
            addButton.removeAttribute('onclick');
            addButton.addEventListener('click', function() { add(); });
        }
        update();
        return { add, remove, validate, collect, update, clearError, normalizeUrl };
    }

    function bindCounter(input, output) {
        const field = typeof input === 'string' ? q(input) : input;
        const target = typeof output === 'string' ? q(output) : output;
        if (!field || !target) return null;
        const sync = function() { target.textContent = String(field.value.length); };
        field.addEventListener('input', sync);
        sync();
        return { sync };
    }

    function bindSingleSelect(options) {
        const opts = options || {};
        const input = q(opts.input);
        const buttons = qa(opts.buttons);
        if (!input || !buttons.length) return null;
        const attr = opts.dataAttribute || 'data-value';
        function select(value) {
            if (!value) return;
            input.value = value;
            buttons.forEach(function(button) {
                const selected = button.getAttribute(attr) === value;
                button.classList.toggle(opts.selectedClass || 'is-selected', selected);
                button.setAttribute('aria-pressed', selected ? 'true' : 'false');
            });
        }
        buttons.forEach(function(button) {
            button.addEventListener('click', function() { select(button.getAttribute(attr)); });
        });
        select(input.value || opts.defaultValue || '');
        return { select };
    }

    function setVisible(element, visible, display) {
        if (!element) return;
        element.hidden = !visible;
        element.style.display = visible ? (display || 'inline-flex') : 'none';
    }

    function setButtonBusy(button, busy, labels) {
        if (!button) return;
        const opts = labels || {};
        if (!button.dataset.moyoIdleText) button.dataset.moyoIdleText = opts.idle || button.textContent;
        button.disabled = Boolean(busy);
        button.textContent = busy ? (opts.busy || '처리 중...') : (opts.idle || button.dataset.moyoIdleText);
    }

    window.MoyoCreate = Object.freeze({
        normalizeUrl,
        createLinkList,
        bindCounter,
        bindSingleSelect,
        setVisible,
        setButtonBusy
    });
})(window, document);
