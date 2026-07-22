(() => {
    'use strict';

    const PREVIEW_LIMIT = 6;
    const PAGE_SIZE = 9;

    const normalize = (value) => String(value ?? '').trim().toLowerCase();
    const normalizeType = (value) => {
        const type = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
        const raw = String(value ?? '').trim().replace(/\s+/g, '');
        if (type === 'WORK' || raw === '업무') return 'WORK';
        if (type === 'TRAVEL' || raw === '여행') return 'TRAVEL';
        if (type === 'MEETING' || type === 'EVENT' || type === 'GROUP' || raw === '모임·행사' || raw === '모임.행사' || raw === '모임행사' || raw === '행사') return 'MEETING';
        if (type === 'STUDY' || raw === '학습·연구' || raw === '학습.연구' || raw === '학습연구') return 'STUDY';
        if (type === 'LIFE' || raw === '생활·가정' || raw === '생활.가정' || raw === '생활가정') return 'LIFE';
        if (type === 'HOBBY' || raw === '취미·창작' || raw === '취미.창작' || raw === '취미창작') return 'HOBBY';
        return 'ETC';
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

        const typeLabels = {
            WORK: '업무', TRAVEL: '여행', MEETING: '모임 · 행사',
            STUDY: '학습 · 연구', LIFE: '생활 · 가정', HOBBY: '취미 · 창작', ETC: '기타'
        };

        cards.forEach((card) => {
            const normalizedType = normalizeType(card.dataset.type);
            card.dataset.typeNormalized = normalizedType;
            const badge = card.querySelector('.project-card-type');
            if (badge) badge.textContent = typeLabels[normalizedType] || '기타';

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
            let visibleCount = 0;
            let selectedTotal = 0;

            sections.forEach((section) => {
                const sectionStatus = section.dataset.sectionStatus;
                const matched = getMatchedCards(section);
                const selectedSection = selectedStatus === 'ALL' || selectedStatus === sectionStatus;
                section.hidden = !selectedSection;

                [...section.querySelectorAll('.project-list-item')].forEach((card) => { card.hidden = true; });

                if (!selectedSection) return;

                let visibleCards = matched;
                if (selectedStatus === 'ALL') {
                    visibleCards = matched.slice(0, PREVIEW_LIMIT);
                    ensureSectionAction(section, matched.length);
                } else {
                    selectedTotal = matched.length;
                    const totalPages = Math.max(1, Math.ceil(selectedTotal / PAGE_SIZE));
                    if (currentPage > totalPages) currentPage = totalPages;
                    const start = (currentPage - 1) * PAGE_SIZE;
                    visibleCards = matched.slice(start, start + PAGE_SIZE);
                    ensureSectionAction(section, matched.length);
                }

                visibleCards.forEach((card) => { card.hidden = false; });
                visibleCount += visibleCards.length;

                const sectionEmpty = section.querySelector('.project-section-empty');
                if (sectionEmpty) sectionEmpty.hidden = matched.length !== 0;
            });

            tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.status === selectedStatus));
            if (empty) empty.hidden = selectedStatus === 'ALL' ? visibleCount !== 0 : selectedTotal !== 0;
            renderPagination(selectedStatus === 'ALL' ? 0 : selectedTotal);
        };

        tabs.forEach((tab) => tab.addEventListener('click', () => {
            selectedStatus = tab.dataset.status || 'ALL';
            currentPage = 1;
            applyFilter();
        }));

        searchInput?.addEventListener('input', () => { currentPage = 1; applyFilter(); });
        typeSelect?.addEventListener('change', () => { currentPage = 1; applyFilter(); });
        sortSelect?.addEventListener('change', () => { currentPage = 1; sortCards(); applyFilter(); });

        sortCards();
        applyFilter();
    });
})();
