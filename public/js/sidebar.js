/* Romaneio – núcleo compartilhado do front-end
 * - Autenticação: injeta o token JWT nas chamadas /api e trata 401
 * - Layout: renderiza sidebar (desktop) / drawer + barra superior (mobile)
 * - Tabelas: wrapper com rolagem + layout em cartões no celular
 * Carregado no <head> de todas as páginas internas.
 */
(function () {
    'use strict';

    // ---------- Utilidades globais ----------
    window.escapeHtml = function (value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    function getUser() {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
    }
    window.getRomaneioUser = getUser;

    function goLogin() {
        localStorage.removeItem('user');
        if (!/(^|\/)(index\.html)?$/.test(window.location.pathname)) {
            window.location.href = 'index.html';
        }
    }

    window.logout = function () {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    };

    // ---------- fetch autenticado ----------
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const isApi = url.startsWith('/api') || url.startsWith(window.location.origin + '/api');
        const isLogin = url.indexOf('/api/login') !== -1;
        if (isApi && !isLogin) {
            const user = getUser();
            init = init ? Object.assign({}, init) : {};
            const headers = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
            if (user && user.token) headers.set('Authorization', 'Bearer ' + user.token);
            init.headers = headers;
            return nativeFetch(input, init).then(function (res) {
                if (res.status === 401) goLogin();
                return res;
            });
        }
        return nativeFetch(input, init);
    };

    // Redireciona imediatamente se não houver sessão
    if (!getUser() || !getUser().token) {
        goLogin();
    }

    // ---------- <head>: viewport, ícones ----------
    (function setupHead() {
        const head = document.head;
        if (!document.querySelector('meta[name="viewport"]')) {
            const m = document.createElement('meta');
            m.name = 'viewport';
            m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
            head.appendChild(m);
        }
        const add = function (rel, href, extra) {
            if (document.querySelector('link[rel="' + rel + '"]')) return;
            const l = document.createElement('link');
            l.rel = rel; l.href = href;
            if (extra) Object.keys(extra).forEach(function (k) { l.setAttribute(k, extra[k]); });
            head.appendChild(l);
        };
        add('icon', 'imagens/favicon-32.png', { type: 'image/png' });
        add('apple-touch-icon', 'imagens/apple-touch-icon.png');
        if (!document.querySelector('meta[name="theme-color"]')) {
            const t = document.createElement('meta');
            t.name = 'theme-color'; t.content = '#0c2559';
            head.appendChild(t);
        }
    })();

    // ---------- Menu ----------
    const MENU = [
        { href: 'dashboard.html', icon: 'fa-tachometer-alt', label: 'Dashboard' },
        { href: 'fazendas.html', icon: 'fa-layer-group', label: 'Fazendas' },
        { href: 'pastos.html', icon: 'fa-seedling', label: 'Pastos' },
        { href: 'bovinos.html', icon: 'fa-paw', label: 'Bovinos' },
        { href: 'manejo.html', icon: 'fa-weight', label: 'Manejo de Pasto' },
        { href: 'historico.html', icon: 'fa-history', label: 'Histórico de Pesos' },
        { href: 'historico_gmp.html', icon: 'fa-chart-line', label: 'Histórico G.M.P' },
        { href: 'vacinas.html', icon: 'fa-syringe', label: 'Vacinas' },
        { href: 'dieta.html', icon: 'fa-utensils', label: 'Dieta' },
        { href: 'perspectiva_peso.html', icon: 'fa-chart-pie', label: 'Perspectiva de Peso' },
        { href: 'baixas.html', icon: 'fa-skull-crossbones', label: 'Baixa de Bois' },
        { href: 'genealogia.html', icon: 'fa-dna', label: 'Genealogia' },
        { href: 'usuarios.html', icon: 'fa-users', label: 'Cadastro de Usuários', adminOnly: true }
    ];

    function currentPage() {
        const p = window.location.pathname.split('/').pop() || 'dashboard.html';
        return p.indexOf('.') === -1 ? p + '.html' : p;
    }

    function initials(name) {
        return (name || 'U').split(/\s+/).filter(Boolean).map(function (n) { return n[0]; }).join('').substring(0, 2).toUpperCase();
    }

    function isMobile() {
        return window.matchMedia('(max-width: 900px)').matches;
    }

    function renderLayout() {
        const sidebar = document.querySelector('.sidebar');
        const container = document.querySelector('.app-container');
        if (!sidebar || !container) return;

        const user = getUser() || {};
        const page = currentPage();
        const isAdmin = user.profile === 'Admin';
        const items = MENU.filter(function (m) { return !m.adminOnly || isAdmin; });
        const activeItem = MENU.find(function (m) { return m.href === page; });

        sidebar.id = 'app-sidebar';
        sidebar.innerHTML =
            '<div class="sidebar-header">' +
                '<a class="sidebar-brand" href="dashboard.html" title="Romaneio – Sistema de Controle">' +
                    '<img src="imagens/logo-app-64.png" alt="Romaneio" width="42" height="42">' +
                    '<span class="sidebar-brand-text"><strong>Romaneio</strong><small>Sistema de controle</small></span>' +
                '</a>' +
                '<button id="sidebar-toggle" class="sidebar-toggle-btn" type="button" aria-label="Alternar menu"><i class="fas fa-bars"></i></button>' +
            '</div>' +
            '<ul class="nav-links">' +
                items.map(function (m) {
                    return '<li><a href="' + m.href + '" title="' + m.label + '"' + (m.href === page ? ' class="active" aria-current="page"' : '') + '>' +
                        '<i class="fas ' + m.icon + '"></i> <span>' + m.label + '</span></a></li>';
                }).join('') +
            '</ul>' +
            '<button class="logout-btn" type="button" id="logout-btn" title="Sair"><i class="fas fa-sign-out-alt"></i> <span>Sair</span></button>';

        // Barra superior + overlay (mobile)
        const topbar = document.createElement('header');
        topbar.className = 'mobile-topbar';
        topbar.innerHTML =
            '<button class="menu-btn" type="button" id="menu-open" aria-label="Abrir menu"><i class="fas fa-bars"></i></button>' +
            '<a class="topbar-brand" href="dashboard.html">' +
                '<img src="imagens/logo-app-64.png" alt="" width="34" height="34">' +
                '<span style="display:flex;flex-direction:column;line-height:1.15;min-width:0">' +
                    '<strong>Romaneio</strong>' +
                    '<span class="topbar-page">' + window.escapeHtml(activeItem ? activeItem.label : 'Sistema de controle') + '</span>' +
                '</span>' +
            '</a>' +
            '<div class="user-avatar" title="' + window.escapeHtml(user.name || '') + '">' + window.escapeHtml(initials(user.name)) + '</div>';
        container.insertBefore(topbar, sidebar);

        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        container.appendChild(overlay);

        function setDrawer(open) {
            sidebar.classList.toggle('open', open);
            overlay.classList.toggle('show', open);
            document.body.classList.toggle('drawer-open', open);
        }

        // Estado recolhido (desktop)
        if (!isMobile() && localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

        document.getElementById('sidebar-toggle').addEventListener('click', function () {
            if (isMobile()) { setDrawer(false); return; }
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });
        document.getElementById('menu-open').addEventListener('click', function () { setDrawer(true); });
        overlay.addEventListener('click', function () { setDrawer(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
        sidebar.addEventListener('click', function (e) {
            if (e.target.closest('a') && isMobile()) setDrawer(false);
        });
        document.getElementById('logout-btn').addEventListener('click', window.logout);
        window.matchMedia('(min-width: 901px)').addEventListener('change', function () { setDrawer(false); });
    }

    // ---------- Tabelas responsivas ----------
    function labelRows(table) {
        const heads = Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
        Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (tr) {
            Array.prototype.forEach.call(tr.children, function (td, i) {
                if (td.tagName !== 'TD' || td.hasAttribute('colspan')) return;
                if (heads[i] && td.getAttribute('data-label') !== heads[i]) td.setAttribute('data-label', heads[i]);
                if (/a[çc][õo]es/i.test(heads[i] || '')) td.classList.add('cell-actions');
            });
        });
    }

    function enhanceTables() {
        Array.prototype.forEach.call(document.querySelectorAll('table'), function (table) {
            if (table.dataset.enhanced) return;
            table.dataset.enhanced = '1';
            table.classList.add('responsive-cards');
            if (!table.parentElement.classList.contains('table-scroll')) {
                const wrap = document.createElement('div');
                wrap.className = 'table-scroll';
                table.parentNode.insertBefore(wrap, table);
                wrap.appendChild(table);
            }
            labelRows(table);
            new MutationObserver(function () { labelRows(table); }).observe(table, { childList: true, subtree: true });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderLayout();
        enhanceTables();
    });
})();
