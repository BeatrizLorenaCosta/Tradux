document.addEventListener('DOMContentLoaded', () => {
    // Pega o valor guardado
    const valor = Number(localStorage.getItem('valorPagamento')) || 0;

    // Atualiza MB Way se existir
    const mbwayElem = document.getElementById('valor-pagar-mbway');
    if (mbwayElem) mbwayElem.textContent = `Total: € ${valor.toFixed(2)}`;

    // Atualiza Cartão se existir
    const cartaoElem = document.getElementById('valor-pagar-cartao');
    if (cartaoElem) cartaoElem.textContent = `Total: € ${valor.toFixed(2)}`;
});

// Função unificada de simulação de pagamento
function simularPagamento(metodo) {
    const valor = Number(localStorage.getItem('valorPagamento')) || 0;
    alert(`Pagamento de € ${valor.toFixed(2)} com ${metodo} simulado com sucesso! 🎉\nRedirecionando para o recibo...`);
    window.location.href = "recibo.html";
}
