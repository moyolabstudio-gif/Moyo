(function(window, document) {
    'use strict';

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

    function initCalendar(options) {
        options = options || {};

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
        const applyBtn = document.getElementById('applyCalendarAttendeeModal');
        if (!openBtn || !modal || !keyword || !candidatesBox || !selectedBox) return;
        if (modal.dataset.attendeeBound === 'Y') return;
        modal.dataset.attendeeBound = 'Y';

        const selected = new Map();
        const attendeeMemberCache = new Map();
        const attendeeMemberLoading = new Set();
        let activeTab = 'FRIEND';
        let attendeeDetailMode = 'TARGET';
        let cachedCandidates = [];

        function currentUserId() {
            return String(document.getElementById('userId')?.value || document.body?.dataset.userId || options.currentUserId || '').trim();
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
            const name = String(item && item.name || '').trim();
            const affiliation = String(item && item.subText || '').replace(/\s*·\s*(그룹|프로젝트)\s*멤버\s*$/, '').trim();
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
                return '<span class="note-share-chip moyo-attendee-chip ' + attendeeTypeClass(item) + '">'
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
            if (!rows.length) {
                selectedBox.innerHTML = '<div class="note-write-share-empty note-write-share-empty-compact">아직 선택된 참석자가 없습니다.</div>';
                return;
            }
            selectedBox.innerHTML = renderAttendeeChips(rows, true);
            bindAttendeeRemove(selectedBox);
            document.dispatchEvent(new CustomEvent('moyo:attendeesChanged', { detail: { count: rows.length } }));
        }

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
            if (!id || (type !== 'WS' && type !== 'PROJ')) return Promise.resolve([]);
            const key = attendeeMemberCacheKey(type, id);
            if (attendeeMemberCache.has(key)) return Promise.resolve(attendeeMemberCache.get(key) || []);
            if (attendeeMemberLoading.has(key)) {
                return new Promise(function(resolve) {
                    const timer = setInterval(function() {
                        if (!attendeeMemberLoading.has(key)) {
                            clearInterval(timer);
                            resolve(attendeeMemberCache.get(key) || []);
                        }
                    }, 60);
                });
            }
            attendeeMemberLoading.add(key);
            const url = type === 'WS' ? '/workspace/api/members?wsId=' + encodeURIComponent(id) : '/project/api/members?projId=' + encodeURIComponent(id);
            return fetch(url, { credentials: 'same-origin' })
                .then(function(res) { return res.ok ? res.json() : []; })
                .then(function(data) {
                    const list = Array.isArray(data) ? data : (data.members || data.list || []);
                    const sourceLabel = type === 'WS'
                        ? (parent.name || '그룹') + ' · 그룹 멤버'
                        : ((parent.wsName ? parent.wsName + ' · ' : '') + (parent.name || '프로젝트') + ' · 프로젝트 멤버');
                    const normalized = list.map(function(row) { return normalizeMember(row, sourceLabel, parent); }).filter(Boolean);
                    attendeeMemberCache.set(key, normalized);
                    return normalized;
                })
                .catch(function() {
                    attendeeMemberCache.set(key, []);
                    return [];
                })
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
                    const key = String(member.parentType || '') + '_' + String(member.parentId || '') + '_USER_' + String(member.id || '');
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

        function openModal() {
            modal.hidden = false;
            document.body.classList.add('note-share-modal-open');
            keyword.value = '';
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
        function syncAttendeeParentsBeforeClose() {
            const parents = Array.from(selected.values()).filter(function(item) {
                const type = String(item.type || '').toUpperCase();
                return type === 'WS' || type === 'PROJ';
            });
            if (!parents.length) return Promise.resolve();
            if (applyBtn) applyBtn.disabled = true;
            return Promise.all(parents.map(fetchAttendeeMembersForParent)).then(function() {
                renderSelected();
            }).finally(function() {
                if (applyBtn) applyBtn.disabled = false;
            });
        }

        if (applyBtn) applyBtn.addEventListener('click', function() {
            syncAttendeeParentsBeforeClose().then(closeModal);
        });
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

    window.MoyoAttendeeModal = window.MoyoAttendeeModal || {};
    window.MoyoAttendeeModal.initCalendar = initCalendar;
})(window, document);
