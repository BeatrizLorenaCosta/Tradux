document.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
    const formTraducao = document.getElementById('form-traducao');
    if (!formTraducao) return;

    formTraducao.addEventListener('submit', e => {
        e.preventDefault();
        const file = document.getElementById('documento').files[0];
        const status = document.getElementById('traducao-status');

        if (file && file.type === 'application/pdf') {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            status.textContent = `Documento selecionado: ${file.name} (${sizeMB} MB). Enviando...`;
        } else {
            status.textContent = 'Selecione um PDF válido.';
        }
    });
=======
    // Verifica se existe token (login feito)
    const token = localStorage.getItem('token');

    // Seleciona todos os campos interativos da página
    const elementos = document.querySelectorAll(
        'select, input, button'
    );

    // Se NÃO estiver logado
    if (!token) {
        // Desativar todos os campos
        elementos.forEach(el => {
            el.disabled = true;
            el.style.cursor = 'not-allowed';
            el.style.opacity = '0.6';
        });

        // Criar aviso
        const aviso = document.createElement('div');
        aviso.className = 'alert alert-warning text-center mt-4';
        aviso.innerText = 'É necessário iniciar sessão para usar a tradução.';

        // Mostrar aviso no topo da página
        const main = document.querySelector('main');
        main.prepend(aviso);
    }
>>>>>>> c74f839dab0c9729f301b259d4774058a64d6c99
});
