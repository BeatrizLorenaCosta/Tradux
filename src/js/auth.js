// URL base da API
const API_URL = 'http://localhost:5000/api/auth';

// ===== LOGIN =====
const loginForm = document.getElementById('form-login');
const loginErrorBox = document.getElementById('login-error');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    loginErrorBox.textContent = '';

    if (!username || !password) {
        loginErrorBox.textContent = 'Preencha todos os campos';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            loginErrorBox.textContent = data.message || 'Erro no login';
            return;
        }

        // Guardar token e dados do user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirecionar para index.html
        window.location.href = '/index.html';

    } catch (err) {
        console.error(err);
        loginErrorBox.textContent = 'Erro ao ligar ao servidor';
    }
});

// ===== SIGNUP =====
const signupForm = document.getElementById('form-signup');
const signupErrorBox = document.getElementById('signup-error');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username-signup').value.trim();
    const password = document.getElementById('password-signup').value;
    const passwordRep = document.getElementById('password-rep').value;
    signupErrorBox.textContent = '';

    if (!nome || !email || !username || !password || !passwordRep) {
        signupErrorBox.textContent = 'Preencha todos os campos';
        return;
    }

    if (password !== passwordRep) {
        signupErrorBox.textContent = 'As passwords não coincidem';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_utilizador: nome, email, username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            signupErrorBox.textContent = data.message || 'Erro no registo';
            return;
        }

        // Mostrar alerta e voltar para login
        alert('Conta criada com sucesso! Faça login.');
        document.querySelector('.auth-wrapper').classList.remove('signup-active');
        signupForm.reset();

    } catch (err) {
        console.error(err);
        signupErrorBox.textContent = 'Erro ao ligar ao servidor';
    }
});
