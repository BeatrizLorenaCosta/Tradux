document.addEventListener('DOMContentLoaded', () => {
    // Toggle menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const navUl = document.querySelector('nav ul');
    if (menuToggle && navUl) {
        menuToggle.addEventListener('click', () => {
            navUl.classList.toggle('show');
        });
    }

    document.querySelector('.logo').addEventListener('click', function () {
        // Esconde todas as secções
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('visible');
            sec.classList.add('hidden');
        });

        document.getElementById('home').classList.remove('hidden');

        // Adiciona a classe `visible` para ativar a transição
        requestAnimationFrame(() => {
            document.getElementById('home').classList.add('visible');
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.nav-btn[data-section="home"]').classList.add('active');
    });

    document.querySelectorAll('.redirect').forEach(element => {
        element.addEventListener('click', function () {
            const targetSection = this.dataset.section; // 'login' ou 'signup'

            // Esconde todas as secções
            document.querySelectorAll('.section').forEach(sec => {
                sec.classList.remove('visible');
                sec.classList.add('hidden');
            });

            // Mostra a secção correta com transição suave
            const target = document.getElementById(targetSection);
            target.classList.remove('hidden');

            requestAnimationFrame(() => {
                target.classList.add('visible');
            });

            // Atualiza o botão ativo no menu (se existir um botão para login/signup)
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Ativa o botão correspondente no menu
            const navButton = document.querySelector(`.nav-btn[data-section="${targetSection}"]`);
            if (navButton) {
                navButton.classList.add('active');
            }
        });
    });

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const allSections = document.querySelectorAll('.section');

            // Esconde todas as seções
            allSections.forEach(sec => {
                sec.classList.remove('visible');
                sec.classList.add('hidden');
            });

            // Exibe a seção alvo
            const target = document.getElementById(btn.dataset.section);
            target.classList.remove('hidden');

            // Adiciona a classe `visible` para ativar a transição
            requestAnimationFrame(() => {
                target.classList.add('visible');
            });

            // Atualiza a classe `active` do menu
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Form Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginError = document.getElementById('login-error');
            if (username && password) {
                alert('Login simulado com sucesso!');
            } else {
                loginError.textContent = 'Preencha todos os campos.';
            }
        });
    }

    // Form Signup
    const formSignup = document.getElementById('form-signup');
    if (formSignup) {
        formSignup.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const username = document.getElementById('username-signup').value;
            const password = document.getElementById('password-signup').value;
            const passwordRep = document.getElementById('password-rep').value;
            const signupError = document.getElementById('signup-error');

            if (password !== passwordRep) {
                signupError.textContent = 'As senhas não coincidem.';
                return;
            }
            if (!email.includes('@')) {
                signupError.textContent = 'Email inválido.';
                return;
            }
            alert('Signup simulado com sucesso!');
        });
    }

    // Form Tradução
    const formTraducao = document.getElementById('form-traducao');
    if (formTraducao) {
        formTraducao.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = document.getElementById('documento').files[0];
            const traducaoStatus = document.getElementById('traducao-status');
            if (file && file.type === 'application/pdf') {
                const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
                traducaoStatus.textContent = `Documento selecionado: ${file.name} (${tamanhoMB} MB). Enviando...`;
            } else {
                traducaoStatus.textContent = 'Selecione um PDF válido.';
            }
        });
    }

    // Carrossel
    const slides = document.querySelector('.slides');
    const imagens = document.querySelectorAll('.slides img');
    if (slides && imagens.length > 0) {
        let index = 0;
        setInterval(() => {
            index = (index + 1) % imagens.length;
            slides.style.transform = `translateX(${-index * 100}%)`;
        }, 1000);
    }


    // FUNÇÃO GENÉRICA PARA PAINÉIS COM SIDEBAR (Admin e User)
    document.querySelectorAll('.nav-item[data-section-id]').forEach(item => {
        item.addEventListener('click', function () {
            const sectionId = this.getAttribute('data-section-id');
            const panelType = this.closest('.sidebar').id; // 'adminSidebar' ou 'userSidebar'

            let titleElement, contentSelector, menuSelector;

            if (panelType === 'adminSidebar') {
                titleElement = document.getElementById('adminPageTitle');
                contentSelector = '.admin-page';
                menuSelector = '#adminSidebar .nav-item';
            } else if (panelType === 'userSidebar') {
                titleElement = document.getElementById('userPageTitle');
                contentSelector = '.user-page';
                menuSelector = '#userSidebar .nav-item';
            } else {
                return; // segurança
            }

            // Atualiza o título da página
            if (titleElement) {
                titleElement.textContent = this.textContent.trim();
            }

            // Remove 'active' de todos os itens do menu deste painel
            document.querySelectorAll(menuSelector).forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Esconde todas as páginas deste painel
            document.querySelectorAll(contentSelector).forEach(page => {
                page.style.display = 'none';
            });

            // Mostra a página selecionada
            const targetPage = document.getElementById(sectionId);
            if (targetPage) {
                targetPage.style.display = 'block';
            }
        });
    });

    // TOGGLE SIDEBAR EM MOBILE (funciona para os dois painéis)
    document.querySelectorAll('[id$="MenuToggle"]').forEach(toggle => {
        toggle.addEventListener('click', function () {
            const sidebarId = this.id.replace('MenuToggle', 'Sidebar'); // adminMenuToggle → adminSidebar
            const sidebar = document.getElementById(sidebarId);
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        });
    });

    // LOGOUT ESPECÍFICO DO UTILIZADOR
    document.getElementById('userLogout')?.addEventListener('click', function () {
        // Chama a tua função de logout existente
        sairLogin();

        // Volta para a página inicial (ou login, como preferires)
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('visible');
            sec.classList.add('hidden');
        });

        const homeSection = document.getElementById('home');
        homeSection.classList.remove('hidden');

        requestAnimationFrame(() => {
            homeSection.classList.add('visible');
        });
    });
});
