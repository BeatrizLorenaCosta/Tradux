document.addEventListener('DOMContentLoaded', async () => {
    // Resumo do pagamento
    const pagamentoData = JSON.parse(localStorage.getItem('pagamento'));
    if (pagamentoData) {
        const paginas = Number(pagamentoData.paginas) || '?';
        const valor = Number(pagamentoData.valor) || 0;

        const resumoContainer = document.querySelector('.bg-light');
        resumoContainer.innerHTML = `
            <h5 class="mb-3">Resumo do Serviço</h5>
            <p class="mb-2">Documento: ${pagamentoData.link}</p>
            <p class="mb-2">${paginas} páginas • ${pagamentoData.lingua_origem} → ${pagamentoData.lingua_destino}</p>
            <h3 class="text-primary fw-bold mb-0">Total: € ${valor.toFixed(2)}</h3>
        `;
    }

    // Inicializações gerais
    inicializarSidebar();
    carregarPerfil();
    carregarDocumentos();
    configurarFormularioDados();
    sairLogin();
});

// Funções globais de pagamento
function pagarCartao(valor) {
    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) return alert('Valor inválido');
    localStorage.setItem('valorPagamento', valorNum);
    window.location.href = 'pagamento-cartao.html';
}

function pagarMBWay(valor) {
    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) return alert('Valor inválido');
    localStorage.setItem('valorPagamento', valorNum);
    window.location.href = 'pagamento-mbway.html';
}
