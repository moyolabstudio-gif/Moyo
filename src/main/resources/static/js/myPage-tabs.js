(() => {
    const selectProfileTab = tabName => {
        if (!tabName) return;
        document.querySelectorAll('[data-profile-tab]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.profileTab === tabName);
        });
        document.querySelectorAll('[data-profile-panel]').forEach(panel => {
            panel.classList.toggle('is-active', panel.dataset.profilePanel === tabName);
        });
    };

    document.querySelectorAll('[data-profile-tab]').forEach(button => {
        button.addEventListener('click', () => selectProfileTab(button.dataset.profileTab));
    });
})();
