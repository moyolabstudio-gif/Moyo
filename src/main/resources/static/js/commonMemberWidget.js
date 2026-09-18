(function (global) {
    'use strict';

    function esc(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function initial(name) {
        return String(name || '?').trim().substring(0, 1) || '?';
    }

    function isMoyoPersonProfileImage(path) {
        const value = String(path || '').trim();
        return !!value && /(?:^|\/)uploads\/(?:users|workspace)\//i.test(value);
    }

    function applyAvatarImagePolicy(img) {
        if (!img || !img.parentElement) return;
        const avatar = img.parentElement;
        const fallback = avatar.querySelector('.moyo-member-avatar-fallback');

        avatar.classList.remove('is-default-profile', 'is-default');
        avatar.classList.add('has-image');
        avatar.style.backgroundColor = 'transparent';
        avatar.style.backgroundImage = 'none';
        avatar.style.boxShadow = 'none';

        img.style.backgroundColor = 'transparent';
        img.style.backgroundImage = 'none';
        img.classList.remove('is-transparent-image', 'is-contain-image', 'is-cover-image');

        const rawSource = String(img.currentSrc || img.src || '');
        if (!isMoyoPersonProfileImage(rawSource)) {
            handleAvatarError(img);
            return;
        }
        const source = rawSource.toLowerCase();
        const requestedFit = String(img.dataset.fit || '').toLowerCase();
        const isPng = /\.png(?:$|[?#])/.test(source);
        let hasTransparency = false;

        if (requestedFit !== 'cover' && isPng) {
            try {
                const canvas = document.createElement('canvas');
                const size = 28;
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext('2d', { willReadFrequently: true });
                context.clearRect(0, 0, size, size);
                context.drawImage(img, 0, 0, size, size);
                const pixels = context.getImageData(0, 0, size, size).data;
                for (let i = 3; i < pixels.length; i += 4) {
                    if (pixels[i] < 250) {
                        hasTransparency = true;
                        break;
                    }
                }
            } catch (ignore) {
                // 교차 출처 이미지는 픽셀 판독이 막힐 수 있으므로 명시된 fit만 사용한다.
                hasTransparency = requestedFit === 'contain';
            }
        }

        const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        const needsContain = requestedFit === 'contain'
            || (requestedFit !== 'cover' && (hasTransparency || ratio < 0.72 || ratio > 1.38));

        img.classList.add(needsContain ? 'is-contain-image' : 'is-cover-image');
        if (hasTransparency) img.classList.add('is-transparent-image');
        if (fallback) fallback.setAttribute('aria-hidden', 'true');
    }

    function handleAvatarError(img) {
        if (!img || !img.parentElement) return;
        const avatar = img.parentElement;
        const fallback = avatar.querySelector('.moyo-member-avatar-fallback');

        avatar.classList.remove('has-image');
        avatar.classList.add('is-default-profile');
        avatar.style.removeProperty('background-color');
        avatar.style.removeProperty('background-image');
        avatar.style.removeProperty('box-shadow');
        if (fallback) fallback.removeAttribute('aria-hidden');
        img.remove();
    }

    function renderState(listId, message, type) {
        const listEl = document.getElementById(listId);
        if (!listEl) return;
        listEl.innerHTML = '<div class="moyo-member-widget__state moyo-member-widget__state--' + esc(type || 'empty') + '">' + esc(message || '') + '</div>';
    }

    function renderMembers(options) {
        const opts = options || {};
        const listEl = document.getElementById(opts.listId || 'projectMemberList');
        const countEl = document.getElementById(opts.countId || 'projectMemberCount');
        if (!listEl) return;

        const members = Array.isArray(opts.members) ? opts.members : [];
        const displayLimit = Number(opts.displayLimit || 0);
        const visibleMembers = displayLimit > 0 ? members.slice(0, displayLimit) : members;
        if (countEl) countEl.textContent = String(members.length);
        if (!members.length) {
            renderState(opts.listId || 'projectMemberList', opts.emptyText || '참여 중인 멤버가 없습니다.', 'empty');
            return;
        }

        listEl.innerHTML = visibleMembers.map(function (member, index) {
            const rawImage = member.profileImage || '';
            const avatarType = String(member.profileAvatarType || 'DEFAULT').trim().toUpperCase();
            const image = avatarType === 'IMAGE' && isMoyoPersonProfileImage(rawImage) ? rawImage : '';
            const role = member.role || { text: '멤버', className: 'member' };
            const stats = member.stats || { total: 0, todo: 0, progress: 0, done: 0, delay: 0 };
            const avatarFit = String(opts.avatarFit || '').toLowerCase();
            const fitAttr = avatarFit ? ' data-fit="' + esc(avatarFit) + '"' : '';
            const avatar = image
                ? '<img src="' + esc(image) + '" alt="' + esc(member.name) + ' 프로필" loading="lazy" decoding="async"' + fitAttr + ' onload="CommonMemberWidget.applyAvatarImagePolicy(this)" onerror="CommonMemberWidget.handleAvatarError(this)">'
                : '';
            const statsHtml = opts.showStats === false ? ''
                : '<span class="moyo-member-stats" aria-label="멤버 업무 현황">'
                + '<span class="moyo-member-stat total moyo-task-status moyo-task-status--all">전체 ' + Number(stats.total || 0) + '</span>'
                + '<span class="moyo-member-stat todo moyo-task-status moyo-task-status--todo">할 일 ' + Number(stats.todo || 0) + '</span>'
                + '<span class="moyo-member-stat progress moyo-task-status moyo-task-status--progress">진행 ' + Number(stats.progress || 0) + '</span>'
                + '<span class="moyo-member-stat done moyo-task-status moyo-task-status--done">완료 ' + Number(stats.done || 0) + '</span>'
                + '<span class="moyo-member-stat delay moyo-task-status moyo-task-status--delayed">지연 ' + Number(stats.delay || 0) + '</span></span>';

            return '<button type="button" class="moyo-member-card" data-member-index="' + index + '" data-user-id="' + esc(member.userId) + '">'
                + '<span class="moyo-member-top">'
                + '<span class="moyo-member-avatar is-person-avatar ' + (image ? 'has-image' : 'is-default-profile') + '" data-avatar-kind="person">' + avatar
                + '<span class="moyo-member-avatar-fallback">' + esc(initial(member.name)) + '</span></span>'
                + '<span class="moyo-member-main"><span class="moyo-member-name-line">'
                + '<span class="moyo-member-name" title="' + esc(member.name) + '">' + esc(member.name) + '</span>'
                + '<span class="moyo-member-role ' + esc(role.className) + '">' + esc(role.text) + '</span></span>'
                + (member.secondary
                    ? '<span class="moyo-member-position" title="' + esc(member.secondary) + '">' + esc(member.secondary) + '</span>'
                    : (opts.hideEmptySecondary ? '' : '<span class="moyo-member-position empty" title="역할 미지정">역할 미지정</span>'))
                + '</span></span>'
                + statsHtml + '</button>';
        }).join('');

        listEl.onclick = function (event) {
            const button = event.target.closest('[data-member-index]');
            if (!button || !listEl.contains(button)) return;
            const member = visibleMembers[Number(button.dataset.memberIndex)];
            if (member && typeof opts.onSelect === 'function') opts.onSelect(member, event);
        };
    }

    global.CommonMemberWidget = {
        renderMembers: renderMembers,
        renderState: renderState,
        applyAvatarImagePolicy: applyAvatarImagePolicy,
        handleAvatarError: handleAvatarError,
        renderProjectMembers: function (options) {
            const opts = options || {};
            const adapter = global.CommonMemberDataAdapter;
            const members = adapter ? adapter.adaptMembers(opts.members, {
                scope: 'PROJECT', ownerId: opts.leaderId || '', stats: opts.stats || {}
            }) : (opts.members || []);
            renderMembers(Object.assign({}, opts, { members: members, showStats: true }));
        }
    };
})(window);
