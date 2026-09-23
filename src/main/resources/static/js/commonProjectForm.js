(function(window, document) {
    'use strict';

    const CHANGE_EVENT = 'moyo:project-form-change';

    function q(root, selector) {
        return root ? root.querySelector(selector) : null;
    }

    function qa(root, selector) {
        return root ? Array.from(root.querySelectorAll(selector)) : [];
    }

    function dispatchChange(root, detail) {
        if (!root) return;
        root.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
            bubbles: true,
            detail: detail || {}
        }));
    }

    function setHiddenValue(root, selector, value) {
        const input = q(root, selector);
        if (!input) return;
        input.value = value == null ? '' : String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function getHiddenValue(root, selector) {
        const input = q(root, selector);
        return input ? String(input.value || '').trim() : '';
    }

    function updatePressed(options, selectedValue, attr) {
        options.forEach(function(button) {
            const value = button.getAttribute(attr);
            const selected = value === selectedValue;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
    }

    function createIconMarkup(iconKey) {
        const safe = String(iconKey || '').replace(/[^a-z0-9-]/gi, '');
        return safe ? '<i class="fa-solid fa-' + safe + '" aria-hidden="true"></i>' : '';
    }

    function syncTypePicker(root, type) {
        const picker = q(root, '[data-project-type-picker]');
        if (!picker) return;

        updatePressed(qa(picker, '[data-project-type]'), type, 'data-project-type');
    }

    function syncRecommendedIcons(root, type) {
        const typeButton = q(root, '[data-project-type="' + CSS.escape(type || '') + '"]');
        const recommended = typeButton
            ? String(typeButton.dataset.projectRecommendedIcons || '').split(',').map(function(value) { return value.trim(); }).filter(Boolean)
            : [];

        qa(root, '[data-project-icon]').forEach(function(button) {
            const icon = button.dataset.projectIcon || '';
            const index = recommended.indexOf(icon);
            button.classList.toggle('is-recommended', index >= 0);
            button.style.order = index >= 0 ? String(index) : '100';
        });
    }

    function syncIconPicker(root, icon) {
        const picker = q(root, '[data-project-icon-picker]');
        if (!picker) return;

        updatePressed(qa(picker, '[data-project-icon]'), icon, 'data-project-icon');

        const current = q(picker, '[data-project-icon-current]');
        if (current) current.innerHTML = createIconMarkup(icon);

        const label = q(picker, '[data-project-icon-current-label]');
        if (label) {
            const selected = q(picker, '[data-project-icon="' + CSS.escape(icon) + '"]');
            label.textContent = selected && selected.dataset.projectIconLabel
                ? selected.dataset.projectIconLabel
                : '선택한 아이콘';
        }
    }

    function setIconOptionsExpanded(root, expanded) {
        const picker = q(root, '[data-project-icon-picker]');
        if (!picker) return;

        const options = q(picker, '[data-project-icon-options]');
        const toggle = q(picker, '[data-project-icon-toggle]');
        if (options) options.hidden = !expanded;
        if (toggle) {
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            const openLabel = toggle.dataset.openLabel || '아이콘 변경';
            const closeLabel = toggle.dataset.closeLabel || '닫기';
            toggle.textContent = expanded ? closeLabel : openLabel;
        }
    }

    function syncPeriodPicker(root, enabled) {
        const picker = q(root, '[data-project-period-picker]');
        if (!picker) return;

        const mode = enabled ? 'Y' : 'N';
        updatePressed(qa(picker, '[data-project-period-mode]'), mode, 'data-project-period-mode');

        const fields = q(picker, '[data-project-period-fields]');
        if (fields) fields.hidden = !enabled;

        const start = q(picker, '[data-project-period-start]');
        const end = q(picker, '[data-project-period-end]');
        [start, end].forEach(function(input) {
            if (!input) return;
            input.disabled = !enabled || root.classList.contains('is-readonly');
        });

        syncPeriodSummary(root);
    }

    function syncPeriodSummary(root) {
        const picker = q(root, '[data-project-period-picker]');
        if (!picker) return;

        const summary = q(picker, '[data-project-period-summary]');
        if (!summary) return;

        const enabled = getHiddenValue(root, '[data-project-period-enabled-input]') === 'Y';
        const start = q(picker, '[data-project-period-start]');
        const end = q(picker, '[data-project-period-end]');
        const startValue = start ? start.value : '';
        const endValue = end ? end.value : '';

        if (!enabled) {
            summary.innerHTML = '<i class="fa-regular fa-calendar" aria-hidden="true"></i><span>기간을 지정하지 않았어요.</span>';
            return;
        }

        if (startValue && endValue) {
            summary.innerHTML = '<i class="fa-regular fa-calendar-check" aria-hidden="true"></i><span>'
                + startValue + ' ~ ' + endValue + '</span>';
            return;
        }

        summary.innerHTML = '<i class="fa-regular fa-calendar" aria-hidden="true"></i><span>시작일과 종료일을 선택하세요.</span>';
    }

    function syncAccessPicker(root, scope) {
        const picker = q(root, '[data-project-access-picker]');
        if (!picker) return;

        updatePressed(qa(picker, '[data-project-access-scope]'), scope, 'data-project-access-scope');
    }

    function syncDescriptionCounter(root) {
        const textarea = q(root, '[data-project-description]');
        const counter = q(root, '[data-project-description-count]');
        if (!textarea || !counter) return;

        const max = Number(textarea.maxLength) > 0 ? Number(textarea.maxLength) : null;
        counter.textContent = max
            ? textarea.value.length + ' / ' + max
            : String(textarea.value.length);
    }

    function clearValidation(root) {
        qa(root, '.moyo-project-form__group.is-invalid').forEach(function(group) {
            group.classList.remove('is-invalid');
        });
        qa(root, '[data-project-form-error]').forEach(function(node) {
            node.textContent = '';
            node.hidden = true;
        });
    }

    function setValidationError(root, key, message) {
        const group = q(root, '[data-project-field="' + key + '"]');
        if (group) group.classList.add('is-invalid');

        const error = q(root, '[data-project-form-error="' + key + '"]');
        if (error) {
            error.textContent = message;
            error.hidden = false;
        }
    }

    function clearFieldValidation(root, key) {
        const group = q(root, '[data-project-field="' + key + '"]');
        if (group) group.classList.remove('is-invalid');
        const error = q(root, '[data-project-form-error="' + key + '"]');
        if (error) {
            error.textContent = '';
            error.hidden = true;
        }
    }

    function validatePeriodField(root) {
        clearFieldValidation(root, 'period');
        const enabled = getHiddenValue(root, '[data-project-period-enabled-input]') === 'Y';
        if (!enabled) return true;

        const start = q(root, '[data-project-period-start]');
        const end = q(root, '[data-project-period-end]');
        const startValue = start ? start.value : '';
        const endValue = end ? end.value : '';
        if (!startValue || !endValue) {
            setValidationError(root, 'period', '시작일과 종료일을 모두 선택해 주세요.');
            return false;
        }
        if (startValue > endValue) {
            setValidationError(root, 'period', '종료일은 시작일보다 빠를 수 없어요.');
            return false;
        }
        return true;
    }

    function validate(root) {
        clearValidation(root);
        const errors = [];

        const name = q(root, '[data-project-name]');
        const nameValue = name ? name.value.trim() : '';
        if (name && !nameValue) {
            errors.push({ key: 'name', message: '프로젝트명을 입력해 주세요.' });
        }
        if (name && nameValue.length > 80) {
            errors.push({ key: 'name', message: '프로젝트명은 80자 이내로 입력해 주세요.' });
        }

        const type = getHiddenValue(root, '[data-project-type-input]');
        if (q(root, '[data-project-type-picker]') && !type) {
            errors.push({ key: 'type', message: '프로젝트 유형을 선택해 주세요.' });
        }

        const icon = getHiddenValue(root, '[data-project-icon-input]');
        if (q(root, '[data-project-icon-picker]') && !icon) {
            errors.push({ key: 'icon', message: '프로젝트 아이콘을 선택해 주세요.' });
        }

        const periodEnabled = getHiddenValue(root, '[data-project-period-enabled-input]') === 'Y';
        if (periodEnabled) {
            const start = q(root, '[data-project-period-start]');
            const end = q(root, '[data-project-period-end]');
            const startValue = start ? start.value : '';
            const endValue = end ? end.value : '';

            if (!startValue || !endValue) {
                errors.push({ key: 'period', message: '기간을 지정하려면 시작일과 종료일을 모두 선택해 주세요.' });
            } else if (startValue > endValue) {
                errors.push({ key: 'period', message: '종료일은 시작일보다 빠를 수 없어요.' });
            }
        }

        const accessPicker = q(root, '[data-project-access-picker]');
        const accessScope = getHiddenValue(root, '[data-project-access-input]');
        if (accessPicker && !accessPicker.hidden && !accessScope) {
            errors.push({ key: 'access', message: '프로젝트 공개 범위를 선택해 주세요.' });
        }

        errors.forEach(function(error) {
            setValidationError(root, error.key, error.message);
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    function getValue(root) {
        const name = q(root, '[data-project-name]');
        const description = q(root, '[data-project-description]');
        const start = q(root, '[data-project-period-start]');
        const end = q(root, '[data-project-period-end]');
        const periodEnabled = getHiddenValue(root, '[data-project-period-enabled-input]') === 'Y';

        return {
            projName: name ? name.value.trim() : '',
            projType: getHiddenValue(root, '[data-project-type-input]'),
            projIcon: getHiddenValue(root, '[data-project-icon-input]'),
            projDesc: description ? description.value.trim() : '',
            periodEnabledYn: periodEnabled ? 'Y' : 'N',
            startDate: periodEnabled && start ? start.value : '',
            endDate: periodEnabled && end ? end.value : '',
            accessScope: getHiddenValue(root, '[data-project-access-input]')
        };
    }

    function setValue(root, value) {
        const next = value || {};
        const name = q(root, '[data-project-name]');
        const description = q(root, '[data-project-description]');
        const start = q(root, '[data-project-period-start]');
        const end = q(root, '[data-project-period-end]');

        if (name && next.projName != null) name.value = next.projName;
        if (description && next.projDesc != null) description.value = next.projDesc;
        if (start && next.startDate != null) start.value = next.startDate;
        if (end && next.endDate != null) end.value = next.endDate;

        if (next.projType != null) {
            setHiddenValue(root, '[data-project-type-input]', next.projType);
            syncTypePicker(root, String(next.projType));
        }
        if (next.projIcon != null) {
            setHiddenValue(root, '[data-project-icon-input]', next.projIcon);
            syncIconPicker(root, String(next.projIcon));
        }
        if (next.periodEnabledYn != null) {
            const enabled = String(next.periodEnabledYn).toUpperCase() === 'Y';
            setHiddenValue(root, '[data-project-period-enabled-input]', enabled ? 'Y' : 'N');
            syncPeriodPicker(root, enabled);
        }
        if (next.accessScope != null) {
            setHiddenValue(root, '[data-project-access-input]', next.accessScope);
            syncAccessPicker(root, String(next.accessScope));
        }

        syncDescriptionCounter(root);
        syncPeriodSummary(root);
    }

    function setReadOnly(root, readOnly) {
        root.classList.toggle('is-readonly', Boolean(readOnly));

        qa(root, '[data-project-type], [data-project-icon], [data-project-icon-toggle], [data-project-period-mode], [data-project-access-scope]').forEach(function(button) {
            button.disabled = Boolean(readOnly);
        });

        qa(root, '[data-project-name], [data-project-description]').forEach(function(field) {
            field.disabled = Boolean(readOnly);
        });

        const periodEnabled = getHiddenValue(root, '[data-project-period-enabled-input]') === 'Y';
        qa(root, '[data-project-period-start], [data-project-period-end]').forEach(function(field) {
            field.disabled = Boolean(readOnly) || !periodEnabled;
        });
    }

    function initialize(root, options) {
        if (!root || root.dataset.commonProjectFormReady === 'true') return root;
        root.dataset.commonProjectFormReady = 'true';
        root.classList.add('moyo-project-form');

        const opts = options || {};

        qa(root, '[data-project-type]').forEach(function(button) {
            button.addEventListener('click', function() {
                if (button.disabled) return;
                const type = button.dataset.projectType || '';
                const defaultIcon = button.dataset.projectDefaultIcon || '';

                setHiddenValue(root, '[data-project-type-input]', type);
                syncTypePicker(root, type);
                syncRecommendedIcons(root, type);

                if (defaultIcon && opts.preserveCustomIconOnTypeChange !== true) {
                    setHiddenValue(root, '[data-project-icon-input]', defaultIcon);
                    syncIconPicker(root, defaultIcon);
                }

                dispatchChange(root, { field: 'projType', value: type });
            });
        });

        const iconToggle = q(root, '[data-project-icon-toggle]');
        if (iconToggle) {
            iconToggle.addEventListener('click', function() {
                if (iconToggle.disabled) return;
                const expanded = iconToggle.getAttribute('aria-expanded') === 'true';
                setIconOptionsExpanded(root, !expanded);
            });
        }

        qa(root, '[data-project-icon]').forEach(function(button) {
            button.addEventListener('click', function() {
                if (button.disabled) return;
                const icon = button.dataset.projectIcon || '';
                setHiddenValue(root, '[data-project-icon-input]', icon);
                syncIconPicker(root, icon);
                setIconOptionsExpanded(root, false);
                dispatchChange(root, { field: 'projIcon', value: icon });
            });
        });

        qa(root, '[data-project-period-mode]').forEach(function(button) {
            button.addEventListener('click', function() {
                if (button.disabled) return;
                const enabled = button.dataset.projectPeriodMode === 'Y';
                setHiddenValue(root, '[data-project-period-enabled-input]', enabled ? 'Y' : 'N');
                syncPeriodPicker(root, enabled);
                validatePeriodField(root);
                dispatchChange(root, { field: 'periodEnabledYn', value: enabled ? 'Y' : 'N' });
            });
        });

        qa(root, '[data-project-period-start], [data-project-period-end]').forEach(function(input) {
            input.addEventListener('change', function() {
                syncPeriodSummary(root);
                validatePeriodField(root);
                dispatchChange(root, { field: input.hasAttribute('data-project-period-start') ? 'startDate' : 'endDate', value: input.value });
            });
        });

        qa(root, '[data-project-access-scope]').forEach(function(button) {
            button.addEventListener('click', function() {
                if (button.disabled) return;
                const scope = button.dataset.projectAccessScope || '';
                setHiddenValue(root, '[data-project-access-input]', scope);
                syncAccessPicker(root, scope);
                dispatchChange(root, { field: 'accessScope', value: scope });
            });
        });

        const description = q(root, '[data-project-description]');
        if (description) {
            description.addEventListener('input', function() {
                syncDescriptionCounter(root);
            });
        }

        qa(root, '[data-project-name], [data-project-description]').forEach(function(field) {
            field.addEventListener('input', function() {
                dispatchChange(root, { field: field.hasAttribute('data-project-name') ? 'projName' : 'projDesc', value: field.value });
            });
        });

        const initialType = getHiddenValue(root, '[data-project-type-input]');
        const initialIcon = getHiddenValue(root, '[data-project-icon-input]');
        const initialPeriod = getHiddenValue(root, '[data-project-period-enabled-input]') === 'Y';
        const initialAccess = getHiddenValue(root, '[data-project-access-input]');

        syncTypePicker(root, initialType);
        syncRecommendedIcons(root, initialType);
        syncIconPicker(root, initialIcon);
        syncPeriodPicker(root, initialPeriod);
        syncAccessPicker(root, initialAccess);
        syncDescriptionCounter(root);
        setIconOptionsExpanded(root, false);

        if (opts.readOnly === true) setReadOnly(root, true);
        return root;
    }

    function initializeAll(selector, options) {
        const target = selector || '[data-project-form-common]';
        return qa(document, target).map(function(root) {
            return initialize(root, options);
        });
    }

    window.MoyoProjectForm = Object.freeze({
        CHANGE_EVENT: CHANGE_EVENT,
        initialize: initialize,
        initializeAll: initializeAll,
        getValue: getValue,
        setValue: setValue,
        setReadOnly: setReadOnly,
        validate: validate,
        clearValidation: clearValidation,
        syncPeriodSummary: syncPeriodSummary
    });
})(window, document);
