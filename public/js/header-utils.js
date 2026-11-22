document.addEventListener('DOMContentLoaded', () => {
    // Verificar se existe usuário logado (sidebar.js já redireciona quando não há sessão)
    const userJson = localStorage.getItem('user');
    if (!userJson) return;

    try {
        const user = JSON.parse(userJson);
        const esc = window.escapeHtml || ((v) => String(v == null ? '' : v));

        const userDisplay = document.createElement('div');
        userDisplay.className = 'user-header-display';

        const initials = user.name
            ? user.name.split(/\s+/).filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';

        userDisplay.innerHTML = `
            <div class="user-info-container">
                <div class="user-details">
                    <span class="user-name">${esc(user.name || 'Usuário')}</span>
                    <span class="user-profile">${esc(user.profile || 'Perfil')}</span>
                </div>
                <div class="user-avatar">${esc(initials)}</div>
            </div>
        `;

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const header = mainContent.querySelector('.table-header');
            if (header) {
                header.classList.add('header-with-user');
                header.appendChild(userDisplay);
            } else {
                mainContent.insertBefore(userDisplay, mainContent.firstChild);
            }
        }
    } catch (e) {
        console.error('Erro ao processar dados do usuário:', e);
    }
});
