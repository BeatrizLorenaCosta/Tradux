document.addEventListener('DOMContentLoaded', () => {
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
});
