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

function validarPagamentoCartao() {
    const form = document.getElementById('form-cartao');
    const numero = document.getElementById('numeroCartao');
    const validade = document.getElementById('validade');
    const cvv = document.getElementById('cvv');
    const titular = document.getElementById('titular');

    let valido = true;

    // Limpar feedback
    [numero, validade, cvv, titular].forEach(input => {
        input.classList.remove('is-invalid');
    });

    // Número do cartão
    if (!/^\d{16}$/.test(numero.value.replace(/\s/g, ''))) {
        numero.classList.add('is-invalid');
        valido = false;
    }

    // Validade
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(validade.value.trim())) {
        validade.classList.add('is-invalid');
        valido = false;
    }

    // CVV
    if (!/^\d{3,4}$/.test(cvv.value.trim())) {
        cvv.classList.add('is-invalid');
        valido = false;
    }

    // Titular
    if (titular.value.trim().length < 3) {
        titular.classList.add('is-invalid');
        valido = false;
    }

    if (!valido) return; // Para aqui se tiver erro

    // Tudo certo → pagamento simulado
    fazerPagamento('cartao');
}

function validarMBWay() {
    const telefone = document.getElementById('telefoneMB');
    const telLimpo = telefone.value.replace(/\s/g, '');

    // Limpar feedback
    telefone.classList.remove('is-invalid');

    // Verifica se começa com 9 e tem 9 dígitos
    if (!/^9\d{8}$/.test(telLimpo)) {
        telefone.classList.add('is-invalid');
        return;
    }

    // Tudo certo → pagamento simulado
    fazerPagamento('mbway');
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
