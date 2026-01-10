document.addEventListener('DOMContentLoaded', () => {
    // Toggle menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const navUl = document.querySelector('nav ul');
    if (menuToggle && navUl) {
        menuToggle.addEventListener('click', () => {
            navUl.classList.toggle('show');
        });
    }

    // Logo → Home
    document.querySelector('.logo')?.addEventListener('click', () => {
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('visible');
            sec.classList.add('hidden');
        });

        const home = document.getElementById('home');
        home.classList.remove('hidden');
        requestAnimationFrame(() => home.classList.add('visible'));

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.nav-btn[data-section="home"]')?.classList.add('active');
    });

    // Botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.section').forEach(sec => {
                sec.classList.remove('visible');
                sec.classList.add('hidden');
            });

            const target = document.getElementById(btn.dataset.section);
            target.classList.remove('hidden');
            requestAnimationFrame(() => target.classList.add('visible'));

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Redirects (login / signup)
    document.querySelectorAll('.redirect').forEach(el => {
        el.addEventListener('click', () => {
            const targetId = el.dataset.section;

            document.querySelectorAll('.section').forEach(sec => {
                sec.classList.remove('visible');
                sec.classList.add('hidden');
            });

            const target = document.getElementById(targetId);
            target.classList.remove('hidden');
            requestAnimationFrame(() => target.classList.add('visible'));
        });
    });

    // Carrossel
    const slides = document.querySelector('.slides');
    const imagens = document.querySelectorAll('.slides img');
    if (slides && imagens.length) {
        let index = 0;
        setInterval(() => {
            index = (index + 1) % imagens.length;
            slides.style.transform = `translateX(${-index * 100}%)`;
        }, 1000);
    }

    // ===================== Menu dinâmico =====================
    const updateNavMenu = () => {
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        // Página atual
        const paginaAtual = window.location.pathname.split('/').pop();

        // Remove links dinâmicos antigos
        nav.querySelectorAll('.dynamic-link').forEach(link => link.remove());

        // Ler utilizador
        const user = JSON.parse(localStorage.getItem('user'));

        // Função helper para criar links com active automático
        const criarLink = (href, texto) => {
            const link = document.createElement('a');
            link.href = href;
            link.textContent = texto;
            link.className = 'nav-btn dynamic-link';

            if (paginaAtual === href) {
                link.classList.add('active');
            }

            return link;
        };

        if (user) {
            // Perfil e Tradução
            nav.appendChild(criarLink('traducao.html', 'Tradução'));
            nav.appendChild(criarLink('perfil.html', 'Perfil'));
            

            // Admin (apenas cargo_id === 1)
            if (user.cargo_id === 1) {
                nav.appendChild(criarLink('admin.html', 'Admin'));
            } el

            // Logout
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.className = 'nav-btn dynamic-link';
            logoutLink.textContent = 'Logout';

            logoutLink.addEventListener('click', e => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login-signup.html';
            });

            nav.appendChild(logoutLink);

        } else {
            // Login & Signup
            nav.appendChild(criarLink('login-signup.html', 'Login & Signup'));
        }
    };

    // Atualiza menu quando a página carrega
    updateNavMenu();
});
