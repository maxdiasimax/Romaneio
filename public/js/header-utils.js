document.addEventListener('DOMContentLoaded', () => {
    // Verificar se existe usuário logado
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        // Se não estiver na página de login, redirecionar
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
        return;
    }

    try {
        const user = JSON.parse(userJson);
        
        // Criar elemento de exibição do usuário
        const userDisplay = document.createElement('div');
        userDisplay.className = 'user-header-display';
        
        // Obter iniciais ou imagem padrão
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        
        userDisplay.innerHTML = `
            <div class="user-info-container">
                <div class="user-details">
                    <span class="user-name">${user.name || 'Usuário'}</span>
                    <span class="user-profile">${user.profile || 'Perfil'}</span>
                </div>
                <div class="user-avatar">
                    ${initials}
                </div>
            </div>
        `;

        // Inserir no topo direito do main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            // Verificar se já existe um header ou inserir no topo
            let header = mainContent.querySelector('.table-header');
            if (header) {
                // Se houver header da tabela, adicionamos classe para flex
                header.classList.add('header-with-user');
                header.appendChild(userDisplay);
            } else {
                // Caso contrário, insere no topo do main
                mainContent.insertBefore(userDisplay, mainContent.firstChild);
            }
        }

    } catch (e) {
        console.error('Erro ao processar dados do usuário:', e);
    }
});
