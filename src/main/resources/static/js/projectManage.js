(() => {
    'use strict';

    const grid = document.getElementById('projectManageGrid');
    const searchInput = document.getElementById('projectManageSearch');
    const statusSelect = document.getElementById('projectManageStatus');
    const sortSelect = document.getElementById('projectManageSort');
    const filteredEmpty = document.getElementById('projectManageFilteredEmpty');

    if (!grid || !searchInput || !statusSelect || !sortSelect || !filteredEmpty) {
        return;
    }

    const cards = Array.from(grid.querySelectorAll('[data-project-card]'));
    const normalize = (value) => String(value || '').trim().toLowerCase();

    const compareText = (a, b) => normalize(a).localeCompare(normalize(b), 'ko');

    function applyFilters() {
        const keyword = normalize(searchInput.value);
        const status = statusSelect.value;
        const sort = sortSelect.value;

        const visible = cards.filter((card) => {
            const searchText = [card.dataset.name, card.dataset.desc, card.dataset.category, card.dataset.categoryLabel]
                .map(normalize)
                .join(' ');
            const matchesKeyword = !keyword || searchText.includes(keyword);
            const matchesStatus = status === 'ALL' || card.dataset.status === status;
            const show = matchesKeyword && matchesStatus;
            card.hidden = !show;
            return show;
        });

        visible.sort((a, b) => {
            if (sort === 'NEWEST') {
                return Number(b.dataset.id || 0) - Number(a.dataset.id || 0);
            }
            if (sort === 'NAME_ASC') {
                return compareText(a.dataset.name, b.dataset.name);
            }
            if (sort === 'END_ASC') {
                const aEnd = a.dataset.end || '9999-12-31';
                const bEnd = b.dataset.end || '9999-12-31';
                return aEnd.localeCompare(bEnd);
            }
            return cards.indexOf(a) - cards.indexOf(b);
        });

        visible.forEach((card) => grid.appendChild(card));
        filteredEmpty.hidden = visible.length > 0 || cards.length === 0;
        grid.hidden = visible.length === 0;
    }

    searchInput.addEventListener('input', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);
})();
