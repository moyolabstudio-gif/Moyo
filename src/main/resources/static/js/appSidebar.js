(function() {
    'use strict';

    const STORAGE_COLLAPSED = 'moyo.appSidebar.collapsed';
    const STORAGE_OPEN_WS = 'moyo.appSidebar.openWorkspaces';

    function readOpenWorkspaceIds() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_OPEN_WS) || '[]');
            return Array.isArray(value) ? value.map(String) : [];
        } catch (error) {
            return [];
        }
    }

    function saveOpenWorkspaceIds() {
        const ids = Array.from(document.querySelectorAll('.moyo-app-workspace.open'))
            .map(function(item) { return item.dataset.wsId; })
            .filter(Boolean);
        localStorage.setItem(STORAGE_OPEN_WS, JSON.stringify(ids));
    }

    function setDesktopCollapsed(collapsed) {
        document.body.classList.toggle('moyo-app-sidebar-collapsed', collapsed);
        localStorage.setItem(STORAGE_COLLAPSED, collapsed ? 'true' : 'false');
        const button = document.getElementById('moyoAppSidebarToggle');
        if (button) {
            button.setAttribute('aria-expanded', String(!collapsed));
            button.setAttribute('aria-label', collapsed ? '공간 메뉴 열기' : '공간 메뉴 접기');
        }
    }

    function closeMobileSidebar() {
        document.body.classList.remove('moyo-app-sidebar-mobile-open');
    }

    function init() {
        const sidebar = document.getElementById('moyoAppSidebar');
        if (!sidebar) return;

        document.body.classList.add('moyo-app-sidebar-enabled');

        const params = new URLSearchParams(window.location.search);
        const currentPath = window.location.pathname;
        const currentWsId = String(sidebar.dataset.currentWsId || params.get('wsId') || '');
        const currentProjId = String(sidebar.dataset.currentProjId || params.get('projId') || '');
        const openedIds = readOpenWorkspaceIds();

        if (window.innerWidth > 900) {
            setDesktopCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === 'true');
        }

        document.querySelectorAll('.moyo-app-workspace').forEach(function(workspace) {
            const wsId = String(workspace.dataset.wsId || '');
            const shouldOpen = wsId === currentWsId || openedIds.includes(wsId);
            workspace.classList.toggle('open', shouldOpen);
            workspace.classList.toggle('current', wsId === currentWsId);

            const toggle = workspace.querySelector('.moyo-app-workspace-toggle');
            if (!toggle) return;

            toggle.setAttribute('aria-expanded', String(shouldOpen));
            toggle.addEventListener('click', function() {
                workspace.classList.toggle('open');
                toggle.setAttribute('aria-expanded', String(workspace.classList.contains('open')));
                saveOpenWorkspaceIds();
            });
        });

        document.querySelectorAll('.moyo-app-project-link').forEach(function(link) {
            if (currentProjId && String(link.dataset.projId || '') === currentProjId) {
                link.classList.add('active');
                const workspace = link.closest('.moyo-app-workspace');
                if (workspace) {
                    workspace.classList.add('open', 'current');
                    const toggle = workspace.querySelector('.moyo-app-workspace-toggle');
                    if (toggle) toggle.setAttribute('aria-expanded', 'true');
                }
            }
        });

        document.querySelectorAll('.moyo-app-workspace-home').forEach(function(link) {
            const wsId = String(link.dataset.wsId || '');
            if (!currentProjId && currentWsId && wsId === currentWsId && currentPath.startsWith('/workspace/')) {
                link.classList.add('active');
            }
        });

        document.querySelectorAll('.moyo-app-sidebar-main-link').forEach(function(link) {
            const path = link.dataset.appPath;
            if (path && currentPath.startsWith(path)) link.classList.add('active');
        });

        const toggleButton = document.getElementById('moyoAppSidebarToggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', function() {
                if (window.innerWidth <= 900) {
                    document.body.classList.toggle('moyo-app-sidebar-mobile-open');
                    const opened = document.body.classList.contains('moyo-app-sidebar-mobile-open');
                    toggleButton.setAttribute('aria-expanded', String(opened));
                    toggleButton.setAttribute('aria-label', opened ? '공간 메뉴 닫기' : '공간 메뉴 열기');
                } else {
                    setDesktopCollapsed(!document.body.classList.contains('moyo-app-sidebar-collapsed'));
                }
            });
        }

        const backdrop = document.getElementById('moyoAppSidebarBackdrop');
        if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);

        sidebar.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 900) closeMobileSidebar();
            });
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 900) {
                closeMobileSidebar();
                setDesktopCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === 'true');
            } else {
                document.body.classList.remove('moyo-app-sidebar-collapsed');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
