document.addEventListener('DOMContentLoaded', () => {

    const pagamentoData = JSON.parse(localStorage.getItem('pagamento'));
    alert(pagamentoData.nome);
    if (!pagamentoData) {
        alert('Nenhum pagamento selecionado.');
        window.location.href = 'index.html';
        return;
    }

    // Preenche o resumo
    const resumoContainer = document.querySelector('.bg-light');
    const valor = Number(pagamentoData.valor) || 0;
    const paginas = pagamentoData.paginas || '?';
    const nome = pagamentoData.nome || 'desconhecido';
    resumoContainer.innerHTML = `
        <h5 class="mb-3">Resumo do Serviço</h5>
        <p class="mb-2">Documento: ${nome}</p>
        <p class="mb-2">${paginas} páginas • ${pagamentoData.lingua_origem} → ${pagamentoData.lingua_destino}</p>
        <h3 class="text-primary fw-bold mb-0">Total: € ${valor.toFixed(2)}</h3>
    `;

    // Ligar os botões ao valor do pagamento
    document.getElementById('btn-pagar-cartao').addEventListener('click', () => {
        localStorage.setItem('valorPagamento', valor);
        window.location.href = 'pagamento-cartao.html';
    });

    document.getElementById('btn-pagar-mbway').addEventListener('click', () => {
        localStorage.setItem('valorPagamento', valor);
        window.location.href = 'pagamento-mbway.html';

});
