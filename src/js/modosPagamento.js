const pagamentoData = JSON.parse(localStorage.getItem('pagamento'));
const valor = pagamentoData?.valor || 0;

document.addEventListener('DOMContentLoaded', () => {
    const cartaoElem = document.getElementById('valor-pagar-cartao');
    if (cartaoElem) {
        cartaoElem.textContent = `Total: € ${valor.toFixed(2)}`;
    }

    const mbwayElem = document.getElementById('valor-pagar-mbway');
    if (mbwayElem) {
        mbwayElem.textContent = `Total: € ${valor.toFixed(2)}`;
    }
});

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'login-signup.html';
        return {};
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function fazerPagamento(metodo) {
    const pagamento = JSON.parse(localStorage.getItem('pagamento'));

    fetch('http://localhost:5000/api/recibos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            documentoId: pagamento.id_documento,
            linguaOrigem: pagamento.lingua_origem,
            linguaDestino: pagamento.lingua_destino,
            paginas: pagamento.paginas,
            valor: pagamento.valor
        })
    })
        .then(async res => {
            const text = await res.text();
            console.log('Resposta:', text);
            if (!res.ok) throw new Error(text);
            return JSON.parse(text);
        })
        .then(data => {
            localStorage.setItem('reciboId', data.reciboId);
            localStorage.setItem('metodoPagamento', metodo);

            // Marcar documento como pago
            const pagamento = JSON.parse(localStorage.getItem('pagamento'));
            return fetch(`http://localhost:5000/api/users/documento/${pagamento.id_documento}/marcar-pago`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({})
            }).then(async res => {
                const text = await res.text();
                console.log('Resposta marcar pago:', text, 'Status:', res.status);
                if (!res.ok) {
                    console.warn('Erro ao marcar documento como pago:', text);
                    return null;
                }
                try {
                    return JSON.parse(text);
                } catch {
                    return null;
                }
            });
        })
        .then(() => {
            if (metodo === 'cartao') {
                alert('Pagamento por Cartão efetuado com sucesso!');
            } else if (metodo === 'mbway') {
                alert('Pagamento por MBWay efetuado com sucesso!');
            }
            window.location.href = 'recibo.html';
        })
        .catch(err => {
            console.error('Erro completo:', err);
            alert('Erro: ' + err.message);
        });
}
