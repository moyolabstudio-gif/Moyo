(() => {
    'use strict';

    const PREVIEW_LIMIT = Number.MAX_SAFE_INTEGER;
    const PAGE_SIZE = 9;

    const normalize = (value) => String(value ?? '').trim().toLowerCase();
    const typeLabels = {
        WORK: '업무',
        DEVELOPMENT: '개발',
        PLANNING: '기획',
        DESIGN: '디자인',
        STUDY: '스터디',
        EXAM: '시험',
        TRAVEL: '여행',
        MEETING: '회의',
        GATHERING: '모임',
        EVENT: '행사',
        EXERCISE: '운동',
        HOBBY: '취미',
        LIFE: '생활',
        RECORD: '기록',
        ETC: '기타'
    };

    const legacyTypeMap = {
        '업무': 'WORK',
        '개발': 'DEVELOPMENT',
        '기획': 'PLANNING',
        '디자인': 'DESIGN',
        '스터디': 'STUDY',
        '공부': 'STUDY',
        '학습·연구': 'STUDY',
        '학습.연구': 'STUDY',
        '학습연구': 'STUDY',
        '시험': 'EXAM',
        '여행': 'TRAVEL',
        '회의': 'MEETING',
        '미팅': 'MEETING',
        '모임': 'GATHERING',
        '모임·행사': 'EVENT',
        '모임.행사': 'EVENT',
        '모임행사': 'EVENT',
        '행사': 'EVENT',
        '운동': 'EXERCISE',
        '취미': 'HOBBY',
        '취미·창작': 'HOBBY',
        '취미.창작': 'HOBBY',
        '취미창작': 'HOBBY',
        '생활': 'LIFE',
        '생활·가정': 'LIFE',
        '생활.가정': 'LIFE',
        '생활가정': 'LIFE',
        '기록': 'RECORD'
    };

    const normalizeType = (value) => {
        const original = String(value ?? '').trim();
        const code = original.toUpperCase().replace(/\s+/g, '');
        if (Object.prototype.hasOwnProperty.call(typeLabels, code)) return code;
        const raw = original.replace(/\s+/g, '');
        return legacyTypeMap[raw] || legacyTypeMap[original] || 'ETC';
    };

    const normalizeAccessState = (value, personalMode) => {
        if (personalMode) return 'MANAGE';
        const state = String(value ?? '').trim().toUpperCase();
        return ['MANAGE', 'PARTICIPANT', 'READ_ONLY', 'LOCKED'].includes(state) ? state : 'LOCKED';
    };

    const accessLabels = {
        MANAGE: '관리',
        PARTICIPANT: '참여 중',
        READ_ONLY: '읽기 전용',
        LOCKED: '참여자 전용'
    };

    document.addEventListener('DOMContentLoaded', () => {
        const body = document.body;
        const personalMode = body.dataset.listMode === 'PERSONAL';
        const tabs = [...document.querySelectorAll('.project-list-tab')];
        const cards = [...document.querySelectorAll('.project-list-item')];
        const sections = [...document.querySelectorAll('.project-status-section')];
        const searchInput = document.getElementById('projectListSearch');
        const sortSelect = document.getElementById('projectListSort');
        const typeSelect = document.getElementById('projectListType');
        const empty = document.getElementById('projectListEmpty');
        const listCard = document.querySelector('.project-list-card');

        if (!sections.length) return;

        const pagination = document.createElement('nav');
        pagination.className = 'project-list-pagination';
        pagination.setAttribute('aria-label', '프로젝트 페이지');
        pagination.hidden = true;
        listCard?.appendChild(pagination);

        cards.forEach((card) => {
            const normalizedType = normalizeType(card.dataset.type);
            card.dataset.typeNormalized = normalizedType;

            const typeBadge = card.querySelector('.project-card-type');
            if (typeBadge) {
                const iconKey = String(card.dataset.icon || 'shapes').trim().toLowerCase();
                typeBadge.innerHTML = '<i class="fa-solid fa-' + iconKey.replace(/[^a-z0-9-]/g, '') + '" aria-hidden="true"></i>' +
                    '<span>' + (typeLabels[normalizedType] || '기타') + '</span>';
            }

            const periodValue = card.querySelector('.project-period-value');
            if (periodValue) {
                const periodEnabled = String(card.dataset.periodEnabled || '').toUpperCase() === 'Y';
                const start = String(card.dataset.start || '').trim();
                const end = String(card.dataset.end || '').trim();
                periodValue.textContent = periodEnabled && start && end ? `${start} ~ ${end}` : '기간 없음';
            }

            const accessState = normalizeAccessState(card.dataset.accessState, personalMode);
            card.dataset.accessState = accessState;
            card.classList.toggle('is-read-only', accessState === 'READ_ONLY');
            card.classList.toggle('is-locked', accessState === 'LOCKED');

            const accessBadge = card.querySelector('.project-access-badge');
            if (accessBadge) {
                accessBadge.textContent = accessLabels[accessState] || '';
                accessBadge.className = 'project-access-badge is-' + accessState.toLowerCase().replace('_', '-');
                accessBadge.hidden = false;
            }

            const link = card.querySelector('.project-list-link');
            const enter = card.querySelector('.project-enter');
            if (accessState === 'LOCKED' || String(card.dataset.canEnter || '').toUpperCase() === 'N') {
                if (link) {
                    link.removeAttribute('href');
                    link.setAttribute('aria-disabled', 'true');
                    link.setAttribute('tabindex', '0');
                    link.addEventListener('click', (event) => event.preventDefault());
                    link.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
                    });
                }
                if (enter) enter.textContent = '참여자만 열 수 있습니다';
            } else if (accessState === 'READ_ONLY') {
                if (enter) enter.textContent = '읽기 전용으로 보기 →';
            }

            const progress = card.querySelector('.project-progress');
            const progressValue = card.querySelector('.project-progress-value');
            const progressFill = card.querySelector('.project-progress-fill');
            const progressEmpty = card.querySelector('.project-progress-empty');
            const taskTotal = Number(card.dataset.taskTotal || 0);
            const rawProgress = card.dataset.progress;
            const progressPercent = rawProgress === '' || rawProgress == null
                ? null
                : Math.max(0, Math.min(100, Number(rawProgress)));

            if (progress) {
                progress.hidden = false;
                if (taskTotal > 0 && Number.isFinite(progressPercent)) {
                    progress.classList.remove('is-empty');
                    if (progressValue) progressValue.textContent = `${Math.round(progressPercent)}%`;
                    if (progressFill) progressFill.style.width = `${progressPercent}%`;
                    if (progressEmpty) progressEmpty.hidden = true;
                    progress.setAttribute('role', 'progressbar');
                    progress.setAttribute('aria-valuemin', '0');
                    progress.setAttribute('aria-valuemax', '100');
                    progress.setAttribute('aria-valuenow', String(Math.round(progressPercent)));
                } else {
                    progress.classList.add('is-empty');
                    progress.removeAttribute('role');
                    progress.removeAttribute('aria-valuemin');
                    progress.removeAttribute('aria-valuemax');
                    progress.removeAttribute('aria-valuenow');
                    if (progressValue) progressValue.textContent = '';
                    if (progressFill) progressFill.style.width = '0%';
                    if (progressEmpty) progressEmpty.hidden = false;
                }
            }

            const memberCell = card.querySelector('.project-member-names');
            if (memberCell) {
                const names = String(card.dataset.members || '').split(',').map((v) => v.trim()).filter((v) => v && v !== '-');
                memberCell.textContent = names.length ? names.join(', ') : '등록된 멤버 없음';
                memberCell.title = names.join(', ');
            }
        });

        let selectedStatus = body.dataset.initialStatus || 'ALL';
        let currentPage = 1;
        const validStatuses = new Set(['ALL', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED']);
        if (!validStatuses.has(selectedStatus)) selectedStatus = 'ALL';

        const dateValue = (value, fallback) => {
            const time = Date.parse(value || '');
            return Number.isNaN(time) ? fallback : time;
        };

        const sortCards = () => {
            const sort = sortSelect?.value || 'DEFAULT';
            sections.forEach((section) => {
                const grid = section.querySelector('.project-list-grid');
                if (!grid) return;
                const sectionCards = [...grid.querySelectorAll('.project-list-item')];
                sectionCards.sort((a, b) => {
                    if (sort === 'NEWEST') return Number(b.dataset.id || 0) - Number(a.dataset.id || 0);
                    if (sort === 'START_ASC') return dateValue(a.dataset.start, Number.MAX_SAFE_INTEGER) - dateValue(b.dataset.start, Number.MAX_SAFE_INTEGER);
                    if (sort === 'END_DESC') return dateValue(b.dataset.end, 0) - dateValue(a.dataset.end, 0);
                    if (sort === 'NAME_ASC') return String(a.dataset.name || '').localeCompare(String(b.dataset.name || ''), 'ko');
                    return 0;
                }).forEach((card) => grid.appendChild(card));
            });
        };

        const getMatchedCards = (section) => {
            const query = normalize(searchInput?.value);
            const selectedType = typeSelect?.value || 'ALL';
            return [...section.querySelectorAll('.project-list-item')].filter((card) => {
                const typeMatch = selectedType === 'ALL' || (card.dataset.typeNormalized || normalizeType(card.dataset.type)) === selectedType;
                const target = (personalMode ? [card.dataset.name, card.dataset.desc] : [card.dataset.name, card.dataset.desc, card.dataset.members]).map(normalize).join(' ');
                return typeMatch && (!query || target.includes(query));
            });
        };

        const renderPagination = (totalItems) => {
            if (!pagination) return;
            const totalPages = Math.ceil(totalItems / PAGE_SIZE);
            pagination.innerHTML = '';
            pagination.hidden = selectedStatus === 'ALL' || totalPages <= 1;
            if (pagination.hidden) return;

            const makeButton = (label, page, disabled = false, active = false) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                button.disabled = disabled;
                button.classList.toggle('is-active', active);
                button.addEventListener('click', () => {
                    currentPage = page;
                    applyFilter();
                    listCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                return button;
            };

            pagination.appendChild(makeButton('‹', Math.max(1, currentPage - 1), currentPage === 1));
            const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
            const end = Math.min(totalPages, Math.max(5, currentPage + 2));
            for (let page = start; page <= end; page += 1) {
                pagination.appendChild(makeButton(String(page), page, false, page === currentPage));
            }
            pagination.appendChild(makeButton('›', Math.min(totalPages, currentPage + 1), currentPage === totalPages));
        };

        const ensureSectionAction = (section, total) => {
            const head = section.querySelector('.project-status-section-head');
            if (!head) return;
            let button = head.querySelector('.project-section-more');
            if (!button) {
                button = document.createElement('button');
                button.type = 'button';
                button.className = 'project-section-more';
                button.addEventListener('click', () => {
                    selectedStatus = section.dataset.sectionStatus;
                    currentPage = 1;
                    applyFilter();
                });
                head.appendChild(button);
            }
            button.textContent = `전체보기 ${total}`;
            button.hidden = selectedStatus !== 'ALL' || total <= PREVIEW_LIMIT;
        };

        const applyFilter = () => {
            let selectedTotal = 0;
            const matchedBySection = new Map(
                sections.map((section) => [section, getMatchedCards(section)])
            );
            const allMatchedTotal = [...matchedBySection.values()]
                .reduce((sum, matched) => sum + matched.length, 0);
            const selectedSection = sections.find(
                (section) => section.dataset.sectionStatus === selectedStatus
            );
            const selectedMatchedTotal = selectedStatus === 'ALL'
                ? allMatchedTotal
                : (matchedBySection.get(selectedSection) || []).length;
            const showGlobalEmpty = selectedMatchedTotal === 0;

            sections.forEach((section) => {
                const sectionStatus = section.dataset.sectionStatus;
                const matched = matchedBySection.get(section) || [];
                const isSelectedSection = selectedStatus === 'ALL' || selectedStatus === sectionStatus;
                const showSection = !showGlobalEmpty && isSelectedSection;

                section.hidden = !showSection;

                const sectionCards = [...section.querySelectorAll('.project-list-item')];
                sectionCards.forEach((card) => { card.hidden = true; });

                const sectionEmpty = section.querySelector('.project-section-empty');
                if (sectionEmpty) sectionEmpty.hidden = true;

                if (!showSection) return;

                let visibleCards;
                if (selectedStatus === 'ALL') {
                    visibleCards = matched.slice(0, PREVIEW_LIMIT);
                    ensureSectionAction(section, matched.length);
                    if (sectionEmpty) sectionEmpty.hidden = matched.length !== 0;
                } else {
                    selectedTotal = matched.length;
                    const totalPages = Math.max(1, Math.ceil(selectedTotal / PAGE_SIZE));
                    if (currentPage > totalPages) currentPage = totalPages;
                    const pageStart = (currentPage - 1) * PAGE_SIZE;
                    visibleCards = matched.slice(pageStart, pageStart + PAGE_SIZE);
                    ensureSectionAction(section, matched.length);
                }

                visibleCards.forEach((card) => { card.hidden = false; });
            });

            tabs.forEach((tab) => {
                tab.classList.toggle('is-active', tab.dataset.status === selectedStatus);
            });

            if (empty) {
                const title = empty.querySelector('strong');
                const description = empty.querySelector('p');
                const hasActiveFilter = Boolean(normalize(searchInput?.value))
                    || (typeSelect?.value || 'ALL') !== 'ALL';
                const allEmptyMessage = cards.length === 0 && !hasActiveFilter
                    ? ['아직 등록된 프로젝트가 없습니다.', '새 프로젝트를 만들어 일정을 시작해보세요.']
                    : ['조건에 맞는 프로젝트가 없습니다.', '검색어나 유형 필터를 변경해보세요.'];
                const messages = {
                    ALL: allEmptyMessage,
                    IN_PROGRESS: ['진행 중인 프로젝트가 없습니다.', '다른 상태를 선택하거나 검색 조건을 변경해보세요.'],
                    SCHEDULED: ['예정된 프로젝트가 없습니다.', '다른 상태를 선택하거나 검색 조건을 변경해보세요.'],
                    COMPLETED: ['완료된 프로젝트가 없습니다.', '다른 상태를 선택하거나 검색 조건을 변경해보세요.']
                };
                const message = messages[selectedStatus] || allEmptyMessage;
                if (title) title.textContent = message[0];
                if (description) description.textContent = message[1];
                empty.hidden = !showGlobalEmpty;
            }

            renderPagination(showGlobalEmpty || selectedStatus === 'ALL' ? 0 : selectedTotal);
        };

        tabs.forEach((tab) => tab.addEventListener('click', () => {
            selectedStatus = tab.dataset.status || 'ALL';
            currentPage = 1;
            applyFilter();
        }));

        if (searchInput && searchInput.dataset.moyoSearchBound !== 'true') {
            searchInput.dataset.moyoSearchBound = 'true';
            let searchTimer = null;
            let composing = false;
            const runSearch = () => {
                window.clearTimeout(searchTimer);
                searchTimer = window.setTimeout(() => {
                    currentPage = 1;
                    applyFilter();
                }, 160);
            };
            searchInput.addEventListener('compositionstart', () => { composing = true; });
            searchInput.addEventListener('compositionend', () => {
                composing = false;
                runSearch();
            });
            searchInput.addEventListener('input', () => {
                if (!composing) runSearch();
            });
        }
        typeSelect?.addEventListener('change', () => { currentPage = 1; applyFilter(); });
        sortSelect?.addEventListener('change', () => { currentPage = 1; sortCards(); applyFilter(); });

        sortCards();
        applyFilter();
    });
})();
