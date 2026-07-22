'use strict';

(function(global) {
    if (global.MoyoProfileUtils) return;

    const DEFAULT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

    function text(value, fallback) {
        const normalized = value == null ? '' : String(value).trim();
        return normalized || (fallback == null ? '' : String(fallback));
    }

    function initial(value, fallback) {
        return text(value, fallback || '?').substring(0, 1);
    }

    function resolvePath(path, contextPath) {
        const rawPath = text(path);
        const base = text(contextPath).replace(/\/$/, '');
        if (!rawPath) return '';
        if (/^(?:https?:|blob:|data:)/i.test(rawPath)) return rawPath;
        if (!base) return rawPath;
        if (rawPath === base || rawPath.startsWith(base + '/')) return rawPath;
        return base + (rawPath.startsWith('/') ? rawPath : '/' + rawPath);
    }

    function clearElement(element, preserve) {
        if (!element) return;
        Array.from(element.childNodes).forEach(function(node) {
            if (preserve && preserve(node)) return;
            node.remove();
        });
    }

    function renderAvatar(element, options) {
        if (!element) return null;
        const config = options || {};
        const src = text(config.src);
        const fallback = initial(config.fallbackText);
        const preserve = typeof config.preserve === 'function' ? config.preserve : null;

        clearElement(element, preserve);
        element.classList.toggle(config.imageClass || 'has-image', Boolean(src));
        element.classList.toggle(config.fallbackClass || 'is-fallback', !src);

        if (!src) {
            element.appendChild(document.createTextNode(fallback));
            return null;
        }

        const image = new Image();
        image.src = src;
        image.alt = config.alt || '프로필';
        image.decoding = 'async';
        image.onload = function() {
            element.classList.add(config.imageClass || 'has-image');
            element.classList.remove(config.fallbackClass || 'is-fallback');
            if (typeof config.onLoad === 'function') config.onLoad(image);
        };
        image.onerror = function() {
            image.remove();
            element.classList.remove(config.imageClass || 'has-image');
            element.classList.add(config.fallbackClass || 'is-fallback');
            clearElement(element, preserve);
            element.appendChild(document.createTextNode(fallback));
            if (typeof config.onError === 'function') config.onError();
        };

        if (config.beforeNode && config.beforeNode.parentElement === element) {
            element.insertBefore(image, config.beforeNode);
        } else {
            element.appendChild(image);
        }
        return image;
    }

    function validateImageFile(file, options) {
        if (!file) return {valid: false, message: '이미지 파일을 선택해주세요.'};
        const config = options || {};
        const types = config.types || DEFAULT_IMAGE_TYPES;
        const maxBytes = Number(config.maxBytes) || 10 * 1024 * 1024;
        if (!types.includes(String(file.type || '').toLowerCase())) {
            return {valid: false, message: config.typeMessage || 'PNG, JPG, WEBP 이미지만 선택할 수 있습니다.'};
        }
        if (file.size > maxBytes) {
            const mb = Math.round(maxBytes / 1024 / 1024);
            return {valid: false, message: config.sizeMessage || ('프로필 이미지는 ' + mb + 'MB 이하만 선택할 수 있습니다.')};
        }
        return {valid: true, message: ''};
    }

    global.MoyoProfileUtils = Object.freeze({
        text: text,
        initial: initial,
        resolvePath: resolvePath,
        renderAvatar: renderAvatar,
        validateImageFile: validateImageFile
    });
})(window);
