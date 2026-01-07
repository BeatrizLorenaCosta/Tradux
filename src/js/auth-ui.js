document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    const btnLogin = document.getElementById('btn-login');
    const btnPerfil = document.getElementById('btn-perfil');

    if (!btnLogin || !btnPerfil) return;

    if (token) {
        // Utilizador logado
        btnLogin.classList.add('d-none');
        btnPerfil.classList.remove('d-none');
    } else {
        // Utilizador não logado
        btnPerfil.classList.add('d-none');
        btnLogin.classList.remove('d-none');
    }
});
