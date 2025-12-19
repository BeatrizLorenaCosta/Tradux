document.addEventListener('DOMContentLoaded', () => {
    // Toggle menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const navUl = document.querySelector('nav ul');
    if (menuToggle && navUl) {
        menuToggle.addEventListener('click', () => {
            navUl.classList.toggle('show');
        });
    }

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
});
